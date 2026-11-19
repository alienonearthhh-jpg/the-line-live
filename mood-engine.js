/* The Line — offline mood engine v2 (no AI, no network).
   Text in → for every recognised word: a dial (1–9, drives SOUND) and a
   colour (continuous, drives VISUALS).

   Colour theory — Russell's Circumplex (1980):
     valence (unpleasant ↔ pleasant)  → HUE   blue → teal → sage → yellow-green → amber
     arousal (deactivated ↔ activated) → SATURATION / depth (high = vivid, low = soft & washed)
   Each word group below carries [dial, valence, arousal]. Every word therefore
   lands on its own spot on the circumplex, so the colour range is continuous
   instead of 9 fixed swatches.

   Dial scale: 1 overwhelmed 2 heavy 3 tired 4 drained 5 neutral 6 okay 7 grounded 8 good 9 bright
   A trailing * means "starts with" (exhaust* → exhausted/exhausting); otherwise the whole word. */
(function (root) {
  // [dial, valence (-1..1), arousal (-1..1), ...words]
  var GROUPS = [
    // ── 1 · overwhelmed (unpleasant, high arousal) ─────────────────────────
    [1,-.90,.90,'panic*','terrif*','petrified','horrified','frantic','hysteric*','meltdown','melting down','losing it','falling apart','breaking down',"can't cope",'cant cope','cannot cope','spiral*','desperat*','freaking out','freaked out','screaming','trembling','shaking','paralys*','paraliz*'],
    [1,-.75,.72,'overwhelm*','swamped','drowning','buried','suffocat*','too much','frazzled','frenzied','chaotic','chaos','scattered','racing','spinning','flooded','crushing','overloaded','overload','stretched thin','at capacity','maxed out','underwater','snowed under','head is spinning','mind is racing','cant think',"can't think",'cant keep up',"can't keep up"],
    [1,-.62,.78,'anxi*','worr*','dread*','uneasy','nervous','on edge','tense','tension','restless','jittery','panicky','apprehensive','fearful','afraid','scared','frightened','edgy','wound up','stress*','pressure','pressured','rushed','deadline','overthinking','overthink*','ruminat*','what if','sick with worry','knot in my stomach','butterflies','paranoid','insecure about'],
    [1,-.72,.62,'angry','anger','furious','fuming','livid','rage','raging','irritat*','annoy*','frustrat*','resent*','bitter','snappy','snapping','short-tempered','mad','outraged','infuriat*','exasperat*','fed up','sick of','had enough','sick and tired','hate','hated','hating','disgust*','jealous*','envy','envious','impatient','agitated','seething','bristling'],
    [1,-.88,.35,'grief','griev*','devastat*','heartbroken','heartbreak','shattered','crushed','hopeless*','despair*','worthless','no point',"can't go on",'give up','giving up','broken','lost hope','destroyed','gutted','inconsolable','bereaved','bereft','loss of','passed away','funeral','mourning','traumati*','trauma'],
    // ── 2 · heavy (unpleasant, medium arousal) ─────────────────────────────
    [2,-.62,.12,'heavy','heaviness','heavy-hearted','burden*','carrying','weighed down','weight on','sad','sadness','sadly','hurt','hurting','lonely','loneliness','alone','isolat*','guilt*','guilty','ashamed','shame','regret*','sorrow*','tearful','crying','cry','tears','weepy','missing','miss you','longing','invisible','unseen','left out','helpless*','powerless','unappreciated','taken for granted','feel down','feeling down','felt down','low mood','feel low','feeling low','felt low','feel blue','feeling blue','mourn*','aching','ache','pain','painful','sore','bruised','wounded','raw','fragile','vulnerable','exposed','tender-hearted','sensitive'],
    [2,-.5,.32,'disappoint*','discourag*','let down','torn','conflicted','trapped','pulled apart','guilt-ridden','pessimistic','doubt*','inadequate','not enough','failing','failure','useless','incompetent','feel lost','feeling lost','felt lost','confused','confusion','anguish','tormented','miserable','gloomy','glum','downcast','dejected','low-spirited','melanchol*','wistful','homesick','nostalgic','neglected','overlooked','dismissed','ignored','rejected','abandoned','unloved','unwanted','unsupported','unheard','dismiss*','criticis*','criticiz*','judged','blamed','blame'],
    [2,-.7,.3,'bad day','rough day','hard day','tough day','difficult day','long day','awful','terrible','horrible','dreadful','rough','tough','bleak','grim','dark','darkness','harsh','cruel','unfair','not fair','struggl*','suffering','suffer*','hardship','ordeal'],
    // ── 3 · tired (unpleasant, low arousal) ────────────────────────────────
    [3,-.42,-.55,'tired','tiredness','weary','exhaust*','burnt out','burned out','burnout','worn out','fatigue*','sleepy','drowsy','sleepless','insomnia','no sleep','barely slept','not sleeping','foggy','fog','sluggish','slow','run down','rundown','knackered','zonked','wiped','wiped out','dead on my feet','yawn*','groggy','lethargic','need sleep','need a nap','need rest','need a break','need a holiday','sleep deprived','up all night','night shift','early start'],
    [3,-.3,-.78,'listless','lifeless','feel spent','feeling spent','totally spent','completely spent','sapped','dragging','dragged out','cant get up',"can't get up",'struggling to get up','no energy','low energy','zero energy','out of energy','flat battery','battery is flat','heavy limbs','lead legs','running low','empty tank'],
    // ── 4 · drained (low-mid valence, low arousal: flat / numb / routine) ──
    [4,-.22,-.72,'drain*','deplet*','empty','numb*','flat','blank','bored*','boring','apathe*','indifferent','unmotivated','unmoved','going through the motions','routine','monoton*','dull','stuck','stuck in a rut','rut','nothing left','running on empty','meh','detached','hollow','disconnected','distant','withdrawn','shut down','shutting down','autopilot','auto-pilot','same old','groundhog','treadmill','repetitive','grey','gray',"don't care",'dont care',"can't be bothered",'cant be bothered','cant feel',"can't feel",'nothing matters','pointless','tedious','stale','washed out','faded','muted','muffled','underwhelmed','unmotivated','lacking','neutral-ish'],
    // ── 5 · neutral ────────────────────────────────────────────────────────
    [5,0,0,'neutral','steady','fine','so-so','so so','average','normal','alright','all right','ordinary','usual','in between','unsure','uncertain','mixed','undecided','floating','coping','just there','not bad','middle','plain','typical','regular','mundane','unremarkable','whatever','nothing special','same as usual','as usual','as always','neither','balanced day','in the middle','between','waiting','pending','wait and see'],
    [5,.08,.22,'busy','occupied','getting on with it','carrying on','keeping going','keeping busy','on the go','juggling','appointment','appointments','medication','meds','paperwork','errands','chores','cooking','cleaning','shopping','driving','commute','meeting','meetings','admin','schedule','scheduling','planning','organising','organizing'],
    // ── 6 · okay (mildly pleasant, low arousal) ────────────────────────────
    [6,.22,-.2,'okay','ok','manageable','getting by','better','relief','relieved','gentle','easing','eased','easier','soften*','settl*','steadier','improv*','recover*','healing','heal','mending','breathing','breathe','feel present','feeling present','present moment','more open','feeling open','coping better','coming through','pulling through','getting there','on the mend','a bit better','bearable','tolerable','decent','passable','hanging in','hanging on','holding on','holding up','holding steady','not too bad','could be worse','small win','small steps','baby steps','one step','one day at a time','taking it slow','slowly','gradually','making do','making it work','managing','manage'],
    [6,.35,-.32,'rested','refreshed','restful','recharged','slept well','good sleep','cosy','cozy','comfy','comfortable','lazy','slow morning','pottering','unhurried','leisurely','easy day','light day','respite','day off','time off','nap','napping','lie in','lie-in','sleeping in','slept in','tea','cup of tea','cuppa','blanket','pyjamas','pajamas','bath','long bath','shower'],
    // ── 7 · grounded (pleasant, low-to-medium arousal) ─────────────────────
    [7,.5,-.42,'grounded','calm*','peace*','serene','tranquil','rooted','centred','centered','balanced','safe','secure','stillness','quiet','content*','relax*','at ease','at peace','anchored','soothed','soothing','mellow','composed','collected','unruffled','clear head','feel clear','feeling clear','clear-headed','mindful','meditat*','reflective','thoughtful','spacious','slow down','slowing down','slowed down','stable','steadfast','sturdy','whole','complete','enough','sufficient','settled in','at home','at rest','restored','restoring','breathing easy','deep breath','exhale','exhaling','release','releasing','letting go','let go','acceptance','accepting','forgiv*','nature','garden','walk in the park','sunset','sunrise','birdsong','rain on the roof','waves','ocean','sea','trees','forest','woods'],
    // ── 8 · good (pleasant, medium arousal) ────────────────────────────────
    [8,.68,.3,'good','warm*','hope*','grat*','thank*','loved','supported','connected','glad','kindness','proud','smil*','comfort*','optimis*','pleased','great','nice','cheerful','appreciat*','blessed','lucky','looking forward','tender*','uplift*','encourag*','happy','happier','happiness','fun','laugh*','giggl*','cuddle','cuddles','cuddling','hug','hugs','hugged','hugging','cared for','welcomed','valued','feel seen','feeling seen','felt seen','feel heard','felt heard','feel understood','accepted','belong*','togetherness','family time','good day','good news','lovely','fond','affection*','feel close','feeling close','closer to','bonding','bonded','laughter','playful','generous','generosity','sweetness','delicious','tasty','treat','treats','gift','gifts','present from','surprise','surprised me','sunny','sunshine','bloom*','flowers','spring','fresh','new beginning','new start','fresh start','turning point','silver lining','light at the end','glimmer','spark','small joys','little joys','pleasant','agreeable','satisfied','satisfying','fulfilled','fulfilling','worthwhile','meaningful','purpose','purposeful'],
    [8,.6,.55,'motivated','inspired','confident','productive','accomplish*','achiev*','succeed*','success','progress*','proud of','capable','feel strong','feeling strong','stronger','empowered','determined','focused','energetic','driven','ready','prepared','on track','winning','win','victory','breakthrough','nailed it','crushed it','smashed it','got it done','done it','made it','finally','at last','sorted','solved','resolved','fixed','clarity','clear plan','plan is working','working out','going well','going great','went well','went great','better than expected'],
    // ── 9 · bright (very pleasant, high arousal) ───────────────────────────
    [9,.9,.8,'bright','joy*','alive','elated','ecstatic','excit*','thrill*','amazing','energi*','radiant','wonderful','fantastic','overjoy*','buzzing','euphori*','incredible','on top of the world','unstoppable','best day','pumped','so happy','over the moon','love it','jubilant','glowing','delighted','full of life','exhilarat*','awesome','brilliant','magical','magic','fabulous','stoked','psyched','giddy','beaming','radiating','blissful','bliss','celebrat*','dancing','dance','soaring','flying','invincible','electric','spectacular','sparkling','dazzling','vibrant','vivid','lit up','glad to be alive','on cloud nine','cloud nine','walking on air','thrilled to bits','party','partying','singing','laughing so hard','cant stop smiling',"can't stop smiling",'grinning','ear to ear','squealing','jumping','bouncing','yes yes','hell yes','woohoo','hooray','hurray','yay','best ever','of my life','dream come true','dreams coming true','pinch me','too good to be true']
  ];

  var NEGATORS = ['not','no','never','hardly','without',"isn't","wasn't","don't","didn't","can't","cant","won't","aren't","isnt","wasnt","dont","didnt","couldn't","wouldn't","haven't","hasn't"];
  var BOOSTERS = ['so','very','really','extremely','completely','totally','utterly','too','incredibly','absolutely','deeply','truly','super','insanely','massively','proper'];

  var ENTRIES = [], seen = {};
  GROUPS.forEach(function (g) {
    for (var i = 3; i < g.length; i++) {
      var w = g[i].toLowerCase(), stem = /\*$/.test(w);
      if (stem) w = w.slice(0, -1);
      var k = w + (stem ? '*' : '');
      if (seen[k]) continue;               // first group wins if a word is listed twice
      seen[k] = 1;
      ENTRIES.push({ dial: g[0], v: g[1], a: g[2], word: w, stem: stem });
    }
  });
  ENTRIES.sort(function (a, b) { return b.word.length - a.word.length; });

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function dialClamp(n) { return clamp(n, 1, 9); }

  // ── colour: valence → hue, arousal → saturation/depth ──────────────────
  var HUE = [[-1, 238], [-.6, 216], [-.3, 192], [0, 152], [.25, 104], [.5, 66], [.8, 44], [1, 34]];
  function hueAt(v) {
    v = clamp(v, -1, 1);
    for (var i = 1; i < HUE.length; i++) {
      if (v <= HUE[i][0]) { var a = HUE[i - 1], b = HUE[i]; return a[1] + (b[1] - a[1]) * ((v - a[0]) / (b[0] - a[0])); }
    }
    return HUE[HUE.length - 1][1];
  }
  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    var x = function (v) { var h2 = Math.round(v * 255).toString(16); return h2.length < 2 ? '0' + h2 : h2; };
    return '#' + x(f(0)) + x(f(8)) + x(f(4));
  }
  function colour(v, a) {
    var A = (clamp(a, -1, 1) + 1) / 2, pos = Math.max(0, v);
    var s = (16 + 42 * A) * (1 + .3 * pos) * (.55 + .45 * Math.min(1, Math.abs(v) / .4)); // neutral = muted
    var l = 68 - 11 * A - 4 * pos;
    return hslToHex(hueAt(v), Math.min(80, s), l);
  }

  // each word nudges its own spot on the circumplex a little, so two words from the
  // same family (sad / lonely) still land on slightly different colours
  function jit(w) {
    var h = 2166136261;
    for (var i = 0; i < w.length; i++) { h ^= w.charCodeAt(i); h = Math.imul(h, 16777619); }
    h >>>= 0;
    return [((h % 1000) / 1000 - .5) * .16, (((h >>> 10) % 1000) / 1000 - .5) * .26];
  }

  function tokenise(text) {
    var out = [], re = /[a-z']+(?:-[a-z]+)?/g, m;
    var t = (text || '').toLowerCase().replace(/[‘’]/g, "'");
    while ((m = re.exec(t))) out.push({ w: m[0], i: m.index, e: m.index + m[0].length });
    return { tokens: out, text: t };
  }

  function findHits(text) {
    var tk = tokenise(text), t = tk.text, hits = [], used = [];
    function free(s, e) { return !used.some(function (u) { return s < u[1] && e > u[0]; }); }
    function isL(c) { return /[a-z']/.test(c || ''); }

    ENTRIES.forEach(function (en) {
      var w = en.word, from = 0, idx;
      while ((idx = t.indexOf(w, from)) !== -1) {
        from = idx + 1;
        var e = idx + w.length;
        if (isL(t.charAt(idx - 1))) continue;
        if (!en.stem && isL(t.charAt(e))) continue;
        if (!free(idx, e)) continue;
        var end = e; while (/[a-z'-]/.test(t.charAt(end))) end++;
        used.push([idx, end]);
        hits.push({ word: t.slice(idx, end), dial: en.dial, v: en.v, a: en.a, pos: idx, end: end });
      }
    });
    hits.sort(function (a, b) { return a.pos - b.pos; });

    hits.forEach(function (h) {
      var before = tk.tokens.filter(function (x) { return x.e <= h.pos; }).slice(-3).map(function (x) { return x.w; });
      var neg = before.some(function (w) { return NEGATORS.indexOf(w) !== -1 || /n't$/.test(w); });
      var boost = before.length && BOOSTERS.indexOf(before[before.length - 1]) !== -1;
      var d = h.dial;
      if (neg) {
        d = 10 - d; d = d + (d < 5 ? 1 : d > 5 ? -1 : 0);
        h.v = clamp(-h.v * .85, -1, 1); h.a = clamp(h.a * .6, -1, 1); h.negated = true;
      } else if (boost) {
        d = d + (d < 5 ? -1 : d > 5 ? 1 : 0);
        h.v = clamp(h.v * 1.25, -1, 1); h.a = clamp(h.a * 1.25, -1, 1); h.boosted = true;
      }
      h.dial = dialClamp(d);
      var j = jit(h.word); h.v = clamp(h.v + j[0], -1, 1); h.a = clamp(h.a + j[1], -1, 1);
      h.hex = colour(h.v, h.a);
    });
    return hits;
  }

  function analyse(text) {
    var hits = findHits(text);
    if (!hits.length) return { dial: null, latest: null, hits: [] };
    var sum = 0, wsum = 0;
    hits.forEach(function (h, i) { var w = 1 + i * 0.6; sum += h.dial * w; wsum += w; });
    return { dial: dialClamp(Math.round(sum / wsum)), latest: hits[hits.length - 1], hits: hits };
  }

  var api = { analyse: analyse, findHits: findHits, colour: colour, GROUPS: GROUPS, wordCount: ENTRIES.length };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TheLineMood = api;
})(typeof window !== 'undefined' ? window : this);
