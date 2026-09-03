/*ENGINE-START*/
// Pure rules engine. No DOM. Reads window.SHADOWS_DATA; characters store inputs,
// everything else is computed here (SCHEMA.md core principle).
const Engine = (() => {
  const D = () => window.SHADOWS_DATA;

  function newCharacter(){
    return {
      meta:{ schemaVersion:"0.4", gamedataVersion:D().meta.gamedataVersion,
             created:new Date().toISOString(), updated:new Date().toISOString() },
      identity:{ name:"", age:null, build:"", hair:"", eyes:"", skin:"",
                 archetype:null, specialization:"", history:"" },
      creation:{ powerLevel:null,
                 rolls:{ statPoints:null, skillPoints:null, credits:null },
                 boosts:[], locked:false },
      // Archetype-specific creation inputs (schema 0.2 addition; see SCHEMA.md §3)
      archetypeChoices:{ rolls:{}, focusAllocation:{}, statBonusAllocation:{},
                         aberrations:[], subtype:null, focusedSkillPicks:[],
                         naturalAdvantages:[], disciplines:{} },
      stats: Object.fromEntries(D().stats.map(s=>[s.id,{base:1, ipe:0}])),
      skills:{},                       // id -> {rank, ipe}
      advantages:[], disadvantages:[], // {id, rank, notes}
      trackers:{ damage:0, luck:{bonus:0, spent:0}, san:{loss:0},
                 exhaustion:0, sfr:{spent:0},
                 credits:{current:0, ledger:[]},
                 adjustments:[],               // Phase 3: manual adjustments ledger
                 panel:{} },                   // Phase 3: generic archetype tracker panels
      panelData:{},                            // Phase 3: archetype table/toggle panel content
      powers:[], gear:[], weapons:[],
      progression:{ ip:{earned:0, log:[]}, milestonePoints:0,
                    milestones:{minor:[], major:[]} },
      sessions:[], notes:"",
      audit:[]                                 // Phase 3.3: reversible action log
    };
  }

  const powerLevel = ch => D().powerLevels.find(p=>p.id===ch.creation.powerLevel) || null;
  const archetype  = ch => D().archetypes.find(a=>a.id===ch.identity.archetype) || null;
  const skillById  = id => D().skills.find(s=>s.id===id);
  const advById    = id => D().advantages.find(a=>a.id===id);
  const disById    = id => D().disadvantages.find(d=>d.id===id);

  // Modifier curve. Values above 10 (Arcanist focus bonus) extrapolate the
  // linear top of the curve (+1 per point). FLAG: confirm with D.
  function statMod(v){
    const m = D().statRules.modifiers;
    if (v > 10) return m["10"] + (v - 10);
    if (v < 1) v = 1;
    return m[String(v)];
  }

  function boostsFor(ch, type, id){
    const e = ch.creation.boosts.find(b=>b.targetType===type && b.targetId===id);
    return e ? e.times : 0;
  }

  // Archetype-granted stat bonuses (Arcanist focus stats / Werewolf stat bonus)
  function archStatBonus(ch, statId){
    const ac = ch.archetypeChoices;
    return (ac.focusAllocation[statId]||0) + (ac.statBonusAllocation[statId]||0);
  }

  // Phase 3: manual adjustments ledger — for milestone benefits (e.g. Honed)
  // and other un-modeled effects. Stat adjustments cascade like any input.
  const adjFor = (ch, target) => (ch.trackers.adjustments||[])
    .reduce((s,a)=>s + (a.target===target ? a.amount : 0), 0);

  // Final stat value = creation base + archetype bonus + CP boosts + IPE + adjustments
  function statValue(ch, id){
    return ch.stats[id].base + archStatBonus(ch,id)
         + boostsFor(ch,"stat",id) + ch.stats[id].ipe + adjFor(ch,id);
  }
  function statTable(ch){
    const out = {};
    for (const s of D().stats){
      const v = statValue(ch, s.id);
      out[s.id] = { value:v, mod:statMod(v) };
    }
    return out;
  }

  // Scaling row for the chosen archetype at the chosen power level
  function scalingRow(ch){
    const a = archetype(ch), pl = powerLevel(ch);
    if (!a || !pl || !a.campaignPowerScaling || !a.campaignPowerScaling.byPowerLevel) return null;
    return a.campaignPowerScaling.byPowerLevel[pl.id] || null;
  }

  function derived(ch){
    const t = statTable(ch), out = {};
    for (const d of D().derived){
      if (d.type === "sumOfModifiers"){
        let v = d.base + d.inputs.reduce((s,id)=>s + t[id].mod, 0);
        if (d.floor != null) v = Math.max(d.floor, v);
        out[d.id] = v;
      } else if (d.type === "percent"){
        let v = t.EMP.value * 10;                      // SAN = EMP×10
        if (d.floor != null) v = Math.max(d.floor, v);
        if (d.cap   != null) v = Math.min(d.cap, v);
        out[d.id] = v;
      }
    }
    // Structured archetype scaling: Arcanist TOL bonus applies on top
    const row = scalingRow(ch);
    if (row && typeof row.tolBonus === "number") out.TOL += row.tolBonus;
    // Manual adjustments (flat, post-compute)
    out.TOL += adjFor(ch,"TOL"); out.WILL += adjFor(ch,"WILL"); out.SAN += adjFor(ch,"SAN");
    return out;
  }

  function health(ch){
    const hl = D().resources.healthLevels;
    const bod = statValue(ch,"BOD");
    const levels = Math.min(bod, hl.maxLevels);
    const hpPer  = hl.hpPerLevel + Math.max(0, bod - hl.maxLevels); // BOD>10 rule
    return { levels, hpPer, total: levels*hpPer + adjFor(ch,"HP") };
  }

  function sfr(ch){
    const row = scalingRow(ch);
    if (!row || !row.startingSFR) return null;
    const will = derived(ch).WILL;
    const m = /WILL\*3 \+ (\d+)/.exec(row.startingSFR);
    return m ? { value: will*3 + Number(m[1]), rou: row.rou, formula: row.startingSFR } : { value:null, rou:row.rou, formula:row.startingSFR };
  }

  // ── Pools ────────────────────────────────────────────────────────────
  function statPool(ch){
    const pl = powerLevel(ch);
    if (!pl) return null;
    const r = ch.creation.rolls.statPoints;
    return { base:pl.statPoints.base, roll:r, rollDie:pl.statPoints.roll,
             total: r==null ? null : pl.statPoints.base + r };
  }
  const statSpent = ch => D().stats.reduce((s,st)=>s + (ch.stats[st.id].base - D().statRules.base), 0);

  function skillPool(ch){
    const pl = powerLevel(ch);
    if (!pl) return null;
    const r = ch.creation.rolls.skillPoints;
    return { base:pl.skillPoints.base, roll:r, rollDie:pl.skillPoints.roll,
             total: r==null ? null : pl.skillPoints.base + r };
  }
  const skillSpent = ch => Object.values(ch.skills).reduce((s,k)=>s + k.rank, 0);

  // ── Character Points ─────────────────────────────────────────────────
  // Assumption (flag for D): ranked Advantages cost `cost` PER RANK.
  const advSpent  = ch => ch.advantages.reduce((s,a)=>{
    if (a.notes === "natural") return s;                    // Professional pool: free
    const def = advById(a.id); return s + (def ? def.cost * a.rank : 0);
  }, 0);
  const disGranted = ch => ch.disadvantages.reduce((s,d)=>{
    const def = disById(d.id); return s + (def ? def.pointsGranted * d.rank : 0);
  }, 0);
  const luckSpent = ch => ch.trackers.luck.bonus * D().resources.luck.cpCostPerPoint;
  const boostSpent = ch => ch.creation.boosts
    .filter(b=>b.targetType!=="power")
    .reduce((s,b)=>s + b.times * D().creationFlow.boostRules.cpCostPerPoint, 0);
  // Arcanist Disciplines at creation: 6 CP per rank above starting (REF note)
  function disciplineSpent(ch){
    const a = archetype(ch);
    if (!a || a.id!=="arcanist") return 0;
    const cost = 6;
    return Object.values(ch.archetypeChoices.disciplines||{}).reduce((s,r)=>s + r*cost, 0);
  }
  function cp(ch){
    const pl = powerLevel(ch);
    if (!pl) return null;
    const budget = pl.characterPoints + disGranted(ch);
    const spent  = advSpent(ch) + luckSpent(ch) + boostSpent(ch) + disciplineSpent(ch);
    return { base:pl.characterPoints, granted:disGranted(ch), budget, spent, left:budget-spent };
  }

  // ── Boost rules (Locked Decision #3) ────────────────────────────────
  function canBoost(ch, type, id){
    const pl = powerLevel(ch);
    if (!pl) return {ok:false, why:"No power level."};
    const times = boostsFor(ch, type, id);
    if (type!=="luck" && times >= pl.maxBoost)
      return {ok:false, why:`Max Boost reached (${pl.maxBoost}× per target).`};
    if (type==="stat" && statValue(ch,id) >= D().statRules.max)
      return {ok:false, why:"Stat cap 10."};
    if (type==="skill"){
      const rank = (ch.skills[id] ? ch.skills[id].rank : 0) + times;
      if (rank >= pl.maxSkillRank) return {ok:false, why:`Max Skill Rank ${pl.maxSkillRank}.`};
    }
    const bal = cp(ch);
    if (bal && bal.left < D().creationFlow.boostRules.cpCostPerPoint)
      return {ok:false, why:"No Character Points left."};
    return {ok:true};
  }
  function addBoost(ch, type, id, delta){
    let e = ch.creation.boosts.find(b=>b.targetType===type && b.targetId===id);
    if (!e && delta>0){ e = {targetType:type, targetId:id, times:0}; ch.creation.boosts.push(e); }
    if (!e) return;
    e.times = Math.max(0, e.times + delta);
    if (e.times===0) ch.creation.boosts = ch.creation.boosts.filter(b=>b!==e);
  }

  // Normalize stat ids referenced by skills (tolerates legacy aliases like "BODY").
  // The keys are the pre-Shadows stat vocabulary; every value must be a live id in
  // `stats`. B2: ATTRACTIVENESS and MOVEMENT pointed at "ATTR"/"MA" — the old
  // system's own abbreviations, not Shadows ids — and an unresolvable alias came
  // back truthy, so skillLine threw on `t[pri].value` instead of raising its
  // dataWarning. The target is now verified, so a stale alias degrades to null.
  const STAT_ALIASES = { BODY:"BOD", REFLEX:"REF", REFLEXES:"REF", INTELLIGENCE:"INT", EMPATHY:"EMP", TECHNIQUE:"TECH", ATTRACTIVENESS:"MAG", MOVEMENT:"MOB" };
  function normStat(id){
    if (!id) return null;
    const known = v => D().stats.some(s=>s.id===v);
    const u = String(id).toUpperCase();
    if (known(u)) return u;
    const alias = STAT_ALIASES[u];
    return (alias && known(alias)) ? alias : null;
  }

  // Effective skill data for display: rank incl. boosts + IPE; check preview.
  // Phase 3: the current Pain Level penalty applies to all skill checks and is
  // carried in the breakdown so the sheet can show *why* a total is modified.
  function skillLine(ch, id){
    const def = skillById(id);
    const rank = ((ch.skills||{})[id] ? ch.skills[id].rank + ch.skills[id].ipe : 0) + boostsFor(ch,"skill",id);
    // B10: a saved character can hold a skill id the game data no longer
    // defines — versionCheck reports exactly that case, so every reader has to
    // survive it. Found by the totality guard on its first run: the review
    // screen iterates ch.skills directly and died on an orphaned id.
    if (!def) return { def:{ id, name:id, category:"", description:"", flavorLine:"",
                             primaryStat:null, synergyStat:null },
                       rank, trained:rank>0, checkBonus:0,
                       breakdown:{ rank, primary:{id:null,value:0}, synergy:{id:null,mod:0}, pain:0 },
                       dataWarning:`Skill "${id}" is no longer in the game data.` };
    const t = statTable(ch);
    const pri = normStat(def.primaryStat), syn = normStat(def.synergyStat);
    const priVal = pri ? t[pri].value : 0;
    const synMod = syn ? t[syn].mod : 0;
    const pain = painState(ch).skillPenalty;        // 0 or negative
    const base = rank>0 ? rank + priVal + synMod : priVal;
    return { def, rank, trained:rank>0, checkBonus: base + pain,
             breakdown:{ rank, primary:{id:pri, value:priVal}, synergy:{id:syn, mod:synMod}, pain },
             dataWarning: (pri && syn) ? null : `Skill "${def.name}" references an unknown stat (${!pri?def.primaryStat:def.synergyStat}).` };
  }

  // ════ PHASE 3 — CONDITION, PROGRESSION, SESSIONS ══════════════════════

  // Pain Level from damage taken. HL lost = full Health Levels of HP gone.
  function painState(ch){
    const hl = D().resources.healthLevels;
    const h = health(ch);
    const dmg = Math.max(0, ch.trackers.damage||0);
    const hlLost = h.hpPer>0 ? Math.min(h.levels, Math.floor(dmg / h.hpPer)) : 0;
    let lvl = hl.painLevels[0];
    for (const p of hl.painLevels) if (hlLost >= p.hlLostThreshold) lvl = p;
    const pen = hl.painPenaltiesPerLevel;
    return { hlLost, level: lvl.level, label: lvl.label, description: lvl.description,
             // `|| 0` normalises the -0 that `0 * -1` produces at Pain Level 0.
             skillPenalty:   lvl.level * pen.skillChecks || 0,
             essencePenalty: lvl.level * pen.essenceCheckDice || 0,
             breakerPenalty: lvl.level * pen.breakerCheckPercent || 0,
             // B8: the CRB floors these two "to prevent automatic loss". The
             // engine cannot APPLY them -- it never sees the player's dice pool
             // or target number -- so it carries them out to be displayed
             // beside the penalty. They lived in the data as unread prose.
             essenceFloor:   pen.essenceCheckDiceFloor,
             breakerFloor:   pen.breakerCheckPercentFloor,
             penaltyNotes: pen.notes,
             hpLeft: Math.max(0, h.total - dmg), down: h.total>0 && dmg >= h.total };
  }

  function luckState(ch){
    const L = D().resources.luck;
    const max = L.startingValue + ch.trackers.luck.bonus + adjFor(ch,"LUCK");
    const spent = ch.trackers.luck.spent||0;
    return { max, spent, current: Math.max(0, max - spent),
             spendActions: L.spend||[], refresh: L.refresh };
  }

  function sanState(ch){
    const max = derived(ch).SAN;
    const loss = ch.trackers.san.loss||0;
    return { max, loss, current: Math.max(0, max - loss) };
  }

  // Professional Focused Skills: subtype list (matched by name, plural-tolerant
  // — F10 names like "Handgun" vs "Handguns") + creation picks. Focused skills
  // advance at 3× current rank instead of 5×.
  function focusedSkillIds(ch){
    const a = archetype(ch);
    if (!a || a.id!=="professional") return [];
    const sub = ((a.specialization||{}).options||[]).find(o=>o.id===ch.archetypeChoices.subtype);
    const ids = new Set(ch.archetypeChoices.focusedSkillPicks||[]);
    const norm = s => String(s).toLowerCase().replace(/[^a-z]/g,"").replace(/s$/,"");
    if (sub) for (const fname of (sub.focusedSkills||[])){
      if (/chosen at creation/i.test(fname)) continue;
      const hit = D().skills.find(sk => norm(sk.name)===norm(fname));
      if (hit) ids.add(hit.id);
    }
    return [...ids];
  }

  // ── Improvement Points: the journal is the audit trail ────────────────
  function ipState(ch){
    const log = ch.progression.ip.log||[];
    const fromSessions = (ch.sessions||[]).reduce((s,x)=>s + (Number(x.ipEarned)||0), 0);
    const grants = log.filter(e=>e.kind==="grant").reduce((s,e)=>s+e.amount, 0);
    const spent  = log.filter(e=>e.kind!=="grant").reduce((s,e)=>s+e.amount, 0);
    const earned = (ch.progression.ip.earned||0) + fromSessions + grants;
    return { earned, spent, available: earned - spent, log };
  }
  function ipCost(ch, targetType, targetId){
    if (targetType==="stat"){
      if (D().ip.cannotRaiseDirectly.includes(targetId))
        return {ok:false, why:`${targetId} cannot be raised directly with IP.`};
      const cur = statValue(ch, targetId);
      if (cur >= D().statRules.max) return {ok:false, why:`Stat cap ${D().statRules.max}.`};
      return {ok:true, cost: cur*10, from:cur, to:cur+1};
    }
    const line = skillLine(ch, targetId);
    const cur = line.rank;
    if (cur >= D().ip.rankCap) return {ok:false, why:`Rank cap ${D().ip.rankCap}.`};
    const focused = focusedSkillIds(ch).includes(targetId);
    // F14: "5 × current rank" makes rank 0→1 free — costed as rank 1 pending ruling.
    const cost = (focused?3:5) * Math.max(1, cur);
    return {ok:true, cost, from:cur, to:cur+1, focused};
  }
  function spendIP(ch, targetType, targetId, note){
    const c = ipCost(ch, targetType, targetId);
    if (!c.ok) return c;
    if (ipState(ch).available < c.cost) return {ok:false, why:`Not enough IP (need ${c.cost}).`};
    if (targetType==="stat") ch.stats[targetId].ipe += 1;
    else { if (!ch.skills[targetId]) ch.skills[targetId]={rank:0, ipe:0}; ch.skills[targetId].ipe += 1; }
    ch.progression.ip.log.push({ date:new Date().toISOString(), kind:"spend", amount:c.cost,
      targetType, targetId, from:c.from, to:c.to, note:note||"" });
    return {ok:true, cost:c.cost};
  }
  function grantIP(ch, amount, note){
    amount = Math.max(0, Math.floor(Number(amount)||0));
    if (!amount) return {ok:false, why:"Enter an IP amount."};
    ch.progression.ip.log.push({ date:new Date().toISOString(), kind:"grant", amount, note:note||"" });
    return {ok:true};
  }
  // undoIP was retired by Decision 49 and removed by B4: every IP mutation goes
  // through commit() -> recordAction(), so undoLastAction reverses it structurally.

  // ── Milestones ────────────────────────────────────────────────────────
  // Minor unlock at 5, 15, 25… MP; Major at 10, 20, 30… MP.
  function milestoneState(ch){
    // B9: the cadence used to be stated twice -- as prose in the data ("5, 15,
    // 25...") and as arithmetic here -- with nothing connecting them, and
    // milestonePointsPerSession was inert. Both now come from the data.
    const r = D().milestones.rules;
    const per = r.milestonePointsPerSession==null ? 1 : r.milestonePointsPerSession;
    const sessionMP = (ch.sessions||[]).filter(s=>s.milestonePoint!==false).length * per;
    const mp = sessionMP + ((ch.progression||{}).milestonePoints||0);
    const avail = (first, every) => (every>0 && mp>=first) ? Math.floor((mp-first)/every)+1 : 0;
    const minorAvail = avail(r.minorFirstAt, r.minorEvery);
    const majorAvail = avail(r.majorFirstAt, r.majorEvery);
    const minorTaken = ch.progression.milestones.minor||[];
    const majorTaken = ch.progression.milestones.major||[];
    return { mp, sessionMP, manualMP: ch.progression.milestonePoints||0,
             minorAvail, majorAvail, minorTaken, majorTaken,
             minorLeft: minorAvail - minorTaken.length,
             majorLeft: majorAvail - majorTaken.length };
  }
  function canTakeMinor(ch, id){
    const st = milestoneState(ch);
    if (st.minorLeft<=0) return {ok:false, why:"No Minor Milestone unlocked (next at 5, 15, 25… MP)."};
    // "May not duplicate until each Minor Milestone has been selected."
    const counts = {};
    for (const m of D().milestones.minorShared) counts[m.id]=0;
    for (const t of st.minorTaken) counts[t.id]=(counts[t.id]||0)+1;
    const floor = Math.min(...Object.values(counts));
    if ((counts[id]||0) > floor)
      return {ok:false, why:"May not repeat a Minor until each has been selected once."};
    return {ok:true};
  }
  // Major prerequisites: machine-checkable parts are enforced; prose parts are
  // surfaced for the table to adjudicate (returned in `manual`).
  function majorPrereqs(ch, m){
    const st = milestoneState(ch);
    const met=[], unmet=[], manual=[];
    if (st.majorTaken.some(t=>t.id===m.id)) unmet.push("Already taken — Majors are once each.");
    const p = m.prerequisites||{};
    if (p.majorCount){
      (st.majorTaken.length>=p.majorCount ? met : unmet)
        .push(`${p.majorCount} Major Milestone${p.majorCount>1?"s":""} taken`);
    }
    const skillName = id => (skillById(id)||{name:id}).name;
    const advName   = id => (advById(id)||{name:id}).name;
    if (p.skills){
      if (p.skills.any){
        const ok = p.skills.any.some(([id,r])=> skillById(id) && skillLine(ch,id).rank>=r);
        (ok?met:unmet).push("Skill: "+p.skills.any.map(([id,r])=>`${skillName(id)} ${r}+`).join(" or "));
      }
      if (p.skills.all){
        const ok = p.skills.all.every(([id,r])=> skillById(id) && skillLine(ch,id).rank>=r);
        (ok?met:unmet).push("Skills: "+p.skills.all.map(([id,r])=>`${skillName(id)} ${r}+`).join(" and "));
      }
      if (p.skills.note) manual.push(p.skills.note);
    }
    if (p.advantages){
      if (p.advantages.all){
        const ok = p.advantages.all.every(([id,r])=>
          (ch.advantages||[]).some(a=>a.id===id && a.rank>=r));
        (ok?met:unmet).push("Advantages: "+p.advantages.all.map(([id,r])=>`${advName(id)}${r>1?" "+r+"+":""}`).join(", "));
      }
      if (p.advantages.note) manual.push(p.advantages.note);
    }
    if (p.milestones){
      const ok = p.milestones.every(id=>st.majorTaken.some(t=>t.id===id));
      const names = p.milestones.map(id=>((D().milestones.majorGeneral||[]).find(x=>x.id===id)||{name:id}).name);
      (ok?met:unmet).push("Milestone: "+names.join(", "));
    }
    if (p.gear) manual.push(typeof p.gear==="string" ? p.gear : "Gear requirement — see text");
    if (p.note) manual.push(p.note);
    if (p.gmApproval) manual.push("Requires GM approval");
    return { met, unmet, manual, ok: unmet.length===0 };
  }
  function takeMilestone(ch, tier, id){
    if (tier==="minor"){
      const c = canTakeMinor(ch, id); if (!c.ok) return c;
      ch.progression.milestones.minor.push({id, date:new Date().toISOString()});
    } else {
      const m = (D().milestones.majorGeneral||[]).find(x=>x.id===id);
      if (!m) return {ok:false, why:"Unknown milestone."};
      const st = milestoneState(ch);
      if (st.majorLeft<=0) return {ok:false, why:"No Major Milestone unlocked (next at 10, 20, 30… MP)."};
      const pre = majorPrereqs(ch, m); if (!pre.ok) return {ok:false, why:pre.unmet.join(" ")};
      ch.progression.milestones.major.push({id, date:new Date().toISOString()});
    }
    return {ok:true};
  }
  const untakeMilestone = (ch, tier, idx) =>
    ch.progression.milestones[tier].splice(idx, 1);

  // ── Sessions ─────────────────────────────────────────────────────────
  // Auto-grants per-session IP (overridable) + 1 Milestone Point, and
  // refreshes LUCK — it only resets "when a session truly ends".
  function logSession(ch, s){
    ch.sessions.push({
      date: s.date || new Date().toISOString().slice(0,10),
      title: s.title||"",
      ipEarned: Math.max(0, Number(s.ipEarned)||0),
      milestonePoint: s.milestonePoint!==false,
      notes: s.notes||""
    });
    ch.trackers.luck.spent = 0;
    return {ok:true};
  }

  // ── Çredits ──────────────────────────────────────────────────────────
  function addCredits(ch, amount, note){
    amount = Math.trunc(Number(amount)||0);
    if (!amount) return {ok:false, why:"Enter an amount."};
    ch.trackers.credits.current = (ch.trackers.credits.current||0) + amount;
    ch.trackers.credits.ledger.push({date:new Date().toISOString(), amount, note:note||""});
    return {ok:true};
  }

  // ── Archetype sheet panels (declared in data; rendered generically) ──
  const archPanels = ch => {
    const a = archetype(ch);
    return (a && a.coreMechanic && a.coreMechanic.panels) || [];
  };
  function panelMax(ch, p){
    if (p.max==="TOL") return derived(ch).TOL;
    if (p.max==="startingSFR"){ const s=sfr(ch); return s && s.value!=null ? s.value : null; }
    return typeof p.max==="number" ? p.max : null;
  }
  function disciplineRanks(ch){
    const a = archetype(ch);
    if (!a || !a.coreMechanic || !a.coreMechanic.disciplines) return [];
    const row = scalingRow(ch);
    return a.coreMechanic.disciplines.list.map(d=>{
      const base = (d.id==="evocation" && row) ? (row.evocationStartingRank||0) : 0;
      const bought = (ch.archetypeChoices.disciplines||{})[d.id]||0;
      return { id:d.id, name:d.name, rank: base+bought, description:d.description };
    });
  }

  // ════ PHASE 3.3 — AUDIT TRAIL & UNDO ═════════════════════════════════
  // A reversible record of every play/admin action, stored on ch.audit. Each
  // entry is { seq, date, kind, label, patch }, where patch is a compact diff
  // (scalars by path; arrays as append / removeAt / set) sufficient to restore
  // the prior state. Undo is last-in-first-out: it pops the most recent entry
  // and applies its inverse. Older mistakes are corrected in Admin mode, which
  // records here too — so this log is the single, complete history.
  function _eq(a,b){
    if (a===b) return true;
    if (a==null || b==null) return a===b;
    if (typeof a!=="object" || typeof b!=="object") return false;
    if (Array.isArray(a)!==Array.isArray(b)) return false;
    const ak=Object.keys(a), bk=Object.keys(b);
    if (ak.length!==bk.length) return false;
    for (const k of ak){ if(!(k in b)) return false; if(!_eq(a[k],b[k])) return false; }
    return true;
  }
  const _clone = x => (x===undefined ? undefined : JSON.parse(JSON.stringify(x)));

  function _walk(b, a, path, ops){
    const bArr=Array.isArray(b), aArr=Array.isArray(a);
    if (bArr && aArr) return _arrayDiff(b, a, path, ops);
    const bObj = b && typeof b==="object" && !bArr;
    const aObj = a && typeof a==="object" && !aArr;
    if (bObj && aObj){
      const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
      for (const k of keys) _walk(b[k], a[k], path.concat(k), ops);
      return;
    }
    // scalar, or a shape change (object<->array<->scalar): store prior value
    if (!_eq(b, a)) ops.push({ path:path.slice(), type:"scalar", before:_clone(b) });
  }
  function _arrayDiff(b, a, path, ops){
    if (_eq(b, a)) return;
    if (a.length > b.length && _eq(a.slice(0, b.length), b)){
      ops.push({ path:path.slice(), type:"array", op:"append", count:a.length-b.length });
      return;
    }
    if (b.length === a.length+1){
      for (let i=0;i<b.length;i++){
        if (_eq(b.slice(0,i).concat(b.slice(i+1)), a)){
          ops.push({ path:path.slice(), type:"array", op:"removeAt", index:i, item:_clone(b[i]) });
          return;
        }
      }
    }
    ops.push({ path:path.slice(), type:"array", op:"set", before:_clone(b) });   // fallback
  }
  // Diff prior vs current character. Skips the log itself and volatile meta.updated.
  function diffChar(before, after){
    const ops=[];
    const keys = new Set([...Object.keys(before||{}), ...Object.keys(after||{})]);
    for (const k of keys){ if (k==="audit"||k==="meta") continue; _walk((before||{})[k], (after||{})[k], [k], ops); }
    return ops;
  }
  function _container(ch, path){ let o=ch; for (let i=0;i<path.length-1;i++) o=o[path[i]]; return o; }
  function _applyOp(ch, op){
    const cont=_container(ch, op.path), key=op.path[op.path.length-1];
    if (!cont || typeof cont!=="object") return;
    if (op.type==="scalar"){
      if (op.before===undefined) delete cont[key];
      else cont[key]=_clone(op.before);
      return;
    }
    const arr=cont[key];
    if (op.op==="append"){ if (Array.isArray(arr)) arr.length=Math.max(0, arr.length-op.count); }
    else if (op.op==="removeAt"){ if (Array.isArray(arr)) arr.splice(op.index,0,_clone(op.item)); }
    else if (op.op==="set"){ cont[key]=_clone(op.before); }
  }
  function recordAction(ch, kind, label, before){
    if (!Array.isArray(ch.audit)) ch.audit=[];
    const patch=diffChar(before, ch);
    if (!patch.length) return { ok:false, noop:true };
    const seq=(ch.audit.length ? ch.audit[ch.audit.length-1].seq : 0) + 1;
    ch.audit.push({ seq, date:new Date().toISOString(), kind:kind||"edit", label:label||"", patch });
    return { ok:true, seq };
  }
  function undoLastAction(ch){
    const log=ch.audit||[];
    if (!log.length) return { ok:false, why:"Nothing to undo." };
    const entry=log[log.length-1];
    for (let i=entry.patch.length-1;i>=0;i--) _applyOp(ch, entry.patch[i]);
    log.pop();
    return { ok:true, undone:entry };
  }

  // ── Migration: fill missing fields on older character files ──────────
  // B6: migrate() is version-agnostic — it backfills unconditionally rather
  // than stepping 0.1 -> 0.2 -> 0.3 -> 0.4. That makes its COMPLETENESS the
  // migration guarantee: every field newCharacter() has ever grown must be
  // reachable here, or an old file opens with holes and the engine throws
  // straight through them. archetypeChoices arrived in 0.2 and never got a
  // backfill, so a pre-0.2 character crashed statValue() on the first render
  // and the sheet could not open at all.
  //
  // _fillDefaults walks the CURRENT shape, so a field added tomorrow is
  // covered by construction instead of by remembering to add a line here.
  function _fillDefaults(target, shape){
    for (const k of Object.keys(shape)){
      const d = shape[k];
      if (Array.isArray(d)){
        if (!Array.isArray(target[k])) target[k] = _clone(d);
      } else if (d && typeof d === "object"){
        if (!target[k] || typeof target[k] !== "object" || Array.isArray(target[k])) target[k] = _clone(d);
        else _fillDefaults(target[k], d);
      } else if (target[k] === undefined){
        target[k] = d;
      }
    }
    return target;
  }

  function migrate(c){
    if (!c || typeof c !== "object") c = {};
    // meta is filled explicitly below: seeding gamedataVersion from the current
    // data would mask the exact mismatch versionCheck exists to report.
    const shape = newCharacter(); delete shape.meta;
    _fillDefaults(c, shape);
    const t = c.trackers = Object.assign({damage:0, exhaustion:0}, c.trackers||{});
    t.luck    = Object.assign({bonus:0, spent:0}, t.luck);
    t.san     = Object.assign({loss:0}, t.san);
    t.sfr     = Object.assign({spent:0}, t.sfr);
    t.credits = Object.assign({current:0, ledger:[]}, t.credits);
    if (!Array.isArray(t.credits.ledger)) t.credits.ledger=[];
    if (!Array.isArray(t.adjustments)) t.adjustments=[];
    if (!t.panel || typeof t.panel!=="object") t.panel={};
    if (!c.panelData || typeof c.panelData!=="object") c.panelData={};
    const pr = c.progression = Object.assign({milestonePoints:0}, c.progression||{});
    pr.ip = Object.assign({earned:0, log:[]}, pr.ip);
    if (!Array.isArray(pr.ip.log)) pr.ip.log=[];
    pr.milestones = Object.assign({minor:[], major:[]}, pr.milestones);
    if (!Array.isArray(c.sessions)) c.sessions=[];
    c.gear=c.gear||[]; c.weapons=c.weapons||[]; c.powers=c.powers||[];
    if (typeof c.notes!=="string") c.notes="";
    if (!Array.isArray(c.audit)) c.audit=[];      // Phase 3.3
    // meta exists but gamedataVersion is deliberately NOT seeded: inventing it
    // from the loaded data would mask the mismatch versionCheck must report.
    if (!c.meta || typeof c.meta!=="object") c.meta = {};
    c.meta.schemaVersion = "0.4";
    return c;
  }


  function validate(stepId, ch){
    const out = [], pl = powerLevel(ch), a = archetype(ch);
    const E=(m)=>out.push({level:"error",msg:m}), W=(m)=>out.push({level:"warn",msg:m});
    if (stepId==="power-level"){ if (!pl) E("Choose a Campaign Power Level."); }
    if (stepId==="concept"){ if (!String((ch.identity||{}).name||"").trim()) E("Your character needs a name."); }
    if (stepId==="stats"){
      // B7: the pools are null until a power level is chosen. validate() must
      // report that, never throw — a corrupt import or an admin edit gets here
      // even though the wizard gates it.
      const p = statPool(ch);
      if (!p) E("Choose a Campaign Power Level before assigning Stat Points.");
      else if (p.roll==null) E(`Enter your ${p.rollDie} Stat Point roll.`);
      else {
        const left = p.total - statSpent(ch);
        if (left < 0) E(`Stat Points overspent by ${-left}.`);
        else if (left > 0) W(`${left} Stat Points unspent.`);
      }
    }
    if (stepId==="archetype"){
      if (!a) { E("Choose an Archetype."); return out; }
      if (a.specialization && a.specialization.required && a.specialization.options.length){
        if (!ch.identity.specialization) E(`Choose a ${a.specialization.label}.`);
      }
      // Player-facing: the engine writes copy as well as the UI. Pulled from
      // appCopy so the voice stays a data edit (Decision 71).
      if (a.status==="tbd"){
        const t = ((D().appCopy||{}).archetypeUnwritten) || "{name}'s rules aren't finished yet.";
        W(t.replace("{name}", a.name));
      }
      const row = scalingRow(ch);
      if (row && row.focusStatBonusRoll){
        const r = ch.archetypeChoices.rolls.focusStatBonus;
        if (r==null) E(`Enter your ${row.focusStatBonusRoll} Focus Stat bonus roll.`);
        else {
          const used = Object.values(ch.archetypeChoices.focusAllocation).reduce((s,v)=>s+v,0);
          if (used > r) E(`Focus Stat bonus overspent by ${used-r}.`);
          else if (used < r) W(`${r-used} Focus Stat bonus points unallocated.`);
        }
        const need = row.aberrations||0, have = ch.archetypeChoices.aberrations.length;
        if (have < need) E(`Choose ${need} Aberration${need>1?"s":""} (${have}/${need}).`);
        if (have > need) E(`Too many Aberrations chosen (${have}/${need}).`);
      }
      if (row && row.statBonusRoll){
        const r = ch.archetypeChoices.rolls.statBonus;
        if (r==null) E(`Enter your ${row.statBonusRoll} Stat Bonus roll.`);
        else {
          const used = Object.values(ch.archetypeChoices.statBonusAllocation).reduce((s,v)=>s+v,0);
          if (used > r) E(`Stat Bonus overspent by ${used-r}.`);
          else if (used < r) W(`${r-used} Stat Bonus points unallocated.`);
        }
      }
      if (a.id==="professional"){
        const sub = (a.specialization.options||[]).find(o=>o.id===ch.archetypeChoices.subtype);
        if (sub && sub.requiredStats){
          for (const [sid,req] of Object.entries(sub.requiredStats)){
            if (statValue(ch,sid) < req) E(`${sub.name} requires ${sid} ${req} (you have ${statValue(ch,sid)}).`);
          }
        }
        if (sub){
          const chooseN = (sub.focusedSkills||[]).filter(f=>/chosen at creation/i.test(f));
          if (chooseN.length){
            const m = /^(\d+)/.exec(chooseN[0]); const need = m?Number(m[1]):2;
            if (ch.archetypeChoices.focusedSkillPicks.length !== need)
              E(`Pick ${need} Combat Skills for your Focused Skills (${ch.archetypeChoices.focusedSkillPicks.length}/${need}).`);
          }
          const row2 = scalingRow(ch);
          const have = ch.archetypeChoices.naturalAdvantages.reduce((s,n)=>s+n.rank,0);
          if (row2 && have !== row2.naturalAdvantageRanks)
            E(`Allocate ${row2.naturalAdvantageRanks} Natural Advantage ranks (${have}/${row2.naturalAdvantageRanks}).`);
        }
      }
    }
    if (stepId==="skills"){
      const p = skillPool(ch);
      if (!p) E("Choose a Campaign Power Level before assigning Skill Points.");
      else if (p.roll==null) E(`Enter your ${p.rollDie} Skill Point roll.`);
      else {
        const left = p.total - skillSpent(ch);
        if (left < 0) E(`Skill Points overspent by ${-left}.`);
        else if (left > 0) W(`${left} Skill Points unspent.`);
      }
    }
    if (stepId==="character-points"){
      const bal = cp(ch);
      if (!bal) E("Choose a Campaign Power Level before spending Character Points.");
      else if (bal.left < 0) E(`Character Points overspent by ${-bal.left}.`);
      else if (bal.left > 0) W(`${bal.left} Character Points unspent.`);
      if (a && a.canPurchaseAdvantages===false && ch.advantages.some(x=>x.notes!=="natural"))
        E(`${a.name}s cannot purchase Advantages.`);
    }
    if (stepId==="review"){
      if (ch.creation.rolls.credits==null) W(`Enter your starting Çredits roll (${pl?pl.startingCredits.roll+" × "+pl.startingCredits.multiplier:""}).`);
      for (const s of ["power-level","concept","stats","archetype","skills","character-points"])
        for (const i of validate(s,ch)) out.push(i);
    }
    return out;
  }

  function buildExport(ch){
    const c = JSON.parse(JSON.stringify(ch));
    c.meta.updated = new Date().toISOString();
    c.meta.gamedataVersion = D().meta.gamedataVersion;
    const pl = powerLevel(ch);
    // Seed starting Çredits from the creation roll — but never overwrite a
    // tracked total once play transactions exist (Phase 3).
    if (pl && c.creation.rolls.credits!=null && (c.trackers.credits.ledger||[]).length===0)
      c.trackers.credits.current = c.creation.rolls.credits * pl.startingCredits.multiplier;
    return c;
  }

  function versionCheck(c){
    const issues = [];
    const saved = (c.meta||{}).gamedataVersion;
    if (saved !== D().meta.gamedataVersion)
      issues.push(`Character was saved against game data ${saved==null?"(unrecorded)":saved}; loaded data is ${D().meta.gamedataVersion}.`);
    for (const id of Object.keys(c.skills||{}))
      if (!skillById(id)) issues.push(`Skill "${id}" no longer exists in game data.`);
    for (const a of c.advantages||[])
      if (!advById(a.id)) issues.push(`Advantage "${a.id}" no longer exists in game data.`);
    for (const d of c.disadvantages||[])
      if (!disById(d.id)) issues.push(`Disadvantage "${d.id}" no longer exists in game data.`);
    // Phase 3: milestone ids + IP journal vs. IPE consistency
    for (const t of ((c.progression||{}).milestones||{}).minor||[])
      if (!(D().milestones.minorShared||[]).some(m=>m.id===t.id))
        issues.push(`Minor Milestone "${t.id}" no longer exists in game data.`);
    for (const t of ((c.progression||{}).milestones||{}).major||[])
      if (!(D().milestones.majorGeneral||[]).some(m=>m.id===t.id))
        issues.push(`Major Milestone "${t.id}" no longer exists in game data.`);
    const log = (((c.progression||{}).ip)||{}).log||[];
    const perTarget = {};
    for (const e of log) if (e.kind!=="grant")
      perTarget[e.targetType+"|"+e.targetId] = (perTarget[e.targetType+"|"+e.targetId]||0)+1;
    for (const [k,n] of Object.entries(perTarget)){
      const [type,id] = k.split("|");
      const ipe = type==="stat" ? ((c.stats||{})[id]||{}).ipe||0
                                : ((c.skills||{})[id]||{}).ipe||0;
      if (ipe !== n) issues.push(`IP journal shows ${n} increase${n>1?"s":""} on ${id} but IPE is ${ipe} — totals may have been edited by hand.`);
    }
    return issues;
  }

  return { D, newCharacter, powerLevel, archetype, skillById, advById, disById,
           statMod, statValue, statTable, archStatBonus, boostsFor, addBoost, canBoost,
           scalingRow, derived, health, sfr, statPool, statSpent, skillPool, skillSpent,
           advSpent, disGranted, luckSpent, boostSpent, disciplineSpent, cp,
           skillLine, validate, buildExport, versionCheck,
           // Phase 3
           adjFor, painState, luckState, sanState, focusedSkillIds,
           ipState, ipCost, spendIP, grantIP,
           milestoneState, canTakeMinor, majorPrereqs, takeMilestone, untakeMilestone,
           logSession, addCredits, archPanels, panelMax, disciplineRanks, migrate,
           // Phase 3.3 — audit trail & undo
           diffChar, recordAction, undoLastAction };
})();
/*ENGINE-END*/
