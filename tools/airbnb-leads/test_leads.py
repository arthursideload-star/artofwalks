#!/usr/bin/env python3
"""Tests for the lead pipeline. Run: .venv/bin/python test_leads.py"""

from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from airbnb_leads import config, providers, scoring  # noqa: E402
from airbnb_leads.models import Lead, dedupe  # noqa: E402


class TestModels(unittest.TestCase):
    def test_email_validation(self):
        self.assertTrue(Lead(company="A", email="a@b.co").has_usable_email)
        self.assertFalse(Lead(company="A", email="a@b").has_usable_email)
        self.assertFalse(Lead(company="A", email="").has_usable_email)

    def test_dedupe_is_case_insensitive_and_keeps_best(self):
        a = Lead(company="A", email="X@Example.com", score=10)
        b = Lead(company="A", email="x@example.com", score=42)
        kept = dedupe([a, b])
        self.assertEqual(len(kept), 1)
        self.assertEqual(kept[0].score, 42)

    def test_dedupe_falls_back_to_company_and_person(self):
        a = Lead(company="Acme", contact_name="Jo", score=1)
        b = Lead(company="Acme", contact_name="Sam", score=1)
        self.assertEqual(len(dedupe([a, b])), 2)


class TestConfig(unittest.TestCase):
    def test_missing_file_yields_defaults(self):
        cfg = config.load("/nonexistent/config.toml")
        self.assertEqual(cfg["run"]["provider"], "demo")

    def test_override_merges_over_defaults(self):
        with tempfile.NamedTemporaryFile("w", suffix=".toml", delete=False) as fh:
            fh.write('[run]\ntarget_count = 7\n')
            path = fh.name
        cfg = config.load(path)
        self.assertEqual(cfg["run"]["target_count"], 7)
        # untouched keys survive the merge
        self.assertEqual(cfg["run"]["provider"], "demo")
        self.assertIn("base_url", cfg["apollo"])

    def test_invalid_toml_raises(self):
        with tempfile.NamedTemporaryFile("w", suffix=".toml", delete=False) as fh:
            fh.write("[run\n")
            path = fh.name
        with self.assertRaises(config.ConfigError):
            config.load(path)

    def test_region_weights(self):
        cfg = config.load(HERE / "config.example.toml")
        weights = config.region_weights(cfg)
        self.assertAlmostEqual(weights["greece"], 1.0)
        self.assertIn("croatia", weights)


class TestScoring(unittest.TestCase):
    weights = {"greece": 1.0, "spain": 0.95}

    def test_ideal_lead_scores_in_band_a(self):
        lead = scoring.score_lead(Lead(
            company="Aegean Villa Rentals", contact_name="N P", title="Founder",
            email="n@p.gr", email_status="verified", website="https://p.gr",
            country="Greece", employees="11-50"), self.weights)
        self.assertGreaterEqual(lead.score, 75)
        self.assertTrue(scoring.band(lead.score).startswith("A"))

    def test_offtarget_lead_scores_low(self):
        lead = scoring.score_lead(Lead(
            company="Generic Widgets", title="Intern", country="Norway"),
            self.weights)
        self.assertLess(lead.score, 35)
        self.assertTrue(scoring.band(lead.score).startswith("D"))

    def test_score_is_clamped(self):
        lead = scoring.score_lead(Lead(
            company="Vacation rental short term rental holiday rental villa airbnb",
            title="Founder", email="a@b.gr", email_status="verified",
            website="x", phone="1", country="Greece", employees="11-50"),
            self.weights)
        self.assertLessEqual(lead.score, scoring.MAX_SCORE)

    def test_verified_email_outranks_unverified(self):
        base = dict(company="Villa Co", title="Owner", country="Spain",
                    employees="11-50", website="https://x.es")
        verified = scoring.score_lead(
            Lead(**base, email="a@x.es", email_status="verified"), self.weights)
        unverified = scoring.score_lead(
            Lead(**base, email="a@x.es", email_status="unverified"), self.weights)
        self.assertGreater(verified.score, unverified.score)

    def test_reasons_are_recorded(self):
        lead = scoring.score_lead(
            Lead(company="Villa Co", title="Owner", country="Greece"), self.weights)
        self.assertTrue(lead.score_reasons)


class TestProviders(unittest.TestCase):
    def test_unknown_provider_raises(self):
        with self.assertRaises(providers.ProviderError):
            providers.get("nope", config.DEFAULTS)

    def test_demo_provider_is_marked_synthetic(self):
        provider = providers.get("demo", config.DEFAULTS)
        self.assertTrue(provider.synthetic)

    def test_demo_provider_only_emits_example_com(self):
        leads = providers.get("demo", config.DEFAULTS).fetch(40)
        self.assertEqual(len(leads), 40)
        for lead in leads:
            self.assertTrue(lead.email.endswith("@example.com"), lead.email)

    def test_demo_provider_is_deterministic(self):
        first = providers.get("demo", config.DEFAULTS).fetch(15)
        second = providers.get("demo", config.DEFAULTS).fetch(15)
        self.assertEqual([l.company for l in first], [l.company for l in second])

    def test_csv_provider_is_not_synthetic(self):
        self.assertFalse(providers.get("csv", config.DEFAULTS).synthetic)

    def test_csv_missing_file_raises(self):
        cfg = dict(config.DEFAULTS)
        cfg["csv"] = {"path": "/nonexistent/leads.csv"}
        with self.assertRaises(providers.ProviderError):
            providers.get("csv", cfg).fetch(5)

    def test_csv_maps_aliases_skips_blanks_and_keeps_extras(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "leads.csv"
            path.write_text(
                "Company Name,Full Name,Job Title,Email Address,Country,Instagram\n"
                "Villa Co,Jo Blogs,Founder,jo@villa.gr,Greece,@villaco\n"
                ",,,,,\n",
                encoding="utf-8")
            cfg = dict(config.DEFAULTS)
            cfg["csv"] = {"path": str(path)}
            leads = providers.get("csv", cfg).fetch(10)

        self.assertEqual(len(leads), 1)          # blank row dropped
        self.assertEqual(leads[0].company, "Villa Co")
        self.assertEqual(leads[0].contact_name, "Jo Blogs")
        self.assertEqual(leads[0].email, "jo@villa.gr")
        self.assertIn("Instagram", leads[0].notes)  # unmapped column carried through

    def test_csv_without_usable_columns_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "leads.csv"
            path.write_text("colour,shape\nred,round\n", encoding="utf-8")
            cfg = dict(config.DEFAULTS)
            cfg["csv"] = {"path": str(path)}
            with self.assertRaises(providers.ProviderError):
                providers.get("csv", cfg).fetch(5)

    def test_apollo_without_key_raises(self):
        import os
        saved = os.environ.pop("APOLLO_API_KEY", None)
        try:
            with self.assertRaises(providers.ProviderError):
                providers.get("apollo", config.DEFAULTS).fetch(5)
        finally:
            if saved is not None:
                os.environ["APOLLO_API_KEY"] = saved


class TestPdf(unittest.TestCase):
    def test_render_writes_a_real_pdf(self):
        from airbnb_leads import pdf
        cfg = config.load(HERE / "config.example.toml")
        leads = scoring.score_all(
            providers.get("demo", cfg).fetch(30), config.region_weights(cfg))
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "nested" / "leads.pdf"   # also checks mkdir
            pdf.render(leads, out, cfg=cfg, source_description="test",
                       synthetic=True)
            self.assertTrue(out.exists())
            self.assertGreater(out.stat().st_size, 3000)
            self.assertEqual(out.read_bytes()[:5], b"%PDF-")


class TestEndToEnd(unittest.TestCase):
    def test_run_main_produces_pdf_and_csv(self):
        import run
        with tempfile.TemporaryDirectory() as tmp:
            pdf_path = Path(tmp) / "leads.pdf"
            csv_path = Path(tmp) / "leads.csv"
            code = run.main([
                "--provider", "demo", "--count", "25",
                "--config", str(HERE / "config.example.toml"),
                "--out", str(pdf_path), "--csv-out", str(csv_path),
            ])
            self.assertEqual(code, 0)
            self.assertTrue(pdf_path.exists())
            rows = csv_path.read_text(encoding="utf-8").strip().splitlines()
            self.assertEqual(len(rows), 26)   # header + 25

    def test_min_score_filter_applies(self):
        import run
        with tempfile.TemporaryDirectory() as tmp:
            pdf_path = Path(tmp) / "leads.pdf"
            csv_path = Path(tmp) / "leads.csv"
            run.main([
                "--provider", "demo", "--count", "50", "--min-score", "88",
                "--config", str(HERE / "config.example.toml"),
                "--out", str(pdf_path), "--csv-out", str(csv_path),
            ])
            rows = csv_path.read_text(encoding="utf-8").strip().splitlines()
            self.assertLess(len(rows) - 1, 50)   # filter actually removed some


if __name__ == "__main__":
    unittest.main(verbosity=2)
