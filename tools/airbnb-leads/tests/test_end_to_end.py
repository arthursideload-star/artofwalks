"""Drives run.py end to end with fixture pages instead of the network.

This covers the wiring the unit tests do not touch: search -> listing -> phone
enrichment -> SQLite stages -> CSV/XLSX export.
"""

import csv
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from tests import fixtures  # noqa: E402

CONFIG_TEMPLATE = """
target:
  leads_wanted: 2
  require_phone: true
listing_filters:
  room_type: "Entire home/apt"
  min_bedrooms: 4
  min_guests: 8
  min_photos: 25
  min_photo_width: 1200
  min_reviews: 5
  min_rating: 4.5
enrichment:
  sources: [listing_text, host_links, web_search]
  require_international_format: true
  max_pages_per_listing: 4
scraping:
  delay_seconds: 0.0
  fetcher: stealthy
  headless: true
  timeout_ms: 5000
  retries: 0
  max_search_pages: 1
markets:
  test:
    - "Mallorca, Spain"
output:
  directory: "out"
  csv_name: "leads.csv"
  xlsx_name: "leads.xlsx"
  cache_db: "out/cache.sqlite3"
"""


def fake_get(self, url, *, render=False, wait_selector=None):
    if "/s/" in url and "/homes" in url:
        return fixtures.airbnb_search_html(ids=("11111111", "22222222", "33333333"))
    if "/rooms/" in url:
        listing_id = url.rsplit("/", 1)[-1]
        # The third listing has a thin gallery and must be filtered out.
        photos = 8 if listing_id == "33333333" else 30
        return fixtures.airbnb_listing_html(listing_id=listing_id, photos=photos)
    if url.rstrip("/").endswith("villa-aurora-mallorca.example"):
        return fixtures.HOST_SITE_HTML
    if "kontakt" in url:
        return fixtures.HOST_CONTACT_HTML
    return None


class TestEndToEnd(unittest.TestCase):
    def test_run_produces_leads_with_phone_numbers(self):
        with tempfile.TemporaryDirectory() as tmp:
            cfg_path = Path(tmp) / "config.yaml"
            cfg_path.write_text(CONFIG_TEMPLATE, encoding="utf-8")

            import run

            argv = ["run.py", "--config", str(cfg_path), "--per-market", "5"]
            with mock.patch("pipeline.fetch.Fetcher.get", fake_get), mock.patch.object(sys, "argv", argv):
                exit_code = run.main()

            self.assertEqual(exit_code, 0)

            csv_path = Path(tmp) / "out" / "leads.csv"
            self.assertTrue(csv_path.exists(), "export did not write a CSV")
            with csv_path.open(encoding="utf-8-sig") as fh:
                rows = list(csv.DictReader(fh, delimiter=";"))

            self.assertEqual(len(rows), 2, "expected the two qualifying listings")
            for row in rows:
                self.assertEqual(row["Telefon"], "+34971530123")
                self.assertIn("villa-aurora-mallorca.example", row["Telefon-Quelle"])
                self.assertEqual(row["E-Mail"], "hola@villa-aurora-mallorca.example")
                self.assertEqual(row["Schlafzimmer"], "6")
                self.assertEqual(row["Fotos"], "30")
                self.assertTrue(row["Airbnb-Link"].startswith("https://www.airbnb.com/rooms/"))

            self.assertTrue((Path(tmp) / "out" / "leads.xlsx").exists())

    def test_rerun_resumes_from_cache_without_refetching(self):
        with tempfile.TemporaryDirectory() as tmp:
            cfg_path = Path(tmp) / "config.yaml"
            cfg_path.write_text(CONFIG_TEMPLATE, encoding="utf-8")

            import run

            argv = ["run.py", "--config", str(cfg_path), "--per-market", "5"]
            with mock.patch("pipeline.fetch.Fetcher.get", fake_get), mock.patch.object(sys, "argv", argv):
                run.main()

            # Second pass: exporting from the store must not need the network at all.
            def explode(*a, **kw):
                raise AssertionError("re-run refetched a page instead of using the cache")

            argv2 = ["run.py", "--config", str(cfg_path), "--export-only"]
            with mock.patch("pipeline.fetch.Fetcher.get", explode), mock.patch.object(sys, "argv", argv2):
                self.assertEqual(run.main(), 0)

            with (Path(tmp) / "out" / "leads.csv").open(encoding="utf-8-sig") as fh:
                self.assertEqual(len(list(csv.DictReader(fh, delimiter=";"))), 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
