"""Resolve company name -> official domain.

Order:
  1) If apply URL already lives on company's own domain (not an ATS), use that.
  2) Clearbit Autocomplete (keyless, legacy).
  3) Return None.
Then validate with a DNS MX lookup.
"""
from __future__ import annotations
import logging
import re
from functools import lru_cache
from urllib.parse import urlsplit

import httpx

try:
    import dns.resolver  # type: ignore
except Exception:  # pragma: no cover
    dns = None  # type: ignore

log = logging.getLogger(__name__)
TIMEOUT = httpx.Timeout(10.0)
HEADERS = {"User-Agent": "JobHunter/1.0 (+personal use)"}

ATS_HOSTS = {
    "boards.greenhouse.io", "boards-api.greenhouse.io", "job-boards.greenhouse.io",
    "jobs.lever.co", "api.lever.co",
    "jobs.ashbyhq.com", "api.ashbyhq.com",
    "remoteok.com", "remoteok.io",
    "himalayas.app", "weworkremotely.com", "jobicy.com",
    "linkedin.com", "indeed.com", "glassdoor.com",
    "workable.com", "myworkdayjobs.com", "smartrecruiters.com",
    "bamboohr.com", "jobvite.com", "icims.com",
}


def _host(url: str) -> str:
    return urlsplit(url or "").netloc.lower().lstrip("www.")


def _is_ats(host: str) -> bool:
    return host in ATS_HOSTS or any(host.endswith("." + a) for a in ATS_HOSTS)


def _from_apply_url(url: str) -> str | None:
    h = _host(url)
    if not h or _is_ats(h):
        return None
    # strip common careers subdomain prefix if present
    base = re.sub(r"^(careers|jobs|apply|hire|work)\.", "", h)
    if _is_ats(base):
        return None
    return base if "." in base else None


def _clearbit_suggest(name: str) -> str | None:
    try:
        r = httpx.get("https://autocomplete.clearbit.com/v1/companies/suggest",
                      params={"query": name}, timeout=TIMEOUT, headers=HEADERS)
        if r.status_code != 200:
            return None
        items = r.json() or []
    except Exception as e:
        log.debug("clearbit suggest %s failed: %s", name, e)
        return None
    for item in items:
        d = (item.get("domain") or "").lower()
        if d:
            return d
    return None


@lru_cache(maxsize=512)
def _has_mx(domain: str) -> bool:
    if not domain or dns is None:
        return bool(domain)  # skip check if dnspython missing
    try:
        answers = dns.resolver.resolve(domain, "MX", lifetime=5.0)
        return any(a for a in answers)
    except Exception:
        try:
            dns.resolver.resolve(domain, "A", lifetime=5.0)
            return True
        except Exception:
            return False


def resolve(company_name: str, apply_url: str | None = None) -> str | None:
    if apply_url:
        d = _from_apply_url(apply_url)
        if d and _has_mx(d):
            return d
    if company_name:
        d = _clearbit_suggest(company_name)
        if d and _has_mx(d):
            return d
    return None
