// One global Durable Object serializes rate/quota reservations across Worker instances.
// No prompts, syllabus text, API keys or raw IP addresses are stored here.
export class AIBudget {
  constructor(state) { this.state=state; }
  async fetch(request) {
    const body=await request.json(),now=Date.now(),day=new Date(now).toISOString().slice(0,10);
    const positive=(v,fallback)=>Number.isInteger(Number(v))&&Number(v)>0?Number(v):fallback;
    const accepted=await this.state.storage.transaction(async tx=>{
      let state=await tx.get('budget');
      if(!state||state.day!==day)state={day,used:0,clients:{}};
      if(body.kind==='model'){
        if(state.used>=positive(body.dailyLimit,40))return false;
        state.used++;
      }else{
        for(const[k,v]of Object.entries(state.clients))if(v.until<now)delete state.clients[k];
        if(typeof body.client!=='string'||body.client.length!==64)return false;
        const client=state.clients[body.client]||{count:0,until:now+60000};
        if(client.count>=4||(!state.clients[body.client]&&Object.keys(state.clients).length>=500))return false;
        client.count++;state.clients[body.client]=client;
      }
      await tx.put('budget',state);return true;
    });
    return Response.json({allowed:accepted},{status:accepted?200:429});
  }
}
