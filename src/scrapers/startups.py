"""Startup-focused source: Hacker News 'Who is hiring?' monthly thread.

Uses HN's official public Firebase API (no key, documented).
YC Work at a Startup is NOT included here because its listing requires
scraping with an embedded search key — the user can add YC-batch companies
to data/companies.yaml under greenhouse/lever/ashby instead.
"""
from __future__ import annotations
import logging
import re
from typing import Iterator

import httpx
from bs4 import BeautifulSoup

from ..db import build_job_row

log = logging.getLogger(__name__)
TIMEOUT = httpx.Timeout(20.0)
HEADERS = {"User-Agent": "JobHunter/1.0 (+personal use)"}

HN_SEARCH = "https://hn.algolia.com/api/v1/search_by_date"
HN_ITEM = "https://hacker-news.firebaseio.com/v0/item/{id}.json"

_LOC_RE = re.compile(
    r"\b(REMOTE|ONSITE|HYBRID|SF|NYC|LONDON|BERLIN|BENGALURU|BANGALORE|HYDERABAD|INDIA|US|EU|EUROPE)\b",
    re.I,
)
_URL_RE = re.compile(r"https?://[^\s<>'\"]+")


def _latest_whoishiring_id() -> int | None:
    try:
        r = httpx.get(HN_SEARCH, params={
            "query": "Ask HN: Who is hiring?",
            "tags": "story,author_whoishiring",
            "hitsPerPage": 1,
        }, headers=HEADERS, timeout=TIMEOUT)
        hits = r.json().get("hits", [])
        return int(hits[0]["objectID"]) if hits else None
    except Exception as e:
        log.warning("whoishiring search failed: %s", e)
        return None


def _first_url(text: str) -> str:
    m = _URL_RE.search(text or "")
    return m.group(0).rstrip(".,)'\"") if m else ""


def _strip_html(html: str) -> str:
    return BeautifulSoup(html or "", "html.parser").get_text("\n", strip=True)


def _parse_header(first_line: str) -> tuple[str, str]:
    """Return (company, title). Common HN format: 'Company | Title | Location | ...'"""
    parts = [p.strip(" -•|").strip() for p in first_line.split("|")]
    parts = [p for p in parts if p]
    if len(parts) >= 2:
        return parts[0], parts[1]
    m = re.match(r"(.+?)\s+(?:is\s+)?hiring\s+(.+)", first_line, re.I)
    if m:
        return m.group(1).strip(), m.group(2).strip(" .")
    return (parts[0] if parts else ""), ""


def fetch_whoishiring(limit: int = 300) -> Iterator[dict]:
    story_id = _latest_whoishiring_id()
    if not story_id:
        return
    try:
        r = httpx.get(HN_ITEM.format(id=story_id), headers=HEADERS, timeout=TIMEOUT)
        kids = (r.json() or {}).get("kids") or []
    except Exception as e:
        log.warning("whoishiring item failed: %s", e)
        return

    for kid_id in kids[:limit]:
        try:
            kr = httpx.get(HN_ITEM.format(id=kid_id), headers=HEADERS, timeout=TIMEOUT)
            item = kr.json() or {}
        except Exception:
            continue
        if item.get("deleted") or item.get("dead") or item.get("type") != "comment":
            continue
        text = _strip_html(item.get("text", ""))
        if len(text) < 80:
            continue
        first = text.split("\n", 1)[0]
        company, title = _parse_header(first)
        if not company or not title:
            continue
        url = _first_url(text) or f"https://news.ycombinator.com/item?id={kid_id}"
        loc_m = _LOC_RE.search(first + " " + text[:200])
        loc = loc_m.group(0).title() if loc_m else "Remote"
        yield build_job_row(
            source="hn_whoishiring",
            company_name=company[:120],
            job_title=title[:160],
            job_url=url,
            location=loc,
            ats_type="hn",
            description_raw=text[:4000],
        )


def fetch_all(hn_limit: int = 300) -> Iterator[dict]:
    yield from fetch_whoishiring(limit=hn_limit)
