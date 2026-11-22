/* ===== Phases 8 to 12 demos: tradeoffs, interview framework, interview problems ===== */
const fmtN=n=>n>=1e12?(n/1e12).toFixed(1)+' T':n>=1e9?(n/1e9).toFixed(1)+' B':n>=1e6?(n/1e6).toFixed(1)+' M':n>=1e3?(n/1e3).toFixed(1)+' K':n>=10?Math.round(n)+'':n.toFixed(n<1?2:1);
const fmtB=b=>b>=1e15?(b/1e15).toFixed(1)+' PB':b>=1e12?(b/1e12).toFixed(1)+' TB':b>=1e9?(b/1e9).toFixed(1)+' GB':b>=1e6?(b/1e6).toFixed(1)+' MB':b>=1e3?(b/1e3).toFixed(1)+' KB':Math.round(b)+' B';
const fmtBps=b=>{const bits=b*8;return bits>=1e12?(bits/1e12).toFixed(1)+' Tbit/s':bits>=1e9?(bits/1e9).toFixed(1)+' Gbit/s':bits>=1e6?(bits/1e6).toFixed(1)+' Mbit/s':(bits/1e3).toFixed(1)+' Kbit/s';};

/* Back-of-the-envelope estimator. o:{dau,writes,ratio,size,years,peak,wlabel,rlabel,unit,note} */
function estimator(host,o){
  o=Object.assign({dau:10e6,writes:1,ratio:10,size:1000,years:5,peak:3,wlabel:'writes',rlabel:'reads',unit:'item'},o||{});
  let dau=o.dau,w=o.writes,r=o.ratio,sz=o.size,y=o.years,pk=o.peak;
  const lg=v=>Math.log10(v);const rd=h('div',{class:'readout',style:'white-space:pre'});const tips=h('div',{class:'takeaway'});
  const s1=ctl('Daily active users',3,9,lg(dau),0.1,v=>{dau=Math.pow(10,v);calc();},v=>fmtN(Math.pow(10,v)));
  const s2=ctl(`${o.wlabel[0].toUpperCase()+o.wlabel.slice(1)} per user per day`,-2,3,lg(w),0.1,v=>{w=Math.pow(10,v);calc();},v=>fmtN(Math.pow(10,v)));
  const s3=ctl(`${o.rlabel[0].toUpperCase()+o.rlabel.slice(1)} per ${o.wlabel.replace(/s$/,'')}`,-1,4,lg(r),0.1,v=>{r=Math.pow(10,v);calc();},v=>fmtN(Math.pow(10,v)));
  const s4=ctl(`Size of one ${o.unit}`,1,10,lg(sz),0.1,v=>{sz=Math.pow(10,v);calc();},v=>fmtB(Math.pow(10,v)));
  const s5=ctl('Years of data kept',0,10,y,1,v=>{y=v;calc();},v=>v+' y');
  const s6=ctl('Peak to average ratio',1,10,pk,0.5,v=>{pk=v;calc();},v=>v+'x');
  function calc(){const wd=dau*w,wq=wd/86400,rq=wq*r,st=wd*sz*365*Math.max(y,1/365),bw=rq*sz;
    rd.textContent=`${o.wlabel} per day   ${fmtN(wd)}\n${o.wlabel} per second  ${fmtN(wq)} avg   ${fmtN(wq*pk)} peak\n${o.rlabel} per second   ${fmtN(rq)} avg   ${fmtN(rq*pk)} peak\nnew data per day    ${fmtB(wd*sz)}\nstorage (${y} y, 1 copy)  ${fmtB(st)}   x3 replicas: ${fmtB(st*3)}\nread bandwidth      ${fmtBps(bw)} avg   ${fmtBps(bw*pk)} peak`;
    const t=[];if(rq*pk>1e5)t.push('Peak reads are above about 100K per second: plan for caching and many replicas or a CDN.');else if(rq*pk<1e3)t.push('Under about 1,000 reads per second at peak: a single well-indexed database with a replica is likely enough.');
    if(wq*pk>1e4)t.push('Peak writes above about 10K per second: one primary database will struggle, so plan for partitioning or a write-optimised store.');
    if(st*3>1e14)t.push('Storage in the hundreds of terabytes or more: blob or object storage and tiering, not one database.');
    if(bw*pk*8>1e10)t.push('Read bandwidth in tens of gigabits per second: serve from a CDN or edge caches.');
    tips.textContent=(o.note?o.note+' ':'')+(t.join(' ')||'Moderate numbers: keep the design simple.');}
  host.append(h('div',{class:'note'},'Rough numbers only: an hour of slider work beats a day of debate. 1 day is about 100,000 seconds; peaks are often 2 to 10 times the average.'),s1.el,s2.el,s3.el,s4.el,s5.el,s6.el,rd,tips);calc();
}
DEMOS.estimator=function(host,o){estimator(host,o);};

/* Interview problem walkthrough: clarify, estimate, build, hard part */
DEMOS.problem=function(host,o){
  const view=h('div');const names=['1. Clarify','2. Estimate','3. Build'];if(o.flow)names.push('4. Walk a request');
  const t=tabs(names,i=>{view.textContent='';if(i===0)clar();else if(i===1)est();else if(i===2)DEMOS.design(view,o.build);else DEMOS.steps(view,o.flow);},0);
  function clar(){view.append(h('div',{class:'note'},'Before drawing anything, ask. Think of your own answer to each question, then flip the card for why it matters and the assumption used here.'));DEMOS.flip(view,{cards:o.clarify.map(([q,a])=>({f:q,b:a})),prompt:' '});}
  function est(){if(o.tok){tokenEst(view,o.tok);return;}if(!o.est){view.append(h('div',{class:'takeaway'},o.noest||'This problem is about modelling and correctness, not scale. Spend the time on entities, states and rules instead of traffic numbers.'));return;}estimator(view,o.est);}
  host.append(t,view);clar();
};

/* 45-minute interview planner */
DEMOS.planner=function(host){
  const S=[['Clarify requirements and scope',5,'Ask about users, core features, scale, consistency and what is out of scope. Write the agreed list down.'],['Estimate (only what changes the design)',4,'QPS, storage and bandwidth to decide whether you need caching, sharding or a CDN. Skip it if the interviewer waves it off.'],['API and data model',6,'The main endpoints and the core entities with keys. Interviewers often push hard here.'],['High-level design',10,'Boxes and arrows for the main read and write paths. Walk one request end to end.'],['Deep dives',15,'Two or three of the hardest parts: the bottleneck, the consistency problem, the hot key. Discuss options and choose with reasons.'],['Wrap up',5,'Failure modes, monitoring, what you would do with more time, and a summary of trade-offs.']];
  let total=45;const out=h('div');const verdict=h('div',{class:'takeaway'});const sl=ctl('Interview length',30,60,total,5,v=>{total=v;draw();},v=>v+' min');
  function draw(){out.textContent='';let t=0;const sum=S.reduce((a,s)=>a+s[1],0);
    S.forEach(([n,m,d])=>{const mins=Math.round(m/sum*total);const m0=meter(0);m0.set(m/sum*100*2.5,'go');out.append(h('div',{style:'margin:10px 0'},h('b',{},`${t}-${t+mins} min: ${n}`),m0,h('div',{class:'note'},d)));t+=mins;});
    verdict.textContent='The most common failure is spending 25 minutes on requirements and boxes and never reaching the deep dives, which is where senior candidates are separated. Check the clock at each phase.';}
  host.append(h('div',{class:'note'},'A time plan for a typical system design round. Change the length; the proportions stay.'),sl.el,out,verdict);draw();
};

/* Concurrency vs parallelism: a timeline of tasks on cores */
DEMOS.concpar=function(host){
  let cores=1,io=true;const out=h('div');const rd=readout();const verdict=h('div',{class:'takeaway'});
  const sc=ctl('CPU cores',1,4,cores,1,v=>{cores=v;draw();},v=>v);
  const ic=chip('Tasks wait on I/O (network, disk)',()=>{io=!io;ic.classList.toggle('on',io);draw();},true);
  function draw(){out.textContent='';const tasks=4,cpu=2,wait=io?6:0;const cols=['var(--l1)','var(--l3)','var(--l5)','var(--l7)'];
    const lanes=[];for(let c=0;c<cores;c++)lanes.push([]);
    const T=[];for(let k=0;k<tasks;k++)T.push({left:cpu,phase:0,until:0});let t=0;
    // phase 0: first CPU burst, 1: waiting on I/O until 'until', 2: second CPU burst, 3: done
    while(T.some(x=>x.phase<3)&&t<80){T.forEach(x=>{if(x.phase===1&&t>=x.until){x.phase=2;x.left=cpu;}});
      const ready=T.map((x,i)=>i).filter(i=>T[i].phase===0||T[i].phase===2);
      for(let c=0;c<cores;c++){const k=ready[c];if(k===undefined){lanes[c].push(null);continue;}lanes[c].push(k);const x=T[k];x.left--;
        if(x.left===0){if(x.phase===0){if(wait>0){x.phase=1;x.until=t+1+wait;}else{x.phase=2;x.left=cpu;}}else x.phase=3;}}
      t++;}
    lanes.forEach((ln,c)=>{const row=h('div',{style:'display:flex;gap:2px;margin:4px 0;align-items:center'},h('span',{class:'note',style:'min-width:70px'},'Core '+(c+1)));ln.forEach(k=>row.append(h('span',{style:`width:18px;height:18px;border-radius:3px;background:${k===null?'var(--well)':cols[k]}`,title:k===null?'idle':'task '+(k+1)})));out.append(row);});
    rd.set(`4 tasks, each: 2 units of CPU, ${wait} units waiting on I/O, 2 units of CPU.  Finished after ${t} time units.  Sequential, one at a time: ${tasks*(cpu*2+wait)} units.`);
    verdict.textContent=cores===1&&io?'One core, but the tasks overlap: while one waits on I/O, another runs. That is concurrency (dealing with many things at once), and it helps I/O-bound work even without more cores.':cores>1&&!io?'No waiting, and several cores run tasks at the same instant. That is parallelism (doing many things at once), and it is what speeds up CPU-bound work.':cores>1?'Both at once: concurrency fills waiting time, parallelism adds simultaneous execution.':'One core and no waiting: tasks simply take turns, so nothing is gained.';}
  host.append(h('div',{class:'note'},'Each square is one time unit on a core; colours are tasks; grey is idle.'),sc.el,h('div',{class:'row'},ic),out,rd,verdict);draw();
};

/* Batch vs stream */
DEMOS.batchstream=function(host){
  let mode=0,win=60;const out=h('div');const verdict=h('div',{class:'takeaway'});
  const tb=tabs(['Batch (nightly job)','Micro-batch','Stream (per event)'],i=>{mode=i;draw();},0);
  function draw(){out.textContent='';const lat=[12*3600,60,1][mode],cost=[1,2,3.5][mode],cx=[1,2,4][mode];
    const bar=(lab,v,mx,good)=>{const m=meter(0);m.set(Math.max(3,v/mx*100),good?'go':v/mx>0.6?'bad':'warn');return h('div',{style:'margin:8px 0'},h('b',{},lab),m);};
    out.append(bar(`Freshness: results are up to ${lat>=3600?Math.round(lat/3600)+' hours':lat>=60?Math.round(lat/60)+' minute':lat+' second'} old`,Math.log10(lat+1),Math.log10(43201),mode===2),bar(`Relative compute cost for the same data: ${cost}x`,cost,4,mode===0),bar('Operational complexity (late events, state, exactly-once, always-on jobs)',cx,4,mode===0));
    verdict.textContent=mode===0?'Batch is simple, cheap and easy to rerun from scratch, so it suits reports, billing, model training and backfills. Results are hours old.':mode===1?'Micro-batches (for example every minute) give near-real-time freshness with much of batch\'s simplicity.':'Streaming gives second-level freshness for fraud checks, alerts, live dashboards and recommendations, but must handle late and out-of-order events, state and failures continuously. Many systems run both: a stream for speed and a batch job to correct and backfill.';}
  host.append(h('div',{class:'note'},'Counting clicks per ad from a stream of events. Compare how fresh the counts are and what it costs.'),tb,out,verdict);draw();
};

/* Strong vs eventual consistency: reading from replicas */
DEMOS.consist=function(host){
  let strong=false,lag=800;const log=logbox();const rd=readout();const verdict=h('div',{class:'takeaway'});
  const tb=tabs(['Eventual (read any replica)','Strong (read from leader or quorum)'],i=>{strong=i===1;log.clear();rd.set('');verdict.textContent='';},0);
  const sl=ctl('Replication lag',0,3000,lag,100,v=>{lag=v;},v=>v+' ms');
  function run(){log.clear();const readAt=200;log.say('t=0 ms: you change your display name to "Sam" (write to the leader).');
    if(strong){const w=Math.min(lag,150);log.say(`t=${readAt} ms: you reload. The read goes to the leader (or waits for a quorum): "Sam".`,'note');rd.set(`Read latency: about ${w?20+w:20} ms   Result: up to date`);verdict.textContent='Strong consistency: every read sees the latest write. Reads cost more (leader or quorum round trips, cross-region waits) and may fail during partitions.';}
    else{const stale=readAt<lag;log.say(`t=${readAt} ms: you reload. A nearby replica answers: "${stale?'Alex (old name)':'Sam'}".`,stale?'bad':'note');rd.set(`Read latency: about 5 ms   Result: ${stale?'stale until the replica catches up at t='+lag+' ms':'up to date (the lag was short)'}`);verdict.textContent='Eventual consistency: reads are fast and always available, but can be stale for a while. Fine for likes and view counts; confusing for your own profile edits unless you add read-your-writes.';}}
  host.append(h('div',{class:'note'},'You edit your profile and reload the page 200 ms later.'),tb,sl.el,h('div',{class:'row'},btn('Edit and reload',run)),rd,log,verdict);
};

/* Push vs pull */
DEMOS.pushpull=function(host){
  let followers=200,mode=0;const out=h('div');const verdict=h('div',{class:'takeaway'});
  const sf=ctl('Followers of the author',1,7,Math.log10(followers),0.5,v=>{followers=Math.round(Math.pow(10,v));draw();},v=>fmtN(Math.pow(10,v)));
  const tb=tabs(['Push (fan-out on write)','Pull (fan-out on read)','Hybrid'],i=>{mode=i;draw();},0);
  function draw(){out.textContent='';const reads=followers*3;const celeb=followers>1e5;
    const w=mode===0||(mode===2&&!celeb)?followers:1;const r=mode===1||(mode===2&&celeb)?reads*50:reads;
    out.append(h('div',{class:'readout'},`One post creates ${fmtN(w)} timeline writes.\nFollowers' feed loads cost ${fmtN(r)} lookups in total (each feed merges about 50 followed authors when pulling).`));
    verdict.textContent=mode===0?(celeb?'Pushing a celebrity post into millions of timelines is a write storm and delays delivery.':'Push makes reads trivial: each feed is precomputed.'):mode===1?'Pull keeps writes cheap but every feed load must gather and merge posts from everyone you follow, which is slow for heavy readers.':'Hybrid: push for normal authors, pull for celebrities at read time and merge. This is what large social feeds do.';}
  host.append(h('div',{class:'note'},'An author posts; followers load their feeds about 3 times each.'),sf.el,tb,out,verdict);draw();
};
