"""Programmatic truth enforcement over tailored resume JSON.

Rejects any edit not traceable to master_resume.json. Returns (ok, cleaned,
reasons). On soft failures (unknown skills, foreign bullets) we DROP the bad
rows and keep the rest; on hard failures (invented company, invented project,
invented date, invented role) we reject outright.
"""
from __future__ import annotations
import re
from typing import Any

from rapidfuzz import fuzz

SIM_THRESHOLD = 72  # tunable; 72 ≈ paraphrase with ~1 clause rewritten
_WS = re.compile(r"\s+")


def _norm(s: str) -> str:
    return _WS.sub(" ", (s or "").lower()).strip()


def _bullet_pool(entries: list[dict], key: str = "bullets") -> list[str]:
    out = []
    for e in entries or []:
        for b in e.get(key, []) or []:
            if isinstance(b, str) and b.strip():
                out.append(_norm(b))
    return out


def _bullet_matches(bullet: str, pool: list[str]) -> bool:
    nb = _norm(bullet)
    if not nb:
        return False
    if nb in pool:
        return True
    # fuzzy: paraphrase allowed, fabrication not
    best = max((fuzz.token_set_ratio(nb, p) for p in pool), default=0)
    return best >= SIM_THRESHOLD


def validate(tailored: dict, master: dict) -> tuple[bool, dict, list[str]]:
    reasons: list[str] = []
    cleaned = dict(tailored)

    # --- skills must subset master skills_inventory ---
    master_skills = {_norm(s) for s in master.get("skills_inventory", [])}
    out_skills = []
    for s in tailored.get("skills") or []:
        if _norm(s) in master_skills:
            out_skills.append(s)
        else:
            reasons.append(f"dropped unknown skill: {s}")
    cleaned["skills"] = out_skills

    # --- experience: company + role + dates must match an entry in master ---
    master_exp = master.get("experience") or []
    master_exp_keys = {(_norm(e.get("company", "")), _norm(e.get("role", "")))
                       for e in master_exp}
    cleaned_exp = []
    for e in tailored.get("experience") or []:
        key = (_norm(e.get("company", "")), _norm(e.get("role", "")))
        if key not in master_exp_keys:
            reasons.append(f"HARD: invented experience {key}")
            return False, cleaned, reasons
        # dates must match if present in master
        src = next(m for m in master_exp
                   if (_norm(m.get("company", "")), _norm(m.get("role", ""))) == key)
        for date_key in ("start", "end"):
            sv, tv = _norm(src.get(date_key, "")), _norm(e.get(date_key, ""))
            if sv and tv and sv != tv:
                reasons.append(f"HARD: changed {date_key} for {key}: {sv} -> {tv}")
                return False, cleaned, reasons
        pool = _bullet_pool([src])
        kept = []
        for b in e.get("bullets") or []:
            if _bullet_matches(b, pool):
                kept.append(b)
            else:
                reasons.append(f"dropped foreign bullet in {key}: {b[:70]}")
        e_out = dict(e); e_out["bullets"] = kept
        cleaned_exp.append(e_out)
    cleaned["experience"] = cleaned_exp

    # --- projects: name must exist in master; bullets must trace ---
    master_proj = master.get("projects") or []
    master_proj_names = {_norm(p.get("name", "")) for p in master_proj}
    cleaned_proj = []
    for p in tailored.get("projects") or []:
        pname = _norm(p.get("name", ""))
        if pname not in master_proj_names:
            reasons.append(f"HARD: invented project {p.get('name')}")
            return False, cleaned, reasons
        src = next(m for m in master_proj if _norm(m.get("name", "")) == pname)
        pool = _bullet_pool([src])
        kept = []
        for b in p.get("bullets") or []:
            if _bullet_matches(b, pool):
                kept.append(b)
            else:
                reasons.append(f"dropped foreign bullet in {p.get('name')}: {b[:70]}")
        p_out = dict(p); p_out["bullets"] = kept
        cleaned_proj.append(p_out)
    cleaned["projects"] = cleaned_proj

    return True, cleaned, reasons
