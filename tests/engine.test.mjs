/**
 * Engine unit tests — no DOM anywhere.
 *
 * The engine is loaded in a bare VM context with only `window` stubbed. If
 * anything in engine.js ever reaches for `document`, these tests throw, which
 * is the point: the engine's purity is what makes audit/undo and the sheet's
 * "store inputs, compute everything else" contract work (SCHEMA.md §1).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEngine } from "./harness.mjs";
import { ROOT } from "../tools/build.mjs";

const { Engine, D } = loadEngine();

/** A minimal, valid, locked character for computation tests. */
function subject({ bod = 5, base = 5 } = {}) {
  const ch = Engine.newCharacter();
  ch.identity.name = "Test Subject";
  ch.identity.archetype = "arcanist";
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = base;
  if (ch.stats.BOD) ch.stats.BOD.base = bod;
  ch.creation.locked = true;
  return ch;
}

test("engine loads without a DOM", () => {
  assert.equal(typeof Engine.newCharacter, "function");
  assert.ok(Object.keys(Engine).length > 40, "public API unexpectedly small");
});

test("newCharacter matches the documented character schema", () => {
  const ch = Engine.newCharacter();
  assert.equal(ch.meta.schemaVersion, "0.10");
  assert.equal(ch.meta.gamedataVersion, D.meta.gamedataVersion);
  for (const k of ["identity", "creation", "archetypeChoices", "stats", "skills",
                   "advantages", "disadvantages", "trackers"]) {
    assert.ok(k in ch, `missing top-level key: ${k}`);
  }
  assert.equal(Object.keys(ch.stats).length, D.stats.length);
});

test("derived values are computed, never stored", () => {
  const ch = subject();
  const d = Engine.derived(ch);
  for (const k of ["TOL", "WILL", "SAN"]) assert.equal(typeof d[k], "number");
  assert.ok(!("TOL" in ch), "TOL leaked into the stored character");
  assert.ok(!("derived" in ch), "derived block leaked into the stored character");
});

test("health scales with BOD and recomputes on change", () => {
  const ch = subject({ bod: 5 });
  const before = Engine.health(ch);
  ch.stats.BOD.base = 8;
  const after = Engine.health(ch);
  assert.ok(after.total > before.total, "HP did not follow BOD");
  assert.ok(after.levels >= before.levels, "Health Levels did not follow BOD");
});

test("statMod returns a number for every stat in the catalog", () => {
  for (const s of D.stats) assert.equal(typeof Engine.statMod(5, s.id), "number");
});

test("validate returns issues for every step once the wizard's gates are met", () => {
  // The wizard gates Continue, so validate is only ever called on a character
  // that has cleared the prior steps. This walks that same path.
  const ch = Engine.newCharacter();
  assert.ok(Engine.validate("power-level", ch).some(i => i.level === "error"));
  ch.creation.powerLevel = D.powerLevels[0].id;
  for (const step of D.creationFlow.steps) {
    assert.ok(Array.isArray(Engine.validate(step.id, ch)), `${step.id} did not return issues`);
  }
});

test("validate is total even on a character with no power level (B7)", () => {
  const blank = Engine.newCharacter();
  for (const step of [...D.creationFlow.steps.map(s => s.id), "review"]) {
    const out = Engine.validate(step, blank);
    assert.ok(Array.isArray(out), `${step} threw`);
  }
  // It must REPORT the missing power level, not just decline to throw.
  const msgs = Engine.validate("stats", blank).map(i => i.msg).join(" ");
  assert.match(msgs, /Campaign Power Level/);
});

test("audit round-trip: record then undo restores the prior value", () => {
  const ch = subject();
  const before = JSON.parse(JSON.stringify(ch));
  ch.trackers.damage = 5;
  Engine.recordAction(ch, "damage", "Damage +5", before);
  assert.equal(ch.audit.length, 1);
  Engine.undoLastAction(ch);
  assert.equal(ch.trackers.damage, 0);
  assert.equal(ch.audit.length, 0);
});

test("diffChar reports only what changed", () => {
  const a = subject();
  const b = JSON.parse(JSON.stringify(a));
  b.trackers.damage = 3;
  const d = Engine.diffChar(a, b);
  assert.ok(d.length >= 1);
  assert.equal(Engine.diffChar(a, JSON.parse(JSON.stringify(a))).length, 0);
});

test("migrate upgrades an older save in place", () => {
  const old = subject();
  old.meta.schemaVersion = "0.3";
  delete old.audit;
  Engine.migrate(old);
  assert.equal(old.meta.schemaVersion, "0.10");
  assert.ok(Array.isArray(old.audit), "audit was not seeded");
});

test("migrate drops the retired exhaustion tracker (schema 0.7, Decision 93)", () => {
  // Pre-0.7 characters tracked Exhaustion as its own accruing resource. It's
  // now just TOL at zero -- a condition, not a stored value -- so migrate()
  // must not carry the old field forward.
  const old = subject();
  old.meta.schemaVersion = "0.6";
  old.trackers.exhaustion = 3;
  Engine.migrate(old);
  assert.equal(old.meta.schemaVersion, "0.10");
  assert.equal(old.trackers.exhaustion, undefined);
});

test("versionCheck surfaces a game-data mismatch instead of failing silently", () => {
  const ch = subject();
  ch.meta.gamedataVersion = "0.0-ancient";
  assert.ok(Engine.versionCheck(ch).length > 0);
});

test("every skill references a stat that exists (guards the BODY/BOD class of bug)", () => {
  const ids = new Set(D.stats.map(s => s.id));
  const bad = [];
  for (const s of D.skills || []) {
    // synergyStat is the field the engine actually reads (engine.js skillLine);
    // it was absent from this list, so the synergy half of the guard never ran.
    for (const key of ["primary", "primaryStat", "stat", "synergyStat"]) {
      if (s[key] && !ids.has(s[key])) bad.push(`${s.id}.${key} → ${s[key]}`);
    }
    for (const syn of s.synergy || []) {
      const sid = typeof syn === "string" ? syn : syn.stat;
      if (sid && !ids.has(sid) && !(D.skills || []).some(x => x.id === sid)) bad.push(`${s.id}.synergy → ${sid}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("every weapon references a skill that exists (Weapons/Ammo/Armor batch)", () => {
  // Built with a plain loop/push, not .filter/.map on a VM-realm array — the
  // VM context engine.js loads in (see file header) gives D.weapons its own
  // Array constructor, and assert/strict's deepStrictEqual treats that
  // cross-realm array as unequal to a same-realm `[]` even when both are
  // empty. Every other bad-list check in this file follows the same shape.
  const skillIds = new Set(D.skills.map(s => s.id));
  const bad = [];
  for (const w of D.weapons || []) if (!skillIds.has(w.skill)) bad.push(`${w.id} → ${w.skill}`);
  assert.deepEqual(bad, []);
});

test("every weapon and armor id is unique, and armor slots are valid", () => {
  const dupes = list => { const seen = new Set(), out = []; for (const x of list) { if (seen.has(x.id)) out.push(x.id); seen.add(x.id); } return out; };
  assert.deepEqual(dupes(D.weapons || []), []);
  assert.deepEqual(dupes(D.armor || []), []);
  assert.deepEqual(dupes(D.ammunition || []), []);
  assert.deepEqual(dupes(D.arrowheads || []), []);
  const slots = new Set(["body", "head", "hand"]);
  const badSlots = [], badBody = [];
  for (const a of D.armor || []) {
    if (!slots.has(a.slot)) badSlots.push(`${a.id} → ${a.slot}`);
    // Body armor rolls PROT/RES/Integrity; head/hand grant a named feature
    // instead (armorRules.protNote/resNote — see SCHEMA.md §2). Catching a
    // body entry missing its numbers is cheaper than catching it from a
    // blank Defense panel later.
    if (a.slot === "body" && (!a.prot || a.res == null || a.integrity == null)) badBody.push(a.id);
  }
  assert.deepEqual(badSlots, []);
  assert.deepEqual(badBody, []);
});

test("every spell id is unique and references a real domain (Magic batch, Decision 93)", () => {
  const dupes = list => { const seen = new Set(), out = []; for (const x of list) { if (seen.has(x.id)) out.push(x.id); seen.add(x.id); } return out; };
  assert.deepEqual(dupes(D.spells || []), []);
  const domainIds = new Set((D.domains || []).map(d => d.id));
  const tierIds = new Set((D.spellTiers || []).map(t => t.id));
  const badDomain = [], badTier = [];
  for (const s of D.spells || []) {
    if (!domainIds.has(s.domain)) badDomain.push(`${s.id} → ${s.domain}`);
    if (!tierIds.has(s.tier)) badTier.push(`${s.id} → ${s.tier}`);
  }
  assert.deepEqual(badDomain, []);
  assert.deepEqual(badTier, []);
});

test("migrate tags a pre-0.6 weapons entry as custom and seeds armor (schema 0.6)", () => {
  const old = subject();
  old.meta.schemaVersion = "0.5";
  old.weapons = [{ name: "Old Reliable", type: "Pistol", damage: "2d6", notes: "" }];
  delete old.armor;
  Engine.migrate(old);
  assert.equal(old.meta.schemaVersion, "0.10");
  assert.equal(old.weapons[0].custom, true, "a legacy free-typed weapon should be tagged custom, not silently reinterpreted");
  assert.equal(old.weapons[0].name, "Old Reliable", "migrate must not lose what the player already typed");
  assert.ok(Array.isArray(old.armor), "armor was not seeded");
});

test("every legacy stat alias points at a live stat id (B2)", () => {
  // The alias map is the pre-Shadows stat vocabulary. Two entries used to name
  // the OLD system's abbreviations ("ATTR", "MA") as their targets, so they
  // resolved to nothing. Read the literal so a newly added alias is guarded too.
  const ids = new Set(D.stats.map(s => s.id));
  const literal = /const STAT_ALIASES = \{([^}]*)\}/.exec(readFileSync(join(ROOT, "src/engine/engine.js"), "utf8"));
  assert.ok(literal, "STAT_ALIASES literal not found — did normStat move?");
  const pairs = [...literal[1].matchAll(/(\w+)\s*:\s*"([^"]+)"/g)];
  assert.ok(pairs.length >= 8, `expected the full alias map, parsed ${pairs.length}`);
  assert.deepEqual(pairs.filter(p => !ids.has(p[2])).map(p => `${p[1]} → ${p[2]}`), []);
});

test("a legacy stat name resolves, and an unresolvable one warns instead of throwing (B2)", () => {
  const ch = subject();
  const probe = primaryStat => {
    D.skills.push({ id: "__probe", name: "Probe", primaryStat, synergyStat: "INT" });
    try { return Engine.skillLine(ch, "__probe"); } finally { D.skills.pop(); }
  };
  assert.equal(probe("Movement").breakdown.primary.id, "MOB");
  assert.equal(probe("Attractiveness").breakdown.primary.id, "MAG");
  assert.equal(probe("Movement").dataWarning, null);
  // Before the fix this threw on t[pri].value, taking the Skills tab down with it.
  const bad = probe("Nonesuch");
  assert.equal(bad.breakdown.primary.id, null);
  assert.match(bad.dataWarning, /unknown stat/);
});

test("the generic undo reverses an IP spend, so no bespoke IP undo is needed (B4)", () => {
  assert.equal(Engine.undoIP, undefined, "undoIP was superseded by undoLastAction (Decision 49)");
  const ch = subject();
  ch.progression.ip.earned = 500;
  const id = D.skills[0].id;
  const before = JSON.parse(JSON.stringify(ch));
  assert.ok(Engine.spendIP(ch, "skill", id, "").ok, "spendIP refused a funded raise");
  assert.equal(ch.skills[id].ipe, 1);
  assert.equal(ch.progression.ip.log.length, 1);
  Engine.recordAction(ch, "ip", `IP raise: ${id}`, before);
  assert.ok(Engine.undoLastAction(ch).ok);
  assert.equal((ch.skills[id] || { ipe: 0 }).ipe, 0, "IPE survived the undo");
  assert.equal(ch.progression.ip.log.length, 0, "IP journal entry survived the undo");
});

// ── The engine's totality contract ────────────────────────────────────
// Decision 22 promised the engine "degrades gracefully instead of crashing".
// Nothing enforced it, and three separate sessions each rediscovered a
// violation: B2 (normStat threw), B7 (validate threw), B6 (migrate left holes
// the engine threw through). These two tests are the enforcement.

/** Degenerate characters that a corrupt import or an admin edit can produce. */
function degenerates(){
  return {
    "empty object":        Engine.migrate({}),
    "pre-0.2 shape":       Engine.migrate({ meta:{schemaVersion:"0.1"}, identity:{name:"Ghost", archetype:"arcanist"},
                                            stats:Object.fromEntries(D.stats.map(s=>[s.id,{base:5,ipe:0}])) }),
    "no power level":      Engine.migrate({ identity:{archetype:"arcanist"} }),
    "no archetype":        Engine.migrate({ creation:{powerLevel:D.powerLevels[0].id} }),
    "partial sub-objects": Engine.migrate({ archetypeChoices:{aberrations:["x"]}, trackers:{damage:3}, progression:{} }),
    "unknown ids":         Engine.migrate({ identity:{archetype:"no-such-archetype"}, skills:{"no-such-skill":{rank:2,ipe:0}},
                                            advantages:[{id:"no-such-adv",rank:1}] }),
    "junk conditions":     Engine.migrate({ trackers:{ conditions:[null, {id:"no-such-condition"}, {id:"dying", marks:"lots"},
                                            {id:"injured", location:"nowhere"}], massiveLevels:"x" } }),
    "junk armor":          Engine.migrate({ armor:[null, 7, {id:"no-such-armor", worn:true, integrityLoss:"x"},
                                            {custom:true, worn:true, prot:"junk", integrity:"lots", upgrades:["no-such-upgrade"]}],
                                            trackers:{ massiveLevels: 999, witheringDamage: -4 } }),
    "junk grant sources":  Engine.migrate({ identity:{archetype:"professional"}, archetypeChoices:{specialization:["true-warrior","no-such-spec"]},
                                            advantages:[{id:"thick-skin", rank:"x"}, null],
                                            progression:{ milestones:{ major:[null, {id:"shake-it-off"}, {id:"no-such-milestone"}] } } }),
    "junk aberrations":    Engine.migrate({ identity:{archetype:"arcanist"}, trackers:{ aberrations:[null, 7, {id:"no-such-aberration"},
                                            {id:"drained", permanence:"forever"}, {id:"phantom-pain"}], panel:{ "tol-spent":{ value:"lots" } } } }),
  };
}

test("migrate() returns every field newCharacter() has (B6)", () => {
  // migrate is version-agnostic: it backfills rather than stepping versions, so
  // its completeness IS the migration guarantee. archetypeChoices was the 0.2
  // addition that never got one, and pre-0.2 files crashed on the first render.
  // Three fields are deliberately NOT backfilled, and the reasons matter:
  //   meta.gamedataVersion — seeding it from the loaded data would mask the
  //     exact mismatch versionCheck exists to report.
  //   meta.created / meta.updated — inventing timestamps fabricates history.
  // Anything else missing is the B6 bug class returning.
  const EXEMPT = new Set(["meta.gamedataVersion", "meta.created", "meta.updated"]);
  const shape = Engine.newCharacter();
  const missing = [];
  (function walk(got, want, path){
    for (const k of Object.keys(want)){
      const p = path ? path + "." + k : k;
      if (EXEMPT.has(p)) continue;
      if (got[k] === undefined) { missing.push(p); continue; }
      const w = want[k];
      if (w && typeof w === "object" && !Array.isArray(w)){
        if (!got[k] || typeof got[k] !== "object") missing.push(p);
        else walk(got[k], w, p);
      }
    }
  })(Engine.migrate({}), shape, "");
  assert.deepEqual(missing, []);

  // The exemptions are load-bearing, not oversights: an unrecorded game-data
  // version must still surface as an issue rather than silently matching.
  const bare = Engine.migrate({});
  assert.equal(bare.meta.gamedataVersion, undefined);
  assert.equal(bare.meta.schemaVersion, "0.10");
  assert.ok(Engine.versionCheck(bare).some(i => /game data/.test(i)));
});

test("no exported reader throws on any character migrate() can return", () => {
  // Readers take (ch) alone; anything needing more arguments is exercised by
  // its own test. Named here so adding an export is a deliberate choice.
  const readers = ["powerLevel","archetype","statTable","scalingRow","derived","health","sfr",
                   "statPool","statSpent","skillPool","skillSpent","advSpent","disGranted",
                   "luckSpent","boostSpent","disciplineSpent","cp","painState","conditionState","hlState","armorState","naturalArmor","naturalHealing","resolveReset","luckState",
                   "sanState","focusedSkillIds","ipState","milestoneState","archPanels",
                   "specializationNeed","specializationIds","specializationChosen","specializationLabel",
                   "disciplineRanks","buildExport","versionCheck","aberrationState","spellAttack","spellPower","grimoire"];
  const failures = [];
  for (const [label, ch] of Object.entries(degenerates())){
    for (const fn of readers){
      assert.equal(typeof Engine[fn], "function", `${fn} is not an exported function`);
      try { Engine[fn](ch); } catch (e) { failures.push(`${fn}(${label}) -> ${e.constructor.name}: ${e.message}`); }
    }
    for (const step of [...D.creationFlow.steps.map(s=>s.id), "review"]){
      try { Engine.validate(step, ch); } catch (e) { failures.push(`validate("${step}", ${label}) -> ${e.message}`); }
    }
    for (const id of Object.keys(ch.skills||{})){
      try { Engine.skillLine(ch, id); } catch (e) { failures.push(`skillLine(${label}, ${id}) -> ${e.message}`); }
    }
  }
  assert.deepEqual(failures, []);
});

// ── Batch 3: selection & constraint system ────────────────────────────
// The CRB names no mutually exclusive pair yet, so `excludes` and `requires`
// are exercised against a synthetic entry pushed into the loaded data rather
// than against a real one. Inventing a lock in the data to make a test pass
// would be resolving a rules question in code, which this project does not do.
function withFixture(fn){
  const adv = { id:"__fixture-a", name:"Fixture A", cost:1, maxRank:2,
                description:"", excludes:["__fixture-b"],
                requires:{ stats:{REF:6}, skills:{ any:[["handguns",2]] } },
                picks:[{ id:"skill", label:"Skill", type:"skill",
                         from:{ category:"combat" }, count:1, perRank:true, distinct:true }] };
  const dis = { id:"__fixture-b", name:"Fixture B", pointsGranted:1, maxRank:1, description:"" };
  D.advantages.push(adv); D.disadvantages.push(dis);
  try { return fn(adv, dis); }
  finally { D.advantages.pop(); D.disadvantages.pop(); }
}

test("optionLock is symmetric — the rule is declared once, both sides honour it", () => {
  withFixture(() => {
    const ch = subject();
    ch.advantages = [{ id:"__fixture-a", rank:1, notes:"" }];
    ch.disadvantages = [{ id:"__fixture-b", rank:1, notes:"" }];
    // A declares the exclusion...
    assert.equal(Engine.optionLock(ch, "advantage", "__fixture-a").locked, true);
    // ...and B, which says nothing at all, is locked by it anyway.
    const back = Engine.optionLock(ch, "disadvantage", "__fixture-b");
    assert.equal(back.locked, true, "the exclusion did not reach back the other way");
    assert.equal(back.by, "Fixture A");
    // Drop A and B is free again.
    ch.advantages = [];
    assert.equal(Engine.optionLock(ch, "disadvantage", "__fixture-b").locked, false);
  });
});

test("requirementState reports what is missing, with the number the player has", () => {
  withFixture(() => {
    const ch = subject({ base: 4 });
    ch.advantages = [{ id:"__fixture-a", rank:1, notes:"" }];
    const bad = Engine.requirementState(ch, "advantage", "__fixture-a");
    assert.equal(bad.ok, false);
    assert.ok(bad.unmet.some(u => /REF 6 \(you have 4\)/.test(u)), bad.unmet.join(" | "));
    ch.stats.REF.base = 6;
    ch.skills.handguns = { rank:2, ipe:0 };
    assert.equal(Engine.requirementState(ch, "advantage", "__fixture-a").ok, true);
  });
});

// Decision 91: requirementState used to reimplement majorPrereqs's checks
// rather than share them, so a `requires` block naming `majorCount`,
// `milestones`, `gear`, `note` or `gmApproval` was silently treated as met —
// none of those fields were even read. Both machine-checkable (majorCount,
// blocking) and prose (gmApproval, non-blocking but surfaced) fields are
// exercised here so a regression to the old per-function duplication shows up
// as a real assertion failure, not a passing test that never looked.
test("requirementState checks the full prerequisite vocabulary, not just stats/skills/advantages", () => {
  const adv = { id:"__fixture-c", name:"Fixture C", cost:1, maxRank:1, description:"",
                requires:{ majorCount:1, gmApproval:true } };
  D.advantages.push(adv);
  try {
    const ch = subject();
    const before = Engine.requirementState(ch, "advantage", "__fixture-c");
    assert.equal(before.ok, false, "majorCount:1 must gate with zero Majors taken");
    assert.ok(before.unmet.some(u => /1 Major Milestone taken/.test(u)), before.unmet.join(" | "));
    assert.ok(before.manual.includes("Requires GM approval"), before.manual.join(" | "));

    ch.progression.milestones.major.push({ id:"__any", date:new Date().toISOString() });
    const after = Engine.requirementState(ch, "advantage", "__fixture-c");
    assert.equal(after.ok, true, "one Major taken should satisfy majorCount:1");
    assert.ok(after.manual.includes("Requires GM approval"), "gmApproval stays a manual note, not a block");
  } finally { D.advantages.pop(); }
});

// Decision 91: heldIds only scanned advantages/disadvantages, so a skill could
// never appear on either side of an excludes pair even though skills host
// picks the same way. Exercise both directions with a real fixture skill.
test("optionLock reaches skills on both sides of an exclusion (Decision 91)", () => {
  const skill = { id:"__fixture-skill", name:"Fixture Skill", category:"combat",
                   primaryStat:"REF", description:"", excludes:["__fixture-a"] };
  const adv = { id:"__fixture-a", name:"Fixture A", cost:1, maxRank:2, description:"" };
  D.skills.push(skill); D.advantages.push(adv);
  try {
    const ch = subject();
    ch.skills["__fixture-skill"] = { rank:1, ipe:0 };
    // Direction: the advantage says nothing, but the held skill excludes it.
    const lockA = Engine.optionLock(ch, "advantage", "__fixture-a");
    assert.equal(lockA.locked, true, "a held skill's excludes must lock the other side");
    assert.equal(lockA.by, "Fixture Skill");
    // Direction: the skill's own excludes fires when the advantage is held.
    ch.advantages = [{ id:"__fixture-a", rank:1, notes:"" }];
    const lockSkill = Engine.optionLock(ch, "skill", "__fixture-skill");
    assert.equal(lockSkill.locked, true, "a skill's own excludes must fire against a held advantage");
    assert.equal(lockSkill.by, "Fixture A");
  } finally { D.skills.pop(); D.advantages.pop(); }
});

test("picksFor scales the slot count with rank and setSelection refuses a duplicate", () => {
  withFixture(() => {
    const ch = subject();
    ch.advantages = [{ id:"__fixture-a", rank:2, notes:"" }];
    const [st] = Engine.picksFor(ch, "advantage", "__fixture-a");
    assert.equal(st.need, 2, "perRank did not scale with rank");
    assert.equal(st.complete, false);
    assert.ok(st.options.every(o => Engine.skillById(o.id).category === "combat"),
      "the category filter let a non-combat skill through");

    assert.equal(Engine.setSelection(ch, "advantage", "__fixture-a", "skill", 0, "handguns").ok, true);
    const dup = Engine.setSelection(ch, "advantage", "__fixture-a", "skill", 1, "handguns");
    assert.equal(dup.ok, false, "distinct let the same skill be chosen twice");
    assert.match(dup.why, /different one for each rank/);
    assert.equal(Engine.setSelection(ch, "advantage", "__fixture-a", "skill", 1, "melee").ok, true);
    assert.equal(Engine.picksFor(ch, "advantage", "__fixture-a")[0].complete, true);

    // Beyond the last slot there is nothing to write to.
    assert.equal(Engine.setSelection(ch, "advantage", "__fixture-a", "skill", 2, "archery").ok, false);
  });
});

test("trimSelections drops the slots a rank drop took away", () => {
  withFixture(() => {
    const ch = subject();
    ch.advantages = [{ id:"__fixture-a", rank:2, notes:"" }];
    Engine.setSelection(ch, "advantage", "__fixture-a", "skill", 0, "handguns");
    Engine.setSelection(ch, "advantage", "__fixture-a", "skill", 1, "melee");
    ch.advantages[0].rank = 1;
    Engine.trimSelections(ch, "advantage", "__fixture-a");
    assert.deepEqual([...ch.advantages[0].selections.skill], ["handguns"]);
  });
});

test("validate reports locks, unmet gates and unfilled picks on the CP step", () => {
  withFixture(() => {
    const ch = subject({ base: 4 });
    ch.advantages = [{ id:"__fixture-a", rank:1, notes:"" }];
    ch.disadvantages = [{ id:"__fixture-b", rank:1, notes:"" }];
    const msgs = Engine.validate("character-points", ch)
      .filter(i => i.level === "error").map(i => i.msg);
    assert.ok(msgs.some(m => /can.t be taken together/.test(m)), msgs.join(" | "));
    assert.ok(msgs.some(m => /Fixture A requires/.test(m)), msgs.join(" | "));
    assert.ok(msgs.some(m => /Choose 1 Skill for Fixture A \(0\/1\)/.test(m)), msgs.join(" | "));
  });
});

test("a freeform GM-approval pick warns, it never blocks the lock", () => {
  // The mechanical picks are the app's business, the fiction is the table's. A
  // player who has not had the GM conversation yet must still be able to
  // finish a character.
  const ch = subject();
  ch.disadvantages = [{ id:"cursed", rank:1, notes:"" }];
  const issues = Engine.validate("character-points", ch);
  const about = issues.filter(i => /Cursed/.test(i.msg));
  assert.equal(about.length, 1, `expected one Cursed issue, got: ${issues.map(i=>i.msg).join(" | ")}`);
  assert.equal(about[0].level, "warn", "an unwritten curse is blocking the lock");
});

test("the new readers are total on every character migrate() can return", () => {
  const failures = [];
  for (const [label, ch] of Object.entries(degenerates())){
    for (const kind of ["advantage", "disadvantage", "skill"]){
      for (const id of ["common-sense", "cursed", "martial-arts", "no-such-id"]){
        for (const fn of ["optionLock", "requirementState", "picksFor"]){
          try { Engine[fn](ch, kind, id); }
          catch (e) { failures.push(`${fn}(${label}, ${kind}, ${id}) -> ${e.message}`); }
        }
        try { Engine.setSelection(ch, kind, id, "skill", 0, "handguns"); }
        catch (e) { failures.push(`setSelection(${label}, ${kind}, ${id}) -> ${e.message}`); }
        try { Engine.trimSelections(ch, kind, id); }
        catch (e) { failures.push(`trimSelections(${label}, ${kind}, ${id}) -> ${e.message}`); }
      }
    }
  }
  assert.deepEqual(failures, []);
});

test("migrate folds the three old specialization fields into one array (A3)", () => {
  // Schema 0.5. The three fields all meant "the required pick"; two parallel
  // models were the root of A1 and A2.
  const arc = Engine.migrate({ identity:{ archetype:"arcanist" },
                               archetypeChoices:{ aberrations:["arcane-fortitude","unshakable-mind"] } });
  assert.deepEqual([...arc.archetypeChoices.specialization], ["arcane-fortitude","unshakable-mind"]);

  const prof = Engine.migrate({ identity:{ archetype:"professional" },
                                archetypeChoices:{ subtype:"cleaner" } });
  assert.deepEqual([...prof.archetypeChoices.specialization], ["cleaner"]);

  const old = Engine.migrate({ identity:{ archetype:"werewolf", specialization:"trueborn" } });
  assert.deepEqual([...old.archetypeChoices.specialization], ["trueborn"]);

  // The retired fields are gone, not merely ignored — leaving them would let a
  // reader drift back onto the old path.
  for (const c of [arc, prof, old]){
    assert.equal(c.archetypeChoices.aberrations, undefined);
    assert.equal(c.archetypeChoices.subtype, undefined);
    assert.equal(c.identity.specialization, undefined);
    assert.equal(c.meta.schemaVersion, "0.10");
  }
  // Idempotent: migrating twice must not empty what the first pass moved.
  assert.deepEqual([...Engine.migrate(arc).archetypeChoices.specialization],
                   ["arcane-fortitude","unshakable-mind"]);
});

test("specializationNeed comes from the data, not from the archetype's name", () => {
  const ch = Engine.newCharacter();
  ch.identity.archetype = "arcanist";
  const arc = D.archetypes.find(a => a.id === "arcanist");
  for (const pl of D.powerLevels){
    ch.creation.powerLevel = pl.id;
    assert.equal(Engine.specializationNeed(ch),
                 arc.campaignPowerScaling.byPowerLevel[pl.id].aberrations,
                 `arcanist at ${pl.id}`);
  }
  // No countBy means exactly one — the silence is the declaration.
  for (const id of ["professional", "werewolf"]){
    ch.identity.archetype = id;
    assert.equal(Engine.specializationNeed(ch), 1, id);
  }
});

// ── Adversarial review of PR #7 — the findings, as guards ─────────────
// A Professional can hold the SAME advantage twice: once free through the
// Natural Advantages pool (notes:"natural") and once bought with CP
// (notes:""). `favored-skill` is in that pool AND carries picks, so this is
// reachable with shipped data, not a hypothetical.

/** A Professional holding favored-skill both free and purchased. */
function doubleHeld({ natural = 2, purchased = 1 } = {}){
  const ch = subject();
  ch.identity.archetype = "professional";
  ch.archetypeChoices.specialization = ["cleaner"];
  ch.archetypeChoices.naturalAdvantages = [{ id: "favored-skill", rank: natural }];
  ch.advantages = [];
  if (natural)   ch.advantages.push({ id: "favored-skill", rank: natural, notes: "natural" });
  if (purchased) ch.advantages.push({ id: "favored-skill", rank: purchased, notes: "" });
  return ch;
}

test("a trait held both free and purchased is ONE trait, counted once (review #1)", () => {
  // entryFor's .find() had no `notes` filter, so picksFor/setSelection/
  // trimSelections read and wrote whichever copy happened to come first —
  // silently, and differently depending on allocation order.
  const ch = doubleHeld({ natural: 2, purchased: 1 });
  const [st] = Engine.picksFor(ch, "advantage", "favored-skill");
  assert.equal(st.need, 3, "the two copies are not being counted as one trait");

  // A write must land somewhere a read can see it, whichever copy is first.
  Engine.setSelection(ch, "advantage", "favored-skill", "skill", 0, "handguns");
  assert.equal(Engine.picksFor(ch, "advantage", "favored-skill")[0].chosen[0], "handguns",
    "the write went to a copy the read cannot see");

  // Order must not change the answer.
  const flipped = doubleHeld({ natural: 2, purchased: 1 });
  flipped.advantages.reverse();
  Engine.setSelection(flipped, "advantage", "favored-skill", "skill", 0, "handguns");
  assert.equal(Engine.picksFor(flipped, "advantage", "favored-skill")[0].chosen[0], "handguns",
    "the answer depends on which copy is stored first");
  assert.equal(Engine.picksFor(flipped, "advantage", "favored-skill")[0].need, 3);

  // Exactly one copy carries the store — two would drift apart again.
  const carriers = ch.advantages.filter(a => a.selections && a.selections.skill);
  assert.equal(carriers.length, 1, "both copies grew their own selections");
});

test("distinctness spans a trait held both free and purchased (review #1)", () => {
  // Assert the REASON, not just the refusal: before the fix slot 1 did not
  // exist at all (need came from one copy's rank), so this refused with
  // "no slot" and passed while testing nothing.
  const ch = doubleHeld({ natural: 1, purchased: 1 });
  assert.equal(Engine.picksFor(ch, "advantage", "favored-skill")[0].need, 2,
    "the two rows are not adding up to one trait of rank 2");
  assert.equal(Engine.setSelection(ch, "advantage", "favored-skill", "skill", 0, "handguns").ok, true);
  const dup = Engine.setSelection(ch, "advantage", "favored-skill", "skill", 1, "handguns");
  assert.equal(dup.ok, false, "the same Skill was accepted twice across the two rows");
  assert.match(dup.why, /different one for each rank/,
    `refused for the wrong reason: ${dup.why}`);
});

test("a free-only trait demands its picks and clears when they are filled", () => {
  // The engine half of review #2 was already right: a natural-mirrored entry
  // does demand its picks. The bug was entirely in the UI, which rendered no
  // control for it — guarded in tests/smoke.test.mjs. This pins the invariant
  // the UI fix has to satisfy.
  const ch = doubleHeld({ natural: 2, purchased: 0 });
  const [st] = Engine.picksFor(ch, "advantage", "favored-skill");
  assert.equal(st.need, 2, "a free-only trait asks for nothing");
  const errs = Engine.validate("character-points", ch)
    .filter(i => i.level === "error" && /Favored Skill/.test(i.msg));
  assert.equal(errs.length, 1, "the demand disappeared instead of being made fillable");

  for (const [i, id] of ["handguns", "melee"].entries())
    Engine.setSelection(ch, "advantage", "favored-skill", "skill", i, id);
  assert.equal(Engine.validate("character-points", ch)
    .filter(i => i.level === "error" && /Favored Skill/.test(i.msg)).length, 0,
    "filling every slot did not clear the error");
});

test("specializationNeed asks for nothing when it cannot resolve a count (review #6)", () => {
  // main gated the aberration requirement behind a live scaling row. Falling
  // back to 1 makes a corrupt import demand a pick the data never asked for.
  const ch = Engine.newCharacter();
  ch.identity.archetype = "arcanist";          // declares countBy
  ch.creation.powerLevel = null;               // ...which cannot be resolved
  assert.equal(Engine.specializationNeed(ch), 0,
    "an unresolvable countBy invented a requirement");
  assert.equal(Engine.validate("archetype", ch)
    .filter(i => i.level === "error" && /Aberration/.test(i.msg)).length, 0);

  // An archetype with no countBy still means exactly one — unchanged.
  ch.identity.archetype = "professional";
  assert.equal(Engine.specializationNeed(ch), 1);
});

// ── Batch 3b — grants (Decisions 87-88) ────────────────────────────────

test("Educated adds 10 Skill Points per rank to the pool (grants)", () => {
  const ch = subject();
  ch.creation.rolls.skillPoints = 30;
  const before = Engine.skillPool(ch).total;
  ch.advantages.push({ id: "educated", rank: 2, notes: "" });
  assert.equal(Engine.skillPool(ch).total, before + 20);
});

test("Hard to Kill adds 1 HP per Health Level per rank (grants)", () => {
  const ch = subject({ bod: 5 });
  const before = Engine.health(ch).hpPer;
  ch.advantages.push({ id: "hard-to-kill", rank: 3, notes: "" });
  assert.equal(Engine.health(ch).hpPer, before + 3);
});

test("Lucky and Unlucky shift LUCK spend costs, and cancel out if both are held (grants)", () => {
  const ch = subject();
  const costsById = c => Object.fromEntries(Engine.luckState(c).spendActions.map(sa => [sa.id, sa.cost]));
  const base = costsById(ch);
  assert.equal(base.boost, 2);
  assert.equal(base.explode, 3);

  ch.advantages.push({ id: "lucky", rank: 1, notes: "" });
  const lucky = costsById(ch);
  assert.equal(lucky.boost, 1, "Boost should cost 1 with Lucky");
  assert.equal(lucky.explode, 2, "Explode should cost 2 with Lucky");

  ch.disadvantages.push({ id: "unlucky", rank: 1, notes: "" });
  const both = costsById(ch);
  assert.equal(both.boost, base.boost, "Lucky + Unlucky did not cancel back to base");
  assert.equal(both.explode, base.explode, "Lucky + Unlucky did not cancel back to base");
});

test("a LUCK spend cost never drops below 0 (grants floor)", () => {
  const ch = subject();
  // Pathological — Lucky is maxRank 1 — but the floor has to hold
  // structurally regardless of how a future grant stacks discounts.
  ch.advantages.push({ id: "lucky", rank: 1, notes: "" });
  ch.advantages.push({ id: "lucky", rank: 1, notes: "second" });
  for (const sa of Engine.luckState(ch).spendActions) assert.ok(sa.cost >= 0, `${sa.id} went negative`);
});

test("Long-Lived's Milestone grants stack across ranks (F17, Decision 88)", () => {
  const ch = subject();
  assert.equal(Engine.milestoneState(ch).minorAvail, 0);
  assert.equal(Engine.milestoneState(ch).majorAvail, 0);

  ch.advantages.push({ id: "long-lived", rank: 3, notes: "" });
  const ms = Engine.milestoneState(ch);
  assert.equal(ms.minorAvail, 2, "rank 3 should still carry rank 1's and rank 2's Minor grants");
  assert.equal(ms.majorAvail, 1);
  assert.equal(ms.minorLeft, 2);
  assert.equal(ms.majorLeft, 1);
});

test("Long-Lived below rank 2 grants only what its rank has reached", () => {
  const ch = subject();
  ch.advantages.push({ id: "long-lived", rank: 1, notes: "" });
  const ms = Engine.milestoneState(ch);
  assert.equal(ms.minorAvail, 1);
  assert.equal(ms.majorAvail, 0);
});

test("grants() is computed live off held traits, never stored on the character", () => {
  const ch = subject();
  ch.advantages.push({ id: "educated", rank: 1, notes: "" });
  assert.equal(Engine.grants(ch).skillPoints, 10);
  ch.advantages = [];
  assert.equal(Engine.grants(ch).skillPoints, 0, "a removed advantage's effect survived");
});

// ── Conditions (Decisions 95–96) ──────────────────────────────────────

test("the Conditions catalog is well-formed: unique ids, typed hooks, real locations", () => {
  const ids = D.conditions.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate condition id");
  for (const c of D.conditions) {
    for (const k of ["id", "name", "short", "effect", "recovery"])
      assert.equal(typeof c[k], "string", `${c.id}.${k}`);
    for (const k of ["painLevels", "rollPenalty", "attackDefense"])
      if (k in c) assert.equal(typeof c[k], "number", `${c.id}.${k}`);
    if (c.counter) assert.ok(c.counter.max > 0 && c.counter.label, `${c.id}.counter`);
  }
  // Every row of 054's table, plus Dying (plan CQ9).
  assert.equal(D.conditions.length, 20);
  assert.ok(D.bodyLocations.length >= 6);
});

test("a Condition's flat penalty lands on every Skill Check, and only there (F20, Decision 98)", () => {
  const ch = subject();
  const before = Engine.skillLine(ch, "handguns").checkBonus;
  Engine.addCondition(ch, { id: "disoriented" });
  const line = Engine.skillLine(ch, "handguns");
  assert.equal(line.checkBonus, before - 1);
  assert.equal(line.breakdown.conditions, -1);
  assert.equal(line.breakdown.pain, 0, "a roll penalty is not Pain");
  const p = Engine.painState(ch);
  assert.equal(p.level, 0);
  assert.equal(p.essencePenalty, 0, "just Skill Checks — Essence is untouched");
  assert.equal(D.conditionRules.rollPenalty.appliesTo, "skillChecks");
});

test("different Conditions' penalties stack; conditional and attack/defense ones are not summed (F21, Decision 98)", () => {
  const ch = subject();
  for (const id of ["burning", "disoriented", "frightened", "blinded", "prone"]) Engine.addCondition(ch, { id });
  const st = Engine.conditionState(ch);
  assert.equal(st.rollPenalty, -2, "Burning + Disoriented");
  assert.equal(st.conditional.length, 1, "Frightened is shown, not summed");
  assert.equal(st.attackDefense.map(a => a.value).join(","), "-5,-3");
  assert.equal(Engine.skillLine(ch, "handguns").breakdown.conditions, -2);
});

test("a location-bearing Condition is one per body part and demands one (F22, Decision 98)", () => {
  const ch = subject();
  assert.equal(Engine.addCondition(ch, { id: "injured" }).ok, false, "no body part was accepted");
  assert.equal(Engine.addCondition(ch, { id: "injured", location: "elbow" }).ok, false);
  assert.equal(Engine.addCondition(ch, { id: "injured", location: "left-arm" }).ok, true);
  assert.equal(Engine.addCondition(ch, { id: "injured", location: "right-leg" }).ok, true);
  assert.equal(Engine.addCondition(ch, { id: "injured", location: "left-arm" }).ok, false);
  assert.equal(Engine.conditionState(ch).active.map(a => a.label).join(" | "),
               "Injured (Left Arm) | Injured (Right Leg)");
  // A location on a Condition that has none is ignored, not a second key.
  Engine.addCondition(ch, { id: "bleeding", location: "torso" });
  assert.equal(Engine.addCondition(ch, { id: "bleeding", location: "head" }).ok, false);
  assert.equal(ch.trackers.conditions.find(e => e.id === "bleeding").location, undefined);
});

test("Conditions are inputs: nothing derived is written to the character", () => {
  const ch = subject();
  Engine.addCondition(ch, { id: "agonized" });
  Engine.addCondition(ch, { id: "stunned" });
  Engine.painState(ch); Engine.skillLine(ch, "handguns"); Engine.conditionState(ch);
  assert.deepEqual(JSON.parse(JSON.stringify(ch.trackers.conditions)),
                   [{ id: "agonized" }, { id: "stunned" }]);
});

test("adding and removing a Condition is undoable through the generic audit trail", () => {
  const ch = subject();
  let before = JSON.parse(JSON.stringify(ch));
  Engine.addCondition(ch, { id: "bleeding" });
  Engine.recordAction(ch, "condition", "Bleeding", before);
  before = JSON.parse(JSON.stringify(ch));
  Engine.removeCondition(ch, 0);
  Engine.recordAction(ch, "condition", "Bleeding cleared", before);
  Engine.undoLastAction(ch);
  assert.equal(ch.trackers.conditions.length, 1);
  Engine.undoLastAction(ch);
  assert.equal(ch.trackers.conditions.length, 0);
});

test("migrate brings a 0.7 file to 0.8: conditions, damage inputs, armor fields", () => {
  const old = subject();
  old.meta.schemaVersion = "0.7";
  delete old.trackers.conditions; delete old.trackers.massiveLevels; delete old.trackers.witheringDamage;
  old.armor = [{ id: "kevlar-vest", integrityLoss: 3, notes: "" }, { custom: true, name: "Coat", integrityLoss: 0 }];
  Engine.migrate(old);
  assert.equal(old.meta.schemaVersion, "0.10");
  assert.ok(Array.isArray(old.trackers.conditions));
  assert.equal(old.trackers.massiveLevels, 0);
  assert.equal(old.trackers.witheringDamage, 0);
  for (const a of old.armor) {
    assert.equal(a.worn, false); assert.equal(a.scrapped, false);
    assert.ok(Array.isArray(a.upgrades));
  }
  assert.equal(old.armor[0].integrityLoss, 3, "migrate must not touch existing armor state");
});

test("migrate drops junk and duplicate Conditions, keeping the first of each", () => {
  const c = Engine.migrate({ trackers: { conditions: [
    null, "bleeding", { id: 7 }, { id: "bleeding" }, { id: "bleeding", note: "second" },
    { id: "injured", location: "left-arm" }, { id: "injured", location: "right-arm" },
    { id: "injured", location: "left-arm" } ], massiveLevels: "2", witheringDamage: -4 } });
  assert.equal(c.trackers.conditions.map(e => e.id + (e.location ? "@" + e.location : "")).join(","),
               "bleeding,injured@left-arm,injured@right-arm");
  assert.equal(c.trackers.conditions[0].note, undefined, "kept the duplicate instead of the first");
  assert.equal(c.trackers.massiveLevels, 2);
  assert.equal(c.trackers.witheringDamage, 0);
});

test("a character round-trips through export and migrate with its Conditions intact", () => {
  const ch = subject();
  Engine.addCondition(ch, { id: "dying" });
  Engine.setConditionMarks(ch, 0, 2);
  Engine.addCondition(ch, { id: "maimed", location: "left-leg", note: "the train" });
  const back = Engine.migrate(JSON.parse(JSON.stringify(Engine.buildExport(ch))));
  assert.deepEqual(JSON.parse(JSON.stringify(back.trackers.conditions)),
                   JSON.parse(JSON.stringify(ch.trackers.conditions)));
  assert.deepEqual(JSON.parse(JSON.stringify(Engine.migrate(Engine.newCharacter()).trackers)),
                   JSON.parse(JSON.stringify(Engine.newCharacter().trackers)));
});

test("conditionState and versionCheck survive a Condition the data no longer defines", () => {
  const ch = Engine.migrate({ trackers: { conditions: [{ id: "no-such-condition" }, { id: "dying", marks: "lots" }] } });
  const st = Engine.conditionState(ch);
  assert.equal(st.active[0].missing, true);
  assert.equal(st.active[0].name, "no-such-condition");
  assert.equal(st.active[1].marks, 0, "a non-numeric mark count became something other than 0");
  assert.equal(st.painLevels, 0);
  assert.ok(Engine.versionCheck(ch).some(i => /Condition "no-such-condition"/.test(i)));
});

// ── Design-team rulings, 2026-09-22 (Decision 97) ─────────────────────

test("learning a new skill after creation costs a flat 25 IP, not the rank-1 price (F14)", () => {
  const ch = subject();
  const fresh = Engine.ipCost(ch, "skill", "handguns");
  assert.equal(fresh.ok, true);
  assert.equal(fresh.from, 0);
  assert.equal(fresh.cost, 25);
  assert.equal(D.ip.skillIncreaseCost.newSkill, 25, "the price lives in the data");
  // Past rank 0 the formula is unchanged: 5 × current rank.
  ch.skills.handguns = { rank: 1, ipe: 0 };
  assert.equal(Engine.ipCost(ch, "skill", "handguns").cost, 5);
  ch.skills.handguns = { rank: 4, ipe: 0 };
  assert.equal(Engine.ipCost(ch, "skill", "handguns").cost, 20);
});

test("a Focused skill keeps its 3× rate past rank 0, and a new one is 25 IP too (F14, literal reading)", () => {
  const ch = subject();
  ch.identity.archetype = "professional";
  const sub = Engine.archetype(ch).specialization.options.find(o => (o.focusedSkills || []).length);
  ch.archetypeChoices.specialization = [sub.id];
  const id = Engine.focusedSkillIds(ch)[0];
  assert.ok(id, "no Focused skill resolved for the fixture");
  delete ch.skills[id];
  assert.equal(Engine.ipCost(ch, "skill", id).cost, 25);
  ch.skills[id] = { rank: 2, ipe: 0 };
  const c = Engine.ipCost(ch, "skill", id);
  assert.equal(c.focused, true);
  assert.equal(c.cost, 6);
});

test("closed flags stay closed: LUCK and boosts are 1:1 CP, Long-Lived stacks (F1, F2, F17)", () => {
  assert.equal(D.resources.luck.cpCostPerPoint, 1);
  assert.equal(D.resources.luck.flagged, undefined);
  assert.equal(D.creationFlow.boostRules.cpCostPerPoint, 1);
  assert.equal(D.creationFlow.boostRules.flagged, undefined);
  assert.equal(Engine.advById("long-lived").flagged, undefined);
  assert.equal(D.ip.flagged, undefined);
});

test("different Conditions' penalties stop at the -8 cap (F21, Decision 98)", () => {
  assert.equal(D.conditionRules.penaltyStacking.cap, -8);
  D.conditions.push({ id: "__fixture-a", name: "A", rollPenalty: -5 }, { id: "__fixture-b", name: "B", rollPenalty: -5 });
  try {
    const ch = subject();
    ch.trackers.conditions = [{ id: "__fixture-a" }, { id: "__fixture-b" }];
    assert.equal(Engine.conditionState(ch).rollPenalty, -8);
    assert.equal(Engine.skillLine(ch, "handguns").breakdown.conditions, -8);
  } finally { D.conditions.splice(-2, 2); }
});

test("only Injured and Maimed are body-part Conditions (F22, Decision 98)", () => {
  assert.deepEqual([...D.conditions.filter(c => c.location).map(c => c.id)], ["injured", "maimed"]);
  const ch = subject();
  assert.equal(Engine.addCondition(ch, { id: "desynced" }).ok, true, "DeSynced still demands a body part");
});

test("the Conditions rules carry no open flag any more (F20–F22 closed)", () => {
  for (const k of ["rollPenalty", "penaltyStacking", "locationStacking"])
    assert.equal(D.conditionRules[k].flagged, undefined, k);
});

// ── Taking a hit (Decision 99) ────────────────────────────────────────
// The CRB's numbers are pinned in rules.test.mjs; these guard the machinery.

test("resolveHit and applyHit are total: every degenerate character, every kind of hit", () => {
  const hits = [
    {}, { damage: "x" }, { damage: 5 }, { damage: 5, damageType: "nope" },
    { damage: 12, damageType: "ballistic", protRoll: 3 },
    { damage: 12, damageType: "ballistic", protRoll: "x" },
    { damage: 30, damageType: "blunt", category: "massive", location: "nowhere" },
    { damage: 30, damageType: "energy", category: "withering", ap: true },
  ];
  const failures = [];
  for (const [label, ch] of Object.entries(degenerates())){
    hits.forEach((hit, i)=>{
      try {
        Engine.resolveHit(ch, hit);
        Engine.applyHit(ch, hit, { shock: "fail", atZero: "fail", conditions: ["bleeding", { id: "injured", location: "torso" }] });
      } catch (e) { failures.push(`hit #${i} on ${label} -> ${e.message}`); }
    });
  }
  assert.deepEqual(failures, []);
});

test("resolveHit is pure: it reports a patch and writes nothing", () => {
  const ch = subject();
  ch.armor.push({ id: "kevlar-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: [] });
  const before = JSON.stringify(ch);
  const r = Engine.resolveHit(ch, { damage: 25, damageType: "ballistic", category: "massive" });
  assert.equal(JSON.stringify(ch), before);
  assert.equal(r.patch.armor.scrapped, true);
});

test("a hit is one undoable action, armor and Conditions included (plan P6)", () => {
  const ch = subject();
  ch.armor.push({ id: "kevlar-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: [] });
  const snap = JSON.parse(JSON.stringify(ch));
  Engine.applyHit(ch, { damage: 30, damageType: "ballistic", category: "massive" },
                  { conditions: [{ id: "maimed", location: "left-arm" }], atZero: "fail" });
  Engine.recordAction(ch, "damage", "Took a hit", snap);
  assert.ok(ch.trackers.massiveLevels > 0 && ch.armor[0].scrapped && ch.trackers.conditions.length > 0);
  assert.ok(Engine.undoLastAction(ch).ok);
  const strip = c => JSON.stringify({ ...c, audit: [] });
  assert.equal(strip(ch), strip(snap));
});

test("applyHit re-resolves from its inputs, so a stale preview can't write stale numbers", () => {
  const ch = subject();
  const hit = { damage: 6, damageType: "blade" };
  Engine.resolveHit(ch, hit);                // the dialog's preview
  ch.trackers.damage = 10;                   // something else changed meanwhile
  Engine.applyHit(ch, hit);
  assert.equal(ch.trackers.damage, 16);
});

test("applyHit only adds Conditions the hit offered (no Injured from a regular hit, CQ5)", () => {
  const ch = subject({ bod: 10 });
  const r = Engine.applyHit(ch, { damage: 8, damageType: "ballistic" },
                            { conditions: ["bleeding", { id: "injured", location: "left-arm" }] });
  assert.equal(r.added.join(","), "bleeding");
});

test("Withering is recorded as the part of the damage that got through", () => {
  const ch = subject({ bod: 10 });
  ch.armor.push({ custom: true, name: "Vest", prot: "1d6", res: 3, integrity: 20, integrityLoss: 0, worn: true, scrapped: false, upgrades: [] });
  Engine.applyHit(ch, { damage: 9, damageType: "ballistic", category: "withering", protRoll: 2 });
  assert.equal(ch.trackers.damage, 4);
  assert.equal(ch.trackers.witheringDamage, 4);
  Engine.applyHit(ch, { damage: 3, damageType: "blade" });
  assert.equal(ch.trackers.witheringDamage, 4, "a regular hit adds none");
});

test("resolveHit refuses a PROT roll the worn die can't produce", () => {
  const ch = subject();
  ch.armor.push({ id: "kevlar-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: [] });
  assert.equal(Engine.resolveHit(ch, { damage: 8, damageType: "blade", protRoll: 7 }).ok, false, "1d6 can't roll 7");
  assert.equal(Engine.resolveHit(ch, { damage: 8, damageType: "blade" }).ok, false, "PROT is required when armor answers");
  assert.equal(Engine.resolveHit(ch, { damage: 8, damageType: "blade", protRoll: 6 }).ok, true);
});

test("how a damage category resolves is data, not its id (PR #26 review, findings 2–3)", () => {
  // A synthetic category, the way the Batch 3 fixtures work: if the engine
  // still keyed on the literal "massive", this one would resolve as regular.
  const fixture = { id: "__fixture-siege", name: "Fixture", bypassesArmor: true, inflicts: ["deafened"], text: "" };
  D.damageCategories.push(fixture);
  try {
    const r = Engine.resolveHit(subject({ bod: 10 }), { damage: 20, damageType: "blunt", category: fixture.id });
    assert.equal(r.bypassesArmor, true);
    assert.equal(r.levelsLost, 3, "20 bypassing damage, no armor: 2 + 1");
    assert.ok(r.prompts.conditions.includes("deafened"), "the category's own inflicts weren't offered");
    assert.ok(!r.prompts.conditions.includes("injured"), "Massive's inflicts leaked onto another category");
  } finally { D.damageCategories.pop(); }
});

test("F23 surfaces where it bites: an Electric hit carries the stub's player note", () => {
  const r = Engine.resolveHit(subject(), { damage: 5, damageType: "electric" });
  assert.equal(r.notes.length, 1);
  assert.equal(Engine.resolveHit(subject(), { damage: 5, damageType: "blade" }).notes.length, 0);
});

// ── Loadout & recovery (Decision 100) ─────────────────────────────────
// The CRB's numbers are pinned in rules.test.mjs; these guard the machinery.

test("the Loadout and recovery functions are total on every degenerate character", () => {
  const failures = [];
  for (const [label, ch] of Object.entries(degenerates())){
    ch.weapons.push(null, 4, { id: "no-such-weapon" }, { custom: true }, { id: "combat-knife" });
    const calls = {
      weaponLine: () => [-1, 0, 1, 2, 3, 4, 99].forEach(i => Engine.weaponLine(ch, i)),
      upgradeOptions: () => [-1, 0, 1, 2, 3, 99].forEach(i => Engine.upgradeOptions(ch, i)),
      setWorn: () => [0, 1, 2, 3, 99].forEach(i => Engine.setWorn(ch, i, true)),
      addUpgrade: () => [0, 2, 3, 99].forEach(i => Engine.addUpgrade(ch, i, "Tri-Weave")),
      removeUpgrade: () => [0, 2, 3, 99].forEach(i => Engine.removeUpgrade(ch, i, 0)),
      armorWear: () => [0, 2, 3, 99].forEach(i => Engine.armorWear(ch, i, { difficulty: "hard", roll: 3, selfHealCheck: 4, selfHealRoll: 2 })),
      repairArmor: () => [0, 2, 3, 99].forEach(i => { Engine.repairArmor(ch, i, { roll: 2 }); Engine.repairArmor(ch, i, { full: true }); }),
      naturalHealing: () => Engine.naturalHealing(ch),
      naturalArmor: () => { Engine.naturalArmor(ch, ["iron-shirt", "x"]); Engine.naturalArmor(ch, "junk"); },
      nanomedKit: () => [undefined, 0, -3, "x", 2, 99].forEach(d => Engine.nanomedKit(ch, d)),
      nanomed: () => { Engine.heal(ch, { kind: "nanomed", dose: "x", hp: 2 }); Engine.heal(ch, { kind: "nanomed" }); },
      heal: () => { Engine.heal(ch, { kind: "natural", hp: 3 }); Engine.heal(ch, { kind: "focused", hp: "x", clear: [0, 9], massive: 99 }); Engine.heal(ch, {}); },
      resolveReset: () => { Engine.resolveReset(ch); Engine.resolveReset(ch, { sources: { 0: "x" } }); },
      applyReset: () => Engine.applyReset(ch, { sources: { 0: 2, 1: 2, 2: 2, 3: 2 } }, { atZero: "fail", dyingCheck: "fail" }),
      addLoadout: () => { Engine.addLoadout(ch, "armor", "kevlar-vest", { buy: true }); Engine.addLoadout(ch, "weapons", "nope"); Engine.addLoadout(ch, "gear", "x"); },
      addCustomLoadout: () => { Engine.addCustomLoadout(ch, "armor"); Engine.addCustomLoadout(ch, "weapons"); Engine.addCustomLoadout(ch, "x"); },
      removeLoadout: () => { Engine.removeLoadout(ch, "armor", 99); Engine.removeLoadout(ch, "weapons", 0); },
      weaponMods: () => [-1, 0, 1, 2, 3, 4, 99].forEach(i => { Engine.weaponModOptions(ch, i); Engine.addWeaponMod(ch, i, "Scope"); Engine.addWeaponMod(ch, i, "nope"); Engine.removeWeaponMod(ch, i, 0); }),
      rounds: () => [-1, 0, 1, 2, 3, 4, 99].forEach(i => { Engine.fireWeapon(ch, i, "S"); Engine.fireWeapon(ch, i, "x"); Engine.fireWeapon(ch, i); Engine.reloadWeapon(ch, i); }),
      gear: () => { ch.gear.push(null, 3, { id: "nope" }, { custom: true }, { id: "shield-charm", chargesUsed: "x" }, { id: "quickstitch", qty: -4 });
        [-1, 0, 1, 2, 3, 4, 5, 99].forEach(i => { Engine.gearLine(ch, i); Engine.useGear(ch, i, 1); Engine.useGear(ch, i, "x"); Engine.useCharge(ch, i); Engine.rechargeGear(ch, i); });
        Engine.carriedGear(ch, "quickstitch"); Engine.carriedGear(null, "x"); Engine.addLoadout(ch, "gear", "quickstitch", { buy: true }); Engine.catalogLine(ch, "gear", "shield-charm"); },
      catalogLine: () => { Engine.catalogLine(ch, "weapons", "combat-knife"); Engine.catalogLine(ch, "armor", "kevlar-vest");
        Engine.catalogLine(ch, "weapons", "nope"); Engine.catalogLine(ch, "gear", "x"); Engine.catalogLine(null, "weapons", "combat-knife"); },
    };
    for (const [fn, call] of Object.entries(calls)){
      try { call(); } catch (e) { failures.push(`${fn}(${label}) -> ${e.message}`); }
    }
  }
  assert.deepEqual(failures, []);
});

test("W4: a catalog entry's line before it's carried matches the line once it is, and Buy says why not", () => {
  const ch = subject();
  ch.trackers.credits.current = 1000;
  D.weapons.forEach((w, i) => {
    ch.weapons.push({ id: w.id, notes: "" });
    const carried = { ...Engine.weaponLine(ch, i) }, pre = { ...Engine.catalogLine(ch, "weapons", w.id) };
    for (const k of ["kind", "price", "availability", "flavorLine", "buy"]) delete pre[k];   // the catalog's own
    for (const k of Object.keys(pre)) assert.deepEqual(pre[k], carried[k], `${w.id}: ${k} differs before and after carrying it`);
  });
  const vest = Engine.catalogLine(ch, "armor", "kevlar-vest");
  assert.deepEqual([vest.prot, vest.res, vest.integrityMax, vest.price, vest.buy.ok], ["1d6", 2, 20, 500, true]);
  const pricey = D.weapons.find(w => w.cost > 1000);
  assert.match(Engine.catalogLine(ch, "weapons", pricey.id).buy.why, /You have 1,000Ç/);
  const noPrice = [...D.weapons, ...D.armor].find(d => !(typeof d.cost === "number" && d.cost > 0));
  if (noPrice) assert.equal(Engine.catalogLine(ch, D.weapons.includes(noPrice) ? "weapons" : "armor", noPrice.id).buy.ok, false);
  assert.equal(Engine.catalogLine(ch, "weapons", "nope"), null);
});

test("every catalog weapon resolves: its category is listed, its skill exists, its damage reads", () => {
  const cats = new Set(D.weaponCategories.map(c => c.id));
  const ch = subject();
  D.weapons.forEach((w, i) => {
    assert.ok(cats.has(w.category), `${w.id}: category "${w.category}" isn't in weaponCategories`);
    assert.ok(Engine.skillById(w.skill), `${w.id}: skill "${w.skill}" doesn't exist`);
    ch.weapons.push({ id: w.id, notes: "" });
    const l = Engine.weaponLine(ch, i);
    assert.equal(typeof l.attack, "number", `${w.id}: no attack total`);
    if (typeof w.damage === "number" || /^BOD\+\d+$/.test(String(w.damage)))
      assert.equal(typeof l.damage, "number", `${w.id}: damage "${w.damage}" didn't resolve`);
  });
});

test("Buy pays the catalog price out of Çredits in the same action, and one undo takes back both", () => {
  const ch = subject();
  ch.trackers.credits.current = 600;
  assert.match(Engine.addLoadout(ch, "armor", "specops-vest", { buy: true }).why, /costs 1800Ç\. You have 600Ç/);
  assert.equal(Engine.addLoadout(ch, "weapons", "hxc1-absolute", { buy: true }).ok, false, "a By Contract price was bought");
  assert.equal(Engine.addLoadout(ch, "weapons", "hxc1-absolute").ok, true, "…but it can still be added");
  const snap = JSON.parse(JSON.stringify(ch));
  const r = Engine.addLoadout(ch, "armor", "kevlar-vest", { buy: true });
  Engine.recordAction(ch, "loadout", "Bought", snap);
  assert.equal(r.paid, 500);
  assert.equal(ch.trackers.credits.current, 100);
  assert.equal(ch.trackers.credits.ledger.at(-1).note, "Bought Kevlar Vest");
  assert.ok(Engine.undoLastAction(ch).ok);
  const strip = c => JSON.stringify({ ...c, audit: [] });
  assert.equal(strip(ch), strip(snap));
});

test("wearing is one piece per slot: the first goes on, putting one on takes the other off", () => {
  const ch = subject();
  Engine.addLoadout(ch, "armor", "kevlar-vest");
  Engine.addLoadout(ch, "armor", "leather-jacket");
  Engine.addLoadout(ch, "armor", "motorcycle-helmet");
  assert.equal(ch.armor.map(a => a.worn).join(","), "true,false,true", "the first piece in each slot goes on");
  Engine.setWorn(ch, 1, true);
  assert.equal(ch.armor.map(a => a.worn).join(","), "false,true,true", "a helmet came off with the vest");
  assert.equal(Engine.armorState(ch).worn.name, "Leather Jacket");
  Engine.addCustomLoadout(ch, "armor");
  assert.equal(ch.armor[3].worn, false, "a blank custom piece went on");
});

test("the hit panel's stand-in armor is gone: armor that isn't worn doesn't answer (Decision 100)", () => {
  const ch = subject();
  const r = Engine.resolveHit(ch, { damage: 8, damageType: "ballistic", protRoll: 3, manual: { res: 5 } });
  assert.equal(r.armor, null);
  assert.equal(r.through, 8);
});

test("Integrity lost can't read past the maximum when an upgrade comes out", () => {
  const ch = subject();
  ch.armor.push({ id: "kevlar-vest", integrityLoss: 25, notes: "", worn: true, scrapped: false, upgrades: [] });
  const w = Engine.armorState(ch).worn;
  assert.deepEqual([w.integrity, w.integrityLoss], [0, 20]);
});

test("healing trims Withering to the damage left, and refuses when there's nothing to do", () => {
  const ch = subject({ bod: 10 });
  ch.trackers.damage = 10; ch.trackers.witheringDamage = 8;
  Engine.heal(ch, { kind: "natural", hp: 6 });
  assert.deepEqual([ch.trackers.damage, ch.trackers.witheringDamage], [4, 4]);
  assert.equal(Engine.heal(subject(), { kind: "natural", hp: 5 }).ok, false, "healed an unhurt character");
  assert.equal(Engine.heal(subject(), { kind: "rest", hp: 5 }).ok, false, "an unknown kind of healing");
});

test("applyReset re-resolves from its inputs, like applyHit", () => {
  const ch = subject({ bod: 10 });
  ch.trackers.conditions = [{ id: "bleeding" }];
  Engine.resolveReset(ch);                      // the panel's preview
  ch.trackers.damage = 5;                       // something else changed meanwhile
  Engine.applyReset(ch);
  assert.equal(ch.trackers.damage, 6);
  assert.equal(Engine.resolveReset(subject()).hasEffect, false, "nothing ticking, not Dying: nothing to record");
});

// ── Natural Armor (Decision 104, F25 stub) ────────────────────────────
// The engine's arrays come from the VM realm (Decision 80), so compare them
// as JSON rather than with deepEqual.
const same = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);

test("Natural Armor sums Thick Skin per rank and Shake it Off per time taken; nothing is stored", () => {
  const ch = subject();
  ch.advantages.push({ id: "thick-skin", rank: 2 });
  ch.progression.milestones.major.push({ id: "shake-it-off" }, { id: "shake-it-off" });
  const before = JSON.stringify(ch);
  const n = Engine.naturalArmor(ch);
  assert.equal(n.total, 12);
  same(n.always.map(s => [s.id, s.amount]), [["thick-skin", 2], ["shake-it-off", 10]]);
  assert.equal(JSON.stringify(ch), before, "naturalArmor wrote to the character");
  assert.equal(Engine.naturalArmor(subject()).total, 0);
});

test("Iron Shirt is conditional: BOD bonus + 1, listed but not counted until it's on", () => {
  const ch = subject({ bod: 8 });                       // BOD 8 → +2
  ch.identity.archetype = "professional";
  ch.archetypeChoices.specialization = ["true-warrior"];
  const off = Engine.naturalArmor(ch);
  assert.equal(off.total, 0);
  same(off.conditional.map(c => [c.id, c.amount, c.active]), [["iron-shirt", 3, false]]);
  assert.equal(Engine.naturalArmor(ch, ["iron-shirt"]).total, 3);
  ch.stats.BOD.base = 1;                                // −3 + 1 never goes negative
  assert.equal(Engine.naturalArmor(ch, ["iron-shirt"]).total, 0);
});

test("a hit: Natural Armor comes off after worn armor, anywhere, and AP doesn't get past it", () => {
  const ch = subject({ bod: 10 });
  ch.advantages.push({ id: "thick-skin", rank: 3 });
  const hit = o => Engine.resolveHit(ch, { damage: 10, damageType: "ballistic", ...o });
  let r = hit({});
  assert.deepEqual([r.natural.absorbed, r.through], [3, 7], "no armor worn: skin still answers");
  r = hit({ ap: true });
  assert.equal(r.through, 7, "AP skipped Natural Armor");
  r = hit({ damageType: "energy" });
  assert.deepEqual([r.natural.skipped, r.through], ["type", 10], "stub: Kinetic only");
  r = hit({ category: "massive" });
  assert.equal(r.natural.skipped, "massive");
  assert.ok(r.notes.some(n => /natural armor/i.test(n)), "the stub's playerNote isn't shown");

  ch.armor.push({ id: "kevlar-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: [] });
  r = hit({ protRoll: 4 });                             // PROT 4 + RES 2, then skin 3
  assert.deepEqual([r.absorbed, r.natural.absorbed, r.through], [6, 3, 1]);
  assert.equal(r.soaked, false, "skin finishing the job isn't the armor soaking it");
  r = hit({ protRoll: 1, location: "right-leg" });      // the vest doesn't cover a leg
  assert.deepEqual([r.covered, r.through], [false, 7]);
  Engine.applyHit(ch, { damage: 10, damageType: "ballistic", protRoll: 4 });
  assert.equal(ch.trackers.damage, 1, "applyHit didn't write the post-skin damage");
});

test("Resilient Spirit (Waning Moon) lets Natural Armor answer Magical damage while it's on", () => {
  const ch = subject();
  ch.identity.archetype = "werewolf";
  ch.archetypeChoices.specialization = ["trueborn"];
  ch.progression.milestones.major.push({ id: "shake-it-off" });
  const hit = natural => Engine.resolveHit(ch, { damage: 8, damageType: "magical", natural });
  assert.equal(hit([]).through, 8);
  assert.equal(hit(["resilient-spirit"]).through, 3);
});

// ── Nanomed Kit (Decision 105, CQ12: 054's list) ──────────────────────

test("a Nanomed Kit clears 054's four, stabilizes the Dying, and proposes BOD / dose", () => {
  const ch = subject({ bod: 7 });
  ch.trackers.damage = 20;
  ch.trackers.conditions = [{ id: "bleeding" }, { id: "injured", location: "left-arm" },
                            { id: "paralyzed" }, { id: "dying", marks: 2 }, { id: "agonized" }];
  assert.deepEqual([1, 2, 3].map(d => Engine.nanomedKit(ch, d).proposed), [7, 3, 2]);
  const r = Engine.heal(ch, { kind: "nanomed", dose: 1, hp: 7 });
  assert.ok(r.ok);
  same(ch.trackers.conditions.map(e => e.id), ["injured"], "Injured takes Focused Healing");
  assert.equal(ch.trackers.damage, 13);
  assert.ok(Engine.heal(subject(), { kind: "nanomed", hp: 0 }).ok === false, "a kit on nobody hurt did something");
});

// ── Cascade and Aberrations (Decision 106) ────────────────────────────

test("the Cascade and Aberration tables have no gaps or overlaps, and every category has entries", () => {
  // Contiguous from the first row to an open-ended last one, so every total
  // a Cascade can produce lands on exactly one row.
  const rows = D.cascadeTable.rows;
  rows.forEach((r, i) => {
    if (i) assert.equal(r.min, rows[i - 1].max + 1, `cascade row ${r.id} doesn't follow ${rows[i - 1].id}`);
    if (i < rows.length - 1) assert.ok(r.max >= r.min, `cascade row ${r.id} has no range`);
  });
  assert.equal(rows[rows.length - 1].max, null, "the last Cascade row should be open-ended (12+)");
  const ab = D.aberrationTable.rows;
  assert.equal(ab[0].min, 1); assert.equal(ab[ab.length - 1].max, 10);
  ab.forEach((r, i) => { if (i) assert.equal(r.min, ab[i - 1].max + 1, "the Aberration table has a gap"); });
  const cats = new Set(D.aberrationCategories.map(c => c.id));
  for (const r of ab) for (const k of ["temporary", "permanent"]) {
    assert.ok(cats.has(r[k]), `${k} ${r.min}-${r.max} → "${r[k]}" isn't a category`);
    assert.ok(D.aberrations.some(a => a.category === r[k]), `nothing to pick in "${r[k]}"`);
  }
  // "treat a Good result as Neutral" (Magic.md) — the permanent column never says good.
  assert.ok(!ab.some(r => r.permanent === "good"), "a permanent Aberration can come out Good");
  const perm = rows.filter(r => r.aberration).map(r => r.aberration).sort();
  same(perm, ["permanent", "temporary"]);
  const seen = new Set();
  for (const a of D.aberrations) {
    assert.ok(!seen.has(a.id), `duplicate aberration id ${a.id}`); seen.add(a.id);
    assert.ok(cats.has(a.category), `${a.id}: category ${a.category}`);
    assert.ok(a.name && a.description, `${a.id} has no text`);
  }
});

test("cascade is total on every degenerate character and every bad input", () => {
  const failures = [];
  const inputs = [undefined, null, {}, { roll: "x" }, { roll: 0, degree: 3 }, { roll: 11, degree: 3 }, { roll: 5 },
    { roll: 1, degree: 1 }, { roll: 3, degree: -2 }, { roll: 6, degree: 3, aberrationRoll: "x" },
    { roll: 6, degree: 3, aberrationRoll: 99 }, { roll: 6, degree: 3, aberrationRoll: 2, pick: "no-such" },
    { roll: 10, degree: 40 }, { roll: 6, degree: 3, aberrationRoll: 2, pick: "heterochromia" }];
  for (const [label, ch] of Object.entries(degenerates())){
    for (const input of inputs){
      try { Engine.cascade(ch, input); }
      catch (e) { failures.push(`${label} ${JSON.stringify(input)} -> ${e.message}`); }
    }
  }
  assert.deepEqual(failures, []);
});

test("cascade ignores a pick from outside the rolled category rather than trusting it", () => {
  const ch = subject();
  const perm = { roll: 6, degree: 3, aberrationRoll: 2 };                     // 9: Permanent; 2: Neutral
  assert.equal(Engine.cascade(ch, Object.assign({ pick: "dense-frame" }, perm)).aberration.pick.id, "dense-frame");
  assert.equal(Engine.cascade(ch, Object.assign({ pick: "aether-reservoir" }, perm)).aberration.pick, null);
});

test("the Arcanist's TOL Spent tracker declares the Cascade panel and the Exhausted note in data", () => {
  const panel = D.archetypes.find(a => a.id === "arcanist").coreMechanic.panels.find(p => p.id === "tol-spent");
  assert.equal(panel.max, "TOL");
  assert.equal(panel.overMax, "cascade");
  assert.ok(panel.atMax, "no Exhausted note at max");
});

// ── Grimoire from the book (Decision 108) ─────────────────────────────

test("migrate to 0.9 tags typed Grimoire rows as your own, never links them, and seeds acquired Aberrations", () => {
  const old = subject();
  old.meta.schemaVersion = "0.8";
  old.panelData.grimoire = [
    { "Spell Name": "Zap", "TN": "7", "TH": "1", "Notes": "go-to" },      // a book name, typed
    null, "junk",
    { spellId: "kindle" },                                               // a hand-edited book row
    { spellId: "dart", stage: "weird", custom: true },
  ];
  delete old.trackers.aberrations;
  Engine.migrate(old);
  const rows = old.panelData.grimoire;
  assert.equal(rows.length, 3, "junk rows weren't dropped");
  assert.equal(rows[0].custom, true);
  assert.equal(rows[0].spellId, undefined, "migrate linked a typed name to the book on its own");
  assert.equal(rows[0]["Spell Name"], "Zap", "migrate lost what the player typed");
  same([rows[1].spellId, rows[1].stage, rows[1].notes], ["kindle", "known", ""]);
  same([rows[2].stage, rows[2].custom], ["known", undefined]);
  assert.ok(Array.isArray(old.trackers.aberrations));
  const again = Engine.migrate(JSON.parse(JSON.stringify(old)));
  same(again.panelData.grimoire, rows, "a second migrate changed the rows");
});

test("grimoire() reads the book: numbers, a missing spell, and a typed name that could link", () => {
  const ch = subject();
  ch.panelData.grimoire = [
    { spellId: "firebolt", stage: "known", notes: "" },
    { spellId: "no-such-spell", stage: "known", notes: "old" },
    { custom: true, "Spell Name": "  ZAP! ", "Notes": "mine" },
    { custom: true, "Spell Name": "Firebolt" },                          // already held: no link
  ];
  const g = Engine.grimoire(ch), book = D.spells.find(s => s.id === "firebolt");
  same([g.lines[0].tn, g.lines[0].th, g.lines[0].effect], [book.tn, book.th, book.effect]);
  assert.equal(g.lines[1].missing, true);
  same(g.lines[2].match, { id: "zap", name: "Zap" });
  assert.equal(g.lines[3].match, null, "offered to link a spell that's already in the Grimoire");
});

test("grimoire() is a reader: it doesn't create the row list", () => {
  const ch = subject();
  delete ch.panelData.grimoire;
  Engine.grimoire(ch);
  assert.equal(ch.panelData.grimoire, undefined);
});

test("addSpell refuses a duplicate, an unknown id, and an archetype with no Grimoire; linkSpell keeps the notes", () => {
  const ch = subject();
  assert.ok(Engine.addSpell(ch, "zap").ok);
  assert.equal(Engine.addSpell(ch, "zap").ok, false);
  assert.equal(Engine.addSpell(ch, "no-such-spell").ok, false);
  const pro = subject(); pro.identity.archetype = "professional";
  assert.equal(Engine.addSpell(pro, "zap").ok, false);
  ch.panelData.grimoire.push({ custom: true, "Spell Name": "kindle", "Notes": "lights the stove" });
  assert.ok(Engine.linkSpell(ch, 1).ok);
  same(ch.panelData.grimoire[1], { spellId: "kindle", stage: "known", notes: "lights the stove" });
  assert.equal(Engine.linkSpell(ch, 0).ok, false, "linked a row that's already a book spell");
});

test("Mastering a book spell spends 30 IP × its TH through the IP journal, and only once", () => {
  const ch = subject();
  Engine.addSpell(ch, "firebolt");                                     // Standard, TH 2
  const th = D.spells.find(s => s.id === "firebolt").th;
  const c = Engine.ipCost(ch, "spell", "firebolt");
  same([c.ok, c.cost], [true, 30 * th]);
  assert.equal(Engine.spendIP(ch, "spell", "firebolt").ok, false, "Mastered with no IP");
  Engine.grantIP(ch, 100, "test");
  assert.ok(Engine.spendIP(ch, "spell", "firebolt").ok);
  assert.equal(ch.panelData.grimoire[0].stage, "mastered");
  const e = ch.progression.ip.log[ch.progression.ip.log.length - 1];
  same([e.targetType, e.targetId, e.amount], ["spell", "firebolt", 30 * th]);
  assert.equal(Engine.ipCost(ch, "spell", "firebolt").ok, false, "a Mastered spell offered Mastery again");
  assert.equal(Engine.ipCost(ch, "spell", "zap").ok, false, "a spell not in the Grimoire had a price");
});

test("the Grimoire functions are total on every degenerate character", () => {
  const failures = [];
  for (const [label, ch] of Object.entries(degenerates())){
    const calls = {
      grimoire: () => Engine.grimoire(ch),
      spellPower: () => Engine.spellPower(ch),
      addSpell: () => { Engine.addSpell(ch, "zap"); Engine.addSpell(ch, null); },
      linkSpell: () => [-1, 0, 1, 99, "x"].forEach(i => Engine.linkSpell(ch, i)),
      removeGrimoireRow: () => [-1, 99, "x"].forEach(i => Engine.removeGrimoireRow(ch, i)),
      ipCost: () => { Engine.ipCost(ch, "spell", "zap"); Engine.ipCost(ch, "spell", undefined); },
    };
    if (ch.panelData && typeof ch.panelData === "object") ch.panelData.grimoire = [null, 4, { spellId: 7 }, { custom: true }];
    for (const [fn, call] of Object.entries(calls)){
      try { call(); } catch (e) { failures.push(`${fn}(${label}) -> ${e.message}`); }
    }
  }
  assert.deepEqual(failures, []);
});

// ── Starting spells (Decision 111) ────────────────────────────────────

/** An Arcanist in the wizard at Street, where Evocation starts at 1. */
function creating(setup) {
  const ch = subject();
  ch.creation.locked = false;
  ch.creation.powerLevel = "street";
  if (setup) setup(ch);
  return ch;
}
const byTH = th => D.spells.find(s => s.th === th).id;
const spellIssues = ch => Engine.validate("character-points", ch).filter(i => /starting spell|needs Evocation/.test(i.msg))
  .map(i => [i.level, i.msg]);

test("the starting count is TOL + the entered roll, and unknown until it's entered", () => {
  const ch = creating();
  assert.equal(Engine.startingSpells(ch).count, null);
  ch.archetypeChoices.rolls.startingSpells = 3;
  const st = Engine.startingSpells(ch);
  same([st.rollDie, st.base, st.count], ["1d4", Engine.derived(ch).TOL, Engine.derived(ch).TOL + 3]);
  ch.stats.BOD.base = 10;                                             // a boost on this step moves TOL, so the count
  assert.equal(Engine.startingSpells(ch).count, Engine.derived(ch).TOL + 3);
  const pro = creating(c => { c.identity.archetype = "professional"; });
  assert.equal(Engine.startingSpells(pro), null, "an archetype with no Grimoire was asked for spells");
});

test("at creation a spell's TH can't pass Evocation rank, and a rank bought at creation opens the next tier", () => {
  const ch = creating(c => { c.archetypeChoices.rolls.startingSpells = 4; });
  const refused = Engine.addStartingSpell(ch, byTH(2));
  same([refused.ok, refused.needs], [false, 2]);
  assert.match(refused.why, /needs Evocation 2/);
  assert.equal((ch.panelData.grimoire || []).length, 0, "a refused pick was written");
  assert.ok(Engine.addStartingSpell(ch, byTH(1)).ok);
  assert.equal(Engine.addStartingSpell(ch, byTH(1)).ok, false, "the same spell was chosen twice");
  ch.archetypeChoices.disciplines.evocation = 1;                      // Evocation 2
  assert.ok(Engine.addStartingSpell(ch, byTH(2)).ok, "buying Evocation didn't open TH 2");
  assert.equal(Engine.canAddStartingSpell(ch, byTH(3)).ok, false);
  same(ch.panelData.grimoire.map(r => r.stage), ["known", "known"]);
});

test("the picks stop at the count", () => {
  const ch = creating(c => { c.archetypeChoices.rolls.startingSpells = 0; c.stats.BOD.base = 1; c.stats.INT.base = 1; c.stats.COOL.base = 1; });
  const count = Engine.startingSpells(ch).count;
  const cantrips = D.spells.filter(s => s.th === 1).map(s => s.id);
  for (let i = 0; i < count; i++) assert.ok(Engine.addStartingSpell(ch, cantrips[i]).ok);
  const full = Engine.canAddStartingSpell(ch, cantrips[count]);
  same([full.ok, full.full], [false, true]);
});

test("validate: short of the count and no roll warn; a spell over the rank and too many picks block", () => {
  const ch = creating();
  same(spellIssues(ch), [["warn", "Enter your 1d4 starting spells roll."]]);
  ch.archetypeChoices.rolls.startingSpells = 2;
  const count = Engine.startingSpells(ch).count;
  Engine.addStartingSpell(ch, "zap");
  same(spellIssues(ch), [["warn", `${count - 1} starting spell${count - 1 > 1 ? "s" : ""} left to choose (1/${count}).`]]);

  ch.archetypeChoices.disciplines.evocation = 1;
  Engine.addStartingSpell(ch, byTH(2));
  delete ch.archetypeChoices.disciplines.evocation;                   // un-bought: the pick stays, and says so
  const name = D.spells.find(s => s.id === byTH(2)).name;
  assert.ok(spellIssues(ch).some(([l, m]) => l === "error" && m === `${name} needs Evocation 2. Buy the rank or choose another spell.`));
  assert.equal(ch.panelData.grimoire.length, 2, "validate dropped a pick");

  ch.archetypeChoices.rolls.startingSpells = 0;
  ch.panelData.grimoire = D.spells.filter(s => s.th === 1).slice(0, Engine.startingSpells(ch).count + 1)
    .map(s => ({ spellId: s.id, stage: "known", notes: "" }));
  assert.ok(spellIssues(ch).some(([l, m]) => l === "error" && /^Too many starting spells/.test(m)));
});

test("after lock nothing gates a spell's TH, and one beyond the Evocation pool is marked, Mastery included", () => {
  const ch = subject();                                               // locked, Evocation 1
  assert.ok(Engine.addSpell(ch, byTH(3)).ok, "the creation gate reached the sheet");
  Engine.addSpell(ch, byTH(1));
  const g = Engine.grimoire(ch);
  same([g.pool.rank, g.lines[0].beyondPool, g.lines[1].beyondPool], [1, true, false]);
  ch.panelData.grimoire[0] = { spellId: byTH(2), stage: "mastered", notes: "" };   // TH 2 - 1 = 1, inside Evocation 1
  assert.equal(Engine.grimoire(ch).lines[0].beyondPool, false, "Mastery's TH - 1 wasn't counted");
});

test("the starting-spell functions are total on every degenerate character", () => {
  const failures = [];
  // The shared set has no Arcanist with a power level, which is the only one
  // that gets past startingSpells' first line, so two are added here.
  const cases = Object.assign(degenerates(), {
    "arcanist, junk choices": Engine.migrate({ identity:{archetype:"arcanist"}, creation:{powerLevel:"street"},
                                 archetypeChoices:{ rolls:null, disciplines:"x" }, panelData:{ grimoire:"x" } }),
    "arcanist, junk stats":   Engine.migrate({ identity:{archetype:"arcanist"}, creation:{powerLevel:"wcd"},
                                 stats:{ INT:"x", BOD:null }, archetypeChoices:{ rolls:{ startingSpells:-3 } } }),
  });
  for (const [label, ch] of Object.entries(cases)){
    if (ch.panelData && typeof ch.panelData === "object") ch.panelData.grimoire = [null, 4, { spellId: 7 }, { spellId: "no-such-spell" }];
    if (ch.archetypeChoices && ch.archetypeChoices.rolls) ch.archetypeChoices.rolls.startingSpells = "lots";
    const calls = {
      startingSpells: () => Engine.startingSpells(ch),
      castingPool: () => Engine.castingPool(ch),
      canAddStartingSpell: () => [null, "zap", "no-such-spell", 7].forEach(id => Engine.canAddStartingSpell(ch, id)),
      addStartingSpell: () => Engine.addStartingSpell(ch, "zap"),
      validate: () => Engine.validate("character-points", ch),
    };
    for (const [fn, call] of Object.entries(calls)){
      try { call(); } catch (e) { failures.push(`${fn}(${label}) -> ${e.message}`); }
    }
  }
  assert.deepEqual(failures, []);
});

// ── Aberrations on the character (Decision 110) ──────────────────────

test("an Aberration is held once, recorded and cleared by index, and an unknown id is refused", () => {
  const ch = subject();
  assert.equal(Engine.recordAberration(ch, { id: "no-such" }).ok, false);
  assert.equal(Engine.recordAberration(ch, { id: "night-eyes", permanence: "temporary" }).ok, true);
  const again = Engine.recordAberration(ch, { id: "night-eyes", permanence: "permanent" });
  assert.equal(again.ok, false, "the same Aberration was held twice");
  assert.match(again.why, /doesn't stack/);
  assert.equal(ch.trackers.aberrations.length, 1);
  assert.equal(ch.trackers.aberrations[0].permanence, "temporary", "a refused duplicate changed the one held");
  Engine.recordAberration(ch, { id: "heterochromia", permanence: "permanent", note: "left eye" });
  const st = Engine.aberrationState(ch);
  assert.deepEqual([...st.permanent.map(a => a.name)], ["Heterochromia"]);
  assert.deepEqual([...st.temporary.map(a => a.name)], ["Night Eyes"]);
  assert.equal(st.permanent[0].note, "left eye");
  assert.equal(st.permanent[0].category, "Neutral");
  assert.equal(Engine.removeAberration(ch, 5).ok, false);
  assert.equal(Engine.removeAberration(ch, 0).ok, true);
  assert.deepEqual([...ch.trackers.aberrations.map(e => e.id)], ["heterochromia"]);
});

test("the character stores only { id, permanence, note } — what an Aberration does is read from the catalog", () => {
  const ch = subject();
  Engine.recordAberration(ch, { id: "drained", permanence: "permanent" });
  assert.deepEqual(Object.keys(ch.trackers.aberrations[0]).sort(), ["id", "permanence"]);
  assert.equal(ch.trackers.adjustments.length, 0, "Drained was written as an adjustment instead of read from the catalog");
});

test("a missing Aberration id renders and is reported, and adds nothing", () => {
  const ch = subject();
  ch.trackers.aberrations = [{ id: "retired-aberration", permanence: "permanent" }];
  const st = Engine.aberrationState(ch);
  assert.equal(st.active[0].missing, true);
  assert.equal(st.active[0].name, "retired-aberration");
  assert.equal(st.painLevels, 0);
  assert.ok(Engine.versionCheck(ch).some(i => /Aberration "retired-aberration"/.test(i)));
});

test("Drained never lifts a TOL something else already took below 0", () => {
  const ch = subject();
  ch.trackers.adjustments = [{ target: "TOL", amount: -50, note: "fixture" }];
  const low = Engine.derived(ch).TOL;
  assert.ok(low < 0);
  Engine.recordAberration(ch, { id: "drained", permanence: "temporary" });
  assert.equal(Engine.derived(ch).TOL, low);
});

test("an Aberration from a Cascade keeps its note, and one undo takes it back with its TOL change", () => {
  const ch = subject();
  const tolBefore = Engine.derived(ch).TOL;
  const before = JSON.parse(JSON.stringify(ch));
  const r = Engine.recordAberration(ch, { id: "drained", permanence: "permanent", note: "Cascade, 2026-09-24" });
  assert.equal(r.ok, true, r.why);
  assert.equal(JSON.stringify(ch.trackers.aberrations), JSON.stringify([{ id: "drained", permanence: "permanent", note: "Cascade, 2026-09-24" }]));
  assert.equal(Engine.derived(ch).TOL, Math.max(0, tolBefore - 2));
  assert.equal(Engine.recordAberration(ch, { id: "drained", permanence: "temporary" }).ok, false, "an Aberration stacked with itself");
  Engine.recordAction(ch, "aberration", "Cascade: Drained (permanent)", before);
  assert.ok(Engine.undoLastAction(ch).ok);
  assert.equal(ch.trackers.aberrations.length, 0, "undo left the Aberration behind");
  assert.equal(Engine.derived(ch).TOL, tolBefore);
});

test("the Arcanist declares a reference panel naming data sections that exist", () => {
  const panel = D.archetypes.find(a => a.id === "arcanist").coreMechanic.panels.find(p => p.type === "reference");
  assert.ok(panel, "no reference panel");
  assert.ok(panel.shows.length > 0);
  for (const k of panel.shows) assert.ok(D[k], `${k} isn't in the game data`);
});


// ── Weapon mods and rounds (W16, Decision 120) ────────────────────────

function armed(id, extra = {}) {
  const ch = subject();
  Engine.addLoadout(ch, "weapons", id);
  Object.assign(ch.weapons[0], extra);
  return ch;
}

test("W16: a capacity reads as its rounds, chambered one included; one that doesn't read isn't tracked", () => {
  const rounds = id => { const l = Engine.weaponLine(armed(id), 0); return l.rounds && l.rounds.max; };
  assert.equal(rounds("ads-lp9-viper"), 16);          // "15+1"
  assert.equal(rounds("vlw6-titan"), 100);            // "100 (belt)"
  assert.equal(rounds("hft3-hellmouth"), 10);         // "10 bursts"
  assert.equal(rounds("the-preacher"), 2);            // "2"
  assert.equal(rounds("combat-knife"), null);         // no capacity
  const modes = Engine.weaponLine(armed("ts7-bulldog"), 0).fireModes.map(f => `${f.id}${f.rounds}`);
  assert.deepEqual([...modes], ["S1", "B3", "F10"], "053: Single 1, Burst 3, Full Auto 10");
});

test("W16: firing spends the mode's rounds, refuses what the magazine can't pay or the weapon can't do, and Reload fills it", () => {
  const ch = armed("ads-lp9-viper");                   // 15+1, S/B
  assert.equal(Engine.fireWeapon(ch, 0, "B").left, 13);
  assert.equal(Engine.fireWeapon(ch, 0, "S").left, 12);
  assert.equal(ch.weapons[0].roundsSpent, 4, "the stored input is rounds spent");
  assert.equal(Engine.fireWeapon(ch, 0, "F").ok, false, "fired Full Auto from a weapon without it");
  ch.weapons[0].roundsSpent = 14;
  const r = Engine.fireWeapon(ch, 0, "B");
  assert.equal(r.ok, false);
  assert.match(r.why, /Burst spends 3 rounds, and 2 are left\. Reload\./);
  assert.equal(Engine.reloadWeapon(ch, 0).ok, true);
  assert.equal(ch.weapons[0].roundsSpent, 0);
  assert.equal(Engine.reloadWeapon(ch, 0).ok, false, "reloaded a full magazine");
  assert.equal(Engine.fireWeapon(armed("combat-knife"), 0, "S").ok, false, "a knife fired a round");
  // A custom weapon's typed capacity is tracked the same way.
  const c = subject(); Engine.addCustomLoadout(c, "weapons"); Object.assign(c.weapons[0], { name: "Zip gun", capacity: "4", rof: "S" });
  assert.equal(Engine.fireWeapon(c, 0, "S").left, 3);
});

test("W16: mods fill the weapon's fixed slots, fit only what Gear says they fit, and change the line", () => {
  const ch = armed("ads-lp9-viper");                   // 2 slots, handgun
  const opt = id => Engine.weaponModOptions(ch, 0).options.find(o => o.id === id);
  assert.match(opt("Scope").why, /Doesn't fit/, "a Scope went on a handgun");
  assert.equal(Engine.addWeaponMod(ch, 0, "Laser Sight").ok, true);
  assert.equal(Engine.addWeaponMod(ch, 0, "Laser Sight").ok, false, "the same mod twice");
  assert.equal(Engine.addWeaponMod(ch, 0, "Holo Sight").ok, true);
  let l = Engine.weaponLine(ch, 0);
  assert.deepEqual([l.modSlots.used, l.modSlots.free], [2, 0]);
  assert.equal(l.acc, 2, "a sight changed Single's ACC");
  assert.deepEqual([l.aimed[0].acc, [...l.aimed[0].by]], [2, ["Laser Sight", "Holo Sight"]], "Laser and Holo stack on aimed shots");
  assert.match(opt("Flashlight").why, /No slot free/);

  const angel = armed("ads-lp9-viper");
  assert.equal(Engine.addWeaponMod(angel, 0, "Angel Mod").ok, true);
  l = Engine.weaponLine(angel, 0);
  assert.equal(l.damage, 6 + 4, "the Angel Mod's +4 DMG");
  for (const t of ["AP", "Burning", "Agonized"]) assert.ok(l.tags.includes(t), `no ${t} from the Angel Mod`);

  const shotgun = armed("sg88-siege-breaker");
  assert.match(Engine.weaponModOptions(shotgun, 0).options.find(o => o.id === "Silencer").why, /Doesn't go on Shotguns/);
  const rifle = armed("ar9x-guardian");                // 1 slot
  assert.equal(Engine.addWeaponMod(rifle, 0, "Scope").ok, true);
  const far = Engine.weaponLine(rifle, 0).aimed[0];
  assert.deepEqual([far.acc, far.when], [2, "at Long or Extreme range"]);
  const strix = armed("ads-tc1-strix");
  assert.equal(Engine.weaponModOptions(strix, 0).options.find(o => o.id === "Scope").ok, true, "the Strix takes a Scope by name");
  assert.equal(Engine.weaponModOptions(armed("cheapshot"), 0).options.every(o => !o.ok), true, "a no-slot weapon took a mod");
  assert.equal(Engine.removeWeaponMod(rifle, 0, 0).id, "Scope");
  assert.equal(Engine.weaponModOptions(subject(), 0), null);
});

test("W16: migrate to 0.10 gives a catalog weapon no mods and a full magazine, keeps what's there, and drops junk", () => {
  const old = subject();
  old.meta.schemaVersion = "0.9";
  old.weapons = [{ id: "ads-lp9-viper", notes: "grip tape" }, { custom: true, name: "Zip gun", capacity: "4", mods: ["Scope"] },
                 { id: "ts7-bulldog", notes: "", mods: ["Laser Sight", 7], roundsSpent: "5" }];
  const m = Engine.migrate(old);
  assert.equal(m.meta.schemaVersion, "0.10");
  assert.deepEqual([[...m.weapons[0].mods], m.weapons[0].roundsSpent, m.weapons[0].notes], [[], 0, "grip tape"]);
  assert.equal(m.weapons[1].mods, undefined, "a custom weapon kept a mods list");
  assert.deepEqual([[...m.weapons[2].mods], m.weapons[2].roundsSpent], [["Laser Sight"], 5]);
  const again = Engine.migrate(JSON.parse(JSON.stringify(m)));
  assert.deepEqual(JSON.parse(JSON.stringify(again.weapons)), JSON.parse(JSON.stringify(m.weapons)), "a second migrate changed the weapons");
});

// ── Equipment (W17 + W27, Decision 121) ───────────────────────────────

test("W17/W27: the equipment catalog is the two chapters' tables, every id unique, every category listed, every spell link real", () => {
  const cats = new Set(D.equipmentCategories.map(c => c.id));
  assert.equal(new Set(D.equipment.map(e => e.id)).size, D.equipment.length, "a duplicate equipment id");
  for (const e of D.equipment) {
    assert.ok(cats.has(e.category), `${e.id}: category "${e.category}" isn't listed`);
    assert.ok(e.cost === null || (typeof e.cost === "number" && e.cost > 0), `${e.id}: cost is neither a price nor null`);
    if (e.cost === null) assert.ok(e.costText, `${e.id}: no price and no costText saying why`);
    if (e.spell) assert.ok(Engine.spellById(e.spell), `${e.id}: spell "${e.spell}" isn't in the book`);
  }
  const at = id => D.equipment.find(e => e.id === id);
  assert.deepEqual([at("nanomed-kit").cost, at("quickstitch").pack, at("field-repair-kit").pack], [4500, 5, 5]);
  assert.deepEqual([at("shield-charm").charges, at("bulwark-rune").charges, at("second-wind-charm").startsEmpty], [3, 5, true]);
  assert.equal(at("shield-charm").spell, "shield");
});

test("W17: a consumable stacks by its pack, Use one takes one off and the last one takes the row, and Buy pays", () => {
  const ch = subject();
  ch.trackers.credits.current = 5000;
  const r = Engine.addLoadout(ch, "gear", "quickstitch", { buy: true });
  assert.deepEqual([r.ok, r.added, ch.gear[0].qty, ch.trackers.credits.current], [true, 5, 5, 3500], "a strip of 5 for 1,500Ç");
  Engine.addLoadout(ch, "gear", "quickstitch");
  assert.deepEqual([ch.gear.length, ch.gear[0].qty], [1, 10], "a second strip didn't stack");
  assert.equal(Engine.useGear(ch, 0, 1).left, 9);
  assert.equal(Engine.useGear(ch, 0, 20).ok, false);
  Engine.useGear(ch, 0, 9);
  assert.equal(ch.gear.length, 0, "the empty row stayed");
  Engine.addLoadout(ch, "gear", "multitool");
  assert.equal(Engine.useGear(ch, 0, 1).ok, false, "used up a Multitool");
  assert.equal(Engine.useGear(ch, 0, -1).left, 2, "+1 on a tool");
  assert.equal(Engine.addLoadout(ch, "gear", "smart-brace", { buy: true }).ok, false, "bought something priced 'Varies'");
  assert.equal(Engine.carriedGear(ch, "nanomed-kit"), null);
  Engine.addLoadout(ch, "gear", "nanomed-kit");
  assert.deepEqual({ ...Engine.carriedGear(ch, "nanomed-kit") }, { index: 1, qty: 1 });
});

test("W27: a charged Talisman is its own row, spends and recharges its charges, and names the spell it holds", () => {
  const ch = subject();
  Engine.addLoadout(ch, "gear", "shield-charm");
  Engine.addLoadout(ch, "gear", "shield-charm");
  assert.equal(ch.gear.length, 2, "two charms stacked into one row");
  const l = Engine.gearLine(ch, 0);
  assert.deepEqual([l.charges.left, l.charges.max, l.spell.name], [3, 3, "Shield"]);
  Engine.useCharge(ch, 0); Engine.useCharge(ch, 0); Engine.useCharge(ch, 0);
  assert.match(Engine.useCharge(ch, 0).why, /spent\. Recharge/);
  assert.equal(Engine.rechargeGear(ch, 0).restored, 3);
  Engine.addLoadout(ch, "gear", "second-wind-charm");
  assert.equal(Engine.gearLine(ch, 2).charges.left, 0, "Second Wind is sold empty");
  assert.equal(Engine.gearLine(ch, 2).spellName, "Second Wind", "a spell the book lacks keeps its name");
});

test("W17: migrate to 0.10 tags every typed gear row custom and never guesses a catalog match", () => {
  const old = subject();
  old.meta.schemaVersion = "0.9";
  old.gear = [{ name: "Nanomed Kit", type: "med", notes: "x2" }, null, { id: "quickstitch", qty: "3" }, { id: "shield-charm", chargesUsed: -2 }];
  const m = Engine.migrate(old);
  assert.equal(m.gear.length, 3, "junk wasn't dropped");
  assert.deepEqual([m.gear[0].custom, m.gear[0].id], [true, undefined], "a typed row was matched to the catalog");
  assert.deepEqual([m.gear[1].qty, m.gear[2].qty, m.gear[2].chargesUsed], [3, 1, 0]);
  assert.equal(Engine.gearLine(m, 0).custom, true);
  const junk = Engine.migrate({ gear: {}, weapons: "x" });                  // a hand-edited file
  assert.deepEqual([junk.gear.length, junk.weapons.length], [0, 0]);
});
