/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: GM tables, the cast, interactions, packs and the builder.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot } from "./harness.mjs";
import { syntheticPack, PACK_ID } from "./packfixture.mjs";
import { Engine, search, clickIn, withDownloads, importFile, named, charKeys, sheetHome, tipShown, wizCss, GM_ON, tableKeys, tableCard, seedTable, type, runTable, notesTab, tableHome, tableFile, keyIn, castAdd, pick, threatsTab, tableWithPack, entryButton, packStored } from "./smokekit.mjs";

// ── Tables and the feature switch (Decisions 171, 173) ──────────────────
const tableEntryOf = (app, id) => JSON.parse(app.window.localStorage.getItem("shadows.table.v1." + id));
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
  assert.deepEqual(app.$$("#topnav .tab").map(b => b.textContent.trim()), ["Sessions", "Cast", "City", "Threats", "Encounters", "Reference", "Notes"]);
  assert.equal(app.$("#topnav [data-sec]"), null, "the table's tabs are the sheet's");
  assert.deepEqual(app.$$("#hdrmenu button").map(b => b.textContent), ["Rename", "Export .shadows-table.json", "Activity", "What's new", "Home"]);
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
const castNames = app => app.$$("[data-copen]").map(b => b.textContent);
const focusedKey = app => { const a = app.doc.activeElement; return a && [...a.attributes].map(x => x.name + "=" + x.value).filter(x => x.startsWith("data-")).join(" "); };
test("Decision 176: the Cast tab has quick-add and the filters, with Notes beside it, and Notes still works", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Cast table");
  assert.equal(app.window.eval("S.tsection"), "cast");
  assert.deepEqual(app.$$("#topnav .tab").map(b => b.textContent.trim()), ["Sessions", "Cast", "City", "Threats", "Encounters", "Reference", "Notes"]);
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
  assert.equal(app.window.eval("S.table.meta.tableSchemaVersion"), "0.16");
  assert.equal(app.window.eval("S.table.cast.length"), 0);
  assert.equal(app.$("[data-ntitle]").value, "Kept");
  app.click('[data-tsec="cast"]');
  castAdd(app, "Dez");
  const saved = tableEntryOf(app, t.meta.id).table;
  assert.equal(saved.meta.tableSchemaVersion, "0.16");
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
const tableOf = app => JSON.parse(app.window.eval("JSON.stringify(S.table)"));
// A member's lines read as sentences; one opens at a time with Edit (Decision 241), so the words are read off the drawn sentences.
// What the page draws, in the order it draws it: each line's words, read back off its sentence.
const lineWords = el => { const s = el.querySelector(".int-sentence").textContent, q = /“([^”]*)”/.exec(s); if (q) return q[1]; const i = s.indexOf(": "); return i < 0 ? "" : s.slice(i + 2); };
const intTexts = app => app.$$("[data-int]").map(lineWords);
const editLine = (app, xid) => app.click(xid ? `[data-iedit="${xid}"]` : "[data-iedit]");
const addLine = (app, text) => { type(app, "[data-iwhat]", text); keyIn(app, "[data-iwhat]", "Enter"); };
const memberWith = (app, name = "Dez") => { castAdd(app, name); openFirst(app); };

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
  assert.deepEqual(app.$$("[data-int] .int-sentence").map(s => /^Nyx learned from Dez “([a-z]+)”/.exec(s.textContent)?.[1]), ["three", "two", "one"], "crew, kind or order drawn wrong");
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
  editLine(app);
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
  editLine(app);
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
  editLine(app);
  type(app, "[data-itext]", "the warehouse is a front");
  type(app, "[data-icrew]", "Nyx");
  tableHome(app);
  tableCard(app, "Home now").querySelector("[data-topen]").click();
  openFirst(app);
  editLine(app);
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
  editLine(app, ids[1]);
  app.click(`[data-idel="${ids[1]}"]`);
  assert.ok(app.$("#modal[open]"), "Delete didn't ask");
  assert.match(app.$("#modal").textContent, /Delete this\?/);
  assert.match(app.$("#modal").textContent, /It goes from the crew's view too\./);
  app.click("#modal [data-modalclose]");
  assert.equal(app.$$("[data-int]").length, 3, "Cancel deleted");
  app.click(`[data-idel="${ids[1]}"]`); app.click("#modal [data-askyes]");
  assert.deepEqual(intTexts(app), ["c", "a"]);
  assert.equal(focusedKey(app), `data-iedit=${ids[2]}`, "focus isn't on the next line's Edit");
  editLine(app, ids[2]);
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
  assert.equal(file.meta.tableSchemaVersion, "0.16");
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
  assert.equal(app2.window.eval("S.table.meta.tableSchemaVersion"), "0.16");
  assert.equal(app2.window.eval("S.table.interactions.length"), 0);
  assert.equal(app2.$("[data-ntitle]").value, "Kept");
  app2.click('[data-tsec="cast"]');
  assert.equal(app2.window.eval("S.table.cast[0].name"), "Dez");
  assert.equal(app2.window.eval("JSON.stringify(S.table.cast[0].affiliations)"), "[]");
  assert.deepEqual(app2.errors, []);
});

// localDay is reachable in the page; the engine tests pin its values.
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
  editLine(app);
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
  editLine(app);
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
const packKeys = app => {
  const ls = app.window.localStorage, out = [];
  for (let i = 0; i < ls.length; i++) if (ls.key(i).startsWith("shadows.pack.v1.")) out.push(ls.key(i));
  return out;
};
const packCards = app => app.$$("#main .packs .roster-card");
const threatNames = app => app.$$("[data-tentry]").map(b => b.textContent);
const pickPack = async (app, obj) => {
  const input = app.$("#pack-file");
  const file = new app.window.File([JSON.stringify(obj)], "x.shadows-pack.json", { type: "application/json" });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new app.window.Event("change"));
  for (let i = 0; i < 50 && app.$("#pack-file"); i++) await new Promise(r => setTimeout(r, 10));
};
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
  assert.deepEqual(app.$$("#topnav .tab").map(b => b.textContent.trim()), ["Sessions", "Cast", "City", "Threats", "Encounters", "Reference", "Notes"]);
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
  assert.equal(Object.keys(file).sort().join(), "audit,cast,clocks,encounters,factions,interactions,meta,notes,places,sessions,threads", "the exported table carries more than a table");
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
  assert.equal(file.meta.tableSchemaVersion, "0.16");
  assert.deepEqual(file.cast[0].from, { kind: "entry", pack: PACK_ID, id: "gull", name: "Gull" });
  const json = JSON.stringify(file);
  for (const w of ["Entry 01", "Lives high", "Test Pack", "Pier Watch", "Wren", "rooftop runner", "Moss", "Quiet money"]) assert.ok(!json.includes(w), `the exported table carries pack content: ${w}`);
  assert.equal(Object.keys(file).sort().join(), "audit,cast,clocks,encounters,factions,interactions,meta,notes,places,sessions,threads");
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
  assert.equal(app.window.eval("S.table.meta.tableSchemaVersion"), "0.16");
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

// ── A line reads as a sentence (Decision 241) ──────────────────────────
const auditLen = app => app.window.eval("S.table.audit.length");

test("241: a member's page reads each line as its sentence, with their own name plain and Edit beside it", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Sentences");
  castAdd(app, "Dez"); openFirst(app);
  app.click('[data-iakind="shared"]'); type(app, "[data-iacrew]", "Nyx"); type(app, "[data-iadate]", "2026-10-08");
  addLine(app, "the warehouse is a front");
  const line = app.$("[data-int]");
  assert.match(line.textContent, /^Nyx told Dez “the warehouse is a front” on \S+/);
  assert.equal(line.querySelector("[data-copen]"), null, "Dez is a button on Dez's own page");
  assert.ok(line.querySelector("[data-iedit]"), "no Edit");
  assert.equal(line.querySelector("[data-icrew], [data-itext]"), null, "the fields are open without Edit");
  assert.deepEqual(app.errors, []);
});

test("241: the add row runs Crew, the kinds, What, When, Where, Add, in document order", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Order");
  castAdd(app, "Dez"); openFirst(app);
  const order = [...app.$(".int-add").querySelectorAll("[data-iacrew], [data-iakind], [data-iwhat], [data-iadate], [data-iawhere], [data-iadd]")]
    .map(el => el.hasAttribute("data-iacrew") ? "crew" : el.hasAttribute("data-iakind") ? "kind" : el.hasAttribute("data-iwhat") ? "what" : el.hasAttribute("data-iadate") ? "when" : el.hasAttribute("data-iawhere") ? "where" : "add");
  const squeezed = order.filter((x, i) => x !== order[i - 1]);
  assert.deepEqual(squeezed, ["crew", "kind", "what", "when", "where", "add"]);
});

test("241: Edit opens one line at a time with Crew focused; typing, then change, makes one Activity entry; Done returns to Edit", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Edits");
  castAdd(app, "Dez"); openFirst(app);
  app.click('[data-iakind="shared"]');
  addLine(app, "one"); addLine(app, "two");
  const [b, a] = app.$$("[data-int]").map(el => el.dataset.int);   // two, one
  editLine(app, b);
  assert.equal(focusedKey(app), `data-icrew=${b}`, "Edit didn't focus Crew");
  const labels = [...app.$(`[data-int="${b}"]`).querySelectorAll("label span")].map(x => x.textContent);
  assert.deepEqual(labels, ["Crew", "What", "When", "Where"]);
  const before = auditLen(app);
  type(app, `[data-icrew="${b}"]`, "Nyx");
  assert.match(app.$(`[data-isent="${b}"]`).textContent, /^Nyx told Dez “two”/, "the sentence didn't follow the field");
  assert.equal(auditLen(app), before + 1);
  pick(app, `[data-icrew="${b}"]`, "Nyx");              // blur re-sends the value: no phantom entry
  assert.equal(auditLen(app), before + 1, "change made a second entry");
  assert.equal(app.doc.activeElement, app.$(`[data-icrew="${b}"]`));
  editLine(app, a);
  assert.equal(app.$(`[data-icrew="${b}"]`), null, "a second Edit left the first open");
  assert.ok(app.$(`[data-icrew="${a}"]`));
  app.click(`[data-idone="${a}"]`);
  assert.equal(app.$(`[data-icrew="${a}"]`), null, "Done left the line open");
  assert.equal(focusedKey(app), `data-iedit=${a}`);
  assert.deepEqual(tableOf(app).interactions.map(x => x.crew.join()), ["Nyx", ""]);
  assert.deepEqual(app.errors, []);
});

test("241: the open line's fields are Crew, the kinds, What, When, Where, then Delete and Done, and a kind change keeps it open", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Open order");
  castAdd(app, "Dez"); openFirst(app);
  app.click('[data-iakind="owed"]'); type(app, "[data-iacrew]", "Nyx"); addLine(app, "for the van");
  const xid = app.$("[data-int]").dataset.int;
  editLine(app);
  const all = [...app.$(`[data-int="${xid}"]`).querySelectorAll("[data-icrew], [data-ikind], [data-itext], [data-idate], [data-iwhere], [data-idel], [data-idone]")]
    .map(el => ["icrew", "ikind", "itext", "idate", "iwhere", "idel", "idone"].find(k => el.hasAttribute("data-" + k)));
  assert.deepEqual(all.filter((x, i) => x !== all[i - 1]), ["icrew", "ikind", "itext", "idate", "iwhere", "idel", "idone"]);
  assert.match(app.$(`[data-isent="${xid}"]`).textContent, /^Dez owes Nyx on \S+: for the van/);
  app.click(`[data-ikind="${xid}|helped"]`);
  assert.ok(app.$(`[data-icrew="${xid}"]`), "a kind change closed the line");
  assert.match(app.$(`[data-isent="${xid}"]`).textContent, /^Nyx helped Dez on \S+: for the van/);
});
