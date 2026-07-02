import { addBackground, C, arrowRight, callout, card, shape, speaker, textBox, title } from "./shared.mjs";

export async function slide09(presentation) {
  const slide = presentation.slides.add();
  addBackground(slide, { slideNo: 9, section: "Privacy and Cost" });
  title(slide, "ODT reduces token cost and privacy risk by compiling scoped context", "Instead of sending everything to every model, ODT analyzes locally and gives each worker only what it needs.");

  card(slide, 78, 168, 250, 168, "Local evidence", "Jira, repo scan, standards, worker logs, review notes, and artifacts are collected locally or in approved infrastructure.", {
    fill: C.white,
    accent: C.green,
    bodySize: 17,
  });
  arrowRight(slide, 352, 238, 48, 22, C.red);
  card(slide, 424, 168, 250, 168, "Context compiler", "ODT selects relevant requirement, code evidence, standards, and open questions for each worker role.", {
    fill: C.white,
    accent: C.red,
    bodySize: 17,
  });
  arrowRight(slide, 698, 238, 48, 22, C.red);
  card(slide, 770, 168, 250, 168, "Scoped worker prompt", "Codex/Cline/OCI worker receives a smaller, role-specific handoff instead of a giant repeated prompt.", {
    fill: C.white,
    accent: C.blue,
    bodySize: 17,
  });

  shape(slide, "roundRect", 96, 402, 1010, 116, "#FFFDFC", C.line, 1.2);
  textBox(slide, "Expected benefits", 126, 424, 190, 24, { size: 18, bold: true, color: C.redDeep });
  textBox(slide, "1. Lower repeated prompt assembly\n2. Better model focus\n3. Less manual copying of sensitive context\n4. Usage tracking by worker/provider/stage\n5. Easier audit of what context was sent", 326, 418, 720, 80, { size: 19, color: C.ink });

  callout(slide, "Privacy principle: raw repo and enterprise context should stay local by default; model calls should receive approved, minimal context.", 84, 578, 1100, 52, { size: 21 });
  speaker(slide, "This slide explains why ODT matters for cost and privacy, not only productivity.");
  return slide;
}
