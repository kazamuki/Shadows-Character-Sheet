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
  assert.equal(ch.meta.schemaVersion, "0.17");
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
// all; Supernatural only those carrying 043's Universal tag.
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
  assert.equal(old.meta.schemaVersion, "0.17");
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
  assert.equal(old.meta.schemaVersion, "0.17");
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
// modifier, a spell's overflow degrees, a tier's TH and time per Discipline
// (Decision 136), an integrity die or a TN per
// difficulty, an armor slot's name, and a specialization's powers (shared.js
// draws any array of plain objects on a power as a table, columns from keys).
const MAPS = [/\.byPowerLevel$/, /^statRules\.(modifiers|raiseCost)$/, /^spells\[\]\.overflow$/, /^enchantmentTimeTable\[\]\.(th|minTime)$/,
  /^armorRules\.integrityLossByDifficulty$/, /^skillCheckRules\.difficulties$/, /^armorRules\.slotNames$/,
  /\.(starterPower|additionalPowers\[\])$/, /\.(starterPower|additionalPowers\[\])\.\*\[\]$/,
  /\.sp(\.\*)?$/, // W32: keyed by the text an amount sits beside, read by spAmounts
  /^appCopy\.statusLabel$/]; // keyed by an archetype's `status`, read by statusLabel()
// Display and maintainer text by name. A key named like this has to hold text,
// so a number can't hide behind a *Note name.
const TEXT_KEY = /(Text|Note|Notes|Source)$|^(description|example|lore|meaning)$/;
// Merged content no screen shows yet. AQ4 answered each one: S6 shows them,
// except `growth`, which stays hidden until the Majors are written. An entry
// leaves this list the day code reads it; the test says when.
const NOT_YET_SHOWN = {
  growth: "hidden until the archetype Majors are written (AQ4 5, F32)",
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
  assert.equal(old.meta.schemaVersion, "0.17");
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
  assert.equal(bare.meta.schemaVersion, "0.17");
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
    assert.equal(c.meta.schemaVersion, "0.17");
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
  assert.equal(old.meta.schemaVersion, "0.17");
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
  assert.equal(m.meta.schemaVersion, "0.17");
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

test("Resilient Spirit (Waning Moon) lets Natural Armor answer magical damage while it's on", () => {
  const ch = subject();
  ch.identity.archetype = "werewolf";
  ch.archetypeChoices.specialization = ["trueborn"];
  ch.progression.milestones.major.push({ id: "shake-it-off" });
  const hit = natural => Engine.resolveHit(ch, { damage: 8, damageType: "spirit", natural });
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
  assert.equal(m.meta.schemaVersion, "0.17");
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
  assert.equal(m.meta.schemaVersion, "0.17");
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
  assert.equal(m.meta.schemaVersion, "0.17");
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
  same([m.identity.tagless, m.meta.schemaVersion], [false, "0.17"]);
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

test("a flagged tag reads as something a player can use, not a note to us (F28–F31)", () => {
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
  assert.equal(a.meta.schemaVersion, "0.17");
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
    same(ids(b), a.coreMechanic.panels.map(p => p.id), `${a.id}'s panels moved`);
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

test("addPower costs IP in play, Admin's is free, and the spend is a journal entry one undo takes back with it", () => {
  const ch = writtenIn();
  ch.progression.ip.earned = 20;
  const refusedHere = input => { const n = JSON.stringify(ch); const r = Engine.addPower(ch, input); assert.equal(JSON.stringify(ch), n, `refused but wrote: ${r.why}`); return r; };
  assert.match(refusedHere({ name: "Fade" }).why || "", /costs IP/, "a power was added in play with no cost (Decision 154)");
  assert.equal(refusedHere({ name: "Fade", cost: "0" }).ok, false, "a power was added in play for 0 IP");
  const free = Engine.addPower(ch, { name: " Fade ", uses: "SFR", effect: "Unseen for a round." }, { free: true });
  assert.ok(free.ok && /^pw-/.test(free.id), JSON.stringify(free));
  same([ch.powers[0].name, ch.powers[0].custom, ch.progression.ip.log.length], ["Fade", true, 0], "a free power touched IP");

  const before = JSON.parse(JSON.stringify(ch));
  const bought = Engine.addPower(ch, { name: "Thorn hedge", cost: "15", note: "after the raid" });
  assert.ok(bought.ok);
  Engine.recordAction(ch, "power", "Power: Thorn hedge", before);
  const spend = ch.progression.ip.log[0];
  same([spend.kind, spend.amount, spend.targetType, spend.targetId, spend.name], ["spend", 15, "power", bought.id, "Thorn hedge"]);
  same([Engine.ipState(ch).available, Engine.versionCheck(ch).filter(x => /power/.test(x))], [5, []]);
  assert.ok(Engine.undoLastAction(ch).ok);
  same([ch.powers.length, ch.progression.ip.log.length, Engine.ipState(ch).available], [1, 0, 20], "one undo took back both");

  const refused = input => { const n = JSON.stringify(ch); const r = Engine.addPower(ch, input); assert.equal(JSON.stringify(ch), n, `refused but wrote: ${r.why}`); return r.ok; };
  assert.equal(refused({ name: "Too dear", cost: 21 }), false, "short of IP");
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

test("versionCheck matches a power's spend to its row, and says when the power is gone", () => {
  const ch = writtenIn();
  ch.progression.ip.earned = 30;
  const r = Engine.addPower(ch, { name: "Thorn hedge", cost: 10 });
  same(Engine.versionCheck(ch).filter(x => /power/i.test(x)), []);
  assert.ok(Engine.removePower(ch, r.id).ok);
  assert.equal(Engine.removePower(ch, r.id).ok, false);
  const issues = Engine.versionCheck(ch).filter(x => /power/i.test(x));
  assert.equal(issues.length, 1);
  assert.match(issues[0], /Thorn hedge/);
  assert.equal(Engine.ipState(ch).available, 20, "IP spent on a removed power stays spent");
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
  assert.equal(m.meta.schemaVersion, "0.17");
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

test("newTable stamps kind, a TBL- id, the name, schema 0.4, no notes, cast or interactions", () => {
  const t = Engine.newTable("Tuesday");
  assert.equal(t.meta.kind, "shadows-table");
  assert.ok(Engine.isTableId(t.meta.id), t.meta.id);
  assert.equal(t.meta.name, "Tuesday");
  assert.equal(t.meta.tableSchemaVersion, "0.4");
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

test("a newer table schema stamp is kept and reported; an older or unreadable one reads 0.4", () => {
  const n = Engine.migrateTable({ meta: { tableSchemaVersion: "0.5" } });
  assert.equal(n.meta.tableSchemaVersion, "0.5");
  assert.equal(Engine.tableCheck(n).length, 1);
  assert.equal(Engine.migrateTable(n).meta.tableSchemaVersion, "0.5");
  for (const v of ["0.4", "0.2", "0.1", "0.0", "junk", undefined]) {
    const m = Engine.migrateTable({ meta: { tableSchemaVersion: v } });
    assert.equal(m.meta.tableSchemaVersion, "0.4", String(v));
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
  assert.equal(m.meta.tableSchemaVersion, "0.4");
  eq(m.cast, []); eq(m.interactions, []);
  assert.equal(JSON.stringify(m.notes), JSON.stringify(old.notes));
  assert.equal(Engine.tableCheck(m).length, 0);
});

test("a newer table keeps its stamp and its cast, coerced, and tableCheck reports it", () => {
  const m = Engine.migrateTable({ meta: { tableSchemaVersion: "0.5" }, cast: [{ name: 5, tier: "2" }] });
  assert.equal(m.meta.tableSchemaVersion, "0.5");
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
const KINDS = ["shared", "learned", "helped", "wronged", "killed", "owes", "owed"];

test("a 0.2 table migrates to 0.3 with no interactions and no affiliations, and the rest is byte-identical", () => {
  const old = Engine.newTable("Two");
  Engine.addCastMember(old, { name: "Dez" }); Engine.addCastMember(old, { name: "Ivo" });
  Engine.addTableNote(old, { title: "A", text: "one" });
  delete old.interactions; old.meta.tableSchemaVersion = "0.2";
  for (const n of old.cast) delete n.affiliations;
  const m = Engine.migrateTable(old);
  assert.equal(m.meta.tableSchemaVersion, "0.4");
  eq(m.interactions, []);
  for (const n of m.cast) eq(n.affiliations, []);
  const strip = t => { const c = plain(t); delete c.interactions; delete c.meta.tableSchemaVersion; for (const n of c.cast) { delete n.affiliations; delete n.from; } return JSON.stringify(c); };
  assert.equal(strip(m), strip(old));
  assert.equal(Engine.tableCheck(m).length, 0);
});

test("a 0.4 table keeps its stamp and its interactions, and tableCheck says so", () => {
  const m = Engine.migrateTable({ meta: { tableSchemaVersion: "0.5" }, interactions: [{ kind: "shared", text: "x" }] });
  assert.equal(m.meta.tableSchemaVersion, "0.5");
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
  assert.equal(m.meta.tableSchemaVersion, "0.4");
  for (const n of m.cast) assert.equal(n.from, null);
  const strip = t => { const c = plain(t); delete c.meta.tableSchemaVersion; for (const n of c.cast) delete n.from; return JSON.stringify(c); };
  assert.equal(strip(m), strip(old));
  const ok = { kind: "entry", pack: PACK_ID, id: "gull", name: "Gull" };
  const j = Engine.migrateTable({ meta: { tableSchemaVersion: "0.4" }, cast: [
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
