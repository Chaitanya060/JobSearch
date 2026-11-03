"""Daily pipeline: discover + (later) enrich + tailor + prepare queue.
Never submits applications or sends email.
"""
from __future__ import annotations
import argparse
import logging
from pathlib import Path

from . import config
from .db import get_backend
from .filters import passes_filters
from .scrapers import ats_feeds, rss_boards, startups
from .enrichment import domain_resolver, contact_finder
from .alerts import telegram

log = logging.getLogger("pipeline")


def _load_companies() -> dict[str, list[str]]:
    path = config.DATA_DIR / "companies.yaml"
    if not path.exists():
        return {"greenhouse": [], "lever": [], "ashby": []}
    try:
        import yaml  # type: ignore
        return yaml.safe_load(path.read_text()) or {}
    except Exception:
        # tiny fallback parser (key: then "- val" lines) so we don't need pyyaml
        out: dict[str, list[str]] = {}
        cur = None
        for line in path.read_text().splitlines():
            s = line.strip()
            if not s or s.startswith("#"):
                continue
            if s.endswith(":"):
                cur = s[:-1]; out[cur] = []
            elif s.startswith("- ") and cur:
                out[cur].append(s[2:].strip())
        return out


def ingest() -> dict:
    be = get_backend()
    companies = _load_companies()
    seen = inserted = filtered = 0

    sources = []
    sources.append(ats_feeds.fetch_all(
        greenhouse=companies.get("greenhouse", []),
        lever=companies.get("lever", []),
        ashby=companies.get("ashby", []),
    ))
    sources.append(rss_boards.fetch_all())
    sources.append(startups.fetch_all())

    for stream in sources:
        for row in stream:
            seen += 1
            if not row.get("job_url") or not row.get("job_title"):
                continue
            if not passes_filters(row):
                filtered += 1
                continue
            if be.insert_job(row) is not None:
                inserted += 1

    log.info("ingest: seen=%d filtered_out=%d inserted=%d", seen, filtered, inserted)
    return {"seen": seen, "filtered": filtered, "inserted": inserted}


def enrich(limit: int = 25, use_hunter: bool = False) -> dict:
    be = get_backend()
    jobs = be.jobs_by_status("DISCOVERED", limit=limit)
    resolved = contacts = 0
    for j in jobs:
        d = j.get("company_domain") or domain_resolver.resolve(
            j.get("company_name", ""), j.get("job_url"))
        if d:
            resolved += 1
        found = contact_finder.discover(
            company_name=j.get("company_name", ""),
            domain=d,
            description=j.get("description_raw") or "",
            use_hunter=use_hunter,
        )
        for c in found:
            if be.insert_contact(j["id"], c.__dict__):
                contacts += 1
        be.update_job(j["id"], company_domain=d, status="ENRICHED")
    log.info("enrich: jobs=%d domains=%d contacts=%d", len(jobs), resolved, contacts)
    return {"jobs": len(jobs), "domains": resolved, "contacts": contacts}


def tailor(limit: int | None = None) -> dict:
    import json as _json
    from .ai_engine import resume_tailor, resume_validator, pdf_compiler, llm_client

    if not config.MASTER_RESUME_PATH.exists():
        log.warning("no master_resume.json; skipping tailor")
        return {"tailored": 0, "skipped": 0, "reason": "no_master"}
    master = _json.loads(config.MASTER_RESUME_PATH.read_text(encoding="utf-8"))

    be = get_backend()
    # Only tailor roles discovered in the last 36h — protects Gemini quota and
    # keeps "today's queue" fresh. Older ENRICHED rows aren't re-touched.
    jobs = be.jobs_by_status("ENRICHED", limit=limit or config.DAILY_ROLE_BUDGET,
                             since_hours=36)
    tailored = alerted = failed = 0

    for j in jobs:
        try:
            out = resume_tailor.tailor(
                master, job_title=j["job_title"], company=j["company_name"],
                description=j.get("description_raw") or "",
            )
        except llm_client.LLMError as e:
            log.warning("tailor %s failed: %s", j["id"], e); failed += 1; continue
        ok, cleaned, reasons = resume_validator.validate(out, master)
        if not ok:
            log.warning("validator rejected %s: %s", j["id"], reasons[:2])
            # fall back to untailored master so a human still has something
            cleaned = dict(master); cleaned["fit_score"] = out.get("fit_score", 0)
        pdf = pdf_compiler.compile_pdf(cleaned, filename_hint=f"{j['company_name']}_{j['job_title']}")
        fit = int(out.get("fit_score") or 0)
        be.update_job(j["id"], fit_score=fit,
                      missing_keywords=_json.dumps(out.get("missing_keywords", [])),
                      description_summary=cleaned.get("summary"),
                      status="TAILORED")
        tailored += 1
        if fit >= config.FIT_SCORE_ALERT_THRESHOLD:
            telegram.alert_job({**j, "fit_score": fit}); alerted += 1
        log.info("tailored %s fit=%d pdf=%s reasons=%d",
                 j["id"], fit, pdf.name, len(reasons))

    log.info("tailor: ok=%d alerted=%d failed=%d", tailored, alerted, failed)
    return {"tailored": tailored, "alerted": alerted, "failed": failed}


def draft_outreach(limit: int = 10) -> dict:
    """Opt-in. Drafts a note per confirmed-source contact. Never sends."""
    import json as _json
    from .ai_engine import note_writer, llm_client

    if not config.MASTER_RESUME_PATH.exists():
        return {"drafts": 0, "reason": "no_master"}
    master = _json.loads(config.MASTER_RESUME_PATH.read_text(encoding="utf-8"))
    be = get_backend()
    jobs = [j for j in be.jobs_by_status("TAILORED", limit=limit)
            if (j.get("fit_score") or 0) >= config.FIT_SCORE_ALERT_THRESHOLD]
    drafted = 0
    for j in jobs:
        for c in be.contacts_for_job(j["id"]):
            try:
                d = note_writer.draft(
                    resume=master, job_title=j["job_title"],
                    company=j["company_name"], description=j.get("description_raw") or "",
                    person_name=c.get("person_name"),
                )
            except llm_client.LLMError as e:
                log.warning("note draft failed: %s", e); continue
            if be.insert_outreach_draft(j["id"], c["id"], d["subject"], d["body"]):
                drafted += 1
    log.info("draft_outreach: %d", drafted)
    return {"drafts": drafted}


def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    p = argparse.ArgumentParser()
    p.add_argument("--prepare-only", action="store_true", help="discover + enrich + tailor only (no submit, no send)")
    p.add_argument("--ingest-only", action="store_true")
    p.add_argument("--enrich-only", action="store_true")
    p.add_argument("--tailor-only", action="store_true")
    p.add_argument("--draft-outreach", action="store_true", help="draft notes (no send)")
    p.add_argument("--use-hunter", action="store_true", help="burn Hunter free-tier credits")
    args = p.parse_args()

    stats: dict = {}
    if args.tailor_only:
        stats["tailor"] = tailor()
    elif args.enrich_only:
        stats["enrich"] = enrich(limit=config.DAILY_ROLE_BUDGET, use_hunter=args.use_hunter)
    else:
        stats["ingest"] = ingest()
        if not args.ingest_only:
            stats["enrich"] = enrich(limit=config.DAILY_ROLE_BUDGET, use_hunter=args.use_hunter)
            stats["tailor"] = tailor()
    if args.draft_outreach:
        stats["outreach"] = draft_outreach()
    print(stats)


if __name__ == "__main__":
    main()
