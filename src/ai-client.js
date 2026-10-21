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
    if(!response.ok){const error=new Error(response.status===429?'AI request limit reached. Please wait before trying again.':'The AI service could not be reached.');error.code=response.status===404?'endpoint-not-found':response.status===403?'forbidden':response.status===429?'rate-limited':'service-error';throw error;}
    return response.json();
  }
  async function status(){
    const statusUrl=root?`${root}/api/ai/status`:undefined;
    if(!enabled)return{available:false,reason:'not-connected',statusUrl};
    try{const result=await call('status');if(typeof result?.available!=='boolean')return{available:false,reason:'invalid-response',statusUrl};return{...result,statusUrl};}
    catch(error){return{available:false,reason:error.code||(error instanceof SyntaxError?'invalid-response':'unreachable'),statusUrl};}
  }
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

export function describeAIStatus(status) {
  if(status===null)return{title:'Checking AI connection…',description:'Contacting the configured AI service.'};
  if(status.available)return{title:'AI service configured · Gemini',description:'The Worker has its Gemini key and quota configuration. Enable AI below and send a question to verify the provider accepts the key. No key value is returned to your browser.'};
  const messages={
    'not-connected':['AI backend URL missing from this build','Redeploy GitHub Pages from the latest main branch. The Pages workflow includes the Worker URL; an older build may not include it.'],
    'missing-key':['Gemini key is missing from the Worker','In Cloudflare, open stat-learning-app → Settings → Variables and Secrets. Add a Secret named GEMINI_API_KEY, save and deploy it, then check the connection again. Do not put the key in GitHub Pages variables.'],
    'missing-quota-binding':['Worker quota binding is missing','Deploy the latest Worker from this repository so wrangler.toml creates the AI_BUDGET Durable Object binding. Adding a Gemini key alone does not create that binding.'],
    'endpoint-not-found':['AI endpoint was not found','The configured URL does not serve /api/ai/status. Deploy the repository’s worker/index.js to stat-learning-app and check that AI_API_URL points to the Worker root URL.'],
    'invalid-response':['AI service returned an unexpected response','The URL returned HTML or an incompatible status response. Check that the Worker runs this repository’s AI backend, rather than a frontend or starter template.'],
    'forbidden':['AI service denied this request','Check the Worker’s origin settings and any Cloudflare Access rules. AI_ALLOWED_ORIGINS must include https://kendallw64.github.io.'],
    'rate-limited':['AI service request limit reached','Wait a minute, then check the connection again. The offline guide remains available.'],
    'service-error':['AI service reported an error','Check the Worker deployment and Cloudflare error logs, then retry. Do not paste API keys or secret values into logs or chat.'],
    'unreachable':['AI service unreachable · offline guide available','The browser could not reach the Worker. Check the URL, Worker deployment and CORS origin settings; this does not prove that the Gemini key is missing.'],
  };
  const [title,description]=messages[status.reason]||['AI service is not ready','The Worker returned available: false without a detailed reason. Deploy the latest Worker for separate Gemini-key and quota-binding checks, or view its public status response.'];
  return{title,description};
}
