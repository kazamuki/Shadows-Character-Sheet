// Creation wizard: the eight-step intake ledger + rail, every step's
// renderer, then its binders (bindMain, applyStep). Reads/writes the shared
// state and helpers declared in shared.js.

// ── Ledger ───────────────────────────────────────────────────────────
// A passed step with open warnings (e.g. unspent Skill Points) used
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
    return `<button class="${cls}" data-goto="${i}" ${dis}><span class="n">${icon}</span>${esc(st.short)}</button>`;
  }).join("");
  const callout = attnCount ? `<button class="ledger-callout" data-goto="${firstAttn}">
    ⚠ ${attnCount} step${attnCount>1?"s":""} could still use a second look</button>` : "";
  el.innerHTML = `<h2>Intake Ledger</h2>` + rows + callout;
  el.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>{ S.step=Number(b.dataset.goto); update(); });
}

// ── Vitals rail ──────────────────────────────────────────────────────
// The rail is the wizard's live readout only. Once locked, the sheet hides it
// and uses the horizontal vitals bar (sheetVitalsBar) instead.
// Below 1060px the full rail would push the step off the screen, so the rail
// is one sticky line of what's left to spend, and Vitals opens the whole rail
// in the sheet's flyout (Decision 161). Both are drawn; the CSS shows one.
function renderVitals(){
  const el = $("vitals");
  if (!S.ch || S.screen==="sheet"){ el.innerHTML=""; return; }
  el.innerHTML = wizardStripHtml(S.ch) + `<div class="vfull"><h2>Vitals</h2>${wizardRailHtml(S.ch)}</div>`;
  el.querySelectorAll("[data-wiz-vitals]").forEach(b=>b.onclick=()=>{ S.vitalsOpen=true; renderDrawer(); });
}
// The one line: the points left in each creation pool, which is what a
// player is spending, then the way to everything else.
function wizardStripHtml(ch){
  const pill=(k,v,over)=>`<div class="vpill${over?" danger":""}"><span class="vtext"><span class="vk">${k}</span><span class="vv">${v}</span></span></div>`;
  let h = `<div class="vstrip" aria-label="Points left">`;
  if (Engine.powerLevel(ch) && !ch.creation.locked){
    const sp=Engine.statPool(ch), kp=Engine.skillPool(ch), cp=Engine.cp(ch);
    const sLeft = sp.total==null ? null : sp.total-Engine.statSpent(ch), kLeft = kp.total-Engine.skillSpent(ch);
    h += pill("Stats", sLeft==null ? "roll "+esc(sp.rollDie) : `${sLeft}<small>/${sp.total}</small>`, sLeft!=null && sLeft<0);
    h += pill("Skills", `${kLeft}<small>/${kp.total}</small>`, kLeft<0);
    h += pill("CP", `${cp.left}<small>/${cp.budget}</small>`, cp.left<0);
  }
  return h + `<button type="button" class="vpill toggle" data-wiz-vitals aria-haspopup="dialog" aria-label="Open full vitals"><span class="vtext"><span class="vk">Vitals</span><span class="vv">View ▸</span></span></button></div>`;
}
// Everything the rail shows, for the rail beside the step and for the flyout.
function wizardRailHtml(ch){
  const pl=Engine.powerLevel(ch), a=Engine.archetype(ch);
  const der=Engine.derived(ch), hp=Engine.health(ch), t=Engine.statTable(ch);
  const locked = ch.creation.locked;
  let h = `<div class="vgroup">
    <div class="vname">${esc(charName(ch, "—"))}</div>
    <div class="vsub">${a?esc(a.name):"no archetype"} · ${pl?esc(pl.name):"no power level"}</div></div>`;
  if (pl && !locked){
    const sp=Engine.statPool(ch), kp=Engine.skillPool(ch), cp=Engine.cp(ch);
    h += `<div class="vgroup">`;
    h += vrow("Stat Points", sp.total==null?"roll "+sp.rollDie:(sp.total-Engine.statSpent(ch))+" / "+sp.total, sp.total!=null&&sp.total-Engine.statSpent(ch)<0?"over":"");
    h += vrow("Skill Points", (kp.total-Engine.skillSpent(ch))+" / "+kp.total, kp.total-Engine.skillSpent(ch)<0?"over":"");
    h += vrow("Character Pts", cp.left+" / "+cp.budget, cp.left<0?"over":"gold");
    h += `</div>`;
  }
  if (locked){
    // Condition readout — current values, computed maxima
    const pain=Engine.painState(ch), luck=Engine.luckState(ch), san=Engine.sanState(ch);
    const ip=Engine.ipState(ch), ms=Engine.milestoneState(ch);
    h += `<div class="vgroup">`;
    h += vrow("HP", pain.hpLeft+" / "+hp.total, pain.down?"over":"hp");
    h += vrow("Pain", pain.down?"DOWN":"Lv "+pain.level+(pain.level?" ("+pain.skillPenalty+" skill)":""), pain.level?"over":"");
    h += vrow("SAN", san.current+" / "+san.max+"%", san.current<=san.max/2?"over":"");
    h += vrow("LUCK", luck.current+" / "+luck.max, luck.current===0?"over":"gold");
    const sfr = Engine.sfr(ch);
    if (sfr && sfr.value!=null) h += vrow("SFR", Math.max(0,sfr.value-(ch.trackers.sfr.spent||0))+" / "+sfr.value);
    h += vrow(CR, numText(ch.trackers.credits.current), "gold");
    h += `</div><div class="vgroup">`;
    h += vrow("IP", ip.available, ip.available<0?"over":"");
    h += vrow("Milestone Pts", ms.mp);
    h += `</div>`;
  }
  // Before any Stat Point is spent the stats are only their floor, so the
  // rail says "not yet" rather than a score nobody chose (Decision 161).
  const unset = !locked && Engine.statSpent(ch)===0 && D.stats.every(s=>t[s.id].value===ch.stats[s.id].base);
  const dash = "&mdash;";
  h += `<div class="vgroup">` + D.stats.map(s=>{
    const m=t[s.id].mod;
    return vrow(s.id, unset ? dash : t[s.id].value+" ("+modText(m)+")", "", s.id);
  }).join("") + `</div>`;
  h += `<div class="vgroup">`;
  h += vrow("TOL", unset?dash:der.TOL, "", "TOL") + vrow("WILL", unset?dash:der.WILL, "", "WILL");
  if (!locked){
    h += vrow("SAN", unset?dash:der.SAN+"%", "", "SAN");
    h += vrow("Health", unset?dash:hp.levels+" HL · "+hp.total+" HP","hp");
    h += vrow("LUCK", D.resources.luck.startingValue + ch.trackers.luck.bonus);
    const sfr = Engine.sfr(ch);
    if (sfr && sfr.value!=null) h += vrow("SFR", sfr.value+(sfr.rou!=null ? " · RoU "+sfr.rou : ""));
  }
  h += `</div>`;
  return h;
}

// ── Wizard-only widgets ──────────────────────────────────────────────
// `name` is what the row changes ("Body", "Handguns"): the buttons read
// "Raise Body", and announceStep() reads it back with the new value (W59).
function stepper(val, dataAttr, downOk, upOk, name){
  const n = esc(name);
  return `<div class="stepper" data-name="${n}">
    <button data-step="${dataAttr}|-1" ${downOk?"":"disabled"} aria-label="Lower ${n}">−</button>
    <span class="val">${val}</span>
    <button data-step="${dataAttr}|1" ${upOk?"":"disabled"} aria-label="Raise ${n}">+</button></div>`;
}
const statNameOf = id => (D.stats.find(s=>s.id===id)||{}).name || id;
// The controls for one entry's picks. Rendered off Engine.picksFor,
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
// The nav sticks to the bottom of the screen, so Continue is in reach from
// anywhere on a long step. The issues sit just above it, and while one
// blocks, the bar says so and jumps to them.
// refreshNav redraws the same two pieces in place.
const navErrors = issues => issues.filter(i=>i.level==="error").length;
const wizIssuesHtml = issues => `<div id="wiz-issues">${issuesHtml(issues)}</div>`;
const wizWhyHtml = n => n ? `<a class="wiznav-why" href="#wiz-issues">${n===1?"1 thing":`${n} things`} to fix first</a>` : "";
function wizNav(stepId){
  const issues = Engine.validate(stepId, S.ch), errors = navErrors(issues);
  const last = S.step===STEPS.length-1;
  return `${wizIssuesHtml(issues)}<div class="wiznav">
    ${S.step>0?`<button class="btn" data-nav="-1">Back</button>`:""}
    ${!last?`<button class="btn primary" data-nav="1" ${errors?"disabled":""}>Continue</button>`:""}
    ${wizWhyHtml(errors)}
  </div>`;
}

// ── Step renderers ───────────────────────────────────────────────────
// One title (the step's short name), then the step's sentence under it.
// The label is a sentence whether or not the data ends it with one (W60:
// "…assign your Base Stats Explosions do not happen…").
const sentence = s => /[.?!…]$/.test(s) ? s : s+".";
function stepHeader(st){
  // A step can word itself for a rolled Stat Point pool (Stats: roll, or point buy).
  const v = st.byStatMethod && S.ch && st.byStatMethod[S.ch.creation.statMethod==="rolled" ? "rolled" : "flat"];
  if (v) st = Object.assign({}, st, v);
  return importIssuesHtml() + `<div class="eyebrow">Step ${st.n} of ${STEPS.length}</div>
    <h1 class="step-title">${esc(st.short)}</h1>
    <p class="step-note">${esc(sentence(st.label))}${st.note?` <em>${esc(st.note)}</em>`:""}</p>${expertHintHtml()}`;
}

function renderPowerLevel(){
  const ch=S.ch, rolled = ch.creation.statMethod==="rolled";
  let h = "";
  h += `<div class="cards two">` + D.powerLevels.map(p=>`
    <button class="card ${ch.creation.powerLevel===p.id?"selected":""}" data-pl="${p.id}" aria-pressed="${ch.creation.powerLevel===p.id}">
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.description||"")}</p>
      <div class="stat-line">
        <span>Stats <b>${rolled ? `${p.statPoints.rolled.base}+${p.statPoints.rolled.roll}` : p.statPoints.flat}</b></span>
        <span>Skills <b>${p.skillPoints.base}+${(p.skillPoints.plusStats||[]).join("+")}</b></span>
        <span>CP <b>${p.characterPoints}</b></span>
        <span>Skill cap <b>${p.maxSkillRank}</b></span>
        <span>Power cap <b>${p.maxPowerRank}</b></span>
        <span>Max CP Boost <b>${p.maxBoost}</b></span>
        <span>${CR} <b>${p.startingCredits.roll}×${p.startingCredits.multiplier}</b></span>
      </div>
    </button>`).join("") + `</div>`;
  return h + statMethodHtml(ch);
}

// Decision 150: Stat Points are a flat pool or a rolled one, the GM's pick.
// The book prints the flat pool, so that's the default and rolling is a box
// a GM's table ticks (Decision 198).
function statMethodHtml(ch){
  const on = ch.creation.statMethod==="rolled";
  const p = D.powerLevels.find(x=>x.id===ch.creation.powerLevel) || D.powerLevels[0], sp = p.statPoints;
  return `<div class="field stat-method"><label class="check"><input type="checkbox" data-stat-rolled ${on?"checked":""}>
      <span><b>Roll for Stat Points instead</b> <small>Only if your GM says so. The book gives everyone the same pool; rolling starts lower and the dice decide: ${esc(p.name)} is ${sp.rolled.base} + ${esc(sp.rolled.roll)} instead of ${sp.flat}.</small></span></label></div>`;
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
  </div>${taglessToggleHtml(S.ch, "tagless")}`;
}

function renderStats(){
  const ch=S.ch, pool=Engine.statPool(ch);
  const left = pool.total==null?0:pool.total-Engine.statSpent(ch);
  const rolled = pool.method==="rolled", floor = Engine.statFloor();
  const note = S.statNote; S.statNote = null;               // one render, then gone
  let h = `<div class="roll-entry">${rolled ? `
    <span class="die">${pool.base}+${pool.rollDie}</span>
    <input type="text" inputmode="numeric" pattern="[0-9]*" data-roll="statPoints" value="${pool.roll==null?"":pool.roll}" aria-label="stat point roll">` : ""}
    <span class="pool">Pool <b>${pool.total==null?"—":pool.total}</b> · Remaining <b>${pool.total==null?"—":left}</b></span>
    <button class="btn sm" data-stat-floor ${pool.total==null || !D.stats.some(s=>ch.stats[s.id].base<floor) ? "disabled" : ""}>Set all to ${floor}</button>
    <span class="dice-note">${esc(D.statRules.buyText)}${rolled?" Roll your dice at the table and enter the result — the app never rolls for you. Explosions do not happen on creation rolls.":""}</span>
  </div>${note?`<p class="step-note">${esc(note)}</p>`:""}<div class="alloc">`;
  for (const s of D.stats){
    const v = ch.stats[s.id].base, m = Engine.statMod(Engine.statValue(ch,s.id));
    const next = v<D.statRules.max ? Engine.nextStatCost(ch, s.id) : null;
    h += `<div class="alloc-row">
      <div class="name">${esc(s.name)} <small>${esc(s.description)}</small>${next>1?`<small class="next-cost">The next point costs ${next}.</small>`:""}</div>
      ${stepper(v, "stat|"+s.id, v>D.statRules.base, next!=null && next<=left && pool.total!=null, s.name)}
      <span class="mod ${m>0?"pos":m<0?"neg":""}">${modText(m)}</span>
    </div>`;
  }
  return h + `</div>`;
}

function renderArchetype(){
  const ch=S.ch, ac=ch.archetypeChoices, sel=Engine.archetype(ch);
  let h = `<div class="cards two">` + D.archetypes.map(a=>{
    const card = `
    <button class="card ${ch.identity.archetype===a.id?"selected":""}" data-arch="${a.id}" aria-pressed="${ch.identity.archetype===a.id}">
      <span class="badge ${a.status}">${esc(statusLabel(a.status))}</span>
      <h3>${esc(a.name)}</h3>
      <div class="sub">${(a.primaryStats||[]).join(" · ")||""}</div>
      <p${foldAttr("arch|"+a.id)}>${esc(a.summary||"")}</p>
    </button>`;
    // A ? can't sit inside the card's button, so it sits beside it (Expert mode only).
    return expertOn() ? `<div class="card-fold">${card}${foldBtn("arch|"+a.id, a.name)}</div>` : card;
  }).join("") + `</div>`;
  if (!sel) return h;
  // A write-in archetype (Decision 153) is the player's to describe.
  const wi = Engine.writeInOptions(ch);
  if (wi) return h + writeInHtml(ch, wi);
  if (sel.flagged) h += flagHtml(sel);
  if (sel.lore) h += `<p class="flavor arch-lore"${foldAttr("arch|"+sel.id)}>${esc(sel.lore)}</p>`;
  if (sel.gameplayStyle) h += `<p class="step-note" style="margin-top:16px"${foldAttr("arch|"+sel.id)}>${esc(sel.gameplayStyle)}</p>`;

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
        <div class="head"><h2>${esc(o.name)}</h2>${o.description?foldBtn("spec|"+o.id, o.name):""}${req}
          <div class="controls"><button class="toggle" data-spec="${o.id}">${need>1?(seld?"Chosen":"Choose"):(seld?"Selected":"Select")}</button></div></div>
        <div class="desc"${foldAttr("spec|"+o.id)}>${esc(o.description||"")}</div>
        ${o.focusedSkills?`<div class="desc"${mechAttr()}><b>Focused Skills:</b> ${esc(focusedSkillsText(o.focusedSkills))}</div>`:""}
        ${o.tweak?`<div class="desc"${mechAttr()}><b>Tweak — ${esc(o.tweak.name)}:</b> ${esc(o.tweak.description)} ${(o.tweak.benefits||[]).map(esc).join(" ")}</div>`:""}
        ${o.benefit?`<div class="desc"${mechAttr()}><b>Benefit:</b> ${esc(o.benefit)}</div>`:""}
        ${optionFeatures(o).map(f=>`<div class="desc"${mechAttr()}><b>${esc(f.name)}:</b> ${esc(f.text)}</div>`).join("")}
        ${optionPowersHtml(o)}
      </div>`;
    }).join("");
  } else if (sel.specialization && sel.specialization.required){
    h += `<div class="sect">${esc(sel.specialization.label)}</div>
      <p class="step-note">${esc(copy("specializationUnwritten").replace("{label}", sel.specialization.label))}</p>`;
  }

  // What the chosen specialization asks for at creation, and the Base Powers
  // it spends (Decision 200). Both come from the data: no archetype is named.
  h += optionChoicesHtml(ch) + basePowersHtml(ch, sel);

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
        ${stepper(v,"focus|"+sid, v>0, used<total, statNameOf(sid))}<span class="mod"></span></div>`;
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
        ${stepper(v,"wwbonus|"+s.id, v>0, used<total && Engine.statValue(ch,s.id)<D.statRules.max, s.name)}<span class="mod"></span></div>`;
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
        return `<div class="pick ${cur>0?"selected":""}"><div class="head"><h2>${esc(def?def.name:p.advantageId)}</h2>${def&&def.description?foldBtn("nat|"+p.advantageId, def.name):""}
          <span class="cost grant">max rank ${p.maxRank}</span>
          <div class="controls">${stepper(cur,"natadv|"+p.advantageId, cur>0, cur<p.maxRank && have<rowP.naturalAdvantageRanks, def?def.name:p.advantageId)}</div></div>
          ${def?effectsHtml(ch,"advantage",p.advantageId):""}
          <div class="desc"${foldAttr("nat|"+p.advantageId)}>${esc(def?def.description:"")}</div>
          ${cur>0?picksHtml("advantage",p.advantageId):""}</div>`;
      }).join("");
    }
  }

  // Baseline traits reference
  if (sel.baselineTraits && sel.baselineTraits.length){
    h += `<details class="group"><summary>Baseline Traits — ${esc(sel.name)}</summary>` +
      sel.baselineTraits.map((t,i)=>`<div class="pick"><div class="head"><h2>${esc(t.name)}</h2>${foldBtn("trait|"+i, t.name)}</div>
        <div class="desc"${foldAttr("trait|"+i)}>${esc(t.description||"")}${t.benefit?"\n"+esc(t.benefit):""}${t.effects?"\n• "+t.effects.map(esc).join("\n• "):""}</div></div>`).join("") + `</details>`;
  }
  return h;
}

// A specialization's creation choices (Decision 200): one of a list of
// weapons (the Ancient Weapon), or fields the player writes with the GM (the Code), with the book's examples.
function optionChoicesHtml(ch){
  return Engine.optionChoices(ch).map(c=>{
    let h = `<div class="sect">${esc(c.name)}</div>${c.flagged?flagHtml(c):""}${c.text?`<p class="step-note">${esc(c.text)}</p>`:""}`;
    const pickBtn = (id, on) => `<div class="controls"><button class="toggle" data-optpick="${esc(c.id)}|${esc(id)}" aria-pressed="${on}">${on?"Chosen":"Choose"}</button></div>`;
    if (c.type==="weapon"){
      h += (c.options||[]).filter(o=>o && o.id).map(o=>{ const on = c.value===o.id;
        const stats = [o.damage, o.style, o.reach&&`Reach ${o.reach}`, o.parry&&`Parry ${o.parry}`, o.damageType].filter(Boolean).join(" · ");
        return `<div class="pick ${on?"selected":""}"><div class="head"><h2>${esc(o.name)}</h2><span class="cost">${esc(stats)}</span>${pickBtn(o.id, on)}</div>
          <div class="desc">${o.examples?esc(o.examples):""}</div>${(o.tags||[]).length?`<div class="tags">${tagChipsHtml(o.tags)}</div>`:""}</div>`; }).join("");
    } else if (c.type==="text"){
      h += c.fields.map(f=>`<label class="field"><span>${esc(f.name)}</span>
        <input type="text" data-opttext="${esc(c.id)}|${esc(f.id)}" value="${esc(f.value)}" placeholder="${esc(f.prompt)}" aria-label="${esc(f.name)}"></label>`).join("");
      const ex = (Array.isArray(c.examples) ? c.examples : []).filter(r=>r && typeof r==="object");
      if (ex.length) h += `<table class="ref"><thead><tr><th></th>${c.fields.map(f=>`<th>${esc(f.name)}</th>`).join("")}</tr></thead><tbody>${
        ex.map(r=>`<tr><td><b>${esc(r.name||"")}</b></td>${c.fields.map((f, i)=>`<td>${esc((Array.isArray(r.values) ? r.values : [])[i]||"")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    }
    return h;
  }).join("");
}
// Base Powers (Decisions 200, 215): a rank at a time into the powers the
// chosen specialization offers, none past its cap. Innate powers are
// granted: listed, with no stepper.
function basePowersHtml(ch, sel){
  const st = Engine.basePowerState(ch);
  if (!st || !Engine.specializationIds(ch).length) return "";
  const spec = Engine.specializationChosen(ch), noun = (sel.specialization && sel.specialization.label) || "specialization";
  let h = `<div class="sect">Powers${st.count!=null?` — place ${st.count} Base Power${st.count>1?"s":""}`:""}</div>
    <p class="step-note">Your Innate powers are yours at rank 1. Base Powers go into your ${esc(noun)}'s powers. ${st.cap!=null?`One Base Power is one rank. No power starts above rank ${st.cap}. `:""}<em>${st.spent}/${st.count==null?"—":st.count} placed.</em></p>`;
  const defs = sel.powers||[];
  const innate = Engine.archetypePowers(ch).filter(p=>!p.origin);
  if (innate.length) h += `<h3 class="sub-sect">Innate powers</h3>` + innate.map(p=>`<div class="pick selected"><div class="head"><h2>${esc(p.name)}</h2>
      ${p.cost?`<span class="cost">${esc(p.cost)}</span>`:""}<span class="cost grant">${p.ranked?"granted · rank 1":"granted"}</span></div>
      <div class="desc">${esc(p.effect||"")}${p.perRank&&p.ranked?"\nPer rank: "+esc(p.perRank):""}</div></div>`).join("");
  const groups = spec.map(o=>[`${o.name} powers`, st.rows.filter(r=>r.origin===o.id)]);
  const row = r => { const p = defs.find(x=>x && x.id===r.id) || {};
    const up = (st.left==null || st.left > 0) && (r.cap==null || r.placed < r.cap);
    return `<div class="pick ${r.placed?"selected":""}"><div class="head"><h2>${esc(r.name)}</h2>
      ${p.cost?`<span class="cost">${esc(p.cost)}</span>`:""}<span class="cost grant">${r.ranked?`starts at ${r.cap==null?"any rank":"rank "+r.cap+" at most"}`:"no ranks"}</span>
      <div class="controls">${stepper(r.placed, "bp|"+esc(r.id), r.placed>0, up, "Base Powers in "+r.name)}</div></div>
      <div class="desc">${esc(p.effect||"")}${p.perRank&&r.ranked?"\nPer rank: "+esc(p.perRank):""}</div></div>`; };
  for (const [title, rows] of groups) if (rows.length) h += `<h3 class="sub-sect">${esc(title)}</h3>` + rows.map(row).join("");
  if (st.stray.length) h += st.stray.map(r=>`<div class="pick"><div class="head"><h2>${esc(r.name)}</h2>
    <span class="cost">not one of your powers</span><div class="controls">${stepper(r.placed, "bp|"+esc(r.id), true, false, "Base Powers in "+r.name)}</div></div></div>`).join("");
  return h;
}

// The write-in block (Decision 153): what it is, its classification, the
// mechanics it uses, then three lists the player writes. Text fields save as
// they're typed without a redraw, so focus stays put; a click redraws.
function writeInHtml(ch, wi){
  const w = ch.archetypeChoices.writeIn, cls = Engine.classification(ch);
  let h = `<div class="sect">Your archetype</div>
    <p class="step-note">${esc(copy("writeInIntro"))}</p>
    <label class="field"><span>What are you?</span>
      <input type="text" data-wi="name" value="${esc(w.name)}" placeholder="Changeling, ghoul, something worse" maxlength="80"></label>
    <label class="field"><span>Description (optional)</span>
      <textarea data-wi="description" rows="2" placeholder="A sentence or two the table will read.">${esc(w.description||"")}</textarea></label>`;
  h += `<div class="sect">Classification</div>
    <p class="step-note">${esc(copy("writeInClassification"))}</p>
    <div class="cards three">` + wi.classifications.map(c=>`
    <button class="card ${cls&&cls.id===c.id?"selected":""}" data-wicls="${esc(c.id)}" aria-pressed="${!!cls&&cls.id===c.id}">
      <h3>${esc(c.name)}</h3><p>${esc(c.description||"")}</p></button>`).join("") + `</div>`;
  if (cls && cls.writeIn) h += `<label class="field"><span>${esc(cls.name)}: in your words</span>
    <input type="text" data-wi="classificationText" value="${esc(w.classificationText)}" placeholder="In a word or two" maxlength="60"></label>`;
  h += `<div class="sect">What it uses</div><div class="wi-mechanics">` + wi.mechanics.map(m=>`
    <label class="check"><input type="checkbox" data-wimech="${esc(m.id)}" ${m.on?"checked":""}>
      <span><b>${esc(m.label)}</b>${m.note?` <small>${esc(m.note)}</small>`:""}</span></label>`).join("") + `</div>`;
  const textList = (key, title, note, noun) => {
    const rows = Array.isArray(w[key]) ? w[key] : [];
    return `<div class="sect">${esc(title)}</div><p class="step-note">${esc(note)}</p>` +
      rows.map((r, i)=>`<div class="pick wi-row">
        <label class="field"><span>Name</span><input type="text" data-wirow="${key}|${i}|name" value="${esc(r.name)}"></label>
        <label class="field"><span>What it does</span><textarea rows="2" data-wirow="${key}|${i}|description">${esc(r.description)}</textarea></label>
        <button class="btn sm" data-wirm="${key}|${i}" aria-label="Remove this ${noun}">Remove</button></div>`).join("") +
      `<button class="btn sm" data-wiadd="${key}">+ Add a ${noun}</button>`;
  };
  h += textList("traits", "Baseline traits", copy("writeInTraits"), "trait");
  const powers = Engine.archetypeContent(ch).powers;
  h += `<div class="sect">Powers</div><p class="step-note">${esc(copy("writeInPowers"))}</p>
    <datalist id="power-uses">${wi.powerUses.map(u=>`<option value="${esc(u)}">`).join("")}</datalist>` +
    powers.map(p=>`<div class="pick wi-row">
      <div class="wi-pair">
        <label class="field"><span>Name</span><input type="text" data-pwf="${esc(p.id)}|name" value="${esc(p.name)}"></label>
        <label class="field"><span>Uses</span><input type="text" list="power-uses" data-pwf="${esc(p.id)}|uses" value="${esc(p.uses)}" placeholder="SFR, TOL, a Kicker die…"></label>
      </div>
      <label class="field"><span>Effect</span><textarea rows="2" data-pwf="${esc(p.id)}|effect">${esc(p.effect)}</textarea></label>
      <button class="btn sm" data-pwrm="${esc(p.id)}" aria-label="Remove this power">Remove</button></div>`).join("") +
    `<button class="btn sm" data-pwadd>+ Add a power</button>`;
  h += textList("vulnerabilities", "Vulnerabilities", copy("writeInVulnerabilities"), "vulnerability");
  return h;
}

function renderHistory(){
  return `<label class="field"><span>History</span>
    <textarea data-id="history" placeholder="What shaped them? What do they owe, fear, or want?">${esc(S.ch.identity.history)}</textarea></label>`;
}

function renderSkills(){
  const ch=S.ch, pool=Engine.skillPool(ch), pl=Engine.powerLevel(ch);
  const left = pool.total-Engine.skillSpent(ch);
  // Focused Skills start higher (Decision 134); the header says by how much.
  const focused = Engine.focusedSkillIds(ch);
  const fCap = focused.length ? Engine.skillRankCap(ch, focused[0]) : null;
  const sum = [pool.base, ...pool.stats.map(x=>`${x.id} ${x.value}`), ...(pool.granted?[`${pool.granted} from Advantages`]:[])].join(" + ");
  let h = `<div class="roll-entry">
    <span class="pool">Pool <b>${pool.total}</b> <small>(${esc(sum)})</small> · Remaining <b>${left}</b> · Max Rank <b>${pl.maxSkillRank}</b>${fCap!=null&&fCap>pl.maxSkillRank?` · Focused <b>${fCap}</b>`:""}</span>
    <span class="dice-note">Trained checks: ${esc(D.skillCheckRules.trained)}. Untrained: ${esc(D.skillCheckRules.untrained)}.</span>
  </div>`;
  const dataWarns = D.skills.map(s=>Engine.skillLine(ch,s.id).dataWarning).filter(Boolean);
  if (dataWarns.length) h += `<div class="flag">⚑ Data issue: ${dataWarns.map(esc).join(" ")}</div>`;
  h += "@@BAR@@BAR";
  const cats = [["combat","Combat"],["utility","Utility"],["general","General"]], secs = sectionList("sk");
  for (const [cid,cname] of cats){
    h += secs.sect(cname) + `<div class="alloc" data-filterable>`;
    for (const s of D.skills.filter(x=>x.category===cid)){
      const rank = ch.skills[s.id]?ch.skills[s.id].rank:0;
      const line = Engine.skillLine(ch, s.id), cap = Engine.skillRankCap(ch, s.id);
      h += `<div class="alloc-row">
        <div class="name">${esc(s.name)}${focused.includes(s.id)?' <span class="chip gold">focused</span>':""} ${skillStatsHtml(line)}${foldBtn("skill|"+s.id, s.name)}<small${foldAttr("skill|"+s.id)}>${esc(s.description)}</small></div>
        ${stepper(rank, "skill|"+s.id, rank>0, rank<cap && left>0 && pool.total!=null, s.name)}
        <span class="mod ${line.trained?"pos":""}" title="check bonus">+${line.checkBonus}</span>
      </div>`;
      // A trained skill may demand choices of its own — Martial Arts styles
      // are the first, and the machinery is the same one the traits use.
      if (rank>0) h += picksHtml("skill", s.id);
    }
    h += `</div>`;
  }
  // P13: the CP step's sticky bar comes here: Remaining in view, a filter, and a jump to each group.
  const bar = jumpBarHtml(secs.list, { sticky:true, filter:{ value:S.skillFilter, placeholder:"Filter skills" },
    extra:`<span class="jump-cp ${left<0?"over":""}">Remaining <b>${left}</b> Skill Points</span>` });
  // A function, so a "$&" or "$'" typed in the filter is text, not a replacement pattern.
  return h.replace("@@BAR@@BAR", ()=>bar);
}

function renderCP(){
  const ch=S.ch, pl=Engine.powerLevel(ch), a=Engine.archetype(ch);
  const bal = Engine.cp(ch);
  // Decision 152: the classification says which Advantages are open.
  const cls = Engine.classification(ch), gated = !!cls && cls.advantages==="universal";
  const secs = sectionList("cp");
  let top = `<div class="roll-entry">
    <span class="pool" style="margin-left:0">Base <b>${bal.base}</b> + Disadvantages <b>${bal.granted}</b> = Budget <b>${bal.budget}</b> · Spent <b>${bal.spent}</b> · <span style="color:${bal.left<0?"var(--magenta)":"var(--gold)"}">Remaining <b>${bal.left}</b></span></span>
    <span class="dice-note">${esc(D.creationFlow.steps.find(s=>s.id==="character-points").note||"")}</span></div>`;
  if (gated) top += ruleHtml(`${a.name} · ${cls.name}: only Universal Advantages are open. Disadvantages, LUCK, and boosts remain open.`);

  // Disadvantages
  let h = secs.sect("Disadvantages", "Disadvantages — grant Character Points (no cap)");
  h += `<details class="group" open data-filterable><summary>${D.disadvantages.length} available</summary>` +
    D.disadvantages.map(dd=>{
      const cur = (ch.disadvantages.find(x=>x.id===dd.id)||{rank:0}).rank;
      const lock = Engine.optionLock(ch,"disadvantage",dd.id);
      const req  = Engine.requirementState(ch,"disadvantage",dd.id);
      return `<div class="pick ${cur>0?"selected":""}"${cur>0?" data-held":""}>${dd.flagged?flagHtml(dd):""}
        <div class="head"><h2>${esc(dd.name)}</h2>${foldBtn("disadvantage|"+dd.id, dd.name)}<span class="cost grant">+${dd.pointsGranted} CP/rank · max ${dd.maxRank}</span>
        ${constraintHtml("disadvantage",dd.id)}
        <div class="controls">${stepper(cur,"disadv|"+dd.id, cur>0, cur<dd.maxRank && !lock.locked && req.ok, dd.name)}</div></div>
        ${effectsHtml(ch,"disadvantage",dd.id)}
        <div class="desc"${foldAttr("disadvantage|"+dd.id)}>${esc(dd.description)}</div>
        ${cur>0?picksHtml("disadvantage",dd.id):""}</div>`;
    }).join("") + `</details>`;

  // Advantages
  h += secs.sect("Advantages", "Advantages — cost Character Points");
  // A gated classification sees what it can buy first, in the book's order, so a
  // Werewolf doesn't scroll past every Mortal-only Advantage to find its fifteen.
  const heldAdv = ad => ch.advantages.some(x=>x.id===ad.id && x.source!=="natural" && x.rank>0);
  const advList = gated ? D.advantages.filter(ad=>Engine.canBuyAdvantage(ch, ad)).concat(D.advantages.filter(ad=>!Engine.canBuyAdvantage(ch, ad) && heldAdv(ad))) : D.advantages;
  const openCount = gated ? D.advantages.filter(ad=>Engine.canBuyAdvantage(ch, ad)).length : D.advantages.length;
  const heldClosed = gated ? advList.length-openCount : 0;
  h += `<details class="group" open data-filterable><summary>${gated?`${openCount} open to ${esc(cls.name)}s${heldClosed?` · ${heldClosed} held that aren't`:""}`:`${openCount} available`}</summary>` +
    advList.map(ad=>{
      const cur = (ch.advantages.find(x=>x.id===ad.id && x.source!=="natural")||{rank:0}).rank;
      const natural = ch.advantages.find(x=>x.id===ad.id && x.source==="natural");
      const affordable = bal.left>=ad.cost;
      const lock = Engine.optionLock(ch,"advantage",ad.id);
      const req  = Engine.requirementState(ch,"advantage",ad.id);
      const open = Engine.canBuyAdvantage(ch, ad);
      return `<div class="pick ${cur>0?"selected":""}"${cur>0||(natural&&natural.rank>0)?" data-held":""}>${ad.flagged?flagHtml(ad):""}
        <div class="head"><h2>${esc(ad.name)}</h2>${foldBtn("advantage|"+ad.id, ad.name)}<span class="cost">${ad.cost} CP/rank · max ${ad.maxRank}</span>
        ${natural?`<span class="cost grant">natural ×${natural.rank}</span>`:""}
        ${gated&&ad.universal?`<span class="cost grant">Universal</span>`:""}
        ${constraintHtml("advantage",ad.id)}
        <div class="controls">${open?stepper(cur,"adv|"+ad.id, cur>0, cur<ad.maxRank && affordable && !lock.locked && req.ok, ad.name):cur>0?stepper(cur,"adv|"+ad.id, true, false, ad.name):`<span class="cost">Not for ${esc(cls.name)}s</span>`}</div></div>
        ${effectsHtml(ch,"advantage",ad.id)}
        <div class="desc"${foldAttr("advantage|"+ad.id)}>${esc(ad.description)}</div>
        ${(cur>0||(natural&&natural.rank>0))?picksHtml("advantage",ad.id):""}</div>`;
    }).join("") + `</details>`;

  // LUCK
  const luck = D.resources.luck;
  h += secs.sect("LUCK");
  if (luck.flagged) h += flagHtml(luck);
  const luckCan = Engine.canBoost(ch, "luck", "LUCK");
  h += `<div class="pick"><div class="head"><h2>Buy up LUCK</h2>${foldBtn("luck", "LUCK")}
    <span class="cost">${luck.cpCostPerPoint} CP a point · up to ${pl.maxBoost} (Max Character Point Boost)</span>
    <div class="controls">${stepper(luck.startingValue+ch.trackers.luck.bonus, "luck|x", ch.trackers.luck.bonus>0, luckCan.ok, "LUCK")}<span class="mod" title="${esc(luckCan.ok?"":luckCan.why)}">${luckCan.ok?"":"⛔"}</span></div></div>
    <div class="desc"${foldAttr("luck")}>Everyone starts at ${luck.startingValue}. ${esc(luck.refresh)}</div></div>`;

  // Disciplines: price, cap and starting ranks are the data's (Decision 135).
  const discs = Engine.disciplineRanks(ch);
  if (discs.length){
    const per = Engine.powerRankCost(), cap = Engine.disciplineCap(ch);
    h += secs.sect("Disciplines", `Disciplines — ${per} CP per rank${cap==null?"":` · cap ${cap}`}`);
    h += discs.map(d=>`<div class="pick ${d.rank>0?"selected":""}"><div class="head"><h2>${esc(d.name)}</h2>${d.description?foldBtn("disc|"+d.id, d.name):""}
        <span class="cost">${d.base?`starts at ${d.base} · `:""}rank ${d.rank}</span>
        <div class="controls">${stepper(d.rank,"disc|"+d.id, d.bought>0, (cap==null || d.rank<cap) && bal.left>=per, d.name)}</div></div>
        <div class="desc"${foldAttr("disc|"+d.id)}>${esc(d.description)}</div></div>`).join("");
  }

  // Powers CP raises (Decision 215): a held, ranked archetype power, Innate or
  // bought. The price is the Disciplines'; the cap is Max Power Rank (or the
  // book's printed maximum), not the lower Max Starting Rank.
  const pcs = Engine.powerCpState(ch);
  if (pcs.length){
    const per = Engine.powerRankCost();
    h += secs.sect("Powers", `Powers — ${per} CP per rank`);
    h += pcs.map(r=>`<div class="pick ${r.cp>0?"selected":""}"><div class="head"><h2>${esc(r.name)}</h2>
        <span class="cost">${r.start>1||r.cp?`starts at ${r.start} · `:""}rank ${r.rank}${r.cap==null?"":` · cap ${r.cap}`}</span>
        <div class="controls">${stepper(r.rank,"apow|"+r.id, r.cp>0, (r.cap==null || r.rank<r.cap) && bal.left>=per, r.name+" with CP")}</div></div></div>`).join("");
  }
  // CP on a power with no row (a hand-edited file, an undo): take-back only.
  const rowIds = new Set(pcs.map(r=>r.id)), cpOn = Engine.powerCpOf(ch);
  const strays = Object.keys(cpOn).filter(id=>!rowIds.has(id));
  const held = new Set(Engine.archetypePowers(ch).map(x=>x.id));
  if (strays.length){
    if (!pcs.length) h += secs.sect("Powers", `Powers — ${Engine.powerRankCost()} CP per rank`);
    h += strays.map(id=>{ const p = ((Engine.archetype(ch)||{}).powers||[]).find(x=>x && x.id===id);
      return `<div class="pick"><div class="head"><h2>${esc(p ? p.name : id)}</h2><span class="cost">${held.has(id) ? "no ranks to raise" : "not a power you hold"}</span>
        <div class="controls">${stepper(cpOn[id],"apow|"+esc(id), true, false, (p ? p.name : id)+" with CP")}</div></div></div>`; }).join("");
  }

  // Custom powers (Decision 216): a GM's gift to a character it is building,
  // for every archetype but the write-in one, whose powers are written free on
  // the Archetype step. One power rank's CP, or free as a GM grant; rank 1.
  if (!Engine.writeInOptions(ch)){
    const per = Engine.powerRankCost(), mine = Engine.ownPowers(ch);
    h += secs.sect("Custom powers", `Custom powers — a GM's, ${per} CP each, or free`);
    h += `<p class="step-note">${esc(copy("powerCustomNote"))}</p>`;
    h += mine.map(p=>`<div class="pick selected"><div class="head"><h2>${esc(p.name)||"Unnamed power"}</h2>
        <span class="cost">${p.boughtWithCp ? `${per} CP` : "GM grant"}</span>
        <div class="controls"><button class="toggle" data-pwrm="${esc(p.id)}" aria-label="Remove ${esc(p.name)||"this power"}">Remove</button></div></div>
        <div class="desc">${esc(p.effect)||"No effect written."}</div></div>`).join("");
    const short = bal.left < per;
    h += `<div class="pick wi-row pw-custom">
      <label class="field"><span>Name</span><input type="text" data-pwcustom="name"></label>
      <label class="field"><span>Description</span><textarea rows="2" data-pwcustom="effect"></textarea></label>
      <label class="check"><input type="checkbox" data-pwcustom-free> GM grant (free)</label>
      <button class="btn" data-pwcustom-go ${short?"disabled":""}>Add power</button>
      <span class="step-note" data-pwcustom-why ${short?"":"hidden"}>No Character Points left.</span></div>`;
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
      return `<div class="pick selected"><div class="head"><h2>${esc(l.name)}</h2>${foldBtn("spell|"+l.index, l.name)}
        <span class="cost">${esc(l.tier)} · TN ${l.tn==null?"—":l.tn} · TH ${l.th==null?"—":l.th}</span>
        ${over?`<span class="cost over">needs ${esc(ss.discipline)} ${l.printedTH}</span>`:""}
        <div class="controls"><button class="toggle" data-startrm="${l.index}">Remove</button></div></div>
        <div class="desc"${foldAttr("spell|"+l.index)}>${spText(l.sp&&l.sp.effect, l.effect||"")}</div></div>`;
    }).join("");
    h += `<button class="btn" data-spellpickopen="wizard">Choose from the book</button>`;
  }

  // Boosts
  h += secs.sect("CP Boosts", `Character Point Boosts — leftover CP on Stats &amp; Skills · Max CP Boost +${pl.maxBoost}, LUCK included`);
  if (D.creationFlow.boostRules.flagged) h += flagHtml(D.creationFlow.boostRules);
  h += `<div class="alloc">`;
  for (const s of D.stats){
    const times = Engine.boostsFor(ch,"stat",s.id);
    const can = Engine.canBoost(ch,"stat",s.id);
    h += `<div class="alloc-row"><div class="name">${s.id} <small>value ${Engine.statValue(ch,s.id)}</small></div>
      ${stepper(times,"boost|stat|"+s.id, times>0, can.ok, "boosts to "+s.name)}<span class="mod" title="${esc(can.ok?"":can.why)}">${can.ok?"":"⛔"}</span></div>`;
  }
  h += `</div><div class="alloc" style="margin-top:14px">`;
  for (const id of Object.keys(ch.skills)){
    const def = Engine.skillById(id); if (!def) continue;
    const times = Engine.boostsFor(ch,"skill",id);
    const can = Engine.canBoost(ch,"skill",id);
    h += `<div class="alloc-row"><div class="name">${esc(def.name)} <small>rank ${Engine.skillLine(ch,id).rank}</small></div>
      ${stepper(times,"boost|skill|"+id, times>0, can.ok, "boosts to "+def.name)}<span class="mod" title="${esc(can.ok?"":can.why)}">${can.ok?"":"⛔"}</span></div>`;
  }
  if (!Object.keys(ch.skills).length) h += `<p class="step-note">Train skills in Step 6 to boost them here.</p>`;
  h += `</div>`;
  // W22: step 7 is the longest page in the app, so a bar sticks under the
  // header with a filter over the picks, a jump to each section, and the CP
  // still to spend.
  const left = `<button class="jump" type="button" data-heldonly aria-pressed="${!!S.cpHeld}">Held only</button><span class="jump-cp ${bal.left<0?"over":""}">Remaining <b>${bal.left}</b> CP</span>`;
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
  h += `<div class="review-block"><h2>${esc(charName(ch, "Unnamed"))}</h2>${intakeHtml(ch)}<div class="kv">
    <span class="k">Archetype</span><span class="v">${a?esc(Engine.archetypeContent(ch).name):"—"}${Engine.specializationLabel(ch)?" · "+esc(Engine.specializationLabel(ch)):""}${a&&a.status!=="final"?" · "+esc(statusLabel(a.status)):""}</span>
    <span class="k">Power Level</span><span class="v">${esc(pl.name)}</span>
    <span class="k">Stats</span><span class="v">${D.stats.map(s=>s.id+" "+t[s.id].value).join(" · ")}</span>
    <span class="k">Derived</span><span class="v">TOL ${der.TOL} · WILL ${der.WILL} · SAN ${der.SAN}% · ${hp.levels} HL / ${hp.total} HP · LUCK ${D.resources.luck.startingValue+ch.trackers.luck.bonus}</span>
    <span class="k">Skills</span><span class="v">${Object.keys(ch.skills).map(id=>{const l=Engine.skillLine(ch,id);return esc(l.def.name)+" "+l.rank;}).join(" · ")||"—"}</span>
    <span class="k">Advantages</span><span class="v">${ch.advantages.map(x=>{const d2=Engine.advById(x.id);return esc(d2?d2.name:x.id)+(x.rank>1?" ×"+x.rank:"")+(x.source==="natural"?" (natural)":"");}).join(" · ")||"—"}</span>
    <span class="k">Disadvantages</span><span class="v">${ch.disadvantages.map(x=>{const d2=Engine.disById(x.id);return esc(d2?d2.name:x.id)+(x.rank>1?" ×"+x.rank:"");}).join(" · ")||"—"}</span>
    <span class="k">Boost ledger</span><span class="v">${ch.creation.boosts.map(b=>esc(b.targetId)+" ×"+b.times).join(" · ")||"—"}</span>
  </div></div>`;
  h += wizIssuesHtml(issues);
  h += `<div class="wiznav">
    <button class="btn" data-nav="-1">Back</button>
    <button class="btn" data-export="draft">Export draft</button>
    <button class="btn go" data-lock="1" ${blocked?"disabled":""}>Lock &amp; Export</button>
    ${wizWhyHtml(navErrors(issues))}
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
  const bits=[arch?Engine.archetypeContent(c).name:"", whenText(e.changed)?"changed "+whenText(e.changed):""].filter(Boolean).map(esc).join(" · ");
  return `<li class="roster-card" data-card="${id}">
    <div class="roster-top"><b class="roster-name">${esc(charName(c, "Unnamed"))}</b><span class="roster-where">${esc(where)}</span></div>
    <div class="roster-meta"><span class="roster-tag">${esc(Engine.tagNumber(c)||e.id)}</span>${bits?" · "+bits:""}</div>
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
  renderTopChrome(); closeVitals(); renderDrawer();   // a pinned panel goes with the sheet
  releaseMain();
  const roster = rosterEntries(), tables = gmTableEntries();
  $("main").innerHTML = `<div class="home-hero">
    <h1>Character Intake</h1>
    <p>NYTE City doesn't care who you were. Build who you're going to be.</p>
    <div class="home-actions">
      <button class="btn go" id="btn-new">New character</button>
      <button class="btn" id="btn-import">${featureOn("gm")?"Import a file":"Import .shadows.json"}</button>
      <input type="file" id="file-import" accept=".json,.shadows.json" style="display:none">
    </div>
    ${roster.length?`<section class="roster" aria-labelledby="roster-h">
      <h2 id="roster-h" class="roster-h">Your characters</h2>
      <ul class="roster-list">${roster.map(rosterCardHtml).join("")}</ul>
      <p class="step-note">Characters stay in this browser until you remove them, but it isn't a backup: clearing site data erases every one. The exported <span style="font-family:var(--mono)">.shadows.json</span> is the copy that lasts.</p>
    </section>`:""}${gmTablesHtml(tables)}
    <div class="home-news" id="homenews">${whatsNewHomeHtml()}</div>
    <p class="step-note" style="margin-top:14px">Playing at the table instead? <button class="btn sm" id="btn-print-blank">Print a blank character sheet</button></p>${gmDoorHtml()}
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
      let raw;
      try{ raw=JSON.parse(rd.result); }
      catch(err){ notice(featureOn("gm") ? GM_NOT_A_FILE : "That file didn't parse as a character: "+err.message); return; }
      // Read the file's kind before anything else: migrate() reads any object as
      // a character, so a table file used to open as a blank one (Decision 170).
      const kind=Engine.fileKind(raw);
      if ((kind==="table" || kind==="pack") && featureOn("gm")){ gmImportFile(raw, kind); return; }
      if (kind!=="character"){ notice(featureOn("gm") ? GM_NOT_A_FILE : "That file isn't a character."); return; }
      let c;
      try{ c=Engine.migrate(raw); }
      catch(err){ notice("That file didn't parse as a character: "+err.message); return; }
      const locked=!!(c.creation && c.creation.locked), id=intakeOf(c);
      // A different character is added. The only question left is a file
      // older than the copy this browser keeps of the same character (B18).
      const have=(savedChar(id)||{}).ch;
      guardReplace(have, c, { title:`Open an older copy of ${charName(have)}?`,
        lead:`This file is an older copy of <b>${esc(charName(c))}</b> (${esc(Engine.tagNumber(c))}) than the one saved in this browser. Opening it puts it in place of the newer one.`,
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
  bindGmHome(tables);
  renderLedger(); renderVitals();
}

const RENDER = { "power-level":renderPowerLevel, "concept":renderConcept, "stats":renderStats,
  "archetype":renderArchetype, "history":renderHistory, "skills":renderSkills,
  "character-points":renderCP, "review":renderReview };

// ── Wizard event wiring ──────────────────────────────────────────────
// Runs on the sheet too, for what both screens share: Home, the load notice.
function bindMain(){
  const main=$("main"), ch=S.ch;
  // navigation
  main.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>{
    S.step = Math.max(0, Math.min(STEPS.length-1, S.step+Number(b.dataset.nav)));
    S.maxReached = Math.max(S.maxReached, S.step);
    window.scrollTo(0,0); update();
  });
  main.querySelectorAll("[data-importdismiss]").forEach(b=>b.onclick=()=>{ S.importIssues=[]; update(); });
  // selections
  main.querySelectorAll("[data-pl]").forEach(b=>b.onclick=()=>{ ch.creation.powerLevel=b.dataset.pl; update(); });
  main.querySelectorAll("[data-stat-rolled]").forEach(b=>b.onchange=()=>{ ch.creation.statMethod=b.checked?"rolled":"flat"; update(); });
  main.querySelectorAll("[data-arch]").forEach(b=>b.onclick=()=>{
    if (ch.identity.archetype!==b.dataset.arch){
      ch.identity.archetype=b.dataset.arch;
      resetArchetypeChoices(ch);
    }
    update();
  });
  // One handler for every archetype's specialization (A3). Single-select
  // replaces; multi-select toggles. Over-picking is deliberately allowed —
  // validate() says "Too many", and an error you can read beats a click that
  // silently does nothing.
  main.querySelectorAll("[data-spec]").forEach(b=>b.onclick=()=>{
    const id=b.dataset.spec, ac=ch.archetypeChoices;
    if (!Array.isArray(ac.specialization)) ac.specialization=[];
    const before = ac.specialization[0];
    if (Engine.specializationNeed(ch) <= 1) ac.specialization=[id];
    else {
      const i=ac.specialization.indexOf(id);
      if (i>=0) ac.specialization.splice(i,1); else ac.specialization.push(id);
    }
    // The Professional's focused-skill and natural-advantage pools hang off
    // the subtype, so changing it invalidates both — including the entries
    // natural advantages mirror into ch.advantages, which the old
    // single-select handler cleared on one side only.
    if (ac.specialization[0]!==before){
      ac.focusedSkillPicks=[]; ac.naturalAdvantages=[];
      ch.advantages=ch.advantages.filter(x=>x.source!=="natural");
      // Decision 200: the choices were the old Bloodline's, and so were the
      // Base Powers placed in its powers. Innate ones stay where they are.
      ac.optionPicks={};
      const pool=new Set(Engine.powerPool(ch).map(p=>p.id));
      for (const id of Object.keys(ac.basePowers||{})) if (!pool.has(id)) delete ac.basePowers[id];
      for (const id of Object.keys(ac.powerCp||{})) if (!pool.has(id)) delete ac.powerCp[id];
    }
    update();
  });
  // A specialization's creation choices (Decision 200). Picking redraws;
  // typing a tenet saves without one, so focus stays put.
  main.querySelectorAll("[data-optpick]").forEach(b=>b.onclick=()=>{
    const [cid, val]=b.dataset.optpick.split("|");
    Engine.setOptionPick(ch, cid, val); update();
  });
  main.querySelectorAll("[data-opttext]").forEach(inp=>inp.oninput=()=>{
    const [cid, fid]=inp.dataset.opttext.split("|");
    Engine.setOptionPick(ch, cid, inp.value, fid); update(false); refreshNav();
  });
  // Pick controls. `data-sel` is "<kind>|<entryId>|<pickId>|<slot>"; the
  // engine owns distinctness and the slot cap, so a refusal comes back with a
  // reason and the control simply re-renders to what is actually stored.
  const applySel = (el, val) => {
    const [kind, entryId, pickId, slot] = el.dataset.sel.split("|");
    const r = Engine.setSelection(ch, kind, entryId, pickId, Number(slot), val);
    if (!r.ok && r.why) el.title = r.why;
    return r;
  };
  main.querySelectorAll("select[data-sel]").forEach(el=>el.onchange=()=>{ applySel(el, el.value); update(); });
  main.querySelectorAll("input[data-sel]").forEach(el=>el.oninput=()=>{
    applySel(el, el.value);
    update(false); refreshNav();
  });
  main.querySelectorAll("[data-fskill]").forEach(b=>b.onclick=()=>{
    const r = Engine.toggleFocusedPick(ch, b.dataset.fskill);
    if (!r.ok && r.why) b.title = r.why;
    update();
  });
  // steppers
  main.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{
    const [key,delta]=b.dataset.step.split("|").reduce((acc,part,i,arr)=>{
      if(i===arr.length-1) acc[1]=Number(part); else acc[0]=(acc[0]?acc[0]+"|":"")+part; return acc; },[null,0]);
    applyStep(key, delta); update(); announceStep(b.dataset.step);
  });
  main.querySelectorAll("[data-stat-floor]").forEach(b=>b.onclick=()=>{
    const r = Engine.raiseStatsToFloor(ch);
    if (r.ok && r.short.length){
      const names = r.short.map(statNameOf);
      S.statNote = `Not enough Stat Points to bring ${names.length>1 ? names.slice(0,-1).join(", ")+" and "+names[names.length-1] : names[0]} up to ${Engine.statFloor()}.`;
    }
    const note = S.statNote;
    update();
    // The button may now be disabled, which drops focus to <body>: land on the pool line.
    if (document.activeElement===document.body || !document.activeElement){
      const pool = main.querySelector(".roll-entry .pool");
      if (pool){ pool.tabIndex=-1; pool.focus({ preventScroll:true }); }
    }
    const left = Engine.statPool(ch).total - Engine.statSpent(ch);
    announce(`${note || `Every stat is at ${Engine.statFloor()}.`} ${left} Stat Points left.`);
  });
  // dice rolls — re-render main so pool-gated steppers enable, but keep focus on the input
  const rerenderKeepFocus = (selAttr, val) => {
    update(); // full re-render: steppers re-evaluate against the new pool
    const again = main.querySelector(`[${selAttr}]`);
    if (again){ again.focus(); try{ again.setSelectionRange(String(val).length, String(val).length); }catch(e){} }
  };
  main.querySelectorAll("[data-roll]").forEach(inp=>inp.oninput=()=>{
    const clean = inp.value.replace(/[^0-9]/g,"");
    if (clean !== inp.value) inp.value = clean;
    ch.creation.rolls[inp.dataset.roll] = clean===""?null:Math.max(0,Number(clean));
    rerenderKeepFocus(`data-roll="${inp.dataset.roll}"`, clean);
  });
  main.querySelectorAll("[data-archroll]").forEach(inp=>inp.oninput=()=>{
    const clean = inp.value.replace(/[^0-9]/g,"");
    if (clean !== inp.value) inp.value = clean;
    ch.archetypeChoices.rolls[inp.dataset.archroll] = clean===""?null:Math.max(0,Number(clean));
    rerenderKeepFocus(`data-archroll="${inp.dataset.archroll}"`, clean);
  });
  // Jump bars (W5, W22). The filter works on the rendered page, so typing
  // keeps focus; S.cpFilter carries it across the re-render a stepper causes.
  main.querySelectorAll("[data-jump]").forEach(b=>b.onclick=()=>jumpTo(b.dataset.jump));
  // The Skills step's filter is its own (S.skillFilter); Held only is the CP step's.
  const jf=main.querySelector("[data-jumpfilter]"), heldBtn=main.querySelector("[data-heldonly]");
  const fkey = STEPS[S.step] && STEPS[S.step].id==="skills" ? "skillFilter" : "cpFilter";
  if (jf){
    const run=()=>{ const held=!!S.cpHeld && !!heldBtn, r=applyPickFilter(main, jf.value, { held }), c=main.querySelector("[data-jumpcount]");
      if (c) c.textContent = held ? `${r.held} held` : r.active ? `${r.shown} of ${r.total}` : ""; };
    jf.oninput=()=>{ S[fkey]=jf.value; run(); };
    if (heldBtn) heldBtn.onclick=()=>{ S.cpHeld=!S.cpHeld; heldBtn.setAttribute("aria-pressed", String(!!S.cpHeld)); run(); };
    run();
  }
  bindFolds(main);
  // The book's spell picker, a modal on the sheet and in the wizard (Decision 111)
  main.querySelectorAll("[data-spellpickopen]").forEach(b=>b.onclick=()=>openSpellPicker(b.dataset.spellpickopen));
  main.querySelectorAll("[data-startrm]").forEach(b=>b.onclick=()=>{ Engine.removeGrimoireRow(ch, Number(b.dataset.startrm)); update(); });
  // identity / history text
  main.querySelectorAll("[data-id]").forEach(inp=>inp.oninput=()=>{
    const k=inp.dataset.id;
    ch.identity[k] = inp.type==="number" ? (inp.value===""?null:Number(inp.value)) : inp.value;
    update(false); refreshNav();
  });
  main.querySelectorAll("[data-tagless]").forEach(b=>b.onclick=()=>{ ch.identity.tagless = b.dataset.tagless==="1"; update(); });
  bindWriteIn(main, ch);
  // export / lock
  main.querySelectorAll("[data-export]").forEach(b=>b.onclick=()=>exportChar());
  main.querySelectorAll("[data-lock]").forEach(b=>b.onclick=()=>{
    // Locking turns this character's own entry into a sheet (Decision 141):
    // nothing else is replaced, so nothing is asked. It saves before it
    // exports, so the file holds what's stored and Home shows no marker.
    ch.creation.locked=true;
    S.ch=Engine.migrate(Engine.buildExport(ch));
    S.screen="sheet"; S.section="main"; S.issued=true;
    window.scrollTo(0,0); update();
    // W46 (Decision 163): the export stays in this click, so the download
    // keeps its permission; the TAG prints alongside it, never in front.
    const file=exportChar(), C=D.appCopy||{};
    const say=(S.ch.identity.tagless ? C.lockIssuedTagless : C.lockIssued)||"";
    if (say) notice(say.replace("{tag}", Engine.tagNumber(S.ch)).replace("{file}", file));
    const title=document.querySelector("#main h1");
    if (title){ title.tabIndex=-1; title.focus({preventScroll:true}); }
  });
}

// The write-in block's controls (Decision 153). Typing saves without a
// redraw; adding, removing and picking redraw, and an added row takes focus.
function bindWriteIn(main, ch){
  const w = ch.archetypeChoices.writeIn;
  if (!w || typeof w!=="object") return;
  const typed = () => { update(false); refreshNav(); };
  const focusLast = sel => { const all = main.querySelectorAll(sel); if (all.length) all[all.length-1].focus(); };
  main.querySelectorAll("[data-wi]").forEach(inp=>inp.oninput=()=>{
    const k = inp.dataset.wi;
    w[k] = k==="description" && inp.value==="" ? null : inp.value;
    typed();
  });
  main.querySelectorAll("[data-wicls]").forEach(b=>b.onclick=()=>{
    w.classification = b.dataset.wicls;
    // Decision 152: a classification that can't buy an Advantage drops it.
    ch.advantages = ch.advantages.filter(x=>x.source==="natural" || Engine.canBuyAdvantage(ch, x.id));
    update();
  });
  main.querySelectorAll("[data-wimech]").forEach(box=>box.onchange=()=>{
    const id = box.dataset.wimech, on = new Set(Array.isArray(w.mechanics) ? w.mechanics : []);
    box.checked ? on.add(id) : on.delete(id);
    w.mechanics = [...on];
    update();
  });
  main.querySelectorAll("[data-wirow]").forEach(inp=>inp.oninput=()=>{
    const [key, i, field] = inp.dataset.wirow.split("|"), row = (w[key]||[])[Number(i)];
    if (row) { row[field] = inp.value; typed(); }
  });
  main.querySelectorAll("[data-wiadd]").forEach(b=>b.onclick=()=>{
    const key = b.dataset.wiadd;
    if (!Array.isArray(w[key])) w[key] = [];
    w[key].push({ name:"", description:"" });
    update(); focusLast(`[data-wirow^="${key}|"][data-wirow$="|name"]`);
  });
  main.querySelectorAll("[data-wirm]").forEach(b=>b.onclick=()=>{
    const [key, i] = b.dataset.wirm.split("|");
    if (Array.isArray(w[key])) w[key].splice(Number(i), 1);
    update();
  });
  main.querySelectorAll("[data-pwf]").forEach(inp=>inp.oninput=()=>{
    const [id, field] = inp.dataset.pwf.split("|"), row = (ch.powers||[]).find(p=>p && p.id===id);
    if (row) { row[field] = inp.value; typed(); }
  });
  main.querySelectorAll("[data-pwadd]").forEach(b=>b.onclick=()=>{
    if (Engine.newPower(ch).ok) { update(); focusLast(`[data-pwf$="|name"]`); }
  });
  main.querySelectorAll("[data-pwrm]").forEach(b=>b.onclick=()=>{ Engine.removePower(ch, b.dataset.pwrm); update(); });
  // Custom power on the CP step (Decision 216): its Add is off, with its
  // reason, while CP is short and the box (a GM grant) is unticked.
  const cpFree = main.querySelector("[data-pwcustom-free]"), cpGo = main.querySelector("[data-pwcustom-go]");
  if (cpFree && cpGo){
    const gate = () => { const short = cpFree.checked ? false : (Engine.cp(ch).left < Engine.powerRankCost());
      cpGo.disabled = short; const why = main.querySelector("[data-pwcustom-why]"); if (why) why.hidden = !short; };
    cpFree.onchange = gate; gate();
    cpGo.onclick = ()=>{
      const input = { free: cpFree.checked };
      main.querySelectorAll("[data-pwcustom]").forEach(el=>{ input[el.dataset.pwcustom] = el.value; });
      const r = Engine.addCustomPower(ch, input, { creation:true });
      if (!r.ok){ notice(r.why); return; }
      update();
    };
  }
}

function refreshNav(){
  // re-evaluate Continue button + issue list without nuking input focus
  const st=STEPS[S.step]; if(!st) return;
  const nav=document.querySelector(".wiznav"); if(!nav) return;
  const issues=Engine.validate(st.id,S.ch), errors=navErrors(issues);
  const btn=nav.querySelector('[data-nav="1"]');
  if(btn) btn.disabled=errors>0;
  const lock=nav.querySelector("[data-lock]");
  if(lock) lock.disabled=errors>0;
  const old=document.getElementById("wiz-issues"); if(old) old.remove();
  nav.insertAdjacentHTML("beforebegin", wizIssuesHtml(issues));
  const why=nav.querySelector(".wiznav-why"); if(why) why.remove();
  nav.insertAdjacentHTML("beforeend", wizWhyHtml(errors));
}

function applyStep(key, delta){
  const ch=S.ch, [kind,...rest]=key.split("|"), id=rest.join("|");
  if (kind==="stat"){
    const v=ch.stats[id].base+delta;
    if (v<D.statRules.base || v>D.statRules.max) return;
    ch.stats[id].base=v;
  }
  if (kind==="skill"){
    const cur=ch.skills[id]?ch.skills[id].rank:0, v=cur+delta;
    const pl=Engine.powerLevel(ch);
    if (v<0||v>Engine.skillRankCap(ch,id)) return;
    if (v===0) delete ch.skills[id];
    else {
      const prev = ch.skills[id] || {};
      ch.skills[id] = Object.assign({}, prev, {rank:v, ipe:prev.ipe||0});
      Engine.trimSelections(ch,"skill",id);
    }
  }
  if (kind==="focus"){
    const cur=ch.archetypeChoices.focusAllocation[id]||0, v=cur+delta;
    if (v<0) return; ch.archetypeChoices.focusAllocation[id]=v;
    if (v===0) delete ch.archetypeChoices.focusAllocation[id];
  }
  if (kind==="wwbonus"){
    const cur=ch.archetypeChoices.statBonusAllocation[id]||0, v=cur+delta;
    if (v<0) return; ch.archetypeChoices.statBonusAllocation[id]=v;
    if (v===0) delete ch.archetypeChoices.statBonusAllocation[id];
  }
  if (kind==="natadv"){
    const list=ch.archetypeChoices.naturalAdvantages;
    let e=list.find(n=>n.id===id);
    if (!e && delta>0){ e={id, rank:0}; list.push(e); }
    if (!e) return;
    e.rank=Math.max(0,e.rank+delta);
    if (e.rank===0) ch.archetypeChoices.naturalAdvantages=list.filter(n=>n!==e);
    // Mirror into advantages with source:"natural". The mirror is rebuilt from
    // the ledger each time, so any `selections` the row was carrying have to
    // be carried across — dropping them would silently wipe a player's picks
    // on every rank change.
    const keep = new Map(ch.advantages.filter(x=>x.source==="natural" && x.selections)
                                      .map(x=>[x.id, x.selections]));
    ch.advantages=ch.advantages.filter(x=>x.source!=="natural")
      .concat(ch.archetypeChoices.naturalAdvantages.map(n=>{
        const row={id:n.id, rank:n.rank, notes:"", source:"natural"};
        if (keep.has(n.id)) row.selections=keep.get(n.id);
        return row;
      }));
    Engine.trimSelections(ch,"advantage",id);
  }
  if (kind==="adv"){
    let e=ch.advantages.find(x=>x.id===id && x.source!=="natural");
    if (!e && delta>0){ e={id, rank:0, notes:""}; ch.advantages.push(e); }
    if (!e) return;
    e.rank=Math.max(0,e.rank+delta);
    if (e.rank===0) ch.advantages=ch.advantages.filter(x=>x!==e);
    else Engine.trimSelections(ch,"advantage",id);
  }
  if (kind==="disadv"){
    let e=ch.disadvantages.find(x=>x.id===id);
    if (!e && delta>0){ e={id, rank:0, notes:""}; ch.disadvantages.push(e); }
    if (!e) return;
    e.rank=Math.max(0,e.rank+delta);
    if (e.rank===0) ch.disadvantages=ch.disadvantages.filter(x=>x!==e);
    else Engine.trimSelections(ch,"disadvantage",id);
  }
  if (kind==="luck"){ ch.trackers.luck.bonus=Math.max(0, ch.trackers.luck.bonus+delta); }
  if (kind==="disc"){
    const cur=ch.archetypeChoices.disciplines[id]||0, v=cur+delta;
    if (v<0) return; ch.archetypeChoices.disciplines[id]=v;
    if (v===0) delete ch.archetypeChoices.disciplines[id];
  }
  if (kind==="bp") Engine.placeBasePower(ch, id, delta);
  if (kind==="apow") Engine.buyPowerRank(ch, id, delta);
  if (kind==="boost"){ const [type,tid]=[rest[0],rest.slice(1).join("|")]; Engine.addBoost(ch,type,tid,delta); }
}
