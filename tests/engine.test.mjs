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
  assert.equal(ch.meta.schemaVersion, "0.4");
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
  assert.equal(old.meta.schemaVersion, "0.4");
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
  assert.equal(bare.meta.schemaVersion, "0.4");
  assert.ok(Engine.versionCheck(bare).some(i => /game data/.test(i)));
});

test("no exported reader throws on any character migrate() can return", () => {
  // Readers take (ch) alone; anything needing more arguments is exercised by
  // its own test. Named here so adding an export is a deliberate choice.
  const readers = ["powerLevel","archetype","statTable","scalingRow","derived","health","sfr",
                   "statPool","statSpent","skillPool","skillSpent","advSpent","disGranted",
                   "luckSpent","boostSpent","disciplineSpent","cp","painState","luckState",
                   "sanState","focusedSkillIds","ipState","milestoneState","archPanels",
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
