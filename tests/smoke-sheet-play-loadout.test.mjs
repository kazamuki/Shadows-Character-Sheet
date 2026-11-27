/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: the sheet in play, the second half: worn armor and gear, written-in weapons, Majors on a row, sustained and answering and healing powers, the seven tabs, colour, the phone, SFR by hand, named pools and spending several at once. Its other half is smoke-sheet-play-hits.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, stored } from "./harness.mjs";
import { Engine, D, tipShown, lockedCharacter, openSheet, activeChar, clickIn, writtenInCharacter, focused, lockedVampire, type, setHit, press, tick, streetVampire, l2Character, l2Typed, rowOf, cellsOf } from "./smokekit.mjs";

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
  assert.match(audit()[audit().length - 1].label, /^Started using SMART Deck II$/);
  assert.equal(activeChar(app).gear[0].inUse, true);
  const now = gearRowOf(app, "SMART Deck II");
  assert.equal(app.window.document.activeElement, now.querySelector("input[data-inuse]"), "focus left the toggle");
  assert.match(now.querySelector("[data-inuseline]").textContent, /\+2 to Interface checks/);
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
  assert.match(app.$("#undotoast").textContent, /This has nothing to switch on/);
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
  assert.match(armorCardOf(app, "SMARTLink Gloves").textContent, /\+2 ACC with SMART Link weapons/);
  assert.doesNotMatch(armorCardOf(app, "SMARTLink Gloves").textContent, /When worn: \+2 ACC/);
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
  assert.match(armorCardOf(app, "SMARTLink Gloves").textContent, /When worn: \+2 ACC with SMART Link weapons/);
  assert.deepEqual(app.errors, []);
  // worn but scrapped (a hand-edited file): it adds nothing, so its line is dimmed, not shown as working
  assert.equal(armorCardOf(app, "SMARTLink Gloves").querySelector("[data-gives]").classList.contains("off"), true);
  const scrapped = JSON.parse(JSON.stringify(ch));
  scrapped.armor[0].scrapped = true;
  const app2 = openSheet(scrapped, "loadout");
  assert.equal(scrapped.armor[0].worn, true);
  assert.equal(armorCardOf(app2, "SMARTLink Gloves").querySelector("[data-gives]").classList.contains("off"), true, "a scrapped piece's line reads as working");
  assert.doesNotMatch(cellsOf(rowOf(app2, 0))[1], new RegExp(`\\+${base + 2} ACC`));
  assert.deepEqual(app2.errors, []);
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

test("L3 12 (sheet): a written-in weapon's open ACC field shows the stored pick, not the pick plus a worn class bonus", () => {
  const ch = l2Character(l2Typed);
  Engine.addLoadout(ch, "armor", "smartlink-gloves");
  const app = openSheet(ch, "loadout");
  const gloves = app.window.SHADOWS_DATA.armor.find(a => a.id === "smartlink-gloves");
  gloves.grants = [{ type: "weaponBonus", to: "acc", amount: 2, class: "ranged" }];
  app.click('[data-loedit="weapons|1"]');
  const input = rowOf(app, 1).querySelector('[data-weaponpick="1|acc"]');
  assert.ok(input, "the open row has no ACC field");
  assert.equal(input.value, "1", "the field shows the pick plus the bonus");
  assert.equal(activeChar(app).weapons[1].acc, 1);
  assert.deepEqual(app.errors, []);
});

// ── L2b: written-in weapons tick their fire modes and reload from carried ammo ──

const l2bChange = (app, el, props = {}) => { el.focus(); Object.assign(el, props); el.dispatchEvent(new app.window.Event("change", { bubbles: true })); };

const l2bOld = { custom: true, name: "Old iron", damage: "3", rof: "Semi", capacity: "6", ammo: "", features: "", notes: "", roundsSpent: 0 };

test("L2b 6 (sheet): the open row's fire-mode ticks are one undoable action each, and the fire buttons follow them", () => {
  const ch = l2Character({ category: "handguns", capacity: "15" });
  delete ch.weapons[1].rof;
  ch.weapons.push({ ...l2bOld });
  const app = openSheet(ch, "loadout");
  const audit = () => activeChar(app).audit;
  app.click('[data-loedit="weapons|1"]');
  app.click('[data-loedit="weapons|2"]');
  const zip = () => rowOf(app, 1), old = () => rowOf(app, 2);
  const ticks = row => [...row.querySelectorAll("[data-weaponmode]")];
  assert.deepEqual(ticks(zip()).map(t => t.closest("label").textContent.trim()), ["Single", "Burst", "Full Auto"]);
  assert.equal(zip().querySelector('[data-cell="weapons|1|rof"]'), null, "the typed RoF cell is still on the open row");
  assert.ok(zip().querySelector('[aria-label="Fire modes"]'));
  // The hint belongs to the row that wrote "Semi", and to no other.
  assert.match(old().querySelector("[data-weaponrofhint]").textContent, /You wrote "Semi"\. Tick its fire modes to give it fire buttons./);
  assert.equal(zip().querySelector("[data-weaponrofhint]"), null, "the hint showed on the Zip gun's row");
  // Ticking Single, then Burst: one audit entry each, the row stays open, focus stays on the tick.
  const before = audit().length;
  l2bChange(app, zip().querySelector('[data-weaponmode="1|S"]'), { checked: true });
  l2bChange(app, zip().querySelector('[data-weaponmode="1|B"]'), { checked: true });
  assert.equal(audit().length, before + 2);
  assert.match(audit().at(-1).label, /^Zip gun: fire modes → Single, Burst$/);
  assert.deepEqual(activeChar(app).weapons[1].rofModes, ["S", "B"]);
  assert.equal((app.window.document.activeElement.dataset || {}).weaponmode, "1|B", "a tick moved focus off the tick");
  assert.ok(zip().querySelector('[data-cell="weapons|1|name"]'), "a tick folded the row");
  assert.deepEqual(ticks(zip()).map(t => t.checked), [true, true, false]);
  assert.equal(old().querySelector('[data-weaponmode="2|S"]').checked, false, "the tick landed on the next row");
  // Folded: that row's buttons follow the ticks, and the next row's don't.
  app.click('[data-lodone="weapons|1"]');
  const fires = i => app.$$(`#main [data-fire^="${i}|"]`).map(b => b.dataset.fire);
  assert.deepEqual(fires(1), ["1|S", "1|B"]);
  assert.deepEqual(fires(2), ["2|"], "the Old iron's buttons moved with the Zip gun's ticks");
  assert.deepEqual(fires(0), ["0|S"]);
  assert.match(cellsOf(rowOf(app, 1)).join("|"), /S\/B/);
  // Undo takes the last tick back.
  app.click("#undotoast [data-toastundo]");
  assert.deepEqual(activeChar(app).weapons[1].rofModes, ["S"]);
  // Unticking the last clears the pick.
  app.click('[data-loedit="weapons|1"]');
  l2bChange(app, zip().querySelector('[data-weaponmode="1|S"]'), { checked: false });
  assert.ok(!Object.hasOwn(activeChar(app).weapons[1], "rofModes"));
  assert.match(audit().at(-1).label, /^Zip gun: fire modes → —$/);
  assert.deepEqual(app.errors, []);
});

test("L2b 6b (sheet): a saved row's typed RoF opens with its modes ticked, and the first tick writes the set", () => {
  const ch = l2Character({ category: "handguns", capacity: "15", rof: "S/B" });
  const app = openSheet(ch, "loadout");
  app.click('[data-loedit="weapons|1"]');
  const ticks = () => [...rowOf(app, 1).querySelectorAll("[data-weaponmode]")];
  assert.deepEqual(ticks().map(t => t.checked), [true, true, false], "a typed S/B didn't open with two ticked");
  assert.equal(rowOf(app, 1).querySelector("[data-weaponrofhint]"), null);
  l2bChange(app, ticks()[2], { checked: true });
  assert.deepEqual(activeChar(app).weapons[1].rofModes, ["S", "B", "F"], "the first tick didn't write the whole set");
  assert.equal(activeChar(app).weapons[1].rof, "S/B", "a tick rewrote the typed RoF");
  assert.deepEqual(app.errors, []);
});

test("L2b 7 (sheet): Reload on a written-in handgun takes a mag from Loadout and from Main, and says so", () => {
  const mk = () => { const ch = l2Character({ category: "handguns", capacity: "15", roundsSpent: 5, rof: "S/B" }); return ch; };
  const ch = mk();
  ch.gear.push({ id: "handgun-rounds", qty: 2, notes: "" });
  const app = openSheet(ch, "loadout");
  const qty = a => (activeChar(a).gear.find(g => g.id === "handgun-rounds" && g.roundsLeft == null) || { qty: 0 }).qty;
  assert.match(app.$('#main [data-reload="1"]').title, /Handgun Rounds: 2 mags carried/);
  app.click('#main [data-reload="1"]');
  assert.equal(qty(app), 1, "the mag didn't come off what's carried");
  assert.equal(activeChar(app).weapons[1].roundsSpent, 0);
  assert.match(activeChar(app).audit.at(-1).label, /^Reloaded Zip gun \(15\/15\), −1 mag of Handgun Rounds/);
  assert.deepEqual(activeChar(app).gear.filter(g => g.roundsLeft != null).map(g => g.roundsLeft), [10], "no part-used magazine came back");
  // Fire once, then Reload on Main: the second mag goes.
  app.click('#main [data-fire="1|S"]');
  app.click('[data-sec="main"]');
  assert.match(app.$('.main-combat [data-reload="1"]').title, /Handgun Rounds/);
  app.click('.main-combat [data-reload="1"]');
  assert.equal(qty(app), 0, "Main's Reload didn't take the second mag");
  assert.equal(activeChar(app).weapons[1].roundsSpent, 0);
  // With none carried it asks, and the audit says so.
  const dry = openSheet(mk(), "main");
  dry.click('.main-combat [data-reload="1"]');
  assert.equal(activeChar(dry).weapons[1].roundsSpent, 5, "reloaded from nothing without asking");
  assert.match(dry.$("#modal").textContent, /You carry no Handgun Rounds\. Reload anyway\?/);
  dry.click("#modal [data-askyes]");
  assert.match(activeChar(dry).audit.at(-1).label, /^Reloaded Zip gun anyway, no Handgun Rounds on the sheet/);
  // The untyped one still reloads free, with no question.
  const bare = openSheet(l2Character({ capacity: "15", roundsSpent: 5 }), "main");
  bare.click('.main-combat [data-reload="1"]');
  assert.equal(activeChar(bare).weapons[1].roundsSpent, 0);
  assert.ok(!bare.$("#modal") || !bare.$("#modal").open, "an untyped weapon asked");
  // Print reads the line: a ticked Zip gun prints its RoF, a twin of the folded row.
  const ticked = l2Character({ category: "handguns", capacity: "15" });
  delete ticked.weapons[1].rof; ticked.weapons[1].rofModes = ["S", "B"];
  const page = app.window.renderPrintView(ticked);
  const tr = page.split("<tr>").find(r => /Zip gun/.test(r));
  assert.match(tr, />S\/B</, "the printed sheet doesn't show a ticked row's RoF");
  assert.deepEqual([...app.errors, ...dry.errors, ...bare.errors], []);
});

test("L2b 6c (sheet): unticking the last mode on a typed-RoF row names what the row fires now, not a dash", () => {
  const app = openSheet(l2Character({ category: "handguns", capacity: "15", rof: "S/B" }), "loadout");
  app.click('[data-loedit="weapons|1"]');
  l2bChange(app, rowOf(app, 1).querySelector('[data-weaponmode="1|S"]'), { checked: false });
  l2bChange(app, rowOf(app, 1).querySelector('[data-weaponmode="1|B"]'), { checked: false });
  const labels = activeChar(app).audit.map(a => a.label);
  assert.equal(labels.at(-1), "Zip gun: fire modes → Single, Burst", "the audit said the row fires nothing");
  assert.deepEqual(app.errors, []);
});

// ── L5: a Major on one weapon or armor row (Decision 263) ──────────────

const L5_HELD = ["tuned-edge", "custom-fit", "weapon-expert", "signature-weapon", "iconic-weapon"];

function l5Character(held = L5_HELD) {
  const ch = l3Character();
  ch.identity.archetype = "professional";
  ch.skills.melee = { rank: 3, ipe: 0 };
  Engine.addLoadout(ch, "weapons", "combat-knife");
  Engine.addLoadout(ch, "weapons", "ap7-sentry");
  Engine.addLoadout(ch, "armor", "urban-tactics-vest");
  held.forEach(id => ch.progression.milestones.major.push({ id, date: "2026-11-01T00:00:00.000Z" }));
  return ch;
}

const majorBox = (app, kind, i, id) => app.$(`#main input[data-majorrow="${kind}|${i}|${id}"]`);

const journalOf = app => app.$$("#main .jrow").map(r => r.querySelector(".what").textContent);

test("L5 10 (sheet): a Major ticked on a weapon row moves its numbers, is one undoable action, and moves between rows", () => {
  // none of the six held: no Majors line anywhere
  const bare = openSheet(l5Character([]), "loadout");
  assert.equal(bare.$$("#main .lo-majors").length, 0, "a Majors line with nothing to place");
  const ch = l5Character();
  const before = Engine.weaponLine(ch, 1).damage;
  const app = openSheet(ch, "loadout");
  const audit = () => activeChar(app).audit;
  assert.ok(majorBox(app, "weapons", 1, "tuned-edge"), "the AP-7's row has no Tuned Edge box");
  assert.equal(majorBox(app, "weapons", 1, "iconic-weapon"), null, "a Major that follows another was offered");
  const n = audit().length;
  flip(app, majorBox(app, "weapons", 1, "tuned-edge"), true);
  assert.equal(audit().length, n + 1, "ticking wasn't one audit entry");
  assert.equal(audit().at(-1).label, 'Tuned Edge on AP-7 "Sentry"');
  assert.deepEqual(activeChar(app).weapons[1].majors, ["tuned-edge"]);
  assert.match(cellsOf(rowOf(app, 1))[2], new RegExp(`^${before + 1}`));
  assert.match(rowOf(app, 1).textContent, /\+1 from Tuned Edge/);
  assert.equal(app.window.document.activeElement, majorBox(app, "weapons", 1, "tuned-edge"), "focus left the box");
  assert.equal(majorBox(app, "weapons", 1, "tuned-edge").checked, true);
  // the knife's box says where it is, and ticking it moves it
  const knifeBox = majorBox(app, "weapons", 0, "tuned-edge");
  assert.equal(knifeBox.checked, false);
  assert.match(knifeBox.closest(".lo-majors").textContent, /on AP-7 "Sentry"/);
  flip(app, knifeBox, true);
  assert.equal(audit().at(-1).label, "Tuned Edge moved to Combat Knife");
  assert.deepEqual(activeChar(app).weapons[0].majors, ["tuned-edge"]);
  assert.ok(!Object.hasOwn(activeChar(app).weapons[1], "majors"), "the old row kept it");
  assert.equal(app.window.document.activeElement, majorBox(app, "weapons", 0, "tuned-edge"), "focus left the box");
  assert.doesNotMatch(rowOf(app, 1).textContent, /from Tuned Edge/);
  app.click("[data-toastundo]");
  assert.deepEqual(activeChar(app).weapons[1].majors, ["tuned-edge"], "undo didn't put it back on the AP-7");
  assert.ok(!Object.hasOwn(activeChar(app).weapons[0], "majors"));
  // taking it off
  flip(app, majorBox(app, "weapons", 1, "tuned-edge"), false);
  assert.equal(audit().at(-1).label, 'Tuned Edge off AP-7 "Sentry"');
  assert.ok(!Object.hasOwn(activeChar(app).weapons[1], "majors"));
  assert.equal(app.window.document.activeElement, majorBox(app, "weapons", 1, "tuned-edge"));
  assert.deepEqual(app.errors, []);
  // the engine's refusal (LQ32): Signature's slots hold mods, so it won't leave
  const held = l5Character();
  Engine.setMajorRow(held, "signature-weapon", 1);
  for (const mod of ["Silencer", "Laser Sight", "Holo Sight", "Flashlight"]) Engine.addWeaponMod(held, 1, mod);
  const app2 = openSheet(held, "loadout");
  const logged = activeChar(app2).audit.length, box = majorBox(app2, "weapons", 0, "signature-weapon");
  flip(app2, box, true);
  assert.equal(activeChar(app2).audit.length, logged, "a refused move was audited");
  assert.deepEqual(activeChar(app2).weapons[1].majors, ["signature-weapon"], "a refusal wrote");
  assert.ok(!Object.hasOwn(activeChar(app2).weapons[0], "majors"));
  assert.equal(box.checked, false, "the box shows a state that wasn't stored");
  assert.match(app2.$("#undotoast").textContent, /Take 1 slot of mods off first: Signature Weapon's slots are in use/);
  assert.deepEqual(app2.errors, []);
});

test("L5 11 (sheet): Custom Fit's die and Weapon Expert's kicker show on Loadout, Main, print and the hit modal", () => {
  const ch = l5Character();
  Engine.setMajorRow(ch, "custom-fit", 0);
  Engine.setMajorRow(ch, "weapon-expert", 1);
  const attack = Engine.weaponLine(ch, 1).attack;
  const app = openSheet(ch, "loadout");
  assert.match(armorCardOf(app, "Urban Tactics Vest").textContent, /PROT 1d8/);
  assert.match(armorCardOf(app, "Urban Tactics Vest").textContent, /1d6, a step up from Custom Fit/);
  assert.match(cellsOf(rowOf(app, 1))[1], new RegExp(`^1d10 \\+ ${attack} \\+ 1d4`));
  assert.match(cellsOf(rowOf(app, 1))[1], /1d4 from Weapon Expert/);
  assert.doesNotMatch(cellsOf(rowOf(app, 0))[1], /1d4/);
  app.click('[data-sec="main"]');
  assert.match(app.$("#main .lo-armor").textContent, /PROT 1d8/);
  const mainRow = app.$$("#main table.ref tbody tr").find(tr => /AP-7/.test(tr.textContent));
  assert.match(cellsOf(mainRow)[1], new RegExp(`^1d10 \\+ ${attack} \\+ 1d4`));
  const page = app.window.renderPrintView(activeChar(app));
  assert.match(page.split("<tr>").find(r => /AP-7/.test(r)), new RegExp(`1d10\\+${attack}\\+1d4`));
  assert.match(page, /<td class="num">1d8<\/td>|>1d8</);
  // the hit modal: a roll of 8 answers a d8
  app.click('[data-sec="trackers"]');
  app.click("[data-hitopen]");
  assert.match(app.$("[data-hitpanel]").textContent, /Urban Tactics Vest · PROT 1d8/);
  setHit(app, "damage", "12");
  setHit(app, "protRoll", "8");
  assert.match(app.$(".hitresult").textContent, /PROT 8/);
  assert.doesNotMatch(app.$(".hitresult").textContent, /can't be more than/);
  assert.deepEqual(app.errors, []);
});

test("L5 12 (sheet): Progression's journal says where each Major is, and removing one takes it off its row", () => {
  const ch = l5Character();
  Engine.setMajorRow(ch, "tuned-edge", 1);
  const damage = Engine.weaponLine(ch, 1).damage;
  const app = openSheet(ch, "progression");
  const j = journalOf(app);
  assert.ok(j.includes('Tuned Edge: AP-7 "Sentry"'), j.join(" | "));
  assert.ok(j.includes("Weapon Expert: not on a weapon yet"));
  assert.ok(j.includes("Custom Fit: not on armor yet"));
  assert.ok(j.includes("Iconic Weapon: goes with Signature Weapon"));
  const row = app.$$("#main .jrow").find(r => /^Tuned Edge/.test(r.querySelector(".what").textContent));
  row.querySelector("[data-delmajor]").dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.match(app.$("#modal").textContent, /Tuned Edge comes off the record, and off AP-7 "Sentry" too\./);
  app.click("[data-askyes], #modal [data-yes]");
  assert.ok(!Object.hasOwn(activeChar(app).weapons[1], "majors"), "the row kept the removed Major");
  assert.ok(activeChar(app).progression.milestones.major.every(m => m.id !== "tuned-edge"));
  assert.equal(Engine.weaponLine(activeChar(app), 1).damage, damage - 1);
  app.click("[data-toastundo]");
  assert.deepEqual(activeChar(app).weapons[1].majors, ["tuned-edge"], "one undo didn't restore both");
  assert.deepEqual(app.errors, []);
});

test("L5 10b (sheet): a written-in weapon takes Tuned Edge, shows the total folded, and its edit row keeps the damage as typed", () => {
  const ch = l5Character();
  ch.weapons.push({ custom: true, name: "Pipe", damage: "BOD+2", category: "melee", capacity: "", ammo: "", features: "", notes: "", roundsSpent: 0 });
  const total = Engine.weaponLine(ch, 2).damage;
  Engine.setMajorRow(ch, "tuned-edge", 2);
  const app = openSheet(ch, "loadout");
  assert.equal(majorBox(app, "weapons", 2, "signature-weapon"), null, "Signature was offered on a weapon that takes no mods");
  assert.ok(majorBox(app, "weapons", 2, "tuned-edge").checked);
  assert.match(cellsOf(rowOf(app, 2))[2], new RegExp(`^${total + 1}`));
  assert.match(rowOf(app, 2).textContent, /\+1 from Tuned Edge/);
  // Weapon Expert on the same written-in row: the kicker is beside its attack on Loadout (folded) and on Main
  const ch2 = JSON.parse(JSON.stringify(ch));
  Engine.setMajorRow(ch2, "weapon-expert", 2);
  const melee = Engine.weaponLine(ch2, 2).attack;
  const app2 = openSheet(ch2, "loadout");
  assert.match(cellsOf(rowOf(app2, 2))[1], /^1d10 . \d+ . 1d4/);
  app2.click('[data-sec="main"]');
  const pipe = app2.$$("#main table.ref tbody tr").find(tr => /Pipe/.test(tr.textContent));
  assert.ok(cellsOf(pipe)[1].includes(`${melee} + 1d4`), cellsOf(pipe)[1]);
  app.click('[data-loedit="weapons|2"]');
  assert.equal(app.$('[data-cell="weapons|2|damage"]').value, "BOD+2", "the edit row showed the total, not what was typed");
  assert.ok(majorBox(app, "weapons", 2, "tuned-edge"), "the open row lost its Majors line");
  assert.deepEqual(app.errors, []);
});

// ── Sustained powers run (H1, Decision 266, W110) ────────────────────────

function upyrSheet() {
  const ch = lockedVampire("upyr");
  ch.archetypeChoices.basePowers = { "iron-hide": 2 };
  ch.archetypeChoices.powerCp = {};
  ch.archetypeChoices.optionPicks = {};
  return ch;
}

test("Decision 266: one undo takes back a Start and its SFR", () => {
  const app = openSheet(upyrSheet(), "character");
  press(app, '[data-runtoggle="iron-hide|start"]');
  assert.deepEqual(activeChar(app).trackers.running, [{ id: "iron-hide" }]);
  assert.deepEqual(activeChar(app).trackers.sfr, { spent: 2, turn: 2 });
  app.click("button[data-undolast], [data-toastundo]");
  assert.deepEqual(activeChar(app).trackers.running, [], "undo left the power running");
  assert.equal(activeChar(app).trackers.sfr.spent, 0, "undo didn't give the SFR back");
  assert.deepEqual(app.errors, []);
});

test("Decision 266: Start and Stop on the card and in the SFR popover, and focus stays", () => {
  const app = openSheet(upyrSheet(), "character");
  const card = () => app.$('[data-runtoggle="iron-hide|start"], [data-runtoggle="iron-hide|stop"]').closest(".pick");
  assert.equal(app.$('[data-runtoggle="iron-hide|start"]').getAttribute("aria-label"), "Start Iron Hide");
  press(app, '[data-runtoggle="iron-hide|start"]');
  assert.match(card().textContent, /Running · 2 SFR a round/);
  assert.equal(app.$('[data-runtoggle="iron-hide|stop"]').getAttribute("aria-label"), "Stop Iron Hide");
  assert.equal(focused(app), app.$('[data-runtoggle="iron-hide|stop"]'), "focus left the card's Stop");
  app.click('[data-sec="main"]');
  app.click('#main [data-vpop="sfr"]');
  assert.match(app.$("#vpop").textContent, /Iron Hide · 2 SFR a round/);
  assert.equal(app.$('#vpop [data-runtoggle="iron-hide|stop"]').getAttribute("aria-label"), "Stop Iron Hide");
  press(app, '#vpop [data-runtoggle="iron-hide|stop"]');
  assert.deepEqual(activeChar(app).trackers.running, []);
  assert.equal(activeChar(app).trackers.sfr.spent, 2, "Stop took back SFR");
  assert.equal(focused(app), app.$('#vpop [data-runtoggle="iron-hide|start"]'), "focus didn't go to Start in the popover");
  assert.equal(app.$('#vpop [data-runtoggle="iron-hide|start"]').textContent.trim(), "Start Iron Hide");
  press(app, '#vpop [data-runtoggle="iron-hide|start"]');
  assert.equal(focused(app), app.$('#vpop [data-runtoggle="iron-hide|stop"]'), "focus didn't go to Stop in the popover");
  assert.deepEqual(app.errors, []);
});

test("Decision 266: Turn Reset lists what's running and a Stop box keeps it from being charged", () => {
  const ch = upyrSheet();
  ch.trackers.running = [{ id: "iron-hide" }];
  ch.trackers.sfr = { spent: 2, turn: 2 };
  const app = openSheet(ch, "trackers");
  app.click('[data-actopen="reset"]');
  const panel = () => app.$('[data-actpanel="reset"]').textContent;
  assert.match(panel(), /Iron Hide: 2 SFR to keep it running/);
  assert.match(panel(), /SFR spent this round: 2 → 2 \(Iron Hide keeps running\)/);
  const box = app.$('[data-act="stop:iron-hide"]');
  assert.equal(box.getAttribute("aria-label"), "Stop Iron Hide");
  box.focus(); box.checked = true; box.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.match(panel(), /SFR spent this round: 2 → 0\./);
  assert.ok(app.$('[data-act="stop:iron-hide"]').checked, "the Stop box came back unticked");
  assert.equal(focused(app), app.$('[data-act="stop:iron-hide"]'), "focus left the Stop box");
  app.click("[data-actapply]");
  assert.deepEqual(activeChar(app).trackers.running, []);
  assert.deepEqual(activeChar(app).trackers.sfr, { spent: 2, turn: 0 });
  assert.deepEqual(app.errors, []);
});

test("Decision 266: a Reset the pool can't pay says which power stops and why", () => {
  const ch = upyrSheet();
  ch.trackers.running = [{ id: "iron-hide" }];
  ch.trackers.sfr = { spent: 16, turn: 2 };
  const app = openSheet(ch, "trackers");
  app.click('[data-actopen="reset"]');
  assert.match(app.$('[data-actpanel="reset"]').textContent, /Iron Hide stops: it needs 2 SFR, 1 left\./);
  // Two kept powers read as a sentence, not a list.
  const two = upyrSheet();
  two.archetypeChoices.basePowers = { "iron-hide": 2, "cold-embrace": 1 };
  two.trackers.running = [{ id: "iron-hide" }, { id: "cold-embrace" }];
  two.trackers.sfr = { spent: 3, turn: 3 };
  const app2 = openSheet(two, "trackers");
  app2.click('[data-actopen="reset"]');
  assert.match(app2.$('[data-actpanel="reset"]').textContent, /SFR spent this round: 3 → 3 \(Iron Hide and Cold Embrace keep running\)\./);
  assert.deepEqual(app2.errors, []);
  assert.equal(app.$('[data-act="stop:iron-hide"]'), null, "an unpayable power has a Stop box");
  app.click("[data-actapply]");
  assert.deepEqual(activeChar(app).trackers.running, []);
  assert.deepEqual(activeChar(app).trackers.sfr, { spent: 16, turn: 0 });
});

test("Decision 266: a running Iron Hide's Natural Armor starts ticked on Take a hit", () => {
  const ch = upyrSheet();
  ch.trackers.running = [{ id: "iron-hide" }];
  const app = openSheet(ch, "trackers");
  app.click("[data-hitopen]");
  const box = () => app.$('[data-hitnat="iron-hide"]');
  assert.ok(box().checked, "the box starts unticked while Iron Hide runs");
  assert.match(app.$("[data-hitpanel]").textContent, /Natural Armor 3/);
  box().checked = false; box().dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.match(app.$("[data-hitpanel]").textContent, /Natural Armor 0/);
  app.click("[data-hitcancel]");
  app.click("[data-hitopen]");
  assert.ok(box().checked, "unticking carried to the next hit");
  // Not running: unticked, as before.
  const cold = openSheet(upyrSheet(), "trackers");
  cold.click("[data-hitopen]");
  assert.equal(cold.$('[data-hitnat="iron-hide"]').checked, false);
  assert.deepEqual(app.errors, []);
});

test("Decision 266: a hostile id in running renders as text, and a stale one is no Running line", () => {
  const ch = upyrSheet();
  ch.trackers.running = [{ id: "<img src=x onerror=alert(1)>" }, { id: "iron-hide" }];
  ch.trackers.sfr = { spent: 2, turn: 2 };
  const app = openSheet(ch, "character");
  assert.equal(app.$$("#main img").length, 0, "a hostile running id made an element");
  assert.match(app.$("#main").textContent, /Running · 2 SFR a round/);
  app.click('[data-sec="trackers"]'); app.click('[data-actopen="reset"]');
  assert.equal(app.$$('[data-actpanel="reset"] img').length, 0);
  assert.deepEqual(app.errors, []);
});

test("Decision 266 (Ken, 2026-11-05): a refused Start says why under the button, and a Start past RoU says so", () => {
  const ch = lockedCharacter();
  ch.identity.archetype = "werewolf"; ch.creation.powerLevel = "street";
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 6;
  ch.archetypeChoices.specialization = ["wildblood"]; ch.archetypeChoices.basePowers = { "let-it-loose": 1 };
  ch.progression.powerIpe = { "let-it-loose": 3 };
  const app = openSheet(ch, "character");
  const btn = () => app.$('[data-runtoggle="let-it-loose|start"]');
  assert.ok(btn().disabled);
  assert.equal(app.$("[data-runwhy]").textContent, "Werewolf Form only", "the reason isn't on the page");
  app.click('[data-sec="main"]'); app.click('#main [data-vpop="sfr"]');
  assert.equal(app.$("#vpop [data-runwhy]").textContent, "Werewolf Form only", "the popover's disabled Start gives no reason");
  app.click('#main [data-vpop="sfr"]');
  app.click('[data-ptoggle="form|Werewolf"]');
  app.click('[data-sec="character"]');
  assert.equal(app.$("[data-runwhy]"), null);
  press(app, '[data-runtoggle="let-it-loose|start"]');
  assert.match(app.$("#undotoast").textContent, /Started Let It Loose: 4 SFR, more than your RoU of 3\./);
  assert.deepEqual(app.errors, []);
});

// ── Powers that answer a hit (H2, Decision 267, W132) ────────────────────

function draugurSheet() {
  const ch = lockedVampire("draugur");
  ch.archetypeChoices.basePowers = { "spectral-veil": 1, "odins-aegis": 2 };
  ch.archetypeChoices.powerCp = {};
  ch.archetypeChoices.optionPicks = {};
  ch.trackers.running = [{ id: "spectral-veil" }];
  ch.trackers.sfr = { spent: 3, turn: 3 };
  return ch;
}

function forgeFangSheet(silver = false) {
  const ch = lockedCharacter();
  ch.identity.archetype = "werewolf"; ch.creation.powerLevel = "street";
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 6;
  ch.archetypeChoices.specialization = [silver ? "wildblood" : "forge-fang"];
  ch.archetypeChoices.basePowers = silver ? {} : { "null-field": 1 };
  if (silver) ch.progression.milestones.major.push({ id: "silverscar", date: "2026-10-08" });
  return ch;
}

test("Decision 267: Take a hit's power boxes: immunity and Null Field ticked, Odin's Aegis disabled with its reason, and one undo takes it all back", () => {
  const app = openSheet(draugurSheet(), "trackers");
  app.click("[data-hitopen]");
  assert.equal(app.$('[data-hitpow="spectral-veil"]').checked, true, "immunity starts unticked");
  setHit(app, "damage", "10");
  assert.match(app.$("[data-hitpanel] .hitresult").textContent, /Spectral Veil: no damage\./);
  assert.equal(app.$('[data-hit="protRoll"]'), null, "the PROT field shows for a hit that does nothing");
  const aegis = () => app.$('[data-hitreact="odins-aegis"]');
  assert.equal(aegis().disabled, true);
  assert.equal(app.$("[data-hitreactwhy]").textContent, "Elemental, Spirit or Aether only", "the reason isn't on the page");
  setHit(app, "damageType", "spirit");
  assert.equal(aegis().disabled, false);
  assert.equal(aegis().checked, false, "Odin's Aegis starts ticked");
  assert.equal(app.$("[data-hitreactwhy]"), null);
  tick(app, '[data-hitreact="odins-aegis"]', true);
  assert.match(app.$("[data-hitpanel] .hitresult").textContent, /Odin's Aegis takes off 4: 10 → 6./);
  app.click("[data-hitapply]");
  assert.match(app.$("#undotoast").textContent, /Hit: 10 Spirit → 6 through, Odin's Aegis −4 \(2 SFR\)/);
  let c = activeChar(app);
  assert.deepEqual([c.trackers.damage, c.trackers.sfr.spent], [6, 5]);
  app.click("button[data-undolast], [data-toastundo]");
  c = activeChar(app);
  assert.deepEqual([c.trackers.damage, c.trackers.sfr.spent], [0, 3], "undo left the damage or the SFR");
  assert.deepEqual(app.errors, []);
});

test("Decision 267: a starter row's table has no Id or Run column, and its Start sits under it", () => {
  const app = openSheet(forgeFangSheet(), "character");
  const heads = [...app.$$(".power table.ref thead th")].map(th => th.textContent);
  assert.deepEqual(heads, ["Augmentation", "Cost", "Effect"]);
  // The columns come from the first row's keys, so a row that carries the keys code reads must not turn them into columns.
  const html = app.window.eval('powerHtml({ name: "P", description: "d", rows: [{ id: "x", augmentation: "A", run: { each: "start" }, grants: [], cost: "1", effect: "e" }] })');
  assert.deepEqual([...html.matchAll(/<th>([^<]*)<\/th>/g)].map(m => m[1]), ["Augmentation", "Cost", "Effect"], "powerHtml turned id, run or grants into a column");
  const btn = app.$('[data-starterrun="adaptive-skeleton"] [data-runtoggle="adaptive-skeleton|start"]');
  assert.ok(btn, "no Start under the starter table");
  assert.equal(btn.getAttribute("aria-label"), "Start Adaptive Skeleton");
  press(app, '[data-runtoggle="adaptive-skeleton|start"]');
  const stop = app.$('[data-runtoggle="adaptive-skeleton|stop"]');
  assert.ok(stop);
  assert.equal(app.doc.activeElement, stop, "focus didn't move to Stop");
  assert.equal(app.$('[data-starterrun="adaptive-skeleton"] [data-runline]').textContent, "Running");
  // The popover names a started power and says it runs; "a round" is only for one that pays each round (order §9).
  const pop = app.window.eval('vitalPopover(S.ch, "sfr").html');
  assert.match(pop, /Adaptive Skeleton · running/, "the popover's row for a started power doesn't say it runs");
  app.click('[data-sec="trackers"]'); app.click("[data-hitopen]");
  assert.equal(app.$('[data-hitnat="adaptive-skeleton"]').checked, true, "Adaptive Skeleton's Natural Armor starts unticked");
  assert.deepEqual(app.errors, []);
});

test("Decision 267: a Withering hit asks From silver only with Silverscar", () => {
  for (const [silver, want] of [[true, true], [false, false]]) {
    const app = openSheet(forgeFangSheet(silver), "trackers");
    app.click("[data-hitopen]");
    assert.equal(!!app.$('[data-hit="silver"]'), false, "asked on a Regular hit");
    setHit(app, "category", "withering");
    assert.equal(!!app.$('[data-hit="silver"]'), want, `Silverscar ${silver}`);
    if (want) {
      setHit(app, "damage", "9"); setHit(app, "damageType", "blade");
      tick(app, '[data-hit="silver"]', true);
      assert.match(app.$("[data-hitpanel] .hitresult").textContent, /Silverscar halves it: 9 → 4\./);
    }
    assert.deepEqual(app.errors, []);
  }
});

test("Decision 267 (Ken, 2026-11-05): the voice pass: Aegis's label, the commit label's power, and a spent field", () => {
  const app = openSheet(draugurSheet(), "trackers");
  app.click("[data-hitopen]");
  assert.match(app.$("[data-hitpowers]").textContent, /Odin's Aegis: −4 for 2 SFR/);
  setHit(app, "damage", "10");
  // An immune hit changes nothing, so it records no action; the label is what an Undo toast would read.
  const label = app.window.eval('hitLabel(Engine.resolveHit(S.ch, hitInput(S.hit)))');
  assert.equal(label, "Hit: 10 Ballistic → 0 through, Spectral Veil");
  const ff = forgeFangSheet();
  Engine.setToggle(ff, "form", "Werewolf");
  ff.trackers.running = [{ id: "null-field", used: 4 }];
  const wolf = openSheet(ff, "trackers");
  wolf.click("[data-hitopen]");
  setHit(wolf, "damage", "3"); setHit(wolf, "damageType", "spirit");
  assert.match(wolf.$("[data-hitpanel] .hitresult").textContent, /Null Field absorbs 1: 3 → 2. The field is spent./);
  assert.deepEqual([app.errors, wolf.errors], [[], []]);
});

// ── Powers that heal (H3, Decision 268, W132) ────────────────────────────

function wildbloodSheet(bone = false) {
  const ch = forgeFangSheet(true);
  ch.archetypeChoices.basePowers = {};
  if (bone) ch.progression.milestones.major.push({ id: "bone-and-sinew", date: "2026-10-08" });
  return ch;
}

function surgeSheet(rankCp = 1) {
  const ch = lockedVampire("draugur");
  ch.archetypeChoices.basePowers = {};
  ch.archetypeChoices.powerCp = { "vitality-surge": rankCp };
  ch.archetypeChoices.optionPicks = {};
  return ch;
}

test("Decision 268: Turn Reset shows the heal and Quick Clot, and one undo takes them back", () => {
  const ch = wildbloodSheet();
  Engine.setToggle(ch, "form", "Werewolf");
  ch.trackers.damage = 20; ch.trackers.witheringDamage = 5;
  ch.trackers.conditions = [{ id: "bleeding" }];
  ch.trackers.aberrations = [{ id: "quick-clot", permanence: "permanent" }];
  const app = openSheet(ch, "trackers");
  app.click('[data-actopen="reset"]');
  const panel = app.$('[data-actpanel="reset"]').textContent;
  assert.match(panel, /Regeneration heals 5 HP: HP left 29 → 34\./);
  assert.match(panel, /Bleeding ends \(Quick Clot\)\./);
  app.click("[data-actapply]");
  const now = activeChar(app).trackers;
  assert.deepEqual([now.damage, now.witheringDamage, now.conditions], [16, 5, []]);
  app.click('[data-sec="progression"]');
  assert.match(app.$("#main").textContent, /Turn Reset: 1 damage, Regeneration \+5 HP, Bleeding ended \(Quick Clot\)/);
  app.click("button[data-undolast]");
  const back = activeChar(app).trackers;
  assert.deepEqual([back.damage, back.witheringDamage, back.conditions.map(c => c.id)], [20, 5, ["bleeding"]]);
  assert.deepEqual(app.errors, []);
});

test("Decision 268: Vitality Surge on the card and the HP popover, disabled with its reason while Blood of Valhalla runs", () => {
  const ch = surgeSheet();
  ch.trackers.damage = 20; ch.trackers.witheringDamage = 4;
  const app = openSheet(ch, "character");
  const sel = app.$('[data-surgehl="vitality-surge"]'), go = () => app.$('[data-surgego="vitality-surge"]');
  assert.equal(go().textContent.trim(), "Surge: heal 1 HL for 2 SFR");
  sel.value = "2"; sel.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(go().textContent.trim(), "Surge: heal 2 HL for 4 SFR", "the picker didn't redraw the label");
  press(app, '[data-surgego="vitality-surge"]');
  const t = activeChar(app).trackers;
  assert.deepEqual([t.damage, t.witheringDamage, t.sfr.spent, t.sfr.turn], [10, 4, 4, 4]);
  assert.match(app.$("#undotoast").textContent, /Vitality Surge: \+10 HP, 4 SFR/);
  assert.equal(focused(app), go(), "focus left the Surge button");
  // A pool that can pay only 1 HL offers only 1 (a refusal belongs on the page, not in a toast).
  const poor = surgeSheet(); poor.trackers.damage = 20; poor.trackers.sfr = { spent: Engine.sfr(poor).value - 3, turn: 0 };
  const app3 = openSheet(poor, "character");
  assert.equal(app3.window.document.querySelectorAll('[data-surgehl="vitality-surge"] option').length, 1);
  // Blood of Valhalla running: the popover's button is disabled and the reason is on the page.
  app.click("button[data-undolast], [data-toastundo]");
  const run = surgeSheet(); run.archetypeChoices.basePowers = { "blood-of-valhalla": 1 };
  run.trackers.damage = 20; run.trackers.running = [{ id: "blood-of-valhalla" }];
  const app2 = openSheet(run, "main");
  app2.click('#main [data-vpop="hp"]');
  assert.ok(app2.$('#vpop [data-surgego="vitality-surge"]').disabled);
  assert.equal(app2.$("#vpop [data-runwhy]").textContent, "Not while Blood of Valhalla runs");
  assert.deepEqual([app.errors, app2.errors], [[], []]);
});

test("Decision 268: shifting in with Bone and Sinew says which Maimed ended, and undo brings it back", () => {
  const ch = wildbloodSheet(true);
  ch.trackers.conditions = [{ id: "maimed", location: "left-arm" }];
  const app = openSheet(ch, "main");
  app.click('[data-ptoggle="form|Werewolf"]');
  assert.match(app.$("#undotoast").textContent, /Form: Werewolf\. Maimed \(Left Arm\) ends\./);
  assert.deepEqual(activeChar(app).trackers.conditions, []);
  app.click("button[data-undolast], [data-toastundo]");
  assert.deepEqual(activeChar(app).trackers.conditions.map(c => c.id), ["maimed"]);
  assert.deepEqual(app.errors, []);
});

// ── E2a: seven tabs, one home each (Decisions 281–283) ─────────────────

test("Decision 281: the sheet has seven tabs, and Loadout is Loadout", () => {
  const app = openSheet(lockedCharacter(), "main");
  const tabs = app.$$("#topnav [data-sec]");
  assert.deepEqual(tabs.map(t => t.dataset.sec), ["main", "skills", "character", "trackers", "progression", "loadout", "notes"]);
  assert.deepEqual(tabs.map(t => t.textContent.trim()), ["Main", "Skills", "Character", "Trackers", "Progression", "Loadout", "Notes"]);
  assert.deepEqual(app.errors, []);
});

test("Decision 283: Conditions are on Main, and an opened chip takes its note", () => {
  const noPenalty = D.conditions.find(c => typeof c.rollPenalty !== "number" && !c.rollPenaltyWhen && !c.location && !c.helpless);
  const penalty = D.conditions.find(c => typeof c.rollPenalty === "number" && !c.location && !c.helpless);
  const app = openSheet(lockedCharacter(), "trackers");
  assert.equal(app.$("#main .cond-card"), null, "Trackers still draws Condition cards");
  assert.equal(app.$("#main [data-condpalette]"), null, "Trackers still has the Condition palette");
  assert.ok(![...app.$$("#main .sect")].some(s => /^Conditions/.test(s.textContent)), "Trackers still has a Conditions heading");
  app.click('[data-sec="main"]');
  app.click(`#main [data-condquick="${noPenalty.id}"]`);
  app.click('#main [data-condinfo="0"]');
  const note = app.$('#main [data-condnote="0"]');
  assert.ok(note, "an opened chip has no note field");
  note.value = "the poison, from the dealer";
  note.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(activeChar(app).trackers.conditions[0].note, "the poison, from the dealer");
  assert.ok(app.$('#main [data-condnote="0"]'), "the chip closed after the note was typed");
  assert.ok(!app.$("#main .cond-info").textContent.includes(D.conditionRules.penaltyStacking.text), "the stacking rule shows on a Condition with no roll penalty");
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).trackers.conditions[0].note || "", "", "one Undo didn't take the note back");
  app.click(`#main [data-condquick="${penalty.id}"]`);
  app.click('#main [data-condinfo="1"]');
  assert.ok(app.$("#main .cond-info").textContent.includes(D.conditionRules.penaltyStacking.text), "a penalised Condition's chip lacks the stacking rule");
  assert.deepEqual(app.errors, []);
});

test("Decision 283: the Pain & Conditions popover's chip takes a note too", () => {
  const c = D.conditions.find(x => !x.location && !x.helpless);
  const app = openSheet(lockedCharacter(), "skills");
  app.click('[data-vpop="pain"]');
  app.click(`#vpop [data-condquick="${c.id}"]`);
  app.click('#vpop [data-condinfo="0"]');
  const note = app.$('#vpop [data-condnote="0"]');
  assert.ok(note, "the popover's opened chip has no note field");
  note.value = "from the popover";
  note.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(activeChar(app).trackers.conditions[0].note, "from the popover");
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).trackers.conditions[0].note || "", "");
  assert.deepEqual(app.errors, []);
});

test("Decision 282: Main draws every toggle, even one whose options do nothing the engine models", () => {
  const ch = lockedVampire("draugur");
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "main" } } });
  const panel = app.Engine.archPanels(ch).find(p => p.type === "toggle");
  for (const o of panel.options) { delete o.effectText; delete o.stats; delete o.grants; }
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent)).dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click('[data-sec="main"]');
  assert.ok(app.$(`#main [data-ptoggle^="${panel.id}|"]`), "Main didn't draw a toggle whose options do nothing");
  assert.ok(app.$("#main .main-form").textContent.includes(D.appCopy.applyFromText), "Main lacks the apply-from-the-text line");
  app.click(`#main [data-ptoggle="${panel.id}|${panel.options[1].name}"]`);
  assert.match(JSON.stringify(activeChar(app).panelData), new RegExp(panel.options[1].name));
  assert.deepEqual(app.errors, []);
});

test("Decision 282: a spell held from Character is let go from Main", () => {
  const ch = lockedCharacter();
  ch.archetypeChoices.disciplines = { evocation: 3 - Engine.disciplineRanks(ch).find(d => d.id === "evocation").rank };
  ch.panelData.grimoire = [{ spellId: "fog-shroud", stage: "known", notes: "" }];
  const app = openSheet(ch, "character");
  app.click('#main [data-hold="fog-shroud"]');
  assert.deepEqual(activeChar(app).trackers.heldSpells, ["fog-shroud"]);
  app.click('[data-sec="main"]');
  assert.match(app.$("[data-holding]").textContent, /Holding Fog Shroud/);
  app.click('[data-holding] [data-letgo="fog-shroud"]');
  assert.deepEqual(activeChar(app).trackers.heldSpells, []);
  assert.deepEqual(app.errors, []);
});

test("Decision 283: Clear in the popover keeps focus inside the popover", () => {
  const app = openSheet(lockedCharacter(), "main");
  app.click('#main [data-condquick="stunned"]'); app.click('#main [data-condquick="prone"]');
  app.click('#main [data-vpop="pain"]');
  app.click('#vpop [data-condinfo="0"]');
  app.click('#vpop [data-condrm="0"]');
  assert.equal(activeChar(app).trackers.conditions.length, 1);
  assert.ok(app.$("#vpop").contains(focused(app)), "focus left the popover for the page behind it");
  assert.deepEqual(app.errors, []);
});

test("Decision 283: a Condition the game data no longer has still opens, and shows its note", () => {
  const ch = lockedCharacter();
  ch.trackers.conditions = [{ id: "gone-condition", note: "kept from an old file" }];
  const app = openSheet(ch, "main");
  app.click('#main [data-condinfo="0"]');
  const info = app.$("#main .cond-info");
  assert.ok(info, "the chip opened to nothing");
  assert.ok(info.textContent.includes(D.appCopy.orphanNote.replace("{kind}", "Condition")), "the missing Condition says it isn't in the current rules");
  assert.equal(app.$('#main [data-condnote="0"]').value, "kept from an old file");
  assert.deepEqual(app.errors, []);
});

test("Decision 283: Clear on an open chip hands focus to the next chip, then to the palette", () => {
  const app = openSheet(lockedCharacter(), "main");
  app.click('#main [data-condquick="stunned"]'); app.click('#main [data-condquick="prone"]');
  app.click('#main [data-condinfo="0"]');
  app.click('#main [data-condrm="0"]');
  assert.equal(activeChar(app).trackers.conditions.length, 1);
  assert.equal(focused(app), app.$("#main [data-condinfo]"), "focus fell to the page when the pressed ✕ went");
  app.click('#main [data-condrm="0"]');
  assert.equal(activeChar(app).trackers.conditions.length, 0);
  assert.equal(focused(app), app.$("#main [data-condpalette] > summary"), "focus didn't reach the palette with no chip left");
  assert.deepEqual(app.errors, []);
});

// E5: what the game data dropped wears one chip, wherever it shows.
export function orphanFixture() {
  const ch = lockedCharacter();
  ch.weapons = [{ id: "gone-gun" }]; ch.armor = [{ id: "gone-vest" }]; ch.gear = [{ id: "gone-kit", qty: 1 }];
  ch.archetypeChoices.specialization = ["gone-origin"];
  ch.trackers.aberrations = [{ id: "gone-aber", permanence: "permanent" }, { id: "gone-temp", permanence: "temporary" }];
  ch.trackers.conditions = [{ id: "gone-cond" }];
  ch.panelData = { grimoire: [{ spellId: "gone-spell", stage: "known" }] };
  return ch;
}

test("E5: what the game data dropped wears one chip", () => {
  const chip = D.appCopy.orphanChip, note = kind => D.appCopy.orphanNote.replace("{kind}", kind);
  const app = openSheet(orphanFixture(), "loadout");
  const seen = {};
  for (const sec of ["loadout", "character", "trackers", "main"]) {
    app.click(`[data-sec="${sec}"]`);
    seen[sec] = app.$("#main").textContent;
    assert.doesNotMatch(seen[sec], /game data|any more/, `${sec} still says "game data" or "any more"`);
  }
  assert.equal(seen.loadout.split(chip).length - 1, 3, "the weapon, the armor and the gear each wear the chip");
  assert.ok(seen.character.includes(chip), "the specialization doesn't wear the chip");
  assert.ok(seen.trackers.includes("gone-temp") && seen.trackers.includes(chip), "a temporary Aberration doesn't wear the chip");
  assert.ok(seen.trackers.includes(note("Aberration")), "a permanent Aberration's card doesn't carry the note");
  app.click('[data-sec="main"]'); app.click('#main [data-condinfo="0"]');
  assert.ok(app.$("#main .cond-info").textContent.includes(note("Condition")), "a missing Condition's note");
  assert.deepEqual(app.errors, []);
});

// ── E8: Pain Level, the Rest line and a flag's note carry their terms (W133) ──

test("E8 6: Pain Level, the Rest line and a flag's note carry their terms", () => {
  const trig = el => [...el.querySelectorAll('[data-tip="term"]')].map(t => t.textContent);
  const ch = lockedCharacter();
  ch.stats.BOD.base = 8;
  ch.trackers.damage = 5 * (D.resources.healthLevels.hpPerLevel) + 2;   // five Health Levels gone
  const pain = Engine.painState(ch), hp = Engine.health(ch);
  assert.equal(pain.level, 2, "the fixture isn't at Pain Level 2");
  assert.ok(ch.trackers.damage < hp.total, "the fixture is DOWN: " + JSON.stringify(hp));
  const app = openSheet(ch, "main");
  const mainPain = [...app.$$("#main .step-note")].find(n => n.textContent.startsWith("Pain Level 2"));
  assert.ok(mainPain, "Main has no Pain line");
  assert.deepEqual(trig(mainPain), ["Pain Level 2"]);
  const t = mainPain.querySelector('[data-tip="term"]');
  clickIn(app, t);
  assert.ok(tipShown(app).includes(D.resources.healthLevels.painLevels[2].description), "the tip isn't the level's description: " + tipShown(app));
  app.click('[data-sec="skills"]');
  const sp = [...app.$$("#main .step-note")].find(n => n.textContent.startsWith("Pain Level 2"));
  assert.deepEqual(trig(sp), ["Pain Level 2"]);
  app.click('[data-sec="trackers"]');
  assert.deepEqual(trig(app.$(".pick h2")).slice(0, 1), ["Pain Level 2"], "the Pain card's title");
  app.click('[data-actopen="rest"]');
  assert.ok(trig(app.$('[data-actpanel="rest"] .hitnote')).includes("BOD"), "the Rest line's BOD isn't a trigger");
  assert.deepEqual(app.errors, []);
  // a flagged Major's playerNote
  const pro = lockedCharacter(); pro.identity.archetype = "professional"; pro.progression.milestonePoints = 100;
  const prog = openSheet(pro, "progression");
  const card = prog.$('[data-majorcard="specialist"]');
  assert.ok(card, "no Specialist card");
  assert.deepEqual(trig(card.querySelector(".flag")), ["Kicker Die"]);
  assert.deepEqual(prog.errors, []);
});

// ── E4: colour that keeps its one meaning ─────────────────────────────
// A worn body piece at Integrity 0 reads damaged wherever the sheet draws it,
// and says RES is gone (the engine already skips it: resSkipped).

const e4Piece = kind => {
  const ch = lockedCharacter();
  ch.armor.push({ id: "kevlar-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: [] });
  const max = Engine.armorState(ch).worn.integrityMax;
  if (kind !== "healthy") ch.armor[0].integrityLoss = max;
  if (kind === "scrap") ch.armor[0].scrapped = true;
  const w = Engine.armorState(ch).worn;
  if (kind === "compromised") assert.ok(w.integrity === 0 && w.compromised && !w.scrapped, "the compromised fixture isn't compromised-and-not-scrap");
  if (kind === "scrap") assert.ok(w.scrapped && w.integrity === 0, "the scrap fixture isn't scrap");
  if (kind === "healthy") assert.ok(w.integrity > 0 && !w.compromised && !w.scrapped, "the healthy fixture isn't healthy");
  return { ch, w };
};

const e4Armor = (kind, section) => {
  const { ch, w } = e4Piece(kind);
  return { app: openSheet(ch, section), w };
};

for (const kind of ["compromised", "scrap"]) {
  test(`E4 2: a ${kind} worn piece reads damaged on Main, Loadout, Trackers and the Hit panel`, () => {
    const note = kind === "scrap" ? D.armorRules.scrapNote : D.armorRules.compromisedNote;
    for (const section of ["main", "loadout"]) {
      const { app, w } = e4Armor(kind, section);
      const card = app.$("#main .lo-armor.worn");
      assert.ok(card && card.classList.contains("down"), `${section}: the card isn't .down`);
      assert.equal(card.classList.contains("scrap"), kind === "scrap", `${section}: .scrap is wrong for a ${kind} piece`);
      const off = card.querySelector(".res-off");
      assert.ok(off, `${section}: no .res-off`);
      assert.ok(off.textContent.startsWith(`RES +${w.res}`), `${section}: .res-off reads "${off.textContent}"`);
      assert.ok(!off.textContent.includes("PROT"), `${section}: PROT is inside .res-off`);
      assert.ok(card.querySelector(".hitarmor").textContent.replace(off.textContent, "").includes(`PROT ${w.prot}`), `${section}: PROT doesn't read as a value outside the strike`);
      const notes = [...card.querySelectorAll("[data-armordown]")];
      // Loadout's repair row already says scrapNote for scrap, so it isn't repeated there.
      const want = section === "loadout" && kind === "scrap" ? 0 : 1;
      assert.equal(notes.length, want, `${section}: ${notes.length} [data-armordown] notes`);
      if (want) assert.equal(notes[0].textContent.trim(), note);
    }
    const { app, w } = e4Armor(kind, "trackers");
    const line = [...app.$$("#main .trk .hitarmor")].find(e => e.textContent.includes(w.name));
    assert.ok(line && line.classList.contains("down"), "Trackers' Armor line isn't .down");
    assert.equal(line.classList.contains("scrap"), kind === "scrap");
    assert.ok(line.querySelector(".res-off") && line.querySelector(".res-off").textContent.startsWith(`RES +${w.res}`), "Trackers: RES isn't marked off");
    assert.equal(app.$$("#main .trk [data-armordown]").length, 1, "Trackers: the note isn't there once");
    assert.equal(app.$("#main .trk [data-armordown]").textContent.trim(), note);
    app.click("[data-hitopen]");
    const hl = [...app.$$("[data-hitpanel] .hitarmor")].find(e => e.textContent.includes(w.name));
    assert.ok(hl && hl.classList.contains("down"), "the Hit panel's line isn't .down");
    assert.equal(hl.classList.contains("scrap"), kind === "scrap");
    assert.ok(hl.querySelector(".res-off") && hl.querySelector(".res-off").textContent === `RES +${w.res}`, "the Hit panel: RES isn't marked off");
  });
}

test("E4 2: the After-the-fight panel's line is .down for a damaged piece", () => {
  const { app, w } = e4Armor("compromised", "trackers");
  app.click('[data-actopen="wear"]');
  const l = [...app.$$('[data-actpanel="wear"] .hitarmor')].find(e => e.textContent.includes(w.name));
  assert.ok(l && l.classList.contains("down"), "After the fight: not .down");
});

test("E4 2: a healthy worn piece wears none of it, and its text is the same", () => {
  for (const section of ["main", "loadout", "trackers"]) {
    const { app, w } = e4Armor("healthy", section);
    assert.equal(app.$$("#main .down, #main .res-off, #main [data-armordown]").length, 0, `${section}: a healthy piece reads damaged`);
    const line = [...app.$$("#main .hitarmor")].find(e => e.textContent.includes("PROT"));
    assert.match(line.textContent.replace(/\s+/g, " "), new RegExp(`PROT ${w.prot} · RES \\+${w.res} \\(`));
  }
  const { app } = e4Armor("healthy", "trackers");
  app.click("[data-hitopen]");
  assert.equal(app.$$("[data-hitpanel] .down, [data-hitpanel] .res-off").length, 0);
  app.click('[data-actopen="wear"]');
  assert.equal(app.$$('[data-actpanel="wear"] .down').length, 0);
});

// ── E6: the phone. An attack's dice never break; the kicker and sub-lines may. ──

test("E6 2: every place the sheet draws an attack wraps the dice in the hook", () => {
  const ch = lockedCharacter();
  ch.weapons = [{ id: "sg88-siege-breaker", notes: "", mods: [], roundsSpent: 0 }, { id: "combat-knife", notes: "" }];
  assert.equal(ch.weapons.length, 2);
  const lines = ch.weapons.map((_, i) => Engine.weaponLine(ch, i));
  for (const l of lines) assert.equal(typeof l.attack, "number", "the fixture's weapon has no attack");
  const want = lines.map(l => `1d10 ${l.attack < 0 ? "−" : "+"} ${Math.abs(l.attack)}`);
  for (const sec of ["main", "loadout"]) {
    const app = openSheet(ch, sec);
    const cells = app.$$("#main td.num").filter(td => /^1d10 [+−] \d+/.test(td.textContent.trim()));
    assert.ok(cells.length >= 2, `${sec}: only ${cells.length} Attack cells drew`);
    for (const w of want) {
      const hit = cells.find(td => td.textContent.trim().startsWith(w));
      assert.ok(hit, `${sec}: no Attack cell reads "${w}"`);
      const atk = hit.querySelector(".atk");
      assert.ok(atk, `${sec}: "${w}" isn't in the hook`);
      assert.equal(atk.textContent, w, `${sec}: the hook holds more or less than the dice`);
      assert.equal(atk.querySelector(".lo-sub, .sub"), null, `${sec}: a sub-line is inside the hook`);
    }
    assert.deepEqual(app.errors, []);
  }
});

// ── E7: Main's weapons table is the one with the phone padding ──

test("E7 2: Main's weapons table carries its hook, and Loadout's doesn't", () => {
  const ch = lockedCharacter();
  ch.skills.handguns = { rank: 8, ipe: 0 };
  ch.weapons = [{ id: "cheapshot", notes: "", mods: [], roundsSpent: 0 }];
  assert.ok(ch.weapons.some(w => w.id === "cheapshot"), "the fixture holds no Cheapshot");
  const l = Engine.weaponLine(ch, 0);
  assert.ok(l && l.attack >= 10, `Cheapshot's attack is ${l && l.attack}, two digits wanted`);
  assert.ok(l.capacity, "Cheapshot has no capacity, so no Cap. cell to widen");
  const main = openSheet(ch, "main");
  const wpn = main.$$("#main table.ref").find(t => /Cheapshot/.test(t.textContent) && /Weapon/.test(t.textContent));
  assert.ok(wpn, "Main draws no weapons table");
  assert.ok(wpn.classList.contains("wpn"), "Main's weapons table has no wpn hook");
  const skills = main.$$("#main table.ref").filter(t => t !== wpn && /Combat Skill/.test(t.textContent));
  assert.ok(skills.length, "Main's combat skills table isn't found");
  for (const t of skills) assert.ok(!t.classList.contains("wpn"), "the combat skills table carries the hook");
  assert.deepEqual(main.errors, []);
  const lo = openSheet(ch, "loadout");
  const lw = lo.$("#main table.lo-weapons");
  assert.ok(lw && /Cheapshot/.test(lw.textContent), "Loadout's weapons table isn't found");
  assert.ok(!lw.classList.contains("wpn"), "Loadout's weapons table carries the hook");
  assert.deepEqual(lo.errors, []);
});

// ── J1: SFR max and Rate of Use by hand (Decision 312), and W174 ─────────────

function lockedWerewolf() {
  const ch = lockedCharacter();
  ch.identity.archetype = "werewolf";
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 6;
  ch.archetypeChoices.specialization = ["trueborn"];
  return ch;
}

const adjOptions = app => [...app.$$("[data-adjtarget] option")].map(o => o.value);

function applyAdj(app, target, amount, note = "a ruling") {
  const sel = app.$("[data-adjtarget]"); sel.value = target;
  const amt = app.$("[data-adjamt]"); amt.value = String(amount);
  app.$("[data-adjnote]").value = note;
  app.click("[data-adjadd]");
}

const sfrPanel = app => [...app.$$("#main .trk")].find(t => /^SFR/.test(t.querySelector("h2").textContent));

test("J1: Manual Adjustments offers SFR max and Rate of Use to a Werewolf, and neither to a Professional", () => {
  const ww = openSheet(lockedWerewolf(), "trackers");
  assert.deepEqual(adjOptions(ww).slice(-2), ["SFR", "ROU"]);
  assert.deepEqual([...ww.$$("[data-adjtarget] option")].slice(-2).map(o => o.textContent), ["SFR max", "SFR Rate of Use"]);
  const pro = lockedCharacter(); pro.identity.archetype = "professional";
  const p = openSheet(pro, "trackers");
  assert.deepEqual(adjOptions(p).filter(v => v === "SFR" || v === "ROU"), []);
  assert.deepEqual(ww.errors, []);
});

test("J1: +2 SFR max reads 10 on Main's card and the Trackers panel, and Undo takes it back to 8", () => {
  const ch = lockedWerewolf();
  const base = Engine.sfr(ch).value;
  const app = openSheet(ch, "trackers");
  applyAdj(app, "SFR", 2);
  assert.match(sfrPanel(app).querySelector(".big").textContent, new RegExp(`/ ${base + 2}$`));
  assert.match(sfrPanel(app).querySelector("[data-sfrbyhand]").textContent, /^\+2 max by hand, in Manual Adjustments\.$/);
  app.click('[data-sec="main"]');
  assert.match(app.$('#main [data-vpop="sfr"]').textContent, new RegExp(`${base + 2}`));
  app.click('[data-sec="progression"]');
  app.click("button[data-undolast]");
  app.click('[data-sec="trackers"]');
  assert.match(sfrPanel(app).querySelector(".big").textContent, new RegExp(`/ ${base}$`));
  assert.equal(sfrPanel(app).querySelector("[data-sfrbyhand]"), null, "the line stayed after Undo");
  assert.deepEqual(app.errors, []);
});

test("J1: a Custom pool's box keeps what was typed, and the adjustment doesn't count twice", () => {
  const ch = writtenInCharacter();
  ch.archetypeChoices.writeIn.mechanics = ["sfr"];
  ch.trackers.panel = { sfr: { value: 0, max: 20 } };
  const app = openSheet(ch, "trackers");
  applyAdj(app, "SFR", -3);
  assert.equal(app.$('[data-trkmax="sfr"]').value, "20", "the box shows the adjusted max");
  assert.match(sfrPanel(app).querySelector(".big").textContent, /\/ 17$/);
  const box = app.$('[data-trkmax="sfr"]'); box.value = "25"; box.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(activeChar(app).trackers.panel.sfr.max, 25, "an edit stored something other than what was typed");
  assert.equal(Engine.sfr(activeChar(app)).value, 22);
  assert.deepEqual(app.errors, []);
});

test("J1: a Custom pool's line never names a Rate of Use it doesn't have", () => {
  const ch = writtenInCharacter();
  ch.archetypeChoices.writeIn.mechanics = ["sfr"];
  ch.trackers.panel = { sfr: { value: 0, max: 20 } };
  ch.trackers.adjustments.push({ target: "ROU", amount: 2, note: "a hand-edited file", date: "2026-11-22" });
  const app = openSheet(ch, "trackers");
  assert.equal(sfrPanel(app).querySelector("[data-sfrbyhand]"), null, "the line names a Rate of Use the pool doesn't have");
  applyAdj(app, "SFR", -3);
  assert.equal(sfrPanel(app).querySelector("[data-sfrbyhand]").textContent, "−3 max by hand, in Manual Adjustments.");
  assert.equal(activeChar(app).audit.at(-1).label, "Adjust SFR max −3 (a ruling)", "the Activity Log names the target as the journal does");
  assert.deepEqual(app.errors, []);
});

test("J1: the journal names SFR max and SFR Rate of Use, and prints any other target as text", () => {
  const ch = lockedWerewolf();
  ch.trackers.adjustments.push({ target: "<b>x</b>", amount: 1, note: "", date: "2026-11-22" });
  const app = openSheet(ch, "trackers");
  applyAdj(app, "SFR", 1); applyAdj(app, "ROU", -1);
  const what = [...app.$$(".journal .what")].map(e => e.textContent);
  assert.deepEqual(what, ["<b>x</b>", "SFR max", "SFR Rate of Use"]);
  assert.equal(app.$(".journal .what b"), null, "a hostile target rendered as markup");
  assert.match(app.$("#main").textContent, /\+1 max and −1 RoU by hand, in Manual Adjustments\./);
});

test("J1: a Vampire's +1 Rate of Use reads RoU 5 on Main's card", () => {
  const app = openSheet(streetVampire(), "trackers");
  applyAdj(app, "ROU", 1);
  app.click('[data-sec="main"]');
  assert.match(app.$('#main [data-vpop="sfr"]').textContent, /RoU 5/);
});

test("J1: Admin's button opens Trackers with focus on the target", () => {
  const app = openSheet(lockedWerewolf(), "main");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  assert.equal(app.$("[data-admin-adjmax]").textContent, D.appCopy.adminAdjustMaximum);
  app.click("[data-admin-adjmax]");
  assert.ok(app.$("[data-adjtarget]"), "Trackers didn't open");
  assert.equal(focused(app), app.$("[data-adjtarget]"));
  assert.deepEqual(app.errors, []);
});

test("W174: Esc with ⋮ open puts focus back on ⋮, and an outside click doesn't", () => {
  const app = openSheet(lockedCharacter(), "main");
  const toggle = () => app.$("#hdractions [data-menu-toggle]");
  const esc = () => app.doc.activeElement.dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  app.click("[data-menu-toggle]");
  const item = app.$("#hdrmenu button"); item.focus();
  assert.equal(focused(app), item);
  esc();
  assert.equal(app.$("#hdrmenu").hidden, true);
  assert.equal(focused(app), toggle(), "focus stayed on a hidden menu item");
  app.click("[data-menu-toggle]");
  const other = app.$("#main button, #main a, #main input"); other.focus();
  other.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.equal(app.$("#hdrmenu").hidden, true);
  assert.equal(focused(app), other, "an outside click pulled focus back to the menu button");
  assert.deepEqual(app.errors, []);
});

// ── J2: a pool the player names (Decision 313, W49) ─────────────────

const POOLS = [{ id: "pool-aaaaaaaa", name: "Glamour" }, { id: "pool-bbbbbbbb", name: "Chi" }];

function poolChar({ mechanics = ["pools"], pools = POOLS.slice(0, 1), panel = {} } = {}) {
  const ch = writtenInCharacter();
  ch.archetypeChoices.writeIn.mechanics = mechanics;
  ch.archetypeChoices.writeIn.pools = pools.map(p => ({ ...p }));
  ch.trackers.panel = panel;
  return ch;
}

// Admin is behind the menu (Decision 281's Admin mode), not a section button.
const openAdmin = ch => { const app = openSheet(ch, "main"); app.click("[data-menu-toggle]"); app.click("[data-admin]"); return app; };

const setVal = (app, sel, v) => {
  const el = app.$(sel); assert.ok(el, `no ${sel}`);
  el.value = v; el.dispatchEvent(new app.window.Event("change", { bubbles: true }));
};

test("J2: a named pool is a tracker that counts down from the max you type", () => {
  const app = openSheet(poolChar(), "trackers");
  const trk = app.$$("#main .trk").find(t => t.querySelector("h2") && t.querySelector("h2").textContent === "Glamour");
  assert.ok(trk, "no Glamour tracker on Trackers");
  setVal(app, '[data-trkmax="pool-aaaaaaaa"]', "6");
  assert.equal(activeChar(app).trackers.panel["pool-aaaaaaaa"].max, 6, "the max box didn't size the pool");
  press(app, '#main [data-trk="pool-aaaaaaaa|1"]');
  press(app, '#main [data-trk="pool-aaaaaaaa|1"]');
  assert.equal(activeChar(app).trackers.panel["pool-aaaaaaaa"].value, 2, "+1 didn't count the pool down");
  press(app, '#main [data-trk="pool-aaaaaaaa|-1"]');
  assert.equal(activeChar(app).trackers.panel["pool-aaaaaaaa"].value, 1);
  assert.deepEqual(app.errors, []);
});

test("J2: Main shows a card per sized pool, and its popover spends it", () => {
  const app = openSheet(poolChar({ pools: POOLS.slice(), panel: { "pool-aaaaaaaa": { value: 0, max: 6 } } }), "main");
  const card = () => app.$('#main [data-vpop="pool:pool-aaaaaaaa"]');
  assert.match(card().textContent, /6\/6/, "the card doesn't read left/max");
  assert.equal(app.$('#main [data-vpop="pool:pool-bbbbbbbb"]'), null, "an unsized pool has a card");
  assert.equal(app.$("#main .cond.cred").classList.contains("alone"), false, "one sized pool left Çredits alone");
  app.click('#main [data-vpop="pool:pool-aaaaaaaa"]');
  // A count-down tracker counts what's spent, so +1 spends (as SFR's does) and −1 gives one back.
  press(app, '#vpop [data-trk="pool-aaaaaaaa|1"]');
  assert.match(card().textContent, /5\/6/, "the popover's +1 didn't spend the pool");
  press(app, '#vpop [data-trk="pool-aaaaaaaa|-1"]');
  assert.match(card().textContent, /6\/6/, "the popover's −1 didn't give the spend back");
  press(app, '#vpop [data-trk="pool-aaaaaaaa|1"]');
  app.click("#undotoast [data-toastundo]");
  assert.match(card().textContent, /6\/6/, "Undo didn't put the pool back");
  // One sized pool and CRANK (on here): three cards, so CRANK is the last and sits alone. Two sized pools: four, none alone.
  assert.equal(app.$("#main .cond.crank").classList.contains("alone"), true, "one pool left CRANK off its row");
  const two = openSheet(poolChar({ pools: POOLS.slice(), panel: { "pool-aaaaaaaa": { value: 0, max: 6 }, "pool-bbbbbbbb": { value: 0, max: 3 } } }), "main");
  assert.equal(two.$("#main .alone"), null, "two pools left a card alone on its row");
  assert.match(two.$('#main [data-vpop="pool:pool-bbbbbbbb"]').textContent, /3\/3/);
  assert.deepEqual(app.errors, []);
});

test("J2: the Activity Log names a tracker by its title", () => {
  const app = openSheet(poolChar({ mechanics: ["magic", "pools"], panel: { "pool-aaaaaaaa": { value: 0, max: 6 } } }), "trackers");
  press(app, '#main [data-trk="pool-aaaaaaaa|1"]');
  assert.equal(activeChar(app).audit.at(-1).label, "Glamour +1");
  press(app, '#main [data-trk="tol-spent|1"]');
  assert.equal(activeChar(app).audit.at(-1).label, "TOL Spent +1", "TOL Spent's log line used its id");
  setVal(app, '[data-trkmax="pool-aaaaaaaa"]', "8");
  assert.equal(activeChar(app).audit.at(-1).label, "Glamour max → 8");
});

test("J2: a pool named with markup prints as text everywhere", () => {
  const evil = "<img src=x onerror=alert(1)>";
  const ch = () => poolChar({ mechanics: ["magic", "pools"], pools: [{ id: "pool-aaaaaaaa", name: evil }], panel: { "pool-aaaaaaaa": { value: 0, max: 6 } } });
  for (const section of ["trackers", "main", "admin"]) {
    const app = section === "admin" ? openAdmin(ch()) : openSheet(ch(), section);
    assert.equal(app.$$("#main img").length, 0, `${section} drew an img from a pool's name`);
    if (section !== "admin") assert.ok(app.$("#main").textContent.includes(evil), `${section} doesn't show the name as text`);
    else assert.equal(app.$('[data-admin-pool="pool-aaaaaaaa"]').value, evil, "Admin's Name field doesn't hold the name");
    if (section === "main") {
      app.click('#main [data-vpop="pool:pool-aaaaaaaa"]');
      assert.equal(app.$("#vpop img"), null, "the popover drew an img");
      assert.ok(app.$("#vpop").textContent.includes(evil), "the popover's title isn't the name");
    }
    const box = app.doc.createElement("div"); box.innerHTML = app.window.renderPrintView(activeChar(app));
    assert.equal(box.querySelectorAll("img").length, 0, `${section}: print drew an img`);
    assert.ok(box.textContent.includes(evil), `${section}: print doesn't show the name`);
  }
  const app = openSheet(ch(), "trackers");
  press(app, '#main [data-trk="pool-aaaaaaaa|1"]');
  assert.equal(app.$("#undotoast img"), null, "the Activity Log's toast drew an img");
  assert.ok(activeChar(app).audit.at(-1).label.includes(evil), "the log's label dropped the name");
});

test("J2: Admin renames, adds and removes a pool, and Undo puts each back", () => {
  const app = openAdmin(poolChar({ pools: POOLS.slice(), panel: { "pool-aaaaaaaa": { value: 2, max: 6 } } }));
  const pools = () => activeChar(app).archetypeChoices.writeIn.pools;
  setVal(app, '[data-admin-pool="pool-aaaaaaaa"]', "Mana");
  assert.equal(pools()[0].name, "Mana", "the rename didn't stick");
  app.click("#undotoast [data-toastundo]");
  assert.equal(pools()[0].name, "Glamour", "Undo didn't put the name back");
  app.click('[data-admin-poolrm="pool-aaaaaaaa"]');
  assert.equal(pools().length, 1);
  assert.equal(activeChar(app).trackers.panel["pool-aaaaaaaa"], undefined, "a removed pool kept its count");
  app.click("#undotoast [data-toastundo]");
  assert.equal(pools().length, 2);
  assert.deepEqual(activeChar(app).trackers.panel["pool-aaaaaaaa"], { value: 2, max: 6 }, "Undo didn't bring the count back");
  app.click("[data-admin-pooladd]");
  assert.equal(pools().length, 3, "Add a pool didn't add one");
  app.click("#undotoast [data-toastundo]");
  assert.equal(pools().length, 2);
  assert.deepEqual(app.errors, []);
});

test("J2: print's archetype page lists the pools", () => {
  const app = openSheet(poolChar({ pools: POOLS.slice(), panel: { "pool-aaaaaaaa": { value: 0, max: 6 } } }), "main");
  const page = html => { const box = app.doc.createElement("div"); box.innerHTML = html; const p = box.querySelectorAll(".p-page"); return p[p.length - 1]; };
  const pg = page(app.window.renderPrintView(activeChar(app)));
  const heads = [...pg.querySelectorAll(".p-section")].find(s => s.textContent === "Pools");
  assert.ok(heads, "the archetype page has no Pools");
  const rows = [...heads.nextElementSibling.querySelectorAll("tbody tr")].map(tr => [...tr.cells].map(td => td.textContent.trim()));
  assert.equal(JSON.stringify(rows), JSON.stringify([["Glamour", "6"], ["Chi", ""]]), "a pool with no max should print a blank");
  const off = page(app.window.renderPrintView(poolChar({ mechanics: [] })));
  assert.equal([...off.querySelectorAll(".p-section")].some(s => s.textContent === "Pools"), false, "an unticked pool printed");
});

// ── J4: spend several at once (Decision 315, W176) ───────────────────

// The amount field beside a tracker's − and +, found in the card or popover (`scope`) that holds them.

const typeAmount = (app, scope, pid, v) => setVal(app, `${scope} [data-trkamt="${pid}"]`, v);

const trkOf = app => activeChar(app).trackers.sfr;

test("J4: every tracker control has an amount field on each of its twins", () => {
  const twins = (app, scope, label) => {
    const btns = app.$$(`${scope} [data-trk]`);
    assert.ok(btns.length, `${label}: no tracker buttons`);
    for (const b of btns) {
      const pid = b.dataset.trk.split("|")[0];
      assert.ok(b.parentElement.querySelector(`[data-trkamt="${pid}"]`), `${label}: ${pid} has no amount field beside its − and +`);
    }
  };
  twins(openSheet(poolChar({ mechanics: ["magic", "pools"], panel: { "pool-aaaaaaaa": { value: 0, max: 6 } } }), "trackers"), "#main", "the Trackers row");
  const sf = openSheet(streetVampire(), "main");
  sf.click('#main [data-vpop="sfr"]');
  twins(sf, "#vpop", "the SFR popover");
  const pool = openSheet(poolChar({ panel: { "pool-aaaaaaaa": { value: 0, max: 6 } } }), "main");
  pool.click('#main [data-vpop="pool:pool-aaaaaaaa"]');
  twins(pool, "#vpop", "a named pool's popover");
});

test("J4: at the default amount a press is the ±1 it was", () => {
  const app = openSheet(streetVampire(), "main");
  app.click('#main [data-vpop="sfr"]');
  assert.equal(app.$('#vpop [data-trkamt="sfr"]').value, "1", "the amount field doesn't start at 1");
  press(app, '#vpop [data-trk="sfr|1"]');
  assert.equal(activeChar(app).audit.at(-1).label, "SFR +1");
  assert.deepEqual([trkOf(app).spent, trkOf(app).turn], [1, 1]);
  assert.equal(app.$('#vpop [data-trkamt="sfr"]').value, "1", "a press left the field off 1");
  assert.match(app.$("#vpop").textContent, /1 of 4 this round/);
  assert.deepEqual(app.errors, []);
});

test("J4: a typed amount is one change and one Undo", () => {
  const app = openSheet(streetVampire(), "main");
  app.click('#main [data-vpop="sfr"]');
  const before = activeChar(app).audit.length;
  typeAmount(app, "#vpop", "sfr", "6");
  press(app, '#vpop [data-trk="sfr|1"]');
  assert.equal(trkOf(app).spent, 6, "the amount didn't spend all six");
  assert.equal(activeChar(app).audit.length, before + 1, "six presses' worth of log lines, not one");
  assert.equal(activeChar(app).audit.at(-1).label, "SFR +6");
  app.click("#undotoast [data-toastundo]");
  assert.deepEqual([trkOf(app).spent, trkOf(app).turn || 0], [0, 0], "Undo didn't take all six back");
});

test("J4: an amount counts against the round as its amount, and warns at and past Rate of Use", () => {
  const app = openSheet(streetVampire(), "main");
  app.click('#main [data-vpop="sfr"]');
  typeAmount(app, "#vpop", "sfr", "3");
  press(app, '#vpop [data-trk="sfr|1"]');
  assert.match(app.$("#vpop").textContent, /3 of 4 this round/);
  typeAmount(app, "#vpop", "sfr", "3");
  press(app, '#vpop [data-trk="sfr|1"]');
  assert.match(app.$("#vpop").textContent, /6 this round, 2 past your Rate of Use\. Your GM's call\./);
  assert.ok(app.$('#main [data-vpop="sfr"]').classList.contains("danger"), "the card didn't go to the danger class past RoU");
});

test("J4: a take-back of more than the count stops at zero and takes back the round first", () => {
  const app = openSheet(streetVampire(), "main");
  app.click('#main [data-vpop="sfr"]');
  typeAmount(app, "#vpop", "sfr", "2");
  press(app, '#vpop [data-trk="sfr|1"]');
  const before = activeChar(app).audit.length;
  typeAmount(app, "#vpop", "sfr", "9");
  press(app, '#vpop [data-trk="sfr|-1"]');
  assert.deepEqual([trkOf(app).spent, trkOf(app).turn], [0, 0], "a take-back went below zero");
  assert.equal(activeChar(app).audit.length, before + 1, "the take-back wrote more than one entry");
  assert.equal(activeChar(app).audit.at(-1).label, "SFR −2", "the log named 9 when only 2 came off");
  app.click("#undotoast [data-toastundo]");
  assert.deepEqual([trkOf(app).spent, trkOf(app).turn], [2, 2], "Undo didn't put the spend back");
});

test("J4: an amount past TOL shows the Cascade panel once, with no roll", () => {
  const ch = lockedCharacter();
  const n = Engine.derived(ch).TOL + 3;   // three points past the max: a panel per point would show three
  const app = openSheet(ch, "trackers");
  typeAmount(app, "#main", "tol-spent", String(n));
  press(app, '#main [data-trk="tol-spent|1"]');
  assert.equal(activeChar(app).trackers.panel["tol-spent"].value, n, "the amount didn't spend all of it");
  assert.equal(app.$$("[data-cascadepanel]").length, 1, "the Cascade panel isn't shown once");
  assert.equal(activeChar(app).audit.at(-1).label, `TOL Spent +${n}`);
});

test("J4: a named pool's amount moves its count and is named in the Activity Log", () => {
  const app = openSheet(poolChar({ panel: { "pool-aaaaaaaa": { value: 0, max: 6 } } }), "main");
  app.click('#main [data-vpop="pool:pool-aaaaaaaa"]');
  typeAmount(app, "#vpop", "pool-aaaaaaaa", "4");
  press(app, '#vpop [data-trk="pool-aaaaaaaa|1"]');
  assert.equal(activeChar(app).trackers.panel["pool-aaaaaaaa"].value, 4);
  assert.equal(activeChar(app).audit.at(-1).label, "Glamour +4");
});

test("J4: text that isn't a whole amount from 1 to 9999 changes nothing", () => {
  const app = openSheet(poolChar({ mechanics: ["magic", "pools"], panel: { "pool-aaaaaaaa": { value: 0, max: 6 } } }), "trackers");
  const before = activeChar(app).audit.length;
  for (const v of ["x", "1.5", "0", "-2", "", "10000"]) {
    typeAmount(app, "#main", "pool-aaaaaaaa", v);
    press(app, '#main [data-trk="pool-aaaaaaaa|1"]');
    assert.equal(activeChar(app).trackers.panel["pool-aaaaaaaa"].value, 0, `"${v}" moved the count`);
  }
  assert.equal(activeChar(app).audit.length, before, "a refused amount wrote a log line");
});

test("J4: Enter spends the typed amount and Escape puts the field back to 1", () => {
  const app = openSheet(streetVampire(), "main");
  app.click('#main [data-vpop="sfr"]');
  const key = (sel, k) => app.$(sel).dispatchEvent(new app.window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  typeAmount(app, "#vpop", "sfr", "5");
  const typed = app.$('#vpop [data-trkamt="sfr"]');
  key('#vpop [data-trkamt="sfr"]', "Enter");
  assert.equal(trkOf(app).spent, 5, "Enter didn't spend the typed amount");
  assert.equal(app.$('#vpop [data-trkamt="sfr"]').value, "1", "the press didn't put the field back to 1");
  // Enter's own change lands on the field the press replaced: it must not keep the 5 for the next draw.
  typed.value = "5"; typed.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  app.click('#main [data-vpop="sfr"]');   // closes the popover
  app.click('#main [data-vpop="sfr"]');   // and draws it again from the amount kept
  assert.equal(app.$('#vpop [data-trkamt="sfr"]').value, "1", "a change on the field Enter replaced kept 5 for the next draw");
  assert.equal(trkOf(app).spent, 5, "the reopen spent something");
  typeAmount(app, "#vpop", "sfr", "7");
  key('#vpop [data-trkamt="sfr"]', "Escape");
  assert.equal(app.$('#vpop [data-trkamt="sfr"]').value, "1", "Escape didn't put the field back to 1");
  assert.equal(trkOf(app).spent, 5, "Escape spent");
  assert.equal(app.$("#vpop").hidden, false, "Escape closed the popover");
});

test("J4: the amount parser is total: a whole number from 1 to 9999, or nothing", () => {
  const app = boot();
  for (const v of ["x", "1.5", "0", "-2", "", "10000", "NaN", "Infinity", "-0", "1e308", "+3", "9".repeat(400), null, undefined])
    assert.equal(app.window.amountOf(v), null, `${String(v).slice(0, 20)} parsed as an amount`);
  assert.equal(app.window.amountOf("1"), 1);
  assert.equal(app.window.amountOf(" 42 "), 42);
  assert.equal(app.window.amountOf("9999"), 9999);
});

test("J4: a take-back at zero moves nothing, so it writes no log line and no Undo entry", () => {
  const app = openSheet(streetVampire(), "main");
  app.click('#main [data-vpop="sfr"]');
  const before = activeChar(app).audit.length;
  press(app, '#vpop [data-trk="sfr|-1"]');
  typeAmount(app, "#vpop", "sfr", "4");
  press(app, '#vpop [data-trk="sfr|-1"]');
  assert.equal(activeChar(app).audit.length, before, "a take-back that moved nothing wrote a log line");
  assert.equal(app.$("#undotoast [data-toastundo]"), null, "a take-back that moved nothing offered an Undo");
  assert.equal(app.$('#vpop [data-trkamt="sfr"]').value, "4", "the typed amount was thrown away by a take-back that moved nothing");
});

test("J4: the names of + and − follow the typed amount before the field is left", () => {
  const app = openSheet(streetVampire(), "main");
  app.click('#main [data-vpop="sfr"]');
  const field = app.$('#vpop [data-trkamt="sfr"]');
  field.value = "6";
  field.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  assert.equal(app.$('#vpop [data-trk="sfr|1"]').getAttribute("aria-label"), "Spend 6 on SFR", "+ still says 1 while the field holds 6");
  assert.equal(app.$('#vpop [data-trk="sfr|-1"]').getAttribute("aria-label"), "Take back 6 from SFR", "− still says 1 while the field holds 6");
  assert.equal(trkOf(app).spent ?? 0, 0, "typing spent something before a press");
  press(app, '#vpop [data-trk="sfr|1"]');
  assert.equal(trkOf(app).spent, 6, "the press didn't spend the typed 6");
});
