"""Runs the pipeline through the real Scrapling stack against a local server.

test_end_to_end.py replaces the fetch layer entirely, so it never proves that
Scrapling itself is wired up correctly. This one serves a miniature Airbnb over
localhost and lets the actual fetchers, cache, parsers and exporter run against
it — only the target host is swapped.
"""

import csv
import os
import sys
import tempfile
import threading
import unittest
from functools import partial
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from tests import fixtures  # noqa: E402

LISTING_IDS = ("11111111", "22222222", "33333333")
# Ids 1 and 2 qualify; id 3 has a thin gallery and must be filtered out.
THIN_GALLERY_ID = "33333333"


class MiniAirbnb(BaseHTTPRequestHandler):
    """Serves just enough of a search page, listing page, and host website."""

    def do_GET(self):  # noqa: N802 - name fixed by BaseHTTPRequestHandler
        path = self.path.split("?", 1)[0]

        if path.endswith("/homes"):
            body = fixtures.airbnb_search_html(ids=LISTING_IDS)
        elif "/rooms/" in path:
            listing_id = path.rsplit("/", 1)[-1]
            photos = 8 if listing_id == THIN_GALLERY_ID else 30
            body = fixtures.airbnb_listing_html(
                listing_id=listing_id,
                photos=photos,
                # A bare host:port URL is deliberately not treated as a host
                # website in production, so the phone sits in the text here and
                # the external-site chain is covered by its own test below.
                description="Villa Aurora. Fragen? Ruf uns an: +34 971 530 123",
            )
        elif path.rstrip("/").endswith("/host"):
            body = fixtures.HOST_SITE_HTML
        elif "kontakt" in path:
            body = fixtures.HOST_CONTACT_HTML
        else:
            self.send_error(404)
            return

        payload = body.encode("utf-8")
        self.send_response(200)
        # Without an explicit charset a browser falls back to latin-1 and mangles
        # every non-ASCII character in the page.
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):  # silence per-request logging
        pass


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
  sources: [listing_text, host_links]
  require_international_format: true
  max_pages_per_listing: 4
scraping:
  delay_seconds: 0.0
  fetcher: {fetcher}
  headless: true
  timeout_ms: 30000
  retries: 0
  max_search_pages: 1
  executable_path: "{executable_path}"
markets:
  test:
    - "Mallorca, Spain"
output:
  directory: "out"
  csv_name: "leads.csv"
  xlsx_name: "leads.xlsx"
  cache_db: "out/cache.sqlite3"
"""


class LiveLocalMixin:
    fetcher_mode = "plain"
    executable_path = ""

    def _run_pipeline(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), MiniAirbnb)
        host, port = server.server_address
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f"http://{host}:{port}"

        try:
            with tempfile.TemporaryDirectory() as tmp:
                cfg_path = Path(tmp) / "config.yaml"
                cfg_path.write_text(
                    CONFIG_TEMPLATE.format(
                        fetcher=self.fetcher_mode, executable_path=self.executable_path
                    ),
                    encoding="utf-8",
                )

                import run
                from pipeline import listing as listing_mod
                from pipeline import search as search_mod

                argv = ["run.py", "--config", str(cfg_path), "--per-market", "5"]
                with mock.patch.object(search_mod, "SEARCH_BASE", base + "/s/{place}/homes"), \
                     mock.patch.object(listing_mod, "LISTING_URL", base + "/rooms/{listing_id}"), \
                     mock.patch.object(sys, "argv", argv):
                    exit_code = run.main()

                csv_path = Path(tmp) / "out" / "leads.csv"
                rows = []
                if csv_path.exists():
                    with csv_path.open(encoding="utf-8-sig") as fh:
                        rows = list(csv.DictReader(fh, delimiter=";"))
                return exit_code, rows
        finally:
            server.shutdown()
            server.server_close()


class TestLiveLocalHttp(LiveLocalMixin, unittest.TestCase):
    """The HTTP fetcher path — no browser required."""

    fetcher_mode = "plain"

    def test_pipeline_runs_against_a_real_server(self):
        exit_code, rows = self._run_pipeline()

        self.assertEqual(exit_code, 0)
        self.assertEqual(len(rows), 2, "expected the two listings with a full gallery")
        for row in rows:
            self.assertEqual(row["Telefon"], "+34971530123")
            self.assertEqual(row["Telefon-Quelle"], "listing description")
            self.assertEqual(row["Fotos"], "30")
            self.assertEqual(row["Schlafzimmer"], "6")
            # Non-ASCII must survive the whole round trip.
            self.assertIn("Sea View Estate", row["Objekt"])

    def test_external_site_mining_over_real_http(self):
        """The host-website chain: fetch a site, find its contact page, read the number."""
        import tempfile as _tempfile

        from pipeline.config import Scraping
        from pipeline.enrich import contact_pages, emails_in, phones_in
        from pipeline.fetch import Fetcher as PipelineFetcher
        from pipeline.store import Store

        server = ThreadingHTTPServer(("127.0.0.1", 0), MiniAirbnb)
        host, port = server.server_address
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://{host}:{port}"
        try:
            with _tempfile.TemporaryDirectory() as tmp:
                store = Store(Path(tmp) / "cache.sqlite3")
                fetcher = PipelineFetcher(store, Scraping(delay_seconds=0.0, retries=0, fetcher="plain"))

                landing = fetcher.get(base + "/host")
                self.assertIsNotNone(landing, "real Scrapling fetch of the host site failed")

                subpages = contact_pages(landing, base + "/host", limit=2)
                self.assertEqual(len(subpages), 1)

                contact_html = fetcher.get(subpages[0])
                self.assertIsNotNone(contact_html)
                self.assertIn("+34971530123", phones_in(contact_html, "ES", True))
                self.assertEqual(emails_in(contact_html), ["hola@villa-aurora-mallorca.example"])

                # The second read must come from the cache, not the network.
                server.shutdown()
                self.assertIsNotNone(fetcher.get(subpages[0]))
        finally:
            server.server_close()


@unittest.skipUnless(
    os.environ.get("AIRBNB_LEADS_BROWSER_TEST") == "1",
    "browser test is opt-in: set AIRBNB_LEADS_BROWSER_TEST=1 (needs a Chromium)",
)
class TestLiveLocalBrowser(LiveLocalMixin, unittest.TestCase):
    """The StealthyFetcher path, driving a real headless Chromium."""

    fetcher_mode = "stealthy"

    def setUp(self):
        self.executable_path = os.environ.get("SCRAPLING_EXECUTABLE_PATH", "")

    def test_pipeline_runs_through_a_browser(self):
        exit_code, rows = self._run_pipeline()
        self.assertEqual(exit_code, 0)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["Telefon"], "+34971530123")
        self.assertIn("Sea View Estate", rows[0]["Objekt"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
