"""Offline tests: no network, everything runs against the fixtures."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pipeline import config as config_mod  # noqa: E402
from pipeline import enrich, export, jsonwalk, listing, search  # noqa: E402
from tests import fixtures  # noqa: E402

CONFIG = config_mod.load(Path(__file__).resolve().parents[1] / "config.yaml")


class TestPhotoExtraction(unittest.TestCase):
    def test_counts_each_photo_once(self):
        html = fixtures.airbnb_listing_html(photos=32)
        self.assertEqual(len(jsonwalk.photo_urls(html)), 32)

    def test_sizes_of_one_photo_collapse_to_one(self):
        base = "https://a0.muscache.com/im/pictures/miso/Hosting-1/original/abc-123456789012.jpeg"
        html = f'<img src="{base}?im_w=720"><img src="{base}?im_w=1440"><img src="{base}">'
        urls = jsonwalk.photo_urls(html)
        self.assertEqual(len(urls), 1)
        # The largest available variant is the one kept.
        self.assertNotIn("im_w=720", urls[0])

    def test_reports_widest_offered_variant(self):
        html = fixtures.airbnb_listing_html(photos=3)
        self.assertGreaterEqual(jsonwalk.max_photo_width(jsonwalk.photo_urls(html)), 1440)


class TestListingParsing(unittest.TestCase):
    def setUp(self):
        self.html = fixtures.airbnb_listing_html()
        self.record = listing.parse("53564686", self.html, market="Mallorca, Spain")

    def test_reads_core_fields(self):
        r = self.record
        self.assertEqual(r.bedrooms, 6)
        self.assertEqual(r.person_capacity, 12)
        self.assertEqual(r.review_count, 148)
        self.assertEqual(r.rating, 4.92)
        self.assertEqual(r.host_name, "Marta")
        self.assertTrue(r.is_superhost)
        self.assertEqual(r.listings_by_host, 14)
        self.assertIn("Villa Aurora", r.title)

    def test_picks_up_host_supplied_links(self):
        links = self.record.external_links
        self.assertTrue(any("villa-aurora-mallorca.example" in l for l in links))
        self.assertTrue(any("instagram.com/villaaurora" in l for l in links))

    def test_handles_messy_host_written_urls(self):
        cases = {
            "Buchen: www.villa-aurora.com/kontakt?lang=de&ref=x": "https://www.villa-aurora.com/kontakt?lang=de&ref=x",
            "Mehr auf https://villa-aurora.example.": "https://villa-aurora.example",
            "Schreib uns (https://villa.example/contact) gerne!": "https://villa.example/contact",
        }
        for description, expected in cases.items():
            record = listing.parse("1", fixtures.airbnb_listing_html(description=description))
            self.assertIn(expected, record.external_links, f"failed on: {description}")

    def test_ignores_bare_ip_urls(self):
        record = listing.parse("1", fixtures.airbnb_listing_html(description="Server: http://127.0.0.1:8080/host"))
        self.assertEqual(record.external_links, [])

    def test_ignores_airbnb_own_urls(self):
        record = listing.parse(
            "1", fixtures.airbnb_listing_html(description="See https://www.airbnb.com/rooms/1 and https://a0.muscache.com/x"),
        )
        self.assertEqual(record.external_links, [])

    def test_profile_gate_accepts_a_large_well_shot_home(self):
        self.assertTrue(listing.qualifies(self.record, CONFIG))
        self.assertEqual(self.record.reject_reason, "")

    def test_profile_gate_rejects_thin_galleries(self):
        record = listing.parse("2", fixtures.airbnb_listing_html(photos=9))
        self.assertFalse(listing.qualifies(record, CONFIG))
        self.assertIn("photos", record.reject_reason)

    def test_profile_gate_rejects_small_homes(self):
        record = listing.parse("3", fixtures.airbnb_listing_html(bedrooms=1, capacity=2))
        self.assertFalse(listing.qualifies(record, CONFIG))


class TestSearch(unittest.TestCase):
    def test_finds_listing_ids_on_a_results_page(self):
        ids = jsonwalk.room_ids(fixtures.airbnb_search_html())
        self.assertEqual(ids[:3], ["11111111", "22222222", "33333333"])

    def test_search_url_carries_the_profile_filters(self):
        url = search.search_url("Mallorca, Spain", CONFIG.filters, page=2)
        self.assertIn("min_bedrooms=4", url)
        self.assertIn("adults=8", url)
        self.assertIn("items_offset=36", url)
        self.assertIn("Mallorca", url)


class TestPhoneExtraction(unittest.TestCase):
    def test_reads_tel_links(self):
        found = enrich.phones_in(fixtures.HOST_CONTACT_HTML, "ES", True)
        self.assertIn("+34971530123", found)

    def test_parses_national_format_with_a_region(self):
        self.assertIn("+498912345678", enrich.phones_in("Tel. 089 12345678", "DE", True))

    def test_ignores_numbers_that_are_not_phone_numbers(self):
        noise = "<p>Ref 2024-0001 · 25 photos · 12 guests · price 1200 EUR</p>"
        self.assertEqual(enrich.phones_in(noise, "ES", True), [])

    def test_finds_contact_pages(self):
        pages = enrich.contact_pages(fixtures.HOST_SITE_HTML, "https://villa-aurora-mallorca.example/", 2)
        self.assertEqual(pages, ["https://villa-aurora-mallorca.example/kontakt"])

    def test_reads_emails_but_not_image_names(self):
        html = '<a href="mailto:hola@x.example">mail</a><img src="logo@2x.png">'
        self.assertEqual(enrich.emails_in(html), ["hola@x.example"])

    def test_region_derived_from_market(self):
        record = listing.parse("1", fixtures.airbnb_listing_html(), market="Tyrol, Austria")
        self.assertEqual(enrich.region_for(record), "AT")


class TestSharedNumberScreening(unittest.TestCase):
    def test_a_number_on_many_domains_is_rejected(self):
        finder = enrich.PhoneFinder(fetcher=None, cfg=CONFIG)
        for domain in ("a.example", "b.example", "c.example", "d.example"):
            finder._note("+3497100000", f"https://{domain}/contact")
        self.assertTrue(finder._is_shared("+3497100000"))

    def test_a_number_on_one_domain_is_kept(self):
        finder = enrich.PhoneFinder(fetcher=None, cfg=CONFIG)
        finder._note("+34971530123", "https://villa-aurora-mallorca.example/kontakt")
        self.assertFalse(finder._is_shared("+34971530123"))


class TestExport(unittest.TestCase):
    def test_writes_csv_and_xlsx(self):
        import tempfile

        leads = [{"title": "Villa Aurora", "phone": "+34971530123", "photo_count": 32, "market": "Mallorca, Spain"}]
        with tempfile.TemporaryDirectory() as tmp:
            csv_path = export.to_csv(leads, Path(tmp) / "leads.csv")
            xlsx_path = export.to_xlsx(leads, Path(tmp) / "leads.xlsx")
            body = csv_path.read_text(encoding="utf-8-sig")
            self.assertIn("Villa Aurora", body)
            self.assertIn("+34971530123", body)
            self.assertGreater(xlsx_path.stat().st_size, 0)


class TestMarketOrdering(unittest.TestCase):
    def test_markets_are_interleaved_across_regions(self):
        first_five = CONFIG.all_markets[:5]
        regions = {m.split(", ")[-1] for m in first_five}
        # Worldwide coverage means the first few searches must not all be one country.
        self.assertGreater(len(regions), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
