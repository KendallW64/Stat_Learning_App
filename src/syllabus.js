import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
export async function readSyllabus(file){
 const pdf=/\.pdf$/i.test(file.name),textFile=/\.(txt|md)$/i.test(file.name);
 if(!pdf&&!textFile)throw new Error('Choose a PDF, .txt or .md syllabus.');
 if(file.size>(pdf?5*1024*1024:30000))throw new Error(pdf?'Use a PDF under 5 MB.':'Use a text syllabus under 30 KB.');
 let text='',note='';
 if(pdf){
  const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
  const loadingTask=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false});
  const document=await loadingTask.promise;
  try{const pages=Math.min(document.numPages,30);for(let n=1;n<=pages;n++){const content=await(await document.getPage(n)).getTextContent();text+=content.items.map(item=>item.str||'').join(' ')+'\n';}if(document.numPages>pages)note='Only the first 30 pages were read. ';}finally{await loadingTask.destroy();}
  if(!text.trim())throw new Error('This PDF has no extractable text. Paste its text instead; scanned-image OCR is not available.');
 }else text=await file.text();
 if(text.length>29000){text=text.slice(0,29000);note+='Only the first 29,000 characters were loaded; review or replace them with the relevant topic section. ';}
 return{text,message:note+'Syllabus text loaded locally. Review it before finding topics. Nothing is sent to Gemini unless you enable AI topic suggestions.'};
}
