"""Gemini Flash wrapper with structured-JSON output + Groq fallback on 429.

Does NOT block when keys are missing; raises so the caller can decide to skip
AI steps and ship an untailored master resume instead.
"""
from __future__ import annotations
import json
import logging
import time
from typing import Any

import httpx

from .. import config

log = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"


class LLMError(RuntimeError):
    pass


def _extract_json(text: str) -> dict:
    text = (text or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:].lstrip()
    try:
        return json.loads(text)
    except Exception:
        # last-ditch: slice first {...} block
        start = text.find("{"); end = text.rfind("}")
        if start >= 0 and end > start:
            return json.loads(text[start:end + 1])
        raise


def _gemini(prompt: str, system: str) -> dict:
    if not config.GEMINI_API_KEY:
        raise LLMError("no GEMINI_API_KEY")
    r = httpx.post(
        GEMINI_URL,
        params={"key": config.GEMINI_API_KEY},
        json={
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system}]},
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.3,
            },
        },
        timeout=60.0,
    )
    if r.status_code == 429:
        raise LLMError("gemini_429")
    if r.status_code != 200:
        raise LLMError(f"gemini {r.status_code}: {r.text[:200]}")
    data = r.json()
    try:
        txt = data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        raise LLMError(f"gemini bad shape: {str(data)[:200]}")
    return _extract_json(txt)


def _groq(prompt: str, system: str) -> dict:
    if not config.GROQ_API_KEY:
        raise LLMError("no GROQ_API_KEY (fallback unavailable)")
    r = httpx.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {config.GROQ_API_KEY}"},
        json={
            "model": GROQ_MODEL,
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        },
        timeout=60.0,
    )
    if r.status_code != 200:
        raise LLMError(f"groq {r.status_code}: {r.text[:200]}")
    txt = r.json()["choices"][0]["message"]["content"]
    return _extract_json(txt)


def complete_json(prompt: str, system: str, *, rpm_sleep: float = 5.0) -> dict:
    """Primary → Gemini; on 429 or missing key → Groq fallback."""
    try:
        time.sleep(rpm_sleep)
        return _gemini(prompt, system)
    except LLMError as e:
        if "429" in str(e) or "no GEMINI_API_KEY" in str(e):
            log.warning("gemini unavailable (%s); trying groq", e)
            return _groq(prompt, system)
        raise
