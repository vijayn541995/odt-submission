import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/vn105957/Desktop/odt-submission";
const INPUT_DECK = path.join(ROOT, "submission", "Oracle-Developer-Twin-Presentation-Deck.pptx");
const OUTPUT_DIR = path.join(ROOT, "tmp", "slides", "odt-final-refresh", "outputs");
const TEMP_OUTPUT = path.join(OUTPUT_DIR, "Oracle-Developer-Twin-Presentation-Deck.updated.pptx");
const FINAL_OUTPUTS = [
  path.join(ROOT, "submission", "Oracle-Developer-Twin-Presentation-Deck.pptx"),
  path.join(ROOT, "docs", "Oracle-Developer-Twin-Hackathon-Submission-Template-Deck.pptx"),
];

const slideNotes = {
  1: `Oracle Developer Twin is a human-reviewed Digital Worker for software delivery. Instead of jumping straight to code generation, it starts by helping developers stay closer to the requirement, understand scope, and prepare a safe implementation path.`,
  2: `In enterprise delivery, a significant amount of effort goes into turning a requirement into clear scope, impacted files, test direction, accessibility guidance, and reliable execution prompts. Oracle Developer Twin helps organize that necessary work so developers can focus on the decisions that matter most.`,
  3: `ODT acts as a governed SDLC co-worker. It hardens the requirement, analyzes repo impact, prepares hybrid prompts, supports code and test guidance, and keeps human review in the loop before re-analysis, before delegation, and before merge.`,
  4: `ODT plans and governs the work, OCI can optionally generate stage prompts, OCA executes the implementation path, and the human remains the approval gate.`,
  5: `In practice, a developer enters the work item, selects the repo, reviews the evidence, and delegates only when ready. Reviewer edits and stage overrides can be added at any point, and OCI GenAI prompt generation remains optional because fallback prompts keep the workflow resilient.`,
  6: `The business value is straightforward: less repetitive support work around delivery, more consistent review, earlier accessibility visibility, and better collaboration between developers and AI. Human judgment remains central to the final outcome.`,
  7: `Use this appendix slide only if judges ask for technical depth. It shows the governed sequence clearly: ODT intake and impact analysis, hybrid OCI or fallback prompting, code and unit-test guidance with Oracle accessibility expectations, a human review checkpoint before delegation, governed OCA execution, and final human approval before delivery.`,
};

const replacementsBySlide = {
  2: [
    [
      "Developers still spend manual time translating tickets into repo impact, test scope, accessibility obligations, and reliable execution prompts before coding can safely begin.",
      "A significant amount of delivery effort goes into turning a requirement into clear scope, impacted files, test direction, accessibility guidance, and reliable execution prompts before implementation begins.",
    ],
    [
      "ODT turns one work item into a seven-stage, repo-aware, review-ready workflow with durable artifacts, dashboards, and governed delegation to an OCA-backed execution session.",
      "ODT turns one work item into a seven-stage, repo-aware, review-ready workflow with prompt hardening, hybrid Oracle Gen AI prompting, durable artifacts, and governed delegation to an OCA-backed execution session.",
    ],
    [
      "Impact: faster planning, more consistent review, earlier accessibility visibility, and cleaner handoff to coding agents.",
      "Impact: developers stay closer to the requirement, review becomes more consistent, accessibility is surfaced earlier, and execution handoff becomes clearer.",
    ],
    [
      "Measurable KPIs: planning prep time reduced, review-ready artifact coverage increased, a11y issues found earlier, and fewer unsafe agent launches.",
      "Measurable KPIs: planning prep time reduced, review-ready artifact coverage increased, a11y issues found earlier, and less repetitive support work around delivery.",
    ],
    [
      "Who faces this problem?",
      "Who benefits most?",
    ],
    [
      "Frontend developers, tech leads, reviewers, delivery managers, and teams adopting AI-assisted software delivery.",
      "Frontend developers, reviewers, tech leads, delivery managers, and teams working across large repositories with governance expectations.",
    ],
  ],
  3: [
    [
      "A governed SDLC co-worker that prepares impact, design, code, test, and compliance guidance from a single requirement.",
      "A human-reviewed SDLC co-worker that keeps developers closer to the requirement from intake to governed implementation.",
    ],
    [
      "It assists with ticket intake, repo analysis, prompt hardening, workpack creation, and execution handoff.",
      "It assists with ticket intake, prompt hardening, repo impact analysis, hybrid prompt generation, code and test guidance, and execution handoff.",
    ],
    [
      "It improves the workflow between ticket -> plan -> review -> delegate -> approve.",
      "It improves the workflow between requirement -> plan -> review -> delegate -> approve.",
    ],
    [
      "Ticket intake -> prompt hardening -> repo impact -> design/code/tests/compliance -> human review -> OCA delegation -> repo diff approval",
      "Requirement intake -> prompt hardening -> repo impact -> OCI GenAI or fallback prompts -> code/tests/compliance guidance -> human review -> OCA delegation -> repo diff approval",
    ],
    [
      "ODT turns hidden setup work into a visible, governed delivery flow around OCA. It is not just code generation; it explains impact, preserves review, and makes AI safer to adopt.",
      "ODT turns necessary supporting work into a visible, governed delivery flow. It is not replacing developer expertise; it is organizing the inputs, evidence, and AI collaboration around it.",
    ],
  ],
  4: [
    [
      "High-level architecture, OCA execution path, OCI prompt option, and governed human review.",
      "High-level architecture, OCI prompt option, OCA execution path, and governed human review.",
    ],
  ],
  5: [
    [
      "A developer enters the work item, chooses the repo, reviews the evidence, and delegates only when ready. A reviewer or lead can add edits and request re-analysis.",
      "A developer enters the work item, chooses the repo, reviews the evidence, and delegates only when ready. A reviewer or lead can add edits, stage overrides, and request re-analysis.",
    ],
    [
      "Prompt hardening, repo validation, optional Git initialization, accessibility evidence, and mandatory human approval before merge.",
      "Prompt hardening, repo validation, accessibility guidance aligned to Oracle expectations, and mandatory human approval before merge.",
    ],
    [
      "Integration points",
      "Hybrid prompting and integration points",
    ],
    [
      "Node.js CLI engine, local context server, generated dashboards, demo React app, OCI prompt-provider option, and OCA execution path.",
      "OCI GenAI can generate stage prompts with an LLM path, while fallback prompts and reviewer overrides keep the workflow resilient and customizable. ODT connects this with the local context server, dashboards, demo React app, and OCA execution path.",
    ],
    [
      "ODT makes AI delivery explainable, reviewable, and demo-ready today.",
      "ODT helps teams collaborate with AI in a way that is explainable, reviewable, requirement-aware, and demo-ready today.",
    ],
  ],
  6: [
    [
      "Cuts planning overhead, improves review consistency, surfaces accessibility earlier, and gives teams a reusable Oracle delivery pattern.",
      "Reduces repetitive delivery-preparation work, improves consistency, surfaces accessibility earlier, helps reduce backlog pressure, and gives teams a reusable Oracle delivery pattern.",
    ],
    [
      "The demo shows intake, seven-stage planning, dashboard evidence, reviewer edits, OCA delegation, and final repo-level human approval.",
      "The demo shows requirement hardening, repo-aware planning, OCI prompt options, dashboard evidence, reviewer edits, OCA delegation, and final repo-level human approval.",
    ],
    [
      "Oracle Developer Twin turns OCA into a governed Digital Worker for software delivery by making the work before coding visible, structured, and review-ready.",
      "Oracle Developer Twin helps developers and AI collaborate in a governed way by keeping the requirement, the repo, and the human review step connected.",
    ],
  ],
};

function replaceTextInSlide(slide, replacements) {
  if (!slide.shapes || !slide.shapes.items) return;

  slide.shapes.items.forEach((shape) => {
    if (!shape.text || typeof shape.text.replace !== "function") return;
    const current = String(shape.text);
    if (!current) return;

    replacements.forEach(([oldText, newText]) => {
      if (current.includes(oldText)) {
        shape.text.replace(oldText, newText);
      }
    });
  });
}

function addCard(
  slide,
  {
    left,
    top,
    width,
    height,
    fill,
    lineFill,
    title,
    body,
    titleColor = "#8C1D18",
    bodyColor = "#1F2933",
    titleFontSize = 24,
    bodyFontSize = 20,
  }
) {
  const shape = slide.shapes.add({
    geometry: "roundRect",
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: lineFill, width: 2 },
  });

  shape.text = `${title}\n${body}`;
  shape.text.typeface = "Aptos";
  shape.text.fontSize = bodyFontSize;
  shape.text.color = bodyColor;
  shape.text.insets = { left: 18, right: 18, top: 16, bottom: 16 };
  shape.text.alignment = "left";
  shape.text.verticalAlignment = "middle";
  shape.text.get(title).bold = true;
  shape.text.get(title).fontSize = titleFontSize;
  shape.text.get(title).color = titleColor;
  return shape;
}

function addSimpleLabel(
  slide,
  {
    left,
    top,
    width,
    height,
    text,
    fontSize,
    color,
    bold = false,
    fill = "#F7F4EF",
    lineFill = "#F7F4EF",
    lineWidth = 0,
    geometry = "rect",
    alignment = "left",
  }
) {
  const shape = slide.shapes.add({
    geometry,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
  });
  shape.text = text;
  shape.text.typeface = "Aptos";
  shape.text.fontSize = fontSize;
  shape.text.color = color;
  shape.text.insets = { left: 0, right: 0, top: 0, bottom: 0 };
  shape.text.alignment = alignment;
  shape.text.verticalAlignment = "middle";
  if (bold) shape.text.bold = true;
  return shape;
}

function addAppendixSlideContent(slide) {
  slide.background.fill = "#F7F4EF";

  addSimpleLabel(slide, {
    left: 80,
    top: 56,
    width: 1120,
    height: 30,
    text: "Appendix",
    fontSize: 16,
    color: "#A64936",
    bold: true,
  });

  addSimpleLabel(slide, {
    left: 80,
    top: 88,
    width: 1120,
    height: 42,
    text: "Governed Technical Flow",
    fontSize: 30,
    color: "#6F2119",
    bold: true,
  });

  addSimpleLabel(slide, {
    left: 80,
    top: 132,
    width: 840,
    height: 44,
    text: "A step-by-step governed flow showing where accessibility guidance enters and where human review can refine the path before and after OCA execution.",
    fontSize: 16,
    color: "#5F6B76",
  });

  addSimpleLabel(slide, {
    left: 980,
    top: 98,
    width: 200,
    height: 30,
    text: "Human review checkpoints",
    fontSize: 13,
    color: "#6F2119",
    bold: true,
    fill: "#FFF3ED",
    lineFill: "#C74634",
    lineWidth: 1.5,
    geometry: "roundRect",
    alignment: "center",
  });

  addSimpleLabel(slide, {
    left: 915,
    top: 138,
    width: 265,
    height: 28,
    text: "OCI GenAI remains optional for stage prompting",
    fontSize: 13,
    color: "#25424D",
    bold: true,
    fill: "#EEF4F7",
    lineFill: "#88A8B6",
    lineWidth: 1.5,
    geometry: "roundRect",
    alignment: "center",
  });

  const columnLeft = [80, 475, 870];
  const cardTop = [214, 350, 486];
  const cardWidth = 330;
  const cardHeight = 104;

  const phaseHeaders = [
    {
      left: columnLeft[0],
      fill: "#FFF2EC",
      lineFill: "#D9A597",
      text: "Phase 1  Understand and scope",
      color: "#8C1D18",
    },
    {
      left: columnLeft[1],
      fill: "#EEF4F7",
      lineFill: "#88A8B6",
      text: "Phase 2  Prepare and govern",
      color: "#25424D",
    },
    {
      left: columnLeft[2],
      fill: "#EFF8F3",
      lineFill: "#A7CDB8",
      text: "Phase 3  Execute and approve",
      color: "#1E5A40",
    },
  ];

  phaseHeaders.forEach(({ left, fill, lineFill, text, color }) => {
    addSimpleLabel(slide, {
      left,
      top: 178,
      width: cardWidth,
      height: 28,
      text,
      fontSize: 14,
      color,
      bold: true,
      fill,
      lineFill,
      lineWidth: 1.5,
      geometry: "roundRect",
      alignment: "center",
    });
  });

  [
    { left: 425, top: 178 },
    { left: 820, top: 178 },
  ].forEach(({ left, top }) => {
    slide.shapes.add({
      geometry: "rightArrow",
      position: { left, top: top + 2, width: 36, height: 24 },
      fill: "#C74634",
      line: { style: "solid", fill: "#C74634", width: 1 },
    });
  });

  const steps = [
    {
      left: columnLeft[0],
      top: cardTop[0],
      fill: "#FFF8F4",
      lineFill: "#E7B7AE",
      title: "1. Requirement / Jira / Reviewer Input",
      body: "Work item details, repo context, mockups, and reviewer intent.",
    },
    {
      left: columnLeft[0],
      top: cardTop[1],
      fill: "#FFF8F4",
      lineFill: "#E7B7AE",
      title: "2. ODT Intake + Prompt Hardening",
      body: "Normalize the ask, strengthen clarity, and prepare governed prompts.",
    },
    {
      left: columnLeft[0],
      top: cardTop[2],
      fill: "#FFF8F4",
      lineFill: "#E7B7AE",
      title: "3. Repo Impact Analysis",
      body: "Identify hotspots, candidate files, tests, and impacted surfaces.",
    },
    {
      left: columnLeft[1],
      top: cardTop[0],
      fill: "#F6FAFC",
      lineFill: "#A7BDC8",
      title: "4. Hybrid Prompt Generation",
      body: "OCI GenAI option, fallback prompts, and reviewer stage overrides.",
      titleColor: "#25424D",
    },
    {
      left: columnLeft[1],
      top: cardTop[1],
      fill: "#F1FAF4",
      lineFill: "#9CC8A6",
      title: "5. Code + Unit Tests + Oracle A11y Guidance",
      body: "Implementation guidance, test expectations, and accessibility checks.",
      titleColor: "#1E5A40",
    },
    {
      left: columnLeft[1],
      top: cardTop[2],
      fill: "#FFF3ED",
      lineFill: "#C74634",
      title: "6. Human Review + Refine + Re-analyze",
      body: "A developer or lead can update scope, prompts, and guidance before delegation.",
      titleColor: "#6F2119",
    },
    {
      left: columnLeft[2],
      top: cardTop[0],
      fill: "#F4FBF7",
      lineFill: "#A7CDB8",
      title: "7. Delegation to OCA Codex / Cline",
      body: "Governed execution against the target repository.",
      titleColor: "#1E5A40",
    },
    {
      left: columnLeft[2],
      top: cardTop[1],
      fill: "#F4FBF7",
      lineFill: "#A7CDB8",
      title: "8. Review Changed Files + Fill Gaps",
      body: "Inspect diffs, validate tests and a11y, and close remaining misses.",
      titleColor: "#1E5A40",
    },
    {
      left: columnLeft[2],
      top: cardTop[2],
      fill: "#FFF3ED",
      lineFill: "#C74634",
      title: "9. Final Human Approval + Deliver",
      body: "Approve, refine, or reject before merge, submission, or handoff.",
      titleColor: "#6F2119",
    },
  ];

  steps.forEach((step) => {
    addCard(slide, {
      ...step,
      width: cardWidth,
      height: cardHeight,
      titleFontSize: 17,
      bodyFontSize: 13,
      bodyColor: "#34414B",
    });
  });

  [
    { left: 226, top: 322 },
    { left: 226, top: 458 },
    { left: 621, top: 322 },
    { left: 621, top: 458 },
    { left: 1016, top: 322 },
    { left: 1016, top: 458 },
  ].forEach(({ left, top }) => {
    slide.shapes.add({
      geometry: "downArrow",
      position: { left, top, width: 38, height: 22 },
      fill: "#C74634",
      line: { style: "solid", fill: "#C74634", width: 1 },
    });
  });

  const note = slide.shapes.add({
    geometry: "roundRect",
    position: { left: 80, top: 624, width: 1120, height: 52 },
    fill: "#FFFFFF",
    line: { style: "solid", fill: "#E4E7EB", width: 1.5 },
  });
  note.text =
    "Accessibility enters at step 5 before delegation. Human review checkpoints appear at step 6 before OCA execution and step 9 before final delivery.";
  note.text.typeface = "Aptos";
  note.text.fontSize = 15;
  note.text.color = "#1F2933";
  note.text.insets = { left: 18, right: 18, top: 12, bottom: 12 };
}

await fs.mkdir(OUTPUT_DIR, { recursive: true });

const pptx = await FileBlob.load(INPUT_DECK);
const presentation = await PresentationFile.importPptx(pptx);

presentation.slides.items.forEach((slide, index) => {
  const slideNumber = index + 1;
  if (slideNumber === 7) return;

  const replacements = replacementsBySlide[slideNumber];
  if (replacements) replaceTextInSlide(slide, replacements);

  if (slideNumber === 6 && slide.shapes && slide.shapes.items && slide.shapes.items[5]) {
    const closingShape = slide.shapes.items[5];
    const closingText = "Closing takeaway: Oracle Developer Twin helps developers and AI collaborate in a governed way by keeping the requirement, the repo, and the human review step connected.";
    if (closingShape.text && typeof closingShape.text.replace === "function") {
      const current = String(closingShape.text || "");
      if (current) {
        closingShape.text.replace(current, closingText);
      } else {
        closingShape.text = closingText;
      }
    }
  }

  if (slide.speakerNotes && typeof slide.speakerNotes.setText === "function" && slideNotes[slideNumber]) {
    slide.speakerNotes.setText(slideNotes[slideNumber]);
  }
});

if (presentation.slides.count >= 7) {
  presentation.slides.getItem(6).delete();
}

const appendixInsertAfter =
  presentation.slides.count >= 6 ? presentation.slides.getItem(5) : undefined;
const appendixSlide = appendixInsertAfter
  ? presentation.slides.insert({ after: appendixInsertAfter }).slide
  : presentation.slides.add();

addAppendixSlideContent(appendixSlide);
if (appendixSlide.speakerNotes && typeof appendixSlide.speakerNotes.setText === "function") {
  appendixSlide.speakerNotes.setText(slideNotes[7]);
}

const pptxBlob = await PresentationFile.exportPptx(presentation);
await pptxBlob.save(TEMP_OUTPUT);

for (const outputPath of FINAL_OUTPUTS) {
  await fs.copyFile(TEMP_OUTPUT, outputPath);
}

console.log(JSON.stringify({ saved: [TEMP_OUTPUT, ...FINAL_OUTPUTS] }, null, 2));
