/* ===== Phase 1 demos: networking ===== */

/* 1. OSI: layer explorer + encapsulation walk-through */
DEMOS.osi=function(host){
  const L=[
    {n:7,name:'Application',unit:'Data',ex:'HTTP, DNS, SMTP, gRPC',does:'The protocol your program speaks. A browser builds an HTTP request here.',dev:'Your app, API gateways, L7 load balancers'},
    {n:6,name:'Presentation',unit:'Data',ex:'TLS encryption, JSON/Protobuf encoding, compression',does:'Formats and encrypts data so both sides read it the same way. On the real internet TLS sits here.',dev:'Libraries inside your app'},
    {n:5,name:'Session',unit:'Data',ex:'TLS sessions, RPC sessions, cookies (loosely)',does:'Opens, keeps and closes a conversation. In TCP/IP this is folded into the layers above and below.',dev:'Mostly software, rarely a separate box'},
    {n:4,name:'Transport',unit:'Segment',ex:'TCP, UDP, QUIC',does:'Delivers data between two programs using port numbers. TCP adds order, retries and flow control.',dev:'OS kernel, L4 load balancers, firewalls'},
    {n:3,name:'Network',unit:'Packet',ex:'IP, ICMP, routing',does:'Addresses machines and picks a path across many networks.',dev:'Routers'},
    {n:2,name:'Data link',unit:'Frame',ex:'Ethernet, Wi-Fi, MAC addresses',does:'Moves frames between two directly connected devices on one network, and adds an error check (FCS).',dev:'Switches, network cards'},
    {n:1,name:'Physical',unit:'Bits',ex:'Copper, fibre, radio',does:'Turns bits into electrical, light or radio signals.',dev:'Cables, hubs, antennas'}];
  const stages=[
    {t:'Your app builds an HTTP request: GET /feed.',wrap:[]},
    {t:'TLS encrypts it (layers 6 and 5 in practice). Nobody on the path can read the contents now.',wrap:['TLS']},
    {t:'Layer 4 adds a TCP header: source and destination ports, sequence numbers.',wrap:['TLS','TCP']},
    {t:'Layer 3 adds an IP header: source and destination IP addresses. This is what routers read.',wrap:['TLS','TCP','IP']},
    {t:'Layer 2 adds an Ethernet header (next hop MAC address) and a trailer with an error check.',wrap:['TLS','TCP','IP','ETH']},
    {t:'Layer 1 sends it as bits: voltage, light or radio. The other end rebuilds the frame.',wrap:['TLS','TCP','IP','ETH'],bits:true},
    {t:'Each router strips the Ethernet frame, reads only the IP header, picks the next hop and wraps a new Ethernet frame. TCP and your data are never touched.',wrap:['TLS','TCP','IP','ETH2']},
    {t:'The server strips layers in reverse order: Ethernet, IP, TCP, then decrypts TLS. The app finally sees GET /feed.',wrap:[]}];
  const W=720,H=215;const svg=svgBox(W,H);const rd=readout();const side=h('div',{class:'takeaway'});
  let st=0;const sl=ctl('Step of the journey',0,stages.length-1,0,1,v=>{st=Math.max(0,Math.min(stages.length-1,Math.round(v)));draw();},v=>`${Math.round(v)+1} of ${stages.length}`);
  const colour={TLS:'var(--l8)',TCP:'var(--l6)',IP:'var(--l4)',ETH:'var(--l1)',ETH2:'var(--l2)'};
  const label={TLS:'TLS',TCP:'TCP header',IP:'IP header',ETH:'Ethernet header + trailer',ETH2:'New Ethernet header (next hop)'};
  function draw(){svg.textContent='';const S=stages[st];const n=S.wrap.length;
    const x=24,w=W-48,y=10,hh=H-52,stepX=22,stepY=21;
    for(let i=n-1;i>=0;i--){const k=S.wrap[i];const d=n-1-i;const xx=x+d*stepX,ww=w-d*stepX*2,yy=y+d*stepY,h2=hh-d*stepY*2+d*0;
      svg.append(sv('rect',{x:xx,y:yy,width:ww,height:Math.max(40,hh-d*stepY-(d*10)),rx:8,fill:'var(--surface)',stroke:colour[k],'stroke-width':3}),sv('text',{x:xx+12,y:yy+16,'font-size':12,'font-weight':700,fill:'var(--ink)'},label[k]));}
    const px=x+n*stepX+8,pw=w-n*stepX*2-16,py=y+n*stepY+(n?4:20),ph=Math.max(30,hh-n*stepY-(n*10)-(n?30:40));
    svg.append(sv('rect',{x:px,y:py,width:Math.max(80,pw),height:ph,rx:6,fill:'var(--accent-soft)',stroke:'var(--accent)'}),sv('text',{x:px+Math.max(80,pw)/2,y:py+ph/2+5,'text-anchor':'middle','font-size':13,'font-weight':700,fill:'var(--ink)'},n&&S.wrap[0]==='TLS'?'GET /feed (encrypted)':'GET /feed'));
    if(S.bits){svg.append(sv('text',{x:W/2,y:H-34,'text-anchor':'middle','font-size':13,fill:'var(--ink2)','font-family':'var(--f-mono)'},'0110 0111 1010 0001 0011 1100 1000 0101 ...'));}
    svg.append(sv('text',{x:W/2,y:H-8,'text-anchor':'middle','font-size':12,fill:'var(--ink2)'},st<5?'Sender: wrapping, top layer to bottom':st===5?'On the wire':st===6?'In the middle: a router':'Receiver: unwrapping, bottom layer to top'));
    rd.set(S.t);}
  const list=h('div',{class:'cards'});
  function show(l){side.textContent='';side.append(h('b',{},`Layer ${l.n}: ${l.name}`),h('br'),`Unit of data: ${l.unit}. Examples: ${l.ex}.`,h('br'),l.does,h('br'),h('span',{class:'note'},`Devices: ${l.dev}.`));[...list.children].forEach((c,i)=>c.classList.toggle('ok',L[i]===l));}
  L.forEach(l=>list.append(h('button',{class:'card',type:'button',style:'cursor:pointer;text-align:left',onclick:()=>show(l)},h('h4',{},`${l.n}. ${l.name}`),h('span',{class:'note'},l.unit))));
  host.append(svg,sl.el,rd,h('h4',{},'Tap a layer to see what it does'),list,side,h('div',{class:'note'},'Memory hook: Please Do Not Throw Sausage Pizza Away (Physical to Application). Real networks follow the simpler 4-layer TCP/IP model, but engineers still say "layer 4" and "layer 7" in the OSI sense.'));
  show(L[3]);draw();
};

/* 2. IP addresses and CIDR calculator */
DEMOS.ipcalc=function(host){
  const inp=h('input',{type:'text',class:'search',value:'192.168.10.37','aria-label':'IPv4 address',inputmode:'numeric',style:'max-width:260px'});
  let pre=24;const cp=ctl('Prefix length (CIDR)',0,32,pre,1,v=>{pre=v;calc();},v=>'/'+v);
  const out=h('div',{class:'readout'});const bin=h('div',{style:'font-family:var(--f-mono);font-size:.95rem;line-height:1.7;overflow-x:auto;white-space:nowrap'});
  const ex=h('div',{class:'chips'});
  [['Home Wi-Fi','192.168.1.20',24],['Cloud VPC','10.0.0.0',16],['Public DNS','8.8.8.8',32],['Loopback','127.0.0.1',8],['Subnet of 8','172.16.5.100',29]].forEach(([n,a,p])=>ex.append(chip(n,()=>{inp.value=a;cp.set(p);pre=p;calc();})));
  const toBin=n=>n.toString(2).padStart(8,'0');
  function kind(o){const [a,b]=o;if(a===10)return 'Private (RFC 1918). Not routable on the public internet.';if(a===172&&b>=16&&b<=31)return 'Private (RFC 1918).';if(a===192&&b===168)return 'Private (RFC 1918).';if(a===127)return 'Loopback: this machine only.';if(a===169&&b===254)return 'Link-local: no DHCP answer was received.';if(a===100&&b>=64&&b<=127)return 'Carrier-grade NAT range (shared address space).';if(a>=224&&a<=239)return 'Multicast.';if(a>=240)return 'Reserved.';if(a===0)return 'This network (unspecified).';return 'Public: reachable across the internet if routed.';}
  function calc(){const m=inp.value.trim().match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);bin.textContent='';
    if(!m||m.slice(1).some(x=>+x>255)){out.textContent='Enter four numbers from 0 to 255 separated by dots, for example 10.0.3.7.';return;}
    const o=m.slice(1).map(Number);const ip=((o[0]<<24)|(o[1]<<16)|(o[2]<<8)|o[3])>>>0;const mask=pre===0?0:(0xFFFFFFFF<<(32-pre))>>>0;
    const net=(ip&mask)>>>0,bc=(net|(~mask>>>0))>>>0;const dot=x=>[x>>>24,(x>>>16)&255,(x>>>8)&255,x&255].join('.');
    const total=Math.pow(2,32-pre);const usable=pre>=31?(pre===32?1:2):total-2;
    const bits=o.map(toBin).join('');
    const sp=(s,c)=>h('span',{style:`color:${c}`},s);
    const netPart=bits.slice(0,pre),hostPart=bits.slice(pre);
    const fmt=s=>s.replace(/(.{8})(?=.)/g,'$1.');
    // render with dots every 8 bits, colour split at pre
    const parts=[];let idx=0;for(let i=0;i<32;i++){if(i&&i%8===0)parts.push(h('span',{style:'color:var(--ink2)'},'.'));parts.push(h('span',{style:`color:${i<pre?'var(--accent)':'var(--ink)'};font-weight:${i<pre?800:400}`},bits[i]));}
    bin.append(h('div',{},...parts),h('div',{class:'note'},`Blue bits (first ${pre}) name the network. The rest (${32-pre}) number the machines inside it.`));
    const first=pre>=31?net:net+1,last=pre>=31?bc:bc-1;
    out.textContent=`Network address: ${dot(net)}/${pre}\nSubnet mask: ${dot(mask)}\nAddresses in block: ${total.toLocaleString()} (usable hosts ${usable.toLocaleString()})\nHost range: ${dot(first)} to ${dot(last)}${pre<31?'\nBroadcast: '+dot(bc):''}\nThis address: ${kind(o)}`;}
  inp.addEventListener('input',calc);
  host.append(h('label',{class:'note'},'IPv4 address'),inp,cp.el,h('div',{class:'note'},'Try an example:'),ex,bin,out,h('div',{class:'note'},'IPv4 has about 4.3 billion addresses, which ran out, so NAT lets many private devices share one public address, and IPv6 (128-bit) removes the shortage.'));calc();
};

/* 3. HTTP/HTTPS: round trips before the first byte */
DEMOS.http=function(host){
  let rtt=80,think=30;
  const scen=[
    {n:'HTTP/1.1, plain, new connection',seg:[['TCP',1],['Request',1]]},
    {n:'HTTPS, TLS 1.2, new connection',seg:[['TCP',1],['TLS',2],['Request',1]]},
    {n:'HTTPS, TLS 1.3, new connection',seg:[['TCP',1],['TLS',1],['Request',1]]},
    {n:'TLS 1.3 resumed with 0-RTT data',seg:[['TCP',1],['TLS',0],['Request',1]]},
    {n:'HTTP/3 (QUIC), new connection',seg:[['QUIC+TLS',1],['Request',1]]},
    {n:'HTTP/3 with 0-RTT',seg:[['QUIC+TLS',0],['Request',1]]},
    {n:'Any protocol, reused keep-alive connection',seg:[['Request',1]]}];
  const col={TCP:'var(--l6)',TLS:'var(--l8)','QUIC+TLS':'var(--l8)',Request:'var(--l3)'};
  const W=720,rowH=44,H=scen.length*rowH+62;const svg=svgBox(W,H);const rd=readout();
  const c1=ctl('Round-trip time to the server',10,300,rtt,5,v=>{rtt=v;draw();},v=>v+' ms');const c2=ctl('Server think time',0,300,think,5,v=>{think=v;draw();},v=>v+' ms');
  function draw(){svg.textContent='';const maxT=Math.max(...scen.map(s=>s.seg.reduce((a,b)=>a+b[1],0)))*rtt+think;const sx=300,sw=W-sx-90;
    scen.forEach((s,i)=>{const y=14+i*rowH;svg.append(sv('text',{x:6,y:y+17,'font-size':12.5,fill:'var(--ink)'},s.n));let x=sx;
      s.seg.forEach(([k,r])=>{const w=Math.max(0,r*rtt/maxT*sw);if(w>0)svg.append(sv('rect',{x,y,width:w,height:26,rx:3,fill:col[k]}),sv('text',{x:x+w/2,y:y+17,'text-anchor':'middle','font-size':11,'font-weight':700,fill:'var(--on-fill)'},w>46?k:''));x+=w;});
      const tw=think/maxT*sw;if(tw>0)svg.append(sv('rect',{x,y,width:tw,height:26,rx:3,fill:'var(--ink2)'}));x+=tw;
      const tot=s.seg.reduce((a,b)=>a+b[1],0)*rtt+think;svg.append(sv('text',{x:x+8,y:y+18,'font-size':12.5,'font-weight':700,fill:'var(--ink)','font-family':'var(--f-mono)'},tot+' ms'));});
    svg.append(sv('text',{x:6,y:H-24,'font-size':11.5,fill:'var(--ink2)'},'Time until the first byte of the response arrives.'),sv('text',{x:6,y:H-8,'font-size':11.5,fill:'var(--ink2)'},'Blue: TCP handshake. Purple: TLS. Green: request and response. Grey: server think time.'));
    rd.set(`At ${rtt} ms RTT a cold HTTPS connection (TLS 1.2) costs ${4*rtt} ms before any work is done. A reused connection costs ${rtt} ms. That gap is why keep-alive, CDNs near the user, TLS 1.3 and HTTP/3 exist.`);}
  host.append(svg,c1.el,c2.el,rd,h('div',{class:'note'},'Counts are idealised round trips for the connection setup and one request. Real handshakes also depend on certificates, packet loss and how many bytes the response needs.'));draw();
};

/* 4. TCP vs UDP under packet loss */
DEMOS.tcpudp=function(host){
  let loss=15,rtt=100,seed=5;const N=24,GAP=25;let stop=null,clock=0;
  const cl=ctl('Packet loss',0,50,loss,1,v=>{loss=v;run();},v=>v+'%');const cr=ctl('Round-trip time',20,300,rtt,10,v=>{rtt=v;run();},v=>v+' ms');
  const rows=h('div',{});const rd=readout();const bar=meter(0);
  function sim(){const r=mkRand(seed);const lost=[];for(let i=0;i<N;i++){lost.push(r()*100<loss);}
    const rto=2*rtt;const tcpArr=[],tcpRetx=[];
    for(let i=0;i<N;i++){let t=i*GAP+rtt/2,k=0;while(r()*100<loss&&k<8){t+=rto;k++;}tcpArr.push(t);tcpRetx.push(k);}
    const app=[];let m=0;for(let i=0;i<N;i++){m=Math.max(m,tcpArr[i]);app.push(m);}
    const udp=lost.map((x,i)=>x?null:i*GAP+rtt/2);return {tcpArr,tcpRetx,app,udp,lost};}
  function cell(c,text,title){return h('span',{class:'cell',title:title||'',style:`display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;margin:2px;border-radius:5px;font-size:11px;font-weight:700;${c}`},text);}
  function run(){if(stop){stop();stop=null;}clock=0;const S=sim();const endT=Math.max(...S.app)+50;
    function paint(){rows.textContent='';
      const tcp=h('div',{},h('b',{},'TCP '),h('span',{class:'note'},'(every packet arrives, in order)'));const tc=h('div',{});
      S.tcpArr.forEach((a,i)=>{const arrived=clock>=a,delivered=clock>=S.app[i];let c='background:var(--well);color:var(--ink2);border:1px dashed var(--line)';let tx=i+1;
        if(delivered)c='background:var(--go-soft);color:var(--go);border:1px solid var(--go)';else if(arrived)c='background:var(--warn-soft);color:var(--warn);border:1px solid var(--warn)';
        tc.append(cell(c,tx,S.tcpRetx[i]?`Packet ${i+1}: lost ${S.tcpRetx[i]} time(s) and resent`:`Packet ${i+1}`));});tcp.append(tc);
      const udp=h('div',{},h('b',{},'UDP '),h('span',{class:'note'},'(no retries, lost stays lost)'));const uc=h('div',{});
      S.udp.forEach((a,i)=>{let c='background:var(--well);color:var(--ink2);border:1px dashed var(--line)';if(a==null){if(clock>=i*GAP+rtt/2)c='background:var(--bad-soft);color:var(--bad);border:1px solid var(--bad)';}else if(clock>=a)c='background:var(--go-soft);color:var(--go);border:1px solid var(--go)';uc.append(cell(c,a==null&&clock>=i*GAP+rtt/2?'x':i+1,a==null?`Packet ${i+1}: lost`:`Packet ${i+1}`));});udp.append(uc);
      rows.append(tcp,udp,h('div',{class:'note'},'Green: delivered to the application. Amber (TCP): arrived, but held back because an earlier packet is missing. Red x: lost for good.'));
      bar.set(Math.min(100,100*clock/endT));
      const tcpDone=Math.round(Math.max(...S.app)),udpDone=Math.round(Math.max(...S.udp.filter(x=>x!=null),0)),lostN=S.udp.filter(x=>x==null).length,stall=S.tcpRetx.reduce((a,b)=>a+b,0);
      rd.set(`TCP: all ${N} packets delivered in order after ${tcpDone} ms (${stall} resends, each waiting about ${2*rtt} ms for a timeout).\nUDP: ${N-lostN} of ${N} packets delivered, finished at ${udpDone} ms, ${lostN} never arrived.\nTCP trades time for completeness. UDP trades completeness for time.`);}
    paint();stop=ctx.every(60,()=>{clock+=Math.max(10,endT/70);if(clock>=endT){clock=endT+1;paint();stop();stop=null;return;}paint();});}
  host.append(cl.el,cr.el,rows,bar,rd,h('div',{class:'row'},btn('Replay',()=>run(),'ghost'),btn('New random losses',()=>{seed=(seed*7919+13)>>>0;run();},'ghost')),h('div',{class:'note'},'Why this matters: a game or a video call would rather skip an old frame than freeze waiting for it. A bank transfer must never skip a message.'));run();
};

/* 5. Load balancing algorithms */
DEMOS.lb=function(host){
  const caps=[1,1,2,4];const names=['A (small)','B (small)','C (medium)','D (large)'];
  let algo='Round robin',alive=[1,1,1,1],rps=2,t=0,rr=0,wrr=[],wi=0;const rand=mkRand(11);
  let act=[[],[],[],[]],served=[0,0,0,0];const bars=caps.map(()=>meter(0));const lab=caps.map(()=>h('span',{class:'note',style:'min-width:210px'}));
  const algos=['Round robin','Weighted round robin','Least connections','IP hash','Random'];
  const tabsEl=tabs(algos,(i,n)=>{algo=n;reset();});
  const cr=ctl('Requests per tick',1,8,rps,1,v=>{rps=v;},v=>v);
  const rd=readout();
  const wlist=()=>{const w=[];caps.forEach((c,i)=>{if(alive[i])for(let k=0;k<c;k++)w.push(i);});return w;};
  function pick(client){const up=alive.map((a,i)=>a?i:-1).filter(i=>i>=0);if(!up.length)return -1;
    if(algo==='Round robin'){rr++;return up[rr%up.length];}
    if(algo==='Weighted round robin'){const w=wlist();wi++;return w[wi%w.length];}
    if(algo==='Least connections'){return up.reduce((b,i)=>act[i].length<act[b].length?i:b,up[0]);}
    if(algo==='IP hash'){return up[H32('client'+client)%up.length];}
    return up[Math.floor(rand()*up.length)];}
  function reset(){act=[[],[],[],[]];served=[0,0,0,0];rr=0;wi=0;}
  function tick(){t++;
    act=act.map((a,i)=>a.map(x=>x-caps[i]*0.6).filter(x=>x>0));
    for(let k=0;k<rps;k++){const client=Math.floor(rand()*14);const heavy=rand()<0.12;const work=heavy?18+rand()*10:2+rand()*5;const s=pick(client);if(s<0)continue;act[s].push(work);served[s]++;}
    const tot=act.reduce((a,b)=>a+b.length,0);
    caps.forEach((c,i)=>{const load=act[i].reduce((a,b)=>a+b,0)/(c*50);bars[i].set(Math.min(100,load*100),load>0.85?'bad':'');lab[i].textContent=`${names[i]}${alive[i]?'':' (down)'}: ${act[i].length} active, ${served[i]} served`;});
    const loads=caps.map((c,i)=>act[i].reduce((a,b)=>a+b,0)/c);const mx=Math.max(...loads),mn=Math.min(...loads.filter((_,i)=>alive[i]));
    rd.set(`Algorithm: ${algo}. Bars show work queued relative to each server's size.\nBusiest server holds ${mx.toFixed(1)} units of work per unit of capacity, quietest ${isFinite(mn)?mn.toFixed(1):'-'}. A big gap means some servers are overloaded while others idle.`);}
  const rowsEl=h('div',{});caps.forEach((c,i)=>{const kill=btn('Fail server',()=>{alive[i]=alive[i]?0:1;kill.textContent=alive[i]?'Fail server':'Restore server';act[i]=alive[i]?act[i]:[];},'ghost');rowsEl.append(h('div',{class:'row',style:'align-items:center;gap:12px;flex-wrap:nowrap'},lab[i],h('div',{style:'flex:1;min-width:120px'},bars[i]),kill));});
  host.append(tabsEl,cr.el,rowsEl,rd,h('div',{class:'note'},'Server sizes are 1, 1, 2 and 4 units. About 1 request in 8 is heavy. Try Round robin first, then Least connections, then fail a server.'));
  tick();ctx.every(220,tick);
};

/* 6. Checksums */
DEMOS.checksum=function(host){
  const T=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t.push(c>>>0);}return t;})();
  const crc=b=>{let c=0xFFFFFFFF;for(const x of b)c=T[(c^x)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
  const inet=b=>{let s=0;for(let i=0;i<b.length;i+=2)s+=(b[i]<<8)|(b[i+1]||0);while(s>>>16)s=(s&0xFFFF)+(s>>>16);return (~s)&0xFFFF;};
  const sum8=b=>b.reduce((a,x)=>(a+x)&255,0);
  const inp=h('input',{type:'text',class:'search',value:'Pay Alice $100 now',maxlength:24,'aria-label':'Message',style:'max-width:360px'});
  let recv=null,note='';const enc=new TextEncoder();
  const out=h('div',{});const rd=readout();
  const hx=(n,w)=>n.toString(16).toUpperCase().padStart(w,'0');
  const hexRow=b=>[...b].map(x=>hx(x,2)).join(' ');
  const show=b=>[...b].map(x=>x>=32&&x<127?String.fromCharCode(x):'·').join('');
  function sent(){return enc.encode(inp.value);}
  function draw(){const a=sent();const r=recv&&recv.length?recv:a;out.textContent='';
    const rows=[['Sent',a],['Received',r]];
    const tbl=h('table',{class:'t'},h('tr',{},h('th',{},''),h('th',{},'Text'),h('th',{},'Bytes (hex)'),h('th',{},'Sum of bytes'),h('th',{},'Internet checksum'),h('th',{},'CRC-32')),
      rows.map(([n,b])=>h('tr',{},h('th',{},n),h('td',{style:'font-family:var(--f-mono)'},show(b)),h('td',{style:'font-family:var(--f-mono);font-size:.8rem'},hexRow(b)),h('td',{style:'font-family:var(--f-mono)'},hx(sum8(b),2)),h('td',{style:'font-family:var(--f-mono)'},hx(inet(b),4)),h('td',{style:'font-family:var(--f-mono)'},hx(crc(b),8)))));
    const diff=(f)=>f(a)!==f(r);
    const verdict=(name,f)=>{const d=diff(f);const missed=recv&&!d;return h('span',{class:'chip '+(d?'ok':''),style:missed?'border-color:var(--bad);color:var(--bad)':''},`${name}: ${!recv?'matches':d?'error detected':'MISSED the error'}`);};
    out.append(tbl,h('div',{class:'row',style:'margin-top:8px'},verdict('Sum of bytes',sum8),verdict('Internet checksum',inet),verdict('CRC-32',crc)));
    rd.set(note||'Press a button to damage the message in transit, then see which checksums notice.');}
  function damage(kind){const a=Uint8Array.from(sent());if(a.length<4){note='Type at least 4 characters.';draw();return;}const b=a.slice();
    if(kind==='bit'){b[1]^=0x04;note='Flipped one bit in byte 2. Every checksum should notice a single-bit error.';}
    if(kind==='swapbytes'){const t=b[0];b[0]=b[1];b[1]=t;note='Swapped the first two bytes. A plain byte sum cannot see order, so it misses this. The Internet checksum and CRC-32 both catch it, because byte position matters inside a 16-bit word.';}
    if(kind==='swapwords'){const x=b[0],y=b[1];b[0]=b[2];b[1]=b[3];b[2]=x;b[3]=y;note='Swapped two whole 16-bit words. The Internet checksum adds words, so order does not matter and it misses this. CRC-32 catches it.';}
    recv=b;draw();}
  inp.addEventListener('input',()=>{recv=null;note='';draw();});
  host.append(h('label',{class:'note'},'Message to send'),inp,h('div',{class:'row'},btn('Flip one bit',()=>damage('bit')),btn('Swap two bytes',()=>damage('swapbytes'),'ghost'),btn('Swap two 16-bit words',()=>damage('swapwords'),'ghost'),btn('Reset',()=>{recv=null;note='';draw();},'ghost')),out,rd,h('div',{class:'note'},'Checksums catch accidental damage, not tampering. Anyone who alters a message can simply recompute a plain checksum. Use a keyed hash (HMAC) or a signature for security.'));draw();
};
