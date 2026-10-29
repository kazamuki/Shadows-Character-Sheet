/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: an encounter's plan, its clocks, its opening and Delay
 * (Decisions 252–253, S10f). Every test reads what the page draws; S.table is
 * read only to say what was stored.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot } from "./harness.mjs";
import { Engine, GM_ON, type, runTable } from "./smokekit.mjs";

const book = readFileSync(new URL("../private/crb/2642_Encounter_Design_Worksheet.md", import.meta.url), "utf8");
const encTab = app => app.click('[data-tsec="encounters"]');
const both = (app, sel, value) => {
  const el = app.$(sel); el.value = value;
  el.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  el.dispatchEvent(new app.window.Event("change", { bubbles: true }));
};
const submit = (app, sel) => app.$(sel).dispatchEvent(new app.window.Event("submit", { bubbles: true, cancelable: true }));
const rowByName = (app, name) => app.$$("[data-erow]").find(li => li.querySelector(".enc-name").textContent === name);
const rid = (app, name) => rowByName(app, name).dataset.erow;
const addPc = (app, name) => { type(app, "[data-enc-pcname]", name); app.click("[data-enc-addpc]"); };
const hideToast = app => app.window.eval("hideUndoToast()");
const labels = app => JSON.parse(app.window.eval("JSON.stringify(S.table.audit.map(e => e.label))"));
const enc = app => JSON.parse(app.window.eval("JSON.stringify(S.table.encounters[0])"));
const activeName = app => { const li = app.$(".enc-row.active"); return li && li.querySelector(".enc-name").textContent; };
const focusedAttr = app => { const a = app.doc.activeElement; return a && [...a.attributes].map(x => x.name + "=" + x.value).filter(x => x.startsWith("data-")).join(" "); };
const pressed = (app, attr) => app.$$(`[${attr}]`).filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.getAttribute(attr));

function encApp(name = "Warehouse") {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  encTab(app);
  type(app, "[data-enc-name]", name); app.click("[data-enc-new]");
  return app;
}
/** The crew (A 12, B 9, C 7) and the other side (X 10, Y 8) in a planned encounter. */
function fightApp() {
  const app = encApp();
  for (const n of ["A", "B", "C", "X", "Y"]) addPc(app, n);
  app.window.eval(`(function(){ const e = S.table.encounters[0], o = e.sides[1].id, rows = e.rows;
    const set = { A:[12,"crew"], B:[9,"crew"], C:[7,"crew"], X:[10,o], Y:[8,o] };
    for (const r of rows) Engine.editParticipant(S.table, e.id, r.id, { order: set[r.name][0], side: set[r.name][1] });
    renderTable(); })()`);
  return app;
}

test("252: the plan is the worksheet: its headings, labels and lists are the book's, and the fields type and keep", () => {
  const app = encApp();
  const heads = app.$$(".enc-plan h3").map(h => h.textContent);
  for (const h of heads) assert.ok(book.includes(h.replace(/ & /g, " & ")) || book.includes(h), `"${h}" isn't a heading of the worksheet`);
  assert.equal(heads.length, 9, "all nine headings; the Type box under Encounter Basics is left out (188)");
  const labelsShown = app.$$(".enc-plan .field > span").map(s => s.textContent);
  for (const l of labelsShown) assert.ok(book.includes(l), `"${l}" isn't a label of the worksheet`);
  for (const t of [...app.$$(".enc-plan .enc-prompts li")].map(li => li.textContent)) assert.ok(book.includes(t), `"${t}" isn't printed in the worksheet`);
  assert.equal(app.$$(".enc-plan ul.enc-prompts li").length, 9, "four exits and five stalls");
  assert.equal(app.$$(".enc-plan ol.enc-prompts li").length, 3, "three questions");
  assert.equal(app.$$("[data-eobj]").length, 6);
  // The outline: h2 The plan, then h3 sections, never an h4 straight under an h2.
  const levels = app.$$("#main h1, #main h2, #main h3, #main h4").map(h => +h.tagName[1]);
  for (let i = 1; i < levels.length; i++) assert.ok(levels[i] - levels[i - 1] <= 1, `the outline skips from h${levels[i - 1]} to h${levels[i]}`);
  assert.equal(app.$$("#main select").length, 0, "no select anywhere on the page: nothing there writes on a keystroke");
  // Typing: one Activity entry, no toast, and the page isn't redrawn.
  hideToast(app);
  const n0 = labels(app).length;
  const box = app.$('[data-eplan="hook"]');
  type(app, '[data-eplan="hook"]', "Rook's buyer");
  type(app, '[data-eplan="hook"]', "Rook's buyer wants the drive back");
  box.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(app.$('[data-eplan="hook"]'), box, "typing didn't redraw");
  assert.equal(enc(app).design.hook, "Rook's buyer wants the drive back");
  assert.deepEqual(labels(app).slice(n0), ["Changed Warehouse"], "one entry for the whole burst");
  assert.equal(app.$("#undotoast") &&!app.$("#undotoast").hidden, false, "no toast while typing");
  // Adversaries: Add lands on the new NPC/Enemy; Remove follows the typed name.
  app.click("[data-eadvadd]");
  assert.equal(focusedAttr(app), "data-eadv=0|who");
  assert.equal(app.$("[data-eadvrm]").getAttribute("aria-label"), "Remove adversary 1");
  both(app, '[data-eadv="0|who"]', "Rook");
  assert.equal(app.$("[data-eadvrm]").getAttribute("aria-label"), "Remove Rook");
  both(app, '[data-eadv="0|goals"]', "The drive");
  app.click("[data-eadvadd]");
  assert.equal(focusedAttr(app), "data-eadv=1|who");
  assert.deepEqual(enc(app).design.adversaries.map(a => [a.who, a.goals]), [["Rook", "The drive"], ["", ""]]);
  app.click('[data-eadvrm="0"]');
  assert.equal(focusedAttr(app), "data-eadv=0|who", "focus lands on the next NPC/Enemy");
  app.click('[data-eadvrm="0"]');
  assert.equal(focusedAttr(app), "data-eadvadd=", "with none left, on Add an adversary");
  // The objectives toggle in place.
  app.click('[data-eobj="protect"]'); app.click('[data-eobj="escape"]');
  assert.deepEqual(pressed(app, "data-eobj"), ["protect", "escape"]);
  assert.deepEqual(enc(app).design.beyond, ["protect", "escape"]);
  app.click('[data-eobj="protect"]');
  assert.deepEqual(pressed(app, "data-eobj"), ["escape"]);
  assert.deepEqual(app.errors, []);
});

test("252: an encounter's clocks: add, +, −, edit, delete, and read-only once it ends", () => {
  const app = fightApp();
  assert.match(app.$$("#main h2").map(h => h.textContent).join("|"), /Clocks/);
  app.click("[data-clkadd]");
  both(app, '[data-kf="name"]', "Alarm");
  app.click("[data-clkplus]"); app.click("[data-clkplus]");
  assert.equal(app.$(".clock-count").textContent, "2 of 4");
  app.click("[data-clkminus]");
  assert.equal(app.$(".clock-count").textContent, "1 of 4");
  assert.equal(app.window.eval("S.table.clocks[0].on.kind"), "encounter");
  app.click("[data-clkdone]");
  app.click("[data-clkadd]");
  assert.equal(app.$$("[data-clock]").length, 2);
  app.click("[data-clkdel]");
  assert.equal(app.$$("[data-clock]").length, 1);
  // Start it, then End: the clocks are text.
  app.click("[data-enc-start]");
  assert.ok(app.$("[data-clkadd]"), "a running encounter's clocks are live");
  app.click("[data-enc-end]");
  app.click("[data-ew-end]");
  app.click('[data-enc-open]');
  assert.equal(app.$("[data-clkadd]"), null);
  assert.equal(app.$("[data-clkplus]"), null);
  assert.equal(app.$("[data-clkedit]"), null);
  assert.match(app.$("[data-clock]").textContent, /Alarm/);
  assert.match(app.$(".clock-count").textContent, /1 of 4/);
  assert.deepEqual(app.errors, []);
});

test("252: deleting an encounter asks with its clock count, and Undo from Activity restores both", () => {
  const app = encApp("Dock fight");
  app.click("[data-clkadd]"); both(app, '[data-kf="name"]', "Alarm"); app.click("[data-clkdone]");
  app.window.eval("rebaseTable()");
  app.click("[data-enc-del]");
  assert.match(app.$("#modal").textContent, /Delete Dock fight\?/);
  assert.match(app.$("#modal").textContent, /It and its 1 clock aren't kept anywhere else unless you've exported the table\./);
  app.click("#modal [data-askyes]");
  assert.equal(app.window.eval("S.table.encounters.length + S.table.clocks.length"), 0);
  assert.match(app.$("#undotoast").textContent, /Removed Dock fight/);
  app.click("#undotoast [data-toastundo]");
  assert.equal(app.window.eval("S.table.encounters.length + ':' + S.table.clocks.length"), "1:1");
  // With no clocks it asks as before.
  app.window.eval("S.table.clocks = []; S.encOpen = S.table.encounters[0].id; renderTable()");
  app.click("[data-enc-del]");
  assert.match(app.$("#modal").textContent, /It isn't kept anywhere else unless you've exported the table\./);
  app.click("#modal [data-modalclose]");
  assert.deepEqual(app.errors, []);
});

test("252: Find opens an encounter's clock on its name, and an encounter by its plan", () => {
  const app = encApp("Dock fight");
  both(app, '[data-eplan="hook"]', "the buyer wants the drive");
  app.click("[data-clkadd]"); both(app, '[data-kf="name"]', "Alarm"); app.click("[data-clkdone]");
  app.click('[data-tsec="notes"]');
  app.click("[data-tfind]");
  type(app, "[data-findq]", "alarm");
  assert.equal(app.$$("#modal [data-fkind=clock]").length, 1);
  app.click("#modal [data-fkind=clock]");
  assert.equal(app.$("[data-tsec=encounters]").getAttribute("aria-selected") === "true" || app.$("[data-tsec=encounters][aria-current]") !== null || !!app.$("[data-enc-title]"), true);
  assert.equal(app.doc.activeElement.textContent, "Alarm", "focus lands on the clock's name");
  app.click('[data-tsec="notes"]');
  app.click("[data-tfind]");
  type(app, "[data-findq]", "buyer");
  assert.equal(app.$$("#modal [data-fkind=encounter]").length, 1);
  assert.match(app.$("#modal [data-fkind=encounter]").textContent, /Hook/);
  assert.deepEqual(app.errors, []);
});

test("252: the encounter card counts its clocks and leaves out an empty part", () => {
  const app = encApp("Dock fight");
  app.click("[data-clkadd]"); both(app, '[data-kf="name"]', "Alarm"); app.click("[data-clkdone]");
  app.click("[data-enc-back]");
  assert.equal(app.$(".roster-meta").textContent, "Nobody yet · 1 clock");
  app.click("[data-enc-open]");
  app.click("[data-clkedit]");
  app.click("[data-clkdel]");
  app.click("[data-enc-back]");
  assert.equal(app.$(".roster-meta").textContent, "Nobody yet", "no clocks, no part");
  assert.ok(!/·\s*·/.test(app.$(".roster-meta").textContent));
});

test("253: an Ambush by the crew: Start, then Next passes the other side in round 1", () => {
  const app = fightApp();
  assert.deepEqual(pressed(app, "data-eopen-kind"), ["none"]);
  assert.equal(app.$("[data-eopen-side]"), null, "no side until there is an opening");
  app.click('[data-eopen-kind="ambush"]');
  assert.deepEqual(pressed(app, "data-eopen-kind"), ["ambush"]);
  assert.deepEqual(pressed(app, "data-eopen-side"), ["crew"]);
  assert.equal(focusedAttr(app), "data-eopen-kind=ambush");
  assert.equal(labels(app).at(-1), "Changed Warehouse");
  app.click("[data-enc-start]");
  assert.equal(activeName(app), "A");
  assert.match(rowByName(app, "A").textContent, /\+3 on their first attack roll/);
  assert.match(rowByName(app, "X").textContent, /Ambushed: no turn, can.t defend, hit at Difficulty 10/);
  assert.ok(app.$("[data-eopening]"), "the controls stay until someone has acted");
  app.click("[data-enext]");
  assert.equal(app.$("[data-eopening]"), null, "the controls are gone after the first Next");
  assert.match(app.$(".enc-status").textContent, /Round 1 · Ambush by The crew/);
  assert.equal(activeName(app), "B");
  app.click("[data-enext]"); app.click("[data-enext]");
  assert.ok(app.$("[data-efinish]"), "both defenders passed: straight to Reset");
  app.click("[data-efinish]");
  assert.equal(app.$$(".enc-open-tag").length, 0, "round 2 has no tags");
  assert.doesNotMatch(app.$(".enc-status").textContent, /Ambush/);
  assert.equal(activeName(app), "A");
  app.click("[data-enext]");
  assert.equal(activeName(app), "X", "round 2 runs the defenders");
  assert.deepEqual(app.errors, []);
});

test("253: a Surprise tags the rows and passes nobody; the opening's side is a toggle too", () => {
  const app = fightApp();
  app.click('[data-eopen-kind="surprise"]');
  const other = app.$$("[data-eopen-side]").find(b => b.textContent === "The other side");
  app.click(`[data-eopen-side="${other.dataset.eopenSide}"]`);
  assert.deepEqual(pressed(app, "data-eopen-side"), [other.dataset.eopenSide]);
  assert.equal(app.window.eval("S.table.encounters[0].opening.kind"), "surprise");
  app.click("[data-enc-start]");
  assert.equal(activeName(app), "A");
  assert.match(rowByName(app, "X").textContent, /\+1 on their first attack roll/);
  assert.match(rowByName(app, "A").textContent, /Surprised: Fast Actions only/);
  app.click("[data-enext]");
  assert.equal(activeName(app), "X", "nobody is passed");
  assert.deepEqual(app.errors, []);
});

test("253: Delay on the active row, then Act now, and a missed delay at Reset", () => {
  const app = fightApp();
  app.click("[data-enc-start]");
  assert.equal(activeName(app), "A");
  assert.equal(app.$$("[data-edelay-open]").length, 1, "Delay is on the active row alone");
  app.click("[data-edelay-open]");
  assert.equal(focusedAttr(app), "data-edelay-until=");
  type(app, "[data-edelay-until]", "goes for the alarm");
  submit(app, "[data-edelayform]");
  assert.equal(activeName(app), "X", "the turn moved on");
  assert.match(rowByName(app, "A").textContent, /Waiting: goes for the alarm/);
  const actNow = app.$(`[data-eacnow="${rid(app, "A")}"]`);
  assert.ok(actNow);
  assert.equal(labels(app).at(-1), "Changed Warehouse");
  app.click(`[data-eacnow="${rid(app, "A")}"]`);
  assert.equal(activeName(app), "A");
  assert.doesNotMatch(rowByName(app, "A").textContent, /Waiting/);
  assert.equal(app.doc.activeElement, rowByName(app, "A"), "focus lands on that row");
  app.click("[data-enext]");
  assert.equal(activeName(app), "X", "Next carries on from the first row that hasn't acted");
  // A second delay never comes: Reset lists it.
  app.click("[data-enext]"); app.click("[data-edelay-open]");
  type(app, "[data-edelay-until]", "the door opens"); submit(app, "[data-edelayform]");
  app.click("[data-enext]"); app.click("[data-enext]");
  assert.match(app.$(".enc-reset").textContent, /Waited for “the door opens”. It never came: no action this round./);
  assert.doesNotMatch(app.$(".enc-reset").textContent, /Nothing on:.*\bB\b/, "the row isn't called quiet");
  app.click("[data-efinish]");
  assert.deepEqual(enc(app).rows.map(r => r.delay), [null, null, null, null, null]);
  assert.deepEqual(app.errors, []);
});

test("252: a faction's clocks behave as before (a place's are S12b's smoke tests)", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Factions");
  app.click('[data-tsec="city"]');
  app.click('[data-cityview="factions"]');
  type(app, "[data-fadd-name]", "The Vipers");
  app.$("[data-fadd-name]").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  app.click("[data-fcardopen]");
  app.click("[data-clkadd]");
  both(app, '[data-kf="name"]', "Heat");
  app.click("[data-clkplus]");
  assert.equal(app.$(".clock-count").textContent, "1 of 4");
  app.click("[data-clkdone]");
  assert.ok(app.$("[data-clkedit]"));
  assert.equal(app.window.eval("S.table.clocks[0].on.kind"), "faction");
  assert.deepEqual(app.errors, []);
});

test("253: a delayed row that goes Out has no Act now", () => {
  const app = fightApp();
  app.click("[data-enc-start]");
  app.click("[data-edelay-open]");
  type(app, "[data-edelay-until]", "door"); submit(app, "[data-edelayform]");
  const id = rid(app, "A");
  assert.ok(app.$(`[data-eacnow="${id}"]`));
  app.window.eval(`Engine.editParticipant(S.table, S.table.encounters[0].id, "${id}", { out: true }); renderTable()`);
  assert.equal(app.$(`[data-eacnow="${id}"]`), null);
  assert.match(rowByName(app, "A").textContent, /Waiting: door/);
  assert.deepEqual(app.errors, []);
});
