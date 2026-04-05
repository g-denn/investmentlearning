"""CLI entrypoint for backfilling performance metrics from Yahoo Finance."""

from __future__ import annotations

import argparse
import json

from sqlalchemy.orm import Session

from api.database.connection import engine
from api.services.performance_backfill import backfill_performance


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Backfill performance metrics in Postgres using Yahoo Finance history.",
    )
    parser.add_argument("--ticker", help="Restrict the run to a single stored ticker")
    parser.add_argument("--idea-id", help="Restrict the run to a single idea id")
    parser.add_argument("--limit", type=int, help="Limit the number of ideas considered")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Refresh existing rows instead of only filling gaps",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute results without writing to the database",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()

    with Session(engine) as session:
        stats = backfill_performance(
            session,
            ticker=args.ticker,
            idea_id=args.idea_id,
            limit=args.limit,
            only_missing=not args.force,
            dry_run=args.dry_run,
        )

    print(json.dumps(stats.as_dict(), indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

