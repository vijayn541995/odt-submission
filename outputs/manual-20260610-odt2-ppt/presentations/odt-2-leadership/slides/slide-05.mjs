import { addBackground, C, arrowDown, arrowRight, callout, shape, speaker, stageBox, textBox, title } from "./shared.mjs";

export async function slide05(presentation) {
  const slide = presentation.slides.add();
  addBackground(slide, { slideNo: 5, section: "Workflow" });
  title(slide, "ODT turns a requirement into PR readiness through evidence gates", "Each stage creates evidence. Gates decide whether to continue, clarify, delegate, rework, accept risk, or stop.");

  const top = [
    ["1", "Intake", "Requirement, Jira,\nrepo, assets", C.red],
    ["2", "Analyze", "Repo evidence,\ngaps, context", C.blue],
    ["3", "Plan", "Design and\nimplementation plan", C.blue],
    ["4", "Standards", "Security, testing,\naccessibility, policy", C.red],
    ["5", "Approval", "Write scope and\nrisk decision", C.red],
  ];
  top.forEach(([n, h, b, a], i) => {
    const x = 72 + i * 224;
    stageBox(slide, x, 168, 178, 92, n, h, b, { fill: i >= 3 ? "#FFF7F2" : C.white, accent: a });
    if (i < top.length - 1) arrowRight(slide, x + 182, 204, 34, 16, C.blue);
  });
  arrowDown(slide, 1072, 268, 24, 42, C.red);
  const bottom = [
    ["10", "PR Ready", "Evidence-backed\nPR package", C.green],
    ["9", "Build Verify", "Approved test and\nbuild proof", C.green],
    ["8", "Review", "Findings and\nrework relay\ncontext", C.amber],
    ["7", "Ingest", "Worker output,\nlogs, evidence", C.blue],
    ["6", "Delegate", "Codex/Cline/OCI\nworker handoff", C.purple],
  ];
  bottom.forEach(([n, h, b, a], i) => {
    const x = 72 + i * 224;
    stageBox(slide, x, 348, 178, 92, n, h, b, { fill: i === 2 ? "#FFF9E8" : C.white, accent: a });
    if (i < bottom.length - 1) arrowRight(slide, x + 182, 384, 34, 16, i < 2 ? C.green : C.blue);
  });

  shape(slide, "roundRect", 548, 465, 164, 48, "#FFF9E8", "#E2A23A", 1.2);
  textBox(slide, "Rework loop", 574, 477, 112, 20, { size: 15, bold: true, color: C.redDeep, align: "center" });
  arrowDown(slide, 620, 520, 22, 36, C.amber);
  shape(slide, "leftArrow", 482, 558, 310, 22, C.amber, C.amber, 1);
  textBox(slide, "Reviewer findings can route scoped relay context back to the right worker.", 392, 590, 480, 28, { size: 15, color: C.redDeep, align: "center" });

  callout(slide, "Human review remains active before write delegation and before final PR readiness.", 72, 628, 1120, 42, { size: 21 });
  speaker(slide, "This is the updated workflow diagram. It replaces the earlier 7-stage concept with the current ODT 2.0 requirement-to-PR-ready flow.");
  return slide;
}
