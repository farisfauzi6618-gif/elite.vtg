// PDFium's browser bundle checks WorkerGlobalScope, which Workers does not
// expose. The renderer supplies compiled WASM explicitly, so use its worker
// branch without modifying the global object or evaluating generated code.
export function adaptPdfiumSource(source){
 const detection='var ENVIRONMENT_IS_WORKER = typeof WorkerGlobalScope != "undefined";';
 if(!source.includes(detection))throw new Error("PDFium environment adapter needs review after the dependency update.");
 return source.replaceAll('typeof WorkerGlobalScope != "undefined"',"true");
}
export function pdfiumCompatibility(){return {name:"pdfium-workers-environment",enforce:"pre",transform(code,id){if(id.endsWith("/@hyzyla/pdfium/dist/index.esm.browser.js"))return {code:adaptPdfiumSource(code),map:null};}};}
