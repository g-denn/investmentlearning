"""Unit tests for Yahoo Finance performance backfill logic."""

from datetime import datetime
import uuid

import pandas as pd

from api.services.performance_backfill import (
    backfill_performance,
    compute_performance_row,
    fetch_history_for_ticker,
    normalize_ticker_candidates,
    YAHOO_HISTORY_TIMEOUT_SECONDS,
)
from ValueInvestorsClub.ValueInvestorsClub.models.Company import Company
from ValueInvestorsClub.ValueInvestorsClub.models.Idea import Idea
from ValueInvestorsClub.ValueInvestorsClub.models.Performance import Performance
from ValueInvestorsClub.ValueInvestorsClub.models.User import User


def make_history() -> pd.DataFrame:
    index = pd.to_datetime(
        [
            "2024-01-02",
            "2024-01-03",
            "2024-01-09",
            "2024-01-16",
            "2024-02-05",
            "2024-04-02",
            "2024-07-02",
            "2025-01-02",
            "2026-01-02",
            "2027-01-04",
            "2029-01-02",
        ]
    )
    return pd.DataFrame(
        {
            "Open": [10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0],
            "Close": [10.5, 11.0, 12.1, 13.2, 14.3, 15.4, 16.5, 17.6, 18.7, 19.8, 20.9],
        },
        index=index,
    )


def test_normalize_ticker_candidates_handles_yahoo_share_classes():
    assert normalize_ticker_candidates("BRK.B") == ["BRK.B", "BRK-B"]
    assert normalize_ticker_candidates("RDS/A") == ["RDS/A", "RDS-A"]


def test_compute_performance_row_uses_first_available_trading_day():
    history = make_history()

    metrics = compute_performance_row(history, datetime(2024, 1, 1, 13, 0, 0))

    assert metrics is not None
    assert metrics["nextDayOpen"] == 10.0
    assert metrics["nextDayClose"] == 10.5
    assert metrics["oneWeekClosePerf"] == 12.1 / 10.5
    assert metrics["twoWeekClosePerf"] == 13.2 / 10.5
    assert metrics["oneMonthPerf"] == 14.3 / 10.5
    assert metrics["threeMonthPerf"] == 15.4 / 10.5
    assert metrics["sixMonthPerf"] == 16.5 / 10.5
    assert metrics["oneYearPerf"] == 17.6 / 10.5
    assert metrics["twoYearPerf"] == 18.7 / 10.5
    assert metrics["threeYearPerf"] == 19.8 / 10.5
    assert metrics["fiveYearPerf"] == 20.9 / 10.5


def test_backfill_performance_inserts_missing_row(db_session):
    company = Company(ticker="AAPL", company_name="Apple Inc.")
    user = User(username="Buffett", user_link="vic://buffett")
    idea = Idea(
        id=str(uuid.uuid4()),
        link="https://example.com/idea",
        company_id=company.ticker,
        user_id=user.user_link,
        date=datetime(2024, 1, 1, 12, 0, 0),
        is_short=False,
        is_contest_winner=False,
    )
    db_session.add_all([company, user, idea])
    db_session.commit()

    def fetcher(ticker: str, _start: pd.Timestamp, _end: pd.Timestamp) -> pd.DataFrame:
        assert ticker == "AAPL"
        return make_history()

    stats = backfill_performance(db_session, fetcher=fetcher)

    stored = db_session.query(Performance).filter(Performance.idea_id == idea.id).one()
    assert stats.ideas_considered == 1
    assert stats.ideas_updated == 1
    assert stats.ideas_skipped == 0
    assert stored.oneYearPerf == 17.6 / 10.5


def test_backfill_performance_skips_filled_rows_by_default(db_session):
    company = Company(ticker="MSFT", company_name="Microsoft")
    user = User(username="Munger", user_link="vic://munger")
    idea = Idea(
        id=str(uuid.uuid4()),
        link="https://example.com/idea-2",
        company_id=company.ticker,
        user_id=user.user_link,
        date=datetime(2024, 1, 1, 12, 0, 0),
        is_short=False,
        is_contest_winner=False,
    )
    performance = Performance(
        idea_id=idea.id,
        nextDayOpen=9.0,
        nextDayClose=9.5,
        oneWeekClosePerf=1.0,
        twoWeekClosePerf=1.0,
        oneMonthPerf=1.0,
        threeMonthPerf=1.0,
        sixMonthPerf=1.0,
        oneYearPerf=1.0,
        twoYearPerf=1.0,
        threeYearPerf=1.0,
        fiveYearPerf=1.0,
    )
    db_session.add_all([company, user, idea, performance])
    db_session.commit()

    def fetcher(_ticker: str, _start: pd.Timestamp, _end: pd.Timestamp) -> pd.DataFrame:
        raise AssertionError("filled rows should not be refetched unless force=True")

    stats = backfill_performance(db_session, fetcher=fetcher)

    stored = db_session.query(Performance).filter(Performance.idea_id == idea.id).one()
    assert stats.ideas_considered == 0
    assert stored.oneYearPerf == 1.0


def test_fetch_history_for_ticker_sets_a_request_timeout(monkeypatch):
    recorded: dict[str, object] = {}

    class FakeTicker:
        def __init__(self, ticker: str):
            recorded["ticker"] = ticker

        def history(self, **kwargs):
            recorded.update(kwargs)
            return make_history()

    class FakeYFinance:
        @staticmethod
        def Ticker(ticker: str) -> FakeTicker:
            return FakeTicker(ticker)

    monkeypatch.setattr("api.services.performance_backfill.import_yfinance", lambda: FakeYFinance)

    history = fetch_history_for_ticker(
        "AAPL",
        pd.Timestamp("2024-01-01"),
        pd.Timestamp("2024-02-01"),
    )

    assert not history.empty
    assert recorded["ticker"] == "AAPL"
    assert recorded["timeout"] == YAHOO_HISTORY_TIMEOUT_SECONDS
