import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const pptx = await FileBlob.load('/Users/vn105957/Desktop/odt-submission/submission/Oracle-Developer-Twin-Presentation-Deck.pptx');
const presentation = await PresentationFile.importPptx(pptx);
const slide = presentation.slides.getItem(6);
const shape = slide.shapes.items[0];
console.log('slideMethods', Object.getOwnPropertyNames(Object.getPrototypeOf(slide)).sort());
console.log('shapesMethods', Object.getOwnPropertyNames(Object.getPrototypeOf(slide.shapes)).sort());
console.log('shapeMethods', Object.getOwnPropertyNames(Object.getPrototypeOf(shape)).sort());
