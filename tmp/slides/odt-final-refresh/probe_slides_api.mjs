import { FileBlob, PresentationFile } from '@oai/artifact-tool';
const pptx = await FileBlob.load('/Users/vn105957/Desktop/odt-submission/submission/Oracle-Developer-Twin-Presentation-Deck.pptx');
const presentation = await PresentationFile.importPptx(pptx);
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(presentation.slides)).sort());
