#!/usr/bin/env python3
"""Generate a scored lead list for ArtOfWalks and export it as a PDF.

    ./setup.sh
    .venv/bin/python run.py --count 100

The provider decides where the rows come from; see config.toml.
"""

from __future__ import annotations

import argparse
import csv
import sys
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from airbnb_leads import __version__, config, providers, scoring  # noqa: E402
from airbnb_leads.models import Lead, dedupe  # noqa: E402


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="run.py",
        description="Build a scored vacation-rental-manager lead list as a PDF.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "providers:\n"
            "  demo    synthetic rows, no network or credits (default)\n"
            "  csv     normalise + score a list you already own\n"
            "  apollo  Apollo.io People Search + Bulk Enrich (paid plan + APOLLO_API_KEY)\n"
        ),
    )
    parser.add_argument("--count", type=int, default=None,
                        help="how many leads to aim for (default: config [run].target_count)")
    parser.add_argument("--provider", choices=["demo", "csv", "apollo"], default=None,
                        help="override the configured data source")
    parser.add_argument("--config", default=str(HERE / "config.toml"),
                        help="path to config.toml")
    parser.add_argument("--out", default=None,
                        help="output PDF path (default: <output_dir>/leads-<date>.pdf)")
    parser.add_argument("--csv-out", default=None,
                        help="also write the rows to this CSV path")
    parser.add_argument("--min-score", type=int, default=0,
                        help="drop leads scoring below this (0-100)")
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    return parser.parse_args(argv)


def write_csv(leads: list[Lead], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = list(leads[0].to_dict().keys())
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        for lead in leads:
            writer.writerow(lead.to_dict())


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    try:
        cfg = config.load(args.config)
    except config.ConfigError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    run_cfg = cfg["run"]
    provider_name = args.provider or run_cfg.get("provider", "demo")
    target = args.count if args.count is not None else int(run_cfg.get("target_count", 100))
    if target <= 0:
        print("error: --count must be positive", file=sys.stderr)
        return 2

    print(f"ArtOfWalks lead generator {__version__}")
    print(f"  provider : {provider_name}")
    print(f"  target   : {target} leads")

    try:
        provider = providers.get(provider_name, cfg)
    except providers.ProviderError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    # Over-fetch a little so dedupe and the score filter still leave enough.
    fetch_target = target + max(10, target // 5)
    try:
        leads = provider.fetch(fetch_target)
    except providers.ProviderError as exc:
        print(f"\nerror: {exc}", file=sys.stderr)
        return 1

    if not leads:
        print("\nNo leads returned. Widen the ICP filters in config.toml "
              "or try a different provider.", file=sys.stderr)
        return 1

    print(f"  fetched  : {len(leads)}")

    weights = config.region_weights(cfg)
    leads = scoring.score_all(leads, weights)
    leads = dedupe(leads)

    if args.min_score:
        before = len(leads)
        leads = [l for l in leads if l.score >= args.min_score]
        print(f"  filtered : {before - len(leads)} below score {args.min_score}")

    leads.sort(key=lambda l: (-l.score, l.company.lower()))
    leads = leads[:target]
    print(f"  final    : {len(leads)} after dedupe, filter and ranking")

    if len(leads) < target:
        print(f"  note     : asked for {target}, got {len(leads)} - "
              f"widen the ICP filters or lower --min-score")

    out_dir = HERE / run_cfg.get("output_dir", "out")
    pdf_path = Path(args.out) if args.out else out_dir / f"leads-{date.today().isoformat()}.pdf"

    from airbnb_leads import pdf  # imported late so --help works without reportlab
    pdf.render(leads, pdf_path, cfg=cfg,
               source_description=provider.describe(),
               synthetic=provider.synthetic)
    print(f"\nPDF   -> {pdf_path}")

    if args.csv_out:
        csv_path = Path(args.csv_out)
        write_csv(leads, csv_path)
        print(f"CSV   -> {csv_path}")

    top = leads[0]
    print(f"\nTop lead: {top.company} - {top.contact_name} "
          f"({top.title}) score {top.score}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
