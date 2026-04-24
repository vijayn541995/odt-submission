import { FileBlob, PresentationFile } from "@oai/artifact-tool";

const deckPath = process.argv[2];

if (!deckPath) {
  throw new Error("Usage: node inspect_submission_deck.mjs <deck-path>");
}

const pptx = await FileBlob.load(deckPath);
const presentation = await PresentationFile.importPptx(pptx);

console.log("slides", presentation.slides.count);

presentation.slides.items.forEach((slide, slideIndex) => {
  console.log(`SLIDE ${slideIndex + 1}`);

  const shapeCount = slide.shapes && slide.shapes.items ? slide.shapes.items.length : 0;
  console.log("shapeCount", shapeCount);

  if (slide.shapes && slide.shapes.items) {
    slide.shapes.items.forEach((shape, shapeIndex) => {
      const position = shape.position || {};
      const textObj = shape.text;
      let text = "";

      try {
        if (typeof textObj === "string") {
          text = textObj;
        } else if (textObj && typeof textObj.toString === "function") {
          text = String(textObj.toString());
        }
      } catch (error) {
        text = "";
      }

      console.log(
        JSON.stringify({
          shapeIndex,
          geometry: shape.geometry || shape.kind || shape.type || "unknown",
          left: position.left,
          top: position.top,
          width: position.width,
          height: position.height,
          text: text.slice(0, 400),
        })
      );
    });
  }
});
