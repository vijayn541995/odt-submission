const fs = await import('node:fs/promises');
const path = await import('node:path');
const { Presentation, PresentationFile } = await import('@oai/artifact-tool');

const W = 1280;
const H = 720;
const DECK_ID = 'odt-leadership-oracle-theme-20260423';
const OUT_DIR = '/Users/vn105957/Desktop/odt-submission/docs/outputs/2026-04-23-odt-leadership/outputs';
const DECK_FILENAME = 'Oracle-Developer-Twin-Leadership-Oracle-Theme-Deck.pptx';
const SCRATCH_DIR = path.join('/Users/vn105957/Desktop/odt-submission/tmp/slides', DECK_ID);
const PREVIEW_DIR = path.join(SCRATCH_DIR, 'preview');
const INSPECT_PATH = path.join(SCRATCH_DIR, 'inspect.ndjson');
const DIGITAL_WORKER_LOGO_PATH = '/Users/vn105957/Desktop/odt-submission/assets/branding/fedit-digital-worker-logo.png';

const C = {
  paper: '#FBF9F8',
  paperAlt: '#FFFFFF',
  ink: '#2A2F2F',
  charcoal: '#2A2F2F',
  slate: '#676C6C',
  muted: '#8B8580',
  night: '#2A2F2F',
  nightSoft: '#333838',
  red: '#C74634',
  redDeep: '#98231C',
  redSoft: '#F0A08F',
  blush: '#FBE5E1',
  amber: '#D89A3A',
  amberSoft: '#F4E0B8',
  sage: '#879476',
  sageSoft: '#DEE5D4',
  blueSoft: '#E4ECF7',
  white: '#FFFFFF',
  white80: '#FFFFFFCC',
  white68: '#FFFFFFAD',
  white48: '#FFFFFF7A',
  black0: '#00000000',
  darkLine: '#4C5151',
  lightLine: '#D9D1CB',
};

const FONT = {
  title: 'Georgia',
  body: 'Oracle Sans Tab',
  mono: 'Oracle Sans Tab',
};

const SOURCES = {
  readme: 'README.md',
  pitch: 'docs/Oracle-Developer-Twin-Hackathon-Pitch.md',
  architecture: 'docs/Oracle-Developer-Twin-Architecture-Note.md',
  runbook: 'docs/Oracle-Developer-Twin-Hackathon-Runbook-5-Minute.md',
  hybrid: 'docs/CS4I-AI-Lab-Hybrid-Setup.md',
  runSummary: 'reports/odt/run-summary.json',
  a11y: 'reports/a11y/findings.json',
  a11yPrompt: 'reports/a11y/coding-agent-prompt.md',
};

const inspectRecords = [];

async function readImageBlob(imagePath) {
  const bytes = await fs.readFile(imagePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

const DIGITAL_WORKER_LOGO_BLOB = await readImageBlob(DIGITAL_WORKER_LOGO_PATH);

function textBox(slide, text, x, y, w, h, opts = {}) {
  const {
    size = 18,
    color = C.ink,
    bold = false,
    face = FONT.body,
    align = 'left',
    valign = 'top',
    fill = C.black0,
    line = C.black0,
    lineWidth = 0,
    letterSpacing = 0,
    italic = false,
    rotate = 0,
  } = opts;
  const shape = slide.shapes.add({
    geometry: 'rect',
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: 'solid', fill: line, width: lineWidth },
    rotate,
  });
  shape.text = String(text ?? '');
  shape.text.fontSize = size;
  shape.text.color = color;
  shape.text.bold = Boolean(bold);
  shape.text.italic = Boolean(italic);
  shape.text.typeface = face;
  shape.text.alignment = align;
  shape.text.verticalAlignment = valign;
  shape.text.insets = { left: 0, right: 0, top: 0, bottom: 0 };
  shape.text.letterSpacing = letterSpacing;
  inspectRecords.push({ kind: 'textbox', text: String(text ?? ''), bbox: [x, y, w, h] });
  return shape;
}

function shape(slide, geometry, x, y, w, h, fill = C.black0, line = C.black0, lineWidth = 0, rotate = 0) {
  const s = slide.shapes.add({
    geometry,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: 'solid', fill: line, width: lineWidth },
    rotate,
  });
  inspectRecords.push({ kind: 'shape', geometry, bbox: [x, y, w, h] });
  return s;
}

function note(slide, body, sourceKeys = []) {
  const refs = sourceKeys.map((key) => `- ${SOURCES[key] || key}`).join('\n');
  slide.speakerNotes.setText(`${body}\n\n[Sources]\n${refs}`);
}

function oracleMark(slide, x, y, size = 34) {
  shape(slide, 'rect', x, y, size, size, C.red, C.black0, 0);
  shape(slide, 'roundRect', x + 8, y + 12, size - 16, 10, C.black0, C.white, 1.8);
}

function addFooter(slide, idx, dark = false) {
  const footerColor = dark ? '#A7A09A' : C.muted;
  const footerRule = dark ? '#4A4F4F' : '#D9D1CB';
  shape(slide, 'rect', 78, 676, 1098, 1, footerRule, C.black0, 0);
  textBox(slide, String(idx), 78, 684, 24, 12, { size: 10, color: footerColor, face: FONT.body });
  textBox(
    slide,
    'Copyright © 2026, Oracle and/or its affiliates | Confidential: Internal/Restricted/Highly Restricted',
    116,
    684,
    760,
    12,
    { size: 9, color: footerColor, face: FONT.body },
  );
  oracleMark(slide, 1168, 679, 34);
}

function addChrome(slide, idx, total, dark = false, label = 'LEADERSHIP STORY') {
  const ink = dark ? C.white80 : C.redDeep;
  const rule = dark ? C.darkLine : C.lightLine;
  textBox(slide, label, 78, 40, 280, 18, { size: 11, color: ink, face: FONT.body, bold: true, letterSpacing: 0.9 });
  shape(slide, 'rect', 78, 67, 1124, 1.5, rule, C.black0, 0);
  addFooter(slide, idx, dark);
}

function addLightBackground(slide, accent = C.blush) {
  slide.background.fill = C.paper;
  shape(slide, 'rect', 0, 0, W, 10, C.red, C.black0, 0);
}

function addDarkBackground(slide) {
  slide.background.fill = C.night;
  shape(slide, 'rect', 0, 0, W, 10, C.red, C.black0, 0);
}

function pill(slide, text, x, y, w, h, opts = {}) {
  const { fill = C.white, color = C.ink, line = C.black0, accent = null, face = FONT.mono } = opts;
  shape(slide, 'roundRect', x, y, w, h, fill, line, 1);
  if (accent) {
    shape(slide, 'rect', x, y, 8, h, accent, C.black0, 0);
  }
  textBox(slide, text, x + (accent ? 18 : 16), y + 10, w - 32, h - 18, { size: 11, color, face, bold: true, letterSpacing: 0.8, valign: 'middle' });
}

function titleBlock(slide, title, subtitle, opts = {}) {
  const { x = 84, y = 96, w = 760, dark = false, titleSize = 42, subSize = 18 } = opts;
  const titleColor = dark ? C.white : C.ink;
  const subColor = dark ? C.white80 : C.charcoal;
  textBox(slide, title, x, y, w, 170, { size: titleSize, color: titleColor, face: FONT.title, bold: true });
  if (subtitle) {
    textBox(slide, subtitle, x + 2, y + 182, Math.min(w, 640), 82, { size: subSize, color: subColor, face: FONT.body });
  }
}

function featureCard(slide, x, y, w, h, title, body, opts = {}) {
  const { fill = C.white80, line = C.black0, accent = C.red, titleColor = C.ink, bodyColor = C.charcoal, dark = false } = opts;
  shape(slide, 'roundRect', x, y, w, h, fill, line, 1.2);
  shape(slide, 'rect', x, y, 8, h, accent, C.black0, 0);
  textBox(slide, title, x + 24, y + 20, w - 42, 28, { size: 16, color: titleColor, face: FONT.mono, bold: true, letterSpacing: 0.9 });
  textBox(slide, body, x + 24, y + 62, w - 44, h - 84, { size: 18, color: bodyColor, face: FONT.body });
}

function metricCard(slide, x, y, w, h, value, label, noteText, accent = C.red) {
  shape(slide, 'roundRect', x, y, w, h, '#FFFFFF12', '#FFFFFF18', 1.1);
  shape(slide, 'rect', x, y, w, 7, accent, C.black0, 0);
  textBox(slide, value, x + 22, y + 22, w - 42, 58, { size: 38, color: C.white, face: FONT.title, bold: true });
  textBox(slide, label, x + 24, y + 84, w - 48, 38, { size: 15, color: C.white80, face: FONT.body });
  if (noteText) {
    textBox(slide, noteText, x + 24, y + h - 32, w - 48, 20, { size: 10, color: '#FFFFFFA8', face: FONT.body });
  }
}

function rowChip(slide, x, y, w, h, title, body, opts = {}) {
  const { fill = C.white, line = C.lightLine, accent = C.red, titleColor = C.ink, bodyColor = C.charcoal } = opts;
  shape(slide, 'roundRect', x, y, w, h, fill, line, 1);
  shape(slide, 'ellipse', x + 18, y + 18, 18, 18, accent, C.black0, 0);
  textBox(slide, title, x + 52, y + 14, w - 74, 24, { size: 16, color: titleColor, face: FONT.mono, bold: true, letterSpacing: 0.6 });
  textBox(slide, body, x + 52, y + 38, w - 72, h - 46, { size: 15, color: bodyColor, face: FONT.body });
}

function compareRow(slide, y, leftText, rightText, idx) {
  const rowY = y + idx * 64;
  shape(slide, 'roundRect', 92, rowY, 308, 54, '#EFE8DF', C.black0, 0);
  shape(slide, 'roundRect', 412, rowY, 776, 54, C.white, C.lightLine, 1);
  textBox(slide, leftText, 114, rowY + 15, 264, 22, { size: 15, color: C.charcoal, face: FONT.body, bold: true });
  shape(slide, 'rect', 412, rowY, 8, 54, C.red, C.black0, 0);
  textBox(slide, rightText, 434, rowY + 11, 720, 28, { size: 16, color: C.ink, face: FONT.body });
}

function stageCapsule(slide, x, y, w, h, label, body, accent) {
  shape(slide, 'roundRect', x, y, w, h, C.white, C.lightLine, 1.1);
  shape(slide, 'rect', x, y, w, 7, accent, C.black0, 0);
  textBox(slide, label, x + 20, y + 20, w - 40, 16, { size: 11, color: C.redDeep, face: FONT.body, bold: true, letterSpacing: 0.8 });
  textBox(slide, body, x + 20, y + 58, w - 40, h - 70, { size: 16, color: C.charcoal, face: FONT.body });
}

function techBadge(slide, x, y, w, label, fill = '#FFFFFFCA') {
  shape(slide, 'roundRect', x, y, w, 32, fill, C.lightLine, 0.8);
  shape(slide, 'rect', x, y, 6, 32, C.red, C.black0, 0);
  textBox(slide, label, x + 16, y + 8, w - 28, 16, { size: 12, color: C.charcoal, face: FONT.mono, bold: true, letterSpacing: 0.5, valign: 'middle' });
}

function timelineStep(slide, x, y, label, body, accent, num) {
  shape(slide, 'ellipse', x, y, 42, 42, accent, C.black0, 0);
  textBox(slide, String(num), x, y + 8, 42, 20, { size: 16, color: C.white, face: FONT.mono, bold: true, align: 'center', valign: 'middle' });
  shape(slide, 'roundRect', x + 60, y - 4, 386, 76, C.white, C.lightLine, 1);
  textBox(slide, label, x + 82, y + 8, 180, 20, { size: 15, color: C.redDeep, face: FONT.mono, bold: true, letterSpacing: 0.7 });
  textBox(slide, body, x + 82, y + 30, 332, 34, { size: 15, color: C.charcoal, face: FONT.body });
}

function trustCard(slide, x, y, w, h, title, body, accent) {
  shape(slide, 'roundRect', x, y, w, h, '#FFFFFF10', '#FFFFFF18', 1.1);
  shape(slide, 'ellipse', x + 24, y + 22, 26, 26, accent, C.black0, 0);
  textBox(slide, title, x + 66, y + 18, w - 94, 22, { size: 16, color: C.white, face: FONT.mono, bold: true, letterSpacing: 0.8 });
  textBox(slide, body, x + 24, y + 60, w - 48, h - 78, { size: 18, color: C.white80, face: FONT.body });
}

function quadrantCard(slide, x, y, w, h, title, body, accent, fill) {
  shape(slide, 'roundRect', x, y, w, h, fill, C.lightLine, 1);
  shape(slide, 'rect', x, y, 8, h, accent, C.black0, 0);
  textBox(slide, title, x + 24, y + 18, w - 40, 18, { size: 13, color: C.redDeep, face: FONT.body, bold: true, letterSpacing: 0.4 });
  textBox(slide, body, x + 24, y + 52, w - 40, h - 66, { size: 17, color: C.charcoal, face: FONT.body });
}

function robotMark(slide, x, y, size, dark = false) {
  const framePad = Math.max(6, Math.round(size * 0.05));
  const frameFill = dark ? '#FFFFFF10' : '#FFF8F4';
  const frameLine = dark ? '#FFFFFF20' : '#E2C9BF';
  shape(slide, 'roundRect', x - framePad, y - framePad, size + framePad * 2, size + framePad * 2, frameFill, frameLine, 1.1);
  const image = slide.images.add({ blob: DIGITAL_WORKER_LOGO_BLOB, fit: 'cover', alt: 'FEDIT digital worker logo' });
  image.position = { left: x, top: y, width: size, height: size };
  image.geometry = 'roundRect';
  inspectRecords.push({ kind: 'image', alt: 'FEDIT digital worker logo', bbox: [x, y, size, size], source: DIGITAL_WORKER_LOGO_PATH });
}

function dashboardMock(slide, x, y, w, h) {
  shape(slide, 'roundRect', x, y, w, h, '#181B20', '#2A2F38', 1.2);
  shape(slide, 'roundRect', x + 18, y + 18, w - 36, 46, '#22262D', C.black0, 0);
  robotMark(slide, x + 24, y + 24, 28, true);
  textBox(slide, 'FEDIT Digital Worker Console', x + 64, y + 34, 290, 16, { size: 13, color: C.white80, face: FONT.mono, bold: true, letterSpacing: 0.7 });
  pill(slide, 'RUN DIGITAL WORKER', x + w - 208, y + 24, 168, 30, { fill: C.red, color: C.white, face: FONT.mono });

  shape(slide, 'roundRect', x + 18, y + 82, 154, 110, '#20242A', C.black0, 0);
  textBox(slide, 'Prompt Hardening', x + 34, y + 98, 130, 18, { size: 12, color: '#FFFFFFB8', face: FONT.mono, bold: true });
  textBox(slide, 'Structured intake\nand stage\ncontrols', x + 34, y + 126, 112, 50, { size: 14, color: C.white, face: FONT.body });

  shape(slide, 'roundRect', x + 190, y + 82, 176, 110, '#20242A', C.black0, 0);
  textBox(slide, 'Visible Agent Workflow', x + 208, y + 98, 144, 18, { size: 12, color: '#FFFFFFB8', face: FONT.mono, bold: true });
  textBox(slide, 'Impact\nDesign\nVerify', x + 208, y + 126, 70, 54, { size: 14, color: C.white, face: FONT.body });
  shape(slide, 'rect', x + 294, y + 126, 10, 40, C.red, C.black0, 0);
  shape(slide, 'rect', x + 314, y + 126, 10, 52, C.amber, C.black0, 0);
  shape(slide, 'rect', x + 334, y + 126, 10, 34, C.sage, C.black0, 0);

  shape(slide, 'roundRect', x + 384, y + 82, w - 402, 110, '#20242A', C.black0, 0);
  textBox(slide, 'Explainability', x + 400, y + 98, 96, 18, { size: 12, color: '#FFFFFFB8', face: FONT.mono, bold: true });
  textBox(slide, 'Ranked files,\nprompts,\nnotes.', x + 400, y + 126, w - 430, 52, { size: 13, color: C.white, face: FONT.body });

  shape(slide, 'roundRect', x + 18, y + 214, w - 36, h - 234, '#20242A', C.black0, 0);
  textBox(slide, 'Completion', x + 34, y + 230, 120, 16, { size: 12, color: '#FFFFFFB8', face: FONT.mono, bold: true });
  textBox(slide, 'Ready for\nreview', x + 34, y + 250, 180, 56, { size: 22, color: C.white, face: FONT.title, bold: true });
  textBox(slide, 'Human review stays\nthe final decision point.', x + 34, y + 310, 236, 40, { size: 14, color: C.white80, face: FONT.body });

  const stages = ['Intake', 'Impact', 'Design', 'Code', 'Tests', 'Compliance', 'Verify'];
  stages.forEach((stage, index) => {
    const chipX = x + 318 + (index % 4) * 120;
    const chipY = y + 246 + Math.floor(index / 4) * 48;
    shape(slide, 'roundRect', chipX, chipY, 104, 32, '#FFFFFF10', '#FFFFFF18', 1);
    textBox(slide, stage, chipX + 12, chipY + 9, 80, 14, { size: 12, color: C.white, face: FONT.body, bold: true, align: 'center' });
  });

  pill(slide, 'DELEGATE TO AGENT', x + w - 212, y + h - 56, 172, 30, { fill: '#FFFFFF16', color: C.white, line: '#FFFFFF24', accent: C.red });
}

function slide1(presentation) {
  const slide = presentation.slides.add();
  addDarkBackground(slide);
  addChrome(slide, 1, 10, true, 'ORACLE DEVELOPER TWIN');
  pill(slide, 'HACKATHON 2026', 84, 88, 154, 34, { fill: '#FFFFFF10', color: C.white, line: '#FFFFFF18', accent: C.red });
  titleBlock(
    slide,
    'Turning AI Into a Governed\nDigital Worker for Software Delivery',
    'ODT turns a ticket into a guided, review-ready delivery flow, while keeping human approval in control.',
    { x: 84, y: 138, w: 700, dark: true, titleSize: 45, subSize: 20 },
  );
  textBox(slide, 'Not another copilot. A digital worker for the work before coding.', 86, 424, 520, 24, {
    size: 15,
    color: '#FFFFFFA8',
    face: FONT.body,
    italic: true,
  });

  featureCard(slide, 84, 496, 228, 126, 'MOVES FASTER', 'Cuts the setup work that slows delivery before implementation starts.', {
    fill: '#FFFFFF0F',
    line: '#FFFFFF1C',
    accent: C.red,
    titleColor: '#FFFFFFC8',
    bodyColor: C.white,
    dark: true,
  });
  featureCard(slide, 332, 496, 228, 126, 'EXPLAINS ITSELF', 'Shows impact, guidance, and evidence in one visible flow.', {
    fill: '#FFFFFF0F',
    line: '#FFFFFF1C',
    accent: C.amber,
    titleColor: '#FFFFFFC8',
    bodyColor: C.white,
    dark: true,
  });
  featureCard(slide, 580, 496, 228, 126, 'PROTECTS QUALITY', 'Keeps accessibility, testing, and review in the flow from the start.', {
    fill: '#FFFFFF0F',
    line: '#FFFFFF1C',
    accent: C.sage,
    titleColor: '#FFFFFFC8',
    bodyColor: C.white,
    dark: true,
  });

  robotMark(slide, 932, 166, 240, true);
  pill(slide, 'Visible demo surface: FEDIT', 860, 456, 270, 34, { fill: '#FFFFFF10', color: C.white, line: '#FFFFFF18', accent: C.red });
  pill(slide, 'Execution agents: Codex / Cline', 860, 504, 300, 34, { fill: '#FFFFFF10', color: C.white, line: '#FFFFFF18', accent: C.amber });
  pill(slide, 'Human-reviewed before merge', 860, 552, 286, 34, { fill: '#FFFFFF10', color: C.white, line: '#FFFFFF18', accent: C.sage });
  textBox(slide, 'It solves the hidden work between a ticket and a safe change.', 860, 614, 290, 48, { size: 15, color: '#FFFFFFB0', face: FONT.body });
  note(slide, 'Opening slide: establish that ODT is a governed digital worker, not just another AI prompt box.', ['pitch', 'architecture', 'readme']);
}

function slide2(presentation) {
  const slide = presentation.slides.add();
  addLightBackground(slide, C.blush);
  addChrome(slide, 2, 10, false, 'THE PROBLEM');
  titleBlock(slide, 'The expensive part of delivery often happens before code begins', null, { x: 84, y: 96, w: 820, titleSize: 40 });

  const steps = [
    ['01', 'Clarify intent', 'Acceptance criteria, scope, and edge cases are often scattered across tickets and chats.'],
    ['02', 'Find repo impact', 'Developers still have to infer which files, modules, and regressions are actually in play.'],
    ['03', 'Plan the change', 'Technical design and patch strategy vary by person and time pressure.'],
    ['04', 'Check obligations', 'Testing, keyboard behavior, and accessibility often arrive too late in the cycle.'],
    ['05', 'Prepare handoff', 'Coding agents need structured context, or quality becomes unpredictable.'],
  ];
  const cardXs = [84, 320, 556, 792, 1028];
  const bandHeights = [88, 124, 156, 186, 220];
  steps.forEach(([num, title, body], idx) => {
    shape(slide, 'roundRect', cardXs[idx], 430 - bandHeights[idx], 182, bandHeights[idx] + 142, idx < 2 ? '#F2E5E2' : idx === 2 ? '#EED8D3' : idx === 3 ? '#E8CBC3' : '#E2B9AF', C.black0, 0);
    shape(slide, 'roundRect', cardXs[idx], 258, 182, 264, '#FFFFFFD6', C.lightLine, 1);
    textBox(slide, num, cardXs[idx] + 18, 280, 42, 30, { size: 23, color: C.redDeep, face: FONT.title, bold: true });
    textBox(slide, title, cardXs[idx] + 18, 320, 140, 26, { size: 18, color: C.ink, face: FONT.title, bold: true });
    textBox(slide, body, cardXs[idx] + 18, 360, 146, 130, { size: 15, color: C.charcoal, face: FONT.body });
  });

  shape(slide, 'rect', 84, 560, 1112, 12, C.red, C.black0, 0);
  textBox(slide, 'Before code starts, teams are already losing time and building risk.', 84, 592, 690, 28, { size: 19, color: C.ink, face: FONT.title, bold: true });
  textBox(slide, 'ODT targets that hidden layer of work.', 84, 630, 340, 20, { size: 15, color: C.slate, face: FONT.body });
  note(slide, 'Show the bottleneck before coding: manual interpretation, impact discovery, planning, compliance, and handoff.', ['pitch', 'architecture']);
}

function slide3(presentation) {
  const slide = presentation.slides.add();
  addLightBackground(slide, '#E7D7CE');
  addChrome(slide, 3, 10, false, 'THE SHIFT');
  titleBlock(slide, 'ODT removes setup work, not developer judgement', null, { x: 84, y: 96, w: 850, titleSize: 39 });
  pill(slide, 'Intent -> evidence -> execution', 84, 206, 296, 34, { fill: '#FFFFFFB8', color: C.redDeep, line: C.lightLine, accent: C.red });

  shape(slide, 'roundRect', 84, 270, 470, 356, '#1B1E24', C.black0, 0);
  textBox(slide, 'Before ODT', 112, 292, 160, 24, { size: 24, color: C.white, face: FONT.title, bold: true });
  rowChip(slide, 112, 332, 414, 68, 'Manual interpretation', 'Business asks still have to be translated into engineering action.', { fill: '#23272F', line: '#2E333C', accent: C.redSoft, titleColor: '#FFFFFFCC', bodyColor: C.white });
  rowChip(slide, 112, 402, 414, 68, 'Hidden blast radius', 'Impact discovery still relies on memory, search, and guesswork.', { fill: '#23272F', line: '#2E333C', accent: C.redSoft, titleColor: '#FFFFFFCC', bodyColor: C.white });
  rowChip(slide, 112, 472, 414, 68, 'Late quality checks', 'Accessibility and regression planning can slip until the very end.', { fill: '#23272F', line: '#2E333C', accent: C.redSoft, titleColor: '#FFFFFFCC', bodyColor: C.white });
  rowChip(slide, 112, 542, 414, 68, 'Unstructured prompting', 'Execution agents get uneven context, so output quality can vary.', { fill: '#23272F', line: '#2E333C', accent: C.redSoft, titleColor: '#FFFFFFCC', bodyColor: C.white });

  shape(slide, 'rightArrow', 566, 400, 86, 80, C.red, C.black0, 0);

  shape(slide, 'roundRect', 684, 270, 512, 356, '#FFFDFC', C.lightLine, 1);
  textBox(slide, 'With ODT', 712, 292, 160, 24, { size: 24, color: C.ink, face: FONT.title, bold: true });
  rowChip(slide, 712, 332, 456, 68, 'Structured intake', 'Requirements and constraints are captured in one governed flow.', { accent: C.red });
  rowChip(slide, 712, 402, 456, 68, 'Repo-aware impact', 'Candidate files and regression areas are ranked before coding begins.', { accent: C.amber });
  rowChip(slide, 712, 472, 456, 68, 'Guided execution', 'Design, code, test, and compliance workpacks are ready to use.', { accent: C.sage });
  rowChip(slide, 712, 542, 456, 68, 'Visible review gate', 'FEDIT makes decisions clearer before any merge decision.', { accent: C.red });

  note(slide, 'Contrast the current fragmented pre-coding workflow with the governed ODT flow.', ['pitch', 'architecture', 'runbook']);
}

function slide4(presentation) {
  const slide = presentation.slides.add();
  addLightBackground(slide, '#E9D4CC');
  addChrome(slide, 4, 10, false, 'DIFFERENTIATION');
  titleBlock(slide, 'Why this is more than a coding copilot', null, { x: 84, y: 96, w: 840, titleSize: 40 });

  shape(slide, 'roundRect', 92, 228, 308, 58, '#1E2228', C.black0, 0);
  shape(slide, 'roundRect', 412, 228, 776, 58, C.red, C.black0, 0);
  textBox(slide, 'Typical coding copilot', 114, 246, 264, 22, { size: 16, color: C.white, face: FONT.title, bold: true });
  textBox(slide, 'Oracle Developer Twin', 438, 246, 300, 22, { size: 18, color: C.white, face: FONT.title, bold: true });

  compareRow(slide, 302, 'Starts with a prompt', 'Starts with a work item, structured intake, and target-repo context.', 0);
  compareRow(slide, 302, 'Mainly returns code or text', 'Creates dashboards, impact analysis, workpacks, prompt contracts, and verification artifacts.', 1);
  compareRow(slide, 302, 'Repo understanding is ad hoc', 'Impact is inferred and ranked so change scope becomes visible before execution.', 2);
  compareRow(slide, 302, 'Quality checks are optional', 'Accessibility, testing, and review checkpoints are built into the flow.', 3);
  compareRow(slide, 302, 'Responsibility can feel blurry', 'Human approval remains explicit before merge or release.', 4);

  shape(slide, 'roundRect', 92, 640, 1096, 42, '#1E2228', C.black0, 0);
  textBox(slide, 'Codex and Cline can execute. ODT makes execution safer and more consistent.', 114, 652, 1054, 18, { size: 16, color: C.white, face: FONT.body, bold: true, align: 'center' });
  note(slide, 'Differentiate ODT from generic copilots in simple business language.', ['pitch', 'architecture']);
}

function slide5(presentation) {
  const slide = presentation.slides.add();
  addDarkBackground(slide);
  addChrome(slide, 5, 10, true, 'IMPLEMENTED TODAY');
  titleBlock(slide, 'Built. Running. Demoable today.', null, { x: 84, y: 96, w: 640, dark: true, titleSize: 40 });
  textBox(slide, 'This is a working delivery flow, not a concept mockup.', 84, 244, 760, 22, { size: 16, color: C.white80, face: FONT.body });

  shape(slide, 'roundRect', 84, 286, 338, 284, '#FFFFFF0F', '#FFFFFF18', 1.1);
  textBox(slide, 'What the demo proves right now', 108, 312, 260, 24, { size: 18, color: C.white, face: FONT.title, bold: true });
  textBox(slide, 'Review-ready run\nArtifacts on disk\nTarget-repo a11y verification\nLive worker console', 108, 356, 240, 132, { size: 18, color: C.white80, face: FONT.body });
  textBox(slide, 'Hybrid AI path also works: OCI prompt generation with safe fallback.', 108, 512, 254, 50, { size: 15, color: '#FFFFFFA8', face: FONT.body });

  metricCard(slide, 470, 270, 324, 150, '7', 'Governed stages from intake to verify', 'Current product flow', C.red);
  metricCard(slide, 816, 270, 324, 150, '32', 'Runs stored in ODT history', 'Persisted run trail', C.amber);
  metricCard(slide, 470, 438, 324, 150, '0', 'Blockers in current demo a11y scan', 'Latest target-repo verification', C.sage);
  metricCard(slide, 816, 438, 324, 150, '1', 'Visible console for the digital worker', 'FEDIT dashboard', C.redSoft);

  pill(slide, 'Oracle VPAT guidance primary', 84, 620, 232, 34, { fill: '#FFFFFF10', color: C.white, line: '#FFFFFF18', accent: C.red });
  pill(slide, 'WCAG 2.1 AA fallback', 330, 620, 208, 34, { fill: '#FFFFFF10', color: C.white, line: '#FFFFFF18', accent: C.amber });
  pill(slide, 'OCI prompt generation wired', 552, 620, 224, 34, { fill: '#FFFFFF10', color: C.white, line: '#FFFFFF18', accent: C.red });
  pill(slide, 'Safe template mode preserved', 790, 620, 228, 34, { fill: '#FFFFFF10', color: C.white, line: '#FFFFFF18', accent: C.sage });
  note(slide, 'Use real repo facts: stages, stored runs, accessibility posture, and hybrid OCI capability.', ['runSummary', 'hybrid', 'a11y', 'a11yPrompt']);
}

function slide6(presentation) {
  const slide = presentation.slides.add();
  addLightBackground(slide, '#E6D9CF');
  addChrome(slide, 6, 10, false, 'ARCHITECTURE');
  titleBlock(slide, 'Simple architecture. Clear control points.', null, { x: 84, y: 96, w: 820, titleSize: 40 });
  textBox(slide, 'Every layer has one job. That keeps the AI path understandable and safe.', 84, 188, 680, 24, { size: 18, color: C.charcoal, face: FONT.body });

  stageCapsule(slide, 84, 274, 246, 224, 'INPUT LAYER', 'Ticket, acceptance criteria, mockups, constraints, and repo target define the request.', C.red);
  stageCapsule(slide, 360, 274, 246, 224, 'PLANNING ENGINE', 'Repo analysis, prompt hardening, design guidance, code and test workpacks, and compliance review.', C.amber);
  stageCapsule(slide, 636, 274, 246, 224, 'CONTROL SURFACE', 'FEDIT shows status, explainability, launch controls, and run telemetry.', C.sage);
  stageCapsule(slide, 912, 274, 246, 224, 'HUMAN DECISION', 'A developer or reviewer inspects artifacts and diffs before approving merge or release.', C.redSoft);

  shape(slide, 'rightArrow', 300, 362, 40, 40, C.red, C.black0, 0);
  shape(slide, 'rightArrow', 576, 362, 40, 40, C.amber, C.black0, 0);
  shape(slide, 'rightArrow', 852, 362, 40, 40, C.sage, C.black0, 0);

  textBox(slide, 'Technology foundation', 84, 546, 240, 20, { size: 15, color: C.redDeep, face: FONT.mono, bold: true, letterSpacing: 0.7 });
  techBadge(slide, 84, 578, 144, 'Node.js CLI engine');
  techBadge(slide, 240, 578, 150, 'FEDIT dashboard');
  techBadge(slide, 402, 578, 176, 'Local context server');
  techBadge(slide, 590, 578, 156, 'OCI GenAI optional');
  techBadge(slide, 758, 578, 174, 'Codex / Cline handoff');
  techBadge(slide, 944, 578, 228, 'Oracle VPAT / WCAG mapping');

  textBox(slide, 'ODT plans. Agents execute. Humans decide.', 84, 632, 560, 26, { size: 22, color: C.ink, face: FONT.title, bold: true });
  note(slide, 'Translate architecture into plain language: input, planning, control, human review.', ['architecture', 'readme', 'runSummary', 'hybrid']);
}

function slide7(presentation) {
  const slide = presentation.slides.add();
  addLightBackground(slide, '#E9DCD3');
  addChrome(slide, 7, 10, false, 'DEVELOPER EXPERIENCE');
  titleBlock(slide, 'What a developer actually does', null, { x: 84, y: 96, w: 740, titleSize: 40 });
  textBox(slide, 'The workflow is simple, even though the engine underneath is rich.', 84, 188, 680, 24, { size: 18, color: C.charcoal, face: FONT.body });

  timelineStep(slide, 84, 258, 'Paste the ticket', 'Set the repo and add constraints or design input if needed.', C.red, 1);
  timelineStep(slide, 84, 344, 'Run Digital Worker', 'ODT runs the seven-stage flow and prepares evidence.', C.amber, 2);
  timelineStep(slide, 84, 430, 'Review the evidence', 'Impact, design, tests, compliance, and verify outputs appear in FEDIT.', C.sage, 3);
  timelineStep(slide, 84, 516, 'Delegate to agent', 'Codex or Cline can implement with prepared guidance.', C.redSoft, 4);
  timelineStep(slide, 84, 602, 'Approve or reject', 'A human reviewer still decides before merge.', C.red, 5);

  dashboardMock(slide, 700, 232, 514, 420);
  note(slide, 'Walk through the developer flow in language any audience can follow quickly.', ['runbook', 'readme', 'architecture']);
}

function slide8(presentation) {
  const slide = presentation.slides.add();
  addDarkBackground(slide);
  addChrome(slide, 8, 10, true, 'TRUST AND GOVERNANCE');
  titleBlock(slide, 'Trust is built in', null, { x: 84, y: 96, w: 760, dark: true, titleSize: 40 });
  textBox(slide, 'Human review, accessibility, traceability, and fallback behavior are part of the product.', 84, 182, 760, 24, { size: 18, color: C.white80, face: FONT.body });
  pill(slide, 'Speed with visible control', 84, 212, 258, 34, { fill: '#FFFFFF10', color: C.white, line: '#FFFFFF18', accent: C.red });

  trustCard(slide, 84, 282, 518, 144, 'Human in the loop', 'Merge and release decisions stay with a developer or reviewer. ODT accelerates preparation, not accountability transfer.', C.red);
  trustCard(slide, 628, 282, 568, 144, 'Accessibility by default', 'Oracle VPAT guidance is treated as primary, with WCAG fallback and manual evidence checks preserved.', C.amber);
  trustCard(slide, 84, 446, 518, 144, 'Explainability and audit', 'Runs create durable artifacts, prompt traces, ranked files, and reviewable evidence instead of hidden reasoning.', C.sage);
  trustCard(slide, 628, 446, 568, 144, 'AI resilience', 'OCI-backed prompt generation is optional and hybrid; safe template mode stays available for continuity.', C.redSoft);

  textBox(slide, 'ODT makes risk visible before it becomes release risk.', 84, 626, 760, 26, { size: 21, color: C.white, face: FONT.title, bold: true });
  note(slide, 'Emphasize accessibility, explainability, fallback behavior, and retained human control.', ['architecture', 'a11y', 'a11yPrompt', 'hybrid']);
}

function slide9(presentation) {
  const slide = presentation.slides.add();
  addLightBackground(slide, '#E5D6CB');
  addChrome(slide, 9, 10, false, 'STRATEGIC VALUE');
  titleBlock(slide, 'What this brings to Oracle', null, { x: 84, y: 96, w: 780, titleSize: 40 });
  textBox(slide, 'ODT is a reusable Oracle pattern for safer, faster software delivery.', 84, 188, 680, 24, { size: 18, color: C.charcoal, face: FONT.body });

  shape(slide, 'roundRect', 468, 278, 344, 274, C.paperAlt, C.lightLine, 1.2);
  shape(slide, 'rect', 468, 278, 344, 8, C.red, C.black0, 0);
  textBox(slide, 'Reusable\nOracle pattern', 510, 350, 260, 78, { size: 28, color: C.redDeep, face: FONT.title, bold: true, align: 'center', valign: 'middle' });
  textBox(slide, 'Governable AI\ndelivery', 536, 442, 208, 42, { size: 16, color: C.charcoal, face: FONT.body, align: 'center' });

  quadrantCard(slide, 84, 272, 286, 118, 'Standardized readiness', 'Brings consistency to intake, impact, test scope, and review evidence.', C.red, '#FFFDFB');
  quadrantCard(slide, 908, 272, 286, 118, 'Higher quality confidence', 'Keeps accessibility and verification visible earlier in delivery.', C.amber, '#FFFDFB');
  quadrantCard(slide, 84, 440, 286, 118, 'Faster onboarding and handoff', 'Developers and agents receive clearer context instead of tribal knowledge.', C.sage, '#FFFDFB');
  quadrantCard(slide, 908, 440, 286, 118, 'Foundation for scale', 'The same pattern can expand beyond React and beyond frontend over time.', C.redSoft, '#FFFDFB');

  shape(slide, 'roundRect', 150, 620, 980, 40, '#1F2328', C.black0, 0);
  textBox(slide, 'Frontend today', 186, 632, 180, 16, { size: 14, color: C.white, face: FONT.mono, bold: true, letterSpacing: 0.7 });
  shape(slide, 'rightArrow', 370, 624, 70, 30, C.red, C.black0, 0);
  textBox(slide, 'More stacks next', 480, 632, 160, 16, { size: 14, color: C.white, face: FONT.mono, bold: true, letterSpacing: 0.7 });
  shape(slide, 'rightArrow', 650, 624, 70, 30, C.amber, C.black0, 0);
  textBox(slide, 'Broader digital workers later', 760, 632, 250, 16, { size: 14, color: C.white, face: FONT.mono, bold: true, letterSpacing: 0.7 });
  note(slide, 'Position ODT as a scalable Oracle pattern, not a one-off demo.', ['architecture', 'readme', 'runbook', 'hybrid']);
}

function slide10(presentation) {
  const slide = presentation.slides.add();
  addDarkBackground(slide);
  addChrome(slide, 10, 10, true, 'CLOSING TAKEAWAY');
  robotMark(slide, 82, 102, 112, true);
  titleBlock(slide, 'From ticket to trust', 'ODT makes the invisible work before coding visible, guided, and repeatable.', { x: 84, y: 214, w: 700, dark: true, titleSize: 50, subSize: 22 });
  featureCard(slide, 84, 516, 304, 120, 'REMOVES HIDDEN WORK', 'It cuts the planning work that slows teams before code starts.', {
    fill: '#FFFFFF0F', line: '#FFFFFF1C', accent: C.red, titleColor: '#FFFFFFC8', bodyColor: C.white, dark: true,
  });
  featureCard(slide, 404, 516, 304, 120, 'KEEPS OWNERSHIP HUMAN', 'The worker prepares and explains. The developer still decides.', {
    fill: '#FFFFFF0F', line: '#FFFFFF1C', accent: C.amber, titleColor: '#FFFFFFC8', bodyColor: C.white, dark: true,
  });
  featureCard(slide, 724, 516, 304, 120, 'READY TO SCALE', 'It is already live in FEDIT and ready to grow.', {
    fill: '#FFFFFF0F', line: '#FFFFFF1C', accent: C.sage, titleColor: '#FFFFFFC8', bodyColor: C.white, dark: true,
  });

  pill(slide, 'Run -> Review -> Delegate -> Approve', 878, 198, 304, 34, { fill: '#FFFFFF10', color: C.white, line: '#FFFFFF18', accent: C.red });
  textBox(slide, 'This is not just faster AI. It is safer, review-ready delivery.', 876, 268, 288, 92, { size: 23, color: C.white, face: FONT.title, bold: true });
  textBox(slide, 'That is the delivery value.', 878, 376, 220, 24, { size: 18, color: '#FFFFFFB8', face: FONT.body });
  note(slide, 'Close on the delivery message: ODT creates governed AI acceleration, not blind automation.', ['pitch', 'architecture', 'runbook']);
}

async function ensureDirs() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(SCRATCH_DIR, { recursive: true });
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
}

async function saveBlobToFile(blob, filePath) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await fs.writeFile(filePath, bytes);
}

async function writeInspect() {
  const lines = inspectRecords.map((record) => JSON.stringify(record)).join('\n') + '\n';
  await fs.writeFile(INSPECT_PATH, lines, 'utf8');
}

async function build() {
  await ensureDirs();
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  slide1(presentation);
  slide2(presentation);
  slide3(presentation);
  slide4(presentation);
  slide5(presentation);
  slide6(presentation);
  slide7(presentation);
  slide8(presentation);
  slide9(presentation);
  slide10(presentation);
  await writeInspect();
  for (let idx = 0; idx < presentation.slides.items.length; idx += 1) {
    const preview = await presentation.export({ slide: presentation.slides.items[idx], format: 'png', scale: 1 });
    await saveBlobToFile(preview, path.join(PREVIEW_DIR, `slide-${String(idx + 1).padStart(2, '0')}.png`));
  }
  const pptxBlob = await PresentationFile.exportPptx(presentation);
  const outPath = path.join(OUT_DIR, DECK_FILENAME);
  await pptxBlob.save(outPath);
  console.log(outPath);
}

await build();
