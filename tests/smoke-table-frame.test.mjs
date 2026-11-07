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
import { Engine, GM_ON, lockedCharacter, runTable, tableHome, tableCard, packStored, type, withDownloads, edit, done, editNote, deadAirApp } from "./smokekit.mjs";

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
  // Add to goes to the encounter open, else the running one, else the newest planned (211). Dead Air has a fight
  // running, so that's where it goes; with none running it would be Docks.
  const running = app.window.eval('(S.table.encounters.find(e => e.status === "running") || { name: "Docks" }).name');
  const to = "Add to encounter: " + running;
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
    assert.equal(add[0].textContent, to);
    add[0].click();
    assert.equal(app.$(`#main [${attr}]`).textContent, to, "the press adds and the button still names where the next goes");
  }
  assert.deepEqual(app.errors, []);
});

test("258: a member's status is under their name, and the stat block is the last block before Delete", () => {
  const app = open();
  tab(app, "cast"); app.click("[data-copen]");
  edit(app);
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

test("U1: the encounter bar wraps and scrolls nothing sideways at phone width", () => {
  const app = open();
  tab(app, "encounters");
  app.click("[data-enc-open]");
  const bar = firstEl(app);
  assert.ok(bar.classList.contains("enc-bar"));
  assert.equal(bar.classList.contains("scroll-row"), false, "the bar is not a sideways scroller");
  assert.equal(bar.getAttribute("data-row"), null, "nothing hands the bar to bindScrollRows");
  for (const sel of ["[data-enc-back]", ".enc-status", "[data-enext]", "[data-enc-end]"]) assert.ok(bar.querySelector(sel), `${sel} is in the bar`);
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  const rule = css.split("}").map(r => r.trim()).filter(r => /^\.app\.table-mode \.enc-bar\s*\{/.test(r));
  assert.deepEqual(rule.filter(r => /overflow-x\s*:\s*auto|flex-wrap\s*:\s*nowrap/.test(r)), [], "no table-mode rule sets the bar to scroll sideways");
  assert.deepEqual(app.errors, []);
});


test("U1: at phone width a row scrolled to the actor clears the wrapped bar", () => {
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  const at = css.indexOf("@media (max-width:640px){\n  .enc-bar .enc-status");
  assert.ok(at >= 0, "the encounter bar's phone block exists");
  const block = css.slice(at, css.indexOf("\n}\n", at));
  const hit = block.match(/\.enc-row\{scroll-margin-top:calc\(var\(--hdr-off\) \+ ([0-9]+)px\)\}/);
  assert.ok(hit, "the phone block sets .enc-row's scroll-margin-top");
  assert.ok(Number(hit[1]) >= 113 + 8, "the margin clears the bar's two lines (113px) with room");
  assert.ok(css.includes(".tag.enc-now, .tag.enc-now:hover{color:var(--cyan)}"), "Now keeps its cyan on hover");
});

// ── Tonight (Decision 270) ─────────────────────────────────────────────────

const tnKeys = app => app.$$("#main .tn [data-tn]").map(b => b.dataset.tn);
const tnItem = (app, key) => app.$(`#main .tn [data-tn="${key}"]`);
const TABS = ["sessions", "players", "cast", "city", "threats", "encounters", "reference", "notes"];

test("U2: the strip reads the night, in order, on every tab and page, and each item goes where it says", () => {
  const app = open();
  for (const id of TABS) {
    tab(app, id);
    const region = app.$('#main [role="region"][aria-label="Tonight"]');
    assert.ok(region && region.closest(".tbl-bar"), `${id}: the strip is a region inside the bar`);
    assert.deepEqual(tnKeys(app), ["fight", "thread", "clock", "unx"], `${id}: Fight, Thread, Clock, Unexported (nobody is Down in Dead Air)`);
  }
  tab(app, "players");
  assert.equal(app.$$("#main .tn-lead").length, 1, "one lead item");
  assert.equal(app.$("#main .tn-lead"), tnItem(app, "fight"), "the lead is the first that isn't Unexported");
  assert.equal(tnItem(app, "unx").classList.contains("tn-lead"), false);
  assert.equal(tnItem(app, "fight").getAttribute("aria-label"), "Go to Reclaim drone, acting in Achterberg's clinic, moonrise");
  assert.match(tnItem(app, "fight").textContent, /Round 2 ·\s*Reclaim drone/);
  assert.match(tnItem(app, "clock").textContent, /Dex before the full moon\s*7 of 8/);
  assert.equal(tnItem(app, "unx").getAttribute("aria-label"), "Export the table");
  // Down appears when a row goes down, with no redraw: update(false) is the path a typed field takes.
  app.window.eval(`const e = Engine.runningEncounter(S.table); e.rows.filter(r => r.name === "Reclaim cleaner")[1].damage = 99; update(false)`);
  assert.deepEqual(tnKeys(app), ["fight", "down", "thread", "clock", "unx"]);
  assert.equal(tnItem(app, "down").getAttribute("aria-label"), "Go to Reclaim cleaner B, down in Achterberg's clinic, moonrise");
  assert.match(tnItem(app, "down").textContent, /Down:\s*Reclaim cleaner B/);
  app.click('#main .tn [data-tn="down"]');
  assert.equal(app.window.eval("S.tsection"), "encounters");
  assert.ok(app.doc.activeElement.matches("[data-erow]"), "focus is on a row");
  assert.match(app.doc.activeElement.textContent, /Reclaim cleaner B/, "the downed one");
  app.click("[data-enc-back]");
  tab(app, "players");
  // Fight: the running encounter, focus on Next.
  app.click('#main .tn [data-tn="fight"]');
  assert.ok(app.$(".enc-bar"), "the running encounter's page");
  assert.ok(app.doc.activeElement.matches("[data-enext]"), "focus is on Next");
  assert.equal(app.$("#main .tn"), null, "no strip on the running encounter's own page (UQ20)");
  app.click("[data-enc-back]");
  tab(app, "players");
  // Thread: Sessions, the thread's row in view with its title focused.
  app.click('#main .tn [data-tn="thread"]');
  assert.equal(app.window.eval("S.tsection"), "sessions");
  edit(app);
  assert.ok(app.doc.activeElement.matches("[data-thtitle]"), "the thread's title is focused");
  assert.match(app.doc.activeElement.value, /What spoke in the dead air/);
  tab(app, "players");
  // Clock: Next session's Close to full, that clock's + focused.
  app.click('#main .tn [data-tn="clock"]');
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.ok(app.$("[data-near-h]"), "Close to full");
  const dex = app.window.eval(`S.table.clocks.find(c => c.name === "Dex before the full moon").id`);
  assert.equal(app.doc.activeElement, app.$(`[data-cline="${dex}"] [data-clkplus]`), "that clock's + is focused");
  assert.deepEqual(app.errors, []);
});

test("U2: the strip keeps up with a clock's + and an Export, with no page redraw", () => {
  const app = open(); const downloads = withDownloads(app);
  tab(app, "sessions");
  const h1 = app.$("#main h1"), dex = app.$(".near-list [data-cline]");
  assert.match(dex.textContent, /Dex before the full moon\s*7 of 8/);
  app.click(".near-list [data-cline] [data-clkplus]");
  assert.equal(app.$("#main h1"), h1, "no redraw");
  assert.match(dex.textContent, /Full/);
  assert.match(tnItem(app, "clock").textContent, /Joss's network\s*3 of 4/, "the strip moved on to the next clock, in place");
  assert.equal(app.window.eval("S.table.audit[S.table.audit.length - 1].label"), "Dex before the full moon: 8 of 8", "Activity says it as the clock does");
  assert.equal(app.doc.activeElement, dex.querySelector("[data-clkminus]"), "+ went dead, so focus moved to −");
  app.click('#main .tn [data-tn="unx"]');
  assert.equal(downloads.length, 1, "Unexported runs Export");
  assert.equal(tnItem(app, "unx"), null, "and goes at once");
  assert.ok(app.doc.activeElement && app.doc.activeElement.closest(".tn"), "focus stays on the strip");
  assert.match(app.$("#undotoast").textContent, /Exported Dead_Air\.shadows-table\.json/);
  app.click(".near-list [data-cline] [data-clkminus]");
  assert.ok(tnItem(app, "unx"), "a change brings it back");
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  assert.equal(downloads.length, 2);
  assert.equal(tnItem(app, "unx"), null, "Export from ⋮ clears it too");
  // Typing in the open session's Hours repaints too, and keeps the caret in the field.
  app.click(".sess-open");
  const hours = app.$('[data-sf="hours"]'); hours.focus();
  type(app, '[data-sf="hours"]', "4");
  assert.ok(tnItem(app, "unx"), "typing in Hours brings Unexported back without a redraw");
  assert.equal(app.doc.activeElement, hours, "the caret stays");
  assert.deepEqual(app.errors, []);
});

test("U2: no bar on a tab with nothing running or open; a bar on a tab isn't a page", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Quiet", { stay: true });
  for (const id of TABS) { tab(app, id); assert.equal(app.$("#main .tn"), null, `${id}: no strip`); assert.equal(app.$("#main > .tbl-bar"), null, `${id}: no bar`); }
  tab(app, "sessions"); app.click("[data-snew]");
  app.click("[data-sback]");
  tab(app, "cast");
  const bar = firstEl(app);
  assert.ok(bar.classList.contains("tbl-bar") && bar.classList.contains("tn-bar"), "an open session puts a bar of its own on a tab");
  assert.equal(bar.dataset.row, undefined, "it isn't keyed as a page's scrolling row");
  assert.equal(bar.querySelector("button:not([data-tn])"), null, "and has no Back");
  assert.deepEqual(tnKeys(app), ["unx"], "a new table that has never been exported");
  assert.equal(app.$(".tn-lead"), null, "Unexported is never the lead");
});

test("U2: a table opens at the top, its heading focused", () => {
  const t = Engine.migrateTable(JSON.parse(readFileSync(new URL("../samples/dead-air.shadows-table.json", import.meta.url), "utf8")));
  const app = boot({ storage: { ...GM_ON, ["shadows.table.v1." + t.meta.id]: { table: t, section: "players", changed: "2026-10-05T10:00:00.000Z", exported: null } } });
  const calls = []; app.window.scrollTo = (...a) => calls.push(a);
  tableCard(app, "Dead Air").querySelector("[data-topen]").click();
  assert.ok(calls.some(a => a[0] === 0 && a[1] === 0), "scrolled to the top");
  assert.equal(app.doc.activeElement, app.$("#main h1"), "focus is on the heading, not an Add field");
});

test("U2: the strip shows one item and Unexported below 768px, every item from there up, and never scrolls sideways", () => {
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  assert.ok(css.includes("@media (max-width:767px){ .tn-item:not(.tn-lead):not(.tn-unx){display:none}"), "a hidden item is display:none, so it is neither focusable nor read out");
  const rule = [css.match(/\.app\.table-mode \.tn\s*\{[^}]*\}/), css.match(/\.tn-item\s*\{[^}]*\}/)];
  assert.ok(rule.every(Boolean) && rule.every(r => !/overflow-x\s*:\s*(auto|scroll)/.test(r[0])), "the strip and its items shrink and cut, they don't scroll");
  assert.ok(/\.tn-item\s*\{[^}]*overflow\s*:\s*hidden/.test(css), "items cut with an ellipsis");
  assert.ok(/\.tn-t\s*\{[^}]*text-overflow\s*:\s*ellipsis/.test(css));
});

test("U3: a tab press keeps focus on its tab, never in an Add field", () => {
  const app = deadAirApp("players");
  for (const id of ["cast", "sessions", "notes", "city", "encounters"]) {
    app.click(`[data-tsec="${id}"]`);
    assert.equal(app.doc.activeElement, app.$(`#topnav [data-tsec="${id}"]`), `${id}: focus is on the tab`);
  }
  assert.deepEqual(app.errors, []);
});
