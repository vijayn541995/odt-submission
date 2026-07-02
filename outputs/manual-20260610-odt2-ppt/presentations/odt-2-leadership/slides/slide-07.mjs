import { addBackground, C, FONT, arrowRight, shape, speaker, textBox } from "./shared.mjs";

function archNode(slide, x, y, w, h, heading, body, color) {
  shape(slide, "roundRect", x, y, w, h, "#FFFFFF10", color, 1.4);
  shape(slide, "rect", x, y, w, 7, color, C.transparent, 0);
  textBox(slide, heading, x + 18, y + 20, w - 36, 22, { size: 17, bold: true, color: "#FFFFFF", face: FONT.body });
  textBox(slide, body, x + 18, y + 52, w - 36, h - 60, { size: 14, color: "#D1D5DB", face: FONT.body });
}

export async function slide07(presentation) {
  const slide = presentation.slides.add();
  addBackground(slide, { dark: true, slideNo: 7, section: "Technical Architecture" });
  textBox(slide, "ODT 2.0 Architecture and Tech Stack", 68, 42, 820, 46, { size: 38, bold: true, color: C.white, face: FONT.title });
  textBox(slide, "Human + AI collaboration across the governed development lifecycle", 70, 91, 780, 24, { size: 18, color: "#D1D5DB" });

  archNode(slide, 58, 140, 190, 168, "1. Frontend", "React 18 + Vite\nWorkbench UI\nworkflow pages\noperator controls", "#4CC9F0");
  archNode(slide, 286, 140, 190, 168, "2. Backend API", "Node.js 24\nlocal HTTP API\nnode:sqlite\nevidence services", "#91C84A");
  archNode(slide, 514, 140, 224, 168, "3. Governance Engine", "standards gates\napproval state\naccepted risk\nPR readiness", C.red);
  archNode(slide, 776, 140, 190, 168, "4. Evidence Store", "SQLite today\nartifacts\nlogs\nfuture enterprise DB", "#4CC9F0");
  archNode(slide, 1004, 140, 198, 168, "5. Connectors", "Jira2 today\nGit/SCM next\nbuild service\nMCP gateway", "#A78BFA");

  arrowRight(slide, 252, 212, 34, 18, "#D1D5DB");
  arrowRight(slide, 480, 212, 34, 18, "#D1D5DB");
  arrowRight(slide, 742, 212, 34, 18, "#D1D5DB");
  arrowRight(slide, 970, 212, 34, 18, "#D1D5DB");

  archNode(slide, 130, 386, 242, 148, "6. Agent Orchestrator", "planner, full stack dev,\nreviewer, build verifier\nworker launch / stop / ingest", "#F59E0B");
  archNode(slide, 434, 386, 242, 148, "7. Worker Engines", "Codex wired today\nCline adapter planned\nOCA / model workers", C.red);
  archNode(slide, 738, 386, 242, 148, "8. AI Providers", "local deterministic\nOCI GenAI\nOllama\nOpenAI-compatible", "#A78BFA");
  archNode(slide, 1042, 386, 156, 148, "9. Output", "review\nrework\nbuild proof\nPR package", "#34D399");
  arrowRight(slide, 376, 452, 40, 20, "#D1D5DB");
  arrowRight(slide, 680, 452, 40, 20, "#D1D5DB");
  arrowRight(slide, 984, 452, 40, 20, "#D1D5DB");

  shape(slide, "roundRect", 76, 594, 1090, 52, "#FFFFFF0D", "#FFFFFF22", 1);
  textBox(slide, "Design principle", 104, 608, 154, 20, { size: 16, bold: true, color: "#FFFFFF" });
  textBox(slide, "Analyze locally first, compile scoped context, delegate only after governance gates, and store every result as evidence.", 258, 608, 850, 24, { size: 17, color: "#D1D5DB" });
  speaker(slide, "This is the ODT 2.0 architecture slide. It intentionally simplifies the older dark architecture while preserving the same visual family.");
  return slide;
}
