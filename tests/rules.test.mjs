/**
 * CRB conformance — the rulebook's own worked examples, run as tests.
 *
 * Source: `030_Core_Mechanics.docx`, CRB v4 (WIP), read 2026-09-02.
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
import { loadEngine } from "./harness.mjs";

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
// Source: `043_Advantages.docx` / `044_Disadvantages.docx`, CRB v4 (WIP).
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

// ── Conditions and Pain (054_Conditions_and_Recovery.md, pulled 2026-09-22) ──

test('CRB 054: "A high BOD character on Pain Level 3 will experience -3 ... -3 die ... -15%"', () => {
  const ch = subject({ bod: 10 });
  ch.trackers.damage = 40;                       // 8 of 10 HL lost
  const p = Engine.painState(ch);
  assert.equal(p.level, 3);
  assert.equal(p.skillPenalty, -3);
  assert.equal(p.essencePenalty, -3);
  assert.equal(p.breakerPenalty, -15);
});

test('CRB 054: Agonized — "Operate at 1 Pain Level higher, to a max PL 3"', () => {
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

test('CRB 054: Pain "never falls below 0 or climbs above 3"', () => {
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

test("CRB 054: a Condition doesn't stack with itself — but Blinded, Disoriented and Burning together", () => {
  const ch = subject();
  assert.equal(Engine.addCondition(ch, { id: "burning" }).ok, true);
  const again = Engine.addCondition(ch, { id: "burning" });
  assert.equal(again.ok, false, "a second Burning was accepted");
  assert.match(again.why, /doesn't stack/);
  assert.equal(Engine.addCondition(ch, { id: "blinded" }).ok, true);
  assert.equal(Engine.addCondition(ch, { id: "disoriented" }).ok, true);
  assert.equal(ch.trackers.conditions.length, 3);
});

test('CRB 054: Helpless — "Any attack roll of 2 or better is a guaranteed hit"', () => {
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

test('CRB 054: "After three Death Marks against you, you die"', () => {
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

// ── Taking a hit (053 Damage and Armor, 054 Going Down — Decision 99) ──

/** Wear one catalog piece. Kevlar Vest: PROT 1d6, RES +2, INT 20, torso. */
function wearing(ch, id = "kevlar-vest", extra = {}) {
  ch.armor.push(Object.assign({ id, integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: [] }, extra));
  return ch;
}

test('CRB 053: Massive "strips Integrity equal to the weapon\'s damage and takes 1 Health Level per 10 points"', () => {
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

test('CRB 053: Massive Health Levels "are gone rather than emptied", and count toward Pain (CQ6)', () => {
  const ch = subject({ bod: 5 });
  Engine.applyHit(ch, { damage: 10, damageType: "ballistic", category: "massive" });
  assert.equal(ch.trackers.massiveLevels, 2);
  assert.equal(ch.trackers.damage, 0, "no HP damage: the levels are removed");
  const p = Engine.painState(ch);
  assert.equal(p.hlLost, 2);
  assert.equal(p.level, 1, "2 HL lost is Pain Level 1");
  assert.equal(p.hpLeft, 15, "three levels of 5 HP left");
});

test('CRB 053: "Armor-piercing skips RES entirely, though PROT still rolls"', () => {
  const hit = { damage: 10, damageType: "ballistic", protRoll: 3 };
  const plain = Engine.resolveHit(wearing(subject()), hit);
  assert.deepEqual([plain.prot, plain.res, plain.through], [3, 2, 5]);
  const ap = Engine.resolveHit(wearing(subject()), { ...hit, ap: true });
  assert.deepEqual([ap.prot, ap.res, ap.through, ap.resSkipped], [3, 0, 7, "ap"]);
});

test('CRB 053: "At Integrity 0 ... RES is gone until somebody repairs it, and PROT remains"', () => {
  const ch = wearing(subject(), "kevlar-vest", { integrityLoss: 20 });
  assert.equal(Engine.armorState(ch).worn.compromised, true);
  const r = Engine.resolveHit(ch, { damage: 10, damageType: "ballistic", protRoll: 4 });
  assert.deepEqual([r.prot, r.res, r.through, r.resSkipped], [4, 0, 6, "compromised"]);
});

test('CRB 053: "A hit that armor soaks entirely still costs the armor 1 integrity"', () => {
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

test("Gear: RES answers only the damage it matches. Kinetic by default, Energy with Ablative Plating, Magical with Warding", () => {
  const hit = { damage: 10, damageType: "energy", protRoll: 2 };
  const bare = Engine.resolveHit(wearing(subject()), hit);
  assert.deepEqual([bare.res, bare.through, bare.resSkipped], [0, 8, "type"]);
  const ablative = Engine.resolveHit(wearing(subject(), "kevlar-vest", { upgrades: ["Ablative Plating"] }), hit);
  assert.deepEqual([ablative.res, ablative.through], [2, 6]);
  const warded = Engine.resolveHit(wearing(subject(), "kevlar-vest", { upgrades: ["Warding"] }),
                                   { ...hit, damageType: "magical" });
  assert.equal(warded.res, 2);
  // Tri-Weave: "+10 INT to the armor's integrity pool", per install.
  const tw = Engine.armorState(wearing(subject(), "kevlar-vest", { upgrades: ["Tri-Weave", "Tri-Weave"] }));
  assert.equal(tw.worn.integrityMax, 40);
});

test('CRB 053 Playing it Out: "PROT: 2, plus RES 3. That\'s 5 defended of 15 ... 10 gets through. That\'s two Health Levels ... Pain Level 1"', () => {
  // His vest isn't in the catalog, so it goes on the sheet as a custom piece.
  const ch = wearing(subject({ bod: 5 }), undefined, { id: undefined, custom: true, name: "Vest", prot: "1d6", res: 3, integrity: 20 });
  const hit = { damage: 15, damageType: "ballistic", protRoll: 2 };
  const r = Engine.resolveHit(ch, hit);
  assert.deepEqual([r.absorbed, r.through, r.lostThisHit], [5, 10, 2]);
  Engine.applyHit(ch, hit);
  assert.equal(Engine.painState(ch).level, 1);
});

test('CRB 054 Shock: "A single hit that takes half your Health Levels or more", half of max rounded up (CQ10)', () => {
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

test('CRB 054: "If a hit drops you to zero Health Levels ... you skip the Shock check entirely"', () => {
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

test('CRB 054: "Any damage you take while Dying is an automatic failure and a mark against you"', () => {
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

// ── Loadout & recovery (053 Weapons/Wear, 055 Downtime, Gear — Decision 100) ──

test('CRB 053: "A character with BOD 5 using a BOD+3 weapon does 8 damage per strike"', () => {
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

test('CRB 053: "Roll the attack. 1d10 + your Skill + modifiers" — Single fire adds the weapon\'s ACC', () => {
  const ch = subject();
  ch.skills.handguns = { rank: 4, ipe: 0 };
  ch.weapons.push({ id: "vs4-ironside", notes: "" });          // ACC +1
  const l = Engine.weaponLine(ch, 0);
  assert.equal(l.attack, Engine.skillLine(ch, "handguns").checkBonus, "the attack IS the skill check");
  assert.equal(l.acc, 1, "ACC is carried apart, because only Single fire adds it");
  ch.trackers.damage = 10;                                      // BOD 5: 2 HL lost, Pain Level 1
  assert.equal(Engine.weaponLine(ch, 0).attack, l.attack - 1, "Pain comes off the attack like any check");
});

test('CRB 055: "A BOD 5 character rebuilds a Health Level a day; five hard days puts the whole ladder back"', () => {
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

test('CRB 055: "The Injured Condition must be resolved through Focused Healing"', () => {
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

test('Gear: "A Field Repair Kit restores 1d6 INT"; 053: armor driven to 0 by Massive "isn\'t repairable"', () => {
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
  assert.equal(Engine.addUpgrade(specops, 0, "Warding").ok, true);
  assert.equal(Engine.addUpgrade(specops, 0, "EMP Shielding").ok, false, "a fourth upgrade in three slots");
  const two = wearing(subject(), "urban-tactics-vest");          // Mid, 2 slots
  Engine.addUpgrade(two, 0, "Warding");
  assert.match(Engine.addUpgrade(two, 0, "Warding").why, /Already installed/, "Warding isn't repeatable");
  assert.equal(Engine.addUpgrade(wearing(subject(), "reinforced-denim-vest"), 0, "EMP Shielding").ok, false, "Low quality has no mod slots");
});

test('CRB 054 Dying: ongoing damage "will continue to tick while you\'re dying. Each time you take damage, that\'s another mark" (F24 stub)', () => {
  const ch = subject({ bod: 5 });
  ch.trackers.damage = 25;
  ch.trackers.conditions = [{ id: "dying", marks: 0 }, { id: "bleeding" }];
  const r = Engine.resolveReset(ch);
  assert.equal(r.marks, 1);
  assert.equal(r.prompts.dyingCheck, null, "the tick stands in for the check (F24 stub)");
  assert.equal(r.notes.length, 1, "the stub doesn't say so");
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

test('CRB 054 At Zero: the check comes "again every time you take damage" — a Bleeding tick included, and no Shock for it', () => {
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
