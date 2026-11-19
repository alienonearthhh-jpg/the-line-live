/* The Line — Shared data: dial colours/words (LD), demo memos, memo persistence (localStorage). */
// ═══════════════════════════════════════
// DATA
// ═══════════════════════════════════════
const LD={
  1:{w:'overwhelmed',tags:['scattered','heavy','grief'],      col:'#5A7FA8',leak:{r:30,g:40,b:120},  leakName:'deep blue — cold, overwhelmed'},
  2:{w:'heavy',      tags:['quiet','carrying','still'],       col:'#7090B0',leak:{r:20,g:60,b:140},  leakName:'slate blue — weighted, carrying'},
  3:{w:'tired',      tags:['weary','foggy','slow'],           col:'#7AAAB5',leak:{r:40,g:80,b:120},  leakName:'dusty teal — muted, drained'},
  4:{w:'drained',    tags:['flat','numb','routine'],          col:'#9ABBA8',leak:{r:60,g:90,b:80},   leakName:'sage — hollow, going through it'},
  5:{w:'neutral',    tags:['steady','floating','between'],    col:'#C4B89A',leak:{r:120,g:100,b:60}, leakName:'warm amber — suspended, in-between'},
  6:{w:'okay',       tags:['present','open','grounded'],      col:'#8BCF9B',leak:{r:60,g:140,b:80},  leakName:'soft green — present, breathing'},
  7:{w:'grounded',   tags:['rooted','calm','clear'],          col:'#9ABF7E',leak:{r:80,g:150,b:60},  leakName:'warm green — rooted, calm'},
  8:{w:'good',       tags:['warmth','lighter','open'],        col:'#F4A261',leak:{r:220,g:100,b:30}, leakName:'orange — warmth, energy rising'},
  9:{w:'bright',     tags:['joyful','alive','full'],          col:'#E8764A',leak:{r:240,g:70,b:30},  leakName:'coral red — joyful, vibrant'},
};
const QUAD={1:'low valence, high arousal',2:'low valence, medium arousal',3:'low valence, low arousal',4:'low–mid valence, low arousal',5:'neutral centre',6:'mid-positive valence',7:'positive valence, medium arousal',8:'positive valence, medium–high arousal',9:'high valence, high arousal'};
const HOLE_COLS=['#7A7570','#A09890','#B0A898','#8FA08A','#7A9A82','#C49AB0','#D4B870','#E0905A','#C85A40'];
const BPM=[50,55,60,65,70,76,82,88,96];
const BTDEVS=[{id:'bt1',name:'AirPods Pro',type:'earbuds'},{id:'bt2',name:'Sony WH-1000XM5',type:'headphones'},{id:'bt3',name:'Bose QC45',type:'headphones'}];
const DEMO_MEMOS=[
  {n:5,date:'May 3, 2026',note:'"a simple day, but a good one."',blended:'#C2B89A',gradHex:['#C2B89A','#A8C4A2'],blobs:[{emotion:'neutral',hex:'#C4B89A',weight:.6},{emotion:'content',hex:'#A0C098',weight:.4}]},
  {n:2,date:'May 1, 2026',note:'"the hardest part is pretending."',blended:'#7090B0',gradHex:['#7090B0','#5A7FA8'],blobs:[{emotion:'sad',hex:'#7090C0',weight:.5},{emotion:'heavy',hex:'#6880B0',weight:.3},{emotion:'numb',hex:'#9ABBA8',weight:.2}]},
  {n:7,date:'Apr 28, 2026',note:null,blended:'#9ABF7E',gradHex:['#9ABF7E','#7BBFB5'],blobs:[{emotion:'grounded',hex:'#9ABF7E',weight:.7},{emotion:'peaceful',hex:'#A8C4A0',weight:.3}]},
  {n:4,date:'Apr 25, 2026',note:'"just going through it."',blended:'#A8C4A2',gradHex:['#A8C4A2','#C2B89A'],blobs:[{emotion:'flat',hex:'#9ABBA8',weight:.6},{emotion:'neutral',hex:'#C4B89A',weight:.4}]},
];
// Memos the visitor saves are kept on THIS device only (localStorage). No account, no server.
// If storage is blocked (private mode etc.) the app still works; memos just last until refresh.
const MEMO_KEY='theline.memos.v1';
function loadMemos(){try{const a=JSON.parse(localStorage.getItem(MEMO_KEY)||'[]');return Array.isArray(a)?a.filter(m=>m&&m.n>=1&&m.n<=9&&m.date&&m.blended).slice(0,30):[];}catch(e){return[];}}
function saveMemos(){try{localStorage.setItem(MEMO_KEY,JSON.stringify(userMemos.slice(0,30)));}catch(e){}}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
let userMemos=loadMemos();
let memoData=[...userMemos,...DEMO_MEMOS];
let clearArmed=false,clearT=null;
function clearMyMemos(){userMemos=[];saveMemos();memoData=[...DEMO_MEMOS];mFilt='all';clearArmed=false;buildMemoList();}
function buildMemoFoot(){
  const sc=document.querySelector('#s5 .scroller');if(!sc)return;
  let ft=document.getElementById('memo-foot');if(!ft){ft=document.createElement('div');ft.id='memo-foot';ft.style.cssText='text-align:center;padding:18px 0 6px;';sc.appendChild(ft);}
  if(!userMemos.length){ft.innerHTML='';return;}
  ft.innerHTML=`<p style="font-size:10px;color:var(--muted);margin-bottom:8px">Your memos are saved on this device only.</p><button id="memo-clear" style="font-family:var(--f);font-size:11px;font-weight:500;padding:8px 16px;border-radius:18px;border:1.5px solid rgba(0,0,0,0.12);background:transparent;color:var(--text);cursor:pointer">${clearArmed?'Tap again to delete my memos':'Clear my memos'}</button>`;
  document.getElementById('memo-clear').onclick=()=>{if(!clearArmed){clearArmed=true;buildMemoFoot();clearTimeout(clearT);clearT=setTimeout(()=>{clearArmed=false;buildMemoFoot();},3500);}else{clearTimeout(clearT);clearMyMemos();}};
}

