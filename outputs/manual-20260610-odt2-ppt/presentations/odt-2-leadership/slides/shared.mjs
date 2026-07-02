export const W = 1280;
export const H = 720;

export const C = {
  paper: "#F7F4EF",
  white: "#FFFFFF",
  ink: "#2B2B2B",
  charcoal: "#333333",
  muted: "#6B7280",
  line: "#DED8D2",
  red: "#C74634",
  redDeep: "#8C1D18",
  redSoft: "#FBE5E1",
  cream: "#FFF4D6",
  blue: "#2E5F8A",
  blueSoft: "#E8F0F7",
  green: "#2F7D4B",
  greenSoft: "#E8F5ED",
  purple: "#7A5AC8",
  purpleSoft: "#EFEAFB",
  amber: "#D99B2B",
  amberSoft: "#FFF7E8",
  dark: "#111827",
  dark2: "#0B1018",
  darkLine: "#344054",
  transparent: "#00000000",
};

export const FONT = {
  title: "Aptos Display",
  body: "Aptos",
  serif: "Georgia",
};

export function shape(slide, geometry, x, y, w, h, fill = C.transparent, line = C.transparent, lineWidth = 0, rotate = 0) {
  return slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: line, width: lineWidth },
    rotate,
  });
}

export function textBox(slide, text, x, y, w, h, opts = {}) {
  const {
    size = 20,
    color = C.ink,
    bold = false,
    italic = false,
    face = FONT.body,
    align = "left",
    valign = "top",
    fill = C.transparent,
    line = C.transparent,
    lineWidth = 0,
    inset = 0,
    letterSpacing = 0,
  } = opts;
  const s = shape(slide, "rect", x, y, w, h, fill, line, lineWidth);
  s.text = String(text ?? "");
  s.text.fontSize = size;
  s.text.color = color;
  s.text.bold = Boolean(bold);
  s.text.italic = Boolean(italic);
  s.text.typeface = face;
  s.text.alignment = align;
  s.text.verticalAlignment = valign;
  s.text.insets = { left: inset, right: inset, top: inset, bottom: inset };
  s.text.letterSpacing = letterSpacing;
  return s;
}

export function addBackground(slide, opts = {}) {
  const { dark = false, slideNo = "", section = "ODT 2.0" } = opts;
  slide.background.fill = dark ? C.dark : C.paper;
  if (dark) {
    shape(slide, "rect", 0, 0, W, H, C.dark, C.transparent, 0);
    shape(slide, "rect", 0, 0, W, 9, C.red, C.transparent, 0);
  } else {
    shape(slide, "rect", 0, 0, W, H, C.paper, C.transparent, 0);
  }
  fingerprint(slide, dark ? "#FFFFFF10" : "#E8E2DC", 720, 34, 430, 96);
  if (!dark) {
    textBox(slide, "Confidential - Oracle Restricted (Employees Only)", 36, 8, 360, 16, {
      size: 9,
      color: "#8A8580",
      face: FONT.body,
    });
  }
  textBox(slide, String(slideNo), 36, 690, 26, 16, { size: 10, color: dark ? "#CBD5E1" : "#807A76" });
  textBox(slide, section, 76, 690, 460, 16, { size: 9, color: dark ? "#CBD5E1" : "#807A76" });
  odtCornerMark(slide, 1190, 674, dark);
}

export function odtCornerMark(slide, x, y, dark = false) {
  shape(slide, "rect", x, y, 44, 44, C.red, C.transparent, 0);
  shape(slide, "roundRect", x + 10, y + 15, 24, 12, C.transparent, C.white, 2.4);
}

export function fingerprint(slide, color, x, y, w, h) {
  const lines = 58;
  for (let i = 0; i < lines; i += 1) {
    const col = i % 16;
    const row = Math.floor(i / 16);
    const px = x + col * 26 + (row % 2) * 12;
    const py = y + row * 24 + (col % 3) * 4;
    const len = 18 + (i % 5) * 10;
    const rot = -18 + (i % 7) * 7;
    shape(slide, "roundRect", px, py, len, 3, color, C.transparent, 0, rot);
  }
}

export function title(slide, heading, subtitle, opts = {}) {
  const { x = 64, y = 42, w = 1040, dark = false, headingSize = 34, subtitleSize = 19 } = opts;
  textBox(slide, heading, x, y, w, 78, {
    size: headingSize,
    bold: true,
    face: FONT.title,
    color: dark ? C.white : C.ink,
  });
  if (subtitle) {
    textBox(slide, subtitle, x, y + 86, w, 48, {
      size: subtitleSize,
      face: FONT.body,
      color: dark ? "#D1D5DB" : C.charcoal,
    });
  }
}

export function pill(slide, text, x, y, w, h, opts = {}) {
  const { fill = C.white, color = C.ink, line = C.line, accent = C.red, dark = false } = opts;
  shape(slide, "roundRect", x, y, w, h, fill, line, 1);
  shape(slide, "rect", x, y, 8, h, accent, C.transparent, 0);
  textBox(slide, text, x + 16, y + 8, w - 28, h - 14, {
    size: 12,
    bold: true,
    color,
    face: FONT.body,
    letterSpacing: 0.6,
    valign: "middle",
  });
}

export function card(slide, x, y, w, h, heading, body, opts = {}) {
  const { fill = C.white, line = C.line, accent = C.red, headingColor = C.redDeep, bodyColor = C.ink, headingSize = 18, bodySize = 18 } = opts;
  shape(slide, "roundRect", x, y, w, h, fill, line, 1.2);
  if (accent) shape(slide, "rect", x, y, 8, h, accent, C.transparent, 0);
  textBox(slide, heading, x + 22, y + 18, w - 42, 24, {
    size: headingSize,
    color: headingColor,
    bold: true,
    face: FONT.body,
  });
  textBox(slide, body, x + 22, y + 50, w - 42, h - 62, {
    size: bodySize,
    color: bodyColor,
    face: FONT.body,
  });
}

export function bullet(slide, text, x, y, w, opts = {}) {
  const { size = 21, color = C.ink, bulletColor = C.red, boldLead = false } = opts;
  shape(slide, "ellipse", x, y + 8, 7, 7, bulletColor, C.transparent, 0);
  textBox(slide, text, x + 26, y, w - 26, 44, { size, color, bold: boldLead, face: FONT.body });
}

export function callout(slide, text, x, y, w, h, opts = {}) {
  const { fill = C.cream, line = "#E9C871", color = C.ink, size = 22 } = opts;
  shape(slide, "rect", x, y, w, h, fill, line, 1);
  textBox(slide, text, x + 18, y + 10, w - 36, h - 18, {
    size,
    color,
    face: FONT.body,
    valign: "middle",
  });
}

export function arrowRight(slide, x, y, w = 42, h = 22, color = C.red) {
  shape(slide, "rightArrow", x, y, w, h, color, color, 1);
}

export function arrowDown(slide, x, y, w = 24, h = 34, color = C.red) {
  shape(slide, "downArrow", x, y, w, h, color, color, 1);
}

export function stageBox(slide, x, y, w, h, num, heading, body, opts = {}) {
  const { fill = C.white, line = C.line, accent = C.blue } = opts;
  shape(slide, "roundRect", x, y, w, h, fill, line, 1.4);
  shape(slide, "ellipse", x + 12, y + 14, 30, 30, accent, C.transparent, 0);
  textBox(slide, String(num), x + 12, y + 20, 30, 16, { size: 13, bold: true, color: C.white, align: "center" });
  textBox(slide, heading, x + 52, y + 14, w - 62, 22, { size: 15, bold: true, color: C.ink });
  textBox(slide, body, x + 52, y + 42, w - 62, h - 50, { size: 12, color: C.charcoal });
}

export function miniTable(slide, x, y, cols, rows, widths, opts = {}) {
  const { rowH = 46, headerFill = "#EEE8E1", border = C.line, fontSize = 14 } = opts;
  let cx = x;
  cols.forEach((c, i) => {
    shape(slide, "rect", cx, y, widths[i], rowH, headerFill, border, 1);
    textBox(slide, c, cx + 10, y + 12, widths[i] - 20, 18, { size: fontSize, bold: true, color: C.redDeep, valign: "middle" });
    cx += widths[i];
  });
  rows.forEach((row, r) => {
    let rx = x;
    row.forEach((cell, i) => {
      shape(slide, "rect", rx, y + rowH * (r + 1), widths[i], rowH, C.white, border, 1);
      textBox(slide, cell, rx + 10, y + rowH * (r + 1) + 9, widths[i] - 20, rowH - 12, { size: fontSize, color: C.ink });
      rx += widths[i];
    });
  });
}

export function speaker(slide, text) {
  if (slide.speakerNotes?.setText) slide.speakerNotes.setText(text);
}
