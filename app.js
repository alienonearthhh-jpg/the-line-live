/* The Line — Wire-up of buttons, support sheet, boot. */
// ═══════════════════════════════════════
// WIRE UP
// ═══════════════════════════════════════
document.getElementById('call-btn').addEventListener('click',goS2);
document.getElementById('s2-back-btn').addEventListener('click',()=>{goTo('s1');setNav('ni-line');});
document.getElementById('s2-x-btn').addEventListener('click',()=>{goTo('s1');setNav('ni-line');});
document.getElementById('s2-save').addEventListener('click',goS3);
document.getElementById('s2-play-btn').addEventListener('click',toggleS2Sound);
document.getElementById('rec-btn').addEventListener('click',toggleRec);
document.getElementById('s3-skip').addEventListener('click',goEcho);
document.getElementById('s3-enter').addEventListener('click',goEcho);
document.getElementById('s3-play-btn').addEventListener('click',toggleS3Sound);
document.getElementById('s3-receipt').addEventListener('click',downloadReceipt);
document.getElementById('s3-download').addEventListener('click',downloadCard);
document.getElementById('s4-memo-btn').addEventListener('click',()=>{pausePlayer();stopSnd(1.5);buildMemoList();goTo('s5');setNav('ni-memo');});
document.getElementById('s4-dial-btn').addEventListener('click',()=>{goTo('s1');setNav('ni-line');});
document.getElementById('s6-back-btn').addEventListener('click',()=>{pausePlayer();buildMemoList();goTo('s5');setNav('ni-memo');});
document.getElementById('play-btn').addEventListener('click',()=>isPlay?pausePlayer():startPlay());
document.getElementById('prev-btn').addEventListener('click',prevTrack);
document.getElementById('next-btn').addEventListener('click',nextTrack);
document.getElementById('prog-track').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect();progS=Math.round(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*TDUR);updProg();});
document.getElementById('bt-pill').addEventListener('click',toggleBt);
document.getElementById('listen-ov').addEventListener('click',e=>{if(Date.now()-lOpenedAt<600)return;if(e.target===e.currentTarget||e.target.id==='listen-ov-cv')closeListen();});
document.getElementById('l-exit').addEventListener('click',closeListen);
document.getElementById('l-play').addEventListener('click',toggleLPlay);

// ═══════════════════════════════════════
// SUPPORT SHEET
// ═══════════════════════════════════════
function openSupport(){
  const ov=document.getElementById('support-overlay');
  const sh=document.getElementById('support-sheet');
  if(!ov||!sh)return;
  ov.style.display='flex';
  requestAnimationFrame(()=>sh.style.transform='translateY(0)');
}
function closeSupport(){
  const ov=document.getElementById('support-overlay');
  const sh=document.getElementById('support-sheet');
  if(!ov||!sh)return;
  sh.style.transform='translateY(100%)';
  setTimeout(()=>ov.style.display='none',420);
}
function setTab(id){
  document.querySelectorAll('.stab-panel').forEach(p=>p.style.display='none');
  document.getElementById(`tab-${id}`).style.display='block';
  document.querySelectorAll('.stab').forEach(t=>t.classList.remove('active'));
  event.target.classList.add('active');
}
document.getElementById('support-overlay').addEventListener('click',e=>{if(e.target===document.getElementById('support-overlay'))closeSupport();});

// Mute button
function muteIconOn(){return`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;}
function muteIconOff(){return`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;}
function toggleMute(){isMuted=!isMuted;if(rdy()){_MG.gain.cancelScheduledValues(now());if(isMuted)_MG.gain.linearRampToValueAtTime(0,now()+.4);else _MG.gain.linearRampToValueAtTime(.68,now()+.4);}const btn=document.getElementById('mute-btn');if(btn)btn.innerHTML=isMuted?muteIconOff():muteIconOn();}
const mb=document.getElementById('mute-btn');if(mb){mb.innerHTML=muteIconOn();mb.addEventListener('click',toggleMute);}
