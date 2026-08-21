# airbnb-leads

Builds a scored list of prospects for ArtOfWalks and exports it as a PDF.

We sell ~EUR 50 cinematic walkthrough videos made from photos a host already
has. The best prospect is therefore not an individual host with one flat, but a
**company that manages holiday lets for other people**: one conversation covers
dozens of listings, and they already own the photography budget.

## Quick start

```bash
./setup.sh                                  # venv + dependencies
.venv/bin/python run.py --count 100         # writes out/leads-<date>.pdf
```

Out of the box this runs the `demo` provider, which emits synthetic rows so you
can see the pipeline work without a data source. Those PDFs are stamped
**SAMPLE DATA** on every page. For a real list, pick a provider below.

## Providers

| Provider | What it does | Needs |
|---|---|---|
| `demo` | Synthetic fixtures on `example.com` addresses | nothing |
| `csv` | Normalises, scores and exports a list you already own | a CSV |
| `apollo` | Apollo.io People Search + Bulk Enrich | paid Apollo plan + API key |

### csv

The most portable route: export from a CRM or a data vendor, then let this tool
dedupe, score, rank and format it.

```bash
cp your-export.csv input/leads.csv
.venv/bin/python run.py --provider csv --count 100
```

Column headers are matched case-insensitively against a set of aliases, so
`Company Name`, `company`, and `Organisation` all land in the same field.
Columns it does not recognise are preserved in the lead's notes rather than
dropped. Rows with neither a company nor an email are skipped.

### apollo

```bash
export APOLLO_API_KEY=...          # Apollo > Settings > Integrations > API
.venv/bin/python run.py --provider apollo --count 100
```

Search itself is free; revealing a work email costs **1 credit per contact**, so
a 100-lead run costs about 100 credits. The run aborts before spending anything
if the reveal would exceed `[apollo].max_credits`.

Note that **People Search is not available on Apollo's free plan** — it returns
`API_INACCESSIBLE`. On a free account, export from the Apollo web UI instead and
use `--provider csv`.

## Options

```
--count N          how many leads to aim for
--provider NAME    demo | csv | apollo
--out PATH         PDF destination
--csv-out PATH     also write the rows as CSV
--min-score N      drop leads scoring below N (0-100)
--config PATH      alternate config.toml
```

## Scoring

Each lead gets 0-100 across five axes, and the PDF shows the reasoning per lead:

| Axis | Max | Rewards |
|---|---|---|
| Region | 25 | Greece, Spain, Portugal, Italy, Croatia, France (weighted in config) |
| Vertical | 20 | vacation rental / short-let / villa / property management wording |
| Title | 20 | owner and founder first, then marketing budget holders, then ops |
| Size | 15 | 2-50 employees: no in-house video team, but a real budget |
| Reachability | 20 | verified email, then website and phone |

Bands: **A** 75+ contact first, **B** 55-74, **C** 35-54, **D** below 35.

Tune the weights in `config.toml` under `[icp]` — the region list, titles and
keywords all feed both the Apollo query and the score.

## Tests

```bash
.venv/bin/python test_leads.py
```

24 tests covering config merging, dedupe, scoring bands, CSV alias mapping,
provider error paths, PDF output and the end-to-end run.

## Layout

```
setup.sh              venv + dependencies
run.py                CLI entry point
config.example.toml   copied to config.toml by setup.sh
test_leads.py         test suite
airbnb_leads/
  config.py           TOML loading, layered over defaults
  models.py           Lead dataclass, dedupe
  scoring.py          ICP scoring
  pdf.py              PDF rendering
  providers/          demo | csv | apollo
```

## Scope and compliance

This tool targets **businesses** and uses **business contact data** — the
`info@`-style addresses those companies publish in order to be contacted, or
licensed B2B records from a vendor like Apollo.

It deliberately does **not** scrape Airbnb. Airbnb's terms prohibit it, host
contact details are personal data rather than business data, and building a cold
outreach list from them is not defensible under GDPR. A scraper aimed at that is
out of scope for this tool by design, not by omission.

For outreach into the EU/UK, the usual B2B rules still apply: identify yourself,
state where you got the address, offer an opt-out in every message, and honour
it. `config.toml` is gitignored so a real list never lands in version control.
