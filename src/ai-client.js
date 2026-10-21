import {offlineGuide} from '../shared/tutor.js';
import {identify} from '../shared/lessons.js';

// The URL is public configuration. Keys are never accepted or stored in a browser.
export function createAIClient({base='',enabled=true,student,fetcher=fetch}={}) {
  const root=base.replace(/\/$/,'');
  async function call(path,body){
    if(root&&!/^https:\/\//i.test(root)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(root))throw new Error('AI service must use HTTPS.');
    const response=await fetcher(`${root}/api/ai/${path}`,{
      method:body?'POST':'GET',headers:{'Content-Type':'application/json','x-student-id':student},
      ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(path==='tutor'?70000:25000),
    });
    if(!response.ok)throw new Error(response.status===429?'AI request limit reached. Please wait before trying again.':'The AI service could not be reached.');
    return response.json();
  }
  async function status(){if(!enabled)return{available:false,reason:'not-connected'};try{return await call('status');}catch{return{available:false,reason:'unreachable'};}}
  async function tutor(body,{useAI=false}={}){
    if(enabled&&useAI){try{return await call('tutor',body);}catch(e){return{ai:false,mode:'Offline guide · AI unavailable',text:`${e.message}\n\n${offlineGuide({message:body.message,topic:body.topic,profile:body.context?.profile})}`};}}
    return{ai:false,mode:'Offline teaching guide · no AI model connected',text:offlineGuide({message:body.message,topic:body.topic,profile:body.context?.profile})};
  }
  async function course(text,{useAI=false}={}){
    if(enabled&&useAI){try{return await call('course',{text});}catch{return{topics:identify(text),confirmed:false,ai:false,message:'AI could not be reached. Keyword suggestions are shown; confirm them against your syllabus.'};}}
    const topics=identify(text);return{topics,confirmed:false,ai:false,message:topics.length?'Topics were found in your text. Confirm them against your syllabus before saving.':'We cannot verify a curriculum from this course name. Add syllabus text or manually select your topics.'};
  }
  return{status,tutor,course};
}
