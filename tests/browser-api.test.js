import test from 'node:test';
import assert from 'node:assert/strict';
import {createBrowserApi} from '../src/browser-api.js';
const store = () => {const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};};
const request=(body,method='POST')=>({method,body:JSON.stringify(body)});
test('Pages journey identifies topics, saves confirmed profile and grades retry without server',async()=>{
 const storage=store();const api=createBrowserApi({storage,student:'student'});
 assert.equal(await api('/profile'),null);
 assert.deepEqual((await api('/course/identify',request({text:'STATS 101'}))).topics,[]);
 assert.deepEqual((await api('/course/identify',request({text:'mean and standard deviation'}))).topics,['center','spread']);
 const profile={course:'STATS 101',topics:['center','spread'],sport:'Basketball',team:'Warriors',level:'Beginner'};
 await api('/profile',request(profile,'PUT'));
 const wrong=await api('/attempts',request({topic:'center',answer:10}));assert.equal(wrong.correct,false);assert.equal('expected' in wrong,false);
 assert.equal((await api('/attempts',request({topic:'center',answer:12}))).correct,true);
 const reopened=createBrowserApi({storage,student:'student'});assert.deepEqual(await reopened('/profile'),profile);
 const progress=await reopened('/progress');assert.deepEqual(progress.completed,['center']);assert.equal(progress.attempts.length,2);
 assert.deepEqual((await createBrowserApi({storage,student:'other'})('/progress')).attempts,[]);
});
test('Pages data attribution and provider failure work without backend',async()=>{
 const api=createBrowserApi({storage:store(),student:'student',fetcher:async()=>{throw new Error('network disabled');}});
 const historical=await api('/data?sport=Basketball');assert.equal(historical.kind,'Historical');assert.equal(historical.rows.length,6);
 const fallback=await api('/data?provider=mlb');assert.equal(fallback.kind,'Synthetic');assert.match(fallback.warning,/unavailable/);
});
test('Pages tutor gives contextual offline hints, never claims a live AI model',async()=>{
 const api=createBrowserApi({storage:store(),student:'student'});const r=await api('/tutor',request({topic:'spread',message:'Give me a hint'}));assert.match(r.mode,/Offline/);assert.match(r.text,/n − 1/);assert.doesNotMatch(r.text,/3\.162/);
});
test('Pages refuses invalid profiles, answers, and unavailable storage',async()=>{
 const api=createBrowserApi({storage:store(),student:'student'});
 await assert.rejects(api('/profile',request({course:'STATS 101',topics:[]},'PUT')));
 await assert.rejects(api('/attempts',request({topic:'center',answer:null})));
 const blocked=createBrowserApi({student:'student',storage:{getItem:()=>null,setItem:()=>{throw new Error('quota');}}});
 await assert.rejects(blocked('/attempts',request({topic:'center',answer:12})),/could not be saved/);
 const corrupt=createBrowserApi({student:'student',storage:{getItem:()=>'{bad json'}});await assert.rejects(corrupt('/progress'),/could not be read/);
});
