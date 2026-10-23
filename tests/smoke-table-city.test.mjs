/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: the City tab (Decisions 242–243): the gazetteer read and searched, the
 * crew's places, and a line's Where. Every test reads what the page draws, never
 * S.table in place of it; S.table is read only to say what was stored.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, D, GM_ON, type, runTable, keyIn, castAdd, pick } from "./smokekit.mjs";

const cityTab = app => app.click('[data-tsec="city"]');
const castTab = app => app.click('[data-tsec="cast"]');
const cityView = (app, v) => app.click(`[data-cityview="${v}"]`);
const both = (app, sel, value) => {
  const el = app.$(sel); el.value = value;
  el.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  el.dispatchEvent(new app.window.Event("change", { bubbles: true }));
};
const focusedKey = app => { const a = app.doc.activeElement; return a && [...a.attributes].map(x => x.name + "=" + x.value).filter(x => x.startsWith("data-")).join(" "); };
const auditLen = app => app.window.eval("S.table.audit.length");
const addPlace = (app, name) => { type(app, "[data-padd-name]", name); keyIn(app, "[data-padd-name]", "Enter"); };
const placeIdOf = (app, name) => app.window.eval(`S.table.places.find(p => Engine.placeTitle(S.table, p) === ${JSON.stringify(name)}).id`);
const openPlace = (app, name) => app.click(`[data-popen="${placeIdOf(app, name)}"]`);
const addLine = (app, text) => { type(app, "[data-iwhat]", text); keyIn(app, "[data-iwhat]", "Enter"); };
const hideToast = app => app.window.eval("hideUndoToast()");

// A table with Dez in the cast and two places: the Pier (typed) and Central Park (from the book).
function setup() {
  const app = boot({ storage: GM_ON });
  runTable(app, "City");
  castAdd(app, "Dez");
  cityTab(app);
  addPlace(app, "the Pier");
  cityView(app, "city");
  app.click('[data-gadd="central-park"]');
  cityView(app, "places");
  castTab(app);
  app.click("[data-copen]");
  return app;
}

test("243: the tabs are Sessions, Cast, City, Threats, Encounters, Reference, Notes", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Tabs", { stay: true });
  assert.deepEqual(app.$$("#topnav .tab").map(b => b.textContent.trim()), ["Sessions", "Cast", "City", "Threats", "Encounters", "Reference", "Notes"]);
  cityTab(app);
  assert.equal(app.$("#topnav .tab.active").textContent.trim(), "City");
  assert.ok(app.$('[data-cityview="places"][aria-pressed="true"]'), "it opens on the crew's places");
  assert.match(app.$("[data-placelist]").textContent, /No places yet\. Add one, or find it in The city\./);
  assert.deepEqual(app.errors, []);
});

test("243: The city lists the book's places by Territory, searches them, and adds one", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "City");
  cityTab(app);
  cityView(app, "city");
  assert.equal(app.$$(".city-terr > .city-entry > h2").length, 6, "six Territories");
  assert.deepEqual(app.$$(".jump-row .jump").map(b => b.textContent), ["North Quarter", "Central City", "Daedalus Belt", "Welterworth Commons", "Greenwall", "Southside Consortium", "Beyond NYTE City", "The powers", "Kinds of ground"]);
  type(app, "[data-jumpfilter]", "metro");
  const mc = app.$('[data-gentry="metro-core"]');
  assert.ok(mc, "Metro Core's line");
  const entry = D.gazetteer.entries.find(e => e.id === "metro-core");
  assert.match(mc.textContent, new RegExp(entry.summary.slice(0, 30)));
  assert.match(mc.textContent, /NYC Metro/);
  assert.ok(app.$('[data-gentry="eclipse"]') && app.$('[data-gentry="central-park"]') && app.$('[data-gentry="nexacorp"]'), "its Sites, Businesses and Factions come with it");
  assert.equal(app.$('[data-gentry="capital-region"]'), null);
  assert.equal(app.$('[data-gentry="eclipse"] [data-gadd]'), null, "a Faction can't be added");
  type(app, "[data-jumpfilter]", "eclipse");
  assert.deepEqual(app.$$("[data-gentry]").map(e => e.dataset.gentry), ["central-city", "eclipse"]);
  type(app, "[data-jumpfilter]", "okefenokee");
  assert.ok(app.$('[data-gentry="wormwood-swamp"]'), "found by its real-world name");
  type(app, "[data-jumpfilter]", "qwertyzzz");
  assert.match(app.$("[data-citypanels]").textContent, /Nothing in the city by that name\./);
  type(app, "[data-jumpfilter]", "park");
  assert.ok(app.$('[data-gadd="central-park"]'));
  app.click('[data-gadd="central-park"]');
  assert.equal(app.$('[data-gadd="central-park"]'), null);
  assert.equal(focusedKey(app), "data-gopen=central-park", "the button turned to Open, and has focus");
  assert.equal(app.$('[data-cityview="city"]').getAttribute("aria-pressed"), "true", "stays on The city");
  cityView(app, "places");
  assert.equal(app.$$(".place-card").length, 1);
  assert.match(app.$(".place-card").textContent, /^\s*Central Park\s*Metro Core · Central City/);
  assert.deepEqual(app.errors, []);
});

test("243: a place's page saves as typed; a Territory change clears a zone it doesn't hold", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "City");
  cityTab(app);
  addPlace(app, "The Rookery");
  assert.equal(focusedKey(app), "data-padd-name=", "focus stays on quick-add");
  assert.match(app.$(".place-card").textContent, /The Rookery/);
  openPlace(app, "The Rookery");
  assert.equal(app.$("[data-ptitle]").textContent, "The Rookery");
  assert.equal(app.doc.activeElement, app.$("[data-ptitle]"), "focus lands on the heading");
  hideToast(app);
  let n = auditLen(app);
  both(app, '[data-pf="name"]', "The Ramble");
  assert.equal(app.$("[data-ptitle]").textContent, "The Ramble", "the heading follows the typing");
  assert.equal(auditLen(app), n + 1, "input and change make one entry");
  both(app, '[data-pf="district"]', "Upper West");
  both(app, '[data-pf="neighborhood"]', "Strawberry Fields");
  both(app, '[data-pf="notes"]', "ley lines");
  assert.equal(auditLen(app), n + 4);
  assert.ok(app.$("#undotoast").hidden, "typing shows no toast");
  assert.equal(app.window.eval("S.table.audit.at(-1).label"), "Changed The Ramble");
  // Territory, then Zone
  pick(app, '[data-pf="territory"]', "central-city");
  assert.equal(focusedKey(app), "data-pf=territory", "focus stays on Territory");
  const zones = [...app.$$('[data-pf="zone"] option')].map(o => o.value);
  assert.ok(zones.includes("metro-core") && !zones.includes("garden-state"), "the Zone select lists that Territory's zones: " + zones);
  pick(app, '[data-pf="zone"]', "metro-core");
  assert.equal(app.$('[data-pf="zone"]').value, "metro-core");
  pick(app, '[data-pf="territory"]', "daedalus-belt");
  assert.equal(app.$('[data-pf="zone"]').value, "", "Zone shows none");
  assert.equal(app.$('[data-pf="territory"]').value, "daedalus-belt");
  assert.equal(focusedKey(app), "data-pf=territory");
  // Kind of ground: one or none
  app.click('[data-pground="convergences"]');
  app.click('[data-pground="gates"]');
  assert.deepEqual(app.$$("[data-pground][aria-pressed=true]").map(b => b.dataset.pground), ["gates"]);
  app.click('[data-pground="gates"]');
  assert.deepEqual(app.$$("[data-pground][aria-pressed=true]"), []);
  // the typed ones are offered back on another place
  app.click("[data-pback]");
  assert.equal(focusedKey(app).startsWith("data-popen="), true, "Back lands on the card");
  assert.match(app.$(".place-card").textContent, /Daedalus Belt · Upper West · Strawberry Fields/);
  addPlace(app, "Another");
  openPlace(app, "Another");
  assert.deepEqual([...app.$$("#place-districts option")].map(o => o.value), ["Upper West"]);
  assert.deepEqual(app.errors, []);
});

test("243: Where on the add row is kept between lines, and the line reads at the place", () => {
  const app = setup();
  assert.deepEqual([...app.$$("[data-iawhere] option")].map(o => o.textContent), ["Nowhere in particular", "Central Park", "the Pier"], "by title");
  app.click('[data-iakind="shared"]'); type(app, "[data-iacrew]", "Scott");
  const pier = placeIdOf(app, "the Pier");
  both(app, "[data-iawhere]", pier);
  addLine(app, "the lake is on fire");
  assert.match(app.$("[data-int]").querySelector(".int-sentence").textContent, /^Scott told Dez “the lake is on fire” at the Pier on \S+/);
  assert.equal(app.$("[data-iawhere]").value, pier, "Where is kept");
  addLine(app, "and the bridge");
  const texts = app.$$("[data-int] .int-sentence").map(s => s.textContent);
  assert.match(texts[0], /“and the bridge” at the Pier on/);
  assert.match(texts[1], /“the lake is on fire” at the Pier on/);
  both(app, "[data-iawhere]", "");
  addLine(app, "nowhere");
  assert.doesNotMatch(app.$("[data-int] .int-sentence").textContent, / at /);
  assert.deepEqual(app.errors, []);
});

test("243: Where in an open line updates its sentence in place", () => {
  const app = setup();
  app.click('[data-iakind="shared"]'); type(app, "[data-iacrew]", "Scott");
  addLine(app, "hello");
  const xid = app.$("[data-int]").dataset.int;
  app.click(`[data-iedit="${xid}"]`);
  const labels = [...app.$(`[data-int="${xid}"]`).querySelectorAll("label span")].map(x => x.textContent);
  assert.deepEqual(labels, ["Crew", "What", "When", "Where"]);
  assert.equal(app.$(`[data-iwhere="${xid}"]`).value, "", "Nowhere in particular");
  const n = auditLen(app);
  const park = placeIdOf(app, "Central Park");
  both(app, `[data-iwhere="${xid}"]`, park);
  assert.match(app.$(`[data-isent="${xid}"]`).textContent, /^Scott told Dez “hello” at Central Park on \S+/);
  assert.equal(auditLen(app), n + 1, "input and change make one entry");
  assert.equal(app.doc.activeElement.dataset.iwhere, undefined, "the page didn't take focus away");
  both(app, `[data-iwhere="${xid}"]`, "");
  assert.doesNotMatch(app.$(`[data-isent="${xid}"]`).textContent, / at /);
  assert.equal(app.window.eval("S.table.interactions[0].place"), null);
  assert.deepEqual(app.errors, []);
});

// Two lines, one with a two-crew line so Who knows what shows it twice; a session dated today holds them.
function withLines() {
  const app = setup();
  app.click('[data-iakind="shared"]'); type(app, "[data-iacrew]", "Scott, Nyx");
  both(app, "[data-iawhere]", placeIdOf(app, "the Pier"));
  addLine(app, "the lake is on fire");
  both(app, "[data-iawhere]", "");
  addLine(app, "elsewhere");
  return app;
}

test("243: a place in a sentence opens its page, and Back returns to the member's page, Who knows what (the copy tapped, with its search) or a session's page, on the link", () => {
  const app = withLines();
  const pier = placeIdOf(app, "the Pier"), xid = app.window.eval("S.table.interactions.find(x => x.place).id");
  // a member's page
  const link = `[data-popenline="${xid}|${pier}"]`;
  assert.ok(app.$(link), "the place is a button on the member's page");
  app.click(link);
  assert.equal(app.$("#topnav .tab.active").textContent.trim(), "City");
  assert.equal(app.$("[data-ptitle]").textContent, "the Pier");
  assert.equal(app.doc.activeElement, app.$("[data-ptitle]"));
  assert.equal(app.$("[data-pback]").textContent, "Back to Dez");
  app.click("[data-pback]");
  assert.equal(app.$("[data-ctitle]").textContent, "Dez");
  assert.equal(focusedKey(app), `data-popenline=${xid}|${pier}`, "Back lands on the link");
  // Who knows what: Scott's group and Nyx's, the second copy tapped
  app.click("[data-cback]");
  app.click('[data-cview="crew"]');
  type(app, "[data-csearch]", "lake");
  const copies = app.$$("[data-popenline]");
  assert.equal(copies.length, 2, "once per crew name");
  const second = copies[1];
  assert.match(second.dataset.popenline, /\|scott\|/);
  app.click(`[data-popenline="${second.dataset.popenline}"]`);
  assert.equal(app.$("[data-pback]").textContent, "Back to Who knows what");
  app.click("[data-pback]");
  assert.equal(app.$("[data-csearch]").value, "lake", "its search is kept");
  assert.equal(focusedKey(app), `data-popenline=${second.dataset.popenline}`, "Back finds the copy that was tapped");
  assert.equal(copies.indexOf(second), 1);
  assert.deepEqual(app.errors, []);
});

test("243: a session's page lists a line with a place, and Back returns to it, on the link", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "City", { stay: true });
  app.click("[data-snew]");
  castTab(app);
  castAdd(app, "Dez");
  cityTab(app);
  addPlace(app, "the Pier");
  castTab(app);
  app.click("[data-copen]");
  app.click('[data-iakind="shared"]'); type(app, "[data-iacrew]", "Scott");
  both(app, "[data-iawhere]", placeIdOf(app, "the Pier"));
  addLine(app, "hello");
  const xid = app.window.eval("S.table.interactions[0].id");
  assert.ok(app.window.eval("S.table.interactions[0].session"), "the day's session took the line");
  app.click('[data-tsec="sessions"]');
  app.click("[data-sopen]");
  const link = `[data-popenline="${xid}|${placeIdOf(app, "the Pier")}|sess|${xid}"]`;
  assert.ok(app.$(link), "the place is a button in the session's list");
  app.click(link);
  assert.equal(app.$("[data-ptitle]").textContent, "the Pier");
  assert.match(app.$("[data-pback]").textContent, /^Back to (Session|Dez|S)/);
  app.click("[data-pback]");
  assert.equal(app.$("#topnav .tab.active").textContent.trim(), "Sessions");
  assert.equal(focusedKey(app), `data-popenline=${xid}|${placeIdOf(app, "the Pier")}|sess|${xid}`);
  assert.deepEqual(app.errors, []);
});

test("243: What happened here and Met here read the lines; a member there opens, and their Back returns to the place", () => {
  const app = withLines();
  const pier = placeIdOf(app, "the Pier");
  app.click("[data-cback]");
  cityTab(app);
  openPlace(app, "the Pier");
  assert.equal(app.$$(".int-line").length, 2, "the line is listed once under What happened here, and the member once under Met here");
  const happened = app.$$(".int-list")[0];
  assert.match(happened.textContent, /told Dez “the lake is on fire” at the Pier/);
  assert.equal(happened.querySelector("[data-popenline]"), null, "its own place is plain text on its own page");
  assert.deepEqual(app.$$(".int-list")[1].textContent.trim(), "Dez");
  assert.doesNotMatch(app.$("main, #main").textContent, /elsewhere/, "a line at no place isn't here");
  app.click('[data-cwhere="met|' + app.window.eval("S.table.cast[0].id") + '"]');
  assert.equal(app.$("[data-ctitle]").textContent, "Dez");
  assert.equal(app.$("[data-cback]").textContent, "Back to the Pier");
  app.click("[data-cback]");
  assert.equal(app.$("[data-ptitle]").textContent, "the Pier");
  assert.match(focusedKey(app), /^data-copen=C-\S+ data-cwhere=met\|C-\S+$/, "Back lands on the member");
  assert.equal(pier, app.window.eval("S.placeOpen"));
  assert.deepEqual(app.errors, []);
});

test("243: removing a place strikes its name in every sentence, with no button and no error, and Undo brings it back", () => {
  const app = withLines();
  const pier = placeIdOf(app, "the Pier");
  app.click("[data-cback]");
  cityTab(app);
  openPlace(app, "the Pier");
  app.click("[data-pdel]"); app.click("#modal [data-askyes]");
  assert.equal(focusedKey(app), "data-padd-name=");
  assert.match(app.$("[data-placelist]").textContent, /No places yet|Central Park/);
  castTab(app);
  app.click("[data-copen]");
  const sent = app.$$("[data-int]").map(li => li.querySelector(".int-sentence"));
  const at = sent.find(s => /lake is on fire/.test(s.textContent));
  assert.ok(at.querySelector("s"), "the name is struck");
  assert.equal(at.querySelector("s").textContent, "the Pier");
  assert.match(at.textContent, /at the Pier, removed on|at the Pier, removed/);
  assert.equal(at.querySelector("[data-popenline]"), null, "no button");
  // Undo from Activity restores the place and its link
  app.click("[data-menu-toggle]"); app.click("[data-tactivity]");
  assert.match(app.$("#modal [data-act-undo]").textContent, /^Undo: Removed the Pier$/);
  app.click("#modal [data-act-undo]");
  app.click("#modal [data-modalclose]");
  assert.ok(app.$(`[data-popenline="${app.window.eval("S.table.interactions.find(x => x.place).id")}|${pier}"]`), "the place is a button again");
  assert.deepEqual(app.errors, []);
});

test("243: Find opens a place on its heading, and Back goes to the crew's places, on its card", () => {
  const app = setup();
  app.click("[data-cback]");
  app.click("[data-tfind]");
  type(app, "[data-findq]", "central park");
  const hit = app.$$("#modal [data-fkind]").find(b => b.dataset.fkind === "place");
  assert.ok(hit, "a place hit");
  assert.match(hit.textContent, /Central Park/);
  app.click(`#modal [data-fkind="place"]`);
  assert.equal(app.$("#modal[open]"), null);
  assert.equal(app.$("#topnav .tab.active").textContent.trim(), "City");
  assert.equal(app.doc.activeElement, app.$("[data-ptitle]"));
  assert.equal(app.$("[data-ptitle]").textContent, "Central Park");
  assert.equal(app.$("[data-pback]").textContent, "Back to the crew's places");
  app.click("[data-pback]");
  assert.equal(focusedKey(app), `data-popen=${placeIdOf(app, "Central Park")}`, "Back lands on the card");
  assert.deepEqual(app.errors, []);
});
