import test from 'node:test';import assert from 'node:assert/strict';
import {createAIEngine,calculateTool,cleanContext} from '../server/ai-engine.js';
import {createAIClient} from '../src/ai-client.js';
const model=(parts)=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{role:'model',parts}}]})});
const engine=fetcher=>createAIEngine({getKey:()=> 'test-key-not-real',getModel:()=> 'gemini-flash-latest',fetcher});
const args={operation:'describe',values:[2,4,4,4,5,5,7,9],paired:null,sample:false,x:null,mu:null,sigma:null,n:null};
test('Gemini tool roundtrip uses deterministic calculations and preserves thought signatures',async()=>{
 const requests=[];
 const ai=engine(async(url,options)=>{
  assert.match(url,/generativelanguage.googleapis.com/);assert.equal(url.includes('test-key'),false);assert.equal(options.headers['x-goog-api-key'],'test-key-not-real');
  const body=JSON.parse(options.body);requests.push(body);
  if(requests.length===1)return model([{functionCall:{name:'calculate_statistics',args},thoughtSignature:'opaque-signature'}]);
  const replay=body.contents.find(c=>c.parts.some(p=>p.functionCall));assert.equal(replay.parts[0].thoughtSignature,'opaque-signature');
  const output=body.contents.at(-1).parts[0].functionResponse.response.result;assert.equal(output.mean,5);assert.equal(output.sd,2);
  return model([{text:'The population standard deviation is 2 points. What does that tell you about consistency?'}]);
 });
 const result=await ai.tutor({message:'How spread out are these numbers?',topic:'spread',context:{profile:{sport:'Basketball',level:'Beginner',team:'private preference'},attempts:3,correct:1},history:[{role:'user',text:'I do not understand spread.'}]});
 assert.equal(result.ai,true);assert.match(result.mode,/Gemini/);assert.equal(requests.length,2);assert.equal(JSON.stringify(requests).includes('private preference'),false);assert.equal(JSON.stringify(result).includes('test-key'),false);
});
test('Gemini errors, free-quota failures, safety blocks and call limits become explicit offline replies',async()=>{
 for(const fetcher of [async()=>{throw new Error('quota');},async()=>({ok:false}),async()=>({ok:true,json:async()=>({candidates:[{finishReason:'SAFETY'}]})}),async()=>model([{functionCall:{name:'calculate_statistics',args}}])]){
  const result=await engine(fetcher).tutor({message:'Help with a hint',topic:'spread'});assert.equal(result.ai,false);assert.match(result.mode,/Offline/);assert.ok(result.text);
 }
 let fetched=false;const capped=createAIEngine({getKey:()=> 'test',fetcher:async()=>{fetched=true;},beforeRequest:()=>{throw new Error('cap');}});assert.equal((await capped.tutor({message:'Help',topic:'center'})).ai,false);assert.equal(fetched,false);
});
test('syllabus AI returns only supported IDs with exact source quotations and never confirms a curriculum',async()=>{
 const text='Week 1: calculate the mean and median of a sample. Week 2: discuss sampling.';
 const ai=engine(async()=>model([{text:JSON.stringify({matches:[{topic:'center',evidence:'calculate the mean and median of a sample'},{topic:'hypothesis',evidence:'this text was invented by the model'},{topic:'made-up',evidence:'calculate the mean and median of a sample'}]})}]));
 const result=await ai.course({text});assert.deepEqual(result.topics,['center']);assert.equal(result.confirmed,false);assert.equal(result.evidence.length,1);assert.equal(result.ai,true);
 assert.deepEqual((await ai.course({text:'STAT 101'})).topics,[]);
});
test('all server-side tool operations have known results and reject invalid numerical input',()=>{
 assert.equal(calculateTool(args).sd,2);
 assert.equal(calculateTool({...args,operation:'zscore',x:9}).z,4/Math.sqrt(32/7));
 assert.equal(calculateTool({...args,operation:'regression',values:[1,2,3],paired:[3,5,7],x:4}).prediction,9);
 assert.ok(Math.abs(calculateTool({...args,operation:'normal_probability',x:100,mu:100,sigma:12}).probabilityBelow-.5)<1e-6);
 assert.equal(calculateTool({...args,operation:'standard_error',sigma:12,n:36}).standardError,2);
 assert.equal(calculateTool({...args,operation:'confidence_interval',values:[8,10,12,14,16],sigma:12}).mean,12);
 assert.ok(calculateTool({...args,operation:'hypothesis_test',sigma:12,mu:5}).pValue>.999);
 assert.throws(()=>calculateTool({...args,operation:'normal_probability',x:100,mu:100,sigma:0}));
 assert.throws(()=>calculateTool({...args,values:[1e308,1e308]}));
 assert.deepEqual(cleanContext({profile:{topics:['center','fake'],team:'private'}}).profile.topics,['center']);
});
test('browser AI consent and HTTPS controls keep keys and private context out of the frontend',async()=>{
 let calls=0;const client=createAIClient({base:'https://ai.example.test',student:'student-test-123456',fetcher:async(url,opts)=>{calls++;assert.match(url,/https:\/\/ai.example.test\/api\/ai/);assert.equal('Authorization' in opts.headers,false);return{ok:true,json:async()=>({ai:true,mode:'AI tutor · Gemini',text:'Try the next step.'})};}});
 const body={message:'Explain the formula',topic:'center',context:{profile:{course:'Statistics',topics:['center'],sport:'Basketball',level:'Beginner'}}};
 assert.equal((await client.tutor(body)).ai,false);assert.equal(calls,0);
 assert.equal((await client.tutor(body,{useAI:true})).ai,true);assert.equal(calls,1);
 const insecure=createAIClient({base:'http://insecure.example.test',student:'student-test-123456',fetcher:async()=>{throw new Error('must not fetch');}});assert.equal((await insecure.status()).available,false);
 const disabled=createAIClient({enabled:false,fetcher:async()=>{throw new Error('must not fetch');}});assert.equal((await disabled.status()).available,false);
});
