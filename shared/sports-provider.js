// Fixed provider URLs only: user/model inputs can never select an arbitrary host.
export const leagues = [
  {id:'nba',sport:'Basketball',name:'NBA',path:'basketball/nba',unit:'points'},
  {id:'wnba',sport:'Basketball',name:'WNBA',path:'basketball/wnba',unit:'points'},
  {id:'ncaam',sport:'Basketball',name:'NCAA men',path:'basketball/mens-college-basketball',unit:'points'},
  {id:'ncaaw',sport:'Basketball',name:'NCAA women',path:'basketball/womens-college-basketball',unit:'points'},
  {id:'mlb',sport:'Baseball',name:'MLB',path:'baseball/mlb',unit:'runs'},
  {id:'nfl',sport:'Football',name:'NFL',path:'football/nfl',unit:'points'},
  {id:'ncaaf',sport:'Football',name:'NCAA football',path:'football/college-football',unit:'points'},
  {id:'epl',sport:'Soccer',name:'Premier League',path:'soccer/eng.1',unit:'goals'},
  {id:'mls',sport:'Soccer',name:'MLS',path:'soccer/usa.1',unit:'goals'},
  {id:'nhl',sport:'Hockey',name:'NHL',path:'hockey/nhl',unit:'goals'},
];
export const defaultLeague = sport => leagues.find(l=>l.sport===sport)?.id || 'nba';
export function statisticsFor(league){
 const sport=leagues.find(l=>l.id===league)?.sport;
 const bySport={Basketball:[['points','Points','PTS'],['rebounds','Rebounds','REB'],['assists','Assists','AST']],Baseball:[['hits','Hits','H'],['homeRuns','Home runs','HR'],['runs','Runs','R']],Football:[['passingYards','Passing yards','YDS','passing'],['rushingYards','Rushing yards','YDS','rushing'],['receivingYards','Receiving yards','YDS','receiving']],Soccer:[['goals','Goals','G'],['assists','Assists','A'],['totalShots','Shots','SH']],Hockey:[['goals','Goals','G'],['assists','Assists','A'],['shotsTotal','Shots','S']]};
 return (bySport[sport]||[]).map(([id,name,label,group])=>({id,name,label,group}));
}
const ROOT='https://site.api.espn.com/apis/site/v2/sports/';
function fail(message,status=400){const e=new Error(message);e.status=status;throw e;}
const numericId=(value,name)=>{if(!/^\d{1,12}$/.test(String(value||'')))fail(`Choose a valid ${name}.`);return String(value);};
const safeURL=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:undefined;}catch{return undefined;}};
export function createSportsProvider({fetcher=fetch,now=()=>Date.now()}={}){
 const cache=new Map();
 async function get(url){
  const cached=cache.get(url);if(cached&&cached.until>now())return cached.value;
  let response;
  try{response=await fetcher(url,{signal:AbortSignal.timeout(15000),cf:{cacheTtl:300,cacheEverything:true}});}catch{fail('The sports provider could not be reached. Try again or use the attributed bundled dataset.',502);}
  if(!response.ok)fail('The sports provider could not return this selection. Try a different season, team or player.',502);
  let value;try{value=await response.json();}catch{fail('The sports provider returned an unreadable response.',502);}
  if(cache.size>=40)cache.delete(cache.keys().next().value);cache.set(url,{value,until:now()+300000});return value;
 }
 function config(id){const league=leagues.find(l=>l.id===id);if(!league)fail('Choose a supported league.');return league;}
 function season(value){const year=Number(value||new Date(now()).getUTCFullYear());if(!Number.isInteger(year)||year<2000||year>new Date(now()).getUTCFullYear()+1)fail('Choose an available season year between 2000 and next year.');return year;}
 async function teams(id){const league=config(id),url=`${ROOT}${league.path}/teams?limit=1000`;const data=await get(url);const rows=(data.sports?.[0]?.leagues?.[0]?.teams||[]).map(v=>v.team||v).filter(t=>t.id&&t.displayName).map(t=>({id:String(t.id),name:t.displayName,shortName:t.shortDisplayName||t.name,abbreviation:t.abbreviation}));if(!rows.length)fail('No teams were returned for this league.',404);return{teams:rows.sort((a,b)=>a.name.localeCompare(b.name)),source:'ESPN',url,scope:'Teams returned by the provider; coverage can vary by league.',retrievedAt:new Date(now()).toISOString()};}
 async function roster(id,team,year){
  const league=config(id),teamId=numericId(team,'team'),y=season(year);let url=`${ROOT}${league.path}/teams/${teamId}/roster?season=${y}`,data=await get(url),fallback=false;
  const extract=value=>(value.athletes||[]).flatMap(v=>v.items||[v]).map(v=>v.athlete||v).filter(p=>p.id&&(p.fullName||p.displayName)).map(p=>({id:String(p.id),name:p.fullName||p.displayName,position:p.position?.abbreviation||p.position?.name||''}));
  let rows=extract(data);
  if(!rows.length){url=`${ROOT}${league.path}/teams/${teamId}/roster`;data=await get(url);rows=extract(data);fallback=true;}
  const unique=[...new Map(rows.map(p=>[p.id,p])).values()];
  return{players:unique.sort((a,b)=>a.name.localeCompare(b.name)),source:'ESPN',url,season:fallback?'current roster':y,warning:fallback?'A historical roster was unavailable. Player choices come from the current roster; selected historical game values still come only from that season’s box scores.':undefined,scope:'Roster returned by the provider; traded players and historical roster coverage may be incomplete.',retrievedAt:new Date(now()).toISOString()};
 }
 async function dataset(query){
  const league=config(query.league),teamId=numericId(query.team,'team'),year=season(query.season),playerId=query.player?numericId(query.player,'player'):null;
  const stat=playerId?statisticsFor(league.id).find(s=>s.id===query.statistic):null;if(playerId&&!stat)fail('Choose a supported player statistic.');
  const url=`${ROOT}${league.path}/teams/${teamId}/schedule?season=${year}${league.sport==='Soccer'?'':'&seasontype=2'}`,schedule=await get(url);
  const teamName=schedule.team?.displayName||`Team ${teamId}`;
  const games=(schedule.events||[]).map(event=>{
   const c=event.competitions?.[0],status=c?.status?.type||event.status?.type;
   if(!(status?.completed===true||status?.state==='post'))return null;
   const own=c.competitors?.find(v=>String(v.id||v.team?.id)===teamId),other=c.competitors?.find(v=>String(v.id||v.team?.id)!==teamId);
   const raw=own?.score?.value??own?.score?.displayValue??own?.score;
   if(raw===undefined||raw===null||raw==='')return null;
   const score=Number(raw),date=event.date||c.date;if(!Number.isFinite(score)||!date||Number.isNaN(Date.parse(date)))return null;
   return{id:String(event.id),date,label:`${own.homeAway==='home'?'vs':'at'} ${other?.team?.abbreviation||other?.team?.displayName||'opponent'}`,value:score,sourceUrl:safeURL(event.links?.[0]?.href),team:teamName};
  }).filter(Boolean).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  if(!games.length)fail('No completed scored games were returned for that team and season. Choose a different season or team; no scores have been invented.',404);
  const selected=playerId?games.slice(-6):games.slice(-100),rows=[];let playerName='';const sources=[url];
  if(playerId){
   // Six bounded box scores keep requests feasible on free hosting. Missing values are never treated as zero.
   const boxscores=await Promise.all(selected.map(async game=>{
    const source=`${ROOT}${league.path}/summary?event=${game.id}`;
    try{return{game,source,data:await get(source)};}catch{return{game,source,data:null};}
   }));
   for(const {game,source,data} of boxscores){
    const group=data?.boxscore?.players?.find(g=>String(g.team?.id)===teamId);
    for(const table of group?.statistics||[]){
     if(stat.group&&String(table.name||'').toLowerCase()!==stat.group)continue;
     const athlete=table.athletes?.find(a=>String(a.athlete?.id)===playerId);
     if(!athlete||athlete.didNotPlay)continue;
     const names=table.names||[],labels=table.labels||[];
     let index=names.findIndex(name=>String(name).toLowerCase()===stat.id.toLowerCase());
     if(index<0)index=labels.findIndex(label=>String(label).toUpperCase()===stat.label);
     const raw=athlete.stats?.[index];if(index<0||typeof raw!=='string'&&typeof raw!=='number'||String(raw).trim()==='')continue;
     const value=Number(raw);if(!Number.isFinite(value))continue;
     playerName=athlete.athlete?.displayName||athlete.athlete?.fullName||`Player ${playerId}`;
     rows.push({...game,value,sourceUrl:source});sources.push(source);break;
    }
   }
   if(!rows.length)fail('No matching numeric player observations were available in the last six completed team games. This can mean a missing box score, a player not participating, or an unsupported statistic. Choose another selection; missing values are not zero.',404);
  }else rows.push(...selected);
  return{id:`espn-${league.id}-${teamId}-${year}-${playerId||'team'}-${stat?.id||'score'}`,sport:league.sport,league:league.name,leagueId:league.id,teamId,playerId,statistic:stat?.id||'score',team:teamName,player:playerName||'Team scoring',title:playerName?`${playerName} · ${stat.name}`:`${teamName} · ${year} scores`,kind:'Historical API',season:String(year),unit:stat?.name.toLowerCase()||league.unit,source:'ESPN schedule and box scores',url,sources:[...new Set(sources)],retrievedAt:new Date(now()).toISOString(),cachePolicy:'Upstream ESPN responses may be cached for up to five minutes.',scope:playerId?`${rows.length} observed ${stat.name.toLowerCase()} values in the last ${selected.length} completed team games returned for ${year}. ${selected.length-rows.length} games have unavailable/nonparticipating player data and are excluded, never replaced with zero. Selected window, not a random sample.`:`${rows.length} completed team games returned by ESPN for ${year}, regular-season request. At most the last 100 observations. Provider season coverage can vary. A selected season/window, not a random sample.`,rows};
 }
 async function route(search){const q=Object.fromEntries(search instanceof URLSearchParams?search:new URLSearchParams(search));if(q.action==='teams')return teams(q.league);if(q.action==='roster')return roster(q.league,q.team,q.season);if(q.action==='dataset')return dataset(q);fail('Choose teams, roster or dataset.');}
 return{teams,roster,dataset,route};
}
