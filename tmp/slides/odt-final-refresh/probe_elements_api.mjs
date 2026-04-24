import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const pptx = await FileBlob.load('/Users/vn105957/Desktop/odt-submission/submission/Oracle-Developer-Twin-Presentation-Deck.pptx');
const presentation = await PresentationFile.importPptx(pptx);
const slide = presentation.slides.getItem(6);
console.log('elementsMethods', Object.getOwnPropertyNames(Object.getPrototypeOf(slide.elements)).sort());
const element = slide.elements.items[0];
console.log('elementMethods', Object.getOwnPropertyNames(Object.getPrototypeOf(element)).sort());
console.log('elementKeys', Object.keys(element).sort());
