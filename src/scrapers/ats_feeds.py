"""Greenhouse / Lever / Ashby public JSON boards."""
from __future__ import annotations
import logging
from typing import Iterable, Iterator
import httpx
from bs4 import BeautifulSoup

from ..db import build_job_row

log = logging.getLogger(__name__)
TIMEOUT = httpx.Timeout(20.0)
HEADERS = {"User-Agent": "JobHunter/1.0 (+personal use)"}


def _strip_html(html: str | None) -> str:
    if not html:
        return ""
    return BeautifulSoup(html, "html.parser").get_text("\n", strip=True)


def fetch_greenhouse(slug: str) -> Iterator[dict]:
    url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true"
    try:
        r = httpx.get(url, timeout=TIMEOUT, headers=HEADERS)
        r.raise_for_status()
    except Exception as e:
        log.warning("greenhouse %s failed: %s", slug, e)
        return
    for j in r.json().get("jobs", []):
        yield build_job_row(
            source="greenhouse",
            company_name=slug,
            job_title=j.get("title", ""),
            job_url=j.get("absolute_url", ""),
            location=(j.get("location") or {}).get("name"),
            ats_type="greenhouse",
            description_raw=_strip_html(j.get("content")),
        )


def fetch_lever(slug: str) -> Iterator[dict]:
    url = f"https://api.lever.co/v0/postings/{slug}?mode=json"
    try:
        r = httpx.get(url, timeout=TIMEOUT, headers=HEADERS)
        if r.status_code in (401, 403, 404):
            return
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        log.warning("lever %s failed: %s", slug, e)
        return
    if not isinstance(data, list):
        return
    for j in data:
        yield build_job_row(
            source="lever",
            company_name=slug,
            job_title=j.get("text", ""),
            job_url=j.get("hostedUrl", "") or j.get("applyUrl", ""),
            location=(j.get("categories") or {}).get("location"),
            ats_type="lever",
            description_raw=_strip_html(j.get("descriptionPlain") or j.get("description")),
        )


def fetch_ashby(slug: str) -> Iterator[dict]:
    url = f"https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=false"
    try:
        r = httpx.get(url, timeout=TIMEOUT, headers=HEADERS)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        log.warning("ashby %s failed: %s", slug, e)
        return
    for j in data.get("jobs", []):
        yield build_job_row(
            source="ashby",
            company_name=slug,
            job_title=j.get("title", ""),
            job_url=j.get("jobUrl", "") or j.get("applyUrl", ""),
            location=j.get("locationName"),
            ats_type="ashby",
            description_raw=_strip_html(j.get("descriptionHtml") or j.get("descriptionPlain")),
        )


def fetch_all(greenhouse: Iterable[str] = (), lever: Iterable[str] = (),
              ashby: Iterable[str] = ()) -> Iterator[dict]:
    for s in greenhouse:
        yield from fetch_greenhouse(s)
    for s in lever:
        yield from fetch_lever(s)
    for s in ashby:
        yield from fetch_ashby(s)
