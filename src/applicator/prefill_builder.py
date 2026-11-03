"""Build a prefill payload / URL for an apply page. NEVER submits.

Two outputs:
  1) prefill_url: apply URL with safe query params (first_name/last_name/email/
     phone/linkedin/resume_url) that most ATS forms autofill from.
  2) field_map: a dict a Playwright helper can type into a form by common
     selectors — stop before clicking submit, screenshot, and hand off.
"""
from __future__ import annotations
from urllib.parse import urlencode, urlsplit, urlunsplit, parse_qsl


_SUPPORTED_PARAMS = {
    "first_name", "last_name", "email", "phone",
    "linkedin", "github", "portfolio", "resume_url",
}


def _split_name(full: str) -> tuple[str, str]:
    parts = (full or "").split()
    if not parts:
        return "", ""
    return parts[0], " ".join(parts[1:])


def build(*, resume: dict, apply_url: str, resume_pdf_url: str | None = None) -> dict:
    contact = resume.get("contact") or {}
    first, last = _split_name(contact.get("name", ""))
    links = contact.get("links") or {}
    fields = {
        "first_name": first,
        "last_name": last,
        "email": contact.get("email", ""),
        "phone": contact.get("phone", ""),
        "linkedin": links.get("linkedin", ""),
        "github": links.get("github", ""),
        "portfolio": links.get("portfolio", ""),
        "resume_url": resume_pdf_url or "",
    }
    fields = {k: v for k, v in fields.items() if v}

    parts = urlsplit(apply_url)
    existing = dict(parse_qsl(parts.query, keep_blank_values=True))
    merged = {**existing, **{k: v for k, v in fields.items() if k in _SUPPORTED_PARAMS}}
    prefill_url = urlunsplit((parts.scheme, parts.netloc, parts.path,
                              urlencode(merged), parts.fragment))

    # Common ATS selectors (used by a Playwright assist script, if run)
    selector_hints = {
        "first_name": ["#first_name", "input[name='first_name']", "input[name='firstName']"],
        "last_name":  ["#last_name",  "input[name='last_name']",  "input[name='lastName']"],
        "email":      ["#email", "input[type='email']", "input[name='email']"],
        "phone":      ["#phone", "input[name='phone']", "input[type='tel']"],
        "linkedin":   ["input[name*='linkedin' i]"],
        "github":     ["input[name*='github' i]"],
        "portfolio":  ["input[name*='portfolio' i]", "input[name*='website' i]"],
    }
    return {
        "prefill_url": prefill_url,
        "fields": fields,
        "selector_hints": selector_hints,
        "apply_url": apply_url,
    }
