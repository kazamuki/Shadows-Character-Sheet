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
  Engine.recordAction(ch, kind, label, before);
  update();
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
