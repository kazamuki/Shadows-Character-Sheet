/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: the sheet in play: Conditions, hits, loadout, undo, the cascade,
 * the picker, keyboard and accessibility, the roll box.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, stored } from "./harness.mjs";
import { Engine, D, lockedCharacter, openSheet, activeChar, pickFromCatalog, search, clickIn, draft, draftOn, wizCss, writtenInCharacter, focused } from "./smokekit.mjs";

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
  assert.equal(resumed.meta.schemaVersion, "0.22");
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
  assert.equal(app.$$("#main .pick h2").some(h => h.textContent === "Animal Ken"), false, "a Mortal-only Advantage is still listed (P4, W96)");
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

// ── The picker's modal pass (W23–W26) ────────────────────────────────
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

// ── W47: a keyboard press keeps its place ────────────────────────────
// Enter on a button is its click, and a browser focuses what the keyboard
// is on, so a "press" here is focus, then click. After the re-render, focus
// is on the pressed control's twin, or, where the press greyed or hid it, on
// something nearby that changes nothing: never <body>, never the neighbour.
const press = (app, sel) => { const el = app.$(sel); assert.ok(el, `no ${sel}`); el.focus(); el.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true })); };
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

// ── P1 (sheet-wishlist): the Improved roll box, Pain Sensitive on Main ──
test("W93 / Decision 213: Improved asks for the dice, shows + 15 IP, and grants the dice plus 15; Undo takes both back", () => {
  const ch = lockedCharacter();
  ch.progression.milestonePoints = 5;
  const app = openSheet(ch, "progression");
  app.click('[data-takeminor="improved"]');
  const prompt = app.$("[data-improvroll]").closest(".trk");
  assert.match(prompt.textContent, /3d10/, "the prompt doesn't name the dice");
  assert.match(prompt.textContent, /\+ 30 IP/, "the prompt doesn't show the flat IP");
  const box = app.$("[data-improvroll]"); box.value = "14";
  app.click("[data-improvok]");
  const now = activeChar(app);
  assert.deepEqual(now.progression.milestones.minor.map(m => m.id), ["improved"]);
  const grant = now.progression.ip.log.find(e => /Improved/.test(e.note));
  assert.equal(grant.amount, 44, "14 on the dice and the 30 aren't 44");
  assert.match(grant.note, /rolled 14/);
  app.click('[data-sec="sessions"]');
  app.click("button[data-undolast]");
  const back = activeChar(app);
  assert.equal(back.progression.milestones.minor.length, 0, "Undo left the Minor");
  assert.equal(back.progression.ip.log.filter(e => /Improved/.test(e.note)).length, 0, "Undo left the IP");
  assert.deepEqual(app.errors, []);
});

test("W93: an empty box takes nothing and says so", () => {
  const ch = lockedCharacter();
  ch.progression.milestonePoints = 5;
  const app = openSheet(ch, "progression");
  app.click('[data-takeminor="improved"]');
  app.click("[data-improvok]");
  const now = activeChar(app);
  assert.equal(now.progression.milestones.minor.length, 0, "a Minor was taken with no roll");
  assert.equal(now.progression.ip.log.length, 0, "IP was granted with no roll");
  assert.match(app.$(".toast-msg").textContent, /Enter the dice you rolled\./);
  assert.ok(app.$("[data-improvroll]"), "the prompt closed on a refusal");
  assert.deepEqual(app.errors, []);
});

test("W93: a roll that isn't a whole number is refused, and the prompt says which die explodes", () => {
  const ch = lockedCharacter();
  ch.progression.milestonePoints = 5;
  const app = openSheet(ch, "progression");
  app.click('[data-takeminor="improved"]');
  assert.match(app.$("[data-improvroll]").closest(".trk").textContent, /10s explode/);
  app.$("[data-improvroll]").value = "14.5";
  app.click("[data-improvok]");
  const now = activeChar(app);
  assert.equal(now.progression.milestones.minor.length, 0, "a decimal roll took the Minor");
  assert.equal(now.progression.ip.log.length, 0, "a decimal roll granted IP");
  assert.match(app.$(".toast-msg").textContent, /Enter the dice you rolled\./);
});

test("W93: the prompt reads its numbers from the data", () => {
  const ch = lockedCharacter();
  ch.progression.milestonePoints = 5;
  const app = openSheet(ch, "progression");
  app.window.eval(`SHADOWS_DATA.milestones.minorShared.find(m=>m.id==="improved").ipRoll = { count:3, sides:10, plus:30 }`);
  app.click('[data-takeminor="improved"]');
  const text = app.$("[data-improvroll]").closest(".trk").textContent;
  assert.match(text, /3d10/);
  assert.match(text, /\+ 30 IP/);
  assert.deepEqual(app.errors, []);
});

test("W92 / Decision 213: a Pain Sensitive character at 2 Health Levels lost reads Pain Level 2 on Main and names Pain Sensitive", () => {
  const ch = lockedCharacter();
  ch.stats.BOD.base = 10;
  ch.disadvantages = [{ id: "pain-sensitive", rank: 1 }];
  ch.trackers.damage = 10;
  const app = openSheet(ch, "main");
  const main = app.$("#main").textContent;
  assert.match(main, /Lv 2/, "Pain isn't Lv 2");
  assert.match(main, /\+1 Lv from Pain Sensitive/);
  assert.deepEqual(app.errors, []);
});
