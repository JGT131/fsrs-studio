"""
FSRS Studio DEMO export generators.

All exports are explicitly stamped with:
  - A large diagonal "DEMO — NOT FOR ENGINEERING USE" watermark
  - The full PE engineering disclaimer (INTENDED USE + CRITICAL RESTRICTION)
  - "SIMULATED" / "SAMPLE DATA" tags on every numeric field
  - "PRELIMINARY RFP ANALYSIS TOOL — NOT APPROVED FOR CONSTRUCTION
    OR CLIENT DELIVERABLES" in every page header/footer
"""
from __future__ import annotations

import io
from datetime import datetime, timezone
from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

import ezdxf
from ezdxf.enums import TextEntityAlignment

INTENDED_USE = (
    "INTENDED USE: FSRS is a rapid preliminary analysis tool to help "
    "licensed fire protection engineers quickly evaluate drawings received "
    "for RFP / bidding purposes."
)

CRITICAL_RESTRICTION = (
    "Outputs are NOT for use as final construction documents or client "
    "deliverables. All outputs are preliminary only and must be reviewed, "
    "modified, and stamped by a licensed PE before any permitting, "
    "fabrication, installation, or client submittal."
)

DISCLAIMER_FULL = (
    "[NB: IMPORTANT ENGINEERING DISCLAIMER!] FSRS provides preliminary "
    "design assistance only. All outputs must be reviewed, modified if "
    "necessary, and stamped by a licensed Professional Fire Protection "
    "Engineer (PE) before use for permitting, fabrication, or installation. "
    "FSRS is not a substitute for professional engineering judgment. "
    + INTENDED_USE + " " + CRITICAL_RESTRICTION
)

EXPORT_HEADER_FOOTER = (
    "This document was generated as a preliminary RFP analysis tool only. "
    "It is not approved for construction or client deliverables."
)

WATERMARK_TEXT = "DEMO — NOT FOR ENGINEERING USE"


SAMPLE_HEADS = [
    (10, 10), (20, 10), (30, 10), (40, 10), (50, 10),
    (10, 20), (20, 20), (30, 20), (40, 20), (50, 20),
    (10, 30), (20, 30), (30, 30), (40, 30), (50, 30),
]
SAMPLE_PIPES = [
    ((0, 20), (60, 20)),
    ((10, 10), (50, 10)),
    ((10, 30), (50, 30)),
    ((10, 10), (10, 30)),
    ((20, 10), (20, 30)),
    ((30, 10), (30, 30)),
    ((40, 10), (40, 30)),
    ((50, 10), (50, 30)),
]


# ============================== PDF ==============================
def _draw_pdf_watermark(c, page_w, page_h):
    c.saveState()
    c.setFillColorRGB(0.95, 0.4, 0.15, alpha=0.18)
    c.setFont("Helvetica-Bold", 64)
    c.translate(page_w / 2, page_h / 2)
    c.rotate(30)
    c.drawCentredString(0, 0, WATERMARK_TEXT)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(0, -52, "SIMULATED · SAMPLE DATA · PE REVIEW REQUIRED")
    c.drawCentredString(0, -76, "PRELIMINARY RFP ANALYSIS — NOT FOR CONSTRUCTION")
    c.restoreState()


def _draw_pdf_header(c, page_w, page_h, project):
    c.saveState()
    c.setFillColor(colors.HexColor("#000000"))
    c.rect(0, page_h - 0.85 * inch, page_w, 0.85 * inch, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(0.5 * inch, page_h - 0.28 * inch, "FSRS  ·  FIRE SUPPRESSION RETROFIT STUDIO")
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(colors.HexColor("#F59E0B"))
    c.drawString(0.5 * inch, page_h - 0.46 * inch,
                 "PRELIMINARY RFP ANALYSIS TOOL — NOT APPROVED FOR CONSTRUCTION OR CLIENT DELIVERABLES")
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.HexColor("#94A3B8"))
    c.drawString(0.5 * inch, page_h - 0.65 * inch,
                 f"Project: {project.get('name', 'Untitled')}  "
                 f"·  Generated: {project.get('generated_at', '—')}  "
                 f"·  DEMO BUILD · SIMULATED DATA")
    c.setFillColor(colors.HexColor("#EF4444"))
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(page_w - 0.5 * inch, page_h - 0.28 * inch, "DEMO EXPORT · NOT FOR USE")
    c.restoreState()


def _draw_pdf_footer(c, page_w, page_n):
    c.saveState()
    c.setStrokeColor(colors.HexColor("#F59E0B"))
    c.setLineWidth(1.2)
    c.rect(0.5 * inch, 0.45 * inch, page_w - 1.0 * inch, 0.65 * inch)
    c.setFillColor(colors.HexColor("#92400E"))
    c.setFont("Helvetica-Bold", 7)
    c.drawString(0.6 * inch, 0.96 * inch,
                 "[NB: IMPORTANT ENGINEERING DISCLAIMER!]  This document was generated as a preliminary RFP analysis tool only.")
    c.drawString(0.6 * inch, 0.84 * inch,
                 "It is NOT approved for construction or client deliverables.  All outputs must be reviewed, modified,")
    c.drawString(0.6 * inch, 0.72 * inch,
                 "and stamped by a licensed PE before any permitting, fabrication, installation, or client submittal.")
    c.drawString(0.6 * inch, 0.55 * inch,
                 "FSRS is not a substitute for professional engineering judgment.")
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.grey)
    c.drawRightString(page_w - 0.6 * inch, 0.30 * inch,
                      f"Page {page_n}  ·  FSRS DEMO  ·  PRELIMINARY · PE REVIEW REQUIRED")
    c.restoreState()


def _new_page(c, project, page_n):
    page_w, page_h = LETTER
    _draw_pdf_watermark(c, page_w, page_h)
    _draw_pdf_header(c, page_w, page_h, project)
    _draw_pdf_footer(c, page_w, page_n)


def build_pdf(project, acknowledgment):
    page_w, page_h = LETTER
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=LETTER)
    c.setTitle(f"FSRS DEMO Report — {project.get('name', 'Untitled')}")
    c.setAuthor("FSRS DEMO (preliminary RFP analysis only — not for engineering use)")
    c.setSubject("FSRS DEMO Export — preliminary RFP analysis, PE review required")

    # ===== Page 1: Disclaimer + project header =====
    _new_page(c, project, 1)
    y = page_h - 1.4 * inch

    # Big disclaimer panel
    c.setFillColor(colors.HexColor("#F59E0B"))
    c.rect(0.5 * inch, y - 2.6 * inch, page_w - 1.0 * inch, 2.5 * inch, stroke=1, fill=0)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(0.7 * inch, y - 0.25 * inch, "[NB: IMPORTANT ENGINEERING DISCLAIMER!]")
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.black)
    text_obj = c.beginText(0.7 * inch, y - 0.55 * inch)
    text_obj.setLeading(13)
    for line in [
        "INTENDED USE: FSRS is a rapid preliminary analysis tool to help licensed",
        "fire protection engineers quickly evaluate drawings received for RFP /",
        "bidding purposes.",
        "",
        "CRITICAL RESTRICTION: Outputs are NOT for use as final construction",
        "documents or client deliverables. All outputs are preliminary only and",
        "must be reviewed, modified, and stamped by a licensed PE before any",
        "permitting, fabrication, installation, or client submittal.",
        "",
        "FSRS is not a substitute for professional engineering judgment.",
    ]:
        text_obj.textLine(line)
    c.drawText(text_obj)

    y -= 3.0 * inch
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(colors.black)
    c.drawString(0.6 * inch, y, "FSRS Preliminary RFP Analysis")
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#B91C1C"))
    c.drawString(0.6 * inch, y - 14, "SIMULATED · DEMO BUILD · SAMPLE DATA · NOT A STAMPED ENGINEERING DOCUMENT")

    y -= 0.55 * inch
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.6 * inch, y, "PROJECT")
    c.setFont("Helvetica", 10)
    y -= 16
    for k, v in [
        ("Name", project.get("name", "Untitled")),
        ("Occupancy hazard class", "Ordinary Hazard, Group 1 [SIMULATED]"),
        ("Design density", "0.15 gpm/sq ft [SIMULATED]"),
        ("Design area", "1,500 sq ft [SIMULATED]"),
        ("Total heads (DEMO scene)", str(len(SAMPLE_HEADS)) + " [SIMULATED]"),
        ("Standard reference", "NFPA 13 (preliminary — PE review required)"),
        ("Generated at", project.get("generated_at", "—")),
    ]:
        c.drawString(0.7 * inch, y, f"{k}:")
        c.drawString(2.5 * inch, y, str(v))
        y -= 14

    y -= 14
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.6 * inch, y, "ACKNOWLEDGMENT OF PE REQUIREMENT")
    c.setFont("Helvetica", 9)
    y -= 14
    c.drawString(0.7 * inch, y,
                 "User acknowledged: \"I understand FSRS provides preliminary analysis only. I will not")
    y -= 11
    c.drawString(0.7 * inch, y,
                 "submit any FSRS outputs as final deliverables without full PE review, modification,")
    y -= 11
    c.drawString(0.7 * inch, y, "and stamping.\"")
    y -= 16
    c.setFont("Helvetica", 10)
    for k, v in [
        ("Acknowledged by", acknowledgment.get("name", "—")),
        ("Email", acknowledgment.get("email", "—")),
        ("PE license #", acknowledgment.get("license", "— (not provided)")),
        ("Acknowledged at (UTC)", acknowledgment.get("acknowledged_at", "—")),
        ("Acknowledgment ID", acknowledgment.get("id", "—")),
    ]:
        c.drawString(0.7 * inch, y, f"{k}:")
        c.drawString(2.5 * inch, y, str(v))
        y -= 13

    c.showPage()

    # ===== Page 2: Hydraulics =====
    _new_page(c, project, 2)
    y = page_h - 1.4 * inch
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(colors.black)
    c.drawString(0.6 * inch, y, "Hydraulic Summary — SIMULATED · SAMPLE DATA")
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#B91C1C"))
    c.drawString(0.6 * inch, y - 14,
                 "All values are illustrative only. Not for use as final construction documents. PE review required.")
    c.setFillColor(colors.black)

    y -= 0.5 * inch
    headers = ["Node", "Elev (ft)", "P (psi)", "Q (gpm)", "Pipe D (in)", "Velocity (fps)"]
    rows = [
        ("BOR",   "0.0",  "75.0",  "298.0", "—",   "—"),
        ("N-01",  "12.0", "62.3",  "298.0", "4.0", "7.6"),
        ("N-02",  "12.0", "58.1",  "200.0", "2.5", "13.0"),
        ("N-03",  "12.0", "54.0",  "100.0", "2.0", "10.2"),
        ("REM",   "12.0", "47.8",  "32.0",  "1.0", "13.1"),
    ]
    c.setFont("Helvetica-Bold", 9)
    col_x = [0.6, 1.4, 2.2, 3.0, 3.9, 4.9]
    for x, h in zip(col_x, headers):
        c.drawString(x * inch, y, h)
    c.setLineWidth(0.4)
    c.line(0.6 * inch, y - 3, page_w - 0.6 * inch, y - 3)
    y -= 16
    c.setFont("Helvetica", 9)
    for r in rows:
        for x, v in zip(col_x, r):
            c.drawString(x * inch, y, v)
        y -= 14

    y -= 12
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.6 * inch, y, "RESULT — SIMULATED")
    y -= 16
    c.setFont("Helvetica", 10)
    for k, v in [
        ("Required flow at BOR", "298 gpm [SIMULATED]"),
        ("Required residual pressure", "75 psi [SIMULATED]"),
        ("Friction loss method", "Hazen-Williams, C=120 [SIMULATED]"),
        ("Most remote area", "Bay A · REM head [SIMULATED]"),
        ("Status", "PRELIMINARY RFP ANALYSIS · PE REVIEW REQUIRED"),
    ]:
        c.drawString(0.7 * inch, y, f"{k}:")
        c.drawString(3.0 * inch, y, str(v))
        y -= 14

    c.showPage()

    # ===== Page 3: Plan view =====
    _new_page(c, project, 3)
    y = page_h - 1.4 * inch
    c.setFont("Helvetica-Bold", 16)
    c.drawString(0.6 * inch, y, "Sample Plan View — SIMULATED")
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#B91C1C"))
    c.drawString(0.6 * inch, y - 14,
                 "Illustrative layout only · Not to scale · NOT for construction or client deliverables")
    c.setFillColor(colors.black)

    plan_x = 0.8 * inch
    plan_y = 2.0 * inch
    plan_w = page_w - 1.6 * inch
    plan_h = plan_w * (40.0 / 60.0)
    c.setStrokeColor(colors.HexColor("#999999"))
    c.setLineWidth(0.8)
    c.rect(plan_x, plan_y, plan_w, plan_h, stroke=1, fill=0)
    c.setStrokeColor(colors.HexColor("#DDDDDD"))
    c.setLineWidth(0.3)
    for i in range(1, 6):
        x = plan_x + plan_w * i / 6
        c.line(x, plan_y, x, plan_y + plan_h)
    for i in range(1, 4):
        y2 = plan_y + plan_h * i / 4
        c.line(plan_x, y2, plan_x + plan_w, y2)

    sx = plan_w / 60.0
    sy = plan_h / 40.0
    c.setStrokeColor(colors.HexColor("#EF4444"))
    c.setLineWidth(1.4)
    for (a, b) in SAMPLE_PIPES:
        c.line(plan_x + a[0] * sx, plan_y + a[1] * sy,
               plan_x + b[0] * sx, plan_y + b[1] * sy)
    c.setFillColor(colors.HexColor("#EF4444"))
    for (hx, hy) in SAMPLE_HEADS:
        c.circle(plan_x + hx * sx, plan_y + hy * sy, 3, stroke=0, fill=1)
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#666666"))
    c.drawString(plan_x, plan_y - 14, "Scale: SIMULATED · 60' x 40' bay · 15 heads · 8 pipe segments")

    c.showPage()
    c.save()
    return buf.getvalue()


# ============================== DXF ==============================
def build_dxf(project, acknowledgment):
    doc = ezdxf.new(dxfversion="R2010", setup=True)
    msp = doc.modelspace()

    doc.layers.add(name="FSRS_BAY", color=8)
    doc.layers.add(name="FSRS_PIPES", color=1)
    doc.layers.add(name="FSRS_HEADS", color=1)
    doc.layers.add(name="FSRS_TEXT", color=7)
    doc.layers.add(name="FSRS_WATERMARK", color=30)
    doc.layers.add(name="FSRS_DISCLAIMER", color=40)

    msp.add_lwpolyline(
        [(0, 0), (60, 0), (60, 40), (0, 40), (0, 0)],
        dxfattribs={"layer": "FSRS_BAY"},
    )

    for (a, b) in SAMPLE_PIPES:
        msp.add_line(a, b, dxfattribs={"layer": "FSRS_PIPES"})

    for i, (hx, hy) in enumerate(SAMPLE_HEADS, start=1):
        msp.add_circle((hx, hy), 0.4, dxfattribs={"layer": "FSRS_HEADS"})
        msp.add_text(
            f"H{i:02d}",
            dxfattribs={"layer": "FSRS_TEXT", "height": 0.4},
        ).set_placement((hx + 0.6, hy + 0.4), align=TextEntityAlignment.LEFT)

    msp.add_text(
        WATERMARK_TEXT,
        dxfattribs={"layer": "FSRS_WATERMARK", "height": 3.0, "rotation": 30, "color": 30},
    ).set_placement((10, 14), align=TextEntityAlignment.LEFT)
    msp.add_text(
        "SIMULATED · SAMPLE DATA · PE REVIEW REQUIRED",
        dxfattribs={"layer": "FSRS_WATERMARK", "height": 1.2, "rotation": 30, "color": 30},
    ).set_placement((14, 10), align=TextEntityAlignment.LEFT)
    msp.add_text(
        "PRELIMINARY RFP ANALYSIS — NOT FOR CONSTRUCTION OR CLIENT DELIVERABLES",
        dxfattribs={"layer": "FSRS_WATERMARK", "height": 1.0, "rotation": 30, "color": 30},
    ).set_placement((10, 6), align=TextEntityAlignment.LEFT)

    mtext = msp.add_mtext(
        DISCLAIMER_FULL,
        dxfattribs={
            "layer": "FSRS_DISCLAIMER",
            "char_height": 0.5,
            "width": 58,
            "color": 40,
        },
    )
    mtext.set_location((1, -3))

    info = (
        f"FSRS DEMO EXPORT  ·  SIMULATED\\P"
        f"PRELIMINARY RFP ANALYSIS TOOL — NOT APPROVED FOR CONSTRUCTION OR CLIENT DELIVERABLES\\P\\P"
        f"Project: {project.get('name', 'Untitled')}\\P"
        f"Generated: {project.get('generated_at', '—')}\\P"
        f"Acknowledged by: {acknowledgment.get('name', '—')} <{acknowledgment.get('email', '—')}>\\P"
        f"PE license #: {acknowledgment.get('license', '— (not provided)')}\\P"
        f"Acknowledgment ID: {acknowledgment.get('id', '—')}\\P"
        f"Status: PRELIMINARY · PE REVIEW REQUIRED"
    )
    info_mt = msp.add_mtext(
        info,
        dxfattribs={"layer": "FSRS_TEXT", "char_height": 0.55, "width": 30},
    )
    info_mt.set_location((1, 46))

    text_buf = io.StringIO()
    doc.write(text_buf)
    return text_buf.getvalue().encode("utf-8")


# ============================== IFC ==============================
def build_ifc(project, acknowledgment):
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
    project_name = (project.get("name", "Untitled")
                    .replace("'", "").replace("\\", "/"))
    ack_id = acknowledgment.get("id", "—")
    ack_name = acknowledgment.get("name", "—").replace("'", "")
    ack_email = acknowledgment.get("email", "—").replace("'", "")
    ack_license = acknowledgment.get("license", "— (not provided)").replace("'", "")

    header = (
        "ISO-10303-21;\n"
        "HEADER;\n"
        f"FILE_DESCRIPTION(("
        f"'FSRS DEMO EXPORT — {WATERMARK_TEXT}',"
        f"'SIMULATED · SAMPLE DATA · PE REVIEW REQUIRED',"
        f"'PRELIMINARY RFP ANALYSIS TOOL — NOT FOR CONSTRUCTION OR CLIENT DELIVERABLES',"
        f"'{DISCLAIMER_FULL}'"
        f"),'2;1');\n"
        f"FILE_NAME('FSRS_DEMO_{project_name}.ifc','{now_iso}',"
        "('FSRS DEMO'),('FSRS'),'FSRS DEMO Writer','FSRS DEMO Writer','');\n"
        "FILE_SCHEMA(('IFC2X3'));\n"
        "ENDSEC;\n"
        "DATA;\n"
    )

    body_lines = [
        "#1=IFCPERSON($,$,'FSRS DEMO',$,$,$,$,$);",
        "#2=IFCORGANIZATION($,'FSRS','FSRS Demo Generator',$,$);",
        "#3=IFCPERSONANDORGANIZATION(#1,#2,$);",
        "#4=IFCAPPLICATION(#2,'1.0','FSRS DEMO Writer','FSRS.DEMO');",
        f"#5=IFCOWNERHISTORY(#3,#4,$,.ADDED.,$,#3,#4,{int(datetime.now(timezone.utc).timestamp())});",
        "#6=IFCCARTESIANPOINT((0.,0.,0.));",
        "#7=IFCAXIS2PLACEMENT3D(#6,$,$);",
        "#8=IFCLOCALPLACEMENT($,#7);",
        "#9=IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);",
        "#10=IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.);",
        "#11=IFCUNITASSIGNMENT((#9,#10));",
        f"#12=IFCPROJECT('{ack_id}',#5,'FSRS DEMO — {project_name}',"
        f"'PRELIMINARY RFP ANALYSIS — NOT FOR CONSTRUCTION OR CLIENT DELIVERABLES',"
        "$,$,$,$,#11);",
        "#13=IFCSITE('site-1',#5,'FSRS DEMO Site','SIMULATED · SAMPLE DATA',"
        "$,#8,$,$,.ELEMENT.,$,$,$,$,$);",
        "#14=IFCRELAGGREGATES('rel-1',#5,$,$,#12,(#13));",
        f"#15=IFCANNOTATION('ann-disclaimer',#5,'PE_DISCLAIMER',"
        f"'{DISCLAIMER_FULL}',$,#8,$);",
        f"#16=IFCANNOTATION('ann-watermark',#5,'WATERMARK',"
        f"'{WATERMARK_TEXT} — SIMULATED — PE REVIEW REQUIRED',$,#8,$);",
        "#17=IFCANNOTATION('ann-restriction',#5,'CRITICAL_RESTRICTION',"
        "'PRELIMINARY RFP ANALYSIS TOOL — NOT APPROVED FOR CONSTRUCTION OR CLIENT DELIVERABLES',"
        "$,#8,$);",
        f"#18=IFCANNOTATION('ann-ack',#5,'ACKNOWLEDGMENT',"
        f"'Acknowledged by {ack_name} <{ack_email}> · PE license: {ack_license} · ID {ack_id}',"
        "$,#8,$);",
        "#19=IFCRELCONTAINEDINSPATIALSTRUCTURE('rel-2',#5,$,$,"
        "(#15,#16,#17,#18),#13);",
    ]

    next_id = 100
    head_ids = []
    for i, (hx, hy) in enumerate(SAMPLE_HEADS, start=1):
        body_lines.append(
            f"#{next_id}=IFCCARTESIANPOINT(({float(hx)},{float(hy)},3.0));"
        )
        pt_id = next_id
        next_id += 1
        body_lines.append(f"#{next_id}=IFCAXIS2PLACEMENT3D(#{pt_id},$,$);")
        placement_id = next_id
        next_id += 1
        body_lines.append(f"#{next_id}=IFCLOCALPLACEMENT(#8,#{placement_id});")
        local_pl_id = next_id
        next_id += 1
        body_lines.append(
            f"#{next_id}=IFCANNOTATION('head-{i:02d}',#5,'SPRINKLER_HEAD_{i:02d}',"
            f"'SIMULATED · pendent · K=5.6 · 1/2in [DEMO]',$,#{local_pl_id},$);"
        )
        head_ids.append(next_id)
        next_id += 1

    body_lines.append(
        f"#{next_id}=IFCRELCONTAINEDINSPATIALSTRUCTURE('rel-heads',#5,"
        f"'SIMULATED Heads','SAMPLE DATA',"
        f"({','.join('#'+str(h) for h in head_ids)}),#13);"
    )

    footer = "ENDSEC;\nEND-ISO-10303-21;\n"
    content = header + "\n".join(body_lines) + "\n" + footer
    return content.encode("utf-8")


# ============================== Dispatcher ==============================
EXPORT_TYPES = {"pdf", "dxf", "ifc"}


def generate_export(doc_type, project, acknowledgment):
    doc_type = doc_type.lower()
    if doc_type == "pdf":
        return build_pdf(project, acknowledgment), "application/pdf"
    if doc_type == "dxf":
        return build_dxf(project, acknowledgment), "application/dxf"
    if doc_type == "ifc":
        return build_ifc(project, acknowledgment), "application/x-step"
    raise ValueError(f"Unsupported export type: {doc_type}")
