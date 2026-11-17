/* ===== Phase 0 demos ===== */
const COL=['var(--l6)','var(--l0)','var(--l2)','var(--l8)','var(--l4)','var(--l3)','var(--l1)','var(--l7)'];
const fmtTime=s=>s<1?`${(s*1000).toFixed(0)} ms`:s<90?`${s.toFixed(1)} s`:s<5400?`${(s/60).toFixed(1)} min`:s<172800?`${(s/3600).toFixed(1)} h`:`${(s/86400).toFixed(1)} days`;

/* 1. Scalability: vertical vs horizontal with animated requests */
DEMOS.scale=function(host){
  let n=1,m=1,rps=300;const MAXM=8,CAP=100;const W=720,H=300;
  const svg=svgBox(W,H);const layer=sv('g');const dots=[];let tick=0,rr=0;const rand=mkRand(7);
  const rd=readout();const rpsC=ctl('Incoming requests/sec',0,1600,rps,50,v=>{rps=v;draw();},v=>v+' rps');
  const bUp=btn('Bigger server (scale up)',()=>{if(m<MAXM){m*=2;draw();}});const bOut=btn('Add a server (scale out)',()=>{if(n<8){n++;draw();}},'ghost');const bReset=btn('Reset',()=>{n=1;m=1;draw();},'ghost');
  function util(){return rps/(n*CAP*m);}
  function draw(){layer.textContent='';const u=util();const cw=W/n;
    layer.append(sv('rect',{x:W/2-70,y:12,width:140,height:34,rx:10,fill:'var(--accent-soft)',stroke:'var(--line)'}),sv('text',{x:W/2,y:34,'text-anchor':'middle','font-size':13,'font-weight':600,fill:'var(--ink)'},`Users: ${rps} rps`));
    for(let i=0;i<n;i++){const x=cw*i+cw/2,bw=Math.min(110,cw-14),bh=60+14*Math.log2(m)*2.2;const col=u>1?'var(--bad)':u>.8?'var(--warn)':'var(--go)';
      layer.append(sv('rect',{x:x-bw/2,y:150,width:bw,height:bh,rx:10,fill:'var(--surface)',stroke:col,'stroke-width':3}),
        sv('rect',{x:x-bw/2+8,y:150+bh-18,width:Math.max(2,(bw-16)*Math.min(1,u)),height:8,rx:4,fill:col}),
        sv('text',{x,y:172,'text-anchor':'middle','font-size':12,'font-weight':600,fill:'var(--ink)'},`Server ${i+1}`),
        sv('text',{x,y:190,'text-anchor':'middle','font-size':11,fill:'var(--ink2)'},`size x${m}`));}
    const cap=n*CAP*m;const served=Math.min(rps,cap);const cost=(n*Math.pow(m,1.4)).toFixed(1);
    rd.set(`Capacity: ${cap} rps (${n} server${n>1?'s':''} x size ${m}). Served: ${served} rps. Dropped: ${Math.max(0,rps-cap)} rps.\nRelative cost: ${cost}. ${m>=MAXM?'Largest machine reached: scaling up is finished.':''}${n>=8?' Server limit for this demo reached.':''}`);
    bUp.disabled=m>=MAXM;bOut.disabled=n>=8;}
  const gDots=sv('g');svg.append(layer,gDots);
  ctx.every(100,()=>{tick++;const spawn=Math.min(8,Math.round(rps/200));const u=util();
    for(let k=0;k<spawn;k++){const s=rr++%n;dots.push({s,p:0,drop:u>1&&rand()<1-1/u});}
    gDots.textContent='';const cw=W/n;
    for(let i=dots.length-1;i>=0;i--){const d=dots[i];d.p+=.14;if(d.p>=1||(d.drop&&d.p>.7)){dots.splice(i,1);continue;}
      const x=W/2+(cw*d.s+cw/2-W/2)*d.p,y=48+(150-48)*d.p;gDots.append(sv('circle',{cx:x,cy:y,r:4,fill:d.drop?'var(--bad)':'var(--accent)',opacity:1-(d.drop?d.p:0)*.8}));}});
  host.append(svg,rpsC.el,h('div',{class:'row'},bUp,bOut,bReset),rd,h('div',{class:'note'},'Try 600 rps: one server drops requests. Scale up until you hit the biggest machine, then scale out. Scaling up is simple but has a ceiling and a rising price. Scaling out has no ceiling, but now you need a load balancer and servers that do not keep user data locally.'));
  draw();
};

/* 2. Availability: nines and components in series / parallel */
DEMOS.avail=function(host){
  const nines=[90,99,99.9,99.99,99.999,99.9999];let ni=2,a=99.5,cnt=3;
  const rd=readout(),rd2=readout();const svg=svgBox(720,120);
  const c1=ctl('Target availability',0,5,ni,1,v=>{ni=v;draw();},v=>nines[v]+'%');
  const c2=ctl('One component availability',90,99.99,a,0.01,v=>{a=v;draw();},v=>v.toFixed(2)+'%');
  const c3=ctl('Components in a chain',1,6,cnt,1,v=>{cnt=v;draw();},v=>v+'');
  function draw(){const A=nines[ni]/100,down=(1-A);const y=365*86400*down;
    rd.set(`${nines[ni]}% available allows:\n  ${fmtTime(y)} of downtime per year\n  ${fmtTime(30*86400*down)} per 30-day month\n  ${fmtTime(86400*down)} per day`);
    const p=a/100;const series=Math.pow(p,cnt);const par=1-Math.pow(1-p,2);const chainWithReplicas=Math.pow(par,cnt);
    rd2.set(`Chain of ${cnt} components, each ${a.toFixed(2)}%:\n  One of each (in series): ${(series*100).toFixed(3)}%  (${fmtTime(365*86400*(1-series))} down per year)\n  Two of each (in parallel): ${(chainWithReplicas*100).toFixed(4)}%  (${fmtTime(365*86400*(1-chainWithReplicas))} down per year)`);
    svg.textContent='';
    for(let i=0;i<cnt;i++){const x=20+i*(680/cnt);svg.append(sv('rect',{x,y:30,width:680/cnt-16,height:44,rx:8,fill:'var(--accent-soft)',stroke:'var(--accent)'}),sv('text',{x:x+(680/cnt-16)/2,y:57,'text-anchor':'middle','font-size':12,fill:'var(--ink)'},'part '+(i+1)));if(i<cnt-1)svg.append(sv('path',{d:`M${x+680/cnt-16} 52 h16`,stroke:'var(--ink2)','stroke-width':2}));}
    svg.append(sv('text',{x:20,y:105,'font-size':12,fill:'var(--ink2)'},`If any one part is down the whole chain is down, so availability multiplies: ${a.toFixed(2)}% ^ ${cnt} = ${(series*100).toFixed(2)}%`));}
  host.append(c1.el,rd,svg,c2.el,c3.el,rd2,h('div',{class:'note'},'Each extra part you put in a chain lowers the total. Putting two copies of a part side by side, so either can serve, raises it sharply.'));draw();
};

/* 3. Reliability: retries over a flaky dependency */
DEMOS.reliab=function(host){
  let p=30,r=0,seed=1;const N=200;const g=h('div',{style:'display:grid;grid-template-columns:repeat(40,1fr);gap:3px'});const rd=readout();
  const cp=ctl('Failure chance per attempt',0,60,p,5,v=>{p=v;run();},v=>v+'%');const cr=ctl('Retries allowed',0,4,r,1,v=>{r=v;run();},v=>v+'');
  function run(){const rand=mkRand(seed*977);g.textContent='';let ok=0,attempts=0;for(let i=0;i<N;i++){let done=false,a=0;for(let k=0;k<=r;k++){a++;if(rand()>=p/100){done=true;break;}}attempts+=a;if(done)ok++;g.append(h('span',{style:`aspect-ratio:1;border-radius:3px;background:${done?'var(--go)':'var(--bad)'};opacity:${a>1&&done?.55:1}`,title:`${a} attempt${a>1?'s':''}`}));}
    const exp=1-Math.pow(p/100,r+1);rd.set(`Succeeded: ${ok} of ${N} (${(100*ok/N).toFixed(1)}%). Expected: ${(100*exp).toFixed(1)}%.\nAverage attempts per request: ${(attempts/N).toFixed(2)} (extra load on the dependency).\nPale green = needed a retry to succeed.`);}
  host.append(cp.el,cr.el,g,rd,h('div',{class:'row'},btn('Run another 200',()=>{seed++;run();})),h('div',{class:'note'},'Reliable means it keeps giving correct results, even when parts misbehave. Retries and redundancy raise success, at the cost of extra load. Retrying an action that is not safe to repeat, like charging a card, can make results wrong. That is why idempotency matters later.'));run();
};

/* 4. SPOF: kill nodes, see if the system survives */
DEMOS.spof=function(host){
  const tiers=[{name:'Load balancer',n:1},{name:'App server',n:1},{name:'Database',n:1}];const alive=tiers.map(t=>[true]);
  const svg=svgBox(720,240);const rd=readout();let dotT=0;const gD=sv('g');
  function up(i){return alive[i].some(Boolean);}
  function draw(){svg.textContent='';const sysUp=tiers.every((_,i)=>up(i));
    svg.append(sv('rect',{x:14,y:85,width:80,height:50,rx:10,fill:'var(--accent-soft)',stroke:'var(--line)'}),sv('text',{x:54,y:115,'text-anchor':'middle','font-size':13,'font-weight':600,fill:'var(--ink)'},'Users'));
    tiers.forEach((t,i)=>{const x=170+i*190;for(let k=0;k<t.n;k++){const y=110-(t.n-1)*34+k*68-26;const ok=alive[i][k];
      const node=sv('g',{style:'cursor:pointer',tabindex:0,role:'button','aria-label':`${t.name} ${k+1}: ${ok?'running':'down'}. Press to toggle.`,onclick:()=>{alive[i][k]=!alive[i][k];draw();},onkeydown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();alive[i][k]=!alive[i][k];draw();}}},
        sv('rect',{x,y,width:140,height:52,rx:10,fill:ok?'var(--surface)':'var(--bad-soft)',stroke:ok?'var(--go)':'var(--bad)','stroke-width':3}),
        sv('text',{x:x+70,y:y+22,'text-anchor':'middle','font-size':13,'font-weight':600,fill:'var(--ink)'},t.name),sv('text',{x:x+70,y:y+40,'text-anchor':'middle','font-size':11,fill:'var(--ink2)'},ok?'running (click to kill)':'DOWN (click to revive)'));
      svg.append(sv('path',{d:`M${i===0?94:x-50} 110 L${x} ${y+26}`,stroke:'var(--line)','stroke-width':2,fill:'none'}),node);}});
    svg.append(sv('text',{x:14,y:226,'font-size':13,'font-weight':700,fill:sysUp?'var(--go)':'var(--bad)'},sysUp?'System is serving users.':'System is DOWN: '+tiers.filter((_,i)=>!up(i)).map(t=>t.name).join(', ')+' has no healthy copy.'),gD);
    const spofs=tiers.filter(t=>t.n===1).map(t=>t.name);rd.set(spofs.length?`Single points of failure right now: ${spofs.join(', ')}.`:'No tier has only one copy. Now try killing every copy in one tier.');}
  ctx.every(120,()=>{dotT=(dotT+1)%30;gD.textContent='';let x=94;const ok=[true,...tiers.map((_,i)=>up(i))];let stop=tiers.findIndex((_,i)=>!up(i));const maxX=stop<0?170+2*190+140:170+stop*190;const px=94+(maxX-94)*dotT/29;gD.append(sv('circle',{cx:px,cy:110,r:4,opacity:.75,fill:stop<0?'var(--accent)':'var(--bad)'}));});
  const row=h('div',{class:'row'},tiers.map((t,i)=>btn(`Add a 2nd ${t.name.toLowerCase()}`,function(){if(t.n<2){t.n=2;alive[i].push(true);this.disabled=true;draw();}},'ghost')),btn('Reset',()=>{tiers.forEach((t,i)=>{t.n=1;alive[i]=[true];});[...row.querySelectorAll('button')].forEach(b=>b.disabled=false);draw();}));
  host.append(svg,row,rd,h('div',{class:'note'},'Click any box to kill it. With one copy per tier, killing anything stops the system. Add a second copy and a single failure no longer matters.'));draw();
};

/* 5. Latency, throughput, bandwidth */
DEMOS.lat=function(host){
  let lat=100,bw=50,conc=1,mode=0;const W=720,H=190;const svg=svgBox(W,H);const rd=readout();const pk=[];let t=0;
  const cl=ctl('Latency (one-way delay)',10,500,lat,10,v=>{lat=v;sum();},v=>v+' ms');const cb=ctl('Bandwidth',1,100,bw,1,v=>{bw=v;sum();},v=>v+' Mbps');const cc=ctl('Requests in flight at once',1,20,conc,1,v=>{conc=v;sum();},v=>v+'');
  function sum(){const rtt=2*lat;const small=0.001*8/bw*1000; // 1KB request time on wire (ms)
    const per=rtt+small;const rps=conc*1000/per;const big=rtt+ (50*8/bw)*1000; // 50MB file
    rd.set(`Round trip: ${rtt} ms.\nSmall 1 KB requests, ${conc} at a time: about ${rps.toFixed(1)} requests per second. Bandwidth barely matters here.\nOne 50 MB file: ${(big/1000).toFixed(1)} s. Latency barely matters here.\nRule: many small calls are limited by latency and concurrency, one large transfer by bandwidth.`);}
  svg.append(sv('text',{x:20,y:24,'font-size':12,fill:'var(--ink2)'},'Client'),sv('text',{x:W-70,y:24,'font-size':12,fill:'var(--ink2)'},'Server'));
  const pipe=sv('rect',{x:70,y:80,width:W-140,height:30,rx:6,fill:'var(--accent-soft)',stroke:'var(--accent)'});const gp=sv('g');svg.append(pipe,gp);
  ctx.every(50,()=>{t++;const ph=Math.max(6,Math.round(48-bw*.4));pipe.setAttribute('height',Math.max(12,Math.min(80,8+bw*.7)));pipe.setAttribute('y',95-Math.max(12,Math.min(80,8+bw*.7))/2);
    const travel=Math.max(6,lat/12);const gap=Math.max(2,Math.round(travel*2/conc/1));
    if(t%gap===0)pk.push({p:0,back:false});
    gp.textContent='';for(let i=pk.length-1;i>=0;i--){const q=pk[i];q.p+=1/travel;if(q.p>=1){if(!q.back){q.back=true;q.p=0;}else{pk.splice(i,1);continue;}}const x=q.back?W-70-(W-140)*q.p:70+(W-140)*q.p;gp.append(sv('circle',{cx:x,cy:95+(q.back?10:-10)*0,r:5,fill:q.back?'var(--go)':'var(--accent)'}));}
    if(pk.length>60)pk.splice(0,pk.length-60);});
  svg.append(sv('text',{x:W/2,y:170,'text-anchor':'middle','font-size':12,fill:'var(--ink2)'},'Blue dots are requests going out, green dots are responses coming back. Pipe width is bandwidth.'));
  host.append(svg,cl.el,cb.el,cc.el,rd,h('div',{class:'note'},'Latency is how long one trip takes. Bandwidth is how much the pipe can carry. Throughput is how much actually gets through, and it depends on both plus how many requests overlap.'));sum();
};

/* 6. Consistent hashing */
function mix32(x){x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return x>>>0;}
const H32=s=>mix32(fnv(s));
DEMOS.ring=function(host){
  const KEYS=Array.from({length:48},(_,i)=>'key-'+i);const names=['A','B','C','D','E','F','G','H'];let nodes=['A','B','C'];let vn=1;let prevC=null,prevM=null;
  const svg=svgBox(360,360);svg.style.maxWidth='440px';svg.style.margin='0 auto';const rd=readout(),counts=h('div',{class:'chips'});
  function build(){const pts=[];nodes.forEach(n=>{for(let v=0;v<vn;v++)pts.push({n,h:H32(n+'#'+v)});});pts.sort((a,b)=>a.h-b.h);return pts;}
  function owner(pts,k){const hk=H32(k);for(const p of pts)if(p.h>=hk)return p.n;return pts[0].n;}
  const mod=k=>nodes[H32(k)%nodes.length];
  function ang(hh){return hh/4294967296*Math.PI*2-Math.PI/2;}
  function draw(note){const pts=build();svg.textContent='';const cx=180,cy=180,R=125;
    svg.append(sv('circle',{cx,cy,r:R,fill:'none',stroke:'var(--line)','stroke-width':3}));
    pts.forEach(p=>{const a=ang(p.h);svg.append(sv('circle',{cx:cx+R*Math.cos(a),cy:cy+R*Math.sin(a),r:vn>1?5:11,fill:COL[names.indexOf(p.n)],stroke:'var(--surface)','stroke-width':2}));if(vn===1)svg.append(sv('text',{x:cx+R*Math.cos(a),y:cy+R*Math.sin(a)+4,'text-anchor':'middle','font-size':11,'font-weight':700,fill:'var(--on-fill)'},p.n));});
    const cur={},curM={};const cnt={};nodes.forEach(n=>cnt[n]=0);
    KEYS.forEach(k=>{const o=owner(pts,k);cur[k]=o;curM[k]=mod(k);cnt[o]++;const a=ang(H32(k));svg.append(sv('circle',{cx:cx+(R-22)*Math.cos(a),cy:cy+(R-22)*Math.sin(a),r:3.2,fill:COL[names.indexOf(o)]}));});
    svg.append(sv('text',{x:cx,y:cy-4,'text-anchor':'middle','font-size':12,fill:'var(--ink2)'},'48 keys'),sv('text',{x:cx,y:cy+14,'text-anchor':'middle','font-size':10.5,fill:'var(--ink2)'},'each goes to the next'),sv('text',{x:cx,y:cy+28,'text-anchor':'middle','font-size':10.5,fill:'var(--ink2)'},'server clockwise'));
    counts.textContent='';nodes.forEach(n=>counts.append(h('span',{class:'chip',style:`border-color:${COL[names.indexOf(n)]}`},`${n}: ${cnt[n]} keys`)));
    if(prevC){let mv=0,mm=0;KEYS.forEach(k=>{if(prevC[k]!==cur[k])mv++;if(prevM[k]!==curM[k])mm++;});rd.set(`${note}\nConsistent hashing moved ${mv} of 48 keys (${Math.round(mv/.48)}%).\nSimple "hash mod N" would have moved ${mm} of 48 keys (${Math.round(mm/.48)}%).`);}else rd.set('Add or remove a server and compare how many keys have to move.');
    prevC=cur;prevM=curM;}
  const add=btn('Add a server',()=>{if(nodes.length<8){const n=names.find(x=>!nodes.includes(x));nodes.push(n);draw('Added server '+n+'.');}});const rem=btn('Remove last server',()=>{if(nodes.length>1){const n=nodes.pop();draw('Removed server '+n+'.');}},'ghost');
  const cv=ctl('Virtual nodes per server',1,40,vn,1,v=>{vn=v;prevC=null;draw();},v=>v+'');
  host.append(svg,h('div',{class:'row'},add,rem),cv.el,counts,rd,h('div',{class:'note'},'With one point per server the keys split unevenly. Raise virtual nodes and each server owns many small slices, so the load evens out and a new server takes a little from everyone.'));draw();
};

/* 7. CAP theorem */
DEMOS.cap=function(host){
  let mode='CP',cut=false;const st={A:1,B:1};const log=logbox();const svg=svgBox(720,170);
  function draw(){svg.textContent='';['A','B'].forEach((k,i)=>{const x=i?500:60;svg.append(sv('rect',{x,y:40,width:160,height:90,rx:12,fill:'var(--surface)',stroke:'var(--accent)','stroke-width':3}),sv('text',{x:x+80,y:68,'text-anchor':'middle','font-size':14,'font-weight':700,fill:'var(--ink)'},'Replica '+k),sv('text',{x:x+80,y:108,'text-anchor':'middle','font-size':28,'font-weight':700,fill:'var(--accent)'},'x = '+st[k]));});
    svg.append(sv('line',{x1:220,y1:85,x2:500,y2:85,stroke:cut?'var(--bad)':'var(--go)','stroke-width':4,'stroke-dasharray':cut?'8 8':null}),sv('text',{x:360,y:75,'text-anchor':'middle','font-size':12,fill:cut?'var(--bad)':'var(--go)','font-weight':600},cut?'NETWORK PARTITION':'connected'));}
  const tabsEl=tabs(['CP: choose consistency','AP: choose availability'],i=>{mode=i?'AP':'CP';log.say(`Mode: ${mode==='CP'?'CP, refuse to answer if unsure':'AP, always answer, maybe stale'}`,'dim');});
  const bw=btn('Write x = 2 on A',()=>{if(cut){if(mode==='CP'){log.say('Write on A rejected. A cannot reach B, so it cannot promise both stay equal. System is unavailable for writes.','bad');}else{st.A=2;log.say('Write accepted on A (x=2). B still says 1. System stayed available, but replicas now disagree.','ok');}}else{st.A=2;st.B=2;log.say('Write on A copied to B. Both x=2.','ok');}draw();});
  const br=btn('Read x from B',()=>{if(cut&&mode==='CP'&&st.A!==st.B){log.say('Read on B refused: B knows it may be behind. Better an error than a wrong answer.','bad');}else log.say(`Read on B returned x=${st.B}${st.B!==st.A?' (STALE: A has '+st.A+')':''}.`,st.B!==st.A?'bad':'ok');},'ghost');
  const bc=btn('Cut the network',()=>{cut=true;log.say('Partition! A and B cannot talk.','bad');draw();},'ghost');const bh=btn('Heal the network',()=>{cut=false;st.B=st.A;log.say('Network healed. B catches up to x='+st.A+'.','ok');draw();},'ghost');const bz=btn('Reset',()=>{cut=false;st.A=1;st.B=1;log.clear();draw();},'ghost');
  host.append(tabsEl,svg,h('div',{class:'row'},bw,br,bc,bh,bz),log,h('div',{class:'note'},'Try: cut the network, write on A, read on B. Partitions will happen on real networks, so the real choice is what to do while one is happening: refuse (consistent) or answer anyway (available).'));draw();
};

/* 8. Failover timeline */
DEMOS.failover=function(host){
  let to=3,mode=0,t=-1,running=false;const rd=readout();const W=720;const svg=svgBox(W,200);
  const ct=ctl('Failure-detection timeout',1,10,to,1,v=>{to=v;t=-1;draw();},v=>v+' s');
  const tb=tabs(['Active-passive (standby promoted)','Active-active (both serve traffic)'],i=>{mode=i;t=-1;draw();});
  function phases(){return mode===0?[['Healthy',0,'var(--go)'],['Detect failure',to,'var(--warn)'],['Promote standby',3,'var(--warn)'],['Redirect clients',2,'var(--warn)'],['Healthy again',0,'var(--go)']]:[['Healthy',0,'var(--go)'],['Detect failure',to,'var(--warn)'],['Remove from rotation',1,'var(--warn)'],['Healthy on 1 node',0,'var(--go)']];}
  function draw(){const ph=phases();const total=ph.reduce((a,p)=>a+p[1],0);svg.textContent='';let x=20;const scale=(W-40)/Math.max(total,1);
    ph.forEach((p,i)=>{const w=Math.max(p[1]*scale,i===0||i===ph.length-1?60:0);});
    const mid=ph.filter(p=>p[1]>0);let cx=20;mid.forEach(p=>{const w=p[1]*scale;svg.append(sv('rect',{x:cx,y:60,width:w,height:46,fill:p[2],opacity:.85,rx:4}),sv('text',{x:cx+w/2,y:88,'text-anchor':'middle','font-size':11.5,'font-weight':600,fill:'#fff'},`${p[0]} ${p[1]}s`));cx+=w;});
    if(t>=0){const px=20+Math.min(t,total)*scale;svg.append(sv('line',{x1:px,y1:44,x2:px,y2:130,stroke:'var(--bad)','stroke-width':3}),sv('text',{x:px,y:40,'text-anchor':'middle','font-size':12,'font-weight':700,fill:'var(--bad)'},t>=total?'recovered':'down'));}
    svg.append(sv('text',{x:20,y:160,'font-size':13,fill:'var(--ink)','font-weight':600},`Users see errors or slowness for about ${total} seconds.`),sv('text',{x:20,y:180,'font-size':12,fill:'var(--ink2)'},mode===0?'Standby waits idle, so there is a promotion step.':'The second node already serves traffic, so only detection and removal remain.'));
    rd.set(`Total disruption: ${total} s (detection ${to} s + ${total-to} s of switching).\nA shorter timeout recovers faster but risks false alarms when the network is merely slow.`);}
  const go=btn('Crash the primary',()=>{t=0;draw();});
  ctx.every(250,()=>{if(t>=0){const total=phases().reduce((a,p)=>a+p[1],0);if(t<total){t+=.5;draw();}}});
  host.append(tb,ct.el,svg,h('div',{class:'row'},go,btn('Reset',()=>{t=-1;draw();},'ghost')),rd);draw();
};

/* 9. Fault tolerance with replicas and quorum */
DEMOS.ft=function(host){
  let n=5,rule=1;let dead=new Set();const svg=svgBox(720,170);const rd=readout();
  const cn=ctl('Number of replicas',3,7,n,1,v=>{n=v;dead=new Set();draw();},v=>v+'');
  const tb=tabs(['Works if any 1 is alive','Works if a majority is alive','Needs every replica'],i=>{rule=i;draw();},1);
  function need(){return rule===0?1:rule===1?Math.floor(n/2)+1:n;}
  function draw(){svg.textContent='';const alive=n-dead.size;const ok=alive>=need();const bw=Math.min(90,640/n-10);
    for(let i=0;i<n;i++){const x=40+i*(640/n)+(640/n-bw)/2;const d=dead.has(i);svg.append(sv('g',{style:'cursor:pointer',tabindex:0,role:'button','aria-label':`Replica ${i+1} ${d?'down':'up'}`,onclick:()=>{d?dead.delete(i):dead.add(i);draw();},onkeydown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();d?dead.delete(i):dead.add(i);draw();}}},sv('rect',{x,y:30,width:bw,height:60,rx:10,fill:d?'var(--bad-soft)':'var(--surface)',stroke:d?'var(--bad)':'var(--go)','stroke-width':3}),sv('text',{x:x+bw/2,y:66,'text-anchor':'middle','font-size':13,'font-weight':600,fill:'var(--ink)'},d?'DOWN':'R'+(i+1))));}
    svg.append(sv('text',{x:40,y:125,'font-size':14,'font-weight':700,fill:ok?'var(--go)':'var(--bad)'},ok?`System keeps working: ${alive} alive, needs ${need()}.`:`System stops: only ${alive} alive, needs ${need()}.`),sv('text',{x:40,y:148,'font-size':12,fill:'var(--ink2)'},'Click replicas to fail or revive them.'));
    const tol=n-need();rd.set(`This design tolerates ${tol} failure${tol===1?'':'s'} out of ${n}.\n${rule===1?'With a majority rule, 4 replicas tolerate no more than 3 do, which is why clusters use odd sizes.':rule===0?'Any-one works for stateless copies. Copies of data need agreement, so they use a majority.':'This is no fault tolerance at all: every failure is an outage.'}`);}
  host.append(cn.el,tb,svg,rd,h('div',{class:'note'},'Fault tolerance means the system keeps going through failures. High availability is the broader goal of staying up, which failover can reach with a short blip. Fault tolerance aims for no blip, at higher cost.'));draw();
};
