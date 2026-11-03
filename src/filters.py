"""Pre-DB keyword + seniority filter.

Tuned for startup JDs:
  - 1 target-keyword hit is enough (startup JDs are short).
  - 'founding', 'founding engineer', 'generalist', 'early engineer' pass without
    keyword hits (startup signal).
  - Senior/Staff/Principal/Director still blocked.
  - Location gate honoured when a location is present.
"""
from __future__ import annotations
import re
from . import config

_SKILL_WORD = re.compile(r"[a-zA-Z][a-zA-Z0-9+#.\-]*")
_STARTUP_POSITIVE = ("founding", "generalist", "early engineer",
                     "founding engineer", "first engineer")


def _tokens(text: str) -> set[str]:
    return {m.group(0).lower() for m in _SKILL_WORD.finditer(text or "")}


def passes_filters(row: dict) -> bool:
    title = (row.get("job_title") or "")
    desc = row.get("description_raw", "") or ""
    text = f"{title} {desc}"
    tl = title.lower()
    tx = text.lower()

    # seniority block (still a hard no)
    for bad in config.EXCLUDE_SENIORITY:
        if bad and bad.lower() in tl:
            return False
    if re.search(r"\b(1[0-9]|[2-9][0-9])\+?\s*(years|yrs)\b", text, re.I):
        return False

    # startup positive signal: accept even with 0 keyword hits
    if any(sig in tx for sig in _STARTUP_POSITIVE):
        return _location_ok(row)

    toks = _tokens(text)
    hits = sum(1 for k in config.TARGET_KEYWORDS if k.lower() in toks)
    if hits < 1:
        return False
    return _location_ok(row)


def _location_ok(row: dict) -> bool:
    if not config.TARGET_LOCATIONS:
        return True
    loc = (row.get("location") or "").lower()
    if not loc:
        return True  # unknown location — don't drop
    return any(l.lower() in loc for l in config.TARGET_LOCATIONS)
