/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: the app boots, the sheet's tabs render, and the wizard's steps.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot, stored } from "./harness.mjs";
import { Engine, D, lockedCharacter, onArchetypeStep, onStep, openSheet, activeChar, search, arcanistOnCP, draft, card, sheetHome, draftOn, wizCss, GM_ON, seedTable, type, tableHome, lockedVampire, named, withDownloads } from "./smokekit.mjs";

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
  assert.equal(tabs.length, 8, `expected 8 sheet tabs, got ${tabs.length}`);
  for (const id of tabs) {
    app.click(`[data-sec="${id}"]`);
    assert.deepEqual(app.errors, [], `runtime error on tab: ${id}`);
    assert.ok(app.$("#main").textContent.trim().length > 40, `tab rendered empty: ${id}`);
  }
});

test("the tab row keeps the active tab in view and fades the side with more (B19)", () => {
  // jsdom has no layout, so give the row one: eight 100 px tabs in 390 px.
  const app = boot({ storage: { "shadows.active.v1": { ch: lockedCharacter(), section: "main" } } });
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent))
    .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  const nav = app.$("#topnav");
  let left = 0;
  const max = 800 - 390;
  Object.defineProperty(nav, "scrollLeft", { get: () => left, set: v => { left = Math.max(0, Math.min(max, v)); } });
  Object.defineProperty(nav, "scrollWidth", { get: () => 800 });
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

// Decision 156: every character's Skills tab lists the same skills in the same
// places, so a player finds one without knowing what they trained.
test("the Skills tab lists every skill in its category, untrained at Rank 0 with its true check, in two balanced columns", () => {
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  assert.match(css, /@media \(min-width:1000px\)\{[^}]*\.skill-cols\{grid-template-columns:1fr 1fr\}/, "the Skills tab has no two-column rule");
  const app = openSheet(lockedCharacter(), "skills");
  const ch = activeChar(app);
  const rows = app.$$("#main .skill-line");
  assert.equal(rows.length, D.skills.length, "a skill is missing from the Skills tab");
  assert.equal(app.$$("#main details > summary").filter(x => /^Untrained/.test(x.textContent)).length, 0, "untrained skills are still behind an expander");
  for (const r of rows) {
    const l = D.skills.map(s => Engine.skillLine(ch, s.id)).find(x => r.textContent.startsWith(x.def.name));
    assert.ok(l, `a row names no skill: ${r.textContent.slice(0, 30)}`);
    assert.equal(r.querySelector('[data-k="Rank"]').textContent, String(l.trained ? l.rank : 0), `${l.def.name}'s rank`);
    assert.equal(r.querySelector('[data-k="Check"]').textContent, `1d10 + ${l.checkBonus}`, `${l.def.name}'s check`);
    assert.equal(r.classList.contains("untrained"), !l.trained);
    assert.ok(!r.getAttribute("style"), `${l.def.name} is dimmed as a whole row`);
  }
  // Columns: the categories in data order, never split, the first holding
  // them until it has half the skills.
  const cols = app.$$("#main .skill-col").map(c => [...c.querySelectorAll(".cat-row")].map(x => x.textContent));
  const count = cid => D.skills.filter(s => s.category === cid).length;
  const cats = ["combat", "utility", "general"].filter(count), half = D.skills.length / 2, want = [[], []];
  let left = 0;
  for (const c of cats) { const i = left < half ? 0 : 1; want[i].push(c[0].toUpperCase() + c.slice(1)); if (!i) left += count(c); }
  assert.deepEqual(cols, want);
  assert.ok(cols[1].length, "everything went in one column");
  assert.deepEqual(app.errors, []);
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
  for (const arch of D.archetypes.filter(a => ((a.specialization || {}).options || []).length)) {
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
  app.click('[data-sec="character"]');
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
  sheet.click('[data-sec="character"]');
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

// ── Starting spells in the wizard (Decision 111) ──────────────────────

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

// ── The Professional as data (Decision 134) ──────────────────────────

test("B12: the wizard asks a Mercenary for its fifth Focused Skill, and Jack's card says it raises no starting cap", () => {
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
  // F33 closed (0412): the rule is in the benefit, and nothing says it's unsettled.
  assert.match(jack.textContent, /doesn't raise any skill's starting rank/, "Jack of All Trades doesn't say it raises no starting cap");
  assert.doesNotMatch(jack.textContent, /still being settled/, "Jack's card still calls a closed question unsettled");
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
const withDisciplines = d => d.archetypes.find(a => a.coreMechanic && a.coreMechanic.disciplines);

test("the wizard draws Disciplines, Focus Stats and the Stat Bonus from the data (Decision 135)", () => {
  const arc = withDisciplines(D).id;
  const cp = draftOn(arc, "character-points", d => { d.creationFlow.boostRules.cpPerPowerRank = 7; });
  assert.match(cp.$("#main").textContent, /Disciplines — 7 CP per rank · cap \d/);
  assert.deepEqual(cp.errors, []);

  const focus = draftOn(arc, "archetype", d => { withDisciplines(d).campaignPowerScaling.focusStats = ["INT", "EMP"]; });
  assert.match(focus.$("#main").textContent, /Allocate among INT · EMP — /);
  const focusStats = [...new Set(focus.$$('[data-step^="focus|"]').map(b => b.dataset.step.split("|")[1]))].sort().join(" ");
  assert.equal(focusStats, "EMP INT", "the Focus Stat steppers aren't the data's focusStats");
  assert.match(focus.$("#main").textContent, /Evocation starts at rank \d+\. You choose your starting spells \(TOL \+ \dd4\) in Step 7/);

  // A Werewolf's (or a Vampire's) bonus goes on its Focus Stats, BOD, REF and MOB (0414, Decision 197).
  const ww = D.archetypes.find(a => Object.values((a.campaignPowerScaling || {}).byPowerLevel || {}).some(r => r.startingSFR)).id;
  const wf = draftOn(ww, "archetype");
  assert.match(wf.$("#main").textContent, /Allocate among BOD · REF · MOB — these points can push a stat past 10/);
  const f = D.archetypes.find(a => a.id === ww).campaignPowerScaling.byPowerLevel[D.powerLevels[0].id].startingSFR;
  assert.ok(wf.$("#main").textContent.includes(`${f.stat} × ${f.times} + ${f.plus}`), "the starting SFR formula didn't read as text");

  // The Stat Bonus block is keyed by the scaling row, not the archetype. No
  // archetype rolls one since 0414, so a fixture row does.
  const sb = draftOn(ww, "archetype", d => { const row = d.archetypes.find(a => a.id === ww).campaignPowerScaling.byPowerLevel.street;
    row.statBonusRoll = row.focusStatBonusRoll; delete row.focusStatBonusRoll; });
  assert.match(sb.$("#main").textContent, /Stat Bonus.*Allocate to any Stats \(cap 10\)/s);
  assert.deepEqual([...focus.errors, ...wf.errors, ...sb.errors], []);
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

  assert.deepEqual(app.errors, []);
  // The General Majors are the Professional's (Decision 217), so a Professional shows their details.
  const pro = lockedCharacter(); pro.identity.archetype = "professional";
  const app2 = openSheet(pro, "progression");
  const hp = D.milestones.majorGeneral.find(m => (m.details || []).length);
  assert.ok(app2.$("#main").textContent.includes(hp.details[0]), `${hp.name}'s details don't show`);
  assert.deepEqual(app2.errors, []);
});

test("the sheet's price and SAN lines are written from the data (Decision 135)", () => {
  const app = boot({ storage: { "shadows.active.v1": { ch: lockedCharacter(), section: "main" } } });
  app.D.ip.statIncreaseCost.perPoint = 12;
  app.D.derived.find(d => d.id === "SAN").formula.times = 7;
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent))
    .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click('[data-sec="progression"]');
  app.click('[data-raiseopen="stat"]');
  assert.match(app.$("#modal").textContent, /a Stat costs its current value × 12 IP/);
  app.click("#modal [data-modalclose]");
  app.click('[data-sec="trackers"]');
  assert.match(app.$("#main").textContent, /Max is EMP × 7, computed\./);
  assert.match(app.window.eval("derivedBreakdownStr(S.ch, 'SAN')"), /^EMP 5 × 7 = 35%/);
  assert.deepEqual(app.errors, []);
});

// ── The stat buy (Decision 150) ───────────────────────────────────────

test("Decision 198: the Power Level step offers the book's flat pool, rolling is a box the GM ticks, and Stats asks for dice only when rolling", () => {
  const pl = draftOn("arcanist", "power-level");
  const box = () => pl.$("[data-stat-rolled]");
  assert.ok(box(), "no box to roll for Stat Points on the Power Level step");
  assert.equal(box().checked, false, "a new character isn't on the flat pool");
  assert.equal(pl.$("[data-stat-method]"), null, "flat and rolled are still an equal choice");
  assert.match(pl.$("#main").textContent, /Stats 45\s*Skills/, "the Street card doesn't show the flat pool alone");
  box().checked = true; box().dispatchEvent(new pl.window.Event("change"));
  assert.equal(draft(pl).creation.statMethod, "rolled");
  assert.ok(box().checked, "the box didn't stay ticked");
  assert.match(pl.$("#main").textContent, /Stats 40\+1d10\s*Skills/, "the card doesn't show the rolled pool once ticked");
  assert.match(pl.$("#main .stat-method").textContent, /Street Level is 40 \+ 1d10 instead of 45/);
  assert.deepEqual(pl.errors, []);

  const flat = draftOn("arcanist", "stats");                         // all 5s: 32 of 45
  assert.equal(flat.$('[data-roll="statPoints"]'), null, "a flat pool asks for a roll");
  assert.match(flat.$("#main .pool").textContent, /Pool 45 · Remaining 13/);
  flat.click('[data-step="stat|BOD|1"]');                             // 6: +1
  flat.click('[data-step="stat|BOD|1"]');                             // 7: +2
  assert.match(flat.$("#main .pool").textContent, /Remaining 10/, "a 7 didn't cost 2");
  assert.match(flat.$("#main").textContent, /The next point costs 2\./);
  assert.deepEqual(flat.errors, []);

  pl.$$("#ledger [data-goto]")[D.creationFlow.steps.findIndex(s => s.id === "stats")].click();
  assert.ok(pl.$('[data-roll="statPoints"]'), "a rolled pool doesn't ask for the roll");
  assert.equal(pl.$("#main .die").textContent, "40+1d10");
  assert.deepEqual(pl.errors, []);
});

test("Decision 150: the + stops where the next point costs more than is left", () => {
  const app = draftOn("arcanist", "stats");
  const ch = draft(app);
  Object.assign(ch.stats, { BOD: { base: 6, ipe: 0 }, REF: { base: 10, ipe: 0 }, MOB: { base: 10, ipe: 0 }, INT: { base: 8, ipe: 0 },
    TECH: { base: 2, ipe: 0 }, COOL: { base: 2, ipe: 0 }, MAG: { base: 2, ipe: 0 }, EMP: { base: 2, ipe: 0 } });
  const steps = D.creationFlow.steps.map(s => s.id);
  const again = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("stats"), maxReached: steps.length - 1 } } });
  again.$$("#main button").find(b => /Resume draft/.test(b.textContent)).click();
  assert.match(again.$("#main .pool").textContent, /Remaining 1\b/);
  assert.ok(again.$('[data-step="stat|BOD|1"]').disabled, "a 7 is buyable with 1 point left");
  assert.ok(!again.$('[data-step="stat|TECH|1"]').disabled, "a 3 isn't buyable with 1 point left");
  assert.deepEqual(again.errors, []);
});

test("Decision 150: Admin doesn't measure a character locked under the earlier table", () => {
  const old = lockedCharacter();
  old.meta.schemaVersion = "0.14";
  const sheet = openSheet(Engine.migrate(old), "main");
  sheet.click("[data-menu-toggle]"); sheet.click("[data-admin]");
  assert.match(sheet.$("#main").textContent, /earlier creation table/);
  assert.doesNotMatch(sheet.$("#main").textContent, /Stat Points \d+ (left|over)/);
  const now = openSheet(lockedCharacter(), "main");
  now.click("[data-menu-toggle]"); now.click("[data-admin]");
  assert.match(now.$("#main").textContent, /Stat Points \d+ (left|over)/, "a current character lost its budgets");
  assert.deepEqual([sheet.errors, now.errors], [[], []]);
});

// ── The wizard's nav sticks to the bottom of a long step ────────────────
// Continue is in reach from anywhere; the issues sit above it, and while one
// blocks, the bar counts them and links there. Typing redraws all of it in
// place, and the issues stay above the bar.
test("the wizard's nav sticks to the screen's bottom, counts what blocks Continue, and keeps the issues above it", () => {
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  const rule = (css.match(/\.wiznav\{([^}]*)\}/) || [])[1] || "";
  assert.match(rule, /position:sticky/, "the nav doesn't stick");
  assert.match(rule, /bottom:0/, "the nav doesn't stick to the bottom");

  const app = onArchetypeStep(D.archetypes.find(a => a.writeIn).id);
  const nav = () => app.$(".wiznav"), why = () => app.$(".wiznav-why");
  const count = () => app.$$("#wiz-issues .issues li.error").length;
  const above = () => app.$$("#wiz-issues").length === 1 && app.$("#wiz-issues").nextElementSibling === nav();
  assert.ok(count() > 0, "a nameless Custom archetype has nothing to fix");
  assert.equal(app.$('[data-nav="1"]').disabled, true);
  assert.ok(why(), "Continue is disabled and the bar doesn't say why");
  assert.match(why().textContent, new RegExp(`^${count()} things? to fix first$`));
  assert.equal(why().getAttribute("href"), "#wiz-issues");
  assert.ok(above(), "the issues aren't just above the nav");

  const before = count(), el = app.$('[data-wi="name"]');
  el.value = "Changeling"; el.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  assert.equal(count(), before - 1, "naming the archetype didn't clear its error");
  assert.ok(above(), "a redraw in place put the issues below the nav, or twice");
  assert.equal(app.$$(".wiznav-why").length, 1, "a redraw in place doubled the count");
  assert.match(why().textContent, new RegExp(`^${count()} things? to fix first$`), "the count didn't follow the redraw");
});

// ── The wizard on a small screen (Decision 161, W44) ────────────────────
// Below 1060px the rail was a block of every vital above the header and the
// step, so a phone opened on vitals and step 1's choice sat off the screen.
// Now: the strip and the title read each step's short name from the data, the
// sentence sits under the title once, and the rail is one sticky line of the
// points left with a Vitals pill that opens the whole rail in the flyout.
function newCharacterApp() {
  const app = boot();
  app.$$("#main button").find(b => /New character/.test(b.textContent))
    .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  return app;
}
test("the step strip and the step title read the data's short name, with the step's sentence under it once (Decision 161)", () => {
  for (const s of D.creationFlow.steps) {
    assert.ok(s.short && s.short.length < s.label.length, `step ${s.id} has no short name shorter than its label`);
  }
  const home = boot();
  assert.doesNotMatch(home.$("#main").textContent, /\[ 1 0 \]/, "Home still shows the [ 1 0 ] glyph");

  const app = newCharacterApp();
  const names = app.$$("#ledger [data-goto]").map(r => r.textContent.replace(r.querySelector(".n").textContent, "").trim());
  assert.deepEqual(names, [...D.creationFlow.steps.map(s => s.short), "Review"]);
  const first = D.creationFlow.steps[0];
  assert.equal(app.$(".step-title").textContent, first.short);
  assert.ok(app.$(".step-note").textContent.startsWith(first.label), "the step's sentence isn't under its title");
  assert.notEqual(app.$(".step-title").textContent, app.$(".step-note").textContent, "the title and the sentence under it are the same");
  assert.deepEqual(app.errors, []);
});

test("the rail's stats read — until a Stat Point is spent, then their scores (Decision 161)", () => {
  const app = newCharacterApp();
  const bod = () => app.$$("#vitals .vfull .vrow").find(r => r.querySelector(".k").textContent.trim() === "BOD");
  const will = () => app.$$("#vitals .vfull .vrow").find(r => r.querySelector(".k").textContent.trim() === "WILL");
  assert.equal(bod().querySelector(".v").textContent, "—", "an unchosen stat reads as a score");
  assert.equal(will().querySelector(".v").textContent, "—", "a value worked out from unchosen stats reads as a score");
  app.$(`[data-pl="${D.powerLevels[0].id}"]`).dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  for (const _ of [1, 2]) app.$('[data-nav="1"]').dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  const up = app.$('[data-step="stat|BOD|1"]');
  assert.ok(up, "no way to raise BOD on the Stats step");
  up.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.match(bod().querySelector(".v").textContent, /^2 \(/, "a spent Stat Point didn't show its score");
  assert.deepEqual(app.errors, []);
});

test("below 1060px the rail is one sticky line of points left, and Vitals opens the whole rail in the flyout (Decision 161)", () => {
  const css = wizCss();
  assert.doesNotMatch(css, /aside\.vitals\{[^}]*order:-1/, "the rail is still ordered above the header");
  assert.match(css, /aside\.vitals\{order:1; position:sticky; top:var\(--hdr-off\)/, "the narrow rail isn't a sticky line under the header");
  assert.match(css, /\.app:not\(\.sheet-mode\) main\{order:2\}/, "the step doesn't come after the rail's line");
  assert.match(css, /\.vitals \.vfull\{display:none\}/, "the full rail still shows on a narrow screen");
  assert.match(css, /\.app:has\(\.jumpbar\.sticky\) aside\.vitals\{position:static\}/,
    "step 7 pins the line and its jump bar both, two CP counts");
  assert.match(css, /:focus\) aside\.vitals,\s*\.app:has\([^{]*:focus\) \.wiznav\{position:static\}/,
    "the line and Back/Continue still stick while a field is being typed in");

  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.creation.powerLevel = D.powerLevels[0].id;
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 3;
  ch.trackers.luck.bonus = 1;   // a point of LUCK bought, so CP left isn't the whole budget
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("stats"), maxReached: steps.indexOf("stats") } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
    .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  const live = app.window.eval("S.ch");
  const sp = Engine.statPool(live), kp = Engine.skillPool(live), cp = Engine.cp(live);
  assert.ok(cp.left < cp.budget && Engine.statSpent(live) > 0, "the probe spends nothing, so left and total can't be told apart");
  const pills = app.$$("#vitals .vstrip .vpill:not(.toggle)").map(p => p.querySelector(".vk").textContent + " " + p.querySelector(".vv").textContent);
  assert.deepEqual(pills, [
    `Stats ${sp.total - Engine.statSpent(live)}/${sp.total}`,
    `Skills ${kp.total - Engine.skillSpent(live)}/${kp.total}`,
    `CP ${cp.left}/${cp.budget}`]);

  const dr = app.$("#vdrawer");
  assert.ok(!dr.classList.contains("open"));
  app.$("#vitals [data-wiz-vitals]").dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.ok(dr.classList.contains("open"), "Vitals didn't open the flyout");
  assert.equal(dr.getAttribute("aria-hidden"), "false");
  assert.ok(app.$$("#vdrawer .vrow").some(r => /BOD/.test(r.textContent)), "the flyout doesn't hold the whole rail");
  assert.ok(!app.$("#vdrawer [data-vitals-pin]"), "the wizard's flyout offers a pin");
  app.$("#vdrawer [data-vitals-close]").dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.ok(!dr.classList.contains("open"), "✕ didn't close the flyout");
  assert.equal(app.window.document.activeElement, app.$("#vitals [data-wiz-vitals]"), "closing didn't hand focus back to Vitals");
  assert.deepEqual(app.errors, []);
});

// ── The wizard's write-in block (Decision 153, custom archetype S3) ─────
test("a Custom archetype is written on the Archetype step: what it is, its classification, mechanics and three lists", () => {
  const custom = D.archetypes.find(a => a.writeIn);
  const app = onArchetypeStep(custom.id);
  const type = (sel, v) => { const el = app.$(sel); assert.ok(el, `no ${sel}`); el.focus(); el.value = v; el.dispatchEvent(new app.window.Event("input", { bubbles: true })); return el; };
  const next = () => app.$('[data-nav="1"]');
  const issues = () => app.$$(".issues li").map(l => l.textContent);
  assert.equal(app.$$("[data-spec]").length, 0, "a write-in archetype drew a specialization");
  assert.equal(next().disabled, true, "Continue is open with no name and no classification");

  // Typing saves without a redraw, so the field keeps focus.
  const name = type('[data-wi="name"]', "Changeling");
  assert.equal(app.doc.activeElement, name, "typing the name lost focus");
  app.click('[data-wicls="other"]');
  type('[data-wi="classificationText"]', "Fae");
  const box = app.$('[data-wimech="sfr"]');
  box.checked = true; box.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(next().disabled, false, `still blocked: ${issues().join(" | ")}`);

  app.click('[data-wiadd="traits"]');
  assert.equal(app.doc.activeElement, app.$('[data-wirow="traits|0|name"]'), "a new trait's name doesn't take focus");
  type('[data-wirow="traits|0|name"]', "Glamour");
  app.click("[data-pwadd]");
  type('[data-pwf$="|name"]', "Fade");
  type('[data-pwf$="|uses"]', "SFR");
  assert.ok(app.$$("#power-uses option").map(o => o.value).includes("SFR"), "Uses has no suggestions");
  app.click('[data-wiadd="vulnerabilities"]');
  type('[data-wirow="vulnerabilities|0|description"]', "Cold iron burns.");
  assert.ok(issues().some(t => /no name/.test(t)), "a nameless vulnerability with words says nothing");
  assert.equal(next().disabled, false, "a nameless row blocked Continue: it should only warn");

  const ch = stored(app, { locked: false });
  const w = ch.archetypeChoices.writeIn;
  assert.equal(JSON.stringify([w.name, w.classification, w.classificationText, w.mechanics, w.traits.map(t => t.name)]),
    JSON.stringify(["Changeling", "other", "Fae", ["sfr"], ["Glamour"]]));
  assert.equal(JSON.stringify(ch.powers.map(p => [p.name, p.uses])), JSON.stringify([["Fade", "SFR"]]));
  assert.ok(ch.progression.ip.log.length === 0, "a creation power touched IP");

  // Remove takes the row; choosing another archetype clears it all (XQ3).
  app.click('[data-wirm="vulnerabilities|0"]');
  assert.equal(stored(app, { locked: false }).archetypeChoices.writeIn.vulnerabilities.length, 0);
  app.click('[data-arch="werewolf"]');
  app.click(`[data-arch="${custom.id}"]`);
  const after = stored(app, { locked: false });
  assert.equal(JSON.stringify([after.archetypeChoices.writeIn.name, after.powers.length]), JSON.stringify(["", 0]));
  assert.deepEqual(app.errors, []);
});

test("picking Supernatural for a Custom archetype drops a Mortal-only Advantage it held", () => {
  const custom = D.archetypes.find(a => a.writeIn);
  const app = onArchetypeStep(custom.id);
  app.click('[data-wicls="mortal"]');
  // A Mortal bought an Advantage a Supernatural can't, then went back.
  const held = D.advantages.find(a => !a.universal);
  const ch = stored(app, { locked: false });
  assert.equal(ch.archetypeChoices.writeIn.classification, "mortal");
  app.window.eval(`S.ch.advantages.push({ id: ${JSON.stringify(held.id)}, rank: 1, notes: "" })`);
  app.click('[data-wicls="supernatural"]');
  assert.equal(stored(app, { locked: false }).advantages.some(x => x.id === held.id), false);
  assert.deepEqual(app.errors, []);
});

// ── P4: the wizard's quick wins (W94, W96, W64, W59) ─────────────────────
const statsDraft = (set = {}) => onStep("professional", "street", "stats", ch => {
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = D.statRules.base;
  for (const [k, v] of Object.entries(set)) ch.stats[k].base = v;
});
const poolText = app => app.$("#main .roll-entry .pool").textContent.replace(/\s+/g, " ").trim();
const baseOf = app => Object.fromEntries(D.stats.map(s => [s.id, stored(app, { locked: false }).stats[s.id].base]));
const sName = id => D.stats.find(s => s.id === id).name;
// S after a render carries bookkeeping (vitalsOpen); every field homeState() sets must match.
const homeIs = app => app.window.eval("(() => { const h = homeState(); return Object.keys(h).every(k => S[k] === h[k]); })()");

test("P4 (W94): Set all to 4 raises every stat below 4 in one press, spends as the steppers would, and is then disabled", async () => {
  const floor = Engine.statFloor();
  const app = statsDraft();
  const btn = () => app.$("[data-stat-floor]");
  assert.equal(btn().textContent, `Set all to ${floor}`);
  assert.match(poolText(app), /Pool 45 · Remaining 45/);
  btn().focus();
  app.click("[data-stat-floor]");
  assert.notEqual(app.doc.activeElement, app.doc.body, "focus fell to <body> when the button disabled itself");
  assert.deepEqual([...Object.values(baseOf(app))], [...D.stats.map(() => floor)]);
  assert.match(poolText(app), /Remaining 21/);
  assert.equal(btn().disabled, true, "the button is live with nothing to do");
  assert.equal(app.$("#main .roll-entry + .step-note"), null);
  await new Promise(r => app.window.setTimeout(r, 60));
  assert.equal(app.$("#announcer").textContent, `Every stat is at ${floor}. 21 Stat Points left.`);
  assert.deepEqual(app.errors, []);
});

test("P4 (W94): when the pool runs out it says which stats it couldn't reach, once", () => {
  const app = statsDraft({ BOD: 10, REF: 10, MOB: 10 });
  assert.match(poolText(app), /Remaining 6/);
  app.click("[data-stat-floor]");
  const b = baseOf(app);
  assert.equal(b.INT, 4); assert.equal(b.TECH, 4);
  assert.deepEqual(["COOL", "MAG", "EMP"].map(id => b[id]), [1, 1, 1]);
  const note = app.$("#main .roll-entry + .step-note");
  assert.ok(note, "no note about the stats left short");
  assert.ok(note.textContent.includes(`${sName("COOL")}, ${sName("MAG")} and ${sName("EMP")}`), note.textContent);
  assert.ok(!note.textContent.includes(sName("INT")), "it names a stat it did raise");
  app.click('[data-step="stat|BOD|-1"]');                       // any render after
  assert.equal(app.$("#main .roll-entry + .step-note"), null, "the note outlived its render");
  assert.deepEqual(app.errors, []);
});

test("P4 (W64): Home in the wizard header goes back to the roster, keeps a touched character, drops an untouched one", () => {
  let app = newCharacterApp();
  assert.ok(app.$("header [data-home]"), "no Home button in the wizard's header");
  app.click("header [data-home]");
  assert.match(app.$("#main").textContent, /New character/);
  assert.ok(homeIs(app), "S isn't homeState()");
  assert.equal(app.$$("#main .roster-card").length, 0, "an untouched New character was saved");
  assert.equal(app.$("header [data-home]"), null, "Home has a Home button");
  app = newCharacterApp();
  app.click("[data-pl]");
  app.click("button.primary[data-nav]");
  type(app, '[data-id="name"]', "Zed Home");
  app.click("header [data-home]");
  assert.ok(homeIs(app));
  assert.ok(card(app, "Zed Home"), "the named character isn't on the roster");
  assert.deepEqual(app.errors, []);
});

test("P4 (W64): the sheet's menu Home and the table's Home both land on homeState(); the sheet's menu keeps its Home", () => {
  const app = openSheet(lockedCharacter(), "main");
  assert.ok(app.$("#hdrmenu [data-home]"), "the sheet's menu lost Home");
  assert.equal(app.$("#hdractions > [data-home]"), null, "the sheet grew a header Home button");
  sheetHome(app);
  assert.ok(homeIs(app));
  const [, storage] = seedTable("Tuesday");
  const gm = boot({ storage: { ...GM_ON, ...storage } });
  gm.click("#main .tables .roster-card button");
  tableHome(gm);
  assert.ok(homeIs(gm));
  assert.deepEqual([...app.errors, ...gm.errors], []);
});

test("P4 (W96): a Vampire's CP step lists the 15 Universal Advantages it can buy, plus a held one it can only give back", () => {
  const universal = D.advantages.filter(a => a.universal === true);
  assert.equal(universal.length, 15);
  const advBlock = app => app.$$("#main details[data-filterable]").find(d => /open to Supernaturals/.test(d.querySelector("summary").textContent));
  const picks = app => [...advBlock(app).querySelectorAll(".pick")];
  let app = onStep("vampire", "street", "character-points");
  assert.equal(picks(app).length, 15);
  assert.equal(advBlock(app).querySelector("summary").textContent.trim(), "15 open to Supernaturals");
  assert.deepEqual([...picks(app).map(p => p.querySelector("h2").textContent).sort()], [...universal.map(a => a.name).sort()]);
  // The search box counts within what is drawn.
  type(app, "[data-jumpfilter]", "sense");
  const hit = picks(app).filter(p => !p.hidden).length;
  assert.ok(hit > 0 && hit < 15, `${hit} hits`);
  const [shown, total] = app.$("[data-jumpcount]").textContent.split(" of ").map(Number);
  assert.equal(shown, app.$$("#main [data-filterable] .pick").filter(p => !p.hidden).length);
  assert.equal(total, app.$$("#main [data-filterable] .pick").length);
  assert.ok(total < D.advantages.length, "the count still includes the Advantages it can't buy");
  // A held, non-Universal Advantage.
  const held = D.advantages.find(a => !a.universal);
  app = onStep("vampire", "street", "character-points", ch => { ch.advantages = [{ id: held.id, rank: 1, notes: "" }]; });
  assert.equal(picks(app).length, 16);
  assert.equal(advBlock(app).querySelector("summary").textContent.trim(), "15 open to Supernaturals · 1 held that aren't");
  const row = picks(app).find(p => p.querySelector("h2").textContent === held.name);
  assert.equal(row.querySelector('[data-step$="|1"]').disabled, true, "a held, barred Advantage can go up");
  app.click(`[data-step="adv|${held.id}|-1"]`);
  assert.equal(picks(app).length, 15, "taking it back left it on the list");
  // A Mortal still sees all of them.
  app = onStep("professional", "street", "character-points");
  const mortal = app.$$("#main details[data-filterable]").find(d => d.querySelector("summary").textContent.trim() === `${D.advantages.length} available`);
  assert.ok(mortal, "a Mortal's summary changed");
  assert.equal(mortal.querySelectorAll(".pick").length, D.advantages.length);
  assert.deepEqual(app.errors, []);
});

test("P4 (W59): every stepper in the wizard says what it changes", () => {
  const steps = D.creationFlow.steps.map(s => s.id);
  let seen = 0;
  for (const [arch, pl] of [["vampire", "street"], ["professional", "street"], ["arcanist", "street"], ["werewolf", "street"]]) {
    for (const id of steps) {
      const app = onStep(arch, pl, id, ch => { if (arch === "vampire") ch.archetypeChoices.specialization = ["strigoi"]; });
      for (const b of app.$$("#main [data-step]")) {
        seen++;
        const l = b.getAttribute("aria-label");
        assert.match(l || "", /^(Raise|Lower) \S/, `${arch}/${id}: ${b.dataset.step} reads "${l}"`);
        assert.ok(b.closest(".stepper").dataset.name && !/undefined|null/.test(l), `${b.dataset.step} has no name`);
      }
    }
  }
  assert.ok(seen > 100, `only ${seen} stepper buttons looked at`);
  const adm = openSheet(lockedVampire("upyr"), "main");
  adm.click("[data-menu-toggle]"); adm.click("[data-admin]");
  const bp = adm.$$('.admin-arch [data-step^="bp|"]');
  assert.ok(bp.length, "Admin's Base Powers block has no steppers");
  for (const b of bp) assert.match(b.getAttribute("aria-label"), /^(Raise|Lower) Base Powers in \S/);
});

test("P4 (W59): a press is announced once, politely, from outside #main, in the wizard and in Admin", async () => {
  const later = app => new Promise(r => app.window.setTimeout(r, 60));
  const app = statsDraft();
  app.click('[data-step="stat|BOD|1"]');
  await later(app);
  const a = app.$("#announcer");
  assert.ok(a, "no announcer");
  assert.equal(app.$$("#announcer").length, 1);
  assert.equal(a.getAttribute("role"), "status");
  assert.equal(a.getAttribute("aria-live"), "polite");
  assert.ok(!app.$("#main").contains(a), "the announcer is inside #main, which every render replaces");
  assert.equal(a.textContent, `${sName("BOD")} 2`);
  app.click('[data-step="stat|BOD|1"]');
  await later(app);
  assert.equal(app.$("#announcer"), a, "the announcer was replaced");
  assert.equal(a.textContent, `${sName("BOD")} 3`);

  const ch = lockedVampire("upyr"); ch.archetypeChoices.basePowers = {}; ch.archetypeChoices.optionPicks = {};
  const adm = openSheet(ch, "main");
  adm.click("[data-menu-toggle]"); adm.click("[data-admin]");
  adm.click('.admin-arch [data-step="bp|iron-hide|1"]');
  await later(adm);
  assert.match(adm.$("#announcer").textContent, /^Base Powers in .+ 1$/);
  assert.deepEqual([...app.errors, ...adm.errors], []);
});

// ── P7: LUCK and the Max Character Point Boost (Decision 218) ───────────
test("P7: a Street character's LUCK + goes off after 2 with its reason, and the CP step names the cap", () => {
  const app = arcanistOnCP();
  const luckRow = () => app.$$("#main .pick").find(p => /Buy up LUCK/.test(p.textContent));
  const plus = () => luckRow().querySelector('[data-step="luck|x|1"]');
  const cap = D.powerLevels.find(p => p.id === "street").maxBoost;
  for (let i = 0; i < cap; i++) { assert.ok(!plus().disabled, `+ is off after ${i}`); app.click('#main [data-step="luck|x|1"]'); }
  assert.ok(plus().disabled, "+ stays on past the cap");
  assert.match(luckRow().querySelector(".mod").title, /Max Character Point Boost reached: 2 each at Street Level\./);
  assert.match(luckRow().textContent, /up to 2 \(Max Character Point Boost\)/);
  assert.ok(!luckRow().querySelector('[data-step="luck|x|-1"]').disabled, "− must always work");
  assert.equal(app.$$("#main .jumpbar [data-jump]").some(b => b.textContent === "CP Boosts"), true);
  assert.match(app.$("#main").textContent, /Character Point Boosts — leftover CP on Stats & Skills · Max CP Boost \+2, LUCK included/);
  assert.doesNotMatch(app.$("#main").textContent, /Max Boost|exempt/, "the old name or the exemption still shows");
  assert.deepEqual(app.errors, []);
});

test("P7: the Campaign Power Level chip reads Max CP Boost", () => {
  const app = onStep("arcanist", "street", "power-level");
  assert.match(app.$("#main").textContent, /Max CP Boost\s*2/);
  assert.doesNotMatch(app.$("#main").textContent, /Max Boost/);
});

// ── P7 §8's lock-level rows (Decision 218) ──────────────────────────────
// Lowering the Campaign Power Level on step 1 is the only real way over the
// cap, so each row goes through it.
const cpStepIndex = D.creationFlow.steps.map(s => s.id).indexOf("character-points");
const goToCpStep = app => app.window.eval(`S.step = ${cpStepIndex}; update();`);
const issuesText = app => app.$("#wiz-issues").textContent;

test("P7 row 3: Heroic with 3 LUCK bought, lowered to Street, can't lock until a − clears it; nothing is trimmed", () => {
  const app = onStep("arcanist", "heroic", "power-level", ch => { ch.trackers.luck.bonus = 3; });
  app.click('[data-pl="street"]');
  goToCpStep(app);
  assert.equal(app.window.eval("S.ch.trackers.luck.bonus"), 3, "the level change trimmed LUCK");
  assert.match(issuesText(app), /LUCK is bought up 3\. Max Character Point Boost at Street Level is 2\./);
  assert.equal(app.$('[data-nav="1"]').disabled, true, "Continue is open over the cap");
  assert.ok(app.window.eval(`Engine.validate("review", S.ch)`).some(i => i.level === "error" && /LUCK is bought up 3/.test(i.msg)) ||
            app.window.eval(`Engine.validate("character-points", S.ch)`).some(i => i.level === "error" && /LUCK is bought up 3/.test(i.msg)),
            "no validate step carries the error");
  app.click('#main [data-step="luck|x|-1"]');
  assert.equal(app.window.eval("S.ch.trackers.luck.bonus"), 2);
  assert.doesNotMatch(issuesText(app), /Max Character Point Boost/, "one − didn't clear it");
  assert.deepEqual(app.errors, []);
});

test("P7 row 4: BOD boosted 4 at Shadows, lowered to Street, is named on the CP step", () => {
  const app = onStep("arcanist", "shadows", "power-level", ch => { ch.creation.boosts = [{ targetType: "stat", targetId: "BOD", times: 4 }]; });
  app.click('[data-pl="street"]');
  goToCpStep(app);
  const bod = D.stats.find(s => s.id === "BOD").name;
  assert.match(issuesText(app), new RegExp(`${bod} is boosted 4 times\. Max Character Point Boost at Street Level is 2\.`));
  assert.equal(app.$('[data-nav="1"]').disabled, true);
});

test("P7 row 7: Admin's LUCK bonus goes past the cap on a locked character, with nothing said", () => {
  const sheet = openSheet(lockedCharacter(), "main");
  sheet.click("[data-menu-toggle]"); sheet.click("[data-admin]");
  const cap = D.powerLevels[0].maxBoost;
  for (let i = 0; i < cap + 1; i++) sheet.click('[data-admin-luck="1"]');
  assert.equal(sheet.window.eval("S.ch.trackers.luck.bonus"), cap + 1, "Admin was capped");
  assert.doesNotMatch(sheet.$("#main").textContent, /reached|bought up/, "Admin said something about the cap");
  assert.deepEqual(sheet.errors, []);
});

test("P7 row 8: the dice Boost keeps its name", () => {
  assert.match(D.resources.luck.spend.find(s => s.id === "boost").action, /Boost/);
  for (const id of ["lucky", "unlucky"]) {
    const a = [...D.advantages, ...D.disadvantages].find(x => x.id === id);
    assert.ok(a && /Boost/.test(a.description), `${id}'s Boost wording changed`);
  }
});

// ── P9a: Magical being (Deighton's ruling, 2026-10-10 Q31) ───────────────
test("P9a 8: the write-in offers four classifications, and Magical being opens the Universal ones first", () => {
  const custom = D.archetypes.find(a => a.writeIn);
  const app = onArchetypeStep(custom.id);
  const cards = () => app.$$("#main [data-wicls]");
  assert.equal(cards().length, 4, "the write-in doesn't offer four classifications");
  assert.deepEqual(cards().map(c => c.dataset.wicls), ["mortal", "supernatural", "magical-being", "other"]);
  assert.doesNotMatch(app.$('[data-wicls="other"]').textContent, /Neither one/, "Other still counts two");
  app.click('[data-wicls="magical-being"]');
  const words = app.$('[data-wi="classificationText"]');
  assert.ok(words, "Magical being has no 'in your words' field");
  assert.equal(words.getAttribute("placeholder"), "In a word or two");
  assert.match(words.closest("label").textContent, /Magical being: in your words/);
  const mb = onStep(custom.id, D.powerLevels[0].id, "character-points", ch => Object.assign(ch.archetypeChoices.writeIn, { name: "Fae", classification: "magical-being", classificationText: "Fae" }));
  const adv = [...mb.$$("#main details.group summary")].map(s => s.textContent).find(t => /open to/.test(t));
  assert.match(adv || "", /^15 open to Magical beings/, "the Advantage list doesn't open the Universal ones first");
  assert.deepEqual(app.errors, []);
});

// ── P18: the effects show as tags on the CP step (Decision 231) ──────
test("P18 6: the CP step shows a computed chip and a rule line under each entry's name, and a held one speaks for its rank", () => {
  const pickOf = (app, name) => app.$$("#main .pick").find(p => p.querySelector("h2") && p.querySelector("h2").textContent === name);
  const rule = (kind, id) => D[kind === "advantage" ? "advantages" : "disadvantages"].find(d => d.id === id).grants.find(g => g.type === "rule");
  let app = onStep("professional", "street", "character-points");
  const bl = pickOf(app, "Blood Lust");
  assert.ok(bl, "Blood Lust isn't on the CP step");
  assert.equal(bl.querySelector(".effects .etag.rule").textContent, rule("disadvantage", "blood-lust").ruleText);
  // The tags sit after the head and before the prose.
  const kids = [...bl.children].map(c => c.className.split(" ")[0]);
  assert.ok(kids.indexOf("effects") > kids.indexOf("head") && kids.indexOf("effects") < kids.indexOf("desc"), kids.join(","));
  const htk = pickOf(app, "Hard to Kill");
  assert.equal(htk.querySelector(".effects .etag.computed").textContent, "+1 max HP on every Health Level per rank");
  assert.ok(!htk.querySelector(".effects .etag.rule"), "Hard to Kill has no rule line");
  // Held at rank 2, Bullseye says +6; not held, it says its general line.
  assert.equal(pickOf(app, "Bullseye").querySelector(".effects .etag.rule").textContent, rule("advantage", "bullseye").ruleText);
  app = onStep("professional", "street", "character-points", ch => { ch.advantages = [{ id: "bullseye", rank: 2, notes: "" }]; });
  assert.equal(pickOf(app, "Bullseye").querySelector(".effects .etag.rule").textContent, "Called Shots: +6 damage.");
  // Creation only is a tag, read off the data.
  app = onStep("professional", "street", "character-points");
  assert.ok([...pickOf(app, "Long-Lived").querySelectorAll(".effects .etag")].some(t => t.textContent === "Creation only"));
  // The tag replaced the head's old "creation only" chip: the card says it once.
  assert.equal((pickOf(app, "Long-Lived").textContent.match(/creation only/gi) || []).length, 1, "Long-Lived says creation only twice");
  assert.deepEqual(app.errors, []);
});

test("P18 6b: a held tag reads the picks the picker reads: a natural row's answer isn't borrowed by a bought row with none", () => {
  const general = D.advantages.find(a => a.id === "favored-skill").grants.find(g => g.type === "rule").ruleText;
  const app = onStep("professional", "street", "character-points", ch => {
    ch.advantages = [{ id: "favored-skill", rank: 1, source: "natural", selections: { skill: ["stealth"] } }, { id: "favored-skill", rank: 1, notes: "" }];
  });
  const p = app.$$("#main .pick").find(x => x.querySelector("h2") && x.querySelector("h2").textContent === "Favored Skill");
  assert.equal(p.querySelector(".effects .etag.rule").textContent, general);
});

// ── P13: Expert mode (Decision 232) ─────────────────────────────────────
// Folded text is still in the page (so the filter finds it); it is `hidden`
// until a ? opens it. Each test says what must stay shown as well as what folds.
const EXPERT = { "shadows.ui.expert": "on" };
const cpExpert = (mut, store = EXPERT) => onStep("professional", "street", "character-points", mut, store);
const pickOf13 = (app, name) => app.$$("#main .pick").find(p => p.querySelector("h2") && p.querySelector("h2").textContent === name);
const hiddenIn = el => !!el.closest("[hidden]");
const shownNames = app => app.$$("#main [data-filterable] .pick").filter(p => !p.hidden).map(p => p.querySelector("h2").textContent);
const typeFilter = (app, v) => { const f = app.$("#main [data-jumpfilter]"); f.value = v; f.dispatchEvent(new app.window.Event("input")); };
const holdThree = ch => {
  ch.advantages = [{ id: "bullseye", rank: 1, notes: "" }, { id: "common-sense", rank: 1, notes: "", selections: { skill: ["investigation"] } }];
  ch.disadvantages = [{ id: "blood-lust", rank: 1, notes: "" }];
};

test("P13 1: Expert mode folds the CP step's book text and keeps every control", () => {
  const app = cpExpert(ch => {
    holdThree(ch);
    ch.advantages.push({ id: "educated", rank: 1, notes: "" });                      // a flagged one, held
    Engine.addCustomPower(ch, { name: "Sidestep", effect: "Moves where the dice won't look.", free: true }, { creation: true });
  });
  assert.deepEqual(app.errors, []);
  const filterable = app.$$("#main [data-filterable] .pick");
  assert.equal(filterable.length, 87);
  for (const p of filterable) {
    const name = p.querySelector("h2").textContent;
    assert.ok(p.querySelector(".desc").hidden, `${name}: the book text is shown`);
    assert.ok(p.querySelector(".cost") && p.querySelector(".stepper"), `${name} lost a cost or stepper`);
    assert.ok(p.querySelector(".head [data-fold]"), `${name} has no ?`);
  }
  // LUCK's line stays folded too; a held entry's tags and picks stay shown.
  assert.ok(app.$$("#main .pick").find(p => /Buy up LUCK/.test(p.textContent)).querySelector(".desc").hidden, "LUCK's line is shown");
  const cs = pickOf13(app, "Common Sense");
  assert.ok(cs.querySelector("select[data-sel]") && !hiddenIn(cs.querySelector("select[data-sel]")), "a held pick's select folded");
  assert.ok(cs.querySelector(".effects .etag") && !hiddenIn(cs.querySelector(".effects")), "the tags folded");
  const ed = pickOf13(app, "Educated");
  assert.ok(ed.querySelector(".flag") && !hiddenIn(ed.querySelector(".flag")), "a flag note folded");
  const custom = pickOf13(app, "Sidestep");
  assert.ok(custom && !hiddenIn(custom.querySelector(".desc")) && /won't look/.test(custom.querySelector(".desc").textContent), "a custom power's own text folded");
  // ? opens one entry; a stepper's re-render keeps it open; the others stay folded.
  const q = () => app.$('[data-fold="advantage|ambidextrous"]');
  assert.equal(q().getAttribute("aria-expanded"), "false");
  app.click('[data-fold="advantage|ambidextrous"]');
  assert.equal(q().getAttribute("aria-expanded"), "true");
  assert.ok(!pickOf13(app, "Ambidextrous").querySelector(".desc").hidden, "? didn't open the text");
  assert.ok(pickOf13(app, "Animal Ken").querySelector(".desc").hidden, "? opened another entry");
  app.click('[data-step="luck|x|1"]');
  assert.equal(q().getAttribute("aria-expanded"), "true", "a re-render closed it");
  assert.ok(!pickOf13(app, "Ambidextrous").querySelector(".desc").hidden, "a re-render re-folded the text");
  app.click('[data-fold="advantage|ambidextrous"]');
  assert.ok(pickOf13(app, "Ambidextrous").querySelector(".desc").hidden, "? didn't close it again");
  assert.deepEqual(app.errors, []);
});

test("P13 1b: with Expert mode off the CP step shows every text and has no ?", () => {
  const app = cpExpert(() => {}, {});
  assert.equal(app.$$("#main [data-fold]").length, 0);
  assert.equal(app.$$("#main [data-foldbody]").length, 0);
  assert.ok(app.$$("#main [data-filterable] .pick .desc").every(d => !d.hidden));
});

test("P13 2: Expert mode folds the Skills step's descriptions and keeps the picks", () => {
  const app = onStep("professional", "street", "skills", ch => { ch.skills["martial-arts"] = { rank: 2, ipe: 0 }; ch.skills.handguns = { rank: 1, ipe: 0 }; }, EXPERT);
  assert.deepEqual(app.errors, []);
  const rows = app.$$("#main .alloc-row");
  assert.equal(rows.length, D.skills.length);
  const shown = () => app.$$("#main .alloc-row .name small").filter(s => !s.classList.contains("next-cost") && !s.hidden);
  assert.deepEqual(shown().map(s => s.textContent), [], "a description is shown");
  for (const r of rows) assert.ok(r.querySelector(".stepper .val") && r.querySelector(".mod") && r.querySelector("[data-fold]"), r.textContent);
  assert.ok(app.$$('#main select[data-sel^="skill|martial-arts"]').length, "Martial Arts' style picks are gone");
  assert.ok(rows.find(r => r.querySelector(".name").textContent.startsWith("Handguns")).querySelector(".skstats"), "the stat line is gone");
  app.click('[data-fold="skill|handguns"]');
  assert.equal(shown().length, 1);
  app.click('[data-step="skill|handguns|1"]');
  assert.equal(shown().length, 1, "a rank press closed it");
});

test("P13 3: Expert mode is the browser's, never the character's", () => {
  const app = onStep("professional", "street", "skills", () => {});
  const ch0 = JSON.stringify(app.window.eval("S.ch"));
  const toggle = () => app.$("#hdractions [data-expert]");
  assert.equal(toggle().getAttribute("aria-pressed"), "false");
  app.click("#hdractions [data-expert]");
  assert.equal(app.window.localStorage.getItem("shadows.ui.expert"), "on");
  assert.equal(toggle().getAttribute("aria-pressed"), "true");
  assert.equal(JSON.stringify(app.window.eval("S.ch")), ch0, "the character changed");
  assert.ok(!JSON.stringify(draft(app)).includes("expert"), "it was saved in the character");
  assert.ok(!app.$$("#main .alloc-row .name small").some(s => !s.classList.contains("next-cost") && !s.hidden));
  app.click("#hdractions [data-expert]");
  assert.equal(app.window.localStorage.getItem("shadows.ui.expert"), null);
  assert.ok(app.$$("#main .alloc-row .name small").filter(s => !s.classList.contains("next-cost")).every(s => !s.hidden));
  assert.equal(JSON.stringify(app.window.eval("S.ch")), ch0);
  // A boot with the key set starts folded; storage that throws starts unfolded, with no error.
  assert.equal(onStep("professional", "street", "skills", () => {}, EXPERT).$$("#main [data-foldbody]:not([hidden])").length, 0);
  const bad = onStep("professional", "street", "skills", () => {});
  bad.window.eval(`(()=>{ const g=Storage.prototype.getItem, s=Storage.prototype.setItem;
    Storage.prototype.getItem=function(k){ if(k==="shadows.ui.expert") throw new Error("denied"); return g.call(this,k); };
    Storage.prototype.setItem=function(k,v){ if(k==="shadows.ui.expert") throw new Error("denied"); return s.call(this,k,v); }; })()`);
  bad.window.eval("update()");
  assert.equal(bad.$$("#main [data-foldbody]").length, 0);
  bad.click("#hdractions [data-expert]");
  assert.deepEqual(bad.errors, []);
});

test("P13 4: the CP Boosts heading names Max CP Boost, and every stepper keeps its count", async () => {
  for (const pl of D.powerLevels.slice(0, 2)) {
    for (const store of [{}, EXPERT]) {
      const app = onStep("professional", pl.id, "character-points", () => {}, store);
      const h = app.$$("#main .sect").find(s => /Character Point Boosts/.test(s.textContent));
      assert.ok(h, "no Boosts heading");
      assert.match(h.textContent, new RegExp(`Max CP Boost \\+${pl.maxBoost}\\b`), `${pl.id}: ${h.textContent}`);
      assert.doesNotMatch(h.textContent, /up to \d+ each/);
      for (const s of app.$$("#main .stepper")) {
        const kids = [...s.children].map(c => c.tagName + (c.className ? "." + c.className : ""));
        assert.deepEqual(kids, ["BUTTON", "SPAN.val", "BUTTON"]);
      }
    }
  }
  const app = onStep("professional", "street", "character-points", () => {}, EXPERT);
  app.click('[data-step="boost|stat|BOD|1"]');
  await new Promise(r => app.window.setTimeout(r, 60));
  assert.match(app.$("#announcer").textContent, /^boosts to Body 1$/);
});

test("P13 5: the CP filter finds an entry by its name, in both modes", () => {
  for (const store of [{}, EXPERT]) {
    const app = cpExpert(() => {}, store);
    typeFilter(app, "Ambidextrous");
    assert.deepEqual(shownNames(app), ["Ambidextrous"], "the name didn't find its entry");
    assert.equal(app.$("#main [data-jumpcount]").textContent, "1 of 87");
    typeFilter(app, "Animal Ken");
    assert.deepEqual(shownNames(app), ["Animal Ken"]);
    typeFilter(app, "called shot");                          // only in a description
    assert.ok(shownNames(app).includes("Bullseye"), "folded text can't be found");
    typeFilter(app, "");
    assert.equal(shownNames(app).length, 87);
  }
  // Held entries stay, as before.
  const app = cpExpert(holdThree);
  typeFilter(app, "Ambidextrous");
  assert.deepEqual(shownNames(app).sort(), ["Ambidextrous", "Blood Lust", "Bullseye", "Common Sense"]);
});

test("P13 6: the header's Expert mode toggle shows on every creation step (P19 9) and keeps the keyboard's place", () => {
  const steps = [...D.creationFlow.steps.map(s => s.id), "review"];
  for (const id of steps) {
    const app = onStep("professional", "street", id, () => {});
    assert.ok(app.$("#hdractions [data-expert]"), `${id}: toggle absent`);
    assert.ok(app.$("#hdractions [data-home]"), `${id}: Home was pushed out`);
  }
  const app = onStep("professional", "street", "skills", () => {});
  for (const want of ["true", "false", "true"]) {
    app.$("#hdractions [data-expert]").focus();
    app.click("#hdractions [data-expert]");
    assert.equal(app.$("#hdractions [data-expert]").getAttribute("aria-pressed"), want);
    assert.equal(app.window.document.activeElement, app.$("#hdractions [data-expert]"), "focus left the toggle");
  }
  assert.ok(!openSheet(lockedCharacter(), "main").$("[data-expert]"), "the sheet has the toggle");
});

test("P13 7: Expert mode folds the Archetype step's prose and keeps what each choice gives", () => {
  for (const [arch, spec] of [["professional", ["mercenary"]], ["arcanist", ["arcane-fortitude"]]]) {
    const app = onStep(arch, "street", "archetype", ch => { ch.archetypeChoices.specialization = spec; }, EXPERT);
    assert.deepEqual(app.errors, [], arch);
    const prose = app.$$("#main [data-foldbody]");
    assert.ok(prose.length >= 5, `${arch}: only ${prose.length} folded texts`);
    assert.ok(prose.every(p => p.hidden), `${arch}: prose is shown`);
    // The archetype cards' summaries fold, each with a ? outside the card button.
    assert.ok(app.$$("#main [data-arch]").every(b => !b.querySelector("[data-fold]")), "a ? inside a button");
    assert.ok(app.$$("#main [data-arch]").every(b => hiddenIn(b.querySelector("p"))), "a card summary is shown");
    const lore = app.$("#main .arch-lore"); assert.ok(lore && hiddenIn(lore), "the lore is shown");
    const style = app.Engine.archetype(app.window.eval("S.ch")).gameplayStyle;
    if (style) assert.ok(app.$$("#main .step-note").filter(p => p.textContent.includes(style.slice(0, 40))).every(hiddenIn), "the gameplay style is shown");
    // What a choice gives stays.
    const mech = app.$$("#main .desc[data-mech]");
    assert.ok(mech.length >= 1 && mech.every(m => !hiddenIn(m)), `${arch}: a labelled line folded`);
    assert.ok(mech.every(m => m.firstElementChild && m.firstElementChild.tagName === "B"), "a prose line is marked as mechanics");
    const labelled = app.$$("#main .pick .desc").filter(d => d.firstElementChild && d.firstElementChild.tagName === "B");
    assert.ok(labelled.length && labelled.every(d => d.matches("[data-mech]")), "a labelled line isn't marked");
    assert.ok(app.$$("#main [data-spec]").length >= 6, "choice controls are gone");
    const need = app.Engine.specializationNeed(app.window.eval("S.ch"));
    if (need > 1) assert.match(app.$("#main").textContent, new RegExp(`\\d/${need} chosen`), "the count of choices folded");
    // ? opens an option's text, in place.
    const opt = app.$$('#main [data-fold^="spec|"]')[0];
    assert.ok(opt, `${arch}: an option has no ?`);
    app.click(`[data-fold="${opt.dataset.fold}"]`);
    assert.ok(app.$$(`#main [data-foldbody="${opt.dataset.fold}"]`).every(e => !e.hidden));
    assert.equal(opt.getAttribute("aria-expanded"), "true");
  }
  // Off: nothing folded, nothing marked.
  const off = onStep("professional", "street", "archetype", ch => { ch.archetypeChoices.specialization = ["mercenary"]; });
  assert.equal(off.$$("#main [data-fold], #main [data-foldbody], #main [data-mech]").length, 0);
});

test("P13 8: Held only shows the build, and works with the filter", () => {
  // Educated is held as natural ranks only (a Professional's free ones): it's held, though it has no bought row.
  const app = cpExpert(ch => { holdThree(ch); ch.advantages.push({ id: "educated", rank: 2, notes: "", source: "natural" }); }, {});
  const held = ["Blood Lust", "Bullseye", "Common Sense", "Educated"];
  assert.ok(app.$("#main [data-heldonly]"), "no Held only toggle");
  assert.equal(app.$("#main [data-heldonly]").getAttribute("aria-pressed"), "false");
  app.click("#main [data-heldonly]");
  assert.deepEqual(shownNames(app).sort(), held);
  assert.equal(app.$("#main [data-jumpcount]").textContent, "4 held");
  assert.equal(app.$("#main [data-heldonly]").getAttribute("aria-pressed"), "true");
  typeFilter(app, "ambidextrous");                         // held stay; a match that isn't held doesn't join
  assert.deepEqual(shownNames(app).sort(), held, "a filter match that isn't held showed under Held only");
  app.click('[data-step="luck|x|1"]');                     // a re-render keeps both
  assert.deepEqual(shownNames(app).sort(), held);
  assert.equal(app.$("#main [data-heldonly]").getAttribute("aria-pressed"), "true");
  assert.equal(app.$("#main [data-jumpfilter]").value, "ambidextrous");
  app.click("#main [data-heldonly]");                      // off: the filter is still on
  assert.deepEqual(shownNames(app).sort(), ["Ambidextrous", ...held].sort());
  typeFilter(app, "");
  assert.equal(shownNames(app).length, 87);
  // It stops being shown once it's no longer held.
  app.click("#main [data-heldonly]");
  app.click('[data-step="adv|bullseye|-1"]');
  assert.deepEqual(shownNames(app).sort(), ["Blood Lust", "Common Sense", "Educated"]);
  assert.equal(app.$("#main [data-jumpcount]").textContent, "3 held");
  assert.deepEqual(app.errors, []);
});

test("P13 9: the Skills step's bar keeps Remaining in view and finds a skill by name", () => {
  const app = onStep("professional", "street", "skills", ch => { ch.skills.dodge = { rank: 1, ipe: 0 }; });
  const bar = app.$("#main .jumpbar.sticky");
  assert.ok(bar, "no sticky bar on Skills");
  const before = Number(/Remaining (\d+)/.exec(bar.textContent)[1]);
  app.click('[data-step="skill|handguns|1"]');
  assert.equal(Number(/Remaining (\d+)/.exec(app.$("#main .jumpbar.sticky").textContent)[1]), before - 1, "Remaining didn't follow a rank press");
  assert.deepEqual(app.$$("#main .jumpbar [data-jump]").map(b => b.textContent), ["Combat", "Utility", "General"]);
  const names = () => app.$$("#main .alloc-row").filter(r => !r.hidden).map(r => r.querySelector(".name").firstChild.textContent.trim());
  const f = app.$("#main [data-jumpfilter]"); f.value = "Handguns"; f.dispatchEvent(new app.window.Event("input"));
  assert.deepEqual(names(), ["Handguns"]);
  app.click('[data-step="skill|handguns|1"]');
  assert.equal(app.$("#main [data-jumpfilter]").value, "Handguns", "a rank press dropped the filter");
  assert.deepEqual(names(), ["Handguns"]);
  const g = app.$("#main [data-jumpfilter]"); g.value = ""; g.dispatchEvent(new app.window.Event("input"));
  assert.equal(names().length, D.skills.length);
  // The bar is spliced into the page, so a "$" pattern typed in the filter must stay text across a re-render.
  for (const q of ["$'", "$&", "$`"]) {
    const h = app.$("#main [data-jumpfilter]"); h.value = q; h.dispatchEvent(new app.window.Event("input"));
    app.click('[data-step="skill|handguns|1"]');
    assert.equal(app.$$("#main .alloc-row").length, D.skills.length, `the filter "${q}" duplicated the skills`);
    assert.equal(app.$("#main [data-jumpfilter]").value, q);
  }
  assert.deepEqual(app.errors, []);
});

test("P13 10: the Natural Advantages panel shows the tags, held or general, and keeps them when its text folds", () => {
  const general = D.advantages.find(a => a.id === "favored-skill").grants.find(g => g.type === "rule").ruleText;
  const panel = app => app.$$("#main .pick").find(p => p.querySelector("h2") && p.querySelector("h2").textContent === "Favored Skill");
  const setup = ch => { ch.archetypeChoices.specialization = ["mercenary"]; };
  let app = onStep("professional", "street", "archetype", setup);
  assert.ok(panel(app), "the Natural Advantages panel has no Favored Skill");
  assert.equal(panel(app).querySelector(".effects .etag.rule").textContent, general);
  const kids = [...panel(app).children].map(c => c.className.split(" ")[0]);
  assert.ok(kids.indexOf("effects") > kids.indexOf("head") && kids.indexOf("effects") < kids.indexOf("desc"), kids.join(","));
  const held = ch => {
    setup(ch); ch.archetypeChoices.naturalAdvantages = [{ id: "favored-skill", rank: 1 }];
    ch.advantages = [{ id: "favored-skill", rank: 1, notes: "", source: "natural", selections: { skill: ["stealth"] } }];
  };
  for (const store of [{}, EXPERT]) {
    app = onStep("professional", "street", "archetype", held, store);
    const tag = panel(app).querySelector(".effects .etag.rule").textContent;
    assert.match(tag, /Stealth/, "the held tag doesn't name the pick");
    assert.notEqual(tag, general);
    if (store === EXPERT) {
      assert.ok(hiddenIn(panel(app).querySelector(".desc")), "the panel's text is shown");
      assert.ok(!hiddenIn(panel(app).querySelector(".effects")), "the panel's tags folded");
      assert.ok(panel(app).querySelector("[data-fold]"));
    }
  }
});

test("the Stats step's line says point buy unless the table rolls for Stat Points", () => {
  const line = app => app.$("#main .step-note").textContent;
  const flat = onStep("professional", "street", "stats");
  assert.match(line(flat), /point buy/i);
  assert.doesNotMatch(line(flat), /roll|explosion/i, "a point-buy character is told to roll");
  const rolled = onStep("professional", "street", "stats", ch => { ch.creation.statMethod = "rolled"; });
  assert.match(line(rolled), /^Roll for your Stat Points/);
  assert.match(line(rolled), /Explosions do not happen on creation rolls\./);
  // Ticking the box on the Power Level step changes the line it leads to.
  const pl = onStep("professional", "street", "power-level");
  pl.$("#main [data-stat-rolled]").checked = true;
  pl.$("#main [data-stat-rolled]").dispatchEvent(new pl.window.Event("change"));
  pl.window.eval(`S.step = STEPS.findIndex(s => s.id === "stats"); update();`);
  assert.match(line(pl), /^Roll for your Stat Points/);
  assert.deepEqual([...flat.errors, ...rolled.errors, ...pl.errors], []);
});

// ── P19 (the rider): Expert mode reaches the Stats step, and its toggle is in the header on every step (Decision 234) ──
const ALL_STEPS = [...D.creationFlow.steps.map(s => s.id), "review"];

test("P19 9: the Expert mode toggle is in the header on every step of character creation", () => {
  assert.equal(ALL_STEPS.length, 8);
  for (const id of ALL_STEPS) {
    const app = onStep("professional", "street", id, () => {});
    const btn = app.$("#hdractions [data-expert]");
    assert.ok(btn, `${id}: no toggle`);
    assert.equal(btn.getAttribute("aria-pressed"), "false", id);
    assert.equal(btn.getAttribute("aria-label"), "Expert mode", id);
    assert.equal(btn.getAttribute("title"), D.appCopy.expertTitle, `${id}: the title`);
    assert.match(D.appCopy.expertTitle, /Stats, Archetype, Skills and Character Points/);
    assert.ok(app.$("#hdractions [data-home]"), `${id}: Home was pushed out`);
    // The first-sight hint is on the four steps it describes, and nowhere else.
    const hint = app.$$("#main .expert-hint").length;
    assert.equal(hint, ["stats", "archetype", "skills", "character-points"].includes(id) ? 1 : 0, `${id}: hint ×${hint}`);
  }
  // Off the wizard: Home and the sheet have none.
  assert.ok(!boot().$("[data-expert]"), "Home has the toggle");
  assert.ok(!openSheet(lockedCharacter(), "main").$("[data-expert]"), "the sheet has the toggle");
  // On Concept a press changes the setting and the button, and nothing else you can see.
  const app = onStep("professional", "street", "concept", () => {});
  const main0 = app.$("#main").innerHTML, ch0 = JSON.stringify(app.window.eval("S.ch"));
  app.$("#hdractions [data-expert]").focus();
  app.click("#hdractions [data-expert]");
  assert.equal(app.$("#hdractions [data-expert]").getAttribute("aria-pressed"), "true");
  assert.equal(app.window.localStorage.getItem("shadows.ui.expert"), "on");
  assert.equal(app.window.document.activeElement, app.$("#hdractions [data-expert]"), "focus left the toggle");
  assert.equal(app.$("#main").innerHTML, main0, "a press on Concept changed the page");
  assert.equal(JSON.stringify(app.window.eval("S.ch")), ch0);
  app.click("#hdractions [data-expert]");
  assert.equal(app.$("#hdractions [data-expert]").getAttribute("aria-pressed"), "false");
  assert.equal(app.$("#main").innerHTML, main0);
  assert.deepEqual(app.errors, []);
});

test("P19 10: Expert mode folds the Stats step's descriptions and keeps every control", () => {
  const on = onStep("professional", "street", "stats", ch => { ch.stats.BOD.base = 7; }, EXPERT);
  assert.deepEqual(on.errors, []);
  const rows = on.$$("#main .alloc-row");
  assert.equal(rows.length, D.stats.length);
  const descs = () => on.$$("#main .alloc-row .name small").filter(s => !s.classList.contains("next-cost"));
  assert.equal(descs().length, 8);
  assert.ok(descs().every(s => s.hidden), "a description is shown");
  for (const r of rows) {
    assert.ok(r.querySelector(".name") && r.querySelector(".stepper .val") && r.querySelector(".mod") && r.querySelector("[data-fold]"), r.textContent);
    assert.ok(!hiddenIn(r.querySelector(".stepper")) && !hiddenIn(r.querySelector(".mod")));
  }
  const body = rows[0];
  assert.match(body.querySelector(".name").textContent, /^Body/);
  assert.equal(body.querySelector(".stepper .val").textContent, "7");
  const next = body.querySelector(".next-cost");
  assert.ok(next && !hiddenIn(next), "the price folded");
  assert.match(next.textContent, /^The next point costs 2\.$/);
  // ? opens Body's text, in place, and a stepper press keeps it open.
  on.click('[data-fold="stat|BOD"]');
  assert.equal(on.$('[data-fold="stat|BOD"]').getAttribute("aria-expanded"), "true");
  assert.equal(descs().filter(s => !s.hidden).length, 1);
  assert.match(descs().find(s => !s.hidden).textContent, /\S/);
  on.click('[data-step="stat|BOD|-1"]');
  assert.equal(descs().filter(s => !s.hidden).length, 1, "a stepper press closed it");
  assert.equal(on.$$("#main .alloc-row")[0].querySelector(".stepper .val").textContent, "6");
  // The pool and the buy rule stay.
  assert.match(on.$("#main .pool").textContent, /Pool/);
  assert.ok(on.$("#main .dice-note") && !hiddenIn(on.$("#main .dice-note")), "the buy rule folded");
  // Off: the page is as it was, with no ? and nothing hidden.
  const off = onStep("professional", "street", "stats", ch => { ch.stats.BOD.base = 7; });
  assert.equal(off.$$("#main [data-fold], #main [data-foldbody]").length, 0);
  assert.ok(off.$$("#main .alloc-row .name small").every(s => !s.hidden));
  assert.equal(off.$$("#main .alloc-row .name small").filter(s => !s.classList.contains("next-cost")).length, 8);
  assert.deepEqual(off.errors, []);
});

// ── P20a: numbers at creation (Decision 235) ─────────────────────────────
// Every stat at 3 but the ones named, so the pool has points left and the + is disabled only by a cap.
const low20 = (extra = {}) => ch => {
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 3;
  Object.assign(ch.stats.BOD, { base: 3 });
  for (const [id, v] of Object.entries(extra)) ch.stats[id].base = v;
};
const trait20 = (id, rank = 1) => ({ id, rank, notes: "" });
const upBtn = (app, id) => app.$(`[data-step="stat|${id}|1"]`);

test("P20a 5: the Stats step shows and enforces the cap", () => {
  const dwarf = ch => { low20({ BOD: 8, MOB: 3 })(ch); ch.disadvantages = [trait20("dwarf")]; };
  for (const expert of [false, true]) {
    const app = onStep("professional", "street", "stats", dwarf, expert ? EXPERT : {});
    assert.deepEqual(app.errors, []);
    const row = id => upBtn(app, id).closest(".alloc-row");
    assert.ok(upBtn(app, "MOB").disabled, "MOB's + is open at Dwarf's cap");
    assert.ok(upBtn(app, "BOD").disabled, "BOD's + is open at 8");
    assert.ok(!upBtn(app, "REF").disabled, "REF's + is shut with nothing in its way");
    assert.match(row("MOB").textContent, /Max 3 \(Dwarf\)\./);
    assert.match(row("BOD").textContent, /Max 8 \(Dwarf\)\./);
    assert.doesNotMatch(row("REF").textContent, /Max \d/);
    const line = row("MOB").querySelector(".stat-max");
    assert.ok(line && line.classList.contains("next-cost") && !line.hidden, `Expert ${expert}: the cap line is hidden or loses its class`);
    // The press is refused too, not only the button.
    app.window.eval("applyStep('stat|MOB', 1)");
    assert.equal(app.window.eval("S.ch.stats.MOB.base"), 3);
    app.window.eval("applyStep('stat|REF', 1)");
    assert.equal(app.window.eval("S.ch.stats.REF.base"), 4);
  }
  // Nothing held: the stat tops out at 10, as before, and says nothing about a max.
  const plain = onStep("professional", "street", "stats", low20({ BOD: 10 }));
  assert.ok(upBtn(plain, "BOD").disabled);
  assert.equal(plain.$$("#main .stat-max").length, 0);
  // Giant: BOD can reach 11, REF stops at 5.
  const giant = onStep("professional", "street", "stats", ch => { low20({ BOD: 10, REF: 5 })(ch); ch.disadvantages = [trait20("giant")]; });
  assert.ok(!upBtn(giant, "BOD").disabled, "a Giant's BOD stops at 10");
  assert.ok(upBtn(giant, "REF").disabled);
  assert.match(upBtn(giant, "BOD").closest(".alloc-row").textContent, /Max 11 \(Giant\)\./);
  giant.window.eval("applyStep('stat|BOD', 1)");
  assert.equal(giant.window.eval("S.ch.stats.BOD.base"), 11);
  giant.window.eval("update()");
  assert.ok(upBtn(giant, "BOD").disabled, "BOD went past 11");
});

test("P20a 4: a cap already passed shows on the card and refuses the lock; nothing lowers a stat", () => {
  const over = ch => { ch.stats.MOB.base = 5; ch.disadvantages = [trait20("dwarf")]; };
  const app = onStep("professional", "street", "character-points", over);
  const pick = name => app.$$("#main .pick").find(p => p.querySelector("h2") && p.querySelector("h2").textContent === name);
  assert.equal(pick("Dwarf").querySelector(".effects .etag.over").textContent, "MOB is 5, over Dwarf's max of 3.");
  assert.equal(pick("Giant").querySelector(".etag.over"), null);
  assert.equal(app.window.eval("S.ch.stats.MOB.base"), 5, "the CP step lowered MOB");
  // The lock is refused, with the stat, the cap, the trait and where to fix it.
  const half = named("Over"); half.creation.locked = false; half.stats.MOB.base = 5; half.disadvantages = [trait20("dwarf")];
  const rev = boot({ storage: { "shadows.draft.v1": { ch: half, step: 7, maxReached: 7 } } });
  card(rev, "Over").querySelector("[data-open]").click();
  assert.equal(rev.$("[data-lock]").disabled, true, "Lock was open with MOB over Dwarf's cap");
  assert.match(rev.$("#wiz-issues").textContent, /MOB is 5, over Dwarf's max of 3\. Lower it on the Stats step\./);
  assert.equal(rev.window.eval("S.ch.stats.MOB.base"), 5);
  // At the cap the card is quiet.
  const ok = onStep("professional", "street", "character-points", ch => { ch.stats.MOB.base = 3; ch.disadvantages = [trait20("dwarf")]; });
  assert.equal(ok.$$("#main .etag.over").length, 0);
  assert.deepEqual([app.errors, rev.errors, ok.errors], [[], [], []]);
});

test("P20a 4: an Advantage's cap, passed, shows on its card as a Disadvantage's does (Decision 135)", () => {
  const app = onStep("professional", "street", "character-points", ch => { ch.stats.MOB.base = 5; ch.advantages = [trait20("wealthy")]; });
  app.window.eval(`D.advantages.find(a => a.id === "wealthy").grants.push({ type: "statMax", stat: "MOB", max: 3 }); update();`);
  const pick = app.$$("#main .pick").find(p => p.querySelector("h2") && p.querySelector("h2").textContent === "Wealthy");
  assert.equal(pick.querySelector(".effects .etag.over").textContent, "MOB is 5, over Wealthy's max of 3.");
  assert.deepEqual(app.errors, []);
});

test("P20a 6: Dwarf and Giant lock each other on the CP step", () => {
  const pickOf = (app, name) => app.$$("#main .pick").find(p => p.querySelector("h2") && p.querySelector("h2").textContent === name);
  for (const [held, other, byName] of [["dwarf", "Giant", "Dwarf"], ["giant", "Dwarf", "Giant"]]) {
    const app = onStep("professional", "street", "character-points", ch => { ch.disadvantages = [trait20(held)]; });
    const card = pickOf(app, other);
    assert.ok(card.querySelector("[data-step^='disadv|'][data-step$='|1']").disabled, `${other}'s + is open`);
    assert.match(card.querySelector(".head").textContent, new RegExp(`locked by ${byName}`));
    assert.deepEqual(app.errors, []);
  }
});

test("P20a 7: the review line shows Wealthy's Ç10,000 and the lock seeds it, once", () => {
  const mult = D.powerLevels.find(p => p.id === "street").startingCredits.multiplier;
  const half = named("Rich"); half.creation.locked = false; half.creation.rolls.credits = 6;
  half.creation.powerLevel = "street"; half.advantages = [trait20("wealthy", 2)];
  const app = boot({ storage: { "shadows.draft.v1": { ch: half, step: 7, maxReached: 7 } } });
  const got = withDownloads(app);
  card(app, "Rich").querySelector("[data-open]").click();
  const n = v => v.toLocaleString("en-US");
  assert.match(app.$("#main .roll-entry .pool").textContent, new RegExp(`Starting .*${n(6 * mult)} \\+ 10,000 Wealthy = ${n(6 * mult + 10000)}`));
  app.click("[data-lock]");
  assert.equal(got.length, 1);
  assert.equal(app.window.eval("S.ch.trackers.credits.current"), 6 * mult + 10000);
  // A character with none of it reads the plain product, as before.
  const plain = named("Plain"); plain.creation.locked = false; plain.creation.rolls.credits = 6; plain.creation.powerLevel = "street";
  const p = boot({ storage: { "shadows.draft.v1": { ch: plain, step: 7, maxReached: 7 } } });
  card(p, "Plain").querySelector("[data-open]").click();
  assert.match(p.$("#main .roll-entry .pool").textContent, new RegExp(`Starting .*${6 * mult}\\b(?! \\+)`));
  assert.doesNotMatch(p.$("#main .roll-entry .pool").textContent, /Wealthy|=/);
  assert.deepEqual([app.errors, p.errors], [[], []]);
});

test("P20a 9: the breakdowns name the parts", () => {
  const app = boot();
  const bd = (mut, id) => app.window.eval(`(()=>{ const c = Engine.newCharacter(); c.creation.powerLevel = ${JSON.stringify(D.powerLevels[0].id)}; ${mut}; return derivedBreakdownStr(c, ${JSON.stringify(id)}); })()`);
  const hold = (list, id, rank = 1) => `c.${list}.push({ id: ${JSON.stringify(id)}, rank: ${rank}, notes: "" })`;
  // Neither a floor nor a cap applies: no "floor / cap" in the line.
  assert.equal(bd("c.stats.EMP.base = 6", "SAN"), "EMP 6 × 10 = 60%");
  assert.equal(bd(`c.stats.EMP.base = 6; ${hold("disadvantages", "berserker")}`, "SAN"), "EMP 6 × 10 = 60% − 15 Berserker → 45%");
  assert.equal(bd(`c.stats.EMP.base = 6; ${hold("disadvantages", "minor-insanity", 3)}`, "SAN"), "EMP 6 × 10 = 60% − 15 Minor Insanity → 45%");
  // The cap comes first and is named as the cap; the cut comes after it.
  assert.equal(bd(`c.stats.EMP.base = 10; ${hold("disadvantages", "blood-lust")}`, "SAN"), "EMP 10 × 10 = 100% → 95% (cap 95) − 5 Blood Lust → 90%");
  // The floor of 1 is its own clause.
  const low = bd(`c.stats.EMP.base = 1; ${hold("disadvantages", "berserker")}; ${hold("disadvantages", "hallucinations")}`, "SAN");
  assert.equal(low, "EMP 1 × 10 = 10% − 15 Berserker − 25 Hallucinations → 1% (never lower)");
  for (const s of [bd(`c.stats.EMP.base = 6; ${hold("disadvantages", "berserker")}`, "SAN"), low]) assert.doesNotMatch(s, /floor \/ cap/);
  // TOL: the Aberration is named, and the line is the number.
  const tol = bd("c.identity.archetype = 'arcanist'; c.archetypeChoices.specialization = ['arcane-fortitude']; for (const k of Object.keys(c.stats)) c.stats[k].base = 5", "TOL");
  assert.match(tol, /\+ 2 Arcane Fortitude → \d+$/);
  assert.equal(bd("c.identity.archetype = 'arcanist'; c.archetypeChoices.specialization = ['unshakable-mind']; for (const k of Object.keys(c.stats)) c.stats[k].base = 5", "TOL"), "1 + INT 0 + BOD 0 + COOL 0 = 1");
  assert.deepEqual(app.errors, []);
});
