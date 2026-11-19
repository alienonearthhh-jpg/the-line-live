/* The Line — Web Audio engine: drones, soundscapes, BPM. Pure synthesis, no audio files. */
// ═══════════════════════════════════════
// AUDIO ENGINE
// ═══════════════════════════════════════
let _AC=null,_MG=null,sndNodes=[],sndDial=null,isMuted=false,sndTok=0;
function getAC(){if(_AC)return _AC;try{_AC=new(window.AudioContext||window.webkitAudioContext)();_MG=_AC.createGain();_MG.gain.value=0;const lp=_AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1500;lp.Q.value=.4;_MG.connect(lp);lp.connect(_AC.destination);}catch(e){_AC=null;_MG=null;}return _AC;}
function rdy(){return _AC&&_MG&&_AC.state!=='closed';}
function now(){return _AC?_AC.currentTime:0;}
function mkRev(dur,dec){if(!rdy())return null;const len=_AC.sampleRate*dur,buf=_AC.createBuffer(2,len,_AC.sampleRate);for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,dec);}const cv=_AC.createConvolver();cv.buffer=buf;return cv;}
function wireRev(rev,vol){if(!rdy()||!rev)return;const g=_AC.createGain();g.gain.value=vol;rev.connect(g);g.connect(_MG);}
function droneVoice(freq,amp,lfoRate,lfoDepth,detune,nd){
  if(!rdy())return null;
  const o1=_AC.createOscillator(),o2=_AC.createOscillator();
  o1.type='sine';o2.type='sine';o1.frequency.value=freq;o2.frequency.value=freq*(detune||1.0015);
  const g=_AC.createGain();g.gain.value=0;g.gain.linearRampToValueAtTime(amp,now()+4.5);
  const lfo=_AC.createOscillator(),lg=_AC.createGain();lfo.type='sine';lfo.frequency.value=lfoRate;lg.gain.value=amp*lfoDepth;
  lfo.connect(lg);lg.connect(g.gain);lfo.start();o1.connect(g);o2.connect(g);o1.start();o2.start();
  nd.push(o1,o2,lfo);return g;
}
function pad(root,intervals,amps,lfoRates,nd,rev){
  intervals.forEach((ratio,i)=>{
    const g=droneVoice(root*ratio,amps[i]||0.04,lfoRates?.[i]||0.012,0.3,1.0012+i*.0008,nd);
    if(!g)return;if(rev)try{g.connect(rev);}catch(e){}g.connect(_MG);nd.push(g);
  });
}
function sparsePartial(freq,amp,imin,imax,nd,rev){
  if(!rdy())return;imin*=1.7;imax*=1.7;amp*=.75;let stopped=false,next=now()+1+Math.random()*imin;
  function ring(){if(stopped||!rdy())return;const t=Math.max(next,now()+.1);const o=_AC.createOscillator(),g=_AC.createGain();o.type='sine';o.frequency.value=freq*(1+Math.random()*.015-.0075);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+3+Math.random()*4);o.connect(g);if(rev)try{g.connect(rev);}catch(e){}g.connect(_MG);o.start(t);o.stop(t+8);next=t+imin+Math.random()*(imax-imin);setTimeout(ring,Math.max(400,(next-now())*1000-200));}
  ring();nd.push({stop:()=>{stopped=true;}});
}
function breathNoise(cutoff,amp,lfoRate,nd,rev){
  if(!rdy())return;const len=_AC.sampleRate*8,buf=_AC.createBuffer(2,len,_AC.sampleRate);for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;}
  const src=_AC.createBufferSource();src.buffer=buf;src.loop=true;const flt=_AC.createBiquadFilter();flt.type='lowpass';flt.frequency.value=cutoff;flt.Q.value=0.7;
  const g=_AC.createGain();g.gain.value=0;g.gain.linearRampToValueAtTime(amp,now()+6);
  const lfo=_AC.createOscillator(),lg=_AC.createGain();lfo.type='sine';lfo.frequency.value=lfoRate;lg.gain.value=amp*.45;lfo.connect(lg);lg.connect(g.gain);lfo.start();
  src.connect(flt);flt.connect(g);if(rev)try{g.connect(rev);}catch(e){}g.connect(_MG);src.start();nd.push(src,lfo,g);
}
function tremolo(freq,amp,rate,depth,nd,rev){
  if(!rdy())return;const o=_AC.createOscillator();o.type='sine';o.frequency.value=freq;
  const g=_AC.createGain();g.gain.value=0;g.gain.linearRampToValueAtTime(amp,now()+5);
  const tr=_AC.createOscillator(),tg=_AC.createGain();tr.type='sine';tr.frequency.value=rate;tg.gain.value=amp*depth;tr.connect(tg);tg.connect(g.gain);tr.start();
  o.connect(g);if(rev)try{g.connect(rev);}catch(e){}g.connect(_MG);o.start();nd.push(o,tr,g);
}
// Root frequencies
const R=[55,58.27,61.74,65.41,69.30,73.42,82.41,87.31,98.00];
// Live soundscapes
const SCAPES={
  1:nd=>{const rev=mkRev(6.5,3.4);wireRev(rev,.70);pad(R[0],[1,1.067,1.5,2],[.08,.05,.04,.025],[.008,.011,.009,.013],nd,rev);breathNoise(160,.07,.03,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  2:nd=>{const rev=mkRev(6,3.2);wireRev(rev,.65);pad(R[1],[1,1.189,1.5,2],[.07,.05,.04,.025],[.010,.008,.012,.009],nd,rev);sparsePartial(R[1]*4,.028,14,28,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  3:nd=>{const rev=mkRev(5.5,3.0);wireRev(rev,.60);pad(R[2],[1,1.414,2],[.065,.04,.025],[.009,.007,.011],nd,rev);tremolo(R[2]*.5,.04,.015,.6,nd,rev);sparsePartial(R[2]*3.5,.022,20,40,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  4:nd=>{const rev=mkRev(5,2.7);wireRev(rev,.58);pad(R[3],[1,1.5,2],[.055,.038,.022],[.013,.010,.009],nd,rev);sparsePartial(R[3]*4,.022,18,35,nd,rev);breathNoise(300,.025,.05,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  5:nd=>{const rev=mkRev(4.8,2.5);wireRev(rev,.55);pad(R[4],[1,1.5,1.875,2],[.052,.038,.02,.025],[.011,.009,.014,.010],nd,rev);sparsePartial(R[4]*3,.028,12,25,nd,rev);sparsePartial(R[4]*5,.015,22,45,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  6:nd=>{const rev=mkRev(4.5,2.4);wireRev(rev,.52);pad(R[5],[1,1.25,1.5,2],[.052,.040,.032,.022],[.012,.010,.013,.009],nd,rev);sparsePartial(R[5]*4,.030,10,22,nd,rev);sparsePartial(R[5]*5,.018,18,35,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  7:nd=>{const rev=mkRev(4,2.3);wireRev(rev,.50);pad(R[6],[1,1.25,1.5,2,2.25],[.048,.040,.032,.022,.014],[.010,.013,.009,.012,.015],nd,rev);tremolo(R[6]*4,.022,.035,.5,nd,rev);sparsePartial(R[6]*6,.016,15,30,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  8:nd=>{const rev=mkRev(3.5,2.1);wireRev(rev,.48);pad(R[7],[1,1.25,1.5,2,2.5,3],[.045,.038,.030,.022,.015,.010],[.014,.012,.010,.015,.011,.013],nd,rev);sparsePartial(R[7]*5,.028,8,18,nd,rev);tremolo(R[7]*3,.018,.04,.45,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  9:nd=>{const rev=mkRev(3,2.0);wireRev(rev,.45);pad(R[8],[1,1.25,1.5,2,2.5,3,4],[.042,.036,.030,.022,.015,.010,.006],[.015,.012,.013,.010,.014,.011,.016],nd,rev);sparsePartial(R[8]*5,.030,6,14,nd,rev);sparsePartial(R[8]*6,.020,10,22,nd,rev);tremolo(R[8]*3,.016,.045,.4,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
};
// ── LIFE LAYER ─────────────────────────────────────────────────────────
// Sits on top of each live scape (drones stay exactly as they were).
// Same logic as the dial: tempo follows BPM[], low dials = minor, slow, dark,
// sparse; high dials = major, quicker, brighter, denser.
const LIFE_SCALE={1:[1,1.2,1.5,1.8],2:[1,1.2,1.333,1.5,1.8],3:[1,1.2,1.333,1.5,1.8],4:[1,1.125,1.333,1.5,1.778],5:[1,1.125,1.5,1.667],6:[1,1.125,1.25,1.5,1.667],7:[1,1.125,1.25,1.5,1.667,2],8:[1,1.125,1.25,1.5,1.667,1.875],9:[1,1.125,1.25,1.5,1.667,1.875,2]};
const LIFE_BEATS=[4,4,4,3.5,3.5,3,3,3,2.5];                   // step length in beats (slow)
const LIFE_PROB=[.20,.22,.24,.26,.28,.30,.32,.34,.36];        // chance a step plays a note (sparse)
const LIFE_OCT=[[2],[2],[2,4],[2,4],[2,4],[2,4],[2,4],[2,4],[2,4]]; // octave multiplier pool (low, warm)
function lifePluck(freq,t,amp,decay,bright,rev){
  if(!rdy())return;
  const o=_AC.createOscillator(),o2=_AC.createOscillator(),g=_AC.createGain(),f=_AC.createBiquadFilter();
  o.type='sine';o2.type='triangle';o.frequency.value=freq;o2.frequency.value=freq*2.003;
  f.type='lowpass';f.frequency.value=380+bright*500;f.Q.value=.3;
  const g2=_AC.createGain();g2.gain.value=.08+bright*.06;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp,t+.45);g.gain.exponentialRampToValueAtTime(.0001,t+decay);
  o.connect(f);o2.connect(g2);g2.connect(f);f.connect(g);
  let out=g;if(_AC.createStereoPanner){const p=_AC.createStereoPanner();p.pan.value=(Math.random()*2-1)*.7;g.connect(p);out=p;}
  if(rev)try{out.connect(rev);}catch(e){}out.connect(_MG);
  o.start(t);o2.start(t);o.stop(t+decay+.1);o2.stop(t+decay+.1);
}
function addLife(n,nd){
  if(!rdy())return;
  const i=n-1,bright=i/8,beat=60/(BPM[i]||70),step=beat*LIFE_BEATS[i];
  const scale=LIFE_SCALE[n]||LIFE_SCALE[5],octs=LIFE_OCT[i];
  const rev=mkRev(3+((8-i)*.25),2.2);wireRev(rev,.55);
  let stopped=false,next=now()+1.2,last=-1,count=0;
  function tick(){
    if(stopped||!rdy())return;
    const t=Math.max(next,now()+.05);
    if(Math.random()<LIFE_PROB[i]){
      let k;do{k=Math.floor(Math.random()*scale.length);}while(k===last&&scale.length>1);last=k;
      const oct=octs[Math.floor(Math.random()*octs.length)];
      const amp=.016+bright*.008+Math.random()*.006;
      lifePluck(R[i]*scale[k]*oct,t,amp,4.5+(1-bright)*2,bright,rev);   // one soft, slow-blooming note
    }
    count++;next=t+step;
    setTimeout(tick,Math.max(120,(next-now())*1000-250));
  }
  tick();
  // moving air: a breath of noise whose brightness and speed follow the dial
  breathNoise(300+i*50,.008+bright*.005,.025+bright*.02,nd,rev);
  nd.push({stop:()=>{stopped=true;try{if(rev)rev.disconnect();}catch(e){}}});
}
// Memo soundscapes — memory treatment: tape warble, slow attack, long reverb
function memoVoice(freq,amp,attack,warpRate,nd){
  if(!rdy())return null;
  const o1=_AC.createOscillator(),o2=_AC.createOscillator();o1.type='sine';o2.type='sine';o1.frequency.value=freq;o2.frequency.value=freq*1.0008;
  const warp=_AC.createOscillator(),wg=_AC.createGain();warp.frequency.value=warpRate;wg.gain.value=freq*.003;warp.connect(wg);wg.connect(o1.frequency);warp.start();
  const g=_AC.createGain();g.gain.value=0;g.gain.linearRampToValueAtTime(amp,now()+attack);
  o1.connect(g);o2.connect(g);o1.start();o2.start();nd.push(o1,o2,warp,g);return g;
}
const MEMO_SCAPES={
  1:nd=>{const rev=mkRev(8,3.8);wireRev(rev,.72);[1,1.5,2].forEach((r,i)=>{const g=memoVoice(R[0]*r,[.05,.03,.018][i],7+i*1.5,.04+Math.random()*.02,nd);if(g&&rev)try{g.connect(rev);}catch(e){}if(g)g.connect(_MG);});sparsePartial(R[0]*3,.012,28,60,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  2:nd=>{const rev=mkRev(7.5,3.6);wireRev(rev,.70);[1,1.189,1.5].forEach((r,i)=>{const g=memoVoice(R[1]*r,[.045,.028,.018][i],8+i*2,.035+Math.random()*.025,nd);if(g&&rev)try{g.connect(rev);}catch(e){}if(g)g.connect(_MG);});sparsePartial(R[1]*4,.010,32,62,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  3:nd=>{const rev=mkRev(7,3.4);wireRev(rev,.68);[1,1.414,2].forEach((r,i)=>{const g=memoVoice(R[2]*r,[.042,.024,.016][i],7+i*1.8,.038+Math.random()*.02,nd);if(g&&rev)try{g.connect(rev);}catch(e){}if(g)g.connect(_MG);});sparsePartial(R[2]*3.5,.012,30,55,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  4:nd=>{const rev=mkRev(6.5,3.0);wireRev(rev,.65);[1,1.5,2].forEach((r,i)=>{const g=memoVoice(R[3]*r,[.038,.024,.014][i],7+i*2,.028+Math.random()*.018,nd);if(g&&rev)try{g.connect(rev);}catch(e){}if(g)g.connect(_MG);});sparsePartial(R[3]*4,.012,22,50,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  5:nd=>{const rev=mkRev(6,2.8);wireRev(rev,.60);[1,1.5,1.875,2].forEach((r,i)=>{const g=memoVoice(R[4]*r,[.035,.022,.013,.011][i],6.5+i*1.5,.032+Math.random()*.015,nd);if(g&&rev)try{g.connect(rev);}catch(e){}if(g)g.connect(_MG);});sparsePartial(R[4]*3,.014,20,44,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  6:nd=>{const rev=mkRev(5.5,2.6);wireRev(rev,.55);[1,1.25,1.5,2].forEach((r,i)=>{const g=memoVoice(R[5]*r,[.032,.022,.016,.012][i],6+i*1.5,.026+Math.random()*.016,nd);if(g&&rev)try{g.connect(rev);}catch(e){}if(g)g.connect(_MG);});sparsePartial(R[5]*4,.013,18,40,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  7:nd=>{const rev=mkRev(5,2.4);wireRev(rev,.52);[1,1.25,1.5,2,2.25].forEach((r,i)=>{const g=memoVoice(R[6]*r,[.028,.020,.016,.010,.007][i],5.5+i*1.2,.022+Math.random()*.014,nd);if(g&&rev)try{g.connect(rev);}catch(e){}if(g)g.connect(_MG);});sparsePartial(R[6]*4,.013,16,36,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  8:nd=>{const rev=mkRev(4.5,2.2);wireRev(rev,.50);[1,1.25,1.5,2,2.5].forEach((r,i)=>{const g=memoVoice(R[7]*r,[.026,.018,.014,.010,.007][i],5+i*1.2,.020+Math.random()*.012,nd);if(g&&rev)try{g.connect(rev);}catch(e){}if(g)g.connect(_MG);});sparsePartial(R[7]*5,.012,14,32,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
  9:nd=>{const rev=mkRev(4,2.0);wireRev(rev,.48);[1,1.25,1.5,2,2.5,3].forEach((r,i)=>{const g=memoVoice(R[8]*r,[.024,.018,.013,.010,.007,.004][i],4.5+i*1.0,.018+Math.random()*.010,nd);if(g&&rev)try{g.connect(rev);}catch(e){}if(g)g.connect(_MG);});sparsePartial(R[8]*5,.012,12,28,nd,rev);sparsePartial(R[8]*7,.008,22,44,nd,rev);nd.push({stop:()=>{try{if(rev)rev.disconnect();}catch(e){}}});},
};
function stopSnd(f=1.8){if(!rdy())return;_MG.gain.cancelScheduledValues(now());_MG.gain.setTargetAtTime(0,now(),f*.28);const ns=[...sndNodes];sndNodes=[];sndDial=null;setTimeout(()=>ns.forEach(n=>{try{if(typeof n.stop==='function')n.stop();}catch(e){}}),f*1000+400);}
// sndTok: only the most recent startSnd call is allowed to actually start sound, so rapid dial/keyword changes never stack layers
function startSnd(n,vol=0.68){
  if(!getAC()||!rdy())return;
  const tok=++sndTok;
  const go=()=>{if(tok!==sndTok)return;if(sndDial===n){if(!isMuted&&_MG)_MG.gain.setTargetAtTime(vol,now(),.9);return;}const had=sndNodes.length>0;if(had)stopSnd(2.0);setTimeout(()=>{if(tok!==sndTok||!rdy())return;const nd=[];try{(SCAPES[n]||SCAPES[5])(nd);addLife(SCAPES[n]?n:5,nd);}catch(e){return;}_MG.gain.cancelScheduledValues(now());_MG.gain.setValueAtTime(0,now());if(!isMuted)_MG.gain.linearRampToValueAtTime(vol,now()+5);sndNodes=nd;sndDial=n;},had?1400:80);};
  if(_AC.state==='suspended')_AC.resume().then(go).catch(()=>{});else go();
}

