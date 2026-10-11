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

  // A character's TAG, the Trusted Authentication Gateway NYTE City issues
  // every resident (Gear): its permanent identity (B18, Decisions 128 and
  // 133). Twelve characters from Crockford's base-32 alphabet (no I, L, O or
  // U, so it reads aloud cleanly), about 60 random bits, grouped
  // TAG-XXXX-XXXX-XXXX. It tells two characters apart when a file would
  // replace a saved one, and it's what a roster will key on. Never reissued:
  // a copy of the file is the same character. Schema 0.11 wrote the same
  // twelve characters after NCR-; migrate() carries them over.
  const INTAKE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const INTAKE_BODY = "[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}";
  const INTAKE_RE = new RegExp(`^TAG-${INTAKE_BODY}$`);
  const OLD_INTAKE_RE = new RegExp(`^NCR-(${INTAKE_BODY})$`);
  // The character file's shape. A bump needs a migrate() step in the same change.
  const SCHEMA_VERSION = "0.19";
  const isIntakeId = v => typeof v==="string" && INTAKE_RE.test(v);
  function randomChars(n){
    const c = typeof globalThis!=="undefined" && globalThis.crypto && typeof globalThis.crypto.getRandomValues==="function" ? globalThis.crypto : null;
    const bytes = new Uint8Array(n);
    if (c) c.getRandomValues(bytes); else for (let i=0;i<n;i++) bytes[i] = Math.floor(Math.random()*256);
    return [...bytes].map(b=>INTAKE_ALPHABET[b & 31]).join("");
  }
  function newIntakeId(){
    const s = randomChars(12);
    return `TAG-${s.slice(0,4)}-${s.slice(4,8)}-${s.slice(8,12)}`;
  }

  function newCharacter(){
    return {
      meta:{ schemaVersion:SCHEMA_VERSION, id:newIntakeId(), gamedataVersion:D().meta.gamedataVersion,
             created:new Date().toISOString(), updated:new Date().toISOString() },
      // No `specialization` here: schema 0.5 stores it once, in
      // archetypeChoices.specialization, and derives the display string (A3).
      // Schema 0.14 (W41): `tagless` is the player's, like the name; false is TAG'd.
      identity:{ name:"", age:null, build:"", hair:"", eyes:"", skin:"",
                 archetype:null, history:"", tagless:false },
      // Schema 0.15 (Decision 150): `statMethod` is the GM's pick, a flat
      // Stat Point pool or a rolled one. Skill Points have no roll any more.
      creation:{ powerLevel:null, statMethod:"flat",
                 rolls:{ statPoints:null, credits:null },
                 boosts:[], locked:false },
      // Archetype-specific creation inputs (schema 0.2 addition; see SCHEMA.md §3)
      archetypeChoices:{ rolls:{}, focusAllocation:{}, statBonusAllocation:{},
                         specialization:[], focusedSkillPicks:[],
                         naturalAdvantages:[], disciplines:{},
                         // Schema 0.19 (Decision 200): the ranks placed with
                         // Base Powers, per archetype power id, and what a
                         // specialization's `choices` asked for, per choice id.
                         basePowers:{}, optionPicks:{},
                         // Schema 0.16 (Decision 153): what a write-in archetype
                         // is, in the player's words. Read only when the
                         // archetype declares `writeIn`; its powers are `powers`.
                         writeIn:{ name:"", description:null, classification:null,
                                   classificationText:"", mechanics:[],
                                   traits:[], vulnerabilities:[] } },
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
                 // Schema 0.9 (magic plan M7): Aberrations a Cascade left.
                 aberrations:[],               // { id, permanence: "temporary"|"permanent", note? }
                 credits:{current:0, ledger:[]},
                 crank:{rep:0, ledger:[]},     // schema 0.17 (Decision 169); the tier is derived, never stored
                 adjustments:[],               // manual adjustments ledger
                 panel:{} },                   // generic archetype tracker panels
      panelData:{},                            // archetype table/toggle panel content
      powers:[], gear:[], weapons:[], armor:[],
      // Schema 0.18 (Decision 194): `powerIpe` is the ranks IP bought, per
      // power id: a Discipline's data id or a written power's row id.
      progression:{ ip:{earned:0, log:[]}, milestonePoints:0,
                    milestones:{minor:[], major:[]}, powerIpe:{} },
      sessions:[], notes:"",
      audit:[]                                 // reversible action log
    };
  }

  const powerLevel = ch => D().powerLevels.find(p=>p.id===ch.creation.powerLevel) || null;
  const archetype  = ch => D().archetypes.find(a=>a.id===ch.identity.archetype) || null;
  const skillById  = id => D().skills.find(s=>s.id===id);
  const advById    = id => D().advantages.find(a=>a.id===id);
  const disById    = id => D().disadvantages.find(d=>d.id===id);
  // Decision 152: what kind of being the archetype is, and so which Advantages
  // it may buy: "all", or "universal" (only those carrying 0430's Universal
  // tag). No archetype, or none named, gates nothing. A write-in archetype
  // (Decision 153) has none of its own: the character's pick is its classification.
  const writeInSpec = ch => { const a = archetype(ch); return a && a.writeIn && typeof a.writeIn==="object" ? a.writeIn : null; };
  const writeInOf = ch => { const w = ((ch||{}).archetypeChoices||{}).writeIn; return w && typeof w==="object" && !Array.isArray(w) ? w : {}; };
  const classificationById = id => (D().classifications||[]).find(c=>c.id===id) || null;
  const classification = ch => {
    const a = archetype(ch);
    if (!a) return null;
    return classificationById(writeInSpec(ch) ? writeInOf(ch).classification : a.classification);
  };
  function canBuyAdvantage(ch, adv){
    const c = classification(ch);
    if (!c || c.advantages!=="universal") return true;
    const def = typeof adv==="string" ? advById(adv) : adv;
    return !!(def && def.universal===true);
  }

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

  // The manual adjustments ledger — for milestone benefits (e.g. Honed)
  // and other un-modeled effects. Stat adjustments cascade like any input.
  const adjFor = (ch, target) => (ch.trackers.adjustments||[])
    .reduce((s,a)=>s + (a.target===target ? a.amount : 0), 0);

  // An advantage/disadvantage's `grants` array is a static
  // mechanical effect, not a player choice (unlike `picks`): Educated's +10
  // Skill Points/rank, Hard to Kill's +1 HP/Health Level/rank, Lucky/Unlucky's
  // LUCK spend-cost deltas, Long-Lived's Milestone slots. Computed fresh from
  // held advantages/disadvantages every call — nothing is written back onto
  // the character (constraint #7), so buying/selling one just changes what
  // this returns next render.
  function grants(ch){
    const out = { skillPoints:0, hpPerLevel:0, luckCost:{}, minorMilestones:0, majorMilestones:0, rou:0, sfrMax:0, painLevel:0, painLevelFrom:[] };
    const scan = (list, lookup) => (list||[]).forEach(entry=>{
      const def = entry && lookup(entry.id);
      for (const g of (def && def.grants) || []){
        if (!g) continue;
        if (g.type==="rou" || g.type==="sfrMax"){ out[g.type] += Number(g.amount)||0; continue; }
        // Decision 213: a shift to the Pain Level, once per entry. Only the
        // "when hurt" kind is decided; an unconditional one is ignored.
        if (g.type==="painLevel"){
          const n = Number(g.amount)||0;
          if (g.onlyIfHurt===true && n){ out.painLevel += n; out.painLevelFrom.push(txt(def.name)); }
          continue;
        }
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
    // Decision 199: a taken Major's grants count too. Majors are once each,
    // so each counts once however many times a file lists it.
    const taken = [...new Set(majorTakenIds(ch))].map(id=>({ id, rank:1 }));
    scan(taken, id=>majorById(ch, id));
    return out;
  }

  // ── Major Milestones: the pool (Decision 199) ─────────────────────────
  // The Majors a character can take: the shared list and its archetype's own
  // (`growth.majorMilestones`, when it's a list). Every lookup of a taken id
  // goes through here, so one from either list keeps its name.
  function majorPool(ch){
    const a = ch && ch.identity && archetype(ch), g = a && a.growth;
    const own = g && Array.isArray(g.majorMilestones) ? g.majorMilestones.filter(m=>m && typeof m==="object" && typeof m.id==="string") : [];
    return (D().milestones.majorGeneral||[]).concat(own);
  }
  const majorById = (ch, id) => majorPool(ch).find(m=>m.id===id) || null;
  const majorTakenIds = ch => ((((ch||{}).progression||{}).milestones||{}).major || [])
    .filter(m=>m && typeof m.id==="string").map(m=>m.id);
  // What Progression offers: the pool without the Majors only another
  // Origin can take. Before an Origin is chosen, all of them show.
  function majorOffered(ch){
    const mine = specializationIds(ch);
    return majorPool(ch).filter(m=>{
      const only = m.prerequisites && Array.isArray(m.prerequisites.specialization) ? m.prerequisites.specialization : null;
      return !only || !mine.length || only.some(id=>mine.includes(id));
    });
  }
  // A held Major's `form` grants, merged: what they change on a form
  // (Decision 199). `by` names the Majors, for the sheet to say why.
  function formGrants(ch){
    const out = { withering:null, weaponTags:[], barsPenalty:null, by:[] };
    for (const id of new Set(majorTakenIds(ch))){
      const m = majorById(ch, id);
      const gs = ((m && Array.isArray(m.grants)) ? m.grants : []).filter(g=>g && g.type==="form");
      if (!gs.length) continue;
      out.by.push({ name: txt(m.name), text: txt(m.benefit) });
      for (const g of gs){
        if (g.withering===false) out.withering = false;
        if (Array.isArray(g.weaponTags)) out.weaponTags.push(...g.weaponTags.filter(t=>typeof t==="string"));
        if (Number.isFinite(Number(g.barsPenalty)) && g.barsPenalty!=null) out.barsPenalty = Number(g.barsPenalty);
      }
    }
    out.weaponTags = [...new Set(out.weaponTags)];
    return out;
  }

  // W31: how a character's TAG reads. The number itself never changes
  // (Decision 133); an Advantage or Disadvantage held with `tagReads` (Ghost
  // TAG) names what the TAG is and what hovering it says. W41: a TAGless
  // character's reads as the data's `tag.tagless`. A counterfeit is what a
  // scanner sees, so a Ghost TAG's label wins, and its text says both.
  // Null when nothing changes how it reads.
  function tagReading(ch){
    const T = (D().tag||{}).tagless;
    const off = !!(ch && ch.identity && ch.identity.tagless===true) && !!T && typeof T.label==="string"
      ? { label:T.label, text: typeof T.text==="string" ? T.text : "", tagless:true } : null;
    for (const [list, lookup] of [[ch && ch.advantages, advById], [ch && ch.disadvantages, disById]])
      for (const e of Array.isArray(list) ? list : []){
        const def = e && Number(e.rank)>0 && lookup(e.id), r = def && def.tagReads;
        if (r && typeof r==="object" && typeof r.label==="string"){
          const text = typeof r.text==="string" ? r.text : "";
          return { label:r.label, text: off ? `${text} ${off.text}`.trim() : text, tagless: !!off, counterfeit:true };
        }
      }
    return off;
  }
  // Decision 155: the number as it reads. A TAGless character's drops the
  // TAG- (it was only ever the prefix); a counterfeit is a TAG, so a Ghost
  // TAG keeps it. The stored number never changes (Decision 133). "" when
  // the character has none.
  function tagNumber(ch){
    const id = ch && ch.meta && isIntakeId(ch.meta.id) ? ch.meta.id : "";
    const r = id && tagReading(ch);
    return r && r.tagless && !r.counterfeit ? id.replace(/^TAG-/, "") : id;
  }

  // Final stat value = creation base + archetype bonus + CP boosts + IPE + adjustments
  function statValue(ch, id){
    return ch.stats[id].base + archStatBonus(ch,id)
         + boostsFor(ch,"stat",id) + ch.stats[id].ipe + adjFor(ch,id);
  }
  // The stats as stored: what prices, caps, prerequisites and the derived
  // attributes read (Decision 195), so a shift never moves an IP price or WILL.
  function baseStatTable(ch){
    const out = {};
    for (const s of D().stats){
      const v = statValue(ch, s.id);
      out[s.id] = { value:v, mod:statMod(v) };
    }
    return out;
  }
  // The stats as played: the stored values plus whatever the form the
  // character is in adds (Werewolf form's +2 REF, +2 MOB, +4 BOD). Skills,
  // Health Levels and weapon damage read this. `form` is what the form added.
  function statTable(ch){
    const out = baseStatTable(ch), lift = (formState(ch)||{}).stats || {};
    for (const id of Object.keys(lift)) if (out[id]){
      const v = out[id].value + lift[id];
      out[id] = { value:v, mod:statMod(v), form:lift[id] };
    }
    return out;
  }

  // ── A form (Decision 195) ─────────────────────────────────────────────
  // A toggle panel's options are names, or objects whose `name` is what the
  // character stores in panelData. An option can carry what being in it does:
  // `stats` ({ stat, plus }), `naturalWeapons`, `bars` (a stat whose skills
  // are out of reach), `costFrom` (a key on the chosen specialization naming
  // what entering it costs) and `endsAtWithering` (the share of Health that
  // Withering takes to end it). Nothing names an archetype.
  const toggleOptions = p => (Array.isArray(p && p.options) ? p.options : [])
    .map(o => typeof o==="string" ? { name:o } : (o && typeof o==="object" && typeof o.name==="string") ? o : null)
    .filter(Boolean);
  const toggleCurrent = (ch, p) => {
    const opts = toggleOptions(p), pd = ch && ch.panelData && typeof ch.panelData==="object" ? ch.panelData : {};
    return opts.find(o=>o.name===pd[p.id]) || opts[0] || null;
  };
  const hasForm = o => !!o && ["stats","naturalWeapons","bars"].some(k=>o[k]!=null);
  // The form the character is in, or null when none of its toggles is on an
  // option that does anything. Stored nowhere but the toggle (constraint 7).
  function formState(ch){
    for (const p of archPanels(ch)){
      if (p.type!=="toggle") continue;
      const o = toggleCurrent(ch, p);
      if (!hasForm(o)) continue;
      const stats = {};
      for (const s of Array.isArray(o.stats) ? o.stats : []){
        const id = s && normStat(s.stat), n = Number(s && s.plus);
        if (id && Number.isFinite(n)) stats[id] = (stats[id]||0) + n;
      }
      const fg = formGrants(ch);
      const bars = o.bars && normStat(o.bars.stat) ? { stat:normStat(o.bars.stat), name:txt(o.bars.name), penalty:fg.barsPenalty } : null;
      return { panelId:p.id, name:o.name, stats, bars, weaponTags:fg.weaponTags, changedBy:fg.by,
               naturalWeapons: (Array.isArray(o.naturalWeapons) ? o.naturalWeapons : []).filter(isPlainObj),
               endsAtWithering: Number(o.endsAtWithering) || null, summary:txt(o.summaryText), endsText:txt(o.endsText) };
    }
    return null;
  }
  // The form as the sheet shows it: its natural weapons computed like any
  // weapon (the attack is the skill's, the damage BOD+n), and whether the
  // Withering taken has ended it. The engine says so; it never shifts back.
  function formView(ch){
    const f = formState(ch);
    if (!f) return null;
    const weapons = f.naturalWeapons.map(w=>{
      const d = weaponDamage(ch, w.damage), skill = skillById(w.skill) ? skillLine(ch, w.skill) : null;
      return { name:txt(w.name), skill: skill ? skill.def.name : "", attack: skill ? skill.checkBonus : null,
               damage:d.value, damageFormula:d.formula, tags:f.weaponTags };
    });
    const hs = hlState(ch), withering = nonNegInt((ch.trackers||{}).witheringDamage);
    const ended = !!f.endsAtWithering && hs.total>0 && withering >= hs.total * f.endsAtWithering;
    return Object.assign({}, f, { weapons, ended });
  }
  // Switching a toggle. Entering an option whose `costFrom` the chosen
  // specialization answers (a Forge Fang's `shiftCost`) takes that cost:
  // `hl` Health Levels of damage, at the Health Level the character has now,
  // in the damage category named, so Withering is recorded as Withering. The
  // caller's commit() makes it one Undo. Leaving costs nothing.
  // What entering one option costs this character: null when free. An HL is
  // priced in the form being entered, so the track shows exactly the Health
  // Levels spent while it's on (a Forge Fang at BOD 12 shifted spends 7 HP).
  function toggleCost(ch, p, o){
    const c = o && o.costFrom && specializationChosen(ch).map(s=>s[o.costFrom]).find(isPlainObj);
    if (!c || !(nonNegInt(c.hl) > 0)) return null;
    const cat = formGrants(ch).withering===false && hasForm(o) ? damageCategoryById("regular") : damageCategoryById(c.category);
    const pd = Object.assign({}, isPlainObj(ch.panelData) ? ch.panelData : {}, { [p.id]: o.name });
    const hpPer = health(Object.assign({}, ch, { panelData: pd })).hpPer;
    return { hl:nonNegInt(c.hl), hp:nonNegInt(c.hl) * hpPer, withering: !!(cat && cat.recordsWithering), category: cat ? cat.name : "" };
  }
  function setToggle(ch, panelId, name){
    const p = archPanels(ch).find(x=>x.id===panelId && x.type==="toggle");
    if (!p) return { ok:false, why:"That isn't on this sheet." };
    const o = toggleOptions(p).find(x=>x.name===name);
    if (!o) return { ok:false, why:"That isn't one of its options." };
    const was = toggleCurrent(ch, p);
    if (!ch.panelData || typeof ch.panelData!=="object") ch.panelData = {};
    const cost = was && was.name===o.name ? null : toggleCost(ch, p, o);
    if (cost){
      const t = ch.trackers;
      t.damage = nonNegInt(t.damage) + cost.hp;
      if (cost.withering) t.witheringDamage = nonNegInt(t.witheringDamage) + cost.hp;
    }
    ch.panelData[p.id] = o.name;
    return { ok:true, cost };
  }
  // A toggle panel as the sheet draws it: each option, which is on, and
  // what pressing an option that isn't would cost.
  function toggleView(ch, p){
    const cur = toggleCurrent(ch, p);
    // `effectText` is what being in an option means when nothing computes it
    // (a Draugur's broken Code, Decision 200): Main shows it while it's on.
    return toggleOptions(p).map(o=>({ name:o.name, on: !!cur && cur.name===o.name, does: hasForm(o), text: txt(o.effectText),
      cost: cur && cur.name===o.name ? null : toggleCost(ch, p, o) }));
  }

  // Scaling row for the chosen archetype at the chosen power level
  function scalingRow(ch){
    const a = archetype(ch), pl = powerLevel(ch);
    if (!a || !pl || !a.campaignPowerScaling || !a.campaignPowerScaling.byPowerLevel) return null;
    return a.campaignPowerScaling.byPowerLevel[pl.id] || null;
  }

  // A data path names a number another table holds (Decisions 79, 135):
  // "campaignPowerScaling.<key>" reads the current power level's scaling row,
  // "powerLevel.<key>" the power level, anything else the archetype itself.
  // Null when it can't resolve to a number: the caller decides what that means.
  function dataPath(ch, path){
    const keys = String(path).split(".");
    let node;
    if (keys[0]==="campaignPowerScaling"){ node = scalingRow(ch); keys.shift(); }
    else if (keys[0]==="powerLevel"){ node = powerLevel(ch); keys.shift(); }
    else node = archetype(ch);
    for (const k of keys){ if (node==null) break; node = node[k]; }
    return typeof node==="number" && isFinite(node) ? node : null;
  }

  // A formula the data states as numbers, never as text (Decision 135):
  // { stat, times, plus } is stat × times + plus. SAN is EMP × 10 and a
  // Werewolf's starting SFR is WILL × 3 + 5; the text is written from the same
  // numbers, so it can't say something the engine doesn't do.
  const isFormula = f => !!f && typeof f==="object" && typeof f.stat==="string" && typeof f.times==="number";
  const formulaValue = (f, input) => typeof input==="number" ? input * f.times + (Number(f.plus)||0) : null;
  const formulaText = f => isFormula(f) ? `${f.stat} × ${f.times}${f.plus ? ` + ${f.plus}` : ""}` : "";

  // Derived attributes read the stats as stored: the book's shift enhances
  // skills, speed and Health Levels, not WILL or TOL (Decision 195).
  function derived(ch){
    const t = baseStatTable(ch), out = {};
    for (const d of D().derived){
      if (d.type === "sumOfModifiers"){
        let v = d.base + d.inputs.reduce((s,id)=>s + t[id].mod, 0);
        if (d.floor != null) v = Math.max(d.floor, v);
        out[d.id] = v;
      } else if (d.type === "percent"){
        if (!isFormula(d.formula) || !t[d.formula.stat]) continue;
        let v = formulaValue(d.formula, t[d.formula.stat].value);
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
    // Aberrations the character has (Decision 110) move a derived stat after
    // its own floor: Drained takes max TOL below 1, never below adjustFloor.
    // Never lifts a value already under that floor from something else.
    const ab = aberrationState(ch).adjust, abFloor = (D().aberrationRules||{}).adjustFloor;
    for (const k of Object.keys(ab)) if (typeof out[k]==="number" && ab[k]){
      const v = out[k] + ab[k];
      out[k] = typeof abFloor==="number" ? Math.max(Math.min(out[k], abFloor), v) : v;
    }
    return out;
  }

  function health(ch){
    const hl = D().resources.healthLevels;
    const bod = statTable(ch).BOD.value;   // a form's BOD counts (Decision 195)
    const levels = Math.min(bod, hl.maxLevels);
    const hpPer  = hl.hpPerLevel + Math.max(0, bod - hl.maxLevels) // BOD>10 rule
                 + grants(ch).hpPerLevel;                          // Hard to Kill
    return { levels, hpPer, total: levels*hpPer + adjFor(ch,"HP") };
  }

  // Starting SFR is a formula on the scaling row. Its stat can be a derived
  // one (WILL) or a Basic Stat; one the engine can't find gives no value,
  // and the tracker then asks for its max instead of inventing one.
  function sfr(ch){
    const row = scalingRow(ch);
    if (!row || !row.startingSFR) return null;
    const f = row.startingSFR;
    const g = grants(ch), rou = typeof row.rou==="number" ? row.rou + g.rou : row.rou;
    if (!isFormula(f)) return { value:null, rou, formula:"" };
    const d = derived(ch);
    const input = typeof d[f.stat]==="number" ? d[f.stat] : D().stats.some(s=>s.id===f.stat) ? statValue(ch, f.stat) : null;
    const v = formulaValue(f, input);
    return { value: v==null ? v : v + g.sfrMax, rou, formula: formulaText(f), fromMilestones: { rou:g.rou, sfrMax:g.sfrMax } };
  }

  // ── Pools ────────────────────────────────────────────────────────────
  // "3d10" -> [3, 30]; anything else has no range to check against.
  function diceRange(die){
    const m = /^(\d+)d(\d+)$/.exec(String(die||""));
    return m ? [Number(m[1]), Number(m[1])*Number(m[2])] : null;
  }
  // Decision 150: the Stat Point pool is flat or rolled, the GM's pick.
  const statMethod = ch => ch.creation.statMethod==="rolled" ? "rolled" : "flat";
  function statPool(ch){
    const pl = powerLevel(ch);
    if (!pl) return null;
    const sp = pl.statPoints || {};
    if (statMethod(ch)==="rolled"){
      const r = sp.rolled || {}, roll = ch.creation.rolls.statPoints;
      return { method:"rolled", base:r.base, roll, rollDie:r.roll, range:diceRange(r.roll),
               total: roll==null ? null : r.base + roll };
    }
    return { method:"flat", base:sp.flat, roll:null, rollDie:null, range:null, total:sp.flat };
  }
  // What a stat at `score` cost to buy from the free base: `raiseCost` is
  // the price of raising TO each score. Past the table (an admin edit), each
  // point costs what the table's last one does. Closed form past the table,
  // so a hostile score can't make this loop.
  function statCost(score){
    const R = D().statRules, rc = R.raiseCost || {};
    const keys = Object.keys(rc).map(Number).filter(Number.isFinite);
    const top = keys.length ? Math.max(...keys) : R.base;
    const topCost = keys.length ? Number(rc[top])||0 : 1;
    const n = Number(score);
    if (!Number.isFinite(n)) return 0;
    let c = 0;
    for (let v = R.base+1; v <= Math.min(n, top); v++) c += Number(rc[v]) || 0;
    if (n > top) c += (Math.floor(n) - top) * topCost;
    return c;
  }
  const statSpent = ch => D().stats.reduce((s,st)=>s + statCost(ch.stats[st.id].base), 0);
  // What raising this stat's base by one more point costs.
  const nextStatCost = (ch, id) => statCost(ch.stats[id].base + 1) - statCost(ch.stats[id].base);

  // Decision 150: Skill Points are the level's base plus the scores of its
  // `plusStats` (INT and REF), with no roll. The score counts the archetype's
  // bonus and CP Boosts too (Ken, 2026-09-27): a Boost bought on a later step
  // raises the pool, and the Skills step then warns of points unspent.
  function skillPool(ch){
    const pl = powerLevel(ch);
    if (!pl) return null;
    const k = pl.skillPoints || {};
    const stats = (k.plusStats||[]).filter(id=>ch.stats[id])
      .map(id=>({ id, value: ch.stats[id].base + archStatBonus(ch, id) + boostsFor(ch, "stat", id) }));
    const granted = grants(ch).skillPoints;
    return { base:k.base, stats, granted,
             total: (Number(k.base)||0) + stats.reduce((s,x)=>s + x.value, 0) + granted };
  }
  const skillSpent = ch => Object.values(ch.skills).reduce((s,k)=>s + k.rank, 0);

  // ── Character Points ─────────────────────────────────────────────────
  // Ranked Advantages cost `cost` per rank (Decision 16).
  const advSpent  = ch => ch.advantages.reduce((s,a)=>{
    if (a.source === "natural") return s;                   // Professional pool: free
    const def = advById(a.id); return s + (def ? def.cost * a.rank : 0);
  }, 0);
  const disGranted = ch => ch.disadvantages.reduce((s,d)=>{
    const def = disById(d.id); return s + (def ? def.pointsGranted * d.rank : 0);
  }, 0);
  const luckSpent = ch => ch.trackers.luck.bonus * D().resources.luck.cpCostPerPoint;
  const boostSpent = ch => ch.creation.boosts
    .filter(b=>b.targetType!=="power")
    .reduce((s,b)=>s + b.times * D().creationFlow.boostRules.cpCostPerPoint, 0);
  // A power rank bought at creation costs one price for every power, a
  // Discipline included (Decision 157). The cap is the power level's.
  const powerRankCost = () => Number(D().creationFlow.boostRules.cpPerPowerRank)||0;
  // Disciplines (Decision 135): the cap and each one's starting rank come from
  // the archetype's data, so any archetype that declares
  // `coreMechanic.disciplines` gets them.
  const disciplineSpec = ch => { const a = archetype(ch); return (a && a.coreMechanic && a.coreMechanic.disciplines) || null; };
  function disciplineSpent(ch){
    const spec = disciplineSpec(ch);
    if (!spec) return 0;
    const cost = powerRankCost();
    return Object.values(ch.archetypeChoices.disciplines||{}).reduce((s,r)=>s + r*cost, 0);
  }
  const disciplineCap = ch => { const spec = disciplineSpec(ch); return spec && spec.maxRankBy ? dataPath(ch, spec.maxRankBy) : null; };
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
    if (times >= pl.maxBoost)
      return {ok:false, why:`Max Boost reached (${pl.maxBoost}× per target).`};
    if (type==="stat" && statValue(ch,id) >= D().statRules.max)
      return {ok:false, why:`Stat cap ${D().statRules.max}.`};
    if (type==="skill"){
      const rank = (ch.skills[id] ? ch.skills[id].rank : 0) + times;
      const cap = skillRankCap(ch, id);
      if (rank >= cap) return {ok:false, why:`Max Skill Rank ${cap}.`};
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
  // The current Pain Level penalty applies to all skill checks and is
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
    // A form can put a stat's skills out of reach (Feral Mind): `barred`
    // names what does. The total still shows; the sheet says it can't be used.
    // Clear Head (Decision 199) turns the bar into a penalty: `formPenalty`.
    const form = formState(ch), hit = form && form.bars && pri===form.bars.stat;
    const formPenalty = hit && form.bars.penalty!=null ? form.bars.penalty : 0;
    const barred = hit && form.bars.penalty==null ? (form.bars.name || form.name) : null;
    return { def, rank, trained:rank>0, checkBonus: base + pain + conditions + formPenalty, barred, formPenalty,
             breakdown:{ rank, primary:{id:pri, value:priVal}, synergy:{id:syn, mod:synMod}, pain, conditions, form:formPenalty },
             dataWarning: (pri && syn) ? null : `Skill "${def.name}" references an unknown stat (${!pri?def.primaryStat:def.synergyStat}).` };
  }

  // ════ CONDITION, PROGRESSION, SESSIONS ═══════════════════════════════

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

  // The trait that changes which Health Levels count toward Pain, or null.
  function painImmunity(ch){
    const a = ch && ch.identity && archetype(ch);
    if (!a || writeInSpec(ch)) return null;
    return (Array.isArray(a.baselineTraits) ? a.baselineTraits : [])
      .find(t=>isPlainObj(t) && isPlainObj(t.pain) && t.pain.healthLevelsFrom==="withering") || null;
  }
  // Pain Level = the band for Health Levels lost, plus any Condition Pain
  // (Agonized), clamped to the table — "never below 0 or above 3" (0540).
  function painState(ch){
    const hl = D().resources.healthLevels;
    const hs = hlState(ch);
    const hlLost = hs.lost;
    // Decision 202: a trait whose `pain.healthLevelsFrom` is "withering"
    // (Pain Immunity) puts only the Health Levels Withering took on the
    // table: sunlight is the one pain a Vampire feels. Conditions add as ever.
    const immune = painImmunity(ch);
    const banded = immune ? (hs.hpPer>0 ? Math.min(hs.emptied, Math.floor(Math.min(hs.damage, nonNegInt(((ch||{}).trackers||{}).witheringDamage)) / hs.hpPer)) : 0) : hlLost;
    let band = hl.painLevels[0];
    for (const p of hl.painLevels) if (banded >= p.hlLostThreshold) band = p;
    const cs = conditionState(ch), as = aberrationState(ch);
    const fromConditions = cs.painLevels, fromAberrations = as.painLevels;
    // Who's adding Pain, by name, so the sheet can say "Agonized, Phantom Pain".
    const painSources = cs.active.filter(a=>a.def && typeof a.def.painLevels==="number").map(a=>a.name)
      .concat(as.active.filter(a=>a.def && typeof a.def.painLevels==="number").map(a=>a.name));
    const top = hl.painLevels.reduce((m,p)=>Math.max(m,p.level), 0);
    const base = Math.max(0, Math.min(top, band.level + fromConditions + fromAberrations));
    // Decision 213: a trait that shifts Pain (Pain Sensitive) does so only
    // once there's some Pain to shift, and never past the table's top.
    const tg = grants(ch);
    const target = Math.min(top, base + (base>=1 ? tg.painLevel : 0));
    const fromTraits = target - base;               // what the trait actually added
    if (fromTraits>0) painSources.push(...tg.painLevelFrom);
    const lvl = hl.painLevels.find(p=>p.level===target) || band;
    const pen = hl.painPenaltiesPerLevel;
    return { hlLost, level: lvl.level, label: lvl.label, description: lvl.description,
             fromHealth: band.level, immunity: immune ? { name:immune.name, banded } : null, fromConditions, fromAberrations, fromTraits, painSources,
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
    // An upgrade answers one class or a list (the retired Warding, all three kinds).
    const resAgainst = [...new Set([...(R.baseResAgainst||[]),
                        ...effects.flatMap(u=>[].concat((upgradeById(u)||{}).resAgainst || []))])];
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
      const def = majorById(ch, id);
      ((def && def.grants) || []).forEach(g=>add(g, def, taken[id]));
    });
    specializationChosen(ch).forEach(o=>(o.grants||[]).forEach(g=>add(g, o, 1)));
    // A held archetype power's grants count at its rank (Iron Hide's rank + 1,
    // Decision 200); every one so far is `while` it's running.
    archetypePowers(ch).forEach(p=>(Array.isArray(p.grants) ? p.grants : []).forEach(g=>add(g, p, p.rank)));
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

  // 0530 Massive: skips PROT and RES; strips INT equal to the damage; 1 HL per
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

  // 0530 regular: PROT (the die rolled) + RES if the type matches and the hit
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

  // 0540's consequences of taking damage, hit or not: At Zero, and the Death
  // Mark while Dying. Turn Reset's ongoing damage shares this. Shock doesn't:
  // 0540 asks it of "a single hit", and a Bleeding tick isn't one.
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
  const equipmentById = byId("equipment");
  const loadoutDef = (kind, id) => kind==="armor" ? armorDefById(id) : kind==="weapons" ? weaponDefById(id)
                                 : kind==="gear" ? equipmentById(id) : null;
  function checkRoll(die, roll, what){
    const max = dieMax(die), n = Math.floor(Number(roll));
    if (roll==null || roll==="" || !(n>=1)) return { ok:false, why:`Enter the ${what} you rolled.` };
    if (max && n>max) return { ok:false, why:`That's a ${die}, so the roll can't be more than ${max}.` };
    return { ok:true, value:n };
  }

  // "BOD+3" is "calculated by adding the BOD score to the bonus" (0530): BOD 5
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
  // ACC is apart because only Single fire adds it (0530). A custom weapon is
  // whatever was typed, so there's nothing to compute.
  function weaponLine(ch, index){
    const e = listOf(ch, "weapons")[index];
    if (!e || typeof e!=="object") return null;
    const notes = typeof e.notes==="string" ? e.notes : "";
    if (e.custom || !e.id) return { index, custom:true, name:String(e.name||""), notes,
      rounds: roundsOf(e.capacity, e), fireModes: fireModesOf(e.rof) };
    const def = weaponDefById(e.id);
    if (!def) return { index, missing:true, name:String(e.id), notes };
    const line = Object.assign({ index, notes }, weaponDefLine(ch, def));
    // W16: what's installed changes the line. A mod's tags join the
    // weapon's, its damage bonus adds to every hit, and a sight's ACC is
    // carried apart as `aimed`, since it's for aimed shots, not Single fire.
    const mods = modsOf(e).map(id=>weaponModById(id)).filter(Boolean);
    line.mods = mods.map(m=>({ id:m.id, slots:Number(m.slots)||0, description:m.description||"" }));
    line.modSlots = { slots: Number(def.mods)||0, used: mods.reduce((n,m)=>n+(Number(m.slots)||0),0) };
    line.modSlots.free = Math.max(0, line.modSlots.slots - line.modSlots.used);
    const bonus = mods.reduce((n,m)=>n+(Number(m.damageBonus)||0),0);
    if (bonus){ line.damageBonus = bonus; if (line.damage!=null) line.damage += bonus; }
    line.tags = [...new Set([...line.tags, ...mods.flatMap(m=>m.grantsTags||[])])];
    const sights = mods.filter(m=>m.aimedAcc && !m.aimedAt), far = mods.filter(m=>m.aimedAcc && m.aimedAt);
    line.aimed = [];
    if (sights.length) line.aimed.push({ acc: sights.reduce((n,m)=>n+m.aimedAcc,0), by: sights.map(m=>m.id), when:null });
    far.forEach(m=>line.aimed.push({ acc:m.aimedAcc, by:[m.id], when:m.aimedAt,
      instead: (m.notWith||[]).filter(x=>sights.some(g=>g.id===x)) }));
    line.rounds = roundsOf(def.capacity, e);
    line.fireModes = fireModesOf(def.rof);
    // W40: specialty rounds in the magazine name themselves, and their tags
    // join the weapon's.
    const loadedDef = line.rounds && loadedOf(e) ? equipmentById(loadedOf(e)) : null;
    if (loadedDef && loadsAs(loadedDef)){
      line.loaded = { id:loadedDef.id, name:loadedDef.name, tags:ammoTags(loadedDef) };
      line.tags = [...new Set([...line.tags, ...line.loaded.tags])];
    }
    // W30: what Reload would take, and how much of it you carry. W40: every
    // kind carried, and whether one would swap what's loaded.
    const src = line.rounds && reloadSource(ch, e);
    if (src){ const have = src.have;
      line.reloadFrom = { ammo: have.length ? have.map(h=>h.def.name) : src.ammo, carried: have.reduce((n,h)=>n+h.qty, 0),
                          unit: have.length===1 ? have[0].def.unit||null : null, kinds: have.length,
                          swap: have.some(h=>loadsAs(h.def)!==loadedOf(e)) };
    }
    return line;
  }
  // ── Rounds and mods (W16, Decision 120) ──
  // A capacity reads as its leading number plus any chambered "+N": "15+1"
  // holds 16, "100 (belt)" 100, "10 bursts" 10. Anything else isn't tracked
  // (null). `roundsSpent` is the stored input, so a full magazine is 0 and a
  // catalog capacity that changes can't strand a stale count.
  const weaponModById = byId("weaponModGlossary");
  const modsOf = e => Array.isArray(e && e.mods) ? e.mods.filter(x=>typeof x==="string") : [];
  function roundsOf(capacity, e){
    const m = /^\s*(\d+)\s*(?:\+\s*(\d+))?/.exec(String(capacity==null ? "" : capacity));
    const max = m ? Number(m[1]) + Number(m[2]||0) : 0;
    if (!(max>0)) return null;
    const spent = Math.min(max, nonNegInt(e && e.roundsSpent));
    return { max, spent, left: max - spent };
  }
  function fireModesOf(rof){
    const ids = String(rof==null ? "" : rof).toUpperCase().split(/[^A-Z]+/).filter(Boolean);
    return ((D().weaponRules||{}).rofModes||[]).filter(r=>ids.includes(r.id)).map(r=>({ id:r.id, name:r.name, rounds:Number(r.rounds)||1 }));
  }
  function weaponEntry(ch, index){
    const e = listOf(ch, "weapons")[index];
    return e && typeof e==="object" ? e : null;
  }
  // Fire a mode (or a bare count, for a weapon with no RoF: a bow, the
  // Hellmouth's bursts). Refused, with the reason, if the magazine can't pay.
  function fireWeapon(ch, index, mode){
    const e = weaponEntry(ch, index), l = e && weaponLine(ch, index);
    if (!l || l.missing) return { ok:false, why:"That weapon isn't on the sheet." };
    if (!l.rounds) return { ok:false, why:`${l.name||"This weapon"} doesn't track rounds.` };
    const fm = (l.fireModes||[]).find(f=>f.id===mode);
    const n = fm ? fm.rounds : mode==null || mode==="" ? 1 : Math.floor(Number(mode));
    if (!(n>=1)) return { ok:false, why:"Choose how it's fired." };
    if (n>l.rounds.left) return { ok:false, why:`${fm?fm.name:"That"} spends ${n} round${n===1?"":"s"}, and ${l.rounds.left} ${l.rounds.left===1?"is":"are"} left. Reload.` };
    e.roundsSpent = l.rounds.spent + n;
    return { ok:true, name:l.name, spent:n, mode: fm ? fm.name : null, left: l.rounds.left - n, max: l.rounds.max };
  }
  // W30: what reloads a catalog weapon. An ammo entry's `reload` names what it
  // fits (Gear's Weapon Type column, as weapon categories or ids) and what one
  // unit fills: the whole "magazine" (a mag, a cell) or one "round" (a shell).
  // A weapon nothing fits (a launcher, the belt-fed guns Gear treats as
  // unlimited, a custom weapon) reloads as it always did. W40: rounds that
  // `needsMod` fit only a weapon with that mod, and a mod that `firesOnly`
  // certain rounds (the Angel Mod) takes nothing else.
  function ammoFor(def, mods){
    if (!def) return [];
    const only = mods.map(id=>weaponModById(id)).filter(m=>m && Array.isArray(m.firesOnly)).flatMap(m=>m.firesOnly);
    return (D().equipment||[]).filter(g=>{ const r = g && g.reload;
      if (!r || typeof r!=="object") return false;
      if (!((r.categories||[]).includes(def.category) || (r.weapons||[]).includes(def.id))) return false;
      if (r.needsMod && !mods.includes(r.needsMod)) return false;
      return !only.length || only.includes(g.id); });
  }
  function reloadSource(ch, e){
    const kinds = ammoFor(e && !e.custom && e.id ? weaponDefById(e.id) : null, modsOf(e));
    if (!kinds.length) return null;
    const have = kinds.map(k=>{ const c = carriedGear(ch, k.id); return c && Object.assign({ def:k }, c); }).filter(Boolean);
    // What to say it takes: the standard rounds, or what's left when a mod
    // allows only specialty ones.
    const standard = kinds.filter(k=>!loadsAs(k));
    return { ammo: (standard.length ? standard : kinds).map(k=>k.name), have };
  }
  // W40: what a weapon remembers is in its magazine: a specialty round's id,
  // or nothing for standard rounds. Specialty rounds change the weapon (their
  // tags join its line), unless they need a mod, whose own tags already say it.
  const loadsAs = def => def && def.reload && def.reload.specialty ? def.id : null;
  const loadedOf = e => e && typeof e.loaded==="string" ? e.loaded : null;
  const ammoTags = def => def && def.reload && !def.reload.needsMod && Array.isArray(def.tags) ? def.tags : [];
  const ammoOption = (h, loaded) => ({ id:h.def.id, name:h.def.name, qty:h.qty, unit:h.def.unit||null, tags:ammoTags(h.def),
                                       loaded: loadsAs(h.def)===loaded });
  // Reload takes one unit of what fits from what you carry. With none on the
  // sheet it's refused, saying so, unless the player reloads anyway (`anyway`),
  // which the result marks so the audit can say it was. W40: with more than
  // one kind carried it asks which (`choose`, answered with `opts.ammo`), and
  // a full weapon reloads only to swap kinds (0530). What was left in the
  // magazine isn't kept (F34's stub).
  function reloadWeapon(ch, index, opts){
    const e = weaponEntry(ch, index), l = e && weaponLine(ch, index);
    if (!l || l.missing) return { ok:false, why:"That weapon isn't on the sheet." };
    if (!l.rounds) return { ok:false, why:`${l.name||"This weapon"} doesn't track rounds.` };
    const src = reloadSource(ch, e), loaded = loadedOf(e), full = !l.rounds.spent;
    const done = { ok:true, name:l.name, max:l.rounds.max, left:l.rounds.max };
    const options = !src ? [] : full ? src.have.filter(h=>loadsAs(h.def)!==loaded) : src.have;
    if (full && !options.length) return { ok:false, why:"It's already full." };
    if (!src){ e.roundsSpent = 0; return done; }
    if (!src.have.length){
      if (!(opts && opts.anyway)) return { ok:false, noAmmo:true, ammo:src.ammo, why:`You carry no ${src.ammo.join(" or ")}.` };
      e.roundsSpent = 0; delete e.loaded;
      return Object.assign(done, { anyway:true, ammo:src.ammo });
    }
    const want = opts && typeof opts.ammo==="string" ? opts.ammo : null;
    // Swapping a full magazine is always a choice the player names.
    const k = want ? options.find(h=>h.def.id===want) : options.length===1 && !full ? options[0] : null;
    if (want && !k) return { ok:false, why: full ? "It's already loaded with those." : "That doesn't load this weapon." };
    if (!k) return { ok:false, choose:true, options: options.map(h=>ammoOption(h, loaded)), full, left:l.rounds.left, why:"Choose which rounds to load." };
    const kind = loadsAs(k.def), swap = kind!==loaded, perRound = k.def.reload.fills==="round";
    // A swap on a weapon loaded a round at a time empties it first.
    const empty = perRound && swap ? l.rounds.max : l.rounds.spent;
    const n = perRound ? Math.min(empty, k.qty) : 1;
    useGear(ch, k.index, n);
    e.roundsSpent = perRound ? empty - n : 0;
    if (kind) e.loaded = kind; else delete e.loaded;
    return Object.assign(done, { left: l.rounds.max - e.roundsSpent, used:n, ammo:[k.def.name], ammoLeft: k.qty - n, unit: k.def.unit||null,
                                 loaded: kind, swapped: swap });
  }
  // What can go on a catalog weapon: every mod, with the reason one can't.
  function weaponModOptions(ch, index){
    const e = weaponEntry(ch, index);
    if (!e || e.custom || !e.id) return null;
    const def = weaponDefById(e.id); if (!def) return null;
    const l = weaponLine(ch, index), have = modsOf(e);
    const options = (D().weaponModGlossary||[]).map(g=>{
      const need = Number(g.slots)||0, only = g.onlyFor, not = g.notFor;
      let why = null;
      if (!l.modSlots.slots) why = `${def.name} has no mod slots.`;
      else if (have.includes(g.id)) why = "Already installed.";
      else if (not && (not.categories||[]).includes(def.category)) why = `Doesn't go on ${categoryName(def.category)}.`;
      else if (only && !(only.categories||[]).includes(def.category) && !(only.weapons||[]).includes(def.id)) why = `Doesn't fit ${def.name}.`;
      else if (need>l.modSlots.free) why = need===1 ? "No slot free." : `Needs ${need} slots; ${l.modSlots.free} free.`;
      return { id:g.id, slots:need, ok:!why, why, description:g.description||"" };
    });
    return { name:def.name, slots:l.modSlots.slots, used:l.modSlots.used, free:l.modSlots.free, options };
  }
  const categoryName = id => ((D().weaponCategories||[]).find(c=>c.id===id)||{ name:String(id||"this weapon") }).name;
  function addWeaponMod(ch, index, id){
    const u = weaponModOptions(ch, index);
    const o = u && u.options.find(x=>x.id===id);
    if (!o) return { ok:false, why: u ? "Choose a mod." : "Only a catalog weapon takes mods." };
    if (!o.ok) return { ok:false, why:o.why };
    const e = ch.weapons[index];
    e.mods = modsOf(e).concat(id);
    return { ok:true, name:u.name };
  }
  function removeWeaponMod(ch, index, at){
    const e = weaponEntry(ch, index);
    if (!e || !Array.isArray(e.mods) || !(at>=0 && at<e.mods.length)) return { ok:false, why:"No such mod." };
    const id = e.mods.splice(at, 1)[0];
    return { ok:true, id };
  }
  // A catalog weapon's numbers for this character, before anyone carries it.
  function weaponDefLine(ch, def){
    const sk = def.skill && skillById(def.skill) ? skillLine(ch, def.skill) : null;
    const dmg = weaponDamage(ch, def.damage);
    return { id:def.id, name:def.name, category:def.category||null,
             skill: sk ? { id:sk.def.id, name:sk.def.name, trained:sk.trained } : null,
             attack: sk ? sk.checkBonus : null, acc: typeof def.acc==="number" ? def.acc : null,
             damage: dmg.value, damageFormula: dmg.formula,
             style: def.style||null, damageType: def.damageType||null,
             reach: def.reach||null, parry: def.parry||null, range: def.range||null, radius: def.radius||null,
             rof: def.rof||null, capacity: def.capacity||null,
             escalation: def.escalation&&typeof def.escalation==="object" ? def.escalation : null, defense: def.defense||null,
             tags: def.tags||[], features: def.features||[], weaponNotes: def.notes||null };
  }

  // A tag read out (Decision 139): what a weapon's, an arrowhead's or a
  // spell's tag means, from its glossary. A tag with a parameter ("Blast
  // (10m)", "Withering (Undead / Demonic)") is found by the words before the
  // bracket. A spell's tag reads the spell glossary first, since the two
  // share a few words (AP, Decision 116). Null for a tag no glossary has.
  function glossary(term, kind){
    const t = String(term==null ? "" : term).trim();
    if (!t) return null;
    const base = t.replace(/\s*\(.*\)\s*$/, "");
    const lists = kind==="spell" ? ["spellTagGlossary", "weaponTagGlossary", "weaponFeatureGlossary"]
                                 : ["weaponTagGlossary", "weaponFeatureGlossary", "spellTagGlossary"];
    for (const key of base===t ? [t] : [t, base])
      for (const list of lists){
        const g = (D()[list]||[]).find(x=>x && x.id===key);
        if (g) return { id:g.id, term:t, text:g.description||"", note:g.playerNote||null };
      }
    return null;
  }

  // What a stat's score means (Decision 139): the book's range the score
  // sits in, how the modifier works, and past 10, what changes. `ranges`
  // run up the scale; the first one the score fits is its reading.
  function statReading(ch, id){
    const R = D().statRules||{}, def = (D().stats||[]).find(s=>s.id===id);
    if (!def) return null;
    const v = statTable(ch)[id].value;     // as played: a form's lift counts
    const range = (R.ranges||[]).find(r=>(r.min==null || v>=r.min) && (r.max==null || v<=r.max)) || null;
    const hlRule = (((D().resources||{}).healthLevels)||{}).bodAbove10Rule;
    return { id, name:def.name||id, description:def.description||"", value:v, mod:statMod(v), range,
             rule: R.modifierRuleText||"", beyond: v>10 ? (R.beyondHumanLimits||null) : null,
             health: v>10 && id==="BOD" && hlRule ? hlRule : null };
  }

  // W4 — one catalog entry as the browser shows it, before it's added: the
  // same line Loadout would draw (a weapon's attack and damage for this
  // character, an armor piece's PROT, RES and Integrity), its price, and
  // whether Buy can go ahead and, if not, why. Null for an unknown id.
  // The currency sign is the data's (Decision 135), like every other number here.
  const creditSymbol = () => (((D().resources||{}).credits||{}).symbol) || "";
  function catalogLine(ch, kind, id){
    const def = loadoutDef(kind, id);
    if (!def || !ch || typeof ch!=="object") return null;
    const line = kind==="armor" ? armorPiece({ id }, null) : kind==="gear" ? gearDefLine(def) : weaponDefLine(ch, def);
    const price = priceOf(def), have = Number(ch && ch.trackers && ch.trackers.credits && ch.trackers.credits.current)||0;
    const cr = creditSymbol();
    const buy = price==null ? { ok:false, why:"No street price. Add it, then log what it cost under Çredits." }
              : price>have ? { ok:false, why:`Costs ${price.toLocaleString("en-US")}${cr}. You have ${have.toLocaleString("en-US")}${cr}.` }
              : { ok:true };
    return Object.assign(line, { kind, price, availability: def.availability||null,
      flavorLine: def.flavorLine||null, buy });
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
      if (price>have) return { ok:false, why:`${def.name} costs ${price}${creditSymbol()}. You have ${have}${creditSymbol()}.` };
    }
    if (kind==="gear"){
      const r = addGearEntry(ch, def);
      if (buy) addCredits(ch, -price, `Bought ${def.name}`);
      return Object.assign(r, { name:def.name, paid: buy ? price : 0 });
    }
    const list = ch[kind];
    if (kind==="armor"){
      const e = { id, integrityLoss:0, notes:"", worn:false, scrapped:false, upgrades:[] };
      // The first piece in a slot goes on. Nobody buys a vest to leave it home.
      const slot = def.slot || "body";
      if (!list.some((o,i)=>o && typeof o==="object" && o.worn===true && armorPiece(o,i).slot===slot)) e.worn = true;
      list.push(e);
    } else list.push({ id, notes:"", mods:[], roundsSpent:0 });
    if (buy) addCredits(ch, -price, `Bought ${def.name}`);
    return { ok:true, index:list.length-1, name:def.name, paid: buy ? price : 0 };
  }
  // ── Equipment (W17 + W27, Decision 121) ──
  // A gear row is a catalog reference ({ id, qty, notes }, plus chargesUsed
  // for a charged Talisman) or the player's own typed row (custom:true), the
  // same split weapons have. A stackable entry (anything without charges)
  // adds to the row you already have; a charged Talisman is its own row,
  // since each one keeps its own charges.
  const gearCategoryName = id => ((D().equipmentCategories||[]).find(c=>c.id===id)||{ name:String(id||"") }).name;
  function gearDefLine(def){
    const sp = def.spell ? spellById(def.spell) : null;
    return { id:def.id, name:def.name, category:def.category||null, categoryName:gearCategoryName(def.category),
             consumable:!!def.consumable, pack: Math.max(1, nonNegInt(def.pack)||1), unit:def.unit||null,
             chargesMax: nonNegInt(def.charges)||null, material:def.material||null,
             spell: sp ? { id:sp.id, name:sp.name, tn:sp.tn, th:sp.th, effect:sp.effect||"" } : null,
             spellName: def.spellName||null, action:def.action||null, itemNotes:def.notes||null, costText:def.costText||null,
             startsEmpty: !!def.startsEmpty, tags: def.tags||[] };
  }
  function gearLine(ch, index){
    const e = listOf(ch, "gear")[index];
    if (!e || typeof e!=="object") return null;
    const notes = typeof e.notes==="string" ? e.notes : "";
    if (e.custom || !e.id) return { index, custom:true, name:String(e.name||""), type:String(e.type||""), notes };
    const def = equipmentById(e.id);
    if (!def) return { index, missing:true, name:String(e.id), notes, qty: nonNegInt(e.qty) };
    const l = Object.assign({ index, notes, qty: nonNegInt(e.qty) }, gearDefLine(def), { flavorLine: def.flavorLine||null });
    if (l.chargesMax){ const used = Math.min(l.chargesMax, nonNegInt(e.chargesUsed));
      l.charges = { max:l.chargesMax, used, left:l.chargesMax-used }; }
    return l;
  }
  function addGearEntry(ch, def){
    const list = ch.gear, pack = Math.max(1, nonNegInt(def.pack)||1), charges = nonNegInt(def.charges);
    if (!charges){
      const at = list.findIndex(o=>o && typeof o==="object" && !o.custom && o.id===def.id);
      if (at>=0){ list[at].qty = nonNegInt(list[at].qty) + pack; return { ok:true, index:at, stacked:true, added:pack }; }
      list.push({ id:def.id, qty:pack, notes:"" });
    } else list.push({ id:def.id, qty:1, notes:"", chargesUsed: def.startsEmpty ? charges : 0 });
    return { ok:true, index:list.length-1, added:pack };
  }
  // The first row of an id you still have some of, for a panel that can use
  // one you carry (a Nanomed Kit, a dose of Speed Heal, a Field Repair Kit).
  function carriedGear(ch, id){
    const list = listOf(ch, "gear");
    const index = list.findIndex(o=>o && typeof o==="object" && !o.custom && o.id===id && nonNegInt(o.qty)>0);
    return index<0 ? null : { index, qty: nonNegInt(list[index].qty) };
  }
  // Use one (n) of a consumable, or put some back (negative n). A count that
  // reaches zero takes the row off, as crossing it off the sheet would.
  function useGear(ch, index, n){
    const l = gearLine(ch, index);
    if (!l || l.custom || l.missing) return { ok:false, why:"That isn't a catalog item on the sheet." };
    const k = n==null ? 1 : Math.trunc(Number(n));
    if (!k) return { ok:false, why:"Say how many." };
    if (k>0 && !l.consumable) return { ok:false, why:`${l.name} isn't used up.` };
    if (k>l.qty) return { ok:false, why:`You have ${l.qty}.` };
    const left = l.qty - k;
    if (left<=0) ch.gear.splice(index, 1); else ch.gear[index].qty = left;
    return { ok:true, name:l.name, used:k, left: Math.max(0, left), removed: left<=0 };
  }
  // A charged Talisman: spend a charge, or recharge it full (by TOL or a
  // paid service; the sheet records that it's full, the player the price).
  function useCharge(ch, index){
    const l = gearLine(ch, index);
    if (!l || !l.charges) return { ok:false, why:"That doesn't hold charges." };
    if (!l.charges.left) return { ok:false, why:`${l.name} is spent. Recharge it first.` };
    ch.gear[index].chargesUsed = l.charges.used + 1;
    return { ok:true, name:l.name, left: l.charges.left - 1, max:l.charges.max };
  }
  function rechargeGear(ch, index){
    const l = gearLine(ch, index);
    if (!l || !l.charges) return { ok:false, why:"That doesn't hold charges." };
    if (!l.charges.used) return { ok:false, why:"It's already full." };
    ch.gear[index].chargesUsed = 0;
    return { ok:true, name:l.name, restored:l.charges.used, max:l.charges.max };
  }

  // A custom piece is typed by the player. Armor's `coverage` is optional and
  // reads as light (torso) when absent, so a file without it is still valid.
  function addCustomLoadout(ch, kind){
    if (kind==="armor") ch.armor.push({ custom:true, name:"", prot:"", res:0, integrity:0, coverage:"light",
                                        integrityLoss:0, notes:"", worn:false, scrapped:false, upgrades:[] });
    else if (kind==="weapons") ch.weapons.push({ custom:true, name:"", type:"", damage:"", rof:"", capacity:"", ammo:"", features:"", notes:"", roundsSpent:0 });
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
    // A `retired` upgrade still works where it's installed; it just isn't offered (Decision 143).
    const options = (D().armorUpgradeGlossary||[]).filter(g=>!g.retired).map(g=>{
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

  // The after-fight wear roll (0530): the die is the GM's call by difficulty,
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
  // armorer (all of it). Scrap can't be repaired (0530).
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

  // Natural Healing (0550): BOD per day of real rest. The engine proposes the
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
  // A Nanomed Kit (Decision 105, 0540's list): dose n inside a day regenerates
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
  // (0540 asks Shock of "a single hit"), but At Zero and Dying do. `input`:
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

  // Focused Skills (Decision 134). Whatever specialization the character chose
  // may carry `focusedSkills: { ids, choose: { count, category }, all: {
  // throughRank } }`; nothing here asks which archetype that is. The first
  // chosen option that carries one is the one read.
  function focusedSkillSpec(ch){
    for (const o of specializationChosen(ch)){
      const f = o.focusedSkills;
      if (f && typeof f==="object" && !Array.isArray(f))
        return { ids: Array.isArray(f.ids) ? f.ids : [], choose: f.choose || null, all: f.all || null, source: o };
    }
    return null;
  }
  // The creation pick: which skills may be chosen (the category, less the ones
  // the specialization already names), how many, and which stored picks count.
  function focusedPicks(ch){
    const f = focusedSkillSpec(ch);
    if (!f || !f.choose) return null;
    const need = Math.max(0, Number(f.choose.count)||0);
    const options = D().skills.filter(s=>s.category===f.choose.category && !f.ids.includes(s.id)).map(s=>s.id);
    const stored = Array.isArray((ch.archetypeChoices||{}).focusedSkillPicks) ? ch.archetypeChoices.focusedSkillPicks : [];
    const picks = stored.filter((id,i)=>options.includes(id) && stored.indexOf(id)===i);
    const invalid = stored.filter(id=>!options.includes(id));
    return { need, have: picks.length, picks, invalid, options, category: f.choose.category,
             complete: picks.length===need && !invalid.length };
  }
  // Choose or unchoose one pick. The engine owns eligibility and the count, so
  // the wizard and the sheet refuse the same things for the same reason.
  function toggleFocusedPick(ch, skillId){
    const p = focusedPicks(ch);
    if (!p) return { ok:false, why:"Nothing to choose here." };
    const list = ch.archetypeChoices.focusedSkillPicks;
    const i = list.indexOf(skillId);
    if (i>=0){ list.splice(i,1); return { ok:true }; }
    if (!p.options.includes(skillId)) return { ok:false, why:"That skill can't be one of these picks." };
    if (p.have >= p.need) return { ok:false, why:`You've chosen ${p.need}. Unchoose one first.` };
    list.push(skillId);
    return { ok:true };
  }
  // The skills that are Focused by name: the specialization's own plus valid
  // picks. An `all` rule (Jack of All Trades) is a price, not a list, and is
  // read by focusedPrice() alone: it raises no starting cap (0412, F33 closed).
  function focusedSkillIds(ch){
    const f = focusedSkillSpec(ch);
    if (!f) return [];
    const p = focusedPicks(ch);
    return [...new Set([...f.ids, ...(p ? p.picks : [])])];
  }
  // "combat" → "Combat", for the copy that names a pick's category.
  const focusedCategoryName = c => c ? String(c).charAt(0).toUpperCase() + String(c).slice(1) : "";
  // The archetype's free-ranks pool (the Professional's Natural Advantages):
  // the baseline trait that carries a `pool`, sized by the scaling row's
  // naturalAdvantageRanks.
  const naturalAdvantagePool = a => ((a||{}).baselineTraits||[]).find(t=>Array.isArray(t.pool)) || null;
  // Does raising this skill to `toRank` pay the Focused price?
  function focusedPrice(ch, skillId, toRank){
    if (focusedSkillIds(ch).includes(skillId)) return true;
    const f = focusedSkillSpec(ch);
    return !!(f && f.all && toRank <= (Number(f.all.throughRank)||0));
  }
  // The most a skill can start at. 0420: the Power Level's Max Skill Rank caps
  // starting rank only, so this is a creation rule; play is capped by
  // ip.rankCap. A Focused Skill adds the scaling row's focusedSkillMaxBonus.
  function skillRankCap(ch, skillId){
    const pl = powerLevel(ch);
    if (!pl) return null;
    const row = scalingRow(ch);
    const bonus = row && focusedSkillIds(ch).includes(skillId) ? (Number(row.focusedSkillMaxBonus)||0) : 0;
    return pl.maxSkillRank + bonus;
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
      return {ok:true, cost: cur * D().ip.statIncreaseCost.perPoint, from:cur, to:cur+1};
    }
    // Decision 108: Mastering a Known book spell, 30 IP × its printed TH.
    if (targetType==="spell"){
      const line = grimoire(ch).lines.find(l=>l.id===targetId);
      if (!line) return {ok:false, why:"That spell isn't in the Grimoire."};
      if (line.mastered) return {ok:false, why:`${line.name} is already Mastered.`};
      if (line.masteryCost==null) return {ok:false, why:`${line.name} has no Threshold to master.`};
      return {ok:true, cost: line.masteryCost, from:"known", to:"mastered", index: line.index};
    }
    // Decision 194 (0450): a power or Discipline costs its current rank × 20,
    // and rank 1 in one never trained is a new power's flat price. The cap is
    // IPE's, as for skills.
    if (targetType==="power"){
      const p = powerRanks(ch).find(x=>x.id===targetId);
      if (!p) return {ok:false, why:"That power isn't on this sheet."};
      if (p.ranked===false) return {ok:false, why:`${p.name} has no ranks.`};
      if (p.rank >= D().ip.rankCap) return {ok:false, why:`Rank cap ${D().ip.rankCap}.`};
      const price = D().ip.powerIncreaseCost;
      return {ok:true, cost: p.rank===0 ? price.newPower : price.perRank * p.rank, from:p.rank, to:p.rank+1, name:p.name};
    }
    const line = skillLine(ch, targetId);
    const cur = line.rank;
    if (cur >= D().ip.rankCap) return {ok:false, why:`Rank cap ${D().ip.rankCap}.`};
    const price = D().ip.skillIncreaseCost;
    const focused = focusedPrice(ch, targetId, cur+1);
    // Decision 97: "5 × current rank" would price rank 0→1 at zero; a new skill
    // after creation is a flat price from the data instead.
    const cost = cur===0 ? price.newSkill : (focused ? price.focusedPerRank : price.perRank) * cur;
    return {ok:true, cost, from:cur, to:cur+1, focused};
  }
  function spendIP(ch, targetType, targetId, note){
    const c = ipCost(ch, targetType, targetId);
    if (!c.ok) return c;
    if (ipState(ch).available < c.cost) return {ok:false, why:`Not enough IP (need ${c.cost}).`};
    if (targetType==="stat") ch.stats[targetId].ipe += 1;
    else if (targetType==="spell") grimoireRows(ch)[c.index].stage = "mastered";
    else if (targetType==="power"){
      const ipe = powerIpeOf(ch, targetId) + 1, pr = ch.progression;
      if (!isPlainObj(pr.powerIpe)) pr.powerIpe = {};
      pr.powerIpe[targetId] = ipe;
    }
    else { if (!ch.skills[targetId]) ch.skills[targetId]={rank:0, ipe:0}; ch.skills[targetId].ipe += 1; }
    // A power's entry carries its name, as a written power's Add and Improve do.
    ch.progression.ip.log.push(Object.assign({ date:new Date().toISOString(), kind:"spend", amount:c.cost,
      targetType, targetId, from:c.from, to:c.to, note:note||"" }, targetType==="power" ? { name:c.name } : {}));
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
  function milestoneState(ch){
    // B9: the cadence used to be stated twice -- as prose in the data ("5, 15,
    // 25...") and as arithmetic here -- with nothing connecting them, and
    // milestonePointsPerSession was inert. Both now come from the data, and
    // so does every "5, 15, 25…" a player reads (Decision 135).
    const r = D().milestones.rules;
    const per = r.milestonePointsPerSession==null ? 1 : r.milestonePointsPerSession;
    const sessionMP = (ch.sessions||[]).filter(s=>s.milestonePoint!==false).length * per;
    const mp = sessionMP + ((ch.progression||{}).milestonePoints||0);
    const avail = (first, every) => (every>0 && mp>=first) ? Math.floor((mp-first)/every)+1 : 0;
    // The next Milestone Point total that unlocks one more, or null if none will.
    const next = (first, every) => mp<first ? first : every>0 ? first + avail(first, every)*every : null;
    const cadence = (first, every) => every>0 ? `${first}, ${first+every}, ${first+2*every}…` : `${first}`;
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
             majorLeft: majorAvail - majorTaken.length,
             nextMinorAt: next(r.minorFirstAt, r.minorEvery), nextMajorAt: next(r.majorFirstAt, r.majorEvery),
             minorCadence: cadence(r.minorFirstAt, r.minorEvery), majorCadence: cadence(r.majorFirstAt, r.majorEvery) };
  }
  const noneUnlocked = (tier, at) => `No ${tier} Milestone unlocked${at==null ? "" : ` (next at ${at} MP)`}.`;
  function canTakeMinor(ch, id){
    const st = milestoneState(ch);
    if (st.minorLeft<=0) return {ok:false, why:noneUnlocked("Minor", st.nextMinorAt)};
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
      const names = p.milestones.map(id=>(majorById(ch, id)||{name:id}).name);
      (ok?met:unmet).push("Milestone: "+names.join(", "));
    }
    // Decision 199: `specialization` names the Origins (any of) that may take it.
    if (Array.isArray(p.specialization) && p.specialization.length){
      const mine = specializationIds(ch), opts = ((archetype(ch)||{}).specialization||{}).options || [];
      const name = id => txt((opts.find(o=>o.id===id)||{}).name) || String(id);
      (p.specialization.some(id=>mine.includes(id)) ? met : unmet).push(p.specialization.map(name).join(" or "));
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
  // A Minor's IP roll (Decision 213): the dice the player rolls and the flat
  // amount added to them. null when the Minor has none, or its spec is malformed.
  function ipRoll(id){
    const m = ((D().milestones||{}).minorShared||[]).find(x=>x && x.id===id);
    const r = m && m.ipRoll;
    if (!isPlainObj(r)) return null;
    const count = Number(r.count), sides = Number(r.sides), plus = Number(r.plus);
    if (!(Number.isInteger(count) && count>0 && Number.isInteger(sides) && sides>0 && Number.isInteger(plus) && plus>=0)) return null;
    return { count, sides, plus };
  }
  const ipRollTotal = (spec, dice) => nonNegInt(dice) + nonNegInt(spec && spec.plus);

  function takeMilestone(ch, tier, id){
    if (tier==="minor"){
      const c = canTakeMinor(ch, id); if (!c.ok) return c;
      ch.progression.milestones.minor.push({id, date:new Date().toISOString()});
    } else {
      const m = majorPool(ch).find(x=>x.id===id);
      if (!m) return {ok:false, why:"Unknown milestone."};
      const st = milestoneState(ch);
      if (st.majorLeft<=0) return {ok:false, why:noneUnlocked("Major", st.nextMajorAt)};
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
  // The player's local day, YYYY-MM-DD. Not toISOString(): that is UTC, and in the evening in the Americas it says tomorrow.
  function localDay(d=new Date()){
    const p = n => String(n).padStart(2,"0");
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  }
  function logSession(ch, s){
    ch.sessions.push({
      date: s.date || localDay(),
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

  // ── CRANK reputation (Decision 169) ──────────────────────────────────
  // rep is the input; tier, next tier and pay come from resources.crank.tiers
  // (read in data order, ascending by rep -- a test pins that).
  const crankData = () => (D().resources||{}).crank || {};
  function crankState(ch){
    const c = crankData(), tiers = Array.isArray(c.tiers) ? c.tiers : [];
    const cr = ch && ch.trackers && ch.trackers.crank;
    const rep = Number(cr && cr.rep) || 0;
    let i = -1;
    tiers.forEach((t, k) => { if (t.rep <= rep) i = k; });
    if (i < 0 && tiers.length) i = 0;          // below every tier reads the first (F37's stub)
    const tier = i >= 0 ? tiers[i] : null, next = tier && tiers[i+1] || null;
    return { rep, tier, next, toNext: next ? next.rep - rep : null, unsettled: rep < 0 };
  }
  function addCrankRep(ch, amount, note){
    amount = Math.trunc(Number(amount)||0);
    if (!amount) return {ok:false, why:"Enter an amount."};
    ch.trackers.crank.rep = (ch.trackers.crank.rep||0) + amount;
    ch.trackers.crank.ledger.push({date:new Date().toISOString(), amount, note:note||""});
    return {ok:true};
  }
  function crankPayText(tier){
    const p = tier && tier.pay;
    if (!p) return "";
    const n = v => Number(v).toLocaleString("en-US"), cr = creditSymbol();
    return p.max==null ? `${cr}${n(p.min)}+` : `${cr}${n(p.min)}–${n(p.max)}`;
  }

  // ── Cascade (Decision 106) ──
  // Lookups on the player's own dice (Decision 11): `cascadeTable` for 1d10 +
  // the Rupture's degree, then `aberrationTable` if that row calls for one.
  // `pick` is the Aberration the GM chose from the rolled category. Every
  // step it can't take yet comes back as `pending`, never a throw. The sheet
  // no longer calls it: the GM reads the tables (Decision 115). It stays as
  // the reader the CRB conformance tests pin the tables through.
  const rangeRow = (rows, n) => (rows||[]).find(r => r && n>=r.min && (r.max==null || n<=r.max)) || null;
  const aberrationById = id => (D().aberrations||[]).find(a=>a.id===id) || null;
  function cascade(ch, input){
    input = input || {};
    const T = D().cascadeTable || {}, rows = T.rows || [];
    const r = checkRoll(T.die || "1d10", input.roll, "Cascade die");
    if (!r.ok) return r;
    const degree = Math.floor(Number(input.degree));
    if (input.degree==null || input.degree==="" || !(degree>=1))
      return { ok:false, why:"Enter the Rupture's degree: its Duds minus its Hits." };
    const total = r.value + degree, row = rangeRow(rows, total);
    if (!row) return { ok:false, total, why: rows.length
      ? `The Cascade Table starts at ${rows[0].min}. Casting needs TOL above zero, so the Rupture that broke through was at least ${Math.max(1, rows[0].min-1)}.`
      : "There's no Cascade Table to read." };
    const out = { ok:true, roll:r.value, degree, total, result:{ id:row.id, name:row.name, effect:row.effect||"" }, aberration:null };
    if (!row.aberration) return out;
    const A = D().aberrationTable || {};
    const ab = out.aberration = { permanence: row.aberration, pending: true, category: null, options: [], pick: null };
    if (input.aberrationRoll==null || input.aberrationRoll==="") return out;
    const ar = checkRoll(A.die || "1d10", input.aberrationRoll, "Aberration die");
    if (!ar.ok) return Object.assign(out, { ok:false, why: ar.why });
    const catId = (rangeRow(A.rows, ar.value)||{})[row.aberration];
    const cat = (D().aberrationCategories||[]).find(c=>c.id===catId) || (catId ? { id:catId, name:catId } : null);
    ab.roll = ar.value; ab.pending = false; ab.category = cat;
    ab.options = (D().aberrations||[]).filter(a=>cat && a.category===cat.id);
    const pick = input.pick ? aberrationById(input.pick) : null;
    if (pick && ab.options.includes(pick)) ab.pick = pick;
    return out;
  }
  // ── Aberrations the character has (magic plan M7/M8, Decision 110) ──
  // `trackers.aberrations` stores { id, permanence, note? } and nothing else
  // (constraint 7). What an entry does is read from the catalog every time:
  // `painLevels` adds to Pain like Agonized, `adjust` moves a derived stat
  // (Drained, max TOL -2). One per id, like a Condition (Ken, 2026-09-23).
  function aberrationState(ch){
    const raw = (((ch||{}).trackers||{}).aberrations), list = Array.isArray(raw) ? raw : [];
    const active = [], adjust = {};
    let painLevels = 0;
    list.forEach((e, index)=>{
      if (!e || typeof e!=="object") return;
      const def = aberrationById(e.id);
      const cat = def && (D().aberrationCategories||[]).find(c=>c.id===def.category);
      active.push({ index, id:e.id, def, name: def ? def.name : String(e.id),
                    permanence: e.permanence==="permanent" ? "permanent" : "temporary",
                    category: cat ? cat.name : (def ? def.category : null),
                    note: typeof e.note==="string" ? e.note : "", missing: !def });
      if (!def) return;                 // versionCheck reports the orphan
      if (typeof def.painLevels==="number") painLevels += def.painLevels;
      for (const [k, v] of Object.entries(def.adjust||{})) if (typeof v==="number") adjust[k] = (adjust[k]||0) + v;
    });
    return { active, permanent: active.filter(a=>a.permanence==="permanent"),
             temporary: active.filter(a=>a.permanence==="temporary"), painLevels, adjust };
  }
  // Current TOL doesn't move when an Aberration changes max TOL (MQ2,
  // Decision 109). The sheet stores TOL *Spent* (current = max - spent), so
  // every tracker counting against TOL shifts by the change in max, floored
  // at 0: current never rises above the new max, and a rise is rested back.
  function keepCurrentTOL(ch, before){
    const delta = derived(ch).TOL - before;
    if (!delta) return;
    const t = ch.trackers, panel = t.panel && typeof t.panel==="object" ? t.panel : (t.panel = {});
    for (const p of archPanels(ch)) if (p && p.type==="tracker" && p.max==="TOL"){
      const e = panel[p.id] && typeof panel[p.id]==="object" ? panel[p.id] : (panel[p.id] = { value:0 });
      e.value = Math.max(0, nonNegInt(e.value) + delta);
    }
  }
  const aberrationList = ch => Array.isArray(ch.trackers.aberrations) ? ch.trackers.aberrations : (ch.trackers.aberrations = []);
  function recordAberration(ch, entry){
    const def = aberrationById(entry && entry.id);
    if (!def) return { ok:false, why:"Choose an Aberration." };
    const list = aberrationList(ch);
    if (list.some(x=>x && x.id===def.id)) return { ok:false, why:`Already ${def.name}. An Aberration doesn't stack with itself.` };
    const before = derived(ch).TOL;
    const e = { id:def.id, permanence: entry.permanence==="permanent" ? "permanent" : "temporary" };
    if (entry.note) e.note = String(entry.note);
    list.push(e);
    keepCurrentTOL(ch, before);
    return { ok:true, name:def.name };
  }
  function removeAberration(ch, index){
    const list = aberrationList(ch);
    if (!(index>=0 && index<list.length)) return { ok:false, why:"No such Aberration." };
    const before = derived(ch).TOL;
    list.splice(index, 1);
    keepCurrentTOL(ch, before);
    return { ok:true };
  }
  // ── Grimoire (Decision 108) ──
  // A row is a book spell ({ spellId, stage, notes }, everything else read
  // from `spells` every time, constraint 7) or the player's own (the panel's
  // typed columns, custom:true). The panel names its catalog in the data.
  const spellById = id => (D().spells||[]).find(s=>s && s.id===id) || null;
  const spellKey = s => String(s==null ? "" : s).toLowerCase().replace(/[^a-z0-9]/g, "");
  function grimoirePanelIds(){
    const ids = new Set();
    for (const a of D().archetypes||[])
      for (const p of ((a && a.coreMechanic && a.coreMechanic.panels) || [])) if (p && p.type==="grimoire") ids.add(p.id);
    return [...ids];
  }
  const grimoirePanel = ch => archPanels(ch).find(p=>p && p.type==="grimoire") || null;
  // Writers only: it creates the row list if it's missing. grimoire() reads without it.
  function grimoireRows(ch){
    const p = grimoirePanel(ch);
    if (!p) return null;
    const pd = ch.panelData && typeof ch.panelData==="object" ? ch.panelData : (ch.panelData = {});
    if (!Array.isArray(pd[p.id])) pd[p.id] = [];
    return pd[p.id];
  }
  function spellPower(ch){
    const R = (D().spellcraftRules||{}).spellPower;
    if (!R) return null;
    const d = disciplineRanks(ch).find(x=>x.id===R.discipline);
    const stat = derived(ch)[R.stat];
    if (!d || typeof stat!=="number") return null;
    return { value: d.rank + stat, rank: d.rank, discipline: d.name, stat: R.stat, statValue: stat, text: R.text||"" };
  }
  // W32: what an entry's Spell Power amounts come to for this character. The
  // entry's `sp` names the text it sits beside (`effect`, `defending`,
  // `description`, or an `overflow` tier) and how much Spell Power it is:
  // `times` an amount, `adds` an increase. Halves round up (Ken). Null with no
  // Spell Power, and the book's words show alone. `power` saves a caller that
  // reads many entries from working Spell Power out again for each.
  function spAmounts(ch, entry, power){
    const sp = power===undefined ? spellPower(ch) : power, f = entry && entry.sp;
    if (!sp || typeof sp.value!=="number" || !f || typeof f!=="object") return null;
    const one = x => {
      if (!x || typeof x!=="object") return null;
      const adds = typeof x.adds==="number", n = adds ? x.adds : x.times;
      return typeof n==="number" && n>0 && isFinite(n) ? { value: Math.ceil(sp.value*n), times:n, adds, spellPower: sp.value } : null;
    };
    const out = { overflow:{} };
    for (const k of Object.keys(f)) if (k!=="overflow"){ const a = one(f[k]); if (a) out[k] = a; }
    if (f.overflow && typeof f.overflow==="object")
      for (const k of Object.keys(f.overflow)){ const a = one(f.overflow[k]); if (a) out.overflow[k] = a; }
    return out;
  }
  // Spell Attack = Evocation rank + the REF and WILL scores themselves, not
  // their bonuses (Deighton, Decision 109). A Basic Stat reads its score, a
  // derived one (WILL) its value.
  function spellAttack(ch){
    const R = (D().spellcraftRules||{}).spellAttack;
    if (!R || !Array.isArray(R.stats)) return null;
    const d = disciplineRanks(ch).find(x=>x.id===R.discipline);
    if (!d) return null;
    const dv = derived(ch), basic = new Set(D().stats.map(s=>s.id));
    const parts = R.stats.map(id=>({ stat:id, value: basic.has(id) ? statValue(ch, id) : dv[id] }));
    if (parts.some(p=>typeof p.value!=="number" || !isFinite(p.value))) return null;
    return { value: d.rank + parts.reduce((s,p)=>s+p.value, 0), rank: d.rank, discipline: d.name, parts, text: R.text||"" };
  }
  // The forms a spell takes (Decision 136). Magic's Three Forms: any spell can
  // be an Evocation, a Talisman or an Artifact, so the default list is the
  // data's `forms.disciplines`; a spell naming its own `disciplines` exists
  // only in those. `th` stays the tier's own, what a live cast rolls against;
  // any other form's TH and time are the Enchantment table's row for the tier.
  function spellForms(s){
    const all = ((D().spellcraftRules||{}).forms||{}).disciplines || [];
    const own = s && Array.isArray(s.disciplines) ? s.disciplines.filter(d=>all.includes(d)) : [];
    return own.length ? own : all.slice();
  }
  const liveDiscipline = () => ((D().spellcraftRules||{}).castingPool||{}).discipline || null;
  function spellForm(ch, s, discipline){
    const id = discipline || spellForms(s)[0] || null;
    const named = disciplineRanks(ch).find(d=>d.id===id)
      || (((D().archetypes||[]).map(a=>a && a.coreMechanic && a.coreMechanic.disciplines).find(x=>x && Array.isArray(x.list))||{}).list||[]).find(d=>d && d.id===id);
    const row = (D().enchantmentTimeTable||[]).find(r=>r && r.tier===(s||{}).tier) || {};
    const live = id===liveDiscipline();
    const th = live ? (s||{}).th : ((row.th||{})[id]);
    return { discipline:id, name: named ? named.name : String(id||""), live, only: spellForms(s).length===1,
             th: typeof th==="number" ? th : null, time: live ? null : ((row.minTime||{})[id] || null) };
  }
  function spellMasteryCost(s, th){
    const M = (D().spellcraftRules||{}).mastery || {};
    const t = th===undefined ? s && s.th : th;
    return typeof t==="number" && t>=1 && M.ipPerTH ? M.ipPerTH * t : null;
  }
  // The dice a live cast rolls: the named Discipline's rank (0480_Magic.md, Step 2).
  // A TH above it can still be cast, but only an exploding 10 reaches it
  // (Ken, Decision 111). Concentration's held dice are the table's to count.
  function castingPool(ch){
    const R = (D().spellcraftRules||{}).castingPool;
    if (!R) return null;
    const d = disciplineRanks(ch).find(x=>x.id===R.discipline);
    return d ? { rank: d.rank, discipline: d.name, text: R.beyond||"" } : null;
  }
  function grimoire(ch){
    const p = grimoirePanel(ch);
    if (!p) return { panel:null, lines:[], spellPower:null, spellAttack:null, pool:null };
    const pool = castingPool(ch), power = spellPower(ch);
    const pd = ch.panelData && typeof ch.panelData==="object" ? ch.panelData : {};
    const rows = Array.isArray(pd[p.id]) ? pd[p.id] : [], M = (D().spellcraftRules||{}).mastery || {};
    const held = new Set(rows.filter(r=>r && typeof r.spellId==="string").map(r=>r.spellId));
    const nameCol = (p.columns||[])[0];
    const tiers = D().spellTiers||[], domains = D().domains||[];
    const lines = rows.map((r, index)=>{
      if (!r || typeof r!=="object") return { index, custom:true, row:{} };
      if (typeof r.spellId!=="string"){
        // "Link to the book": a typed name that is a book spell not already held.
        const k = spellKey(nameCol ? r[nameCol] : "");
        const m = k ? (D().spells||[]).find(s=>s && spellKey(s.name)===k && !held.has(s.id)) : null;
        return { index, custom:true, row:r, match: m ? { id:m.id, name:m.name } : null };
      }
      const s = spellById(r.spellId), notes = typeof r.notes==="string" ? r.notes : "";
      if (!s) return { index, missing:true, spellId:r.spellId, notes };
      const mastered = r.stage==="mastered", form = spellForm(ch, s);
      const th = typeof form.th!=="number" ? null : mastered ? Math.max(0, form.th - (M.thReduction||0)) : form.th;
      return { index, id:s.id, name:s.name, notes, mastered, th, printedTH:form.th, noRoll: th===0, form,
               beyondPool: form.live && !!pool && th!=null && th > pool.rank,
               tier: (tiers.find(t=>t.id===s.tier)||{name:s.tier}).name, tierId:s.tier,
               domain: (domains.find(d=>d.id===s.domain)||{name:s.domain}).name, domainId:s.domain,
               glyph:s.glyph, tn:s.tn, range:s.range, spellType:s.spellType, damageType:s.damageType,
               target:s.target, effect:s.effect, duration:s.duration||null, defending:s.defending, overflow:s.overflow||null,
               tags:s.tags||[], flavorLine:s.flavorLine||"", spellNotes:s.notes||"", sp: spAmounts(ch, s, power),
               masteryCost: mastered ? null : spellMasteryCost(s, form.th) };
    });
    return { panel:p, lines, held:[...held], spellPower: power, spellAttack: spellAttack(ch), pool, masteryText: M.text||"" };
  }
  function addSpell(ch, spellId){
    const rows = grimoireRows(ch), s = spellById(spellId);
    if (!rows) return { ok:false, why:"This archetype keeps no Grimoire." };
    if (!s) return { ok:false, why:"That spell isn't in the book." };
    if (rows.some(r=>r && r.spellId===s.id)) return { ok:false, why:`${s.name} is already in the Grimoire.` };
    rows.push({ spellId:s.id, stage:"known", notes:"" });
    return { ok:true, name:s.name };
  }
  // Swap a typed row for the book spell its name matches, keeping its notes.
  function linkSpell(ch, index){
    const g = grimoire(ch), line = g.lines[index];
    if (!line || !line.custom || !line.match) return { ok:false, why:"That row doesn't match a book spell." };
    const notesCol = (g.panel.columns||[]).find(c=>/^notes$/i.test(c));
    const rows = grimoireRows(ch);
    rows[index] = { spellId: line.match.id, stage:"known", notes: notesCol ? String(line.row[notesCol]||"") : "" };
    return { ok:true, name: line.match.name };
  }
  function removeGrimoireRow(ch, index){
    const rows = grimoireRows(ch);
    if (!rows || !(index>=0 && index<rows.length)) return { ok:false, why:"No such row." };
    rows.splice(index, 1);
    return { ok:true };
  }

  // ── Starting spells (Decision 111) ──
  // How many: TOL + the power level's roll, which the player enters (Decision
  // 11). Which: at creation a spell's TH can't pass the named Discipline's
  // rank, counting ranks bought at creation (Deighton, Decision 109). After
  // lock nothing gates it, like a skill past the creation cap. The picks are
  // the Grimoire's own book rows, so there's no second store.
  function startingSpells(ch){
    const R = (D().spellcraftRules||{}).startingSpells, row = scalingRow(ch);
    if (!R || !grimoirePanel(ch) || !row || !row.startingSpellsRoll) return null;
    const raw = (((ch||{}).archetypeChoices||{}).rolls||{}).startingSpells;
    const roll = typeof raw==="number" && isFinite(raw) && raw>=0 ? raw : null;
    const base = derived(ch)[R.countFrom || "TOL"];
    const d = disciplineRanks(ch).find(x=>x.id===R.discipline);
    const cap = d ? d.rank : 0;
    const book = grimoire(ch).lines.filter(l=>!l.custom && !l.missing);
    // A starting spell is one you cast with the named Discipline (Decision 136).
    const castable = l => spellForms(spellById(l.id)).includes(R.discipline);
    return { rollDie: row.startingSpellsRoll, roll, base, countFrom: R.countFrom || "TOL",
             count: roll==null || typeof base!=="number" ? null : base + roll,
             have: book.length, picked: book.map(l=>l.id), cap, discipline: d ? d.name : R.discipline,
             over: book.filter(l=>castable(l) && typeof l.printedTH==="number" && l.printedTH > cap).map(l=>({ id:l.id, name:l.name, th:l.printedTH })),
             notCast: book.filter(l=>!castable(l)).map(l=>({ id:l.id, name:l.name, form:l.form.name })),
             disciplineId: R.discipline, text: R.text||"" };
  }
  function canAddStartingSpell(ch, spellId){
    const st = startingSpells(ch), s = spellById(spellId);
    if (!st) return { ok:false, why:"This archetype keeps no Grimoire." };
    if (!s) return { ok:false, why:"That spell isn't in the book." };
    if (st.picked.includes(s.id)) return { ok:false, why:`${s.name} is already chosen.` };
    if (!spellForms(s).includes(st.disciplineId))
      return { ok:false, why:`${s.name} is made with ${spellForm(ch, s).name}, never cast. Learn it after creation.` };
    if (typeof s.th==="number" && s.th > st.cap)
      return { ok:false, needs:s.th, why:`${s.name} needs ${st.discipline} ${s.th}.` };
    if (st.count!=null && st.have >= st.count) return { ok:false, full:true, why:`That's all ${st.count} starting spells.` };
    return { ok:true };
  }
  function addStartingSpell(ch, spellId){
    const c = canAddStartingSpell(ch, spellId);
    return c.ok ? addSpell(ch, spellId) : c;
  }

  // ── Archetype sheet panels (declared in data; rendered generically) ──
  // A panel with `when` shows only while its write-in mechanic is ticked
  // (Decision 153): "Uses magic" turns on TOL Spent, and nothing names an id.
  // A panel with `origin` is that specialization's alone (a Draugur's Code).
  const archPanels = ch => {
    const a = archetype(ch);
    const on = mechanicsOn(ch), origins = specializationIds(ch);
    return ((a && a.coreMechanic && a.coreMechanic.panels) || []).filter(p=>p && (!p.when || on.includes(p.when)) && (!p.origin || origins.includes(p.origin)));
  };
  function panelMax(ch, p){
    if (p.max==="TOL") return derived(ch).TOL;
    if (p.max==="startingSFR"){ const s=sfr(ch); return s && s.value!=null ? s.value : null; }
    return typeof p.max==="number" ? p.max : null;
  }
  // A tracker panel's count. It lives on the panel's own entry, or with
  // `resource` on that resource's tracker (SFR's spend is `trackers.sfr`, which
  // Main reads too). `counts: "down"` shows what's left of the max instead of
  // what's been counted (Decision 135): no panel id is special.
  // `create` is for the writer only: reading a count never adds to the file.
  const panelStore = (ch, p, create) => {
    const t = (ch && ch.trackers) || {};
    if (p.resource && t[p.resource] && typeof t[p.resource]==="object") return { obj:t[p.resource], key:"spent" };
    const panel = t.panel && typeof t.panel==="object" ? t.panel : null;
    if (panel && panel[p.id] && typeof panel[p.id]==="object") return { obj:panel[p.id], key:"value" };
    if (!create) return { obj:{}, key:"value" };
    if (!panel) t.panel = {};
    return { obj: (t.panel[p.id] = { value:0 }), key:"value" };
  };
  // A tracker with `stepsFrom` counts steps whose text the chosen
  // specialization holds under that key ({ need, steps }): Call of the Wild's
  // withdrawal, a column per Origin (Decision 196). It stops at its last step.
  const panelSteps = (ch, p) => {
    if (!p.stepsFrom) return null;
    const w = specializationChosen(ch).map(o=>o[p.stepsFrom]).find(isPlainObj);
    return w ? { need:txt(w.need), steps:(Array.isArray(w.steps) ? w.steps : []).map(txt) } : { need:"", steps:[] };
  };
  function panelTracker(ch, p){
    const max = panelMax(ch, p), s = panelStore(ch, p, false), count = Number(s.obj[s.key])||0;
    const down = p.counts==="down", st = panelSteps(ch, p);
    const out = { count, max, down, shown: down ? (max!=null ? Math.max(0, max-count) : null) : count };
    if (st) Object.assign(out, { need:st.need, step: count>0 ? (st.steps[Math.min(count, st.steps.length)-1] || "") : "" });
    return out;
  }
  function adjustPanelTracker(ch, panelId, delta){
    const p = archPanels(ch).find(x=>x.id===panelId && x.type==="tracker");
    if (!p) return { ok:false, why:"That tracker isn't on this sheet." };
    const s = panelStore(ch, p, true);
    let v = Math.max(0, (Number(s.obj[s.key])||0) + (Number(delta)||0));
    const max = panelMax(ch, p);
    if (p.stepsFrom && max!=null) v = Math.min(max, v);
    s.obj[s.key] = v;
    return { ok:true };
  }
  function disciplineRanks(ch){
    const spec = disciplineSpec(ch);
    if (!spec) return [];
    const cap = disciplineCap(ch);
    return (spec.list||[]).map(d=>{
      const base = d.startingRankBy ? (dataPath(ch, d.startingRankBy)||0) : 0;
      const bought = (ch.archetypeChoices.disciplines||{})[d.id]||0;
      const ipe = powerIpeOf(ch, d.id);
      // `cap` is the creation cap (Max Power Rank): it bounds base + bought,
      // never what IP buys afterwards (Ken, 2026-10-08).
      return { id:d.id, name:d.name, base, bought, ipe, start: base+bought, rank: base+bought+ipe, cap, description:d.description };
    });
  }
  // Ranks IP bought for one power (Decision 194). An undo can put anything a
  // file's audit holds back into the map, so the read normalizes.
  function powerIpeOf(ch, id){
    const m = (((ch||{}).progression)||{}).powerIpe;
    return isPlainObj(m) && Object.prototype.hasOwnProperty.call(m, id) ? nonNegInt(m[id]) : 0;
  }
  // The archetype's own powers the character holds (Decision 196): every
  // one of its pool (powerPool, below), at rank 1 + what IP bought. A
  // Werewolf "carries the whole kit"; what its Base Powers add is F38, so
  // nothing is bought at creation. An archetype with `powersBought` (a
  // Vampire, Decision 200) holds only the powers its Base Powers placed a
  // rank in, at those ranks + IP. A power with `ranked: false` is held or
  // not, at rank 1, and IP never raises it. `maxRank` is the book's printed
  // maximum, a creation cap: play stops at IPE's 10 (VQ14).
  function archetypePowers(ch){
    const a = archetype(ch);
    if (!a || writeInSpec(ch)) return [];
    const bought = isPlainObj(a.powersBought), placed = basePowersOf(ch);
    return powerPool(ch).filter(p=>!bought || (placed[p.id] > 0))
      .map(p=>{ const ranked = p.ranked!==false, ipe = ranked ? powerIpeOf(ch, p.id) : 0;
        const start = bought ? (ranked ? placed[p.id] : 1) : 1;
        return Object.assign({}, p, { rank:start+ipe, start, ipe, ranked, maxRank: Number(p.maxRank) || null }); });
  }
  // The archetype's powers this character could hold: every Innate one (no
  // `origin`), every one of its chosen specialization's, less any a `power`
  // choice of that specialization offers and the character didn't pick (an
  // Upyr's Built to Last, F41's stub).
  function powerPool(ch){
    const a = archetype(ch);
    if (!a || writeInSpec(ch)) return [];
    const origins = specializationIds(ch), barred = new Set();
    for (const c of optionChoiceDefs(ch)) if (c.type==="power"){
      const pick = optionPickOf(ch, c.id);
      for (const id of Array.isArray(c.options) ? c.options : []) if (id!==pick) barred.add(id);
    }
    return (Array.isArray(a.powers) ? a.powers : [])
      .filter(p=>isPlainObj(p) && typeof p.id==="string" && p.id && (!p.origin || origins.includes(p.origin)) && !barred.has(p.id));
  }
  // The ranks Base Powers placed, normalized: an undo can put anything a
  // file's audit holds back into the map.
  const basePowersOf = ch => {
    const m = (((ch||{}).archetypeChoices)||{}).basePowers, out = {};
    if (isPlainObj(m)) for (const k of Object.keys(m)){ const n = nonNegInt(m[k]); if (n > 0) out[k] = n; }
    return out;
  };
  // F39's stub (Decision 200): each Base Power is one rank in a power of the
  // pool, none above Max Starting Rank or the book's own maximum; a power
  // with no ranks takes one to hold. Null for an archetype that doesn't buy.
  function basePowerState(ch){
    const a = archetype(ch), spec = a && !writeInSpec(ch) && isPlainObj(a.powersBought) ? a.powersBought : null;
    if (!spec) return null;
    const count = spec.countBy ? dataPath(ch, spec.countBy) : null, cap = spec.maxRankBy ? dataPath(ch, spec.maxRankBy) : null;
    const placed = basePowersOf(ch), pool = powerPool(ch), ids = new Set(pool.map(p=>p.id));
    const rows = pool.map(p=>{
      const ranked = p.ranked!==false, printed = Number(p.maxRank) || null;
      const most = ranked ? Math.min(cap==null ? Infinity : cap, printed || Infinity) : 1;
      return { id:p.id, name:txt(p.name), origin:p.origin || null, ranked, placed: placed[p.id] || 0, cap: most===Infinity ? null : most };
    });
    const spent = Object.values(placed).reduce((s, n)=>s + n, 0);
    // Ranks placed in a power the character can't hold (another Bloodline's,
    // or the Built to Last power not chosen): validate names them.
    const stray = Object.keys(placed).filter(id=>!ids.has(id)).map(id=>{
      const p = (a.powers||[]).find(x=>x && x.id===id);
      return { id, name: p ? txt(p.name) : id, placed: placed[id] };
    });
    return { count, cap, spent, left: count==null ? null : count - spent, rows, stray };
  }
  // A Base Power placed or taken back, in the wizard. { ok } or { ok, why }.
  function placeBasePower(ch, id, delta){
    const st = basePowerState(ch);
    if (!st) return { ok:false, why:"This archetype doesn't spend Base Powers." };
    const row = st.rows.find(r=>r.id===id);
    const ac = ch.archetypeChoices;
    if (!isPlainObj(ac.basePowers)) ac.basePowers = {};
    const cur = nonNegInt(ac.basePowers[id]), next = cur + (delta < 0 ? -1 : 1);
    if (next < cur){ if (next > 0) ac.basePowers[id] = next; else delete ac.basePowers[id]; return { ok:true }; }
    if (!row) return { ok:false, why:"That power isn't one you can take." };
    if (row.cap!=null && next > row.cap) return { ok:false, why: row.ranked ? `${row.name} can start at rank ${row.cap} at most.` : `${row.name} has no ranks.` };
    if (st.left!=null && st.left < 1) return { ok:false, why:"No Base Powers left." };
    ac.basePowers[id] = next;
    return { ok:true };
  }

  // ── A specialization's creation choices (Decision 200) ──────────────
  // `choices` on a chosen specialization option ask for something at
  // creation: `power` (one of `options`, power ids, Built to Last), `weapon`
  // (one of `options`, weapon rows, the Ancient Weapon) or `text` (`fields`
  // the player writes, the Code). Stored in archetypeChoices.optionPicks.
  function optionChoiceDefs(ch){
    return specializationChosen(ch).flatMap(o=>(Array.isArray(o.choices) ? o.choices : [])
      .filter(c=>isPlainObj(c) && typeof c.id==="string").map(c=>Object.assign({}, c, { origin:o.id })));
  }
  const optionPickOf = (ch, id) => {
    const m = (((ch||{}).archetypeChoices)||{}).optionPicks;
    return isPlainObj(m) && Object.prototype.hasOwnProperty.call(m, id) ? m[id] : undefined;
  };
  // Each choice with what's chosen: `value` is an option's id (or null), or
  // for text, each field's words. `option` is the chosen option's row.
  function optionChoices(ch){
    return optionChoiceDefs(ch).map(c=>{
      const v = optionPickOf(ch, c.id), opts = Array.isArray(c.options) ? c.options : [];
      if (c.type==="text"){
        const w = isPlainObj(v) ? v : {};
        const fields = (Array.isArray(c.fields) ? c.fields : []).filter(isPlainObj).map(f=>({ id:txt(f.id), name:txt(f.name), prompt:txt(f.prompt), value:txt(w[f.id]) }));
        return Object.assign({}, c, { fields, done: fields.every(f=>f.value.trim()) });
      }
      const ids = opts.map(o=>typeof o==="string" ? o : (isPlainObj(o) ? o.id : null));
      const value = typeof v==="string" && ids.includes(v) ? v : null;
      const option = value==null ? null : (c.type==="power" ? ((archetype(ch)||{}).powers||[]).find(p=>p && p.id===value) || { id:value, name:value }
                                                              : opts.find(o=>isPlainObj(o) && o.id===value));
      return Object.assign({}, c, { value, option: option || null, done: value!=null });
    });
  }
  // Setting one. A text choice takes a field id and its words; any other an
  // option's id. Ranks placed in a power the pick now bars are taken back.
  function setOptionPick(ch, choiceId, value, fieldId){
    const c = optionChoiceDefs(ch).find(x=>x.id===choiceId);
    if (!c) return { ok:false, why:"That isn't a choice your character has." };
    const ac = ch.archetypeChoices;
    if (!isPlainObj(ac.optionPicks)) ac.optionPicks = {};
    if (c.type==="text"){
      if (!(Array.isArray(c.fields) ? c.fields : []).some(f=>f && f.id===fieldId)) return { ok:false, why:"That isn't one of its fields." };
      const w = isPlainObj(ac.optionPicks[c.id]) ? ac.optionPicks[c.id] : (ac.optionPicks[c.id] = {});
      w[fieldId] = txt(value);
      return { ok:true };
    }
    const ids = (Array.isArray(c.options) ? c.options : []).map(o=>typeof o==="string" ? o : (isPlainObj(o) ? o.id : null));
    if (!ids.includes(value)) return { ok:false, why:"That isn't one of its options." };
    ac.optionPicks[c.id] = value;
    if (c.type==="power" && isPlainObj(ac.basePowers)) for (const id of ids) if (id!==value) delete ac.basePowers[id];
    return { ok:true };
  }

  // ── Weapons an archetype gives (Decision 200) ───────────────────────
  // `naturalWeapons` on the archetype: one a trait gives (Fangs of the
  // Fallen's bite), one a held power gives (`power`, plus `perRank` damage
  // for each rank past the first), and one a creation choice names
  // (`choice`: its option row is the weapon). `offWhen` names a toggle
  // option that silences it. Computed like the form's.
  function archetypeWeapons(ch){
    const a = archetype(ch);
    if (!a || writeInSpec(ch) || !Array.isArray(a.naturalWeapons)) return [];
    const held = archetypePowers(ch), picks = optionChoices(ch);
    const out = [];
    for (const w of a.naturalWeapons.filter(isPlainObj)){
      let src = w, power = null;
      if (w.power){ power = held.find(p=>p.id===w.power); if (!power) continue; }
      if (w.choice){ const c = picks.find(x=>x.id===w.choice); if (!c || !isPlainObj(c.option)) continue; src = c.option; }
      let dmg = src.damage;
      const m = /^\s*([A-Za-z]+)\s*\+\s*(\d+)\s*$/.exec(String(dmg==null ? "" : dmg));
      if (power && m && Number(w.perRank)) dmg = `${m[1]}+${Number(m[2]) + Number(w.perRank) * Math.max(0, power.rank - 1)}`;
      const d = weaponDamage(ch, dmg), skill = skillById(src.skill) ? skillLine(ch, src.skill) : null;
      const off = isPlainObj(w.offWhen) && (()=>{ const p = archPanels(ch).find(x=>x.id===w.offWhen.panel && x.type==="toggle");
        const cur = p && toggleCurrent(ch, p); return !!cur && cur.name===w.offWhen.option; })();
      const extra = [src.reach && `Reach ${src.reach}`, src.parry && `Parry ${src.parry}`].filter(Boolean).map(txt);
      out.push({ name:txt(src.name), from:txt(w.from), skill: skill ? skill.def.name : "", attack: skill && !off ? skill.checkBonus : null,
                 damage: off ? null : d.value, damageFormula: off ? null : d.formula, rank: power ? power.rank : null,
                 tags:(Array.isArray(src.tags) ? src.tags : []).filter(t=>typeof t==="string"), extra,
                 off: !!off, offText: off ? txt(w.offWhen.text) : "" });
    }
    return out;
  }

  // ── Feeding (Decision 201) ──────────────────────────────────────────
  // A `feed` panel refills the resource it names (`trackers.<resource>.spent`
  // counts down from the SFR max): each kind's `perHL` for every HL drained,
  // never past the max, and never past `upToShare` of it (stored blood) once
  // there. `unfed` takes `share` of RoU. At `low.at` (RoU) or under, `low` speaks.
  const feedPanel = (ch, panelId) => archPanels(ch).find(x=>x.id===panelId && x.type==="feed") || null;
  function feedView(ch, p){
    const s = sfr(ch), max = s && s.value!=null ? s.value : null, rou = s && typeof s.rou==="number" ? s.rou : null;
    const store = (ch.trackers||{})[p.resource], spent = nonNegInt(isPlainObj(store) ? store.spent : 0);
    const current = max==null ? null : Math.max(0, max - spent);
    const kinds = (Array.isArray(p.kinds) ? p.kinds : []).filter(k=>isPlainObj(k) && typeof k.id==="string").map(k=>({
      id:k.id, name:txt(k.name), text:txt(k.text), perHL: nonNegInt(k.perHL),
      upTo: max!=null && Number(k.upToShare) > 0 ? Math.floor(max * Number(k.upToShare)) : max }));
    const u = isPlainObj(p.unfed) ? p.unfed : null;
    const unfed = u && rou!=null ? { label:txt(u.label), amount: Math.floor(rou * (Number(u.share)||0)) } : null;
    const L = isPlainObj(p.low) ? p.low : null;
    const low = !!L && L.at==="rou" && current!=null && rou!=null && current <= rou;
    return { current, max, rou, kinds, unfed, low, lowName: low ? txt(L.name) : "", lowText: low ? txt(L.text) : "", unit:txt(p.unit) };
  }
  // What feeding on `hl` HL of a kind gives back, before it's done.
  function feedGain(ch, panelId, kindId, hl){
    const p = feedPanel(ch, panelId);
    if (!p) return { ok:false, why:"Feeding isn't on this sheet." };
    const v = feedView(ch, p), k = v.kinds.find(x=>x.id===kindId);
    if (!k) return { ok:false, why:"Choose what you're feeding on." };
    const n = Number(hl);
    if (!Number.isInteger(n) || n < 1) return { ok:false, why:"Enter the HL drained, 1 or more." };
    if (v.max==null) return { ok:false, why:"Your SFR has no maximum yet." };
    const gain = Math.max(0, Math.min(k.perHL * n, k.upTo - v.current));
    return { ok:true, gain, kind:k, hl:n, capped: gain < k.perHL * n, upTo:k.upTo };
  }
  function feed(ch, panelId, kindId, hl){
    const g = feedGain(ch, panelId, kindId, hl);
    if (!g.ok) return g;
    const p = feedPanel(ch, panelId), t = ch.trackers;
    if (!isPlainObj(t[p.resource])) t[p.resource] = { spent:0 };
    // Spend past the max (a max that fell since) counts as empty, not deeper.
    const max = feedView(ch, p).max;
    t[p.resource].spent = Math.max(0, Math.min(nonNegInt(t[p.resource].spent), max) - g.gain);
    return g;
  }
  // A full day without feeding. The pool stops at empty.
  function goUnfed(ch, panelId){
    const p = feedPanel(ch, panelId);
    if (!p) return { ok:false, why:"Feeding isn't on this sheet." };
    const v = feedView(ch, p);
    if (!v.unfed || v.max==null) return { ok:false, why:"Your SFR has no maximum yet." };
    const t = ch.trackers;
    if (!isPlainObj(t[p.resource])) t[p.resource] = { spent:0 };
    const lost = Math.min(v.unfed.amount, v.current);
    t[p.resource].spent = nonNegInt(t[p.resource].spent) + lost;
    return { ok:true, lost };
  }
  // A Werewolf's Base Powers and Max Starting Rank, read off the scaling row
  // for the Character tab (F38's stub: shown, spending nothing). Null when the
  // row has neither.
  function powerAllowance(ch){
    const row = scalingRow(ch);
    if (!row || (row.basePowers==null && row.maxStartingRank==null)) return null;
    return { basePowers: typeof row.basePowers==="number" ? row.basePowers : null,
             maxStartingRank: typeof row.maxStartingRank==="number" ? row.maxStartingRank : null };
  }
  // Every power the character holds that has a rank, and so can be raised:
  // Disciplines (rank 0 is one not yet trained), the archetype's own powers,
  // then the character's own written powers, rank 1 at creation (XQ2:
  // creation's powers are free).
  function powerRanks(ch){
    const ds = disciplineRanks(ch).map(d=>({ id:d.id, name:d.name, kind:"discipline", rank:d.rank, ipe:d.ipe }));
    const arch = archetypePowers(ch).map(p=>({ id:p.id, name:p.name, kind:"archetype", rank:p.rank, ipe:p.ipe, maxRank:p.maxRank, ranked:p.ranked }));
    const own = ownPowers(ch).filter(p=>p.id).map(p=>{ const ipe = powerIpeOf(ch, p.id);
      return { id:p.id, name:p.name || "Unnamed power", kind:"written", rank:1+ipe, ipe }; });
    return [...ds, ...arch, ...own];
  }

  // ── A write-in archetype (Decision 153) ─────────────────────────────
  // An archetype that declares `writeIn` has no content of its own: the
  // character writes it in archetypeChoices.writeIn and keeps its powers in
  // `powers`. Every reader normalizes what it reads, since an undo can put
  // anything a file's audit holds back into these fields.
  const txt = v => typeof v==="string" ? v : "";
  const isPlainObj = o => !!o && typeof o==="object" && !Array.isArray(o);
  const textRow = r => ({ name:txt(r.name), description:txt(r.description) });
  const textRows = v => (Array.isArray(v) ? v : []).filter(isPlainObj).map(textRow);
  const powerRow = r => ({ id:txt(r.id), custom:true, name:txt(r.name), uses:txt(r.uses), effect:txt(r.effect), notes:txt(r.notes) });
  // The mechanics a character ticked, of those its archetype offers.
  function mechanicsOn(ch){
    const spec = writeInSpec(ch);
    if (!spec) return [];
    const offered = (spec.mechanics||[]).map(m=>m.id), ticked = writeInOf(ch).mechanics;
    return Array.isArray(ticked) ? offered.filter(id=>ticked.includes(id)) : [];
  }
  // What the wizard offers a write-in archetype: its checkboxes, each with
  // whether it's ticked, and what a power might spend. Null for any other.
  function writeInOptions(ch){
    const spec = writeInSpec(ch);
    if (!spec) return null;
    const on = mechanicsOn(ch);
    return { mechanics:(spec.mechanics||[]).map(m=>({ id:m.id, label:m.label, note:m.note||"", on:on.includes(m.id) })),
             powerUses:(spec.powerUses||[]).slice(),
             classifications:(D().classifications||[]).slice() };
  }
  const hasPowers = ch => archPanels(ch).some(p=>p.type==="powers");
  const ownPowers = ch => hasPowers(ch) ? listOf(ch, "powers").filter(isPlainObj).map(powerRow) : [];
  // As read for display: each with its rank, 1 + what IP bought (Decision 194).
  const rankedOwnPowers = ch => ownPowers(ch).map(p=>Object.assign(p, { rank: 1 + powerIpeOf(ch, p.id) }));
  // The one reader for what an archetype is, whichever kind: the Archetype
  // tab, the wizard card, the header, the roster and print all draw this.
  function archetypeContent(ch){
    const a = archetype(ch);
    if (!a) return null;
    const c = classification(ch), spec = writeInSpec(ch), w = writeInOf(ch);
    const text = spec && c && c.writeIn ? txt(w.classificationText).trim() : "";
    const cls = c ? { id:c.id, name:c.name, text } : null;
    // A power or vulnerability with an `origin` belongs to that
    // specialization alone (a Forge Fang's EMP): the others never see it.
    const origins = specializationIds(ch);
    if (!spec) return { writeIn:false, name:a.name, description:a.summary||null, status:a.status, classification:cls,
      traits:a.baselineTraits||[], powers:[...archetypePowers(ch), ...rankedOwnPowers(ch)], powersText:txt(a.powersText),
      vulnerabilities:(a.vulnerabilities||[]).filter(v=>!v || !v.origin || origins.includes(v.origin)) };
    const desc = txt(w.description).trim();
    return { writeIn:true, name:txt(w.name).trim() || a.name, description:desc || null, status:a.status, classification:cls,
      traits:textRows(w.traits), powers:rankedOwnPowers(ch), powersText:"", vulnerabilities:textRows(w.vulnerabilities) };
  }
  // A power row's id is local to the character, so the IP journal can name
  // the row a spend bought. Never reissued within one character.
  function newPowerId(ch){
    const held = new Set(listOf(ch, "powers").map(p=>p && p.id));
    let id;
    do id = `pw-${randomChars(8)}`; while (held.has(id));
    return id;
  }
  // What rewriting a power costs (Decision 154), the price the GM names: a
  // whole number of IP, at least 1, and IP enough to pay it. `free` is
  // Admin's adding one: blank or 0 is allowed, for what creation missed.
  // { cost } or { why }.
  function powerCost(ch, raw, free){
    const blank = raw==null || String(raw).trim()==="";
    if (blank && free) return { cost:0 };
    if (blank) return { why:"A power costs IP in play. Enter what your GM says it costs." };
    const cost = Number(raw);
    if (!Number.isInteger(cost) || cost < 0) return { why:"An IP cost is a whole number." };
    if (cost < 1 && !free) return { why:"A power costs at least 1 IP in play. Admin adds one free." };
    if (cost && ipState(ch).available < cost) return { why:`Not enough IP (need ${cost}).` };
    return { cost };
  }
  const spendOnPower = (ch, cost, id, name, note) => {
    if (cost) ch.progression.ip.log.push({ date:new Date().toISOString(), kind:"spend", amount:cost,
      targetType:"power", targetId:id, name, note:txt(note) });
  };
  // A new power in play is 0450's flat price (Decision 194), not one the GM
  // names, as Decision 154 had it.
  function newPowerCost(ch){
    const cost = D().ip.powerIncreaseCost.newPower;
    return ipState(ch).available < cost ? { why:`Not enough IP (need ${cost}).` } : { cost };
  }
  // A power is written, and audited by the caller's commit(), with its IP
  // cost as a journal spend: one commit, one Undo. Admin's `free` adds one at
  // no cost, or at a cost Admin types.
  function addPower(ch, input, { free=false }={}){
    if (!hasPowers(ch)) return { ok:false, why:"Powers aren't on this sheet." };
    const i = isPlainObj(input) ? input : {}, name = txt(i.name).trim();
    if (!name) return { ok:false, why:"Give the power a name." };
    const c = free ? powerCost(ch, i.cost, true) : newPowerCost(ch);
    if (c.why) return { ok:false, why:c.why };
    const row = powerRow({ id:newPowerId(ch), name, uses:txt(i.uses).trim(), effect:i.effect, notes:i.notes });
    if (!Array.isArray(ch.powers)) ch.powers = [];
    ch.powers.push(row);
    spendOnPower(ch, c.cost, row.id, name, i.note);
    return { ok:true, id:row.id, cost:c.cost };
  }
  // Decision 154: in play a power's name, uses and effect change only by
  // improving it, for IP; Admin edits them in place. Notes are the player's.
  // The new words and the spend are one commit, one Undo.
  function improvePower(ch, id, input){
    if (!hasPowers(ch)) return { ok:false, why:"Powers aren't on this sheet." };
    const p = listOf(ch, "powers").find(x=>isPlainObj(x) && x.id===id);
    if (!p) return { ok:false, why:"That power isn't on this sheet." };
    const i = isPlainObj(input) ? input : {};
    const next = { name:txt(i.name).trim(), uses:txt(i.uses).trim(), effect:txt(i.effect) };
    if (!next.name) return { ok:false, why:"Give the power a name." };
    if (["name","uses","effect"].every(k=>next[k]===txt(p[k]))) return { ok:false, why:"Nothing changed. Rewrite its name, uses or effect to improve it." };
    const c = powerCost(ch, i.cost, false);
    if (c.why) return { ok:false, why:c.why };
    Object.assign(p, next);
    spendOnPower(ch, c.cost, p.id, next.name, i.note);
    return { ok:true, cost:c.cost };
  }
  // A blank row for the wizard's powers editor, where the player types into
  // it (XQ2: creation's powers are free). Play adds powers through addPower.
  function newPower(ch){
    if (!hasPowers(ch)) return { ok:false, why:"Powers aren't on this sheet." };
    const row = powerRow({ id:newPowerId(ch) });
    if (!Array.isArray(ch.powers)) ch.powers = [];
    ch.powers.push(row);
    return { ok:true, id:row.id };
  }
  // Removing a power leaves its IP spend in the journal: IP spent stays spent,
  // and versionCheck says the power is gone. The ranks it bought go with it.
  function removePower(ch, id){
    const list = listOf(ch, "powers"), at = list.findIndex(p=>p && p.id===id);
    if (at < 0) return { ok:false, why:"That power isn't on this sheet." };
    list.splice(at, 1);
    const m = ((ch||{}).progression||{}).powerIpe;
    if (isPlainObj(m)) delete m[id];
    return { ok:true };
  }

  // ════ AUDIT TRAIL & UNDO ═════════════════════════════════════════════
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

  // `deep` is the table's switch (Decision 212). Off, these are the character's
  // and their ops are pinned byte for byte; on, a same-length array is walked
  // element by element and a single insert is one op, so an edit inside a
  // record stores the field, not the whole list.
  function _walk(b, a, path, ops, deep){
    const bArr=Array.isArray(b), aArr=Array.isArray(a);
    if (bArr && aArr) return _arrayDiff(b, a, path, ops, deep);
    const bObj = b && typeof b==="object" && !bArr;
    const aObj = a && typeof a==="object" && !aArr;
    if (bObj && aObj){
      const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
      for (const k of keys) _walk(b[k], a[k], path.concat(k), ops, deep);
      return;
    }
    // scalar, or a shape change (object<->array<->scalar): store prior value
    if (!_eq(b, a)) ops.push({ path:path.slice(), type:"scalar", before:_clone(b) });
  }
  // Records are matched by id when a list grew or shrank and was edited too (End keeps a copy and
  // marks another member dead): what left, what came in, and each survivor's own edits. Only when
  // every element is an object with a unique string id on both sides and the survivors kept their
  // order; anything else is left to the fallbacks. Forward order is removals (highest b index
  // first), then inserts (lowest a index first, a run as one op), then the survivors' edits at
  // their a indexes, so an undo, which runs backwards, lands on b exactly.
  function _idAligned(b, a, path, ops){
    const ids = list => {
      const at = new Map();
      for (let i=0;i<list.length;i++){
        const r = list[i];
        if (!r || typeof r!=="object" || Array.isArray(r) || typeof r.id!=="string" || at.has(r.id)) return null;
        at.set(r.id, i);
      }
      return at;
    };
    const bAt = ids(b), aAt = ids(a);
    if (!bAt || !aAt) return false;
    let last = -1;
    for (let j=0;j<a.length;j++){
      const i = bAt.get(a[j].id);
      if (i===undefined) continue;
      if (i < last) return false;
      last = i;
    }
    for (let i=b.length-1;i>=0;i--) if (!aAt.has(b[i].id)) ops.push({ path:path.slice(), type:"array", op:"removeAt", index:i, item:_clone(b[i]) });
    for (let j=0;j<a.length;j++){
      if (bAt.has(a[j].id)) continue;
      let k = 1;
      while (j+k<a.length && !bAt.has(a[j+k].id)) k++;
      const op = { path:path.slice(), type:"array", op:"insertAt", index:j };
      if (k > 1) op.count = k;
      ops.push(op);
      j += k-1;
    }
    for (let j=0;j<a.length;j++){
      const i = bAt.get(a[j].id);
      if (i!==undefined) _walk(b[i], a[j], path.concat(j), ops, true);
    }
    return true;
  }
  function _arrayDiff(b, a, path, ops, deep){
    if (_eq(b, a)) return;
    if (deep && a.length===b.length){
      for (let i=0;i<b.length;i++) _walk(b[i], a[i], path.concat(i), ops, true);
      return;
    }
    if (deep && a.length!==b.length){
      // A contiguous block went in or out: the common head and tail say where, in one pass.
      const lo = Math.min(a.length, b.length);
      let head = 0, tail = 0;
      while (head<lo && _eq(a[head], b[head])) head++;
      while (tail<lo-head && _eq(a[a.length-1-tail], b[b.length-1-tail])) tail++;
      if (a.length > b.length && head+tail===b.length){
        const op = { path:path.slice(), type:"array", op:"insertAt", index:head };
        if (a.length-b.length > 1) op.count = a.length-b.length;
        ops.push(op);
        return;
      }
      if (b.length > a.length && head+tail===a.length){
        // Highest first, so an undo (which runs them backwards) puts each back at its own index.
        for (let i=head+(b.length-a.length)-1;i>=head;i--) ops.push({ path:path.slice(), type:"array", op:"removeAt", index:i, item:_clone(b[i]) });
        return;
      }
      if (_idAligned(b, a, path, ops)) return;
    }
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
  // A patch path is only ever the character's own keys. The audit rides in a
  // player-supplied file, so a crafted entry must not walk into a prototype
  // (["__proto__", …] would write onto every object in the page) or through
  // a missing link (B16, the 2026-09-24 audit).
  const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);
  const safePath = p => Array.isArray(p) && p.length>0
    && p.every(k=>(typeof k==="string" || typeof k==="number") && !UNSAFE_KEYS.has(String(k)));
  function _container(ch, path){
    let o=ch;
    for (let i=0;i<path.length-1;i++){ if (!o || typeof o!=="object") return null; o=o[path[i]]; }
    return o;
  }
  function _applyOp(ch, op){
    if (!op || !safePath(op.path)) return;
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
    else if (op.op==="insertAt"){ if (Array.isArray(arr)) arr.splice(op.index, Number.isInteger(op.count) && op.count>0 ? op.count : 1); }
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
    const patch=Array.isArray(entry && entry.patch) ? entry.patch : [];
    for (let i=patch.length-1;i>=0;i--) _applyOp(ch, patch[i]);
    log.pop();
    // What an entry restores came from the file too: hold the numbers to
    // the same guarantee a load gives them.
    _coerceNumbers(ch);
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

  // Every number a character file stores is read back as a number (B16, the
  // 2026-09-24 audit). A file is player-supplied: a string where a count
  // belongs rode `+` as text ("5" + 1 is "51") and reached the page as
  // markup, on every tab, without a single throw. Everything that loads a
  // character runs migrate(), and undo runs this too, so no reader or
  // renderer has to distrust a stored number. A plain numeric string is
  // read as its number; anything else falls back to the field's default.
  // `null` stays where a field allows it (a roll not entered, an age blank).
  const _num = (v, d) => {
    const n = typeof v==="number" ? v : (typeof v==="string" && /^\s*-?\d+(\.\d+)?\s*$/.test(v)) ? Number(v) : NaN;
    return Number.isFinite(n) ? n : d;
  };
  const _numOrNull = v => v==null || v==="" ? null : _num(v, null);
  // Is this file's schema older than `v`? A file with no readable version is.
  function _schemaBefore(meta, v){
    const parse = x => String(x).split(".").map(Number);
    const have = meta && typeof meta==="object" && typeof meta.schemaVersion==="string" ? parse(meta.schemaVersion) : null;
    if (!have || have.some(n=>!Number.isFinite(n))) return true;
    const want = parse(v);
    for (let i=0;i<Math.max(have.length, want.length);i++){
      const d = (have[i]||0) - (want[i]||0);
      if (d) return d < 0;
    }
    return false;
  }
  function _coerceNumbers(c){
    const isObj = o => !!o && typeof o==="object" && !Array.isArray(o);
    const fix = (o, k, d) => { if (isObj(o) && k in o) o[k] = _num(o[k], d); };
    const fixAll = (o, d) => { if (isObj(o)) for (const k of Object.keys(o)) o[k] = _num(o[k], d); };
    const fixNull = o => { if (isObj(o)) for (const k of Object.keys(o)) o[k] = _numOrNull(o[k]); };
    const rows = a => Array.isArray(a) ? a.filter(isObj) : [];
    if (!isObj(c)) return c;
    if (isObj(c.identity) && "age" in c.identity) c.identity.age = _numOrNull(c.identity.age);
    if (isObj(c.creation)){
      fixNull(c.creation.rolls);
      c.creation.boosts = rows(c.creation.boosts);
      c.creation.boosts.forEach(b=>fix(b, "times", 0));
    }
    const ac = c.archetypeChoices;
    if (isObj(ac)){
      fixNull(ac.rolls);
      fixAll(ac.focusAllocation, 0); fixAll(ac.statBonusAllocation, 0); fixAll(ac.disciplines, 0);
      ac.naturalAdvantages = rows(ac.naturalAdvantages);
      ac.naturalAdvantages.forEach(n=>fix(n, "rank", 0));
    }
    if (isObj(c.stats)) for (const s of Object.values(c.stats)) { fix(s, "base", 1); fix(s, "ipe", 0); }
    if (isObj(c.skills)) for (const id of Object.keys(c.skills)){
      const s = c.skills[id];
      if (!isObj(s)) { delete c.skills[id]; continue; }
      s.rank = _num(s.rank, 0); s.ipe = _num(s.ipe, 0);
    }
    for (const k of ["advantages","disadvantages"]) if (Array.isArray(c[k])) c[k].forEach(e=>{ if (isObj(e)) e.rank = _num(e.rank, 1); });
    const t = c.trackers;
    if (isObj(t)){
      for (const k of ["damage","massiveLevels","witheringDamage"]) fix(t, k, 0);
      fix(t.luck, "bonus", 0); fix(t.luck, "spent", 0); fix(t.san, "loss", 0); fix(t.sfr, "spent", 0);
      if (isObj(t.credits)){
        fix(t.credits, "current", 0);
        t.credits.ledger = rows(t.credits.ledger);
        t.credits.ledger.forEach(e=>{ e.amount = _num(e.amount, 0); });
      }
      if (isObj(t.crank)){
        fix(t.crank, "rep", 0);
        t.crank.ledger = rows(t.crank.ledger);
        t.crank.ledger.forEach(e=>{ e.amount = _num(e.amount, 0); });
      }
      if (Array.isArray(t.adjustments)){ t.adjustments = rows(t.adjustments); t.adjustments.forEach(e=>{ e.amount = _num(e.amount, 0); }); }
      if (Array.isArray(t.conditions)) t.conditions.forEach(e=>fix(e, "marks", 0));
      if (isObj(t.panel)) for (const id of Object.keys(t.panel)){
        const p = t.panel[id];
        if (!isObj(p)) { delete t.panel[id]; continue; }
        p.value = _num(p.value, 0);
        if ("max" in p) p.max = _numOrNull(p.max);
      }
    }
    const pr = c.progression;
    if (isObj(pr)){
      fix(pr, "milestonePoints", 0);
      if (isObj(pr.ip)){
        fix(pr.ip, "earned", 0);
        if (Array.isArray(pr.ip.log)){ pr.ip.log = rows(pr.ip.log); pr.ip.log.forEach(e=>{ e.amount = _num(e.amount, 0); }); }
      }
    }
    if (Array.isArray(c.sessions)){ c.sessions = rows(c.sessions); c.sessions.forEach(s=>{ s.ipEarned = _num(s.ipEarned, 0); }); }
    if (Array.isArray(c.weapons)) c.weapons.forEach(w=>{ if (isObj(w)) w.roundsSpent = nonNegInt(w.roundsSpent); });
    if (Array.isArray(c.armor)) c.armor.forEach(a=>{ if (isObj(a)) a.integrityLoss = nonNegInt(a.integrityLoss); });
    if (Array.isArray(c.gear)) c.gear.forEach(g=>{ if (isObj(g) && !g.custom){ g.qty = nonNegInt(g.qty);
      if (g.chargesUsed!=null) g.chargesUsed = nonNegInt(g.chargesUsed); } });
    if (Array.isArray(c.audit)) c.audit.forEach(e=>{ if (isObj(e)) e.seq = _num(e.seq, 0); });
    return c;
  }

  // Decision 197 (0414): an archetype whose scaling row rolls a Focus Stat
  // bonus, and no Stat Bonus, spends its roll on its Focus Stats. A file
  // from when it rolled a Stat Bonus on any stat (a Werewolf before game
  // data 0.31) has the roll and its points moved across, so a locked
  // character's stats don't move. A draft's points on a stat that isn't a
  // Focus Stat are given back to place again: the wizard shows only the
  // Focus Stats, so they'd be points nobody could take off.
  function _statBonusToFocus(c){
    const a = archetype(c), row = scalingRow(c), ac = c.archetypeChoices;
    if (!a || !row || !row.focusStatBonusRoll || row.statBonusRoll) return;
    if (![ac, ac && ac.rolls, ac && ac.statBonusAllocation, ac && ac.focusAllocation].every(isPlainObj)) return;
    const pts = Object.entries(ac.statBonusAllocation).filter(([, v])=>v > 0);
    if (ac.rolls.statBonus==null && !pts.length) return;
    const focus = ((a.campaignPowerScaling||{}).focusStats) || [];
    if (ac.rolls.focusStatBonus==null && ac.rolls.statBonus!=null) ac.rolls.focusStatBonus = ac.rolls.statBonus;
    delete ac.rolls.statBonus;
    for (const [id, v] of pts) if (c.creation.locked===true || focus.includes(id))
      ac.focusAllocation[id] = (ac.focusAllocation[id]||0) + v;
    ac.statBonusAllocation = {};
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
    t.crank = Object.assign({rep:0, ledger:[]}, t.crank);
    if (!Array.isArray(t.crank.ledger)) t.crank.ledger=[];
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
    // Schema 0.18 (Decision 194): ranks IP bought, per power id. A file from
    // before has none; a file's own keeps only whole, finite, positive counts.
    pr.powerIpe = Object.fromEntries(Object.entries(isPlainObj(pr.powerIpe) ? pr.powerIpe : {})
      .map(([k, v])=>[k, nonNegInt(_num(v, 0))]).filter(([, v])=>v > 0));
    // Decision 104: a held entry that isn't an object with an id was reaching
    // grants()/advSpent() and throwing. Drop it, as conditions already do.
    const isEntry = e => !!e && typeof e==="object" && typeof e.id==="string";
    for (const k of ["advantages","disadvantages"]) c[k] = Array.isArray(c[k]) ? c[k].filter(isEntry) : [];
    for (const k of ["minor","major"]) pr.milestones[k] = Array.isArray(pr.milestones[k]) ? pr.milestones[k].filter(isEntry) : [];
    if (!Array.isArray(c.sessions)) c.sessions=[];
    c.gear=c.gear||[]; c.weapons=c.weapons||[]; c.armor=c.armor||[];
    // Schema 0.16 (Decision 153): a power is the player's own row, every
    // field text, with an id local to the character. A row with no id, or one
    // another row already holds, gets a new one, so a spend names one row.
    const powerIds = new Set();
    c.powers = (Array.isArray(c.powers) ? c.powers : []).filter(isPlainObj).map(r=>{
      const p = powerRow(r);
      while (!p.id || powerIds.has(p.id)) p.id = `pw-${randomChars(8)}`;
      powerIds.add(p.id);
      return p;
    });
    // Schema 0.6 (Weapons/Ammo/Armor data batch): a weapons entry may now
    // reference the gear catalog by id (notes only, stats computed from the
    // catalog) or stay freeform (custom:true, every field preserved as typed).
    // A pre-0.6 entry has neither marker -- tag it custom rather than guess
    // which catalog weapon a free-typed name was supposed to mean.
    c.weapons.forEach(w => { if (w && !w.id && !w.custom) w.custom = true; });
    // Schema 0.10 (W17 + W27, Decision 121): a gear row is a catalog
    // reference ({ id, qty }, `chargesUsed` on a charged Talisman) or typed
    // (custom:true). Every row from before is typed text, so it's tagged
    // custom, never matched to a catalog name, as the 0.6 step did weapons.
    c.gear = (Array.isArray(c.gear) ? c.gear : []).filter(g=>g && typeof g==="object").map(g=>{
      if (g.custom || typeof g.id!=="string"){ g.custom = true; return g; }
      g.qty = g.qty==null ? 1 : nonNegInt(g.qty);
      if (g.chargesUsed!=null) g.chargesUsed = nonNegInt(g.chargesUsed);
      if (typeof g.notes!=="string") g.notes = "";
      return g;
    });
    // Schema 0.10 (W16, Decision 120): a weapon keeps its installed mods (a
    // catalog weapon's `mods`, weaponModGlossary ids) and the rounds spent
    // since its last reload. Nothing is guessed: a file from before starts
    // with no mods and a full magazine.
    if (!Array.isArray(c.weapons)) c.weapons = [];
    c.weapons.forEach(w => {
      if (!w || typeof w!=="object") return;
      w.roundsSpent = nonNegInt(w.roundsSpent);
      if (w.custom) delete w.mods;
      else w.mods = Array.isArray(w.mods) ? w.mods.filter(x=>typeof x==="string") : [];
      // Schema 0.14 (W40): `loaded` is a specialty round's id; standard
      // rounds, and every weapon from before, have none.
      if (w.custom || typeof w.loaded!=="string") delete w.loaded;
    });
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
    if (!Array.isArray(c.audit)) c.audit=[];
    // An audit entry is only what recordAction writes: a patch of ops on the
    // character's own keys. Anything else in a file is dropped, never undone
    // (B16): undo would otherwise write wherever a crafted path pointed.
    c.audit = c.audit.filter(e=>e && typeof e==="object" && Array.isArray(e.patch)
      && e.patch.every(op=>op && typeof op==="object" && safePath(op.path)));
    // Schema 0.9 (Decision 108): a Grimoire row is a book spell ({ spellId,
    // stage, notes }) or the player's own (the typed columns, custom:true).
    // A pre-0.9 row is typed text. Tag it custom and never guess which book
    // spell a typed name meant; "Link to the book" is the player's call, the
    // same rule the 0.6 step uses for weapons. Junk rows are dropped.
    for (const id of grimoirePanelIds()){
      const rows = c.panelData[id];
      if (rows===undefined) continue;
      c.panelData[id] = (Array.isArray(rows) ? rows : []).filter(r=>r && typeof r==="object").map(r=>{
        if (typeof r.spellId!=="string"){ r.custom = true; return r; }
        const b = Object.assign({ notes:"" }, r, { stage: r.stage==="mastered" ? "mastered" : "known" });
        delete b.custom;
        return b;
      });
    }
    t.aberrations = (Array.isArray(t.aberrations) ? t.aberrations : [])
      .filter(e=>e && typeof e==="object" && typeof e.id==="string")
      .map(e=>Object.assign({}, e, { permanence: e.permanence==="permanent" ? "permanent" : "temporary" }));
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
    // Focused Skill picks are skill ids (Decision 134): anything else is junk.
    ac.focusedSkillPicks = (Array.isArray(ac.focusedSkillPicks) ? ac.focusedSkillPicks : []).filter(x=>typeof x==="string");
    if (c.identity && typeof c.identity==="object") delete c.identity.specialization;
    // Schema 0.16 (Decision 153): a write-in archetype's own words. Every file
    // from before has none, which _fillDefaults seeded; a file's own is kept
    // field by field, as text, and anything else in it is dropped.
    const w = isPlainObj(ac.writeIn) ? ac.writeIn : {};
    ac.writeIn = { name:txt(w.name), description: typeof w.description==="string" ? w.description : null,
      classification: typeof w.classification==="string" ? w.classification : null,
      classificationText:txt(w.classificationText),
      mechanics:[...new Set((Array.isArray(w.mechanics) ? w.mechanics : []).filter(x=>typeof x==="string"))],
      traits:textRows(w.traits), vulnerabilities:textRows(w.vulnerabilities) };
    // Schema 0.19 (Decision 200): Base Powers placed, a whole positive count
    // per power id, and a specialization's creation picks: an option id, or
    // a text choice's fields as text. Anything else in a file is dropped;
    // whether a pick fits the archetype is validate()'s, read when used.
    const bp = isPlainObj(ac.basePowers) ? ac.basePowers : {};
    ac.basePowers = Object.fromEntries(Object.keys(bp).map(k=>[k, Math.min(D().ip.rankCap, nonNegInt(_num(bp[k], 0)))]).filter(([, v])=>v > 0));
    const op = isPlainObj(ac.optionPicks) ? ac.optionPicks : {};
    ac.optionPicks = {};
    for (const k of Object.keys(op)){
      if (typeof op[k]==="string") ac.optionPicks[k] = op[k];
      else if (isPlainObj(op[k])) ac.optionPicks[k] = Object.fromEntries(Object.keys(op[k]).filter(f=>typeof op[k][f]==="string").map(f=>[f, op[k][f]]));
    }
    // The Vampire's Blood Pool panel (a max nobody computed) is its SFR now.
    if (_schemaBefore(c.meta, "0.19")) delete t.panel["blood-pool"];
    // Schema 0.14 (W41): TAGless only when a file says so, as `true`. Every
    // character from before is TAG'd, which _fillDefaults already seeded.
    c.identity.tagless = c.identity.tagless===true;
    // Schema 0.13 (A11, Decision 142): a Professional's free advantage is
    // marked `source: "natural"`, and `notes` is only ever text. Before, the
    // marker WAS the notes. Only a file from before 0.13 is read that way,
    // so a note that happens to say "natural" can't make a bought advantage
    // free. The audit's stored undo patches get the same step (C8): a patch
    // of `advantages` is the whole list or one row, never a field inside a
    // row (_arrayDiff), so an undo past this migration restores the new shape.
    if (_schemaBefore(c.meta, "0.13")){
      const mark = e => { if (e && typeof e==="object" && e.notes==="natural" && e.source===undefined){ e.source = "natural"; e.notes = ""; } };
      c.advantages.forEach(mark);
      for (const e of c.audit) for (const op of e.patch){
        if (op.path.length!==1 || op.path[0]!=="advantages") continue;
        if (Array.isArray(op.before)) op.before.forEach(mark);
        mark(op.item);
      }
    }
    for (const e of c.advantages) if (e.source!=="natural") delete e.source;
    // Schema 0.15 (Decision 150): a file from before rolled its Stat Points,
    // or hadn't yet. A locked one was built under the earlier table, whose
    // pools no longer exist in the data, so `earlierTable` says its creation
    // budgets can't be recomputed. A draft carries on under the new rules.
    const cr = c.creation;
    if (_schemaBefore(c.meta, "0.15")){
      cr.statMethod = cr.rolls.statPoints!=null && cr.rolls.statPoints!=="" ? "rolled" : "flat";
      if (cr.locked===true) cr.earlierTable = true;
    }
    if (cr.statMethod!=="rolled") cr.statMethod = "flat";
    if (cr.earlierTable!==true) delete cr.earlierTable;
    _coerceNumbers(c);
    _statBonusToFocus(c);
    // meta exists but gamedataVersion is deliberately NOT seeded: inventing it
    // from the loaded data would mask the mismatch versionCheck must report.
    if (!c.meta || typeof c.meta!=="object") c.meta = {};
    // Schema 0.11 (B18, Decision 128): a file from before gets its number
    // here, and keeps it from its next save on. Schema 0.12 (Decision 133):
    // the number is a TAG, and a 0.11 NCR- number keeps its twelve characters
    // under the new prefix, so a player's older export is still the same
    // character. Anything else in the field (a hand edit, a payload) is
    // replaced, not trusted.
    const old = typeof c.meta.id==="string" && OLD_INTAKE_RE.exec(c.meta.id);
    if (old) c.meta.id = `TAG-${old[1]}`;
    if (!isIntakeId(c.meta.id)) c.meta.id = newIntakeId();
    c.meta.schemaVersion = SCHEMA_VERSION;
    return c;
  }


  // ════ SELECTION & CONSTRAINT SYSTEM ═══════════════════════════════════
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
  // through the Professional Natural Advantages pool (source:"natural") and once
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
    return copies.find(x=>x.source!=="natural") || copies[0] || null;
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
    // An entry that DECLARES a count and cannot resolve one asks for nothing.
    // Falling back to 1 invented a requirement the data never stated — on a
    // corrupt import with no power level, main raised nothing here.
    const n = dataPath(ch, spec.countBy);
    return n==null ? 0 : n;
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

  // Decision 162: every creation point is spent before a character locks.
  // A pool with points left blocks the lock only while one of them can still
  // buy something, so a player whose last point fits nowhere (a stat's next
  // point costs 2, every skill at its cap) is never stuck.
  function spendable(ch, pool){
    const max = D().statRules.max;
    if (pool==="stats"){
      const p = statPool(ch);
      if (!p || p.total==null) return false;
      const left = p.total - statSpent(ch);
      return D().stats.some(s => ch.stats[s.id].base < max && nextStatCost(ch, s.id) <= left);
    }
    if (pool==="skills") return D().skills.some(s => {
      const cap = skillRankCap(ch, s.id);
      return cap!=null && (ch.skills[s.id] ? ch.skills[s.id].rank : 0) < cap;
    });
    if (pool==="focusBonus") return true;
    if (pool==="basePowers"){
      const st = basePowerState(ch);
      return !!st && st.left > 0 && st.rows.some(r=>r.cap==null || r.placed < r.cap);
    }
    if (pool==="statBonus") return D().stats.some(s => statValue(ch, s.id) < max);
    if (pool==="cp"){
      const bal = cp(ch), luck = D().resources.luck;
      if (!bal) return false;
      return bal.left >= luck.cpCostPerPoint
        || D().stats.some(s => canBoost(ch, "stat", s.id).ok)
        || D().skills.some(s => canBoost(ch, "skill", s.id).ok);
    }
    return false;
  }

  function validate(stepId, ch){
    const out = [], pl = powerLevel(ch), a = archetype(ch);
    const E=(m)=>out.push({level:"error",msg:m}), W=(m, pool)=>out.push(pool ? {level:"warn",msg:m,pool} : {level:"warn",msg:m});
    // The starting cap (Decision 134): the stepper and canBoost refuse to pass
    // it, but changing Subtype after assigning ranks can leave a skill over.
    // The skills step reports a rank over the cap; Character Points reports
    // one that only Boosts carried over.
    const overCap = withBoosts => {
      if (!pl) return;
      for (const [id, s] of Object.entries(ch.skills||{})){
        const def = skillById(id), cap = skillRankCap(ch, id);
        if (!def || cap==null) continue;
        const base = Number(s.rank)||0, boosted = base + boostsFor(ch, "skill", id);
        if (!withBoosts && base > cap) E(`${def.name} is rank ${base}. It can start at ${cap} at most.`);
        if (withBoosts && base <= cap && boosted > cap) E(`${def.name} is rank ${boosted} with Boosts. It can start at ${cap} at most.`);
      }
    };
    if (stepId==="power-level"){ if (!pl) E("Choose a Campaign Power Level."); }
    if (stepId==="concept"){ if (!String((ch.identity||{}).name||"").trim()) E("Your character needs a name."); }
    if (stepId==="stats"){
      // B7: the pools are null until a power level is chosen. validate() must
      // report that, never throw — a corrupt import or an admin edit gets here
      // even though the wizard gates it.
      const p = statPool(ch);
      if (!p) E("Choose a Campaign Power Level before assigning Stat Points.");
      else if (p.total==null) E(`Enter your ${p.rollDie} Stat Point roll.`);
      else if (p.range && (p.roll < p.range[0] || p.roll > p.range[1]))
        E(`A ${p.rollDie} roll is ${p.range[0]} to ${p.range[1]}. Enter what you rolled.`);
      else {
        const left = p.total - statSpent(ch);
        if (left < 0) E(`Stat Points overspent by ${-left}.`);
        else if (left > 0) W(`${left} Stat Points unspent.`, "stats");
      }
    }
    if (stepId==="archetype"){
      if (!a) { E("Choose an Archetype."); return out; }
      // Decision 153: a write-in archetype needs a name and a classification.
      // Other's own words are the table's business: warned, never blocked (78).
      if (writeInSpec(ch)){
        const w = writeInOf(ch), c = classification(ch);
        if (!txt(w.name).trim()) E("Name your archetype. What are you?");
        if (!c) E("Choose a classification for your archetype.");
        else if (c.writeIn && !txt(w.classificationText).trim()) W(`Say what ${c.name} means for you, in a word or two.`);
        // A row with words but no name never shows on the sheet; an empty one is just unused.
        const nameless = rows => rows.filter(r=>!r.name.trim() && [r.description, r.uses, r.effect, r.notes].some(v=>txt(v).trim())).length;
        for (const [rows, noun] of [[textRows(w.traits), "trait"], [ownPowers(ch), "power"], [textRows(w.vulnerabilities), "vulnerability"]]){
          const n = nameless(rows);
          if (n) W(`${n===1?`A ${noun}`:`${n} ${noun==="vulnerability"?"vulnerabilities":noun+"s"}`} with no name won't show on your sheet. Name ${n===1?"it":"them"}.`);
        }
      }
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
          else if (used < r) W(`${r-used} Focus Stat bonus points unallocated.`, "focusBonus");
        }
      }
      if (row && row.statBonusRoll){
        const r = ch.archetypeChoices.rolls.statBonus;
        if (r==null) E(`Enter your ${row.statBonusRoll} Stat Bonus roll.`);
        else {
          const used = Object.values(ch.archetypeChoices.statBonusAllocation).reduce((s,v)=>s+v,0);
          if (used > r) E(`Stat Bonus overspent by ${used-r}.`);
          else if (used < r) W(`${r-used} Stat Bonus points unallocated.`, "statBonus");
        }
      }
      // Decision 91: a specialization's gate is `requires` data, read by
      // checkPrereqs. Decision 134: it and the two pools below run for any
      // archetype whose data carries them, not for one named archetype.
      for (const o of specializationChosen(ch)){
        if (!o.requires) continue;
        const r = checkPrereqs(ch, o.requires);
        for (const u of r.unmet) E(`${o.name} requires ${u}.`);
      }
      const fp = focusedPicks(ch);
      if (fp){
        const cat = focusedCategoryName(fp.category);
        for (const id of fp.invalid) E(`${(skillById(id)||{name:id}).name} can't be one of your Focused Skill picks. Unchoose it.`);
        if (fp.have !== fp.need)
          E(`Choose ${fp.need} ${cat} Skill${fp.need>1?"s":""} for your Focused Skills (${fp.have}/${fp.need}).`);
      }
      // Base Powers (F39's stub, Decision 200), once a Bloodline is chosen:
      // short warns (the lock wants them spent), over or out of reach blocks.
      const bps = basePowerState(ch);
      if (bps && specializationIds(ch).length){
        if (bps.count==null) E("Choose a Campaign Power Level before placing Base Powers.");
        else if (bps.left < 0) E(`Base Powers overspent by ${-bps.left}.`);
        else if (bps.left > 0) W(`${bps.left} Base Power${bps.left>1?"s":""} unplaced.`, "basePowers");
        for (const r of bps.rows) if (r.cap!=null && r.placed > r.cap)
          E(r.ranked ? `${r.name} is rank ${r.placed}. It can start at ${r.cap} at most.` : `${r.name} has no ranks. Place one Base Power in it.`);
        for (const r of bps.stray) E(`${r.name} isn't one of your powers. Take back its Base Power${r.placed>1?"s":""}.`);
      }
      // A specialization's creation choices (Decision 200). The Code's
      // tenets are written with the GM: warned, never blocked (Decision 78).
      for (const c of optionChoices(ch)){
        if (c.type==="text"){
          const left = c.fields.filter(f=>!f.value.trim()).map(f=>f.name.replace(/^The /, "the "));
          if (left.length) W(`${c.name}: write ${left.length>1 ? left.slice(0, -1).join(", ")+" and "+left[left.length-1] : left[0]} with your GM.`);
        }
        else if (!c.done) E(`Choose ${c.name}.`);
      }
      const row2 = scalingRow(ch);
      if (specializationIds(ch).length && naturalAdvantagePool(a) && row2 && row2.naturalAdvantageRanks!=null){
        const have = ch.archetypeChoices.naturalAdvantages.reduce((s,n)=>s+n.rank,0);
        if (have !== row2.naturalAdvantageRanks)
          E(`Allocate ${row2.naturalAdvantageRanks} Natural Advantage ranks (${have}/${row2.naturalAdvantageRanks}).`);
      }
    }
    if (stepId==="skills"){
      const p = skillPool(ch);
      if (!p) E("Choose a Campaign Power Level before assigning Skill Points.");
      else {
        const left = p.total - skillSpent(ch);
        if (left < 0) E(`Skill Points overspent by ${-left}.`);
        else if (left > 0) W(`${left} Skill Points unspent.`, "skills");
      }
      overCap(false);
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
      else if (bal.left > 0) W(`${bal.left} Character Points unspent.`, "cp");
      overCap(true);
      // Decision 152. A Professional's free Advantages are the archetype's, not bought.
      const cls = classification(ch);
      const barred = ch.advantages.filter(x=>x.source!=="natural" && !canBuyAdvantage(ch, x.id));
      if (barred.length)
        E(`${cls.name}s can't buy ${barred.map(x=>(advById(x.id)||{name:x.id}).name).join(", ")}. Only Universal Advantages are open to them.`);
      // The discipline cap (Decision 135) is the data's `maxRankBy`. The
      // stepper stops at it, so only an edited file or a lower power level
      // chosen afterwards can pass it.
      for (const d of disciplineRanks(ch))
        if (d.cap!=null && d.start > d.cap) E(`${d.name} is rank ${d.start}. It can start at ${d.cap} at most.`);
      // Starting spells (Decision 111). Evocation and TOL are only final on
      // this step, so the picks are checked here. Short of the count warns,
      // like an unspent pool; a spell above the rank or one too many blocks.
      const ss = startingSpells(ch);
      if (ss){
        if (ss.roll==null) W(`Enter your ${ss.rollDie} starting spells roll.`);
        for (const o of ss.over) E(`${o.name} needs ${ss.discipline} ${o.th}. Buy the rank or choose another spell.`);
        for (const o of ss.notCast) E(`${o.name} is made with ${o.form}, never cast, so it can't be a starting spell. Choose another.`);
        if (ss.count!=null && ss.have > ss.count) E(`Too many starting spells (${ss.have}/${ss.count}).`);
        else if (ss.count!=null && ss.have < ss.count)
          W(`${ss.count-ss.have} starting spell${ss.count-ss.have>1?"s":""} left to choose (${ss.have}/${ss.count}).`);
      }
      // Locks, gates, and the inputs a trait demands. Reported once
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
      // Decision 162: a step only warns of points left, so the player can
      // move freely; the lock needs them spent while any can still buy.
      for (const s of ["power-level","concept","stats","archetype","skills","character-points"])
        for (const i of validate(s,ch)){
          if (!i.pool) out.push(i);
          else if (spendable(ch, i.pool)) E(`${i.msg.replace(/\.$/, "")}. Spend them before you lock.`);
          else W(`${i.msg.replace(/\.$/, "")}, and nothing left they can buy.`);
        }
      // At lock, a written-in archetype is the GM's call (Decision 153). Copy
      // from appCopy, so the voice stays a data edit (Decision 71).
      if (writeInSpec(ch)){
        const t = ((D().appCopy||{}).archetypeWrittenIn) || "{name} is your GM's call.";
        W(t.replace("{name}", archetypeContent(ch).name));
      }
    }
    return out;
  }

  function buildExport(ch){
    const c = JSON.parse(JSON.stringify(ch));
    c.meta.updated = new Date().toISOString();
    c.meta.gamedataVersion = D().meta.gamedataVersion;
    const pl = powerLevel(ch);
    // Seed starting Çredits from the creation roll — but never overwrite a
    // tracked total once play transactions exist.
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
    const abs = (c.trackers||{}).aberrations;
    for (const e of Array.isArray(abs) ? abs : [])
      if (e && !aberrationById(e.id)) issues.push(`Aberration "${e.id}" no longer exists in game data.`);
    // Loadout, Grimoire and specialization ids (C9). Each reader already shows
    // an orphan as a name with nothing behind it; this says so on load, too.
    listOf(c, "weapons").forEach((e, i)=>{ const l = weaponLine(c, i);
      if (l && l.missing) issues.push(`Weapon "${l.name}" no longer exists in game data.`); });
    listOf(c, "armor").forEach(e=>{ if (e && typeof e==="object" && !e.custom && !armorDefById(e.id))
      issues.push(`Armor "${String(e.id)}" no longer exists in game data.`); });
    listOf(c, "gear").forEach((e, i)=>{ const l = gearLine(c, i);
      if (l && l.missing) issues.push(`Gear "${l.name}" no longer exists in game data.`); });
    for (const l of grimoire(c).lines)
      if (l.missing) issues.push(`Spell "${l.spellId}" no longer exists in game data.`);
    for (const o of specializationChosen(c))
      if (o.missing) issues.push(`Specialization "${o.id}" no longer exists in game data.`);
    // Milestone ids, then the IP journal against IPE
    for (const t of ((c.progression||{}).milestones||{}).minor||[])
      if (!(D().milestones.minorShared||[]).some(m=>m.id===t.id))
        issues.push(`Minor Milestone "${t.id}" no longer exists in game data.`);
    for (const t of ((c.progression||{}).milestones||{}).major||[])
      if (!majorById(c, t && t.id))
        issues.push(`Major Milestone "${t.id}" no longer exists in game data.`);
    const log = (((c.progression||{}).ip)||{}).log||[];
    const perTarget = {};
    for (const e of log) if (e.kind!=="grant")
      perTarget[e.targetType+"|"+e.targetId] = (perTarget[e.targetType+"|"+e.targetId]||0)+1;
    for (const [k,n] of Object.entries(perTarget)){
      const [type,id] = k.split("|");
      // Mastery isn't IPE (Decision 108): a spell's spend is matched by its
      // Grimoire row saying Mastered. Read as a skill it looked like a hand
      // edit on every Arcanist who had mastered anything (B11).
      if (type==="spell"){
        const p = grimoirePanel(c), rows = p && c.panelData && Array.isArray(c.panelData[p.id]) ? c.panelData[p.id] : [];
        const row = rows.find(r=>r && r.spellId===id), name = (spellById(id)||{name:id}).name;
        if (!row || row.stage!=="mastered")
          issues.push(`IP journal shows ${name} Mastered, but the Grimoire doesn't — it may have been edited by hand.`);
        continue;
      }
      // A power's spend bought a row (Decision 153) or a rank (Decision 194);
      // its id names the row or the Discipline. A rank's entry has a `to`,
      // and their count is the IPE the power should hold.
      if (type==="power"){
        const e = log.find(x=>x.targetType==="power" && x.targetId===id);
        const name = e && txt(e.name) ? e.name : "a power";
        if (!powerRanks(c).some(p=>p.id===id)){
          issues.push(`IP journal shows IP spent on ${name}, but that power isn't on the sheet any more.`);
          continue;
        }
        const raises = log.filter(x=>x && x.kind!=="grant" && x.targetType==="power" && x.targetId===id && typeof x.to==="number").length;
        const ipe = powerIpeOf(c, id);
        if (raises !== ipe) issues.push(`IP journal shows ${raises} rank${raises===1?"":"s"} bought for ${name} but it holds ${ipe} — totals may have been edited by hand.`);
        continue;
      }
      const ipe = type==="stat" ? ((c.stats||{})[id]||{}).ipe||0
                                : ((c.skills||{})[id]||{}).ipe||0;
      if (ipe !== n) issues.push(`IP journal shows ${n} increase${n>1?"s":""} on ${id} but IPE is ${ipe} — totals may have been edited by hand.`);
    }
    return issues;
  }

  // ── Tables (GM mode, Decisions 170–173) ─────────────────────────────────
  // A GM's table is its own file, .shadows-table.json, with its own id and its
  // own schema version. migrateTable() is its gate, as migrate() is a
  // character's: a table file is made to be shared, so it's untrusted
  // (Decision 124). The engine knows nothing of the feature switch (173).
  const TABLE_ID_RE = new RegExp(`^TBL-${INTAKE_BODY}$`);
  const NOTE_ID_RE = /^N-[0-9A-HJKMNP-TV-Z]{8}$/;
  const CAST_ID_RE = /^C-[0-9A-HJKMNP-TV-Z]{8}$/;
  const INTERACTION_ID_RE = /^I-[0-9A-HJKMNP-TV-Z]{8}$/;
  const ENCOUNTER_ID_RE = /^EN-[0-9A-HJKMNP-TV-Z]{8}$/;
  const ROW_ID_RE = /^R-[0-9A-HJKMNP-TV-Z]{8}$/;
  const SESSION_ID_RE = /^SE-[0-9A-HJKMNP-TV-Z]{8}$/;
  const THREAD_ID_RE = /^TH-[0-9A-HJKMNP-TV-Z]{8}$/;
  const isTableId = v => typeof v==="string" && TABLE_ID_RE.test(v);
  function newTableId(){
    const s = randomChars(12);
    return `TBL-${s.slice(0,4)}-${s.slice(4,8)}-${s.slice(8,12)}`;
  }
  const _str = v => typeof v==="string" ? v : "";
  const _isoOrNull = v => typeof v==="string" && Number.isFinite(Date.parse(v)) ? v : null;
  const _isObj = o => !!o && typeof o==="object" && !Array.isArray(o);
  // Is `v` a version string newer than `base`? (_schemaBefore reads
  // meta.schemaVersion, so a table's own stamp needs its own twin.)
  function _versionNewer(v, base){
    if (typeof v!=="string") return false;
    const parse = x => x.split(".").map(Number);
    const have = parse(v), want = parse(base);
    if (have.some(n=>!Number.isFinite(n))) return false;
    for (let i=0;i<Math.max(have.length, want.length);i++){
      const d = (have[i]||0) - (want[i]||0);
      if (d) return d > 0;
    }
    return false;
  }
  function newTableNoteId(used){
    let id;
    do id = `N-${randomChars(8)}`; while (used.has(id));
    return id;
  }
  function newCastId(used){
    let id;
    do id = `C-${randomChars(8)}`; while (used.has(id));
    return id;
  }
  function newInteractionId(used){
    let id;
    do id = `I-${randomChars(8)}`; while (used.has(id));
    return id;
  }
  function newSessionId(used){
    let id;
    do id = `SE-${randomChars(8)}`; while (used.has(id));
    return id;
  }
  function newThreadId(used){
    let id;
    do id = `TH-${randomChars(8)}`; while (used.has(id));
    return id;
  }
  // A whole number, or null: "6" is 6, and 6.5, {} and "x" are nothing.
  function _int(v){
    if (typeof v==="string" && /^\s*-?\d+\s*$/.test(v)) v = Number(v);
    return typeof v==="number" && Number.isSafeInteger(v) ? v : null;
  }
  const _tier = v => { const n = _int(v); return n!==null && n>=1 ? n : null; };
  const CAST_STATUSES = ["alive","dead","missing","gone"];
  // The list's order, whatever the filter: who is in play first, the dead last.
  const CAST_ORDER = ["alive","missing","gone","dead"];
  const CAST_TEXT = ["name","flavor","description","origin","enemyRole","motivation","resources","line","ifPushed","gmNote"];
  const _strList = v => (Array.isArray(v) ? v : typeof v==="string" ? [v] : []).filter(x=>typeof x==="string");
  // Roles are trimmed and never empty, so a card never reads "Fixer /".
  const _roleList = v => _strList(v).map(x=>x.trim()).filter(Boolean);
  // The ids a block is keyed by come from the data (Decision 135): the stats,
  // and the derived stats of type sumOfModifiers, which the Codex authors.
  const _authoredDefs = () => D().derived.filter(d=>d.type==="sumOfModifiers");
  // A stat block, coerced (Decision 175). Unknown keys ride along, never read.
  function _block(b){
    if (!_isObj(b)) return null;
    if (!_isObj(b.stats)) b.stats = {};
    for (const s of D().stats) b.stats[s.id] = _int(b.stats[s.id]);
    if (!_isObj(b.authored)) b.authored = {};
    for (const d of _authoredDefs()) b.authored[d.id] = _int(b.authored[d.id]);
    b.skills = (Array.isArray(b.skills) ? b.skills : []).filter(_isObj);
    for (const k of b.skills){
      k.name = _str(k.name);
      k.total = _int(k.total);
      k.skill = typeof k.skill==="string" && skillById(k.skill) ? k.skill : null;
    }
    b.armor = (Array.isArray(b.armor) ? b.armor : []).filter(x=>typeof x==="string");
    b.gear = (Array.isArray(b.gear) ? b.gear : []).filter(x=>typeof x==="string");
    b.traits = (Array.isArray(b.traits) ? b.traits : []).filter(_isObj);
    for (const k of b.traits){ k.name = _str(k.name); k.text = _str(k.text); }
    return b;
  }
  // Where a copy came from (Decision 182): an entry in a pack, by the pack's id,
  // the entry's id and the name it had. The pack lives outside the table, so the
  // name is stored; anything that isn't exactly that is nothing.
  const PACK_ID_RE = /^PK-[0-9A-HJKMNP-TV-Z]{8}$/;
  const RECORD_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/;
  function _castFrom(f){
    if (!_isObj(f) || f.kind!=="entry" || typeof f.name!=="string") return null;
    if (!(typeof f.pack==="string" && PACK_ID_RE.test(f.pack))) return null;
    if (!(typeof f.id==="string" && RECORD_ID_RE.test(f.id))) return null;
    return f;
  }
  // One cast member, coerced the way a note is. `used` holds the ids taken.
  function _castMember(n, used){
    for (const k of CAST_TEXT) n[k] = _str(n[k]);
    n.npcRoles = _roleList(n.npcRoles);
    n.affiliations = _roleList(n.affiliations);
    n.tier = _tier(n.tier);
    if (!CAST_STATUSES.includes(n.status)) n.status = "alive";
    if (!(typeof n.id==="string" && CAST_ID_RE.test(n.id)) || used.has(n.id)) n.id = newCastId(used);
    used.add(n.id);
    n.block = _block(n.block);
    n.from = _castFrom(n.from);
    // Schema 0.11 (Decision 210): Fights with the crew. True only when it is.
    n.ally = n.ally===true;
    n.created = _isoOrNull(n.created);
    n.updated = _isoOrNull(n.updated);
  }
  // What passed between the crew and the cast (Decision 177). The kind is the
  // only part anything reads, so it is a fixed list; anything else is null.
  // "fought" is written by an encounter's end (Decision 193).
  const INTERACTION_KINDS = ["shared","learned","helped","wronged","killed","owes","owed","fought"];
  const _kind = v => INTERACTION_KINDS.includes(v) ? v : null;
  // A local day, YYYY-MM-DD, that is a real one: 2026-02-30 is nothing.
  function _day(v){
    const m = typeof v==="string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!m) return null;
    const d = new Date(Date.UTC(+m[1], +m[2]-1, +m[3]));
    return d.getUTCFullYear()===+m[1] && d.getUTCMonth()===+m[2]-1 && d.getUTCDate()===+m[3] ? v : null;
  }
  // A link to a cast member (Decision 178). One that points at nobody is kept:
  // it reads as the name it was given, or as gone.
  function _castLinks(v){
    const out = (Array.isArray(v) ? v : []).filter(l=>_isObj(l) && l.kind==="cast" && typeof l.id==="string" && CAST_ID_RE.test(l.id));
    for (const l of out) if (typeof l.name!=="string") delete l.name;
    return out;
  }
  // A session (Decision 203): the number is the GM's, the journal is the Campaign
  // Journal's six parts (227). Unknown keys ride along, never read.
  const JOURNAL_PARTS = ["happened","fallout","threads","impact","reflection","seed"];
  // Hours are half hours from 0 to 24, else nothing.
  const _hours = v => {
    if (typeof v==="string" && /^\s*\d+(\.\d+)?\s*$/.test(v)) v = Number(v);
    return typeof v==="number" && Number.isFinite(v) && v>=0 && v<=24 && v*2===Math.round(v*2) ? v : null;
  };
  const _number = v => { const n = _int(v); return n!==null && n>=0 ? n : null; };
  // The award log (Decisions 205–206): null until the GM writes the close-out,
  // then { at, lines }. A line that makes no sense is dropped, never repaired.
  // An away line has no Milestone Point; a present one has no off-screen tier.
  function _closeLine(l){
    if (!_isObj(l)) return null;
    const name = _str(l.name).trim();
    if (!name) return null;
    l.name = name;
    l.present = l.present===true;
    const ip = _int(l.ip), credits = _int(l.credits);
    l.ip = ip!==null && ip>=0 ? ip : null;
    l.credits = credits!==null && credits>=0 ? credits : null;
    l.milestone = l.present && l.milestone===true;
    l.tier = !l.present && typeof l.tier==="string" && (crankData().tiers||[]).some(k=>k.id===l.tier) ? l.tier : null;
    l.note = _str(l.note);
    return l;
  }
  function _close(c){
    if (!_isObj(c) || !Array.isArray(c.lines)) return null;
    c.at = _isoOrNull(c.at);
    const seen = new Set();
    c.lines = c.lines.map(_closeLine).filter(l=>{
      if (!l) return false;
      const k = _fold(l.name);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return c;
  }
  function _session(x, used){
    x.close = _close(x.close);
    x.number = _number(x.number);
    x.date = _day(x.date);
    x.present = _roleList(x.present);
    x.hours = typeof x.hours==="number" ? _hours(x.hours) : null;
    if (!_isObj(x.journal)) x.journal = {};
    for (const k of JOURNAL_PARTS) x.journal[k] = _str(x.journal[k]);
    if (!(typeof x.id==="string" && SESSION_ID_RE.test(x.id)) || used.has(x.id)) x.id = newSessionId(used);
    used.add(x.id);
    x.created = _isoOrNull(x.created);
    x.updated = _isoOrNull(x.updated);
  }
  const THREAD_STATUSES = ["open","resolved","dropped"];
  function _thread(x, used, sessions){
    x.title = _str(x.title);
    x.notes = _str(x.notes);
    if (!THREAD_STATUSES.includes(x.status)) x.status = "open";
    x.opened = typeof x.opened==="string" && sessions.has(x.opened) ? x.opened : null;
    x.closed = x.status!=="open" && typeof x.closed==="string" && sessions.has(x.closed) ? x.closed : null;
    x.current = x.current===true && x.status==="open";
    if (!(typeof x.id==="string" && THREAD_ID_RE.test(x.id)) || used.has(x.id)) x.id = newThreadId(used);
    used.add(x.id);
    x.created = _isoOrNull(x.created);
    x.updated = _isoOrNull(x.updated);
  }
  function _interaction(x, used, sessions){
    x.session = typeof x.session==="string" && sessions && sessions.has(x.session) ? x.session : null;
    x.kind = _kind(x.kind);
    x.cast = _castLinks(x.cast);
    x.crew = _roleList(x.crew);
    x.text = _str(x.text);
    x.date = _day(x.date);
    if (!(typeof x.id==="string" && INTERACTION_ID_RE.test(x.id)) || used.has(x.id)) x.id = newInteractionId(used);
    used.add(x.id);
    x.created = _isoOrNull(x.created);
    x.updated = _isoOrNull(x.updated);
  }
  // The table file's shape. A bump needs a migrateTable() step in the same change.
  const TABLE_SCHEMA_VERSION = "0.12";
  function newTable(name){
    const now = new Date().toISOString();
    return { meta:{ kind:"shadows-table", id:newTableId(), name:String(name ?? ""),
                    tableSchemaVersion:TABLE_SCHEMA_VERSION, created:now, updated:now },
             notes:[], cast:[], interactions:[], encounters:[], sessions:[], threads:[], audit:[] };
  }
  // Which kind of file is this? A file with no kind is a character: every file
  // ever exported is. Only a table says so.
  function fileKind(obj){
    if (!_isObj(obj)) return "unknown";
    const m = obj.meta;
    if (!_isObj(m) || !("kind" in m)) return "character";
    return m.kind==="shadows-table" ? "table" : m.kind==="shadows-pack" ? "pack" : "unknown";
  }
  function migrateTable(t){
    // Work on a copy, so nothing aliases the caller's object. Unknown keys
    // ride along untouched and are never read; known ones are set by name.
    let c;
    try { c = _isObj(t) ? JSON.parse(JSON.stringify(t)) : {}; } catch (e) { c = {}; }
    if (!_isObj(c.meta)) c.meta = {};
    const m = c.meta;
    m.kind = "shadows-table";
    if (!isTableId(m.id)) m.id = newTableId();
    m.name = _str(m.name);
    // Decision 63: the gate invents no timestamps.
    m.created = _isoOrNull(m.created);
    m.updated = _isoOrNull(m.updated);
    // A newer stamp is kept (and reported by tableCheck): an older app must
    // not lower it and so hide that it dropped what it didn't know.
    // Version-gated steps go here, in the order migrate() keeps its own. They
    // read the stamp the file arrived with, so they run before it's rewritten.
    //   Schema 0.2 (Decision 174): a table gets a cast.
    const arrived = m.tableSchemaVersion;
    if (typeof arrived!=="string" || _versionNewer("0.2", arrived)){
      if (!Array.isArray(c.cast)) c.cast = [];
    }
    //   Schema 0.3 (Decision 177): a table gets interactions, and a cast member affiliations.
    if (typeof arrived!=="string" || _versionNewer("0.3", arrived)){
      if (!Array.isArray(c.interactions)) c.interactions = [];
    }
    //   Schema 0.4 (Decision 182): a cast member remembers the pack entry it was copied from.
    if (typeof arrived!=="string" || _versionNewer("0.4", arrived)){
      for (const n of (Array.isArray(c.cast) ? c.cast : [])) if (_isObj(n)) n.from = null;
    }
    //   Schema 0.5 (Decision 188): a table gets encounters.
    if (typeof arrived!=="string" || _versionNewer("0.5", arrived)){
      if (!Array.isArray(c.encounters)) c.encounters = [];
    }
    //   Schema 0.6 (Decision 191): a row keeps its Massive levels and its armor's wear.
    if (typeof arrived!=="string" || _versionNewer("0.6", arrived)){
      for (const e of (Array.isArray(c.encounters) ? c.encounters : [])) if (_isObj(e))
        for (const r of (Array.isArray(e.rows) ? e.rows : [])) if (_isObj(r)){ r.massive = 0; r.armorLoss = 0; r.scrapped = false; r.armorId = null; }
    }
    //   Schema 0.7 (Decision 193): a row remembers who it was kept as, and whether it was hit.
    if (typeof arrived!=="string" || _versionNewer("0.7", arrived)){
      for (const e of (Array.isArray(c.encounters) ? c.encounters : [])) if (_isObj(e))
        for (const r of (Array.isArray(e.rows) ? e.rows : [])) if (_isObj(r)){ r.kept = null; r.struck = false; }
    }
    //   Schema 0.8 (Decisions 203–204): a table keeps its sessions and threads; an interaction, its session.
    if (typeof arrived!=="string" || _versionNewer("0.8", arrived)){
      if (!Array.isArray(c.sessions)) c.sessions = [];
      if (!Array.isArray(c.threads)) c.threads = [];
      for (const x of (Array.isArray(c.interactions) ? c.interactions : [])) if (_isObj(x)) x.session = null;
    }
    //   Schema 0.9 (Decisions 205–206): a session keeps its award log.
    if (typeof arrived!=="string" || _versionNewer("0.9", arrived)){
      for (const x of (Array.isArray(c.sessions) ? c.sessions : [])) if (_isObj(x)) x.close = null;
    }
    //   Schema 0.10 (Decision 208): a note remembers the session it was written in. Nothing is guessed.
    if (typeof arrived!=="string" || _versionNewer("0.10", arrived)){
      for (const n of (Array.isArray(c.notes) ? c.notes : [])) if (_isObj(n)) n.session = null;
    }
    //   Schema 0.11 (Decision 210): an encounter runs one at a time and has the crew and one other side;
    //   a row is on a side by its kind; no cast member is an ally. Nothing is guessed.
    if (typeof arrived!=="string" || _versionNewer("0.11", arrived)){
      for (const e of (Array.isArray(c.encounters) ? c.encounters : [])) if (_isObj(e)){
        const other = _firstOtherId(e);
        e.by = "person";
        e.sides = [{ id:"crew", name:"" }, { id:other, name:"" }];
        for (const r of (Array.isArray(e.rows) ? e.rows : [])) if (_isObj(r)) r.side = r.kind==="pc" ? "crew" : other;
      }
      for (const n of (Array.isArray(c.cast) ? c.cast : [])) if (_isObj(n)) n.ally = false;
    }
    //   Schema 0.12 (Decision 212): a table keeps an activity log. Nothing is guessed.
    if (typeof arrived!=="string" || _versionNewer("0.12", arrived)) c.audit = [];
    if (!_versionNewer(m.tableSchemaVersion, TABLE_SCHEMA_VERSION)) m.tableSchemaVersion = TABLE_SCHEMA_VERSION;
    const usedCast = new Set();
    c.cast = (Array.isArray(c.cast) ? c.cast : []).filter(_isObj);
    for (const n of c.cast) _castMember(n, usedCast);
    // Sessions first: the ids threads and interactions name are checked against them.
    const usedSession = new Set();
    c.sessions = (Array.isArray(c.sessions) ? c.sessions : []).filter(_isObj);
    for (const x of c.sessions) _session(x, usedSession);
    // Notes after sessions: a note's session is checked against the ids above (Decision 208).
    const used = new Set();
    c.notes = (Array.isArray(c.notes) ? c.notes : []).filter(_isObj);
    for (const n of c.notes){
      n.title = _str(n.title);
      n.text = _str(n.text);
      n.session = typeof n.session==="string" && usedSession.has(n.session) ? n.session : null;
      if (!(typeof n.id==="string" && NOTE_ID_RE.test(n.id)) || used.has(n.id)) n.id = newTableNoteId(used);
      used.add(n.id);
      n.created = _isoOrNull(n.created);
      n.updated = _isoOrNull(n.updated);
    }
    const usedThread = new Set();
    c.threads = (Array.isArray(c.threads) ? c.threads : []).filter(_isObj);
    for (const x of c.threads) _thread(x, usedThread, usedSession);
    let sawCurrent = false;
    for (const x of c.threads){ if (x.current){ if (sawCurrent) x.current = false; sawCurrent = true; } }
    const usedInteraction = new Set();
    c.interactions = (Array.isArray(c.interactions) ? c.interactions : []).filter(_isObj);
    for (const x of c.interactions) _interaction(x, usedInteraction, usedSession);
    _encounters(c);
    // Undo never crosses a schema step (Decision 48's Revisit): a file saved by an older
    // app comes in with an empty trail. Otherwise every entry is gated.
    c.audit = typeof arrived!=="string" || _versionNewer(TABLE_SCHEMA_VERSION, arrived) ? [] : _tableAuditGate(c.audit);
    return c;
  }
  function tableCheck(t){
    const v = _isObj(t) && _isObj(t.meta) ? t.meta.tableSchemaVersion : null;
    return _versionNewer(v, TABLE_SCHEMA_VERSION)
      ? ["This table was saved by a newer version of the app. What this version doesn't know is kept, but not shown."]
      : [];
  }
  // ════ THE TABLE'S ACTIVITY LOG (Decision 212) ════════════════════════
  // A table keeps the character's audit model: every change one entry
  // { seq, date, label, patch }, undone last first. A table stores only inputs
  // (constraint 7), so one structural diff covers every writer, named or not.
  // The diff runs against a baseline the caller keeps (the table as it stood
  // after the last record), because most writers have already run by the time
  // the UI records.
  const TABLE_AUDIT_MAX = 500;            // entries kept; the oldest go first
  const TABLE_FOLD_MS = 5*60*1000;        // typing in one field folds while the last keystroke is this recent
  // The records a table holds, in the order a label names them.
  const TABLE_RECORDS = ["encounters", "sessions", "cast", "interactions", "threads", "notes"];
  const _tableCore = t => { const o = { meta:{ name:_isObj(t) && _isObj(t.meta) ? t.meta.name : undefined } };
    for (const k of TABLE_RECORDS) o[k] = _isObj(t) ? t[k] : undefined; return o; };
  // The ops between two tables. Only the records and the table's name: the
  // stamps and the log itself are not changes a GM made.
  function diffTable(before, after){
    const ops = [], b = _tableCore(before), a = _tableCore(after);
    _walk(b.meta.name, a.meta.name, ["meta", "name"], ops, true);
    for (const k of TABLE_RECORDS) _walk(b[k], a[k], [k], ops, true);
    return ops;
  }
  const _recName = (coll, r) => coll==="cast" ? (_str(r.name).trim() || "Unnamed")
    : coll==="sessions" ? sessionTitle(r)
    : coll==="encounters" ? encounterTitle(r)
    : coll==="threads" ? (_str(r.title).trim() || "Untitled")
    : coll==="notes" ? (_str(r.title).trim() || "a note")
    : "a line";
  function _recLabel(verb, coll, r){
    const n = _recName(coll, r);
    if (coll==="interactions") return `${verb} a line`;
    if (verb==="Added"){
      if (coll==="cast") return `Added ${n} to the cast`;
      if (coll==="threads") return `Added the thread ${n}`;
      if (coll==="notes") return n==="a note" ? "Added a note" : `Added the note ${n}`;
      return `Added ${n}`;
    }
    if (verb==="Removed"){
      if (coll==="threads") return `Removed the thread ${n}`;
      if (coll==="notes") return n==="a note" ? "Removed a note" : `Removed the note ${n}`;
      return `Removed ${n}`;
    }
    return coll==="notes" && n!=="a note" ? `Changed the note ${n}` : `Changed ${n}`;
  }
  // The words for an entry, read from the records the patch touches: the verb
  // from what happened to each, the name from the record. Changes inside an
  // encounter's rows, sides or Conditions belong to the encounter.
  function tableActionLabel(before, after, patch){
    const fallback = "Changed the table";
    try {
      const touched = new Set();
      let renamed = false;
      for (const op of (Array.isArray(patch) ? patch : [])){
        if (!_isObj(op) || !Array.isArray(op.path)) continue;
        if (op.path[0]==="meta") renamed = true; else touched.add(op.path[0]);
      }
      // An add or a remove names only what came and went: the lines a removal renames are collateral.
      const came = [], changed = [];
      for (const coll of TABLE_RECORDS){
        if (!touched.has(coll)) continue;
        const was = new Map(), now = new Set();
        for (const r of (_isObj(before) && Array.isArray(before[coll]) ? before[coll] : [])) if (_isObj(r)) was.set(r.id, r);
        for (const r of (_isObj(after) && Array.isArray(after[coll]) ? after[coll] : [])){
          if (!_isObj(r)) continue;
          now.add(r.id);
          if (!was.has(r.id)) came.push(_recLabel("Added", coll, r));
          else if (!_eq(was.get(r.id), r)) changed.push(_recLabel("Changed", coll, was.get(r.id)));
        }
        for (const [id, r] of was) if (!now.has(id)) came.push(_recLabel("Removed", coll, r));
      }
      const found = came.length ? came : changed;
      if (!found.length) return renamed ? "Renamed the table" : fallback;
      return found.length===1 ? found[0] : `${found[0]} and ${found.length-1} more`;
    } catch (e) { return fallback; }
  }
  const _pathGet = (o, path) => { for (const k of path){ if (!o || typeof o!=="object") return undefined; o = o[k]; } return o; };
  const _nowIso = v => { const d = v==null ? new Date() : new Date(v); return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString(); };
  // Record what changed in `t` since `before`, as one entry. Nothing changed:
  // nothing recorded. Typing in one field folds into one entry while it
  // touches the same paths under the same label within five minutes, keeping
  // the first keystroke's `before`; a field that ends where it began leaves
  // no entry. `opts.fold === false` is for a press, which is never typing.
  function recordTableAction(t, before, label, now, opts){
    if (!_isObj(t) || !_isObj(before)) return { ok:false, noop:true };
    const patch = diffTable(before, t);
    if (!patch.length) return { ok:false, noop:true };
    if (!Array.isArray(t.audit)) t.audit = [];
    const log = t.audit, when = _nowIso(now), last = log[log.length-1];
    const scalar = ops => ops.every(o=>o.type==="scalar");
    const pathsOf = ops => ops.map(o=>JSON.stringify(o.path)).sort().join("|");
    // A record's own `updated` stamp moves with every keystroke, unless two land in one
    // millisecond: it's not one of the fields a burst is matched on, or kept to.
    const isStamp = o => o.path[o.path.length-1]==="updated";
    const core = ops => ops.filter(o=>!isStamp(o));
    const gap = last ? Date.parse(when) - Date.parse(last.date) : NaN;
    if (!core(patch).length){
      // Only stamps moved (a field's change handler re-sending what its input events already wrote):
      // nothing a GM did, so never an entry of its own. The newest takes them, so an undo puts them back.
      if (!last || !Array.isArray(last.patch)) return { ok:false, noop:true };
      for (const o of patch) if (!last.patch.some(q=>pathsOf([q])===pathsOf([o]))) last.patch.push(o);
      return { ok:true, folded:true, entry:last };
    }
    if (!(opts && opts.fold===false) && last && Array.isArray(last.patch) && scalar(last.patch) && scalar(patch)
        && core(patch).length && gap>=0 && gap<TABLE_FOLD_MS && pathsOf(core(last.patch))===pathsOf(core(patch))){
      // The paths above pin the burst to the same fields of the newest entry's record (the baseline is
      // rebased after every record and undo, so no index moved between). An explicit label must match;
      // otherwise the entry keeps the words it got on its first keystroke, naming the record as it was
      // before the burst, so a name being typed doesn't rename its own entry.
      const same = label ? label===last.label : true;
      if (same){
        last.date = when;
        for (const o of patch) if (isStamp(o) && !last.patch.some(q=>pathsOf([q])===pathsOf([o]))) last.patch.push(o);
        if (core(last.patch).every(o=>_eq(o.before, _pathGet(t, o.path)))){ log.pop(); return { ok:true, folded:true, dropped:true, entry:null }; }
        return { ok:true, folded:true, entry:last };
      }
    }
    const entry = { seq:(last && Number.isInteger(last.seq) ? last.seq : 0) + 1, date:when,
                    label:label || tableActionLabel(before, t, patch), patch };
    log.push(entry);
    while (log.length > TABLE_AUDIT_MAX) log.shift();
    return { ok:true, entry, folded:false };
  }
  // Undo the newest entry, last in first out. It isn't logged. What it restores
  // came from the file too, so the table is gated afresh, in place: S.table
  // stays the same object.
  function undoTableAction(t){
    if (!_isObj(t) || !_isObj(t.meta) || t.meta.kind!=="shadows-table") return { ok:false, why:"That isn't a table." };
    const log = Array.isArray(t.audit) ? t.audit : [];
    if (!log.length) return { ok:false, why:"Nothing to undo." };
    const entry = log[log.length-1];
    const patch = Array.isArray(entry && entry.patch) ? entry.patch : [];
    for (let i=patch.length-1;i>=0;i--) _applyOp(t, patch[i]);
    log.pop();
    t.audit = log;
    const gated = migrateTable(t);
    for (const k of Object.keys(t)) delete t[k];
    Object.assign(t, gated);
    return { ok:true, undone:entry };
  }
  function clearTableActivity(t){
    if (!_isObj(t)) return { ok:false, why:"That isn't a table." };
    t.audit = [];
    return { ok:true };
  }
  // The gate for a trail that came from a file. An entry survives only if every
  // op can be applied and lands on a table record (or the table's name): never
  // meta.id, the version, the stamps or the log itself.
  const _wholeNum = n => Number.isInteger(n) && n>=0;
  function _tableOpOk(op){
    if (!_isObj(op) || !safePath(op.path)) return false;
    const p = op.path;
    if (!p.every(k=>typeof k==="string" || _wholeNum(k))) return false;
    if (!((p.length===2 && p[0]==="meta" && p[1]==="name") || TABLE_RECORDS.includes(p[0]))) return false;
    if (op.type==="scalar") return true;
    if (op.type!=="array") return false;
    if (op.op==="append") return _wholeNum(op.count);
    if (op.op==="removeAt") return _wholeNum(op.index) && op.item!==undefined;
    if (op.op==="insertAt") return _wholeNum(op.index) && (op.count===undefined || (_wholeNum(op.count) && op.count>=1));
    if (op.op==="set") return Array.isArray(op.before);
    return false;
  }
  function _tableAuditGate(list){
    const out = [];
    for (const e of (Array.isArray(list) ? list : [])){
      if (!_isObj(e) || !_wholeNum(e.seq) || typeof e.label!=="string") continue;
      if (e.date!==null && _isoOrNull(e.date)===null) continue;
      if (!Array.isArray(e.patch) || !e.patch.length || !e.patch.every(_tableOpOk)) continue;
      out.push({ seq:e.seq, date:e.date, label:e.label, patch:e.patch });
    }
    return out.slice(-TABLE_AUDIT_MAX);
  }
  const _tableStamp = (t, n) => { const now = new Date().toISOString(); t.meta.updated = now; if (n) n.updated = now; };
  // The one session dated that day, else null: none, or more than one (Decisions 203, 208).
  function _sessionOnDay(t, day){
    const d = _day(day);
    const days = d ? _sessions(t).filter(e=>e.date===d) : [];
    return days.length===1 ? days[0].id : null;
  }
  function addTableNote(t, f){
    f = _isObj(f) ? f : {};
    // A jot is a note with a line to say; the Notes tab's New note may still be empty.
    if (f.jot===true && !_str(f.text).trim()) return { ok:false, why:"Write something first." };
    const now = new Date().toISOString();
    const used = new Set(t.notes.map(n=>n.id));
    const session = _sessions(t).some(e=>e.id===f.session) ? f.session : _sessionOnDay(t, f.date);
    const n = { id:newTableNoteId(used), title:_str(f.title), text:_str(f.text), session, created:now, updated:now };
    t.notes.unshift(n);
    _tableStamp(t);
    return { ok:true, id:n.id };
  }
  function editTableNote(t, id, f){
    const n = t.notes.find(x=>x.id===id);
    if (!n) return { ok:false, why:"No such note." };
    if (_isObj(f)){
      if ("title" in f) n.title = _str(f.title);
      if ("text" in f) n.text = _str(f.text);
      if ("session" in f && (f.session===null || _sessions(t).some(e=>e.id===f.session))) n.session = f.session;
    }
    _tableStamp(t, n);
    return { ok:true };
  }
  function removeTableNote(t, id){
    const i = t.notes.findIndex(x=>x.id===id);
    if (i < 0) return { ok:false, why:"No such note." };
    t.notes.splice(i, 1);
    _tableStamp(t);
    return { ok:true };
  }

  // ── The cast (Decisions 174–176) ────────────────────────────────────────
  // Health and the bonuses are derived here and stored nowhere (constraint 7);
  // TOL and WILL are stored as the Codex authors them, with the formula's
  // value beside (Decision 175). The players' Health rule is copied from
  // health(), which reads a character, not a block.
  function npc(block){
    let copy = {};
    try { copy = _isObj(block) ? JSON.parse(JSON.stringify(block)) : {}; } catch (e) {}
    const b = _block(copy);
    const stats = {}, blanks = [];
    for (const s of D().stats){
      const v = b.stats[s.id];
      stats[s.id] = v===null ? { value:null, mod:null } : { value:v, mod:statMod(v) };
      if (v===null) blanks.push(s.id);
    }
    const hl = D().resources.healthLevels, bod = b.stats.BOD;
    let health = null;
    if (typeof bod==="number" && bod>=1){
      const levels = Math.min(bod, hl.maxLevels), hpPer = hl.hpPerLevel + Math.max(0, bod - hl.maxLevels);
      health = { levels, hpPer, total: levels*hpPer };
    }
    const authored = {};
    for (const d of _authoredDefs()){
      const mods = d.inputs.map(id=>stats[id] ? stats[id].mod : null);
      let formula = mods.some(m=>m===null) ? null : d.base + mods.reduce((a,m)=>a+m, 0);
      if (formula!==null && d.floor!=null) formula = Math.max(d.floor, formula);
      authored[d.id] = { value:b.authored[d.id], formula };
      if (b.authored[d.id]===null) blanks.push(d.id);
    }
    // Rows are kept while a GM is mid-edit, so a list is blank when no row has content.
    const filled = {
      skills: b.skills.some(k=>k.name.trim() || k.total!==null),
      armor: b.armor.some(l=>l.trim()), gear: b.gear.some(l=>l.trim()),
      traits: b.traits.some(k=>k.name.trim() || k.text.trim()) };
    for (const k of ["skills","armor","gear","traits"]) if (!filled[k]) blanks.push(k);
    return { stats, health, authored, blanks };
  }
  function addCastMember(t, f){
    const now = new Date().toISOString();
    const used = new Set(t.cast.map(n=>n.id));
    const n = { id:newCastId(used), name:_str((f||{}).name), flavor:_str((f||{}).line), description:"",
                origin:"", npcRoles:[], affiliations:[], enemyRole:"", tier:null, motivation:"", resources:"", line:"",
                ifPushed:"", gmNote:"", status:"alive", block:null, from:null, ally:false, created:now, updated:now };
    t.cast.unshift(n);
    _tableStamp(t);
    return { ok:true, id:n.id };
  }
  function editCastMember(t, id, f){
    const n = t.cast.find(x=>x.id===id);
    if (!n) return { ok:false, why:"No such cast member." };
    if (_isObj(f)){
      for (const k of CAST_TEXT) if (k in f) n[k] = _str(f[k]);
      if ("npcRoles" in f) n.npcRoles = _roleList(f.npcRoles);
      if ("affiliations" in f) n.affiliations = _roleList(f.affiliations);
      if ("tier" in f) n.tier = _tier(f.tier);
      if ("status" in f && CAST_STATUSES.includes(f.status)) n.status = f.status;
      if ("ally" in f && typeof f.ally==="boolean") n.ally = f.ally;
    }
    _tableStamp(t, n);
    return { ok:true };
  }
  function setCastBlock(t, id, block){
    const n = t.cast.find(x=>x.id===id);
    if (!n) return { ok:false, why:"No such cast member." };
    let copy = null;
    try { copy = _isObj(block) ? JSON.parse(JSON.stringify(block)) : null; } catch (e) {}
    n.block = _block(copy);
    _tableStamp(t, n);
    return { ok:true };
  }
  function removeCastMember(t, id){
    const i = t.cast.findIndex(x=>x.id===id);
    if (i < 0) return { ok:false, why:"No such cast member." };
    // What they had to do with the crew stays, under their name (Decision 178).
    const name = _str(t.cast[i].name);
    if (name.trim()) for (const x of _interactions(t)) for (const l of (Array.isArray(x.cast) ? x.cast : [])) if (_isObj(l) && l.id===id) l.name = name;
    if (name.trim()) for (const e of _encList(t)) for (const r of (Array.isArray(e.rows) ? e.rows : []))
      if (_isObj(r)){
        if (_isObj(r.cast) && r.cast.id===id) r.cast.name = name;
        if (_isObj(r.kept) && r.kept.id===id) r.kept.name = name;
      }
    t.cast.splice(i, 1);
    _tableStamp(t);
    return { ok:true };
  }
  // Names and searches compare folded (Decisions 184, 187): case, and the three typographic
  // apostrophes as ', on both sides, so a typed name and the text it searches agree.
  const _fold = v => _str(v).replace(/[‘’ʼ]/g, "'").trim().toLowerCase();
  const _folded = _fold;
  function castFilter(t, f){
    const q = _folded((f||{}).q), st = (f||{}).status, aff = _folded((f||{}).affiliation);
    const rank = n => CAST_ORDER.indexOf(n.status);
    return (Array.isArray(t && t.cast) ? t.cast : []).filter(n=>{
      if (st==="inplay" ? n.status!=="alive" && n.status!=="missing" : CAST_STATUSES.includes(st) && n.status!==st) return false;
      const affs = Array.isArray(n.affiliations) ? n.affiliations : [];
      if (aff && !affs.some(a=>_folded(a)===aff)) return false;
      return !q || [n.name, n.flavor, n.origin, ...(n.npcRoles||[]), ...affs].some(x=>_fold(x).includes(q));
    }).sort((a, b)=>rank(a) - rank(b));   // stable: each group keeps the cast's own order
  }
  // Every affiliation in the cast, once (case folded), A–Z, as first spelled.
  function castAffiliations(t){
    const seen = new Map();
    for (const n of (Array.isArray(t && t.cast) ? t.cast : []).slice().reverse())   // oldest first, so the first spelling is the first written
      for (const a of (Array.isArray(n.affiliations) ? n.affiliations : [])){
        const s = _str(a).trim(); if (s && !seen.has(_fold(s))) seen.set(_fold(s), s);
      }
    return [...seen.values()].sort((a, b)=>a.toLowerCase().localeCompare(b.toLowerCase()));
  }

  // ── Interactions (Decisions 177–179) ────────────────────────────────────
  const _interactions = t => Array.isArray(t && t.interactions) ? t.interactions.filter(_isObj) : [];
  // Newest first: the later day, a day-less line after the dated, then the later created.
  function _newest(a, b){
    if (a.date!==b.date){ if (!a.date) return 1; if (!b.date) return -1; return a.date < b.date ? 1 : -1; }
    const x = _str(a.created), y = _str(b.created);
    return x===y ? 0 : x < y ? 1 : -1;
  }
  // The link rule (Decision 178): a live link reads its target's name, a link
  // with no target the name it was left, else a stand-in. Never throws.
  function linkName(t, link){
    const id = _isObj(link) ? link.id : null;
    const n = (Array.isArray(t && t.cast) ? t.cast : []).find(x=>_isObj(x) && x.id===id);
    if (n) return { name:_str(n.name).trim() || "Unnamed", gone:false };
    const kept = _isObj(link) ? _str(link.name).trim() : "";
    return { name:kept || "Someone removed", gone:true };
  }
  function _killLinked(t, x){
    if (x.kind!=="killed") return;
    for (const l of (Array.isArray(x.cast) ? x.cast : [])){
      const n = _isObj(l) && (Array.isArray(t.cast) ? t.cast : []).find(c=>c.id===l.id);
      if (n){ n.status = "dead"; _tableStamp(t, n); }
    }
  }
  function addInteraction(t, f){
    f = _isObj(f) ? f : {};
    const kind = _kind(f.kind), text = _str(f.text);
    if (!kind && !text.trim()) return { ok:false, why:"Say what happened." };
    if (!Array.isArray(t.interactions)) t.interactions = [];
    const now = new Date().toISOString();
    const used = new Set(t.interactions.map(x=>x && x.id));
    const date = _day(f.date);
    // A new line takes the one session dated that day (Decision 203); a gate never does.
    const session = _sessions(t).some(e=>e.id===f.session) ? f.session : _sessionOnDay(t, date);
    const x = { id:newInteractionId(used), kind,
                cast:_castLinks((Array.isArray(f.cast) ? f.cast : []).filter(id=>typeof id==="string").map(id=>({ kind:"cast", id }))),
                crew:_roleList(f.crew), text, date, session, created:now, updated:now };
    t.interactions.unshift(x);
    _killLinked(t, x);
    _tableStamp(t);
    return { ok:true, id:x.id };
  }
  function editInteraction(t, id, f){
    const x = _interactions(t).find(i=>i.id===id);
    if (!x) return { ok:false, why:"No such interaction." };
    if (_isObj(f) && "session" in f && f.session!==null && !_sessions(t).some(e=>e.id===f.session))
      return { ok:false, why:"No such session." };
    if (_isObj(f)){
      const was = x.kind;
      if ("session" in f) x.session = f.session;
      if ("kind" in f) x.kind = _kind(f.kind);
      if ("crew" in f) x.crew = _roleList(f.crew);
      if ("text" in f) x.text = _str(f.text);
      if ("date" in f) x.date = _day(f.date);
      if (x.kind==="killed" && was!=="killed") _killLinked(t, x);
    }
    _tableStamp(t, x);
    return { ok:true };
  }
  function removeInteraction(t, id){
    const i = Array.isArray(t && t.interactions) ? t.interactions.findIndex(x=>_isObj(x) && x.id===id) : -1;
    if (i < 0) return { ok:false, why:"No such interaction." };
    t.interactions.splice(i, 1);
    _tableStamp(t);
    return { ok:true };
  }
  function interactionsFor(t, castId){
    return _interactions(t).filter(x=>(Array.isArray(x.cast) ? x.cast : []).some(l=>_isObj(l) && l.id===castId)).sort(_newest);
  }
  const _sessions = t => Array.isArray(t && t.sessions) ? t.sessions.filter(_isObj) : [];
  const _notes = t => Array.isArray(t && t.notes) ? t.notes.filter(_isObj) : [];
  const _threads = t => Array.isArray(t && t.threads) ? t.threads.filter(_isObj) : [];
  // Who knows what: the same records, from the crew's end. Names that differ
  // only in case or spaces are one person, shown as first spelled. A line with
  // no crew name is the last group, named "", so it can always be read.
  function crewView(t, f){
    const q = _folded((f||{}).q), groups = new Map(), nameless = [];
    const hit = (x, name) => !q || _fold(name).includes(q) || _fold(x.text).includes(q)
      || (Array.isArray(x.cast) ? x.cast : []).some(l=>_fold(linkName(t, l).name).includes(q));
    for (const x of _interactions(t).reverse()){   // oldest first, so the heading is the spelling first written
      const names = (Array.isArray(x.crew) ? x.crew : []).map(r=>_str(r).trim()).filter(Boolean);
      if (!names.length){ if (hit(x, "")) nameless.push(x); continue; }
      for (const name of names){
        const key = name.toLowerCase();
        if (!hit(x, key)) continue;
        if (!groups.has(key)) groups.set(key, { name, interactions:[] });
        const g = groups.get(key);
        if (!g.interactions.includes(x)) g.interactions.push(x);
      }
    }
    const out = [...groups.entries()].sort((a, b)=>a[0].localeCompare(b[0])).map(e=>e[1]);
    if (nameless.length) out.push({ name:"", interactions:nameless });
    for (const g of out) g.interactions.sort(_newest);
    return out;
  }

  // ── Sessions and threads (Decisions 203–204) ────────────────────────────
  // A blank number or hours is null, not a refusal; anything else must be right.
  const _blank = v => v===null || v===undefined || (typeof v==="string" && !v.trim());
  function addSession(t, f){
    f = _isObj(f) ? f : {};
    if (!Array.isArray(t.sessions)) t.sessions = [];
    const list = _sessions(t);
    const number = _number(f.number) ?? list.reduce((m, s)=>Math.max(m, s.number ?? -1), 0) + 1;
    const now = new Date().toISOString();
    const used = new Set(list.map(s=>s.id));
    const x = { id:newSessionId(used), number, date:"date" in f ? _day(f.date) : _today(), present:[], hours:null,
                journal:Object.fromEntries(JOURNAL_PARTS.map(k=>[k, ""])), close:null, created:now, updated:now };
    t.sessions.unshift(x);
    _tableStamp(t);
    return { ok:true, id:x.id };
  }
  function editSession(t, id, f){
    const x = _sessions(t).find(s=>s.id===id);
    if (!x) return { ok:false, why:"No such session." };
    f = _isObj(f) ? f : {};
    let number, hours;
    if ("number" in f){
      number = _blank(f.number) ? null : _number(f.number);
      if (number===null && !_blank(f.number)) return { ok:false, why:"Enter a whole number." };
    }
    if ("hours" in f){
      hours = _blank(f.hours) ? null : _hours(f.hours);
      if (hours===null && !_blank(f.hours)) return { ok:false, why:"Enter hours, in halves." };
    }
    if ("number" in f) x.number = number;
    if ("hours" in f) x.hours = hours;
    if ("date" in f) x.date = _day(f.date);
    if ("present" in f) x.present = _roleList(f.present);
    if (_isObj(f.journal)){
      if (!_isObj(x.journal)) x.journal = {};
      for (const k of JOURNAL_PARTS) if (k in f.journal) x.journal[k] = _str(f.journal[k]);
    }
    _tableStamp(t, x);
    return { ok:true };
  }
  function removeSession(t, id){
    const x = _sessions(t).find(s=>s.id===id);
    if (!x) return { ok:false, why:"No such session." };
    t.sessions.splice(t.sessions.indexOf(x), 1);
    for (const i of _interactions(t)) if (i.session===id) i.session = null;
    for (const n of _notes(t)) if (n.session===id) n.session = null;
    for (const h of _threads(t)){ if (h.opened===id) h.opened = null; if (h.closed===id) h.closed = null; }
    _tableStamp(t);
    return { ok:true };
  }
  // By number, highest first (none last), then the later day, then the later made.
  function sessionList(t){
    return _sessions(t).slice().sort((a, b)=>{
      if (a.number!==b.number){ if (a.number===null) return 1; if (b.number===null) return -1; return b.number - a.number; }
      if (a.date!==b.date){ if (!a.date) return 1; if (!b.date) return -1; return a.date < b.date ? 1 : -1; }
      const x = _str(a.created), y = _str(b.created);
      return x===y ? 0 : x < y ? 1 : -1;
    });
  }
  function sessionTitle(s){
    return _isObj(s) && Number.isFinite(s.number) ? `Session ${s.number}` : "Session";
  }
  // The notes jotted in a session, newest first (Decision 208).
  const sessionNotes = (t, id) => _notes(t).filter(n=>n.session===id && typeof id==="string")
    .map((n, i)=>({ n, i })).sort((a, b)=>-_made(a.n, b.n) || a.i - b.i).map(e=>e.n);
  const sessionInteractions = (t, id) => _interactions(t).filter(x=>x.session===id).sort(_newest);
  function sessionOffered(t, id){
    const s = _sessions(t).find(e=>e.id===id);
    if (!s || !s.date) return [];
    return _interactions(t).filter(x=>!x.session && x.date===s.date).sort(_newest);
  }
  function addThread(t, f){
    f = _isObj(f) ? f : {};
    const title = _str(f.title).trim();
    if (!title) return { ok:false, why:"Name the thread." };
    if (!Array.isArray(t.threads)) t.threads = [];
    const now = new Date().toISOString();
    const used = new Set(_threads(t).map(h=>h.id));
    const x = { id:newThreadId(used), title, status:"open", current:false,
                opened:_sessions(t).some(s=>s.id===f.opened) ? f.opened : null, closed:null, notes:"", created:now, updated:now };
    t.threads.unshift(x);
    _tableStamp(t);
    return { ok:true, id:x.id };
  }
  function editThread(t, id, f){
    const x = _threads(t).find(h=>h.id===id);
    if (!x) return { ok:false, why:"No such thread." };
    f = _isObj(f) ? f : {};
    const hasSession = v => _sessions(t).some(s=>s.id===v);
    if ("title" in f && !_str(f.title).trim()) return { ok:false, why:"Name the thread." };
    if ("status" in f && !THREAD_STATUSES.includes(f.status)) return { ok:false, why:"Choose a status." };
    const status = "status" in f ? f.status : x.status;
    if (f.current===true && status!=="open") return { ok:false, why:"Only an open thread can be current." };
    if ("title" in f) x.title = f.title.trim();
    if ("notes" in f) x.notes = _str(f.notes);
    if (status!==x.status){
      // Closing from open records the session; between resolved and dropped it stays what the GM set.
      if (status==="open") x.closed = null;
      else if (x.status==="open"){
        const first = sessionList(t)[0];
        x.closed = hasSession(f.closed) ? f.closed : first ? first.id : null;
      } else if ("closed" in f) x.closed = hasSession(f.closed) ? f.closed : null;
      x.status = status;
    } else if (status!=="open" && "closed" in f) x.closed = hasSession(f.closed) ? f.closed : null;
    if (x.status!=="open") x.current = false;
    else if ("current" in f){
      if (f.current===true){ for (const h of _threads(t)) h.current = false; x.current = true; }
      else x.current = false;
    }
    _tableStamp(t, x);
    return { ok:true };
  }
  function removeThread(t, id){
    const h = _threads(t).find(e=>e.id===id);
    if (!h) return { ok:false, why:"No such thread." };
    t.threads.splice(t.threads.indexOf(h), 1);
    _tableStamp(t);
    return { ok:true };
  }
  const _made = (a, b) => { const x = _str(a.created), y = _str(b.created); return x===y ? 0 : x < y ? -1 : 1; };
  // Open first (the current one, then the oldest), then the closed, the latest touched first.
  function threadList(t){
    const all = _threads(t);
    // New threads go on the front of the list, so of two made in one instant the later in it is the older.
    const older = (a, b) => all.indexOf(b) - all.indexOf(a);
    const open = all.filter(h=>h.status==="open").sort((a, b)=>(b.current===true) - (a.current===true) || _made(a, b) || older(a, b));
    const shut = all.filter(h=>h.status!=="open").sort((a, b)=>_made({ created:b.updated }, { created:a.updated }) || older(b, a));
    return open.concat(shut);
  }
  // ── Find (Decision 208) ─────────────────────────────────────────────────
  // One search over the whole table, computed on every call and stored nowhere
  // (constraint 7). Every word must be somewhere in a record; a hit says which
  // field the first word was in and cuts the words around it.
  // The fold the snippet needs: every character keeps its place, so an index in
  // the folded text is an index in the original. A character is lowercased only
  // when its lowercase is as long as it was; no trim.
  function _foldPlace(v){
    let out = "";
    for (const ch of _str(v)){
      if (ch==="‘" || ch==="’" || ch==="ʼ"){ out += "'"; continue; }
      const low = ch.toLowerCase();
      out += low.length===ch.length ? low : ch;
    }
    return out;
  }
  const SNIP_REACH = 60;
  function _snip(text, at, len){
    let before = text.slice(Math.max(0, at - SNIP_REACH), at), after = text.slice(at + len, at + len + SNIP_REACH);
    if (at > SNIP_REACH){
      const i = before.indexOf(" ");
      if (i >= 0) before = before.slice(i + 1);
      before = "…" + before;
    }
    if (at + len + SNIP_REACH < text.length){
      const i = after.lastIndexOf(" ");
      if (i >= 0) after = after.slice(0, i);
      after += "…";
    }
    return { before, hit:text.slice(at, at + len), after };
  }
  // The fields of each record, in the order they are searched: [label, text].
  function _castFields(n){
    const f = [];
    const add = (label, v) => { const s = _str(v); if (s) f.push([label, s]); };
    add("Name", n.name); add("Flavor", n.flavor); add("Description", n.description); add("Origin", n.origin);
    for (const r of _strList(n.npcRoles)) add("Role", r);
    add("Enemy role", n.enemyRole);
    for (const a of _strList(n.affiliations)) add("Affiliation", a);
    add("Motivation", n.motivation); add("Resources", n.resources); add("Line", n.line);
    add("If pushed", n.ifPushed); add("GM note", n.gmNote);
    const b = _isObj(n.block) ? n.block : null;
    if (b){
      for (const k of (Array.isArray(b.traits) ? b.traits : [])) if (_isObj(k)){ add("Trait", k.name); add("Trait", k.text); }
      for (const a of _strList(b.armor)) add("Armor", a);
      for (const g of _strList(b.gear)) add("Gear", g);
    }
    return f;
  }
  function _sessionFields(s){
    const f = [["Session", sessionTitle(s)]];
    for (const p of _strList(s.present)) f.push(["Who was there", p]);
    const j = _isObj(s.journal) ? s.journal : {};
    for (const k of JOURNAL_PARTS) f.push(["journal." + k, _str(j[k])]);
    for (const l of (_isObj(s.close) && Array.isArray(s.close.lines) ? s.close.lines : [])) if (_isObj(l)){
      f.push(["Close-out", _str(l.name)]); f.push(["Close-out", _str(l.note)]);
    }
    return f;
  }
  function _interactionFields(t, x){
    const f = [["What happened", _str(x.text)]];
    for (const c of _strList(x.crew)) f.push(["Crew", c]);
    for (const l of (Array.isArray(x.cast) ? x.cast : [])) f.push(["With", linkName(t, l).name]);
    return f;
  }
  function _encounterFields(t, e){
    const f = [["Encounter", encounterTitle(e)]];
    for (const r of _rowList(e)){
      f.push(["In it", r.kind==="cast" && r.cast ? linkName(t, r.cast).name : _str(r.name)]);
      for (const c of (Array.isArray(r.conditions) ? r.conditions : [])) if (_isObj(c)){
        f.push(["Condition", _str(c.note)]); f.push(["Condition", _str(c.source)]);
      }
    }
    return f;
  }
  const _byMade = list => list.map((x, i)=>({ x, i })).sort((a, b)=>-_made(a.x, b.x) || a.i - b.i).map(e=>e.x);
  function tableSearch(t, q){
    try {
      if (typeof q!=="string" || !_isObj(t)) return [];
      const folded = _foldPlace(q).trim();
      if (folded.length < 2) return [];
      const words = folded.split(/\s+/).filter(Boolean);
      const hits = [];
      const test = (kind, id, title, fields) => {
        const lows = fields.map(([label, text])=>[label, text, _foldPlace(text)]);
        if (!words.every(w=>lows.some(e=>e[2].includes(w)))) return;
        const e = lows.find(x=>x[2].includes(words[0]));
        hits.push({ kind, id, title, field:e[0], snip:_snip(e[1], e[2].indexOf(words[0]), words[0].length) });
      };
      const cast = (Array.isArray(t.cast) ? t.cast : []).filter(_isObj)
        .map((n, i)=>({ n, i, k:_fold(n.name) })).sort((a, b)=>a.k < b.k ? -1 : a.k > b.k ? 1 : a.i - b.i);
      for (const { n } of cast) test("cast", n.id, _str(n.name).trim() || "Unnamed", _castFields(n));
      for (const s of sessionList(t)) test("session", s.id, sessionTitle(s), _sessionFields(s));
      for (const x of _interactions(t).sort(_newest)){
        const first = Array.isArray(x.cast) && x.cast.length ? linkName(t, x.cast[0]).name : _strList(x.crew)[0];
        test("interaction", x.id, first || "A line", _interactionFields(t, x));
      }
      for (const h of threadList(t)) test("thread", h.id, _str(h.title).trim() || "Untitled", [["Thread", _str(h.title)], ["Notes", _str(h.notes)]]);
      for (const n of _byMade(_notes(t))) test("note", n.id, _str(n.title).trim() || "Untitled note", [["Title", _str(n.title)], ["Note", _str(n.text)]]);
      for (const e of _byMade(_encList(t))) test("encounter", e.id, encounterTitle(e), _encounterFields(t, e));
      return hits;
    } catch (e) { return []; }
  }
  // Does a stat block hold a number anywhere: a stat, an authored stat or a skill total?
  function blockHasNumber(b){
    return _isObj(b) && Object.values(_isObj(b.stats) ? b.stats : {}).concat(Object.values(_isObj(b.authored) ? b.authored : {}),
      (Array.isArray(b.skills) ? b.skills : []).map(k=>_isObj(k) ? k.total : null)).some(v=>typeof v==="number");
  }
  // The Sessions tab's top, read every time and never stored (Decision 204).
  function nextSession(t){
    const open = threadList(t).filter(h=>h.status==="open");
    const current = open.find(h=>h.current) || null;
    // Last session is the highest number, unless that one is dated today (and never one dated after it): it's the session being played, so last is the next in the list.
    // A session dated after today is planned, not behind us: it is never last.
    const today = _today(), list = sessionList(t).filter(x=>!x.date || x.date<=today);
    const last = (list[0] && list[0].date===today ? list[1] : list[0]) || null;
    const met = new Set();
    if (last) for (const x of sessionInteractions(t, last.id)) for (const l of (Array.isArray(x.cast) ? x.cast : [])) if (_isObj(l)) met.add(l.id);
    const unbuilt = (Array.isArray(t && t.cast) ? t.cast : []).filter(n=>_isObj(n) && met.has(n.id) && !blockHasNumber(n.block));
    return { current, open:open.filter(h=>h!==current), last, seed:last ? _str(last.journal && last.journal.seed).trim() : "", unbuilt };
  }

  // ── The close-out (Decisions 205–206) ──────────────────────────────────
  // What an off-screen CRANK job pays: the tier's minimum to the midpoint of
  // its range, or to offScreenMax where the book prints no top. Data only.
  function offScreenPay(tierId){
    const k = (crankData().tiers||[]).find(e=>_isObj(e) && e.id===tierId);
    if (!k || !_isObj(k.pay) || !Number.isFinite(k.pay.min)) return null;
    const max = Number.isFinite(k.offScreenMax) ? k.offScreenMax : Number.isFinite(k.pay.max) ? Math.floor((k.pay.min + k.pay.max)/2) : null;
    return max===null ? null : { min:k.pay.min, max };
  }
  // Does a session number bring a Milestone? By the number, never a count of sessions.
  function arcDue(number){
    const r = (D().milestones||{}).rules || {};
    const due = (first, every) => Number.isFinite(first) && Number.isFinite(every) && every>0 && number>=first && (number - first)%every===0;
    if (!Number.isInteger(number) || number<1) return { minor:false, major:false };
    return { minor:due(r.minorFirstAt, r.minorEvery), major:due(r.majorFirstAt, r.majorEvery) };
  }
  // The local day a stamp falls on, for matching a cast member to a session's date.
  function _localDay(iso){
    const d = new Date(iso);
    if (typeof iso!=="string" || isNaN(d)) return null;
    const p = n=>String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  }
  // The close-out sheet's first draft. It proposes; writeCloseOut writes.
  function closeOutDraft(t, id){
    const list = sessionList(t), at = list.findIndex(s=>s.id===id);
    if (at<0) return null;
    const session = list[at];
    const rate = (D().ip||{}).perHour;
    const perHour = Number.isFinite(rate) ? rate : 0;
    const seen = new Set(), present = [];
    for (const name of session.present){
      const k = _fold(name);
      if (seen.has(k)) continue;
      seen.add(k);
      present.push({ name, ip:session.hours===null ? null : Math.ceil(session.hours * perHour), milestone:true });
    }
    // Earlier sessions are the ones after this one in the list; the newest written tier wins.
    const earlier = list.slice(at + 1), tiers = new Map(), absent = [];
    for (const s of earlier){
      for (const name of s.present){
        const k = _fold(name);
        if (seen.has(k)) continue;
        seen.add(k);
        absent.push({ name, key:k });
      }
    }
    for (const s of earlier) if (s.close) for (const l of s.close.lines){
      const k = _fold(l.name);
      if (l.tier && !tiers.has(k)) tiers.set(k, l.tier);
    }
    const away = absent.map(a=>{ const tier = tiers.get(a.key) || null; return { name:a.name, tier, range:tier ? offScreenPay(tier) : null }; });
    const named = new Set();
    for (const x of sessionInteractions(t, id)) for (const l of (Array.isArray(x.cast) ? x.cast : [])) if (_isObj(l)) named.add(l.id);
    const newcomers = (Array.isArray(t && t.cast) ? t.cast : []).filter(n=>_isObj(n)
      && (named.has(n.id) || (session.date && _localDay(n.created)===session.date))
      && !_str(n.motivation).trim() && !_str(n.resources).trim() && !_str(n.line).trim())
      .map(n=>({ id:n.id, name:_str(n.name) }));
    return { session, perHour, present, absent:away, arc:arcDue(session.number),
             threads:threadList(t).filter(h=>h.status==="open"), newcomers };
  }
  // Write the award log: replaces any earlier one. Each line is checked as the gate checks it.
  function writeCloseOut(t, id, f){
    const x = _sessions(t).find(s=>s.id===id);
    if (!x) return { ok:false, why:"No such session." };
    const src = _isObj(f) && Array.isArray(f.lines) ? f.lines.filter(_isObj) : [];
    if (!src.length) return { ok:false, why:"Nobody to write down." };
    const whole = v => _blank(v) ? null : _int(v);
    const tiers = crankData().tiers || [], seen = new Set(), lines = [];
    for (const l of src){
      const name = _str(l.name).trim(), k = _fold(name);
      if (!name || seen.has(k)) return { ok:false, why:"Each line needs its own name." };
      seen.add(k);
      const ip = whole(l.ip), credits = whole(l.credits);
      for (const [field, v] of [["ip", ip], ["credits", credits]])
        if (!_blank(l[field]) && (v===null || v<0)) return { ok:false, why:"Enter a whole number.", field, name };
      const present = l.present===true;
      if (!present && !tiers.some(e=>e.id===l.tier)) return { ok:false, why:"Choose a tier.", field:"tier", name };
      lines.push({ name, present, ip, milestone:present && l.milestone===true, credits,
                   tier:present ? null : l.tier, note:_str(l.note) });
    }
    x.close = { at:new Date().toISOString(), lines };
    _tableStamp(t, x);
    return { ok:true };
  }
  // What each name has been given, summed over every written log. Oldest log first.
  function awardTotals(t){
    const logged = sessionList(t).filter(s=>s.close).reverse()
      .sort((a, b)=>(a.close.at ?? "") < (b.close.at ?? "") ? -1 : (a.close.at ?? "") > (b.close.at ?? "") ? 1 : 0);
    const by = new Map();
    for (const s of logged) for (const l of s.close.lines){
      const k = _fold(l.name);
      if (!by.has(k)) by.set(k, { name:l.name, ip:0, milestones:0, credits:0, sessions:0 });
      const a = by.get(k);
      a.ip += l.ip ?? 0;
      a.credits += l.credits ?? 0;
      if (l.milestone) a.milestones++;
      if (l.present) a.sessions++;
    }
    return [...by.values()];
  }

  // ── Packs (Decisions 180–182) ───────────────────────────────────────────
  // A pack is a book a GM slots in: its own file, .shadows-pack.json, kept in
  // the browser outside every table. migratePack() is its gate. An id is the
  // author's, so a bad one is nothing (never a new one): the pack is refused,
  // the record is dropped. The app never makes a pack.
  const PACK_SCHEMA_VERSION = "0.2";
  const PACK_TRAIT_KINDS = ["universal","origin","signature"];
  const isPackId = v => typeof v==="string" && PACK_ID_RE.test(v);
  const _recordId = v => typeof v==="string" && RECORD_ID_RE.test(v) ? v : null;
  // Coerce a section's records in place: objects with a good id, the first of each id.
  function _packSection(list, fix, idOf){
    const seen = new Set(), out = [];
    for (const r of (Array.isArray(list) ? list : [])){
      if (!_isObj(r)) continue;
      const id = idOf(r.id);
      if (id===null || seen.has(id)) continue;
      seen.add(id);
      r.id = id;
      fix(r);
      out.push(r);
    }
    return out;
  }
  function migratePack(p){
    let c;
    try { c = _isObj(p) ? JSON.parse(JSON.stringify(p)) : {}; } catch (e) { c = {}; }
    if (!_isObj(c.meta)) c.meta = {};
    const m = c.meta;
    m.kind = "shadows-pack";
    if (!(typeof m.id==="string" && PACK_ID_RE.test(m.id))) m.id = null;
    m.name = _str(m.name);
    m.contentVersion = _str(m.contentVersion);
    m.created = _isoOrNull(m.created);
    m.updated = _isoOrNull(m.updated);
    if (!_versionNewer(m.packSchemaVersion, PACK_SCHEMA_VERSION)) m.packSchemaVersion = PACK_SCHEMA_VERSION;
    const named = r => { r.name = _str(r.name); r.text = _str(r.text); };
    // Pack schema 0.2 (Decision 183) adds fields, and every one is gated here on
    // every load. So a 0.1 pack, whatever it carried, needs no step of its own:
    // the stamp above is the whole of 0.1 → 0.2.
    const statIds = new Set(D().stats.map(s=>s.id));
    c.origins = _packSection(c.origins, r=>{
      named(r);
      const src = _isObj(r.modifiers) ? r.modifiers : {}, mods = {};
      for (const k of Object.keys(src)){
        if (!statIds.has(k)) continue;
        const v = _int(src[k]);
        if (v) mods[k] = v;
      }
      r.modifiers = mods;
    }, _recordId);
    c.npcRoles = _packSection(c.npcRoles, named, _recordId);
    c.enemyRoles = _packSection(c.enemyRoles, r=>{ named(r); r.tier = _tier(r.tier); }, _recordId);
    c.tiers = _packSection(c.tiers, r=>{ named(r); r.statGuide = _str(r.statGuide); r.traitGuide = _str(r.traitGuide); }, _tier);
    const originIds = new Set(c.origins.map(o=>o.id)), roleIds = new Set(c.npcRoles.map(o=>o.id)),
          enemyIds = new Set(c.enemyRoles.map(o=>o.id));
    const textKeys = ["ref","name","flavor","description","motivation","resources","line","ifPushed","gmNote"];
    c.entries = _packSection(c.entries, e=>{
      for (const k of textKeys) e[k] = _str(e[k]);
      if (e.kind!=="npc") e.kind = "threat";
      e.origin = typeof e.origin==="string" && originIds.has(e.origin) ? e.origin : null;
      e.npcRoles = [...new Set((Array.isArray(e.npcRoles) ? e.npcRoles : []).filter(x=>typeof x==="string" && roleIds.has(x)))];
      e.enemyRole = typeof e.enemyRole==="string" && enemyIds.has(e.enemyRole) ? e.enemyRole : null;
      e.tier = _tier(e.tier);
      e.block = _block(e.block);
    }, _recordId);
    c.traits = _packSection(c.traits, r=>{
      named(r);
      const k = _str(r.kind).toLowerCase();
      r.kind = PACK_TRAIT_KINDS.includes(k) ? k : null;
      r.origin = typeof r.origin==="string" && originIds.has(r.origin) ? r.origin : null;
    }, _recordId);
    const entryIds = new Set(c.entries.map(e=>e.id));
    c.groups = _packSection(c.groups, g=>{
      for (const k of ["ref","name","situation","tactics"]) g[k] = _str(g[k]);
      g.origin = typeof g.origin==="string" && originIds.has(g.origin) ? g.origin : null;
      g.members = (Array.isArray(g.members) ? g.members : []).filter(x=>_isObj(x) && typeof x.entry==="string" && entryIds.has(x.entry));
      for (const x of g.members) x.count = _tier(x.count) || 1;
    }, _recordId);
    return c;
  }
  function packCheck(p){
    const m = _isObj(p) && _isObj(p.meta) ? p.meta : {};
    const refuse = typeof m.id==="string" && PACK_ID_RE.test(m.id) ? null : "This pack has no id, so it can't be slotted in.";
    const warnings = _versionNewer(m.packSchemaVersion, PACK_SCHEMA_VERSION)
      ? ["This pack was saved by a newer version of the app. What this version doesn't know is kept, but not shown."] : [];
    return { refuse, warnings };
  }
  // Every reader takes a list of packs, so two slotted in at once cost nothing
  // (Decision 182). What isn't a pack, or has no list where a list belongs, is skipped.
  const _packList = packs => (Array.isArray(packs) ? packs : []).filter(p=>_isObj(p) && _isObj(p.meta));
  const _list = v => Array.isArray(v) ? v.filter(_isObj) : [];
  const _byId = (list, id) => _list(list).find(r=>r.id===id) || null;
  const _nameOf = (list, id) => { const r = _byId(list, id); return r ? _str(r.name) : ""; };
  // The words a search and a filter read from an entry: its origin's and roles' names.
  function _entryWords(p, e){
    return { origin:_nameOf(p.origins, e.origin),
             roles:(Array.isArray(e.npcRoles) ? e.npcRoles : []).map(id=>_nameOf(p.npcRoles, id)).filter(Boolean),
             enemy:_nameOf(p.enemyRoles, e.enemyRole) };
  }
  function packFilter(packs, f){
    f = _isObj(f) ? f : {};
    const q = _folded(f.q), origin = _folded(f.origin), role = _folded(f.npcRole), enemy = _folded(f.enemyRole),
          tier = _tier(f.tier), view = f.view==="npc" ? "npc" : "threat", out = [];
    for (const pack of _packList(packs)) for (const entry of _list(pack.entries)){
      if ((entry.kind==="npc" ? "npc" : "threat")!==view) continue;
      const w = _entryWords(pack, entry);
      if (origin && _folded(w.origin)!==origin) continue;
      if (role && !w.roles.some(r=>_folded(r)===role)) continue;
      if (enemy && _folded(w.enemy)!==enemy) continue;
      if (tier!==null && _tier(entry.tier)!==tier) continue;
      if (q && ![entry.name, entry.ref, entry.flavor, w.origin, w.enemy, ...w.roles].some(x=>_fold(x).includes(q))) continue;
      out.push({ pack, entry });
    }
    return out;
  }
  // The choices a filter offers: each name once (case folded), as first spelled, A–Z.
  function packChoices(packs){
    const pick = key => {
      const seen = new Map();
      for (const p of _packList(packs)) for (const r of _list(p[key])){
        const s = _str(r.name).trim(); if (s && !seen.has(_fold(s))) seen.set(_fold(s), s);
      }
      return [...seen.values()].sort((a, b)=>a.toLowerCase().localeCompare(b.toLowerCase()));
    };
    const tiers = new Set();
    for (const p of _packList(packs)){
      for (const r of _list(p.tiers)){ const n = _tier(r.id); if (n!==null) tiers.add(n); }
      for (const e of _list(p.entries)){ const n = _tier(e.tier); if (n!==null) tiers.add(n); }
    }
    const traitOrigins = new Map();
    for (const p of _packList(packs)) for (const t of _list(p.traits)){
      const s = _nameOf(p.origins, t.origin).trim(); if (s && !traitOrigins.has(_fold(s))) traitOrigins.set(_fold(s), s);
    }
    return { origins:pick("origins"), npcRoles:pick("npcRoles"), enemyRoles:pick("enemyRoles"), tiers:[...tiers].sort((a, b)=>a - b),
             traitOrigins:[...traitOrigins.values()].sort((a, b)=>a.toLowerCase().localeCompare(b.toLowerCase())) };
  }
  // The glossary (Decision 185): every slotted pack's traits, packs in the order given and
  // traits in each pack's order. Reads only; nothing it returns is written anywhere.
  function packTraits(packs, f){
    f = _isObj(f) ? f : {};
    const q = _folded(f.q), kind = PACK_TRAIT_KINDS.includes(f.kind) ? f.kind : "", origin = _folded(f.origin), out = [];
    for (const pack of _packList(packs)) for (const trait of _list(pack.traits)){
      if (kind && trait.kind!==kind) continue;
      if (origin && _folded(_nameOf(pack.origins, trait.origin))!==origin) continue;
      if (q && ![trait.name, trait.text].some(x=>_fold(x).includes(q))) continue;
      out.push({ pack, trait });
    }
    return out;
  }
  // What a cast member's page shows beside its fields (Decision 184): each name the member
  // typed matched, folded, against the slotted packs. Read on every draw, stored nowhere. Total.
  function castPackMatch(packs, member){
    const list = _packList(packs), m = _isObj(member) ? member : {};
    const first = (key, test) => {
      for (const pack of list) for (const rec of _list(pack[key])) if (test(rec)) return { pack, rec };
      return null;
    };
    const byName = (key, name) => { const w = _folded(name); return w ? first(key, r=>_folded(r.name)===w) : null; };
    const tierN = _tier(m.tier);
    const traits = (_isObj(m.block) && Array.isArray(m.block.traits) ? m.block.traits : []).filter(_isObj).map(t=>{
      const hit = byName("traits", t.name);
      return { name:_str(t.name), pack:hit ? hit.pack : null, rec:hit ? hit.rec : null };
    });
    // A row with neither name nor text isn't a trait yet (npc()'s rule for a filled one): it stays in `traits`, out of the count.
    const rows = (_isObj(m.block) && Array.isArray(m.block.traits) ? m.block.traits : []).filter(_isObj);
    const counts = { total:0, universal:0, origin:0, signature:0, written:0 };
    traits.forEach((t, i)=>{
      if (!_str(rows[i].name).trim() && !_str(rows[i].text).trim()) return;
      counts.total++;
      counts[t.rec && PACK_TRAIT_KINDS.includes(t.rec.kind) ? t.rec.kind : "written"]++;
    });
    return {
      origin:byName("origins", m.origin),
      npcRoles:_roleList(m.npcRoles).map(name=>{ const hit = byName("npcRoles", name); return { name, pack:hit ? hit.pack : null, rec:hit ? hit.rec : null }; }),
      enemyRole:byName("enemyRoles", m.enemyRole),
      tier:tierN===null ? null : first("tiers", r=>r.id===tierN),
      traits, counts };
  }
  // One entry with its records, not its ids: what a page reads. Null when there isn't one.
  function packEntry(packs, packId, id){
    const pack = _packList(packs).find(p=>p.meta.id===packId);
    const entry = pack ? _byId(pack.entries, id) : null;
    if (!pack || !entry) return null;
    return { pack, entry, origin:_byId(pack.origins, entry.origin),
             npcRoles:(Array.isArray(entry.npcRoles) ? entry.npcRoles : []).map(r=>_byId(pack.npcRoles, r)).filter(Boolean),
             enemyRole:_byId(pack.enemyRoles, entry.enemyRole) };
  }
  function packGroups(packs, f){
    const q = _folded((f||{}).q), out = [];
    for (const pack of _packList(packs)) for (const group of _list(pack.groups)){
      const members = _list(group.members).map(x=>({ entry:_byId(pack.entries, x.entry), count:_tier(x.count) || 1 })).filter(x=>x.entry);
      const origin = _byId(pack.origins, group.origin);
      if (q && ![group.name, group.ref, origin && origin.name, ...members.map(x=>x.entry.name)].some(x=>_fold(x).includes(q))) continue;
      out.push({ pack, group, members });
    }
    return out;
  }
  // ── The Reference (Decision 207) ────────────────────────────────────────
  // What a GM looks up, on one page: each panel a row of `gmReference.panels`. A panel with
  // `from` draws what the data or the slotted packs already hold; one without carries the
  // book's words in `parts`. Read on every draw, stored nowhere. Total: it reports, never throws.
  const _REF_FROM = ["conditions","packs","pain","hits","recovery","weaponTags","crank"];
  const _REF_ID = /^[A-Za-z0-9-]+$/;
  const _refFold = v => _fold(v).replace(/−/g, "-");   // a minus is a minus: only U+2212 folds (SQ7)
  const _refItem = (term, text, more) => ({ term:_str(term), text:_str(text), more:(Array.isArray(more) ? more : []).map(_str).filter(s=>s.trim()) });
  const _refPart = (title, o) => Object.assign({ title:_str(title), text:"", columns:[], rows:[], items:[], footText:"" }, o);
  const _refMod = n => (n<0 ? "−" : "+") + Math.abs(n);
  function _refPacks(packs){
    const list = _packList(packs), multi = list.length>1, parts = [];
    const name = p => multi ? [_str(p.meta.name).trim() || "Untitled pack"] : [];
    const section = (title, key, make) => {
      const items = [];
      for (const p of list) for (const r of _list(p[key])) items.push(make(p, r));
      if (items.length) parts.push(_refPart(title, { items }));
    };
    section("Tiers", "tiers", (p, r)=>{ const n = _tier(r.id);
      return _refItem(_str(r.name).trim() || (n===null ? "Tier" : `Tier ${n}`), r.text, [r.statGuide, r.traitGuide, ...name(p)]); });
    section("Enemy roles", "enemyRoles", (p, r)=>{ const n = _tier(r.tier);
      return _refItem(r.name, r.text, [n===null ? "" : `Tier ${n}`, ...name(p)]); });
    section("NPC roles", "npcRoles", (p, r)=>_refItem(r.name, r.text, name(p)));
    const stats = _list(D().stats).map(s=>s.id);
    section("Origins", "origins", (p, r)=>{
      const m = _isObj(r.modifiers) ? r.modifiers : {};
      const mods = stats.filter(id=>Number.isFinite(m[id]) && m[id]!==0).map(id=>`${id} ${_refMod(m[id])}`).join(" · ");
      return _refItem(r.name, r.text, [mods, ...name(p)]); });
    section("Traits", "traits", (p, r)=>{
      const kind = PACK_TRAIT_KINDS.includes(r.kind) ? r.kind[0].toUpperCase() + r.kind.slice(1) : "";
      const from = r.kind==="origin" ? _nameOf(p.origins, r.origin).trim() : "";
      return _refItem(r.name, r.text, [from ? `${kind} · ${from}` : kind, ...name(p)]); });
    return parts;
  }
  function _refPain(){
    const h = (D().resources||{}).healthLevels || {}, pp = _isObj(h.painPenaltiesPerLevel) ? h.painPenaltiesPerLevel : {};
    const num = [pp.skillChecks, pp.essenceCheckDice, pp.breakerCheckPercent];
    const dice = Math.abs(pp.essenceCheckDice)===1 ? "die" : "dice";
    return [_refPart("", {
      text:num.every(Number.isFinite) ? `Each Pain Level: ${_refMod(num[0])} to Skill Checks, ${_refMod(num[1])} Essence ${dice}, ${_refMod(num[2])}% on Breaker Checks.` : "",
      columns:["Pain Level", "What it means"],
      rows:_list(h.painLevels).map(l=>[_str(l.label), _str(l.description)]),
      footText:_str(pp.notes) })];
  }
  function _refHits(){
    const r = _isObj(D().damageRules) ? D().damageRules : {}, o = k => _isObj(r[k]) ? r[k] : {};
    return [
      _refPart("Shock", { items:[_refItem("", o("shock").text, [o("shock").check])] }),
      _refPart("At zero", { items:[_refItem("", o("atZero").text, [o("atZero").check, o("atZero").freePass && o("atZero").freePass.text])] }),
      _refPart("Massive", { items:[_refItem("", o("massive").text, [])] }),
      _refPart("Dying", { items:[_refItem("", o("whileDying").text, [o("whileDying").resetText, o("whileDying").playerNote])] })];
  }
  function _refRecovery(){
    const r = _isObj(D().recoveryRules) ? D().recoveryRules : {}, o = k => _isObj(r[k]) ? r[k] : {};
    return [
      _refPart("Natural healing", { items:[_refItem("", o("naturalHealing").text, [o("naturalHealing").speedHealText])] }),
      _refPart("Focused healing", { items:[_refItem("", o("focusedHealing").text, [o("focusedHealing").massiveText])] }),
      _refPart("Nanomed Kit", { items:[_refItem("", o("nanomed").text, [o("nanomed").doseText])] })];
  }
  function _refCrank(){
    const c = crankData(), cr = creditSymbol(), n = v => Number(v).toLocaleString("en-US");
    return [_refPart("", {
      text:_str(c.description),
      columns:["Tier", "Rep", "Pays", "Off-screen job"],
      rows:_list(c.tiers).map(t=>{ const off = offScreenPay(t.id);
        return [_str(t.name), Number.isFinite(t.rep) ? String(t.rep) : "", crankPayText(t), off ? `${cr}${n(off.min)}–${n(off.max)}` : ""]; }) })];
  }
  const _REF_READERS = {
    conditions:()=>[
      _refPart("", { items:_list(D().conditions).map(c=>_refItem(c.name, c.effect, [c.recovery, c.playerNote])) }),
      _refPart("How Conditions work", { items:(()=>{ const r = _isObj(D().conditionRules) ? D().conditionRules : {}, o = k => _isObj(r[k]) ? r[k] : {};
        return [r.noStacking, r.helpless, r.painClamp, o("rollPenalty").text, o("penaltyStacking").text].map(_str).filter(s=>s.trim()).map(s=>_refItem("", s, [])); })() })],
    packs:null, pain:_refPain, hits:_refHits, recovery:_refRecovery, crank:_refCrank,
    weaponTags:()=>[_refPart("", { items:_list(D().weaponTagGlossary).map(t=>_refItem(t.id, t.description, [t.playerNote])) })]
  };
  // A data panel's parts, copied and coerced: a cell that isn't a string reads "", a row that isn't a list is dropped.
  function _refBook(parts){
    return _list(parts).map(p=>_refPart(p.title, {
      text:_str(p.text), footText:_str(p.footText),
      columns:(Array.isArray(p.columns) ? p.columns : []).map(_str),
      rows:(Array.isArray(p.rows) ? p.rows : []).filter(Array.isArray).map(r=>r.map(_str)),
      items:_list(p.items).map(i=>_refItem(i.term, i.text, i.more)) }));
  }
  function _refResolve(panel, packs){
    if (!_isObj(panel) || typeof panel.id!=="string" || !_REF_ID.test(panel.id)) return null;
    let parts;
    try {
      if (panel.from===undefined || panel.from===null) parts = _refBook(panel.parts);
      else if (!_REF_FROM.includes(panel.from)) return null;
      else parts = panel.from==="packs" ? _refPacks(packs) : _REF_READERS[panel.from]().filter(p=>p.items.length || p.rows.length || p.text);
    } catch (x) { parts = []; }
    return { id:panel.id, title:_str(panel.title), parts, from:panel.from===undefined ? null : panel.from };
  }
  // The search: folded, with the minus folded. A panel title that matches keeps the whole panel; else a part
  // title, lead, column heading or footnote that matches keeps the whole part; else the rows and items that match.
  function _refFilter(panel, q){
    const has = s => _refFold(s).includes(q);
    if (has(panel.title)) return panel;
    const parts = [];
    for (const p of panel.parts){
      if (has(p.title) || has(p.text) || has(p.footText) || p.columns.some(has)){ parts.push(p); continue; }
      const rows = p.rows.filter(r=>r.some(has)), items = p.items.filter(i=>has(i.term) || has(i.text) || i.more.some(has));
      if (rows.length || items.length) parts.push(Object.assign({}, p, { rows, items, footText:rows.length ? p.footText : "" }));
    }
    return Object.assign({}, panel, { parts });
  }
  function gmReference(packs, f){
    const q = _refFold(_isObj(f) ? f.q : ""), panels = [];
    const data = _isObj(D().gmReference) && Array.isArray(D().gmReference.panels) ? D().gmReference.panels : [];
    for (const raw of data){
      const panel = _refResolve(raw, packs); if (!panel) continue;
      if (!q){ if (panel.parts.length || panel.from==="packs") panels.push(panel); continue; }
      const kept = _refFilter(panel, q);
      if (kept.parts.length) panels.push(kept);
    }
    return panels.map(p=>({ id:p.id, title:p.title, parts:p.parts }));
  }

  // Use (Decision 182): a copy of an entry, first in the cast. Names, not ids,
  // for the origin and roles, since the copy outlives the pack. Never changes
  // with the pack afterwards.
  function _memberFromEntry(t, pack, found, blockSrc){
    const e = found.entry, now = new Date().toISOString();
    const used = new Set(t.cast.map(n=>n.id));
    let block = null;
    try { block = _isObj(blockSrc) ? JSON.parse(JSON.stringify(blockSrc)) : null; } catch (x) {}
    return { id:newCastId(used), name:_str(e.name), flavor:_str(e.flavor), description:_str(e.description),
                origin:found.origin ? _str(found.origin.name) : "", npcRoles:found.npcRoles.map(r=>_str(r.name)).filter(Boolean),
                affiliations:[], enemyRole:found.enemyRole ? _str(found.enemyRole.name) : "", tier:_tier(e.tier),
                motivation:_str(e.motivation), resources:_str(e.resources), line:_str(e.line), ifPushed:_str(e.ifPushed),
                gmNote:_str(e.gmNote), status:"alive", block:_block(block),
                from:{ kind:"entry", pack:pack.meta.id, id:e.id, name:_str(e.name) }, ally:false, created:now, updated:now };
  }
  function castFromEntry(t, pack, id){
    const found = _isObj(pack) && _isObj(pack.meta) ? packEntry([pack], pack.meta.id, id) : null;
    if (!found) return { ok:false, why:"No such entry." };
    const n = _memberFromEntry(t, pack, found, found.entry.block);
    t.cast.unshift(n);
    _tableStamp(t);
    return { ok:true, id:n.id };
  }
  // Where a copy came from, and whether it can still be opened. Never throws.
  function entryLink(packs, from){
    const f = _castFrom(from);
    if (!f) return { name:"", packId:null, id:null, here:false };
    const found = packEntry(packs, f.pack, f.id);
    return { name:_str(f.name).trim() || (found ? _str(found.entry.name) : ""), packId:f.pack, id:f.id, here:!!found };
  }

  // ── Encounters (Decisions 188–190) ──────────────────────────────────────
  // A table keeps its encounters: who is in one, whose turn it is, and what is
  // still on them. An encounter has no type (188). A row stores damage taken and
  // its Conditions; HP left, Health Levels and Pain are derived on every read
  // (constraint 7). Nothing here writes to a pack or a character, and nothing
  // rolls; an encounter writes to the cast only when it ends (Decision 193). The rules it applies are the sheet's, read from the data:
  // conditionKey and addCondition for the Conditions, the Health and Pain
  // bands for the figures, resolveReset's `ongoing` for Reset (Decisions 95,
  // 96, 100).
  const ENCOUNTER_STATUSES = ["planned","running","ended"];
  const ROW_KINDS = ["pc","cast","entry"];
  const _rounds = _tier;   // a whole number of 1 or more, else "until it's dealt with"
  const _encList = t => Array.isArray(t && t.encounters) ? t.encounters.filter(_isObj) : [];
  const _rowList = e => Array.isArray(e && e.rows) ? e.rows.filter(_isObj) : [];
  function newEncounterId(used){
    let id;
    do id = `EN-${randomChars(8)}`; while (used.has(id));
    return id;
  }
  function newRowId(used){
    let id;
    do id = `R-${randomChars(8)}`; while (used.has(id));
    return id;
  }
  // Sides (Decision 210). The crew is always first and keeps the id "crew"; the others are SD- ids.
  const SIDE_ID_RE = /^SD-[0-9A-HJKMNP-TV-Z]{8}$/;
  const MAX_SIDES = 6;
  function newSideId(used){
    let id;
    do id = `SD-${randomChars(8)}`; while (used.has(id));
    return id;
  }
  // The other side a new or old encounter starts with is named from the encounter's own id, so
  // opening the same old table twice gives the same file.
  const _firstOtherId = e => _isObj(e) && typeof e.id==="string" && ENCOUNTER_ID_RE.test(e.id) ? `SD-${e.id.slice(3)}` : newSideId(new Set());
  // An encounter's sides, coerced: the crew first, then at most five others, each once; one other at least.
  // `mint` makes the id of an other side that has to be added.
  function _coerceSides(raw, mint){
    const out = [{ id:"crew", name:"" }], seen = new Set(["crew"]);
    for (const s of (Array.isArray(raw) ? raw : [])){
      if (out.length >= MAX_SIDES) break;
      if (!_isObj(s) || typeof s.id!=="string" || !SIDE_ID_RE.test(s.id) || seen.has(s.id)) continue;
      seen.add(s.id);
      out.push({ id:s.id, name:_str(s.name) });
    }
    if (out.length===1) out.push({ id:mint(seen), name:"" });
    return out;
  }
  const _sideList = e => _coerceSides(e && e.sides, ()=>"SD-00000000");
  const _otherSide = e => _sideList(e)[1].id;
  // A row's side, read: its own when that is one of the encounter's, else by its kind.
  function _rowSide(e, sides, r){
    if (typeof r.side==="string" && sides.some(s=>s.id===r.side)) return r.side;
    return r.kind==="pc" ? "crew" : sides[1].id;
  }
  // A side's name as the screen shows it; a blank one reads by its place (SQ11).
  function sideTitle(e, id){
    const sides = _sideList(e), i = sides.findIndex(s=>s.id===id);
    if (i < 0) return "";
    if (i===0) return "The crew";
    return _str(sides[i].name).trim() || (i===1 ? "The other side" : `Side ${i + 1}`);
  }
  // A row's Conditions, coerced: the character's entry shape plus a source and rounds.
  // One entry per conditionKey, the first kept.
  function _rowConditions(list){
    const out = [], seen = new Set();
    for (const e of (Array.isArray(list) ? list : [])){
      if (!_isObj(e) || typeof e.id!=="string") continue;
      const def = conditionById(e.id);
      if (!def) continue;
      const c = { id:def.id };
      if (def.location){
        if (typeof e.location==="string" && locationById(e.location)) c.location = e.location;
        else continue;
      }
      if (def.counter){
        const m = _int(e.marks);
        c.marks = Math.max(0, Math.min(def.counter.max||0, m===null ? 0 : m));
      }
      if (typeof e.note==="string" && e.note) c.note = e.note;
      c.source = _str(e.source);
      c.rounds = _rounds(e.rounds);
      const key = conditionKey(c);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  }
  // One row, coerced in place (Decision 188). `used` holds the row ids taken in this encounter.
  function _encRow(r, used){
    r.kind = ROW_KINDS.includes(r.kind) ? r.kind : "pc";
    if (!(typeof r.id==="string" && ROW_ID_RE.test(r.id)) || used.has(r.id)) r.id = newRowId(used);
    used.add(r.id);
    r.name = _str(r.name);
    const link = _castLinks([r.cast])[0];
    r.cast = r.kind==="cast" && link ? link : null;
    r.from = r.kind==="entry" ? _castFrom(r.from) : null;
    r.block = r.kind==="entry" ? _block(r.block) : null;
    // Schema 0.7 (Decision 193): the member an entry row was kept as. A link, with the name it had.
    const kept = _castLinks([r.kept])[0];
    r.kept = r.kind==="entry" && kept ? kept : null;
    // Hit at all, by the armor or the body: whoever was rolls for wear after the fight (0530). Never cleared by Heal.
    r.struck = r.struck===true;
    r.order = _int(r.order);
    r.last = r.last===true;
    r.out = r.out===true;
    const d = _int(r.damage);
    r.damage = d!==null && d > 0 ? d : 0;
    const pc = r.kind==="pc";
    r.hp = pc ? _tier(r.hp) : null;
    r.levels = pc ? _tier(r.levels) : null;
    r.awareness = pc ? _int(r.awareness) : null;
    r.conditions = _rowConditions(r.conditions);
    // Schema 0.6 (Decision 191). The readers cap these (hlState, armorPiece), so no cap here.
    const wholeOrZero = v => { const n = _int(v); return n!==null && n > 0 ? n : 0; };
    r.massive = wholeOrZero(r.massive);
    r.armorLoss = pc ? 0 : wholeOrZero(r.armorLoss);
    r.scrapped = !pc && r.scrapped===true;
    // The piece the wear belongs to, so a block edited to another piece doesn't inherit it.
    r.armorId = !pc && typeof r.armorId==="string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(r.armorId) ? r.armorId : null;
  }
  // The gate for t.encounters: called by migrateTable on every load.
  function _encounters(c){
    const used = new Set();
    c.encounters = (Array.isArray(c.encounters) ? c.encounters : []).filter(_isObj);
    for (const e of c.encounters){
      if (!(typeof e.id==="string" && ENCOUNTER_ID_RE.test(e.id)) || used.has(e.id)) e.id = newEncounterId(used);
      used.add(e.id);
      e.name = _str(e.name);
      if (!ENCOUNTER_STATUSES.includes(e.status)) e.status = "planned";
      const round = _int(e.round);
      e.round = round!==null && round > 0 ? round : 0;
      const usedRows = new Set();
      e.rows = (Array.isArray(e.rows) ? e.rows : []).filter(_isObj);
      for (const r of e.rows) _encRow(r, usedRows);
      // Schema 0.11 (Decision 210): how it runs, its sides, and the side each row is on.
      e.by = e.by==="wave" ? "wave" : "person";
      e.sides = _coerceSides(e.sides, ()=>_firstOtherId(e));
      for (const r of e.rows) r.side = _rowSide(e, e.sides, r);
      // A member is in an encounter once: a second row for one becomes a PC row with its name.
      const inIt = new Set();
      for (const r of e.rows) if (r.kind==="cast" && r.cast){
        if (inIt.has(r.cast.id)){ r.kind = "pc"; r.name = r.name.trim() ? r.name : _str(r.cast.name); r.cast = null; }
        else inIt.add(r.cast.id);
      }
      e.created = _isoOrNull(e.created);
      e.updated = _isoOrNull(e.updated);
    }
    // One running at most: the newest keeps going, the rest are ended, none dropped.
    const running = c.encounters.filter(e=>e.status==="running");
    if (running.length > 1){
      const when = e => { const n = Date.parse(e.updated); return Number.isFinite(n) ? n : -Infinity; };
      let keep = running[0];
      for (const e of running) if (when(e) > when(keep)) keep = e;
      for (const e of running) if (e!==keep) e.status = "ended";
    }
    for (const e of c.encounters){
      const live = e.status==="running";
      e.turn = live && typeof e.turn==="string" && e.rows.some(r=>r.id===e.turn) ? e.turn : null;
      // Who has acted this round: only while running, existing rows, each once.
      e.acted = live ? [...new Set((Array.isArray(e.acted) ? e.acted : []).filter(id=>typeof id==="string" && e.rows.some(r=>r.id===id)))] : [];
      if (live && e.round < 1) e.round = 1;
    }
  }

  // A name the GM left blank reads as the day it was made.
  function encounterTitle(e){
    const n = _str(e && e.name).trim();
    if (n) return n;
    const day = _str(e && e.created).slice(0, 10);
    return day ? `Encounter ${day}` : "Encounter";
  }
  const _enc = (t, id) => _encList(t).find(e=>e.id===id) || null;
  // The encounter to write to: it exists and hasn't ended.
  function _live(t, encId){
    const e = _enc(t, encId);
    if (!e) return { why:"No such encounter." };
    if (e.status==="ended") return { why:`${encounterTitle(e)} has ended.` };
    return { e };
  }
  function _liveRow(t, encId, rowId){
    const l = _live(t, encId);
    if (l.why) return l;
    const r = _rowList(l.e).find(x=>x.id===rowId);
    return r ? { e:l.e, r } : { why:"No such row." };
  }
  function runningEncounter(t){ return _encList(t).find(e=>e.status==="running") || null; }

  function addEncounter(t, f){
    if (!Array.isArray(t.encounters)) t.encounters = [];
    const now = new Date().toISOString();
    const used = new Set(t.encounters.map(e=>e && e.id));
    const e = { id:newEncounterId(used), name:_str((f||{}).name).trim(), status:"planned", round:0, turn:null, acted:[], rows:[], created:now, updated:now };
    e.by = "person"; e.sides = [{ id:"crew", name:"" }, { id:_firstOtherId(e), name:"" }];
    t.encounters.unshift(e);
    _tableStamp(t);
    return { ok:true, id:e.id };
  }
  function editEncounter(t, id, f){
    const l = _live(t, id);
    if (l.why) return { ok:false, why:l.why };
    // A refused press writes nothing, the stamp included.
    if (_isObj(f) && "by" in f && f.by!=="person" && f.by!=="wave") return { ok:false, why:"Choose one at a time or Wave Initiative." };
    if (_isObj(f) && "name" in f) l.e.name = _str(f.name);
    // The turn, who has acted and the round are never touched: the turn follows who has acted (189, 210).
    if (_isObj(f) && "by" in f) l.e.by = f.by;
    _tableStamp(t, l.e);
    return { ok:true };
  }
  // Sides (Decision 210). Every writer refuses before it writes.
  function addSide(t, encId, f){
    const l = _live(t, encId);
    if (l.why) return { ok:false, why:l.why };
    const sides = _sideList(l.e);
    if (sides.length >= MAX_SIDES) return { ok:false, why:"Six sides at most." };
    const id = newSideId(new Set(sides.map(s=>s.id)));
    l.e.sides = sides.concat([{ id, name:_str((f||{}).name).trim() }]);
    _tableStamp(t, l.e);
    return { ok:true, id };
  }
  function renameSide(t, encId, sideId, name){
    const l = _live(t, encId);
    if (l.why) return { ok:false, why:l.why };
    if (sideId==="crew") return { ok:false, why:"The crew keeps its name." };
    const sides = _sideList(l.e), s = sides.find(x=>x.id===sideId);
    if (!s) return { ok:false, why:"No such side." };
    s.name = _str(name);
    l.e.sides = sides;
    _tableStamp(t, l.e);
    return { ok:true };
  }
  // Its rows move to the first other side left (SQ9).
  function removeSide(t, encId, sideId){
    const l = _live(t, encId);
    if (l.why) return { ok:false, why:l.why };
    if (sideId==="crew") return { ok:false, why:"The crew stays." };
    const sides = _sideList(l.e);
    if (!sides.some(s=>s.id===sideId)) return { ok:false, why:"No such side." };
    if (sides.length < 3) return { ok:false, why:"A fight needs another side." };
    const left = sides.filter(s=>s.id!==sideId), to = left[1].id;
    let moved = 0;
    for (const r of _rowList(l.e)) if (_rowSide(l.e, sides, r)===sideId){ r.side = to; moved++; }
    l.e.sides = left;
    _tableStamp(t, l.e);
    return { ok:true, moved };
  }
  // The one writer that works on an ended encounter: Delete.
  function removeEncounter(t, id){
    const i = Array.isArray(t && t.encounters) ? t.encounters.findIndex(e=>_isObj(e) && e.id===id) : -1;
    if (i < 0) return { ok:false, why:"No such encounter." };
    t.encounters.splice(i, 1);
    _tableStamp(t);
    return { ok:true };
  }

  // The order shown (Decisions 189, 210). One at a time: Combat Sense highest first, a row with no
  // result after those that have one in the order added, and Goes last after everyone by the same rule.
  // Wave Initiative: the sides go first, the side holding the best result first (a side with none after
  // those that have one, in list order), and within a side the same rule. A side's best leaves out a row
  // that is Out or Goes last (SQ8) unless it has acted this round, so a row knocked out or pulled back
  // halfway through its side's wave doesn't split the wave. Ties are shown, never broken: between rows one at a time, between
  // sides' bests in waves. A stable sort keeps the order added.
  function _encOrder(e){
    if (!_isObj(e)) return { rows:[], tied:()=>false, sides:[] };
    const rows = _rowList(e), wave = e.by==="wave", sides = _sideList(e);
    const mine = new Map(sides.map(s=>[s.id, []]));
    const of = new Map();
    for (const r of rows){ const id = _rowSide(e, sides, r); of.set(r, id); mine.get(id).push(r); }
    const acted = new Set(_actedIds(e));
    const info = sides.map((s, i)=>{
      let best = null;
      for (const r of mine.get(s.id)) if ((!(r.out || r.last) || acted.has(r.id)) && r.order!==null && (best===null || r.order > best)) best = r.order;
      return { id:s.id, i, best };
    });
    const placed = wave ? info.slice().sort((a, b)=>(a.best===null) - (b.best===null) || (a.best!==null ? b.best - a.best : 0) || a.i - b.i) : info;
    const place = new Map(placed.map((s, p)=>[s.id, p]));
    const key = r => [wave ? place.get(of.get(r)) : 0, r.last ? 1 : 0, r.order===null ? 1 : 0, r.order===null ? 0 : -r.order];
    const sorted = rows.map((r, i)=>({ r, i })).sort((a, b)=>{
      const x = key(a.r), y = key(b.r);
      for (let k = 0; k < 4; k++) if (x[k]!==y[k]) return x[k] - y[k];
      return a.i - b.i;
    }).map(o=>o.r);
    const count = new Map();
    for (const r of rows) if (!r.last && r.order!==null) count.set(r.order, (count.get(r.order)||0) + 1);
    const bests = new Map();
    for (const s of info) if (s.best!==null) bests.set(s.best, (bests.get(s.best)||0) + 1);
    return { rows:sorted,
             tied:r => !wave && !r.last && r.order!==null && count.get(r.order) > 1,
             sides:placed.map(s=>({ id:s.id, title:sideTitle(e, s.id), best:s.best, tied:wave && s.best!==null && bests.get(s.best) > 1,
                                    rowIds:sorted.filter(r=>of.get(r)===s.id).map(r=>r.id) })) };
  }

  function addParticipant(t, encId, f){
    const l = _live(t, encId);
    if (l.why) return { ok:false, why:l.why };
    f = _isObj(f) ? f : {};
    const used = new Set(_rowList(l.e).map(r=>r.id)), row = { id:newRowId(used), kind:"pc", name:"", cast:null, from:null, block:null, kept:null, struck:false,
      order:null, last:false, out:false, damage:0, massive:0, armorLoss:0, scrapped:false, armorId:null, hp:null, levels:null, awareness:null, conditions:[], side:"crew" };
    if (f.kind==="cast"){
      const m = (Array.isArray(t.cast) ? t.cast : []).find(n=>_isObj(n) && n.id===f.id);
      if (!m) return { ok:false, why:"No such cast member." };
      if (_rowList(l.e).some(r=>r.kind==="cast" && _isObj(r.cast) && r.cast.id===m.id)) return { ok:false, why:"Already in." };
      const name = _str(m.name).trim() || "Unnamed";
      row.kind = "cast"; row.name = name; row.cast = { kind:"cast", id:m.id, name };
      if (m.ally!==true) row.side = _otherSide(l.e);
    } else {
      const name = _str(f.name).trim();
      if (!name) return { ok:false, why:"Name them first." };
      row.name = name;
    }
    l.e.rows.push(row);
    _tableStamp(t, l.e);
    return { ok:true, id:row.id };
  }
  // The first of "X", "X 2", "X 3"… that no row in the encounter has.
  function _numbered(e, base){
    const taken = new Set(_rowList(e).map(r=>r.name));
    let name = base;
    for (let n = 2; taken.has(name); n++) name = `${base} ${n}`;
    return name;
  }
  // An entry row is its own copy of the entry's block (Decision 188), as castFromEntry's is,
  // so two copies never share one and the pack is never touched.
  function _entryRow(e, pack, entry){
    let block = null;
    try { block = _isObj(entry.block) ? JSON.parse(JSON.stringify(entry.block)) : null; } catch (x) {}
    const used = new Set(_rowList(e).map(r=>r.id)), base = _str(entry.name).trim() || "Unnamed";
    return { id:newRowId(used), kind:"entry", name:_numbered(e, base), cast:null,
             from:{ kind:"entry", pack:pack.meta.id, id:entry.id, name:_str(entry.name) }, block:_block(block), kept:null, struck:false,
             order:null, last:false, out:false, damage:0, massive:0, armorLoss:0, scrapped:false, armorId:null, hp:null, levels:null, awareness:null, conditions:[], side:_otherSide(e) };
  }
  function participantFromEntry(t, encId, pack, entryId){
    const l = _live(t, encId);
    if (l.why) return { ok:false, why:l.why };
    const found = _isObj(pack) && _isObj(pack.meta) ? packEntry([pack], pack.meta.id, entryId) : null;
    if (!found) return { ok:false, why:"No such entry." };
    const row = _entryRow(l.e, pack, found.entry);
    l.e.rows.push(row);
    _tableStamp(t, l.e);
    return { ok:true, id:row.id };
  }
  function participantsFromGroup(t, encId, pack, groupId){
    const l = _live(t, encId);
    if (l.why) return { ok:false, why:l.why };
    const hit = _isObj(pack) && _isObj(pack.meta) ? packGroups([pack], {}).find(x=>x.group.id===groupId) : null;
    if (!hit) return { ok:false, why:"No such group." };
    if (!hit.members.length) return { ok:false, why:"Nobody in that group can be found." };
    const ids = [];
    for (const m of hit.members) for (let i = 0; i < m.count; i++){
      const row = _entryRow(l.e, pack, m.entry);
      l.e.rows.push(row);
      ids.push(row.id);
    }
    _tableStamp(t, l.e);
    return { ok:true, ids };
  }
  // Which encounter an Add to button means (Decision 211): the one open on the tab if it hasn't
  // ended, else the running one, else the newest planned (by created, ties to the earlier in the list).
  // Read-only and total; the button's label is computed from it on every draw, never stored.
  function encounterFor(t, openId){
    const list = _encList(t), open = typeof openId==="string" ? list.find(e=>e.id===openId) : null;
    if (open && open.status!=="ended") return open;
    const running = list.find(e=>e.status==="running");
    if (running) return running;
    let best = null;
    for (const e of list){
      if (e.status!=="planned") continue;
      if (!best || _str(e.created) > _str(best.created)) best = e;
    }
    return best;
  }
  // The one writer behind every Add to (Decision 211). Resolves what's being added, then finds the
  // encounter or makes one, then adds through the existing writers. A refusal writes nothing, the
  // new encounter and the stamp included.
  function addToEncounter(t, openId, src, packs){
    if (!_isObj(t) || !_isObj(t.meta)) return { ok:false, why:"Nothing to add." };
    src = _isObj(src) ? src : {};
    let pack = null, hit = null;
    const target = encounterFor(t, openId);
    if (src.kind==="cast"){
      const m = (Array.isArray(t.cast) ? t.cast : []).find(n=>_isObj(n) && n.id===src.id);
      if (!m) return { ok:false, why:"No such cast member." };
      if (target && _rowList(target).some(r=>r.kind==="cast" && _isObj(r.cast) && r.cast.id===m.id)) return { ok:false, why:"Already in." };
    } else if (src.kind==="entry"){
      hit = packEntry(packs, src.pack, src.id);
      if (!hit) return { ok:false, why:"No such entry." };
      pack = hit.pack;
    } else if (src.kind==="group"){
      const g = packGroups(packs, {}).find(x=>x.pack.meta.id===src.pack && x.group.id===src.id);
      if (!g) return { ok:false, why:"No such group." };
      if (!g.members.length) return { ok:false, why:"Nobody in that group can be found." };
      pack = g.pack;
    } else return { ok:false, why:"Nothing to add." };
    let encId = target ? target.id : null, made = false;
    if (!encId){ encId = addEncounter(t, {}).id; made = true; }
    const r = src.kind==="cast" ? addParticipant(t, encId, { kind:"cast", id:src.id })
            : src.kind==="entry" ? participantFromEntry(t, encId, pack, src.id)
            : participantsFromGroup(t, encId, pack, src.id);
    if (!r.ok) return r;
    return { ok:true, encId, ids:r.ids || [r.id], made };
  }
  function editParticipant(t, encId, rowId, f){
    const l = _liveRow(t, encId, rowId);
    if (l.why) return { ok:false, why:l.why };
    const r = l.r;
    // A refused press writes nothing, the stamp included.
    if (_isObj(f) && "side" in f && !_sideList(l.e).some(s=>s.id===f.side)) return { ok:false, why:"No such side." };
    if (_isObj(f)){
      if ("side" in f) r.side = f.side;
      if ("name" in f) r.name = _str(f.name);
      if ("order" in f) r.order = _int(f.order);
      if ("last" in f) r.last = f.last===true;
      if ("out" in f) r.out = f.out===true;
      if (r.kind==="pc"){
        if ("hp" in f) r.hp = _tier(f.hp);
        if ("levels" in f) r.levels = _tier(f.levels);
        if ("awareness" in f) r.awareness = _int(f.awareness);
      }
    }
    _tableStamp(t, l.e);
    return { ok:true };
  }
  // The next to act: the first row in the order shown that is neither out nor has acted this round.
  // The turn follows who has acted, not a place in the sort, so a result changed mid-round
  // can neither skip a row nor let one act twice (Decision 189).
  const _actedIds = e => Array.isArray(e.acted) ? e.acted : [];
  function _pick(e){
    return _encOrder(e).rows.find(r=>!r.out && !_actedIds(e).includes(r.id)) || null;
  }
  function removeParticipant(t, encId, rowId){
    const l = _liveRow(t, encId, rowId);
    if (l.why) return { ok:false, why:l.why };
    const e = l.e;
    e.rows.splice(e.rows.indexOf(l.r), 1);
    e.acted = _actedIds(e).filter(id=>id!==rowId);
    if (e.turn===rowId){ const n = _pick(e); e.turn = n ? n.id : null; }
    _tableStamp(t, e);
    return { ok:true };
  }
  // HP straight onto a row: no armor, no Shock (Decision 189). A negative number heals.
  function participantDamage(t, encId, rowId, n){
    const l = _liveRow(t, encId, rowId);
    if (l.why) return { ok:false, why:l.why };
    const v = typeof n==="number" || typeof n==="string" ? _int(n) : null;
    if (v===null) return { ok:false, why:"Enter a whole number." };
    l.r.damage = Math.max(0, l.r.damage + v);
    if (v > 0) l.r.struck = true;
    _tableStamp(t, l.e);
    return { ok:true };
  }
  // The sheet's Conditions rule, run on the row's list: addCondition's refusals, word for word.
  const _condShim = r => ({ trackers:{ conditions:r.conditions } });
  function participantAddCondition(t, encId, rowId, entry){
    const l = _liveRow(t, encId, rowId);
    if (l.why) return { ok:false, why:l.why };
    const res = addCondition(_condShim(l.r), entry);
    if (!res.ok) return res;
    const c = l.r.conditions[l.r.conditions.length - 1];
    c.source = _str(entry.source).trim();
    c.rounds = _rounds(entry.rounds);
    _tableStamp(t, l.e);
    return { ok:true };
  }
  function participantRemoveCondition(t, encId, rowId, index){
    const l = _liveRow(t, encId, rowId);
    if (l.why) return { ok:false, why:l.why };
    const res = removeCondition(_condShim(l.r), index);
    if (res.ok) _tableStamp(t, l.e);
    return res;
  }
  function participantConditionMarks(t, encId, rowId, index, marks){
    const l = _liveRow(t, encId, rowId);
    if (l.why) return { ok:false, why:l.why };
    const res = setConditionMarks(_condShim(l.r), index, marks);
    if (res.ok) _tableStamp(t, l.e);
    return res;
  }

  function startEncounter(t, encId){
    const l = _live(t, encId);
    if (l.why) return { ok:false, why:l.why };
    const e = l.e;
    if (e.status!=="planned") return { ok:false, why:`${encounterTitle(e)} is already running.` };
    const other = runningEncounter(t);
    if (other) return { ok:false, why:`${encounterTitle(other)} is still running. End it first.` };
    const first = _pick(Object.assign({}, e, { acted:[] }));
    if (!first) return { ok:false, why:"Add someone to the encounter first." };
    e.status = "running"; e.round = 1; e.turn = first.id; e.acted = [];
    _tableStamp(t, e);
    return { ok:true };
  }
  function nextTurn(t, encId){
    const l = _live(t, encId);
    if (l.why) return { ok:false, why:l.why };
    const e = l.e;
    if (e.status!=="running") return { ok:false, why:`${encounterTitle(e)} isn't running.` };
    if (e.turn===null) return { ok:false, why:"Finish the round first." };
    if (!_actedIds(e).includes(e.turn)) e.acted = [..._actedIds(e), e.turn];
    const n = _pick(e);
    e.turn = n ? n.id : null;
    _tableStamp(t, e);
    return n ? { ok:true } : { ok:true, reset:true };
  }
  function setTurn(t, encId, rowId){
    const l = _liveRow(t, encId, rowId);
    if (l.why) return { ok:false, why:l.why };
    if (l.e.status!=="running") return { ok:false, why:`${encounterTitle(l.e)} isn't running.` };
    if (l.e.turn===null) return { ok:false, why:"Finish the round first." };
    if (l.r.out) return { ok:false, why:`${l.r.name.trim() || "They"} are out of it.` };
    l.e.turn = l.r.id;
    _tableStamp(t, l.e);
    return { ok:true };
  }

  // Reset, row by row (Decision 189), with resolveReset's rule read from the same data:
  // `ongoing` ticks (a number entered for a source), the Conditions whose rounds run out
  // now, every other Condition's recovery as the save to call, and Dying's check by name.
  // `input`: { sources: { [row id]: { [condition index]: hp } } }. Pure.
  function resolveEncounterReset(t, encId, input){
    const e = _enc(t, encId);
    if (!e) return { ok:false, why:"No such encounter." };
    if (e.status!=="running") return { ok:false, why:`${encounterTitle(e)} isn't running.` };
    const W = (D().damageRules||{}).whileDying || {};
    const src = _isObj(input) && _isObj(input.sources) ? input.sources : {};
    const rows = [];
    let missing = null;   // the first tick with no number: the rows are still all drawn, so the screen can ask
    for (const r of _encOrder(e).rows){
      const mine = _isObj(src[r.id]) ? src[r.id] : {};
      const ticks = [], expiring = [], recovery = [];
      let hasDying = false, dyingIndex = null;
      r.conditions.forEach((c, index)=>{
        const def = conditionById(c.id);
        if (!def) return;
        const loc = c.location ? locationById(c.location) : null, name = def.name + (loc ? ` (${loc.name})` : "");
        if (W.condition && def.id===W.condition){ hasDying = true; dyingIndex = index; }
        const o = def.ongoing;
        if (o){
          const v = o.source ? mine[index] : o.hp;
          ticks.push({ index, id:def.id, name:def.name, source:!!o.source, hp:v==null || v==="" ? null : nonNegInt(v) });
        }
        if (c.rounds===1) expiring.push({ index, id:def.id, name, source:c.source });
        else if (_str(def.recovery).trim()) recovery.push({ index, id:def.id, name, recovery:def.recovery, source:c.source });
      });
      const gap = ticks.find(x=>x.hp===null);
      if (gap && !missing) missing = { tick:gap, rowName:r.name };
      // F24's stub, as resolveReset has it: while Dying, each source that ticks is a Death Mark and
      // stands in for the check; with nothing ticking, the check is asked. The marks are the GM's to press.
      const dyingMarks = hasDying ? ticks.filter(x=>x.hp > 0).length : 0;
      const dying = hasDying && !dyingMarks ? _str(W.resetCheck) || null : null;
      const dyingText = dyingMarks ? _str(W.text) : null;
      rows.push({ rowId:r.id, name:r.name, ticks, expiring, recovery, dying, dyingMarks, dyingText, dyingIndex,
                  total:ticks.reduce((n, x)=>n + (x.hp||0), 0) });
    }
    if (missing) return { ok:false, why:`Enter this round's ${missing.tick.name} damage for ${missing.rowName.trim() || "them"}. Put 0 if it's out.`, rows };
    return { ok:true, round:e.round, rows };
  }
  // The one writer, re-resolving from its inputs like applyReset. `choices`: { keep: [[row id, index]] }.
  function applyEncounterReset(t, encId, input, choices){
    const res = resolveEncounterReset(t, encId, input);
    if (!res.ok) return res;
    const e = _enc(t, encId);
    if (e.turn!==null) return { ok:false, why:"The round isn't over yet." };
    if (!_pick(Object.assign({}, e, { acted:[] }))) return { ok:false, why:"Everyone's out. Bring someone back or end the encounter." };
    const keep = new Set((_isObj(choices) && Array.isArray(choices.keep) ? choices.keep : [])
      .filter(k=>Array.isArray(k) && typeof k[0]==="string").map(k=>`${k[0]}|${k[1]}`));
    for (const out of res.rows){
      const r = _rowList(e).find(x=>x.id===out.rowId);
      r.damage += out.total;
      const gone = [];
      r.conditions.forEach((c, i)=>{
        if (c.rounds===null) return;
        if (c.rounds===1 && !keep.has(`${r.id}|${i}`)) gone.push(i);
        else c.rounds = c.rounds===1 ? 1 : c.rounds - 1;
      });
      for (const i of gone.reverse()) r.conditions.splice(i, 1);
    }
    e.round += 1;
    e.acted = [];
    const first = _pick(e);
    e.turn = first ? first.id : null;
    _tableStamp(t, e);
    return { ok:true, round:e.round };
  }
  // ── The encounter's end (Decision 193) ──────────────────────────────────
  // The wrap-up reads how each non-PC row ended; endEncounter with a wrap writes
  // it all at once: the end, the kept members, the statuses and the lines, or nothing.
  const _titleCase = k => _str(k).charAt(0).toUpperCase() + _str(k).slice(1);
  function _wearDice(){
    const dice = (D().armorRules||{}).integrityLossByDifficulty || {};
    return Object.keys(dice).map(id=>({ id, name:_titleCase(id), die:dice[id] }));
  }
  // The default text of a fight's line, from a row's ended figures.
  function _endLine(t, e, ended){
    const conds = ended.conditions.length ? `; ${ended.conditions.join(", ")}` : "";
    const hl = ended.levels!==null ? `: ${Math.max(0, ended.levelsLeft)} of ${ended.levels} Health Levels left${ended.down ? ", Down" : ""}` : "";
    return `Fought them in ${encounterTitle(e)}${hl}${conds}.`;
  }
  function encounterWrapUp(t, encId){
    const out = { rows:[], crew:[], dice:_wearDice(), hit:[] };
    const e = _enc(t, encId);
    if (!e || e.status!=="running") return out;
    const view = encounterView(t, encId);
    for (const v of view.rows){
      const r = v.row;
      if (r.kind==="pc"){
        const nm = _str(r.name).trim();
        if (nm) out.crew.push(nm);
        if (r.struck || r.damage > 0 || r.massive > 0) out.hit.push({ id:r.id, name:v.name });
        continue;
      }
      const h = v.health;
      const ended = { left:h.left, levels:h.levels, levelsLeft:h.levelsLeft, down:h.down, gone:h.gone, conditions:v.conditions.map(c=>c.name) };
      const m = r.kind==="cast" && _isObj(r.cast) ? (Array.isArray(t.cast) ? t.cast : []).find(n=>_isObj(n) && n.id===r.cast.id) : null;
      out.rows.push({ row:r, kind:r.kind, name:v.name, gone:r.kind==="cast" && !m, ended,
                      status:m ? m.status : "alive", line:_endLine(t, e, ended) });
    }
    return out;
  }
  // A cast member from an entry row: the row's own name and block, and the entry's text when its pack is slotted.
  function castFromRow(t, packs, r, name){
    const from = _castFrom(r.from);
    const pack = from ? (Array.isArray(packs) ? packs : []).find(p=>_isObj(p) && _isObj(p.meta) && p.meta.id===from.pack) : null;
    const found = pack ? packEntry([pack], from.pack, from.id) : null;
    let n;
    if (found) n = _memberFromEntry(t, pack, found, r.block);
    else {
      const now = new Date().toISOString(), used = new Set(t.cast.map(c=>c.id));
      let block = null;
      try { block = _isObj(r.block) ? JSON.parse(JSON.stringify(r.block)) : null; } catch (x) {}
      n = { id:newCastId(used), name:"", flavor:"", description:"", origin:"", npcRoles:[], affiliations:[], enemyRole:"", tier:null,
            motivation:"", resources:"", line:"", ifPushed:"", gmNote:"", status:"alive", block:_block(block), from, created:now, updated:now };
    }
    n.name = _str(name).trim() || _str(r.name).trim();
    n.from = from;
    t.cast.unshift(n);
    return n;
  }
  const _today = () => { const d = new Date(), p = n=>String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
  function endEncounter(t, encId, wrap, packs){
    const l = _live(t, encId);
    if (l.why) return { ok:false, why:l.why };
    const e = l.e;
    if (wrap===undefined || wrap===null){
      e.status = "ended"; e.turn = null;
      _tableStamp(t, e);
      return { ok:true };
    }
    if (e.status!=="running") return { ok:false, why:"It hasn't started, so there's nothing to wrap up." };
    const ups = encounterWrapUp(t, encId), asked = _isObj(wrap) && _isObj(wrap.rows) ? wrap.rows : {};
    // Validate every row before anything is written.
    const plan = [];
    for (const u of ups.rows){
      const w = asked[u.row.id];
      if (!_isObj(w)) continue;
      const keep = w.keep===true;
      if (keep && u.kind!=="entry") return { ok:false, why:"Only a copy from a pack can be kept." };
      const takesStatus = u.kind==="cast" ? !u.gone : keep;
      const hasStatus = w.status!==undefined && w.status!==null && w.status!=="";
      if (takesStatus && hasStatus && !CAST_STATUSES.includes(w.status)) return { ok:false, why:"Choose a status." };
      plan.push({ u, w, keep, status:takesStatus && hasStatus ? w.status : null });
    }
    e.status = "ended"; e.turn = null;
    const out = { ok:true, kept:[], lines:[] };
    const date = _today();
    for (const p of plan){
      const r = p.u.row;
      let member = null, killed = false;
      if (p.keep){
        member = castFromRow(t, packs, r, p.w.name);
        if (p.status) member.status = p.status;
        killed = member.status==="dead";
        r.kept = { kind:"cast", id:member.id, name:member.name };
        out.kept.push(member.id);
      } else if (p.u.kind==="cast" && !p.u.gone){
        member = t.cast.find(n=>n.id===r.cast.id);
        if (p.status && member.status!==p.status){ killed = p.status==="dead"; member.status = p.status; _tableStamp(t, member); }
      }
      if (member && p.w.line===true){
        const text = _str(p.w.text).trim() || p.u.line;
        const a = addInteraction(t, { kind:killed ? "killed" : "fought", cast:[member.id], crew:ups.crew, text, date });
        if (a.ok) out.lines.push(a.id);
      }
    }
    _tableStamp(t, e);
    return out;
  }

  // ── The hit (Decisions 191–192) ─────────────────────────────────────────
  // A row takes a hit the way the sheet does. An NPC row is hit by resolveHit and
  // applyHit on a stand-in: a newCharacter() with the block's stats and the row's
  // damage, Massive levels and Conditions, wearing the Gear catalog's piece the
  // block names. Nothing in the sheet's pipeline changes. A PC row takes what got
  // through, after the player's own armor, on the GM's own numbers.
  // Enemy armor is static (0530): PROT is the die's average, rounded up.
  const _staticProt = piece => {
    const max = piece ? dieMax(piece.prot) : null;
    return max ? Math.ceil((max + 1) / 2) : null;
  };
  // The first armor line whose name, before " (", is a body piece in the Gear catalog.
  function encounterArmor(block){
    const lines = _isObj(block) && Array.isArray(block.armor) ? block.armor.filter(x=>typeof x==="string" && x.trim()) : [];
    for (const line of lines){
      const open = line.indexOf(" (");
      const name = _fold(open < 0 ? line : line.slice(0, open));
      const piece = (D().armor||[]).find(a=>a && a.slot==="body" && _fold(a.name)===name) || null;
      const prot = _staticProt(piece);
      if (!piece || prot===null) continue;
      const close = open < 0 ? -1 : line.indexOf(")", open);
      const extra = close < 0 ? "" : line.slice(close + 1).replace(/^\s*[—–-]?\s*/, "").trim();
      return { line, piece, extra, stops:{ prot, res:Number(piece.res)||0 } };
    }
    return { line:lines.length ? lines[0] : null, piece:null, extra:"", stops:null };
  }
  // A character for the sheet's pipeline to hit. A deep copy of what the row stores,
  // so the stand-in never shares an object with it.
  function _standIn(t, r){
    if (!r || r.kind==="pc") return null;
    const block = _rowBlock(t, r), b = npc(block);
    if (!b.health) return null;
    const ch = newCharacter(), arm = encounterArmor(block);
    for (const s of D().stats) if (b.stats[s.id].value!==null) ch.stats[s.id].base = b.stats[s.id].value;
    // The wear is the row's only while the block names the piece it was taken on; any other piece reads fresh.
    if (arm.piece){
      const mine = r.armorId===arm.piece.id;
      ch.armor = [{ id:arm.piece.id, worn:true, integrityLoss:mine ? nonNegInt(r.armorLoss) : 0, scrapped:mine && r.scrapped===true }];
    }
    ch.trackers.damage = nonNegInt(r.damage);
    ch.trackers.massiveLevels = nonNegInt(r.massive);
    ch.trackers.conditions = JSON.parse(JSON.stringify(r.conditions));
    return ch;
  }
  // A PC row's Health on the GM's own numbers, by hlState's rule: whole Health Levels need HP that
  // divides by them. `over` asks what it would be after a hit, as hlState's does.
  function _pcHealth(r, over){
    const pick = k => (over && over[k]!=null) ? over[k] : r[k];
    const damage = nonNegInt(pick("damage"));
    const hp = r.hp, lv = r.levels, whole = hp!==null && lv!==null && hp % lv===0;
    if (hp===null) return { total:null, left:null, levels:null, levelsLeft:null, lost:null, down:false, massive:nonNegInt(pick("massive")), hpPer:null, damage };
    if (!whole) return { total:hp, left:Math.max(0, hp - damage), levels:null, levelsLeft:null, lost:null, down:damage >= hp, massive:nonNegInt(pick("massive")), hpPer:null, damage };
    const hpPer = hp / lv, massive = Math.min(lv, nonNegInt(pick("massive")));
    const emptied = Math.max(0, Math.min(lv - massive, Math.floor(damage / hpPer))), capacity = Math.max(0, hp - massive*hpPer);
    return { total:hp, left:Math.max(0, capacity - damage), levels:lv, levelsLeft:lv - emptied - massive, lost:emptied + massive, down:damage >= capacity, massive, hpPer, damage };
  }
  const NO_BOD = "Their block has no BOD, so there are no Health Levels to hit. Use Take.";
  // A PC row: what got through is the damage; for Massive, the Health Levels the player calls out.
  function _resolvePcHit(r, hit){
    hit = _isObj(hit) ? hit : {};
    const category = hit.category || "regular", cat = damageCategoryById(category), massive = !!(cat && cat.bypassesArmor);
    const raw = massive ? hit.gone : hit.damage, n = Math.floor(Number(raw));
    if (raw==null || raw==="" || !(n>=0)) return { ok:false, why: massive ? "Enter the Health Levels gone." : "Enter the damage." };
    const type = damageTypeById(hit.damageType);
    if (!type) return { ok:false, why:"Choose a damage type." };
    if (!cat) return { ok:false, why:"Choose Regular, Withering or Massive." };
    const DR = D().damageRules || {};
    const before = _pcHealth(r);
    const gone = massive ? (before.levels!==null ? Math.max(0, Math.min(n, before.levels - before.massive)) : n) : 0;
    const through = massive ? 0 : n;
    const after = _pcHealth(r, { damage:r.damage + through, massive:before.massive + gone });
    const lostThisHit = before.lost!==null ? after.lost - before.lost : 0;
    const tookDamage = through > 0 || gone > 0, dying = isDying(_condShim(r));
    const offered = tookDamage ? [...new Set([...(type.inflicts||[]), ...(cat.inflicts||[])])].filter(id=>conditionById(id)) : [];
    const shockAt = after.levels!==null ? Math.ceil(after.levels * ((DR.shock||{}).fractionOfMaxLevels ?? 0.5)) : 0;
    const loc = locationById(hit.location) ? hit.location : ((D().armorRules||{}).defaultHitLocation || "torso");
    return { ok:true, pc:true, type, category, cat, bypassesArmor:massive, damage:n, through, gone,
      location:loc, before, after, lostThisHit, tookDamage, from:_str(hit.from).trim(),
      prompts:{
        shock: tookDamage && !after.down && shockAt>0 && lostThisHit >= shockAt ? { check:DR.shock.check, onFail:DR.shock.onFail||[], threshold:shockAt } : null,
        atZero: tookDamage && after.down && !dying && DR.atZero ? { check:DR.atZero.check, onPass:DR.atZero.onPass||[], onFail:DR.atZero.onFail||[] } : null,
        deathMark: tookDamage && dying ? DR.whileDying : null,
        conditions:offered, always:(type.always||[]).filter(id=>offered.includes(id)) } };
  }
  // Pure: what a hit WOULD do to a row. An NPC row's `hit` is resolveHit's, plus `from`, and the
  // GM's protRoll is ignored. A PC row's is { damage | gone, damageType, category, location, from }.
  function resolveEncounterHit(t, encId, rowId, hit){
    const l = _liveRow(t, encId, rowId);
    if (l.why) return { ok:false, why:l.why };
    const r = l.r;
    if (r.kind==="pc") return _resolvePcHit(r, hit);
    const s = _standIn(t, r);
    if (!s) return { ok:false, why:NO_BOD };
    const arm = encounterArmor(_rowBlock(t, r));
    const res = resolveHit(s, Object.assign({}, hit, { protRoll:arm.stops ? arm.stops.prot : undefined, natural:undefined }));
    if (!res.ok) return res;
    return Object.assign(res, { armor:Object.assign({}, res.armor, arm), from:_str(_isObj(hit) ? hit.from : "").trim() });
  }
  // The one writer. Re-resolves first, so a row that changed under an open panel is read as it is
  // now; nothing is written on a refusal. `choices` is applyHit's, and an unanswered prompt adds
  // nothing. Withering's bookkeeping is dropped: an encounter has no downtime to heal over.
  function applyEncounterHit(t, encId, rowId, hit, choices){
    const res = resolveEncounterHit(t, encId, rowId, hit);
    if (!res.ok) return res;
    const { e, r } = _liveRow(t, encId, rowId);
    choices = _isObj(choices) ? choices : {};
    const source = res.from;
    if (res.pc){
      r.struck = true;
      // The player rolls Shock and At Zero on their sheet; the GM adds what they call out (Decision 192).
      const pick = (Array.isArray(choices.conditions) ? choices.conditions : []).map(c=>typeof c==="string" ? c : (c && c.id)).filter(id=>res.prompts.conditions.includes(id));
      const added = [], skipped = [];
      r.damage += res.through;
      r.massive = res.after.levels!==null ? Math.min(res.after.levels, r.massive + res.gone) : r.massive + res.gone;
      for (const id of pick){
        const a = addCondition(_condShim(r), (conditionById(id)||{}).location ? { id, location:res.location } : { id });
        if (a.ok){ const c = r.conditions[r.conditions.length - 1]; c.source = source; c.rounds = null; added.push(id); } else skipped.push(id);
      }
      if (res.prompts.deathMark){
        const i = r.conditions.findIndex(c=>c.id===res.prompts.deathMark.condition);
        if (i>=0) setConditionMarks(_condShim(r), i, (Number(r.conditions[i].marks)||0) + 1);
      }
      _tableStamp(t, e);
      return { ok:true, result:res, added, skipped };
    }
    const s = _standIn(t, r), old = r.conditions.length;
    const ap = applyHit(s, Object.assign({}, hit, { protRoll:res.armor && res.armor.stops ? res.armor.stops.prot : undefined, natural:undefined }), choices);
    if (!ap.ok) return ap;
    r.struck = true;
    r.damage = s.trackers.damage;
    r.massive = s.trackers.massiveLevels;
    // A hit that wore the armor writes the wear with the piece's id; a new piece starts its own.
    if (s.armor[0] && res.patch.armor){ r.armorId = s.armor[0].id; r.armorLoss = nonNegInt(s.armor[0].integrityLoss); r.scrapped = s.armor[0].scrapped===true; }
    s.trackers.conditions.forEach((c, i)=>{
      if (i < old){ if (c.marks!==undefined) r.conditions[i].marks = c.marks; }
      else r.conditions.push(Object.assign({}, c, { source, rounds:null }));
    });
    _tableStamp(t, e);
    return { ok:true, result:res, added:ap.added, skipped:ap.skipped };
  }

  // Pain for a count of Health Levels lost, by painState's rule (Decision 96): the highest band
  // the levels lost reach, plus the Pain the Conditions add, clamped to the table. painState
  // reads a character; a row has no character, so this is the band and the clamp on their own,
  // and a test holds the two together.
  function painFor(levelsLost, conditionPain){
    const hl = D().resources.healthLevels, lost = Number(levelsLost)||0;
    let band = hl.painLevels[0];
    for (const p of hl.painLevels) if (lost >= p.hlLostThreshold && p.hlLostThreshold >= band.hlLostThreshold) band = p;
    const top = hl.painLevels.reduce((m, p)=>Math.max(m, p.level), 0);
    const target = Math.max(0, Math.min(top, band.level + (Number(conditionPain)||0)));
    const lvl = hl.painLevels.find(p=>p.level===target) || band;
    return { level:lvl.level, label:lvl.label, description:lvl.description };
  }
  function _rowBlock(t, r){
    if (r.kind==="entry") return r.block;
    if (r.kind!=="cast") return null;
    const m = (Array.isArray(t.cast) ? t.cast : []).find(n=>_isObj(n) && _isObj(r.cast) && n.id===r.cast.id);
    return m ? m.block : null;
  }
  // The encounter as the screen reads it: the rows in order, each with its figures. Total.
  function encounterView(t, encId, packs){
    const e = _enc(t, encId);
    if (!e) return null;
    const ord = _encOrder(e);
    const rows = ord.rows.map(r=>{
      const conditions = r.conditions.map((c, index)=>{
        const def = conditionById(c.id), loc = c.location ? locationById(c.location) : null;
        return { index, id:c.id, def, name:def ? def.name : String(c.id), location:c.location||null, locationName:loc ? loc.name : null,
                 rounds:c.rounds, source:c.source, note:_str(c.note), marks:def && def.counter ? c.marks : null, counter:def ? def.counter||null : null };
      });
      const condPain = conditions.reduce((n, c)=>n + (c.def && typeof c.def.painLevels==="number" ? c.def.painLevels : 0), 0);
      // An NPC with a BOD is read off its stand-in, by the sheet's own hlState and painState (Decision 191);
      // a PC's are the GM's own numbers; an NPC with no BOD has no totals.
      const taken = r.damage, stand = _standIn(t, r), block = _rowBlock(t, r);
      let health;
      if (stand){
        const hs = hlState(stand), ps = painState(stand);
        health = { taken, total:hs.total, left:hs.hpLeft, down:hs.down, levels:hs.levels, levelsLeft:hs.levels - hs.lost, gone:hs.massive,
                   pain:{ level:ps.level, label:ps.label, description:ps.description, fromConditions:ps.fromConditions } };
      } else {
        const ph = r.kind==="pc" ? _pcHealth(r) : { total:null, left:null, down:false, levels:null, lost:null, levelsLeft:null, massive:0 };
        let pain = null;
        if (ph.lost!==null || condPain!==0){
          const p = painFor(ph.lost || 0, condPain);
          pain = { level:p.level, label:p.label, description:p.description, fromConditions:condPain };
        }
        health = { taken, total:ph.total, left:ph.left, down:ph.down, levels:ph.levels, levelsLeft:ph.levelsLeft,
                   gone:ph.levels!==null ? ph.massive : r.massive, pain };
      }
      const wear = r.kind==="pc" ? null : encounterArmor(block);
      const armor = wear && Object.assign({}, wear, wear.piece ? (()=>{
        const mine = r.armorId===wear.piece.id, p = armorPiece({ id:wear.piece.id, integrityLoss:mine ? r.armorLoss : 0, scrapped:mine && r.scrapped }, 0);
        return { integrity:p.integrity, integrityMax:p.integrityMax, compromised:p.compromised, scrapped:p.scrapped };
      })() : {});
      const traits = (_isObj(block) && Array.isArray(block.traits) ? block.traits : []).map((k, index)=>({ index, name:_str(k && k.name), text:_str(k && k.text) }))
        .filter(k=>k.name.trim() || k.text.trim());
      let awareness = null;
      if (r.kind==="pc") awareness = r.awareness;
      else {
        const b = _rowBlock(t, r), k = _isObj(b) && Array.isArray(b.skills) ? b.skills.find(x=>_isObj(x) && x.skill==="awareness") : null;
        awareness = k ? _int(k.total) : null;
      }
      const name = r.kind==="cast" && _isObj(r.cast) ? linkName(t, r.cast).name : r.name;
      const gone = r.kind==="cast" && _isObj(r.cast) ? linkName(t, r.cast).gone : false;
      return { row:r, name:_str(name).trim() || "Unnamed", gone, health, awareness, ties:ord.tied(r), side:_rowSide(e, _sideList(e), r), active:e.status==="running" && e.turn===r.id,
               acted:e.status==="running" && _actedIds(e).includes(r.id),
               from:r.kind==="entry" ? entryLink(packs, r.from) : null,
               kept:r.kind==="entry" && r.kept ? linkName(t, r.kept) : null, conditions, armor, traits, canHit:r.kind==="pc" || !!stand };
    });
    return { encounter:e, title:encounterTitle(e), by:e.by==="wave" ? "wave" : "person", sides:ord.sides, rows, atReset:e.status==="running" && e.turn===null };
  }


  // The engine's surface, grouped by domain.
  return {
    // Data: lookups by id, paths and formulas the data holds
    D, dataPath, formulaText, creditSymbol, glossary, skillById, advById, disById,
    conditionById, locationById, damageTypeById, damageCategoryById, aberrationById, spellById,
    // The character file: create, load, check, export
    newCharacter, isIntakeId, tagReading, tagNumber, migrate, versionCheck, buildExport,
    // Stats, skills and derived values
    powerLevel, archetype, classification, canBuyAdvantage, archetypeContent, writeInOptions, addPower, improvePower, newPower, removePower, statMod, statValue, statTable, baseStatTable, statReading, archStatBonus, scalingRow,
    derived, health, sfr, skillLine, adjFor, skillRankCap, disciplineCap, disciplineRanks, powerRanks, archetypePowers, powerAllowance,
    powerPool, basePowerState, placeBasePower, optionChoices, setOptionPick, archetypeWeapons, painImmunity,
    feedView, feedGain, feed, goUnfed,
    // Creation: pools, costs, grants and the wizard's checks
    boostsFor, addBoost, canBoost, spendable, statPool, statSpent, statCost, nextStatCost, skillPool, skillSpent,
    advSpent, disGranted, luckSpent, boostSpent, disciplineSpent, powerRankCost, cp, grants, validate,
    // Focused Skills and natural advantages (Decision 134)
    focusedSkillIds, focusedSkillSpec, focusedPicks, toggleFocusedPick, focusedPrice,
    focusedCategoryName, naturalAdvantagePool,
    // Selections and constraints
    optionLock, requirementState, picksFor, setSelection, trimSelections,
    specializationNeed, specializationIds, specializationChosen, specializationLabel,
    // Vitals: Pain, LUCK, Sanity, Conditions, taking a hit, recovery
    painState, luckState, sanState, conditionState, addCondition, removeCondition, setConditionMarks,
    hlState, armorState, resolveHit, applyHit, naturalArmor, nanomedKit,
    naturalHealing, heal, resolveReset, applyReset,
    // Loadout: weapons, gear, armor
    weaponLine, catalogLine, addLoadout, weaponModOptions, addWeaponMod, removeWeaponMod, fireWeapon, reloadWeapon,
    gearLine, carriedGear, useGear, useCharge, rechargeGear, addCustomLoadout, removeLoadout, setWorn,
    upgradeOptions, addUpgrade, removeUpgrade, armorWear, repairArmor,
    // Magic: the Cascade, Aberrations, the Grimoire, starting spells
    cascade, aberrationState, recordAberration, removeAberration,
    spellForms, spellForm, grimoire, spellPower, spAmounts, spellAttack, addSpell, linkSpell, removeGrimoireRow,
    castingPool, startingSpells, canAddStartingSpell, addStartingSpell,
    // Progression and play: IP, Milestones, sessions, Çredits, panels
    ipState, ipCost, spendIP, grantIP,
    milestoneState, canTakeMinor, majorPrereqs, majorPool, majorOffered, majorById, formGrants, takeMilestone, untakeMilestone,
    logSession, localDay, ipRoll, ipRollTotal, addCredits, crankState, addCrankRep, crankPayText, archPanels, panelMax, panelTracker, adjustPanelTracker,
    // A form (Decision 195): what a toggle is on, what it does, and switching it
    toggleOptions, toggleView, formState, formView, setToggle,
    // Audit trail and undo
    diffChar, recordAction, undoLastAction,
    // The table file (GM mode): create, tell its kind, load, check, edit notes
    newTable, isTableId, fileKind, migrateTable, tableCheck, diffTable, tableActionLabel, recordTableAction, undoTableAction, clearTableActivity, addTableNote, editTableNote, removeTableNote, sessionNotes, tableSearch,
    // The pack file (GM mode): load, check, read, and copy an entry into the cast
    isPackId, migratePack, packCheck, packFilter, packChoices, packTraits, castPackMatch, packEntry, packGroups, gmReference, castFromEntry, entryLink,
    // The cast: a stat block read, and a member added, edited, removed, found
    npc, addCastMember, editCastMember, setCastBlock, removeCastMember, castFilter, castAffiliations,
    // Interactions: what passed between the crew and the cast, and who knows it
    addSession, editSession, removeSession, sessionList, sessionTitle, sessionInteractions, sessionOffered,
    addThread, editThread, removeThread, threadList, nextSession, blockHasNumber, JOURNAL_PARTS,
    offScreenPay, arcDue, closeOutDraft, writeCloseOut, awardTotals,
    addInteraction, editInteraction, removeInteraction, interactionsFor, crewView, linkName,
    // Encounters: who is in one, whose turn it is, and what is still on them
    addEncounter, editEncounter, addSide, renameSide, removeSide, sideTitle, removeEncounter, runningEncounter, encounterFor, addToEncounter, encounterTitle, addParticipant, participantFromEntry,
    participantsFromGroup, editParticipant, removeParticipant, participantDamage, participantAddCondition,
    participantRemoveCondition, participantConditionMarks, startEncounter, nextTurn, setTurn, resolveEncounterReset,
    applyEncounterReset, endEncounter, encounterWrapUp, encounterView, painFor,
    // The hit: an encounter row takes damage the way a character does
    encounterArmor, resolveEncounterHit, applyEncounterHit };
})();
/*ENGINE-END*/
