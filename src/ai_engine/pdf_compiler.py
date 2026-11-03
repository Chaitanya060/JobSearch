"""Render tailored resume JSON -> single-column ATS-safe PDF.

WeasyPrint is preferred (CSS fidelity). ReportLab fallback produces a plain-text
PDF so Phase 4 keeps working on machines where WeasyPrint's native deps are not
installed.
"""
from __future__ import annotations
import logging
import re
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from .. import config

log = logging.getLogger(__name__)
_TEMPLATE_DIR = config.DATA_DIR
_SLUG_RE = re.compile(r"[^A-Za-z0-9]+")


def _env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(_TEMPLATE_DIR)),
        autoescape=select_autoescape(["html"]),
    )


def _slug(name: str) -> str:
    return _SLUG_RE.sub("_", (name or "resume").strip()).strip("_")


def _render_html(tailored: dict) -> str:
    tpl = _env().get_template("resume_template.html")
    return tpl.render(**tailored)


def _weasy(html: str, out: Path) -> bool:
    try:
        from weasyprint import HTML  # type: ignore
    except Exception as e:
        log.info("weasyprint unavailable: %s", e)
        return False
    try:
        HTML(string=html, base_url=str(_TEMPLATE_DIR)).write_pdf(str(out))
        return True
    except Exception as e:
        log.warning("weasyprint render failed: %s", e)
        return False


def _reportlab(tailored: dict, out: Path) -> bool:
    try:
        from reportlab.lib.pagesizes import LETTER
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    except Exception as e:
        log.error("reportlab unavailable: %s", e)
        return False
    styles = getSampleStyleSheet()
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontSize=11, spaceAfter=4)
    body = styles["BodyText"]
    doc = SimpleDocTemplate(str(out), pagesize=LETTER,
                            leftMargin=0.6*inch, rightMargin=0.6*inch,
                            topMargin=0.5*inch, bottomMargin=0.5*inch)
    flow = []
    c = tailored.get("contact", {}) or {}
    flow.append(Paragraph(f"<b>{c.get('name','')}</b>", styles["Title"]))
    flow.append(Paragraph(" · ".join(x for x in [c.get("email"), c.get("phone"), c.get("location")] if x), body))
    if tailored.get("summary"):
        flow += [Paragraph("Summary", h2), Paragraph(tailored["summary"], body)]
    if tailored.get("skills"):
        flow += [Paragraph("Skills", h2), Paragraph(" · ".join(tailored["skills"]), body)]
    for section, title in (("experience", "Experience"), ("projects", "Projects")):
        items = tailored.get(section) or []
        if not items: continue
        flow.append(Paragraph(title, h2))
        for e in items:
            head = f"<b>{e.get('role') or e.get('name','')}</b> — {e.get('company') or ', '.join(e.get('stack') or [])}"
            dates = f"{e.get('start','')} – {e.get('end','')}" if e.get("start") else ""
            flow.append(Paragraph(f"{head} <font color='#555'>{dates}</font>", body))
            for b in e.get("bullets") or []:
                flow.append(Paragraph(f"• {b}", body))
            flow.append(Spacer(1, 4))
    for ed in tailored.get("education") or []:
        flow += [Paragraph("Education", h2),
                 Paragraph(f"<b>{ed.get('degree','')}</b> — {ed.get('school','')} "
                           f"<font color='#555'>({ed.get('start','')} – {ed.get('end','')})</font>", body)]
    try:
        doc.build(flow); return True
    except Exception as e:
        log.error("reportlab build failed: %s", e); return False


def compile_pdf(tailored: dict, *, filename_hint: str | None = None) -> Path:
    name = (tailored.get("contact") or {}).get("name") or "resume"
    fname = f"{_slug(name)}_{_slug(filename_hint or 'Resume')}.pdf"
    out = config.OUTPUT_DIR / fname
    html = _render_html(tailored)
    if _weasy(html, out):
        return out
    if _reportlab(tailored, out):
        return out
    # last resort: write raw HTML so a human can print-to-PDF
    out_html = out.with_suffix(".html")
    out_html.write_text(html, encoding="utf-8")
    log.warning("No PDF engine available; wrote HTML to %s", out_html)
    return out_html
