/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: the Grimoire, aberrations, the Skills grid, and rules a tap away.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, D, lockedCharacter, onArchetypeStep, openSheet, activeChar, pickFromCatalog, search, clickIn, arcanistOnCP, card, tipShown, pick, tip, lockedVampire } from "./smokekit.mjs";

// ── Grimoire from the book (Decision 108) ─────────────────────────────
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
  for (const l of ["Disadvantages", "Advantages", "Starting spells", "CP Boosts"]) assert.ok(labels.includes(l), `no jump to ${l}`);
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
  assert.equal(app.$(".lo-modrow .flag"), null, "an installed Scope still draws a note (F26 is closed)");

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
  assert.doesNotMatch(modal.textContent, /still being settled/, "F34 is closed: the swap says nothing is unsettled");
  assert.match(modal.textContent, /goes back in your gear with what's left in it/, "the swap doesn't say the old magazine comes back");
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

test("P9b 10: Reload keeps the old magazine on Loadout, and one undo puts it all back", () => {
  const ch = lockedCharacter();
  ch.weapons.push({ id: "ar9x-guardian", notes: "", mods: [], roundsSpent: 13 });   // 18 of 31 left
  ch.gear.push({ id: "rifle-rounds", qty: 2, notes: "" });
  const app = openSheet(ch, "main");
  app.click('.main-combat [data-reload="0"]');
  assert.match(app.$("#undotoast").textContent, /kept with 18 rounds/, "the toast doesn't say the old magazine was kept");
  assert.deepEqual(activeChar(app).gear.map(g => [g.id, g.qty, g.roundsLeft]), [["rifle-rounds", 1, undefined], ["rifle-rounds", 1, 18]]);
  app.click('[data-sec="loadout"]');
  const row = [...app.$$(".lo-gear-row")].find(r => /18 rounds left/.test(r.textContent));
  assert.ok(row, "Loadout doesn't read 18 rounds left");
  assert.ok(row.querySelector("[data-gearuse]") && /Drop/.test(row.querySelector("[data-gearuse]").textContent), "no Drop button");
  assert.equal(row.querySelector("[data-gearplus]"), null, "a part-used magazine takes +1");
  assert.ok(!/Use one/.test(row.textContent), "a part-used magazine says Use one");
  app.click("[data-toastundo]");
  assert.deepEqual([activeChar(app).weapons[0].roundsSpent, activeChar(app).gear.map(g => [g.qty, g.roundsLeft])], [13, [[2, undefined]]], "one undo didn't restore the weapon and the gear");
  assert.deepEqual(app.errors, []);
  // Drop removes the row, and says how much was in it.
  const c2 = lockedCharacter();
  c2.gear.push({ id: "rifle-rounds", qty: 1, roundsLeft: 18, notes: "" });
  const app2 = openSheet(c2, "loadout");
  app2.click('[data-gearuse="0"]');
  assert.equal(activeChar(app2).gear.length, 0);
  assert.match(app2.$("#undotoast").textContent, /Dropped Rifle Rounds \(18 rounds left in it\)/);
  assert.deepEqual(app2.errors, []);
});

test("P9b 11: the swap chooser says the magazine comes back, with no unsettled note", () => {
  const ch = lockedCharacter();
  ch.weapons.push({ id: "ar9x-guardian", notes: "", mods: [], roundsSpent: 13 });
  ch.gear.push({ id: "rifle-rounds", qty: 1, notes: "" }, { id: "silver-rounds", qty: 1, notes: "" }, { id: "rifle-rounds", qty: 1, roundsLeft: 22, notes: "" });
  const app = openSheet(ch, "main");
  app.click('.main-combat [data-reload="0"]');
  const modal = app.$("#modal");
  assert.ok(modal.open, "no choice of rounds");
  assert.match(modal.textContent, /22 rounds · part-used/, "the part-used magazine has no line of its own");
  assert.equal(modal.querySelectorAll('[data-loadammo="rifle-rounds"]').length, 1, "the whole kind's button isn't exactly one");
  assert.equal(modal.querySelectorAll("[data-loadpart]").length, 1);
  assert.match(modal.textContent, /goes back in your gear with what's left in it/, "the swap sentence isn't said");
  assert.equal(modal.querySelector(".flag"), null, "the chooser still draws a flag note");
  assert.doesNotMatch(modal.textContent, /still being settled/, "the unsettled note is still there");
  app.click("#modal [data-loadpart]");
  assert.equal(activeChar(app).weapons[0].roundsSpent, 9, "the part-used magazine didn't load");
  assert.match(app.$("#undotoast").textContent, /from a part-used mag of 22 rounds.*kept with 18 rounds/);
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

// ── Rules a tap away (Decision 139) ───────────────────────────────────
const withWhip = () => { const ch = lockedCharacter(); ch.weapons = [{ id: "razorwhip", notes: "", mods: [], roundsSpent: 0 }]; return ch; };

// A flagged tag carries a player note, and the tip draws it. No real tag is
// flagged now, so the data is seeded before the sheet renders; Reach stands in.
test("a flagged tag on Main reads out with its player note", () => {
  const app = boot({ storage: { "shadows.active.v1": { ch: withWhip(), section: "main" } } });
  app.window.eval(`Object.assign(SHADOWS_DATA.weaponTagGlossary.find(t => t.id === "Reach"), { flagged: true, flagNote: "F0 synthetic maintainer note", playerNote: "A synthetic player note." })`);
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent)).dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click('[data-sec="main"]');
  clickIn(app, app.$('#main .tag[data-term="Reach"]'));
  assert.match(tipShown(app), /A synthetic player note\./, "a flagged tag hid its player note");
  assert.doesNotMatch(tipShown(app), /maintainer/, "the maintainer note reached the tip");
  assert.deepEqual(app.errors, []);
});

test("P9a 11: the Reach tip has no unsettled note", () => {
  const app = openSheet(withWhip(), "main");
  clickIn(app, app.$('#main .tag[data-term="Reach"]'));
  assert.match(tipShown(app), /reaches as far as its Reach column says/, "the Reach tip didn't open");
  assert.equal(app.$("#tip .tip-note"), null, "the Reach tip still draws a note");
  assert.doesNotMatch(tipShown(app), /isn't written yet/);
  assert.deepEqual(app.errors, []);
});

test("P9a 10: How a check works reads Easy, Average and Challenging", () => {
  const app = openSheet(lockedCharacter(), "skills");
  const chips = app.$$("#main details.group .chip").map(c => c.textContent);
  for (const t of ["Easy 10", "Average 15", "Challenging 20"]) assert.ok(chips.includes(t), `no "${t}" chip: ${JSON.stringify(chips)}`);
  assert.deepEqual(app.errors, []);
});

test("a tag on Main reads out on a tap, and a second tap or Esc puts it away", () => {
  const app = openSheet(withWhip(), "main");
  const ap = app.$('#main .tag[data-term="AP"]');
  assert.ok(ap, "Main's weapon shows no AP chip");
  clickIn(app, ap);
  assert.match(tipShown(app), /Armor Piercing/, "the tap didn't read the tag out");
  assert.equal(ap.getAttribute("aria-describedby"), "tip");
  clickIn(app, ap);
  assert.equal(tipShown(app), "", "a second tap left it open");
  clickIn(app, ap);
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
  assert.match(main(), /Each spell you hold sets aside one die from every Essence roll/, "P10: the Concentration line doesn't say the ruling");
  assert.ok(!/dice equal to/.test(main()), "P10: the old Threshold text is still shown");
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

// ── P17: the Vampire's Major Milestones (Decision 223) ─────────────────────
const strigoi = (extra = {}) => {
  const ch = lockedVampire("strigoi");
  ch.archetypeChoices.basePowers = { "shadow-play": 1, "veil-of-night": 1 };
  ch.archetypeChoices.optionPicks = {}; ch.archetypeChoices.powerCp = {};
  ch.progression.milestonePoints = 100;
  Object.assign(ch.progression, extra);
  return ch;
};
const setHitP17 = (app, key, value) => {
  const el = app.$(`[data-hit="${key}"]`);
  assert.ok(el, `the hit form has no ${key} control`);
  el.value = value;
  el.dispatchEvent(new app.window.Event(el.getAttribute("inputmode") === "numeric" ? "input" : "change", { bubbles: true }));
};

test("P17 10: Splice on Progression asks which power, and one undo takes it back", () => {
  const app = openSheet(strigoi(), "progression");
  app.click('[data-takemajor="splice"]');
  const modal = app.$("#modal");
  assert.ok(modal.open, "Take didn't open a chooser");
  assert.equal(activeChar(app).progression.milestones.major.length, 0, "Take committed before a power was picked");
  const picks = [...modal.querySelectorAll("[data-mmpick]")].map(b => b.dataset.mmpick);
  assert.ok(picks.includes("iron-hide") && picks.includes("hels-dread"), "Upyr's and Draugur's powers aren't listed");
  assert.ok(!picks.includes("shadow-play") && !picks.includes("bone-spines"), "the Bloodline it was made with is offered");
  assert.ok(!picks.includes("bestial-blessings"), "an Innate power is offered");
  assert.match(modal.textContent, /Upyr[\s\S]*Draugur/);
  assert.ok(modal.querySelector("[data-mmtake]").disabled, "Take is live before a pick");
  // Cancel changes nothing, and focus goes back to Splice's Take button.
  app.click("#modal [data-modalclose]");
  assert.equal(activeChar(app).progression.milestones.major.length, 0);
  assert.equal(app.window.document.activeElement, app.$('[data-takemajor="splice"]'), "focus didn't return to Splice's Take button");
  app.click('[data-takemajor="splice"]');
  app.click('#modal [data-mmpick="iron-hide"]');
  app.click("#modal [data-mmtake]");
  assert.deepEqual(activeChar(app).progression.milestones.major.map(m => [m.id, m.power]), [["splice", "iron-hide"]]);
  assert.equal(activeChar(app).audit.filter(e => /Splice/.test(e.label)).length, 1, "the take is more than one action");
  assert.match(app.$("#main .journal").textContent, /Splice: Iron Hide/);
  assert.equal(app.window.document.activeElement, app.$('[data-majorcard="splice"]'), "focus didn't go to Splice's card");
  assert.ok(app.$('[data-takemajor="pure-blooded"]').disabled && /Can't be taken with Splice/.test(app.$('[data-takemajor="pure-blooded"]').closest(".pick").textContent));
  app.click('[data-sec="character"]');
  assert.match(app.$("#main").textContent, /Iron Hide[\s\S]*rank 1/);
  app.click('[data-sec="sessions"]');
  app.click("button[data-undolast]");
  assert.deepEqual(activeChar(app).progression.milestones.major, [], "one undo left the Major");
  app.click('[data-sec="character"]');
  assert.ok(!app.$$("#main .pick h2").some(h => /Iron Hide/.test(h.textContent)), "one undo left the power");
  assert.deepEqual(app.errors, []);
});

test("P17 10b: removing Splice asks first and names the IP that stays spent", () => {
  const ch = strigoi({ powerIpe: { "iron-hide": 1 } });
  ch.progression.milestones.major = [{ id: "splice", power: "iron-hide", date: "2026-10-15T00:00:00.000Z" }];
  ch.progression.ip.log.push({ date: "2026-10-15", kind: "grant", amount: 50, note: "" }, { date: "2026-10-15", kind: "spend", amount: 20, targetType: "power", targetId: "iron-hide", from: 1, to: 2, note: "" });
  const app = openSheet(ch, "progression");
  app.click("[data-delmajor]");
  assert.match(app.$("#modal").textContent, /Iron Hide is no longer held\. Its 20 IP stay spent/);
  app.click("#modal [data-askyes]");
  assert.deepEqual(activeChar(app).progression.milestones.major, []);
  assert.equal(activeChar(app).progression.powerIpe["iron-hide"], 1);
  assert.deepEqual(app.errors, []);
});

test("P17 10c: removing Splice doesn't say the power goes when an opened Bloodline still holds it", () => {
  const ch = strigoi({ powerIpe: { "iron-hide": 1 }, specializationsGained: ["upyr"] });
  ch.progression.milestones.major = [{ id: "splice", power: "iron-hide", date: "2026-10-15T00:00:00.000Z" }];
  ch.progression.ip.log.push({ date: "2026-10-15", kind: "grant", amount: 50, note: "" }, { date: "2026-10-15", kind: "spend", amount: 20, targetType: "power", targetId: "iron-hide", from: 1, to: 2, note: "" });
  const app = openSheet(ch, "progression");
  app.click("[data-delmajor]");
  const text = app.$("#modal").textContent;
  assert.match(text, /Splice comes off the record\./);
  assert.doesNotMatch(text, /no longer held|stay spent/, "the confirm says Iron Hide goes, but Upyr's IP still holds it");
  app.click("#modal [data-askyes]");
  assert.ok(Engine.archetypePowers(activeChar(app)).some(p => p.id === "iron-hide"), "Iron Hide should still be held");
  assert.deepEqual(app.errors, []);
});

test("P17 11: Gained a bloodline opens one, and Learn a new power lists it", () => {
  const ch = strigoi();
  ch.progression.ip.earned = 100;
  const app = openSheet(ch, "character");
  const card = () => app.$('[data-powercard="cursed-evolution"]');
  assert.ok(card().querySelector("[data-gainspec]"), "no Gained a bloodline button");
  assert.match(card().textContent, /Gained a bloodline/);
  app.click("[data-gainspec]");
  assert.match(app.$("#modal").textContent, /won the opposed WILL Essence check/, "the condition isn't said");
  assert.deepEqual([...app.$$("#modal [data-gspick]")].map(b => b.dataset.gspick), ["upyr", "draugur"]);
  assert.ok(app.$("#modal [data-gsopen]").disabled);
  app.click('#modal [data-gspick="upyr"]');
  app.click("#modal [data-gsopen]");
  assert.deepEqual([...activeChar(app).progression.specializationsGained], ["upyr"]);
  assert.match(card().textContent, /Opened: Upyr/);
  assert.equal(card().querySelector("[data-gainspec]"), null, "a full set still shows the button");
  assert.equal(app.window.document.activeElement, card(), "focus didn't go to the Cursed Evolution card");
  app.click('[data-sec="progression"]');
  app.click('[data-raiseopen="power"]');
  const modal = app.$("#modal").textContent;
  assert.match(modal, /Learn a new power[\s\S]*Upyr[\s\S]*Iron Hide/);
  assert.ok(!app.$('#modal [data-raise="power|hels-dread"]'), "Draugur's powers are offered");
  assert.match(app.$('#modal [data-raise="power|iron-hide"]').closest("tr").textContent, /40 IP/);
  app.click('#modal [data-raise="power|iron-hide"]');
  assert.equal(activeChar(app).progression.powerIpe["iron-hide"], 1);
  app.click("#modal [data-modalclose]");
  app.click('[data-sec="character"]');
  assert.match(app.$("#main").textContent, /Iron Hide/);
  assert.ok([...app.$$("#main .pick")].find(p => /Iron Hide/.test(p.textContent)).textContent.includes("Upyr"), "the power isn't marked with its Bloodline");
  assert.deepEqual(app.errors, []);
});

test("P17 11b: Pure Blooded says it bars a Bloodline instead of showing the button", () => {
  const ch = strigoi();
  ch.progression.milestones.major = [{ id: "pure-blooded", date: "2026-10-15T00:00:00.000Z" }];
  const app = openSheet(ch, "character");
  const card = app.$('[data-powercard="cursed-evolution"]');
  assert.equal(card.querySelector("[data-gainspec]"), null);
  assert.match(card.textContent, /Pure Blooded bars it\./);
  assert.deepEqual(app.errors, []);
});

test("P17 12: the Thirst panel and the hit say which Major changed the number", () => {
  const ch = strigoi();
  const at = "2026-10-15T00:00:00.000Z";
  ch.progression.milestones.major = [{ id: "blood-feast", date: at }, { id: "reservoir", date: at }, { id: "wither-ward", date: at }, { id: "blood-alchemist", date: at }];
  const app = openSheet(ch, "main");
  assert.match(app.$("#main .main-feed").textContent, /4 SFR per HL \(Blood Feast\)/);
  assert.match(app.$("#main .main-feed").textContent, /Stored.*\(Blood Alchemist\)/);
  app.click("[data-hitopen]");
  setHitP17(app, "category", "withering");
  setHitP17(app, "damage", "7");
  assert.match(app.$(".hitresult").textContent, /Wither Ward halves it: 7 → 3\./);
  assert.match(app.$(".hitresult").textContent, /3 gets through/);
  app.click("[data-hitapply]");
  assert.equal(activeChar(app).trackers.witheringDamage, 3);
  assert.deepEqual(app.errors, []);
});

test("P17 (hostile): a script-y Splice power and Bloodline are text on Progression and the Character tab", () => {
  const ch = strigoi();
  ch.progression.milestones.major = [{ id: "splice", power: "<img src=x onerror=alert(1)>", date: "2026-10-15T00:00:00.000Z" }];
  ch.progression.specializationsGained = ["<script>alert(1)</script>"];
  for (const sec of ["progression", "character"]) {
    const app = openSheet(JSON.parse(JSON.stringify(ch)), sec);
    assert.equal(app.$$("#main img, #main script").length, 0, `${sec} rendered markup from a saved file`);
    assert.deepEqual(app.errors, []);
  }
});

// ── Holding a spell (Decision 224, W87) ───────────────────────────────
function holdingArcanist(rank = 3, ids = ["fog-shroud", "wind-walker", "blazing-fury"]) {
  const ch = lockedCharacter();
  const base = Engine.disciplineRanks(ch).find(d => d.id === "evocation").rank;
  ch.archetypeChoices.disciplines = { evocation: rank - base };
  ch.panelData.grimoire = ids.map(spellId => ({ spellId, stage: "known", notes: "" }));
  return ch;
}

test("P10 9: Hold and Let go on the Grimoire, one undo each", () => {
  const app = openSheet(holdingArcanist(3), "loadout");
  assert.equal(app.$('[data-letgo]'), null, "a Let go with nothing held");
  assert.ok(app.$('[data-hold="fog-shroud"]'), "a Concentration spell has no Hold");
  assert.equal(app.$('[data-hold="fog-shroud"]').getAttribute("aria-label"), "Hold Fog Shroud", "Hold doesn't say which spell, as Let go does");
  assert.equal(app.$('[data-hold="zap"]'), null);
  assert.ok(!/holding/i.test(app.$("#main").textContent), "the pool line shows with nothing held");
  app.click('[data-hold="fog-shroud"]');
  assert.deepEqual(activeChar(app).trackers.heldSpells, ["fog-shroud"]);
  assert.ok(app.$('[data-letgo="fog-shroud"]'), "no Let go after Hold");
  assert.equal(app.window.document.activeElement, app.$('[data-letgo="fog-shroud"]'), "focus didn't go to the row's Let go");
  assert.match(app.$("#main").textContent, /Evocation 3 · holding 1: roll 2/);
  assert.match(app.$("#undotoast").textContent, /holding Fog Shroud/);
  app.click("[data-toastundo]");
  assert.deepEqual(activeChar(app).trackers.heldSpells, [], "undo didn't take the hold back");
  app.click('[data-hold="fog-shroud"]');
  app.click('[data-letgo="fog-shroud"]');
  assert.deepEqual(activeChar(app).trackers.heldSpells, []);
  assert.equal(app.window.document.activeElement, app.$('[data-hold="fog-shroud"]'), "focus didn't go back to Hold");
  app.click("[data-toastundo]");
  assert.deepEqual(activeChar(app).trackers.heldSpells, ["fog-shroud"], "undo didn't take the Let go back");
  assert.deepEqual(app.errors, []);
});

test("P10 9b: past the cap Hold is disabled and says why, and removing a held spell asks first", () => {
  const app = openSheet(holdingArcanist(1), "loadout");
  app.click('[data-hold="fog-shroud"]');
  const second = app.$('[data-hold="wind-walker"]');
  assert.ok(second.disabled);
  assert.match(second.title, /You hold as many as your Evocation rank \(1\)/);
  const idx = activeChar(app).panelData.grimoire.findIndex(r => r.spellId === "fog-shroud");
  app.click(`[data-spellrm="${idx}"]`);
  assert.match(app.$("#modal").textContent, /You're holding it. Taking it out of the Grimoire lets it go./, "the confirm doesn't say the hold ends");
  assert.deepEqual(activeChar(app).trackers.heldSpells, ["fog-shroud"], "removed before the confirm");
  app.click("[data-askyes]");
  assert.deepEqual(activeChar(app).trackers.heldSpells, [], "the saved list kept a dead id");
  assert.deepEqual(app.errors, []);
});

test("P10 (hostile): a held id with script in it renders as nothing, and nowhere as markup", () => {
  const ch = holdingArcanist(3, ["fog-shroud"]);
  ch.trackers.heldSpells = ["<img src=x onerror=alert(1)>", "fog-shroud"];
  const app = openSheet(ch, "loadout");
  assert.equal(app.$("#main img"), null);
  assert.ok(!/img src/.test(app.$("#main").textContent), "the hostile id was shown");
  assert.ok(app.$('[data-letgo="fog-shroud"]'));
  assert.deepEqual(app.errors, []);
});
