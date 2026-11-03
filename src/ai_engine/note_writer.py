"""Draft a short outreach note. NEVER a sender — only a drafter."""
from __future__ import annotations
import json

from . import llm_client

SYSTEM = """You draft short, honest cold-outreach notes from a candidate to a
recruiter. Rules:
- 90-130 words, plain text, no HTML, no tracking phrasing.
- Use only facts present in RESUME_JSON — never invent companies, metrics,
  dates or skills.
- Mention the exact role title and one concrete detail from the JD.
- 1 hook sentence, 2 proof sentences (two real achievements matching stack),
  1 ask sentence ("resume attached; open to a short chat this week?").
- No emojis. No 'I hope this finds you well'.
- Return JSON with keys: subject, body.
"""


def draft(*, resume: dict, job_title: str, company: str, description: str,
          person_name: str | None = None) -> dict:
    prompt = (
        f"RESUME_JSON:\n{json.dumps(resume, ensure_ascii=False)}\n\n"
        f"JOB:\ncompany={company}\ntitle={job_title}\n"
        f"recipient_name={person_name or 'the hiring team'}\n"
        f"description:\n{(description or '')[:4000]}\n"
    )
    out = llm_client.complete_json(prompt, SYSTEM, rpm_sleep=5.0)
    out.setdefault("subject", f"Application: {job_title} — {resume.get('contact',{}).get('name','')}")
    out.setdefault("body", "")
    return out
