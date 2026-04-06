"""Backfill performance metrics from Yahoo Finance into the existing performance table."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Callable, Iterable
import sys

import pandas as pd
from sqlalchemy import or_
from sqlalchemy.orm import Session

from api.models import Idea, Performance


HistoryFetcher = Callable[[str, pd.Timestamp, pd.Timestamp], pd.DataFrame]

PERFORMANCE_TARGETS: dict[str, pd.DateOffset] = {
    "oneWeekClosePerf": pd.DateOffset(weeks=1),
    "twoWeekClosePerf": pd.DateOffset(weeks=2),
    "oneMonthPerf": pd.DateOffset(months=1),
    "threeMonthPerf": pd.DateOffset(months=3),
    "sixMonthPerf": pd.DateOffset(months=6),
    "oneYearPerf": pd.DateOffset(years=1),
    "twoYearPerf": pd.DateOffset(years=2),
    "threeYearPerf": pd.DateOffset(years=3),
    "fiveYearPerf": pd.DateOffset(years=5),
}

MAX_LOOKAHEAD_BUFFER = pd.Timedelta(days=14)
YAHOO_HISTORY_TIMEOUT_SECONDS = 8


def _latest_needed_timestamp(idea_at: datetime) -> pd.Timestamp:
    """Return the furthest date we need to fetch for a given idea."""
    base = pd.Timestamp(idea_at).normalize()
    return base + PERFORMANCE_TARGETS["fiveYearPerf"] + MAX_LOOKAHEAD_BUFFER


@dataclass(frozen=True)
class IdeaSnapshot:
    """The minimum idea data needed to compute performance."""

    idea_id: str
    ticker: str
    idea_at: datetime


@dataclass
class BackfillStats:
    """Operational summary for a backfill run."""

    ideas_considered: int = 0
    ideas_updated: int = 0
    ideas_skipped: int = 0
    tickers_attempted: int = 0
    tickers_matched: int = 0
    unresolved_tickers: dict[str, str] = field(default_factory=dict)
    resolved_tickers: dict[str, str] = field(default_factory=dict)

    def as_dict(self) -> dict[str, object]:
        """Return a JSON-serializable summary."""
        return asdict(self)


@dataclass(frozen=True)
class RefreshResult:
    """Outcome of a single-idea Yahoo Finance refresh attempt."""

    idea_id: str
    requested_ticker: str
    resolved_ticker: str | None
    metrics: dict[str, float | None] | None
    error: str | None = None


def import_yfinance():
    """Import yfinance, falling back to the vendored copy in this repository."""
    try:
        import yfinance as yf  # type: ignore

        return yf
    except ImportError:
        vendor_root = Path(__file__).resolve().parents[2] / "yfinance"
        if str(vendor_root) not in sys.path:
            sys.path.insert(0, str(vendor_root))
        import yfinance as yf  # type: ignore

        return yf


def normalize_ticker_candidates(ticker: str) -> list[str]:
    """Return likely Yahoo Finance ticker variants for a stored symbol."""
    cleaned = ticker.strip().upper()
    normalized = cleaned.replace(".", "-").replace("/", "-").replace(" ", "")

    candidates: list[str] = []
    for candidate in (cleaned, normalized):
        if candidate and candidate not in candidates:
            candidates.append(candidate)

    return candidates


def _normalize_history_index(history: pd.DataFrame) -> pd.DataFrame:
    """Normalize history index to naive timestamps sorted ascending."""
    if history.empty:
        return history

    normalized = history.sort_index().copy()
    index = pd.to_datetime(normalized.index)
    if getattr(index, "tz", None) is not None:
        index = index.tz_convert(None)
    normalized.index = index
    normalized = normalized[~normalized.index.duplicated(keep="first")]
    return normalized


def first_row_on_or_after(history: pd.DataFrame, target: pd.Timestamp) -> pd.Series | None:
    """Return the first trading row on or after the requested date."""
    normalized = _normalize_history_index(history)
    if normalized.empty:
        return None

    index = normalized.index
    position = index.searchsorted(target.normalize(), side="left")
    if position >= len(normalized):
        return None

    return normalized.iloc[position]


def _safe_float(value: object) -> float | None:
    if value is None or pd.isna(value):
        return None
    return float(value)


def compute_performance_row(history: pd.DataFrame, idea_at: datetime) -> dict[str, float | None] | None:
    """Compute performance ratios from the first trading day after an idea was posted."""
    normalized = _normalize_history_index(history)
    if normalized.empty:
        return None

    anchor = pd.Timestamp(idea_at).normalize() + pd.DateOffset(days=1)
    baseline = first_row_on_or_after(normalized, anchor)
    if baseline is None:
        return None

    next_day_close = _safe_float(baseline.get("Close"))
    if next_day_close is None or next_day_close <= 0:
        return None

    metrics: dict[str, float | None] = {
        "nextDayOpen": _safe_float(baseline.get("Open")),
        "nextDayClose": next_day_close,
    }

    for field_name, offset in PERFORMANCE_TARGETS.items():
        target_row = first_row_on_or_after(normalized, pd.Timestamp(idea_at).normalize() + offset)
        target_close = _safe_float(target_row.get("Close")) if target_row is not None else None
        metrics[field_name] = (target_close / next_day_close) if target_close is not None else None

    return metrics


def fetch_history_for_ticker(
    ticker: str,
    earliest_needed: pd.Timestamp,
    latest_needed: pd.Timestamp,
    fetcher: HistoryFetcher | None = None,
) -> pd.DataFrame:
    """Fetch daily price history for a ticker."""
    if fetcher is not None:
        return _normalize_history_index(fetcher(ticker, earliest_needed, latest_needed))

    yf = import_yfinance()
    history = yf.Ticker(ticker).history(
        start=earliest_needed.date().isoformat(),
        end=(latest_needed + pd.DateOffset(days=1)).date().isoformat(),
        interval="1d",
        auto_adjust=False,
        actions=False,
        timeout=YAHOO_HISTORY_TIMEOUT_SECONDS,
    )
    return _normalize_history_index(history)


def fetch_first_available_history(
    ticker: str,
    earliest_needed: pd.Timestamp,
    latest_needed: pd.Timestamp,
    fetcher: HistoryFetcher | None = None,
) -> tuple[str | None, pd.DataFrame]:
    """Try Yahoo-style ticker variants until one returns data."""
    for candidate in normalize_ticker_candidates(ticker):
        history = fetch_history_for_ticker(candidate, earliest_needed, latest_needed, fetcher=fetcher)
        if not history.empty:
            return candidate, history
    return None, pd.DataFrame()


def load_candidate_ideas(
    session: Session,
    *,
    ticker: str | None = None,
    idea_id: str | None = None,
    limit: int | None = None,
    only_missing: bool = True,
) -> list[IdeaSnapshot]:
    """Load ideas that should be enriched."""
    query = session.query(Idea.id, Idea.company_id, Idea.date).filter(
        Idea.company_id.isnot(None),
        Idea.date.isnot(None),
    )

    if only_missing:
        query = query.outerjoin(Performance, Performance.idea_id == Idea.id).filter(
            or_(Performance.idea_id.is_(None), Performance.oneYearPerf.is_(None))
        )

    if ticker:
        query = query.filter(Idea.company_id == ticker)
    if idea_id:
        query = query.filter(Idea.id == idea_id)

    query = query.order_by(Idea.date.asc())
    if limit is not None:
        query = query.limit(limit)

    return [
        IdeaSnapshot(idea_id=row.id, ticker=row.company_id, idea_at=row.date)
        for row in query.all()
    ]


def upsert_performance(session: Session, idea_id: str, metrics: dict[str, float | None]) -> None:
    """Insert or update an existing performance row."""
    performance = session.query(Performance).filter(Performance.idea_id == idea_id).first()
    if performance is None:
        performance = Performance(idea_id=idea_id, **metrics)
        session.add(performance)
        return

    for field_name, value in metrics.items():
        setattr(performance, field_name, value)


def _group_ideas_by_ticker(ideas: Iterable[IdeaSnapshot]) -> dict[str, list[IdeaSnapshot]]:
    grouped: dict[str, list[IdeaSnapshot]] = {}
    for snapshot in ideas:
        grouped.setdefault(snapshot.ticker, []).append(snapshot)
    return grouped


def backfill_performance(
    session: Session,
    *,
    fetcher: HistoryFetcher | None = None,
    ticker: str | None = None,
    idea_id: str | None = None,
    limit: int | None = None,
    only_missing: bool = True,
    dry_run: bool = False,
) -> BackfillStats:
    """Populate or refresh performance rows using Yahoo Finance history."""
    ideas = load_candidate_ideas(
        session,
        ticker=ticker,
        idea_id=idea_id,
        limit=limit,
        only_missing=only_missing,
    )

    stats = BackfillStats(ideas_considered=len(ideas))
    if not ideas:
        return stats

    for stored_ticker, ticker_ideas in _group_ideas_by_ticker(ideas).items():
        stats.tickers_attempted += 1

        earliest_needed = pd.Timestamp(min(item.idea_at for item in ticker_ideas)).normalize() - pd.DateOffset(days=7)
        latest_needed = _latest_needed_timestamp(max(item.idea_at for item in ticker_ideas))

        resolved_ticker, history = fetch_first_available_history(
            stored_ticker,
            earliest_needed,
            latest_needed,
            fetcher=fetcher,
        )

        if resolved_ticker is None or history.empty:
            stats.unresolved_tickers[stored_ticker] = "No Yahoo Finance history returned"
            stats.ideas_skipped += len(ticker_ideas)
            continue

        stats.tickers_matched += 1
        stats.resolved_tickers[stored_ticker] = resolved_ticker

        for snapshot in ticker_ideas:
            metrics = compute_performance_row(history, snapshot.idea_at)
            if metrics is None:
                stats.ideas_skipped += 1
                continue

            if not dry_run:
                upsert_performance(session, snapshot.idea_id, metrics)
            stats.ideas_updated += 1

        if not dry_run:
            session.commit()

    return stats


def refresh_idea_performance(
    session: Session,
    *,
    idea_id: str,
    fetcher: HistoryFetcher | None = None,
    persist: bool = True,
) -> RefreshResult | None:
    """Refresh a single idea's performance from Yahoo Finance."""
    ideas = load_candidate_ideas(
        session,
        idea_id=idea_id,
        limit=1,
        only_missing=False,
    )
    if not ideas:
        return None

    snapshot = ideas[0]
    earliest_needed = pd.Timestamp(snapshot.idea_at).normalize() - pd.DateOffset(days=7)
    latest_needed = _latest_needed_timestamp(snapshot.idea_at)

    resolved_ticker, history = fetch_first_available_history(
        snapshot.ticker,
        earliest_needed,
        latest_needed,
        fetcher=fetcher,
    )
    if resolved_ticker is None or history.empty:
        return RefreshResult(
            idea_id=snapshot.idea_id,
            requested_ticker=snapshot.ticker,
            resolved_ticker=None,
            metrics=None,
            error="No Yahoo Finance history returned",
        )

    metrics = compute_performance_row(history, snapshot.idea_at)
    if metrics is None:
        return RefreshResult(
            idea_id=snapshot.idea_id,
            requested_ticker=snapshot.ticker,
            resolved_ticker=resolved_ticker,
            metrics=None,
            error="Unable to compute performance from returned history",
        )

    if persist:
        upsert_performance(session, snapshot.idea_id, metrics)
        session.commit()

    return RefreshResult(
        idea_id=snapshot.idea_id,
        requested_ticker=snapshot.ticker,
        resolved_ticker=resolved_ticker,
        metrics=metrics,
    )
