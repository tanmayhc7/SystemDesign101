/* ===== Phase 5 demos: asynchronous communication ===== */

/* 1. Pub/Sub vs a chain of synchronous calls */
DEMOS.pubsub=function(host){
  const subs=[['Email service',120],['Analytics',80],['Search indexer',200],['Fraud check',60]];
  const down=new Set();let mode=0;const rd=readout();const log=logbox();const verdict=h('div',{class:'takeaway'});const backlog={};
  const tb=tabs(['Direct synchronous calls','Publish to a topic'],i=>{mode=i;log.clear();verdict.textContent='';rd.set('');},0);
  const chips=h('div',{class:'chips'});
  subs.forEach(([n])=>{const c=chip(n+': up',()=>{if(down.has(n)){down.delete(n);c.textContent=n+': up';c.classList.remove('bad');if(mode===1&&backlog[n]){log.say(`${n} is back and works through ${backlog[n]} queued event${backlog[n]>1?'s':''}.`,'note');backlog[n]=0;}}else{down.add(n);c.textContent=n+': DOWN';c.classList.add('bad');}},false);chips.append(c);});
  function place(){log.clear();const base=30;
    if(mode===0){let t=base;log.say(`Order service saves the order (${base} ms).`);
      for(const [n,ms] of subs){if(down.has(n)){log.say(`Calls ${n}: no answer, times out after 1000 ms.`,'bad');t+=1000;rd.set(`Customer waited ${t} ms and got an error.`);verdict.textContent='One slow or broken downstream service fails the whole request, and the caller has to know about every consumer. Adding a fifth consumer means changing the order service.';return;}
        t+=ms;log.say(`Calls ${n} and waits (${ms} ms).`);}
      rd.set(`Customer waited ${t} ms. Order service made ${subs.length} calls.`);verdict.textContent='It works, but the latency is the sum of every call, and the order service is coupled to all of them.';}
    else{const t=base+5;log.say(`Order service saves the order and publishes OrderPlaced to the topic (${t} ms). Done.`);
      subs.forEach(([n,ms])=>{if(down.has(n)){backlog[n]=(backlog[n]||0)+1;log.say(`${n} is down: the event waits in its subscription (${backlog[n]} queued).`,'bad');}else log.say(`${n} receives OrderPlaced and works independently (${ms} ms, nobody waits).`);});
      rd.set(`Customer waited ${t} ms. Order service knows about 1 topic, not ${subs.length} services.`);
      verdict.textContent=down.size?'The order still succeeded. The broken subscriber catches up when it returns, because the broker keeps its messages.':'Publishers and subscribers are decoupled in time and in knowledge. A new subscriber can be added without touching the publisher.';}}
  host.append(h('div',{class:'note'},'An order is placed and four services must react. Compare calling them one by one with publishing one event. Click a service to take it down.'),tb,chips,h('div',{class:'row'},btn('Place an order',place)),rd,log,verdict);
};

/* 2. Message queue: load leveling, competing consumers, poison messages */
DEMOS.mqueue=function(host,o,ctx){
  let rate=300,cons=3,per=120,burst=false,poison=false,dlqOn=true;
  let depth=0,done=0,t=0,dlq=0,stuck=0,attempts=0;
  const dm=meter(0);const rd=readout();const verdict=h('div',{class:'takeaway'});
  const sr=ctl('Messages arriving per second',50,800,rate,50,v=>{rate=v;},v=>v);
  const sc=ctl('Consumers (competing for the same queue)',1,10,cons,1,v=>{cons=v;},v=>v);
  const bc=chip('Traffic spike: 4x for 10 seconds',()=>{burst=!burst;bc.classList.toggle('on',burst);t=0;},false);
  const pc=chip('Inject a poison message',()=>{poison=true;attempts=0;},false);
  const dc=chip('Dead letter queue after 3 failed attempts',()=>{dlqOn=!dlqOn;dc.classList.toggle('on',dlqOn);},true);
  function tick(){t++;const inRate=burst&&(t%30)<10?rate*4:rate;
    let workers=cons;
    if(poison){attempts++;if(dlqOn&&attempts>=3){poison=false;dlq++;stuck=0;}else{workers=Math.max(0,cons-1);stuck=1;}}
    depth+=inRate;const served=Math.min(depth,workers*per);depth-=served;done+=served;
    const cap=workers*per;const wait=cap?depth/cap:Infinity;
    dm.set(Math.min(100,depth/20000*100),depth>15000?'bad':depth>3000?'warn':'go');
    rd.set(`Second ${t}: ${inRate}/s arriving, capacity ${cap}/s (${workers} of ${cons} consumers working)\nQueue depth: ${Math.round(depth).toLocaleString()}   Wait for a new message: ${isFinite(wait)?wait.toFixed(1)+' s':'forever'}\nProcessed: ${done.toLocaleString()}   Dead letter queue: ${dlq}`);
    verdict.textContent=stuck&&!dlqOn?'A poison message fails every time. Without a dead letter queue it is retried forever and ties up a consumer.':inRate>cap?'Arrivals exceed capacity: the queue grows. That is fine for a short spike (the queue absorbs it), but if it lasts, add consumers or the backlog keeps growing.':depth>0?'Capacity is above the arrival rate, so the backlog is draining.':'Steady state: consumers keep up and the queue stays empty.';}
  function reset(){depth=0;done=0;t=0;dlq=0;stuck=0;poison=false;}
  host.append(h('div',{class:'note'},'Each consumer handles 120 messages per second. One simulated second passes every 0.4 s. Turn on a spike, change the consumer count, or inject a message that always fails.'),sr.el,sc.el,h('div',{class:'row'},bc,pc,dc,btn('Reset',reset,'ghost')),h('b',{},'Queue depth'),dm,rd,verdict);
  ctx.every(400,tick);tick();
};

/* 3. Brokers: queue vs log, and delivery guarantees */
DEMOS.brokers=function(host){
  const view=h('div');const t=tabs(['Queue vs log','Delivery guarantees'],i=>{view.textContent='';(i?deliv:ql)();},0);host.append(t,view);
  function ql(){let kind=0;let msgs=[],next=1,offA=0,offB=0;const rd=readout();const log=logbox();const verdict=h('div',{class:'takeaway'});
    const kt=tabs(['Queue broker (RabbitMQ, SQS style)','Log broker (Kafka style)'],i=>{kind=i;msgs=[];next=1;offA=0;offB=0;log.clear();show();},0);
    const show=()=>{rd.set(kind===0?`Queue holds: ${msgs.map(m=>'m'+m).join(' ')||'(empty)'}`:`Log holds: ${msgs.map(m=>'m'+m).join(' ')||'(empty)'}\nGroup A offset: ${offA}   Group B offset: ${offB}`);
      verdict.textContent=kind===0?'A queue hands each message to one consumer and deletes it on acknowledgement. Two readers split the work; nobody can read it again.':'A log keeps every message for a retention period. Each consumer group tracks its own offset, so groups read independently and can rewind to replay.';};
    const pub=()=>{for(let i=0;i<3;i++)msgs.push(next++);log.say('Producer sends 3 messages.');show();};
    const read=g=>{if(kind===0){if(!msgs.length){log.say(`${g}: nothing to read.`);return;}const m=msgs.shift();log.say(`${g} takes m${m}; it is acknowledged and deleted.`);}
      else{const off=g==='Group A'?offA:offB;if(off>=msgs.length){log.say(`${g}: up to date.`);return;}log.say(`${g} reads m${msgs[off]} at offset ${off}.`);if(g==='Group A')offA++;else offB++;}show();};
    const replay=()=>{if(kind===0){log.say('A queue cannot replay: acknowledged messages are gone.','bad');return;}offB=0;log.say('Group B resets its offset to 0 and will read everything again (for example, to rebuild a search index).','note');show();};
    view.append(h('div',{class:'note'},'Two consumer groups read from the same broker. Publish, read from each group, then try to replay.'),kt,h('div',{class:'row'},btn('Publish 3 messages',pub),btn('Group A reads one',()=>read('Group A')),btn('Group B reads one',()=>read('Group B')),btn('Replay Group B from the start',replay,'ghost')),rd,log,verdict);show();}
  function deliv(){let ackFirst=false;const log=logbox();const rd=readout();const verdict=h('div',{class:'takeaway'});let charged=0;
    const at=tabs(['Acknowledge after processing','Acknowledge before processing'],i=>{ackFirst=i===1;charged=0;log.clear();verdict.textContent='';rd.set('');},0);
    function run(crash){log.clear();charged=0;
      if(ackFirst){log.say('Consumer receives "charge order 42" and acknowledges it. The broker deletes it.');
        if(crash){log.say('*** Consumer crashes before charging. ***','bad');log.say('The message is gone. The customer is never charged.','bad');verdict.textContent='At-most-once: no duplicates, but a crash loses messages.';}
        else{charged=1;log.say('Consumer charges the card.');verdict.textContent='Fine when nothing fails.';}}
      else{log.say('Consumer receives "charge order 42" and charges the card.');charged=1;
        if(crash){log.say('*** Consumer crashes before acknowledging. ***','bad');log.say('The broker redelivers the message to another consumer, which charges again.','bad');charged=2;verdict.textContent='At-least-once: nothing is lost, but duplicates happen. Make the handler idempotent (store processed message ids, or use the order id as an idempotency key) and you get effectively-once results.';}
        else{log.say('Consumer acknowledges. Broker deletes the message.');verdict.textContent='Fine when nothing fails.';}}
      rd.set(`Times the card was charged: ${charged}`);}
    view.append(h('div',{class:'note'},'When should a consumer tell the broker it is done? Run each order with and without a crash.'),at,h('div',{class:'row'},btn('Process normally',()=>run(false)),btn('Process with a crash',()=>run(true),'ghost')),rd,log,verdict);}
  ql();
};

/* 4. CDC and the dual-write problem */
DEMOS.cdc=function(host,o,ctx){
  let mode=0,fail=true,gen=0;let db=[],outbox=[],events=[],index=[],n=0;const log=logbox();const rd=readout();const verdict=h('div',{class:'takeaway'});
  const tb=tabs(['Dual write from the app','Transactional outbox','Change data capture'],i=>{mode=i;reset();},0);
  const fc=chip('Crash right after the database commit',()=>{fail=!fail;fc.classList.toggle('on',fail);},true);
  const show=()=>rd.set(`Database orders: ${db.join(', ')||'none'}${mode===1?'\nOutbox rows waiting: '+(outbox.join(', ')||'none'):''}\nEvents on the broker: ${events.join(', ')||'none'}\nSearch index: ${index.join(', ')||'none'}`);
  function reset(){gen++;db=[];outbox=[];events=[];index=[];n=0;log.clear();verdict.textContent='';show();}
  function deliver(o2){events.push(o2);log.say(`Event OrderCreated(${o2}) published.`);const g=gen;ctx.after(300,()=>{if(g!==gen)return;if(!index.includes(o2))index.push(o2);log.say(`Search indexer consumed it: ${o2} is searchable.`,'note');show();});}
  function save(){n++;const id='#'+n;const g=gen;
    if(mode===0){db.push(id);log.say(`App commits order ${id} to the database.`);
      if(fail){log.say('*** App crashes before publishing the event. ***','bad');verdict.textContent=`Order ${id} exists but no event was ever sent. The search index will never show it. Publishing first and then writing has the opposite bug: an event for an order that does not exist.`;}
      else{deliver(id);verdict.textContent='Works when nothing fails between the two writes. Two systems, two writes, no shared transaction.';}}
    else if(mode===1){db.push(id);outbox.push(id);log.say(`One transaction: insert order ${id} AND an outbox row. Both commit or neither does.`);
      if(fail)log.say('*** App crashes right after the commit. ***','bad');
      log.say('A relay process polls the outbox table.','note');
      ctx.after(500,()=>{if(g!==gen)return;outbox=outbox.filter(x=>x!==id);deliver(id);show();});
      verdict.textContent='The crash does not matter: the outbox row is in the database, so the relay publishes it later. The relay may publish twice if it crashes after sending, so consumers must be idempotent.';}
    else{db.push(id);log.say(`App commits order ${id}. It does not publish anything itself.`);
      if(fail)log.say('*** App crashes right after the commit. ***','bad');
      log.say('A CDC connector (for example Debezium) is tailing the database write-ahead log.','note');
      ctx.after(500,()=>{if(g!==gen)return;log.say(`Connector sees the insert of ${id} in the log.`);deliver(id);show();});
      verdict.textContent='The database log is the single source of truth: whatever committed will be streamed, in commit order, with no change to application code. Events describe row changes, so you may need to shape them into business events.';}
    show();}
  host.append(h('div',{class:'note'},'An order must be saved and also reach a search index through an event. Try each approach with a crash between the two steps.'),tb,h('div',{class:'row'},fc,btn('Save an order',save),btn('Reset',reset,'ghost')),rd,log,verdict);
  show();
};
