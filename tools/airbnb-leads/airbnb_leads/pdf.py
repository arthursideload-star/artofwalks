"""Render a scored lead list as a PDF."""

from __future__ import annotations

from collections import Counter
from datetime import date
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

from .models import Lead
from .scoring import band

PAGE = landscape(A4)
MARGIN = 14 * mm


def _styles(accent: colors.Color) -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "title", parent=base["Title"], fontName="Helvetica-Bold",
            fontSize=26, leading=30, textColor=accent, alignment=TA_LEFT),
        "subtitle": ParagraphStyle(
            "subtitle", parent=base["Normal"], fontName="Helvetica",
            fontSize=12, leading=16, textColor=colors.HexColor("#444444")),
        "h2": ParagraphStyle(
            "h2", parent=base["Heading2"], fontName="Helvetica-Bold",
            fontSize=13, leading=16, textColor=accent, spaceBefore=10, spaceAfter=6),
        "body": ParagraphStyle(
            "body", parent=base["Normal"], fontName="Helvetica",
            fontSize=9, leading=12),
        "cell": ParagraphStyle(
            "cell", parent=base["Normal"], fontName="Helvetica",
            fontSize=7.6, leading=9.4),
        "cellb": ParagraphStyle(
            "cellb", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=7.6, leading=9.4),
        "note": ParagraphStyle(
            "note", parent=base["Normal"], fontName="Helvetica-Oblique",
            fontSize=8, leading=11, textColor=colors.HexColor("#666666")),
    }


class _Doc(BaseDocTemplate):
    """Adds the page furniture: footer, page numbers, sample-data watermark."""

    def __init__(self, path: str, brand: str, accent: colors.Color,
                 synthetic: bool, **kw):
        super().__init__(path, pagesize=PAGE,
                         leftMargin=MARGIN, rightMargin=MARGIN,
                         topMargin=MARGIN, bottomMargin=MARGIN + 6 * mm, **kw)
        self.brand = brand
        self.accent = accent
        self.synthetic = synthetic
        frame = Frame(self.leftMargin, self.bottomMargin,
                      self.width, self.height, id="body")
        self.addPageTemplates([PageTemplate(id="main", frames=[frame],
                                            onPage=self._furniture)])

    def _furniture(self, canvas, doc):
        canvas.saveState()
        width, height = PAGE

        if self.synthetic:
            canvas.setFont("Helvetica-Bold", 62)
            canvas.setFillColor(colors.HexColor("#d94f4f"))
            canvas.setFillAlpha(0.10)
            canvas.translate(width / 2, height / 2)
            canvas.rotate(30)
            canvas.drawCentredString(0, 0, "SAMPLE DATA")
            canvas.rotate(-30)
            canvas.translate(-width / 2, -height / 2)
            canvas.setFillAlpha(1)

        canvas.setStrokeColor(colors.HexColor("#dddddd"))
        canvas.setLineWidth(0.5)
        canvas.line(MARGIN, MARGIN + 4 * mm, width - MARGIN, MARGIN + 4 * mm)

        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(colors.HexColor("#888888"))
        canvas.drawString(MARGIN, MARGIN, f"{self.brand} - lead list")
        canvas.drawCentredString(
            width / 2, MARGIN,
            "Business contact data for B2B outreach. Honour opt-outs; "
            "include an unsubscribe route in every mail.")
        canvas.drawRightString(width - MARGIN, MARGIN, f"Page {canvas.getPageNumber()}")
        canvas.restoreState()


def _summary_table(leads: list[Lead], st) -> Table:
    by_country = Counter(l.country or "unknown" for l in leads)
    by_band = Counter(band(l.score) for l in leads)

    rows = [[Paragraph("<b>By country</b>", st["cell"]), "",
             Paragraph("<b>By priority band</b>", st["cell"]), ""]]
    countries = sorted(by_country.items(), key=lambda kv: -kv[1])
    bands = sorted(by_band.items())
    for i in range(max(len(countries), len(bands))):
        left = countries[i] if i < len(countries) else ("", "")
        right = bands[i] if i < len(bands) else ("", "")
        rows.append([
            Paragraph(str(left[0]), st["cell"]),
            Paragraph(str(left[1]), st["cell"]),
            Paragraph(str(right[0]), st["cell"]),
            Paragraph(str(right[1]), st["cell"]),
        ])

    table = Table(rows, colWidths=[110, 40, 130, 40], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW", (0, 0), (-1, 0), 0.6, colors.HexColor("#cccccc")),
    ]))
    return table


def _lead_table(leads: list[Lead], st, accent: colors.Color) -> Table:
    header = ["#", "Company", "Contact", "Title", "Location", "Email", "Score", "Band"]
    rows: list[list[Any]] = [[Paragraph(f"<b>{h}</b>", st["cellb"]) for h in header]]

    for i, lead in enumerate(leads, 1):
        location = ", ".join(p for p in (lead.city, lead.country) if p)
        rows.append([
            Paragraph(str(i), st["cell"]),
            Paragraph(lead.company or "-", st["cellb"]),
            Paragraph(lead.contact_name or "-", st["cell"]),
            Paragraph(lead.title or "-", st["cell"]),
            Paragraph(location or "-", st["cell"]),
            Paragraph(lead.email or "-", st["cell"]),
            Paragraph(str(lead.score), st["cell"]),
            Paragraph(band(lead.score).split(" - ")[0], st["cell"]),
        ])

    table = Table(rows, colWidths=[24, 148, 104, 104, 92, 186, 32, 30],
                  repeatRows=1, hAlign="LEFT")
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), accent),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#dddddd")),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    for i in range(1, len(rows)):
        if i % 2 == 0:
            style.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#f6f8f7")))
    table.setStyle(TableStyle(style))
    return table


def _detail_cards(leads: list[Lead], st, accent: colors.Color) -> list[Any]:
    story: list[Any] = [PageBreak(), Paragraph("Priority contacts - detail", st["h2"])]
    story.append(Paragraph(
        "The highest-scoring rows, with the reasoning behind each score.",
        st["note"]))
    story.append(Spacer(1, 6))

    for i, lead in enumerate(leads, 1):
        location = ", ".join(p for p in (lead.city, lead.country) if p)
        facts = [
            ("Contact", f"{lead.contact_name or '-'} - {lead.title or '-'}"),
            ("Email", f"{lead.email or '-'}  ({lead.email_status or 'unknown'})"),
            ("Location", location or "-"),
            ("Website", lead.website or "-"),
            ("Size", lead.employees or "-"),
            ("Listings", lead.listings or "-"),
            ("Why", "; ".join(lead.score_reasons) or "-"),
        ]
        rows = [[Paragraph(f"<b>{k}</b>", st["cell"]), Paragraph(str(v), st["cell"])]
                for k, v in facts]
        inner = Table(rows, colWidths=[64, 640], hAlign="LEFT")
        inner.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 1.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 1.5),
        ]))
        heading = Paragraph(
            f"<b>{i}. {lead.company}</b> &nbsp;&nbsp;"
            f"<font color='#777777'>score {lead.score} - {band(lead.score)}</font>",
            st["body"])
        story.append(KeepTogether([heading, inner, Spacer(1, 8)]))
    return story


def render(leads: list[Lead], out_path: Path | str, *, cfg: dict[str, Any],
           source_description: str, synthetic: bool) -> Path:
    """Write the PDF and return its path."""
    pdf_cfg = cfg.get("pdf", {})
    accent = colors.HexColor(pdf_cfg.get("accent", "#1f6f5c"))
    brand = pdf_cfg.get("brand", "ArtOfWalks")
    st = _styles(accent)

    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    doc = _Doc(str(out_path), brand=brand, accent=accent, synthetic=synthetic,
               title=f"{brand} - {pdf_cfg.get('title', 'Lead list')}",
               author=brand)

    story: list[Any] = [
        Paragraph(brand, st["title"]),
        Paragraph(pdf_cfg.get("title", "Lead list"), st["subtitle"]),
        Spacer(1, 10),
    ]

    if synthetic:
        story += [
            Paragraph(
                "<b>SAMPLE DATA.</b> These rows are generated fixtures on "
                "example.com addresses, produced to exercise the pipeline. "
                "They are not real prospects and must not be contacted. "
                "Re-run with <b>--provider apollo</b> or <b>--provider csv</b> "
                "for a real list.",
                ParagraphStyle("warn", parent=st["body"], fontSize=9.5, leading=13,
                               textColor=colors.HexColor("#a33"),
                               borderPadding=6, borderWidth=0.8,
                               borderColor=colors.HexColor("#d94f4f"),
                               backColor=colors.HexColor("#fdf3f3"))),
            Spacer(1, 10),
        ]

    meta = [
        ("Generated", date.today().isoformat()),
        ("Leads", str(len(leads))),
        ("Source", source_description),
        ("Target", "Vacation-rental management companies, European holiday regions"),
    ]
    meta_rows = [[Paragraph(f"<b>{k}</b>", st["body"]), Paragraph(v, st["body"])]
                 for k, v in meta]
    meta_table = Table(meta_rows, colWidths=[80, 620], hAlign="LEFT")
    meta_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story += [meta_table, Spacer(1, 12),
              Paragraph("Breakdown", st["h2"]), _summary_table(leads, st),
              Spacer(1, 14), Paragraph("All leads", st["h2"]),
              _lead_table(leads, st, accent)]

    if pdf_cfg.get("include_detail_cards", True) and leads:
        limit = int(pdf_cfg.get("detail_card_limit", 25))
        story += _detail_cards(leads[:limit], st, accent)

    doc.build(story)
    return out_path
