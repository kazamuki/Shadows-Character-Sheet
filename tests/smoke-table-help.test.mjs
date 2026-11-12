/**
 * S31 (Decision 278): Help on every table page. A ? in the header and the ? key open a panel for the page that's
 * open, from the data's gmGuide; each section's list carries a guide line; the empty states teach.
 *
 * jsdom has no layout, so what these pin is the panel's state, focus, text and classes. The widths are the harness's
 * `matchMedia` (boot's `width`): the CSS that does the pushing is phone-check's (Chromium).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot } from "./harness.mjs";
import { GM_ON, runTable, Engine, D } from "./smokekit.mjs";
import { syntheticPack, PACK_ID } from "./packfixture.mjs";

const G = D.gmGuide;
const dead = () => Engine.migrateTable(JSON.parse(readFileSync(new URL("../samples/dead-air.shadows-table.json", import.meta.url), "utf8")));
const GMHELP = "shadows.ui.gmHelp", GMGUIDE = "shadows.ui.gmGuide";
/** Dead Air on `section` at `width`; `extra` is more storage (a preference, a pack). */
function helpApp(section = "sessions", { width = 1024, extra = {} } = {}) {   // eslint-disable-line
  const t = dead();
  const app = boot({ width, storage: { ...GM_ON, ["shadows.table.v1." + t.meta.id]: { table: t, section, changed: "2026-10-05T10:00:00.000Z", exported: null }, ...extra } });
  app.click("[data-topen]");
  return app;
}
/** A new, empty table, left on Sessions. */
function emptyApp({ width = 1024, extra = {} } = {}) {
  const app = boot({ width, storage: { ...GM_ON, ...extra } });
  runTable(app, "Blank", { stay: true });
  return app;
}
// What a data string says on screen: **bold** and `code` lose their marks.
const said = s => s.replace(/\*\*/g, "").replace(/`/g, "");
const tabNow = app => app.$("#topnav [aria-current=page]").getAttribute("data-tsec");
const panel = app => app.$("#ghelp");
const shown = app => !!panel(app) && !panel(app).hasAttribute("inert") && panel(app).getAttribute("aria-hidden") === "false";
const heading = app => panel(app).querySelector("h2").textContent;
const press = (app, key, init = {}, target) => {
  const t = target || app.doc.body;
  if (t !== app.doc.body) t.focus(); else { const a = app.doc.activeElement; if (a && a !== app.doc.body) a.blur(); }
  const ev = new app.window.KeyboardEvent("keydown", Object.assign({ key, bubbles: true, cancelable: true }, init));
  return { prevented: !t.dispatchEvent(ev) };
};
const questionMark = (app, target) => press(app, "?", { shiftKey: true, code: "Slash" }, target);
const digit = (app, n) => press(app, String(n), { code: "Digit" + n });
const pressEsc = app => (app.doc.activeElement || app.doc).dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
const ls = (app, k) => app.window.localStorage.getItem(k);
const ctxNow = app => app.window.eval("helpContext()");

test("S31: ? opens Help for the open section, and closing it gives focus back", () => {
  const app = helpApp("sessions");
  const btn = app.$("[data-thelp]");
  assert.ok(btn, "no Help button in the header");
  assert.equal(btn.getAttribute("aria-label"), "Help");
  assert.equal(btn.getAttribute("aria-expanded"), "false");
  const order = app.$$("#hdractions > button").map(b => b.getAttribute("data-tfind") != null ? "find" : b.getAttribute("data-tjot") != null ? "jot" : b.hasAttribute("data-thelp") ? "help" : "menu");
  assert.deepEqual(order, ["find", "jot", "help", "menu"], "Help sits between Jot and the menu");
  assert.equal(shown(app), false);
  btn.focus();
  app.click("[data-thelp]");
  assert.equal(shown(app), true);
  assert.equal(heading(app), "Sessions");
  assert.equal(app.$("[data-thelp]").getAttribute("aria-expanded"), "true");
  assert.equal(app.doc.activeElement, panel(app).querySelector("[data-help-close]"), "focus didn't go to Close");
  const text = panel(app).textContent;
  for (const id of ["thread", "closeToFull"]) {
    assert.ok(text.includes(G.words[id].term), id + "'s term isn't in the panel");
    assert.ok(text.includes(said(G.words[id].text)), id + "'s text isn't in the panel");
  }
  pressEsc(app);
  assert.equal(shown(app), false, "Esc left it open");
  assert.ok(panel(app).hasAttribute("inert"));
  assert.equal(app.doc.activeElement, app.$("[data-thelp]"), "focus didn't return to the ? button");
  assert.equal(app.$("[data-thelp]").getAttribute("aria-expanded"), "false");
  assert.deepEqual(app.errors, []);
});

test("S31: Help follows the page it's on", () => {
  const app = helpApp("cast", { width: 1280 });
  app.click("[data-thelp]");
  assert.equal(shown(app), true);
  assert.equal(heading(app), "Cast");
  const ibarra = app.$$("[data-copen]").find(b => /Ibarra/.test(b.textContent));
  assert.ok(ibarra, "Ibarra isn't on Dead Air's cast");
  app.click(`[data-copen="${ibarra.getAttribute("data-copen")}"]`);
  assert.equal(shown(app), true, "pinned, opening a page closed it");
  assert.equal(heading(app), "A cast member");
  assert.ok(panel(app).textContent.includes("Key to"));
  digit(app, 4);
  assert.equal(tabNow(app), "city");
  assert.equal(shown(app), true);
  assert.equal(heading(app), "City");
  digit(app, 3);
  app.click('[data-cview="crew"]');
  assert.equal(heading(app), "Who knows what");
  assert.equal(ctxNow(app), "whoKnows");
  // A running encounter, through the strip.
  app.click('[data-tn="fight"]');
  assert.equal(tabNow(app), "encounters");
  assert.equal(heading(app), "A running encounter");
  assert.equal(ctxNow(app), "encounterRunning");
  // Below 1280 the same panel is a flyout, and a move to another page closes it.
  const narrow = helpApp("sessions", { width: 1024 });
  narrow.click("[data-thelp]");
  assert.equal(shown(narrow), true);
  narrow.click('[data-tsec="cast"]');
  assert.equal(shown(narrow), false, "a tab press left the flyout open");
  assert.equal(tabNow(narrow), "cast");
  assert.deepEqual(app.errors.concat(narrow.errors), []);
});

test("S31: every page a table shows has help, and every word it names is defined once", () => {
  const sections = app => app.window.eval("TABLE_SECTIONS.map(s=>s.id)");
  const seen = new Set();
  const check = (app, want, why) => {
    const id = ctxNow(app);
    assert.ok(G.contexts[id], `${why}: helpContext() returned "${id}", not a key of gmGuide.contexts`);
    if (want) assert.equal(id, want, why);
    seen.add(id);
    for (const w of G.contexts[id].words) assert.ok(G.words[w], `${id} names an undefined word "${w}"`);
  };
  const t = dead();
  const app = helpApp("sessions", { extra: { ["shadows.pack.v1." + PACK_ID]: { pack: syntheticPack() } } });
  for (const id of sections(app)) {
    app.click(`[data-tsec="${id}"]`);
    check(app, id, "section " + id);
    assert.equal(G.contexts[id].section, id);
    assert.ok(G.contexts[id].intro, id + " has no guide line");
  }
  // A session, its close-out, a closed session's page.
  app.click('[data-tsec="sessions"]');
  app.click(`[data-sopen="${t.sessions[t.sessions.length - 1].id}"]`);
  check(app, "session", "an open session's page");
  app.click("[data-co-open]");
  check(app, "closeout", "a close-out's sheet");
  // The page after a close-out is written: a closed session, with S.coEnd on it.
  const closed = t.sessions[0];
  app.click('[data-tsec="sessions"]');
  app.window.eval(`S.closeOut=null; S.coEnd="${closed.id}"; S.sessOpen="${closed.id}"; update()`);
  check(app, "closeout", "a close-out's end page");
  // Players: the list, a player, a seat's character sheet.
  app.click('[data-tsec="players"]');
  check(app, "players", "players");
  const seat = app.$("[data-seat]");
  assert.ok(seat, "no seat on Players");
  app.click(`[data-seat="${seat.getAttribute("data-seat")}"]`);
  check(app, null, "a player's seat");
  assert.ok(["players", "character"].includes(ctxNow(app)), "a seat is the players' list or a character's sheet");
  if (!seen.has("character")) { app.window.eval(`S.seatSheet="main"; update()`); check(app, "character", "a character's sheet"); }
  // Cast.
  app.click('[data-tsec="cast"]');
  check(app, "cast", "cast");
  app.click(`[data-copen="${t.cast[0].id}"]`);
  check(app, "member", "a cast member");
  app.click('[data-tsec="cast"]');
  app.click('[data-cview="crew"]');
  check(app, "whoKnows", "who knows what");
  // City.
  app.click('[data-tsec="city"]');
  check(app, "city", "the crew's places");
  app.click('[data-cityview="factions"]');
  check(app, "factions", "factions");
  app.click('[data-cityview="city"]');
  check(app, "gazetteer", "the city");
  app.click('[data-cityview="places"]');
  app.click(`[data-popen="${t.places[0].id}"]`);
  check(app, "place", "a place");
  app.click('[data-tsec="city"]'); app.click('[data-tsec="city"]');
  app.click('[data-cityview="factions"]');
  app.click(`[data-fcardopen="${t.factions[0].id}"]`);
  check(app, "faction", "a faction");
  // Threats: the empty picker is the section's; a threat is a page.
  app.click('[data-tsec="threats"]');
  check(app, "threats", "threats");
  const entry = app.$("[data-tentry]");
  assert.ok(entry, "the slotted pack shows no threat");
  app.click(`[data-tentry="${entry.getAttribute("data-tentry")}"]`);
  check(app, "threat", "a threat");
  // Encounters, one of each state.
  for (const [status, want] of [["planned", "encounterPlan"], ["running", "encounterRunning"], ["ended", "encounterPast"]]) {
    app.click('[data-tsec="encounters"]');
    app.window.eval("S.encOpen=null; update()");   // a tab press leaves an open encounter open
    check(app, "encounters", "encounters");
    const e = t.encounters.find(x => x.status === status);
    app.click(`[data-enc-open="${e.id}"]`);
    check(app, want, status + " encounter");
  }
  app.click('[data-tsec="reference"]');
  check(app, "reference", "reference");
  app.click('[data-tsec="notes"]');
  check(app, "notes", "notes");
  app.click(`[data-nopen="${t.notes[0].id}"]`);
  check(app, "note", "a note");
  // Every context is reachable, and an unknown state falls back to the section and never throws.
  assert.deepEqual([...Object.keys(G.contexts)].filter(k => !seen.has(k)).sort(), [], "a context no walk step reached");
  app.window.eval(`S.sessOpen=null; S.coEnd=null; S.closeOut=null; S.tsection="nowhere"`);
  assert.equal(ctxNow(app), "sessions", "an unknown section didn't fall back to the first");
  app.window.eval(`S.tsection="encounters"; S.encOpen="EN-nope"`);
  assert.equal(ctxNow(app), "encounters");
  app.window.eval(`S.tsection="cast"; S.castView="cast"; S.castOpen="C-nope"`);
  assert.equal(ctxNow(app), "cast");
  // No two words share a term.
  const terms = Object.values(G.words).map(w => w.term.toLowerCase());
  assert.equal(new Set(terms).size, terms.length, "a term is defined twice");
  assert.deepEqual(app.errors, []);
});

test("S31: the guide line shows on each section's list until turned off, for this browser", () => {
  const app = helpApp("sessions", { extra: { ["shadows.pack.v1." + PACK_ID]: { pack: syntheticPack() } } });   // a slotted pack, so Threats isn't empty
  const t = dead();
  const lineOf = () => app.$("#main [data-guide]");
  for (const id of app.window.eval("TABLE_SECTIONS.map(s=>s.id)")) {
    app.click(`[data-tsec="${id}"]`);
    assert.ok(lineOf(), id + ": no guide line");
    assert.equal(lineOf().textContent, said(G.contexts[id].intro), id);
  }
  app.click('[data-tsec="cast"]');
  app.click(`[data-copen="${t.cast[0].id}"]`);
  assert.equal(lineOf(), null, "a member's page carries a guide line");
  app.click('[data-tsec="cast"]');
  app.click("[data-thelp]");
  app.click("[data-help-guide-off]");
  assert.equal(ls(app, GMGUIDE), "off");
  assert.equal(lineOf(), null, "Off left the line on the page");
  assert.equal(app.doc.activeElement, app.$("[data-help-guide-off]"), "focus left the pressed half");
  for (const id of ["sessions", "players", "notes"]) { app.click(`[data-tsec="${id}"]`); assert.equal(lineOf(), null, id + " still shows one"); }
  // This browser's: it holds across a reload, and On brings it back.
  const again = helpApp("sessions", { extra: { [GMGUIDE]: "off" } });
  assert.equal(again.$("#main [data-guide]"), null, "the preference didn't hold on a fresh boot");
  again.click("[data-thelp]");
  again.click("[data-help-guide-on]");
  assert.equal(ls(again, GMGUIDE), null);
  assert.ok(again.$("#main [data-guide]"), "On didn't bring the line back");
  assert.equal(again.doc.activeElement, again.$("[data-help-guide-on]"));
  assert.deepEqual(app.errors.concat(again.errors), []);
});

test("S31: an empty section says what it's for", () => {
  const app = emptyApp();
  const main = () => app.$("#main").textContent;
  const E = G.empty;
  assert.ok(main().includes(said(E.sessions)), "Sessions' empty state isn't the data's");
  assert.ok(main().includes(said(E.threads)));
  assert.ok(main().includes(said(E.sessionsList)));
  assert.match(said(E.sessions), /Press \? for what each tab is for\.$/);
  const want = { players: E.players, cast: E.cast, threats: E.threats, encounters: E.encounters, notes: E.notes };
  for (const [id, line] of Object.entries(want)) {
    app.click(`[data-tsec="${id}"]`);
    assert.ok(main().includes(said(line)), `${id}: the empty state isn't the data's line`);
  }
  assert.match(main(), /Find searches it/);
  app.click('[data-tsec="city"]');
  assert.ok(main().includes(said(E.places)));
  app.click('[data-cityview="factions"]');
  assert.ok(main().includes(said(E.factions)));
  // An empty section has no guide line: the empty state teaches there.
  for (const id of ["sessions", "players", "cast", "threats", "encounters", "notes", "city"]) {
    app.click(`[data-tsec="${id}"]`);
    assert.equal(app.$("#main [data-guide]"), null, id + ": an empty section shows a guide line");
  }
  app.click('[data-tsec="reference"]');
  assert.ok(app.$("#main [data-guide]"), "Reference is never empty");
  assert.deepEqual(app.errors, []);
});

test("S31: pinned, Help is a column that stays open across visits", () => {
  const app = helpApp("sessions", { width: 1280 });
  assert.equal(app.$("#app").classList.contains("help-pinned"), false);
  app.click("[data-thelp]");
  assert.ok(app.$("#app").classList.contains("help-pinned"), "open at 1280 didn't pin the column");
  assert.equal(ls(app, GMHELP), "open");
  // Back to Home and into the table again: still open, as it was left.
  app.click("[data-thome]");
  assert.equal(app.window.eval("S.screen"), "home");
  assert.equal(shown(app), false, "Help shows on Home");
  app.click("[data-topen]");
  assert.equal(shown(app), true, "the table reopened with Help closed");
  assert.ok(app.$("#app").classList.contains("help-pinned"));
  assert.equal(heading(app), "Sessions");
  // Closing it is remembered too.
  app.click("[data-help-close]");
  assert.equal(shown(app), false);
  assert.equal(ls(app, GMHELP), null);
  assert.equal(app.$("#app").classList.contains("help-pinned"), false);
  // At 1024 the same preference opens nothing.
  const narrow = helpApp("sessions", { width: 1024, extra: { [GMHELP]: "open" } });
  assert.equal(shown(narrow), false, "the pinned preference opened a flyout");
  narrow.click("[data-thelp]");
  assert.equal(shown(narrow), true);
  assert.equal(ls(narrow, GMHELP), "open", "opening a flyout rewrote the pinned preference");
  assert.deepEqual(app.errors.concat(narrow.errors), []);
});

test("S31: Esc closes one layer at a time, a box sits above the panel, a night's link goes there, and resizing across 1280 keeps it", () => {
  // Pinned: Keys from the foot opens a box over the column; Esc closes the box first, the column second.
  const app = helpApp("sessions", { width: 1280 });
  app.click("[data-thelp]");
  app.click("#ghelp [data-hkeys]");
  assert.ok(app.$("dialog.modal[open]"), "Keys didn't open");
  assert.equal(shown(app), true);
  pressEsc(app);
  assert.equal(app.$("dialog.modal[open]"), null, "Esc left the box open");
  assert.equal(shown(app), true, "Esc closed the panel under the box");
  assert.ok(panel(app).contains(app.doc.activeElement), "the box didn't hand focus back into the panel");
  pressEsc(app);
  assert.equal(shown(app), false, "a second Esc didn't close the panel");
  // A flyout: ⋮ open, Esc closes the menu and not the flyout; a second Esc closes the flyout.
  const narrow = helpApp("sessions", { width: 1024 });
  narrow.click("[data-thelp]");
  narrow.click("[data-menu-toggle]");
  assert.equal(narrow.$("#hdrmenu").hidden, false);
  pressEsc(narrow);
  assert.equal(narrow.$("#hdrmenu").hidden, true, "Esc left ⋮ open");
  assert.equal(shown(narrow), true, "Esc closed the flyout with ⋮ open");
  pressEsc(narrow);
  assert.equal(shown(narrow), false);
  // A night's link: it goes to that tab, and a flyout is done by then.
  narrow.click("[data-thelp]");
  narrow.click("#ghelp [data-hnight]");
  assert.equal(narrow.$("#ghelp h2").textContent, G.ui.nightLink);
  narrow.click('#ghelp [data-hsec="reference"]');
  assert.equal(tabNow(narrow), "reference");
  assert.equal(shown(narrow), false, "the link left the flyout open");
  // Every word lists each term once, A to Z, and Back returns to the link that opened it.
  narrow.click("[data-thelp]");
  narrow.click("#ghelp [data-hwords]");
  const terms = narrow.$$("#ghelp dt").map(d => d.textContent);
  assert.equal(terms.length, Object.keys(G.words).length);
  assert.deepEqual(terms, [...terms].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
  narrow.click("#ghelp [data-help-back]");
  assert.equal(narrow.$("#ghelp h2").textContent, "Reference");
  assert.equal(narrow.doc.activeElement, narrow.$("#ghelp [data-hwords]"));
  // A note with no title still has help, and a pinned panel follows the page into it.
  const wide = helpApp("notes", { width: 1280 });
  wide.click("[data-thelp]");
  wide.click("[data-tnew]");
  assert.equal(heading(wide), "A note");
  // Pinned open, then narrower: the same panel is a flyout, and nothing throws.
  wide.resize(1024);
  assert.equal(shown(wide), true);
  assert.deepEqual(app.errors.concat(narrow.errors, wide.errors), []);
});
