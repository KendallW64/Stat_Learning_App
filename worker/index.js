import {createAIEngine} from '../server/ai-engine.js';
import {createSportsProvider} from '../shared/sports-provider.js';
const sportsProvider=createSportsProvider();
export {AIBudget} from './budget.js';

export default {
  async fetch(request,env) {
    const url=new URL(request.url),origin=request.headers.get('Origin');
    const allowed=(env.AI_ALLOWED_ORIGINS||'https://kendallw64.github.io').split(',').map(s=>s.trim());
    const headers={'Content-Type':'application/json','Vary':'Origin','Cache-Control':'no-store'};
    const json=(data,status=200)=>Response.json(data,{status,headers});
    if(origin&&!allowed.includes(origin))return json({error:'This website is not allowed to use the AI service.'},403);
    if(origin){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='GET,POST,OPTIONS';headers['Access-Control-Allow-Headers']='Content-Type,X-Student-Id';}
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
    if(url.pathname==='/api/health')return json({status:'ok'});
    if(url.pathname==='/api/sports'&&request.method==='GET'){try{return json(await sportsProvider.route(url.searchParams));}catch(error){return json({error:error.message},error.status||502);}}
    const engine=createAIEngine({dataProvider:sportsProvider,getKey:()=>env.GEMINI_API_KEY,getModel:()=>env.GEMINI_MODEL||'gemini-flash-latest',beforeRequest:async()=>{
      if(!env.AI_BUDGET)throw new Error('Budget service not configured.');
      const quota=await env.AI_BUDGET.get(env.AI_BUDGET.idFromName('global')).fetch('https://quota.internal/reserve',{
        method:'POST',body:JSON.stringify({kind:'model',dailyLimit:env.AI_DAILY_REQUEST_LIMIT||'40'}),
      });
      if(!quota.ok){const error=new Error('Daily Gemini request allowance reached.');error.code='app-quota-exceeded';throw error;}
    }});
    if(url.pathname==='/api/ai/status'&&request.method==='GET'){
      const keyPresent=Boolean(env.GEMINI_API_KEY),quotaPresent=Boolean(env.AI_BUDGET);
      return json({...engine.status(),available:keyPresent&&quotaPresent,reason:!keyPresent?'missing-key':!quotaPresent?'missing-quota-binding':'configured',checks:{geminiKeyPresent:keyPresent,quotaBindingPresent:quotaPresent}});
    }
    const action={'/api/ai/tutor':'tutor','/api/ai/course':'course','/api/ai/research':'research'}[url.pathname];
    if(!action)return json({error:'Endpoint not found.'},404);
    if(request.method!=='POST')return json({error:'Use POST.'},405);
    const id=request.headers.get('X-Student-Id');if(!id||!/^[a-zA-Z0-9-]{16,80}$/.test(id))return json({error:'A valid browser student identifier is required.'},400);
    if(!env.AI_BUDGET)return json({error:'AI quota protection is not configured.'},503);
    const ip=request.headers.get('CF-Connecting-IP')||'local-client';
    const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(new Date().toISOString().slice(0,10)+ip));
    const client=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
    const quota=await env.AI_BUDGET.get(env.AI_BUDGET.idFromName('global')).fetch('https://quota.internal/reserve',{
      method:'POST',body:JSON.stringify({kind:'client',client}),
    });
    if(!quota.ok){headers['Retry-After']='60';return json({error:'Request limit reached. Wait a minute and try again.'},429);}
    try{
      if(Number(request.headers.get('Content-Length')||0)>100000)return json({error:'Input is too large.'},413);
      const reader=request.body?.getReader();if(!reader)return json({error:'Provide a JSON body.'},400);
      const chunks=[];let size=0;
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>100000){await reader.cancel();return json({error:'Input is too large.'},413);}chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      const body=JSON.parse(new TextDecoder().decode(bytes));if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'Provide a JSON object.'},400);
      return json(await engine[action](body));
    }catch{return json({error:'The request could not be processed. Check the selected lesson and input length.'},400);}
  },
};
