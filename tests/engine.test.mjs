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
  assert.equal(ch.meta.schemaVersion, "0.19");
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

// Decision 152: a classification says which Advantages are open. Mortal buys
// all; Supernatural only those carrying 0430's Universal tag.
test("every archetype names a classification the data defines, or the player picks one", () => {
  const ids = D.classifications.map(c => c.id);
  // Decision 153: a write-in archetype names none; the character's pick is its classification.
  for (const a of D.archetypes)
    if (a.writeIn) assert.equal("classification" in a, false, `${a.id} is written in and names a classification too`);
    else assert.ok(ids.includes(a.classification), `${a.id} names classification "${a.classification}"`);
  for (const c of D.classifications)
    assert.ok(["all", "universal"].includes(c.advantages), `${c.id}: advantages "${c.advantages}"`);
  assert.equal(D.archetypes.some(a => "canPurchaseAdvantages" in a), false,
    "canPurchaseAdvantages is back beside classification");
});

test("a Supernatural buys Universal Advantages only; a Mortal buys any", () => {
  const ch = Engine.newCharacter();
  ch.identity.archetype = "werewolf";
  assert.equal(Engine.classification(ch).id, "supernatural");
  assert.equal(Engine.canBuyAdvantage(ch, "lucky"), true, "a Universal Advantage");
  assert.equal(Engine.canBuyAdvantage(ch, "ambidextrous"), false, "a Mortal-only Advantage");
  assert.equal(Engine.canBuyAdvantage(ch, Engine.advById("lucky")), true, "by definition, not only id");
  ch.identity.archetype = "vampire";
  assert.equal(Engine.canBuyAdvantage(ch, "ambidextrous"), false, "the Vampire too");
  ch.identity.archetype = "arcanist";
  assert.equal(Engine.canBuyAdvantage(ch, "ambidextrous"), true, "a Mortal");
  ch.identity.archetype = null;
  assert.equal(Engine.canBuyAdvantage(ch, "ambidextrous"), true, "no archetype gates nothing");
  ch.identity.archetype = "no-such-archetype";
  assert.equal(Engine.classification(ch), null);
  assert.equal(Engine.canBuyAdvantage(ch, "no-such-advantage"), true, "total on junk");
});

test("validate refuses a Supernatural's Mortal-only Advantage, not its Universal one", () => {
  const ch = Engine.newCharacter();
  ch.identity.archetype = "werewolf";
  ch.creation.powerLevel = D.powerLevels[0].id;
  const errs = () => Engine.validate("character-points", ch).filter(i => i.level === "error").map(i => i.msg).join(" | ");
  ch.advantages = [{ id: "lucky", rank: 1, notes: "" }];
  assert.doesNotMatch(errs(), /can't buy/, "a Universal Advantage was refused");
  ch.advantages.push({ id: "ambidextrous", rank: 1, notes: "" });
  assert.match(errs(), /Supernaturals can't buy Ambidextrous/);
  ch.identity.archetype = "professional";
  assert.doesNotMatch(errs(), /can't buy/, "a Mortal was refused");
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
  assert.equal(old.meta.schemaVersion, "0.19");
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
  assert.equal(old.meta.schemaVersion, "0.19");
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

test("every id the game data points at exists (R6, the 2026-09-24 audit)", () => {
  // One sweep over every field that names another entry, rather than one test
  // per catalog added batch by batch. Its first run found Hardcore Parkour
  // asking for an Advantage no catalog had (B15, now F27).
  const set = k => new Set((D[k] || []).map(x => x && x.id));
  const S = {
    skill: set("skills"), advantage: set("advantages"), disadvantage: set("disadvantages"), stat: set("stats"),
    condition: set("conditions"), weapon: set("weapons"), weaponCategory: set("weaponCategories"),
    armorFeature: new Set([...set("armorFeatureGlossary"), ...set("armorUpgradeGlossary")]),
    equipmentCategory: set("equipmentCategories"), spell: set("spells"), domain: set("domains"), tier: set("spellTiers"),
    aberrationCategory: set("aberrationCategories"), major: new Set((D.milestones.majorGeneral || []).map(m => m.id)),
    luckSpend: new Set((D.resources.luck.spend || []).map(s => s.id)),
    skillCategory: new Set(D.skills.map(s => s.category)),
  };
  const refs = [];
  const ref = (kind, id, where) => { if (id != null) refs.push([kind, id, where]); };
  const prereqs = (p, where) => {
    if (!p) return;
    for (const sid of Object.keys(p.stats || {})) ref("stat", sid, where);
    for (const [id] of [...((p.skills || {}).any || []), ...((p.skills || {}).all || [])]) ref("skill", id, where);
    for (const [id] of ((p.advantages || {}).all || [])) ref("advantage", id, where);
    for (const id of p.milestones || []) ref("major", id, where);
  };
  for (const [kind, list] of [["advantage", D.advantages], ["disadvantage", D.disadvantages], ["skill", D.skills]]) {
    for (const e of list) {
      for (const p of e.picks || []) for (const id of ((p.from || {}).ids || [])) ref("skill", id, `${e.id}.picks`);
      prereqs(e.requires, `${e.id}.requires`);
      for (const x of e.excludes || []) refs.push([S.advantage.has(x) || S.disadvantage.has(x) ? "advantage" : "skill", x, `${e.id}.excludes`]);
      for (const g of e.grants || []) if (g.type === "luckCost") ref("luckSpend", g.spendId, `${e.id}.grants`);
    }
  }
  for (const m of D.milestones.majorGeneral || []) prereqs(m.prerequisites, `milestone ${m.id}`);
  for (const d of D.derived) for (const s of d.inputs || []) ref("stat", s, `derived ${d.id}`);
  // Formulas are { stat, times, plus } (Decision 135). SAN's stat is a Basic
  // Stat; a starting SFR's may be a derived one (WILL).
  for (const d of D.derived) if (d.formula) ref("stat", d.formula.stat, `derived ${d.id}.formula`);
  const derivedIds = new Set(D.derived.map(d => d.id));
  for (const a of D.archetypes) {
    const cps = a.campaignPowerScaling || {};
    for (const s of cps.focusStats || []) ref("stat", s, `${a.id}.focusStats`);
    for (const [pl, row] of Object.entries(cps.byPowerLevel || {}))
      if (row.startingSFR) refs.push([derivedIds.has(row.startingSFR.stat) ? "derived" : "stat", row.startingSFR.stat, `${a.id}.${pl}.startingSFR`]);
  }
  S.derived = derivedIds;
  // Focused Skills are ids plus a category pick (Decision 134). A list here
  // is the old prose shape coming back, which is what hid B12.
  const shapes = [];
  for (const a of D.archetypes) {
    for (const t of a.baselineTraits || []) for (const p of t.pool || []) ref("advantage", p.advantageId, `${a.id} natural pool`);
    for (const o of (a.specialization || {}).options || []) {
      prereqs(o.requires, `${a.id}.${o.id}.requires`);
      const f = o.focusedSkills;
      if (f === undefined) continue;
      if (!f || typeof f !== "object" || Array.isArray(f)) { shapes.push(`${a.id}.${o.id}.focusedSkills`); continue; }
      for (const id of f.ids || []) ref("skill", id, `${a.id}.${o.id}.focusedSkills.ids`);
      if (f.choose) ref("skillCategory", f.choose.category, `${a.id}.${o.id}.focusedSkills.choose`);
    }
  }
  for (const w of D.weapons) { ref("skill", w.skill, `weapon ${w.id}`); ref("weaponCategory", w.category, `weapon ${w.id}`); }
  for (const g of D.weaponModGlossary || []) {
    for (const id of ((g.onlyFor || {}).weapons || [])) ref("weapon", id, `mod ${g.id}.onlyFor`);
    for (const c of [...((g.onlyFor || {}).categories || []), ...((g.notFor || {}).categories || [])]) ref("weaponCategory", c, `mod ${g.id}`);
  }
  for (const x of D.armor) { for (const f of x.preInstalledFeatures || []) ref("armorFeature", f, `armor ${x.id}`); ref("armorFeature", x.feature, `armor ${x.id}`); }
  for (const e of D.equipment || []) { ref("equipmentCategory", e.category, `equipment ${e.id}`); ref("spell", e.spell, `equipment ${e.id}`); }
  for (const s of D.spells || []) { ref("domain", s.domain, `spell ${s.id}`); ref("tier", s.tier, `spell ${s.id}`); }
  for (const a of D.aberrations || []) ref("aberrationCategory", a.category, `aberration ${a.id}`);
  for (const t of D.damageTypes || []) for (const c of [...(t.inflicts || []), ...(t.always || [])]) ref("condition", c, `damage type ${t.id}`);
  for (const t of D.damageCategories || []) for (const c of t.inflicts || []) ref("condition", c, `damage category ${t.id}`);
  const R = D.recoveryRules || {}, DR = D.damageRules || {};
  for (const c of [...((R.focusedHealing || {}).clears || []), ...((R.nanomed || {}).clears || [])]) ref("condition", c, "recoveryRules");
  ref("condition", (DR.whileDying || {}).condition, "damageRules.whileDying");
  for (const c of [...((DR.atZero || {}).onPass || []), ...((DR.atZero || {}).onFail || []), ...((DR.shock || {}).onFail || [])]) ref("condition", c, "damageRules");
  ref("advantage", ((DR.atZero || {}).freePass || {}).advantage, "damageRules.atZero.freePass");

  assert.ok(refs.length > 300, `swept only ${refs.length} references — did a field get renamed?`);
  const dangling = refs.filter(([kind, id]) => !S[kind].has(id)).map(([kind, id, where]) => `${where}: "${id}" is no ${kind}`);
  assert.deepEqual(dangling, []);
  assert.deepEqual(shapes, [], "focusedSkills must be { ids, choose?, all? }, not a list of names");
});

test("every data path and formula resolves to a number at every power level (Decision 135)", () => {
  // `countBy`, `maxRankBy` and `startingRankBy` name a number by path, and a
  // formula names a stat. A typo in either used to fall back quietly to 0 or
  // null, which reads as "no requirement". Each one resolves, for real.
  const bad = [];
  let checked = 0;
  for (const a of D.archetypes) {
    const disc = (a.coreMechanic || {}).disciplines;
    const paths = [["specialization.countBy", (a.specialization || {}).countBy],
      ["disciplines.maxRankBy", disc && disc.maxRankBy],
      ...((disc && disc.list) || []).map(d => [`${d.id}.startingRankBy`, d.startingRankBy])].filter(([, p]) => p);
    for (const pl of D.powerLevels) {
      const ch = Engine.newCharacter();
      ch.identity.archetype = a.id; ch.creation.powerLevel = pl.id;
      for (const [where, p] of paths) { checked++; if (Engine.dataPath(ch, p) == null) bad.push(`${a.id} ${pl.id} ${where}: "${p}"`); }
      const s = Engine.sfr(ch);
      if (s) { checked++; if (typeof s.value !== "number") bad.push(`${a.id} ${pl.id} startingSFR`); }
    }
  }
  assert.ok(checked >= 16, `checked only ${checked} paths — did a field get renamed?`);
  assert.deepEqual(bad, []);
  assert.equal(typeof Engine.derived(subject()).SAN, "number");
});

// ── The data contract (R6's key guard, Decision 135) ──────────────────
// Engine and UI source with comments stripped, so a key named only in a
// comment doesn't count as read. A `//` after a colon is a URL, not a comment.
// Derived from index.html's <script src> tags (Decision 172), so a new UI file is covered without being remembered.
const CODE_FILES = [...readFileSync(join(ROOT, "index.html"), "utf8").matchAll(/<script[^>]*src=["']([^"']+)["']/g)]
  .map(m => m[1]).filter(s => /^src\/(engine|ui)\//.test(s) && !s.endsWith("theme-init.js"));
const code = file => readFileSync(join(ROOT, file), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
const CODE = CODE_FILES.map(code).join("\n");

// Where a key is content, not a field: a power level's row, a stat value's
// modifier, a spell's overflow degrees and a grenade's, a tier's TH and time per Discipline
// (Decision 136), an integrity die or a TN per
// difficulty, an armor slot's name, and a specialization's powers (shared.js
// draws any array of plain objects on a power as a table, columns from keys).
const MAPS = [/\.byPowerLevel$/, /^statRules\.(modifiers|raiseCost)$/, /^spells\[\]\.overflow$/, /^weapons\[\]\.escalation$/,/^enchantmentTimeTable\[\]\.(th|minTime)$/,
  /^armorRules\.integrityLossByDifficulty$/, /^skillCheckRules\.difficulties$/, /^armorRules\.slotNames$/,
  /\.starterPower$/, /\.starterPower\.\*\[\]$/,
  /\.sp(\.\*)?$/, // W32: keyed by the text an amount sits beside, read by spAmounts
  /^appCopy\.statusLabel$/]; // keyed by an archetype's `status`, read by statusLabel()
// Display and maintainer text by name. A key named like this has to hold text,
// so a number can't hide behind a *Note name.
const TEXT_KEY = /(Text|Note|Notes|Source)$|^(description|example|lore|meaning)$/;
// Merged content no screen shows yet. AQ4 answered each one: S6 showed them,
// and P3b `growth` (Decision 199). An entry leaves this list the day code
// reads it; the test says when.
const NOT_YET_SHOWN = {
};

function dataKeys() {
  const keys = new Map();   // key -> { paths, values }
  const viaPath = new Set(); // keys the engine reaches through a `…By` data path
  (function walk(v, path) {
    if (Array.isArray(v)) return v.forEach(x => walk(x, `${path}[]`));
    if (!v || typeof v !== "object") return;
    const isMap = MAPS.some(re => re.test(path));
    for (const [k, x] of Object.entries(v)) {
      if (!isMap) {
        const e = keys.get(k) || { paths: new Set(), values: [] };
        e.paths.add(path || "(top)"); e.values.push(x); keys.set(k, e);
        // `countBy`, `maxRankBy`, `startingRankBy`: Engine.dataPath reads the key it ends in.
        if (/By$/.test(k) && typeof x === "string") for (const seg of x.split(".")) viaPath.add(seg);
        // A pick's `from.optionsFrom` names the list pickOptions reads off its entry (Martial Arts' `styles`).
        if (k === "optionsFrom" && typeof x === "string") viaPath.add(x);
        // A panel's `stepsFrom` and a toggle option's `costFrom` name the key the engine reads off the chosen specialization (Decisions 195, 196).
        if ((k === "stepsFrom" || k === "costFrom") && typeof x === "string") viaPath.add(x);
      }
      walk(x, path ? `${path}.${isMap ? "*" : k}` : k);
    }
  })(D, "");
  return { keys, viaPath };
}
const namedInCode = k => new RegExp(`(\\?\\.|\\.)${k}\\b|["'\`]${k}["'\`]|[{,]\\s*${k}\\s*[,}:=]`).test(CODE);

test("every data key is read by code, or named as text (R6 key guard, Decision 135)", () => {
  // rev 9's B3 and this audit's A9: a field that looks like a live setting,
  // beside a number the engine hardcodes. Each key is named in code, named
  // as text, or waiting on a screen that will show it.
  const { keys, viaPath } = dataKeys();
  const isRead = k => viaPath.has(k) || namedInCode(k);
  assert.ok(keys.size > 300, `found only ${keys.size} keys — did the walk break?`);
  const where = k => [...keys.get(k).paths].slice(0, 2).join(", ");
  const unread = [...keys.keys()].filter(k => !isRead(k) && !TEXT_KEY.test(k) && !(k in NOT_YET_SHOWN))
    .map(k => `${where(k)}.${k}`);
  assert.deepEqual(unread, [], "a data key nothing reads: read it, name it as text (…Text, …Note), or delete it");
  const isText = v => v == null || typeof v === "string" || (Array.isArray(v) && v.every(x => typeof x === "string"));
  const textButNot = [...keys].filter(([k, e]) => TEXT_KEY.test(k) && !e.values.every(isText)).map(([k]) => `${where(k)}.${k}`);
  assert.deepEqual(textButNot, [], "a key named as text holds something else");
  const stale = Object.keys(NOT_YET_SHOWN).filter(k => !keys.has(k) || isRead(k));
  assert.deepEqual(stale, [], "shown now, or gone from the data: take it off NOT_YET_SHOWN");
});

// The key guard proves a field is named in code; these prove it's read. Each
// changes one number in the data and checks the output follows it. Before
// Decision 135 every one of these values was typed into the engine beside it.
const withData = (obj, key, value, fn) => {
  const had = Object.prototype.hasOwnProperty.call(obj, key), old = obj[key];
  obj[key] = value;
  try { fn(); } finally { if (had) obj[key] = old; else delete obj[key]; }
};

test("the Arcanist's Discipline price, cap and Evocation start are read from the data (A8, Decisions 135, 157)", () => {
  const disc = D.archetypes.find(a => a.coreMechanic && a.coreMechanic.disciplines).coreMechanic.disciplines;
  const ch = subject();
  ch.archetypeChoices.disciplines = { enchantment: 2 };
  assert.equal(Engine.disciplineSpent(ch), 10, "a Discipline rank costs 5 CP, the price of any power rank");
  withData(D.creationFlow.boostRules, "cpPerPowerRank", 9, () => assert.equal(Engine.disciplineSpent(ch), 18));

  const pl = Engine.powerLevel(ch);
  assert.equal(Engine.disciplineCap(ch), pl.maxPowerRank);
  withData(disc, "maxRankBy", "powerLevel.characterPoints", () => assert.equal(Engine.disciplineCap(ch), pl.characterPoints));

  const evo = disc.list.find(d => d.startingRankBy);
  const rank = () => Engine.disciplineRanks(ch).find(d => d.id === evo.id).rank;
  assert.equal(rank(), Engine.scalingRow(ch).evocationStartingRank);
  // A different number, not a different key: aberrations equals the Evocation start at every level.
  withData(evo, "startingRankBy", "powerLevel.characterPoints", () => assert.equal(rank(), pl.characterPoints));

  // Over the cap is an error on the Character Points step, from the same number.
  ch.archetypeChoices.disciplines = { enchantment: pl.maxPowerRank + 1 };
  const msgs = Engine.validate("character-points", ch).filter(i => i.level === "error").map(i => i.msg).join(" ");
  assert.match(msgs, new RegExp(`Enchantment is rank ${pl.maxPowerRank + 1}\\. It can start at ${pl.maxPowerRank} at most\\.`));
});

test("SAN, starting SFR and the stat IP price are numbers the engine reads (A9, Decision 135)", () => {
  const ch = subject();
  const san = D.derived.find(d => d.id === "SAN");
  const emp = Engine.statValue(ch, "EMP");
  assert.equal(Engine.derived(ch).SAN, Math.min(san.cap, Math.max(san.floor, emp * 10)));
  withData(san.formula, "times", 5, () => assert.equal(Engine.derived(ch).SAN, Math.max(san.floor, emp * 5)));

  const ww = D.archetypes.find(a => Object.values((a.campaignPowerScaling || {}).byPowerLevel || {}).some(r => r.startingSFR));
  ch.identity.archetype = ww.id;
  const row = Engine.scalingRow(ch), will = Engine.derived(ch).WILL;
  assert.equal(Engine.sfr(ch).value, will * 3 + row.startingSFR.plus);
  assert.equal(Engine.sfr(ch).formula, `WILL × 3 + ${row.startingSFR.plus}`);
  withData(row.startingSFR, "plus", 100, () => assert.equal(Engine.sfr(ch).value, will * 3 + 100));

  ch.identity.archetype = "";
  const cur = Engine.statValue(ch, "REF");
  assert.equal(Engine.ipCost(ch, "stat", "REF").cost, cur * 10);
  withData(D.ip.statIncreaseCost, "perPoint", 12, () => assert.equal(Engine.ipCost(ch, "stat", "REF").cost, cur * 12));
});

test("a Milestone refusal says when the next one unlocks, from the cadence numbers (A9, Decision 135)", () => {
  const ch = subject();
  const minor = D.milestones.minorShared[0].id, major = D.milestones.majorGeneral[0].id;
  ch.progression.milestonePoints = 0;
  assert.equal(Engine.canTakeMinor(ch, minor).why, "No Minor Milestone unlocked (next at 5 MP).");
  assert.equal(Engine.takeMilestone(ch, "major", major).why, "No Major Milestone unlocked (next at 10 MP).");
  ch.progression.milestonePoints = 7;
  ch.progression.milestones.minor = [{ id: minor }];
  assert.equal(Engine.canTakeMinor(ch, D.milestones.minorShared[1].id).why, "No Minor Milestone unlocked (next at 15 MP).");
  const st = Engine.milestoneState(ch);
  assert.equal(st.minorCadence, "5, 15, 25…");
  assert.equal(st.majorCadence, "10, 20, 30…");
  withData(D.milestones.rules, "minorEvery", 4, () => {
    assert.equal(Engine.milestoneState(ch).minorCadence, "5, 9, 13…");
    assert.equal(Engine.milestoneState(ch).nextMinorAt, 9);
  });
});

test("the currency sign on a refusal is the data's (A9, Decision 135)", () => {
  const ch = subject();
  ch.trackers.credits.current = 0;
  const w = D.weapons.find(x => typeof x.cost === "number" && x.cost > 0);
  assert.match(Engine.catalogLine(ch, "weapons", w.id).buy.why, /Ç\. You have 0Ç\./);
  withData(D.resources.credits, "symbol", "¤", () => {
    assert.match(Engine.catalogLine(ch, "weapons", w.id).buy.why, /¤\. You have 0¤\./);
    assert.match(Engine.addLoadout(ch, "weapons", w.id, { buy: true }).why, /¤\. You have 0¤\./);
  });
});

test("a tracker panel's direction and storage are its data, not its id (Decision 135)", () => {
  const ch = subject();
  const p = { id: "__fixture", type: "tracker", max: 6 };
  const panels = D.archetypes.find(a => a.id === ch.identity.archetype).coreMechanic.panels;
  panels.push(p);
  try {
    assert.equal(Engine.panelTracker(ch, p).shown, 0);
    assert.equal(ch.trackers.panel.__fixture, undefined, "reading a tracker wrote to the character");
    Engine.adjustPanelTracker(ch, "__fixture", 2);
    assert.deepEqual([Engine.panelTracker(ch, p).shown, ch.trackers.panel.__fixture.value], [2, 2]);
    p.counts = "down"; p.resource = "sfr";
    ch.trackers.sfr.spent = 1;
    assert.equal(Engine.panelTracker(ch, p).shown, 5, "counts down from the max, from the resource's own spend");
    Engine.adjustPanelTracker(ch, "__fixture", 2);
    assert.equal(ch.trackers.sfr.spent, 3);
    assert.equal(Engine.adjustPanelTracker(ch, "nope", 1).ok, false);
  } finally { panels.pop(); }
});

test("no archetype or discipline is named in engine or UI code (A8, Decision 135)", () => {
  // "Adding an archetype is data" (CLAUDE.md). An id in code is the special
  // case that makes the next archetype an app change: the Arcanist's 6 CP,
  // the Evocation starting rank and the Professional's parsed prose all were.
  const ids = [...D.archetypes.map(a => a.id),
    ...D.archetypes.flatMap(a => (((a.coreMechanic || {}).disciplines || {}).list || []).map(d => d.id))];
  assert.ok(ids.length >= 8, `expected five archetypes and three disciplines, got ${ids.length}`);
  // A panel is matched by its `type`, never its `id`: the SFR tracker's
  // `p.id==="sfr"` in two files is what `counts` and `resource` replaced.
  const panelIds = D.archetypes.flatMap(a => ((a.coreMechanic || {}).panels || []).map(p => p.id));
  const found = [];
  for (const file of CODE_FILES) {
    const src = code(file);
    for (const id of ids) if (new RegExp(`["'\`]${id}["'\`]`).test(src)) found.push(`${file}: "${id}"`);
    for (const id of panelIds) if (new RegExp(`(\\.id|\\bpid)\\s*[!=]==?\\s*["'\`]${id}["'\`]`).test(src)) found.push(`${file}: panel "${id}"`);
  }
  assert.deepEqual(found, []);
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
  assert.equal(old.meta.schemaVersion, "0.19");
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
    "junk focused picks":  Engine.migrate({ identity:{archetype:"professional"}, creation:{powerLevel:"heroic"},
                                            archetypeChoices:{specialization:["mercenary"], focusedSkillPicks:[7, null, {}, "no-such-skill", "rifles", "rifles"]} }),
    "focused picks text":  Engine.migrate({ identity:{archetype:"professional"}, archetypeChoices:{specialization:["cleaner"], focusedSkillPicks:"rifles"} }),
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
  assert.equal(bare.meta.schemaVersion, "0.19");
  assert.ok(Engine.versionCheck(bare).some(i => /game data/.test(i)));
});

test("no exported reader throws on any character migrate() can return", () => {
  // Readers take (ch) alone; anything needing more arguments is exercised by
  // its own test. Named here so adding an export is a deliberate choice.
  const readers = ["powerLevel","archetype","statTable","scalingRow","derived","health","sfr",
                   "statPool","statSpent","skillPool","skillSpent","advSpent","disGranted",
                   "luckSpent","boostSpent","disciplineSpent","cp","painState","conditionState","hlState","armorState","naturalArmor","naturalHealing","resolveReset","luckState",
                   "sanState","crankState","focusedSkillIds","focusedSkillSpec","focusedPicks","ipState","milestoneState","archPanels",
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
    for (const id of [...Object.keys(ch.skills||{}), "rifles", "no-such-skill"]){
      try { Engine.skillRankCap(ch, id); Engine.focusedPrice(ch, id, 3); Engine.ipCost(ch, "skill", id); Engine.canBoost(ch, "skill", id); }
      catch (e) { failures.push(`Focused Skill readers(${label}, ${id}) -> ${e.message}`); }
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

test("migrate keeps Focused Skill picks a list of ids, and validate names the ones that don't count (Decision 134)", () => {
  const junk = Engine.migrate({ identity:{ archetype:"professional" }, creation:{ powerLevel:"heroic" },
                                archetypeChoices:{ specialization:["mercenary"], focusedSkillPicks:[7, null, {}, "no-such-skill", "rifles"] } });
  assert.equal(junk.archetypeChoices.focusedSkillPicks.join(), "no-such-skill,rifles");
  assert.equal(Engine.focusedSkillIds(junk).includes("no-such-skill"), false, "a pick outside the options became Focused");
  assert.ok(Engine.validate("archetype", junk).some(i => /no-such-skill can't be one/.test(i.msg)));
  const text = Engine.migrate({ archetypeChoices:{ focusedSkillPicks:"rifles" } });
  assert.equal(Array.isArray(text.archetypeChoices.focusedSkillPicks) && text.archetypeChoices.focusedSkillPicks.length, 0);
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
    assert.equal(c.meta.schemaVersion, "0.19");
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
// Natural Advantages pool (source:"natural") and once bought with CP
// (notes:""). `favored-skill` is in that pool AND carries picks, so this is
// reachable with shipped data, not a hypothetical.

/** A Professional holding favored-skill both free and purchased. */
function doubleHeld({ natural = 2, purchased = 1 } = {}){
  const ch = subject();
  ch.identity.archetype = "professional";
  ch.archetypeChoices.specialization = ["cleaner"];
  ch.archetypeChoices.naturalAdvantages = [{ id: "favored-skill", rank: natural }];
  ch.advantages = [];
  if (natural)   ch.advantages.push({ id: "favored-skill", rank: natural, notes: "", source: "natural" });
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
  // Every row of 0540's table, plus Dying (plan CQ9).
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
  assert.equal(old.meta.schemaVersion, "0.19");
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

test("versionCheck reports an orphaned weapon, armor, gear, spell or specialization id (C9)", () => {
  const ch = subject();
  ch.weapons = [{ id: "no-such-gun" }, { id: D.weapons[0].id }];
  ch.armor = [{ id: "no-such-vest" }, { id: D.armor[0].id }];
  ch.gear = [{ id: "no-such-kit", qty: 1 }, { id: D.equipment[0].id, qty: 1 }];
  ch.panelData = { grimoire: [{ spellId: "no-such-spell", stage: "known" }, { spellId: D.spells[0].id, stage: "known" }] };
  ch.archetypeChoices.specialization = ["no-such-origin"];
  const issues = Engine.versionCheck(Engine.migrate(ch));
  for (const [kind, id] of [["Weapon", "no-such-gun"], ["Armor", "no-such-vest"], ["Gear", "no-such-kit"],
                            ["Spell", "no-such-spell"], ["Specialization", "no-such-origin"]])
    assert.ok(issues.some(i => i.startsWith(`${kind} "${id}"`)), `${kind} "${id}" went unreported`);
  // What the data still defines, and a typed row, report nothing.
  ch.weapons = [{ id: D.weapons[0].id }, { custom: true, name: "Grandpa's revolver" }];
  ch.armor = [{ id: D.armor[0].id }]; ch.gear = [{ id: D.equipment[0].id, qty: 1 }];
  ch.panelData = { grimoire: [{ spellId: D.spells[0].id, stage: "known" }] };
  ch.archetypeChoices.specialization = [];
  const left = Engine.versionCheck(Engine.migrate(ch)).filter(i => / no longer exists /.test(i));
  assert.equal(left.length, 0, left.join(" · "));
});

test("schema 0.13 moves the natural-advantage marker out of notes, undo history included (A11, Decision 142)", () => {
  // A 0.12 Professional: one free row, one bought, and an undo entry recorded
  // before the migration that restores the whole list in the old shape.
  const old = doubleHeld();
  old.meta.schemaVersion = "0.12";
  old.advantages = [{ id: "favored-skill", rank: 2, notes: "natural" }, { id: "favored-skill", rank: 1, notes: "" }];
  old.audit = [{ seq: 1, date: "2026-09-01", kind: "admin", label: "Admin", patch: [
    { path: ["advantages"], type: "array", op: "set", before: [{ id: "favored-skill", rank: 2, notes: "natural" }] },
    { path: ["advantages"], type: "array", op: "removeAt", index: 0, item: { id: "favored-skill", rank: 1, notes: "natural" } }] }];
  const m = Engine.migrate(JSON.parse(JSON.stringify(old)));
  assert.equal(m.meta.schemaVersion, "0.19");
  assert.equal(m.advantages[0].source, "natural");
  assert.equal(m.advantages[0].notes, "", "the marker stayed in the player's notes");
  assert.equal(m.advantages[1].source, undefined);
  assert.equal(Engine.advSpent(m), Engine.advSpent(doubleHeld({ natural: 0 })), "the free row started costing CP");
  const [set, remove] = m.audit[0].patch;
  assert.equal(set.before[0].source, "natural", "a stored undo patch kept the old shape");
  assert.equal(remove.item.source, "natural", "a stored undo row kept the old shape");
  Engine.undoLastAction(m);
  assert.equal(m.advantages.length, 1);   // ops replay last-first, so the list `set` wins
  assert.equal(m.advantages[0].source, "natural", "undo past the migration restored the old shape");
  assert.equal(m.advantages[0].notes, "");
  // From 0.13 on, a note is only a note: "natural" typed as text buys nothing free.
  const now = doubleHeld({ natural: 0 });
  now.advantages[0].notes = "natural";
  const n = Engine.migrate(JSON.parse(JSON.stringify(now)));
  assert.equal(n.advantages[0].source, undefined);
  assert.ok(Engine.advSpent(n) > 0, "a 0.13 note reading \"natural\" made a bought advantage free");
  // Anything but "natural" in source is dropped, never kept as a third kind.
  now.advantages[0].source = "gift";
  assert.equal(Engine.migrate(JSON.parse(JSON.stringify(now))).advantages[0].source, undefined);
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
  const sub = Engine.archetype(ch).specialization.options.find(o => ((o.focusedSkills || {}).ids || []).length);
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
  for (const k of ["rollPenalty", "penaltyStacking"])
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
      tagReading: () => Engine.tagReading(ch),
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
      rounds: () => [-1, 0, 1, 2, 3, 4, 99].forEach(i => { Engine.fireWeapon(ch, i, "S"); Engine.fireWeapon(ch, i, "x"); Engine.fireWeapon(ch, i); Engine.reloadWeapon(ch, i); Engine.reloadWeapon(ch, i, { anyway: true }); }),
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

// Resilient Spirit was the one `resAgainst` grant the book printed, and 0414
// dropped it (VQ10, Decision 196). The mechanism stays, on a fixture.
test("a conditional Natural Armor grant with resAgainst answers magical damage only while it's on (Decision 104)", () => {
  const ch = subject();
  ch.identity.archetype = "werewolf";
  ch.archetypeChoices.specialization = ["trueborn"];
  ch.progression.milestones.major.push({ id: "shake-it-off" });
  const tb = D.archetypes.find(a => a.id === "werewolf").specialization.options.find(o => o.id === "trueborn");
  assert.equal(tb.grants, undefined, "Resilient Spirit is back in the Trueborn's data");
  const hit = natural => Engine.resolveHit(ch, { damage: 8, damageType: "spirit", natural });
  assert.equal(hit(["fixture-ward"]).through, 8, "Shake it Off answered magical damage on its own");
  withData(tb, "grants", [{ type: "naturalArmor", id: "fixture-ward", name: "Fixture Ward",
                            resAgainst: ["elemental", "spirit", "aether"], while: "while the fixture says so" }], () => {
    assert.equal(hit([]).through, 8);
    assert.equal(hit(["fixture-ward"]).through, 3);
  });
});

// ── Nanomed Kit (Decision 105, CQ12: 0540's list) ──────────────────────

test("a Nanomed Kit clears 0540's four, stabilizes the Dying, and proposes BOD / dose", () => {
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
  // "treat a Good result as Neutral" (0480_Magic.md) — the permanent column never says good.
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

// ── W32: Spell Power in numbers ───────────────────────────────────────
const spell = id => D.spells.find(s => s.id === id);

test("spAmounts works out Spell Power: Dart at Spell Power 13 is 7, halves round up (W32)", () => {
  const ch = subject(), at13 = { value: 13 };
  const dart = Engine.spAmounts(ch, spell("dart"), at13);
  same([dart.effect.value, dart.effect.adds, dart.overflow["1x"].value], [7, false, 13]);
  const bolt = Engine.spAmounts(ch, spell("firebolt"), at13);
  same([bolt.effect.value, bolt.overflow["1x"].value, bolt.overflow["1x"].adds], [13, 7, true], "an increase reads as one");
  assert.equal(Engine.spAmounts(ch, spell("kinetic-ward"), at13).effect.value, 26, "SP × 2");
  assert.equal(Engine.spAmounts(ch, spell("threshold-ward"), at13).defending.value, 7);
  // Without the precomputed power it reads the character's own.
  const own = Engine.spellPower(ch).value;
  assert.equal(Engine.spAmounts(ch, spell("dart")).effect.value, Math.ceil(own / 2));
  // The Grimoire carries it on the line.
  ch.panelData.grimoire = [{ spellId: "dart", stage: "known", notes: "" }];
  assert.equal(Engine.grimoire(ch).lines[0].sp.effect.value, Math.ceil(own / 2));
});

test("spAmounts is null without Spell Power, and ignores an amount that isn't one (W32)", () => {
  const ch = subject();
  ch.identity.archetype = null;
  assert.equal(Engine.spellPower(ch), null);
  assert.equal(Engine.spAmounts(ch, spell("dart")), null, "a number with no Spell Power to read");
  const at = { value: 10 };
  for (const bad of [null, 7, "x", { effect: null }, { effect: { times: -1 } }, { effect: { times: "½" } }, { effect: { adds: Infinity } }, { overflow: 3 }]){
    const r = Engine.spAmounts(subject(), { sp: bad }, at);
    assert.ok(r === null || (!r.effect && !Object.keys(r.overflow).length), `made a number of ${JSON.stringify(bad)}`);
  }
  assert.equal(Engine.spAmounts(ch, null, at), null);
});

test("every text that names Spell Power carries its amount, and every amount names a text (W32)", () => {
  // The engine never reads the prose (the Focused Skills lesson, Decision
  // 134); this is what keeps the structured field and the book's words
  // together. "1d SP" and "SP + net Hits" hang on a roll, so the words stand alone.
  const names = t => typeof t === "string" && /(\bSP\b|Spell Power)/.test(t) && !/1d SP|SP \+ net Hits/.test(t);
  const gaps = [];
  const check = (where, entry, fields) => {
    const sp = entry.sp || {};
    for (const k of fields) if (names(entry[k]) !== !!sp[k]) gaps.push(`${where}.${k}`);
    for (const k of Object.keys(entry.overflow || {})) if (names(entry.overflow[k]) !== !!(sp.overflow || {})[k]) gaps.push(`${where}.overflow.${k}`);
    for (const k of Object.keys(sp)) if (k !== "overflow" && !fields.includes(k)) gaps.push(`${where}.sp.${k} names no text`);
  };
  D.spells.forEach(s => check(s.id, s, ["effect", "defending"]));
  D.cascadeTable.rows.forEach(r => check(r.id, r, ["effect"]));
  D.aberrations.forEach(a => check(a.id, a, ["description"]));
  same(gaps, []);
});

test("versionCheck matches a Mastery spend to its Grimoire row, not to skill IPE (B11)", () => {
  // Mastering a spell is an IP spend with targetType "spell" (Decision 108).
  // versionCheck read every non-stat spend as a skill, found IPE 0, and told
  // every Arcanist who had mastered anything that their file was hand-edited.
  const ch = subject();
  Engine.grantIP(ch, 200, "test");
  assert.ok(Engine.addSpell(ch, "firebolt").ok);
  assert.ok(Engine.spendIP(ch, "spell", "firebolt").ok);
  same(Engine.versionCheck(ch), [], "mastering a spell reads as a hand edit");
  ch.panelData.grimoire[0].stage = "known";
  assert.ok(Engine.versionCheck(ch).some(m => /Firebolt Mastered/.test(m)),
    "a Mastery spend the Grimoire doesn't show went unreported");
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
// A starting spell is one Evocation casts (Decision 136), so these pick from those.
const castable = s => Engine.spellForms(s).includes(D.spellcraftRules.startingSpells.discipline);
const byTH = th => D.spells.find(s => s.th === th && castable(s)).id;
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
  const cantrips = D.spells.filter(s => s.th === 1 && castable(s)).map(s => s.id);
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
  ch.panelData.grimoire = D.spells.filter(s => s.th === 1 && castable(s)).slice(0, Engine.startingSpells(ch).count + 1)
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

// ── A spell's forms (Decision 136) ────────────────────────────────────

const onlyIn = d => D.spells.find(s => Engine.spellForms(s).length === 1 && Engine.spellForms(s)[0] === d);

test("a spell takes every form unless it names its own, and a bad list falls back to the default", () => {
  const all = D.spellcraftRules.forms.disciplines;
  same(Engine.spellForms(D.spells.find(s => s.id === "firebolt")), all);
  same(Engine.spellForms({ disciplines: ["enchantment"] }), ["enchantment"]);
  same(Engine.spellForms({ disciplines: ["nonsense"] }), all, "an unknown discipline narrowed the spell to nothing");
  same(Engine.spellForms({ disciplines: "enchantment" }), all);
  same(Engine.spellForms(null), all);
});

test("a spell's TH in another form is the Enchantment table's row for its tier", () => {
  const ch = subject();
  for (const s of D.spells.filter(x => typeof x.th === "number")) {
    const row = D.enchantmentTimeTable.find(r => r.tier === s.tier);
    for (const d of Engine.spellForms(s)) {
      const f = Engine.spellForm(ch, s, d);
      if (f.live) same([f.th, f.time], [s.th, null], `${s.id} cast live`);
      else same([f.th, f.time], [row.th[d], row.minTime[d]], `${s.id} as ${d}`);
    }
  }
  const ward = onlyIn("alchemy"), f = Engine.spellForm(ch, ward);
  same([f.discipline, f.only, f.live], ["alchemy", true, false]);
  assert.equal(f.name, "Alchemy", "the form's name isn't the Discipline's");
});

test("an inscribed-only spell isn't a starting spell, and says why", () => {
  const ch = creating(c => { c.archetypeChoices.rolls.startingSpells = 4; });
  const trap = onlyIn("enchantment");
  const c = Engine.canAddStartingSpell(ch, trap.id);
  assert.equal(c.ok, false);
  assert.match(c.why, new RegExp(`^${trap.name} is made with Enchantment, never cast`));
  ch.panelData.grimoire = [{ spellId: trap.id, stage: "known", notes: "" }];   // a file that has one anyway
  assert.ok(spellIssues(ch).some(([l, m]) => l === "error" && m.startsWith(`${trap.name} is made with Enchantment`)),
    "validate let an inscribed-only spell through as a starting spell");
  same(Engine.startingSpells(ch).over, [], "an uncastable spell was also reported as over the Evocation rank");
});

test("in the Grimoire an inscribed-only spell reads its own TH, prices Mastery from it, and is never beyond the pool", () => {
  const ch = subject();                                               // locked, Evocation 1
  const trap = D.spells.find(s => Engine.spellForms(s).length === 1 && s.th >= 2);
  assert.ok(Engine.addSpell(ch, trap.id).ok);
  const l = Engine.grimoire(ch).lines[0], th = Engine.spellForm(ch, trap).th;
  same([l.th, l.printedTH, l.beyondPool, l.masteryCost], [th, th, false, D.spellcraftRules.mastery.ipPerTH * th]);
  assert.ok(th > trap.th, "the test spell's form TH should differ from its tier TH");
  ch.panelData.grimoire[0].stage = "mastered";
  assert.equal(Engine.grimoire(ch).lines[0].th, th - D.spellcraftRules.mastery.thReduction);
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
  assert.deepEqual([...modes], ["S1", "B3", "F10"], "0530: Single 1, Burst 3, Full Auto 10");
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
  Engine.addLoadout(ch, "gear", "handgun-rounds");
  assert.equal(Engine.reloadWeapon(ch, 0).ok, true);
  assert.equal(ch.weapons[0].roundsSpent, 0);
  assert.equal(Engine.reloadWeapon(ch, 0).ok, false, "reloaded a full magazine");
  assert.equal(Engine.fireWeapon(armed("combat-knife"), 0, "S").ok, false, "a knife fired a round");
  // A custom weapon's typed capacity is tracked the same way.
  const c = subject(); Engine.addCustomLoadout(c, "weapons"); Object.assign(c.weapons[0], { name: "Zip gun", capacity: "4", rof: "S" });
  assert.equal(Engine.fireWeapon(c, 0, "S").left, 3);
});

test("W30: Reload takes a mag (or a shell a round) of what fits from what you carry, and asks before reloading from nothing", () => {
  const ch = armed("ads-lp9-viper");                   // handgun, 15+1
  ch.weapons[0].roundsSpent = 10;
  assert.equal(Engine.weaponLine(ch, 0).reloadFrom.carried, 0);
  const dry = Engine.reloadWeapon(ch, 0);
  assert.equal(dry.ok, false, "reloaded from rounds nobody carries");
  assert.equal(dry.noAmmo, true);
  assert.match(dry.why, /You carry no Handgun Rounds\./);
  assert.equal(ch.weapons[0].roundsSpent, 10, "a refused reload changed the magazine");
  const anyway = Engine.reloadWeapon(ch, 0, { anyway: true });
  assert.equal(anyway.ok, true); assert.equal(anyway.anyway, true, "the result doesn't say it came from nowhere");
  assert.equal(ch.weapons[0].roundsSpent, 0);
  // Gear sells rounds by the mag, and Capacity is the magazine: one mag fills it.
  Engine.addLoadout(ch, "gear", "handgun-rounds"); Engine.addLoadout(ch, "gear", "handgun-rounds");
  Engine.addLoadout(ch, "gear", "smg-rounds");         // doesn't fit a handgun
  const mags = () => Engine.carriedGear(ch, "handgun-rounds");
  assert.equal(mags().qty, 2);
  assert.equal(Engine.weaponLine(ch, 0).reloadFrom.carried, 2);
  ch.weapons[0].roundsSpent = 3;
  const r = Engine.reloadWeapon(ch, 0);
  assert.equal(r.ok, true); assert.equal(r.used, 1); assert.equal(r.left, 16); assert.equal(r.ammoLeft, 1);
  assert.equal(mags().qty, 1, "the mag didn't come off what's carried");
  assert.equal(Engine.carriedGear(ch, "smg-rounds").qty, 1, "an SMG mag went into a handgun");
  ch.weapons[0].roundsSpent = 1; Engine.reloadWeapon(ch, 0);
  assert.equal(mags(), null, "the last mag used stays on the sheet");
  // Shells load one at a time, as many as you have.
  const sg = armed("sg88-siege-breaker");              // shotgun, 8+1
  sg.weapons[0].roundsSpent = 5;
  sg.gear.push({ id: "shotgun-shells", qty: 3, notes: "" });
  const s = Engine.reloadWeapon(sg, 0);
  assert.equal(s.used, 3); assert.equal(s.left, 7); assert.equal(sg.weapons[0].roundsSpent, 2);
  assert.equal(Engine.carriedGear(sg, "shotgun-shells"), null);
  // Rifle Rounds don't load a shotgun (F26's stub), and a beam weapon takes a cell.
  sg.gear.push({ id: "rifle-rounds", qty: 1, notes: "" });
  assert.equal(Engine.reloadWeapon(sg, 0).noAmmo, true);
  const beam = armed("ads-le4-falcon"); beam.weapons[0].roundsSpent = 20;
  assert.match(Engine.reloadWeapon(beam, 0).why, /Power Cell/);
  // Nothing in the ammo table fits a launcher or a custom weapon: those reload as before.
  const gl = armed("hgl4-anvil"); gl.weapons[0].roundsSpent = 2;
  assert.equal(Engine.reloadWeapon(gl, 0).ok, true);
  assert.equal(Engine.weaponLine(gl, 0).reloadFrom, undefined);
});

test("W40: with two kinds carried Reload asks which, and specialty rounds stay loaded, their tags on the line", () => {
  const ch = armed("ads-lp9-viper", { roundsSpent: 5 });
  ch.gear.push({ id: "handgun-rounds", qty: 2, notes: "" }, { id: "silver-rounds", qty: 1, notes: "" });
  const ask = Engine.reloadWeapon(ch, 0);
  same([ask.ok, ask.choose, ask.options.map(o => o.id)], [false, true, ["handgun-rounds", "silver-rounds"]]);
  assert.equal(ask.options[0].loaded, true, "standard rounds aren't what a weapon with nothing named holds");
  assert.equal(ch.weapons[0].roundsSpent, 5, "asking changed the magazine");
  const r = Engine.reloadWeapon(ch, 0, { ammo: "silver-rounds" });
  same([r.ok, r.loaded, r.swapped, r.left], [true, "silver-rounds", true, 16]);
  assert.equal(Engine.carriedGear(ch, "silver-rounds"), null, "the silver mag didn't come off what's carried");
  const l = Engine.weaponLine(ch, 0);
  assert.equal(l.loaded.name, "Silver Rounds");
  assert.ok(l.tags.includes("Withering (Lycanthropes)"), "the loaded rounds' tag isn't on the line");
  // Full, it reloads only to swap, and always asks.
  const full = Engine.reloadWeapon(ch, 0);
  same([full.choose, full.options.map(o => o.id)], [true, ["handgun-rounds"]], "a full weapon offered what's already in it");
  assert.equal(Engine.reloadWeapon(ch, 0, { ammo: "handgun-rounds" }).loaded, null);
  assert.equal(ch.weapons[0].loaded, undefined, "standard rounds are remembered as something");
  assert.ok(!Engine.weaponLine(ch, 0).tags.includes("Withering (Lycanthropes)"), "the tag outlived its rounds");
  assert.match(Engine.reloadWeapon(ch, 0).why, /already full/, "full of standard rounds with no specialty carried, and it reloaded");
  // Reloading from nothing forgets what was loaded.
  ch.weapons[0].loaded = "silver-rounds"; ch.weapons[0].roundsSpent = 3; ch.gear = [];
  Engine.reloadWeapon(ch, 0, { anyway: true });
  assert.equal(ch.weapons[0].loaded, undefined);
});

test("W40: specialty rounds fit what Gear says, and the Angel Mod fires Angel Rounds only (F26's stub)", () => {
  const fits = (id, mods = []) => { const ch = armed(id, { mods, roundsSpent: 1 });
    for (const a of ["silver-rounds", "holy-points", "angel-rounds", "handgun-rounds", "rifle-rounds"]) ch.gear.push({ id: a, qty: 1, notes: "" });
    const r = Engine.reloadWeapon(ch, 0);
    return r.choose ? r.options.map(o => o.id) : r.ammo; };
  same(fits("ads-lp9-viper"), ["handgun-rounds", "silver-rounds", "holy-points"]);
  same(fits("vr8-sentinel"), ["rifle-rounds", "silver-rounds"], "Holy Points are handgun only");
  same(fits("sg88-siege-breaker"), ["Shotgun Shells"], "a shotgun takes no specialty round while F26 stands");
  same(fits("ads-lp9-viper", ["Angel Mod"]), ["Angel Rounds"], "an Angel Mod loaded something besides Angel Rounds");
  const ch = armed("ads-lp9-viper", { mods: ["Angel Mod"], roundsSpent: 1 });
  ch.gear.push({ id: "handgun-rounds", qty: 1, notes: "" });
  assert.match(Engine.reloadWeapon(ch, 0).why, /You carry no Angel Rounds\./);
  ch.gear.push({ id: "angel-rounds", qty: 1, notes: "" });
  assert.equal(Engine.reloadWeapon(ch, 0).loaded, "angel-rounds");
  const l = Engine.weaponLine(ch, 0);
  assert.equal(l.loaded.name, "Angel Rounds");
  assert.ok(!l.tags.includes("+4 DMG"), "the mod's own damage came back as a tag");
});

test("W40: migrate() keeps a loaded round's id and drops anything else (schema 0.14)", () => {
  const ch = armed("ads-lp9-viper", { loaded: "silver-rounds" });
  Engine.addLoadout(ch, "weapons", "ads-lp9-viper"); ch.weapons[1].loaded = 7;
  ch.weapons.push({ custom: true, name: "Zip gun", loaded: "silver-rounds" });
  const m = Engine.migrate(JSON.parse(JSON.stringify(ch)));
  same(m.weapons.map(w => w.loaded), ["silver-rounds", undefined, undefined]);
  same(Engine.migrate(JSON.parse(JSON.stringify(m))).weapons[0].loaded, "silver-rounds", "a round trip lost it");
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
  assert.equal(m.meta.schemaVersion, "0.19");
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

test("B18: every character has a TAG that reads aloud cleanly, and no two match (Decision 133)", () => {
  const ids = Array.from({ length: 2000 }, () => Engine.newCharacter().meta.id);
  const bad = ids.filter(id => !/^TAG-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/.test(id));
  assert.deepEqual(bad, [], "a TAG is malformed, or uses I, L, O or U");
  assert.equal(new Set(ids).size, ids.length, "two new characters got the same TAG");
  assert.ok(ids.every(id => Engine.isIntakeId(id)));
});

test("B18: migrate() gives an older file a TAG, keeps a real one, and replaces anything else (schema 0.12)", () => {
  const old = subject();
  delete old.meta.id; old.meta.schemaVersion = "0.10";
  const m = Engine.migrate(old);
  assert.ok(Engine.isIntakeId(m.meta.id), "a file from before 0.11 got no TAG");
  assert.equal(m.meta.schemaVersion, "0.19");
  const kept = Engine.migrate(JSON.parse(JSON.stringify(m)));
  assert.equal(kept.meta.id, m.meta.id, "migrate() reissued a TAG a file already had");
  for (const junk of ["", "NCR-0000-0000-000O", "TAG-0000-0000-000O", "<i>x</i>", 42, null, "ncr-abcd-efgh-jkmn", "tag-abcd-efgh-jkmn"]) {
    const c = subject(); c.meta.id = junk;
    assert.ok(Engine.isIntakeId(Engine.migrate(c).meta.id), `migrate() trusted ${JSON.stringify(junk)} as a TAG`);
  }
});

test("Decision 133: a 0.11 NCR- number becomes a TAG with the same twelve characters, so it is still the same character", () => {
  // Players have 0.24.0 files carrying NCR- numbers. Reissuing them would make
  // a player's own older export look like a different character to the
  // replace guard, and a different one again on every import.
  const c = subject();
  c.meta.id = "NCR-7K2M-Q9XD-4HNB"; c.meta.schemaVersion = "0.11";
  const m = Engine.migrate(c);
  assert.equal(m.meta.id, "TAG-7K2M-Q9XD-4HNB");
  assert.equal(m.meta.schemaVersion, "0.19");
  assert.equal(Engine.migrate(JSON.parse(JSON.stringify(m))).meta.id, "TAG-7K2M-Q9XD-4HNB", "the carried-over TAG didn't hold");
});

test("W31: a held Ghost TAG names the TAG and says what it is; the number never moves", () => {
  const c = subject();
  const id = c.meta.id;
  assert.equal(Engine.tagReading(c), null, "a plain TAG reads as something else");
  c.advantages.push({ id: "ghost-tag-s", rank: 1 });
  const r = Engine.tagReading(c);
  assert.equal(r.label, "Ghost TAG");
  assert.match(r.text, /Black TAG/, "the street name isn't given (Ken: Black TAG is the Ghost TAG)");
  assert.equal(c.meta.id, id, "reading the TAG changed the stored number");
  c.advantages[0].rank = 0;
  assert.equal(Engine.tagReading(c), null, "a rank-0 entry still counts as held");
  for (const junk of [null, {}, { advantages: "x" }, { advantages: [null, 4, { id: "ghost-tag-s", rank: "x" }] }])
    assert.equal(Engine.tagReading(junk), null);
});

test("W41: a TAGless character's TAG reads Off grid, a Ghost TAG over it still wins, and the number never moves", () => {
  const c = subject(), id = c.meta.id;
  assert.equal(c.identity.tagless, false, "a new character isn't TAG'd");
  c.identity.tagless = true;
  const r = Engine.tagReading(c);
  same([r.label, r.tagless], [D.tag.tagless.label, true]);
  assert.match(r.text, /skrip/);
  // Decision 155: a TAGless number reads without its TAG- prefix.
  assert.equal(Engine.tagNumber(c), id.slice(4), "a TAGless number still reads TAG-");
  assert.ok(/^TAG-/.test(id) && !/^TAG-/.test(Engine.tagNumber(c)));
  c.advantages.push({ id: "ghost-tag-s", rank: 1 });
  assert.equal(Engine.tagNumber(c), id, "a Ghost TAG is a TAG: it keeps the prefix");
  const g = Engine.tagReading(c);
  assert.equal(g.label, "Ghost TAG", "a counterfeit is what a scanner reads");
  assert.ok(g.text.includes(D.tag.tagless.text) && /Black TAG/.test(g.text), "the tip doesn't say both");
  c.identity.tagless = false;
  assert.equal(Engine.tagReading(c).tagless, false);
  c.advantages = [];
  assert.equal(Engine.tagNumber(c), id, "a TAG'd number lost its prefix");
  same([Engine.tagNumber(null), Engine.tagNumber({ meta: { id: 7 } }), Engine.tagNumber({})], ["", "", ""]);
  assert.equal(c.meta.id, id, "reading the TAG changed the stored number");
});

test("W41: migrate() makes every older file TAG'd, and only a real true makes one TAGless (schema 0.14)", () => {
  const old = subject();
  delete old.identity.tagless; old.meta.schemaVersion = "0.13";
  const m = Engine.migrate(old);
  same([m.identity.tagless, m.meta.schemaVersion], [false, "0.19"]);
  for (const junk of ["true", 1, "yes", {}, null])
    assert.equal(Engine.migrate(Object.assign(subject(), { identity: { name: "x", tagless: junk } })).identity.tagless, false, `${JSON.stringify(junk)} made a TAGless character`);
  const t = subject(); t.identity.tagless = true;
  assert.equal(Engine.migrate(JSON.parse(JSON.stringify(t))).identity.tagless, true, "TAGless didn't survive a round trip");
});

// ── Rules a tap away (Decision 139) ───────────────────────────────────

test("a tag reads out its glossary sentence, a bracketed parameter and all (Decision 139)", () => {
  assert.equal(Engine.glossary("AP").id, "AP");
  const blast = Engine.glossary("Blast (10m)");
  assert.deepEqual([blast.id, blast.term], ["Blast", "Blast (10m)"], "a tag with a parameter found nothing");
  assert.equal(Engine.glossary("Withering (Undead / Demonic)").id, "Withering");
  assert.equal(Engine.glossary("Conceal").id, "Conceal", "a weapon feature isn't read");
  for (const nothing of ["Nonsense", "", null, undefined, 7]) assert.equal(Engine.glossary(nothing), null);
  // A spell's tag reads the spell glossary first, a weapon's the weapon one.
  const both = D.spellTagGlossary.find(s => D.weaponTagGlossary.some(w => w.id === s.id && w.description !== s.description));
  if (both) {
    assert.equal(Engine.glossary(both.id, "spell").text, both.description);
    assert.notEqual(Engine.glossary(both.id).text, both.description);
  }
});

test("every tag in the data reads out, bar the few no glossary defines (Decision 139)", () => {
  // The CRB names these without a glossary line; they show as plain words.
  // A new tag with no sentence fails here, so it gets one or joins the list.
  const BARE = ["2H", "Paired", "Agonized", "Vehicle Mount Required", "+4 DMG", "Condition (specify: Poison / Sedative / Paralytic)"];
  const tags = new Set();
  (function walk(v) {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    for (const [k, x] of Object.entries(v)) {
      if (["tags", "features", "grantsTags"].includes(k) && Array.isArray(x)) x.forEach(t => typeof t === "string" && tags.add(t));
      walk(x);
    }
  })({ weapons: D.weapons, equipment: D.equipment, mods: D.weaponModGlossary, spells: D.spells });
  const bare = [...tags].filter(t => !Engine.glossary(t)).sort();
  assert.deepEqual(bare, [...BARE].sort());
});

test("a flagged tag reads as something a player can use, not a note to us (F30–F31)", () => {
  for (const g of [...D.weaponTagGlossary, ...D.weaponFeatureGlossary, ...D.spellTagGlossary].filter(g => g.flagged)) {
    assert.ok(g.playerNote, `${g.id}: flagged with no playerNote`);
    assert.doesNotMatch(g.description, /flagNote|Undefined|CRB|Deighton|\bF\d+\b/, `${g.id}: the description is maintainer text`);
    assert.equal(Engine.glossary(g.id).note, g.playerNote);
  }
});

test("a stat's score reads as its range in the book, and past 10 says what changes (Decision 139)", () => {
  const ch = subject();
  const at = (id, v) => { ch.stats[id].base = v; return Engine.statReading(ch, id); };
  assert.equal(at("BOD", 2).range.max, 3);
  assert.deepEqual([at("BOD", 5).range.min, at("BOD", 5).range.max], [4, 6]);
  assert.deepEqual([at("BOD", 10).range.min, at("BOD", 10).beyond], [10, null]);
  const past = at("BOD", 12);
  assert.equal(past.range, null);
  assert.ok(past.beyond && past.health, "past 10, BOD says nothing about Health Levels");
  ch.stats.REF.base = 12;
  assert.equal(Engine.statReading(ch, "REF").health, null, "the Health Level line isn't BOD's alone");
  assert.equal(Engine.statReading(ch, "NOPE"), null);
});

test("Ammo is equipment: rounds by the mag, shells and arrowheads by the pack (AQ4 3)", () => {
  const ammo = D.equipment.filter(e => e.category === "ammo");
  assert.equal(ammo.length, 20, "the nine rounds and eleven arrowheads");
  assert.equal(D.ammunition, undefined);
  assert.equal(D.arrowheads, undefined);
  const ch = subject();
  ch.trackers.credits.current = 1000;
  const r = Engine.addLoadout(ch, "gear", "standard-broadhead", { buy: true });
  assert.deepEqual([r.ok, r.added, ch.gear[0].qty, ch.trackers.credits.current], [true, 12, 12, 950], "a dozen broadheads for 50Ç");
  Engine.addLoadout(ch, "gear", "shotgun-shells", { buy: true });
  assert.equal(ch.gear[1].qty, 10, "a box of ten shells");
  assert.equal(Engine.addLoadout(ch, "gear", "silver-rounds", { buy: true }).ok, false, "a price relative to the round has no street price");
  assert.deepEqual([...Engine.gearLine(ch, 0).tags], [], "a plain broadhead grew tags");
  Engine.addLoadout(ch, "gear", "barbed-tip");
  assert.deepEqual([...Engine.gearLine(ch, 2).tags], ["Bleeding"]);
});

// ── The stat buy (Decision 150) ───────────────────────────────────────

test("Decision 150: the Stat Point pool is flat unless the GM has players roll, and a roll must fit its die", () => {
  const ch = Engine.newCharacter();
  ch.creation.powerLevel = "heroic";
  assert.equal(ch.creation.statMethod, "flat", "a new character isn't on the flat pool");
  assert.equal(Engine.statPool(ch).total, 50);
  ch.creation.rolls.statPoints = 9;
  assert.equal(Engine.statPool(ch).total, 50, "a flat pool read the roll");

  ch.creation.statMethod = "rolled";
  assert.equal(Engine.statPool(ch).total, 45 + 9);
  ch.creation.rolls.statPoints = null;
  assert.ok(Engine.validate("stats", ch).some(i => i.level === "error" && /1d10 Stat Point roll/.test(i.msg)), "no roll asked for");
  for (const bad of [0, 11]) {
    ch.creation.rolls.statPoints = bad;
    assert.ok(Engine.validate("stats", ch).some(i => i.level === "error" && /1 to 10/.test(i.msg)), `a ${bad} on 1d10 passed`);
  }
});

test("Decision 150: the climbing cost is what overspends, and the + stops where the next point costs more than is left", () => {
  const ch = Engine.newCharacter();
  ch.creation.powerLevel = "street";                                  // 45
  const set = o => { for (const [k, v] of Object.entries(o)) ch.stats[k].base = v; };
  set({ BOD: 6, REF: 10, MOB: 10, INT: 8, TECH: 2, COOL: 2, MAG: 2, EMP: 2 });  // 5+13+13+9+4 = 44
  assert.equal(Engine.statSpent(ch), 44);
  assert.equal(Engine.nextStatCost(ch, "BOD"), 2);
  assert.equal(Engine.nextStatCost(ch, "TECH"), 1);
  assert.ok(Engine.validate("stats", ch).some(i => i.level === "warn" && /1 Stat Points unspent/.test(i.msg)));
  ch.stats.BOD.base = 7;                                               // 1:1 would read 45 of 45
  assert.ok(Engine.validate("stats", ch).some(i => i.level === "error" && /overspent by 1/.test(i.msg)), "a 7 cost 1");
});

test("Decision 150: Skill Points count INT and REF with the archetype's bonus and a CP Boost, and a later Boost leaves points to spend", () => {
  const ch = subject();
  ch.stats.INT.base = 5; ch.stats.REF.base = 5;
  const base = Engine.skillPool(ch).total;
  ch.archetypeChoices.statBonusAllocation.INT = 1;
  assert.equal(Engine.skillPool(ch).total, base + 1, "the archetype's bonus didn't count");
  ch.skills.stealth = { rank: Engine.skillPool(ch).total, ipe: 0 };   // every point spent
  assert.equal(Engine.validate("skills", ch).some(i => /unspent/.test(i.msg)), false);
  ch.creation.boosts.push({ targetType: "stat", targetId: "REF", times: 1 });
  assert.equal(Engine.skillPool(ch).total, base + 2, "a Boost to REF didn't raise Skill Points");
  assert.ok(Engine.validate("skills", ch).some(i => i.level === "warn" && /1 Skill Points unspent/.test(i.msg)),
    "the Skills step doesn't say the Boost left a point to spend");
});

test("Decision 150: an absurd stat score can't make the cost loop, and costs a number", () => {
  for (const v of [1e12, -5, NaN, "x"]) assert.equal(typeof Engine.statCost(v), "number");
  assert.equal(Engine.statCost(12), 13 + 2 * 2, "past 10 each point costs the table's last price");
});

test("schema 0.15: an older file keeps rolling if it rolled, and a locked one is marked built under the earlier table", () => {
  const old = (locked, roll) => {
    const c = Engine.newCharacter();
    c.meta.schemaVersion = "0.14";
    delete c.creation.statMethod;
    c.creation.rolls = { statPoints: roll, skillPoints: 20, credits: 5 };
    c.creation.locked = locked;
    return c;
  };
  const a = Engine.migrate(old(true, 15));
  assert.equal(a.creation.statMethod, "rolled");
  assert.equal(a.creation.earlierTable, true);
  assert.equal(a.meta.schemaVersion, "0.19");
  const b = Engine.migrate(old(false, null));
  assert.equal(b.creation.statMethod, "flat");
  assert.equal("earlierTable" in b.creation, false, "a draft was marked as built under the earlier table");
  const c = Engine.migrate(old(false, 15));
  assert.equal(c.creation.statMethod, "rolled");
  assert.equal("earlierTable" in c.creation, false);

  // A current file is left as it is, and only real values survive.
  const d = Engine.newCharacter();
  d.creation.statMethod = "rolled"; d.creation.locked = true;
  assert.equal("earlierTable" in Engine.migrate(d).creation, false, "a 0.15 lock was marked earlier");
  const e = Engine.newCharacter();
  e.creation.statMethod = "<img>"; e.creation.earlierTable = "yes";
  const m = Engine.migrate(e);
  assert.equal(m.creation.statMethod, "flat");
  assert.equal("earlierTable" in m.creation, false);
});

// ── A write-in archetype (Decision 153) ──────────────────────────────
// The custom archetype has no content of its own: the character writes it.
const WRITE_IN = D.archetypes.find(a => a.writeIn);
function writtenIn({ cls = "mortal", mechanics = [] } = {}) {
  const ch = subject();
  ch.identity.archetype = WRITE_IN.id;
  Object.assign(ch.archetypeChoices.writeIn, { name: "Changeling", classification: cls, mechanics });
  return ch;
}

test("a write-in archetype's classification is the character's pick, and gates Advantages like any other", () => {
  assert.ok(WRITE_IN, "no archetype declares writeIn");
  const ch = writtenIn({ cls: null });
  assert.equal(Engine.classification(ch), null);
  assert.equal(Engine.canBuyAdvantage(ch, "ambidextrous"), true, "no pick yet gates nothing");
  ch.archetypeChoices.writeIn.classification = "supernatural";
  assert.equal(Engine.canBuyAdvantage(ch, "ambidextrous"), false);
  assert.equal(Engine.canBuyAdvantage(ch, "lucky"), true);
  ch.archetypeChoices.writeIn.classification = "other";
  assert.equal(Engine.canBuyAdvantage(ch, "ambidextrous"), true, "Other buys every Advantage");
  // A built-in archetype ignores a writeIn it happens to carry.
  ch.identity.archetype = "werewolf";
  assert.equal(Engine.classification(ch).id, "supernatural");
});

test("a panel with `when` shows only while its mechanic is ticked; no other archetype changes", () => {
  const ids = ch => Engine.archPanels(ch).map(p => p.id);
  const ch = writtenIn();
  same(ids(ch), ["powers"]);
  ch.archetypeChoices.writeIn.mechanics = ["sfr"];
  same(ids(ch), ["sfr", "powers"]);
  ch.archetypeChoices.writeIn.mechanics = ["magic", "sfr", "flight"];
  same(ids(ch), ["tol-spent", "sfr", "powers"], "an unknown mechanic turns nothing on");
  const opts = Engine.writeInOptions(ch);
  same(opts.mechanics.map(m => [m.id, m.on]), [["magic", true], ["sfr", true]]);
  same(opts.powerUses, WRITE_IN.writeIn.powerUses);
  for (const a of D.archetypes.filter(x => !x.writeIn)) {
    const b = subject(); b.identity.archetype = a.id;
    b.archetypeChoices.writeIn.mechanics = ["magic", "sfr"];
    // A panel with `origin` is one specialization's (Decision 200), tested with it.
    same(ids(b), a.coreMechanic.panels.filter(p => !p.origin).map(p => p.id), `${a.id}'s panels moved`);
    assert.equal(Engine.writeInOptions(b), null);
  }
});

test("archetypeContent reads the data for a built-in archetype and the character's words for a write-in one", () => {
  const b = subject();
  const built = Engine.archetypeContent(b), arc = D.archetypes.find(a => a.id === "arcanist");
  same([built.writeIn, built.name, built.description, built.classification.id], [false, arc.name, arc.summary, "mortal"]);
  assert.equal(built.traits, arc.baselineTraits);

  const ch = writtenIn({ cls: "other" });
  const w = ch.archetypeChoices.writeIn;
  w.classificationText = "  Magical being ";
  w.description = "Stolen as a child.";
  w.traits = [{ name: "Glamour", description: "Looks like whoever you expect." }, "junk"];
  w.vulnerabilities = [{ name: "Cold iron", description: 7 }];
  ch.powers = [{ id: "pw-1", custom: true, name: "Fade", uses: "SFR", effect: "Unseen for a round.", notes: "" }];
  const c = Engine.archetypeContent(ch);
  same([c.writeIn, c.name, c.description, c.classification], [true, "Changeling", "Stolen as a child.", { id: "other", name: "Other", text: "Magical being" }]);
  same(c.traits, [{ name: "Glamour", description: "Looks like whoever you expect." }]);
  same(c.vulnerabilities, [{ name: "Cold iron", description: "" }], "a field that isn't text reads as empty");
  same(c.powers.map(p => p.name), ["Fade"]);
  w.name = "   "; w.description = ""; w.classification = "mortal";
  const d = Engine.archetypeContent(ch);
  same([d.name, d.description, d.classification.text], [WRITE_IN.name, null, ""], "no name falls back; Mortal takes no words");
  assert.equal(Engine.archetypeContent(Engine.newCharacter()), null);
});

test("validate: a write-in archetype needs a name and a classification; Other's words and the GM's call only warn", () => {
  const issues = (ch, step = "archetype") => Engine.validate(step, ch).map(i => `${i.level}: ${i.msg}`);
  const ch = writtenIn({ cls: null });
  ch.archetypeChoices.writeIn.name = "";
  const e = issues(ch).filter(x => x.startsWith("error"));
  assert.equal(e.length, 2, e.join(" | "));
  ch.archetypeChoices.writeIn.name = "Changeling";
  ch.archetypeChoices.writeIn.classification = "a-made-up-id";
  assert.ok(issues(ch).some(x => /error: Choose a classification/.test(x)), "an unknown classification passed");
  ch.archetypeChoices.writeIn.classification = "other";
  same(issues(ch).map(x => x.split(":")[0]), ["warn"], "Other with no words of its own warns, never blocks");
  ch.archetypeChoices.writeIn.classificationText = "Fae";
  same(issues(ch), []);
  const copy = D.appCopy.archetypeWrittenIn.replace("{name}", "Changeling");
  assert.ok(issues(ch, "review").includes(`warn: ${copy}`), "review doesn't say a write-in is the GM's call");
  assert.ok(!issues(subject(), "review").includes(`warn: ${copy}`));
});

test("addPower in play costs a new power's price, Admin's is free, and the spend is a journal entry one undo takes back with it", () => {
  const ch = writtenIn();
  const NEW = D.ip.powerIncreaseCost.newPower;
  ch.progression.ip.earned = NEW - 1;
  const refusedHere = input => { const n = JSON.stringify(ch); const r = Engine.addPower(ch, input); assert.equal(JSON.stringify(ch), n, `refused but wrote: ${r.why}`); return r; };
  assert.match(refusedHere({ name: "Fade" }).why || "", /Not enough IP/, "a power was added in play short of its price (Decision 194)");
  assert.equal(refusedHere({ name: "Fade", cost: "0" }).ok, false, "a typed cost of 0 bought a power in play");
  ch.progression.ip.earned = NEW + 5;
  const free = Engine.addPower(ch, { name: " Fade ", uses: "SFR", effect: "Unseen for a round." }, { free: true });
  assert.ok(free.ok && /^pw-/.test(free.id), JSON.stringify(free));
  same([ch.powers[0].name, ch.powers[0].custom, ch.progression.ip.log.length], ["Fade", true, 0], "a free power touched IP");

  const before = JSON.parse(JSON.stringify(ch));
  const bought = Engine.addPower(ch, { name: "Thorn hedge", cost: "15", note: "after the raid" });
  assert.ok(bought.ok);
  Engine.recordAction(ch, "power", "Power: Thorn hedge", before);
  const spend = ch.progression.ip.log[0];
  same([spend.kind, spend.amount, spend.targetType, spend.targetId, spend.name, spend.note], ["spend", NEW, "power", bought.id, "Thorn hedge", "after the raid"], "a typed cost set the price in play");
  same([Engine.ipState(ch).available, Engine.versionCheck(ch).filter(x => /power/.test(x))], [5, []]);
  assert.ok(Engine.undoLastAction(ch).ok);
  same([ch.powers.length, ch.progression.ip.log.length, Engine.ipState(ch).available], [1, 0, NEW + 5], "one undo took back both");

  const refused = input => { const n = JSON.stringify(ch); const r = Engine.addPower(ch, input, { free: true }); assert.equal(JSON.stringify(ch), n, `refused but wrote: ${r.why}`); return r.ok; };
  assert.equal(refused({ name: "Too dear", cost: NEW + 6 }), false, "Admin's typed cost, short of IP");
  assert.equal(refused({ name: "Odd", cost: "1.5" }), false);
  assert.equal(refused({ name: "Odd", cost: -3 }), false);
  assert.equal(refused({ name: "  " }), false, "no name");
  assert.equal(refused("junk"), false);
  const built = subject();
  assert.equal(Engine.addPower(built, { name: "Fade" }, { free: true }).ok, false, "an archetype with no powers panel took a power");
  assert.ok(Engine.addPower(ch, { name: "Free again", cost: "" }, { free: true }).ok, "Admin's blank cost isn't free");
});

test("improvePower rewrites a power's name, uses and effect for IP, as one undoable change (Decision 154)", () => {
  const ch = writtenIn();
  ch.progression.ip.earned = 20;
  const { id } = Engine.addPower(ch, { name: "Fade", uses: "SFR", effect: "Unseen for a round.", notes: "mine" }, { free: true });
  const refused = (input, why) => { const n = JSON.stringify(ch); const r = Engine.improvePower(ch, id, input); assert.equal(JSON.stringify(ch), n, `refused but wrote: ${r.why}`); assert.match(r.why || "", why); };
  const better = { name: "Fade", uses: "SFR", effect: "Unseen for two rounds." };
  refused(better, /costs IP/);
  refused({ ...better, cost: 0 }, /at least 1/);
  refused({ ...better, cost: 21 }, /Not enough IP/);
  refused({ name: "Fade", uses: "SFR", effect: "Unseen for a round.", cost: 5 }, /Nothing/);
  refused({ ...better, name: " ", cost: 5 }, /name/);
  assert.equal(Engine.improvePower(ch, "pw-nothere", { ...better, cost: 5 }).ok, false);
  assert.equal(Engine.improvePower(subject(), id, { ...better, cost: 5 }).ok, false, "an archetype with no powers panel improved a power");

  const before = JSON.parse(JSON.stringify(ch));
  const r = Engine.improvePower(ch, id, { ...better, cost: "8", note: "trained with the coven" });
  assert.ok(r.ok, r.why);
  Engine.recordAction(ch, "power", "Improved Fade", before);
  same([ch.powers[0].effect, ch.powers[0].notes, ch.powers[0].id], ["Unseen for two rounds.", "mine", id], "notes or id moved");
  const spend = ch.progression.ip.log[0];
  same([spend.amount, spend.targetType, spend.targetId, spend.note], [8, "power", id, "trained with the coven"]);
  same(Engine.versionCheck(ch).filter(x => /power/i.test(x)), [], "a second spend on one power looks like a hand edit");
  assert.ok(Engine.undoLastAction(ch).ok);
  same([ch.powers[0].effect, ch.progression.ip.log.length], ["Unseen for a round.", 0], "one undo didn't take back both");
});

// ── Powers with ranks (W71, Decision 194) ───────────────────────────
function arcanist() {
  const ch = subject();
  ch.identity.archetype = "arcanist";
  ch.progression.ip.earned = 1000;
  return ch;
}
const rankOf = (ch, id) => Engine.powerRanks(ch).find(p => p.id === id);

test("a Discipline is raised with IP at rank × 20, one never trained is learned at 40, and IPE's 10 stops it (Decision 194)", () => {
  const ch = arcanist(), P = D.ip.powerIncreaseCost;
  const evo = rankOf(ch, "evocation");
  assert.ok(evo && evo.kind === "discipline", "Evocation isn't a power the Arcanist can raise");
  same(Engine.ipCost(ch, "power", "evocation"), { ok: true, cost: P.perRank * evo.rank, from: evo.rank, to: evo.rank + 1, name: "Evocation" });
  same(Engine.ipCost(ch, "power", "alchemy").cost, P.newPower, "Alchemy at rank 0 isn't a new power's price");
  assert.equal(Engine.ipCost(ch, "power", "telekinesis").ok, false, "a power the character doesn't hold was priced");

  const attack = Engine.spellAttack(ch).value, before = JSON.parse(JSON.stringify(ch));
  assert.ok(Engine.spendIP(ch, "power", "evocation").ok);
  Engine.recordAction(ch, "ip", "IP: Evocation", before);
  const d = Engine.disciplineRanks(ch).find(x => x.id === "evocation");
  same([d.rank, d.ipe, d.start], [evo.rank + 1, 1, evo.rank], "the raise didn't land on IPE alone");
  assert.equal(Engine.spellAttack(ch).value, attack + 1, "Spell Attack didn't read the raised rank");
  const e = ch.progression.ip.log.at(-1);
  same([e.targetType, e.targetId, e.name, e.from, e.to, e.amount], ["power", "evocation", "Evocation", evo.rank, evo.rank + 1, P.perRank * evo.rank]);
  same(Engine.versionCheck(ch).filter(x => /Evocation|power/.test(x)), []);
  ch.progression.powerIpe.evocation = 2;
  assert.match(Engine.versionCheck(ch).join(" "), /1 rank bought for Evocation but it holds 2/, "a hand-edited rank passed versionCheck");
  ch.progression.powerIpe.evocation = 1;
  assert.ok(Engine.undoLastAction(ch).ok);
  same([rankOf(ch, "evocation").rank, ch.progression.ip.log.length], [evo.rank, 0], "one undo didn't take back the rank and its spend");

  // Max Power Rank caps creation only (Ken, 2026-10-08): IP past it is no error.
  ch.progression.powerIpe.evocation = Engine.disciplineCap(ch) + 1;
  same(Engine.validate("character-points", ch).filter(i => /Evocation/.test(i.msg)), [], "an IP rank tripped the creation cap");
  ch.archetypeChoices.disciplines.evocation = Engine.disciplineCap(ch);    // bought past it at creation
  assert.ok(Engine.validate("character-points", ch).some(i => /Evocation is rank .* start at/.test(i.msg)), "the creation cap stopped checking");
  ch.archetypeChoices.disciplines.evocation = 0;
  ch.progression.powerIpe.evocation = D.ip.rankCap - evo.rank;
  assert.match(Engine.ipCost(ch, "power", "evocation").why || "", /Rank cap 10/, "a power went past IPE's 10");
});

test("a written power is rank 1, rises at rank × 20, and its ranks go when it does (Decision 194)", () => {
  const ch = writtenIn();
  ch.progression.ip.earned = 100;
  const { id } = Engine.addPower(ch, { name: "Fade" }, { free: true });
  same([rankOf(ch, id).rank, rankOf(ch, id).kind, Engine.ipCost(ch, "power", id).cost], [1, "written", D.ip.powerIncreaseCost.perRank]);
  assert.ok(Engine.spendIP(ch, "power", id).ok);
  assert.ok(Engine.spendIP(ch, "power", id).ok);
  same([rankOf(ch, id).rank, Engine.ipState(ch).available], [3, 100 - 20 - 40]);
  assert.ok(Engine.removePower(ch, id).ok);
  same([ch.progression.powerIpe[id], Engine.powerRanks(ch).length], [undefined, 0], "a removed power's ranks stayed behind");
  assert.match(Engine.versionCheck(ch).join(" "), /Fade, but that power isn't on the sheet/);
  const pro = subject(); pro.identity.archetype = "professional";
  same(Engine.powerRanks(pro), [], "a Professional has a power to raise");
});

test("migrate() gives a file from before 0.18 no power ranks, and an undo can't make one read as anything but a count", () => {
  const old = JSON.parse(JSON.stringify(arcanist()));
  delete old.progression.powerIpe; old.meta.schemaVersion = "0.17";
  same(Engine.migrate(old).progression.powerIpe, {});
  const ch = arcanist();
  ch.progression.powerIpe = { evocation: "lots" };            // what a crafted undo could restore
  assert.equal(rankOf(ch, "evocation").ipe, 0);
  ch.progression.powerIpe = ["evocation"];
  assert.equal(rankOf(ch, "evocation").ipe, 0);
});

test("versionCheck matches a power's spend to its row, and says when the power is gone", () => {
  const ch = writtenIn();
  ch.progression.ip.earned = D.ip.powerIncreaseCost.newPower + 20;
  const r = Engine.addPower(ch, { name: "Thorn hedge" });
  same(Engine.versionCheck(ch).filter(x => /power/i.test(x)), []);
  assert.ok(Engine.removePower(ch, r.id).ok);
  assert.equal(Engine.removePower(ch, r.id).ok, false);
  const issues = Engine.versionCheck(ch).filter(x => /power/i.test(x));
  assert.equal(issues.length, 1);
  assert.match(issues[0], /Thorn hedge/);
  assert.equal(Engine.ipState(ch).available, 20, "IP spent on a removed power stays spent");
});

// ── The Werewolf to 0414 (crb-v4-sync P3, Decisions 195–197) ─────────
function werewolf(origin, { base = 6 } = {}) {
  const ch = subject({ base, bod: base });
  ch.identity.archetype = "werewolf";
  ch.archetypeChoices.specialization = origin ? [origin] : [];
  ch.progression.ip.earned = 1000;
  return ch;
}
const WWD = () => D.archetypes.find(a => a.id === "werewolf");

test("a Werewolf of each Origin holds the Innate five and only its Origin's powers, at rank 1, and raises them at rank × 20 past the book's 3 (Decision 196)", () => {
  const innate = WWD().powers.filter(p => !p.origin).map(p => p.id);
  assert.equal(innate.length, 5);
  for (const o of WWD().specialization.options) {
    const ch = werewolf(o.id), own = WWD().powers.filter(p => p.origin === o.id).map(p => p.id);
    assert.equal(own.length, 6, `${o.name} has ${own.length} powers`);
    same(Engine.powerRanks(ch).map(p => `${p.id}:${p.kind}:${p.rank}`), [...innate, ...own].map(id => `${id}:archetype:1`), `${o.name} doesn't hold the kit at rank 1`);
    same(Engine.archetypeContent(ch).powers.map(p => p.id), [...innate, ...own], `${o.name}'s Character tab lists other powers`);
  }
  same(Engine.powerRanks(werewolf(null)).map(p => p.id), innate, "a Werewolf with no Origin yet holds an Origin's powers");

  const ch = werewolf("trueborn"), P = D.ip.powerIncreaseCost;
  for (const r of [1, 2, 3]) {
    const c = Engine.ipCost(ch, "power", "apex-fury");
    same([c.from, c.to, c.cost], [r, r + 1, P.perRank * r]);
    assert.ok(Engine.spendIP(ch, "power", "apex-fury").ok);
  }
  same([rankOf(ch, "apex-fury").rank, rankOf(ch, "apex-fury").maxRank, ch.progression.powerIpe["apex-fury"]], [4, 3, 3],
    "VQ14: the book's max 3 binds creation only, so IP takes a power past it");
  same(Engine.versionCheck(ch).filter(x => /power/i.test(x)), []);
  ch.progression.powerIpe["apex-fury"] = D.ip.rankCap - 1;
  assert.match(Engine.ipCost(ch, "power", "apex-fury").why || "", /Rank cap 10/, "play doesn't stop at IPE's 10");

  // An Origin's power is its own: a Wildblood can't raise a Trueborn's.
  assert.equal(Engine.ipCost(werewolf("wildblood"), "power", "apex-fury").ok, false);
});

test("the Werewolf's vulnerabilities: EMP is the Forge Fang's alone, and Resilient Spirit is gone (VQ10, Decision 196)", () => {
  same(Engine.archetypeContent(werewolf("trueborn")).vulnerabilities.map(v => v.id), ["silver", "feral-mind", "call-of-the-wild"]);
  same(Engine.archetypeContent(werewolf("forge-fang")).vulnerabilities.map(v => v.id), ["silver", "feral-mind", "call-of-the-wild", "emp"]);
  const tb = werewolf("trueborn");
  same([Engine.naturalArmor(tb).conditional.length, Engine.naturalArmor(tb).total], [0, 0], "a Trueborn still has a moon's Natural Armor");
  for (const o of WWD().specialization.options) for (const k of ["transformation", "additionalPowers", "grants"])
    assert.equal(o[k], undefined, `${o.name} still carries ${k}`);
});

test("Werewolf form lifts REF, MOB and BOD in skills, Health and weapon damage, but not WILL, TOL, prices or caps (Decision 195)", () => {
  const ch = werewolf("trueborn", { base: 8 });
  const hp0 = Engine.health(ch), der0 = Engine.derived(ch), melee0 = Engine.skillLine(ch, "melee").checkBonus;
  const ip0 = Engine.ipCost(ch, "stat", "BOD").cost, tech = D.skills.find(s => s.primaryStat === "TECH").id;
  assert.equal(Engine.formState(ch), null, "a Werewolf starts shifted");
  assert.equal(Engine.skillLine(ch, tech).barred, null);
  assert.ok(Engine.setToggle(ch, "form", "Werewolf").ok);
  const t = Engine.statTable(ch);
  same([t.BOD.value, t.REF.value, t.MOB.value, t.INT.value, t.BOD.form], [12, 10, 10, 8, 4]);
  same(Engine.baseStatTable(ch).BOD.value, 8, "the stored BOD moved");
  same(Engine.statValue(ch, "BOD"), 8);
  const hp = Engine.health(ch);
  same([hp0.levels, hp0.hpPer, hp.levels, hp.hpPer], [8, 5, 10, 7], "Health Levels don't read the shifted BOD");
  same(Engine.derived(ch), der0, "WILL or TOL moved with the shift");
  assert.equal(Engine.ipCost(ch, "stat", "BOD").cost, ip0, "shifting changed what IP costs");
  assert.equal(Engine.skillLine(ch, "melee").checkBonus, melee0 + 2, "Melee doesn't read the shifted REF");
  assert.equal(Engine.skillLine(ch, tech).barred, "Feral Mind", "a TECH skill isn't barred while shifted");
  const w = Engine.formView(ch).weapons;
  same(w.map(x => [x.name, x.damage, x.damageFormula, x.attack]), [["Claws", 20, "BOD+8", melee0 + 2], ["Fangs", 22, "BOD+10", melee0 + 2]]);
  assert.equal(Engine.statReading(ch, "BOD").value, 12, "the stat tip reads the stored value while shifted");
  assert.ok(Engine.setToggle(ch, "form", "Human").ok);
  same([Engine.statTable(ch).BOD.value, Engine.formView(ch)], [8, null]);
  same([ch.trackers.damage, ch.trackers.witheringDamage], [0, 0], "a Trueborn's shift cost Health");
  assert.equal(Engine.setToggle(ch, "form", "Wolfish").ok, false);
  assert.equal(Engine.setToggle(subject(), "form", "Werewolf").ok, false, "an Arcanist shifted");
});

test("a Forge Fang's shift spends 1 HL of the form it enters, as Withering, one Undo takes it back, and half its HL in Withering ends the form (Decision 195)", () => {
  const ch = werewolf("forge-fang", { base: 8 });
  const view = Engine.toggleView(ch, Engine.archPanels(ch).find(p => p.id === "form"));
  same(view.map(o => [o.name, o.on, o.cost && o.cost.hp]), [["Human", true, null], ["Werewolf", false, 7]], "the shift's price isn't the shifted HL");
  const before = JSON.parse(JSON.stringify(ch));
  same(Engine.setToggle(ch, "form", "Werewolf").cost, { hl: 1, hp: 7, withering: true, category: "Withering" });
  Engine.recordAction(ch, "loadout", "Form: Werewolf", before);
  same([ch.trackers.damage, ch.trackers.witheringDamage, Engine.hlState(ch).emptied], [7, 7, 1], "1 HL isn't one Health Level gone");
  same(Engine.setToggle(ch, "form", "Werewolf").cost, null, "pressing the form you're in cost again");
  same(Engine.setToggle(ch, "form", "Human").cost, null, "shifting back cost Health");
  ch.panelData.form = "Werewolf";
  assert.ok(Engine.undoLastAction(ch).ok);
  same([ch.trackers.damage, ch.trackers.witheringDamage, ch.panelData.form || null], [0, 0, null], "one Undo didn't take back the shift and its cost");

  Engine.setToggle(ch, "form", "Werewolf");
  assert.equal(Engine.formView(ch).ended, false);
  ch.trackers.witheringDamage = ch.trackers.damage = Engine.health(ch).total / 2;
  assert.equal(Engine.formView(ch).ended, true, "half the HL in Withering didn't end the form");
  ch.trackers.witheringDamage = 0;
  assert.equal(Engine.formView(ch).ended, false, "ordinary damage ended the form");
});

test("Call of the Wild counts withdrawal steps 0 to 3 in the Origin's own words, and stops at 3 (Decision 196)", () => {
  for (const o of WWD().specialization.options) {
    const ch = werewolf(o.id), p = Engine.archPanels(ch).find(x => x.id === "call-of-the-wild");
    same([Engine.panelTracker(ch, p).need, Engine.panelTracker(ch, p).step], [o.withdrawal.need, ""]);
    for (const n of [1, 2, 3]) {
      assert.ok(Engine.adjustPanelTracker(ch, p.id, 1).ok);
      same([Engine.panelTracker(ch, p).count, Engine.panelTracker(ch, p).step], [n, o.withdrawal.steps[n - 1]], `${o.name} step ${n}`);
    }
    Engine.adjustPanelTracker(ch, p.id, 5);
    assert.equal(Engine.panelTracker(ch, p).count, 3, "withdrawal went past its last step");
    Engine.adjustPanelTracker(ch, p.id, -3);
    assert.equal(Engine.panelTracker(ch, p).count, 0, "meeting the Need doesn't reset it");
  }
  // A tracker with no steps still counts past its max, as before.
  const arc = subject(), tol = Engine.archPanels(arc).find(x => x.type === "tracker" && typeof x.max !== "number" || x.max === "TOL");
  if (tol) { Engine.adjustPanelTracker(arc, tol.id, 99); assert.equal(Engine.panelTracker(arc, tol).count, 99); }
});

test("a saved Werewolf's Stat Bonus becomes its Focus Stat bonus: a locked one keeps every stat, a draft gets back a point off its Focus Stats (Decision 197)", () => {
  const old = werewolf("trueborn");
  old.archetypeChoices.rolls = { statBonus: 3 };
  old.archetypeChoices.statBonusAllocation = { BOD: 2, COOL: 1 };
  const stats = Engine.statTable(old);
  const locked = Engine.migrate(JSON.parse(JSON.stringify(old)));
  same([locked.archetypeChoices.rolls, locked.archetypeChoices.focusAllocation, locked.archetypeChoices.statBonusAllocation],
       [{ focusStatBonus: 3 }, { BOD: 2, COOL: 1 }, {}]);
  same(Engine.statTable(locked), stats, "a locked Werewolf's stats moved");
  same(Engine.migrate(JSON.parse(JSON.stringify(locked))).archetypeChoices, locked.archetypeChoices, "migrate() isn't idempotent");

  old.creation.locked = false;
  const draft = Engine.migrate(JSON.parse(JSON.stringify(old)));
  same(draft.archetypeChoices.focusAllocation, { BOD: 2 });
  assert.ok(Engine.validate("archetype", draft).some(i => /1 Focus Stat bonus points? unallocated/.test(i.msg)), "the draft isn't told its point is back");
  // The rule is the scaling row's, not the Werewolf's: an archetype whose row
  // rolls no Focus Stat bonus keeps what it has.
  const pro = subject(); pro.identity.archetype = "professional";
  pro.archetypeChoices.rolls = { statBonus: 2 }; pro.archetypeChoices.statBonusAllocation = { INT: 2 };
  same(Engine.migrate(JSON.parse(JSON.stringify(pro))).archetypeChoices.statBonusAllocation, { INT: 2 });
});

test("schema 0.16: an older file gets an empty write-in, and a file's own is kept only as text", () => {
  const old = Engine.newCharacter();
  old.meta.schemaVersion = "0.15";
  delete old.archetypeChoices.writeIn; delete old.powers;
  const m = Engine.migrate(old);
  same(m.archetypeChoices.writeIn, Engine.newCharacter().archetypeChoices.writeIn);
  same(m.powers, []);

  const h = Engine.newCharacter();
  h.archetypeChoices.writeIn = { name: 7, description: { a: 1 }, classification: ["mortal"], classificationText: null,
    mechanics: ["sfr", 3, "sfr", null], traits: [{ name: "Glamour", description: "x", extra: "<b>" }, null, "t"],
    vulnerabilities: "iron", stray: "dropped" };
  h.powers = [{ name: "A" }, { id: "pw-x", name: "B" }, { id: "pw-x", name: "C", effect: 4 }, null, "D", [1]];
  const w = Engine.migrate(h);
  same(w.archetypeChoices.writeIn, { name: "", description: null, classification: null, classificationText: "",
    mechanics: ["sfr"], traits: [{ name: "Glamour", description: "x" }], vulnerabilities: [] });
  same(w.powers.map(p => [p.name, p.effect, p.custom]), [["A", "", true], ["B", "", true], ["C", "", true]]);
  const ids = w.powers.map(p => p.id);
  assert.equal(new Set(ids).size, 3, `power ids collide: ${ids}`);
  assert.equal(ids[1], "pw-x", "the first holder of an id keeps it");
  assert.ok(ids.every(id => /^pw-/.test(id)));
  same(Engine.migrate(JSON.parse(JSON.stringify(w))), w, "migrate() isn't stable on its own output");
});

test("newPower gives the wizard a blank row; a nameless row with words warns, an empty one doesn't", () => {
  const ch = writtenIn();
  const r = Engine.newPower(ch);
  assert.ok(r.ok && ch.powers.length === 1 && ch.powers[0].name === "");
  assert.equal(Engine.newPower(subject()).ok, false, "an archetype with no powers panel");
  const warns = () => Engine.validate("archetype", ch).filter(i => /no name/.test(i.msg)).map(i => i.level);
  same(warns(), [], "an empty row is just unused");
  ch.powers[0].effect = "Unseen for a round.";
  ch.archetypeChoices.writeIn.traits = [{ name: "", description: "Glamour" }, { name: "", description: "Thorns" }];
  same(warns(), ["warn", "warn"]);
  assert.ok(Engine.validate("archetype", ch).some(i => i.msg.startsWith("2 traits")));
});

test("Decision 162: points left only warn on their step, block the lock while they can buy, and never trap a player whose last point fits nowhere", () => {
  const at = (ch, step) => Engine.validate(step, ch).filter(i => /Skill Points unspent|Stat Points unspent/.test(i.msg)).map(i => `${i.level}: ${i.msg}`);
  const ch = subject(); ch.creation.locked = false; ch.skills = {};
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = D.statRules.base;
  const stats = Engine.statPool(ch).total - Engine.statSpent(ch), skills = Engine.skillPool(ch).total;
  assert.ok(stats > 0 && skills > 0, "the subject has no points left to test with");
  same(at(ch, "skills"), [`warn: ${skills} Skill Points unspent.`], "the Skills step blocked Continue on points left");
  same(at(ch, "stats"), [`warn: ${stats} Stat Points unspent.`], "the Stats step blocked Continue on points left");
  const review = at(ch, "review");
  assert.ok(review.includes(`error: ${skills} Skill Points unspent. Spend them before you lock.`), review.join(" | "));
  assert.ok(review.includes(`error: ${stats} Stat Points unspent. Spend them before you lock.`), review.join(" | "));

  // Nothing they can buy: every stat's next point costs more than is left, and every skill sits at its cap.
  const rc = D.statRules.raiseCost, pl = D.powerLevels.find(p => p.id === ch.creation.powerLevel), cap = pl.maxSkillRank;
  try {
    D.statRules.raiseCost = Object.fromEntries(Object.keys(rc).map(k => [k, 999]));
    pl.maxSkillRank = 0;
    assert.equal(Engine.spendable(ch, "stats"), false);
    assert.equal(Engine.spendable(ch, "skills"), false);
    same(at(ch, "review").map(x => x.split(":")[0]), ["warn", "warn"], "a point that can buy nothing blocked the lock");
    assert.ok(at(ch, "review").every(x => /and nothing left they can buy\.$/.test(x)));
  } finally { D.statRules.raiseCost = rc; pl.maxSkillRank = cap; }
  assert.equal(Engine.spendable(ch, "nonsense"), false);
});

// ── CRANK reputation (Decision 169) ───────────────────────────────────
test("CRANK: a new character has rep 0, and a rep and its ledger survive a migrate round trip", () => {
  const ch = Engine.newCharacter();
  assert.deepEqual(JSON.parse(JSON.stringify(ch.trackers.crank)), { rep: 0, ledger: [] });
  assert.equal(Object.keys(ch.trackers.crank).includes("tier"), false, "the tier is derived, never stored");
  Engine.addCrankRep(ch, 7, "a long week");
  const back = Engine.migrate(JSON.parse(JSON.stringify(ch)));
  assert.equal(back.trackers.crank.rep, 7);
  assert.equal(back.trackers.crank.ledger[0].note, "a long week");
});

test("CRANK: a schema-0.16 character with no tracker migrates to rep 0", () => {
  const old = JSON.parse(JSON.stringify(Engine.newCharacter()));
  delete old.trackers.crank; old.meta.schemaVersion = "0.16";
  const m = Engine.migrate(old);
  assert.deepEqual(JSON.parse(JSON.stringify(m.trackers.crank)), { rep: 0, ledger: [] });
  assert.equal(m.meta.schemaVersion, "0.19");
});

test("CRANK: crankState reads the tier at every boundary", () => {
  const at = rep => { const c = Engine.newCharacter(); c.trackers.crank.rep = rep; return Engine.crankState(c); };
  const want = [[-2,"novice","competent",7], [0,"novice","competent",5], [4,"novice","competent",1],
    [5,"competent","skilled",7], [11,"competent","skilled",1], [12,"skilled","expert",8], [19,"skilled","expert",1],
    [20,"expert","legendary",10], [29,"expert","legendary",1], [30,"legendary",null,null], [100,"legendary",null,null]];
  for (const [rep, tier, next, toNext] of want){
    const s = at(rep);
    assert.deepEqual([s.rep, s.tier.id, s.next && s.next.id, s.toNext], [rep, tier, next, toNext], `rep ${rep}`);
  }
  assert.equal(at(-2).unsettled, true);
  assert.equal(at(0).unsettled, false);
  assert.equal(Engine.crankState(null).tier.id, "novice");
});

test("CRANK: addCrankRep writes a ledger line for +1 and -2, and refuses nothing-amounts", () => {
  const ch = Engine.newCharacter();
  const r = D.resources.crank;
  assert.deepEqual([Engine.addCrankRep(ch, r.jobDone, "job").ok, Engine.addCrankRep(ch, r.jobWalkedOut, "").ok], [true, true]);
  assert.equal(ch.trackers.crank.rep, -1);
  assert.deepEqual([...ch.trackers.crank.ledger.map(e => e.amount)], [1, -2]);
  for (const bad of [0, "x", NaN]){
    assert.equal(Engine.addCrankRep(ch, bad, "").ok, false);
  }
  assert.equal(ch.trackers.crank.ledger.length, 2);
});

test("CRANK: crankPayText joins the sign and the range, and a top tier has no cap", () => {
  const t = D.resources.crank.tiers;
  assert.equal(Engine.crankPayText(t[0]), "Ç50–200");
  assert.equal(Engine.crankPayText(t[4]), "Ç10,000+");
  assert.equal(Engine.crankPayText(null), "");
});

test("CRANK: the data's tiers are ascending by rep with unique ids", () => {
  const t = D.resources.crank.tiers;
  assert.ok(t.length > 0);
  for (let i = 1; i < t.length; i++) assert.ok(t[i].rep > t[i-1].rep, `${t[i].id} is not above ${t[i-1].id}`);
  assert.equal(new Set(t.map(x => x.id)).size, t.length);
});

// ── Tables (Decisions 170–173) ────────────────────────────────────────
test("the code guards read every engine and UI script, gm.js included (Decision 172)", () => {
  assert.ok(CODE_FILES.includes("src/ui/gm.js"), CODE_FILES.join(", "));
  assert.ok(CODE_FILES.includes("src/engine/engine.js") && CODE_FILES.includes("src/ui/app.js"));
  assert.ok(!CODE_FILES.some(f => f.includes("theme-init")));
});

test("newTable stamps kind, a TBL- id, the name, schema 0.6, no notes, cast or interactions", () => {
  const t = Engine.newTable("Tuesday");
  assert.equal(t.meta.kind, "shadows-table");
  assert.ok(Engine.isTableId(t.meta.id), t.meta.id);
  assert.equal(t.meta.name, "Tuesday");
  assert.equal(t.meta.tableSchemaVersion, "0.9");
  assert.equal(t.notes.length, 0);
  assert.equal(JSON.stringify(t.cast), "[]");
  assert.equal(JSON.stringify(t.interactions), "[]");
  for (const k of ["created", "updated"]) assert.ok(Number.isFinite(Date.parse(t.meta[k])));
  assert.notEqual(Engine.newTable().meta.id, Engine.newTable().meta.id);
  assert.equal(Engine.newTable().meta.name, "");
});

test("fileKind tells a table from a character from anything else", () => {
  assert.equal(Engine.fileKind(Engine.newCharacter()), "character");
  assert.equal(Engine.fileKind({}), "character");
  assert.equal(Engine.fileKind(Engine.newTable()), "table");
  assert.equal(Engine.fileKind({ meta: { kind: "shadows-pack" } }), "pack");
  assert.equal(Engine.fileKind({ meta: { kind: "shadows-other" } }), "unknown");
  for (const v of [null, 5, "x", [], undefined]) assert.equal(Engine.fileKind(v), "unknown", String(v));
});

test("migrateTable keeps a real table whole, and is idempotent", () => {
  const t = Engine.newTable("Keep");
  Engine.addTableNote(t, { title: "A", text: "one" });
  Engine.addTableNote(t, { title: "B", text: "two" });
  const m = Engine.migrateTable(t);
  assert.deepEqual(JSON.parse(JSON.stringify(m)), JSON.parse(JSON.stringify(t)));
  assert.notEqual(m, t);
  assert.equal(JSON.stringify(Engine.migrateTable(m)), JSON.stringify(m));
  assert.equal(Engine.fileKind(m), "table");
});

test("migrateTable is total and typed over junk", () => {
  const junk = [null, 5, "x", [], {}, { meta: 5 }, { meta: { id: "TAG-0000-0000-0000" } }, { notes: "x" },
    { notes: [null, 5, "x", {}, { title: 5, text: {} }] }, { meta: { tableSchemaVersion: 9 } }];
  for (const j of junk) {
    const m = Engine.migrateTable(j);
    assert.ok(Engine.isTableId(m.meta.id), JSON.stringify(j));
    assert.equal(m.meta.kind, "shadows-table");
    assert.equal(typeof m.meta.name, "string");
    assert.ok(Array.isArray(m.notes));
    const ids = new Set();
    for (const n of m.notes) {
      assert.equal(typeof n.title, "string"); assert.equal(typeof n.text, "string");
      assert.match(n.id, /^N-[0-9A-HJKMNP-TV-Z]{8}$/); ids.add(n.id);
    }
    assert.equal(ids.size, m.notes.length);
    assert.equal(JSON.stringify(Engine.migrateTable(m)), JSON.stringify(m), "idempotent");
    assert.equal(Engine.tableCheck(m).length, 0);
  }
});

test("migrateTable keeps a valid id and replaces anything else; duplicate note ids split", () => {
  const good = Engine.newTable().meta.id;
  assert.equal(Engine.migrateTable({ meta: { id: good } }).meta.id, good);
  for (const bad of ["TAG-0000-0000-0000", "", "TBL-0000", 42, null]) {
    const id = Engine.migrateTable({ meta: { id: bad } }).meta.id;
    assert.ok(Engine.isTableId(id) && id !== bad, String(bad));
  }
  const m = Engine.migrateTable({ notes: [{ id: "N-ABCDEFGH" }, { id: "N-ABCDEFGH" }] });
  assert.equal(m.notes[0].id, "N-ABCDEFGH");
  assert.notEqual(m.notes[1].id, "N-ABCDEFGH");
});

test("migrateTable invents no timestamps (Decision 63)", () => {
  const m = Engine.migrateTable({ meta: { created: "yesterday", updated: 5 }, notes: [{ created: "soon" }] });
  assert.equal(m.meta.created, null); assert.equal(m.meta.updated, null); assert.equal(m.notes[0].created, null);
  const k = Engine.migrateTable({ meta: { created: "2026-10-05T10:00:00.000Z" } });
  assert.equal(k.meta.created, "2026-10-05T10:00:00.000Z");
});

test("a newer table schema stamp is kept and reported; an older or unreadable one reads 0.9", () => {
  const n = Engine.migrateTable({ meta: { tableSchemaVersion: "9.0" } });
  assert.equal(n.meta.tableSchemaVersion, "9.0");
  assert.equal(Engine.tableCheck(n).length, 1);
  assert.equal(Engine.migrateTable(n).meta.tableSchemaVersion, "9.0");
  for (const v of ["0.7", "0.6", "0.5", "0.4", "0.2", "0.1", "0.0", "junk", undefined]) {
    const m = Engine.migrateTable({ meta: { tableSchemaVersion: v } });
    assert.equal(m.meta.tableSchemaVersion, "0.9", String(v));
    assert.equal(Engine.tableCheck(m).length, 0);
  }
});

test("migrateTable keeps keys it doesn't know, and never reads them", () => {
  const m = Engine.migrateTable({ future: 2, meta: { future: 1 }, notes: [{ extra: true }] });
  assert.equal(m.future, 2);
  assert.equal(m.meta.future, 1);
  assert.equal(m.notes[0].extra, true);
});

test("a __proto__ key in a table file pollutes nothing (Decision 124)", () => {
  const m = Engine.migrateTable(JSON.parse('{"__proto__":{"pwn":1},"meta":{"__proto__":{"pwn":1}},"notes":[{"__proto__":{"pwn":1}}]}'));
  assert.equal(({}).pwn, undefined);
  assert.equal(m.pwn, undefined); assert.equal(m.meta.pwn, undefined); assert.equal(m.notes[0].pwn, undefined);
});

test("table notes: add, edit, remove stamp updated, coerce text, and refuse an unknown id", () => {
  const t = Engine.newTable("N");
  t.meta.updated = "2000-01-01T00:00:00.000Z";
  const a = Engine.addTableNote(t, { title: "T", text: 7 });
  assert.ok(a.ok); assert.equal(t.notes[0].id, a.id); assert.equal(t.notes[0].text, "");
  assert.ok(t.meta.updated > "2001");
  t.meta.updated = "2000-01-01T00:00:00.000Z";
  assert.ok(Engine.editTableNote(t, a.id, { title: "U", text: { x: 1 } }).ok);
  assert.equal(t.notes[0].title, "U"); assert.equal(t.notes[0].text, "");
  assert.ok(t.meta.updated > "2001");
  assert.equal(JSON.stringify(Engine.editTableNote(t, "N-NOPE0000", { title: "x" })), JSON.stringify({ ok: false, why: "No such note." }));
  t.meta.updated = "2000-01-01T00:00:00.000Z";
  assert.ok(Engine.removeTableNote(t, a.id).ok);
  assert.equal(t.notes.length, 0); assert.ok(t.meta.updated > "2001");
  assert.equal(JSON.stringify(Engine.removeTableNote(t, a.id)), JSON.stringify({ ok: false, why: "No such note." }));
});

// ── The cast (Decisions 174–176) ──────────────────────────────────────
// A synthetic NPC only: Dez, a courier. Nothing here is the Codex's.
const STAT_IDS = D.stats.map(s => s.id);
const AUTHORED = D.derived.filter(d => d.type === "sumOfModifiers");
const dez = (over = {}) => {
  const stats = {}; for (const id of STAT_IDS) stats[id] = 5;
  return { stats, authored: {}, skills: [], armor: [], gear: [], traits: [], ...over };
};
const plain = x => JSON.parse(JSON.stringify(x));
const eq = (a, b, m) => assert.deepEqual(plain(a), plain(b), m);

test("a 0.1 table migrates to 0.4 with an empty cast and its notes untouched", () => {
  const old = Engine.newTable("Old");
  Engine.addTableNote(old, { title: "A", text: "one" });
  Engine.addTableNote(old, { title: "B", text: "two" });
  old.meta.tableSchemaVersion = "0.1"; delete old.cast;
  const m = Engine.migrateTable(old);
  assert.equal(m.meta.tableSchemaVersion, "0.9");
  eq(m.cast, []); eq(m.interactions, []);
  assert.equal(JSON.stringify(m.notes), JSON.stringify(old.notes));
  assert.equal(Engine.tableCheck(m).length, 0);
});

test("a newer table keeps its stamp and its cast, coerced, and tableCheck reports it", () => {
  const m = Engine.migrateTable({ meta: { tableSchemaVersion: "9.0" }, cast: [{ name: 5, tier: "2" }] });
  assert.equal(m.meta.tableSchemaVersion, "9.0");
  assert.equal(m.cast.length, 1); assert.equal(m.cast[0].name, ""); assert.equal(m.cast[0].tier, 2);
  assert.equal(Engine.tableCheck(m).length, 1);
});

test("migrateTable is total and typed over cast junk, and idempotent", () => {
  eq(Engine.migrateTable({ cast: "x" }).cast, []);
  const m = Engine.migrateTable({ cast: [null, 5, "x", {},
    { name: 5, npcRoles: "Fixer", tier: "3", status: "zombie", block: "x" },
    { block: { stats: { BOD: "6", REF: 6.5, MOB: {} }, skills: [null, { name: 5, total: "7", skill: "not-a-skill" }],
               armor: [5, "Vest"], traits: [{}] } }] });
  assert.equal(m.cast.length, 3);
  for (const n of m.cast) {
    for (const k of ["name", "flavor", "description", "origin", "enemyRole", "motivation", "resources", "line", "ifPushed", "gmNote"]) assert.equal(typeof n[k], "string", k);
    assert.match(n.id, /^C-[0-9A-HJKMNP-TV-Z]{8}$/);
    assert.equal(n.status, "alive");
  }
  const a = m.cast[1];
  assert.equal(a.name, ""); eq(a.npcRoles, ["Fixer"]); assert.equal(a.tier, 3); assert.equal(a.block, null);
  const b = m.cast[2].block;
  assert.equal(b.stats.BOD, 6); assert.equal(b.stats.REF, null); assert.equal(b.stats.MOB, null);
  assert.equal(b.skills.length, 1);
  eq(plain(b.skills[0]), { name: "", total: 7, skill: null });
  eq(b.armor, ["Vest"]);
  eq(plain(b.traits), [{ name: "", text: "" }]);
  assert.equal(JSON.stringify(Engine.migrateTable(m)), JSON.stringify(m));
});

test("a tier is a whole number from 1, or nothing", () => {
  for (const [v, want] of [["3", 3], [3, 3], [1, 1], [0, null], [-1, null], [2.5, null], ["x", null], ["", null], [null, null], [{}, null]])
    assert.equal(Engine.migrateTable({ cast: [{ tier: v }] }).cast[0].tier, want, JSON.stringify(v));
});

test("a skill row keeps its data id when it is one", () => {
  const id = D.skills[0].id;
  const m = Engine.migrateTable({ cast: [{ block: { skills: [{ name: "x", skill: id }] } }] });
  assert.equal(m.cast[0].block.skills[0].skill, id);
});

test("two members sharing an id: the first keeps it; a TAG- id is replaced", () => {
  const m = Engine.migrateTable({ cast: [{ id: "C-ABCDEFGH" }, { id: "C-ABCDEFGH" }, { id: "TAG-0000-0000-0000" }] });
  assert.equal(m.cast[0].id, "C-ABCDEFGH");
  assert.notEqual(m.cast[1].id, "C-ABCDEFGH");
  assert.match(m.cast[2].id, /^C-/);
  assert.equal(new Set(m.cast.map(n => n.id)).size, 3);
});

test("a cast member keeps keys it doesn't know, in a block and in stats", () => {
  const m = Engine.migrateTable({ cast: [{ future: 1, block: { extra: 2, stats: { LUCKY: 3 } } }] });
  assert.equal(m.cast[0].future, 1); assert.equal(m.cast[0].block.extra, 2); assert.equal(m.cast[0].block.stats.LUCKY, 3);
});

test("a __proto__ key at the cast, member, block and stats levels pollutes nothing", () => {
  const m = Engine.migrateTable(JSON.parse('{"cast":[{"__proto__":{"pwn":1},"block":{"__proto__":{"pwn":1},"stats":{"__proto__":{"pwn":1}},"authored":{"__proto__":{"pwn":1}},"skills":[{"__proto__":{"pwn":1}}]}}],"__proto__":{"pwn":1}}'));
  assert.equal(({}).pwn, undefined);
  const n = m.cast[0];
  assert.equal(n.pwn, undefined); assert.equal(n.block.pwn, undefined); assert.equal(n.block.stats.pwn, undefined);
  assert.equal(n.block.skills[0].pwn, undefined);
});

test("Engine.npc: Health from BOD by the players' rule, past 10 included", () => {
  const hl = D.resources.healthLevels;
  const at = bod => Engine.npc(dez({ stats: { ...dez().stats, BOD: bod } })).health;
  eq(at(6), { levels: 6, hpPer: hl.hpPerLevel, total: 6 * hl.hpPerLevel });
  eq(at(12), { levels: hl.maxLevels, hpPer: hl.hpPerLevel + 2, total: hl.maxLevels * (hl.hpPerLevel + 2) });
  assert.equal(at(null), null);
});

test("Engine.npc: Health agrees with health() for a character of the same BOD", () => {
  const ch = Engine.newCharacter();
  for (const bod of [4, 7, 12]) {
    ch.stats.BOD.base = bod;
    const want = Engine.health(ch);
    const got = Engine.npc(dez({ stats: { ...dez().stats, BOD: Engine.statValue(ch, "BOD") } })).health;
    assert.equal(got.levels, want.levels, String(bod)); assert.equal(got.hpPer, want.hpPer, String(bod));
  }
});

test("Engine.npc: each stat's mod is statMod; ids come from the data", () => {
  const n = Engine.npc(dez());
  eq(Object.keys(n.stats), STAT_IDS);
  for (const id of STAT_IDS) assert.equal(n.stats[id].mod, Engine.statMod(5), id);
  const blank = Engine.npc(dez({ stats: {} }));
  for (const id of STAT_IDS) { assert.equal(blank.stats[id].value, null); assert.ok(blank.blanks.includes(id), id); }
});

test("Engine.npc: an authored stat reads as stored, with the formula's value beside it", () => {
  assert.ok(AUTHORED.length > 0);
  for (const d of AUTHORED) {
    const stats = dez().stats;
    const want = Math.max(d.floor ?? -Infinity, d.base + d.inputs.reduce((s, id) => s + Engine.statMod(stats[id]), 0));
    const n = Engine.npc(dez({ authored: { [d.id]: want + 2 } }));
    assert.equal(n.authored[d.id].value, want + 2);
    assert.equal(n.authored[d.id].formula, want);
    assert.equal(Engine.npc(dez({ stats: { ...stats, [d.inputs[0]]: null } })).authored[d.id].formula, null, d.id);
  }
});

test("Engine.npc is total", () => {
  for (const v of [null, undefined, "x", 5, [], {}, { stats: 5 }, { stats: { BOD: "6" } }, { skills: "x" }]) {
    const n = Engine.npc(v);
    eq(Object.keys(n.stats), STAT_IDS);
    assert.ok(Array.isArray(n.blanks));
  }
  assert.equal(Engine.npc({ stats: { BOD: "6" } }).health.levels, 6);
  const cyc = {}; cyc.self = cyc; assert.doesNotThrow(() => Engine.npc(cyc));
});

test("constraint 7: a block stores no Health, HP, bonus or formula", () => {
  const t = Engine.newTable("T");
  const { id } = Engine.addCastMember(t, { name: "Dez" });
  Engine.setCastBlock(t, id, dez({ authored: { TOL: 1 } }));
  Engine.npc(t.cast[0].block);
  const text = JSON.stringify(Engine.migrateTable(t));
  for (const k of ["health", "hp", "levels", "hpPer", "mod", "formula"]) assert.ok(!new RegExp('"' + k + '"', "i").test(text), k);
  eq(Object.keys(t.cast[0].block).sort(), ["armor", "authored", "gear", "skills", "stats", "traits"]);
});

test("cast: add, edit, set a block, remove stamp updated, coerce, and refuse an unknown id", () => {
  const t = Engine.newTable("C");
  const old = "2000-01-01T00:00:00.000Z";
  t.meta.updated = old;
  const a = Engine.addCastMember(t, { name: "Dez", line: "runs the café" });
  assert.ok(a.ok); assert.equal(t.cast[0].id, a.id); assert.equal(t.cast[0].flavor, "runs the café"); assert.equal(t.cast[0].line, "");
  assert.equal(t.cast[0].status, "alive"); assert.equal(t.cast[0].block, null);
  assert.ok(t.meta.updated > "2001");
  const b = Engine.addCastMember(t, { name: 7 });
  assert.equal(t.cast[0].id, b.id, "newest first"); assert.equal(t.cast[0].name, "");
  t.meta.updated = old; t.cast[1].updated = old;
  assert.ok(Engine.editCastMember(t, a.id, { name: "Dez R", npcRoles: "Fixer", tier: "4", status: "gone", origin: {} }).ok);
  const n = t.cast[1];
  assert.equal(n.name, "Dez R"); eq(n.npcRoles, ["Fixer"]); assert.equal(n.tier, 4); assert.equal(n.status, "gone"); assert.equal(n.origin, "");
  assert.ok(n.updated > "2001" && t.meta.updated > "2001");
  assert.ok(Engine.editCastMember(t, a.id, { status: "zombie", tier: 0 }).ok);
  assert.equal(n.status, "gone"); assert.equal(n.tier, null);
  t.meta.updated = old;
  assert.ok(Engine.setCastBlock(t, a.id, { stats: { BOD: "6" } }).ok);
  assert.equal(n.block.stats.BOD, 6); assert.ok(t.meta.updated > "2001");
  assert.ok(Engine.setCastBlock(t, a.id, null).ok); assert.equal(n.block, null);
  const no = JSON.stringify({ ok: false, why: "No such cast member." });
  for (const f of [() => Engine.editCastMember(t, "C-NOPE0000", {}), () => Engine.setCastBlock(t, "C-NOPE0000", null), () => Engine.removeCastMember(t, "C-NOPE0000")])
    assert.equal(JSON.stringify(f()), no);
  t.meta.updated = old;
  assert.ok(Engine.removeCastMember(t, a.id).ok);
  assert.equal(t.cast.length, 1); assert.ok(t.meta.updated > "2001");
});

test("castFilter: q over name, line, origin and roles; status all or one", () => {
  const t = Engine.newTable("F");
  const mk = (f, e) => { const r = Engine.addCastMember(t, f); Engine.editCastMember(t, r.id, e); };
  mk({ name: "Dez", line: "a courier" }, { npcRoles: ["Fixer"], origin: "Born here" });
  mk({ name: "Moth" }, { status: "dead" });
  mk({ name: "Orla" }, { status: "gone" });
  const names = f => Engine.castFilter(t, f).map(n => n.name).sort().join();
  assert.equal(names({}), "Dez,Moth,Orla");
  assert.equal(names({ status: "all" }), "Dez,Moth,Orla");
  assert.equal(names({ status: "alive" }), "Dez");
  assert.equal(names({ status: "dead" }), "Moth");
  assert.equal(names({ status: "gone" }), "Orla");
  assert.equal(names({ q: "FIXER" }), "Dez");
  assert.equal(names({ q: "courier" }), "Dez");
  assert.equal(names({ q: "born" }), "Dez");
  assert.equal(names({ q: " mo " }), "Moth");
  assert.equal(names({ q: "mo", status: "alive" }), "");
  eq(Engine.castFilter(null, {}), []);
});

test("castFilter: In play is alive and missing, and the list is ordered alive, missing, gone, dead, each in cast order", () => {
  const t = Engine.newTable("O");
  // Added oldest first, so the cast reads (newest first): D2, G1, M1, A2, D1, A1, M2
  for (const [n, st] of [["M2", "missing"], ["A1", "alive"], ["D1", "dead"], ["A2", "alive"], ["M1", "missing"], ["G1", "gone"], ["D2", "dead"]]) {
    const r = Engine.addCastMember(t, { name: n }); Engine.editCastMember(t, r.id, { status: st });
  }
  const names = f => Engine.castFilter(t, f).map(n => n.name).join();
  assert.equal(names({ status: "inplay" }), "A2,A1,M1,M2");
  assert.equal(names({ status: "all" }), "A2,A1,M1,M2,G1,D2,D1");
  assert.equal(names({}), "A2,A1,M1,M2,G1,D2,D1");
  assert.equal(names({ status: "nonsense" }), "A2,A1,M1,M2,G1,D2,D1");
  assert.equal(names({ status: "dead" }), "D2,D1");
  assert.equal(names({ status: "inplay", q: "m" }), "M1,M2");
});

test("Engine.npc: a list of empty rows is still blank, and one real entry fills it", () => {
  const empty = Engine.npc({ armor: [" "], gear: [""], traits: [{ name: "", text: "" }], skills: [{ name: "", total: null, skill: null }] });
  for (const k of ["armor", "gear", "traits", "skills"]) assert.ok(empty.blanks.includes(k), k);
  const full = Engine.npc({ armor: ["", "Vest"], gear: ["Phone"], traits: [{ name: "", text: "Quick" }], skills: [{ name: "", total: 0, skill: null }] });
  for (const k of ["armor", "gear", "traits", "skills"]) assert.ok(!full.blanks.includes(k), k);
  assert.ok(!Engine.npc({ traits: [{ name: "Fast", text: "" }], skills: [{ name: "Streetwise", total: null }] }).blanks.includes("traits"));
});

test("roles are trimmed with no empties, on load and on edit, and that is idempotent", () => {
  const m = Engine.migrateTable({ cast: [{ npcRoles: ["Fixer", "", " Informant ", "  "] }] });
  eq(m.cast[0].npcRoles, ["Fixer", "Informant"]);
  eq(Engine.migrateTable(m).cast[0].npcRoles, ["Fixer", "Informant"]);
  const t = Engine.newTable("R"); const { id } = Engine.addCastMember(t, { name: "x" });
  Engine.editCastMember(t, id, { npcRoles: ["Fixer", "", " Informant "] });
  eq(t.cast[0].npcRoles, ["Fixer", "Informant"]);
});

// ── Interactions and affiliations (Decisions 177–179) ─────────────────
// Synthetic only: Dez and Ivo at the cast, Nyx and Rook as the crew.
const castWith = (...names) => {
  const t = Engine.newTable("I");
  const ids = names.map(n => Engine.addCastMember(t, { name: n }).id);
  return [t, ...ids];
};
const KINDS = ["shared", "learned", "helped", "wronged", "killed", "owes", "owed", "fought"];

test("a 0.2 table migrates to 0.3 with no interactions and no affiliations, and the rest is byte-identical", () => {
  const old = Engine.newTable("Two");
  Engine.addCastMember(old, { name: "Dez" }); Engine.addCastMember(old, { name: "Ivo" });
  Engine.addTableNote(old, { title: "A", text: "one" });
  delete old.interactions; old.meta.tableSchemaVersion = "0.2";
  for (const n of old.cast) delete n.affiliations;
  const m = Engine.migrateTable(old);
  assert.equal(m.meta.tableSchemaVersion, "0.9");
  eq(m.interactions, []);
  for (const n of m.cast) eq(n.affiliations, []);
  const strip = t => { const c = plain(t); delete c.interactions; delete c.meta.tableSchemaVersion; for (const n of c.cast) { delete n.affiliations; delete n.from; } return JSON.stringify(c); };
  assert.equal(strip(m), strip(old));
  assert.equal(Engine.tableCheck(m).length, 0);
});

test("a newer table keeps its stamp and its interactions, and tableCheck says so", () => {
  const m = Engine.migrateTable({ meta: { tableSchemaVersion: "9.0" }, interactions: [{ kind: "shared", text: "x" }] });
  assert.equal(m.meta.tableSchemaVersion, "9.0");
  assert.equal(m.interactions.length, 1);
  assert.equal(Engine.tableCheck(m).length, 1);
});

test("interactions are typed over junk, kind null for an unknown one, links kept only if valid, and idempotent", () => {
  eq(Engine.migrateTable({ interactions: "x" }).interactions, []);
  const good = "C-ABCDEFGH";
  const m = Engine.migrateTable({ interactions: [null, 5, {},
    { kind: "zombie", cast: "C-1", crew: "Nyx", text: 5, date: "2026-02-30" },
    { cast: [null, { kind: "place", id: good }, { kind: "cast", id: "bad" }, { kind: "cast", id: good, name: 7 }], crew: [" Nyx ", "", 5] }] });
  assert.equal(m.interactions.length, 3);
  for (const x of m.interactions) {
    assert.match(x.id, /^I-[0-9A-HJKMNP-TV-Z]{8}$/);
    assert.equal(typeof x.text, "string");
  }
  const a = m.interactions[1];
  assert.equal(a.kind, null); eq(a.cast, []); eq(a.crew, ["Nyx"]); assert.equal(a.text, ""); assert.equal(a.date, null);
  const b = m.interactions[2];
  eq(b.cast, [{ kind: "cast", id: good }]); eq(b.crew, ["Nyx"]); assert.equal(b.kind, null);
  assert.equal(JSON.stringify(Engine.migrateTable(m)), JSON.stringify(m));
  for (const [d, want] of [["2026-10-05", "2026-10-05"], ["2026-02-29", null], ["2028-02-29", "2028-02-29"], ["2026-13-01", null], ["10/05/2026", null], ["2026-10-5", null], [20261005, null]])
    assert.equal(Engine.migrateTable({ interactions: [{ date: d }] }).interactions[0].date, want, String(d));
  for (const k of KINDS) assert.equal(Engine.migrateTable({ interactions: [{ kind: k }] }).interactions[0].kind, k);
});

test("a link to a member who isn't in the cast is kept; a link's name survives; ids are unique", () => {
  const m = Engine.migrateTable({ cast: [{ id: "C-AAAAAAAA", name: "Dez" }], interactions: [
    { id: "I-AAAAAAAA", cast: [{ kind: "cast", id: "C-BBBBBBBB", name: "Moth" }] }, { id: "I-AAAAAAAA" }] });
  eq(m.interactions[0].cast, [{ kind: "cast", id: "C-BBBBBBBB", name: "Moth" }]);
  assert.notEqual(m.interactions[0].id, m.interactions[1].id);
  eq(Engine.linkName(m, m.interactions[0].cast[0]), { name: "Moth", gone: true });
});

test("affiliations are trimmed with no empties, a string is one, and that is idempotent", () => {
  eq(Engine.migrateTable({ cast: [{ affiliations: "Eclipse" }] }).cast[0].affiliations, ["Eclipse"]);
  const m = Engine.migrateTable({ cast: [{ affiliations: ["Eclipse", " "] }, { affiliations: 5 }] });
  eq(m.cast[0].affiliations, ["Eclipse"]); eq(m.cast[1].affiliations, []);
  assert.equal(JSON.stringify(Engine.migrateTable(m)), JSON.stringify(m));
});

test("a __proto__ key at the interaction, link and crew levels pollutes nothing", () => {
  const raw = '{"interactions":[{"__proto__":{"pwn":1},"cast":[{"__proto__":{"pwn":1},"kind":"cast","id":"C-ABCDEFGH"}],"crew":["__proto__",{"__proto__":{"pwn":1}}]}]}';
  const m = Engine.migrateTable(JSON.parse(raw));
  assert.equal(({}).pwn, undefined);
  const x = m.interactions[0];
  assert.equal(x.pwn, undefined); assert.equal(x.cast[0].pwn, undefined);
  eq(x.crew, ["__proto__"]);
  assert.equal(Engine.crewView(m, {}).length, 1);
});

test("addInteraction: first in the list, refused with no kind and no text, links and a killed kind set the member dead", () => {
  const [t, dez, ivo] = castWith("Dez", "Ivo");
  const a = Engine.addInteraction(t, { kind: "shared", cast: [dez], crew: ["Nyx"], text: "the warehouse is a front", date: "2026-10-05" });
  assert.ok(a.ok); assert.match(a.id, /^I-/);
  const b = Engine.addInteraction(t, { kind: "learned", cast: [dez], crew: [" Nyx "], text: "", date: "nope" });
  assert.equal(t.interactions[0].id, b.id); assert.equal(t.interactions[1].id, a.id);
  eq(t.interactions[0].crew, ["Nyx"]); assert.equal(t.interactions[0].date, null);
  eq(t.interactions[1].cast, [{ kind: "cast", id: dez }]);
  for (const f of [{}, { text: "  " }, { kind: "zombie" }, null, 5])
    assert.equal(JSON.stringify(Engine.addInteraction(t, f)), JSON.stringify({ ok: false, why: "Say what happened." }));
  assert.equal(t.interactions.length, 2);
  assert.ok(Engine.addInteraction(t, { text: "no kind is fine" }).ok);
  assert.equal(t.cast.find(n => n.id === dez).status, "alive");
  const k = Engine.addInteraction(t, { kind: "killed", cast: [dez, "C-NOPE0000"], crew: ["Rook"] });
  assert.ok(k.ok);
  assert.equal(t.cast.find(n => n.id === dez).status, "dead");
  assert.equal(t.cast.find(n => n.id === ivo).status, "alive");
});

test("editInteraction: a change to killed sets dead, a change from killed leaves it, and an unknown id is refused", () => {
  const [t, dez] = castWith("Dez");
  const { id } = Engine.addInteraction(t, { kind: "shared", cast: [dez], text: "x" });
  assert.ok(Engine.editInteraction(t, id, { kind: "killed" }).ok);
  assert.equal(t.cast[0].status, "dead");
  Engine.editCastMember(t, dez, { status: "alive" });
  assert.ok(Engine.editInteraction(t, id, { text: "still killed", kind: "killed" }).ok);
  assert.equal(t.cast[0].status, "alive", "a line that was already killed doesn't kill again");
  Engine.editCastMember(t, dez, { status: "dead" });
  assert.ok(Engine.editInteraction(t, id, { kind: "helped" }).ok);
  assert.equal(t.cast[0].status, "dead");
  assert.ok(Engine.editInteraction(t, id, { crew: " ", text: 5, date: "2026-02-30", kind: "zombie" }).ok);
  const x = t.interactions[0];
  eq(x.crew, []); assert.equal(x.text, ""); assert.equal(x.date, null); assert.equal(x.kind, null);
  assert.equal(t.interactions.length, 1, "an emptied one stays");
  const no = JSON.stringify({ ok: false, why: "No such interaction." });
  assert.equal(JSON.stringify(Engine.editInteraction(t, "I-NOPE0000", {})), no);
  assert.ok(Engine.removeInteraction(t, id).ok);
  assert.equal(JSON.stringify(Engine.removeInteraction(t, id)), no);
  assert.equal(t.interactions.length, 0);
});

test("removeCastMember writes the name into every link to them; linkName reads live, gone with a name, and gone without", () => {
  const [t, dez, ivo] = castWith("Dez", "Ivo");
  Engine.addInteraction(t, { kind: "shared", cast: [dez, ivo], crew: ["Nyx"], text: "x" });
  eq(Engine.linkName(t, t.interactions[0].cast[0]), { name: "Dez", gone: false });
  assert.equal(t.interactions[0].cast[0].name, undefined, "a live link stores no name");
  assert.ok(Engine.removeCastMember(t, dez).ok);
  const [gone, live] = t.interactions[0].cast;
  assert.equal(gone.name, "Dez"); assert.equal(live.name, undefined);
  eq(Engine.linkName(t, gone), { name: "Dez", gone: true });
  eq(Engine.linkName(t, live), { name: "Ivo", gone: false });
  eq(Engine.linkName(t, { kind: "cast", id: "C-NOPE0000" }), { name: "Someone removed", gone: true });
  for (const v of [null, "x", 5, [], undefined, {}]) assert.doesNotThrow(() => Engine.linkName(t, v), String(v));
  eq(Engine.linkName(t, null), { name: "Someone removed", gone: true });
  assert.doesNotThrow(() => Engine.linkName(null, { id: "x" }));
  assert.equal(JSON.stringify(Engine.migrateTable(t).interactions[0].cast[0]), JSON.stringify(gone));
});

test("interactionsFor is newest first: the later day, then no day, then the later created", () => {
  const [t, dez, ivo] = castWith("Dez", "Ivo");
  const mk = (text, date, created, cast = [dez]) => { const r = Engine.addInteraction(t, { kind: "shared", cast, text, date }); t.interactions.find(x => x.id === r.id).created = created; };
  mk("old", "2026-10-01", "2026-10-01T10:00:00.000Z");
  mk("none", null, "2026-10-09T10:00:00.000Z");
  mk("new", "2026-10-05", "2026-10-05T08:00:00.000Z");
  mk("same-later", "2026-10-05", "2026-10-05T09:00:00.000Z");
  mk("other", "2026-10-06", "2026-10-06T09:00:00.000Z", [ivo]);
  assert.equal(Engine.interactionsFor(t, dez).map(x => x.text).join(), "same-later,new,old,none");
  assert.equal(Engine.interactionsFor(t, ivo).map(x => x.text).join(), "other");
  eq(Engine.interactionsFor(t, "C-NOPE0000"), []); eq(Engine.interactionsFor(null, dez), []);
});

test("crewView: Nyx, nyx and 'Nyx ' are one group shown as first spelled; A–Z; q reads text, crew and a gone member's name", () => {
  const [t, dez, ivo] = castWith("Dez", "Ivo");
  Engine.addInteraction(t, { kind: "shared", cast: [dez], crew: ["Nyx"], text: "one", date: "2026-10-01" });
  Engine.addInteraction(t, { kind: "learned", cast: [ivo], crew: ["NYX", "Rook"], text: "two", date: "2026-10-02" });
  Engine.addInteraction(t, { kind: "helped", cast: [ivo], crew: ["nYx "], text: "three", date: "2026-10-03" });
  Engine.addInteraction(t, { kind: "helped", cast: [ivo], crew: [], text: "nobody's" });
  const v = Engine.crewView(t, {});
  assert.equal(v.map(g => g.name).join(), "Nyx,Rook,", "the line with no crew is the last group");
  assert.equal(v[0].interactions.map(x => x.text).join(), "three,two,one");
  assert.equal(v[1].interactions.map(x => x.text).join(), "two");
  assert.equal(Engine.crewView(t, { q: "ROOK" }).map(g => g.name).join(), "Rook");
  assert.equal(Engine.crewView(t, { q: "one" }).map(g => g.name).join(), "Nyx");
  Engine.removeCastMember(t, dez);
  assert.equal(Engine.crewView(t, { q: "dez" })[0].interactions[0].text, "one");
  eq(Engine.crewView(null, {}), []); eq(Engine.crewView(t, { q: "zzz" }), []);
});

test("castFilter by affiliation is case folded, q reads affiliations, and castAffiliations is distinct and sorted", () => {
  const [t, a, b, c] = castWith("A", "B", "C");
  Engine.editCastMember(t, a, { affiliations: ["Eclipse", "Zed"] });
  Engine.editCastMember(t, b, { affiliations: [" eclipse "] });
  Engine.editCastMember(t, c, { affiliations: ["Anchor"] });
  eq(Engine.castAffiliations(t), ["Anchor", "Eclipse", "Zed"]);
  assert.equal(Engine.castFilter(t, { affiliation: "ECLIPSE" }).map(n => n.name).sort().join(), "A,B");
  assert.equal(Engine.castFilter(t, { affiliation: "" }).length, 3);
  assert.equal(Engine.castFilter(t, { affiliation: "nobody" }).length, 0);
  assert.equal(Engine.castFilter(t, { q: "anch" }).map(n => n.name).join(), "C");
  eq(Engine.castAffiliations(null), []);
});

test("castFilter with an affiliation chosen is still in CAST_ORDER, each group in cast order", () => {
  const t = Engine.newTable("O");
  for (const [n, st] of [["M2", "missing"], ["A1", "alive"], ["D1", "dead"], ["A2", "alive"], ["M1", "missing"], ["G1", "gone"]]) {
    const r = Engine.addCastMember(t, { name: n }); Engine.editCastMember(t, r.id, { status: st, affiliations: ["Eclipse"] });
  }
  assert.equal(t.cast.map(n => n.name).join(), "G1,M1,A2,D1,A1,M2", "insertion order isn't status order");
  assert.equal(Engine.castFilter(t, { affiliation: "eclipse", status: "all" }).map(n => n.name).join(), "A2,A1,M1,M2,G1,D1");
  assert.equal(Engine.castFilter(t, { affiliation: "eclipse", status: "inplay" }).map(n => n.name).join(), "A2,A1,M1,M2");
});

test("S8b review 1: crewView puts lines with no crew name in a last group named '', which q still reaches", () => {
  const [t, dez] = castWith("Dez");
  Engine.addInteraction(t, { kind: "shared", cast: [dez], crew: ["Nyx"], text: "named", date: "2026-10-01" });
  Engine.addInteraction(t, { kind: "learned", cast: [dez], crew: [], text: "nobody's", date: "2026-10-03" });
  Engine.addInteraction(t, { kind: "helped", cast: [dez], crew: ["Zed"], text: "last by name" });
  Engine.removeCastMember(t, dez);
  const v = Engine.crewView(t, {});
  assert.equal(v.map(g => g.name).join("|"), "Nyx|Zed|", "the nameless group isn't last");
  assert.equal(v[2].interactions.map(x => x.text).join(), "nobody's");
  assert.equal(Engine.crewView(t, { q: "nobody" }).map(g => g.name).join("|"), "");
  assert.equal(Engine.crewView(t, { q: "dez" }).map(g => g.name).join("|"), "Nyx|Zed|", "a gone member's name doesn't reach every group");
  assert.equal(Engine.crewView(t, { q: "dez" }).length, 3);
  assert.equal(Engine.crewView(t, { q: "zzz" }).length, 0);
});

// ── Packs (Decisions 180–182) ──────────────────────────────────────────────
import { syntheticPack, syntheticPack01, PACK_ID } from "./packfixture.mjs";

test("fileKind: a pack is 'pack'; a table, a character and junk are as they were", () => {
  assert.equal(Engine.fileKind(syntheticPack()), "pack");
  assert.equal(Engine.fileKind(Engine.newTable("T")), "table");
  assert.equal(Engine.fileKind(Engine.newCharacter()), "character");
  assert.equal(Engine.fileKind({ meta: { kind: "other" } }), "unknown");
  assert.equal(Engine.fileKind(null), "unknown");
});

test("migratePack over junk: every record coerced or dropped, ids the author's, idempotent", () => {
  const raw = syntheticPack();
  raw.entries.push(null, 5, {}, { id: "bad id!", name: "Bad" }, { id: "gull", name: "Dup of Gull" },
    { id: "odd", name: 7, origin: "nowhere", npcRoles: ["gatherer", "nope", 5], enemyRole: "nope", tier: "2", kind: "boss",
      block: { stats: { BOD: "x" } } },
    { id: "zero", tier: 0 });
  raw.groups[0].members.push({ entry: "ghost", count: 2 }, { entry: "wren", count: 0 }, null, 5);
  const m = Engine.migratePack(raw);
  eq(m.entries.map(e => e.id), ["wren", "gull", "moss", "odd", "zero"], "bad and repeated ids are dropped, not renamed");
  const odd = m.entries.find(e => e.id === "odd");
  assert.equal(odd.name, ""); assert.equal(odd.origin, null); assert.equal(odd.enemyRole, null);
  eq(odd.npcRoles, ["gatherer"]); assert.equal(odd.tier, 2); assert.equal(odd.kind, "threat");
  assert.equal(odd.block.stats.BOD, null, "a block goes through the cast's gate");
  assert.equal(m.entries.find(e => e.id === "zero").tier, null);
  assert.equal(m.entries.find(e => e.id === "gull").name, "Gull", "the first of a repeated id stays");
  eq(m.groups[0].members.map(x => [x.entry, x.count]), [["gull", 3], ["wren", 1], ["wren", 1]]);
  const j = Engine.migratePack({ meta: { id: "PK-bad" }, entries: "x", origins: [null, 5, {}], tiers: [{ id: "2" }, { id: 0 }, { id: "x" }, { id: 2 }] });
  assert.equal(j.meta.id, null); assert.equal(j.meta.kind, "shadows-pack");
  eq(j.entries, []); eq(j.origins, []);
  eq(j.tiers.map(t => t.id), [2], "a tier id is a whole number of 1 or more, and once");
  assert.equal(Engine.packCheck(j).refuse, "This pack has no id, so it can't be slotted in.");
  assert.equal(Engine.packCheck(m).refuse, null);
  assert.equal(JSON.stringify(Engine.migratePack(m)), JSON.stringify(m), "idempotent");
  for (const x of [null, 5, "x", [], undefined]) assert.equal(Engine.migratePack(x).meta.id, null);
});

test("migratePack: every text field a string, unknown keys kept, a pack's own order kept", () => {
  const raw = syntheticPack(); raw.future = { x: 1 }; raw.traits = [{ id: "t" }]; raw.entries[0].extra = 2;
  raw.entries[1].name = { a: 1 }; raw.meta.name = 5; raw.meta.contentVersion = null;
  const m = Engine.migratePack(raw);
  assert.equal(m.future.x, 1); assert.equal(m.traits[0].id, "t"); assert.equal(m.entries[0].extra, 2);
  assert.equal(m.entries[1].name, ""); assert.equal(m.meta.name, ""); assert.equal(m.meta.contentVersion, "");
  eq(m.entries.map(e => e.id), ["wren", "gull", "moss"]);
  assert.equal(m.meta.created, "2026-10-01T10:00:00.000Z");
  assert.equal(Engine.migratePack({ meta: { id: PACK_ID, updated: "nope" } }).meta.updated, null, "the gate invents no timestamps");
});

test("a newer packSchemaVersion is kept, and packCheck warns; an older or unreadable one reads as the current one", () => {
  const n = Engine.migratePack({ meta: { id: PACK_ID, packSchemaVersion: "0.3" } });
  assert.equal(n.meta.packSchemaVersion, "0.3");
  assert.equal(Engine.packCheck(n).warnings.length, 1);
  assert.equal(Engine.migratePack(n).meta.packSchemaVersion, "0.3");
  for (const v of ["0.1", "0.2", "0.0", "junk", undefined, 3]) {
    const m = Engine.migratePack({ meta: { id: PACK_ID, packSchemaVersion: v } });
    assert.equal(m.meta.packSchemaVersion, "0.2", String(v));
    assert.equal(Engine.packCheck(m).warnings.length, 0);
  }
  assert.notEqual(Engine.packCheck(null).refuse, null);
});

test("a __proto__ key at the pack, meta, entry, block and group levels pollutes nothing", () => {
  const raw = '{"__proto__":{"pwn":1},"meta":{"__proto__":{"pwn":1},"id":"' + PACK_ID + '"},"entries":[{"__proto__":{"pwn":1},"id":"a","block":{"__proto__":{"pwn":1},"stats":{"__proto__":{"pwn":1}}}}],"groups":[{"__proto__":{"pwn":1},"id":"g","members":[{"__proto__":{"pwn":1},"entry":"a"}]}]}';
  const m = Engine.migratePack(JSON.parse(raw));
  assert.equal(({}).pwn, undefined);
  assert.equal(m.entries.length, 1); assert.equal(m.groups[0].members.length, 1);
});

const twoPacks = () => {
  const a = Engine.migratePack(syntheticPack());
  const b = Engine.migratePack(syntheticPack({
    meta: { ...syntheticPack().meta, id: "PK-ZZZZ9999", name: "Second" },
    origins: [{ id: "o1", name: "DOCK", text: "again" }, { id: "o2", name: "Alley", text: "" }],
    npcRoles: [], enemyRoles: [{ id: "e1", name: "bruiser", text: "" }],
    entries: [{ id: "sly", name: "Sly", ref: "Z-9", origin: "o1", enemyRole: "e1", tier: 1 }, { id: "ab", name: "Ab", origin: "o2", tier: 3 }],
    groups: [] }));
  return [a, b];
};

test("packFilter: each filter alone, case-folded across two packs; people apart from threats", () => {
  const packs = twoPacks();
  const names = f => Engine.packFilter(packs, f).map(x => x.entry.name).join();
  assert.equal(names({}), "Wren,Gull,Sly,Ab", "threats only, packs in the order given");
  assert.equal(names({ view: "npc" }), "Moss");
  assert.equal(names({ origin: "dock" }), "Gull,Sly", "two packs' Dock are one choice");
  assert.equal(names({ enemyRole: "BRUISER" }), "Wren,Gull,Sly");
  assert.equal(names({ view: "npc", npcRole: "lookout" }), "Moss");
  assert.equal(names({ npcRole: "lookout" }), "Wren");
  assert.equal(names({ tier: 1 }), "Gull,Sly"); assert.equal(names({ tier: "3" }), "Ab");
  assert.equal(names({ origin: "dock", tier: 2 }), "");
  assert.equal(names({ q: "spire" }), "Wren", "q reads the origin's name");
  assert.equal(names({ q: "entry 01" }), "Gull", "q reads the ref");
  assert.equal(names({ q: "QUICK" }), "Wren", "q reads the flavor");
  assert.equal(names({ q: "bruis" }), "Wren,Gull,Sly", "q reads the role names");
  assert.equal(names({ q: "z-9" }), "Sly");
  assert.equal(Engine.packFilter(null, {}).length, 0);
  assert.equal(Engine.packFilter([5, null, {}], null).length, 0);
});

test("packFilter keeps each pack's own order, not A–Z", () => {
  const p = Engine.migratePack(syntheticPack());
  assert.equal(Engine.packFilter([p], {}).map(x => x.entry.name).join(), "Wren,Gull", "the fixture isn't alphabetical");
  p.entries.reverse();
  assert.equal(Engine.packFilter([p], {}).map(x => x.entry.name).join(), "Gull,Wren", "and the order is the pack's, both ways");
});

test("packChoices: distinct, first spelling, A–Z; tiers ascending", () => {
  const c = Engine.packChoices(twoPacks());
  eq(c.origins, ["Alley", "Dock", "Spire"]);
  eq(c.npcRoles, ["Gatherer", "Lookout"]);
  eq(c.enemyRoles, ["Bruiser"]);
  eq(c.tiers, [1, 2, 3]);
  eq(Engine.packChoices(null), { origins: [], npcRoles: [], enemyRoles: [], tiers: [], traitOrigins: [] });
});

test("packEntry and packGroups read the records, not the ids", () => {
  const packs = twoPacks();
  const f = Engine.packEntry(packs, PACK_ID, "moss");
  assert.equal(f.entry.name, "Moss"); assert.equal(f.origin.name, "Dock");
  eq(f.npcRoles.map(r => r.name), ["Gatherer", "Lookout"]); assert.equal(f.enemyRole, null);
  assert.equal(Engine.packEntry(packs, PACK_ID, "nope"), null);
  assert.equal(Engine.packEntry(packs, "PK-NOPE0000", "moss"), null);
  assert.equal(Engine.packEntry(null, null, null), null);
  const g = Engine.packGroups(packs, {});
  assert.equal(g.length, 1); assert.equal(g[0].members.map(x => x.count + "x" + x.entry.name).join(), "3xGull,1xWren");
  assert.equal(Engine.packGroups(packs, { q: "pier" }).length, 1);
  assert.equal(Engine.packGroups(packs, { q: "gull" }).length, 1, "q reads a member's name");
  assert.equal(Engine.packGroups(packs, { q: "zzz" }).length, 0);
});

test("castFromEntry: first in the cast, names not ids, a block that's a copy, and where it came from", () => {
  const pack = Engine.migratePack(syntheticPack());
  const t = Engine.newTable("T"); Engine.addCastMember(t, { name: "Earlier" });
  const r = Engine.castFromEntry(t, pack, "moss");
  assert.equal(r.ok, true); assert.equal(t.cast[0].id, r.id); assert.equal(t.cast.length, 2);
  const n = t.cast[0];
  assert.equal(n.name, "Moss"); assert.equal(n.origin, "Dock"); eq(n.npcRoles, ["Gatherer", "Lookout"]);
  assert.equal(n.motivation, "Quiet money."); assert.equal(n.line, "Never the kids."); assert.equal(n.status, "alive");
  eq(n.affiliations, []);
  eq(n.from, { kind: "entry", pack: PACK_ID, id: "moss", name: "Moss" });
  const w = Engine.castFromEntry(t, pack, "wren"); const wn = t.cast[0];
  assert.equal(wn.enemyRole, "Bruiser"); assert.equal(wn.tier, 2);
  assert.equal(JSON.stringify(Engine.npc(wn.block)), JSON.stringify(Engine.npc(pack.entries[0].block)));
  pack.entries[0].block.stats.BOD = 99; pack.entries[0].block.traits[0].text = "changed"; pack.entries[0].name = "Renamed";
  assert.equal(wn.block.stats.BOD, 5, "the member's block doesn't move with the pack's");
  assert.equal(wn.block.traits[0].text, "Never falls far.");
  assert.equal(wn.name, "Wren");
  assert.equal(w.ok, true);
  assert.equal(JSON.stringify(Engine.migrateTable(t).cast[0].from), JSON.stringify(wn.from), "from survives the gate");
  const bad = Engine.castFromEntry(t, pack, "nope");
  assert.equal(bad.ok, false); assert.equal(bad.why, "No such entry.");
  assert.equal(Engine.castFromEntry(t, null, "x").ok, false);
  assert.equal(t.cast.length, 3);
});

test("entryLink: here, the pack gone, the entry gone from a newer pack; junk doesn't throw", () => {
  const pack = Engine.migratePack(syntheticPack());
  const from = { kind: "entry", pack: PACK_ID, id: "gull", name: "Gull" };
  eq(Engine.entryLink([pack], from), { name: "Gull", packId: PACK_ID, id: "gull", here: true });
  assert.equal(Engine.entryLink([], from).here, false);
  assert.equal(Engine.entryLink([], from).name, "Gull");
  const newer = Engine.migratePack(syntheticPack({ entries: [] }));
  assert.equal(Engine.entryLink([newer], from).here, false);
  for (const x of [null, "x", 5, {}, [], { kind: "entry" }]) assert.equal(Engine.entryLink(null, x).here, false);
  assert.equal(Engine.entryLink(undefined, from).here, false);
  assert.equal(Engine.entryLink([5, null], from).here, false);
});

test("a 0.3 table migrates to 0.4 with from: null, and the rest is byte-identical; junk from is null, a valid one kept", () => {
  const old = Engine.newTable("Three");
  Engine.addCastMember(old, { name: "Dez" }); Engine.addCastMember(old, { name: "Ivo" });
  Engine.addTableNote(old, { title: "A", text: "one" });
  for (const n of old.cast) delete n.from;
  old.meta.tableSchemaVersion = "0.3";
  const m = Engine.migrateTable(old);
  assert.equal(m.meta.tableSchemaVersion, "0.9");
  for (const n of m.cast) assert.equal(n.from, null);
  const strip = t => { const c = plain(t); delete c.meta.tableSchemaVersion; for (const n of c.cast) delete n.from; return JSON.stringify(c); };
  assert.equal(strip(m), strip(old));
  const ok = { kind: "entry", pack: PACK_ID, id: "gull", name: "Gull" };
  const j = Engine.migrateTable({ meta: { tableSchemaVersion: "0.5" }, cast: [
    { from: ok }, { from: "x" }, { from: { kind: "cast", pack: PACK_ID, id: "gull", name: "x" } }, { from: { ...ok, pack: "PK-bad" } },
    { from: { ...ok, id: "bad id!" } }, { from: { ...ok, name: 5 } }, {}] });
  eq(j.cast[0].from, ok);
  for (const n of j.cast.slice(1)) assert.equal(n.from, null);
});

test("gm.js may add a tip kind to shared.js's TIPS, never replace one (the script-scope guard)", () => {
  const shared = readFileSync(join(ROOT, "src/ui/shared.js"), "utf8");
  const block = /const TIPS = \{([\s\S]*?)\n\};/.exec(shared);
  assert.ok(block, "shared.js's TIPS object moved");
  const have = new Set([...block[1].matchAll(/^  (\w+):/gm)].map(m => m[1]));
  assert.ok(have.has("tag") && have.has("stat"), "the guard didn't read shared.js's tip kinds: " + [...have]);
  const gm = readFileSync(join(ROOT, "src/ui/gm.js"), "utf8");
  const added = [...gm.matchAll(/\bTIPS\.(\w+)\s*=[^=]/g)].map(m => m[1]).concat([...gm.matchAll(/\bTIPS\[["'](\w+)["']\]\s*=[^=]/g)].map(m => m[1]));
  assert.ok(added.includes("packrec"), "the guard didn't see gm.js's tip kind");
  for (const k of added) assert.ok(!have.has(k), `gm.js assigns TIPS.${k}, which shared.js already defines`);
});

// ── Packs 0.2 and the builder (Decisions 183–185) ──────────────────────────
test("migratePack 0.2 over junk: modifiers, traits and guides come out valid or dropped", () => {
  const raw = syntheticPack();
  raw.origins[0].modifiers = JSON.parse('{ "BOD": "2", "XYZ": 3, "MOB": 0, "REF": 1.5, "__proto__": { "pwn": 1 } }');
  raw.origins[1].modifiers = "x";
  raw.tiers[0].statGuide = 5; raw.tiers[1].traitGuide = { a: 1 };
  raw.traits = [null, 5, {}, { id: "bad id!", name: "Bad" }, { id: "a", name: "A", kind: "SIGNATURE", origin: "dock", extra: 1 },
    { id: "a", name: "Dup" }, { id: "b", kind: "weird", origin: "nowhere", name: 7, text: null }];
  const m = Engine.migratePack(raw);
  eq(m.origins[0].modifiers, { BOD: 2 }); eq(m.origins[1].modifiers, {});
  assert.equal(m.tiers[0].statGuide, ""); assert.equal(m.tiers[1].traitGuide, "");
  eq(m.traits.map(t => t.id), ["a", "b"]);
  assert.equal(m.traits[0].kind, "signature"); assert.equal(m.traits[0].origin, "dock"); assert.equal(m.traits[0].extra, 1);
  assert.equal(m.traits[1].kind, null); assert.equal(m.traits[1].origin, null);
  assert.equal(m.traits[1].name, ""); assert.equal(m.traits[1].text, "");
  assert.equal(JSON.stringify(Engine.migratePack(m)), JSON.stringify(m), "idempotent");
  assert.equal(({}).pwn, undefined);
  const bare = Engine.migratePack({ meta: { id: PACK_ID }, origins: [{ id: "o" }], tiers: [{ id: 1 }] });
  eq(bare.traits, []); eq(bare.origins[0].modifiers, {}); assert.equal(bare.tiers[0].statGuide, "");
});

test("a 0.1 pack reads as 0.2: stamped, no traits or modifiers, the rest identical; its ad-hoc traits key is gated", () => {
  const old = syntheticPack01();
  const m = Engine.migratePack(old);
  assert.equal(m.meta.packSchemaVersion, "0.2");
  eq(m.traits, []);
  eq(m.origins.map(o => [o.id, o.name, o.text, o.modifiers]), old.origins.map(o => [o.id, o.name, o.text, {}]));
  eq(m.tiers.map(t => [t.id, t.name, t.text, t.statGuide, t.traitGuide]), old.tiers.map(t => [t.id, t.name, t.text, "", ""]));
  const now = Engine.migratePack(syntheticPack());
  for (const k of ["npcRoles", "enemyRoles", "entries", "groups"]) eq(m[k], now[k], k);
  const adhoc = syntheticPack01(); adhoc.traits = [{ id: "t", kind: "UNIVERSAL", name: 4 }];
  const g = Engine.migratePack(adhoc);
  assert.equal(g.traits[0].kind, "universal"); assert.equal(g.traits[0].name, "");
});

test("packTraits: each filter, name and text, a folded origin across packs, the packs' order", () => {
  const a = Engine.migratePack(syntheticPack());
  const b = Engine.migratePack(syntheticPack({
    meta: { ...syntheticPack().meta, id: "PK-ZZZZ9999", name: "Second" },
    origins: [{ id: "o1", name: "DOCK", text: "" }],
    traits: [{ id: "x", name: "Barnacle", kind: "origin", origin: "o1", text: "Clings." }] }));
  const names = f => Engine.packTraits([a, b], f).map(x => x.trait.name).join();
  assert.equal(names({}), "Salt Nerve,Pier Legs,Gull's Cry,Rope Trick,Barnacle", "pack order, not A–Z");
  assert.equal(names({ kind: "signature" }), "Gull's Cry");
  assert.equal(names({ kind: "weird" }), names({}), "an unknown kind is no filter");
  assert.equal(names({ origin: "dock" }), "Pier Legs,Gull's Cry,Barnacle", "two packs' Dock are one");
  assert.equal(names({ q: "ROPE" }), "Rope Trick"); assert.equal(names({ q: "everyone nearby" }), "Gull's Cry", "text too");
  assert.equal(names({ q: "nothing" }), "");
  assert.equal(Engine.packTraits([a, b], {}).map(x => x.pack.meta.name).pop(), "Second");
  eq(Engine.packTraits(null, null), []);
  eq(Engine.packChoices([a, b]).traitOrigins, ["Dock", "Spire"]);
});

test("castPackMatch: folded names, a role list part matched, tier by id, the first pack wins, counts by kind", () => {
  const a = Engine.migratePack(syntheticPack());
  const b = Engine.migratePack(syntheticPack({
    meta: { ...syntheticPack().meta, id: "PK-ZZZZ9999", name: "Second" },
    origins: [{ id: "o1", name: "DOCK", text: "" }], tiers: [{ id: 2, name: "Other", text: "" }, { id: 3, name: "Heavy", text: "" }] }));
  const member = { origin: " dock ", npcRoles: ["Lookout", "Nobody"], enemyRole: "BRUISER", tier: 2,
    block: { traits: [{ name: "gull's cry", text: "x" }, { name: "Salt Nerve" }, { name: "Rope Trick" }, { name: "Mine" }, { name: "Gull's Cry (mine)" }] } };
  const r = Engine.castPackMatch([a, b], member);
  assert.equal(r.origin.rec.id, "dock"); assert.equal(r.origin.pack, a, "the first pack with a match");
  eq(r.npcRoles.map(x => [x.name, x.rec && x.rec.id]), [["Lookout", "lookout"], ["Nobody", null]]);
  assert.equal(r.enemyRole.rec.id, "bruiser");
  assert.equal(r.tier.rec.name, "Middling"); assert.equal(r.tier.pack, a);
  assert.equal(Engine.castPackMatch([b], { tier: 3 }).tier.rec.name, "Heavy");
  eq(r.counts, { total: 5, universal: 1, origin: 1, signature: 1, written: 2 });
  eq(r.traits.map(t => t.rec && t.rec.id), ["gulls-cry", "salt-nerve", "rope-trick", null, null]);
  const kindless = syntheticPack(); kindless.traits[0].kind = null;
  assert.equal(Engine.castPackMatch([Engine.migratePack(kindless)], { block: { traits: [{ name: "Salt Nerve" }] } }).counts.written, 1, "a glossary entry with no kind is written");
  assert.equal(Engine.castPackMatch([], member).origin, null);
  for (const x of [null, "x", 5, { block: "x" }, { block: { traits: "x" } }, { npcRoles: 5, tier: "z" }, {}]) {
    const e = Engine.castPackMatch([a, null, 5], x);
    assert.equal(e.origin, null); assert.equal(e.enemyRole, null); assert.equal(e.tier, null);
    eq(e.npcRoles, []); eq(e.traits, []); eq(e.counts, { total: 0, universal: 0, origin: 0, signature: 0, written: 0 });
  }
  eq(Engine.castPackMatch(null, member).counts.written, 5);
});

test("nothing stored: castPackMatch and packTraits leave the member and the pack as they were", () => {
  const p = Engine.migratePack(syntheticPack());
  const member = { origin: "Dock", npcRoles: ["Lookout"], enemyRole: "Bruiser", tier: 2, block: { stats: { BOD: 5 }, traits: [{ name: "Pier Legs", text: "t" }] } };
  const before = JSON.stringify([p, member]);
  Engine.castPackMatch([p], member); Engine.packTraits([p], { q: "a", kind: "origin", origin: "dock" }); Engine.packChoices([p]);
  assert.equal(JSON.stringify([p, member]), before);
});

test("castPackMatch: a row with neither name nor text isn't counted, but still comes back in block order", () => {
  const p = Engine.migratePack(syntheticPack());
  const r = Engine.castPackMatch([p], { block: { traits: [{ name: "", text: "" }, { name: "Gull's Cry", text: "" }, { name: "  ", text: "x" }] } });
  assert.equal(r.traits.length, 3);
  eq(r.counts, { total: 2, universal: 0, origin: 0, signature: 1, written: 1 });
  eq(Engine.castPackMatch([p], { block: { traits: [{ name: "", text: "" }, { name: " ", text: " " }] } }).counts, { total: 0, universal: 0, origin: 0, signature: 0, written: 0 });
});

// ── Apostrophes fold in name matching (Decision 187) ───────────────────────
test("187: ’ ‘ and ʼ read as ' in castPackMatch, whichever side carries them", () => {
  const p = Engine.migratePack(syntheticPack());   // the glossary spells it Gull's Cry
  for (const mark of ["’", "‘", "ʼ"]) {
    const r = Engine.castPackMatch([p], { block: { traits: [{ name: `Gull${mark}s Cry`, text: "x" }] } });
    assert.equal(r.traits[0].rec && r.traits[0].rec.id, "gulls-cry", `${mark} matches '`);
    eq(r.counts, { total: 1, universal: 0, origin: 0, signature: 1, written: 0 });
  }
  const typo = syntheticPack(); typo.traits.find(t => t.id === "gulls-cry").name = "Gull’s Cry";
  const r = Engine.castPackMatch([Engine.migratePack(typo)], { block: { traits: [{ name: "Gull's Cry", text: "x" }] } });
  assert.equal(r.counts.written, 0, "and the glossary may be the typographic one");
});

test("187: packTraits, packFilter, packGroups and castFilter fold the haystack as well as the query", () => {
  const raw = syntheticPack();
  raw.traits.find(t => t.id === "gulls-cry").name = "Gull’s Cry";
  raw.entries.find(e => e.id === "gull").name = "Gull’s Mate";
  raw.groups[0].name = "Gull’s Pier";
  const p = Engine.migratePack(raw);
  const traits = q => Engine.packTraits([p], { q }).map(x => x.trait.name).join();
  assert.equal(traits("gull's"), "Gull’s Cry", "a straight query finds a curly name");
  assert.equal(traits("gull’s"), "Gull’s Cry", "and a curly one finds it too");
  assert.equal(traits("gullʼs cry"), "Gull’s Cry");
  const entries = q => Engine.packFilter([p], { q }).map(x => x.entry.name).join();
  assert.equal(entries("gull's"), "Gull’s Mate"); assert.equal(entries("GULL‘S"), "Gull’s Mate");
  const groups = q => Engine.packGroups([p], { q }).map(x => x.group.name).join();
  assert.equal(groups("gull's"), "Gull’s Pier"); assert.equal(groups("gull’s mate"), "Gull’s Pier", "a member's name");
  const t = Engine.newTable("T");
  Engine.addCastMember(t, { name: "O’Hara" }); Engine.addCastMember(t, { name: "Plain" });
  assert.equal(Engine.castFilter(t, { q: "o'hara" }).map(n => n.name).join(), "O’Hara");
  assert.equal(Engine.castFilter(t, { q: "o’hara" }).length, 1);
});

test("187: crewView's search folds apostrophes too", () => {
  const t = Engine.newTable("T");
  Engine.addCastMember(t, { name: "Dez" });
  Engine.addInteraction(t, { kind: "shared", text: "Told them about Marta’s place.", crew: ["Wren"], cast: [t.cast[0].id] });
  assert.equal(Engine.crewView(t, { q: "marta's" }).length, 1);
  assert.equal(Engine.crewView(t, { q: "marta’s" }).length, 1);
  assert.equal(Engine.crewView(t, { q: "marta‘x" }).length, 0);
});

test("187: castAffiliations and packChoices list a name once when it differs only by an apostrophe", () => {
  const t = Engine.newTable("T");
  Engine.addCastMember(t, { name: "A" }); Engine.addCastMember(t, { name: "B" });
  Engine.editCastMember(t, t.cast[1].id, { affiliations: ["Harbor’s Own"] });
  Engine.editCastMember(t, t.cast[0].id, { affiliations: ["harbor's own", "Other"] });
  eq(Engine.castAffiliations(t), ["Harbor’s Own", "Other"]);
  const a = Engine.migratePack(syntheticPack({
    origins: [{ id: "o1", name: "Gull’s Reach", text: "" }],
    traits: [{ id: "x", name: "X", kind: "origin", origin: "o1", text: "" }] }));
  const b = Engine.migratePack(syntheticPack({
    meta: { ...syntheticPack().meta, id: "PK-ZZZZ9999", name: "Second" },
    origins: [{ id: "o1", name: "GULL'S REACH", text: "" }],
    traits: [{ id: "x", name: "X", kind: "origin", origin: "o1", text: "" }] }));
  const c = Engine.packChoices([a, b]);
  eq(c.origins, ["Gull’s Reach"]); eq(c.traitOrigins, ["Gull’s Reach"]);
});

// ── Encounters (Decisions 188–190) ─────────────────────────────────────────
const LOC = D.bodyLocations[0].id;
/** A table with one planned encounter and a cast of two (Dez with a block, Ivo without). */
function encTable() {
  const t = Engine.newTable("T");
  Engine.addCastMember(t, { name: "Ivo" });
  Engine.addCastMember(t, { name: "Dez" });
  const dez = t.cast.find(n => n.name === "Dez"), ivo = t.cast.find(n => n.name === "Ivo");
  Engine.setCastBlock(t, dez.id, { stats: { BOD: 6 }, skills: [{ name: "Awareness", total: 7, skill: "awareness" }] });
  const e = Engine.addEncounter(t, { name: "Warehouse" }).id;
  return { t, e, dez, ivo };
}
const addPc = (t, e, name = "Wren", f = {}) => {
  const r = Engine.addParticipant(t, e, { kind: "pc", name });
  assert.ok(r.ok, r.why);
  if (Object.keys(f).length) assert.ok(Engine.editParticipant(t, e, r.id, f).ok);
  return r.id;
};
const encOf = (t, e) => t.encounters.find(x => x.id === e);
const rowOf = (t, e, id) => encOf(t, e).rows.find(r => r.id === id);
const viewRow = (t, e, id) => Engine.encounterView(t, e, []).rows.find(r => r.row.id === id);

test("188: newTable has encounters, and a 0.4 table migrates to 0.5 with none and everything else untouched", () => {
  assert.equal(JSON.stringify(Engine.newTable().encounters), "[]");
  const old = Engine.newTable("Old");
  Engine.addCastMember(old, { name: "Dez" });
  Engine.addTableNote(old, { title: "A", text: "one" });
  Engine.addInteraction(old, { kind: "shared", text: "x", cast: [old.cast[0].id] });
  delete old.encounters;
  old.meta.tableSchemaVersion = "0.4";
  const m = Engine.migrateTable(old);
  assert.equal(m.meta.tableSchemaVersion, "0.9");
  eq(m.encounters, []);
  eq(m.cast, old.cast); eq(m.notes, old.notes); eq(m.interactions, old.interactions);
});

test("188: any number of encounters can be planned; one runs at a time, and an ended one frees the slot", () => {
  const { t, e } = encTable();
  const e2 = Engine.addEncounter(t, { name: "Docks" }).id, e3 = Engine.addEncounter(t, {}).id;
  assert.equal(t.encounters.filter(x => x.status === "planned").length, 3);
  assert.equal(t.encounters[0].id, e3, "newest first");
  for (const id of [e, e2]) addPc(t, id);
  assert.ok(Engine.startEncounter(t, e).ok);
  assert.equal(Engine.runningEncounter(t).id, e);
  const refused = Engine.startEncounter(t, e2);
  assert.equal(refused.ok, false);
  assert.match(refused.why, /Warehouse is still running\. End it first\./);
  assert.equal(encOf(t, e2).status, "planned");
  assert.ok(Engine.endEncounter(t, e).ok);
  assert.ok(Engine.startEncounter(t, e2).ok);
  assert.equal(Engine.endEncounter(t, e3).ok, true, "a planned one ends unrun");
  assert.equal(encOf(t, e3).round, 0);
  assert.equal(Engine.startEncounter(t, e3).ok, false);
});

test("188: a blank name reads as the day it was made", () => {
  const t = Engine.newTable("T");
  const id = Engine.addEncounter(t, { name: "  " }).id;
  assert.match(Engine.encounterView(t, id, []).title, /^Encounter \d{4}-\d{2}-\d{2}$/);
});

test("188: startEncounter wants someone in it who isn't out", () => {
  const { t, e } = encTable();
  assert.equal(Engine.startEncounter(t, e).why, "Add someone to the encounter first.");
  const a = addPc(t, e, "A", { out: true });
  assert.equal(Engine.startEncounter(t, e).ok, false);
  assert.ok(Engine.editParticipant(t, e, a, { out: false }).ok);
  assert.ok(Engine.startEncounter(t, e).ok);
});

test("188: addParticipant: a PC needs a name, a cast member can be in once, and the row is linked", () => {
  const { t, e, dez } = encTable();
  assert.equal(Engine.addParticipant(t, e, { kind: "pc", name: "   " }).ok, false);
  assert.equal(Engine.addParticipant(t, e, { kind: "cast", id: "C-ZZZZZZZZ" }).ok, false);
  const r = Engine.addParticipant(t, e, { kind: "cast", id: dez.id });
  assert.ok(r.ok);
  eq(rowOf(t, e, r.id).cast, { kind: "cast", id: dez.id, name: "Dez" });
  assert.equal(rowOf(t, e, r.id).block, null, "a cast row reads the member live, it has no copy");
  const again = Engine.addParticipant(t, e, { kind: "cast", id: dez.id });
  assert.equal(again.ok, false); assert.equal(again.why, "Already in.");
  assert.equal(encOf(t, e).rows.length, 1);
});

test("188: participantFromEntry copies the block: two rows, X and X 2, nothing shared with each other or the pack", () => {
  const { t, e } = encTable();
  const pack = Engine.migratePack(syntheticPack()), before = JSON.stringify(pack);
  const a = Engine.participantFromEntry(t, e, pack, "gull"), b = Engine.participantFromEntry(t, e, pack, "gull"), c = Engine.participantFromEntry(t, e, pack, "gull");
  eq([a, b, c].map(r => rowOf(t, e, r.id).name), ["Gull", "Gull 2", "Gull 3"]);
  const ra = rowOf(t, e, a.id), rb = rowOf(t, e, b.id);
  assert.notEqual(ra.block, rb.block);
  assert.notEqual(ra.block, pack.entries.find(x => x.id === "gull").block);
  eq(ra.from, { kind: "entry", pack: PACK_ID, id: "gull", name: "Gull" });
  ra.block.stats.BOD = 99; ra.block.traits.push({ name: "x", text: "y" });
  assert.equal(rb.block.stats.BOD, 8);
  assert.equal(JSON.stringify(pack), before, "the pack is untouched");
  assert.equal(Engine.participantFromEntry(t, e, pack, "nobody").ok, false);
  assert.equal(t.cast.length, 2, "the cast is untouched");
});

test("188: participantsFromGroup adds every member x its count; a group of nobody is refused", () => {
  const { t, e } = encTable();
  const pack = Engine.migratePack(syntheticPack());
  const r = Engine.participantsFromGroup(t, e, pack, "pier-watch");
  assert.ok(r.ok); assert.equal(r.ids.length, 4);
  eq(encOf(t, e).rows.map(x => x.name), ["Gull", "Gull 2", "Gull 3", "Wren"]);
  const empty = Engine.migratePack(syntheticPack());
  empty.groups[0].members = [{ entry: "gone", count: 2 }];
  const before = JSON.stringify(t);
  assert.equal(Engine.participantsFromGroup(t, e, empty, "pier-watch").ok, false);
  assert.equal(Engine.participantsFromGroup(t, e, pack, "no-such").ok, false);
  assert.equal(JSON.stringify(t), before);
});

test("189: encounterView orders by result, blanks after in the order added, Goes last after all, and flags ties", () => {
  const { t, e } = encTable();
  addPc(t, e, "A", { order: 5 }); addPc(t, e, "B"); addPc(t, e, "C", { order: 9 }); const d = addPc(t, e, "D", { order: 5 });
  addPc(t, e, "Z", { order: 99, last: true }); addPc(t, e, "Y", { order: 99, last: true }); addPc(t, e, "W", { last: true });
  const v = Engine.encounterView(t, e, []);
  eq(v.rows.map(r => r.name), ["C", "A", "D", "B", "Z", "Y", "W"]);
  const tied = Object.fromEntries(v.rows.map(r => [r.name, r.ties]));
  eq(tied, { C: false, A: true, D: true, B: false, Z: false, Y: false, W: false }, "ties on both rows, never on a last one");
  assert.ok(Engine.editParticipant(t, e, d, { order: 6 }).ok);
  assert.equal(Engine.encounterView(t, e, []).rows.some(r => r.ties), false);
});

test("189: health for each kind of row, and what's missing is null", () => {
  const { t, e, dez, ivo } = encTable();
  const pack = Engine.migratePack(syntheticPack());
  const p1 = addPc(t, e, "P1", { hp: 30 });
  Engine.participantDamage(t, e, p1, 12);
  let h = viewRow(t, e, p1).health;
  eq([h.taken, h.total, h.left, h.down, h.levels, h.levelsLeft], [12, 30, 18, false, null, null]);
  assert.equal(h.pain, null);
  const p2 = addPc(t, e, "P2", { hp: 30, levels: 6 });
  Engine.participantDamage(t, e, p2, 12);
  h = viewRow(t, e, p2).health;
  eq([h.taken, h.total, h.left, h.levels, h.levelsLeft], [12, 30, 18, 6, 4]);
  assert.equal(h.pain.level, Engine.painFor(2, 0).level);
  assert.equal(h.pain.label, Engine.painFor(2, 0).label);
  const p3 = addPc(t, e, "P3", { hp: 31, levels: 6 });
  Engine.participantDamage(t, e, p3, 12);
  h = viewRow(t, e, p3).health;
  eq([h.total, h.left, h.levels, h.levelsLeft], [31, 19, null, null]);
  const p4 = addPc(t, e, "P4");
  Engine.participantDamage(t, e, p4, 7);
  h = viewRow(t, e, p4).health;
  eq([h.taken, h.total, h.left, h.down, h.levels, h.pain], [7, null, null, false, null, null]);
  const p5 = addPc(t, e, "P5", { levels: 6 });
  assert.equal(viewRow(t, e, p5).health.levels, null);
  const c1 = Engine.addParticipant(t, e, { kind: "cast", id: dez.id }).id;
  Engine.participantDamage(t, e, c1, 40);
  h = viewRow(t, e, c1).health;
  eq([h.total, h.left, h.levels, h.levelsLeft, h.down], [30, 0, 6, 0, true], "floored at 0, and down");
  assert.equal(viewRow(t, e, c1).awareness, 7);
  const c2 = Engine.addParticipant(t, e, { kind: "cast", id: ivo.id }).id;
  Engine.participantDamage(t, e, c2, 5);
  h = viewRow(t, e, c2).health;
  eq([h.taken, h.total, h.left, h.levels], [5, null, null, null]);
  pack.entries.find(x => x.id === "gull").block.skills = [{ name: "Awareness", total: 4, skill: "awareness" }];
  const en = Engine.participantFromEntry(t, e, pack, "gull").id;
  h = viewRow(t, e, en).health;
  eq([h.total, h.levels], [40, 8]);
  assert.equal(viewRow(t, e, en).awareness, 4);
  assert.equal(viewRow(t, e, p1).awareness, null);
  assert.ok(Engine.editParticipant(t, e, p1, { awareness: 6 }).ok);
  assert.equal(viewRow(t, e, p1).awareness, 6);
});

test("189: a cast row whose member was removed keeps its name and shows taken only", () => {
  const { t, e, dez } = encTable();
  const c = Engine.addParticipant(t, e, { kind: "cast", id: dez.id }).id;
  Engine.participantDamage(t, e, c, 8);
  Engine.editCastMember(t, dez.id, { name: "Dez the Younger" });
  assert.equal(viewRow(t, e, c).name, "Dez the Younger", "a link reads the member's current name");
  Engine.removeCastMember(t, dez.id);
  const r = viewRow(t, e, c);
  assert.equal(r.name, "Dez the Younger"); assert.equal(r.gone, true);
  eq([r.health.taken, r.health.total, r.health.left, r.health.levels], [8, null, null, null]);
  assert.equal(r.awareness, null);
});

test("189: painFor holds to painState at every count of levels lost, with Agonized and without (the parity test)", () => {
  const ch = subject({ bod: 6 });
  const hs = Engine.hlState(ch);
  assert.equal(hs.levels, 6);
  for (const agonized of [false, true]) {
    ch.trackers.conditions = agonized ? [{ id: "agonized" }] : [];
    for (let k = 0; k <= hs.levels; k++) {
      ch.trackers.damage = k * hs.hpPer;
      const sheet = Engine.painState(ch), mine = Engine.painFor(k, agonized ? 1 : 0);
      assert.equal(sheet.hlLost, k);
      assert.equal(mine.level, sheet.level, `${k} lost, agonized ${agonized}`);
      assert.equal(mine.label, sheet.label);
    }
  }
});

test("189: on a row, levels lost give the band, Agonized adds one, and the clamp holds at the top", () => {
  const { t, e } = encTable();
  const p = addPc(t, e, "P", { hp: 30, levels: 6 });
  const pain = () => viewRow(t, e, p).health.pain;
  Engine.participantDamage(t, e, p, 5);
  assert.equal(pain().level, 0);
  Engine.participantDamage(t, e, p, 5);
  assert.equal(pain().level, 1, "two levels lost");
  assert.ok(Engine.participantAddCondition(t, e, p, { id: "agonized" }).ok);
  assert.equal(pain().level, 2);
  assert.equal(pain().fromConditions, 1);
  Engine.participantDamage(t, e, p, 100);
  const top = D.resources.healthLevels.painLevels.reduce((m, x) => Math.max(m, x.level), 0);
  assert.equal(pain().level, top, "never above the table");
  const q = addPc(t, e, "Q");
  assert.equal(viewRow(t, e, q).health.pain, null);
  Engine.participantAddCondition(t, e, q, { id: "agonized" });
  assert.equal(viewRow(t, e, q).health.pain.level, 1);
});

test("189: participantDamage: negative heals, floored at 0, a non-integer refused", () => {
  const { t, e } = encTable();
  const p = addPc(t, e);
  assert.ok(Engine.participantDamage(t, e, p, 10).ok);
  assert.ok(Engine.participantDamage(t, e, p, -4).ok);
  assert.equal(rowOf(t, e, p).damage, 6);
  assert.ok(Engine.participantDamage(t, e, p, -50).ok);
  assert.equal(rowOf(t, e, p).damage, 0);
  for (const bad of [1.5, "x", NaN, null, undefined, {}, Infinity]) {
    assert.equal(Engine.participantDamage(t, e, p, bad).ok, false, String(bad));
    assert.equal(rowOf(t, e, p).damage, 0);
  }
});

test("189: participantAddCondition: addCondition's refusals word for word, a body part when needed, rounds a whole number or none", () => {
  const { t, e } = encTable();
  const p = addPc(t, e);
  const ch = { trackers: { conditions: [] } };
  assert.ok(Engine.participantAddCondition(t, e, p, { id: "bleeding", source: " Corner Shot ", rounds: 3 }).ok);
  assert.ok(Engine.addCondition(ch, { id: "bleeding" }).ok);
  const mine = Engine.participantAddCondition(t, e, p, { id: "bleeding" }), sheets = Engine.addCondition(ch, { id: "bleeding" });
  assert.equal(mine.ok, false); assert.equal(mine.why, sheets.why);
  assert.equal(Engine.participantAddCondition(t, e, p, { id: "nope" }).why, Engine.addCondition(ch, { id: "nope" }).why);
  assert.equal(Engine.participantAddCondition(t, e, p, { id: "injured" }).ok, false, "needs a body part");
  assert.ok(Engine.participantAddCondition(t, e, p, { id: "injured", location: LOC }).ok);
  assert.equal(Engine.participantAddCondition(t, e, p, { id: "injured", location: LOC }).ok, false);
  const [bleed] = rowOf(t, e, p).conditions;
  assert.equal(bleed.source, "Corner Shot"); assert.equal(bleed.rounds, 3);
  const ids = ["blinded", "deafened", "desynced", "disarmed", "agonized", "burning"];
  [0, -1, "x", 1.5, null, undefined].forEach((bad, i) => {
    assert.ok(Engine.participantAddCondition(t, e, p, { id: ids[i], rounds: bad }).ok, ids[i]);
    assert.equal(rowOf(t, e, p).conditions.at(-1).rounds, null, String(bad));
  });
  assert.ok(Engine.participantAddCondition(t, e, p, { id: "dying" }).ok);
  const di = rowOf(t, e, p).conditions.length - 1;
  assert.ok(Engine.participantConditionMarks(t, e, p, di, 2).ok);
  assert.equal(rowOf(t, e, p).conditions[di].marks, 2);
  assert.equal(Engine.participantConditionMarks(t, e, p, 0, 1).ok, false, "Bleeding has no counter");
  assert.ok(Engine.participantRemoveCondition(t, e, p, 0).ok);
  assert.equal(Engine.participantRemoveCondition(t, e, p, 99).ok, false);
});

test("189: Start, Next (skips Out, reset after the last), setTurn, and removing the active row moves the turn", () => {
  const { t, e } = encTable();
  const a = addPc(t, e, "A", { order: 9 }), b = addPc(t, e, "B", { order: 8, out: true }), c = addPc(t, e, "C", { order: 7 }), d = addPc(t, e, "D", { order: 6 });
  assert.equal(Engine.nextTurn(t, e).ok, false, "not running");
  assert.ok(Engine.startEncounter(t, e).ok);
  eq([encOf(t, e).status, encOf(t, e).round, encOf(t, e).turn], ["running", 1, a]);
  assert.ok(Engine.nextTurn(t, e).ok); assert.equal(encOf(t, e).turn, c, "B is out");
  assert.equal(Engine.setTurn(t, e, b).ok, false, "an out row can't be made active");
  assert.ok(Engine.setTurn(t, e, d).ok); assert.equal(encOf(t, e).turn, d);
  assert.ok(Engine.setTurn(t, e, c).ok);
  assert.ok(Engine.removeParticipant(t, e, c).ok);
  assert.equal(encOf(t, e).turn, d, "the turn moves on");
  const last = Engine.nextTurn(t, e);
  eq([last.ok, last.reset, encOf(t, e).turn], [true, true, null]);
  assert.equal(Engine.encounterView(t, e, []).atReset, true);
  assert.equal(Engine.nextTurn(t, e).ok, false, "already at Reset");
});

test("189: resolveEncounterReset ticks, lists what runs out, what asks for a save, Dying's check; and changes nothing", () => {
  const { t, e } = encTable();
  const a = addPc(t, e, "A", { order: 9 }), b = addPc(t, e, "B", { order: 8 });
  addPc(t, e, "C", { order: 7 });
  Engine.participantAddCondition(t, e, a, { id: "bleeding", rounds: 1, source: "knife" });
  Engine.participantAddCondition(t, e, a, { id: "burning", rounds: 4 });
  Engine.participantAddCondition(t, e, a, { id: "blinded" });
  Engine.participantAddCondition(t, e, b, { id: "dying" });
  assert.ok(Engine.startEncounter(t, e).ok);
  const before = JSON.stringify(t);
  const refused = Engine.resolveEncounterReset(t, e, {});
  assert.equal(refused.ok, false);
  assert.match(refused.why, /Enter this round's Burning damage for A\. Put 0 if it's out\./);
  assert.equal(JSON.stringify(t), before);
  const zero = Engine.resolveEncounterReset(t, e, { sources: { [a]: { 1: 0 } } });
  assert.ok(zero.ok); assert.equal(zero.rows[0].ticks.find(x => x.id === "burning").hp, 0);
  const r = Engine.resolveEncounterReset(t, e, { sources: { [a]: { 1: "3" } } });
  assert.ok(r.ok);
  const [ra, rb, rc] = r.rows;
  eq(ra.ticks.map(x => [x.id, x.hp]), [["bleeding", 1], ["burning", 3]]);
  assert.equal(ra.total, 4);
  eq(ra.expiring.map(x => x.id), ["bleeding"], "rounds 1 runs out now");
  eq(ra.recovery.map(x => x.id).sort(), ["blinded", "burning"], "the rest ask for their save, as the data words it");
  assert.equal(ra.recovery.find(x => x.id === "blinded").recovery, D.conditions.find(x => x.id === "blinded").recovery);
  assert.equal(rb.dying, D.damageRules.whileDying.resetCheck);
  assert.equal(rc.dying, null); eq([rc.ticks, rc.expiring, rc.recovery], [[], [], []]);
  assert.equal(JSON.stringify(t), before, "pure");
  assert.equal(Engine.resolveEncounterReset(t, "EN-ZZZZZZZZ", {}).ok, false);
});

test("189: applyEncounterReset adds the ticks, counts rounds down, ends what ran out unless kept, and starts the next round", () => {
  const { t, e } = encTable();
  const a = addPc(t, e, "A", { order: 9 }), b = addPc(t, e, "B", { order: 8, out: true });
  Engine.participantAddCondition(t, e, a, { id: "bleeding", rounds: 1 });
  Engine.participantAddCondition(t, e, a, { id: "burning", rounds: 3 });
  Engine.participantAddCondition(t, e, a, { id: "blinded" });
  Engine.participantAddCondition(t, e, a, { id: "deafened", rounds: 1 });
  Engine.participantAddCondition(t, e, b, { id: "bleeding" });
  assert.ok(Engine.startEncounter(t, e).ok);
  assert.equal(Engine.applyEncounterReset(t, e, { sources: { [a]: { 1: 2 } } }).ok, false, "not at Reset yet");
  Engine.nextTurn(t, e);   // A was first and B is out: after A comes Reset
  assert.equal(encOf(t, e).turn, null);
  const before = JSON.stringify(t);
  assert.equal(Engine.applyEncounterReset(t, e, {}).ok, false);
  assert.equal(JSON.stringify(t), before, "a refusal changes nothing");
  const r = Engine.applyEncounterReset(t, e, { sources: { [a]: { 1: 2 } } }, { keep: [[a, 3]] });
  assert.ok(r.ok);
  const A = rowOf(t, e, a), B = rowOf(t, e, b);
  assert.equal(A.damage, 3, "Bleeding 1 + Burning 2");
  assert.equal(B.damage, 1, "an Out row's Bleeding still ticks");
  eq(A.conditions.map(c => [c.id, c.rounds]), [["burning", 2], ["blinded", null], ["deafened", 1]], "Bleeding ran out and went; Deafened was kept at 1");
  assert.equal(B.conditions[0].rounds, null);
  eq([encOf(t, e).round, encOf(t, e).turn], [2, a]);
});

test("188: every writer refuses on an ended encounter and leaves the table as it was", () => {
  const { t, e, dez } = encTable();
  const pack = Engine.migratePack(syntheticPack());
  const a = addPc(t, e, "A");
  Engine.participantAddCondition(t, e, a, { id: "blinded" });
  assert.ok(Engine.endEncounter(t, e).ok);
  const before = JSON.stringify(t);
  const attempts = {
    edit: () => Engine.editEncounter(t, e, { name: "X" }),
    pc: () => Engine.addParticipant(t, e, { kind: "pc", name: "N" }),
    cast: () => Engine.addParticipant(t, e, { kind: "cast", id: dez.id }),
    entry: () => Engine.participantFromEntry(t, e, pack, "gull"),
    group: () => Engine.participantsFromGroup(t, e, pack, "pier-watch"),
    editRow: () => Engine.editParticipant(t, e, a, { name: "X" }),
    removeRow: () => Engine.removeParticipant(t, e, a),
    damage: () => Engine.participantDamage(t, e, a, 3),
    addCond: () => Engine.participantAddCondition(t, e, a, { id: "deafened" }),
    removeCond: () => Engine.participantRemoveCondition(t, e, a, 0),
    marks: () => Engine.participantConditionMarks(t, e, a, 0, 1),
    hit: () => Engine.applyEncounterHit(t, e, a, { damage: 3, damageType: "blade" }, {}),
    start: () => Engine.startEncounter(t, e),
    next: () => Engine.nextTurn(t, e),
    turn: () => Engine.setTurn(t, e, a),
    apply: () => Engine.applyEncounterReset(t, e, {}),
    end: () => Engine.endEncounter(t, e),
  };
  for (const [name, fn] of Object.entries(attempts)) {
    const r = fn();
    assert.equal(r.ok, false, name);
    assert.equal(typeof r.why, "string", name);
    assert.equal(JSON.stringify(t), before, name);
  }
  assert.ok(Engine.removeEncounter(t, e).ok, "Delete works on an ended one");
  assert.equal(Engine.removeEncounter(t, e).ok, false);
});

test("188: a refused or missing target changes nothing, whatever the writer", () => {
  const { t, e } = encTable();
  const a = addPc(t, e);
  const before = JSON.stringify(t);
  for (const r of [Engine.editEncounter(t, "EN-ZZZZZZZZ", {}), Engine.addParticipant(t, "EN-ZZZZZZZZ", { kind: "pc", name: "x" }),
    Engine.editParticipant(t, e, "R-ZZZZZZZZ", {}), Engine.removeParticipant(t, e, "R-ZZZZZZZZ"), Engine.participantDamage(t, e, "R-ZZZZZZZZ", 1),
    Engine.setTurn(t, e, a), Engine.nextTurn(t, e), Engine.endEncounter(t, "EN-ZZZZZZZZ")]) assert.equal(r.ok, false);
  assert.equal(JSON.stringify(t), before);
});

test("188: editParticipant: HP, Health Levels and Awareness are a PC's alone", () => {
  const { t, e, dez } = encTable();
  const p = addPc(t, e, "P", { hp: "30", levels: 6, awareness: "4", order: "12" });
  eq([rowOf(t, e, p).hp, rowOf(t, e, p).levels, rowOf(t, e, p).awareness, rowOf(t, e, p).order], [30, 6, 4, 12]);
  Engine.editParticipant(t, e, p, { hp: 0, levels: -3, awareness: "x", order: 2.5 });
  eq([rowOf(t, e, p).hp, rowOf(t, e, p).levels, rowOf(t, e, p).awareness, rowOf(t, e, p).order], [null, null, null, null]);
  const c = Engine.addParticipant(t, e, { kind: "cast", id: dez.id }).id;
  Engine.editParticipant(t, e, c, { hp: 50, levels: 5, awareness: 3 });
  eq([rowOf(t, e, c).hp, rowOf(t, e, c).levels, rowOf(t, e, c).awareness], [null, null, null]);
});

test("188: removing a cast member stamps its name on the encounter rows that link it", () => {
  const { t, e, dez } = encTable();
  const c = Engine.addParticipant(t, e, { kind: "cast", id: dez.id }).id;
  Engine.editCastMember(t, dez.id, { name: "Dez II" });
  Engine.removeCastMember(t, dez.id);
  assert.equal(rowOf(t, e, c).cast.name, "Dez II");
});

test("190: castFromEntry is unchanged: a copy first in the cast, with its from, and no encounter touched", () => {
  const t = Engine.newTable("T");
  const pack = Engine.migratePack(syntheticPack());
  const r = Engine.castFromEntry(t, pack, "gull");
  assert.ok(r.ok);
  eq(t.cast[0].from, { kind: "entry", pack: PACK_ID, id: "gull", name: "Gull" });
  assert.equal(t.encounters.length, 0);
});

test("190: the Condition tip kind is gm.js's alone", () => {
  const gm = readFileSync(join(ROOT, "src/ui/gm.js"), "utf8"), shared = readFileSync(join(ROOT, "src/ui/shared.js"), "utf8");
  assert.ok([...gm.matchAll(/\bTIPS\.(\w+)\s*=[^=]/g)].some(m => m[1] === "condition"), "gm.js adds TIPS.condition");
  assert.ok(!/^  condition:/m.test(/const TIPS = \{([\s\S]*?)\n\};/.exec(shared)[1]), "shared.js must not define its own");
});

// ── Fix round (review of #126) ─────────────────────────────────────────
test("189: Dying at Reset follows the sheet's F24 stub: a source that ticks is a mark and stands in for the check", () => {
  const { t, e } = encTable();
  const W = D.damageRules.whileDying;
  const a = addPc(t, e, "A", { order: 9 }), b = addPc(t, e, "B", { order: 8 }), c = addPc(t, e, "C", { order: 7 });
  for (const id of [a, b, c]) Engine.participantAddCondition(t, e, id, { id: "dying" });
  Engine.participantAddCondition(t, e, a, { id: "bleeding" });
  Engine.participantAddCondition(t, e, c, { id: "burning" });
  assert.ok(Engine.startEncounter(t, e).ok);
  const r = Engine.resolveEncounterReset(t, e, { sources: { [c]: { 1: 0 } } });
  assert.ok(r.ok);
  const [ra, rb, rc] = r.rows;
  assert.equal(ra.dying, null, "Dying + Bleeding: the check isn't asked");
  assert.equal(ra.dyingMarks, 1); assert.equal(ra.dyingText, W.text);
  assert.equal(rb.dying, W.resetCheck, "Dying alone: the check is asked");
  assert.equal(rb.dyingMarks, 0); assert.equal(rb.dyingText, null);
  assert.equal(rc.dying, W.resetCheck, "Dying + Burning entered as 0: nothing ticked, so the check is asked");
  assert.equal(rc.dyingMarks, 0);
  const again = Engine.resolveEncounterReset(t, e, { sources: { [c]: { 1: 4 } } }).rows[2];
  assert.deepEqual([again.dying, again.dyingMarks], [null, 1]);
  assert.ok(!JSON.stringify(r).includes(W.resetText) && !JSON.stringify(r).includes(W.playerNote), "resetText or playerNote reached a row");
  const before = JSON.stringify(t);
  Engine.applyEncounterReset(t, e, {}, {});
  assert.equal(JSON.stringify(t), before, "a refusal changes nothing");
  Engine.nextTurn(t, e); Engine.nextTurn(t, e); Engine.nextTurn(t, e);
  Engine.applyEncounterReset(t, e, { sources: { [c]: { 1: 4 } } });
  assert.equal(rowOf(t, e, a).conditions.find(x => x.id === "dying").marks, 0, "the app applied a Death Mark");
});

test("189: the turn follows who has acted, not a place in the sort", () => {
  const { t, e } = encTable();
  const a = addPc(t, e, "A", { order: 10 }), b = addPc(t, e, "B", { order: 8 }), c = addPc(t, e, "C", { order: 5 });
  assert.ok(Engine.startEncounter(t, e).ok);
  assert.deepEqual(plain(encOf(t, e).acted), []);
  Engine.nextTurn(t, e);
  assert.equal(encOf(t, e).turn, b);
  Engine.editParticipant(t, e, c, { order: 20 });   // the repro: the 5 is raised to 20 after two rows
  const r = Engine.nextTurn(t, e);
  assert.equal(r.reset, undefined, "the raised row was skipped");
  assert.equal(encOf(t, e).turn, c);
  assert.equal(Engine.nextTurn(t, e).reset, true);
  eq(encOf(t, e).acted.slice().sort(), [a, b, c].sort());
  // An acted row lowered below the active one doesn't act twice.
  const x = encTable(); const p = addPc(x.t, x.e, "P", { order: 10 }), q = addPc(x.t, x.e, "Q", { order: 8 }), s = addPc(x.t, x.e, "S", { order: 5 });
  Engine.startEncounter(x.t, x.e); Engine.nextTurn(x.t, x.e);
  Engine.editParticipant(x.t, x.e, p, { order: 1 });
  Engine.nextTurn(x.t, x.e);
  assert.equal(encOf(x.t, x.e).turn, s);
  assert.equal(Engine.nextTurn(x.t, x.e).reset, true, "P acted twice");
  void q;
});

test("189: Delay doesn't mark the row it leaves; Finish and Start clear who acted; removal picks the same way", () => {
  const { t, e } = encTable();
  const a = addPc(t, e, "A", { order: 9 }), b = addPc(t, e, "B", { order: 8 }), c = addPc(t, e, "C", { order: 7 });
  Engine.startEncounter(t, e);
  assert.ok(Engine.setTurn(t, e, c).ok);
  assert.deepEqual(plain(encOf(t, e).acted), [], "Delay marked the row it left");
  Engine.nextTurn(t, e);
  eq(encOf(t, e).acted, [c]); assert.equal(encOf(t, e).turn, a, "A still hasn't acted");
  // removing the active row picks the first that hasn't acted
  assert.ok(Engine.removeParticipant(t, e, a).ok);
  assert.equal(encOf(t, e).turn, b);
  // removing an acted row drops it from acted
  assert.ok(Engine.removeParticipant(t, e, c).ok);
  eq(encOf(t, e).acted, []);
  Engine.nextTurn(t, e); assert.equal(encOf(t, e).turn, null);
  Engine.applyEncounterReset(t, e, {});
  eq(encOf(t, e).acted, []); assert.equal(encOf(t, e).turn, b);
  Engine.nextTurn(t, e); Engine.endEncounter(t, e);
});

test("189: setTurn refuses at Reset, and a Reset with everyone Out refuses instead of starting another round", () => {
  const { t, e } = encTable();
  const a = addPc(t, e, "A", { order: 9 }), b = addPc(t, e, "B", { order: 8 });
  Engine.startEncounter(t, e); Engine.nextTurn(t, e); Engine.nextTurn(t, e);
  assert.equal(encOf(t, e).turn, null);
  const s = Engine.setTurn(t, e, a);
  assert.equal(s.ok, false); assert.equal(s.why, "Finish the round first.");
  assert.equal(encOf(t, e).turn, null);
  Engine.editParticipant(t, e, a, { out: true }); Engine.editParticipant(t, e, b, { out: true });
  const before = JSON.stringify(t);
  const r = Engine.applyEncounterReset(t, e, {});
  assert.equal(r.ok, false); assert.equal(r.why, "Everyone's out. Bring someone back or end the encounter.");
  assert.equal(JSON.stringify(t), before);
  assert.equal(encOf(t, e).round, 1);
});

test("188: the gate keeps acted only while running with real rows once each, a running round is at least 1, and a second row for one member becomes a PC row", () => {
  const t = Engine.newTable("T");
  Engine.addCastMember(t, { name: "Dez" });
  const dez = t.cast[0].id;
  const mk = (status, extra = {}) => ({ id: "EN-AAAAAAAA", name: "x", status, round: 0, acted: ["R-AAAAAAAA", "R-AAAAAAAA", "R-ZZZZZZZZ", 5, null], turn: "R-AAAAAAAA",
    rows: [{ id: "R-AAAAAAAA", kind: "pc", name: "A" },
      { id: "R-BBBBBBBB", kind: "cast", name: "Dez", cast: { kind: "cast", id: dez, name: "Dez" } },
      { id: "R-CCCCCCCC", kind: "cast", name: "", cast: { kind: "cast", id: dez, name: "Dez Again" }, hp: 9 }], ...extra });
  t.encounters = [mk("running"), { ...mk("planned"), id: "EN-BBBBBBBB" }, { ...mk("ended"), id: "EN-CCCCCCCC" }];
  const m = Engine.migrateTable(t);
  const [run, plan, end] = m.encounters;
  eq(run.acted, ["R-AAAAAAAA"]); assert.equal(run.round, 1, "a running round is at least 1");
  eq(plan.acted, []); eq(end.acted, []); assert.equal(plan.round, 0);
  assert.equal(run.rows[1].kind, "cast");
  assert.equal(run.rows[2].kind, "pc"); assert.equal(run.rows[2].cast, null); assert.equal(run.rows[2].name, "Dez Again");
  eq(Engine.migrateTable(m), m);
  assert.equal(JSON.stringify(Engine.migrateTable({ meta: {}, encounters: [{ status: "running", acted: "x", rows: [{ id: "R-AAAAAAAA" }] }] }).encounters[0].acted), "[]");
});

test("188: a PC row's HP and Health Levels stay whole numbers of 1 or more", () => {
  const { t, e } = encTable();
  const p = addPc(t, e, "P", { hp: "7", levels: 1 });
  eq([rowOf(t, e, p).hp, rowOf(t, e, p).levels], [7, 1]);
  Engine.editParticipant(t, e, p, { hp: -2, levels: 0 });
  eq([rowOf(t, e, p).hp, rowOf(t, e, p).levels], [null, null]);
});

// ── The hit (Decisions 191–192) ─────────────────────────────────────────────
// An NPC row is hit by the sheet's own pipeline on a stand-in; a PC row takes what got through.
function hitTable(block = {}) {
  const { t, e } = encTable();
  const pack = Engine.migratePack(syntheticPack());
  Object.assign(pack.entries.find(x => x.id === "gull").block, block);
  const id = Engine.participantFromEntry(t, e, pack, "gull").id;
  return { t, e, id };
}
const JACKET = ["Leather Jacket (PROT 1d4, RES +2, INT 10, Medium Coverage, Uncommon, 1 mod, 175Ç)"];
const shot = (over = {}) => ({ damage: 12, damageType: "ballistic", category: "regular", location: "torso", ...over });

test("191: the hit's rows keep Massive levels and armor wear, and a 0.5 table opens with none of either", () => {
  const { t, e, id } = hitTable();
  const pc = addPc(t, e, "P", { hp: 10 });
  for (const r of [rowOf(t, e, id), rowOf(t, e, pc)]) eq([r.massive, r.armorLoss, r.scrapped], [0, 0, false]);
  const old = plain(t);
  old.meta.tableSchemaVersion = "0.5";
  for (const r of old.encounters[0].rows) { delete r.massive; delete r.armorLoss; delete r.scrapped; }
  const m = Engine.migrateTable(old);
  assert.equal(m.meta.tableSchemaVersion, "0.9");
  eq(m, Engine.migrateTable(t), "a 0.5 table is a 0.6 table with nothing worn or gone");
});

test("191: encounterArmor reads the Gear catalog by name, apostrophes folded, and shows what it can't match", () => {
  let a = Engine.encounterArmor({ armor: JACKET });
  assert.equal(a.piece.id, "leather-jacket");
  eq(a.stops, { prot: 3, res: 2 }, "1d4 + 2 stops 5: the Codex's own example");
  assert.equal(a.extra, "");
  assert.equal(Engine.encounterArmor({ armor: ["Road Warrior’s Jacket (PROT 1d4, RES +6, INT 10)"] }).piece.id, "road-warriors-jacket");
  a = Engine.encounterArmor({ armor: ["Kevlar Vest (PROT 1d6, RES +2, INT 20)"] });
  eq(a.stops, { prot: 4, res: 2 });
  a = Engine.encounterArmor({ armor: ["DarkSun Elite Undershirt (PROT 1d8, RES +2, INT 30, Light Coverage) — preparation has its privileges"] });
  eq(a.stops, { prot: 5, res: 2 });
  assert.equal(a.extra, "preparation has its privileges");
  a = Engine.encounterArmor({ armor: ["Leather Jacket (PROT 1d4, RES +2) over integrated subdermal plating"] });
  assert.equal(a.extra, "over integrated subdermal plating");
  a = Engine.encounterArmor({ armor: ["Layered Street Clothes (PROT 1d4, RES +2, INT 10)"] });
  assert.equal(a.piece, null); assert.equal(a.stops, null); assert.equal(a.line, "Layered Street Clothes (PROT 1d4, RES +2, INT 10)");
  a = Engine.encounterArmor({ armor: ["Layered Street Clothes (PROT 1d4)", "Kevlar Vest (PROT 1d6)", "Leather Jacket (PROT 1d4)"] });
  assert.equal(a.piece.id, "kevlar-vest", "the first line the catalog knows");
  a = Engine.encounterArmor({ armor: ["Leather Jacket (PROT 1d4)", "Kevlar Vest (PROT 1d6)"] });
  assert.equal(a.piece.id, "leather-jacket", "the first matched wins");
  for (const b of [null, undefined, {}, { armor: [] }, { armor: ["", "  "] }, { armor: [5, null] }, "x"]) {
    const n = Engine.encounterArmor(b);
    eq([n.line, n.piece, n.extra, n.stops], [null, null, "", null], JSON.stringify(b));
  }
  assert.equal(Engine.encounterArmor({ armor: ["<img onerror=x>"] }).piece, null);
});

test("191: an NPC row's Health is the stand-in's, and it matches npc() at every BOD", () => {
  for (let bod = 1; bod <= 14; bod++) {
    const { t, e, id } = hitTable({ stats: { BOD: bod } });
    const want = Engine.npc(rowOf(t, e, id).block).health, h = viewRow(t, e, id).health;
    eq([h.total, h.levels, h.levelsLeft], [want.total, want.levels, want.levels], `BOD ${bod}`);
    assert.equal(h.left, want.total);
  }
});

test("191: resolveEncounterHit: refuses a row with no BOD, an ended encounter, and passes resolveHit's words through", () => {
  const { t, e, id } = hitTable({ stats: { BOD: null } });
  assert.match(Engine.resolveEncounterHit(t, e, id, shot()).why, /no BOD.*Use Take\./);
  assert.equal(viewRow(t, e, id).canHit, false);
  const h = hitTable({ armor: JACKET });
  assert.equal(viewRow(h.t, h.e, h.id).canHit, true);
  const words = [[{ damage: "" }, "Enter the damage."], [{ damage: -1 }, "Enter the damage."], [{ damageType: "nope" }, "Choose a damage type."], [{ category: "nope" }, "Choose Regular, Withering or Massive."]];
  for (const [over, why] of words) eq(Engine.resolveEncounterHit(h.t, h.e, h.id, shot(over)), { ok: false, why });
  assert.equal(Engine.resolveEncounterHit(h.t, h.e, "R-ZZZZZZZZ", shot()).why, "No such row.");
  assert.equal(Engine.resolveEncounterHit(h.t, "EN-ZZZZZZZZ", h.id, shot()).why, "No such encounter.");
  Engine.endEncounter(h.t, h.e);
  assert.match(Engine.resolveEncounterHit(h.t, h.e, h.id, shot()).why, /has ended/);
});

test("191: resolveEncounterHit uses the static PROT, ignores the GM's, and is pure", () => {
  const { t, e, id } = hitTable({ armor: JACKET });
  const before = JSON.stringify(t);
  const r = Engine.resolveEncounterHit(t, e, id, shot({ protRoll: 4 }));
  assert.equal(r.ok, true);
  eq([r.prot, r.res, r.absorbed, r.through, r.levelsLost], [3, 2, 5, 7, 0]);
  assert.equal(r.armor.name, "Leather Jacket"); assert.equal(r.armor.stops.prot, 3); assert.equal(r.armor.integrityBefore, 10);
  assert.equal(JSON.stringify(t), before, "nothing written");
  assert.equal(Engine.resolveEncounterHit(t, e, id, shot({ protRoll: 1 })).through, 7, "the roll is ignored");
});

test("191: the adapter against the sheet: the same BOD and piece, the same hit, the same answer", () => {
  const { t, e, id } = hitTable({ armor: JACKET, stats: { BOD: 8 } });
  const ch = Engine.newCharacter();
  ch.stats.BOD.base = 8;
  ch.armor = [{ id: "leather-jacket", worn: true }];
  const cases = [shot(), shot({ damage: 3 }), shot({ damage: 40, damageType: "blade" }), shot({ damage: 12, damageType: "energy" }), shot({ ap: true }),
    shot({ location: "head" }), shot({ location: "left-arm" }), shot({ damage: 25, category: "massive" }), shot({ damage: 12, category: "withering" })];
  for (const c of cases) {
    const sheet = Engine.resolveHit(ch, { ...c, protRoll: 3 }), row = Engine.resolveEncounterHit(t, e, id, c);
    for (const k of ["absorbed", "through", "levelsLost", "soaked", "integrityLost", "scrap", "covered", "location", "prot", "res", "resSkipped"])
      assert.equal(row[k], sheet[k], `${k} for ${JSON.stringify(c)}`);
    eq(row.after.lost, sheet.after.lost); eq(row.prompts, sheet.prompts);
  }
});

test("191: applyEncounterHit: damage, Massive and wear land on the row", () => {
  let { t, e, id } = hitTable({ armor: JACKET });
  assert.ok(Engine.applyEncounterHit(t, e, id, shot(), {}).ok);
  eq([rowOf(t, e, id).damage, rowOf(t, e, id).massive, rowOf(t, e, id).armorLoss, rowOf(t, e, id).scrapped], [7, 0, 0, false]);
  assert.ok(Engine.applyEncounterHit(t, e, id, shot({ damage: 4 }), {}).ok);
  eq([rowOf(t, e, id).damage, rowOf(t, e, id).armorLoss], [7, 1], "a soaked hit costs 1 INT and no HP");
  let v = viewRow(t, e, id);
  eq([v.armor.integrity, v.armor.integrityMax, v.armor.compromised], [9, 10, false]);
  // Massive: 25 strips the piece to 0 (scrap) and costs 2 levels, and 1 more for the armor going.
  assert.ok(Engine.applyEncounterHit(t, e, id, shot({ damage: 25, category: "massive" }), {}).ok);
  v = viewRow(t, e, id);
  eq([rowOf(t, e, id).massive, rowOf(t, e, id).scrapped, v.armor.integrity, v.armor.compromised, v.health.gone], [3, true, 0, true, 3]);
  eq([v.health.levels, v.health.levelsLeft], [8, 8 - 3 - Math.floor(7 / 5)]);
  assert.equal("witheringDamage" in rowOf(t, e, id), false);
  // Compromised: RES is gone; PROT 3 only.
  ({ t, e, id } = hitTable({ armor: JACKET }));
  rowOf(t, e, id).armorLoss = 10; rowOf(t, e, id).armorId = "leather-jacket";
  const r = Engine.resolveEncounterHit(t, e, id, shot());
  eq([r.res, r.resSkipped, r.absorbed, r.through], [0, "compromised", 3, 9]);
  // AP skips RES; an uncovered location skips the armor.
  ({ t, e, id } = hitTable({ armor: JACKET }));
  const ap = Engine.resolveEncounterHit(t, e, id, shot({ ap: true }));
  eq([ap.resSkipped, ap.through], ["ap", 9]);
  const head = Engine.resolveEncounterHit(t, e, id, shot({ location: "head" }));
  eq([head.covered, head.through], [false, 12]);
  // An unmatched armor line stops nothing.
  ({ t, e, id } = hitTable({ armor: ["Layered Street Clothes (PROT 1d4, RES +2, INT 10)"] }));
  const bare = Engine.resolveEncounterHit(t, e, id, shot());
  eq([bare.covered, bare.through, bare.armor.piece], [false, 12, null]);
});

test("192: a hit's Conditions: an old one keeps its source and rounds, a new one takes the From, a location one lands where the hit did", () => {
  const { t, e, id } = hitTable({ armor: JACKET });
  assert.ok(Engine.participantAddCondition(t, e, id, { id: "burning", source: "Rook's torch", rounds: 3 }).ok);
  const r = Engine.applyEncounterHit(t, e, id, shot({ from: "  Rook's SMG " }), { conditions: ["bleeding", "unconscious"] });
  assert.ok(r.ok);
  const cs = rowOf(t, e, id).conditions;
  eq(cs[0], { id: "burning", source: "Rook's torch", rounds: 3 });
  assert.equal(cs[1].id, "bleeding"); assert.equal(cs[1].source, "Rook's SMG"); assert.equal(cs[1].rounds, null);
  assert.equal(cs.length, 2, "only what the hit offers: unconscious isn't a ballistic Condition");
  const inj = hitTable({ armor: JACKET });
  Engine.applyEncounterHit(inj.t, inj.e, inj.id, shot({ damage: 25, category: "massive", location: "left-arm", from: "A gun" }), { conditions: ["injured"] });
  const c = rowOf(inj.t, inj.e, inj.id).conditions.find(x => x.id === "injured");
  assert.equal(c.location, "left-arm"); assert.equal(c.source, "A gun");
});

test("192: Shock and At Zero are offered, never forced: Failed adds the Conditions, unanswered adds nothing", () => {
  const big = shot({ damage: 30, from: "Rook" });
  let { t, e, id } = hitTable({ armor: JACKET });
  const p = Engine.resolveEncounterHit(t, e, id, big).prompts;
  assert.ok(p.shock, "25 through is five levels of eight");
  assert.equal(p.atZero, null);
  assert.ok(Engine.applyEncounterHit(t, e, id, big, {}).ok);
  eq(rowOf(t, e, id).conditions, [], "unanswered adds nothing");
  ({ t, e, id } = hitTable({ armor: JACKET }));
  Engine.applyEncounterHit(t, e, id, big, { shock: "fail" });
  eq(rowOf(t, e, id).conditions.map(c => [c.id, c.source, c.rounds]), [["unconscious", "Rook", null], ["prone", "Rook", null]]);
  // To zero: unanswered, the row reads Down with nothing added; Failed adds Dying.
  ({ t, e, id } = hitTable({ armor: JACKET }));
  const zero = shot({ damage: 60 });
  assert.ok(Engine.resolveEncounterHit(t, e, id, zero).prompts.atZero);
  Engine.applyEncounterHit(t, e, id, zero, {});
  assert.equal(viewRow(t, e, id).health.down, true); eq(rowOf(t, e, id).conditions, []);
  ({ t, e, id } = hitTable({ armor: JACKET }));
  Engine.applyEncounterHit(t, e, id, zero, { atZero: "fail" });
  eq(rowOf(t, e, id).conditions.map(c => c.id), ["dying"]);
  ({ t, e, id } = hitTable({ armor: JACKET }));
  Engine.applyEncounterHit(t, e, id, zero, { atZero: "pass" });
  eq(rowOf(t, e, id).conditions.map(c => c.id), ["unconscious", "prone"]);
});

test("192: a hit while Dying is a Death Mark, and the Dying entry keeps its source and rounds", () => {
  const { t, e, id } = hitTable({ armor: JACKET });
  assert.ok(Engine.participantAddCondition(t, e, id, { id: "dying", source: "Rook", rounds: 4 }).ok);
  rowOf(t, e, id).damage = 60;
  const r = Engine.resolveEncounterHit(t, e, id, shot());
  assert.ok(r.prompts.deathMark); assert.equal(r.prompts.atZero, null, "already Dying");
  Engine.applyEncounterHit(t, e, id, shot(), {});
  const d = rowOf(t, e, id).conditions[0];
  eq([d.id, d.marks, d.source, d.rounds], ["dying", 1, "Rook", 4]);
  Engine.applyEncounterHit(t, e, id, shot(), {});
  assert.equal(rowOf(t, e, id).conditions[0].marks, 2);
});

test("191: the re-resolve: a row that changed under an open panel is hit as it is now, and a refusal writes nothing", () => {
  const { t, e, id } = hitTable({ armor: JACKET });
  Engine.participantAddCondition(t, e, id, { id: "dying" });
  const hit = shot({ damage: 9 });
  assert.ok(Engine.resolveEncounterHit(t, e, id, hit).prompts.deathMark);
  Engine.participantRemoveCondition(t, e, id, 0);
  Engine.applyEncounterHit(t, e, id, hit, {});
  eq(rowOf(t, e, id).conditions, [], "no Dying, so no mark, and nothing invented");
  rowOf(t, e, id).block.stats.BOD = null;
  const before = JSON.stringify(t);
  assert.equal(Engine.applyEncounterHit(t, e, id, hit, {}).ok, false);
  assert.equal(JSON.stringify(t), before, "a refused apply changes nothing, the stamp included");
  rowOf(t, e, id).block.stats.BOD = 3;
  const small = Engine.resolveEncounterHit(t, e, id, shot({ damage: 40, damageType: "blade" }));
  assert.equal(small.before.levels, 3, "the block's BOD as it is now");
});

test("191: a PC row takes what got through, on the GM's own numbers", () => {
  const { t, e } = encTable();
  const p = addPc(t, e, "P", { hp: 30, levels: 6 });
  const r = Engine.resolveEncounterHit(t, e, p, { damage: 12, damageType: "ballistic", from: "Rook" });
  eq([r.pc, r.through, r.after.left, r.after.levelsLeft, r.lostThisHit], [true, 12, 18, 4, 2]);
  eq(r.prompts.conditions, ["bleeding"]);
  assert.equal(r.prompts.shock, null);
  const a = Engine.applyEncounterHit(t, e, p, { damage: 12, damageType: "ballistic", from: "Rook" }, { conditions: ["bleeding", "unconscious"] });
  assert.ok(a.ok);
  eq([rowOf(t, e, p).damage, rowOf(t, e, p).conditions.map(c => [c.id, c.source, c.rounds])], [12, [["bleeding", "Rook", null]]]);
  const h = viewRow(t, e, p).health;
  eq([h.left, h.total, h.levelsLeft, h.levels], [18, 30, 4, 6]);
  assert.equal(viewRow(t, e, p).armor, null);
  // Massive: the Health Levels the player calls out, capped at what is left.
  const m = Engine.resolveEncounterHit(t, e, p, { damage: 99, gone: 2, damageType: "blunt", category: "massive" });
  eq([m.gone, m.through], [2, 0]);
  Engine.applyEncounterHit(t, e, p, { gone: 2, damageType: "blunt", category: "massive" }, {});
  eq([rowOf(t, e, p).massive, viewRow(t, e, p).health.gone, viewRow(t, e, p).health.left, viewRow(t, e, p).health.levelsLeft], [2, 2, 8, 2]);
  Engine.applyEncounterHit(t, e, p, { gone: 9, damageType: "blunt", category: "massive" }, {});
  assert.equal(rowOf(t, e, p).massive, 6, "capped at the levels");
  assert.equal(Engine.resolveEncounterHit(t, e, p, { gone: "", damageType: "blunt", category: "massive" }).ok, false);
  assert.equal(Engine.resolveEncounterHit(t, e, p, { damage: "", damageType: "blunt" }).why, "Enter the damage.");
  assert.equal(Engine.resolveEncounterHit(t, e, p, { damage: 3, damageType: "x" }).why, "Choose a damage type.");
});

test("192: a PC row's Shock and At Zero are reminders, and apply adds neither Condition", () => {
  const { t, e } = encTable();
  const p = addPc(t, e, "P", { hp: 30, levels: 6 });
  const r = Engine.resolveEncounterHit(t, e, p, { damage: 15, damageType: "energy" });
  assert.ok(r.prompts.shock); assert.equal(r.prompts.shock.check, "BOD Essence Check TN 8 TH 2");
  Engine.applyEncounterHit(t, e, p, { damage: 15, damageType: "energy" }, { shock: "fail", atZero: "fail", conditions: [] });
  eq(rowOf(t, e, p).conditions, []);
  const z = Engine.resolveEncounterHit(t, e, p, { damage: 15, damageType: "elemental" });
  assert.ok(z.prompts.atZero); assert.equal(z.prompts.shock, null, "down is not shock");
  Engine.applyEncounterHit(t, e, p, { damage: 15, damageType: "elemental" }, { atZero: "fail", shock: "fail" });
  eq(rowOf(t, e, p).conditions, [], "an atZero passed in is ignored");
  // Dying: a mark.
  Engine.participantAddCondition(t, e, p, { id: "dying", source: "x", rounds: 2 });
  Engine.applyEncounterHit(t, e, p, { damage: 1, damageType: "elemental" }, {});
  const d = rowOf(t, e, p).conditions[0];
  eq([d.marks, d.source, d.rounds], [1, "x", 2]);
  // No HP and no Health Levels: the damage lands with no figures.
  const bare = addPc(t, e, "Bare");
  const b = Engine.resolveEncounterHit(t, e, bare, { damage: 7, damageType: "blade" });
  eq([b.after.total, b.after.left, b.after.levels, b.after.down, b.prompts.shock, b.prompts.atZero], [null, null, null, false, null, null]);
  Engine.applyEncounterHit(t, e, bare, { damage: 7, damageType: "blade" }, {});
  assert.equal(rowOf(t, e, bare).damage, 7);
});

test("191: a PC row reads its Health as hlState does, with Massive levels, at every BOD, damage and Massive count", () => {
  for (let bod = 1; bod <= 14; bod++) {
    const ch = Engine.newCharacter();
    ch.stats.BOD.base = bod;
    const h = Engine.health(ch);
    const { t, e } = encTable();
    const p = addPc(t, e, "P", { hp: h.total, levels: h.levels });
    const row = rowOf(t, e, p);
    for (let m = 0; m <= 2; m++) for (let d = 0; d <= h.total; d++) {
      row.damage = d; row.massive = m;
      const want = Engine.hlState(ch, { damage: d, massiveLevels: m }), got = viewRow(t, e, p).health;
      const tag = `BOD ${bod} damage ${d} massive ${m}`;
      eq([got.total, got.left, got.down, got.levels, got.levelsLeft, got.gone], [want.total, want.hpLeft, want.down, want.levels, want.levels - want.lost, want.massive], tag);
      if (d % Math.max(1, h.hpPer - 1) !== 0 && d !== h.total) continue;
      for (const k of [1, h.hpPer, Math.ceil(h.total / 2), h.total]) {
        const c = Engine.newCharacter();
        c.stats = ch.stats; c.trackers.damage = d; c.trackers.massiveLevels = m;
        const sheet = Engine.resolveHit(c, { damage: k, damageType: "elemental", location: "torso" });
        const mine = Engine.resolveEncounterHit(t, e, p, { damage: k, damageType: "elemental" });
        eq([mine.after.lost, mine.after.left, mine.lostThisHit, !!mine.prompts.shock, !!mine.prompts.atZero],
           [sheet.after.lost, sheet.after.hpLeft, sheet.lostThisHit, !!sheet.prompts.shock, !!sheet.prompts.atZero], `${tag} hit ${k}`);
      }
    }
  }
});

test("191: a PC row whose HP per level no BOD gives is read by the same helper", () => {
  const { t, e } = encTable();
  const p = addPc(t, e, "P", { hp: 36, levels: 6 });
  rowOf(t, e, p).damage = 13; rowOf(t, e, p).massive = 1;
  const h = viewRow(t, e, p).health;
  eq([h.total, h.left, h.levelsLeft, h.gone, h.down], [36, 17, 3, 1, false]);
});

test("191: a row's traits are named for the active row to show, and a PC has none", () => {
  const { t, e, id } = hitTable();
  rowOf(t, e, id).block.traits = [{ name: "Cold", text: "Never flinches." }, { name: "", text: "" }, { name: "Loud", text: "" }];
  eq(viewRow(t, e, id).traits.map(k => [k.index, k.name, k.text]), [[0, "Cold", "Never flinches."], [2, "Loud", ""]]);
  const pc = addPc(t, e, "P");
  eq(viewRow(t, e, pc).traits, []);
});

test("191 (review): armor wear follows its piece: another piece in the block reads fresh, and the jacket's wear is kept", () => {
  const { t, e, id } = hitTable({ armor: JACKET });
  for (let i = 0; i < 3; i++) assert.ok(Engine.applyEncounterHit(t, e, id, shot({ damage: 3 }), {}).ok);
  eq([rowOf(t, e, id).armorLoss, rowOf(t, e, id).armorId], [3, "leather-jacket"]);
  assert.equal(viewRow(t, e, id).armor.integrity, 7);
  rowOf(t, e, id).block.armor = ["Security Rig (PROT 1d6)"];
  let a = viewRow(t, e, id).armor;
  eq([a.piece.id, a.integrity, a.integrityMax], ["security-rig", 20, 20]);
  assert.equal(Engine.resolveEncounterHit(t, e, id, shot()).armor.integrityBefore, 20, "the hit reads it fresh too");
  eq([rowOf(t, e, id).armorLoss, rowOf(t, e, id).armorId], [3, "leather-jacket"], "the wear is kept, not cleared");
  rowOf(t, e, id).block.armor = JACKET;
  assert.equal(viewRow(t, e, id).armor.integrity, 7, "back to the jacket, 7/10 again");
  // A hit that wears the new piece starts its own wear rather than adding to the old one's.
  rowOf(t, e, id).block.armor = ["Security Rig (PROT 1d6)"];
  assert.ok(Engine.applyEncounterHit(t, e, id, shot({ damage: 3 }), {}).ok);
  eq([rowOf(t, e, id).armorLoss, rowOf(t, e, id).armorId], [1, "security-rig"]);
  assert.equal(viewRow(t, e, id).armor.integrity, 19);
  // A scrapped piece's scrap goes with its id as well.
  const s = hitTable({ armor: JACKET });
  Engine.applyEncounterHit(s.t, s.e, s.id, shot({ damage: 25, category: "massive" }), {});
  assert.equal(viewRow(s.t, s.e, s.id).armor.scrapped, true);
  rowOf(s.t, s.e, s.id).block.armor = ["Security Rig (PROT 1d6)"];
  assert.equal(viewRow(s.t, s.e, s.id).armor.scrapped, false);
});

// ── The encounter's end (Decision 193) ──────────────────────────────────────
// Synthetic names only. Dez is a cast member with a block; Gull is a pack entry; Wren and Rook are the crew.
function endTable() {
  const { t, e, dez } = encTable();
  const pack = Engine.migratePack(syntheticPack());
  const dezRow = Engine.addParticipant(t, e, { kind: "cast", id: dez.id }).id;
  const gull = Engine.participantFromEntry(t, e, pack, "gull").id;
  const gull2 = Engine.participantFromEntry(t, e, pack, "gull").id;
  const wren = addPc(t, e, "Wren", { hp: 10, levels: 5 }), rook = addPc(t, e, "Rook");
  assert.ok(Engine.startEncounter(t, e).ok);
  return { t, e, dez, dezRow, gull, gull2, wren, rook, pack };
}
const castOf = (t, id) => t.cast.find(n => n.id === id);

test("193: encounterWrapUp reads the non-PC rows, the crew, the dice and who was hit; it never throws", () => {
  const { t, e, dezRow, wren } = endTable();
  Engine.participantDamage(t, e, dezRow, 7);
  Engine.participantDamage(t, e, wren, 3);
  const w = Engine.encounterWrapUp(t, e);
  eq(w.rows.map(x => x.kind), ["cast", "entry", "entry"], "PC rows are left out");
  const d = w.rows[0];
  eq([d.name, d.status, d.row.id], ["Dez", "alive", dezRow]);
  const hl = Engine.encounterView(t, e, []).rows.find(r => r.row.id === dezRow).health;
  eq([d.ended.left, d.ended.levels, d.ended.levelsLeft, d.ended.down, d.ended.conditions], [hl.left, hl.levels, hl.levelsLeft, hl.down, []]);
  assert.equal(d.line, `Fought them in Warehouse: ${hl.levelsLeft} of ${hl.levels} Health Levels left.`);
  eq(w.crew, ["Wren", "Rook"]);
  eq(w.hit, [{ id: wren, name: "Wren" }], "only the PC who took damage");
  eq(w.dice.map(x => x.id), Object.keys(D.armorRules.integrityLossByDifficulty), "the data's order");
  eq(w.dice[0], { id: "easy", name: "Easy", die: "1d4" });
  // A Condition and Down read into the default line.
  Engine.participantAddCondition(t, e, dezRow, { id: "bleeding", location: LOC });
  Engine.participantDamage(t, e, dezRow, 400);
  const w2 = Engine.encounterWrapUp(t, e).rows[0];
  assert.ok(w2.ended.down);
  assert.match(w2.line, /Health Levels left, Down; [A-Z]/);
  // An entry row with no BOD has no totals.
  const g = w.rows[2];
  rowOf(t, e, g.row.id).block.stats = {};
  const bare = Engine.encounterWrapUp(t, e).rows[2];
  assert.equal(bare.ended.levels, null);
  assert.equal(bare.line, "Fought them in Warehouse.");
  // Planned, ended, unknown: empty lists, same dice.
  const p = encTable();
  for (const [tt, id] of [[p.t, p.e], [p.t, "EN-NOPE0000"], [null, "x"], [{}, "x"]]) {
    const r = Engine.encounterWrapUp(tt, id);
    eq([r.rows, r.crew, r.hit], [[], [], []]); assert.equal(r.dice.length, 4);
  }
  Engine.endEncounter(t, e);
  eq(Engine.encounterWrapUp(t, e).rows, []);
});

test("193: encounterWrapUp's crew leaves out a PC row with no name", () => {
  const { t, e } = endTable();
  Engine.addParticipant(t, e, { kind: "pc", name: "x" });
  encOf(t, e).rows[encOf(t, e).rows.length - 1].name = "   ";
  eq(Engine.encounterWrapUp(t, e).crew, ["Wren", "Rook"]);
});

test("193: endEncounter with no wrap is exactly what it was", () => {
  const { t, e } = endTable();
  const before = plain(t);
  assert.ok(Engine.endEncounter(t, e).ok);
  assert.equal(encOf(t, e).status, "ended");
  eq(t.cast, before.cast); eq(t.interactions, []);
  assert.equal(Engine.endEncounter(t, e).ok, false);
});

test("193: a cast row's line lands as a fought interaction with the crew, today and the text; blank writes the default", () => {
  const { t, e, dez, dezRow } = endTable();
  const def = Engine.encounterWrapUp(t, e).rows[0].line;
  const r = Engine.endEncounter(t, e, { rows: { [dezRow]: { line: true, text: "  " } } });
  assert.ok(r.ok, r.why);
  assert.equal(t.interactions.length, 1);
  const x = t.interactions[0];
  eq([x.kind, x.crew, x.text, x.cast.map(l => l.id)], ["fought", ["Wren", "Rook"], def, [dez.id]]);
  const d = new Date(), p = n => String(n).padStart(2, "0");
  assert.equal(x.date, `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);
  eq(Engine.interactionsFor(t, dez.id).map(i => i.id), [x.id]);
  // The GM's own text wins.
  const s = endTable();
  Engine.endEncounter(s.t, s.e, { rows: { [s.dezRow]: { line: true, text: " They ran. " } } });
  assert.equal(s.t.interactions[0].text, "They ran.");
});

test("193: a status set to dead writes killed and the member reads dead; missing writes fought and missing", () => {
  const a = endTable();
  assert.ok(Engine.endEncounter(a.t, a.e, { rows: { [a.dezRow]: { line: true, status: "dead" } } }).ok);
  eq([a.t.interactions[0].kind, castOf(a.t, a.dez.id).status], ["killed", "dead"]);
  const b = endTable();
  assert.ok(Engine.endEncounter(b.t, b.e, { rows: { [b.dezRow]: { line: true, status: "missing" } } }).ok);
  eq([b.t.interactions[0].kind, castOf(b.t, b.dez.id).status], ["fought", "missing"]);
  // A status with the line off still changes; no line is written.
  const c = endTable();
  Engine.endEncounter(c.t, c.e, { rows: { [c.dezRow]: { line: false, status: "gone" } } });
  eq([c.t.interactions.length, castOf(c.t, c.dez.id).status], [0, "gone"]);
});

test("193: a kept entry row is a new member first in the cast, with a copy of the row's block, and the line links them", () => {
  const { t, e, gull, gull2, pack } = endTable();
  const castBefore = t.cast.length;
  const r = Engine.endEncounter(t, e, { rows: { [gull]: { keep: true, name: "  Old Gull ", status: "missing", line: true, text: "Got away." } } }, [pack]);
  assert.ok(r.ok, r.why);
  assert.equal(r.kept.length, 1);
  const m = t.cast[0];
  eq([m.id, t.cast.length], [r.kept[0], castBefore + 1]);
  eq([m.name, m.status], ["Old Gull", "missing"]);
  eq(m.from, { kind: "entry", pack: pack.meta.id, id: "gull", name: "Gull" });
  const row = rowOf(t, e, gull);
  eq(m.block, row.block);
  const rowBlock = plain(row.block);
  m.block.stats = { BOD: 1 }; m.block.skills = [{ name: "X", total: 1 }];
  eq(row.block, rowBlock, "a copy: editing the member leaves the row's block alone");
  eq(row.kept, { kind: "cast", id: m.id, name: "Old Gull" });
  eq([t.interactions[0].cast.map(l => l.id), t.interactions[0].text, t.interactions[0].kind], [[m.id], "Got away.", "fought"]);
  assert.equal(m.flavor, pack.entries.find(x => x.id === "gull").flavor, "the entry's text when its pack is slotted");
  assert.equal(rowOf(t, e, gull2).kept, null, "an unticked row writes nothing");
  assert.equal(Engine.encounterView(t, e, []).rows.find(v => v.row.id === gull).kept.name, "Old Gull");
  // No pack slotted: the name, the block and from, no text. A blank name keeps the row's.
  const s = endTable();
  assert.ok(Engine.endEncounter(s.t, s.e, { rows: { [s.gull]: { keep: true, name: "  " } } }, []).ok);
  eq([s.t.cast[0].name, s.t.cast[0].flavor, s.t.cast[0].status, s.t.cast[0].from.id], ["Gull", "", "alive", "gull"]);
  eq(s.t.cast[0].block, rowOf(s.t, s.e, s.gull).block);
  assert.equal(s.t.interactions.length, 0, "keeping alone writes no line");
});

test("193: an unticked row writes nothing, and a wrap key that isn't a row is ignored", () => {
  const { t, e, gull } = endTable();
  const before = plain(t);
  assert.ok(Engine.endEncounter(t, e, { rows: { [gull]: { keep: false, line: false }, "R-NOPE0000": { keep: true, line: true } } }).ok);
  eq(t.cast, before.cast); eq(t.interactions, []);
});

test("193: all or nothing: an unknown status on the last row refuses and the table is unchanged", () => {
  const { t, e, dezRow, gull, gull2, pack } = endTable();
  const before = plain(t);
  const r = Engine.endEncounter(t, e, { rows: {
    [dezRow]: { line: true, status: "dead" }, [gull]: { keep: true, name: "Kept", line: true }, [gull2]: { keep: true, status: "nonsense" } } }, [pack]);
  assert.equal(r.ok, false); assert.equal(r.why, "Choose a status.");
  eq(plain(t), before);
  // Keeping a row that isn't an entry row refuses the same way.
  const o = Engine.endEncounter(t, e, { rows: { [gull]: { keep: true }, [dezRow]: { keep: true } } }, [pack]);
  assert.equal(o.why, "Only a copy from a pack can be kept.");
  eq(plain(t), before);
});

test("193: a planned encounter refuses a wrap, and an ended one refuses everything", () => {
  const p = encTable();
  assert.equal(Engine.endEncounter(p.t, p.e, { rows: {} }).why, "It hasn't started, so there's nothing to wrap up.");
  assert.equal(encOf(p.t, p.e).status, "planned");
  assert.ok(Engine.endEncounter(p.t, p.e).ok, "a planned one still ends with no wrap");
  const { t, e } = endTable();
  Engine.endEncounter(t, e, { rows: {} });
  assert.equal(Engine.endEncounter(t, e, { rows: {} }).ok, false);
  assert.equal(Engine.endEncounter(t, e).ok, false);
});

test("193: removeCastMember writes the name into a kept link; the ended row reads gone", () => {
  const { t, e, gull, pack } = endTable();
  const r = Engine.endEncounter(t, e, { rows: { [gull]: { keep: true, name: "Old Gull" } } }, [pack]);
  Engine.editCastMember(t, r.kept[0], { name: "Renamed Gull" });
  Engine.removeCastMember(t, r.kept[0]);
  eq(rowOf(t, e, gull).kept, { kind: "cast", id: r.kept[0], name: "Renamed Gull" });
  const k = Engine.encounterView(t, e, []).rows.find(v => v.row.id === gull).kept;
  eq(k, { name: "Renamed Gull", gone: true });
});

test("193: the kinds are eight, and a 0.6 table opens as 0.7 with no row kept and everything else the same", () => {
  assert.equal(KINDS.length, 8);
  const x = Engine.migrateTable({ interactions: [{ kind: "fought", text: "a" }, { kind: "bogus", text: "b" }] });
  eq(x.interactions.map(i => i.kind), ["fought", null]);
  const { t, gull } = endTable();
  const old = plain(t);
  old.meta.tableSchemaVersion = "0.6";
  for (const en of old.encounters) for (const r of en.rows) delete r.kept;
  const m = Engine.migrateTable(old);
  assert.equal(m.meta.tableSchemaVersion, "0.9");
  assert.ok(m.encounters[0].rows.every(r => r.kept === null));
  eq(m, Engine.migrateTable(t));
  // The gate: kept is a link on an entry row, else null.
  const h = plain(t);
  h.encounters[0].rows.find(r => r.id === gull).kept = { kind: "cast", id: "C-AAAAAAAA", name: "Gone" };
  h.encounters[0].rows.find(r => r.kind === "cast").kept = { kind: "cast", id: "C-AAAAAAAA" };
  const g = Engine.migrateTable(h);
  assert.equal(g.encounters[0].rows.find(r => r.id === gull).kept.name, "Gone");
  assert.ok(g.encounters[0].rows.filter(r => r.kind !== "entry").every(r => r.kept === null));
});

// ── S10c review round 1 ─────────────────────────────────────────────────────
test("193 (review): anyone hit is listed for wear, by their armor or their body, and Heal never takes it back", () => {
  const { t, e, wren, rook } = endTable();
  const three = addPc(t, e, "Nyx", { hp: 10, levels: 5 });
  eq(Engine.encounterWrapUp(t, e).hit, [], "nobody hit yet");
  // A hit the armor stops entirely: nothing through, still hit.
  const a = Engine.applyEncounterHit(t, e, wren, { damage: 0, damageType: "ballistic", category: "regular", location: "torso" }, {});
  assert.ok(a.ok, a.why);
  assert.equal(rowOf(t, e, wren).damage, 0);
  eq(Engine.encounterWrapUp(t, e).hit.map(h => h.name), ["Wren"]);
  // A hit healed back to zero is still a hit.
  Engine.participantDamage(t, e, rook, 4); Engine.participantDamage(t, e, rook, -4);
  assert.equal(rowOf(t, e, rook).damage, 0);
  eq(Engine.encounterWrapUp(t, e).hit.map(h => h.name), ["Wren", "Rook"]);
  // A Heal alone hits nobody, and a PC never hit is not listed.
  Engine.participantDamage(t, e, three, -3);
  assert.equal(rowOf(t, e, three).struck, false);
  eq(Engine.encounterWrapUp(t, e).hit.map(h => h.name), ["Wren", "Rook"]);
  // Massive alone counts, and so does an NPC's hit (the flag is every row's).
  const { t: u, e: f, dezRow } = endTable();
  assert.ok(Engine.applyEncounterHit(u, f, dezRow, { damage: 9, damageType: "ballistic", category: "regular", location: "torso" }, {}).ok);
  assert.equal(rowOf(u, f, dezRow).struck, true);
});

test("193 (review): a 0.6 table opens with struck: false on every row, and struck comes out a boolean", () => {
  const { t } = endTable();
  const old = plain(t);
  old.meta.tableSchemaVersion = "0.6";
  for (const en of old.encounters) for (const r of en.rows) { delete r.kept; delete r.struck; }
  const m = Engine.migrateTable(old);
  assert.ok(m.encounters[0].rows.every(r => r.struck === false));
  eq(m, Engine.migrateTable(t));
  for (const [v, want] of [["true", false], [1, false], [{}, false], [true, true], [null, false]]) {
    const h = plain(t); h.encounters[0].rows[0].struck = v;
    assert.equal(Engine.migrateTable(h).encounters[0].rows[0].struck, want, JSON.stringify(v));
  }
});

test("193 (review): killed only when this fight moves the member to dead", () => {
  const a = endTable();
  Engine.editCastMember(a.t, a.dez.id, { status: "dead" });
  assert.ok(Engine.endEncounter(a.t, a.e, { rows: { [a.dezRow]: { line: true } } }).ok);
  assert.equal(a.t.interactions[0].kind, "fought", "already dead: the crew didn't kill them here");
  const b = endTable();
  assert.ok(Engine.endEncounter(b.t, b.e, { rows: { [b.dezRow]: { line: true, status: "dead" } } }).ok);
  assert.equal(b.t.interactions[0].kind, "killed");
  const c = endTable();
  assert.ok(Engine.endEncounter(c.t, c.e, { rows: { [c.gull]: { keep: true, status: "dead", line: true } } }, [c.pack]).ok);
  eq([c.t.interactions[0].kind, c.t.cast[0].status], ["killed", "dead"]);
  // Already dead and set to dead again: no kill either.
  const d = endTable();
  Engine.editCastMember(d.t, d.dez.id, { status: "dead" });
  assert.ok(Engine.endEncounter(d.t, d.e, { rows: { [d.dezRow]: { line: true, status: "dead" } } }).ok);
  assert.equal(d.t.interactions[0].kind, "fought");
});

// ── The Werewolf's Major Milestones (crb-v4-sync P3b, Decision 199) ──
const WWMAJ = () => WWD().growth.majorMilestones;
const withMajors = (ch, ...ids) => { ids.forEach(id => ch.progression.milestones.major.push({ id, date: "2026-10-08" })); return ch; };

test("Decision 199: each Origin is offered the shared Majors, the open and earned ones, and its own, never another Origin's", () => {
  const shared = D.milestones.majorGeneral.map(m => m.id);
  const anyOrigin = WWMAJ().filter(m => !m.prerequisites.specialization).map(m => m.id);
  assert.equal(anyOrigin.length, 9, "the open four and the earned five");
  for (const o of WWD().specialization.options) {
    const own = WWMAJ().filter(m => (m.prerequisites.specialization || []).includes(o.id)).map(m => m.id);
    assert.equal(own.length, 7, `${o.name} has ${own.length} of its own, with its capstone`);
    const offered = Engine.majorOffered(werewolf(o.id)).map(m => m.id);
    same([...offered].sort(), [...shared, ...WWMAJ().filter(m => anyOrigin.includes(m.id) || own.includes(m.id)).map(m => m.id)].sort(), `${o.name} is offered the wrong Majors`);
  }
  assert.equal(Engine.majorOffered(werewolf(null)).length, shared.length + 29, "a Werewolf with no Origin yet doesn't see all of them");
  same(Engine.majorOffered(subject()).map(m => m.id), shared, "an Arcanist is offered a Werewolf's Majors");
  const clash = WWMAJ().map(m => m.id).filter(id => shared.includes(id));
  same(clash, [], "a Werewolf Major's id collides with a shared one; progression stores bare ids");
});

test("Decision 199: a Werewolf Major gates on its Origin, its count and the Milestone it names, and takes like any Major", () => {
  const m = id => Engine.majorById(werewolf("trueborn"), id);
  const pre = (ch, id) => Engine.majorPrereqs(ch, Engine.majorById(ch, id));
  assert.equal(pre(werewolf("trueborn"), "swift-change").ok, true);
  same(pre(werewolf("wildblood"), "swift-change").unmet, ["Trueborn"], "a Wildblood can take a Trueborn's Major");
  assert.equal(pre(werewolf("trueborn"), "between-forms").ok, false, "Between Forms didn't wait on a Major");
  assert.equal(pre(withMajors(werewolf("trueborn"), "tireless"), "between-forms").ok, true);
  same(pre(werewolf("wildblood"), "two-riders").unmet, ["Milestone: Spirit's Favor"], "Two Riders doesn't name Spirit's Favor");
  assert.equal(pre(withMajors(werewolf("wildblood"), "spirits-favor"), "two-riders").ok, true);
  const three = ["tireless", "deep-reserves", "lead-the-pack"];
  assert.equal(pre(withMajors(werewolf("trueborn"), ...three), "the-calling").ok, true, "The Calling refused a Trueborn");
  assert.equal(pre(withMajors(werewolf("wildblood"), ...three), "the-calling").ok, true, "The Calling refused a Wildblood");
  same(pre(withMajors(werewolf("forge-fang"), ...three), "the-calling").unmet, ["Trueborn or Wildblood"]);
  assert.equal(pre(withMajors(werewolf("forge-fang"), ...three), "off-the-leash").ok, true);
  assert.ok(m("the-calling"), "The Calling isn't in the pool");

  const ch = werewolf("trueborn");
  ch.progression.milestonePoints = 100;
  assert.equal(Engine.takeMilestone(ch, "major", "swift-change").ok, true, "a Werewolf can't take its own Major");
  assert.equal(Engine.takeMilestone(ch, "major", "hardline-shift").ok, false, "a Trueborn took a Forge Fang's Major");
  assert.equal(Engine.takeMilestone(subject(), "major", "swift-change").ok, false, "an Arcanist took a Werewolf's Major");
});

test("Decision 199: Tireless adds 2 RoU and Deep Reserves 5 SFR, once each, and nobody else's SFR moves", () => {
  const before = Engine.sfr(werewolf("trueborn"));
  const ch = withMajors(werewolf("trueborn"), "tireless", "deep-reserves");
  const after = Engine.sfr(ch);
  assert.equal(after.rou, before.rou + 2);
  assert.equal(after.value, before.value + 5);
  withMajors(ch, "tireless");
  assert.equal(Engine.sfr(ch).rou, before.rou + 2, "a Major listed twice counted twice");
  assert.equal(Engine.panelMax(ch, WWD().coreMechanic.panels.find(p => p.id === "sfr")), before.value + 5, "the SFR tracker's max didn't move");
});

test("Decision 199: Hardline Shift makes the shift's HL ordinary damage, Iron Jaw tags the claws AP, Clear Head turns Feral Mind's bar into -2", () => {
  const ff = () => werewolf("forge-fang", { base: 8 });
  same(Engine.setToggle(withMajors(ff(), "hardline-shift"), "form", "Werewolf").cost, { hl: 1, hp: 7, withering: false, category: "Regular" }, "Hardline Shift still writes Withering");
  const hs = withMajors(ff(), "hardline-shift");
  Engine.setToggle(hs, "form", "Werewolf");
  assert.equal(hs.trackers.witheringDamage, 0, "the HL was recorded as Withering");
  assert.equal(hs.trackers.damage, 7);

  const jaw = withMajors(werewolf("trueborn"), "iron-jaw");
  jaw.panelData = { form: "Werewolf" };
  same(Engine.formView(jaw).weapons.map(w => [w.name, w.tags]), [["Claws", ["AP"]], ["Fangs", ["AP"]]]);
  const bare = werewolf("trueborn"); bare.panelData = { form: "Werewolf" };
  same(Engine.formView(bare).weapons.map(w => w.tags), [[], []], "claws carry AP without Iron Jaw");

  const tech = D.skills.find(s => s.primaryStat === "TECH").id;
  const clear = withMajors(werewolf("trueborn"), "clear-head");
  const human = Engine.skillLine(clear, tech).checkBonus;
  clear.panelData = { form: "Werewolf" };
  const l = Engine.skillLine(clear, tech);
  assert.equal(l.barred, null, "Clear Head left the TECH skill barred");
  assert.equal(l.formPenalty, -2);
  assert.equal(l.checkBonus, human - 2);
  bare.panelData = { form: "Werewolf" };
  assert.ok(Engine.skillLine(bare, tech).barred, "Feral Mind stopped barring TECH without Clear Head");
  same(Engine.formView(clear).changedBy.map(c => c.name), ["Clear Head"], "the form doesn't say what changed it");
});

test("Decision 199: a taken Werewolf Major resolves for a Werewolf, and versionCheck names one held by anyone else or with a junk id", () => {
  const issues = ch => Engine.versionCheck(ch).filter(x => /Major Milestone/.test(x));
  same(issues(withMajors(werewolf("trueborn"), "swift-change")), [], "a Werewolf's own Major reads as missing");
  same(issues(withMajors(subject(), "swift-change")), ['Major Milestone "swift-change" no longer exists in game data.']);
  same(issues(withMajors(werewolf("trueborn"), "<b>gone</b>")), ['Major Milestone "<b>gone</b>" no longer exists in game data.']);
  assert.equal(Engine.majorById(werewolf("trueborn"), "swift-change").name, "Swift Change");
  assert.equal(Engine.grants(withMajors(werewolf("trueborn"), "<b>gone</b>", "")).rou, 0, "a junk Major id granted something");
});

// ── The Vampire (0413): Base Powers, Bloodline choices, the Thirst, Pain
// Immunity (crb-v4-sync P4, Decisions 200–202) ───────────────────────────

const VAD = () => D.archetypes.find(a => a.id === "vampire");
function vampire(bloodline, { pl = "shadows", bod = 6, locked = true } = {}) {
  const ch = subject({ bod });
  ch.identity.archetype = "vampire";
  ch.creation.powerLevel = pl;
  ch.creation.locked = locked;
  ch.archetypeChoices.specialization = bloodline ? [bloodline] : [];
  return ch;
}
const vErrors = ch => Engine.validate("archetype", ch).filter(i => i.level === "error").map(i => i.msg);

test("Decision 200: Base Powers place one rank each, Innate or the Bloodline's, none past Max Starting Rank or the book's own", () => {
  const ch = vampire("strigoi", { pl: "street", locked: false });   // 2 Base Powers, Max Starting Rank 1
  const st = Engine.basePowerState(ch);
  same([st.count, st.cap, st.spent, st.left], [2, 1, 0, 2]);
  same(st.rows.map(r => r.origin || "innate").filter((x, i, a) => a.indexOf(x) === i), ["innate", "strigoi"], "another Bloodline's powers are offered");
  assert.equal(Engine.powerRanks(ch).filter(p => p.kind === "archetype").length, 0, "a Vampire holds powers before placing a Base Power");
  assert.ok(Engine.placeBasePower(ch, "shadow-play", 1).ok);
  assert.match(Engine.placeBasePower(ch, "shadow-play", 1).why, /can start at rank 1 at most/);
  assert.match(Engine.placeBasePower(ch, "iron-hide", 1).why, /isn't one you can take/, "an Upyr power on a Strigoi");
  assert.ok(Engine.placeBasePower(ch, "preternatural-speed", 1).ok);
  assert.match(Engine.placeBasePower(ch, "bestial-blessings", 1).why, /No Base Powers left/);
  same(Engine.powerRanks(ch).filter(p => p.kind === "archetype").map(p => `${p.id}:${p.rank}`), ["preternatural-speed:1", "shadow-play:1"].sort((a, b) => VAD().powers.findIndex(p => a.startsWith(p.id)) - VAD().powers.findIndex(p => b.startsWith(p.id))));
  same(vErrors(ch).filter(m => /Base Power|rank|isn't one/.test(m)), []);
  // Taking one back never refuses.
  assert.ok(Engine.placeBasePower(ch, "shadow-play", -1).ok);
  assert.equal("shadow-play" in ch.archetypeChoices.basePowers, false);

  // World Coming Down: 5, up to rank 3, but never past the book's printed max (Iron Hide's 3, Nightmare Visage's 3).
  const w = vampire("upyr", { pl: "wcd", locked: false });
  Engine.setOptionPick(w, "built-to-last", "iron-hide");
  for (let i = 0; i < 3; i++) assert.ok(Engine.placeBasePower(w, "iron-hide", 1).ok);
  assert.match(Engine.placeBasePower(w, "iron-hide", 1).why, /rank 3 at most/);
  assert.match(Engine.placeBasePower(w, "preternatural-speed", 1).ok ? Engine.placeBasePower(w, "preternatural-speed", 1).why : "", /has no ranks/);
});

test("Decision 200: validate warns of unplaced Base Powers, blocks over and out of reach, and the lock waits while one can still go", () => {
  const ch = vampire("draugur", { pl: "heroic", locked: false });   // 3 Base Powers, rank 2
  const warn = () => Engine.validate("archetype", ch).filter(i => i.pool === "basePowers").map(i => i.msg);
  same(warn(), ["3 Base Powers unplaced."]);
  assert.equal(Engine.spendable(ch, "basePowers"), true);
  assert.ok(Engine.validate("review", ch).some(i => i.level === "error" && /Base Powers unplaced\. Spend them before you lock/.test(i.msg)));
  ch.archetypeChoices.basePowers = { "battleborn-instinct": 3, "shadow-play": 1, "no-such": 1 };
  const errs = vErrors(ch);
  assert.ok(errs.includes("Base Powers overspent by 2."), errs.join(" | "));
  assert.ok(errs.includes("Battleborn Instinct is rank 3. It can start at 2 at most."));
  assert.ok(errs.includes("Shadow Play (Masked) isn't one of your powers. Take back its Base Power."));
  assert.ok(errs.includes("no-such isn't one of your powers. Take back its Base Power."));
  // A power held only through a stray rank isn't held at all.
  assert.equal(Engine.powerRanks(ch).some(p => p.id === "shadow-play"), false);
  ch.archetypeChoices.basePowers = { "battleborn-instinct": 2, "deathless-resilience": 1 };
  same(warn(), []);
  assert.equal(Engine.spendable(ch, "basePowers"), false);
  // An archetype that doesn't buy (the Werewolf) has no state and no check.
  assert.equal(Engine.basePowerState(werewolf("trueborn")), null);
});

test("Decision 200: a power with no ranks is held at 1 and never raised; a ranked one raises on powerIpe at rank × 20", () => {
  const ch = vampire("draugur", { pl: "heroic" });
  ch.archetypeChoices.basePowers = { "deathless-resilience": 1, "battleborn-instinct": 2 };
  assert.match(Engine.ipCost(ch, "power", "deathless-resilience").why, /has no ranks/);
  ch.progression.ip.earned = 500;
  const c = Engine.ipCost(ch, "power", "battleborn-instinct");
  same([c.from, c.to, c.cost], [2, 3, D.ip.powerIncreaseCost.perRank * 2]);
  assert.ok(Engine.spendIP(ch, "power", "battleborn-instinct").ok);
  same([rankOf(ch, "battleborn-instinct").rank, ch.progression.powerIpe["battleborn-instinct"], ch.archetypeChoices.basePowers["battleborn-instinct"]], [3, 1, 2],
    "IP lands on powerIpe, creation's ranks stay put");
  // An IP rank on a power never placed doesn't hold it.
  ch.progression.powerIpe["vitality-surge"] = 2;
  assert.equal(Engine.powerRanks(ch).some(p => p.id === "vitality-surge"), false);
});

test("Decision 200 (F41's stub): Built to Last bars the power not chosen, and choosing again takes its ranks back", () => {
  const ch = vampire("upyr", { pl: "shadows", locked: false });
  const pool = () => Engine.powerPool(ch).map(p => p.id);
  assert.ok(!pool().includes("iron-hide") && !pool().includes("icebound-resilience"), "both offered before Built to Last is chosen");
  assert.ok(vErrors(ch).includes("Choose Built to Last."));
  assert.ok(Engine.setOptionPick(ch, "built-to-last", "iron-hide").ok);
  assert.ok(pool().includes("iron-hide") && !pool().includes("icebound-resilience"));
  Engine.placeBasePower(ch, "iron-hide", 1);
  assert.ok(Engine.setOptionPick(ch, "built-to-last", "icebound-resilience").ok);
  same(ch.archetypeChoices.basePowers, {}, "Iron Hide's rank stayed after choosing Icebound Resilience");
  assert.equal(Engine.setOptionPick(ch, "built-to-last", "red-mist").ok, false);
  assert.equal(Engine.setOptionPick(ch, "ancient-weapon", "blade").ok, false, "an Upyr took a Draugur's choice");
});

test("Decision 200: Iron Hide and Icebound Resilience are Natural Armor while running, asked for, never summed", () => {
  const ch = vampire("upyr", { pl: "wcd" });
  ch.archetypeChoices.optionPicks = { "built-to-last": "iron-hide" };
  ch.archetypeChoices.basePowers = { "iron-hide": 2 };
  const na = Engine.naturalArmor(ch);
  same([na.total, na.conditional.map(c => `${c.id}:${c.amount}`)], [0, ["iron-hide:3"]], "rank 2 is Natural Armor 3");
  assert.equal(Engine.naturalArmor(ch, ["iron-hide"]).total, 3);
  ch.progression.powerIpe["iron-hide"] = 1;
  assert.equal(Engine.naturalArmor(ch, ["iron-hide"]).total, 4, "a rank IP bought adds");
  ch.archetypeChoices.optionPicks = { "built-to-last": "icebound-resilience" };
  ch.archetypeChoices.basePowers = { "icebound-resilience": 3 };
  same(Engine.naturalArmor(ch).conditional.map(c => `${c.id}:${c.amount}`), ["icebound-resilience:1"], "Icebound's +1 grew with its rank");
  // No other archetype gains a source.
  same(Engine.naturalArmor(werewolf("trueborn")).conditional, []);
});

test("Decision 200: the bite always, the claws with Bestial Blessings at +1 a rank, the Ancient Weapon from its pick, silent while the Code is broken", () => {
  const ch = vampire("draugur", { pl: "wcd", bod: 7 });
  const line = name => Engine.archetypeWeapons(ch).find(w => w.name === name);
  same(Engine.archetypeWeapons(ch).map(w => `${w.name}:${w.damage}`), ["Bite:10"], "BOD 7 + 3");
  ch.archetypeChoices.basePowers = { "bestial-blessings": 3 };
  same([line("Claws").damage, line("Claws").damageFormula, line("Claws").tags], [12, "BOD+5", ["AP"]], "rank 3 claws are BOD+5");
  ch.archetypeChoices.optionPicks = { "ancient-weapon": "blunt" };
  same([line("Blunt").damage, line("Blunt").tags, line("Blunt").extra, line("Blunt").off], [14, ["Bound", "Knockdown"], ["Reach 1m", "Parry +1"], false]);
  assert.ok(Engine.setToggle(ch, "code", "Broken").ok);
  same([line("Blunt").off, line("Blunt").attack, line("Blunt").damage], [true, null, null]);
  assert.match(line("Blunt").offText, /doesn't answer/);
  same(Engine.toggleView(ch, Engine.archPanels(ch).find(p => p.id === "code")).map(o => [o.name, o.on, !!o.text]), [["Kept", false, false], ["Broken", true, true]]);
  // The Code is the Draugur's panel alone.
  assert.equal(Engine.archPanels(vampire("strigoi")).some(p => p.id === "code"), false);
  assert.equal(Engine.formState(ch), null, "the Code reads as a form");
  same(Engine.archetypeWeapons(werewolf("trueborn")), []);
});

test("Decision 201: Feed refills 3 SFR a fresh HL to the max and 2 a stored one to half; a day unfed takes half RoU; Hunger at RoU", () => {
  const ch = vampire("upyr", { pl: "shadows" });   // RoU 8
  const v = () => Engine.feedView(ch, Engine.archPanels(ch).find(p => p.type === "feed"));
  const max = Engine.sfr(ch).value;
  same([v().current, v().max, v().rou, v().low], [max, max, 8, false]);
  assert.ok(Engine.goUnfed(ch, "thirst").ok);
  assert.equal(v().current, max - 4, "half of RoU 8");
  ch.trackers.sfr.spent = max - 2;
  same([v().current, v().low, v().lowName], [2, true, "Hunger"]);
  // Stored: 2 a HL, never past half the max.
  const half = Math.floor(max / 2);
  same(Engine.feed(ch, "thirst", "stored", 20).gain, half - 2);
  assert.equal(v().current, half);
  same(Engine.feed(ch, "thirst", "stored", 1).gain, 0, "stored blood filled past half");
  // Fresh: 3 a HL, to the max.
  same(Engine.feed(ch, "thirst", "fresh", 1).gain, 3);
  Engine.feed(ch, "thirst", "fresh", 99);
  same([v().current, ch.trackers.sfr.spent], [max, 0]);
  // A day unfed stops at empty.
  ch.trackers.sfr.spent = max - 1;
  same(Engine.goUnfed(ch, "thirst").lost, 1);
  same(v().current, 0);
  // Spend past a max that fell is empty, not deeper.
  ch.trackers.sfr.spent = max + 50;
  Engine.feed(ch, "thirst", "fresh", 1);
  assert.equal(v().current, 3);
  // Refusals.
  for (const [k, n] of [["fresh", 0], ["fresh", "2.5"], ["fresh", "<b>"], ["nope", 1]]) assert.equal(Engine.feed(ch, "thirst", k, n).ok, false, `${k} ${n}`);
  assert.equal(Engine.feed(werewolf("trueborn"), "thirst", "fresh", 1).ok, false, "a Werewolf fed");
});

test("Decision 202: a Vampire's Pain counts only the Health Levels Withering took, Conditions still add, and no one else changes", () => {
  const ch = vampire("upyr", { bod: 6 });
  const hp = Engine.health(ch).hpPer;
  ch.trackers.damage = hp * 4;
  same([Engine.painState(ch).hlLost, Engine.painState(ch).level, Engine.painState(ch).immunity.name], [4, 0, "Pain Immunity"]);
  ch.trackers.witheringDamage = hp * 4;
  const ww = werewolf("trueborn"); ww.stats.BOD.base = 6; ww.trackers.damage = hp * 4;
  assert.equal(Engine.painState(ch).level, Engine.painState(ww).level, "Withering's Health Levels hurt a Vampire as they would anyone");
  assert.ok(Engine.painState(ch).level > 0);
  ch.trackers.witheringDamage = 0;
  ch.trackers.conditions = [{ id: "agonized" }];
  assert.equal(Engine.painState(ch).fromConditions > 0 && Engine.painState(ch).level === Engine.painState(ch).fromConditions, true, "Agonized still hurts");
  // Everyone else reads Pain as before.
  for (const a of D.archetypes.filter(x => x.id !== "vampire")) {
    const o = subject({ bod: 6 }); o.identity.archetype = a.id; o.trackers.damage = hp * 4;
    assert.equal(Engine.painState(o).immunity, null, `${a.id} has Pain Immunity`);
    assert.ok(Engine.painState(o).level > 0, `${a.id} felt no Pain`);
  }
});

test("schema 0.19: newCharacter has basePowers and optionPicks; migrate keeps whole counts and text, drops junk and the Blood Pool", () => {
  same([Engine.newCharacter().archetypeChoices.basePowers, Engine.newCharacter().archetypeChoices.optionPicks], [{}, {}]);
  const old = vampire("draugur");
  old.meta.schemaVersion = "0.18";
  delete old.archetypeChoices.basePowers; delete old.archetypeChoices.optionPicks;
  old.trackers.panel = { "blood-pool": { value: 3, max: 20 }, "sfr": { value: 1 } };
  const m = Engine.migrate(JSON.parse(JSON.stringify(old)));
  same([m.meta.schemaVersion, m.archetypeChoices.basePowers, m.archetypeChoices.optionPicks, Object.keys(m.trackers.panel)], ["0.19", {}, {}, ["sfr"]]);
  const junk = vampire("draugur");
  junk.archetypeChoices.basePowers = { "battleborn-instinct": "2", "hels-dread": -1, "odins-aegis": 1.7, "spectral-veil": "x", "blood-of-valhalla": 1e9, "x": null };
  junk.archetypeChoices.optionPicks = { "ancient-weapon": "blade", "code": { hunt: "the guilty", bond: 7, word: "<b>kept</b>" }, "n": 5, "a": ["blade"] };
  const j = Engine.migrate(JSON.parse(JSON.stringify(junk)));
  same(j.archetypeChoices.basePowers, { "battleborn-instinct": 2, "odins-aegis": 1, "blood-of-valhalla": D.ip.rankCap });
  same(j.archetypeChoices.optionPicks, { "ancient-weapon": "blade", "code": { hunt: "the guilty", word: "<b>kept</b>" } });
  for (const v of [null, "x", 5, []]) {
    const c = vampire("upyr"); c.archetypeChoices.basePowers = v; c.archetypeChoices.optionPicks = v;
    const r = Engine.migrate(JSON.parse(JSON.stringify(c)));
    same([r.archetypeChoices.basePowers, r.archetypeChoices.optionPicks], [{}, {}], JSON.stringify(v));
  }
  // A Vampire saved before 0413 (no Bloodline) loads and asks for one.
  const bare = Engine.migrate(JSON.parse(JSON.stringify(vampire(null))));
  same([Engine.archetypePowers(bare), Engine.basePowerState(bare).spent], [[], 0]);
  assert.ok(Engine.validate("archetype", bare).some(i => i.msg === "Choose a Bloodline."));
});

// ── Sessions and threads (Decisions 203–204) ────────────────────────────────
const TODAY = (() => { const d = new Date(), p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
const sessOf = (t, id) => t.sessions.find(s => s.id === id);
const thrOf = (t, id) => t.threads.find(h => h.id === id);

test("203: a new table has no sessions or threads, and a 0.7 table opens as 0.8 with both empty and every session null", () => {
  const t = Engine.newTable("x");
  eq([t.sessions, t.threads], [[], []]);
  const a = Engine.addCastMember(t, { name: "Dez" }).id;
  Engine.addInteraction(t, { kind: "shared", cast: [a], text: "met", date: "2026-10-01" });
  const old = plain(t);
  old.meta.tableSchemaVersion = "0.7";
  delete old.sessions; delete old.threads;
  for (const x of old.interactions) delete x.session;
  const m = Engine.migrateTable(old);
  assert.equal(m.meta.tableSchemaVersion, "0.9");
  eq([m.sessions, m.threads], [[], []]);
  assert.ok(m.interactions.every(x => x.session === null));
  eq(m, Engine.migrateTable(t));
  // A 0.7 file with sessions on the lines' days (a hand edit) still converts nothing.
  const odd = plain(t);
  odd.meta.tableSchemaVersion = "0.7";
  odd.sessions = [{ id: "SE-AAAAAAAA", date: "2026-10-01" }];
  odd.interactions[0].session = "SE-AAAAAAAA";
  assert.equal(Engine.migrateTable(odd).interactions[0].session, null);
});

test("203: addSession numbers one past the highest, not past the count, and dates today", () => {
  const t = Engine.newTable("x");
  const a = Engine.addSession(t);
  assert.equal(sessOf(t, a.id).number, 1);
  assert.equal(sessOf(t, a.id).date, TODAY);
  Engine.addSession(t, { number: 21 });
  const c = Engine.addSession(t);
  assert.equal(sessOf(t, c.id).number, 22);
  assert.ok(Engine.addSession(Engine.newTable("y"), { number: 0 }).ok);
  assert.ok(Engine.addSession(t, { date: "nope" }).ok);
  assert.equal(t.sessions[0].date, null);
  assert.equal(t.sessions.length, 4);
});

test("203: editSession sets each field, refuses a bad number or hours untouched, and a blank is null", () => {
  const t = Engine.newTable("x");
  const id = Engine.addSession(t).id;
  assert.ok(Engine.editSession(t, id, { number: "4", date: "2026-10-03", present: [" Wren ", "", "Rook"], hours: "3.5",
    journal: { happened: "a", seed: "b" } }).ok);
  const s = sessOf(t, id);
  eq([s.number, s.date, s.present, s.hours, s.journal.happened, s.journal.seed, s.journal.fallout], [4, "2026-10-03", ["Wren", "Rook"], 3.5, "a", "b", ""]);
  const before = plain(t);
  for (const f of [{ number: "1.5" }, { number: -1 }, { number: "x" }, { hours: 0.3 }, { hours: 25 }, { hours: "x" }])
    assert.equal(Engine.editSession(t, id, { ...f, date: "2026-01-01" }).ok, false, JSON.stringify(f));
  eq(Engine.editSession(t, id, { number: "x" }), { ok: false, why: "Enter a whole number." });
  eq(Engine.editSession(t, id, { hours: 25 }), { ok: false, why: "Enter hours, in halves." });
  eq(t, before, "a refusal changes nothing");
  assert.ok(Engine.editSession(t, id, { number: "", hours: null, date: "2026-02-30" }).ok);
  eq([s.number, s.hours, s.date], [null, null, null]);
  assert.equal(Engine.editSession(t, "SE-NOBODY00", {}).ok, false);
  assert.equal(Engine.sessionTitle(s), "Session");
  assert.equal(Engine.sessionTitle({ number: 0 }), "Session 0");
});

test("203: sessionList is by number (none last), then day, then made", () => {
  const t = Engine.newTable("x");
  const mk = f => Engine.addSession(t, f).id;
  const a = mk({ number: 2, date: "2026-10-01" }), b = mk({ number: 10, date: "2026-09-01" });
  const c = mk({ number: 2, date: "2026-10-05" }), d = mk({ number: 5, date: null });
  Engine.editSession(t, d, { number: "" });
  eq(Engine.sessionList(t).map(s => s.id), [b, c, a, d]);
  eq(Engine.sessionList({}), []);
});

test("203: removeSession clears every session, opened and closed that named it", () => {
  const t = Engine.newTable("x");
  const s1 = Engine.addSession(t, { number: 1 }).id, s2 = Engine.addSession(t, { number: 2 }).id;
  const i = Engine.addInteraction(t, { kind: "shared", text: "a", session: s1 }).id;
  const j = Engine.addInteraction(t, { kind: "shared", text: "b", session: s2 }).id;
  const h = Engine.addThread(t, { title: "T", opened: s1 }).id;
  Engine.editThread(t, h, { status: "resolved", closed: s1 });
  assert.equal(thrOf(t, h).closed, s1);
  assert.ok(Engine.removeSession(t, s1).ok);
  const x = k => t.interactions.find(v => v.id === k);
  eq([x(i).session, x(j).session, thrOf(t, h).opened, thrOf(t, h).closed], [null, s2, null, null]);
  assert.equal(Engine.removeSession(t, s1).ok, false);
});

test("203: a new interaction takes the one session on its day, and a gate never does", () => {
  const t = Engine.newTable("x");
  const n = (text, date, session) => { const id = Engine.addInteraction(t, { kind: "shared", text, date, session }).id; return t.interactions.find(i => i.id === id); };
  assert.equal(n("none", "2026-10-01").session, null, "no session that day");
  const a = Engine.addSession(t, { number: 1, date: "2026-10-01" }).id;
  assert.equal(n("one", "2026-10-01").session, a);
  assert.equal(n("other day", "2026-10-02").session, null);
  assert.equal(n("no date", null).session, null);
  const b = Engine.addSession(t, { number: 2, date: "2026-10-01" }).id;
  assert.equal(n("two", "2026-10-01").session, null, "two that day: none");
  assert.equal(n("explicit", "2026-10-01", b).session, b, "f.session wins");
  assert.equal(n("bad explicit", "2026-10-02", "SE-NOBODY00").session, null);
  const x = t.interactions[0];
  assert.ok(Engine.editInteraction(t, x.id, { session: a }).ok);
  assert.equal(x.session, a);
  assert.ok(Engine.editInteraction(t, x.id, { session: null }).ok);
  assert.equal(x.session, null);
  eq(Engine.editInteraction(t, x.id, { session: "SE-NOBODY00", text: "changed" }), { ok: false, why: "No such session." });
  assert.notEqual(x.text, "changed");
});

test("203: an encounter's end on a day with one session links its line", () => {
  const { t, e, dezRow } = endTable();
  const s = Engine.addSession(t, { number: 1 }).id;
  const r = Engine.endEncounter(t, e, { rows: { [dezRow]: { line: true } } });
  assert.ok(r.ok, r.why);
  const lines = t.interactions.filter(i => i.kind === "fought");
  assert.ok(lines.length >= 1);
  assert.ok(lines.every(i => i.session === s && i.date === TODAY));
});

test("203: sessionOffered lists the day's unlinked lines, never linked ones, other days or a day-less session's", () => {
  const t = Engine.newTable("x");
  const put = (text, date, session) => Engine.addInteraction(t, { kind: "shared", text, date, session }).id;
  const old = put("old", "2026-10-01");                     // made before the session
  const s = Engine.addSession(t, { number: 1, date: "2026-10-01" }).id;
  const linked = put("linked", "2026-10-01"), later = put("later", "2026-10-02");
  eq(Engine.sessionOffered(t, s).map(x => x.id), [old]);
  eq(Engine.sessionInteractions(t, s).map(x => x.id), [linked]);
  Engine.editSession(t, s, { date: "" });
  eq(Engine.sessionOffered(t, s), []);
  eq(Engine.sessionOffered(t, "SE-NOBODY00"), []);
  assert.ok(later);
});

test("204: threads: a blank title is refused, current moves one at a time, a closed thread can't be current", () => {
  const t = Engine.newTable("x");
  eq(Engine.addThread(t, { title: "  " }), { ok: false, why: "Name the thread." });
  const a = Engine.addThread(t, { title: " Find Wren " }).id, b = Engine.addThread(t, { title: "B" }).id;
  assert.equal(thrOf(t, a).title, "Find Wren");
  assert.ok(Engine.editThread(t, a, { current: true }).ok);
  assert.ok(Engine.editThread(t, b, { current: true }).ok);
  eq([thrOf(t, a).current, thrOf(t, b).current], [false, true]);
  eq(Engine.editThread(t, a, { title: "" }), { ok: false, why: "Name the thread." });
  eq(Engine.editThread(t, a, { status: "bogus" }), { ok: false, why: "Choose a status." });
  assert.ok(Engine.editThread(t, a, { status: "dropped" }).ok);
  eq(Engine.editThread(t, a, { current: true }), { ok: false, why: "Only an open thread can be current." });
  assert.equal(Engine.editThread(t, "TH-NOBODY00", {}).ok, false);
  assert.equal(Engine.removeThread(t, a).ok, true);
  assert.equal(Engine.removeThread(t, a).ok, false);
});

test("204: resolving closes in the newest session by number and clears current; reopening clears closed", () => {
  const t = Engine.newTable("x");
  const hi = Engine.addSession(t, { number: 21 }).id, lo = Engine.addSession(t, { number: 3 }).id;   // lo was made later
  const h = Engine.addThread(t, { title: "T" }).id;
  Engine.editThread(t, h, { current: true });
  Engine.editThread(t, h, { status: "resolved" });
  eq([thrOf(t, h).status, thrOf(t, h).closed, thrOf(t, h).current], ["resolved", hi, false]);
  Engine.editThread(t, h, { closed: lo });
  assert.equal(thrOf(t, h).closed, lo);
  Engine.editThread(t, h, { closed: "SE-NOBODY00" });
  assert.equal(thrOf(t, h).closed, null);
  Engine.editThread(t, h, { status: "open" });
  eq([thrOf(t, h).status, thrOf(t, h).closed], ["open", null]);
  Engine.editThread(t, h, { status: "dropped", closed: lo });
  assert.equal(thrOf(t, h).closed, lo);
  const bare = Engine.newTable("y"), g = Engine.addThread(bare, { title: "G" }).id;
  Engine.editThread(bare, g, { status: "resolved" });
  assert.equal(thrOf(bare, g).closed, null, "no sessions: null");
});

test("204: threadList is open first (current, then oldest), then the closed, latest touched first", () => {
  const t = Engine.newTable("x");
  const mk = (title, created) => { const id = Engine.addThread(t, { title }).id; thrOf(t, id).created = created; return id; };
  const a = mk("a", "2026-01-03T00:00:00.000Z"), b = mk("b", "2026-01-01T00:00:00.000Z"), c = mk("c", "2026-01-02T00:00:00.000Z");
  const d = mk("d", "2026-01-01T00:00:00.000Z"), e = mk("e", "2026-01-01T00:00:00.000Z");
  thrOf(t, a).current = true;
  Engine.editThread(t, d, { status: "resolved" }); thrOf(t, d).updated = "2026-02-01T00:00:00.000Z";
  Engine.editThread(t, e, { status: "dropped" }); thrOf(t, e).updated = "2026-03-01T00:00:00.000Z";
  eq(Engine.threadList(t).map(h => h.id), [a, b, c, e, d]);
  eq(Engine.threadList({}), []);
});

test("204: blockHasNumber agrees with the old UI test on blocks, and is false for junk", () => {
  const old = b => !!b && (Object.values(b.stats || {}).concat(Object.values(b.authored || {}), (b.skills || []).map(k => k.total)).some(v => typeof v === "number"));
  const blocks = [null, undefined, {}, { stats: {} }, { stats: { BOD: 6 } }, { stats: { BOD: null }, authored: { TOL: 1 } },
    { stats: {}, skills: [{ total: 4 }] }, { stats: {}, skills: [{ total: null }] }, { stats: { BOD: null }, authored: { TOL: null }, skills: [] }];
  for (const b of blocks) assert.equal(Engine.blockHasNumber(b), old(b), JSON.stringify(b));
  for (const j of ["x", 5, [], { stats: 5 }, { skills: "x" }, { skills: [null] }]) assert.equal(Engine.blockHasNumber(j), false);
});

test("204: nextSession is empty on an empty table, orders its threads, and reads the highest-numbered session", () => {
  const none = { current: null, open: [], last: null, seed: "", unbuilt: [] };
  eq(Engine.nextSession(Engine.newTable("x")), none);
  eq(Engine.nextSession(null), none);
  const t = Engine.newTable("x");
  const mk = (title, created) => { const id = Engine.addThread(t, { title }).id; thrOf(t, id).created = created; return id; };
  const a = mk("a", "2026-01-03T00:00:00.000Z"), b = mk("b", "2026-01-01T00:00:00.000Z"), c = mk("c", "2026-01-02T00:00:00.000Z");
  Engine.editThread(t, a, { current: true });
  const n = Engine.nextSession(t);
  eq([n.current.id, n.open.map(h => h.id)], [a, [b, c]]);
  const hi = Engine.addSession(t, { number: 5, date: "2026-01-05" }).id;
  Engine.addSession(t, { number: 4, date: "2026-01-04" });   // made later, numbered lower
  Engine.editSession(t, hi, { journal: { seed: "  The heist.  " } });
  const m = Engine.nextSession(t);
  eq([m.last.id, m.seed], [hi, "The heist."]);
});

test("204: unbuilt is last session's members with no number, once each, in the cast's order, not the removed", () => {
  const t = Engine.newTable("x");
  const mk = n => Engine.addCastMember(t, { name: n }).id;
  const a = mk("A"), b = mk("B"), c = mk("C"), d = mk("D"), gone = mk("Gone");
  Engine.setCastBlock(t, c, { stats: { BOD: 6 } });
  const s1 = Engine.addSession(t, { number: 1, date: "2026-01-01" }).id, s2 = Engine.addSession(t, { number: 2, date: "2026-01-02" }).id;
  const put = (ids, session) => Engine.addInteraction(t, { kind: "shared", text: "x", cast: ids, session });
  put([d], s1);                       // met two sessions ago: not listed
  put([b, a], s2); put([a, c], s2);   // a twice
  put([gone], s2);
  Engine.removeCastMember(t, gone);
  const order = t.cast.map(n => n.name).filter(n => n === "A" || n === "B");
  eq(Engine.nextSession(t).unbuilt.map(n => n.name), order);
  assert.ok(!Engine.nextSession(t).unbuilt.some(n => n.id === c), "a block with a number is not listed");
  Engine.setCastBlock(t, a, { stats: { REF: 3 } });
  eq(Engine.nextSession(t).unbuilt.map(n => n.name), ["B"]);
});

test("204 (review): last session is the highest number not dated today; tonight's session being made leaves last session as it was", () => {
  const t = Engine.newTable("x");
  const mk = (number, date) => Engine.addSession(t, { number, date }).id;
  eq(Engine.nextSession(t).last, null);
  // A single session dated today is the one being played: no last session, no seed.
  const one = mk(1, TODAY);
  Engine.editSession(t, one, { journal: { seed: "tonight's" } });
  eq([Engine.nextSession(t).last, Engine.nextSession(t).seed], [null, ""]);
  const t2 = Engine.newTable("y");
  const m2 = (number, date) => Engine.addSession(t2, { number, date }).id;
  const s5 = m2(5, "2026-09-01"), s6 = m2(6, "2026-09-08");
  Engine.editSession(t2, s6, { journal: { seed: "last week's seed" } });
  eq(Engine.nextSession(t2).last.id, s6);
  // Tonight's session is made: last is still Session 6, and its seed still shows.
  const s7 = m2(7, TODAY);
  const n = Engine.nextSession(t2);
  eq([n.last.id, n.seed], [s6, "last week's seed"]);
  // Two sessions today: last is the lower-numbered of today's.
  const t3 = Engine.newTable("z");
  const a = Engine.addSession(t3, { number: 4, date: "2026-09-01" }).id;
  const b = Engine.addSession(t3, { number: 5, date: TODAY }).id, c = Engine.addSession(t3, { number: 6, date: TODAY }).id;
  eq(Engine.nextSession(t3).last.id, b);
  // No dates at all: the highest number.
  const t4 = Engine.newTable("w");
  Engine.addSession(t4, { number: 1, date: "" }); const two = Engine.addSession(t4, { number: 2, date: "nope" }).id;
  eq(Engine.nextSession(t4).last.id, two);
  assert.ok(s7 && a && c);
});

test("204 (review): Resolved to Dropped keeps the Closed in the GM set; only open to closed records the newest session", () => {
  const t = Engine.newTable("x");
  const old = Engine.addSession(t, { number: 1, date: "2026-01-01" }).id, newest = Engine.addSession(t, { number: 2, date: "2026-01-02" }).id;
  const h = Engine.addThread(t, { title: "T" }).id;
  Engine.editThread(t, h, { status: "resolved" });
  assert.equal(thrOf(t, h).closed, newest);
  Engine.editThread(t, h, { closed: old });
  Engine.editThread(t, h, { status: "dropped" });
  assert.equal(thrOf(t, h).closed, old, "switching between closed statuses moves nothing");
  Engine.editThread(t, h, { status: "resolved", closed: newest });
  assert.equal(thrOf(t, h).closed, newest, "unless the GM names one");
  Engine.editThread(t, h, { status: "open" });
  Engine.editThread(t, h, { status: "dropped" });
  assert.equal(thrOf(t, h).closed, newest, "reopened and closed again: the newest session");
});

test("204 (round 2): a session dated after today is never last session; undated ones still count", () => {
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 7); const p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
  const last = (...rows) => { const t = Engine.newTable("x"); const ids = rows.map(([n, d]) => Engine.addSession(t, { number: n, date: d }).id); const l = Engine.nextSession(t).last; return l ? ids[rows.findIndex((_, i) => ids[i] === l.id)] && rows[ids.indexOf(l.id)][0] : null; };
  assert.equal(last([7, tomorrow], [6, "2026-01-01"]), 6, "next week's is skipped");
  assert.equal(last([8, tomorrow], [7, TODAY], [6, "2026-01-01"]), 6, "then today's is the one being played");
  assert.equal(last([6, TODAY], [5, TODAY], [4, "2026-01-01"]), 5, "unchanged");
  assert.equal(last([7, tomorrow]), null, "only a future session: none");
  assert.equal(last([7, tomorrow], [2, ""]), 2, "undated stays in");
  const t = Engine.newTable("y");
  const six = Engine.addSession(t, { number: 6, date: "2026-10-01" }).id;
  Engine.editSession(t, six, { journal: { seed: "the seed" } });
  Engine.addSession(t, { number: 7, date: tomorrow });
  eq(Engine.nextSession(t).seed, "the seed");
});

// ── The close-out (Decisions 205–206) ───────────────────────────────────────
const closeOf = (t, id) => sessOf(t, id).close;
function crew(t, n, date, present, hours = null) {
  const id = Engine.addSession(t, { number: n, date }).id;
  Engine.editSession(t, id, { present, hours });
  return id;
}
const away = (name, tier, credits = null) => ({ name, present: false, ip: null, milestone: false, credits, tier, note: "" });
const here = (name, ip, extra = {}) => ({ name, present: true, ip, milestone: true, credits: null, tier: null, note: "", ...extra });

test("205: a new session has close null, and a 0.8 table opens as 0.9 with every close null and nothing else changed", () => {
  const t = Engine.newTable("x");
  const id = crew(t, 4, "2026-10-01", ["Wren"], 3);
  assert.equal(closeOf(t, id), null);
  const old = plain(t);
  old.meta.tableSchemaVersion = "0.8";
  for (const s of old.sessions) delete s.close;
  eq(Engine.migrateTable(old), Engine.migrateTable(t));
  // A 0.8 file that already carries a close (a hand edit) is not converted either.
  old.sessions[0].close = { at: null, lines: [here("Wren", 5)] };
  assert.equal(Engine.migrateTable(old).sessions[0].close, null);
  assert.equal(Engine.migrateTable(old).meta.tableSchemaVersion, "0.9");
});

test("206: offScreenPay is the tier's minimum to its midpoint, Legendary's to offScreenMax, and an unknown tier is null", () => {
  eq(Engine.offScreenPay("novice"), { min: 50, max: 125 });
  eq(Engine.offScreenPay("competent"), { min: 300, max: 550 });
  eq(Engine.offScreenPay("skilled"), { min: 1000, max: 2000 });
  eq(Engine.offScreenPay("expert"), { min: 4000, max: 6000 });
  eq(Engine.offScreenPay("legendary"), { min: 10000, max: 15000 });
  for (const v of ["mythic", "", null, undefined, 3, {}]) assert.equal(Engine.offScreenPay(v), null);
});

test("206: arcDue goes by the session's number: Minor at 5, 15, 25; Major at 10, 20, 30; nothing for the rest", () => {
  for (const n of [5, 15, 25]) eq(Engine.arcDue(n), { minor: true, major: false }, String(n));
  for (const n of [10, 20, 30]) eq(Engine.arcDue(n), { minor: false, major: true }, String(n));
  for (const n of [0, 1, 4, 6, 9, 11, -5, 5.5, null, undefined, "5", NaN]) eq(Engine.arcDue(n), { minor: false, major: false }, String(n));
});

test("206: the draft works IP out at 5 an hour rounded up, and blank with no hours", () => {
  const t = Engine.newTable("x");
  const a = crew(t, 4, "2026-10-01", ["Wren", " wren ", "Rook"], 3.5);
  const d = Engine.closeOutDraft(t, a);
  eq(d.present.map(p => [p.name, p.ip, p.milestone]), [["Wren", 18, true], ["Rook", 18, true]]);
  assert.equal(d.perHour, 5);
  Engine.editSession(t, a, { hours: 3 });
  eq(Engine.closeOutDraft(t, a).present.map(p => p.ip), [15, 15]);
  Engine.editSession(t, a, { hours: 0.5 });
  eq(Engine.closeOutDraft(t, a).present.map(p => p.ip), [3, 3], "2.5 rounds up");
  Engine.editSession(t, a, { hours: null });
  eq(Engine.closeOutDraft(t, a).present.map(p => p.ip), [null, null]);
  assert.equal(Engine.closeOutDraft(t, "SE-NOBODY00"), null);
  assert.equal(Engine.closeOutDraft({}, "SE-NOBODY00"), null);
});

test("206: the absent are the names at EARLIER sessions only, folded, first spelling, in the order first met", () => {
  const t = Engine.newTable("x");
  const s2 = crew(t, 2, "2026-09-01", ["Dez", "Rook"]);
  const s3 = crew(t, 3, "2026-09-08", ["dez", "Sol"]);
  const s4 = crew(t, 4, "2026-09-15", ["Wren"]);
  crew(t, 9, "2026-12-01", ["Planned"]);
  crew(t, 5, "2026-09-22", ["Later"]);
  eq(Engine.closeOutDraft(t, s4).absent.map(a => a.name), ["dez", "Sol", "Rook"]);
  eq(Engine.closeOutDraft(t, s2).absent, [], "nothing before the first");
  eq(Engine.closeOutDraft(t, s3).absent.map(a => a.name), ["Rook"]);
});

test("206: the remembered tier is the newest written line before this session, not the oldest, and none later", () => {
  const t = Engine.newTable("x");
  const s1 = crew(t, 1, "2026-09-01", ["Dez"]);
  const s2 = crew(t, 2, "2026-09-08", ["Wren"]);
  const s3 = crew(t, 3, "2026-09-15", ["Wren"]);
  const s4 = crew(t, 4, "2026-09-22", ["Wren"]);
  assert.ok(Engine.writeCloseOut(t, s2, { lines: [here("Wren", 5), away("dez", "novice")] }).ok);
  assert.ok(Engine.writeCloseOut(t, s3, { lines: [here("Wren", 5), away("Dez", "skilled")] }).ok);
  const later = crew(t, 5, "2026-09-29", ["Dez"]);
  assert.ok(Engine.writeCloseOut(t, later, { lines: [away("Dez", "expert")] }).ok);
  const d = Engine.closeOutDraft(t, s4);
  eq(d.absent.map(a => [a.name, a.tier, a.range]), [["Dez", "skilled", { min: 1000, max: 2000 }]]);
  eq(Engine.closeOutDraft(t, s2).absent.map(a => a.tier), [null]);
  assert.ok(s1);
});

test("206: newcomers are the cast this session's lines name or made on its day, with no motive, resources or Line", () => {
  const t = Engine.newTable("x");
  const named = Engine.addCastMember(t, { name: "Named" }).id;
  const given = Engine.addCastMember(t, { name: "HasLine" }).id;
  const today = Engine.addCastMember(t, { name: "Today" }).id;
  const old = Engine.addCastMember(t, { name: "Old" }).id;
  Engine.editCastMember(t, given, { line: "Hello." });
  t.cast.find(n => n.id === old).created = "2020-01-01T12:00:00.000Z";
  const s = Engine.addSession(t, { number: 4, date: TODAY }).id;
  Engine.addInteraction(t, { kind: "shared", cast: [named, given, named], text: "x", session: s });
  const names = () => Engine.closeOutDraft(t, s).newcomers.map(n => n.name).sort();
  eq(names(), ["Named", "Today"]);
  Engine.editCastMember(t, today, { motivation: "Money." });
  eq(names(), ["Named"]);
  const other = Engine.addSession(t, { number: 3, date: "2020-01-01" }).id;
  eq(Engine.closeOutDraft(t, other).newcomers.map(n => n.name), ["Old"], "created on that day");
});

test("205: writeCloseOut stores the lines and stamps; Redo replaces and never appends", () => {
  const t = Engine.newTable("x");
  const a = crew(t, 4, "2026-10-01", ["Wren"], 3);
  assert.ok(Engine.writeCloseOut(t, a, { lines: [here("Wren", "15", { credits: "250", note: "ok" }), here("Rook", "")] }).ok);
  const c = closeOf(t, a);
  assert.match(c.at, /^\d{4}-/);
  eq(c.lines.map(l => [l.name, l.ip, l.credits, l.milestone]), [["Wren", 15, 250, true], ["Rook", null, null, true]]);
  assert.ok(Engine.writeCloseOut(t, a, { lines: [here("Wren", 20)] }).ok);
  eq(closeOf(t, a).lines.map(l => [l.name, l.ip]), [["Wren", 20]]);
  eq(Engine.migrateTable(plain(t)).sessions[0].close, closeOf(t, a), "the gate keeps what was written");
});

test("205: writeCloseOut refuses a bad line and changes nothing; a blank IP or Çredits is null", () => {
  const t = Engine.newTable("x");
  const a = crew(t, 4, "2026-10-01", ["Wren"], 3);
  Engine.writeCloseOut(t, a, { lines: [here("Wren", 5)] });
  const before = plain(t);
  const bad = (lines, why) => { const r = Engine.writeCloseOut(t, a, { lines }); assert.equal(r.ok, false); assert.equal(r.why, why); eq(t, before, "a refusal changes nothing"); };
  bad([], "Nobody to write down.");
  bad([here("  ", 1)], "Each line needs its own name.");
  bad([here("Wren", 1), here(" wren", 2)], "Each line needs its own name.");
  for (const ip of [-1, 1.5, "x", {}, "2.5"]) bad([here("Wren", ip)], "Enter a whole number.");
  bad([here("Wren", 1, { credits: -5 })], "Enter a whole number.");
  bad([away("Dez", "mythic")], "Choose a tier.");
  eq(Engine.writeCloseOut(t, "SE-NOBODY00", { lines: [here("Wren", 1)] }), { ok: false, why: "No such session." });
  eq(Engine.writeCloseOut(t, a, null), { ok: false, why: "Nobody to write down." });
  assert.ok(Engine.writeCloseOut(t, a, { lines: [here("Wren", null, { credits: "" })] }).ok);
  eq([closeOf(t, a).lines[0].ip, closeOf(t, a).lines[0].credits], [null, null]);
});

test("205: a Milestone Point is only on a present line, an off-screen tier only on an absent one, whatever was sent", () => {
  const t = Engine.newTable("x");
  const a = crew(t, 4, "2026-10-01", ["Wren"], 3);
  assert.ok(Engine.writeCloseOut(t, a, { lines: [away("Dez", "competent", 400), { ...away("Rook", null), milestone: true }, here("Wren", 5, { tier: "expert" })] }).ok);
  const l = closeOf(t, a).lines;
  eq(l.map(x => [x.name, x.present, x.milestone, x.tier]), [["Dez", false, false, "competent"], ["Rook", false, false, null], ["Wren", true, true, null]]);
  assert.ok(Engine.writeCloseOut(t, a, { lines: [{ ...here("Wren", 5), milestone: false }] }).ok);
  assert.equal(closeOf(t, a).lines[0].milestone, false, "the GM can leave the point off");
});

test("205: awardTotals sums across logs by folded name, first spelling, in the order first written", () => {
  const t = Engine.newTable("x");
  eq(Engine.awardTotals(t), []);
  const a = crew(t, 4, "2026-10-01", ["Wren"], 3), b = crew(t, 5, "2026-10-08", ["Wren"], 3);
  crew(t, 6, "2026-10-15", ["Wren"]);
  Engine.writeCloseOut(t, a, { lines: [here("Wren", 15, { credits: 100 }), here("Rook", 15)] });
  Engine.writeCloseOut(t, b, { lines: [here("wren", 20, { credits: 50 }), away(" ROOK", "novice", 80), here("Dez", null, { milestone: false })] });
  t.sessions.find(s => s.id === a).close.at = "2026-10-01T20:00:00.000Z";
  t.sessions.find(s => s.id === b).close.at = "2026-10-08T20:00:00.000Z";
  eq(Engine.awardTotals(t), [
    { name: "Wren", ip: 35, milestones: 2, credits: 150, sessions: 2 },
    { name: "Rook", ip: 15, milestones: 1, credits: 80, sessions: 1 },
    { name: "Dez", ip: 0, milestones: 0, credits: 0, sessions: 1 },
  ]);
});

test("206: a thread settled with closed: this closes in this session, not the newest", () => {
  const t = Engine.newTable("x");
  const mine = Engine.addSession(t, { number: 4, date: "2026-10-01" }).id;
  const newest = Engine.addSession(t, { number: 6, date: "2026-10-15" }).id;
  const h = Engine.addThread(t, { title: "T" }).id;
  assert.ok(Engine.editThread(t, h, { status: "resolved", closed: mine }).ok);
  assert.equal(thrOf(t, h).closed, mine);
  assert.notEqual(thrOf(t, h).closed, newest);
});

test("206: the draft's arc reminder goes by the session's number, not how many sessions there are", () => {
  const t = Engine.newTable("x");
  const five = Engine.addSession(t, { number: 5, date: "2026-10-01" }).id;
  eq(Engine.closeOutDraft(t, five).arc, { minor: true, major: false }, "a table's only session, numbered 5");
  const u = Engine.newTable("y");
  for (let n = 1; n <= 4; n++) Engine.addSession(u, { number: n * 3, date: "2026-10-0" + n });
  const ten = Engine.addSession(u, { number: 10, date: "2026-10-09" }).id;
  eq(Engine.closeOutDraft(u, ten).arc, { minor: false, major: true });
  const none = Engine.addSession(u, { number: null, date: "2026-10-09" });
  eq(Engine.closeOutDraft(u, none.id).arc, { minor: false, major: false });
});
