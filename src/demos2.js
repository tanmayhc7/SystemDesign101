/* ===== Phase 2 demos: APIs ===== */

/* 1. APIs: HTTP methods, and what happens when a request is sent twice */
DEMOS.apis=function(host){
  const props={
    GET:{path:'/orders',safe:'yes',idem:'yes',cache:'yes',use:'Read data. Must never change anything.'},
    POST:{path:'/orders',safe:'no',idem:'no',cache:'rarely',use:'Create something or trigger an action. Each call may do it again.'},
    PUT:{path:'/orders/1  {qty: 5}',safe:'no',idem:'yes',cache:'no',use:'Replace a resource with exactly this state.'},
    PATCH:{path:'/orders/1  {qty: +1}',safe:'no',idem:'depends',cache:'no',use:'Change part of a resource. Safe to repeat only if it sets a value, not if it adds to one.'},
    DELETE:{path:'/orders/1',safe:'no',idem:'yes',cache:'no',use:'Remove a resource. The second call finds nothing, but the end state is the same.'}};
  const names=Object.keys(props);let cur='POST',twice=true;
  let orders,nextId;const reset=()=>{orders={1:{qty:1}};nextId=2;};reset();
  const stateEl=readout();const logEl=logbox();const verdict=h('div',{class:'takeaway'});const info=h('div',{class:'note'});
  const snap=()=>JSON.stringify(orders);
  const show=()=>{const ks=Object.keys(orders);stateEl.set(ks.length?'Server orders: '+ks.map(k=>`#${k} (qty ${orders[k].qty})`).join(', '):'Server orders: none');};
  function once(m){
    if(m==='GET')return {s:200,t:`200 OK, ${Object.keys(orders).length} order(s)`};
    if(m==='POST'){const id=nextId++;orders[id]={qty:1};return {s:201,t:`201 Created order #${id}`};}
    if(m==='PUT'){if(!orders[1]){orders[1]={qty:5};return {s:201,t:'201 Created order #1 (qty 5)'};}orders[1].qty=5;return {s:200,t:'200 OK order #1 now has qty 5'};}
    if(m==='PATCH'){if(!orders[1])return {s:404,t:'404 Not Found'};orders[1].qty+=1;return {s:200,t:`200 OK order #1 qty is now ${orders[1].qty}`};}
    if(m==='DELETE'){if(!orders[1])return {s:404,t:'404 Not Found (already gone)'};delete orders[1];return {s:204,t:'204 No Content'};}
  }
  function send(){
    const before=snap();const r1=once(cur);const after1=snap();logEl.say(`${cur} ${props[cur].path} -> ${r1.t}`);
    if(twice){const r2=once(cur);const after2=snap();logEl.say(`  retry: ${cur} ${props[cur].path} -> ${r2.t}`,'note');
      const same=after1===after2;verdict.textContent=same?`After the retry the server state is the same as after the first call. ${cur} is safe to retry.`:`The retry changed the server state again. ${cur} is not safe to blindly retry: a timeout followed by a retry can create or apply the change twice.`;}
    else verdict.textContent=`Sent once. Turn on "Send it twice" to see what a retry does.`;
    show();}
  const tb=tabs(names,(i,n)=>{cur=n;const p=props[n];info.textContent=`${n}: ${p.use} Safe: ${p.safe}. Idempotent: ${p.idem}. Cacheable: ${p.cache}.`;},names.indexOf(cur));
  const twiceChip=chip('Send it twice (simulate a retry)',()=>{twice=!twice;twiceChip.classList.toggle('on',twice);},true);
  tb.select(names.indexOf(cur));
  host.append(h('div',{class:'note'},'Pick an HTTP method and send it. Idempotent means calling it many times leaves the same end state as calling it once.'),tb,info,h('div',{class:'row'},twiceChip,btn('Send request',send),btn('Reset server',()=>{reset();logEl.clear();verdict.textContent='';show();},'ghost')),stateEl,logEl,verdict);
  show();
};

/* 2. API gateway: round trips with and without a gateway */
DEMOS.gateway=function(host){
  const modes=['Client calls each service','Gateway, routing only','Gateway with aggregation'];let mode=2,rtt=120;
  const svcs=['Profile','Orders','Recommendations','Inventory'];
  const W=720,H=250;const svg=svgBox(W,H);const rd=readout();const bars=h('div');
  const tb=tabs(modes,i=>{mode=i;draw();},2);
  const sl=ctl('Phone-to-server round trip time (ms)',20,400,rtt,10,v=>{rtt=v;draw();},v=>v+' ms');
  function calc(m){
    // Home screen needs Profile first (for the user id), then Orders, Recommendations, Inventory in parallel.
    // New TLS 1.3 connection costs 2 RTT (TCP + TLS). Backend hops inside the data center cost about 2 ms.
    if(m===0)return {setup:2,waves:2,conns:4,calls:4,total:(2+1)*rtt+(2+1)*rtt,note:'4 new connections, 2 dependent waves'};
    if(m===1)return {setup:2,waves:2,conns:1,calls:4,total:2*rtt+1*rtt+1*rtt+4,note:'1 connection, still 2 dependent waves'};
    return {setup:2,waves:1,conns:1,calls:1,total:2*rtt+1*rtt+4,note:'1 connection, 1 request, the gateway does the waves'};
  }
  function draw(){svg.textContent='';const c=calc(mode);
    const cx=70,gx=330,sx=620;const ys=svcs.map((_,i)=>40+i*52);
    const box=(x,y,w,t,col)=>{svg.append(sv('rect',{x:x-w/2,y:y-18,width:w,height:36,rx:8,fill:col||'var(--accent-soft)',stroke:'var(--line)'}),sv('text',{x,y:y+5,'text-anchor':'middle','font-size':13,'font-weight':700,fill:'var(--ink)'},t));};
    box(cx,H/2,110,'Phone app','var(--surface)');
    svcs.forEach((s,i)=>box(sx,ys[i],140,s));
    if(mode===0){ys.forEach((y,i)=>svg.append(sv('path',{d:`M${cx+55} ${H/2} L${sx-70} ${y}`,stroke:'var(--bad)','stroke-width':2.2,fill:'none'})));
      svg.append(sv('text',{x:345,y:H-8,'text-anchor':'middle','font-size':12,fill:'var(--ink2)'},'Four public endpoints, four connections, four sets of auth checks'));}
    else{box(gx,H/2,130,'API gateway','var(--accent-soft)');
      svg.append(sv('path',{d:`M${cx+55} ${H/2} L${gx-65} ${H/2}`,stroke:'var(--accent)','stroke-width':mode===2?3:2.2,fill:'none'}));
      ys.forEach(y=>svg.append(sv('path',{d:`M${gx+65} ${H/2} L${sx-70} ${y}`,stroke:'var(--go)','stroke-width':1.6,'stroke-dasharray':'5 4',fill:'none'})));
      svg.append(sv('text',{x:(cx+gx)/2,y:H/2-26,'text-anchor':'middle','font-size':12,'font-weight':700,fill:'var(--ink)'},mode===2?'1 request':'4 requests'));
      svg.append(sv('text',{x:345,y:H-8,'text-anchor':'middle','font-size':12,fill:'var(--ink2)'},mode===2?'Gateway authenticates once, fans out in parallel inside the data center, merges the reply':'Gateway authenticates and routes, but the phone still makes every call itself'));}
    rd.set(`Time before the screen can render: about ${c.total} ms\n${c.note}.\nRequests the phone sends: ${c.calls}. New connections: ${c.conns}.`);
    bars.textContent='';modes.forEach((m,i)=>{const r=calc(i);const mt=meter(0);mt.set(r.total/(calc(0).total)*100,i===mode?'go':'');bars.append(h('div',{class:'row',style:'margin:6px 0'},h('span',{class:'note',style:'min-width:210px'},m),h('div',{style:'flex:1;min-width:160px'},mt),h('span',{class:'note'},r.total+' ms')));});
  }
  host.append(h('div',{class:'note'},'A phone home screen needs the profile first, then orders, recommendations and inventory. Switch the design and drag the round trip time.'),tb,svg,sl.el,rd,bars,h('div',{class:'note'},'Model: a new TLS 1.3 connection costs 2 round trips, backend calls inside the data center cost about 2 ms, requests to different hosts run in parallel. A gateway also gives you one place for auth, rate limits, logging and TLS.'));
  draw();
};

/* 3. REST vs GraphQL: bytes and round trips for one screen */
DEMOS.restgql=function(host){
  const F=[
    {id:'name',label:'Name',res:'user',b:24,gql:'name'},
    {id:'avatar',label:'Avatar URL',res:'user',b:70,gql:'avatarUrl'},
    {id:'bio',label:'Bio',res:'user',b:160,gql:'bio'},
    {id:'titles',label:'Last 3 post titles',res:'posts',b:150,gql:'posts(first: 3) { title }'},
    {id:'likers',label:'Names of people who liked the latest post',res:'likes',b:90,gql:'latest: posts(first: 1) { likedBy(first: 3) { name } }'}];
  const REST={user:{url:'GET /users/42',full:1400},posts:{url:'GET /users/42/posts',full:8200,dep:'user'},likes:{url:'GET /posts/9001/likes',full:10500,dep:'posts'}};
  const on=new Set(['name','avatar','titles']);const out=h('div');const q=h('pre',{class:'readout',style:'margin:0;white-space:pre'});
  const chips=h('div',{class:'chips'});
  F.forEach(f=>{const c=chip(f.label,()=>{on.has(f.id)?on.delete(f.id):on.add(f.id);c.classList.toggle('on',on.has(f.id));draw();},on.has(f.id));chips.append(c);});
  function draw(){out.textContent='';const sel=F.filter(f=>on.has(f.id));
    if(!sel.length){out.append(h('div',{class:'note'},'Pick at least one field the screen needs.'));q.textContent='';return;}
    const need=[...new Set(sel.map(f=>f.res))];
    // likers also need posts to know the latest post id
    if(need.includes('likes')&&!need.includes('posts'))need.push('posts');
    if(need.includes('posts')&&!need.includes('user'))need.push('user');
    const order=['user','posts','likes'].filter(x=>need.includes(x));
    const restBytes=order.reduce((a,k)=>a+REST[k].full,0);const useful=sel.reduce((a,f)=>a+f.b,0);
    const levels=order.length;
    const gqlBytes=useful+60;
    const lines=['query ScreenData {','  user(id: 42) {',...sel.map(f=>'    '+f.gql),'  }','}'];q.textContent=lines.join('\n');
    const col=(title,rows,cls)=>h('div',{class:'card '+cls},h('h4',{},title),...rows.map(r=>h('div',{class:'note'},r)));
    out.append(h('div',{class:'cards'},
      col('REST',[...order.map((k,i)=>`${i+1}. ${REST[k].url} (${(REST[k].full/1000).toFixed(1)} KB)`),`Round trips (dependent calls): ${levels}`,`Data downloaded: ${(restBytes/1000).toFixed(1)} KB`,`Actually used: ${(useful/1000).toFixed(2)} KB (${Math.max(1,Math.round(useful/restBytes*100))}%)`],''),
      col('GraphQL',['1. POST /graphql with the query shown below','Round trips: 1',`Data downloaded: about ${(gqlBytes/1000).toFixed(2)} KB`,'Server resolves nested fields; watch for N+1 queries behind it.'],'ok')));
    out.append(h('h4',{style:'margin-top:14px'},'The GraphQL query for this screen'),q);
  }
  host.append(h('div',{class:'note'},'Choose what one mobile screen needs to show. See how many requests and bytes each style needs.'),chips,out,h('div',{class:'note'},'Numbers are illustrative: a typical REST user object, post list and likes list returned in full. REST can close the gap with sparse fieldsets, includes or a purpose-built endpoint. GraphQL pays back in flexibility and costs you easy HTTP caching.'));
  draw();
};

/* 4. Real time: polling vs long polling vs WebSocket */
DEMOS.realtime=function(host){
  let epm=6,interval=5,clients=100000;const T=120;
  const W=720,H=190;const svg=svgBox(W,H);const tableBox=h('div',{style:'overflow-x:auto'});
  const s1=ctl('Events per minute',1,60,epm,1,v=>{epm=v;draw();},v=>v+' /min');
  const s2=ctl('Polling interval',1,30,interval,1,v=>{interval=v;draw();},v=>v+' s');
  const s3=ctl('Connected clients',1,6,5,1,v=>{clients=Math.pow(10,v);draw();},v=>Math.pow(10,v).toLocaleString());
  function events(){const r=mkRand(7);const ev=[];let t=0;const rate=epm/60;while(true){t+=-Math.log(1-r())/rate;if(t>=T)break;ev.push(t);}return ev;}
  function draw(){svg.textContent='';const ev=events();const x=t=>40+t/T*(W-60);
    const rows=['Short polling','Long polling','WebSocket / SSE'];const sim=[];
    // short polling
    {const reqs=[];for(let t=interval;t<=T;t+=interval)reqs.push(t);let delay=0,n=0;ev.forEach(e=>{const nx=reqs.find(r=>r>=e);if(nx!==undefined){delay+=nx-e;n++;}});
      const empty=reqs.filter((r,i)=>!ev.some(e=>e<=r&&e>(i?reqs[i-1]:0))).length;sim.push({reqs,empty:empty,delay:n?delay/n:0,held:0});}
    // long polling, 25 s hold
    {const reqs=[];let t=0,delay=0,n=0,empty=0;let k=0;while(t<T){reqs.push(t);const e=ev.find(v=>v>t);if(e===undefined||e-t>25){empty++;t+=25;}else{delay+=0.05;n++;t=e+0.05;}if(reqs.length>5000)break;}
      sim.push({reqs,empty,delay:n?delay/n:0,held:1});}
    // websocket
    sim.push({reqs:[0],empty:0,delay:0.03,held:1});
    rows.forEach((name,i)=>{const y=34+i*52;svg.append(sv('text',{x:4,y:y-14,'font-size':12,'font-weight':700,fill:'var(--ink)'},name),sv('line',{x1:40,x2:W-20,y1:y+10,y2:y+10,stroke:'var(--line)','stroke-width':2}));
      sim[i].reqs.forEach(t=>svg.append(sv('line',{x1:x(t),x2:x(t),y1:y+3,y2:y+17,stroke:i===2?'var(--accent)':'var(--ink2)','stroke-width':i===2?4:1.4})));
      ev.forEach(e=>svg.append(sv('circle',{cx:x(e),cy:y+10,r:4.2,fill:'var(--go)',stroke:'var(--surface)','stroke-width':1.5})));});
    svg.append(sv('text',{x:W-20,y:H-6,'text-anchor':'end','font-size':11.5,fill:'var(--ink2)'},'Green dots: events on the server. Grey ticks: requests. Thick tick: one connection kept open. Timeline: 120 seconds.'));
    tableBox.textContent='';
    const rps=i=>(sim[i].reqs.length/T*clients);
    tableBox.append(h('table',{class:'t'},h('tr',{},h('th',{},''),rows.map(r=>h('th',{},r))),
      h('tr',{},h('th',{},'Requests in 120 s (one client)'),sim.map((s,i)=>h('td',{},i===2?'1 upgrade, then messages':String(s.reqs.length)))),
      h('tr',{},h('th',{},'Empty responses'),sim.map(s=>h('td',{},String(s.empty)))),
      h('tr',{},h('th',{},'Average delay for an event'),sim.map(s=>h('td',{},s.delay<1?`${Math.round(s.delay*1000)} ms`:`${s.delay.toFixed(1)} s`))),
      h('tr',{},h('th',{},'New requests per second at '+clients.toLocaleString()+' clients'),sim.map((s,i)=>h('td',{},i===2?'about 0 (connections stay open)':Math.round(rps(i)).toLocaleString()))),
      h('tr',{},h('th',{},'Open connections the server holds'),sim.map((s,i)=>h('td',{},i===0?'~0 between polls':clients.toLocaleString())))));
  }
  host.append(h('div',{class:'note'},'Same events, three ways to deliver them to a browser. Move the sliders to see the cost.'),s1.el,s2.el,s3.el,svg,tableBox,h('div',{class:'note'},'Real-time is a trade: polling is simple and cheap to hold open but wasteful and slow. Long polling and WebSockets are fast but each client costs the server an open connection, which changes how you load balance and scale.'));
  draw();
};

/* 5. Idempotency: a payment retried after a lost reply */
DEMOS.idem=function(host){
  let useKey=true,lose=true,token=1;let charges,store,inflight;
  const reset=()=>{charges=[];store={};inflight={};};reset();
  const bal=meter(0);const rd=readout();const logEl=logbox();const verdict=h('div',{class:'takeaway'});
  const keyChip=chip('Client sends an Idempotency-Key',()=>{useKey=!useKey;keyChip.classList.toggle('on',useKey);},true);
  const loseChip=chip('The reply gets lost on the way back',()=>{lose=!lose;loseChip.classList.toggle('on',lose);},true);
  const render=()=>{const total=charges.length*50;bal.set(100-Math.min(100,total/200*100),charges.length>1?'bad':'go');
    rd.set(`Order #${token}. Customer was charged: $${total}  (${charges.length} charge${charges.length===1?'':'s'})`);
    verdict.textContent=charges.length>1?'Double charge. The client could not tell if the first attempt worked, so it retried, and the server had no way to know it was the same payment.':charges.length===1?'Exactly one charge, even if you retry. The server remembered the key and replayed its first answer.':'No payment yet.';};
  function server(key){
    if(useKey&&store[key]){logEl.say(`  server: key ${key} already processed, replaying the saved answer (no new charge)`,'note');return {ok:true,replay:true};}
    charges.push({order:token});if(useKey)store[key]=true;logEl.say(`  server: charged $50 for order #${token}`);return {ok:true};}
  function pay(){const key='order-'+token+'-key';logEl.say(`Client sends POST /charges ${useKey?`with Idempotency-Key: ${key}`:'(no key)'}`);
    const r=server(key);
    if(lose&&!pay.used){pay.used=true;logEl.say('  network: the reply never reached the client (timeout). Client does not know if it worked.','bad');}
    else logEl.say('  client: got 200 OK',r.replay?'note':'');
    lose=false;loseChip.classList.remove('on');render();}
  function dbl(){const key='order-'+token+'-key';logEl.say('Client double-clicks Pay: two identical requests at the same moment');
    if(useKey){if(inflight[key]){logEl.say('  server: second request sees the key is in progress, waits or returns 409 Conflict','note');}
      else{server(key);logEl.say('  server: second request sees the key is done, replays the answer','note');}}
    else{server(key);server(key);}
    render();}
  const newOrder=btn('New order',()=>{token++;pay.used=false;lose=true;loseChip.classList.add('on');logEl.say(`--- new order #${token} ---`);render();},'ghost');
  host.append(h('div',{class:'note'},'Press Pay. With the reply lost, the client times out, and the only safe move is to press Pay again. What does the customer get charged?'),
    h('div',{class:'row'},keyChip,loseChip),h('div',{class:'row'},btn('Pay $50',()=>{pay.used=!lose;pay();}),btn('Double-click Pay',dbl),newOrder,btn('Reset all',()=>{reset();token=1;pay.used=false;logEl.clear();render();},'ghost')),rd,bal,logEl,verdict);
  render();
};

/* 6. Rate limiting: three algorithms on the same traffic */
DEMOS.ratelimit=function(host){
  let L=10,pat='Steady, slightly over the limit';const T=30,WIN=10;const W=720;
  const pats={
    'Steady, slightly over the limit':()=>{const a=[];for(let t=0;t<T;t+=0.8)a.push(+t.toFixed(2));return a;},
    'Burst across a window boundary':()=>{const a=[];for(let i=0;i<L;i++)a.push(+(9.0+i*0.09).toFixed(2));for(let i=0;i<L;i++)a.push(+(10.0+i*0.09).toFixed(2));return a;},
    'One big spike':()=>{const a=[];for(let i=0;i<L*3;i++)a.push(+(5+i*(1/(L*3))).toFixed(2));return a;},
    'Quiet, then a burst':()=>{const a=[];for(let i=0;i<Math.ceil(L*1.5);i++)a.push(+(20+i*(1/(L*1.5))).toFixed(2));return a;}};
  const names=Object.keys(pats);
  const svg=svgBox(W,200);const tableBox=h('div',{style:'overflow-x:auto'});
  const tb=tabs(names,(i,n)=>{pat=n;draw();},0);const sl=ctl('Limit: requests per 10 seconds',3,20,L,1,v=>{L=v;draw();},v=>v);
  function run(times){
    const cnt={};const fixed=times.map(t=>{const w=Math.floor(t/WIN);cnt[w]=(cnt[w]||0)+1;return cnt[w]<=L;});
    const log=[];const slide=times.map(t=>{while(log.length&&log[0]<=t-WIN)log.shift();if(log.length<L){log.push(t);return true;}return false;});
    const cap=Math.max(2,Math.round(L/2));let tok=cap,last=0;const bucket=times.map(t=>{tok=Math.min(cap,tok+(t-last)*L/WIN);last=t;if(tok>=1){tok-=1;return true;}return false;});
    return [fixed,slide,bucket];}
  function maxIn(times,ok){let m=0;const a=times.filter((t,i)=>ok[i]);a.forEach(t=>{m=Math.max(m,a.filter(u=>u>=t&&u<t+WIN).length);});return m;}
  function draw(){svg.textContent='';const times=pats[pat]();const res=run(times);const algos=['Fixed window counter','Sliding window log','Token bucket'];const x=t=>40+t/T*(W-60);
    algos.forEach((a,i)=>{const y=40+i*56;svg.append(sv('text',{x:4,y:y-16,'font-size':12,'font-weight':700,fill:'var(--ink)'},a),sv('line',{x1:40,x2:W-20,y1:y+8,y2:y+8,stroke:'var(--line)','stroke-width':2}));
      if(i===0)for(let b=0;b<=T;b+=WIN)svg.append(sv('line',{x1:x(b),x2:x(b),y1:y-8,y2:y+24,stroke:'var(--ink2)','stroke-dasharray':'3 3'}));
      times.forEach((t,k)=>svg.append(sv('circle',{cx:x(t),cy:y+8+(res[i][k]?-6:6),r:3.6,fill:res[i][k]?'var(--go)':'var(--bad)'})));});
    svg.append(sv('text',{x:W-20,y:194,'text-anchor':'end','font-size':11.5,fill:'var(--ink2)'},'Green above the line: allowed. Red below: rejected (429). Dashed lines: fixed window boundaries. 30 seconds.'));
    tableBox.textContent='';tableBox.append(h('table',{class:'t'},h('tr',{},h('th',{},''),h('th',{},'Allowed'),h('th',{},'Rejected'),h('th',{},`Most allowed in any 10 s span (limit ${L})`)),
      ...algos.map((a,i)=>{const al=res[i].filter(Boolean).length;const mx=maxIn(times,res[i]);return h('tr',{},h('th',{},a),h('td',{},String(al)),h('td',{},String(times.length-al)),h('td',{},mx>L?`${mx}  (above ${L})`:String(mx)));})));
  }
  host.append(h('div',{class:'note'},'Same traffic, three algorithms. Pick a traffic pattern and change the limit.'),tb,sl.el,svg,tableBox,h('div',{class:'note'},'Look at the boundary burst: the fixed window lets almost twice the limit through in a short span. Token bucket (here holding half the limit) lets a bounded burst through, then holds the long-run rate of the limit per 10 seconds, which is why its 10 s count can sit a little above the limit. The sliding log is exact but must remember every timestamp.'));
  draw();
};
