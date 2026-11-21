/* ===== Phase 3 demos: databases ===== */

/* 1. ACID: atomicity and durability with a crash, isolation with two sessions */
DEMOS.acid=function(host){
  const view=h('div');const t=tabs(['Atomicity and durability','Isolation'],i=>{view.textContent='';(i?iso:atom)();},0);
  host.append(t,view);
  function atom(){
    let useTx=true,crash=1;const A0=500,B0=300;
    const rd=readout();const log=logbox();const verdict=h('div',{class:'takeaway'});
    const txChip=chip('Wrap both updates in a transaction',()=>{useTx=!useTx;txChip.classList.toggle('on',useTx);},true);
    const ct=tabs(['No crash','Crash after the debit','Power loss right after COMMIT'],i=>{crash=i;},1);
    function run(){log.clear();let A=A0,B=B0;
      log.say(useTx?'BEGIN':'(no transaction: each statement commits by itself)');
      A-=100;log.say('UPDATE accounts SET balance = balance - 100 WHERE id = A   (A is now '+A+')');
      if(crash===1){log.say('*** server crashes here ***','bad');
        if(useTx){A=A0;log.say('On restart the database sees an unfinished transaction and rolls it back.','note');}
        else{log.say('The debit was already committed. Nothing will ever make the credit happen.','bad');}
      }else{
        B+=100;log.say('UPDATE accounts SET balance = balance + 100 WHERE id = B   (B is now '+B+')');
        if(useTx)log.say('COMMIT  (the change is written to the write-ahead log on disk first)');
        if(crash===2){log.say('*** power is cut immediately after COMMIT ***','bad');
          if(useTx)log.say('On restart the log is replayed, so the committed transfer is still there. That is durability.','note');
          else log.say('Without a log-backed commit, a change that only lived in memory could be lost.','bad');}
      }
      rd.set(`Account A: ${A}    Account B: ${B}    Total: ${A+B}  (should be ${A0+B0})`);
      verdict.textContent=A+B!==A0+B0?'Money disappeared. Without atomicity, a crash between two related writes leaves the data half-changed.':crash===1?'Rolled back cleanly: all or nothing. Nothing changed, and the app can simply retry.':'Both updates applied and survived the crash.';}
    view.append(h('div',{class:'note'},'Move $100 from account A to B. Choose whether it is a transaction, choose where the crash happens, and run it.'),h('div',{class:'row'},txChip),ct,h('div',{class:'row'},btn('Run the transfer',run)),rd,log,verdict);
    rd.set(`Account A: ${A0}    Account B: ${B0}    Total: ${A0+B0}`);
  }
  function iso(){
    let locked=false;const rd=readout();const log=logbox();const verdict=h('div',{class:'takeaway'});
    const lk=chip('Lock the row while reading it (SELECT ... FOR UPDATE)',()=>{locked=!locked;lk.classList.toggle('on',locked);},false);
    function run(){log.clear();let bal=100;
      log.say('Balance is 100. Session 1 and Session 2 each want to add 10.');
      if(!locked){log.say('S1: reads balance -> 100');log.say('S2: reads balance -> 100');log.say('S1: writes balance = 100 + 10 = 110');bal=110;log.say('S2: writes balance = 100 + 10 = 110  (it still believes the balance is 100)','bad');bal=110;
        verdict.textContent='Lost update: two +10 changes, final balance 110 instead of 120. Both sessions read before either wrote.';}
      else{log.say('S1: reads balance -> 100 and locks the row');log.say('S2: tries to read the row, must wait for the lock','note');log.say('S1: writes balance = 110, COMMIT, lock released');bal=110;log.say('S2: now reads balance -> 110');log.say('S2: writes balance = 110 + 10 = 120, COMMIT');bal=120;
        verdict.textContent='Correct: 120. The lock forced the sessions to run one after the other. Other options: an atomic UPDATE balance = balance + 10, optimistic version checks, or SERIALIZABLE isolation.';}
      rd.set(`Final balance: ${bal}    (expected 120)`);}
    view.append(h('div',{class:'note'},'Two sessions both add 10 to a balance of 100 at the same time. Does the database protect the second one from stale data?'),h('div',{class:'row'},lk,btn('Run both sessions',run)),rd,log,verdict);
  }
  atom();
};

/* 2. SQL vs NoSQL: the same data, queried two ways */
DEMOS.sqlnosql=function(host){
  let N=10000;const qs=[
    {id:'page',name:'Show one order page',sql:()=>({ops:3,txt:'3 indexed lookups (order, its items, the customer), joined'}),doc:()=>({ops:1,txt:'1 read: the order document already contains items and customer name'})},
    {id:'report',name:'Revenue by product, all orders',sql:()=>({ops:N,txt:'1 grouped query over the items table, one scan with an index-friendly join'}),doc:()=>({ops:N,txt:'scan every order document and add up items in the application (or run a map-reduce job)'})},
    {id:'rename',name:'A product is renamed',sql:()=>({ops:1,txt:'1 row updated in the products table; every order sees the new name'}),doc:()=>({ops:Math.round(N*0.12),txt:`update about ${Math.round(N*0.12).toLocaleString()} documents that embedded the old name (12% of orders contain it)`})},
    {id:'add',name:'Place a new order',sql:()=>({ops:4,txt:'a transaction writing 1 order row plus 3 item rows'}),doc:()=>({ops:1,txt:'1 document write, atomic by default'})}];
  let cur=qs[0];const out=h('div');const sl=ctl('Orders stored',3,7,4,1,v=>{N=Math.pow(10,v);draw();},v=>Math.pow(10,v).toLocaleString());
  const tb=tabs(qs.map(q=>q.name),i=>{cur=qs[i];draw();},0);
  function draw(){out.textContent='';const a=cur.sql(),b=cur.doc();const mx=Math.max(a.ops,b.ops,1);
    const row=(name,r,cls)=>{const m=meter(0);m.set(Math.max(2,Math.log10(r.ops+1)/Math.log10(mx+1)*100),cls);return h('div',{style:'margin:10px 0'},h('b',{},name+': '+r.ops.toLocaleString()+' operation'+(r.ops===1?'':'s')),m,h('div',{class:'note'},r.txt));};
    out.append(row('Relational (normalized tables)',a,a.ops<=b.ops?'go':'warn'),row('Document store (order stored as one document)',b,b.ops<=a.ops?'go':'warn'));
    out.append(h('div',{class:'takeaway'},cur.id==='page'||cur.id==='add'?'The document model wins when you always read and write the whole aggregate together.':cur.id==='rename'?'Embedding copies data. That makes reads fast and shared updates expensive and easy to get wrong.':'Cross-record analytics is where relational engines and their optimisers shine.'));}
  host.append(h('div',{class:'note'},'The same shop data, stored two ways: normalized tables (orders, items, products, customers) or one document per order with the items embedded. Pick an operation.'),tb,sl.el,out,h('div',{class:'note'},'Operation counts are simplified. Real databases differ, and many NoSQL stores also offer secondary indexes, joins or transactions. The point is the shape of the work, not the exact numbers.'));
  draw();
};

/* 3. Database scaling: where is the bottleneck? */
DEMOS.dbscale=function(host){
  let reads=3000,writes=400,cache=false,replicas=0,shards=1;const CAP=1500;
  const rd=readout();const out=h('div');const verdict=h('div',{class:'takeaway'});
  const sr=ctl('Reads per second',0,20000,reads,500,v=>{reads=v;draw();},v=>v.toLocaleString());
  const sw=ctl('Writes per second',0,6000,writes,100,v=>{writes=v;draw();},v=>v.toLocaleString());
  const sx=ctl('Read replicas per shard',0,4,replicas,1,v=>{replicas=v;draw();},v=>v);
  const ss=ctl('Shards',1,4,shards,1,v=>{shards=v;draw();},v=>v);
  const cc=chip('Cache in front (90% of reads hit it)',()=>{cache=!cache;cc.classList.toggle('on',cache);draw();},false);
  function draw(){out.textContent='';
    const dbReads=reads*(cache?0.1:1);
    const readPer=dbReads/shards/(replicas+1);const writePer=writes/shards; // every replica must replay all writes of its shard
    const primary=readPer+writePer,replica=readPer+writePer;
    const mk=(name,load)=>{const m=meter(0);m.set(load/CAP*100,load>CAP?'bad':load>CAP*0.75?'warn':'go');return h('div',{class:'row',style:'margin:6px 0'},h('span',{class:'note',style:'min-width:230px'},name),h('div',{style:'flex:1;min-width:150px'},m),h('span',{class:'note'},Math.round(load).toLocaleString()+' ops/s of '+CAP.toLocaleString()));};
    out.append(mk(`Each primary (${shards} shard${shards>1?'s':''})`,primary));
    if(replicas>0)out.append(mk('Each replica',replica));
    const worst=primary;let msg;
    if(worst<=CAP*0.75)msg='Comfortable. Everything is under 75% of capacity.';
    else if(worst<=CAP)msg='Close to the limit. A spike will cause queueing.';
    else if(writePer>CAP*0.8)msg='The write path is the bottleneck. Replicas and caches do not help, because every write still lands on the primary (and is replayed on each replica). Writes only scale by splitting the data: sharding.';
    else msg='Reads are the bottleneck. Cache hot reads first, then add read replicas.';
    verdict.textContent=msg;
    rd.set(`DB reads after cache: ${Math.round(dbReads).toLocaleString()}/s. Writes per shard: ${Math.round(writePer).toLocaleString()}/s.`);}
  host.append(h('div',{class:'note'},'Each database node handles about 1,500 operations per second. Set your read and write rates, then add cache, replicas and shards to see what actually helps.'),sr.el,sw.el,h('div',{class:'row'},cc),sx.el,ss.el,rd,out,verdict);
  draw();
};

/* 4. Indexes: rows examined with and without an index */
DEMOS.indexes=function(host){
  let exp=6,nIdx=1;const FAN=200;
  const qs=[
    {n:'WHERE email = ?  (indexed)',idx:true,f:N=>({scan:N,tree:Math.max(1,Math.ceil(Math.log(N)/Math.log(FAN)))+1,txt:'B-tree walks from the root to one leaf: a handful of page reads.'})},
    {n:'WHERE email = ?  (no index)',idx:false,f:N=>({scan:N,tree:N,txt:'No index to use, so the database reads every row (full table scan).'})},
    {n:'WHERE created_at BETWEEN a AND b  (indexed, 1% of rows)',idx:true,f:N=>({scan:N,tree:Math.max(1,Math.ceil(Math.log(N)/Math.log(FAN)))+Math.ceil(N*0.01),txt:'Walk to the start of the range, then read leaf pages in order. Cost grows with the rows returned.'})},
    {n:"WHERE email LIKE '%@gmail.com'  (index on email)",idx:false,f:N=>({scan:N,tree:N,txt:'A leading wildcard cannot use the sorted order, so the index is useless and it scans.'})},
    {n:'WHERE country = ?  (indexed, but 50% of rows match)',idx:true,f:N=>({scan:N,tree:Math.ceil(N*0.5)+Math.ceil(Math.log(N)/Math.log(FAN)),txt:'Low selectivity: when half the table matches, jumping around through an index costs about as much as scanning.'})}];
  let cur=qs[0];const out=h('div');const wr=h('div',{class:'note'});
  const sl=ctl('Rows in the table',3,9,exp,1,v=>{exp=v;draw();},v=>Math.pow(10,v).toLocaleString());
  const si=ctl('Indexes on the table',0,8,nIdx,1,v=>{nIdx=v;draw();},v=>v);
  const tb=tabs(qs.map(q=>q.n),i=>{cur=qs[i];draw();},0);
  function draw(){out.textContent='';const N=Math.pow(10,exp);const r=cur.f(N);const full=N;
    const row=(name,v,cls)=>{const m=meter(0);m.set(Math.max(1.5,Math.log10(v+1)/Math.log10(full+1)*100),cls);return h('div',{style:'margin:10px 0'},h('b',{},`${name}: ${v.toLocaleString()} row or page reads`),m);};
    out.append(row('Full scan',full,'warn'),row('Using the index',Math.min(r.tree,full),r.tree<full*0.5?'go':'warn'),h('div',{class:'note'},r.txt));
    const ms=full/5e6*1000; // about 5 million rows per second sequential
    out.append(h('div',{class:'readout'},`Rough time: full scan about ${ms<1?'<1 ms':ms<1000?Math.round(ms)+' ms':(ms/1000).toFixed(ms<1e5?1:0)+' s'}, index lookup well under 1 ms for point queries.`));
    wr.textContent=`Write cost: one insert updates the table plus ${nIdx} index${nIdx===1?'':'es'}, so about ${nIdx+1}x the page writes (and more disk and memory). Indexes make reads faster and writes slower.`;}
  host.append(h('div',{class:'note'},'Choose a query and a table size. Compare reading every row with using a B-tree index (about 200 entries per page).'),tb,sl.el,out,si.el,wr,h('div',{class:'note'},'Estimates only: scan speed varies with hardware and caching. The shape is what matters: scans grow linearly, a B-tree grows with the logarithm.'));
  draw();
};

/* 5. Partitioning: how rows are split inside one logical table */
DEMOS.partition=function(host){
  const rand=mkRand(21);const rows=[];const regions=['EU','US','APAC','LATAM'];
  for(let i=0;i<400;i++){const age=Math.floor(Math.pow(rand(),2.2)*12); // 0 = this month, skewed toward recent
    rows.push({u:Math.floor(rand()*5000),m:11-age,r:regions[rand()<0.55?1:Math.floor(rand()*4)]});}
  let strat=0,P=4;const out=h('div');const note=h('div',{class:'takeaway'});
  const sl=ctl('Partitions',2,6,P,1,v=>{P=v;draw();},v=>v);
  const tb=tabs(['Range by month','Hash of user id','List by region'],i=>{strat=i;draw();},0);
  const qchips=h('div',{class:'chips'});let q=0;const queries=['Orders from the last 7 days','All orders of user 1234','All orders in the EU'];
  queries.forEach((n,i)=>qchips.append(chip(n,()=>{q=i;[...qchips.children].forEach((c,j)=>c.classList.toggle('on',i===j));draw();},i===0)));
  function part(r){if(strat===0)return Math.min(P-1,Math.floor(r.m/(12/P)));if(strat===1)return fnv(String(r.u))%P;return regions.indexOf(r.r)%P;}
  function draw(){out.textContent='';const counts=new Array(P).fill(0);rows.forEach(r=>counts[part(r)]++);const mx=Math.max(...counts);
    counts.forEach((c,i)=>{const m=meter(0);m.set(c/rows.length*100*Math.min(3,P/2),c===mx&&mx>rows.length/P*1.6?'warn':'go');out.append(h('div',{class:'row',style:'margin:5px 0'},h('span',{class:'note',style:'min-width:150px'},'Partition '+(i+1)),h('div',{style:'flex:1;min-width:150px'},m),h('span',{class:'note'},c+' rows')));});
    let touched;
    if(q===0){touched=strat===0?[part({m:11})]:strat===1?[...Array(P).keys()]:[...Array(P).keys()];}
    else if(q===1){touched=strat===1?[fnv('1234')%P]:[...Array(P).keys()];}
    else{touched=strat===2?[regions.indexOf('EU')%P]:[...Array(P).keys()];}
    const hot=Math.max(...counts)/(rows.length/P);
    note.textContent=`Query "${queries[q]}" touches ${touched.length} of ${P} partitions${touched.length===1?' (partition pruning: the others are never read)':' (every partition has to be searched)'}. Busiest partition holds ${hot.toFixed(1)}x its fair share${hot>1.6?': a hot spot, because the data or the traffic is skewed':''}.`;}
  host.append(h('div',{class:'note'},'400 orders, skewed toward recent months and toward the US. Choose how to split them and which query to run.'),tb,sl.el,qchips,out,note);
  draw();
};

/* 6. Sharding: moving keys when you add a shard */
DEMOS.shard=function(host){
  let strat=0,S=4,hot=false;const K=3000;const keys=[];for(let i=0;i<K;i++)keys.push('user-'+i);
  const ring=n=>{const pts=[];for(let s=0;s<n;s++)for(let v=0;v<64;v++)pts.push([fnv('shard'+s+'#'+v),s]);pts.sort((a,b)=>a[0]-b[0]);return pts;};
  const ringOwner=(pts,k)=>{const h2=fnv(k);for(const p of pts)if(p[0]>=h2)return p[1];return pts[0][1];};
  const owner=(n,k,mode)=>mode===0?fnv(k)%n:ringOwner(ring(n),k);
  const out=h('div');const verdict=h('div',{class:'takeaway'});const rd=readout();
  const sl=ctl('Shards',2,8,S,1,v=>{S=v;draw();},v=>v);
  const tb=tabs(['hash(key) mod N','Consistent hashing ring','Directory lookup table'],i=>{strat=i;draw();},0);
  const hc=chip('One celebrity user gets 30% of all traffic',()=>{hot=!hot;hc.classList.toggle('on',hot);draw();},false);
  function draw(){out.textContent='';
    const load=new Array(S).fill(0);
    const own=k=>strat===2?fnv(k)%S:owner(S,k,strat);
    const pts=strat===1?ring(S):null;
    keys.forEach((k,i)=>{const o=strat===1?ringOwner(pts,k):own(k);load[o]+=(hot&&i===0)?0:1;});
    if(hot){const o=strat===1?ringOwner(pts,keys[0]):own(keys[0]);load[o]+=K*0.43;}
    const tot=load.reduce((a,b)=>a+b,0);const mx=Math.max(...load);
    load.forEach((c,i)=>{const m=meter(0);m.set(c/tot*100*Math.min(S,3)/1.5,c===mx&&mx>tot/S*1.5?'bad':'go');out.append(h('div',{class:'row',style:'margin:5px 0'},h('span',{class:'note',style:'min-width:120px'},'Shard '+(i+1)),h('div',{style:'flex:1;min-width:150px'},m),h('span',{class:'note'},Math.round(c/tot*100)+'% of traffic')));});
    let moved=0;
    if(strat===0){keys.forEach(k=>{if(fnv(k)%S!==fnv(k)%(S+1))moved++;});}
    else if(strat===1){const a=ring(S),b=ring(S+1);keys.forEach(k=>{if(ringOwner(a,k)!==ringOwner(b,k))moved++;});}
    else moved=Math.round(K/(S+1));
    const pct=Math.round(moved/K*100);
    rd.set(`Adding shard ${S+1}: ${moved.toLocaleString()} of ${K.toLocaleString()} keys move (${pct}%).`+(strat===0?'\nAlmost everything moves, because the divisor changed for every key.':strat===1?'\nOnly keys that now fall to the new shard move, close to 1/(N+1).':'\nOnly the ranges you choose to move. The cost is a lookup service every request depends on.'));
    verdict.textContent=hot?'A hot key cannot be fixed by hashing: it still lives on one shard. Fixes: split the key (user-id plus a random suffix), cache it, or give it its own shard.':'Distribution looks even when keys are plentiful and evenly used. The bigger risk is the next resharding, and queries that span shards.';}
  host.append(h('div',{class:'note'},'3,000 users spread over shards. Pick a placement rule, then see how many keys have to move when you add one more shard.'),tb,sl.el,h('div',{class:'row'},hc),out,rd,verdict);
  draw();
};

/* 7. Replication: sync vs async, lag and failover */
DEMOS.repl=function(host,o,ctx){
  let mode='Asynchronous',lag=300;const log=logbox();const rd=readout();const verdict=h('div',{class:'takeaway'});
  let v=0,leader=0,f1=0,f2=0,acked=0,alive=true,busy=false,epoch=0;
  const tb=tabs(['Asynchronous','Semi-synchronous (1 follower)','Synchronous (all)'],(i,n)=>{mode=n;reset();},0);
  const sl=ctl('Network delay to followers',50,1500,lag,50,x=>{lag=x;},x=>x+' ms');
  const show=()=>rd.set(`Leader: v${leader}${alive?'':'  (DOWN)'}    Follower 1: v${f1}    Follower 2: v${f2}    Client was told committed up to: v${acked}`);
  function reset(){epoch++;v=0;leader=0;f1=0;f2=0;acked=0;alive=true;busy=false;log.clear();verdict.textContent='';show();}
  function write(){if(!alive){log.say('Leader is down, writes fail until a new leader is chosen.','bad');return;}
    v++;const n=v;leader=n;const ep=epoch;log.say(`Client writes v${n}. Leader applies it.`);show();
    const ack=()=>{acked=Math.max(acked,n);log.say(`Leader tells the client: v${n} committed.`,'note');show();};
    ctx.after(lag,()=>{if(ep!==epoch)return;{f1=Math.max(f1,n);log.say(`Follower 1 applied v${n} (after ${lag} ms).`);show();if(mode.startsWith('Semi'))ack();}});
    ctx.after(lag*1.6,()=>{if(ep!==epoch)return;f2=Math.max(f2,n);log.say(`Follower 2 applied v${n} (after ${Math.round(lag*1.6)} ms).`);show();if(mode.startsWith('Sync'))ack();});
    if(mode==='Asynchronous')ack();}
  function readF(){log.say(`Read from Follower 2 returns v${f2}${f2<leader?`, but the leader has v${leader}: a stale read (replication lag)`:' (up to date)'}.`,f2<leader?'bad':'');}
  function kill(){if(!alive)return;alive=false;epoch++;const best=Math.max(f1,f2);log.say('*** Leader crashes. The most up-to-date follower is promoted. ***','bad');
    const lost=acked>best?acked-best:0;
    log.say(`New leader has v${best}. Client had been told v${acked} was committed.`+(lost?` ${lost} acknowledged write${lost>1?'s are':' is'} lost.`:' No acknowledged write is lost.'),lost?'bad':'note');
    verdict.textContent=lost?'Asynchronous replication acknowledged writes before any follower had them, so failover lost data. That is the price of low write latency.':mode==='Asynchronous'?'Nothing was lost this time only because the followers had caught up. Crash right after a write, with a larger network delay, to see acknowledged writes vanish.':mode.startsWith('Sync')?'Synchronous replication is safe: a write is only acknowledged after every replica has it. The price is that one slow or dead follower stalls every write.':'Semi-synchronous keeps at least one follower current, so an acknowledged write survives one failure, without waiting for every replica.';
    leader=best;alive=true;show();}
  host.append(h('div',{class:'note'},'One leader, two followers. Write a few values, read from a follower, then crash the leader at an awkward moment.'),tb,sl.el,h('div',{class:'row'},btn('Write next value',write),btn('Read from Follower 2',readF),btn('Crash the leader now',kill,'ghost'),btn('Reset',reset,'ghost')),rd,log,verdict);
  show();
};

/* 8. Bloom filter */
DEMOS.bloom=function(host){
  let m=64,k=3;const bits=[];let items=[];const out=h('div');const grid=h('div',{class:'chips',style:'gap:3px'});const rd=readout();const verdict=h('div',{class:'takeaway'});
  const sm=ctl('Bits in the filter (m)',32,256,m,16,v=>{m=v;rebuild();},v=>v);const sk=ctl('Hash functions (k)',1,6,k,1,v=>{k=v;rebuild();},v=>v);
  const inp=h('input',{type:'text',placeholder:'type a word',value:'alice','aria-label':'word to add or check',style:'padding:8px 10px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:inherit'});
  const mix=x=>{x^=x>>>16;x=Math.imul(x,0x85ebca6b);x^=x>>>13;x=Math.imul(x,0xc2b2ae35);x^=x>>>16;return x>>>0;};
  const pos=w=>{const h1=mix(fnv(w)),h2=mix(fnv('~'+w))|1;const r=[];for(let i=0;i<k;i++)r.push(((h1+Math.imul(i,h2))>>>0)%m);return r;};
  function rebuild(){bits.length=0;for(let i=0;i<m;i++)bits.push(0);items.forEach(w=>pos(w).forEach(p=>bits[p]=1));draw();}
  function draw(hi){grid.textContent='';bits.forEach((b,i)=>{const c=h('span',{style:`display:inline-block;width:14px;height:14px;border-radius:3px;border:1px solid var(--line);background:${hi&&hi.includes(i)?(b?'var(--go)':'var(--bad)'):(b?'var(--accent)':'var(--well)')}`});grid.append(c);});
    const n=items.length,set=bits.filter(Boolean).length;const fp=Math.pow(1-Math.exp(-k*n/m),k);
    rd.set(`Items added: ${n}.  Bits set: ${set} of ${m}.  Expected false positive rate: ${(fp*100).toFixed(1)}%  (best k for this size is about ${Math.max(1,Math.round(m/Math.max(n,1)*Math.LN2))})`);}
  function add(){const w=inp.value.trim();if(!w)return;if(!items.includes(w))items.push(w);const p=pos(w);rebuild();draw(p);verdict.textContent=`Added "${w}": set bits ${[...new Set(p)].join(', ')}.`;}
  function check(){const w=inp.value.trim();if(!w)return;const p=pos(w);const all=p.every(i=>bits[i]);draw(p);const real=items.includes(w);
    verdict.textContent=!all?`"${w}": at least one of its bits is 0, so it is DEFINITELY NOT in the set. A Bloom filter never gives a false negative.`:real?`"${w}": all its bits are 1 and it really was added: correct "probably yes".`:`"${w}": all its bits happen to be 1 because of other words, so the filter says "probably yes" but it was never added. That is a false positive.`;}
  function fill(){const base=items.length;for(let i=0;i<20;i++)items.push('item'+(base+i));rebuild();verdict.textContent='Added 20 random items.';}
  function measure(){let fpc=0;const T=2000;for(let i=0;i<T;i++){const w='probe'+i;if(pos(w).every(x=>bits[x]))fpc++;}verdict.textContent=`Measured: ${fpc} of ${T} words that were never added were reported "probably yes": ${(fpc/T*100).toFixed(1)}% false positives.`;}
  host.append(h('div',{class:'note'},'A Bloom filter is a bit array plus k hash functions. Add words, check words, then add many and watch false positives appear.'),sm.el,sk.el,h('div',{class:'row'},inp,btn('Add word',add),btn('Check word',check),btn('Add 20 random items',fill,'ghost'),btn('Measure false positives',measure,'ghost'),btn('Clear',()=>{items=[];rebuild();verdict.textContent='';},'ghost')),grid,rd,verdict);
  rebuild();
};
