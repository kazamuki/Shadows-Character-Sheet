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
import { Engine, D, lockedCharacter, openSheet, activeChar, pickFromCatalog, search, clickIn, draft, draftOn, wizCss, writtenInCharacter, focused, lockedVampire, type } from "./smokekit.mjs";

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
  assert.equal(resumed.meta.schemaVersion, "0.30");
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

test("Take a hit: neither an Electric hit nor a Blade hit calls its RES rule unsettled (F23 closed, Decision 219)", () => {
  const app = openSheet(lockedCharacter(), "trackers");
  app.click("[data-hitopen]");
  setHit(app, "damage", "4");
  setHit(app, "damageType", "electric");
  assert.doesNotMatch(app.$("[data-hitpanel]").textContent, new RegExp(D.appCopy.unsettledLabel));
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

// ── P8a: the hit (Decision 219) ───────────────────────────────────────
test("P8a 12: the hit modal says what halved it", () => {
  const ch = lockedCharacter();
  ch.armor.push({ id: "urban-tactics-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: ["Resistance — Electric"] });
  const app = openSheet(ch, "trackers");
  app.click("[data-hitopen]");
  setHit(app, "damageType", "electric");
  setHit(app, "damage", "13");
  setHit(app, "protRoll", "2");
  const panel = app.$("[data-hitpanel]").textContent;
  assert.match(panel, /Resistance — Electric halves it: 13 → 6\./);
  assert.doesNotMatch(panel, new RegExp(D.appCopy.unsettledLabel));
  assert.deepEqual(app.errors, []);
});

test("P8a 13: From a spell shows only with AP and Natural Armor", () => {
  const ch = lockedCharacter();
  ch.advantages.push({ id: "thick-skin", rank: 3 });
  const app = openSheet(ch, "trackers");
  app.click("[data-hitopen]");
  setHit(app, "damage", "8");
  setHit(app, "damageType", "blunt");
  assert.equal(app.$('[data-hit="spell"]'), null, "the tick shows before AP");
  setHit(app, "ap", true);
  assert.match(app.$("[data-hitpanel]").textContent, /From a spell/);
  assert.doesNotMatch(app.$(".hitresult").textContent, /goes straight past Natural Armor/);
  setHit(app, "spell", true);
  assert.match(app.$(".hitresult").textContent, /Armor-piercing magic goes straight past Natural Armor\./);
  setHit(app, "ap", false);
  assert.equal(app.$('[data-hit="spell"]'), null, "the tick stayed after AP came off");
  setHit(app, "ap", true);
  assert.equal(app.$('[data-hit="spell"]').checked, false, "spell survived unticking AP");
  assert.deepEqual(app.errors, []);

  const bare = openSheet(lockedCharacter(), "trackers");
  bare.click("[data-hitopen]");
  setHit(bare, "ap", true);
  assert.equal(bare.$('[data-hit="spell"]'), null, "a character with no Natural Armor sees the tick");
});

test("P8a 14: Loadout offers the three typed Resistances", () => {
  const ch = lockedCharacter();
  ch.armor.push({ id: "urban-tactics-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: ["Resistance"] });
  const app = openSheet(ch, "loadout");
  const offered = [...app.$("[data-upgpick]").options].map(o => o.value);
  for (const t of ["Thermal", "Electric", "Freezing"]) assert.ok(offered.includes(`Resistance — ${t}`), t);
  assert.ok(!offered.includes("Resistance"), "the retired one is offered");
  assert.match(app.$(".lo-upgrades .cond-chip").textContent, /Resistance/, "the installed untyped chip is gone");
  assert.doesNotMatch(app.$("#main").textContent, new RegExp(D.appCopy.unsettledLabel), "the retired one is flagged");
  const fz = lockedCharacter();
  fz.armor.push({ id: "urban-tactics-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: ["Resistance — Freezing"] });
  assert.match(openSheet(fz, "loadout").$("#main").textContent, /Freezing Resistance doesn't halve anything yet/);
  const el = lockedCharacter();
  el.armor.push({ id: "urban-tactics-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: ["Resistance — Electric"] });
  assert.doesNotMatch(openSheet(el, "loadout").$("#main").textContent, new RegExp(D.appCopy.unsettledLabel));
  assert.deepEqual(app.errors, []);
});

// ── P8b: healing counts from 0 HP (Decision 220) ──────────────────────────
// BOD 6 is 6 Health Levels x 5 = 30 HP; "7 past zero" is damage 37.
const pastZeroSubject = (damage, extra = {}) => {
  const ch = lockedCharacter();
  ch.stats.BOD.base = 6;
  ch.trackers.damage = damage;
  return Object.assign(ch, extra);
};
const setField = (app, sel, value) => { const el = app.$(sel); el.value = value; el.dispatchEvent(new app.window.Event("change", { bubbles: true })); };

test("P8b 13: Heal 1 from past zero lands on 1 HP", () => {
  const app = openSheet(pastZeroSubject(37), "main");
  app.click('.vital-verbs [data-dmg="-1"]');
  assert.equal(activeChar(app).trackers.damage, 29);
  assert.match(app.$("#main").textContent, /1\s*\/\s*30/);
  assert.match(app.$("#undotoast").textContent, /Heal 1/);
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).trackers.damage, 37);
  // The Admin option keeps it, so a step comes off the full total.
  const gritty = openSheet(pastZeroSubject(37, { houseRules: { keepDamagePastZero: true } }), "main");
  gritty.click('.vital-verbs [data-dmg="-1"]');
  assert.equal(activeChar(gritty).trackers.damage, 36);
  assert.match(gritty.$("#main").textContent, /6 past zero/);
  assert.deepEqual([...app.errors, ...gritty.errors], []);
});

test("P8b 14: the Rest panel says the overflow goes first", () => {
  const app = openSheet(pastZeroSubject(37), "trackers");
  app.click('[data-actopen="rest"]');
  setField(app, '[data-act="hp"]', "1");
  const panel = app.$('[data-actpanel="rest"]').textContent;
  assert.match(panel, /The 7 past zero go first\./);
  assert.match(panel, /Damage 37 → 29\./);
  app.click("[data-actapply]");
  assert.equal(activeChar(app).trackers.damage, 29);
  assert.match(app.$("#undotoast").textContent, /\+1 HP/);
  const one = openSheet(pastZeroSubject(31), "trackers");
  one.click('[data-actopen="rest"]');
  setField(one, '[data-act="hp"]', "1");
  assert.match(one.$('[data-actpanel="rest"]').textContent, /The 1 past zero goes first\./);
  assert.deepEqual([...app.errors, ...one.errors], []);
});

test("P8b 15: past zero shows only while down and past it", () => {
  const at = (damage, section) => openSheet(pastZeroSubject(damage), section);
  const trackers = at(37, "trackers"), main = at(37, "main");
  assert.match(trackers.$("#main .trk").textContent, /7 past zero/);
  assert.match(main.$("#main").textContent, /7 past zero/);
  assert.equal(trackers.$(".vpill.hp").textContent.replace(/\s+/g, ""), "HP−7/30");
  assert.equal(trackers.$('#vdrawer [data-vpop="hp"]').textContent.replace(/\s+/g, ""), "HP−7/30", "the pinned drawer's HP row");
  trackers.click(".vpill.hp");
  assert.match(trackers.$("#vpop").textContent, /7 past zero/, "the HP popover");
  for (const damage of [30, 12]) {
    const t = at(damage, "trackers"), m = at(damage, "main");
    assert.doesNotMatch(t.$("#main").textContent, /past zero/, `damage ${damage} on Trackers`);
    assert.doesNotMatch(m.$("#main").textContent, /past zero/, `damage ${damage} on Main`);
  }
  assert.equal(at(30, "trackers").$(".vpill.hp").textContent.replace(/\s+/g, ""), "HP0/30", "down but not past zero reads as before");
  assert.deepEqual(trackers.errors, []);
});

test("P8b 16: Admin keeps damage past zero, undoably", () => {
  const app = openSheet(pastZeroSubject(37), "main");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  const box = () => app.$("[data-admin-keepzero]");
  assert.equal(box().checked, false, "off by default");
  box().checked = true; box().dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(activeChar(app).houseRules.keepDamagePastZero, true);
  app.click('[data-sec="sessions"]');
  assert.match(app.$("#main").textContent, /Admin: keep damage past zero/);
  app.click("button[data-undolast]");
  assert.equal(activeChar(app).houseRules.keepDamagePastZero, false);
  assert.deepEqual(app.errors, []);
});

test("P8b 17: Turn Reset while Dying shows the marks and the check", () => {
  const app = openSheet(pastZeroSubject(30, { trackers: { ...pastZeroSubject(30).trackers, conditions: [{ id: "dying", marks: 0 }, { id: "bleeding" }] } }), "trackers");
  app.click('[data-actopen="reset"]');
  const panel = app.$('[data-actpanel="reset"]');
  assert.match(panel.textContent, /1 Death Mark/);
  assert.ok(panel.querySelector('[data-act="dyingCheck"]'), "the Dying check is asked beside the mark");
  assert.doesNotMatch(panel.textContent, new RegExp(D.appCopy.unsettledLabel), "no unsettled notice");
  app.click("[data-actapply]");
  assert.match(app.$("#undotoast").textContent, /Mark the Dying check/, "Apply refuses until the check is marked");
  assert.equal(activeChar(app).trackers.damage, 30, "a refused Apply changed nothing");
  setField(app, '[data-act="dyingCheck"]', "fail");
  app.click("[data-actapply]");
  assert.equal(activeChar(app).trackers.conditions.find(c => c.id === "dying").marks, 2, "the ticking source's mark and the failed check's");
  assert.deepEqual(app.errors, []);
});

// ── P9a: a refused mod says why (Deighton's ruling, 2026-10-10 Q8) ───────
test("P9a 9: the SG-88's mod list says why the Scope won't go on", () => {
  const ch = lockedCharacter();
  ch.weapons = [{ id: "sg88-siege-breaker", notes: "", mods: [], roundsSpent: 0 }];
  const app = openSheet(ch, "loadout");
  const opt = id => app.$(`[data-wmodpick] option[value="${id}"]`);
  assert.ok(opt("Scope"), "the mod list has no Scope");
  assert.equal(opt("Scope").disabled, true);
  assert.match(opt("Scope").textContent, /Scope \(1 slot\) — Shotguns don't take scopes\./);
  assert.match(opt("Angel Mod").textContent, /Angel Rounds need a box magazine with a power cell\./);
  assert.match(opt("Silencer").textContent, /Doesn't go on Shotguns\./, "a refusal with no reason changed");
  assert.deepEqual(app.errors, []);
});

// ── Holding a spell (Decision 224, W87) ───────────────────────────────
function holdingCharacter(held = ["fog-shroud"]) {
  const ch = lockedCharacter();
  ch.archetypeChoices.disciplines = { evocation: 3 - Engine.disciplineRanks(ch).find(d => d.id === "evocation").rank };
  ch.panelData.grimoire = ["fog-shroud", "wind-walker"].map(spellId => ({ spellId, stage: "known", notes: "" }));
  ch.trackers.heldSpells = held;
  return ch;
}

test("P10 10: the Pain line and Main say what's held, and Main's Let go releases it", () => {
  const app = openSheet(holdingCharacter(), "main");
  assert.match(app.$("[data-holding]").textContent, /Holding Fog Shroud: −1 Essence die/);
  assert.match(app.$(".cond-grid").textContent, /Holding Fog Shroud: −1 Essence die/, "Pain's card doesn't say it at Pain 0");
  assert.match(app.$(".cond-grid").textContent, /no penalties/, "the hold changed Pain's own line");
  app.click('[data-holding] [data-letgo="fog-shroud"]');
  assert.deepEqual(activeChar(app).trackers.heldSpells, []);
  assert.equal(app.$("[data-holding]"), null, "the line stayed with nothing held");
  assert.ok(!/Holding/.test(app.$("#main").textContent));
  app.click("[data-toastundo]");
  assert.deepEqual(activeChar(app).trackers.heldSpells, ["fog-shroud"]);
  assert.deepEqual(app.errors, []);
});

test("P10 10b: two holds read as dice, and the Trackers tab names them", () => {
  const app = openSheet(holdingCharacter(["fog-shroud", "wind-walker"]), "trackers");
  assert.match(app.$("#main").textContent, /Holding 2 spells: −2 Essence dice/);
  assert.deepEqual(app.errors, []);
});

test("P10 11: the hit panel prompts the check and lets go; Apply still applies the hit", () => {
  const app = openSheet(holdingCharacter(), "trackers");
  app.click("[data-hitopen]");
  setHit(app, "damage", "5");
  const box = app.$("#modal [data-concentration]");
  assert.ok(box, "no Concentration prompt on a hit that gets through");
  assert.match(box.textContent, /You're holding Fog Shroud\. A WILL Essence check keeps it\. Your GM sets the TN and TH\./);
  assert.ok(!/F\d\d/.test(box.textContent), "a flag id rendered");
  setHit(app, "damage", "0");
  assert.equal(app.$("#modal [data-concentration]"), null, "a prompt with nothing through");
  setHit(app, "damage", "5");
  app.click('#modal [data-letgo="fog-shroud"]');
  assert.deepEqual(activeChar(app).trackers.heldSpells, []);
  assert.equal(activeChar(app).trackers.damage, 0, "Let go applied the hit");
  assert.equal(app.$("#modal [data-concentration]"), null, "the prompt stayed after Let go");
  assert.equal(app.window.document.activeElement, app.$("#modal [data-hitapply]"), "focus didn't go to Apply");
  app.click("[data-hitapply]");
  assert.ok(activeChar(app).trackers.damage > 0, "Apply no longer applies the hit");
  assert.deepEqual(app.errors, []);
});

test("P10 11b: applying a hit that drops you to zero lets nothing go on its own", () => {
  const app = openSheet(holdingCharacter(), "trackers");
  app.click("[data-hitopen]");
  setHit(app, "category", "massive");
  setHit(app, "damage", "60");
  setHit(app, "atZero", "pass");
  assert.ok(app.$("#modal [data-concentration]"), "going down didn't prompt");
  app.click("[data-hitapply]");
  assert.deepEqual(activeChar(app).trackers.heldSpells, ["fog-shroud"], "the hold dropped on its own");
  assert.deepEqual(app.errors, []);
});

test("P10 12: with no dice left the pool line says so, and several holds read the plural check in the hit panel", () => {
  const ch = holdingCharacter(["fog-shroud", "wind-walker", "blazing-fury"]);
  ch.panelData.grimoire.push({ spellId: "blazing-fury", stage: "known", notes: "" });
  const app = openSheet(ch, "loadout");
  assert.match(app.$("#main").textContent, /holding 3: no dice left/);
  assert.ok(!app.$$("#main .grim-sp").some(p => /exploding 10/.test(p.title)), "the pool line promises an exploding 10 with no dice left");
  assert.equal(app.$("#main .beyond"), null, "a spell was marked Beyond your pool with no dice left");
  app.click('[data-sec="trackers"]');
  app.click("[data-hitopen]");
  setHit(app, "damage", "5");
  assert.match(app.$("#modal [data-concentration]").textContent, /You're holding Fog Shroud, Wind Walker and Blazing Fury\. A WILL Essence check keeps each one\./);
  assert.deepEqual(app.errors, []);
});

// ── P11: SFR spent this round, a Custom pool on Main, and movement (W97, W54, W98) ───────

function streetVampire() {
  const ch = lockedVampire("strigoi");
  ch.creation.powerLevel = "street";
  return ch;
}

test("P11 10: Main's SFR card counts the round and warns past RoU, and Turn Reset clears it", () => {
  const app = openSheet(streetVampire(), "main");
  const card = () => app.$('#main [data-vpop="sfr"]').textContent;
  assert.match(card(), /RoU 4/);
  app.click('#main [data-vpop="sfr"]');
  for (let i = 0; i < 3; i++) press(app, '#vpop [data-trk="sfr|1"]');
  assert.match(card(), /RoU 4 · 3 this round/);
  assert.match(app.$("#vpop").textContent, /3 of 4 this round/);
  press(app, '#vpop [data-trk="sfr|1"]');
  assert.match(card(), /RoU 4 · 4 this round/);
  assert.match(app.$("#vpop").textContent, /4 of 4 this round: that's your Rate of Use/);
  assert.ok(app.$('#main [data-vpop="sfr"]').classList.contains("danger"), "the card didn't go to the danger class at RoU");
  press(app, '#vpop [data-trk="sfr|1"]');
  assert.match(card(), /RoU 4 · 5 this round/);
  assert.ok(!/GM's call/.test(card()), "the card's line grew into a sentence, so the popover's +1 moves under the finger");
  assert.match(app.$("#vpop").textContent, /5 this round, 1 past your Rate of Use\. Your GM's call\./);
  assert.equal(focused(app), app.$('#vpop [data-trk="sfr|1"]'), "focus left the +1");
  assert.deepEqual(activeChar(app).trackers.sfr, { spent: 5, turn: 5 }, "the +1 past RoU was refused");
  // The count doesn't outlive the fight: Turn Reset is one press from Main's popover, not only a tab away.
  app.click("#vpop [data-popreset]");
  assert.match(app.$("#main").textContent, /5 this round, 1 past your Rate of Use/, "the Trackers row doesn't say it");
  assert.match(app.$('[data-actpanel="reset"]').textContent, /SFR spent this round: 5 → 0/);
  assert.equal(app.$("[data-actapply]").disabled, false, "Apply Reset is disabled with only SFR spent");
  app.click("[data-actapply]");
  assert.deepEqual(activeChar(app).trackers.sfr, { spent: 5, turn: 0 });
  app.click("[data-toastundo]");
  assert.deepEqual(activeChar(app).trackers.sfr, { spent: 5, turn: 5 }, "one Undo didn't put the count back");
  assert.deepEqual(app.errors, []);
});

test("P11 11: a Custom pool gets Main's card once its max is set, with no Rate of Use", () => {
  const app = openSheet(writtenInCharacter(), "trackers");
  assert.equal(app.$('#main [data-trkmax="sfr"]').value, "");
  const inp = app.$('#main [data-trkmax="sfr"]');
  inp.value = "12"; inp.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.ok(app.$('#main [data-trkmax="sfr"]'), "the max box went away once it was set, so it can't be changed");
  assert.equal(activeChar(app).trackers.panel.sfr.max, 12);
  app.click('[data-sec="main"]');
  const card = app.$('#main [data-vpop="sfr"]');
  assert.ok(card, "no SFR card on Main");
  assert.match(card.textContent, /12\s*\/12/);
  assert.ok(!/RoU/.test(card.textContent), "the card says RoU for a pool that has none");
  assert.ok(!/undefined|null|NaN/.test(card.textContent));
  assert.deepEqual(app.$$("#main .cond.alone").map(c => c.classList.contains("crank")), [true], "SFR and Çredits fill a row, and CRANK (on, Decision 239) is alone on the next");
  assert.deepEqual(app.errors, []);
});

test("P11 12: Main shows movement, and Fleet of Foot for a True Warrior", () => {
  const line = app => app.$("#main .main-combat [data-movement]").textContent.replace(/\s+/g, " ");
  const base = openSheet(lockedCharacter(), "main");
  assert.match(line(base), /Walk 5m · Run 15m \(−1\) · Sprint 30m \(−3\) · Jump 7m/);
  const tw = lockedCharacter();
  tw.identity.archetype = "professional"; tw.archetypeChoices.specialization = ["true-warrior"];
  const app = openSheet(tw, "main");
  assert.match(line(app), /Fleet of Foot, while active: Run 30m · Sprint 60m · Jump 15m/);
  assert.ok(!/Walk 10/.test(line(app)), "Fleet doubled Walk");
  assert.ok(!/Fleet of Foot/.test(line(openSheet(streetVampire(), "main"))), "a Vampire has Fleet of Foot");
  const prone = lockedCharacter(); prone.trackers.conditions = [{ id: "prone" }];
  assert.match(line(openSheet(prone, "main")), /Prone: half move$/);
  assert.ok(!/attack/i.test(line(openSheet(prone, "main"))), "the movement line repeats the Condition's attack penalty");
  assert.deepEqual(app.errors, []);
});

// ── P20b: numbers in play (Decision 236) ──────────────────────────────
const held20b = (ch, kind, id, rank = 1) => { ch[kind].push({ id, rank, notes: "" }); return ch; };

test("P20b 6: Take a hit asks what hit you only when it matters", () => {
  const plain = openSheet(lockedCharacter(), "trackers");
  plain.click("[data-hitopen]");
  assert.equal(plain.$('[data-hit="melee"]'), null, "the box shows to a character holding neither trait");
  const ch = held20b(held20b(lockedCharacter(), "advantages", "scrapper"), "disadvantages", "giant");
  const app = openSheet(ch, "trackers");
  app.click("[data-hitopen]");
  const box = app.$('[data-hit="melee"]');
  assert.ok(box, "a Scrapper and a Giant isn't asked");
  assert.match(box.closest("label").textContent, /Melee or Martial Arts/);
  assert.equal(box.checked, false, "the box starts ticked");
  setHit(app, "damage", "12");
  assert.match(app.$(".hitresult").textContent, /12 gets through/);
  setHit(app, "melee", true);
  const text = app.$(".hitresult").textContent;
  assert.match(text, /Giant: 12 → 8\./);
  assert.match(text, /Scrapper: 8 → 4\./);
  assert.match(text, /4 gets through/);
  app.click("[data-hitapply]");
  assert.equal(activeChar(app).trackers.damage, 4);
  assert.equal(JSON.stringify(activeChar(app)).includes('"melee"'), false, "the box was saved on the character");
  // A new hit starts unticked: it is form state.
  app.click("[data-hitopen]");
  assert.equal(app.$('[data-hit="melee"]').checked, false, "the box carried over to the next hit");
  setHit(app, "location", "head"); setHit(app, "damage", "2");
  assert.match(app.$(".hitresult").textContent, /Head: ×2 \(2 → 4\)\./);
  assert.deepEqual(app.errors, []);
});

test("P20b 6b: a head hit says it doubles, and says Thick Skull answers it", () => {
  const bare = openSheet(lockedCharacter(), "trackers");
  bare.click("[data-hitopen]");
  setHit(bare, "location", "head"); setHit(bare, "damage", "5");
  assert.match(bare.$(".hitresult").textContent, /Head: ×2 \(5 → 10\)\./);
  assert.match(bare.$(".hitresult").textContent, /10 gets through/);
  const skull = openSheet(held20b(lockedCharacter(), "advantages", "thick-skull"), "trackers");
  skull.click("[data-hitopen]");
  setHit(skull, "location", "head"); setHit(skull, "damage", "5");
  assert.match(skull.$(".hitresult").textContent, /Head: not doubled \(Thick Skull\)\./);
  assert.match(skull.$(".hitresult").textContent, /5 gets through/);
  assert.deepEqual([...bare.errors, ...skull.errors], []);
});

test("P20b 3b: the Rest panel proposes by every multiplier and names them", () => {
  const ch = held20b(lockedCharacter(), "advantages", "rapid-healing", 2);
  ch.trackers.damage = 30;
  const bod = Engine.statTable(ch).BOD.value;
  const app = openSheet(ch, "trackers");
  app.click('[data-actopen="rest"]');
  assert.equal(app.$('[data-act="hp"]').value, String(bod * 3));
  assert.match(app.$("[data-restsum]").textContent, new RegExp(`^BOD ${bod} × 3 \\(Rapid Healing\\) = ${bod * 3} a day$`));
  const speed = app.$('[data-act="speed"]');
  speed.checked = true; speed.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(app.$('[data-act="hp"]').value, String(bod * 6));
  assert.match(app.$("[data-restsum]").textContent, new RegExp(`× 3 \\(Rapid Healing\\) × 2 \\(Speed Heal\\) = ${bod * 6} a day`));
  app.click("[data-actapply]");
  assert.equal(activeChar(app).trackers.damage, Math.max(0, 30 - bod * 6));
  app.click('[data-sec="sessions"]');
  assert.match(app.$("#main").textContent, /Rested 1 day \(×3 Rapid Healing, ×2 Speed Heal\)/);
  // Nothing held: no sum line, and the proposal is BOD.
  const plain = openSheet(lockedCharacter(), "trackers");
  plain.click('[data-actopen="rest"]');
  assert.equal(plain.$("[data-restsum]"), null);
  assert.equal(plain.$('[data-act="hp"]').value, String(Engine.statTable(lockedCharacter()).BOD.value));
  // No days of rest heals nothing, and the sum doesn't call 0 a day's healing.
  const zero = openSheet(held20b(lockedCharacter(), "advantages", "rapid-healing", 2), "trackers");
  zero.click('[data-actopen="rest"]');
  const days = zero.$('[data-act="days"]');
  days.value = "0"; days.dispatchEvent(new zero.window.Event("change", { bubbles: true }));
  assert.match(zero.$("[data-restsum]").textContent, new RegExp(`^BOD ${bod} × 3 \\(Rapid Healing\\) × 0 days = 0$`));
  assert.deepEqual([...app.errors, ...plain.errors, ...zero.errors], []);
});

test("P20b 9: Pain says where it came from, on Main, Trackers and paper", () => {
  const ch = held20b(lockedCharacter(), "disadvantages", "terminal-disease");
  const app = openSheet(ch, "main");
  assert.match(app.$("#main").textContent, /\+1 Lv from Terminal Disease/);
  const tab = openSheet(JSON.parse(JSON.stringify(ch)), "trackers");
  assert.match(tab.$("#main").textContent, /Terminal Disease add\w* \+1/);
  const filled = app.window.renderPrintView(ch);
  assert.match(filled, /\+1 Lv from Terminal Disease/, "paper doesn't name the trait beside the ladder");
  // Pain Tolerance takes it back: level 0, and the card says who.
  held20b(ch, "advantages", "pain-tolerance");
  const calm = openSheet(JSON.parse(JSON.stringify(ch)), "main");
  assert.match(calm.$("#main").textContent, /no penalties · \+1 Lv from Terminal Disease · −1 Lv Pain Tolerance/);
  assert.match(openSheet(JSON.parse(JSON.stringify(ch)), "trackers").$("#main").textContent, /Pain Tolerance takes 1 off: −1 Pain Level\./);
  assert.match(app.window.renderPrintView(ch), /−1 Lv Pain Tolerance/);
  // The blank ladder's note reads its thresholds from the data (a mutant edit to the bands moves it).
  const blank = () => app.window.renderPrintView(null).match(/thresholds at ([^)]*?) HL lost/)[1];
  assert.equal(blank(), "2, 5, 8");
  app.window.eval("D.resources.healthLevels.painLevels[1].hlLostThreshold = 3");
  assert.equal(blank(), "3, 5, 8", "the note is a copy of the data");
  assert.deepEqual([...app.errors, ...calm.errors, ...tab.errors], []);
});

test("P21 11 (sheet): Speed Heal doubles one day, the sum line and the log say so, and one dose leaves your gear", () => {
  const ch = lockedCharacter();
  const hp = Engine.health(ch).total;
  ch.trackers.damage = hp - 1;
  ch.gear.push({ id: "speed-heal", qty: 2, notes: "" });
  const bod = Engine.statTable(ch).BOD.value;
  const app = openSheet(ch, "trackers");
  app.click('[data-actopen="rest"]');
  const days = app.$('[data-act="days"]');
  days.value = "3"; days.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  const speed = app.$('[data-act="speed"]');
  speed.checked = true; speed.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(app.$('[data-act="hp"]').value, String(bod * 4), "6 × 2 for the dosed day, + 6 + 6 reads 4 days' worth");
  const sum = app.$("[data-restsum]").textContent;
  assert.ok(sum.endsWith(`(Speed Heal doubles one day) = ${bod * 4}`), sum);
  assert.doesNotMatch(sum, /× 2 \(Speed Heal\) × 3 days/);
  // Nothing multiplies every day here: "BOD 5 a day × 3 days = 15, + 5 (Speed Heal doubles one day) = 20", not "BOD 5 = 5 a day".
  assert.equal(sum, `BOD ${bod} a day × 3 days = ${bod * 3}, + ${bod} (Speed Heal doubles one day) = ${bod * 4}`);
  app.click("[data-actapply]");
  assert.equal(activeChar(app).trackers.damage, Math.max(0, hp - 1 - bod * 4));
  assert.equal(activeChar(app).gear.find(g => g.id === "speed-heal").qty, 1, "one dose leaves your gear");
  app.click('[data-sec="sessions"]');
  assert.match(app.$("#main").textContent, /Rested 3 days \(Speed Heal doubled one day\)/);
  assert.deepEqual(app.errors, []);
});

// ── W70: a custom row folds ─────────────────────────────────────────────
test("W70 (sheet): a custom row folds, opens and folds again, and saves nothing", () => {
  const ch = lockedCharacter();
  Engine.addLoadout(ch, "weapons", D.weapons[0].id);
  const own = (name, extra = {}) => Object.assign({ custom: true, name, type: "", damage: "", rof: "", capacity: "", ammo: "", features: "", notes: "", roundsSpent: 0 }, extra);
  ch.weapons.push(own("Grandad's Revolver", { type: "Pistol", damage: "2d6", rof: "S", capacity: "6", ammo: ".38", features: "Engraved" }),
    own("Zip Gun"), own(""));
  ch.armor.push({ custom: true, name: "Riot Plate", prot: "1d6", res: 2, integrity: 20, coverage: "light", integrityLoss: 0, notes: "", worn: false, scrapped: false, upgrades: [] });
  ch.gear.push({ custom: true, name: "Lockpicks", type: "Tools", notes: "" });
  const app = openSheet(ch, "loadout");
  const audit = () => activeChar(app).audit.length, shown = sel => { const el = app.$(sel); return !!el && !el.hidden; };

  // A named row reads folded, as a catalog line does: in the catalog's table, with no fields.
  for (const sel of ['[data-cell="weapons|1|name"]', '[data-cell="weapons|2|name"]', '[data-armorfield="0|name"]', '[data-cell="gear|0|name"]'])
    assert.equal(app.$(sel), null, `${sel} isn't folded`);
  const table = app.$("table.lo-weapons").textContent;
  for (const t of ["Grandad's Revolver", "Pistol", "2d6", "Engraved", ".38", "Zip Gun"]) assert.ok(table.includes(t), `the folded weapon doesn't show ${t}`);
  assert.match(app.$(".lo-armor").textContent, /Riot Plate/);
  assert.match(app.$(".lo-gear").textContent, /Lockpicks/);
  assert.match(app.$(".lo-gear").textContent, /Tools/);

  // A nameless row reads open, and Done waits for a name.
  assert.ok(app.$('[data-cell="weapons|3|name"]'), "the nameless weapon isn't open");
  assert.equal(shown('[data-lodone="weapons|3"]'), false, "Done is offered before the row has a name");

  // Edit opens a row, focus in its first field; Done folds it, focus on its Edit. Neither is saved.
  const before = audit(), rows = JSON.stringify(activeChar(app).weapons);
  for (const [kind, i, field] of [["weapons", 1, '[data-cell="weapons|1|name"]'], ["armor", 0, '[data-armorfield="0|name"]'], ["gear", 0, '[data-cell="gear|0|name"]']]) {
    app.click(`[data-loedit="${kind}|${i}"]`);
    assert.ok(app.$(field), `Edit didn't open the ${kind} row`);
    assert.equal(focused(app), app.$(field), `Edit didn't put focus in the ${kind} row's first field`);
    assert.ok(shown(`[data-lodone="${kind}|${i}"]`), `the open ${kind} row offers no Done`);
    app.click(`[data-lodone="${kind}|${i}"]`);
    assert.equal(app.$(field), null, `Done didn't fold the ${kind} row`);
    assert.equal(focused(app), app.$(`[data-loedit="${kind}|${i}"]`), `Done didn't put focus on the ${kind} row's Edit`);
  }
  assert.equal(audit(), before, "folding or opening a row wrote to the audit trail");
  assert.equal(JSON.stringify(activeChar(app).weapons), rows, "folding or opening a row saved something");

  // Naming the open row offers Done, and a re-render doesn't fold it under the player.
  const name = app.$('[data-cell="weapons|3|name"]');
  name.value = "Shiv"; name.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  assert.ok(shown('[data-lodone="weapons|3"]'), "a named open row offers no Done");

  // "+ Custom weapon" adds a row that reads open, focus in it.
  app.click('[data-locustom="weapons"]');
  assert.ok(app.$('[data-cell="weapons|4|name"]'), "the new weapon doesn't read open");
  assert.equal(focused(app), app.$('[data-cell="weapons|4|name"]'), "focus isn't in the new weapon");
  assert.ok(app.$('[data-cell="weapons|3|name"]'), "a row named while open folded on the next render");
  app.click('[data-locustom="armor"]');
  assert.equal(focused(app), app.$('[data-armorfield="1|name"]'), "focus isn't in the new armor");
  app.click('[data-rowadd="gear"]');
  assert.equal(focused(app), app.$('[data-cell="gear|1|name"]'), "focus isn't in the new gear row");
  const plate = app.$('[data-armorfield="1|name"]');
  plate.value = "Shield"; plate.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.ok(app.$('[data-armorfield="1|name"]'), "naming new armor folded it before Done");

  // Done straight from an armor field it hasn't left: one press keeps focus there, commits the edit once, and folds.
  const prot = app.$('[data-armorfield="1|prot"]');
  prot.focus(); prot.value = "1d8";
  const press = new app.window.MouseEvent("mousedown", { bubbles: true, cancelable: true });
  app.$('[data-lodone="armor|1"]').dispatchEvent(press);
  assert.ok(press.defaultPrevented, "pressing Done takes focus out of the field, so the change re-renders under the click");
  const was = audit();
  app.click('[data-lodone="armor|1"]');
  assert.equal(activeChar(app).armor[1].prot, "1d8", "Done dropped the edit it was pressed over");
  assert.equal(audit(), was + 1, "Done's edit isn't one logged change");
  assert.equal(app.$('[data-armorfield="1|name"]'), null, "Done didn't fold the armor in one press");

  // An undo puts back copies of the rows, so an open row reads folded after one, without errors.
  // Ken accepted this: an undo folds open custom rows, the way a reload does.
  app.click('[data-loedit="weapons|1"]');                       // the revolver
  const kept = JSON.stringify(activeChar(app).weapons);
  app.click('[data-fire="1|S"]');
  app.click("#undotoast [data-toastundo]");
  assert.equal(JSON.stringify(activeChar(app).weapons), kept, "the undo lost something from the weapons");
  assert.equal(app.$('[data-cell="weapons|1|name"]'), null, "an undo left a copied row open");
  assert.deepEqual(app.errors, []);

  // The open state follows the row, not its index.
  app.click('[data-loedit="weapons|2"]');                       // Zip Gun
  app.click('[data-lorm="weapons|1"]');                          // the revolver, above it
  assert.equal((app.$('[data-cell="weapons|1|name"]') || {}).value, "Zip Gun", "removing a row above closed the open one");

  // A reload folds every named row again.
  const again = openSheet(activeChar(app), "loadout");
  for (const sel of ['[data-cell="weapons|1|name"]', '[data-cell="weapons|2|name"]', '[data-armorfield="0|name"]', '[data-armorfield="1|name"]', '[data-cell="gear|0|name"]'])
    assert.equal(again.$(sel), null, `${sel} is open after a reload`);
  assert.ok(again.$('[data-cell="weapons|3|name"]'), "the nameless row folded on a reload");
  assert.deepEqual(app.errors, []);
  assert.deepEqual(again.errors, []);
});

// ── L1: a weapon's damage type, and the note on one the book doesn't type ──
test("L1 5 (sheet): a handgun's Loadout card says Ballistic, and a bow's says its type is the GM's call", () => {
  const ch = lockedCharacter();
  Engine.addLoadout(ch, "weapons", "cheapshot");
  Engine.addLoadout(ch, "weapons", "urban-recurve-bow");
  const bow = D.weapons.find(w => w.id === "urban-recurve-bow");
  assert.ok(bow.playerNote, "the bow has no playerNote");
  const app = openSheet(ch, "loadout");
  const rows = [...app.$$("table.lo-weapons tbody tr")].filter(r => r.querySelector("b"));
  const cheap = rows.find(r => /Cheapshot/.test(r.textContent));
  assert.equal(cheap.querySelector(".lo-sub").textContent, "Handguns · Ballistic");
  const card = (name) => { const r = rows.find(x => x.textContent.includes(name)); return r.textContent + (r.nextElementSibling && r.nextElementSibling.classList.contains("lo-modrow") ? r.nextElementSibling.textContent : ""); };
  assert.ok(card("Urban Recurve Bow").includes(bow.playerNote), "the bow's note isn't on its card");
  assert.ok(card("Urban Recurve Bow").includes(D.appCopy.unsettledLabel));
  assert.ok(!card("Cheapshot").includes(D.appCopy.unsettledLabel));
  assert.ok(!card("Cheapshot").includes(bow.playerNote));
  assert.equal(app.errors.length, 0);
  app.click('[data-sec="main"]');
  const m = app.$("#main").textContent;
  assert.ok(!m.includes(bow.playerNote) && !m.includes(D.appCopy.unsettledLabel), "Main shows the note");
});

// ── L2: a custom weapon reads like the catalog's ────────────────────────
function l2Character(zip = {}) {
  const ch = lockedCharacter();
  ch.skills.handguns = { rank: 3, ipe: 0 };
  Engine.addLoadout(ch, "weapons", "cheapshot");
  ch.weapons.push(Object.assign({ custom: true, name: "Zip gun", damage: "BOD+3", rof: "S", capacity: "4", ammo: "", features: "", notes: "", roundsSpent: 0 }, zip));
  return ch;
}
const l2Typed = { category: "handguns", damageType: "ballistic", range: "Short", acc: 1 };
const rowOf = (app, i) => app.$(`#main [data-weaponrow="${i}"]`);
const cellsOf = row => [...row.querySelectorAll("td")].map(td => td.textContent.replace(/\s+/g, " ").trim());

test("L2 8 (sheet): a typed custom weapon's folded row on Loadout reads like a catalog row", () => {
  const app = openSheet(l2Character(l2Typed), "loadout");
  const zip = rowOf(app, 1), cheap = rowOf(app, 0);
  assert.ok(zip && cheap, "the weapon rows aren't found by their index");
  assert.equal(zip.querySelector(".lo-sub").textContent, "Handguns · Ballistic");
  const [name, attack, damage, range] = cellsOf(zip);
  assert.match(name, /^Zip gun/);
  assert.match(attack, /^1d10 \+ 8/);
  assert.match(attack, /\+1 ACC on Single/);
  assert.equal(damage, "8BOD+3");
  assert.equal(range, "Short");
  // The catalog row beside it reads the same attack, and keeps the catalog's own range word.
  assert.match(cellsOf(cheap)[1], /^1d10 \+ 8/);
  assert.equal(cellsOf(cheap)[3], "Low");
  // An untyped one has no attack and says so.
  const bare = openSheet(l2Character(), "loadout");
  assert.equal(cellsOf(rowOf(bare, 1))[1], "—");
  assert.deepEqual([...app.errors, ...bare.errors], []);
});

test("L2 9 (sheet): Main and the print sheet show a typed custom weapon's attack and range", () => {
  const ch = l2Character(l2Typed);
  const app = openSheet(ch, "main");
  const row = app.$$("#main table.ref tbody tr").find(tr => /Zip gun/.test(tr.textContent));
  assert.ok(row, "Main has no row for the Zip gun");
  assert.match(cellsOf(row)[1], /^1d10 \+ 8/);
  assert.match(cellsOf(row)[2], /^8/);
  const page = app.window.renderPrintView(ch);
  const tr = page.split("<tr>").find(r => /Zip gun/.test(r));
  assert.ok(tr, "the printed sheet has no row for the Zip gun");
  assert.match(tr, /1d10\+8 \(\+1 ACC\)/);
  assert.match(tr, />Short</);
  // The old type text names a printed row only while there's no type.
  const old = l2Character({ type: "pistol" });
  assert.match(app.window.renderPrintView(old), /Zip gun · pistol/);
  assert.doesNotMatch(app.window.renderPrintView(l2Character({ type: "pistol", category: "handguns" })), /Zip gun · pistol/);
  assert.deepEqual(app.errors, []);
});

test("L2 10 (sheet): each pick on an open custom weapon is one undoable action, and a saved type shows until a type is picked", () => {
  const app = openSheet(l2Character({ type: "pistol" }), "loadout");
  const audit = () => activeChar(app).audit;
  app.click('[data-loedit="weapons|1"]');
  const open = () => rowOf(app, 1);
  assert.ok(open().querySelector('[data-cell="weapons|1|name"]'), "Edit didn't open the row");
  assert.equal(open().querySelector('[data-cell="weapons|1|type"]'), null, "the old type is still a typed cell");
  assert.match(open().querySelector("[data-weapontypehint]").textContent, /pistol/);
  // Typing is not audited.
  const before = audit().length;
  type(app, '[data-cell="weapons|1|name"]', "Zip gunner");
  assert.equal(audit().length, before, "a keystroke was audited");
  type(app, '[data-cell="weapons|1|name"]', "Zip gun");
  // Picking a type: one entry, the row stays open, focus stays on the control, the hint goes.
  const pick = (field, value) => {
    const el = open().querySelector(`[data-weaponpick="1|${field}"]`);
    el.focus(); el.value = value; el.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  };
  pick("category", "handguns");
  assert.equal((app.window.document.activeElement.dataset || {}).weaponpick, "1|category", "a pick moved focus off the Type control");
  const last = audit().at(-1);
  assert.equal(audit().length, before + 1);
  assert.match(last.label, /Zip gun/);
  assert.match(last.label, /Handguns/);
  assert.equal(activeChar(app).weapons[1].category, "handguns");
  assert.equal(activeChar(app).weapons[1].type, "pistol", "a pick cleared the saved type");
  assert.ok(open().querySelector('[data-cell="weapons|1|name"]'), "the pick folded the row");
  assert.equal(open().querySelector("[data-weapontypehint]"), null, "the hint stayed after a type was picked");
  // Undo takes the type back (the row folds, as W70 recorded) and the saved type shows again.
  app.click("#undotoast [data-toastundo]");
  assert.equal(audit().length, before, "undo left the audit entry");
  assert.ok(!Object.hasOwn(activeChar(app).weapons[1], "category"), "undo left the type");
  assert.equal(activeChar(app).weapons[1].type, "pistol");
  app.click('[data-loedit="weapons|1"]');
  assert.match(open().querySelector("[data-weapontypehint]").textContent, /pistol/);
  pick("category", "handguns");
  // Damage type, range, ACC.
  pick("damageType", "blade");
  pick("range", "Long");
  assert.equal(activeChar(app).weapons[1].damageType, "blade");
  assert.equal(activeChar(app).weapons[1].range, "Long");
  const acc = open().querySelector('[data-weaponpick="1|acc"]');
  acc.value = "2"; acc.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(activeChar(app).weapons[1].acc, 2);
  assert.match(audit().at(-1).label, /ACC/);
  assert.ok(open().querySelector('[data-cell="weapons|1|name"]'), "a pick folded the row");
  // A refused ACC stores nothing and says why.
  const n = audit().length;
  const acc2 = open().querySelector('[data-weaponpick="1|acc"]');
  acc2.value = "-1"; acc2.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(activeChar(app).weapons[1].acc, 2, "a refused ACC was stored");
  assert.equal(audit().length, n);
  assert.match(app.$("#undotoast").textContent, /ACC is a whole number, 0 or more/, "a refused ACC gave no reason");
  assert.deepEqual(app.errors, []);
});

// ── L3: worn armor and gear in use carry modifiers ──────────────────────
function l3Character() {
  const ch = lockedCharacter();
  ch.stats.TECH.base = 8;
  ch.skills.handguns = { rank: 3, ipe: 0 };
  return ch;
}
const gearRowOf = (app, name) => app.$$("#main .lo-gear-row").find(r => r.querySelector("b") && r.querySelector("b").textContent === name);
const armorCardOf = (app, name) => app.$$("#main .lo-armor").find(r => r.querySelector(".lo-armor-head b") && r.querySelector(".lo-armor-head b").textContent === name);
const flip = (app, el, on) => { el.focus(); el.checked = on; el.dispatchEvent(new app.window.Event("change", { bubbles: true })); };
const interfaceRow = app => app.$$("#main tr.skill-line").find(tr => tr.querySelector('[data-skillname="interface"]'));

test("L3 9 (sheet): a gear row with modifiers has an In use toggle, and turning it on is one undoable action that moves Interface's check", () => {
  const ch = l3Character();
  Engine.addLoadout(ch, "gear", "smart-deck-ii");
  Engine.addLoadout(ch, "gear", "smart-brace");
  const bare = Engine.skillLine(ch, "interface").checkBonus;
  const app = openSheet(ch, "loadout");
  const deck = gearRowOf(app, "SMART Deck II"), brace = gearRowOf(app, "SMART Brace");
  assert.ok(deck && brace, "the gear rows aren't found by their names");
  assert.ok(deck.querySelector("input[data-inuse]"), "the deck has no In use toggle");
  assert.equal(brace.querySelector("input[data-inuse]"), null, "a row with no modifiers has a toggle");
  const audit = () => activeChar(app).audit;
  const before = audit().length;
  flip(app, deck.querySelector("input[data-inuse]"), true);
  assert.equal(audit().length, before + 1, "turning it on wasn't one audit entry");
  assert.match(audit()[audit().length - 1].label, /^Using SMART Deck II$/);
  assert.equal(activeChar(app).gear[0].inUse, true);
  const now = gearRowOf(app, "SMART Deck II");
  assert.equal(app.window.document.activeElement, now.querySelector("input[data-inuse]"), "focus left the toggle");
  assert.match(now.querySelector("[data-inuseline]").textContent, /\+2 Interface/);
  assert.equal(gearRowOf(app, "SMART Brace").querySelector("[data-inuseline]"), null, "the sub line drew on the next row");
  app.click('[data-sec="skills"]');
  const row = interfaceRow(app);
  assert.match(cellsOf(row)[2], new RegExp(`^1d10 \\+ ${bare + 2}`));
  assert.match(row.textContent, /\+2 SMART Deck II/);
  assert.match(row.textContent, /untrained/);
  app.click('[data-sec="loadout"]');
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).gear[0].inUse, undefined, "undo left it in use");
  app.click('[data-sec="skills"]');
  assert.match(cellsOf(interfaceRow(app))[2], new RegExp(`^1d10 \\+ ${bare}(?!\\d)`));
  app.click('[data-sec="loadout"]');
  flip(app, gearRowOf(app, "SMART Deck II").querySelector("input[data-inuse]"), true);
  const n = audit().length;
  flip(app, gearRowOf(app, "SMART Deck II").querySelector("input[data-inuse]"), false);
  assert.equal(audit().length, n + 1);
  assert.match(audit()[audit().length - 1].label, /^Put away SMART Deck II$/);
  assert.equal(app.window.document.activeElement, gearRowOf(app, "SMART Deck II").querySelector("input[data-inuse]"), "focus left the toggle");
  assert.ok(!Object.hasOwn(activeChar(app).gear[0], "inUse"));
  // A page the engine refuses (the entry loses its modifiers after it was drawn): nothing is written, the toggle reads the stored state again, and a notice says why.
  const deckDef = app.window.SHADOWS_DATA.equipment.find(e => e.id === "smart-deck-ii"), kept = deckDef.grants;
  deckDef.grants = undefined;
  const cb = gearRowOf(app, "SMART Deck II").querySelector("input[data-inuse]"), logged = audit().length;
  flip(app, cb, true);
  deckDef.grants = kept;
  assert.equal(audit().length, logged, "a refused toggle was audited");
  assert.ok(!Object.hasOwn(activeChar(app).gear[0], "inUse"), "a refused toggle wrote");
  assert.equal(cb.checked, false, "the toggle shows a state that wasn't stored");
  assert.match(app.$("#undotoast").textContent, /Nothing on this works by being in use/);
  assert.deepEqual(app.errors, []);
});

test("L3 10 (sheet): SMARTLink Gloves worn raise a SMART Link weapon's ACC on Loadout, Main and print, and say so on their card", () => {
  const ch = l3Character();
  Engine.addLoadout(ch, "weapons", "ap7-sentry");
  Engine.addLoadout(ch, "weapons", "cheapshot");
  Engine.addLoadout(ch, "armor", "smartlink-gloves");
  const bare = JSON.parse(JSON.stringify(ch));
  bare.armor[0].worn = false;
  const base = Engine.weaponLine(bare, 0).acc;
  const app = openSheet(ch, "loadout");
  assert.match(armorCardOf(app, "SMARTLink Gloves").textContent, /\+2 ACC on SMART Link weapons/);
  assert.doesNotMatch(armorCardOf(app, "SMARTLink Gloves").textContent, /Worn: \+2 ACC/);
  const ap = rowOf(app, 0), cheap = rowOf(app, 1);
  assert.match(cellsOf(ap)[1], new RegExp(`\\+${base + 2} ACC on Single`));
  assert.match(ap.textContent, /\+2 from SMARTLink Gloves/);
  assert.doesNotMatch(cheap.textContent, /from SMARTLink Gloves/);
  assert.doesNotMatch(cellsOf(cheap)[1], /ACC on Single/);
  app.click('[data-sec="main"]');
  const mainRow = app.$$("#main table.ref tbody tr").find(tr => /AP-7/.test(tr.textContent));
  assert.match(cellsOf(mainRow)[1], new RegExp(`\\+${base + 2} ACC Single`));
  const page = app.window.renderPrintView(activeChar(app));
  assert.match(page.split("<tr>").find(r => /AP-7/.test(r)), new RegExp(`\\(\\+${base + 2} ACC\\)`));
  app.click('[data-sec="loadout"]');
  flip(app, armorCardOf(app, "SMARTLink Gloves").querySelector("input[data-worn]"), false);
  assert.match(cellsOf(rowOf(app, 0))[1], new RegExp(`\\+${base} ACC on Single`));
  assert.doesNotMatch(rowOf(app, 0).textContent, /from SMARTLink Gloves/);
  assert.match(armorCardOf(app, "SMARTLink Gloves").textContent, /Worn: \+2 ACC on SMART Link weapons/);
  assert.deepEqual(app.errors, []);
});

test("L3 11 (sheet): a flagged piece says the GM rules it, on its own card, and moves no number", () => {
  const visor = D.armor.find(a => a.id === "hacking-visor"), gloves = D.armor.find(a => a.id === "hacking-gloves");
  assert.ok(visor.playerNote && gloves.playerNote && visor.playerNote !== gloves.playerNote);
  const ch = l3Character();
  Engine.addLoadout(ch, "armor", "hacking-visor");
  Engine.addLoadout(ch, "armor", "hacking-gloves");
  assert.equal(ch.armor[0].worn, true);
  const off = JSON.parse(JSON.stringify(ch));
  off.armor.forEach(a => { a.worn = false; });
  for (const s of D.skills) assert.equal(Engine.skillLine(ch, s.id).checkBonus, Engine.skillLine(off, s.id).checkBonus, s.id);
  const app = openSheet(ch, "loadout");
  assert.ok(armorCardOf(app, "Hacking Visor").textContent.includes(visor.playerNote), "the visor's note isn't on its card");
  assert.ok(!armorCardOf(app, "Hacking Gloves").textContent.includes(visor.playerNote), "the visor's note is on the next card");
  assert.ok(armorCardOf(app, "Hacking Gloves").textContent.includes(gloves.playerNote));
  assert.deepEqual(app.errors, []);
});
