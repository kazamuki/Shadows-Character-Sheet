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
// primary adds its score and the synergy its modifier (030), so the synergy
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
const STEPS = D.creationFlow.steps.map(s=>({id:s.id, n:s.n, short:s.short||s.label, label:s.label, note:s.note}))
  .concat([{id:"review", n:D.creationFlow.steps.length+1, short:"Review", label:"Review, lock, and export"}]);
const SHEET_SECTIONS = [
  {id:"main",        label:"Main",        ui:"tab_main"},
  {id:"skills",      label:"Skills",      ui:"tab_skills"},
  {id:"character",   label:"Character",   ui:"tab_archetype"},
  {id:"trackers",    label:"Trackers",    ui:"tab_trackers"},
  {id:"progression", label:"Progression", ui:"tab_progression"},
  {id:"sessions",    label:"Session Log", ui:"tab_sessions"},
  {id:"loadout",     label:"Loadout & Powers", ui:"tab_loadout"},
  {id:"notes",       label:"Notes",       ui:"tab_notes"}
];
const SHEET_IDS = SHEET_SECTIONS.map(s=>s.id);
// Older saved sections: Traits and Archetype became Character (Decision 158).
const LEGACY_SECTION = { overview:"main", traits:"character", archetype:"character" };
// "admin" is a hidden section (no tab) reachable only while admin mode is on.
const normSection = s => s==="admin" ? (S.admin?"admin":"main")
                        : (SHEET_IDS.includes(s) ? s : (LEGACY_SECTION[s] || "main"));
let S = { screen:"home", ch:null, step:0, maxReached:0, section:"main", admin:false };

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
  if (rerenderMain){ renderMain(); sweepTip(); }
  renderLedger(); renderVitals();
}

// Every state-changing sheet action runs through commit(): snapshot
// the character, run the mutation, record a reversible audit entry, then save +
// re-render. Admin edits use the same path, so the activity log is complete.
const clone = x => (x==null ? x : JSON.parse(JSON.stringify(x)));
function commit(kind, label, fn){
  const ch=S.ch; if(!ch) return;
  const before=clone(ch);
  fn();
  const r=Engine.recordAction(ch, kind, label, before);
  // meta.updated is "last changed" (Decision 128), so a file can be told from
  // an older copy of itself. diffChar skips meta: nothing here is undoable.
  if (r && r.ok){ if (!ch.meta || typeof ch.meta!=="object") ch.meta={}; ch.meta.updated=new Date().toISOString(); }
  S.landed=landedFrom(before, ch);
  update();
  if (r && r.ok) showUndoToast(ch, ch.audit[ch.audit.length-1], label);
}

// W15 — let a hit land. When an action leaves more damage than before (a
// hit, Hurt, a Turn Reset tick), the next render marks the HP readouts, the
// Health Level boxes that took it, and the Pain readouts if the Pain Level
// went up. The render takes it once (landedNow), so the flash plays once and
// a later re-render doesn't replay it. Healing and undo never flash. The CSS
// drops the animation under prefers-reduced-motion.
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
const landedCls = (what, i) => !landedNow ? "" : what==="hp" ? " struck"
  : what==="pain" ? (landedNow.pain ? " painup" : "") : landedNow.cells.has(i) ? " landed" : "";

// W12 — undo where the action happened. Every commit() that changed something
// offers its own undo for a few seconds, through the same LIFO undo the
// Session Log uses (Decision 49). It undoes only if that action's own audit
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
  clearTimeout(toastTimer); toastTimer=null;
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
function openModal({ title, html, foot, bind, returnTo, onClose }){
  const el=modalEl();
  modalState={ opener: document.activeElement, returnTo, onClose };
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
  if (back && back.focus) back.focus();
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
  el.style.top=`${Math.round(r.bottom + (window.scrollY||0) + 6)}px`;
  el.style.left=`${Math.round(Math.max(8, Math.min(r.left + (window.scrollX||0), (window.scrollX||0) + vw - w - 8)))}px`;
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
const statRangeText = r => r.min==null ? `${r.max} or lower` : r.max==null ? `${r.min}+` : r.min===r.max ? `${r.min}` : `${r.min}–${r.max}`;
const TIPS = {
  tag: term => { const g=Engine.glossary(term); return g && { title:g.term, text:g.text, note:g.note }; },
  spelltag: term => { const g=Engine.glossary(term, "spell"); return g && { title:g.term, text:g.text, note:g.note }; },
  stat: id => {
    const r = S.ch && Engine.statReading(S.ch, id); if (!r) return null;
    return { title:`${r.name} ${r.value}`, text:r.description,
      more:[r.range && `${statRangeText(r.range)}: ${r.range.meaning}`, r.rule, r.beyond, r.health].filter(Boolean) };
  },
};
// Tags as chips: one the glossary knows opens its sentence; one it doesn't
// stays a plain word.
function tagChipsHtml(tags, kind="tag"){
  return (tags||[]).filter(t=>typeof t==="string" && t).map(t=> TIPS[kind](t)
    ? `<button type="button" class="tag" data-tip="${kind}" data-term="${esc(t)}">${esc(t)}</button>`
    : `<span class="tag plain">${esc(t)}</span>`).join("");
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
  const r=st.el.getBoundingClientRect(), h=inModal ? host.getBoundingClientRect() : { left:-(window.scrollX||0), top:-(window.scrollY||0) };
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
  const el=undoToastEl();
  el.innerHTML=`<span class="toast-msg wrap">${esc(msg)}</span><button class="toast-x" data-toastclose aria-label="Dismiss">×</button>`;
  el.hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(hideUndoToast, TOAST_MS);
  el.querySelector("[data-toastclose]").onclick=hideUndoToast;
}
function askFirst({ title, text, yes, then, danger=true }){
  openModal({ title, html:`<p>${esc(text)}</p>`,
    foot:`<button class="btn" data-modalclose>Cancel</button><button class="btn ${danger?"danger":"primary"}" data-askyes>${esc(yes)}</button>`,
    bind:(body, foot)=>{
      foot.querySelector("[data-askyes]").onclick=()=>{ closeModal(); then(); };
      foot.querySelector("[data-modalclose]").focus();
    } });
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
    return `<div class="sect" id="${id}" tabindex="-1">${html==null?esc(label):html}</div>`; } };
}
// `filter` adds a search box over the page's [data-filterable] picks (W22);
// `extra` is anything else the bar should keep in view.
function jumpBarHtml(list, { sticky=false, filter=null, extra="" }={}){
  return `<nav class="jumpbar${sticky?" sticky":""}" aria-label="Jump to a section">${
    filter?`<input type="search" data-jumpfilter value="${esc(filter.value||"")}" placeholder="${esc(filter.placeholder)}" aria-label="${esc(filter.placeholder)}"><span class="jump-count" data-jumpcount aria-live="polite"></span>`:""}${
    list.map(s=>`<button class="jump" data-jump="${esc(s.id)}">${esc(s.label)}</button>`).join("")}${extra}</nav>`;
}
// Scroll a heading to just under the sticky header (and a sticky bar), then
// give it focus, so the keyboard carries on from there.
function jumpTo(id){
  const el=document.getElementById(id); if (!el) return;
  // A sticky bar's own `top` already counts what's pinned above it: the
  // header, and on a narrow wizard the rail's line (Decision 161).
  const hdr=document.querySelector("header.top"), bar=document.querySelector(".jumpbar.sticky");
  const barTop=bar ? parseFloat(getComputedStyle(bar).top) : NaN;
  const off=(bar && !isNaN(barTop) ? barTop+bar.offsetHeight : (hdr?hdr.offsetHeight:0)+(bar?bar.offsetHeight:0))+8;
  const calm=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try{ window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off, behavior: calm?"auto":"smooth" }); }catch(e){}
  el.focus({ preventScroll:true });
}
// W22: hide the picks whose name and description don't match. One you hold
// (.selected) stays, so nothing you've taken disappears.
function applyPickFilter(root, q){
  const k=String(q||"").trim().toLowerCase(); let shown=0, total=0;
  root.querySelectorAll("[data-filterable] .pick").forEach(p=>{
    total++;
    const text=`${(p.querySelector("h4")||{}).textContent||""} ${(p.querySelector(".desc")||{}).textContent||""}`.toLowerCase();
    const hit=!k || p.classList.contains("selected") || text.includes(k);
    p.hidden=!hit; if (hit) shown++;
  });
  return { shown, total, active: !!k };
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

// The TAG as the form prints it, under the character's name. The
// bars are drawn from the number itself, five per character: decoration
// that reads as a barcode, not one a scanner would read.
function intakeBarsSvg(id){
  const A = "0123456789ABCDEFGHJKMNPQRSTVWXYZ", s = String(id||"").replace(/^[A-Z]{3}-/, "").replace(/-/g, "");
  if (!s) return "";
  let x = 0, bars = "";
  const bar = w => { bars += `<rect x="${x}" y="0" width="${w}" height="20"/>`; x += w + 1; };
  bar(1); bar(1); x += 1;
  for (const ch of s){ const v = Math.max(0, A.indexOf(ch)); for (let b=4;b>=0;b--) bar((v>>b)&1 ? 2 : 1); x += 1; }
  bar(1); bar(1);
  return `<svg class="intake-bars" viewBox="0 0 ${x} 20" width="${Math.round(x*1.4)}" height="20" preserveAspectRatio="none" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${bars}</svg>`;
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
function intakeHtml(ch){
  const id = intakeOf(ch), r = Engine.tagReading(ch);
  return id ? `<div class="intake${issuedNow?" issued":""}" title="${esc(r ? `${r.label}. ${r.text}` : (D.tag||{}).text||"")}">${r?`<span class="intake-label">${esc(r.label)}</span>`:""}${intakeBarsSvg(id)}<span class="intake-no">${esc(Engine.tagNumber(ch))}</span></div>` : "";
}

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
  const cols = rows ? Object.keys(rows[0]) : [];
  const head = c => esc(String(c).replace(/^./, x=>x.toUpperCase()));
  return `<div class="power"><h3>${esc(p.name||"")}${p.description?"":` <span class="chip">${esc(statusLabel("tbd"))}</span>`}</h3>`
    + (p.description?`<p>${esc(p.description)}</p>`:"")
    + (rows?`<table class="ref"><thead><tr>${cols.map(c=>`<th>${head(c)}</th>`).join("")}</tr></thead><tbody>${
        rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(r[c]==null?"":r[c])}</td>`).join("")}</tr>`).join("")}</tbody></table>`:"")
    + `</div>`;
}
function optionPowersHtml(o){
  const list = [o && o.starterPower, ...((o && o.additionalPowers) || [])].filter(Boolean);
  return list.length ? `<div class="powers">${list.map(powerHtml).join("")}</div>` : "";
}

function issuesHtml(list){
  if (!list.length) return "";
  return `<ul class="issues">`+list.map(i=>`<li class="${i.level}">${esc(i.msg)}</li>`).join("")+`</ul>`;
}

// Decision 70 — two audiences, two fields. `flagNote` is written for
// Ken and Deighton: flag ids, field paths, "confirm with D". It must never
// reach a player, so flagHtml takes the ENTRY and reads only `playerNote`,
// falling back to one line in D.appCopy. Passing a raw string is not possible
// any more, which is the point — a maintainer note can no longer leak by
// accident. Enforced by a test that scans rendered HTML for flagNote text.
const copy = k => (D.appCopy||{})[k] || "";
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
function flagHtml(entry){
  return noticeHtml(copy("unsettledLabel"), (entry && entry.playerNote) || copy("unsettledRule"));
}
// A settled rule that happens to constrain the player is NOT a design flag —
// it reuses the panel but says so, rather than implying the rule is in doubt.
function ruleHtml(text){ return noticeHtml(copy("houseRuleLabel"), text); }
const statusLabel = s => ((D.appCopy||{}).statusLabel||{})[s] || s;

// ── Editable tables (weapons / gear / archetype panel tables) — shared by
// the Loadout tab's renderer and the sheet's event bindings. ─────────────
const WEAPON_COLS=["name","type","damage","rof","capacity","ammo","features","notes"];
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
