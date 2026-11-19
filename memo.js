/* The Line — Memo list, turntable player, Bluetooth panel. */
// ═══════════════════════════════════════
// MEMO
// ═══════════════════════════════════════
let mFilt='all';
function buildMemoFilter(){const bar=document.getElementById('m-filter');if(!bar)return;bar.innerHTML='';const all=document.createElement('button');all.className='mf-pill'+(mFilt==='all'?' active':'');all.textContent='All';if(mFilt==='all'){all.style.background='var(--text)';all.style.color='#fff';}all.onclick=()=>{mFilt='all';buildMemoFilter();applyMFilter();};bar.appendChild(all);[...new Set(memoData.map(m=>m.n))].forEach(n=>{const hex=LD[n].col;const btn=document.createElement('button');btn.className='mf-pill'+(mFilt===n?' active':'');btn.textContent=n;if(mFilt===n){btn.style.background=hex;btn.style.color='#fff';}btn.onclick=()=>{mFilt=n;buildMemoFilter();applyMFilter();};bar.appendChild(btn);});}
function applyMFilter(){document.querySelectorAll('.memo-card').forEach(c=>c.classList.toggle('hidden',mFilt!=='all'&&parseInt(c.dataset.n)!==mFilt));}
function buildMemoList(){const list=document.getElementById('memo-list');if(!list)return;list.innerHTML='';memoData.forEach((s,idx)=>{const d=LD[s.n],cid=`mvc-${idx}`;const card=document.createElement('div');card.className='memo-card';card.dataset.n=s.n;card.innerHTML=`<div class="mc-inner"><div class="mc-disc-wrap"><canvas id="${cid}" width="50" height="50" style="width:50px;height:50px;display:block;border-radius:50%"></canvas></div><div class="mc-meta"><div class="mc-date">${s.date} · line ${s.n}</div><div class="mc-word">${d.w}</div>${s.note?`<div class="mc-note">${esc(s.note)}</div>`:''}</div><span class="mc-idx">${idx+1}/${memoData.length}</span></div>`;card.addEventListener('click',()=>goS6(idx));list.appendChild(card);requestAnimationFrame(()=>drawVinyl(cid,50,s.blended,s.gradHex));});buildMemoFilter();applyMFilter();buildMemoFoot();}
function drawVinyl(cvId,size,hex,grd){const cv=document.getElementById(cvId);if(!cv)return;const ctx=cv.getContext('2d'),W=size,cx=W/2,cy=W/2;ctx.clearRect(0,0,W,W);ctx.save();ctx.beginPath();ctx.arc(cx,cy,cx,0,Math.PI*2);ctx.clip();const h=hex||'#C2B89A',g1=grd?.[0]||h,g2=grd?.[1]||h;const rg=ctx.createRadialGradient(cx*.55,cy*.55,0,cx,cy,cx);rg.addColorStop(0,g1+'ee');rg.addColorStop(.45,h+'cc');rg.addColorStop(1,g2+'88');ctx.fillStyle=rg;ctx.fillRect(0,0,W,W);ctx.globalAlpha=.07;for(let r=cx*.18;r<cx*.48;r+=5){ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='#000';ctx.lineWidth=.8;ctx.stroke();}ctx.globalAlpha=1;const sh=ctx.createRadialGradient(cx*.7,cy*.7,0,cx,cy,cx);sh.addColorStop(0,'rgba(255,255,255,0.18)');sh.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sh;ctx.fillRect(0,0,W,W);ctx.restore();ctx.beginPath();ctx.arc(cx,cy,cx*.04,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fill();}

// ═══════════════════════════════════════
// PLAYER
// ═══════════════════════════════════════
let curTrack=0,isPlay=false,vAngle=0,vRAF=null,progS=0,progIv=null;const TDUR=180;
function goS6(idx){curTrack=idx;loadTrack(idx);goTo('s6');setNav('ni-memo');}
function loadTrack(idx){
  const s=memoData[idx],d=LD[s.n],hex=s.blended||d.col;
  document.getElementById('s6-wash').style.background=`radial-gradient(ellipse at 50% 28%,${hex}25 0%,transparent 60%)`;
  drawVinyl('tt-cv',220,s.blended,s.gradHex);
  document.getElementById('p-date').textContent=s.date;document.getElementById('p-word').textContent=d.w;document.getElementById('p-note').textContent=s.note||'';
  const ps=document.getElementById('p-strip');if(ps){const gh=s.gradHex||[hex];ps.style.background=gh.length>1?`linear-gradient(to right,${gh.join(',')})`:hex;}
  document.getElementById('p-hex').textContent=hex;const pt=document.getElementById('p-tags');if(pt)pt.innerHTML=d.tags.map(t=>`<span class="p-tag">${t}</span>`).join('');
  document.getElementById('p-count').textContent=`${idx+1} / ${memoData.length}`;
  const pf=document.getElementById('prog-fill'),pth=document.getElementById('prog-thumb');if(pf)pf.style.background=hex;if(pth)pth.style.background=hex;
  progS=0;updProg();pausePlayer();
}
function startPlay(){
  if(isPlay)return;isPlay=true;
  document.getElementById('play-icon').style.display='none';document.getElementById('pause-icon').style.display='block';document.getElementById('tt-arm').classList.add('playing');
  const s=memoData[curTrack];
  if(s){if(!_AC)getAC();const go=()=>{sndTok++;stopSnd(1.5);setTimeout(()=>{if(!rdy())return;const nd=[];try{(MEMO_SCAPES[s.n]||MEMO_SCAPES[5])(nd);}catch(e){return;}_MG.gain.cancelScheduledValues(now());_MG.gain.setValueAtTime(0,now());if(!isMuted)_MG.gain.linearRampToValueAtTime(.60,now()+4);sndNodes=nd;sndDial=`memo-${s.n}`;},800);};if(_AC&&_AC.state==='suspended')_AC.resume().then(go).catch(()=>{});else go();}
  spinV();startProg();
}
function pausePlayer(){if(!isPlay)return;isPlay=false;document.getElementById('play-icon').style.display='block';document.getElementById('pause-icon').style.display='none';document.getElementById('tt-arm').classList.remove('playing');cancelAnimationFrame(vRAF);vRAF=null;clearInterval(progIv);stopSnd(1.5);}
function spinV(){const disc=document.getElementById('tt-disc');function f(){if(!isPlay)return;vAngle=(vAngle+.6)%360;if(disc)disc.style.transform=`rotate(${vAngle}deg)`;vRAF=requestAnimationFrame(f);}f();}
function startProg(){clearInterval(progIv);progIv=setInterval(()=>{if(!isPlay)return;progS=Math.min(TDUR,progS+1);updProg();if(progS>=TDUR)nextTrack();},1000);}
function updProg(){const pct=(progS/TDUR)*100;const pf=document.getElementById('prog-fill');if(pf)pf.style.width=pct+'%';const m=Math.floor(progS/60),s=progS%60;document.getElementById('prog-el').textContent=`${m}:${s<10?'0'+s:s}`;}
function prevTrack(){pausePlayer();curTrack=(curTrack-1+memoData.length)%memoData.length;loadTrack(curTrack);}
function nextTrack(){pausePlayer();curTrack=(curTrack+1)%memoData.length;loadTrack(curTrack);}

// ═══════════════════════════════════════
// BLUETOOTH
// ═══════════════════════════════════════
let btOpen=false,btPaired=null,btScanT=null,btCTs={},btPending=null;
function btLabel(){const pill=document.getElementById('bt-pill'),txt=document.getElementById('bt-txt');if(!pill||!txt)return;
  const dev=btPaired?BTDEVS.find(d=>d.id===btPaired):null;
  txt.textContent=btOpen&&!dev&&document.getElementById('bt-scan').style.display==='flex'?'scanning…':(dev?dev.name:'bluetooth');
  pill.classList.toggle('on',!!dev||btOpen);}
// Opening / closing the panel never changes the connection. Disconnect = tap "connected" on the device.
function openBt(){
  btOpen=true;const scan=document.getElementById('bt-scan'),devs=document.getElementById('bt-devs');
  document.getElementById('bt-panel').classList.add('open');clearTimeout(btScanT);
  if(btPaired){if(scan)scan.style.display='none';renderBtDevs();}                 // already connected: show the list straight away
  else{if(scan)scan.style.display='flex';if(devs)devs.innerHTML='';btScanT=setTimeout(()=>{if(scan)scan.style.display='none';renderBtDevs();btLabel();},2000);}
  btLabel();
}
function closeBt(){
  btOpen=false;clearTimeout(btScanT);const scan=document.getElementById('bt-scan');if(scan)scan.style.display='none';
  document.getElementById('bt-panel').classList.remove('open');btLabel();
}
function toggleBt(){btOpen?closeBt():openBt();}
function renderBtDevs(){const devs=document.getElementById('bt-devs');if(!devs)return;devs.innerHTML='';BTDEVS.forEach(dev=>{const p=btPaired===dev.id,c=btPending===dev.id;const row=document.createElement('div');row.className='bt-dev'+(p?' paired':'');row.innerHTML=`<div><div class="bt-dn">${dev.name}</div><div class="bt-dt">${dev.type}</div></div><button class="bt-cb ${p?'paired':''}" onclick="btConn('${dev.id}')">${p?'connected':c?'connecting…':'connect'}</button>`;devs.appendChild(row);});}
function btConn(id){
  if(btPaired===id){btPaired=null;renderBtDevs();btLabel();return;}                // tap "connected" = disconnect
  clearTimeout(btCTs[id]);btPending=id;renderBtDevs();
  btCTs[id]=setTimeout(()=>{btPaired=id;btPending=null;renderBtDevs();btLabel();},1400);
}

