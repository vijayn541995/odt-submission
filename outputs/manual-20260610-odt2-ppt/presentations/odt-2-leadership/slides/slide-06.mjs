import { addBackground, C, arrowRight, card, callout, shape, speaker, textBox, title } from "./shared.mjs";

export async function slide06(presentation) {
  const slide = presentation.slides.add();
  addBackground(slide, { slideNo: 6, section: "Agent Team" });
  title(slide, "Agent Team makes worker execution sequential, reviewable, and relay-aware", "ODT should pass context from one worker to the next instead of dumping the whole conversation into every model call.");

  const lanes = [
    ["Lead Planner", "Clarifies requirement, analyzes gaps, drafts plan and handoff bundle.", C.red],
    ["Senior Full Stack Dev", "Implements approved scope against target repo via Codex today; Cline/other adapters later.", C.blue],
    ["Reviewer", "Reviews worker output, standards impact, risks, missing tests, and rework needs.", C.amber],
    ["Build Verifier", "Runs approved validation path and captures build/test evidence.", C.green],
  ];
  lanes.forEach(([h, b, a], i) => {
    const x = 72 + i * 288;
    card(slide, x, 176, 244, 152, h, b, { fill: C.white, accent: a, headingColor: a, bodySize: 16 });
    if (i < lanes.length - 1) arrowRight(slide, x + 250, 238, 34, 18, C.red);
  });

  shape(slide, "roundRect", 120, 386, 1040, 126, "#FFFDFC", C.line, 1.2);
  textBox(slide, "Relay context", 148, 408, 160, 24, { size: 18, bold: true, color: C.redDeep });
  textBox(slide, "Questions, assumptions, decisions, implementation notes, review comments, accepted risk, and build proof are passed forward as structured evidence.", 308, 408, 790, 58, { size: 22, color: C.ink });
  textBox(slide, "This is the core improvement over ad hoc multi-agent prompting.", 308, 470, 650, 24, { size: 18, color: C.blue, bold: true });

  callout(slide, "Important boundary: dependency installs and write actions stay behind explicit approval paths.", 120, 560, 1040, 52, { fill: C.cream, size: 22 });
  speaker(slide, "The user emphasized sequential relay between planner, developer, reviewer, and verifier. This slide makes that core product idea explicit.");
  return slide;
}
