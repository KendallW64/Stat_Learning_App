import express from 'express';
import {createAIEngine} from './ai-engine.js';

export function createAIRoutes({fetcher=fetch}={}){
  const router=express.Router(),clients=new Map();let day='',used=0;
  const positive=(value,fallback)=>Number.isInteger(Number(value))&&Number(value)>0?Number(value):fallback;
  const engine=createAIEngine({fetcher,beforeRequest(){
    const today=new Date().toISOString().slice(0,10);if(day!==today){day=today;used=0;}
    if(used>=positive(process.env.AI_DAILY_REQUEST_LIMIT,40))throw new Error('Daily AI request allowance exhausted.');used++;
  }});
  function cors(req,res,next){
    const origin=req.get('origin'),allowed=(process.env.AI_ALLOWED_ORIGINS||'https://kendallw64.github.io,http://localhost:3000,http://127.0.0.1:3000').split(',').map(x=>x.trim());
    res.vary('Origin');
    if(origin&&!allowed.includes(origin))return res.status(403).json({error:'This website is not allowed to use the AI service.'});
    if(origin){res.set('Access-Control-Allow-Origin',origin);res.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.set('Access-Control-Allow-Headers','Content-Type,X-Student-Id');}
    if(req.method==='OPTIONS')return res.sendStatus(204);next();
  }
  function limit(req,res,next){
    const now=Date.now();for(const[k,v]of clients)if(v.until<now)clients.delete(k);
    const key=req.ip,entry=clients.get(key)||{count:0,until:now+60000};
    if(entry.count>=4||(!clients.has(key)&&clients.size>=5000)){res.set('Retry-After','60');return res.status(429).json({error:'Please wait a minute before asking another AI question.'});}
    entry.count++;clients.set(key,entry);next();
  }
  const handler=action=>async(req,res)=>{try{res.json(await engine[action](req.body||{}));}catch(e){res.status(400).json({error:e.message});}};
  const tutor=handler('tutor');
  router.get('/status',(_req,res)=>res.json(engine.status()));
  router.post('/tutor',limit,tutor);
  router.post('/course',limit,handler('course'));
  return{router,cors,limit,tutor};
}
