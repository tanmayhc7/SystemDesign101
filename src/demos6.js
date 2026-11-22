/* ===== Phase 6 demos: distributed systems and microservices ===== */
const nodeCard=(label,sub,cls)=>h('div',{class:'card',style:`min-width:110px;text-align:center;padding:10px;${cls==='bad'?'border-color:var(--bad);opacity:.75':cls==='lead'?'border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)':cls==='warn'?'border-color:var(--warn,#d97706)':''}`},h('b',{},label),h('div',{class:'note',style:'white-space:pre-line'},sub));

/* 1. Heartbeats: timeout vs detection time vs false alarms */
DEMOS.heartbeat=function(host,o,ctx){
  let every=1,timeout=3,t=0;const nodes=['A','B','C','D'].map(n=>({n,last:0,alive:true,pause:0,susp:false}));
  let falseAlarms=0,detect=null,killedAt=null;const row=h('div',{class:'cards'});const rd=readout();const log=logbox();const verdict=h('div',{class:'takeaway'});
  const st=ctl('Timeout before a node is declared dead',1,10,timeout,0.5,v=>{timeout=v;},v=>v+' s');
  function tick(){t+=0.25;
    nodes.forEach(x=>{if(x.pause>0)x.pause-=0.25;if(x.alive&&x.pause<=0&&Math.abs((t/every)-Math.round(t/every))<0.01)x.last=t;
      const age=t-x.last;const dead=age>timeout;
      if(dead&&!x.susp){x.susp=true;if(x.alive){falseAlarms++;log.say(`t=${t.toFixed(1)}s: ${x.n} declared dead after ${age.toFixed(1)} s of silence, but it was only paused. False alarm: its work gets moved for nothing.`,'bad');}else{detect=t-killedAt;log.say(`t=${t.toFixed(1)}s: ${x.n} declared dead, ${detect.toFixed(1)} s after it crashed.`,'note');}}
      if(!dead&&x.susp){x.susp=false;log.say(`t=${t.toFixed(1)}s: ${x.n} is heard from again.`);}});
    row.textContent='';nodes.forEach(x=>{const age=t-x.last;row.append(nodeCard('Node '+x.n,`last heartbeat ${age.toFixed(1)} s ago\n${x.susp?'DECLARED DEAD':x.pause>0?'paused (GC)':'healthy'}`,x.susp?'bad':age>every*1.5?'warn':''));});
    rd.set(`Heartbeat every ${every} s, timeout ${timeout} s.  False alarms: ${falseAlarms}.  Last real failure detected in: ${detect===null?'-':detect.toFixed(1)+' s'}`);
    verdict.textContent=timeout<=2?'A short timeout detects crashes fast but mistakes pauses and network blips for deaths.':timeout>=6?'A long timeout avoids false alarms, but a real crash goes unnoticed for a long time, and requests keep going to a dead node.':'The timeout is a trade-off between how fast you detect real failures and how often you raise false alarms.';}
  function pause(){const x=nodes[1];x.pause=3.5;log.say(`t=${t.toFixed(1)}s: node B freezes for 3.5 s (a long garbage-collection pause). It is not dead.`);}
  function kill(){const x=nodes[2];if(!x.alive)return;x.alive=false;killedAt=t;log.say(`t=${t.toFixed(1)}s: node C crashes.`,'bad');}
  function reset(){t=0;falseAlarms=0;detect=null;killedAt=null;nodes.forEach(x=>{x.last=0;x.alive=true;x.pause=0;x.susp=false;});log.clear();}
  host.append(h('div',{class:'note'},'Four nodes send a heartbeat every second to a monitor. Pause node B or crash node C, and try different timeouts. Time runs at 1 simulated second per real second.'),st.el,h('div',{class:'row'},btn('Pause node B for 3.5 s',pause),btn('Crash node C',kill,'ghost'),btn('Reset',reset,'ghost')),row,rd,log,verdict);
  ctx.every(250,tick);tick();
};

/* 2. Service discovery: stale client caches vs health-checked registry */
DEMOS.discovery=function(host){
  let inst=[{id:1,up:true},{id:2,up:true},{id:3,up:true}],next=4,checks=true,refresh=5,t=0,cache=null,lastRefresh=-99,fails=0,ok=0,rr=0;
  let registry=inst.map(i=>i.id);const row=h('div',{class:'cards'});const rd=readout();const log=logbox();const verdict=h('div',{class:'takeaway'});
  const hc=chip('Registry runs health checks (removes a dead instance within 2 s)',()=>{checks=!checks;hc.classList.toggle('on',checks);},true);
  const sr=ctl('Client refreshes its cached list every',1,30,refresh,1,v=>{refresh=v;},v=>v+' s');
  function draw(){row.textContent='';inst.forEach(i=>row.append(nodeCard('orders-'+i.id,`${i.up?'running':'DEAD'}\n${registry.includes(i.id)?'in registry':'not registered'}`,i.up?'':'bad')));
    rd.set(`t=${t}s  Registry: [${registry.map(x=>'orders-'+x).join(', ')}]\nClient cache: [${(cache||[]).map(x=>'orders-'+x).join(', ')}] (refreshed at t=${lastRefresh}s)\nRequests ok: ${ok}   failed: ${fails}`);}
  function second(){t++;inst.forEach(i=>{if(!i.up&&checks&&i.downAt!==undefined&&t-i.downAt>=2)registry=registry.filter(x=>x!==i.id);});
    if(cache===null||t-lastRefresh>=refresh){cache=registry.slice();lastRefresh=t;}
    let f=0;for(let k=0;k<10;k++){if(!cache.length){f++;continue;}const id=cache[rr++%cache.length];const i=inst.find(x=>x.id===id);if(i&&i.up)ok++;else f++;}
    fails+=f;if(f)log.say(`t=${t}s: ${f} of 10 requests went to a dead instance.`,'bad');}
  function send(){for(let s=0;s<3;s++)second();draw();
    verdict.textContent=!checks&&inst.some(i=>!i.up)?'Without health checks the registry keeps advertising a dead instance forever, so clients keep failing.':fails?'Failures last until the registry notices and the client refreshes its cache. Retrying on another instance hides most of this.':'All requests reached a live instance.';}
  function kill(){const i=inst.find(x=>x.up);if(!i)return;i.up=false;i.downAt=t;log.say(`t=${t}s: orders-${i.id} crashes without deregistering.`,'bad');draw();}
  function addI(){const i={id:next++,up:true};inst.push(i);registry.push(i.id);log.say(`t=${t}s: orders-${i.id} starts and registers itself.`,'note');draw();}
  function reset(){inst=[{id:1,up:true},{id:2,up:true},{id:3,up:true}];next=4;registry=[1,2,3];t=0;cache=null;lastRefresh=-99;fails=0;ok=0;rr=0;log.clear();verdict.textContent='';draw();}
  host.append(h('div',{class:'note'},'Three instances of the orders service register with a registry. A client caches the list and sends 10 requests per second, round robin. Crash an instance, then send traffic.'),hc,sr.el,h('div',{class:'row'},btn('Send traffic for 3 seconds',send),btn('Crash an instance',kill,'ghost'),btn('Start a new instance',addI,'ghost'),btn('Reset',reset,'ghost')),row,rd,log,verdict);
  draw();
};

/* 3. Consensus (Raft-style): majority, leader election, partitions */
DEMOS.raft=function(host){
  let N=5,term=1,leader=0,alive,side,log0,commit,ops;const row=h('div',{class:'cards'});const rd=readout();const log=logbox();const verdict=h('div',{class:'takeaway'});
  function reset(){term=1;leader=0;alive=new Array(N).fill(true);side=new Array(N).fill(0);log0=new Array(N).fill(0);commit=0;ops=0;log.clear();verdict.textContent='';draw();}
  const maj=()=>Math.floor(N/2)+1;
  const reach=(a,b)=>alive[a]&&alive[b]&&side[a]===side[b];
  function draw(){row.textContent='';for(let i=0;i<N;i++){const r=!alive[i]?'down':i===leader?'LEADER':'follower';row.append(nodeCard('Node '+(i+1),`${r}${side[i]?' (cut off)':''}\nterm ${term}, log length ${log0[i]}`,!alive[i]?'bad':i===leader?'lead':side[i]?'warn':''));}
    rd.set(`Cluster of ${N}: a majority is ${maj()}.  Committed entries: ${commit}.  Current term: ${term}`);}
  function write(){ops++;if(leader<0||!alive[leader]){log.say('No leader: the write cannot be accepted until an election succeeds.','bad');return draw();}
    const peers=[...Array(N).keys()].filter(i=>reach(leader,i));log0[leader]++;peers.forEach(i=>{if(i!==leader)log0[i]=log0[leader];});
    if(peers.length>=maj()){commit=log0[leader];log.say(`Leader (node ${leader+1}) appends entry ${log0[leader]} and gets ${peers.length} of ${N} acknowledgements: majority reached, committed.`,'note');verdict.textContent='A write is committed once a majority stores it. Any future majority overlaps this one, so a committed entry is never lost.';}
    else{log.say(`Leader (node ${leader+1}) can reach only ${peers.length} of ${N} nodes. No majority: the entry stays uncommitted and the client gets no success.`,'bad');verdict.textContent='A leader cut off in a minority cannot commit anything. This is consistency over availability (CP): the minority side refuses writes instead of risking a split brain.';}
    draw();}
  function elect(){const cands=[...Array(N).keys()].filter(i=>alive[i]);
    for(const grp of [0,1]){const members=cands.filter(i=>side[i]===grp);if(members.length>=maj()&&!(members.includes(leader)&&alive[leader])){
      const best=members.reduce((a,b)=>log0[b]>log0[a]?b:a,members[0]);term++;const old=leader;leader=best;
      log.say(`Followers stop hearing from the leader, time out at random, and one starts an election for term ${term}. Node ${best+1} has the most complete log and wins ${members.length} votes.`,'note');
      if(old>=0&&alive[old]&&side[old]!==grp)log.say(`Old leader node ${old+1} is still running in the minority with term ${term-1}. When it reconnects it sees the higher term and steps down.`);return true;}}
    return false;}
  function killL(){if(leader<0||!alive[leader])return;alive[leader]=false;log.say(`Leader node ${leader+1} crashes.`,'bad');if(!elect()){leader=-1;log.say('Not enough nodes left for a majority: no leader can be elected.','bad');}draw();}
  function part(){if(leader<0)return;side=side.map(()=>0);side[leader]=1;const other=(leader+1)%N;side[other]=1;
    log.say(`Network partition: node ${leader+1} (the leader) and node ${other+1} are cut off from the other ${N-2}.`,'bad');elect();draw();}
  function heal(){side=side.map(()=>0);const lead=[...Array(N).keys()].filter(i=>alive[i]).reduce((a,b)=>log0[b]>log0[a]?b:a);log.say(`Partition heals. Uncommitted entries from the old minority leader are discarded; every node copies the current leader's log.`,'note');
    if(leader>=0)for(let i=0;i<N;i++)if(alive[i])log0[i]=log0[leader];draw();}
  host.append(h('div',{class:'note'},'Five nodes replicate a log Raft-style. Write entries, crash the leader, or partition the leader away from the majority.'),h('div',{class:'row'},btn('Client write',write),btn('Crash the leader',killL,'ghost'),btn('Partition leader + 1 node',part,'ghost'),btn('Heal partition',heal,'ghost'),btn('Reset',reset,'ghost')),row,rd,log,verdict);
  reset();
};

/* 4. Distributed locking: leases and fencing tokens */
DEMOS.dlock=function(host){
  let fencing=false,lease=10,pause=15;const log=logbox();const rd=readout();const verdict=h('div',{class:'takeaway'});
  const tb=tabs(['Lock with a lease only','Lease plus fencing token'],i=>{fencing=i===1;log.clear();verdict.textContent='';rd.set('');},0);
  const sl=ctl('Lease length',5,30,lease,1,v=>{lease=v;},v=>v+' s');
  const sp=ctl('Client A stalls for (GC pause or slow network)',0,30,pause,1,v=>{pause=v;},v=>v+' s');
  function run(){log.clear();let file='v0',maxTok=0;
    log.say(`t=0: Client A acquires the lock with a ${lease} s lease${fencing?' and fencing token 33':''}.`);let tokA=33,tokB=34;
    log.say(`t=1: A reads the file, then stalls for ${pause} s.`);
    if(pause<lease){log.say(`t=${1+pause}: A resumes while its lease is still valid and writes.`);file='A';log.say(`A releases the lock. Client B acquires it and writes.`);file='B';rd.set('File history: v0 -> A -> B (correct)');verdict.textContent='The pause was shorter than the lease, so nothing went wrong. But no lease length is safe against every pause.';return;}
    log.say(`t=${lease}: A's lease expires. The lock service lets Client B acquire it${fencing?' with token 34':''}.`,'bad');
    log.say(`t=${lease+1}: B writes its update.`);file='B';maxTok=tokB;
    log.say(`t=${1+pause}: A wakes up, still believes it holds the lock, and writes.`,'bad');
    if(fencing){log.say(`Storage sees token 33, but it has already accepted 34. Write rejected.`,'note');rd.set('File history: v0 -> B (A\'s stale write rejected)');verdict.textContent='Fencing tokens are increasing numbers issued with each lock grant. The storage rejects any write with a token lower than one it has seen, so a stale holder cannot do damage.';}
    else{file='A';rd.set('File history: v0 -> B -> A (B\'s update overwritten by a client that no longer holds the lock)');verdict.textContent='Both clients believed they held the lock. A lease alone cannot stop a client that paused past its expiry: the resource itself must check a fencing token.';}}
  host.append(h('div',{class:'note'},'Two clients use a lock to protect a shared file. Client A stalls while holding it. Compare a plain lease with a fencing token checked by the storage.'),tb,sl.el,sp.el,h('div',{class:'row'},btn('Run the scenario',run)),rd,log,verdict);
};

/* 5. Gossip: rounds to spread an update */
DEMOS.gossip=function(host,o,ctx){
  let N=64,fan=2,known,round,msgs,stop=null,seed=1;const grid=h('div',{style:'display:flex;flex-wrap:wrap;gap:4px;max-width:640px;margin:10px 0'});const rd=readout();const verdict=h('div',{class:'takeaway'});
  const sn=ctl('Nodes in the cluster',16,256,N,16,v=>{N=v;reset();},v=>v);
  const sf=ctl('Fanout (peers contacted per round)',1,4,fan,1,v=>{fan=v;reset();},v=>v);
  function draw(){grid.textContent='';for(let i=0;i<N;i++)grid.append(h('span',{style:`width:14px;height:14px;border-radius:50%;display:inline-block;background:${known[i]?'var(--accent)':'var(--well)'};border:1px solid var(--line)`,title:'node '+i}));
    const k=known.filter(Boolean).length;rd.set(`Round ${round}: ${k} of ${N} nodes know the update.  Messages sent: ${msgs}.  log2(${N}) = ${Math.log2(N).toFixed(1)}`);}
  function reset(){if(stop)stop();stop=null;known=new Array(N).fill(false);known[0]=true;round=0;msgs=0;verdict.textContent='';draw();}
  function step(){const r=mkRand(seed*1000+round);const nk=known.slice();
    for(let i=0;i<N;i++)if(known[i])for(let f=0;f<fan;f++){const p=Math.floor(r()*N);nk[p]=true;msgs++;}
    known=nk;round++;draw();
    if(known.every(Boolean)){if(stop)stop();stop=null;verdict.textContent=`Everyone knew after ${round} rounds. Gossip spreads in about log(N) rounds: doubling the cluster adds roughly one round, and no node talks to more than ${fan} peers per round.`;}}
  function run(){reset();seed++;stop=ctx.every(500,step);}
  host.append(h('div',{class:'note'},'One node learns something new (for example, that a node joined). Each round, every node that knows it tells a few random peers.'),sn.el,sf.el,h('div',{class:'row'},btn('Spread it',run),btn('One round',step,'ghost'),btn('Reset',reset,'ghost')),grid,rd,verdict);
  reset();
};

/* 6. Resilience: circuit breaker, timeouts and retry storms */
DEMOS.breaker=function(host,o,ctx){
  const view=h('div');const tb=tabs(['Circuit breaker','Retry storm'],i=>{view.textContent='';if(stopper){stopper();stopper=null;}(i?storm:cb)();},0);let stopper=null;host.append(tb,view);
  function cb(){let health=0,useCB=true,state='CLOSED',openUntil=0,win=[],t=0,pool=0,served=0,failed=0,fast=0;const POOL=40;
    const ht=tabs(['Downstream healthy','Downstream slow (timeouts)','Downstream down'],i=>{health=i;},0);
    const cc=chip('Use a circuit breaker',()=>{useCB=!useCB;cc.classList.toggle('on',useCB);state='CLOSED';win=[];},true);
    const pm=meter(0);const rd=readout();const verdict=h('div',{class:'takeaway'});
    function tick(){t++;let busy=0,bad=0;
      if(useCB&&state==='OPEN'&&t>=openUntil){state='HALF-OPEN';}
      for(let k=0;k<10;k++){
        if(useCB&&state==='OPEN'){fast++;continue;}
        if(useCB&&state==='HALF-OPEN'&&k>0){fast++;continue;}
        const okReq=health===0;busy+=okReq?0.5:health===1?20:2;if(okReq)served++;else{failed++;bad++;}
        if(useCB){win.push(okReq?0:1);if(win.length>20)win.shift();}
        if(useCB&&state==='HALF-OPEN'){state=okReq?'CLOSED':'OPEN';if(!okReq)openUntil=t+8;win=[];break;}}
      if(useCB&&state==='CLOSED'&&win.length>=10&&win.reduce((a,b)=>a+b,0)/win.length>0.5){state='OPEN';openUntil=t+8;}
      pool=Math.min(POOL,busy);pm.set(pool/POOL*100,pool>=POOL?'bad':pool>POOL*0.6?'warn':'go');
      rd.set(`Breaker: ${useCB?state:'none'}    Threads busy waiting on downstream: ${Math.round(pool)} of ${POOL}\nSucceeded: ${served}   Failed after waiting: ${failed}   Failed fast with fallback: ${fast}`);
      verdict.textContent=!useCB&&health>0?'Every request waits for the timeout before failing. Threads pile up waiting, so this service runs out of threads and fails its own callers too: a cascading failure.':useCB&&state==='OPEN'?'The breaker is open: calls fail immediately and a fallback (cached data, a default, a degraded page) is returned. Threads stay free, and the struggling downstream gets room to recover.':useCB&&state==='HALF-OPEN'?'Half-open: one trial request checks if the downstream has recovered.':'Closed: calls flow normally while the breaker counts failures.';}
    view.append(h('div',{class:'note'},'Your service sends 10 calls per tick to a downstream service, with a 2 second timeout and a pool of 40 threads. Break the downstream and compare with and without a breaker (opens above 50% failures, retries after 8 ticks).'),ht,h('div',{class:'row'},cc),h('b',{},'Thread pool'),pm,rd,verdict);
    stopper=ctx.every(400,tick);tick();}
  function storm(){let r=3,layers=3,budget=false;const rd=readout();const verdict=h('div',{class:'takeaway'});const bars=h('div');
    const sr=ctl('Retries per call at each layer',0,5,r,1,v=>{r=v;draw();},v=>v);const sl=ctl('Layers of services calling each other',1,5,layers,1,v=>{layers=v;draw();},v=>v);
    const bc=chip('Retry only at the edge, with a retry budget',()=>{budget=!budget;bc.classList.toggle('on',budget);draw();},false);
    function draw(){bars.textContent='';const per=budget?1:r+1;let total=1;
      for(let L=1;L<=layers;L++){total=budget?(L===1?r+1:1)*(L===1?1:total):total*per;const calls=budget?(r+1):Math.pow(r+1,L);
        const m=meter(0);m.set(Math.min(100,Math.log10(calls)/Math.log10(Math.pow(6,5))*100+3),calls>50?'bad':calls>8?'warn':'go');bars.append(h('div',{style:'margin:6px 0'},h('span',{class:'note'},`Layer ${L}: ${calls.toLocaleString()} calls for one user request`),m));}
      const last=budget?r+1:Math.pow(r+1,layers);
      rd.set(`One failing request at the bottom layer turns into ${last.toLocaleString()} calls.`);
      verdict.textContent=budget?'Retrying in one place, with a limited budget (for example at most 10% extra calls) plus backoff and jitter, keeps load bounded while the system is struggling.':last>20?'Retries multiply at every layer. When the bottom service is already overloaded, this flood makes sure it cannot recover.':'Small numbers of retries are cheap and hide transient blips.';}
    view.append(h('div',{class:'note'},'Each service retries a failed call. When the deepest service fails, how many calls does one user request create?'),sr.el,sl.el,h('div',{class:'row'},bc),bars,rd,verdict);draw();}
  cb();
};

/* 7. Disaster recovery: RPO, RTO and cost */
DEMOS.dr=function(host){
  const S=[
    {n:'Backup and restore',rpo:b=>b*60,rto:240,cost:1,d:'Periodic backups copied to another region. Rebuild everything after a disaster.'},
    {n:'Pilot light',rpo:()=>1,rto:45,cost:2,d:'Data replicated continuously; core infrastructure exists but is switched off or minimal. Scale up on disaster.'},
    {n:'Warm standby',rpo:()=>1,rto:10,cost:3.5,d:'A smaller full copy of the system runs in the second region all the time. Scale it up and switch traffic.'},
    {n:'Active-active multi-region',rpo:()=>0,rto:1,cost:6,d:'Both regions serve traffic. If one fails, the other already has the users and the data.'}];
  let bh=24,cur=0,need=[60,60];const out=h('div');const verdict=h('div',{class:'takeaway'});const desc=h('div',{class:'note'});
  const sb=ctl('Backup interval (backup and restore only)',1,48,bh,1,v=>{bh=v;draw();},v=>v+' h');
  const so=ctl('Business can lose at most (RPO target)',0,1440,60,5,v=>{need[0]=v;draw();},v=>v<60?v+' min':(v/60).toFixed(1)+' h');
  const st=ctl('Business can be down at most (RTO target)',1,480,60,5,v=>{need[1]=v;draw();},v=>v<60?v+' min':(v/60).toFixed(1)+' h');
  const tb=tabs(S.map(s=>s.n),i=>{cur=i;draw();},0);
  const fmt=m=>m===0?'about 0':m<60?Math.round(m)+' min':(m/60).toFixed(1)+' h';
  function draw(){out.textContent='';const s=S[cur];desc.textContent=s.d;const rpo=s.rpo(bh),rto=s.rto;
    const row=(lab,v,max,ok)=>{const m=meter(0);m.set(Math.max(2,Math.min(100,v/max*100)),ok?'go':'bad');return h('div',{style:'margin:8px 0'},h('b',{},lab),m);};
    out.append(row(`Data you could lose (RPO): ${fmt(rpo)} ${rpo<=need[0]?'meets':'misses'} the target`,rpo,2880,rpo<=need[0]),row(`Time to recover (RTO): ${fmt(rto)} ${rto<=need[1]?'meets':'misses'} the target`,rto,480,rto<=need[1]),row(`Relative cost: ${s.cost}x a single region`,s.cost,6,s.cost<=2));
    const fit=S.findIndex(x=>x.rpo(bh)<=need[0]&&x.rto<=need[1]);
    verdict.textContent=fit<0?'No strategy meets both targets.':`The cheapest strategy that meets both targets is: ${S[fit].n}. Tighter targets cost more, so set them per system, not one rule for everything.`;}
  host.append(h('div',{class:'note'},'Set what the business can tolerate, then pick a strategy. Numbers are typical orders of magnitude, not guarantees.'),so.el,st.el,tb,desc,sb.el,out,verdict);
  draw();
};

/* 8. Distributed tracing: a waterfall of spans */
DEMOS.trace=function(host){
  let slow=false,par=false,sel=null;const wf=h('div',{style:'margin:10px 0'});const det=h('div',{class:'readout'});const verdict=h('div',{class:'takeaway'});
  const sc=chip('Inventory service gets slow',()=>{slow=!slow;sc.classList.toggle('on',slow);draw();},false);
  const pc=chip('Call inventory and pricing in parallel',()=>{par=!par;pc.classList.toggle('on',par);draw();},false);
  function spans(){const inv=slow?420:40,pr=60,pay=120;const s=[];let t=0;
    s.push({n:'api-gateway: GET /checkout',d:0,s:0});s.push({n:'auth: verify token',d:1,s:2,l:8});
    const o0=12;s.push({n:'orders: build checkout',d:1,s:o0});
    const a=o0+3;s.push({n:'inventory: check stock',d:2,s:a,l:inv,db:'SELECT stock ... (index missing)'});
    const b=par?a:a+inv+2;s.push({n:'pricing: compute total',d:2,s:b,l:pr});
    const c=Math.max(a+inv,b+pr)+3;s.push({n:'payments: authorise',d:2,s:c,l:pay});s.push({n:'bank API (external)',d:3,s:c+10,l:pay-20});
    const end=c+pay+5;s[2].l=end-o0;s[0].l=end+4;return s;}
  function draw(){wf.textContent='';const S=spans();const tot=S[0].l;
    S.forEach((x,i)=>{const bar=h('button',{type:'button',class:'card',style:`display:block;margin:2px 0 2px ${x.s/tot*100}%;width:${Math.max(1.5,x.l/tot*100)}%;padding:3px 6px;text-align:left;cursor:pointer;font-size:12px;white-space:nowrap;overflow:visible;${x.n.startsWith('inventory')&&slow?'border-color:var(--bad)':''}`,onclick:()=>{sel=i;show(S);}},`${x.n}  ${x.l} ms`);
      wf.append(h('div',{style:`padding-left:${x.d*14}px`},bar));});
    show(S);
    verdict.textContent=slow&&!par?'The trace shows exactly where the time goes: inventory dominates the critical path. Without a trace you would only know that checkout is slow.':slow&&par?'Running independent calls in parallel shortens the critical path, but inventory is still the slowest branch: fix its query next.':'Each box is a span: one unit of work, with a start time, a duration and the id of its parent. All spans share one trace id, passed along in request headers.';}
  function show(S){const x=S[sel==null?0:sel];det.textContent=`Span: ${x.n}\ntrace_id: 4bf92f3577b34da6  parent: ${x.d===0?'none (root)':'span of the caller'}\nstart: +${x.s} ms   duration: ${x.l} ms${x.db?'\ndb.statement: '+x.db:''}`;}
  host.append(h('div',{class:'note'},'One checkout request crosses five services. This is the trace a tracing system (Jaeger, Zipkin, Tempo, an OpenTelemetry back end) would show. Click a span for its details.'),h('div',{class:'row'},sc,pc),h('div',{style:'overflow-x:auto'},wf),det,verdict);
  draw();
};
