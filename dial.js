/* The Line — Screen 1: the rotating dial. */
// ═══════════════════════════════════════
// DIAL
// ═══════════════════════════════════════
const DC=280,HALF=140,DISC_R=138,H_ORBIT=92,H_R=26;
let dialRot=0,selFreq=0,isDrag=false,dragA0=0,dragR0=0,didDrag=false;
function holeAngle(n){return(-130+((n-1)/8)*280)*Math.PI/180;}
function drawDial(){
  const cv=document.getElementById('dial-cv');if(!cv)return;const ctx=cv.getContext('2d'),C=HALF;
  ctx.clearRect(0,0,DC,DC);ctx.save();ctx.translate(C,C);ctx.rotate(dialRot);ctx.translate(-C,-C);
  ctx.beginPath();ctx.arc(C,C,DISC_R,0,Math.PI*2);ctx.fillStyle='#E8E4DC';ctx.fill();
  const rim=ctx.createRadialGradient(C,C,DISC_R*.78,C,C,DISC_R);rim.addColorStop(0,'rgba(0,0,0,0)');rim.addColorStop(1,'rgba(0,0,0,0.07)');
  ctx.beginPath();ctx.arc(C,C,DISC_R,0,Math.PI*2);ctx.fillStyle=rim;ctx.fill();
  for(let n=1;n<=9;n++){
    const a=holeAngle(n),hx=C+H_ORBIT*Math.cos(a),hy=C+H_ORBIT*Math.sin(a),col=HOLE_COLS[n-1],isAct=selFreq===n;
    ctx.save();ctx.shadowColor='rgba(0,0,0,0.13)';ctx.shadowBlur=10;ctx.shadowOffsetY=4;ctx.beginPath();ctx.arc(hx,hy,H_R,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();ctx.restore();
    ctx.beginPath();ctx.arc(hx,hy,H_R,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
    const hl=ctx.createRadialGradient(hx-H_R*.28,hy-H_R*.28,0,hx,hy,H_R);hl.addColorStop(0,'rgba(255,255,255,0.22)');hl.addColorStop(.5,'rgba(255,255,255,0.05)');hl.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath();ctx.arc(hx,hy,H_R,0,Math.PI*2);ctx.fillStyle=hl;ctx.fill();
    if(isAct){ctx.beginPath();ctx.arc(hx,hy,H_R+3,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,0.7)';ctx.lineWidth=2.5;ctx.stroke();}
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`400 14px 'Instrument Sans',system-ui,sans-serif`;ctx.fillStyle='rgba(255,255,255,0.90)';ctx.fillText(String(n),hx,hy+.5);ctx.restore();
  }
  ctx.restore();
}
drawDial();
function nearest(){const pA=-Math.PI/2;let b=-1,bd=Infinity;for(let n=1;n<=9;n++){const ha=holeAngle(n)+dialRot;let d=Math.abs(((ha-pA+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI);if(d<bd){bd=d;b=n;}}return b;}
function animTo(target,dur=560){const s=dialRot,t0=performance.now();function step(ts){const p=Math.min(1,(ts-t0)/dur),e=1-Math.pow(1-p,4);dialRot=s+(target-s)*e;drawDial();if(p<1)requestAnimationFrame(step);else{dialRot=target;drawDial();}}requestAnimationFrame(step);}
function getA(e){const r=document.getElementById('dial-cv').getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;const s=e.touches?e.touches[0]:e;return Math.atan2(s.clientY-cy,s.clientX-cx);}
function setFreq(n){
  if(n===selFreq)return;selFreq=n;const d=LD[n],col=d.col;
  const hub=document.getElementById('hub-num');if(hub){hub.textContent=n;hub.classList.add('lit');hub.style.color=col;}
  const hw=document.getElementById('hub-word');if(hw){hw.textContent=d.w;hw.classList.add('lit');}
  const fw=document.getElementById('freq-word');if(fw){fw.textContent=d.w;fw.style.color=col;fw.classList.add('show');}
  const ft=document.getElementById('freq-tags');if(ft){ft.innerHTML='';d.tags.forEach((t,i)=>{const el=document.createElement('span');el.className='freq-tag';el.textContent=t;ft.appendChild(el);setTimeout(()=>el.classList.add('show'),i*90+180);});}
  const btn=document.getElementById('call-btn');if(btn){btn.disabled=false;btn.textContent='Call';btn.style.backgroundColor=col;btn.style.color='#fff';}
  drawDial();startSnd(n);
}
document.getElementById('dial-cv').addEventListener('click',e=>{if(didDrag)return;const r=e.currentTarget.getBoundingClientRect(),sc=DC/r.width;const lx=(e.clientX-r.left)*sc-HALF,ly=(e.clientY-r.top)*sc-HALF;let hit=-1,hd=Infinity;for(let n=1;n<=9;n++){const a=holeAngle(n)+dialRot;const hx=H_ORBIT*Math.cos(a),hy=H_ORBIT*Math.sin(a);const d=Math.hypot(lx-hx,ly-hy);if(d<H_R*1.8&&d<hd){hd=d;hit=n;}}if(hit>0){const delta=(((-Math.PI/2-holeAngle(hit))-dialRot+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;animTo(dialRot+delta);setFreq(hit);}});
document.getElementById('dial-disc').addEventListener('mousedown',e=>{isDrag=true;didDrag=false;dragA0=getA(e);dragR0=dialRot;e.preventDefault();e.stopPropagation();});
document.getElementById('dial-disc').addEventListener('touchstart',e=>{isDrag=true;didDrag=false;dragA0=getA(e);dragR0=dialRot;e.preventDefault();},{passive:false});
window.addEventListener('mousemove',e=>{if(!isDrag)return;didDrag=true;dialRot=dragR0+(getA(e)-dragA0);const n=nearest();if(n>0&&n!==selFreq)setFreq(n);drawDial();});
window.addEventListener('touchmove',e=>{if(!isDrag)return;didDrag=true;dialRot=dragR0+(getA(e)-dragA0);const n=nearest();if(n>0&&n!==selFreq)setFreq(n);drawDial();},{passive:true});
function snapDial(){if(!isDrag)return;isDrag=false;if(!didDrag)return;const n=nearest();if(n<1)return;const d=(((-Math.PI/2-holeAngle(n))-dialRot+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;animTo(dialRot+d*.98);}
window.addEventListener('mouseup',snapDial);window.addEventListener('touchend',snapDial);

