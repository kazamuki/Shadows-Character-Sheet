// The locked character's live sheet: nine tabs plus the hidden Admin section.
// Reads/writes the shared state and helpers declared in shared.js.

// B8: the CRB floors Essence dice at 1 and Breaker at 10% "to prevent
// automatic loss". The app can't apply them — it never sees the dice pool or
// the target number — so it states them next to the penalty. Without this a
// player at Pain Level 3 reads "-3 Essence die" and rolls nothing.
function painPenaltyLine(pain, long){
  const e = pain.essenceFloor==null ? "" : ` (min ${pain.essenceFloor})`;
  const b = pain.breakerFloor==null ? "" : ` (min ${pain.breakerFloor}%)`;
  return `${pain.skillPenalty} ${long?"Skill checks":"skill"}`
       + ` · ${pain.essencePenalty} ${long?"Essence dice":"Essence"}${e}`
       + ` · ${pain.breakerPenalty}% Breaker${b}`;
}

// ════ PHASE 3 — LIVE SHEET ════════════════════════════════════════════
function sheetHeader(title, note){
  let h = "";
  if (S.importIssues && S.importIssues.length){
    h += issuesHtml(S.importIssues.map(m=>({level:"warn",msg:m})));
    S.importIssues = []; // surface once; versionCheck reruns on next import
  }
  h += `<div class="eyebrow">Live Sheet</div><h1 class="step-title">${esc(title)}</h1>`;
  if (note) h += `<p class="step-note">${note}</p>`;
  return h;
}
const painChip = pain => pain.level
  ? ` <span class="chip pain">Pain Lv ${pain.level} · ${pain.skillPenalty} skill</span>` : "";

// Phase 3.3 — persistent reminder + jump-to-editor while admin mode is on.
function adminBannerHtml(){
  return `<div class="admin-banner"><span class="dot"></span><b>ADMIN MODE</b>
    <span class="note">Free editing — caps and pools are off. Every change is logged to the Activity Log and can be undone.</span>
    <span class="sp"></span>
    <button class="btn sm" data-admin-open ${S.section==="admin"?"disabled":""}>Open editor</button>
    <button class="btn sm danger" data-admin-exit>Exit admin</button></div>`;
}

// Horizontal tab bar — the sheet's primary navigation once locked.
function tabButtonsHtml(){
  return SHEET_SECTIONS.map(sec=>{
    const cls = ["tab", sec.id===S.section?"active":""].join(" ");
    const ico = sec.ui ? `<span class="tico">${uiIcon(sec.ui)}</span>` : "";
    return `<button class="${cls}" data-sec="${sec.id}">${ico}${esc(sec.label)}</button>`;
  }).join("");
}

// Shared fragments reused across tabs ---------------------------------
// The four spheres, in display order. Presentation only (stays out of
// shadows-data.js). SAN is intentionally absent — it lives as the live
// Sanity card in the Main condition strip, so repeating it here would be
// the duplicate Ken flagged. TOL/WILL have no modifier, so they render as
// value-only cells.
const STAT_GROUPS = [
  ["BOD","REF","MOB"],     // Physical
  ["INT","TECH","COOL"],   // Mental
  ["MAG","EMP"],           // Social
  ["TOL","WILL"]           // Soul
];
// Phase 3.3 — human-readable derivation of a computed attribute, generated
// from shadows-data.js (base + inputs) so it stays correct if a formula changes.
function derivedBreakdownStr(ch, id){
  const def=(D.derived||[]).find(d=>d.id===id), t=Engine.statTable(ch);
  if (def && def.type==="sumOfModifiers"){
    const sum=def.inputs.reduce((s,sid)=>s+t[sid].mod,0);
    const raw=def.base+sum, core=Math.max(def.floor!=null?def.floor:raw, raw);
    const total=Engine.derived(ch)[id], bonus=total-core;
    let s = `${def.base} ` + def.inputs.map(sid=>{ const m=t[sid].mod; return `${m>=0?"+":"−"} ${sid} ${Math.abs(m)}`; }).join(" ") + ` = ${raw}`;
    if (core!==raw) s += ` → floor ${core}`;
    if (bonus)     s += ` ${bonus>0?"+":"−"} ${Math.abs(bonus)} bonus → ${total}`;
    return s;
  }
  if (id==="SAN"){
    const emp=t.EMP.value, raw=emp*10, total=Engine.derived(ch).SAN;
    return `EMP ${emp} × 10 = ${raw}%` + (total!==raw?` → ${total}% (floor 10 / cap 95)`:"");
  }
  return "";
}
function statCellHtml(ch, id){
  const t=Engine.statTable(ch);
  if (t[id]){
    const m=t[id].mod;
    return `<div class="statcell">${statIco(id)}<div class="sid">${id}</div><div class="sv">${t[id].value}</div>
      <div class="sm2 ${m>0?"pos":m<0?"neg":""}">${m>=0?"+":""}${m}</div></div>`;
  }
  // derived (TOL/WILL): value only, with a "?" that reveals how it's derived
  const der=Engine.derived(ch), open=!!(S.openDerived && S.openDerived.has(id)), bd=derivedBreakdownStr(ch,id);
  return `<div class="statcell">${statIco(id)}<div class="sid">${id}</div><div class="sv">${der[id]}</div>
    ${bd?`<button class="deriv-q" data-derivdesc="${id}" aria-expanded="${open?"true":"false"}" title="How ${id} is derived">?</button>
    <div class="dvbd" data-derivrow="${id}"${open?"":" hidden"}>${esc(bd)}</div>`:""}</div>`;
}
function groupedStatBlockHtml(ch){
  return `<div class="statgroups">` + STAT_GROUPS.map(g=>
    `<div class="statgroup">` + g.map(id=>statCellHtml(ch,id)).join("") + `</div>`
  ).join("") + `</div>`;
}

// Phase 3.3 — Main health as Health-Level segments (no numbers): one segment
// per HL, filling magenta with damage just like the Trackers HL track, so the
// depletion / "pain journey" reads at a glance. Partial fill on the current HL.
function hlMiniHtml(ch){
  const hp=Engine.health(ch);
  if (hp.levels<=0 || hp.hpPer<=0) return "";
  let s=`<div class="hl-mini" aria-hidden="true">`;
  for (let i=0;i<hp.levels;i++){
    const lvlDmg=Math.max(0, Math.min(hp.hpPer, (ch.trackers.damage||0) - i*hp.hpPer));
    const gone=lvlDmg>=hp.hpPer, frac=(lvlDmg/hp.hpPer);
    s+=`<span class="seg ${gone?"gone":""}"><i style="transform:scaleX(${frac.toFixed(2)})"></i></span>`;
  }
  return s+`</div>`;
}

// Horizontal vitals bar — the locked sheet's at-a-glance readout, shown
// below the tab bar on every tab except Main (Main has its condition strip).
function sheetVitalsBar(ch){
  const hp=Engine.health(ch), pain=Engine.painState(ch), luck=Engine.luckState(ch),
        san=Engine.sanState(ch), sf=Engine.sfr(ch), ip=Engine.ipState(ch), ms=Engine.milestoneState(ch);
  const pill=(cls,ui,k,v)=>`<div class="vpill ${cls}">${ui?`<span class="vico">${uiIcon(ui)}</span>`:""}<span class="vtext"><span class="vk">${k}</span><span class="vv">${v}</span></span></div>`;
  let h=`<div class="vbar" aria-label="Vitals">`;
  h+=pill(pain.down?"hp danger":"hp","health","HP",`${pain.hpLeft}<small>/${hp.total}</small>`);
  h+=pill(pain.level?"danger":"","pain","Pain",pain.down?"DOWN":(pain.level?`Lv ${pain.level} <small>${pain.skillPenalty}</small>`:"&mdash;"));
  h+=pill(san.current<=san.max/2?"san danger":"san","sanity","SAN",`${san.current}<small>/${san.max}%</small>`);
  h+=pill(luck.current===0?"luck danger":"luck","luck","LUCK",`${luck.current}<small>/${luck.max}</small>`);
  if (sf && sf.value!=null){ const left=Math.max(0,sf.value-(ch.trackers.sfr.spent||0));
    h+=pill("sfr","sfr","SFR",`${left}<small>/${sf.value}</small>`); }
  h+=pill("cred","credits","Ç",`${ch.trackers.credits.current}`);
  h+=pill(ip.available<0?"danger":"","","IP",`${ip.available}`);
  h+=pill("","","MP",`${ms.mp}`);
  h+=`<button class="vpill toggle" data-vitals-toggle aria-label="Open full vitals"><span class="vtext"><span class="vk">Vitals</span><span class="vv" style="font-size:.82rem">View ▸</span></span></button>`;
  return h+`</div>`;
}

// Full vitals readout for the flyout drawer — the creation rail's format,
// available from any tab via the bar's "Vitals" toggle.
function vitalsPanelHtml(ch){
  const pl=Engine.powerLevel(ch), a=Engine.archetype(ch);
  const der=Engine.derived(ch), hp=Engine.health(ch), t=Engine.statTable(ch);
  const pain=Engine.painState(ch), luck=Engine.luckState(ch), san=Engine.sanState(ch);
  const ip=Engine.ipState(ch), ms=Engine.milestoneState(ch), sfr=Engine.sfr(ch);
  let h = `<div class="dhead"><h2>Vitals</h2><button class="dclose" data-vitals-close aria-label="Close vitals">✕</button></div>`;
  h += `<div class="vgroup"><div class="vname">${esc(ch.identity.name)||"&mdash;"}</div>
    <div class="vsub">${a?esc(a.name):"no archetype"} · ${pl?esc(pl.name):"no power level"}</div></div>`;
  h += `<div class="vgroup">`;
  h += vrow("HP", pain.hpLeft+" / "+hp.total, pain.down?"over":"hp");
  h += vrow("Pain", pain.down?"DOWN":"Lv "+pain.level+(pain.level?" ("+pain.skillPenalty+" skill)":""), pain.level?"over":"");
  h += vrow("SAN", san.current+" / "+san.max+"%", san.current<=san.max/2?"over":"");
  h += vrow("LUCK", luck.current+" / "+luck.max, luck.current===0?"over":"gold");
  if (sfr && sfr.value!=null) h += vrow("SFR", Math.max(0,sfr.value-(ch.trackers.sfr.spent||0))+" / "+sfr.value);
  h += vrow("Ç", ch.trackers.credits.current, "gold");
  h += `</div><div class="vgroup">`;
  h += vrow("IP", ip.available, ip.available<0?"over":"");
  h += vrow("Milestone Pts", ms.mp);
  h += `</div><div class="vgroup">` + D.stats.map(s=>{
    const m=t[s.id].mod; return vrow(s.id, t[s.id].value+" ("+(m>=0?"+":"")+m+")", "", s.id);
  }).join("") + `</div>`;
  h += `<div class="vgroup">`
     + vrow("TOL", der.TOL, "", "TOL")   + `<div class="vbd">${esc(derivedBreakdownStr(ch,"TOL"))}</div>`
     + vrow("WILL", der.WILL, "", "WILL") + `<div class="vbd">${esc(derivedBreakdownStr(ch,"WILL"))}</div>`
     + vrow("SAN", san.current+" / "+san.max+"%", "", "SAN") + `<div class="vbd">${esc(derivedBreakdownStr(ch,"SAN"))}</div>`
     + `</div>`;
  return h;
}
// One skill category as a check table. cats: trained rows; opt. untrained too.
// Skill rendering -----------------------------------------------------
// A fixed colgroup keeps Rank / Check / Breakdown aligned across categories,
// and each row carries a "?" that expands the skill's description from data.
function skillColgroup(withRank=true){
  return withRank
    ? `<colgroup><col class="c-name"><col class="c-rank"><col class="c-check"><col class="c-break"></colgroup>`
    : `<colgroup><col class="c-name"><col class="c-check"><col class="c-break"></colgroup>`;
}
function skillDescRow(def, cols, open){
  const covers = Array.isArray(def.covers) ? def.covers.join(", ") : (def.covers||"");
  return `<tr class="skill-desc" data-descrow="${def.id}"${open?"":" hidden"}><td colspan="${cols}">
    <div class="skill-desc-body">${esc(def.description||"No description on file.")}${covers?`<div class="covers">Covers: ${esc(covers)}</div>`:""}</div></td></tr>`;
}
// Returns the skill's main row plus its (hidden) description row.
function skillRowPair(ch, l, {withRank=true}={}){
  const open = !!(S.openSkills && S.openSkills.has(l.def.id));
  const focused = Engine.focusedSkillIds(ch);
  const b=l.breakdown;
  const parts = l.trained
    ? [`rank ${b.rank}`, `${b.primary.id||"?"} ${b.primary.value}`,
       `${b.synergy.mod>=0?"+":"−"}${Math.abs(b.synergy.mod)} ${b.synergy.id||"?"} syn`]
    : [`${b.primary.id} ${b.primary.value}`, `<span style="color:var(--dim)">untrained</span>`];
  if (b.pain) parts.push(`<span style="color:var(--magenta)">${b.pain} pain</span>`);
  const ipe = ch.skills[l.def.id] ? ch.skills[l.def.id].ipe : 0;
  const q = `<button class="skill-q" data-skilldesc="${l.def.id}" aria-expanded="${open?"true":"false"}" aria-label="Toggle description" title="Description">?</button>`;
  let tr = `<tr class="skill-line"${l.trained?"":' style="opacity:.72"'}>`;
  tr += `<td>${esc(l.def.name)}${focused.includes(l.def.id)?' <span class="chip gold">focused</span>':""}${ipe?` <span class="chip cyan">+${ipe} IP</span>`:""}${q}</td>`;
  if (withRank) tr += `<td class="num">${l.trained?l.rank:"—"}</td>`;
  tr += `<td class="num">1d10 + ${l.checkBonus}</td>`;
  tr += `<td class="bd">${parts.join(" · ")}</td></tr>`;
  return tr + skillDescRow(l.def, withRank?4:3, open);
}
// One category as a standalone aligned table (used on Main for Combat).
function skillTableHtml(ch, cid, cname, {includeUntrained=false}={}){
  const all = D.skills.filter(s=>s.category===cid).map(s=>Engine.skillLine(ch,s.id));
  const rows = includeUntrained ? all : all.filter(l=>l.trained);
  if (!rows.length) return "";
  return `<table class="ref skill-table">${skillColgroup(true)}
    <thead><tr><th>${esc(cname)}</th><th>Rank</th><th>Check</th><th>Breakdown</th></tr></thead>
    <tbody>` + rows.map(l=>skillRowPair(ch,l,{withRank:true})).join("") + `</tbody></table>`;
}

// ── Sheet: MAIN (what you need right now) ────────────────────────────
function renderShMain(){
  const ch=S.ch, pl=Engine.powerLevel(ch), a=Engine.archetype(ch);
  const hp=Engine.health(ch), pain=Engine.painState(ch);
  const luck=Engine.luckState(ch), san=Engine.sanState(ch), sf=Engine.sfr(ch);
  const id=ch.identity;
  let h = sheetHeader(id.name||"Unnamed", `${a?esc(a.name):"—"}${id.specialization?" · "+esc(id.specialization):""} · ${pl?esc(pl.name):"—"}`);

  // Condition strip — replaces the Vitals rail on this tab (full width)
  const pct = (n,d)=> d>0 ? Math.max(0,Math.min(100,Math.round(n/d*100))) : 0;
  const cond = (cls,name,uiName,big,meta,meter,seg)=>`<div class="cond ${cls}"><div class="corner">${uiIcon(uiName)}</div>
    <div class="lab">${name}</div><div class="big">${big}</div>${meta?`<div class="meta">${meta}</div>`:""}${seg?seg:(meter!=null?`<div class="meter"><i style="width:${meter}%"></i></div>`:"")}</div>`;
  h += `<div class="cond-grid">`;
  h += cond(`hp ${pain.down?"danger":""}`,"Health","health",
    `${pain.hpLeft}<small>/${hp.total}</small>`, pain.down?"DOWN":`${hp.levels} HL × ${hp.hpPer}`, null, hlMiniHtml(ch));
  h += cond(`${pain.level?"danger":""}`,"Pain","pain",
    pain.level?`Lv ${pain.level}`:"—", pain.level?painPenaltyLine(pain,false):"no penalties", null);
  h += cond(`san ${san.current<=san.max/2?"danger":""}`,"Sanity","sanity",
    `${san.current}<small>/${san.max}%</small>`, "", pct(san.current,san.max));
  h += cond(`luck ${luck.current===0?"danger":""}`,"Luck","luck",
    `${luck.current}<small>/${luck.max}</small>`, "", pct(luck.current,luck.max));
  if (sf && sf.value!=null){
    const sfLeft=Math.max(0,sf.value-(ch.trackers.sfr.spent||0));
    h += cond("sfr","SFR","sfr", `${sfLeft}<small>/${sf.value}</small>`, `RoU ${sf.rou}`, pct(sfLeft,sf.value));
  }
  h += cond("cred","Çredits","credits", `Ç${ch.trackers.credits.current}`, "", null);
  h += `</div>`;

  // Two-column command console: stats on the left, combat on the right
  h += `<div class="main-grid">`;

  // ── left: stats, clustered into the four spheres ──
  h += `<section class="main-stats"><div class="sect">Stats</div>${groupedStatBlockHtml(ch)}</section>`;

  // ── right: combat skills + weapons ──
  h += `<section class="main-combat"><div class="sect">Combat${painChip(pain)}</div>`;
  if (pain.level) h += `<p class="step-note" style="margin-bottom:10px">${esc(pain.label)} — all checks take ${pain.skillPenalty}; totals below include it.</p>`;
  h += skillTableHtml(ch, "combat", "Combat Skill", {includeUntrained:true}) || `<p class="step-note">No combat skills defined.</p>`;
  if (ch.weapons && ch.weapons.length){
    h += `<div class="sect">Weapons</div>
      <table class="ref"><thead><tr><th>Weapon</th><th>Dmg</th><th>RoF</th><th>Cap.</th><th>Features</th></tr></thead><tbody>` +
      ch.weapons.map(w=>`<tr><td>${esc(w.name)||"—"}</td><td class="num">${esc(w.damage)||"—"}</td>
        <td class="num">${esc(w.rof)||"—"}</td><td class="num">${esc(w.capacity)||"—"}${w.ammo?` (${esc(w.ammo)})`:""}</td>
        <td style="font-size:.76rem;color:var(--dim)">${esc(w.features)||"—"}</td></tr>`).join("") +
      `</tbody></table>`;
  }
  h += `</section></div>`;   // /main-grid

  // Identity — reference, kept at the bottom and collapsible
  if (id.age!=null || id.build || id.hair || id.eyes || id.skin || id.history){
    h += `<details class="group" style="margin-top:8px"><summary>Identity &amp; History</summary>
      <div class="review-block" style="margin-top:8px"><div class="kv">
      ${id.age!=null?`<span class="k">Age</span><span class="v">${id.age}</span>`:""}
      ${id.build?`<span class="k">Build</span><span class="v">${esc(id.build)}</span>`:""}
      ${(id.hair||id.eyes||id.skin)?`<span class="k">Hair / Eyes / Skin</span><span class="v">${[id.hair,id.eyes,id.skin].map(x=>esc(x)||"—").join(" / ")}</span>`:""}
      ${id.history?`<span class="k">History</span><span class="v" style="font-family:var(--body)">${esc(id.history)}</span>`:""}
    </div></div></details>`;
  }
  return h;
}

// ── Sheet: SKILLS (the full ledger) ──────────────────────────────────
function renderShSkills(){
  const ch=S.ch, pain=Engine.painState(ch);
  S.openSkills = S.openSkills || new Set();
  let h = sheetHeader("Skills", "Every skill, grouped by category. Trained skills roll 1d10 + Rank + Primary Stat + Synergy; untrained roll 1d10 + Primary Stat only. Tap <b>?</b> on any skill for what it covers.");
  if (pain.level) h += `<p class="step-note">${esc(pain.label)} — all skill checks take ${pain.skillPenalty}; the totals below already include it.${painChip(pain)}</p>`;
  // One table, category subheader rows — columns stay aligned across all three.
  let body="";
  for (const [cid,cname] of [["combat","Combat"],["utility","Utility"],["general","General"]]){
    const trained = D.skills.filter(s=>s.category===cid).map(s=>Engine.skillLine(ch,s.id)).filter(l=>l.trained);
    if (!trained.length) continue;
    body += `<tr class="cat-row"><td colspan="4">${esc(cname)}</td></tr>`;
    body += trained.map(l=>skillRowPair(ch,l,{withRank:true})).join("");
  }
  if (body){
    h += `<table class="ref skill-table">${skillColgroup(true)}
      <thead><tr><th>Skill</th><th>Rank</th><th>Check</th><th>Breakdown</th></tr></thead>
      <tbody>${body}</tbody></table>`;
  } else h += `<p class="step-note">No trained skills.</p>`;
  const untrained = D.skills.map(s=>Engine.skillLine(ch,s.id)).filter(l=>!l.trained);
  if (untrained.length){
    h += `<details class="group"><summary>Untrained — 1d10 + Primary Stat only (${untrained.length})</summary>
      <table class="ref skill-table">${skillColgroup(false)}<tbody>` +
      untrained.map(l=>skillRowPair(ch,l,{withRank:false})).join("") +
      `</tbody></table></details>`;
  }
  return h;
}

// ── Sheet: TRAITS (advantages & disadvantages) ───────────────────────
function renderShTraits(){
  const ch=S.ch;
  let h = sheetHeader("Traits", "Advantages bought with Character Points and the disadvantages that paid for them. Tap a trait to read what it does.");
  const traitCard = (name, costHtml, desc, selHtml) =>
    `<details class="pick trait"><summary><span class="th">${esc(name)}</span>${costHtml}</summary>
      <div class="desc">${esc(desc||"No description on file.")}</div>${selHtml||""}</details>`;
  // What the player actually chose, resolved to names. Without this the sheet
  // states "Favored Skill ×2" and never says which skills.
  const selHtml = (kind, id) => Engine.picksFor(ch, kind, id).map(st=>{
    const vals = st.pick.type==="text" ? (st.chosen ? [st.chosen] : [])
      : st.chosen.filter(Boolean).map(v=>(st.options.find(o=>o.id===v)||{name:v}).name);
    return vals.length ? `<div class="desc"><b>${esc(st.pick.label||"Chosen")}:</b> ${esc(vals.join(", "))}</div>` : "";
  }).join("");
  h += `<div class="sect">Advantages</div>`;
  const advs = ch.advantages.map(x=>{ const d2=Engine.advById(x.id);
    const name=(d2?d2.name:x.id)+(x.rank>1?" ×"+x.rank:"");
    const cost=x.notes==="natural" ? '<span class="cost grant">natural</span>'
      : (d2?`<span class="cost">${d2.cost*(x.rank||1)} CP</span>`:"");
    return traitCard(name, cost, d2?d2.description:"", selHtml("advantage",x.id)); }).join("");
  h += advs || `<p class="step-note">No advantages.</p>`;
  h += `<div class="sect">Disadvantages</div>`;
  const diss = ch.disadvantages.map(x=>{ const d2=Engine.disById(x.id);
    const name=(d2?d2.name:x.id)+(x.rank>1?" ×"+x.rank:"");
    const cost=d2?`<span class="cost grant">+${d2.pointsGranted*(x.rank||1)} CP</span>`:"";
    return traitCard(name, cost, d2?d2.description:"", selHtml("disadvantage",x.id)); }).join("");
  h += diss || `<p class="step-note">No disadvantages.</p>`;
  return h;
}

// ── Sheet: ARCHETYPE (everything about the chosen archetype) ──────────
function renderShArchetype(){
  const ch=S.ch, a=Engine.archetype(ch);
  if (!a) return sheetHeader("Archetype","No archetype selected.");
  const badge = a.status!=="final"?` <span class="chip ${a.status==="tbd"?"pain":"gold"}">${esc(statusLabel(a.status))}</span>`:"";
  const specLabel = Engine.specializationLabel(ch);
  let h = sheetHeader(a.name+(specLabel?" · "+specLabel:""),
    a.summary||a.gameplayStyle||"");

  if (a.coreMechanic){
    h += `<div class="sect">${esc(a.coreMechanic.name||"Core Mechanic")}${badge}</div>`;
    if (a.coreMechanic.description) h += `<p class="step-note">${esc(a.coreMechanic.description)}</p>`;
  }

  // Baseline traits
  if (a.baselineTraits && a.baselineTraits.length){
    h += `<div class="sect">Baseline Traits</div>` + a.baselineTraits.map(tr=>
      `<div class="pick"><div class="head"><h4>${esc(tr.name)}</h4></div>
        <div class="desc">${esc(tr.description||"")}${tr.benefit?"\n"+esc(tr.benefit):""}</div></div>`).join("");
  }

  // Specialization — chosen options. A2 closed here: this read only
  // `aberrations`, so a Professional's subtype or a Werewolf's Origin showed
  // "none chosen" while the header above it displayed the very same pick.
  const chosen = Engine.specializationChosen(ch);
  if (a.specialization && a.specialization.options){
    h += `<div class="sect">${esc(a.specialization.label||"Specialization")}${chosen.length?"":" <span class='chip'>none chosen</span>"}</div>`;
    h += chosen.map(o=>`<div class="pick selected"><div class="head"><h4>${esc(o.name)}</h4>
      ${o.missing?`<span class="cost">no longer in the game data</span>`:""}</div>
      <div class="desc">${esc(o.description||"")}${o.benefit?"\n— "+esc(o.benefit):""}${o.tweak?"\nTweak — "+esc(o.tweak.name)+": "+esc(o.tweak.description):""}${o.transformation?"\n"+esc(o.transformation):""}</div></div>`).join("");
  }

  // Disciplines (computed ranks: scaling base + CP-bought), read-only
  const dr = (Engine.disciplineRanks && Engine.disciplineRanks(ch)) || [];
  if (dr.length){
    h += `<div class="sect">Disciplines</div><table class="ref"><thead><tr><th>Discipline</th><th>Rank</th></tr></thead><tbody>` +
      dr.map(d=>`<tr><td>${esc(d.name||d.id)}</td><td class="num">${d.rank}</td></tr>`).join("") +
      `</tbody></table>`;
  }

  // Powers
  if (a.powers && a.powers.length && a.powers.some(p=>p.name)){
    h += `<div class="sect">Powers</div>` + a.powers.filter(p=>p.name).map(p=>
      `<div class="pick"><div class="head"><h4>${esc(p.name)}</h4>
        ${p.rank!=null?`<span class="cost">rank ${p.rank}</span>`:""}${p.drain?`<span class="cost">drain ${esc(p.drain)}</span>`:""}</div>
        <div class="desc">${esc(p.description||"")}${[p.damage&&"Damage "+p.damage,p.range&&"Range "+p.range,p.duration&&"Duration "+p.duration].filter(Boolean).map(x=>"\n"+esc(x)).join("")}</div></div>`).join("");
  }

  // Vulnerabilities
  if (a.vulnerabilities && a.vulnerabilities.length && a.vulnerabilities.some(v=>v.name)){
    h += `<div class="sect">Vulnerabilities</div>` + a.vulnerabilities.filter(v=>v.name).map(v=>
      `<div class="pick"><div class="head"><h4>${esc(v.name)}</h4></div>
        <div class="desc">${esc(v.description||"")}</div></div>`).join("");
  }

  h += `<p class="step-note" style="margin-top:18px">Tracker pools and editable manifests (grimoire, augments, forms) live on the <b>Loadout &amp; Powers</b> and <b>Trackers</b> tabs.</p>`;
  return h;
}

// ── Sheet: trackers ──────────────────────────────────────────────────
function renderShTrackers(){
  const ch=S.ch, hp=Engine.health(ch), pain=Engine.painState(ch);
  const luck=Engine.luckState(ch), san=Engine.sanState(ch);
  let h = sheetHeader("Trackers", "Current state only — every maximum on this page is computed and recalculates the moment an input changes.");

  // Damage
  h += `<div class="trk"><h4>Damage</h4>
    <span class="big ${pain.down?"bad":"hp"}">${pain.hpLeft} / ${hp.total} HP</span>
    ${pain.down?'<span class="chip pain">DOWN</span>':""}
    <button class="btn sm" data-dmg="-5">−5</button>
    <button class="btn sm" data-dmg="-1">−1</button>
    <input type="number" min="0" data-dmgset value="${ch.trackers.damage}" aria-label="total damage taken">
    <button class="btn sm" data-dmg="1">+1</button>
    <button class="btn sm" data-dmg="5">+5</button>
    <button class="btn sm danger" data-dmgheal="1">Heal all</button>
    <span class="sub">${hp.levels} Health Levels × ${hp.hpPer} HP. ${pain.hlLost} HL lost.</span></div>`;
  h += `<div class="hl-track">` + Array.from({length:hp.levels},(_,i)=>{
    const lvlDmg = Math.max(0, Math.min(hp.hpPer, ch.trackers.damage - i*hp.hpPer));
    const gone = lvlDmg>=hp.hpPer;
    return `<div class="hl ${gone?"gone":""}"><div class="fill" style="transform:scaleX(${(lvlDmg/hp.hpPer).toFixed(2)})"></div><span>${gone?"✕":(hp.hpPer-lvlDmg)+"/"+hp.hpPer}</span></div>`;
  }).join("") + `</div>`;
  h += `<div class="pick ${pain.level?"":"selected"}"><div class="head"><h4>${esc(pain.label)}</h4>
    ${pain.level?`<span class="cost">${esc(painPenaltyLine(pain,true))}</span>`:'<span class="cost grant">no penalties</span>'}</div>
    <div class="desc">${esc(pain.description)}${pain.level?"\n"+esc(pain.penaltyNotes):""}</div></div>`;

  // SAN
  h += `<div class="trk"><h4>Sanity</h4>
    <span class="big ${san.current<=san.max/2?"bad":""}">${san.current} / ${san.max}%</span>
    <button class="btn sm" data-san="-1">−1 loss</button>
    <input type="number" min="0" data-sanset value="${ch.trackers.san.loss}" aria-label="SAN lost">
    <button class="btn sm" data-san="1">+1 loss</button>
    <span class="sub">Max is EMP × 10, computed. Track loss here; recovery is a story, not a button.</span></div>`;

  // LUCK
  h += `<div class="trk"><h4>LUCK</h4>
    <span class="big ${luck.current===0?"bad":"gold"}">${luck.current} / ${luck.max}</span>` +
    luck.spendActions.map(sa=>`<button class="btn sm" data-luckspend="${sa.cost}" ${luck.current<sa.cost?"disabled":""} title="${esc(sa.effect)}">${esc(sa.action)} (−${sa.cost})</button>`).join("") +
    `<button class="btn sm" data-luckregain="1" ${luck.spent<=0?"disabled":""}>Regain (+1)</button>
    <span class="sub">${esc(luck.refresh)} Logging a session refreshes it automatically.</span></div>`;

  // Archetype tracker panels (declared in data, rendered generically)
  for (const p of Engine.archPanels(ch).filter(x=>x.type==="tracker")){
    const max = Engine.panelMax(ch, p);
    let val;
    if (p.id==="sfr") val = ch.trackers.sfr.spent||0;
    else if (p.id==="exhaustion") val = ch.trackers.exhaustion||0;
    else val = (ch.trackers.panel[p.id]||{}).value||0;
    const manualMax = max==null ? ((ch.trackers.panel[p.id]||{}).max??"") : null;
    const effMax = max!=null ? max : (manualMax===""?null:Number(manualMax));
    const cur = p.id==="sfr" ? (effMax!=null?Math.max(0,effMax-val):null) : val;
    h += `<div class="trk"><h4>${esc(p.title)}</h4>
      <span class="big ${effMax!=null&&p.id!=="sfr"&&cur>=effMax?"bad":""}">${cur==null?"—":cur}${effMax!=null?" / "+effMax:""}</span>
      <button class="btn sm" data-trk="${p.id}|-1">−1</button>
      <button class="btn sm" data-trk="${p.id}|1">+1</button>
      ${max==null?`<label class="field" style="margin:0"><input type="number" min="0" data-trkmax="${p.id}" value="${manualMax}" placeholder="max" aria-label="${esc(p.title)} max" style="width:84px"></label>`:""}
      <span class="sub">${p.id==="sfr"?"Counts spend against a computed pool — RoU caps a single turn.":p.max==="TOL"?"Capped by Tolerance (computed).":"Set the max when the rules land — the tracker won't block on un-modeled rules."}</span></div>`;
  }

  // Çredits
  h += `<div class="sect">Çredits</div>
    <div class="trk"><h4>Balance</h4><span class="big gold">Ç ${ch.trackers.credits.current}</span>
    <input type="number" data-cramt placeholder="amount" aria-label="credit amount">
    <input type="text" data-crnote placeholder="note (what for)" aria-label="credit note">
    <button class="btn sm" data-cr="1">+ Earn</button>
    <button class="btn sm" data-cr="-1">− Spend</button></div>`;
  const ledger = ch.trackers.credits.ledger||[];
  if (ledger.length){
    h += `<details class="group" open><summary>Ledger (${ledger.length})</summary><div class="journal">` +
      ledger.slice().reverse().map(e=>`<div class="jrow"><span class="d">${esc(String(e.date).slice(0,10))}</span>
        <span class="amt ${e.amount<0?"spend":"grant"}">${e.amount>0?"+":""}${e.amount}</span>
        <span class="what">${esc(e.note)||"&mdash;"}</span></div>`).join("") + `</div></details>`;
  }

  // Manual adjustments
  h += `<div class="sect">Manual Adjustments</div>
    <p class="step-note">For milestone benefits and other effects the engine doesn't model yet — e.g. <em>Honed</em> grants a Stat point (any Stat, including WILL, LUCK, or TOL). Stat adjustments cascade through everything downstream; the rest apply flat.</p>
    <div class="trk"><h4>Add</h4>
    <select data-adjtarget aria-label="adjustment target">
      ${D.stats.map(s=>`<option value="${s.id}">${s.id} (cascades)</option>`).join("")}
      <option value="TOL">TOL</option><option value="WILL">WILL</option>
      <option value="SAN">SAN max</option><option value="LUCK">LUCK max</option><option value="HP">HP max</option>
    </select>
    <input type="number" data-adjamt placeholder="±" aria-label="adjustment amount" style="width:70px">
    <input type="text" data-adjnote placeholder="why (e.g. Honed milestone)" aria-label="adjustment note">
    <button class="btn sm" data-adjadd="1">Apply</button></div>`;
  const adjs = ch.trackers.adjustments||[];
  if (adjs.length){
    h += `<div class="journal">` + adjs.map((a2,i)=>`<div class="jrow">
      <span class="d">${esc(String(a2.date||"").slice(0,10))}</span>
      <span class="amt ${a2.amount<0?"spend":"grant"}">${a2.amount>0?"+":""}${a2.amount}</span>
      <span class="what">${esc(a2.target)}</span><span class="note">${esc(a2.note)}</span>
      <button class="x" data-adjdel="${i}" title="remove">✕</button></div>`).join("") + `</div>`;
  }
  return h;
}

// ── Sheet: progression (IP + Milestones) ─────────────────────────────
function renderShProgression(){
  const ch=S.ch, ip=Engine.ipState(ch), ms=Engine.milestoneState(ch);
  let h = sheetHeader("Progression", `Improvement Points and Milestones. Every spend is a journal entry — auditable, undoable, and everything downstream recalculates on its own.`);

  h += `<div class="trk"><h4>IP</h4><span class="big ${ip.available<0?"bad":""}">${ip.available}</span>
    <span class="sub" style="flex-basis:auto">earned ${ip.earned} · spent ${ip.spent}</span>
    <input type="number" min="0" data-ipamt placeholder="amount" aria-label="IP grant amount">
    <input type="text" data-ipnote placeholder="note (e.g. Improved roll, GM bonus)" aria-label="IP grant note">
    <button class="btn sm" data-ipgrant="1">Grant IP</button></div>`;

  // Spend: stats
  h += `<details class="group" open><summary>Raise a Stat — current value × 10 IP</summary><div class="alloc">`;
  for (const s of D.stats){
    const c = Engine.ipCost(ch,"stat",s.id);
    const v = Engine.statValue(ch,s.id), ipe = ch.stats[s.id].ipe;
    h += `<div class="alloc-row"><div class="name">${s.id} <small>value ${v}${ipe?` · +${ipe} from IP`:""}</small></div>
      <div>${c.ok?`<button class="btn sm ${ip.available>=c.cost?"primary":""}" data-ipbuy="stat|${s.id}" ${ip.available>=c.cost?"":"disabled"}>${v} → ${c.to} · ${c.cost} IP</button>`:`<span class="chip">${esc(c.why)}</span>`}</div>
      <span class="mod"></span></div>`;
  }
  h += `</div><p class="step-note">WILL and TOL cannot be raised directly — they move when their input Stats do.</p></details>`;

  // Spend: skills
  const focused = Engine.focusedSkillIds(ch);
  const trained = D.skills.filter(s=>Engine.skillLine(ch,s.id).trained);
  const untrained = D.skills.filter(s=>!Engine.skillLine(ch,s.id).trained);
  h += `<details class="group" open><summary>Raise a Skill — 5 × current rank · Focused 3 × · cap ${D.ip.rankCap}</summary><div class="alloc">`;
  for (const s of trained){
    const line=Engine.skillLine(ch,s.id), c=Engine.ipCost(ch,"skill",s.id);
    h += `<div class="alloc-row"><div class="name">${esc(s.name)}${focused.includes(s.id)?' <span class="chip gold">focused</span>':""} <small>rank ${line.rank}</small></div>
      <div>${c.ok?`<button class="btn sm ${ip.available>=c.cost?"primary":""}" data-ipbuy="skill|${s.id}" ${ip.available>=c.cost?"":"disabled"}>${c.from} → ${c.to} · ${c.cost} IP</button>`:`<span class="chip">${esc(c.why)}</span>`}</div>
      <span class="mod pos">+${line.checkBonus}</span></div>`;
  }
  if (!trained.length) h += `<p class="step-note">No trained skills yet.</p>`;
  h += `</div>`;
  h += `<details class="group" style="margin-left:14px"><summary>Learn a new skill (${untrained.length})</summary>
    ${D.ip.flagged?flagHtml(D.ip):""}<div class="alloc">` +
    untrained.map(s=>{
      const c=Engine.ipCost(ch,"skill",s.id);
      return `<div class="alloc-row"><div class="name">${esc(s.name)}${focused.includes(s.id)?' <span class="chip gold">focused</span>':""} <small>${esc(s.description)}</small></div>
        <div><button class="btn sm" data-ipbuy="skill|${s.id}" ${ip.available>=c.cost?"":"disabled"}>learn · ${c.cost} IP</button></div><span class="mod"></span></div>`;
    }).join("") + `</div></details></details>`;

  // IP journal
  h += `<details class="group"><summary>IP Journal (${ip.log.length})</summary>`;
  h += ip.log.length ? `<div class="journal">` + ip.log.slice().reverse().map(e=>{
    const what = e.kind==="grant" ? `Grant` :
      `${e.targetType==="stat"?e.targetId:(Engine.skillById(e.targetId)||{name:e.targetId}).name} ${e.from} → ${e.to}`;
    return `<div class="jrow"><span class="d">${esc(String(e.date).slice(0,10))}</span>
      <span class="amt ${e.kind==="grant"?"grant":"spend"}">${e.kind==="grant"?"+":"−"}${e.amount}</span>
      <span class="what">${esc(what)}</span><span class="note">${esc(e.note)}</span></div>`;
  }).join("") + `</div>` : `<p class="step-note">Nothing yet. Log sessions to earn IP.</p>`;
  h += `</details>`;

  // Milestones
  h += `<div class="sect">Milestones — ${ms.mp} Milestone Point${ms.mp===1?"":"s"}</div>
    <div class="trk"><h4>MP</h4><span class="big">${ms.mp}</span>
    <span class="sub" style="flex-basis:auto">${ms.sessionMP} from sessions · ${ms.manualMP} manual</span>
    <button class="btn sm" data-mp="-1" ${ms.manualMP<=0?"disabled":""}>−1 manual</button>
    <button class="btn sm" data-mp="1">+1 manual</button>
    <span class="sub">Minor unlock at 5, 15, 25… · Major at 10, 20, 30…  Unlocked: ${ms.minorAvail} Minor (${ms.minorTaken.length} taken) · ${ms.majorAvail} Major (${ms.majorTaken.length} taken).</span></div>`;

  // Minor
  h += `<details class="group" ${ms.minorLeft>0?"open":""}><summary>Minor Milestones ${ms.minorLeft>0?`— <b style="color:var(--green)">${ms.minorLeft} to pick</b>`:""}</summary>`;
  if (S.askImproved) h += `<div class="trk"><h4>Improved</h4>
    <span class="sub" style="flex-basis:auto">Roll 2d10+15 at the table (10s explode) and enter the result:</span>
    <input type="number" min="0" data-improvroll aria-label="Improved milestone IP roll">
    <button class="btn sm go" data-improvok="1">Take + grant IP</button>
    <button class="btn sm" data-improvcancel="1">Cancel</button></div>`;
  h += D.milestones.minorShared.map(m=>{
    const taken = ms.minorTaken.filter(t=>t.id===m.id).length;
    const can = Engine.canTakeMinor(ch, m.id);
    return `<div class="pick ms ${taken?"taken":""} ${can.ok?"":"locked-ms"}"><div class="head">
      <h4>${esc(m.name)}${taken?` <span class="chip ok">taken${taken>1?" ×"+taken:""}</span>`:""}</h4>
      <div class="controls"><button class="toggle" data-takeminor="${m.id}" ${can.ok?"":"disabled"} title="${esc(can.ok?"":can.why)}">Take</button></div></div>
      <div class="desc">${esc(m.benefit)}</div></div>`;
  }).join("");
  if (ms.minorTaken.length) h += `<div class="journal">` + ms.minorTaken.map((t,i)=>{
    const m=D.milestones.minorShared.find(x=>x.id===t.id)||{name:t.id};
    return `<div class="jrow"><span class="d">${esc(String(t.date||"").slice(0,10))}</span><span class="what">${esc(m.name)}</span>
      <button class="x" data-delminor="${i}" title="remove">✕</button></div>`; }).join("") + `</div>`;
  h += `</details>`;

  // Major
  h += `<details class="group" ${ms.majorLeft>0?"open":""}><summary>Major Milestones — General ${ms.majorLeft>0?`— <b style="color:var(--green)">${ms.majorLeft} to pick</b>`:""}</summary>
    <p class="step-note">Once each, any order, subject to prerequisites. Prose prerequisites are the table's call — taking one with a <span class="chip gold">GM</span> requirement will ask you to confirm.</p>`;
  h += (D.milestones.majorGeneral||[]).map(m=>{
    const taken = ms.majorTaken.some(t=>t.id===m.id);
    const pre = Engine.majorPrereqs(ch, m);
    const canTake = !taken && pre.ok && ms.majorLeft>0;
    const reqs = pre.met.map(x=>`<span class="chip ok">${esc(x)}</span>`)
      .concat(pre.unmet.filter(x=>!/Already taken/.test(x)).map(x=>`<span class="chip pain">${esc(x)}</span>`))
      .concat(pre.manual.map(x=>`<span class="chip gold">GM: ${esc(x)}</span>`)).join("");
    return `<div class="pick ms ${taken?"taken":""} ${canTake||taken?"":"locked-ms"}">${m.flagged?flagHtml(m):""}
      <div class="head"><h4>${esc(m.name)}${taken?' <span class="chip ok">taken</span>':""}</h4>
      <div class="controls"><button class="toggle" data-takemajor="${m.id}" data-gm="${pre.manual.length?1:0}" ${canTake?"":"disabled"}
        title="${esc(canTake?"":(taken?"Once each.":pre.unmet.concat(ms.majorLeft<=0?["No Major unlocked."]:[]).join(" ")))}">Take</button></div></div>
      ${m.flavor?`<div class="desc" style="font-style:italic">${esc(m.flavor)}</div>`:""}
      <div class="desc">${esc(m.benefit)}</div>
      ${reqs?`<div class="req">${reqs}</div>`:""}</div>`;
  }).join("");
  if (ms.majorTaken.length) h += `<div class="journal">` + ms.majorTaken.map((t,i)=>{
    const m=(D.milestones.majorGeneral||[]).find(x=>x.id===t.id)||{name:t.id};
    return `<div class="jrow"><span class="d">${esc(String(t.date||"").slice(0,10))}</span><span class="what">${esc(m.name)}</span>
      <button class="x" data-delmajor="${i}" title="remove">✕</button></div>`; }).join("") + `</div>`;
  h += `</details>`;
  return h;
}

// ── Sheet: sessions ──────────────────────────────────────────────────
function renderShSessions(){
  const ch=S.ch, ms=Engine.milestoneState(ch), ip=Engine.ipState(ch);
  let h = sheetHeader("Session Log", `Logging a session grants <em>${D.ip.perSession} IP</em> (override below if your table runs different), 1 Milestone Point, and refreshes LUCK — it only resets when a session truly ends.`);
  h += `<div class="review-block"><h3>Log a session</h3>
    <div class="grid-3">
      <label class="field"><span>Date</span><input type="date" data-sesdate value="${new Date().toISOString().slice(0,10)}"></label>
      <label class="field"><span>Title</span><input type="text" data-sestitle placeholder="What the city did to you this time"></label>
      <label class="field"><span>IP earned</span><input type="number" min="0" data-sesip value="${D.ip.perSession}"></label>
    </div>
    <label class="field"><span>Notes</span><textarea data-sesnotes style="min-height:70px" placeholder="Leads, debts, names to remember"></textarea></label>
    <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap">
      <label style="display:flex; gap:8px; align-items:center; font-size:.84rem"><input type="checkbox" data-sesmp checked style="width:auto"> Milestone Point</label>
      <button class="btn go" data-seslog="1">Log session</button>
    </div></div>`;
  h += `<div class="sect">History — ${ch.sessions.length} session${ch.sessions.length===1?"":"s"} · ${ms.mp} MP · ${ip.earned} IP earned</div>`;
  h += ch.sessions.length ? ch.sessions.map((s,i)=>`<div class="pick"><div class="head">
      <h4>${esc(s.title)||"Session "+(i+1)}</h4>
      <span class="cost">${esc(s.date)} · +${s.ipEarned} IP${s.milestonePoint?" · +1 MP":""}</span>
      <div class="controls"><button class="x" data-sesdel="${i}" title="delete" style="background:none;border:0;color:var(--dim);cursor:pointer">✕</button></div></div>
      ${s.notes?`<div class="desc">${esc(s.notes)}</div>`:""}</div>`).reverse().join("")
    : `<p class="step-note">No sessions yet. NYTE City is patient.</p>`;

  // Activity Log — the full audit trail (Phase 3.3). Undo is last-in-first-out.
  const log=ch.audit||[];
  h += `<div class="sect">Activity Log — ${log.length} action${log.length===1?"":"s"}</div>`;
  h += `<div class="trk"><h4>Undo</h4>
    <button class="btn sm danger" data-undolast ${log.length?"":"disabled"}>Undo last action</button>
    <span class="sub">Peels back the most recent action — damage, IP, milestones, credits, and admin edits all land here. To fix an <em>older</em> mistake, switch on Admin mode (⋮ menu) and edit the value directly; that edit is logged here too and is itself undoable.</span></div>`;
  if (log.length){
    h += `<div class="journal auditlog">` + log.slice().reverse().map((e,ri)=>
      `<div class="jrow"><span class="d">${esc(String(e.date).slice(0,16).replace("T"," "))}</span>
        <span class="chip ${auditChip(e.kind)}">${esc(e.kind)}</span>
        <span class="what">${esc(e.label)||"(change)"}</span>
        ${ri===0?`<button class="x" data-undolast title="Undo this action">↶</button>`:""}</div>`).join("") + `</div>`;
    if (S.admin) h += `<button class="btn sm" data-admin-clearlog="1" style="margin-top:10px">Clear activity log</button>
      <span class="sub" style="display:block;margin-top:4px">Admin only · clearing the log can't be undone (it removes history, not character values).</span>`;
  } else {
    h += `<p class="step-note">Nothing recorded yet.</p>`;
  }
  return h;
}
// Maps an audit entry's kind to a chip colour.
function auditChip(kind){
  if (kind==="damage"||kind==="pain"||kind==="san") return "pain";
  if (kind==="ip"||kind==="skill"||kind==="stat") return "cyan";
  if (kind==="admin") return "gold";
  if (kind==="milestone") return "ok";
  return "";
}

// ── Sheet: loadout & powers ──────────────────────────────────────────
function renderShLoadout(){
  const ch=S.ch, a=Engine.archetype(ch);
  let h = sheetHeader("Loadout & Powers", "Weapons, gear, and whatever your archetype carries that the rest of the city can't.");
  h += `<div class="sect">Weapons</div>` + editTable(ch.weapons, WEAPON_COLS, "weapons", "Add weapon");
  h += `<div class="sect">Gear</div>` + editTable(ch.gear, GEAR_COLS, "gear", "Add gear");

  // Archetype panels: rankedList / table / list / text / toggle
  for (const p of Engine.archPanels(ch)){
    if (p.type==="tracker") continue; // lives in Trackers
    h += `<div class="sect">${esc(p.title)}</div>`;
    if (p.type==="rankedList"){
      const ranks = Engine.disciplineRanks(ch);
      if (ranks.length){
        h += `<table class="ref"><tbody>` + ranks.map(d=>
          `<tr><td>${esc(d.name)}</td><td class="num">rank ${d.rank}</td>
           <td style="font-size:.76rem;color:var(--dim)">${esc(d.description||"")}</td></tr>`).join("") + `</tbody></table>
          <p class="step-note">${esc(copy("ranksAdvanceInPlay"))}</p>`;
      } else h += `<p class="step-note">Nothing here yet.</p>`;
    }
    if (p.type==="table"){
      h += editTable(panelRows(ch, p.id), p.columns, p.id, "Add row");
      if (p.id==="grimoire") h += `<p class="step-note">Free entry by design — Arcanists improvise. A common-spell catalog can slot in here later without touching the sheet.</p>`;
    }
    if (p.type==="list" && p.id==="focused-skills"){
      const f = Engine.focusedSkillIds(ch).map(id=>(Engine.skillById(id)||{name:id}).name);
      h += f.length ? `<p class="step-note">${f.map(esc).join(" · ")} — advance at 3× current rank.</p>` : `<p class="step-note">None.</p>`;
    }
    if (p.type==="text" && p.id==="tweak" && a){
      const sub = ((a.specialization||{}).options||[]).find(o=>o.id===Engine.specializationIds(ch)[0]);
      h += sub && sub.tweak ? `<div class="pick"><div class="head"><h4>${esc(sub.tweak.name)}</h4></div>
        <div class="desc">${esc(sub.tweak.description||"")}${(sub.tweak.benefits||[]).length?"\n• "+sub.tweak.benefits.map(esc).join("\n• "):""}</div></div>`
        : `<p class="step-note">No Tweak on record.</p>`;
    }
    if (p.type==="toggle"){
      const cur = ch.panelData[p.id] || p.options[0];
      h += `<div class="form-toggle">` + p.options.map(o=>
        `<button class="${cur===o?"on":""}" data-ptoggle="${p.id}|${esc(o)}">${esc(o)}</button>`).join("") + `</div>
        <p class="step-note">${esc(copy("applyFromText"))}</p>`;
    }
  }
  return h;
}

// ── Sheet: notes ─────────────────────────────────────────────────────
function renderShNotes(){
  let h = sheetHeader("Notes", "Freeform. The city keeps receipts — so should you.");
  h += `<label class="field"><span>Character notes</span>
    <textarea data-notes style="min-height:340px" placeholder="Contacts. Debts. The thing you saw that no one believes.">${esc(S.ch.notes)}</textarea></label>`;
  return h;
}

// ── Sheet: ADMIN (free edit) — Phase 3.3 ─────────────────────────────
// Direct edits to stored inputs, bypassing creation caps/pools. Every change
// here routes through commit(), so it lands in the Activity Log and is undoable.
function renderShAdmin(){
  const ch=S.ch;
  let h = sheetHeader("Admin — Free Edit",
    "Direct edits to the character's stored values, bypassing creation caps and pools. For fixing mistakes. Everything here is logged to the Activity Log (Session Log tab) and can be undone.");

  // Non-blocking budget echo so you can see the consequences of an edit.
  const sp=Engine.statPool(ch), kp=Engine.skillPool(ch), bal=Engine.cp(ch);
  const sLeft=sp&&sp.total!=null ? sp.total-Engine.statSpent(ch) : null;
  const kLeft=kp&&kp.total!=null ? kp.total-Engine.skillSpent(ch) : null;
  const fmt=(n)=> n==null?"—":(n>=0?n+" left":(-n)+" over");
  h += `<div class="trk"><h4>Budgets</h4>
    <span class="sub" style="flex-basis:auto">Stat Points ${fmt(sLeft)} · Skill Points ${fmt(kLeft)} · CP ${bal?fmt(bal.left):"—"}</span>
    <span class="sub">Reference only — admin edits never block on these.</span></div>`;

  // Identity
  const idf=(k,label,type)=>`<label class="field"><span>${esc(label)}</span><input type="${type||"text"}" data-admin-id="${k}" value="${esc(ch.identity[k]==null?"":ch.identity[k])}"></label>`;
  h += `<div class="sect">Identity</div><div class="grid-3">`
     + idf("name","Name")+idf("age","Age","number")+idf("build","Build")
     + idf("hair","Hair")+idf("eyes","Eyes")+idf("skin","Skin") + `</div>
    <label class="field"><span>History</span><textarea data-admin-id="history" style="min-height:64px">${esc(ch.identity.history||"")}</textarea></label>`;

  // Campaign & archetype (destructive)
  h += `<div class="sect">Campaign &amp; Archetype</div>`;
  h += `<div class="trk"><h4>Power Level</h4>
    <select data-admin-pl>${D.powerLevels.map(p=>`<option value="${p.id}" ${ch.creation.powerLevel===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}</select>
    <span class="sub">Changes every cap (Max Skill/Power Rank, Max Boost) and the CP budget. Stored values don't move, so the sheet may read "over" until you adjust them.</span></div>`;
  h += `<div class="trk"><h4>Archetype</h4>
    <select data-admin-arch><option value="">— none —</option>${D.archetypes.map(a=>`<option value="${a.id}" ${ch.identity.archetype===a.id?"selected":""}>${esc(a.name)}</option>`).join("")}</select>
    <span class="sub" style="color:var(--magenta)">⚠ Changing archetype clears every archetype-specific choice — focus / stat-bonus allocations, specialization, disciplines, natural advantages. One undo brings it all back.</span></div>`;

  // Stats — base + IP
  h += `<div class="sect">Stats — base + IP</div><div class="alloc">`;
  for (const s of D.stats){
    const st=ch.stats[s.id], v=Engine.statValue(ch,s.id), m=Engine.statMod(v);
    h += `<div class="alloc-row"><div class="name">${s.id} <small>value ${v} (${m>=0?"+":""}${m})</small></div>
      <div class="admin-steppers">
        <span class="lbl">base ${st.base}</span>
        <button class="btn sm" data-admin-stat="${s.id}|base|-1">−</button><button class="btn sm" data-admin-stat="${s.id}|base|1">+</button>
        <span class="lbl">IP ${st.ipe}</span>
        <button class="btn sm" data-admin-stat="${s.id}|ipe|-1">−</button><button class="btn sm" data-admin-stat="${s.id}|ipe|1">+</button>
      </div><span class="mod"></span></div>`;
  }
  h += `</div><p class="step-note">TOL/WILL aren't editable here — they're derived. To move them, adjust their input Stats (or use a Manual Adjustment in Trackers).</p>`;

  // Skills — rank + IP
  h += `<div class="sect">Skills — rank + IP</div><div class="alloc">`;
  const trained=D.skills.filter(s=>ch.skills[s.id]);
  if (!trained.length) h += `<p class="step-note">No trained skills.</p>`;
  for (const s of trained){
    const sk=ch.skills[s.id];
    h += `<div class="alloc-row"><div class="name">${esc(s.name)} <small>rank ${sk.rank}${sk.ipe?` · +${sk.ipe} IP`:""}</small></div>
      <div class="admin-steppers">
        <span class="lbl">rank ${sk.rank}</span>
        <button class="btn sm" data-admin-skill="${s.id}|rank|-1">−</button><button class="btn sm" data-admin-skill="${s.id}|rank|1">+</button>
        <span class="lbl">IP ${sk.ipe}</span>
        <button class="btn sm" data-admin-skill="${s.id}|ipe|-1">−</button><button class="btn sm" data-admin-skill="${s.id}|ipe|1">+</button>
        <button class="btn sm danger" data-admin-skill="${s.id}|remove|0">remove</button>
      </div><span class="mod"></span></div>`;
  }
  h += `</div>`;
  const untr=D.skills.filter(s=>!ch.skills[s.id]);
  if (untr.length) h += `<div class="trk"><h4>Add skill</h4>
    <select data-admin-addskill><option value="">— pick —</option>${untr.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select>
    <button class="btn sm" data-admin-addskill-go="1">Add at rank 1</button></div>`;

  // Advantages
  h += `<div class="sect">Advantages</div><div class="alloc">`;
  if (!ch.advantages.length) h += `<p class="step-note">None.</p>`;
  for (const a of ch.advantages){
    const def=Engine.advById(a.id)||{name:a.id};
    h += `<div class="alloc-row"><div class="name">${esc(def.name)}${a.notes==="natural"?' <span class="chip">natural</span>':""} <small>rank ${a.rank}</small></div>
      <div class="admin-steppers">
        <button class="btn sm" data-admin-adv="${a.id}|${esc(a.notes||"")}|-1">−</button>
        <button class="btn sm" data-admin-adv="${a.id}|${esc(a.notes||"")}|1">+</button>
        <button class="btn sm danger" data-admin-adv="${a.id}|${esc(a.notes||"")}|x">remove</button>
      </div><span class="mod"></span></div>`;
  }
  h += `</div>`;
  const addAdv=D.advantages.filter(d=>!ch.advantages.some(a=>a.id===d.id && a.notes!=="natural"));
  if (addAdv.length) h += `<div class="trk"><h4>Add advantage</h4>
    <select data-admin-addadv><option value="">— pick —</option>${addAdv.map(d=>`<option value="${d.id}">${esc(d.name)} (${d.cost} CP)</option>`).join("")}</select>
    <button class="btn sm" data-admin-addadv-go="1">Add</button></div>`;

  // Disadvantages
  h += `<div class="sect">Disadvantages</div><div class="alloc">`;
  if (!ch.disadvantages.length) h += `<p class="step-note">None.</p>`;
  for (const d of ch.disadvantages){
    const def=Engine.disById(d.id)||{name:d.id};
    h += `<div class="alloc-row"><div class="name">${esc(def.name)} <small>rank ${d.rank}</small></div>
      <div class="admin-steppers">
        <button class="btn sm" data-admin-dis="${d.id}|-1">−</button><button class="btn sm" data-admin-dis="${d.id}|1">+</button>
        <button class="btn sm danger" data-admin-dis="${d.id}|x">remove</button>
      </div><span class="mod"></span></div>`;
  }
  h += `</div>`;
  const addDis=D.disadvantages.filter(x=>!ch.disadvantages.some(d=>d.id===x.id));
  if (addDis.length) h += `<div class="trk"><h4>Add disadvantage</h4>
    <select data-admin-adddis><option value="">— pick —</option>${addDis.map(x=>`<option value="${x.id}">${esc(x.name)} (+${x.pointsGranted} CP)</option>`).join("")}</select>
    <button class="btn sm" data-admin-adddis-go="1">Add</button></div>`;

  // LUCK bonus
  h += `<div class="sect">Resources</div>
    <div class="trk"><h4>LUCK bonus</h4><span class="big gold">${ch.trackers.luck.bonus}</span>
    <button class="btn sm" data-admin-luck="-1">−1</button><button class="btn sm" data-admin-luck="1">+1</button>
    <span class="sub">Buy-ups above the base of ${D.resources.luck.startingValue}. Current LUCK during play is tracked on the Trackers tab.</span></div>`;
  return h;
}

const SHEET_RENDER = { main:renderShMain, skills:renderShSkills, traits:renderShTraits,
  archetype:renderShArchetype, trackers:renderShTrackers,
  progression:renderShProgression, sessions:renderShSessions,
  loadout:renderShLoadout, notes:renderShNotes, admin:renderShAdmin };
