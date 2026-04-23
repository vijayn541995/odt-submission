from __future__ import annotations

from io import BytesIO
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
import xml.etree.ElementTree as ET

from PIL import Image, ImageDraw, ImageFont


ROOT = Path("/Users/vn105957/Desktop/odt-submission")
DECK = ROOT / "docs" / "Oracle-Developer-Twin-Hackathon-Submission-Template-Deck.pptx"
OUTPUT_IMAGE = ROOT / "docs" / "assets" / "odt-architecture-slide-visual.png"
OUTPUT_EXECUTION_IMAGE = ROOT / "docs" / "assets" / "odt-execution-review-slide-visual.png"
SLIDE_PATH = "ppt/slides/slide4.xml"
RELS_PATH = "ppt/slides/_rels/slide4.xml.rels"
MEDIA_PATH = "ppt/media/odt-architecture-slide-visual.png"
SLIDE_APPENDIX_PATH = "ppt/slides/slide7.xml"
RELS_APPENDIX_PATH = "ppt/slides/_rels/slide7.xml.rels"
MEDIA_APPENDIX_PATH = "ppt/media/odt-execution-review-slide-visual.png"

NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

ET.register_namespace("a", NS["a"])
ET.register_namespace("p", NS["p"])
ET.register_namespace("r", NS["r"])
ET.register_namespace("a16", "http://schemas.microsoft.com/office/drawing/2014/main")
ET.register_namespace("mc", "http://schemas.openxmlformats.org/markup-compatibility/2006")
ET.register_namespace("p14", "http://schemas.microsoft.com/office/powerpoint/2010/main")
ET.register_namespace("", "http://schemas.openxmlformats.org/package/2006/relationships")


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


FONT_REG = "/Library/Fonts/OracleSans_Rg.ttf"
FONT_BOLD = "/Library/Fonts/OracleSans_Bd.ttf"
FONT_SEMIBOLD = "/Library/Fonts/OracleSans_SBd.ttf"


PALETTE = {
    "bg": "#FFFFFF",
    "text": "#1C1C1C",
    "muted": "#5F6368",
    "accent": "#C74634",
    "accent_dark": "#9F2F22",
    "accent_soft": "#F9ECE8",
    "panel": "#FFF7F4",
    "panel_alt": "#FFFDFC",
    "line": "#D8C7C2",
    "review": "#F6EFEA",
    "optional": "#F4F1FF",
    "optional_line": "#7F6ACD",
    "success": "#176D57",
}


def draw_round_rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str, outline: str, radius: int = 28, width: int = 3) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], color: str, width: int = 6) -> None:
    draw.line([start, end], fill=color, width=width)
    arrow = 16
    ex, ey = end
    draw.polygon(
        [
            (ex, ey),
            (ex - arrow, ey - arrow // 2),
            (ex - arrow, ey + arrow // 2),
        ],
        fill=color,
    )


def draw_dashed_line(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], color: str, width: int = 4, dash: int = 12, gap: int = 10) -> None:
    x1, y1 = start
    x2, y2 = end
    total = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
    if total == 0:
        return
    dx = (x2 - x1) / total
    dy = (y2 - y1) / total
    progress = 0.0
    while progress < total:
        segment_end = min(progress + dash, total)
        sx = x1 + dx * progress
        sy = y1 + dy * progress
        ex = x1 + dx * segment_end
        ey = y1 + dy * segment_end
        draw.line([(sx, sy), (ex, ey)], fill=color, width=width)
        progress += dash + gap


def draw_text_block(draw: ImageDraw.ImageDraw, origin: tuple[int, int], lines: list[str], title_font: ImageFont.FreeTypeFont, body_font: ImageFont.FreeTypeFont, title_fill: str, body_fill: str, line_gap: int = 10) -> None:
    x, y = origin
    title, *body = lines
    draw.text((x, y), title, font=title_font, fill=title_fill)
    y += title_font.size + 12
    for line in body:
        draw.text((x, y), line, font=body_font, fill=body_fill)
        y += body_font.size + line_gap


def render_visual() -> bytes:
    width, height = 1600, 720
    image = Image.new("RGBA", (width, height), PALETTE["bg"])
    draw = ImageDraw.Draw(image)

    title_font = font(FONT_BOLD, 28)
    box_title_font = font(FONT_SEMIBOLD, 23)
    body_font = font(FONT_REG, 18)
    small_font = font(FONT_REG, 16)
    pill_font = font(FONT_SEMIBOLD, 17)
    caption_font = font(FONT_SEMIBOLD, 18)

    draw.rounded_rectangle((30, 28, 1570, 690), radius=34, outline=PALETTE["line"], width=2, fill="#FFFEFD")
    draw.text((58, 44), "ODT architecture flow", font=title_font, fill=PALETTE["text"])
    draw.text((58, 84), "Governed planning with optional OCI prompts, OCA execution, and explicit human review.", font=body_font, fill=PALETTE["muted"])

    box_y = 180
    box_h = 210
    box_w = 252
    gap = 38
    x_positions = [62 + i * (box_w + gap) for i in range(5)]
    boxes = [
        ("Input layer", ["Ticket or feature", "Target repo path", "Mockups or refs", "Reviewer notes"], PALETTE["panel_alt"]),
        ("ODT planning engine", ["Intake", "Impact + blast radius", "Design, code, tests", "Compliance + verify"], PALETTE["panel"]),
        ("Control plane", ["ODT Workspace", "Local context server", "Execution health", "Review surface"], PALETTE["panel_alt"]),
        ("OCA execution path", ["Delegate to Codex/Cline", "Target repo execution", "Patch / response file", "Visible terminal status"], PALETTE["panel"]),
        ("Final approval", ["Changed files", "Git diff review", "Human approval", "Merge or submit"], PALETTE["panel_alt"]),
    ]

    centers: list[tuple[int, int]] = []
    for x, (title, body, fill) in zip(x_positions, boxes):
        draw_round_rect(draw, (x, box_y, x + box_w, box_y + box_h), fill=fill, outline=PALETTE["accent"], radius=26)
        draw_text_block(
            draw,
            (x + 18, box_y + 20),
            [title, *[f"- {line}" for line in body]],
            box_title_font,
            body_font,
            PALETTE["accent_dark"],
            PALETTE["text"],
            line_gap=8,
        )
        centers.append((x + box_w // 2, box_y + box_h // 2))

    for left, right in zip(x_positions, x_positions[1:]):
        start = (left + box_w, box_y + box_h // 2)
        end = (right - 10, box_y + box_h // 2)
        draw_arrow(draw, start, end, PALETTE["accent"], width=5)

    optional_box = (420, 112, 780, 164)
    draw_round_rect(draw, optional_box, fill=PALETTE["optional"], outline=PALETTE["optional_line"], radius=20, width=3)
    draw.text((optional_box[0] + 18, optional_box[1] + 11), "OCI GenAI prompt option", font=pill_font, fill=PALETTE["optional_line"])
    draw.text((optional_box[0] + 18, optional_box[1] + 34), "Optional per-stage prompt generation. Safe fallback stays on template prompts.", font=small_font, fill=PALETTE["muted"])
    draw_dashed_line(draw, (600, optional_box[3]), (600, box_y - 14), PALETTE["optional_line"], width=4)
    draw_arrow(draw, (600, box_y - 14), (600, box_y), PALETTE["optional_line"], width=4)

    review_strip = (95, 480, 1505, 635)
    draw_round_rect(draw, review_strip, fill=PALETTE["review"], outline=PALETTE["line"], radius=26, width=2)
    draw.text((120, 500), "Governed human review", font=box_title_font, fill=PALETTE["text"])
    draw.text((120, 534), "The human stays in control at three checkpoints before code is accepted.", font=body_font, fill=PALETTE["muted"])

    pills = [
        (290, "1. Review evidence"),
        (745, "2. Add notes + re-analyze"),
        (1205, "3. Approve repo diff"),
    ]
    for cx, label in pills:
        left = cx - 155
        top = 575
        right = cx + 155
        bottom = 620
        draw_round_rect(draw, (left, top, right, bottom), fill="#FFFFFF", outline=PALETTE["accent"], radius=18, width=2)
        text_box = draw.textbbox((0, 0), label, font=caption_font)
        tx = cx - (text_box[2] - text_box[0]) / 2
        draw.text((tx, top + 10), label, font=caption_font, fill=PALETTE["accent_dark"])

    connectors = [
        ((315, box_y + box_h), (315, review_strip[1])),
        ((855, box_y + box_h), (855, review_strip[1])),
        ((1375, box_y + box_h), (1375, review_strip[1])),
    ]
    for start, end in connectors:
        draw_dashed_line(draw, start, end, PALETTE["accent"], width=3, dash=10, gap=8)

    draw.text((1200, 500), "Human gate stays mandatory", font=caption_font, fill=PALETTE["success"])
    draw.text((1200, 528), "No direct auto-merge path", font=small_font, fill=PALETTE["muted"])

    OUTPUT_IMAGE.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT_IMAGE)

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def render_execution_visual() -> bytes:
    width, height = 1600, 900
    image = Image.new("RGBA", (width, height), PALETTE["bg"])
    draw = ImageDraw.Draw(image)

    title_font = font(FONT_BOLD, 36)
    section_font = font(FONT_SEMIBOLD, 24)
    body_font = font(FONT_REG, 18)
    small_font = font(FONT_REG, 16)
    step_font = font(FONT_SEMIBOLD, 22)
    badge_font = font(FONT_SEMIBOLD, 18)

    draw.rounded_rectangle((32, 32, 1568, 868), radius=36, outline=PALETTE["line"], width=2, fill="#FFFEFD")
    draw.text((64, 58), "OCA execution path + governed review", font=title_font, fill=PALETTE["text"])
    draw.text((64, 108), "Backup technical slide: show this only if judges want the detailed run-time path.", font=body_font, fill=PALETTE["muted"])

    box_y = 220
    box_w = 220
    box_h = 170
    gap = 28
    x_positions = [70 + i * (box_w + gap) for i in range(6)]
    steps = [
        ("1. Enter request", ["Paste work item", "Set repo path", "Attach refs"], PALETTE["panel_alt"]),
        ("2. Run ODT", ["Analyze repo", "Generate artifacts", "Prepare prompts"], PALETTE["panel"]),
        ("3. Human review", ["Review evidence", "Add notes", "Re-analyze if needed"], PALETTE["panel_alt"]),
        ("4. Delegate via OCA", ["Codex or Cline", "Visible session", "Prompt + target repo"], PALETTE["panel"]),
        ("5. Agent updates repo", ["Implement patch", "Return status", "Produce diff"], PALETTE["panel_alt"]),
        ("6. Final approval", ["Inspect changed files", "Approve git diff", "Merge or submit"], PALETTE["panel"]),
    ]

    for x, (title, body, fill) in zip(x_positions, steps):
        draw_round_rect(draw, (x, box_y, x + box_w, box_y + box_h), fill=fill, outline=PALETTE["accent"], radius=24)
        draw.text((x + 16, box_y + 18), title, font=step_font, fill=PALETTE["accent_dark"])
        yy = box_y + 58
        for line in body:
            draw.text((x + 16, yy), f"- {line}", font=body_font, fill=PALETTE["text"])
            yy += 32

    for left, right in zip(x_positions, x_positions[1:]):
        y = box_y + box_h // 2
        draw_arrow(draw, (left + box_w, y), (right - 10, y), PALETTE["accent"], width=5)

    oci_box = (360, 160, 740, 205)
    draw_round_rect(draw, oci_box, fill=PALETTE["optional"], outline=PALETTE["optional_line"], radius=18, width=3)
    draw.text((378, 171), "OCI prompt option: optional stage generation, with safe template fallback", font=badge_font, fill=PALETTE["optional_line"])
    draw_dashed_line(draw, (550, oci_box[3]), (550, box_y - 10), PALETTE["optional_line"], width=4)
    draw_arrow(draw, (550, box_y - 10), (550, box_y), PALETTE["optional_line"], width=4)

    artifact_strip = (100, 470, 1500, 565)
    draw_round_rect(draw, artifact_strip, fill=PALETTE["panel_alt"], outline=PALETTE["line"], radius=24, width=2)
    draw.text((128, 492), "Evidence produced before delegation", font=section_font, fill=PALETTE["text"])
    draw.text(
        (128, 528),
        "intake.json  |  impact signals  |  tech design  |  code workpack  |  unit tests  |  execute/prompt.md",
        font=body_font,
        fill=PALETTE["muted"],
    )

    governance_strip = (100, 615, 1500, 790)
    draw_round_rect(draw, governance_strip, fill=PALETTE["review"], outline=PALETTE["line"], radius=24, width=2)
    draw.text((128, 640), "Governance rules", font=section_font, fill=PALETTE["text"])

    rules = [
        (138, "Human review before delegation"),
        (525, "Reviewer notes can trigger re-analysis"),
        (935, "No direct auto-merge path"),
        (1235, "Repo diff approval stays human"),
    ]
    for x, label in rules:
        draw_round_rect(draw, (x, 704, x + 250, 748), fill="#FFFFFF", outline=PALETTE["accent"], radius=16, width=2)
        bbox = draw.textbbox((0, 0), label, font=small_font)
        tx = x + (250 - (bbox[2] - bbox[0])) / 2
        draw.text((tx, 718), label, font=small_font, fill=PALETTE["accent_dark"])

    draw.text((128, 684), "ODT plans and explains the work. OCA executes the implementation path. The human still owns acceptance.", font=body_font, fill=PALETTE["muted"])

    OUTPUT_EXECUTION_IMAGE.parent.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT_EXECUTION_IMAGE)

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def remove_body_textbox(root: ET.Element) -> None:
    sp_tree = root.find("p:cSld/p:spTree", NS)
    if sp_tree is None:
        return
    for element in list(sp_tree):
        if element.tag != f"{{{NS['p']}}}sp":
            continue
        c_nv_pr = element.find("p:nvSpPr/p:cNvPr", NS)
        if c_nv_pr is not None and c_nv_pr.get("name") == "TextBox 3":
            sp_tree.remove(element)


def remove_all_pictures(root: ET.Element) -> None:
    sp_tree = root.find("p:cSld/p:spTree", NS)
    if sp_tree is None:
        return
    for element in list(sp_tree):
        if element.tag != f"{{{NS['p']}}}pic":
            continue
        sp_tree.remove(element)


def add_picture(root: ET.Element, rel_id: str, *, name: str, descr: str, x: str, y: str, cx: str, cy: str) -> None:
    sp_tree = root.find("p:cSld/p:spTree", NS)
    if sp_tree is None:
        return
    pic = ET.Element(f"{{{NS['p']}}}pic")
    nv_pic_pr = ET.SubElement(pic, f"{{{NS['p']}}}nvPicPr")
    c_nv_pr = ET.SubElement(nv_pic_pr, f"{{{NS['p']}}}cNvPr", {"id": "11", "name": name, "descr": descr})
    ext_lst = ET.SubElement(c_nv_pr, f"{{{NS['a']}}}extLst")
    ET.SubElement(
        ET.SubElement(ext_lst, f"{{{NS['a']}}}ext", {"uri": "{FF2B5EF4-FFF2-40B4-BE49-F238E27FC236}"}),
        "{http://schemas.microsoft.com/office/drawing/2014/main}creationId",
        {"id": "{B03F0A2A-AE7C-4F0C-BE2D-5B3E7FA61012}"},
    )
    c_nv_pic_pr = ET.SubElement(nv_pic_pr, f"{{{NS['p']}}}cNvPicPr")
    ET.SubElement(c_nv_pic_pr, f"{{{NS['a']}}}picLocks", {"noChangeAspect": "1"})
    ET.SubElement(nv_pic_pr, f"{{{NS['p']}}}nvPr")

    blip_fill = ET.SubElement(pic, f"{{{NS['p']}}}blipFill")
    ET.SubElement(blip_fill, f"{{{NS['a']}}}blip", {f"{{{NS['r']}}}embed": rel_id})
    ET.SubElement(blip_fill, f"{{{NS['a']}}}srcRect")
    ET.SubElement(blip_fill, f"{{{NS['a']}}}stretch")

    sp_pr = ET.SubElement(pic, f"{{{NS['p']}}}spPr")
    xfrm = ET.SubElement(sp_pr, f"{{{NS['a']}}}xfrm")
    ET.SubElement(xfrm, f"{{{NS['a']}}}off", {"x": x, "y": y})
    ET.SubElement(xfrm, f"{{{NS['a']}}}ext", {"cx": cx, "cy": cy})
    prst = ET.SubElement(sp_pr, f"{{{NS['a']}}}prstGeom", {"prst": "rect"})
    ET.SubElement(prst, f"{{{NS['a']}}}avLst")

    sp_tree.append(pic)


def ensure_relationship(rels_root: ET.Element, target: str) -> str:
    for rel in list(rels_root):
        if rel.get("Target") == target:
            return rel.get("Id", "rId3")

    used_ids = {rel.get("Id", "") for rel in rels_root}
    rel_id = "rId3"
    while rel_id in used_ids:
        number = int(rel_id[3:]) + 1
        rel_id = f"rId{number}"

    ET.SubElement(
        rels_root,
        "{http://schemas.openxmlformats.org/package/2006/relationships}Relationship",
        {
            "Id": rel_id,
            "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
            "Target": target,
        },
    )
    return rel_id


def remove_unused_image_relationships(rels_root: ET.Element) -> None:
    for rel in list(rels_root):
        rel_type = rel.get("Type", "")
        if rel_type.endswith("/image"):
            rels_root.remove(rel)


def patch_deck(image_bytes: bytes, appendix_image_bytes: bytes) -> None:
    with ZipFile(DECK, "r") as zin:
        items = {info.filename: zin.read(info.filename) for info in zin.infolist()}

    slide_root = ET.fromstring(items[SLIDE_PATH])
    rels_root = ET.fromstring(items[RELS_PATH])
    appendix_root = ET.fromstring(items[SLIDE_APPENDIX_PATH])
    appendix_rels_root = ET.fromstring(items[RELS_APPENDIX_PATH])

    remove_body_textbox(slide_root)
    remove_all_pictures(slide_root)
    rel_id = ensure_relationship(rels_root, "../media/odt-architecture-slide-visual.png")
    add_picture(
        slide_root,
        rel_id,
        name="ODT Architecture Visual",
        descr="ODT architecture visual",
        x="1150000",
        y="1820000",
        cx="9750000",
        cy="4387500",
    )

    remove_all_pictures(appendix_root)
    remove_unused_image_relationships(appendix_rels_root)
    appendix_rel_id = ensure_relationship(appendix_rels_root, "../media/odt-execution-review-slide-visual.png")
    add_picture(
        appendix_root,
        appendix_rel_id,
        name="ODT Execution Review Visual",
        descr="ODT execution path and governed review visual",
        x="0",
        y="0",
        cx="12192000",
        cy="6858000",
    )

    items[SLIDE_PATH] = ET.tostring(slide_root, encoding="utf-8", xml_declaration=True)
    items[RELS_PATH] = ET.tostring(rels_root, encoding="utf-8", xml_declaration=True)
    items[SLIDE_APPENDIX_PATH] = ET.tostring(appendix_root, encoding="utf-8", xml_declaration=True)
    items[RELS_APPENDIX_PATH] = ET.tostring(appendix_rels_root, encoding="utf-8", xml_declaration=True)
    items[MEDIA_PATH] = image_bytes
    items[MEDIA_APPENDIX_PATH] = appendix_image_bytes

    with ZipFile(DECK, "w", ZIP_DEFLATED) as zout:
        for filename, data in items.items():
            zout.writestr(filename, data)


def main() -> None:
    image_bytes = render_visual()
    appendix_image_bytes = render_execution_visual()
    patch_deck(image_bytes, appendix_image_bytes)
    print(DECK)
    print(OUTPUT_IMAGE)
    print(OUTPUT_EXECUTION_IMAGE)


if __name__ == "__main__":
    main()
