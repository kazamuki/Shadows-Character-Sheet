/*ENGINE-START*/
// Pure rules engine. No DOM. Reads window.SHADOWS_DATA; characters store inputs,
// everything else is computed here (SCHEMA.md core principle).
const Engine = (() => {
  const D = () => window.SHADOWS_DATA;
  // A catalog lookup by id — one shape for every table, null when absent.
  const byId = key => id => (D()[key]||[]).find(x=>x && x.id===id) || null;
  // A stored count (damage, Integrity lost, a typed RES…) read as a whole
  // number ≥ 0. Anything unreadable is 0: the engine is total (constraint 8).
  const nonNegInt = v => Math.max(0, Math.floor(Number(v)||0));

  function newCharacter(){
    return {
      meta:{ schemaVersion:"0.8", gamedataVersion:D().meta.gamedataVersion,
             created:new Date().toISOString(), updated:new Date().toISOString() },
      // No `specialization` here: schema 0.5 stores it once, in
      // archetypeChoices.specialization, and derives the display string (A3).
      identity:{ name:"", age:null, build:"", hair:"", eyes:"", skin:"",
                 archetype:null, history:"" },
      creation:{ powerLevel:null,
                 rolls:{ statPoints:null, skillPoints:null, credits:null },
                 boosts:[], locked:false },
      // Archetype-specific creation inputs (schema 0.2 addition; see SCHEMA.md §3)
      archetypeChoices:{ rolls:{}, focusAllocation:{}, statBonusAllocation:{},
                         specialization:[], focusedSkillPicks:[],
                         naturalAdvantages:[], disciplines:{} },
      stats: Object.fromEntries(D().stats.map(s=>[s.id,{base:1, ipe:0}])),
      skills:{},                       // id -> {rank, ipe}
      advantages:[], disadvantages:[], // {id, rank, notes, selections?}
      trackers:{ damage:0, luck:{bonus:0, spent:0}, san:{loss:0},
                 sfr:{spent:0},
                 // Schema 0.8 (Decision 95). Active Conditions are inputs;
                 // their Pain, penalties and the Helpless banner are derived.
                 conditions:[],                // { id, location?, marks?, note? }
                 massiveLevels:0,              // HL removed by Massive damage (read from Session 3)
                 witheringDamage:0,            // the part of `damage` that can't regenerate
                 credits:{current:0, ledger:[]},
                 adjustments:[],               // Phase 3: manual adjustments ledger
                 panel:{} },                   // Phase 3: generic archetype tracker panels
      panelData:{},                            // Phase 3: archetype table/toggle panel content
      powers:[], gear:[], weapons:[], armor:[],
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

  // Modifier curve. Past 10 (Arcanist focus bonus, supernaturals) gains slow
  // down: +1 more for every `stepEvery` points, so 11-15 = +5, 16-20 = +6
  // (design-team ruling, Decision 98).
  function statMod(v){
    const m = D().statRules.modifiers;
    const step = ((D().statRules.beyondTen)||{}).stepEvery || 5;
    if (v > 10) return m["10"] + Math.ceil((v - 10) / step);
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

  // Batch 3b — an advantage/disadvantage's `grants` array is a static
  // mechanical effect, not a player choice (unlike `picks`): Educated's +10
  // Skill Points/rank, Hard to Kill's +1 HP/Health Level/rank, Lucky/Unlucky's
  // LUCK spend-cost deltas, Long-Lived's Milestone slots. Computed fresh from
  // held advantages/disadvantages every call — nothing is written back onto
  // the character (constraint #7), so buying/selling one just changes what
  // this returns next render.
  function grants(ch){
    const out = { skillPoints:0, hpPerLevel:0, luckCost:{}, minorMilestones:0, majorMilestones:0 };
    const scan = (list, lookup) => (list||[]).forEach(entry=>{
      const def = lookup(entry.id);
      for (const g of (def && def.grants) || []){
        if (g.type==="skillPoints") out.skillPoints += (g.perRank||0) * entry.rank;
        else if (g.type==="hpPerLevel") out.hpPerLevel += (g.perRank||0) * entry.rank;
        else if (g.type==="luckCost") out.luckCost[g.spendId] = (out.luckCost[g.spendId]||0) + (g.delta||0);
        else if (g.type==="milestone" && entry.rank >= (g.atRank||1)){
          if (g.kind==="minor") out.minorMilestones++;
          else if (g.kind==="major") out.majorMilestones++;
        }
      }
    });
    scan(ch.advantages, advById);
    scan(ch.disadvantages, disById);
    return out;
  }

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
    const hpPer  = hl.hpPerLevel + Math.max(0, bod - hl.maxLevels) // BOD>10 rule
                 + grants(ch).hpPerLevel;                          // Hard to Kill
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
             total: r==null ? null : pl.skillPoints.base + r + grants(ch).skillPoints };
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
                       breakdown:{ rank, primary:{id:null,value:0}, synergy:{id:null,mod:0}, pain:0, conditions:0 },
                       dataWarning:`Skill "${id}" is no longer in the game data.` };
    const t = statTable(ch);
    const pri = normStat(def.primaryStat), syn = normStat(def.synergyStat);
    const priVal = pri ? t[pri].value : 0;
    const synMod = syn ? t[syn].mod : 0;
    const pain = painState(ch).skillPenalty;        // 0 or negative
    // Decision 96: a Condition's flat "-1 to all rolls" lands on the Skill
    // Check total, separately from Pain so the breakdown can say why (F20/F21).
    const conditions = conditionState(ch).rollPenalty;
    const base = rank>0 ? rank + priVal + synMod : priVal;
    return { def, rank, trained:rank>0, checkBonus: base + pain + conditions,
             breakdown:{ rank, primary:{id:pri, value:priVal}, synergy:{id:syn, mod:synMod}, pain, conditions },
             dataWarning: (pri && syn) ? null : `Skill "${def.name}" references an unknown stat (${!pri?def.primaryStat:def.synergyStat}).` };
  }

  // ════ PHASE 3 — CONDITION, PROGRESSION, SESSIONS ══════════════════════

  // ── Conditions (Decision 95) ─────────────────────────────────────────
  // The character stores which Conditions are active; everything they DO is
  // read here from the catalog's structured hooks. Nothing is written back.
  const conditionById = byId("conditions");
  const locationById  = byId("bodyLocations");
  // "You have it or you don't" — one entry per id, except a location-bearing
  // Condition, which is one per body part (F22 stub: an Injured arm and an
  // Injured leg are two entries).
  const conditionKey = e => {
    const def = conditionById(e && e.id);
    return String(e && e.id) + (def && def.location ? "@" + String(e.location||"") : "");
  };

  function conditionState(ch){
    const list = (((ch||{}).trackers||{}).conditions) || [];
    const active = [];
    let painLevels = 0, rollPenalty = 0;
    const conditional = [], attackDefense = [], helpless = [], ongoing = [], counters = [];
    list.forEach((e, index)=>{
      if (!e || typeof e!=="object") return;
      const def = conditionById(e.id);
      const loc = e.location ? locationById(e.location) : null;
      const name = def ? def.name : String(e.id);
      const label = name + (loc ? ` (${loc.name})` : (e.location ? ` (${e.location})` : ""));
      const row = { index, id:e.id, def, name, label, location:e.location||null,
                    locationName: loc ? loc.name : (e.location||null),
                    note: typeof e.note==="string" ? e.note : "",
                    missing: !def };
      if (def && def.counter){
        const max = def.counter.max||0;
        row.marks = Math.max(0, Math.min(max, Math.floor(Number(e.marks)||0)));
        row.counter = def.counter;
      }
      active.push(row);
      if (!def) return;                 // versionCheck reports the orphan
      if (typeof def.painLevels==="number") painLevels += def.painLevels;
      if (typeof def.rollPenalty==="number") rollPenalty += def.rollPenalty;
      if (def.rollPenaltyWhen) conditional.push({ name, ...def.rollPenaltyWhen });
      if (typeof def.attackDefense==="number") attackDefense.push({ name, value:def.attackDefense });
      if (def.helpless) helpless.push(name);
      if (def.ongoing) ongoing.push({ name, ...def.ongoing });
      if (def.counter) counters.push({ name, index, marks:row.marks, max:def.counter.max,
                                       label:def.counter.label, full: row.marks >= def.counter.max,
                                       atMax:def.counter.atMax||"" });
    });
    // Different Conditions stack, but every penalty on one roll tops out at
    // the cap (Decision 98). Conditions alone can't reach it today; range and
    // cover, which the sheet never sees, are what usually push a roll there.
    const cap = (((D().conditionRules||{}).penaltyStacking)||{}).cap;
    if (typeof cap==="number") rollPenalty = Math.max(cap, rollPenalty);
    return { active, painLevels, rollPenalty, conditional, attackDefense,
             helpless, ongoing, counters, isHelpless: helpless.length>0 };
  }

  // Mutators, following addBoost: the no-duplicates rule lives next to the
  // rules, not next to the DOM.
  function addCondition(ch, entry){
    const def = conditionById(entry && entry.id);
    if (!def) return { ok:false, why:"Choose a Condition." };
    const e = { id:def.id };
    if (def.location){
      if (!locationById(entry.location)) return { ok:false, why:`${def.name} needs a body part.` };
      e.location = entry.location;
    }
    if (def.counter) e.marks = 0;
    if (entry.note) e.note = String(entry.note);
    const list = ch.trackers.conditions;
    if (list.some(x=>conditionKey(x)===conditionKey(e)))
      return { ok:false, why: def.location
        ? `${def.name} is already on that body part.` : `Already ${def.name} — it doesn't stack with itself.` };
    list.push(e);
    return { ok:true };
  }
  function removeCondition(ch, index){
    const list = ch.trackers.conditions;
    if (!(index>=0 && index<list.length)) return { ok:false, why:"No such Condition." };
    list.splice(index, 1);
    return { ok:true };
  }
  function setConditionMarks(ch, index, marks){
    const e = ch.trackers.conditions[index], def = conditionById(e && e.id);
    if (!def || !def.counter) return { ok:false, why:"That Condition has no counter." };
    e.marks = Math.max(0, Math.min(def.counter.max, Math.floor(Number(marks)||0)));
    return { ok:true };
  }

  // Health Levels as the track draws them (Decision 99). `damage` empties
  // levels left to right; Massive damage removes them from the right — gone,
  // not emptied. Both count as lost, and so toward Pain (CQ6, Decision 98).
  // `over` lets resolveHit ask "what would this look like after the hit"
  // without touching the character.
  function hlState(ch, over){
    const h = health(ch);
    const t = (ch && ch.trackers) || {};
    const pick = k => (over && over[k]!=null) ? over[k] : t[k];
    const damage  = nonNegInt(pick("damage"));
    const massive = Math.max(0, Math.min(h.levels, Math.floor(Number(pick("massiveLevels"))||0)));
    const emptied = h.hpPer>0 ? Math.max(0, Math.min(h.levels - massive, Math.floor(damage / h.hpPer))) : 0;
    const capacity = Math.max(0, h.total - massive*h.hpPer);
    return { levels:h.levels, hpPer:h.hpPer, total:h.total, capacity, damage, massive,
             emptied, lost: emptied + massive,
             hpLeft: Math.max(0, capacity - damage),
             down: h.total>0 && damage >= capacity };
  }

  // Pain Level = the band for Health Levels lost, plus any Condition Pain
  // (Agonized), clamped to the table — "never below 0 or above 3" (054).
  function painState(ch){
    const hl = D().resources.healthLevels;
    const hs = hlState(ch);
    const hlLost = hs.lost;
    let band = hl.painLevels[0];
    for (const p of hl.painLevels) if (hlLost >= p.hlLostThreshold) band = p;
    const fromConditions = conditionState(ch).painLevels;
    const top = hl.painLevels.reduce((m,p)=>Math.max(m,p.level), 0);
    const target = Math.max(0, Math.min(top, band.level + fromConditions));
    const lvl = hl.painLevels.find(p=>p.level===target) || band;
    const pen = hl.painPenaltiesPerLevel;
    return { hlLost, level: lvl.level, label: lvl.label, description: lvl.description,
             fromHealth: band.level, fromConditions,
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
             hpLeft: hs.hpLeft, down: hs.down, massiveLevels: hs.massive };
  }

  // ── Armor and taking a hit (combat plan Session 3, Decision 99) ──────
  // The engine never rolls (plan P1): the player enters the PROT die. Every
  // number here is read from `armorRules`, `damageTypes`, `damageRules` and
  // the upgrade/feature glossaries, so a new upgrade or damage type is data.
  const armorDefById   = byId("armor");
  const upgradeById    = byId("armorUpgradeGlossary");
  const featureById    = byId("armorFeatureGlossary");
  const damageTypeById = byId("damageTypes");
  const damageCategoryById = byId("damageCategories");
  const dieMax = s => { const m = /^\s*1?d(\d+)\s*$/i.exec(String(s||"")); return m ? Number(m[1]) : null; };

  function armorPiece(entry, index){
    const R = D().armorRules || {};
    const def = entry.custom ? null : armorDefById(entry.id);
    const src = def || entry;
    const slot = src.slot || "body";                 // a custom piece is body armor
    const upgrades = Array.isArray(entry.upgrades) ? entry.upgrades.filter(u=>typeof u==="string") : [];
    const features = [...(src.preInstalledFeatures||[]), ...(src.feature ? [src.feature] : [])];
    // Only upgrades the player installs add their effect. A manufacturer's
    // built-in upgrade (the Plasteel Weave Jacket's Tri-Weave) is read as
    // already in the printed stats. Ken's ruling, Decision 100.
    const effects = upgrades;
    const bonus = effects.reduce((n,u)=>n + (Number((upgradeById(u)||{}).integrityBonus)||0), 0);
    // Head and hand pieces don't roll PROT or track INT — features only (Gear).
    const tracks = slot==="body";
    const integrityMax = tracks ? (Number(src.integrity)||0) + bonus : 0;
    const integrityLoss = Math.min(nonNegInt(entry.integrityLoss), integrityMax);
    const integrity = Math.max(0, integrityMax - integrityLoss);
    const resAgainst = [...(R.baseResAgainst||[]),
                        ...effects.map(u=>(upgradeById(u)||{}).resAgainst).filter(Boolean)];
    const coverage = tracks ? ((R.coverageLocations||{})[src.coverage || R.defaultCoverage] || []) : [];
    return { index, id: entry.id || null, custom: !!entry.custom, missing: !entry.custom && !def,
             name: src.name || (entry.custom ? "Custom armor" : String(entry.id || "Armor")), slot, worn: entry.worn===true,
             prot: tracks ? (src.prot || null) : null, protMax: tracks ? dieMax(src.prot) : null,
             res: tracks ? (Number(src.res)||0) : 0,
             integrityMax, integrityLoss, integrity,
             compromised: tracks && integrity<=0, scrapped: entry.scrapped===true,
             resAgainst, coverage, features, upgrades,
             quality: src.quality || null, mods: def ? (Number(def.mods)||0) : null,
             coverageName: tracks ? (src.coverage || R.defaultCoverage) : null };
  }

  // One worn body piece rolls PROT (no layering, Decision 98 CQ7). Compromised
  // is derived from integrityLoss; only `scrapped` is stored.
  function armorState(ch){
    const list = Array.isArray(ch && ch.armor) ? ch.armor : [];
    const pieces = [];
    list.forEach((e,i)=>{ if (e && typeof e==="object") pieces.push(armorPiece(e,i)); });
    const wornBody = pieces.filter(p=>p.worn && p.slot==="body");
    const problems = [];
    if (wornBody.length>1)
      problems.push(`${wornBody.length} body pieces are marked worn. Armor doesn't layer, so only ${wornBody[0].name} counts.`);
    const redirects = [];
    pieces.filter(p=>p.worn).forEach(p=>p.features.forEach(f=>{
      const r = (featureById(f)||{}).redirect;
      if (r) redirects.push({ from:r.from, to:r.to, by:p.name, feature:f });
    }));
    return { worn: wornBody[0] || null, pieces, redirects, problems };
  }

  // Natural Armor (Decision 104): the armor a body has without wearing any.
  // Every source is a `grants` entry of type "naturalArmor" on a held
  // advantage/disadvantage (`perRank`), a Major Milestone (`amount` per time
  // taken) or a chosen specialization option. `stat` + `plus` reads that
  // stat's modifier (Iron Shirt: BOD bonus + 1). A grant with `while` is
  // conditional: listed, never summed, unless its id is in `activeIds` (the
  // hit panel asks). How it answers a hit is the F25 stub in
  // `naturalArmorRules` -- which classes, whether AP gets past it.
  function naturalArmor(ch, activeIds){
    const R = D().naturalArmorRules || {};
    const t = statTable(ch), on = new Set(activeIds || []);
    const always = [], conditional = [];
    const add = (g, from, times) => {
      if (!g || g.type!=="naturalArmor") return;
      const sid = g.stat ? normStat(g.stat) : null;
      const amount = Math.max(0, (Number(g.amount)||0) * times + (Number(g.perRank)||0) * times
                                 + (sid ? t[sid].mod : 0) + (Number(g.plus)||0));
      const e = { id: g.id || from.id, name: g.name || from.name, amount,
                  resAgainst: Array.isArray(g.resAgainst) ? g.resAgainst : [], while: g.while || null };
      if (!e.while) always.push(e);
      else conditional.push(Object.assign(e, { active: on.has(e.id) }));
    };
    const held = (list, lookup) => (list||[]).forEach(entry=>{
      const def = entry && lookup(entry.id);
      ((def && def.grants) || []).forEach(g=>add(g, def, Number(entry.rank)||1));
    });
    held(ch && ch.advantages, advById);
    held(ch && ch.disadvantages, disById);
    const taken = {};
    ((((ch||{}).progression||{}).milestones||{}).major || []).forEach(m=>{ if (m && m.id) taken[m.id] = (taken[m.id]||0) + 1; });
    Object.keys(taken).forEach(id=>{
      const def = (D().milestones.majorGeneral||[]).find(x=>x.id===id);
      ((def && def.grants) || []).forEach(g=>add(g, def, taken[id]));
    });
    specializationChosen(ch).forEach(o=>(o.grants||[]).forEach(g=>add(g, o, 1)));
    const counted = [...always, ...conditional.filter(c=>c.active)];
    const resAgainst = [...new Set([...(R.resAgainst||[]), ...counted.flatMap(c=>c.resAgainst)])];
    return { total: counted.reduce((n,c)=>n + c.amount, 0), base: always.reduce((n,c)=>n + c.amount, 0),
             always, conditional, resAgainst, ignoresAp: R.ignoresAp===true,
             text: R.text || "", playerNote: R.flagged && R.playerNote ? R.playerNote : null };
  }

  // resolveHit's stages, in the order a hit happens. Each takes what it needs
  // and returns plain values, so Session 4 can change one without the rest.

  // Which armor answers: the worn body piece, or none. Armor that isn't in
  // the catalog goes on Loadout as a custom piece -- Decision 100 retired the
  // stand-in this panel used to take, which tracked no wear.
  function hitArmor(as){
    return as.worn ? Object.assign({ source:"worn" }, as.worn) : null;
  }

  // Where it lands: the part aimed at, moved by a worn redirect (Headshot
  // Defense: head → torso). Everything downstream — coverage AND the body part
  // a Condition lands on — uses `location`, never `aimed`.
  function hitLocation(as, hit){
    const aimed = locationById(hit.location) ? hit.location : ((D().armorRules||{}).defaultHitLocation || "torso");
    const rd = as.redirects.find(r=>r.from===aimed) || null;
    return { aimed, location: rd ? rd.to : aimed, redirectedBy: rd };
  }

  // 053 Massive: skips PROT and RES; strips INT equal to the damage; 1 HL per
  // 10; +1 if the armor ends at 0 or there was none. Ending at 0 is scrap.
  function mitigateBypass(damage, armor, covered){
    const M = (D().damageRules||{}).massive || {};
    const intBefore = covered ? armor.integrity : null;
    const integrityLost = covered ? Math.min(damage, intBefore) : 0;
    const gone = !covered || intBefore - integrityLost <= 0;
    return { ok:true, prot:0, res:0, resSkipped:null, absorbed:0, through:0, soaked:false, integrityLost,
             levelsLost: damage>0 ? Math.floor(damage / (M.damagePerLevel||10)) + (gone ? (M.extraLevelWhenArmorGone||0) : 0) : 0,
             scrap: covered && damage>0 && gone };
  }

  // 053 regular: PROT (the die rolled) + RES if the type matches and the hit
  // isn't AP and the armor isn't Compromised/scrap. Fully soaked costs INT.
  function mitigateArmor(damage, type, hit, armor, covered){
    let prot = 0, res = 0, resSkipped = null;
    if (covered){
      const roll = Math.floor(Number(hit.protRoll));
      if (hit.protRoll==null || hit.protRoll==="" || !(roll>=1)) return { ok:false, why:"Enter the PROT die you rolled." };
      if (armor.protMax && roll>armor.protMax)
        return { ok:false, why:`${armor.name} rolls ${armor.prot} for PROT, so the roll can't be more than ${armor.protMax}.` };
      prot = roll;
      if (hit.ap) resSkipped = "ap";
      else if (armor.compromised || armor.scrapped) resSkipped = "compromised";
      else if (!(armor.resAgainst||[]).includes(type.resClass)) resSkipped = "type";
      else res = armor.res;
    }
    const absorbed = Math.min(damage, prot + res), through = damage - absorbed;
    const soaked = covered && damage>0 && through===0;
    const intBefore = covered ? armor.integrity : null;
    const integrityLost = soaked && intBefore!=null
      ? Math.min(Number((D().armorRules||{}).soakedIntegrityLoss)||0, intBefore) : 0;
    return { ok:true, prot, res, resSkipped, absorbed, through, soaked, integrityLost, levelsLost:0, scrap:false };
  }

  // Natural Armor (Decision 104, stubbed as F25): after worn armor, on any
  // body part, when the damage's class is one it answers. AP doesn't get past
  // it (Thick Skin). Massive skips it, as it skips PROT and RES. `hit.natural`
  // is the ids of the conditional sources that are on (Iron Shirt).
  function mitigateNatural(ch, left, type, hit, cat){
    const n = naturalArmor(ch, hit.natural);
    const out = { total: n.total, absorbed: 0, skipped: null, playerNote: n.playerNote,
                  sources: [...n.always, ...n.conditional.filter(c=>c.active)] };
    if (!(n.total>0)) return out;
    if (cat.bypassesArmor) out.skipped = "massive";
    else if (hit.ap && !n.ignoresAp) out.skipped = "ap";
    else if (!n.resAgainst.includes(type.resClass)) out.skipped = "type";
    else out.absorbed = Math.min(left, n.total);
    return out;
  }

  // 054's consequences of taking damage, hit or not: At Zero, and the Death
  // Mark while Dying. Turn Reset's ongoing damage shares this. Shock doesn't:
  // 054 asks it of "a single hit", and a Bleeding tick isn't one.
  function isDying(ch){
    const dyingId = ((D().damageRules||{}).whileDying||{}).condition;
    return !!dyingId && (((ch||{}).trackers||{}).conditions||[]).some(e=>e && e.id===dyingId);
  }
  function damagePrompts(ch, before, after){
    const DR = D().damageRules || {};
    const tookDamage = after.damage>before.damage || after.massive>before.massive;
    const dying = isDying(ch);
    const freePass = (DR.atZero||{}).freePass;
    return { tookDamage, dying,
      atZero: tookDamage && after.down && !dying
        ? Object.assign({}, DR.atZero, { freePassHeld: !!(freePass && ((ch||{}).advantages||[]).some(a=>a && a.id===freePass.advantage)) })
        : null,
      deathMark: tookDamage && dying ? DR.whileDying : null };
  }
  // A hit adds Shock, and the Conditions it can cause (its type's `inflicts`
  // plus its category's), to those.
  function hitPrompts(ch, type, cat, before, after){
    const DR = D().damageRules || {};
    const lostThisHit = after.lost - before.lost;
    const d = damagePrompts(ch, before, after);
    const shockAt = Math.ceil(before.levels * ((DR.shock||{}).fractionOfMaxLevels ?? 0.5));
    const offered = d.tookDamage ? [...new Set([...(type.inflicts||[]), ...(cat.inflicts||[])])].filter(id=>conditionById(id)) : [];
    return { lostThisHit, tookDamage: d.tookDamage, dying: d.dying, prompts: {
      shock: d.tookDamage && !after.down && shockAt>0 && lostThisHit >= shockAt
        ? Object.assign({ threshold: shockAt }, DR.shock) : null,
      atZero: d.atZero, deathMark: d.deathMark,
      conditions: offered, always: (type.always||[]).filter(id=>offered.includes(id))
    } };
  }

  // Pure: what a hit WOULD do (plan P6). Returns the breakdown, the patch and
  // the prompts; applyHit() is the only thing that writes. `hit`:
  //   { damage, damageType, category, ap, location, protRoll }
  // How a category resolves is data: `bypassesArmor` takes the Massive path,
  // `recordsWithering` marks what got through, `inflicts` adds Conditions.
  function resolveHit(ch, hit){
    hit = hit || {};
    const damage = Math.floor(Number(hit.damage));
    if (hit.damage==null || hit.damage==="" || !(damage>=0)) return { ok:false, why:"Enter the damage." };
    const type = damageTypeById(hit.damageType);
    if (!type) return { ok:false, why:"Choose a damage type." };
    const category = hit.category || "regular";
    const cat = damageCategoryById(category);
    if (!cat) return { ok:false, why:"Choose Regular, Withering or Massive." };

    const as = armorState(ch);
    const armor = hitArmor(as);
    const where = hitLocation(as, hit);
    const covered = !!armor && armor.coverage.includes(where.location);
    const m = cat.bypassesArmor ? mitigateBypass(damage, armor, covered)
                                : mitigateArmor(damage, type, hit, armor, covered);
    if (!m.ok) return m;
    const nat = mitigateNatural(ch, m.through, type, hit, cat);
    const through = m.through - nat.absorbed;

    const before = hlState(ch);
    const after = hlState(ch, { damage: before.damage + through,
                                massiveLevels: Math.min(before.levels, before.massive + m.levelsLost) });
    const c = hitPrompts(ch, type, cat, before, after);
    const notes = [];
    if (type.flagged && type.playerNote) notes.push(type.playerNote);
    if (covered) armor.upgrades.forEach(u=>{
      const g = upgradeById(u); if (g && g.flagged && g.playerNote && !notes.includes(g.playerNote)) notes.push(g.playerNote);
    });
    if (nat.total>0 && nat.playerNote) notes.push(nat.playerNote);

    const intBefore = covered ? armor.integrity : null;
    const t = ((ch||{}).trackers) || {};
    return {
      ok: true, damage, type, category, cat, bypassesArmor: !!cat.bypassesArmor, ap: !!hit.ap,
      location: where.location, aimed: where.aimed, redirectedBy: where.redirectedBy, covered,
      armor: armor ? { source: armor.source, name: armor.name, prot: armor.prot, res: armor.res,
                       integrityBefore: intBefore, integrityAfter: intBefore==null ? null : intBefore - m.integrityLost,
                       integrityMax: armor.integrityMax ?? null, compromised: !!armor.compromised } : null,
      prot: m.prot, res: m.res, resSkipped: m.resSkipped, absorbed: m.absorbed, through,
      natural: { total: nat.total, absorbed: nat.absorbed, skipped: nat.skipped, sources: nat.sources },
      soaked: m.soaked, integrityLost: m.integrityLost, levelsLost: m.levelsLost, scrap: m.scrap,
      before, after, lostThisHit: c.lostThisHit, tookDamage: c.tookDamage,
      patch: {
        damage: after.damage, massiveLevels: after.massive,
        witheringDamage: nonNegInt(t.witheringDamage) + (cat.recordsWithering ? through : 0),
        armor: covered && (m.integrityLost>0 || m.scrap)
          ? { index: armor.index, integrityLoss: armor.integrityLoss + m.integrityLost, scrapped: armor.scrapped || m.scrap }
          : null,
        deathMark: c.tookDamage && c.dying
      },
      prompts: c.prompts,
      notes
    };
  }

  // The one writer. Re-resolves from the same inputs rather than trusting a
  // stored preview, so a stale dialog can't write stale numbers. `choices`:
  //   { shock: "pass"|"fail", atZero: "pass"|"fail", conditions: [id | {id, location}] }
  // Conditions go through addCondition(), so its no-duplicates rule holds.
  function applyHit(ch, hit, choices){
    const r = resolveHit(ch, hit);
    if (!r.ok) return r;
    choices = choices || {};
    const t = ch.trackers, p = r.patch;
    t.damage = p.damage; t.massiveLevels = p.massiveLevels; t.witheringDamage = p.witheringDamage;
    if (p.armor && ch.armor[p.armor.index]){
      ch.armor[p.armor.index].integrityLoss = p.armor.integrityLoss;
      if (p.armor.scrapped) ch.armor[p.armor.index].scrapped = true;
    }
    const want = [];
    if (r.prompts.shock && choices.shock==="fail") want.push(...(r.prompts.shock.onFail||[]));
    if (r.prompts.atZero && choices.atZero==="pass") want.push(...(r.prompts.atZero.onPass||[]));
    if (r.prompts.atZero && choices.atZero==="fail") want.push(...(r.prompts.atZero.onFail||[]));
    // A body-part Condition from a hit lands where the HIT landed — after any
    // redirect — whatever the caller passed. The engine owns that, not the UI.
    (choices.conditions||[]).forEach(c=>{
      const id = typeof c==="string" ? c : (c && c.id);
      if (!r.prompts.conditions.includes(id)) return;
      want.push((conditionById(id)||{}).location ? { id, location: r.location } : { id });
    });
    const added = [], skipped = [];
    for (const w of want){
      const e = typeof w==="string" ? { id:w } : w;
      (addCondition(ch, e).ok ? added : skipped).push(e.id);
    }
    if (p.deathMark){
      const i = t.conditions.findIndex(e=>e && e.id===r.prompts.deathMark.condition);
      if (i>=0) setConditionMarks(ch, i, (Number(t.conditions[i].marks)||0) + 1);
    }
    return { ok:true, result:r, added, skipped };
  }

  // ── Loadout & recovery (combat plan Session 4, Decision 100) ─────────
  // Writers change stored inputs only, and the UI wraps each in commit(), so
  // every one is a single undoable action. The player rolls every die (plan
  // P1): a function that takes a roll checks the number fits the die.
  const weaponDefById = byId("weapons");
  const listOf = (ch, kind) => Array.isArray(ch && ch[kind]) ? ch[kind] : [];
  const priceOf = def => (typeof def.cost==="number" && def.cost>0) ? def.cost : null;
  const loadoutDef = (kind, id) => kind==="armor" ? armorDefById(id) : kind==="weapons" ? weaponDefById(id) : null;
  function checkRoll(die, roll, what){
    const max = dieMax(die), n = Math.floor(Number(roll));
    if (roll==null || roll==="" || !(n>=1)) return { ok:false, why:`Enter the ${what} you rolled.` };
    if (max && n>max) return { ok:false, why:`That's a ${die}, so the roll can't be more than ${max}.` };
    return { ok:true, value:n };
  }

  // "BOD+3" is "calculated by adding the BOD score to the bonus" (053): BOD 5
  // does 8. A number is fixed damage; anything else ("6/round") stays text.
  function weaponDamage(ch, d){
    if (typeof d==="number") return { value:d, formula:null };
    const m = /^\s*([A-Za-z]+)\s*\+\s*(\d+)\s*$/.exec(String(d==null ? "" : d));
    const stat = m && normStat(m[1]);
    if (stat) return { value: statTable(ch)[stat].value + Number(m[2]), formula: `${stat}+${m[2]}` };
    return { value:null, formula: d==null || d==="" ? null : String(d) };
  }

  // Everything a player reads off the sheet to make an attack with a catalog
  // weapon. The attack total is the skill's, so Pain and Conditions are in it;
  // ACC is apart because only Single fire adds it (053). A custom weapon is
  // whatever was typed, so there's nothing to compute.
  function weaponLine(ch, index){
    const e = listOf(ch, "weapons")[index];
    if (!e || typeof e!=="object") return null;
    const notes = typeof e.notes==="string" ? e.notes : "";
    if (e.custom || !e.id) return { index, custom:true, name:String(e.name||""), notes };
    const def = weaponDefById(e.id);
    if (!def) return { index, missing:true, name:String(e.id), notes };
    const sk = def.skill && skillById(def.skill) ? skillLine(ch, def.skill) : null;
    const dmg = weaponDamage(ch, def.damage);
    return { index, id:def.id, name:def.name, category:def.category||null, notes,
             skill: sk ? { id:sk.def.id, name:sk.def.name, trained:sk.trained } : null,
             attack: sk ? sk.checkBonus : null, acc: typeof def.acc==="number" ? def.acc : null,
             damage: dmg.value, damageFormula: dmg.formula,
             style: def.style||null, damageType: def.damageType||null,
             reach: def.reach||null, parry: def.parry||null, range: def.range||null,
             rof: def.rof||null, capacity: def.capacity||null,
             tags: def.tags||[], features: def.features||[], weaponNotes: def.notes||null };
  }

  // Add a catalog piece. `buy` also pays its price out of Çredits, in the
  // same action, so one undo takes back both. A price the catalog doesn't
  // state ("By Contract") can be added but not bought.
  function addLoadout(ch, kind, id, opts){
    const def = loadoutDef(kind, id);
    if (!def) return { ok:false, why:"Choose something from the list first." };
    const buy = !!(opts && opts.buy), price = priceOf(def);
    if (buy){
      if (price==null) return { ok:false, why:`${def.name} has no street price. Add it instead, and record what it cost under Çredits.` };
      const have = Number(ch.trackers.credits.current)||0;
      if (price>have) return { ok:false, why:`${def.name} costs ${price}Ç. You have ${have}Ç.` };
    }
    const list = ch[kind];
    if (kind==="armor"){
      const e = { id, integrityLoss:0, notes:"", worn:false, scrapped:false, upgrades:[] };
      // The first piece in a slot goes on. Nobody buys a vest to leave it home.
      const slot = def.slot || "body";
      if (!list.some((o,i)=>o && typeof o==="object" && o.worn===true && armorPiece(o,i).slot===slot)) e.worn = true;
      list.push(e);
    } else list.push({ id, notes:"" });
    if (buy) addCredits(ch, -price, `Bought ${def.name}`);
    return { ok:true, index:list.length-1, name:def.name, paid: buy ? price : 0 };
  }
  // A custom piece is typed by the player. Armor's `coverage` is optional and
  // reads as light (torso) when absent, so a file without it is still valid.
  function addCustomLoadout(ch, kind){
    if (kind==="armor") ch.armor.push({ custom:true, name:"", prot:"", res:0, integrity:0, coverage:"light",
                                        integrityLoss:0, notes:"", worn:false, scrapped:false, upgrades:[] });
    else if (kind==="weapons") ch.weapons.push({ custom:true, name:"", type:"", damage:"", rof:"", capacity:"", ammo:"", features:"", notes:"" });
    else return { ok:false, why:"Weapons or armor only." };
    return { ok:true, index:ch[kind].length-1 };
  }
  function removeLoadout(ch, kind, index){
    const list = listOf(ch, kind);
    if (!(index>=0 && index<list.length)) return { ok:false, why:"That isn't on the sheet." };
    list.splice(index, 1);
    return { ok:true };
  }

  // Wearing is per slot: one body piece (no layering, CQ7), one helmet, one
  // pair of gloves. Putting one on takes off whatever held that slot.
  function setWorn(ch, index, on){
    const list = listOf(ch, "armor"), e = list[index];
    if (!e || typeof e!=="object") return { ok:false, why:"That armor isn't on the sheet." };
    const slot = armorPiece(e, index).slot;
    if (on) list.forEach((o,i)=>{ if (i!==index && o && typeof o==="object" && armorPiece(o,i).slot===slot) o.worn = false; });
    e.worn = !!on;
    return { ok:true };
  }

  // Which upgrades a piece can take, and why not when it can't (Gear: one mod
  // slot each, a quality floor, and only the `repeatable` ones twice). A
  // custom piece states no slots or quality, so neither limit applies to it.
  function upgradeOptions(ch, index){
    const e = listOf(ch, "armor")[index];
    if (!e || typeof e!=="object") return null;
    const p = armorPiece(e, index), order = (D().armorRules||{}).qualityOrder || [];
    const body = p.slot==="body";
    const slots = !body ? 0 : p.custom ? null : p.mods;
    const used = p.upgrades.length;
    const rank = q => order.indexOf(q);
    const options = (D().armorUpgradeGlossary||[]).map(g=>{
      let why = null;
      if (!body) why = "Only body armor takes upgrades.";
      else if (slots!=null && used>=slots) why = slots===1 ? "Its one mod slot is taken." : slots ? `All ${slots} mod slots are taken.` : `${p.name} has no mod slots.`;
      else if (!g.repeatable && (p.upgrades.includes(g.id) || p.features.includes(g.id))) why = "Already installed.";
      else if (g.minQuality && rank(p.quality)>=0 && rank(p.quality)<rank(g.minQuality)) why = `Needs ${g.minQuality} quality or better.`;
      return { id:g.id, ok:!why, why, description:g.description||"" };
    });
    return { name:p.name, slots, used, free: slots==null ? null : Math.max(0, slots-used), options };
  }
  function addUpgrade(ch, index, id){
    const u = upgradeOptions(ch, index);
    const o = u && u.options.find(x=>x.id===id);
    if (!o) return { ok:false, why:"Choose an upgrade." };
    if (!o.ok) return { ok:false, why:o.why };
    const e = ch.armor[index];
    if (!Array.isArray(e.upgrades)) e.upgrades = [];
    e.upgrades.push(id);
    return { ok:true };
  }
  function removeUpgrade(ch, index, at){
    const e = listOf(ch, "armor")[index];
    if (!e || !Array.isArray(e.upgrades) || !(at>=0 && at<e.upgrades.length)) return { ok:false, why:"No such upgrade." };
    e.upgrades.splice(at, 1);
    return { ok:true };
  }

  // The after-fight wear roll (053): the die is the GM's call by difficulty,
  // and the roll comes off the top of Integrity. It can leave armor
  // Compromised, never scrap -- only Massive does that. A feature with an
  // `afterEncounter` roll (Self-Healing) is asked for in the same action.
  function armorWear(ch, index, input){
    input = input || {};
    const e = listOf(ch, "armor")[index];
    if (!e || typeof e!=="object") return { ok:false, why:"That armor isn't on the sheet." };
    const p = armorPiece(e, index);
    if (p.slot!=="body") return { ok:false, why:`${p.name} doesn't track Integrity.` };
    const die = ((D().armorRules||{}).integrityLossByDifficulty||{})[input.difficulty];
    if (!die) return { ok:false, why:"Choose how hard the fight was." };
    const r = checkRoll(die, input.roll, "wear die");
    if (!r.ok) return r;
    const lost = Math.min(r.value, p.integrity);
    let loss = p.integrityLoss + lost, selfHeal = null;
    const sh = p.scrapped ? null : p.features.map(f=>featureById(f)).find(f=>f && f.afterEncounter);
    if (sh){
      const A = sh.afterEncounter;
      const c = checkRoll(A.checkDie, input.selfHealCheck, `${sh.id} roll`);
      if (!c.ok) return c;
      let healed = 0;
      if (c.value >= A.succeedsOn){
        const h = checkRoll(A.restoresDie, input.selfHealRoll, "Integrity it regains");
        if (!h.ok) return h;
        healed = Math.min(h.value, loss);       // "Cannot restore INT beyond the armor's maximum"
        loss -= healed;
      }
      selfHeal = { feature:sh.id, check:c.value, healed };
    }
    e.integrityLoss = loss;
    return { ok:true, name:p.name, die, rolled:r.value, lost, selfHeal,
             before:p.integrity, after:p.integrityMax - loss };
  }
  // Repair: a Field Repair Kit (the player's roll on `repairKitDie`) or an
  // armorer (all of it). Scrap can't be repaired (053).
  function repairArmor(ch, index, input){
    input = input || {};
    const e = listOf(ch, "armor")[index];
    if (!e || typeof e!=="object") return { ok:false, why:"That armor isn't on the sheet." };
    const p = armorPiece(e, index);
    if (p.slot!=="body") return { ok:false, why:`${p.name} doesn't track Integrity.` };
    if (p.scrapped) return { ok:false, why:`${p.name} is scrap. It can't be repaired.` };
    if (p.integrityLoss<=0) return { ok:false, why:`${p.name} is already at full Integrity.` };
    let restored = p.integrityLoss;
    if (!input.full){
      const r = checkRoll((D().armorRules||{}).repairKitDie, input.roll, "repair die");
      if (!r.ok) return r;
      restored = Math.min(r.value, p.integrityLoss);
    }
    e.integrityLoss = p.integrityLoss - restored;
    return { ok:true, name:p.name, restored, after:p.integrityMax - e.integrityLoss };
  }

  // Natural Healing (055): BOD per day of real rest. The engine proposes the
  // number; the GM may halve it for pushing on, so the player can change it.
  function naturalHealing(ch){
    const N = ((D().recoveryRules||{}).naturalHealing) || {};
    const stat = normStat(N.stat || "BOD");
    return { stat, perDay: stat ? Math.max(0, statTable(ch)[stat].value) : 0,
             speedHealMultiplier: Number(N.speedHealMultiplier)||1,
             text: N.text||"", speedHealText: N.speedHealText||"" };
  }
  // One writer for both kinds of healing. Natural takes HP and nothing else:
  // it never touches Massive levels or clears a Condition. Focused Healing can
  // also clear the Conditions `recoveryRules.focusedHealing.clears` names
  // (Injured), by index, and restore Massive levels (CQ6: with a replacement).
  // Withering is trimmed to the damage left, as every lowering of it is.
  // A Nanomed Kit (Decision 105, 054's list): dose n inside a day regenerates
  // 1 HP every n rounds for BOD rounds, so it proposes floor(BOD / n). The
  // player can change the number: a fight that ends early stops it.
  function nanomedKit(ch, dose){
    const N = ((D().recoveryRules||{}).nanomed) || {};
    const n = Math.max(1, Math.floor(Number(dose)||1));
    const stat = normStat(N.roundsStat || "BOD");
    const rounds = stat ? Math.max(0, statTable(ch)[stat].value) : 0;
    const dying = ((D().damageRules||{}).whileDying||{}).condition;
    const clears = [...(N.clears||[]), ...(N.endsDying && dying ? [dying] : [])];
    return { dose: n, rounds, everyRounds: n, proposed: Math.floor(rounds / n), clears,
             text: N.text || "", doseText: N.doseText || "" };
  }
  // Focused Healing clears only what the player ticks; a Nanomed Kit clears
  // everything on its list that's active, Dying and its Death Marks included.
  function heal(ch, input){
    input = input || {};
    const F = ((D().recoveryRules||{}).focusedHealing) || {};
    const focused = input.kind==="focused", nanomed = input.kind==="nanomed";
    if (!focused && !nanomed && input.kind!=="natural") return { ok:false, why:"Natural or Focused Healing?" };
    const hp = (input.hp==null || input.hp==="") ? 0 : Math.floor(Number(input.hp));
    if (!(hp>=0)) return { ok:false, why:"Enter the HP restored." };
    const t = ch.trackers, conds = t.conditions, hs = hlState(ch);
    const kit = nanomed ? nanomedKit(ch, input.dose) : null;
    const clear = nanomed ? conds.map((e,i)=>i).filter(i=>conds[i] && kit.clears.includes(conds[i].id))
      : focused ? [...new Set((input.clear||[]).map(Number))]
      .filter(i=>conds[i] && (F.clears||[]).includes(conds[i].id)) : [];
    const massive = focused ? Math.min(nonNegInt(input.massive), hs.massive) : 0;
    const healed = Math.min(hp, hs.damage);
    if (!healed && !clear.length && !massive)
      return { ok:false, why: hs.damage ? "Enter the HP restored." : "There's no damage to heal." };
    t.damage = hs.damage - healed;
    t.witheringDamage = Math.min(nonNegInt(t.witheringDamage), t.damage);
    t.massiveLevels = hs.massive - massive;
    const cleared = clear.sort((a,b)=>b-a).map(i=>{ const e = conds[i]; removeCondition(ch, i); return e; }).reverse();
    return { ok:true, healed, restored:massive, cleared };
  }

  // Turn Reset (plan P8): a bookkeeping helper, not an automation. Each active
  // Condition with `ongoing` damage ticks -- a fixed amount (Bleeding) or the
  // number entered for its source (Burning, Shocked). The damage goes straight
  // onto the total: it isn't a hit, so armor and Shock don't come into it
  // (054 asks Shock of "a single hit"), but At Zero and Dying do. `input`:
  //   { sources: { [condition index]: hp } }
  // Every Condition's recovery is listed as text; no check is run.
  function resolveReset(ch, input){
    input = input || {};
    const W = (D().damageRules||{}).whileDying || {};
    const conds = (((ch||{}).trackers||{}).conditions) || [];
    const ticks = [], recovery = [];
    conds.forEach((e,i)=>{
      const def = e && conditionById(e.id);
      if (!def) return;
      const loc = locationById(e.location);
      recovery.push({ index:i, name: def.name + (loc ? ` (${loc.name})` : ""), recovery: def.recovery||"" });
      const o = def.ongoing;
      if (!o) return;
      const v = o.source ? (input.sources||{})[i] : o.hp;
      ticks.push({ index:i, id:def.id, name:def.name, source:!!o.source,
                   hp: v==null || v==="" ? null : nonNegInt(v) });
    });
    const missing = ticks.find(t=>t.hp==null);
    if (missing) return { ok:false, why:`Enter this round's ${missing.name} damage. Put 0 if it's out.`, ticks, recovery };
    const total = ticks.reduce((n,t)=>n+t.hp, 0);
    const before = hlState(ch), after = hlState(ch, { damage: before.damage + total });
    const d = damagePrompts(ch, before, after);
    // F24 stub: while Dying, each source that ticks is a Death Mark and takes
    // the place of the check. With nothing ticking, the check is asked.
    const ticking = ticks.filter(t=>t.hp>0).length;
    const marks = d.dying ? ticking : 0;
    const dyingCheck = d.dying && !ticking ? { check:W.resetCheck, text:W.resetText } : null;
    const notes = d.dying && ticking && W.flagged && W.playerNote ? [W.playerNote] : [];
    return { ok:true, ticks, total, before, after, dying:d.dying, marks,
             prompts: { atZero:d.atZero, dyingCheck }, recovery, notes,
             hasEffect: total>0 || !!dyingCheck };
  }
  // The one writer, re-resolving from its inputs like applyHit. `choices`:
  //   { atZero: "pass"|"fail", dyingCheck: "pass"|"fail" }
  function applyReset(ch, input, choices){
    const r = resolveReset(ch, input);
    if (!r.ok) return r;
    choices = choices || {};
    const t = ch.trackers;
    t.damage = r.after.damage;
    const marks = r.marks + (r.prompts.dyingCheck && choices.dyingCheck==="fail" ? 1 : 0);
    const added = [];
    const A = r.prompts.atZero;
    if (A) ((choices.atZero==="pass" ? A.onPass : choices.atZero==="fail" ? A.onFail : null) || [])
      .forEach(id=>{ if (addCondition(ch, { id }).ok) added.push(id); });
    if (marks){
      const i = t.conditions.findIndex(e=>e && e.id===((D().damageRules||{}).whileDying||{}).condition);
      if (i>=0) setConditionMarks(ch, i, (Number(t.conditions[i].marks)||0) + marks);
    }
    return { ok:true, result:r, marks, added };
  }

  function luckState(ch){
    const L = D().resources.luck;
    const max = L.startingValue + ch.trackers.luck.bonus + adjFor(ch,"LUCK");
    const spent = ch.trackers.luck.spent||0;
    // Lucky/Unlucky shift what each spend action costs; never below 0.
    const costDelta = grants(ch).luckCost;
    const spendActions = (L.spend||[]).map(sa=>
      ({ ...sa, cost: Math.max(0, sa.cost + (costDelta[sa.id]||0)) }));
    return { max, spent, current: Math.max(0, max - spent),
             spendActions, refresh: L.refresh };
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
    const sub = ((a.specialization||{}).options||[]).find(o=>o.id===((ch.archetypeChoices||{}).specialization||[])[0]);
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
    // Decision 97: "5 × current rank" would price rank 0→1 at zero; a new skill
    // after creation is a flat price from the data instead.
    const cost = cur===0 ? D().ip.skillIncreaseCost.newSkill : (focused?3:5) * cur;
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
    amount = nonNegInt(amount);
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
    const g = grants(ch);
    // Long-Lived's Milestone grants land as extra unlocked slots, not an
    // auto-picked Milestone — the existing pick lists handle the rest.
    const minorAvail = avail(r.minorFirstAt, r.minorEvery) + g.minorMilestones;
    const majorAvail = avail(r.majorFirstAt, r.majorEvery) + g.majorMilestones;
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
  // One prerequisite vocabulary, one place it's checked (Decision 91). Milestone
  // `prerequisites`, an advantage/disadvantage/skill's `requires`, and a
  // Professional subtype's stat gate all speak the same shape; before this they
  // were three copies that inevitably drifted (`requirementState` never learned
  // `majorCount`/`milestones`/`gear`/`note`/`gmApproval`, so those fields in a
  // `requires` block were silently treated as satisfied). Machine-checkable
  // parts land in `met`/`unmet`; prose parts are surfaced for the table to
  // adjudicate, in `manual`.
  function checkPrereqs(ch, p){
    const met=[], unmet=[], manual=[];
    if (!p) return { met, unmet, manual, ok:true };
    if (p.stats) for (const [sid, need] of Object.entries(p.stats)){
      const norm = normStat(sid);
      const have = norm ? statValue(ch, norm) : 0;
      (have>=need ? met : unmet).push(`${sid} ${need} (you have ${have})`);
    }
    if (p.majorCount){
      const st = milestoneState(ch);
      (st.majorTaken.length>=p.majorCount ? met : unmet)
        .push(`${p.majorCount} Major Milestone${p.majorCount>1?"s":""} taken`);
    }
    const skillName = id => (skillById(id)||{name:id}).name;
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
        (ok?met:unmet).push("Advantages: "+p.advantages.all.map(([id,r])=>`${traitName(id)}${r>1?" "+r+"+":""}`).join(", "));
      }
      if (p.advantages.note) manual.push(p.advantages.note);
    }
    if (p.milestones){
      const ok = p.milestones.every(id=>milestoneState(ch).majorTaken.some(t=>t.id===id));
      const names = p.milestones.map(id=>((D().milestones.majorGeneral||[]).find(x=>x.id===id)||{name:id}).name);
      (ok?met:unmet).push("Milestone: "+names.join(", "));
    }
    if (p.gear) manual.push(typeof p.gear==="string" ? p.gear : "Gear requirement — see text");
    if (p.note) manual.push(p.note);
    if (p.gmApproval) manual.push("Requires GM approval");
    return { met, unmet, manual, ok: unmet.length===0 };
  }
  // Major prerequisites: everything from checkPrereqs, plus the once-each rule
  // that's about the milestone's own identity rather than its prerequisites.
  function majorPrereqs(ch, m){
    const already = milestoneState(ch).majorTaken.some(t=>t.id===m.id);
    const r = checkPrereqs(ch, m.prerequisites||{});
    const unmet = already ? ["Already taken — Majors are once each.", ...r.unmet] : r.unmet;
    return { met:r.met, unmet, manual:r.manual, ok: unmet.length===0 };
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
    const t = c.trackers = Object.assign({damage:0}, c.trackers||{});
    // Schema 0.7 (Decision 93): Exhaustion was never its own resource -- it's
    // TOL at zero, a condition, not something tracked alongside TOL. Drop a
    // pre-0.7 character's old accrual rather than migrate it forward.
    delete t.exhaustion;
    t.luck    = Object.assign({bonus:0, spent:0}, t.luck);
    t.san     = Object.assign({loss:0}, t.san);
    t.sfr     = Object.assign({spent:0}, t.sfr);
    t.credits = Object.assign({current:0, ledger:[]}, t.credits);
    if (!Array.isArray(t.credits.ledger)) t.credits.ledger=[];
    if (!Array.isArray(t.adjustments)) t.adjustments=[];
    if (!t.panel || typeof t.panel!=="object") t.panel={};
    // Schema 0.8 (Decision 95): Conditions, plus the two damage inputs the hit
    // resolver writes. A hand-edited file can hold junk or a duplicate; keep
    // the first of each ("you have it or you don't"), drop what isn't an entry.
    const seen = new Set();
    t.conditions = t.conditions.filter(e=>{
      if (!e || typeof e!=="object" || typeof e.id!=="string") return false;
      const k = conditionKey(e);
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    for (const k of ["massiveLevels","witheringDamage"])
      t[k] = nonNegInt(t[k]);
    if (!c.panelData || typeof c.panelData!=="object") c.panelData={};
    const pr = c.progression = Object.assign({milestonePoints:0}, c.progression||{});
    pr.ip = Object.assign({earned:0, log:[]}, pr.ip);
    if (!Array.isArray(pr.ip.log)) pr.ip.log=[];
    pr.milestones = Object.assign({minor:[], major:[]}, pr.milestones);
    // Decision 104: a held entry that isn't an object with an id was reaching
    // grants()/advSpent() and throwing. Drop it, as conditions already do.
    const isEntry = e => !!e && typeof e==="object" && typeof e.id==="string";
    for (const k of ["advantages","disadvantages"]) c[k] = Array.isArray(c[k]) ? c[k].filter(isEntry) : [];
    for (const k of ["minor","major"]) pr.milestones[k] = Array.isArray(pr.milestones[k]) ? pr.milestones[k].filter(isEntry) : [];
    if (!Array.isArray(c.sessions)) c.sessions=[];
    c.gear=c.gear||[]; c.weapons=c.weapons||[]; c.powers=c.powers||[]; c.armor=c.armor||[];
    // Schema 0.6 (Weapons/Ammo/Armor data batch): a weapons entry may now
    // reference the gear catalog by id (notes only, stats computed from the
    // catalog) or stay freeform (custom:true, every field preserved as typed).
    // A pre-0.6 entry has neither marker -- tag it custom rather than guess
    // which catalog weapon a free-typed name was supposed to mean.
    c.weapons.forEach(w => { if (w && !w.id && !w.custom) w.custom = true; });
    // Schema 0.8 (plan P5, landed now so there's one migration): `worn` marks
    // the body piece that rolls PROT, `scrapped` is the one state
    // integrityLoss can't express (driven to 0 by Massive), `upgrades` holds
    // armorUpgradeGlossary ids. Compromised is derived, never stored.
    c.armor.forEach(a => {
      if (!a || typeof a!=="object") return;
      if (typeof a.worn!=="boolean") a.worn = false;
      if (typeof a.scrapped!=="boolean") a.scrapped = false;
      if (!Array.isArray(a.upgrades)) a.upgrades = [];
    });
    if (typeof c.notes!=="string") c.notes="";
    if (!Array.isArray(c.audit)) c.audit=[];      // Phase 3.3
    // Schema 0.5 (A3): ONE specialization array replaces the three fields that
    // used to hold the same idea — identity.specialization (single-select),
    // archetypeChoices.subtype (its duplicate) and archetypeChoices.aberrations
    // (multi-select). Two parallel models were the root of A1 and A2.
    // _fillDefaults ran above against the current shape, so it has already
    // seeded an empty array; only a pre-0.5 file has anything to move.
    const ac = c.archetypeChoices;
    if (!Array.isArray(ac.specialization)) ac.specialization = [];
    if (!ac.specialization.length){
      const legacy = Array.isArray(ac.aberrations) && ac.aberrations.length ? ac.aberrations.slice()
                   : ac.subtype ? [ac.subtype]
                   : ((c.identity||{}).specialization ? [c.identity.specialization] : []);
      ac.specialization = legacy.filter(Boolean);
    }
    delete ac.aberrations; delete ac.subtype;
    if (c.identity && typeof c.identity==="object") delete c.identity.specialization;
    // meta exists but gamedataVersion is deliberately NOT seeded: inventing it
    // from the loaded data would mask the mismatch versionCheck must report.
    if (!c.meta || typeof c.meta!=="object") c.meta = {};
    c.meta.schemaVersion = "0.8";
    return c;
  }


  // ════ BATCH 3 — SELECTION & CONSTRAINT SYSTEM ═════════════════════════
  // One system, three jobs: mutual locks and gating on advantages and
  // disadvantages, the inputs an entry demands when it is taken (a skill, an
  // option, a line of text), and the archetype specialization pick. The rev 9
  // audit §1 traced A1 and A2 to two parallel models for "the required pick";
  // this is the one model. Entries declare `excludes` / `requires` / `picks`;
  // a character stores `selections` on the entry that owns them.

  // Three kinds host picks: "advantage", "disadvantage" and "skill" (Martial
  // Arts styles). A skill's entry is a map value rather than an array element,
  // which is the only difference the rest of the system ever sees.
  const defFor = (kind, id) => kind==="disadvantage" ? disById(id)
                             : kind==="skill"        ? skillById(id)
                             : advById(id);
  const listFor  = (ch, kind) => (kind==="disadvantage" ? ch.disadvantages : ch.advantages) || [];
  const entryFor = (ch, kind, id) => kind==="skill"
    ? (((ch||{}).skills||{})[id] || null)
    : (listFor(ch, kind).find(x=>x && x.id===id) || null);

  // A character can hold the SAME advantage on two ledger rows — once free
  // through the Professional Natural Advantages pool (notes:"natural") and once
  // bought with CP. They are two rows for ONE trait: the ranks add up, and the
  // choices the trait demands belong to the trait rather than to a row.
  // `favored-skill` sits in that pool AND carries picks, so this is reachable
  // with shipped data. A plain `.find(id)` returned whichever row came first,
  // so reads and writes landed on different rows depending on allocation order.
  const entryCopies = (ch, kind, id) => kind==="skill"
    ? (entryFor(ch, kind, id) ? [entryFor(ch, kind, id)] : [])
    : listFor(ch, kind).filter(x=>x && x.id===id);
  // The purchased row owns the store when there is one, so the address is
  // stable however the rows happen to be ordered.
  function canonicalEntry(ch, kind, id){
    const copies = entryCopies(ch, kind, id);
    return copies.find(x=>x.notes!=="natural") || copies[0] || null;
  }
  const heldRank = (ch, kind, id) =>
    entryCopies(ch, kind, id).reduce((s,x)=>s + Math.max(0, x.rank||0), 0);
  const traitName = id => (advById(id) || disById(id) || skillById(id) || {name:id}).name;
  // Skills host picks (Martial Arts styles) same as advantages/disadvantages, so
  // they belong in the held set too — otherwise a skill can never take part in
  // an excludes/requires pair (Decision 91, engine.js heldIds).
  const heldIds = ch => [...(ch.advantages||[]), ...(ch.disadvantages||[])]
    .filter(x=>x && x.rank>0).map(x=>x.id)
    .concat(Object.entries(ch.skills||{}).filter(([,l])=>l && l.rank>0).map(([id])=>id));

  // Mutual lock. Symmetric by construction: A excluding B locks B against A
  // even though B's entry says nothing, so the rule is stated once in the data.
  function optionLock(ch, kind, id){
    const def = defFor(kind, id);
    if (!def) return { locked:false, by:null };
    const held = heldIds(ch).filter(h=>h!==id);
    for (const other of (def.excludes||[]))
      if (held.includes(other)) return { locked:true, by:traitName(other) };
    for (const h of held){
      const d = advById(h) || disById(h) || skillById(h);
      if (d && (d.excludes||[]).includes(id)) return { locked:true, by:traitName(h) };
    }
    return { locked:false, by:null };
  }

  // Gating. Deliberately the same vocabulary as milestone prerequisites, so
  // there is one way to say "you need REF 6" in this data file, not two
  // (Decision 91 — routes through checkPrereqs).
  function requirementState(ch, kind, id){
    const def = defFor(kind, id);
    return checkPrereqs(ch, (def||{}).requires);
  }

  // The option list a pick draws from. `from.ids` is a fixed list (Common
  // Sense's four named skills), `from.category` a skill category, and an absent
  // `from` on a skill pick means the whole catalog. For option picks,
  // `from.optionsFrom` names a list the OWNING entry already carries — Martial
  // Arts styles point at `styles` rather than restating it, which is the whole
  // lesson of A1: one list, or the two drift.
  function pickOptions(pick, def){
    const f = pick.from || {};
    if (pick.type==="skill"){
      const src = f.ids ? f.ids.map(id=>skillById(id) || {id, name:id, missing:true})
                : f.category ? D().skills.filter(s=>s.category===f.category)
                : D().skills;
      return src.map(s=>({ id:s.id, name:s.name, missing:s.missing===true }));
    }
    if (pick.type==="option"){
      const src = f.optionsFrom ? ((def||{})[f.optionsFrom] || []) : (f.options||[]);
      return src.map(o=>({ id:o.id, name:o.name,
                           description:o.description || o.bonus || "" }));
    }
    return [];
  }

  // Everything the UI needs about one entry's picks, resolved once here so the
  // renderer never re-derives a count. Total: an entry that is not taken, or
  // carries no `selections`, reports need vs. nothing chosen.
  function picksFor(ch, kind, id){
    const def = defFor(kind, id);
    if (!def || !Array.isArray(def.picks)) return [];
    const entry = canonicalEntry(ch, kind, id);
    const rank  = heldRank(ch, kind, id);          // both rows, one trait
    const sel   = (entry && entry.selections && typeof entry.selections==="object") ? entry.selections : {};
    return def.picks.map(pick=>{
      const per  = pick.count==null ? 1 : pick.count;
      // Rank 0 means the entry is not held, so it asks for nothing.
      const need = rank<=0 ? 0
                 : pick.type==="text" ? 1
                 : (pick.perRank ? per*rank : per);
      const raw  = sel[pick.id];
      const text = pick.type==="text";
      const chosen = text ? (typeof raw==="string" ? raw : "")
                          : (Array.isArray(raw) ? raw.slice(0, need) : []);
      const filled = text ? (chosen.trim() ? 1 : 0)
                          : chosen.filter(v=>v!=null && v!=="").length;
      return { pick, need, chosen, filled, options: pickOptions(pick, def),
               // `optional` means the slots are a CAP, not a demand: the CRB
               // says "up to two Martial Arts styles", and one style, or none,
               // is a legal character.
               complete: pick.optional===true || filled >= need,
               // A freeform pick the CRB hands to the table ("work out the
               // details with your GM") warns; it never blocks the lock.
               gmApproval: pick.gmApproval===true };
    });
  }

  // Mutator, following addBoost: distinctness and the slot cap are rules, and
  // rules live next to the rules, not next to the DOM.
  function setSelection(ch, kind, id, pickId, index, value){
    const def = defFor(kind, id), entry = canonicalEntry(ch, kind, id);
    if (!def || !entry) return { ok:false, why:"That trait is not taken." };
    const pick = (def.picks||[]).find(p=>p.id===pickId);
    if (!pick) return { ok:false, why:"No such choice on that trait." };
    if (!entry.selections || typeof entry.selections!=="object") entry.selections = {};
    // One trait, one store. A second row must never grow its own, or the two
    // drift apart exactly the way A1/A2 did.
    for (const other of entryCopies(ch, kind, id)) if (other!==entry) delete other.selections;
    if (pick.type==="text"){
      entry.selections[pickId] = value==null ? "" : String(value);
      return { ok:true };
    }
    const state = picksFor(ch, kind, id).find(s=>s.pick.id===pickId);
    const i = Math.max(0, Number(index)||0);
    if (i >= state.need) return { ok:false, why:"No slot for that choice." };
    const v = (value==null || value==="") ? null : String(value);
    const list = Array.isArray(entry.selections[pickId]) ? entry.selections[pickId].slice() : [];
    if (v && pick.distinct && list.some((x,j)=>x===v && j!==i)){
      const nm = (state.options.find(o=>o.id===v)||{name:v}).name;
      return { ok:false, why:`${nm} is already chosen — this trait takes a different one for each rank.` };
    }
    while (list.length < state.need) list.push(null);
    list[i] = v;
    entry.selections[pickId] = list.slice(0, state.need);
    return { ok:true };
  }

  // Rank went down: drop the slots that no longer exist. Called after any rank
  // change so a saved character never carries selections it cannot show.
  function trimSelections(ch, kind, id){
    const entry = canonicalEntry(ch, kind, id);
    for (const other of entryCopies(ch, kind, id)) if (other!==entry) delete other.selections;
    if (!entry || !entry.selections) return ch;
    for (const st of picksFor(ch, kind, id)){
      if (st.pick.type==="text") continue;
      const list = entry.selections[st.pick.id];
      if (Array.isArray(list) && list.length > st.need) entry.selections[st.pick.id] = list.slice(0, st.need);
      if (st.need === 0) delete entry.selections[st.pick.id];
    }
    if (!Object.keys(entry.selections).length) delete entry.selections;
    return ch;
  }

  // ── A3: one specialization model ─────────────────────────────────────
  // How many the archetype asks for. `countBy` is a path — "campaignPowerScaling.
  // aberrations" resolves against the current power level's scaling row. Its
  // ABSENCE means exactly one, which is what four of the five archetypes need,
  // so no data entry has to say what its silence already says.
  function specializationNeed(ch){
    const a = archetype(ch);
    const spec = a && a.specialization;
    if (!spec || !(spec.options||[]).length) return 0;
    if (!spec.countBy) return 1;
    const path = String(spec.countBy).split(".");
    let node = path[0]==="campaignPowerScaling" ? scalingRow(ch) : a;
    const from = path[0]==="campaignPowerScaling" ? 1 : 0;
    for (let i=from; i<path.length && node!=null; i++) node = node[path[i]];
    // An entry that DECLARES a count and cannot resolve one asks for nothing.
    // Falling back to 1 invented a requirement the data never stated — on a
    // corrupt import with no power level, main raised nothing here.
    return typeof node==="number" ? node : 0;
  }
  const specializationIds = ch => (((ch||{}).archetypeChoices||{}).specialization) || [];
  // Resolved option objects, in the order chosen. Orphans (an id the data no
  // longer defines) come back name-only rather than disappearing.
  function specializationChosen(ch){
    const a = archetype(ch);
    const opts = ((a||{}).specialization||{}).options || [];
    return specializationIds(ch).map(id => opts.find(o=>o.id===id) || { id, name:id, missing:true });
  }
  // The display string that identity.specialization used to store.
  const specializationLabel = ch => specializationChosen(ch).map(o=>o.name).join(" · ");

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
      // A3: one rule for every archetype. The count comes from the data
      // (`countBy`, or 1 by default), so an archetype that wants three picks
      // needs no app change — which is the point of unifying the two models.
      if (a.specialization && (a.specialization.options||[]).length){
        const need = specializationNeed(ch), have = specializationIds(ch).length;
        const label = a.specialization.label || "Specialization";
        if (a.specialization.required !== false && have < need)
          E(need>1 ? `Choose ${need} ${label}s (${have}/${need}).` : `Choose a ${label}.`);
        if (have > need)
          E(need>1 ? `Too many ${label}s chosen (${have}/${need}).` : `Choose only one ${label}.`);
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
        const sub = (a.specialization.options||[]).find(o=>o.id===specializationIds(ch)[0]);
        // Decision 91: the subtype's stat gate is requires data, not its own
        // special-cased check — same vocabulary checkPrereqs already speaks.
        if (sub && sub.requires){
          const r = checkPrereqs(ch, sub.requires);
          for (const u of r.unmet) E(`${sub.name} requires ${u}.`);
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
      // Skills host picks too (Martial Arts styles). Same rule, same voice.
      for (const id of Object.keys(ch.skills||{})){
        const def = skillById(id);
        if (!def || !Array.isArray(def.picks)) continue;
        for (const st of picksFor(ch, "skill", id)){
          if (st.complete) continue;
          E(`Choose ${st.need} ${st.pick.label||"option"}${st.need>1?"s":""} for ${def.name} (${st.filled}/${st.need}).`);
        }
      }
    }
    if (stepId==="character-points"){
      const bal = cp(ch);
      if (!bal) E("Choose a Campaign Power Level before spending Character Points.");
      else if (bal.left < 0) E(`Character Points overspent by ${-bal.left}.`);
      else if (bal.left > 0) W(`${bal.left} Character Points unspent.`);
      if (a && a.canPurchaseAdvantages===false && ch.advantages.some(x=>x.notes!=="natural"))
        E(`${a.name}s cannot purchase Advantages.`);
      // Batch 3 — locks, gates, and the inputs a trait demands. Reported once
      // per taken entry, in the order the player sees them.
      for (const [kind, list] of [["advantage", ch.advantages||[]], ["disadvantage", ch.disadvantages||[]]]){
        for (const entry of list){
          if (!entry || !(entry.rank>0)) continue;
          const def = defFor(kind, entry.id);
          if (!def) continue;                       // versionCheck reports orphans
          const lock = optionLock(ch, kind, entry.id);
          if (lock.locked) E(`${def.name} and ${lock.by} can't be taken together.`);
          const req = requirementState(ch, kind, entry.id);
          if (!req.ok) E(`${def.name} requires ${req.unmet.join("; ")}.`);
          // Prose prerequisites (gear/note/gmApproval) are the table's call, same
          // as a milestone's manual prereqs — warned, never blocked (Decision 91).
          for (const m of req.manual) W(`${def.name} — ${m}`);
          for (const st of picksFor(ch, kind, entry.id)){
            if (st.complete) continue;
            const label = st.pick.label || def.name;
            if (st.pick.type==="text"){
              // The mechanical picks are the app's business; the fiction is the
              // table's. A player who has not had the GM conversation yet is
              // warned, never blocked out of locking their character.
              const m = `${def.name} — ${label}${/[.!?]$/.test(label)?"":"."}`;
              st.gmApproval ? W(m) : E(m);
            } else {
              const noun = st.pick.type==="skill" ? "Skill" : "option";
              E(`Choose ${st.need} ${noun}${st.need>1?"s":""} for ${def.name} (${st.filled}/${st.need}).`);
            }
          }
        }
      }
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
    for (const e of ((c.trackers||{}).conditions)||[])
      if (e && !conditionById(e.id)) issues.push(`Condition "${e.id}" no longer exists in game data.`);
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
           // Conditions (Decision 95)
           conditionById, locationById, conditionState, addCondition, removeCondition, setConditionMarks,
           // Taking a hit (Decision 99)
           hlState, armorState, resolveHit, applyHit, damageTypeById, damageCategoryById,
           // Loadout & recovery (Decision 100)
           weaponLine, addLoadout, addCustomLoadout, removeLoadout, setWorn,
           upgradeOptions, addUpgrade, removeUpgrade, armorWear, repairArmor,
           naturalHealing, heal, resolveReset, applyReset,
           // Combat cleanup (Decisions 104–105)
           naturalArmor, nanomedKit,
           // Batch 3b — grants
           grants,
           ipState, ipCost, spendIP, grantIP,
           milestoneState, canTakeMinor, majorPrereqs, takeMilestone, untakeMilestone,
           logSession, addCredits, archPanels, panelMax, disciplineRanks, migrate,
           // Phase 3.3 — audit trail & undo
           diffChar, recordAction, undoLastAction,
           // Batch 3 — selection & constraint system
           optionLock, requirementState, picksFor, setSelection, trimSelections,
           specializationNeed, specializationIds, specializationChosen, specializationLabel };
})();
/*ENGINE-END*/
