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
// `under` is HTML that sits beneath the title: Main puts the intake number there.
function sheetHeader(title, note, under){
  let h = importIssuesHtml();
  h += `<div class="eyebrow">Live Sheet</div><h1 class="step-title">${esc(title)}</h1>${under||""}`;
  if (note) h += `<p class="step-note">${note}</p>`;
  return h;
}
// Pain on top of Health Levels, from Conditions (Agonized) and Aberrations (Phantom Pain).
const painExtra = pain => (pain.fromConditions||0) + (pain.fromAberrations||0);
const painChip = pain => pain.level
  ? ` <span class="chip pain">Pain Lv ${pain.level} · ${pain.skillPenalty} skill</span>` : "";

// ── Conditions (Decision 95) — one renderer, two densities: Main shows chips,
// Trackers shows each Condition's effect and recovery text. Everything shown
// comes from Engine.conditionState() and the catalog; nothing is decided here.
const signed = n => (n>0?"+":n<0?"−":"")+Math.abs(n);
// W14: adding is one click on a chip from the catalog. A body-part Condition
// asks where first (S.condPick), and one you already have is greyed out.
// S.condPalette keeps the palette open across the re-render a click causes.
function conditionAddHtml(st){
  const has = new Set(st.active.filter(a=>a.def && !a.def.location).map(a=>a.id));
  const pick = S.condPick && Engine.conditionById(S.condPick);
  const chips = D.conditions.map(c=>`<button class="cond-chip add${c.helpless?" bad":""}${pick&&pick.id===c.id?" on":""}" data-condquick="${esc(c.id)}"
      ${has.has(c.id)?"disabled":""} title="${esc(c.effect||"")}"><b>${esc(c.name)}</b>${c.short?` <small>${esc(c.short)}</small>`:""}</button>`).join("");
  const where = pick && pick.location ? `<div class="cond-where"><span>${esc(pick.name)}: where?</span>
      <select data-condadd-loc aria-label="Body part"><option value="">Body part…</option>${
        D.bodyLocations.map(l=>`<option value="${esc(l.id)}">${esc(l.name)}</option>`).join("")}</select>
      <button class="btn sm primary" data-condadd="${esc(pick.id)}">Add</button>
      <button class="btn sm" data-condpickcancel>Cancel</button></div>` : "";
  return `<details class="cond-add" data-condpalette ${S.condPalette||pick?"open":""}><summary>Add a Condition</summary>
    <div class="cond-chips palette">${chips}</div>${where}</details>`;
}
// Main's chips open their effect and recovery in place (S.condInfo = index).
function conditionInfoHtml(st){
  const a = st.active.find(x=>x.index===S.condInfo);
  if (!a || !a.def) return "";
  return `<div class="cond-info"><b>${esc(a.label)}.</b> ${esc(a.def.effect)} <b>Recovery:</b> ${esc(a.def.recovery)}</div>`;
}
function conditionCounterHtml(c){
  let pips = "";
  for (let n=1;n<=c.max;n++)
    pips += `<button class="pip${n<=c.marks?" on":""}" data-condmarks="${c.index}|${n<=c.marks?n-1:n}" aria-label="${esc(c.label)} ${n}" aria-pressed="${n<=c.marks}"></button>`;
  return `<div class="cond-counter${c.full?" full":""}"><span class="k">${esc(c.label)}</span>${pips}
    <span class="v">${c.marks} / ${c.max}</span>${c.full&&c.atMax?`<span class="at-max">${esc(c.atMax)}</span>`:""}</div>`;
}
function conditionsHtml(ch, full){
  const st = Engine.conditionState(ch), R = D.conditionRules||{};
  let h = "";
  if (st.isHelpless)
    h += `<div class="cond-alert" role="status"><b>${esc(st.helpless.join(" · "))}</b> — ${esc(R.helpless||"")}</div>`;
  for (const c of st.counters) h += conditionCounterHtml(c);
  if (!st.active.length) h += `<p class="step-note cond-none">No Conditions. ${full?esc(R.noStacking||""):""}</p>`;
  else if (!full){
    h += `<div class="cond-chips">` + st.active.map(a=>`<span class="cond-chip${a.def&&a.def.helpless?" bad":""}${S.condInfo===a.index?" on":""}">
      <button class="cond-chip-body" data-condinfo="${a.index}" aria-expanded="${S.condInfo===a.index}" title="${esc(a.def?a.def.effect:"")}"><b>${esc(a.label)}</b>${a.def?` <small>${esc(a.def.short)}</small>`:""}</button>
      <button class="x" data-condrm="${a.index}" aria-label="Clear ${esc(a.label)}" title="Clear">✕</button></span>`).join("") + `</div>` + conditionInfoHtml(st);
  } else {
    h += st.active.map(a=>`<div class="pick cond-card"><div class="head"><h4>${esc(a.label)}</h4>
      ${a.def?`<span class="cost">${esc(a.def.short)}</span>`:""}
      <div class="controls"><button class="btn sm" data-condrm="${a.index}">Clear</button></div></div>
      <div class="desc">${a.def?esc(a.def.effect)+"\n<b>Recovery:</b> "+esc(a.def.recovery):"This Condition isn't in the game data any more."}</div>
      <input type="text" class="cond-note" data-condnote="${a.index}" value="${esc(a.note)}" placeholder="note — source, poison, who did it" aria-label="${esc(a.label)} note"></div>`).join("");
    // How the penalties add up, shown only when one is in play.
    const penalised = st.active.filter(a=>a.def && typeof a.def.rollPenalty==="number");
    if (penalised.length) h += ruleHtml([(R.rollPenalty||{}).text, (R.penaltyStacking||{}).text].filter(Boolean).join(" "));
  }
  return h + conditionAddHtml(st);
}
// What a Condition does to the numbers on this tab, in one line. Flat penalties
// are already in the totals; attack/defense and conditional ones are not.
function conditionTotalsNote(ch, combat){
  const st = Engine.conditionState(ch), bits = [];
  if (st.rollPenalty) bits.push(`Conditions take ${signed(st.rollPenalty)}; totals include it.`);
  if (combat && st.attackDefense.length)
    bits.push(`Attack/Defense: ${st.attackDefense.map(a=>`${a.name} ${signed(a.value)}`).join(" · ")} — not in the totals.`);
  for (const c of st.conditional) bits.push(`${c.name}: ${signed(c.amount)} ${c.when} — not in the totals.`);
  return bits.length ? `<p class="step-note cond-note-line">${esc(bits.join(" "))}</p>` : "";
}

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
  return `<span class="hl-mini" aria-hidden="true">` + hlCells(ch).map((c,i)=>
    `<span class="seg ${c.gone?"gone":""} ${c.massive?"massive":""}${landedCls("hl",i)}"><i style="transform:scaleX(${c.frac.toFixed(2)})"></i></span>`
  ).join("") + `</span>`;
}

// One entry per Health Level, the way every track draws it (Decision 99):
// damage empties levels from the left, Massive removes them from the right.
function hlCells(ch){
  const hs=Engine.hlState(ch);
  return Array.from({length:hs.levels}, (_,i)=>{
    if (i >= hs.levels - hs.massive) return { massive:true, gone:true, dmg:hs.hpPer, left:0, frac:1 };
    const dmg=Math.max(0, Math.min(hs.hpPer, hs.damage - i*hs.hpPer));
    return { massive:false, gone:dmg>=hs.hpPer, dmg, left:hs.hpPer-dmg, frac: hs.hpPer ? dmg/hs.hpPer : 0 };
  });
}

// Horizontal vitals bar — the locked sheet's at-a-glance readout, shown
// below the tab bar on every tab except Main (Main has its condition strip).
function sheetVitalsBar(ch){
  const hp=Engine.health(ch), pain=Engine.painState(ch), luck=Engine.luckState(ch),
        san=Engine.sanState(ch), sf=Engine.sfr(ch), ip=Engine.ipState(ch), ms=Engine.milestoneState(ch);
  // W2: a pill with a `pop` key is a button that opens that vital's popover.
  const pill=(cls,ui,k,v,pop)=>{ const inner=`${ui?`<span class="vico">${uiIcon(ui)}</span>`:""}<span class="vtext"><span class="vk">${k}</span><span class="vv">${v}</span></span>`;
    return pop ? `<button class="vpill act ${cls}" data-vpop="${pop}" aria-haspopup="dialog" aria-expanded="false">${inner}</button>` : `<div class="vpill ${cls}">${inner}</div>`; };
  let h=`<div class="vbar" aria-label="Vitals">`;
  h+=pill((pain.down?"hp danger":"hp")+landedCls("hp"),"health","HP",`${pain.hpLeft}<small>/${hp.total}</small>`,"hp");
  h+=pill((pain.level?"danger":"")+landedCls("pain"),"pain","Pain",pain.down?"DOWN":(pain.level?`Lv ${pain.level} <small>${pain.skillPenalty}</small>`:"&mdash;"),"pain");
  const cs=Engine.conditionState(ch);
  if (cs.active.length) h+=pill(cs.isHelpless?"danger":"","","Cond",cs.isHelpless?"HELPLESS":`${cs.active.length}`,"cond");
  h+=pill(san.current<=san.max/2?"san danger":"san","sanity","SAN",`${san.current}<small>/${san.max}%</small>`,"san");
  h+=pill(luck.current===0?"luck danger":"luck","luck","LUCK",`${luck.current}<small>/${luck.max}</small>`,"luck");
  if (sf && sf.value!=null){ const left=Math.max(0,sf.value-(ch.trackers.sfr.spent||0));
    h+=pill("sfr","sfr","SFR",`${left}<small>/${sf.value}</small>`); }
  h+=pill("cred","credits","Ç",`${ch.trackers.credits.current}`,"cred");
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
    ? [`rank ${b.rank}`, skillStatsHtml(l)]
    : [skillStatsHtml(l), `<span style="color:var(--dim)">untrained</span>`];
  if (b.pain) parts.push(`<span style="color:var(--magenta)">${b.pain} pain</span>`);
  if (b.conditions) parts.push(`<span style="color:var(--magenta)">${b.conditions} conditions</span>`);
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
  // The specialization is derived (schema 0.5, Decision 79). This line read
  // the removed identity.specialization and never showed it.
  const spec=Engine.specializationLabel(ch);
  let h = sheetHeader(id.name||"Unnamed", `${a?esc(a.name):"—"}${spec?" · "+esc(spec):""} · ${pl?esc(pl.name):"—"}`, intakeHtml(ch));

  // Condition strip — replaces the Vitals rail on this tab (full width)
  const pct = (n,d)=> d>0 ? Math.max(0,Math.min(100,Math.round(n/d*100))) : 0;
  // W3: a card with a `pop` key is a button that opens the same popover as
  // its pill on the other tabs (spans inside, since a button holds no divs).
  const cond = (cls,name,uiName,big,meta,meter,seg,pop)=>{
    const inner=`<span class="corner">${uiIcon(uiName)}</span>
    <span class="lab">${name}</span><span class="big">${big}</span>${meta?`<span class="meta">${meta}</span>`:""}${seg?seg:(meter!=null?`<span class="meter"><i style="width:${meter}%"></i></span>`:"")}`;
    return pop ? `<button class="cond act ${cls}" data-vpop="${pop}" aria-haspopup="dialog" aria-expanded="false">${inner}</button>` : `<div class="cond ${cls}">${inner}</div>`; };
  h += `<div class="cond-grid">`;
  h += cond(`hp ${pain.down?"danger":""}${landedCls("hp")}`,"Health","health",
    `${pain.hpLeft}<small>/${hp.total}</small>`, pain.down?"DOWN":`${hp.levels} HL × ${hp.hpPer}`, null, hlMiniHtml(ch), "hp");
  h += cond(`${pain.level?"danger":""}${landedCls("pain")}`,"Pain","pain",
    pain.level?`Lv ${pain.level}`:"—", pain.level?painPenaltyLine(pain,false)+(painExtra(pain)?` · ${signed(painExtra(pain))} Lv from ${esc(pain.painSources.join(", "))}`:""):"no penalties", null, "", "pain");
  h += cond(`san ${san.current<=san.max/2?"danger":""}`,"Sanity","sanity",
    `${san.current}<small>/${san.max}%</small>`, "", pct(san.current,san.max), "", "san");
  h += cond(`luck ${luck.current===0?"danger":""}`,"Luck","luck",
    `${luck.current}<small>/${luck.max}</small>`, "", pct(luck.current,luck.max), "", "luck");
  if (sf && sf.value!=null){
    const sfLeft=Math.max(0,sf.value-(ch.trackers.sfr.spent||0));
    h += cond("sfr","SFR","sfr", `${sfLeft}<small>/${sf.value}</small>`, `RoU ${sf.rou}`, pct(sfLeft,sf.value));
  }
  h += cond("cred","Çredits","credits", `Ç${ch.trackers.credits.current}`, "", null, "", "cred");
  h += `</div>`;
  h += `<section class="main-conditions"><div class="sect">Conditions</div>${conditionsHtml(ch, false)}</section>`;

  // Two-column command console: stats on the left, combat on the right
  h += `<div class="main-grid">`;

  // ── left: stats, clustered into the four spheres ──
  h += `<section class="main-stats"><div class="sect">Stats</div>${groupedStatBlockHtml(ch)}</section>`;

  // ── right: what gets rolled in a fight (W13) ──
  // The weapons you carry come first, with their magazines (W16), then the
  // armor that answers, then every combat skill. The skill table is long, and
  // it was pushing the lines a player actually rolls below the fold.
  h += `<section class="main-combat"><div class="sect">Combat${painChip(pain)}</div>`;
  if (pain.level) h += `<p class="step-note" style="margin-bottom:10px">${esc(pain.label)} — all checks take ${pain.skillPenalty}; totals below include it.</p>`;
  h += conditionTotalsNote(ch, true);
  // Weapons: a catalog piece is computed (Decision 100); a custom one reads
  // back what was typed.
  const lines = (ch.weapons||[]).map((e,i)=>Engine.weaponLine(ch,i)).filter(Boolean);
  if (lines.length){
    h += `<div class="sect">Weapons</div>
      <table class="ref"><thead><tr><th>Weapon</th><th>Attack</th><th>Dmg</th><th>RoF</th><th>Cap.</th></tr></thead><tbody>` +
      lines.map(l=>{
        if (l.custom){ const w=ch.weapons[l.index];
          return `<tr><td>${esc(w.name)||"—"}${w.features?`<div class="lo-sub">${esc(w.features)}</div>`:""}</td><td class="num">—</td><td class="num">${esc(w.damage)||"—"}</td>
            <td class="num">${esc(w.rof)||"—"}</td><td class="num lo-rounds">${roundsHtml(l, w.capacity)}${w.ammo?` (${esc(w.ammo)})`:""}</td></tr>`; }
        return `<tr><td>${esc(l.name)}${l.tags&&l.tags.length?`<div class="lo-sub">${esc(l.tags.join(" · "))}</div>`:""}</td>
          <td class="num">${attackText(l.attack)}${l.acc?`<div class="lo-sub">+${l.acc} ACC Single</div>`:""}${aimedHtml(l)}</td>
          <td class="num">${l.damage!=null?l.damage:esc(l.damageFormula||"—")}</td>
          <td class="num">${esc(l.rof||"—")}</td><td class="num lo-rounds">${roundsHtml(l, l.capacity)}</td></tr>`;
      }).join("") + `</tbody></table>`;
  }
  const worn = Engine.armorState(ch).worn, natMain = naturalArmorText(ch);
  if (worn || natMain) h += `<div class="sect">Armor</div>`;
  if (worn) h += `<div class="lo-armor worn"><div class="lo-armor-head"><b>${esc(worn.name)}</b></div>
    <div class="lo-armor-stats"><span class="hitarmor">${armorStatLine(worn)}</span></div><div class="lo-armor-int">${intBar(worn)}</div></div>`;
  if (natMain) h += `<p class="hitarmor">${esc(natMain)}</p>`;
  if (lines.length || worn || natMain) h += `<div class="sect">Combat skills</div>`;
  h += skillTableHtml(ch, "combat", "Combat Skill", {includeUntrained:true}) || `<p class="step-note">No combat skills defined.</p>`;
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
  h += conditionTotalsNote(ch, false);
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
      <div class="desc">${esc(o.description||"")}${o.benefit?"\n— "+esc(o.benefit):""}${o.tweak?"\nTweak — "+esc(o.tweak.name)+": "+esc(o.tweak.description):""}${o.transformation?"\n"+esc(o.transformation):""}</div>${optionPowersHtml(o)}</div>`).join("");
  }

  // Permanent Aberrations a Cascade left (Decision 110), read-only here; the
  // Trackers tab records and removes them.
  const abPerm = Engine.aberrationState(ch).permanent;
  if (abPerm.length){
    h += `<div class="sect">Permanent Aberrations</div>` + abPerm.map(x=>`<div class="pick selected"><div class="head"><h4>${esc(x.name)}</h4>
      ${x.category?`<span class="cost">${esc(x.category)}</span>`:""}</div>
      <div class="desc">${x.def?(x.def.as?`As ${esc(x.def.as)}. `:"")+esc(x.def.description):"This Aberration isn't in the game data any more."}${x.note?"\n— "+esc(x.note):""}</div></div>`).join("");
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

  // Reference panels (Decision 110): rules text straight from the data.
  for (const p of Engine.archPanels(ch).filter(x=>x.type==="reference")) h += referencePanelHtml(p);

  h += `<p class="step-note" style="margin-top:18px">Tracker pools and editable manifests (grimoire, augments, forms) live on the <b>Loadout &amp; Powers</b> and <b>Trackers</b> tabs.</p>`;
  return h;
}

// ── Reference panels (magic plan M9, Decision 110) ───────────────────
// A `reference` panel names the data sections it shows (`shows`); each
// section has one renderer here, keyed by the data's own name, so an
// archetype picks its reference in data and nothing is special-cased on it.
// A name with no renderer is skipped rather than guessed at.
const rangeLabel = r => r.max==null ? `${r.min}+` : r.min===r.max ? `${r.min}` : `${r.min}–${r.max}`;
const REFERENCE_SECTIONS = {
  spellcraftRules: R => {
    const o = R.outcomes||{}, names = { overflow:"Overflow", manifest:"Manifest", fizzle:"Fizzle", rupture:"Rupture", cascade:"Cascade" };
    return { title:"The Spellcraft roll", html:
      `<p>${esc(R.rollNote||"")}</p>
      <table class="ref"><tbody>${Object.keys(names).filter(k=>o[k]).map(k=>`<tr><td><b>${names[k]}</b></td><td>${esc(o[k])}</td></tr>`).join("")}</tbody></table>
      ${[R.exhaustion, (R.spellPower||{}).text, (R.spellAttack||{}).text, (R.mastery||{}).text, R.castingRequiresVoice].filter(Boolean).map(t=>`<p>${esc(t)}</p>`).join("")}` };
  },
  spellTiers: T => ({ title:"Spell tiers", html:
    `<table class="ref"><thead><tr><th>Tier</th><th>TN</th><th>TH</th><th></th></tr></thead><tbody>${T.map(t=>
      `<tr><td><b>${esc(t.name)}</b></td><td class="num">${t.tn}</td><td class="num">${t.th}</td><td>${esc(t.description||"")}</td></tr>`).join("")}</tbody></table>` }),
  cascadeTable: T => ({ title:"The Cascade Table", html:
    `<p>${esc(T.rollNote||"")}</p><table class="ref"><tbody>${(T.rows||[]).map(r=>
      `<tr><td class="num">${rangeLabel(r)}</td><td><b>${esc(r.name)}</b></td><td>${esc(r.effect||"")}</td></tr>`).join("")}</tbody></table>` }),
  aberrationTable: A => {
    const cat = id => ((D.aberrationCategories||[]).find(c=>c.id===id)||{name:id}).name;
    return { title:"The Aberration Table", html:
      `<p>${esc(A.die||"")}. ${esc(A.note||"")}</p><table class="ref"><thead><tr><th>Roll</th><th>Temporary</th><th>Permanent</th></tr></thead><tbody>${(A.rows||[]).map(r=>
        `<tr><td class="num">${rangeLabel(r)}</td><td>${esc(cat(r.temporary))}</td><td>${esc(cat(r.permanent))}</td></tr>`).join("")}</tbody></table>` };
  },
  aberrations: list => {
    const R = D.aberrationRules||{};
    return { title:"Aberrations", html:
      `${R.intro?`<p>${esc(R.intro)}</p>`:""}${(D.aberrationCategories||[]).map(c=>`<div class="subsect">${esc(c.name)}</div><table class="ref"><tbody>${
        list.filter(a=>a.category===c.id).map(a=>`<tr><td><b>${esc(a.name)}</b></td><td>${a.as?`<i>As ${esc(a.as)}.</i> `:""}${esc(a.description)}</td></tr>`).join("")}</tbody></table>`).join("")}
      ${R.permanent?`<p>${esc(R.permanent)}</p>`:""}` };
  },
};
function referencePanelHtml(p){
  const parts = (p.shows||[]).filter(k=>REFERENCE_SECTIONS[k] && D[k]).map(k=>REFERENCE_SECTIONS[k](D[k]));
  if (!parts.length) return "";
  return `<div class="sect">${esc(p.title||"Reference")}</div><div class="reference" data-reference="${esc(p.id)}">` +
    parts.map(x=>`<details class="group"><summary>${esc(x.title)}</summary><div class="ref-body">${x.html}</div></details>`).join("") + `</div>`;
}

// ── Sheet: trackers ──────────────────────────────────────────────────
// ── Cascade (Decisions 106, 115) ─────────────────────────────────────
// The GM runs the Cascade (Scott, 2026-09-24): the player rolls 1d10 + the
// Rupture's degree and says the total, and the GM says what it left. So the
// panel gives the instruction and opens the Aberration picker for whatever
// the GM names. The tables stay in the Magic reference for anyone to read.
function cascadePanelHtml(ch){
  return `<div class="hitpanel" data-cascadepanel><h4>Cascade</h4>
    <p>The Aether broke through. Roll a d10, add your Rupture's degree, and tell your GM the total. What it left behind is their call.</p>
    <div class="hitrow"><button class="btn primary sm" data-abpickopen="cascade">Record what your GM tells you</button></div>
    <p class="hitnote">Backlash, a Cosmetic Mutation and Burned Out aren't Aberrations. Your GM runs those, and anything that lasts goes in your Notes.</p></div>`;
}

// ── Aberrations the character has (Decision 110) ─────────────────────
// Chips from Engine.aberrationState(): permanent ones get Remove (a quest or
// ritual is the GM's call), temporary ones Clear ("8 hours" is the table's
// clock, not ours). Adding one, by hand or from a Cascade, is the picker
// modal below (Decision 115).
function aberrationsHtml(ch){
  const st = Engine.aberrationState(ch), R = D.aberrationRules||{};
  const chip = a => `<span class="cond-chip${a.def&&a.def.category==="bad"?" bad":""}" title="${esc(a.def?a.def.description:"")}">
      <span class="cond-chip-body"><b>${esc(a.name)}</b>${a.category?` <small>${esc(a.category)}</small>`:""}${a.missing?` <small>no longer in the game data</small>`:""}</span>
      <button class="x" data-abrm="${a.index}" aria-label="${a.permanence==="permanent"?"Remove":"Clear"} ${esc(a.name)}" title="${a.permanence==="permanent"?"Remove (a quest or ritual undid it)":"Clear (it wore off)"}">✕</button></span>`;
  const card = a => `<div class="pick cond-card"><div class="head"><h4>${esc(a.name)}</h4>
      ${a.category?`<span class="cost">${esc(a.category)}</span>`:""}
      <div class="controls"><button class="btn sm" data-abrm="${a.index}">${a.permanence==="permanent"?"Remove":"Clear"}</button></div></div>
      <div class="desc">${a.def?(a.def.as?`<i>As ${esc(a.def.as)}.</i> `:"")+esc(a.def.description):"This Aberration isn't in the game data any more."}</div>
      <input type="text" class="cond-note" data-abnote="${a.index}" value="${esc(a.note)}" placeholder="note: which Cascade, what it looks like on you" aria-label="${esc(a.name)} note"></div>`;
  let h = `<div class="sect">Aberrations</div>`;
  if (!st.active.length) h += `<p class="step-note cond-none">No Aberrations. ${esc(R.noStacking||"")}</p>`;
  if (st.permanent.length) h += `<div class="subsect">Permanent</div>${st.permanent.map(card).join("")}<p class="step-note">${esc(R.permanent||"")}</p>`;
  if (st.temporary.length) h += `<div class="subsect">Temporary</div><div class="cond-chips">${st.temporary.map(chip).join("")}</div>`;
  if (st.adjust.TOL) h += `<p class="step-note">${esc(R.adjustNote||"")}</p>`;
  h += `<button class="btn sm" data-abpickopen="add">+ Add an Aberration</button>`;
  return h;
}

// ── The Aberration picker (Decision 115) ─────────────────────────────
// Every Aberration as a card with its whole text, so a player can read what
// they might have caught before the GM says which. The same modal for a
// Cascade and for adding one by hand; one you have is dimmed and says so.
// S.abPick keeps the toggle and the search across the redraws.
const abPermNote = p => (D.aberrationRules||{})[p==="permanent" ? "permanent" : "temporary"] || "";
function aberrationPickerHtml(ch){
  const st = S.abPick;
  return `<div class="ab-pick"><div class="pick-head">
      <div class="hitrow"><div class="form-toggle">${["temporary","permanent"].map(p=>
        `<button class="${st.permanence===p?"on":""}" data-abperm="${p}" aria-pressed="${st.permanence===p}">${p==="permanent"?"Permanent":"Temporary"}</button>`).join("")}</div>
      <input type="search" data-abq value="${esc(st.q)}" placeholder="Search name or text" aria-label="Search Aberrations"></div>
      <p class="pick-status" data-abstatus>${esc(abPermNote(st.permanence))}</p></div>
    <div data-abresults>${aberrationResultsHtml(ch)}</div></div>`;
}
function aberrationResultsHtml(ch){
  const st = S.abPick, q = st.q.trim().toLowerCase();
  const held = new Set(Engine.aberrationState(ch).active.map(a=>a.id));
  const hit = a => !q || [a.name, a.as, a.description].some(s=>s && s.toLowerCase().includes(q));
  const html = (D.aberrationCategories||[]).map(c=>{
    const list = (D.aberrations||[]).filter(a=>a.category===c.id && hit(a));
    return list.length ? `<div class="subsect">${esc(c.name)}</div><div class="ab-cards">${list.map(a=>
      `<button class="ab-card${c.id==="bad"?" bad":""}" data-abpick="${esc(a.id)}" ${held.has(a.id)?"disabled":""}>
        <b>${esc(a.name)}</b>${held.has(a.id)?`<span class="why">You have it</span>`:""}
        <span class="desc">${a.as?`<i>As ${esc(a.as)}.</i> `:""}${esc(a.description)}</span></button>`).join("")}</div>` : "";
  }).join("");
  return html || `<p class="step-note">Nothing matches.</p>`;
}

// ── Take a hit (combat plan Session 3, Decision 99) ──────────────────
// The panel is a guided path onto the same inputs the damage buttons edit
// (plan P7): the engine resolves the hit, the player answers the checks it
// asks for, and Apply is one commit(), so the whole hit undoes in one step.
// S.hit holds the form while it's open; nothing is saved until Apply.
function newHitForm(){
  return { damage:"", damageType:"ballistic", category:"regular", ap:false, location:"",
           protRoll:"", shock:"", atZero:"", conds:{}, nat:{} };
}
function hitInput(st){
  return { damage: st.damage, damageType: st.damageType, category: st.category, ap: !!st.ap,
           location: st.location || undefined, protRoll: st.protRoll,
           natural: Object.keys(st.nat||{}).filter(k=>st.nat[k]) };
}
// Condition ids only: the engine puts a body-part Condition where the hit
// landed (after any Headshot Defense redirect), not where it was aimed.
function hitChoices(st, r){
  const on = id => st.conds[id]!==undefined ? st.conds[id] : r.prompts.always.includes(id);
  return { shock: st.shock, atZero: st.atZero, conditions: r.prompts.conditions.filter(on) };
}
function hitLabel(r){
  const kind = r.cat.bypassesArmor || r.cat.recordsWithering ? " "+r.cat.name : "";
  return `Hit: ${r.damage} ${r.type.name}${kind} → ` +
    (r.bypassesArmor ? `${r.levelsLost} Health Level${r.levelsLost===1?"":"s"} removed` : `${r.through} through`);
}
// What still stands between the form and Apply, in words. The footer shows
// it next to the disabled button (W6), so the reason is never a guess.
function hitPending(st, r){
  if (!r.ok) return r.why;
  if (r.prompts.shock && !st.shock) return "Mark the Shock Check as passed or failed first.";
  if (r.prompts.atZero && !st.atZero) return "Mark the check at zero as passed or failed first.";
  return "";
}
// W6: Take a hit is a modal (openModal). The body leads with where the
// character stands, HP and the Health Level track, then the form and what the
// hit would do; the footer holds Apply, which stays off until nothing's pending.
function hitModalParts(ch){
  const st=S.hit, r=Engine.resolveHit(ch, hitInput(st)), pain=Engine.painState(ch), hp=Engine.health(ch);
  const pending=hitPending(st, r);
  const body=`<div class="hit-now"><span class="big ${pain.down?"bad":"hp"}">${pain.hpLeft} / ${hp.total} HP</span>
      <span class="sub">${esc(pain.label)}</span></div>${hlTrackHtml(ch)}` + hitPanelHtml(ch, r);
  const foot=`${pending?`<span class="modal-note hitwhy">${esc(pending)}</span>`:""}
    <button class="btn" data-hitcancel="1">Cancel</button>
    <button class="btn primary" data-hitapply="1" ${pending?"disabled":""}>Apply hit</button>`;
  return { body, foot };
}
function hitPanelHtml(ch, r){
  const st=S.hit, as=Engine.armorState(ch);
  const opt=(v,l,sel)=>`<option value="${esc(v)}" ${sel?"selected":""}>${esc(l)}</option>`;
  // How the chosen category resolves is data (Decision 99): one that
  // bypasses armor asks for Integrity instead of a PROT roll, and has no AP.
  const cat=Engine.damageCategoryById(st.category)||{}, bypass=!!cat.bypassesArmor;
  const locName=id=>((Engine.locationById(id)||{}).name||"").toLowerCase();
  const field=(label, inner)=>`<label class="field"><span>${label}</span>${inner}</label>`;
  // Text with a numeric keypad, not type=number: the modal redraws as you
  // type, and only a text field can have its caret put back at the end.
  const num=(k, label)=>field(label, `<input type="text" inputmode="numeric" pattern="[0-9]*" data-hit="${k}" value="${esc(st[k])}">`);
  const passFail=k=>`<select data-hit="${k}" aria-label="result">${opt("","Did you pass?",!st[k])}${opt("pass","Passed",st[k]==="pass")}${opt("fail","Failed",st[k]==="fail")}</select>`;

  let h=`<div data-hitpanel>
    <div class="hitrow">
      ${num("damage","Damage")}
      ${field("Type",`<select data-hit="damageType">${D.damageTypes.map(t=>opt(t.id,t.name,t.id===st.damageType)).join("")}</select>`)}
      ${field("Kind",`<select data-hit="category">${D.damageCategories.map(c=>opt(c.id,c.name,c.id===st.category)).join("")}</select>`)}
      ${field("Where",`<select data-hit="location">${opt("","Center mass",!st.location)}${D.bodyLocations.map(l=>opt(l.id,l.name,l.id===st.location)).join("")}</select>`)}
      ${bypass?"":`<label class="check"><input type="checkbox" data-hit="ap" ${st.ap?"checked":""}> Armor-piercing</label>`}
    </div>
    <p class="hitnote">${esc(cat.text||"")}</p>`;

  // Armor: the worn body piece, from Loadout (Decision 100).
  const skin=Engine.naturalArmor(ch, hitInput(st).natural).total>0;
  if (as.worn){
    const w=as.worn;
    h+=`<div class="hitrow"><span class="hitarmor">${esc(w.name)} · PROT ${esc(w.prot||"—")} · RES +${w.res} · Integrity ${w.integrity}/${w.integrityMax}${w.scrapped?" · scrap":w.compromised?" · Compromised":""}</span>
      ${!bypass && (!r.ok || r.covered) ? num("protRoll","PROT roll") : ""}</div>`;
  } else {
    h+=`<div class="hitrow"><span class="hitnote">No body armor worn${skin?"":", so nothing answers the hit"}. Armor goes on under Loadout.</span></div>`;
  }
  as.problems.forEach(p=>{ h+=`<p class="hitnote">${esc(p)}</p>`; });
  // Natural Armor (Decision 104): what's always on, and a tick for each
  // source that's only on some of the time (Iron Shirt, a waning moon).
  const nat=Engine.naturalArmor(ch, hitInput(st).natural);
  if (nat.base>0 || nat.conditional.length)
    h+=`<div class="hitrow"><span class="hitarmor">Natural Armor ${nat.total}</span>${nat.conditional.map(c=>
      `<label class="check"><input type="checkbox" data-hitnat="${esc(c.id)}" ${c.active?"checked":""}> ${esc(c.name)} (${
        c.amount?`+${c.amount}`:`answers ${esc(c.resAgainst.map(titleCase).join(", "))}`}, ${esc(c.while)})</label>`).join("")}</div>`;

  if (r.ok){
    const lines=[];
    if (r.redirectedBy) lines.push(`${r.redirectedBy.feature} (${r.redirectedBy.by}): the head shot lands as a torso hit.`);
    if (r.armor && !r.covered) lines.push(`${r.armor.name} doesn't cover the ${locName(r.location)}.${skin?"":" Nothing answers the hit."}`);
    if (r.bypassesArmor){
      if (r.covered) lines.push(`Strips ${r.integrityLost} Integrity from ${r.armor.name}${r.scrap?". It's scrap now, and can't be repaired":""}.`);
      lines.push(`Removes ${r.levelsLost} Health Level${r.levelsLost===1?"":"s"} outright.`);
    } else if (r.covered){
      const why={ ap:"Armor-piercing skips RES.", compromised:"The armor is Compromised, so no RES.",
                  type:`RES doesn't answer ${r.type.name} damage.` }[r.resSkipped]||"";
      lines.push(`PROT ${r.prot}${r.res?` + RES ${r.res}`:""} stops ${r.absorbed}. ${why}`.trim());
      if (r.soaked) lines.push(`Nothing gets through${r.integrityLost?`, but the armor loses ${r.integrityLost} Integrity`:""}.`);
    }
    const N=r.natural;
    const natLine = !(N.total>0) ? "" : N.absorbed ? `Natural Armor stops ${N.absorbed}.`
      : N.skipped==="massive" ? "Massive damage goes straight past Natural Armor."
      : N.skipped==="type" ? `Natural Armor doesn't answer ${r.type.name} damage.` : "";
    if (natLine) lines.push(natLine);
    if (!r.bypassesArmor && !r.soaked) lines.push(r.through ? `${r.through} gets through.` : "Nothing gets through.");
    if (r.tookDamage) lines.push(`Health Levels lost: ${r.before.lost} → ${r.after.lost}. HP left: ${r.before.hpLeft} → ${r.after.hpLeft}.`);
    h+=`<div class="hitresult">${lines.map(l=>`<p>${esc(l)}</p>`).join("")}</div>`;
    r.notes.forEach(n=>{ h+=noticeHtml(copy("unsettledLabel"), n); });

    const P=r.prompts;
    if (P.shock) h+=`<div class="hitcheck"><b>Shock Check</b> · ${esc(P.shock.check)}<p>${esc(P.shock.text)}</p>${passFail("shock")}</div>`;
    if (P.atZero) h+=`<div class="hitcheck bad"><b>At zero</b> · ${esc(P.atZero.check)}<p>${esc(P.atZero.text)}${
      P.atZero.freePassHeld?" "+esc(P.atZero.freePass.text):""}</p>${passFail("atZero")}</div>`;
    if (P.deathMark) h+=`<div class="hitcheck bad"><b>Dying</b><p>${esc(P.deathMark.text)}</p></div>`;
    if (P.conditions.length){
      const on=id=>st.conds[id]!==undefined ? st.conds[id] : P.always.includes(id);
      h+=`<div class="hitconds"><span>Conditions this hit can cause. Tick what your GM rules:</span>` +
        P.conditions.map(id=>{ const d=Engine.conditionById(id);
          return `<label class="check"><input type="checkbox" data-hitcond="${esc(id)}" ${on(id)?"checked":""}> ${esc(d.name)}${
            d.location?` (${esc(locName(r.location))})`:""}</label>`; }).join("") + `</div>`;
    }
  }
  return h + `</div>`;
}

// ── Recovery and the Turn Reset (combat plan Session 4, Decision 100) ──
// Same shape as Take a hit: S.act holds one open panel's form, the engine
// says what it would do, and Apply is one commit(). Only one panel is open at
// a time, the hit panel included.
function newActForm(kind){
  return { kind, sources:{}, atZero:"", dyingCheck:"", days:"1", speed:false, hp:"",
           clear:{}, massive:"", difficulty:"medium", roll:"", shCheck:"", shRoll:"", dose:"1", fromGear:null };
}
const actOpt=(v,l,sel)=>`<option value="${esc(v)}" ${sel?"selected":""}>${esc(l)}</option>`;
const actNum=(st,k,label,extra="")=>`<label class="field"><span>${label}</span><input type="number" min="0" data-act="${k}" value="${esc(st[k])}" ${extra}></label>`;
const actPassFail=(st,k)=>`<select data-act="${k}" aria-label="result">${actOpt("","Did you pass?",!st[k])}${actOpt("pass","Passed",st[k]==="pass")}${actOpt("fail","Failed",st[k]==="fail")}</select>`;
const actButtons=(ok, label)=>`<div class="hitrow"><button class="btn primary" data-actapply="1" ${ok?"":"disabled"}>${esc(label)}</button>
  <button class="btn" data-actcancel="1">Cancel</button></div>`;
function actInput(ch, st){
  if (st.kind==="reset") return { sources: st.sources };
  if (st.kind==="rest"){
    const nh=Engine.naturalHealing(ch), days=Math.max(0, Math.floor(Number(st.days)||0));
    const proposed = nh.perDay * days * (st.speed ? nh.speedHealMultiplier : 1);
    return { kind:"natural", hp: st.hp==="" ? proposed : st.hp, days, proposed };
  }
  if (st.kind==="focused") return { kind:"focused", hp: st.hp,
    clear: Object.keys(st.clear).filter(i=>st.clear[i]).map(Number), massive: st.massive };
  if (st.kind==="nanomed"){
    const proposed=Engine.nanomedKit(ch, st.dose).proposed;
    return { kind:"nanomed", dose: st.dose, hp: st.hp==="" ? proposed : st.hp, proposed };
  }
  if (st.kind==="wear") return { difficulty: st.difficulty, roll: st.roll, selfHealCheck: st.shCheck, selfHealRoll: st.shRoll };
  return {};
}
function resetPanelHtml(ch, st){
  const r=Engine.resolveReset(ch, actInput(ch, st));
  let h=`<div class="hitpanel" data-actpanel="reset"><h4>Turn Reset</h4>`;
  if (r.ticks.length) h+=`<div class="hitrow">` + r.ticks.map(t=> t.source
    ? actNum({ [`src:${t.index}`]: st.sources[t.index]==null?"":st.sources[t.index] }, `src:${t.index}`, `${esc(t.name)} damage this round`)
    : `<span class="hitarmor">${esc(t.name)}: ${t.hp} HP</span>`).join("") + `</div>`;
  else h+=`<p class="hitnote">Nothing is ticking this round.</p>`;
  if (!r.ok) h+=`<p class="hitwhy">${esc(r.why)}</p>`;
  else {
    const lines=[];
    if (r.total) lines.push(`${r.total} damage goes on. HP left: ${r.before.hpLeft} → ${r.after.hpLeft}.`);
    if (r.marks) lines.push(`You're Dying, so that's ${r.marks} Death Mark${r.marks===1?"":"s"}.`);
    if (lines.length) h+=`<div class="hitresult">${lines.map(l=>`<p>${esc(l)}</p>`).join("")}</div>`;
    r.notes.forEach(n=>{ h+=noticeHtml(copy("unsettledLabel"), n); });
    const P=r.prompts;
    if (P.atZero) h+=`<div class="hitcheck bad"><b>At zero</b> · ${esc(P.atZero.check)}<p>${esc(P.atZero.text)}${
      P.atZero.freePassHeld?" "+esc(P.atZero.freePass.text):""}</p>${actPassFail(st,"atZero")}</div>`;
    if (P.dyingCheck) h+=`<div class="hitcheck bad"><b>Dying</b> · ${esc(P.dyingCheck.check)}<p>${esc(P.dyingCheck.text)}</p>${actPassFail(st,"dyingCheck")}</div>`;
  }
  if (r.recovery.length) h+=`<div class="hitconds"><span>What each Condition needs to end. Your GM calls the checks:</span></div>
    <div class="hitresult">${r.recovery.map(c=>`<p><b>${esc(c.name)}</b> · ${esc(c.recovery)}</p>`).join("")}</div>`;
  return h + actButtons(r.ok && r.hasEffect, "Apply Reset") + `</div>`;
}
function restPanelHtml(ch, st){
  const nh=Engine.naturalHealing(ch), inp=actInput(ch, st), hs=Engine.hlState(ch);
  const r=Engine.heal(clone(ch), inp);
  let h=`<div class="hitpanel" data-actpanel="rest"><h4>Rest</h4><p class="hitnote">${esc(nh.text)} ${esc(nh.speedHealText)}</p>
    <div class="hitrow">${actNum(st,"days","Days of rest")}
      <label class="check"><input type="checkbox" data-act="speed" ${st.speed?"checked":""}> Speed Heal</label>
      ${actNum({ hp: st.hp==="" ? inp.proposed : st.hp }, "hp", "HP recovered")}</div>${st.speed?gearUseHtml(ch, st, "speed-heal", "fromGear"):""}`;
  if (!r.ok) h+=`<p class="hitwhy">${esc(r.why)}</p>`;
  else h+=`<div class="hitresult"><p>${esc(`Damage ${hs.damage} → ${hs.damage - r.healed}.`)}</p>${
    hs.massive?`<p>${esc("Rest doesn't bring back Health Levels lost to Massive damage. That takes Focused Healing.")}</p>`:""}</div>`;
  return h + actButtons(r.ok, "Rest") + `</div>`;
}
function focusedPanelHtml(ch, st){
  const F=(D.recoveryRules||{}).focusedHealing||{}, hs=Engine.hlState(ch);
  const r=Engine.heal(clone(ch), actInput(ch, st));
  let h=`<div class="hitpanel" data-actpanel="focused"><h4>Focused Healing</h4><p class="hitnote">${esc(F.text||"")}</p>
    <div class="hitrow">${actNum(st,"hp","HP restored")}${hs.massive?actNum(st,"massive","Massive levels restored",`max="${hs.massive}"`):""}</div>`;
  if (hs.massive) h+=`<p class="hitnote">${esc(F.massiveText||"")}</p>`;
  const clearable = (ch.trackers.conditions||[]).map((e,i)=>({e,i})).filter(x=>(F.clears||[]).includes(x.e.id));
  if (clearable.length) h+=`<div class="hitconds"><span>Conditions this care clears:</span>` + clearable.map(({e,i})=>{
    const d=Engine.conditionById(e.id), l=Engine.locationById(e.location);
    return `<label class="check"><input type="checkbox" data-act="clear:${i}" ${st.clear[i]?"checked":""}> ${esc(d.name)}${l?` (${esc(l.name)})`:""}</label>`; }).join("") + `</div>`;
  if (!r.ok) h+=`<p class="hitwhy">${esc(r.why)}</p>`;
  else {
    const lines=[r.healed?`Damage ${hs.damage} → ${hs.damage - r.healed}.`:"",
      r.restored?`Massive levels ${hs.massive} → ${hs.massive - r.restored}.`:"",
      ...r.cleared.map(e=>{ const d=Engine.conditionById(e.id), l=Engine.locationById(e.location); return `Clears ${d?d.name:e.id}${l?` (${l.name})`:""}.`; })].filter(Boolean);
    h+=`<div class="hitresult">${lines.map(l=>`<p>${esc(l)}</p>`).join("")}</div>`;
  }
  return h + actButtons(r.ok, "Apply healing") + `</div>`;
}
// W17: a panel that spends something you might carry offers to take it
// from your gear. On by default when you carry one, so the kit comes off the
// count in the same action as the healing, and one undo puts both back.
// `st[key]` is null until the player says otherwise.
function gearUseHtml(ch, st, id, key){
  const c=Engine.carriedGear(ch, id), def=(D.equipment||[]).find(e=>e.id===id);
  if (!c || !def) return "";
  const on = st[key]==null ? true : !!st[key];
  return `<div class="hitrow"><label class="check"><input type="checkbox" data-act="${key}" ${on?"checked":""}> Use one you carry: ${esc(def.name)} (${c.qty} left)</label></div>`;
}
// A Nanomed Kit (Decision 105): clears 054's list and Dying on its own, and
// proposes the regeneration for the dose. The player can lower the number.
function nanomedPanelHtml(ch, st){
  const inp=actInput(ch, st), kit=Engine.nanomedKit(ch, st.dose), hs=Engine.hlState(ch);
  const r=Engine.heal(clone(ch), inp);
  const doses=["First","Second","Third","Fourth","Fifth"];
  let h=`<div class="hitpanel" data-actpanel="nanomed"><h4>Nanomed Kit</h4><p class="hitnote">${esc(kit.text)} ${esc(kit.doseText)}</p>
    <div class="hitrow"><label class="field"><span>Kit today</span><select data-act="dose">${doses.map((l,i)=>actOpt(String(i+1), l, String(st.dose)===String(i+1))).join("")}</select></label>
      ${actNum({ hp: st.hp==="" ? inp.proposed : st.hp }, "hp", "HP regenerated")}</div>
    <p class="hitnote">${esc(`1 HP every ${kit.everyRounds===1?"round":kit.everyRounds+" rounds"} for ${kit.rounds} rounds. If it's cut short, lower the number.`)}</p>${gearUseHtml(ch, st, "nanomed-kit", "fromGear")}`;
  if (!r.ok) h+=`<p class="hitwhy">${esc(r.why)}</p>`;
  else {
    const lines=[r.healed?`Damage ${hs.damage} → ${hs.damage - r.healed}.`:"",
      ...r.cleared.map(e=>{ const d=Engine.conditionById(e.id); return `Clears ${d?d.name:e.id}${e.marks?` and its ${e.marks} Death Mark${e.marks===1?"":"s"}`:""}.`; })].filter(Boolean);
    h+=`<div class="hitresult">${lines.map(l=>`<p>${esc(l)}</p>`).join("")}</div>`;
  }
  return h + actButtons(r.ok, "Use the kit") + `</div>`;
}
function wearPanelHtml(ch, st){
  const R=D.armorRules||{}, w=Engine.armorState(ch).worn;
  let h=`<div class="hitpanel" data-actpanel="wear"><h4>After the fight</h4><p class="hitnote">${esc(R.wearNote||"")}</p>`;
  if (!w) return h + `<p class="hitwhy">No body armor worn.</p>` + actButtons(false, "Apply wear") + `</div>`;
  const dice=R.integrityLossByDifficulty||{};
  h+=`<div class="hitrow"><span class="hitarmor">${esc(w.name)} · Integrity ${w.integrity}/${w.integrityMax}</span>
    <label class="field"><span>How hard was it</span><select data-act="difficulty">${Object.keys(dice).map(k=>actOpt(k, `${titleCase(k)} (${dice[k]})`, st.difficulty===k)).join("")}</select></label>
    ${actNum(st,"roll","Wear die",`max="${esc(String(dice[st.difficulty]||"").replace(/^1?d/,""))}"`)}</div>`;
  const sh = w.scrapped ? null : w.features.map(f=>(D.armorFeatureGlossary||[]).find(g=>g.id===f)).find(g=>g && g.afterEncounter);
  if (sh){
    const A=sh.afterEncounter;
    h+=`<div class="hitrow"><span class="hitnote">${esc(sh.id)}: roll ${esc(A.checkDie)}. On ${A.succeedsOn} or better it regains ${esc(A.restoresDie)} Integrity.</span>
      ${actNum(st,"shCheck",`${esc(sh.id)} roll`)}${Number(st.shCheck)>=A.succeedsOn?actNum(st,"shRoll","Integrity regained"):""}</div>`;
  }
  const c=clone(ch), r=Engine.armorWear(c, w.index, actInput(ch, st));
  if (!r.ok) h+=`<p class="hitwhy">${esc(r.why)}</p>`;
  else h+=`<div class="hitresult"><p>${esc(`${r.name} loses ${r.lost} Integrity${r.selfHeal&&r.selfHeal.healed?` and ${r.selfHeal.feature} gives back ${r.selfHeal.healed}`:""}: ${r.before} → ${r.after}.`)}${
    r.after<=0?` ${esc(R.compromisedNote||"")}`:""}</p></div>`;
  return h + actButtons(r.ok, "Apply wear") + `</div>`;
}
function actPanelHtml(ch){
  const st=S.act;
  return st.kind==="reset" ? resetPanelHtml(ch, st) : st.kind==="rest" ? restPanelHtml(ch, st)
       : st.kind==="focused" ? focusedPanelHtml(ch, st) : st.kind==="nanomed" ? nanomedPanelHtml(ch, st)
       : st.kind==="wear" ? wearPanelHtml(ch, st) : "";
}

// The Health Level track: in Trackers' Damage card, and atop the Take a hit
// modal. W10: the boxes are grouped by the Pain Level each one puts you at,
// the print sheet's bands (pPainBandFor), and the band you're standing in is
// marked, so the track shows why you're at Pain 2 rather than a card saying so.
function hlTrackHtml(ch){
  const hpPer=Engine.health(ch).hpPer, cells=hlCells(ch), here=Engine.hlState(ch).lost;   // HL lost, Massive included
  const bands=[];
  cells.forEach((c,i)=>{ const lvl=pPainBandFor(i).level, last=bands[bands.length-1];
    if (last && last.level===lvl) last.cells.push([c,i]); else bands.push({ level:lvl, cells:[[c,i]] }); });
  return `<div class="hl-track">` + bands.map(b=>{
    const at = b.level===pPainBandFor(here).level;
    return `<div class="hl-band pl-${b.level}${at?" here":""}"><span class="hl-band-k">Pain ${b.level}</span><div class="hl-band-cells">` +
      b.cells.map(([c,i])=>`<div class="hl ${c.gone?"gone":""} ${c.massive?"massive":""}${landedCls("hl",i)}" ${c.massive?'title="Removed by Massive damage"':""}><div class="fill" style="transform:scaleX(${c.frac.toFixed(2)})"></div><span>${c.massive?"—":c.gone?"✕":c.left+"/"+hpPer}</span></div>`).join("") +
      `</div></div>`; }).join("") + `</div>`;
}
// The vitals' controls, drawn by Trackers and by the vitals popovers (W2/W3)
// alike and bound by one binder (bindVitalControls), so they can't drift.
function damageStepperHtml(ch){
  const d=ch.trackers.damage;
  return `<div class="trk-row">
    <button class="btn sm" data-dmg="-5" ${d?"":"disabled"}>Heal 5</button>
    <button class="btn sm" data-dmg="-1" ${d?"":"disabled"}>Heal 1</button>
    <input type="number" min="0" data-dmgset value="${d}" aria-label="total damage taken" title="Total damage taken">
    <button class="btn sm" data-dmg="1">Hurt 1</button>
    <button class="btn sm" data-dmg="5">Hurt 5</button>
    <button class="btn sm danger" data-dmgheal="1">Heal all</button></div>`;
}
const sanControlsHtml = ch => `<button class="btn sm" data-san="-1">−1 loss</button>
    <input type="number" min="0" data-sanset value="${ch.trackers.san.loss}" aria-label="SAN lost">
    <button class="btn sm" data-san="1">+1 loss</button>`;
const luckControlsHtml = luck => luck.spendActions.map(sa=>`<button class="btn sm" data-luckspend="${sa.cost}" ${luck.current<sa.cost?"disabled":""} title="${esc(sa.effect)}">${esc(sa.action)} (−${sa.cost})</button>`).join("") +
    `<button class="btn sm" data-luckregain="1" ${luck.spent<=0?"disabled":""}>Regain (+1)</button>`;
const creditControlsHtml = () => `<input type="number" data-cramt placeholder="amount" aria-label="credit amount">
    <input type="text" data-crnote placeholder="note (what for)" aria-label="credit note">
    <button class="btn sm" data-cr="1">+ Earn</button>
    <button class="btn sm" data-cr="-1">− Spend</button>`;

// W2/W3: what each vital's popover holds. The same five on the vitals bar
// and on Main's cards; `null` when the key isn't one (the popover closes).
function vitalPopover(ch, key){
  const pain=Engine.painState(ch), hp=Engine.health(ch);
  const now = (big, cls, sub) => `<div class="pop-now"><span class="big ${cls}">${big}</span>${sub?`<span class="sub">${sub}</span>`:""}</div>`;
  if (key==="hp") return { title:"Health",
    html: now(`${pain.hpLeft} / ${hp.total} HP`, pain.down?"bad":"hp", esc(pain.label)) + damageStepperHtml(ch) +
      `<div class="trk-actions"><button class="btn sm primary" data-pophit>Take a hit</button>
       <button class="btn sm" data-popgo="trackers">Recovery on Trackers</button></div>` };
  if (key==="pain" || key==="cond") return { title:"Pain & Conditions",
    html: now(pain.down?"DOWN":pain.level?`Pain Lv ${pain.level}`:"No Pain", pain.level||pain.down?"bad":"",
      pain.level?esc(painPenaltyLine(pain,false)):"no penalties") + conditionsHtml(ch, false) };
  if (key==="san"){ const san=Engine.sanState(ch);
    return { title:"Sanity", html: now(`${san.current} / ${san.max}%`, san.current<=san.max/2?"bad":"san", "") +
      `<div class="trk-row">${sanControlsHtml(ch)}</div>` }; }
  if (key==="luck"){ const luck=Engine.luckState(ch);
    return { title:"LUCK", html: now(`${luck.current} / ${luck.max}`, luck.current===0?"bad":"gold", "") +
      `<div class="trk-row">${luckControlsHtml(luck)}</div>` }; }
  if (key==="cred") return { title:"Çredits",
    html: now(`Ç ${ch.trackers.credits.current}`, "gold", "") + `<div class="trk-row pop-cred">${creditControlsHtml()}</div>
      <button class="btn sm" data-popgo="trackers">Ledger on Trackers</button>` };
  return null;
}

function renderShTrackers(){
  const ch=S.ch, hp=Engine.health(ch), pain=Engine.painState(ch);
  const luck=Engine.luckState(ch), san=Engine.sanState(ch);
  if (S.act && S.act.owner!==ch) S.act=null;     // a different character was loaded
  // Take a hit is a modal (W6), so only a recovery panel holds the page.
  const open = !!S.act;
  const hs=Engine.hlState(ch), withering=Math.min(hs.damage, Math.max(0, Math.floor(Number(ch.trackers.witheringDamage)||0)));
  let h = sheetHeader("Trackers", "Current state only — every maximum on this page is computed and recalculates the moment an input changes.");

  // W1: two columns on a wide screen. The body (Damage with its Health
  // Levels, recovery, Armor, Pain, Conditions) reads down the left; the rest
  // (Sanity, LUCK, archetype trackers, Çredits) down the right. One column on
  // a phone, in the same order.
  h += `<div class="trk-grid"><div class="trk-col">`;

  // Damage. The headline is HP left, so the stepper says Heal and Hurt
  // rather than signs on the damage total it edits (W11).
  h += `<div class="trk"><h4>Damage</h4>
    <span class="big ${pain.down?"bad":"hp"}${landedCls("hp")}">${pain.hpLeft} / ${hp.total} HP</span>
    ${pain.down?'<span class="chip pain">DOWN</span>':""}
    ${damageStepperHtml(ch)}
    <span class="sub">${hp.levels} Health Levels × ${hp.hpPer} HP. ${pain.hlLost} HL lost.${
      hs.massive?` ${hs.massive} of them to Massive damage — gone, not emptied. Resting and Heal all don't bring them back; Focused Healing and a replacement do.`:""}${
      withering?` ${withering} of the damage is Withering and won't regenerate.`:""}</span>
    ${hlTrackHtml(ch)}
    <div class="trk-actions">
      <button class="btn sm primary" data-hitopen="1" ${open?"disabled":""}>Take a hit</button>
      <button class="btn sm" data-actopen="reset" ${open?"disabled":""}>Turn Reset</button>
      <button class="btn sm" data-actopen="rest" ${open?"disabled":""}>Rest</button>
      <button class="btn sm" data-actopen="focused" ${open?"disabled":""}>Focused Healing</button>
      <button class="btn sm" data-actopen="nanomed" ${open?"disabled":""}>Nanomed Kit</button></div></div>`;
  if (S.act && S.act.kind!=="wear") h += actPanelHtml(ch);

  // Armor: the worn body piece's Integrity, and the after-fight wear roll.
  const worn = Engine.armorState(ch).worn;
  h += `<div class="trk"><h4>Armor</h4>` + (worn
    ? `<span class="hitarmor">${esc(worn.name)} · ${armorStatLine(worn)}</span>
       <div class="lo-armor-int" style="flex-basis:100%">${intBar(worn)}</div>
       <button class="btn sm" data-actopen="wear" ${open?"disabled":""}>After the fight</button>
       <span class="sub">${esc((D.armorRules||{}).wearNote||"")} Repairs are on Loadout.</span>`
    : `<span class="sub">No body armor worn. Pick it up or put it on under Loadout.</span>`)
    + (naturalArmorText(ch) ? `<span class="hitarmor" style="flex-basis:100%">${esc(naturalArmorText(ch))}</span>` : "") + `</div>`;
  if (S.act && S.act.kind==="wear") h += actPanelHtml(ch);
  h += `<div class="pick ${pain.level?"":"selected"}${landedCls("pain")}"><div class="head"><h4>${esc(pain.label)}</h4>
    ${pain.level?`<span class="cost">${esc(painPenaltyLine(pain,true))}</span>`:'<span class="cost grant">no penalties</span>'}</div>
    <div class="desc">${esc(pain.description)}${painExtra(pain)?`\nHealth Levels lost put you at Pain Level ${pain.fromHealth}; ${esc(pain.painSources.join(", "))} add${pain.painSources.length===1?"s":""} ${signed(painExtra(pain))}. `+esc(D.conditionRules.painClamp):""}${pain.level?"\n"+esc(pain.penaltyNotes):""}</div></div>`;

  // Conditions (Decision 95)
  h += `<div class="sect">Conditions</div>${conditionsHtml(ch, true)}`;
  h += `</div><div class="trk-col">`;

  // SAN
  h += `<div class="trk"><h4>Sanity</h4>
    <span class="big ${san.current<=san.max/2?"bad":""}">${san.current} / ${san.max}%</span>
    ${sanControlsHtml(ch)}
    <span class="sub">Max is EMP × 10, computed. Track loss here; recovery is a story, not a button.</span></div>`;

  // LUCK
  h += `<div class="trk"><h4>LUCK</h4>
    <span class="big ${luck.current===0?"bad":"gold"}">${luck.current} / ${luck.max}</span>${luckControlsHtml(luck)}
    <span class="sub">${esc(luck.refresh)} Logging a session refreshes it automatically.</span></div>`;

  // Archetype tracker panels (declared in data, rendered generically)
  for (const p of Engine.archPanels(ch).filter(x=>x.type==="tracker")){
    const max = Engine.panelMax(ch, p);
    let val;
    if (p.id==="sfr") val = ch.trackers.sfr.spent||0;
    else val = (ch.trackers.panel[p.id]||{}).value||0;
    const manualMax = max==null ? ((ch.trackers.panel[p.id]||{}).max??"") : null;
    const effMax = max!=null ? max : (manualMax===""?null:Number(manualMax));
    const cur = p.id==="sfr" ? (effMax!=null?Math.max(0,effMax-val):null) : val;
    h += `<div class="trk"><h4>${esc(p.title)}</h4>
      <span class="big ${effMax!=null&&p.id!=="sfr"&&cur>=effMax?"bad":""}">${cur==null?"—":cur}${effMax!=null?" / "+effMax:""}</span>
      <button class="btn sm" data-trk="${p.id}|-1">−1</button>
      <button class="btn sm" data-trk="${p.id}|1">+1</button>
      ${max==null?`<label class="field" style="margin:0"><input type="number" min="0" data-trkmax="${p.id}" value="${manualMax}" placeholder="max" aria-label="${esc(p.title)} max" style="width:84px"></label>`:""}
      <span class="sub">${p.atMax&&effMax!=null&&cur>=effMax?esc(p.atMax):p.note?esc(p.note):p.id==="sfr"?"Counts spend against a computed pool — RoU caps a single turn.":p.max==="TOL"?"Capped by Tolerance (computed).":"Set the max when the rules land — the tracker won't block on un-modeled rules."}</span></div>`;
    // A tracker that declares `overMax: "cascade"` (the Arcanist's TOL Spent) opens the
    // Cascade panel once it's past its max: TOL below zero (Decision 106).
    if (p.overMax==="cascade" && effMax!=null && cur>effMax) h += cascadePanelHtml(ch);
  }
  // What a Cascade leaves behind (Decision 110): shown wherever a Cascade can
  // happen, and on any sheet that already carries an Aberration.
  if (Engine.archPanels(ch).some(x=>x.overMax==="cascade") || Engine.aberrationState(ch).active.length) h += aberrationsHtml(ch);

  // Çredits
  h += `<div class="sect">Çredits</div>
    <div class="trk"><h4>Balance</h4><span class="big gold">Ç ${ch.trackers.credits.current}</span>
    ${creditControlsHtml()}</div>`;
  const ledger = ch.trackers.credits.ledger||[];
  if (ledger.length){
    h += `<details class="group" open><summary>Ledger (${ledger.length})</summary><div class="journal">` +
      ledger.slice().reverse().map(e=>`<div class="jrow"><span class="d">${esc(String(e.date).slice(0,10))}</span>
        <span class="amt ${e.amount<0?"spend":"grant"}">${e.amount>0?"+":""}${e.amount}</span>
        <span class="what">${esc(e.note)||"&mdash;"}</span></div>`).join("") + `</div></details>`;
  }

  h += `</div></div>`;

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
  const price = D.ip.skillIncreaseCost, focused = Engine.focusedSkillIds(ch);
  const trained = D.skills.filter(s=>Engine.skillLine(ch,s.id).trained);
  const untrained = D.skills.filter(s=>!Engine.skillLine(ch,s.id).trained);
  h += `<details class="group" open><summary>Raise a Skill — ${price.perRank} × current rank · Focused ${price.focusedPerRank} × · new skill ${price.newSkill} · cap ${D.ip.rankCap}</summary><div class="alloc">`;
  for (const s of trained){
    const line=Engine.skillLine(ch,s.id), c=Engine.ipCost(ch,"skill",s.id);
    h += `<div class="alloc-row"><div class="name">${esc(s.name)}${c.ok&&c.focused?' <span class="chip gold">focused</span>':""} <small>rank ${line.rank}</small></div>
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
      e.targetType==="spell" ? `Mastered ${(Engine.spellById(e.targetId)||{name:e.targetId}).name}` :
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
  if (kind==="damage"||kind==="pain"||kind==="san"||kind==="condition"||kind==="aberration") return "pain";
  if (kind==="ip"||kind==="skill"||kind==="stat") return "cyan";
  if (kind==="admin") return "gold";
  if (kind==="milestone") return "ok";
  return "";
}

// ── Loadout: weapons and armor (combat plan Session 4, Decision 100) ──
// A catalog piece shows what the catalog and the engine say, and only its
// notes are editable. A custom piece is typed. Every number on a weapon line
// comes from Engine.weaponLine(); every armor number from armorState().
const attackText = n => n==null ? "—" : `1d10 ${n<0?"−":"+"} ${Math.abs(n)}`;
const priceText = d => typeof d.cost==="number" && d.cost>0 ? `${d.cost.toLocaleString("en-US")}Ç` : "";
const titleCase = s => String(s||"").replace(/^./, c=>c.toUpperCase());
// ── The catalog browser (W4) ─────────────────────────────────────────
// A modal like the spell picker (Decisions 111–112): search, a group filter,
// "what I can afford", a sort, and every number Loadout would show, before
// Add or Buy. The numbers are Engine.catalogLine(), the same reader Loadout's
// rows use, so the two can't disagree. S.loPick keeps the filters while the
// modal is open; a click on a row (not its buttons) opens its details.
function catalogGroups(kind){
  const R = D.armorRules||{};
  if (kind==="gear") return (D.equipmentCategories||[]).map(c=>({ id:c.id, label:c.name, note:c.note||"", items:(D.equipment||[]).filter(e=>e.category===c.id) }))
    .filter(g=>g.items.length);
  if (kind==="weapons"){
    const known = new Set((D.weaponCategories||[]).map(c=>c.id));
    return (D.weaponCategories||[]).map(c=>({ id:c.id, label:c.name, items:D.weapons.filter(w=>w.category===c.id) }))
      .concat([{ id:"other", label:"Other", items:D.weapons.filter(w=>!known.has(w.category)) }]).filter(g=>g.items.length);
  }
  const slots = [...new Set(D.armor.map(a=>a.slot||"body"))];
  return slots.flatMap(slot => slot==="body"
    ? Object.keys(R.coverageLocations||{}).map(cov=>({ id:`cov:${cov}`, label:(R.coverageNames||{})[cov]||titleCase(cov),
        items:D.armor.filter(a=>(a.slot||"body")==="body" && (a.coverage||R.defaultCoverage)===cov) }))
    : [{ id:`slot:${slot}`, label:(R.slotNames||{})[slot]||titleCase(slot), items:D.armor.filter(a=>a.slot===slot) }]).filter(g=>g.items.length);
}
const CATALOG_SORTS = {
  weapons: [["book","Book order"],["price","Price, low to high"],["-price","Price, high to low"],["-damage","Damage, high to low"],["name","Name"]],
  armor:   [["book","Book order"],["price","Price, low to high"],["-price","Price, high to low"],["-integrity","Integrity, high to low"],["name","Name"]],
  gear:    [["book","Book order"],["price","Price, low to high"],["-price","Price, high to low"],["name","Name"]]
};
function catalogMatches(ch, kind){
  const st = S.loPick || {}, k = String(st.q||"").toLowerCase().trim();
  const rows = catalogGroups(kind).filter(g=>!st.group || g.id===st.group)
    .flatMap(g=>g.items.map(d=>({ g, l: Engine.catalogLine(ch, kind, d.id) }))).filter(x=>x.l);
  const hit = x => !k || [x.l.name, x.g.label, x.l.skill&&x.l.skill.name, x.l.style, x.l.damageType, x.l.quality,
    ...(x.l.tags||[]), ...(x.l.features||[]), x.l.flavorLine, x.l.itemNotes, x.l.spellName, x.l.material].filter(Boolean).join(" ").toLowerCase().includes(k);
  const list = rows.filter(x=>hit(x) && (!st.afford || x.l.buy.ok));
  const key = { price: x=>x.l.price==null?Infinity:x.l.price, damage: x=>x.l.damage==null?-Infinity:x.l.damage,
                integrity: x=>x.l.integrityMax||0, name: x=>x.l.name.toLowerCase() };
  const sort = st.sort||"book", desc = sort[0]==="-", f = key[sort.replace(/^-/,"")];
  if (f) list.sort((a,b)=>{ const x=f(a), y=f(b); return (x<y?-1:x>y?1:0)*(desc?-1:1); });
  return { list, total: rows.length };
}
const perPurchase = l => l.chargesMax ? `${l.chargesMax} charges${l.startsEmpty?" (sold empty)":""}` : l.pack>1 ? `${l.pack} ${esc(l.unit||"")}s` : l.unit ? `1 ${esc(l.unit)}` : "1";
function catalogCellsHtml(kind, l){
  if (kind==="gear")
    return `<td data-k="Notes">${esc(l.itemNotes||"—")}${l.spell?`<div class="sub">${esc(l.spell.name)}: ${esc(tnth(l.spell))}, ${esc(l.spell.effect)}</div>`:""}</td>
      <td class="num" data-k="Comes as">${perPurchase(l)}</td>`;
  if (kind==="weapons"){
    const range = [l.reach ? `Reach ${l.reach}` : l.range, l.radius ? `Radius ${l.radius}` : null, l.parry ? `Parry ${l.parry}` : null].filter(Boolean).join(" · ");
    return `<td class="num" data-k="Attack">${attackText(l.attack)}${l.acc?`<div class="sub">+${l.acc} ACC Single</div>`:""}${l.skill&&!l.skill.trained?`<div class="sub">untrained</div>`:""}</td>
      <td class="num" data-k="Damage">${l.damage!=null?l.damage:esc(l.damageFormula||"—")}${l.damage!=null&&l.damageFormula?`<div class="sub">${esc(l.damageFormula)}</div>`:""}</td>
      <td data-k="Range">${esc(range||"—")}</td><td class="num" data-k="RoF">${esc(l.rof||"—")}</td><td class="num" data-k="Cap.">${esc(l.capacity||"—")}</td>`;
  }
  const res = l.resAgainst.map(titleCase).join(", ");
  return l.slot==="body"
    ? `<td class="num" data-k="PROT">${esc(l.prot||"—")}</td><td class="num" data-k="RES">+${l.res}${res?`<div class="sub">${esc(res)}</div>`:""}</td>
       <td class="num" data-k="Integrity">${l.integrityMax}</td><td class="num" data-k="Mods">${l.mods==null?"—":l.mods}</td>`
    : `<td colspan="4" class="sub">${esc(l.features.join(" · ")||"—")}</td>`;
}
function catalogResultsHtml(ch, kind){
  const { list } = catalogMatches(ch, kind), open = (S.loPick||{}).open;
  if (!list.length) return `<p class="step-note">Nothing in the catalog matches that.</p>`;
  const head = kind==="weapons" ? ["Weapon","Attack","Damage","Range","RoF","Cap."] : kind==="gear" ? ["Item","Notes","Comes as"] : ["Armor","PROT","RES","Integrity","Mods"];
  const cols = head.length + 2;
  return `<table class="ref cat-results"><thead><tr>${head.map(h=>`<th>${h}</th>`).join("")}<th>Price</th><th></th></tr></thead><tbody>` +
    list.map(({ g, l })=>{
      const sub = kind==="weapons"
        ? [g.label, l.skill&&l.skill.name, l.style, l.damageType&&l.damageType!=="Normal"?l.damageType:null, ...l.tags, ...l.features]
        : kind==="gear" ? [g.label, l.material, l.spellName?`Holds ${l.spellName}`:null, l.action?`${l.action} Action`:null]
        : [g.label, l.quality, ...(l.slot==="body"?l.features:[])];
      const det = [l.flavorLine, l.weaponNotes, kind==="gear"?g.note:null].filter(Boolean);
      return `<tr class="catrow${open===l.id?" open":""}" data-catrow="${esc(l.id)}" aria-expanded="${open===l.id}">
        <td><b>${esc(l.name)}</b><div class="sub">${esc([...new Set(sub.filter(Boolean))].join(" · "))}</div>${l.buy.ok||l.price==null?"":`<div class="why">${esc(l.buy.why)}</div>`}</td>
        ${catalogCellsHtml(kind, l)}
        <td class="num" data-k="Price">${priceText({cost:l.price})||esc(l.costText||"—")}${l.availability?`<div class="sub">${esc(l.availability)}</div>`:""}</td>
        <td class="cat-act"><button class="btn sm" data-catadd="${esc(l.id)}" title="Add it without paying: found, issued, or already bought">Add</button>
          <button class="btn sm primary" data-catbuy="${esc(l.id)}" ${l.buy.ok?"":"disabled"} title="${esc(l.buy.ok?`Pay ${priceText({cost:l.price})} from your Çredits`:l.buy.why)}">Buy</button></td></tr>
      <tr class="cat-detail" ${open===l.id?"":"hidden"}><td colspan="${cols}">${det.length?det.map(t=>`<p>${esc(t)}</p>`).join(""):"<p>No notes in the catalog.</p>"}</td></tr>`;
    }).join("") + `</tbody></table>`;
}
function catalogStatusHtml(ch, kind){
  const { list, total } = catalogMatches(ch, kind);
  return `Showing <b>${list.length}</b> of ${total} · You have <b>${(Number(ch.trackers.credits.current)||0).toLocaleString("en-US")}Ç</b>`;
}
function catalogPickerHtml(ch, kind){
  const st = S.loPick;
  const opt = (v,l,sel)=>`<option value="${esc(v)}" ${sel?"selected":""}>${esc(l)}</option>`;
  return `<div class="spell-pick cat-pick"><div class="pick-head"><div class="hitrow">
      <input type="search" data-catq value="${esc(st.q)}" placeholder="${kind==="gear"?"Search name, notes, spell":"Search name, tags, skill"}" aria-label="Search the catalog">
      <select data-catf="group" aria-label="Section">${opt("",kind==="armor"?"Every kind":"Every section",!st.group)}${catalogGroups(kind).map(g=>opt(g.id,g.label,st.group===g.id)).join("")}</select>
      <select data-catf="sort" aria-label="Sort">${CATALOG_SORTS[kind].map(([v,l])=>opt(v,l,(st.sort||"book")===v)).join("")}</select>
      <label class="check"><input type="checkbox" data-catafford ${st.afford?"checked":""}> What I can afford</label>
    </div><p class="pick-status" data-catstatus aria-live="polite">${catalogStatusHtml(ch, kind)}</p></div>
    <div data-catresults>${catalogResultsHtml(ch, kind)}</div></div>`;
}
function loadoutAddHtml(kind){
  const what = { armor:"armor", weapons:"weapons", gear:"equipment" }[kind];
  return `<div class="lo-add">
    <button class="btn sm primary" data-lobrowse="${kind}">Browse the ${what} catalog</button>
    ${kind==="gear" ? `<button class="btn sm" data-rowadd="gear">+ Your own</button>`
      : `<button class="btn sm" data-locustom="${kind}">+ Custom ${kind==="armor"?"armor":"weapon"}</button>`}</div>`;
}
// ── Gear (W17 + W27, Decision 121) ───────────────────────────────────
// Catalog rows count what you carry: a consumable says how many and takes
// one off with Use one; a charged Talisman shows its charges; an inscribed
// object names the spell it holds, from the book when the book has it. Your
// own rows are the typed table they always were.
function gearRowsHtml(ch){
  const lines = (ch.gear||[]).map((e,i)=>Engine.gearLine(ch,i)).filter(Boolean);
  const cat = lines.filter(l=>!l.custom), own = lines.filter(l=>l.custom);
  let h = "";
  if (cat.length) h += `<div class="lo-gear">` + cat.map(l=>{
    if (l.missing) return `<div class="lo-gear-row"><div class="lo-gear-name"><b>${esc(l.name)}</b> <span class="chip pain">no longer in the game data</span></div>
      <div class="lo-gear-ctl"></div><input type="text" data-lonote="gear|${l.index}" value="${esc(l.notes)}" aria-label="notes">
      <button class="x" data-lorm="gear|${l.index}" title="Remove">✕</button></div>`;
    const sub = [l.categoryName, l.material, l.action?`${l.action} Action`:null, l.itemNotes].filter(Boolean);
    const count = l.charges
      ? `<span class="gear-count${l.charges.left?"":" empty"}">${l.charges.left}<small>/${l.charges.max} charges</small></span>
         <button class="btn sm" data-gearcharge="${l.index}" ${l.charges.left?"":"disabled"}>Use a charge</button>
         <button class="btn sm" data-gearrecharge="${l.index}" ${l.charges.used?"":"disabled"}>Recharged</button>`
      : l.consumable
      ? `<span class="gear-count">×${l.qty}${l.unit?` <small>${esc(l.unit)}${l.qty===1?"":"s"}</small>`:""}</span>
         <button class="btn sm" data-gearuse="${l.index}">Use one</button><button class="btn sm" data-gearplus="${l.index}" aria-label="One more ${esc(l.name)}">+1</button>`
      : l.qty>1 ? `<span class="gear-count">×${l.qty}</span>` : "";
    const spell = l.spell ? `<div class="lo-sub">Holds <b>${esc(l.spell.name)}</b> (${esc(tnth(l.spell))}): ${esc(l.spell.effect)}</div>`
                : l.spellName ? `<div class="lo-sub">Holds ${esc(l.spellName)}</div>` : "";
    return `<div class="lo-gear-row"><div class="lo-gear-name"><b>${esc(l.name)}</b><div class="lo-sub">${esc(sub.join(" · "))}</div>${spell}</div>
      <div class="lo-gear-ctl">${count}</div>
      <input type="text" data-lonote="gear|${l.index}" value="${esc(l.notes)}" placeholder="notes" aria-label="${esc(l.name)} notes">
      <button class="x" data-lorm="gear|${l.index}" title="Remove" aria-label="Remove ${esc(l.name)}">✕</button></div>`;
  }).join("") + `</div>`;
  if (own.length){
    h += `<div class="lo-scroll"><table class="edit"><thead><tr>${GEAR_COLS.map(c=>`<th>${esc(c)}</th>`).join("")}<th></th></tr></thead><tbody>` +
      own.map(l=>{ const r=ch.gear[l.index];
        return `<tr>` + GEAR_COLS.map(c=>`<td><input type="text" data-cell="gear|${l.index}|${esc(c)}" value="${esc(r[c]||"")}" aria-label="${esc(c)}"></td>`).join("") +
          `<td class="rm"><button class="x" data-rowdel="gear|${l.index}" title="remove row">✕</button></td></tr>`; }).join("") + `</tbody></table></div>`;
  }
  if (!lines.length) h += `<p class="step-note">Nothing carried yet.</p>`;
  return h + loadoutAddHtml("gear");
}
// W16: the magazine, where a weapon line is drawn (Loadout and Main). One
// button per rate of fire the weapon has, each spending that mode's rounds
// (053), and Reload. A weapon whose capacity doesn't read shows it as text.
function roundsHtml(l, capacityText){
  const r=l.rounds;
  if (!r) return esc(capacityText||"—");
  const modes = l.fireModes && l.fireModes.length ? l.fireModes : [{ id:"", name:"Fire", rounds:1 }];
  return `<span class="rounds${r.left===0?" empty":""}" title="Rounds left of ${r.max}">${r.left}<small>/${r.max}</small></span>
    <span class="fire">${modes.map(f=>`<button class="btn sm" data-fire="${l.index}|${esc(f.id)}" ${r.left<f.rounds?"disabled":""}
      aria-label="Fire ${esc(f.name)}, ${f.rounds} round${f.rounds===1?"":"s"}" title="${esc(f.name)}: ${f.rounds} round${f.rounds===1?"":"s"}">${esc(f.id||"−1")}</button>`).join("")}
    <button class="btn sm" data-reload="${l.index}" ${r.spent?"":"disabled"}>Reload</button></span>`;
}
// A sight's ACC is for aimed shots, and a Scope's only at range (Gear), so
// they're listed apart from Single's ACC rather than summed into it.
const aimedHtml = l => (l.aimed||[]).map(a=>`<div class="lo-sub">Aimed${a.when?` ${esc(a.when)}`:""}: +${a.acc} ACC (${esc(a.by.join(", "))}${
  a.instead&&a.instead.length?`, instead of ${esc(a.instead.join(", "))}`:""})</div>`).join("");
function weaponModsHtml(ch, l){
  const u = Engine.weaponModOptions(ch, l.index);
  if (!u || (!u.slots && !l.mods.length)) return "";
  const chips = l.mods.map((m,at)=>`<span class="cond-chip" title="${esc(m.description)}"><b>${esc(m.id)}</b>
    <button class="x" data-wmodrm="${l.index}|${at}" aria-label="Remove ${esc(m.id)}" title="Remove">✕</button></span>`).join("");
  const flagged = (D.weaponModGlossary||[]).filter(g=>g.flagged && l.mods.some(m=>m.id===g.id));
  return `<div class="lo-upgrades"><span class="lo-sub">Mods · ${u.free} of ${u.slots} slot${u.slots===1?"":"s"} free</span>${chips}
    ${u.free?`<select data-wmodpick="${l.index}" aria-label="Mod for ${esc(l.name)}"><option value="">Install a mod…</option>${
      u.options.map(o=>`<option value="${esc(o.id)}" ${o.ok?"":"disabled"} title="${esc(o.why||o.description)}">${esc(o.id)} (${o.slots} slot${o.slots===1?"":"s"})${o.ok?"":" — "+esc(o.why)}</option>`).join("")}</select>
    <button class="btn sm" data-wmodadd="${l.index}">Install</button>`:""}</div>${flagged.map(flagHtml).join("")}`;
}
function weaponRowsHtml(ch){
  const lines = ch.weapons.map((e,i)=>Engine.weaponLine(ch,i)).filter(Boolean);
  const cat = lines.filter(l=>!l.custom), custom = lines.filter(l=>l.custom);
  let h = "";
  if (cat.length){
    h += `<div class="lo-scroll"><table class="ref lo-weapons"><thead><tr><th>Weapon</th><th>Attack</th><th>Damage</th><th>Range</th><th>RoF</th><th>Cap.</th><th>Notes</th><th></th></tr></thead><tbody>` +
      cat.map(l=>{
        if (l.missing) return `<tr><td><b>${esc(l.name)}</b> <span class="chip pain">no longer in the game data</span></td><td colspan="5"></td>
          <td><input type="text" data-lonote="weapons|${l.index}" value="${esc(l.notes)}" aria-label="notes"></td>
          <td class="rm"><button class="x" data-lorm="weapons|${l.index}" title="Remove">✕</button></td></tr>`;
        const sub = [l.skill&&l.skill.name, l.style, l.damageType && l.damageType!=="Normal" ? l.damageType : null, ...l.tags].filter(Boolean);
        const range = [l.reach ? `Reach ${l.reach}` : l.range, l.parry ? `Parry ${l.parry}` : null].filter(Boolean).join(" · ");
        const mods = weaponModsHtml(ch, l);
        return `<tr><td><b>${esc(l.name)}</b><div class="lo-sub">${esc(sub.join(" · "))}</div></td>
          <td class="num">${attackText(l.attack)}${l.acc?`<div class="lo-sub">+${l.acc} ACC on Single</div>`:""}${aimedHtml(l)}</td>
          <td class="num">${l.damage!=null?l.damage:esc(l.damageFormula||"—")}${l.damage!=null&&l.damageFormula?`<div class="lo-sub">${esc(l.damageFormula)}</div>`:""}${
            l.damageBonus?`<div class="lo-sub">+${l.damageBonus} from mods</div>`:""}</td>
          <td>${esc(range||"—")}</td><td class="num">${esc(l.rof||"—")}</td><td class="num lo-rounds">${roundsHtml(l, l.capacity)}</td>
          <td><input type="text" data-lonote="weapons|${l.index}" value="${esc(l.notes)}" aria-label="notes"></td>
          <td class="rm"><button class="x" data-lorm="weapons|${l.index}" title="Remove">✕</button></td></tr>${
          mods?`<tr class="lo-modrow"><td colspan="8">${mods}</td></tr>`:""}`;
      }).join("") + `</tbody></table></div>`;
    const pain = Engine.painState(ch);
    h += `<p class="step-note">Attack is 1d10 + the weapon's skill${pain.level?", with Pain and Conditions already in it":""}. Single fire adds the weapon's ACC.</p>`;
  }
  if (custom.length){
    h += `<div class="lo-scroll"><table class="edit"><thead><tr>${WEAPON_COLS.map(c=>`<th>${esc(c)}</th>`).join("")}<th>rounds</th><th></th></tr></thead><tbody>` +
      custom.map(l=>{ const r=ch.weapons[l.index];
        return `<tr>` + WEAPON_COLS.map(c=>`<td><input type="text" data-cell="weapons|${l.index}|${esc(c)}" value="${esc(r[c]||"")}" aria-label="${esc(c)}"></td>`).join("") +
          `<td class="num lo-rounds">${roundsHtml(l, "")}</td><td class="rm"><button class="x" data-lorm="weapons|${l.index}" title="Remove">✕</button></td></tr>`; }).join("") + `</tbody></table></div>`;
  }
  if (!lines.length) h += `<p class="step-note">Nothing carried yet.</p>`;
  return h + loadoutAddHtml("weapons");
}
const intBar = p => {
  const pct = p.integrityMax>0 ? Math.round(100*p.integrity/p.integrityMax) : 0;
  return `<div class="bar ${p.integrity<=0?"bad":pct<=50?"warn":""}"><i style="width:${pct}%"></i></div>
    <span class="lo-int">${p.integrity} / ${p.integrityMax} Integrity</span>${
    p.scrapped?' <span class="chip pain">scrap</span>':p.compromised?' <span class="chip pain">Compromised</span>':""}`;
};
function armorStatLine(p){
  const R = D.armorRules||{};
  const res = p.resAgainst.map(titleCase).join(", ");
  return `PROT ${esc(p.prot||"—")} · RES +${p.res}${res?` (${esc(res)})`:""} · ${esc((R.coverageNames||{})[p.coverageName]||titleCase(p.coverageName))}`;
}
function armorRowHtml(ch, p){
  const R = D.armorRules||{}, e = ch.armor[p.index], body = p.slot==="body";
  const slotName = (R.slotNames||{})[p.slot]||titleCase(p.slot);
  let h = `<div class="lo-armor${p.worn?" worn":""}"><div class="lo-armor-head">
    <label class="check"><input type="checkbox" data-worn="${p.index}" ${p.worn?"checked":""}> Worn</label>
    <b>${esc(p.name)}</b> <span class="chip">${esc(slotName)}</span>
    ${p.missing?'<span class="chip pain">no longer in the game data</span>':""}
    <button class="x" data-lorm="armor|${p.index}" title="Remove" aria-label="Remove ${esc(p.name)}">✕</button></div>`;
  if (p.custom){
    const f=(k,label,type)=>`<label class="field"><span>${label}</span><input type="${type}" ${type==="number"?'min="0"':""} data-armorfield="${p.index}|${k}" value="${esc(e[k]==null?"":e[k])}"></label>`;
    h += `<div class="hitrow">${f("name","Name","text")}${f("prot","PROT die","text")}${f("res","RES","number")}${f("integrity","Integrity","number")}
      <label class="field"><span>Coverage</span><select data-armorfield="${p.index}|coverage">${Object.keys(R.coverageLocations||{}).map(c=>
        `<option value="${esc(c)}" ${(e.coverage||R.defaultCoverage)===c?"selected":""}>${esc((R.coverageNames||{})[c]||c)}</option>`).join("")}</select></label></div>`;
  }
  if (body){
    h += `<div class="lo-armor-stats"><span class="hitarmor">${armorStatLine(p)}</span></div>
      <div class="lo-armor-int">${intBar(p)}</div>`;
  }
  if (p.features.length) h += `<p class="lo-sub">Built in: ${p.features.map(f=>{
    const g=(D.armorFeatureGlossary||[]).find(x=>x.id===f)||(D.armorUpgradeGlossary||[]).find(x=>x.id===f);
    return `<span title="${esc(g?g.description:"")}">${esc(f)}</span>`; }).join(" · ")}</p>`;
  if (body){
    const u = Engine.upgradeOptions(ch, p.index);
    const chips = p.upgrades.map((id,at)=>{ const g=(D.armorUpgradeGlossary||[]).find(x=>x.id===id);
      return `<span class="cond-chip" title="${esc(g?g.description:"")}"><b>${esc(id)}</b>
        <button class="x" data-upgrm="${p.index}|${at}" aria-label="Remove ${esc(id)}" title="Remove">✕</button></span>`; }).join("");
    const slotsTxt = u.slots==null ? "" : u.slots ? ` · ${u.free} of ${u.slots} mod slot${u.slots===1?"":"s"} free` : " · no mod slots";
    h += `<div class="lo-upgrades"><span class="lo-sub">Upgrades${slotsTxt}</span>${chips}
      ${u.slots!==0?`<select data-upgpick="${p.index}" aria-label="Upgrade"><option value="">Install an upgrade…</option>${
        u.options.map(o=>`<option value="${esc(o.id)}" ${o.ok?"":"disabled"} title="${esc(o.why||o.description)}">${esc(o.id)}${o.ok?"":" — "+esc(o.why)}</option>`).join("")}</select>
      <button class="btn sm" data-upgadd="${p.index}">Install</button>`:""}</div>`;
    const canRepair = !p.scrapped && p.integrityLoss>0, frk = Engine.carriedGear(ch, "field-repair-kit");
    h += `<div class="hitrow lo-repair">
      <label class="field"><span>Repair kit (${esc(R.repairKitDie||"1d6")})</span><input type="number" min="1" data-repairroll="${p.index}" ${canRepair?"":"disabled"}></label>
      <button class="btn sm" data-repairkit="${p.index}" ${canRepair?"":"disabled"}>Field Repair Kit${frk?` (1 of your ${frk.qty})`:""}</button>
      <button class="btn sm" data-repairfull="${p.index}" ${canRepair?"":"disabled"}>Armorer: full repair</button>
      <span class="hitnote">${esc(p.scrapped ? R.scrapNote : p.features.includes("Rapid Repair") ? "Rapid Repair: the kit is an Action here, not an hour." : R.repairKitNote)}</span></div>`;
  }
  h += `<label class="field lo-notes"><span>Notes</span><input type="text" data-lonote="armor|${p.index}" value="${esc(e.notes||"")}"></label></div>`;
  return h;
}
// Natural Armor (Decision 104) as one line: what's always on, and each
// conditional source stated, never summed. Empty when a character has none.
function naturalArmorText(ch){
  const n=Engine.naturalArmor(ch);
  if (!(n.base>0) && !n.conditional.length) return "";
  const when=n.conditional.map(c=>`${c.name} ${c.amount?`+${c.amount}`:`answers ${c.resAgainst.map(titleCase).join(", ")}`} ${c.while}`);
  return [`Natural Armor ${n.base}`, ...when].join(" · ");
}
function armorRowsHtml(ch){
  const as = Engine.armorState(ch), nat = naturalArmorText(ch);
  let h = as.problems.map(p=>`<p class="hitnote">${esc(p)}</p>`).join("");
  if (nat) h += `<p class="hitarmor">${esc(nat)}</p>`;
  h += as.pieces.map(p=>armorRowHtml(ch, p)).join("") || `<p class="step-note">No armor yet.</p>`;
  return h + loadoutAddHtml("armor");
}

// ── Grimoire (Decision 108) ──────────────────────────────────────────
// Book spells read everything from `spells`; your own spells are the typed
// columns. The picker shows a spell's numbers before you add it (W4's lesson),
// and S.spellPick keeps its search across re-renders. Since Decision 111 the
// picker is a modal the sheet and the wizard share; only the button on each
// result and the status line differ (spellPickMode).
const tnth = l => `TN ${l.tn==null?"—":l.tn} · TH ${l.th==null?"—":l.th}`;
function spellMatches(g){
  const q = (S.spellPick||{}).q || "", tier = (S.spellPick||{}).tier || "", dom = (S.spellPick||{}).domain || "";
  const k = q.toLowerCase().trim();
  return (D.spells||[]).filter(s=>(!tier || s.tier===tier) && (!dom || s.domain===dom) &&
    (!k || [s.name, s.glyph, s.effect, (s.tags||[]).join(" ")].join(" ").toLowerCase().includes(k)));
}
// The two places the picker opens. `action` is each result's button, and,
// when that button can't act, the reason, which the row shows as text (W24:
// a tooltip never reaches a touch screen). `status` is the line under the
// title that keeps the count and the cap in view.
const spellPickMode = {
  sheet: {
    title: "Add from the book",
    status: ch => { const p = Engine.grimoire(ch).pool;
      return p ? `Your pool is ${p.rank}d10 (${esc(p.discipline)} ${p.rank}). You can learn any spell; one marked Beyond your pool needs an exploding 10.` : ""; },
    action: (ch, s, g) => {
      // A book spell you've already typed as your own links that row, not a copy.
      const yours = g.lines.find(l=>l.custom && l.match && l.match.id===s.id);
      if (yours) return { btn: `<button class="btn sm" data-spelllink="${yours.index}" title="You typed this one in yourself. Link that row to the book, keeping your notes">Link yours</button>` };
      if ((g.held||[]).includes(s.id)) return { btn: `<button class="btn sm" data-spelladd="${esc(s.id)}" disabled>Known</button>`, why: "Already in your Grimoire." };
      return { btn: `<button class="btn sm" data-spelladd="${esc(s.id)}">Add</button>` };
    }
  },
  wizard: {
    title: "Choose starting spells",
    status: ch => { const st = Engine.startingSpells(ch); if (!st) return "";
      return `Chosen <b>${st.have}</b>${st.count==null?"":` of <b>${st.count}</b>`} · TH up to ${st.cap} (${esc(st.discipline)} ${st.cap})`; },
    action: (ch, s, g) => {
      const mine = g.lines.find(l=>!l.custom && l.id===s.id);
      if (mine) return { btn: `<button class="btn sm" data-startrm="${mine.index}" title="Take it back off your list">Remove</button>` };
      const c = Engine.canAddStartingSpell(ch, s.id);
      const label = c.ok ? "Choose" : c.needs ? `Needs ${esc(Engine.startingSpells(ch).discipline)} ${c.needs}` : "Choose";
      return { btn: `<button class="btn sm" data-startadd="${esc(s.id)}" ${c.ok?"":"disabled"}>${label}</button>`, why: c.ok ? "" : c.why };
    }
  }
};
// W23: the whole row acts, so a row whose button can't is dimmed (`off`)
// rather than just its button.
function spellResultsHtml(ch, mode){
  const g = Engine.grimoire(ch), M = spellPickMode[mode], list = spellMatches(g), pool = g.pool;
  const tierName = id => ((D.spellTiers||[]).find(t=>t.id===id)||{name:id}).name;
  const domName = id => ((D.domains||[]).find(d=>d.id===id)||{name:id}).name;
  if (!list.length) return `<p class="step-note">No spell in the book matches that.</p>`;
  return `<table class="ref spell-results"><tbody>` + list.map(s=>{ const a = M.action(ch, s, g);
    return `<tr class="${a.why?"off":"pickrow"}">
      <td><b>${esc(s.name)}</b><div class="sub">${esc(tierName(s.tier))} · ${esc(domName(s.domain))} / ${esc(s.glyph||"")}</div>${a.why?`<div class="why">${esc(a.why)}</div>`:""}</td>
      <td class="num">${esc(tnth(s))}${mode==="sheet" && pool && typeof s.th==="number" && s.th>pool.rank?`<div class="beyond" title="${esc(pool.text)}">Beyond your pool</div>`:""}</td>
      <td>${esc(s.range||"")}</td><td>${esc(s.effect||"")}</td>
      <td>${a.btn}</td></tr>`; }).join("") + `</tbody></table>`;
}
// The modal's body: filters and the status line, which stay in view while the
// results scroll (W25), then the results.
function spellPickerHtml(ch, mode){
  const st = S.spellPick || (S.spellPick = { q:"", tier:"", domain:"" });
  const opt = (v,l,sel)=>`<option value="${esc(v)}" ${sel?"selected":""}>${esc(l)}</option>`;
  return `<div class="spell-pick"><div class="pick-head"><div class="hitrow">
      <input type="search" data-spellq value="${esc(st.q)}" placeholder="Search name, Glyph, effect" aria-label="Search the book">
      <select data-spellf="tier" aria-label="Tier">${opt("","Every tier",!st.tier)}${(D.spellTiers||[]).map(t=>opt(t.id,t.name,st.tier===t.id)).join("")}</select>
      <select data-spellf="domain" aria-label="Domain">${opt("","Every Domain",!st.domain)}${(D.domains||[]).map(d=>opt(d.id,d.name,st.domain===d.id)).join("")}</select>
    </div><p class="pick-status" data-spellstatus aria-live="polite">${spellPickMode[mode].status(ch)}</p></div>
    <div data-spellresults>${spellResultsHtml(ch, mode)}</div></div>`;
}
// W26 (Ken's pick: a Done button, not staged picks). Every pick is saved as
// it's made, so the footer says so and closes.
const pickerFootHtml = () =>
  `<span class="modal-note">Each pick is kept as you make it.</span><button class="btn primary" data-modalclose>Done</button>`;
function grimoireHtml(ch, p){
  const g = Engine.grimoire(ch), sp = g.spellPower, sa = g.spellAttack, ip = Engine.ipState(ch).available;
  const book = g.lines.filter(l=>!l.custom), own = g.lines.filter(l=>l.custom);
  let h = sp ? `<p class="grim-sp" title="${esc(sp.text)}">Spell Power <b>${sp.value}</b> <span class="sub">${esc(sp.discipline)} ${sp.rank} + ${esc(sp.stat)} ${sp.statValue}</span></p>` : "";
  if (sa) h += `<p class="grim-sp" title="${esc(sa.text)}">Spell Attack <b>${sa.value}</b> <span class="sub">${esc(sa.discipline)} ${sa.rank}${sa.parts.map(x=>` + ${esc(x.stat)} ${x.value}`).join("")}</span></p>`;

  // From the book
  h += book.length ? book.map(l=>{
    if (l.missing) return `<div class="spell missing"><b>${esc(l.spellId)}</b> isn't in the book any more.
      <button class="x" data-spellrm="${l.index}" aria-label="Remove">✕</button></div>`;
    const ov = l.overflow ? Object.entries(l.overflow).map(([k,v])=>`<li><b>${esc(k)}</b> ${esc(v)}</li>`).join("") : "";
    return `<details class="spell${l.mastered?" mastered":""}"><summary>
        <b>${esc(l.name)}</b>${l.mastered?` <span class="chip">Mastered</span>`:""}
        <span class="sub">${esc(l.tier)} · ${esc(l.domain)} / ${esc(l.glyph||"")}</span>
        <span class="num">${esc(tnth(l))}${l.noRoll?" · no roll":""}</span>${l.beyondPool?`<span class="beyond" title="${esc(g.pool.text)}">Beyond your pool</span>`:""}
        <span class="eff">${esc(l.effect||"")}</span></summary>
      <div class="spell-body">
        ${l.flavorLine?`<p class="flavor">${esc(l.flavorLine)}</p>`:""}
        <p>${[l.range&&`Range ${l.range}`, l.spellType, l.target&&`Target: ${l.target}`, l.defending&&`Defending: ${l.defending}`].filter(Boolean).map(esc).join(" · ")}</p>
        ${l.spellNotes?`<p>${esc(l.spellNotes)}</p>`:""}
        ${ov?`<ul class="overflow">${ov}</ul>`:""}
        ${l.tags.length?`<p class="sub">Tags: ${l.tags.map(esc).join(", ")}</p>`:""}
        <input type="text" class="cond-note" data-spellnote="${l.index}" value="${esc(l.notes)}" placeholder="notes: who taught it, how it behaves for you" aria-label="${esc(l.name)} notes">
        <div class="trk-actions">
          ${l.masteryCost!=null?`<button class="btn sm" data-spellmaster="${esc(l.id)}" ${ip<l.masteryCost?"disabled":""} title="${esc(g.masteryText)}">Master (${l.masteryCost} IP)</button>`:""}
          <button class="btn sm danger" data-spellrm="${l.index}">Remove</button></div></div></details>`;
  }).join("") : `<p class="step-note">No spells from the book yet.</p>`;

  // Add from the book (a modal since Decision 111)
  h += `<button class="btn sm" data-spellpickopen="sheet">+ Add from the book</button>`;

  // Your own
  h += `<div class="subsect">Your own spells</div>`;
  if (own.length){
    const cols = p.columns||[];
    h += `<table class="edit"><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join("")}<th></th></tr></thead><tbody>` +
      own.map(l=>`<tr>${cols.map(c=>`<td><input type="text" data-cell="${esc(p.id)}|${l.index}|${esc(c)}" value="${esc(l.row[c]||"")}" aria-label="${esc(c)}"></td>`).join("")}
        <td class="rm">${l.match?`<button class="btn sm" data-spelllink="${l.index}" title="Swap this row for the book's ${esc(l.match.name)}, keeping your notes">Link to the book</button>`:""}
          <button class="x" data-spellrm="${l.index}" title="remove row">✕</button></td></tr>`).join("") + `</tbody></table>`;
  }
  h += `<button class="btn sm" data-spellown="1">+ Add your own</button>
    <p class="step-note">Improvised spells and ones your GM agreed to. The book's numbers don't apply to these.</p>`;
  return h;
}

// ── Sheet: loadout & powers ──────────────────────────────────────────
function renderShLoadout(){
  const ch=S.ch;
  const head = sheetHeader("Loadout & Powers", "Weapons, armor, gear, and whatever your archetype carries that the rest of the city can't.");
  // W5: a jump to each section, from the sections this page drew. Anchors
  // and scroll rather than sub-tabs, so print and Ctrl-F see the whole page.
  const secs = sectionList("lo");
  let h = secs.sect("Weapons") + weaponRowsHtml(ch);
  h += secs.sect("Armor") + armorRowsHtml(ch);
  h += secs.sect("Gear") + gearRowsHtml(ch);

  // Archetype panels: rankedList / table / grimoire / focusedSkills /
  // specializationText / toggle
  for (const p of Engine.archPanels(ch)){
    if (p.type==="tracker") continue; // lives in Trackers
    if (p.type==="reference") continue; // lives on the Archetype tab
    h += secs.sect(p.title);
    if (p.type==="rankedList"){
      const ranks = Engine.disciplineRanks(ch);
      if (ranks.length){
        h += `<table class="ref"><tbody>` + ranks.map(d=>
          `<tr><td>${esc(d.name)}</td><td class="num">rank ${d.rank}</td>
           <td style="font-size:.76rem;color:var(--dim)">${esc(d.description||"")}</td></tr>`).join("") + `</tbody></table>
          <p class="step-note">${esc(copy("ranksAdvanceInPlay"))}</p>`;
      } else h += `<p class="step-note">Nothing here yet.</p>`;
    }
    if (p.type==="table") h += editTable(panelRows(ch, p.id), p.columns, p.id, "Add row");
    if (p.type==="grimoire") h += grimoireHtml(ch, p);
    // Decision 134: both read the chosen specialization's data. Nothing here
    // knows which archetype declared them.
    if (p.type==="focusedSkills"){
      const f = Engine.focusedSkillSpec(ch), fp = Engine.focusedPicks(ch);
      const names = Engine.focusedSkillIds(ch).map(id=>(Engine.skillById(id)||{name:id}).name);
      const per = D.ip.skillIncreaseCost.focusedPerRank;
      if (f && f.source.flagged) h += flagHtml(f.source);
      if (names.length) h += `<p class="step-note">${names.map(esc).join(" · ")} — advance at ${per}× current rank.</p>`;
      if (f && f.all) h += `<p class="step-note">Every skill advances at ${per}× current rank up to rank ${esc(f.all.throughRank)}.</p>`;
      if (!names.length && !(f && f.all)) h += `<p class="step-note">None.</p>`;
      if (fp && !fp.complete){
        const more = fp.need - fp.have, cat = esc(Engine.focusedCategoryName(fp.category));
        if (more>0) h += `<p class="step-note">Choose ${more} more ${cat} Skill${more===1?"":"s"} to Focus.</p>`;
        if (fp.invalid.length) h += `<p class="step-note">A pick below can't be a Focused Skill any more. Remove it.</p>`;
        h += focusedPickHtml(ch, "data-fpick");
      }
    }
    if (p.type==="specializationText"){
      const entries = Engine.specializationChosen(ch).map(o=>o[p.field]).filter(x=>x && typeof x==="object");
      h += entries.length ? entries.map(t=>`<div class="pick"><div class="head"><h4>${esc(t.name||"")}</h4></div>
        <div class="desc">${esc(t.description||"")}${(t.benefits||[]).length?"\n• "+t.benefits.map(esc).join("\n• "):""}</div></div>`).join("")
        : `<p class="step-note">No ${esc(p.title||"entry")} on record.</p>`;
    }
    if (p.type==="toggle"){
      const cur = ch.panelData[p.id] || p.options[0];
      h += `<div class="form-toggle">` + p.options.map(o=>
        `<button class="${cur===o?"on":""}" data-ptoggle="${p.id}|${esc(o)}">${esc(o)}</button>`).join("") + `</div>
        <p class="step-note">${esc(copy("applyFromText"))}</p>`;
    }
  }
  return head + jumpBarHtml(secs.list) + h;
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
  // Rows are addressed by position, never by id or notes: both come from the
  // character file, and notes is free text (B16, A11).
  ch.advantages.forEach((a, i)=>{
    const def=Engine.advById(a.id)||{name:a.id};
    h += `<div class="alloc-row"><div class="name">${esc(def.name)}${a.notes==="natural"?' <span class="chip">natural</span>':""} <small>rank ${a.rank}</small></div>
      <div class="admin-steppers">
        <button class="btn sm" data-admin-adv="${i}|-1">−</button>
        <button class="btn sm" data-admin-adv="${i}|1">+</button>
        <button class="btn sm danger" data-admin-adv="${i}|x">remove</button>
      </div><span class="mod"></span></div>`;
  });
  h += `</div>`;
  const addAdv=D.advantages.filter(d=>!ch.advantages.some(a=>a.id===d.id && a.notes!=="natural"));
  if (addAdv.length) h += `<div class="trk"><h4>Add advantage</h4>
    <select data-admin-addadv><option value="">— pick —</option>${addAdv.map(d=>`<option value="${d.id}">${esc(d.name)} (${d.cost} CP)</option>`).join("")}</select>
    <button class="btn sm" data-admin-addadv-go="1">Add</button></div>`;

  // Disadvantages
  h += `<div class="sect">Disadvantages</div><div class="alloc">`;
  if (!ch.disadvantages.length) h += `<p class="step-note">None.</p>`;
  ch.disadvantages.forEach((d, i)=>{
    const def=Engine.disById(d.id)||{name:d.id};
    h += `<div class="alloc-row"><div class="name">${esc(def.name)} <small>rank ${d.rank}</small></div>
      <div class="admin-steppers">
        <button class="btn sm" data-admin-dis="${i}|-1">−</button><button class="btn sm" data-admin-dis="${i}|1">+</button>
        <button class="btn sm danger" data-admin-dis="${i}|x">remove</button>
      </div><span class="mod"></span></div>`;
  });
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

// ── Print view — a universal three-page sheet (Character Info/Stats/Combat/
// Health, full Skills, Weapons/Armor/Gear/Advantages/Disadvantages/Notes),
// styled entirely by print.css. `ch` is optional: present renders live values
// via the engine; absent renders a blank fillable template built from game
// data alone — no character needed, since every label on a blank sheet comes
// from SHADOWS_DATA, not a character. Defense fills from the worn armor
// (Decision 100); its Nat column from Engine.naturalArmor() (Decision 104).
function pLine(v){ return `<span class="p-line">${v==null||v===""?"":esc(v)}</span>`; }
function pField(label, v){ return `<div class="p-field"><span class="p-label">${esc(label)}</span>${pLine(v)}</div>`; }
function pBuildTag(){
  // A small HUD-style build stamp, not the wordmark — the two numbers that
  // actually change when this layout does (APP_VERSION) or a character's
  // available content does (gamedataVersion), same pair the footer shows.
  return `<div class="p-buildtag">app <b>${esc(APP_VERSION)}</b> &middot; data <b>${esc(D.meta.gamedataVersion)}</b></div>`;
}
function pHead(ch, title){
  return `<div class="p-head">
    <div><div class="p-wordmark">Shadows<small>Adventures in NYTE City</small></div>${pBuildTag()}</div>
    <div class="p-name"><span class="p-label">${esc(title)}</span>${pLine(ch && ch.identity.name)}${ch && intakeOf(ch)?`<div class="p-intake">${intakeBarsSvg(intakeOf(ch))}<span>${esc(intakeOf(ch))}</span></div>`:""}</div>
  </div>`;
}
function pStatIcon(id){
  const svg = iconSvg(id);
  return svg ? `<td class="p-staticon">${svg}</td>` : `<td class="p-staticon"></td>`;
}
function pStatsHtml(ch){
  const t = ch ? Engine.statTable(ch) : null;
  let h = `<table class="p-stats"><thead><tr><th></th><th>Stat</th><th>Score</th><th>Bonus</th></tr></thead><tbody>` +
    D.stats.map(s=>{
      const row = t ? t[s.id] : null;
      const mod = row ? (row.mod>=0?"+":"")+row.mod : null;
      return `<tr>${pStatIcon(s.id)}<td>${esc(s.id)}</td><td class="num">${pLine(row&&row.value)}</td><td class="num">${pLine(mod)}</td></tr>`;
    }).join("") + `</tbody></table>`;
  const der = ch ? Engine.derived(ch) : null, luck = ch ? Engine.luckState(ch) : null, san = ch ? Engine.sanState(ch) : null;
  h += `<table class="p-stats"><thead><tr><th></th><th></th><th>Base</th><th>Current</th></tr></thead><tbody>` +
    `<tr>${pStatIcon("WILL")}<td>WILL</td><td class="num">${pLine(der&&der.WILL)}</td><td class="num">${pLine(der&&der.WILL)}</td></tr>` +
    `<tr>${pStatIcon("TOL")}<td>TOL</td><td class="num">${pLine(der&&der.TOL)}</td><td class="num">${pLine(der&&der.TOL)}</td></tr>` +
    `<tr>${pStatIcon("LUCK")}<td>LUCK</td><td class="num">${pLine(luck&&luck.max)}</td><td class="num">${pLine(luck&&luck.current)}</td></tr>` +
    `<tr>${pStatIcon("SAN")}<td>SAN %</td><td class="num">${pLine(san&&san.max)}</td><td class="num">${pLine(san&&san.current)}</td></tr>` +
    `</tbody></table>`;
  return h;
}
function pSkillCellsHtml(ch, category){
  return `<div class="p-cellrow">` + D.skills.filter(s=>s.category===category).map(s=>{
    const line = ch ? Engine.skillLine(ch, s.id) : null;
    const icon = iconSvg(s.primaryStat);
    return `<div class="p-skillcell">${icon?`<span class="p-scicon">${icon}</span>`:""}<span class="p-label">${esc(s.name)}</span>${pLine(line && "1d10+"+line.checkBonus)}</div>`;
  }).join("") + `</div>`;
}
// Which Pain Level band a given HL-lost count falls into — the same lookup
// Engine.painState() does per-character, but by index so the blank ladder
// (no character, no damage) can still show the bands. Thresholds come from
// game data (never hardcoded), so a data edit to the bands moves this too.
function pPainBandFor(hlLost){
  const levels = D.resources.healthLevels.painLevels;
  let lvl = levels[0];
  for (const p of levels) if (hlLost >= p.hlLostThreshold) lvl = p;
  return lvl;
}
function pHealthHtml(ch){
  const hp = ch ? Engine.health(ch) : null;
  // Health Levels cap at 10 regardless of character (Decision 64) — a safe,
  // always-correct box count for the blank template, same as the reference sheet.
  const levels = hp ? hp.levels : 10;
  const hlc = ch ? hlCells(ch) : [];

  // Group consecutive HL indices sharing a Pain Level into bands, so the
  // ladder reads as "these boxes hurt the same" instead of one flat row.
  const bands = [];
  for (let i=0;i<levels;i++){
    const band = pPainBandFor(i);
    const last = bands[bands.length-1];
    if (!last || last.level!==band.level) bands.push({level:band.level, indices:[i]});
    else last.indices.push(i);
  }

  // One row, grouped into bands by a gap + the border-weight/color step
  // already on .p-hl — NOT a labeled row per band, which is what blew the
  // front page past one printed page the first time this was tried.
  let h = `<div class="p-hlbands">` + bands.map(band=>{
    const cells = band.indices.map(i=>{
      const label = i===0 ? "0" : "&minus;"+i;
      if (hp){
        const c = hlc[i];
        return `<div class="p-hl${c.gone?" gone":""}${c.massive?" massive":""}"><b>${label}</b>${c.massive?"&times;":c.gone?"&mdash;":c.left+"/"+hp.hpPer}</div>`;
      }
      return `<div class="p-hl"><b>${label}</b>${pLine(null)}</div>`;
    }).join("");
    return `<div class="p-hlband p-pain-${band.level}">${cells}</div>`;
  }).join("") + `</div>`;

  h += `<div class="p-fieldrow">${pField("Health Levels", hp&&hp.levels)}${pField("Total HP", hp&&hp.total)}${pField("Current HP", hp?Engine.hlState(ch).hpLeft:null)}</div>`;
  const pain = ch ? Engine.painState(ch) : null;
  h += pain && pain.level>0
    ? `<p class="p-note">${esc(pain.label)} — ${esc(pain.description)}</p>`
    : `<p class="p-note">Border weight marks the Pain Level band (thresholds at 2, 5, 8 HL lost).</p>`;
  return h;
}
// Conditions (Decision 95): the whole catalog as a tick list, so a paper
// player can mark what they have. Filled prints tick the active ones and name
// the body part. Death Marks get their own boxes — a counter, not a tick.
function pConditionsHtml(ch){
  const st = ch ? Engine.conditionState(ch) : null;
  const box = on => `<span class="p-box${on?" on":""}"></span>`;
  const row = c => {
    const hits = st ? st.active.filter(a=>a.id===c.id) : [];
    const where = c.location ? hits.map(a=>a.locationName).join(", ") : null;
    let marks = "";
    if (c.counter){
      const n = hits.length ? (hits[0].marks||0) : 0;
      marks = `<span class="p-counter"><span class="p-label">${esc(c.counter.label)}</span>`;
      for (let i=1;i<=c.counter.max;i++) marks += box(i<=n);
      marks += `</span>`;
    }
    return `<li>${box(hits.length)}<span>${esc(c.name)}</span>${where!=null?pLine(where):""}${marks}</li>`;
  };
  // A body part or a counter needs a full-width row — a paper player writes
  // "left arm" in pen, and Death Marks are boxes, not a tick.
  const wide = c => c.location || c.counter;
  return `<ul class="p-condlist">${D.conditions.filter(c=>!wide(c)).map(row).join("")}</ul>`
       + `<ul class="p-condlist p-condloc">${D.conditions.filter(wide).map(row).join("")}</ul>`;
}
// Filled from the worn body piece (Decision 100): each location it covers
// gets its RES, current Integrity and PROT die. Nat is the always-on
// Natural Armor on every location (Decision 104; Iron Shirt and the like are
// conditional, so they aren't printed as a number). The front page is
// full (Decision 96), so this fills the card's blanks and adds no rows.
function pDefenseHtml(ch){
  const as = ch ? Engine.armorState(ch) : null, w = as && as.worn;
  const nat = ch ? Engine.naturalArmor(ch).base : 0;
  const locs = [["head","Head"],["torso","Torso"],["right-arm","R Arm"],["left-arm","L Arm"],["right-leg","R Leg"],["left-leg","L Leg"]];
  let h = `<table class="p-table"><thead><tr><th>Location</th><th>Res</th><th>Int</th><th>Nat</th><th>Prot</th></tr></thead><tbody>` +
    locs.map(([id,l])=>{ const on = w && w.coverage.includes(id);
      return `<tr><td>${esc(l)}</td><td class="num">${pLine(on?"+"+w.res:null)}</td><td class="num">${pLine(on?w.integrity:null)}</td><td class="num">${pLine(nat>0?nat:null)}</td><td class="num">${pLine(on?w.prot:null)}</td></tr>`;
    }).join("") + `</tbody></table>`;
  const others = as ? as.pieces.filter(p=>p.worn && p.slot!=="body") : [];
  const feats = w ? [...w.features, ...w.upgrades, ...others.flatMap(p=>p.features)] : [];
  h += `<div class="p-fieldrow">${pField("Components", w ? [w.name, ...others.map(p=>p.name)].join(", ") : null)}${
    pField("Features", feats.length ? [...new Set(feats)].join(", ") : null)}${pField("Warding", w && w.resAgainst.includes("magical") ? "Yes" : null)}</div>`;
  return h;
}
// The Loadout page's weapons: a catalog piece prints its computed line, a
// custom one what was typed.
function pWeaponRows(ch){
  if (!ch) return [];
  return ch.weapons.map((e,i)=>Engine.weaponLine(ch,i)).filter(Boolean).map(l=>{
    if (l.custom){ const w=ch.weapons[l.index];
      return { name:[w.name,w.type].filter(Boolean).join(" · "), attack:"", damage:w.damage, range:"", rof:w.rof,
               capacity:[w.capacity, w.ammo?`(${w.ammo})`:""].filter(Boolean).join(" "), features:w.features, notes:w.notes }; }
    return { name:l.name, attack:l.attack==null?"":"1d10+"+l.attack+(l.acc?` (+${l.acc} ACC)`:""),
             damage: l.damage!=null ? String(l.damage)+(l.damageFormula?` (${l.damageFormula})`:"") : (l.damageFormula||""),
             range: l.reach ? `Reach ${l.reach}` : (l.range||""), rof:l.rof||"", capacity:l.capacity||"",
             features:[...(l.tags||[]), ...(l.features||[]), ...(l.mods||[]).map(m=>m.id)].join(", "), notes:l.notes };
  });
}
// Gear on paper: a catalog row prints its count or charges as its type.
function pGearRows(ch){
  return (ch.gear||[]).map((e,i)=>Engine.gearLine(ch,i)).filter(Boolean).map(l=>l.custom ? ch.gear[l.index]
    : { name:l.name, type:[l.categoryName, l.charges?`${l.charges.left}/${l.charges.max} charges`:l.qty>1||l.consumable?`×${l.qty}`:""].filter(Boolean).join(" · "),
        notes:[l.spellName?`Holds ${l.spellName}`:"", l.notes].filter(Boolean).join(" · ") });
}
function pArmorRows(ch){
  if (!ch) return [];
  const R = D.armorRules||{};
  return Engine.armorState(ch).pieces.map(p=>({ name: p.slot==="body" ? p.name : `${p.name} (${(R.slotNames||{})[p.slot]||p.slot})`,
    prot:p.prot||"", res:p.slot==="body"?"+"+p.res:"",
    integrity:p.slot==="body"?`${p.integrity} / ${p.integrityMax}${p.scrapped?" scrap":p.compromised?" Compromised":""}`:"",
    worn:p.worn?"✓":"" }));
}
function pSkillIcons(s){
  const pri = iconSvg(s.primaryStat), syn = iconSvg(s.synergyStat);
  return `<td class="p-skicons">` +
    (pri ? `<span class="p-skicon" title="${esc(s.primaryStat)}">${pri}</span>` : "") +
    (syn ? `<span class="p-skicon p-skicon-syn" title="${esc(s.synergyStat)}">${syn}</span>` : "") +
    `</td>`;
}
function pSkillRowsHtml(ch, groups){
  return groups.map(g=>{
    const rows = g.skills.map(s=>{
      const line = ch ? Engine.skillLine(ch, s.id) : null;
      const rank = !line ? null : (line.trained ? line.rank : "—");
      const check = line ? "1d10+"+line.checkBonus : null;
      return `<tr><td>${esc(s.name)}</td>${pSkillIcons(s)}<td class="num">${pLine(rank)}</td><td class="num">${pLine(check)}</td><td></td></tr>`;
    }).join("");
    return `<tr class="p-cat"><td colspan="5">${esc(g.cname)}</td></tr>${rows}`;
  }).join("");
}
// Two side-by-side panels instead of one full-width table — a blank
// landscape page mostly wastes width on an empty Notes column otherwise.
// The category/skill split is computed from row counts, not hardcoded, so
// a data-only category addition still balances the two panels.
function pSkillsTableHtml(ch){
  const cats = [["combat","Combat"],["utility","Utility"],["general","General"]];
  const groups = cats.map(([cid,cname])=>({cname, skills:D.skills.filter(s=>s.category===cid)}))
    .filter(g=>g.skills.length);
  const totalRows = groups.reduce((n,g)=>n+g.skills.length+1,0);
  const half = totalRows/2;
  let running=0, left=[], right=[];
  groups.forEach(g=>{
    (running<half ? left : right).push(g);
    running += g.skills.length+1;
  });
  const thead = `<thead><tr><th>Skill</th><th>Stats</th><th>Rank</th><th>Check</th><th>Notes</th></tr></thead>`;
  const table = rows => `<table class="p-table p-skilltable">${thead}<tbody>${rows}</tbody></table>`;
  return `<div class="p-skillcols">${table(pSkillRowsHtml(ch,left))}${table(pSkillRowsHtml(ch,right))}</div>`;
}
function pRowsTableHtml(rows, cols, labels, blankRows){
  const data = rows && rows.length ? rows : Array.from({length:blankRows},()=>({}));
  return `<table class="p-table"><thead><tr>${labels.map(l=>`<th>${esc(l)}</th>`).join("")}</tr></thead><tbody>` +
    data.map(r=>`<tr>${cols.map(c=>`<td>${pLine(r[c])}</td>`).join("")}</tr>`).join("") + `</tbody></table>`;
}
function pTraitsTableHtml(list, lookupFn, label, blankRows){
  const rows = (list && list.length) ? list.map(x=>{
    const d = lookupFn(x.id) || {name:x.id, description:""};
    return `<tr><td>${pLine(d.name)}</td><td class="num">${pLine(x.rank||1)}</td><td>${pLine(d.description)}</td></tr>`;
  }) : Array.from({length:blankRows},()=>`<tr><td>${pLine(null)}</td><td class="num">${pLine(null)}</td><td>${pLine(null)}</td></tr>`);
  return `<table class="p-table"><thead><tr><th>${esc(label)}</th><th>Rank</th><th>Description</th></tr></thead><tbody>${rows.join("")}</tbody></table>`;
}
function pCard(label, bodyHtml, variant){
  return `<div class="p-card${variant?" "+variant:""}"><div class="p-card-head">${esc(label)}</div><div class="p-card-body">${bodyHtml}</div></div>`;
}
function renderPrintView(ch){
  const pl = ch ? Engine.powerLevel(ch) : null, arch = ch ? Engine.archetype(ch) : null;
  const ip = ch ? Engine.ipState(ch) : null, id = ch ? ch.identity : {};

  let p1main = pHead(ch, "Character Sheet");
  p1main += `<div class="p-fieldrow">${pField("Age", id.age)}${pField("Build", id.build)}${pField("Archetype", arch&&arch.name)}${pField("Power Level", pl&&pl.name)}</div>`;
  p1main += `<div class="p-fieldrow">${pField("Hair", id.hair)}${pField("Eyes", id.eyes)}${pField("Skin", id.skin)}${pField("Çredits", ch&&ch.trackers.credits.current)}</div>`;
  p1main += `<div class="p-fieldrow">${pField("IP Available", ip&&ip.available)}${pField("IP Spent", ip&&ip.spent)}</div>`;
  p1main += `<div class="p-frontbody">`;
  p1main += `<div class="p-frontleft">${pCard("Stats", pStatsHtml(ch))}${pCard("Conditions", pConditionsHtml(ch), "magenta p-condcard")}</div>`;
  p1main += `<div class="p-frontright">` +
    pCard("Combat Quick-Ref", pSkillCellsHtml(ch,"combat"), "magenta") +
    pCard("Health Levels", pHealthHtml(ch)) +
    pCard("Defense", pDefenseHtml(ch), "magenta") +
    `</div>`;
  p1main += `</div>`;
  let p1 = `<div class="p-frontpage"><div class="p-tabstrip"><span>Character Sheet — Front</span></div>` +
    `<div class="p-frontmain">${p1main}</div></div>`;

  let p2 = pHead(ch, "Skills");
  p2 += `<div class="p-section">Skills</div>${pSkillsTableHtml(ch)}`;

  let p3 = pHead(ch, "Loadout");
  p3 += `<div class="p-section">Weapons</div>${pRowsTableHtml(pWeaponRows(ch), ["name","attack","damage","range","rof","capacity","features","notes"],
    ["Weapon","Attack","Damage","Range","RoF","Capacity","Features","Notes"], 5)}`;
  // Armor sits beside Gear rather than below it: the blank Loadout page had
  // about 68px spare, and a full-width armor table would spill to a 4th sheet.
  p3 += `<div class="p-cols2"><div><div class="p-section">Gear</div>${pRowsTableHtml(ch&&pGearRows(ch), GEAR_COLS, ["Item","Type","Notes"], 5)}</div>` +
        `<div><div class="p-section">Armor</div>${pRowsTableHtml(pArmorRows(ch), ["name","prot","res","integrity","worn"],
          ["Armor","PROT","RES","Integrity","Worn"], 5)}</div></div>`;
  p3 += `<div class="p-cols2"><div><div class="p-section">Advantages</div>${pTraitsTableHtml(ch&&ch.advantages, Engine.advById, "Advantage", 5)}</div>` +
        `<div><div class="p-section">Disadvantages</div>${pTraitsTableHtml(ch&&ch.disadvantages, Engine.disById, "Disadvantage", 5)}</div></div>`;
  p3 += `<div class="p-section">Notes</div><div class="p-notes small">${ch&&ch.notes?esc(ch.notes):""}</div>`;

  return `<div class="p-page">${p1}</div><div class="p-page">${p2}</div><div class="p-page">${p3}</div>`;
}

const SHEET_RENDER = { main:renderShMain, skills:renderShSkills, traits:renderShTraits,
  archetype:renderShArchetype, trackers:renderShTrackers,
  progression:renderShProgression, sessions:renderShSessions,
  loadout:renderShLoadout, notes:renderShNotes, admin:renderShAdmin };
