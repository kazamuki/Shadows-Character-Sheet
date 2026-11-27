/*UI-START*/
// Shared UI foundation: app state, persistence, the commit/render loop, and the
// small render helpers every screen (wizard and sheet alike) reaches for.
// Classic scripts loaded in the same document share one global scope executed
// in order, so this file declares plain top-level bindings — no IIFE, no
// namespace object — and shared.js / wizard.js / sheet.js / app.js (loaded in
// that order, after data → icons → engine) see each other's names directly,
// the same way app.js already sees window.SHADOWS_DATA and Engine.

const D = window.SHADOWS_DATA;
const $ = id => document.getElementById(id);
const esc = s => String(s==null?"":s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// The currency sign, from the data (Decision 135), escaped once for markup.
const CR = esc(Engine.creditSymbol());
// The die (Decision 297): the one place the app rolls, for the GM's Job Generator. A plain function, so a test
// stubs it; the engine never rolls. Whole numbers 1 to `sides`, with no modulo bias.
function rollD(sides){
  const n=Math.max(2, Math.floor(Number(sides))||10), c=window.crypto;
  if (c && typeof c.getRandomValues==="function"){
    const a=new Uint32Array(1), lim=Math.floor(4294967296/n)*n;
    do c.getRandomValues(a); while (a[0]>=lim);
    return a[0]%n+1;
  }
  return Math.floor(Math.random()*n)+1;
}
// Today as the player lives it, YYYY-MM-DD (not UTC: after 7 pm in New York that says tomorrow).
const localDay = Engine.localDay;
// A sign is the true minus, never a hyphen (S13a's SQ7): `signed` leaves zero bare,
// `modText` gives it a plus, as a stat modifier reads (+0).
const signed = n => (n>0?"+":n<0?"−":"")+Math.abs(n);
const modText = n => (n<0?"−":"+")+Math.abs(n);
const numText = n => (n<0?"−":"")+Math.abs(n);   // an amount, unsigned unless it's below zero
// W32: a Spell Power amount worked out (Engine.spAmounts), beside the book's
// words that name it: "7 (½ SP Damage)", "+7" for an increase. `spTail` is
// for prose too long to put in brackets, an Aberration's text. With no
// amount, the book's words alone.
const spTitle = a => `Your Spell Power is ${a.spellPower}${a.times%1?"; halves round up":""}.`;
const spText = (a, text) => a ? `<b class="sp-num" title="${esc(spTitle(a))}">${a.adds?"+":""}${a.value}</b> <span class="sp-book">(${esc(text)})</span>` : esc(text);
const spPart = n => n===1 ? "Spell Power" : n===0.5 ? "½ Spell Power" : `Spell Power × ${n}`;
const spTail = a => a ? ` <span class="sp-tail" title="${esc(spTitle(a))}">${spPart(a.times)}: <b class="sp-num">${a.value}</b></span>` : "";

// ── Iconography (loaded from shadows-icons.js) ──────────────────────
// Brand stat icons keyed by stat/derived id; free-to-use UI icons keyed by
// semantic name. Both degrade to "" when absent, so a missing icon never
// breaks the sheet (adding a stat in shadows-data.js stays app-free).
const ICON_SET = window.SHADOWS_ICONS || { stats:{}, ui:{} };
const ICONS = ICON_SET.stats || {};
const UI_ICONS = ICON_SET.ui || {};
const iconSvg = id => ICONS[id] || "";
const uiIcon  = name => UI_ICONS[name] || "";
const statIco = (id, cls="ico") => { const s=iconSvg(id); return s?`<div class="${cls}">${s}</div>`:""; };

// W20/W21: a skill's two stats as the brand icons with this character's own
// numbers, on the wizard's skill line and in the sheet's breakdown. The
// primary adds its score and the synergy its modifier (0300), so the synergy
// reads as a bonus. Violet and magenta match the print sheet's badges. The
// synergy is dimmed on an untrained skill, whose check leaves it out.
function skillStatsHtml(line){
  const b=line.breakdown, trained=line.trained;
  const chip=(id, text, syn)=>{ const svg=id&&iconSvg(id);
    return `<span class="skstat${syn?" syn":""}${syn&&!trained?" off":""}" title="${syn?(trained?"Synergy: adds its modifier":"Synergy: counts once trained"):"Primary: adds its score"}">${
      svg?`<span class="ico">${svg}</span>`:""}${text}</span>`; };
  const m=b.synergy.mod;
  return `<span class="skstats">${chip(b.primary.id, `${esc(b.primary.id||"?")} ${b.primary.value}`)}${
    chip(b.synergy.id, `${esc(b.synergy.id||"?")} ${m<0?"−":"+"}${Math.abs(m)} syn`, true)}</span>`;
}


// ── State ─────────────────────────────────────────────────────────────
// `short` names a step in the strip and as its title; a step without one
// falls back to its whole label (Decision 161).
const STEPS = D.creationFlow.steps.map(s=>({id:s.id, n:s.n, short:s.short||s.label, label:s.label, note:s.note, byStatMethod:s.byStatMethod}))
  .concat([{id:"review", n:D.creationFlow.steps.length+1, short:"Review", label:"Review, lock, and export"}]);
const SHEET_SECTIONS = [
  {id:"main",        label:"Main",        ui:"tab_main"},
  {id:"skills",      label:"Skills",      ui:"tab_skills"},
  {id:"character",   label:"Character",   ui:"tab_archetype"},
  {id:"trackers",    label:"Trackers",    ui:"tab_trackers"},
  {id:"progression", label:"Progression", ui:"tab_progression"},
  {id:"loadout",     label:"Loadout", ui:"tab_loadout"},
  {id:"notes",       label:"Notes",       ui:"tab_notes"}
];
const SHEET_IDS = SHEET_SECTIONS.map(s=>s.id);
// Older saved sections: Traits and Archetype became Character (Decision 158),
// and Session Log became part of Progression (Decision 281).
const LEGACY_SECTION = { overview:"main", traits:"character", archetype:"character", sessions:"progression" };
// "admin" is a hidden section (no tab) reachable only while admin mode is on.
const normSection = s => s==="admin" ? (S.admin?"admin":"main")
                        : (SHEET_IDS.includes(s) ? s : (LEGACY_SECTION[s] || "main"));
let S = { screen:"home", ch:null, step:0, maxReached:0, section:"main", admin:false };
// One way home (W64): the wizard, the sheet's menu and the GM table all land
// here. A character is already saved by every update(), so nothing is lost.
function homeState(){ return { screen:"home", ch:null, step:0, maxReached:0, section:"main", admin:false }; }
function goHome(){ S=homeState(); renderHome(); }

// W59: one polite live region, outside #main (which every render replaces),
// created once. It clears, then sets on the next frame, so the same words
// twice in a row are still read.
function announce(text){
  let el=document.getElementById("announcer");
  if (!el){
    el=document.createElement("p");
    el.id="announcer"; el.className="sr-only"; el.setAttribute("role","status"); el.setAttribute("aria-live","polite");
    document.body.appendChild(el);
  }
  el.textContent="";
  const set=()=>{ el.textContent=text; };
  if (typeof requestAnimationFrame==="function") requestAnimationFrame(set); else setTimeout(set,0);
}
// After a stepper press has re-rendered: read the pressed stepper's name and
// its new value, e.g. "Body 5". `dataStep` is the pressed button's data-step.
function announceStep(dataStep){
  const b=[...document.querySelectorAll("#main [data-step]")].find(x=>x.dataset.step===dataStep);
  const st=b && b.closest(".stepper"), val=st && st.querySelector(".val");
  // J3: a stepper's value is a field now, so its value is what the player sees; a span's is its text.
  if (st && val) announce(`${st.dataset.name} ${val.tagName==="INPUT" ? val.value : val.textContent}`);
}

// Decision 173: an unfinished feature ships switched off. A browser turns
// one on with ?<name>=on (and off with ?<name>=off); the launch release sets
// it true here. Guarded: without storage, a feature is as the constant says.
// Decision 214: a switch is either an unfinished feature (gm) or a released
// one withdrawn until the team decides (crank). Decision 239: the team kept
// CRANK, so its switch is on for everyone.
const FEATURES = { gm:true, crank:true };
const FEATURE_PREFIX = "shadows.feature.";
function featureOn(name){
  if (!Object.prototype.hasOwnProperty.call(FEATURES, name)) return false;
  if (FEATURES[name]===true) return true;
  try{ return localStorage.getItem(FEATURE_PREFIX+name)==="on"; }catch(e){ return false; }
}
// Decision 214: CRANK is shown only with its switch on.
const crankOn = () => featureOn("crank");
function applyFeatureQuery(search){
  let q; try{ q=new URLSearchParams(search||""); }catch(e){ return; }
  for (const name of Object.keys(FEATURES)){
    const v=q.get(name);
    try{
      if (v==="on") localStorage.setItem(FEATURE_PREFIX+name, "on");
      else if (v==="off") localStorage.removeItem(FEATURE_PREFIX+name);
    }catch(e){}
  }
}

// ── The roster (R10, Decision 141) ────────────────────────────────────
// Every character this browser keeps is one localStorage key named by its
// TAG, draft and sheet alike: locking updates the same entry, and a second
// character is added, never swapped in. An entry is
// { ch, step, maxReached, section, changed, exported }. `changed` moves only
// when the stored character actually differs (a re-render isn't a change),
// and always forward; `exported` is the `changed` it had when it last went to
// a file. Home says a character has play its file doesn't whenever the two
// differ, with no clock comparison to get wrong. Neither is ever written
// into the character. Guarded throughout: the app works without storage.
const CHAR_PREFIX = "shadows.char.v1.";
const LEGACY_KEYS = ["shadows.active.v1", "shadows.draft.v1"];   // before 0.28: one sheet, one draft
const charKey = id => CHAR_PREFIX + id;
let lastSaved = null;   // { id, json, changed, exported }: the open character as last written
let untouched = null;   // a New character's JSON until the player changes something
let saveFailed = false;
function readEntry(key){
  try{
    const r=localStorage.getItem(key), v=r && JSON.parse(r);
    return v && typeof v==="object" && v.ch && typeof v.ch==="object" ? v : null;
  }catch(e){ return null; }
}
function savedChar(id){ return Engine.isIntakeId(id) ? readEntry(charKey(id)) : null; }
function writeEntry(id, ch, view, changed, exported){
  const json=typeof ch==="string" ? ch : JSON.stringify(ch);
  const rest=JSON.stringify({ step:view.step||0, maxReached:view.maxReached||0, section:view.section||"main", changed, exported:exported||null });
  localStorage.setItem(charKey(id), `{"ch":${json},${rest.slice(1)}`);
}
function saveChar(){
  const ch=S.ch, id=intakeOf(ch); if (!id) return;
  const json=JSON.stringify(ch);
  if (json===untouched) return;
  untouched=null;
  if (!lastSaved || lastSaved.id!==id){ const e=savedChar(id); lastSaved={ id, json:e?JSON.stringify(e.ch):null, changed:e&&e.changed, exported:e&&e.exported }; }
  let changed=lastSaved.changed;
  if (json!==lastSaved.json || !changed){
    const was=Date.parse(changed); let t=Date.now();
    if (Number.isFinite(was) && t<=was) t=was+1;
    changed=new Date(t).toISOString();
  }
  try{
    writeEntry(id, json, S, changed, lastSaved.exported);
    lastSaved.json=json; lastSaved.changed=changed; saveFailed=false;
  }catch(e){
    // A full or blocked storage used to fail without a word. The page says so
    // until a save goes through (importIssuesHtml): a toast would be gone
    // under the next action's undo.
    saveFailed=true;
  }
}
// Called on every export: the file now holds what's stored.
function markExported(id){
  const e=savedChar(id); if (!e) return;
  e.exported=e.changed;
  try{ localStorage.setItem(charKey(id), JSON.stringify(e)); }catch(err){}
  if (lastSaved && lastSaved.id===id) lastSaved.exported=e.exported;
}
function removeChar(id){
  try{ localStorage.removeItem(charKey(id)); }catch(e){}
  if (lastSaved && lastSaved.id===id) lastSaved=null;
}
// Every saved character, the most recently changed first.
function rosterEntries(){
  const out=[];
  try{
    for (let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if (!k || k.indexOf(CHAR_PREFIX)!==0 || !Engine.isIntakeId(k.slice(CHAR_PREFIX.length))) continue;
      const e=readEntry(k); if (e) out.push(Object.assign(e, { id:k.slice(CHAR_PREFIX.length) }));
    }
  }catch(e){}
  const t = e => { const n=Date.parse(e.changed); return Number.isFinite(n) ? n : 0; };
  return out.sort((a,b)=>t(b)-t(a));
}
const unexported = e => !e.exported || e.exported!==e.changed;
// The two slots a 0.27 browser kept become roster entries on first load. An
// old key goes only once its entry is written; one that doesn't parse stays.
// If both hold the same character, the newer copy wins, as on import.
function migrateLegacySlots(){
  for (const key of LEGACY_KEYS){
    const r=readEntry(key); if (!r) continue;
    try{
      const c=Engine.migrate(clone(r.ch)), id=intakeOf(c);
      const have=savedChar(id);
      if (!have || supersedes(c, Engine.migrate(clone(have.ch))))
        writeEntry(id, c, r, (c.meta && c.meta.updated) || new Date().toISOString(), null);
      localStorage.removeItem(key);
    }catch(e){}
  }
}

// The modifier this machine's undo and save keys use, as a keycap would say it (S23): ⌘ on a Mac, Ctrl anywhere else.
// The keys themselves take either (gm.js keyAction), so a list that names one is only right if it names this machine's.
function modKey(){
  let p="";
  try { p=String((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ""); } catch(e){}
  return /^(mac|iphone|ipad|ipod)/i.test(p) ? "⌘" : "Ctrl";
}

// ── Keeping your place (W47) ──────────────────────────────────────────
// A press that re-renders replaces the button that was pressed, so focus
// would fall to <body>: the next Enter does nothing and Tab starts over.
// keepPlace() notes the focused control's data-* attributes, all of them
// (Main's eight stat buttons share data-tip="stat"), and after `draw` focuses
// its twin in the same root and nowhere else (the vitals keys are in #main
// and the flyout both). A twin that's gone, greyed, hidden or inert falls
// back to the card it sat in (PLACES), then to `fallbacks`: somewhere that
// changes nothing, never the control beside it (W42: Heal 1 handed Enter to
// Hurt 1). Focus outside `root`, on <body> after a tap, or put somewhere on
// purpose by `draw` is left alone.
const PLACES = ".trk, .alloc-row, .pick, details, tr, .sect";
const attrSel = (name, v) => `[${name}="${String(v).replace(/["\\]/g, "\\$&")}"]`;
function dataKey(el){
  const a=[...el.attributes].filter(x=>x.name.startsWith("data-"));
  return a.length ? a.map(x=>attrSel(x.name, x.value)).join("") : null;
}
function pathIn(root, el){
  const p=[];
  for (let e=el; e && e!==root; e=e.parentElement) p.unshift([...e.parentElement.children].indexOf(e));
  return p;
}
function atPath(root, p){ let e=root; for (const i of p) e = e && e.children[i]; return e||null; }
// Focus `el` if it can really take it. A place (a card, a row) is made
// focusable for the purpose and shows the ring the keyboard expects.
function takeFocus(el, place){
  // A row laid out with display:contents (the wizard's .alloc-row) has no box
  // to focus, so its first cell, the name, stands in for it.
  if (place && el && el.isConnected && getComputedStyle(el).display==="contents") el=el.firstElementChild;
  if (!el || !el.isConnected || el.disabled || el.closest("[hidden],[inert],[aria-hidden='true']")) return false;
  const shut = el.closest("details:not([open])");
  if (shut && shut!==el && !el.matches("details > summary")) return false;
  // A button stays as it is; a card or a heading is made focusable, out of
  // the Tab order, and shows the ring the keyboard expects.
  if (place && el.tabIndex<0){ if (!el.hasAttribute("tabindex")) el.tabIndex=-1; el.classList.add("kept-place"); }
  el.focus({ preventScroll:true });
  return document.activeElement===el;
}
function keepPlace(root, draw, fallbacks=[]){
  const f=document.activeElement;
  if (!root || !f || f===root || !root.contains(f)){ draw(); return; }
  const key=dataKey(f), place=f.closest(PLACES);
  const where = place && place!==root && root.contains(place) ? { path: pathIn(root, place), tag: place.tagName } : null;
  draw();
  const now=document.activeElement;
  if (now && now!==document.body && now.isConnected) return;
  const twin = key && root.querySelector(key);
  if (takeFocus(twin)) return;
  const near = twin && twin.closest(PLACES);              // there but greyed: its own card
  if (near && near!==root && root.contains(near) && takeFocus(near, true)) return;
  const again = where && atPath(root, where.path);
  if (again && again.tagName===where.tag && takeFocus(again, true)) return;
  for (const fb of fallbacks){
    const el = typeof fb==="function" ? fb() : document.querySelector(fb);
    if (takeFocus(el, true)) return;
  }
}

function update(rerenderMain=true){
  saveChar();
  if (S.screen==="table") saveTable();   // gm.js (Decision 172)
  if (rerenderMain){ renderMain(); sweepTip(); }
  renderLedger(); renderVitals();
  playBeats();   // last: the drawer and the popover are drawn by now (Decision 316)
  if (S.screen==="table"){ paintTonight(); playTableBeats(); }   // gm.js: update(false) skips renderTable, and the strip reports exactly those changes (Decision 270); the table's beats play on the same update (Decision 318)
}

// Every state-changing sheet action runs through commit(): snapshot
// the character, run the mutation, record a reversible audit entry, then save +
// re-render. Admin edits use the same path, so the activity log is complete.
const clone = x => (x==null ? x : JSON.parse(JSON.stringify(x)));
// Decision 266: the Natural Armor boxes a hit opens with ticked: each conditional source whose power is running
// (Engine.runningPowers decides that, nothing here reads the stored list). Both hits seed from it: the sheet's and a GM's seat's.
function runningNatural(ch){
  const on = new Set(Engine.runningPowers(ch).map(r=>r.id)), nat = {};
  Engine.naturalArmor(ch, []).conditional.forEach(c=>{ if (on.has(c.id)) nat[c.id] = true; });
  return nat;
}
// "Iron Hide and Cold Embrace": names as a sentence says them.
const andList = names => names.length>1 ? names.slice(0, -1).join(", ") + " and " + names[names.length-1] : names[0] || "";
// The same for the ids of powers that stopped (a toast's words).
function stoppedNames(ch, ids){
  return andList(Engine.runnablePowers(ch).filter(r=>(ids||[]).includes(r.id)).map(r=>r.name));
}
function commit(kind, label, fn){
  const ch=S.ch; if(!ch) return;
  const before=clone(ch);
  fn();
  const r=Engine.recordAction(ch, kind, label, before);
  // meta.updated is "last changed" (Decision 128), so a file can be told from
  // an older copy of itself. diffChar skips meta: nothing here is undoable.
  if (r && r.ok){ if (!ch.meta || typeof ch.meta!=="object") ch.meta={}; ch.meta.updated=new Date().toISOString(); }
  S.landed=landedFrom(before, ch);
  S.beats=beatsFrom(before, ch);      // Decision 316: the render after this takes it once (renderMain), playBeats plays it (update)
  update();
  if (r && r.ok) showUndoToast(ch, ch.audit[ch.audit.length-1], label);
}

// W15 — let a hit land. When an action leaves more damage than before (a
// hit, Hurt, a Turn Reset tick), the next render marks the HP readouts, the
// Health Level boxes that took it, and the Pain readouts if the Pain Level
// went up. The render takes it once (landedNow), so the flash plays once and
// a later re-render doesn't replay it. Undo never moves; a heal's beat is
// beatsFrom's (Decision 316). The CSS drops the animation under
// prefers-reduced-motion.
let landedNow=null;
function landedFrom(before, ch){
  if (!ch.creation || !ch.creation.locked) return null;
  const b=Engine.hlState(before), a=Engine.hlState(ch);
  if (a.damage<=b.damage && a.massive<=b.massive) return null;
  const was=hlCells(before), cells=new Set();
  hlCells(ch).forEach((c,i)=>{ const o=was[i]; if (!o || c.frac>o.frac || (c.massive && !o.massive)) cells.add(i); });
  const pb=Engine.painState(before), pa=Engine.painState(ch);
  return { cells, pain: pa.level>pb.level || (pa.down && !pb.down) };
}
// A heal's green line (Decision 316) is class-borne like the flash: a heal isn't a hit, so `mended` and `struck` never meet.
const landedCls = (what, i) => what==="hp" && !landedNow ? (beatsNow && beatsNow.healed && !calm() ? " mended" : "")
  : !landedNow ? "" : what==="hp" ? " struck"
  : what==="pain" ? (landedNow.pain ? " painup" : "") : landedNow.cells.has(i) ? " landed" : "";

// ── What an action changed moves once (Decision 316, I1) ──────────────
// commit() notes what the six numbers and the Health Level cells were and are (beatsFrom, in S.beats); the render after it
// takes that once (renderMain, on every screen) and update() plays it last (playBeats), once the drawer and the popover are
// drawn. Every twin of a number is a countHtml span, so the count reaches all of them. The right number is in the HTML from the
// start: a count writes into a span only inside a frame callback, so a pane that isn't drawing shows the new number and
// nothing else. Undo, the wizard and reduced motion never get a beat. View state only: nothing here is saved (constraint 7).

// True when the player asked for less motion. Read on every call, never cached at boot.
function calm(){
  try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch(e){ return false; }
}
let beatsNow=null;
let lockRung=new Set();   // Decision 317: Lock & Export has rung for these characters (meta.id) this sitting. Module state, not S: every way into a draft builds a fresh S.
const BEAT_COUNT_MS=300, BEAT_STEP_MS=60, BEAT_FLOAT_MS=750, BEAT_TAIL_HOLD=250, BEAT_TAIL_MS=400;
let beatRun=null;

// The six numbers as the renderers draw them: { key: { v, max } }. HP is signed, so a hit past zero still has a size; a number
// a reader can't give is left out, never guessed. Total, so a hostile file reports nothing rather than throwing.
function beatReads(ch){
  const r={};
  const put=(k, fn)=>{ try { const x=fn(); if (x && Number.isFinite(x.v)) r[k]=x; } catch(e){} };
  put("hp", ()=>{ const p=Engine.painState(ch); return { v:p.hpLeft-(p.pastZero||0), max:Engine.health(ch).total }; });
  put("san", ()=>{ const x=Engine.sanState(ch); return { v:x.current, max:x.max }; });
  put("luck", ()=>{ const x=Engine.luckState(ch); return { v:x.current, max:x.max }; });
  put("sfr", ()=>{ const sf=Engine.sfr(ch); return sf && sf.value!=null ? { v:Math.max(0, sf.value-(ch.trackers.sfr.spent||0)), max:sf.value } : null; });
  put("cred", ()=>({ v:Number(ch.trackers.credits.current)||0 }));
  // Decision 317 (I2): IP and Milestone Points count too, wherever they are drawn as a number.
  put("ip", ()=>({ v:Engine.ipState(ch).available }));
  put("mp", ()=>({ v:Engine.milestoneState(ch).mp }));
  try { poolCardsOf(ch).forEach(c=>put("pool:"+c.panel.id, ()=>({ v:c.t.shown, max:c.t.max }))); } catch(e){}
  return r;
}
// Decision 317 (I2): what a commit did to the night. Each is read apart, so a hostile file loses only the part it breaks.
// `logged`: a session was added. `opened`: how far Minor and Major slots rose, read from the data's own cadence and the
// character's grants (milestoneState), never from MP against a number. `taken`: the journal row just added.
function nightFrom(before, ch){
  const n = x => x && Array.isArray(x.sessions) ? x.sessions.length : 0;
  let logged=false, opened=null, taken=null;
  try { logged = n(ch)===n(before)+1; } catch(e){}
  try {
    const a=Engine.milestoneState(ch), b=Engine.milestoneState(before);
    const minor=a.minorAvail-b.minorAvail, major=a.majorAvail-b.majorAvail;
    if (minor>0 || major>0) opened={ minor:Math.max(0, minor), major:Math.max(0, major) };
  } catch(e){}
  try {
    const m=ch.progression.milestones, o=before.progression.milestones;
    for (const kind of ["minor", "major"]){
      if (Array.isArray(m[kind]) && Array.isArray(o[kind]) && m[kind].length===o[kind].length+1){ taken={ kind, index:m[kind].length-1 }; break; }
    }
  } catch(e){}
  return { logged, opened, taken };
}
// What a commit changed, for the render after it. null unless ch is locked and something moved.
function beatsFrom(before, ch){
  try {
    if (!ch || !ch.creation || !ch.creation.locked) return null;
    const a=beatReads(ch), b=beatReads(before), counts={};
    Object.keys(a).forEach(k=>{ if (b[k] && a[k].v!==b[k].v) counts[k]={ from:b[k].v, to:a[k].v, max:a[k].max }; });
    const hb=Engine.hlState(before), ha=Engine.hlState(ch), was=hlCells(before), cells=[];
    hlCells(ch).forEach((c,i)=>{ const from=was[i] ? was[i].frac : 0; if (from!==c.frac) cells.push({ i, from, to:c.frac }); });
    const night=nightFrom(before, ch);
    if (!Object.keys(counts).length && !cells.length && !night.logged && !night.opened && !night.taken) return null;
    const up=ha.damage>hb.damage || ha.massive>hb.massive;
    return { counts, cells: up ? cells : cells.reverse(), healed: ha.damage<hb.damage && !up, ...night };
  } catch(e){ return null; }
}
// The number, wrapped so playBeats finds every twin. `text` is already formatted and escaped by the caller.
const countHtml = (key, text) => `<span data-count="${esc(key)}">${text}</span>`;

function stopBeats(){
  if (beatRun){
    if (beatRun.raf && typeof cancelAnimationFrame==="function") cancelAnimationFrame(beatRun.raf);
    beatRun.timers.forEach(clearTimeout);
    if (beatRun.off) beatRun.off();
    beatRun=null;
  }
  document.querySelectorAll(".beat-float, .beat-tail, .beat-burst").forEach(el=>el.remove());
}
const beatKeyed = (root, attr, key) => root ? [...root.querySelectorAll(`[${attr}]`)].find(e=>e.getAttribute(attr)===key) : null;
const beatText = (key, n) => key==="cred" || key==="ip" ? numText(Math.round(n)) : String(Math.round(n));

// The post-render pass. Reads beatsNow, clears it, returns nothing. A no-op when there is none, or under reduced motion.
function playBeats(){
  const b=beatsNow; beatsNow=null;
  // The screen reader hears a Milestone open whether or not anything moves (Decision 317): reduced motion drops the motion, not the news.
  if (b && b.opened) announce(msCopy(b.opened.major>0 ? "majorReady" : "minorReady"));
  if (!b || calm() || typeof requestAnimationFrame!=="function") return;
  stopBeats();
  const run=beatRun={ raf:0, timers:[] };
  const later=(fn, ms)=>run.timers.push(setTimeout(fn, ms));
  // The count: tag every twin now (an attribute, not its text), and let the first frame rewind and run it.
  const items=[];
  Object.keys(b.counts).forEach(k=>{
    const c=b.counts[k];
    if (k==="hp" && (c.from<0 || c.to<0)) return;               // past zero the text isn't a plain number
    document.querySelectorAll("[data-count]").forEach(el=>{ if (el.getAttribute("data-count")===k){ el.setAttribute("data-from", String(c.from)); items.push({ el, key:k, from:c.from, to:c.to }); } });
  });
  const land=()=>{ items.forEach(it=>{ if (it.el.hasAttribute("data-from")){ it.el.textContent=beatText(it.key, it.to); it.el.removeAttribute("data-from"); } }); };
  // One float per moved key, on one host: the open popover's readout, else the page's.
  const pop=document.getElementById("vpop"), main=document.getElementById("main");
  Object.keys(b.counts).forEach(k=>{
    const c=b.counts[k], d=c.to-c.from;
    const host=(pop && !pop.hidden && beatKeyed(pop, "data-float", k)) || beatKeyed(main, "data-float", k);
    if (!host) return;
    const f=document.createElement("span");
    f.className=`beat-float k-${k.split(":")[0]} ${d<0?"dn":"up"}`; f.setAttribute("aria-hidden","true");
    f.textContent=(d<0?"−":"+")+(k==="cred" ? Engine.creditSymbol()+numText(Math.abs(d)) : Math.abs(d));
    // At the readout's top right, not the host box's: the host is wider than the number (Decision 316). Measured before the
    // float goes in: on Main the host is the .big itself, and a float inside it would stretch the text's extent to its own
    // corner. A pane with no layout leaves 0px, which is the host's own corner.
    try {
      const num=[...host.querySelectorAll("[data-count]")].find(e=>e.getAttribute("data-count")===k);
      const big=num && (num.closest(".big") || num);
      let rr=null;
      if (big){ const rg=document.createRange(); rg.selectNodeContents(big); rr=rg.getBoundingClientRect(); }
      const hr=host.getBoundingClientRect();
      f.style.right=`${rr ? Math.max(0, Math.round(hr.right-rr.right)) : 0}px`;
      f.style.top=`${rr ? Math.round(rr.top-hr.top)-2 : -2}px`;
    } catch(e){ f.style.right="0px"; f.style.top="-2px"; }
    host.appendChild(f);
    f.addEventListener("animationend", ()=>f.remove());
    later(()=>f.remove(), BEAT_FLOAT_MS);
  });
  later(()=>{ if (beatRun===run){ if (run.raf && typeof cancelAnimationFrame==="function") cancelAnimationFrame(run.raf); land(); } }, BEAT_COUNT_MS+100);
  run.raf=requestAnimationFrame(t0=>{
    const live=items.filter(it=>it.el.isConnected && it.el.hasAttribute("data-from"));
    live.forEach(it=>{ it.el.textContent=beatText(it.key, it.from); });
    // The cells: rewind each moved one with no transition, then fill it in order, 60ms apart; a flash waits for its fill.
    const mainEl=document.getElementById("main");
    if (mainEl) b.cells.forEach((c, n)=>{
      mainEl.querySelectorAll(`[data-cell="${c.i}"]`).forEach(cell=>{
        const fill=cell.matches(".seg") ? cell.querySelector("i") : cell.querySelector(".fill");
        if (!fill) return;
        const st=fill.style;
        st.transitionProperty="none"; st.transform=`scaleX(${c.from.toFixed(2)})`; void fill.offsetWidth;
        st.transitionProperty="transform"; st.transitionDuration="180ms"; st.transitionTimingFunction="ease-out"; st.transitionDelay=`${n*BEAT_STEP_MS}ms`;
        st.transform=`scaleX(${c.to.toFixed(2)})`;
        if (cell.classList.contains("landed")) cell.style.animationDelay=`${n*BEAT_STEP_MS}ms`;
      });
    });
    // The tail: a meter that lost something holds the lost part for a beat, then drains it.
    Object.keys(b.counts).forEach(k=>{
      const c=b.counts[k]; if (c.to>=c.from || !(c.max>0)) return;
      const meter=beatKeyed(mainEl, "data-meter", k), bar=meter && meter.querySelector("i");
      if (!bar) return;
      const tail=document.createElement("i"); tail.className=`beat-tail k-${k.split(":")[0]}`;
      tail.style.width=`${Math.max(0, Math.min(100, c.from/c.max*100))}%`;
      meter.insertBefore(tail, bar);
      later(()=>{ tail.style.transition=`width ${BEAT_TAIL_MS}ms ease-out`; tail.style.width=bar.style.width||"0%"; }, BEAT_TAIL_HOLD);
      later(()=>tail.remove(), BEAT_TAIL_HOLD+BEAT_TAIL_MS+50);
    });
    playNight(b, run);
    const step=t=>{
      const k=Math.min(1, Math.max(0, (t-t0)/BEAT_COUNT_MS)), e=1-Math.pow(1-k, 3);
      live.forEach(it=>{ if (it.el.isConnected && it.el.hasAttribute("data-from")) it.el.textContent=beatText(it.key, it.from+(it.to-it.from)*e); });
      if (k<1) run.raf=requestAnimationFrame(step); else land();
    };
    run.raf=requestAnimationFrame(step);
  });
}

// Log session keeps your place, and brings the night into view (Decision 317, Ken 2026-11-25): if the strip under the button ends
// below the viewport, the page scrolls by exactly that much (instant, the page's own helper), never so far that the button goes up
// under the sticky header, and never to the top. Nothing moves when the strip already shows.
function nudgeToNight(){
  try {
    const strip=document.querySelector("#main [data-night]"); if (!strip) return;
    const end=strip.querySelector(".ms-plate") || strip.querySelector(".mp-track") || strip;
    const btn=document.querySelector("#main [data-seslog]"), hdr=document.querySelector("header.top");
    // The undo toast sits at the viewport's bottom for the same seconds as the beat, so its top is the floor when it shows.
    const toast=document.getElementById("undotoast"), floor=(toast && !toast.hidden ? toast.getBoundingClientRect().top : window.innerHeight) - 8;
    const need=Math.ceil(end.getBoundingClientRect().bottom - floor);
    if (!(need>0)) return;
    const room=btn ? Math.floor(btn.getBoundingClientRect().top - (hdr ? hdr.getBoundingClientRect().bottom : 0) - 8) : need;
    const dy=Math.min(need, room);
    if (dy>0) pageScrollBy(dy);
  } catch(e){}
}

// ── The night's end (Decision 317, I2) ─────────────────────────────────────
// Under Log session the strip holds the night's register line, the Milestone track and, while one is owed, the plate (sheet.js).
// The line and the plate are state, drawn from the character on every render; this is the beat on top of them: the new point
// draws in, a Minor gets a small burst, a Major lights every point in turn and a bigger one. Everything here runs in the first
// frame, so a pane that never draws shows the right strip and nothing else; nothing is measured after it's inserted.
const MS_LINE_MS=350, MS_FLASH_STEP_MS=50, MS_MAJOR_END_MS=1000;
const msCopy = k => ((D.appCopy||{}).msPlate||{})[k] || "";
function playNight(b, run){
  const strip=document.querySelector("#main [data-night]");
  if (!strip || !(b.opened || (b.counts && b.counts.mp))) return;
  const later=(fn, ms)=>run.timers.push(setTimeout(fn, ms));
  const base=b.logged ? MS_LINE_MS : 0;                         // a manual point has no line to wait for
  const major=!!(b.opened && b.opened.major>0), minor=!major && !!(b.opened && b.opened.minor>0);
  const keyed=n=>[...strip.querySelectorAll("[data-pip]")].find(e=>e.getAttribute("data-pip")===String(n));
  const track=strip.querySelector(".mp-track"), plate=strip.querySelector(".ms-plate");
  const delay=(el, ms)=>{ el.style.animationDelay=`${ms}ms`; };
  // The new point draws in left to right.
  const mp=b.counts && b.counts.mp, pip=mp && mp.to>mp.from ? keyed(mp.to) : null;
  if (pip){ const i=pip.querySelector("i"); if (i){ i.classList.add("beat-draw"); delay(i, base); } }
  // A burst's origin is measured against its host before the burst goes in, from the host's padding edge (its `left`/`top` origin:
  // the plate's 3px left border would otherwise carry it off the point).
  const burst=(host, n, cls, x, y, ms, reach)=>{
    const el=document.createElement("span");
    el.className=`beat-burst${cls}`; el.setAttribute("aria-hidden","true");
    el.style.left=`${Math.round(x)}px`; el.style.top=`${Math.round(y)}px`; el.style.setProperty("--bd", `${ms}ms`); el.style.setProperty("--reach", `${reach}px`);
    for (let k=0; k<n; k++){ const r=document.createElement("i"); r.style.setProperty("--a", `${(k*360/n).toFixed(1)}deg`); el.appendChild(r); }
    host.appendChild(el);
    return el;
  };
  if (minor && plate){
    let x=0, y=0;
    try { const hr=plate.getBoundingClientRect(), pr=pip && pip.getBoundingClientRect(); if (pr){ x=pr.left+pr.width/2-hr.left-plate.clientLeft; y=pr.top+pr.height/2-hr.top-plate.clientTop; } else { x=hr.width/2; y=0; } } catch(e){}
    burst(plate, 8, "", x, y, base+200, 34);
    plate.classList.add("beat-in"); delay(plate, base+200);
  }
  if (major){
    const pips=[...strip.querySelectorAll("[data-pip]")];
    pips.forEach((p, n)=>{ p.classList.add("beat-flash"); delay(p, base+n*MS_FLASH_STEP_MS); });
    if (track){
      let x=0, y=0;
      try { const hr=track.getBoundingClientRect(); x=hr.width/2; y=hr.height/2; } catch(e){}
      burst(track, 12, " major", x, y, base+250, 84);
    }
    if (plate){ plate.classList.add("beat-in"); delay(plate, base+500); }
    // One tap or key finishes it, and still does what it does: capture, passive, never preventDefault (and it takes itself off).
    const finish=()=>{
      off();
      strip.querySelectorAll(".beat-burst").forEach(e=>e.remove());
      strip.querySelectorAll(".beat-flash, .beat-draw, .beat-in, .beat-print, .beat-stamp").forEach(e=>{ e.classList.remove("beat-flash", "beat-draw", "beat-in", "beat-print", "beat-stamp"); e.style.animationDelay=""; });
      strip.querySelectorAll("[style*='animation-delay']").forEach(e=>{ e.style.animationDelay=""; });
    };
    const evs=["pointerdown", "keydown"];
    const off=()=>{ evs.forEach(t=>document.removeEventListener(t, finish, { capture:true })); run.off=null; };
    evs.forEach(t=>document.addEventListener(t, finish, { capture:true, passive:true }));
    run.off=off;
    later(()=>{ if (beatRun===run) off(); }, base+MS_MAJOR_END_MS);
  }
  // A burst takes itself off when it's done, and what the frame added is taken back off, so nothing waits to replay.
  later(()=>{
    strip.querySelectorAll(".beat-burst").forEach(e=>e.remove());
    strip.querySelectorAll(".beat-flash, .beat-draw, .beat-in").forEach(e=>{ e.classList.remove("beat-flash", "beat-draw", "beat-in"); e.style.animationDelay=""; });
  }, base+1050);
}

// W12 — undo where the action happened. Every commit() that changed something
// offers its own undo for a few seconds, through the same LIFO undo the
// Activity Log on Progression uses (Decision 49). It undoes only if that action's own audit
// entry is still the newest one (by identity: a seq is reused once an undo
// pops it), so a leftover toast can't take back a later action. Lives outside
// #main so a re-render doesn't wipe it.
const TOAST_MS = 6000;
let toastTimer = null;
function undoToastEl(){
  let el=document.getElementById("undotoast");
  if (!el){
    el=document.createElement("div");
    el.id="undotoast"; el.className="toast"; el.setAttribute("role","status"); el.setAttribute("aria-live","polite");
    el.hidden=true;
  }
  // A modal makes the page behind it inert, so the toast rides inside an open
  // one and comes back out when it closes (closeModal).
  const host=document.querySelector("dialog.modal[open]") || document.body;
  if (el.parentNode!==host) host.appendChild(el);
  return el;
}
// W47: the toast's buttons go when it does, and it doesn't know where the
// change was made, so focus that was on them lands on the page it belongs
// to: an open dialog's heading, or the tab's first heading.
function toastLanding(){
  const m=document.getElementById("modal");
  takeFocus(m && m.open ? m.querySelector("#modal-title") : document.querySelector("#main h1, #main h2, #main .sect"), true);
}
function hideUndoToast(){
  clearTimeout(toastTimer); toastTimer=null; tableToast=null;
  const el=document.getElementById("undotoast"); if (!el) return;
  const had=el.contains(document.activeElement);
  el.hidden=true; el.innerHTML="";
  if (had) toastLanding();
}
function showUndoToast(ch, entry, label, done){
  const el=undoToastEl();
  el.innerHTML = done
    ? `<span class="toast-msg">Undone: ${esc(label)}</span>`
    : `<span class="toast-msg">${esc(label)}</span><button class="btn sm" data-toastundo>Undo</button>
       <button class="toast-x" data-toastclose aria-label="Dismiss">×</button>`;
  el.hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(hideUndoToast, done ? 2500 : TOAST_MS);
  const u=el.querySelector("[data-toastundo]");
  if (u) u.onclick=()=>{
    const log=ch.audit||[];
    if (S.ch!==ch || !entry || log[log.length-1]!==entry){ hideUndoToast(); return; }
    const r=Engine.undoLastAction(ch); if (!r.ok){ hideUndoToast(); return; }
    const had=el.contains(document.activeElement);
    update(); showUndoToast(ch, entry, label, true);
    if (had && !el.contains(document.activeElement)) toastLanding();
  };
  const x=el.querySelector("[data-toastclose]"); if (x) x.onclick=hideUndoToast;
}

// ── The table's undo toast (Decision 212) ─────────────────────────────
// The same toast for a table: raised by tableChange (gm.js) when a press
// recorded an entry, and undoing only while that entry is still the newest
// (by identity) on the table it was raised on. `fresh` lasts until the next
// event, so a notice in the same press borrows the toast (its words, Undo kept)
// and a refusal a few seconds later doesn't.
let tableToast = null;   // { table, entry, fresh }
let lastEvent = null;    // the newest click, change, input, keydown or submit: what tableChange asks about typing
for (const type of ["click", "change", "input", "keydown", "submit"])
  document.addEventListener(type, ev=>{ lastEvent={ type, target:ev.target }; if (tableToast) tableToast.fresh=false; }, true);
function paintTableToast(msg, table, entry, fresh){
  const el=undoToastEl();
  el.innerHTML=`<span class="toast-msg wrap">${esc(msg)}</span><button class="btn sm" data-toastundo>Undo</button>
    <button class="toast-x" data-toastclose aria-label="Dismiss">×</button>`;
  el.hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(hideUndoToast, TOAST_MS);
  tableToast={ table, entry, fresh };
  el.querySelector("[data-toastundo]").onclick=()=>{
    const had=el.contains(document.activeElement);
    const label=undoTableEntry(table, entry);   // gm.js: null if it isn't the newest any more
    if (label===null){ hideUndoToast(); return; }
    showTableDone(label);
    if (had && !el.contains(document.activeElement)) toastLanding();
  };
  el.querySelector("[data-toastclose]").onclick=hideUndoToast;
}
function showTableDone(label){ showTableNote("Undone: "+label); }
// A line in the toast, without an Undo: it says a key was heard (Decision 272).
function showTableNote(msg){
  const el=undoToastEl();
  el.innerHTML=`<span class="toast-msg">${esc(msg)}</span>`;
  el.hidden=false; tableToast=null;
  clearTimeout(toastTimer); toastTimer=setTimeout(hideUndoToast, 2500);
}

// ── Modal (Decision 111) ──────────────────────────────────────────────
// The one focus-and-dismiss primitive (W2/W3/W6 want the same one). A native
// <dialog> opened with showModal(): the browser makes the page behind it
// inert, traps Tab, and Esc closes it. Where showModal() is missing (jsdom,
// an old browser) it opens as a plain dialog and Esc is handled here. It
// lives outside #main, so a commit() re-rendering the page behind it leaves
// it alone. Focus goes back to what opened it, or to `returnTo` if a
// re-render replaced that element.
let modalState=null;
function modalEl(){
  let el=document.getElementById("modal");
  if (!el){
    el=document.createElement("dialog");
    el.id="modal"; el.className="modal"; el.setAttribute("aria-labelledby","modal-title");
    el.addEventListener("cancel", e=>{ e.preventDefault(); closeModal(); });
    el.addEventListener("keydown", e=>{ if (e.key==="Escape"){ e.preventDefault(); closeModal(); } });
    el.addEventListener("click", e=>{ if (e.target===el) closeModal(); });   // the backdrop
    document.body.appendChild(el);
  }
  return el;
}
// The head and the footer stay put while the body scrolls. `foot` is the
// footer's HTML; any [data-modalclose] in it closes, and `bind` gets both
// halves, since a footer's buttons can depend on the body's inputs.
// `viaKey` (Decision 259): a key opened it, so focus comes back without moving the page.
function openModal({ title, html, foot, bind, returnTo, onClose, viaKey }){
  const el=modalEl();
  modalState={ opener: document.activeElement, returnTo, onClose, viaKey: !!viaKey };
  el.innerHTML=`<div class="modal-inner"><div class="modal-head"><h2 id="modal-title">${esc(title)}</h2>
    <button class="modal-x" data-modalclose aria-label="Close">×</button></div>
    <div class="modal-body">${html}</div>${foot!=null?`<div class="modal-foot">${foot}</div>`:""}</div>`;
  el.querySelectorAll("[data-modalclose]").forEach(b=>b.onclick=closeModal);
  if (!el.open){ if (typeof el.showModal==="function") el.showModal(); else el.setAttribute("open",""); }
  if (bind) bind(el.querySelector(".modal-body"), el.querySelector(".modal-foot"));
  const first=el.querySelector(".modal-body [autofocus], .modal-body input, .modal-body select");
  if (first) first.focus();
}
function closeModal(){
  const el=document.getElementById("modal"), st=modalState;
  if (!el || !el.open) return;
  modalState=null;
  const toast=document.getElementById("undotoast");
  if (toast && el.contains(toast)) document.body.appendChild(toast);
  if (tipNode && el.contains(tipNode)){ hideTip(); document.body.appendChild(tipNode); }
  if (typeof el.close==="function") el.close(); else el.removeAttribute("open");
  el.innerHTML="";
  if (st && st.onClose) st.onClose();
  // Not every browser focuses a clicked button (Safari doesn't), so <body>
  // doesn't count as an opener.
  const back = st && st.opener && st.opener!==document.body && st.opener.isConnected ? st.opener
             : st && st.returnTo ? document.querySelector(st.returnTo) : null;
  if (back && back.focus){ if (st && st.viaKey) back.focus({ preventScroll:true }); else back.focus(); }
}

// ── Popover (W2/W3) ───────────────────────────────────────────────────
// A small panel under the vital that opened it: lighter than openModal, so
// the page stays live behind it and nothing is made inert. One at a time.
// It lives outside #main, so a commit() re-rendering the page leaves it; the
// render then calls refreshPopover(), which finds the new trigger by its
// `data-vpop` key, redraws the content from `render()` and puts focus back
// on the control that had it. Esc and a click elsewhere close it; Esc hands
// focus back to the trigger (openModal's rule, copied rather than shared,
// since a popover isn't a dialog the page waits on).
let popState=null;
function popEl(){
  let el=document.getElementById("vpop");
  if (!el){
    el=document.createElement("div");
    el.id="vpop"; el.className="popover"; el.hidden=true;
    el.setAttribute("role","dialog"); el.setAttribute("aria-labelledby","vpop-title");
    document.body.appendChild(el);
    document.addEventListener("keydown", e=>{ if (e.key==="Escape" && popState && !document.querySelector("dialog.modal[open]")){ e.preventDefault(); closePopover(true); } });
    document.addEventListener("mousedown", e=>{
      if (!popState) return;
      const t=e.target;
      if (el.contains(t) || (t.closest && t.closest("[data-vpop], #undotoast, dialog.modal"))) return;
      closePopover(false);
    });
    window.addEventListener("resize", ()=>{ if (popState) placePopover(); });
    document.addEventListener("scroll", ()=>{ if (popState) placePopover(); }, true);   // K4: the page's box scrolls, not the window, from 1280px
  }
  return el;
}
// A popover's trigger lives in the page (#main) or in the vitals panel
// (#vdrawer, Decision 160); `scope` says which, since both can hold one key.
const popTrigger = (key, scope="#main") => document.querySelector(`${scope} [data-vpop="${key}"]`);
function placePopover(){
  const el=popEl(), a=popState && popTrigger(popState.key, popState.scope); if (!a) return;
  const r=a.getBoundingClientRect(), vw=document.documentElement.clientWidth||window.innerWidth||0;
  const vh=document.documentElement.clientHeight||window.innerHeight||0;
  const w=el.offsetWidth||320;
  // From the vitals panel it opens to the left of the row, fixed beside the
  // panel, kept on screen.
  const side = popState.scope==="#vdrawer";
  el.classList.toggle("from-rail", side);
  if (side){
    const h=el.offsetHeight||0;
    el.style.top=`${Math.round(Math.max(8, Math.min(r.top, vh - h - 8)))}px`;
    el.style.left=`${Math.round(Math.max(8, r.left - w - 10))}px`;
    return;
  }
  const sc=windowScroll();
  el.style.top=`${Math.round(r.bottom + sc.y + 6)}px`;
  el.style.left=`${Math.round(Math.max(8, Math.min(r.left + sc.x, sc.x + vw - w - 8)))}px`;
}
function drawPopover(){
  const el=popEl(), st=popState, p=st.render();
  if (!p){ closePopover(false); return; }
  el.innerHTML=`<div class="pop-head"><h3 id="vpop-title">${esc(p.title)}</h3>
    <button class="modal-x" data-popclose aria-label="Close">×</button></div><div class="pop-body">${p.html}</div>`;
  el.querySelectorAll("[data-popclose]").forEach(b=>b.onclick=()=>closePopover(true));
  if (st.bind) st.bind(el.querySelector(".pop-body"));
  const t=popTrigger(st.key, st.scope); if (t) t.setAttribute("aria-expanded","true");
}
function openPopover({ key, render, bind, scope="#main" }){
  if (popState && popState.key===key && popState.scope===scope){ closePopover(true); return; }   // the trigger toggles
  if (popState) closePopover(false);
  popState={ key, render, bind, scope };
  const el=popEl(); el.hidden=false;
  drawPopover(); placePopover();
  const first=el.querySelector(".pop-body button:not([disabled]), .pop-body input");
  if (first) first.focus();
}
// After a render: same trigger, fresh numbers, focus where it was.
function refreshPopover(){
  if (!popState) return;
  if (!popTrigger(popState.key, popState.scope)){ closePopover(false); return; }
  // A press the popover greys out (LUCK Regain at 4/4) stays in the popover.
  const st=popState;
  keepPlace(popEl(), ()=>{ drawPopover(); placePopover(); }, ["#vpop-title", ()=>popTrigger(st.key, st.scope)]);
}
function closePopover(returnFocus){
  const st=popState; if (!st) return;
  popState=null;
  const el=popEl(); el.hidden=true; el.innerHTML="";
  const t=popTrigger(st.key, st.scope);
  if (t){ t.setAttribute("aria-expanded","false"); if (returnFocus) t.focus(); }
}

// ── Tips (Decision 139) ───────────────────────────────────────────────
// Any rule the sheet names, a player can read without leaving it (AQ4). A
// trigger carries data-tip="<kind>" and data-term; TIPS[kind](term) says
// what goes in it, or null for nothing. One floating note for the page:
// hover or focus shows it, a click or tap pins it, and Esc, a click
// elsewhere or the trigger leaving the page puts it away. It rides inside an
// open modal, as the undo toast does, since the modal's top layer would
// cover it otherwise. Lighter than openPopover: it holds text, never
// controls, and it never takes focus.
// What a score means, as the tip and Every word both say it: the book's range, how the modifier works, and past 10 what changes.
const statLines = r => [r.range && `${statRangeText(r.range)}: ${r.range.meaning}`, r.rule, r.beyond, r.health].filter(Boolean);
const statRangeText = r => r.min==null ? `${r.max} or lower` : r.max==null ? `${r.min}+` : r.min===r.max ? `${r.min}` : `${r.min}–${r.max}`;
// The character a tip reads when it opens: the open one, else the one the GM's read-only sheet last drew
// (Decision 256), which the table sets after a draw and clears on every other.
let readOnlyChar = null;
const tipChar = () => S.ch || readOnlyChar;
// A line of a term whose numbers the engine leaves for the UI to sign: the minus is written here (Decision 287).
const signedFill = m => m.signed ? m.text.replace(/\{(\w+)\}/g, (x, k)=> k in m.signed ? signed(m.signed[k]) : x) : m.text;
const TIPS = {
  tag: term => { const g=Engine.glossary(term); return g && { title:g.term, text:g.text, note:g.note }; },
  spelltag: term => { const g=Engine.glossary(term, "spell"); return g && { title:g.term, text:g.text, note:g.note }; },
  stat: id => {
    const r = tipChar() && Engine.statReading(tipChar(), id); if (!r) return null;
    return { title:`${r.name} ${r.value}`, text:r.description, more:statLines(r) };
  },
  // Decision 169: what CRANK is and what each tier pays. Below 0 (only Burned goes there, Decision 296) it says so, and says
  // every payout is halved; it's a fact, not a flag, so it's a line of the tip's list rather than a note.
  crank: () => { const R=D.resources.crank, st=tipChar() && Engine.crankState(tipChar()); if (!R) return null;
    const tiers=R.tiers.map(t=>`${t.name} · ${t.rep} rep · ${Engine.crankPayText(t)}`);
    return { title:R.name, text:R.description,
      more: st && st.below ? [R.belowText, ...tiers] : tiers,
      note:"" }; },
  // Decision 287 (W133): a game word inside a sentence. The key is the term's id, then "|" and its number when it has one. The
  // engine says what it means and returns the numbers a line needs signed; the minus is written here.
  term: key => {
    const i = key.indexOf("|"), id = i<0 ? key : key.slice(0, i), p = Engine.term(id, tipChar(), i<0 ? undefined : Number(key.slice(i+1)));
    if (!p) return null;
    if (p.stat){ const t = TIPS.stat(p.stat); if (t) return t; }
    return { title:p.title, text:p.text, more:(p.more||[]).map(signedFill) };
  },
};
// Tags as chips: one the glossary knows opens its sentence; one it doesn't
// stays a plain word.
function tagChipsHtml(tags, kind="tag"){
  return (tags||[]).filter(t=>typeof t==="string" && t).map(t=> TIPS[kind](t)
    ? `<button type="button" class="tag" data-tip="${kind}" data-term="${esc(t)}">${esc(t)}</button>`
    : `<span class="tag plain">${esc(t)}</span>`).join("");
}
// A sentence the sheet writes, with each game word it names as a tip trigger (Decision 287, W133). The engine finds the words
// (the data lists them); everything between them is escaped, so a sentence is text whether or not it holds a term. This is
// the only place a term becomes markup. A trigger is a button of its own, set in the line: it's never inside another one.
function termsHtml(text){
  if (typeof text!=="string" || !text) return "";
  let h = "", at = 0;
  for (const s of Engine.termSpans(text)){
    h += esc(text.slice(at, s.start)) + `<button type="button" class="term" data-tip="term" data-term="${esc(s.id + (s.n===undefined ? "" : "|" + s.n))}">${esc(text.slice(s.start, s.end))}</button>`;
    at = s.end;
  }
  return h + esc(text.slice(at));
}
let tipState=null, tipTimer=null, tipNode=null;
function tipEl(){
  if (!tipNode){
    tipNode=document.createElement("div");
    tipNode.id="tip"; tipNode.className="tip"; tipNode.setAttribute("role","tooltip"); tipNode.hidden=true;
  }
  const host=document.querySelector("dialog.modal[open]") || document.body;
  if (tipNode.parentNode!==host) host.appendChild(tipNode);
  return tipNode;
}
const tipTrigger = e => e.target && e.target.closest ? e.target.closest("[data-tip]") : null;
document.addEventListener("mouseover", e=>{
  const t=tipTrigger(e);
  if (!t || (tipState && (tipState.pinned || tipState.el===t))) return;
  clearTimeout(tipTimer); tipTimer=setTimeout(()=>showTip(t, false), 250);
});
document.addEventListener("mouseout", e=>{
  const t=tipTrigger(e);
  if (!t || (e.relatedTarget && t.contains(e.relatedTarget))) return;
  clearTimeout(tipTimer);
  if (tipState && tipState.el===t && !tipState.pinned) hideTip();
});
document.addEventListener("focusin", e=>{
  const t=tipTrigger(e);
  if (t && !(tipState && tipState.el===t)) showTip(t, false);
});
document.addEventListener("focusout", e=>{
  if (tipState && tipState.el===e.target && !tipState.pinned) hideTip();
});
// Capture, so a tag inside a clickable row or a <summary> reads out
// instead of opening the row.
document.addEventListener("click", e=>{
  const t=tipTrigger(e);
  if (t){
    e.preventDefault(); e.stopPropagation();
    if (tipState && tipState.el===t && tipState.pinned) hideTip(); else showTip(t, true);
    return;
  }
  if (tipState && !(tipNode && tipNode.contains(e.target))) hideTip();
}, true);
document.addEventListener("keydown", e=>{
  if (e.key==="Escape" && tipState){ e.preventDefault(); e.stopPropagation(); hideTip(); }
}, true);
document.addEventListener("scroll", ()=>{ if (tipState) placeTip(); }, true);
function showTip(t, pinned){
  clearTimeout(tipTimer);
  const f=TIPS[t.dataset.tip], p=f && f(t.dataset.term||"");
  if (!p){ hideTip(); return; }
  if (tipState && tipState.el!==t) tipState.el.removeAttribute("aria-describedby");
  const el=tipEl();
  el.innerHTML=`<b class="tip-title">${esc(p.title)}</b>${p.text?`<p>${esc(p.text)}</p>`:""}${
    (p.more||[]).map(x=>`<p>${esc(x)}</p>`).join("")}${p.note?`<p class="tip-note">${esc(p.note)}</p>`:""}`;
  el.hidden=false; el.classList.toggle("pinned", !!pinned);
  tipState={ el:t, pinned:!!pinned };
  t.setAttribute("aria-describedby","tip");
  placeTip();
}
function placeTip(){
  const el=tipNode, st=tipState;
  if (!el || !st) return;
  if (!st.el.isConnected){ hideTip(); return; }
  const host=el.parentNode, inModal=host!==document.body;
  const r=st.el.getBoundingClientRect(), h=inModal ? host.getBoundingClientRect() : { left:-windowScroll().x, top:-windowScroll().y };
  const vw=document.documentElement.clientWidth||window.innerWidth||0, w=el.offsetWidth||300;
  const left=Math.max(8, Math.min(r.left, vw - w - 8));
  el.style.left=`${Math.round(left - h.left)}px`;
  el.style.top=`${Math.round(r.bottom + 6 - h.top)}px`;
}
function hideTip(){
  clearTimeout(tipTimer);
  const st=tipState; tipState=null;
  if (st) st.el.removeAttribute("aria-describedby");
  if (tipNode){ tipNode.hidden=true; tipNode.innerHTML=""; }
}
// After a redraw: a tip whose trigger went with it goes too.
function sweepTip(){ if (tipState && !tipState.el.isConnected) hideTip(); }

// ── Refusals and confirmations (C5) ───────────────────────────────────
// A refused action says why in the toast's place, and doesn't block the
// page the way alert() did. A step that can't be taken back asks in the
// modal, with Cancel focused.
function notice(msg){
  // A press that recorded a table entry keeps its Undo: the notice is the toast's words (Decision 212).
  if (tableToast && tableToast.fresh && tableToast.table===S.table && !undoToastEl().hidden){ paintTableToast(msg, tableToast.table, tableToast.entry, true); return; }
  const el=undoToastEl();
  el.innerHTML=`<span class="toast-msg wrap">${esc(msg)}</span><button class="toast-x" data-toastclose aria-label="Dismiss">×</button>`;
  el.hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(hideUndoToast, TOAST_MS);
  el.querySelector("[data-toastclose]").onclick=hideUndoToast;
}
// ── A file reads in (Decision 319, I4) ────────────────────────────────────────
// A character, a table or a pack slotted in prints what it holds for about a second, over a destination that is already open and
// usable, and lands on one line that stays in the toast. The lines are read from what the gate returned (never the raw file) and set
// with textContent. readSeen and readRun are module state, never S: goHome, openTable and renderTable all replace S.
let readSeen=new Set();   // `${kind}|${meta.id}|${meta.updated}` read in this sitting
let readRun=null;         // { el, timers, off } while a readout is up
const READ_FADE_MS=950, READ_END_MS=1150, READ_STEP_MS=90, READ_MAX_LINES=7;
const roCopy = k => ((D.appCopy||{}).readout||{})[k] || "";
const roFill = (k, v) => roCopy(k).replace(/\{(\w+)\}/g, (m, n)=>v && n in v ? String(v[n]) : m);
function readoutLines(kind, obj, o){
  o = o && typeof o==="object" ? o : {};
  const lines=[], add=fn=>{ try{ const s=fn(); if (typeof s==="string" && s.trim()) lines.push(s); }catch(e){} };
  const safe=(fn, none)=>{ try{ const s=fn(); return typeof s==="string" && s.trim() ? s : none; }catch(e){ return none; } };
  const count=v=>Array.isArray(v) ? v.length : 0;
  const part=(n, one, many)=>n===1 ? roFill(one) : roFill(many, { n });
  add(()=>typeof o.file==="string" && o.file.trim() ? roFill("head", { file:o.file }) : "");
  let last;
  if (kind==="character"){
    const c=obj;
    const name=safe(()=>charName(c, "Unnamed"), "Unnamed");
    last=roFill("charIn", { name });
    add(()=>name);
    add(()=>{ const a=D.archetypes.find(x=>x.id===c.identity.archetype); return a ? Engine.archetypeContent(c).name : ""; });
    add(()=>{ const r=Engine.tagReading(c), n=Engine.tagNumber(c);
      if (r && r.tagless && !r.counterfeit) return r.label;
      return n ? (r && r.label ? `${r.label} · ${n}` : n) : ""; });
    if (safe(()=>c.creation.locked===true ? "y" : "", "")){
      add(()=>{ const s=count(c.sessions), ip=Engine.ipState(c).available, mp=Engine.milestoneState(c).mp;
        return [s>0 ? (s===1 ? roFill("recSession1") : roFill("recSessions", { n:s })) : "", ip>0 ? roFill("recIp", { n:ip }) : "", mp>0 ? roFill("recMp", { n:mp }) : ""].filter(Boolean).join(" · "); });
    } else add(()=>roFill("draft"));
    add(()=>{ const n=Number(o.issues)||0; return n>1 ? roFill("findings", { n }) : n===1 ? roFill("findings1") : ""; });
  } else if (kind==="table"){
    const t=obj;
    const name=safe(()=>tableName(t), "Untitled table");
    last=roFill("tableIn", { name });
    add(()=>name);
    add(()=>[ count(t.sessions) ? part(count(t.sessions), "session1", "sessions") : "", count(t.cast) ? roFill("cast", { n:count(t.cast) }) : "",
      count(t.players) ? part(count(t.players), "player1", "players") : "" ].filter(Boolean).join(" · "));
    add(()=>{ const e=Engine.runningEncounter(t); return e && Number.isFinite(e.round) ? roFill("fight", { n:e.round }) : ""; });
  } else {
    const p=obj;
    const name=safe(()=>packName(p), "Untitled pack");
    let n=0; try{ n=count(p.entries); }catch(e){}
    last=roFill(n===1 ? "packIn1" : "packIn", { name, n });
    add(()=>name);
    add(()=>{ const v=String(p.meta.contentVersion||"").trim(); return v ? roFill("version", { v }) : ""; });
    add(()=>{ const es=Array.isArray(p.entries) ? p.entries : [], npcs=es.filter(e=>e && e.kind==="npc").length, th=es.length-npcs;
      return [th ? part(th, "threat1", "threats") : "", npcs ? part(npcs, "npc1", "npcs") : ""].filter(Boolean).join(" · "); });
  }
  const out=lines.slice(0, READ_MAX_LINES-1); out.push(last);
  return { lines:out, last };
}
function stopReadIn(){
  const r=readRun; readRun=null; if (!r) return;
  r.timers.forEach(clearTimeout); if (r.off) r.off(); if (r.el.parentNode) r.el.remove();
}
function readIn(kind, obj, o){
  o = o && typeof o==="object" ? o : {};
  const r=readoutLines(kind, obj, o), warn=Array.isArray(o.warnings) && typeof o.warnings[0]==="string" ? " "+o.warnings[0] : "";
  notice(r.last+warn);   // the toast speaks the line; nothing here announces it a second time
  let key=null;
  try{ const m=obj && obj.meta; if (m && typeof m.id==="string" && m.id) key=`${kind}|${m.id}|${m.updated}`; }catch(e){}
  const seen=key!==null && readSeen.has(key);
  if (key!==null) readSeen.add(key);
  stopReadIn();
  const head=document.querySelector("header.top");
  if (calm() || seen || !head) return;
  // Built with its text already in it and taken off by a timer, never a frame callback: a pane that doesn't draw shows nothing wrong.
  const el=document.createElement("div");
  el.id="readout"; el.className="readout"; el.setAttribute("aria-hidden","true");
  let top=0; try{ top=Math.round(head.getBoundingClientRect().bottom)+8; }catch(e){}
  el.style.top=`${top}px`;
  r.lines.forEach((s, i)=>{
    const d=document.createElement("div");
    d.className="ro-line"+(i===0 && o.file && r.lines.length>1 ? " ro-dim" : "")+(i===r.lines.length-1 ? " ro-last" : "");
    // One delay per animation: the last line's stamp waits .15s after its own print (an inline single value would start both at once).
    const at=i*READ_STEP_MS;
    d.textContent=s; d.style.animationDelay=i===r.lines.length-1 ? `${at}ms, ${at+150}ms` : `${at}ms`;
    el.appendChild(d);
  });
  document.body.appendChild(el);
  const run={ el, timers:[], off:null }; readRun=run;
  // One tap or key finishes it, and still does what it does: capture, passive, never preventDefault (as the night's does).
  const finish=()=>{ if (readRun===run) stopReadIn(); else run.off && run.off(); };
  const evs=["pointerdown","keydown"];
  run.off=()=>{ evs.forEach(t=>document.removeEventListener(t, finish, { capture:true })); run.off=null; };
  evs.forEach(t=>document.addEventListener(t, finish, { capture:true, passive:true }));
  run.timers.push(setTimeout(()=>el.classList.add("ro-out"), READ_FADE_MS), setTimeout(()=>{ if (readRun===run) stopReadIn(); }, READ_END_MS));
}

function askFirst({ title, text, yes, then, danger=true }){
  openModal({ title, html:`<p>${esc(text)}</p>`,
    foot:`<button class="btn" data-modalclose>Cancel</button><button class="btn ${danger?"danger":"primary"}" data-askyes>${esc(yes)}</button>`,
    bind:(body, foot)=>{
      foot.querySelector("[data-askyes]").onclick=()=>{ closeModal(); then(); };
      foot.querySelector("[data-modalclose]").focus();
    } });
}

// ── Expert mode (Decision 232) ────────────────────────────────────────
// View state of this browser, like Pin and Expand all: never in the character.
// On the Stats, Archetype, Skills and Character Points steps it folds the book's text
// behind a ? beside each name, and keeps the choosing in view. Its toggle is in the
// wizard's header on every step (Decision 234); `expertStep` gates the first-sight hint only. A press of ?
// opens that text in place (no re-render); S.openFolds holds what's open, beside
// S.cpFilter, so a stepper's re-render keeps it. Storage that throws means off.
const EXPERT_KEY = "shadows.ui.expert", EXPERT_SEEN_KEY = "shadows.ui.expertSeen", EXPERT_STEPS = ["stats","archetype","skills","character-points"];
let expertMem = null, expertSeen = false;
// The hint under a step's title, until the toggle has been pressed once in this browser.
function expertHintHtml(){
  if (!expertStep() || expertOn() || expertSeen) return "";
  try{ if (localStorage.getItem(EXPERT_SEEN_KEY)==="1") return ""; }catch(e){}
  return `<p class="step-note expert-hint">${esc(copy("expertHint"))}</p>`;
}
function expertOn(){
  if (expertMem!==null) return expertMem;
  try{ return localStorage.getItem(EXPERT_KEY)==="on"; }catch(e){ return false; }
}
function setExpert(on){
  expertMem = !!on;
  try{ if (on) localStorage.setItem(EXPERT_KEY, "on"); else localStorage.removeItem(EXPERT_KEY); localStorage.setItem(EXPERT_SEEN_KEY, "1"); }catch(e){}
  expertSeen = true;
  S.openFolds = new Set();                       // closes what was opened
}
const expertStep = () => S.screen==="wizard" && !!STEPS[S.step] && EXPERT_STEPS.includes(STEPS[S.step].id);
// A text that folds: the attributes for its element, or nothing with Expert mode off.
function foldAttr(key){
  if (!expertOn()) return "";
  return ` data-foldbody="${esc(key)}"${S.openFolds && S.openFolds.has(key) ? "" : " hidden"}`;
}
// The ? beside an entry's name that opens its text.
function foldBtn(key, name){
  if (!expertOn()) return "";
  const open = !!(S.openFolds && S.openFolds.has(key));
  return `<button class="skill-q" type="button" data-fold="${esc(key)}" aria-expanded="${open}" aria-label="Show the text of ${esc(name)}" title="Read the text">?</button>`;
}
// A line of what a choice gives (Focused Skills, Benefit): never folds. Marked so a test can tell it from prose.
const mechAttr = () => expertOn() ? " data-mech" : "";
function bindFolds(root){
  root.querySelectorAll("[data-fold]").forEach(b=>b.onclick=()=>{
    const key=b.dataset.fold;
    if (!S.openFolds) S.openFolds = new Set();
    const open=!S.openFolds.has(key);
    if (open) S.openFolds.add(key); else S.openFolds.delete(key);
    b.setAttribute("aria-expanded", String(open));
    root.querySelectorAll("[data-foldbody]").forEach(e=>{ if (e.dataset.foldbody===key) e.hidden=!open; });
  });
}

// ── An Advantage's or Disadvantage's effects as tags (Decisions 231, 232) ─────
// A computed one (the sheet applies it) is a chip; a rule (the table applies
// it) is a plain line. `held` is the character's own row for the entry, so a
// held entry's tags speak for its rank and picks; an entry not taken passes
// null and reads its general lines. Shared by the CP step, the Archetype step's
// Natural Advantages, the Character tab, both IP lists and Talented's pick.
function heldRow(ch, kind, id){
  const rows = (kind==="disadvantage" ? ch.disadvantages : ch.advantages).filter(x=>x && x.id===id);
  const rank = rows.reduce((s,x)=>s + Math.max(0, Number(x.rank)||0), 0);
  if (rank<1) return null;
  // What the picker reads (the bought row's answers, cut to the rank), so a tag never names a pick the picker lacks.
  const selections = {};
  for (const p of Engine.picksFor(ch, kind, id)) selections[p.pick.id] = p.chosen;
  return { rank, selections };
}
function effectsHtml(ch, kind, id){
  const tags = Engine.effectTagsFor(kind, id, heldRow(ch, kind, id));
  // A cap this trait set that a stat is already past (Decision 235): said in the tags' place, ahead of them.
  const over = Engine.statOverCap(ch, id);   // an Advantage can set a cap as a Disadvantage does (Decision 135)
  const chips = (over ? `<span class="etag over">${esc(over)}</span>` : "") + tags.map(t=>`<span class="etag ${t.computed?"computed":"rule"}">${esc(t.text)}</span>`).join("");
  return chips ? `<span class="effects">${chips}</span>` : "";
}

// A redraw that changes the page's height (Expert mode folds the text) keeps the
// entry at the top of the viewport where it was, so the page doesn't jump away
// from what's being read. The anchor is the first entry (or heading) below the header.
function anchorKept(draw){
  const hdr=document.querySelector("header.top"), top=(hdr ? hdr.getBoundingClientRect().bottom : 0) + 1;
  const sel=".pick, .alloc-row .name, .sect, .card";
  let list=[...document.querySelectorAll("#main "+sel)], i=list.findIndex(e=>e.getClientRects().length && e.getBoundingClientRect().top>=top);
  const was = i>=0 ? list[i].getBoundingClientRect().top : 0;
  draw();
  if (i<0) return;
  const el=document.querySelectorAll("#main "+sel)[i];
  if (el && el.getClientRects().length){ const d=el.getBoundingClientRect().top-was; if (d) pageScrollBy(d); }
}

// ── Jump bar (W5, W22) ────────────────────────────────────────────────
// Section headings register themselves as a page renders, so a bar jumps to
// whatever the page actually drew: an archetype's panel shows up on its own
// (the "zero app changes" rule). `sect(label, html)`: the short label goes
// on the bar, the html (plain label when omitted) on the heading.
function sectionList(prefix){
  const list=[];
  return { list, sect(label, html){
    const id=`${prefix}-${list.length}`; list.push({ id, label });
    return `<div class="sect" id="${id}" tabindex="-1">${html==null?esc(label):html}</div>`; },
    // A card that is its own heading (Progression's IP) takes the jump's id instead of getting a heading of its own.
    at(label){ const id=`${prefix}-${list.length}`; list.push({ id, label }); return `id="${id}" tabindex="-1"`; } };
}
// `filter` adds a search box over the page's [data-filterable] picks (W22);
// `extra` is anything else the bar should keep in view. `row` (W45) keeps
// the chips to one line that scrolls sideways, with `extra` outside it.
// `wrap` (Decision 209) keeps them in their own box too, but every chip in
// view: the box takes a line of its own and wraps.
function jumpBarHtml(list, { sticky=false, filter=null, extra="", row=false, wrap=false }={}){
  const chips = list.map(s=>`<button class="jump" data-jump="${esc(s.id)}">${esc(s.label)}</button>`).join("");
  return `<nav class="jumpbar${sticky?" sticky":""}${row?" row":""}${wrap?" wrap":""}" aria-label="Jump to a section">${
    filter?`<input type="search" data-jumpfilter value="${esc(filter.value||"")}" placeholder="${esc(filter.placeholder)}" aria-label="${esc(filter.placeholder)}"><span class="jump-count" data-jumpcount aria-live="polite"></span>`:""}${
    wrap ? `<div class="jump-row jump-wrap">${chips}</div>` : row ? `<div class="jump-row scroll-row" data-row="jump">${chips}</div>` : chips}${extra}</nav>`;
}
// W45: a row that scrolls sideways (the vitals bar, a sheet's jump bar)
// fades on the side with more, as the header's tabs do, and keeps its place
// across a re-render, so a popover opened from a pill past the edge still
// opens beside it. Keyboard focus scrolls a chip into view on its own.
const rowScroll = {};
function bindScrollRows(root){
  (root.matches(".scroll-row") ? [root] : root.querySelectorAll(".scroll-row")).forEach(r=>{
    const k = `${r.dataset.row}|${S.section}`;
    if (rowScroll[k]) r.scrollLeft = rowScroll[k];
    tabRowFades(r);
    r.addEventListener("scroll", ()=>{ rowScroll[k]=r.scrollLeft; tabRowFades(r); }, { passive:true });
    wheelSideways(r);
  });
}
// A plain mouse wheel scrolls a sideways row, until it can't. The row hides
// its scrollbar, so without this a mouse can't reach what's past the edge.
function wheelSideways(el){
  el.addEventListener("wheel", e=>{
    if (Math.abs(e.deltaY)<=Math.abs(e.deltaX)) return;
    const was=el.scrollLeft; el.scrollLeft+=e.deltaY;
    if (el.scrollLeft!==was) e.preventDefault();
  }, { passive:false });
}
// Scroll a heading to just under the sticky header (and a sticky bar), then
// give it focus, so the keyboard carries on from there.
function jumpTo(id){
  const el=document.getElementById(id); if (!el) return;
  // A sticky bar's own `top` already counts what's pinned above it: the
  // header, and on a narrow wizard the rail's line (Decision 161).
  // A bar that the CSS lets go (the Reference's on a phone, Decision 209) counts for nothing.
  const hdr=document.querySelector("header.top"), stuck=document.querySelector(".jumpbar.sticky");
  const bar=stuck && getComputedStyle(stuck).position!=="static" ? stuck : null;
  const barTop=bar ? parseFloat(getComputedStyle(bar).top) : NaN;
  const off=(bar && !isNaN(barTop) ? barTop+bar.offsetHeight : (hdr?hdr.offsetHeight:0)+(bar?bar.offsetHeight:0))+8;
  const calm=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try{ pageScrollTo(el.getBoundingClientRect().top + pageScrollTop() - off, calm); }catch(e){}
  el.focus({ preventScroll:true });
}
// W22: hide the picks whose name and text don't match. One you hold
// (data-held: bought or natural ranks) stays, so nothing you've taken disappears. P13: it matches the
// pick's NAME (its h2: the h4 this read since 2026-10-01 matched nothing) and
// every .desc, folded or not, since textContent reads text that's hidden. A
// skill row (.alloc-row) filters the same way, and takes its picks with it.
// `held` (Held only) hides whatever the character doesn't hold.
// `fold` (Decision 279) names the lists ([data-cp-list]) that are open; one that isn't shows only what's held,
// until the filter has text. This is the one place a pick's `hidden` is decided, so a redraw and a cleared
// filter can't disagree about it.
function applyPickFilter(root, q, { held=false, fold=null }={}){
  const k=String(q||"").trim().toLowerCase(); let shown=0, total=0, heldN=0;
  root.querySelectorAll("[data-filterable] .pick, [data-filterable] .alloc-row").forEach(p=>{
    const isRow = p.classList.contains("alloc-row");
    const name = ((isRow ? p.querySelector(".name") : p.querySelector(".head h2")) || {}).textContent || "";
    const text = `${name} ${isRow ? "" : [...p.querySelectorAll(".desc")].map(d=>d.textContent).join(" ")}`.toLowerCase();
    const mine = !isRow && p.hasAttribute("data-held");   // bought, or held as natural ranks only
    total++; if (mine) heldN++;
    const list = fold ? (p.closest("[data-cp-list]")||{dataset:{}}).dataset.cpList : null;
    const folded = !!list && !fold[list];
    const hit = held ? mine : k ? (mine || text.includes(k)) : (mine || !folded);
    p.hidden = !hit; if (hit) shown++;
    // A skill's picks (Martial Arts styles) follow the row they belong to.
    if (isRow) for (let n=p.nextElementSibling; n && n.classList.contains("picks"); n=n.nextElementSibling) n.hidden = !hit;
  });
  return { shown, total, held: heldN, active: !!k || held };
}

// ── Vitals row — the one visual atom the creation rail and the sheet's
// flyout drawer both render (vrow lives here so both can call it). ────────
let lastVitals = {};
// `pop`, when given, makes the row a button that opens that vital's popover
// (the pinned vitals panel, Decision 160).
function vrow(k,v,cls="",ico="",pop=""){
  const changed = lastVitals[k]!==undefined && lastVitals[k]!==String(v);
  lastVitals[k]=String(v);
  const svg = ico && iconSvg(ico);
  const key = svg ? `<span class="k withico"><span class="ico">${svg}</span>${k}</span>` : `<span class="k">${k}</span>`;
  const inner = `${key}<span class="v ${cls} ${changed?"pulse":""}">${v}</span>`;
  return pop ? `<button type="button" class="vrow act" data-vpop="${pop}" aria-haspopup="dialog" aria-expanded="false">${inner}</button>`
    : `<div class="vrow">${inner}</div>`;
}

// Changing archetype invalidates every archetype-specific choice. Both change
// handlers say so in their warning text; only this function makes it true.
// The natural-advantage MIRROR is the easy half to forget: free advantages
// live in archetypeChoices.naturalAdvantages AND as source:"natural" rows in
// ch.advantages, so clearing one side strands the other. A mirror needs one
// writer (Decision 81).
function resetArchetypeChoices(ch){
  // A named pool's count goes with its name (Decision 313): one undo brings both back.
  const pools = Engine.poolsOf(ch);
  if (ch.trackers && ch.trackers.panel && typeof ch.trackers.panel==="object") for (const p of pools) delete ch.trackers.panel[p.id];
  // The engine's shape, so a field it grows is reset with the rest.
  ch.archetypeChoices = Engine.newCharacter().archetypeChoices;
  // Powers are the archetype's too (Decision 153, XQ3): the one being left
  // takes them, and one undo brings them back.
  ch.powers = [];
  // Free advantages belonged to the archetype being left, so they go either
  // way, and so does any the new archetype's classification can't buy
  // (Decision 152: a Supernatural keeps only the Universal ones).
  ch.advantages = ch.advantages.filter(x=>x.source!=="natural" && Engine.canBuyAdvantage(ch, x.id));
  // Starting spells are the Grimoire's own rows (Decision 111), so in the
  // wizard they go with the archetype that chose them. A locked sheet's panels
  // are play history, and the admin change leaves them to its single undo.
  if (!ch.creation.locked) ch.panelData = {};
}

// ── What may replace a saved character (B18, Decisions 128, 141) ──────
// Each character has its own entry, keyed by its TAG, so a different
// character is simply added. The one thing still asked about is a file that
// would put an older copy of a character in place of a newer saved one, with
// a way to export what's there first.
// The name a character goes by, wherever it's shown. A name of only spaces
// is no name: it used to leave the header and Main's heading blank while the
// window's title said "Unnamed".
const charName = (c, none="your unnamed character") => String(((c && c.identity) || {}).name || "").trim() || none;
const intakeOf = c => (c && c.meta && Engine.isIntakeId(c.meta.id)) ? c.meta.id : "";
function supersedes(incoming, saved){
  if (!saved) return true;
  const id = intakeOf(saved);
  if (!id || intakeOf(incoming)!==id) return false;
  const a = Date.parse(((incoming && incoming.meta) || {}).updated), b = Date.parse(((saved && saved.meta) || {}).updated);
  return Number.isFinite(a) && Number.isFinite(b) && a >= b;
}
// `words`: { title, lead, go }. `lead` is HTML the caller has already escaped.
function guardReplace(saved, incoming, words, proceed){
  // The slots hold whatever was saved, possibly by an older app: a 0.11 sheet
  // still says NCR-, and only migrate() turns that into its TAG (Decision 133).
  // Compare what migrate() makes of it, or a player's own file looks foreign.
  saved = saved && Engine.migrate(clone(saved));
  if (supersedes(incoming, saved)) { proceed(); return; }
  const who = esc(charName(saved)), id = intakeOf(saved);
  openModal({ title: words.title,
    html: `<p>${words.lead}</p>
      <p class="step-note">Anything about <b>${who}</b>${id?` (${esc(Engine.tagNumber(saved))})`:""} that you haven't exported is lost.</p>`,
    foot: `<button class="btn" data-replaceexport>Export ${who} first</button>
      <button class="btn primary" data-replacego>${esc(words.go)}</button>
      <button class="btn" data-modalclose>Cancel</button>`,
    bind(body, foot){
      foot.querySelector("[data-replaceexport]").onclick=()=>{ exportCharacter(Engine.migrate(clone(saved))); closeModal(); proceed(); };
      foot.querySelector("[data-replacego]").onclick=()=>{ closeModal(); proceed(); };
    } });
}

// The TAG as the form prints it, under the character's name: a real Code 128 of the number's twelve characters (Decision 320,
// Z1), drawn from Engine.tagBars. One rect per bar. A whole number of CSS pixels a unit, so a bar is the same width at any
// device pixel ratio (a fraction rounds a one-unit bar to one or two device pixels). The quiet zone is the patch's, not the
// drawing's (see .intake-bars). The print header calls this too, so it draws the same bars.
const TAG_UNIT = 2;
function intakeBarsSvg(id){
  const b = Engine.tagBars(id);
  if (!b) return "";
  let x = 0, bars = "";
  b.runs.forEach((w, i) => { if (i % 2 === 0) bars += `<rect x="${x}" y="0" width="${w}" height="20"/>`; x += w; });
  return `<svg class="intake-bars" viewBox="0 0 ${b.modules} 20" width="${b.modules * TAG_UNIT}" height="20" preserveAspectRatio="none" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${bars}</svg>`;
}
// W41: TAG'd or TAGless, the player's pick like their name: the Identity
// step and Admin draw the same toggle, each binding its own `attr`.
function taglessToggleHtml(ch, attr){
  const C = (D.tag||{}).choice||{}, off = !!ch.identity.tagless;
  return `<div class="field tag-choice"><span>TAG</span><div class="form-toggle" role="group" aria-label="TAG">${[["tagged",false],["tagless",true]].map(([k,v])=>
      `<button type="button" data-${attr}="${v?1:0}" class="${off===v?"on":""}" aria-pressed="${off===v}">${esc((C[k]||{}).name||k)}</button>`).join("")}</div>
    <p class="step-note">${esc((C[off?"tagless":"tagged"]||{}).text||"")}</p></div>`;
}
// W31: a Ghost TAG says so over the number, and hovering says what it is.
// W46 (Decision 163): the render after a lock prints the TAG once. The lock
// sets S.issued and renderMain takes it, as it takes a hit's flash.
let issuedNow=false;
// Z1 (Decision 320): the Scan button flips every TAG's bars to black on white, for a phone to read off the dark theme. View state
// in module memory: never S, never storage, gone on reload. A press toggles a class on the .intakes already drawn, so nothing
// re-renders and focus stays on the button; intakeHtml reads it for any render that follows, so a flip survives one.
let tagScanOn=false;
const tagScanWords = on => { const T=(D.appCopy||{}).tagScan||{}; return on ? T.back : T.flip; };
function intakeHtml(ch){
  const id = intakeOf(ch), r = Engine.tagReading(ch), T = (D.appCopy||{}).tagScan||{}, w = esc(tagScanWords(tagScanOn));
  return id ? `<div class="intake${issuedNow?" issued":""}${tagScanOn?" scan":""}" title="${esc(r ? `${r.label}. ${r.text}` : (D.tag||{}).text||"")}">${r?`<span class="intake-label">${esc(r.label)}</span>`:""}${intakeBarsSvg(id)}<button type="button" class="intake-flip" aria-pressed="${tagScanOn}" title="${w}">${esc(T.button)}</button><span class="intake-no">${esc(Engine.tagNumber(ch))}</span></div>` : "";
}
document.addEventListener("click", e=>{
  const b = e.target && e.target.closest ? e.target.closest(".intake-flip") : null;
  if (!b) return;
  tagScanOn = !tagScanOn;
  for (const el of document.querySelectorAll(".intake")){
    el.classList.toggle("scan", tagScanOn);
    const f = el.querySelector(".intake-flip");
    if (f){ f.setAttribute("aria-pressed", String(tagScanOn)); f.title = tagScanWords(tagScanOn); }
    if (!calm()){   // one short wipe, on a press only; a re-render that keeps the flip never plays it
      el.classList.remove("flipping"); void el.offsetWidth; el.classList.add("flipping");
      el.addEventListener("animationend", ()=>el.classList.remove("flipping"), { once:true });
    }
  }
});

// C4: what versionCheck found when this character was loaded. Content the
// game data no longer has, or a journal that disagrees with the totals,
// stays at the top of every page until the player dismisses it; it used to
// vanish on the next click, and a draft's never showed at all. A bare "saved
// against an older game data" is news, not a problem, and a file keeps its
// old stamp until it's next exported, so that alone still shows just once.
function loadFindings(c){
  const issues = Engine.versionCheck(c);
  const versionOnly = issues.length===1 && ((c && c.meta) || {}).gamedataVersion !== D.meta.gamedataVersion;
  return { importIssues: issues, importSticky: !versionOnly };
}
function importIssuesHtml(){
  const failed = saveFailed ? `<div class="import-issues" role="alert">${issuesHtml([{level:"error", msg:"This browser couldn't save your last change. Export the character now so nothing is lost."}])}</div>` : "";
  return failed + loadIssuesHtml();
}
function loadIssuesHtml(){
  const list = S.importIssues || [];
  if (!list.length) return "";
  const body = issuesHtml(list.map(m=>({level:"warn",msg:m})));
  if (!S.importSticky){ S.importIssues = []; return `<div class="import-issues" role="status">${body}</div>`; }
  return `<div class="import-issues" role="status">${body}
    <button class="btn sm" data-importdismiss>Dismiss</button></div>`;
}

// B17: a specialization option's powers — the one it starts with and the
// ones that follow. A power is a name, its text, and optionally a table of
// rows (the Trueborn's four moon phases); any array of plain objects on it
// renders as one, so a new power needs no app change. A power with a name
// and no text isn't written yet, and says so in the app's own status words.
function powerHtml(p){
  if (!p) return "";
  if (typeof p==="string") p = { name: p };
  const rows = Object.values(p).find(v=>Array.isArray(v) && v.length && v.every(r=>r && typeof r==="object" && !Array.isArray(r)));
  // Decision 267: a row's keys are its columns, except the ones code reads (a starter row that runs has an id, a run and grants).
  const cols = rows ? Object.keys(rows[0]).filter(k=>!["id", "run", "grants"].includes(k)) : [];
  const head = c => esc(String(c).replace(/^./, x=>x.toUpperCase()));
  return `<div class="power"><h3>${esc(p.name||"")}${p.description?"":` <span class="chip">${esc(statusLabel("tbd"))}</span>`}</h3>`
    + (p.description?`<p>${esc(p.description)}</p>`:"")
    + (rows?`<table class="ref"><thead><tr>${cols.map(c=>`<th>${head(c)}</th>`).join("")}</tr></thead><tbody>${
        rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c]==null?"":r[c])}</td>`).join("")}</tr>`).join("")}</tbody></table>`:"")
    + `</div>`;
}
function optionPowersHtml(o){
  return o && o.starterPower ? `<div class="powers">${powerHtml(o.starterPower)}</div>` : "";
}
// A specialization's named features (a Werewolf Origin's Shifting, Refuel
// and Need), each "Name: text" on its own line, escaped for a .desc block.
const optionFeatures = o => (o && Array.isArray(o.features) ? o.features : []).filter(f=>f && f.name && f.text);
const optionFeaturesText = o => optionFeatures(o).map(f=>`\n${esc(f.name)}: ${esc(f.text)}`).join("");

function issuesHtml(list){
  if (!list.length) return "";
  return `<ul class="issues">`+list.map(i=>`<li class="${i.level}${i.todo?" todo":""}">${esc(i.msg)}</li>`).join("")+`</ul>`;
}

// Decision 70 — two audiences, two fields. `flagNote` is written for
// Ken and Deighton: flag ids, field paths, "confirm with D". It must never
// reach a player, so flagHtml takes the ENTRY and reads only `playerNote`,
// falling back to one line in D.appCopy. Passing a raw string is not possible
// any more, which is the point — a maintainer note can no longer leak by
// accident. Enforced by a test that scans rendered HTML for flagNote text.
const copy = k => (D.appCopy||{})[k] || "";
// A line from appCopy with its {placeholders} filled, as text (escape it before it goes in HTML). A placeholder with nothing to fill stays out.
const copyFill = (k, vars) => copy(k).replace(/{([^{}]+)}/g, (_, n)=>vars && vars[n]!=null ? String(vars[n]) : "");
function noticeHtml(label, text){
  return `<div class="flag"><div><b>${esc(label)}</b> — ${esc(text)}</div></div>`;
}
// A specialization's Focused Skills as one line, built from its data
// (Decision 134): "Athletics, Awareness, and 1 Combat Skill of your choice".
function focusedSkillsText(f){
  if (!f || typeof f!=="object" || Array.isArray(f)) return "";
  const parts = (f.ids||[]).map(id=>(Engine.skillById(id)||{name:id}).name);
  if (f.choose){
    const n = Number(f.choose.count)||0;
    parts.push(`${n} ${Engine.focusedCategoryName(f.choose.category)} Skill${n===1?"":"s"} of your choice`);
  }
  if (f.all) return `Every skill, at the Focused price up to rank ${f.all.throughRank}`;
  if (!parts.length) return "None";
  return parts.length>1 ? parts.slice(0,-1).join(", ")+", and "+parts[parts.length-1] : parts[0];
}
// The Focused Skill pick: one toggle per skill the engine allows, plus any
// stored pick it doesn't, so the player can clear it. `attr` names the
// binder: the wizard's (data-fskill) or the sheet's (data-fpick).
function focusedPickHtml(ch, attr){
  const fp = Engine.focusedPicks(ch);
  if (!fp) return "";
  const full = fp.have >= fp.need;
  return `<p class="step-note"><em>${fp.have}/${fp.need} chosen.</em></p>` + [...fp.options, ...fp.invalid].map(id=>{
    const s = Engine.skillById(id) || { name:id };
    const on = fp.picks.includes(id), bad = fp.invalid.includes(id);
    return `<div class="pick ${on?"selected":""}"><div class="head"><h2>${esc(s.name)}</h2>
      <div class="controls"><button class="toggle" ${attr}="${esc(id)}" ${!on && !bad && full?"disabled":""}>${bad?"Remove":on?"Chosen":"Choose"}</button></div></div></div>`;
  }).join("");
}
// What a locked character is still owed in Focused Skills (Decision 238): one helper for
// the block at the top of the tab and Character's Focused Skills lines, so the words can't drift.
// `away` is the panel's: the picker is at the top of the tab, not beside the line.
function focusedOwedLines(fp, away){
  if (!fp || fp.complete) return [];
  const more = fp.need - fp.have, cat = Engine.focusedCategoryName(fp.category), out = [];
  if (more>0) out.push(`${more} more ${cat} Skill${more===1?"":"s"} to pick${away?" at the top of this tab":""}.`);
  if (fp.invalid.length) out.push(away ? "One of your Focused Skills isn't allowed any more. Fix it from the line at the top of this tab."
    : "One of your Focused Skills isn't allowed any more.");
  return out;
}
// The ask at the top of every sheet tab (Decision 273): one line and a button. ""
// unless a locked character is short a pick. The picker is in the dialog the button opens.
function focusedOwedHtml(ch){
  if (!ch || !ch.creation || ch.creation.locked!==true) return "";
  const fp = Engine.focusedPicks(ch), lines = focusedOwedLines(fp);
  if (!lines.length) return "";
  return `<div class="focused-owed" role="group" aria-label="Focused Skills" data-focused-owed><span class="focused-owed-text"><b>Focused Skills</b> · ${
    lines.map(esc).join(" ")}</span><button class="btn sm" data-fowedopen>${fp.invalid.length?"Fix":"Choose"}</button></div>`;
}
function flagHtml(entry){
  return `<div class="flag"><div><b>${esc(copy("unsettledLabel"))}</b> — ${termsHtml(String((entry && entry.playerNote) || copy("unsettledRule")))}</div></div>`;
}
// A settled rule that happens to constrain the player is NOT a design flag —
// it reuses the panel but says so, rather than implying the rule is in doubt.
function ruleHtml(text){ return noticeHtml(copy("houseRuleLabel"), text); }
const statusLabel = s => ((D.appCopy||{}).statusLabel||{})[s] || s;
// Decision 275: a draft archetype is playable, so it wears no badge. Only content whose rules aren't written, or a
// write-in, says so where it's chosen.
const showsStatus = a => !!a && a.status!=="final" && a.status!=="draft";

// ── Help: one panel, a host each for the screens that have it (Decisions 278, 166) ───────────────────────
// The panel is `#ghelp` and its scrim `#ghscrim`. What it says and what it does inside is a HOST's: gm.js registers the table's,
// sheet.js the sheet's. A host is { id, btn (the header's ? as a selector), open() (is it open), setOpen(on), context() (the id of
// what's on the page, total), bodyHtml(id), bind(el), key?(id) (what makes a repaint needed), keepView?(view) (does this view outlive a change of page), back?() (where focus goes when it closes, if not btn), opened?(), left?(), synced?(shown) }. This code holds no Help string.
// From 1280px the panel is a column beside the page; narrower it is a flyout over a scrim that shuts at any move, as the vitals
// flyout does (Decision 166), with its own setter: that one is the vitals'.
const HELP_HOSTS = {}, HELP_MEDIA = "(min-width:1280px)";
const helpPinRoom = () => !!(window.matchMedia && window.matchMedia(HELP_MEDIA).matches);
/*PAGE-SCROLL:BEGIN*/
// K4 (Decision N+1): from 1280px #app is the page's scroll box and the window doesn't scroll; narrower the window does. These three are the only
// code that reads or moves the page's scroll (a guard in build.test.mjs fails on any other `window.scroll…`). All total: no #app, no matchMedia, no throw.
function pageScroller(){
  const app=document.getElementById("app");
  return app && helpPinRoom() ? app : (document.scrollingElement || document.documentElement);
}
function scrollPageTop(){
  const box=pageScroller();
  if (box===document.getElementById("app")){ box.scrollTop=0; return; }
  window.scrollTo(0,0);
}
// How far the page is scrolled, as the popover and the tip need it: absolute-placed in the body, they sit in the window's coordinates, which
// the box's scroll doesn't move (it is 0 there), so they are placed again when the box scrolls instead (the scroll listeners below).
const windowScroll = () => ({ x:window.scrollX||0, y:window.scrollY||0 });
function pageScrollBy(dy){
  const box=pageScroller();
  if (box===document.getElementById("app")) box.scrollTop += dy; else window.scrollBy(0, dy);
}
function pageScrollTo(top, calm){
  const box=pageScroller();
  if (box===document.getElementById("app")){ try{ box.scrollTo({ top, behavior: calm?"auto":"smooth" }); }catch(e){ box.scrollTop=top; } return; }
  window.scrollTo({ top, behavior: calm?"auto":"smooth" });
}
// Where the page's top edge is in the viewport's coordinates, and how far it is scrolled (the jump's reach).
const pageScrollTop = () => { const box=pageScroller(); return box===document.getElementById("app") ? box.scrollTop : (window.scrollY||0); };
/*PAGE-SCROLL:END*/
// The host of the screen that's up, or null: a table's, a locked sheet's. A seat's read-only sheet is a table screen.
const helpHost = () => S.screen==="table" ? HELP_HOSTS.table : S.screen==="sheet" && S.ch ? HELP_HOSTS.sheet : null;
let helpKey=null, helpHostId=null, helpPainted=null, helpPaintedCtx=null;
// The data's marks: **bold** is a button or label as the screen has it, `code` is a file name.
const helpMd = s => esc(String(s||"")).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`(.+?)`/g, "<code>$1</code>");
// ── Keys (Decisions 259, 272): the choice to turn them off is this browser's (`shadows.ui.keys` is "off", or anything else, or nothing, is on)
const KEYS_PREF="shadows.ui.keys";
function keysOn(){ try{ return localStorage.getItem(KEYS_PREF)!=="off"; }catch(e){ return true; } }
// Typing is an `input` event on a field; a press that happens while a field still has focus isn't.
const isTextField = el => !!el && (el.tagName==="TEXTAREA" || (el.tagName==="INPUT" && !/^(checkbox|radio|button|submit|reset|range|color|file)$/.test(el.type)));
// A field is isTextField's list plus select and contenteditable.
const inField = el => !!el && (isTextField(el) || el.tagName==="SELECT" || !!(el.closest && el.closest('[contenteditable]:not([contenteditable="false"])')));
const helpContext = () => { const h=helpHost(); return h ? h.context() : null; };
const helpShown = () => { const h=helpHost(); return !!h && h.open(); };
// Where focus goes when the panel leaves: where ? was pressed if it was a key, else the ? button.
function helpHandBack(){
  const back=S.helpReturn, h=helpHost() || HELP_HOSTS[helpHostId];
  S.helpReturn=null;
  const to = back && back.isConnected && back!==document.body && !back.closest("#ghelp") ? back : h && document.querySelector(h.back ? h.back() : h.btn);
  if (to) to.focus({ preventScroll:!!back });
}
// One place that says whether the panel is on screen, as the vitals flyout's setter does: shown, it is the panel; otherwise it is
// out of sight and inert so Tab can't walk into it. Focus leaves before inert lands. The panel is emptied when the screen's host
// changes, not when a redraw happens: the sheet's draws call this too.
function syncHelp(){
  const el=$("ghelp"), sc=$("ghscrim"), app=$("app"); if (!el) return;
  const host=helpHost(), id=host ? host.id : null;
  const shown=helpShown();
  if (!shown && el.contains(document.activeElement)) helpHandBack();
  el.classList.toggle("open", shown);
  el.setAttribute("aria-hidden", shown?"false":"true");
  el.toggleAttribute("inert", !shown);
  if (id) el.setAttribute("data-host", id); else el.removeAttribute("data-host");
  if (sc){ sc.classList.toggle("open", shown); sc.onclick=closeHelp; }   // a click on the scrim shuts the flyout, as the vitals scrim does
  if (app) app.classList.toggle("help-pinned", shown);
  const b=host && document.querySelector(host.btn); if (b) b.setAttribute("aria-expanded", shown?"true":"false");
  if (host && host.synced) host.synced(shown);
  if (id!==helpHostId){
    const prev=HELP_HOSTS[helpHostId]; if (prev && prev.left) prev.left();
    el.innerHTML=""; helpKey=null;
    if (id==="sheet" || helpHostId==="sheet"){ S.helpFrom=null; S.helpCtx=null; S.helpView=null; S.helpQ=""; }   // the sheet's Help never carries into another screen's
    helpHostId=id;
  }
}
function openHelp({ viaKey, returnTo }={}){
  const h=helpHost(); if (!h) return;
  S.helpReturn = returnTo || (viaKey && document.activeElement!==document.body ? document.activeElement : null);
  h.setOpen(true); S.helpView=null; S.helpQ=""; S.helpFrom=helpContext(); S.helpCtx=S.helpFrom;
  if (h.opened) h.opened();
  helpPaintedCtx=null;   // a fresh opening starts at the top
  syncHelp(); paintHelp(true);
  const x=$("ghelp").querySelector("[data-help-close]"); if (x) x.focus({ preventScroll:true });
}
function closeHelp(){
  const h=helpHost(); if (!h) return;
  h.setOpen(false);
  syncHelp();
  // Closed by the button or a click on the scrim, with focus nowhere: it goes back to what opens it.
  if (!document.activeElement || document.activeElement===document.body) helpHandBack();
}
function toggleHelp(opts){ if (helpShown()) closeHelp(); else openHelp(opts); }
// Esc closes one layer. A flyout covers the page, so it answers Esc anywhere; a column answers it only from inside itself,
// since Esc in the page beside it is the page's.
function helpEscCloses(){ const el=$("ghelp"); return helpShown() && !!el && (!helpPinRoom() || el.contains(document.activeElement)); }
// K4 (Decision N): a switch in ⋮. The item names the switch and says whether it's on (a chip from the guide's own On and Off), with
// aria-pressed; a press flips it, redraws that one item in place and leaves ⋮ open with focus on the item. The press stops here: the page's
// click-away that shuts ⋮ would otherwise see a target the redraw replaced.
const menuSwitchHtml = (name, label, on, u) => `<button type="button" data-menu-switch="${name}" aria-pressed="${on}">${esc(label)} <span class="menu-state" aria-hidden="true">${esc(on ? u.on : u.off)}</span></button>`;   // aria-pressed says the state; the chip is for the eye, so the name stays put
function bindMenuSwitch(root, name, get, set, u){
  const find = () => document.querySelector(`#hdrmenu [data-menu-switch="${name}"]`);
  const b=root.querySelector(`[data-menu-switch="${name}"]`); if (!b) return;
  b.onclick=e=>{
    e.stopPropagation();
    set(!get());
    const menu=$("hdrmenu"), kb=document.querySelector("#hdractions [data-menu-toggle]"), now=find(), on=get();
    if (menu){ menu.hidden=false; if (kb) kb.setAttribute("aria-expanded","true"); }
    if (now){ now.setAttribute("aria-pressed", String(on)); const chip=now.querySelector(".menu-state"); if (chip) chip.textContent=on ? u.on : u.off; now.focus({ preventScroll:true }); }
  };
}
// K4 (Decision 306): one head for both hosts. The title, then `extra` and Close: the buttons that act rather than show a view
// (the table's Shortcuts, which opens a box) sit beside Close in the title row (Ken, 2026-11-21: on its own line under the tabs it
// looked stranded). Then the tabs, only views: each is { view (S.helpView it opens: null, "night", "words"), label, attr (its data
// attribute, which the tests and Shortcuts' returnTo find it by) }. The open tab is the one whose view is S.helpView. It sticks to the top of the panel.
function helpHeadHtml(title, tabs, u, extra){
  return `<div class="help-head"><div class="dhead"><h2 id="ghelp-h" tabindex="-1">${esc(title)}</h2>${extra||""}
      <button type="button" class="btn sm" data-help-close aria-label="${esc(u.close)} ${esc(u.title.toLowerCase())}">${esc(u.close)}</button></div>
    <div class="help-tabs" role="group" aria-label="${esc(u.title)}">${tabs.map(t=>{ const on=(S.helpView||null)===t.view;
      return `<button type="button" class="btn sm help-tab${on ? " on" : ""}" ${t.attr}${on ? ' aria-current="page"' : ""}>${esc(t.label)}</button>`; }).join("")}</div></div>`;
}
// A tab press: the view changes under the pressed tab, which keeps focus; the filter is cleared by leaving, never stored.
const HELP_TAB_VIEWS = { "data-hpage":null, "data-hnight":"night", "data-hwords":"words" };
function bindHelpTabs(el){
  for (const attr of Object.keys(HELP_TAB_VIEWS)){
    const b=el.querySelector("["+attr+"]"); if (!b) continue;
    b.onclick=()=>{
      S.helpView=HELP_TAB_VIEWS[attr]; S.helpQ=""; paintHelp();
      const again=$("ghelp") && $("ghelp").querySelector("["+attr+"]"); if (again) again.focus({ preventScroll:true });
    };
  }
}
// The head's height is what the find bar sticks under: read from the head, so a tab row that wraps moves it.
// One observer, moved to each new head: a paint replaces the head, so the last one is let go rather than watched forever.
let helpHeadRO=null;
function sizeHelpHead(el){
  const head=el.querySelector(".help-head"); if (!head) return;
  const set=()=>el.style.setProperty("--help-head-h", head.offsetHeight + "px");
  set();
  if (!window.ResizeObserver) return;
  if (helpHeadRO) helpHeadRO.disconnect();
  helpHeadRO=new ResizeObserver(set); helpHeadRO.observe(head);
}
// Drawn again only when the page it is for, or its view, has changed: a press inside it must keep its focus.
function paintHelp(force){
  const el=$("ghelp"), h=helpHost(); if (!el || !h || !helpShown()) return;
  const id=h.context();
  if (helpPinRoom()) S.helpFrom=id;   // a column follows the page, so a resize to a flyout starts from the page it's on
  if (S.helpCtx!==id){ S.helpCtx=id; if (!(h.keepView && h.keepView(S.helpView))) S.helpView=null; }   // a new page gets its own help, not the last view, unless the host says the view is about neither
  const key=h.key ? h.key(id) : id + "|" + (S.helpView||"");
  if (!force && helpKey===key && el.firstElementChild) return;
  const hadFocus=el.contains(document.activeElement), ae=document.activeElement;
  // The filter box keeps its focus, caret and scroll through a draw it didn't ask for: a sheet redraw beside the column is one.
  const inQ=!!ae && !!ae.matches && ae.matches("[data-help-q]") && el.contains(ae), sel=inQ ? [ae.selectionStart, ae.selectionEnd] : null;
  // The panel's scroll is kept only for a redraw of the same page in the same view (a sheet's redraw beside the column); a tab press or a
  // new page starts at the top, and nothing carries over from the last time Help was open (K4 review).
  // A view the host keeps across pages (the sheet's Vocab) is the same view on the new page too, so it keeps its place.
  const top=helpPainted===(S.helpView||null) && (helpPaintedCtx===id || !!(helpPaintedCtx && h.keepView && h.keepView(S.helpView))) ? el.scrollTop : 0;
  el.innerHTML=h.bodyHtml(id); helpKey=key; helpPainted=S.helpView||null; helpPaintedCtx=id;
  el.querySelectorAll("[data-help-close]").forEach(b=>b.onclick=closeHelp);
  h.bind(el);
  bindHelpTabs(el);
  sizeHelpHead(el);
  bindHelpList(el);
  if (inQ){ const q=el.querySelector("[data-help-q]"); if (q){ q.focus({ preventScroll:true }); try{ q.setSelectionRange(sel[0], sel[1]); }catch(e){} } }
  el.scrollTop=top;
  if (hadFocus && !el.contains(document.activeElement)){ const h2=$("ghelp-h"); if (h2) h2.focus({ preventScroll:true }); }
}

// ── Every word's list (K2): a filter, a letter row and the words, A to Z. Both hosts draw it, each from its own words; a row is
// { title, kind (small, "" for none), html (its body, already safe), find (what a title match looks at), text (what a text match looks at) }
// and arrives sorted. The filter hides rows in place and never draws the panel again, so the box keeps its focus: it is view state
// (S.helpQ) and is never stored. A title match wins; the text is looked at only when no title matches.
const helpLetter = t => { const c=String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").charAt(0).toUpperCase(); return /^[A-Z]$/.test(c) ? c : "#"; };
function helpListHtml(rows, u){
  const have=new Set(rows.map(r=>helpLetter(r.title))), letters=[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", ...(have.has("#") ? ["#"] : [])];
  return `<div class="help-find"><label class="help-q-label" for="ghelp-q">${esc(u.filterLabel)}</label>
      <input type="search" id="ghelp-q" class="help-q" data-help-q placeholder="${esc(u.filterLabel)}" autocomplete="off" spellcheck="false" value="${esc(S.helpQ||"")}">
      <div class="help-jump" role="group" aria-label="${esc(u.jumpLabel)}">${letters.map(L=>`<button type="button" class="help-letter" data-help-letter="${L}"${have.has(L) ? "" : " disabled"}>${L}</button>`).join("")}</div></div>
    <dl class="help-words help-all">${rows.map(r=>`<div class="help-word" data-hw-letter="${helpLetter(r.title)}" data-hw-title="${esc(String(r.find||r.title).toLowerCase())}" data-hw-text="${esc(String(r.text||"").toLowerCase())}"><dt tabindex="-1">${esc(r.title)}${r.kind ? ` <small class="help-kind">${esc(r.kind)}</small>` : ""}</dt><dd>${r.html}</dd></div>`).join("")}</dl>
    <p class="step-note help-none" data-help-none data-msg="${esc(u.filterEmpty)}" role="status"></p>`;
}
function bindHelpList(el){
  const q=el.querySelector("[data-help-q]"); if (!q) return;
  const rows=[...el.querySelectorAll(".help-word")], letters=[...el.querySelectorAll("[data-help-letter]")], none=el.querySelector("[data-help-none]");
  const apply=()=>{
    const v=q.value.trim().toLowerCase(); S.helpQ=q.value;
    let show=rows;
    if (v){ const t=rows.filter(r=>r.dataset.hwTitle.includes(v)); show = t.length ? t : rows.filter(r=>r.dataset.hwText.includes(v)); }
    const on=new Set(show), have=new Set(show.map(r=>r.dataset.hwLetter));
    rows.forEach(r=>{ r.hidden=!on.has(r); });
    letters.forEach(b=>{ b.disabled=!have.has(b.dataset.helpLetter); });
    if (none) none.textContent = show.length ? "" : none.dataset.msg;
  };
  q.oninput=apply;
  // Esc clears what's typed and stays; with the box empty it is the panel's, as everywhere.
  q.onkeydown=e=>{ if (e.key==="Escape" && q.value){ e.preventDefault(); q.value=""; apply(); } };
  letters.forEach(b=>b.onclick=()=>{
    const r=rows.find(x=>!x.hidden && x.dataset.hwLetter===b.dataset.helpLetter); if (!r) return;
    // The panel scrolls, not the page behind it; the sticky head and find bar cover the top of the list, so they are left out of the reach.
    const bar=q.closest(".help-find"), head=el.querySelector(".help-head");
    const covered=(bar && getComputedStyle(bar).position==="sticky" ? bar.offsetHeight : 0) + (head && getComputedStyle(head).position==="sticky" ? head.offsetHeight : 0);
    el.scrollTop=Math.max(0, r.offsetTop - covered);
    const dt=r.querySelector("dt"); if (dt) dt.focus({ preventScroll:true });
  });
  apply();
}

// ── Editable tables (weapons / gear / archetype panel tables) — shared by
// the Loadout tab's renderer and the sheet's event bindings. ─────────────
const WEAPON_COLS=["name","damage","capacity","ammo","features","notes"];
const GEAR_COLS=["name","type","notes"];
function editTable(rows, cols, key, addLabel){
  let h = `<table class="edit"><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join("")}<th></th></tr></thead><tbody>`;
  rows.forEach((r,i)=>{
    h += `<tr>` + cols.map(c=>`<td><input type="text" data-cell="${key}|${i}|${esc(c)}" value="${esc(r[c]||"")}" aria-label="${esc(c)}"></td>`).join("") +
      `<td class="rm"><button class="x" data-rowdel="${key}|${i}" title="remove row">✕</button></td></tr>`;
  });
  h += `</tbody></table><button class="btn sm" data-rowadd="${key}">+ ${esc(addLabel)}</button>`;
  return h;
}
function panelRows(ch, key){
  if (key==="weapons") return ch.weapons;
  if (key==="gear") return ch.gear;
  if (!ch.panelData[key]) ch.panelData[key]=[];
  return ch.panelData[key];
}

// ── Notes, one list for both sides (Decision 323) ────────────────────────────
// A note is { id, title, text, category, tags, session, created, updated } on a table and, soon, on a sheet. This draws the
// list: the Group by control, the tag row, then the groups of titles, one note open at a time. It reads the notes it's given
// and names no side; the caller says who may edit and how a session is spelled. Group by and the tag filter are view state
// ({ by, tag }), never stored. `o`: { open, editing (note ids or null), editable, sessions (the choices, [{ id, label }]),
// sessionLabel(id), editBtn(n), doneBtn(n) }. The data- attributes are the table's (data-nopen, data-ntitle, ...).
const noteName = n => String(n.title||"").trim() || String(n.text||"").split(/\r?\n/).map(x=>x.trim()).find(Boolean) || "Untitled note";
const NOTE_BYS = [["category","Category"], ["session","Session"], ["newest","Newest"]];
const noteView = v => ({ by:v && NOTE_BYS.some(x=>x[0]===v.by) ? v.by : "category", tag:v && typeof v.tag==="string" ? v.tag : null });
function noteTagFieldHtml(n, id, tagsInUse){
  const tags = Array.isArray(n.tags) ? n.tags : [];
  return `<div class="field note-tagfield" role="group" aria-label="Tags"><span>Tags</span>
    ${tags.length ? `<span class="note-tags">${tags.map((x, i)=>`<span class="tag plain note-tag">${esc(x)}<button type="button" class="note-tagx" data-ntagrm="${id}" data-ntagi="${i}" aria-label="Remove tag ${esc(x)}">&times;</button></span>`).join("")}</span>` : ""}
    <span class="note-tagadd"><input type="text" data-ntagin="${id}" list="ntags-${id}" maxlength="40" placeholder="Add a tag" aria-label="Add a tag" autocomplete="off">
    <button type="button" class="btn sm" data-ntagadd="${id}">Add</button></span>
    <datalist id="ntags-${id}">${tagsInUse.map(x=>`<option value="${esc(x)}"></option>`).join("")}</datalist></div>`;
}
function noteCardHtml(n, o){
  const id = esc(n.id), open = o.open===n.id, editing = o.editable && open && o.editing===n.id, label = o.sessionLabel(n.session);
  const cat = String(n.category||"").trim(), tags = Array.isArray(n.tags) ? n.tags : [];
  const chips = (label ? ` <span class="tag plain">${esc(label)}</span>` : "") + (cat ? ` <span class="tag plain note-cat">${esc(cat)}</span>` : "")
    + tags.map(x=>` <span class="tag plain note-tagc">${esc(x)}</span>`).join("");
  const row = `<button type="button" class="cast-open note-open" data-nopen="${id}" aria-expanded="${open}">${esc(noteName(n))}</button>${chips}`;
  if (!open) return `<li class="tbl-note" data-note="${id}"><div class="note-head">${row}</div></li>`;
  if (!editing) return `<li class="tbl-note open" data-note="${id}"><div class="note-head">${row} ${o.editable ? o.editBtn(n) : ""}</div>
    ${String(n.text||"").trim() ? `<p class="dos-p note-text">${esc(n.text)}</p>` : ""}</li>`;
  return `<li class="tbl-note open editing" data-note="${id}"><div class="note-head">${row}</div>
    <label class="field"><span>Title</span><input type="text" data-ntitle="${id}" value="${esc(n.title)}" placeholder="Untitled note" autocomplete="off"></label>
    <label class="field"><span>Note</span><textarea data-ntext="${id}" placeholder="Leads, debts, names to remember.">${esc(n.text)}</textarea></label>
    <label class="field"><span>Category</span><input type="text" data-ncat="${id}" list="ncats-${id}" value="${esc(cat)}" placeholder="No category" autocomplete="off">
      <datalist id="ncats-${id}">${o.categories.map(x=>`<option value="${esc(x)}"></option>`).join("")}</datalist></label>
    ${noteTagFieldHtml(n, id, o.tagsInUse)}
    <label class="field"><span>Session</span><select data-nsess="${id}"><option value="">None</option>${o.sessions.map(s=>`<option value="${esc(s.id)}"${s.id===n.session ? " selected" : ""}>${esc(s.label)}</option>`).join("")}</select></label>
    <p class="note-acts">${o.doneBtn(n)} <button class="btn sm danger" data-ndel="${id}">Delete</button></p></li>`;
}
function notesListHtml(notes, sessions, view, o){
  const v = noteView(view), all = Array.isArray(notes) ? notes : [], tagsInUse = Engine.noteTagsInUse(all);
  // A filter on a tag no note holds any more filters nothing.
  const tag = v.tag && tagsInUse.some(x=>x.toLowerCase()===v.tag.toLowerCase()) ? v.tag : null;
  const opts = { ...o, categories:Engine.noteCategoriesInUse(all), tagsInUse };
  // A new note (o.pin) sits above the groups until Done. A note in Edit stays in the group it was in when Edit was pressed
  // (o.held: its category and session then, a snapshot) and moves to its new one on Done, so typing a category or removing a
  // tag never moves it under the GM's hands. It is also shown whatever the tag filter says, until Done.
  const pinned = o.editable && o.pin ? all.find(n=>n.id===o.pin && n.id===o.editing && n.id===o.open) : null;
  const held = o.editable && !pinned && o.held ? all.find(n=>n.id===o.held.id && n.id===o.editing && n.id===o.open) : null;
  const proxy = held ? { ...held, category:o.held.category, session:o.held.session, tags:tag && !(held.tags||[]).some(x=>x.toLowerCase()===tag.toLowerCase()) ? (held.tags||[]).concat(tag) : held.tags } : null;
  const groups = Engine.noteGroups(all.filter(n=>n!==pinned).map(n=>n===held ? proxy : n), sessions, { by:v.by, tag })
    .map(g=>({ ...g, notes:g.notes.map(n=>n===proxy ? held : n) }));
  const bar = `<div class="form-toggle note-by" role="group" aria-label="Group by">${NOTE_BYS.map(([k, name])=>
      `<button type="button" data-ngroup="${k}" class="${k===v.by?"on":""}" aria-pressed="${k===v.by}">${esc(name)}</button>`).join("")}</div>
    ${tagsInUse.length ? `<div class="note-tagrow" role="group" aria-label="Filter by tag">${tagsInUse.map(x=>{ const on = tag!==null && x.toLowerCase()===tag.toLowerCase();
      return `<button type="button" class="tag note-tagpick${on?" on":""}" data-ntag="${esc(x)}" aria-pressed="${on}">${esc(x)}</button>`; }).join("")}</div>` : ""}`;
  const none = { category:"No category", session:"No session" };
  const lists = groups.map(g=>`${v.by==="newest" ? "" : `<h2 class="ref-sub note-group">${esc(g.title===null ? none[v.by] : v.by==="session" ? (o.sessionLabel(g.key) || g.title) : g.title)}</h2>`}
    <ul class="int-list note-list">${g.notes.map(n=>noteCardHtml(n, opts)).join("")}</ul>`).join("");
  return `${bar}${pinned ? `<ul class="int-list note-list note-pinned">${noteCardHtml(pinned, opts)}</ul>` : ""}${lists}`;
}
