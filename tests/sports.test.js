import test from 'node:test';import assert from 'node:assert/strict';
import {createSportsProvider,leagues} from '../shared/sports-provider.js';
const fixture=(id,score,date='2025-01-01',completed=true)=>({id,date,competitions:[{status:{type:{completed,state:completed?'post':'pre'}},competitors:[{id:'9',homeAway:'home',score:{value:score},team:{id:'9',displayName:'Warriors'}},{id:'2',score:{value:90},team:{id:'2',abbreviation:'BOS'}}]}]});
const response=value=>({ok:true,json:async()=>value});
test('sports adapter exposes ten league integrations and normalizes team/roster schemas',async()=>{
 assert.equal(leagues.length,10);const service=createSportsProvider({fetcher:async url=>url.includes('/roster')?response({athletes:[{items:[{id:'30',fullName:'Example Player',position:{abbreviation:'PG'}}]}]}):response({sports:[{leagues:[{teams:[{team:{id:'9',displayName:'Golden State Warriors',shortDisplayName:'Warriors'}}]}]}]})});
 assert.equal((await service.teams('nba')).teams[0].id,'9');assert.equal((await service.roster('nba','9',2025)).players[0].name,'Example Player');
});
test('completed finite team scores retain zero; scheduled/missing scores are not invented',async()=>{
 const service=createSportsProvider({fetcher:async()=>response({team:{displayName:'Warriors'},events:[fixture('1',108),fixture('2',0),fixture('3',null),fixture('4',99,'2025-01-02',false)]})});
 const data=await service.dataset({league:'nba',team:'9',season:2025});assert.deepEqual(data.rows.map(r=>r.value),[108,0]);assert.equal(data.kind,'Historical API');assert.match(data.url,/season=2025/);assert.ok(data.retrievedAt);
});
test('player stats use named box-score columns and omit DNP/missing values without zero imputation',async()=>{
 const service=createSportsProvider({fetcher:async url=>{
  if(url.includes('/schedule'))return response({team:{displayName:'Warriors'},events:[fixture('1',100),fixture('2',95),fixture('3',97)]});
  return response({boxscore:{players:[{team:{id:'9'},statistics:[{names:['assists','points'],labels:['AST','PTS'],athletes:[{athlete:{id:'30',displayName:'Example Player'},stats:['7',url.endsWith('1')?'0':'23'],didNotPlay:url.endsWith('3')}]}]}]}});
 }});
 const data=await service.dataset({league:'nba',team:'9',season:2025,player:'30',statistic:'points'});assert.deepEqual(data.rows.map(r=>r.value),[0,23]);assert.match(data.scope,/1 games/);assert.equal(data.sources.length,3);
});
test('API errors, unavailable observations and unsafe/unsupported selections fail explicitly',async()=>{
 const service=createSportsProvider({fetcher:async()=>response({events:[]})});
 await assert.rejects(service.dataset({league:'nba',team:'9',season:2025}),/No completed/);
 await assert.rejects(service.dataset({league:'made-up',team:'9',season:2025}),/supported league/);
 await assert.rejects(service.dataset({league:'nba',team:'https://evil.test',season:2025}),/valid team/);
 await assert.rejects(service.dataset({league:'nba',team:'9',season:1000}),/season year/);
 const offline=createSportsProvider({fetcher:async()=>{throw new Error('network');}});await assert.rejects(offline.teams('nba'),/could not be reached/);
});
test('repeated provider reads reuse bounded cached responses',async()=>{let calls=0;const service=createSportsProvider({fetcher:async()=>{calls++;return response({sports:[{leagues:[{teams:[{team:{id:'9',displayName:'Warriors'}}]}]}]});}});await service.teams('nba');await service.teams('nba');assert.equal(calls,1);});
test('soccer uses match-roster statistics and excludes unused substitutes rather than turning them into zero',async()=>{
 const service=createSportsProvider({fetcher:async url=>url.includes('/schedule')?response({team:{displayName:'Example club'},events:[fixture('1',2),fixture('2',1)]}):response({rosters:[{team:{id:'9'},roster:[{athlete:{id:'30',displayName:'Example forward'},starter:url.endsWith('1'),subbedIn:false,stats:[{name:'appearances',value:url.endsWith('1')?1:0},{name:'totalGoals',value:0}]}]}]})});
 const data=await service.dataset({league:'epl',team:'9',season:2025,player:'30',statistic:'goals'});assert.equal(data.rows.length,1);assert.equal(data.rows[0].value,0);assert.match(data.scope,/1 games/);
});
