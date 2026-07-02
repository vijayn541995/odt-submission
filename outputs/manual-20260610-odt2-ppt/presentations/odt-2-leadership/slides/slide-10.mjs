import { addBackground, C, card, callout, shape, speaker, textBox, title } from "./shared.mjs";

export async function slide10(presentation) {
  const slide = presentation.slides.add();
  addBackground(slide, { slideNo: 10, section: "Roadmap" });
  title(slide, "ODT 2.0 roadmap moves from local pilot to enterprise agentic SDLC platform", "The next work should harden execution, expand connectors, then add enterprise deployment controls.");

  const phases = [
    ["Near term", "Stabilize reviewer/build verifier closeout, PR evidence gaps, Jira import, UI smoke validation, worker stop/ingest reliability.", "Reliable team pilot", C.red],
    ["Mid term", "Policy packs, ODT Guide RAG, Git/SCM and build connectors, Cline adapter, token budgeting, context compression.", "Customizable multi-worker workbench", C.blue],
    ["Long term", "Enterprise auth/RBAC, shared evidence store, MCP-native orchestration, OCI GenAI/OCA adapter, DB awareness, audit exports.", "Production-grade agentic SDLC platform", C.green],
  ];
  phases.forEach(([phase, focus, outcome, accent], i) => {
    const y = 176 + i * 132;
    shape(slide, "roundRect", 72, y, 1120, 104, C.white, C.line, 1.2);
    shape(slide, "rect", 72, y, 12, 104, accent, C.transparent, 0);
    textBox(slide, phase, 104, y + 18, 156, 24, { size: 20, bold: true, color: accent });
    textBox(slide, focus, 286, y + 18, 600, 48, { size: 18, color: C.ink });
    textBox(slide, outcome, 926, y + 20, 226, 42, { size: 20, bold: true, color: C.redDeep });
  });

  callout(slide, "Future upgrades should be added behind governance gates first, then exposed through simple workbench actions.", 72, 598, 1120, 44, { size: 21 });
  speaker(slide, "This is the future improvement slide requested by the user. It includes OCI GenAI/OCA, MCP, auth/RBAC, DB awareness, and connector upgrades.");
  return slide;
}
