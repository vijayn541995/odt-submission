import { addBackground, C, arrowRight, callout, card, shape, speaker, textBox, title } from "./shared.mjs";

export async function slide11(presentation) {
  const slide = presentation.slides.add();
  addBackground(slide, { slideNo: 11, section: "Working Example" });
  title(slide, "Real working example: completed Jira work should be verified before PR readiness", "ODT should not blindly implement when Jira is already Done; it should validate the repository evidence and close the workflow correctly.");

  const steps = [
    ["Import Jira", "JOURNEY-style issue is read via Jira2; current state shows completed verification path.", C.red],
    ["Analyze repo", "ODT finds matching commits and repository evidence without writing files.", C.blue],
    ["Launch Reviewer", "Reviewer checks gaps, standards impact, tests, and missing information.", C.amber],
    ["Build Verify", "Approved validation path captures test/build evidence.", C.green],
    ["PR Ready", "ODT packages only evidence-backed readiness, not stale history.", C.purple],
  ];
  steps.forEach(([h, b, a], i) => {
    const x = 62 + i * 236;
    card(slide, x, 205, 200, 154, h, b, { fill: C.white, accent: a, headingColor: a, bodySize: 15 });
    if (i < steps.length - 1) arrowRight(slide, x + 204, 268, 28, 16, C.red);
  });

  shape(slide, "roundRect", 112, 432, 1010, 92, "#FFFDFC", C.line, 1.2);
  textBox(slide, "Behavior rule", 142, 454, 146, 22, { size: 18, bold: true, color: C.redDeep });
  textBox(slide, "A launched worker is not evidence. Current workflow readiness must depend on reviewable worker output, current evidence, accepted risk, and build/test proof.", 300, 448, 760, 52, { size: 21, color: C.ink });

  callout(slide, "This is the kind of product behavior that makes ODT feel like a real-time developer workbench.", 112, 584, 1010, 46, { size: 22 });
  speaker(slide, "This slide reflects the recent ODT behavior work: completed Jira verification should launch Reviewer and Build Verifier before PR Ready.");
  return slide;
}
