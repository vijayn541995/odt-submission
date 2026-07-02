import { addBackground, C, callout, card, speaker, textBox, title } from "./shared.mjs";

export async function slide12(presentation) {
  const slide = presentation.slides.add();
  addBackground(slide, { slideNo: 12, section: "Summary" });
  title(slide, "Summary: ODT 2.0 makes AI-assisted delivery governable", "The opportunity is to scale AI coding safely by adding enterprise workflow, evidence, policy, and review around worker engines.");

  card(slide, 72, 170, 330, 220, "Business impact", "Less repetitive planning work, faster requirement-to-action flow, better review consistency, earlier standards visibility, and measurable PR readiness.", {
    fill: C.white,
    accent: C.red,
    bodySize: 20,
  });
  card(slide, 474, 170, 330, 220, "Responsible AI", "Human approval remains mandatory; worker context is scoped; evidence is stored; prompts, actions, and outputs are auditable.", {
    fill: C.white,
    accent: C.green,
    bodySize: 20,
  });
  card(slide, 876, 170, 330, 220, "Pilot expectation", "Use two or three teams, measure planning time, prompt size, review rework, PR blockers, accepted risk, and audit completeness.", {
    fill: C.white,
    accent: C.blue,
    bodySize: 20,
  });

  callout(slide, "Leadership ask: approve a controlled ODT 2.0 pilot and evaluate it as an enterprise SDLC control plane, not merely a coding assistant.", 72, 462, 1134, 72, {
    fill: C.cream,
    size: 25,
  });
  textBox(slide, "Closing takeaway", 74, 574, 220, 28, { size: 23, bold: true, color: C.redDeep });
  textBox(slide, "ODT stands out by combining modern AI worker execution with enterprise governance, traceability, customization, privacy posture, and cost-aware context management.", 74, 612, 1060, 44, { size: 22, color: C.ink });
  speaker(slide, "Final summary slide: ODT is the enterprise control plane for agentic AI development.");
  return slide;
}
