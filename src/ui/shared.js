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
const STEPS = D.creationFlow.steps.map(s=>({id:s.id, n:s.n, label:s.label, note:s.note}))
  .concat([{id:"review", n:D.creationFlow.steps.length+1, label:"Review, lock, and export"}]);
const SHEET_SECTIONS = [
  {id:"main",        label:"Main",        ui:"tab_main"},
  {id:"skills",      label:"Skills",      ui:"tab_skills"},
  {id:"traits",      label:"Traits",      ui:"tab_traits"},
  {id:"archetype",   label:"Archetype",   ui:"tab_archetype"},
  {id:"trackers",    label:"Trackers",    ui:"tab_trackers"},
  {id:"progression", label:"Progression", ui:"tab_progression"},
  {id:"sessions",    label:"Session Log", ui:"tab_sessions"},
  {id:"loadout",     label:"Loadout & Powers", ui:"tab_loadout"},
  {id:"notes",       label:"Notes",       ui:"tab_notes"}
];
const SHEET_IDS = SHEET_SECTIONS.map(s=>s.id);
const LEGACY_SECTION = { overview:"main" };   // migrate older saved sections
// "admin" is a hidden section (no tab) reachable only while admin mode is on.
const normSection = s => s==="admin" ? (S.admin?"admin":"main")
                        : (SHEET_IDS.includes(s) ? s : (LEGACY_SECTION[s] || "main"));
let S = { screen:"home", ch:null, step:0, maxReached:0, section:"main", admin:false };

// Autosave (guarded — the app works fine without storage)
const DRAFT_KEY = "shadows.draft.v1";
const ACTIVE_KEY = "shadows.active.v1";   // Phase 3: live sheet survives refresh
function saveDraft(){ try{ if(S.ch && !S.ch.creation.locked) localStorage.setItem(DRAFT_KEY, JSON.stringify({ch:S.ch, step:S.step, maxReached:S.maxReached})); }catch(e){} }
function loadDraft(){ try{ const r=localStorage.getItem(DRAFT_KEY); return r?JSON.parse(r):null; }catch(e){ return null; } }
function clearDraft(){ try{ localStorage.removeItem(DRAFT_KEY); }catch(e){} }
function saveActive(){ try{ if(S.ch && S.ch.creation.locked) localStorage.setItem(ACTIVE_KEY, JSON.stringify({ch:S.ch, section:S.section})); }catch(e){} }
function loadActive(){ try{ const r=localStorage.getItem(ACTIVE_KEY); return r?JSON.parse(r):null; }catch(e){ return null; } }

function update(rerenderMain=true){
  saveDraft(); saveActive();
  if (rerenderMain) renderMain();
  renderLedger(); renderVitals();
}

// Phase 3.3 — every state-changing sheet action runs through commit(): snapshot
// the character, run the mutation, record a reversible audit entry, then save +
// re-render. Admin edits use the same path, so the activity log is complete.
const clone = x => (x==null ? x : JSON.parse(JSON.stringify(x)));
function commit(kind, label, fn){
  const ch=S.ch; if(!ch) return;
  const before=clone(ch);
  fn();
  const r=Engine.recordAction(ch, kind, label, before);
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
function hideUndoToast(){
  clearTimeout(toastTimer); toastTimer=null;
  const el=document.getElementById("undotoast"); if (el){ el.hidden=true; el.innerHTML=""; }
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
    update(); showUndoToast(ch, entry, label, true);
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
const popTrigger = key => document.querySelector(`#main [data-vpop="${key}"]`);
function placePopover(){
  const el=popEl(), a=popState && popTrigger(popState.key); if (!a) return;
  const r=a.getBoundingClientRect(), vw=document.documentElement.clientWidth||window.innerWidth||0;
  const w=el.offsetWidth||320;
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
  const t=popTrigger(st.key); if (t) t.setAttribute("aria-expanded","true");
}
function openPopover({ key, render, bind }){
  if (popState && popState.key===key){ closePopover(true); return; }   // the trigger toggles
  if (popState) closePopover(false);
  popState={ key, render, bind };
  const el=popEl(); el.hidden=false;
  drawPopover(); placePopover();
  const first=el.querySelector(".pop-body button:not([disabled]), .pop-body input");
  if (first) first.focus();
}
// After a render: same trigger, fresh numbers, focus where it was.
function refreshPopover(){
  if (!popState) return;
  if (!popTrigger(popState.key)){ closePopover(false); return; }
  const el=popEl(), f=document.activeElement;
  const attr=f && el.contains(f) ? [...f.attributes].find(a=>a.name.startsWith("data-")) : null;
  drawPopover(); placePopover();
  const again=attr && el.querySelector(`[${attr.name}="${attr.value.replace(/"/g,'\\"')}"]`);
  if (again) again.focus();
}
function closePopover(returnFocus){
  const st=popState; if (!st) return;
  popState=null;
  const el=popEl(); el.hidden=true; el.innerHTML="";
  const t=popTrigger(st.key);
  if (t){ t.setAttribute("aria-expanded","false"); if (returnFocus) t.focus(); }
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
  const hdr=document.querySelector("header.top"), bar=document.querySelector(".jumpbar.sticky");
  const off=(hdr?hdr.offsetHeight:0)+(bar?bar.offsetHeight:0)+8;
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
function vrow(k,v,cls="",ico=""){
  const changed = lastVitals[k]!==undefined && lastVitals[k]!==String(v);
  lastVitals[k]=String(v);
  const svg = ico && iconSvg(ico);
  const key = svg ? `<span class="k withico"><span class="ico">${svg}</span>${k}</span>` : `<span class="k">${k}</span>`;
  return `<div class="vrow">${key}<span class="v ${cls} ${changed?"pulse":""}">${v}</span></div>`;
}

// Changing archetype invalidates every archetype-specific choice. Both change
// handlers say so in their warning text; only this function makes it true.
// The natural-advantage MIRROR is the easy half to forget: free advantages
// live in archetypeChoices.naturalAdvantages AND as notes:"natural" rows in
// ch.advantages, so clearing one side strands the other. A mirror needs one
// writer (Decision 81).
function resetArchetypeChoices(ch){
  ch.archetypeChoices = { rolls:{}, focusAllocation:{}, statBonusAllocation:{},
    specialization:[], focusedSkillPicks:[], naturalAdvantages:[], disciplines:{} };
  const a = Engine.archetype(ch);
  // Free advantages belonged to the archetype being left, so they go either
  // way. A supernatural archetype cannot purchase at all, so it keeps none.
  ch.advantages = (a && a.canPurchaseAdvantages===false)
    ? [] : ch.advantages.filter(x=>x.notes!=="natural");
  // Starting spells are the Grimoire's own rows (Decision 111), so in the
  // wizard they go with the archetype that chose them. A locked sheet's panels
  // are play history, and the admin change leaves them to its single undo.
  if (!ch.creation.locked) ch.panelData = {};
}

function issuesHtml(list){
  if (!list.length) return "";
  return `<ul class="issues">`+list.map(i=>`<li class="${i.level}">${esc(i.msg)}</li>`).join("")+`</ul>`;
}

// Batch 2 / Decision 70 — two audiences, two fields. `flagNote` is written for
// Ken and Deighton: flag ids, field paths, "confirm with D". It must never
// reach a player, so flagHtml takes the ENTRY and reads only `playerNote`,
// falling back to one line in D.appCopy. Passing a raw string is not possible
// any more, which is the point — a maintainer note can no longer leak by
// accident. Enforced by a test that scans rendered HTML for flagNote text.
const copy = k => (D.appCopy||{})[k] || "";
function noticeHtml(label, text){
  return `<div class="flag"><div><b>${esc(label)}</b> — ${esc(text)}</div></div>`;
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
