"""Public RSS / JSON feed boards: RemoteOK, Himalayas, WeWorkRemotely, Jobicy."""
from __future__ import annotations
import logging
from typing import Iterator
import httpx
import feedparser

from ..db import build_job_row

log = logging.getLogger(__name__)
TIMEOUT = httpx.Timeout(20.0)
HEADERS = {"User-Agent": "JobHunter/1.0 (+personal use)"}


def fetch_remoteok() -> Iterator[dict]:
    try:
        r = httpx.get("https://remoteok.com/api", timeout=TIMEOUT, headers=HEADERS)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        log.warning("remoteok failed: %s", e); return
    for j in data:
        if not isinstance(j, dict) or "position" not in j:
            continue
        yield build_job_row(
            source="remoteok",
            company_name=j.get("company", ""),
            job_title=j.get("position", ""),
            job_url=j.get("url", "") or j.get("apply_url", ""),
            location=j.get("location") or "Remote",
            ats_type="remoteok",
            description_raw=j.get("description", ""),
            company_domain=(j.get("company_url") or "").replace("https://", "").replace("http://", "").strip("/") or None,
        )


def fetch_himalayas() -> Iterator[dict]:
    try:
        r = httpx.get("https://himalayas.app/jobs/api", timeout=TIMEOUT, headers=HEADERS)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        log.warning("himalayas failed: %s", e); return
    for j in data.get("jobs", []):
        yield build_job_row(
            source="himalayas",
            company_name=(j.get("companyName") or ""),
            job_title=j.get("title", ""),
            job_url=j.get("applicationLink", "") or j.get("guid", ""),
            location=", ".join(j.get("locationRestrictions", []) or []) or "Remote",
            ats_type="himalayas",
            description_raw=j.get("excerpt", ""),
        )


def fetch_rss(feed_url: str, source_name: str) -> Iterator[dict]:
    try:
        parsed = feedparser.parse(feed_url)
    except Exception as e:
        log.warning("rss %s failed: %s", source_name, e); return
    for entry in parsed.entries:
        title = entry.get("title", "")
        # Many boards format as "Company: Title" or "Title at Company"
        company = ""
        if ":" in title:
            company, _, title_rest = title.partition(":")
            title = title_rest.strip()
            company = company.strip()
        elif " at " in title:
            title, _, company = title.partition(" at ")
            company = company.strip()
        yield build_job_row(
            source=source_name,
            company_name=company or source_name,
            job_title=title,
            job_url=entry.get("link", ""),
            location=entry.get("location", "Remote"),
            ats_type=source_name,
            description_raw=entry.get("summary", ""),
        )


def fetch_weworkremotely() -> Iterator[dict]:
    yield from fetch_rss("https://weworkremotely.com/remote-jobs.rss", "weworkremotely")


def fetch_jobicy() -> Iterator[dict]:
    yield from fetch_rss("https://jobicy.com/?feed=job_feed", "jobicy")


def fetch_all() -> Iterator[dict]:
    yield from fetch_remoteok()
    yield from fetch_himalayas()
    yield from fetch_weworkremotely()
    yield from fetch_jobicy()
