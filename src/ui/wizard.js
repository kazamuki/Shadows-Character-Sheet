// Creation wizard: the eight-step intake ledger + rail, and every step's
// renderer. Reads/writes the shared state and helpers declared in shared.js.

// ── Ledger ───────────────────────────────────────────────────────────
// Batch 3a — a passed step with open warnings (e.g. unspent Skill Points) used
// to render the same ✓ as one with nothing left to fix. "done" now means no
// errors AND no warnings; a passed step that still has warnings is its own
// "attn" state, and the callout jumps back to the first one.
function renderLedger(){
  const el = $("ledger");
  if (S.screen==="sheet"){ el.innerHTML=""; return; }   // nav moved to the top tab bar
  if (S.screen!=="wizard"){ el.innerHTML=""; return; }
  let firstAttn = -1, attnCount = 0;
  const rows = STEPS.map((st,i)=>{
    let state = "";
    if (i < S.step){
      const flagged = Engine.validate(st.id,S.ch).some(x=>x.level==="error"||x.level==="warn");
      state = flagged ? "attn" : "done";
      if (flagged){ attnCount++; if (firstAttn<0) firstAttn=i; }
    }
    const icon = state==="attn" ? "!" : state==="done" ? "✓" : st.n;
    const cls = ["step-row", i===S.step?"active":"", state].join(" ");
    const dis = i>S.maxReached ? "disabled":"";
    return `<button class="${cls}" data-goto="${i}" ${dis}><span class="n">${icon}</span>${esc(st.label.split(":")[0].split(" - ")[0])}</button>`;
  }).join("");
  const callout = attnCount ? `<button class="ledger-callout" data-goto="${firstAttn}">
    ⚠ ${attnCount} step${attnCount>1?"s":""} could still use a second look</button>` : "";
  el.innerHTML = `<h2>Intake Ledger</h2>` + rows + callout;
  el.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>{ S.step=Number(b.dataset.goto); update(); });
}

// ── Vitals rail ──────────────────────────────────────────────────────
function renderVitals(){
  const el = $("vitals");
  // The rail is the wizard's live readout only. Once locked, the sheet hides it
  // and uses the horizontal vitals bar (sheetVitalsBar) instead.
  if (!S.ch || S.screen==="sheet"){ el.innerHTML=""; return; }
  const ch=S.ch, pl=Engine.powerLevel(ch), a=Engine.archetype(ch);
  const der=Engine.derived(ch), hp=Engine.health(ch), t=Engine.statTable(ch);
  const locked = ch.creation.locked;
  let h = `<h2>Vitals</h2><div class="vgroup">
    <div class="vname">${esc(ch.identity.name)||"&mdash;"}</div>
    <div class="vsub">${a?esc(a.name):"no archetype"} · ${pl?esc(pl.name):"no power level"}</div></div>`;
  if (pl && !locked){
    const sp=Engine.statPool(ch), kp=Engine.skillPool(ch), cp=Engine.cp(ch);
    h += `<div class="vgroup">`;
    h += vrow("Stat Points", sp.total==null?"roll "+sp.rollDie:(sp.total-Engine.statSpent(ch))+" / "+sp.total, sp.total!=null&&sp.total-Engine.statSpent(ch)<0?"over":"");
    h += vrow("Skill Points", kp.total==null?"roll "+kp.rollDie:(kp.total-Engine.skillSpent(ch))+" / "+kp.total, kp.total!=null&&kp.total-Engine.skillSpent(ch)<0?"over":"");
    h += vrow("Character Pts", cp.left+" / "+cp.budget, cp.left<0?"over":"gold");
    h += `</div>`;
  }
  if (locked){
    // Phase 3 condition readout — current values, computed maxima
    const pain=Engine.painState(ch), luck=Engine.luckState(ch), san=Engine.sanState(ch);
    const ip=Engine.ipState(ch), ms=Engine.milestoneState(ch);
    h += `<div class="vgroup">`;
    h += vrow("HP", pain.hpLeft+" / "+hp.total, pain.down?"over":"hp");
    h += vrow("Pain", pain.down?"DOWN":"Lv "+pain.level+(pain.level?" ("+pain.skillPenalty+" skill)":""), pain.level?"over":"");
    h += vrow("SAN", san.current+" / "+san.max+"%", san.current<=san.max/2?"over":"");
    h += vrow("LUCK", luck.current+" / "+luck.max, luck.current===0?"over":"gold");
    const sfr = Engine.sfr(ch);
    if (sfr && sfr.value!=null) h += vrow("SFR", Math.max(0,sfr.value-(ch.trackers.sfr.spent||0))+" / "+sfr.value);
    h += vrow(CR, ch.trackers.credits.current, "gold");
    h += `</div><div class="vgroup">`;
    h += vrow("IP", ip.available, ip.available<0?"over":"");
    h += vrow("Milestone Pts", ms.mp);
    h += `</div>`;
  }
  h += `<div class="vgroup">` + D.stats.map(s=>{
    const m=t[s.id].mod;
    return vrow(s.id, t[s.id].value+" ("+(m>=0?"+":"")+m+")", "", s.id);
  }).join("") + `</div>`;
  h += `<div class="vgroup">`;
  h += vrow("TOL", der.TOL, "", "TOL") + vrow("WILL", der.WILL, "", "WILL");
  if (!locked){
    h += vrow("SAN", der.SAN+"%", "", "SAN");
    h += vrow("Health", hp.levels+" HL · "+hp.total+" HP","hp");
    h += vrow("LUCK", D.resources.luck.startingValue + ch.trackers.luck.bonus);
    const sfr = Engine.sfr(ch);
    if (sfr && sfr.value!=null) h += vrow("SFR", sfr.value+" · RoU "+sfr.rou);
  }
  h += `</div>`;
  el.innerHTML = h;
}

// ── Wizard-only widgets ──────────────────────────────────────────────
function stepper(val, dataAttr, downOk, upOk){
  return `<div class="stepper">
    <button data-step="${dataAttr}|-1" ${downOk?"":"disabled"} aria-label="decrease">−</button>
    <span class="val">${val}</span>
    <button data-step="${dataAttr}|1" ${upOk?"":"disabled"} aria-label="increase">+</button></div>`;
}
// Batch 3 — the controls for one entry's picks. Rendered off Engine.picksFor,
// which has already resolved how many slots exist and what may go in them, so
// this function knows nothing about ranks, categories or archetypes. Used by
// the Character Points step and the Skills step alike.
function picksHtml(kind, id){
  const states = Engine.picksFor(S.ch, kind, id);
  if (!states.length) return "";
  return states.map(st=>{
    const p = st.pick, key = `${kind}|${id}|${p.id}`;
    if (p.type==="text"){
      return `<div class="picks"><label class="field"><span>${esc(p.label||"Detail")}</span>
        <input type="text" data-sel="${esc(key)}|0" value="${esc(st.chosen)}"
          placeholder="${esc(p.gmApproval?"Settle this with your GM":"")}"></label>
        ${p.note?`<p class="step-note">${esc(p.note)}</p>`:""}</div>`;
    }
    if (!st.need) return "";
    const slots = Array.from({length:st.need}, (_,i)=>{
      const cur = st.chosen[i] || "";
      return `<select data-sel="${esc(key)}|${i}" aria-label="${esc(p.label||"choice")} ${i+1}">
        <option value="">— choose —</option>` +
        st.options.map(o=>`<option value="${esc(o.id)}" ${o.id===cur?"selected":""}>${esc(o.name)}${o.description?" — "+esc(o.description):""}</option>`).join("") +
        `</select>`;
    }).join("");
    return `<div class="picks"><div class="picks-label">${esc(p.label||"Choose")}${st.need>1?` — ${st.filled}/${st.need}`:""}${p.optional?" (optional)":""}</div>
      ${slots}${p.note?`<p class="step-note">${esc(p.note)}</p>`:""}</div>`;
  }).join("");
}
// The lock/gate line for one entry: why a stepper is disabled, in words.
function constraintHtml(kind, id){
  const lock = Engine.optionLock(S.ch, kind, id);
  const req  = Engine.requirementState(S.ch, kind, id);
  let h = "";
  if (lock.locked) h += `<span class="cost" title="${esc(lock.by)}">⛔ locked by ${esc(lock.by)}</span>`;
  if (req.unmet.length) h += `<span class="cost">requires ${esc(req.unmet.join(", "))}</span>`;
  else if (req.met.length) h += `<span class="cost grant">requires ${esc(req.met.join(", "))}</span>`;
  return h;
}
function wizNav(stepId){
  const issues = Engine.validate(stepId, S.ch);
  const blocked = issues.some(i=>i.level==="error");
  const last = S.step===STEPS.length-1;
  return `<div class="wiznav">
    ${S.step>0?`<button class="btn" data-nav="-1">Back</button>`:""}
    ${!last?`<button class="btn primary" data-nav="1" ${blocked?"disabled":""}>Continue</button>`:""}
  </div>${issuesHtml(issues)}`;
}

// ── Step renderers ───────────────────────────────────────────────────
function stepHeader(st){
  return importIssuesHtml() + `<div class="eyebrow">Step ${st.n} of ${STEPS.length}</div>
    <h1 class="step-title">${esc(st.label.split(" - ")[0].split(":")[0])}</h1>
    <p class="step-note">${esc(st.label)}${st.note?` <em>${esc(st.note)}</em>`:""}</p>`;
}

function renderPowerLevel(){
  const ch=S.ch;
  let h = D.powerLevelFlags && D.powerLevelFlags.flagged ? flagHtml(D.powerLevelFlags) : "";
  h += `<div class="cards two">` + D.powerLevels.map(p=>`
    <button class="card ${ch.creation.powerLevel===p.id?"selected":""}" data-pl="${p.id}">
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.description||"")}</p>
      <div class="stat-line">
        <span>Stats <b>${p.statPoints.base}+${p.statPoints.roll}</b></span>
        <span>Skills <b>${p.skillPoints.base}+${p.skillPoints.roll}</b></span>
        <span>CP <b>${p.characterPoints}</b></span>
        <span>Skill cap <b>${p.maxSkillRank}</b></span>
        <span>Power cap <b>${p.maxPowerRank}</b></span>
        <span>Max Boost <b>${p.maxBoost}</b></span>
        <span>${CR} <b>${p.startingCredits.roll}×${p.startingCredits.multiplier}</b></span>
      </div>
    </button>`).join("") + `</div>`;
  return h;
}

function renderConcept(){
  const id=S.ch.identity;
  return `<div class="grid-2">
    <label class="field"><span>Name</span><input type="text" data-id="name" value="${esc(id.name)}"></label>
    <label class="field"><span>Age</span><input type="number" data-id="age" min="0" value="${id.age==null?"":id.age}"></label>
    <label class="field"><span>Build</span><input type="text" data-id="build" value="${esc(id.build)}"></label>
    <label class="field"><span>Hair</span><input type="text" data-id="hair" value="${esc(id.hair)}"></label>
    <label class="field"><span>Eyes</span><input type="text" data-id="eyes" value="${esc(id.eyes)}"></label>
    <label class="field"><span>Skin</span><input type="text" data-id="skin" value="${esc(id.skin)}"></label>
  </div>`;
}

function renderStats(){
  const ch=S.ch, pool=Engine.statPool(ch);
  const left = pool.total==null?0:pool.total-Engine.statSpent(ch);
  let h = `<div class="roll-entry">
    <span class="die">${pool.rollDie}</span>
    <input type="text" inputmode="numeric" pattern="[0-9]*" data-roll="statPoints" value="${pool.roll==null?"":pool.roll}" aria-label="stat point roll">
    <span class="pool">Pool <b>${pool.total==null?"—":pool.total}</b> · Remaining <b>${pool.total==null?"—":left}</b></span>
    <span class="dice-note">Roll your dice at the table and enter the result — the app never rolls for you. Explosions do not happen on creation rolls.</span>
  </div><div class="alloc">`;
  for (const s of D.stats){
    const v = ch.stats[s.id].base, m = Engine.statMod(Engine.statValue(ch,s.id));
    h += `<div class="alloc-row">
      <div class="name">${esc(s.name)} <small>${esc(s.description)}</small></div>
      ${stepper(v, "stat|"+s.id, v>D.statRules.base, v<D.statRules.max && left>0 && pool.total!=null)}
      <span class="mod ${m>0?"pos":m<0?"neg":""}">${m>=0?"+":""}${m}</span>
    </div>`;
  }
  return h + `</div>`;
}

function renderArchetype(){
  const ch=S.ch, ac=ch.archetypeChoices, sel=Engine.archetype(ch);
  let h = `<div class="cards two">` + D.archetypes.map(a=>`
    <button class="card ${ch.identity.archetype===a.id?"selected":""}" data-arch="${a.id}">
      <span class="badge ${a.status}">${esc(statusLabel(a.status))}</span>
      <h3>${esc(a.name)}</h3>
      <div class="sub">${(a.primaryStats||[]).join(" · ")||""}</div>
      <p>${esc(a.summary||"")}</p>
    </button>`).join("") + `</div>`;
  if (!sel) return h;
  if (sel.flagged) h += flagHtml(sel);
  if (sel.lore) h += `<p class="flavor arch-lore">${esc(sel.lore)}</p>`;
  if (sel.gameplayStyle) h += `<p class="step-note" style="margin-top:16px">${esc(sel.gameplayStyle)}</p>`;

  const row = Engine.scalingRow(ch);
  const pl = Engine.powerLevel(ch);
  if (row && Object.keys(row).length){
    h += `<div class="sect">Campaign Power Scaling — ${esc(pl.name)}</div>`;
    // A formula cell (a Werewolf's starting SFR) is numbers in the data and
    // reads as "WILL × 3 + 5" here (Decision 135).
    h += `<table class="ref"><tbody>` + Object.entries(row).map(([k,v])=>
      `<tr><td>${esc(k.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase()))}</td><td class="num">${esc(v && typeof v==="object" ? Engine.formulaText(v) : v)}</td></tr>`).join("") + `</tbody></table>`;
    if (sel.campaignPowerScaling.notes) h += `<p class="step-note">${esc(sel.campaignPowerScaling.notes)}</p>`;
  }

  // Specialization — ONE block for every archetype (A3). How many to pick
  // comes from the data (`countBy`, or 1); the app does not know or care
  // which archetype it is rendering. This replaces the generic single-select
  // block AND the Arcanist-only aberration block that used to run beside it.
  if (sel.specialization && (sel.specialization.options||[]).length){
    const need = Engine.specializationNeed(ch);
    const picked = Engine.specializationIds(ch);
    h += `<div class="sect">${esc(sel.specialization.label)}${need>1?` — choose ${need}`:""}</div>`;
    if (sel.specialization.intro) h += `<p class="step-note">${esc(sel.specialization.intro)}</p>`;
    if (need>1) h += `<p class="step-note"><em>${picked.length}/${need} chosen.</em></p>`;
    h += sel.specialization.options.map(o=>{
      const seld = picked.includes(o.id);
      let req = "";
      if (o.requires && o.requires.stats){
        const unmet = Object.entries(o.requires.stats).filter(([sid,r])=>Engine.statValue(ch,sid)<r);
        req = `<span class="cost ${unmet.length?"":"grant"}">requires ${Object.entries(o.requires.stats).map(([s,r])=>s+" "+r).join(", ")}</span>`;
      }
      return `<div class="pick ${seld?"selected":""}">${o.flagged?flagHtml(o):""}
        <div class="head"><h4>${esc(o.name)}</h4>${req}
          <div class="controls"><button class="toggle" data-spec="${o.id}">${need>1?(seld?"Chosen":"Choose"):(seld?"Selected":"Select")}</button></div></div>
        <div class="desc">${esc(o.description||"")}</div>
        ${o.focusedSkills?`<div class="desc"><b>Focused Skills:</b> ${esc(focusedSkillsText(o.focusedSkills))}</div>`:""}
        ${o.tweak?`<div class="desc"><b>Tweak — ${esc(o.tweak.name)}:</b> ${esc(o.tweak.description)} ${(o.tweak.benefits||[]).map(esc).join(" ")}</div>`:""}
        ${o.benefit?`<div class="desc"><b>Benefit:</b> ${esc(o.benefit)}</div>`:""}
        ${o.transformation?`<div class="desc"><b>Transformation:</b> ${esc(o.transformation)}</div>`:""}
        ${optionPowersHtml(o)}
      </div>`;
    }).join("");
  } else if (sel.specialization && sel.specialization.required){
    h += `<div class="sect">${esc(sel.specialization.label)}</div>
      <p class="step-note">${esc(copy("specializationUnwritten").replace("{label}", sel.specialization.label))}</p>`;
  }

  // Creation rolls the scaling row asks for (Decision 135): a Focus Stat
  // bonus on the stats `focusStats` names, or a Stat Bonus on any stat. The
  // row's own keys say which, so no archetype is named here.
  if (row && row.focusStatBonusRoll){
    const focus = sel.campaignPowerScaling.focusStats||[];
    h += `<div class="sect">Focus Stat Bonus</div>
      <div class="roll-entry"><span class="die">${esc(row.focusStatBonusRoll)}</span>
      <input type="text" inputmode="numeric" pattern="[0-9]*" data-archroll="focusStatBonus" value="${ac.rolls.focusStatBonus==null?"":ac.rolls.focusStatBonus}" aria-label="focus stat bonus roll">
      <span class="pool">Allocate among ${esc(focus.join(" · "))} — these points can push a stat past ${D.statRules.max}.</span></div>`;
    const total = ac.rolls.focusStatBonus||0;
    const used = Object.values(ac.focusAllocation).reduce((s,v)=>s+v,0);
    h += `<div class="alloc">` + focus.map(sid=>{
      const v = ac.focusAllocation[sid]||0;
      return `<div class="alloc-row"><div class="name">${esc(sid)} <small>current ${Engine.statValue(ch,sid)}</small></div>
        ${stepper(v,"focus|"+sid, v>0, used<total)}<span class="mod"></span></div>`;
    }).join("") + `</div>`;
  }

  // A1 closed here: the aberration list used to render a SECOND time in
  // this block, with its own [data-aber] buttons and its own validate rule.
  // It is the specialization block above, and always was. What follows is
  // written from the disciplines' starting ranks and the starting-spells rule.
  const starts = Engine.disciplineRanks(ch).filter(d=>d.base>0).map(d=>`${d.name} starts at rank ${d.base}.`);
  const ssRule = (D.spellcraftRules||{}).startingSpells;
  if (row && ssRule && row.startingSpellsRoll){
    const disc = Engine.disciplineRanks(ch).find(d=>d.id===ssRule.discipline);
    const step = D.creationFlow.steps.find(s=>s.id==="character-points");
    starts.push(`You choose your starting spells (${ssRule.countFrom||"TOL"} + ${row.startingSpellsRoll}) in Step ${step?step.n:""}, once your ${disc?disc.name:""} rank is set.`);
  }
  if (starts.length) h += `<p class="step-note">${esc(copy("applyFromText"))} ${esc(starts.join(" "))}</p>`;

  if (row && row.statBonusRoll){
    h += `<div class="sect">Stat Bonus</div>
      <div class="roll-entry"><span class="die">${esc(row.statBonusRoll)}</span>
      <input type="text" inputmode="numeric" pattern="[0-9]*" data-archroll="statBonus" value="${ac.rolls.statBonus==null?"":ac.rolls.statBonus}" aria-label="stat bonus roll">
      <span class="pool">Allocate to any Stats (cap ${D.statRules.max}).</span></div>`;
    const total = ac.rolls.statBonus||0;
    const used = Object.values(ac.statBonusAllocation).reduce((s,v)=>s+v,0);
    h += `<div class="alloc">` + D.stats.map(s=>{
      const v = ac.statBonusAllocation[s.id]||0;
      return `<div class="alloc-row"><div class="name">${s.id} <small>current ${Engine.statValue(ch,s.id)}</small></div>
        ${stepper(v,"wwbonus|"+s.id, v>0, used<total && Engine.statValue(ch,s.id)<D.statRules.max)}<span class="mod"></span></div>`;
    }).join("") + `</div>`;
  }

  // Focused Skill picks and the free Natural Advantage pool (Decision 134):
  // drawn for any archetype whose chosen specialization and data carry them.
  if (Engine.specializationIds(ch).length){
    const fp = Engine.focusedPicks(ch);
    if (fp && fp.need){
      h += `<div class="sect">Focused Skills — choose ${fp.need} ${esc(Engine.focusedCategoryName(fp.category))} Skill${fp.need>1?"s":""}</div>`;
      h += focusedPickHtml(ch, "data-fskill");
    }
    const nat = Engine.naturalAdvantagePool(sel);
    const rowP = Engine.scalingRow(ch);
    if (nat && rowP && rowP.naturalAdvantageRanks!=null){
      const have = ac.naturalAdvantages.reduce((s,n)=>s+n.rank,0);
      h += `<div class="sect">Natural Advantages — allocate ${rowP.naturalAdvantageRanks} ranks (free)</div>
        <p class="step-note">${esc(nat.description)} <em>${have}/${rowP.naturalAdvantageRanks} allocated.</em></p>`;
      h += nat.pool.map(p=>{
        const def = Engine.advById(p.advantageId);
        const cur = (ac.naturalAdvantages.find(n=>n.id===p.advantageId)||{rank:0}).rank;
        return `<div class="pick ${cur>0?"selected":""}"><div class="head"><h4>${esc(def?def.name:p.advantageId)}</h4>
          <span class="cost grant">max rank ${p.maxRank}</span>
          <div class="controls">${stepper(cur,"natadv|"+p.advantageId, cur>0, cur<p.maxRank && have<rowP.naturalAdvantageRanks)}</div></div>
          <div class="desc">${esc(def?def.description:"")}</div>
          ${cur>0?picksHtml("advantage",p.advantageId):""}</div>`;
      }).join("");
    }
  }

  // Baseline traits reference
  if (sel.baselineTraits && sel.baselineTraits.length){
    h += `<details class="group"><summary>Baseline Traits — ${esc(sel.name)}</summary>` +
      sel.baselineTraits.map(t=>`<div class="pick"><div class="head"><h4>${esc(t.name)}</h4></div>
        <div class="desc">${esc(t.description||"")}${t.benefit?"\n"+esc(t.benefit):""}${t.effects?"\n• "+t.effects.map(esc).join("\n• "):""}</div></div>`).join("") + `</details>`;
  }
  return h;
}

function renderHistory(){
  return `<label class="field"><span>History</span>
    <textarea data-id="history" placeholder="What shaped them? What do they owe, fear, or want?">${esc(S.ch.identity.history)}</textarea></label>`;
}

function renderSkills(){
  const ch=S.ch, pool=Engine.skillPool(ch), pl=Engine.powerLevel(ch);
  const left = pool.total==null?0:pool.total-Engine.skillSpent(ch);
  // Focused Skills start higher (Decision 134); the header says by how much.
  const focused = Engine.focusedSkillIds(ch);
  const fCap = focused.length ? Engine.skillRankCap(ch, focused[0]) : null;
  let h = `<div class="roll-entry">
    <span class="die">${pool.rollDie}</span>
    <input type="text" inputmode="numeric" pattern="[0-9]*" data-roll="skillPoints" value="${pool.roll==null?"":pool.roll}" aria-label="skill point roll">
    <span class="pool">Pool <b>${pool.total==null?"—":pool.total}</b> · Remaining <b>${pool.total==null?"—":left}</b> · Max Rank <b>${pl.maxSkillRank}</b>${fCap!=null&&fCap>pl.maxSkillRank?` · Focused <b>${fCap}</b>`:""}</span>
    <span class="dice-note">Trained checks: ${esc(D.skillCheckRules.trained)}. Untrained: ${esc(D.skillCheckRules.untrained)}.</span>
  </div>`;
  const dataWarns = D.skills.map(s=>Engine.skillLine(ch,s.id).dataWarning).filter(Boolean);
  if (dataWarns.length) h += `<div class="flag">⚑ Data issue: ${dataWarns.map(esc).join(" ")}</div>`;
  const cats = [["combat","Combat"],["utility","Utility"],["general","General"]];
  for (const [cid,cname] of cats){
    h += `<div class="sect">${cname}</div><div class="alloc">`;
    for (const s of D.skills.filter(x=>x.category===cid)){
      const rank = ch.skills[s.id]?ch.skills[s.id].rank:0;
      const line = Engine.skillLine(ch, s.id), cap = Engine.skillRankCap(ch, s.id);
      h += `<div class="alloc-row">
        <div class="name">${esc(s.name)}${focused.includes(s.id)?' <span class="chip gold">focused</span>':""} ${skillStatsHtml(line)}<small>${esc(s.description)}</small></div>
        ${stepper(rank, "skill|"+s.id, rank>0, rank<cap && left>0 && pool.total!=null)}
        <span class="mod ${line.trained?"pos":""}" title="check bonus">+${line.checkBonus}</span>
      </div>`;
      // A trained skill may demand choices of its own — Martial Arts styles
      // are the first, and the machinery is the same one the traits use.
      if (rank>0) h += picksHtml("skill", s.id);
    }
    h += `</div>`;
  }
  return h;
}

function renderCP(){
  const ch=S.ch, pl=Engine.powerLevel(ch), a=Engine.archetype(ch);
  const bal = Engine.cp(ch);
  const canBuyAdv = !a || a.canPurchaseAdvantages!==false;
  const secs = sectionList("cp");
  let top = `<div class="roll-entry">
    <span class="pool" style="margin-left:0">Base <b>${bal.base}</b> + Disadvantages <b>${bal.granted}</b> = Budget <b>${bal.budget}</b> · Spent <b>${bal.spent}</b> · <span style="color:${bal.left<0?"var(--magenta)":"var(--gold)"}">Remaining <b>${bal.left}</b></span></span>
    <span class="dice-note">${esc(D.creationFlow.steps.find(s=>s.id==="character-points").note||"")}</span></div>`;
  if (!canBuyAdv) top += ruleHtml(`${a.name}s are Supernatural — unable to purchase Advantages. Disadvantages, LUCK, and boosts remain open.`);

  // Disadvantages
  let h = secs.sect("Disadvantages", "Disadvantages — grant Character Points (no cap)");
  h += `<details class="group" open data-filterable><summary>${D.disadvantages.length} available</summary>` +
    D.disadvantages.map(dd=>{
      const cur = (ch.disadvantages.find(x=>x.id===dd.id)||{rank:0}).rank;
      const lock = Engine.optionLock(ch,"disadvantage",dd.id);
      const req  = Engine.requirementState(ch,"disadvantage",dd.id);
      return `<div class="pick ${cur>0?"selected":""}">${dd.flagged?flagHtml(dd):""}
        <div class="head"><h4>${esc(dd.name)}</h4><span class="cost grant">+${dd.pointsGranted} CP/rank · max ${dd.maxRank}</span>
        ${constraintHtml("disadvantage",dd.id)}
        <div class="controls">${stepper(cur,"disadv|"+dd.id, cur>0, cur<dd.maxRank && !lock.locked && req.ok)}</div></div>
        <div class="desc">${esc(dd.description)}</div>
        ${cur>0?picksHtml("disadvantage",dd.id):""}</div>`;
    }).join("") + `</details>`;

  // Advantages
  h += secs.sect("Advantages", "Advantages — cost Character Points");
  h += `<details class="group" open data-filterable><summary>${D.advantages.length} available</summary>` +
    D.advantages.map(ad=>{
      const cur = (ch.advantages.find(x=>x.id===ad.id && x.notes!=="natural")||{rank:0}).rank;
      const natural = ch.advantages.find(x=>x.id===ad.id && x.notes==="natural");
      const affordable = bal.left>=ad.cost;
      const lock = Engine.optionLock(ch,"advantage",ad.id);
      const req  = Engine.requirementState(ch,"advantage",ad.id);
      return `<div class="pick ${cur>0?"selected":""}">${ad.flagged?flagHtml(ad):""}
        <div class="head"><h4>${esc(ad.name)}</h4><span class="cost">${ad.cost} CP/rank · max ${ad.maxRank}</span>
        ${natural?`<span class="cost grant">natural ×${natural.rank}</span>`:""}
        ${ad.creationOnly?`<span class="cost">creation only</span>`:""}
        ${constraintHtml("advantage",ad.id)}
        <div class="controls">${canBuyAdv?stepper(cur,"adv|"+ad.id, cur>0, cur<ad.maxRank && affordable && !lock.locked && req.ok):"<span class='cost'>locked</span>"}</div></div>
        <div class="desc">${esc(ad.description)}</div>
        ${(cur>0||(natural&&natural.rank>0))?picksHtml("advantage",ad.id):""}</div>`;
    }).join("") + `</details>`;

  // LUCK
  const luck = D.resources.luck;
  h += secs.sect("LUCK");
  if (luck.flagged) h += flagHtml(luck);
  h += `<div class="pick"><div class="head"><h4>Buy up LUCK</h4>
    <span class="cost">${luck.cpCostPerPoint} CP/point · exempt from Max Boost</span>
    <div class="controls">${stepper(luck.startingValue+ch.trackers.luck.bonus, "luck|x", ch.trackers.luck.bonus>0, bal.left>=luck.cpCostPerPoint)}</div></div>
    <div class="desc">Everyone starts at ${luck.startingValue}. ${esc(luck.refresh)}</div></div>`;

  // Disciplines: price, cap and starting ranks are the data's (Decision 135).
  const discs = Engine.disciplineRanks(ch);
  if (discs.length){
    const per = Number(a.coreMechanic.disciplines.cpPerRank)||0, cap = Engine.disciplineCap(ch);
    h += secs.sect("Disciplines", `Disciplines — ${per} CP per rank${cap==null?"":` · cap ${cap}`}`);
    h += discs.map(d=>`<div class="pick ${d.rank>0?"selected":""}"><div class="head"><h4>${esc(d.name)}</h4>
        <span class="cost">${d.base?`starts at ${d.base} · `:""}rank ${d.rank}</span>
        <div class="controls">${stepper(d.rank,"disc|"+d.id, d.bought>0, (cap==null || d.rank<cap) && bal.left>=per)}</div></div>
        <div class="desc">${esc(d.description)}</div></div>`).join("");
  }

  // Starting spells (Decision 111). Here, not on the Archetype step, because
  // Evocation rank and TOL are only final once this step's ranks and boosts
  // are spent. Buying a rank above opens the next tier in the picker.
  const ss = Engine.startingSpells(ch);
  if (ss){
    const book = Engine.grimoire(ch).lines.filter(l=>!l.custom && !l.missing);
    h += secs.sect("Starting spells", `Starting spells — ${esc(ss.countFrom)} + ${esc(ss.rollDie)}`) + `
      <div class="roll-entry"><span class="die">${esc(ss.rollDie)}</span>
      <input type="text" inputmode="numeric" pattern="[0-9]*" data-archroll="startingSpells" value="${ss.roll==null?"":ss.roll}" aria-label="starting spells roll">
      <span class="pool">${esc(ss.countFrom)} ${ss.base} + roll = <b>${ss.count==null?"—":ss.count}</b> spells · chosen <b>${ss.have}</b> · TH up to ${ss.cap} (${esc(ss.discipline)} ${ss.cap})</span></div>
      <p class="step-note">${esc(ss.text)}</p>`;
    h += book.map(l=>{
      const over = ss.over.some(o=>o.id===l.id);
      return `<div class="pick selected"><div class="head"><h4>${esc(l.name)}</h4>
        <span class="cost">${esc(l.tier)} · TN ${l.tn==null?"—":l.tn} · TH ${l.th==null?"—":l.th}</span>
        ${over?`<span class="cost over">needs ${esc(ss.discipline)} ${l.printedTH}</span>`:""}
        <div class="controls"><button class="toggle" data-startrm="${l.index}">Remove</button></div></div>
        <div class="desc">${esc(l.effect||"")}</div></div>`;
    }).join("");
    h += `<button class="btn" data-spellpickopen="wizard">Choose from the book</button>`;
  }

  // Boosts
  h += secs.sect("Boosts", `Boosts — leftover CP on Stats &amp; Skills · max ${pl.maxBoost}× per target`);
  if (D.creationFlow.boostRules.flagged) h += flagHtml(D.creationFlow.boostRules);
  h += `<div class="alloc">`;
  for (const s of D.stats){
    const times = Engine.boostsFor(ch,"stat",s.id);
    const can = Engine.canBoost(ch,"stat",s.id);
    h += `<div class="alloc-row"><div class="name">${s.id} <small>value ${Engine.statValue(ch,s.id)}</small></div>
      ${stepper(times,"boost|stat|"+s.id, times>0, can.ok)}<span class="mod" title="${esc(can.ok?"":can.why)}">${can.ok?"":"⛔"}</span></div>`;
  }
  h += `</div><div class="alloc" style="margin-top:14px">`;
  for (const id of Object.keys(ch.skills)){
    const def = Engine.skillById(id); if (!def) continue;
    const times = Engine.boostsFor(ch,"skill",id);
    const can = Engine.canBoost(ch,"skill",id);
    h += `<div class="alloc-row"><div class="name">${esc(def.name)} <small>rank ${Engine.skillLine(ch,id).rank}</small></div>
      ${stepper(times,"boost|skill|"+id, times>0, can.ok)}<span class="mod" title="${esc(can.ok?"":can.why)}">${can.ok?"":"⛔"}</span></div>`;
  }
  if (!Object.keys(ch.skills).length) h += `<p class="step-note">Train skills in Step 6 to boost them here.</p>`;
  h += `</div>`;
  // W22: step 7 is the longest page in the app, so a bar sticks under the
  // header with a filter over the picks, a jump to each section, and the CP
  // still to spend.
  const left = `<span class="jump-cp ${bal.left<0?"over":""}">Remaining <b>${bal.left}</b> CP</span>`;
  return top + jumpBarHtml(secs.list, { sticky:true, filter:{ value:S.cpFilter, placeholder:"Filter Advantages and Disadvantages" }, extra:left }) + h;
}

function renderReview(){
  const ch=S.ch, pl=Engine.powerLevel(ch), a=Engine.archetype(ch);
  const der=Engine.derived(ch), hp=Engine.health(ch), t=Engine.statTable(ch);
  const issues = Engine.validate("review",ch);
  const blocked = issues.some(i=>i.level==="error");
  let h = `<div class="roll-entry"><span class="die">Çredits: ${esc(pl.startingCredits.roll)} × ${pl.startingCredits.multiplier}</span>
    <input type="text" inputmode="numeric" pattern="[0-9]*" data-roll="credits" value="${ch.creation.rolls.credits==null?"":ch.creation.rolls.credits}" aria-label="credits roll">
    <span class="pool">Starting ${CR} <b>${ch.creation.rolls.credits==null?"—":ch.creation.rolls.credits*pl.startingCredits.multiplier}</b></span></div>`;
  h += `<div class="review-block"><h3>${esc(ch.identity.name)||"Unnamed"}</h3>${intakeHtml(ch)}<div class="kv">
    <span class="k">Archetype</span><span class="v">${a?esc(a.name):"—"}${Engine.specializationLabel(ch)?" · "+esc(Engine.specializationLabel(ch)):""}${a&&a.status!=="final"?" · "+esc(statusLabel(a.status)):""}</span>
    <span class="k">Power Level</span><span class="v">${esc(pl.name)}</span>
    <span class="k">Stats</span><span class="v">${D.stats.map(s=>s.id+" "+t[s.id].value).join(" · ")}</span>
    <span class="k">Derived</span><span class="v">TOL ${der.TOL} · WILL ${der.WILL} · SAN ${der.SAN}% · ${hp.levels} HL / ${hp.total} HP · LUCK ${D.resources.luck.startingValue+ch.trackers.luck.bonus}</span>
    <span class="k">Skills</span><span class="v">${Object.keys(ch.skills).map(id=>{const l=Engine.skillLine(ch,id);return esc(l.def.name)+" "+l.rank;}).join(" · ")||"—"}</span>
    <span class="k">Advantages</span><span class="v">${ch.advantages.map(x=>{const d2=Engine.advById(x.id);return esc(d2?d2.name:x.id)+(x.rank>1?" ×"+x.rank:"")+(x.notes==="natural"?" (natural)":"");}).join(" · ")||"—"}</span>
    <span class="k">Disadvantages</span><span class="v">${ch.disadvantages.map(x=>{const d2=Engine.disById(x.id);return esc(d2?d2.name:x.id)+(x.rank>1?" ×"+x.rank:"");}).join(" · ")||"—"}</span>
    <span class="k">Boost ledger</span><span class="v">${ch.creation.boosts.map(b=>esc(b.targetId)+" ×"+b.times).join(" · ")||"—"}</span>
  </div></div>`;
  h += issuesHtml(issues);
  h += `<div class="wiznav">
    <button class="btn" data-nav="-1">Back</button>
    <button class="btn" data-export="draft">Export draft</button>
    <button class="btn go" data-lock="1" ${blocked?"disabled":""}>Lock &amp; Export</button>
  </div>
  <p class="step-note" style="margin-top:12px">Locking finalizes creation. The exported <span style="font-family:var(--mono)">.shadows.json</span> is the character — keep it, share it, bring it to the table.</p>`;
  return h;
}

// ── Home ─────────────────────────────────────────────────────────────
// The roster (R10, Decision 141): every character this browser keeps, the
// most recently changed first, each with open, export and remove. A card
// says when its changes haven't reached a file, because browser storage is
// a convenience and the exported file is the copy that lasts.
function whenText(iso){
  const t=Date.parse(iso); if (!Number.isFinite(t)) return "";
  const m=Math.round((Date.now()-t)/60000);
  if (m<1) return "just now";
  if (m<60) return m+" min ago";
  const h=Math.round(m/60); if (h<24) return h+" h ago";
  const d=Math.round(h/24); if (d===1) return "yesterday";
  return d<7 ? d+" days ago" : new Date(t).toLocaleDateString();
}
const stepOf = (n, max=STEPS.length-1) => { n=Number(n); return Number.isInteger(n) && n>=0 && n<=max ? n : 0; };
function rosterCardHtml(e){
  const c=Engine.migrate(clone(e.ch)), locked=!!c.creation.locked, id=esc(e.id);
  const arch=D.archetypes.find(a=>a.id===c.identity.archetype);
  const where = locked ? "Sheet · "+((SHEET_SECTIONS.find(s=>s.id===normSection(e.section))||SHEET_SECTIONS[0]).label)
                       : `Draft · step ${stepOf(e.step)+1} of ${STEPS.length}`;
  const bits=[arch?arch.name:"", whenText(e.changed)?"changed "+whenText(e.changed):""].filter(Boolean).map(esc).join(" · ");
  return `<li class="roster-card" data-card="${id}">
    <div class="roster-top"><b class="roster-name">${esc(String(c.identity.name||"").trim() || "Unnamed")}</b><span class="roster-where">${esc(where)}</span></div>
    <div class="roster-meta"><span class="roster-tag">${id}</span>${bits?" · "+bits:""}</div>
    ${unexported(e)?`<div class="roster-unexported">Changes not exported yet</div>`:""}
    <div class="roster-actions">
      <button class="btn primary sm" data-open="${id}">${locked?"Open sheet":"Resume draft"}</button>
      <button class="btn sm" data-exportchar="${id}">Export</button>
      <button class="btn sm" data-remove="${id}">Remove</button>
    </div></li>`;
}
function openEntry(e){
  const c=Engine.migrate(clone(e.ch));
  lastSaved=null; untouched=null;
  // Resume must migrate like every other load path: a draft saved under an
  // older schema otherwise comes back with its data where no reader looks.
  S = c.creation.locked
    ? Object.assign({screen:"sheet", ch:c, step:0, maxReached:STEPS.length-1, section:normSection(e.section)}, loadFindings(c))
    : {screen:"wizard", ch:c, step:stepOf(e.step), maxReached:Math.max(stepOf(e.step), stepOf(e.maxReached)), section:"main"};
  update();
}
function exportEntry(e){ exportCharacter(Engine.migrate(clone(e.ch))); }
function askRemove(e){
  const c=Engine.migrate(clone(e.ch)), who=esc(charName(c));
  const risk = !e.exported ? `This browser holds the only copy of <b>${who}</b>. Once it's removed, it's gone.`
    : unexported(e) ? `<b>${who}</b> has changes you haven't exported. Once it's removed, they're gone.`
    : `Your exported file of <b>${who}</b> isn't touched. Import it to bring the character back.`;
  openModal({ title:`Remove ${charName(c)}?`,
    html:`<p>This removes <b>${who}</b> (${esc(e.id)}) from this browser.</p><p class="step-note">${risk}</p>`,
    foot:`<button class="btn" data-modalclose>Cancel</button>
      <button class="btn" data-removeexport>Export, then remove</button>
      <button class="btn danger" data-removego>Remove</button>`,
    bind(body, foot){
      const go=()=>{ closeModal(); removeChar(e.id); renderHome(); };
      foot.querySelector("[data-removeexport]").onclick=()=>{ exportEntry(e); go(); };
      foot.querySelector("[data-removego]").onclick=go;
      foot.querySelector("[data-modalclose]").focus();
    } });
}
function renderHome(){
  const app=$("app"); if (app) app.classList.remove("sheet-mode");
  renderTopChrome(); closeVitals();
  const roster = rosterEntries();
  $("main").innerHTML = `<div class="home-hero">
    <div class="glyph">[ 1 0 ]</div>
    <h1>Character Intake</h1>
    <p>NYTE City doesn't care who you were. Build who you're going to be.</p>
    <div class="home-actions">
      <button class="btn go" id="btn-new">New character</button>
      <button class="btn" id="btn-import">Import .shadows.json</button>
      <input type="file" id="file-import" accept=".json,.shadows.json" style="display:none">
    </div>
    ${roster.length?`<section class="roster" aria-labelledby="roster-h">
      <h2 id="roster-h" class="roster-h">Your characters</h2>
      <ul class="roster-list">${roster.map(rosterCardHtml).join("")}</ul>
      <p class="step-note">Characters stay in this browser until you remove them, but it isn't a backup: clearing site data erases every one. The exported <span style="font-family:var(--mono)">.shadows.json</span> is the copy that lasts.</p>
    </section>`:""}
    <div class="home-news" id="homenews">${whatsNewHomeHtml()}</div>
    <p class="step-note" style="margin-top:14px">Playing at the table instead? <button class="btn sm" id="btn-print-blank">Print a blank character sheet</button></p>
    </div>`;
  $("btn-new").onclick=()=>{
    // A new character is saved once the player changes something, so a
    // stray click leaves no empty entry behind.
    const fresh=Engine.newCharacter();
    lastSaved=null; untouched=JSON.stringify(fresh);
    S={screen:"wizard", ch:fresh, step:0, maxReached:0, section:"main"}; update();
  };
  $("btn-print-blank").onclick=()=>printSheet(null);
  const byId = id => roster.find(e=>e.id===id);
  const main=$("main");
  main.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openEntry(byId(b.dataset.open)));
  main.querySelectorAll("[data-exportchar]").forEach(b=>b.onclick=()=>{ exportEntry(byId(b.dataset.exportchar)); renderHome(); });
  main.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>askRemove(byId(b.dataset.remove)));
  // A tap anywhere on a card opens it; its buttons keep their own.
  main.querySelectorAll("[data-card]").forEach(li=>li.onclick=ev=>{ if (!ev.target.closest("button")) openEntry(byId(li.dataset.card)); });
  $("btn-import").onclick=()=>$("file-import").click();
  $("file-import").onchange=e=>{
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=()=>{
      let c;
      try{ c=Engine.migrate(JSON.parse(rd.result)); }
      catch(err){ notice("That file didn't parse as a character: "+err.message); return; }
      const locked=!!(c.creation && c.creation.locked), id=intakeOf(c);
      // A different character is added. The only question left is a file
      // older than the copy this browser keeps of the same character (B18).
      const have=(savedChar(id)||{}).ch;
      guardReplace(have, c, { title:`Open an older copy of ${charName(have)}?`,
        lead:`This file is an older copy of <b>${esc(charName(c))}</b> (${esc(id)}) than the one saved in this browser. Opening it puts it in place of the newer one.`,
        go:"Open the older copy" }, ()=>{
          lastSaved=null; untouched=null;
          S=Object.assign({screen: locked?"sheet":"wizard", ch:c, step:0, maxReached:STEPS.length-1, section:"main"}, loadFindings(c));
          update();
          markExported(id);   // the file just opened holds what's now saved
        });
    };
    rd.readAsText(f);
    e.target.value="";      // the same file can be chosen again after a Cancel
  };
  renderLedger(); renderVitals();
}

const RENDER = { "power-level":renderPowerLevel, "concept":renderConcept, "stats":renderStats,
  "archetype":renderArchetype, "history":renderHistory, "skills":renderSkills,
  "character-points":renderCP, "review":renderReview };
