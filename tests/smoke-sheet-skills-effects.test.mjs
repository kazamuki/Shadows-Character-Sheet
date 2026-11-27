/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: a style learned in play, Skills that learn from traits, powers, tweaks and Milestones, the skill tables, your own spells, the game's words in the sheet's sentences and a trait part's sign. Its other half is smoke-sheet-skills-grid.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot } from "./harness.mjs";
import { Engine, D, lockedCharacter, openSheet, activeChar, clickIn, card, tipShown, pick, tip, focused, strigoi } from "./smokekit.mjs";

// ── P12b: a style learned in play, and its bonus (Decision 229) ─────────────────

const maChar = (styles = ["karate"], extra = {}) => {
  const ch = lockedCharacter();
  ch.identity.archetype = "professional";
  ch.meta.gamedataVersion = D.meta.gamedataVersion;
  ch.skills["martial-arts"] = { rank: 2, ipe: 0, selections: { style: styles.slice() } };
  Object.assign(ch, extra);
  return ch;
};

const maRow = app => app.$('#main [data-skillname="martial-arts"]').closest("tr");

const maChips = app => [...maRow(app).querySelectorAll(".skill-picked .chip")].map(c => c.textContent.replace(/\s+/g, " ").trim());

test("P12b 11: Add a style from Main and from the Skills tab is one commit and one Undo, and the maneuver line carries each bonus", () => {
  const app = openSheet(maChar(["karate"]), "main");
  assert.ok(app.$('#main [data-addstyle="martial-arts"]'), "Main's Combat skills have no Add a style");
  assert.match(app.$('#main [data-addstyle="martial-arts"]').textContent, /Add a style/);
  assert.match(maRow(app).textContent, /Combat Maneuvers/);
  assert.match(maRow(app).querySelector("[data-maneuvers]").textContent, /Stun/);
  assert.doesNotMatch(maRow(app).querySelector("[data-maneuvers]").textContent, /Grapple/, "Karate improves Stun only");
  const audits = () => activeChar(app).audit.length;
  const n0 = audits();
  app.click('#main [data-addstyle="martial-arts"]');
  assert.ok(app.$("#modal").open, "Add a style didn't open a chooser");
  assert.ok(!app.$('#modal [data-addpick="karate"]'), "a held style is offered again");
  assert.match(app.$("#modal").textContent, /\+1 Grapple/, "the style's bonus text shows in the chooser");
  app.click('#modal [data-addpick="jujitsu"]');
  assert.equal(app.$("#modal").open, false, "one press adds the style and closes");
  assert.equal(audits(), n0 + 1, "one commit");
  assert.deepEqual([...activeChar(app).skills["martial-arts"].selections.style], ["karate", "jujitsu"]);
  assert.match(app.$("#undotoast").textContent, /Jujitsu/);
  assert.match(maRow(app).querySelector("[data-maneuvers]").textContent, /Grapple/);
  assert.match(maRow(app).querySelector("[data-maneuvers]").textContent, /Stun/);
  // The Skills tab is the same renderer.
  app.click('[data-sec="skills"]');
  assert.ok(app.$('#main [data-addstyle="martial-arts"]'), "the Skills tab has no Add a style");
  app.click('#main [data-addstyle="martial-arts"]');
  app.click('#modal [data-addpick="commando"]');
  assert.deepEqual([...activeChar(app).skills["martial-arts"].selections.style], ["karate", "jujitsu", "commando"]);
  assert.equal(maChips(app).length, 3, "three style chips");
  const stun = maRow(app).querySelector("[data-maneuvers]").textContent;
  assert.match(stun, /Commando \+1, Karate \+1|Karate \+1, Commando \+1/, "two styles on Stun stack, each named");
  const base = Engine.skillLine(activeChar(app), "martial-arts").checkBonus;
  assert.match(stun, new RegExp(`1d10 \\+ ${base + 2}`));
  // Undo takes back the third; again, the second.
  app.click("[data-toastundo]");
  assert.deepEqual([...activeChar(app).skills["martial-arts"].selections.style], ["karate", "jujitsu"]);
  assert.deepEqual(app.errors, []);
});

test("P12b 11b: Add a style is gone once every style is held, and focus lands on the row's name cell, never the page", () => {
  const all = D.skills.find(s => s.id === "martial-arts").styles.map(s => s.id);
  const app = openSheet(maChar(all.slice(0, -1)), "main");
  app.click('#main [data-addstyle="martial-arts"]');
  app.click(`#modal [data-addpick="${all.at(-1)}"]`);
  assert.equal(app.$('#main [data-addstyle="martial-arts"]'), null, "the button stayed with nothing left to add");
  assert.notEqual(focused(app), app.window.document.body, "focus fell to <body>");
  assert.ok(focused(app).matches('[data-skillname="martial-arts"]'), "focus isn't on the skill's name cell");
  // A skill that is not trained, or a sheet not locked, has no button.
  const raw = maChar([]); raw.skills["martial-arts"] = { rank: 0, ipe: 0 };
  const app2 = openSheet(raw, "skills");
  assert.equal(app2.$('#main [data-addstyle]'), null, "an untrained Martial Arts offers a style");
  assert.deepEqual(app.errors, []);
});

test("P12b 11c: a Martial Arts bought with IP takes a first style", () => {
  const ch = maChar([]);
  ch.skills["martial-arts"] = { rank: 0, ipe: 1 };
  const app = openSheet(ch, "skills");
  app.click('#main [data-addstyle="martial-arts"]');
  app.click('#modal [data-addpick="kung-fu"]');
  assert.deepEqual([...activeChar(app).skills["martial-arts"].selections.style], ["kung-fu"]);
  assert.match(maRow(app).querySelector("[data-maneuvers]").textContent, /Knockdown/);
  assert.deepEqual(app.errors, []);
});

// ── P19: Skills learn from traits, on the sheet (Decision 233) ────────────
// A character with Skills trained, then whatever traits the test holds. The Skills tab and Main's Combat table are one renderer.

const p19Char = mut => {
  const ch = lockedCharacter();
  ch.identity.archetype = "professional";      // an Arcanist's Aetheric Attunement is a mark on Awareness (P21)
  for (const [id, rank] of Object.entries({ stealth: 2, medical: 2, "combat-sense": 2, investigation: 3, "basic-tech": 2, awareness: 2, handguns: 3, intuition: 1, persuasion: 1 })) ch.skills[id] = { rank, ipe: 0 };
  mut(ch);
  return ch;
};

const p19Hold = (ch, kind, id, rank = 1, extra = {}) => { ch[kind].push({ id, rank, notes: "", ...extra }); };

const p19Row = (app, id) => app.$(`#main [data-skillname="${id}"]`).closest("tr");

const p19Fx = (app, id, what) => [...p19Row(app, id).querySelectorAll(`.skill-fx [data-fx="${what}"]`)].map(e => e.textContent.replace(/\s+/g, " ").trim());

test("P19 1 (sheet): a trait's number is in the check, and the breakdown names it", () => {
  const ch = p19Char(c => { p19Hold(c, "advantages", "ghost-step"); c.disadvantages.push({ id: "defect-flaw", rank: 1, notes: "", selections: { skill: ["handguns"], detail: "x" } }); });
  const app = openSheet(ch, "skills");
  const st = Engine.skillLine(ch, "stealth"), hg = Engine.skillLine(ch, "handguns");
  assert.equal(p19Row(app, "stealth").querySelector('[data-k="Check"]').textContent, `1d10 + ${st.checkBonus}`);
  assert.match(p19Row(app, "stealth").querySelector(".bd").textContent, /\+3 Ghost Step/);
  assert.equal(p19Row(app, "handguns").querySelector('[data-k="Check"]').textContent, `1d10 + ${hg.checkBonus}`);
  assert.match(p19Row(app, "handguns").querySelector(".bd").textContent, /−2 Defect\/Flaw/, "a true minus, named");
  assert.doesNotMatch(p19Row(app, "medical").querySelector(".bd").textContent, /Ghost|Defect/);
  // Main's Combat table is the same renderer.
  const main = openSheet(ch, "main");
  assert.match(p19Row(main, "handguns").querySelector(".bd").textContent, /−2 Defect\/Flaw/);
  assert.deepEqual([...app.errors, ...main.errors], []);
});

test("P19 2 (sheet): a kicker is beside the number on the Skills tab, Main's table and the printed sheet", () => {
  const ch = p19Char(c => { p19Hold(c, "advantages", "field-medic"); p19Hold(c, "advantages", "hyper-vigilance"); });
  const med = Engine.skillLine(ch, "medical").checkBonus, cs = Engine.skillLine(ch, "combat-sense").checkBonus;
  const app = openSheet(ch, "skills");
  assert.equal(p19Row(app, "medical").querySelector('[data-k="Check"]').textContent, `1d10 + ${med} + 1d4`);
  assert.equal(p19Row(app, "combat-sense").querySelector('[data-k="Check"]').textContent, `1d10 + ${cs} + 1d4`);
  assert.equal(p19Row(app, "stealth").querySelector('[data-k="Check"]').textContent.includes("d4"), false, "a kicker on another Skill");
  const main = openSheet(ch, "main");
  assert.equal(p19Row(main, "combat-sense").querySelector('[data-k="Check"]').textContent, `1d10 + ${cs} + 1d4`);
  app.window.print = () => {};
  app.click("[data-menu-toggle]"); app.click("[data-print]");
  const flat = e => e.textContent.replace(/\s+/g, "");
  const cells = app.$$("#printSheet .p-skillcell").map(flat), rows = app.$$("#printSheet tr").map(flat);
  assert.ok(cells.some(t => t.startsWith("CombatSense") && t.endsWith(`1d10+${cs}+1d4`)), cells.join("|"));
  assert.ok(rows.some(t => t.startsWith("Medical") && t.includes(`1d10+${med}+1d4`)), rows.filter(t => /Medical/.test(t)).join("|"));
  assert.ok(rows.some(t => t.startsWith("Stealth") && t.includes("1d10+") && !t.includes("d4")));
  assert.ok(!cells.some(t => t.startsWith("Dodge") && t.includes("d4")));
  assert.deepEqual([...app.errors, ...main.errors], []);
});

test("P19 3 (sheet): Take X reads its total with the choice first, and each source shows", () => {
  const ch = p19Char(c => {
    p19Hold(c, "advantages", "machindo"); p19Hold(c, "advantages", "lightning-calculator");
    p19Hold(c, "advantages", "common-sense", 2, { selections: { skill: ["basic-tech", "investigation"] } });
  });
  const app = openSheet(ch, "skills");
  const inv = Engine.skillLine(ch, "investigation").checkBonus;
  assert.deepEqual(p19Fx(app, "investigation", "takeX"), [`Take 6: ${6 + inv} (choose before you roll) · Common Sense`]);
  const bt = Engine.skillLine(ch, "basic-tech").checkBonus;
  assert.deepEqual(p19Fx(app, "basic-tech", "takeX"), [
    `Take 6: ${6 + bt} (choose before you roll) · Common Sense`,
    `Take 6: ${6 + bt} with technology (choose before you roll) · Machindo`,
    `Take 6: ${6 + bt} not in combat (choose before you roll) · Lightning Calculator`,
  ]);
  assert.deepEqual(p19Fx(app, "stealth", "takeX"), []);
  assert.equal(p19Row(app, "investigation").querySelector('[data-k="Check"]').textContent, `1d10 + ${inv}`, "Take X is not in the number");
  assert.deepEqual(app.errors, []);
});

test("P19 4 (sheet): the die faces are marked on the Skills they touch, and nowhere else", () => {
  const ch = p19Char(c => {
    p19Hold(c, "disadvantages", "distractable"); p19Hold(c, "disadvantages", "gullible");
    p19Hold(c, "advantages", "refined-skill", 2, { selections: { skill: ["stealth", "medical"] } });
  });
  const app = openSheet(ch, "skills");
  const marks = id => p19Fx(app, id, "mark");
  assert.deepEqual(marks("awareness"), ["Fails on a natural 2 or 3 (a 1 still botches) · Distractable"]);
  assert.deepEqual(marks("combat-sense"), ["Fails on a natural 2 or 3 (a 1 still botches) · Distractable"]);
  assert.deepEqual(marks("intuition"), ["Fails on a natural 2 or 3 spotting a lie, unless it's preposterous (a 1 still botches) · Gullible"]);
  assert.deepEqual(marks("stealth"), ["Explodes on a natural 9 or 10 · Refined Skill"]);
  assert.deepEqual(marks("medical"), ["Explodes on a natural 9 or 10 · Refined Skill"]);
  assert.deepEqual(marks("handguns"), []);
  assert.deepEqual(marks("persuasion"), []);
  assert.equal(app.$$(".skill-fx").length, 5);
  assert.deepEqual(app.errors, []);
});

test("P19 5 (sheet): Night Vision names the light it cancels on Awareness and under Main's attacks", () => {
  const ch = p19Char(c => { p19Hold(c, "advantages", "night-vision"); c.weapons.push({ id: "vs4-ironside", notes: "", mods: [], roundsSpent: 0 }); });
  const app = openSheet(ch, "skills");
  assert.deepEqual(p19Fx(app, "awareness", "mark"), ["No Dim or Dark penalty on visual checks · Night Vision"]);
  const main = openSheet(ch, "main");
  const note = main.$$(".main-combat [data-attacknote]");
  assert.equal(note.length, 1);
  assert.equal(note[0].textContent.replace(/\s+/g, " ").trim(), "Dim −1 and Dark −3 don't apply to your attacks · Night Vision");
  const table = main.$(".main-combat table.ref:not(.skill-table)");
  assert.ok(table.compareDocumentPosition(note[0]) & main.window.Node.DOCUMENT_POSITION_FOLLOWING, "the note isn't under the attacks table");
  // The note follows the data.
  main.D.visibility.find(v => v.id === "dim").attack = -2;
  main.window.eval("update()");
  assert.match(main.$(".main-combat [data-attacknote]").textContent, /^Dim −2 and Dark −3/);
  // Without Night Vision there is no note, and Awareness has no mark.
  const bare = openSheet(p19Char(c => { c.weapons.push({ id: "vs4-ironside", notes: "", mods: [], roundsSpent: 0 }); }), "main");
  assert.equal(bare.$$("[data-attacknote]").length, 0);
  assert.deepEqual([...app.errors, ...main.errors, ...bare.errors], []);
});

test("P19 (hostile): a trait's words are text on the Skills tab, never markup", () => {
  const ch = p19Char(c => p19Hold(c, "advantages", "common-sense", 1, { selections: { skill: ["investigation"] } }));
  const app = openSheet(ch, "skills");
  app.D.advantages.find(a => a.id === "common-sense").grants.find(g => g.type === "takeX").whenText = "<img src=x onerror=alert(1)>";
  app.window.eval("update()");
  assert.equal(app.$$("#main img").length, 0, "a when became markup");
  assert.match(p19Fx(app, "investigation", "takeX")[0], /<img src=x onerror=alert\(1\)>/);
  assert.deepEqual(app.errors, []);
});

// ── P21: Skills learn from powers, tweaks and Milestones (Decision 237) ───

const p21Pro = (spec, ...majors) => p19Char(c => {
  c.identity.archetype = "professional"; c.archetypeChoices.specialization = spec ? [spec] : [];
  for (const id of majors) c.progression.milestones.major.push({ id, date: "2026-10-21" });
});

test("P21 1 (sheet): a Cleaner's Stealth shows Vanish's kicker in the cell and on paper", () => {
  const ch = p21Pro("cleaner");
  const st = Engine.skillLine(ch, "stealth").checkBonus;
  const app = openSheet(ch, "skills");
  assert.equal(p19Row(app, "stealth").querySelector('[data-k="Check"]').textContent, `1d10 + ${st} + 1d6`);
  assert.equal(p19Row(app, "medical").querySelector('[data-k="Check"]').textContent.includes("d6"), false);
  app.window.print = () => {};
  app.click("[data-menu-toggle]"); app.click("[data-print]");
  const flat = e => e.textContent.replace(/\s+/g, "");
  const rows = app.$$("#printSheet tr").map(flat), cells = app.$$("#printSheet .p-skillcell").map(flat);
  assert.ok(rows.some(t => t.startsWith("Stealth") && t.includes(`1d10+${st}+1d6`)) || cells.some(t => t.startsWith("Stealth") && t.endsWith(`1d10+${st}+1d6`)), "paper lacks the kicker");
  // A Wheelman's Pilot: the die face and the Take 6 with its when.
  const wh = openSheet(p21Pro("wheelman"), "skills");
  assert.deepEqual(p19Fx(wh, "pilot", "mark"), ["Explodes on a natural 9 or 10 · Stunt Driver"]);
  assert.match(p19Fx(wh, "pilot", "takeX")[0], /^Take 6: \d+ on your next Pilot check, instead of a free stunt, when you declare a stunt for the first time on your turn \(choose before you roll\) · Stunt Driver$/);
  // Slayer: Handguns' attack row on Main has no die; Hunter's Calling is a mark on the Skills tab.
  const sl = p21Pro("slayer"); sl.skills.handguns = { rank: 3, ipe: 0 }; sl.weapons.push({ id: "vs4-ironside", notes: "", mods: [], roundsSpent: 0 });
  const slapp = openSheet(sl, "skills");
  assert.deepEqual(p19Fx(slapp, "handguns", "mark"), ["+1d6 when facing a supernatural enemy · Hunter's Calling"]);
  assert.equal(p19Row(slapp, "handguns").querySelector('[data-k="Check"]').textContent.includes("d6"), false);
  const main = openSheet(sl, "main");
  assert.equal(main.$(".main-combat table.ref:not(.skill-table)").textContent.includes("+ 1d6"), false, "an attack row gained the die");
  assert.deepEqual([...app.errors, ...wh.errors, ...slapp.errors, ...main.errors], []);
});

test("P21 3 (sheet): Take X names the kicker, and the total doesn't change", () => {
  const ch = p21Pro("true-warrior", "quick-study");
  p19Hold(ch, "advantages", "hyper-vigilance");
  const l = Engine.skillLine(ch, "combat-sense");
  const app = openSheet(ch, "skills");
  assert.deepEqual(p19Fx(app, "combat-sense", "takeX"), [`Take 6: ${6 + l.checkBonus} + 1d4 (choose before you roll) · Quick Study`]);
  assert.deepEqual(p19Fx(app, "combat-sense", "mark"), ["+1d4 while Unwavering Focus is active · Unwavering Focus"]);
  assert.equal(p19Row(app, "combat-sense").querySelector('[data-k="Check"]').textContent, `1d10 + ${l.checkBonus} + 1d4`);
  assert.deepEqual(app.errors, []);
});

test("P21 5/6 (sheet): a power's mark carries its rank and its source", () => {
  const ch = lockedCharacter();
  ch.identity.archetype = "werewolf"; ch.archetypeChoices.specialization = ["trueborn"];
  ch.progression.powerIpe = { "scent-tracking": 2 };
  ch.skills.tracking = { rank: 2, ipe: 0 };
  const app = openSheet(ch, "skills");
  assert.deepEqual(p19Fx(app, "tracking", "mark"), ["+4 for creatures within a mile, while Scent Tracking runs · Scent Tracking"]);
  assert.equal(p19Row(app, "tracking").querySelector('[data-k="Check"]').textContent, `1d10 + ${Engine.skillLine(ch, "tracking").checkBonus}`);
  assert.deepEqual(app.errors, []);
});

test("P21 7 (sheet): Night Eyes under Main's attacks and on Awareness, Nocturnal once atop the Skills tab", () => {
  const ch = p19Char(c => { c.identity.archetype = "professional"; c.trackers.aberrations.push({ id: "night-eyes", permanence: "permanent" }, { id: "nocturnal", permanence: "permanent" }); c.weapons.push({ id: "vs4-ironside", notes: "", mods: [], roundsSpent: 0 }); });
  const app = openSheet(ch, "skills");
  assert.deepEqual(p19Fx(app, "awareness", "mark"), ["Dark counts as Dim, and Blind as Dark · Night Eyes"]);
  const notes = app.$$("[data-checknote]");
  assert.equal(notes.length, 1);
  assert.equal(notes[0].textContent.replace(/\s+/g, " ").trim(), "+1 to every check in Dim or Dark, −1 in Bright · Nocturnal");
  assert.ok(notes[0].compareDocumentPosition(app.$(".skill-cols")) & app.window.Node.DOCUMENT_POSITION_FOLLOWING, "the line isn't above the table");
  const main = openSheet(ch, "main");
  const note = main.$$(".main-combat [data-attacknote]");
  assert.equal(note.length, 1);
  assert.equal(note[0].textContent.replace(/\s+/g, " ").trim(), "In Dark, your attacks take −1 instead of −3; in Blind, −3 instead of −5 · Night Eyes");
  const bare = openSheet(p19Char(() => {}), "skills");
  assert.equal(bare.$$("[data-checknote]").length, 0);
  assert.deepEqual([...app.errors, ...main.errors, ...bare.errors], []);
});

test("P21 10 (sheet): the flagged kicker rules show their notes where a player meets them", () => {
  // Major cards on Progression.
  const app = openSheet(p21Pro(null), "progression");
  for (const id of ["specialist", "make-my-own-luck", "survival-instinct"]) {
    const card = app.$(`[data-majorcard="${id}"]`);
    assert.ok(card, `${id} has no card`);
    assert.match(card.textContent, /(Kicker Die (grows|rolls twice) is your GM's call until the rule is settled|When two Kicker Dice meet on one roll, your GM rules how they combine)/);
  }
  assert.deepEqual(app.errors, []);
});

// ── E2b: say each thing once on the skill tables (Decisions 284, 285) ──

const combatIds = () => Array.from(D.skills.filter(s => s.category === "combat").map(s => s.id));   // D lives in another realm: deepEqual wants this realm's array

const mainRows = app => [...app.$$("#main .main-combat .skill-line")];

// Shown means neither the row nor its <tbody> is hidden. Never textContent: it includes hidden rows.
const rowShown = r => !r.hidden && !r.closest("tbody").hidden;

const rowId = r => r.querySelector("[data-skillname]").dataset.skillname;

const shownIds = app => mainRows(app).filter(rowShown).map(rowId);

const foldBtn = app => app.$("#main [data-untrainedfold]");

const trainSome = (ch, ids) => { for (const id of ids) ch.skills[id] = { rank: 1, ipe: 0 }; return ch; };

test("Decision 284: Main shows trained combat skills and folds the rest behind Show N untrained", () => {
  const ids = combatIds(), trained = ids.slice(0, 3), rest = ids.slice(3);
  const ch = trainSome(lockedCharacter(), trained);
  for (const id of rest) assert.equal(Engine.skillLine(ch, id).trained, false);
  const app = openSheet(ch, "main");
  assert.deepEqual(mainRows(app).map(rowId).sort(), [...ids].sort(), "every combat skill is drawn, shown or not");
  assert.deepEqual(shownIds(app), trained, "Main shows more than the trained skills");
  assert.equal(foldBtn(app).textContent.trim(), `Show ${rest.length} untrained`);
  assert.equal(foldBtn(app).getAttribute("aria-expanded"), "false");
  app.click("#main [data-untrainedfold]");
  assert.deepEqual(shownIds(app).sort(), [...ids].sort(), "Show didn't show every combat skill");
  assert.equal(foldBtn(app).textContent.trim(), "Hide untrained");
  assert.equal(foldBtn(app).getAttribute("aria-expanded"), "true");
  assert.equal(focused(app), mainRows(app).find(r => rowId(r) === rest[0]).querySelector("[data-skillname]"), "focus didn't land on the first row that appeared");
  app.click("#main [data-untrainedfold]");
  assert.deepEqual(shownIds(app), trained, "Hide didn't hide");
  assert.equal(focused(app), foldBtn(app), "focus left the button");
  assert.deepEqual(app.errors, []);
});

test("Decision 284: the fold outlives a re-render and starts folded for the next character", () => {
  const app = openSheet(trainSome(lockedCharacter(), combatIds().slice(0, 2)), "main");
  app.click("#main [data-untrainedfold]");
  app.click('[data-dmg="1"]');
  assert.equal(shownIds(app).length, combatIds().length, "a re-render folded the rows again");
  assert.equal(foldBtn(app).textContent.trim(), "Hide untrained");
  // The next character, opened in the same page (a fresh boot would pass whatever openEntry kept).
  app.window.openEntry({ ch: trainSome(lockedCharacter(), combatIds().slice(0, 2)), section: "main" });
  assert.equal(shownIds(app).length, 2, "the next character opens with the rows shown");
  assert.match(foldBtn(app).textContent.trim(), /^Show \d+ untrained$/);
  assert.deepEqual(app.errors, []);
});

test("Decision 284: nothing on Main hides a trained combat skill", () => {
  const trained = combatIds().slice(0, 3);
  const app = openSheet(trainSome(lockedCharacter(), trained), "main");
  const controls = () => [...app.$$("#main .main-combat button, #main .main-combat summary, #main .main-combat [aria-expanded]")];
  const n = controls().length;
  assert.ok(n > 0);
  for (let i = 0; i < n; i++) {
    const el = controls()[i];
    if (!el || !el.isConnected) continue;
    el.click();
    for (const id of trained) assert.ok(shownIds(app).includes(id), `pressing "${el.textContent.trim().slice(0, 20)}" hid ${id}`);
  }
  assert.deepEqual(app.errors, []);
});

test("Decision 284: no combat skill trained gets the button alone, and every one trained gets none", () => {
  const none = openSheet(lockedCharacter(), "main");
  assert.deepEqual(shownIds(none), []);
  assert.equal(foldBtn(none).textContent.trim(), `Show ${combatIds().length} untrained`);
  const head = () => none.$("#main .main-combat .skill-table thead");
  assert.equal(head().hidden, true, "a header row over no rows: the button isn't alone");
  none.click("#main [data-untrainedfold]");
  assert.equal(head().hidden, false, "Show opened the rows under no header");
  none.click("#main [data-untrainedfold]");
  assert.equal(head().hidden, true);
  const all = openSheet(trainSome(lockedCharacter(), combatIds()), "main");
  assert.equal(foldBtn(all), null, "a button with nothing to fold");
  assert.deepEqual(shownIds(all), combatIds());
});

test("Decision 284: an untrained row is dimmed on Skills, and its chips aren't", () => {
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  assert.match(css, /\.skill-table tr\.untrained td\s*\{[^}]*color:\s*var\(--dim\)/, "no rule dims an untrained row");
  assert.match(css, /\.chip\{[^}]*color:var\(--dim\)/, "a chip no longer sets its own colour, so the row's dimming would take it");
  assert.match(css, /\.chip\.gold\{color:var\(--gold\)/);
  const app = openSheet(trainSome(lockedCharacter(), ["handguns"]), "skills");
  const ch = activeChar(app);
  for (const r of app.$$("#main .skill-line")) {
    const l = Engine.skillLine(ch, rowId(r));
    assert.equal(r.classList.contains("untrained"), !l.trained, l.def.name);
  }
});

test("Decision 285: no skill row says pain or conditions, and the line above says the totals include them", () => {
  const ch = trainSome(lockedCharacter(), ["handguns"]);
  const cond = D.conditions.find(c => c.rollPenalty);
  assert.ok(cond, "no Condition carries a rollPenalty");
  ch.trackers.conditions = [{ id: cond.id }];
  ch.trackers.damage = Math.ceil(Engine.health(ch).total / 2);
  assert.ok(Engine.painState(ch).level > 0 && Engine.skillLine(ch, "handguns").breakdown.pain, "the character isn't in Pain");
  for (const sec of ["skills", "main"]) {
    const app = openSheet(ch, sec);
    if (sec === "main") app.click("#main [data-untrainedfold]");
    const rows = app.$$(sec === "main" ? "#main .main-combat .skill-line" : "#main .skill-line");
    assert.ok(rows.length);
    for (const r of rows) {
      const l = Engine.skillLine(ch, rowId(r));
      assert.doesNotMatch(r.querySelector("td.bd").textContent, /pain|conditions/i, `${sec}: ${l.def.name}`);
      assert.equal(r.querySelector('[data-k="Check"]').textContent, `1d10 + ${l.checkBonus}`, `${sec}: ${l.def.name}'s check dropped the penalty`);
    }
    const text = app.$("#main").textContent;
    assert.match(text, sec === "skills" ? /all skill checks take .* already include it/ : /all checks take .* totals below include it/);
    assert.match(text, /totals include it/);
  }
});

test("E2b: Trackers has no intro, and Skills' doesn't describe the software", () => {
  const trackers = openSheet(lockedCharacter(), "trackers");
  const h1 = trackers.$("#main h1.step-title");
  // K1: it has a guide line (data-guide) now; what E2b removed was a rule line, so nothing but the guide line sits under the title.
  const under = h1.nextElementSibling;
  assert.ok(under && under.hasAttribute("data-guide"), "Trackers has no guide line under its title");
  assert.ok(!under.nextElementSibling || !under.nextElementSibling.matches(".step-note"), "Trackers still has an intro under its title");
  const skills = openSheet(lockedCharacter(), "skills");
  assert.doesNotMatch(skills.$("#main .step-note").textContent, /grouped by category/);
  for (const sec of ["character", "main", "skills", "trackers", "progression", "loadout", "notes"]) {
    const a = openSheet(lockedCharacter(), sec);
    const h = a.$("#main h1.step-title");
    const intro = h && h.nextElementSibling && h.nextElementSibling.matches(".step-note") ? h.nextElementSibling : null;
    if (intro) assert.doesNotMatch(intro.textContent, /computed|recalculates|auditable|undoable/, `${sec}'s intro`);
  }
});

test("Decision 284: an untrained combat row that carries something stays shown, and N counts only the rows it hides", () => {
  const ids = combatIds();
  const base = () => trainSome(lockedCharacter(), [ids[0]]);
  const hiddenN = app => Number(/Show (\d+) untrained/.exec(foldBtn(app).textContent)[1]);
  const plainN = ids.length - 1;
  // Hyper Vigilance: a 1d4 kicker on Combat Sense at Rank 0.
  const hv = base(); hv.advantages.push({ id: "hyper-vigilance", rank: 1 });
  assert.equal(Engine.skillLine(hv, "combat-sense").trained, false);
  let app = openSheet(hv, "main");
  const cs = () => mainRows(app).find(r => rowId(r) === "combat-sense");
  assert.ok(rowShown(cs()), "Combat Sense folded with a kicker on it");
  assert.ok(cs().classList.contains("untrained"), "a kept row isn't dimmed");
  assert.match(cs().querySelector('[data-k="Check"]').textContent, /\+ 1d4/);
  assert.equal(hiddenN(app), plainN - 1, "N counts the kept row");
  app.click("#main [data-untrainedfold]"); assert.ok(rowShown(cs()));
  app.click("#main [data-untrainedfold]"); assert.ok(rowShown(cs()));
  // Without the Advantage it folds again and N is back.
  app = openSheet(base(), "main");
  assert.ok(!rowShown(mainRows(app).find(r => rowId(r) === "combat-sense")));
  assert.equal(hiddenN(app), plainN);
  // In training.
  const tr = base(); tr.progression.training = { skill: ids[1], mp: 0, credits: 0, date: "2026-11-12" };
  app = openSheet(tr, "main");
  assert.ok(shownIds(app).includes(ids[1]), "a skill in training folded");
  // Take 6 from a Major Milestone.
  const qs = base(); qs.progression.milestones.major.push({ id: "quick-study", date: "2026-11-12" });
  assert.equal(Engine.skillLine(qs, "combat-sense").trained, false);
  assert.ok(Engine.skillLine(qs, "combat-sense").takeX.length, "no Take X on Combat Sense");
  app = openSheet(qs, "main");
  assert.ok(shownIds(app).includes("combat-sense"), "a Take X row folded");
  // Focused, from a Professional subtype named in the data.
  const pro = base(); pro.identity.archetype = "professional";
  const find = n => n && typeof n === "object" ? ((n.focusedSkills && Array.isArray(n.focusedSkills.ids) && n.focusedSkills.ids.includes("combat-sense") && n.id) || Object.values(n).map(find).find(Boolean)) : null;
  const spec = find(D.archetypes);
  assert.ok(spec, "no subtype focuses Combat Sense");
  pro.archetypeChoices.specialization = [spec];
  assert.ok(Engine.focusedSkillIds(pro).includes("combat-sense"));
  app = openSheet(pro, "main");
  assert.ok(shownIds(app).includes("combat-sense"), "a focused row folded");
  // (A Combat Maneuvers line and a chosen option need a trained skill with the data we have: skipped, not faked.)
  // Everything trained but Combat Sense, which carries a kicker: nothing left to fold.
  const full = trainSome(lockedCharacter(), ids.filter(i => i !== "combat-sense")); full.advantages.push({ id: "hyper-vigilance", rank: 1 });
  app = openSheet(full, "main");
  assert.equal(foldBtn(app), null, "a button with nothing to fold");
  assert.deepEqual(shownIds(app), ids);
  assert.deepEqual(app.errors, []);
});

// ── Your own spells read like the book's (E3, Decision 286) ───────────

const grimPanel = ch => Engine.archPanels(ch).find(p => p.type === "grimoire");

const ownSpells = () => {
  const ch = lockedCharacter(), cols = grimPanel(ch).columns, [N, DI, TN, TH, EF, OV, NO] = cols;
  const book = D.spells.find(s => s.name && !/\s{2,}/.test(s.name));
  const long = "x".repeat(40) + " " + "wraps and never gets cut ".repeat(6).trim();
  ch.panelData.grimoire = [
    { custom: true, [N]: book.name, [DI]: "Evocation", [TN]: "7", [TH]: "1", [EF]: "a snap of current" },
    { custom: true, [N]: "Longhand", [DI]: "Wards", [TN]: "5", [TH]: "2", [EF]: long },
    { custom: true, [N]: "Wordy", [EF]: "short", [OV]: "twice the heat", [NO]: "learned from Ivo" },
  ];
  return { ch, cols, book, long };
};

const lineText = el => el.textContent.replace(/\s+/g, " ").trim();

const ownLines = app => app.$$("#main .spell.own");

const openCount = app => ownLines(app).filter(x => x.classList.contains("open")).length;

test("Decision 286: a named own spell reads as a line, in full, with Link to the book on it", () => {
  const { ch, book, long } = ownSpells();
  const app = openSheet(ch, "character");
  assert.equal(app.$$('#main [data-cell^="grimoire|"]').length, 0, "an own spell drew inputs at rest");
  const [a, b, c] = ownLines(app);
  assert.ok(lineText(a).startsWith(book.name), lineText(a));
  assert.ok(lineText(a).includes("Evocation · TN 7 / TH 1"), lineText(a));
  assert.ok(lineText(b).includes("Wards") && lineText(b).includes("TN 5") && lineText(b).includes("TH 2"));
  assert.ok(lineText(b).includes(long), "the effect was cut");
  assert.ok(!/Overflow|learned from Ivo/.test(lineText(a) + lineText(b)), "overflow or notes drawn where there are none");
  assert.ok(lineText(c).includes("Overflow: twice the heat") && lineText(c).includes("learned from Ivo"));
  assert.ok(a.querySelector("[data-spelllink]"), "no Link to the book on the matching line");
  assert.equal(app.$$("#main [data-spelllink]").length, 1, "Link to the book on a line that doesn't match");
  assert.deepEqual(app.errors, []);
});

test("Decision 286: Edit opens one spell and Done folds it, and neither writes", () => {
  const { ch, cols } = ownSpells();
  const app = openSheet(ch, "character");
  const before = JSON.stringify(activeChar(app)), log = activeChar(app).audit.length;
  app.click('[data-spelledit="1"]');
  assert.equal(openCount(app), 1, "Edit opened more than one");
  assert.ok(app.$(`[data-cell="grimoire|1|${cols[4]}"]`).value.includes("wraps and never"));
  assert.equal(focused(app), app.$(`[data-cell="grimoire|1|${cols[0]}"]`), "focus isn't in the name field");
  assert.equal(JSON.stringify(activeChar(app)), before, "Edit changed the character");
  assert.equal(activeChar(app).audit.length, log, "Edit logged");
  const eff = app.$(`[data-cell="grimoire|1|${cols[4]}"]`);
  eff.value = "now different"; eff.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  assert.equal(activeChar(app).panelData.grimoire[1][cols[4]], "now different");
  app.click('[data-spelldone="1"]');
  assert.ok(lineText(ownLines(app)[1]).includes("now different"));
  assert.equal(focused(app), app.$('[data-spelledit="1"]'), "focus isn't on Edit");
  assert.equal(app.$$('#main [data-cell^="grimoire|"]').length, 0);
  assert.deepEqual(app.errors, []);
});

test("Decision 286: Add your own opens a nameless spell with focus in its name, and only Done folds it", () => {
  const { ch, cols } = ownSpells();
  const app = openSheet(ch, "character");
  app.click('[data-spellown="1"]');
  const lines = ownLines(app);
  assert.equal(lines.length, 4);
  assert.ok(lines[3].classList.contains("open"), "the new spell isn't open");
  const name = app.$(`[data-cell="grimoire|3|${cols[0]}"]`);
  assert.equal(focused(app), name, "focus isn't in the name field");
  assert.equal(app.$('[data-spelldone="3"]').hidden, true, "Done shows on a nameless spell");
  name.value = "Newly Named"; name.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  assert.equal(app.$('[data-spelldone="3"]').hidden, false, "Done stayed hidden once it was named");
  assert.ok(ownLines(app)[3].classList.contains("open"), "naming it folded it");
  assert.deepEqual(app.errors, []);
});

test("Decision 286: an undo and the next character fold every named own spell, and a nameless one stays open", () => {
  const { ch } = ownSpells();
  const app = openSheet(ch, "character");
  app.click('[data-spelledit="1"]'); app.click('[data-spelledit="2"]');
  assert.equal(openCount(app), 2);
  app.click('[data-spelllink="0"]');                        // a logged change that keeps the row count, so an undo puts back copies
  assert.equal(openCount(app), 2, "linking folded the others");
  app.click("[data-toastundo]");
  assert.equal(openCount(app), 0, "an undo left a named spell open");
  app.click('[data-spelledit="2"]');
  assert.equal(openCount(app), 1);
  // The same character opened again in the same page (a fresh boot would pass whatever openEntry kept),
  // with a nameless spell added, which reads open.
  const again = activeChar(app); again.panelData.grimoire.push({ custom: true });
  app.window.openEntry({ ch: again, section: "character" });
  assert.deepEqual(ownLines(app).map(x => x.classList.contains("open")), [false, false, false, true], "named spells aren't lines, or the nameless one isn't open");
  assert.deepEqual(app.errors, []);
});

test("Decision 286: an own spell with only a name reads as its name", () => {
  const { ch, cols } = ownSpells();
  ch.panelData.grimoire = [{ custom: true, [cols[0]]: "Bare" }];
  const app = openSheet(ch, "character");
  const t = lineText(ownLines(app)[0]);
  assert.ok(t.startsWith("Bare"), t);
  assert.doesNotMatch(t.replace(/^Bare/, ""), /·|TN|TH|undefined|Overflow/);
  ch.panelData.grimoire = [{ custom: true, [cols[0]]: "Half", [cols[2]]: "6" }];
  const half = lineText(ownLines(openSheet(ch, "character"))[0]);
  assert.match(half, /^Half TN 6/);
  assert.doesNotMatch(half, /TH|·/);
});

// grimoireHtml reads the panel's columns by position (name, discipline, TN, TH, effect, overflow, notes),
// so a column added, dropped or moved in the data must come back here and to grimoireHtml first.
test("Decision 286: the Grimoire's own-spell line reads the panel's columns in this order", () => {
  assert.deepEqual([...grimPanel(lockedCharacter()).columns], ["Spell Name", "Discipline", "TN", "TH", "Effect", "Overflow", "Notes"],
    "the grimoire panel's columns moved: grimoireHtml's line reads them by position");
});

test("E5: TOL and WILL show no modifier, and the derivation is a tap on the ? by the name", () => {
  const app = openSheet(lockedCharacter(), "main");
  for (const id of ["TOL", "WILL"]) {
    const cell = app.$(`[data-derivdesc="${id}"]`).closest(".statcell");
    const q = cell.querySelector("[data-derivdesc]");
    assert.ok(cell.querySelector(".sid").contains(q), `${id}'s ? isn't by its name`);
    assert.equal(q.getAttribute("aria-label"), `How ${id} is derived`);
    const kids = [...cell.children], after = kids.slice(kids.indexOf(cell.querySelector(".sv")) + 1).map(e => e.className);
    assert.deepEqual(after, ["dvbd"], `${id}: something sits under the value besides the breakdown row`);
    const was = cell.querySelector("[data-derivrow]").hidden;
    app.click(`[data-derivdesc="${id}"]`);
    assert.equal(app.$(`[data-derivrow="${id}"]`).hidden, !was, `${id}'s ? didn't toggle its row`);
  }
});

// ── E8: the game's words, inside the sheet's own sentences (W133) ─────

const e8Triggers = el => [...el.querySelectorAll('[data-tip="term"]')].map(t => t.textContent);

test("E8 4: Night Vision's Dim and Dark open their rules, on Skills and Main", () => {
  const nv = D.advantages.find(a => (a.grants || []).some(g => g.type === "visibility" && Array.isArray(g.ignore)));
  assert.ok(nv, "no Advantage ignores a light level");
  const ch = p19Char(c => { p19Hold(c, "advantages", nv.id); c.weapons.push({ id: "vs4-ironside", notes: "", mods: [], roundsSpent: 0 }); });
  assert.ok(ch.advantages.some(a => a.id === nv.id), "Night Vision isn't held");
  const app = openSheet(ch, "skills");
  const fx = p19Row(app, "awareness").querySelector('.skill-fx [data-fx="mark"]');
  assert.deepEqual(e8Triggers(fx), ["Dim", "Dark"]);
  assert.equal(fx.textContent.replace(/\s+/g, " ").trim(), "No Dim or Dark penalty on visual checks · Night Vision");
  const row = p19Row(app, "awareness"), descRow = app.$('[data-descrow="awareness"]');
  const was = [row.querySelector("[data-skilldesc]").getAttribute("aria-expanded"), descRow && descRow.hidden];
  const dark = [...fx.querySelectorAll('[data-tip="term"]')].find(t => t.textContent === "Dark");
  clickIn(app, dark);
  const shown = tipShown(app);
  assert.match(shown, /^Dark/);
  assert.ok(shown.includes("−" + Math.abs(D.visibility.find(v => v.id === "dark").attack)), "the tip's number isn't written with U+2212: " + shown);
  assert.doesNotMatch(shown, /-\d/);
  assert.deepEqual([row.querySelector("[data-skilldesc]").getAttribute("aria-expanded"), descRow && descRow.hidden].map(String), was.map(String), "pressing a term changed the row");
  const main = openSheet(ch, "main");
  assert.deepEqual(e8Triggers(main.$(".main-combat [data-attacknote]")), ["Dim", "Dark"]);
  assert.deepEqual([...app.errors, ...main.errors], []);
});

test("E8 4b: a check note's light levels are triggers, read from the engine's note", () => {
  const noct = D.aberrations.find(a => (a.grants || []).some(g => g.type === "visibility" && (g.on || []).includes("checks")));
  assert.ok(noct, "no aberration modifies checks by light");
  const ch = p19Char(c => { c.trackers.aberrations.push({ id: noct.id, permanence: "permanent" }); });
  assert.ok(ch.trackers.aberrations.some(a => a.id === noct.id), "the aberration isn't held");
  const want = Engine.checkNotes(ch);
  assert.equal(want.length, 1, "the fixture has no check note");
  const app = openSheet(ch, "skills");
  const note = app.$("[data-checknote]");
  const ids = JSON.parse(JSON.stringify(Engine.termSpans(want[0].text))).map(s => s.id);
  assert.ok(ids.length >= 2, "the note names no light level: " + want[0].text);
  assert.deepEqual([...note.querySelectorAll('[data-tip="term"]')].map(t => t.dataset.term), ids);
  assert.equal(note.textContent.replace(/\s+/g, " ").trim(), `${want[0].text} · ${want[0].from}`);
  assert.deepEqual(app.errors, []);
});

// ── E7: a trait part reads its sign ──

test("E7 4: a trait part reads its sign", () => {
  const ch = lockedCharacter();
  ch.advantages = [{ id: "ghost-step", rank: 1, notes: "" }];
  ch.disadvantages = [{ id: "dwarf", rank: 1, notes: "" }];
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "skills" } } });
  // The data has no negative trait part (gear's grants are refused below 1), so Dwarf's grant is made one, unconditional, in the page's own copy of the data, before the sheet draws.
  app.window.eval(`{ const g = SHADOWS_DATA.disadvantages.find(d => d.id === "dwarf").grants.find(x => x.type === "checkMod"); g.amount = -3; delete g.whenText; }`);
  const parts = JSON.parse(app.window.eval(`JSON.stringify(Engine.skillLine(JSON.parse(${JSON.stringify(JSON.stringify(ch))}), "stealth").breakdown.traitParts)`));
  assert.ok(parts.some(p => p.amount === -3) && parts.some(p => p.amount === 3), `traitParts is ${JSON.stringify(parts)}`);
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent)).dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click('[data-sec="skills"]');
  const row = app.$('#main [data-skillname="stealth"]').closest("tr");
  const all = [...row.querySelectorAll(".trait-part")];
  const neg = all.filter(e => /^[−-]3/.test(e.textContent.trim()));
  const pos = all.filter(e => /^\+3/.test(e.textContent.trim()));
  assert.equal(neg.length, 1, `the negative part didn't draw: ${all.map(e => e.textContent)}`);
  assert.equal(pos.length, 1, "the positive part didn't draw");
  assert.ok(neg[0].classList.contains("neg") && !neg[0].classList.contains("pos"), "the negative part has no .neg");
  assert.ok(pos[0].classList.contains("pos") && !pos[0].classList.contains("neg"), "the positive part has no .pos");
  assert.deepEqual(app.errors, []);
});

// ── E7 (Ken: "Plain in this PR"): a Major's power pick and "Gained a specialization" are plain until picked, then go ──

test("E7 6i: a Major's power rows are plain until picked, then go, and the foot keeps primary", () => {
  const app = openSheet(strigoi(), "progression");
  app.click('[data-takemajor="splice"]');
  const rows = () => [...app.$$("#modal [data-mmpick]")].filter(b => !b.disabled);
  const before = rows();
  assert.ok(before.length >= 2, `${before.length} pickable powers, two wanted`);
  for (const b of before) assert.ok(b.classList.contains("sm") && !b.classList.contains("primary") && !b.classList.contains("go"), `${b.dataset.mmpick} is ${b.className}`);
  const id = before[0].dataset.mmpick;
  app.click(`#modal [data-mmpick="${id}"]`);
  assert.ok(app.$(`#modal [data-mmpick="${id}"]`).classList.contains("go"), "a picked power isn't go");
  for (const b of rows().filter(b => b.dataset.mmpick !== id)) assert.ok(!b.classList.contains("primary") && !b.classList.contains("go"), `${b.dataset.mmpick} is ${b.className}`);
  assert.ok(app.$("#modal [data-mmtake]").classList.contains("primary"), "the foot's Take lost primary");
  assert.deepEqual(app.errors, []);
});

test("E7 6j: Gained a specialization's rows are plain until picked, then go, and Open keeps primary", () => {
  const ch = strigoi();
  ch.progression.ip.earned = 100;
  const app = openSheet(ch, "character");
  app.click("[data-gainspec]");
  const rows = () => [...app.$$("#modal [data-gspick]")];
  const before = rows();
  assert.ok(before.length >= 2, `${before.length} rows, two wanted`);
  for (const b of before) assert.ok(b.classList.contains("sm") && !b.classList.contains("primary") && !b.classList.contains("go"), `${b.dataset.gspick} is ${b.className}`);
  app.click('#modal [data-gspick="upyr"]');
  assert.ok(app.$('#modal [data-gspick="upyr"]').classList.contains("go"), "a picked row isn't go");
  assert.ok(!app.$('#modal [data-gspick="draugur"]').classList.contains("primary") && !app.$('#modal [data-gspick="draugur"]').classList.contains("go"));
  assert.ok(app.$("#modal [data-gsopen]").classList.contains("primary"), "the foot's Open lost primary");
  assert.deepEqual(app.errors, []);
});
