"""Streamlit review queue.

Lists tailored roles with fit score, resume preview, prefill link, and the
option to mark as applied / draft outreach. Submits NOTHING on its own.
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from src import config
from src.db import get_backend
from src.applicator import prefill_builder


st.set_page_config(page_title="Job Hunter — Review Queue", layout="wide")
st.title("Job Hunter — Review Queue")
st.caption("Discovery and prep are automated. Submission and email are yours.")

be = get_backend()

status = st.sidebar.selectbox("Status", ["TAILORED", "ENRICHED", "DISCOVERED", "APPLIED"], 0)
window = st.sidebar.selectbox("Discovered within",
    ["Last 24 hours", "Last 48 hours", "Last 7 days", "All time"], 0)
window_hours = {"Last 24 hours": 24, "Last 48 hours": 48,
                "Last 7 days": 24 * 7, "All time": None}[window]
limit = st.sidebar.slider("Rows", 5, 200, 50)
min_fit = st.sidebar.slider("Min fit", 0, 100, 0)

jobs = [j for j in be.jobs_by_status(status, limit=limit, since_hours=window_hours)
        if (j.get("fit_score") or 0) >= min_fit]
st.sidebar.write(f"{len(jobs)} rows · {window.lower()}")

master_resume = {}
if config.MASTER_RESUME_PATH.exists():
    master_resume = json.loads(config.MASTER_RESUME_PATH.read_text(encoding="utf-8"))
else:
    st.warning("No data/master_resume.json yet — prefill will be empty.")

for j in jobs:
    with st.container(border=True):
        c1, c2 = st.columns([3, 1])
        with c1:
            st.subheader(f"{j['job_title']} — {j['company_name']}")
            st.write(f"**Fit:** {j.get('fit_score',0)}   ·   {j.get('location','?')}   ·   `{j.get('source','?')}`")
            if j.get("description_summary"):
                st.caption(j["description_summary"])
            st.markdown(f"[Open apply page →]({j['job_url']})")
            missing = j.get("missing_keywords")
            if missing:
                try:
                    kws = json.loads(missing) if isinstance(missing, str) else missing
                    if kws:
                        st.write("**Missing keywords:** " + ", ".join(kws))
                except Exception:
                    pass
        with c2:
            # resume PDF for this job (name-matched)
            slug = j["company_name"].replace(" ", "_")
            matches = list(config.OUTPUT_DIR.glob(f"*_{slug}_*.pdf")) + \
                      list(config.OUTPUT_DIR.glob(f"*_{slug}*.pdf"))
            if matches:
                pdf = matches[0]
                with open(pdf, "rb") as f:
                    st.download_button("Tailored resume PDF", f, pdf.name, "application/pdf",
                                       key=f"dl_{j['id']}")
            if st.button("Build prefill link", key=f"pf_{j['id']}"):
                pf = prefill_builder.build(resume=master_resume, apply_url=j["job_url"])
                st.code(pf["prefill_url"], language=None)
                st.json(pf["fields"])
            if st.button("Mark applied (I submitted it)", key=f"ap_{j['id']}"):
                be.update_job(j["id"], status="APPLIED")
                st.success("Marked APPLIED. Reload to refresh.")

st.header("Outreach drafts (manual send only)")
st.caption("These are DRAFTS. Copy, personalise, send from your own Gmail — never from the cron.")
drafts = be.drafts("DRAFT", limit=25) if hasattr(be, "drafts") else []
for d in drafts:
    with st.container(border=True):
        st.write(f"**To:** {d.get('email')} ({d.get('person_name') or 'unknown'})")
        st.write(f"**Role:** {d.get('job_title')} — {d.get('company_name')}")
        st.text_input("Subject", d.get("subject_line", ""), key=f"sub_{d['id']}")
        st.text_area("Body", d.get("body_text", ""), height=180, key=f"body_{d['id']}")
        if st.button("I sent this myself", key=f"sent_{d['id']}"):
            be.mark_outreach_sent(d["id"])
            st.success("Marked SENT_BY_HUMAN.")
