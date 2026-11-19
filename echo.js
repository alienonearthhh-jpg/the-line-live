/* The Line — Echo: every saved moment as an orb, tap to listen. EchoStore = where a shared database plugs in. */
// ═══════════════════════════════════════
// ECHO — every saved moment becomes an orb. Tap one to hear it.
// Only colour + dial (= sound) are ever shared, never the written words.
// EchoStore is the single place to plug in a shared database later (see `remote`).
// ═══════════════════════════════════════
const ECHO_SEEN_KEY='theline.echoSeen.v1';
const ECHO_VOL=.26;   // Echo listening is a quiet murmur, not the full soundscape
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

let echoRun=false,activeFilt=0,echoBlobs=[],echoJust=null,echoSel=null,echoPlaying=false;
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

// ── listening: tap an orb and the field answers; tap another and the light hops across to it ──
let echoHop=null,echoBurst=0,echoTint={rgb:[245,241,234],a:0,x:0,y:0};
function echoSelect(b){
  closeEchoIntro();
  if(b&&echoSel===b){echoSelect(null);return;}                   // tap the same orb again = stop
  const prev=echoSel;echoSel=b;
  const pill=document.getElementById('echo-now'),hint=document.getElementById('alone-hint');
  if(!b){echoPlaying=false;echoHop=null;if(pill)pill.classList.remove('on');if(hint)hint.textContent='tap an orb to listen';
    if(selFreq&&!soundUserOff)startSnd(selFreq,ECHO_VOL,true);else stopSnd(1.2);return;}
  if(prev)echoHop={a:{x:prev.x,y:prev.y,c:[prev.cr,prev.cg,prev.cb]},b,t:0};   // light leaves the old orb…
  echoBurst=1;                                                              // …and blooms in the new one
  echoPlaying=true;
  document.getElementById('en-dot').style.background=b.hex;
  document.getElementById('en-who').textContent=b.mine?'your moment':'someone · '+agoText(b.ago||5);
  document.getElementById('en-sub').textContent='tap another orb to hop';
  setEnIcon();if(pill)pill.classList.add('on');
  if(hint)hint.textContent='tap empty space to stop';
  startSnd(b.n,ECHO_VOL,true);
}
function setEnIcon(){const i=document.getElementById('en-icon');if(i)i.innerHTML=echoPlaying?'<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>':'<polygon points="5 3 19 12 5 21 5 3"/>';}
function toggleEchoPlay(){
  if(!echoSel)return;echoPlaying=!echoPlaying;setEnIcon();
  if(echoPlaying)startSnd(echoSel.n,ECHO_VOL,true);else stopSnd(.8);
}
function startEcho(){
  if(echoRun)return;echoRun=true;buildFilter();echoIntro();
  echoSel=null;echoHop=null;echoPlaying=false;echoBurst=0;echoTint.a=0;
  const pill0=document.getElementById('echo-now');if(pill0)pill0.classList.remove('on');
  if(!grainBuf)bakeGrain(220,220);
  const cv=document.getElementById('echo-cv');if(!cv)return;const pf=cv.closest('.phone-frame')||document.body;const W=pf.offsetWidth||375,H=pf.offsetHeight||812;cv.width=W;cv.height=H;const ctx=cv.getContext('2d');
  const ymin=172,ymax=Math.max(ymin+110,H-(H<760?340:400));
  const list=EchoStore.list();
  echoBlobs=list.map((e,i)=>{
    const [r,g,b]=hexToRgb(e.hex);
    return{...e,
      x:50+Math.random()*(W-100),y:ymin+Math.random()*(ymax-ymin),
      r:e.mine?60:34+Math.random()*26,sc:1,
      vx:(Math.random()-.5)*.28,vy:(Math.random()-.5)*.22,
      pr:Math.round(r+(255-r)*.28),pg:Math.round(g+(255-g)*.28),pb:Math.round(b+(255-b)*.28),
      cr:Math.round(r+(255-r)*.55),cg:Math.round(g+(255-g)*.55),cb:Math.round(b+(255-b)*.55),
      phase:Math.random()*Math.PI*2,pt:Math.random()*100,va:0,fresh:e.id===echoJust};
  });
  echoBlobs.sort((a,b)=>(a.mine?1:0)-(b.mine?1:0));          // yours sit on top
  const cnt=document.getElementById('echo-count');if(cnt)cnt.textContent=`${list.length} moments`;
  const hint=document.getElementById('alone-hint');
  if(hint){hint.textContent=echoJust?'your moment just joined · tap an orb to listen':'tap an orb to listen';}
  if(echoJust){const j=echoJust;setTimeout(()=>{if(echoJust===j)echoJust=null;echoBlobs.forEach(b=>{b.fresh=false;});if(hint&&!echoSel)hint.textContent='tap an orb to listen';},9000);}
  let old=document.getElementById('e-hit');if(old)old.remove();const hl=document.createElement('div');hl.id='e-hit';hl.style.cssText='position:absolute;inset:0;z-index:15;pointer-events:all;';document.getElementById('s4').appendChild(hl);
  function getB(cx,cy){const rc=hl.getBoundingClientRect(),sx=W/rc.width,sy=H/rc.height,px=(cx-rc.left)*sx,py=(cy-rc.top)*sy;let hit=null,bd=Infinity;echoBlobs.forEach(b=>{if(b.va<.4)return;const d=Math.hypot(px-b.x,py-b.y);if(d<Math.max(b.r*b.sc*.95,36)&&d<bd){bd=d;hit=b;}});return hit;}
  function tap(cx,cy){const h=getB(cx,cy);if(h)echoSelect(h);else if(echoSel)echoSelect(null);}
  let tt=0;hl.addEventListener('mousedown',()=>{tt=Date.now();});hl.addEventListener('mouseup',e=>{if(Date.now()-tt>400)return;tap(e.clientX,e.clientY);});hl.addEventListener('touchstart',()=>{tt=Date.now();},{passive:true});hl.addEventListener('touchend',e=>{if(Date.now()-tt>400)return;const t=e.changedTouches[0];tap(t.clientX,t.clientY);e.preventDefault();},{passive:false});
  const wv=document.getElementById('en-wave'),wctx=wv?wv.getContext('2d'):null;
  let et=0;
  const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  function frame(){
    if(!document.getElementById('s4').classList.contains('active')){echoRun=false;echoSel=null;return;}
    et++;
    // background: cream, washed outward from the orb you're listening to
    ctx.globalCompositeOperation='source-over';ctx.fillStyle='#F5F1EA';ctx.fillRect(0,0,W,H);
    if(echoSel){const tr=[echoSel.pr,echoSel.pg,echoSel.pb];echoTint.rgb=echoTint.rgb.map((v,k)=>v+(tr[k]-v)*.06);echoTint.x=echoSel.x;echoTint.y=echoSel.y;}
    echoTint.a+=((echoSel?1:0)-echoTint.a)*.05;
    if(echoTint.a>.01){const[tr,tg,tb]=echoTint.rgb.map(Math.round);const R=Math.max(W,H)*(.55+.35*echoTint.a);const g=ctx.createRadialGradient(echoTint.x,echoTint.y,0,echoTint.x,echoTint.y,R);g.addColorStop(0,`rgba(${tr},${tg},${tb},${(.55*echoTint.a).toFixed(3)})`);g.addColorStop(.55,`rgba(${tr},${tg},${tb},${(.20*echoTint.a).toFixed(3)})`);g.addColorStop(1,`rgba(${tr},${tg},${tb},0)`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
    echoBurst*=.965;
    echoBlobs.forEach(b=>{
      const isSel=b===echoSel;
      const want=((activeFilt===0||b.n===activeFilt)?1:.12)*(echoSel&&!isSel?.62:1);
      b.va+=(want-b.va)*.06;
      b.sc+=((isSel?1.7:1)-b.sc)*.08;
      b.x+=b.vx*(isSel?.25:1);b.y+=b.vy*(isSel?.25:1);
      if(b.x<30+b.r*.4||b.x>W-30-b.r*.4)b.vx*=-1;
      if(b.y<ymin||b.y>ymax)b.vy*=-1;
      b.pt+=.010;
      const breathe=isSel?.10:.08;
      const Rv=b.r*b.sc*(1+Math.sin(b.pt*(isSel?2.2:1)+b.phase)*breathe)*(isSel?1+.18*echoBurst:1);
      const wash=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,Rv*2.6);
      wash.addColorStop(0,`rgba(${b.pr},${b.pg},${b.pb},${(.30*b.va).toFixed(3)})`);
      wash.addColorStop(.5,`rgba(${b.pr},${b.pg},${b.pb},${(.10*b.va).toFixed(3)})`);
      wash.addColorStop(1,`rgba(${b.pr},${b.pg},${b.pb},0)`);
      ctx.beginPath();ctx.arc(b.x,b.y,Rv*2.6,0,Math.PI*2);ctx.fillStyle=wash;ctx.fill();
      const body=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,Rv*1.2);
      body.addColorStop(0,`rgba(${b.pr},${b.pg},${b.pb},${(Math.min(1,.7+(isSel?.2:0))*b.va).toFixed(3)})`);
      body.addColorStop(.6,`rgba(${b.pr},${b.pg},${b.pb},${(.30*b.va).toFixed(3)})`);
      body.addColorStop(1,`rgba(${b.pr},${b.pg},${b.pb},0)`);
      ctx.beginPath();ctx.arc(b.x,b.y,Rv*1.2,0,Math.PI*2);ctx.fillStyle=body;ctx.fill();
      const core=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,Rv*.5);
      core.addColorStop(0,`rgba(${b.cr},${b.cg},${b.cb},${(Math.min(1,.9+(isSel?.1:0))*b.va).toFixed(3)})`);
      core.addColorStop(1,`rgba(${b.pr},${b.pg},${b.pb},0)`);
      ctx.beginPath();ctx.arc(b.x,b.y,Rv*.5,0,Math.PI*2);ctx.fillStyle=core;ctx.fill();
      if(isSel){const hl2=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,Rv*.62);hl2.addColorStop(0,`rgba(255,255,255,${(.62+.2*echoBurst).toFixed(3)})`);hl2.addColorStop(.5,`rgba(${b.cr},${b.cg},${b.cb},.35)`);hl2.addColorStop(1,`rgba(${b.pr},${b.pg},${b.pb},0)`);ctx.beginPath();ctx.arc(b.x,b.y,Rv*.62,0,Math.PI*2);ctx.fillStyle=hl2;ctx.fill();}
      if(isSel&&echoPlaying){ // sound "breathing" out of the orb: soft swelling light, no outlines
        for(let k=0;k<3;k++){const ph=((et*.012)+k/3)%1;const rr=Rv*(1.1+ph*1.6);const al=.22*(1-ph)*(1-ph);
          const sw=ctx.createRadialGradient(b.x,b.y,rr*.55,b.x,b.y,rr);sw.addColorStop(0,`rgba(${b.pr},${b.pg},${b.pb},0)`);sw.addColorStop(.75,`rgba(${b.pr},${b.pg},${b.pb},${al.toFixed(3)})`);sw.addColorStop(1,`rgba(${b.pr},${b.pg},${b.pb},0)`);
          ctx.beginPath();ctx.arc(b.x,b.y,rr,0,Math.PI*2);ctx.fillStyle=sw;ctx.fill();}
      }
      if(b.fresh&&!echoSel){const k=.5+.5*Math.sin(et*.05);const gl=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,Rv*1.5);gl.addColorStop(0,`rgba(${b.cr},${b.cg},${b.cb},${(.55*k).toFixed(3)})`);gl.addColorStop(1,`rgba(${b.pr},${b.pg},${b.pb},0)`);ctx.beginPath();ctx.arc(b.x,b.y,Rv*1.5,0,Math.PI*2);ctx.fillStyle=gl;ctx.fill();}
    });
    // the hop: a comet of light travelling from the last orb to the new one
    if(echoHop){
      echoHop.t+=1/42;const A=echoHop.a,B=echoHop.b;
      const mx=(A.x+B.x)/2+(B.y-A.y)*.22,my=(A.y+B.y)/2-(B.x-A.x)*.22-40;     // arc control point
      const at=u=>{const v=1-u;return[v*v*A.x+2*v*u*mx+u*u*B.x,v*v*A.y+2*v*u*my+u*u*B.y];};
      for(let k=0;k<14;k++){
        const u=Math.max(0,Math.min(1,ease(Math.min(1,echoHop.t))-k*.028));if(u<=0&&k>0)continue;
        const[hx,hy]=at(u);const c=[0,1,2].map(i=>Math.round(A.c[i]+([B.cr,B.cg,B.cb][i]-A.c[i])*u));
        const rad=(38-k*2)*(1-.2*Math.abs(echoHop.t-.5));const al=(1-k/14)*.95*(echoHop.t<1?1:Math.max(0,1.25-echoHop.t)*4);
        if(al<=0)continue;
        const gg=ctx.createRadialGradient(hx,hy,0,hx,hy,rad);gg.addColorStop(0,`rgba(${c[0]},${c[1]},${c[2]},${al.toFixed(3)})`);gg.addColorStop(1,`rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx.beginPath();ctx.arc(hx,hy,rad,0,Math.PI*2);ctx.fillStyle=gg;ctx.fill();
      }
      if(echoHop.t>1.3)echoHop=null;
    }
    if(grainBuf){ctx.globalAlpha=0.018;ctx.drawImage(grainBuf,0,0,W,H);ctx.globalAlpha=1;}
    // little live waveform in the now-playing pill
    if(wctx&&echoSel){wctx.clearRect(0,0,90,24);wctx.beginPath();wctx.strokeStyle=echoSel.hex;wctx.globalAlpha=echoPlaying?.85:.3;wctx.lineWidth=1.4;for(let x=0;x<90;x++){const y=12+Math.sin(x*.16+et*.09)*(echoPlaying?6:1.5)*Math.sin(x/90*Math.PI);x===0?wctx.moveTo(x,y):wctx.lineTo(x,y);}wctx.stroke();wctx.globalAlpha=1;}
    requestAnimationFrame(frame);
  }
  frame();if(selFreq&&!soundUserOff)startSnd(selFreq,ECHO_VOL);
}
