import { addBackground, C, arrowRight, callout, card, shape, speaker, textBox, title } from "./shared.mjs";

export async function slide03(presentation) {
  const slide = presentation.slides.add();
  addBackground(slide, { slideNo: 3, section: "Positioning" });
  title(slide, "ODT complements Codex and Cline by governing the full SDLC path", "Worker engines are powerful. ODT decides what context they get, when they run, and what evidence is required.");

  card(slide, 76, 175, 292, 330, "Codex / Cline / Cursor", "Excellent coding and technical execution assistants.\n\nWeakness if used alone:\n- prompt/session dependent\n- standards depend on user memory\n- evidence is scattered\n- approval is manual", {
    fill: C.white,
    accent: C.blue,
    headingColor: C.blue,
    bodySize: 18,
  });
  arrowRight(slide, 390, 306, 62, 26, C.red);
  card(slide, 474, 150, 330, 384, "ODT 2.0 Control Plane", "Owns SDLC workflow:\n- requirement intake\n- repo/Jira evidence\n- standards gate\n- human approval\n- worker handoff\n- relay context\n- review/rework\n- build proof\n- PR readiness", {
    fill: C.redSoft,
    accent: C.red,
    headingColor: C.redDeep,
    bodySize: 18,
  });
  arrowRight(slide, 826, 306, 62, 26, C.red);
  card(slide, 910, 175, 292, 330, "Enterprise outcome", "Teams get AI speed without losing control of:\n- governance\n- privacy\n- quality gates\n- cost visibility\n- repeatability\n- auditability\n- leadership reporting", {
    fill: C.white,
    accent: C.green,
    headingColor: C.green,
    bodySize: 18,
  });

  shape(slide, "rect", 78, 570, 1122, 1.5, C.line, C.transparent, 0);
  textBox(slide, "Simple framing", 80, 590, 150, 24, { size: 18, bold: true, color: C.redDeep });
  textBox(slide, "ODT is the orchestration, evidence, and policy layer. Codex/Cline/OCI/Ollama/OpenAI-compatible models are pluggable workers/providers.", 235, 590, 900, 48, { size: 20, color: C.ink });
  speaker(slide, "This slide clearly separates ODT from coding assistants: ODT is not competing with Codex; ODT orchestrates and governs Codex-style workers.");
  return slide;
}
