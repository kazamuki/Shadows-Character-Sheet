/*UI-START*/
(() => {
  // THE APP VERSION. Single source of truth — `package.json` mirrors it and
  // `tests/docs.test.mjs` fails the build if the two drift, or if `STATE.md`
  // disagrees. It renders in the footer so Ken and Claude can confirm they are
  // looking at the same build before debugging anything.
  //
  // Bump it when a PLAYER can see a difference (Decision 75):
  //   patch — a visible fix, nothing new
  //   minor — a capability a player can use that wasn't there before
  //   major — existing character files or the workflow break
  // The other three versions have their own triggers; see CLAUDE.md.
  const APP_VERSION = "0.5.0";

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

  // ── Ledger ───────────────────────────────────────────────────────────
  function renderLedger(){
    const el = $("ledger");
    if (S.screen==="sheet"){ el.innerHTML=""; return; }   // nav moved to the top tab bar
    if (S.screen!=="wizard"){ el.innerHTML=""; return; }
    el.innerHTML = `<h2>Intake Ledger</h2>` + STEPS.map((st,i)=>{
      const done = i < S.step && Engine.validate(st.id,S.ch).every(x=>x.level!=="error");
      const cls = ["step-row", i===S.step?"active":"", done?"done":""].join(" ");
      const dis = i>S.maxReached ? "disabled":"";
      return `<button class="${cls}" data-goto="${i}" ${dis}><span class="n">${done?"✓":st.n}</span>${esc(st.label.split(":")[0].split(" - ")[0])}</button>`;
    }).join("");
    el.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>{ S.step=Number(b.dataset.goto); update(); });
  }

  // ── Vitals rail ──────────────────────────────────────────────────────
  let lastVitals = {};
  function vrow(k,v,cls="",ico=""){
    const changed = lastVitals[k]!==undefined && lastVitals[k]!==String(v);
    lastVitals[k]=String(v);
    const svg = ico && iconSvg(ico);
    const key = svg ? `<span class="k withico"><span class="ico">${svg}</span>${k}</span>` : `<span class="k">${k}</span>`;
    return `<div class="vrow">${key}<span class="v ${cls} ${changed?"pulse":""}">${v}</span></div>`;
  }
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
      h += vrow("Ç", ch.trackers.credits.current, "gold");
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

  // ── Shared widgets ───────────────────────────────────────────────────
  function stepper(val, dataAttr, downOk, upOk){
    return `<div class="stepper">
      <button data-step="${dataAttr}|-1" ${downOk?"":"disabled"} aria-label="decrease">−</button>
      <span class="val">${val}</span>
      <button data-step="${dataAttr}|1" ${upOk?"":"disabled"} aria-label="increase">+</button></div>`;
  }
  function issuesHtml(list){
    if (!list.length) return "";
    return `<ul class="issues">`+list.map(i=>`<li class="${i.level}">${esc(i.msg)}</li>`).join("")+`</ul>`;
  }
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
    return `<div class="eyebrow">Step ${st.n} of ${STEPS.length}</div>
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
          <span>Ç <b>${p.startingCredits.roll}×${p.startingCredits.multiplier}</b></span>
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
    if (sel.gameplayStyle) h += `<p class="step-note" style="margin-top:16px">${esc(sel.gameplayStyle)}</p>`;

    const row = Engine.scalingRow(ch);
    const pl = Engine.powerLevel(ch);
    if (row && Object.keys(row).length){
      h += `<div class="sect">Campaign Power Scaling — ${esc(pl.name)}</div>`;
      h += `<table class="ref"><tbody>` + Object.entries(row).map(([k,v])=>
        `<tr><td>${esc(k.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase()))}</td><td class="num">${esc(v)}</td></tr>`).join("") + `</tbody></table>`;
      if (sel.campaignPowerScaling.notes) h += `<p class="step-note">${esc(sel.campaignPowerScaling.notes)}</p>`;
    }

    // Specialization
    if (sel.specialization && sel.specialization.options && sel.specialization.options.length){
      h += `<div class="sect">${esc(sel.specialization.label)}</div>`;
      if (sel.specialization.intro) h += `<p class="step-note">${esc(sel.specialization.intro)}</p>`;
      h += sel.specialization.options.map(o=>{
        const seld = ch.identity.specialization===o.id;
        let req = "";
        if (o.requiredStats){
          const unmet = Object.entries(o.requiredStats).filter(([sid,r])=>Engine.statValue(ch,sid)<r);
          req = `<span class="cost ${unmet.length?"":"grant"}">requires ${Object.entries(o.requiredStats).map(([s,r])=>s+" "+r).join(", ")}</span>`;
        }
        return `<div class="pick ${seld?"selected":""}">
          <div class="head"><h4>${esc(o.name)}</h4>${req}
            <div class="controls"><button class="toggle" data-spec="${o.id}">${seld?"Selected":"Select"}</button></div></div>
          <div class="desc">${esc(o.description||"")}</div>
          ${o.focusedSkills?`<div class="desc"><b>Focused Skills:</b> ${o.focusedSkills.map(esc).join(", ")}</div>`:""}
          ${o.tweak?`<div class="desc"><b>Tweak — ${esc(o.tweak.name)}:</b> ${esc(o.tweak.description)} ${(o.tweak.benefits||[]).map(esc).join(" ")}</div>`:""}
          ${o.benefit?`<div class="desc"><b>Benefit:</b> ${esc(o.benefit)}</div>`:""}
          ${o.transformation?`<div class="desc"><b>Transformation:</b> ${esc(o.transformation)}</div>`:""}
        </div>`;
      }).join("");
    } else if (sel.specialization && sel.specialization.required){
      h += `<div class="sect">${esc(sel.specialization.label)}</div>
        <p class="step-note">${esc(copy("specializationUnwritten").replace("{label}", sel.specialization.label))}</p>`;
    }

    // Arcanist creation inputs
    if (sel.id==="arcanist" && row){
      h += `<div class="sect">Focus Stat Bonus</div>
        <div class="roll-entry"><span class="die">${esc(row.focusStatBonusRoll)}</span>
        <input type="text" inputmode="numeric" pattern="[0-9]*" data-archroll="focusStatBonus" value="${ac.rolls.focusStatBonus==null?"":ac.rolls.focusStatBonus}" aria-label="focus stat bonus roll">
        <span class="pool">Allocate among INT · COOL · EMP — these points can push a stat past 10.</span></div>`;
      const total = ac.rolls.focusStatBonus||0;
      const used = Object.values(ac.focusAllocation).reduce((s,v)=>s+v,0);
      h += `<div class="alloc">` + ["INT","COOL","EMP"].map(sid=>{
        const v = ac.focusAllocation[sid]||0;
        return `<div class="alloc-row"><div class="name">${sid} <small>current ${Engine.statValue(ch,sid)}</small></div>
          ${stepper(v,"focus|"+sid, v>0, used<total)}<span class="mod"></span></div>`;
      }).join("") + `</div>`;

      const need = row.aberrations||0;
      h += `<div class="sect">Aberrations — choose ${need}</div>`;
      h += sel.specialization.options.map(o=>{
        const on = ac.aberrations.includes(o.id);
        return `<div class="pick ${on?"selected":""}"><div class="head"><h4>${esc(o.name)}</h4>
          <div class="controls"><button class="toggle" data-aber="${o.id}">${on?"Chosen":"Choose"}</button></div></div>
          <div class="desc">${esc(o.description||"")} ${o.benefit?"— "+esc(o.benefit):""}</div></div>`;
      }).join("");
      h += `<p class="step-note">${esc(copy("applyFromText"))} Evocation starts at rank ${row.evocationStartingRank}; Common Spells (${esc(row.commonSpells)}) are chosen from the Magic section in play.</p>`;
    }

    // Werewolf creation inputs
    if (sel.id==="werewolf" && row && row.statBonusRoll){
      h += `<div class="sect">Stat Bonus</div>
        <div class="roll-entry"><span class="die">${esc(row.statBonusRoll)}</span>
        <input type="text" inputmode="numeric" pattern="[0-9]*" data-archroll="statBonus" value="${ac.rolls.statBonus==null?"":ac.rolls.statBonus}" aria-label="stat bonus roll">
        <span class="pool">Allocate to any Stats (cap 10).</span></div>`;
      const total = ac.rolls.statBonus||0;
      const used = Object.values(ac.statBonusAllocation).reduce((s,v)=>s+v,0);
      h += `<div class="alloc">` + D.stats.map(s=>{
        const v = ac.statBonusAllocation[s.id]||0;
        return `<div class="alloc-row"><div class="name">${s.id} <small>current ${Engine.statValue(ch,s.id)}</small></div>
          ${stepper(v,"wwbonus|"+s.id, v>0, used<total && Engine.statValue(ch,s.id)<D.statRules.max)}<span class="mod"></span></div>`;
      }).join("") + `</div>`;
    }

    // Professional creation inputs
    if (sel.id==="professional"){
      const sub = (sel.specialization.options||[]).find(o=>o.id===ac.subtype);
      if (sub){
        const chooseN = (sub.focusedSkills||[]).filter(f=>/chosen at creation/i.test(f));
        if (chooseN.length){
          const m=/^(\d+)/.exec(chooseN[0]); const need=m?Number(m[1]):2;
          h += `<div class="sect">Focused Skills — pick ${need} Combat Skills</div>`;
          if (D.skillsFlags && D.skillsFlags.flagged) h += flagHtml(D.skillsFlags);
          h += D.skills.filter(s=>s.category==="combat").map(s=>{
            const on = ac.focusedSkillPicks.includes(s.id);
            return `<div class="pick ${on?"selected":""}"><div class="head"><h4>${esc(s.name)}</h4>
              <div class="controls"><button class="toggle" data-fskill="${s.id}">${on?"Chosen":"Choose"}</button></div></div></div>`;
          }).join("");
        }
        const nat = (sel.baselineTraits||[]).find(t=>t.id==="natural-advantages");
        const rowP = Engine.scalingRow(ch);
        if (nat && rowP){
          const have = ac.naturalAdvantages.reduce((s,n)=>s+n.rank,0);
          h += `<div class="sect">Natural Advantages — allocate ${rowP.naturalAdvantageRanks} ranks (free)</div>
            <p class="step-note">${esc(nat.description)} <em>${have}/${rowP.naturalAdvantageRanks} allocated.</em></p>`;
          h += nat.pool.map(p=>{
            const def = Engine.advById(p.advantageId);
            const cur = (ac.naturalAdvantages.find(n=>n.id===p.advantageId)||{rank:0}).rank;
            return `<div class="pick ${cur>0?"selected":""}"><div class="head"><h4>${esc(def?def.name:p.advantageId)}</h4>
              <span class="cost grant">max rank ${p.maxRank}</span>
              <div class="controls">${stepper(cur,"natadv|"+p.advantageId, cur>0, cur<p.maxRank && have<rowP.naturalAdvantageRanks)}</div></div>
              <div class="desc">${esc(def?def.description:"")}</div></div>`;
          }).join("");
        }
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
    let h = `<div class="roll-entry">
      <span class="die">${pool.rollDie}</span>
      <input type="text" inputmode="numeric" pattern="[0-9]*" data-roll="skillPoints" value="${pool.roll==null?"":pool.roll}" aria-label="skill point roll">
      <span class="pool">Pool <b>${pool.total==null?"—":pool.total}</b> · Remaining <b>${pool.total==null?"—":left}</b> · Max Rank <b>${pl.maxSkillRank}</b></span>
      <span class="dice-note">Trained checks: ${esc(D.skillCheckRules.trained)}. Untrained: ${esc(D.skillCheckRules.untrained)}.</span>
    </div>`;
    const dataWarns = D.skills.map(s=>Engine.skillLine(ch,s.id).dataWarning).filter(Boolean);
    if (dataWarns.length) h += `<div class="flag">⚑ Data issue: ${dataWarns.map(esc).join(" ")}</div>`;
    const cats = [["combat","Combat"],["utility","Utility"],["general","General"]];
    for (const [cid,cname] of cats){
      h += `<div class="sect">${cname}</div><div class="alloc">`;
      for (const s of D.skills.filter(x=>x.category===cid)){
        const rank = ch.skills[s.id]?ch.skills[s.id].rank:0;
        const line = Engine.skillLine(ch, s.id);
        h += `<div class="alloc-row">
          <div class="name">${esc(s.name)} <small>${s.primaryStat} + ${s.synergyStat} syn — ${esc(s.description)}</small></div>
          ${stepper(rank, "skill|"+s.id, rank>0, rank<pl.maxSkillRank && left>0 && pool.total!=null)}
          <span class="mod ${line.trained?"pos":""}" title="check bonus">+${line.checkBonus}</span>
        </div>`;
      }
      h += `</div>`;
    }
    return h;
  }

  function renderCP(){
    const ch=S.ch, pl=Engine.powerLevel(ch), a=Engine.archetype(ch);
    const bal = Engine.cp(ch);
    const canBuyAdv = !a || a.canPurchaseAdvantages!==false;
    let h = `<div class="roll-entry">
      <span class="pool" style="margin-left:0">Base <b>${bal.base}</b> + Disadvantages <b>${bal.granted}</b> = Budget <b>${bal.budget}</b> · Spent <b>${bal.spent}</b> · <span style="color:${bal.left<0?"var(--magenta)":"var(--gold)"}">Remaining <b>${bal.left}</b></span></span>
      <span class="dice-note">${esc(D.creationFlow.steps.find(s=>s.id==="character-points").note||"")}</span></div>`;
    if (!canBuyAdv) h += ruleHtml(`${a.name}s are Supernatural — unable to purchase Advantages. Disadvantages, LUCK, and boosts remain open.`);

    // Disadvantages
    h += `<div class="sect">Disadvantages — grant Character Points (no cap)</div>`;
    h += `<details class="group" open><summary>${D.disadvantages.length} available</summary>` +
      D.disadvantages.map(dd=>{
        const cur = (ch.disadvantages.find(x=>x.id===dd.id)||{rank:0}).rank;
        return `<div class="pick ${cur>0?"selected":""}">${dd.flagged?flagHtml(dd):""}
          <div class="head"><h4>${esc(dd.name)}</h4><span class="cost grant">+${dd.pointsGranted} CP/rank · max ${dd.maxRank}</span>
          <div class="controls">${stepper(cur,"disadv|"+dd.id, cur>0, cur<dd.maxRank)}</div></div>
          <div class="desc">${esc(dd.description)}</div></div>`;
      }).join("") + `</details>`;

    // Advantages
    h += `<div class="sect">Advantages — cost Character Points</div>`;
    h += `<details class="group" open><summary>${D.advantages.length} available</summary>` +
      D.advantages.map(ad=>{
        const cur = (ch.advantages.find(x=>x.id===ad.id && x.notes!=="natural")||{rank:0}).rank;
        const natural = ch.advantages.find(x=>x.id===ad.id && x.notes==="natural");
        const affordable = bal.left>=ad.cost;
        return `<div class="pick ${cur>0?"selected":""}">${ad.flagged?flagHtml(ad):""}
          <div class="head"><h4>${esc(ad.name)}</h4><span class="cost">${ad.cost} CP/rank · max ${ad.maxRank}</span>
          ${natural?`<span class="cost grant">natural ×${natural.rank}</span>`:""}
          <div class="controls">${canBuyAdv?stepper(cur,"adv|"+ad.id, cur>0, cur<ad.maxRank && affordable):"<span class='cost'>locked</span>"}</div></div>
          <div class="desc">${esc(ad.description)}</div></div>`;
      }).join("") + `</details>`;

    // LUCK
    const luck = D.resources.luck;
    h += `<div class="sect">LUCK</div>`;
    if (luck.flagged) h += flagHtml(luck);
    h += `<div class="pick"><div class="head"><h4>Buy up LUCK</h4>
      <span class="cost">${luck.cpCostPerPoint} CP/point · exempt from Max Boost</span>
      <div class="controls">${stepper(luck.startingValue+ch.trackers.luck.bonus, "luck|x", ch.trackers.luck.bonus>0, bal.left>=luck.cpCostPerPoint)}</div></div>
      <div class="desc">Everyone starts at ${luck.startingValue}. ${esc(luck.refresh)}</div></div>`;

    // Arcanist disciplines
    if (a && a.id==="arcanist"){
      const startEvoc = Engine.scalingRow(ch).evocationStartingRank;
      h += `<div class="sect">Disciplines — 6 CP per rank · cap ${pl.maxPowerRank}</div>`;
      if (D.creationFlow.boostRules.flagged) {} // exchange-rate flag shown under boosts
      h += a.coreMechanic.disciplines.list.map(disc=>{
        const base = disc.id==="evocation"?startEvoc:0;
        const bought = ch.archetypeChoices.disciplines[disc.id]||0;
        const rank = base+bought;
        return `<div class="pick ${rank>0?"selected":""}"><div class="head"><h4>${esc(disc.name)}</h4>
          <span class="cost">${base?`starts at ${base} · `:""}rank ${rank}</span>
          <div class="controls">${stepper(rank,"disc|"+disc.id, bought>0, rank<pl.maxPowerRank && bal.left>=6)}</div></div>
          <div class="desc">${esc(disc.description)}</div></div>`;
      }).join("");
    }

    // Boosts
    h += `<div class="sect">Boosts — leftover CP on Stats &amp; Skills · max ${pl.maxBoost}× per target</div>`;
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
    return h;
  }

  function renderReview(){
    const ch=S.ch, pl=Engine.powerLevel(ch), a=Engine.archetype(ch);
    const der=Engine.derived(ch), hp=Engine.health(ch), t=Engine.statTable(ch);
    const issues = Engine.validate("review",ch);
    const blocked = issues.some(i=>i.level==="error");
    let h = `<div class="roll-entry"><span class="die">Çredits: ${esc(pl.startingCredits.roll)} × ${pl.startingCredits.multiplier}</span>
      <input type="text" inputmode="numeric" pattern="[0-9]*" data-roll="credits" value="${ch.creation.rolls.credits==null?"":ch.creation.rolls.credits}" aria-label="credits roll">
      <span class="pool">Starting Ç <b>${ch.creation.rolls.credits==null?"—":ch.creation.rolls.credits*pl.startingCredits.multiplier}</b></span></div>`;
    h += `<div class="review-block"><h3>${esc(ch.identity.name)||"Unnamed"}</h3><div class="kv">
      <span class="k">Archetype</span><span class="v">${a?esc(a.name):"—"}${ch.identity.specialization?" · "+esc(ch.identity.specialization):""}${a&&a.status!=="final"?" · "+esc(statusLabel(a.status)):""}</span>
      <span class="k">Power Level</span><span class="v">${esc(pl.name)}</span>
      <span class="k">Stats</span><span class="v">${D.stats.map(s=>s.id+" "+t[s.id].value).join(" · ")}</span>
      <span class="k">Derived</span><span class="v">TOL ${der.TOL} · WILL ${der.WILL} · SAN ${der.SAN}% · ${hp.levels} HL / ${hp.total} HP · LUCK ${D.resources.luck.startingValue+ch.trackers.luck.bonus}</span>
      <span class="k">Skills</span><span class="v">${Object.keys(ch.skills).map(id=>{const l=Engine.skillLine(ch,id);return esc(l.def.name)+" "+l.rank;}).join(" · ")||"—"}</span>
      <span class="k">Advantages</span><span class="v">${ch.advantages.map(x=>{const d2=Engine.advById(x.id);return esc(d2?d2.name:x.id)+(x.rank>1?" ×"+x.rank:"")+(x.notes==="natural"?" (natural)":"");}).join(" · ")||"—"}</span>
      <span class="k">Disadvantages</span><span class="v">${ch.disadvantages.map(x=>{const d2=Engine.disById(x.id);return esc(d2?d2.name:x.id)+(x.rank>1?" ×"+x.rank:"");}).join(" · ")||"—"}</span>
      <span class="k">Boost ledger</span><span class="v">${ch.creation.boosts.map(b=>b.targetId+" ×"+b.times).join(" · ")||"—"}</span>
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

  // ── Home & live sheet ────────────────────────────────────────────────
  function renderHome(){
    const app=$("app"); if (app) app.classList.remove("sheet-mode");
    renderTopChrome(); closeVitals();
    const draft = loadDraft();
    const active = loadActive();
    $("main").innerHTML = `<div class="home-hero">
      <div class="glyph">[ 1 0 ]</div>
      <h1>Character Intake</h1>
      <p>NYTE City doesn't care who you were. Build who you're going to be.</p>
      <div class="home-actions">
        <button class="btn go" id="btn-new">New character</button>
        ${active&&active.ch?`<button class="btn primary" id="btn-active">Open sheet${active.ch.identity.name?" — "+esc(active.ch.identity.name):""}</button>`:""}
        ${draft?`<button class="btn primary" id="btn-resume">Resume draft${draft.ch.identity.name?" — "+esc(draft.ch.identity.name):""}</button>`:""}
        <button class="btn" id="btn-import">Import .shadows.json</button>
        <input type="file" id="file-import" accept=".json,.shadows.json" style="display:none">
      </div></div>`;
    $("btn-new").onclick=()=>{ S={screen:"wizard", ch:Engine.newCharacter(), step:0, maxReached:0, section:"main"}; update(); };
    const r=$("btn-resume"); if(r) r.onclick=()=>{ S={screen:"wizard", ch:draft.ch, step:draft.step, maxReached:draft.maxReached, section:"main"}; update(); };
    const ac=$("btn-active"); if(ac) ac.onclick=()=>{
      const c=Engine.migrate(active.ch);
      S={screen:"sheet", ch:c, step:0, maxReached:STEPS.length-1, section:normSection(active.section), importIssues:Engine.versionCheck(c)};
      update();
    };
    $("btn-import").onclick=()=>$("file-import").click();
    $("file-import").onchange=e=>{
      const f=e.target.files[0]; if(!f) return;
      const rd=new FileReader();
      rd.onload=()=>{ try{
          const c=Engine.migrate(JSON.parse(rd.result));
          const issues=Engine.versionCheck(c);
          if (c.creation && c.creation.locked) S={screen:"sheet", ch:c, step:0, maxReached:STEPS.length-1, section:"main", importIssues:issues};
          else S={screen:"wizard", ch:c, step:0, maxReached:STEPS.length-1, section:"main", importIssues:issues};
          update();
        }catch(err){ alert("That file didn't parse as a character: "+err.message); } };
      rd.readAsText(f);
    };
    renderLedger(); renderVitals();
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
    const traitCard = (name, costHtml, desc) =>
      `<details class="pick trait"><summary><span class="th">${esc(name)}</span>${costHtml}</summary>
        <div class="desc">${esc(desc||"No description on file.")}</div></details>`;
    h += `<div class="sect">Advantages</div>`;
    const advs = ch.advantages.map(x=>{ const d2=Engine.advById(x.id);
      const name=(d2?d2.name:x.id)+(x.rank>1?" ×"+x.rank:"");
      const cost=x.notes==="natural" ? '<span class="cost grant">natural</span>'
        : (d2?`<span class="cost">${d2.cost*(x.rank||1)} CP</span>`:"");
      return traitCard(name, cost, d2?d2.description:""); }).join("");
    h += advs || `<p class="step-note">No advantages.</p>`;
    h += `<div class="sect">Disadvantages</div>`;
    const diss = ch.disadvantages.map(x=>{ const d2=Engine.disById(x.id);
      const name=(d2?d2.name:x.id)+(x.rank>1?" ×"+x.rank:"");
      const cost=d2?`<span class="cost grant">+${d2.pointsGranted*(x.rank||1)} CP</span>`:"";
      return traitCard(name, cost, d2?d2.description:""); }).join("");
    h += diss || `<p class="step-note">No disadvantages.</p>`;
    return h;
  }

  // ── Sheet: ARCHETYPE (everything about the chosen archetype) ──────────
  function renderShArchetype(){
    const ch=S.ch, a=Engine.archetype(ch);
    if (!a) return sheetHeader("Archetype","No archetype selected.");
    const badge = a.status!=="final"?` <span class="chip ${a.status==="tbd"?"pain":"gold"}">${esc(statusLabel(a.status))}</span>`:"";
    let h = sheetHeader(a.name+(ch.identity.specialization?" · "+ch.identity.specialization:""),
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

    // Specialization — chosen options
    const aber = (ch.archetypeChoices.aberrations||[]);
    if (a.specialization && a.specialization.options){
      h += `<div class="sect">${esc(a.specialization.label||"Specialization")}${aber.length?"":" <span class='chip'>none chosen</span>"}</div>`;
      if (aber.length){
        h += aber.map(oid=>{ const o=a.specialization.options.find(x=>x.id===oid);
          return o?`<div class="pick selected"><div class="head"><h4>${esc(o.name)}</h4></div>
            <div class="desc">${esc(o.description||"")}${o.benefit?"\n— "+esc(o.benefit):""}</div></div>`:""; }).join("");
      }
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
        const sub = ((a.specialization||{}).options||[]).find(o=>o.id===ch.archetypeChoices.subtype);
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
      <span class="sub" style="color:var(--magenta)">⚠ Changing archetype clears every archetype-specific choice — focus / stat-bonus allocations, subtype, disciplines, natural advantages, aberrations. One undo brings it all back.</span></div>`;

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

  // ── Main render + events ─────────────────────────────────────────────
  const RENDER = { "power-level":renderPowerLevel, "concept":renderConcept, "stats":renderStats,
    "archetype":renderArchetype, "history":renderHistory, "skills":renderSkills,
    "character-points":renderCP, "review":renderReview };

  // Header chrome: brand context + the section tabs (which now live in the
  // sticky header rather than inside the scrolling content).
  function renderTopChrome(){
    const ctx=$("brandctx"), nav=$("topnav"), act=$("hdractions");
    if (!ctx || !nav) return;
    if (S.screen==="sheet"){
      ctx.textContent = (S.ch && S.ch.identity.name) ? S.ch.identity.name : "Unnamed";
      nav.innerHTML = tabButtonsHtml();
      nav.querySelectorAll("[data-sec]").forEach(b=>b.onclick=()=>{
        S.section=normSection(b.dataset.sec); window.scrollTo(0,0); update();
      });
      if (act){
        act.innerHTML = `<button class="kebab" data-menu-toggle aria-haspopup="true" aria-expanded="false" aria-label="Sheet actions">⋮</button>
          <div class="hdr-menu" id="hdrmenu" hidden>
            <button data-admin="1">${S.admin?"Exit admin mode":"Admin mode (free edit)"}</button>
            <button data-export="1">Export .shadows.json</button>
            <button data-home="1">Home</button>
          </div>`;
        const menu=$("hdrmenu"), kb=act.querySelector("[data-menu-toggle]");
        kb.onclick=(e)=>{ e.stopPropagation(); const willOpen=menu.hidden; menu.hidden=!willOpen; kb.setAttribute("aria-expanded", willOpen?"true":"false"); };
        act.querySelectorAll("[data-admin]").forEach(b=>b.onclick=()=>{
          menu.hidden=true; S.admin=!S.admin;
          if (S.admin) S.section="admin"; else if (S.section==="admin") S.section="main";
          window.scrollTo(0,0); update();
        });
        act.querySelectorAll("[data-export]").forEach(b=>b.onclick=()=>{ menu.hidden=true; exportChar(); });
        act.querySelectorAll("[data-home]").forEach(b=>b.onclick=()=>{ S={screen:"home",ch:null,step:0,maxReached:0,section:"main",admin:false}; renderHome(); });
      }
    } else if (S.screen==="wizard"){
      ctx.textContent = (S.ch && S.ch.identity.name) ? S.ch.identity.name : "Character Intake";
      nav.innerHTML = ""; if (act) act.innerHTML = "";
    } else {
      ctx.textContent = "Character Intake"; nav.innerHTML = ""; if (act) act.innerHTML = "";
    }
  }

  function closeVitals(){
    S.vitalsOpen=false;
    const dr=$("vdrawer"), sc=$("vscrim");
    if (dr){ dr.classList.remove("open"); dr.setAttribute("aria-hidden","true"); }
    if (sc) sc.classList.remove("open");
  }
  function renderDrawer(){
    const dr=$("vdrawer"), sc=$("vscrim");
    if (!dr) return;
    if (S.screen==="sheet" && S.ch){
      dr.innerHTML = vitalsPanelHtml(S.ch);
      dr.classList.toggle("open", !!S.vitalsOpen);
      dr.setAttribute("aria-hidden", S.vitalsOpen?"false":"true");
      if (sc) sc.classList.toggle("open", !!S.vitalsOpen);
      dr.querySelectorAll("[data-vitals-close]").forEach(b=>b.onclick=closeVitals);
      if (sc) sc.onclick=closeVitals;
    } else {
      dr.innerHTML=""; closeVitals();
    }
  }

  function renderMain(){
    const app=$("app");
    if (app) app.classList.toggle("sheet-mode", S.screen==="sheet");
    renderTopChrome();
    if (S.screen==="home") return renderHome();
    if (S.screen==="sheet"){
      S.section = normSection(S.section);
      const body = SHEET_RENDER[S.section] ? SHEET_RENDER[S.section]() : SHEET_RENDER.main();
      // Main carries its own condition strip; every other tab gets the vitals bar.
      const bar = S.section==="main" ? "" : sheetVitalsBar(S.ch);
      const banner = S.admin ? adminBannerHtml() : "";
      $("main").innerHTML = bar + banner + body;
      renderDrawer();
      bindMain(); bindSheet();
      return;
    }
    closeVitals();
    const st = STEPS[S.step];
    let h = stepHeader(st) + RENDER[st.id]();
    if (st.id!=="review") h += wizNav(st.id);
    $("main").innerHTML = h;
    bindMain();
  }

  function bindMain(){
    const main=$("main"), ch=S.ch;
    // navigation
    main.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>{
      S.step = Math.max(0, Math.min(STEPS.length-1, S.step+Number(b.dataset.nav)));
      S.maxReached = Math.max(S.maxReached, S.step);
      window.scrollTo(0,0); update();
    });
    main.querySelectorAll("[data-home]").forEach(b=>b.onclick=()=>{ S={screen:"home",ch:null,step:0,maxReached:0}; renderHome(); });
    // selections
    main.querySelectorAll("[data-pl]").forEach(b=>b.onclick=()=>{ ch.creation.powerLevel=b.dataset.pl; update(); });
    main.querySelectorAll("[data-arch]").forEach(b=>b.onclick=()=>{
      if (ch.identity.archetype!==b.dataset.arch){
        ch.identity.archetype=b.dataset.arch; ch.identity.specialization="";
        ch.archetypeChoices={ rolls:{}, focusAllocation:{}, statBonusAllocation:{}, aberrations:[],
          subtype:null, focusedSkillPicks:[], naturalAdvantages:[], disciplines:{} };
        const a=Engine.archetype(ch);
        if (a && a.canPurchaseAdvantages===false) ch.advantages=ch.advantages.filter(x=>x.notes==="natural");
      }
      update();
    });
    main.querySelectorAll("[data-spec]").forEach(b=>b.onclick=()=>{
      ch.identity.specialization=b.dataset.spec;
      ch.archetypeChoices.subtype=b.dataset.spec;
      ch.archetypeChoices.focusedSkillPicks=[]; ch.archetypeChoices.naturalAdvantages=[];
      update();
    });
    main.querySelectorAll("[data-aber]").forEach(b=>b.onclick=()=>{
      const id=b.dataset.aber, list=ch.archetypeChoices.aberrations;
      const i=list.indexOf(id); if(i>=0) list.splice(i,1); else list.push(id);
      update();
    });
    main.querySelectorAll("[data-fskill]").forEach(b=>b.onclick=()=>{
      const id=b.dataset.fskill, list=ch.archetypeChoices.focusedSkillPicks;
      const i=list.indexOf(id); if(i>=0) list.splice(i,1); else list.push(id);
      update();
    });
    // steppers
    main.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{
      const [key,delta]=b.dataset.step.split("|").reduce((acc,part,i,arr)=>{
        if(i===arr.length-1) acc[1]=Number(part); else acc[0]=(acc[0]?acc[0]+"|":"")+part; return acc; },[null,0]);
      applyStep(key, delta); update();
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
    // identity / history text
    main.querySelectorAll("[data-id]").forEach(inp=>inp.oninput=()=>{
      const k=inp.dataset.id;
      ch.identity[k] = inp.type==="number" ? (inp.value===""?null:Number(inp.value)) : inp.value;
      update(false); refreshNav();
    });
    // export / lock
    main.querySelectorAll("[data-export]").forEach(b=>b.onclick=()=>exportChar());
    main.querySelectorAll("[data-lock]").forEach(b=>b.onclick=()=>{
      ch.creation.locked=true;
      S.ch=Engine.migrate(Engine.buildExport(ch));
      exportChar(); clearDraft();
      S.screen="sheet"; S.section="main";
      window.scrollTo(0,0); update();
    });
  }

  // ── Phase 3: sheet event wiring ─────────────────────────────────────
  function bindSheet(){
    const main=$("main"), ch=S.ch;
    // Vitals flyout (the bar's "Vitals" toggle on non-Main tabs)
    main.querySelectorAll("[data-vitals-toggle]").forEach(b=>b.onclick=()=>{
      S.vitalsOpen=!S.vitalsOpen;
      const dr=$("vdrawer"), sc=$("vscrim");
      if (dr){ dr.classList.toggle("open", S.vitalsOpen); dr.setAttribute("aria-hidden", S.vitalsOpen?"false":"true"); }
      if (sc) sc.classList.toggle("open", S.vitalsOpen);
    });
    // Skill description toggles (no full re-render — flip the hidden detail row)
    main.querySelectorAll("[data-skilldesc]").forEach(b=>b.onclick=()=>{
      const id=b.dataset.skilldesc; S.openSkills=S.openSkills||new Set();
      const open=!S.openSkills.has(id);
      if (open) S.openSkills.add(id); else S.openSkills.delete(id);
      const row=main.querySelector('[data-descrow="'+id+'"]');
      if (row) row.hidden=!open;
      b.setAttribute("aria-expanded", open?"true":"false");
    });
    const num = el => el && el.value!=="" ? Number(el.value) : null;
    const lite = () => { update(false); };   // save + rails, keep focus in inputs

    // Derived (TOL/WILL) derivation toggles — flip the hidden line, no re-render
    main.querySelectorAll("[data-derivdesc]").forEach(b=>b.onclick=()=>{
      const id=b.dataset.derivdesc; S.openDerived=S.openDerived||new Set();
      const open=!S.openDerived.has(id);
      if (open) S.openDerived.add(id); else S.openDerived.delete(id);
      const row=main.querySelector('[data-derivrow="'+id+'"]');
      if (row) row.hidden=!open;
      b.setAttribute("aria-expanded", open?"true":"false");
    });

    // ── Activity Log: last-in-first-out undo (NOT itself logged) ──────────
    main.querySelectorAll("[data-undolast]").forEach(b=>b.onclick=()=>{
      const r=Engine.undoLastAction(ch); if(!r.ok){ alert(r.why); return; } update();
    });
    main.querySelectorAll("[data-admin-clearlog]").forEach(b=>b.onclick=()=>{
      if (confirm("Clear the activity log? This removes history only (no character values change) and cannot be undone.")){ ch.audit=[]; update(); }
    });
    // Admin banner controls
    main.querySelectorAll("[data-admin-open]").forEach(b=>b.onclick=()=>{ S.section="admin"; window.scrollTo(0,0); update(); });
    main.querySelectorAll("[data-admin-exit]").forEach(b=>b.onclick=()=>{ S.admin=false; if(S.section==="admin") S.section="main"; window.scrollTo(0,0); update(); });

    // Damage
    main.querySelectorAll("[data-dmg]").forEach(b=>b.onclick=()=>{
      const d=Number(b.dataset.dmg);
      commit("damage", `Damage ${d>0?"+":""}${d}`, ()=>{ ch.trackers.damage=Math.max(0,(ch.trackers.damage||0)+d); });
    });
    const ds=main.querySelector("[data-dmgset]");
    if (ds) ds.onchange=()=>{ const v=Math.max(0,Number(ds.value)||0); commit("damage", `Set damage → ${v}`, ()=>{ ch.trackers.damage=v; }); };
    main.querySelectorAll("[data-dmgheal]").forEach(b=>b.onclick=()=>commit("damage","Heal all",()=>{ ch.trackers.damage=0; }));

    // SAN
    main.querySelectorAll("[data-san]").forEach(b=>b.onclick=()=>{
      const d=Number(b.dataset.san);
      commit("san", `SAN loss ${d>0?"+":""}${d}`, ()=>{ ch.trackers.san.loss=Math.max(0,(ch.trackers.san.loss||0)+d); });
    });
    const ss=main.querySelector("[data-sanset]");
    if (ss) ss.onchange=()=>{ const v=Math.max(0,Number(ss.value)||0); commit("san", `Set SAN loss → ${v}`, ()=>{ ch.trackers.san.loss=v; }); };

    // LUCK
    main.querySelectorAll("[data-luckspend]").forEach(b=>b.onclick=()=>{
      const cost=Number(b.dataset.luckspend);
      if (Engine.luckState(ch).current>=cost) commit("luck", `LUCK spent −${cost}`, ()=>{ ch.trackers.luck.spent+=cost; });
    });
    main.querySelectorAll("[data-luckregain]").forEach(b=>b.onclick=()=>{
      if ((ch.trackers.luck.spent||0)>0) commit("luck","LUCK regained +1",()=>{ ch.trackers.luck.spent=Math.max(0,ch.trackers.luck.spent-1); });
    });

    // Generic archetype trackers (SFR / Exhaustion / panel trackers)
    main.querySelectorAll("[data-trk]").forEach(b=>b.onclick=()=>{
      const [pid,d]=b.dataset.trk.split("|"), delta=Number(d);
      commit("tracker", `${pid.toUpperCase()} ${delta>0?"+":""}${delta}`, ()=>{
        if (pid==="sfr") ch.trackers.sfr.spent=Math.max(0,(ch.trackers.sfr.spent||0)+delta);
        else if (pid==="exhaustion") ch.trackers.exhaustion=Math.max(0,(ch.trackers.exhaustion||0)+delta);
        else { const e=ch.trackers.panel[pid]||(ch.trackers.panel[pid]={value:0}); e.value=Math.max(0,(e.value||0)+delta); }
      });
    });
    main.querySelectorAll("[data-trkmax]").forEach(inp=>inp.onchange=()=>{
      const pid=inp.dataset.trkmax, mx=inp.value===""?null:Math.max(0,Number(inp.value));
      commit("tracker", `${pid.toUpperCase()} max → ${mx==null?"—":mx}`, ()=>{
        const e=ch.trackers.panel[pid]||(ch.trackers.panel[pid]={value:0}); e.max=mx;
      });
    });

    // Çredits
    main.querySelectorAll("[data-cr]").forEach(b=>b.onclick=()=>{
      const amt=num(main.querySelector("[data-cramt]"));
      const note=(main.querySelector("[data-crnote]")||{}).value||"";
      if (amt==null || !amt) return;
      const signed=Math.abs(amt)*Number(b.dataset.cr);
      commit("credits", `Çredits ${signed>0?"+":""}${signed}${note?` (${note})`:""}`, ()=>{ Engine.addCredits(ch, signed, note); });
    });

    // Manual adjustments
    main.querySelectorAll("[data-adjadd]").forEach(b=>b.onclick=()=>{
      const target=(main.querySelector("[data-adjtarget]")||{}).value;
      const amt=num(main.querySelector("[data-adjamt]"));
      const note=(main.querySelector("[data-adjnote]")||{}).value||"";
      if (!target || amt==null || !amt) return;
      commit("adjustment", `Adjust ${target} ${amt>0?"+":""}${Math.trunc(amt)}${note?` (${note})`:""}`, ()=>{
        ch.trackers.adjustments.push({target, amount:Math.trunc(amt), note, date:new Date().toISOString()});
      });
    });
    main.querySelectorAll("[data-adjdel]").forEach(b=>b.onclick=()=>{
      const i=Number(b.dataset.adjdel), a2=ch.trackers.adjustments[i]||{};
      commit("adjustment", `Remove adjustment ${esc(a2.target||"")}`, ()=>{ ch.trackers.adjustments.splice(i,1); });
    });

    // IP
    main.querySelectorAll("[data-ipbuy]").forEach(b=>b.onclick=()=>{
      const [type,id]=b.dataset.ipbuy.split("|");
      const c=Engine.ipCost(ch,type,id);
      const nm = type==="stat" ? id : (Engine.skillById(id)||{name:id}).name;
      const label = c.ok ? `IP: ${nm} ${c.from}→${c.to} (−${c.cost})` : `IP spend: ${nm}`;
      commit("ip", label, ()=>{ const r=Engine.spendIP(ch,type,id,""); if(!r.ok) alert(r.why); });
    });
    main.querySelectorAll("[data-ipgrant]").forEach(b=>b.onclick=()=>{
      const amt=num(main.querySelector("[data-ipamt]"));
      const note=(main.querySelector("[data-ipnote]")||{}).value||"";
      const pre=Engine.grantIP(clone(ch), amt, note);   // validate without mutating
      if (!pre.ok){ alert(pre.why); return; }
      commit("ip", `IP grant +${Math.floor(amt)}${note?` (${note})`:""}`, ()=>{ Engine.grantIP(ch, amt, note); });
    });

    // Milestones
    main.querySelectorAll("[data-mp]").forEach(b=>b.onclick=()=>{
      const d=Number(b.dataset.mp);
      commit("milestone", `Manual MP ${d>0?"+":""}${d}`, ()=>{ ch.progression.milestonePoints=Math.max(0,(ch.progression.milestonePoints||0)+d); });
    });
    main.querySelectorAll("[data-takeminor]").forEach(b=>b.onclick=()=>{
      const id=b.dataset.takeminor;
      if (id==="improved"){ S.askImproved=true; update(); return; }
      const nm=(D.milestones.minorShared.find(m=>m.id===id)||{name:id}).name;
      commit("milestone", `Take Minor: ${nm}`, ()=>{ const r=Engine.takeMilestone(ch,"minor",id); if(!r.ok) alert(r.why); });
    });
    main.querySelectorAll("[data-improvok]").forEach(b=>b.onclick=()=>{
      const roll=num(main.querySelector("[data-improvroll]"));
      const pre=Engine.takeMilestone(clone(ch),"minor","improved");
      if (!pre.ok){ alert(pre.why); S.askImproved=false; update(); return; }
      commit("milestone", `Take Minor: Improved${roll?` (+${roll} IP)`:""}`, ()=>{
        Engine.takeMilestone(ch,"minor","improved");
        if (roll) Engine.grantIP(ch, roll, "Improved milestone (2d10+15)");
      });
      S.askImproved=false; update();
    });
    main.querySelectorAll("[data-improvcancel]").forEach(b=>b.onclick=()=>{ S.askImproved=false; update(); });
    main.querySelectorAll("[data-takemajor]").forEach(b=>b.onclick=()=>{
      const id=b.dataset.takemajor;
      if (b.dataset.gm==="1" && !confirm("This Milestone has prerequisites the table adjudicates (see gold chips). Has your GM signed off?")) return;
      const nm=((D.milestones.majorGeneral||[]).find(m=>m.id===id)||{name:id}).name;
      commit("milestone", `Take Major: ${nm}`, ()=>{ const r=Engine.takeMilestone(ch,"major",id); if(!r.ok) alert(r.why); });
    });
    main.querySelectorAll("[data-delminor]").forEach(b=>b.onclick=()=>{
      if (!confirm("Remove this Minor Milestone from the record?")) return;
      const i=Number(b.dataset.delminor), t=(ch.progression.milestones.minor[i]||{});
      const nm=(D.milestones.minorShared.find(m=>m.id===t.id)||{name:t.id||""}).name;
      commit("milestone", `Remove Minor: ${nm}`, ()=>{ Engine.untakeMilestone(ch,"minor",i); });
    });
    main.querySelectorAll("[data-delmajor]").forEach(b=>b.onclick=()=>{
      if (!confirm("Remove this Major Milestone from the record?")) return;
      const i=Number(b.dataset.delmajor), t=(ch.progression.milestones.major[i]||{});
      const nm=((D.milestones.majorGeneral||[]).find(m=>m.id===t.id)||{name:t.id||""}).name;
      commit("milestone", `Remove Major: ${nm}`, ()=>{ Engine.untakeMilestone(ch,"major",i); });
    });

    // Sessions
    main.querySelectorAll("[data-seslog]").forEach(b=>b.onclick=()=>{
      const title=(main.querySelector("[data-sestitle]")||{}).value||"";
      commit("session", `Log session${title?`: ${title}`:""}`, ()=>{
        Engine.logSession(ch, {
          date:(main.querySelector("[data-sesdate]")||{}).value,
          title,
          ipEarned:num(main.querySelector("[data-sesip]")) ?? D.ip.perSession,
          milestonePoint:(main.querySelector("[data-sesmp]")||{checked:true}).checked,
          notes:(main.querySelector("[data-sesnotes]")||{}).value
        });
      });
      window.scrollTo(0,0);
    });
    main.querySelectorAll("[data-sesdel]").forEach(b=>b.onclick=()=>{
      if (!confirm("Delete this session? Its IP and Milestone Point come off the totals — spent IP may go negative.")) return;
      const i=Number(b.dataset.sesdel), s=ch.sessions[i]||{};
      commit("session", `Delete session${s.title?`: ${s.title}`:""}`, ()=>{ ch.sessions.splice(i,1); });
    });

    // Editable tables (weapons / gear / panel tables)
    main.querySelectorAll("[data-rowadd]").forEach(b=>b.onclick=()=>{
      const key=b.dataset.rowadd;
      commit("loadout", `Add ${key} row`, ()=>{ panelRows(ch, key).push({}); });
    });
    main.querySelectorAll("[data-rowdel]").forEach(b=>b.onclick=()=>{
      const [key,i]=b.dataset.rowdel.split("|");
      commit("loadout", `Remove ${key} row`, ()=>{ panelRows(ch, key).splice(Number(i),1); });
    });
    main.querySelectorAll("[data-cell]").forEach(inp=>inp.oninput=()=>{   // text: not audited (keystrokes)
      const [key,i,col]=inp.dataset.cell.split("|");
      const rows=panelRows(ch, key);
      if (rows[Number(i)]) rows[Number(i)][col]=inp.value;
      lite();
    });

    // Form toggle (e.g. Werewolf Human/Werewolf)
    main.querySelectorAll("[data-ptoggle]").forEach(b=>b.onclick=()=>{
      const [pid,opt]=b.dataset.ptoggle.split("|");
      commit("loadout", `${pid}: ${opt}`, ()=>{ ch.panelData[pid]=opt; });
    });

    // ── Admin: free edits (each logged via commit) ───────────────────────
    main.querySelectorAll("[data-admin-id]").forEach(inp=>inp.onchange=()=>{   // change, not input → one entry
      const k=inp.dataset.adminId;
      const v = inp.type==="number" ? (inp.value===""?null:Number(inp.value)) : inp.value;
      if (ch.identity[k]===v) return;
      commit("admin", `Admin: ${k} → ${v===null||v===""?"—":String(v).slice(0,40)}`, ()=>{ ch.identity[k]=v; });
    });
    main.querySelectorAll("[data-admin-pl]").forEach(sel=>sel.onchange=()=>{
      const v=sel.value; if (ch.creation.powerLevel===v) return;
      const nm=(D.powerLevels.find(p=>p.id===v)||{name:v}).name;
      commit("admin", `Admin: power level → ${nm}`, ()=>{ ch.creation.powerLevel=v; });
    });
    main.querySelectorAll("[data-admin-arch]").forEach(sel=>sel.onchange=()=>{
      const v=sel.value||null; if (ch.identity.archetype===v) return;
      if (!confirm("Change archetype? This clears all archetype-specific choices (focus/stat-bonus allocations, subtype, disciplines, natural advantages, aberrations). It's logged, so a single undo restores everything.")){ sel.value=ch.identity.archetype||""; return; }
      const nm = v ? (D.archetypes.find(a=>a.id===v)||{name:v}).name : "none";
      commit("admin", `Admin: archetype → ${nm}`, ()=>{
        ch.identity.archetype=v; ch.identity.specialization="";
        ch.archetypeChoices={ rolls:{}, focusAllocation:{}, statBonusAllocation:{}, aberrations:[],
          subtype:null, focusedSkillPicks:[], naturalAdvantages:[], disciplines:{} };
        const a=Engine.archetype(ch);
        if (a && a.canPurchaseAdvantages===false) ch.advantages=ch.advantages.filter(x=>x.notes==="natural");
      });
    });
    main.querySelectorAll("[data-admin-stat]").forEach(b=>b.onclick=()=>{
      const [id,field,d]=b.dataset.adminStat.split("|"), delta=Number(d);
      commit("admin", `Admin: ${id} ${field} ${delta>0?"+":""}${delta}`, ()=>{ ch.stats[id][field]=Math.max(0,(ch.stats[id][field]||0)+delta); });
    });
    main.querySelectorAll("[data-admin-skill]").forEach(b=>b.onclick=()=>{
      const [id,field,d]=b.dataset.adminSkill.split("|"), nm=(Engine.skillById(id)||{name:id}).name;
      if (field==="remove"){ commit("admin", `Admin: remove skill ${nm}`, ()=>{ delete ch.skills[id]; }); return; }
      const delta=Number(d);
      commit("admin", `Admin: ${nm} ${field} ${delta>0?"+":""}${delta}`, ()=>{
        if (!ch.skills[id]) ch.skills[id]={rank:0,ipe:0};
        ch.skills[id][field]=Math.max(0,(ch.skills[id][field]||0)+delta);
      });
    });
    main.querySelectorAll("[data-admin-addskill-go]").forEach(b=>b.onclick=()=>{
      const id=(main.querySelector("[data-admin-addskill]")||{}).value; if(!id) return;
      const nm=(Engine.skillById(id)||{name:id}).name;
      commit("admin", `Admin: add skill ${nm} @1`, ()=>{ if(!ch.skills[id]) ch.skills[id]={rank:1,ipe:0}; });
    });
    main.querySelectorAll("[data-admin-adv]").forEach(b=>b.onclick=()=>{
      const [id,notes,op]=b.dataset.adminAdv.split("|"), nm=(Engine.advById(id)||{name:id}).name;
      const find=()=>ch.advantages.find(a=>a.id===id && (a.notes||"")===(notes||""));
      if (op==="x"){ commit("admin", `Admin: remove advantage ${nm}`, ()=>{ ch.advantages=ch.advantages.filter(a=>a!==find()); }); return; }
      const delta=Number(op);
      commit("admin", `Admin: ${nm} rank ${delta>0?"+":""}${delta}`, ()=>{
        const e=find(); if(!e) return; e.rank=Math.max(0,e.rank+delta);
        if (e.rank===0) ch.advantages=ch.advantages.filter(a=>a!==e);
      });
    });
    main.querySelectorAll("[data-admin-addadv-go]").forEach(b=>b.onclick=()=>{
      const id=(main.querySelector("[data-admin-addadv]")||{}).value; if(!id) return;
      const nm=(Engine.advById(id)||{name:id}).name;
      commit("admin", `Admin: add advantage ${nm}`, ()=>{ if(!ch.advantages.some(a=>a.id===id&&a.notes!=="natural")) ch.advantages.push({id, rank:1, notes:""}); });
    });
    main.querySelectorAll("[data-admin-dis]").forEach(b=>b.onclick=()=>{
      const [id,op]=b.dataset.adminDis.split("|"), nm=(Engine.disById(id)||{name:id}).name;
      const find=()=>ch.disadvantages.find(d=>d.id===id);
      if (op==="x"){ commit("admin", `Admin: remove disadvantage ${nm}`, ()=>{ ch.disadvantages=ch.disadvantages.filter(d=>d!==find()); }); return; }
      const delta=Number(op);
      commit("admin", `Admin: ${nm} rank ${delta>0?"+":""}${delta}`, ()=>{
        const e=find(); if(!e) return; e.rank=Math.max(0,e.rank+delta);
        if (e.rank===0) ch.disadvantages=ch.disadvantages.filter(d=>d!==e);
      });
    });
    main.querySelectorAll("[data-admin-adddis-go]").forEach(b=>b.onclick=()=>{
      const id=(main.querySelector("[data-admin-adddis]")||{}).value; if(!id) return;
      const nm=(Engine.disById(id)||{name:id}).name;
      commit("admin", `Admin: add disadvantage ${nm}`, ()=>{ if(!ch.disadvantages.some(d=>d.id===id)) ch.disadvantages.push({id, rank:1, notes:""}); });
    });
    main.querySelectorAll("[data-admin-luck]").forEach(b=>b.onclick=()=>{
      const d=Number(b.dataset.adminLuck);
      commit("admin", `Admin: LUCK bonus ${d>0?"+":""}${d}`, ()=>{ ch.trackers.luck.bonus=Math.max(0,(ch.trackers.luck.bonus||0)+d); });
    });

    // Notes
    const nt=main.querySelector("[data-notes]");
    if (nt) nt.oninput=()=>{ ch.notes=nt.value; lite(); };
  }

  function refreshNav(){
    // re-evaluate Continue button + issue list without nuking input focus
    const st=STEPS[S.step]; if(!st) return;
    const nav=document.querySelector(".wiznav"); if(!nav) return;
    const issues=Engine.validate(st.id,S.ch);
    const btn=nav.querySelector('[data-nav="1"]');
    if(btn) btn.disabled=issues.some(i=>i.level==="error");
    const ul=document.querySelector(".issues"); if(ul) ul.remove();
    nav.insertAdjacentHTML("afterend", issuesHtml(issues));
    const lock=nav.querySelector("[data-lock]");
    if(lock) lock.disabled=issues.some(i=>i.level==="error");
  }

  function applyStep(key, delta){
    const ch=S.ch, [kind,...rest]=key.split("|"), id=rest.join("|");
    if (kind==="stat"){
      const v=ch.stats[id].base+delta;
      const pool=Engine.statPool(ch);
      if (v<D.statRules.base || v>D.statRules.max) return;
      if (delta>0 && pool.total!=null && Engine.statSpent(ch)>=pool.total-0) {/* allow; validation guards */}
      ch.stats[id].base=v;
    }
    if (kind==="skill"){
      const cur=ch.skills[id]?ch.skills[id].rank:0, v=cur+delta;
      const pl=Engine.powerLevel(ch);
      if (v<0||v>pl.maxSkillRank) return;
      if (v===0) delete ch.skills[id]; else ch.skills[id]={rank:v, ipe:(ch.skills[id]?ch.skills[id].ipe:0)};
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
      // mirror into advantages with notes:"natural"
      ch.advantages=ch.advantages.filter(x=>x.notes!=="natural")
        .concat(ch.archetypeChoices.naturalAdvantages.map(n=>({id:n.id, rank:n.rank, notes:"natural"})));
    }
    if (kind==="adv"){
      let e=ch.advantages.find(x=>x.id===id && x.notes!=="natural");
      if (!e && delta>0){ e={id, rank:0, notes:""}; ch.advantages.push(e); }
      if (!e) return;
      e.rank=Math.max(0,e.rank+delta);
      if (e.rank===0) ch.advantages=ch.advantages.filter(x=>x!==e);
    }
    if (kind==="disadv"){
      let e=ch.disadvantages.find(x=>x.id===id);
      if (!e && delta>0){ e={id, rank:0, notes:""}; ch.disadvantages.push(e); }
      if (!e) return;
      e.rank=Math.max(0,e.rank+delta);
      if (e.rank===0) ch.disadvantages=ch.disadvantages.filter(x=>x!==e);
    }
    if (kind==="luck"){ ch.trackers.luck.bonus=Math.max(0, ch.trackers.luck.bonus+delta); }
    if (kind==="disc"){
      const cur=ch.archetypeChoices.disciplines[id]||0, v=cur+delta;
      if (v<0) return; ch.archetypeChoices.disciplines[id]=v;
      if (v===0) delete ch.archetypeChoices.disciplines[id];
    }
    if (kind==="boost"){ const [type,tid]=[rest[0],rest.slice(1).join("|")]; Engine.addBoost(ch,type,tid,delta); }
  }

  function exportChar(){
    const c=Engine.buildExport(S.ch);
    const name=(c.identity.name||"character").trim().replace(/[^\w\- ]+/g,"").replace(/\s+/g,"_")||"character";
    const blob=new Blob([JSON.stringify(c,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=name+".shadows.json"; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }

  // ── Footer (registry / version chrome, collapsible) ──────────────────
  const FOOTER_KEY = "shadows.footer";
  function footerCollapsed(){ try{ return localStorage.getItem(FOOTER_KEY)!=="open"; }catch(e){ return true; } }
  function renderFooter(){
    const f=$("footer"); if (!f) return;
    const collapsed = footerCollapsed();
    f.classList.toggle("collapsed", collapsed);
    f.innerHTML = `<span class="fmeta">NYTE CITY REGISTRY · GET DANGEROUS GAMES · app <b>${esc(APP_VERSION)}</b> · data <b>${esc(D.meta.gamedataVersion)}</b> · ${esc(D.meta.rulesetVersion)}</span>
      <button class="ftoggle" data-ftoggle>${collapsed?"GDG ▴":"Hide ▾"}</button>`;
    f.querySelector("[data-ftoggle]").onclick=()=>{
      const nowCollapsed = !f.classList.contains("collapsed");
      f.classList.toggle("collapsed", nowCollapsed);
      try{ localStorage.setItem(FOOTER_KEY, nowCollapsed?"closed":"open"); }catch(e){}
      f.querySelector("[data-ftoggle]").textContent = nowCollapsed?"GDG ▴":"Hide ▾";
    };
  }

  // ── Boot ─────────────────────────────────────────────────────────────
  function boot(){
    if (!window.SHADOWS_DATA){
      $("main").innerHTML = `<div class="home-hero"><h1>No game data</h1>
        <p>Place <span style="font-family:var(--mono)">shadows-data.js</span> next to this file and reload.</p></div>`;
      return;
    }
    renderFooter();
    const closeMenu=()=>{ const m=$("hdrmenu"); if (m && !m.hidden){ m.hidden=true; const a=$("hdractions"), kb=a&&a.querySelector("[data-menu-toggle]"); if(kb) kb.setAttribute("aria-expanded","false"); } };
    document.addEventListener("keydown", e=>{
      if (e.key==="Escape"){ const dr=$("vdrawer"); if (dr && dr.classList.contains("open")) closeVitals(); closeMenu(); }
    });
    document.addEventListener("click", e=>{ const a=$("hdractions"); if (a && !a.contains(e.target)) closeMenu(); });
    renderHome();
  }
  boot();
})();
/*UI-END*/
