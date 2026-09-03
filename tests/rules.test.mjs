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
