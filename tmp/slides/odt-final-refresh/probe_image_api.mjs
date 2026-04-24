import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const pptx = await FileBlob.load('/Users/vn105957/Desktop/odt-submission/submission/Oracle-Developer-Twin-Presentation-Deck.pptx');
const presentation = await PresentationFile.importPptx(pptx);
const slide = presentation.slides.getItem(6);
const image = slide.images.items[0];
console.log('imagesMethods', Object.getOwnPropertyNames(Object.getPrototypeOf(slide.images)).sort());
console.log('imageMethods', Object.getOwnPropertyNames(Object.getPrototypeOf(image)).sort());
