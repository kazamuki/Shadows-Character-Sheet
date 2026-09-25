/**
 * Snapshot every computed output, then diff two snapshots.
 *
 *   node tools/outputs.mjs out.json            write a snapshot
 *   node tools/outputs.mjs --against out.json  diff the working tree against it
 *
 * Decision 68 says a data change bumps nothing when no character can observe
 * it, and that has to be shown, not asserted. This is the showing: for every
 * archetype at every power level, one worked character's engine readers, and
 * the rendered text of every sheet tab, the pickers each tab opens, Admin,
 * print and every wizard step. Take a snapshot before a refactor, make the
 * change, run --against. An empty diff is the proof; a non-empty one is the
 * list of what a player would see move.
 *
 * Not shipped and not part of `npm test`: it takes a few minutes, and it
 * answers a question about one change, not about the build.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { boot, loadEngine } from "../tests/harness.mjs";

const TAG = "TAG-7K3M-Q9RX-2WVB";   // fixed, so the intake line never differs between runs
const { Engine, D } = loadEngine();
if (!Engine.isIntakeId(TAG)) throw new Error(`${TAG} isn't a valid TAG any more; pick another`);

// One worked character per archetype and power level: every pool rolled, some
// of everything spent, a specialization and its picks, a little play history.
function worked(archId, plId, { locked }) {
  const ch = Engine.newCharacter();
  ch.meta.id = TAG;
  ch.meta.created = ch.meta.updated = "2026-01-01T00:00:00.000Z";
  ch.identity.name = "Vex";
  ch.identity.archetype = archId;
  ch.creation.powerLevel = plId;
  ch.creation.rolls = { statPoints: 12, skillPoints: 15, credits: 4 };
  D.stats.forEach((s, i) => { ch.stats[s.id].base = 3 + (i % 6); });
  const ac = ch.archetypeChoices;
  ac.rolls = { focusStatBonus: 2, statBonus: 2, startingSpells: 1 };
  ac.focusAllocation = { INT: 1, COOL: 1 };
  ac.statBonusAllocation = { BOD: 2 };
  const arch = D.archetypes.find(a => a.id === archId);
  const opts = ((arch.specialization || {}).options || []).map(o => o.id);
  ch.creation.powerLevel = plId;
  ac.specialization = opts.slice(0, Math.max(1, Engine.specializationNeed(ch) || 1));
  const fp = Engine.focusedPicks(ch);
  if (fp) ac.focusedSkillPicks = D.skills.filter(s => !fp.category || s.category === fp.category)
    .map(s => s.id).filter(id => !Engine.focusedSkillIds(ch).includes(id)).slice(0, fp.need);
  if (arch.coreMechanic && arch.coreMechanic.disciplines) ac.disciplines = { enchantment: 1 };
  D.skills.slice(0, 8).forEach((s, i) => { ch.skills[s.id] = { rank: 1 + (i % 3), ipe: 0 }; });
  if (arch.canPurchaseAdvantages !== false) ch.advantages = [{ id: D.advantages[0].id, rank: 1, notes: "" }];
  ch.trackers.luck.bonus = 1;
  ch.creation.boosts = [{ targetType: "stat", targetId: "REF", times: 1 }, { targetType: "skill", targetId: D.skills[0].id, times: 1 }];
  ch.progression.ip.log = [{ date: "2026-01-02T00:00:00.000Z", kind: "grant", amount: 300, note: "" }];
  ch.progression.milestonePoints = 3;
  if (ch.trackers.sfr) ch.trackers.sfr.spent = 2;
  ch.creation.locked = locked;
  return ch;
}

const safe = f => { try { return f(); } catch (e) { return { threw: String(e && e.message) }; } };
// Strip what varies between runs without anything changing: timestamps.
const norm = s => String(s).replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, "<iso>")
  .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, "<date>").replace(/\s+/g, " ").trim();

function engineOutputs(ch) {
  const E = Engine, stats = D.stats.map(s => s.id), skills = D.skills.map(s => s.id);
  const each = (ids, f) => Object.fromEntries(ids.map(id => [id, safe(() => f(id))]));
  const bare = Engine.newCharacter(); bare.identity.archetype = ch.identity.archetype;
  bare.creation.powerLevel = ch.creation.powerLevel;
  return JSON.parse(JSON.stringify({
    statTable: safe(() => E.statTable(ch)), derived: safe(() => E.derived(ch)),
    health: safe(() => E.health(ch)), sfr: safe(() => E.sfr(ch)),
    statPool: safe(() => E.statPool(ch)), skillPool: safe(() => E.skillPool(ch)), cp: safe(() => E.cp(ch)),
    luck: safe(() => E.luckState(ch)), san: safe(() => E.sanState(ch)), pain: safe(() => E.painState(ch)),
    canBoostStat: each(stats, id => E.canBoost(ch, "stat", id)),
    canBoostSkill: each(skills, id => E.canBoost(ch, "skill", id)),
    skillRankCap: each(skills, id => E.skillRankCap(ch, id)),
    ipCostStat: each(stats, id => E.ipCost(ch, "stat", id)),
    ipCostSkill: each(skills, id => E.ipCost(ch, "skill", id)),
    ip: safe(() => E.ipState(ch)), milestones: safe(() => E.milestoneState(ch)),
    takeMinorNone: safe(() => E.canTakeMinor(bare, D.milestones.minorShared[0].id)),
    takeMajorNone: safe(() => E.takeMilestone(bare, "major", D.milestones.majorGeneral[0].id)),
    disciplines: safe(() => E.disciplineRanks(ch)), startingSpells: safe(() => E.startingSpells(ch)),
    panels: safe(() => E.archPanels(ch).map(p => [p.id, E.panelMax(ch, p)])),
    specializationNeed: safe(() => E.specializationNeed(ch)),
    focused: safe(() => E.focusedSkillIds(ch)), focusedPicks: safe(() => E.focusedPicks(ch)),
    validate: Object.fromEntries(D.creationFlow.steps.map(s => [s.id, safe(() => E.validate(s.id, ch))])),
    buy: safe(() => (D.weapons || []).slice(0, 5).map(w => E.catalogLine(ch, "weapons", w.id))),
  }));
}

function visible(app) {
  const clone = app.doc.body.cloneNode(true);
  for (const el of [...clone.querySelectorAll("script, style")]) el.remove();
  return norm(clone.textContent);
}
const clickEl = (app, el) => el && el.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
function closeOverlays(app) {
  const m = app.$("#modal[open] [data-modalclose]"); if (m) clickEl(app, m);
  const p = app.$("#vpop:not([hidden]) [data-vpopclose]"); if (p) clickEl(app, p);
}

function sheetTexts(ch, key, out) {
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "main" } } });
  app.window.print = () => {};
  clickEl(app, app.$$("#main button").find(b => /Open sheet/.test(b.textContent)));
  for (const sec of app.$$("[data-sec]").map(b => b.dataset.sec)) {
    app.click(`[data-sec="${sec}"]`);
    out[`${key}/tab:${sec}`] = visible(app);
    const openers = [...new Set(app.$$("#main [data-hitopen], #main [data-actopen], #main [data-lobrowse], #main [data-spellpickopen], #main [data-abpickopen], #main [data-vpop]")
      .map(b => [...b.attributes].find(a => /^data-(hitopen|actopen|lobrowse|spellpickopen|abpickopen|vpop)$/.test(a.name)))
      .map(a => `[${a.name}="${a.value}"]`))];
    for (const sel of openers) {
      const b = app.$(`#main ${sel}`); if (!b) continue;
      clickEl(app, b);
      const o = app.$("#modal[open]") || app.$("#vpop:not([hidden])");
      if (o) out[`${key}/tab:${sec} ${sel}`] = norm(o.textContent);
      closeOverlays(app);
    }
  }
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  out[`${key}/admin`] = visible(app);
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  app.click("[data-menu-toggle]"); app.click("[data-print]");
  const pr = app.$("#printSheet");
  out[`${key}/print`] = norm(pr.textContent);
  if (app.errors.length) out[`${key}/errors`] = app.errors;
}

function wizardTexts(archId, plId, key, out) {
  for (let step = 0; step <= D.creationFlow.steps.length; step++) {
    const ch = worked(archId, plId, { locked: false });
    const app = boot({ storage: { "shadows.draft.v1": { ch, step, maxReached: step } } });
    const resume = app.$("[data-open]");
    if (!resume) continue;
    clickEl(app, resume);
    out[`${key}/wizard:${step}`] = visible(app);
    if (app.errors.length) out[`${key}/wizard:${step}/errors`] = app.errors;
  }
}

function snapshot() {
  const out = {};
  for (const a of D.archetypes) for (const pl of D.powerLevels) {
    const key = `${a.id}/${pl.id}`;
    out[`${key}/engine`] = engineOutputs(worked(a.id, pl.id, { locked: true }));
    sheetTexts(worked(a.id, pl.id, { locked: true }), key, out);
    wizardTexts(a.id, pl.id, key, out);
    process.stderr.write(".");
  }
  process.stderr.write("\n");
  return out;
}

// Where two strings first part, with a little context either side.
function firstDifference(a, b) {
  a = typeof a === "string" ? a : JSON.stringify(a); b = typeof b === "string" ? b : JSON.stringify(b);
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  return `  before: …${a.slice(Math.max(0, i - 60), i + 80)}…\n  after:  …${b.slice(Math.max(0, i - 60), i + 80)}…`;
}

const args = process.argv.slice(2);
if (args[0] === "--against") {
  const before = JSON.parse(readFileSync(args[1], "utf8")), after = snapshot();
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  const diffs = keys.filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  for (const k of diffs) {
    if (!(k in before)) console.log(`+ ${k} (new)`);
    else if (!(k in after)) console.log(`- ${k} (gone)`);
    else console.log(`~ ${k}\n${firstDifference(before[k], after[k])}`);
  }
  console.log(`${keys.length} outputs compared, ${diffs.length} differ.`);
  process.exit(diffs.length ? 1 : 0);
} else if (args[0]) {
  const snap = snapshot();
  writeFileSync(args[0], JSON.stringify(snap));
  console.log(`${Object.keys(snap).length} outputs written to ${args[0]}.`);
} else {
  console.log("usage: node tools/outputs.mjs <out.json> | --against <out.json>");
  process.exit(2);
}
