#!/usr/bin/env python3
"""Collect ArtOfWalks outreach leads: large, well-photographed Airbnb homes
whose host or manager has a reachable phone number.

    pip install -r requirements.txt
    scrapling install          # one-off: fetches the patched browser
    python run.py              # writes out/artofwalks-leads.csv + .xlsx

The run is resumable. Every page is cached in out/cache.sqlite3, so stopping it
with Ctrl-C and starting again picks up where it left off.
"""

import argparse
import logging
import signal
import sys
from pathlib import Path
from typing import Any, Dict, List

from pipeline import config as config_mod
from pipeline import enrich, export, listing as listing_mod, search
from pipeline.fetch import Fetcher
from pipeline.store import Store

HERE = Path(__file__).parent
log = logging.getLogger("artofwalks")

_stopping = False


def _handle_sigint(signum, frame):  # noqa: ARG001
    global _stopping
    if _stopping:
        sys.exit(1)
    _stopping = True
    log.warning("stopping after the current listing — press Ctrl-C again to quit now")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--config", default=str(HERE / "config.yaml"))
    p.add_argument("--limit", type=int, default=None, help="override target lead count")
    p.add_argument("--markets", nargs="*", default=None, help="only these markets")
    p.add_argument("--per-market", type=int, default=12, help="candidate listings pulled per market")
    p.add_argument("--export-only", action="store_true", help="re-export what is already in the cache")
    p.add_argument("-v", "--verbose", action="store_true")
    return p.parse_args()


def export_current(store: Store, cfg: config_mod.Config) -> List[Dict[str, Any]]:
    leads = list(store.iter_stage("lead"))
    leads.sort(key=lambda l: (-int(l.get("photo_count", 0)), l.get("market", "")))
    export.to_csv(leads, cfg.out_path(cfg.output.csv_name))
    export.to_xlsx(leads, cfg.out_path(cfg.output.xlsx_name))
    return leads


def main() -> int:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(message)s",
        datefmt="%H:%M:%S",
    )
    signal.signal(signal.SIGINT, _handle_sigint)

    cfg = config_mod.load(args.config)
    if args.limit:
        cfg.leads_wanted = args.limit

    store = Store(cfg.root / cfg.output.cache_db)
    fetcher = Fetcher(store, cfg.scraping)
    finder = enrich.PhoneFinder(fetcher, cfg)

    if args.export_only:
        leads = export_current(store, cfg)
        log.info("exported %s leads from cache", len(leads))
        return 0

    markets = args.markets or cfg.all_markets
    have = store.count_stage("lead")
    log.info("target %s leads, %s already in cache, %s markets", cfg.leads_wanted, have, len(markets))

    seen = store.known_ids()
    checked = 0

    for listing_id, market in search.collect(fetcher, cfg, markets, args.per_market):
        if _stopping or have >= cfg.leads_wanted:
            break
        if listing_id in seen:
            continue
        seen.add(listing_id)

        record = listing_mod.load(fetcher, listing_id, market)
        checked += 1
        if record is None:
            log.debug("%s: page unavailable", listing_id)
            continue

        if not listing_mod.qualifies(record, cfg):
            log.info("skip %s — %s", record.title or listing_id, record.reject_reason)
            store.upsert_listing(listing_id, market, record.as_dict(), "rejected")
            continue

        contact = finder.find(record)
        data = record.as_dict()
        data.update(
            phone=contact.phone,
            phone_source=contact.phone_source,
            email=contact.email,
            website=contact.website,
            instagram=contact.instagram,
        )

        if cfg.require_phone and not contact.phone:
            log.info("no phone for %s (%s)", record.title or listing_id, market)
            store.upsert_listing(listing_id, market, data, "no_phone")
            continue

        store.upsert_listing(listing_id, market, data, "lead")
        have += 1
        log.info("[%s/%s] %s — %s (%s photos, %s)",
                 have, cfg.leads_wanted, record.title or listing_id,
                 contact.phone, record.photo_count, market)

    leads = export_current(store, cfg)
    log.info(
        "done: %s leads from %s listings checked (%s rejected on profile, %s without a phone)",
        len(leads), checked, store.count_stage("rejected"), store.count_stage("no_phone"),
    )
    store.close()
    return 0 if leads else 1


if __name__ == "__main__":
    raise SystemExit(main())
