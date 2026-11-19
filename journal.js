/* The Line — Screen 2: live orb, keyword → colour tint, soundscape bars, record button. */
// ═══════════════════════════════════════
// ORB
// ═══════════════════════════════════════
let orbT=0,orbRAF=null,orbBlobs=[],grainBuf=null;
function hexToRgb(hex){return[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
function rgbToHex(a){return'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');}
function bakeGrain(W,H){const o=document.createElement('canvas');o.width=W;o.height=H;const ctx=o.getContext('2d');const img=ctx.createImageData(W,H);for(let i=0;i<img.data.length;i+=4){const v=Math.random()*255;img.data[i]=v;img.data[i+1]=v;img.data[i+2]=v;img.data[i+3]=255;}ctx.putImageData(img,0,0);grainBuf=o;}
function initOrb(bd){const W=220,cx=W/2,cy=W/2;const total=bd.reduce((s,b)=>s+b.weight,0)||1;orbBlobs=bd.map((b,i)=>({...b,weight:b.weight/total,cur:hexToRgb(b.hex),tgt:null,x:cx+(Math.random()-.5)*40,y:cy+(Math.random()-.5)*40,phase:(i/bd.length)*Math.PI*2,speed:.006+Math.random()*.004,orbitR:22+Math.random()*16+i*3,baseR:48+b.weight*78}));if(!grainBuf)bakeGrain(220,220);if(!orbRAF)animOrbLoop();}
function ow(b){return Math.min(1,.32+b.weight*1.35);}
function drawOrbFrame(cvId,grainId,W,blobs,t){
  const cv=document.getElementById(cvId);if(!cv)return;const ctx=cv.getContext('2d'),cx=W/2,cy=W/2;ctx.clearRect(0,0,W,W);blobs=blobs.slice().reverse(); /* oldest first, newest colour sits on top */
  blobs.forEach(b=>{const[r,g,bl]=hexToRgb(b.hex);const h=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,W*.52);h.addColorStop(0,`rgba(${r},${g},${bl},${(.10*ow(b)).toFixed(3)})`);h.addColorStop(1,`rgba(${r},${g},${bl},0)`);ctx.beginPath();ctx.arc(b.x,b.y,W*.52,0,Math.PI*2);ctx.fillStyle=h;ctx.fill();});
  for(let pass=0;pass<3;pass++){blobs.forEach(b=>{const[r,g,bl]=hexToRgb(b.hex);const jx=b.x+Math.sin(t*.009+b.phase+pass)*3,jy=b.y+Math.cos(t*.007+b.phase+pass)*3;const R=b.baseR*(1+Math.sin(t*b.speed+b.phase)*.08)*(0.8+pass*.15);const bloom=ctx.createRadialGradient(jx-R*.15,jy-R*.18,0,jx,jy,R);bloom.addColorStop(0,`rgba(${Math.min(255,r+35)},${Math.min(255,g+30)},${Math.min(255,bl+25)},${(.55*ow(b)/(pass+1)).toFixed(3)})`);bloom.addColorStop(.45,`rgba(${r},${g},${bl},${(.30*ow(b)/(pass+1)).toFixed(3)})`);bloom.addColorStop(1,`rgba(${r},${g},${bl},0)`);ctx.globalCompositeOperation='source-over';ctx.beginPath();ctx.arc(jx,jy,R,0,Math.PI*2);ctx.fillStyle=bloom;ctx.fill();});}
  ctx.globalCompositeOperation='color-dodge';blobs.forEach(b=>{const[r,g,bl]=hexToRgb(b.hex);const dx=b.x+Math.sin(t*.011+b.phase)*5,dy=b.y+Math.cos(t*.009+b.phase)*5;const R=b.baseR*.55*(1+Math.sin(t*b.speed+b.phase+1)*.06);const core=ctx.createRadialGradient(dx-R*.1,dy-R*.12,0,dx,dy,R);core.addColorStop(0,`rgba(${Math.min(255,r+80)},${Math.min(255,g+70)},${Math.min(255,bl+60)},${(.45*ow(b)).toFixed(3)})`);core.addColorStop(1,`rgba(${r},${g},${bl},0)`);ctx.beginPath();ctx.arc(dx,dy,R,0,Math.PI*2);ctx.fillStyle=core;ctx.fill();});
  ctx.globalCompositeOperation='destination-in';ctx.beginPath();ctx.arc(cx,cy,W/2-1,0,Math.PI*2);ctx.fillStyle='#000';ctx.fill();ctx.globalCompositeOperation='source-over';
  if(grainBuf){const gcv=document.getElementById(grainId);if(gcv){const gctx=gcv.getContext('2d');gctx.clearRect(0,0,W,W);const angle=t*.004,radius=18,sx=Math.cos(angle)*radius,sy=Math.sin(angle)*radius;const bx=-(((sx%W)+W)%W),by=-(((sy%W)+W)%W);gctx.drawImage(grainBuf,bx,by);gctx.drawImage(grainBuf,bx+W,by);gctx.drawImage(grainBuf,bx,by+W);gctx.drawImage(grainBuf,bx+W,by+W);gctx.globalCompositeOperation='destination-in';gctx.beginPath();gctx.arc(W/2,W/2,W/2-1,0,Math.PI*2);gctx.fillStyle='#000';gctx.fill();gctx.globalCompositeOperation='source-over';}}
}
function tickBlobs(t){const W=220,cx=W/2,cy=W/2;orbBlobs.forEach(b=>{
  // ease colour + weight toward the target so a keyword shift glides instead of jumping
  if(b.tgt){b.cur=b.cur.map((v,k)=>v+(b.tgt[k]-v)*.035);b.hex=rgbToHex(b.cur);if(b.tw!=null)b.weight+=(b.tw-b.weight)*.035;}
  b.x=cx+Math.sin(t*b.speed+b.phase)*b.orbitR+Math.sin(t*b.speed*.3+b.phase*1.7)*b.orbitR*.4;b.y=cy+Math.cos(t*b.speed+b.phase)*b.orbitR*.7+Math.cos(t*b.speed*.25+b.phase*2.1)*b.orbitR*.3;});}
function animOrbLoop(){orbT++;tickBlobs(orbT);drawOrbFrame('orb-cv','orb-grain',220,orbBlobs,orbT);drawOrbFrame('s3-orb-cv','s3-grain',220,orbBlobs,orbT);orbRAF=requestAnimationFrame(animOrbLoop);}
function drawLeak(cvId,leakRgb,opacity,rgb2){const cv=document.getElementById(cvId);if(!cv)return;const pf=cv.parentElement;const W=pf?pf.offsetWidth||375:375,H=pf?pf.offsetHeight||812:812;if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}const ctx=cv.getContext('2d');ctx.clearRect(0,0,W,H);const{r,g,b}=leakRgb;const c2=rgb2||leakRgb;const g1=ctx.createRadialGradient(0,0,0,0,0,W*.95);g1.addColorStop(0,`rgba(${r},${g},${b},0.38)`);g1.addColorStop(1,`rgba(${r},${g},${b},0)`);ctx.fillStyle=g1;ctx.fillRect(0,0,W,H);const g2=ctx.createRadialGradient(W,H,0,W,H,W*.85);g2.addColorStop(0,`rgba(${c2.r},${c2.g},${c2.b},0.26)`);g2.addColorStop(1,`rgba(${c2.r},${c2.g},${c2.b},0)`);ctx.fillStyle=g2;ctx.fillRect(0,0,W,H);if(opacity!=null)cv.style.opacity=opacity;}

// ═══════════════════════════════════════
// BARS
// ═══════════════════════════════════════
const BH=[4,5,7,9,12,15,18,20,22,24,22,20,18,15,12,10,8,10,13,16,20,22,24,22,20,18,15,12,9,7,5,4];
let barRAF=null,barT=0,barOn=false,barHex='#C2B89A',s2SndOn=false,soundUserOff=false;
function buildBars(id){const c=document.getElementById(id);if(!c)return;c.innerHTML='';BH.forEach(h=>{const d=document.createElement('div');d.className='bar';d.style.height=h+'px';d.dataset.h=h;c.appendChild(d);});}
function animBars(id){const bars=document.querySelectorAll(`#${id} .bar`);barT+=.06;bars.forEach((b,i)=>{const base=parseInt(b.dataset.h)||5,wave=barOn?Math.sin(barT+i*.3)*base*.4:0;b.style.height=Math.max(3,base+wave)+'px';b.style.background=barOn?barHex:'rgba(0,0,0,0.11)';});}
function runBars(id){if(barRAF)return;function f(){animBars(id);barRAF=requestAnimationFrame(f);}f();}
function stopBars(id){cancelAnimationFrame(barRAF);barRAF=null;barOn=false;document.querySelectorAll(`#${id} .bar`).forEach(b=>{b.style.height=b.dataset.h+'px';b.style.background='rgba(0,0,0,0.11)';});}
function toggleS2Sound(){if(!selFreq)return;const icon=document.getElementById('s2-play-icon');if(s2SndOn){soundUserOff=true;stopSnd(.8);s2SndOn=false;barOn=false;stopBars('s2-bars');if(icon){icon.innerHTML='<polygon points="5 3 19 12 5 21 5 3"/>';icon.setAttribute('stroke','rgba(61,56,48,0.6)');}}else{soundUserOff=false;startSnd(liveDial||selFreq);s2SndOn=true;barOn=true;barHex=(lastColour&&lastColour.latest&&lastColour.hex)||LD[liveDial||selFreq]?.col||'#C2B89A';runBars('s2-bars');if(icon){icon.innerHTML='<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';icon.setAttribute('stroke',barHex);}}}

// ═══════════════════════════════════════
// LIVE KEYWORD → DIAL (offline, no AI, no network)
// Each recognised word maps to a dial 1–9, which already owns a colour (LD)
// and a soundscape (SCAPES). The LATEST word sets the colour + sound.
// ═══════════════════════════════════════
let lastColour=null,jTimer=null,liveDial=null,liveKey='',sndT=null,readT=null;
const LW=[.40,.24,.16,.12,.08];            // layer weights, newest first (opacity of each overlapping blob)
const cdist=(a,b)=>{const p=hexToRgb(a),q=hexToRgb(b);return Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);};
const rgbObj=hex=>{const[r,g,b]=hexToRgb(hex);return{r,g,b};};
function buildColour(text){
  const hits=TheLineMood.findHits(text||'');
  const fallback=liveDial||selFreq||5,base=LD[fallback].col;
  if(!hits.length){const d=LD[fallback];return{dial:fallback,dominant_word:d.w,dominant_hex:d.col,hex:d.col,hex2:d.col,blobs:[{emotion:d.w,hex:d.col,weight:1}],orb:LW.map(w=>({emotion:d.w,hex:d.col,weight:w})),chips:[],detected_emotions:d.tags,description:QUAD[fallback],latest:null};}
  const latest=hits[hits.length-1];
  // layers = the newest distinct keyword colours, newest first (a new keyword pushes the others back)
  const layers=[];
  for(let i=hits.length-1;i>=0&&layers.length<5;i--){const h=hits[i];if(layers.every(l=>cdist(l.hex,h.hex)>9))layers.push(h);}
  const baseHex=LD[selFreq||fallback].col;
  const orb=LW.map((w,i)=>layers[i]?{emotion:layers[i].word,hex:layers[i].hex,weight:w}:{emotion:'·',hex:baseHex,weight:w*.45});
  const rw=[.4,.28,.2,.12];const rs=layers.slice(0,4);const rt=rw.slice(0,rs.length).reduce((a,b)=>a+b,0);
  const blobs=rs.map((h,i)=>({emotion:h.word,hex:h.hex,weight:rw[i]/rt}));
  const chips=[];for(let i=layers.length-1,n=0;i>=0&&n<5;i--,n++)chips.push({w:layers[i].word,hex:layers[i].hex});chips.reverse();
  return{dial:latest.dial,dominant_word:latest.word,dominant_hex:latest.hex,hex:latest.hex,hex2:(layers[1]||{hex:baseHex}).hex,blobs,orb,chips,detected_emotions:layers.map(h=>h.word),description:QUAD[latest.dial],latest,key:latest.pos+':'+latest.word+':'+latest.dial};
}
// ── tint: background wash, leak, save button glide between keyword colours
let tint={cur:[[196,184,154],[196,184,154]],tgt:null,raf:null};
function applyTint(){
  const a=rgbToHex(tint.cur[0]),b=rgbToHex(tint.cur[1]);
  const bg=document.getElementById('s2-bg');if(bg)bg.style.background=`radial-gradient(ellipse at 50% 0%,${a}30 0%,transparent 58%),radial-gradient(ellipse at 10% 100%,${b}22 0%,transparent 55%)`;
  const sv=document.getElementById('s2-save');if(sv)sv.style.backgroundColor=a;
  const o=cvOpacity();drawLeak('s2-leak',{r:Math.round(tint.cur[0][0]),g:Math.round(tint.cur[0][1]),b:Math.round(tint.cur[0][2])},o,{r:Math.round(tint.cur[1][0]),g:Math.round(tint.cur[1][1]),b:Math.round(tint.cur[1][2])});
}
function cvOpacity(){return .5;}
function setTint(h0,h1,jump){
  tint.tgt=[hexToRgb(h0),hexToRgb(h1)];
  if(jump){tint.cur=tint.tgt.map(c=>c.slice());tint.tgt=null;applyTint();return;}
  if(!tint.raf)tint.raf=requestAnimationFrame(tintTick);
}
function tintTick(){
  tint.raf=null;if(!tint.tgt)return;let md=0;
  tint.cur=tint.cur.map((c,i)=>c.map((v,k)=>{const t=tint.tgt[i][k];md=Math.max(md,Math.abs(t-v));return v+(t-v)*.07;}));
  applyTint();
  if(md>.8)tint.raf=requestAnimationFrame(tintTick);else{tint.cur=tint.tgt;tint.tgt=null;applyTint();}
}
function paintLive(res){
  const d=LD[res.dial],hex=res.hex;
  applyBlobs(res.orb);
  const ew=document.getElementById('s2-emo');if(ew){ew.textContent=res.latest?res.latest.word:d.w;ew.style.color=hex;}
  const ll=document.getElementById('s2-lnum');if(ll){ll.textContent=res.dial===selFreq?`line ${selFreq}`:`line ${selFreq} → ${res.dial}`;ll.style.color=hex;}
  setKWs('s2-kws',res.chips&&res.chips.length?res.chips:res.detected_emotions,hex);
  setTint(hex,res.hex2);
  if(barOn)barHex=hex;
  const bp=document.getElementById('s2-bpm');if(bp)bp.textContent=`${BPM[res.dial-1]||70} BPM`;
  // sound follows the dial (debounced so fast typing doesn't thrash the audio)
  clearTimeout(sndT);if(!soundUserOff)sndT=setTimeout(()=>startSnd(res.dial),450);
}
async function analyseJ(text){
  // kept for compatibility: offline analysis, instant
  const res=buildColour(text);lastColour=res;
  if(res.latest){liveDial=res.dial;paintLive(res);}
}
function applyBlobs(bd){
  const total=bd.reduce((s,b)=>s+b.weight,0)||1;const nb=bd.map(b=>({...b,weight:b.weight/total}));
  if(orbBlobs.length&&orbBlobs.length===nb.length){orbBlobs.forEach((b,i)=>{b.tgt=hexToRgb(nb[i].hex);b.tw=nb[i].weight;b.emotion=nb[i].emotion;});if(!orbRAF)animOrbLoop();}
  else initOrb(nb);
}
function setKWs(id,words,hex){const r=document.getElementById(id);if(!r)return;r.innerHTML='';(words||[]).slice(0,5).forEach((w,i)=>{const el=document.createElement('span');el.className='kw';const o=typeof w==='object';el.textContent=o?w.w:w;el.style.color=o?w.hex:(hex||'var(--muted)');if(o)el.style.borderColor=w.hex+'66';r.appendChild(el);setTimeout(()=>el.classList.add('on'),i*90+180);});}
function onJInput(){
  const ta=document.getElementById('s2-ta');if(!ta)return;
  const sv=document.getElementById('s2-save');if(sv)sv.disabled=ta.value.trim().length===0;
  const res=buildColour(ta.value);lastColour=res;
  if(res.latest&&res.key!==liveKey){
    liveKey=res.key;liveDial=res.dial;paintLive(res);
    const el=document.getElementById('s2-reading');if(el){el.classList.add('on');clearTimeout(readT);readT=setTimeout(()=>el.classList.remove('on'),700);}
  }
}

// ═══════════════════════════════════════
// RECORD
// ═══════════════════════════════════════
let recState='idle',recTimer=null;
function toggleRec(){const btn=document.getElementById('rec-btn'),lbl=document.getElementById('rec-lbl'),st=document.getElementById('rec-status');if(recState==='idle'){recState='recording';btn.classList.add('recording');lbl.textContent='Recording…';st.textContent='● tap to stop';st.style.opacity='1';recTimer=setTimeout(stopRec,30000);}else if(recState==='recording')stopRec();}
function stopRec(){clearTimeout(recTimer);const btn=document.getElementById('rec-btn'),lbl=document.getElementById('rec-lbl'),st=document.getElementById('rec-status');recState='processing';btn.classList.remove('recording');lbl.textContent='Processing…';setTimeout(()=>{recState='idle';btn.classList.remove('processing');lbl.textContent='Record again';st.textContent='voice captured';setTimeout(()=>{if(st)st.style.opacity='0';if(lbl)lbl.textContent='Record';},3000);},1800);}

