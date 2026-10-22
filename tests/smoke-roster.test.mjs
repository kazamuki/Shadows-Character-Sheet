/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: What's new and the roster.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot, stored } from "./harness.mjs";
import { Engine, D, lockedCharacter, openSheet, activeChar, draft, withDownloads, importFile, named, charKeys, card, sheetHome, draftOn, pick } from "./smokekit.mjs";

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
    for (const r of o.starterPower.rows || []) for (const v of Object.values(r).filter(x => typeof x === "string")) assert.ok(text.includes(v), `${o.starterPower.name}'s row "${v}" isn't ${where}`);
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
// ── The roster (R10, Decision 141): one entry per TAG ────────────────────
const entryOf = (app, id) => JSON.parse(app.window.localStorage.getItem("shadows.char.v1." + id));
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

test("P9b 12: a part-used magazine prints its rounds", () => {
  const ch = lockedCharacter();
  ch.gear.push({ id: "rifle-rounds", qty: 1, roundsLeft: 18, notes: "" }, { id: "power-cell", qty: 1, roundsLeft: 15, notes: "" });
  const app = openSheet(ch, "main");
  app.window.print = () => {};
  app.click("[data-menu-toggle]"); app.click("[data-print]");
  const p = app.$("#printSheet").textContent;
  assert.match(p, /18 rounds left/, "the gear row doesn't print its rounds");
  assert.match(p, /15 shots left/, "a Power Cell doesn't print its shots");
  assert.deepEqual(app.errors, []);
});
