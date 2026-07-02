import { addBackground, C, card, callout, speaker, textBox, title } from "./shared.mjs";

export async function slide04(presentation) {
  const slide = presentation.slides.add();
  addBackground(slide, { slideNo: 4, section: "Current Build" });
  title(slide, "ODT 2.0 already behaves like a workbench, not a static dashboard", "The current product surface combines intake, planning, standards, agent execution, review, PR readiness, artifacts, guide, runs, monitoring, and settings.");

  const items = [
    ["Intake + Jira", "Requirement capture, Jira2 read path, repo folder analysis, uploads and supporting assets.", C.red],
    ["Planner + Standards", "Plan summary, implementation strategy, policy/standards gate, accessibility/security/testing concerns.", C.blue],
    ["Agent Team", "Lead Planner, Senior Full Stack Dev, Reviewer, Build Verifier, worker launch/refresh/stop/ingest.", C.green],
    ["Review + PR Ready", "Reviewer closeout, rework routing, accepted risk, build proof, evidence-backed PR package.", C.amber],
    ["Artifacts + Runs", "Structured evidence, generated outputs, worker logs, relay context, run history.", C.purple],
    ["Monitoring + Settings", "Connector readiness, health log, UI smoke validation, provider and MCP readiness.", C.redDeep],
  ];

  items.forEach(([h, b, accent], i) => {
    const x = 68 + (i % 3) * 382;
    const y = 170 + Math.floor(i / 3) * 160;
    card(slide, x, y, 344, 128, h, b, { fill: C.white, accent, headingColor: accent, bodySize: 17 });
  });

  callout(slide, "Current emphasis: completed-Jira verification now launches Reviewer first, then Build Verifier/test evidence, then PR Ready.", 68, 548, 1110, 58, {
    fill: C.cream,
    size: 22,
  });
  textBox(slide, "Production direction: make every button/action evidence-aware, governable, resumable, observable, and explainable.", 70, 630, 1040, 30, { size: 20, bold: true, color: C.redDeep });
  speaker(slide, "This is the 'what is built today' slide. It is intentionally product-surface focused.");
  return slide;
}
