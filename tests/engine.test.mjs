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
  assert.equal(ch.meta.schemaVersion, "0.5");
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
  assert.equal(old.meta.schemaVersion, "0.5");
  assert.ok(Array.isArray(old.audit), "audit was not seeded");
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
  assert.equal(bare.meta.schemaVersion, "0.5");
  assert.ok(Engine.versionCheck(bare).some(i => /game data/.test(i)));
});

test("no exported reader throws on any character migrate() can return", () => {
  // Readers take (ch) alone; anything needing more arguments is exercised by
  // its own test. Named here so adding an export is a deliberate choice.
  const readers = ["powerLevel","archetype","statTable","scalingRow","derived","health","sfr",
                   "statPool","statSpent","skillPool","skillSpent","advSpent","disGranted",
                   "luckSpent","boostSpent","disciplineSpent","cp","painState","luckState",
                   "sanState","focusedSkillIds","ipState","milestoneState","archPanels",
                   "specializationNeed","specializationIds","specializationChosen","specializationLabel",
                   "disciplineRanks","buildExport","versionCheck"];
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
    assert.equal(c.meta.schemaVersion, "0.5");
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
