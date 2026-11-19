/* The Line — Navigation + Screen 3 (result) + receipt download. */
// ═══════════════════════════════════════
// NAV
// ═══════════════════════════════════════
function goTo(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id)?.classList.add('active');}
function setNav(id){['ni-line','ni-echo','ni-memo'].forEach(b=>document.getElementById(b)?.classList.remove('active'));if(id)document.getElementById(id)?.classList.add('active');  document.getElementById('nav')?.classList.remove('nav-dark');}
function navTo(d){if(d==='line'){goTo('s1');setNav('ni-line');pausePlayer();}else if(d==='echo'){goTo('s4');setNav('ni-echo');pausePlayer();startEcho();setTimeout(()=>['alone-h','alone-sub','alone-hint'].forEach(x=>document.getElementById(x)?.classList.add('show')),200);}else if(d==='memo'){pausePlayer();stopSnd(1.5);buildMemoList();goTo('s5');setNav('ni-memo');}}
function goS2(){
  if(!selFreq)return;const d=LD[selFreq],hex=d.col;
  const ll=document.getElementById('s2-lnum');if(ll){ll.textContent=`line ${selFreq}`;ll.style.color=hex;}
  bakeGrain(220,220);applyBlobs(LW.map(w=>({hex,weight:w,emotion:d.w})));setTint(hex,hex,true);
  const ew=document.getElementById('s2-emo');if(ew){ew.textContent=d.w;ew.style.color=hex;}
  setKWs('s2-kws',d.tags,hex);
  const sv=document.getElementById('s2-save');if(sv){sv.disabled=true;}
  buildBars('s2-bars');document.getElementById('s2-bpm').textContent=`${BPM[selFreq-1]||70} BPM`;
  if(s2SndOn){stopSnd(.5);s2SndOn=false;stopBars('s2-bars');}
  soundUserOff=false;liveDial=null;liveKey='';clearTimeout(sndT);
  document.getElementById('s2-play-icon').innerHTML='<polygon points="5 3 19 12 5 21 5 3"/>';
  stopVoice(true);recState='idle';clearTimeout(recTimer);document.getElementById('rec-btn').classList.remove('recording','processing');document.getElementById('rec-lbl').textContent='Record';document.getElementById('rec-status').style.opacity='0';
  const ta=document.getElementById('s2-ta');if(ta)ta.value='';lastColour=null;goTo('s2');setNav('ni-line');
}
let s3On=false;
function setS3Icon(){const i=document.getElementById('s3-play-icon');if(!i)return;i.innerHTML=s3On?'<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>':'<polygon points="5 3 19 12 5 21 5 3"/>';}
function toggleS3Sound(){
  if(!selFreq)return;
  if(s3On){soundUserOff=true;stopSnd(.8);s3On=false;barOn=false;}
  else{soundUserOff=false;startSnd((lastColour&&lastColour.dial)||liveDial||selFreq);s3On=true;barOn=true;}
  setS3Icon();
}
async function goS3(){
  stopVoice(true);
  if(!lastColour)await analyseJ(document.getElementById('s2-ta')?.value.trim()||'(no entry)');
  const res=lastColour,d=LD[selFreq];const ds=new Date().toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'});const note=document.getElementById('s2-ta')?.value.trim()||null;
  const blobs=res.blobs||[{emotion:res.dominant_word,hex:res.dominant_hex,weight:1}];const dominant=blobs[0];
  const entry={n:selFreq,date:ds,note,blended:dominant.hex,gradHex:blobs.map(b=>b.hex),blobs};
  entry.id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);entry.ts=Date.now();userMemos.unshift(entry);memoData.unshift(entry);saveMemos();echoJust=entry.id;EchoStore.add(entry);
  document.getElementById('s3-bg').style.background=`radial-gradient(ellipse at 50% 20%,${dominant.hex}20 0%,transparent 60%)`;
  document.getElementById('s3-lnum').textContent=`line ${selFreq} · ${d.w}`;document.getElementById('s3-lnum').style.color=dominant.hex;
  document.getElementById('s3-lbl').textContent=`line ${selFreq}`;drawLeak('s3-leak',rgbObj(dominant.hex),.42,rgbObj((blobs[1]||dominant).hex));
  const lkl=document.getElementById('s3-leak-lbl');if(lkl){lkl.textContent=d.leakName;lkl.classList.add('show');}
  document.getElementById('s3-chip-dot').style.background=dominant.hex;document.getElementById('s3-hex').textContent=dominant.hex;document.getElementById('s3-sub').textContent=res.description||d.w;document.getElementById('s3-chip').classList.add('show');
  const leg=document.getElementById('s3-legend');if(leg){leg.innerHTML='';blobs.forEach(b=>{const li=document.createElement('div');li.className='leg-item';li.innerHTML=`<div class="leg-dot" style="background:${b.hex}"></div><span class="leg-lbl">${b.emotion} ${Math.round(b.weight*100)}%</span>`;leg.appendChild(li);});leg.classList.add('show');}
  const tgEl=document.getElementById('s3-tags');if(tgEl){tgEl.innerHTML='';(res.detected_emotions||d.tags).slice(0,5).forEach(t=>{const el=document.createElement('span');el.className='s3-tag';el.textContent=t;tgEl.appendChild(el);});tgEl.classList.add('show');}
  buildBars('s3-bars');barHex=dominant.hex;s3On=!soundUserOff;if(s3On&&!isMuted)startSnd(res.dial||liveDial||selFreq);barOn=s3On;setS3Icon();runBars('s3-bars');
  document.getElementById('s3-receipt')?.classList.add('show');document.getElementById('s3-download')?.classList.add('show');
  const en=document.getElementById('s3-enter');if(en){en.style.backgroundColor=dominant.hex;en.classList.add('show');}
  goTo('s3');setNav(null);
}
function goEcho(){goTo('s4');setNav('ni-echo');startEcho();setTimeout(()=>['alone-h','alone-sub','alone-hint'].forEach(x=>document.getElementById(x)?.classList.add('show')),200);}

// ═══════════════════════════════════════
// RECEIPT
// ═══════════════════════════════════════
function generateReceipt(entry){
  const d=LD[entry.n],blobs=entry.blobs||[{emotion:d.w,hex:entry.blended,weight:1}];
  const bpm=BPM[entry.n-1]||70;
  const scapes={1:'dark sub drone — minor cluster',2:'slow minor third drone',3:'hollow fifth — long decay',4:'open fifth — still',5:'pure fifth — floating',6:'warm major third pad',7:'rooted major — clear partials',8:'bright harmonic series',9:'full overtone field'};
  const energy=['low','low','low–medium','low–medium','medium','medium','medium–high','medium–high','high'];
  const quad=QUAD;
  const bar=w=>'█'.repeat(Math.round(w*16))+'░'.repeat(16-Math.round(w*16));
  let md=`# The Line — your check-in\n${entry.date}\n\n---\n\n## line ${entry.n} · ${d.w}\n\n`;
  if(entry.note)md+=`> ${entry.note}\n\n`;
  md+=`---\n\n## how you were feeling\n\n`;
  blobs.forEach(b=>md+=`${b.hex}  ${b.emotion.padEnd(14)}${String(Math.round(b.weight*100)+'%').padEnd(6)}${bar(b.weight)}\n`);
  md+=`\ndominant colour  ${blobs[0].hex}\nfilm tone        ${LD[entry.n].leakName.toUpperCase()}\n\n---\n\n`;
  md+=`## your soundscape\n\n${scapes[entry.n]||'ambient'}\n${bpm} BPM · ${energy[entry.n-1]||'medium'} energy\n\n---\n\n`;
  md+=`## about this moment\n\nRussell's Circumplex — ${quad[entry.n]||'neutral'}\n\n---\n\n*The Line · UTS Interaction Design · Tech Fest 2026*\n`;
  return md;
}
function downloadReceipt(){const entry=memoData[0];if(!entry)return;const blob=new Blob([generateReceipt(entry)],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`the-line-${(entry.date||'today').replace(/[\s,]/g,'-').toLowerCase()}-line${entry.n}.md`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);document.body.removeChild(a);},2000);}
function downloadCard(){
  const entry=memoData[0];if(!entry)return;const d=LD[entry.n],blobs=entry.blobs||[{emotion:d.w,hex:entry.blended,weight:1}];const lc=LD[entry.n].leak,ln=LD[entry.n].leakName;
  const W=800,H=1000;const off=document.createElement('canvas');off.width=W;off.height=H;off.style.cssText='position:fixed;left:-9999px;top:-9999px;';document.body.appendChild(off);
  const ctx=off.getContext('2d');ctx.fillStyle='#EDEAE4';ctx.fillRect(0,0,W,H);
  const g1=ctx.createRadialGradient(0,0,0,0,0,W*.9);g1.addColorStop(0,`rgba(${lc.r},${lc.g},${lc.b},.22)`);g1.addColorStop(1,`rgba(${lc.r},${lc.g},${lc.b},0)`);ctx.fillStyle=g1;ctx.fillRect(0,0,W,H);
  const orbX=W/2,orbY=320,orbR=180;const offs=[[0,0],[-30,20],[22,-18],[10,28]];
  blobs.forEach((b,i)=>{const[r,g,bl]=hexToRgb(b.hex);const[ox,oy]=offs[i]||[0,0];const cx=orbX+ox,cy=orbY+oy,R=orbR*Math.max(.4,b.weight)*1.8;for(let p=0;p<3;p++){const bloom=ctx.createRadialGradient(cx-R*.1,cy-R*.12,0,cx,cy,R*(.85+p*.2));bloom.addColorStop(0,`rgba(${Math.min(255,r+30)},${Math.min(255,g+24)},${Math.min(255,bl+20)},${(.50*b.weight/(p+1)).toFixed(3)})`);bloom.addColorStop(1,`rgba(${r},${g},${bl},0)`);ctx.globalCompositeOperation='source-over';ctx.beginPath();ctx.arc(cx,cy,R*(.85+p*.2),0,Math.PI*2);ctx.fillStyle=bloom;ctx.fill();}ctx.globalCompositeOperation='color-dodge';const core=ctx.createRadialGradient(cx,cy,0,cx,cy,R*.48);core.addColorStop(0,`rgba(${Math.min(255,r+80)},${Math.min(255,g+70)},${Math.min(255,bl+60)},${(.38*b.weight).toFixed(3)})`);core.addColorStop(1,`rgba(${r},${g},${bl},0)`);ctx.beginPath();ctx.arc(cx,cy,R*.48,0,Math.PI*2);ctx.fillStyle=core;ctx.fill();ctx.globalCompositeOperation='source-over';});
  ctx.globalCompositeOperation='destination-in';ctx.beginPath();ctx.arc(orbX,orbY,orbR,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,1)';ctx.fill();ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#EDEAE4';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';
  const legY=orbY+orbR+52;const slotW=Math.min(190,W*.9/blobs.length),startX=W/2-(blobs.length*slotW)/2;
  blobs.forEach((b,i)=>{const lx=startX+i*slotW+slotW/2;ctx.beginPath();ctx.arc(lx,legY,9,0,Math.PI*2);ctx.fillStyle=b.hex;ctx.fill();ctx.font='400 19px Georgia,serif';ctx.fillStyle='rgba(61,56,48,.55)';ctx.textAlign='center';ctx.fillText(`${b.emotion} ${Math.round(b.weight*100)}%`,lx,legY+26);});
  ctx.font='500 11px Arial,sans-serif';ctx.fillStyle='rgba(61,56,48,.28)';ctx.textAlign='center';ctx.fillText(ln.toUpperCase(),W/2,legY+56);
  ctx.strokeStyle='rgba(61,56,48,.08)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(80,legY+74);ctx.lineTo(W-80,legY+74);ctx.stroke();
  if(entry.note){ctx.font='300 italic 27px Georgia,serif';ctx.fillStyle='rgba(61,56,48,.58)';ctx.textAlign='center';const words=entry.note.split(' ');let line='',lines=[],maxW=W-180;words.forEach(w=>{const test=line+w+' ';if(ctx.measureText(test).width>maxW&&line){lines.push(line.trim());line=w+' ';}else line=test;});if(line)lines.push(line.trim());lines.forEach((l,i)=>ctx.fillText(l,W/2,legY+118+i*40));}
  ctx.font='400 17px Arial,sans-serif';ctx.fillStyle='rgba(61,56,48,.25)';ctx.textAlign='left';ctx.fillText(`line ${entry.n} — ${d.w}`,72,H-52);ctx.textAlign='right';ctx.fillText(entry.date,W-72,H-52);ctx.font='300 15px Arial,sans-serif';ctx.fillStyle='rgba(61,56,48,.15)';ctx.textAlign='center';ctx.fillText('The Line',W/2,H-22);
  try{off.toBlob(blob=>{document.body.removeChild(off);if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`the-line-${(entry.date||'today').replace(/[\s,]/g,'-').toLowerCase()}.png`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);document.body.removeChild(a);},2000);},'image/png');}catch(e){document.body.removeChild(off);}
}

