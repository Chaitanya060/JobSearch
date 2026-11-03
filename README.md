# Job Hunter Platform

Zero-cost automated job aggregator, AI resume tailor, human-approved apply/outreach.
Spec: v2.0 (3 Nov 2026). Automates discovery/prep; a human clicks every irreversible button.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate              # Windows
pip install -r requirements.txt
playwright install chromium
cp .env.example .env                 # fill keys (optional for Phase 1-2)
cp data/master_resume.example.json data/master_resume.json
# edit data/master_resume.json with your real info (gitignored)
```

Without `SUPABASE_URL` / `SUPABASE_KEY` the DB falls back to a local SQLite file
at `data/jobs.sqlite` so Phases 1-2 run offline.

## Status
- [x] Phase 1: scaffold, config, DB abstraction, dedup
- [x] Phase 2: scrapers (Greenhouse / Lever / Ashby / RSS) + Telegram alerts
- [x] Phase 3: enrichment (domain + confirmed-source contacts)
- [x] Phase 4: AI tailor + validator + PDF compile
- [x] Phase 5: Streamlit dashboard + prefill + GitHub Actions cron
- [x] Phase 6: outreach drafts (optional, manual send)

## Run

```bash
# Local one-shot: discover + enrich + tailor + alert (no submit, no send)
python -m src.run_daily_pipeline

# Review queue
streamlit run dashboard/app.py
```

Drop ATS slugs into `data/companies.yaml` (copy from `.example`).
Set `GEMINI_API_KEY` + a filled `data/master_resume.json` to enable tailoring.
Without them, ingest/enrich/dashboard still work; tailor is skipped.

## Guarantees
- Cron never submits a form and never sends email.
- Only `is_confirmed_source=TRUE` contacts (JD regex, mailto links, Hunter) appear in outreach drafts.
- `resume_validator.py` rejects any AI edit that invents a company, project, date, role, metric, or skill — tested.
