/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: a GM table's frame (Decision 258): the class that gives it its own layout, the bar each page's Back sits in,
 * and a member's status. jsdom has no layout, so the geometry (the measures, the sheet's width, the pinned stat
 * block) is held by `npm run phone-check` against `tools/frame-fixture.json`; what's here is the structure that
 * geometry hangs on.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot } from "./harness.mjs";
import { Engine, GM_ON, lockedCharacter, runTable, tableHome, tableCard, packStored, type } from "./smokekit.mjs";

const cls = app => [...app.$("#app").classList].filter(c => c === "table-mode" || c === "sheet-mode").sort().join(" ");

test("258: a table's frame is table-mode, and Home, the wizard and the sheet aren't", () => {
  const app = boot({ storage: { ...GM_ON, "shadows.active.v1": { ch: lockedCharacter(), section: "main" } } });
  assert.equal(cls(app), "", "Home has neither class");
  runTable(app, "Frame", { stay: true });
  assert.equal(cls(app), "table-mode", "a table is table-mode, and not the sheet's");
  tableHome(app);
  assert.equal(cls(app), "", "Home after a table has neither class");
  app.click("[data-open]");
  assert.equal(cls(app), "sheet-mode", "a character's sheet is sheet-mode only");
  app.click("[data-menu-toggle]"); app.click("[data-home]");
  app.click("#btn-new");
  assert.equal(cls(app), "", "the wizard has neither class");
  app.click("header [data-home]");
  tableCard(app, "Frame").querySelector("[data-topen]").click();
  assert.equal(cls(app), "table-mode", "a table opened from Home is table-mode again");
});

// ── The bar (Decision 258) ───────────────────────────────────────────────

const dez = () => {
  const ch = lockedCharacter();
  ch.identity.name = "Dez"; ch.meta.id = "TAG-EEEE-EEEE-EEEE"; ch.meta.updated = "2026-10-02T10:00:00.000Z";
  return ch;
};
/** Dead Air (the sample), with a player and a seat, and a pack in the Threats tab: every page that has a Back. */
function open() {
  const t = Engine.migrateTable(JSON.parse(readFileSync(new URL("../samples/dead-air.shadows-table.json", import.meta.url), "utf8")));
  const pid = Engine.addPlayer(t, { name: "Brogan" }).id;
  assert.ok(Engine.importSeat(t, pid, dez()).ok);
  t.audit = [];
  const app = boot({ storage: { ...GM_ON, ...packStored(),
    ["shadows.table.v1." + t.meta.id]: { table: t, section: "sessions", changed: "2026-10-05T10:00:00.000Z", exported: null } } });
  tableCard(app, "Dead Air").querySelector("[data-topen]").click();
  return app;
}
const tab = (app, id) => app.click(`[data-tsec="${id}"]`);
const main = app => app.$("#main");
const firstEl = app => main(app).firstElementChild;
/** The Back, found the way every handler finds it: by its attribute. */
const backs = (app, attr) => app.$$(`#main [${attr}]`);

// Each page with a Back: how to reach it, the Back's attribute, the button that opened it (focus returns there).
const PAGES = [
  ["a session", app => { tab(app, "sessions"); app.click("[data-sopen]"); }, "data-sback", "[data-sopen]"],
  ["the close-out", app => { tab(app, "sessions");
    for (const b of app.$$("[data-sopen]")) { b.click(); if (app.$("[data-co-open]")) break; app.click("[data-sback]"); }
    app.click("[data-co-open]"); }, "data-co-back", null],
  ["a seat's page", app => { tab(app, "players"); app.click("[data-seat]"); app.click("[data-roseat]"); }, "data-seatback", null],
  ["the read-only sheet", app => { tab(app, "players"); app.click("[data-seat]"); }, "data-seatback", "[data-seat]"],
  ["a cast member", app => { tab(app, "cast"); app.click("[data-copen]"); }, "data-cback", "[data-copen]"],
  ["a place", app => { tab(app, "city"); app.click("[data-popen]"); }, "data-pback", "[data-popen]"],
  ["a faction", app => { tab(app, "city"); app.click('[data-cityview="factions"]'); app.click("[data-fcardopen]"); }, "data-fback", "[data-fcardopen]"],
  ["a Threats entry", app => { tab(app, "threats"); app.click("[data-tentry]"); }, "data-tback", "[data-tentry]"],
  ["a Threats group", app => { tab(app, "threats"); app.click('[data-tview="group"]'); app.click("[data-tgroup]"); }, "data-tback", "[data-tgroup]"],
];

test("258: each page's Back is in a bar that is the page's first element, and lands where it did", () => {
  for (const [name, go, attr, opener] of PAGES) {
    const app = open();
    go(app);
    const found = backs(app, attr);
    assert.equal(found.length, 1, `${name}: one Back, moved and not copied`);
    const bar = firstEl(app);
    assert.ok(bar.classList.contains("tbl-bar"), `${name}: the page's first element is the bar`);
    assert.ok(bar.contains(found[0]), `${name}: the Back is in the bar`);
    found[0].click();
    assert.equal(backs(app, attr).length, 0, `${name}: Back left the page`);
    if (opener) assert.ok(app.doc.activeElement && app.doc.activeElement.matches(opener), `${name}: focus returns to ${opener}, not ${app.doc.activeElement && app.doc.activeElement.outerHTML.slice(0, 60)}`);
    assert.deepEqual(app.errors, [], name);
  }
});

test("258: an encounter's Back is the first button of its status bar, the page's first element", () => {
  const app = open();
  tab(app, "encounters");
  type(app, "[data-enc-name]", "Docks"); app.click("[data-enc-new]");
  const found = backs(app, "data-enc-back");
  assert.equal(found.length, 1);
  const bar = firstEl(app);
  assert.ok(bar.classList.contains("enc-bar"), "the bar is first");
  assert.equal(bar.querySelector("button"), found[0], "Back is its first button");
  assert.ok(bar.querySelector(".enc-status"), "the status follows it");
  assert.equal(bar.querySelector("[data-eby]"), null, "the Turns group stays outside the bar");
  found[0].click();
  assert.equal(backs(app, "data-enc-back").length, 0);
  assert.ok(app.doc.activeElement.matches("[data-enc-open]"), "focus returns to the encounter's card");
});

test("258: a member's, an entry's and a group's Add to sit in the bar beside Back", () => {
  const app = open();
  tab(app, "encounters");
  type(app, "[data-enc-name]", "Docks"); app.click("[data-enc-new]");
  app.click("[data-enc-back]");
  for (const [go, attr] of [
    [() => { tab(app, "cast"); app.click("[data-copen]"); }, "data-cenc"],
    [() => { tab(app, "threats"); app.click("[data-tentry]"); }, "data-tenc"],
    [() => { tab(app, "threats"); app.click('[data-tview="group"]'); app.click("[data-tgroup]"); }, "data-tgrpenc"],
  ]) {
    go();
    const add = app.$$(`#main [${attr}]`);
    assert.equal(add.length, 1, `${attr}: one Add to`);
    assert.ok(firstEl(app).contains(add[0]), `${attr}: it is in the bar`);
    assert.ok(firstEl(app).querySelector("[data-cback], [data-tback]"), "beside Back");
    assert.match(add[0].textContent, /^Add to Docks$/);
    add[0].click();
    assert.match(app.$(`#main [${attr}]`).textContent, /^Add to Docks$/, "the press adds and the button still names where the next goes");
  }
  assert.deepEqual(app.errors, []);
});

test("258: a member's status is under their name, and the stat block is the last block before Delete", () => {
  const app = open();
  tab(app, "cast"); app.click("[data-copen]");
  const h1 = app.$("#main [data-ctitle]");
  const status = h1.nextElementSibling;
  assert.ok(status.matches("label.cast-status") && status.querySelector('select[data-cf="status"]'), "the status field follows the name");
  assert.equal(app.$$('#main [data-cf="status"]').length, 1, "one Status, moved and not copied");
  assert.equal(app.$(".cast-codex [data-cf=\"status\"]"), null, "it has left the Codex fields");
  const panel = app.$("#main .cast-panel");
  assert.ok(panel.querySelector("[data-cstat]"), "the stat block is in the panel");
  assert.ok(panel.parentElement.nextElementSibling.matches(".cast-delete"), "the panel is the page's last block, before Delete, at every width");
  assert.ok(panel.compareDocumentPosition(app.$("#main .cast-col")) & 2, "and it follows the content column in the DOM");
  assert.deepEqual(app.errors, []);
});

test("258: a bar's scroll place belongs to its page, not to the next one opened", () => {
  const app = open();
  tab(app, "cast");
  const ids = app.$$("[data-copen]").slice(0, 2).map(b => b.dataset.copen);
  app.click(`[data-copen="${ids[0]}"]`);
  const bar = app.$("#main .tbl-bar");
  bar.scrollLeft = 39;
  bar.dispatchEvent(new app.window.Event("scroll"));
  app.click("[data-cback]");
  app.click(`[data-copen="${ids[1]}"]`);
  assert.equal(app.$("#main .tbl-bar").scrollLeft, 0, "the second member's bar opens at the start");
  assert.notEqual(app.$("#main .tbl-bar").dataset.row, bar.dataset.row, "each page keys its own row");
});
