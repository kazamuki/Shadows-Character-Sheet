/**
 * CRB conformance — the rulebook's own worked examples, run as tests.
 *
 * Source: `0300_Core_Mechanics.md`, CRB v4 (WIP), read 2026-09-02.
 *
 * Every assertion here pins a number the Core Rulebook states outright, and
 * quotes the line it comes from. This is the third mechanism from the debt
 * ledger: a rules change the app misses fails the build instead of surviving
 * to the table, and a data field nobody reads gets caught the moment someone
 * claims it is authoritative.
 *
 * Rules NOT pinned here are pinned nowhere — if you implement a CRB rule, add
 * its worked example. If the CRB and this file disagree, the CRB wins and this
 * file is the bug report.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadEngine } from "./harness.mjs";
import { ROOT } from "../tools/build.mjs";

// The CRB mirror is a private submodule (Decision 167). Missing, it fails
// loudly with the fix, rather than skipping the CRB's own examples.
function crb(name) {
  const p = join(ROOT, "private/crb", name);
  assert.ok(existsSync(p), `private/crb/${name} is missing: run \`git submodule update --init private\` (needs read access to kazamuki/Shadows-Private)`);
  return readFileSync(p, "utf8");
}

const { Engine, D } = loadEngine();

/** A character with nothing but a power level — enough to compute from. */
function subject({ bod = 5 } = {}) {
  const ch = Engine.newCharacter();
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.stats.BOD.base = bod;
  return ch;
}

// ── Hit Points & Health Levels ────────────────────────────────────────

test('CRB: "For every point of BOD you have, you gain 1 HL"', () => {
  for (const bod of [1, 2, 3, 4, 7, 9, 10]) {
    assert.equal(Engine.health(subject({ bod })).levels, bod, `BOD ${bod}`);
  }
});

test('CRB: "a BOD of 4 ... 4 HL at 5 HP each, effectively granting you 20 HP"', () => {
  const h = Engine.health(subject({ bod: 4 }));
  assert.deepEqual({ levels: h.levels, hpPer: h.hpPer, total: h.total },
                   { levels: 4, hpPer: 5, total: 20 });
});

test('CRB: "the BOD stat is limited to ten, you can only have 10 HL"', () => {
  for (const bod of [10, 11, 15, 40]) {
    assert.equal(Engine.health(subject({ bod })).levels, 10, `BOD ${bod} must cap at 10 HL`);
  }
  assert.equal(D.statRules.max, 10);
});

test('CRB: "a Werewolf who had 11 BOD ... 10 HL with a base HP of 6 ... 60 HP total"', () => {
  const h = Engine.health(subject({ bod: 11 }));
  assert.deepEqual({ levels: h.levels, hpPer: h.hpPer, total: h.total },
                   { levels: 10, hpPer: 6, total: 60 });
});

test('CRB: "for each BOD after 10 the base HP of each Health level goes up by 1"', () => {
  // The rule is stated as a rate, so pin the rate, not just the one example.
  for (const bod of [11, 12, 13, 14, 15]) {
    const h = Engine.health(subject({ bod }));
    assert.equal(h.hpPer, 5 + (bod - 10), `BOD ${bod} base HP`);
    assert.equal(h.total, 10 * (5 + (bod - 10)), `BOD ${bod} total`);
  }
});

test("1 HL per BOD is an invariant, not a tunable (B3)", () => {
  // levelsPerBOD sat in the data for four schema versions looking like a knob
  // the engine honoured. It never was one, and the CRB states the 1:1 rate as
  // a law. If it comes back, it needs a rule to go with it.
  assert.equal(D.resources.healthLevels.levelsPerBOD, undefined,
    "levelsPerBOD is back in the data — either honour it in health() or drop it");
});

// ── Pain Levels ───────────────────────────────────────────────────────

test('CRB: Pain Levels trigger at 0-1 / 2+ / 5+ / 8+ Health Levels lost', () => {
  // Spread first: loadEngine runs the data in a VM, so its arrays carry another
  // realm's Array.prototype and deepStrictEqual rejects them on identity alone.
  assert.deepEqual([...D.resources.healthLevels.painLevels.map(p => p.hlLostThreshold)], [0, 2, 5, 8]);

  // 10 BOD => 10 HL x 5 HP = 50 HP, so each HL is exactly 5 damage.
  const ch = subject({ bod: 10 });
  const at = dmg => { ch.trackers.damage = dmg; return Engine.painState(ch); };
  assert.equal(at(0).level,  0);
  assert.equal(at(5).level,  0, "1 HL lost is still Pain Level 0");
  assert.equal(at(10).level, 1, "2 HL lost reaches Pain Level 1");
  assert.equal(at(20).level, 1, "4 HL lost is still Pain Level 1");
  assert.equal(at(25).level, 2, "5 HL lost reaches Pain Level 2");
  assert.equal(at(40).level, 3, "8 HL lost reaches Pain Level 3");
});

test('CRB worked example: "taken 6 damage ... lost 1 HL but suffer no penalties"', () => {
  const ch = subject({ bod: 10 });
  ch.trackers.damage = 6;
  const p = Engine.painState(ch);
  assert.equal(p.hlLost, 1);
  assert.equal(p.level, 0);
  assert.equal(p.skillPenalty, 0);
});

test('Pain Sensitive (W92, Decision 213): one Pain Level higher once you are hurt, capped at 3, nothing at Pain Level 0', () => {
  const ch = subject({ bod: 10 });
  ch.disadvantages = [{ id: "pain-sensitive", rank: 1 }];
  const at = dmg => { ch.trackers.damage = dmg; return Engine.painState(ch); };
  assert.deepEqual([0, 5, 10, 25, 40].map(d => at(d).level), [0, 0, 2, 3, 3]);
  assert.deepEqual([0, 5, 10, 25, 40].map(d => at(d).fromTraits), [0, 0, 1, 1, 0], "what it actually added");
  assert.deepEqual([...at(10).painSources], ["Pain Sensitive"]);
  assert.deepEqual([...at(40).painSources], [], "the cap left no room, so it is not named");
  assert.deepEqual([...at(0).painSources], []);
  assert.equal(at(10).skillPenalty, -2, "the shifted level carries its full penalty");
});

test("Pain Sensitive stacks on a Condition's Pain, and both are named", () => {
  const ch = subject({ bod: 10 });
  ch.disadvantages = [{ id: "pain-sensitive", rank: 1 }];
  assert.equal(Engine.addCondition(ch, { id: "agonized" }).ok, true);
  ch.trackers.damage = 0;
  const p = Engine.painState(ch);
  assert.equal(p.level, 2);
  assert.deepEqual([...p.painSources], ["Agonized", "Pain Sensitive"]);
});

test('CRB: penalties stack per Pain Level — -1 Skill, -1 Essence die, -5% Breaker', () => {
  const ch = subject({ bod: 10 });
  for (const [dmg, lvl] of [[0, 0], [10, 1], [25, 2], [40, 3]]) {
    ch.trackers.damage = dmg;
    const p = Engine.painState(ch);
    assert.equal(p.level, lvl);
    // `|| 0` on both sides: 0 * -1 is -0, which strict equality distinguishes.
    assert.equal(p.skillPenalty,   lvl * -1 || 0, `Pain ${lvl} skill`);
    assert.equal(p.essencePenalty, lvl * -1 || 0, `Pain ${lvl} essence dice`);
    assert.equal(p.breakerPenalty, lvl * -5 || 0, `Pain ${lvl} breaker %`);
  }
});

test('CRB: "Essence Checks can never drop below 1 dice" · "cannot be reduced below 10%" (B8)', () => {
  // The engine cannot APPLY these — it never sees the dice pool or the target
  // number — but it must carry them so the sheet can state them. They lived in
  // the data as an unread prose note while the sheet showed bare penalties.
  const ch = subject({ bod: 10 });
  ch.trackers.damage = 40;                       // Pain Level 3, the worst case
  const p = Engine.painState(ch);
  assert.equal(p.essenceFloor, 1);
  assert.equal(p.breakerFloor, 10);
});

// ── Luck ──────────────────────────────────────────────────────────────

test('CRB: "Boosting a roll costs 2 Luck. Exploding a roll costs 3 Luck."', () => {
  const by = a => D.resources.luck.spend.find(s => new RegExp(a, "i").test(s.action));
  assert.equal(by("boost").cost, 2);
  assert.equal(by("explode").cost, 3);
});

test("Design ruling: everyone starts with 4 LUCK, and LUCK bought with CP sits on top (Decision 157)", () => {
  const ch = subject();
  assert.equal(Engine.luckState(ch).max, 4);
  ch.trackers.luck.bonus = 3;                    // bought up to 5 under the old base of 2
  assert.equal(Engine.luckState(ch).max, 7, "a character keeps the points it paid for, on the new base");
});

test("Design ruling: a power rank costs 5 CP at creation, a Discipline's included (Decision 157)", () => {
  assert.equal(Engine.powerRankCost(), 5);
});

// ── Stat modifiers ────────────────────────────────────────────────────

test('CRB: "-1 per point below 4" and "+1 per point above 6"', () => {
  for (const v of [1, 2, 3]) assert.equal(Engine.statMod(v), v - 4, `stat ${v}`);
  for (const v of [4, 5, 6]) assert.equal(Engine.statMod(v), 0, `stat ${v}`);
  for (const v of [7, 8, 9, 10]) assert.equal(Engine.statMod(v), v - 6, `stat ${v}`);
});

// ── Milestone cadence ─────────────────────────────────────────────────

test("Milestone cadence: Minor at 5, 15, 25… · Major at 10, 20, 30… (B9)", () => {
  // Stated as prose in the data and as arithmetic in the engine, with nothing
  // connecting them until B9. Both now read the same numbers.
  const ch = subject();
  const at = mp => { ch.progression.milestonePoints = mp; return Engine.milestoneState(ch); };
  for (const [mp, minor, major] of [
    [0, 0, 0], [4, 0, 0], [5, 1, 0], [9, 1, 0], [10, 1, 1],
    [14, 1, 1], [15, 2, 1], [20, 2, 2], [25, 3, 2], [30, 3, 3],
  ]) {
    const m = at(mp);
    assert.equal(m.minorAvail, minor, `${mp} MP → minor`);
    assert.equal(m.majorAvail, major, `${mp} MP → major`);
  }
});

test("Milestone Points per session come from the data, not a hardcode (B9)", () => {
  assert.equal(D.milestones.rules.milestonePointsPerSession, 1);
  const ch = subject();
  ch.sessions = [{ id: 1 }, { id: 2 }, { id: 3 }];
  assert.equal(Engine.milestoneState(ch).sessionMP, 3);
  ch.sessions[1].milestonePoint = false;          // per-session opt-out, Decision 23
  assert.equal(Engine.milestoneState(ch).sessionMP, 2);
});

// ── Selection & constraint system (Decision 58's corpus) ──────────────
// Source: `0430_Advantages.md` / `0440_Disadvantages.md`, CRB v4 (WIP).
// Decision 58 named these ~15 entries as the test corpus for the machinery.
// Each assertion below pins a sentence the CRB states outright.

test('CRB: Common Sense — "Choose one of the following skills: Investigation, Awareness, Basic Tech, Intuition"', () => {
  const [pick] = Engine.advById("common-sense").picks;
  const ch = subject();
  ch.advantages = [{ id: "common-sense", rank: 1, notes: "" }];
  const [st] = Engine.picksFor(ch, "advantage", "common-sense");
  assert.deepEqual([...st.options.map(o => o.id)].sort(),
    ["awareness", "basic-tech", "intuition", "investigation"],
    "the four named skills are not the offered list");
  assert.equal(st.options.every(o => !o.missing), true, "a named skill is not in the catalog");
  assert.equal(pick.perRank, true);
});

test('CRB: "Choose a different Skill for each rank" — four entries say it, all four enforce it', () => {
  // Common Sense, Favored Skill, Refined Skill and Defect/Flaw each state some
  // version of this. A rank-2 entry must offer two slots and refuse a repeat.
  for (const [kind, id] of [["advantage", "common-sense"], ["advantage", "favored-skill"],
                            ["advantage", "refined-skill"], ["disadvantage", "defect-flaw"]]) {
    const ch = subject();
    const entry = { id, rank: 2, notes: "" };
    if (kind === "advantage") ch.advantages = [entry]; else ch.disadvantages = [entry];
    const st = Engine.picksFor(ch, kind, id).find(x => x.pick.type === "skill");
    assert.ok(st, `${id} has no skill pick`);
    assert.equal(st.need, 2, `${id} did not offer one slot per rank`);
    const first = st.options[0].id, second = st.options[1].id;
    assert.equal(Engine.setSelection(ch, kind, id, st.pick.id, 0, first).ok, true, id);
    assert.equal(Engine.setSelection(ch, kind, id, st.pick.id, 1, first).ok, false,
      `${id} allowed the same Skill twice`);
    assert.equal(Engine.setSelection(ch, kind, id, st.pick.id, 1, second).ok, true, id);
  }
});

test('CRB: Martial Arts — "Choose UP TO two Martial Arts styles at creation"', () => {
  // "Up to" is the whole ruling (Decision 56): two is a cap, not a demand, so a
  // trained Martial Artist with no style declared is still a legal character.
  const ch = subject();
  ch.creation.rolls.skillPoints = 30;
  ch.skills["martial-arts"] = { rank: 2, ipe: 0 };
  const [st] = Engine.picksFor(ch, "skill", "martial-arts");
  assert.equal(st.need, 2, "the style cap is not two");
  assert.equal(st.pick.perRank, undefined, "styles must not scale with skill rank");
  assert.equal(st.complete, true, "an undeclared style is blocking the character");
  assert.equal(Engine.validate("skills", ch).some(i => /Martial Arts/.test(i.msg)), false);

  // The offered styles ARE the entry's own `styles` array — one list, not two.
  const styles = Engine.skillById("martial-arts").styles;
  assert.deepEqual([...st.options.map(o => o.id)], [...styles.map(s => s.id)]);
  assert.deepEqual([...st.options.map(o => o.description)], [...styles.map(s => s.bonus)]);

  // Distinct still holds: you cannot spend both slots on Karate.
  assert.equal(Engine.setSelection(ch, "skill", "martial-arts", "style", 0, "karate").ok, true);
  assert.equal(Engine.setSelection(ch, "skill", "martial-arts", "style", 1, "karate").ok, false);
});

test('CRB: Long-Lived — "You may only purchase this Advantage during character creation"', () => {
  assert.equal(Engine.advById("long-lived").creationOnly, true,
    "the creation-only restriction is not in the data");
  // Nothing else in the catalog claims it, so a stray true is a typo, not a rule.
  const claimed = [...D.advantages.filter(a => a.creationOnly).map(a => a.id)];
  assert.deepEqual(claimed, ["long-lived"]);
});

test('CRB: the entries that say "with your GM" ask for text and never block the lock', () => {
  // Immunity, Followers/Minion, Cursed, Fanatic, Pact, Minor Insanity,
  // Addiction, Enemies, Notorious and Defect/Flaw all defer to the table.
  const expected = ["immunity", "followers-minion", "cursed", "fanatic", "pact",
                    "minor-insanity", "addiction", "enemies", "notorious", "defect-flaw"];
  for (const id of expected) {
    const def = Engine.advById(id) || Engine.disById(id);
    const kind = Engine.advById(id) ? "advantage" : "disadvantage";
    const text = (def.picks || []).find(p => p.type === "text");
    assert.ok(text, `${id} has no freeform pick`);
    assert.equal(text.gmApproval, true, `${id} does not defer to the GM`);

    const ch = subject();
    const entry = { id, rank: 1, notes: "" };
    if (kind === "advantage") ch.advantages = [entry]; else ch.disadvantages = [entry];
    const about = Engine.validate("character-points", ch).filter(i => i.msg.startsWith(def.name));
    assert.equal(about.length, 1, `${id}: ${about.map(i => i.msg).join(" | ")}`);
    assert.equal(about[0].level, "warn", `${id} blocks the lock on an unwritten detail`);
  }
});

// ── Conditions and Pain (0540_Conditions_and_Recovery.md) ──

test('CRB 0540: "A high BOD character on Pain Level 3 will experience -3 ... -3 die ... -15%"', () => {
  const ch = subject({ bod: 10 });
  ch.trackers.damage = 40;                       // 8 of 10 HL lost
  const p = Engine.painState(ch);
  assert.equal(p.level, 3);
  assert.equal(p.skillPenalty, -3);
  assert.equal(p.essencePenalty, -3);
  assert.equal(p.breakerPenalty, -15);
});

test('CRB 0540: Agonized — "Operate at 1 Pain Level higher, to a max PL 3"', () => {
  const ch = subject({ bod: 10 });
  assert.equal(Engine.addCondition(ch, { id: "agonized" }).ok, true);
  const at = dmg => { ch.trackers.damage = dmg; return Engine.painState(ch); };
  assert.equal(at(0).level, 1, "Agonized at Pain Level 0 gives 1");
  assert.equal(at(0).skillPenalty, -1, "condition Pain carries the full per-level penalty");
  assert.equal(at(10).level, 2, "Agonized at Pain Level 1 gives 2");
  assert.equal(at(40).level, 3, "Agonized at Pain Level 3 stays 3");
  assert.equal(at(40).fromHealth, 3);
  assert.equal(at(40).fromConditions, 1);
});

test('CRB 0540: Pain "never falls below 0 or climbs above 3"', () => {
  // Drive condition Pain past the clamp with synthetic entries, rather than
  // inventing a second Pain-raising Condition in the real data.
  D.conditions.push({ id: "__fixture-pain", name: "Fixture", painLevels: 5 },
                    { id: "__fixture-relief", name: "Relief", painLevels: -9 });
  try {
    const ch = subject({ bod: 10 });
    ch.trackers.conditions.push({ id: "__fixture-pain" });
    assert.equal(Engine.painState(ch).level, 3);
    ch.trackers.conditions = [{ id: "__fixture-relief" }];
    ch.trackers.damage = 40;
    assert.equal(Engine.painState(ch).level, 0);
  } finally { D.conditions.splice(-2, 2); }
});

test("CRB 0540: a Condition doesn't stack with itself — but Blinded, Disoriented and Burning together", () => {
  const ch = subject();
  assert.equal(Engine.addCondition(ch, { id: "burning" }).ok, true);
  const again = Engine.addCondition(ch, { id: "burning" });
  assert.equal(again.ok, false, "a second Burning was accepted");
  assert.match(again.why, /doesn't stack/);
  assert.equal(Engine.addCondition(ch, { id: "blinded" }).ok, true);
  assert.equal(Engine.addCondition(ch, { id: "disoriented" }).ok, true);
  assert.equal(ch.trackers.conditions.length, 3);
});

test('CRB 0540: Helpless — "Any attack roll of 2 or better is a guaranteed hit"', () => {
  for (const id of ["paralyzed", "stunned", "unconscious", "dying"]) {
    const ch = subject();
    Engine.addCondition(ch, { id });
    assert.equal(Engine.conditionState(ch).isHelpless, true, `${id} is not Helpless`);
  }
  const ch = subject();
  Engine.addCondition(ch, { id: "prone" });
  assert.equal(Engine.conditionState(ch).isHelpless, false, "Prone is not Helpless");
  assert.match(D.conditionRules.helpless, /2 or better/);
});

test('CRB 0540: "After three Death Marks against you, you die"', () => {
  const ch = subject();
  Engine.addCondition(ch, { id: "dying" });
  const i = ch.trackers.conditions.findIndex(e => e.id === "dying");
  assert.equal(ch.trackers.conditions[i].marks, 0);
  Engine.setConditionMarks(ch, i, 2);
  assert.equal(Engine.conditionState(ch).counters[0].full, false);
  Engine.setConditionMarks(ch, i, 3);
  assert.equal(Engine.conditionState(ch).counters[0].full, true);
  Engine.setConditionMarks(ch, i, 7);
  assert.equal(ch.trackers.conditions[i].marks, 3, "Death Marks ran past three");
  // "Accumulated Death Marks reset when you are no longer Dying" — the marks
  // live on the Condition, so clearing it clears them.
  Engine.removeCondition(ch, i);
  Engine.addCondition(ch, { id: "dying" });
  assert.equal(ch.trackers.conditions[0].marks, 0);
});

// ── Design-team rulings, 2026-09-22 (Decision 98) ─────────────────────
// Not CRB text yet — the designers' own table, pinned the same way.

test('Design ruling: stats past 10 — "11-15 = +5, 16-20 = +6, 21-25 = +7, etc every 5"', () => {
  const table = { 1: -3, 2: -2, 3: -1, 4: 0, 6: 0, 7: 1, 10: 4,
                  11: 5, 15: 5, 16: 6, 20: 6, 21: 7, 25: 7, 26: 8 };
  for (const [v, mod] of Object.entries(table)) assert.equal(Engine.statMod(Number(v)), mod, `stat ${v}`);
});

test('Design ruling: "For BOD above 10, you gain 1 HP per HL (max is 10 HLs)"', () => {
  const h = Engine.health(subject({ bod: 16 }));
  assert.equal(h.levels, 10);
  assert.equal(h.hpPer, 11);
});

// ── Taking a hit (0530 Damage and Armor, 0540 Going Down — Decision 99) ──

/** Wear one catalog piece. Kevlar Vest: PROT 1d6, RES +2, INT 20, torso. */
function wearing(ch, id = "kevlar-vest", extra = {}) {
  ch.armor.push(Object.assign({ id, integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: [] }, extra));
  return ch;
}

test('CRB 0530: Massive "strips Integrity equal to the weapon\'s damage and takes 1 Health Level per 10 points"', () => {
  // With a Kevlar Vest (INT 20): the +1 only lands when the vest is driven to 0.
  for (const [dmg, levels, intLeft] of [[9, 0, 11], [10, 1, 10], [25, 3, 0]]) {
    const r = Engine.resolveHit(wearing(subject({ bod: 10 })), { damage: dmg, damageType: "ballistic", category: "massive" });
    assert.equal(r.levelsLost, levels, `${dmg} Massive into a vest`);
    assert.equal(r.armor.integrityAfter, intLeft, `${dmg} Massive strips ${dmg} INT`);
    assert.equal(r.through, 0, "Massive never goes onto the damage total");
    assert.equal(r.scrap, intLeft === 0, "driven to 0 by Massive is scrap");
  }
  // "— or there was nothing there to begin with — take an additional Health Level."
  for (const [dmg, levels] of [[9, 1], [10, 2], [25, 3]]) {
    const r = Engine.resolveHit(subject({ bod: 10 }), { damage: dmg, damageType: "ballistic", category: "massive" });
    assert.equal(r.levelsLost, levels, `${dmg} Massive, no armor`);
  }
});

test('CRB 0530: Massive Health Levels "are gone rather than emptied", and count toward Pain (CQ6)', () => {
  const ch = subject({ bod: 5 });
  Engine.applyHit(ch, { damage: 10, damageType: "ballistic", category: "massive" });
  assert.equal(ch.trackers.massiveLevels, 2);
  assert.equal(ch.trackers.damage, 0, "no HP damage: the levels are removed");
  const p = Engine.painState(ch);
  assert.equal(p.hlLost, 2);
  assert.equal(p.level, 1, "2 HL lost is Pain Level 1");
  assert.equal(p.hpLeft, 15, "three levels of 5 HP left");
});

test('CRB 0530: "Armor-piercing skips RES entirely, though PROT still rolls"', () => {
  const hit = { damage: 10, damageType: "ballistic", protRoll: 3 };
  const plain = Engine.resolveHit(wearing(subject()), hit);
  assert.deepEqual([plain.prot, plain.res, plain.through], [3, 2, 5]);
  const ap = Engine.resolveHit(wearing(subject()), { ...hit, ap: true });
  assert.deepEqual([ap.prot, ap.res, ap.through, ap.resSkipped], [3, 0, 7, "ap"]);
});

test('CRB 0530: "At Integrity 0 ... RES is gone until somebody repairs it, and PROT remains"', () => {
  const ch = wearing(subject(), "kevlar-vest", { integrityLoss: 20 });
  assert.equal(Engine.armorState(ch).worn.compromised, true);
  const r = Engine.resolveHit(ch, { damage: 10, damageType: "ballistic", protRoll: 4 });
  assert.deepEqual([r.prot, r.res, r.through, r.resSkipped], [4, 0, 6, "compromised"]);
});

test('CRB 0530: "A hit that armor soaks entirely still costs the armor 1 integrity"', () => {
  const ch = wearing(subject());
  const soaked = Engine.resolveHit(ch, { damage: 5, damageType: "ballistic", protRoll: 3 });
  assert.equal(soaked.soaked, true);
  assert.equal(soaked.integrityLost, 1);
  Engine.applyHit(ch, { damage: 5, damageType: "ballistic", protRoll: 3 });
  assert.equal(ch.armor[0].integrityLoss, 1);
  assert.equal(ch.trackers.damage, 0);
  // A hit that gets through costs nothing in the moment; that's the after-fight wear roll.
  const through = Engine.resolveHit(wearing(subject()), { damage: 9, damageType: "ballistic", protRoll: 3 });
  assert.equal(through.integrityLost, 0);
});

test("Gear: RES answers only the damage it matches. Kinetic by default, Energy with Ablative Plating, each kind of magic with its Warding", () => {
  const hit = { damage: 10, damageType: "energy", protRoll: 2 };
  const bare = Engine.resolveHit(wearing(subject()), hit);
  assert.deepEqual([bare.res, bare.through, bare.resSkipped], [0, 8, "type"]);
  const ablative = Engine.resolveHit(wearing(subject(), "kevlar-vest", { upgrades: ["Ablative Plating"] }), hit);
  assert.deepEqual([ablative.res, ablative.through], [2, 6]);
  // Magic: "Armor RES applies to Spirit damage" (Warding — Spirit), and to
  // nothing else. The retired all-kinds Warding still answers all three.
  const res = (upgrades, damageType) => Engine.resolveHit(wearing(subject(), "kevlar-vest", { upgrades }), { ...hit, damageType }).res;
  assert.deepEqual(["elemental", "spirit", "aether"].map(t => res([], t)), [0, 0, 0], "bare armor answered magic");
  assert.deepEqual(["elemental", "spirit", "aether"].map(t => res(["Warding — Spirit"], t)), [0, 2, 0]);
  assert.deepEqual(["elemental", "spirit", "aether"].map(t => res(["Warding"], t)), [2, 2, 2], "an installed old Warding lost cover");
  // Tri-Weave: "+10 INT to the armor's integrity pool", per install.
  const tw = Engine.armorState(wearing(subject(), "kevlar-vest", { upgrades: ["Tri-Weave", "Tri-Weave"] }));
  assert.equal(tw.worn.integrityMax, 40);
});

test('CRB 0530 Playing it Out: "PROT: 2, plus RES 3. That\'s 5 defended of 15 ... 10 gets through. That\'s two Health Levels ... Pain Level 1"', () => {
  // His vest isn't in the catalog, so it goes on the sheet as a custom piece.
  const ch = wearing(subject({ bod: 5 }), undefined, { id: undefined, custom: true, name: "Vest", prot: "1d6", res: 3, integrity: 20 });
  const hit = { damage: 15, damageType: "ballistic", protRoll: 2 };
  const r = Engine.resolveHit(ch, hit);
  assert.deepEqual([r.absorbed, r.through, r.lostThisHit], [5, 10, 2]);
  Engine.applyHit(ch, hit);
  assert.equal(Engine.painState(ch).level, 1);
});

test('CRB 0540 Shock: "A single hit that takes half your Health Levels or more", half of max rounded up (CQ10)', () => {
  // BOD 5: 5 HL of 5 HP, so the threshold is 3 HL.
  assert.equal(Engine.resolveHit(subject({ bod: 5 }), { damage: 15, damageType: "blunt" }).prompts.shock.threshold, 3);
  assert.equal(Engine.resolveHit(subject({ bod: 5 }), { damage: 14, damageType: "blunt" }).prompts.shock, null, "2 HL isn't half");
  // It counts the levels THIS hit emptied: 4 HP already in, 11 more empties three.
  const ch = subject({ bod: 5 }); ch.trackers.damage = 4;
  assert.ok(Engine.resolveHit(ch, { damage: 11, damageType: "blunt" }).prompts.shock);
  // The ruling's own examples: 3 HL → 2, 2 HL → 1.
  assert.equal(Engine.resolveHit(subject({ bod: 3 }), { damage: 10, damageType: "blunt" }).prompts.shock.threshold, 2);
  assert.equal(Engine.resolveHit(subject({ bod: 2 }), { damage: 5, damageType: "blunt" }).prompts.shock.threshold, 1);
  // Failing it: "Unconscious and Prone until the start of your next turn".
  const f = subject({ bod: 5 });
  Engine.applyHit(f, { damage: 15, damageType: "blunt" }, { shock: "fail" });
  assert.equal(f.trackers.conditions.map(c => c.id).join(","), ["unconscious", "prone"].join(","));
});

test('CRB 0540: "If a hit drops you to zero Health Levels ... you skip the Shock check entirely"', () => {
  const r = Engine.resolveHit(subject({ bod: 5 }), { damage: 25, damageType: "blunt" });
  assert.equal(r.prompts.shock, null);
  assert.ok(r.prompts.atZero, "At Zero instead");
  const pass = subject({ bod: 5 });
  Engine.applyHit(pass, { damage: 25, damageType: "blunt" }, { atZero: "pass" });
  assert.equal(pass.trackers.conditions.map(c => c.id).join(","), ["unconscious", "prone"].join(","));
  const fail = subject({ bod: 5 });
  Engine.applyHit(fail, { damage: 25, damageType: "blunt" }, { atZero: "fail" });
  assert.equal(fail.trackers.conditions.map(c => c.id).join(","), ["dying"].join(","));
  // "and again every time you take damage until you've regained health"
  assert.ok(Engine.resolveHit(pass, { damage: 1, damageType: "blunt" }).prompts.atZero);
});

test('CRB 0540: "Any damage you take while Dying is an automatic failure and a mark against you"', () => {
  const ch = subject({ bod: 5 });
  Engine.applyHit(ch, { damage: 25, damageType: "blunt" }, { atZero: "fail" });
  const r = Engine.resolveHit(ch, { damage: 3, damageType: "blade" });
  assert.equal(r.prompts.atZero, null, "no check: it's automatic");
  Engine.applyHit(ch, { damage: 3, damageType: "blade" });
  assert.equal(ch.trackers.conditions.find(c => c.id === "dying").marks, 1);
});

test("Gear: attacks on uncovered areas bypass armor; Headshot Defense turns a head shot into a torso hit", () => {
  const leg = Engine.resolveHit(wearing(subject()), { damage: 8, damageType: "ballistic", location: "left-leg" });
  assert.deepEqual([leg.covered, leg.through], [false, 8], "a vest doesn't cover legs, so no PROT is asked");
  const head = wearing(wearing(subject()), "motorcycle-helmet");
  const r = Engine.resolveHit(head, { damage: 8, damageType: "ballistic", location: "head", protRoll: 3 });
  assert.deepEqual([r.location, r.covered, r.through], ["torso", true, 3]);
});

test("Gear: Headshot Defense treats a head shot as a torso hit — so a Maimed from it lands on the torso", () => {
  // PR #26 review, finding 1: the Condition used the part aimed at, not the
  // part hit, so a helmeted head shot recorded "Maimed (Head)".
  const ch = wearing(wearing(subject({ bod: 10 })), "motorcycle-helmet");
  const hit = { damage: 30, damageType: "ballistic", category: "massive", location: "head" };
  const r = Engine.applyHit(ch, hit, { conditions: [{ id: "maimed", location: "head" }] });
  assert.equal(r.added.join(","), "maimed");
  assert.equal(ch.trackers.conditions[0].location, "torso", "the caller's location doesn't override where the hit landed");
  // Without the helmet, the head is where it lands.
  const bare = subject({ bod: 10 });
  Engine.applyHit(bare, hit, { conditions: ["maimed"] });
  assert.equal(bare.trackers.conditions[0].location, "head");
});

test("Design ruling (CQ5): only Massive damage offers Injured and Maimed", () => {
  const reg = Engine.resolveHit(subject({ bod: 10 }), { damage: 8, damageType: "ballistic" });
  assert.ok(!reg.prompts.conditions.includes("injured"));
  const mas = Engine.resolveHit(subject({ bod: 10 }), { damage: 10, damageType: "ballistic", category: "massive" });
  assert.ok(mas.prompts.conditions.includes("injured") && mas.prompts.conditions.includes("maimed"));
});

// ── Loadout & recovery (0530 Weapons/Wear, 0550 Downtime, Gear — Decision 100) ──

test('CRB 0530: "A character with BOD 5 using a BOD+3 weapon does 8 damage per strike"', () => {
  const ch = subject({ bod: 5 });
  ch.weapons.push({ id: "combat-knife", notes: "" });          // BOD+3
  const l = Engine.weaponLine(ch, 0);
  assert.equal(l.damage, 8);
  assert.equal(l.damageFormula, "BOD+3");
  // A ranged weapon's damage is fixed: BOD doesn't touch it.
  ch.weapons.push({ id: "vs4-ironside", notes: "" });
  assert.equal(Engine.weaponLine(ch, 1).damage, 7);
  assert.equal(Engine.weaponLine(subject({ bod: 9 }), 0), null, "no weapon, no line");
});

test('CRB 0530: "Roll the attack. 1d10 + your Skill + modifiers" — Single fire adds the weapon\'s ACC', () => {
  const ch = subject();
  ch.skills.handguns = { rank: 4, ipe: 0 };
  ch.weapons.push({ id: "vs4-ironside", notes: "" });          // ACC +1
  const l = Engine.weaponLine(ch, 0);
  assert.equal(l.attack, Engine.skillLine(ch, "handguns").checkBonus, "the attack IS the skill check");
  assert.equal(l.acc, 1, "ACC is carried apart, because only Single fire adds it");
  ch.trackers.damage = 10;                                      // BOD 5: 2 HL lost, Pain Level 1
  assert.equal(Engine.weaponLine(ch, 0).attack, l.attack - 1, "Pain comes off the attack like any check");
});

test('CRB 0550: "A BOD 5 character rebuilds a Health Level a day; five hard days puts the whole ladder back"', () => {
  const ch = subject({ bod: 5 });
  assert.equal(Engine.naturalHealing(ch).perDay, 5);
  ch.trackers.damage = 25;
  assert.equal(Engine.hlState(ch).emptied, 5);
  Engine.heal(ch, { kind: "natural", hp: 5 });
  assert.equal(Engine.hlState(ch).emptied, 4, "one Health Level back per day");
  Engine.heal(ch, { kind: "natural", hp: 5 * 4 });
  assert.equal(ch.trackers.damage, 0);
});

test("Design ruling (CQ6): rest never brings back a Massive level; Focused Healing with a replacement does", () => {
  const ch = subject({ bod: 5 });
  ch.trackers.damage = 5; ch.trackers.massiveLevels = 2;
  Engine.heal(ch, { kind: "natural", hp: 5, massive: 2 });
  assert.equal(ch.trackers.massiveLevels, 2, "rest touched Massive levels");
  const r = Engine.heal(ch, { kind: "focused", massive: 1 });
  assert.equal(r.restored, 1);
  assert.equal(ch.trackers.massiveLevels, 1);
});

test('CRB 0550: "The Injured Condition must be resolved through Focused Healing"', () => {
  const ch = subject();
  ch.trackers.damage = 6;
  ch.trackers.conditions = [{ id: "bleeding" }, { id: "injured", location: "left-arm" }];
  Engine.heal(ch, { kind: "natural", hp: 5, clear: [1] });
  assert.equal(ch.trackers.conditions.length, 2, "rest cleared a Condition");
  const r = Engine.heal(ch, { kind: "focused", hp: 0, clear: [0, 1] });
  assert.equal(r.cleared.map(c => c.id).join(","), "injured", "Focused Healing only clears what it clears");
  assert.deepEqual(ch.trackers.conditions.map(c => c.id), ["bleeding"]);
});

test('Gear: after the fight, "roll a die determined by encounter difficulty" — Hard is 1d8', () => {
  const ch = wearing(subject());                                 // Kevlar Vest, INT 20
  assert.equal(Engine.armorWear(ch, 0, { difficulty: "hard", roll: 9 }).ok, false, "a d8 can't roll 9");
  const r = Engine.armorWear(ch, 0, { difficulty: "hard", roll: 6 });
  assert.deepEqual([r.lost, r.after], [6, 14]);
  // It can leave the armor Compromised, never scrap: only Massive scraps.
  Engine.armorWear(ch, 0, { difficulty: "legendary", roll: 10 });
  Engine.armorWear(ch, 0, { difficulty: "legendary", roll: 10 });
  const w = Engine.armorState(ch).worn;
  assert.deepEqual([w.integrity, w.compromised, w.scrapped], [0, true, false]);
});

test('Gear: "A Field Repair Kit restores 1d6 INT"; 0530: armor driven to 0 by Massive "isn\'t repairable"', () => {
  const ch = wearing(subject(), "kevlar-vest", { integrityLoss: 10 });
  assert.equal(Engine.repairArmor(ch, 0, { roll: 7 }).ok, false, "a d6 can't roll 7");
  assert.equal(Engine.repairArmor(ch, 0, { roll: 4 }).restored, 4);
  assert.equal(Engine.repairArmor(ch, 0, { full: true }).after, 20, "an armorer restores it completely");
  const scrap = wearing(subject(), "kevlar-vest", { integrityLoss: 20, scrapped: true });
  assert.equal(Engine.repairArmor(scrap, 0, { full: true }).ok, false);
});

test('Gear: Self-Healing — "roll 1d4 — on a 3 or higher, the armor regains 1d4 INT ... Cannot restore INT beyond the armor\'s maximum"', () => {
  const coat = () => wearing(subject(), "hammerlock-reaper-overcoat");   // INT 30
  assert.equal(Engine.armorWear(coat(), 0, { difficulty: "medium", roll: 5 }).ok, false, "the Self-Healing roll wasn't asked for");
  const miss = Engine.armorWear(coat(), 0, { difficulty: "medium", roll: 5, selfHealCheck: 2 });
  assert.deepEqual([miss.after, miss.selfHeal.healed], [25, 0], "a 2 regains nothing");
  const hit = Engine.armorWear(coat(), 0, { difficulty: "medium", roll: 5, selfHealCheck: 3, selfHealRoll: 4 });
  assert.deepEqual([hit.after, hit.selfHeal.healed], [29, 4]);
  const cap = Engine.armorWear(coat(), 0, { difficulty: "easy", roll: 1, selfHealCheck: 4, selfHealRoll: 4 });
  assert.deepEqual([cap.after, cap.selfHeal.healed], [30, 1], "healed past the maximum");
});

test('Gear: upgrades take a mod slot each, need their minimum quality, and Tri-Weave "can be installed multiple times"', () => {
  // Ken's ruling (Decision 100): the Plasteel Weave Jacket's built-in
  // Tri-Weave is already in its printed INT 30. It doesn't add +10 again.
  assert.equal(Engine.armorState(wearing(subject(), "plasteel-weave-jacket")).worn.integrityMax, 30);
  const leather = wearing(subject(), "leather-jacket");         // Low quality, 1 slot
  assert.match(Engine.addUpgrade(leather, 0, "Ablative Plating").why, /Mid quality/);
  assert.equal(Engine.addUpgrade(leather, 0, "EMP Shielding").ok, true);
  assert.equal(Engine.addUpgrade(leather, 0, "HUDsync").ok, false, "a second upgrade in a one-slot jacket");
  const specops = wearing(subject(), "specops-vest");           // High, 3 slots
  Engine.addUpgrade(specops, 0, "Tri-Weave"); Engine.addUpgrade(specops, 0, "Tri-Weave");
  assert.equal(Engine.armorState(specops).worn.integrityMax, 50);
  assert.equal(Engine.addUpgrade(specops, 0, "Warding — Aether").ok, true);
  assert.equal(Engine.addUpgrade(specops, 0, "EMP Shielding").ok, false, "a fourth upgrade in three slots");
  const two = wearing(subject(), "urban-tactics-vest");          // Mid, 2 slots
  Engine.addUpgrade(two, 0, "Warding — Elemental");
  assert.match(Engine.addUpgrade(two, 0, "Warding — Elemental").why, /Already installed/, "Warding isn't repeatable");
  assert.equal(Engine.addUpgrade(two, 0, "Warding — Spirit").ok, true, "two kinds of Warding take two slots");
  // The one Warding from before is retired: installed, it works; it isn't offered.
  assert.ok(!Engine.upgradeOptions(wearing(subject(), "specops-vest"), 0).options.some(o => o.id === "Warding"));
  assert.equal(Engine.addUpgrade(wearing(subject(), "specops-vest"), 0, "Warding").ok, false);
  assert.equal(Engine.addUpgrade(wearing(subject(), "reinforced-denim-vest"), 0, "EMP Shielding").ok, false, "Low quality has no mod slots");
});

test('CRB 0540 Dying: ongoing damage "will continue to tick while you\'re dying. Each time you take damage, that\'s another mark" (F24 closed: Decision 220)', () => {
  const ch = subject({ bod: 5 });
  ch.trackers.damage = 25;
  ch.trackers.conditions = [{ id: "dying", marks: 0 }, { id: "bleeding" }];
  const r = Engine.resolveReset(ch);
  assert.equal(r.marks, 1);
  assert.ok(r.prompts.dyingCheck, "the check is asked beside the mark (Deighton Q5)");
  assert.equal(r.notes.length, 0, "nothing is unsettled any more");
  Engine.applyReset(ch);
  assert.equal(ch.trackers.conditions[0].marks, 1);
  assert.equal(ch.trackers.damage, 26);
  // Nothing ticking: "make a WILL Essence Check TN 8 TH 2 at every Reset phase".
  ch.trackers.conditions = [{ id: "dying", marks: 1 }];
  assert.ok(Engine.resolveReset(ch).prompts.dyingCheck);
  Engine.applyReset(ch, {}, { dyingCheck: "pass" });
  assert.equal(ch.trackers.conditions[0].marks, 1, "a pass buys the round");
  Engine.applyReset(ch, {}, { dyingCheck: "fail" });
  assert.equal(ch.trackers.conditions[0].marks, 2);
});

test('CRB 0540 At Zero: the check comes "again every time you take damage" — a Bleeding tick included, and no Shock for it', () => {
  const ch = subject({ bod: 5 });
  ch.trackers.damage = 24;
  ch.trackers.conditions = [{ id: "bleeding" }, { id: "burning" }];
  assert.equal(Engine.resolveReset(ch).ok, false, "Burning's damage has to be entered");
  const r = Engine.resolveReset(ch, { sources: { 1: 6 } });
  assert.equal(r.total, 7);
  assert.ok(r.prompts.atZero, "the drop to zero didn't ask At Zero");
  assert.equal(r.prompts.shock, undefined, "Shock is for a single hit, not a tick");
  Engine.applyReset(ch, { sources: { 1: 6 } }, { atZero: "fail" });
  assert.ok(ch.trackers.conditions.some(c => c.id === "dying"));
});

// ── Tolerance (Decision 103) ──────────────────────────────────────────
// Deighton's ruling, 2026-09-22: TOL = 1 + INT + BOD + COOL bonuses (it was
// INT/COOL/EMP). WILL stands at 1 + BOD + INT + EMP. Source: `0400`'s derived Attributes,
// as Scott rewrote it on 2026-09-23.

function withStats(stats) {
  const ch = subject();
  for (const [id, v] of Object.entries(stats)) ch.stats[id].base = v;
  return ch;
}

test('CRB: "INT 4 (0), BOD 3 (-1), and COOL 9 (+3). Your TOL is 3"', () => {
  // EMP 9 isn't in the book's example. It's here so the old INT/COOL/EMP
  // formula (which would give 7) can't pass this test.
  const ch = withStats({ INT: 4, BOD: 3, COOL: 9, EMP: 9 });
  assert.equal(Engine.derived(ch).TOL, 3);
});

test('Decision 103: BOD feeds TOL and EMP no longer does; WILL keeps BOD/INT/EMP', () => {
  const base = { INT: 4, COOL: 4, BOD: 4, EMP: 4 };
  const at = (over) => Engine.derived(withStats({ ...base, ...over }));
  assert.equal(at({}).TOL, 1);
  assert.equal(at({ BOD: 9 }).TOL, 4, "BOD +3 must raise TOL by 3");
  assert.equal(at({ EMP: 9 }).TOL, 1, "EMP must not move TOL");
  assert.equal(at({ EMP: 9 }).WILL, 4, "EMP still feeds WILL");
  assert.equal(at({ BOD: 9 }).WILL, 4, "BOD still feeds WILL");
  assert.equal(at({ COOL: 9 }).WILL, 1, "COOL does not feed WILL");
  assert.equal(at({ INT: 1, BOD: 1, COOL: 1 }).TOL, 1, "floor 1");
});

// ── Cascade (0480_Magic.md, Decision 106) ──────────────────────────────────

test('0480_Magic.md: "roll 1d10 and add the degree of the Rupture that caused it" — each band of the Cascade Table', () => {
  const ch = subject();
  const at = (roll, degree) => Engine.cascade(ch, { roll, degree }).result.id;
  assert.equal(at(1, 2), "cosmetic-mutation");      // 3
  assert.equal(at(2, 2), "cosmetic-mutation");      // 4
  assert.equal(at(3, 2), "backlash");               // 5
  assert.equal(at(4, 2), "backlash");               // 6
  assert.equal(at(5, 2), "temporary-aberration");   // 7
  assert.equal(at(6, 2), "temporary-aberration");   // 8
  assert.equal(at(7, 2), "permanent-aberration");   // 9
  assert.equal(at(6, 5), "permanent-aberration");   // 11
  assert.equal(at(8, 4), "burned-out");             // "12+"
  assert.equal(at(10, 9), "burned-out");
});

test("0480_Magic.md: casting needs TOL above zero, so a Cascade's Rupture is at least 2 and the table starts at 3", () => {
  // Not a gap in the table: 1d10 + 1 can't happen, since a Rupture of 1 can
  // only take TOL from 1 to 0 (Exhausted), never below it.
  const r = Engine.cascade(subject(), { roll: 1, degree: 1 });
  assert.equal(r.ok, false);
  assert.match(r.why, /at least 2/);
  assert.equal(D.cascadeTable.rows[0].min, 3);
});

test('0480_Magic.md Aberration Table: 1–3 is Good temporary but Neutral permanent; 8–10 is Bad either way', () => {
  const ch = subject();
  const cat = (roll, degree, aberrationRoll) => Engine.cascade(ch, { roll, degree, aberrationRoll }).aberration.category.id;
  // 5 + 2 = 7, Temporary; 7 + 2 = 9, Permanent.
  assert.deepEqual([1, 3, 4, 7, 8, 10].map(a => cat(5, 2, a)), ["good", "good", "neutral", "neutral", "bad", "bad"]);
  assert.deepEqual([1, 3, 4, 7, 8, 10].map(a => cat(7, 2, a)), ["neutral", "neutral", "neutral", "neutral", "bad", "bad"]);
  const pending = Engine.cascade(ch, { roll: 5, degree: 2 }).aberration;
  assert.equal(pending.pending, true, "an Aberration row should wait for the second die");
  assert.equal(Engine.cascade(ch, { roll: 3, degree: 2 }).aberration, null, "Backlash has no Aberration roll");
});

test("Appendix Aberrations: fifteen Good, fifteen Neutral, nine Bad, and the ones the CRB ties to an Advantage say so", () => {
  const n = c => D.aberrations.filter(a => a.category === c).length;
  assert.deepEqual([n("good"), n("neutral"), n("bad")], [15, 15, 9]);
  const as = Object.fromEntries(D.aberrations.filter(a => a.as).map(a => [a.id, a.as]));
  assert.equal(as["danger-sense"], "Danger Sense Advantage, Rank 3");
  assert.equal(as["hemophiliac"], "Hemophiliac Disadvantage");
  assert.equal(as["beacon"], "Monster Magnet Disadvantage", "the 2026-09-24 appendix ties Beacon to Monster Magnet");
  assert.equal(Object.keys(as).length, 8);
});

// ── Grimoire (0480_Magic.md, Decision 108) ─────────────────────────────────

test('0480_Magic.md: "Spell Power = Evocation Rank + WILL"', () => {
  const ch = subject();
  ch.identity.archetype = "arcanist";
  const sp = Engine.spellPower(ch);
  const evo = Engine.disciplineRanks(ch).find(d => d.id === "evocation").rank;
  assert.equal(sp.value, evo + Engine.derived(ch).WILL);
  ch.archetypeChoices.disciplines = { evocation: 2 };
  assert.equal(Engine.spellPower(ch).value, sp.value + 2, "buying Evocation didn't raise Spell Power");
});

test('0480_Magic.md: Mastered "Costs 30 IP x TH ... TH is reduced by 1"; "A Mastered TH 1 spell requires no roll at all"', () => {
  const ch = subject();
  ch.identity.archetype = "arcanist";
  ch.panelData.grimoire = [{ spellId: "zap", stage: "mastered", notes: "" }, { spellId: "firebolt", stage: "known", notes: "" }];
  const [zap, bolt] = Engine.grimoire(ch).lines;
  assert.equal(zap.printedTH, 1);
  assert.equal(zap.th, 0);
  assert.equal(zap.noRoll, true);
  assert.equal(bolt.th, bolt.printedTH, "a Known spell lost TH");
  assert.equal(bolt.masteryCost, 30 * bolt.printedTH);
});

// ── Aberrations on the character (Decisions 109–110) ─────────────────

/** An Arcanist whose maximum TOL is exactly `max`, with `current` left. */
function arcanistAt(max, current) {
  const ch = subject();
  ch.identity.archetype = "arcanist";
  const base = Engine.derived(ch).TOL;
  ch.trackers.adjustments = [{ target: "TOL", amount: max - base, note: "fixture" }];
  ch.trackers.panel["tol-spent"] = { value: max - current };
  return ch;
}
const tolOf = ch => {
  const max = Engine.derived(ch).TOL;
  return { max, current: max - ch.trackers.panel["tol-spent"].value };
};

test('Decision 109 (Deighton, MQ2): Drained lowers maximum TOL by 2 and leaves current alone — "max 8 / current 3 becomes max 6 / current 3"', () => {
  const ch = arcanistAt(8, 3);
  assert.deepEqual(tolOf(ch), { max: 8, current: 3 });
  assert.equal(Engine.recordAberration(ch, { id: "drained", permanence: "permanent" }).ok, true);
  assert.deepEqual(tolOf(ch), { max: 6, current: 3 });
});

test('Decision 109: Drained "can go below 1" — "a max of 2 becomes 0", and max TOL is never below 0', () => {
  const two = arcanistAt(2, 2);
  Engine.recordAberration(two, { id: "drained", permanence: "temporary" });
  assert.deepEqual(tolOf(two), { max: 0, current: 0 });
  const zero = arcanistAt(0, 0);
  Engine.recordAberration(zero, { id: "drained", permanence: "temporary" });
  assert.deepEqual(tolOf(zero), { max: 0, current: 0 }, "max 0 didn't stay 0");
  const one = arcanistAt(1, 1);
  Engine.recordAberration(one, { id: "drained", permanence: "temporary" });
  assert.equal(Engine.derived(one).TOL, 0, "max 1 went below 0");
});

test('Decision 109 (Ken): removing Drained grants no TOL — "after resting to 6 and then removing Drained, TOL stays 6"', () => {
  const ch = arcanistAt(8, 8);
  Engine.recordAberration(ch, { id: "drained", permanence: "permanent" });
  assert.deepEqual(tolOf(ch), { max: 6, current: 6 });
  const i = ch.trackers.aberrations.findIndex(e => e.id === "drained");
  assert.equal(Engine.removeAberration(ch, i).ok, true);
  assert.deepEqual(tolOf(ch), { max: 8, current: 6 });
});

test('Decision 109 (Deighton, MQ3): Phantom Pain — "Your PL1 happens even if you are full health"', () => {
  const ch = subject({ bod: 10 });
  ch.identity.archetype = "arcanist";
  Engine.recordAberration(ch, { id: "phantom-pain", permanence: "permanent" });
  const at = dmg => { ch.trackers.damage = dmg; return Engine.painState(ch); };
  assert.equal(at(0).level, 1, "Phantom Pain at full health isn't Pain Level 1");
  assert.equal(at(0).fromAberrations, 1);
  assert.equal(at(10).level, 2);
  assert.equal(Engine.addCondition(ch, { id: "agonized" }).ok, true);
  assert.equal(at(0).level, 2, "Phantom Pain and Agonized don't add");
  assert.equal(at(40).level, 3, "Phantom Pain with Agonized passed the clamp at 3");
  assert.deepEqual([...at(0).painSources], ["Agonized", "Phantom Pain"]);
});

test('Decision 109: "Spell Attack = Evocation Rank + REF + WILL", the scores and not their bonuses', () => {
  const ch = subject();
  ch.identity.archetype = "arcanist";
  ch.stats.REF.base = 7;
  const sa = Engine.spellAttack(ch);
  const evo = Engine.disciplineRanks(ch).find(d => d.id === "evocation").rank;
  assert.equal(sa.value, evo + 7 + Engine.derived(ch).WILL);
  assert.notEqual(sa.value, evo + Engine.statTable(ch).REF.mod + Engine.derived(ch).WILL, "read REF's bonus, not the score");
  ch.stats.REF.base = 8;
  assert.equal(Engine.spellAttack(ch).value, sa.value + 1, "REF didn't count point for point");
  assert.equal(Engine.grimoire(ch).spellAttack.value, sa.value + 1, "the Grimoire doesn't carry Spell Attack");
});

// ── Starting spells (0411_Arcanist; Decisions 109 and 111) ──

test('0411: "Known Spells" is TOL + 1d4 / 2d4 / 3d4 / 4d4 by power level, and the count is TOL + the roll', () => {
  const want = { street: "1d4", heroic: "2d4", shadows: "3d4", wcd: "4d4" };
  for (const [pl, die] of Object.entries(want)){
    const ch = subject();
    ch.identity.archetype = "arcanist";
    ch.creation.powerLevel = pl;
    ch.archetypeChoices.rolls.startingSpells = 3;
    const st = Engine.startingSpells(ch);
    assert.equal(st.rollDie, die, `${pl}: wrong starting-spell roll`);
    assert.equal(st.count, Engine.derived(ch).TOL + 3, `${pl}: the count isn't TOL + the roll`);
  }
});

test('Decision 109 (Deighton, MQ1): a new Arcanist "would need the ranks in Evocation" — at creation a spell\'s TH can\'t exceed Evocation rank', () => {
  const ch = subject();
  ch.identity.archetype = "arcanist";
  ch.creation.powerLevel = "street";                                  // Evocation starts at 1
  const superior = D.spells.find(s => s.th === 4).id;
  assert.equal(Engine.canAddStartingSpell(ch, superior).ok, false);
  ch.archetypeChoices.disciplines.evocation = 3;                      // bought at creation: Evocation 4
  assert.equal(Engine.canAddStartingSpell(ch, superior).ok, true, "ranks bought at creation didn't count");
});

test("0412: Quick Study needs a Major, Danger Sense 1 and the Intuition skill at 1 (F11)", () => {
  // 0412: "Prerequisites: 1 Major Milestone already selected, Danger Sense
  // Advantage at least Rank 1, Intuition skill at least Rank 1". The data
  // asked for an Intuition *advantage*, which doesn't exist, so no one could
  // ever take it.
  const qs = D.milestones.majorGeneral.find(m => m.id === "quick-study");
  const ch = subject();
  ch.progression.milestones.major.push({ id: "specialist", date: "2026-09-23" });
  ch.advantages.push({ id: "danger-sense", rank: 1, notes: "" });
  const missing = Engine.majorPrereqs(ch, qs);
  assert.equal(missing.ok, false, "Quick Study opened without the Intuition skill");
  assert.ok(missing.unmet.some(u => /Intuition/.test(u)), "the unmet line doesn't name Intuition");
  ch.skills.intuition = { rank: 1, ipe: 0 };
  const r = Engine.majorPrereqs(ch, qs);
  assert.equal(r.ok, true, `Quick Study stays shut with every CRB prerequisite met: ${r.unmet.join("; ")}`);
  assert.ok(!JSON.stringify(qs).includes("\"flagged\""), "Quick Study is still flagged");
});

test("Hardcore Parkour needs a Major, Acrobatics 4 and Danger Sense 1, and nothing else (Deighton, Decision 129; F27)", () => {
  // 041 (now 0412) asked for Cat Like Balance (an Advantage culled from an earlier
  // version, so the Milestone could never be taken), Time Sense and Danger
  // Sense. Deighton, 2026-09-24: Cat Like Balance becomes "Acrobatics rank of
  // 4 or better", and Time Sense is removed.
  const hp = D.milestones.majorGeneral.find(m => m.id === "hardcore-parkour");
  const ch = subject();
  ch.progression.milestones.major.push({ id: "specialist", date: "2026-09-24" });
  ch.advantages.push({ id: "danger-sense", rank: 1, notes: "" });
  ch.skills.acrobatics = { rank: 3, ipe: 0 };
  const short = Engine.majorPrereqs(ch, hp);
  assert.equal(short.ok, false, "Hardcore Parkour opened at Acrobatics 3");
  assert.ok(short.unmet.some(u => /Acrobatics 4\+/.test(u)), "the unmet line doesn't name Acrobatics 4");
  ch.skills.acrobatics.ipe = 1;
  const r = Engine.majorPrereqs(ch, hp);
  assert.equal(r.ok, true, `Hardcore Parkour stays shut with Acrobatics 4, Danger Sense and a Major: ${r.unmet.join("; ")}`);
  assert.deepEqual([...r.manual], [], "a prerequisite is still left to the GM");
  assert.ok(!JSON.stringify(hp.prerequisites).includes("time-sense"), "Time Sense is still required");
  assert.notEqual(hp.flagged, true, "Hardcore Parkour is still flagged after the ruling");
});

// ── The Professional (0412), as data (Decision 134) ───────────────────

/** A Professional of one Subtype at one Campaign Power Level. */
function professional(subtype, pl = "heroic") {
  const ch = Engine.newCharacter();
  ch.identity.archetype = "professional";
  ch.creation.powerLevel = pl;
  ch.archetypeChoices.specialization = [subtype];
  return ch;
}
// A plain array: deepEqual treats the engine's VM-realm arrays as unequal to
// a local [] even when both are empty (see engine.test.mjs).
const focusedErrors = ch => [...Engine.validate("archetype", ch)].filter(i => /Focused Skill/.test(i.msg)).map(i => String(i.msg));

test('CRB 0412, Mercenary: "Athletics, Awareness, Combat Sense, Handguns, and 1 Additional Combat Skill" (B12)', () => {
  const ch = professional("mercenary");
  assert.equal([...Engine.focusedSkillIds(ch)].sort().join(), "athletics,awareness,combat-sense,handguns");
  const p = Engine.focusedPicks(ch);
  assert.equal(p.need, 1, "the Mercenary's fifth Focused Skill isn't asked for");
  assert.ok(focusedErrors(ch).some(m => /Choose 1 Combat Skill /.test(m)), "validate doesn't ask for the pick");
  assert.ok(!p.options.includes("handguns") && !p.options.includes("combat-sense"), "the pick offers a skill the Mercenary already has");
  assert.ok(p.options.every(id => Engine.skillById(id).category === "combat"), "the pick offers a skill that isn't Combat");
  assert.equal(Engine.toggleFocusedPick(ch, "rifles").ok, true);
  assert.equal(Engine.focusedSkillIds(ch).length, 5);
  assert.deepEqual(focusedErrors(ch), []);
  assert.equal(Engine.toggleFocusedPick(ch, "melee").ok, false, "a second pick went through");
});

test('CRB 0412, Cleaner: "Acrobatics, Combat Sense, Security, Stealth, and 2 Combat Skills" is six, never five', () => {
  const ch = professional("cleaner");
  assert.equal(Engine.toggleFocusedPick(ch, "combat-sense").ok, false, "a pick went on Combat Sense, which the Cleaner already has");
  assert.equal(Engine.toggleFocusedPick(ch, "stealth").ok, false, "a General skill passed as a Combat pick");
  // A file can carry what the picker refuses; validate says so.
  ch.archetypeChoices.focusedSkillPicks = ["combat-sense", "handguns"];
  assert.ok(focusedErrors(ch).some(m => /Combat Sense can't be one/.test(m)), "a doubled pick passes validate");
  ch.archetypeChoices.focusedSkillPicks = ["handguns", "rifles"];
  assert.deepEqual(focusedErrors(ch), []);
  assert.equal(Engine.focusedSkillIds(ch).length, 6);
});

test('CRB 0412: the Focused Skill Max Bonus (+1/+2/+3/+4) raises the starting cap of Focused Skills only (B13)', () => {
  // 0420: "The cap on starting rank is a function of Campaign Power Level.
  // Once the campaign begins, it doesn't apply."
  for (const [pl, bonus] of [["street", 1], ["heroic", 2], ["shadows", 3], ["wcd", 4]]) {
    const ch = professional("mercenary", pl);
    const max = D.powerLevels.find(p => p.id === pl).maxSkillRank;
    assert.equal(Engine.skillRankCap(ch, "athletics"), max + bonus, `${pl}: Focused Athletics`);
    assert.equal(Engine.skillRankCap(ch, "stealth"), max, `${pl}: unfocused Stealth`);
  }
  const ch = professional("mercenary");   // Heroic: 5, Focused 7
  ch.skills.athletics = { rank: 5, ipe: 0 };
  assert.equal(Engine.canBoost(ch, "skill", "athletics").ok, true, "a Focused skill at 5 can't be boosted at Heroic");
  ch.skills.stealth = { rank: 5, ipe: 0 };
  assert.equal(Engine.canBoost(ch, "skill", "stealth").ok, false, "an unfocused skill was boosted past the cap");
});

test("the starting cap is checked, not only held by the stepper: changing Subtype can't strand a rank over it", () => {
  const ch = professional("mercenary");
  ch.skills.athletics = { rank: 7, ipe: 0 };
  assert.ok(!Engine.validate("skills", ch).some(i => /Athletics/.test(i.msg)), "Focused Athletics 7 refused at Heroic");
  ch.archetypeChoices.specialization = ["fence"];   // Athletics isn't a Fence's
  assert.ok(Engine.validate("skills", ch).some(i => i.level === "error" && /Athletics is rank 7/.test(i.msg)),
    "an unfocused rank 7 passes at Heroic");
  ch.skills.athletics.rank = 5;
  ch.creation.boosts.push({ targetType: "skill", targetId: "athletics", times: 1 });
  assert.ok(Engine.validate("character-points", ch).some(i => i.level === "error" && /Athletics is rank 6 with Boosts/.test(i.msg)),
    "a Boost past the cap passes");
});

test('CRB 0412, Master of None: "3 x current skill rank up to rank 4. From rank 5 on, the standard 5 × current rank applies" (B14)', () => {
  // Ken, 2026-09-24: "up to rank 4" is the rank being bought, so 4 → 5 is
  // the standard price.
  const ch = professional("jack-of-all-trades");
  const cost = from => { ch.skills.stealth = { rank: from, ipe: 0 }; return Engine.ipCost(ch, "skill", "stealth").cost; };
  assert.equal(cost(1), 3);
  assert.equal(cost(2), 6, "the audit's case: Stealth 2 → 3");
  assert.equal(cost(3), 9);
  assert.equal(cost(4), 20, "4 → 5 is the standard price");
  assert.equal(cost(5), 25);
  delete ch.skills.stealth;
  assert.equal(Engine.ipCost(ch, "skill", "stealth").cost, D.ip.skillIncreaseCost.newSkill, "Decision 97's flat price for a new skill");
  // F33, closed 2026-10-08: 0412 says Master of None raises no starting cap.
  assert.equal(Engine.skillRankCap(ch, "stealth"), D.powerLevels.find(p => p.id === "heroic").maxSkillRank);
});

test("R13: the Professional's Campaign Power Scaling table matches 0412, row for row", () => {
  const md = crb("0412_Professional.md");
  const head = md.search(/\|\s*\*\*Power Level\*\*\s*\|\s*\*\*Focused Skill Max Bonus\*\*\s*\|\s*\*\*Natural Advantages\*\*\s*\|/);
  assert.ok(head >= 0, "0412's Professional scaling table moved or was renamed");
  const lines = md.slice(head).split("\n").slice(2);
  const rows = lines.slice(0, lines.findIndex(l => !l.startsWith("|"))).map(l => l.split("|").slice(1, -1).map(c => c.trim()));
  const byPl = D.archetypes.find(a => a.id === "professional").campaignPowerScaling.byPowerLevel;
  const seen = [];
  for (const [name, bonus, ranks] of rows) {
    const pl = D.powerLevels.find(p => p.name === name);
    assert.ok(pl, `0412 names a power level the data doesn't: ${name}`);
    assert.equal(byPl[pl.id].focusedSkillMaxBonus, Number(bonus.replace("+", "")), `${name}: Focused Skill Max Bonus`);
    assert.equal(byPl[pl.id].naturalAdvantageRanks, parseInt(ranks, 10), `${name}: Natural Advantages`);
    seen.push(pl.id);
  }
  assert.equal(seen.sort().join(), D.powerLevels.map(p => p.id).sort().join(), "0412's table and the data cover different power levels");
});

test("R14: every spell in the Book of Known Spells is in the catalog, as the book prints it", () => {
  // Read the mirror the way the book lays a spell out: a bold name, then an
  // italic header "Glyph · TN n · TH n · Range · Type · Damage", then the
  // Target/Effect/Duration/Defending lines and the Overflow lines. The data
  // writes the book's dashes as -- and -.
  //
  // The Inscribed Spells part prints a spell at its Enchantment or Alchemy TH,
  // with that TH's time where the range would be (Decision 136). The catalog
  // keeps the tier's own TH, so those are checked through Engine.spellForm,
  // and the Ench./Alch. tag has to agree with `disciplines`. Four traps are
  // printed in both parts; the Inscribed copy is the newer text and wins.
  const md = crb("Appendix_Book_of_Known_Spells.md").replace(/\r/g, "");
  const from = md.search(/^# \*\*Cantrips\*\*/m); // after "How to Read a Spell Entry" and its example
  const inscribedAt = md.search(/^# \*\*Inscribed Spells\*\*/m);
  assert.ok(from > 0 && inscribedAt > from, "the book's Cantrips or Inscribed Spells heading moved; this walk needs both");
  const dash = s => s.replace(/—/g, "--").replace(/–/g, "-").replace(/[‘’]/g, "'");
  const read = text => {
    // A trailing backslash is pandoc's hard line break, which the 2026-10-07
    // pull prints on some entries' lines.
    const lines = text.split("\n").map(l => l.replace(/^>\s?/, "").replace(/\\$/, "").trim()), out = [];
    for (let i = 0; i < lines.length; i++) {
      const name = lines[i].match(/^\*\*([^*]+)\*\*$/);
      const head = name && lines.slice(i + 1).find(l => l);
      if (!head || !/^\*[^*].*TN \d/.test(head)) continue;
      const sp = { name: name[1], head: head.replace(/^\*|\*$/g, "").split("·").map(s => s.trim()), overflow: {}, tags: [] };
      for (let j = i + 2; j < lines.length && !/^\*\*[^*:]+\*\*$/.test(lines[j]); j++) {
        const f = lines[j].match(/^\*\*(Target|Effect|Duration|Defending):\*\*\s*(.*)$/);
        if (f) sp[f[1].toLowerCase()] = dash(f[2]);
        const o = lines[j].match(/^\*\*(\dx\+?)\s*—\s*\*\*\s*(.*)$/);
        if (o) sp.overflow[o[1]] = dash(o[2]);
        const t = lines[j].match(/^\*Tags:\s*(.*)\*$/);
        if (t) { sp.tags = t[1].split(",").map(x => x.trim()); break; }
      }
      out.push(sp);
    }
    return out;
  };
  const inscribed = read(md.slice(inscribedAt));
  const names = new Set(inscribed.map(b => b.name));
  const book = [...read(md.slice(from, inscribedAt)).filter(b => !names.has(b.name)).map(b => ({ ...b, form: null })),
                ...inscribed.map(b => ({ ...b, form: true }))];
  assert.ok(inscribed.length >= 17 && book.length > 120, `read only ${book.length} spells (${inscribed.length} inscribed); the layout changed`);
  const ch = Engine.newCharacter();
  for (const b of book) {
    const s = D.spells.find(x => x.name === b.name);
    assert.ok(s, `the book has ${b.name}; the catalog doesn't`);
    const tn = b.head.findIndex(p => /^TN \d+$/.test(p));
    assert.equal([].concat(s.glyph).join(" · "), b.head.slice(0, tn).join(" · "), `${b.name}: Glyph`);
    assert.equal(s.tn, Number(b.head[tn].slice(3)), `${b.name}: TN`);
    const only = b.tags.includes("Alch.") ? "alchemy" : b.tags.includes("Ench.") ? "enchantment" : null;
    assert.equal(JSON.stringify(Engine.spellForms(s)), JSON.stringify(only ? [only] : D.spellcraftRules.forms.disciplines), `${b.name}: its tags and its disciplines disagree`);
    const f = Engine.spellForm(ch, s);
    if (b.form) {
      assert.equal(f.th, Number(b.head[tn + 1].slice(3)), `${b.name}: its ${only} TH isn't the Enchantment table's for ${s.tier}`);
      assert.equal(f.time, b.head[tn + 2], `${b.name}: its ${only} time`);
    } else assert.equal(s.th, /^TH \d+$/.test(b.head[tn + 1]) ? Number(b.head[tn + 1].slice(3)) : null, `${b.name}: TH`); // Counterspell prints none
    for (const k of ["target", "effect", "duration", "defending"]) assert.equal(s[k], b[k], `${b.name}: ${k}`);
    const overflow = Object.keys(b.overflow).length ? b.overflow : null;           // Counterspell has none
    assert.equal(JSON.stringify(s.overflow), JSON.stringify(overflow), `${b.name}: Overflow`); // D lives in another realm
  }
});

// ── Character Points and Power Level (Decision 150) ───────────────────
// Source: Deighton's playtested Campaign Power Level table and STAT Point
// Costs, relayed by Ken on 2026-09-27 (0400 and 0420 print it now). The base
// of 1 is free: "going to 7 costs 2".

test("Deighton's table: flat Stat Points, Skill Points, CP and Max Skill Rank by Campaign level", () => {
  const want = {
    street:  { flat: 45, skills: 40, cp: 5,  skillCap: 4, powerCap: 2, boost: 2 },
    heroic:  { flat: 50, skills: 45, cp: 10, skillCap: 5, powerCap: 3, boost: 3 },
    shadows: { flat: 55, skills: 50, cp: 15, skillCap: 6, powerCap: 4, boost: 4 },
    wcd:     { flat: 60, skills: 55, cp: 20, skillCap: 7, powerCap: 5, boost: 5 },
  };
  for (const [id, w] of Object.entries(want)) {
    const p = D.powerLevels.find(x => x.id === id);
    assert.equal(p.statPoints.flat, w.flat, `${id}: flat Stat Points`);
    assert.equal(p.skillPoints.base, w.skills, `${id}: Skill Points base`);
    assert.equal(p.skillPoints.plusStats.join("+"), "INT+REF", `${id}: Skill Points add INT + REF`);
    assert.equal(p.characterPoints, w.cp, `${id}: CP`);
    assert.equal(p.maxSkillRank, w.skillCap, `${id}: Max Skill Rank`);
    assert.equal(p.maxPowerRank, w.powerCap, `${id}: Max Power Rank`);
    assert.equal(p.maxBoost, w.boost, `${id}: Max Boost`);
  }
});

test("a stat point costs 1 up to 6 and 2 from 7 to 10, from a free 1, so a 10 costs 13", () => {
  const total = [0, 0, 1, 2, 3, 4, 5, 7, 9, 11, 13];            // score -> Stat Points
  for (let s = 1; s <= 10; s++) assert.equal(Engine.statCost(s), total[s], `a ${s} costs ${total[s]}`);
  const ch = subject();
  ch.stats.REF.base = 6;
  assert.equal(Engine.nextStatCost(ch, "REF"), 2, "6 -> 7 costs 2");
  ch.stats.REF.base = 4;
  assert.equal(Engine.nextStatCost(ch, "REF"), 1, "4 -> 5 costs 1");
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 1;
  ch.stats.BOD.base = 10; ch.stats.REF.base = 10;                 // two 10s at Street
  assert.equal(Engine.statSpent(ch), 26);
  assert.equal(Engine.statPool(ch).total - Engine.statSpent(ch), 19, "Street leaves 19 after two 10s");
});

test("Skill Points are the level's base + INT + REF, with no roll", () => {
  const ch = subject();
  ch.stats.INT.base = 6; ch.stats.REF.base = 7;
  const p = Engine.skillPool(ch);
  assert.equal(p.total, 40 + 6 + 7);
  assert.equal(Engine.validate("skills", ch).some(i => /roll/i.test(i.msg)), false, "the Skills step still asks for a roll");
});

test("CRANK: the tier table and the +1 / -2 rules are the Workshop's (Decision 169)", () => {
  const md = crb("2000_GM_Workshop.md").replace(/\r/g, "");
  const sect = md.slice(md.indexOf("### Reputation"), md.indexOf("### The Job Generator"));
  assert.ok(sect.length > 100, "couldn't find the Reputation section");
  const rows = [...sect.matchAll(/^\|\s*\d+\s*\|\s*([A-Za-z]+)\s*\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*$/gm)];
  const tiers = D.resources.crank.tiers;
  assert.equal(rows.length, tiers.length, "the book's tier count");
  rows.forEach((m, i) => {
    assert.deepEqual([tiers[i].name, tiers[i].rep, Engine.crankPayText(tiers[i])],
      [m[1], Number(m[2]), m[3].replace(/\s+/g, "")], `tier ${i + 1}`);
  });
  assert.match(sect, /completion earns \+1 rep/);
  assert.match(sect, /costs -2 rep/);
  assert.deepEqual([D.resources.crank.jobDone, D.resources.crank.jobWalkedOut], [1, -2]);
});

// ── Raising a power with IP (W71, Decision 194) ───────────────────────
// Source: 0450_Advancement, *Spending Improvement Points*: "Power or
// Discipline · Current rank × 20 · Evocation 3 → 4 costs 60", and "New Power ·
// 40 · Rank 1 in a Power your archetype can learn".

test('0450: a Power or Discipline costs "Current rank × 20" ("Evocation 3 → 4 costs 60"), and a New Power 40', () => {
  const md = crb("0450_Advancement.md").replace(/\r/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const row = name => { const m = md.match(new RegExp(`${name} (.+?) (\S+ ?\S* ?→|Rank 1)`)); return m && m[1]; };
  assert.match(row("Power or Discipline") || "", /Current rank × (\d+)/, "0450's Power or Discipline row moved");
  assert.equal(Number(row("Power or Discipline").match(/× (\d+)/)[1]), D.ip.powerIncreaseCost.perRank);
  assert.equal(Number((row("New Power") || "").trim()), D.ip.powerIncreaseCost.newPower, "0450's New Power price");
  assert.match(md, /Evocation 3 → 4 costs 60/, "0450's worked example moved");

  const ch = subject();
  ch.identity.archetype = "arcanist";
  const evo = () => Engine.disciplineRanks(ch).find(d => d.id === "evocation");
  ch.archetypeChoices.disciplines.evocation = 3 - evo().base;
  assert.equal(evo().rank, 3);
  const c = Engine.ipCost(ch, "power", "evocation");
  assert.deepEqual([c.from, c.to, c.cost], [3, 4, 60], "the book's own example");
  assert.equal(Engine.ipCost(ch, "power", "alchemy").cost, 40, "rank 1 in a Discipline never trained");
});

// ── The Werewolf (0414), as data (crb-v4-sync P3, Decisions 195–197) ───
// The book prints its power tables two ways (pipe tables and HTML), so this
// reads both. Text is compared with curly quotes straightened, line breaks
// and periods dropped, and runs of space collapsed: the data writes "Rank 2:
// anywhere. Rank 3: anytime." where the book breaks a cell over two lines.
const flat = s => String(s).replace(/<br\s*\/?>/g, " ").replace(/[’‘]/g, "'").replace(/[.;]/g, "").replace(/\s+/g, " ").trim();
const WW = () => D.archetypes.find(a => a.id === "werewolf");
function crbTableAfter(md, heading) {
  const at = md.indexOf(heading);
  assert.ok(at >= 0, `0414 has no "${heading}" any more`);
  const rest = md.slice(at + heading.length);
  const next = rest.search(/\n#{2,5} /);
  const part = next < 0 ? rest : rest.slice(0, next);
  if (/<table>/.test(part)) {
    return [...part.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(m => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c => flat(c[1])))
      .filter(r => r.length && !/^(Power|Augmentation)$/.test(r[0]));
  }
  const lines = part.split("\n").filter(l => l.startsWith("|"));
  return lines.slice(2).map(l => l.split("|").slice(1, -1).map(c => flat(c)));
}

test("R15: the Werewolf's Campaign Power Scaling matches 0414, row for row, Base Powers and Max Starting Rank too", () => {
  const md = crb("0414_Werewolf.md");
  const rows = crbTableAfter(md, "The following table represents the Werewolf Campaign Power Scaling:");
  const byPl = WW().campaignPowerScaling.byPowerLevel, seen = [];
  for (const [name, bonus, sfr, rou, base, maxStart] of rows) {
    const pl = D.powerLevels.find(p => p.name === name);
    assert.ok(pl, `0414 names a power level the data doesn't: ${name}`);
    const r = byPl[pl.id];
    assert.equal(r.focusStatBonusRoll, bonus, `${name}: Stat Bonus`);
    assert.equal(`WILL x ${r.startingSFR.times} + ${r.startingSFR.plus}`, sfr, `${name}: Starting SFR`);
    assert.equal(JSON.stringify([r.rou, r.basePowers, r.maxStartingRank]), JSON.stringify([rou, base, maxStart].map(Number)), `${name}: RoU, Base Powers, Max Starting Rank`);
    seen.push(pl.id);
  }
  assert.equal(seen.sort().join(), D.powerLevels.map(p => p.id).sort().join());
  // "The Focus Stats for the Werewolf are BOD, REF, and MOB. Bonus points can push a base stat beyond 10."
  assert.match(md, /The Focus Stats for the Werewolf are BOD, REF, and MOB/);
  assert.equal(WW().campaignPowerScaling.focusStats.join(" "), "BOD REF MOB");
});

test("R15: every Innate and Origin power is the book's, by name, cost, effect and Per Rank, max rank 3", () => {
  const md = crb("0414_Werewolf.md"), ww = WW();
  const tables = { "": "### Innate Powers", trueborn: "#### Trueborn Powers", wildblood: "#### Wildblood Powers", "forge-fang": "#### Forge Fang Powers" };
  let count = 0;
  for (const [origin, heading] of Object.entries(tables)) {
    const rows = crbTableAfter(md, heading);
    assert.ok(rows.length >= 5, `${heading} read ${rows.length} rows`);
    const mine = ww.powers.filter(p => (p.origin || "") === origin);
    assert.equal(mine.map(p => p.name).join(" | "), rows.map(r => r[0]).join(" | "), `${heading}: the data's powers aren't the book's, in its order`);
    for (const [name, cost, effect, perRank] of rows) {
      const p = mine.find(x => x.name === name);
      assert.equal(JSON.stringify([flat(p.cost), flat(p.effect), flat(p.perRank)]), JSON.stringify([cost, effect, perRank]), `${name} isn't as 0414 prints it`);
      assert.equal(p.maxRank, 3, `${name}: "can eventually raise them up to Rank 3"`);
      count++;
    }
  }
  assert.equal(count, ww.powers.length, "a power in the data isn't in the book");
  const disciplines = D.archetypes.flatMap(a => ((a.coreMechanic || {}).disciplines || {}).list || []).map(d => d.id);
  assert.equal(ww.powers.map(p => p.id).filter(id => disciplines.includes(id)).join(), "", "a power id collides with a Discipline's (progression.powerIpe keys both)");
  assert.equal(new Set(ww.powers.map(p => p.id)).size, ww.powers.length, "two powers share an id");
});

test("R15: each Origin's Shifting, Refuel, Need, starter power and withdrawal steps are the book's", () => {
  const md = crb("0414_Werewolf.md"), opts = WW().specialization.options;
  assert.equal(opts.map(o => o.name).join(" "), "Trueborn Wildblood Forge Fang");
  // Call of the Wild: a column per Origin, Need then three steps.
  const cotw = crbTableAfter(md, "### Call of the Wild");
  for (const [i, o] of opts.entries()) {
    const col = cotw.map(r => r[i + 1]);
    assert.equal(flat(o.withdrawal.need), col[0], `${o.name}'s Need`);
    assert.equal(JSON.stringify(o.withdrawal.steps.map(flat)), JSON.stringify(col.slice(1, 4)), `${o.name}'s withdrawal steps`);
    const sect = md.slice(md.indexOf(`### ${o.name} —`));
    for (const f of o.features) {
      const m = new RegExp(`\\*\\*${f.name}:\\*\\* ([^\\n]+)`).exec(sect);
      assert.ok(m, `0414's ${o.name} has no ${f.name}`);
      assert.equal(flat(f.text), flat(m[1]), `${o.name}'s ${f.name}`);
    }
    assert.match(sect.slice(0, sect.indexOf("Starter Power") + 200).replace(/\*/g, ""), new RegExp(`Starter Power\\s*—\\s*${o.starterPower.name}`), `${o.name}'s starter power isn't ${o.starterPower.name}`);
  }
  // VQ15: the two tables are reference, row for row.
  const aspect = crbTableAfter(md, "on the table below to see which spirit takes you");
  assert.equal(JSON.stringify(opts[1].starterPower.rows.map(r => [r.d6, r.aspect, r.effect].map(flat))), JSON.stringify(aspect));
  const cyber = crbTableAfter(md, "Unlike every other Werewolf power, it works in both forms.");
  assert.equal(JSON.stringify(opts[2].starterPower.rows.map(r => [r.augmentation, r.cost, r.effect].map(flat))), JSON.stringify(cyber));
  // Forge Fang alone spends 1 HL, as Withering, to shift.
  assert.equal(JSON.stringify(opts.map(o => o.shiftCost ? `${o.shiftCost.hl} ${o.shiftCost.category}` : null)), JSON.stringify([null, null, "1 withering"]));
  assert.match(md, /Shift into Werewolf form by spending 1 HL\. This counts as Withering damage\./);
});

test("R15: Werewolf form is the book's +2 REF, +2 MOB, +4 BOD, Claws BOD+8 and Fangs BOD+10, and bars TECH", () => {
  const md = crb("0414_Werewolf.md");
  assert.match(md, /\*\*Enhanced Stats:\*\* Gain \+2 REF, \+2 MOB, and \+4 BOD\./);
  assert.match(md, /Claws deal BOD\+8 damage and Fangs deal BOD\+10 damage, both as Melee attacks/);
  assert.match(md, /While shifted, you can’t use TECH-based skills/);
  const form = WW().coreMechanic.panels.find(p => p.type === "toggle").options.find(o => o.stats);
  assert.equal(form.stats.map(s => `${s.stat}+${s.plus}`).join(" "), "REF+2 MOB+2 BOD+4");
  assert.equal(form.naturalWeapons.map(w => `${w.name} ${w.skill} ${w.damage}`).join(", "), "Claws melee BOD+8, Fangs melee BOD+10");
  assert.equal(form.bars.stat, "TECH");
  assert.match(md, /when Withering damage taken reaches half your HL/);
  assert.equal(form.endsAtWithering, 0.5);
  // Vulnerabilities: four, EMP the Forge Fang's alone.
  assert.equal(WW().vulnerabilities.map(v => v.name + (v.origin ? `@${v.origin}` : "")).join(", "), "Silver, Feral Mind, Call of the Wild, EMP@forge-fang");
});

// ── 0460's grenade table (crb-v4-sync P1, VQ8) ─────────────────────────

test("CRB 0460: every grenade carries its 1x / 2x+ column and its Defense as printed", () => {
  const md = crb("0460_Gear.md");
  const at = md.indexOf("### Grenades");
  assert.ok(at >= 0, "0460 has no Grenades section");
  const rows = md.slice(at, md.indexOf("###", at + 4)).split("\n")
    .filter(l => /^\|/.test(l) && /\| Melee \|/.test(l))
    .map(l => l.split("|").slice(1, -1).map(c => c.trim()));
  const grenades = D.weapons.filter(w => w.category === "grenades");
  assert.equal(rows.length, grenades.length, "the book and the data list a different number of grenades");
  const norm = s => s.replace(/[“”"]/g, "").toLowerCase();
  for (const [name, , , esc, radius, defense] of rows) {
    const w = grenades.find(g => norm(g.name) === norm(name));
    assert.ok(w, `no grenade in the data for the book's ${name}`);
    const [x1, x2] = esc.split(" / ");
    assert.deepEqual({ ...w.escalation }, { "1x": x1, "2x+": x2 }, `${name}'s 1x / 2x+ isn't the book's`);
    assert.equal(w.defense, defense, `${name}'s Defense isn't the book's`);
    assert.equal(w.radius, radius, `${name}'s radius isn't the book's`);
  }
});

// ── 0414's Major Milestones (crb-v4-sync P3b, Decision 199) ───────────

test("CRB 0414: the Werewolf's 29 Major Milestones, by name, effect and prerequisite, in the book's order", () => {
  const md = crb("0414_Werewolf.md");
  const at = md.indexOf("## Growth & Milestones");
  assert.ok(at >= 0, "0414 has no Growth & Milestones section");
  const rows = md.slice(at).split("\n").filter(l => /^\| [A-Z]/.test(l) && !/^\| Milestone \|/.test(l))
    .map(l => l.split("|").slice(1, -1).map(c => c.trim()));
  const ww = D.archetypes.find(a => a.id === "werewolf");
  const data = ww.growth.majorMilestones;
  assert.equal(data.length, rows.length, "the book and the data list a different number of Majors");
  const origin = id => ww.specialization.options.find(o => o.id === id).name;
  const name = id => data.find(m => m.id === id).name;
  rows.forEach(([n, effect, pre], i) => {
    const m = data[i];
    assert.equal(m.name, n, `Major ${i + 1} isn't the book's ${n}`);
    assert.equal(m.benefit, effect, `${n}'s effect isn't the book's`);
    const p = m.prerequisites, parts = [];
    if (p.specialization) parts.push(p.specialization.map(origin).join(" or "));
    for (const id of p.milestones || []) parts.push(name(id));
    if (p.majorCount) parts.push(`${p.majorCount} Major Milestone${p.majorCount > 1 ? "s" : ""}`);
    assert.equal(parts.join(", ") || "None", pre, `${n}'s prerequisite isn't the book's`);
  });
});

test('CRB 0414: "Tireless: +2 RoU." and "Deep Reserves: +5 maximum SFR."', () => {
  const ch = Engine.newCharacter();
  ch.creation.powerLevel = "street";
  ch.identity.archetype = "werewolf";
  const before = Engine.sfr(ch);
  ch.progression.milestones.major.push({ id: "tireless", date: "2026-10-08" }, { id: "deep-reserves", date: "2026-10-08" });
  assert.equal(Engine.sfr(ch).rou - before.rou, 2);
  assert.equal(Engine.sfr(ch).value - before.value, 5);
});

// ── The Vampire (0413), as data (crb-v4-sync P4, Decisions 200–202) ────

const VA = () => D.archetypes.find(a => a.id === "vampire");
const pipeRows = (md, first) => md.split("\n").filter(l => l.startsWith(`| ${first}`)).map(l => l.split("|").slice(1, -1).map(c => flat(c)));

test("R16: the Vampire's Campaign Power Scaling matches 0413, row for row", () => {
  const md = crb("0413_Vampire.md");
  const rows = crbTableAfter(md, "The following table represents the Vampire Campaign Power Scaling");
  const byPl = VA().campaignPowerScaling.byPowerLevel, seen = [];
  for (const [name, bonus, sfr, rou, base, maxStart] of rows) {
    const pl = D.powerLevels.find(p => p.name === name);
    assert.ok(pl, `0413 names a power level the data doesn't: ${name}`);
    const r = byPl[pl.id];
    assert.equal(r.focusStatBonusRoll, bonus, `${name}: Stat Bonus`);
    assert.equal(`WILL x ${r.startingSFR.times} + ${r.startingSFR.plus}`, sfr, `${name}: Starting SFR`);
    assert.equal(JSON.stringify([r.rou, r.basePowers, r.maxStartingRank]), JSON.stringify([rou, base, maxStart].map(Number)), `${name}: RoU, Base Powers, Max Starting Rank`);
    seen.push(pl.id);
  }
  assert.equal(seen.sort().join(), D.powerLevels.map(p => p.id).sort().join());
  assert.match(md, /The Focus Stats for the Vampire are BOD, REF, and MOB/);
  assert.equal(VA().campaignPowerScaling.focusStats.join(" "), "BOD REF MOB");
  // The book's sentence is still F39's old reading; Ken's ruling (Decision 215, W88) is
  // that Innate powers are granted and Base Powers buy the Bloodline's, none above Max Starting Rank.
  assert.match(md, /Spend your Base Powers on Innate and Bloodline powers; no power starts above your Max Starting Rank\./);
  assert.match(VA().campaignPowerScaling.notes, /Innate powers are yours at rank 1\. Spend your Base Powers on your Bloodline's powers; none starts above your Max Starting Rank\./);
  assert.equal(JSON.stringify(VA().powersBought), JSON.stringify({ countBy: "campaignPowerScaling.basePowers", maxRankBy: "campaignPowerScaling.maxStartingRank", granted: "innate" }));
  // The Werewolf buys the same way, reading the same columns of its own table.
  assert.equal(JSON.stringify(WW().powersBought), JSON.stringify(VA().powersBought));
  assert.match(WW().campaignPowerScaling.notes, /Innate powers are yours at rank 1\. Spend your Base Powers on your Origin's powers; none starts above your Max Starting Rank\./);
});

test("R16: every Innate and Bloodline power is the book's, by name, cost, effect, Per Rank and printed maximum", () => {
  const md = crb("0413_Vampire.md"), va = VA();
  const tables = { "": "### Innate Powers", strigoi: "#### Strigoi Powers", upyr: "#### Upyr Powers", draugur: "#### Draugur Powers" };
  let count = 0;
  for (const [origin, heading] of Object.entries(tables)) {
    const rows = crbTableAfter(md, heading);
    assert.ok(rows.length >= 4, `${heading} read ${rows.length} rows`);
    const mine = va.powers.filter(p => (p.origin || "") === origin);
    assert.equal(mine.map(p => flat(p.name)).join(" | "), rows.map(r => r[0]).join(" | "), `${heading}: the data's powers aren't the book's, in its order`);
    for (const [name, cost, effect, perRank] of rows) {
      const p = mine.find(x => flat(x.name) === name);
      assert.equal(JSON.stringify([flat(p.cost), flat(p.effect), flat(p.perRank)]), JSON.stringify([cost, effect, perRank]), `${name} isn't as 0413 prints it`);
      // "(max 5)" is the printed maximum; "None" is a power with no ranks.
      const max = /\(max (\d+)\)/.exec(perRank);
      if (perRank === "None") assert.equal(JSON.stringify([p.ranked, p.maxRank]), JSON.stringify([false, undefined]), `${name} has no ranks`);
      else assert.equal(p.maxRank, Number(max[1]), `${name}'s printed maximum`);
      count++;
    }
  }
  assert.equal(count, va.powers.length, "a power in the data isn't in the book");
  const others = D.archetypes.filter(a => a.id !== "vampire").flatMap(a => [...(a.powers || []).map(p => p.id),
    ...(((a.coreMechanic || {}).disciplines || {}).list || []).map(d => d.id)]);
  assert.equal(va.powers.map(p => p.id).filter(id => others.includes(id)).join(), "", "a power id collides with another archetype's (progression.powerIpe keys them all)");
  assert.equal(new Set(va.powers.map(p => p.id)).size, va.powers.length, "two powers share an id");
  // Iron Hide: "Natural Armor equal to rank + 1"; Icebound Resilience: "+1 Natural Armor".
  const na = id => va.powers.find(p => p.id === id).grants[0];
  assert.equal(JSON.stringify([na("iron-hide").perRank, na("iron-hide").plus, na("icebound-resilience").plus]), "[1,1,1]");
});

test("R16: each Bloodline's features are the book's, and the Draugur's Ancient Weapon and Code tables too", () => {
  const md = crb("0413_Vampire.md"), opts = VA().specialization.options;
  assert.equal(opts.map(o => o.name).join(" "), "Strigoi Upyr Draugur");
  for (const o of opts) {
    const sect = md.slice(md.indexOf(`### ${o.name} —`));
    for (const f of o.features) {
      // Built to Last is Deighton's F41 ruling (Decision 215): the book's line still reads as a pick
      // until crb-catch-up fixes it, so the data's own words are pinned instead.
      if (f.name === "Built to Last") {
        assert.match(sect, /\*\*Built to Last:\*\* Choose a long shell \(Iron Hide\) or a short surge \(Icebound Resilience\)\./,
          "0413's Built to Last changed: if it now says an Upyr holds both, pin the book's words and drop this carve-out");
        assert.equal(f.text, "Iron Hide is a long shell, Icebound Resilience a short surge. You can hold both; they don't stack.");
        continue;
      }
      const m = new RegExp(`\\*\\*${f.name.replace(/'/g, "’")}:\\*\\* ([^\\n]+)`).exec(sect);
      assert.ok(m, `0413's ${o.name} has no ${f.name}`);
      // The Code's "Some examples are below." is its choice's text, over the table.
      assert.equal(flat(f.text), flat(m[1]).replace(/ Some examples are below$/, ""), `${o.name}'s ${f.name}`);
    }
  }
  const draugur = opts.find(o => o.id === "draugur"), choice = id => draugur.choices.find(c => c.id === id);
  const weapons = ["Blade (", "Blunt (", "Spear ("].flatMap(w => pipeRows(md, w));
  assert.equal(JSON.stringify(choice("ancient-weapon").options.map(w => [`${w.name} (${w.examples})`, "Melee", w.damage, w.style, w.reach, w.parry, w.damageType, w.tags.join(", ")])),
    JSON.stringify(weapons), "the Ancient Weapon table isn't the book's");
  assert.ok(choice("ancient-weapon").options.every(w => w.skill === "melee"));
  const codes = pipeRows(md, "The ");
  assert.equal(JSON.stringify(choice("code").examples.map(r => [r.name, ...r.values])), JSON.stringify(codes), "the Code's examples aren't the book's");
  assert.equal(choice("code").fields.map(f => f.name).join(", "), "The Hunt, The Bond, The Word");
  // Built to Last is no choice (F41, Decision 215): both powers are ordinary Upyr powers that don't stack.
  assert.equal((opts.find(o => o.id === "upyr").choices || []).length, 0);
  const noStack = VA().powers.filter(p => (p.grants || []).some(g => g.noStack === "built-to-last"));
  assert.equal(noStack.map(p => `${p.name}@${p.origin}`).join(" and "), "Icebound Resilience@upyr and Iron Hide@upyr");
});

test("R16: the Thirst is the book's: 3 SFR a fresh HL, 2 a stored one up to half, half RoU a day unfed, Hunger at RoU", () => {
  const md = crb("0413_Vampire.md");
  const blood = pipeRows(md, "Fresh").concat(pipeRows(md, "Stored"));
  assert.equal(JSON.stringify(blood), JSON.stringify([["Fresh (a living mortal)", "3"], ["Stored (blood bags, the recently dead, etc)", "2, up to half your maximum SFR"]]));
  assert.match(md, /You lose SFR equal to half your RoU for each full day that passes without feeding\./);
  assert.match(md, /When your SFR falls to your RoU or lower, the monster starts negotiating\. Make a WILL Essence check \(TN 7, TH 1\) or fall into a Blood Frenzy\./);
  const p = VA().coreMechanic.panels.find(x => x.type === "feed");
  assert.equal(JSON.stringify(p.kinds.map(k => [k.id, k.perHL, k.upToShare || null])), JSON.stringify([["fresh", 3, null], ["stored", 2, 0.5]]));
  // Deighton (Q21, Decision 215): a day without rest is the day's half RoU and 2 more, and it does not rise.
  assert.equal(JSON.stringify([p.unrested.share, p.unrested.plus]), "[0.5,2]");
  assert.match(VA().vulnerabilities.find(v => v.id === "day-rest").description, /half your RoU in SFR and 2 more. It doesn't rise/);
  assert.equal(p.unfed.share, 0.5);
  assert.equal(p.low.at, "rou");
  assert.match(p.low.text, /WILL Essence check \(TN 7, TH 1\) or fall into a Blood Frenzy/);
  // Fangs of the Fallen: "a bite attack uses Melee and deals BOD+3 damage"; Bestial Blessings' claws BOD+3, AP.
  assert.match(md, /a bite attack uses Melee and deals BOD\+3 damage/);
  assert.match(md, /Retractable claws: BOD\+3 melee damage, AP/);
  assert.equal(VA().naturalWeapons.filter(w => !w.choice).map(w => `${w.name} ${w.skill} ${w.damage} ${(w.tags || []).join("")}`.trim()).join(", "), "Bite melee BOD+3, Claws melee BOD+3 AP");
});

// ── The Reference quotes the book (Decision 207) ──────────────────────

test("CRB: the Reference's book panels are quoted verbatim from the mirror", () => {
  const norm = s => String(s).replace(/<[^>]*>/g, " ").replace(/\*\*|\*|\\/g, "").replace(/[‘’]/g, "'").replace(/−/g, "-").replace(/\s+/g, " ").trim();
  const panels = D.gmReference.panels.filter(p => p.bookSource);
  assert.ok(panels.length >= 6, "the data's book panels");
  const names = readdirSync(join(ROOT, "private/crb"));
  for (const p of panels) {
    const m = /^(\d{4})(?: (.+))?$/.exec(p.bookSource);
    assert.ok(m, `${p.id}: bookSource "${p.bookSource}" is "<4-digit file> <heading>" or "<4-digit file>"`);
    const file = names.find(n => n.startsWith(m[1]));
    assert.ok(file, `${p.id}: no file in private/crb starts with ${m[1]}`);
    let text = crb(file);
    if (m[2]) {
      const at = text.indexOf(`## ${m[2]}`);
      assert.ok(at >= 0, `${p.id}: no "## ${m[2]}" in ${file}`);
      const rest = text.slice(at + 3);
      const end = rest.indexOf("\n## ");
      text = end < 0 ? rest : rest.slice(0, end);
    }
    const book = norm(text);
    const pieces = [];
    for (const part of p.parts) {
      pieces.push(part.title, part.text, part.footText, ...(part.columns || []));
      for (const it of part.items || []) pieces.push(it.term, it.text);
      for (const row of part.rows || []) pieces.push(...row);
    }
    for (const piece of pieces) for (const bit of norm(piece || "").split(" · ")) {
      if (!bit) continue;
      assert.ok(book.includes(norm(bit)), `${p.id}: "${bit}" is not in ${file}${m[2] ? ` under "${m[2]}"` : ""}`);
    }
    // Where each piece sits, not just that it's there: a row is a row of the book's, cell for cell, the columns are
    // a header row, and an item's term and text read as one run of the book's (the run-in dash aside).
    const cell = s => norm(s).replace(/( ·)+ /g, " · ").split(" · ").filter(Boolean).join(" · ");
    const bookRows = [];
    for (const line of text.split("\n")) {
      if (!/^\s*\|/.test(line) || /^\s*\|[\s:|-]+\|\s*$/.test(line)) continue;
      bookRows.push(line.trim().replace(/^\||\|$/g, "").split("|").map(cell));
    }
    for (const tr of text.match(/<tr>[\s\S]*?<\/tr>/g) || [])
      bookRows.push((tr.match(/<t[dh]>[\s\S]*?<\/t[dh]>/g) || []).map(c => cell(c.replace(/<br\s*\/?>/g, " · "))));
    const key = row => row.map(cell).join("\u0001");
    const have = new Set(bookRows.map(key));
    const noDash = s => norm(s).replace(/ — /g, " ");
    for (const part of p.parts) {
      if ((part.columns || []).length) assert.ok(have.has(key(part.columns)), `${p.id}: the columns ${JSON.stringify(part.columns)} are not a header row in ${file}`);
      for (const row of part.rows || []) assert.ok(have.has(key(row)), `${p.id}: the row ${JSON.stringify(row)} is not a row of the book's`);
      for (const it of part.items || []) {
        const run = noDash([it.term, it.text].filter(Boolean).join(" "));
        assert.ok(noDash(text).includes(run), `${p.id}: "${run}" isn't one item of the book's`);
      }
    }
  }
});

// ── 0450's Minor Milestones (P6, Decision 217) ──────────────────────────
test("0450: the six Minor Milestones are the book's words, and Improved's roll is 3d10+30", () => {
  const md = crb("0450_Advancement.md").replace(/\r/g, "").replace(/\\\[[^\]]*\\\]/g, "").replace(/\*\*/g, "").replace(/\s+/g, " ").replace(/[’]/g, "'");
  const norm = t => t.replace(/\s+/g, " ").replace(/[’]/g, "'").trim();
  assert.equal(JSON.stringify(D.milestones.minorShared.map(m => m.id)), JSON.stringify(["skilled", "improved", "talented", "redeemed", "honed", "steadied"]), "the book's order");
  for (const m of D.milestones.minorShared) {
    const book = `${m.name}. ${norm(m.benefit)}`;
    // Talented's printed text carries an editor's bracket; the sentence before it is the book's.
    const want = m.id === "talented" ? book.replace(/ existing Advantage\.$/, "") : book;
    assert.ok(md.includes(want), `0450 doesn't say: ${want}`);
  }
  assert.match(md, /Improved\. Everything went into the work\. Gain 3d10\+30 IP\. 10s explode\./);
  assert.deepEqual({ ...Engine.ipRoll("improved") }, { count: 3, sides: 10, plus: 30 });
  assert.equal(D.milestones.minorShared.find(m => m.id === "redeemed").choice.maxPoints, 5);
  assert.equal(D.milestones.minorShared.find(m => m.id === "talented").choice.maxPoints, 5);
  assert.equal(JSON.stringify(D.milestones.minorShared.find(m => m.id === "steadied").choice.options), JSON.stringify([{ kind: "san", points: 10 }, { kind: "massiveLevel", levels: 1 }]));
  assert.match(md, /Restore 10 points of lost Sanity or 1 lost Health Level/);
});

test("Ken's ruling, Deighton confirmed (2026-10-04): LUCK bought with CP is held to the Max Character Point Boost; the starting 4 is outside it (Decision 218)", () => {
  // CRB v4 prints no Max Boost column, so this is the ruling and not the book's words.
  for (const pl of D.powerLevels) {
    const ch = subject();
    ch.creation.locked = false; ch.creation.powerLevel = pl.id; ch.advantages = [];
    assert.equal(Engine.luckState(ch).max, 4, `${pl.id}: the 4 everyone starts with`);
    ch.trackers.luck.bonus = pl.maxBoost;
    assert.equal(Engine.canBoost(ch, "luck", "LUCK").ok, false, `${pl.id}: LUCK past ${pl.maxBoost} bought`);
    assert.equal(Engine.luckState(ch).max, 4 + pl.maxBoost);
  }
});

// ── P8a: the hit (Decision 219) ───────────────────────────────────────
// Deighton's rulings of 2026-10-10 (reference/rulings-2026-10-10.md), Q1–Q3
// and Q7, plus Ken's follow-up on AP and magic. 0460 gives Resistance no order
// and no rounding; both are rulings, not quotes.
const withUpgrades = (ch, ...ups) => { ch.armor.find(a => a.worn).upgrades.push(...ups); return ch; };

test("P8a 1: Electric Resistance halves an Electric hit first, rounding down", () => {
  // Deighton's ruling (2026-10-10, Q2): "halves first, then PROT and RES". Rounding down is Ken's (PQ1).
  const ch = withUpgrades(wearing(subject({ bod: 6 }), "urban-tactics-vest"), "Resistance — Electric");
  const r = Engine.resolveHit(ch, { damage: 13, damageType: "electric", protRoll: 2 });
  assert.deepEqual({ halved: [r.halved.from, r.halved.to], by: r.halved.by, prot: r.prot, res: r.res, through: r.through },
                   { halved: [13, 6], by: "Resistance — Electric", prot: 2, res: 0, through: 4 });
});

test("P8a 8: AP on a spell gets past Natural Armor; other AP doesn't", () => {
  // Ken's follow-up to Deighton's Q3 (2026-10-10): the stub stands, except AP on a spell pierces it.
  const ch = subject({ bod: 6 });
  ch.advantages.push({ id: "thick-skin", rank: 3 });
  const hit = o => Engine.resolveHit(ch, { damage: 8, damageType: "blunt", ...o });
  assert.equal(hit({ ap: true }).through, 5, "plain AP");
  const s = hit({ ap: true, spell: true });
  assert.deepEqual([s.through, s.natural.skipped], [8, "ap"]);
  assert.equal(hit({ spell: true }).through, 5, "a spell with no AP");
});

test("P8a 9: Electric and Burning are Energy, and nothing calls it unsettled", () => {
  // Deighton's ruling (2026-10-10, Q1): Electric and Burning stay Energy.
  for (const id of ["electric", "burning"]) {
    const t = D.damageTypes.find(x => x.id === id);
    assert.equal(t.resClass, "energy");
    assert.ok(!t.flagged, `${id} is still flagged`);
    assert.equal(Engine.resolveHit(subject(), { damage: 5, damageType: id }).notes.length, 0);
  }
});

test("P8a 10: the frag grenades and the launcher carry Siege", () => {
  // Deighton's ruling (2026-10-10, Q7): grenades and explosives are Massive. Siege is the tag that says so.
  const tags = id => (D.weapons.find(w => w.id === id) || {}).tags || [];
  for (const id of ["fg1-thunderclap", "junk-bomb", "hgl4-anvil"]) assert.ok(tags(id).includes("Siege"), id);
  for (const id of ["ig7-cinder", "star-dust-grenade", "sg2-shockwave", "vs3-curtain", "sunburst-grenade", "eg3-blackout"])
    assert.ok(!tags(id).includes("Siege"), id);
  assert.match(D.weaponTagGlossary.find(g => g.id === "Siege").description, /Massive/);
});

// ── P8b: healing counts from 0 HP; Dying at a Reset (Deighton's rulings, 2026-10-10 Q4, Q5) ──
test("P8b 1: healing counts from 0 HP", () => {
  // Deighton's ruling (2026-10-10, Q4): damage past zero is a reference while Dying,
  // and the first healing wipes it. A Professional at BOD 6 is 6 x 5 = 30 HP.
  const ch = subject({ bod: 6 });
  ch.trackers.damage = 37;
  assert.equal(Engine.hlState(ch).pastZero, 7);
  const r = Engine.heal(ch, { kind: "natural", hp: 1 });
  assert.ok(r.ok);
  assert.deepEqual([r.healed, r.discarded, r.before, r.after], [1, 7, 37, 29]);
  assert.equal(ch.trackers.damage, 29);
  assert.equal(Engine.hlState(ch).hpLeft, 1);
});

test("P8b 8: Dying at a Reset is the check plus a mark per ticking source", () => {
  // Deighton's ruling (2026-10-10, Q5): the WILL check as usual, and ongoing damage is another mark.
  const ch = subject({ bod: 6 });
  ch.trackers.damage = 30;
  ch.trackers.conditions = [{ id: "dying", marks: 0 }, { id: "bleeding" }];
  const r = Engine.resolveReset(ch);
  assert.equal(r.marks, 1);
  assert.ok(r.prompts.dyingCheck, "the check is asked");
  assert.equal(r.notes.length, 0, "no unsettled notice");
  const fail = JSON.parse(JSON.stringify(ch)), pass = JSON.parse(JSON.stringify(ch));
  Engine.applyReset(fail, {}, { dyingCheck: "fail" });
  assert.equal(fail.trackers.conditions[0].marks, 2);
  Engine.applyReset(pass, {}, { dyingCheck: "pass" });
  assert.equal(pass.trackers.conditions[0].marks, 1);
});

// ── P9a: gear text, difficulty names, the Magical being (Deighton's rulings, 2026-10-10 Q8–Q10, Q31, Q33) ──
const modOf = (ch, index, id) => Engine.weaponModOptions(ch, index).options.find(o => o.id === id);
const withWeapon = id => { const ch = subject(); Engine.addLoadout(ch, "weapons", id); return ch; };

test("P9a 1: a shotgun refuses the Scope and the Angel Mod, and says why", () => {
  // Deighton's ruling (2026-10-10, Q8): a shotgun takes neither the Scope nor the Angel Mod.
  const ch = withWeapon("sg88-siege-breaker");
  const scope = modOf(ch, 0, "Scope"), angel = modOf(ch, 0, "Angel Mod");
  assert.equal(scope.ok, false);
  assert.equal(scope.why, "Shotguns don't take scopes.");
  assert.equal(angel.ok, false);
  assert.equal(angel.why, "Angel Rounds need a box magazine with a power cell.");
  for (const id of ["Scope", "Angel Mod"]) {
    const g = D.weaponModGlossary.find(m => m.id === id);
    assert.ok(!g.flagged && !g.flagNote && !g.playerNote, `${id} is still flagged`);
  }
});

test("P9a 4: the Razorwhip reaches 2m", () => {
  // Deighton's ruling (2026-10-10, Q10): the mono-whip reaches "5 or 6 feet", rounded to the sheet's meters.
  const ch = withWeapon("razorwhip");
  const l = Engine.weaponLine(ch, 0);
  assert.equal(l.reach, "2m");
  assert.ok(l.tags.includes("Reach"), "the Razorwhip lost its Reach tag");
});

test("P9a 5: the skill-check tiers are Easy, Average and Challenging", () => {
  // Deighton's ruling (2026-10-10, Q33): 10 / 15 / 20.
  assert.equal(JSON.stringify(D.skillCheckRules.difficulties), JSON.stringify({ Easy: 10, Average: 15, Challenging: 20 }));
});

test("P9a 6: a Magical being buys the Universal Advantages only", () => {
  // Deighton's ruling (2026-10-10, Q31): a classification of its own, like a Supernatural.
  const custom = D.archetypes.find(a => a.writeIn);
  const as = cls => { const ch = subject(); ch.identity.archetype = custom.id; Object.assign(ch.archetypeChoices.writeIn, { name: "Fae", classification: cls }); return ch; };
  const mb = as("magical-being"), sup = as("supernatural");
  assert.equal(Engine.classification(mb).id, "magical-being");
  for (const ad of D.advantages) assert.equal(Engine.canBuyAdvantage(mb, ad), Engine.canBuyAdvantage(sup, ad), `${ad.id} differs from a Supernatural`);
  assert.equal(D.advantages.filter(ad => Engine.canBuyAdvantage(mb, ad)).length, 15);
});

test("P9b 1: a magazine reloaded before it's empty is kept with its count", () => {
  // Deighton's ruling (2026-10-10, Q11): when you reload before a magazine is empty, the magazine is kept, with its count.
  const ch = withWeapon("ar9x-guardian");
  ch.weapons[0].roundsSpent = 13;                                        // 18 of 31 left
  ch.gear.push({ id: "rifle-rounds", qty: 2, notes: "" });
  const r = Engine.reloadWeapon(ch, 0);
  assert.equal(r.ok, true);
  assert.equal(ch.weapons[0].roundsSpent, 0, "the weapon isn't full");
  assert.equal(Engine.carriedGear(ch, "rifle-rounds").qty, 1, "the whole magazine didn't come off the stack");
  const kept = ch.gear.filter(g => g.id === "rifle-rounds" && g.roundsLeft != null);
  assert.equal(kept.length, 1, "the 18 rounds were thrown away");
  assert.equal(kept[0].roundsLeft, 18);
  assert.equal(r.kept && r.kept.roundsLeft, 18);
  assert.equal(r.kept.whole, false);
});

// ── P17: the Vampire's Major Milestones (0413, Growth & Milestones) ───────
const vamp = (bl = "strigoi", pl = "heroic") => {
  const ch = Engine.newCharacter();
  ch.identity.archetype = "vampire"; ch.creation.powerLevel = pl; ch.creation.locked = true;
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 6;
  ch.archetypeChoices.specialization = [bl];
  ch.progression.milestonePoints = 100;
  return ch;
};

test("P17 1: a Vampire is offered 0413's Majors, less another Bloodline's", () => {
  // 0413 lists 22 Majors under Growth & Milestones; three need a Bloodline.
  const rows = crb("0413_Vampire.md").split(/^## Growth/m)[1].split("\n").filter(l => /^\| [A-Z]/.test(l)).map(l => l.split("|")[1].trim()).filter(n => n !== "Milestone");
  assert.equal(rows.length, 22);
  const all = D.archetypes.find(a => a.id === "vampire").growth.majorMilestones;
  assert.equal(JSON.stringify(all.map(m => m.name)), JSON.stringify(rows), "the data's Majors aren't 0413's, in its order");
  const ids = bl => Engine.majorOffered(vamp(bl)).map(m => m.id);
  const three = ["stolen-face", "breath-of-winter", "returning-strike"];
  assert.equal(ids("strigoi").length, 20);
  assert.deepEqual([...three.filter(i => ids("strigoi").includes(i))], ["stolen-face"]);
  assert.deepEqual([...three.filter(i => ids("upyr").includes(i))], ["breath-of-winter"]);
  assert.deepEqual([...three.filter(i => ids("draugur").includes(i))], ["returning-strike"]);
  const pre = (ch, id) => Engine.majorPrereqs(ch, Engine.majorById(ch, id));
  assert.equal(pre(vamp(), "night-wings").ok, false);
  assert.equal(Engine.majorById(vamp(), "death-rites").prerequisites.majorCount, 4);
  assert.deepEqual([...pre(vamp(), "blood-control").unmet], ["Milestone: Frenzy Resistance"]);
});

test("P17 2: Blood Conditioning and Growing Hunger raise RoU and SFR", () => {
  // 0413: "+2 RoU." and "+6 maximum SFR."
  const ch = vamp();
  const s0 = Engine.sfr(ch);
  assert.deepEqual([s0.value, s0.rou], [17, 6]);
  ch.progression.milestones.major.push({ id: "blood-conditioning", date: "2026-10-15" }, { id: "growing-hunger", date: "2026-10-15" });
  const s1 = Engine.sfr(ch);
  assert.deepEqual([s1.value, s1.rou], [23, 8]);
});

// ── Holding a spell (reference/rulings-2026-10-10.md Q17–Q19, W87) ─────────────────────────

function holder10(rank, ids) {
  const ch = subject();
  ch.identity.archetype = "arcanist";
  const base = Engine.disciplineRanks(ch).find(d => d.id === "evocation").rank;
  ch.archetypeChoices.disciplines = { evocation: rank - base };
  ch.panelData.grimoire = ids.map(spellId => ({ spellId, stage: "known", notes: "" }));
  return ch;
}

test("P10 1: a held Concentration spell sets aside one die, not its Threshold (Q17)", () => {
  // Q17 follow-up: "it takes one die while you hold it, so any other spells you cast you throw 1 less die."
  const ch = holder10(3, ["fog-shroud"]);
  assert.equal(D.spells.find(s => s.id === "fog-shroud").th, 2, "the case needs a Threshold that differs from one");
  assert.ok(Engine.holdSpell(ch, "fog-shroud").ok);
  const p = Engine.castingPool(ch);
  assert.deepEqual([p.rank, p.held, p.rolls], [3, 1, 2]);
});

test("P10 2: an Arcanist holds at most their Evocation rank (Q17)", () => {
  // Q17 follow-up: "you can only hold up to your Evocation rank in spells at a time."
  const ch = holder10(2, ["fog-shroud", "wind-walker", "blazing-fury"]);
  assert.ok(Engine.holdSpell(ch, "fog-shroud").ok);
  assert.ok(Engine.holdSpell(ch, "wind-walker").ok);
  const third = Engine.holdSpell(ch, "blazing-fury");
  assert.equal(third.ok, false);
  assert.match(third.why, /Evocation rank \(2\)/);
  assert.equal(JSON.stringify(ch.trackers.heldSpells), JSON.stringify(["fog-shroud", "wind-walker"]));
});

// ── Movement (0530 Movement; reference/rulings-2026-10-10.md Q23; 0412 Fleet of Foot) ───────

const same = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);
function mover(mob, specialization) {
  const ch = subject();
  ch.stats.MOB.base = mob;
  if (specialization) { ch.identity.archetype = "professional"; ch.archetypeChoices.specialization = [specialization]; }
  return ch;
}

test("P11 1: Walk, Run and Sprint are MOB ×1, ×3 and ×6, and Jump is Sprint ÷ 4 rounded down", () => {
  // 0530: "Walk — MOB, no penalty", "Run — MOB ×3, −1 to attacks while moving", "Sprint — MOB ×6, −3 ...".
  // Q23: "Jump is calculated like this: Sprint / 4. This is rounded down."
  const row = m => Engine.movement(m).paces.map(p => [p.id, p.value, p.attack]);
  same(row(mover(5)), [["walk", 5, 0], ["run", 15, -1], ["sprint", 30, -3]]);
  assert.equal(Engine.movement(mover(5)).jump.value, 7, "30 ÷ 4 rounds down to 7");
  same(row(mover(1)).map(r => r[1]), [1, 3, 6]);
  assert.equal(Engine.movement(mover(1)).jump.value, 1, "6 ÷ 4 rounds down to 1");
});

test("P11 2: Fleet of Foot doubles Run and Sprint, not Walk, and Jump comes from the doubled Sprint", () => {
  // 0412: "Fleet of Foot [Chi 3]: Run, Sprint, and Jump are doubled." Q23: "multiply the Sprint value by 2 first then divide by 4".
  const m = Engine.movement(mover(5, "true-warrior"));
  assert.equal(m.conditional.length, 1);
  const f = m.conditional[0];
  same(f.paces.map(p => [p.id, p.value]), [["run", 30], ["sprint", 60]], "Walk is not doubled");
  assert.equal(f.jump.value, 15, "60 ÷ 4, not 2 × (30 ÷ 4) = 14");
  assert.equal(f.while, "while active");
  same(m.paces.map(p => p.value), [5, 15, 30], "a conditional grant was summed into the base paces");
  same(Engine.movement(mover(5, "mercenary")).conditional, []);
});

test("P11: the quick reference's Movement table agrees with movementRules", () => {
  const part = D.gmReference.panels.flatMap(s => s.parts || []).find(p => p.title === "Movement");
  assert.ok(part, "no Movement table in the quick reference");
  const rules = D.movementRules;
  for (const pace of rules.paces) {
    const row = part.rows.find(r => r[0] === pace.name);
    assert.ok(row, `${pace.name} has no row`);
    assert.equal(row[1], pace.times === 1 ? "MOB" : `MOB ×${pace.times}`);
    assert.equal(row[2], pace.attack === 0 ? "No penalty" : String(pace.attack).replace("-", "−"));
  }
});

// ── P12a: IP beyond ranks (0450 Spending Improvement Points; Deighton Q24) ─────
function ipChar(arch = "professional") {
  const ch = subject();
  ch.identity.archetype = arch;
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 5;     // SAN max 50, as a played character's
  ch.creation.locked = true;
  return ch;
}
const fund = (ch, n) => Engine.grantIP(ch, n, "test");

test("P12a 1: an Advantage costs its points × 10 a rank, every rank the same (0450, Q24)", () => {
  const ch = ipChar();
  const c = Engine.ipCost(ch, "advantage", "favored-skill");
  assert.deepEqual([c.ok, c.cost, c.from, c.to], [true, 50, 0, 1], "a new Favored Skill (5 points)");
  for (const rank of [1, 2, 3, 4]) {
    ch.advantages = [{ id: "favored-skill", rank, notes: "" }];
    const r = Engine.ipCost(ch, "advantage", "favored-skill");
    assert.deepEqual([r.ok, r.cost, r.from, r.to], [true, 50, rank, rank + 1], `rank ${rank} → ${rank + 1} costs what rank 0 → 1 does`);
  }
  ch.advantages = [{ id: "favored-skill", rank: 5, notes: "" }];
  assert.equal(Engine.ipCost(ch, "advantage", "favored-skill").ok, false, "past maxRank");
});

test("P12a 2: a Disadvantage comes off at its points × 10, a rank at a time, and gives no CP back (0450)", () => {
  const ch = ipChar();
  ch.disadvantages = [{ id: "minor-insanity", rank: 2, notes: "" }, { id: "pact", rank: 1, notes: "" }];
  fund(ch, 500);
  const granted = Engine.cp(ch).granted, budget = Engine.cp(ch).budget;
  assert.equal(Engine.ipCost(ch, "disadvantage", "pact").cost, 150, "Pact is 15 points");
  assert.equal(Engine.ipCost(ch, "disadvantage", "minor-insanity").cost, 10);
  assert.equal(Engine.spendIP(ch, "disadvantage", "minor-insanity").ok, true);
  assert.equal(ch.disadvantages.find(d => d.id === "minor-insanity").rank, 1);
  assert.equal(Engine.spendIP(ch, "disadvantage", "minor-insanity").ok, true);
  assert.equal(ch.disadvantages.some(d => d.id === "minor-insanity"), false, "removed at rank 1, not left at rank 0");
  assert.equal(Engine.ipState(ch).spent, 20);
  assert.equal(Engine.cp(ch).granted, granted - 2, "the points the Disadvantage granted are gone");
  assert.equal(Engine.cp(ch).budget, budget - 2, "and nothing was refunded");
  assert.equal(Engine.ipCost(ch, "disadvantage", "minor-insanity").ok, false, "no longer held");
});

test("P12a 4: lost SAN and a maimed Health Level come back at 5 and 25, never past the loss (0450)", () => {
  const ch = ipChar();
  fund(ch, 1000);
  ch.trackers.san.loss = 12;
  const c = Engine.ipCost(ch, "restore", "san", 10);
  assert.deepEqual([c.ok, c.cost, c.from, c.to], [true, 50, 12, 2]);
  assert.equal(Engine.spendIP(ch, "restore", "san", "", { count: 10 }).ok, true);
  assert.equal(ch.trackers.san.loss, 2);
  const before = JSON.stringify(ch);
  assert.equal(Engine.spendIP(ch, "restore", "san", "", { count: 3 }).ok, false, "3 with 2 lost");
  assert.equal(ch.trackers.san.loss, 2, "asserted on the tracker, not the view");
  assert.equal(JSON.stringify(ch), before, "a refusal wrote something");
  assert.equal(Engine.spendIP(ch, "restore", "san", "", { count: 2 }).ok, true);
  assert.equal(ch.trackers.san.loss, 0);
  assert.equal(Engine.ipCost(ch, "restore", "san", 1).ok, false, "nothing lost");
  ch.trackers.massiveLevels = 2; ch.trackers.witheringDamage = 3;
  const m = Engine.ipCost(ch, "restore", "massiveLevel");
  assert.deepEqual([m.ok, m.cost, m.from, m.to], [true, 25, 2, 1]);
  assert.equal(Engine.spendIP(ch, "restore", "massiveLevel").ok, true);
  assert.equal(ch.trackers.massiveLevels, 1);
  assert.equal(ch.trackers.witheringDamage, 3, "Withering isn't a maiming");
  Engine.spendIP(ch, "restore", "massiveLevel");
  assert.equal(Engine.ipCost(ch, "restore", "massiveLevel").ok, false, "0 Massive levels");
  assert.equal(ch.trackers.massiveLevels, 0);
});

test("P12a 9: a session's IP is 5 an hour, rounded up (0450: every hour of play earns 5 IP)", () => {
  assert.match(crb("0450_Advancement.md"), /every hour of play earns 5 IP/i, "the book's rate moved");
  assert.equal(D.ip.perHour, 5);
  assert.equal("perSession" in D.ip, false, "the flat 10 is gone from the data");
  // The rounding itself is the Session Log's, pinned through the UI in smoke-sheet-progression (P12a 12).
});

test("P12a 4b: a SAN loss past the maximum sells only the SAN that shows, and a fraction is floored", () => {
  const ch = ipChar();
  fund(ch, 1000);
  const max = Engine.sanState(ch).max;
  ch.trackers.san.loss = max + 20;                         // the stepper only floors the loss at 0
  assert.equal(Engine.sanState(ch).current, 0);
  assert.equal(Engine.ipCost(ch, "restore", "san", max + 1).ok, false, "SAN below zero was offered");
  assert.equal(Engine.ipCost(ch, "restore", "san", max).cost, max * 5);
  assert.equal(Engine.spendIP(ch, "restore", "san", "", { count: 10 }).ok, true);
  assert.equal(Engine.sanState(ch).current, 10, "10 IP-bought points must show as 10 SAN");
  const frac = ipChar(); fund(frac, 100);
  frac.trackers.san.loss = 2.5;
  assert.equal(Engine.ipCost(frac, "restore", "san", 1).from, 2, "a fractional loss is floored");
  assert.equal(Engine.spendIP(frac, "restore", "san", "", { count: 2 }).ok, true);
  assert.equal(Engine.sanState(frac).loss, 0);
});

// ── P12b: learning without IP (0530 Combat Maneuvers; 0450 Training; rulings-2026-10-10 Q29) ─────
function p12bChar(styles = []) {
  const ch = ipChar();
  ch.skills["martial-arts"] = { rank: 2, ipe: 0, selections: { style: styles.slice() } };
  ch.skills.handguns = { rank: 5, ipe: 0 };
  ch.houseRules.training = true;
  ch.trackers.credits.current = 2000;
  return ch;
}

test("P12b 3: a style's bonus lands on its maneuver's check, unarmed (0530, Q29)", () => {
  // 0530: "bonuses to each technique based on the style ... training in Commando gives a bonus to Stun, ... Krav Maga ... to Disarm."
  assert.match(crb("0530_Combat_Encounters.md"), /bonuses to each technique based on the style of Martial Arts/);
  assert.match(crb("0530_Combat_Encounters.md"), /Commando gives a bonus to Stun, whereas training in Krav Maga gives a bonus to Disarm/);
  const ch = p12bChar(["karate"]);
  const list = Engine.maneuverChecks(ch, "martial-arts");
  same(list.map(m => m.id), ["stun"], "Karate improves Stun only");
  assert.equal(list[0].bonus, 1);
  assert.equal(list[0].check, Engine.skillLine(ch, "martial-arts").checkBonus + 1);
  assert.equal(list[0].inflicts, D.conditions.find(c => c.id === "stunned").name);
  same(list[0].styles, ["Karate"]);
  same(Engine.maneuverChecks(p12bChar(["custom"]), "martial-arts"), [], "Custom Style has no number: its text is the GM's");
  same(Engine.maneuverChecks(p12bChar([]), "martial-arts"), []);
  same(Engine.maneuverChecks(ch, "handguns"), [], "a skill with no maneuvers");
});

test("P12b 5: every style names a real maneuver, and every maneuver a real Condition", () => {
  const ma = D.skills.find(s => s.id === "martial-arts");
  same(ma.maneuvers.map(m => m.id), ["grapple", "knockdown", "disarm", "stun"], "0530's four");
  for (const m of ma.maneuvers) assert.ok(D.conditions.some(c => c.id === m.inflicts), `${m.id} inflicts ${m.inflicts}`);
  for (const s of ma.styles) {
    if (s.id === "custom") { assert.equal(s.maneuver, undefined); assert.equal(s.amount, undefined); continue; }
    const m = ma.maneuvers.find(x => x.id === s.maneuver);
    assert.ok(m, `${s.id} names ${s.maneuver}`);
    assert.ok(Number.isInteger(s.amount) && s.amount > 0, `${s.id} amount`);
    assert.ok(s.bonus.toLowerCase().includes(m.name.toLowerCase()), `${s.id}: "${s.bonus}" names ${m.name}`);
    assert.ok(s.bonus.includes(`+${s.amount}`), `${s.id}: "${s.bonus}" carries its number`);
  }
  assert.ok(ma.picks.find(p => p.id === "style").addInPlay === true, "Martial Arts' style pick is learned in play");
  assert.ok(D.ip.training.stats.every(id => D.stats.some(s => s.id === id)), "Training's stats are Stats");
});

test("P12b 6: Training prices a rank at 10 × its IP cost, never past 9, and only for a skill already trained (0450)", () => {
  const ch = p12bChar();
  assert.match(crb("0450_Advancement.md"), /Training costs Çredits equal to 10 × the rank's IP cost/);
  assert.match(crb("0450_Advancement.md"), /Raising Handgun from 5 to 6 costs 25 IP, or Ç250/);
  const hg = Engine.trainingCost(ch, "handguns");
  same([hg.ok, hg.credits, hg.from, hg.to], [true, 250, 5, 6], "0450's own example");
  // A Focused skill's discount carries: rank 5 at 3 a rank is 15 IP, so Ç150.
  const foc = p12bChar(); foc.archetypeChoices.focusedSkillPicks = ["handguns"];
  if (!Engine.focusedSkillIds(foc).includes("handguns")) foc.archetypeChoices.specialization = ["mercenary"];
  assert.ok(Engine.focusedSkillIds(foc).includes("handguns"), "the fixture makes Handguns Focused");
  assert.equal(Engine.trainingCost(foc, "handguns").credits, 150);
  // Never past 9.
  ch.skills.handguns.rank = 9;
  assert.equal(Engine.trainingCost(ch, "handguns").ok, false, "9 → 10 is always bought");
  ch.skills.handguns.rank = 8;
  assert.equal(Engine.trainingCost(ch, "handguns").to, 9);
  // Only REF, INT or TECH.
  ch.skills.persuasion = { rank: 3, ipe: 0 }; ch.skills.athletics = { rank: 3, ipe: 0 };
  assert.equal(Engine.trainingCost(ch, "persuasion").ok, false, "MAG");
  assert.equal(Engine.trainingCost(ch, "athletics").ok, false, "BOD");
  ch.skills.investigation = { rank: 2, ipe: 0 }; ch.skills.cybernetics = { rank: 2, ipe: 0 };
  assert.equal(Engine.trainingCost(ch, "investigation").ok, true, "INT");
  assert.equal(Engine.trainingCost(ch, "cybernetics").ok, true, "TECH");
  assert.equal(Engine.trainingCost(ch, "investigation").teacher, false, "books will do");
  assert.equal(Engine.trainingCost(ch, "handguns").teacher, true, "a REF skill needs a teacher");
  // PQ3: an untrained skill is never offered. The same skill at rank 1 from a boost is priced at 10 × 5.
  assert.equal(Engine.trainingCost(ch, "stealth").ok, false, "untrained REF");
  assert.match(Engine.trainingCost(ch, "stealth").why, /isn't trained/i);
  ch.creation.boosts = [{ targetType: "skill", targetId: "stealth", times: 1 }];
  const boosted = Engine.trainingCost(ch, "stealth");
  same([boosted.ok, boosted.credits, boosted.from], [true, 50, 1], "any source counts: a boost");
  ch.skills.demolitions = { rank: 0, ipe: 1 };
  assert.equal(Engine.trainingCost(ch, "demolitions").ok, true, "any source counts: IP");
});

// ── P18: effects as data (Decision 231) ───────────────────────────────
// Every Advantage and Disadvantage says what it does in its `grants`: a
// computed row the engine applies, or a `rule` row the table applies. Both show
// as tags. A computed tag is written from the row's own numbers, so it can't
// drift from what the sheet does.
const P18_DEFS = [...D.advantages.map(d => ["advantage", d]), ...D.disadvantages.map(d => ["disadvantage", d])];
const ruleRows = d => (Array.isArray(d.grants) ? d.grants : []).filter(g => g && g.type === "rule");
// The engine runs in its own realm: read its lists as plain data.
const tagsOf = (kind, id, held = null) => JSON.parse(JSON.stringify(Engine.effectTagsFor(kind, id, held)));

test("P18 1: every Advantage and Disadvantage has an effect", () => {
  assert.equal(P18_DEFS.length, 87);
  const none = P18_DEFS.filter(([, d]) => !Array.isArray(d.grants) || !d.grants.length).map(([, d]) => d.id);
  assert.deepEqual(none, [], "an entry with no effect in its grants");
  const bad = P18_DEFS.flatMap(([, d]) => ruleRows(d).filter(g => typeof g.ruleText !== "string" || !g.ruleText.trim()).map(() => d.id));
  assert.deepEqual(bad, [], "a rule row with no ruleText");
});

test("P18 2: a computed tag is written by its numbers", () => {
  const text = (kind, id) => tagsOf(kind, id).filter(t => t.computed).map(t => t.text);
  assert.deepEqual(text("advantage", "hard-to-kill"), ["+1 max HP on every Health Level per rank"]);
  assert.deepEqual(text("advantage", "educated"), ["+10 Skill Points per rank"]);
  assert.deepEqual(text("advantage", "lucky"), ["LUCK: Boost the roll costs 1", "LUCK: Explode the roll costs 2"]);
  assert.deepEqual(text("disadvantage", "unlucky"), ["LUCK: Boost the roll costs 3", "LUCK: Explode the roll costs 4"]);
  assert.deepEqual(text("advantage", "long-lived"), ["A Minor Milestone at rank 1", "A Minor Milestone at rank 2", "A Major Milestone at rank 3"]);
  assert.deepEqual(text("disadvantage", "pain-sensitive"), ["Pain Level +1 once you're hurt"]);
  assert.match(text("advantage", "thick-skin")[0], /^\+1 Natural Armor per rank;/);
  // Change a row's number in the data and the tag follows it.
  const htk = D.advantages.find(a => a.id === "hard-to-kill").grants[0], was = htk.perRank;
  try { htk.perRank = 3; assert.deepEqual(text("advantage", "hard-to-kill"), ["+3 max HP on every Health Level per rank"]); }
  finally { htk.perRank = was; }
  const lucky = D.advantages.find(a => a.id === "lucky").grants[0], delta = lucky.delta;
  try { lucky.delta = -2; assert.equal(text("advantage", "lucky")[0], "LUCK: Boost the roll costs 0"); }
  finally { lucky.delta = delta; }
  // No computed tag in the data has an unfilled placeholder.
  for (const [kind, d] of P18_DEFS) for (const t of tagsOf(kind, d.id).filter(x => x.computed))
    assert.ok(!/[{}]|undefined|NaN/.test(t.text), `${d.id}: "${t.text}"`);
  // A computed row with no template stays a computed row of the engine's, and shows nothing.
  assert.equal(tagsOf("advantage", "educated").filter(t => t.computed).length, 1);
});

// The numbers a line of text writes, whole: "2,000" is one, "1d4" is a 1 and a 4.
const numbersIn = s => (String(s).match(/\d+(?:,\d{3})*/g) || []);
const hasNumber = (text, n) => new RegExp(String.raw`(?<![\d,])${n}(?!\d)`).test(text);
// Rows whose byRank value is arithmetic on the description rather than a number it prints.
const BYRANK_PINS = {
  // "+4 bonus damage ... Each Rank after the first gains an additional +2"
  bullseye: [4, 6, 8],
  // "2,000 Ç/per month for each rank"
  wealthy: ["2,000", "4,000", "6,000", "8,000"],
  // (Minor Insanity's "Each Rank reduces your Sanity by 5%" is a computed row now: P20a 1 pins 5 a rank.)
};

test("P18 3: a rule line's numbers are in its entry's own text", () => {
  const drift = [];
  for (const [, d] of P18_DEFS) for (const g of ruleRows(d)) {
    const lines = [g.ruleText, g.heldText, ...(Array.isArray(g.byRank) && !(d.id in BYRANK_PINS) ? g.byRank : [])].filter(s => s != null);
    for (const line of lines) for (const n of numbersIn(line))
      if (!hasNumber(d.description, n)) drift.push(`${d.id}: ${n} in "${String(line).slice(0, 60)}"`);
  }
  assert.deepEqual(drift, [], "a number a rule line writes that its description doesn't");
  for (const [id, want] of Object.entries(BYRANK_PINS)) {
    const d = P18_DEFS.map(x => x[1]).find(x => x.id === id), row = ruleRows(d).find(g => Array.isArray(g.byRank));
    assert.deepEqual([...row.byRank], want, id);
  }
});

test("P18 3b: a held entry's tags are its rank and picks", () => {
  const rule = (kind, id, held) => tagsOf(kind, id, held).filter(t => !t.computed && t.text !== "Creation only").map(t => t.text);
  const held = (rank, selections) => ({ rank, selections });
  assert.ok(rule("advantage", "bullseye", held(2))[0].includes("+6 damage"), rule("advantage", "bullseye", held(2)).join("|"));
  assert.ok(rule("advantage", "bullseye", held(1))[0].includes("+4 damage"));
  assert.ok(rule("advantage", "bullseye", held(3))[0].includes("+8 damage"));
  assert.equal(rule("advantage", "gun-master", held(3))[0], "Extra attacks per round with firearms, beam weapons included: 3.");
  // Common Sense is a computed Take X now (P19 6); Favored Skill is the rule row that still fills its pick.
  assert.equal(rule("advantage", "favored-skill", held(1, { skill: ["investigation"] }))[0], "Once per encounter, re-roll a botch on Investigation; no LUCK on the re-roll.");
  const general = ruleRows(D.advantages.find(a => a.id === "favored-skill"))[0].ruleText;
  assert.equal(rule("advantage", "favored-skill", held(1))[0], general, "no pick yet: the whole ruleText, not a half-filled line");
  assert.equal(rule("advantage", "favored-skill", held(1, { skill: [""] }))[0], general);
  assert.equal(rule("advantage", "danger-sense", held(4))[0], "Name the main visible threat.");
  // Every byRank has one value per rank.
  for (const [, d] of P18_DEFS) for (const g of ruleRows(d).filter(r => r.byRank !== undefined))
    assert.equal(g.byRank.length, d.maxRank, `${d.id}: byRank is not maxRank long`);
  // Past the table's end there is no value to fill: the general line.
  assert.equal(rule("advantage", "danger-sense", held(9))[0], ruleRows(D.advantages.find(a => a.id === "danger-sense"))[0].ruleText);
  // Not held: every rule row says its ruleText.
  for (const [kind, d] of P18_DEFS)
    assert.deepEqual(rule(kind, d.id, null), [...ruleRows(d).map(g => g.ruleText)], d.id);
  // Creation only is read off the entry's own flag, and comes last.
  const ll = tagsOf("advantage", "long-lived", held(1));
  assert.equal(ll[ll.length - 1].text, "Creation only");
  assert.equal(ll[ll.length - 1].computed, false);
  const def = D.advantages.find(a => a.id === "long-lived");
  try { def.creationOnly = false; assert.ok(!tagsOf("advantage", "long-lived", held(1)).some(t => t.text === "Creation only")); }
  finally { def.creationOnly = true; }
  assert.ok(!P18_DEFS.some(([kind, d]) => d.id !== "long-lived" && d.creationOnly && !tagsOf(kind, d.id).some(t => t.text === "Creation only")));
});

// ── P13: a held card's computed tags state its total (Decision 232) ──────
test("P13 11: a held card's computed tags state its total, and leave out the rows its rank doesn't reach", () => {
  const held = (rank, selections) => ({ rank, selections });
  const comp = (id, h, kind = "advantage") => tagsOf(kind, id, h).filter(t => t.computed).map(t => t.text);
  assert.deepEqual(comp("hard-to-kill", held(2)), ["+2 max HP on every Health Level"]);
  assert.deepEqual(comp("hard-to-kill", held(1)), ["+1 max HP on every Health Level"]);
  assert.deepEqual(comp("educated", held(3)), ["+30 Skill Points"]);
  assert.match(comp("thick-skin", held(2))[0], /^\+2 Natural Armor;/);
  // Natural and bought ranks sum before they get here (heldRow), so a total of 2 is 2.
  assert.deepEqual(comp("hard-to-kill", held(2, {})), ["+2 max HP on every Health Level"]);
  // Long-Lived: only the Milestones its rank reaches.
  assert.deepEqual(comp("long-lived", held(1)), ["A Minor Milestone at rank 1"]);
  assert.deepEqual(comp("long-lived", held(2)), ["A Minor Milestone at rank 1", "A Minor Milestone at rank 2"]);
  assert.equal(comp("long-lived", held(3)).length, 3);
  // A type with no held template reads its general line.
  assert.deepEqual(comp("lucky", held(1)), comp("lucky", null));
  assert.deepEqual(comp("pain-sensitive", held(1), "disadvantage"), comp("pain-sensitive", null, "disadvantage"));
  // Not held: every computed tag is P18 2's text, whatever the data holds for a held card.
  assert.deepEqual(comp("hard-to-kill", null), ["+1 max HP on every Health Level per rank"]);
  assert.equal(comp("long-lived", null).length, 3);
  // The total follows the data's perRank.
  const htk = D.advantages.find(a => a.id === "hard-to-kill").grants[0], was = htk.perRank;
  try {
    htk.perRank = 3;
    assert.deepEqual(comp("hard-to-kill", held(2)), ["+6 max HP on every Health Level"]);
    delete htk.perRank;                                   // no perRank: the general template, which also has nothing to fill
    assert.ok(!comp("hard-to-kill", held(2)).some(t => /NaN|undefined|\{/.test(t)), comp("hard-to-kill", held(2)).join("|"));
  } finally { htk.perRank = was; }
  // Every held total is perRank × rank, for every computed row in the data (Decision 232's Revisit if).
  for (const [kind, d] of P18_DEFS) for (const g of d.grants.filter(r => ["skillPoints", "hpPerLevel", "naturalArmor"].includes(r.type)))
    for (let r = 1; r <= d.maxRank; r++)
      assert.ok(comp(d.id, held(r), kind)[0].includes(`+${g.perRank * r} `), `${d.id} at ${r}`);
});

// ── P19: Skills learn from traits (Decision 233) ─────────────────────────
// A trait that changes a Skill's check: a number in the check, a kicker beside it, a Take X as its total, a die
// face as a mark. The book is the source for every "when" (0430, 0440, 0530).
const clone19 = ch => JSON.parse(JSON.stringify(ch));
const hold19 = (ch, kind, id, rank = 1, extra = {}) => { ch[kind].push({ id, rank, notes: "", ...extra }); return ch; };
const line19 = (ch, id) => JSON.parse(JSON.stringify(Engine.skillLine(ch, id)));
// A character with a spread of Skills, so a trait that moves one number can be shown to leave the rest.
function plain19() {
  const ch = subject();
  for (const [id, rank] of Object.entries({ stealth: 2, handguns: 4, dodge: 3, investigation: 3, "basic-tech": 2, awareness: 1, medical: 2, "combat-sense": 2, persuasion: 1, intuition: 2, "martial-arts": 2, survival: 1 }))
    ch.skills[id] = { rank, ipe: 0 };
  ch.skills["martial-arts"].selections = { style: ["karate"] };
  ch.weapons.push({ id: "vs4-ironside", notes: "" });
  return ch;
}
const checks19 = ch => Object.fromEntries(D.skills.map(s => [s.id, Engine.skillLine(ch, s.id).checkBonus]));
// Every Skill but these reads exactly as it did.
const onlyMoved19 = (before, after, moved, msg) => {
  for (const s of D.skills) if (!moved.includes(s.id)) assert.equal(after[s.id], before[s.id], `${msg}: ${s.id} moved`);
};
const withMarks19 = ch => D.skills.filter(s => line19(ch, s.id).marks.length).map(s => s.id);

test("book 0300/0430/0440/0530: the lines P19 computes say what the data says they do", () => {
  const adv = crb("0430_Advantages.md"), dis = crb("0440_Disadvantages.md"), com = crb("0530_Combat_Encounters.md"), core = crb("0300_Core_Mechanics.md");
  assert.match(adv, /Gain a \+3 synergy bonus to Stealth Skill Checks/);
  assert.match(adv, /Add an additional 1d4 Kicker Die whenever making a Medical Skill Check/);
  assert.match(adv, /Add an additional Kicker Die of 1d4 for Combat Sense Skill Checks/);
  assert.match(adv, /Take 6 on Survival Checks used to navigate/);
  assert.match(adv, /Take 8 on Intuition Skill Checks if you can perceive the aura of your target/);
  assert.match(adv, /This Advantage can't be used while you're in combat/);
  assert.match(adv, /When dealing with computers, vehicles, or technology, Take 6/);
  assert.match(adv, /Refined Skills explode on a natural 9 or 10\. The explosion is suppressed/);
  assert.match(dis, /Easily Hidden: \+3 Bonus to Stealth when trying to hide/);
  assert.match(dis, /Relevant skills this Disadvantage affects suffer a -2 penalty/);
  assert.match(dis, /With Awareness and Combat Sense Skill Checks you automatically fail if you roll a natural 2 or 3/);
  assert.match(dis, /Persuasion checks fail automatically on a natural 2 or 3/);
  assert.match(dis, /Any Intuition Skill Check to detect deceit fails automatically on a natural 2 or 3/);
  assert.match(dis, /If the check fails: For the rest of the encounter, Combat Sense Checks fail automatically on a natural 2 or 3/);
  assert.match(core, /treat the d10 result as X instead of rolling/);
  assert.match(core, /cannot explode and cannot botch/);
  // 0530 Visibility: the light levels and their attack penalties.
  assert.match(com, /Attackers take a \*\*-1 Penalty\*\* to attacks against targets in \*\*Dim\*\*/);
  assert.match(com, /Attackers take a \*\*-3 Penalty\*\* to attacks against targets in \*\*Dark\*\*/);
  assert.match(com, /Attackers take a \*\*-5 Penalty\*\* to attacks against targets in \*\*Blind\*\*/);
  same(D.visibility.map(v => [v.id, v.attack]), [["bright", 0], ["dim", -1], ["dark", -3], ["blind", -5]]);
});

test("P19 1: Ghost Step and Defect/Flaw are in the check, everywhere it's read", () => {
  const plain = plain19(), base = checks19(plain);
  // Neither held: a check is rank + stat + synergy + Pain + Conditions + form, and no trait is in it.
  for (const s of D.skills) {
    const l = line19(plain, s.id), b = l.breakdown;
    assert.equal(l.checkBonus, (l.trained ? b.rank + b.primary.value + b.synergy.mod : b.primary.value) + b.pain + b.conditions + b.form, s.id);
    assert.equal(b.traits, 0, `${s.id}: a trait in a plain check`);
    assert.deepEqual(b.traitParts, [], s.id);
  }
  // Ghost Step: Stealth +3, nothing else.
  const gs = hold19(clone19(plain), "advantages", "ghost-step");
  assert.equal(Engine.skillLine(gs, "stealth").checkBonus, base.stealth + 3);
  same(line19(gs, "stealth").breakdown.traitParts, [{ name: "Ghost Step", amount: 3 }]);
  assert.equal(line19(gs, "stealth").breakdown.traits, 3);
  onlyMoved19(base, checks19(gs), ["stealth"], "Ghost Step");
  // Untrained, it still counts (Ken, P19 review): 0420 says an untrained check is the Primary Stat, and Ghost Step's "+3 synergy bonus to Stealth Skill Checks" is on the check, not the training.
  // The two sentences the ruling read: if either moves, the ruling is worth asking again.
  assert.match(crb("0420_Skills.md"), /^- \*\*Untrained\*\*: Primary Stat\r?$/m);
  assert.match(crb("0430_Advantages.md"), /Gain a \+3 synergy bonus to Stealth Skill Checks/);
  const gu = hold19(subject(), "advantages", "ghost-step");
  assert.equal(Engine.skillLine(gu, "stealth").checkBonus, Engine.skillLine(subject(), "stealth").checkBonus + 3);
  // Defect/Flaw ×2 on Handguns and Dodge: each −2.
  const df = clone19(plain);
  df.disadvantages.push({ id: "defect-flaw", rank: 2, notes: "", selections: { skill: ["handguns", "dodge"], detail: "shaky hands" } });
  assert.equal(Engine.skillLine(df, "handguns").checkBonus, base.handguns - 2);
  assert.equal(Engine.skillLine(df, "dodge").checkBonus, base.dodge - 2);
  same(line19(df, "handguns").breakdown.traitParts, [{ name: "Defect/Flaw", amount: -2 }]);
  onlyMoved19(base, checks19(df), ["handguns", "dodge"], "Defect/Flaw");
  // The pick is cut to the rank: one rank, two picks stored, one Skill hurt.
  const one = clone19(plain);
  one.disadvantages.push({ id: "defect-flaw", rank: 1, notes: "", selections: { skill: ["handguns", "dodge"], detail: "x" } });
  assert.equal(Engine.skillLine(one, "handguns").checkBonus, base.handguns - 2);
  assert.equal(Engine.skillLine(one, "dodge").checkBonus, base.dodge, "a pick past the rank was applied");
  // …and a rank with no pick yet hurts nothing.
  const none = clone19(plain);
  none.disadvantages.push({ id: "defect-flaw", rank: 1, notes: "", selections: {} });
  same(checks19(none), base, "a Defect/Flaw with no Skill chosen moved a check");
  // The attack is the Skill's check: a pistol is 2 lower.
  assert.equal(Engine.weaponLine(plain, 0).attack, base.handguns);
  assert.equal(Engine.weaponLine(df, 0).attack, base.handguns - 2, "the attack didn't follow the check");
  // A maneuver's check is the Skill's, plus the style's bonus (Decision 229).
  const ma = clone19(plain);
  ma.disadvantages.push({ id: "defect-flaw", rank: 1, notes: "", selections: { skill: ["martial-arts"], detail: "x" } });
  const m0 = Engine.maneuverChecks(plain, "martial-arts")[0], m1 = Engine.maneuverChecks(ma, "martial-arts")[0];
  assert.equal(m1.check, m0.check - 2, "the maneuver's check didn't follow");
  assert.equal(m1.check, Engine.skillLine(ma, "martial-arts").checkBonus + m1.bonus);
  // What IP buys reads the rank, which never includes a trait.
  assert.equal(Engine.skillLine(gs, "stealth").rank, Engine.skillLine(plain, "stealth").rank);
});

test("P19 2: a kicker is on its Skill's row, never in the number", () => {
  const plain = plain19(), base = checks19(plain);
  const fm = hold19(clone19(plain), "advantages", "field-medic");
  same(line19(fm, "medical").kickers, [{ die: "1d4", from: "Field Medic" }]);
  assert.equal(Engine.skillLine(fm, "medical").checkBonus, base.medical, "a kicker is in the number");
  same(checks19(fm), base);
  for (const s of D.skills) if (s.id !== "medical") same(line19(fm, s.id).kickers, [], `${s.id} has a kicker`);
  const hv = hold19(clone19(plain), "advantages", "hyper-vigilance");
  same(line19(hv, "combat-sense").kickers, [{ die: "1d4", from: "Hyper Vigilance" }]);
  same(checks19(hv), base);
  // Both held: each on its own Skill.
  const both = hold19(clone19(fm), "advantages", "hyper-vigilance");
  same(line19(both, "medical").kickers.map(k => k.from), ["Field Medic"]);
  same(line19(both, "combat-sense").kickers.map(k => k.from), ["Hyper Vigilance"]);
  same(line19(plain, "medical").kickers, []);
});

test("P19 3: Take X shows its total, choose-first, with its when", () => {
  const plain = plain19();
  const cs = hold19(clone19(plain), "advantages", "common-sense", 1, { selections: { skill: ["investigation"] } });
  const l = line19(cs, "investigation");
  assert.equal(l.takeX.length, 1);
  assert.equal(l.takeX[0].x, 6); assert.equal(l.takeX[0].from, "Common Sense"); assert.equal(l.takeX[0].whenText, null);
  assert.equal(l.takeX[0].total, 6 + l.checkBonus, "Take X is X plus the check");
  assert.equal(l.takeX[0].text, `Take 6: ${6 + l.checkBonus} (choose before you roll)`);
  assert.equal(l.checkBonus, line19(plain, "investigation").checkBonus, "Take X is not in the number");
  // Pain comes off the total with the check.
  const hurt = clone19(cs); hurt.trackers.damage = 10;
  const lh = line19(hurt, "investigation");
  assert.ok(lh.breakdown.pain < 0, "the fixture isn't hurt");
  assert.equal(lh.takeX[0].total, 6 + lh.checkBonus);
  assert.equal(lh.takeX[0].total, l.takeX[0].total + lh.breakdown.pain, "Pain is not in Take X's total");
  // A Condition's roll penalty too.
  const cond = clone19(cs); cond.trackers.conditions.push({ id: "stunned" });
  const lc = line19(cond, "investigation");
  assert.equal(lc.takeX[0].total, 6 + lc.checkBonus);
  // Two ranks, two picks: each Skill; the rank cuts the picks (rank 1 with two stored names the first only).
  const two = hold19(clone19(plain), "advantages", "common-sense", 2, { selections: { skill: ["basic-tech", "awareness"] } });
  assert.equal(line19(two, "basic-tech").takeX.length, 1);
  assert.equal(line19(two, "awareness").takeX.length, 1);
  const cut = hold19(clone19(plain), "advantages", "common-sense", 1, { selections: { skill: ["basic-tech", "awareness"] } });
  assert.equal(line19(cut, "basic-tech").takeX.length, 1);
  assert.equal(line19(cut, "awareness").takeX.length, 0, "a pick past the rank was applied");
  // Basic Tech with Common Sense, Lightning Calculator and Machindo: three lines, the unconditional one first.
  const bt = clone19(plain);
  hold19(bt, "advantages", "machindo"); hold19(bt, "advantages", "lightning-calculator");
  hold19(bt, "advantages", "common-sense", 1, { selections: { skill: ["basic-tech"] } });
  const t = line19(bt, "basic-tech").takeX;
  same(t.map(x => x.from), ["Common Sense", "Machindo", "Lightning Calculator"]);
  same(t.map(x => x.whenText), [null, "with technology", "not in combat"]);
  assert.ok(t.every(x => x.x === 6 && x.total === 6 + line19(bt, "basic-tech").checkBonus));
  assert.match(t[1].text, /^Take 6: \d+ with technology \(choose before you roll\)$/);
  // The other holders, each with its when and its own X.
  const rest = clone19(plain);
  for (const id of ["sense-of-direction", "aura-sight"]) hold19(rest, "advantages", id);
  const sv = line19(rest, "survival").takeX[0], ins = line19(rest, "intuition").takeX[0];
  same([sv.x, sv.whenText, sv.from], [6, "to navigate", "Sense of Direction"]);
  same([ins.x, ins.whenText, ins.from], [8, "when you can see their aura", "Aura Sight"]);
  same(line19(rest, "stealth").takeX, []);
});

test("P19 4: the die faces are marked on the Skills they touch", () => {
  const plain = plain19(), base = checks19(plain);
  const marksOf = (ch, id) => line19(ch, id).marks.map(m => [m.kind, m.from]);
  const di = hold19(clone19(plain), "disadvantages", "distractable");
  for (const s of D.skills) same(marksOf(di, s.id), ["awareness", "combat-sense"].includes(s.id) ? [["failOn", "Distractable"]] : [], s.id);
  assert.equal(line19(di, "awareness").marks[0].text, "Fails on a natural 2 or 3 (a 1 still botches)");
  same(checks19(di), base, "a die-face rule moved a number");
  const ss = hold19(clone19(plain), "disadvantages", "social-stigma");
  same(withMarks19(ss), ["persuasion"]);
  const gu = hold19(clone19(plain), "disadvantages", "gullible");
  const gm = line19(gu, "intuition").marks;
  same(gm.map(m => [m.kind, m.whenText]), [["failOn", "spotting a lie, unless it's preposterous"]]);
  assert.match(gm[0].text, /spotting a lie, unless it's preposterous/);
  assert.match(gm[0].text, /1 still botches/);
  const bl = hold19(clone19(plain), "disadvantages", "blood-lust");
  same(marksOf(bl, "combat-sense"), [["failOn", "Blood Lust"]]);
  assert.match(line19(bl, "combat-sense").marks[0].text, /after you fail first blood's Sanity Check, for the encounter/);
  // Distractable and Blood Lust on Combat Sense: both marks.
  const both = hold19(clone19(bl), "disadvantages", "distractable");
  same(marksOf(both, "combat-sense").map(m => m[1]).sort(), ["Blood Lust", "Distractable"]);
  // Refined Skill: ranks over a natural and a bought row; the picks cut to the rank.
  const rs = clone19(plain);
  rs.advantages.push({ id: "refined-skill", rank: 1, notes: "", source: "natural" }, { id: "refined-skill", rank: 1, notes: "", selections: { skill: ["stealth", "medical", "dodge"] } });
  same(withMarks19(rs), ["medical", "stealth"], "two ranks, two Skills");
  assert.equal(line19(rs, "stealth").marks[0].text, "Explodes on a natural 9 or 10");
  assert.equal(line19(rs, "medical").marks[0].kind, "explodeOn");
  same(checks19(rs), base);
  // Rank 1 with two picks stored: the first only.
  const r1 = hold19(clone19(plain), "advantages", "refined-skill", 1, { selections: { skill: ["stealth", "medical"] } });
  same(withMarks19(r1), ["stealth"], "a pick past the rank was applied");
});

test("P19 5: Night Vision names the light levels it cancels, from the data", () => {
  const nv = hold19(plain19(), "advantages", "night-vision");
  const aw = line19(nv, "awareness").marks;
  same(aw.map(m => [m.kind, m.from, m.text]), [["visibility", "Night Vision", "No Dim or Dark penalty on visual checks"]]);
  same(withMarks19(nv), ["awareness"]);
  same(Engine.attackNotes(nv), [{ from: "Night Vision", text: "Dim −1 and Dark −3 don't apply to your attacks" }]);
  same(Engine.attackNotes(plain19()), []);
  // The numbers are the table's: change one and the line follows.
  const dim = D.visibility.find(v => v.id === "dim"), was = dim.attack;
  try { dim.attack = -2; assert.match(Engine.attackNotes(nv)[0].text, /^Dim −2 and Dark −3 /); }
  finally { dim.attack = was; }
  // Blind isn't cancelled.
  assert.ok(!/Blind/.test(Engine.attackNotes(nv)[0].text));
});

test("P19 6: the tags are computed now, held and unheld", () => {
  const comp = (kind, id, h = null) => tagsOf(kind, id, h).filter(t => t.computed).map(t => t.text);
  const rule = (kind, id) => tagsOf(kind, id).filter(t => !t.computed).map(t => t.text);
  const held = (rank, selections) => ({ rank, selections });
  same(comp("advantage", "ghost-step"), ["+3 on checks with Stealth"]);
  same(comp("disadvantage", "defect-flaw"), ["−2 on checks with the Skill you choose"]);
  same(comp("disadvantage", "defect-flaw", held(2, { skill: ["handguns", "dodge"] })), ["−2 on checks with Handguns, Dodge"]);
  same(comp("disadvantage", "defect-flaw", held(1, { skill: ["handguns", "dodge"] })), ["−2 on checks with Handguns"], "the rank cuts the picks");
  same(comp("disadvantage", "defect-flaw", held(1, { skill: [] })), ["−2 on checks with the Skill you choose"], "no pick yet: the general line");
  same(comp("disadvantage", "dwarf").slice(2), ["+3 on checks with Stealth when hiding"]);   // Dwarf's two caps come first (P20a 8)
  same(comp("advantage", "field-medic"), ["+1d4 Kicker Die on Medical checks"]);
  same(comp("advantage", "hyper-vigilance"), ["+1d4 Kicker Die on Combat Sense checks"]);
  same(comp("advantage", "common-sense"), ["Take 6 on the Skill you choose; choose before you roll"]);
  same(comp("advantage", "common-sense", held(1, { skill: ["investigation"] })), ["Take 6 on Investigation; choose before you roll"]);
  assert.match(comp("advantage", "lightning-calculator")[0], /^Take 6 on Programming, Basic Tech, Engineering not in combat; choose before you roll$/);
  assert.match(comp("advantage", "machindo")[0], /with technology/);
  assert.match(comp("advantage", "sense-of-direction")[0], /^Take 6 on Survival to navigate/);
  assert.match(comp("advantage", "aura-sight")[0], /^Take 8 on Intuition when you can see their aura/);
  same(comp("disadvantage", "distractable"), ["Awareness, Combat Sense checks fail on a natural 2 or 3 (a 1 still botches)"]);
  assert.match(comp("disadvantage", "social-stigma")[0], /^Persuasion checks fail on a natural 2 or 3/);
  assert.match(comp("disadvantage", "gullible")[0], /spotting a lie, unless it's preposterous/);
  assert.match(comp("disadvantage", "blood-lust")[1], /after you fail first blood's Sanity Check, for the encounter/);   // [0] is its Sanity cut (P20a 8)
  same(comp("advantage", "refined-skill"), ["Explodes on a natural 9 or 10: the Skill you choose"]);
  same(comp("advantage", "refined-skill", held(2, { skill: ["stealth", "medical"] })), ["Explodes on a natural 9 or 10: Stealth, Medical"]);
  same(comp("advantage", "night-vision"), ["Dim −1 and Dark −3 don't apply to your attacks", "No Dim or Dark penalty on visual Awareness checks"]);
  // What stays a rule row, still says its words.
  same(rule("disadvantage", "dwarf"), ["At most 3'6\" tall."]);
  same(rule("advantage", "refined-skill"), ["Not on a Combat Cunning stunt."]);
  same(rule("advantage", "lightning-calculator"), ["Anyone you help with a TECH Skill gets +1. Not in combat."]);
  same(rule("advantage", "machindo"), ["INT and TECH Essence Checks: TN −1 (to a minimum of 1)."]);
  same(rule("advantage", "sense-of-direction"), ["Always know the cardinal directions."]);
  same(rule("advantage", "field-medic"), ["Stacks with other kickers."]);
  same(rule("disadvantage", "blood-lust"), ["First blood in an encounter: a Sanity Check. Pass, and it's off until the next one."]);
  // Every entry P19 computes reads at least one chip, and none has an unfilled placeholder.
  const ids = ["ghost-step", "defect-flaw", "dwarf", "field-medic", "hyper-vigilance", "common-sense", "lightning-calculator", "machindo", "sense-of-direction", "aura-sight", "distractable", "social-stigma", "gullible", "blood-lust", "refined-skill", "night-vision"];
  assert.equal(ids.length, 16);
  for (const [kind, d] of P18_DEFS.filter(([, d]) => ids.includes(d.id))) {
    assert.ok(comp(kind, d.id).length >= 1, `${d.id}: no computed tag`);
    for (const h of [null, held(d.maxRank, { skill: ["stealth", "medical", "dodge", "handguns"] })])
      for (const t of comp(kind, d.id, h)) assert.ok(!/[{}]|undefined|NaN/.test(t), `${d.id}: "${t}"`);
  }
  // Every one of the 16 is a computed row now, and only these 16 use the new types.
  const types = new Set(["checkMod", "kicker", "takeX", "failOn", "explodeOn", "visibility"]);
  for (const id of ids) assert.ok(P18_DEFS.find(([, d]) => d.id === id)[1].grants.some(g => types.has(g.type)), `${id} is still a rule row`);
  const users = P18_DEFS.filter(([, d]) => d.grants.some(g => types.has(g.type))).map(([, d]) => d.id).sort();
  same(users, [...ids].sort());
});

test("P19 7: a conditional row is a mark, never a number", () => {
  const plain = plain19(), base = checks19(plain);
  const dw = hold19(clone19(plain), "disadvantages", "dwarf");
  same(checks19(dw), base, "Dwarf's +3 is in a Stealth check");
  const l = line19(dw, "stealth");
  assert.equal(l.breakdown.traits, 0);
  same(l.marks.map(m => [m.kind, m.text, m.from, m.whenText]), [["checkMod", "+3 when hiding", "Dwarf", "when hiding"]]);
  // The guard's mutant: take the when away and the row is a number.
  const row = D.disadvantages.find(d => d.id === "dwarf").grants.find(g => g.type === "checkMod"), was = row.whenText;
  try {
    delete row.whenText;
    assert.equal(Engine.skillLine(dw, "stealth").checkBonus, base.stealth + 3);
    same(line19(dw, "stealth").marks, []);
  } finally { row.whenText = was; }
  same(checks19(dw), base);
});

// ── P20a: numbers at creation (Decision 235) ─────────────────────────────
// A Sanity cut, Arcane Fortitude's +2 TOL, a trait's cap on a Basic Stat, and Wealthy's Ç10,000: computed, so every
// reader follows. The book is the source for every number (0440, 0430, 0411).
const sub20 = mut => { const ch = subject(); if (mut) mut(ch); return ch; };
const san20 = ch => Engine.derived(ch).SAN;
const emp20 = n => ch => { ch.stats.EMP.base = n; };
const arc20 = (spec, mut) => {
  const ch = subject();
  ch.identity.archetype = "arcanist";
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 5;
  if (spec) ch.archetypeChoices.specialization = [spec];
  if (mut) mut(ch);
  return ch;
};
const lock20 = ch => { ch.creation.locked = true; return ch; };
const max20 = (ch, id) => JSON.parse(JSON.stringify(Engine.statMax(ch, id)));

test("book 0440/0430/0411: the numbers P20a computes are the book's", () => {
  const dis = crb("0440_Disadvantages.md"), adv = crb("0430_Advantages.md");
  // A Disadvantage's section runs from its **Name** line to the next one.
  const section = name => { const at = dis.indexOf(`**${name}**`); assert.ok(at >= 0, name); const rest = dis.slice(at + 4), end = rest.search(/\n\n\*\*(?!\d)[^*\n]+\*\*\n/); return end < 0 ? rest : rest.slice(0, end); };
  assert.match(section("Berserker"), /Sanity is reduced by 15%/);
  assert.match(section("Blood Lust"), /Sanity is reduced by 5%/);
  assert.match(section("Fanatic"), /Sanity is reduced by 15%/);
  assert.match(section("Hallucinations"), /Sanity is reduced by 25%/);
  assert.match(section("Minor Insanity"), /Each Rank reduces your Sanity by 5%/);
  for (const [name, lines] of [["Age", ["BOD Max: 5", "REF Max: 6", "MOB Max: 6"]], ["Dwarf", ["BOD Max: 8", "MOB Max: 3"]], ["Giant", ["BOD Max: 11", "REF Max: 5", "MOB Max: 8"]]])
    for (const l of lines) assert.ok(section(name).includes(l), `${name}: ${l}`);
  assert.match(adv.slice(adv.indexOf("**Wealthy**")), /Start with an additional 10,000 Ç/);
  assert.match(crb("0411_Arcanist.md"), /\*\*Arcane Fortitude\*\*:[^\n]*\n\s*\*Benefit:\* Gain \+2 to TOL/);
  // The rows say what the book says.
  const rows = (list, id, type) => list.find(d => d.id === id).grants.filter(g => g.type === type);
  same(["blood-lust", "berserker", "fanatic", "hallucinations"].map(id => rows(D.disadvantages, id, "derivedMod").map(g => [g.stat, g.amount])), [[["SAN", -5]], [["SAN", -15]], [["SAN", -15]], [["SAN", -25]]]);
  same(rows(D.disadvantages, "minor-insanity", "derivedMod").map(g => [g.stat, g.perRank]), [["SAN", -5]]);
  same(rows(D.disadvantages, "age", "statMax").map(g => [g.stat, g.max]), [["BOD", 5], ["REF", 6], ["MOB", 6]]);
  same(rows(D.disadvantages, "dwarf", "statMax").map(g => [g.stat, g.max]), [["BOD", 8], ["MOB", 3]]);
  same(rows(D.disadvantages, "giant", "statMax").map(g => [g.stat, g.max]), [["BOD", 11], ["REF", 5], ["MOB", 8]]);
  same(rows(D.advantages, "wealthy", "startingCredits").map(g => g.amount), [10000]);
  const af = D.archetypes.find(a => a.id === "arcanist").specialization.options.find(o => o.id === "arcane-fortitude");
  same(af.grants.map(g => [g.type, g.stat, g.amount]), [["derivedMod", "TOL", 2]]);
});

test("P20a 1: a Sanity cut comes off max SAN, everywhere it's read", () => {
  const plain = sub20(emp20(6));
  assert.equal(san20(plain), 60);
  const bz = hold19(sub20(emp20(6)), "disadvantages", "berserker");
  assert.equal(san20(bz), 45);
  assert.equal(Engine.sanState(bz).max, 45);
  assert.equal(Engine.sanState(bz).current, 45);
  same(Engine.derivedParts(bz, "SAN"), [{ name: "Berserker", amount: -15 }]);
  same(Engine.derivedParts(plain, "SAN"), []);
  // Minor Insanity, a rank at a time.
  same([1, 2, 3, 4, 5].map(rank => san20(hold19(sub20(emp20(6)), "disadvantages", "minor-insanity", rank))), [55, 50, 45, 40, 35]);
  same(Engine.derivedParts(hold19(sub20(), "disadvantages", "minor-insanity", 3), "SAN"), [{ name: "Minor Insanity", amount: -15 }]);
  // The cut comes after the cap of 95 (PQ7): EMP 10 is 95, and Blood Lust takes it to 90.
  assert.equal(san20(sub20(emp20(10))), 95);
  assert.equal(san20(hold19(sub20(emp20(10)), "disadvantages", "blood-lust")), 90);
  // …and after the floor of 10, with max SAN never below 1 (PQ6).
  const low = hold19(hold19(sub20(emp20(1)), "disadvantages", "berserker"), "disadvantages", "hallucinations");
  assert.equal(san20(low), 1);
  assert.equal(Engine.sanState(low).max, 1);
  assert.equal(san20(hold19(sub20(emp20(1)), "disadvantages", "blood-lust")), 5, "EMP 1 is 10, less 5");
  // A manual adjustment still reads after the cut.
  const adj = hold19(sub20(emp20(6)), "disadvantages", "berserker");
  adj.trackers.adjustments.push({ target: "SAN", amount: 3, note: "x" });
  assert.equal(san20(adj), 48);
  // Two cuts add.
  assert.equal(san20(hold19(hold19(sub20(emp20(6)), "disadvantages", "berserker"), "disadvantages", "blood-lust")), 40);
  // Lost SAN is taken from the cut max, and a rank bought off gives back its 5 (Decision 227).
  const ip = lock20(hold19(sub20(emp20(6)), "disadvantages", "minor-insanity", 3));
  assert.equal(Engine.sanState(ip).max, 45);
  fund(ip, 500);
  assert.equal(Engine.spendIP(ip, "disadvantage", "minor-insanity").ok, true);
  assert.equal(Engine.sanState(ip).max, 50, "a rank bought off raises the max by 5");
  ip.trackers.san.loss = 80;
  assert.equal(Engine.sanState(ip).current, 0);
  // None held: SAN is the formula for every EMP, as on main.
  for (let emp = 1; emp <= 10; emp++) assert.equal(san20(sub20(emp20(emp))), Math.min(95, Math.max(10, emp * 10)), `EMP ${emp}`);
});

test("P20a 2: Arcane Fortitude adds 2 to TOL", () => {
  const other = arc20("unshakable-mind"), none = arc20(null), af = arc20("arcane-fortitude");
  assert.equal(Engine.derived(af).TOL, Engine.derived(none).TOL + 2);
  assert.equal(Engine.derived(other).TOL, Engine.derived(none).TOL, "another Aberration adds nothing");
  same(Engine.derivedParts(af, "TOL"), [{ name: "Arcane Fortitude", amount: 2 }]);
  // Its benefit text is still what the picker shows.
  assert.equal(D.archetypes.find(a => a.id === "arcanist").specialization.options.find(o => o.id === "arcane-fortitude").benefit, "Gain +2 to TOL.");
  // Every reader of TOL follows: the starting spells count is TOL + the roll.
  for (const ch of [af, none]) ch.archetypeChoices.rolls.startingSpells = 2;
  assert.equal(Engine.startingSpells(af).count, Engine.startingSpells(none).count + 2);
  assert.equal(Engine.startingSpells(af).base, Engine.derived(af).TOL);
  // Only the one stat moved.
  for (const k of ["WILL", "SAN"]) assert.equal(Engine.derived(af)[k], Engine.derived(none)[k], k);
});

test("P20a 3: a trait's cap binds at creation, and only a lift binds in play", () => {
  const one = (id, mut) => hold19(sub20(mut), "disadvantages", id);
  // Nothing held: statRules.max everywhere.
  for (const s of D.stats) same(max20(sub20(), s.id), { max: 10, by: null });
  same(max20(lock20(sub20()), "BOD"), { max: 10, by: null });
  // Dwarf, unlocked.
  const dw = one("dwarf", ch => { ch.stats.MOB.base = 3; });
  same(max20(dw, "MOB"), { max: 3, by: "Dwarf" });
  same(max20(dw, "BOD"), { max: 8, by: "Dwarf" });
  same(max20(dw, "REF"), { max: 10, by: null });
  const boost = Engine.canBoost(dw, "stat", "MOB");
  assert.deepEqual([boost.ok, boost.why], [false, "Max 3 (Dwarf)."]);
  assert.equal(Engine.canBoost(dw, "stat", "REF").ok, true);
  // Locked, a lower cap is gone (PQ2): IP raises MOB 3 to 4, and Honed's MOB option is on.
  const dl = lock20(one("dwarf", ch => { ch.stats.MOB.base = 3; }));
  same(max20(dl, "MOB"), { max: 10, by: null });
  fund(dl, 500);
  same(["ok", "from", "to"].map(k => Engine.ipCost(dl, "stat", "MOB")[k]), [true, 3, 4]);
  assert.equal(Engine.spendIP(dl, "stat", "MOB").ok, true);
  assert.equal(Engine.statValue(dl, "MOB"), 4);
  assert.equal(Engine.minorChoice(dl, "honed").options.find(o => o.id === "MOB").off, "");
  assert.equal(Engine.minorChoice(dw, "honed").options.find(o => o.id === "MOB").off, "Stat cap 3.", "unlocked, the cap is still the cap");
  // Giant: BOD reaches 11 through IP, and not past it.
  const gi = lock20(one("giant", ch => { ch.stats.BOD.base = 10; }));
  same(max20(gi, "BOD"), { max: 11, by: "Giant" });
  same(max20(gi, "REF"), { max: 10, by: null });
  fund(gi, 500);
  assert.equal(Engine.spendIP(gi, "stat", "BOD").ok, true);
  assert.equal(Engine.statValue(gi, "BOD"), 11);
  assert.equal(Engine.ipCost(gi, "stat", "BOD").ok, false);
  assert.equal(Engine.minorChoice(gi, "honed").options.find(o => o.id === "BOD").off, "Stat cap 11.");
  // Unlocked, a Giant's BOD, REF and MOB are 11, 5 and 8.
  same(["BOD", "REF", "MOB"].map(s => max20(one("giant"), s)), [{ max: 11, by: "Giant" }, { max: 5, by: "Giant" }, { max: 8, by: "Giant" }]);
  // Two caps: the lowest wins (PQ4). Age + Giant, BOD 5.
  const ag = hold19(one("age"), "disadvantages", "giant");
  same(max20(ag, "BOD"), { max: 5, by: "Age" });
  same(max20(ag, "REF"), { max: 5, by: "Giant" });
  same(max20(hold19(one("age"), "disadvantages", "dwarf"), "MOB"), { max: 3, by: "Dwarf" });
  // Focus points stop at a trait's cap (PQ3).
  const fc = arc20(null, ch => { hold19(ch, "disadvantages", "dwarf"); ch.stats.MOB.base = 2; ch.archetypeChoices.focusAllocation = { MOB: 1 }; });
  assert.equal(Engine.statValue(fc, "MOB"), 3);
  assert.equal(Engine.canBoost(fc, "stat", "MOB").ok, false);
  assert.equal(Engine.statAtCap(fc, "MOB", true), true, "a Focus point went past a trait's cap");
  assert.equal(Engine.statAtCap(sub20(ch => { ch.stats.REF.base = 10; }), "REF", true), false, "a Focus point stopped at the human maximum");
  // The creation pools read it: nothing is spendable on stats all at the cap.
  assert.equal(Engine.spendable(sub20(ch => { for (const s of D.stats) ch.stats[s.id].base = 10; }), "statBonus"), false);
  // …and under a trait's cap: a Dwarf with every stat at its own cap has nothing left to spend a bonus or a Stat Point on.
  const capped = sub20(ch => { for (const s of D.stats) ch.stats[s.id].base = 10; ch.stats.BOD.base = 8; ch.stats.MOB.base = 3; ch.creation.rolls.statPoints = 99; });
  hold19(capped, "disadvantages", "dwarf");
  assert.equal(Engine.spendable(capped, "statBonus"), false, "a Dwarf at its caps still has bonus to place");
  assert.equal(Engine.spendable(capped, "stats"), false, "a Dwarf at its caps still has Stat Points to place");
  capped.stats.MOB.base = 2;
  assert.equal(Engine.spendable(capped, "statBonus"), true);
  // statMax is the one cap: nothing else reads statRules.max.
  const src = n => readFileSync(join(ROOT, n), "utf8");
  const readers = file => src(file).split("\n").map((l, i) => [i + 1, l]).filter(([, l]) => !/^\s*(\/\/|\*)/.test(l) && /statRules\.max/.test(l));
  const inEngine = readers("src/engine/engine.js");
  assert.equal(inEngine.length, 1, "only statMax reads statRules.max: " + inEngine.map(([n]) => n));
  assert.match(inEngine[0][1], /const base = D\(\)\.statRules\.max, none/);
  for (const f of ["src/ui/wizard.js", "src/ui/sheet.js", "src/ui/shared.js", "src/ui/app.js", "src/ui/gm.js"]) assert.deepEqual(readers(f), [], `${f} reads statRules.max`);
});

test("P20a 4: a cap already passed refuses the lock", () => {
  const dw = hold19(sub20(ch => { ch.stats.MOB.base = 5; ch.stats.BOD.base = 8; }), "disadvantages", "dwarf");
  const errs = ch => Engine.validate("stats", ch).filter(i => i.level === "error").map(i => i.msg);
  same(errs(dw), ["MOB is 5, over Dwarf's max of 3. Lower it on the Stats step."]);
  assert.ok(Engine.validate("review", dw).some(i => i.level === "error" && /MOB is 5, over Dwarf's max of 3/.test(i.msg)), "the lock isn't refused");
  assert.equal(Engine.statValue(dw, "MOB"), 5, "the engine lowered a stat");
  assert.equal(dw.stats.MOB.base, 5);
  dw.stats.MOB.base = 3;
  same(errs(dw), []);
  assert.ok(!Engine.validate("review", dw).some(i => /over Dwarf/.test(i.msg)));
  // A Focus point over the cap counts the same (it's the stat's value), and the error is on the step that holds it:
  // the Stats step can't clear it (Reviewer, P20a), so Continue there isn't held and the Archetype step says where.
  const fc = arc20(null, ch => { hold19(ch, "disadvantages", "dwarf"); ch.stats.MOB.base = 1; ch.archetypeChoices.focusAllocation = { MOB: 3 }; });
  same(errs(fc), []);
  same(Engine.validate("archetype", fc).filter(i => /over Dwarf/.test(i.msg)).map(i => i.msg), ["MOB is 4, over Dwarf's max of 3. Lower it on the Archetype step."]);
  assert.ok(Engine.validate("review", fc).some(i => i.level === "error" && /Lower it on the Archetype step/.test(i.msg)), "the lock isn't refused");
  // A CP boost over the cap: the Character Points step.
  const bc = sub20(ch => { hold19(ch, "disadvantages", "dwarf"); ch.stats.MOB.base = 3; ch.creation.boosts.push({ targetType: "stat", targetId: "MOB", times: 1 }); });
  same(errs(bc), []);
  same(Engine.validate("character-points", bc).filter(i => i.level === "error").map(i => i.msg), ["MOB is 4, over Dwarf's max of 3. Lower it on the Character Points step."]);
  assert.ok(Engine.validate("review", bc).some(i => i.level === "error" && /Lower it on the Character Points step/.test(i.msg)));
  // Each error is said once, on one step.
  for (const ch of [dw, fc, bc]) assert.ok(["stats", "archetype", "character-points"].reduce((n, s) => n + Engine.validate(s, ch).filter(i => /over Dwarf/.test(i.msg)).length, 0) <= 1);
  // Locked, the cap is gone and nothing is said.
  assert.ok(!Engine.validate("stats", lock20(hold19(sub20(ch => { ch.stats.MOB.base = 5; }), "disadvantages", "dwarf"))).some(i => /over/.test(i.msg)));
  // The CP card's line is the engine's own, for the same stat.
  assert.equal(Engine.statOverCap(hold19(sub20(ch => { ch.stats.MOB.base = 5; }), "disadvantages", "dwarf"), "dwarf"), "MOB is 5, over Dwarf's max of 3.");
  assert.equal(Engine.statOverCap(sub20(), "dwarf"), "");
});

test("P20a 6: Dwarf and Giant exclude each other", () => {
  const dwarf = hold19(sub20(), "disadvantages", "dwarf"), giant = hold19(sub20(), "disadvantages", "giant");
  const lock = (ch, id) => JSON.parse(JSON.stringify(Engine.optionLock(ch, "disadvantage", id)));
  same(lock(dwarf, "giant"), { locked: true, by: "Dwarf" });
  same(lock(giant, "dwarf"), { locked: true, by: "Giant" });
  same(lock(sub20(), "giant"), { locked: false, by: null });
  same(D.disadvantages.filter(d => (d.excludes || []).length).map(d => [d.id, [...d.excludes]]), [["dwarf", ["giant"]]]);
  assert.ok(Engine.validate("character-points", hold19(hold19(sub20(), "disadvantages", "dwarf"), "disadvantages", "giant")).some(i => i.level === "error" && /can't be taken together/.test(i.msg)));
});

test("P20a 7: Wealthy's Ç10,000 is paid once, at lock", () => {
  const mult = D.powerLevels[0].startingCredits.multiplier;
  const mk = (rank, locked) => { const ch = sub20(c => { c.creation.rolls.credits = 6; }); if (rank) hold19(ch, "advantages", "wealthy", rank); ch.creation.locked = locked; return ch; };
  same(Engine.startingCredits(mk(0)), { roll: 6, multiplier: mult, bonus: [], total: 6 * mult });
  const w = Engine.startingCredits(mk(1));
  same(w.bonus, [{ name: "Wealthy", amount: 10000 }]);
  assert.equal(w.total, 6 * mult + 10000);
  assert.equal(Engine.startingCredits(mk(3)).total, 6 * mult + 10000, "rank 3 is still +10,000");
  assert.equal(Engine.startingCredits(sub20()).total, null, "no roll: no total");
  // The lock click seeds it, once.
  const at = Engine.buildExport(mk(3, true), { lock: true });
  assert.equal(at.trackers.credits.current, 6 * mult + 10000);
  // After the lock, an export seeds nothing: the sheet holds what it holds.
  assert.equal(Engine.buildExport(JSON.parse(JSON.stringify(at))).trackers.credits.current, 6 * mult + 10000);
  // Bought by IP after the lock: no change (PQ8).
  const played = Engine.migrate(JSON.parse(JSON.stringify(mk(0, true))));
  played.trackers.credits.current = 6 * mult;
  fund(played, 500);
  assert.equal(Engine.spendIP(played, "advantage", "wealthy").ok, true);
  assert.equal(Engine.buildExport(played).trackers.credits.current, 6 * mult, "Wealthy bought in play paid the starting bonus");
  // A ledger with entries: no reseed, even at the lock.
  const led = mk(1, true); led.trackers.credits.ledger.push({ date: "2026-10-01T00:00:00.000Z", amount: 5, note: "x" }); led.trackers.credits.current = 5;
  assert.equal(Engine.buildExport(led, { lock: true }).trackers.credits.current, 5);
  // Not locked, an export still shows the sum (the wizard's Export button).
  assert.equal(Engine.buildExport(mk(1, false)).trackers.credits.current, 6 * mult + 10000);
  // Nothing was saved for it: the same keys as a character with no Wealthy.
  same(Object.keys(at.trackers.credits), Object.keys(Engine.buildExport(mk(0, true), { lock: true }).trackers.credits));
});

test("P20a 8: the tags are computed, held and unheld", () => {
  const comp = (kind, id, h = null) => tagsOf(kind, id, h).filter(t => t.computed).map(t => t.text);
  const rule = (kind, id) => tagsOf(kind, id).filter(t => !t.computed).map(t => t.text);
  const held = (rank, selections) => ({ rank, selections });
  assert.equal(comp("disadvantage", "blood-lust")[0], "Max SAN −5");
  same(comp("disadvantage", "berserker"), ["Max SAN −15"]);
  same(comp("disadvantage", "fanatic"), ["Max SAN −15"]);
  same(comp("disadvantage", "hallucinations"), ["Max SAN −25"]);
  same(comp("disadvantage", "minor-insanity"), ["Max SAN −5 per rank"]);
  same(comp("disadvantage", "minor-insanity", held(3)), ["Max SAN −15"], "a held card states its total");
  same(comp("disadvantage", "minor-insanity", held(1)), ["Max SAN −5"]);
  same(comp("disadvantage", "berserker", held(1)), ["Max SAN −15"]);
  same(comp("disadvantage", "age"), ["BOD max 5", "REF max 6", "MOB max 6"]);
  same(comp("disadvantage", "dwarf").slice(0, 2), ["BOD max 8", "MOB max 3"]);
  assert.ok(comp("disadvantage", "dwarf").includes("+3 on checks with Stealth when hiding"), "P19's chip is still there");
  same(comp("disadvantage", "giant"), ["BOD max 11", "REF max 5", "MOB max 8", "Melee and Martial Arts damage to you −4"]);   // P20b 7 adds the last
  same(comp("advantage", "wealthy"), ["+Ç10,000 to start"]);
  same(comp("advantage", "wealthy", held(2)), ["+Ç10,000 to start"]);
  // What stays a rule row still says its words; the moved numbers are gone from the rule lines.
  assert.ok(rule("disadvantage", "berserker")[0].startsWith("Start of combat"));
  same(rule("advantage", "wealthy"), ["+Ç2,000 a month per rank."]);
  same(rule("disadvantage", "blood-lust"), ["First blood in an encounter: a Sanity Check. Pass, and it's off until the next one."]);
  for (const [kind, id] of [["disadvantage", "blood-lust"], ["disadvantage", "berserker"], ["disadvantage", "fanatic"], ["disadvantage", "hallucinations"], ["disadvantage", "minor-insanity"], ["disadvantage", "age"], ["disadvantage", "dwarf"], ["disadvantage", "giant"]])
    for (const t of tagsOf(kind, id).filter(x => !x.computed)) assert.ok(!/Sanity [−-]\d|\bmax \d/.test(t.text), `${id}: "${t.text}" is still a rule row for a computed number`);
  for (const [kind, id, rank] of [["disadvantage", "berserker", 1], ["disadvantage", "minor-insanity", 5], ["disadvantage", "giant", 1], ["advantage", "wealthy", 4]])
    for (const h of [null, held(rank)]) for (const t of comp(kind, id, h)) assert.ok(!/[{}]|undefined|NaN/.test(t), `${id}: "${t}"`);
  // The types are used by exactly these entries (§8).
  const users = type => P18_DEFS.filter(([, d]) => d.grants.some(g => g.type === type)).map(([, d]) => d.id).sort();
  same(users("derivedMod"), ["berserker", "blood-lust", "fanatic", "hallucinations", "minor-insanity"]);
  same(users("statMax"), ["age", "dwarf", "giant"]);
  same(users("startingCredits"), ["wealthy"]);
});

// ── P20b: numbers in play (Decision 236) ──────────────────────────────────
// Pain, rest and Take a hit read the traits that change them. The book is the source (0430, 0440, 0530, 0540).
const sub20b = (bod = 10) => subject({ bod });
const pain20b = (ch, damage = 0) => { ch.trackers.damage = damage; return JSON.parse(JSON.stringify(Engine.painState(ch))); };
// BOD 10 is 5 HP a Health Level: 0, 5, 10, 25, 40 damage is 0, 1, 2, 5, 8 lost, so bands 0, 0, 1, 2, 3.
const hit20b = (ch, over = {}) => Engine.resolveHit(ch, { damage: 12, damageType: "ballistic", category: "regular", ...over });
const w20b = (...ids) => { const ch = sub20b(); for (const id of ids) hold19(ch, ["giant", "terminal-disease", "pain-sensitive"].includes(id) ? "disadvantages" : "advantages", id); return ch; };

test("book 0430/0440: the numbers P20b computes are the book's", () => {
  const dis = crb("0440_Disadvantages.md"), adv = crb("0430_Advantages.md");
  assert.match(dis, /always at Pain Level 1\. This stacks with Pain Level increases from lost Health Levels/i);
  assert.match(adv, /Ignore 1 level of Pain per rank/);
  assert.match(adv, /| 1s+| x2s+|[sS]*| 2s+| x3s+|[sS]*| 3s+| x4s+|/);
  // Scrapper's data text is Deighton's rewrite (rulings-2026-10-16): Melee and Martial Arts, halved, rounded down, not
  // less than 1. The mirror's older line ("hand-to-hand ... and blunt melee weapon damage ... halved") has no floor.
  assert.match(D.advantages.find(a => a.id === "scrapper").description, /Melee and Martial Arts attacks is halved, rounded down, but not less than 1/);
  assert.match(adv, /Ignore bonus damage from normal attacks hitting the head/);
  assert.match(dis, /reduced by 4/);
  const row = (list, id, type) => list.find(d => d.id === id).grants.filter(g => g.type === type);
  same(row(D.disadvantages, "terminal-disease", "painLevel"), [{ type: "painLevel", amount: 1, onlyIfHurt: false }]);
  same(row(D.advantages, "pain-tolerance", "painIgnore"), [{ type: "painIgnore", perRank: 1 }]);
  same(row(D.advantages, "rapid-healing", "healTimes"), [{ type: "healTimes", byRank: [2, 3, 4] }]);
  same(row(D.advantages, "scrapper", "meleeTaken"), [{ type: "meleeTaken", halve: true, floor: 1 }]);
  same(row(D.disadvantages, "giant", "meleeTaken"), [{ type: "meleeTaken", minus: 4 }]);
  same(row(D.advantages, "thick-skull", "headBonus"), [{ type: "headBonus", ignore: true }]);
  same(D.aberrations.find(a => a.id === "fast-metabolism").naturalHealingTimes, 2);
});

test("P20b 1: Terminal Disease adds Pain, always", () => {
  const ladder = [0, 5, 10, 25, 40];
  const plain = ladder.map(d => pain20b(sub20b(), d));
  const td = d => pain20b(w20b("terminal-disease"), d);
  same(ladder.map(d => td(d).level), [1, 1, 2, 3, 3]);
  same(td(0).painSources, ["Terminal Disease"]);
  assert.equal(td(0).fromTraits, 1);
  same(td(40).painSources, [], "the cap left no room, so it is not named");
  // Every Skill check carries the unhurt Pain.
  const base = checks19(sub20b()), sick = checks19(w20b("terminal-disease"));
  for (const id of Object.keys(base)) assert.equal(sick[id], base[id] - 1, `${id}: the disease is in the check`);
  // Pain Sensitive reads it as hurt (PQ2): unhurt with both is 2.
  const both = w20b("terminal-disease", "pain-sensitive");
  assert.equal(pain20b(both, 0).level, 2);
  same(pain20b(both, 0).painSources, ["Terminal Disease", "Pain Sensitive"]);
  // Pain Immunity (PQ4): the Health Levels don't count, the disease does.
  const vamp = w20b("terminal-disease"); vamp.identity.archetype = "vampire";
  assert.equal(pain20b(vamp, 0).level, 1);
  // Nothing held: painState is what main computes, for the ladder of Health Levels lost.
  same(plain.map(p => [p.level, p.fromTraits, p.painSources, p.skillPenalty, p.ignored]), [[0, 0, [], 0, 0], [0, 0, [], 0, 0], [1, 0, [], -1, 0], [2, 0, [], -2, 0], [3, 0, [], -3, 0]]);
});

test("P20b 2: Pain Tolerance ignores Pain after the clamp", () => {
  const pt = (rank, ...more) => { const ch = w20b(...more); hold19(ch, "advantages", "pain-tolerance", rank); return ch; };
  const td = "terminal-disease";
  assert.equal(pain20b(pt(1, td), 0).level, 0, "rank 1 with Terminal Disease, unhurt");
  assert.equal(pain20b(pt(2), 40).level, 1, "rank 2 at band 3");
  assert.equal(pain20b(pt(1, td), 40).level, 2, "band 3 plus the disease clamps to 3, then 1 comes off (PQ1)");
  assert.equal(pain20b(pt(3), 5).level, 0, "never below 0");
  assert.equal(pain20b(pt(1, td), 0).ignored, 1);
  assert.equal(pain20b(pt(2), 40).ignored, 2);
  assert.equal(pain20b(pt(3), 5).ignored, 0, "it reports what it took, not what it could");
  same(pain20b(pt(2), 40).ignoredBy, ["Pain Tolerance"]);
  // Any Pain (PQ3): a Condition's too.
  const ag = pt(1); assert.equal(Engine.addCondition(ag, { id: "agonized" }).ok, true);
  assert.equal(pain20b(ag, 0).level, 0);
  // The penalties follow the level the character feels.
  const p = pain20b(pt(1, td), 0);
  assert.deepEqual([p.skillPenalty, p.essencePenalty, p.breakerPenalty], [0, 0, 0]);
  const base = checks19(pt(1, td)), none = checks19(sub20b());
  for (const id of Object.keys(base)) assert.equal(base[id], none[id], `${id}: Pain Tolerance took the disease's penalty off`);
});

test("P20b 3: rest heals by every multiplier", () => {
  const rh = (rank = 2) => hold19(subject({ bod: 6 }), "advantages", "rapid-healing", rank);
  const nh = (ch, o) => JSON.parse(JSON.stringify(Engine.naturalHealing(ch, o)));
  assert.equal(nh(subject({ bod: 6 }), { days: 1 }).proposed, 6, "nothing held is BOD a day");
  assert.equal(nh(rh(), { days: 1 }).proposed, 18);
  assert.equal(nh(rh(1), { days: 1 }).proposed, 12);
  assert.equal(nh(rh(3), { days: 2 }).proposed, 48);
  assert.equal(nh(rh(), { days: 1, speed: true }).proposed, 36, "the multipliers multiply (PQ5)");
  const fm = rh(); fm.trackers.aberrations = [{ id: "fast-metabolism", permanence: "temporary" }];
  assert.equal(nh(fm, { days: 1, speed: true }).proposed, 72);
  same(nh(fm, { days: 1, speed: true }).factors.map(f => [f.name, f.x]), [["Rapid Healing", 3], ["Fast Metabolism", 2], ["Speed Heal", 2]]);
  assert.equal(nh(fm, { days: 0 }).proposed, 0);
  // Focused Healing and a Nanomed Kit take the HP the player enters; the kit's proposal is BOD's.
  assert.equal(Engine.nanomedKit(rh(), 1).proposed, 6);
  const hurt = rh(); hurt.trackers.damage = 20;
  assert.equal(Engine.heal(hurt, { kind: "focused", hp: 5 }).ok, true);
  assert.equal(hurt.trackers.damage, 15, "Focused Healing took exactly the HP entered");
});

test("P20b 4: Giant and Scrapper answer Melee and Martial Arts, after Natural Armor", () => {
  const th = (ch, o) => hit20b(ch, o).through;
  assert.equal(th(w20b("giant"), { melee: true }), 8);
  assert.equal(th(w20b("scrapper"), { melee: true }), 6);
  assert.equal(th(w20b("giant", "scrapper"), { melee: true }), 4, "Giant's 4 comes off first: 12 → 8 → 4");
  same(hit20b(w20b("giant", "scrapper"), { melee: true }).taken.map(t => [t.name, t.from, t.to]), [["Giant", 12, 8], ["Scrapper", 8, 4]]);
  // The order is Giant's, whichever the character took first.
  same(hit20b(w20b("scrapper", "giant"), { melee: true }).taken.map(t => t.name), ["Giant", "Scrapper"]);
  assert.equal(th(w20b("scrapper"), { melee: true, damage: 1 }), 1, "never below 1");
  assert.equal(th(w20b("scrapper"), { melee: true, damage: 0 }), 0, "nothing through stays nothing");
  assert.equal(th(w20b("giant", "scrapper"), { melee: true, damage: 3 }), 0, "Giant took it all, so Scrapper has nothing to raise");
  // Not melee, or not a boolean: as ever.
  assert.equal(th(w20b("giant", "scrapper"), {}), 12);
  assert.equal(th(w20b("giant", "scrapper"), { melee: "true" }), 12);
  same(hit20b(w20b("giant", "scrapper"), {}).taken, []);
  // Massive takes Health Levels outright (PQ8).
  const m = hit20b(w20b("giant", "scrapper"), { melee: true, category: "massive" });
  assert.equal(m.levelsLost, hit20b(sub20b(), { category: "massive" }).levelsLost);
  assert.equal(m.taken.length, 0);
  // After Natural Armor (PQ7): 12, Thick Skin 3 → 9, Giant → 5, Scrapper → 2.
  const nat = w20b("giant", "scrapper"); hold19(nat, "advantages", "thick-skin", 3);
  const n = hit20b(nat, { melee: true });
  same(n.taken.map(t => [t.from, t.to]), [[9, 5], [5, 2]]);
  assert.equal(n.natural.absorbed, 3);
  // Withering: halved by Scrapper, and the Wither Ward comes after it (Decision 223).
  assert.equal(th(w20b("scrapper"), { melee: true, category: "withering" }), 6);
  assert.equal(JSON.stringify(Engine.hitAsks(w20b("giant"))), JSON.stringify({ melee: true }));
  assert.equal(JSON.stringify(Engine.hitAsks(w20b("scrapper"))), JSON.stringify({ melee: true }));
  assert.equal(JSON.stringify(Engine.hitAsks(sub20b())), JSON.stringify({ melee: false }));
});

test("P20b 5: a head hit doubles unless a helmet or Thick Skull says otherwise", () => {
  const head = (ch, o = {}) => hit20b(ch, { damage: 6, location: "head", ...o });
  assert.equal(head(sub20b()).through, 12);
  same(head(sub20b()).doubled, { from: 6, to: 12 });
  assert.equal(hit20b(sub20b(), { damage: 6 }).through, 6, "center mass is not the head");
  assert.equal(hit20b(sub20b(), { damage: 6, location: "torso" }).doubled, null);
  const skull = w20b("thick-skull");
  assert.equal(head(skull).through, 6);
  assert.equal(head(skull).doubled, null);
  assert.equal(head(skull).headIgnoredBy, "Thick Skull");
  assert.equal(head(sub20b()).headIgnoredBy, null);
  assert.equal(head(sub20b(), { category: "withering" }).through, 6, "Regular only (PQ9)");
  assert.equal(head(sub20b(), { category: "massive" }).doubled, null);
  // A helmet turns the head shot into a torso hit: not doubled, and the vest answers it.
  const hat = wearing(wearing(subject({ bod: 10 })), "motorcycle-helmet");
  const r = head(hat, { protRoll: 3 });
  assert.deepEqual([r.location, r.covered, r.doubled, r.through], ["torso", true, null, 1]);
  assert.equal(r.damage, 6); assert.ok(r.redirectedBy);
  // Resistance halves first, then the head doubles, then PROT and RES (PQ9).
  const noArm = hit20b(sub20b(), { damage: 7, location: "head" });
  same(noArm.doubled, { from: 7, to: 14 });
  assert.equal(noArm.through, 14);
});

test("P20b 3c: a trait on two rows counts once, its ranks summed", () => {
  const two = (kind, id) => { const ch = sub20b(); ch[kind].push({ id, rank: 1, notes: "", source: "natural" }, { id, rank: 1, notes: "" }); return ch; };
  const td = two("advantages", "pain-tolerance"); hold19(td, "disadvantages", "terminal-disease");
  assert.equal(pain20b(td, 25).ignored, 2, "both ranks of Pain Tolerance count");
  assert.equal(JSON.stringify(Engine.naturalHealing(two("advantages", "rapid-healing"), { days: 1 }).proposed), String(Engine.statTable(sub20b()).BOD.value * 3));
});

test("P20b 7: the tags are computed, held and unheld", () => {
  const comp = (kind, id, h = null) => tagsOf(kind, id, h).filter(t => t.computed).map(t => t.text);
  const rule = (kind, id) => tagsOf(kind, id).filter(t => !t.computed).map(t => t.text);
  const held = rank => ({ rank });
  same(comp("disadvantage", "terminal-disease"), ["Pain Level +1, hurt or not"]);
  same(comp("advantage", "pain-tolerance"), ["Ignore 1 Pain Level a rank"]);
  same(comp("advantage", "pain-tolerance", held(2)), ["Ignore 2 Pain Levels"]);
  same(comp("advantage", "pain-tolerance", held(1)), ["Ignore 1 Pain Level"]);
  same(comp("advantage", "rapid-healing"), ["Rest heals ×2 (rank 1), ×3 (2) or ×4 (3)"]);
  same(comp("advantage", "rapid-healing", held(2)), ["Rest heals ×3"]);
  same(comp("advantage", "scrapper"), ["Melee and Martial Arts damage to you halved (never below 1)"]);
  same(comp("disadvantage", "giant").slice(-1), ["Melee and Martial Arts damage to you −4"]);
  same(comp("advantage", "thick-skull"), ["A hit to your head doesn't double"]);
  // What stays a rule row still says its words; the numbers moved into the computed rows are gone from them.
  assert.ok(rule("disadvantage", "terminal-disease").every(t => !/Pain Level 1/.test(t)));
  assert.ok(rule("disadvantage", "giant").every(t => !/−4/.test(t)));
  assert.equal(rule("advantage", "scrapper").length, 0);
  assert.equal(rule("advantage", "pain-tolerance").length, 0);
  assert.equal(rule("advantage", "thick-skull").length, 0);
  for (const [kind, id, rank] of [["disadvantage", "terminal-disease", 1], ["advantage", "pain-tolerance", 3], ["advantage", "rapid-healing", 3], ["advantage", "scrapper", 1], ["disadvantage", "giant", 1], ["advantage", "thick-skull", 1]])
    for (const h of [null, held(rank)]) for (const t of comp(kind, id, h)) assert.ok(!/[{}]|undefined|NaN/.test(t), `${id}: "${t}"`);
  // The types are used by exactly these entries (§8).
  const users = type => P18_DEFS.filter(([, d]) => d.grants.some(g => g.type === type)).map(([, d]) => d.id).sort();
  same(users("painIgnore"), ["pain-tolerance"]);
  same(users("healTimes"), ["rapid-healing"]);
  same(users("meleeTaken"), ["giant", "scrapper"]);
  same(users("headBonus"), ["thick-skull"]);
});

// ── P21: Skills learn from powers, tweaks and Milestones (Decision 237) ───
// A tweak's, Major's, power's, trait's or Aberration's effect on a Skill's check is on its row, as an Advantage's is
// (P19). A power's effect is a mark; Take X's line adds an unconditional kicker and its total doesn't. The book is the
// source for every "when" (0411–0414, Appendix_Aberrations, 0530).
const arch21 = (arch, spec, ...majors) => {
  const ch = plain19();
  ch.identity.archetype = arch;
  if (spec) ch.archetypeChoices.specialization = Array.isArray(spec) ? spec : [spec];
  for (const id of majors) ch.progression.milestones.major.push({ id, date: "2026-10-21" });
  return ch;
};
const pro21 = (spec, ...majors) => arch21("professional", spec, ...majors);
const ww21 = (origin, ...majors) => arch21("werewolf", origin, ...majors);
const va21 = (line, ...majors) => arch21("vampire", line, ...majors);
const power21 = (ch, id, rank = 1) => { ch.progression.powerIpe = { ...(ch.progression.powerIpe || {}), [id]: rank - 1 }; return ch; };
const place21 = (ch, id, n = 1) => { ch.archetypeChoices.basePowers = { ...(ch.archetypeChoices.basePowers || {}), [id]: n }; return ch; };
const aberr21 = (ch, ...ids) => { for (const id of ids) ch.trackers.aberrations.push({ id, permanence: "permanent" }); return ch; };
const fx21 = (ch, id) => { const l = line19(ch, id); return { marks: l.marks.map(m => [m.kind, m.text, m.from]), takeX: l.takeX.map(t => [t.x, t.from, t.text]), kickers: l.kickers.map(k => [k.die, k.from]) }; };
const markText21 = (ch, id, from) => { const m = line19(ch, id).marks.find(x => x.from === from); return m ? m.text : null; };
const ATTACKS21 = ["archery", "beam-weapons", "handguns", "heavy-weapons", "martial-arts", "melee", "rifles", "smgs"];

test("book 0411–0414, Appendix_Aberrations: the lines P21 computes say what the book says", () => {
  const pro = crb("0412_Professional.md"), vam = crb("0413_Vampire.md"), wolf = crb("0414_Werewolf.md"), arc = crb("0411_Arcanist.md");
  assert.match(pro, /Gain a <span class="mark">1d6 Kicker die<\/span> for all Stealth Checks/);
  assert.match(pro, /You can choose to take 5 on Persuasion checks whenever negotiating prices with other vendors, merchants, and black marketeers/);
  assert.match(pro, /Pilot Skill Checks explode on a natural 9 or 10\. Moreover, whenever you declare a stunt for the first time on your turn you may do so without it using your stunt action or you can take 6 on your next Pilot check instead/);
  assert.match(pro, /When facing a supernatural enemy, you gain a \+1d6 kicker die to combat checks against those targets/);
  assert.match(pro, /Unwavering Focus \*\*\\\[Chi Cost 3\\\]\*\*: Focused Skills gain 1d4 kicker die while active/);
  assert.match(pro, /Wind Dancing Defense \*\*\\\[Chi Cost 4\\\]\*\*: Gain a 1d6 kicker die when using Dodge during combat/);
  assert.match(pro, /When needing make a Combat Sense Skill Check, you may Take 6/);
  assert.match(pro, /When performing Stunts in an encounter that would require an Acrobatics Skill Check, you can Take 6/);
  assert.match(pro, /Once per encounter, you may add a 1d4 Kicker Die when taking a Defensive Action \(such as Dodge or Parry\)/);
  assert.match(pro, /Gain \+5 on social skills \(Deception, Intimidation, Persuasion, Seduction\) when the weapon is visible/);
  assert.match(vam, /with \+3 to Acrobatics checks and Defensive Actions in the air/);
  assert.match(vam, /\+5 to hearing-based Awareness checks within 20 meters/);
  assert.match(vam, /Darkness within 20 meters: \+2 Stealth/);
  assert.match(vam, /\+2 to defensive actions \(Dodge and Parry\)/);
  assert.match(vam, /With an Ancient Weapon: \+2 to all combat checks/);
  assert.match(vam, /Semi-ethereal: immune to Physical damage, able to pass through walls, \+2 Stealth/);
  assert.match(wolf, /\+1 to melee attacks against it/);
  assert.match(wolf, /\+2 to Tracking checks for creatures within a mile/);
  assert.match(wolf, /\+2 to Intimidation checks/);
  assert.match(wolf, /\+3 to Occult Lore checks about supernatural matters/);
  assert.match(wolf, /\+2 to Persuasion or Seduction checks within 10 meters/);
  assert.match(wolf, /\+2 to Intuition checks to sense threats or the emotional state of a target within 10 meters/);
  assert.match(wolf, /\+2 to Stealth checks\./);
  assert.match(wolf, /gain \+1 to your attacks against it for the scene/);
  assert.match(wolf, /\+2 to Awareness Skill checks that rely on sight, smell, or hearing/);
  assert.match(wolf, /\+1 to Close-range Melee and Martial Arts attacks against a target an ally is also attacking in Close range/);
  assert.match(wolf, /\+2 to Stealth checks, and invisible to electronic surveillance\. Both end the moment you attack/);
  assert.match(arc, /Gain \+2 for any Occult Check when analyzing magic/);
  assert.match(arc, /Gain \+3 to any Occult check to discern the properties of any talisman or artifact\. You must make physical contact with the object for at least one minute/);
  assert.match(arc, /gain a \+5 modifier when attempting to identify or detect magical effects within meters equal to your WILL/);
  const ab = crb("Appendix_Aberrations.md");
  assert.match(ab, /\+3 to Stealth when not wearing heavy armor/);
  assert.match(ab, /−2 to Deception and Disguise to pass as ordinary|-2 to Deception and Disguise to pass as ordinary/);
  assert.match(ab, /Treat Dark visibility as Dim, and Blind as Dark/);
  assert.match(ab, /\+1 to all checks in Dim or Dark visibility, (−|-)1 to all checks in Bright/);
});

test("P21 1: a tweak's kicker, Take X and die face are on its Skill's row", () => {
  const none = pro21(null), base = checks19(none);
  // Cleaner: Vanish's 1d6 beside Stealth's number, which doesn't move.
  const cl = pro21("cleaner");
  same(line19(cl, "stealth").kickers, [{ die: "1d6", from: "Vanish" }]);
  same(checks19(cl), base, "a kicker is in a number");
  same(D.skills.filter(s => line19(cl, s.id).kickers.length).map(s => s.id), ["stealth"]);
  // Wheelman: Pilot explodes on a 9 or 10, and its Take 6 carries its when.
  const wh = pro21("wheelman");
  const p = line19(wh, "pilot");
  same(p.marks.map(m => [m.kind, m.text, m.from]), [["explodeOn", "Explodes on a natural 9 or 10", "Stunt Driver"]]);
  assert.equal(p.takeX.length, 1);
  assert.equal(p.takeX[0].x, 6); assert.equal(p.takeX[0].from, "Stunt Driver"); assert.equal(p.takeX[0].total, 6 + p.checkBonus);
  assert.match(p.takeX[0].whenText, /next Pilot check/);
  assert.match(p.takeX[0].whenText, /first time on your turn/);
  same(checks19(wh), base);
  // Fence: Persuasion's Take 5 with the book's when. The appraisal kicker is the table's (flag, P21 10).
  const fe = pro21("fence"), pe = line19(fe, "persuasion");
  assert.equal(pe.takeX.length, 1);
  same([pe.takeX[0].x, pe.takeX[0].from], [5, "Concierge"]);
  assert.match(pe.takeX[0].whenText, /negotiating prices with other vendors, merchants, and black marketeers/);
  assert.equal(pe.takeX[0].total, 5 + pe.checkBonus);
  same(checks19(fe), base);
  // Slayer: Hunter's Calling is a conditional kicker, so a mark; nothing in a check, no attack row gains a die.
  const sl = pro21("slayer");
  same(checks19(sl), base);
  for (const id of [...ATTACKS21, "occult-lore", "tracking"]) {
    assert.equal(line19(sl, id).kickers.length, 0, id);
    same(line19(sl, id).marks.map(m => [m.kind, m.from]), [["kicker", "Hunter's Calling"]], id);
  }
  assert.equal(markText21(sl, "handguns", "Hunter's Calling"), "+1d6 when facing a supernatural enemy");
  assert.equal(markText21(sl, "tracking", "Hunter's Calling"), "+1d6 when hunting your quarry");
  assert.equal(markText21(sl, "occult-lore", "Hunter's Calling"), "+1d6 when hunting your quarry");
  assert.equal(line19(sl, "dodge").marks.length + line19(sl, "combat-sense").marks.length, 0, "Dodge and Combat Sense are not attacks (PQ6)");
  // True Warrior: Wind Dancing Defense on Dodge only.
  const tw = pro21("true-warrior");
  same(checks19(tw), base);
  assert.equal(markText21(tw, "dodge", "Wind Dancing Defense"), "+1d6 when using Dodge during combat, while active");
  // The tweak's name is the source, not the subtype's.
  for (const l of D.skills.map(s => line19(tw, s.id))) for (const m of l.marks) assert.notEqual(m.from, "True Warrior");
});

test("P21 2: a taken Major's effect is on the row, and not before it's taken", () => {
  const none = pro21(null), base = checks19(none);
  same(line19(none, "combat-sense").takeX, []);
  const qs = pro21(null, "quick-study");
  const l = line19(qs, "combat-sense");
  same([l.takeX.length, l.takeX[0].x, l.takeX[0].from, l.takeX[0].total], [1, 6, "Quick Study", 6 + l.checkBonus]);
  same(checks19(qs), base);
  // A Major in the file twice counts once (grants()'s rule, Decision 199).
  const twice = pro21(null, "quick-study", "quick-study");
  assert.equal(line19(twice, "combat-sense").takeX.length, 1);
  // Hardcore Parkour: Acrobatics' Take 6 with its when, and Dodge's +3 as a mark.
  const hp = pro21(null, "hardcore-parkour");
  assert.match(line19(hp, "acrobatics").takeX[0].whenText, /performing Stunts in an encounter that would require an Acrobatics Skill Check/);
  same(line19(hp, "acrobatics").takeX.map(t => [t.x, t.from]), [[6, "Hardcore Parkour"]]);
  assert.equal(markText21(hp, "dodge", "Hardcore Parkour"), "+3 when performing a dodge as a defensive action");
  same(checks19(hp), base, "Dodge's +3 is a mark (PQ3)");
  // Survival Instinct: a conditional kicker, on Dodge and Melee.
  const si = pro21(null, "survival-instinct");
  for (const id of ["dodge", "melee"]) same(line19(si, id).marks.map(m => [m.kind, m.text, m.from]), [["kicker", "+1d4 once per encounter, on a Defensive Action (such as Dodge or Parry)", "Survival Instinct"]], id);
  // Iconic Weapon: four social Skills, +5 as a mark.
  const ic = pro21(null, "iconic-weapon");
  same(D.skills.filter(s => markText21(ic, s.id, "Iconic Weapon")).map(s => s.id), ["deception", "intimidation", "persuasion", "seduction"]);
  assert.equal(markText21(ic, "persuasion", "Iconic Weapon"), "+5 while your Signature weapon is visible");
  same(checks19(ic), base);
  // A Vampire's Majors: Night Wings and Life Sense.
  const vm = va21("strigoi", "night-wings", "life-sense");
  assert.equal(markText21(vm, "acrobatics", "Night Wings"), "+3 in the air");
  for (const id of ["dodge", "melee"]) assert.equal(markText21(vm, id, "Night Wings"), "+3 on Defensive Actions in the air", id);
  assert.equal(markText21(vm, "awareness", "Life Sense"), "+5 on hearing-based checks within 20 meters");
  // A Major no one took, or one the character's archetype doesn't list, gives nothing.
  assert.equal(markText21(va21("strigoi"), "awareness", "Life Sense"), null);
  assert.equal(markText21(ww21("trueborn", "night-wings"), "acrobatics", "Night Wings"), null, "a Vampire's Major on a Werewolf");
});

test("P21 3: Take X adds the kicker, and its total doesn't", () => {
  const ch = pro21(null, "quick-study");
  hold19(ch, "advantages", "hyper-vigilance");
  const l = line19(ch, "combat-sense");
  same(l.kickers, [{ die: "1d4", from: "Hyper Vigilance" }]);
  assert.equal(l.takeX[0].total, 6 + l.checkBonus, "the kicker is in the total");
  assert.equal(l.takeX[0].text, `Take 6: ${6 + l.checkBonus} + 1d4 (choose before you roll)`);
  // Hurt: the total drops with Pain, and the kicker stays.
  const hurt = clone19(ch); hurt.trackers.damage = 10;
  const lh = line19(hurt, "combat-sense");
  assert.ok(lh.breakdown.pain < 0, "the fixture isn't hurt");
  assert.equal(lh.takeX[0].total, 6 + lh.checkBonus);
  assert.equal(lh.takeX[0].text, `Take 6: ${6 + lh.checkBonus} + 1d4 (choose before you roll)`);
  same(lh.kickers, l.kickers);
  // A conditional Take X names the kicker too, after the total and before its when.
  const hp = pro21(null, "hardcore-parkour");
  const fm = D.advantages.find(a => a.id === "field-medic").grants.find(g => g.type === "kicker"), wasSkills = fm.skills;
  try {
    fm.skills = ["medical", "acrobatics"]; hold19(hp, "advantages", "field-medic");
    const la = line19(hp, "acrobatics");
    assert.equal(la.takeX[0].text, `Take 6: ${6 + la.checkBonus} + 1d4 when performing Stunts in an encounter that would require an Acrobatics Skill Check (choose before you roll)`);
  } finally { fm.skills = wasSkills; }
  assert.equal(line19(hp, "medical").takeX.length, 0);
  // Survival Instinct only on Dodge, with no Take X there: nothing changes.
  const si = pro21(null, "survival-instinct");
  same(line19(si, "dodge").takeX, []);
  // A Take X with no unconditional kicker reads as P19's did.
  const qs = pro21(null, "quick-study"), lq = line19(qs, "combat-sense");
  assert.equal(lq.takeX[0].text, `Take 6: ${6 + lq.checkBonus} (choose before you roll)`);
  // A conditional kicker is never in the line (P21 5).
  const uf = pro21("true-warrior", "quick-study");
  const lu = line19(uf, "combat-sense");
  assert.equal(lu.takeX[0].text, `Take 6: ${6 + lu.checkBonus} (choose before you roll)`, "Unwavering Focus is a mark, not a kicker");
  // Two unconditional kickers would both be named.
  const two = pro21(null, "quick-study");
  hold19(two, "advantages", "hyper-vigilance");
  const row = D.advantages.find(a => a.id === "field-medic").grants.find(g => g.type === "kicker"), was = row.skills;
  try { row.skills = ["medical", "combat-sense"]; hold19(two, "advantages", "field-medic"); assert.match(line19(two, "combat-sense").takeX[0].text, /: \d+ \+ 1d4 \+ 1d4 \(choose/); }
  finally { row.skills = was; }
});

test("P21 4: a power's mark grows with its rank, and nothing else moves", () => {
  const base = ww21("trueborn"), b0 = checks19(base);
  const at = rank => power21(ww21("trueborn"), "scent-tracking", rank);
  assert.match(markText21(at(1), "tracking", "Scent Tracking"), /^\+2 .*within a mile.*Scent Tracking runs/);
  assert.match(markText21(at(3), "tracking", "Scent Tracking"), /^\+4 /);
  same(checks19(at(3)), b0, "a power's bonus is in a number");
  same(checks19(at(1)), b0);
  // Each power's own constant, at rank 1: +2, and Ancestral Wisdom +3 (perRank × rank + plus).
  const w = ww21("trueborn");
  place21(w, "ancestral-wisdom");
  assert.match(markText21(w, "occult-lore", "Ancestral Wisdom"), /^\+3 .*supernatural matters/);
  assert.match(markText21(w, "intimidation", "Pheromone Aura"), /^\+2 /);
  assert.match(markText21(w, "melee", "Predator's Mark"), /^\+1 /);
  assert.match(markText21(power21(ww21("trueborn"), "predators-mark", 3), "melee", "Predator's Mark"), /^\+3 /);
  const wl = ww21("wildblood");
  for (const id of ["predators-allure", "instinctive-awareness", "predators-silence"]) place21(wl, id);
  for (const [skill, from] of [["persuasion", "Predator's Allure"], ["seduction", "Predator's Allure"], ["intuition", "Instinctive Awareness"], ["stealth", "Predator's Silence"]])
    assert.match(markText21(wl, skill, from), /^\+2 /, from);
  const ff = ww21("forge-fang");
  place21(ff, "combat-analytics");
  for (const id of ATTACKS21) assert.match(markText21(ff, id, "Combat Analytics"), /^\+1 /, id);
  // A Vampire's flat and ranked powers.
  const dr = va21("draugur");
  place21(dr, "spectral-veil"); place21(dr, "battleborn-instinct");
  assert.match(markText21(dr, "stealth", "Spectral Veil"), /^\+2 /);
  assert.match(markText21(dr, "melee", "Battleborn Instinct"), /^\+2 /);
  assert.match(markText21(power21(dr, "spectral-veil", 3), "stealth", "Spectral Veil"), /^\+4 /);
  const st = va21("strigoi"); place21(st, "veil-of-night");
  assert.match(markText21(st, "stealth", "Veil of Night (Masked)"), /^\+2 .*darkness within 20 meters/);
  assert.match(markText21(va21("upyr"), "dodge", "Preternatural Speed"), /^\+2 /);
  // A power's effect is a mark whatever it says: nothing in a check, in any archetype's Skills.
  for (const ch of [w, wl, ff, dr, st, va21("upyr")]) same(checks19(ch), b0);
  for (const ch of [w, wl, ff, dr, st]) for (const s of D.skills) assert.deepEqual(line19(ch, s.id).breakdown.traitParts, [], s.id);
});

// What the sources hold none of P21's rows leave alone (Natural Armor, movement, SFR), pinned from `main` before P21.
const MAIN21 = {
  ww: { na: [0, 0, [], []], mv: [[6, 18, 36], 9, []], sfr: [8, 3] },
  wf: { na: [0, 0, [], []], mv: [[6, 18, 36], 9, []], sfr: [8, 3] },
  va: { na: [0, 0, [], []], mv: [[6, 18, 36], 9, []], sfr: [11, 4] },
  ar: { na: [0, 0, [], []], mv: [[6, 18, 36], 9, []], sfr: null },
};
test("P21 4b: Natural Armor, movement and SFR read exactly as before", () => {
  const even = (arch, spec) => { const ch = arch21(arch, spec); for (const id of Object.keys(ch.stats)) ch.stats[id].base = 6; for (const s of D.skills) ch.skills[s.id] = { rank: 2, ipe: 0 }; return ch; };
  const pin = ch => { const na = Engine.naturalArmor(ch), mv = Engine.movement(ch), s = Engine.sfr(ch); return JSON.parse(JSON.stringify({ na: [na.total, na.base, na.always, na.conditional], mv: [mv.paces.map(p => p.value), mv.jump && mv.jump.value, mv.conditional], sfr: s ? [s.value, s.rou] : null })); };
  same(pin(even("werewolf", "trueborn")), MAIN21.ww);
  same(pin(even("werewolf", "forge-fang")), MAIN21.wf);
  same(pin(even("vampire", "draugur")), MAIN21.va);
  same(pin(even("arcanist", "thaumaturgical-sight")), MAIN21.ar);
  // The six stats and every Skill are even, so a trait's number anywhere is a Skill that differs.
  for (const [arch, spec] of [["werewolf", "trueborn"], ["werewolf", "forge-fang"], ["vampire", "draugur"], ["arcanist", "thaumaturgical-sight"], ["professional", "cleaner"]]) {
    const ch = even(arch, spec);
    assert.equal(new Set(Object.values(checks19(ch))).size, 1, `${arch}/${spec}: a trait's number is in a check`);
  }
});

test("P21 5: a conditional kicker is a mark, never in the Check cell", () => {
  const si = pro21(null, "survival-instinct");
  for (const id of ["dodge", "melee"]) {
    const l = line19(si, id);
    same(l.kickers, [], id);
    same(l.marks.map(m => m.kind), ["kicker"], id);
  }
  same(D.skills.filter(s => line19(si, s.id).marks.length).map(s => s.id), ["dodge", "melee"]);
  // Unwavering Focus: each Focused Skill (Engine.focusedSkillIds), and no other Skill.
  const tw = pro21("true-warrior");
  const focused = JSON.parse(JSON.stringify(Engine.focusedSkillIds(tw)));
  assert.ok(focused.length >= 4, "the fixture's Focused Skills");
  const marked = D.skills.filter(s => line19(tw, s.id).marks.some(m => m.from === "Unwavering Focus")).map(s => s.id);
  same(marked.sort(), [...focused].sort());
  for (const id of focused) { same(line19(tw, id).kickers, [], id); assert.equal(markText21(tw, id, "Unwavering Focus"), "+1d4 while Unwavering Focus is active", id); }
  // A Jack of All Trades' "all" is a price, not a list (focusedSkillIds): no Skill is marked.
  const ja = pro21("jack-of-all-trades");
  assert.equal(D.skills.filter(s => line19(ja, s.id).marks.length).length, 0);
});

test("P21 6: every source is read: spec, Major, power, trait, starter, Aberration", () => {
  const probe = [
    ["spec", ch => { ch.identity.archetype = "professional"; ch.archetypeChoices.specialization = ["cleaner"]; }, "stealth", "Vanish", 0],
    ["spec (Arcanist)", ch => { ch.identity.archetype = "arcanist"; ch.archetypeChoices.specialization = ["thaumaturgical-sight"]; }, "occult-lore", "Thaumaturgical Sight", 0],
    ["baseline trait", ch => { ch.identity.archetype = "arcanist"; }, "awareness", "Aetheric Attunement", 0],
    ["Major", ch => { ch.identity.archetype = "professional"; ch.progression.milestones.major.push({ id: "quick-study", date: "2026-10-21" }); }, "combat-sense", "Quick Study", 1],
    ["power", ch => { ch.identity.archetype = "werewolf"; ch.archetypeChoices.specialization = ["trueborn"]; }, "tracking", "Scent Tracking", 0],
    ["werewolf trait", ch => { ch.identity.archetype = "werewolf"; ch.archetypeChoices.specialization = ["trueborn"]; }, "awareness", "Feral Instincts", 0],
    ["starter power", ch => { ch.identity.archetype = "werewolf"; ch.archetypeChoices.specialization = ["forge-fang"]; }, "stealth", "Active Camouflage", 0],
    ["Aberration", ch => { ch.identity.archetype = "arcanist"; ch.trackers.aberrations.push({ id: "marked", permanence: "permanent" }); }, "disguise", "Marked", 0],
  ];
  for (const [what, set, skill, from, takeX] of probe) {
    const ch = plain19(); set(ch);
    const l = line19(ch, skill), seen = l.marks.some(m => m.from === from) || l.takeX.some(t => t.from === from) || l.kickers.some(k => k.from === from);
    assert.ok(seen, `${what}: ${from} is not on ${skill}'s row`);
  }
  // Remove each source and its effect goes.
  const gone = [
    ["cleaner", ch => { ch.archetypeChoices.specialization = []; }, "stealth"],
    ["Quick Study", ch => { ch.progression.milestones.major = []; }, "combat-sense"],
    ["Marked", ch => { ch.trackers.aberrations = []; }, "disguise"],
  ];
  const mk = { cleaner: () => pro21("cleaner"), "Quick Study": () => pro21(null, "quick-study"), Marked: () => aberr21(pro21(null), "marked") };
  for (const [what, strip, skill] of gone) {
    const ch = mk[what](), before = fx21(ch, skill);
    assert.ok(JSON.stringify(before) !== JSON.stringify(fx21(plain19(), skill)), `${what}: nothing to remove`);
    strip(ch);
    same(fx21(ch, skill), fx21(plain19(), skill), `${what} stays after it is removed`);
  }
  // An orphan gives nothing: a Vampire's power id held on a Werewolf, an unknown option, an unknown Major.
  const orphan = ww21("trueborn");
  orphan.archetypeChoices.basePowers = { "spectral-veil": 1, nonsense: 2 };
  orphan.archetypeChoices.specialization = ["trueborn", "no-such-origin"];
  orphan.progression.milestones.major.push({ id: "no-such-major", date: "2026-10-21" });
  assert.equal(markText21(orphan, "stealth", "Spectral Veil"), null);
  // Aberrations count for anyone who has one, and an unknown one is skipped.
  const ab = aberr21(pro21(null), "mimetic-skin", "no-such-aberration");
  assert.match(markText21(ab, "stealth", "Mimetic Skin"), /^\+3 when not wearing heavy armor/);
  // Feral Instincts and Pack Mentality (Werewolf traits); Active Camouflage (Forge Fang's starter power).
  const w = ww21("trueborn");
  assert.match(markText21(w, "awareness", "Feral Instincts"), /^\+2 .*sight, smell, or hearing/);
  for (const id of ["melee", "martial-arts"]) assert.match(markText21(w, id, "Pack Mentality"), /^\+1 .*Close range/, id);
  assert.match(markText21(ww21("forge-fang"), "stealth", "Active Camouflage"), /^\+2 .*until you attack/);
  assert.equal(markText21(w, "stealth", "Active Camouflage"), null, "a Trueborn has no CyberWolf Protocol");
  // Thaumaturgical Sight, Resonant Whispers, Aetheric Attunement: marks, in the Arcanist's Awareness and Occult Lore.
  const ar = arch21("arcanist", ["thaumaturgical-sight", "resonant-whispers"]);
  assert.equal(markText21(ar, "occult-lore", "Thaumaturgical Sight"), "+2 when analyzing magic");
  assert.match(markText21(ar, "occult-lore", "Resonant Whispers"), /^\+3 when discerning the properties of a talisman or artifact, after at least a minute of physical contact with the object/);
  assert.match(markText21(ar, "awareness", "Aetheric Attunement"), /^\+5 .*identifying or detecting magical effects within meters equal to your WILL/);
  same(checks19(ar), checks19(pro21(null)));
  // Mimetic Skin and Marked, from the table.
  assert.match(markText21(aberr21(pro21(null), "marked"), "deception", "Marked"), /^−2 to pass as ordinary/);
});

test("P21 7: Night Eyes and Nocturnal read the visibility table", () => {
  const ne = aberr21(pro21(null), "night-eyes");
  same(Engine.attackNotes(ne), [{ from: "Night Eyes", text: "Your attacks take −1 in Dark, not −3, and −3 in Blind, not −5" }]);
  same(line19(ne, "awareness").marks.map(m => [m.kind, m.text, m.from]), [["visibility", "Dark counts as Dim, and Blind as Dark", "Night Eyes"]]);
  same(withMarks19(ne), ["awareness"]);
  same(checks19(ne), checks19(pro21(null)));
  // The numbers are the table's: change one and the line follows.
  const dim = D.visibility.find(v => v.id === "dim"), was = dim.attack;
  try { dim.attack = -2; assert.match(Engine.attackNotes(ne)[0].text, /^Your attacks take −2 in Dark, not −3, and −3 in Blind, not −5$/); }
  finally { dim.attack = was; }
  const dark = D.visibility.find(v => v.id === "dark"), wasDark = dark.attack;
  try { dark.attack = -4; assert.match(Engine.attackNotes(ne)[0].text, /^Your attacks take −1 in Dark, not −4, and −4 in Blind, not −5$/); }
  finally { dark.attack = wasDark; }
  // Nocturnal: one line, every check by light, from the table's own level names.
  const noc = aberr21(pro21(null), "nocturnal");
  same(Engine.checkNotes(noc), [{ from: "Nocturnal", text: "+1 to every check in Dim or Dark, −1 in Bright" }]);
  same(Engine.checkNotes(pro21(null)), []);
  same(checks19(noc), checks19(pro21(null)), "light isn't in the number");
  same(withMarks19(noc), [], "Nocturnal is one line atop the Skills tab, not a mark on every row");
  const bright = D.visibility.find(v => v.id === "bright"), wasName = bright.name;
  try { bright.name = "Daylight"; assert.match(Engine.checkNotes(noc)[0].text, /−1 in Daylight/); }
  finally { bright.name = wasName; }
  // Night Vision reads as it did.
  same(Engine.attackNotes(hold19(plain19(), "advantages", "night-vision")), [{ from: "Night Vision", text: "Dim −1 and Dark −3 don't apply to your attacks" }]);
});

test("P21 10: the flagged kicker rules are stubbed, not guessed", () => {
  // FN+2: Specialist doesn't step a kicker up a size, and Make My Own Luck doesn't roll twice.
  const med = pro21(null, "specialist", "make-my-own-luck");
  hold19(med, "advantages", "field-medic");
  same(line19(med, "medical").kickers, [{ die: "1d4", from: "Field Medic" }]);
  assert.ok(!/roll twice|1d6/.test(JSON.stringify(fx21(med, "medical"))), "a kicker was stepped up or rolled twice");
  // FN+1: Hyper Vigilance with Unwavering Focus: one 1d4 in the cell, the other a mark; nothing combines.
  const cs = pro21("true-warrior");
  hold19(cs, "advantages", "hyper-vigilance");
  const l = line19(cs, "combat-sense");
  same(l.kickers, [{ die: "1d4", from: "Hyper Vigilance" }]);
  same(l.marks.map(m => [m.kind, m.text]), [["kicker", "+1d4 while Unwavering Focus is active"]]);
  assert.ok(!/1d6|d8/.test(JSON.stringify(l)), "two kickers were combined");
  // FN: a Fence's Skills carry no appraisal kicker on any row.
  const fe = pro21("fence");
  for (const s of D.skills) assert.equal(line19(fe, s.id).kickers.length + line19(fe, s.id).marks.filter(m => m.kind === "kicker").length, 0, s.id);
  // Field Medic stays unflagged: a flagged Advantage isn't sold for IP (Decision 227), and F46 moved off it.
  assert.ok(!D.advantages.find(a => a.id === "field-medic").flagged, "Field Medic is flagged, so IP stops selling it");
  // Each is flagged, names an open F-number, and has the words a player sees.
  const fence = D.archetypes.find(a => a.id === "professional").specialization.options.find(o => o.id === "fence");
  const specialist = D.milestones.majorGeneral.find(m => m.id === "specialist"), luck = D.milestones.majorGeneral.find(m => m.id === "make-my-own-luck");
  const survival = D.milestones.majorGeneral.find(m => m.id === "survival-instinct");
  for (const [what, e, flag] of [["Fence", fence, "F45"], ["Survival Instinct", survival, "F46"], ["Specialist", specialist, "F47"], ["Make My Own Luck", luck, "F47"]]) {
    assert.equal(e.flagged, true, what);
    assert.match(e.flagNote, new RegExp(`\\b${flag}\\b`), what);
    assert.ok(typeof e.playerNote === "string" && e.playerNote.length > 10, `${what} has no playerNote`);
    assert.doesNotMatch(e.playerNote, /\bF\d+\b|TBD|confirm with/i, `${what}'s playerNote narrates the build`);
  }
});

test("P21 9: the Skills that can hold two kickers, or a kicker and a Take X, are the ones the order names", () => {
  // Every source that carries a kicker or a Take X, with who can hold it. Two sources can meet on one character unless
  // they belong to different archetypes, or are different options of one archetype that takes a single option.
  const all = D.skills.map(s => s.id), rows = [];
  const add = (label, grants, who, skillsOf) => {
    for (const g of grants || []) {
      if (!g || (g.type !== "kicker" && g.type !== "takeX")) continue;
      const ids = Array.isArray(g.skills) ? g.skills : g.skillsFrom === "focused" ? skillsOf(g) : (() => {
        const p = ((who.def && who.def.picks) || []).find(x => x.id === g.skillsFromPick);
        return p && p.from && p.from.ids ? p.from.ids : all;
      })();
      rows.push({ label: g.name || label, type: g.type, when: !!g.whenText, ids, ...who });
    }
  };
  const nobody = () => [];
  for (const d of [...D.advantages, ...D.disadvantages]) add(d.name, d.grants, { arch: null, spec: null, def: d }, nobody);
  for (const m of D.milestones.majorGeneral) add(m.name, m.grants, { arch: "professional", spec: null, def: m }, nobody);
  for (const a of D.archetypes) {
    for (const m of (a.growth && a.growth.majorMilestones) || []) if (Array.isArray(m.grants)) add(m.name, m.grants, { arch: a.id, spec: (m.prerequisites && m.prerequisites.specialization || [])[0] || null, def: m }, nobody);
    for (const t of a.baselineTraits || []) add(t.name, t.grants, { arch: a.id, spec: null, def: t }, nobody);
    for (const p of a.powers || []) add(p.name, p.grants, { arch: a.id, spec: p.origin || null, def: p }, nobody);
    for (const o of (a.specialization && a.specialization.options) || []) {
      const focused = () => (o.focusedSkills && o.focusedSkills.ids) || [];
      add(o.tweak ? o.tweak.name : o.name, o.grants, { arch: a.id, spec: o.id, def: o }, focused);
      for (const r of (o.starterPower && o.starterPower.rows) || []) add(r.augmentation, r.grants, { arch: a.id, spec: o.id, def: r }, nobody);
    }
  }
  for (const ab of D.aberrations) add(ab.name, ab.grants, { arch: null, spec: null, def: ab }, nobody);
  assert.ok(rows.length >= 15, `found only ${rows.length} kicker or Take X rows`);
  const meet = (a, b) => a.label !== b.label && !(a.arch && b.arch && a.arch !== b.arch) && !(a.arch && a.arch === b.arch && a.arch !== "arcanist" && a.spec && b.spec && a.spec !== b.spec);
  const overlaps = {};
  for (const id of all) {
    const here = rows.filter(r => r.ids.includes(id));
    for (const a of here) for (const b of here) {
      if (a === b || !meet(a, b) || (a.type === "takeX" && b.type === "takeX")) continue;
      if (a.type === "takeX" && b.type === "kicker") continue;          // counted from the kicker's side
      (overlaps[id] = overlaps[id] || new Set()).add(a.type === b.type ? [a.label, b.label].sort().join(" + ") : a.label + " + " + b.label);
    }
  }
  const got = Object.fromEntries(Object.entries(overlaps).map(([k, v]) => [k, [...v].sort()]).sort(([a], [b]) => a.localeCompare(b)));
  same(got, {
    acrobatics: ["Unwavering Focus + Hardcore Parkour"],
    "combat-sense": ["Hyper Vigilance + Quick Study", "Hyper Vigilance + Unwavering Focus", "Unwavering Focus + Quick Study"],
    dodge: ["Survival Instinct + Wind Dancing Defense"],
    intuition: ["Unwavering Focus + Aura Sight", "Unwavering Focus + Common Sense"],
    melee: ["Hunter's Calling + Survival Instinct"],
  }, "a Skill can now hold two kickers, or a kicker and a Take X, that the order doesn't name: decide how the row reads");
});

// ── The rider: Speed Heal lasts 24 hours (PQ15) ──────────────────────────
const rest21 = (bod, days, extra = {}) => { const ch = subject({ bod }); return Engine.naturalHealing(ch, { days, ...extra }).proposed; };
test("P21 11: Speed Heal doubles one day of a rest", () => {
  // 0460: "2× healing rate for 24 hours". BOD 6 heals BOD a day: 6.
  assert.equal(rest21(6, 3, { speed: true }), 24, "6 × 2 for the dosed day, + 6 + 6");
  assert.equal(rest21(6, 1, { speed: true }), 12);
  assert.equal(rest21(6, 3), 18);
  assert.equal(rest21(6, 1), 6);
  assert.equal(rest21(6, 0, { speed: true }), 0, "no day rested, nothing to double");
  assert.equal(rest21(6, 0), 0);
  // Rapid Healing 2 (×3) multiplies every day; Speed Heal doubles one of them.
  const rh = d => { const ch = subject({ bod: 6 }); hold19(ch, "advantages", "rapid-healing", 2); return Engine.naturalHealing(ch, { days: d, speed: true }); };
  assert.equal(rh(3).proposed, 18 * 2 + 18 + 18);
  assert.equal(rh(1).proposed, 36);
  // Speed Heal's entry in `factors` says which days it doubles; the every-day factors carry none.
  const f = JSON.parse(JSON.stringify(rh(3).factors));
  same(f.filter(x => x.days === 1).map(x => x.name), ["Speed Heal"]);
  assert.ok(f.every(x => x.days === 1 || x.days === undefined));
});

test("P21 10b: Field Medic is still sold for IP (F46 sits on a Major, not on it)", () => {
  const ch = pro21(null); ch.skills.medical = { rank: 3, ipe: 0 };
  const c = JSON.parse(JSON.stringify(Engine.ipCost(ch, "advantage", "field-medic")));
  assert.equal(c.ok, true, JSON.stringify(c));
  assert.equal(c.cost, 50);
});
