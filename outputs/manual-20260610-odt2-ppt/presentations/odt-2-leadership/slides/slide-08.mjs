import { addBackground, C, arrowRight, callout, card, shape, speaker, textBox, title } from "./shared.mjs";

export async function slide08(presentation) {
  const slide = presentation.slides.add();
  addBackground(slide, { slideNo: 8, section: "Governance" });
  title(slide, "Enterprise value comes from customizable governance, not hardcoded prompts", "ODT should let teams encode standards, gates, and do/don't rules once, then reuse them across work.");

  card(slide, 74, 166, 282, 134, "Company policy", "Security, dependency, data handling, accessibility, VPAT/WCAG, and approval expectations.", { fill: C.white, accent: C.red, bodySize: 17 });
  arrowRight(slide, 375, 222, 46, 20, C.red);
  card(slide, 444, 166, 282, 134, "Org / team pack", "Team-specific coding standards, test expectations, review ownership, and release rules.", { fill: C.white, accent: C.blue, bodySize: 17 });
  arrowRight(slide, 745, 222, 46, 20, C.red);
  card(slide, 814, 166, 282, 134, "Repo / task rules", "Local constraints, restricted paths, approved commands, known risk areas, and task-specific gates.", { fill: C.white, accent: C.green, bodySize: 17 });

  shape(slide, "roundRect", 112, 372, 1000, 142, "#FFFDFC", C.line, 1.2);
  const gates = [
    ["Accessibility", C.red],
    ["Security", C.redDeep],
    ["Dependency", C.amber],
    ["Testing", C.blue],
    ["Review", C.green],
    ["PR readiness", C.purple],
  ];
  gates.forEach(([g, a], i) => {
    const x = 148 + i * 154;
    shape(slide, "roundRect", x, 412, 128, 48, "#FFFFFF", C.line, 1);
    shape(slide, "ellipse", x + 12, 426, 16, 16, a, C.transparent, 0);
    textBox(slide, g, x + 34, 424, 84, 18, { size: 13, bold: true, color: C.ink, valign: "middle" });
  });
  textBox(slide, "Policy packs turn ODT from one team's workflow into an enterprise reusable governance layer.", 154, 482, 850, 24, { size: 19, color: C.redDeep, bold: true });

  callout(slide, "Key differentiator: teams can customize rules while keeping the approval and evidence model consistent.", 88, 584, 1100, 46, { size: 22 });
  speaker(slide, "The user called out customization for team/company policy packs, WCAG/VPAT, coding standards, and do/don't rules. This slide captures that.");
  return slide;
}
