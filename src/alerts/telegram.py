"""Telegram push alerts for high-fit roles. No-ops when creds missing."""
from __future__ import annotations
import logging
import httpx
from .. import config

log = logging.getLogger(__name__)


def send(text: str) -> bool:
    if not (config.TELEGRAM_BOT_TOKEN and config.TELEGRAM_CHAT_ID):
        log.info("telegram skipped (no creds): %s", text[:80])
        return False
    url = f"https://api.telegram.org/bot{config.TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        r = httpx.post(url, json={
            "chat_id": config.TELEGRAM_CHAT_ID,
            "text": text,
            "parse_mode": "Markdown",
            "disable_web_page_preview": False,
        }, timeout=10.0)
        return r.status_code == 200
    except Exception as e:
        log.warning("telegram send failed: %s", e)
        return False


def alert_job(job: dict) -> bool:
    msg = (
        f"*{job.get('job_title','?')}* — {job.get('company_name','?')}\n"
        f"Fit: {job.get('fit_score',0)} · {job.get('location','?')}\n"
        f"{job.get('job_url','')}"
    )
    return send(msg)
