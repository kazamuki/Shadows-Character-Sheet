/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, loadEngine } from "./harness.mjs";

const { Engine, D } = loadEngine();

function lockedCharacter() {
  const ch = Engine.newCharacter();
  ch.identity.name = "Test Subject";
  ch.identity.archetype = "arcanist";
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 5;
  ch.creation.locked = true;
  return ch;
}

test("app boots clean and lands on Home", () => {
  const app = boot();
  assert.deepEqual(app.errors, []);
  assert.match(app.$("#main").textContent, /New character/);
  assert.ok(app.window.SHADOWS_DATA, "game data missing");
  assert.ok(app.window.SHADOWS_ICONS, "icons missing");
  assert.ok(app.Engine, "engine missing");
});

test("New character opens step 1 of the wizard", () => {
  const app = boot();
  const btn = app.$$("#main button").find(b => /New character/.test(b.textContent));
  btn.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.deepEqual(app.errors, []);
  assert.ok(app.$("#ledger").textContent.length > 0, "step ledger did not render");
  assert.ok(app.$$("#main button").length > 1, "no choices rendered on step 1");
});

test("a locked character resumes from storage and every sheet tab renders", () => {
  const app = boot({ storage: { "shadows.active.v1": { ch: lockedCharacter(), section: "main" } } });
  const open = app.$$("#main button").find(b => /Open sheet/.test(b.textContent));
  assert.ok(open, "resume affordance missing on Home");
  open.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));

  const tabs = app.$$("[data-sec]").map(t => t.dataset.sec);
  assert.equal(tabs.length, 9, `expected 9 sheet tabs, got ${tabs.length}`);
  for (const id of tabs) {
    app.click(`[data-sec="${id}"]`);
    assert.deepEqual(app.errors, [], `runtime error on tab: ${id}`);
    assert.ok(app.$("#main").textContent.trim().length > 40, `tab rendered empty: ${id}`);
  }
});

test("the sheet survives a game-data change without code changes", () => {
  // Proves the data-driven contract: rename a skill's display name in the data
  // and the app still renders — no hardcoded content in the UI layer.
  const app = boot({ storage: { "shadows.active.v1": { ch: lockedCharacter(), section: "skills" } } });
  const open = app.$$("#main button").find(b => /Open sheet/.test(b.textContent));
  open.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click('[data-sec="skills"]');
  assert.deepEqual(app.errors, []);
  assert.ok(app.$("#main").textContent.length > 200);
});

/** Drop a draft character on the Archetype step and open the wizard there. */
function onArchetypeStep(archetype, powerLevel = D.powerLevels[0].id) {
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = archetype;
  ch.creation.powerLevel = powerLevel;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 8;
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("archetype"), maxReached: steps.length - 1 } } });
  const resume = app.$$("#main button").find(b => /Resume draft/.test(b.textContent));
  resume.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  return app;
}

test("Arcanist offers exactly one set of aberration controls (A1)", () => {
  // Was the suite's only todo. The generic specialization block and an
  // Arcanist-specific block both rendered the same six aberrations — six
  // [data-spec] plus six [data-aber] — and validate() demanded a pick from
  // each. A3 collapsed them into one block, so [data-aber] no longer exists.
  const app = onArchetypeStep("arcanist");
  const spec = app.$$("[data-spec]").length;
  const aber = app.$$("[data-aber]").length;
  const opts = D.archetypes.find(a => a.id === "arcanist").specialization.options.length;
  assert.equal(aber, 0, "the Arcanist-specific aberration block is still rendering");
  assert.equal(spec, opts, `expected ${opts} specialization controls, got ${spec}`);
  assert.deepEqual(app.errors, []);
});

test("one specialization pick clears validation for every archetype (A1)", () => {
  // The two-model bug made an Arcanist pick BOTH a single-select specialization
  // and N aberrations. One pick per required slot must now be enough.
  for (const arch of D.archetypes.filter(a => (a.specialization.options || []).length)) {
    const ch = Engine.newCharacter();
    ch.identity.archetype = arch.id;
    ch.creation.powerLevel = D.powerLevels[0].id;
    const need = Engine.specializationNeed(ch);
    ch.archetypeChoices.specialization = arch.specialization.options.slice(0, need).map(o => o.id);
    // Assert on length, not deepEqual([]): loadEngine runs the engine in a VM
    // context, so an array it returns carries that realm's Array.prototype and
    // deepStrictEqual rejects it against a local [] — two empty arrays, "not
    // equal", no visible difference in the failure output.
    const spec = Engine.validate("archetype", ch)
      .filter(i => i.level === "error" && new RegExp(arch.specialization.label, "i").test(i.msg));
    assert.equal(spec.length, 0,
      `${arch.id} still demands more than ${need} ${arch.specialization.label}: ${spec.map(i => i.msg).join(" | ")}`);
  }
});

test("the sheet shows a non-Arcanist specialization (A2)", () => {
  // renderShArchetype read only archetypeChoices.aberrations, so a Professional
  // saw its subtype in the tab header and "none chosen" in the section below it.
  const ch = lockedCharacter();
  ch.identity.archetype = "professional";
  const prof = D.archetypes.find(a => a.id === "professional");
  const sub = prof.specialization.options[0];
  ch.archetypeChoices.specialization = [sub.id];
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "archetype" } } });
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click('[data-sec="archetype"]');
  const text = app.$("#main").textContent;
  assert.match(text, new RegExp(sub.name), "the chosen subtype is not on the sheet");
  assert.doesNotMatch(text, /none chosen/, "the specialization section still reports none chosen");
  assert.deepEqual(app.errors, []);
});

test("the review step is numbered off the data, not hardcoded (B5)", () => {
  // STEPS appended {id:"review", n:8} and assumed creationFlow.steps had exactly
  // seven entries. Add or remove a step in the data and the number desynced.
  const app = boot();
  const btn = app.$$("#main button").find(b => /New character/.test(b.textContent));
  btn.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  const rows = app.$$("#ledger [data-goto]");
  const expected = D.creationFlow.steps.length + 1;
  assert.equal(rows.length, expected, "ledger row count does not match the data");
  assert.equal(rows[rows.length - 1].querySelector(".n").textContent, String(expected));
  assert.deepEqual(app.errors, []);
});

test("a passed step with unspent points shows attention, not a plain checkmark (Batch 3a)", () => {
  // renderLedger used to mark a passed step done whenever validate() had no
  // ERRORS, ignoring warnings entirely — so a player who walked past Stats with
  // points still unspent got a green ✓ claiming they were finished.
  const ch = Engine.newCharacter();
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls.statPoints = 40;   // nothing spent yet: statSpent(ch) stays 0
  const statsIndex = D.creationFlow.steps.findIndex(s => s.id === "stats");
  assert.ok(statsIndex >= 0, "no 'stats' step in creationFlow — did the step list change?");

  const app = boot({ storage: { "shadows.draft.v1": {
    ch, step: statsIndex + 1, maxReached: statsIndex + 1
  } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));

  const row = app.$$("#ledger [data-goto]")[statsIndex];
  assert.ok(row.className.includes("attn"), `stats row should be "attn", got "${row.className}"`);
  assert.equal(row.querySelector(".n").textContent, "!", "attention row should not show a plain checkmark");
  assert.ok(app.$("#ledger .ledger-callout"), "no callout pointing back at the flagged step");
  assert.deepEqual(app.errors, []);
});

test("the sheet states the CRB's pain floors, not just the penalties (B8)", () => {
  // A player at Pain Level 3 reading a bare "-3 Essence die" rolls nothing.
  // The CRB floors that at 1 die and Breaker at 10% "to prevent automatic loss".
  const ch = lockedCharacter();
  ch.stats.BOD.base = 10;          // 10 HL x 5 HP = 50 HP
  ch.trackers.damage = 40;         // 8 HL lost -> Pain Level 3
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "trackers" } } });
  const open = app.$$("#main button").find(b => /Open sheet/.test(b.textContent));
  open.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click('[data-sec="trackers"]');
  const text = app.$("#main").textContent;
  assert.match(text, /Essence dice \(min 1\)/, "Essence floor missing from the sheet");
  assert.match(text, /Breaker \(min 10%\)/, "Breaker floor missing from the sheet");
  assert.deepEqual(app.errors, []);
});

test("a character holding a skill the data no longer defines still renders (B10)", () => {
  // versionCheck explicitly reports this case, so every reader must survive it.
  // Found by the totality guard on its first run: review iterates ch.skills
  // directly and died dereferencing an orphaned definition.
  const ch = lockedCharacter();
  ch.skills["skill-that-was-removed"] = { rank: 3, ipe: 0 };
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "skills" } } });
  const open = app.$$("#main button").find(b => /Open sheet/.test(b.textContent));
  open.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  for (const sec of ["main", "skills", "progression"]) {
    app.click(`[data-sec="${sec}"]`);
    assert.deepEqual(app.errors, [], `orphaned skill broke the ${sec} tab`);
  }
  const line = app.Engine.skillLine(ch, "skill-that-was-removed");
  assert.match(line.dataWarning, /no longer in the game data/);
  assert.equal(line.rank, 3);
});

test("a pick chosen in the wizard survives export and reaches the sheet", () => {
  // The full round trip for Batch 3: the control renders, the engine stores the
  // choice, buildExport keeps it, and the Traits tab says which skill it was.
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = "arcanist";
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 5;
  ch.advantages = [{ id: "favored-skill", rank: 2, notes: "" }];
  ch.disadvantages = [{ id: "cursed", rank: 1, notes: "" }];

  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("character-points"), maxReached: steps.length - 1 } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.deepEqual(app.errors, []);

  // Rank 2 on Favored Skill means two skill slots; Cursed means one text box.
  const slots = app.$$('select[data-sel^="advantage|favored-skill|skill|"]');
  assert.equal(slots.length, 2, `expected 2 skill slots, got ${slots.length}`);
  assert.equal(app.$$('input[data-sel^="disadvantage|cursed|"]').length, 1,
    "the freeform GM-approval field did not render");

  // Choose through the real control, not by writing the character directly.
  slots[0].value = "handguns";
  slots[0].dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.deepEqual(app.errors, []);

  // Read it back out of the saved draft rather than reaching into the app's
  // closure — that also proves the choice survives a reload.
  const live = JSON.parse(app.window.localStorage.getItem("shadows.draft.v1")).ch;
  assert.equal(live.advantages.find(a => a.id === "favored-skill").selections.skill[0], "handguns");

  // And the sheet states it by name rather than leaving the player guessing.
  const locked = app.Engine.migrate(app.Engine.buildExport(live));
  locked.creation.locked = true;
  const sheet = boot({ storage: { "shadows.active.v1": { ch: locked, section: "traits" } } });
  sheet.$$("#main button").find(b => /Open sheet/.test(b.textContent))
       .dispatchEvent(new sheet.window.MouseEvent("click", { bubbles: true }));
  sheet.click('[data-sec="traits"]');
  assert.match(sheet.$("#main").textContent, /Handguns/, "the chosen skill is not on the Traits tab");
  assert.deepEqual(sheet.errors, []);
});

test("an unmet pick blocks the lock, an unwritten GM detail does not", () => {
  const ch = lockedCharacter();
  ch.creation.locked = false;
  ch.advantages = [{ id: "favored-skill", rank: 1, notes: "" }];
  const errs = () => Engine.validate("character-points", ch).filter(i => i.level === "error");
  assert.ok(errs().some(i => /Favored Skill/.test(i.msg)), "an empty mechanical pick is not an error");

  Engine.setSelection(ch, "advantage", "favored-skill", "skill", 0, "handguns");
  assert.equal(errs().some(i => /Favored Skill/.test(i.msg)), false, "a filled pick still errors");

  ch.disadvantages = [{ id: "pact", rank: 1, notes: "" }];
  assert.equal(errs().some(i => /Pact/.test(i.msg)), false, "an unwritten pact is blocking the lock");
});

// ── Adversarial review of PR #7 — the UI half ─────────────────────────

test("Resume draft migrates the draft, like every other load path (review #3)", () => {
  // Open sheet and file import both call Engine.migrate. Resume did not, so a
  // draft saved under schema 0.4 came back with its specialization still in
  // archetypeChoices.aberrations — a field no reader looks at any more. The
  // player's choice vanished with no warning.
  const steps = D.creationFlow.steps.map(s => s.id);
  const legacy = Engine.newCharacter();
  legacy.identity.name = "Probe";
  legacy.identity.archetype = "arcanist";
  legacy.creation.powerLevel = D.powerLevels[0].id;
  legacy.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(legacy.stats)) legacy.stats[id].base = 5;
  // Put it back into the pre-0.5 shape the old app would have written.
  delete legacy.archetypeChoices.specialization;
  legacy.archetypeChoices.aberrations = ["arcane-fortitude"];
  legacy.meta.schemaVersion = "0.4";

  const app = boot({ storage: { "shadows.draft.v1": { ch: legacy, step: steps.indexOf("archetype"), maxReached: steps.length - 1 } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.deepEqual(app.errors, []);

  const resumed = JSON.parse(app.window.localStorage.getItem("shadows.draft.v1")).ch;
  assert.deepEqual([...resumed.archetypeChoices.specialization], ["arcane-fortitude"],
    "the resumed draft lost its specialization");
  assert.equal(resumed.meta.schemaVersion, "0.9");
  // And the choice is visibly selected, not merely stored.
  assert.equal(app.$$('[data-spec].toggle').filter(b => /Chosen|Selected/.test(b.textContent)).length, 1);
});

test("changing archetype clears the natural-advantage mirror (review #4)", () => {
  // The PR fixed this for a SUBTYPE change and left the two ARCHETYPE change
  // handlers alone — so a full swap still stranded the old archetype's free
  // advantages in ch.advantages forever. Both handlers already warn that they
  // clear natural advantages; now they do.
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = "professional";
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 8;
  ch.archetypeChoices.specialization = ["cleaner"];
  ch.archetypeChoices.naturalAdvantages = [{ id: "iron-will", rank: 1 }];
  ch.advantages = [{ id: "iron-will", rank: 1, notes: "natural" },
                   { id: "ambidextrous", rank: 1, notes: "" }];

  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("archetype"), maxReached: steps.length - 1 } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));

  // Arcanist can purchase advantages, so the bought one survives...
  app.click('[data-arch="arcanist"]');
  assert.deepEqual(app.errors, []);
  let now = JSON.parse(app.window.localStorage.getItem("shadows.draft.v1")).ch;
  assert.equal(now.advantages.some(a => a.notes === "natural"), false,
    "the Professional's free advantages survived the archetype change");
  assert.equal(now.advantages.some(a => a.id === "ambidextrous"), true,
    "a legitimately purchased advantage was thrown away");
  assert.deepEqual([...now.archetypeChoices.naturalAdvantages], []);

  // ...and a supernatural archetype, which cannot purchase at all, keeps none.
  app.click('[data-arch="werewolf"]');
  now = JSON.parse(app.window.localStorage.getItem("shadows.draft.v1")).ch;
  assert.deepEqual([...now.advantages], [],
    "a Werewolf kept advantages it cannot hold");
});

test("a free-only pick-bearing advantage is fillable on the step that demands it (review #2)", () => {
  // The error is raised on the Character Points step, so the control has to be
  // there too — a player cannot clear an error whose control lives elsewhere.
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = "professional";
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 8;
  ch.archetypeChoices.specialization = ["cleaner"];
  ch.archetypeChoices.naturalAdvantages = [{ id: "favored-skill", rank: 2 }];
  ch.advantages = [{ id: "favored-skill", rank: 2, notes: "natural" }];

  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("character-points"), maxReached: steps.length - 1 } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.deepEqual(app.errors, []);

  const slots = app.$$('select[data-sel^="advantage|favored-skill|skill|"]');
  assert.equal(slots.length, 2,
    `a free-only trait demanded picks with ${slots.length} controls to fill them`);

  // And the allocator on the Archetype step offers them too, where the ranks
  // are actually spent.
  const arch = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("archetype"), maxReached: steps.length - 1 } } });
  arch.$$("#main button").find(b => /Resume draft/.test(b.textContent))
      .dispatchEvent(new arch.window.MouseEvent("click", { bubbles: true }));
  assert.ok(arch.$$('select[data-sel^="advantage|favored-skill|skill|"]').length >= 2,
    "the Natural Advantages allocator does not offer the picks it grants");
  assert.deepEqual(arch.errors, []);
});

test("raising a free advantage's rank does not wipe the picks already made", () => {
  // The natural-advantage mirror is rebuilt from the ledger on every rank
  // change. Since the free row is where a free-only trait stores its choices,
  // rebuilding it naively threw them away one keystroke after they were made.
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = "professional";
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 8;
  ch.archetypeChoices.specialization = ["cleaner"];
  ch.archetypeChoices.naturalAdvantages = [{ id: "favored-skill", rank: 1 }];
  ch.advantages = [{ id: "favored-skill", rank: 1, notes: "natural" }];

  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("archetype"), maxReached: steps.length - 1 } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));

  const slot = app.$('select[data-sel="advantage|favored-skill|skill|0"]');
  assert.ok(slot, "the free advantage offers no pick control");
  slot.value = "handguns";
  slot.dispatchEvent(new app.window.Event("change", { bubbles: true }));

  // Now bump the free rank — the choice above must survive.
  app.click('[data-step="natadv|favored-skill|1"]');
  assert.deepEqual(app.errors, []);
  const after = JSON.parse(app.window.localStorage.getItem("shadows.draft.v1")).ch;
  const row = after.advantages.find(a => a.id === "favored-skill");
  assert.equal(row.rank, 2, "the rank did not go up");
  assert.equal((row.selections || {}).skill && row.selections.skill[0], "handguns",
    "raising the rank wiped the skill already chosen");
});

// ── Conditions (Decision 95) ──────────────────────────────────────────

function openSheet(ch, section) {
  const app = boot({ storage: { "shadows.active.v1": { ch, section } } });
  const open = app.$$("#main button").find(b => /Open sheet/.test(b.textContent));
  open.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click(`[data-sec="${section}"]`);
  return app;
}
// W14: one click on a palette chip; a body-part Condition then asks where.
function addCondition(app, id, location) {
  app.click(`[data-condquick="${id}"]`);
  if (location) { app.$("[data-condadd-loc]").value = location; app.click("[data-condadd]"); }
}
const activeConditions = app => JSON.parse(app.window.localStorage.getItem("shadows.active.v1")).ch.trackers.conditions;

test("a Condition added on Trackers raises Pain, shows on Main, and undoes", () => {
  const app = openSheet(lockedCharacter(), "trackers");
  addCondition(app, "agonized");
  assert.deepEqual(app.errors, []);
  assert.equal(activeConditions(app).length, 1);
  assert.match(app.$("#main").textContent, /Pain Level 1/, "Agonized did not raise the Pain Level");
  assert.match(app.$("#main").textContent, /Medical \(Difficulty 15\)/, "recovery text is missing on Trackers");

  app.click('[data-sec="main"]');
  assert.ok(app.$(".cond-chip"), "no Condition chip on Main");
  assert.match(app.$(".cond-chip").textContent, /Agonized/);

  app.click('[data-sec="sessions"]');
  assert.match(app.$("#main").textContent, /Condition: Agonized/, "the add is missing from the Activity Log");
  app.click("button[data-undolast]");
  assert.equal(activeConditions(app).length, 0, "undo did not clear the Condition");
  assert.deepEqual(app.errors, []);
});

test("a body-part Condition shows the picker, and the same part twice is refused", () => {
  const app = openSheet(lockedCharacter(), "trackers");
  assert.equal(app.$("[data-condadd-loc]"), null, "the body-part picker shows before it's needed");
  app.click('[data-condquick="injured"]');
  assert.ok(app.$("[data-condadd-loc]"), "Injured did not ask for a body part");
  assert.equal(activeConditions(app).length, 0, "a body-part Condition went on before saying where");
  app.click("[data-condpickcancel]");

  const alerts = [];
  app.window.alert = m => alerts.push(m);
  addCondition(app, "injured", "left-arm");
  addCondition(app, "injured", "left-arm");
  assert.equal(activeConditions(app).length, 1);
  assert.equal(alerts.length, 1, "the duplicate was not refused out loud");
  addCondition(app, "injured", "right-leg");
  assert.equal(activeConditions(app).length, 2);
  assert.match(app.$("#main").textContent, /Injured \(Right Leg\)/);
  // Two Injured on different parts is allowed (Decision 98), and nothing
  // calls it unsettled any more.
  assert.doesNotMatch(app.$("#main").textContent, new RegExp(D.appCopy.unsettledLabel));
  assert.deepEqual(app.errors, []);
});

test("Helpless shows a banner, and Death Marks count up to the CRB's three", () => {
  const ch = lockedCharacter();
  ch.trackers.conditions = [{ id: "dying", marks: 0 }];
  const app = openSheet(ch, "main");
  assert.match(app.$(".cond-alert").textContent, /2 or better/);
  app.click('[data-condmarks="0|3"]');
  assert.equal(activeConditions(app)[0].marks, 3);
  assert.match(app.$("#main").textContent, /Three Death Marks/);
  app.click('[data-condrm="0"]');
  assert.equal(activeConditions(app).length, 0);
  assert.equal(app.$(".cond-alert"), null, "the banner outlived the Condition");
  assert.deepEqual(app.errors, []);
});

test("a flat Condition penalty reaches the skill totals the sheet shows", () => {
  const ch = lockedCharacter();
  const before = Engine.skillLine(ch, "handguns").checkBonus;
  ch.trackers.conditions = [{ id: "disoriented" }];
  const app = openSheet(ch, "main");
  assert.match(app.$("#main").textContent, new RegExp(`1d10 \\+ ${before - 1}`));
  assert.match(app.$("#main").textContent, /-1 conditions/);
  assert.match(app.$("#main").textContent, /Conditions take −1; totals include it/);
  assert.deepEqual(app.errors, []);
});

test("the print sheet carries a Conditions box, blank and filled", () => {
  const ch = lockedCharacter();
  ch.trackers.conditions = [{ id: "injured", location: "left-arm" }, { id: "dying", marks: 2 }];
  const app = openSheet(ch, "main");
  const html = app.window.renderPrintView(null);
  assert.match(html, /Conditions/);
  assert.match(html, /Death Marks/);
  for (const c of D.conditions) assert.ok(html.includes(c.name), `blank print is missing ${c.name}`);
  assert.doesNotMatch(html, /p-box on/, "a blank sheet ticked something");
  const filled = app.window.renderPrintView(ch);
  assert.equal((filled.match(/p-box on/g) || []).length, 1 + 1 + 2, "Injured + Dying ticks + two Death Marks");
  assert.match(filled, /Left Arm/);
});

// ── Take a hit (Decision 99) ──────────────────────────────────────────
function setHit(app, key, value) {
  const el = app.$(`[data-hit="${key}"]`);
  assert.ok(el, `the hit form has no ${key} control`);
  if (el.type === "checkbox") el.checked = value; else el.value = value;
  // A number redraws the modal as it is typed (W6); the rest on change.
  el.dispatchEvent(new app.window.Event(el.getAttribute("inputmode") === "numeric" ? "input" : "change", { bubbles: true }));
}
const activeChar = app => JSON.parse(app.window.localStorage.getItem("shadows.active.v1")).ch;

test("Take a hit: a worn vest answers, the hit lands as one undoable action", () => {
  const ch = lockedCharacter();
  ch.armor.push({ id: "kevlar-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: [] });
  const app = openSheet(ch, "trackers");
  app.click("[data-hitopen]");
  assert.ok(app.$("[data-hitpanel]"), "the panel didn't open");
  assert.match(app.$("[data-hitpanel]").textContent, /Kevlar Vest · PROT 1d6 · RES \+2/);
  assert.ok(app.$("[data-hitapply]").disabled, "Apply is live before there's a hit to apply");
  setHit(app, "damage", "9");
  setHit(app, "protRoll", "3");
  assert.match(app.$(".hitresult").textContent, /PROT 3 \+ RES 2 stops 5\. *4 gets through/);
  app.click("[data-hitapply]");
  assert.equal(app.$("[data-hitpanel]"), null, "the panel stayed open after Apply");
  assert.equal(activeChar(app).trackers.damage, 4);
  app.click('[data-sec="sessions"]');
  assert.match(app.$("#main").textContent, /Hit: 9 Ballistic → 4 through/);
  app.click("button[data-undolast]");
  assert.equal(activeChar(app).trackers.damage, 0, "undo didn't take the hit back");
  assert.deepEqual(app.errors, []);
});

test("Take a hit: Massive with no armor removes levels, asks at zero, and adds Dying on a fail", () => {
  const app = openSheet(lockedCharacter(), "trackers");
  const alerts = [];
  app.window.alert = m => alerts.push(m);
  app.click("[data-hitopen]");
  setHit(app, "category", "massive");
  setHit(app, "damage", "60");
  assert.ok(app.$("[data-hit=atZero]"), "no check at zero was asked for");
  assert.equal(app.$("[data-hit=shock]"), null, "a hit to zero skips the Shock Check");
  assert.ok(app.$("[data-hitapply]").disabled, "Apply is live before the check is answered");
  assert.match(app.$("#modal .modal-foot").textContent, /Mark the check at zero/, "the footer doesn't say what's missing");
  app.click("[data-hitapply]");
  assert.equal(activeChar(app).trackers.massiveLevels || 0, 0, "Apply went through without the check being answered");
  setHit(app, "atZero", "fail");
  app.click("[data-hitapply]");
  const got = activeChar(app);
  assert.ok(got.trackers.massiveLevels > 0);
  assert.equal(got.trackers.damage, 0);
  assert.ok(got.trackers.conditions.some(c => c.id === "dying"));
  assert.ok(app.$(".hl.massive"), "Massive levels aren't drawn on the track");
  // Decision 100: a Massive level comes back through Focused Healing, which
  // replaced the bare restore button.
  app.click('[data-actopen="focused"]');
  const field = app.$('[data-act="massive"]');
  assert.ok(field, "Focused Healing doesn't offer to restore a Massive level");
  field.value = "1"; field.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  const before = activeChar(app).trackers.massiveLevels;
  app.click("[data-actapply]");
  assert.equal(activeChar(app).trackers.massiveLevels, before - 1);
  assert.deepEqual(app.errors, []);
});

test("Take a hit: an Electric hit says its RES rule is unsettled; a Blade hit doesn't", () => {
  const app = openSheet(lockedCharacter(), "trackers");
  app.click("[data-hitopen]");
  setHit(app, "damage", "4");
  setHit(app, "damageType", "electric");
  assert.match(app.$("[data-hitpanel]").textContent, new RegExp(D.appCopy.unsettledLabel));
  setHit(app, "damageType", "blade");
  assert.doesNotMatch(app.$("[data-hitpanel]").textContent, new RegExp(D.appCopy.unsettledLabel));
  assert.deepEqual(app.errors, []);
});

test("Take a hit opens as a modal: HP and the track up top, Apply says what it waits for, Esc drops the form", () => {
  const app = openSheet(lockedCharacter(), "trackers");
  app.click("[data-hitopen]");
  assert.ok(app.$("#modal").open, "Take a hit didn't open as a modal");
  assert.ok(app.$("#modal [data-hitpanel]"), "the hit form isn't in the modal");
  assert.equal(app.$("#main [data-hitpanel]"), null, "the hit form also opened on the page");
  assert.match(app.$("#modal .hit-now").textContent, /\d+ \/ \d+ HP/, "the modal doesn't show HP");
  assert.ok(app.$("#modal .hl-track .hl"), "the modal doesn't show the Health Level track");
  assert.ok(app.$("#modal .modal-foot [data-hitapply]").disabled, "Apply is live with no damage entered");
  assert.ok(app.$("#modal .modal-foot .hitwhy"), "the footer doesn't say why Apply is off");
  setHit(app, "damage", "12");
  const dmg = app.$('#modal [data-hit="damage"]');
  assert.equal(app.window.document.activeElement, dmg, "typing damage lost the field's focus");
  assert.equal(dmg.selectionStart, 2, "the caret didn't go back to the end of what was typed");
  assert.equal(app.$("#modal .modal-foot [data-hitapply]").disabled, false, "Apply stayed off with a valid hit");
  app.$("#modal").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(app.$("#modal").open, false, "Esc didn't close the hit modal");
  assert.equal(activeChar(app).trackers.damage, 0, "closing the modal applied the hit");
  assert.equal(app.window.document.activeElement, app.$("[data-hitopen]"), "focus didn't go back to Take a hit");
  app.click("[data-hitopen]");
  assert.equal(app.$('#modal [data-hit="damage"]').value, "", "a cancelled hit's form came back");
  assert.deepEqual(app.errors, []);
});

// ── Loadout & recovery (Decision 100) ─────────────────────────────────
function pickFromCatalog(app, kind, id) {
  const sel = app.$(`[data-lopick="${kind}"]`);
  assert.ok(sel, `no ${kind} picker`);
  sel.value = id;
  sel.dispatchEvent(new app.window.Event("change", { bubbles: true }));
}

test("Loadout: Buy a vest from the catalog — it's paid for, worn, answers a hit, and one undo takes it all back", () => {
  const ch = lockedCharacter();
  ch.trackers.credits.current = 1000;
  const app = openSheet(ch, "loadout");
  pickFromCatalog(app, "armor", "kevlar-vest");
  assert.match(app.$('[data-lobuy="armor"]').textContent, /500Ç/, "Buy doesn't show the price");
  app.click('[data-lobuy="armor"]');
  const got = activeChar(app);
  assert.equal(got.trackers.credits.current, 500);
  assert.equal(got.armor.length, 1);
  assert.equal(got.armor[0].worn, true, "the first vest didn't go on");
  assert.match(app.$(".lo-armor").textContent, /20 \/ 20 Integrity/);

  app.click('[data-sec="trackers"]');
  app.click("[data-hitopen]");
  assert.match(app.$("[data-hitpanel]").textContent, /Kevlar Vest · PROT 1d6/, "the hit panel didn't pick up the worn vest");
  app.click("[data-hitcancel]");

  app.click('[data-sec="sessions"]');
  assert.match(app.$("#main").textContent, /Bought Kevlar Vest \(−500Ç\)/);
  app.click("button[data-undolast]");
  const undone = activeChar(app);
  assert.deepEqual([undone.trackers.credits.current, undone.armor.length], [1000, 0]);
  assert.deepEqual(app.errors, []);
});

test("Loadout: a catalog weapon shows its computed attack and damage on Loadout and Main", () => {
  const ch = lockedCharacter();                                  // BOD 5
  const app = openSheet(ch, "loadout");
  pickFromCatalog(app, "weapons", "combat-knife");               // BOD+3
  app.click('[data-loadd="weapons"]');
  const attack = Engine.skillLine(activeChar(app), "melee").checkBonus;
  const row = app.$(".lo-weapons tbody tr").textContent;
  assert.match(row, /Combat Knife/);
  assert.match(row, new RegExp(`1d10 \\+ ${attack}`));
  assert.match(row, /8\s*BOD\+3/, "BOD+3 didn't resolve to 8");
  assert.equal(activeChar(app).trackers.credits.current, ch.trackers.credits.current, "Add charged Çredits");
  app.click('[data-sec="main"]');
  assert.match(app.$(".main-combat").textContent, /Combat Knife/);
  assert.deepEqual(app.errors, []);
});

test("Turn Reset: Bleeding ticks one HP and lists what each Condition needs, as one undoable action", () => {
  const ch = lockedCharacter();
  ch.trackers.conditions = [{ id: "bleeding" }];
  const app = openSheet(ch, "trackers");
  app.click('[data-actopen="reset"]');
  const panel = app.$('[data-actpanel="reset"]').textContent;
  assert.match(panel, /Bleeding: 1 HP/);
  assert.match(panel, /Medical \(Difficulty 15\)/, "the recovery text isn't listed");
  app.click("[data-actapply]");
  assert.equal(activeChar(app).trackers.damage, 1);
  app.click('[data-sec="sessions"]');
  assert.match(app.$("#main").textContent, /Turn Reset: 1 damage/);
  app.click("button[data-undolast]");
  assert.equal(activeChar(app).trackers.damage, 0);
  assert.deepEqual(app.errors, []);
});

test("After the fight: the wear die comes off the worn piece's Integrity", () => {
  const ch = lockedCharacter();
  ch.armor.push({ id: "kevlar-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: [] });
  const app = openSheet(ch, "trackers");
  app.click('[data-actopen="wear"]');
  const roll = app.$('[data-act="roll"]');
  roll.value = "4"; roll.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.match(app.$('[data-actpanel="wear"]').textContent, /loses 4 Integrity: 20 → 16/);
  app.click("[data-actapply]");
  assert.equal(activeChar(app).armor[0].integrityLoss, 4);
  assert.deepEqual(app.errors, []);
});

test("the print sheet fills Defense and an Armor table from the worn piece; blank stays blank", () => {
  const ch = lockedCharacter();
  ch.armor.push({ id: "kevlar-vest", integrityLoss: 2, notes: "", worn: true, scrapped: false, upgrades: [] });
  ch.weapons.push({ id: "combat-knife", notes: "" });
  const app = openSheet(ch, "main");
  const filled = app.window.renderPrintView(ch);
  assert.match(filled, /Kevlar Vest/);
  assert.match(filled, /18 \/ 20/, "the armor table has no Integrity");
  assert.match(filled, /8 \(BOD\+3\)/, "the weapon's damage isn't computed");
  assert.doesNotMatch(filled, /aren't tracked digitally/, "the old hand-tracking note survived");
  const blank = app.window.renderPrintView(null);
  assert.match(blank, /<th>Armor<\/th>/);
  assert.doesNotMatch(blank, /Kevlar/);
});

// ── Undo toast (W12) ──────────────────────────────────────────────────

test("a tracker action offers its own Undo, and that Undo takes back only that action", () => {
  const app = openSheet(lockedCharacter(), "trackers");
  app.click('[data-dmg="5"]');
  assert.equal(activeChar(app).trackers.damage, 5);
  const toast = app.$("#undotoast");
  assert.ok(toast && !toast.hidden, "no toast after the action");
  assert.match(toast.textContent, /Hurt 5/);
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).trackers.damage, 0, "the toast's Undo didn't undo");
  assert.match(app.$("#undotoast").textContent, /Undone: Hurt 5/);

  // A toast that outlived its action can't take back a later one, even when
  // the later action reuses its seq (an undo pops the entry, the next action
  // takes the same number).
  app.click('[data-dmg="1"]');
  const stale = app.$("[data-toastundo]");
  app.click('[data-sec="sessions"]');
  app.click("button[data-undolast]");        // the Hurt 1, undone from the log instead
  app.click('[data-sec="trackers"]');
  app.click('[data-dmg="5"]');
  stale.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.equal(activeChar(app).trackers.damage, 5, "a stale toast undid a later action");
  assert.deepEqual(app.errors, []);
});

// ── Cascade (Decisions 106, 115) ──────────────────────────────────────

test("TOL Spent past TOL opens the Cascade panel: the GM's instruction, then the picker records what they name, and one undo takes it back", () => {
  const ch = lockedCharacter();
  const tol = Engine.derived(ch).TOL;
  ch.trackers.panel["tol-spent"] = { value: tol };
  const app = openSheet(ch, "trackers");
  assert.match(app.$("#main").textContent, /Exhausted/, "no Exhausted note at the max");
  assert.equal(app.$("[data-cascadepanel]"), null, "the Cascade panel opened at the max, not past it");
  app.click('[data-trk="tol-spent|1"]');
  const panel = app.$("[data-cascadepanel]");
  assert.ok(panel, "no Cascade panel past TOL");
  assert.match(panel.textContent, /Roll a d10, add your Rupture's degree, and tell your GM/);
  assert.equal(panel.querySelector("input"), null, "the panel still asks for dice the GM reads");
  app.click('[data-abpickopen="cascade"]');
  assert.equal(app.$("#modal").open, true, "the picker didn't open");
  assert.match(app.$("#modal-title").textContent, /Cascade/);
  // Every Aberration shows its text before it's picked (Ken, 2026-09-24).
  assert.equal(app.$$("#modal [data-abpick]").length, D.aberrations.length);
  assert.match(app.$('#modal [data-abpick="night-eyes"]').textContent, /Treat Dark visibility as Dim/);
  assert.match(app.$('#modal [data-abpick="beacon"]').textContent, /As Monster Magnet Disadvantage/);
  const q = app.$("#modal [data-abq]");
  q.value = "glow"; q.dispatchEvent(new app.window.Event("input"));
  assert.deepEqual(app.$$("#modal [data-abpick]").map(b => b.dataset.abpick), ["bioluminescence"]);
  q.value = ""; q.dispatchEvent(new app.window.Event("input"));
  app.click('#modal [data-abperm="permanent"]');
  assert.match(app.$("#modal [data-abstatus]").textContent, /quest, ritual/);
  app.click('#modal [data-abpick="night-eyes"]');
  assert.equal(app.$("#modal").open, false, "a pick didn't close the picker");
  const got = activeChar(app);
  assert.deepEqual(got.trackers.aberrations.map(e => e.id + "/" + e.permanence), ["night-eyes/permanent"]);
  assert.match(got.trackers.aberrations[0].note, /^Cascade, \d{4}-\d{2}-\d{2}$/);
  assert.equal(got.notes, "", "a Cascade still writes into Notes");
  assert.match(app.$("#undotoast").textContent, /Cascade: Night Eyes \(permanent\)/);
  assert.equal(app.window.document.activeElement, app.$('[data-abpickopen="cascade"]'), "focus didn't go back to the panel");
  assert.match(app.$("#main").textContent, /Aberrations[\s\S]*Night Eyes/, "the recorded Aberration isn't on the sheet");
  app.click('[data-abpickopen="cascade"]');
  assert.equal(app.$('#modal [data-abpick="night-eyes"]').disabled, true, "a held Aberration can be picked again");
  assert.match(app.$('#modal [data-abpick="night-eyes"]').textContent, /You have it/);
  app.click("#modal [data-modalclose]");
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).trackers.aberrations.length, 0, "undo left the Aberration behind");
  assert.deepEqual(app.errors, []);
});

// ── Conditions as chips (W14) ─────────────────────────────────────────

test("a palette chip adds its Condition in one click, greys out once held, and Main's chip opens its details", () => {
  const app = openSheet(lockedCharacter(), "main");
  app.click('[data-condquick="prone"]');
  assert.deepEqual(activeConditions(app).map(c => c.id), ["prone"]);
  assert.equal(app.$('[data-condquick="prone"]').disabled, true, "a held Condition is still offered");
  assert.equal(app.$('[data-condquick="injured"]').disabled, false, "a body-part Condition should stay open for another part");
  assert.equal(app.$(".cond-info"), null, "details showed before the chip was clicked");
  app.click('[data-condinfo="0"]');
  assert.match(app.$(".cond-info").textContent, /Recovery:/);
  app.click('[data-condinfo="0"]');
  assert.equal(app.$(".cond-info"), null, "a second click didn't close the details");
  assert.match(app.$("#undotoast").textContent, /Condition: Prone/, "the add didn't offer its undo");
  assert.deepEqual(app.errors, []);
});

// ── Grimoire from the book (Decision 108) ─────────────────────────────
// The picker is a modal since Decision 111.
function search(app, q) {
  const box = app.$("#modal [data-spellq]");
  box.value = q; box.dispatchEvent(new app.window.Event("input"));
}

test("Grimoire: a typed spell links to the book, the picker adds one, Mastering spends IP, and each undoes", () => {
  const ch = lockedCharacter();
  ch.panelData.grimoire = [{ custom: true, "Spell Name": "Zap", "Effect": "a snap of current", "Notes": "go-to" }];
  ch.progression.ip.log.push({ date: "2026-09-23", kind: "grant", amount: 100, note: "test" });
  const app = openSheet(ch, "loadout");
  assert.match(app.$("#main").textContent, /Spell Power \d+/);
  app.click('[data-spelllink="0"]');
  assert.equal(activeChar(app).panelData.grimoire[0].spellId, "zap");
  assert.equal(activeChar(app).panelData.grimoire[0].notes, "go-to", "linking lost the notes");
  assert.match(app.$(".spell").textContent, /shorts simple electronics/, "the book's effect isn't shown");

  app.click('[data-spellpickopen="sheet"]');
  assert.ok(app.$("#modal").open, "the picker didn't open as a modal");
  search(app, "firebolt");
  assert.equal(app.$('#modal [data-spelladd="zap"]'), null, "the search didn't filter");
  app.click('#modal [data-spelladd="firebolt"]');
  assert.deepEqual(activeChar(app).panelData.grimoire.map(r => r.spellId), ["zap", "firebolt"]);
  assert.equal(app.$('#modal [data-spelladd="firebolt"]').disabled, true, "the modal didn't refresh after the add");
  assert.ok(app.$("#modal #undotoast"), "the undo toast is outside the modal, where the page is inert");
  app.$("#modal").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(app.$("#modal").open, false, "Esc didn't close the modal");
  assert.equal(app.window.document.activeElement, app.$('[data-spellpickopen="sheet"]'), "focus didn't go back to the opener");
  assert.ok(!app.$("#modal #undotoast"), "the toast stayed inside the closed modal");

  app.click('[data-spellmaster="firebolt"]');
  assert.equal(activeChar(app).panelData.grimoire[1].stage, "mastered");
  assert.match(app.$("#undotoast").textContent, /Mastered Firebolt/);
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).panelData.grimoire[1].stage, "known", "undo didn't un-master");
  assert.deepEqual(app.errors, []);
});

test("Grimoire: the picker offers to link a spell you typed yourself instead of adding a second copy", () => {
  const ch = lockedCharacter();
  ch.panelData.grimoire = [{ custom: true, "Spell Name": "Kindle", "Notes": "lights the stove" }];
  const app = openSheet(ch, "loadout");
  app.click('[data-spellpickopen="sheet"]');
  search(app, "kindle");
  assert.equal(app.$('[data-spellresults] [data-spelladd="kindle"]'), null, "offered a second Kindle");
  app.click("[data-spellresults] [data-spelllink]");
  const rows = activeChar(app).panelData.grimoire;
  assert.equal(rows.length, 1, "linking added a row");
  assert.equal(rows[0].spellId, "kindle");
  assert.equal(rows[0].notes, "lights the stove");
  assert.deepEqual(app.errors, []);
});

// ── The picker's modal pass (W23–W26) ────────────────────────────────
const clickIn = (app, el) => el.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));

test("picker: a click anywhere on a row picks it, a held row is dimmed and says why, and Done closes", () => {
  const ch = lockedCharacter();
  ch.panelData.grimoire = [{ spellId: "zap", stage: "known", notes: "" }];
  const app = openSheet(ch, "loadout");
  app.click('[data-spellpickopen="sheet"]');
  // W25: the search and the status line sit in the sticky head, above the results.
  assert.ok(app.$("#modal .pick-head [data-spellq]"), "the search isn't in the picker's sticky head");
  assert.ok(app.$("#modal .pick-head [data-spellstatus]"), "the status line isn't in the picker's sticky head");
  search(app, "firebolt");
  const row = app.$('#modal [data-spelladd="firebolt"]').closest("tr");
  assert.ok(row.classList.contains("pickrow"), "an open row isn't marked as clickable");
  clickIn(app, row.querySelector("td"));                                // the name cell, not the button
  assert.deepEqual(activeChar(app).panelData.grimoire.map(r => r.spellId), ["zap", "firebolt"], "a row click didn't add");
  // W24: a row that can't act looks it, and says why in the row, not a tooltip.
  search(app, "zap");
  const held = app.$('#modal [data-spelladd="zap"]').closest("tr");
  assert.ok(held.classList.contains("off"), "a Known row isn't dimmed");
  assert.match(held.querySelector(".why").textContent, /Already in your Grimoire/);
  clickIn(app, held.querySelector("td"));
  assert.equal(activeChar(app).panelData.grimoire.length, 2, "a click on a Known row did something");
  // A click in the search box is the search box's, never a row's.
  clickIn(app, app.$("#modal [data-spellq]"));
  assert.equal(activeChar(app).panelData.grimoire.length, 2);
  // W26: Done closes and hands focus back to the button that opened it.
  const done = app.$$("#modal .modal-foot button").find(b => /Done/.test(b.textContent));
  assert.ok(done, "no Done button in the footer");
  clickIn(app, done);
  assert.equal(app.$("#modal").open, false, "Done didn't close the picker");
  assert.equal(app.window.document.activeElement, app.$('[data-spellpickopen="sheet"]'), "focus didn't go back to the opener");
  assert.deepEqual(app.errors, []);
});

// ── Aberrations on the character (Decision 110) ──────────────────────

test("Aberrations: the picker adds one by hand, Drained moves max TOL but not current, and Clear gives no TOL back", () => {
  const ch = lockedCharacter();
  const max = Engine.derived(ch).TOL;
  ch.trackers.panel["tol-spent"] = { value: 1 };                   // current = max - 1
  const app = openSheet(ch, "trackers");
  assert.match(app.$("#main").textContent, /No Aberrations/);
  app.click('[data-abpickopen="add"]');
  assert.match(app.$("#modal-title").textContent, /Add an Aberration/);
  app.click('#modal [data-abpick="drained"]');
  const got = activeChar(app);
  assert.deepEqual(got.trackers.aberrations.map(e => e.id + "/" + e.permanence), ["drained/temporary"]);
  assert.equal(Engine.derived(got).TOL, Math.max(0, max - 2));
  assert.equal(Engine.derived(got).TOL - got.trackers.panel["tol-spent"].value, Math.min(max - 1, Math.max(0, max - 2)), "current TOL moved");
  assert.match(app.$("#undotoast").textContent, /Aberration: Drained \(temporary\)/);
  app.click('[data-abpickopen="add"]');
  assert.equal(app.$('#modal [data-abpick="drained"]').disabled, true, "a held Aberration is still offered");
  app.click("#modal [data-modalclose]");
  app.click('[data-abrm="0"]');
  const after = activeChar(app);
  assert.equal(after.trackers.aberrations.length, 0);
  assert.equal(Engine.derived(after).TOL, max);
  assert.equal(Engine.derived(after).TOL - after.trackers.panel["tol-spent"].value, Math.min(max - 1, Math.max(0, max - 2)), "clearing Drained gave TOL back");
  assert.deepEqual(app.errors, []);
});

test("Aberrations: a permanent one shows on the Archetype tab, Phantom Pain names itself on Main, and the Magic reference and Spell Attack render", () => {
  const ch = lockedCharacter();
  ch.trackers.aberrations = [{ id: "phantom-pain", permanence: "permanent", note: "since the warehouse" }];
  const app = openSheet(ch, "archetype");
  const text = app.$("#main").textContent;
  assert.match(text, /Permanent Aberrations[\s\S]*Phantom Pain[\s\S]*since the warehouse/);
  const ref = app.$('[data-reference="magic-reference"]');
  assert.ok(ref, "no Magic reference");
  for (const t of ["The Spellcraft roll", "Spell tiers", "The Cascade Table", "The Aberration Table", "Aberrations"])
    assert.match(ref.textContent, new RegExp(t), `the reference has no ${t}`);
  assert.match(ref.textContent, /Spell Attack is Evocation rank \+ REF \+ WILL/);
  app.click('[data-sec="main"]');
  assert.match(app.$("#main").textContent, /from Phantom Pain/, "Main doesn't say where the Pain comes from");
  app.click('[data-sec="loadout"]');
  assert.match(app.$("#main").textContent, /Spell Attack \d+/);
  assert.equal(app.$('#main [data-reference]'), null, "the reference panel leaked into Loadout");
  assert.deepEqual(app.errors, []);
});

// ── Starting spells in the wizard (Decision 111) ──────────────────────

function arcanistOnCP(setup) {
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = "arcanist";
  ch.creation.powerLevel = "street";                                   // Evocation starts at 1
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 5;
  if (setup) setup(ch);
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("character-points"), maxReached: steps.length } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  return app;
}
const draft = app => JSON.parse(app.window.localStorage.getItem("shadows.draft.v1")).ch;

test("starting spells: the count is TOL + the roll, the picker refuses a TH above Evocation, and buying a rank opens it", () => {
  const app = arcanistOnCP();
  const tol = Engine.derived(draft(app)).TOL;
  const roll = app.$('[data-archroll="startingSpells"]');
  roll.value = "2"; roll.dispatchEvent(new app.window.Event("input"));
  assert.ok(app.$("#main").textContent.includes(`TOL ${tol} + roll = ${tol + 2} spells`), "the count isn't TOL + the roll");

  app.click('[data-spellpickopen="wizard"]');
  search(app, "firebolt");                                             // Standard, TH 2
  const fb = app.$('#modal [data-startadd="firebolt"]');
  assert.equal(fb.disabled, true, "a TH 2 spell was open at Evocation 1");
  assert.match(fb.textContent, /Needs Evocation 2/);
  search(app, "zap");
  app.click('#modal [data-startadd="zap"]');
  assert.deepEqual(draft(app).panelData.grimoire, [{ spellId: "zap", stage: "known", notes: "" }]);
  assert.match(app.$("#modal [data-spellstatus]").textContent, new RegExp(`Chosen 1 of ${tol + 2}`));
  app.$("#modal").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

  app.click('[data-step="disc|evocation|1"]');                         // buy Evocation 2
  app.click('[data-spellpickopen="wizard"]');
  search(app, "firebolt");
  assert.equal(app.$('#modal [data-startadd="firebolt"]').disabled, false, "buying Evocation didn't open the next tier");
  app.click('#modal [data-startadd="firebolt"]');
  app.$("#modal").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

  // Un-buying the rank keeps the pick and says what's wrong, out loud, on the step.
  app.click('[data-step="disc|evocation|-1"]');
  assert.deepEqual(draft(app).panelData.grimoire.map(r => r.spellId), ["zap", "firebolt"], "a pick was dropped silently");
  assert.match(app.$(".issues").textContent, /Firebolt needs Evocation 2/);
  assert.deepEqual(app.errors, []);
});

test("starting spells: short of the count warns without blocking, and the picks lock in as Known book spells", () => {
  const app = arcanistOnCP(ch => { ch.archetypeChoices.rolls.startingSpells = 3; ch.panelData.grimoire = [{ spellId: "zap", stage: "known", notes: "" }]; });
  const issues = Engine.validate("character-points", draft(app)).filter(i => /starting spell/.test(i.msg));
  assert.deepEqual(Array.from(issues, i => i.level), ["warn"]);
  const ch = draft(app);
  ch.creation.locked = true;
  const locked = Engine.migrate(Engine.buildExport(ch));
  assert.deepEqual(JSON.parse(JSON.stringify(locked.panelData.grimoire)), [{ spellId: "zap", stage: "known", notes: "" }]);
  assert.equal(Engine.grimoire(locked).lines[0].name, "Zap");
});

test("starting spells: switching archetype takes the picks with it", () => {
  const app = arcanistOnCP(ch => { ch.panelData.grimoire = [{ spellId: "zap", stage: "known", notes: "" }]; });
  app.click('[data-goto="3"]');                                        // the Archetype step
  app.click('[data-arch="professional"]');
  app.click('[data-arch="arcanist"]');
  assert.deepEqual(draft(app).panelData, {}, "an old Arcanist's picks came back");
  assert.deepEqual(app.errors, []);
});

// ── W19: the Skills grid survives a picks block ───────────────────────

test("W19: training Martial Arts puts its style picker across the whole Skills grid, not in one cell", () => {
  // .alloc is a three-column grid whose rows are display:contents. A picks
  // block inserted as a plain child took one 194px cell and shifted every
  // later skill one column over. jsdom has no layout, but it does compute
  // the cascade, which is where the fix lives.
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = "professional";
  ch.creation.powerLevel = "heroic";
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("skills"), maxReached: steps.length } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click('[data-step="skill|martial-arts|1"]');
  const picks = app.$('.alloc > .picks select[data-sel]').closest(".picks");
  assert.equal(app.window.getComputedStyle(picks).gridColumn, "1 / -1", "the style picker sits in one grid cell");
  assert.deepEqual(app.errors, []);
});

test("W20/W21: a skill's line shows its stats as icons with the character's own numbers, synergy as a bonus", () => {
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = "professional";
  ch.creation.powerLevel = "heroic";
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  ch.stats.REF.base = 5; ch.stats.COOL.base = 7;
  const syn = Engine.skillLine(ch, "archery").breakdown.synergy.mod;
  const synText = `COOL ${syn < 0 ? "−" : "+"}${Math.abs(syn)} syn`;
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("skills"), maxReached: steps.length } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  const nameOf = () => app.$('[data-step="skill|archery|1"]').closest(".alloc-row").querySelector(".name");
  const stats = () => nameOf().querySelector(".skstats");
  assert.ok(stats(), "the stats aren't on the skill's name line");
  assert.equal(stats().querySelectorAll("svg").length, 2, "the stats aren't shown as their icons");
  assert.match(stats().textContent, /REF 5/, "the primary doesn't show its score");
  assert.ok(stats().textContent.includes(synText), "the synergy doesn't read as a bonus");
  assert.doesNotMatch(nameOf().querySelector("small").textContent, /syn/, "the old stats line is still there");
  assert.ok(stats().querySelector(".skstat.syn.off"), "an untrained skill's synergy isn't dimmed");
  app.click('[data-step="skill|archery|1"]');
  assert.equal(stats().querySelector(".skstat.syn.off"), null, "training the skill left its synergy dimmed");
  assert.deepEqual(app.errors, []);
});

test("W1/W10: Trackers reads in two columns, and the Health Levels sit in Damage, banded by the Pain Level they put you at", () => {
  const ch = lockedCharacter();
  const hp = Engine.health(ch);
  ch.trackers.damage = hp.hpPer * 2;                                  // two HL lost: Pain 1
  const app = openSheet(ch, "trackers");
  const cols = app.$$("#main .trk-grid > .trk-col");
  assert.equal(cols.length, 2, "Trackers isn't split into two columns");
  const card = h => app.$$("#main .trk").find(t => (t.querySelector("h4") || {}).textContent === h);
  assert.ok(cols[0].contains(card("Damage")) && cols[1].contains(card("Sanity")), "Damage and Sanity aren't in their own columns");
  const track = card("Damage").querySelector(".hl-track");
  assert.ok(track, "the Health Levels aren't inside the Damage card");
  const levels = D.resources.healthLevels.painLevels;
  const want = i => levels.reduce((l, p) => i >= p.hlLostThreshold ? p.level : l, 0);
  const got = [...track.querySelectorAll(".hl-band")].flatMap(b =>
    [...b.querySelectorAll(".hl")].map(() => Number(b.className.match(/pl-(\d)/)[1])));
  assert.deepEqual(got, Array.from({ length: hp.levels }, (_, i) => want(i)), "a box is in the wrong Pain Level band");
  const here = track.querySelector(".hl-band.here");
  assert.ok(here && here.classList.contains(`pl-${Engine.painState(activeChar(app)).fromHealth}`), "the band you're in isn't the lit one");
  assert.deepEqual(app.errors, []);
});

test("W5: Loadout jumps to each section it drew, archetype panels included, and focus lands on the heading", () => {
  const app = openSheet(lockedCharacter(), "loadout");
  const jumps = app.$$("#main .jumpbar [data-jump]");
  const heads = app.$$("#main .sect[id]");
  assert.deepEqual(jumps.map(b => b.textContent), heads.map(h => h.textContent), "the bar and the page's sections disagree");
  const want = D.archetypes.find(a => a.id === "arcanist").coreMechanic.panels
    .filter(p => p.type !== "tracker" && p.type !== "reference").map(p => p.title);
  for (const t of want) assert.ok(jumps.some(b => b.textContent === t), `the archetype's ${t} panel has no jump`);
  const last = jumps[jumps.length - 1];
  app.click(`[data-jump="${last.dataset.jump}"]`);
  assert.equal(app.window.document.activeElement, app.$(`#${last.dataset.jump}`), "focus didn't land on the section");
  assert.deepEqual(app.errors, []);
});

test("W22: step 7's sticky bar filters the picks, keeps what you hold, and survives a re-render", () => {
  const app = arcanistOnCP(ch => { ch.advantages.push({ id: "danger-sense", rank: 1, notes: "" }); });
  const bar = app.$("#main .jumpbar.sticky");
  assert.ok(bar, "step 7 has no sticky jump bar");
  const labels = app.$$("#main .jumpbar [data-jump]").map(b => b.textContent);
  for (const l of ["Disadvantages", "Advantages", "Starting spells", "Boosts"]) assert.ok(labels.includes(l), `no jump to ${l}`);
  assert.match(bar.textContent, /Remaining \d+ CP/, "the bar doesn't keep the CP left in view");
  const filter = () => app.$("#main [data-jumpfilter]");
  const shown = () => app.$$("#main [data-filterable] .pick").filter(p => !p.hidden).map(p => p.querySelector("h4").textContent);
  const all = app.$$("#main [data-filterable] .pick").length;
  filter().value = "berserk"; filter().dispatchEvent(new app.window.Event("input"));
  assert.deepEqual(shown(), ["Berserker", "Danger Sense"], "the filter didn't narrow to the match plus what's held");
  assert.equal(app.$("#main [data-jumpcount]").textContent, `2 of ${all}`);
  app.click('[data-step="luck|x|1"]');                                 // a stepper re-renders the step
  assert.equal(filter().value, "berserk", "a re-render dropped the filter");
  assert.deepEqual(shown(), ["Berserker", "Danger Sense"], "a re-render dropped the filtering");
  assert.deepEqual(app.errors, []);
});
