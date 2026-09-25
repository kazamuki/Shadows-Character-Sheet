/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot, loadEngine, stored } from "./harness.mjs";

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

test("the tab row keeps the active tab in view and fades the side with more (B19)", () => {
  // jsdom has no layout, so give the row one: nine 100 px tabs in 390 px.
  const app = boot({ storage: { "shadows.active.v1": { ch: lockedCharacter(), section: "main" } } });
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent))
    .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  const nav = app.$("#topnav");
  let left = 0;
  const max = 900 - 390;
  Object.defineProperty(nav, "scrollLeft", { get: () => left, set: v => { left = Math.max(0, Math.min(max, v)); } });
  Object.defineProperty(nav, "scrollWidth", { get: () => 900 });
  Object.defineProperty(nav, "clientWidth", { get: () => 390 });
  const rect = (l, w) => ({ left: l, right: l + w, top: 0, bottom: 40, width: w, height: 40 });
  const proto = app.window.HTMLElement.prototype, real = proto.getBoundingClientRect;
  proto.getBoundingClientRect = function () {
    if (this === nav) return rect(0, 390);
    const i = [...nav.children].indexOf(this);
    return i >= 0 ? rect(i * 100 - left, 100) : real.call(this);
  };
  try {
    app.click('[data-sec="notes"]');
    assert.equal(left, max, "the last tab was not scrolled into view");
    assert.ok(nav.classList.contains("more-l") && !nav.classList.contains("more-r"), `fades: ${nav.className}`);
    app.click('[data-sec="trackers"]');
    const t = nav.querySelector(".tab.active").getBoundingClientRect();
    assert.ok(t.left >= 0 && t.right <= 390, `Trackers out of view at ${t.left}–${t.right}`);
    app.click('[data-sec="main"]');
    assert.equal(left, 0);
    assert.ok(nav.classList.contains("more-r") && !nav.classList.contains("more-l"), `fades: ${nav.className}`);

    // A mouse wheel scrolls the row sideways, and lets the page have it at the end.
    const wheel = dy => { const e = new app.window.WheelEvent("wheel", { deltaY: dy, bubbles: true, cancelable: true }); nav.dispatchEvent(e); return e.defaultPrevented; };
    assert.equal(wheel(120), true);
    assert.equal(left, 120);
    left = max;
    assert.equal(wheel(120), false, "the wheel was swallowed with nowhere to scroll");
  } finally {
    proto.getBoundingClientRect = real;
  }
  assert.deepEqual(app.errors, []);
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

test("the Skills tab shows the Martial Arts styles chosen, with their bonuses, and lists every style (W33)", () => {
  const ma = D.skills.find(s => s.id === "martial-arts"), [a, b] = ma.styles;
  const ch = lockedCharacter();
  ch.skills["martial-arts"] = { rank: 2, ipe: 0, selections: { style: [a.id, b.id] } };
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "skills" } } });
  app.$$("#main button").find(x => /Open sheet/.test(x.textContent)).click();
  app.click('[data-sec="skills"]');
  assert.deepEqual(app.errors, []);
  const row = app.$$(".skill-line").find(r => r.textContent.includes(ma.name));
  const chips = [...row.querySelectorAll(".skill-picked .chip")].map(c => c.textContent.replace(/\s+/g, " ").trim());
  assert.deepEqual(chips, [`${a.name} ${a.bonus}`, `${b.name} ${b.bonus}`], "the chosen styles and their bonuses aren't on the row");
  const desc = app.$('[data-descrow="martial-arts"]').textContent;
  for (const st of ma.styles) assert.ok(desc.includes(`${st.name} (${st.bonus})`), `${st.name} missing from the description`);
  // A skill with no option pick grows nothing.
  assert.equal(app.$$(".skill-picked").length, 1);
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
  const live = stored(app, { locked: false });
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

  const resumed = stored(app, { locked: false });
  assert.deepEqual([...resumed.archetypeChoices.specialization], ["arcane-fortitude"],
    "the resumed draft lost its specialization");
  assert.equal(resumed.meta.schemaVersion, "0.13");
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
  ch.advantages = [{ id: "iron-will", rank: 1, notes: "", source: "natural" },
                   { id: "ambidextrous", rank: 1, notes: "" }];

  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("archetype"), maxReached: steps.length - 1 } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));

  // Arcanist can purchase advantages, so the bought one survives...
  app.click('[data-arch="arcanist"]');
  assert.deepEqual(app.errors, []);
  let now = stored(app, { locked: false });
  assert.equal(now.advantages.some(a => a.notes === "natural"), false,
    "the Professional's free advantages survived the archetype change");
  assert.equal(now.advantages.some(a => a.id === "ambidextrous"), true,
    "a legitimately purchased advantage was thrown away");
  assert.deepEqual([...now.archetypeChoices.naturalAdvantages], []);

  // ...and a supernatural archetype, which cannot purchase at all, keeps none.
  app.click('[data-arch="werewolf"]');
  now = stored(app, { locked: false });
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
  ch.advantages = [{ id: "favored-skill", rank: 2, notes: "", source: "natural" }];

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
  ch.advantages = [{ id: "favored-skill", rank: 1, notes: "", source: "natural" }];

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
  const after = stored(app, { locked: false });
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
const activeConditions = app => stored(app, { locked: true }).trackers.conditions;

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

  addCondition(app, "injured", "left-arm");
  addCondition(app, "injured", "left-arm");
  assert.equal(activeConditions(app).length, 1);
  // C5: the refusal says why in the toast, not in a blocking alert().
  const toast = app.$("#undotoast");
  assert.ok(toast && !toast.hidden, "the duplicate was not refused out loud");
  assert.match(toast.textContent, /already/i, "the toast doesn't say why");
  assert.equal(toast.querySelector("[data-toastundo]"), null, "a refusal offered an Undo");
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
const activeChar = app => stored(app, { locked: true });

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
// W4: the catalog is a modal. Open it and press a row's Add or Buy.
function pickFromCatalog(app, kind, id, how = "add") {
  app.click(`[data-lobrowse="${kind}"]`);
  const b = app.$(`#modal [data-cat${how}="${id}"]`);
  assert.ok(b, `${id} isn't in the ${kind} catalog`);
  return b;
}

test("Loadout: Buy a vest from the catalog — it's paid for, worn, answers a hit, and one undo takes it all back", () => {
  const ch = lockedCharacter();
  ch.trackers.credits.current = 1000;
  const app = openSheet(ch, "loadout");
  const buy = pickFromCatalog(app, "armor", "kevlar-vest", "buy");
  assert.match(buy.closest("tr").textContent, /500Ç/, "the row doesn't show the price");
  buy.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click("#modal [data-modalclose]");
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
  pickFromCatalog(app, "weapons", "combat-knife")               // BOD+3
    .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click("#modal [data-modalclose]");
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

test("Grimoire: an inscribed-only spell says its form and time, and the picker filters by Discipline (Decision 136)", () => {
  const ch = lockedCharacter();
  ch.panelData.grimoire = [{ spellId: "lightning-trap", stage: "known", notes: "" }];
  const app = openSheet(ch, "loadout");
  const line = app.$("details.spell summary");
  assert.match(line.querySelector(".sub").textContent, /· Enchantment only · 4 hours$/);
  assert.match(line.querySelector(".num").textContent, /TH 4/, "the Grimoire showed the tier's TH, not Enchantment's");
  app.click('[data-spellpickopen="sheet"]');
  const pick = app.$('#modal [data-spellf="discipline"]');
  pick.value = "alchemy";
  pick.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  const names = app.$$("#modal .spell-results tr b").map(b => b.textContent);
  assert.ok(names.includes("Warding — Aether") && names.includes("Firebolt"), "Alchemy should list its own spells and every spell of all forms");
  assert.ok(!names.includes("Lightning Trap"), "an Enchantment-only spell was listed under Alchemy");
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
const draft = app => stored(app, { locked: false });

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

test("W15: a hit lands once — the HP readouts and the boxes that took it flash, Pain beats when it rises, and healing never flashes", () => {
  const ch = lockedCharacter();
  const hp = Engine.health(ch);
  const app = openSheet(ch, "trackers");
  const landed = () => app.$$("#main .hl.landed").length;
  assert.equal(landed(), 0, "a box flashed before anything happened");
  app.click('[data-dmg="1"]');                                            // 1 HP into the first box
  assert.equal(landed(), 1, "the box that took the damage didn't flash");
  assert.ok(app.$("#main .hl.landed") === app.$("#main .hl"), "the wrong box flashed");
  assert.ok(app.$("#main .trk .big.struck") && app.$("#main .vpill.hp.struck"), "the HP readouts didn't flash");
  assert.equal(app.$$("#main .painup").length, 0, "Pain beat though its level didn't move");
  app.click('[data-sec="trackers"]');                                     // a plain re-render
  assert.equal(landed() + app.$$("#main .struck").length, 0, "the flash replayed on a later render");
  app.click('[data-dmg="-1"]');                                           // Heal 1
  assert.equal(landed() + app.$$("#main .struck").length, 0, "healing flashed");

  // Enough to cross into Pain 1: the Pain readouts get their own beat.
  const cross = D.resources.healthLevels.painLevels.find(p => p.level === 1).hlLostThreshold * hp.hpPer;
  const set = app.$("[data-dmgset]"); set.value = String(cross);
  set.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(landed(), D.resources.healthLevels.painLevels.find(p => p.level === 1).hlLostThreshold, "not every box the damage filled flashed");
  assert.ok(app.$("#main .pick.painup") && app.$("#main .vpill.painup"), "Pain didn't beat when it rose");
  app.click('[data-sec="main"]');
  assert.equal(app.$$("#main .landed, #main .struck, #main .painup").length, 0, "switching tabs replayed the flash");
  assert.deepEqual(app.errors, []);
});

test("W4: the catalog browser shows the numbers before you buy, searches, filters to what you can afford, sorts, and stays open", () => {
  const ch = lockedCharacter();                                  // BOD 5
  ch.trackers.credits.current = 1500;
  const app = openSheet(ch, "loadout");
  app.click('[data-lobrowse="weapons"]');
  const rows = () => app.$$("#modal [data-catrow]");
  assert.equal(rows().length, D.weapons.length, "not every weapon is listed");
  const row = id => app.$(`#modal [data-catrow="${id}"]`);
  const attack = Engine.skillLine(ch, "melee").checkBonus;
  assert.match(row("combat-knife").textContent, new RegExp(`1d10 \\+ ${attack}`), "the attack isn't shown before adding");
  assert.match(row("combat-knife").textContent, /8\s*BOD\+3/, "the damage isn't resolved for this character");
  assert.ok(app.$('#modal [data-catbuy="bdf-oni"]').disabled, "Buy is on for a weapon you can't afford");
  assert.match(row("bdf-oni").textContent, /Costs 7,500Ç\. You have 1,500Ç\./, "the row doesn't say why Buy is off");

  const q = app.$("#modal [data-catq]");
  q.value = "viper"; q.dispatchEvent(new app.window.Event("input"));
  assert.deepEqual(rows().map(r => r.dataset.catrow), ["ads-lp9-viper"], "search didn't narrow the list");
  q.value = ""; q.dispatchEvent(new app.window.Event("input"));
  const afford = app.$("#modal [data-catafford]");
  afford.checked = true; afford.dispatchEvent(new app.window.Event("change"));
  const cheap = D.weapons.filter(w => typeof w.cost === "number" && w.cost > 0 && w.cost <= 1500).map(w => w.id);
  assert.deepEqual(rows().map(r => r.dataset.catrow).sort(), [...cheap].sort(), "'What I can afford' is wrong");
  assert.match(app.$("#modal [data-catstatus]").textContent, new RegExp(`Showing ${cheap.length} of ${D.weapons.length}`));
  const sort = app.$('#modal [data-catf="sort"]');
  sort.value = "-price"; sort.dispatchEvent(new app.window.Event("change"));
  const prices = rows().map(r => D.weapons.find(w => w.id === r.dataset.catrow).cost);
  assert.deepEqual(prices, [...prices].sort((a, b) => b - a), "sorting by price didn't");

  // A click on the row opens its details; Buy pays, and the modal stays open with the new balance.
  const detail = () => app.$('#modal [data-catrow="combat-knife"] + tr');
  assert.ok(detail().hidden, "a row's details show before it's opened");
  app.click('#modal [data-catrow="combat-knife"] td');
  assert.ok(!detail().hidden && /sharp edge/.test(detail().textContent), "the row's details didn't open");
  app.click('#modal [data-catbuy="combat-knife"]');
  assert.ok(app.$("#modal").open, "the modal closed after a pick");
  assert.equal(activeChar(app).trackers.credits.current, 1400);
  assert.match(app.$("#modal [data-catstatus]").textContent, /1,400Ç/, "the balance didn't refresh");
  assert.equal(activeChar(app).weapons[0].id, "combat-knife");
  app.click("#modal [data-toastundo]");
  assert.deepEqual([activeChar(app).weapons.length, activeChar(app).trackers.credits.current], [0, 1500], "one undo didn't take the purchase back");

  // Armor shows its numbers too.
  app.click("#modal [data-modalclose]");
  app.click('[data-lobrowse="armor"]');
  assert.match(app.$('#modal [data-catrow="kevlar-vest"]').textContent, /1d6/, "the vest's PROT isn't shown");
  assert.deepEqual(app.errors, []);
});

test("W2: a vitals pill opens its popover, whose buttons are Trackers' own — same audit label, same undo — and it follows the render", () => {
  const app = openSheet(lockedCharacter(), "skills");
  const hp = Engine.health(activeChar(app)).total;
  app.click('[data-vpop="hp"]');
  const pop = () => app.$("#vpop");
  assert.ok(!pop().hidden, "the HP pill didn't open a popover");
  assert.equal(app.$('[data-vpop="hp"]').getAttribute("aria-expanded"), "true");
  assert.match(pop().textContent, new RegExp(`${hp} / ${hp} HP`));
  app.$('#vpop [data-dmg="5"]').focus();                                  // a browser focuses what's clicked
  app.click('#vpop [data-dmg="5"]');
  assert.equal(activeChar(app).trackers.damage, 5);
  assert.ok(!pop().hidden, "the popover closed after an action");
  assert.match(pop().textContent, new RegExp(`${hp - 5} / ${hp} HP`), "the popover didn't redraw with the new HP");
  assert.equal(app.window.document.activeElement, app.$('#vpop [data-dmg="5"]'), "focus didn't stay on the button pressed");
  assert.match(app.$("#undotoast").textContent, /Hurt 5/, "not Trackers' own label");
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).trackers.damage, 0, "the popover's action didn't undo");

  // Esc closes and hands focus back to the pill.
  app.window.document.dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.ok(pop().hidden, "Esc didn't close the popover");
  assert.equal(app.window.document.activeElement, app.$('[data-vpop="hp"]'), "focus didn't go back to the pill");

  // Çredits: Earn with a note, from the popover's own fields.
  app.click('[data-vpop="cred"]');
  app.$("#vpop [data-cramt]").value = "250"; app.$("#vpop [data-crnote]").value = "fixer's cut";
  app.click('#vpop [data-cr="1"]');
  const c = activeChar(app).trackers.credits;
  assert.equal(c.current, lockedCharacter().trackers.credits.current + 250);
  assert.equal(c.ledger[c.ledger.length - 1].note, "fixer's cut");

  // A click elsewhere closes it; a second popover replaces the first.
  app.click('[data-vpop="san"]');
  assert.match(pop().textContent, /Sanity/);
  app.click('#vpop [data-san="1"]');
  assert.equal(activeChar(app).trackers.san.loss, 1);
  app.$("#main h1").dispatchEvent(new app.window.MouseEvent("mousedown", { bubbles: true }));
  assert.ok(pop().hidden, "a click elsewhere didn't close the popover");
  assert.deepEqual(app.errors, []);
});

test("W3: Main's cards open the same popovers — LUCK spends, Pain adds a Condition, and Take a hit hands over to the hit modal", () => {
  const app = openSheet(lockedCharacter(), "main");
  assert.ok(app.$("#main .cond-grid button.cond[data-vpop='hp']"), "Main's Health card isn't a button");
  app.click('#main .cond[data-vpop="luck"]');
  const spend = app.$("#vpop [data-luckspend]:not([disabled])");
  assert.ok(spend, "the LUCK popover has no spend action");
  spend.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.equal(activeChar(app).trackers.luck.spent, Number(spend.dataset.luckspend));

  app.click('#main .cond[data-vpop="pain"]');
  app.click('#vpop [data-condquick="stunned"]');
  assert.deepEqual(activeChar(app).trackers.conditions.map(c => c.id), ["stunned"], "the Pain popover didn't add the Condition");
  assert.match(app.$("#vpop").textContent, /Stunned/, "the popover didn't show the Condition it added");
  app.click('#vpop [data-condrm="0"]');
  assert.equal(activeChar(app).trackers.conditions.length, 0, "the popover couldn't clear it");

  app.click('#main .cond[data-vpop="hp"]');
  app.click("#vpop [data-pophit]");
  assert.ok(app.$("#vpop").hidden, "the popover stayed open under the hit modal");
  assert.ok(app.$("#modal").open && /Take a hit/.test(app.$("#modal").textContent), "Take a hit didn't open the hit modal");
  app.click("[data-hitcancel]");
  assert.equal(app.window.document.activeElement, app.$('#main [data-vpop="hp"]'), "focus didn't come back to the Health card");
  assert.deepEqual(app.errors, []);
});

test("W16: install a mod on Loadout, fire a Burst from Main, Reload, and each is one undo", () => {
  const ch = lockedCharacter();
  ch.weapons.push({ id: "ar9x-guardian", notes: "", mods: [], roundsSpent: 0 });   // 30+1, S/B/F, 1 slot
  const app = openSheet(ch, "loadout");
  const pick = app.$('[data-wmodpick="0"]');
  assert.ok(pick, "no mod picker on a weapon with a slot");
  assert.ok(pick.querySelector('option[value="Silencer"]') && !pick.querySelector('option[value="Scope"]').disabled, "a rifle can't take a Scope");
  pick.value = "Scope";
  app.click('[data-wmodadd="0"]');
  assert.deepEqual([...activeChar(app).weapons[0].mods], ["Scope"]);
  assert.match(app.$(".lo-weapons").textContent, /Aimed at Long or Extreme range: \+2 ACC \(Scope\)/, "the Scope's ACC isn't shown");
  assert.match(app.$(".lo-weapons").textContent, /0 of 1 slot free/);
  assert.ok(app.$(".lo-modrow .flag"), "the Scope's unsettled fit isn't said");

  app.click('[data-sec="main"]');
  assert.match(app.$(".main-combat .lo-rounds").textContent, /31\s*\/31/, "Main doesn't show the magazine");
  app.click('.main-combat [data-fire="0|B"]');
  assert.equal(activeChar(app).weapons[0].roundsSpent, 3);
  assert.match(app.$("#undotoast").textContent, /Burst −3 \(28\/31 left\)/);
  app.click('.main-combat [data-fire="0|F"]');
  assert.match(app.$(".main-combat .lo-rounds").textContent, /18\s*\/31/);
  app.click('.main-combat [data-reload="0"]');
  assert.equal(activeChar(app).weapons[0].roundsSpent, 0);
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).weapons[0].roundsSpent, 13, "Reload didn't undo on its own");
  assert.deepEqual(app.errors, []);
});

test("W17/W27: buy from the equipment catalog, use one and a charge on Loadout, and a Nanomed Kit you carry comes off with the healing", () => {
  const ch = lockedCharacter();
  ch.trackers.credits.current = 10000;
  ch.trackers.damage = 6;
  const app = openSheet(ch, "loadout");
  app.click('[data-lobrowse="gear"]');
  const group = app.$('#modal [data-catf="group"]');
  group.value = "charged"; group.dispatchEvent(new app.window.Event("change"));
  assert.match(app.$('#modal [data-catrow="shield-charm"]').textContent, /Shield: TN .* TH/, "the charm doesn't show the spell it holds");
  app.click('#modal [data-catbuy="shield-charm"]');
  group.value = ""; group.dispatchEvent(new app.window.Event("change"));
  app.click('#modal [data-catbuy="nanomed-kit"]');
  app.click('#modal [data-catbuy="quickstitch"]');
  app.click("#modal [data-modalclose]");
  let got = activeChar(app);
  assert.equal(got.trackers.credits.current, 10000 - 450 - 4500 - 1500);
  assert.match(app.$(".lo-gear").textContent, /Quickstitch[\s\S]*×5 doses/);
  const row = id => app.$$(".lo-gear-row").find(r => r.textContent.includes(id));
  row("Quickstitch").querySelector("[data-gearuse]").dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.match(row("Quickstitch").textContent, /×4/);
  row("Shield charm").querySelector("[data-gearcharge]").dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.match(row("Shield charm").textContent, /2\s*\/3 charges/);
  assert.match(row("Shield charm").textContent, /Holds Shield/);

  // The Nanomed panel offers the kit you carry, on by default; Apply takes it off.
  app.click('[data-sec="trackers"]');
  app.click('[data-actopen="nanomed"]');
  const use = app.$('[data-actpanel="nanomed"] [data-act="fromGear"]');
  assert.ok(use && use.checked, "the panel didn't offer the kit you carry");
  app.click("[data-actapply]");
  got = activeChar(app);
  assert.ok(!got.gear.some(g => g.id === "nanomed-kit"), "the kit didn't come out of your gear");
  assert.ok(got.trackers.damage < 6, "the kit didn't heal");
  app.click("[data-toastundo]");
  got = activeChar(app);
  assert.deepEqual([got.gear.some(g => g.id === "nanomed-kit"), got.trackers.damage], [true, 6], "one undo didn't put back both");
  assert.deepEqual(app.errors, []);
});

test("W17: the Field Repair Kit button takes a use off the kit you carry", () => {
  const ch = lockedCharacter();
  ch.armor.push({ id: "kevlar-vest", integrityLoss: 6, notes: "", worn: true, scrapped: false, upgrades: [] });
  ch.gear.push({ id: "field-repair-kit", qty: 5, notes: "" });
  const app = openSheet(ch, "loadout");
  assert.match(app.$('[data-repairkit="0"]').textContent, /1 of your 5/);
  app.$('[data-repairroll="0"]').value = "4";
  app.click('[data-repairkit="0"]');
  const got = activeChar(app);
  assert.deepEqual([got.armor[0].integrityLoss, got.gear[0].qty], [2, 4]);
  assert.match(app.$("#undotoast").textContent, /4 kit uses left/);
  assert.deepEqual(app.errors, []);
});

test("W13: Main's Combat column leads with the weapons you carry and the armor that answers, then the skills", () => {
  const ch = lockedCharacter();
  ch.weapons.push({ id: "ads-lp9-viper", notes: "", mods: [], roundsSpent: 0 });
  ch.armor.push({ id: "kevlar-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: [] });
  const app = openSheet(ch, "main");
  const heads = app.$$(".main-combat .sect").map(s => s.textContent.replace(/Pain.*/, "").trim());
  assert.deepEqual(heads, ["Combat", "Weapons", "Armor", "Combat skills"], "the fight's lines aren't first");
  const weapons = app.$(".main-combat table.ref:not(.skill-table)"), skills = app.$(".main-combat .skill-table");
  assert.ok(weapons.compareDocumentPosition(skills) & app.window.Node.DOCUMENT_POSITION_FOLLOWING, "the skills table comes before the weapons");
  assert.deepEqual(app.errors, []);
});

// ── What's new (Decision 123) ─────────────────────────────────────────
// Read from source so the tests never hard-code a version.
const APP_VERSION_NOW = /const APP_VERSION = "([\d.]+)"/.exec(
  readFileSync(new URL("../src/ui/app.js", import.meta.url), "utf8"))[1];
const APP_V = () => APP_VERSION_NOW;

test("What's new: a first visit is marked seen and told nothing", () => {
  const app = boot();
  assert.deepEqual(app.errors, []);
  assert.ok(!app.$(".wn-note"), "a first visit shouldn't get the Updated notice");
  assert.ok(app.$("#homenews .wn-link"), "the home screen has no What's new link");
  assert.equal(app.window.localStorage.getItem("shadows.seenVersion"), APP_V());
});

test("What's new: a returning player sees one quiet line, and opening the notes clears it", () => {
  const app = boot({ storage: { "shadows.seenVersion": "0.19.0" } });
  assert.deepEqual(app.errors, []);
  const note = app.$("#homenews .wn-note");
  assert.ok(note, "no Updated notice for a player last here on 0.19.0");
  assert.match(note.textContent, new RegExp(`Updated to ${APP_V().replace(/\./g, "\.")}`));
  assert.ok(!app.$("#modal[open]"), "the notes must not open by themselves");

  app.click("#homenews [data-whatsnew]");
  const rels = app.$$("#modal .wn-rel");
  assert.ok(rels.length > 10, `only ${rels.length} releases in What's new`);
  // Everything after 0.19.0 is New and open; 0.19.0 itself and older are neither.
  const fresh = rels.filter(r => r.querySelector(".wn-new")).map(r => r.querySelector(".wn-ver").textContent);
  const newer = v => { const [a,b,c] = v.split(".").map(Number); return a > 0 || b > 19 || (b === 19 && c > 0); };
  const want = [...app.window.SHADOWS_CHANGELOG].map(r => r.version).filter(newer);   // out of the page's realm
  assert.deepEqual([...fresh], [...want], "New should mark exactly the releases after 0.19.0");
  assert.ok(fresh.includes("0.19.1") && !fresh.includes("0.19.0"), "the version they'd already seen is marked New");
  for (const r of rels) assert.equal(r.open, !!r.querySelector(".wn-new"), "a New release is closed, or an old one open");
  assert.equal(app.window.localStorage.getItem("shadows.seenVersion"), APP_V(), "opening the notes didn't mark them seen");
  assert.ok(!app.$("#homenews .wn-note"), "the notice outlived opening the notes");
  assert.match(app.$("#modal .whatsnew").innerHTML, /<strong>/, "the notes' **bold** didn't render");
});

test("What's new: someone who used the app before the mark existed gets the notice once", () => {
  const app = boot({ storage: { "shadows.theme": "dark" } });
  assert.ok(app.$("#homenews .wn-note"), "a returning player with no mark got no notice");
  app.click("#homenews [data-whatsnew-dismiss]");
  assert.ok(!app.$("#homenews .wn-note"), "dismiss didn't clear the notice");
  assert.equal(app.window.localStorage.getItem("shadows.seenVersion"), APP_V());
  const again = boot({ storage: { "shadows.theme": "dark", "shadows.seenVersion": APP_V() } });
  assert.ok(!again.$("#homenews .wn-note"), "the notice came back after it was seen");
});

test("What's new opens from the sheet's menu and from the footer", () => {
  const app = boot({ storage: { "shadows.active.v1": { ch: lockedCharacter(), section: "main" } } });
  const open = app.$$("#main button").find(b => /Open sheet/.test(b.textContent));
  open.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click("#hdrmenu [data-whatsnew]");
  assert.ok(app.$("#modal[open] .whatsnew"), "the menu's What's new didn't open the notes");
  assert.ok(app.$("#hdrmenu").hidden, "the menu stayed open behind the notes");
  app.click("#modal [data-modalclose]");
  app.click("#footer [data-whatsnew]");
  assert.ok(app.$("#modal[open] .whatsnew"), "the footer's What's new didn't open the notes");
  assert.deepEqual(app.errors, []);
});

test("C4: what the load check found stays on every page until it's dismissed; a bare version difference shows once", () => {
  // It used to render once and vanish on the next click, and a draft's
  // never showed at all. A version difference alone is news, not a problem,
  // and every returning player has one after a data release, so it keeps
  // showing just once.
  const orphan = lockedCharacter();
  orphan.skills["long-gone-skill"] = { rank: 2, ipe: 0 };
  const app = boot({ storage: { "shadows.active.v1": { ch: orphan, section: "main" } } });
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent)).click();
  const shown = () => /long-gone-skill/.test(app.$("#main .import-issues")?.textContent || "");
  assert.ok(shown(), "the load check's finding never showed");
  app.click('[data-sec="skills"]');
  assert.ok(shown(), "the finding vanished on the next click");
  app.click("[data-importdismiss]");
  assert.ok(!shown(), "Dismiss didn't clear it");
  app.click('[data-sec="main"]');
  assert.ok(!shown(), "a dismissed finding came back");

  const stale = lockedCharacter();
  stale.meta.gamedataVersion = "0.0-ancient";
  const v = boot({ storage: { "shadows.active.v1": { ch: stale, section: "main" } } });
  v.$$("#main button").find(b => /Open sheet/.test(b.textContent)).click();
  const said = () => /saved against game data 0\.0-ancient/.test(v.$("#main").textContent);
  assert.ok(said(), "a version difference wasn't mentioned at all");
  assert.equal(v.$("[data-importdismiss]"), null, "a bare version difference asks to be dismissed");
  v.click('[data-sec="skills"]');
  assert.ok(!said(), "a bare version difference stuck to every page");

  const draft = lockedCharacter();
  draft.creation.locked = false;
  draft.skills["long-gone-skill"] = { rank: 1, ipe: 0 };
  const w = boot();
  w.window.eval(`S=Object.assign({screen:"wizard", ch:Engine.migrate(${JSON.stringify(draft)}), step:0, maxReached:0, section:"main"}); Object.assign(S, loadFindings(S.ch)); update();`);
  assert.match(w.$("#main").textContent, /long-gone-skill/, "an imported draft's finding never showed in the wizard");
  assert.deepEqual([...app.errors, ...v.errors, ...w.errors], []);
});

test("B17: a Trueborn sees the Lunar Phase Blessing, its four phases, and which powers aren't written yet — on the sheet and in the wizard", () => {
  // The option's starterPower and additionalPowers were in the data and
  // nowhere on screen: a Werewolf's sheet never mentioned its starting power.
  const ch = lockedCharacter();
  ch.identity.archetype = "werewolf";
  ch.archetypeChoices.specialization = ["trueborn"];
  const tb = D.archetypes.find(a => a.id === "werewolf").specialization.options.find(o => o.id === "trueborn");
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "archetype" } } });
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent)).click();
  app.click('[data-sec="archetype"]');
  const text = app.$("#main").textContent;
  assert.match(text, new RegExp(tb.starterPower.name), "the starting power isn't on the sheet");
  for (const p of tb.starterPower.phases) assert.ok(text.includes(p.boon) && text.includes(p.effect), `${p.phase}'s boon isn't on the sheet`);
  const unwritten = app.$$("#main .power").filter(el => /not written yet/.test(el.textContent)).map(el => el.querySelector("h5").textContent);
  assert.equal(unwritten.length, tb.additionalPowers.length, "the powers still to come don't say they aren't written yet");

  const draft = lockedCharacter();
  draft.creation.locked = false;
  draft.identity.archetype = "werewolf";
  const w = boot({ storage: { "shadows.draft.v1": { ch: draft, step: 3, maxReached: 3 } } });
  w.click("[data-open]");
  assert.match(w.$("#main").textContent, new RegExp(tb.starterPower.name), "the wizard's Trueborn card doesn't show its starting power");
  assert.deepEqual([...app.errors, ...w.errors], []);
});

// ── B18: nothing replaces a saved character without asking ──────────────
// Import goes through the real file input and FileReader; downloads are
// caught at URL.createObjectURL, which jsdom doesn't implement.
function withDownloads(app) {
  const got = [];
  app.window.URL.createObjectURL = blob => { got.push(blob); return "blob:shadows-test"; };
  app.window.URL.revokeObjectURL = () => {};
  return got;
}
async function importFile(app, ch) {
  const input = app.$("#file-import");
  const file = new app.window.File([JSON.stringify(ch)], "x.shadows.json", { type: "application/json" });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new app.window.Event("change"));
  for (let i = 0; i < 50 && !app.$("#modal[open]") && app.window.eval("S.screen") === "home"; i++) await new Promise(r => setTimeout(r, 10));
}
const named = (name, extra = {}) => Object.assign(lockedCharacter(), { identity: Object.assign(lockedCharacter().identity, { name }) }, extra);

// ── The roster (R10, Decision 141): one entry per TAG ────────────────────
const charKeys = app => {
  const ls = app.window.localStorage, out = [];
  for (let i = 0; i < ls.length; i++) if (ls.key(i).startsWith("shadows.char.v1.")) out.push(ls.key(i));
  return out;
};
const entryOf = (app, id) => JSON.parse(app.window.localStorage.getItem("shadows.char.v1." + id));
const card = (app, name) => app.$$("#main .roster-card").find(c => c.querySelector(".roster-name").textContent === name);
const sheetHome = app => { app.click("[data-menu-toggle]"); app.click("[data-home]"); };

test("Decision 141: importing a different character adds it beside the saved one, with nothing asked", async () => {
  const vex = Engine.migrate(named("Vex Morrow"));
  const app = boot({ storage: { "shadows.active.v1": { ch: vex, section: "main" } } });
  withDownloads(app);
  const other = Engine.migrate(named("Other Player"));
  await importFile(app, other);
  assert.equal(app.$("#modal[open]"), null, "importing a different character still asks to replace one");
  assert.equal(app.window.eval("S.ch.identity.name"), "Other Player", "the imported character didn't open");
  sheetHome(app);
  const names = app.$$("#main .roster-card .roster-name").map(n => n.textContent);
  assert.deepEqual(names, ["Other Player", "Vex Morrow"], "Home doesn't list both, the most recently changed first");
  assert.doesNotMatch(card(app, "Other Player").textContent, /not exported/, "a character just opened from its own file says it isn't exported");
  assert.match(card(app, "Other Player").textContent, new RegExp(other.meta.id), "the card doesn't show the TAG");
  assert.deepEqual(app.errors, []);
});

test("B18: a newer copy of the same character replaces without asking; an older one asks", async () => {
  const vex = Engine.migrate(named("Vex Morrow"));
  vex.meta.updated = "2026-09-24T10:00:00.000Z";
  const app = boot({ storage: { "shadows.active.v1": { ch: vex, section: "main" } } });
  const newer = JSON.parse(JSON.stringify(vex));
  newer.meta.updated = "2026-09-24T12:00:00.000Z"; newer.notes = "after the heist";
  await importFile(app, newer);
  assert.equal(app.$("#modal[open]"), null, "a newer copy of the same character asked to replace itself");
  assert.equal(stored(app, { locked: true }).notes, "after the heist");

  app.click("[data-menu-toggle]"); app.click("[data-home]");
  const older = JSON.parse(JSON.stringify(vex));
  older.meta.updated = "2026-09-23T09:00:00.000Z"; older.notes = "before the heist";
  await importFile(app, older);
  assert.ok(app.$("#modal[open]"), "an older copy replaced the newer saved one without asking");
  assert.match(app.$("#modal").textContent, /older copy/);
  app.click("#modal [data-modalclose]");
  assert.equal(stored(app, { locked: true }).notes, "after the heist", "Cancel still opened the older copy");

  await importFile(app, older);
  const downloads = withDownloads(app);
  app.click("#modal [data-replaceexport]");
  assert.equal(downloads.length, 1, "Export first didn't download the saved copy");
  assert.match(await downloads[0].text(), /after the heist/, "Export first downloaded the wrong copy");
  assert.equal(stored(app, { locked: true }).notes, "before the heist", "after exporting, the older copy didn't open");
  assert.deepEqual(app.errors, []);
});

test("Decision 133: a sheet saved by 0.24.0 (NCR-) and a newer export of it are still the same character", async () => {
  // The browser slot isn't migrated until the sheet is opened, so it can
  // still say NCR- when the player imports their own newer file.
  const vex = Engine.migrate(named("Vex Morrow"));
  const digits = vex.meta.id.slice(4);
  const saved = JSON.parse(JSON.stringify(vex));
  saved.meta.id = "NCR-" + digits; saved.meta.schemaVersion = "0.11";
  saved.meta.updated = "2026-09-24T10:00:00.000Z";
  const app = boot({ storage: { "shadows.active.v1": { ch: saved, section: "main" } } });
  const newer = JSON.parse(JSON.stringify(saved));
  newer.meta.updated = "2026-09-24T12:00:00.000Z"; newer.notes = "after the heist";
  await importFile(app, newer);
  assert.equal(app.$("#modal[open]"), null, "an NCR- save and its own newer export were taken for two characters");
  const now = stored(app, { locked: true });
  assert.equal(now.notes, "after the heist");
  assert.equal(now.meta.id, "TAG-" + digits, "the imported file didn't carry its number over as a TAG");
  assert.deepEqual(app.errors, []);
});

test("Decision 141: New saves nothing until something changes, and Lock turns the same entry into a sheet beside the other one", () => {
  const vex = Engine.migrate(named("Vex Morrow"));
  const app = boot({ storage: { "shadows.active.v1": { ch: vex, section: "main" } } });
  app.click("#btn-new");
  assert.equal(app.$("#modal[open]"), null, "New asked about something");
  app.click('[data-nav="1"]');
  assert.equal(charKeys(app).length, 1, "an untouched new character was saved");
  app.window.eval("S.ch.identity.name = 'Fresh'; update();");
  assert.equal(charKeys(app).length, 2, "a new character wasn't saved once it changed");

  const half = named("Half-Built"); half.creation.locked = false;
  const w = boot({ storage: { "shadows.active.v1": { ch: vex, section: "main" }, "shadows.draft.v1": { ch: half, step: 7, maxReached: 7 } } });
  const got = withDownloads(w);
  card(w, "Half-Built").querySelector("[data-open]").click();
  w.window.eval("S.ch.creation.rolls.credits = 5; update();");
  w.click("[data-lock]");
  assert.equal(w.$("#modal[open]"), null, "Lock asked to replace another character");
  assert.equal(charKeys(w).length, 2, "Lock made a second entry instead of turning the draft into a sheet");
  assert.equal(entryOf(w, half.meta.id).ch.creation.locked, true, "the draft's own entry isn't locked");
  assert.equal(entryOf(w, vex.meta.id).ch.identity.name, "Vex Morrow", "locking touched the other character");
  assert.equal(got.length, 1, "Lock didn't export");
  sheetHome(w);
  assert.match(card(w, "Half-Built").textContent, /Open sheet/);
  assert.doesNotMatch(card(w, "Half-Built").textContent, /not exported/, "a character locked and exported a moment ago says it isn't exported");
  assert.deepEqual([...app.errors, ...w.errors], []);
});

test("Decision 141: Home marks a character with changes no file has; opening it doesn't, and exporting clears it", () => {
  const vex = Engine.migrate(named("Vex Morrow"));
  const app = boot({ storage: { "shadows.active.v1": { ch: vex, section: "main" } } });
  const downloads = withDownloads(app);
  const marked = () => /Changes not exported yet/.test(card(app, "Vex Morrow").textContent);
  assert.ok(marked(), "a character carried over from an older browser isn't marked, though no export of it is known");
  card(app, "Vex Morrow").querySelector("[data-exportchar]").click();
  assert.equal(downloads.length, 1, "Export on the card didn't download");
  assert.ok(!marked(), "exporting from Home didn't clear the mark");

  card(app, "Vex Morrow").click();   // the card itself, not a button
  assert.equal(app.window.eval("S.screen"), "sheet", "tapping the card didn't open it");
  app.click('[data-sec="skills"]'); app.click('[data-sec="trackers"]');
  sheetHome(app);
  assert.ok(!marked(), "opening a character and changing tabs marked it as changed");
  assert.match(card(app, "Vex Morrow").textContent, /Sheet · Trackers/, "the card doesn't say where the sheet was left");

  card(app, "Vex Morrow").querySelector("[data-open]").click();
  assert.equal(app.window.eval("S.section"), "trackers", "the sheet didn't reopen where it was left");
  app.window.eval("commit('notes', 'Notes', () => { S.ch.notes = 'after the heist'; });");
  sheetHome(app);
  assert.ok(marked(), "a change on the sheet didn't mark the character");
  card(app, "Vex Morrow").querySelector("[data-open]").click();
  app.click("[data-menu-toggle]"); app.click("#hdrmenu [data-export]");
  sheetHome(app);
  assert.ok(!marked(), "exporting from the sheet didn't clear the mark");
  assert.equal(downloads.length, 2);
  assert.deepEqual(app.errors, []);
});

test("Decision 141: Remove asks first, says what's at stake, and Export, then remove downloads the character before it goes", async () => {
  const vex = Engine.migrate(named("Vex Morrow")), other = Engine.migrate(named("Other Player"));
  const at = "2026-09-24T10:00:00.000Z";
  const app = boot({ storage: {
    ["shadows.char.v1." + vex.meta.id]: { ch: vex, section: "main", changed: at, exported: null },
    ["shadows.char.v1." + other.meta.id]: { ch: other, section: "main", changed: at, exported: at },
  } });
  const downloads = withDownloads(app);
  card(app, "Vex Morrow").querySelector("[data-remove]").click();
  assert.ok(app.$("#modal[open]"), "Remove didn't ask");
  assert.match(app.$("#modal").textContent, /only copy/, "removing a never-exported character doesn't say it's the only copy");
  app.click("#modal [data-modalclose]");
  assert.ok(card(app, "Vex Morrow"), "Cancel removed the character anyway");

  card(app, "Vex Morrow").querySelector("[data-remove]").click();
  app.click("#modal [data-removeexport]");
  assert.equal(downloads.length, 1, "Export, then remove didn't download");
  assert.match(await downloads[0].text(), /Vex Morrow/, "Export, then remove downloaded the wrong character");
  assert.equal(card(app, "Vex Morrow"), undefined, "the removed character is still listed");
  assert.equal(app.window.localStorage.getItem("shadows.char.v1." + vex.meta.id), null, "the removed character is still stored");
  assert.ok(card(app, "Other Player"), "removing one character removed another");

  card(app, "Other Player").querySelector("[data-remove]").click();
  assert.match(app.$("#modal").textContent, /isn't touched/, "removing an exported character doesn't say the file is safe");
  app.click("#modal [data-removego]");
  assert.equal(app.$("#main .roster"), null, "an empty roster still shows its heading");
  assert.deepEqual(app.errors, []);
});

test("R10: a 0.27 browser's saved sheet and draft both survive into the roster; an unreadable slot is left alone", () => {
  const vex = Engine.migrate(named("Vex Morrow"));
  const half = named("Half-Built"); half.creation.locked = false; delete half.meta.id;   // a draft from before TAGs
  const app = boot({ storage: { "shadows.active.v1": { ch: vex, section: "skills" }, "shadows.draft.v1": { ch: half, step: 3, maxReached: 5 } } });
  const ls = app.window.localStorage;
  assert.equal(ls.getItem("shadows.active.v1"), null, "the old sheet slot is still there");
  assert.equal(ls.getItem("shadows.draft.v1"), null, "the old draft slot is still there");
  assert.equal(charKeys(app).length, 2, "the sheet and the draft didn't both become entries");
  assert.match(card(app, "Vex Morrow").textContent, /Sheet · Skills/);
  assert.match(card(app, "Half-Built").textContent, new RegExp(`Draft · step 4 of ${D.creationFlow.steps.length + 1}`));
  card(app, "Half-Built").querySelector("[data-open]").click();
  assert.equal(app.window.eval("S.step"), 3, "the draft didn't reopen on its step");
  assert.equal(app.window.eval("S.maxReached"), 5);

  const bad = boot({ storage: { "shadows.active.v1": "{not json" } });
  assert.equal(bad.window.localStorage.getItem("shadows.active.v1"), "{not json", "an unreadable old slot was deleted");
  assert.equal(charKeys(bad).length, 0);

  // Both slots holding one character: the newer copy wins, whichever slot it was in.
  const copy = (updated, notes, locked) => Object.assign(JSON.parse(JSON.stringify(vex)), { notes, meta: Object.assign({}, vex.meta, { updated }), creation: Object.assign({}, vex.creation, { locked }) });
  for (const [active, draft] of [[copy("2026-09-20T00:00:00.000Z", "new", true), copy("2026-09-01T00:00:00.000Z", "old", false)],
                                 [copy("2026-09-01T00:00:00.000Z", "old", true), copy("2026-09-20T00:00:00.000Z", "new", false)]]) {
    const both = boot({ storage: { "shadows.active.v1": { ch: active, section: "main" }, "shadows.draft.v1": { ch: draft, step: 0, maxReached: 0 } } });
    assert.equal(charKeys(both).length, 1);
    assert.equal(entryOf(both, vex.meta.id).ch.notes, "new", "an older copy won over the newer one");
    assert.deepEqual(both.errors, []);
  }
  assert.deepEqual([...app.errors, ...bad.errors], []);
});

test("Decision 141: a save the browser refuses stays on the page until one goes through", () => {
  const vex = Engine.migrate(named("Vex Morrow"));
  const app = boot({ storage: { "shadows.active.v1": { ch: vex, section: "main" } } });
  card(app, "Vex Morrow").querySelector("[data-open]").click();
  const proto = app.window.Storage.prototype, real = proto.setItem;
  proto.setItem = function () { throw new app.window.DOMException("full", "QuotaExceededError"); };
  app.window.eval("commit('notes', 'Notes', () => { S.ch.notes = 'one'; });");
  assert.match(app.$("#main").textContent, /couldn't save your last change/, "a failed save said nothing");
  app.click('[data-sec="skills"]');
  assert.match(app.$("#main").textContent, /couldn't save/, "the warning went away before a save went through");
  proto.setItem = real;
  app.click('[data-sec="main"]');
  assert.doesNotMatch(app.$("#main").textContent, /couldn't save/, "the warning stayed after a save went through");
  assert.equal(entryOf(app, vex.meta.id).ch.notes, "one");
  assert.deepEqual(app.errors, []);
});

test("B18: the intake number sits under the name on Main and in the printed header; Main's subtitle names the specialization", () => {
  const ch = Engine.migrate(named("Vex Morrow"));
  ch.identity.archetype = "werewolf"; ch.archetypeChoices.specialization = ["trueborn"];
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "main" } } });
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent)).click();
  const intake = app.$("#main .intake");
  assert.ok(intake && intake.textContent.includes(ch.meta.id), "Main doesn't show the intake number");
  assert.match(intake.textContent.trim(), /^TAG-/, "Main labels the number instead of showing the TAG itself (Decision 133)");
  assert.ok(intake.querySelector("svg rect"), "the intake number has no bars");
  assert.match(app.$("#main").textContent, /Werewolf · Trueborn · /, "Main's subtitle still leaves out the specialization");
  app.window.print = () => {};
  app.click("[data-menu-toggle]"); app.click("[data-print]");
  assert.ok(app.$("#printSheet .p-intake") && app.$("#printSheet .p-intake").textContent.includes(ch.meta.id), "the print header doesn't carry the intake number");
  assert.deepEqual(app.errors, []);
});

// ── The Professional as data (Decision 134) ──────────────────────────

test("B12: the wizard asks a Mercenary for its fifth Focused Skill, and Jack's card says what isn't settled", () => {
  const app = onArchetypeStep("professional", "heroic");
  app.click('[data-spec="mercenary"]');
  const card = app.$('[data-spec="mercenary"]').closest(".pick");
  assert.match(card.textContent, /Athletics, Awareness, Combat Sense, Handguns, and 1 Combat Skill of your choice/,
    "the card's Focused Skills line isn't built from the data");
  const picks = app.$$("[data-fskill]");
  assert.ok(picks.length > 0, "no Focused Skill picker for the Mercenary");
  assert.ok(!picks.some(b => b.dataset.fskill === "handguns"), "the picker offers Handguns, which the Mercenary already has");
  app.click('[data-fskill="rifles"]');
  assert.equal(draft(app).archetypeChoices.focusedSkillPicks.join(), "rifles");
  assert.ok(app.$('[data-fskill="melee"]').disabled, "a second pick is offered when one is the count");
  const jack = app.$('[data-spec="jack-of-all-trades"]').closest(".pick");
  const note = D.archetypes.find(a => a.id === "professional").specialization.options.find(o => o.id === "jack-of-all-trades").playerNote;
  assert.ok(jack.textContent.includes(note), "Jack of All Trades doesn't say its cap question is unsettled");
  assert.doesNotMatch(jack.textContent, /F33/, "maintainer text reached the card");
  assert.deepEqual(app.errors, []);
});

test("B13: the wizard's skill stepper lets a Focused Skill past the power level's Max Rank", () => {
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = "professional";
  ch.archetypeChoices.specialization = ["mercenary"];
  ch.creation.powerLevel = "heroic";                  // Max Skill Rank 5, Focused +2
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  ch.skills.athletics = { rank: 5, ipe: 0 };
  ch.skills.stealth = { rank: 5, ipe: 0 };
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("skills"), maxReached: steps.length } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.match(app.$(".roll-entry .pool").textContent, /Max Rank 5 · Focused 7/);
  assert.ok(!app.$('[data-step="skill|athletics|1"]').disabled, "Focused Athletics stops at 5");
  assert.ok(app.$('[data-step="skill|stealth|1"]').disabled, "unfocused Stealth goes past 5");
  app.click('[data-step="skill|athletics|1"]');
  assert.equal(draft(app).skills.athletics.rank, 6);
  assert.deepEqual(app.errors, []);
});

test("a locked Mercenary short its pick chooses it on Loadout, as one undoable action", () => {
  // A Mercenary locked before its pick existed, or after a designer raises a
  // count, would otherwise have no way to take it.
  const ch = lockedCharacter();
  ch.identity.archetype = "professional";
  ch.archetypeChoices.specialization = ["mercenary"];
  const app = openSheet(ch, "loadout");
  assert.match(app.$("#main").textContent, /Choose 1 more Combat Skill to Focus/);
  app.click('[data-fpick="rifles"]');
  assert.equal(activeChar(app).archetypeChoices.focusedSkillPicks.join(), "rifles");
  assert.doesNotMatch(app.$("#main").textContent, /Choose 1 more/, "the picker stays after the count is met");
  assert.match(app.$("#main").textContent, /Rifles/);
  app.click('[data-sec="sessions"]');
  assert.match(app.$("#main").textContent, /Focused Skill: Rifles/, "the pick is missing from the Activity Log");
  app.click("button[data-undolast]");
  assert.equal(activeChar(app).archetypeChoices.focusedSkillPicks.length, 0, "undo didn't take the pick back");
  assert.deepEqual(app.errors, []);
});

// ── Read it or label it (Decision 135) ────────────────────────────────
// The engine tests prove the engine reads each number. These prove the
// screens do too: change the number in the booted app's own data, and what
// the wizard and sheet draw follows it. A value typed into the UI beside the
// data (the 6 CP, INT · COOL · EMP) passes every other test while the data
// happens to agree with it.
function draftOn(archetype, stepId, tweak) {
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = archetype;
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 5;
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf(stepId), maxReached: steps.length - 1 } } });
  if (tweak) tweak(app.D);
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
    .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  return app;
}
const withDisciplines = d => d.archetypes.find(a => a.coreMechanic && a.coreMechanic.disciplines);

test("the wizard draws Disciplines, Focus Stats and the Stat Bonus from the data (Decision 135)", () => {
  const arc = withDisciplines(D).id;
  const cp = draftOn(arc, "character-points", d => { withDisciplines(d).coreMechanic.disciplines.cpPerRank = 7; });
  assert.match(cp.$("#main").textContent, /Disciplines — 7 CP per rank · cap \d/);
  assert.deepEqual(cp.errors, []);

  const focus = draftOn(arc, "archetype", d => { withDisciplines(d).campaignPowerScaling.focusStats = ["INT", "EMP"]; });
  assert.match(focus.$("#main").textContent, /Allocate among INT · EMP — /);
  const focusStats = [...new Set(focus.$$('[data-step^="focus|"]').map(b => b.dataset.step.split("|")[1]))].sort().join(" ");
  assert.equal(focusStats, "EMP INT", "the Focus Stat steppers aren't the data's focusStats");
  assert.match(focus.$("#main").textContent, /Evocation starts at rank \d+\. You choose your starting spells \(TOL \+ \dd4\) in Step 7/);

  // The Stat Bonus block is keyed by the scaling row, not the archetype.
  const ww = D.archetypes.find(a => Object.values((a.campaignPowerScaling || {}).byPowerLevel || {}).some(r => r.statBonusRoll)).id;
  const sb = draftOn(ww, "archetype");
  assert.match(sb.$("#main").textContent, /Stat Bonus.*Allocate to any Stats \(cap 10\)/s);
  assert.match(sb.$("#main").textContent, /WILL × 3 \+ 5/, "the starting SFR formula didn't read as text");
  assert.deepEqual([...focus.errors, ...sb.errors], []);
});

test("the SFR tracker counts down by its data, and a Major Milestone shows its details (Decision 135)", () => {
  const ww = D.archetypes.find(a => ((a.coreMechanic || {}).panels || []).some(p => p.counts === "down"));
  const ch = lockedCharacter();
  ch.identity.archetype = ww.id;
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "trackers" } } });
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent))
    .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click('[data-sec="trackers"]');
  const max = app.Engine.sfr(activeChar(app)).value;
  const trk = () => app.$$("#main .trk").find(t => t.querySelector('[data-trk="sfr|1"]'));
  assert.match(trk().textContent, new RegExp(`${max} / ${max}.*Counts spend against a computed pool`, "s"));
  app.click('#main [data-trk="sfr|1"]');
  assert.equal(activeChar(app).trackers.sfr.spent, 1, "spending SFR didn't land on trackers.sfr");
  assert.match(trk().textContent, new RegExp(`${max - 1} / ${max}`));

  app.click('[data-sec="progression"]');
  const hp = D.milestones.majorGeneral.find(m => (m.details || []).length);
  assert.ok(app.$("#main").textContent.includes(hp.details[0]), `${hp.name}'s details don't show`);
  assert.deepEqual(app.errors, []);
});

test("the sheet's price and SAN lines are written from the data (Decision 135)", () => {
  const app = boot({ storage: { "shadows.active.v1": { ch: lockedCharacter(), section: "main" } } });
  app.D.ip.statIncreaseCost.perPoint = 12;
  app.D.derived.find(d => d.id === "SAN").formula.times = 7;
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent))
    .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click('[data-sec="progression"]');
  assert.match(app.$("#main").textContent, /Raise a Stat — current value × 12 IP/);
  app.click('[data-sec="trackers"]');
  assert.match(app.$("#main").textContent, /Max is EMP × 7, computed\./);
  assert.match(app.window.eval("derivedBreakdownStr(S.ch, 'SAN')"), /^EMP 5 × 7 = 35%/);
  assert.deepEqual(app.errors, []);
});

// ── Rules a tap away (Decision 139) ───────────────────────────────────
const tip = app => app.$("#tip");
const tipShown = app => tip(app) && !tip(app).hidden ? tip(app).textContent : "";
const withWhip = () => { const ch = lockedCharacter(); ch.weapons = [{ id: "razorwhip", notes: "", mods: [], roundsSpent: 0 }]; return ch; };

test("a tag on Main reads out on a tap, with a flagged tag's player note, and a second tap or Esc puts it away", () => {
  const app = openSheet(withWhip(), "main");
  const ap = app.$('#main .tag[data-term="AP"]');
  assert.ok(ap, "Main's weapon shows no AP chip");
  clickIn(app, ap);
  assert.match(tipShown(app), /Armor Piercing/, "the tap didn't read the tag out");
  assert.equal(ap.getAttribute("aria-describedby"), "tip");
  clickIn(app, ap);
  assert.equal(tipShown(app), "", "a second tap left it open");
  clickIn(app, app.$('#main .tag[data-term="Reach"]'));
  assert.match(tipShown(app), /GM rules on it/, "a flagged tag hid its player note");
  app.doc.dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(tipShown(app), "", "Esc didn't put it away");
  assert.deepEqual(app.errors, []);
});

test("in the catalog a tag reads out inside the modal, and doesn't open the row (Decision 139)", () => {
  const app = openSheet(lockedCharacter(), "loadout");
  app.click('[data-lobrowse="weapons"]');
  const row = app.$('#modal [data-catrow="razorwhip"]');
  clickIn(app, row.querySelector('.tag[data-term="AP"]'));
  assert.match(tipShown(app), /Armor Piercing/);
  assert.ok(app.$("#modal").contains(tip(app)), "the tip sits under the modal's top layer");
  assert.equal(app.$('#modal [data-catrow="razorwhip"]').getAttribute("aria-expanded"), "false", "the tap opened the row too");
  app.click("#modal [data-modalclose]");
  assert.equal(tipShown(app), "", "the tip outlived the modal");
  assert.deepEqual(app.errors, []);
});

test("Loadout's weapons and the Grimoire's spells read their tags out (Decision 139)", () => {
  const ch = withWhip();
  ch.panelData.grimoire = [{ spellId: "kindle", stage: "known", notes: "" }];
  const app = openSheet(ch, "loadout");
  clickIn(app, app.$('#main .lo-weapons .tag[data-term="AP"]'));
  assert.match(tipShown(app), /Armor Piercing/);
  clickIn(app, app.$('#main .spell .tag[data-term="Fire"]'));
  assert.match(tipShown(app), new RegExp(D.spellTagGlossary.find(t => t.id === "Fire").description.slice(0, 20)));
  assert.deepEqual(app.errors, []);
});

test("a stat's score says what it means (Decision 139)", () => {
  const ch = lockedCharacter();
  ch.stats.BOD.base = 8;
  const app = openSheet(ch, "main");
  clickIn(app, app.$('#main [data-tip="stat"][data-term="BOD"]'));
  assert.match(tipShown(app), /Body 8/);
  assert.match(tipShown(app), new RegExp(D.statRules.ranges.find(r => r.min === 7).meaning.slice(0, 20)));
  assert.deepEqual(app.errors, []);
});

test("rules text: Lineage and the whole Magic reference on Archetype, How a check works on Skills (AQ4)", () => {
  const app = openSheet(lockedCharacter(), "archetype");
  const arc = D.archetypes.find(a => a.id === "arcanist");
  const main = () => app.$("#main").textContent;
  assert.match(app.$("#main details.lineage").textContent, new RegExp(arc.lore.slice(0, 30)));
  for (const t of ["Charging, holding and learning", "Domains and Glyphs", "Enchantment and Alchemy", "The Sovereign Soul", "Copied cold"])
    assert.ok(main().includes(t), `the Magic reference has no ${t}`);
  assert.match(main(), /Once-Living/, "no materials table");
  app.click('[data-sec="skills"]');
  assert.match(main(), /How a check works/);
  assert.ok(main().includes(D.skillCheckRules.botch), "the botch rule is missing");
  assert.deepEqual(app.errors, []);
});

test("the wizard shows the chosen archetype's lore (AQ4 2)", () => {
  const app = onArchetypeStep("werewolf");
  const lore = D.archetypes.find(a => a.id === "werewolf").lore;
  assert.ok(app.$("#main .arch-lore").textContent.includes(lore.slice(0, 40)));
  assert.deepEqual(app.errors, []);
});

test("Ammo is a category in the equipment catalog, and Buy puts a dozen broadheads in the bag (AQ4 3)", () => {
  const ch = lockedCharacter();
  ch.trackers.credits.current = 1000;
  const app = openSheet(ch, "loadout");
  const buy = pickFromCatalog(app, "gear", "standard-broadhead", "buy");
  assert.match(app.$("#modal").textContent, /Ammo/);
  clickIn(app, buy);
  app.click("#modal [data-modalclose]");
  assert.deepEqual([activeChar(app).gear[0].qty, activeChar(app).trackers.credits.current], [12, 950]);
  assert.deepEqual(app.errors, []);
});

test("deleting a session asks in the modal: Cancel keeps it, the button deletes it (C5)", () => {
  const ch = lockedCharacter();
  Engine.logSession(ch, { title: "The docks", ipEarned: 3, milestonePoint: true });
  const app = openSheet(ch, "sessions");
  app.click("[data-sesdel]");
  assert.match(app.$("#modal").textContent, /Delete this session\?/);
  app.click("#modal [data-modalclose]");
  assert.equal(activeChar(app).sessions.length, 1, "Cancel deleted it");
  app.click("[data-sesdel]");
  app.click("#modal [data-askyes]");
  assert.equal(activeChar(app).sessions.length, 0, "the button didn't delete it");
  assert.deepEqual(app.errors, []);
});
