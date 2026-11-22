/* ===== helpers ===== */
const NS='http://www.w3.org/2000/svg';
function add(e,kids){for(const k of kids.flat(9)){if(k==null||k===false)continue;e.append(k.nodeType?k:document.createTextNode(String(k)));}}
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const k in attrs||{}){const v=attrs[k];if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='style')e.style.cssText=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v);}add(e,kids);return e;}
function sv(tag,attrs,...kids){const e=document.createElementNS(NS,tag);for(const k in attrs||{}){const v=attrs[k];if(v==null||v===false)continue;if(k==='class')e.setAttribute('class',v);else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v);}for(const c of kids.flat(9)){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)));}return e;}
function svgBox(w,hh,...kids){return sv('svg',{viewBox:`0 0 ${w} ${hh}`,role:'img','aria-label':'diagram'},...kids);}
const btn=(label,fn,cls='')=>h('button',{class:'btn small '+cls,type:'button',onclick:fn},label);
const chip=(label,fn,on)=>h('button',{class:'chip'+(on?' on':''),type:'button',onclick:fn},label);
function ctl(label,min,max,val,step,fn,fmt){fmt=fmt||(v=>v);const o=h('output',{},fmt(val));const i=h('input',{type:'range',min,max,step,value:val,'aria-label':label});i.addEventListener('input',()=>{o.textContent=fmt(+i.value);fn(+i.value);});return {el:h('div',{class:'ctl'},h('label',{},label),i,o),get:()=>+i.value,set:v=>{i.value=v;o.textContent=fmt(+i.value);}};}
function readout(t){const e=h('div',{class:'readout','aria-live':'polite'},t||'');e.set=s=>{e.textContent=s;};return e;}
function meter(pct,cls){const f=h('div',{class:'fill '+(cls||''),style:`width:${pct||0}%`});const m=h('div',{class:'meter'},f);m.set=(p,c)=>{f.style.width=Math.max(0,Math.min(100,p))+'%';f.className='fill '+(c||'');};return m;}
function logbox(){const e=h('div',{class:'log','aria-live':'polite'});e.say=(t,c)=>{e.append(h('div',{class:c||''},t));e.scrollTop=e.scrollHeight;};e.clear=()=>{e.textContent='';};return e;}
function tabs(names,fn,start){const w=h('div',{class:'chips',role:'tablist'});const bs=names.map((n,i)=>{const b=chip(n,()=>{bs.forEach((x,j)=>x.classList.toggle('on',i===j));fn(i,n);},i===(start||0));return b;});add(w,bs);w.select=i=>bs[i].click();return w;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(seed=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296));
function mkRand(seed){let s=seed>>>0;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
function fnv(str){let x=0x811c9dc5;for(let i=0;i<str.length;i++){x^=str.charCodeAt(i);x=Math.imul(x,0x01000193)>>>0;}return x>>>0;}
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const REDUCED=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
/* timers owned by the current view */
let TIMERS=[];
const ctx={every(ms,fn){const t=setInterval(fn,ms);TIMERS.push(()=>clearInterval(t));return ()=>clearInterval(t);},after(ms,fn){const t=setTimeout(fn,ms);TIMERS.push(()=>clearTimeout(t));return t;}};
function clearTimers(){TIMERS.forEach(f=>f());TIMERS=[];}

/* ===== state ===== */
const STORE='sysdesign-from-scratch-v1';
let S={done:{},xp:0,streak:0,last:'',theme:''};
try{const raw=localStorage.getItem(STORE);if(raw)S=Object.assign(S,JSON.parse(raw));}catch(e){}
function save(){try{localStorage.setItem(STORE,JSON.stringify(S));}catch(e){}}
function today(){return new Date().toISOString().slice(0,10);}
function bumpStreak(){const t=today();if(S.last===t)return;const y=new Date(Date.now()-864e5).toISOString().slice(0,10);S.streak=S.last===y?S.streak+1:1;S.last=t;}
if(S.theme)document.documentElement.setAttribute('data-theme',S.theme);

/* ===== data model ===== */
const PHASES=[];const LESSONS=[];const BYKEY={};const BYID={};
function phase(o){o.lessons=[];o.i=PHASES.length;PHASES.push(o);return o;}
function lesson(pi,o){o.phase=pi;o.id=slug(o.key);if(BYID[o.id])throw new Error('dup lesson '+o.id);LESSONS.push(o);PHASES[pi].lessons.push(o);BYKEY[o.key]=o;BYID[o.id]=o;return o;}
const repoUrl={};for(const s of REPO){for(const it of s.items)repoUrl[it.t]=it.u;for(const g in s.groups)for(const it of s.groups[g])repoUrl[it.t]=it.u;}
function ytId(u){const m=/[?&]v=([\w-]{11})/.exec(u||'');return m?m[1]:null;}
const GROUP=i=>PHASES[i].g;
function planned(p){const sec=REPO.find(x=>x.name===p.sec);if(!sec)return [];return p.grp?sec.groups[p.grp]:sec.items;}

/* ===== generic demos ===== */
const DEMOS={};
/* sequence diagram, animated step by step. opts:{actors:[],steps:[{f,t,m,n,r}],variants:{name:{steps}}} */
DEMOS.steps=function(host,o){
  const variants=o.variants||{Flow:{steps:o.steps,actors:o.actors}};const names=Object.keys(variants);let cur=names[0],idx=0,playing=null;
  const stage=h('div',{class:'stepper'});const narr=h('div',{class:'takeaway'});const bar=h('div',{class:'row'});
  function draw(){
    const V=variants[cur];const A=V.actors||o.actors;const st=V.steps;const W=720,colW=W/A.length,top=46,rowH=46,H=top+st.length*rowH+20;
    const s=svgBox(W,H);
    A.forEach((a,i)=>{const x=colW*i+colW/2;s.append(sv('rect',{x:x-colW/2+8,y:6,width:colW-16,height:28,rx:8,fill:'var(--accent-soft)',stroke:'var(--line)'}),sv('text',{x,y:25,'text-anchor':'middle','font-size':12,'font-weight':600,fill:'var(--ink)'},a),sv('line',{x1:x,y1:36,x2:x,y2:H-8,stroke:'var(--line)','stroke-dasharray':'4 4'}));});
    st.forEach((p,i)=>{if(i>idx)return;const y=top+i*rowH+16,x1=colW*p.f+colW/2,x2=colW*p.t+colW/2,self=p.f===p.t;const cur_=i===idx;const col=p.r?'var(--go)':p.bad?'var(--bad)':'var(--accent)';
      const g=sv('g',{class:cur_?'fade':''});
      if(self){g.append(sv('path',{d:`M${x1} ${y-8} h34 v16 h-34`,fill:'none',stroke:col,'stroke-width':cur_?2.6:1.6,'marker-end':'url(#ar)'}),sv('text',{x:x1+40,y:y+4,'font-size':11.5,fill:'var(--ink)'},`${i+1}. ${p.m}`));}
      else{const dir=x2>x1?1:-1;g.append(sv('line',{x1,y1:y,x2:x2-dir*4,y2:y,stroke:col,'stroke-width':cur_?2.6:1.6,'stroke-dasharray':p.r?'6 4':null,'marker-end':'url(#ar)'}),sv('text',{x:(x1+x2)/2,y:y-6,'text-anchor':'middle','font-size':11.5,fill:'var(--ink)','font-weight':cur_?700:500},`${i+1}. ${p.m}`));}
      s.append(g);});
    s.insertBefore(sv('defs',{},sv('marker',{id:'ar',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'},sv('path',{d:'M0 0L10 5L0 10z',fill:'context-stroke'}))),s.firstChild);
    stage.textContent='';stage.append(s);
    narr.textContent=idx<0?'Press Next to start.':(st[idx].n||st[idx].m);
    prev.disabled=idx<=0;next.disabled=idx>=st.length-1;
  }
  const prev=btn('Back',()=>{stop();idx=Math.max(0,idx-1);draw();},'ghost');const next=btn('Next step',()=>{stop();step();});const play=btn('Play',()=>{if(playing){stop();return;}if(idx>=variants[cur].steps.length-1)idx=0;draw();play.textContent='Pause';playing=ctx.every(REDUCED?200:1400,()=>{if(idx>=variants[cur].steps.length-1){stop();return;}idx++;draw();});},'ghost');
  const reset=btn('Reset',()=>{stop();idx=0;draw();},'ghost');
  function stop(){if(playing){playing();playing=null;}play.textContent='Play';}
  function step(){if(idx<variants[cur].steps.length-1)idx++;draw();}
  if(names.length>1)host.append(tabs(names,(i,n)=>{stop();cur=n;idx=0;draw();}));
  add(bar,[prev,next,play,reset]);host.append(stage,narr,bar);draw();
};
/* scenario picker. opts:{options:[{id,name,desc}],rounds:[{s,a,why}],prompt} */
DEMOS.pick=function(host,o){
  let i=0,score=0;const box=h('div',{class:'cards'});const out=h('div',{class:'takeaway'});const head=h('div',{class:'result'});const nextB=btn('Next scenario',()=>{i++;render();});
  function render(){box.textContent='';out.textContent='';nextB.style.display='none';
    if(i>=o.rounds.length){head.textContent=`Score: ${score} of ${o.rounds.length}`;box.append(h('div',{class:'note'},'Run it again from the top to try a different instinct.'));add(out,[btn('Restart',()=>{i=0;score=0;render();},'ghost')]);return;}
    const R=o.rounds[i];head.textContent=`Scenario ${i+1} of ${o.rounds.length}: ${R.s}`;
    o.options.forEach(op=>{const c=h('button',{class:'card',type:'button',style:'cursor:pointer;text-align:left',onclick:()=>{if(box.dataset.locked)return;box.dataset.locked=1;const right=op.id===R.a;if(right)score++;[...box.children].forEach((b,k)=>{const oo=o.options[k];b.classList.add(oo.id===R.a?'ok':(oo.id===op.id?'hot':'dim'));});out.textContent=(right?'Right. ':'Not quite. ')+R.why;nextB.style.display='';nextB.textContent=i===o.rounds.length-1?'See score':'Next scenario';}},h('h4',{},op.name),h('span',{class:'note'},op.desc||''));box.append(c);});
    delete box.dataset.locked;}
  host.append(h('div',{class:'note'},o.prompt||'Pick the best fit for each scenario.'),head,box,out,nextB);render();
};
/* flip cards. opts:{cards:[{f,b}]} */
DEMOS.flip=function(host,o){const g=h('div',{class:'cards'});o.cards.forEach(c=>{const b=h('button',{class:'card',type:'button',style:'cursor:pointer;text-align:left','aria-expanded':'false'},h('h4',{},c.f),h('span',{class:'note'},'Tap to reveal'));let open=false;b.onclick=()=>{open=!open;b.setAttribute('aria-expanded',open);b.lastChild.textContent=open?c.b:'Tap to reveal';b.classList.toggle('ok',open);};g.append(b);});host.append(h('div',{class:'note'},o.prompt||'Try to answer in your head first, then flip.'),g);};
/* compare table. opts:{cols:[..],rows:[[label,a,b],..]} */
DEMOS.compare=function(host,o){const t=h('table',{class:'t'},h('tr',{},h('th',{},''),o.cols.map(c=>h('th',{},c))),o.rows.map(r=>h('tr',{},h('th',{},r[0]),r.slice(1).map(x=>h('td',{},x)))));host.append(t);};
/* architecture builder for interview problems */
DEMOS.design=function(host,o){
  const pool=[...o.right.map(x=>({x,ok:1})),...o.wrong.map(x=>({x,ok:0}))].sort((a,b)=>fnv(a.x)-fnv(b.x));const picked=new Set();
  const grid=h('div',{class:'cards'});const out=h('div',{class:'takeaway'},'Pick every component this design needs, then check.');
  pool.forEach((p,i)=>{const [name,why]=p.x.split(' | ');const c=h('button',{class:'card',type:'button',style:'cursor:pointer;text-align:left','aria-pressed':'false'},h('h4',{},name),h('span',{class:'note',style:'display:none'},why||''));c.onclick=()=>{if(c.dataset.checked)return;if(picked.has(i)){picked.delete(i);c.classList.remove('ok');c.setAttribute('aria-pressed','false');}else{picked.add(i);c.classList.add('ok');c.setAttribute('aria-pressed','true');}};c.dataset.i=i;grid.append(c);});
  const check=btn('Check my design',()=>{let good=0,miss=0,extra=0;[...grid.children].forEach((c,i)=>{c.dataset.checked=1;const p=pool[i],sel=picked.has(i);c.classList.remove('ok');c.lastChild.style.display='';if(p.ok&&sel){good++;c.classList.add('ok');}else if(p.ok&&!sel){miss++;c.classList.add('hot');c.firstChild.append(h('span',{},'missing'));}else if(!p.ok&&sel){extra++;c.classList.add('hot');c.firstChild.append(h('span',{},'not needed'));}else c.classList.add('dim');});out.textContent=`Matched ${good} of ${o.right.length} needed components. Missing ${miss}, unnecessary ${extra}. Read each card for the reason.`;check.disabled=true;});
  host.append(grid,h('div',{class:'row'},check,btn('Try again',()=>{host.textContent='';DEMOS.design(host,o);},'ghost')),out);
};

/* ===== video ===== */
function videoEl(id){const w=h('div',{style:'position:relative;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#000'});
  const b=h('button',{type:'button','aria-label':'Play video',style:'all:unset;cursor:pointer;display:block;width:100%;height:100%;position:relative',onclick:()=>{w.textContent='';w.append(h('iframe',{src:`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,title:'Video walkthrough',allow:'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen',allowfullscreen:true,loading:'lazy',style:'position:absolute;inset:0;width:100%;height:100%;border:0'}));}},
    h('img',{src:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`,alt:'',style:'width:100%;height:100%;object-fit:cover;opacity:.85'}),
    h('span',{style:'position:absolute;inset:0;display:grid;place-items:center'},h('span',{style:'width:68px;height:48px;border-radius:14px;background:#E11D2E;display:grid;place-items:center'},sv('svg',{viewBox:'0 0 24 24',width:26,height:26,style:'background:none'},sv('path',{d:'M8 5v14l11-7z',fill:'#fff'})))));
  w.append(b);return w;}


function deepEl(d){return h('div',{class:'deep'},d.map(x=>typeof x==='string'?h('p',{},x):h('div',{class:'dsec'},h('h3',{},x.h),(x.p||[]).map(t=>h('p',{},t)),x.ul?h('ul',{},x.ul.map(t=>h('li',{},t))):null)));}
function iqEl(list,title,who){const box=h('div',{class:'iq'});box.append(h('h3',{},title));
  list.forEach((q,i)=>{const ta=h('textarea',{rows:3,placeholder:'Practise: type or say your answer before reading the points below.','aria-label':'Your practice answer'});
    box.append(h('details',{class:'iqd'},h('summary',{},h('span',{class:'badge '+(q.lvl==='Staff+'?'warn':q.lvl==='Mid'?'mid':'')},q.lvl||'Senior'),' ',q.q,who?h('span',{class:'note'},'  ('+q.from+')'):null),
      ta,h('b',{},'A strong answer covers'),h('ul',{},q.cover.map(t=>h('li',{},t))),q.pitfalls?h('b',{},'Common pitfalls'):null,q.pitfalls?h('ul',{},q.pitfalls.map(t=>h('li',{},t))):null));});
  return box;}

/* ===== router + views ===== */
const root=document.getElementById('app');
const siteName=document.title;
function lessonHref(l){return '#/l/'+l.id;}
function totals(){const d=LESSONS.filter(l=>S.done[l.id]).length;return {d,n:LESSONS.length};}
function header(){const t=totals();return h('div',{class:'top'},h('a',{class:'brand',href:'#/'},sv('svg',{viewBox:'0 0 34 34','aria-hidden':'true'},sv('circle',{cx:17,cy:17,r:13,fill:'none',stroke:'var(--ink)','stroke-width':4.5}),sv('rect',{x:1,y:12,width:32,height:10,rx:2,fill:'var(--accent)'})),siteName),
  h('div',{class:'nav'},h('a',{class:'pill',href:'#/prereq'},'Prerequisites'),h('a',{class:'pill',href:'#/library'},'Library'),h('a',{class:'pill',href:'#/about'},'Progress'),
  h('span',{class:'pill xp'},`${S.xp} XP`),h('span',{class:'pill'},`${S.streak} day streak`),h('span',{class:'pill'},`${t.d}/${t.n} lessons`),
  h('button',{class:'pill',type:'button',onclick:()=>{const dark=(document.documentElement.getAttribute('data-theme')||(matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'))==='dark';S.theme=dark?'light':'dark';document.documentElement.setAttribute('data-theme',S.theme);save();},'aria-label':'Toggle dark mode'},'Theme')));}
function shell(...kids){clearTimers();root.textContent='';const w=h('div',{class:'wrap'},header(),...kids);root.append(w);window.scrollTo&&window.scrollTo(0,0);document.title=siteName;return w;}
const gv=(i,k)=>`var(--g${GROUP(i)}${k||''})`;

const ABBR=['Core Concepts','Networking','APIs','Databases','Caching','Async Messaging','Distributed Systems','Architecture Patterns','Tradeoffs','Interview Framework','Problems: Easy','Problems: Medium','Problems: Hard'];
const lineVars=i=>`--lc:var(--l${i});--lt:var(--t${i})`;
let introPlayed=false;
function polyAt(pts,d){let acc=0;for(let k=0;k<pts.length-1;k++){const [ax,ay]=pts[k],[bx,by]=pts[k+1],L=Math.hypot(bx-ax,by-ay);if(d<=acc+L||k===pts.length-2){const t=Math.min(1,(d-acc)/L);return [ax+(bx-ax)*t,ay+(by-ay)*t];}acc+=L;}return pts[pts.length-1];}
function mapEl(){
  const W=1000,x0=262,x1=964,rowH=46,top=30;const H=top+PHASES.length*rowH;const play=!introPlayed&&!REDUCED;introPlayed=true;
  const svg=sv('svg',{class:'map',viewBox:`0 0 ${W} ${H}`,role:'group','aria-label':'Course map. Each coloured line is a phase and each station is a lesson.'});
  const tip=sv('text',{class:'tip','text-anchor':'middle',x:0,y:0,opacity:0});
  PHASES.forEach((p,i)=>{
    const y=top+i*rowH,built=p.lessons.length>0,n=Math.max(1,built?p.lessons.length:planned(p).length);
    const dy=(i%2?13:-13),xa=420+((i*71)%240);
    const pts=[[x0,y],[xa,y],[xa+Math.abs(dy),y+dy],[x1,y+dy]];
    const len=(xa-x0)+Math.abs(dy)*1.4142+(x1-xa-Math.abs(dy));
    const d='M'+pts.map(q=>q[0]+' '+q[1]).join(' L');
    const c=`var(--l${i})`;
    const g=sv('g',{});
    g.append(sv('a',{href:'#/p/'+i,'aria-label':`Phase ${i}: ${p.name}`},
      sv('circle',{cx:30,cy:y,r:15,fill:c}),sv('text',{x:30,y:y+5,'text-anchor':'middle','font-size':14,'font-weight':800,fill:`var(--t${i})`},String(i)),
      sv('text',{class:'nm',x:56,y:y-1},ABBR[i]),
      sv('text',{class:'cnt',x:56,y:y+15},built?`${p.lessons.filter(l=>S.done[l.id]).length} of ${p.lessons.length} done`:`planned, ${n} topic${n>1?'s':''}`)));
    g.append(sv('path',{class:'ln '+(built?(play?'draw':''):'plan'),d,stroke:c,style:`--d:${i};--len:${Math.ceil(len)+2}`}));
    const r=built?8:(n>14?4:5);
    for(let k=0;k<n;k++){const dist=n===1?len/2:len*k/(n-1);const [sx,sy]=polyAt(pts,dist);
      if(built){const l=p.lessons[k];const st=sv('a',{class:'st'+(S.done[l.id]?' done':'')+(play?' pop':''),href:lessonHref(l),'aria-label':`${l.key}${S.done[l.id]?', complete':''}`,style:`--c:${c};--d:${i}`},sv('circle',{cx:sx,cy:sy,r,stroke:c}),sv('title',{},l.key));
        const show=()=>{tip.textContent=l.key;tip.setAttribute('x',Math.min(W-90,Math.max(90,sx)));tip.setAttribute('y',sy-16);tip.setAttribute('opacity',1);};st.addEventListener('pointerenter',show);st.addEventListener('focus',show);st.addEventListener('pointerleave',()=>tip.setAttribute('opacity',0));st.addEventListener('blur',()=>tip.setAttribute('opacity',0));g.append(st);}
      else{g.append(sv('g',{class:'st plan'},sv('circle',{cx:sx,cy:sy,r,stroke:c}),sv('title',{},'Planned: '+((planned(p)[k]||{}).t||p.name))));}}
    svg.append(g);});
  svg.append(tip);
  return h('div',{class:'mapwrap'},svg);}
function viewHome(q){
  const t=totals();
  const search=h('input',{id:'lesson-search',class:'search',type:'search',placeholder:'CAP, sharding, design Uber...','aria-label':'Search lessons',value:q||''});
  const results=h('div',{class:'lessons'});const mapw=mapEl();
  const legend=h('div',{class:'legend'});
  PHASES.forEach(p=>{const d=p.lessons.filter(l=>S.done[l.id]).length,n=p.lessons.length||planned(p).length||1;
    legend.append(h('a',{class:'lg',href:'#/p/'+p.i,style:lineVars(p.i)},h('span',{class:'roundel','aria-hidden':'true'},String(p.i)),h('span',{class:'tx'},h('b',{},p.name),meter(p.lessons.length?100*d/p.lessons.length:0),h('span',{class:'cnt'},p.lessons.length?`${d} of ${p.lessons.length} stations done`:`Planned: ${n} topic${n>1?'s':''}`)))); });
  legend.append(h('a',{class:'lg',href:'#/library',style:'--lc:var(--accent);--lt:var(--on-accent)'},h('span',{class:'roundel','aria-hidden':'true'},'L'),h('span',{class:'tx'},h('b',{},'Library'),h('span',{class:'cnt'},'Courses, books, channels, papers'))));
  const lh=h('h3',{},'All lines');
  const built=PHASES.filter(p=>p.lessons.length).length, total=PHASES.length, first=PHASES.find(p=>p.lessons.length);
  const heroStats=h('div',{class:'hero-stats'},
    h('div',{class:'hero-stat'},h('b',{},String(LESSONS.length)),h('span',{},'stations live')),
    h('div',{class:'hero-stat'},h('b',{},String(total)),h('span',{},'lines mapped')),
    h('div',{class:'hero-stat'},h('b',{},'No'),h('span',{},'account needed'))
  );
  const mission=h('aside',{class:'mission-card'},
    h('div',{class:'mission-top'},h('span',{class:'eyebrow'},'Your route'),h('span',{class:'mission-signal','aria-hidden':'true'})),
    h('h3',{},first?`Start with ${first.name}`:'Start with the map'),
    h('p',{},'Short lessons, interactive demos, and interview questions. Your progress stays in this browser.'),
    h('div',{class:'mission-progress'},h('div',{class:'mission-progress-label'},h('span',{},'Course readiness'),h('b',{},`${built}/${total} live`)),meter(total?100*built/total:0)),
    h('div',{class:'mission-foot'},h('span',{class:'status-dot','aria-hidden':'true'}),'Local-first · no account required')
  );
  const sectionHead=h('div',{class:'section-head'},h('div',{},h('span',{class:'eyebrow'},'The learning route'),lh),h('span',{class:'section-note'},'13 lines · 1 library'));
  function doSearch(){results.textContent='';const v=search.value.trim().toLowerCase();const hide=!!v;mapw.style.display=hide?'none':'';legend.style.display=hide?'none':'';lh.style.display=hide?'none':'';if(!v)return;const hits=LESSONS.filter(l=>(l.key+' '+(l.short||'')+' '+(l.lead||'')).toLowerCase().includes(v)).slice(0,30);if(!hits.length)results.append(h('p',{class:'note'},'No station matches. Try another word.'));hits.forEach(l=>results.append(lrow(l)));}
  search.addEventListener('input',doSearch);
  shell(h('section',{class:'hero'},h('div',{class:'hero-copy'},h('span',{class:'eyebrow'},'Interactive field guide · System design 101'),h('h1',{},'Build intuition for the systems behind the internet.'),h('p',{},'Follow a visual route from core concepts to interview problems. Board a station, play with the demo, and learn by making trade-offs.'),
    h('div',{class:'row hero-actions'},h('a',{class:'btn',href:'#/p/0'},'Start Core Concepts'),h('a',{class:'btn ghost',href:'#/prereq'},'Check prerequisites')),
    h('div',{class:'search-wrap'},h('label',{for:'lesson-search'},'Jump to a station'),search),heroStats),mission),
    mapw,results,sectionHead,legend);
  if(q)doSearch();
}
function lrow(l){return h('a',{class:'lrow'+(S.done[l.id]?' done':''),href:lessonHref(l),style:lineVars(l.phase)},h('span',{class:'dot','aria-hidden':'true'}),h('span',{class:'tx'},h('b',{},l.key),h('span',{},l.tag||'')),h('span',{class:'badge lv'},ABBR[l.phase]||PHASES[l.phase].name));}
function viewPhase(i){const p=PHASES[i];if(!p)return viewHome();const d=p.lessons.filter(l=>S.done[l.id]).length;
  shell(h('div',{class:'panel',style:lineVars(i)},h('div',{class:'crumbs'},h('a',{href:'#/'},'Home'),' / Line '+i),h('div',{class:'sign'},h('span',{class:'roundel','aria-hidden':'true'},String(i)),h('h2',{},p.name)),h('p',{class:'lead'},p.intro||p.sub),
    p.pre&&p.pre.length?h('div',{class:'takeaway'},h('b',{},'Before this line: '),p.pre.join(' · ')):null,
    meter(p.lessons.length?100*d/p.lessons.length:0),h('span',{class:'note'},`${d} of ${p.lessons.length} stations complete`),
    p.lessons.length?h('div',{class:'lessons line'},p.lessons.map(lrow)):h('div',{class:'lessons line'},planned(p).map(x=>h('div',{class:'lrow',style:'opacity:.6'},h('span',{class:'dot','aria-hidden':'true'}),h('span',{class:'tx'},h('b',{},x.t),h('span',{},'Planned')),h('span',{class:'badge lv'},'Coming soon')))),
    p.lessons.length&&p.quiz?phaseQuizEl(p,i):null,
    p.lessons.length?h('div',{style:'display:flex;flex-direction:column;gap:14px'},h('h3',{},'Interview questions for this phase'),h('p',{class:'note'},'Three levels. Mid answers explain the idea correctly and apply it to a simple case. Senior answers give trade-offs, numbers and failure modes. Staff+ answers add cost, migration and organisational angles. Try each out loud before opening it.'),p.iq?iqEl(p.iq,'Across the whole phase'):null,...p.lessons.filter(l=>l.iq&&l.iq.length).map(l=>iqEl(l.iq.map(q=>Object.assign({},q,{from:l.short||l.key})),l.short||l.key,true))):null,
    p.lessons.length?null:h('div',{class:'takeaway'},h('b',{},'Not built yet. '),'This line opens when its stations are built.'),
    h('div',{class:'nextprev'},i>0?h('a',{class:'btn ghost',href:'#/p/'+(i-1)},'Previous line'):h('span'),i<PHASES.length-1?h('a',{class:'btn ghost',href:'#/p/'+(i+1)},'Next line'):h('a',{class:'btn ghost',href:'#/library'},'Library'))));}
function viewLesson(id){const l=BYID[id];if(!l)return viewHome();const p=PHASES[l.phase];const idx=p.lessons.indexOf(l);const prev=p.lessons[idx-1],next=p.lessons[idx+1];
  const demo=h('div',{class:'demo'});
  const w=shell();const panel=h('div',{class:'panel',style:lineVars(l.phase)});w.append(panel);
  document.title=l.key+' | '+siteName;
  panel.append(h('div',{class:'crumbs'},h('a',{href:'#/'},'Home'),' / ',h('a',{href:'#/p/'+l.phase},'Line '+l.phase+': '+p.name),' / ',l.short||l.key),h('div',{class:'sign'},h('span',{class:'roundel','aria-hidden':'true'},String(l.phase)),h('h2',{},l.title||l.key)),h('div',{class:'tag'},l.tag||''),
    h('nav',{class:'rail','aria-label':'Stations on this line'},p.lessons.map(x=>h('a',{href:lessonHref(x),class:(x===l?'cur ':'')+(S.done[x.id]?'done':''),title:x.key,'aria-label':x.key+(x===l?' (current)':'')},h('i')))));
  if(l.pre&&l.pre.length){panel.append(h('div',{class:'row'},h('span',{class:'note'},'Prerequisites:'),l.pre.map(k=>{const t=BYKEY[k];return t?h('a',{class:'chip'+(S.done[t.id]?' ok':''),href:lessonHref(t)},(t.short||t.key)):h('span',{class:'chip'},k);})));}
  panel.append(h('p',{class:'lead'},l.lead));
  if(l.more)panel.append(h('div',{class:'lessons'},[].concat(l.more).map(m=>h('p',{class:'lead'},m))));
  panel.append(demo);
  try{DEMOS[l.demo](demo,l.opts||{},ctx);}catch(e){demo.append(h('p',{class:'note'},'Demo failed to load: '+e.message));console.error(l.id,e);}
  if(l.takeaway)panel.append(h('div',{class:'takeaway'},h('b',{},'Takeaway. '),l.takeaway));
  const vid=l.vid||ytId(repoUrl[l.key]);if(vid)panel.append(h('h3',{},'Watch'),videoEl(vid),h('p',{class:'note'},l.vid?'Suggested video found by web search. It is not from the source list, so judge it yourself. Loads only when you press play.':'Video from the source list, embedded from YouTube. It loads only when you press play.'));
  if(l.deep)panel.append(h('h2',{style:'font-size:1.4rem'},'In depth'),deepEl(l.deep));
  panel.append(quizEl(l));
  if(l.iq&&l.iq.length)panel.append(iqEl(l.iq,'Interview questions (senior level and above)'));
  const src=repoUrl[l.key];
  const links=h('div',{class:'row'});if(src)links.append(h('a',{class:'btn ghost small',href:src,target:'_blank',rel:'noopener noreferrer'},'Read the source article'));(l.links||[]).forEach(x=>links.append(h('a',{class:'btn ghost small',href:x[1],target:'_blank',rel:'noopener noreferrer'},x[0])));panel.append(links);
  if(l.terms&&l.terms.length)panel.append(h('table',{class:'t'},l.terms.map(t=>h('tr',{},h('th',{},t[0]),h('td',{},t[1])))));
  panel.append(h('div',{class:'nextprev'},prev?h('a',{class:'btn ghost',href:lessonHref(prev)},'Back: '+(prev.short||prev.key)):h('span'),next?h('a',{class:'btn',href:lessonHref(next)},'Next: '+(next.short||next.key)):h('a',{class:'btn',href:'#/p/'+Math.min(l.phase+1,PHASES.length-1)},'Next phase')));
}
function quizEl(l){const box=h('div',{class:'quiz'});const banner=h('div');const qs=l.quiz||[];const ok=new Array(qs.length).fill(false);const first=new Array(qs.length).fill(true);
  box.append(h('h3',{},'Check yourself'));
  qs.forEach((Q,qi)=>{const opts=h('div',{class:'opts'});const why=h('div',{class:'why'});const hint=Q.hint?h('div',{class:'note'},'Hint: '+Q.hint):null;
    Q.o.forEach((t,oi)=>{const b=h('button',{class:'opt',type:'button',onclick:()=>{if(ok[qi])return;if(oi===Q.a){b.classList.add('right');ok[qi]=true;if(first[qi]&&!S.done[l.id])S.xp+=10;why.textContent='Right. '+Q.why;finish();}else{b.classList.add('wrong');first[qi]=false;why.textContent='Not quite. Try another option.';}}},t);opts.append(b);});
    box.append(h('div',{class:'q'},h('b',{},`${qi+1}. ${Q.q}`),hint,opts,why));});
  function finish(){if(ok.every(Boolean)&&!S.done[l.id]){S.done[l.id]=true;S.xp+=5;bumpStreak();save();{const c=document.querySelector('.rail a.cur');if(c)c.classList.add('done');}banner.className='done-banner';banner.textContent='Lesson complete. +5 XP';}else if(S.done[l.id]){banner.className='done-banner';banner.textContent='Lesson complete.';}save();}
  if(S.done[l.id]){banner.className='done-banner';banner.textContent='Completed earlier. You can retry the quiz any time.';}
  box.append(banner);return box;}
function phaseQuizEl(p,i){S.pq=S.pq||{};const box=h('div',{class:'quiz'});const qs=p.quiz;const ok=new Array(qs.length).fill(false);const first=new Array(qs.length).fill(true);const res=h('div');
  box.append(h('h3',{},'End-of-line quiz'),h('p',{class:'note'},`${qs.length} questions that mix the whole line. Your score counts answers right on the first try.`+(S.pq[i]!=null?` Best so far: ${S.pq[i]} of ${qs.length}.`:'')));
  qs.forEach((Q,qi)=>{const opts=h('div',{class:'opts'});const why=h('div',{class:'why'});
    Q.o.forEach((t,oi)=>{const b=h('button',{class:'opt',type:'button',onclick:()=>{if(ok[qi])return;if(oi===Q.a){b.classList.add('right');ok[qi]=true;why.textContent='Right. '+Q.why;done();}else{b.classList.add('wrong');first[qi]=false;why.textContent='Not quite. Try another option.';}}},t);opts.append(b);});
    box.append(h('div',{class:'q'},h('b',{},`${qi+1}. ${Q.q}`),opts,why));});
  function done(){if(!ok.every(Boolean))return;const sc=first.filter(Boolean).length;const best=Math.max(sc,S.pq[i]||0);if((S.pq[i]==null)||sc>S.pq[i]){if(S.pq[i]==null)S.xp+=sc*5;S.pq[i]=best;save();}
    res.className='done-banner';res.textContent=`Score: ${sc} of ${qs.length} on the first try.`+(sc===qs.length?' The whole line is solid.':' Revisit the lessons behind the ones you missed.');}
  box.append(res);return box;}
function viewPrereq(){
  const items=[['Basic programming','Variables, loops, functions, and reading short code samples. The demos are in the browser, so you never need to write code to follow along.'],['How the web works','A browser asks a server for a page and gets a response back. Phase 1 builds on this.'],['Basic data structures','Hash maps, queues, arrays and trees. Hashing, caching, indexes and queues all reuse them.'],['Basic SQL','SELECT, JOIN and what a table is. Needed for the database phase.'],['Comfort with simple arithmetic','Powers of 2 and 10, and percentages. The interview phases use quick estimates, nothing harder.']];
  shell(h('div',{class:'panel'},h('div',{class:'crumbs'},h('a',{href:'#/'},'Home'),' / Prerequisites'),h('h2',{},'Prerequisites'),h('p',{class:'lead'},'You do not need to be an expert in any of this. If one item feels shaky, spend an evening on it first and the course will go much faster.'),
    h('div',{class:'cards'},items.map(x=>h('div',{class:'card'},h('h4',{},x[0]),h('span',{class:'note'},x[1])))),
    h('h3',{},'What each phase expects'),
    h('table',{class:'t'},h('tr',{},h('th',{},'Phase'),h('th',{},'Before you start')),PHASES.map(p=>h('tr',{},h('th',{},h('a',{href:'#/p/'+p.i},`${p.i}. ${p.name}`)),h('td',{},(p.pre&&p.pre.length?p.pre.join('; '):'Nothing beyond the list above.'))))),
    h('p',{class:'note'},'Every lesson also shows its own prerequisite chips. A chip turns green once you have finished that lesson.')));}
function viewLibrary(){
  const secs=REPO.filter(s=>['Courses','Newsletters','Books','YouTube Channels','Must-Read Engineering Articles','Must-Read Distributed Systems Papers'].includes(s.name));
  shell(h('div',{class:'panel'},h('div',{class:'crumbs'},h('a',{href:'#/'},'Home'),' / Library'),h('h2',{},'Library'),h('p',{class:'lead'},'Everything in the source list that is not a lesson: where to keep learning, plus the papers behind today\'s systems.'),
    ...secs.map(s=>h('div',{style:'display:flex;flex-direction:column;gap:10px'},h('h3',{},s.name),h('div',{class:'lib'},s.items.map(it=>h('a',{class:'item',href:it.u,target:'_blank',rel:'noopener noreferrer'},h('b',{},it.t))))))
    ));
}
function viewAbout(){
  const ta=h('textarea',{rows:6,style:'width:100%;font:13px var(--f-mono);border-radius:10px;border:1px solid var(--line);padding:10px;background:var(--surface);color:var(--ink)','aria-label':'Progress JSON'});const msg=h('div',{class:'note'});
  shell(h('div',{class:'panel'},h('div',{class:'crumbs'},h('a',{href:'#/'},'Home'),' / Progress'),h('h2',{},'Your progress'),h('p',{class:'lead'},'Progress is saved in this browser only. Download it as JSON to move devices or back it up, and load it back here.'),
    h('div',{class:'row'},btn('Download progress',()=>{const b=new Blob([JSON.stringify({version:1,xp:S.xp,streak:S.streak,done:S.done},null,1)],{type:'application/json'});const a=h('a',{href:URL.createObjectURL(b),download:'system-design-progress.json'});document.body.append(a);a.click();a.remove();}),btn('Load from box below',()=>{try{const j=JSON.parse(ta.value);S.done=j.done||{};S.xp=j.xp||0;S.streak=j.streak||0;save();msg.textContent='Loaded.';}catch(e){msg.textContent='That is not valid progress JSON.';}},'ghost'),btn('Reset everything',()=>{if(confirm('Erase all progress?')){S.done={};S.xp=0;S.streak=0;S.last='';save();route();}},'danger')),ta,msg,
    h('p',{class:'note'},'Numbers inside the demos are made up to teach an idea. They are not benchmarks.')));}
function route(){const hash=location.hash||'#/';const m=hash.split('/');try{
  if(m[1]==='p')viewPhase(+m[2]);else if(m[1]==='l')viewLesson(m[2]);else if(m[1]==='library')viewLibrary();else if(m[1]==='prereq')viewPrereq();else if(m[1]==='about')viewAbout();else viewHome();}
  catch(e){root.textContent='Something went wrong: '+e.message;console.error(e);}}
