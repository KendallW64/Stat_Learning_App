import fs from 'node:fs';
import {createSportsProvider,leagues} from '../shared/sports-provider.js';
const provider=createSportsProvider();const results=[];
for(const league of leagues){
 try{
  const catalog=await provider.teams(league.id);const team=league.id==='nba'?catalog.teams.find(t=>t.id==='9')||catalog.teams[0]:catalog.teams[0];
  const data=await provider.dataset({league:league.id,team:team.id,season:2025});
  if(!data.rows.length||data.rows.some(r=>!Number.isFinite(r.value)))throw new Error('No finite observations');
  const record={league:league.id,team:team.name,teamId:team.id,teams:catalog.teams.length,observations:data.rows.length,first:data.rows[0],last:data.rows.at(-1),source:data.url};
  if(league.id==='nba'){
   const roster=await provider.roster(league.id,team.id,2025);record.roster=roster.players.length;record.rosterScope=roster.scope;record.rosterWarning=roster.warning;
   const player=roster.players.find(p=>p.name.includes('Curry'));
   if(player){try{const points=await provider.dataset({league:league.id,team:team.id,season:2025,player:player.id,statistic:'points'});record.player={name:points.player,observations:points.rows.length,values:points.rows.map(r=>r.value),source:points.sources};}catch(error){record.playerError=error.message;}}
  }
  results.push({ok:true,...record});console.log(league.name+': '+data.rows.length+' observations from '+team.name);console.log('::notice title=Sports '+league.id+'::'+JSON.stringify(results.at(-1)));
 }catch(error){results.push({ok:false,league:league.id,error:error.message});try{const catalog=await provider.teams(league.id);const raw=await(await fetch(`https://site.api.espn.com/apis/site/v2/sports/${league.path}/teams/${catalog.teams[0].id}/schedule?season=2025`)).json();console.log('::notice title=Schema '+league.id+'::'+JSON.stringify({keys:Object.keys(raw),season:raw.season,event:raw.events?.[0]}).slice(0,4500));}catch{}console.log(league.name+': '+error.message);console.log('::error title=Sports '+league.id+'::'+error.message);}
}
fs.writeFileSync('sports-provider-results.json',JSON.stringify(results,null,2));
if(results.some(r=>!r.ok)||!results.find(r=>r.league==='nba')?.player)process.exitCode=1;
