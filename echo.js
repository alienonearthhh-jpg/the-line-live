/* The Line — Echo: every saved moment as an orb, tap to listen. EchoStore = where a shared database plugs in. */
// ═══════════════════════════════════════
// ECHO — every saved moment becomes an orb. Tap one to hear it.
// Only colour + dial (= sound) are ever shared, never the written words.
// EchoStore is the single place to plug in a shared database later (see `remote`).
// ═══════════════════════════════════════
const ECHO_SEEN_KEY='theline.echoSeen.v1';
const DV=[-.9,-.62,-.42,-.22,0,.25,.5,.68,.9],DA=[.85,.2,-.55,-.7,0,-.2,-.4,.3,.8];
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const EchoStore={
  // Later: set to {list:()=>Promise<[{n,hex,word,ts}]>, add:({n,hex,word,ts})=>void} backed by Supabase.
  remote:null,
  _seed:null,
  seed(){ // a believable crowd for the demo; same every time
    if(this._seed)return this._seed;
    const r=rng(20261119),out=[],per=[3,4,4,4,3,4,4,5,5];
    for(let n=1;n<=9;n++)for(let i=0;i<per[n-1];i++){
      const v=Math.max(-1,Math.min(1,DV[n-1]+(r()-.5)*.26)),a=Math.max(-1,Math.min(1,DA[n-1]+(r()-.5)*.42));
      const tags=LD[n].tags||[LD[n].w];
      out.push({id:'s'+n+'-'+i,n,hex:TheLineMood.colour(v,a),word:tags[Math.floor(r()*tags.length)],ago:Math.floor(1+r()*170),mine:false});
    }
    return this._seed=out;
  },
  mine(){return userMemos.map((m,i)=>({id:m.id||('m'+i),n:m.n,hex:m.blended,word:(m.blobs&&m.blobs[0]&&m.blobs[0].emotion)||LD[m.n].w,ago:null,mine:true}));},
  list(){return[...this.mine(),...this.seed()];},
  add(e){if(this.remote&&this.remote.add){try{this.remote.add({n:e.n,hex:e.blended,word:(e.blobs&&e.blobs[0]&&e.blobs[0].emotion)||LD[e.n].w,ts:Date.now()});}catch(x){}}}
};
let echoRun=false,activeFilt=0,echoBlobs=[],echoJust=null,listenDial=null;
let lOpenedAt=0,lOvRun=false,lPlayOn=false,lWaveRAF=null,lOvRAF=null;
function agoText(m){return m<2?'just now':m<60?m+' min ago':Math.round(m/60)+' h ago';}
function buildFilter(){
  const bar=document.getElementById('echo-filter');if(!bar)return;bar.innerHTML='';
  for(let n=1;n<=9;n++){
    const dot=document.createElement('div');
    dot.className='ef-dot'+(n===activeFilt?' active':'');
    dot.style.background=LD[n].col;
    dot.onclick=e=>{e.stopPropagation();activeFilt=activeFilt===n?0:n;buildFilter();};
    bar.appendChild(dot);
  }
}
function echoIntro(){
  const el=document.getElementById('echo-intro');if(!el)return;let seen=false;try{seen=!!localStorage.getItem(ECHO_SEEN_KEY);}catch(e){}
  el.style.display=seen?'none':'flex';
}
function closeEchoIntro(){try{localStorage.setItem(ECHO_SEEN_KEY,'1');}catch(e){}const el=document.getElementById('echo-intro');if(el)el.style.display='none';}
function startEcho(){
  if(echoRun)return;echoRun=true;buildFilter();echoIntro();
  if(!grainBuf)bakeGrain(220,220);
  const cv=document.getElementById('echo-cv');if(!cv)return;const pf=cv.closest('.phone-frame')||document.body;const W=pf.offsetWidth||375,H=pf.offsetHeight||812;cv.width=W;cv.height=H;const ctx=cv.getContext('2d');
  const ymin=104,ymax=Math.max(ymin+110,H-400);
  const list=EchoStore.list();
  echoBlobs=list.map((e,i)=>{
    const [r,g,b]=hexToRgb(e.hex);
    return{...e,
      x:50+Math.random()*(W-100),y:ymin+Math.random()*(ymax-ymin),
      r:e.mine?64:34+Math.random()*28,
      vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.22,
      pr:Math.round(r+(255-r)*.28),pg:Math.round(g+(255-g)*.28),pb:Math.round(b+(255-b)*.28),
      cr:Math.round(r+(255-r)*.55),cg:Math.round(g+(255-g)*.55),cb:Math.round(b+(255-b)*.55),
      phase:Math.random()*Math.PI*2,pt:Math.random()*100,va:0,fresh:e.id===echoJust};
  });
  echoBlobs.sort((a,b)=>(a.mine?1:0)-(b.mine?1:0));          // yours sit on top
  const cnt=document.getElementById('echo-count');if(cnt)cnt.textContent=`${list.length} moments`;
  const hint=document.getElementById('alone-hint');
  if(hint){hint.textContent=echoJust?'your moment just joined · tap an orb to listen':'tap an orb to listen';}
  if(echoJust){const j=echoJust;setTimeout(()=>{if(echoJust===j)echoJust=null;echoBlobs.forEach(b=>{b.fresh=false;});if(hint)hint.textContent='tap an orb to listen';},9000);}
  let old=document.getElementById('e-hit');if(old)old.remove();const hl=document.createElement('div');hl.id='e-hit';hl.style.cssText='position:absolute;inset:0;z-index:15;pointer-events:all;';document.getElementById('s4').appendChild(hl);
  function getB(cx,cy){const rc=hl.getBoundingClientRect(),sx=W/rc.width,sy=H/rc.height,px=(cx-rc.left)*sx,py=(cy-rc.top)*sy;let hit=null,bd=Infinity;echoBlobs.forEach(b=>{if(b.va<.5)return;const d=Math.hypot(px-b.x,py-b.y);if(d<Math.max(b.r*.95,34)&&d<bd){bd=d;hit=b;}});return hit;}
  let tt=0;hl.addEventListener('mousedown',()=>{tt=Date.now();});hl.addEventListener('mouseup',e=>{if(Date.now()-tt>400)return;const h=getB(e.clientX,e.clientY);if(h)openListen(h);});hl.addEventListener('touchstart',()=>{tt=Date.now();},{passive:true});hl.addEventListener('touchend',e=>{if(Date.now()-tt>400)return;const t=e.changedTouches[0];const h=getB(t.clientX,t.clientY);if(h)openListen(h);},{passive:true});
  let et=0;
  function frame(){
    if(!document.getElementById('s4').classList.contains('active')){echoRun=false;return;}
    et++;
    ctx.globalCompositeOperation='source-over';ctx.fillStyle='#F5F1EA';ctx.fillRect(0,0,W,H);
    echoBlobs.forEach(b=>{
      const want=(activeFilt===0||b.n===activeFilt)?1:.12;
      b.va+=(want-b.va)*.06;
      b.x+=b.vx;b.y+=b.vy;
      if(b.x<30+b.r*.4||b.x>W-30-b.r*.4)b.vx*=-1;
      if(b.y<ymin||b.y>ymax)b.vy*=-1;
      b.pt+=.010;
      const Rv=b.r*(1+Math.sin(b.pt+b.phase)*.08);
      const wash=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,Rv*2.6);
      wash.addColorStop(0,`rgba(${b.pr},${b.pg},${b.pb},${(.30*b.va).toFixed(3)})`);
      wash.addColorStop(.5,`rgba(${b.pr},${b.pg},${b.pb},${(.10*b.va).toFixed(3)})`);
      wash.addColorStop(1,`rgba(${b.pr},${b.pg},${b.pb},0)`);
      ctx.beginPath();ctx.arc(b.x,b.y,Rv*2.6,0,Math.PI*2);ctx.fillStyle=wash;ctx.fill();
      const body=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,Rv*1.2);
      body.addColorStop(0,`rgba(${b.pr},${b.pg},${b.pb},${(.7*b.va).toFixed(3)})`);
      body.addColorStop(.6,`rgba(${b.pr},${b.pg},${b.pb},${(.30*b.va).toFixed(3)})`);
      body.addColorStop(1,`rgba(${b.pr},${b.pg},${b.pb},0)`);
      ctx.beginPath();ctx.arc(b.x,b.y,Rv*1.2,0,Math.PI*2);ctx.fillStyle=body;ctx.fill();
      const core=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,Rv*.5);
      core.addColorStop(0,`rgba(${b.cr},${b.cg},${b.cb},${(.9*b.va).toFixed(3)})`);
      core.addColorStop(1,`rgba(${b.pr},${b.pg},${b.pb},0)`);
      ctx.beginPath();ctx.arc(b.x,b.y,Rv*.5,0,Math.PI*2);ctx.fillStyle=core;ctx.fill();
      if(b.mine&&b.va>.3){ctx.beginPath();ctx.arc(b.x,b.y,Rv*.72,0,Math.PI*2);ctx.strokeStyle=`rgba(61,56,48,${(.28*b.va).toFixed(3)})`;ctx.lineWidth=1.1;ctx.stroke();}
      if(b.fresh){const k=(et%100)/100;ctx.beginPath();ctx.arc(b.x,b.y,Rv*(.8+k*1.1),0,Math.PI*2);ctx.strokeStyle=`rgba(${b.pr},${b.pg},${b.pb},${(.7*(1-k)).toFixed(3)})`;ctx.lineWidth=2;ctx.stroke();}
    });
    if(grainBuf){ctx.globalAlpha=0.018;ctx.drawImage(grainBuf,0,0,W,H);ctx.globalAlpha=1;}
    requestAnimationFrame(frame);
  }
  frame();if(selFreq)startSnd(selFreq);
}
function openListen(blob){
  lOpenedAt=Date.now();
  listenDial=blob.n;lPlayOn=true;document.getElementById('lp-play').style.display='none';document.getElementById('lp-pause').style.display='block';
  const who=document.getElementById('l-who'),what=document.getElementById('l-what'),line=document.getElementById('l-line');
  if(who)who.textContent=blob.mine?'your moment':'someone · '+agoText(blob.ago||5);
  if(what){what.textContent=blob.word;what.style.color=blob.hex;}
  if(line)line.textContent=`line ${blob.n} · ${LD[blob.n].w}`;
  lOvRun=true;const ov=document.getElementById('listen-ov');if(!ov)return;const pf=ov.closest('.phone-frame');const W=pf?pf.offsetWidth:375,H=pf?pf.offsetHeight:812;const lovc=document.getElementById('listen-ov-cv');if(lovc){lovc.width=W;lovc.height=H;}
  ov.style.display='flex';requestAnimationFrame(()=>ov.classList.add('show'));startLOvCanvas(blob.hex,W,H);startLWave(blob.hex);startSnd(blob.n);
}
function closeListen(){lOvRun=false;cancelAnimationFrame(lOvRAF);cancelAnimationFrame(lWaveRAF);const ov=document.getElementById('listen-ov');if(ov){ov.classList.remove('show');setTimeout(()=>ov.style.display='none',550);}if(selFreq)startSnd(selFreq);else stopSnd(2.0);}
function startLOvCanvas(hex,W,H){
  const cv=document.getElementById('listen-ov-cv');if(!cv)return;const ctx=cv.getContext('2d');
  const[rv,gv,bv]=hexToRgb(hex);
  const pr=Math.round(rv+(255-rv)*.55),pg=Math.round(gv+(255-gv)*.55),pb=Math.round(bv+(255-bv)*.55);
  let lt=0;
  function draw(){
    if(!lOvRun)return;
    ctx.fillStyle='rgba(245,241,234,0.92)';ctx.fillRect(0,0,W,H);
    const Rv=200*(1+Math.sin(lt*.018)*.07);
    const h1=ctx.createRadialGradient(W/2,H*.4,0,W/2,H*.4,Rv*2);
    h1.addColorStop(0,`rgba(${pr},${pg},${pb},0.35)`);h1.addColorStop(.5,`rgba(${pr},${pg},${pb},0.12)`);h1.addColorStop(1,`rgba(${pr},${pg},${pb},0)`);
    ctx.globalCompositeOperation='multiply';ctx.beginPath();ctx.arc(W/2,H*.4,Rv*2,0,Math.PI*2);ctx.fillStyle=h1;ctx.fill();
    ctx.globalCompositeOperation='source-over';
    lt++;lOvRAF=requestAnimationFrame(draw);
  }
  draw();
}
function startLWave(hex){const cv=document.getElementById('l-wave');if(!cv)return;const ctx=cv.getContext('2d'),W=200,H=32;let wt=0;function f(){if(!lOvRun)return;ctx.clearRect(0,0,W,H);ctx.beginPath();ctx.strokeStyle=hex;ctx.globalAlpha=lPlayOn?.78:.28;ctx.lineWidth=1.4;for(let x=0;x<W;x++){const y=H/2+Math.sin(x*.08+wt*.07)*(lPlayOn?9:2.5);x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();ctx.globalAlpha=1;wt++;lWaveRAF=requestAnimationFrame(f);}f();}
function toggleLPlay(){lPlayOn=!lPlayOn;document.getElementById('lp-play').style.display=lPlayOn?'none':'block';document.getElementById('lp-pause').style.display=lPlayOn?'block':'none';if(lPlayOn)startSnd(listenDial||selFreq||5);else stopSnd(.6);}

