import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const pptx = await FileBlob.load('/Users/vn105957/Desktop/odt-submission/submission/Oracle-Developer-Twin-Presentation-Deck.pptx');
const presentation = await PresentationFile.importPptx(pptx);
const slide = presentation.slides.getItem(6);
console.log(JSON.stringify({
  shapes: slide.shapes?.items?.length || 0,
  images: slide.images?.items?.length || 0,
  tables: slide.tables?.items?.length || 0,
  charts: slide.charts?.items?.length || 0,
  elements: slide.elements?.items?.length || 0,
}, null, 2));
