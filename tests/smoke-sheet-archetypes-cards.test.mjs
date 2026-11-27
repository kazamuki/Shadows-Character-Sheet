/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: how the Character tab lays out archetype cards: tags, sections, what you can do and what you carry, the phone, natural attacks, power marks on weapons, and a clamped spend. Its other half is smoke-sheet-archetypes-kinds.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { characterFixtures } from "./character-fixtures.mjs";
import { Engine, D, lockedCharacter, onStep, openSheet, activeChar, draft, named, card, writtenInCharacter, lockedVampire, wolf } from "./smokekit.mjs";

// ── P18: the tags show on a folded Character card (Decision 231) ─────

test("P18 6: a folded Character card shows its tags, held for its rank and picks", () => {
  const ch = lockedCharacter();
  ch.advantages = [{ id: "hard-to-kill", rank: 2 }, { id: "bullseye", rank: 2 }, { id: "common-sense", rank: 1, selections: { skill: ["investigation"] } }];
  ch.disadvantages = [{ id: "blood-lust", rank: 1 }];
  const app = openSheet(ch, "character");
  assert.deepEqual(app.errors, []);
  const card = name => app.$$("#main details.pick.trait").find(d => d.querySelector(".th").textContent.startsWith(name));
  const bl = card("Blood Lust");
  assert.ok(!bl.open, "the card should be folded");
  const rule = D.disadvantages.find(d => d.id === "blood-lust").grants.find(g => g.type === "rule").ruleText;
  assert.equal(bl.querySelector("summary .effects .etag.rule").textContent, rule, "the tags aren't in the summary");
  assert.equal(card("Hard to Kill").querySelector("summary .effects .etag.computed").textContent, "+2 max HP on every Health Level");   // Decision 232: a held ×2 states its total
  assert.equal(card("Bullseye").querySelector("summary .effects .etag.rule").textContent, "Called Shots: +6 damage.");
  assert.equal(card("Common Sense").querySelector("summary .effects .etag.computed").textContent, "Take 6 on Investigation; choose before you roll");   // P19: a computed Take X now
});

// ── P16: each section its own row, a lone card spanning two columns (Decision 246) ──
// jsdom has no layout, so these pin the markup the grid relies on; where a heading
// and a card actually land is measured in Chromium by tools/phone-check.mjs.

const archParts = app => app.$$("#main .arch-flow > .arch-part");

const partCards = p => [...p.children].filter(c => c.matches(".pick, table.ref"));

test("P16 1: a section with exactly one card marks it solo, and only then", () => {
  const part = (app, label) => { const p = archParts(app).find(x => x.querySelector(".sect").textContent.startsWith(label)); assert.ok(p, `no ${label} part`); return p; };
  for (const f of characterFixtures()) {
    const app = openSheet(f.ch, "character");
    for (const p of archParts(app)) {
      const cards = partCards(p), name = `${f.name}: ${p.querySelector(".sect").textContent}`;
      // Decision 282: the Grimoire, Disciplines and a write-in's Powers are whole-row bodies (`arch-wide`), and Focused Skills is lines of text.
      if (!cards.length) { assert.ok(p.querySelector(":scope > .arch-wide") || /^Focused Skills/.test(p.querySelector(".sect").textContent), `${name} has no card`); continue; }
      assert.deepEqual(cards.map(c => c.classList.contains("solo")), cards.map(() => cards.length === 1 && cards[0].matches(".pick")), name);
    }
  }
  assert.ok(part(openSheet(characterFixtures().find(f => f.name === "vampire/draugur").ch, "character"), "Bloodline").querySelector(".pick.solo"));
  assert.ok(part(openSheet(characterFixtures().find(f => f.name === "werewolf/trueborn").ch, "character"), "Origin").querySelector(".pick.solo"));
  assert.equal(archParts(openSheet(characterFixtures().find(f => f.name === "arcanist/2 aberrations").ch, "character")).flatMap(partCards).filter(c => c.classList.contains("solo")).length, 0, "two Aberrations: neither is solo");
  assert.ok(part(openSheet(characterFixtures().find(f => f.name === "arcanist/1 aberration").ch, "character"), "Aberration").querySelector(".pick.solo"));
  assert.ok(part(openSheet(characterFixtures().find(f => f.name === "custom/one trait").ch, "character"), "Baseline Traits").querySelector(".pick.solo"));
  // A note beside the card: the Powers part with its allowance note and a lone power. The renderer counts
  // cards, so the note doesn't unmark it (:only-child and :last-child would).
  const app = openSheet(characterFixtures().find(f => f.name === "werewolf/trueborn").ch, "character");
  app.window.eval("{const o = Engine.archetypeContent; Engine.archetypeContent = function (c) { const r = o(c); r.powers = r.powers.slice(0, 1); return r; }}");
  app.window.eval("update()");
  const powers = part(app, "Powers");
  assert.ok(powers.querySelectorAll(":scope > .step-note").length >= 1, "the Powers part has no note to test beside");
  assert.equal(partCards(powers).length, 1);
  assert.ok(powers.querySelector(".pick.solo"), "a note beside a lone power unmarked it");
  assert.ok(powers.querySelector(".pick.solo").parentElement.lastElementChild !== powers.querySelector(".pick.solo"), "the note isn't after the card, so this proves nothing about :last-child");
});

test("P16 2: every part opens with its heading, and its notes sit outside the cards", () => {
  for (const f of characterFixtures()) {
    const app = openSheet(f.ch, "character");
    assert.deepEqual(app.errors, [], f.name);
    const parts = archParts(app);
    assert.ok(parts.length, `${f.name} has no parts`);
    for (const p of parts) {
      assert.ok(p.firstElementChild.matches(".sect"), `${f.name}: ${p.textContent.slice(0, 20)} doesn't open with its heading`);
      // A part-level note is a direct child of the part; the only notes inside a card are a power's "Opened: …" lines.
      for (const n of p.querySelectorAll(".step-note")) {
        const card = n.closest(".pick");
        assert.ok(card ? card.matches("[data-powercard]") && /^Opened: | bars it.$/.test(n.textContent) : n.parentElement === p || n.closest(".arch-wide"), `${f.name}: a part note sits inside a card, or a card note inside a plain one`);
      }
    }
  }
});

test("Decision 264: the CP step lists the powers you could learn, learning one moves it up, and a Draugur's power with no ranks reads rank 1 on the sheet", () => {
  const cp = onStep("vampire", "heroic", "character-points", ch => {   // 10 CP, Max Starting Rank 2
    ch.archetypeChoices.specialization = ["strigoi"];
    ch.archetypeChoices.basePowers = { "shadow-play": 1 };
  });
  const bone = '[data-step="apow|bone-spines|1"]';
  assert.match(cp.$("#main").textContent, /Powers you don't have yet/);
  assert.match(cp.$("#main").textContent, /Strigoi powers/);
  const before = Engine.cp(Engine.migrate(JSON.parse(JSON.stringify(draft(cp))))).left;
  assert.match(cp.$(bone).closest(".pick").textContent, /rank 0/);
  assert.match(cp.$(bone).getAttribute("aria-label"), /^Learn Bone Spines \(Unmasked\) with CP$/, "a power to learn reads as one to raise (W59)");
  cp.$(bone).focus(); cp.click(bone);
  assert.deepEqual({ ...draft(cp).archetypeChoices.powerCp }, { "bone-spines": 1 });
  assert.equal(Engine.cp(Engine.migrate(JSON.parse(JSON.stringify(draft(cp))))).left, before - 5);
  const row = cp.$(bone).closest(".pick");
  assert.match(row.textContent, /learned with CP · rank 1/);
  assert.match(cp.$(bone).getAttribute("aria-label"), /^Raise Bone Spines \(Unmasked\) with CP$/);
  assert.equal(cp.window.document.activeElement, cp.$(bone), "focus left the stepper that was pressed");
  const learnList = [...cp.$$(".sub-sect")].find(h => /Powers you don't have yet/.test(h.textContent));
  assert.ok(learnList.compareDocumentPosition(row) & 2 /* the row precedes the learn list */, "a learned power is still under the learn list");
  cp.click('[data-step="apow|bone-spines|-1"]');
  assert.deepEqual({ ...draft(cp).archetypeChoices.powerCp }, {});
  assert.deepEqual(cp.errors, []);

  // The Draugur's Deathless Resilience has no ranks: 5 CP holds it, and the Character tab reads it at rank 1.
  const ch = lockedVampire("draugur");
  ch.archetypeChoices.basePowers = {}; ch.archetypeChoices.powerCp = { "deathless-resilience": 1 };
  const app = openSheet(ch, "character");
  const card = [...app.$$("#main .pick")].find(p => /Deathless Resilience/.test(p.querySelector("h2") ? p.querySelector("h2").textContent : ""));
  assert.ok(card, "the CP-learned power isn't on the Character tab");
  assert.match(card.textContent, /rank 1/);
  assert.deepEqual(app.errors, []);
});

// ── E2a: what you can do is on Character, what you carry on Loadout (Decision 282) ──

const e2aHeads = (app, tab) => { app.click(`[data-sec="${tab}"]`); return app.$$("#main .sect").map(s => s.textContent.trim().replace(/\s*none chosen$/, "")); };

const e2aCases = () => {
  const fx = characterFixtures(), pick = n => fx.find(f => f.name === n).ch;
  const cyborg = lockedCharacter(); cyborg.identity.archetype = "cyborg";
  const wheel = lockedCharacter(); wheel.identity.archetype = "professional"; wheel.archetypeChoices.specialization = ["wheelman"];
  const ww = lockedCharacter(); ww.identity.archetype = "werewolf"; ww.creation.powerLevel = "heroic"; ww.archetypeChoices.specialization = ["trueborn"];
  const wi = writtenInCharacter();
  return [["werewolf", ww, ["Powers"], []], ["professional", wheel, ["Focused Skills", "Tweak"], []],
          ["arcanist", lockedCharacter(), ["Disciplines", "Grimoire"], []], ["draugur", lockedVampire("draugur"), [], []],
          ["cyborg", cyborg, [], ["Installed Cybernetics"]], ["write-in", wi, ["Powers"], []]];
};

test("Decision 282: what an archetype lets you do is on Character, and Loadout holds what you carry", () => {
  for (const [name, ch, onCharacter, onLoadout] of e2aCases()) {
    const app = openSheet(ch, "character");
    const chr = e2aHeads(app, "character");
    for (const h of onCharacter) assert.ok(chr.includes(h), `${name}: Character lacks ${h}: ${chr.join(" | ")}`);
    const lo = e2aHeads(app, "loadout");
    for (const h of ["Disciplines", "Grimoire", "Focused Skills", "Tweak", "Powers"]) assert.ok(!lo.includes(h), `${name}: Loadout still has ${h}`);
    assert.deepEqual(lo.filter(h => !onLoadout.includes(h)).map(h => h.replace(/ —.*/, "")), ["Weapons", "Armor", "Gear"], `${name}: Loadout's headings`);
    for (const h of onLoadout) assert.ok(lo.includes(h), `${name}: Loadout lacks ${h}`);
    assert.equal(app.$("#main [data-ptoggle]"), null, `${name}: Loadout draws a toggle`);
    assert.deepEqual(app.errors, []);
  }
});

test("Decision 282: Character shows each thing once", () => {
  const arc = openSheet(lockedCharacter(), "character");
  const heads = arc.$$("#main .sect").map(s => s.textContent.trim());
  assert.equal(heads.filter(h => h === "Disciplines").length, 1, "Disciplines twice");
  const first = Engine.disciplineRanks(lockedCharacter())[0];
  assert.ok(first.description && arc.$("#main").textContent.includes(first.description), "a Discipline's description isn't on Character");

  const wheel = lockedCharacter(); wheel.identity.archetype = "professional"; wheel.archetypeChoices.specialization = ["wheelman"];
  const pro = openSheet(wheel, "character");
  const tweak = Engine.specializationChosen(wheel)[0].tweak;
  assert.ok(tweak && tweak.description, "the fixture's Wheelman has no tweak");
  const text = pro.$("#main").textContent;
  assert.equal(text.split(tweak.description).length - 1, 1, "the tweak's text shows more than once");
  assert.ok(!/Tweak —/.test(pro.$("#main .arch-flow").textContent), "the Subtype card still carries a Tweak line");

  const wi = openSheet(writtenInCharacter(), "character");
  const cards = wi.$$("#main .pick").filter(c => c.querySelector("h2") && c.querySelector("h2").textContent.trim().startsWith("Fade"));
  assert.equal(cards.length, 1, "a write-in's power is drawn more than once");
  assert.ok(cards[0].querySelector("[data-pwimprove]"), "the one card has no Improve");
  assert.deepEqual([arc.errors, pro.errors, wi.errors], [[], [], []]);
});

// ── E6: the phone. A reference's column tables scroll inside their own frame. ──

test("E6 3: a reference panel's column tables sit in a frame, and its prose tables don't", () => {
  const ch = lockedCharacter();
  const arch = D.archetypes.find(a => a.id === ch.identity.archetype);
  const panel = arch.coreMechanic.panels.find(p => p.type === "reference");
  assert.ok(panel, "the Arcanist has no reference panel in its data");
  const app = openSheet(ch, "character");
  const ref = app.$(`[data-reference="${panel.id}"]`);
  assert.ok(ref, "the Magic reference didn't draw");
  const all = [...ref.querySelectorAll("table.ref")];
  const cols = all.filter(t => t.querySelector("thead")), prose = all.filter(t => !t.querySelector("thead"));
  assert.ok(cols.length >= 3 && prose.length >= 3, `fixture: ${cols.length} column tables, ${prose.length} prose tables`);
  for (const t of cols) {
    const f = t.parentElement;
    assert.ok(f.matches('.ref-frame[role="region"][tabindex="0"][aria-label]'), "a column table isn't framed");
    assert.ok(f.getAttribute("aria-label").trim(), "its frame has an empty label");
  }
  for (const t of prose) assert.ok(!t.parentElement.classList.contains("ref-frame"), "a prose table is framed");
  assert.deepEqual(app.errors, []);
});

// ── L4: natural attacks (Decision 290) ──────────────────────────────────

const natVampire = () => {
  const ch = lockedCharacter();
  ch.identity.archetype = "vampire"; ch.creation.powerLevel = "wcd"; ch.archetypeChoices.specialization = ["draugur"];
  ch.weapons.push({ id: "combat-knife", notes: "", mods: [], roundsSpent: 0 });
  return ch;
};

const firstText = r => r.cells[0].firstChild.textContent.trim();

test("Main: the natural group leads the Weapons table, under one heading", () => {
  const app = openSheet(natVampire(), "main");
  const rows = [...app.$$(".main-combat table.ref.wpn tbody tr")];
  const names = rows.map(r => r.classList.contains("nat-head") ? "[heading]" : firstText(r));
  assert.deepEqual(names, ["[heading]", "Bite", "Claws", "Fists", "Combat Knife"], "the natural group isn't first, under one heading");
  assert.equal(app.$$(".nat-head").length, 1);
  assert.match(rows[0].textContent, /Natural attacks: 2 a round/);
  assert.match(rows[0].textContent, /Two different natural weapons/);
  assert.doesNotMatch(app.$(".main-combat").textContent, /×\s?2/, "a ×2 is on a line");
  assert.match(rows[3].textContent, /Martial Arts/);
  assert.ok(app.$$(".main-combat .sect").some(s => s.textContent === "Combat skills"));
  assert.deepEqual(app.errors, []);
});

test("Main: a bare Arcanist sees Fists; a True Warrior's say AP with Death Touch; Melee Master names itself", () => {
  let app = openSheet(lockedCharacter(), "main");
  assert.deepEqual([...app.$$("tr.nat-row")].map(firstText), ["Fists"]);
  assert.doesNotMatch(app.$(".main-combat").textContent, /with Death Touch/);
  const tw = lockedCharacter(); tw.identity.archetype = "professional"; tw.archetypeChoices.specialization = ["true-warrior"];
  tw.advantages = [{ id: "melee-master", rank: 1, notes: "" }];
  app = openSheet(tw, "main");
  assert.match(app.$("tr.nat-row").textContent, /AP while Death Touch is active/);
  assert.equal([...app.$$("tr.nat-row .tags .tag")].some(t => t.textContent === "AP"), false, "AP shown as a tag it always has");
  assert.match(app.$(".nat-head").textContent, /Natural attacks: 3 a round \(Melee Master \+1\)/);
  assert.deepEqual(app.errors, []);
});

test("Print: a Werewolf in form prints its claws and fangs", () => {
  const ww = lockedCharacter(); ww.identity.archetype = "werewolf"; ww.archetypeChoices.specialization = ["trueborn"];
  const app = openSheet(ww, "main");
  const loadout = ch => { const box = app.doc.createElement("div"); box.innerHTML = app.window.renderPrintView(ch); return [...box.querySelectorAll(".p-page")][2]; };
  const names = pg => [...pg.querySelectorAll("table.p-table")[0].querySelectorAll("tbody tr")].map(r => r.cells[0].textContent.trim());
  assert.match(names(loadout(ww))[0], /^Natural attacks: 2 a round/);
  assert.equal(names(loadout(ww))[1], "Fists", "Human form prints Fists alone");
  const shifted = activeChar(app);
  assert.ok(Engine.setToggle(shifted, "form", "Werewolf").ok);
  const pg = loadout(shifted), n = names(pg);
  assert.match(n[0], /^Natural attacks: 2 a round/);
  assert.deepEqual(n.slice(1, 4), ["Claws", "Fangs", "Fists"]);
  assert.match(pg.textContent, /Two different natural weapons/);
  assert.doesNotMatch(pg.textContent, /×\s?2/);
  assert.equal(pg.querySelectorAll("tr.p-cat").length >= 1, true);
  assert.deepEqual(app.errors, []);
});

test("Main and print: a natural row shows a worn ACC bonus, and print's Death Touch says when, as Main's does", () => {
  const ch = lockedCharacter(); ch.identity.archetype = "professional"; ch.archetypeChoices.specialization = ["true-warrior"];
  assert.equal(Engine.addLoadout(ch, "armor", "smartlink-gloves").ok, true);
  const app = openSheet(ch, "main");
  // No catalog item has a class ACC bonus yet (Decision 248), so the app's own data is given one.
  app.window.SHADOWS_DATA.armor.find(a => a.id === "smartlink-gloves").grants = [{ type: "weaponBonus", to: "acc", amount: 2, class: "melee" }];
  app.click('[data-sec="skills"]'); app.click('[data-sec="main"]');
  const fists = app.$("tr.nat-row");
  assert.match(fists.cells[1].textContent, /\+2 from SMARTLink Gloves/, "the natural row dropped its ACC bonus");
  assert.match(fists.cells[0].textContent, /AP while Death Touch is active/);
  const box = app.doc.createElement("div"); box.innerHTML = app.window.renderPrintView(activeChar(app));
  const pg = [...box.querySelectorAll(".p-page")][2];
  assert.match(pg.textContent, /AP while Death Touch is active/, "print's mark doesn't say when, as Main's does");
  assert.deepEqual(app.errors, []);
});

test("Print: a Draugur's Ancient Weapon follows the natural group, off when the Code is broken, as on Main", () => {
  const ch = natVampire(); ch.archetypeChoices.optionPicks = { "ancient-weapon": "blunt" };
  const app = openSheet(ch, "main");
  const rowsOf = c => { const box = app.doc.createElement("div"); box.innerHTML = app.window.renderPrintView(c); return [...[...box.querySelectorAll(".p-page")][2].querySelectorAll("table.p-table")[0].querySelectorAll("tbody tr")].map(r => r.cells[0].textContent.trim()); };
  const kept = rowsOf(activeChar(app));
  assert.deepEqual([kept.slice(1, 5), kept[5]].flat().map(n => n.replace(/^Natural.*/, "[heading]")), ["Bite", "Claws", "Fists", "Blunt", "Combat Knife"]);
  const broken = activeChar(app); assert.ok(Engine.setToggle(broken, "code", "Broken").ok);
  const box = app.doc.createElement("div"); box.innerHTML = app.window.renderPrintView(broken);
  const blunt = [...box.querySelectorAll("tr.p-tight")].find(r => /^Blunt/.test(r.cells[0].textContent.trim()));
  assert.ok(blunt, "the Ancient Weapon isn't printed");
  assert.match(blunt.textContent, /doesn't answer/, "a broken Code isn't said");
});

test("Main: under 640px the natural group's rules sit behind its heading, a tap away; wider, they show", () => {
  const app = openSheet(natVampire(), "main", { width: 375 });
  const btn = app.$("[data-natmore]"), rules = app.$("#nat-rules");
  assert.ok(btn && rules, "no fold on the heading");
  assert.equal(btn.getAttribute("aria-expanded"), "false");
  assert.equal(rules.classList.contains("open"), false);
  assert.match(rules.textContent, /Roll each one on its own/);
  app.click("[data-natmore]");
  assert.equal(app.$("[data-natmore]").getAttribute("aria-expanded"), "true");
  assert.equal(app.$("#nat-rules").classList.contains("open"), true);
  app.click("[data-natmore]");
  assert.equal(app.$("#nat-rules").classList.contains("open"), false);
  assert.deepEqual(app.errors, []);
});

test("Main: with no moreText in the data, the natural group's rules aren't folded away behind a button nobody wrote", () => {
  const app = openSheet(lockedCharacter(), "main");
  delete app.window.SHADOWS_DATA.weaponRules.naturalAttacks.moreText;
  app.click('[data-sec="skills"]'); app.click('[data-sec="main"]');
  assert.equal(app.$("[data-natmore]"), null, "a fold button with no label in data");
  assert.equal(app.$(".nat-rules"), null, "the rules are folded with no way to open them");
  assert.match(app.$(".nat-head").textContent, /Two different natural weapons/);
  assert.deepEqual(app.errors, []);
});

// ── L5b: a power's mark on the weapons it changes (Decision 292) ──

const l5Strigoi = () => {
  const ch = natVampire(); ch.archetypeChoices.specialization = ["strigoi"];
  ch.archetypeChoices.basePowers = { "bone-spines": 1, "monstrous-maw": 1 };
  ch.archetypeChoices.optionPicks = {};
  return ch;
};

const printWeaponRows = (app, ch) => {
  const box = app.doc.createElement("div"); box.innerHTML = app.window.renderPrintView(ch);
  return [...[...box.querySelectorAll(".p-page")][2].querySelectorAll("table.p-table")[0].querySelectorAll("tbody tr")];
};

test("Main, Loadout and print show a power's mark on the same lines", () => {
  const ch = l5Strigoi();
  const app = openSheet(ch, "main");
  const mark = /\+3 damage, \+5 while grappling with your Bone Spines out/;
  const rows = [...app.doc.querySelectorAll(".wpn tbody tr")];
  const byName = n => rows.find(r => r.cells[0].textContent.trim().startsWith(n));
  for (const n of ["Bite", "Claws", "Fists", "Combat Knife"]) assert.match(byName(n).cells[0].textContent, mark, `Main's ${n}`);
  assert.match(byName("Bite").cells[0].textContent, /Monstrous Maw/);
  assert.doesNotMatch(byName("Claws").cells[0].textContent, /Monstrous Maw/);
  const pr = printWeaponRows(app, activeChar(app));
  for (const n of ["Bite", "Claws", "Fists", "Combat Knife"]) assert.match(pr.find(r => r.cells[0].textContent.trim().startsWith(n)).textContent, mark, `print's ${n}`);
  app.click('[data-sec="loadout"]');
  const knife = [...app.doc.querySelectorAll("tr[data-weaponrow]")].find(r => /Combat Knife/.test(r.cells[0].textContent));
  assert.match(knife.cells[0].textContent, mark, "Loadout's knife");
  assert.deepEqual(app.errors, []);
});

test("Main's carried row lists a running power's bonus under its damage, as Loadout's does", () => {
  const ch = natVampire(); ch.archetypeChoices.basePowers = { "blood-of-valhalla": 1 };
  const app = openSheet(ch, "main");
  const knife = () => [...app.doc.querySelectorAll(".wpn tbody tr")].find(r => /Combat Knife/.test(r.cells[0].textContent));
  assert.match(knife().cells[0].textContent, /while Blood of Valhalla runs/);
  assert.doesNotMatch(knife().cells[2].textContent, /from Blood of Valhalla/);
  const ch2 = natVampire(); ch2.archetypeChoices.basePowers = { "blood-of-valhalla": 1 }; ch2.trackers.running = [{ id: "blood-of-valhalla" }];
  const run = openSheet(ch2, "main");
  const rk = () => [...run.doc.querySelectorAll(".wpn tbody tr")].find(r => /Combat Knife/.test(r.cells[0].textContent));
  assert.match(rk().cells[2].textContent, /\+2 from Blood of Valhalla/, "Main's carried row dropped the bonus");
  assert.doesNotMatch(rk().cells[0].textContent, /while Blood of Valhalla runs/, "the mark stayed on a running power");
  run.click('[data-sec="loadout"]');
  const lo = [...run.doc.querySelectorAll("tr[data-weaponrow]")].find(r => /Combat Knife/.test(r.cells[0].textContent));
  assert.match(lo.cells[2].textContent, /\+2 from Blood of Valhalla/, "Loadout's row dropped the bonus");
  assert.deepEqual(run.errors, []);
});

test("Bone Spines' flag note shows on the Character card and the wizard's pick, and print tells one power's mark from the next", () => {
  const note = /How the \+5 while grappling stacks with the \+3 isn't written yet/;
  const ch = l5Strigoi();
  const app = openSheet(ch, "character");
  assert.match(app.$("#main").textContent, note, "the Character tab's Bone Spines card says nothing of the flag");
  const pr = printWeaponRows(app, activeChar(app));
  const claws = pr.find(r => r.cells[0].textContent.trim().startsWith("Bite"));
  assert.match(claws.textContent, /\+3 damage, \+5 while grappling with your Bone Spines out; \+10 damage, AP 3/, "print joins a row's marks with commas");
  const wiz = onStep("vampire", "heroic", "archetype", c => { c.archetypeChoices.specialization = ["strigoi"]; });
  assert.match(wiz.$("#main").textContent, note, "the wizard's Base Power row says nothing of the flag");
  const cp = onStep("vampire", "heroic", "character-points", c => { c.archetypeChoices.specialization = ["strigoi"]; c.archetypeChoices.basePowers = { "bone-spines": 1 }; });
  assert.match(cp.$("#main").textContent, note, "the wizard's CP row says nothing of the flag");
});

test("K3: A day without rest's line names its button", () => {
  const app = openSheet(lockedVampire("upyr"), "main");
  const btn = app.$('[data-unrested="thirst"]'), label = btn.textContent.replace(/\s*\(.*$/, "").trim();
  const line = [...app.$$("#main .main-feed .step-note")].find(n => /Thirst and 2 more/.test(n.textContent));
  assert.ok(line, "no line under the Thirst buttons");
  assert.ok(line.textContent.startsWith(label), `the line doesn't begin with the button's label "${label}": ${line.textContent}`);
  assert.equal(btn.getAttribute("title"), line.textContent, "the button's title is the same sentence");
});

// ── J4 review: a spend that a max clamps logs what came off (Decision 315) ──

test("J4: a spend a max clamps logs what came off: Call of the Wild at 1 of 3, typed 5, + logs +2", () => {
  const ch = wolf("trueborn");
  ch.panelData.form = "Werewolf";
  ch.trackers.panel["call-of-the-wild"] = { value: 1 };
  const app = openSheet(ch, "trackers");
  const field = app.$('#main [data-trkamt="call-of-the-wild"]');
  field.value = "5";
  field.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  app.click('#main [data-trk="call-of-the-wild|1"]');
  assert.equal(activeChar(app).trackers.panel["call-of-the-wild"].value, 3, "the count didn't stop at its max");
  assert.equal(activeChar(app).audit.at(-1).label, "Call of the Wild +2", "the log named the typed 5, not the 2 that moved");
});

test("J4: a count that goes up is added to and taken off, not spent: Call of the Wild's − and + say so, and follow the amount", () => {
  const ch = wolf("trueborn");
  ch.panelData.form = "Werewolf";
  const app = openSheet(ch, "trackers");
  const name = d => app.$(`#main [data-trk="call-of-the-wild|${d}"]`).getAttribute("aria-label");
  assert.equal(name(1), "Add 1 to Call of the Wild", "a withdrawal step reads as a spend");
  assert.equal(name(-1), "Take 1 off Call of the Wild");
  const field = app.$('#main [data-trkamt="call-of-the-wild"]');
  field.value = "2";
  field.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  assert.equal(name(1), "Add 2 to Call of the Wild", "the repaint went back to the spend wording");
  assert.equal(name(-1), "Take 2 off Call of the Wild");
});
