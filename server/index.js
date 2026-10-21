import {createApp} from './app.js';
import express from 'express';
import path from 'node:path';
const {app}=createApp();
if(process.env.NODE_ENV==='production'){app.use(express.static('dist'));app.get('/{*path}',(_req,res)=>res.sendFile(path.resolve('dist/index.html')));}else{const{createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}
app.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log(`SportsStats Academy listening on port ${process.env.PORT||3000}`));
