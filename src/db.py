"""Supabase client + dedup helpers.

If SUPABASE_URL/KEY are unset, falls back to a local SQLite file so Phases 1-2
can be developed without a live Supabase project.
"""
from __future__ import annotations
import hashlib
import json
import re
import sqlite3
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlsplit, urlunsplit

from . import config

try:
    from supabase import create_client, Client  # type: ignore
except Exception:  # pragma: no cover
    create_client = None
    Client = None  # type: ignore


# ---------- hashing / dedup ----------

_SENIORITY_RE = re.compile(
    r"\b(sr\.?|snr|senior|jr\.?|junior|lead|staff|principal|intern|i{1,3}|iv|v)\b",
    re.IGNORECASE,
)
_PAREN_RE = re.compile(r"\([^)]*\)")
_WHITESPACE_RE = re.compile(r"\s+")


def normalise_title(title: str) -> str:
    t = _PAREN_RE.sub(" ", title or "")
    t = _SENIORITY_RE.sub(" ", t)
    t = re.sub(r"[^a-z0-9 ]+", " ", t.lower())
    return _WHITESPACE_RE.sub(" ", t).strip()


def canonical_apply_url(url: str) -> str:
    if not url:
        return ""
    parts = urlsplit(url.strip())
    # strip query + fragment (UTMs etc.)
    return urlunsplit((parts.scheme.lower(), parts.netloc.lower(), parts.path.rstrip("/"), "", ""))


def apply_url_hash(url: str) -> str:
    return hashlib.sha256(canonical_apply_url(url).encode()).hexdigest()


def job_hash(company: str, title: str) -> str:
    key = f"{(company or '').strip().lower()}|{normalise_title(title)}"
    return hashlib.sha256(key.encode()).hexdigest()


# ---------- backend abstraction ----------

class _SqliteBackend:
    def __init__(self, path: Path):
        self.path = path
        self.conn = sqlite3.connect(path)
        self.conn.row_factory = sqlite3.Row
        self._ddl()

    def _ddl(self):
        c = self.conn.cursor()
        c.executescript("""
        CREATE TABLE IF NOT EXISTS jobs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_hash TEXT UNIQUE NOT NULL,
          apply_url_hash TEXT UNIQUE,
          source TEXT NOT NULL,
          company_name TEXT NOT NULL,
          company_domain TEXT,
          job_title TEXT NOT NULL,
          location TEXT,
          job_url TEXT NOT NULL,
          ats_type TEXT,
          description_raw TEXT,
          description_summary TEXT,
          fit_score INTEGER DEFAULT 0,
          missing_keywords TEXT DEFAULT '[]',
          status TEXT DEFAULT 'DISCOVERED',
          discovered_at TEXT DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
          person_name TEXT,
          person_role TEXT,
          email TEXT NOT NULL,
          confidence_score INTEGER DEFAULT 0,
          discovery_method TEXT,
          is_confirmed_source INTEGER DEFAULT 0,
          UNIQUE(job_id, email)
        );
        CREATE TABLE IF NOT EXISTS applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_id INTEGER UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
          tailored_resume_json TEXT NOT NULL,
          resume_pdf_url TEXT,
          prefill_payload TEXT,
          apply_method TEXT,
          applied_at TEXT
        );
        CREATE TABLE IF NOT EXISTS outreach_drafts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
          contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
          subject_line TEXT NOT NULL,
          body_text TEXT NOT NULL,
          send_status TEXT DEFAULT 'DRAFT',
          sent_at TEXT
        );
        """)
        self.conn.commit()

    def insert_job(self, row: dict[str, Any]) -> int | None:
        c = self.conn.cursor()
        try:
            c.execute("""
                INSERT INTO jobs (job_hash, apply_url_hash, source, company_name,
                  company_domain, job_title, location, job_url, ats_type,
                  description_raw, description_summary)
                VALUES (:job_hash,:apply_url_hash,:source,:company_name,
                  :company_domain,:job_title,:location,:job_url,:ats_type,
                  :description_raw,:description_summary)
            """, row)
            self.conn.commit()
            return c.lastrowid
        except sqlite3.IntegrityError:
            return None  # duplicate

    def jobs_by_status(self, status: str, limit: int = 50,
                       since_hours: int | None = None) -> list[dict]:
        c = self.conn.cursor()
        if since_hours:
            c.execute("""SELECT * FROM jobs WHERE status=?
                         AND discovered_at >= datetime('now', ?)
                         ORDER BY discovered_at DESC LIMIT ?""",
                      (status, f"-{int(since_hours)} hours", limit))
        else:
            c.execute("SELECT * FROM jobs WHERE status=? ORDER BY discovered_at DESC LIMIT ?",
                      (status, limit))
        return [dict(r) for r in c.fetchall()]

    def update_job(self, job_id: int, **fields):
        if not fields:
            return
        sets = ",".join(f"{k}=?" for k in fields)
        self.conn.execute(f"UPDATE jobs SET {sets} WHERE id=?", (*fields.values(), job_id))
        self.conn.commit()

    def contacts_for_job(self, job_id: int) -> list[dict]:
        c = self.conn.cursor()
        c.execute("SELECT * FROM contacts WHERE job_id=? AND is_confirmed_source=1", (job_id,))
        return [dict(r) for r in c.fetchall()]

    def insert_outreach_draft(self, job_id: int, contact_id: int, subject: str, body: str) -> int | None:
        try:
            cur = self.conn.cursor()
            cur.execute("""INSERT INTO outreach_drafts
              (job_id, contact_id, subject_line, body_text) VALUES (?,?,?,?)""",
              (job_id, contact_id, subject, body))
            self.conn.commit()
            return cur.lastrowid
        except sqlite3.IntegrityError:
            return None

    def mark_outreach_sent(self, draft_id: int):
        self.conn.execute(
            "UPDATE outreach_drafts SET send_status='SENT_BY_HUMAN', sent_at=datetime('now') WHERE id=?",
            (draft_id,))
        self.conn.commit()

    def drafts(self, status: str = "DRAFT", limit: int = 50) -> list[dict]:
        c = self.conn.cursor()
        c.execute("""SELECT d.*, j.company_name, j.job_title, j.job_url,
                            co.email, co.person_name
                     FROM outreach_drafts d
                     JOIN jobs j ON j.id = d.job_id
                     JOIN contacts co ON co.id = d.contact_id
                     WHERE d.send_status=? ORDER BY d.id DESC LIMIT ?""",
                  (status, limit))
        return [dict(r) for r in c.fetchall()]

    def insert_contact(self, job_id: int, c: dict) -> int | None:
        try:
            cur = self.conn.cursor()
            cur.execute("""INSERT INTO contacts
              (job_id, person_name, person_role, email, confidence_score,
               discovery_method, is_confirmed_source)
              VALUES (?,?,?,?,?,?,?)""",
              (job_id, c.get("person_name"), c.get("person_role"), c["email"],
               int(c.get("confidence_score", 0)), c.get("discovery_method"),
               1 if c.get("is_confirmed_source") else 0))
            self.conn.commit()
            return cur.lastrowid
        except sqlite3.IntegrityError:
            return None


class _SupabaseBackend:
    def __init__(self, client: "Client"):
        self.client = client

    def insert_job(self, row: dict[str, Any]) -> str | None:
        try:
            res = self.client.table("jobs").insert(row).execute()
            return res.data[0]["id"] if res.data else None
        except Exception as e:
            # duplicate unique key -> swallow
            if "duplicate" in str(e).lower() or "23505" in str(e):
                return None
            raise

    def jobs_by_status(self, status: str, limit: int = 50,
                       since_hours: int | None = None) -> list[dict]:
        from datetime import datetime, timedelta, timezone
        q = (self.client.table("jobs").select("*").eq("status", status)
             .order("discovered_at", desc=True).limit(limit))
        if since_hours:
            cutoff = (datetime.now(timezone.utc) - timedelta(hours=since_hours)).isoformat()
            q = q.gte("discovered_at", cutoff)
        res = q.execute()
        return res.data or []

    def update_job(self, job_id: str, **fields):
        if fields:
            self.client.table("jobs").update(fields).eq("id", job_id).execute()

    def contacts_for_job(self, job_id: str) -> list[dict]:
        res = (self.client.table("contacts")
               .select("*").eq("job_id", job_id)
               .eq("is_confirmed_source", True).execute())
        return res.data or []

    def insert_outreach_draft(self, job_id: str, contact_id: str, subject: str, body: str) -> str | None:
        row = {"job_id": job_id, "contact_id": contact_id,
               "subject_line": subject, "body_text": body}
        try:
            res = self.client.table("outreach_drafts").insert(row).execute()
            return res.data[0]["id"] if res.data else None
        except Exception as e:
            if "duplicate" in str(e).lower(): return None
            raise

    def mark_outreach_sent(self, draft_id: str):
        from datetime import datetime, timezone
        self.client.table("outreach_drafts").update({
            "send_status": "SENT_BY_HUMAN",
            "sent_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", draft_id).execute()

    def drafts(self, status: str = "DRAFT", limit: int = 50) -> list[dict]:
        res = (self.client.table("outreach_drafts")
               .select("*, jobs(company_name, job_title, job_url), contacts(email, person_name)")
               .eq("send_status", status).order("id", desc=True).limit(limit).execute())
        return res.data or []

    def insert_contact(self, job_id: str, c: dict) -> str | None:
        row = {
            "job_id": job_id,
            "person_name": c.get("person_name"),
            "person_role": c.get("person_role"),
            "email": c["email"],
            "confidence_score": int(c.get("confidence_score", 0)),
            "discovery_method": c.get("discovery_method"),
            "is_confirmed_source": bool(c.get("is_confirmed_source")),
        }
        try:
            res = self.client.table("contacts").insert(row).execute()
            return res.data[0]["id"] if res.data else None
        except Exception as e:
            if "duplicate" in str(e).lower() or "23505" in str(e):
                return None
            raise


def get_backend():
    if config.SUPABASE_URL and config.SUPABASE_KEY and create_client is not None:
        return _SupabaseBackend(create_client(config.SUPABASE_URL, config.SUPABASE_KEY))
    config.DATA_DIR.mkdir(exist_ok=True)
    return _SqliteBackend(config.DATA_DIR / "jobs.sqlite")


def build_job_row(
    *, source: str, company_name: str, job_title: str, job_url: str,
    location: str | None = None, ats_type: str | None = None,
    description_raw: str | None = None, company_domain: str | None = None,
) -> dict[str, Any]:
    return {
        "job_hash": job_hash(company_name, job_title),
        "apply_url_hash": apply_url_hash(job_url),
        "source": source,
        "company_name": company_name,
        "company_domain": company_domain,
        "job_title": job_title,
        "location": location,
        "job_url": job_url,
        "ats_type": ats_type,
        "description_raw": description_raw,
        "description_summary": None,
    }
