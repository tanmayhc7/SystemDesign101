/* ===== Phase 7 demos: architectural patterns ===== */

/* 1. Client-server: stateful vs stateless servers behind a load balancer */
DEMOS.clientserver=function(host){
  let stateless=false,servers,sessions,store,rr=0,ok=0,lost=0;const row=h('div',{class:'cards'});const rd=readout();const log=logbox();const verdict=h('div',{class:'takeaway'});
  const tb=tabs(['Stateful servers (sessions in memory)','Stateless servers + shared session store'],i=>{stateless=i===1;reset();},0);
  function reset(){servers=[{n:'app-1',up:true,mem:{}},{n:'app-2',up:true,mem:{}},{n:'app-3',up:true,mem:{}}];store={};rr=0;ok=0;lost=0;log.clear();verdict.textContent='';draw();}
  function draw(){row.textContent='';servers.forEach(s=>row.append(nodeCard(s.n,`${s.up?'running':'DOWN'}\n${stateless?'no user state':Object.keys(s.mem).length+' sessions in memory'}`,s.up?'':'bad')));
    if(stateless)row.append(nodeCard('session store',Object.keys(store).length+' sessions\n(replicated)','lead'));
    rd.set(`Requests that kept the user logged in: ${ok}    Requests where the session was lost: ${lost}`);}
  function traffic(){const users=['ana','ben','chen','dev','eli','fay'];
    users.forEach(u=>{const live=servers.filter(s=>s.up);if(!live.length)return;const s=live[rr++%live.length];
      if(stateless){if(store[u])ok++;store[u]={cart:1};}else{if(s.mem[u])ok++;else if(servers.some(x=>x!==s&&x.mem[u])){lost++;log.say(`${u}'s request went to ${s.n}, which does not have ${u}'s session: logged out, cart empty.`,'bad');}s.mem[u]={cart:1};}});
    draw();
    verdict.textContent=stateless?'Any server can answer any request because state lives in a shared store. Servers can be added, removed or restarted freely: this is what makes horizontal scaling easy.':lost?'With state in server memory, the load balancer must send each user to the same server (sticky sessions), and losing a server loses its users\' sessions.':'Round robin spreads users over servers. Watch what happens to sessions as requests move around or a server dies.';}
  function kill(){const s=servers.find(x=>x.up);if(!s)return;s.up=false;s.mem={};log.say(`${s.n} crashes.${stateless?' No user state was on it.':' Every session in its memory is gone.'}`,'bad');draw();}
  host.append(h('div',{class:'note'},'Six users browse a shop. A load balancer sends each request to the next server (round robin). Compare keeping sessions in server memory with keeping them in a shared store.'),tb,h('div',{class:'row'},btn('Send a round of requests',traffic),btn('Crash a server',kill,'ghost'),btn('Reset',reset,'ghost')),row,rd,log,verdict);
  reset();
};

/* 2. Monolith vs modular monolith vs microservices */
DEMOS.micro=function(host){
  const A=[{n:'Monolith',hops:0,deploy:t=>Math.min(100,t*9),ops:10,iso:10},{n:'Modular monolith',hops:0,deploy:t=>Math.min(100,t*5),ops:15,iso:30},{n:'Microservices',hops:4,deploy:t=>8,ops:t=>Math.min(100,30+t*3),iso:80}];
  let cur=0,teams=3,svc=4,avail=99.9;const out=h('div');const verdict=h('div',{class:'takeaway'});const rd=readout();
  const tb=tabs(A.map(a=>a.n),i=>{cur=i;draw();},0);
  const st=ctl('Engineering teams working on the product',1,30,teams,1,v=>{teams=v;draw();},v=>v);
  const ss=ctl('Services one user request passes through (microservices)',1,12,svc,1,v=>{svc=v;draw();},v=>v);
  function draw(){out.textContent='';const a=A[cur];const val=x=>typeof x==='function'?x(teams):x;
    const lat=cur===2?svc*2:0;const av=cur===2?Math.pow(avail/100,svc)*100:avail;
    const bar=(lab,v,good)=>{const m=meter(0);m.set(Math.max(3,v),good?(v<40?'go':v<70?'warn':'bad'):(v>60?'go':v>30?'warn':'bad'));return h('div',{style:'margin:8px 0'},h('b',{},lab),m);};
    out.append(bar(`Coordination needed to ship a change (${teams} teams)`,val(a.deploy),true),bar('Operational overhead (deploy pipelines, monitoring, on-call, networking)',val(a.ops),true),bar('Failure and scaling isolation between parts',a.iso,false));
    rd.set(`Extra network latency per request: ${lat} ms (about 2 ms per internal hop)\nAvailability of one request if each part is ${avail}%: ${av.toFixed(3)}%`);
    verdict.textContent=cur===0?(teams<=4?'For a few teams, a well-structured monolith is the fastest and cheapest choice.':'With many teams in one codebase and one deploy, changes queue behind each other and one bad module can break everything.'):cur===1?'A modular monolith enforces boundaries between modules inside one deployable: most of the team independence of microservices without the network. A common stepping stone.':(teams<5?'Microservices for a handful of teams usually costs more in operations than it saves in coordination.':`Teams deploy independently and parts scale and fail separately, but every request now crosses ${svc} services: more latency, lower combined availability unless calls are made resilient.`);}
  host.append(h('div',{class:'note'},'Rough, relative scores to compare the three shapes. Change the number of teams and the length of the call chain.'),tb,st.el,ss.el,out,rd,verdict);
  draw();
};

/* 3. Serverless: cost and cold starts vs an always-on server */
DEMOS.serverless=function(host){
  let reqs=6,dur=200,mem=512;const out=h('div');const rd=readout();const verdict=h('div',{class:'takeaway'});
  const sr=ctl('Requests per day',2,8,reqs,0.5,v=>{reqs=v;draw();},v=>Math.round(Math.pow(10,v)).toLocaleString());
  const sd=ctl('Average run time per request',20,2000,dur,20,v=>{dur=v;draw();},v=>v+' ms');
  const sm=ctl('Memory per function',128,2048,mem,128,v=>{mem=v;draw();},v=>v+' MB');
  function draw(){out.textContent='';const N=Math.pow(10,reqs)*30;
    const fn=N/1e6*0.20+N*(dur/1000)*(mem/1024)*0.0000166667;
    const perSec=Math.pow(10,reqs)/86400;const busy=perSec*dur/1000; // concurrent executions
    const vms=Math.max(2,Math.ceil(busy/8));const vm=vms*0.0416*24*30;
    const mx=Math.max(fn,vm);
    const m1=meter(0);m1.set(Math.max(2,fn/mx*100),fn<=vm?'go':'bad');const m2=meter(0);m2.set(Math.max(2,vm/mx*100),vm<=fn?'go':'bad');
    out.append(h('div',{style:'margin:8px 0'},h('b',{},`Functions: about $${fn<1?fn.toFixed(2):Math.round(fn).toLocaleString()} per month`),m1),h('div',{style:'margin:8px 0'},h('b',{},`Always-on servers (${vms}, kept for redundancy and peaks): about $${Math.round(vm).toLocaleString()} per month`),m2));
    const idleGap=86400/Math.pow(10,reqs);const cold=idleGap>600?90:idleGap>60?40:idleGap>5?8:1;
    rd.set(`Average gap between requests: ${idleGap>=1?idleGap.toFixed(1)+' s':Math.round(idleGap*1000)+' ms'}   Concurrent executions at the average rate: ${busy.toFixed(busy<1?2:0)}\nShare of requests likely to hit a cold start (rough): ${cold}%`);
    verdict.textContent=fn<vm*0.5?'At low or spiky traffic, paying per request is far cheaper than paying for idle servers, but sparse traffic means more cold starts (the first request waits while a new instance starts).':fn>vm*1.5?'At high, steady traffic, per-request pricing costs more than servers that are busy all the time. Serverless still saves operations work, which is a real cost too.':'Around this volume the two cost about the same: decide on operations effort, latency needs (cold starts) and limits (run time, connections).';}
  host.append(h('div',{class:'note'},'Compare paying per function call with running servers all month. Prices are illustrative list prices (per million requests, per GB-second, and a small VM per hour), not a quote.'),sr.el,sd.el,sm.el,out,rd,verdict);
  draw();
};

/* 4. Event-driven: sagas and event sourcing */
DEMOS.eventdriven=function(host){
  const view=h('div');const t=tabs(['Saga: choreography vs orchestration','Event sourcing and CQRS'],i=>{view.textContent='';(i?es:saga)();},0);host.append(t,view);
  function saga(){let orch=false,failAt=2;const log=logbox();const verdict=h('div',{class:'takeaway'});
    const ot=tabs(['Choreography (services react to events)','Orchestration (a coordinator calls each step)'],i=>{orch=i===1;},0);
    const ft=tabs(['Everything succeeds','Payment fails','Shipping fails'],i=>{failAt=[9,1,2][i];},2);
    const steps=[['Inventory','reserve stock','release stock','reserves stock','releases the stock'],['Payments','charge the card','refund the card','charges the card','refunds the card'],['Shipping','book a courier','cancel the booking','books a courier','cancels the booking']];
    function run(){log.clear();log.say('OrderPlaced: order #77 is PENDING.');const done=[];
      for(let i=0;i<steps.length;i++){const [svc,act,,act3]=steps[i];
        if(i===failAt){log.say(orch?`Orchestrator asks ${svc} to ${act}: FAILED.`:`${svc} tries to ${act}: FAILED, publishes ${svc}Failed.`,'bad');
          for(let j=done.length-1;j>=0;j--){const [s2,,comp,,comp3]=steps[done[j]];log.say(orch?`Orchestrator tells ${s2} to ${comp} (compensation).`:`${s2} hears the failure event and ${comp3} (compensation).`,'note');}
          log.say('Order #77 is CANCELLED. Every step that had happened has been undone by a compensating action.');
          verdict.textContent=orch?'Orchestration: the flow and its compensations live in one place, easy to read and monitor, but the orchestrator is a central dependency that knows every step.':'Choreography: no central coordinator and services stay loosely coupled, but the overall flow is spread across services and harder to follow, test and change.';return;}
        log.say(orch?`Orchestrator asks ${svc} to ${act}: done.`:`${svc} hears the previous event, ${act3}, and publishes ${svc}Done.`);done.push(i);}
      log.say('Order #77 is CONFIRMED.');verdict.textContent='A saga splits one business transaction into local transactions, one per service. There is no global rollback, so each step needs a compensating action, and in-between states (PENDING) are visible.';}
    view.append(h('div',{class:'note'},'An order needs stock, a payment and a courier from three services with separate databases. Pick a coordination style and where it fails.'),ot,ft,h('div',{class:'row'},btn('Place the order',run)),log,verdict);}
  function es(){const ev=[['AccountOpened',0],['Deposited',100],['Withdrew',-30],['Deposited',50],['Withdrew',-80],['Deposited',20]];let upto=ev.length,lag=2;const list=h('div',{class:'log'});const rd=readout();const verdict=h('div',{class:'takeaway'});
    const s1=ctl('Replay events up to',1,ev.length,upto,1,v=>{upto=v;draw();},v=>'event '+v);
    const s2=ctl('Read model is behind by',0,3,lag,1,v=>{lag=v;draw();},v=>v+' events');
    function draw(){list.textContent='';ev.forEach(([n,a],i)=>list.append(h('div',{class:i<upto?'':'note',style:i<upto?'':'opacity:.45'},`${i+1}. ${n}${a?' '+(a>0?'+':'')+a:''}`)));
      const bal=ev.slice(0,upto).reduce((s,e)=>s+e[1],0);const rm=ev.slice(0,Math.max(1,upto-lag)).reduce((s,e)=>s+e[1],0);
      rd.set(`State rebuilt from events 1-${upto}: balance ${bal}\nRead model (CQRS query side), ${lag} event${lag===1?'':'s'} behind: balance ${rm}${rm!==bal?'  (stale)':''}`);
      verdict.textContent='Event sourcing stores every change as an immutable event and derives the current state by replaying them, so you get a full audit trail and can rebuild any past state. CQRS serves queries from separate read models built from those events, which scale independently but lag behind the write side.';}
    view.append(h('div',{class:'note'},'A bank account stored as a log of events instead of a single balance row.'),s1.el,s2.el,list,rd,verdict);draw();}
  saga();
};

/* 5. Peer-to-peer: file distribution time */
DEMOS.p2p=function(host){
  let F=1,us=100,up=2,dn=10;const out=h('div');const verdict=h('div',{class:'takeaway'});
  const sf=ctl('File size',0.1,4,F,0.1,v=>{F=v;draw();},v=>v.toFixed(1)+' GB');
  const su=ctl('Server upload speed',10,1000,us,10,v=>{us=v;draw();},v=>v+' Mbit/s');
  const sp=ctl('Each peer\'s upload speed',0.5,20,up,0.5,v=>{up=v;draw();},v=>v+' Mbit/s');
  function draw(){out.textContent='';const bits=F*8000; // Mbit
    const Ns=[10,100,1000,10000,100000];const cs=N=>Math.max(N*bits/us,bits/dn);const pp=N=>Math.max(bits/us,bits/dn,N*bits/(us+N*up));
    const mx=cs(Ns[Ns.length-1]);const fmt=s=>s<120?Math.round(s)+' s':s<7200?Math.round(s/60)+' min':s<172800?(s/3600).toFixed(1)+' h':(s/86400).toFixed(1)+' days';
    Ns.forEach(N=>{const a=meter(0),b=meter(0);a.set(Math.max(1,Math.log10(cs(N))/Math.log10(mx)*100),'bad');b.set(Math.max(1,Math.log10(pp(N))/Math.log10(mx)*100),'go');
      out.append(h('div',{style:'margin:10px 0'},h('b',{},`${N.toLocaleString()} downloaders`),h('div',{class:'note'},`One server sends everyone a copy: ${fmt(cs(N))}`),a,h('div',{class:'note'},`Peers also upload to each other: ${fmt(pp(N))}`),b));});
    verdict.textContent='With one server, time grows in step with the number of downloaders, because the server must upload every copy. In peer-to-peer, each new downloader also adds upload capacity, so time levels off. The price is trust, churn, NAT traversal and no central control.';}
  host.append(h('div',{class:'note'},'Distributing one file to many users. Peers download at 10 Mbit/s. Bars use a log scale. This is the classic minimum distribution time model.'),sf.el,su.el,sp.el,out,verdict);
  draw();
};
