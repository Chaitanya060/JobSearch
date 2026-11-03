"""Score fit (0-100) and tailor the master resume to a job description.

Returns a TailoredResume dict:
{
  "fit_score": int,
  "missing_keywords": [str, ...],
  "summary": str,
  "skills": [str, ...],       # 8-12, chosen from master skills_inventory
  "experience": [{"company","role","start","end","location","bullets":[...]}],
  "projects":   [{"name","stack","url","bullets":[...]}],
  "education":  <copied from master>,
  "contact":    <copied from master>,
  "certifications": <copied from master>
}
"""
from __future__ import annotations
import json
import logging
from typing import Any

from . import llm_client

log = logging.getLogger(__name__)

SYSTEM = """You are an ATS optimization engine.
Given MASTER_RESUME_JSON and TARGET_JOB_DESCRIPTION:
1. Score compatibility 0-100 as 'fit_score'.
2. Rewrite 'summary' (max 3 lines) aligning the real background to the role.
3. Select 8-12 'skills' from skills_inventory using the JD's exact terms.
4. Reorder/refine 'experience' and 'projects' bullets so real keywords surface.
5. List 'missing_keywords' from the JD that the resume does not evidence.

HARD RULES (your output is machine-validated and REJECTED on violation):
- Never invent a company, role, project name, metric, date, or skill not in
  MASTER_RESUME_JSON.
- Bullets must stay close to the original: paraphrase, reorder, trim; do not add
  facts.
- 'skills' MUST be a subset of MASTER_RESUME_JSON.skills_inventory.
- Return a single JSON object only. No prose, no markdown fences.
"""

TEMPLATE = """MASTER_RESUME_JSON:
{master}

TARGET_JOB_DESCRIPTION (company={company}, title={title}):
{jd}

Return JSON with keys: fit_score, missing_keywords, summary, skills,
experience, projects, education, contact, certifications.
Copy education, contact, certifications verbatim from MASTER_RESUME_JSON.
"""


def tailor(master: dict, *, job_title: str, company: str, description: str) -> dict:
    prompt = TEMPLATE.format(
        master=json.dumps(master, ensure_ascii=False),
        company=company or "",
        title=job_title or "",
        jd=(description or "")[:12000],
    )
    out = llm_client.complete_json(prompt, SYSTEM)
    # defensive copies for passthrough sections if the model omitted them
    for k in ("education", "contact", "certifications"):
        out.setdefault(k, master.get(k))
    out.setdefault("missing_keywords", [])
    out.setdefault("fit_score", 0)
    return out
