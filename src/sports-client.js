import {isPages} from './api.js';
const remote=import.meta.env.VITE_AI_API_URL||'';
export async function sportsRequest(action,params={}){
 const root=isPages?remote.replace(/\/$/,''):'';
 if(isPages&&!root)throw new Error('The live sports service is not connected in this build. The attributed bundled dataset is still available.');
 const query=new URLSearchParams({action,...Object.fromEntries(Object.entries(params).filter(([,v])=>v!==undefined&&v!==null&&v!==''))});
 const response=await fetch(`${root}/api/sports?${query}`,{signal:AbortSignal.timeout(35000)});
 let data;try{data=await response.json();}catch{throw new Error('The sports service returned an unreadable response.');}
 if(!response.ok)throw new Error(data.error||'Sports data could not be loaded.');
 return data;
}
