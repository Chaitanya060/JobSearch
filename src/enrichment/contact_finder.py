"""Confirmed-source-only contact discovery.

Rules (hard):
  - Only store emails extracted from JD / company pages (jd_regex, web_crawl)
    OR verified by Hunter free tier.
  - Never guess {first}.{last}@domain.
  - Reject role aliases: noreply, no-reply, support, info, privacy, press,
    legal, abuse, postmaster, security, marketing, sales, help.
  - Only emails whose host matches the resolved company domain are kept.
"""
from __future__ import annotations
import logging
import re
from dataclasses import dataclass
from typing import Iterable
from urllib.parse import urlsplit, urljoin

import httpx
from bs4 import BeautifulSoup

from .. import config

log = logging.getLogger(__name__)
TIMEOUT = httpx.Timeout(15.0)
HEADERS = {"User-Agent": "JobHunter/1.0 (+personal use)"}

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

ROLE_BLOCKLIST = {
    "noreply", "no-reply", "donotreply", "do-not-reply",
    "support", "info", "hello", "contact", "privacy", "press",
    "legal", "abuse", "postmaster", "security", "marketing",
    "sales", "help", "admin", "webmaster", "office",
}

PAGE_CANDIDATES = ("/careers", "/jobs", "/contact", "/about", "/team", "/people")


@dataclass
class Contact:
    email: str
    person_name: str | None
    person_role: str | None
    discovery_method: str      # 'jd_regex' | 'web_crawl' | 'hunter_api'
    confidence_score: int      # 0-100
    is_confirmed_source: bool  # always True if we store it


def _domain_match(email: str, domain: str) -> bool:
    host = email.rsplit("@", 1)[-1].lower()
    d = domain.lower().lstrip("www.")
    return host == d or host.endswith("." + d)


def _role_ok(email: str) -> bool:
    local = email.split("@", 1)[0].lower()
    return local not in ROLE_BLOCKLIST and not any(local.startswith(b + ".") for b in ROLE_BLOCKLIST)


def _extract_emails(text: str, domain: str) -> set[str]:
    out: set[str] = set()
    for m in EMAIL_RE.finditer(text or ""):
        e = m.group(0).lower()
        if _domain_match(e, domain) and _role_ok(e):
            out.add(e)
    return out


def from_jd(description: str, domain: str) -> list[Contact]:
    return [
        Contact(email=e, person_name=None, person_role=None,
                discovery_method="jd_regex", confidence_score=70,
                is_confirmed_source=True)
        for e in _extract_emails(description, domain)
    ]


def _fetch(url: str) -> str:
    try:
        r = httpx.get(url, timeout=TIMEOUT, headers=HEADERS, follow_redirects=True)
        if r.status_code == 200 and "text/html" in r.headers.get("content-type", ""):
            return r.text
    except Exception as e:
        log.debug("fetch %s failed: %s", url, e)
    return ""


def from_web(domain: str, max_pages: int = 4) -> list[Contact]:
    if not domain:
        return []
    base = f"https://{domain}"
    found: dict[str, Contact] = {}
    for path in PAGE_CANDIDATES[:max_pages]:
        html = _fetch(urljoin(base + "/", path))
        if not html:
            continue
        soup = BeautifulSoup(html, "html.parser")
        # mailto: links are the strongest signal
        for a in soup.select("a[href^='mailto:']"):
            e = a["href"][7:].split("?")[0].strip().lower()
            if _domain_match(e, domain) and _role_ok(e) and e not in found:
                found[e] = Contact(email=e, person_name=a.get_text(strip=True) or None,
                                   person_role=None, discovery_method="web_crawl",
                                   confidence_score=85, is_confirmed_source=True)
        for e in _extract_emails(soup.get_text(" "), domain):
            if e not in found:
                found[e] = Contact(email=e, person_name=None, person_role=None,
                                   discovery_method="web_crawl",
                                   confidence_score=75, is_confirmed_source=True)
    return list(found.values())


def from_hunter(domain: str, limit: int = 5) -> list[Contact]:
    """Hunter free tier — small monthly budget. No multi-account rotation."""
    if not (config.HUNTER_API_KEY and domain):
        return []
    try:
        r = httpx.get("https://api.hunter.io/v2/domain-search",
                      params={"domain": domain, "api_key": config.HUNTER_API_KEY,
                              "limit": limit, "type": "personal"},
                      timeout=TIMEOUT, headers=HEADERS)
        if r.status_code != 200:
            log.warning("hunter %s -> %s", domain, r.status_code)
            return []
        data = r.json().get("data", {}) or {}
    except Exception as e:
        log.warning("hunter %s failed: %s", domain, e); return []
    out: list[Contact] = []
    for em in data.get("emails", []):
        e = (em.get("value") or "").lower()
        if not e or not _role_ok(e) or not _domain_match(e, domain):
            continue
        # Only keep rows Hunter marks as sources-backed (confirmed somewhere public).
        sources = em.get("sources") or []
        if em.get("verification", {}).get("status") == "invalid" or not sources:
            continue
        out.append(Contact(
            email=e,
            person_name=" ".join(x for x in [em.get("first_name"), em.get("last_name")] if x) or None,
            person_role=em.get("position"),
            discovery_method="hunter_api",
            confidence_score=min(100, int(em.get("confidence") or 60)),
            is_confirmed_source=True,
        ))
    return out


def discover(*, company_name: str, domain: str | None,
             description: str | None = None,
             use_hunter: bool = False) -> list[Contact]:
    if not domain:
        return []
    seen: dict[str, Contact] = {}
    for c in from_jd(description or "", domain):
        seen.setdefault(c.email, c)
    for c in from_web(domain):
        seen.setdefault(c.email, c)
    if use_hunter:
        for c in from_hunter(domain):
            seen.setdefault(c.email, c)
    return list(seen.values())
