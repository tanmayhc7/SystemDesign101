/* ===== Phase 4 demos: caching ===== */
const zipfTrace=(n,items,seed,skew)=>{const r=mkRand(seed);const t=[];for(let i=0;i<n;i++)t.push(Math.min(items-1,Math.floor(items*Math.pow(r(),skew||3))));return t;};

/* 1. Caching 101: size, hit ratio and average latency */
DEMOS.cache101=function(host){
  let size=50,ITEMS=1000,CL=1,DL=20;const rd=readout();const bar=meter(0);const verdict=h('div',{class:'takeaway'});
  const trace=zipfTrace(5000,ITEMS,7,6);
  const ss=ctl('Cache size (items stored)',0,500,size,10,v=>{size=v;run();},v=>v+' of '+ITEMS+' ('+Math.round(v/ITEMS*100)+'%)');
  const sd=ctl('Database latency',5,100,DL,5,v=>{DL=v;run();},v=>v+' ms');
  function run(){const c=[];let hit=0;
    trace.forEach(k=>{const i=c.indexOf(k);if(i>=0){hit++;c.splice(i,1);c.push(k);}else{c.push(k);if(c.length>size)c.shift();}});
    if(size===0)hit=0;const hr=hit/trace.length;const avg=hr*CL+(1-hr)*(DL+CL);
    bar.set(hr*100,hr>0.8?'go':hr>0.5?'warn':'bad');
    rd.set(`Hit ratio: ${(hr*100).toFixed(1)}%\nAverage latency: ${avg.toFixed(1)} ms  (no cache: ${DL} ms)\nDatabase load: ${((1-hr)*100).toFixed(1)}% of requests reach it`);
    verdict.textContent=size===0?'No cache: every request hits the database.':hr<0.5?'The cache is too small for how spread out the traffic is.':'Caching 5% to 20% of the data often serves most requests, because a few items are far more popular than the rest. Returns diminish quickly after that.';}
  host.append(h('div',{class:'note'},'5,000 requests for 1,000 items where a few items are much more popular than the rest. A cache hit costs 1 ms. A miss pays the database latency too.'),ss.el,sd.el,bar,rd,verdict);
  run();
};

/* 2. Strategies: cache-aside, read-through, write-through, write-back, write-around */
DEMOS.cachestrat=function(host,o,ctx){
  const names=['Cache-aside','Read-through','Write-through','Write-back','Write-around'];let st=0,gen=0;
  let db=1,cache=null,pending=null,ver=1;const rd=readout();const log=logbox();const verdict=h('div',{class:'takeaway'});
  const show=()=>rd.set(`Database: v${db}    Cache: ${cache===null?'empty':'v'+cache}${pending!==null?'    (write-back buffer holds v'+pending+', not in DB yet)':''}`);
  function reset(){gen++;db=1;cache=null;pending=null;ver=1;log.clear();verdict.textContent='';show();}
  const tb=tabs(names,i=>{st=i;reset();},0);
  const rules=['App checks the cache; on a miss the app reads the database and fills the cache. App writes the database, then deletes the cache entry.','Same as cache-aside, but the cache itself loads from the database on a miss; the app only talks to the cache.','Every write goes to the cache and the database together before it returns. Slower writes, cache and database agree.','Writes go to the cache and return at once; the database is updated later in a batch. Fast writes, but a cache crash loses them.','Writes go straight to the database and skip the cache. The cache only fills on reads, so rarely re-read data does not pollute it.'];
  function write(){ver++;const v=ver;
    if(st===0){db=v;cache=null;log.say(`Write v${v}: DB updated, cache entry deleted.`);}
    else if(st===1||st===2){db=v;cache=v;log.say(`Write v${v}: ${st===2?'cache and DB updated together.':'DB updated and cache refreshed.'}`);}
    else if(st===3){cache=v;pending=v;log.say(`Write v${v}: cache updated, returned immediately. DB will be updated in 2 seconds.`);const g=gen;ctx.after(2000,()=>{if(g!==gen||pending!==v)return;db=v;pending=null;log.say(`Background flush: DB now v${v}.`,'note');show();});}
    else{db=v;log.say(`Write v${v}: DB updated. Cache untouched.`);if(cache!==null)log.say(`Cache still holds v${cache}: stale until it expires or is deleted.`,'bad');}
    show();}
  function read(){if(cache!==null){log.say(`Read: cache hit -> v${cache}${cache<db?'  (stale! DB has v'+db+')':cache>db?'  (newer than the DB, which still has v'+db+')':''}`,cache<db?'bad':'');}
    else{log.say(`Read: cache miss -> loaded v${db} from DB and cached it.`);cache=db;}show();}
  function crash(){gen++;const lost=pending;cache=null;pending=null;log.say('*** Cache node crashes. Its contents are gone. ***','bad');
    if(lost!==null){log.say(`The buffered write v${lost} never reached the database: data lost.`,'bad');verdict.textContent='Write-back risks losing acknowledged writes. Use it only where loss is acceptable or with a durable log.';}
    else verdict.textContent='No data lost: the database held everything. The next read is a miss and refills the cache.';show();}
  const ruleBox=h('div',{class:'note'});const upd=()=>{ruleBox.textContent=rules[st];};tb.addEventListener('click',upd);
  host.append(h('div',{class:'note'},'Pick a strategy, then write, read and crash the cache in different orders. Watch what the database and the cache hold.'),tb,ruleBox,h('div',{class:'row'},btn('Write a new value',write),btn('Read',read),btn('Crash the cache',crash,'ghost'),btn('Reset',reset,'ghost')),rd,log,verdict);
  upd();show();
};

/* 3. Eviction: LRU vs LFU vs FIFO on one trace */
DEMOS.evict=function(host){
  let cap=20,scan=false;const out=h('div');const verdict=h('div',{class:'takeaway'});
  const sl=ctl('Cache capacity (items)',5,60,cap,5,v=>{cap=v;draw();},v=>v);
  const sc=chip('Add a one-time scan of 200 items (like a report job)',()=>{scan=!scan;sc.classList.toggle('on',scan);draw();},false);
  const base=zipfTrace(3000,300,11,6);
  function trace(){if(!scan)return base;const t=base.slice(0,1500);for(let i=0;i<200;i++)t.push(1000+i);return t.concat(base.slice(1500));}
  function sim(pol,t){const m=new Map();let hit=0;
    t.forEach((k,i)=>{if(m.has(k)){hit++;const e=m.get(k);e.f++;e.l=i;}else{if(m.size>=cap){let vk=null,vs=1e18;for(const [kk,e] of m){const s=pol==='LRU'?e.l:pol==='LFU'?e.f*1e6+e.l:e.a;if(s<vs){vs=s;vk=kk;}}m.delete(vk);}m.set(k,{f:1,l:i,a:i});}});
    return hit/t.length;}
  function draw(){out.textContent='';const t=trace();const res=['FIFO','LRU','LFU'].map(p=>[p,sim(p,t),scan?sim(p,base):null]);const best=Math.max(...res.map(r=>r[1]));
    const desc={FIFO:'evicts the oldest inserted item, ignoring use',LRU:'evicts the item unused for the longest time',LFU:'evicts the item used least often overall'};
    res.forEach(([p,v,b0])=>{const m=meter(0);m.set(v*100,v===best?'go':'warn');out.append(h('div',{style:'margin:10px 0'},h('b',{},`${p}: ${(v*100).toFixed(1)}% hit ratio`+(b0!==null?`  (without the scan: ${(b0*100).toFixed(1)}%)`:'')),m,h('div',{class:'note'},desc[p])));});
    verdict.textContent=scan?'A one-time scan floods the cache with items never used again. LRU and FIFO evict the popular items to make room and must win them back afterwards. LFU keeps them, because the scan items only have a count of 1, so it stays ahead. Real caches add admission control (TinyLFU) to stop scans getting in at all.':'With stable popularity, LFU and LRU both beat FIFO. Add the scan to see where they differ.';}
  host.append(h('div',{class:'note'},'The same 3,000 requests over 300 items (a few are very popular), replayed against three eviction policies.'),sl.el,h('div',{class:'row'},sc),out,verdict);
  draw();
};

/* 4. Distributed cache: losing a node */
DEMOS.distcache=function(host){
  let N=5,mode=0;const K=2000,RPS=5000,DBCAP=1500;const keys=[];for(let i=0;i<K;i++)keys.push('k'+i);
  const ring=n=>{const p=[];for(let s=0;s<n;s++)for(let v=0;v<64;v++)p.push([fnv('c'+s+'#'+v),s]);p.sort((a,b)=>a[0]-b[0]);return p;};
  const own=(p,k)=>{const x=fnv(k);for(const e of p)if(e[0]>=x)return e[1];return p[0][1];};
  const out=h('div');const rd=readout();const verdict=h('div',{class:'takeaway'});let dead=false;
  const sl=ctl('Cache nodes',3,8,N,1,v=>{N=v;dead=false;draw();},v=>v);
  const tb=tabs(['hash(key) mod N','Consistent hashing ring'],i=>{mode=i;dead=false;draw();},0);
  function draw(){out.textContent='';let moved=0;
    if(dead){if(mode===0)keys.forEach(k=>{if(fnv(k)%N!==fnv(k)%(N-1))moved++;});else{const a=ring(N),b=ring(N-1);keys.forEach(k=>{if(own(a,k)!==own(b,k))moved++;});}}
    const miss=dead?moved/K:0;const dbLoad=RPS*miss;const m1=meter(0);m1.set(miss*100,miss>0.5?'bad':miss>0.1?'warn':'go');
    const m2=meter(0);m2.set(Math.min(100,dbLoad/DBCAP*100),dbLoad>DBCAP?'bad':dbLoad>DBCAP*0.7?'warn':'go');
    out.append(h('div',{style:'margin:10px 0'},h('b',{},'Keys that now miss: '+(miss*100).toFixed(0)+'%'),m1),h('div',{style:'margin:10px 0'},h('b',{},`Database load: ${Math.round(dbLoad).toLocaleString()} of ${DBCAP.toLocaleString()} queries/s it can handle (traffic is ${RPS.toLocaleString()} req/s)`),m2));
    rd.set(dead?`Cache node ${N} removed. ${moved.toLocaleString()} of ${K.toLocaleString()} keys changed owner and start cold.`:`${N} cache nodes healthy. Press the button to remove one.`);
    verdict.textContent=!dead?'':dbLoad>DBCAP?'The surviving caches are cold, so the misses fall through to the database and overload it. This is a cache stampede after a node loss. Mitigate with consistent hashing, request coalescing, replicas of hot keys, and warming.':'Only a small slice of keys went cold, and the database absorbs it.';}
  host.append(h('div',{class:'note'},'2,000 hot keys spread over cache nodes, 5,000 requests per second, and a database that can take 1,500 queries per second. Remove a node and see who feels it.'),tb,sl.el,h('div',{class:'row'},btn('Remove one cache node',()=>{dead=true;draw();}),btn('Restore',()=>{dead=false;draw();},'ghost')),out,rd,verdict);
  draw();
};

/* 5. CDN: latency by region with and without edge caches */
DEMOS.cdn=function(host){
  let hr=90;const regions=[['Same region as origin (US East)',20],['Europe',110],['India',190],['Australia',240]];const EDGE=15;
  const out=h('div');const sl=ctl('Cache hit ratio at the edge',0,100,hr,5,v=>{hr=v;draw();},v=>v+'%');
  const ver=h('div',{class:'takeaway'});
  function draw(){out.textContent='';const mx=240+EDGE;
    regions.forEach(([n,rtt])=>{const no=rtt*3;const withc=EDGE*3+(1-hr/100)*rtt; // 3 round trips with the nearby edge; a miss adds one trip to the origin over a warm connection
      const a=meter(0);a.set(no/(mx*3)*100,'bad');const b=meter(0);b.set(withc/(mx*3)*100,withc<no*0.5?'go':'warn');
      out.append(h('div',{style:'margin:12px 0'},h('b',{},n+`  (${rtt} ms round trip to origin)`),h('div',{class:'note'},`Without a CDN: ${Math.round(no)} ms for a first request (connect, TLS, fetch)`),a,h('div',{class:'note'},`With a CDN at ${hr}% hit ratio: ${Math.round(withc)} ms on average`),b));});
    ver.textContent=hr<40?'A low hit ratio means most requests still go to the origin through the edge. Cacheable content, long TTLs and versioned file names raise it.':'Static files (images, scripts, video segments) are the same for everyone, so edge servers near users can keep copies. Personalised responses usually cannot be cached this way.';}
  host.append(h('div',{class:'note'},'A first request pays three round trips: TCP connect, TLS, and the fetch. A CDN terminates the connection at a nearby edge server and serves the file if it has it.'),sl.el,out,ver,h('div',{class:'note'},'Simplified model: edge round trip 15 ms, a miss adds one origin round trip, because the edge keeps warm connections to the origin.'));
  draw();
};
