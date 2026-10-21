import test from 'node:test';import assert from 'node:assert/strict';
import worker from '../worker/index.js';import {AIBudget} from '../worker/budget.js';
function state(){const values=new Map();const storage={get:async k=>values.get(k),put:async(k,v)=>values.set(k,structuredClone(v))};return{storage:{transaction:fn=>fn(storage)}};}
function binding(){const object=new AIBudget(state());return{idFromName:x=>x,get:()=>({fetch:(url,init)=>object.fetch(new Request(url,init))})};}
const req=(path,body,origin='https://kendallw64.github.io')=>new Request('https://ai.example.test'+path,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json','X-Student-Id':'worker-student-123456'},...(body?{body:JSON.stringify(body)}:{})});
test('Worker preflight allows only configured origins and status never leaks secrets',async()=>{
 const env={AI_BUDGET:binding(),GEMINI_API_KEY:'unit-test-key-not-real'};
 const status=await worker.fetch(req('/api/ai/status'),env);assert.equal(status.headers.get('Access-Control-Allow-Origin'),'https://kendallw64.github.io');const text=await status.text();assert.equal(text.includes('unit-test-key'),false);assert.equal(JSON.parse(text).provider,'Gemini');
 assert.equal((await worker.fetch(req('/api/ai/status',null,'https://bad.example'),env)).status,403);
 const preflight=new Request('https://ai.example.test/api/ai/tutor',{method:'OPTIONS',headers:{Origin:'https://kendallw64.github.io'}});assert.equal((await worker.fetch(preflight,env)).status,204);
 assert.equal((await worker.fetch(req('/api/ai/status'),{})).status,200);
});
test('durable daily budget enforces limits and client request limits survive new Worker requests',async()=>{
 const b=binding();const reserve=()=>b.get().fetch('https://quota.internal/reserve',{method:'POST',body:JSON.stringify({kind:'model',dailyLimit:2})});
 assert.equal((await reserve()).status,200);assert.equal((await reserve()).status,200);assert.equal((await reserve()).status,429);
 const env={AI_BUDGET:binding()};for(let i=0;i<4;i++)assert.equal((await worker.fetch(req('/api/ai/tutor',{message:'Give me a hint',topic:'spread'}),env)).status,200);
 const limited=await worker.fetch(req('/api/ai/tutor',{message:'One more',topic:'spread'}),env);assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'60');
});
test('Worker validates requests and can teach offline without Gemini credentials',async()=>{
 const env={AI_BUDGET:binding()};const result=await worker.fetch(req('/api/ai/tutor',{message:'Give me a hint',topic:'spread'}),env);const body=await result.json();assert.equal(body.ai,false);assert.match(body.text,/n − 1/);
 assert.equal((await worker.fetch(req('/api/ai/tutor',{message:'Help',topic:'fake'}),env)).status,400);
 assert.equal((await worker.fetch(req('/api/ai/tutor',{message:'x'.repeat(100001),topic:'spread'}),env)).status,413);
 assert.equal((await worker.fetch(req('/api/ai/tutor',{message:'Help',topic:'spread'}),{})).status,503);
});
