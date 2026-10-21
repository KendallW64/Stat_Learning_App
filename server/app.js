import express from 'express';
import {createSportsProvider} from '../shared/sports-provider.js';
import {createAIRoutes} from './ai-routes.js';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import {lessons,identify,practice,worked} from '../shared/lessons.js';
import {grade,round} from '../shared/stats.js';
import {bundled,mlbData,sports} from './data.js';
export function createApp({dbPath=process.env.DB_PATH||'.runtime/academy.sqlite',fetcher=fetch}={}){
 if(dbPath!==':memory:')fs.mkdirSync(dbPath.substring(0,dbPath.lastIndexOf('/'))||'.',{recursive:true});
 const db=new DatabaseSync(dbPath);db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS attempts (id INTEGER PRIMARY KEY, student TEXT NOT NULL, topic TEXT NOT NULL, answer REAL NOT NULL, correct INTEGER NOT NULL, created TEXT DEFAULT CURRENT_TIMESTAMP);');
 const app=express();if(process.env.TRUST_PROXY==='1')app.set('trust proxy',1);app.disable('x-powered-by');app.use(express.json({limit:'128kb'}));
 const ai=createAIRoutes({fetcher});app.use('/api/ai',ai.cors);app.use('/api/sports',ai.cors);
 const sportsProvider=createSportsProvider({fetcher});app.get('/api/sports',async(req,res)=>{try{res.json(await sportsProvider.route(new URLSearchParams(req.query)));}catch(e){res.status(e.status||502).json({error:e.message});}});
 app.get('/api/health',(_req,res)=>res.json({status:'ok'}));
 app.use('/api',(req,res,next)=>{const id=req.get('x-student-id');if(!id||!/^[a-zA-Z0-9-]{16,80}$/.test(id))return res.status(400).json({error:'A valid browser student identifier is required.'});req.student=id;next();});
 const getProfile=id=>{const row=db.prepare('SELECT body FROM profiles WHERE id=?').get(id);return row?JSON.parse(row.body):null;};
 app.get('/api/profile',(req,res)=>res.json(getProfile(req.student)));
 app.put('/api/profile',(req,res)=>{const{course,topics,sport,team,level}=req.body;if(typeof course!=='string'||course.trim().length<2||course.length>180||!Array.isArray(topics)||!topics.length||topics.some(id=>!lessons.some(l=>l.id===id))||!sports.includes(sport)||typeof team!=='string'||team.length>100||!['Beginner','Intermediate','Advanced'].includes(level))return res.status(400).json({error:'Confirm a course name, at least one topic, a supported sport, team preference, and explanation level.'});const profile={course:course.trim(),topics:[...new Set(topics)],sport,team,level};db.prepare('INSERT INTO profiles VALUES (?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body').run(req.student,JSON.stringify(profile));res.json(profile);});
 app.post('/api/course/identify',(req,res)=>{if(typeof req.body.text!=='string'||req.body.text.length>30000)return res.status(400).json({error:'Provide course or syllabus text under 30,000 characters.'});const topics=identify(req.body.text);res.json({topics,confirmed:false,message:topics.length?'Topics were found in your text. Confirm them against your syllabus before saving.':'We cannot verify a curriculum from this course name. Add syllabus text or manually select your topics.'});});
 app.get('/api/data',async(req,res)=>{if(req.query.provider==='mlb')return res.json(await mlbData(fetcher));try{res.json(bundled(req.query.sport||'Basketball'));}catch(e){res.status(400).json({error:e.message});}});
 app.get('/api/progress',(req,res)=>{const attempts=db.prepare('SELECT topic, answer, correct, created FROM attempts WHERE student=? ORDER BY id DESC').all(req.student);res.json({attempts,completed:[...new Set(attempts.filter(a=>a.correct).map(a=>a.topic))]});});
 app.post('/api/attempts',(req,res)=>{const{topic,answer}=req.body;if(!lessons.some(l=>l.id===topic)||typeof answer!=='number'||!Number.isFinite(answer))return res.status(400).json({error:'Choose a valid lesson and enter a finite numeric answer.'});const p=practice(topic),correct=grade(answer,p.expected);db.prepare('INSERT INTO attempts(student,topic,answer,correct) VALUES (?,?,?,?)').run(req.student,topic,answer,correct?1:0);res.json({correct,message:correct?'Exactly right. You have put the concept into practice.':`Not quite yet. ${p.hint} Check your arithmetic and try again.`,...(correct?{expected:round(p.expected)}:{})});});
 app.use('/api/ai',ai.router);
 app.post('/api/tutor',ai.cors,ai.limit,(req,res)=>{req.body={...req.body,context:{profile:getProfile(req.student)}};return ai.tutor(req,res);});
 app.use('/api',(_req,res)=>res.status(404).json({error:'API route not found.'}));
 app.use((err,req,res,next)=>res.status(err.status||500).json({error:err.status===413?'Input is too large.':'The request could not be processed.'}));
 return{app,db};
}
