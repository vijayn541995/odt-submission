import { addBackground, C, FONT, card, callout, odtCornerMark, pill, shape, speaker, textBox } from "./shared.mjs";

export async function slide01(presentation) {
  const slide = presentation.slides.add();
  addBackground(slide, { slideNo: 1, section: "ODT 2.0 Leadership Deck" });

  textBox(slide, "Oracle Developer Twin 2.0", 70, 92, 710, 68, {
    size: 52,
    bold: true,
    face: FONT.title,
    color: C.ink,
  });
  textBox(slide, "Governed Agentic SDLC Workbench", 72, 164, 640, 34, {
    size: 28,
    color: C.redDeep,
    bold: true,
  });
  textBox(slide, "A control plane that turns Codex, Cline, OCI GenAI, and future model engines into supervised, evidence-backed software delivery workers.", 72, 220, 690, 88, {
    size: 23,
    color: C.charcoal,
  });

  pill(slide, "ENTERPRISE GOVERNANCE", 72, 335, 230, 36, { fill: C.white, accent: C.red, color: C.ink });
  pill(slide, "AGENTIC WORKFLOW", 322, 335, 210, 36, { fill: C.white, accent: C.blue, color: C.ink });
  pill(slide, "LOCAL EVIDENCE FIRST", 552, 335, 230, 36, { fill: C.white, accent: C.green, color: C.ink });

  card(slide, 72, 438, 310, 134, "Control plane", "ODT owns intake, planning, evidence, standards, approvals, delegation, review, build proof, and PR readiness.", {
    fill: C.white,
    accent: C.red,
    bodySize: 18,
  });
  card(slide, 402, 438, 310, 134, "Worker engines", "Codex is wired today. Cline, OCI GenAI/OCA, Ollama, and OpenAI-compatible adapters fit behind governed gates.", {
    fill: C.white,
    accent: C.blue,
    bodySize: 18,
  });
  card(slide, 732, 438, 310, 134, "Enterprise promise", "Less repeated context work, stronger standards discipline, lower token waste, and auditable human-in-the-loop delivery.", {
    fill: C.white,
    accent: C.green,
    bodySize: 18,
  });

  shape(slide, "roundRect", 922, 106, 222, 222, C.red, C.red, 1);
  textBox(slide, "ODT", 958, 154, 150, 54, { size: 50, bold: true, color: C.white, align: "center", face: FONT.title });
  shape(slide, "ellipse", 985, 246, 14, 14, C.white, C.transparent, 0);
  shape(slide, "ellipse", 1028, 246, 14, 14, C.white, C.transparent, 0);
  shape(slide, "ellipse", 1071, 246, 14, 14, C.white, C.transparent, 0);
  textBox(slide, "CONTROL PLANE\nFOR AI DELIVERY", 908, 350, 250, 54, { size: 18, bold: true, color: C.ink, align: "center" });

  callout(slide, "ODT 2.0 is not another coding assistant. It is the governed workbench around coding assistants.", 72, 606, 1060, 46, { size: 21 });
  odtCornerMark(slide, 1190, 674);
  speaker(slide, "ODT 2.0 should be positioned as the enterprise control plane around AI coding workers, not as a replacement for Codex or Cline.");
  return slide;
}
