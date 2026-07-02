import { addBackground, C, bullet, card, callout, miniTable, speaker, textBox, title } from "./shared.mjs";

export async function slide02(presentation) {
  const slide = presentation.slides.add();
  addBackground(slide, { slideNo: 2, section: "Problem and Value" });
  title(slide, "Teams need governed AI delivery, not only faster code generation", "AI can write code, but enterprise SDLC still needs requirement clarity, standards, approvals, evidence, and PR readiness.");

  card(slide, 58, 178, 534, 196, "Problem statement", "Developers spend significant time translating tickets into engineering action: understanding requirements, finding impacted files, planning changes, standards rules, and coding-assistant prompts.", {
    fill: C.white,
    accent: C.red,
    bodySize: 20,
  });
  card(slide, 616, 178, 584, 196, "Who faces this problem?", "Developers, tech leads, reviewers, delivery managers, platform owners, and teams adopting AI-assisted software delivery across governed enterprise repositories.", {
    fill: C.white,
    accent: C.blue,
    bodySize: 21,
  });

  card(slide, 58, 400, 534, 176, "ODT answer", "ODT turns hidden preparation work into a visible SDLC workflow: intake, analysis, design, standards, approval, delegation, review, build verification, and PR readiness.", {
    fill: "#FFFDFC",
    accent: C.green,
    bodySize: 20,
  });

  miniTable(
    slide,
    616,
    400,
    ["Improvement", "ODT contribution"],
    [
      ["Less repeated prep", "Local evidence + scoped prompts"],
      ["Better quality", "Standards and review gates"],
      ["Safer AI use", "Human approval before writes"],
      ["Clearer PRs", "Evidence-backed closeout"],
    ],
    [210, 374],
    { rowH: 36, fontSize: 13 },
  );

  callout(slide, "ODT helps teams stay closer to the requirement while keeping execution governed and review-ready.", 58, 615, 1140, 42, { size: 21 });
  speaker(slide, "This slide updates the original problem statement to show why AI coding alone is incomplete in enterprise delivery.");
  return slide;
}
