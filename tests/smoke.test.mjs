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
  assert.equal(resumed.meta.schemaVersion, "0.19");
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
                   { id: "ambidextrous", rank: 1, notes: "" },
                   { id: "lucky", rank: 1, notes: "" }];

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

  // ...and a Supernatural keeps only the Universal ones (Decision 152).
  app.click('[data-arch="werewolf"]');
  now = stored(app, { locked: false });
  assert.equal(now.advantages.map(a => a.id).join(), "lucky",
    "a Werewolf kept an Advantage it cannot buy, or lost a Universal one it can");
});

test("a Werewolf's Character Points step opens the Universal Advantages and no others (Decision 152)", () => {
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = "werewolf";
  ch.creation.powerLevel = D.powerLevels[0].id;
  // A held Mortal-only Advantage, as an edited file might carry: it can still be taken off.
  ch.advantages = [{ id: "ambidextrous", rank: 1, notes: "" }];
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("character-points"), maxReached: steps.length - 1 } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  const up = id => app.$(`[data-step="adv|${id}|1"]`), down = id => app.$(`[data-step="adv|${id}|-1"]`);
  assert.ok(up("lucky") && !up("lucky").disabled, "a Universal Advantage can't be bought");
  assert.equal(up("animal-ken"), null, "a Mortal-only Advantage offers a + to a Werewolf");
  assert.match(app.$("#main").textContent, /Not for Supernaturals/);
  assert.match(app.$("#main").textContent, /only Universal Advantages are open/);
  const names = app.$$("#main .pick h2").map(h => h.textContent);
  assert.ok(names.indexOf("Time Sense") < names.indexOf("Ambidextrous"),
    "the Universal Advantages aren't listed before the Mortal-only ones");
  assert.ok(down("ambidextrous") && !down("ambidextrous").disabled, "a held Mortal-only Advantage can't be removed");
  assert.ok(up("ambidextrous").disabled, "a held Mortal-only Advantage can be raised");
  assert.deepEqual(app.errors, []);
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

function openSheet(ch, section, opts = {}) {
  const app = boot({ storage: { "shadows.active.v1": { ch, section } }, ...opts });
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
  const app = openSheet(ch, "character");
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

test("W32: a spell's Spell Power reads as a number beside the book's words, wherever it shows", () => {
  const ch = lockedCharacter();
  ch.panelData.grimoire = [{ spellId: "dart", stage: "known", notes: "" }, { spellId: "firebolt", stage: "known", notes: "" }];
  ch.trackers.aberrations = [{ id: "electrocytes", permanence: "permanent", note: "" }];
  ch.archetypeChoices.disciplines = { evocation: 3 };           // Spell Power 5: its half rounds up to 3
  const sp = Engine.spellPower(ch).value, half = Math.ceil(sp / 2);
  assert.deepEqual([sp, half], [5, 3]);
  const app = openSheet(ch, "loadout");
  const [dart, bolt] = app.$$(".spell");
  assert.equal(dart.querySelector("summary .eff").textContent.trim(), `${half} (½ SP Damage)`);
  assert.match(dart.querySelector(".overflow").textContent, new RegExp(`1x ${sp} \\(Full Spell Power damage\\.\\)`));
  assert.match(bolt.querySelector(".overflow").textContent, new RegExp(`1x \\+${half} \\(Damage increases by ½ SP\\.\\)`), "an increase doesn't read as one");
  app.click('[data-spellpickopen="sheet"]');
  search(app, "zap");
  assert.match(app.$("#modal [data-spellresults]").textContent, new RegExp(`${half} \\(½ SP Damage, or shorts simple electronics\\)`), "the picker shows the words alone");
  app.$("#modal").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  app.click('[data-sec="character"]');
  const ref = app.$('[data-reference="magic-reference"]');
  assert.match(ref.textContent, new RegExp(`${sp} \\(Spirit damage equal to your Spell Power\\.\\)`), "Backlash in the Cascade table");
  assert.match(app.$("#main").textContent, new RegExp(`½ Spell Power: ${half}`), "Electrocytes on the Archetype tab");
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
  const card = h => app.$$("#main .trk").find(t => (t.querySelector("h2") || {}).textContent === h);
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
  const shown = () => app.$$("#main [data-filterable] .pick").filter(p => !p.hidden).map(p => p.querySelector("h2").textContent);
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

test("P1: a grenade reads its column as printed: radius, Defense, what each 10 adds, and the section's escalation rule", () => {
  const app = openSheet(lockedCharacter(), "loadout");
  app.click('[data-lobrowse="weapons"]');
  const row = () => app.$('#modal [data-catrow="fg1-thunderclap"]');
  assert.match(row().textContent, /Radius 5m · Defense TN 8 TH 2/, "the catalog row doesn't show the grenade's Defense");
  app.click('#modal [data-catrow="fg1-thunderclap"] td');
  const detail = row().nextElementSibling.textContent;
  assert.match(detail, /On a 10: 1x \+5 dmg · 2x\+ Injured\./, "the details don't show the 1x / 2x+ column");
  assert.match(detail, /Every grenade escalates on the throw/, "the details don't carry the section's rule");
  assert.doesNotMatch(app.$('#modal [data-catrow="combat-knife"]').nextElementSibling.textContent, /escalates|On a 10/, "a knife carries the grenade rule");
  app.click('#modal [data-catadd="sg2-shockwave"]');
  app.click("#modal [data-modalclose]");
  const carried = app.$("#main .lo-weapons tbody tr").textContent;
  assert.match(carried, /Radius 10m/, "a carried grenade doesn't show its radius");
  assert.match(carried, /Defense TN 8 TH 3/);
  assert.match(carried, /On a 10: 1x Stunned · 2x\+ Unconscious\./, "a carried grenade doesn't show what a 10 does");
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

test("W42: Main's Heal 1 · Hurt 1 · Take a hit row is the popover's own controls, under Health and Pain, and a held Enter on Heal never hurts", () => {
  const app = openSheet(lockedCharacter(), "main");
  const row = () => app.$("#main .cond-grid .vital-verbs");
  assert.ok(row(), "Main has no Health verbs row in its card grid");
  const order = [...app.$("#main .cond-grid").children].map(e => e.dataset.vpop || "verbs");
  assert.deepEqual(order.slice(0, 3), ["hp", "pain", "verbs"], "the row isn't straight after Health and Pain");
  assert.ok(row().querySelector('[data-dmg="-1"]').disabled, "Heal 1 is live with nothing to heal");

  // Hurt 1: the same commit as the popover's, one toast, one undo each.
  const hurt = () => row().querySelector('[data-dmg="1"]');
  hurt().focus(); app.click('#main .vital-verbs [data-dmg="1"]');
  hurt().focus(); app.click('#main .vital-verbs [data-dmg="1"]');
  assert.equal(activeChar(app).trackers.damage, 2);
  assert.equal(app.window.document.querySelectorAll("#undotoast").length, 1, "the toasts stacked");
  assert.match(app.$("#undotoast").textContent, /Hurt 1/, "not the popover's own label");
  assert.equal(app.window.document.activeElement, hurt(), "focus didn't come back to Hurt 1 after the re-render");
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).trackers.damage, 1, "the toast undid more than the last tap");

  // Heal 1 down to nothing: focus goes to the Health card, not to Hurt 1.
  const heal = row().querySelector('[data-dmg="-1"]');
  heal.focus(); app.click('#main .vital-verbs [data-dmg="-1"]');
  assert.equal(activeChar(app).trackers.damage, 0);
  assert.equal(app.window.document.activeElement, app.$('#main [data-vpop="hp"]'), "a greyed Heal 1 handed focus to Hurt 1");

  // At zero, Main's Hurt 1 greys out and says why (Decision 151): a raw Hurt
  // would skip 0540's At Zero WILL check, which Take a hit asks. The
  // popover's stepper stays a raw correction, with no ceiling.
  const total = Engine.health(activeChar(app)).total;
  assert.ok(!app.$("#main .vital-verbs-note"), "the at-zero note shows above zero");
  for (let i = 0; i <= total; i++) app.click('#main .vital-verbs [data-dmg="1"]');
  assert.equal(activeChar(app).trackers.damage, total, "Main's Hurt 1 went past zero");
  assert.ok(hurt().disabled, "Hurt 1 is live at zero");
  assert.match(app.$("#main .vital-verbs-note").textContent, /WILL check.*Take a hit/, "a greyed Hurt 1 doesn't say why");
  app.click('#main .cond[data-vpop="hp"]');
  app.click('#vpop [data-dmg="1"]');
  assert.equal(activeChar(app).trackers.damage, total + 1, "the popover's stepper clamped at zero");
  app.window.document.dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

  app.$("#main .vital-verbs [data-hitopen]").focus();                     // a browser focuses what's clicked
  app.click('#main .vital-verbs [data-hitopen]');
  assert.ok(app.$("#modal").open && /Take a hit/.test(app.$("#modal").textContent), "Take a hit didn't open the hit modal");
  app.click("[data-hitcancel]");
  assert.equal(app.window.document.activeElement, app.$("#main .vital-verbs [data-hitopen]"), "focus didn't come back to Take a hit");
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
  // W30: nothing on the sheet fits, so Reload asks, and the audit says so.
  app.click('.main-combat [data-reload="0"]');
  assert.equal(activeChar(app).weapons[0].roundsSpent, 13, "reloaded from nothing without asking");
  assert.match(app.$("#modal").textContent, /You carry no Rifle Rounds\. Reload anyway\?/);
  app.click("#modal [data-askyes]");
  assert.equal(activeChar(app).weapons[0].roundsSpent, 0);
  assert.match(app.$("#undotoast").textContent, /Reloaded .* anyway, no Rifle Rounds on the sheet/);
  assert.match(activeChar(app).audit.at(-1).label, /anyway, no Rifle Rounds on the sheet/, "the audit doesn't say it came from nowhere");
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).weapons[0].roundsSpent, 13, "Reload didn't undo on its own");
  assert.deepEqual(app.errors, []);
  // With a mag carried, Reload takes it, in the same one undo.
  const c2 = lockedCharacter();
  c2.weapons.push({ id: "ar9x-guardian", notes: "", mods: [], roundsSpent: 13 });
  c2.gear.push({ id: "rifle-rounds", qty: 2, notes: "" });
  const app2 = openSheet(c2, "main");
  assert.match(app2.$('.main-combat [data-reload="0"]').title, /Rifle Rounds: 2 mags carried/);
  app2.click('.main-combat [data-reload="0"]');
  assert.equal(activeChar(app2).weapons[0].roundsSpent, 0);
  assert.equal(activeChar(app2).gear[0].qty, 1, "the mag didn't come off what's carried");
  assert.match(app2.$("#undotoast").textContent, /Reloaded .*\(31\/31\), −1 mag of Rifle Rounds/);
  app2.click("[data-toastundo]");
  assert.equal(activeChar(app2).gear[0].qty, 2, "undo didn't put the mag back");
  assert.deepEqual(app2.errors, []);
});

test("W40: Reload asks which rounds, Silver Rounds stay loaded with their tag, and a full weapon swaps back", () => {
  const ch = lockedCharacter();
  ch.weapons.push({ id: "ar9x-guardian", notes: "", mods: [], roundsSpent: 13 });
  ch.gear.push({ id: "rifle-rounds", qty: 2, notes: "" }, { id: "silver-rounds", qty: 1, notes: "" });
  const app = openSheet(ch, "main");
  app.click('.main-combat [data-reload="0"]');
  assert.equal(activeChar(app).weapons[0].roundsSpent, 13, "reloaded without asking which");
  const modal = app.$("#modal");
  assert.ok(modal.open, "no choice of rounds");
  assert.match(modal.textContent, /Rifle Rounds[\s\S]*Silver Rounds[\s\S]*Withering \(Lycanthropes\)/);
  assert.match(modal.textContent, /still being settled/, "the unsettled swap rule isn't said");
  app.click('#modal [data-loadammo="silver-rounds"]');
  const w = activeChar(app).weapons[0];
  assert.deepEqual([w.roundsSpent, w.loaded], [0, "silver-rounds"]);
  assert.match(app.$("#undotoast").textContent, /Loaded .* with Silver Rounds \(31\/31\), −1 mag of Silver Rounds/);
  const row = app.$('.main-combat [data-reload="0"]').closest("tr");
  assert.match(row.textContent, /Silver Rounds/, "the line doesn't say what's loaded");
  assert.match(row.textContent, /Withering \(Lycanthropes\)/, "the rounds' tag isn't on the line");
  // Full, Reload is there to swap back, and asks.
  assert.equal(app.$('.main-combat [data-reload="0"]').disabled, false, "a full weapon can't swap");
  app.click('.main-combat [data-reload="0"]');
  app.click('#modal [data-loadammo="rifle-rounds"]');
  assert.equal(activeChar(app).weapons[0].loaded, undefined);
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).weapons[0].loaded, "silver-rounds", "undo didn't put the silver back");
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

test("B17, 0414: each Origin shows its Shifting, Refuel and Need and its starter power, its table too, on the sheet and in the wizard", () => {
  // The option's starter power was in the data and nowhere on screen: a
  // Werewolf's sheet never mentioned it. 0414 gave every Origin one, and two
  // of them a table (VQ15: reference, never rolled).
  const ww = D.archetypes.find(a => a.id === "werewolf");
  const shows = (text, o, where) => {
    for (const f of o.features) assert.ok(text.includes(f.text), `${o.name}'s ${f.name} isn't ${where}`);
    assert.ok(text.includes(o.starterPower.name) && text.includes(o.starterPower.description), `${o.name}'s starter power isn't ${where}`);
    for (const r of o.starterPower.rows || []) for (const v of Object.values(r)) assert.ok(text.includes(v), `${o.starterPower.name}'s row "${v}" isn't ${where}`);
  };
  assert.equal(ww.specialization.options.map(o => o.id).join(" "), "trueborn wildblood forge-fang");
  for (const o of ww.specialization.options){
    const ch = lockedCharacter();
    ch.identity.archetype = "werewolf";
    ch.archetypeChoices.specialization = [o.id];
    const app = boot({ storage: { "shadows.active.v1": { ch, section: "archetype" } } });
    app.$$("#main button").find(b => /Open sheet/.test(b.textContent)).click();
    app.click('[data-sec="character"]');
    shows(app.$("#main").textContent, o, "on the sheet");
    assert.equal(app.$$("#main .power .chip").length, 0, "a starter power says it isn't written yet");
    assert.deepEqual(app.errors, []);
  }
  const draft = lockedCharacter();
  draft.creation.locked = false;
  draft.identity.archetype = "werewolf";
  const w = boot({ storage: { "shadows.draft.v1": { ch: draft, step: 3, maxReached: 3 } } });
  w.click("[data-open]");
  for (const o of ww.specialization.options) shows(w.$("#main").textContent, o, "on the wizard's card");
  assert.deepEqual(w.errors, []);
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

test("W31: a Ghost TAG says so over the number on Main and in the printed header", () => {
  const ch = Engine.migrate(named("Vex Morrow"));
  ch.advantages.push({ id: "ghost-tag-s", rank: 1 });
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "main" } } });
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent)).click();
  const intake = app.$("#main .intake");
  assert.equal(intake.querySelector(".intake-label") && intake.querySelector(".intake-label").textContent, "Ghost TAG");
  assert.ok(intake.textContent.includes(ch.meta.id), "the number went away");
  assert.match(intake.title, /^Ghost TAG\. A counterfeit/, "hovering doesn't say what a Ghost TAG is");
  app.window.print = () => {};
  app.click("[data-menu-toggle]"); app.click("[data-print]");
  assert.match(app.$("#printSheet .p-intake").textContent, /Ghost TAG/, "the print header doesn't say Ghost TAG");
  assert.deepEqual(app.errors, []);
});

test("W41: the Identity step asks TAG'd or TAGless, and Admin changes it later, logged and undoable", () => {
  const app = draftOn("arcanist", "concept");
  const pick = v => app.$(`[data-tagless="${v}"]`);
  assert.ok(pick(0) && pick(1), "no TAG'd/TAGless choice on the Identity step");
  assert.equal(pick(0).getAttribute("aria-pressed"), "true", "a new character isn't TAG'd");
  pick(1).click();
  assert.equal(draft(app).identity.tagless, true);
  assert.equal(app.$(`[data-tagless="1"]`).getAttribute("aria-pressed"), "true");
  assert.match(app.$(".tag-choice").textContent, /skrip/, "the pick doesn't say what it means");
  assert.deepEqual(app.errors, []);

  const ch = Engine.migrate(named("Vex Morrow"));
  const sheet = openSheet(ch, "main");
  assert.equal(sheet.$("#main .intake .intake-label"), null, "a TAG'd character's TAG is labelled");
  sheet.click("[data-menu-toggle]"); sheet.click("[data-admin]");        // admin mode opens its editor
  sheet.click('[data-admin-tagless="1"]');
  assert.equal(activeChar(sheet).identity.tagless, true);
  sheet.click('[data-sec="main"]');
  assert.equal(sheet.$("#main .intake .intake-label").textContent, D.tag.tagless.label);
  // Decision 155: the number stays, without its TAG- prefix, everywhere it shows.
  const bare = ch.meta.id.slice(4);
  assert.equal(sheet.$("#main .intake .intake-no").textContent, bare, "a TAGless number still reads TAG-, or went away");
  assert.equal(activeChar(sheet).meta.id, ch.meta.id, "the stored number moved");
  sheet.click("[data-menu-toggle]"); sheet.click("[data-print]");
  assert.equal(sheet.$("#printSheet .p-intake span").textContent, bare, "print still reads TAG-");
  sheet.click("[data-toastundo]");
  assert.equal(activeChar(sheet).identity.tagless, false, "undo didn't put the TAG back");
  assert.deepEqual(sheet.errors, []);
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
  app.click('[data-raiseopen="stat"]');
  assert.match(app.$("#modal").textContent, /a Stat costs its current value × 12 IP/);
  app.click("#modal [data-modalclose]");
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
  const app = openSheet(lockedCharacter(), "character");
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
const wizCss = () => readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");

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

// ── A written-in archetype on the sheet (Decision 153, custom archetype S4) ──
function writtenInCharacter() {
  const ch = lockedCharacter();
  ch.identity.archetype = D.archetypes.find(a => a.writeIn).id;
  Object.assign(ch.archetypeChoices.writeIn, { name: "Changeling", description: "Stolen as a child.",
    classification: "other", classificationText: "Fae", mechanics: ["sfr"],
    traits: [{ name: "Glamour", description: "Looks like whoever you expect." }],
    vulnerabilities: [{ name: "Cold iron", description: "Burns." }] });
  Engine.newPower(ch);
  Object.assign(ch.powers[0], { name: "Fade", uses: "SFR", effect: "Unseen for a round." });
  ch.progression.ip.earned = 30;
  return ch;
}
// Decision 158: Traits and Archetype are one Character tab. A saved section
// from before lands on it, its jump bar reaches every section, Expand all
// opens every Advantage and Disadvantage and is remembered, and the buttons
// at its foot go to Loadout & Powers and Trackers.
test("Character: the archetype, then Advantages beside Disadvantages, one tab, with Expand all (Decision 158)", () => {
  const ch = lockedCharacter();
  ch.advantages = [{ id: D.advantages[0].id, rank: 1 }];
  ch.disadvantages = [{ id: D.disadvantages[0].id, rank: 1 }];
  for (const legacy of ["traits", "archetype"]) {
    const app = boot({ storage: { "shadows.active.v1": { ch, section: legacy } } });
    app.$$("#main button").find(b => /Open sheet/.test(b.textContent))
      .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
    assert.equal(app.$(".tab.active").dataset.sec, "character", `a saved "${legacy}" section didn't land on Character`);
  }
  const app = openSheet(ch, "character");
  assert.deepEqual(app.errors, []);
  const jumps = app.$$("#main .jumpbar [data-jump]").map(b => b.textContent);
  for (const s of ["Archetype", "Baseline Traits", "Advantages", "Disadvantages", "Magic reference"]) assert.ok(jumps.includes(s), `the jump bar has no ${s}: ${jumps}`);
  assert.ok(app.$("#main .jumpbar.sticky"), "the jump bar doesn't stay in view");
  assert.equal(app.$$("#main .trait-cols > .trait-col").length, 2, "Advantages and Disadvantages aren't two columns");
  assert.match(app.$$("#main .trait-col")[0].textContent, new RegExp(D.advantages[0].name));
  assert.match(app.$$("#main .trait-col")[1].textContent, new RegExp(D.disadvantages[0].name));

  // Decision 168: the archetype beside its core mechanic, its parts in one
  // flow of columns, and each side's cards in a grid as many across as fit.
  const top = app.$$("#main .arch-top > .arch-top-part");
  assert.equal(top.length, 2, "the archetype and its core mechanic aren't one band");
  assert.match(top[0].textContent, /Arcanist/);
  assert.match(top[1].textContent, new RegExp(D.archetypes.find(a => a.id === "arcanist").coreMechanic.name));
  const parts = app.$$("#main .arch-flow > .arch-part").map(p => p.querySelector(".sect").textContent);
  assert.ok(parts[0] === "Baseline Traits" && parts.includes("Disciplines"), `the archetype's parts aren't one flow: ${parts}`);
  assert.equal(app.$$("#main .trait-col > .trait-grid details.pick.trait").length, 2, "the trait cards aren't in a grid");

  const cards = () => app.$$("#main details.pick.trait");
  assert.ok(cards().length === 2 && cards().every(d => !d.open), "trait cards should start closed");
  app.click("[data-traits-all]");
  assert.ok(cards().every(d => d.open), "Expand all didn't open every card");
  assert.equal(app.$("[data-traits-all]").textContent, "Collapse all");
  app.click('[data-sec="main"]'); app.click('[data-sec="character"]');
  assert.ok(cards().every(d => d.open), "Expand all wasn't remembered across a re-render");
  app.click("[data-traits-all]");
  assert.ok(cards().every(d => !d.open), "Collapse all didn't close every card");

  app.click('[data-gotab="trackers"]');
  assert.equal(app.$(".tab.active").dataset.sec, "trackers", "the Trackers button didn't go to Trackers");
});

// Decision 159: Raise a Stat and Raise a Skill are buttons that open a modal,
// so the Milestones aren't below two long lists. A raise is one undoable IP
// spend and the modal stays open with the new prices; a raise you can't
// afford is off and says why.
test("Progression: Raise a Stat and Raise a Skill open modals, and a raise keeps it open (Decision 159)", () => {
  const ch = lockedCharacter();
  ch.progression.ip.earned = 60;
  const skill = D.skills[0];
  ch.skills[skill.id] = { rank: 2 };
  const app = openSheet(ch, "progression");
  assert.equal(app.$$("#main [data-raiseopen]").length, 3, "an Arcanist's Progression lacks Raise a Stat, a Skill or a Power");
  assert.ok(!app.$("#main [data-raise]"), "the raise lists are still on the page");
  const modal = () => app.$("#modal");

  app.click('[data-raiseopen="stat"]');
  assert.ok(modal().open, "Raise a Stat didn't open a modal");
  assert.match(modal().textContent, /You have 60 IP/);
  app.click('#modal [data-raise="stat|BOD"]');            // 5 → 6 for 50 IP
  assert.equal(activeChar(app).stats.BOD.ipe, 1, "the raise didn't land");
  assert.ok(modal().open, "the modal closed after one raise");
  assert.match(modal().textContent, /You have 10 IP/, "the modal's IP didn't refresh");
  const bod = app.$('#modal [data-raise="stat|BOD"]');
  assert.ok(bod.disabled && /Needs 60 IP; you have 10\./.test(bod.closest("tr").textContent), "an unaffordable raise doesn't say why");
  app.click("#modal [data-modalclose]");
  assert.ok(!modal().open);

  app.click('[data-raiseopen="skill"]');
  assert.match(modal().textContent, /Your skills[\s\S]*Learn a new skill/);
  const q = app.$("#modal [data-raiseq]");
  q.value = skill.name; q.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  assert.ok(app.$(`#modal [data-raise="skill|${skill.id}"]`), "searching hid the skill it names");
  assert.ok(!app.$(`#modal [data-raise="skill|${D.skills.find(s => !s.name.includes(skill.name) && !(s.description||"").includes(skill.name)).id}"]`), "the search didn't narrow the list");
  assert.deepEqual(app.errors, []);
});

test("Raise a Power: a Discipline and a written power rise on Progression, the journal says from what to what, and a Professional has no button (Decision 194)", () => {
  const ch = lockedCharacter();
  ch.progression.ip.earned = 100;
  const evo = Engine.disciplineRanks(ch).find(d => d.id === "evocation").rank;
  const app = openSheet(ch, "progression");
  app.click('[data-raiseopen="power"]');
  const modal = app.$("#modal");
  assert.ok(modal.open && /Raise a Power/.test(modal.textContent), "Raise a Power didn't open its modal");
  assert.match(modal.textContent, /Evocation[\s\S]*Enchantment[\s\S]*Alchemy/);
  assert.match(app.$('#modal [data-raise="power|alchemy"]').closest("tr").textContent, /Learn|40 IP/);
  app.click('#modal [data-raise="power|evocation"]');
  const c = activeChar(app);
  assert.equal(Engine.disciplineRanks(c).find(d => d.id === "evocation").rank, evo + 1, "the raise didn't land");
  assert.ok(modal.open, "the modal closed after one raise");
  assert.match(modal.textContent, new RegExp(`You have ${100 - 20 * evo} IP`), "the modal's IP didn't refresh");
  app.click("#modal [data-modalclose]");
  assert.match(app.$("#main .journal").textContent, new RegExp(`Evocation ${evo} → ${evo + 1}`), "the journal doesn't say what the raise bought");
  assert.deepEqual(app.errors, []);

  const w = writtenInCharacter(); w.progression.ip.earned = 100;
  const wapp = openSheet(w, "progression");
  wapp.click('[data-raiseopen="power"]');
  wapp.click(`#modal [data-raise="power|${w.powers[0].id}"]`);
  wapp.click("#modal [data-modalclose]");
  wapp.click(`[data-sec="${loadoutSec(wapp)}"]`);
  assert.match(wapp.$(".pw-card").textContent, /Fade\s*rank 2/, "Loadout doesn't show the written power's new rank");
  assert.deepEqual(wapp.errors, []);

  const pro = lockedCharacter(); pro.identity.archetype = "professional";
  assert.equal(openSheet(pro, "progression").$('[data-raiseopen="power"]'), null, "a Professional is offered powers to raise");
});

// Decision 160: the vitals panel pins beside the sheet. The pin is the
// browser's (CSS honours it from 1280px, which jsdom can't lay out), the
// panel's vitals open the same popovers as the bar, from the panel, and
// Unpin puts it back.
test("Pinned vitals: Pin keeps the panel, its vitals open their popovers, Unpin returns the bar (Decision 160)", () => {
  const app = openSheet(lockedCharacter(), "skills");
  const body = app.window.document.body, drawer = () => app.$("#vdrawer");
  assert.ok(!body.classList.contains("vitals-pinned"), "pinned before anyone asked");
  app.click("#vdrawer [data-vitals-pin]");
  assert.ok(body.classList.contains("vitals-pinned"), "Pin didn't pin");
  assert.equal(app.window.localStorage.getItem("shadows.ui.vitalsPinned"), "pinned", "the pin isn't remembered");
  assert.equal(drawer().querySelector("[data-vitals-pin]").textContent, "Unpin");
  for (const k of ["hp", "pain", "san", "luck", "cred"]) assert.ok(drawer().querySelector(`[data-vpop="${k}"]`), `the panel's ${k} doesn't open anything`);

  app.click('#vdrawer [data-vpop="luck"]');
  const pop = app.$("#vpop");
  assert.ok(!pop.hidden && pop.classList.contains("from-rail"), "the panel's LUCK didn't open its popover from the panel");
  assert.match(pop.textContent, /Boost the roll/);
  assert.equal(drawer().querySelector('[data-vpop="luck"]').getAttribute("aria-expanded"), "true");
  app.click('#main [data-vpop="luck"]');                  // the bar's own LUCK is a different trigger
  assert.ok(!pop.hidden && !pop.classList.contains("from-rail"), "the bar's LUCK didn't take the popover over");

  app.click('[data-sec="main"]');
  assert.ok(body.classList.contains("vitals-pinned") && drawer().querySelector('[data-vpop="hp"]'), "the panel left Main");
  app.click("#vdrawer [data-vitals-pin]");
  assert.ok(!body.classList.contains("vitals-pinned"), "Unpin didn't unpin");
  assert.equal(app.window.localStorage.getItem("shadows.ui.vitalsPinned"), "unpinned");
  assert.deepEqual(app.errors, []);
});

// W58's harden re-run: Home and the wizard only closed the flyout, so a
// pinned panel stayed beside them with the last character's numbers in it.
test("W58: a pinned panel goes with the sheet, to Home and on into the wizard", () => {
  const app = openSheet(lockedCharacter(), "skills");
  const body = app.window.document.body, drawer = () => app.$("#vdrawer");
  app.click("#vdrawer [data-vitals-pin]");
  assert.ok(body.classList.contains("vitals-pinned"), "Pin didn't pin");
  app.click("[data-menu-toggle]"); app.click("[data-home]");
  assert.ok(!body.classList.contains("vitals-pinned"), "Home kept the pinned panel beside it");
  assert.equal(drawer().innerHTML, "", "Home kept the last character's vitals in the panel");
  assert.equal(drawer().getAttribute("aria-hidden"), "true");
  app.click("#btn-new");
  assert.ok(!body.classList.contains("vitals-pinned") && !drawer().innerHTML, "the wizard kept the pinned panel");
  assert.equal(app.window.localStorage.getItem("shadows.ui.vitalsPinned"), "pinned", "leaving the sheet forgot the pin");
  assert.deepEqual(app.errors, []);
});

// W58: the closed flyout is inert, so Tab can't walk into controls nobody
// can see. jsdom doesn't implement inert, so these pin the attribute and
// where focus goes; real Chromium is what proves Tab skips it.
const esc = app => (app.window.document.activeElement || app.window.document.body)
  .dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));

test("W58: closed, the flyout is inert on every tab; open, focus goes in; closed again, it comes back to the toggle", () => {
  const app = openSheet(lockedCharacter(), "skills");
  const drawer = () => app.$("#vdrawer");
  for (const sec of ["main", "skills", "character", "trackers", "loadout"]) {
    app.click(`[data-sec="${sec}"]`);
    assert.ok(drawer().hasAttribute("inert"), `the closed flyout takes focus on ${sec}`);
    assert.equal(drawer().getAttribute("aria-hidden"), "true");
  }
  app.click('[data-sec="skills"]');
  app.click("#main [data-vitals-toggle]");
  assert.ok(!drawer().hasAttribute("inert") && drawer().classList.contains("open"), "the toggle didn't open it");
  assert.ok(focused(app).matches("#vdrawer [data-vitals-close]"), "opening left focus behind on the toggle");
  app.click("#vdrawer [data-vitals-close]");
  assert.ok(drawer().hasAttribute("inert"), "closed, it isn't inert");
  assert.ok(focused(app).matches("#main [data-vitals-toggle]"), "closing didn't hand focus back to the toggle");
  app.click("#main [data-vitals-toggle]");
  app.click("#vscrim");
  assert.ok(drawer().hasAttribute("inert") && focused(app).matches("#main [data-vitals-toggle]"), "the scrim left focus nowhere");
  assert.deepEqual(app.errors, []);
});

test("W58: Esc closes one layer, and a move to another tab closes the flyout", () => {
  const app = openSheet(lockedCharacter(), "skills");
  const drawer = () => app.$("#vdrawer");
  app.click("#main [data-vitals-toggle]");
  app.click('#vdrawer [data-vpop="luck"]');
  assert.ok(!app.$("#vpop").hidden, "the flyout's LUCK didn't open its popover");
  esc(app);
  assert.ok(app.$("#vpop").hidden, "Esc didn't close the popover");
  assert.ok(drawer().classList.contains("open") && !drawer().hasAttribute("inert"), "one Esc closed the flyout under the popover too");
  assert.ok(focused(app).matches('#vdrawer [data-vpop="luck"]'), "focus didn't go back to the row that opened the popover");
  esc(app);
  assert.ok(drawer().hasAttribute("inert") && focused(app).matches("#main [data-vitals-toggle]"), "the second Esc didn't close the flyout");

  app.click("#main [data-vitals-toggle]");
  app.click('[data-sec="main"]');
  assert.ok(!drawer().classList.contains("open") && drawer().hasAttribute("inert"), "the flyout followed the player to Main");
  assert.deepEqual(app.errors, []);
});

test("W58: pinned with room is not closed, and crossing 1280px with focus in the panel hands it to the toggle", () => {
  const app = openSheet(lockedCharacter(), "skills", { width: 1400 });
  const drawer = () => app.$("#vdrawer");
  app.click("#main [data-vitals-toggle]");
  app.click("#vdrawer [data-vitals-pin]");
  assert.ok(!drawer().hasAttribute("inert") && drawer().getAttribute("aria-hidden") === "false", "the pinned panel is inert");
  app.$('#vdrawer [data-vpop="hp"]').focus();
  app.resize(1000);
  assert.ok(drawer().hasAttribute("inert"), "narrower than the pin, the panel isn't inert");
  assert.ok(focused(app).matches("#main [data-vitals-toggle]"), "focus stayed in the panel as it left");
  app.resize(1400);
  assert.ok(!drawer().hasAttribute("inert") && drawer().getAttribute("aria-hidden") === "false", "back past 1280px the pinned panel is still inert");
  assert.deepEqual(app.errors, []);
});

// W45: on a phone every tab spent a third of the screen before its content.
// jsdom has no layout, so these pin the structure; `npm run phone-check`
// measures the rows and the fold in real Chromium.
test("W45: Main puts combat before Stats, and no sheet tab carries the Live Sheet eyebrow", () => {
  const app = openSheet(lockedCharacter(), "main");
  const grid = [...app.$("#main .main-grid").children].map(e => e.className);
  assert.deepEqual(grid, ["main-combat", "main-stats"], "Stats come before the weapon on a phone");
  for (const sec of ["main", "skills", "character", "trackers", "progression", "sessions", "loadout", "notes"]) {
    app.click(`[data-sec="${sec}"]`);
    assert.ok(!app.$("#main .eyebrow"), `the ${sec} tab still opens on an eyebrow`);
  }
  assert.deepEqual(app.errors, []);
});

test("W45: the vitals bar and the sheet's jump bars are one row each, with what rides with them outside the scroller", () => {
  const ch = lockedCharacter(); ch.advantages.push({ id: "danger-sense", rank: 1, notes: "" });
  const app = openSheet(ch, "skills");
  const row = app.$("#main .vbar > .vbar-row.scroll-row");
  assert.ok(row && row.querySelector('[data-vpop="hp"]'), "the vitals bar's pills aren't in a sideways row");
  assert.ok(app.$("#main .vbar > [data-vitals-toggle]") && !row.querySelector("[data-vitals-toggle]"),
    "the Vitals toggle scrolls away with the pills");
  app.click('[data-sec="character"]');
  assert.ok(app.$("#main .jumpbar.row > .jump-row.scroll-row [data-jump]"), "Character's jump bar isn't one row");
  assert.ok(app.$("#main .jumpbar.row > [data-traits-all]"), "Expand all scrolls away with the chips");
  app.click(`[data-sec="${loadoutSec(app)}"]`);
  assert.ok(app.$("#main .jumpbar.row .jump-row [data-jump]"), "Loadout's jump bar isn't one row");
  // Step 7's bar keeps its filter and wraps, as before.
  const wiz = arcanistOnCP();
  assert.ok(wiz.$("#main .jumpbar.sticky [data-jumpfilter]") && !wiz.$("#main .jumpbar.row"), "step 7's bar changed");
  assert.deepEqual([...app.errors, ...wiz.errors], []);
});

test("W45: CRANK alone takes its row (Decision 169), and Pin is reachable from Main", () => {
  const app = openSheet(lockedCharacter(), "main", { width: 1400 });   // Pin shows from 1280px
  assert.ok(!app.$("#main .cond.sfr"), "the fixture grew an SFR card");
  assert.ok(app.$("#main .cond.cred") && app.$("#main .cond.crank") && !app.$("#main .cond.alone"), "without SFR, Çredits and CRANK share a row");
  // With SFR the row above is full, so CRANK takes the next one alone.
  const sfr = lockedCharacter(); sfr.identity.archetype = "werewolf";
  const withSfr = openSheet(sfr, "main", { width: 1400 });
  assert.ok(withSfr.$("#main .cond.sfr"), "the werewolf fixture has no SFR card");
  assert.ok(withSfr.$("#main .cond.crank.alone"), "CRANK doesn't know it's alone on its row");
  assert.ok(!withSfr.$("#main .cond.cred.alone"), "Çredits shares the row with SFR");
  app.click("[data-vitals-pin-main]");
  assert.ok(app.window.document.body.classList.contains("vitals-pinned"), "Pin from Main didn't pin");
  assert.equal(focused(app), app.$("#vdrawer [data-vitals-pin]"), "focus didn't follow the panel to Unpin");
  assert.equal(focused(app).textContent, "Unpin");
  assert.deepEqual(app.errors, []);
});

// W45's harden pass: a name of only spaces is no name, everywhere it shows.
test("W45: a name of only spaces reads Unnamed in the header, Main's heading and the panel", () => {
  const blank = lockedCharacter(); blank.identity.name = "   ";
  const app = openSheet(blank, "main");
  assert.equal(app.$("#brandctx").textContent, "Unnamed", "the header went blank");
  assert.equal(app.$("#main h1").textContent, "Unnamed", "Main's heading went blank");
  assert.equal(app.$("#vdrawer .vname").textContent, "—", "the panel's name went blank");
  assert.equal(app.window.document.title, "Unnamed — Shadows");
  assert.deepEqual(app.errors, []);
});

const loadoutSec = app => app.$$("[data-sec]").map(b => b.dataset.sec).find(s => /loadout/.test(s));

test("the sheet draws a written-in archetype: its name everywhere, its classification, traits, powers and vulnerabilities", () => {
  const home = boot({ storage: { "shadows.active.v1": { ch: writtenInCharacter(), section: "main" } } });
  assert.match(home.$("#main .roster-card").textContent, /Changeling/, "Home's roster names the archetype's data name");
  const app = openSheet(writtenInCharacter(), "character");
  const main = () => app.$("#main").textContent;
  assert.equal(app.$("#chr-0").textContent, "Changeling", "the Character tab doesn't open on the archetype's name");
  const parts = app.$$("#main .arch-flow > .arch-part").map(p => p.querySelector(".sect").textContent);
  for (const s of ["Baseline Traits", "Powers", "Vulnerabilities"]) assert.ok(parts.includes(s), `${s} isn't in the archetype's flow: ${parts}`);
  assert.match(app.$("#main .arch-class").textContent, /Other: Fae/);
  for (const t of ["Glamour", "Fade", "uses SFR", "Cold iron", "Stolen as a child."]) assert.ok(main().includes(t), `the Archetype tab is missing ${t}`);
  app.click('[data-sec="main"]');
  assert.match(main(), /Changeling ·/, "Main's header still says the archetype's data name");
  app.click('[data-sec="trackers"]');
  assert.ok(app.$$("#main .trk h2").some(h => h.textContent === "SFR"), "Uses SFR didn't put SFR on Trackers");
  assert.ok(!app.$$("#main .trk h2").some(h => h.textContent === "TOL Spent"), "TOL Spent showed without Uses magic");
  app.click(`[data-sec="${loadoutSec(app)}"]`);
  // Decision 154: in play a power reads as written, its notes free to edit.
  assert.deepEqual(app.$$("[data-pwedit]").map(e => e.dataset.pwedit.split("|")[1]), ["notes"], "a power's words are editable in play");
  assert.match(app.$(".pw-card").textContent, /Fade[\s\S]*uses SFR[\s\S]*Unseen/, "the power doesn't read as written");
  assert.equal(app.$$("[data-pwimprove]").length, 1, "a power has no Improve");
  assert.equal(app.$$("[data-pwdel]").length, 0, "Remove is Admin's, not play's");
  // A built-in archetype draws none of it.
  const b = openSheet(lockedCharacter(), "character");
  assert.equal(b.$("#chr-0").textContent, "Arcanist");
  assert.match(b.$("#main .arch-class").textContent, /Mortal/);
  assert.deepEqual([app.errors, b.errors], [[], []]);
});

test("Add power in play costs a new power's price: the row and the spend are one change, and one Undo takes both (Decision 194)", () => {
  const NEW = D.ip.powerIncreaseCost.newPower;
  const short = openSheet(writtenInCharacter(), "main");      // 30 IP
  short.click(`[data-sec="${loadoutSec(short)}"]`);
  assert.ok(!short.$('[data-pwnew="cost"]'), "play still asks for a price the book sets");
  assert.match(short.$(".pw-add").textContent, new RegExp(`a new power costs ${NEW} IP`));
  short.$('[data-pwnew="name"]').value = "Thorn hedge";
  short.click("[data-pwadd-go]");
  assert.equal(activeChar(short).powers.length, 1, "a power was added short of its price");
  assert.equal(short.$('[data-pwnew="name"]').value, "Thorn hedge", "a refusal threw away what was typed");
  assert.match(short.$("#undotoast").textContent, new RegExp(`Not enough IP \\(need ${NEW}\\)`));

  const ch = writtenInCharacter(); ch.progression.ip.earned = NEW + 15;
  const app = openSheet(ch, "main");
  app.click(`[data-sec="${loadoutSec(app)}"]`);
  const fill = (k, v) => { app.$(`[data-pwnew="${k}"]`).value = v; };
  fill("name", "Thorn hedge"); fill("effect", "Briars erupt."); fill("note", "after the raid");
  app.click("[data-pwadd-go]");
  let c = activeChar(app);
  assert.equal(JSON.stringify([c.powers.map(p => p.name), c.progression.ip.log.map(e => [e.targetType, e.amount, e.note])]),
    JSON.stringify([["Fade", "Thorn hedge"], [["power", NEW, "after the raid"]]]));
  assert.equal(Engine.ipState(c).available, 15);
  assert.match(app.$$(".pw-card")[1].textContent, /rank 1/, "a new power doesn't say its rank");
  app.click("[data-toastundo]");
  c = activeChar(app);
  assert.equal(JSON.stringify([c.powers.length, c.progression.ip.log.length]), "[1,0]", "one Undo didn't take back both");

  // A note is one logged change when the field is left.
  const note = app.$('[data-pwedit$="|notes"]');
  note.value = "Twice tonight."; note.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  c = activeChar(app);
  assert.equal(c.powers[0].notes, "Twice tonight.");
  assert.match(c.audit[c.audit.length - 1].label, /Fade: notes/);
  assert.deepEqual(app.errors, []);
});

test("Improve rewrites a power for IP: the cost is required, a refusal keeps the form, and one Undo takes back both (Decision 154)", () => {
  const app = openSheet(writtenInCharacter(), "main");
  app.click(`[data-sec="${loadoutSec(app)}"]`);
  app.click("[data-pwimprove]");
  assert.ok(app.$("#modal[open]"), "Improve didn't open");
  const field = k => app.$(`#modal [data-pwimp="${k}"]`);
  assert.equal(field("name").value, "Fade", "Improve didn't start from the power's words");
  field("effect").value = "Unseen for two rounds.";
  app.click("#modal [data-pwimp-go]");
  assert.ok(app.$("#modal[open]"), "a refusal closed the form");
  assert.match(app.$("#undotoast").textContent, /costs IP/);
  assert.equal(field("effect").value, "Unseen for two rounds.", "a refusal threw away what was typed");
  assert.equal(activeChar(app).powers[0].effect, "Unseen for a round.", "a refused improvement was written");

  field("cost").value = "10";
  app.click("#modal [data-pwimp-go]");
  let c = activeChar(app);
  assert.ok(!app.$("#modal[open]"), "Improve stayed open after it worked");
  assert.equal(JSON.stringify([c.powers[0].effect, c.progression.ip.log.map(e => [e.targetType, e.amount])]),
    JSON.stringify(["Unseen for two rounds.", [["power", 10]]]));
  assert.match(c.audit[c.audit.length - 1].label, /Improved Fade \(10 IP\)/);
  app.click("[data-toastundo]");
  c = activeChar(app);
  assert.equal(JSON.stringify([c.powers[0].effect, c.progression.ip.log.length]), JSON.stringify(["Unseen for a round.", 0]), "one Undo didn't take back both");
  assert.deepEqual(app.errors, []);
});

test("Admin edits a written-in archetype's words and lists, and removes a power behind a question", () => {
  const app = openSheet(writtenInCharacter(), "main");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  app.click("[data-admin-open]");
  const name = app.$('[data-admin-wi="name"]');
  assert.ok(name, "Admin has no written-in archetype block");
  name.value = "Fetch"; name.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  app.click('[data-admin-wiadd="vulnerabilities"]');
  app.click('[data-admin-wirm="traits|0"]');
  let w = activeChar(app).archetypeChoices.writeIn;
  assert.equal(JSON.stringify([w.name, w.traits.length, w.vulnerabilities.length]), JSON.stringify(["Fetch", 0, 2]));

  app.click(`[data-sec="${loadoutSec(app)}"]`);
  // Decision 154: Admin edits a power's words in place, and adds one free.
  assert.equal(app.$$("[data-pwedit]").length, 4, "Admin can't edit a power's words");
  const eff = app.$('[data-pwedit$="|effect"]');
  eff.value = "Unseen for two rounds."; eff.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  let c = activeChar(app);
  assert.equal(c.powers[0].effect, "Unseen for two rounds.");
  assert.match(c.audit[c.audit.length - 1].label, /^Admin: Fade: effect/);
  app.$('[data-pwnew="name"]').value = "Forgotten";
  app.click("[data-pwadd-go]");
  c = activeChar(app);
  assert.equal(JSON.stringify([c.powers.map(p => p.name), c.progression.ip.log.length]), JSON.stringify([["Fade", "Forgotten"], 0]), "Admin's blank cost wasn't free");
  assert.equal(c.audit[c.audit.length - 1].label, "Admin: added power Forgotten");
  app.click("[data-toastundo]");
  app.click("[data-pwdel]");
  assert.ok(app.$("#modal[open]"), "removing a power didn't ask first");
  assert.equal(activeChar(app).powers.length, 1, "it removed before the answer");
  app.$$("#modal[open] button").find(b => /Remove power/.test(b.textContent)).dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.equal(activeChar(app).powers.length, 0);
  assert.deepEqual(app.errors, []);
});

// ── The archetype on paper (Decision 153, custom archetype S5, XQ4) ─────
test("print gives every archetype a page of its own: a written-in one's words, a built-in's data, and lines when blank", () => {
  const app = openSheet(writtenInCharacter(), "main");
  const page = html => { const box = app.doc.createElement("div"); box.innerHTML = html; const p = box.querySelectorAll(".p-page"); return p[p.length - 1]; };
  const rows = (pg, sel) => [...pg.querySelectorAll(sel + " tbody tr")].map(tr => [...tr.cells].map(td => td.textContent.trim()));
  const custom = page(app.window.renderPrintView(activeChar(app)));
  const text = custom.textContent;
  for (const t of ["Changeling", "Other: Fae", "Stolen as a child."]) assert.ok(text.includes(t), `the archetype page is missing ${t}`);
  assert.equal(JSON.stringify(rows(custom, ".p-powertable")), JSON.stringify([["Fade (rank 1)", "SFR", "Unseen for a round."]]), "a written power prints without its rank (Decision 194)");
  assert.ok(text.includes("Glamour") && text.includes("Cold iron"));

  const ww = lockedCharacter();
  ww.identity.archetype = "werewolf"; ww.archetypeChoices.specialization = ["trueborn"];
  const built = page(app.window.renderPrintView(ww)), def = D.archetypes.find(a => a.id === "werewolf");
  assert.ok(built.textContent.includes("Supernatural") && built.textContent.includes("Trueborn"));
  for (const t of def.baselineTraits) assert.ok(built.textContent.includes(t.name), `print is missing the Werewolf's ${t.name}`);

  const blank = page(app.window.renderPrintView(null));
  assert.equal(JSON.stringify([".p-archtable", ".p-powertable"].map(s => blank.querySelectorAll(s + " tbody tr").length)), JSON.stringify([5 + 8 + 4, 8]),
    "the blank page's write-in lines changed");
  assert.ok(blank.querySelector(".p-archfields .p-line"), "the blank page has no Archetype line to write on");
  assert.equal(blank.textContent.includes("Changeling"), false);
  assert.deepEqual(app.errors, []);
});

test("Decision 162: Review's Lock waits until every point that can buy something is spent", () => {
  const half = named("Unspent"); half.creation.locked = false; half.skills = {};
  const app = boot({ storage: { "shadows.draft.v1": { ch: half, step: 7, maxReached: 7 } } });
  card(app, "Unspent").querySelector("[data-open]").click();
  const lock = () => app.$("[data-lock]");
  assert.ok(lock(), "Review didn't render");
  assert.equal(lock().disabled, true, "Lock was open with Skill Points unspent");
  assert.match(app.$("#wiz-issues").textContent, /Skill Points unspent\. Spend them before you lock\./);
  assert.match(app.$(".wiznav-why").textContent, /to fix first/, "the nav doesn't say what's holding the lock");
  assert.deepEqual(app.errors, []);
});

test("Decision 163: a lock prints the TAG once, beside the export, and says where the file went", () => {
  for (const tagless of [false, true]) {
    const half = named(tagless ? "Wren" : "Rook Vance"); half.creation.locked = false; half.identity.tagless = tagless;
    const app = boot({ storage: { "shadows.draft.v1": { ch: half, step: 7, maxReached: 7 } } });
    const got = withDownloads(app);
    card(app, half.identity.name).querySelector("[data-open]").click();
    app.window.eval("S.ch.creation.rolls.credits = 5; update();");
    app.click("[data-lock]");
    assert.equal(got.length, 1, "the export left the lock's click");
    assert.ok(app.$("#main .intake.issued"), "the sheet after a lock didn't print the TAG");
    const file = tagless ? "Wren.shadows.json" : "Rook_Vance.shadows.json";
    const C = app.window.SHADOWS_DATA.appCopy, say = tagless ? C.lockIssuedTagless : C.lockIssued;
    assert.equal(app.$("#undotoast").textContent.replace("×", "").trim(),
      say.replace("{tag}", app.Engine.tagNumber(app.window.eval("S.ch"))).replace("{file}", file));
    assert.equal(app.window.document.activeElement, app.$("#main h1"), "focus wasn't handed to the character");
    app.window.eval("update();");
    assert.equal(app.$("#main .intake.issued"), null, "the TAG printed again on a re-render");
    assert.deepEqual(app.errors, []);
  }
});

// ── W47: a keyboard press keeps its place ────────────────────────────
// Enter on a button is its click, and a browser focuses what the keyboard
// is on, so a "press" here is focus, then click. After the re-render, focus
// is on the pressed control's twin, or, where the press greyed or hid it, on
// something nearby that changes nothing: never <body>, never the neighbour.
const press = (app, sel) => { const el = app.$(sel); assert.ok(el, `no ${sel}`); el.focus(); el.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true })); };
const focused = app => app.window.document.activeElement;

test("W47: Trackers keeps the keyboard on the button pressed, and a chip that greys out hands it to its palette", () => {
  const app = openSheet(lockedCharacter(), "trackers");
  press(app, '#main [data-dmg="1"]'); press(app, '#main [data-dmg="1"]');
  assert.equal(activeChar(app).trackers.damage, 2, "the second Enter did nothing");
  assert.equal(focused(app), app.$('#main [data-dmg="1"]'), "focus didn't stay on Hurt 1");

  app.window.eval("S.condPalette=true; update();");
  press(app, '#main [data-condquick="stunned"]');
  assert.deepEqual(activeChar(app).trackers.conditions.map(c => c.id), ["stunned"]);
  assert.ok(app.$('#main [data-condquick="stunned"]').disabled, "the chip should grey out once it's on");
  assert.equal(focused(app), app.$("#main details.cond-add"), "focus didn't land on the palette");
  assert.ok(!focused(app).matches("button"), "a greyed chip handed Enter to a control");

  // A tap focuses nothing (Safari), and the rule leaves it that way.
  focused(app).blur();
  app.click('#main [data-dmg="1"]');
  assert.equal(focused(app), app.window.document.body, "a tap was handed a focus it never had");
  assert.deepEqual(app.errors, []);
});

test("W47: a twin is matched on every data-* attribute, in the root the focus was in", () => {
  const app = openSheet(lockedCharacter(), "main");
  // Main's stat buttons all start data-tip="stat"; only data-term tells them apart.
  const cool = '#main [data-tip="stat"][data-term="COOL"]';
  assert.ok(app.$(cool), "Main has no COOL stat button");
  app.$(cool).focus(); app.window.eval("update();");
  assert.equal(focused(app), app.$(cool), "focus went to another stat");

  // The vitals keys are in #main and the flyout both, #main first: the
  // flyout's stays in the flyout.
  app.click('[data-sec="trackers"]');
  app.click("#main [data-vitals-toggle]");
  app.$('#vdrawer [data-vpop="hp"]').focus(); app.window.eval("update();");
  assert.equal(focused(app), app.$('#vdrawer [data-vpop="hp"]'), "focus left the flyout for #main");
  assert.deepEqual(app.errors, []);
});

test("W47: Enter on a tab keeps the tab row's place, and Undo in the toast lands on the tab's title", () => {
  const app = openSheet(lockedCharacter(), "main");
  press(app, '#topnav [data-sec="skills"]');
  assert.equal(focused(app), app.$('#topnav [data-sec="skills"]'), "focus fell out of the tab row");

  press(app, '#topnav [data-sec="trackers"]');
  press(app, '#main [data-dmg="1"]');
  press(app, "[data-toastundo]");
  assert.equal(activeChar(app).trackers.damage, 0, "Undo didn't undo");
  assert.equal(focused(app), app.$("#main h1"), "focus fell to <body> with the toast's buttons");
  assert.deepEqual(app.errors, []);
});

test("W47: the popover and the Raise modal keep focus inside them, even when the press greys the button", () => {
  const ch = lockedCharacter();
  ch.trackers.luck.spent = 1;
  ch.progression.ip.earned = 60;
  const app = openSheet(ch, "trackers");
  app.click('#main [data-vpop="luck"]');
  press(app, "#vpop [data-luckregain]");
  assert.ok(app.$("#vpop [data-luckregain]").disabled, "Regain should grey out at full LUCK");
  assert.equal(focused(app), app.$("#vpop-title"), "focus left the popover");

  app.window.eval("closePopover(false);");
  app.click('[data-sec="progression"]');
  app.click('[data-raiseopen="stat"]');
  press(app, '#modal [data-raise="stat|BOD"]');           // 50 of 60 IP: BOD greys out after
  assert.equal(activeChar(app).stats.BOD.ipe, 1);
  assert.ok(app.$('#modal [data-raise="stat|BOD"]').disabled);
  assert.equal(focused(app), app.$('#modal [data-raise="stat|BOD"]').closest("tr"), "focus didn't land on BOD's row");
  assert.ok(app.$("#modal").contains(focused(app)), "focus left the dialog");
  assert.deepEqual(app.errors, []);
});

test("W47: a wizard stepper keeps its place, and one that greys out lands on its row, never the − beside it", () => {
  const app = draftOn("arcanist", "stats");
  press(app, '[data-step="stat|BOD|1"]');
  assert.equal(focused(app), app.$('[data-step="stat|BOD|1"]'), "focus didn't stay on BOD's +");

  const ch = draft(app);
  Object.assign(ch.stats, { BOD: { base: 6, ipe: 0 }, REF: { base: 10, ipe: 0 }, MOB: { base: 10, ipe: 0 }, INT: { base: 8, ipe: 0 },
    TECH: { base: 2, ipe: 0 }, COOL: { base: 2, ipe: 0 }, MAG: { base: 2, ipe: 0 }, EMP: { base: 2, ipe: 0 } });
  const steps = D.creationFlow.steps.map(s => s.id);
  const again = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("stats"), maxReached: steps.length - 1 } } });
  again.$$("#main button").find(b => /Resume draft/.test(b.textContent)).click();
  press(again, '[data-step="stat|TECH|1"]');                // the last point
  assert.ok(again.$('[data-step="stat|TECH|1"]').disabled, "TECH's + should grey out with the pool spent");
  const row = again.$('[data-step="stat|TECH|1"]').closest(".alloc-row");
  assert.ok(row.contains(focused(again)), "focus left TECH's row");
  assert.ok(!focused(again).matches("button"), "a greyed + handed Enter to a control");
  assert.deepEqual(again.errors, []);
});

test("W47: a press that hides the flyout hands focus to what opens it", () => {
  const app = openSheet(lockedCharacter(), "trackers");
  app.click("#main [data-vitals-toggle]");
  press(app, "#vdrawer [data-vitals-pin]");
  assert.equal(app.$("#vdrawer").getAttribute("aria-hidden"), "true", "too narrow to pin, the flyout should close");
  assert.equal(focused(app), app.$("#main [data-vitals-toggle]"), "focus stayed in a hidden flyout");
  assert.deepEqual(app.errors, []);
});

// ── W60: small accessibility and copy fixes from the critique re-run ──
// A heading inside a <button> isn't read as one, so it's left out.
const outline = root => [...root.querySelectorAll("h1,h2,h3,h4,h5,h6")]
  .filter(h => !h.closest("button")).map(h => Number(h.tagName[1]));
function assertNoSkips(levels, where) {
  assert.equal(levels[0], 1, `${where} doesn't open on its h1`);
  levels.forEach((l, i) => { if (i) assert.ok(l <= levels[i - 1] + 1, `${where} jumps h${levels[i - 1]} → h${l}`); });
}

test("W60: every wizard step's headings go down one level at a time, its sentence ends as one, and no card reads pressed=null", () => {
  const writeIn = D.archetypes.find(a => a.writeIn).id;
  const app = draftOn(writeIn, "power-level");
  const steps = app.window.eval("STEPS.length");
  for (let i = 0; i < steps; i++) {
    app.window.eval(`S.step=${i}; update();`);
    const id = app.window.eval("STEPS[S.step].id");
    assertNoSkips(outline(app.$("#main")), `step ${id}`);
    const note = app.$(".step-note").textContent, label = app.window.eval("STEPS[S.step].label");
    assert.match(note.slice(0, label.length + 1).trimEnd(), /[.?!…]$/, `step ${id}'s sentence runs into its note`);
    assert.doesNotMatch(note, / - /, `step ${id} uses " - " for a dash`);
    assert.doesNotMatch(note, /\b[a-z]+[A-Z]\w*\b/, `step ${id} shows a field name to the player`);
    for (const b of app.$$("#main [aria-pressed]"))
      assert.match(b.getAttribute("aria-pressed"), /^(true|false)$/, `step ${id}: ${b.outerHTML.slice(0, 60)}`);
  }
  // The picked card says so; the others say they aren't.
  app.window.eval(`S.step=STEPS.findIndex(s=>s.id==="power-level"); update();`);
  assert.deepEqual(app.$$("[data-pl]").filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.dataset.pl), [D.powerLevels[0].id]);
  app.window.eval(`S.step=STEPS.findIndex(s=>s.id==="archetype"); update();`);
  assert.deepEqual(app.$$("[data-arch]").filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.dataset.arch), [writeIn]);
  assert.ok(app.$$("[data-wicls]").length && app.$$("[data-wicls]").every(b => b.getAttribute("aria-pressed") === "false"),
    "with no classification picked, every card should read not pressed");
  assert.deepEqual(app.errors, []);
});

test("W60: every sheet tab's headings go down one level at a time", () => {
  const app = openSheet(writtenInCharacter(), "main");
  for (const sec of ["main", "skills", "character", "trackers", "progression", "sessions", "loadout", "notes"]) {
    app.click(`[data-sec="${sec}"]`);
    assertNoSkips(outline(app.$("#main")), `the ${sec} tab`);
  }
  assert.deepEqual(app.errors, []);
});

test("W60: the window's title names the character on the sheet, and lets go of it at Home", () => {
  const doc = () => app.window.document;
  const app = openSheet(lockedCharacter(), "main");
  assert.equal(doc().title, "Test Subject — Shadows");
  app.click("[data-home]");
  assert.equal(doc().title, "Shadows — Character Intake", "Home kept the last character's name");
  const blank = lockedCharacter(); blank.identity.name = "   ";
  const unnamed = openSheet(blank, "main");
  assert.equal(unnamed.window.document.title, "Unnamed — Shadows");
  assert.deepEqual(app.errors, []);
});

test("W60: placeholders take a token colour at full strength, so the contrast guard checks them", () => {
  const rule = /::placeholder\{([^}]*)\}/.exec(wizCss());
  assert.ok(rule, "no ::placeholder rule: the browser's grey is 3.8:1 on the ground");
  assert.match(rule[1], /color\s*:\s*var\(--[\w-]+\)/, "a placeholder colour that isn't a token escapes the contrast guard");
  assert.match(rule[1], /opacity\s*:\s*1\b/, "Firefox fades placeholders unless opacity is 1");
});

// ── CRANK rep (Decision 169) ──────────────────────────────────────────
test("CRANK: Main's card reads 0 and Novice; the popover's Job done makes it 1, writes a ledger line, and Undo makes it 0", () => {
  const app = openSheet(lockedCharacter(), "main");
  const card = () => app.$('#main [data-vpop="crank"]');
  assert.ok(card(), "Main has no CRANK card");
  assert.match(card().textContent, /CRANK/);
  assert.match(card().textContent, /0.*Novice/);
  app.click('[data-vpop="crank"]');
  assert.match(app.$("#vpop").textContent, /0 · Novice/);
  assert.match(app.$("#vpop").textContent, /5 to Competent/);
  app.$("#vpop [data-crknote]").value = "the Kessel job";
  app.click("#vpop [data-crk=\"1\"]");
  assert.equal(activeChar(app).trackers.crank.rep, 1);
  assert.match(app.$("#vpop").textContent, /1 · Novice/);
  assert.match(app.$("#undotoast").textContent, /CRANK rep \+1 \(the Kessel job\)/);
  app.click('[data-sec="trackers"]');
  assert.match(app.$("#main").textContent, /Kessel job/, "the ledger line isn't on Trackers");
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).trackers.crank.rep, 0, "Undo didn't take the job back");
  assert.deepEqual(app.errors, []);
});

test("CRANK: Walked out at 0 shows -2 and Novice, and the tip carries the unsettled note", () => {
  const app = openSheet(lockedCharacter(), "trackers");
  app.click('#main [data-crk="-2"]');
  assert.equal(activeChar(app).trackers.crank.rep, -2);
  assert.match(app.$("#main").textContent, /-2/);
  assert.match(app.$("#main").textContent, /Novice/);
  clickIn(app, app.$('#main [data-tip="crank"]'));
  const shown = tipShown(app);
  assert.match(shown, /gray market/);
  for (const t of D.resources.crank.tiers) assert.ok(shown.includes(t.name) && shown.includes(Engine.crankPayText(t)), `the tip lacks ${t.name}`);
  assert.ok(shown.includes(D.resources.crank.playerNote), "the unsettled note is missing below zero");
  app.click('#main [data-crk="1"]'); app.click('#main [data-crk="1"]'); app.click('#main [data-crk="1"]');
  clickIn(app, app.$('#main [data-tip="crank"]'));
  assert.ok(!tipShown(app).includes(D.resources.crank.playerNote), "the note shows while rep is not below zero");
  assert.deepEqual(app.errors, []);
});

test("CRANK: the print view has the field, blank and filled", () => {
  const ch = lockedCharacter();
  ch.trackers.crank.rep = 7;
  const app = openSheet(ch, "main");
  const filled = app.window.renderPrintView(ch);
  assert.match(filled, /CRANK<\/span>.*7 · Competent/s);
  const blank = app.window.renderPrintView(null);
  assert.match(blank, /CRANK/);
  assert.doesNotMatch(blank, /Novice/);
});

test("CRANK: Admin corrects rep through the ledger, and Undo takes a correction back", () => {
  const app = openSheet(lockedCharacter(), "main");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  app.click('[data-admin-crank="1"]');
  assert.equal(activeChar(app).trackers.crank.rep, 1);
  app.click('[data-admin-crank="-1"]');
  assert.equal(activeChar(app).trackers.crank.rep, 0);
  const led = [...activeChar(app).trackers.crank.ledger];
  assert.deepEqual([led.map(e => e.amount), led.map(e => e.note)], [[1, -1], ["Admin correction", "Admin correction"]]);
  app.click('[data-sec="sessions"]');
  app.click("button[data-undolast]");
  assert.equal(activeChar(app).trackers.crank.rep, 1, "Undo didn't take the last correction back");
  assert.deepEqual(app.errors, []);
});

test("CRANK: Main's card label opens the popover, and the tip lives on the tier name inside it", () => {
  const app = openSheet(lockedCharacter(), "main");
  const card = app.$('#main [data-vpop="crank"]');
  assert.ok(!card.querySelector("[data-tip]"), "a tip trigger inside the card's button swallows the tap");
  clickIn(app, card.querySelector(".lab"));
  assert.ok(!app.$("#vpop").hidden, "tapping the label didn't open the popover");
  assert.match(app.$("#vpop").textContent, /CRANK rep/);
  clickIn(app, app.$('#vpop [data-tip="crank"]'));
  assert.match(tipShown(app), /gray market/, "the tier name didn't open the tip");
  assert.deepEqual(app.errors, []);
});

// ── Tables and the feature switch (Decisions 171, 173) ──────────────────
const GM_ON = { "shadows.feature.gm": "on" };
const tableKeys = app => {
  const ls = app.window.localStorage, out = [];
  for (let i = 0; i < ls.length; i++) if (ls.key(i).startsWith("shadows.table.v1.")) out.push(ls.key(i));
  return out;
};
const tableEntryOf = (app, id) => JSON.parse(app.window.localStorage.getItem("shadows.table.v1." + id));
const tableCard = (app, name) => app.$$("#main .tables .roster-card").find(c => c.querySelector(".roster-name").textContent === name);
const seedTable = (name, extra = {}) => {
  const t = Engine.newTable(name);
  Object.assign(t.meta, extra);
  return [t, { ["shadows.table.v1." + t.meta.id]: { table: t, section: "notes", changed: "2026-10-05T10:00:00.000Z", exported: null } }];
};
const type = (app, sel, value) => {
  const el = app.$(sel);
  el.value = value;
  el.dispatchEvent(new app.window.Event("input", { bubbles: true }));
};
// A new table opens on Sessions (Decision 204). Most tests are about the Cast and
// below, so this goes on to Cast; `stay` keeps the table where it opened.
const runTable = (app, name, { stay = false } = {}) => {
  app.click("#btn-run-table");
  app.$("#tbl-name").value = name;
  app.click("#modal [data-nameyes]");
  if (!stay) app.click('[data-tsec="cast"]');
};
const notesTab = app => app.click('[data-tsec="notes"]');
const tableHome = app => { app.click("[data-menu-toggle]"); app.click("[data-thome]"); };
const tableFile = async blob => JSON.parse(await blob.text());

test("Decision 173: switched off, Home is today's, even with a table saved, and a table file is refused", async () => {
  const [t, storage] = seedTable("Tuesday");
  const app = boot({ storage });
  assert.equal(app.$("#btn-run-table"), null, "Run a table shows with the switch off");
  assert.equal(app.$("#main .tables"), null, "Your tables shows with the switch off");
  assert.equal(app.$("#btn-import").textContent, "Import .shadows.json");
  assert.doesNotMatch(app.$("#main").textContent, /Running the game/);
  await importFile(app, t);
  assert.match(app.$("#undotoast").textContent, /That file isn't a character\./);
  assert.equal(charKeys(app).length, 0, "a table file became a character");
  assert.equal(tableKeys(app).length, 1, "a table was written with the switch off");
  assert.equal(app.window.eval("S.screen"), "home");
  await importFile(app, { meta: { kind: "shadows-pack" } });
  assert.equal(charKeys(app).length, 0);
  assert.deepEqual(app.errors, []);
});

test("Decision 173: ?gm=on turns the switch on and keeps it, ?gm=off turns it off, anything else changes nothing", () => {
  const app = boot();
  const w = app.window;
  assert.equal(w.eval('featureOn("gm")'), false);
  for (const q of ["?gm=yes", "?other=on", "", "?gm="]) { w.eval(`applyFeatureQuery(${JSON.stringify(q)})`); assert.equal(w.eval('featureOn("gm")'), false, q); }
  w.eval('applyFeatureQuery("?gm=on")');
  assert.equal(w.localStorage.getItem("shadows.feature.gm"), "on");
  assert.equal(w.eval('featureOn("gm")'), true);
  for (const q of ["?gm=yes", "?other=off", ""]) { w.eval(`applyFeatureQuery(${JSON.stringify(q)})`); assert.equal(w.eval('featureOn("gm")'), true, q); }
  assert.equal(w.eval('featureOn("nope")'), false);
  w.eval('applyFeatureQuery("?gm=off")');
  assert.equal(w.localStorage.getItem("shadows.feature.gm"), null);
  assert.equal(w.eval('featureOn("gm")'), false);
  assert.deepEqual(app.errors, []);
});

test("Decision 171: switched on, Home has the door, and no list until a table exists", () => {
  const app = boot({ storage: GM_ON });
  assert.ok(app.$("#btn-run-table"));
  assert.match(app.$("#main").textContent, /Running the game\? *Run a table/);
  assert.equal(app.$("#main .tables"), null);
  assert.equal(app.$("#btn-import").textContent, "Import a file");
  assert.deepEqual(app.errors, []);
});

test("Decision 171: Run a table asks for a name, opens the table, and Home lists it as not exported", () => {
  const app = boot({ storage: GM_ON });
  withDownloads(app);
  runTable(app, "Tuesday nights", { stay: true });
  assert.equal(app.window.eval("S.screen"), "table");
  assert.equal(app.$("#brandctx").textContent, "Tuesday nights");
  assert.equal(app.$("h1.step-title").textContent, "Tuesday nights");
  assert.equal(app.$("#modal[open]"), null);
  assert.equal(charKeys(app).length, 0, "a table wrote a character");
  assert.equal(tableKeys(app).length, 1);
  assert.deepEqual(app.$$("#topnav .tab").map(b => b.textContent.trim()), ["Sessions", "Cast", "Threats", "Encounters", "Reference", "Notes"]);
  assert.equal(app.$("#topnav [data-sec]"), null, "the table's tabs are the sheet's");
  assert.deepEqual(app.$$("#hdrmenu button").map(b => b.textContent), ["Rename", "Export .shadows-table.json", "What's new", "Home"]);
  tableHome(app);
  assert.equal(app.window.eval("S.screen"), "home");
  assert.ok(tableCard(app, "Tuesday nights"));
  assert.match(tableCard(app, "Tuesday nights").textContent, /Table · 0 notes/);
  assert.match(tableCard(app, "Tuesday nights").textContent, /Changes not exported yet/);
  assert.deepEqual(app.errors, []);
});

test("Decision 171: Enter in the name field creates; Cancel leaves Home as it was", () => {
  const app = boot({ storage: GM_ON });
  app.click("#btn-run-table");
  app.click("#modal [data-modalclose]");
  assert.equal(tableKeys(app).length, 0);
  app.click("#btn-run-table");
  app.$("#tbl-name").value = "Enter table";
  app.$("#tbl-name").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  assert.equal(app.window.eval("S.screen"), "table");
  assert.equal(app.$("#brandctx").textContent, "Enter table");
  assert.deepEqual(app.errors, []);
});

test("Decision 171: notes save as they're typed and survive a reload; Delete asks, and focus lands on the next control", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Notes table");
  notesTab(app);
  assert.match(app.$("#main").textContent, /Nothing on file yet. What you write here stays with the table/);
  app.click("[data-tnew]");
  assert.equal(app.doc.activeElement && app.doc.activeElement.hasAttribute("data-ntitle"), true, "New note didn't focus its title");
  const id = app.doc.activeElement.dataset.ntitle;
  type(app, `[data-ntitle="${id}"]`, "The fixer");
  type(app, `[data-ntext="${id}"]`, "Owes us a favour.");
  assert.equal(app.doc.activeElement.dataset.ntitle, id, "typing redrew the page and dropped focus");
  // Straight to Home with no change event: nothing typed is lost.
  tableHome(app);
  const tid = tableKeys(app)[0].slice("shadows.table.v1.".length);
  const again = boot({ storage: { ["shadows.table.v1." + tid]: tableEntryOf(app, tid), ...GM_ON } });
  tableCard(again, "Notes table").querySelector("[data-topen]").click();
  notesTab(again);
  assert.equal(again.$(`[data-ntitle="${id}"]`).value, "The fixer");
  assert.equal(again.$(`[data-ntext="${id}"]`).value, "Owes us a favour.");
  // two more notes, then Delete the middle one
  again.click("[data-tnew]"); again.click("[data-tnew]");
  const ids = again.$$("[data-note]").map(n => n.dataset.note);
  assert.equal(ids.length, 3);
  again.click(`[data-ndel="${ids[1]}"]`);
  assert.ok(again.$("#modal[open]"), "Delete didn't ask");
  again.click("#modal [data-modalclose]");
  assert.equal(again.$$("[data-note]").length, 3, "Cancel deleted the note");
  again.click(`[data-ndel="${ids[1]}"]`);
  again.click("#modal [data-askyes]");
  assert.deepEqual(again.$$("[data-note]").map(n => n.dataset.note), [ids[0], ids[2]]);
  assert.equal(again.doc.activeElement.dataset.ntitle, ids[2], "after Delete focus isn't on the next note");
  again.click(`[data-ndel="${ids[2]}"]`); again.click("#modal [data-askyes]");
  again.click(`[data-ndel="${ids[0]}"]`); again.click("#modal [data-askyes]");
  assert.ok(again.doc.activeElement.hasAttribute("data-tnew"), "with no notes left focus isn't on New note");
  assert.deepEqual([...app.errors, ...again.errors], []);
});

test("Decision 171: Rename changes the header, the window's title and Home's card at once", () => {
  const [t, storage] = seedTable("Old name");
  const app = boot({ storage: { ...storage, ...GM_ON } });
  tableCard(app, "Old name").querySelector("[data-topen]").click();
  app.click("[data-menu-toggle]"); app.click("[data-trename]");
  assert.equal(app.$("#tbl-name").value, "Old name");
  app.$("#tbl-name").value = "New name";
  app.click("#modal [data-nameyes]");
  assert.equal(app.$("#brandctx").textContent, "New name");
  assert.equal(app.$("h1.step-title").textContent, "New name");
  assert.equal(app.doc.title, "New name — Shadows");
  tableHome(app);
  assert.ok(tableCard(app, "New name"));
  assert.equal(tableCard(app, "Old name"), undefined);
  assert.equal(tableEntryOf(app, t.meta.id).table.meta.name, "New name");
  assert.deepEqual(app.errors, []);
});

test("Decision 171: Export downloads a .shadows-table.json that reads as a table, and clears Home's marker", async () => {
  const app = boot({ storage: GM_ON });
  const downloads = withDownloads(app);
  runTable(app, "Export me");
  const names = [];
  app.window.HTMLAnchorElement.prototype.click = function () { names.push(this.download); };
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  assert.equal(downloads.length, 1);
  assert.match(names[0], /^Export_me\.shadows-table\.json$/);
  assert.equal(app.window.eval("Engine.fileKind(" + JSON.stringify(await tableFile(downloads[0])) + ")"), "table");
  tableHome(app);
  assert.doesNotMatch(tableCard(app, "Export me").textContent, /not exported/);
  assert.deepEqual(app.errors, []);
});

test("Decision 171: importing a file opens a table, a character its sheet, and a pack nothing; neither kind becomes the other", async () => {
  const app = boot({ storage: GM_ON });
  withDownloads(app);
  const t = Engine.newTable("Imported"); Engine.addTableNote(t, { title: "Hello", text: "there" });
  await importFile(app, t);
  assert.equal(app.window.eval("S.screen"), "table");
  notesTab(app);
  assert.equal(app.$("[data-ntitle]").value, "Hello");
  assert.equal(charKeys(app).length, 0, "a table file wrote a character");
  tableHome(app);
  assert.doesNotMatch(tableCard(app, "Imported").textContent, /not exported/, "a table just opened from its file says it isn't exported");
  await importFile(app, Engine.migrate(named("Vex Morrow")));
  assert.equal(app.window.eval("S.screen"), "sheet");
  assert.equal(charKeys(app).length, 1);
  assert.equal(tableKeys(app).length, 1, "a character file wrote a table");
  sheetHome(app);
  await importFile(app, { meta: { kind: "shadows-other" } });
  assert.match(app.$("#undotoast").textContent, /isn't a character, a table or a pack/);
  assert.equal(charKeys(app).length, 1); assert.equal(tableKeys(app).length, 1);
  const newer = JSON.parse(JSON.stringify(t));
  newer.meta.tableSchemaVersion = "9.0";
  await importFile(app, newer);
  assert.match(app.$("#undotoast").textContent, /newer version of the app/);
  assert.deepEqual(app.errors, []);
});

test("Decision 171: an older copy of a saved table asks; a newer one replaces silently", async () => {
  const [t] = seedTable("Saved", { updated: "2026-10-05T12:00:00.000Z" });
  t.notes.push({ id: "N-AAAAAAAA", title: "saved", text: "", created: null, updated: null });
  const app = boot({ storage: { ["shadows.table.v1." + t.meta.id]: { table: t, section: "notes", changed: "2026-10-05T12:00:00.000Z", exported: null }, ...GM_ON } });
  const downloads = withDownloads(app);
  const older = JSON.parse(JSON.stringify(t)); older.meta.updated = "2026-10-04T09:00:00.000Z"; older.notes[0].title = "older";
  await importFile(app, older);
  assert.ok(app.$("#modal[open]"), "an older copy replaced the saved table without asking");
  assert.match(app.$("#modal").textContent, /older copy of Saved/);
  app.click("#modal [data-modalclose]");
  assert.equal(tableEntryOf(app, t.meta.id).table.notes[0].title, "saved", "Cancel replaced it");
  await importFile(app, older);
  app.click("#modal [data-replaceexport]");
  assert.equal(downloads.length, 1);
  assert.equal((await tableFile(downloads[0])).notes[0].title, "saved", "Export first downloaded the wrong copy");
  assert.equal(tableEntryOf(app, t.meta.id).table.notes[0].title, "older", "the older copy didn't open");
  tableHome(app);
  const newer = JSON.parse(JSON.stringify(t)); newer.meta.updated = "2026-10-06T09:00:00.000Z"; newer.notes[0].title = "newer";
  await importFile(app, newer);
  assert.equal(app.$("#modal[open]"), null, "a newer copy asked");
  assert.equal(tableEntryOf(app, t.meta.id).table.notes[0].title, "newer");
  assert.deepEqual(app.errors, []);
});

test("Decision 171: Remove asks, and Export, then remove downloads the table before it goes", async () => {
  const [t, storage] = seedTable("Doomed");
  const app = boot({ storage: { ...storage, ...GM_ON } });
  const downloads = withDownloads(app);
  tableCard(app, "Doomed").querySelector("[data-tremove]").click();
  assert.ok(app.$("#modal[open]"));
  assert.match(app.$("#modal").textContent, /only copy/);
  app.click("#modal [data-modalclose]");
  assert.ok(tableCard(app, "Doomed"), "Cancel removed it");
  tableCard(app, "Doomed").querySelector("[data-tremove]").click();
  app.click("#modal [data-removeexport]");
  assert.equal(downloads.length, 1);
  assert.equal((await tableFile(downloads[0])).meta.name, "Doomed");
  assert.equal(tableCard(app, "Doomed"), undefined);
  assert.equal(app.window.localStorage.getItem("shadows.table.v1." + t.meta.id), null);
  assert.deepEqual(app.errors, []);
});

test("Decision 171: a character and a table in one browser each show only their own list", () => {
  const vex = Engine.migrate(named("Vex Morrow"));
  const [, storage] = seedTable("Tuesday");
  const app = boot({ storage: { ...storage, ...GM_ON, ["shadows.char.v1." + vex.meta.id]: { ch: vex, section: "main", changed: "2026-10-05T10:00:00.000Z", exported: null } } });
  assert.deepEqual(app.$$("#main .roster:not(.tables) .roster-name").map(n => n.textContent), ["Vex Morrow"]);
  assert.deepEqual(app.$$("#main .tables .roster-name").map(n => n.textContent), ["Tuesday"]);
  assert.deepEqual(app.errors, []);
});

test("Decision 171: a tap on a table card opens it, and its buttons only do their own thing", () => {
  const [, storage] = seedTable("Tuesday");
  const app = boot({ storage: { ...storage, ...GM_ON } });
  withDownloads(app);
  tableCard(app, "Tuesday").querySelector("[data-texport]").click();
  assert.equal(app.window.eval("S.screen"), "home", "Export opened the table");
  tableCard(app, "Tuesday").querySelector(".roster-meta").click();
  assert.equal(app.window.eval("S.screen"), "table");
});

test("Decision 173: with the switch off, a table can't be opened onto the screen", () => {
  const app = boot();
  app.window.eval('S = { screen:"table", ch:null, table:Engine.newTable("x"), tsection:"notes" }; renderMain();');
  assert.equal(app.window.eval("S.screen"), "home");
  assert.deepEqual(app.errors, []);
});

test("Decision 164: Create lands focus on quick-add's name and Rename's Save on the header's menu, never <body>", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Focus table", { stay: true });
  assert.ok(app.doc.activeElement.hasAttribute("data-snew"), "after Create focus isn't on New session");
  app.click("[data-menu-toggle]"); app.click("[data-trename]");
  app.$("#tbl-name").value = "Renamed";
  app.click("#modal [data-nameyes]");
  assert.notEqual(app.doc.activeElement, app.doc.body, "after Rename focus fell to <body>");
  assert.ok(app.doc.activeElement.hasAttribute("data-menu-toggle"), "after Rename focus isn't on the header's menu");
  assert.deepEqual(app.errors, []);
});

test("a long table name wraps: the title carries overflow-wrap, as the roster's name does", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "A".repeat(40));
  const css = wizCss();
  assert.ok(app.$("h1.step-title").classList.contains("tbl-title"));
  assert.match(css, /.tbl-title{[^}]*overflow-wrap:anywhere/);
});

// ── The cast (Decisions 174–176) ────────────────────────────────────────
// A synthetic NPC only: Dez, a courier. Nothing here is the Codex's.
const keyIn = (app, sel, k) => app.$(sel).dispatchEvent(new app.window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const castAdd = (app, name, line = "") => {
  type(app, "[data-cadd-name]", name); type(app, "[data-cadd-line]", line);
  keyIn(app, "[data-cadd-name]", "Enter");
};
const castNames = app => app.$$("[data-copen]").map(b => b.textContent);
const focusedKey = app => { const a = app.doc.activeElement; return a && [...a.attributes].map(x => x.name + "=" + x.value).filter(x => x.startsWith("data-")).join(" "); };
const pick = (app, sel, value) => { const el = app.$(sel); el.value = value; el.dispatchEvent(new app.window.Event("change", { bubbles: true })); };

test("Decision 176: the Cast tab has quick-add and the filters, with Notes beside it, and Notes still works", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Cast table");
  assert.equal(app.window.eval("S.tsection"), "cast");
  assert.deepEqual(app.$$("#topnav .tab").map(b => b.textContent.trim()), ["Sessions", "Cast", "Threats", "Encounters", "Reference", "Notes"]);
  assert.ok(app.$("[data-cadd-name]") && app.$("[data-csearch]"));
  assert.match(app.$("#main").textContent, /Nobody yet\. The city fills up fast\./);
  notesTab(app);
  assert.ok(app.$("[data-tnew]"));
  app.click("[data-tnew]");
  assert.ok(app.$("[data-ntitle]"));
  app.click('[data-tsec="cast"]');
  assert.ok(app.$("[data-cadd-name]"));
  assert.deepEqual(app.errors, []);
});

test("Decision 176: quick-add takes a name on Enter, keeps the keyboard in an empty field, five in a row, and an empty name adds nothing", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Quick");
  castAdd(app, "   ");
  assert.equal(castNames(app).length, 0, "an empty name added someone");
  castAdd(app, "Bex");
  assert.deepEqual(castNames(app), ["Bex"]);
  assert.ok(app.doc.activeElement.hasAttribute("data-cadd-name"), "focus isn't in the name field");
  assert.equal(app.doc.activeElement.value, "");
  assert.equal(app.$("[data-cadd-line]").value, "");
  castAdd(app, "Dez", "runs the café");
  for (const n of ["Moth", "Orla", "Wren"]) castAdd(app, n);
  assert.deepEqual(castNames(app), ["Wren", "Orla", "Moth", "Dez", "Bex"], "newest first");
  assert.match(app.$$("[data-ccard]")[3].textContent, /runs the café/);
  assert.ok(app.doc.activeElement.hasAttribute("data-cadd-name"));
  type(app, "[data-cadd-name]", "Press Add"); app.click("[data-cadd]");
  assert.equal(castNames(app)[0], "Press Add");
  assert.ok(app.doc.activeElement.hasAttribute("data-cadd-name"), "Add left focus elsewhere");
  assert.equal(app.window.eval("S.table.cast[0].flavor"), "");
  assert.deepEqual(app.errors, []);
});

test("Decision 175: BOD 6 shows Health as it's typed without the field being redrawn; TOL shows its formula", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Block");
  castAdd(app, "Dez");
  app.click("[data-copen]");
  assert.ok(app.$("[data-chealth-row]").hidden, "Health shows with BOD blank");
  const bod = app.$('[data-cstat="BOD"]'); bod.focus();
  type(app, '[data-cstat="BOD"]', "6");
  assert.equal(app.$('[data-cstat="BOD"]'), bod, "typing redrew the field");
  assert.equal(app.doc.activeElement, bod);
  assert.equal(app.$("[data-chealth-row]").hidden, false);
  assert.match(app.$("[data-chealth]").textContent, /^30 \(6 Health Levels\)$/);
  const m = Engine.statMod(6);
  assert.equal(app.$('[data-cbonus="BOD"]').textContent, m === 0 ? "0" : m > 0 ? "+" + m : "−" + -m);
  assert.equal(app.$('[data-cformula="TOL"]').textContent, "", "a formula shows with an input blank");
  type(app, '[data-cstat="INT"]', "5");
  assert.equal(app.$('[data-cformula="TOL"]').textContent, "", "a formula shows with COOL blank");
  type(app, '[data-cstat="COOL"]', "5");
  const want = Engine.npc({ stats: { BOD: 6, INT: 5, COOL: 5 } }).authored.TOL.formula;
  type(app, '[data-cauth="TOL"]', "1");
  assert.equal(app.$('[data-cformula="TOL"]').textContent, `formula ${want}`);
  assert.equal(app.window.eval("S.table.cast[0].block.authored.TOL"), 1);
  assert.deepEqual(app.errors, []);
});

test("Decision 176: a field typed in, then Home at once, is there when the table reopens", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Home now");
  castAdd(app, "Dez");
  app.click("[data-copen]");
  const id = app.window.eval("S.castOpen");
  type(app, '[data-cf="motivation"]', "Out of the city.");
  type(app, '[data-cf="npcRoles"]', "Fixer / Courier, Snitch");
  type(app, '[data-cf="tier"]', "3");
  type(app, '[data-cstat="REF"]', "7");
  app.click("[data-cskadd]"); type(app, '[data-cskname="0"]', "Streetwise"); type(app, '[data-csktotal="0"]', "6");
  tableHome(app);
  const tid = tableKeys(app)[0].slice("shadows.table.v1.".length);
  const again = boot({ storage: { ["shadows.table.v1." + tid]: tableEntryOf(app, tid), ...GM_ON } });
  tableCard(again, "Home now").querySelector("[data-topen]").click();
  again.click(`[data-copen="${id}"]`);
  assert.equal(again.$('[data-cf="motivation"]').value, "Out of the city.");
  assert.equal(again.$('[data-cf="npcRoles"]').value, "Fixer / Courier / Snitch");
  assert.equal(again.$('[data-cf="tier"]').value, "3");
  assert.equal(again.$('[data-cstat="REF"]').value, "7");
  assert.equal(again.$('[data-cskname="0"]').value, "Streetwise");
  assert.equal(again.$('[data-csktotal="0"]').value, "6");
  assert.deepEqual([...app.errors, ...again.errors], []);
});

test("Decision 176: the list filters as you type, by status, and Clear the filter brings everyone back and focuses search", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Filters");
  for (const n of ["Dez", "Moth", "Orla"]) castAdd(app, n);
  const ids = Object.fromEntries(app.$$("[data-copen]").map(b => [b.textContent, b.dataset.copen]));
  app.click(`[data-copen="${ids.Moth}"]`);
  pick(app, '[data-cf="status"]', "dead");
  assert.equal(app.window.eval("S.table.cast.find(n=>n.name==='Moth').status"), "dead");
  app.click("[data-cback]");
  assert.deepEqual(castNames(app), ["Orla", "Dez"], "the default filter shows the dead");
  const search = app.$("[data-csearch]"); search.focus();
  type(app, "[data-csearch]", "OR");
  assert.deepEqual(castNames(app), ["Orla"]);
  assert.equal(app.$("[data-csearch]"), search, "typing redrew the search field");
  assert.equal(app.doc.activeElement, search);
  type(app, "[data-csearch]", "zzz");
  assert.match(app.$("[data-castlist]").textContent, /No one matches\./);
  app.click("[data-cclear]");
  assert.equal(app.doc.activeElement, app.$("[data-csearch]"), "Clear the filter left focus elsewhere");
  assert.deepEqual(castNames(app).sort(), ["Dez", "Moth", "Orla"]);
  pick(app, "[data-cstatus]", "dead");
  assert.deepEqual(castNames(app), ["Moth"]);
  assert.match(app.$("[data-ccard]").textContent, /Dead/);
  assert.deepEqual(app.$$("[data-cstatus] option").map(o => o.textContent), ["In play", "Alive", "All", "Dead", "Missing", "Out of the picture"]);
  assert.deepEqual(app.errors, []);
});

test("Decision 176: a new member the filters would hide is shown anyway", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Hidden");
  castAdd(app, "Dez");
  type(app, "[data-csearch]", "zzz");
  castAdd(app, "Bex");
  assert.equal(castNames(app)[0], "Bex");
  assert.equal(app.$("[data-csearch]").value, "");
});

test("Decision 176: Delete asks, Cancel keeps, Delete removes and focus lands on the next card or quick-add", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Delete");
  for (const n of ["Dez", "Moth", "Orla"]) castAdd(app, n);   // Orla, Moth, Dez
  const ids = Object.fromEntries(app.$$("[data-copen]").map(b => [b.textContent, b.dataset.copen]));
  app.click(`[data-copen="${ids.Moth}"]`);
  app.click("[data-cdel]");
  assert.ok(app.$("#modal[open]"), "Delete didn't ask");
  assert.match(app.$("#modal").textContent, /Delete Moth\?/);
  assert.match(app.$("#modal").textContent, /Their page goes with them. What they had to do with the crew stays, under their name./);
  app.click("#modal [data-modalclose]");
  assert.equal(app.window.eval("S.table.cast.length"), 3, "Cancel deleted");
  app.click("[data-cdel]"); app.click("#modal [data-askyes]");
  assert.deepEqual(castNames(app), ["Orla", "Dez"]);
  assert.equal(app.doc.activeElement.dataset.copen, ids.Dez, "focus isn't on the next card");
  app.click(`[data-copen="${ids.Dez}"]`); app.click("[data-cdel]"); app.click("#modal [data-askyes]");
  assert.equal(app.doc.activeElement.dataset.copen, undefined);
  assert.ok(app.$("[data-copen]"), "Orla should remain");
  app.click("[data-copen]"); app.click("[data-cdel]"); app.click("#modal [data-askyes]");
  assert.ok(app.doc.activeElement.hasAttribute("data-cadd-name"), "with no next card, focus isn't on quick-add");
  assert.deepEqual(app.errors, []);
});

test("Decision 164: after every press that redraws on a member's page, focus is on what the order names, never <body>", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Focus");
  castAdd(app, "Dez");
  app.click("[data-copen]");
  assert.notEqual(app.doc.activeElement, app.doc.body, "opening a card dropped focus");
  app.click("[data-cskadd]");
  assert.equal(focusedKey(app), "data-cskname=0");
  app.click("[data-cskadd]"); app.click("[data-cskadd]");
  app.click('[data-cskdel="1"]');
  assert.equal(focusedKey(app), "data-cskadd=");
  assert.equal(app.$$("[data-cskill]").length, 2);
  for (const key of ["armor", "gear"]) {
    app.click(`[data-clineadd="${key}"]`);
    assert.equal(focusedKey(app), `data-clinev=${key}|0`);
    app.click(`[data-clinedel="${key}|0"]`);
    assert.equal(focusedKey(app), `data-clineadd=${key}`);
  }
  app.click("[data-ctadd]");
  assert.equal(focusedKey(app), "data-ctname=0");
  app.click('[data-ctdel="0"]');
  assert.equal(focusedKey(app), "data-ctadd=");
  app.click("[data-cback]");
  assert.ok(app.doc.activeElement.hasAttribute("data-copen"), "Back to the cast dropped focus");
  assert.deepEqual(app.errors, []);
});

test("Decision 176: the tab button and Back return to the list, with the filters as they were", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Back");
  castAdd(app, "Dez"); castAdd(app, "Bex");
  type(app, "[data-csearch]", "dez");
  app.click("[data-copen]");
  assert.ok(app.$("[data-cback]"));
  app.click('[data-tsec="cast"]');
  assert.deepEqual(castNames(app), ["Dez"]);
  assert.equal(app.$("[data-csearch]").value, "dez");
  app.click("[data-copen]"); app.click("[data-cback]");
  assert.deepEqual(castNames(app), ["Dez"]);
  assert.deepEqual(app.errors, []);
});

test("Decision 174: a card shows what's known, the status when it isn't alive, and Stat block when a number is in it", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Cards");
  castAdd(app, "Dez", "a courier");
  app.click("[data-copen]");
  type(app, '[data-cf="origin"]', "Born here"); type(app, '[data-cf="enemyRole"]', "Boss"); type(app, '[data-cf="tier"]', "2");
  type(app, '[data-cf="npcRoles"]', "Fixer/Courier");
  type(app, '[data-cstat="BOD"]', "5");
  app.click("[data-cback]");
  const text = app.$("[data-ccard]").textContent.replace(/\s+/g, " ");
  assert.match(text, /Dez/); assert.match(text, /a courier/);
  assert.match(text, /Born here · Fixer \/ Courier · Enemy: Boss · Tier 2 · Stat block/);
  assert.doesNotMatch(text, /Alive/);
  app.click("[data-copen]");
  pick(app, '[data-cf="status"]', "gone");
  assert.equal(app.window.eval("S.table.cast[0].status"), "gone");
  assert.deepEqual(app.$$('[data-cf="status"] option').map(o => o.textContent), ["Alive", "Dead", "Missing", "Out of the picture"]);
  app.click("[data-cback]");
  assert.match(app.$("[data-castlist]").textContent, /No one matches/);
  app.click("[data-cclear]");
  assert.match(app.$("[data-ccard]").textContent, /Out of the picture/);
  assert.deepEqual(app.errors, []);
});

test("Decision 174: a member's whole page survives export and import on a fresh browser, and Health is nowhere in the file", async () => {
  const app = boot({ storage: GM_ON });
  const downloads = withDownloads(app);
  runTable(app, "Round trip");
  castAdd(app, "Dez", "a courier");
  app.click("[data-copen]");
  for (const [k, v] of [["description", "Quick."], ["origin", "Here"], ["enemyRole", "Boss"], ["motivation", "Out"], ["resources", "A van"], ["line", "No kids"], ["ifPushed", "Runs"], ["gmNote", "Secret"]])
    type(app, `[data-cf="${k}"]`, v);
  type(app, '[data-cstat="BOD"]', "6"); type(app, '[data-cauth="TOL"]', "1");
  app.click("[data-cskadd]"); type(app, '[data-cskname="0"]', "Streetwise"); type(app, '[data-csktotal="0"]', "6");
  app.click('[data-clineadd="armor"]'); type(app, '[data-clinev="armor|0"]', "Vest");
  app.click('[data-clineadd="gear"]'); type(app, '[data-clinev="gear|0"]', "Phone");
  app.click("[data-ctadd]"); type(app, '[data-ctname="0"]', "Quick"); type(app, '[data-cttext="0"]', "Moves first.");
  const before = JSON.parse(JSON.stringify(app.window.eval("S.table.cast")));
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  const file = await tableFile(downloads[0]);
  assert.equal(JSON.stringify(file.cast), JSON.stringify(before));
  assert.doesNotMatch(JSON.stringify(file.cast), /"(health|hp|levels|hpPer|mod|formula)"/i);
  const fresh = boot({ storage: GM_ON });
  withDownloads(fresh);
  await importFile(fresh, file);
  assert.equal(fresh.window.eval("S.screen"), "table");
  fresh.click('[data-tsec="cast"]');
  assert.equal(JSON.stringify(fresh.window.eval("S.table.cast")), JSON.stringify(before));
  assert.match(fresh.$("[data-ccard]").textContent, /Dez/);
  assert.deepEqual([...app.errors, ...fresh.errors], []);
});

test("Decision 174: a saved 0.1 table opens as the current schema with its notes, and Remove takes the cast with it", () => {
  const t = Engine.newTable("Old one");
  Engine.addTableNote(t, { title: "Kept", text: "still here" });
  t.meta.tableSchemaVersion = "0.1"; delete t.cast;
  const app = boot({ storage: { ["shadows.table.v1." + t.meta.id]: { table: t, section: "notes", changed: "2026-10-05T10:00:00.000Z", exported: null }, ...GM_ON } });
  tableCard(app, "Old one").querySelector("[data-topen]").click();
  assert.equal(app.window.eval("S.table.meta.tableSchemaVersion"), "0.11");
  assert.equal(app.window.eval("S.table.cast.length"), 0);
  assert.equal(app.$("[data-ntitle]").value, "Kept");
  app.click('[data-tsec="cast"]');
  castAdd(app, "Dez");
  const saved = tableEntryOf(app, t.meta.id).table;
  assert.equal(saved.meta.tableSchemaVersion, "0.11");
  assert.equal(saved.cast.length, 1); assert.equal(saved.notes[0].title, "Kept");
  tableHome(app);
  tableCard(app, "Old one").querySelector("[data-tremove]").click();
  app.click("#modal [data-removego]");
  assert.equal(app.window.localStorage.getItem("shadows.table.v1." + t.meta.id), null);
  assert.deepEqual(app.errors, []);
});

test("a long unbroken name wraps wherever the cast shows a GM's words (the pixels are checked by hand: jsdom has no layout)", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Wrap");
  castAdd(app, "W".repeat(60), "L".repeat(60));
  const css = wizCss();
  for (const re of [/\.cast-open\{[^}]*overflow-wrap:anywhere/, /\.cast-line, \.cast-meta\{[^}]*overflow-wrap:anywhere/,
                    /\.cast-title, \.cast-h\{[^}]*overflow-wrap:anywhere/, /\.cast-health\{[^}]*overflow-wrap:anywhere/,
                    /\.cast-stats\{[^}]*grid-template-columns:repeat\(auto-fill/, /\.cast-row input\[type=text\]\{[^}]*min-width:0/])
    assert.match(css, re);
  assert.ok(app.$(".cast-open")); assert.ok(app.$(".cast-line"));
  app.click("[data-copen]");
  assert.ok(app.$("h1.cast-title.tbl-title"));
  assert.ok(app.$(".cast-stats"));
});

test("Decision 176: the filter defaults to In play, and a member marked Missing is still listed, after the alive ones, dashed, with focus on them", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "In play");
  for (const n of ["Dez", "Moth", "Orla"]) castAdd(app, n);   // Orla, Moth, Dez
  assert.equal(app.$("[data-cstatus]").value, "inplay");
  assert.deepEqual(app.$$("[data-cstatus] option").map(o => o.textContent), ["In play", "Alive", "All", "Dead", "Missing", "Out of the picture"]);
  const ids = Object.fromEntries(app.$$("[data-copen]").map(b => [b.textContent, b.dataset.copen]));
  app.click(`[data-copen="${ids.Orla}"]`);
  pick(app, '[data-cf="status"]', "missing");
  app.click("[data-cback]");
  assert.deepEqual(castNames(app), ["Moth", "Dez", "Orla"], "the missing member vanished or isn't after the alive ones");
  assert.equal(app.doc.activeElement.dataset.copen, ids.Orla, "focus isn't on their card's button");
  assert.equal(app.$(`[data-ccard="${ids.Orla}"]`).dataset.status, "missing");
  assert.match(app.$(`[data-ccard="${ids.Orla}"]`).textContent, /Missing/);
  assert.match(wizCss(), /\.cast-card\[data-status="missing"\]\{border-style:dashed/);
  pick(app, "[data-cstatus]", "all");
  assert.deepEqual(app.$$("[data-ccard]").map(c => c.dataset.status), ["alive", "alive", "missing"]);
  assert.deepEqual(app.errors, []);
});

test("a number field shows what was stored once it loses focus: a refused value reads blank", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Numbers");
  castAdd(app, "Dez");
  app.click("[data-copen]");
  const changed = sel => app.$(sel).dispatchEvent(new app.window.Event("change", { bubbles: true }));
  type(app, '[data-cf="tier"]', "0");
  assert.equal(app.$('[data-cf="tier"]').value, "0", "typing was interrupted");
  changed('[data-cf="tier"]');
  assert.equal(app.$('[data-cf="tier"]').value, "");
  type(app, '[data-cstat="REF"]', "6.5"); changed('[data-cstat="REF"]');
  assert.equal(app.$('[data-cstat="REF"]').value, "");
  assert.equal(app.$('[data-cbonus="REF"]').textContent, "");
  type(app, '[data-cstat="REF"]', "6"); changed('[data-cstat="REF"]');
  assert.equal(app.$('[data-cstat="REF"]').value, "6");
  type(app, '[data-cf="tier"]', "2"); changed('[data-cf="tier"]');
  assert.equal(app.$('[data-cf="tier"]').value, "2");
  app.click("[data-cskadd]"); type(app, '[data-csktotal="0"]', "2.5"); changed('[data-csktotal="0"]');
  assert.equal(app.$('[data-csktotal="0"]').value, "");
  type(app, '[data-cauth="TOL"]', "1.5"); changed('[data-cauth="TOL"]');
  assert.equal(app.$('[data-cauth="TOL"]').value, "");
  assert.deepEqual(app.errors, []);
});

// ── Interactions and affiliations (Decisions 177–179) ───────────────────
// Synthetic only: Dez, Moth and Orla at the cast; Nyx and Rook as the crew.
const openFirst = app => app.click("[data-copen]");
const intTexts = app => app.$$("[data-itext]").map(el => el.value);
const addLine = (app, text) => { type(app, "[data-iwhat]", text); keyIn(app, "[data-iwhat]", "Enter"); };
const memberWith = (app, name = "Dez") => { castAdd(app, name); openFirst(app); };
const tableOf = app => JSON.parse(app.window.eval("JSON.stringify(S.table)"));

test("Decision 177: kind once, crew once, then What and Enter three times: three lines, newest first, kind and crew kept, focus in an empty What", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Scene");
  memberWith(app);
  app.click('[data-iakind="learned"]');
  type(app, "[data-iacrew]", "Nyx");
  for (const t of ["one", "two", "three"]) {
    addLine(app, t);
    assert.equal(app.doc.activeElement.hasAttribute("data-iwhat"), true, "focus left What");
    assert.equal(app.doc.activeElement.value, "", "What wasn't emptied");
    assert.equal(app.$('[data-iakind="learned"]').getAttribute("aria-pressed"), "true", "the kind didn't stay");
    assert.equal(app.$("[data-iacrew]").value, "Nyx", "the crew didn't stay");
  }
  assert.deepEqual(intTexts(app), ["three", "two", "one"]);
  assert.deepEqual(app.$$("[data-icrew]").map(el => el.value), ["Nyx", "Nyx", "Nyx"]);
  assert.deepEqual(app.$$("[data-ikind].on").map(b => b.dataset.ikind.split("|")[1]), ["learned", "learned", "learned"]);
  assert.equal(app.$("[data-iadate]").value, app.window.eval("localDay()"), "the date doesn't start as today's");
  assert.deepEqual(app.errors, []);
});

test("Decision 177: Add with no kind and no text does nothing, a pressed kind unpresses, and a kind alone is a line", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Blank");
  memberWith(app);
  app.click("[data-iadd]");
  assert.equal(app.$$("[data-int]").length, 0);
  assert.doesNotMatch(app.$("#main").textContent, /Say what happened/);
  app.click('[data-iakind="owes"]'); app.click('[data-iakind="owes"]');
  assert.equal(app.$$("[data-iakind].on").length, 0, "pressing a pressed kind didn't unpress it");
  app.click("[data-iadd]");
  assert.equal(app.$$("[data-int]").length, 0);
  app.click('[data-iakind="owes"]'); app.click("[data-iadd]");
  assert.equal(app.$$("[data-int]").length, 1);
  assert.deepEqual(app.$$("[data-iakind]").map(b => b.dataset.iakind).slice(0, 7), ["shared", "learned", "helped", "wronged", "killed", "owes", "owed"]);
  for (const k of app.$$("[data-iakind]").map(b => b.dataset.iakind)) assert.ok(Engine.addInteraction(Engine.newTable(), { kind: k, text: "" }).ok, k + " isn't a kind the engine takes");
  assert.deepEqual(app.errors, []);
});

test("Decision 177: Killed them on the add row sets the member Dead, no kind stays pressed, and Back hides them under In play but not All", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Killing");
  castAdd(app, "Orla"); castAdd(app, "Dez");   // Dez, Orla
  openFirst(app);
  app.click('[data-iakind="killed"]'); type(app, "[data-iacrew]", "Rook");
  addLine(app, "shot in the warehouse");
  assert.equal(app.$('[data-cf="status"]').value, "dead", "the status select doesn't read Dead");
  assert.equal(app.$$("[data-iakind]").filter(b => b.getAttribute("aria-pressed") === "true").length, 0, "the add row kept Killed them");
  assert.equal(app.$$("[data-iakind=\"killed\"]").length, 1);
  assert.equal(app.doc.activeElement.hasAttribute("data-iwhat"), true);
  assert.equal(app.$("[data-iacrew]").value, "Rook", "the crew didn't stay");
  app.click("[data-cback]");
  assert.deepEqual(castNames(app), ["Orla"], "a dead member is still under In play");
  assert.ok(app.doc.activeElement.hasAttribute("data-cadd-name"), "focus isn't on quick-add's name");
  pick(app, "[data-cstatus]", "all");
  assert.deepEqual(castNames(app), ["Orla", "Dez"], "the dead aren't last under All");
  assert.deepEqual(app.errors, []);
});

test("Decision 177: Killed them chosen on an existing line sets Dead and keeps focus on that kind button; changing it away leaves Dead", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Existing");
  memberWith(app);
  app.click('[data-iakind="shared"]'); addLine(app, "x");
  const xid = app.$("[data-int]").dataset.int;
  assert.equal(app.$('[data-cf="status"]').value, "alive");
  app.click(`[data-ikind="${xid}|killed"]`);
  assert.equal(app.$('[data-cf="status"]').value, "dead");
  assert.equal(focusedKey(app), `data-ikind=${xid}|killed`);
  assert.equal(app.$(`[data-ikind="${xid}|killed"]`).getAttribute("aria-pressed"), "true");
  app.click(`[data-ikind="${xid}|helped"]`);
  assert.equal(app.$('[data-cf="status"]').value, "dead", "changing away from killed brought them back");
  assert.equal(focusedKey(app), `data-ikind=${xid}|helped`);
  app.click(`[data-ikind="${xid}|helped"]`);
  assert.equal(app.$$("[data-ikind].on").length, 0, "pressing the pressed kind didn't clear it");
  assert.deepEqual(app.errors, []);
});

test("Decision 177: a date and a crew field show what was stored after change", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Stored");
  memberWith(app);
  app.click('[data-iakind="shared"]'); addLine(app, "x");
  const xid = app.$("[data-int]").dataset.int;
  pick(app, "[data-icrew]", " Nyx , , ");
  assert.equal(app.$("[data-icrew]").value, "Nyx");
  assert.deepEqual(tableOf(app).interactions[0].crew, ["Nyx"]);
  pick(app, "[data-idate]", "2026-02-30");
  assert.equal(app.$("[data-idate]").value, "", "a refused date still shows");
  assert.equal(tableOf(app).interactions[0].date, null);
  pick(app, "[data-idate]", "2026-10-04");
  assert.equal(app.$("[data-idate]").value, "2026-10-04");
  assert.equal(tableOf(app).interactions[0].date, "2026-10-04");
  pick(app, "[data-iacrew]", " Rook ,, Nyx ");
  assert.equal(app.$("[data-iacrew]").value, "Rook, Nyx");
  assert.equal(xid, tableOf(app).interactions[0].id);
  assert.deepEqual(app.errors, []);
});

test("Decision 177: a line typed and then Home at once is kept", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Home now");
  memberWith(app);
  app.click('[data-iakind="shared"]'); addLine(app, "first");
  type(app, "[data-itext]", "the warehouse is a front");
  type(app, "[data-icrew]", "Nyx");
  tableHome(app);
  tableCard(app, "Home now").querySelector("[data-topen]").click();
  openFirst(app);
  assert.equal(app.$("[data-itext]").value, "the warehouse is a front");
  assert.equal(app.$("[data-icrew]").value, "Nyx");
  assert.deepEqual(app.errors, []);
});

test("Decision 177: Delete asks, Cancel keeps, Delete removes, and focus goes to the next line or What", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Deleting");
  memberWith(app);
  app.click('[data-iakind="shared"]');
  for (const t of ["a", "b", "c"]) addLine(app, t);   // c, b, a
  const ids = app.$$("[data-int]").map(el => el.dataset.int);
  app.click(`[data-idel="${ids[1]}"]`);
  assert.ok(app.$("#modal[open]"), "Delete didn't ask");
  assert.match(app.$("#modal").textContent, /Delete this\?/);
  assert.match(app.$("#modal").textContent, /It goes from the crew's view too\./);
  app.click("#modal [data-modalclose]");
  assert.equal(app.$$("[data-int]").length, 3, "Cancel deleted");
  app.click(`[data-idel="${ids[1]}"]`); app.click("#modal [data-askyes]");
  assert.deepEqual(intTexts(app), ["c", "a"]);
  assert.equal(focusedKey(app), `data-ikind=${ids[2]}|shared`, "focus isn't on the next line's first control");
  app.click(`[data-idel="${ids[2]}"]`); app.click("#modal [data-askyes]");
  assert.ok(app.doc.activeElement.hasAttribute("data-iwhat"), "with no next line, focus isn't on What");
  assert.deepEqual(app.errors, []);
});

test("Decision 179: affiliations typed on a page show first on the card, fill the filter, narrow the list in order, and the search finds them", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Aff");
  castAdd(app, "Orla"); castAdd(app, "Moth"); castAdd(app, "Dez");   // Dez, Moth, Orla
  const go = name => { app.click(`[data-copen="${app.$$("[data-copen]").find(b => b.textContent === name).dataset.copen}"]`); };
  go("Orla"); type(app, '[data-cf="affiliations"]', "Eclipse / Goblins"); type(app, '[data-cf="origin"]', "Here"); app.click("[data-cback]");
  go("Moth"); type(app, '[data-cf="affiliations"]', "eclipse,  "); pick(app, '[data-cf="status"]', "missing"); app.click("[data-cback]");
  go("Dez"); type(app, '[data-cf="affiliations"]', "Anchor"); app.click("[data-cback]");
  assert.match(app.$(`[data-ccard] .cast-meta`).textContent, /^Anchor/);
  const orla = app.$$("[data-ccard]").find(c => /Orla/.test(c.textContent));
  assert.match(orla.querySelector(".cast-meta").textContent, /^Eclipse \/ Goblins · Here/);
  assert.deepEqual(app.$$("[data-caff] option").map(o => o.textContent), ["Any", "Anchor", "Eclipse", "Goblins"]);
  pick(app, "[data-caff]", "Eclipse");
  assert.deepEqual(castNames(app), ["Orla", "Moth"], "narrowed, and in alive-then-missing order");
  assert.equal(app.doc.activeElement.hasAttribute("data-caff"), false, "(jsdom's change doesn't move focus)");
  pick(app, "[data-caff]", "");
  type(app, "[data-csearch]", "goblin");
  assert.deepEqual(castNames(app), ["Orla"]);
  type(app, "[data-csearch]", "");
  // Pressing Enter after a field was typed keeps the stored form.
  go("Orla"); pick(app, '[data-cf="affiliations"]', " Eclipse /, Goblins ,");
  assert.equal(app.$('[data-cf="affiliations"]').value, "Eclipse / Goblins");
  assert.deepEqual(app.errors, []);
});

test("Decision 179: quick-adding someone the filters would hide clears them, the affiliation too", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Reset");
  castAdd(app, "Dez"); openFirst(app); type(app, '[data-cf="affiliations"]', "Eclipse"); app.click("[data-cback]");
  pick(app, "[data-caff]", "Eclipse"); type(app, "[data-csearch]", "dez");
  castAdd(app, "Bex");
  assert.equal(app.$("[data-caff]").value, "");
  assert.equal(app.$("[data-csearch]").value, "");
  assert.deepEqual(castNames(app), ["Bex", "Dez"]);
  assert.ok(app.doc.activeElement.hasAttribute("data-cadd-name"));
  assert.deepEqual(app.errors, []);
});

test("Decision 179: Who knows what groups by crew name, the toggle keeps focus, a name opens the page and Back returns to it", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Knows");
  castAdd(app, "Moth"); castAdd(app, "Dez");   // Dez, Moth
  openFirst(app);
  app.click('[data-iakind="shared"]'); type(app, "[data-iacrew]", "Nyx"); addLine(app, "the warehouse is a front");
  type(app, "[data-iacrew]", "nyx, Rook"); app.click('[data-iakind="helped"]'); addLine(app, "carried the bags");
  app.click("[data-cback]");
  assert.ok(app.$("[data-cadd-name]"));
  app.click('[data-cview="crew"]');
  assert.equal(app.$('[data-cview="crew"]').getAttribute("aria-pressed"), "true");
  assert.equal(focusedKey(app), "data-cview=crew", "focus isn't on the toggle's pressed button");
  assert.equal(app.$("[data-cadd-name]"), null, "quick-add shows on Who knows what");
  assert.equal(app.$("[data-cstatus]"), null); assert.equal(app.$("[data-caff]"), null);
  assert.deepEqual(app.$$(".crew-name").map(h => h.textContent), ["Nyx", "Rook"]);
  assert.match(app.$$(".crew-group")[0].textContent, /carried the bags[\s\S]*the warehouse is a front|Dez/);
  assert.equal(app.$$(".crew-group")[0].querySelectorAll(".int-line").length, 2);
  type(app, "[data-csearch]", "rook");
  assert.deepEqual(app.$$(".crew-name").map(h => h.textContent), ["Rook"]);
  type(app, "[data-csearch]", "zzz");
  assert.match(app.$("[data-castlist]").textContent, /No one matches/);
  type(app, "[data-csearch]", "");
  const who = app.$$(".crew-group")[1].querySelector("[data-copen]");
  who.click();
  assert.ok(app.$("[data-cback]"));
  app.click("[data-cback]");
  assert.equal(app.$$(".crew-name").length, 2, "Back didn't return to Who knows what");
  assert.equal(focusedKey(app), `data-copen=${who.dataset.copen} data-cwhere=${who.dataset.cwhere}`, "focus isn't on the name pressed");
  app.click('[data-cview="cast"]');
  assert.ok(app.$("[data-cadd-name]"));
  assert.deepEqual(app.errors, []);
});

test("Decision 178: delete a member and Who knows what keeps their name struck through, and their page's lines go from the list", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Gone");
  castAdd(app, "Moth"); castAdd(app, "Dez");
  openFirst(app);
  app.click('[data-iakind="shared"]'); type(app, "[data-iacrew]", "Nyx"); addLine(app, "told");
  app.click("[data-cdel]"); app.click("#modal [data-askyes]");
  assert.deepEqual(castNames(app), ["Moth"]);
  assert.equal(tableOf(app).interactions[0].cast[0].name, "Dez");
  app.click('[data-cview="crew"]');
  const s = app.$(".int-line s");
  assert.ok(s, "the name isn't struck through");
  assert.equal(s.textContent, "Dez");
  assert.equal(s.nextElementSibling.textContent, ", removed", "a screen reader isn't told the name was removed");
  assert.ok(s.nextElementSibling.classList.contains("vh")); assert.equal(s.getAttribute("aria-label"), null);
  assert.equal(app.$(".int-line [data-copen]"), null, "a removed name is still a button");
  type(app, "[data-csearch]", "dez");
  assert.equal(app.$$(".int-line").length, 1);
  assert.deepEqual(app.errors, []);
});

test("Decision 179: Delete from Who knows what lands on the toggle, never <body>", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Toggle");
  castAdd(app, "Dez"); openFirst(app);
  app.click('[data-iakind="shared"]'); type(app, "[data-iacrew]", "Nyx"); addLine(app, "x");
  app.click("[data-cback]"); app.click('[data-cview="crew"]');
  app.click(".int-line [data-copen]");
  app.click("[data-cdel]"); app.click("#modal [data-askyes]");
  assert.notEqual(app.doc.activeElement, app.doc.body);
  assert.ok(app.doc.activeElement.hasAttribute("data-cview"));
  assert.deepEqual(app.errors, []);
});

test("Decision 177: the view and the empty state read as a GM's own words", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Empty");
  app.click('[data-cview="crew"]');
  assert.match(app.$("[data-castlist]").textContent, /Nothing between the crew and anyone yet\./);
  assert.deepEqual(app.$$("[data-cview]").map(b => b.textContent), ["The cast", "Who knows what"]);
  assert.deepEqual(app.errors, []);
});

test("Decisions 177–179: export and import keep every interaction and affiliation, and a saved 0.2 table opens as 0.3", async () => {
  const app = boot({ storage: GM_ON });
  const downloads = withDownloads(app);
  runTable(app, "Round");
  castAdd(app, "Dez"); openFirst(app);
  type(app, '[data-cf="affiliations"]', "Eclipse / Goblins");
  app.click('[data-iakind="wronged"]'); type(app, "[data-iacrew]", "Nyx, Rook"); type(app, "[data-iadate]", "2026-10-03"); addLine(app, "took the cash");
  app.click("[data-cdel]"); app.click("#modal [data-askyes]");
  castAdd(app, "Moth"); openFirst(app); type(app, '[data-cf="affiliations"]', "Anchor");
  app.click('[data-iakind="owes"]'); addLine(app, "a favour");
  const before = tableOf(app);
  assert.equal(before.interactions[1].cast[0].name, "Dez", "a deleted member's link carries the name");
  assert.equal(before.interactions[0].cast[0].name, undefined, "a live link stores a name");
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  const file = await tableFile(downloads[0]);
  assert.equal(JSON.stringify(file.interactions), JSON.stringify(before.interactions));
  assert.equal(JSON.stringify(file.cast.map(n => n.affiliations)), JSON.stringify(before.cast.map(n => n.affiliations)));
  assert.equal(file.meta.tableSchemaVersion, "0.11");
  const fresh = boot({ storage: GM_ON });
  withDownloads(fresh);
  await importFile(fresh, file);
  assert.equal(JSON.stringify(fresh.window.eval("S.table.interactions")), JSON.stringify(before.interactions));
  assert.deepEqual([...app.errors, ...fresh.errors], []);

  const old = Engine.newTable("Saved 0.2");
  Engine.addCastMember(old, { name: "Dez" }); Engine.addTableNote(old, { title: "Kept", text: "here" });
  delete old.interactions; old.meta.tableSchemaVersion = "0.2"; for (const n of old.cast) delete n.affiliations;
  const app2 = boot({ storage: { ["shadows.table.v1." + old.meta.id]: { table: old, section: "notes", changed: "2026-10-05T10:00:00.000Z", exported: null }, ...GM_ON } });
  tableCard(app2, "Saved 0.2").querySelector("[data-topen]").click();
  assert.equal(app2.window.eval("S.table.meta.tableSchemaVersion"), "0.11");
  assert.equal(app2.window.eval("S.table.interactions.length"), 0);
  assert.equal(app2.$("[data-ntitle]").value, "Kept");
  app2.click('[data-tsec="cast"]');
  assert.equal(app2.window.eval("S.table.cast[0].name"), "Dez");
  assert.equal(app2.window.eval("JSON.stringify(S.table.cast[0].affiliations)"), "[]");
  assert.deepEqual(app2.errors, []);
});

test("Decision 177: a day is the GM's local day, not UTC's", () => {
  const app = boot({ storage: GM_ON });
  assert.equal(app.window.eval("localDay(new Date(2026, 9, 5, 0, 30))"), "2026-10-05");
  assert.equal(app.window.eval("localDay(new Date(2026, 11, 31, 23, 59))"), "2026-12-31");
  assert.equal(app.window.eval('dayText("2026-10-05")'), new Date(2026, 9, 5).toLocaleDateString());
  assert.equal(app.window.eval('dayText("junk")'), "");
});

test("Decisions 177–179: the headings, crew names and kind toggle wrap at 390px (the pixels are checked by hand: jsdom has no layout)", () => {
  const css = wizCss();
  for (const re of [/\.int-kinds\{[^}]*flex-wrap:wrap/, /\.int-kinds button\{[^}]*overflow-wrap:anywhere/, /\.crew-name\{[^}]*overflow-wrap:anywhere/,
                    /\.int-line\{[^}]*overflow-wrap:anywhere/, /\.int-row \.int-fields input, \.int-row \.int-fields textarea\{[^}]*min-width:0/, /\.int-kinds button\{[^}]*flex:1 1 auto/, /\.vh\{[^}]*clip/, /\.cast-view\{[^}]*max-width:100%/])
    assert.match(css, re);
});

test("S8b review 1: a line with no crew name is still on screen once its member is deleted, in a last group", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Nameless");
  castAdd(app, "Dez"); openFirst(app);
  app.click('[data-iakind="shared"]'); addLine(app, "told them nothing");
  app.click("[data-cdel]"); app.click("#modal [data-askyes]");
  assert.equal(app.window.eval("S.table.interactions.length"), 1);
  app.click('[data-cview="crew"]');
  assert.deepEqual(app.$$(".crew-name").map(h => h.textContent), ["No one named"]);
  assert.match(app.$(".int-line").textContent, /told them nothing/);
  assert.equal(app.$(".int-line s").textContent, "Dez");
  type(app, "[data-csearch]", "dez");
  assert.equal(app.$$(".int-line").length, 1, "the search doesn't reach it by the member's name");
  assert.deepEqual(app.errors, []);
});

test("S8b review 2: What on the add row survives a redraw a press elsewhere causes, and is emptied by Add", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Draft");
  castAdd(app, "Dez"); openFirst(app);
  app.click('[data-iakind="shared"]'); addLine(app, "first");
  type(app, "[data-iwhat]", "half typed");
  const xid = app.$("[data-int]").dataset.int;
  app.click(`[data-ikind="${xid}|helped"]`);
  assert.equal(app.$("[data-iwhat]").value, "half typed", "a kind on a row cost the draft");
  app.click("[data-cskadd]");
  assert.equal(app.$("[data-iwhat]").value, "half typed", "a stat-block line cost the draft");
  app.click(`[data-idel="${xid}"]`); app.click("#modal [data-askyes]");
  assert.equal(app.$("[data-iwhat]").value, "half typed", "a Delete cost the draft");
  keyIn(app, "[data-iwhat]", "Enter");
  assert.equal(app.$("[data-iwhat]").value, "");
  assert.deepEqual(intTexts(app), ["half typed"]);
  type(app, "[data-iwhat]", "more"); app.click("[data-cback]"); openFirst(app);
  assert.equal(app.$("[data-iwhat]").value, "", "the draft outlived the page");
  assert.deepEqual(app.errors, []);
});

test("S8b review 3: Back from Who knows what lands on the same name even after a new group moves it", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Keyed");
  castAdd(app, "Bob"); openFirst(app);
  app.click('[data-iakind="shared"]'); type(app, "[data-iacrew]", "Nyx"); addLine(app, "one");
  app.click("[data-cback]"); app.click('[data-cview="crew"]');
  const who = app.$(".crew-group .int-line [data-copen]");
  const where = who.dataset.cwhere;
  who.click();
  type(app, "[data-iacrew]", "Ash"); addLine(app, "two");
  app.click("[data-cback]");
  assert.deepEqual(app.$$(".crew-name").map(h => h.textContent), ["Ash", "Nyx"], "Nyx's group didn't move");
  assert.equal(app.doc.activeElement.dataset.cwhere, where, "focus isn't on the name that was pressed");
  assert.ok(where.startsWith("nyx|"));
  assert.deepEqual(app.errors, []);
});

test("S8b review 5: an existing line's What is a wrapping textarea, and Enter in it is a newline, not Add", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Long");
  castAdd(app, "Dez"); openFirst(app);
  app.click('[data-iakind="shared"]'); addLine(app, "x");
  const el = app.$("[data-itext]");
  assert.equal(el.tagName, "TEXTAREA"); assert.equal(el.getAttribute("rows"), "2");
  type(app, "[data-itext]", "a very long line ".repeat(10));
  keyIn(app, "[data-itext]", "Enter");
  assert.equal(app.$$("[data-int]").length, 1, "Enter in a row's What added a line");
  assert.equal(app.window.eval("S.table.interactions[0].text"), "a very long line ".repeat(10));
  assert.equal(app.$("[data-iwhat]").tagName, "INPUT");
  assert.deepEqual(app.errors, []);
});

// ── Packs (Decisions 180–182) ───────────────────────────────────────────
// A synthetic pack only (tests/packfixture.mjs): nothing here is the Codex's.
import { syntheticPack, PACK_ID } from "./packfixture.mjs";
const packKeys = app => {
  const ls = app.window.localStorage, out = [];
  for (let i = 0; i < ls.length; i++) if (ls.key(i).startsWith("shadows.pack.v1.")) out.push(ls.key(i));
  return out;
};
const packStored = (pack = syntheticPack(), imported = "2026-10-05T10:00:00.000Z") =>
  ({ ["shadows.pack.v1." + pack.meta.id]: { pack: Engine.migratePack(pack), imported } });
const packCards = app => app.$$("#main .packs .roster-card");
const threatsTab = app => app.click('[data-tsec="threats"]');
const threatNames = app => app.$$("[data-tentry]").map(b => b.textContent);
const pickPack = async (app, obj) => {
  const input = app.$("#pack-file");
  const file = new app.window.File([JSON.stringify(obj)], "x.shadows-pack.json", { type: "application/json" });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new app.window.Event("change"));
  for (let i = 0; i < 50 && app.$("#pack-file"); i++) await new Promise(r => setTimeout(r, 10));
};
// A table with the pack slotted in, open on its Threats tab.
const tableWithPack = (pack = syntheticPack()) => {
  const app = boot({ storage: { ...GM_ON, ...packStored(pack) } });
  runTable(app, "Pier night");
  threatsTab(app);
  return app;
};
const entryButton = (app, id) => app.$(`[data-tentry="${PACK_ID}|${id}"]`);

test("Decision 181: switched off, a pack file is refused as not a character, and nothing is stored", async () => {
  const app = boot();
  await importFile(app, syntheticPack());
  assert.match(app.$("#undotoast").textContent, /That file isn't a character\./);
  assert.equal(packKeys(app).length, 0, "a pack was stored with the switch off");
  assert.equal(app.$("#main .packs"), null);
  assert.equal(app.window.eval("S.screen"), "home");
  assert.deepEqual(app.errors, []);
});

test("Decision 181: Home's Import slots a pack in; Your packs lists it with no tables; Remove asks, and Cancel keeps it", async () => {
  const app = boot({ storage: GM_ON });
  await importFile(app, syntheticPack());
  assert.equal(app.window.eval("S.screen"), "home");
  assert.match(app.$("#undotoast").textContent, /Test Pack slotted in: 3 entries\./);
  assert.equal(packKeys(app).length, 1);
  assert.equal(app.$("#main .tables"), null, "a pack made a table list");
  assert.equal(packCards(app).length, 1);
  const c = packCards(app)[0];
  assert.match(c.textContent, /Test Pack/); assert.match(c.textContent, /version v2 \(test\)/); assert.match(c.textContent, /3 entries/); assert.match(c.textContent, /slotted in/);
  assert.equal(app.doc.activeElement, c, "focus isn't on the new pack's card");
  assert.equal(app.$("h2#packs-h").textContent, "Your packs");
  app.click("[data-premove]");
  assert.match(app.$("#modal").textContent, /Remove Test Pack\?/);
  assert.match(app.$("#modal").textContent, /Your tables keep everyone you've used from it\. Import the file to bring it back\./);
  app.click("#modal [data-modalclose]");
  assert.equal(packKeys(app).length, 1, "Cancel removed the pack");
  app.click("[data-premove]"); app.click("#modal [data-askyes]");
  assert.equal(packKeys(app).length, 0);
  assert.equal(packCards(app).length, 0);
  assert.equal(app.doc.activeElement, app.$("#btn-import"), "after the last Remove, focus isn't on Import");
  assert.deepEqual(app.errors, []);
});

test("Decision 181: Your packs shows beside Your tables, and a Remove moves focus to the next pack's Remove", () => {
  const [, tables] = seedTable("Tuesday");
  const b = syntheticPack({ meta: { ...syntheticPack().meta, id: "PK-ZZZZ9999", name: "Zed Pack" } });
  const app = boot({ storage: { ...GM_ON, ...tables, ...packStored(), ...packStored(b) } });
  assert.deepEqual(app.$$("#main .tables .roster-name").map(n => n.textContent), ["Tuesday"]);
  assert.deepEqual(packCards(app).map(c => c.querySelector(".roster-name").textContent), ["Test Pack", "Zed Pack"], "packs aren't by name");
  app.click('[data-premove="PK-ZZZZ9999"]'); app.click("#modal [data-askyes]");
  assert.deepEqual(packCards(app).map(c => c.querySelector(".roster-name").textContent), ["Test Pack"]);
  assert.equal(app.doc.activeElement, app.$("#btn-import"), "the last pack's Remove didn't hand focus to Import");
  const app2 = boot({ storage: { ...GM_ON, ...packStored(), ...packStored(b) } });
  app2.click(`[data-premove="${PACK_ID}"]`); app2.click("#modal [data-askyes]");
  assert.equal(app2.doc.activeElement.dataset.premove, "PK-ZZZZ9999", "focus didn't go to the next pack's Remove");
  assert.deepEqual([...app.errors, ...app2.errors], []);
});

test("Decision 181: an older copy of a pack asks, a newer one replaces silently, and a pack with no id is refused", async () => {
  const app = boot({ storage: { ...GM_ON, ...packStored() } });
  const older = syntheticPack({ meta: { ...syntheticPack().meta, updated: "2026-10-01T10:00:00.000Z", name: "Older" } });
  await importFile(app, older);
  assert.match(app.$("#modal").textContent, /Put an older copy of Test Pack in place of the newer one\?/);
  app.click("#modal [data-modalclose]");
  assert.equal(JSON.parse(app.window.localStorage.getItem("shadows.pack.v1." + PACK_ID)).pack.meta.name, "Test Pack", "Cancel replaced the pack");
  await importFile(app, older);
  app.click("#modal [data-replacego]");
  assert.equal(JSON.parse(app.window.localStorage.getItem("shadows.pack.v1." + PACK_ID)).pack.meta.name, "Older");
  const newer = syntheticPack({ meta: { ...syntheticPack().meta, updated: "2026-10-09T10:00:00.000Z", name: "Newer" } });
  await importFile(app, newer);
  assert.equal(app.$("#modal[open]"), null, "a newer copy asked first");
  assert.equal(JSON.parse(app.window.localStorage.getItem("shadows.pack.v1." + PACK_ID)).pack.meta.name, "Newer");
  assert.equal(packKeys(app).length, 1);
  await importFile(app, { meta: { kind: "shadows-pack", id: "PK-bad" }, entries: [{ id: "a" }] });
  assert.match(app.$("#undotoast").textContent, /This pack has no id, so it can't be slotted in\./);
  assert.equal(packKeys(app).length, 1);
  await importFile(app, { meta: { kind: "other" } });
  assert.match(app.$("#undotoast").textContent, /isn't a character, a table or a pack/);
  assert.deepEqual(app.errors, []);
});

test("Decision 182: a table has a Threats tab, second; with no pack it says so and offers to slot one in", async () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Bare");
  assert.deepEqual(app.$$("#topnav .tab").map(b => b.textContent.trim()), ["Sessions", "Cast", "Threats", "Encounters", "Reference", "Notes"]);
  threatsTab(app);
  assert.match(app.$("#main").textContent, /No pack slotted in\./);
  assert.ok(app.$("[data-pslot]"));
  await pickPack(app, { meta: { kind: "shadows-table" } });
  assert.match(app.$("#undotoast").textContent, /That file isn't a pack\./);
  assert.equal(packKeys(app).length, 0);
  await pickPack(app, syntheticPack());
  assert.equal(packKeys(app).length, 1);
  assert.deepEqual(threatNames(app), ["Wren", "Gull"]);
  assert.equal(app.doc.activeElement, app.$("[data-tsearch]"), "after slotting in, focus isn't on the search");
  assert.equal(app.window.eval("S.tsection"), "threats");
  // A pack slotted in while a table is open goes to the browser, never into the table.
  const downloads = withDownloads(app);
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  const file = await tableFile(downloads[0]);
  assert.equal(Object.keys(file).sort().join(), "cast,encounters,interactions,meta,notes,sessions,threads", "the exported table carries more than a table");
  assert.ok(!JSON.stringify(file).includes("Lives high") && !JSON.stringify(file).includes("Test Pack"), "the exported table carries pack content");
  assert.deepEqual(app.errors, []);
});

test("Decision 182: the list keeps the pack's order, the filters narrow it, the search keeps its place, Clear the filters resets", () => {
  const app = tableWithPack();
  assert.deepEqual(threatNames(app), ["Wren", "Gull"], "not in the pack's own order");
  assert.deepEqual(app.$$('[data-tview]').map(b => b.textContent), ["Threats", "People", "Groups"]);
  assert.match(app.$("[data-tcard]").textContent, /Entry 02 · Spire · NPC role: Lookout · Enemy: Bruiser · Tier 2/);
  assert.doesNotMatch(app.$("[data-tcard]").textContent, /Test Pack/, "a pack's name shows with only one slotted in");
  const q = app.$("[data-tsearch]");
  type(app, "[data-tsearch]", "gull");
  assert.equal(app.$("[data-tsearch]"), q, "typing redrew the search field");
  assert.equal(q.value, "gull");
  assert.deepEqual(threatNames(app), ["Gull"]);
  type(app, "[data-tsearch]", "");
  pick(app, "[data-torigin]", "Dock"); assert.deepEqual(threatNames(app), ["Gull"]);
  pick(app, "[data-torigin]", "Spire"); assert.deepEqual(threatNames(app), ["Wren"]);
  pick(app, "[data-torigin]", ""); pick(app, "[data-ttier]", "1"); assert.deepEqual(threatNames(app), ["Gull"]);
  pick(app, "[data-ttier]", ""); pick(app, "[data-trole]", "Lookout"); assert.deepEqual(threatNames(app), ["Wren"]);
  pick(app, "[data-trole]", ""); pick(app, "[data-tenemy]", "Bruiser"); assert.deepEqual(threatNames(app), ["Wren", "Gull"]);
  pick(app, "[data-torigin]", "Dock"); pick(app, "[data-ttier]", "2");
  assert.match(app.$("#main").textContent, /Nothing matches\./);
  app.click("[data-tclear]");
  assert.deepEqual(threatNames(app), ["Wren", "Gull"]);
  for (const s of ["[data-torigin]", "[data-ttier]", "[data-tenemy]", "[data-tsearch]"]) assert.equal(app.$(s).value, "", s);
  assert.equal(app.doc.activeElement, app.$("[data-tsearch]"));
  app.click('[data-tview="npc"]');
  assert.deepEqual(threatNames(app), ["Moss"]);
  assert.equal(app.$('[data-tview="npc"]').getAttribute("aria-pressed"), "true");
  assert.equal(app.doc.activeElement, app.$('[data-tview="npc"]'), "the toggle lost focus");
  app.click('[data-tview="group"]');
  assert.deepEqual(app.$$("[data-tgroup]").map(b => b.textContent), ["Pier Watch"]);
  assert.equal(app.$("[data-torigin]"), null, "Groups filter by search only");
  assert.deepEqual(app.errors, []);
});

test("Decision 182: with two packs slotted in, a card names its pack; with one it doesn't", () => {
  const b = syntheticPack({ meta: { ...syntheticPack().meta, id: "PK-ZZZZ9999", name: "Zed Pack" }, entries: [syntheticPack().entries[1]], groups: [] });
  const app = boot({ storage: { ...GM_ON, ...packStored(), ...packStored(b) } });
  runTable(app, "Two"); threatsTab(app);
  assert.deepEqual(threatNames(app), ["Wren", "Gull", "Gull"]);
  assert.match(app.$$("[data-tcard]")[2].textContent, /Zed Pack/);
  assert.deepEqual(app.errors, []);
});

test("Decision 182: an entry's page shows the book's fields, Health as Engine.npc works it out, nothing to edit; Back lands on that card", () => {
  const app = tableWithPack();
  const pack = Engine.migratePack(syntheticPack()), h = Engine.npc(pack.entries[1].block).health;
  entryButton(app, "gull").click();
  assert.equal(app.doc.activeElement, app.$("[data-ttitle]"), "the page's title doesn't take focus");
  const t = app.$("#main").textContent;
  assert.match(t, /Gull/); assert.match(t, /Entry 01/); assert.match(t, /Loud and mean\./); assert.match(t, /A dockside heavy\./);
  assert.match(t, new RegExp(`Health ${h.total} \\(${h.levels} Health Levels\\)`));
  assert.match(t, /BOD/); assert.match(t, /Tier 1/);
  assert.equal(app.$$("#main input, #main textarea, #main select").length, 0, "a pack's entry is editable");
  assert.equal(app.$("[data-tback]").textContent, "Back to threats");
  assert.equal(app.$$("#main .tbl-title").length, 1, "the table's own title shows over the page");
  app.click("[data-tback]");
  assert.deepEqual(threatNames(app), ["Wren", "Gull"]);
  assert.equal(app.doc.activeElement, entryButton(app, "gull"), "Back didn't land on Gull's card");
  // The filter survives the round trip.
  pick(app, "[data-torigin]", "Dock");
  entryButton(app, "gull").click(); app.click("[data-tback]");
  assert.equal(app.$("[data-torigin]").value, "Dock"); assert.equal(app.window.eval("S.threatOrigin"), "Dock");
  assert.deepEqual(threatNames(app), ["Gull"]);
  assert.deepEqual(app.errors, []);
});

test("Decision 182: an origin or role on an entry's page is a tip carrying the pack's text", () => {
  const app = tableWithPack();
  entryButton(app, "wren").click();
  const chips = app.$$('#main [data-tip="packrec"]');
  assert.deepEqual(chips.map(c => c.textContent), ["Spire", "Lookout", "Bruiser", "Tier 2"]);
  clickIn(app, chips[0]);
  assert.match(tipShown(app), /Lives high\./);
  // The tier is a tip too, titled by its name, with the pack's text.
  clickIn(app, chips[3]);
  assert.match(tipShown(app), /Middling/); assert.match(tipShown(app), /Middling\./);
  // A tier with no text stays a plain word, as an origin or role does.
  const bare = syntheticPack(); bare.tiers = [{ id: 2, name: "Bare", text: "" }];
  const app2 = tableWithPack(bare);
  entryButton(app2, "wren").click();
  assert.deepEqual(app2.$$('#main [data-tip="packrec"]').map(c => c.textContent), ["Spire", "Lookout", "Bruiser"]);
  assert.match(app2.$("#main .cast-meta").textContent, /Tier 2/);
  assert.deepEqual([...app.errors, ...app2.errors], []);
});

test("Decision 182 (review): an entry's page names each kind of role, and the filter says NPC role", () => {
  const app = tableWithPack();
  assert.equal(app.$("[data-trole]").closest("label").textContent.replace(/Any.*/s, "").trim(), "NPC role");
  entryButton(app, "wren").click();
  const meta = app.$("#main .cast-meta").textContent.replace(/\s+/g, " ");
  assert.match(meta, /Entry 02 · Spire · NPC role: Lookout · Enemy: Bruiser · Tier 2/);
  app.click("[data-tback]"); app.click('[data-tview="npc"]'); entryButton(app, "moss").click();
  assert.match(app.$("#main .cast-meta").textContent.replace(/\s+/g, " "), /NPC role: Gatherer \/ Lookout/);
  assert.doesNotMatch(app.$("#main .cast-meta").textContent, /Enemy:/, "a person with no enemy role says Enemy");
  assert.deepEqual(app.errors, []);
});

test("Decision 182 (review): a group's card shows who is in it, not how many kinds", () => {
  const app = tableWithPack();
  app.click('[data-tview="group"]');
  assert.match(app.$("[data-tcard]").textContent.replace(/\s+/g, " "), /Group 01 · Dock · 3× Gull · 1× Wren/);
  assert.doesNotMatch(app.$("[data-tcard]").textContent, /members/);
  const pack = syntheticPack(); pack.groups[0].members[0] = { entry: "gull", count: 3 }; pack.entries[1].name = '<i data-pwn="x"></i>';
  const hostile = tableWithPack(pack); hostile.click('[data-tview="group"]');
  assert.equal(hostile.$$("[data-pwn]").length, 0, "a member's name became markup on the group card");
  assert.deepEqual([...app.errors, ...hostile.errors], []);
});

test("Decision 182 (review): the Threats filters have their own class, and on a phone sit two to a row under a full-width search", () => {
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  const app = tableWithPack();
  assert.ok(app.$(".threat-filters [data-tsearch]") && app.$$(".threat-filters select").length === 4);
  assert.equal(app.$(".cast-filters"), null, "the Threats tab still uses the Cast tab's filters class");
  assert.match(css, /@media \(max-width:640px\)\{\s*\.threat-filters\{grid-template-columns:1fr 1fr/);
  assert.match(css, /\.threat-filters \.field:first-child\{grid-column:1 \/ -1\}/);
  assert.match(css, /\.cast-filters\{display:grid; grid-template-columns:repeat\(auto-fit,minmax\(200px,1fr\)\)/, "the Cast tab's filters changed");
});

test("Decision 182: a person is under People, with what they want, and a group's member opens the entry, Back returning to the group", () => {
  const app = tableWithPack();
  app.click('[data-tview="npc"]');
  entryButton(app, "moss").click();
  const t = app.$("#main").textContent;
  assert.match(t, /Quiet money\./); assert.match(t, /A boat\./); assert.match(t, /Never the kids\./); assert.match(t, /Sells you out\./);
  app.click("[data-tback]");
  app.click('[data-tview="group"]');
  app.$("[data-tgroup]").click();
  assert.equal(app.doc.activeElement, app.$("[data-ttitle]"));
  assert.match(app.$("#main").textContent, /3× Gull/); assert.match(app.$("#main").textContent, /1× Wren/);
  assert.match(app.$("#main").textContent, /They guard the pier at night\./); assert.match(app.$("#main").textContent, /Gull leads, Wren scouts\./);
  assert.equal(app.$("[data-tback]").textContent, "Back to threats");
  app.$(`[data-tmember="${PACK_ID}|wren"]`).click();
  assert.match(app.$("#main").textContent, /A rooftop runner\./);
  assert.equal(app.$("[data-tback]").textContent, "Back to the group");
  app.click("[data-tback]");
  assert.ok(app.$("[data-tmember]") && /Pier Watch/.test(app.$("[data-ttitle]").textContent), "Back didn't return to the group");
  assert.equal(app.doc.activeElement, app.$(`[data-tmember="${PACK_ID}|wren"]`), "Back didn't land on the member that was opened");
  app.click("[data-tback]");
  assert.equal(app.doc.activeElement, app.$(`[data-tgroup="${PACK_ID}|pier-watch"]`));
  assert.deepEqual(app.errors, []);
});

test("Decision 182: Use copies the entry into the cast and opens it, name selected; it says From, and a table exported holds no pack", async () => {
  const app = tableWithPack(); const downloads = withDownloads(app);
  entryButton(app, "gull").click();
  app.click("[data-tuse]");
  assert.equal(app.window.eval("S.tsection"), "cast");
  const name = app.$('[data-cf="name"]');
  assert.equal(app.doc.activeElement, name, "Use didn't put the keyboard in the name");
  assert.equal(name.value, "Gull"); assert.equal(name.selectionStart, 0); assert.equal(name.selectionEnd, 4, "the name isn't selected");
  assert.equal(app.$('[data-cf="origin"]').value, "Dock"); assert.equal(app.$('[data-cf="enemyRole"]').value, "Bruiser");
  assert.match(app.$(".cast-from").textContent, /^From Gull/);
  assert.equal(app.window.eval("S.table.cast.length"), 1);
  assert.equal(app.$('[data-cstat="BOD"]').value, "8");
  // Rename: the copy is the GM's now.
  type(app, '[data-cf="name"]', "Vinnie");
  assert.match(app.$(".cast-from").textContent, /^From Gull/);
  assert.equal(app.$("[data-chealth]").textContent.length > 0, true);
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  const file = await tableFile(downloads[0]);
  assert.equal(file.meta.tableSchemaVersion, "0.11");
  assert.deepEqual(file.cast[0].from, { kind: "entry", pack: PACK_ID, id: "gull", name: "Gull" });
  const json = JSON.stringify(file);
  for (const w of ["Entry 01", "Lives high", "Test Pack", "Pier Watch", "Wren", "rooftop runner", "Moss", "Quiet money"]) assert.ok(!json.includes(w), `the exported table carries pack content: ${w}`);
  assert.equal(Object.keys(file).sort().join(), "cast,encounters,interactions,meta,notes,sessions,threads");
  const fresh = boot({ storage: GM_ON }); withDownloads(fresh);
  await importFile(fresh, file);
  assert.deepEqual(JSON.parse(fresh.window.eval("JSON.stringify(S.table.cast[0].from)")), { kind: "entry", pack: PACK_ID, id: "gull", name: "Gull" });
  assert.deepEqual([...app.errors, ...fresh.errors], []);
});

test("Decision 182: From on a member's page opens the entry; Back goes to the Threats list; Use after a filter that would hide the copy clears it", () => {
  const app = tableWithPack();
  entryButton(app, "wren").click(); app.click("[data-tuse]");
  app.$('[data-tfrom]').click();
  assert.equal(app.window.eval("S.tsection"), "threats");
  assert.equal(app.doc.activeElement, app.$("[data-ttitle]"));
  assert.match(app.$("[data-ttitle]").textContent, /Wren/);
  assert.equal(app.$("[data-tback]").textContent, "Back to Wren");
  app.click("[data-tback]");
  assert.equal(app.window.eval("S.tsection"), "cast");
  assert.equal(app.$('[data-cf="name"]').value, "Wren", "Back didn't return to the member's page");
  assert.equal(app.doc.activeElement, app.$("[data-tfrom]"), "Back didn't land on the From button");
  app.click('[data-tsec="threats"]');
  assert.deepEqual(threatNames(app), ["Wren", "Gull"]);
  app.click('[data-tsec="cast"]');
  type(app, "[data-csearch]", "nobody");
  app.click('[data-tsec="threats"]');
  entryButton(app, "gull").click(); app.click("[data-tuse]");
  assert.equal(app.window.eval("S.castQ"), "", "a filter hid the new member");
  assert.equal(app.window.eval("S.table.cast.length"), 2);
  app.click("[data-cback]");
  assert.deepEqual(castNames(app).sort(), ["Gull", "Wren"]);
  assert.deepEqual(app.errors, []);
});

test("Decision 182 (review): Back from an entry opened by From returns to that member, by id, named as they are now; any other way in, or a member gone, goes to the list", () => {
  const app = tableWithPack();
  entryButton(app, "gull").click(); app.click("[data-tuse]");
  type(app, '[data-cf="name"]', "Vinnie");
  app.$("[data-tfrom]").click();
  assert.equal(app.$("[data-tback]").textContent, "Back to Vinnie");
  app.click("[data-tuse]");   // Use on that page still copies the entry and opens the new copy
  assert.equal(app.window.eval("S.table.cast.length"), 2);
  assert.equal(app.window.eval("S.threatMember"), null, "Use left the member state behind");
  const app2 = tableWithPack();
  entryButton(app2, "gull").click(); app2.click("[data-tuse]");
  type(app2, '[data-cf="name"]', "   ");
  app2.$("[data-tfrom]").click();
  assert.equal(app2.$("[data-tback]").textContent, "Back to Unnamed");
  // Opening the entry any other way clears it: through the tab's list.
  app2.click("[data-tback]");
  assert.equal(app2.window.eval("S.tsection"), "cast", "Back didn't return to the member's page");
  assert.equal(app2.$('[data-cf="name"]').value, "   ");
  app2.click('[data-tsec="threats"]');
  entryButton(app2, "gull").click();
  assert.equal(app2.$("[data-tback]").textContent, "Back to threats");
  // The member deleted while the page was open: Back falls to the list.
  app2.click("[data-tback]"); app2.click('[data-tsec="cast"]'); app2.click("[data-copen]");
  app2.$("[data-tfrom]").click();
  const id = app2.window.eval("S.threatMember");
  assert.ok(id, "the member isn't remembered by id");
  app2.window.eval("S.table.cast.length = 0");
  app2.click("[data-tback]");
  assert.equal(app2.window.eval("S.tsection"), "threats");
  assert.deepEqual(threatNames(app2), ["Wren", "Gull"]);
  assert.deepEqual([...app.errors, ...app2.errors], []);
});

test("Decision 182: removing the pack leaves every copy whole; From reads as text, and the Threats tab is empty", () => {
  const app = tableWithPack();
  entryButton(app, "gull").click(); app.click("[data-tuse]");
  type(app, '[data-cf="name"]', "Vinnie");
  tableHome(app);
  app.click("[data-premove]"); app.click("#modal [data-askyes]");
  assert.equal(packKeys(app).length, 0);
  app.$("[data-topen]").click();
  assert.equal(app.window.eval("S.table.cast.length"), 1);
  assert.deepEqual(castNames(app), ["Vinnie"]);
  app.$("[data-copen]").click();
  assert.match(app.$(".cast-from").textContent, /^From Gull/);
  assert.equal(app.$("[data-tfrom]"), null, "From is still a button with the pack gone");
  assert.equal(app.$('[data-cf="name"]').value, "Vinnie"); assert.equal(app.$('[data-cstat="BOD"]').value, "8");
  assert.equal(app.window.eval("S.table.cast[0].from.name"), "Gull");
  threatsTab(app);
  assert.match(app.$("#main").textContent, /No pack slotted in\./);
  assert.deepEqual(app.errors, []);
});

test("Decision 182: a saved 0.3 table opens as 0.4, its cast kept and every member's from null", () => {
  const t = Engine.newTable("Three"); Engine.addCastMember(t, { name: "Dez" });
  delete t.cast[0].from; t.meta.tableSchemaVersion = "0.3";
  const app = boot({ storage: { ["shadows.table.v1." + t.meta.id]: { table: t, section: "cast", changed: "2026-10-05T10:00:00.000Z", exported: null }, ...GM_ON } });
  tableCard(app, "Three").querySelector("[data-topen]").click();
  assert.equal(app.window.eval("S.table.meta.tableSchemaVersion"), "0.11");
  assert.equal(app.window.eval("S.table.cast[0].from"), null);
  assert.deepEqual(castNames(app), ["Dez"]);
  assert.deepEqual(app.errors, []);
});

test("Decision 182: the Threats tab's new words and long names wrap", () => {
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  assert.match(css, /\.threat-text\{[^}]*overflow-wrap:anywhere/);
  assert.match(css, /\.threat-list\{[^}]*overflow-wrap:anywhere/);
  assert.match(css, /\.cast-meta \.tag\{[^}]*overflow-wrap:anywhere/);
  assert.match(css, /\.cast-view\{flex-wrap:wrap\}/);
});

// ── The builder (Decisions 183–185) ─────────────────────────────────────
const memberFromGull = (pack = syntheticPack()) => {
  const app = tableWithPack(pack);
  entryButton(app, "gull").click(); app.click("[data-tuse]");
  return app;
};
const castSel = app => JSON.parse(app.window.eval("JSON.stringify(S.table.cast[0])"));
const modOf = (app, id) => app.$(`[data-cmod="${id}"]`).textContent;
const caretIn = (app, sel, v) => {
  const el = app.$(sel); el.focus(); el.value = v; el.setSelectionRange(2, 2);
  el.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  return el;
};

test("Decision 184: with no pack slotted in, a member's page has no lists, toggles, guidance or Add from a pack", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Bare"); castAdd(app, "Dez");
  app.click("[data-copen]");
  type(app, '[data-cf="origin"]', "Dock"); type(app, '[data-cf="tier"]', "2");
  app.click("[data-ctadd]");
  for (const s of ["#cast-origins", "#cast-enemies", "[list=cast-origins]", "[data-crole]", ".cast-guide", "[data-cmod]", "[data-ctpick]", "[data-ctcount]"]) assert.equal(app.$(`#main ${s}`), null, s);
  assert.deepEqual(app.errors, []);
});

test("Decision 184: a pack offers its origins and enemy roles as lists that still take anything, and roles as toggles", () => {
  const app = memberFromGull();
  const opts = id => app.$$(`#${id} option`).map(o => o.value);
  assert.deepEqual(opts("cast-origins"), ["Dock", "Spire"]);
  assert.deepEqual(opts("cast-enemies"), ["Bruiser"]);
  assert.equal(app.$('[data-cf="origin"]').getAttribute("list"), "cast-origins");
  assert.equal(app.$('[data-cf="npcRoles"]').getAttribute("list"), null, "NPC roles can't use a list: it doesn't suggest after a slash");
  assert.deepEqual(app.$$("[data-crole]").map(b => b.textContent), ["Gatherer", "Lookout"]);
  type(app, '[data-cf="origin"]', "Somewhere else");
  assert.equal(castSel(app).origin, "Somewhere else", "free text was refused");
  assert.ok(app.$('[role="group"][aria-label="Roles in the pack"]'));
});

test("Decision 184: a typed origin (any case) shows its modifiers beside the stats, keeps the caret, and stores nothing new", () => {
  const app = memberFromGull();
  assert.equal(modOf(app, "BOD"), "Dock +1"); assert.equal(modOf(app, "REF"), "Dock −1"); assert.equal(modOf(app, "MOB"), "");
  const shape = () => JSON.stringify(Object.keys(castSel(app)).sort()) + JSON.stringify(Object.keys(castSel(app).block).sort());
  const before = shape();
  app.window.eval("window.__renders = 0; const __r = renderTable; renderTable = function(){ window.__renders++; return __r.apply(this, arguments); };");
  const el = caretIn(app, '[data-cf="origin"]', "spire");
  assert.equal(modOf(app, "MOB"), "Spire +1"); assert.equal(modOf(app, "BOD"), "");
  caretIn(app, '[data-cf="origin"]', "dock");
  assert.equal(modOf(app, "BOD"), "Dock +1"); assert.equal(modOf(app, "REF"), "Dock −1");
  assert.equal(app.$('[data-cf="origin"]'), el, "typing redrew the field");
  assert.equal(app.doc.activeElement, el); assert.equal(el.selectionStart, 2, "the caret moved");
  assert.equal(app.window.eval("window.__renders"), 0, "typing in Origin redrew the page");
  assert.equal(castSel(app).block.stats.BOD, 8, "a modifier was applied to the stored stat");
  assert.equal(app.$('[data-cstat="BOD"]').value, "8");
  assert.equal(shape(), before, "a key was added to the member or its block");
  type(app, '[data-cf="origin"]', "nowhere"); assert.equal(modOf(app, "BOD"), "");
  assert.deepEqual(app.errors, []);
});

test("Decision 184: a role toggle writes the field and the member, and typing presses the toggles", () => {
  const app = memberFromGull();
  const on = () => app.$$("[data-crole]").filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.textContent).join();
  assert.equal(on(), "");
  const look = app.$('[data-crole="Lookout"]'); look.focus(); look.click();
  assert.equal(app.$('[data-cf="npcRoles"]').value, "Lookout"); assert.deepEqual(castSel(app).npcRoles, ["Lookout"]);
  assert.equal(look.getAttribute("aria-pressed"), "true"); assert.equal(app.doc.activeElement, look, "the toggle lost focus");
  app.click('[data-crole="Gatherer"]');
  assert.equal(app.$('[data-cf="npcRoles"]').value, "Lookout / Gatherer");
  app.click('[data-crole="Lookout"]');
  assert.equal(app.$('[data-cf="npcRoles"]').value, "Gatherer"); assert.deepEqual(castSel(app).npcRoles, ["Gatherer"]);
  type(app, '[data-cf="npcRoles"]', "lookout, my own");
  assert.equal(on(), "Lookout", "typing didn't press the toggle"); assert.deepEqual(castSel(app).npcRoles, ["lookout", "my own"]);
  app.click('[data-crole="Lookout"]');
  assert.deepEqual(castSel(app).npcRoles, ["my own"], "removing took the matching entry out, whatever its case");
  assert.deepEqual(app.errors, []);
});

test("Decision 184: the tier's name is a tip, its guides show, and an enemy role of another tier says so", () => {
  const app = memberFromGull();
  const note = () => app.$("[data-ctier]").textContent.replace(/\s+/g, " ");
  assert.match(note(), /^Slight$/, "Gull is Tier 1, a Bruiser's tier");
  type(app, '[data-cf="tier"]', "2");
  assert.match(note(), /^Middling · A Bruiser is usually Tier 1$/);
  assert.match(app.$("[data-cstatguide]").textContent, /^Tier 2: Scores in the middle, a few high\.$/);
  assert.match(app.$("[data-ctguide]").textContent, /^Tier 2: A few traits, one that defines them\.$/);
  clickIn(app, app.$('[data-ctier] [data-tip="packrec"]'));
  assert.match(tipShown(app), /Middling/); assert.match(tipShown(app), /Middling\./);
  type(app, '[data-cf="tier"]', "1");
  assert.doesNotMatch(note(), /usually/);
  assert.match(app.$("[data-cstatguide]").textContent, /^Tier 1: Mostly low scores/);
  type(app, '[data-cf="tier"]', "7");
  assert.equal(app.$("[data-cstatguide]").hidden, true); assert.match(note(), /^A Bruiser is usually Tier 1$/);
  type(app, '[data-cf="tier"]', "");
  assert.equal(castSel(app).tier, null); assert.equal(app.$("[data-ctier]").hidden, false);
  type(app, '[data-cf="enemyRole"]', "Brute");
  assert.equal(app.$("[data-ctier]").hidden, true, "an unmatched enemy role said something");
  assert.deepEqual(app.errors, []);
});

test("Decision 184: a page with every guide matched shows no warning anywhere", () => {
  const app = memberFromGull();
  type(app, '[data-cf="tier"]', "2"); type(app, '[data-cf="origin"]', "Spire"); app.click('[data-crole="Lookout"]');
  type(app, '[data-cstat="BOD"]', "1"); type(app, '[data-cstat="MOB"]', "20");
  assert.ok(app.$("[data-cstatguide]") && !app.$("[data-cstatguide]").hidden);
  assert.equal(app.$$('#main [role="alert"], #main .flag, #main .warn, #main .issues, #main [aria-invalid]').length, 0);
  assert.equal(castSel(app).block.stats.BOD, 1, "a value outside the guide was changed");
  assert.deepEqual(app.errors, []);
});

test("Decision 185: Add from a pack opens the glossary: pack order, filters narrow, the search keeps its caret", () => {
  const app = memberFromGull();
  const rows = () => app.$$("#modal [data-tpadd]").map(b => b.getAttribute("aria-label").replace("Add ", ""));
  const open = app.$("[data-ctpick]"); open.focus(); open.click();
  assert.match(app.$("#modal .modal-head").textContent, /Add a trait/);
  assert.equal(app.doc.activeElement, app.$("[data-tpsearch]"), "the search isn't focused");
  assert.deepEqual(rows(), ["Salt Nerve", "Pier Legs", "Gull's Cry", "Rope Trick"], "not the pack's own order");
  assert.match(app.$("#modal .trait-pick").textContent, /Salt Nerve\s*Universal/);
  assert.match(app.$$("#modal .trait-pick")[2].textContent, /Gull's Cry\s*Signature · Dock/);
  assert.match(app.$$("#modal .trait-pick")[2].textContent, /Shouts; everyone nearby turns\./, "a trait's text isn't shown");
  pick(app, "[data-tpkind]", "origin"); assert.deepEqual(rows(), ["Pier Legs", "Rope Trick"]);
  pick(app, "[data-tporigin]", "Spire"); assert.deepEqual(rows(), ["Rope Trick"]);
  pick(app, "[data-tpkind]", ""); pick(app, "[data-tporigin]", "");
  const q = caretIn(app, "[data-tpsearch]", "ROPE");
  assert.deepEqual(rows(), ["Rope Trick"]); assert.equal(app.$("[data-tpsearch]"), q); assert.equal(q.selectionStart, 2);
  type(app, "[data-tpsearch]", "zzz");
  assert.match(app.$("#modal").textContent, /Nothing matches\./);
  app.click("[data-tpclear]");
  assert.equal(rows().length, 4); assert.equal(app.$("[data-tpsearch]").value, ""); assert.equal(app.doc.activeElement, app.$("[data-tpsearch]"));
  assert.deepEqual(app.errors, []);
});

test("Decision 185: Add copies the name and text only, closes, focuses the new name, and the count follows a rename", () => {
  const app = memberFromGull();
  const countText = () => app.$("[data-ctcount]").textContent;
  assert.equal(app.$("[data-ctcount]").hidden, true, "a count with no traits");
  app.click("[data-ctpick]");
  app.click(`[data-tpadd="${PACK_ID}|gulls-cry"]`);
  assert.equal(app.$("#modal").hasAttribute("open"), false, "the picker stayed open");
  assert.deepEqual(castSel(app).block.traits, [{ name: "Gull's Cry", text: "Shouts; everyone nearby turns." }], "the copy carries more than a name and text");
  assert.equal(app.doc.activeElement, app.$('[data-ctname="0"]'));
  assert.equal(countText(), "1 trait: 1 Signature");
  type(app, '[data-ctname="0"]', "Gull's Shout");
  assert.equal(countText(), "1 trait: 1 written");
  app.click("[data-ctpick]"); app.click(`[data-tpadd="${PACK_ID}|salt-nerve"]`); app.click("[data-ctpick]"); app.click(`[data-tpadd="${PACK_ID}|pier-legs"]`);
  assert.equal(countText(), "3 traits: 1 Universal · 1 Origin · 1 written");
  assert.equal(JSON.stringify(Object.keys(castSel(app).block.traits[1])), '["name","text"]');
  app.click('[data-ctdel="2"]');
  assert.equal(countText(), "2 traits: 1 Universal · 1 written"); assert.equal(app.doc.activeElement, app.$("[data-ctadd]"));
  assert.deepEqual(app.errors, []);
});

test("Decision 185: Cancel and Escape return to Add from a pack, and the search is there next time", () => {
  const app = memberFromGull();
  app.$("[data-ctpick]").focus(); app.click("[data-ctpick]");
  type(app, "[data-tpsearch]", "rope"); pick(app, "[data-tpkind]", "origin");
  app.click("#modal .modal-foot [data-modalclose]");
  assert.equal(app.doc.activeElement, app.$("[data-ctpick]"), "Cancel didn't return focus");
  assert.equal(castSel(app).block.traits.length, 0);
  app.click("[data-ctpick]");
  assert.equal(app.$("[data-tpsearch]").value, "rope"); assert.equal(app.$("[data-tpkind]").value, "origin");
  assert.equal(app.$$("#modal [data-tpadd]").length, 1);
  app.$("#modal").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(app.doc.activeElement, app.$("[data-ctpick]"), "Escape didn't return focus");
  assert.deepEqual(app.errors, []);
});

test("Decision 185: a pack with no traits has no Add from a pack; two packs show each trait's pack", () => {
  const bare = syntheticPack(); bare.traits = [];
  assert.equal(memberFromGull(bare).$("[data-ctpick]"), null);
  const second = syntheticPack(); second.meta = { ...second.meta, id: "PK-ZZZZ9999", name: "Second" };
  second.traits = [{ id: "x", name: "Barnacle", kind: "origin", origin: "dock", text: "Clings." }];
  const app = boot({ storage: { ...GM_ON, ...packStored(syntheticPack()), ...packStored(second) } });
  runTable(app, "Two"); threatsTab(app); app.$$("[data-tentry]").find(b => b.textContent === "Gull").click(); app.click("[data-tuse]"); app.click("[data-ctpick]");
  assert.match(app.$("#modal").textContent, /Barnacle\s*Origin · Dock · Second/);
  assert.match(app.$("#modal").textContent, /Gull's Cry\s*Signature · Dock · Test Pack/);
  assert.deepEqual(app.errors, []);
});

test("Decision 184: removing the pack leaves every member as typed, with no guidance", () => {
  const app = memberFromGull();
  app.click("[data-ctpick]"); app.click(`[data-tpadd="${PACK_ID}|gulls-cry"]`);
  type(app, '[data-cf="origin"]', "Dock");
  const before = JSON.stringify(castSel(app));
  for (const k of packKeys(app)) app.window.localStorage.removeItem(k);
  app.click("[data-cback]"); app.click("[data-copen]");
  assert.equal(JSON.stringify(castSel(app)), before);
  assert.equal(app.$('[data-cf="origin"]').value, "Dock"); assert.equal(app.$('[data-ctname="0"]').value, "Gull's Cry");
  for (const s of ["#cast-origins", "#cast-enemies", "[list=cast-origins]", "[data-crole]", ".cast-guide", "[data-cmod]", "[data-ctpick]"]) assert.equal(app.$(`#main ${s}`), null, s);
  assert.deepEqual(app.errors, []);
});

test("Decision 184: the Threats card names each kind of role as the entry page does", () => {
  const app = tableWithPack();
  assert.match(app.$("[data-tcard]").textContent, /Entry 02 · Spire · NPC role: Lookout · Enemy: Bruiser · Tier 2/);
  app.click('[data-tview="npc"]');
  assert.match(app.$("[data-tcard]").textContent, /NPC role: Gatherer \/ Lookout/);
});

test("Decisions 183–185: at a phone's width the toggles, a modifier and the picker's rows wrap", () => {
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  assert.match(css, /\.cast-roles\{flex-wrap:wrap/);
  assert.match(css, /\.cast-guide\{[^}]*overflow-wrap:anywhere/);
  assert.match(css, /\.trait-pick-head\{[^}]*overflow-wrap:anywhere/);
  assert.match(css, /\.cast-fig\{[^}]*overflow-wrap:anywhere/);
});

test("Decision 185 (review): a blank trait row isn't counted", () => {
  const app = memberFromGull();
  app.click("[data-ctadd]");
  assert.equal(app.$("[data-ctcount]").hidden, true, "a blank row was counted");
  app.click("[data-ctpick]"); app.click(`[data-tpadd="${PACK_ID}|gulls-cry"]`);
  app.click("[data-ctadd]");
  assert.equal(castSel(app).block.traits.length, 3);
  assert.equal(app.$("[data-ctcount]").textContent, "1 trait: 1 Signature");
  assert.deepEqual(app.errors, []);
});

test("Decision 184 (review): a Use copy says the book's stats already include its origin, while the origin is still its entry's", () => {
  const app = memberFromGull();
  const note = () => app.$("[data-cmodnote]");
  assert.equal(note().hidden, false);
  assert.equal(note().textContent, "The book's stats for Gull already include Dock's modifiers.");
  assert.equal(modOf(app, "BOD"), "Dock +1");
  assert.equal(castSel(app).block.stats.BOD, 8);
  const el = caretIn(app, '[data-cf="origin"]', "spire");
  assert.equal(note().hidden, true, "the note stayed after the origin changed");
  assert.equal(modOf(app, "MOB"), "Spire +1");
  caretIn(app, '[data-cf="origin"]', "dock");
  assert.equal(note().hidden, false);
  assert.equal(app.doc.activeElement, el); assert.equal(el.selectionStart, 2);
  assert.equal(app.$$('#main [role="alert"], #main .flag, #main .warn, #main .issues').length, 0);
  type(app, '[data-cf="origin"]', "");
  assert.equal(note().hidden, true, "no origin, no note");
  assert.deepEqual(app.errors, []);
});

test("Decision 184 (review): a quick-added member gets modifiers and no note; a copy whose pack is gone has no note at all", () => {
  const app = tableWithPack();
  app.click('[data-tsec="cast"]'); castAdd(app, "Dez"); app.click("[data-copen]");
  type(app, '[data-cf="origin"]', "Dock");
  assert.equal(app.$("[data-cmodnote]").hidden, true);
  assert.equal(modOf(app, "BOD"), "Dock +1");
  app.click("[data-cback]");
  app.click('[data-tsec="threats"]'); app.$$("[data-tentry]").find(b => b.textContent === "Gull").click(); app.click("[data-tuse]");
  assert.equal(app.$("[data-cmodnote]").hidden, false);
  // The gate admits only kind "entry" today; the page checks it itself, so a future kind says nothing until it's decided.
  app.window.eval('S.table.cast[0].from.kind = "other"');
  type(app, '[data-cf="origin"]', "Dock");
  assert.equal(app.$("[data-cmodnote]").hidden, true, "a link of another kind said the book's stats include the origin");
  app.window.eval('S.table.cast[0].from.kind = "entry"');
  type(app, '[data-cf="origin"]', "Dock");
  assert.equal(app.$("[data-cmodnote]").hidden, false);
  for (const k of packKeys(app)) app.window.localStorage.removeItem(k);
  app.click("[data-cback]"); app.click("[data-copen]");
  assert.equal(app.$("[data-cmodnote]"), null);
  assert.deepEqual(app.errors, []);
});

test("Decision 184 (review): the note wraps", () => {
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  assert.match(css, /\.cast-guide\{[^}]*overflow-wrap:anywhere/);
});

// ── The Encounters tab (Decisions 188–190) ─────────────────────────────
const encTab = app => app.click('[data-tsec="encounters"]');
const changeTo = (app, sel, value) => {
  const el = app.$(sel);
  el.value = value;
  el.dispatchEvent(new app.window.Event("change", { bubbles: true }));
};
const submit = (app, sel) => app.$(sel).dispatchEvent(new app.window.Event("submit", { bubbles: true, cancelable: true }));
const encRowByName = (app, name) => app.$$("[data-erow]").find(li => li.querySelector(".enc-name").textContent === name);
const encId = (app, i = 0) => app.window.eval(`S.table.encounters[${i}].id`);
const rowId = (li) => li.dataset.erow;
const newEncounter = (app, name) => { type(app, "[data-enc-name]", name); app.click("[data-enc-new]"); };
const addPcRow = (app, name) => { type(app, "[data-enc-pcname]", name); app.click("[data-enc-addpc]"); return encRowByName(app, name); };
const statesOf = app => JSON.parse(app.window.eval("JSON.stringify(S.table.encounters)"));

test("Decision 188: switched off there is no Encounters tab; switched on it sits between Threats and Notes (Reference follows it)", () => {
  const off = boot();
  assert.equal(off.$("#btn-run-table"), null);
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  assert.deepEqual(app.$$("[data-tsec]").map(b => b.dataset.tsec), ["sessions", "cast", "threats", "encounters", "reference", "notes"]);
  encTab(app);
  assert.match(app.$("#main").textContent, /Nothing on the books\./);
  assert.deepEqual(app.errors, []);
});

test("Decisions 188–189: plan an encounter, run a round with Take, Bleeding and Burning at Reset, and end it", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  app.window.eval(`Engine.addCastMember(S.table, { name: "Dez" }); Engine.setCastBlock(S.table, S.table.cast[0].id, { stats: { BOD: 4 }, skills: [] });`);
  encTab(app);
  newEncounter(app, "Warehouse job");
  assert.equal(app.doc.activeElement, app.$("[data-enc-title]"), "New encounter didn't put the keyboard in the name");
  assert.equal(app.$("[data-enc-title]").value, "Warehouse job");
  // Rows: a PC, then a cast member from the picker (which stays open and says Already in).
  const wren = addPcRow(app, "Wren");
  assert.equal(app.doc.activeElement, app.$("[data-enc-pcname]"), "Add a PC didn't return to the name field");
  assert.equal(app.$("[data-enc-pcname]").value, "");
  changeTo(app, `[data-ehp="${rowId(wren)}"]`, "30"); changeTo(app, `[data-elevels="${rowId(wren)}"]`, "6");
  app.click("[data-enc-pick]");
  app.click("[data-enc-addcast]");
  assert.match(app.$("[data-encpicklist]").textContent, /Already in/);
  const dez = encRowByName(app, "Dez");
  assert.ok(dez, "the cast member isn't a row");
  // Results: the order re-sorts, a tie is flagged on both rows.
  changeTo(app, `[data-eorder="${rowId(encRowByName(app, "Dez"))}"]`, "9");
  changeTo(app, `[data-eorder="${rowId(encRowByName(app, "Wren"))}"]`, "9");
  assert.equal(app.$$(".enc-tied").length, 2, "a tie wasn't flagged on both rows");
  assert.equal(app.doc.activeElement, app.$(`[data-eorder="${rowId(encRowByName(app, "Wren"))}"]`), "the field lost the keyboard when the rows moved");
  changeTo(app, `[data-eorder="${rowId(encRowByName(app, "Wren"))}"]`, "12");
  assert.deepEqual(app.$$("[data-erow] .enc-name").map(x => x.textContent), ["Wren", "Dez"]);
  assert.equal(app.$$(".enc-tied").length, 0);
  // Start.
  app.click("[data-enc-start]");
  assert.equal(app.doc.activeElement, app.$("[data-enext]"), "Start didn't land on Next");
  assert.match(app.$(".enc-status").textContent, /Round 1/);
  assert.equal(app.$$("[aria-current=step] .enc-name").map(x => x.textContent).join(), "Wren");
  // Take 12 on the PC: HP, damage taken, Health Levels and the data's Pain for two levels lost.
  app.click(`[data-edmg="${rowId(encRowByName(app, "Wren"))}|1"]`);
  assert.equal(app.doc.activeElement, app.$("[data-edmgn]"));
  app.$("[data-edmgn]").value = "12"; submit(app, "[data-edmgform]");
  const painLabel = app.D.resources.healthLevels.painLevels.find(p => p.hlLostThreshold === 2).label;
  assert.match(encRowByName(app, "Wren").textContent, new RegExp(`HP 18 / 30 · 12 taken · 4 of 6 Health Levels · ${painLabel}`));
  assert.equal(app.doc.activeElement, app.$(`[data-edmg="${rowId(encRowByName(app, "Wren"))}|1"]`), "OK didn't return to Take");
  // Heal 2 puts it back.
  app.click(`[data-edmg="${rowId(encRowByName(app, "Wren"))}|-1"]`); app.$("[data-edmgn]").value = "2"; submit(app, "[data-edmgform]");
  assert.match(encRowByName(app, "Wren").textContent, /HP 20 \/ 30 · 10 taken/);
  // Conditions: a refusal shows in the picker; Bleeding with a source and rounds; Burning.
  const wid = rowId(encRowByName(app, "Wren"));
  app.click(`[data-econdopen="${wid}"]`);
  assert.equal(app.doc.activeElement, app.$("[data-econd-id]"));
  changeTo(app, "[data-econd-id]", "bleeding");
  type(app, "[data-econd-src]", "Corner Shot's burst"); type(app, "[data-econd-rounds]", "1");
  app.click("[data-econd-add]");
  assert.match(encRowByName(app, "Wren").textContent, /Bleeding/); assert.match(encRowByName(app, "Wren").textContent, /1 round/); assert.match(encRowByName(app, "Wren").textContent, /Corner Shot's burst/);
  app.click(`[data-econdopen="${wid}"]`); changeTo(app, "[data-econd-id]", "bleeding"); app.click("[data-econd-add]");
  assert.match(app.$("[data-econdform] .enc-err").textContent, /Already Bleeding/);
  changeTo(app, "[data-econd-id]", "burning"); type(app, "[data-econd-rounds]", "3"); app.click("[data-econd-add]");
  assert.equal(app.$("[data-econdform]"), null);
  assert.ok(app.$(`${attrSelTest("data-erow", wid)} .enc-cond [data-tip="condition"]`), "the Condition's rule isn't a tap away");
  // Next to the end: Dez, then Reset.
  app.click("[data-enext]");
  assert.equal(app.$$("[aria-current=step] .enc-name").map(x => x.textContent).join(), "Dez");
  app.click("[data-enext]");
  assert.match(app.$("#main").textContent, /Reset: round 1 ends/);
  const fin = app.$("[data-efinish]");
  assert.equal(fin.disabled, true, "Finish was open with a Burning number missing");
  assert.match(app.$("#main").textContent, /Bleeding: 1 HP/);
  assert.match(app.$("#main").textContent, /Runs out now/);
  assert.match(app.$("#main").textContent, /Nothing on: Dez\./);
  const src = app.$(`[data-esrc^="${wid}|"]`);
  src.value = "3"; src.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  assert.equal(app.$("[data-efinish]").disabled, false);
  app.click("[data-efinish]");
  assert.match(app.$(".enc-status").textContent, /Round 2/);
  const e = statesOf(app)[0], w = e.rows.find(r => r.id === wid);
  assert.equal(w.damage, 10 + 1 + 3, "Bleeding 1 and Burning 3 ticked");
  assert.deepEqual(w.conditions.map(c => [c.id, c.rounds]), [["burning", 2]], "Bleeding ran out, Burning counted down");
  assert.equal(app.doc.activeElement, app.$("[data-enext]"));
  // End it: it heads Past encounters.
  app.click("[data-enc-end]"); app.click("[data-ew-end]");
  assert.equal(app.doc.activeElement, app.$("[data-enc-new]"));
  assert.match(app.$("#main").textContent, /Past encounters/); assert.match(app.$("#main").textContent, /Warehouse job/);
  app.click("[data-enc-open]");
  assert.equal(app.$("[data-edmg]"), null, "an ended encounter has controls");
  assert.equal(app.$("[data-eorder]"), null);
  assert.match(app.$("#main").textContent, /Ended · 2 rounds/);
  assert.deepEqual(app.errors, []);
});

const attrSelTest = (name, v) => `[${name}="${String(v).replace(/["\\]/g, "\\$&")}"]`;

test("Decision 189: Keep leaves a Condition at 1 round; Dying's check is named; marks move; Out is skipped by Next", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  encTab(app); newEncounter(app, "E");
  const a = addPcRow(app, "A"), b = addPcRow(app, "B"), c = addPcRow(app, "C");
  const [ia, ib, ic] = [a, b, c].map(rowId);
  for (const [id, n] of [[ia, 9], [ib, 8], [ic, 7]]) changeTo(app, `[data-eorder="${id}"]`, String(n));
  // B is Out: open More, press Out.
  app.$(`[data-emore="${ib}"] summary`).click();
  app.click(`[data-eout="${ib}"]`);
  assert.equal(app.$(`[data-erow="${ib}"]`).classList.contains("out"), true);
  assert.equal(app.doc.activeElement, app.$(`[data-eout="${ib}"]`));
  for (const [id, cond, rounds] of [[ia, "deafened", "1"], [ic, "dying", ""]]) {
    app.click(`[data-econdopen="${id}"]`); changeTo(app, "[data-econd-id]", cond); type(app, "[data-econd-rounds]", rounds); app.click("[data-econd-add]");
  }
  app.click("[data-enc-start]");
  app.click("[data-enext]");
  assert.equal(app.$$("[aria-current=step]").map(x => x.dataset.erow).join(), ic, "Next skipped Out");
  app.click("[data-enext]");
  assert.match(app.$("#main").textContent, new RegExp(`Dying: ${app.D.damageRules.whileDying.resetCheck}`));
  app.click(`[data-emarks$="|1"]`);
  assert.match(app.$(".enc-reset").textContent, /Death Marks 1\/3/);
  // Deafened: End is pressed; Keep keeps it.
  const keep = app.$(`[data-ekeep="${ia}|0|keep"]`), end = app.$(`[data-ekeep="${ia}|0|end"]`);
  assert.equal(end.getAttribute("aria-pressed"), "true");
  keep.click();
  assert.equal(app.$(`[data-ekeep="${ia}|0|keep"]`).getAttribute("aria-pressed"), "true");
  app.click("[data-efinish]");
  const e = statesOf(app)[0];
  assert.deepEqual(e.rows.find(r => r.id === ia).conditions.map(x => [x.id, x.rounds]), [["deafened", 1]]);
  assert.equal(e.round, 2);
  assert.equal(e.rows.find(r => r.id === ic).conditions[0].marks, 1);
  assert.deepEqual(app.errors, []);
});

test("Decision 190: Add to cast and Add to the encounter open; two planned, the button names the one open; a group adds every member", () => {
  const app = tableWithPack();
  app.window.eval(`Engine.addEncounter(S.table, { name: "First" }); Engine.addEncounter(S.table, { name: "Second" });`);
  entryButton(app, "gull").click();
  assert.equal(app.$("[data-tuse]").textContent, "Add to cast");
  assert.equal(app.$("[data-tenc]").textContent, "Add to Second", "with none open, the newest planned (211)");
  app.click('[data-tsec="encounters"]');
  app.$$("[data-enc-open]").find(b => b.textContent === "Second").click();
  app.click('[data-tsec="threats"]');
  assert.equal(app.window.eval("S.threatOpen"), null, "the Threats tab kept its page across a tab switch");
  entryButton(app, "gull").click();
  assert.equal(app.$("[data-tenc]").textContent, "Add to Second");
  const btn = app.$("[data-tenc]"); btn.focus();
  app.click("[data-tenc]"); app.click("[data-tenc]");
  assert.match(app.$("#undotoast").textContent, /Gull 2 is in Second\./);
  assert.equal(app.window.eval("S.tsection"), "threats", "the page didn't stay");
  assert.equal(app.$("[data-tenc]"), btn, "the page was redrawn under the button");
  assert.equal(app.doc.activeElement, btn);
  const ids = app.window.eval("S.table.encounters.map(e => e.name + ':' + e.rows.map(r => r.name).join('|'))");
  assert.deepEqual([...ids], ["Second:Gull|Gull 2", "First:"]);
  assert.equal(app.window.eval("S.table.cast.length"), 0, "Add to the encounter touched the cast");
  // A group: every member, and back on the list the button names the other one.
  app.click("[data-tback]"); app.click('[data-tview="group"]'); app.click("[data-tgroup]");
  assert.equal(app.$("[data-tgrpenc]").textContent, "Add to Second");
  app.click("[data-tgrpenc]");
  assert.match(app.$("#undotoast").textContent, /Pier Watch: 4 added to Second\./);
  assert.equal(app.window.eval("S.table.encounters[0].rows.length"), 6);
  app.click('[data-tsec="encounters"]'); app.click("[data-enc-back]");
  app.$$("[data-enc-open]").find(b => b.textContent === "First").click();
  app.click('[data-tsec="threats"]'); app.click('[data-tview="group"]'); app.click("[data-tgroup]");
  assert.equal(app.$("[data-tgrpenc]").textContent, "Add to First");
  // Add to cast does what Use did.
  app.click("[data-tback]"); app.click('[data-tview="threat"]'); entryButton(app, "gull").click(); app.click("[data-tuse]");
  assert.equal(app.window.eval("S.tsection"), "cast");
  assert.equal(app.window.eval("S.table.cast.length"), 1);
  // A cast member's page offers the encounter, and Back from a row returns to it.
  assert.equal(app.$("[data-cenc]").textContent, "Add to First");
  app.click("[data-cenc]");
  assert.match(app.$("#undotoast").textContent, /Gull is in First\./);
  app.click("[data-cenc]");
  assert.match(app.$("#undotoast").textContent, /Already in\./);
  app.click('[data-tsec="encounters"]');
  assert.ok(app.$("[data-enc-back]"), "the encounter wasn't kept open");
  app.click("[data-eopencast]");
  assert.equal(app.$("[data-cback]").textContent, "Back to First");
  app.click("[data-cback]");
  assert.equal(app.window.eval("S.tsection"), "encounters");
  assert.ok(app.$("[data-enc-title]"));
  assert.equal(app.doc.activeElement, app.$("[data-eopencast]"));
  assert.deepEqual(app.errors, []);
});

test("Decision 188: an ended encounter offers no Add to, a cast row survives its member being removed, and export keeps the encounters", async () => {
  const app = tableWithPack(); const downloads = withDownloads(app);
  app.window.eval(`Engine.addCastMember(S.table, { name: "Dez" }); Engine.addEncounter(S.table, { name: "Done" }); Engine.addParticipant(S.table, S.table.encounters[0].id, { kind: "cast", id: S.table.cast[0].id });`);
  app.click('[data-tsec="encounters"]'); app.click("[data-enc-open]");
  app.click("[data-eopencast]"); app.click("[data-cdel]"); app.click("#modal [data-askyes]");
  app.click('[data-tsec="encounters"]');
  const li = app.$("[data-erow]");
  assert.equal(li.querySelector(".enc-name").textContent, "Dez");
  assert.equal(li.querySelector("[data-eopencast]"), null, "a removed member is a button");
  assert.match(li.textContent, /0 taken/);
  app.click("[data-enc-end]"); app.click("#modal [data-askyes]");
  app.click('[data-tsec="threats"]'); entryButton(app, "gull").click();
  assert.equal(app.$("[data-tenc]").textContent, "Add to a new encounter", "an ended encounter is never a target (211)");
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  const file = await tableFile(downloads[0]);
  assert.equal(file.encounters.length, 1); assert.equal(file.encounters[0].status, "ended");
  const fresh = boot({ storage: GM_ON }); withDownloads(fresh);
  await importFile(fresh, file);
  assert.equal(JSON.parse(fresh.window.eval("JSON.stringify(S.table.encounters)"))[0].rows[0].name, "Dez");
  assert.deepEqual([...app.errors, ...fresh.errors], []);
});

test("Decision 188: export and import mid-round and at Reset keep the same encounter and turn", async () => {
  const app = boot({ storage: GM_ON }); const downloads = withDownloads(app);
  runTable(app, "T"); encTab(app); newEncounter(app, "E");
  const a = addPcRow(app, "A"), b = addPcRow(app, "B");
  changeTo(app, `[data-eorder="${rowId(a)}"]`, "5"); changeTo(app, `[data-eorder="${rowId(b)}"]`, "3");
  app.click("[data-enc-start]"); app.click("[data-enext]");
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  let file = await tableFile(downloads[0]);
  assert.equal(file.encounters[0].turn, rowId(b)); assert.equal(file.encounters[0].round, 1);
  app.click("[data-enext]");
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  file = await tableFile(downloads[1]);
  assert.equal(file.encounters[0].turn, null); assert.equal(file.encounters[0].status, "running");
  const fresh = boot({ storage: GM_ON }); withDownloads(fresh);
  await importFile(fresh, file);
  fresh.click('[data-tsec="encounters"]');
  assert.match(fresh.$("#main").textContent, /Round 1/);
  fresh.click("[data-enc-open]");
  assert.match(fresh.$("#main").textContent, /Reset: round 1 ends/);
  assert.deepEqual([...app.errors, ...fresh.errors], []);
});

// ── Fix round (review of #126) ─────────────────────────────────────────
test("Decision 189 (review): the Encounters tab's listeners on <main> go when the table closes; Done tags who has acted; a negative Take is refused; Dying shows F24's line", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); encTab(app); newEncounter(app, "E");
  const a = addPcRow(app, "A"), b = addPcRow(app, "B");
  const [ia, ib] = [a, b].map(rowId);
  changeTo(app, `[data-eorder="${ia}"]`, "9"); changeTo(app, `[data-eorder="${ib}"]`, "5");
  app.click(`[data-econdopen="${ia}"]`); changeTo(app, "[data-econd-id]", "dying"); app.click("[data-econd-add]");
  app.click(`[data-econdopen="${ia}"]`); changeTo(app, "[data-econd-id]", "bleeding"); app.click("[data-econd-add]");
  app.click("[data-enc-start]"); app.click("[data-enext]");
  assert.match(app.$(`[data-erow="${ia}"]`).textContent, /Done/);
  assert.doesNotMatch(app.$(`[data-erow="${ib}"]`).textContent, /Done/);
  // A negative number in Take or Heal is refused, not applied.
  app.click(`[data-edmg="${ib}|1"]`);
  assert.equal(app.$("[data-edmgn]").min, "0");
  app.$("[data-edmgn]").value = "-4"; submit(app, "[data-edmgform]");
  assert.match(app.$("#undotoast").textContent, /Enter a whole number\./);
  assert.equal(app.window.eval("S.table.encounters[0].rows.find(r => r.id === " + JSON.stringify(ib) + ").damage"), 0);
  app.click("[data-edmgcancel]");
  app.click("[data-enext]");
  const W = app.D.damageRules.whileDying;
  assert.match(app.$(".enc-reset").textContent, new RegExp(W.text.slice(0, 20)));
  assert.match(app.$(".enc-reset").textContent, /1 source ticked/);
  assert.doesNotMatch(app.$(".enc-reset").textContent, new RegExp(W.resetCheck));
  assert.ok(app.$("main").onclick, "the tab's listener wasn't there to begin with");
  app.click("[data-menu-toggle]"); app.click("[data-thome]");
  for (const k of ["onclick", "onchange", "oninput", "onsubmit", "onkeydown"]) assert.equal(app.$("main")[k], null, `main.${k} survived the table`);
  assert.deepEqual(app.errors, []);
});

// ── The hit (Decisions 191–192) ────────────────────────────────────────
const JACKET_LINE = "Leather Jacket (PROT 1d4, RES +2, INT 10, Medium Coverage, Uncommon, 1 mod, 175Ç)";
// A running encounter with Dez (BOD 8, a Leather Jacket, two traits) as a cast row and Wren as a PC row.
const hitApp = (block = {}) => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  app.window.eval(`Engine.addCastMember(S.table, { name: "Dez" }); Engine.setCastBlock(S.table, S.table.cast[0].id, ${JSON.stringify({
    stats: { BOD: 8 }, armor: [JACKET_LINE], traits: [{ name: "Cold", text: "Never flinches." }, { name: "Loud", text: "Shouts." }], ...block })});
    const e = Engine.addEncounter(S.table, { name: "Job" }).id;
    Engine.addParticipant(S.table, e, { kind: "cast", id: S.table.cast[0].id });
    Engine.editParticipant(S.table, e, Engine.addParticipant(S.table, e, { kind: "pc", name: "Wren" }).id, { hp: 30, levels: 6 });
    Engine.editParticipant(S.table, e, S.table.encounters[0].rows[0].id, { order: 9 });
    Engine.startEncounter(S.table, e);`);
  encTab(app);
  app.click("[data-enc-open]");
  return app;
};
const hitBtn = (app, name) => app.$(`[data-ehit="${rowId(encRowByName(app, name))}"]`);
const preview = app => app.$("[data-ehit-preview]").textContent;
const fillHit = (app, damage, kind = "ballistic", from = "") => {
  type(app, "[data-ehit-damage]", String(damage)); changeTo(app, "[data-ehit-type]", kind);
  if (from) type(app, "[data-ehit-from]", from);
};

test("Decision 191: the armor line, then a hit previews what the armor stops and Apply lands it on the row", () => {
  const app = hitApp();
  const dez = () => encRowByName(app, "Dez");
  assert.match(dez().querySelector(".enc-armor").textContent, /^Leather Jacket · stops 5 · INT 10\/10$/);
  assert.equal(app.$$(".enc-armor").length, 1, "PC rows show no armor line");
  assert.ok(hitBtn(app, "Wren"), "a PC row has Hit too");
  hitBtn(app, "Dez").click();
  assert.equal(app.doc.activeElement, app.$("[data-ehit-damage]"), "Hit didn't land on Damage");
  assert.equal(preview(app), "Enter the damage.");
  for (const g of app.$$("[data-ehitpanel] [role=group]")) assert.ok((g.getAttribute("aria-label") || "").trim() || g.getAttribute("aria-labelledby"), "a toggle group in the Hit panel has no accessible name");
  assert.ok(app.$$("[data-ehitpanel] [role=group]").length >= 2, "the Hit panel's toggle groups weren't found");
  assert.ok(app.$("[data-ehit-apply]").disabled, "Apply was live with no damage");
  fillHit(app, 12, "ballistic", "Rook's SMG");
  assert.equal(preview(app), "Leather Jacket stops 5 (PROT 3 + RES 2) · 7 through · 1 Health Level");
  assert.match(app.$(".enc-hit").textContent, /Enemy armor is static and doesn't roll\./);
  assert.equal(app.$("[data-ehit-damage]").value, "12", "typing in a later field cleared an earlier one");
  const bleeding = app.$('[data-ehit-cond="bleeding"]');
  assert.ok(bleeding, "Bleeding isn't offered"); assert.equal(bleeding.checked, false);
  assert.ok(app.$('.enc-hit [data-tip="condition"][data-term="bleeding"]'), "the Condition's rule isn't a tap away");
  bleeding.click();
  app.click("[data-ehit-apply]");
  assert.equal(app.$("[data-ehitpanel]"), null, "the panel stayed open");
  assert.match(dez().textContent, /HP 33 \/ 40 · 7 taken · 7 of 8 Health Levels/);
  assert.match(dez().querySelector(".enc-conds").textContent, /Bleeding/); assert.match(dez().querySelector(".enc-conds").textContent, /Rook's SMG/);
  assert.equal(app.doc.activeElement, hitBtn(app, "Dez"), "Apply didn't return to Hit");
  // A soaked hit costs the piece 1 INT.
  hitBtn(app, "Dez").click(); fillHit(app, 4); app.click("[data-ehit-apply]");
  assert.match(dez().querySelector(".enc-armor").textContent, /INT 9\/10/);
  // Cancel returns to Hit and writes nothing.
  const before = JSON.stringify(statesOf(app));
  hitBtn(app, "Dez").click(); fillHit(app, 50); app.click("[data-ehit-cancel]");
  assert.equal(app.$("[data-ehitpanel]"), null); assert.equal(app.doc.activeElement, hitBtn(app, "Dez"));
  assert.equal(JSON.stringify(statesOf(app)), before);
  assert.deepEqual(app.errors, []);
});

test("Decision 192: Shock and At Zero show the check and the Conditions, never the rule's own words; Failed adds them, unanswered adds nothing", () => {
  const app = hitApp();
  const dez = () => encRowByName(app, "Dez"), conds = () => statesOf(app)[0].rows.find(r => r.name === "Dez").conditions.map(c => [c.id, c.source]);
  hitBtn(app, "Dez").click(); fillHit(app, 30, "ballistic", "Rook");
  const panel = app.$("[data-ehitpanel]").textContent;
  assert.match(panel, /Shock: BOD Essence Check TN 8 TH 2\. Failed: Unconscious, Prone\./);
  assert.doesNotMatch(panel, /took half|\byour\b/i, "a prompt's own words reached the GM's panel");
  assert.equal(app.$$("[data-ehit-ans]").length, 2);
  const fail = () => app.$('[data-ehit-ans="shock|fail"]');
  fail().click();
  assert.equal(fail().getAttribute("aria-pressed"), "true"); assert.equal(app.doc.activeElement, fail(), "Failed lost the keyboard");
  fail().click();
  assert.equal(fail().getAttribute("aria-pressed"), "false", "a second press clears the answer");
  fail().click();
  app.click("[data-ehit-apply]");
  assert.deepEqual(JSON.parse(JSON.stringify(conds())), [["unconscious", "Rook"], ["prone", "Rook"]]);
  assert.match(dez().querySelector(".enc-conds").textContent, /Unconscious/);
  // To zero: the At Zero prompt; left unanswered the row reads Down and gains nothing.
  hitBtn(app, "Dez").click(); fillHit(app, 60);
  assert.match(app.$("[data-ehitpanel]").textContent, /At zero: WILL Essence Check TN 8 TH 2\. Passed: Unconscious, Prone\. Failed: Dying\./);
  app.click("[data-ehit-apply]");
  assert.match(dez().textContent, /Down/); assert.equal(conds().length, 2);
  // Down and hit again: At Zero is asked again; Failed is Dying; then a hit while Dying is a Death Mark.
  hitBtn(app, "Dez").click(); fillHit(app, 20);
  app.click('[data-ehit-ans="atZero|fail"]'); app.click("[data-ehit-apply]");
  assert.ok(conds().some(c => c[0] === "dying"));
  hitBtn(app, "Dez").click(); fillHit(app, 20);
  assert.match(app.$("[data-ehitpanel]").textContent, /Dying: this hit is a Death Mark\./);
  app.click("[data-ehit-apply]");
  assert.match(dez().querySelector(".enc-conds").textContent, /Death Marks 1\/3/);
  assert.deepEqual(app.errors, []);
});

test("Decision 191: Massive takes Health Levels and scraps the armor; an arm on a Light piece isn't covered; AP skips RES", () => {
  const app = hitApp({ armor: ["Kevlar Vest (PROT 1d6, RES +2, INT 20, Light Coverage, Mid, 900Ç)"] });
  const dez = () => encRowByName(app, "Dez");
  assert.match(dez().querySelector(".enc-armor").textContent, /^Kevlar Vest · stops 6 · INT 20\/20$/);
  hitBtn(app, "Dez").click(); fillHit(app, 12); changeTo(app, "[data-ehit-loc]", "left-arm");
  assert.equal(preview(app), "Not covered: Left Arm · 12 through · 2 Health Levels");
  changeTo(app, "[data-ehit-loc]", "torso"); app.click("[data-ehit-ap]");
  assert.equal(preview(app), "Kevlar Vest stops 4 (PROT 4) · RES doesn't apply: AP · 8 through · 1 Health Level");
  changeTo(app, "[data-ehit-type]", "energy"); app.click("[data-ehit-ap]");
  assert.match(preview(app), /RES doesn't apply: not against Energy/);
  assert.equal(app.doc.activeElement, app.$("[data-ehit-ap]"));
  app.click('[data-ehit-cat="massive"]');
  type(app, "[data-ehit-damage]", "25");
  assert.equal(preview(app), "Massive: 3 Health Levels gone · Kevlar Vest scrapped");
  app.click("[data-ehit-apply]");
  assert.match(dez().textContent, /5 of 8 Health Levels/);
  assert.match(dez().querySelector(".enc-armor").textContent, /^Kevlar Vest · Scrap$/);
  assert.equal(statesOf(app)[0].rows[0].massive, 3);
  assert.deepEqual(app.errors, []);
});

test("Decision 191: a PC row takes what got through; Shock and At Zero are reminders with nothing to answer", () => {
  const app = hitApp();
  const wren = () => encRowByName(app, "Wren");
  hitBtn(app, "Wren").click();
  assert.match(app.$("[data-ehitpanel]").textContent, /Got through/);
  assert.equal(app.$("[data-ehit-ap]"), null, "a PC row has no AP");
  fillHit(app, 12, "ballistic");
  assert.equal(preview(app), "12 through · 2 Health Levels");
  app.$('[data-ehit-cond="bleeding"]').click();
  app.click("[data-ehit-apply]");
  assert.match(wren().textContent, /HP 18 \/ 30 · 12 taken · 4 of 6 Health Levels/);
  assert.match(wren().querySelector(".enc-conds").textContent, /Bleeding/);
  hitBtn(app, "Wren").click(); fillHit(app, 15, "energy");
  assert.match(app.$("[data-ehitpanel]").textContent, /Shock: they make a BOD Essence Check TN 8 TH 2 on their sheet\. Failed: Unconscious, Prone\./);
  assert.equal(app.$$("[data-ehit-ans]").length, 0, "a PC row's Shock is a reminder, not a question");
  app.click('[data-ehit-cat="massive"]');
  assert.match(app.$("[data-ehitpanel]").textContent, /Health Levels gone/);
  type(app, "[data-ehit-damage]", "2");
  assert.equal(preview(app), "Massive: 2 Health Levels gone");
  app.click("[data-ehit-apply]");
  assert.match(wren().textContent, /HP 8 \/ 30/); assert.equal(statesOf(app)[0].rows.find(r => r.name === "Wren").massive, 2);
  // A cast member with no BOD has no Hit.
  app.window.eval(`Engine.addCastMember(S.table, { name: "Ivo" }); Engine.addParticipant(S.table, S.table.encounters[0].id, { kind: "cast", id: S.table.cast.find(n => n.name === "Ivo").id }); renderTable();`);
  assert.equal(hitBtn(app, "Ivo"), null);
  assert.deepEqual(app.errors, []);
});

test("Decision 192: the active row lists its traits, and a trait's text is a tap away; Next keeps a Hit panel open on its row", () => {
  const app = hitApp();
  const active = () => app.$("[aria-current=step]");
  assert.match(active().querySelector(".enc-traits").textContent, /Traits:\s*Cold\s*Loud/);
  clickIn(app, active().querySelector('[data-tip="enctrait"]'));
  assert.match(tipShown(app), /Never flinches\./);
  assert.equal(app.$$(".enc-traits").length, 1, "only the active row shows its traits");
  hitBtn(app, "Dez").click(); fillHit(app, 5);
  app.click("[data-enext]");
  assert.equal(app.$$("[aria-current=step] .enc-name").map(x => x.textContent).join(), "Wren");
  assert.ok(app.$("[data-ehitpanel]"), "Next closed the panel");
  assert.equal(app.$("[data-ehit-damage]").value, "5", "its fields were lost");
  assert.equal(app.doc.activeElement, app.$("[data-enext]"));
  assert.equal(app.$(".enc-traits"), null, "a row with no traits shows none");
  // Opening Take closes Hit, and the other way round.
  app.click(`[data-edmg="${rowId(encRowByName(app, "Wren"))}|1"]`);
  assert.equal(app.$("[data-ehitpanel]"), null);
  hitBtn(app, "Wren").click();
  assert.equal(app.$("[data-edmgform]"), null);
  assert.deepEqual(app.errors, []);
});

test("Decision 191 (hostile): a block's armor line of markup is text, and the panel's fields come out as text", () => {
  const app = hitApp({ armor: ["<img src=x onerror=window.__pwn=1> (PROT 1d4)"], traits: [{ name: "<b>x</b>", text: "<img src=y onerror=window.__pwn=1>" }] });
  assert.match(encRowByName(app, "Dez").querySelector(".enc-armor").textContent, /^<img src=x onerror=window\.__pwn=1> \(PROT 1d4\) · not in the Gear tables$/);
  hitBtn(app, "Dez").click(); fillHit(app, 5, "blade", "<img src=z onerror=window.__pwn=1>");
  app.click('[data-ehit-cond="bleeding"]'); app.click("[data-ehit-apply]");
  clickIn(app, app.$('[data-tip="enctrait"]'));
  assert.equal(app.window.__pwn, undefined, "markup ran");
  assert.equal(app.$("#main img"), null);
  assert.equal(app.$("#tip img"), null);
  assert.deepEqual(app.errors, []);
});

// ── The encounter's end (Decision 193) ─────────────────────────────────
// Synthetic names only: Dez at the cast, two Gulls from a pack, Wren (hit) and Rook as the crew.
const wrapApp = () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  app.window.eval(`Engine.addCastMember(S.table, { name: "Dez" }); Engine.setCastBlock(S.table, S.table.cast[0].id, { stats: { BOD: 8 }, skills: [] });
    const pack = Engine.migratePack(${JSON.stringify(syntheticPack())});
    const e = Engine.addEncounter(S.table, { name: "Job" }).id;
    const dez = Engine.addParticipant(S.table, e, { kind: "cast", id: S.table.cast[0].id }).id;
    Engine.participantFromEntry(S.table, e, pack, "gull"); Engine.participantFromEntry(S.table, e, pack, "gull");
    const wren = Engine.addParticipant(S.table, e, { kind: "pc", name: "Wren" }).id;
    Engine.addParticipant(S.table, e, { kind: "pc", name: "Rook" });
    Engine.startEncounter(S.table, e);
    Engine.participantDamage(S.table, e, dez, 2); Engine.participantDamage(S.table, e, wren, 5);
    Engine.participantAddCondition(S.table, e, dez, { id: "prone" });`);
  encTab(app);
  app.click("[data-enc-open]");
  return app;
};
const wrapRow = (app, name) => app.$$("[data-ewrow]").find(li => li.querySelector(".enc-name").textContent === name);
const castLine193 = app => app.window.eval("S.table.cast.map(n => n.name + ':' + n.status).join('|')");

test("Decision 193: End on a running encounter opens the wrap-up, the cast row's line on and Keep off", () => {
  const app = wrapApp();
  app.click("[data-enc-end]");
  assert.equal(app.$("#modal [data-askyes]"), null, "a running encounter's End opens a wrap-up, not a question");
  assert.equal(app.doc.activeElement, app.$("[data-ew-h]"));
  assert.match(app.$("[data-ew-h]").textContent, /Wrap up Job/);
  assert.equal(app.$("[data-enext]"), null);
  assert.equal(app.$$("[data-ewrow]").length, 3, "PC rows aren't wrapped up");
  const dez = wrapRow(app, "Dez");
  assert.match(dez.textContent, /\d+ of 8 Health Levels · Prone/);
  assert.equal(dez.querySelector("[data-ew-line]").checked, true);
  assert.match(dez.querySelector("[data-ew-text]").value, /^Fought them in Job: \d+ of 8 Health Levels left; Prone\.$/);
  for (const n of ["Gull", "Gull 2"]) assert.equal(wrapRow(app, n).querySelector("[data-ew-keep]").checked, false);
  assert.equal(wrapRow(app, "Gull").querySelector("[data-ew-name]"), null, "Keep's fields show once it's ticked");
  // How hard was it names the die, and only the PC who was hit.
  assert.equal(app.$("[data-ew-says]").textContent, "");
  changeTo(app, "[data-ew-diff]", "hard");
  assert.equal(app.$("[data-ew-says]").textContent, "Wren: roll 1d8 for armor wear on your sheet.");
  assert.equal(app.doc.activeElement, app.$("[data-ew-diff]"));
  assert.deepEqual(app.errors, []);
});

test("Decision 193: Keep one, rename it, set another Dead, End the encounter: the cast, the lines and Kept as", () => {
  const app = wrapApp();
  app.click("[data-enc-end]");
  const keep = wrapRow(app, "Gull").querySelector("[data-ew-keep]");
  keep.checked = true; keep.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(app.doc.activeElement, app.$(`[data-ew-keep="${keep.dataset.ewKeep}"]`));
  const name = wrapRow(app, "Gull").querySelector("[data-ew-name]");
  assert.equal(name.value, "Gull");
  type(app, `[data-ew-name="${name.dataset.ewName}"]`, "Old Gull");
  changeTo(app, `[data-ewrow] [data-ew-status="${wrapRow(app, "Dez").dataset.ewrow}"]`, "dead");
  assert.equal(app.window.eval("S.table.cast.length"), 1, "nothing is written before End the encounter");
  app.click("[data-ew-end]");
  assert.equal(app.doc.activeElement, app.$("[data-enc-new]"));
  assert.equal(castLine193(app), "Old Gull:alive|Dez:dead");
  assert.equal(app.window.eval("S.table.interactions.map(x => x.kind).sort().join()"), "fought,killed");
  // Past encounters: the kept row reads Kept as, and it opens the member, whose Back returns.
  app.click("[data-enc-open]");
  assert.equal(app.$("[data-ew-h]"), null);
  const kept = app.$$("[data-erow] .enc-kept").map(p => p.textContent);
  assert.deepEqual(kept, ["Kept as Old Gull"]);
  app.click("[data-erow] .enc-kept [data-eopencast]");
  assert.match(app.$("#main").textContent, /Old Gull/);
  assert.match(app.$("#main").textContent, /Fought them/);
  app.click("[data-cback]");
  assert.match(app.$(".enc-status").textContent, /Ended/);
  // Dez's page lists the Killed line.
  app.click("[data-eopencast]");
  assert.match(app.$("#main").textContent, /Killed them/);
  assert.deepEqual(app.errors, []);
});

test("Decision 193: Cancel writes nothing and returns to the running encounter", () => {
  const app = wrapApp();
  const before = app.window.eval("JSON.stringify(S.table)");
  app.click("[data-enc-end]");
  const keep = wrapRow(app, "Gull").querySelector("[data-ew-keep]");
  keep.checked = true; keep.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  changeTo(app, `[data-ew-status="${wrapRow(app, "Dez").dataset.ewrow}"]`, "dead");
  app.click("[data-ew-cancel]");
  assert.equal(app.doc.activeElement, app.$("[data-enc-end]"));
  assert.ok(app.$("[data-enext]"), "the running encounter is back");
  assert.equal(app.window.eval("JSON.stringify(S.table)"), before);
  assert.deepEqual(app.errors, []);
});

test("Decision 193: a planned encounter's End asks as before and opens no wrap-up", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  encTab(app); newEncounter(app, "Soon");
  app.click("[data-enc-end]");
  assert.ok(app.$("#modal [data-askyes]"));
  app.click("#modal [data-askyes]");
  assert.equal(app.$("[data-ew-h]"), null);
  assert.equal(app.window.eval("S.table.encounters[0].status"), "ended");
  assert.deepEqual(app.errors, []);
});

test("Decision 193: Add an interaction offers Fought them last", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  app.window.eval(`Engine.addCastMember(S.table, { name: "Dez" })`);
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  const kinds = app.$$("[data-iakind]");
  assert.equal(kinds[kinds.length - 1].textContent, "Fought them");
  assert.equal(kinds.length, 8);
});

// ── The Werewolf to 0414 (crb-v4-sync P3, Decisions 195–197) ─────────
function wolf(origin) {
  const ch = lockedCharacter();
  ch.identity.archetype = "werewolf";
  ch.archetypeChoices.specialization = [origin];
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 8;
  ch.progression.ip.earned = 200;
  return ch;
}

test("Main shifts a Forge Fang: the switch names the HL it costs, Claws and Fangs lead the weapons, BOD reads 12, and one Undo takes it all back", () => {
  const app = openSheet(wolf("forge-fang"), "main");
  const btn = () => app.$('#main .main-form [data-ptoggle="form|Werewolf"]');
  assert.ok(btn(), "Main has no Form switch");
  assert.match(btn().textContent, /Werewolf \(1 HL of Withering damage\)/, "the switch doesn't say what shifting costs");
  assert.equal(app.$$("#main .main-combat tbody tr").filter(r => /Claws|Fangs/.test(r.textContent)).length, 0, "claws before the shift");
  app.click('#main .main-form [data-ptoggle="form|Werewolf"]');
  const ch = activeChar(app);
  assert.equal(ch.panelData.form, "Werewolf");
  assert.deepEqual([ch.trackers.damage, ch.trackers.witheringDamage], [7, 7], "the shift didn't spend one shifted HL as Withering");
  const rows = app.$$("#main .main-combat tbody tr").map(r => r.textContent.replace(/\s+/g, " "));
  assert.match(rows[0], /^ ?Claws ?Werewolf form · Melee ?1d10 \+ \d+ ?20 ?—/);
  assert.match(rows[1], /^ ?Fangs ?Werewolf form · Melee ?1d10 \+ \d+ ?22 ?—/);
  assert.match(app.$("#main .main-form").textContent, /\+2 REF, \+2 MOB and \+4 BOD/);
  const bod = app.$$("#main .statcell").find(c => c.querySelector(".sid").textContent === "BOD");
  assert.match(bod.textContent, /12.*\+4 form/s, "the stat block doesn't show the shifted BOD");
  assert.match(app.$("#main .cond.hp").textContent, /10 HL × 7/);
  app.click('[data-sec="sessions"]');
  assert.match(app.$("#main").textContent, /Form: Werewolf \(1 HL Withering\)/, "the Activity Log doesn't name the shift and its cost");
  app.click("button[data-undolast]");
  const back = activeChar(app);
  assert.deepEqual([back.panelData.form || null, back.trackers.damage, back.trackers.witheringDamage], [null, 0, 0]);
  assert.deepEqual(app.errors, []);
});

test("a Trueborn's sheet: the powers with ranks and costs, Base Powers with its note, Raise a Power past the book's 3, Call of the Wild's step, and TECH barred while shifted", () => {
  const ch = wolf("trueborn");
  ch.progression.powerIpe = { "apex-fury": 2 };
  ch.progression.ip.log.push({ date: "2026-10-08", kind: "spend", amount: 20, targetType: "power", targetId: "apex-fury", from: 1, to: 2, name: "Apex Fury", note: "" },
                             { date: "2026-10-08", kind: "spend", amount: 40, targetType: "power", targetId: "apex-fury", from: 2, to: 3, name: "Apex Fury", note: "" });
  ch.panelData.form = "Werewolf";
  const app = openSheet(ch, "character");
  const text = app.$("#main").textContent;
  assert.match(text, /Base Powers 1 · Max Starting Rank 1/);
  assert.match(text, /What your Base Powers add on top is your GM's call for now/, "F38's player note isn't beside the powers");
  const apex = app.$$("#main .pick").find(p => /^Apex Fury/.test(p.querySelector("h2").textContent));
  assert.match(apex.textContent, /rank 3.*3 SFR.*Per rank: Rank 2: anywhere\. Rank 3: anytime\./s);
  assert.ok(!/Steel Fangs|Predator's Allure|EMP/.test(text), "a Trueborn sees another Origin's powers or EMP");
  assert.match(text, /summon a pack of allied wolves/, "the pack text isn't under the powers");

  app.click('[data-sec="progression"]');
  app.click('[data-raiseopen="power"]');
  const row = app.$$("[data-raiseresults] tr").find(r => /Apex Fury/.test(r.textContent));
  assert.match(row.textContent, /Archetype power · rank 3 · \+2 from IP · past the book's 3.*3 → 4.*60 IP/s);
  assert.equal(app.$$("[data-raiseresults] tr").length, 11, "Raise a Power doesn't list the Innate five and the Trueborn six");
  app.click("#modal [data-modalclose]");

  app.click('[data-sec="trackers"]');
  app.click('#main [data-trk="call-of-the-wild|1"]');
  const cotw = app.$$("#main .trk").find(t => /Call of the Wild/.test(t.textContent));
  assert.match(cotw.textContent, /Need: An hour of moonlit time under the night sky\. Step 1: Weakened: Moonsworn's passive bonuses fade\./);

  app.click('[data-sec="skills"]');
  const tech = D.skills.filter(s => s.primaryStat === "TECH").map(s => s.name);
  const barred = app.$$("#main tr.skill-line").filter(r => /not while shifted/.test(r.textContent)).map(r => r.querySelector("td").firstChild.textContent.trim());
  assert.equal(barred.sort().join(), tech.sort().join(), "Feral Mind didn't bar exactly the TECH skills");
  assert.deepEqual(app.errors, []);
});

test("Decision 199: Progression lists a Trueborn's own Majors above the shared ones, greys an unmet one, and takes one; the form says what a Major changed", () => {
  const ch = wolf("trueborn");
  ch.progression.milestonePoints = 100;
  const app = openSheet(ch, "progression");
  const text = app.$("#main").textContent;
  assert.match(text, /Werewolf\s*Tireless.*Swift Change.*Between Forms.*The Calling.*General/s, "the Werewolf's Majors aren't listed before the shared ones");
  assert.doesNotMatch(text, /Forge Fang Mark|Wildblood Mark|Off the Leash/, "a Trueborn is offered another Origin's Majors");
  const take = id => app.$(`[data-takemajor="${id}"]`);
  assert.ok(take("between-forms").disabled, "Between Forms is takeable with no Major");
  assert.match(take("between-forms").closest(".pick").textContent, /1 Major Milestone taken/);
  assert.ok(take("clear-head").disabled, "Clear Head is takeable with no Major");
  app.click('[data-takemajor="tireless"]');
  assert.deepEqual(activeChar(app).progression.milestones.major.map(m => m.id), ["tireless"]);
  assert.match(app.$("#main .journal").textContent, /Tireless/, "the journal doesn't name the Werewolf Major");
  assert.ok(!take("between-forms").disabled, "Between Forms stayed locked after a Major");
  app.click('[data-takemajor="clear-head"]');
  app.click('[data-takemajor="iron-jaw"]');

  app.click('[data-sec="main"]');
  app.click('[data-ptoggle="form|Werewolf"]');
  const main = app.$("#main").textContent;
  assert.match(main, /Clear Head: In Werewolf form, you can use TECH-based skills at −2\./, "the form doesn't say what Clear Head changed");
  const claws = app.$$("#main tr").find(r => /^Claws/.test(r.textContent));
  assert.match(claws.textContent, /AP/, "Iron Jaw's AP isn't on the claws");
  app.click('[data-sec="skills"]');
  assert.match(app.$("#main").textContent, /−2 while shifted|-2 while shifted/, "a TECH skill doesn't show Clear Head's penalty");
  assert.doesNotMatch(app.$("#main").textContent, /not while shifted/, "a TECH skill is still barred");
  assert.deepEqual(app.errors, []);
});

// ── The Vampire (0413) in the wizard and on the sheet (crb-v4-sync P4,
// Decisions 200–202) ──────────────────────────────────────────────────────

test("crb-v4-sync P4: the Bloodline step offers three; a Draugur picks a weapon and writes a Code; Base Powers spend, and the lock waits on them", () => {
  const app = onArchetypeStep("vampire", "heroic");   // 3 Base Powers, rank 2
  const main = () => app.$("#main").textContent;
  assert.deepEqual(app.$$("#main [data-spec]").map(b => b.dataset.spec), ["strigoi", "upyr", "draugur"]);
  assert.equal(app.$$('#main [data-step^="bp|"]').length, 0, "Base Powers before a Bloodline");
  app.click('[data-spec="draugur"]');
  assert.deepEqual(app.$$("#main [data-optpick]").map(b => b.dataset.optpick), ["ancient-weapon|blade", "ancient-weapon|blunt", "ancient-weapon|spear"]);
  assert.match(main(), /The Road.*Only those who have chosen violence/s, "the Code's examples aren't shown");
  app.click('[data-optpick="ancient-weapon|spear"]');
  assert.equal(app.$('[data-optpick="ancient-weapon|spear"]').getAttribute("aria-pressed"), "true");
  // A tenet saves as it's typed, without a redraw, so the caret stays.
  const hunt = app.$('[data-opttext="code|hunt"]');
  hunt.focus(); hunt.value = "Only the guilty"; hunt.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  assert.equal(app.window.document.activeElement, hunt, "typing a tenet redrew the field");
  // Innate and the Draugur's own, and no one else's.
  const offered = app.$$('#main [data-step$="|1"]').map(b => b.dataset.step).filter(s => s.startsWith("bp|")).map(s => s.split("|")[1]);
  assert.ok(offered.includes("bestial-blessings") && offered.includes("odins-aegis") && !offered.includes("shadow-play"), offered.join());
  assert.match(main(), /place 3 Base Powers/);
  app.click('[data-step="bp|odins-aegis|1"]');
  app.click('[data-step="bp|odins-aegis|1"]');
  assert.ok(app.$('[data-step="bp|odins-aegis|1"]').disabled, "a power went past Max Starting Rank 2");
  // Review: the Base Power left blocks the lock while something can still take it.
  const steps = D.creationFlow.steps.map(s => s.id);
  app.click(`[data-goto="${steps.length}"]`);   // Review follows the data's steps
  assert.match(main(), /1 Base Power unplaced\. Spend them before you lock/);
  app.click(`[data-goto="${steps.indexOf("archetype")}"]`);
  app.click('[data-step="bp|deathless-resilience|1"]');
  const draft = stored(app, { locked: false });
  assert.deepEqual({ ...draft.archetypeChoices.basePowers }, { "odins-aegis": 2, "deathless-resilience": 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(draft.archetypeChoices.optionPicks)), { "ancient-weapon": "spear", code: { hunt: "Only the guilty" } });
  // Changing Bloodline takes back the old one's ranks and choices; Innate ones stay.
  app.click('[data-step="bp|odins-aegis|-1"]');
  app.click('[data-step="bp|bestial-blessings|1"]');
  app.click('[data-spec="upyr"]');
  const after = stored(app, { locked: false });
  assert.deepEqual([{ ...after.archetypeChoices.basePowers }, { ...after.archetypeChoices.optionPicks }], [{ "bestial-blessings": 1 }, {}]);
  assert.deepEqual(app.$$("#main [data-optpick]").map(b => b.dataset.optpick), ["built-to-last|iron-hide", "built-to-last|icebound-resilience"]);
  assert.deepEqual(app.errors, []);
});

function lockedVampire(bloodline = "draugur") {
  const ch = lockedCharacter();
  ch.identity.archetype = "vampire";
  ch.creation.powerLevel = "heroic";
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 6;
  ch.archetypeChoices.specialization = [bloodline];
  ch.archetypeChoices.basePowers = { "bestial-blessings": 2, "battleborn-instinct": 1 };
  ch.archetypeChoices.optionPicks = { "ancient-weapon": "blade", code: { hunt: "Only the guilty", bond: "The crew", word: "Kept" } };
  return ch;
}

test("crb-v4-sync P4: the Character tab shows the placed powers at their ranks and the Draugur's choices; Main shows the bite, the claws and the blade", () => {
  const app = openSheet(lockedVampire(), "character");
  const text = app.$("#main").textContent;
  assert.match(text, /Bestial Blessings\s*rank 2/);
  assert.match(text, /Battleborn Instinct\s*rank 1/);
  assert.doesNotMatch(text, /Vitality Surge/, "a power never placed is held");
  assert.match(text, /Base Powers 3 · Max Starting Rank 2/);
  assert.match(text, /The Ancient Weapon: Blade/);
  assert.match(text, /The Hunt: Only the guilty/);
  app.click('[data-sec="main"]');
  // Weapon, its line under it, then Dmg in the third cell: BOD 6 + 3, + 4 at rank 2, + 6.
  const weapon = name => { const r = app.$$("#main .main-combat table.ref tbody tr").find(tr => tr.cells[0] && tr.cells[0].firstChild && tr.cells[0].firstChild.textContent === name);
    return r ? [r.querySelector(".lo-sub").textContent, r.cells[2].textContent] : null; };
  assert.deepEqual(weapon("Bite"), ["Fangs of the Fallen · Melee", "9"]);
  assert.deepEqual(weapon("Claws"), ["with Bestial Blessings · rank 2 · Melee", "10"]);
  assert.deepEqual(weapon("Blade"), ["The Ancient Weapon · Melee · Reach 1m · Parry +1", "12"]);
  // Breaking the Code silences the weapon; one Undo restores it.
  app.click('[data-ptoggle="code|Broken"]');
  assert.match(app.$("#main").textContent, /Broken: \+1 TH on every Essence check/);
  assert.match(app.$("#main").textContent, /It doesn't answer while your Code is broken\./);
  app.click("[data-toastundo]");
  assert.equal(stored(app, { locked: true }).panelData.code, undefined);
  assert.deepEqual(app.errors, []);
});

test("crb-v4-sync P4: Feed and A day unfed on Main are one Undo each, and Hunger speaks at RoU", () => {
  const ch = lockedVampire("upyr");
  const app = openSheet(ch, "main");
  const max = Engine.sfr(Engine.migrate(JSON.parse(JSON.stringify(ch)))).value, rou = 6;
  assert.ok(app.$("#main .main-feed"), "no Thirst on Main");
  assert.doesNotMatch(app.$("#main .main-feed").textContent, /Hunger/);
  app.click('[data-unfed="thirst"]');
  assert.equal(stored(app, { locked: true }).trackers.sfr.spent, rou / 2);
  // Down to RoU: the Hunger notice.
  for (let left = max - rou / 2; left > rou; left -= rou / 2) app.click('[data-unfed="thirst"]');
  assert.match(app.$("#main .main-feed").textContent, /Hunger.*WILL Essence check \(TN 7, TH 1\)/s);
  const spent = stored(app, { locked: true }).trackers.sfr.spent;
  // Feed fresh, 2 HL: +6.
  app.click('[data-feedkind="thirst|fresh"]');
  const hl = app.$('[data-feedhl="thirst"]');
  hl.value = "2"; hl.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  app.click('[data-feed="thirst"]');
  assert.equal(stored(app, { locked: true }).trackers.sfr.spent, spent - 6);
  assert.match(app.$("[data-toastundo]").parentElement.textContent, /Fed: 2 HL fresh, \+6 SFR/);
  app.click("[data-toastundo]");
  assert.equal(stored(app, { locked: true }).trackers.sfr.spent, spent, "one Undo didn't take the feed back");
  // A refusal says why and changes nothing.
  hl.value = ""; app.click('[data-feed="thirst"]');
  assert.equal(stored(app, { locked: true }).trackers.sfr.spent, spent);
  // Trackers carries the same panel; Loadout doesn't draw an empty one.
  app.click('[data-sec="trackers"]');
  assert.ok(app.$("#main .trk-feed [data-feed]"));
  app.click('[data-sec="loadout"]');
  assert.doesNotMatch(app.$("#main").textContent, /The Thirst/);
  assert.deepEqual(app.errors, []);
});

test("crb-v4-sync P4: Admin sets a saved Vampire's Bloodline, its choices and its Base Powers, each one Undo", () => {
  const ch = lockedVampire();
  ch.archetypeChoices.specialization = [];
  ch.archetypeChoices.basePowers = {};
  ch.archetypeChoices.optionPicks = {};
  const app = openSheet(ch, "main");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  const sel = app.$("[data-admin-spec]");
  sel.value = "upyr"; sel.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.deepEqual([...stored(app, { locked: true }).archetypeChoices.specialization], ["upyr"]);
  app.click('.admin-arch [data-optpick="built-to-last|iron-hide"]');
  app.click('.admin-arch [data-step="bp|iron-hide|1"]');
  assert.deepEqual({ ...stored(app, { locked: true }).archetypeChoices.basePowers }, { "iron-hide": 1 });
  app.click("[data-toastundo]");
  assert.deepEqual({ ...stored(app, { locked: true }).archetypeChoices.basePowers }, {});
  assert.deepEqual(app.errors, []);
});

// ── Sessions and threads (Decisions 203–204) ────────────────────────────
const dayToday = () => { const d = new Date(), p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const tableReopen = (app, name) => { tableHome(app); tableCard(app, name).querySelector("[data-topen]").click(); };
const sessTab = app => app.click('[data-tsec="sessions"]');
const sessionRows = app => app.$$(".sess-open").map(b => b.textContent);
const typeChange = (app, sel, value) => { const el = app.$(sel); el.value = value; el.dispatchEvent(new app.window.Event("change", { bubbles: true })); };
const addThreadHere = (app, title) => { type(app, "[data-thadd]", title); keyIn(app, "[data-thadd]", "Enter"); };
const nextText = app => app.$(".next-session") ? app.$(".next-session").textContent : app.$("#main").textContent;

test("Decision 204: a new table opens on Sessions, in this tab order, and a table reopens on the tab it was left on", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Landing", { stay: true });
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.deepEqual(app.$$("#topnav .tab").map(b => b.textContent.trim()), ["Sessions", "Cast", "Threats", "Encounters", "Reference", "Notes"]);
  assert.deepEqual(app.$$("[data-tsec]").map(b => b.dataset.tsec), ["sessions", "cast", "threats", "encounters", "reference", "notes"]);
  assert.ok(app.$('[data-tsec="sessions"]').classList.contains("active"));
  tableReopen(app, "Landing");
  assert.equal(app.window.eval("S.tsection"), "sessions", "an untouched table reopens where it was");
  app.click('[data-tsec="cast"]');
  tableReopen(app, "Landing");
  assert.equal(app.window.eval("S.tsection"), "cast", "a table left on Cast reopens on Cast");
  assert.deepEqual(app.errors, []);
});

test("Decision 203: empty, Next session says so in one line; New session opens Session 1 on today, focused on Number", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Empty", { stay: true });
  assert.match(nextText(app), /Nothing yet\. Start a session when you sit down to play, or add a thread you want to follow\./);
  assert.match(app.$("#main").textContent, /No sessions yet\./);
  app.click("[data-snew]");
  assert.equal(app.$("h1.step-title").textContent, "Session 1");
  assert.equal(app.$('[data-sf="number"]').value, "1");
  assert.equal(app.$('[data-sf="date"]').value, dayToday());
  assert.equal(app.doc.activeElement, app.$('[data-sf="number"]'));
  assert.equal(app.$$("[data-sj]").length, 6, "the journal is six boxes");
  assert.deepEqual(app.$$("[data-sj]").map(e => e.dataset.sj), ["happened", "fallout", "threads", "impact", "reflection", "seed"]);
  assert.match(app.$("#main").textContent, /Major events · Key decisions made by the PCs/);
  assert.match(app.$("#main").textContent, /Situation · Likely turning point · Possible escalation/);
  app.click("[data-sback]");
  assert.deepEqual(sessionRows(app), [`Session 1 · ${app.window.eval(`dayText("${dayToday()}")`)}`]);
  assert.equal(app.doc.activeElement.dataset.sopen, app.window.eval("S.table.sessions[0].id"), "Back lands on that session's row");
  assert.deepEqual(app.errors, []);
});

test("Decision 203: every field on a session saves as it's typed with no redraw, and is there after Home and back", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Fields", { stay: true });
  app.click("[data-snew]");
  const num = app.$('[data-sf="number"]');
  type(app, '[data-sf="number"]', "21");
  assert.equal(app.$("h1.step-title").textContent, "Session 21");
  assert.equal(app.$('[data-sf="number"]'), num, "typing redrew the field");
  type(app, '[data-sf="date"]', "2026-09-30");
  type(app, '[data-sf="present"]', "Wren,  Rook ,");
  type(app, '[data-sf="hours"]', "4.5");
  const parts = ["happened", "fallout", "threads", "impact", "reflection", "seed"];
  for (const k of parts) type(app, `[data-sj="${k}"]`, `text ${k}`);
  const s = app.window.eval("S.table.sessions[0]");
  assert.deepEqual([s.number, s.date, s.hours, s.present.join("|")], [21, "2026-09-30", 4.5, "Wren|Rook"]);
  assert.equal(s.journal.seed, "text seed");
  tableReopen(app, "Fields");
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.match(sessionRows(app)[0], /^Session 21 · .* · Wren, Rook · 4\.5 hours$/);
  app.$(".sess-open").click();
  assert.equal(app.$('[data-sf="present"]').value, "Wren, Rook");
  for (const k of parts) assert.equal(app.$(`[data-sj="${k}"]`).value, `text ${k}`);
  // A refused number or hours changes nothing and reads what's stored once it loses focus.
  typeChange(app, '[data-sf="hours"]', "25");
  assert.equal(app.$('[data-sf="hours"]').value, "4.5");
  assert.match(app.$("#undotoast").textContent, /Enter hours, in halves\./);
  typeChange(app, '[data-sf="number"]', "1.5");
  assert.equal(app.$('[data-sf="number"]').value, "21");
  typeChange(app, '[data-sf="number"]', "");
  assert.equal(app.$("h1.step-title").textContent, "Session");
  assert.deepEqual(app.errors, []);
});

test("Decision 204: threads: open one from a session, make it current, add another; Next session orders them; resolving moves it to Closed", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Threads", { stay: true });
  app.click("[data-snew]");
  type(app, "[data-sthadd]", "Find Wren");
  keyIn(app, "[data-sthadd]", "Enter");
  assert.equal(app.doc.activeElement, app.$("[data-sthadd]"));
  assert.equal(app.$("[data-sthadd]").value, "", "the field is emptied");
  assert.equal(app.window.eval("S.table.threads[0].opened"), app.window.eval("S.table.sessions[0].id"));
  assert.match(app.$(".sess-threads").textContent, /Find Wren/);
  app.click("[data-sback]");
  addThreadHere(app, "Pay the fixer");
  assert.equal(app.doc.activeElement, app.$("[data-thadd]"));
  assert.equal(app.$$("[data-thtitle]").length, 2);
  assert.match(nextText(app), /Still open[\s\S]*Find Wren[\s\S]*Pay the fixer/, "oldest first");
  assert.doesNotMatch(nextText(app), /Current/);
  // Current: pressed on one clears the others.
  const cur = title => app.$$("[data-thtitle]").find(e => e.value === title).dataset.thtitle;
  app.click(`[data-thcur="${cur("Pay the fixer")}"]`);
  assert.equal(app.doc.activeElement.dataset.thcur, cur("Pay the fixer"));
  assert.match(app.$(".next-current").textContent, /Current\s*Pay the fixer/);
  assert.match(nextText(app), /Still open\s*Find Wren/);
  app.click(`[data-thcur="${cur("Find Wren")}"]`);
  assert.match(app.$(".next-current").textContent, /Find Wren/);
  assert.equal(app.window.eval("S.table.threads.filter(h => h.current).length"), 1);
  // Resolve the current one: it moves into Closed in Session 1, and no thread is current.
  const id = cur("Find Wren");
  pick(app, `[data-thstatus="${id}"]`, "resolved");
  assert.equal(app.$(".next-current"), null);
  assert.ok(app.$("[data-thshut]").open, "the fold opens");
  assert.ok(app.$("[data-thshut]").querySelector(`[data-thtitle="${id}"]`), "the row moved into Closed");
  assert.equal(app.doc.activeElement, app.$(`[data-thtitle="${id}"]`));
  assert.match(app.$(`[data-thclosed="${id}"]`).selectedOptions[0].textContent, /^Session 1/);
  assert.equal(app.window.eval("S.table.threads.find(h => h.status === 'resolved').closed"), app.window.eval("S.table.sessions[0].id"));
  // Reopen: back up, closed cleared.
  pick(app, `[data-thstatus="${id}"]`, "open");
  assert.equal(app.window.eval("S.table.threads.find(h => h.title === 'Find Wren').closed"), null);
  assert.equal(app.$("[data-thshut]"), null);
  // A blank title is refused and the field shows the stored one.
  typeChange(app, `[data-thtitle="${id}"]`, "  ");
  assert.equal(app.$(`[data-thtitle="${id}"]`).value, "Find Wren");
  assert.match(app.$("#undotoast").textContent, /Name the thread\./);
  // A tap on a thread in Next session opens its More and lands on its title.
  const next = app.$$("[data-thopen]")[0];
  assert.ok(next);
  next.click();
  assert.ok(app.$(`[data-thmore="${next.dataset.thopen}"]`).open);
  assert.equal(app.doc.activeElement.dataset.thtitle, next.dataset.thopen);
  // Delete asks.
  app.click(`[data-thdel="${next.dataset.thopen}"]`);
  assert.ok(app.$("#modal[open]"), "Delete didn't ask");
  app.click("#modal [data-modalclose]");
  assert.equal(app.window.eval("S.table.threads.length"), 2);
  assert.deepEqual(app.errors, []);
});

test("Decision 203: an interaction made on a session's day shows its session on both pages; another day's doesn't; older lines are offered", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Days");
  castAdd(app, "Dez", "a courier");
  app.click("[data-copen]");
  const memberId = app.window.eval("S.table.cast[0].id");
  // Two lines from today, written before there was a session.
  for (const text of ["older line", "older two"])
    app.window.eval(`Engine.addInteraction(S.table, { kind: "shared", cast: ["${memberId}"], crew: ["Wren"], text: "${text}", date: "${dayToday()}" })`);
  app.click("[data-cback]");
  sessTab(app);
  app.click("[data-snew]");
  assert.equal(app.$$("[data-soffered] [data-sadd]").length, 2);
  assert.equal(app.$("[data-sadd]").textContent, "Add to this session");
  app.click("[data-sback]");
  // Now a line on the member's page, today's and another day's.
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  app.click('[data-iakind="shared"]'); type(app, "[data-iwhat]", "today's line"); keyIn(app, "[data-iwhat]", "Enter");
  typeChange(app, "[data-iadate]", "2020-01-01"); type(app, "[data-iwhat]", "other day"); keyIn(app, "[data-iwhat]", "Enter");
  const sid = app.window.eval("S.table.sessions[0].id");
  const bySession = text => app.window.eval(`S.table.interactions.find(x => x.text === ${JSON.stringify(text)}).session`);
  assert.equal(bySession("today's line"), sid, "a new line takes its day's session");
  assert.equal(bySession("other day"), null);
  assert.equal(bySession("older line"), null, "nothing already stored is converted");
  assert.deepEqual(app.$$(".int-session").map(e => e.textContent), ["Session 1"]);
  // The session's page lists today's line, and offers the older two but not the other day's.
  sessTab(app); app.click(".sess-open");
  assert.match(app.$("#main").textContent, /today's line/);
  assert.doesNotMatch(app.$("#main").textContent, /other day/);
  assert.equal(app.$$("[data-soffered] [data-sadd]").length, 2);
  // Add to this session: it moves up, and focus goes to the next offer, then the heading.
  const first = app.$("[data-sadd]"), firstId = first.dataset.sadd;
  first.click();
  assert.equal(app.window.eval(`S.table.interactions.find(x => x.id === "${firstId}").session`), sid);
  assert.equal(app.$$("[data-sadd]").length, 1);
  assert.equal(app.doc.activeElement, app.$("[data-sadd]"));
  app.$("[data-sadd]").click();
  assert.equal(app.$("[data-soffered]"), null);
  assert.equal(app.doc.activeElement, app.$("[data-sint-h]"), "with none left, focus goes to the list's heading");
  // The member's page shows the session on those lines, and Back returns to the session.
  app.click("[data-copen]");
  assert.equal(app.window.eval("S.tsection"), "cast");
  assert.equal(app.$("[data-cback]").textContent, "Back to Session 1", "opened from a session's page, Back names it");
  assert.equal(app.$$(".int-session").length, 3);
  app.click("[data-cback]");
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.ok(app.$("[data-sback]"), "Back from a member opened on a session lands on that session");
  assert.deepEqual(app.errors, []);
});

test("Decision 204: Met last session lists a quick-added member last session named, until they have a number; their name opens their page and Back returns to Sessions", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Met");
  castAdd(app, "Dez", "a courier");
  app.click("[data-copen]");
  app.click('[data-iakind="shared"]'); type(app, "[data-iwhat]", "first meeting"); keyIn(app, "[data-iwhat]", "Enter");
  sessTab(app);
  assert.doesNotMatch(nextText(app), /Met last session/, "no session, no 'last session'");
  app.click("[data-snew]"); app.click("[data-sback]");
  assert.doesNotMatch(nextText(app), /Met last session/, "the line was made before the session, so it isn't linked");
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  app.click('[data-iakind="helped"]'); type(app, "[data-iwhat]", "in the session"); keyIn(app, "[data-iwhat]", "Enter");
  sessTab(app);
  assert.doesNotMatch(nextText(app), /Met last session/, "the session being played today isn't last session");
  app.click(".sess-open"); type(app, '[data-sf="date"]', "2026-09-30"); app.click("[data-sback]");
  assert.match(nextText(app), /Met last session, no stat block yet\s*Dez/);
  app.click(".next-session [data-copen]");
  assert.equal(app.window.eval("S.tsection"), "cast");
  assert.match(app.$("[data-cback]").textContent, /Back to sessions/);
  assert.equal(app.doc.activeElement, app.$("[data-cback]"));
  type(app, '[data-cstat="BOD"]', "6");
  app.click("[data-cback]");
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.doesNotMatch(nextText(app), /Met last session/, "a BOD removes them");
  // Back lands on the name that was pressed, when it's still there.
  app.window.eval("S.table.cast[0].block = null");
  app.window.eval("renderTable()");
  app.click(".next-session [data-copen]"); app.click("[data-cback]");
  assert.equal(app.doc.activeElement.dataset.copen, app.window.eval("S.table.cast[0].id"));
  // The Cast tab's own Back is unchanged.
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  assert.match(app.$("[data-cback]").textContent, /Back to the cast/);
  assert.deepEqual(app.errors, []);
});

test("Decision 204: Next session reads last session's seed under its title, a tap goes to that session", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Seed", { stay: true });
  app.click("[data-snew]");
  type(app, '[data-sf="date"]', "2026-09-30");
  type(app, '[data-sj="seed"]', "The heist goes wrong.");
  app.click("[data-sback]");
  assert.match(nextText(app), /Last session set up\s*Session 1[\s\S]*The heist goes wrong\./);
  // Tonight's session is made: Session 1's seed is still what Next session shows, and tonight isn't last session.
  app.click("[data-snew]");
  assert.equal(app.$("h1.step-title").textContent, "Session 2");
  app.click("[data-sback]");
  assert.match(nextText(app), /Last session set up\s*Session 1[\s\S]*The heist goes wrong\./);
  app.click(".next-session [data-sopen]");
  assert.equal(app.$("h1.step-title").textContent, "Session 1");
  assert.equal(app.doc.activeElement, app.$("[data-sback]"));
  type(app, '[data-sj="seed"]', "   ");
  app.click("[data-sback]");
  assert.doesNotMatch(nextText(app), /Last session set up/, "a blank seed shows nothing");
  assert.match(nextText(app), /Nothing open, and last session set nothing up\./, "sessions but nothing to say still says so");
  assert.deepEqual(app.errors, []);
});

test("Decision 203: Delete a session asks, and afterwards its thread's Closed in and the interaction's session are gone", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Gone");
  castAdd(app, "Dez");
  app.click('[data-tsec="sessions"]');
  app.click("[data-snew]");
  type(app, "[data-sthadd]", "Loose end"); keyIn(app, "[data-sthadd]", "Enter");
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  app.click('[data-iakind="shared"]'); type(app, "[data-iwhat]", "a line"); keyIn(app, "[data-iwhat]", "Enter");
  assert.deepEqual(app.$$(".int-session").map(e => e.textContent), ["Session 1"]);
  sessTab(app); app.click(".sess-open");
  const id = app.$("[data-thopen]").dataset.thopen;
  app.click("[data-sback]");
  pick(app, `[data-thstatus="${id}"]`, "dropped");
  assert.match(app.$(`[data-thclosed="${id}"]`).selectedOptions[0].textContent, /^Session 1/);
  app.click(".sess-open");
  app.click("[data-sdel]");
  assert.ok(app.$("#modal[open]"), "Delete didn't ask");
  assert.match(app.$("#modal").textContent, /Its threads and interactions stay/);
  app.click("#modal [data-modalclose]");
  assert.equal(app.window.eval("S.table.sessions.length"), 1, "Cancel keeps it");
  app.click("[data-sdel]");
  app.click("#modal [data-askyes]");
  assert.equal(app.window.eval("S.table.sessions.length"), 0);
  assert.equal(app.doc.activeElement, app.$("[data-snew]"));
  assert.equal(app.$(`[data-thclosed="${id}"]`).value, "", "the thread no longer says where it closed");
  assert.equal(app.window.eval("S.table.threads[0].opened"), null);
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  assert.equal(app.$$(".int-session").length, 0);
  assert.deepEqual(app.errors, []);
});

test("Decisions 203–204: export and import keep sessions and threads, and a 0.7 table opens as 0.8 with none and every session null", async () => {
  const app = boot({ storage: GM_ON });
  const downloads = withDownloads(app);
  runTable(app, "Round", { stay: true });
  app.click("[data-snew]"); type(app, '[data-sj="happened"]', "Things."); type(app, '[data-sf="present"]', "Wren");
  type(app, "[data-sthadd]", "T1"); keyIn(app, "[data-sthadd]", "Enter");
  const before = JSON.parse(JSON.stringify(app.window.eval("({ s: S.table.sessions, t: S.table.threads })")));
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  const file = await tableFile(downloads[0]);
  assert.equal(file.meta.tableSchemaVersion, "0.11");
  assert.deepEqual(file.sessions, before.s); assert.deepEqual(file.threads, before.t);
  const fresh = boot({ storage: GM_ON });
  withDownloads(fresh);
  await importFile(fresh, file);
  assert.deepEqual(JSON.parse(JSON.stringify(fresh.window.eval("({ s: S.table.sessions, t: S.table.threads })"))), before);
  // A 0.7 table: no keys, lines with no session.
  const old = JSON.parse(JSON.stringify(file));
  old.meta.tableSchemaVersion = "0.7"; delete old.sessions; delete old.threads;
  old.interactions = [{ id: "I-AAAAAAAA", kind: "shared", text: "x", date: dayToday() }];
  const older = boot({ storage: GM_ON });
  withDownloads(older);
  await importFile(older, old);
  assert.equal(older.window.eval("S.table.meta.tableSchemaVersion"), "0.11");
  assert.equal(older.window.eval("S.table.sessions.length + S.table.threads.length"), 0);
  assert.equal(older.window.eval("S.table.interactions[0].session"), null);
  assert.deepEqual([...app.errors, ...fresh.errors, ...older.errors], []);
});

test("Decision 173: switched off, there is no table, so no Sessions tab", () => {
  const app = boot();
  assert.equal(app.$("#btn-run-table"), null);
  assert.equal(app.$('[data-tsec="sessions"]'), null);
  assert.deepEqual(app.errors, []);
});

// ── The close-out (Decisions 205–206) ───────────────────────────────────
function closeApp(build) {
  const t = Engine.newTable("Close");
  const ids = build(t);
  const key = "shadows.table.v1." + t.meta.id;
  const app = boot({ storage: { ...GM_ON, [key]: { table: t, section: "sessions", changed: "2026-10-05T10:00:00.000Z", exported: null } } });
  app.click("[data-topen]");
  return { app, t, ids };
}
const mkSession = (t, number, date, present, hours) => {
  const id = Engine.addSession(t, { number, date }).id;
  Engine.editSession(t, id, { present, hours });
  return id;
};
const openSess = (app, id) => app.click(`.sess-open[data-sopen="${id}"]`);
const closeSheet = (app, id) => { openSess(app, id); app.click("[data-co-open]"); };
const coRow = (app, name) => app.$$("[data-co-row]").find(r => r.querySelector(".co-name").textContent === name);
const coField = (app, name, f) => coRow(app, name).querySelector(`[data-co="${f}"]`);
const coType = (app, name, f, v) => type(app, `[data-co-row="${coRow(app, name).dataset.coRow}"] [data-co="${f}"]`, v);

test("205–206: Close out opens the sheet on Who was there; IP is 5 an hour rounded up, the Milestone Point ticked", () => {
  const { app, ids } = closeApp(t => { mkSession(t, 3, "2026-09-01", ["Dez"], 2); return mkSession(t, 4, "2026-09-08", ["Wren", "Rook"], 3.5); });
  openSess(app, ids);
  assert.equal(app.$("[data-sco-h]").textContent, "Close-out");
  assert.equal(app.$("[data-co-open]").textContent, "Close out Session 4");
  app.click("[data-co-open]");
  assert.equal(app.$("h1.step-title").textContent, "Close out Session 4");
  assert.equal(app.doc.activeElement, app.$('[data-cosf="present"]'));
  assert.equal(app.$("[data-co-back]").textContent, "Back to Session 4");
  assert.deepEqual(["Wren", "Rook"].map(n => coField(app, n, "ip").value), ["18", "18"]);
  assert.ok(["Wren", "Rook"].every(n => coField(app, n, "milestone").checked));
  assert.match(app.$("#main").textContent, /5 an hour, rounded up\. Change any of it\./);
  assert.deepEqual(app.errors, []);
});

test("206: changing Hours recomputes the IP of lines the GM hasn't typed, and leaves a typed one", () => {
  const { app, ids } = closeApp(t => mkSession(t, 4, "2026-09-08", ["Wren", "Rook"], 3.5));
  closeSheet(app, ids);
  coType(app, "Rook", "ip", "20");
  const hours = app.$('[data-cosf="hours"]');
  type(app, '[data-cosf="hours"]', "3");
  assert.equal(app.$('[data-cosf="hours"]'), hours, "the field wasn't redrawn");
  assert.equal(app.window.eval("S.table.sessions[0].hours"), 3, "Hours saves to the session as typed");
  assert.equal(coField(app, "Wren", "ip").value, "15");
  assert.equal(coField(app, "Rook", "ip").value, "20", "a typed IP is left alone");
  type(app, '[data-cosf="hours"]', "");
  assert.equal(coField(app, "Wren", "ip").value, "", "no hours: blank");
  assert.equal(coField(app, "Rook", "ip").value, "20");
  assert.match(app.$("#main").textContent, /Add the hours to work out IP\./);
  assert.deepEqual(app.errors, []);
});

test("206: the absent are the earlier names; a tier is picked, its range shows, the Çredits are typed, and the next close-out suggests that tier", () => {
  const { app, ids } = closeApp(t => { mkSession(t, 3, "2026-09-01", ["Dez"], 2); mkSession(t, 9, "2026-12-01", ["Planned"], 2); const a = mkSession(t, 4, "2026-09-08", ["Wren"], 3); const b = mkSession(t, 5, "2026-09-15", ["Wren"], 2); return { a, b }; });
  closeSheet(app, ids.a);
  assert.equal(app.$("[data-co-away-h]").textContent, "Away tonight");
  assert.doesNotMatch(app.$("#main").textContent, /Planned/);
  assert.equal(coField(app, "Dez", "took").checked, true);
  assert.equal(coField(app, "Dez", "tier").value, "");
  assert.match(coField(app, "Dez", "tier").options[0].textContent, /Choose a tier/);
  typeChange(app, `[data-co-row="${coRow(app, "Dez").dataset.coRow}"] [data-co="tier"]`, "competent");
  assert.match(coRow(app, "Dez").textContent, /Pays 300–550/);
  assert.equal(app.doc.activeElement, coField(app, "Dez", "tier"));
  coType(app, "Dez", "credits", "400");
  app.click("[data-co-write]");
  assert.equal(app.doc.activeElement, app.$("[data-sco-h]"));
  assert.match(app.$(".co-log").textContent, /Dez \(away\): no session to log; an off-screen job, Competent; \+400 Çredits\./);
  app.click("[data-sback]");
  openSess(app, ids.b);
  app.click("[data-co-open]");
  assert.equal(coField(app, "Dez", "tier").value, "competent", "the last pick is suggested");
  assert.equal(coField(app, "Dez", "credits").value, "", "the amount isn't");
  // Unticked: the row folds and writes no line.
  app.click(`[data-co-row="${coRow(app, "Dez").dataset.coRow}"] [data-co="took"]`);
  assert.equal(coRow(app, "Dez").querySelector('[data-co="tier"]'), null);
  assert.equal(app.doc.activeElement, coField(app, "Dez", "took"));
  app.click("[data-co-write]");
  assert.deepEqual(JSON.parse(JSON.stringify(app.window.eval("S.table.sessions.find(s => s.number === 5).close.lines.map(l => l.name)"))), ["Wren"]);
  assert.deepEqual(app.errors, []);
});

test("206: the arc reminder goes by the session's number: 5 Minor, 10 Major, 4 neither", () => {
  const { app, ids } = closeApp(t => ({ four: mkSession(t, 4, "2026-09-01", ["Wren"], 2), five: mkSession(t, 5, "2026-09-08", ["Wren"], 2), ten: mkSession(t, 10, "2026-09-15", ["Wren"], 2) }));
  closeSheet(app, ids.five);
  assert.match(app.$("#main").textContent, /Session 5: a Minor Milestone comes due\. Each player's sheet counts their own\./);
  assert.doesNotMatch(app.$("#main").textContent, /Major Milestone comes due/);
  app.click("[data-co-back]"); app.click("[data-sback]");
  closeSheet(app, ids.ten);
  assert.match(app.$("#main").textContent, /Session 10: a Major Milestone comes due\./);
  app.click("[data-co-back]"); app.click("[data-sback]");
  closeSheet(app, ids.four);
  assert.doesNotMatch(app.$("#main").textContent, /Milestone comes due/);
  assert.deepEqual(app.errors, []);
});

test("206: a thread resolved from the sheet closes in this session, though a newer one exists, and focus moves on", () => {
  const { app, ids } = closeApp(t => {
    const a = mkSession(t, 4, "2026-09-01", ["Wren"], 2); mkSession(t, 6, "2026-09-15", ["Wren"], 2);
    Engine.addThread(t, { title: "First" }); Engine.addThread(t, { title: "Second" });
    return a;
  });
  closeSheet(app, ids);
  assert.equal(app.$$("[data-co-status]").length, 2);
  const first = app.$$("[data-co-thread]")[0].dataset.coThread;
  typeChange(app, `[data-co-status="${first}"]`, "resolved");
  assert.equal(app.window.eval(`S.table.threads.find(h => h.id === "${first}").closed`), ids, "closed in this session");
  assert.equal(app.$$("[data-co-status]").length, 1, "it left the list");
  assert.equal(app.doc.activeElement, app.$("[data-co-status]"), "focus lands on the next thread");
  typeChange(app, "[data-co-status]", "dropped");
  assert.match(app.$("#main").textContent, /No open threads\./);
  assert.equal(app.doc.activeElement, app.$("[data-co-threads-h]"));
  assert.deepEqual(app.errors, []);
});

test("206: Anyone new? lists a member made today with no line; typing saves it; reopening the sheet drops them", () => {
  const { app, t, ids } = closeApp(t => { Engine.addCastMember(t, { name: "Fresh" }); Engine.addCastMember(t, { name: "Known" }); Engine.editCastMember(t, t.cast.find(n => n.name === "Known").id, { line: "Stop." }); return mkSession(t, 4, dayToday(), ["Wren"], 2); });
  closeSheet(app, ids);
  assert.equal(app.$("[data-co-new-h]").textContent, "Anyone new?");
  const names = app.$$("[data-co-open-cast]").map(b => b.textContent);
  assert.equal(names.length, 1, names.join());
  const who = app.$("[data-co-member]");
  const field = who.querySelector('[data-co-cf="motivation"]');
  type(app, '[data-co-member] [data-co-cf="motivation"]', "Money.");
  assert.equal(app.$('[data-co-member] [data-co-cf="motivation"]'), field, "no redraw");
  assert.equal(app.window.eval("S.table.cast.find(n => n.motivation).motivation"), "Money.");
  // Still listed until reopened; after Back and in again, gone.
  assert.ok(app.$("[data-co-member]"));
  app.click("[data-co-back]"); app.click("[data-co-open]");
  assert.equal(app.$("[data-co-new-h]"), null);
  assert.ok(t);
  assert.deepEqual(app.errors, []);
});

test("205: a newcomer's name opens their page; its Back says where and returns to the sheet", () => {
  const { app, ids } = closeApp(t => { Engine.addCastMember(t, { name: "Fresh" }); return mkSession(t, 4, dayToday(), ["Wren"], 2); });
  closeSheet(app, ids);
  coType(app, "Wren", "ip", "7");
  app.click("[data-co-open-cast]");
  assert.equal(app.$("[data-cback]").textContent, "Back to the close-out");
  assert.equal(app.doc.activeElement, app.$("[data-cback]"));
  app.click("[data-cback]");
  assert.equal(app.$("h1.step-title").textContent, "Close out Session 4");
  assert.equal(coField(app, "Wren", "ip").value, "7", "the draft was kept");
  assert.equal(app.doc.activeElement.dataset.coOpenCast, app.window.eval("S.table.cast[0].id"));
  assert.deepEqual(app.errors, []);
});

test("205: Back keeps the draft and names the session; the page's button resumes it", () => {
  const { app, ids } = closeApp(t => mkSession(t, 4, "2026-09-08", ["Wren"], 2));
  closeSheet(app, ids);
  coType(app, "Wren", "ip", "99"); coType(app, "Wren", "note", "Bonus");
  app.click("[data-co-back]");
  assert.equal(app.$("h1.step-title").textContent, "Session 4");
  assert.equal(app.doc.activeElement, app.$("[data-co-open]"));
  assert.equal(app.window.eval("S.table.sessions[0].close"), null, "nothing written");
  app.click("[data-co-open]");
  assert.equal(coField(app, "Wren", "ip").value, "99");
  assert.equal(coField(app, "Wren", "note").value, "Bonus");
  app.click("[data-co-back]"); app.click("[data-sback]");
  openSess(app, ids);
  assert.equal(app.$("h1.step-title").textContent, "Session 4", "another visit opens the page, not the sheet");
  assert.deepEqual(app.errors, []);
});

test("205: Write stores the log in the player's words; IP so far shows; reload, export and import keep it; Redo asks and starts from it", async () => {
  const { app, ids } = closeApp(t => { mkSession(t, 3, "2026-09-01", ["Wren", "Dez"], 2); return mkSession(t, 4, "2026-09-08", ["Wren", "Rook", "Blank"], 3.5); });
  const downloads = withDownloads(app);
  assert.doesNotMatch(app.$("#main").textContent, /IP so far/);
  closeSheet(app, ids);
  coType(app, "Wren", "credits", "250"); coType(app, "Wren", "note", "Kept the gun.");
  coType(app, "Rook", "ip", ""); app.click(`[data-co-row="${coRow(app, "Rook").dataset.coRow}"] [data-co="milestone"]`);
  coType(app, "Blank", "ip", "");
  app.click(`[data-co-row="${coRow(app, "Blank").dataset.coRow}"] [data-co="milestone"]`);
  app.click(`[data-co-row="${coRow(app, "Dez").dataset.coRow}"] [data-co="took"]`);
  app.click("[data-co-write]");
  const log = app.$$(".co-log li").map(l => l.textContent);
  assert.deepEqual(log, ["Wren: log a session with 18 IP and the Milestone Point; +250 Çredits. Kept the gun.", "Rook: nothing this time.", "Blank: nothing this time."]);
  assert.match(app.$("#main").textContent, /Written \S+/);
  assert.equal(app.doc.activeElement, app.$("[data-sco-h]"));
  assert.equal(app.window.eval("S.closeOut"), null);
  app.click("[data-sback]");
  assert.match(app.$(".co-totals").textContent, /^IP so far: Wren 18 · Rook 0 · Blank 0$/);
  // Reload.
  tableReopen(app, "Close");
  assert.match(app.$(".co-totals").textContent, /Wren 18/);
  // Export, import.
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  const file = await tableFile(downloads[0]);
  const closed = file.sessions.find(s => s.number === 4).close;
  assert.equal(closed.lines.length, 3);
  assert.equal(file.sessions.find(s => s.number === 3).close, null);
  const fresh = boot({ storage: GM_ON });
  withDownloads(fresh);
  await importFile(fresh, file);
  assert.deepEqual(JSON.parse(JSON.stringify(fresh.window.eval("S.table.sessions.find(s => s.number === 4).close"))), closed);
  // Redo.
  openSess(app, ids);
  app.click("[data-co-redo]");
  assert.match(app.$("#modal").textContent, /Redo the close-out\?[\s\S]*You'll start from what's written; writing again replaces it\./);
  app.click("#modal [data-modalclose]");
  assert.ok(app.window.eval("S.closeOut") == null, "Cancel starts nothing");
  app.click("[data-co-redo]"); app.click("#modal [data-askyes]");
  assert.equal(app.doc.activeElement, app.$('[data-cosf="present"]'));
  assert.equal(coField(app, "Wren", "credits").value, "250");
  assert.equal(coField(app, "Wren", "note").value, "Kept the gun.");
  assert.equal(coField(app, "Rook", "milestone").checked, false);
  assert.equal(coField(app, "Dez", "took").checked, false, "who was left out is still on offer");
  coType(app, "Wren", "ip", "20");
  app.click("[data-co-write]");
  assert.equal(app.window.eval("S.table.sessions.find(s => s.number === 4).close.lines.length"), 3, "replaced, not appended");
  assert.match(app.$(".co-log").textContent, /Wren: log a session with 20 IP/);
  assert.deepEqual([...app.errors, ...fresh.errors], []);
});

test("205: Write refused names the field, keeps what was typed and writes nothing", () => {
  const { app, ids } = closeApp(t => mkSession(t, 4, "2026-09-08", ["Wren", "Rook"], 2));
  closeSheet(app, ids);
  coType(app, "Rook", "ip", "1.5");
  app.click("[data-co-write]");
  assert.match(app.$("#undotoast").textContent, /Enter a whole number\./);
  assert.equal(app.doc.activeElement, coField(app, "Rook", "ip"));
  assert.equal(coField(app, "Rook", "ip").value, "1.5");
  assert.equal(app.window.eval("S.table.sessions[0].close"), null);
  // Nobody: Who was there emptied.
  type(app, '[data-cosf="present"]', ""); typeChange(app, '[data-cosf="present"]', "");
  assert.match(app.$("#main").textContent, /Add who was there to work out IP\./);
  app.click("[data-co-write]");
  assert.match(app.$("#undotoast").textContent, /Nobody to write down\./);
  assert.equal(app.doc.activeElement, app.$('[data-cosf="present"]'));
  assert.deepEqual(app.errors, []);
});

test("205: deleting a session drops its draft", () => {
  const { app, ids } = closeApp(t => mkSession(t, 4, "2026-09-08", ["Wren"], 2));
  closeSheet(app, ids);
  app.click("[data-co-back]");
  app.click("[data-sdel]"); app.click("#modal [data-askyes]");
  assert.ok(app.window.eval("S.closeOut") == null);
  assert.deepEqual(app.errors, []);
});

test("206 (review): a typed IP survives correcting a letter in Who was there, and an away line's tier and Çredits survive being typed present and back", () => {
  const { app, ids } = closeApp(t => { mkSession(t, 3, "2026-09-01", ["Rook", "Dez"], 2); return mkSession(t, 4, "2026-09-08", ["Wren", "Rook"], 3.5); });
  closeSheet(app, ids);
  coType(app, "Rook", "ip", "20");
  type(app, '[data-cosf="present"]', "Wren, Roo");
  type(app, '[data-cosf="present"]', "Wren, Rook");
  assert.equal(coField(app, "Rook", "ip").value, "20", "Rook's typed IP");
  type(app, '[data-cosf="hours"]', "3");
  assert.equal(coField(app, "Rook", "ip").value, "20", "still typed after an Hours change");
  assert.equal(coField(app, "Wren", "ip").value, "15");
  typeChange(app, `[data-co-row="${coRow(app, "Dez").dataset.coRow}"] [data-co="tier"]`, "competent");
  coType(app, "Dez", "credits", "400");
  type(app, '[data-cosf="present"]', "Wren, Rook, Dez");
  assert.ok(coField(app, "Dez", "ip"), "Dez is present now");
  type(app, '[data-cosf="present"]', "Wren, Rook");
  assert.equal(coField(app, "Dez", "tier").value, "competent");
  assert.equal(coField(app, "Dez", "credits").value, "400");
  assert.deepEqual(app.errors, []);
});

test("206 (review): Redo leaves an IP that still matches the hours to the app, so changing Hours moves it; a typed one stays", () => {
  const { app, ids } = closeApp(t => mkSession(t, 4, "2026-09-08", ["Wren", "Rook"], 3.5));
  closeSheet(app, ids);
  coType(app, "Rook", "ip", "20");
  app.click("[data-co-write]");
  app.click("[data-co-redo]"); app.click("#modal [data-askyes]");
  type(app, '[data-cosf="hours"]', "5");
  assert.equal(coField(app, "Wren", "ip").value, "25");
  assert.equal(coField(app, "Rook", "ip").value, "20");
  assert.deepEqual(app.errors, []);
});

test("206 (review): Write with Took a job ticked and no tier is refused, focused on that row's Tier", () => {
  const { app, ids } = closeApp(t => { mkSession(t, 3, "2026-09-01", ["Dez"], 2); return mkSession(t, 4, "2026-09-08", ["Wren"], 3); });
  closeSheet(app, ids);
  app.click("[data-co-write]");
  assert.match(app.$("#undotoast").textContent, /Choose a tier\./);
  assert.equal(app.doc.activeElement, coField(app, "Dez", "tier"));
  assert.ok(app.window.eval("S.table.sessions.find(s => s.number === 4).close") == null);
  assert.deepEqual(app.errors, []);
});

// ── The Reference (Decision 207) ────────────────────────────────────────
const refTab = app => app.click('[data-tsec="reference"]');
const refHeads = app => app.$$("#main .ref-h").map(h => h.textContent);
const refChips = app => app.$$("#main .jumpbar .jump").map(b => b.textContent);

test("Decision 207: switched off there is no Reference tab; switched on, a panel per row of the data, in order, and a chip for each", () => {
  const off = boot();
  assert.equal(off.$("#btn-run-table"), null);
  assert.equal(off.$('[data-tsec="reference"]'), null);
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); refTab(app);
  const titles = [...app.D.gmReference.panels.map(p => p.title)];
  assert.deepEqual(refHeads(app), titles);
  assert.deepEqual(refChips(app), titles);
  assert.match(app.$("#main").textContent, /Slot a pack on the Threats tab, and its tiers, roles, origins and traits show here\./);
  assert.ok(app.$("#main .jumpbar.sticky"), "the bar sticks (SQ8)");
  assert.equal(app.$$("#main table.ref").length > 6, true);
  assert.deepEqual(app.errors, []);
});

test("Decision 207: with a pack slotted the Codex shows its tiers and traits", () => {
  const app = tableWithPack(); refTab(app);
  const codex = app.$("#gr-codex").parentElement.textContent;
  assert.doesNotMatch(codex, /Slot a pack/);
  for (const s of ["Slight", "Middling", "Bruiser", "Gatherer", "Salt Nerve", "Pier Legs", "BOD +1 · REF −1"]) assert.ok(codex.includes(s), s);
  assert.deepEqual(app.errors, []);
});

test("Decision 207: the search keeps the field and its focus while it filters panels and chips; no match says so; Clear brings everything back", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); refTab(app);
  const q = app.$("[data-jumpfilter]"), all = [...app.D.gmReference.panels.map(p => p.title)];
  q.focus();
  type(app, "[data-jumpfilter]", "prone");
  assert.equal(app.$("[data-jumpfilter]"), q, "typing redrew the search field");
  assert.equal(q.value, "prone");
  assert.equal(app.doc.activeElement, q);
  assert.deepEqual(refHeads(app), ["Conditions", "Actions", "When a hit lands hard", "Weapon tags"]);
  assert.deepEqual(refChips(app), refHeads(app));
  assert.equal(app.window.eval("S.refQ"), "prone");
  type(app, "[data-jumpfilter]", "zzzz");
  assert.match(app.$("#main").textContent, /Nothing in the reference matches\./);
  assert.deepEqual(refChips(app), []);
  app.click("[data-refclear]");
  assert.deepEqual(refHeads(app), all);
  assert.equal(app.$("[data-jumpfilter]").value, "");
  assert.equal(app.doc.activeElement, app.$("[data-jumpfilter]"));
  assert.deepEqual(app.errors, []);
});

test("Decision 207: a chip lands on its panel's heading, whatever is filtered, and the search is kept across a trip to another tab", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); refTab(app);
  type(app, "[data-jumpfilter]", "tn 8");
  const chips = app.$$("#main .jumpbar .jump");
  assert.ok(chips.length >= 3);
  const last = chips.at(-1);
  last.click();
  const head = app.$(`#${last.dataset.jump}`);
  assert.equal(head.textContent, last.textContent);
  assert.equal(app.doc.activeElement, head);
  notesTab(app); refTab(app);
  assert.equal(app.$("[data-jumpfilter]").value, "tn 8", "the search as left");
  assert.deepEqual(app.errors, []);
});

test("a mouse wheel scrolls a sideways row of chips and lets the page have it at the end", () => {
  // jsdom has no layout: give each row 1200 px of chips in 500. The row hides its scrollbar.
  const wheelable = (app, row) => {
    let left = 0; const max = 700;
    Object.defineProperty(row, "scrollLeft", { get: () => left, set: v => { left = Math.max(0, Math.min(max, v)); } });
    const wheel = (dy, dx = 0) => { const e = new app.window.WheelEvent("wheel", { deltaY: dy, deltaX: dx, bubbles: true, cancelable: true }); row.dispatchEvent(e); return e.defaultPrevented; };
    assert.equal(wheel(120), true, "the wheel didn't move the row");
    assert.equal(left, 120);
    assert.equal(wheel(0, 40), false, "a sideways swipe was taken over");
    left = max;
    assert.equal(wheel(120), false, "the wheel was swallowed with nowhere to scroll");
  };
  const sheet = openSheet(lockedCharacter(), "character");
  wheelable(sheet, sheet.$("#main .jumpbar.row .jump-row.scroll-row"));
  assert.deepEqual(sheet.errors, []);
});

test("Decision 209: the Reference's chips all wrap in view, and a bar the CSS lets go on a phone isn't counted by a jump", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); refTab(app);
  const bar = app.$("#main .jumpbar.sticky.wrap");
  assert.ok(bar, "the Reference's bar doesn't wrap");
  assert.equal(bar.querySelector(".scroll-row"), null, "the chips still scroll sideways");
  assert.deepEqual(app.$$("#main .jump-row.jump-wrap .jump").map(b => b.textContent), [...app.D.gmReference.panels.map(p => p.title)]);
  type(app, "[data-jumpfilter]", "prone");
  assert.deepEqual(refChips(app), refHeads(app), "a search's chips land outside the wrapping box");
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  assert.match(css, /\.jump-wrap\{[^}]*flex-wrap:wrap/);
  assert.match(css, /@media \(max-width:639px\)\{ \.jumpbar\.sticky\.wrap\{position:static\} \}/);
  // jsdom has no layout: a 94 px header, a 311 px bar, and the heading 1000 px down.
  const w = app.window, realStyle = w.getComputedStyle;
  let position = "static", landed = null;
  w.getComputedStyle = el => el === bar ? { position, top: "94px" } : realStyle.call(w, el);
  w.scrollTo = o => { landed = o.top; };
  Object.defineProperty(app.$("header.top"), "offsetHeight", { get: () => 94 });
  Object.defineProperty(bar, "offsetHeight", { get: () => 311 });
  const chip = app.$("#main .jump"), head = app.$(`#${chip.dataset.jump}`);
  head.getBoundingClientRect = () => ({ top: 1000, bottom: 1030, left: 0, right: 300, width: 300, height: 30 });
  try {
    chip.click();
    assert.equal(landed, 1000 - 94 - 8, "a bar that scrolled away still pushed the heading down");
    position = "sticky"; chip.click();
    assert.equal(landed, 1000 - 94 - 311 - 8, "a sticky bar was not counted");
  } finally { w.getComputedStyle = realStyle; }
  assert.deepEqual(app.errors, []);
});

test("Decision 207: a running encounter is kept across a trip to the Reference and back", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); encTab(app);
  newEncounter(app, "Warehouse job"); addPcRow(app, "Wren");
  app.click("[data-enc-start]");
  assert.match(app.$(".enc-status").textContent, /Round 1/);
  refTab(app);
  assert.equal(app.$(".enc-status"), null);
  assert.ok(app.$("#gr-conditions"));
  encTab(app);
  assert.match(app.$(".enc-status").textContent, /Round 1/);
  assert.equal(app.$("[data-enc-title]").value, "Warehouse job");
  assert.deepEqual(app.errors, []);
});

// ── The secretary (Decision 208) ───────────────────────────────────────────
function secretaryApp() {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  app.window.eval(`(() => {
    const t = S.table, E = Engine;
    const m = E.addCastMember(t, { name: "Marta Voss" }).id;
    E.editCastMember(t, m, { flavor: "a fixer at the docks" });
    const s1 = E.addSession(t, { date: "2026-01-01" }).id;
    E.editSession(t, s1, { number: 3, journal: { happened: "Marta pointed at the dock crane" } });
    const s2 = E.addSession(t, { date: localDay() }).id;
    E.editSession(t, s2, { number: 6 });
    E.addInteraction(t, { kind: "shared", cast: [m], crew: ["Nyx"], text: "dock gossip", session: s1 });
    E.addInteraction(t, { kind: "shared", cast: [], crew: ["Nyx"], text: "dock rumour" });
    E.addThread(t, { title: "The courier" });
    tableChange(() => {});
  })()`);
  return app;
}
const findOpen = app => app.click("[data-tfind]");
const typeKeys = (app, sel, text) => { for (let i = 1; i <= text.length; i++) type(app, sel, text.slice(0, i)); };
const findHits = app => app.$$("#modal [data-fkind]");
const pressEsc = app => app.$("#modal").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

test("Decision 208: Find and Jot sit in the header on every tab and page of a table; switched off, Home has neither", () => {
  const off = boot();
  assert.equal(off.$("[data-tfind]"), null); assert.equal(off.$("[data-tjot]"), null);
  const app = secretaryApp();
  for (const sec of ["sessions", "cast", "threats", "encounters", "reference", "notes"]) {
    app.click(`[data-tsec="${sec}"]`);
    assert.ok(app.$("#hdractions [data-tfind]") && app.$("#hdractions [data-tjot]"), sec);
    assert.equal(app.$("#hdractions [data-tfind]").textContent, "Find");
  }
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  assert.ok(app.$("[data-ctitle]") && app.$("[data-tfind]") && app.$("[data-tjot]"), "a member's page");
  encTab(app); newEncounter(app, "Docks"); addPcRow(app, "Wren"); app.click("[data-enc-start]");
  assert.match(app.$(".enc-status").textContent, /Round 1/);
  assert.ok(app.$("[data-tfind]") && app.$("[data-tjot]"), "a running encounter");
  assert.deepEqual(app.errors, []);
});

test("Decision 208: Find keeps its field and focus while typing, groups hits by kind with a count, marks the match; a cast hit opens the member", () => {
  const app = secretaryApp();
  findOpen(app);
  const q = app.$("[data-findq]");
  assert.equal(app.$("[data-findres]").getAttribute("aria-live"), null, "the results aren't a live region");
  assert.equal(app.doc.activeElement, q, "focus starts in the field");
  assert.equal(app.$("[data-findres]").textContent.trim(), "", "nothing under two characters");
  typeKeys(app, "[data-findq]", "dock");
  assert.equal(app.$("[data-findq]"), q, "typing redrew the field");
  assert.equal(app.doc.activeElement, q); assert.equal(q.value, "dock");
  const heads = app.$$("#modal .find-h").map(h => h.textContent.replace(/\s+/g, " ").trim());
  assert.deepEqual(heads, ["Cast 1", "Sessions 1", "Lines 2"]);
  assert.equal(app.$("[data-findcount]").textContent, "4 found");
  const marks = app.$$("#modal mark").map(m => m.textContent);
  assert.ok(marks.length >= 4 && marks.every(m => m.toLowerCase() === "dock"), marks.join("|"));
  const cast = findHits(app).find(b => b.dataset.fkind === "cast");
  assert.match(cast.textContent, /Marta Voss/); assert.match(cast.textContent, /Flavor/);
  cast.click();
  assert.equal(app.$("#modal").open, false, "the modal closes");
  assert.equal(app.window.eval("S.castOpen"), cast.dataset.fid);
  assert.equal(app.doc.activeElement, app.$("[data-ctitle]"));
  findOpen(app);
  assert.equal(app.$("[data-findq]").value, "dock"); assert.equal(findHits(app).length, 4, "the same results");
  typeKeys(app, "[data-findq]", "zzzz");
  assert.match(app.$("[data-findres]").textContent, /Nothing on the table matches\./);
  assert.deepEqual(app.errors, []);
});

test("Decision 208: a session hit opens its page; an interaction hit opens its session's page on the line, else its member, else Who knows what", () => {
  const app = secretaryApp();
  findOpen(app); typeKeys(app, "[data-findq]", "crane");
  findHits(app)[0].click();
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.equal(app.$("#main h1").textContent, "Session 3");
  assert.equal(app.doc.activeElement, app.$("#main h1"));
  findOpen(app); typeKeys(app, "[data-findq]", "gossip");
  const line = findHits(app).find(b => b.dataset.fkind === "interaction");
  line.click();
  assert.equal(app.window.eval("S.sessOpen"), app.window.eval("S.table.sessions.find(s => s.number === 3).id"));
  assert.equal(app.doc.activeElement, app.$(`[data-sline="${line.dataset.fid}"]`));
  findOpen(app); typeKeys(app, "[data-findq]", "rumour");
  findHits(app)[0].click();
  assert.equal(app.window.eval("S.tsection"), "cast"); assert.equal(app.window.eval("S.castView"), "crew");
  assert.equal(app.window.eval("S.castOpen"), null);
  assert.ok(app.doc.activeElement && app.doc.activeElement !== app.doc.body);
  // With a live member and no session, the member's page.
  app.window.eval(`(() => { const x = S.table.interactions.find(i => i.text === "dock rumour"); x.cast = [{ kind: "cast", id: S.table.cast[0].id }]; tableChange(() => {}); })()`);
  findOpen(app); typeKeys(app, "[data-findq]", "rumour");
  findHits(app).find(b => b.dataset.fkind === "interaction").click();
  assert.equal(app.window.eval("S.castOpen"), app.window.eval("S.table.cast[0].id"));
  assert.equal(app.doc.activeElement.dataset.int, app.window.eval("S.table.interactions.find(i => i.text === 'dock rumour').id"));
  assert.deepEqual(app.errors, []);
});

test("Decision 208: a thread, a note and an encounter hit each open their record", () => {
  const app = secretaryApp();
  app.window.eval(`(() => { Engine.addTableNote(S.table, { title: "Lantern", text: "Ike the bartender" }); tableChange(() => {}); })()`);
  encTab(app); newEncounter(app, "Harbour fight"); addPcRow(app, "Wren"); app.click("[data-enc-start]");
  findOpen(app); typeKeys(app, "[data-findq]", "courier");
  findHits(app).find(b => b.dataset.fkind === "thread").click();
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.equal(app.doc.activeElement.dataset.thtitle, app.window.eval("S.table.threads[0].id"));
  findOpen(app); typeKeys(app, "[data-findq]", "bartender");
  const n = findHits(app).find(b => b.dataset.fkind === "note");
  n.click();
  assert.equal(app.window.eval("S.tsection"), "notes");
  assert.equal(app.doc.activeElement, app.$(`[data-ntext="${n.dataset.fid}"]`));
  findOpen(app); typeKeys(app, "[data-findq]", "harbour");
  findHits(app).find(b => b.dataset.fkind === "encounter").click();
  assert.equal(app.window.eval("S.tsection"), "encounters");
  assert.equal(app.window.eval("S.encOpen"), app.window.eval("S.table.encounters[0].id"));
  assert.ok(app.doc.activeElement && app.doc.activeElement !== app.doc.body);
  assert.deepEqual(app.errors, []);
});

test("Decision 208: Jot from a running encounter saves a note with today's session and does not redraw the page under it", () => {
  const app = secretaryApp();
  encTab(app); newEncounter(app, "Docks"); addPcRow(app, "Wren"); app.click("[data-enc-start]");
  const before = [...app.$("#main").querySelectorAll("*")];
  const notesBefore = app.window.eval("S.table.notes.length");
  app.$("[data-tjot]").focus();   // a click focuses its button in a browser
  app.click("[data-tjot]");
  assert.equal(app.doc.activeElement, app.$("[data-jottext]"));
  assert.match(app.$("#modal").textContent, /Goes with Session 6\./);
  // Empty: refused, nothing added, nothing stamped or saved, focus stays.
  const stamp = () => [app.window.eval("S.table.meta.updated"), JSON.parse(app.window.localStorage.getItem(tableKeys(app)[0])).changed];
  const was = stamp();
  type(app, "[data-jottext]", "  " + String.fromCharCode(10) + " ");
  app.click("[data-jotsave]");
  assert.deepEqual(stamp(), was, "an empty Save counted as a change");
  assert.match(app.$("[data-jotwhy]").textContent, /Write something first\./);
  assert.equal(app.window.eval("S.table.notes.length"), notesBefore);
  assert.equal(app.doc.activeElement, app.$("[data-jottext]"));
  // Esc keeps the draft.
  type(app, "[data-jottext]", "Bartender at the Lantern: Ike");
  pressEsc(app);
  assert.equal(app.$("#modal").open, false);
  assert.equal(app.window.eval("S.jotDraft"), "Bartender at the Lantern: Ike");
  assert.equal(app.doc.activeElement, app.$("[data-tjot]"));
  app.click("[data-tjot]");
  assert.equal(app.$("[data-jottext]").value, "Bartender at the Lantern: Ike", "the draft is back");
  app.click("[data-jotsave]");
  assert.equal(app.$("#modal").open, false);
  const after = [...app.$("#main").querySelectorAll("*")];
  assert.equal(after.length, before.length); assert.ok(after.every((el, i) => el === before[i]), "the page under the jot was redrawn");
  assert.equal(app.doc.activeElement, app.$("[data-tjot]"));
  assert.match(app.$("#undotoast").textContent, /Jotted\./);
  assert.equal(app.window.eval("S.jotDraft"), "");
  const note = app.window.eval("S.table.notes[0]");
  assert.equal(note.text, "Bartender at the Lantern: Ike");
  assert.equal(note.session, app.window.eval("S.table.sessions.find(s => s.number === 6).id"));
  notesTab(app);
  assert.equal(app.$(`[data-nsess="${note.id}"]`).value, note.session);
  sessTab(app); app.window.eval(`S.sessOpen = S.table.sessions.find(s => s.number === 6).id; update()`);
  assert.match(app.$("#main").textContent, /Jotted/);
  assert.match(app.$("[data-jotopen]").textContent, /Bartender at the Lantern/);
  app.click("[data-jotopen]");
  assert.equal(app.window.eval("S.tsection"), "notes");
  assert.equal(app.doc.activeElement, app.$(`[data-ntext="${note.id}"]`));
  assert.deepEqual(app.errors, []);
});

test("Decision 208: a jot on the Notes tab or that session's page appears there; Ctrl+Enter saves; a note's Session select changes and clears", () => {
  const app = secretaryApp();
  notesTab(app);
  app.click("[data-tjot]");
  type(app, "[data-jottext]", "Owes Rook");
  app.$("[data-jottext]").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }));
  assert.equal(app.$("#modal").open, false);
  assert.equal(app.$$("[data-ntext]")[0].value, "Owes Rook", "the Notes tab redrew in place");
  const id = app.$$("[data-ntext]")[0].dataset.ntext;
  const sel = app.$(`[data-nsess="${id}"]`);
  assert.deepEqual([...sel.options].map(o => o.textContent.split(" · ")[0]), ["None", "Session 6", "Session 3"]);
  const three = app.window.eval("S.table.sessions.find(s => s.number === 3).id");
  changeTo(app, `[data-nsess="${id}"]`, three);
  assert.equal(app.window.eval(`S.table.notes.find(n => n.id === "${id}").session`), three);
  changeTo(app, `[data-nsess="${id}"]`, "");
  assert.equal(app.window.eval(`S.table.notes.find(n => n.id === "${id}").session`), null);
  // No session today, or two: the line says so and the jot has none.
  app.window.eval(`S.table.sessions.find(s => s.number === 6).date = "2026-01-02"; update()`);
  app.click("[data-tjot]");
  assert.match(app.$("#modal").textContent, /No session is dated today\./);
  pressEsc(app);
  app.window.eval(`S.table.sessions.forEach(s => { s.date = localDay(); }); update()`);
  app.click("[data-tjot]");
  assert.match(app.$("#modal").textContent, /More than one session is dated today\./);
  assert.deepEqual(app.errors, []);
});

// ── Wave Initiative (Decision 210) ─────────────────────────────────────
function waveApp() {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  encTab(app);
  newEncounter(app, "Docks");
  for (const n of ["Wren", "Rook"]) addPcRow(app, n);
  app.window.eval(`(function(){ const e = S.table.encounters[0], o = e.sides[1].id;
    for (const n of ["Tough", "Tough 2"]) { const r = Engine.addParticipant(S.table, e.id, { kind: "pc", name: n }); Engine.editParticipant(S.table, e.id, r.id, { side: o }); }
    renderTable(); })()`);
  return app;
}
const headings = app => app.$$(".enc-side-h").map(h => h.textContent);
const orderOf = (app, name, v) => changeTo(app, `[data-eorder="${rowId(encRowByName(app, name))}"]`, String(v));

test("210: a planned encounter is One at a time; Wave Initiative groups the rows under their sides and keeps the numbers", () => {
  const app = waveApp();
  assert.equal(app.$('[data-eby="person"]').getAttribute("aria-pressed"), "true");
  assert.equal(app.$$(".enc-side-h").length, 0, "one at a time has no headings");
  orderOf(app, "Wren", 14); orderOf(app, "Tough", 16);
  const wave = app.$('[data-eby="wave"]');
  wave.click();
  assert.equal(app.doc.activeElement, app.$('[data-eby="wave"]'), "focus left the pressed button");
  assert.equal(app.$('[data-eby="wave"]').getAttribute("aria-pressed"), "true");
  assert.deepEqual(headings(app), ["The other side", "The crew"], "16 beats 14");
  assert.match(app.$(".enc-side").textContent, /Best 16/);
  assert.ok(app.$("[data-eorder]"), "Combat Sense is still there");
  assert.equal(app.$$(".enc-tied").length, 0);
  // The tip.
  app.$('[data-tip="wave"]').click();
  assert.match(tipShown(app), /The side holding the best result acts first/);
  assert.deepEqual(app.errors, []);
});

test("210: a tie between sides is flagged on both headings and on no row; the order follows the numbers", () => {
  const app = waveApp();
  app.$('[data-eby="wave"]').click();
  orderOf(app, "Wren", 14); orderOf(app, "Tough", 14);
  assert.equal(app.$$(".enc-side-head .enc-tied").length, 2);
  assert.equal(app.$$(".enc-row .enc-tied").length, 0);
  orderOf(app, "Tough", 15);
  assert.equal(app.$$(".enc-tied").length, 0);
  assert.deepEqual(headings(app), ["The other side", "The crew"]);
  assert.deepEqual(app.errors, []);
});

test("210: Start lands on the best side's first row; Next goes through it, then the crew, then Reset", () => {
  const app = waveApp();
  app.$('[data-eby="wave"]').click();
  orderOf(app, "Wren", 14); orderOf(app, "Tough", 16);
  app.click("[data-enc-start]");
  const active = () => app.$$("[aria-current=step] .enc-name").map(x => x.textContent).join();
  assert.equal(active(), "Tough");
  assert.equal(app.doc.activeElement, app.$("[data-enext]"));
  const seen = [active()];
  for (let i = 0; i < 3; i++) { app.click("[data-enext]"); seen.push(active()); }
  assert.deepEqual(seen, ["Tough", "Tough 2", "Wren", "Rook"]);
  app.click("[data-enext]");
  assert.match(app.$("#main").textContent, /Reset: round 1 ends/);
  assert.deepEqual(app.errors, []);
});

test("210: a row's Side moves it under the other heading with its More open and focus on its select", () => {
  const app = waveApp();
  app.$('[data-eby="wave"]').click();
  const id = rowId(encRowByName(app, "Rook"));
  app.$(`[data-emore="${id}"] summary`).click();
  const sel = `[data-eside="${id}"]`;
  const other = app.window.eval("S.table.encounters[0].sides[1].id");
  changeTo(app, sel, other);
  assert.equal(app.window.eval(`S.table.encounters[0].rows.find(r => r.id === "${id}").side`), other);
  const sec = app.$(`[data-eside-sec="${other}"]`);
  assert.ok(sec.querySelector(`[data-erow="${id}"]`), "the row isn't under the other heading");
  assert.ok(app.$(`[data-emore="${id}"]`).open, "its More closed");
  assert.equal(app.doc.activeElement, app.$(sel));
  assert.deepEqual(app.errors, []);
});

test("210: Add a side opens a third heading with its Name focused; Remove side moves its rows, says so, and focus goes to Add a side", () => {
  const app = waveApp();
  app.$('[data-eby="wave"]').click();
  app.click("[data-eaddside]");
  assert.deepEqual(headings(app).length, 3);
  const nm = app.doc.activeElement;
  assert.ok(nm.matches("[data-esidename]"), "Name wasn't focused");
  const sid = nm.dataset.esidename;
  nm.value = "The Saints"; nm.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.ok(headings(app).includes("The Saints"));
  const rook = rowId(encRowByName(app, "Rook"));
  app.$(`[data-emore="${rook}"] summary`).click();
  changeTo(app, `[data-eside="${rook}"]`, sid);
  app.$(`[data-emore="${sid}"] summary`);
  app.click(`[data-esiderm="${sid}"]`);
  assert.equal(headings(app).length, 2);
  assert.match(app.$(".toast-msg").textContent, /Moved 1 to The other side\./);
  assert.equal(app.doc.activeElement, app.$("[data-eaddside]"));
  assert.ok(app.$(`[data-eside-sec="${app.window.eval("S.table.encounters[0].sides[1].id")}"] [data-erow="${rook}"]`));
  assert.deepEqual(app.errors, []);
});

test("210: a cast member who fights with the crew lands under The crew when added from their page; the toggle saves at once", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  app.window.eval(`Engine.addCastMember(S.table, { name: "Marta" });`);
  encTab(app);
  newEncounter(app, "Docks");
  app.$('[data-eby="wave"]').click();
  app.click('[data-tsec="cast"]');
  app.click("[data-copen]");
  const tog = app.$("[data-cally]");
  assert.equal(tog.getAttribute("aria-pressed"), "false");
  tog.click();
  assert.equal(app.$("[data-cally]").getAttribute("aria-pressed"), "true");
  assert.equal(app.window.eval("S.table.cast[0].ally"), true);
  app.click("[data-cenc]");
  encTab(app);
  const sec = app.$$(".enc-side").find(s => s.querySelector(".enc-side-h").textContent === "The crew");
  assert.ok(sec.textContent.includes("Marta"), "Marta isn't on the crew's side");
  assert.deepEqual(app.errors, []);
});

test("210: the Turns group is outside the sticky bar, planned or running; pressing the mode already on changes nothing", () => {
  const app = waveApp();
  const outside = () => { const g = app.$(".enc-turns"); assert.ok(g, "no Turns group"); assert.equal(g.closest(".enc-bar"), null, "the Turns group is inside the sticky bar"); };
  outside();
  app.click("[data-enc-start]");
  outside();
  app.window.eval(`S.table.meta.updated = "2000-01-01T00:00:00.000Z"; S.table.encounters[0].updated = "2000-01-01T00:00:00.000Z";`);
  app.$('[data-eby="person"]').click();
  assert.equal(app.window.eval("S.table.meta.updated"), "2000-01-01T00:00:00.000Z");
  assert.equal(app.window.eval("S.table.encounters[0].updated"), "2000-01-01T00:00:00.000Z");
  assert.equal(app.doc.activeElement, app.$('[data-eby="person"]'));
  app.$('[data-eby="wave"]').click();
  assert.notEqual(app.window.eval("S.table.meta.updated"), "2000-01-01T00:00:00.000Z", "a real change stamps");
  assert.deepEqual(app.errors, []);
});

test("210: switching back to One at a time drops the headings and keeps the numbers", () => {
  const app = waveApp();
  orderOf(app, "Wren", 14);
  app.$('[data-eby="wave"]').click();
  app.$('[data-eby="person"]').click();
  assert.equal(app.$$(".enc-side-h").length, 0);
  assert.equal(app.$(`[data-eorder="${rowId(encRowByName(app, "Wren"))}"]`).value, "14");
  app.$('[data-eby="wave"]').click();
  for (let i = 0; i < 6; i++) { const b = app.$("[data-eaddside]"); if (b) b.click(); }
  assert.equal(app.$("[data-eaddside]"), null, "Add a side is hidden at six");
  assert.deepEqual(app.errors, []);
});

// ── Adding to a fight from anywhere (Decision 211) ────────────────────────
const encRows = app => JSON.parse(app.window.eval("JSON.stringify(S.table.encounters.map(e => ({ name: e.name, status: e.status, rows: e.rows.map(r => r.name) })))"));

test("Decision 211: with no encounter at all, Add to a new encounter shows on a cast page, an entry page and a group page; a press makes one and relabels in place; a second goes to it", () => {
  const app = tableWithPack();
  entryButton(app, "gull").click();
  const btn = app.$("[data-tenc]"); btn.focus();
  assert.equal(btn.textContent, "Add to a new encounter");
  app.click("[data-tenc]");
  assert.match(app.$("#undotoast").textContent, /Gull is in a new encounter, Encounter \d{4}-\d\d-\d\d\./);
  assert.equal(app.$("[data-tenc]"), btn, "the page was redrawn under the button");
  assert.match(btn.textContent, /^Add to Encounter \d{4}-\d\d-\d\d$/);
  assert.equal(app.doc.activeElement, btn);
  app.click("[data-tenc]");
  assert.equal(encRows(app).length, 1);
  assert.deepEqual(encRows(app)[0].rows, ["Gull", "Gull 2"]);
  assert.equal(encRows(app)[0].status, "planned");
  app.click("[data-tback]"); app.click('[data-tview="group"]'); app.click("[data-tgroup]");
  assert.match(app.$("[data-tgrpenc]").textContent, /^Add to Encounter /);
  // A cast page, with every encounter ended, reads a new one.
  app.window.eval(`S.table.encounters[0].status = "ended"`);
  app.window.eval(`Engine.addCastMember(S.table, { name: "Dez" }); S.tsection = "cast"; S.castOpen = S.table.cast[0].id; S.threatGroup = null; update();`);
  assert.equal(app.$("[data-cenc]").textContent, "Add to a new encounter");
  app.click("[data-cenc]");
  assert.equal(encRows(app).length, 2);
  assert.match(app.$("[data-cenc]").textContent, /^Add to Encounter /);
  assert.deepEqual(app.errors, []);
});

test("Decision 211: a Threats card adds to the cast and the encounter without opening, keeps the search, numbers the rows, and works after a redraw", () => {
  const app = tableWithPack();
  app.window.eval(`Engine.addEncounter(S.table, { name: "Dock fight" });`);
  threatsTab(app);
  type(app, "[data-tsearch]", "gull");
  const card = () => app.$(`[data-tcard="${PACK_ID}|gull"]`);
  assert.equal(card().querySelectorAll("button").length, 3);
  const castBtn = card().querySelector("[data-tcardcast]"), encBtn = card().querySelector("[data-tcardenc]");
  assert.equal(castBtn.textContent, "Add to cast"); assert.equal(encBtn.textContent, "Add to Dock fight");
  assert.equal(encBtn.getAttribute("aria-label"), "Add Gull to Dock fight");
  assert.equal(castBtn.getAttribute("aria-label"), "Add Gull to the cast");
  encBtn.focus();
  for (let i = 0; i < 3; i++) app.click(`[data-tcardenc="${PACK_ID}|gull"]`);
  assert.equal(app.window.eval("S.threatOpen"), null, "a card press opened the card");
  assert.equal(app.$("[data-tsearch]").value, "gull");
  assert.deepEqual(encRows(app)[0].rows, ["Gull", "Gull 2", "Gull 3"]);
  assert.equal(app.doc.activeElement, encBtn);
  app.click(`[data-tcardcast="${PACK_ID}|gull"]`);
  assert.equal(app.window.eval("S.tsection"), "threats");
  assert.equal(app.window.eval("S.table.cast.length"), 1);
  assert.match(app.$("#undotoast").textContent, /Gull is in the cast\./);
  type(app, "[data-tsearch]", "gul");
  app.click(`[data-tcardenc="${PACK_ID}|gull"]`);
  assert.equal(encRows(app)[0].rows.length, 4, "a card's button died after the list redrew");
  app.click('[data-tview="group"]');
  const g = app.$("[data-tcard] [data-tcardgrp]");
  assert.equal(g.textContent, "Add to Dock fight");
  assert.equal(app.$("[data-tcard] [data-tcardcast]"), null, "a group card has no Add to cast");
  app.click("[data-tcardgrp]");
  assert.match(app.$("#undotoast").textContent, /Pier Watch: 4 added to Dock fight\./);
  assert.equal(encRows(app)[0].rows.length, 8);
  assert.deepEqual(app.errors, []);
});

test("Decision 211: a card's button names the running encounter, then the newest planned, and the open one first", () => {
  const app = tableWithPack();
  app.window.eval(`Engine.addEncounter(S.table, { name: "Old" }); Engine.addEncounter(S.table, { name: "Mid" });
    const r = Engine.addEncounter(S.table, { name: "Run" }).id; Engine.addParticipant(S.table, r, { kind: "pc", name: "Wren" }); Engine.startEncounter(S.table, r);
    Engine.addEncounter(S.table, { name: "New" });`);
  threatsTab(app);
  const label = () => app.$("[data-tcardenc]").textContent;
  assert.equal(label(), "Add to Run");
  app.window.eval(`S.table.encounters.find(e => e.name === "Run").status = "ended"; update();`);
  assert.equal(label(), "Add to New");
  app.click('[data-tsec="encounters"]');
  app.$$("[data-enc-open]").find(b => b.textContent === "Old").click();
  threatsTab(app);
  assert.equal(label(), "Add to Old", "the open encounter comes first");
  assert.deepEqual(app.errors, []);
});

test("Decision 211: From the Codex searches entries and groups from two characters and adds to this encounter, focus on the same Add", () => {
  const app = tableWithPack();
  app.click('[data-tsec="encounters"]'); newEncounter(app, "Dock fight");
  assert.ok(app.$("[data-enc-codex]"));
  app.click("[data-enc-codex]");
  assert.equal(app.$("[data-enc-codex]").getAttribute("aria-expanded"), "true");
  assert.equal(app.doc.activeElement, app.$("[data-enc-codexq]"));
  assert.match(app.$("[data-enccodexlist]").textContent, /Type a name, a role or an origin\./);
  type(app, "[data-enc-codexq]", "g");
  assert.equal(app.$$("[data-enc-addcodex]").length, 0, "one character listed something");
  type(app, "[data-enc-codexq]", "gu");
  const adds = app.$$("[data-enc-addcodex]");
  assert.deepEqual(adds.map(b => b.dataset.encCodexkind), ["entry", "group"]);
  assert.match(app.$("[data-enccodexlist]").textContent, /Group/);
  app.click(`[data-enc-addcodex="${PACK_ID}|gull"]`);
  assert.deepEqual(encRows(app)[0].rows, ["Gull"]);
  const again = app.$(`[data-enc-addcodex="${PACK_ID}|gull"]`);
  assert.equal(app.doc.activeElement, again, "focus left the Add");
  app.click(`[data-enc-addcodex="${PACK_ID}|gull"]`);
  assert.deepEqual(encRows(app)[0].rows, ["Gull", "Gull 2"]);
  app.click(`[data-enc-addcodex="${PACK_ID}|pier-watch"]`);
  assert.equal(encRows(app)[0].rows.length, 6);
  assert.equal(app.window.eval("S.table.cast.length"), 0);
  // Another encounter closes the search.
  app.click("[data-enc-back]"); newEncounter(app, "Second");
  assert.equal(app.$("[data-enc-codexq]"), null);
  assert.deepEqual(app.errors, []);
});

test("Decision 211: the Codex result's Add lands in the encounter it sits in, even with another running", () => {
  const app = tableWithPack();
  app.window.eval(`const r = Engine.addEncounter(S.table, { name: "Run" }).id; Engine.addParticipant(S.table, r, { kind: "pc", name: "Wren" }); Engine.startEncounter(S.table, r);
    Engine.addEncounter(S.table, { name: "Open" });`);
  app.click('[data-tsec="encounters"]');
  app.$$("[data-enc-open]").find(b => b.textContent === "Open").click();
  app.click("[data-enc-codex]"); type(app, "[data-enc-codexq]", "gull");
  app.click(`[data-enc-addcodex="${PACK_ID}|gull"]`);
  const by = Object.fromEntries(encRows(app).map(e => [e.name, e.rows]));
  assert.deepEqual(by.Open, ["Gull"]); assert.deepEqual(by.Run, ["Wren"]);
  assert.deepEqual(app.errors, []);
});

test("Decision 211: with no pack slotted, an encounter's Add says to slot one in", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); encTab(app); newEncounter(app, "E");
  assert.equal(app.$("[data-enc-codex]"), null);
  assert.match(app.$(".enc-add").textContent, /From the Codex: slot a pack in on Threats\./);
  assert.deepEqual(app.errors, []);
});
