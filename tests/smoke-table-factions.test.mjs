/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: the City tab's Factions view, a faction's page and its clocks
 * (Decisions 244–245). Every test reads what the page draws, never S.table in place
 * of it; S.table is read only to say what was stored.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, D, GM_ON, type, runTable, keyIn, castAdd } from "./smokekit.mjs";

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
const hideToast = app => app.window.eval("hideUndoToast()");
const addFaction = (app, name) => { type(app, "[data-fadd-name]", name); keyIn(app, "[data-fadd-name]", "Enter"); };
const factionId = (app, title) => app.window.eval(`S.table.factions.find(f => Engine.factionTitle(S.table, f) === ${JSON.stringify(title)}).id`);
const pressed = (app, attr) => app.$$(`[${attr}]`).filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.getAttribute(attr));
const find = (app, q, kind) => {
  app.click("[data-tfind]");
  type(app, "[data-findq]", q);
  const hit = app.$$("#modal [data-fkind]").find(b => b.dataset.fkind === kind);
  assert.ok(hit, `a ${kind} hit for ${q}`);
  app.click(`#modal [data-fkind="${kind}"]`);
};

// A table with Dez and Bob in the cast, and Eclipse (from the book) as a faction, open on its page.
function setup() {
  const app = boot({ storage: GM_ON });
  runTable(app, "Factions");
  castAdd(app, "Dez");
  castAdd(app, "Bob");
  cityTab(app);
  cityView(app, "city");
  app.click('[data-gfadd="eclipse"]');
  app.click('[data-gfopen="eclipse"]');
  return app;
}
const bobId = app => app.window.eval(`S.table.cast.find(n => n.name === "Bob").id`);

test("244: the City tab's views are The crew's places, Factions, The city", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Views", { stay: true });
  cityTab(app);
  assert.deepEqual(app.$$("[data-cityview]").map(b => b.textContent.trim()), ["The crew's places", "Factions", "The city"]);
  assert.ok(app.$('[data-cityview="places"][aria-pressed="true"]'), "it still opens on the crew's places");
  cityView(app, "factions");
  assert.match(app.$("[data-factionlist]").textContent, /No factions yet\. Add one, or find it in The city\./);
  addFaction(app, "The Vipers");
  assert.equal(focusedKey(app), "data-fadd-name=", "focus stays on quick-add");
  assert.match(app.$(".place-card").textContent, /The Vipers/);
  type(app, "[data-fsearch]", "zzz");
  assert.match(app.$("[data-factionlist]").textContent, /No faction matches\./);
  assert.deepEqual(app.errors, []);
});

test("244: The city's Eclipse adds to the crew's factions and turns to Open; a place's button is unchanged", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "City");
  cityTab(app);
  cityView(app, "city");
  const add = app.$('[data-gentry="eclipse"] [data-gfadd]');
  assert.ok(add);
  assert.equal(add.textContent, "Add to the crew's factions");
  assert.equal(add.getAttribute("aria-label"), "Add Eclipse to the crew's factions");
  assert.ok(app.$('[data-gentry="covenant-medical"] [data-gfadd]') || app.$('[data-gentry] [data-gfadd]:not([data-gfadd="eclipse"])'), "a power can be added too");
  assert.equal(app.$('[data-gentry="central-park"] [data-gfadd]'), null, "a place isn't a faction");
  assert.equal(app.$('[data-gentry="central-park"] [data-gadd]').getAttribute("aria-label"), "Add Central Park to the crew's places");
  app.click('[data-gfadd="eclipse"]');
  assert.equal(app.$('[data-gfadd="eclipse"]'), null);
  assert.equal(focusedKey(app), "data-gfopen=eclipse", "the button turned to Open, and has focus");
  assert.equal(app.$('[data-gfopen="eclipse"]').getAttribute("aria-label"), "Open Eclipse");
  assert.equal(app.$('[data-cityview="city"]').getAttribute("aria-pressed"), "true", "stays on The city");
  app.click('[data-gfopen="eclipse"]');
  assert.equal(app.doc.activeElement, app.$("[data-ftitle]"));
  assert.equal(app.$("[data-ftitle]").textContent, "Eclipse");
  assert.equal(app.$("[data-fback]").textContent, "Back to The city");
  assert.match(app.$(".city-sum").textContent, /\S/, "the book's line");
  assert.equal(app.$('[data-ff="territory"]').selectedOptions[0].textContent, "Central City");
  assert.deepEqual(pressed(app, "data-ftype"), [], "nothing is guessed from the entry");
  assert.deepEqual(pressed(app, "data-fstance"), []);
  assert.deepEqual(pressed(app, "data-fattn"), []);
  app.click("[data-fback]");
  assert.equal(focusedKey(app), "data-gfopen=eclipse", "Back lands on the Open it came from");
  assert.deepEqual(app.errors, []);
});

test("244: a faction's page saves as typed: input and change make one entry each, and typing shows no toast", () => {
  const app = setup();
  hideToast(app);
  let n = auditLen(app);
  both(app, '[data-ff="name"]', "The Eclipse Gang");
  assert.equal(app.$("[data-ftitle]").textContent, "The Eclipse Gang", "the heading follows the typing");
  assert.equal(auditLen(app), n + 1);
  both(app, '[data-ff="base"]', "A dockside loft");
  assert.equal(auditLen(app), n + 2);
  both(app, '[data-ff="wants"]', "the docks");
  assert.equal(auditLen(app), n + 3);
  app.click('[data-ftipadd="against"]');
  assert.equal(focusedKey(app).startsWith("data-ftip=against|0"), true, "the new line takes the keyboard");
  hideToast(app);
  n = auditLen(app);
  both(app, '[data-ftip="against|0"]', "the crew talks to NCPD");
  assert.equal(auditLen(app), n + 1);
  assert.ok(app.$("#undotoast").hidden, "typing shows no toast");
  app.click('[data-ftipadd="against"]');
  both(app, '[data-ftip="against|1"]', "a shipment goes missing");
  app.click('[data-ftipadd="for"]');
  both(app, '[data-ftip="for|0"]', "they pay on time");
  const f = JSON.parse(app.window.eval("JSON.stringify(S.table.factions[0])"));
  assert.deepEqual([f.name, f.base, f.wants, f.tippingAgainst, f.tippingFor], ["The Eclipse Gang", "A dockside loft", "the docks", ["the crew talks to NCPD", "a shipment goes missing"], ["they pay on time"]]);
  // Remove lands on the next line's field, and the last on Add a line
  app.click('[data-ftipdel="against|0"]');
  assert.equal(app.$('[data-ftip="against|0"]').value, "a shipment goes missing");
  assert.equal(focusedKey(app).startsWith("data-ftip=against|0"), true);
  app.click('[data-ftipdel="against|0"]');
  assert.equal(focusedKey(app), "data-ftipadd=against");
  both(app, '[data-ff="territory"]', "north-quarter");
  assert.equal(app.window.eval("S.table.factions[0].territory"), "north-quarter");
  assert.deepEqual(app.errors, []);
});

test("244: Type, Stance and Attention toggle one or none, and the five stance buttons are named", () => {
  const app = setup();
  assert.deepEqual(app.$$("[data-ftype]").map(b => b.textContent.trim()), ["Gang", "Corp", "Government", "Cult", "Collective", "Other"]);
  app.click('[data-ftype="gang"]');
  assert.deepEqual(pressed(app, "data-ftype"), ["gang"]);
  app.click('[data-ftype="cult"]');
  assert.deepEqual(pressed(app, "data-ftype"), ["cult"]);
  app.click('[data-ftype="cult"]');
  assert.deepEqual(pressed(app, "data-ftype"), [], "tapping the pressed one clears it");
  assert.deepEqual(app.$$("[data-fstance]").map(b => b.getAttribute("aria-label")), ["Hostile", "One step toward Hostile", "Neutral", "One step toward Allied", "Allied"]);
  assert.deepEqual(app.$$("[data-fstance]").map(b => b.textContent.trim()), ["Hostile", "·", "Neutral", "·", "Allied"], "only the ends and the middle are worded");
  app.click('[data-fstance="-1"]');
  assert.deepEqual(pressed(app, "data-fstance"), ["-1"]);
  assert.equal(app.window.eval("S.table.factions[0].stance"), -1);
  app.click('[data-fstance="-1"]');
  assert.deepEqual(pressed(app, "data-fstance"), []);
  assert.equal(app.window.eval("S.table.factions[0].stance"), null);
  app.click('[data-fstance="2"]');
  assert.equal(app.window.eval("S.table.factions[0].stance"), 2);
  assert.deepEqual(app.$$("[data-fattn]").map(b => b.textContent.trim()), ["Neutral", "Aware", "Active"]);
  app.click('[data-fattn="aware"]');
  assert.deepEqual(pressed(app, "data-fattn"), ["aware"]);
  app.click('[data-fattn="aware"]');
  assert.deepEqual(pressed(app, "data-fattn"), []);
  assert.equal(app.window.eval("S.table.factions[0].attention"), null);
  app.click("[data-fback]");
  app.click('[data-cityview="factions"]');
  assert.match(app.$(".place-card").textContent, /Eclipse\s*Central City · Allied/, "the card says the stance at an end");
  assert.deepEqual(app.errors, []);
});

test("244: a key NPC opens the member, and their Back returns to the faction on the link; Key to opens the faction and Back returns to the member", () => {
  const app = setup();
  const bob = bobId(app);
  const sel = app.$("[data-fkeyadd]");
  assert.ok([...sel.options].some(o => o.textContent === "Bob") && [...sel.options].some(o => o.textContent === "Dez"));
  both(app, "[data-fkeyadd]", bob);
  assert.equal(focusedKey(app), "data-fkeyadd=", "focus stays on the select");
  assert.ok(![...app.$("[data-fkeyadd]").options].some(o => o.textContent === "Bob"), "the select drops that member");
  assert.equal(app.$$("[data-fkeys] .fac-key").length, 1);
  app.click(`[data-copen="${bob}"]`);
  assert.equal(app.$("[data-ctitle]").textContent, "Bob");
  assert.equal(app.$("[data-cback]").textContent, "Back to Eclipse");
  assert.match(app.$("main, #main").textContent, /Key to\s*Eclipse/, "the member's page says what they're key to");
  app.click("[data-cback]");
  assert.equal(app.$("[data-ftitle]").textContent, "Eclipse");
  assert.equal(focusedKey(app), `data-copen=${bob} data-cwhere=key|${bob}`, "Back lands on the link");
  // the other way
  app.click(`[data-copen="${bob}"]`);
  app.click("[data-fopen]");
  assert.equal(app.$("[data-ftitle]").textContent, "Eclipse");
  assert.equal(app.doc.activeElement, app.$("[data-ftitle]"));
  assert.equal(app.$("[data-fback]").textContent, "Back to Bob");
  app.click("[data-fback]");
  assert.equal(app.$("[data-ctitle]").textContent, "Bob");
  assert.equal(focusedKey(app), `data-fopen=${app.$("[data-fopen]").dataset.fopen}`, "Back lands on the Key to link");
  assert.equal(app.$("[data-cback]").textContent, "Back to Eclipse", "the member's own Back still returns to the faction");
  app.click("[data-cback]");
  // Remove a key NPC
  app.click(`[data-fkeydel="${bob}"]`);
  assert.equal(app.$$("[data-fkeys] .fac-key").length, 0);
  assert.equal(focusedKey(app), "data-fkeyadd=");
  assert.deepEqual(app.errors, []);
});

test("244: Tied by affiliation lists the cast whose affiliation matches, and links them", () => {
  const app = setup();
  castTab(app);
  app.click(`[data-copen="${bobId(app)}"]`);
  both(app, '[data-cf="affiliations"]', "ECLIPSE");
  app.click("[data-cback]");
  cityTab(app);
  app.click("[data-fcardopen]");
  assert.match(app.$("main, #main").textContent, /Tied by affiliation\s*Bob/);
  assert.equal(app.window.eval("S.table.factions[0].keyNpcs.length"), 0, "nothing is stored on the faction");
  assert.equal(app.window.eval(`S.table.cast.find(n => n.name === "Bob").affiliations.join()`), "ECLIPSE", "nor converted on the member");
  app.click(`[data-cwhere="aff|${bobId(app)}"]`);
  assert.equal(app.$("[data-cback]").textContent, "Back to Eclipse");
  assert.deepEqual(app.errors, []);
});

test("244: removing a key NPC's member strikes their name on the faction's page, and Undo brings the link back", () => {
  const app = setup();
  const bob = bobId(app);
  both(app, "[data-fkeyadd]", bob);
  app.click(`[data-copen="${bob}"]`);
  app.click("[data-cdel]"); app.click("#modal [data-askyes]");
  cityTab(app);
  app.click('[data-fcardopen]');
  const li = app.$("[data-fkeys] .fac-key");
  assert.equal(li.querySelector("s").textContent, "Bob");
  assert.equal(li.querySelector("[data-copen]"), null, "no button, no error");
  app.click("[data-menu-toggle]"); app.click("[data-tactivity]");
  assert.match(app.$("#modal [data-act-undo]").textContent, /^Undo: Removed Bob/);
  app.click("#modal [data-act-undo]");
  app.click("#modal [data-modalclose]");
  assert.ok(app.$("[data-fkeys] [data-copen]"), "the link is live again");
  assert.deepEqual(app.errors, []);
});

test("245: + and − move a clock in place, keep focus, and a full clock says what happens", () => {
  const app = setup();
  app.click("[data-clkadd]");
  assert.equal(app.doc.activeElement, app.$('[data-kf="name"]'), "Add a clock lands on Name");
  assert.equal(app.$('[data-kf="name"]').value, "New clock");
  assert.equal(app.$('[data-kf="segments"]').value, "4");
  both(app, '[data-kf="name"]', "Eclipse notices the crew");
  both(app, '[data-kf="advances"]', "each job in Metro Core");
  both(app, '[data-kf="whenFull"]', "they send someone");
  app.click("[data-clkdone]");
  assert.equal(focusedKey(app).startsWith("data-clkedit"), true, "Done lands on Edit");
  assert.equal(app.$(".clock-count").textContent, "0 of 4");
  assert.ok(app.$("[data-clkminus]").disabled);
  assert.equal(app.$("[data-clockfull]").hidden, true);
  const plus = app.$("[data-clkplus]"); plus.focus();   // a real press focuses the button; jsdom's click does not
  for (let i = 1; i <= 3; i++) { app.click("[data-clkplus]"); assert.equal(app.$(".clock-count").textContent, `${i} of 4`); assert.equal(app.doc.activeElement, plus, "focus stays on +"); }
  assert.equal(app.$$(".clock-box.on").length, 3);
  app.click("[data-clkplus]");
  assert.equal(app.$(".clock-count").textContent, "4 of 4");
  assert.equal(app.$("[data-clockfull]").hidden, false);
  assert.match(app.$("[data-clockfull]").textContent, /Full\s*·\s*they send someone/);
  assert.ok(app.$("[data-clkplus]").disabled);
  assert.equal(app.doc.activeElement, app.$("[data-clkminus]"), "+ disabled, so focus moves to −");
  app.click("[data-clkminus]");
  assert.equal(app.$(".clock-count").textContent, "3 of 4");
  assert.equal(app.$("[data-clockfull]").hidden, true);
  assert.equal(app.doc.activeElement, app.$("[data-clkminus]"));
  assert.equal(app.window.eval("S.table.clocks[0].filled"), 3);
  // Edit to 6 segments, a second clock, delete one
  app.click("[data-clkedit]");
  both(app, '[data-kf="segments"]', "6");
  assert.equal(app.$$(".clock-box").length, 6);
  assert.equal(app.$(".clock-count").textContent, "3 of 6");
  for (const bad of ["", "13", "1", "0", "abc", "2.5"]) {
    both(app, '[data-kf="segments"]', bad);
    assert.equal(app.$('[data-kf="segments"]').value, "6", `"${bad}" reads back as stored`);
    assert.equal(app.$(".clock-count").textContent, "3 of 6", `"${bad}" leaves the clock alone`);
    assert.equal(app.window.eval("S.table.clocks[0].segments + '/' + S.table.clocks[0].filled"), "6/3");
  }
  app.click("[data-clkdone]");
  app.click("[data-clkadd]");
  assert.equal(app.$$("[data-clock]").length, 2);
  app.click("[data-clkdel]");
  assert.equal(app.$$("[data-clock]").length, 1);
  assert.equal(focusedKey(app), "data-clkadd=");
  app.click("[data-fback]");
  cityView(app, "factions");
  assert.match(app.$(".place-card").textContent, /1 clock/);
  assert.deepEqual(app.errors, []);
});

test("245: deleting a faction asks with its clock count, and Undo from Activity restores both", () => {
  const app = setup();
  for (let i = 0; i < 2; i++) { app.click("[data-clkadd]"); app.click("[data-clkdone]"); }
  app.click("[data-fdel]");
  assert.match(app.$("#modal").textContent, /Delete Eclipse\?/);
  assert.match(app.$("#modal").textContent, /Its page goes with it, and its 2 clocks\. Key NPCs stay in the cast\./);
  app.click("#modal [data-askyes]");
  assert.equal(focusedKey(app), "data-fadd-name=");
  assert.match(app.$("[data-factionlist]").textContent, /No factions yet/);
  assert.equal(app.window.eval("S.table.clocks.length"), 0);
  app.click("[data-menu-toggle]"); app.click("[data-tactivity]");
  assert.match(app.$("#modal [data-act-undo]").textContent, /^Undo: Removed Eclipse$/);
  app.click("#modal [data-act-undo]");
  app.click("#modal [data-modalclose]");
  app.click("[data-fcardopen]");
  assert.equal(app.$$("[data-clock]").length, 2, "both clocks came back");
  assert.deepEqual(app.errors, []);
});

test("244: Find opens a faction on its heading, and a clock on its name", () => {
  const app = setup();
  app.click('[data-ftipadd="against"]');
  both(app, '[data-ftip="against|0"]', "the crew talks to NCPD");
  app.click("[data-clkadd]");
  both(app, '[data-kf="name"]', "Heat");
  both(app, '[data-kf="whenFull"]', "they send someone");
  app.click("[data-clkdone]");
  app.click("[data-fback]");
  castTab(app);
  find(app, "ncpd", "faction");
  assert.equal(app.$("#topnav .tab.active").textContent.trim(), "City");
  assert.equal(app.doc.activeElement, app.$("[data-ftitle]"));
  assert.equal(app.$("[data-ftitle]").textContent, "Eclipse");
  assert.equal(app.$("[data-fback]").textContent, "Back to Factions");
  app.click("[data-fback]");
  assert.equal(focusedKey(app), `data-fcardopen=${factionId(app, "Eclipse")}`, "Back lands on the card");
  castTab(app);
  find(app, "send someone", "clock");
  assert.equal(app.$("[data-ftitle]").textContent, "Eclipse");
  assert.equal(app.doc.activeElement, app.$("[data-clockname]"));
  assert.equal(app.$("[data-clockname]").textContent, "Heat");
  assert.deepEqual(app.errors, []);
});

test("244: a place's Back still works after backPlace became backCity", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Rename");
  castAdd(app, "Dez");
  cityTab(app);
  type(app, "[data-padd-name]", "the Pier"); keyIn(app, "[data-padd-name]", "Enter");
  const pier = app.window.eval("S.table.places[0].id");
  castTab(app);
  app.click("[data-copen]");
  app.click('[data-iakind="shared"]'); type(app, "[data-iacrew]", "Scott");
  both(app, "[data-iawhere]", pier);
  type(app, "[data-iwhat]", "the lake is on fire"); keyIn(app, "[data-iwhat]", "Enter");
  app.click("[data-cback]");
  cityTab(app);
  app.click(`[data-popen="${pier}"]`);
  const dez = app.window.eval("S.table.cast[0].id");
  app.click(`[data-cwhere="met|${dez}"]`);
  assert.equal(app.$("[data-cback]").textContent, "Back to the Pier");
  app.click("[data-cback]");
  assert.equal(app.$("[data-ptitle]").textContent, "the Pier");
  assert.match(focusedKey(app), /^data-copen=C-\S+ data-cwhere=met\|C-\S+$/, "Back lands on the member");
  assert.deepEqual(app.errors, []);
});

test("244: a faction's own Back survives a Key to round trip", () => {
  const app = setup();
  const bob = bobId(app);
  both(app, "[data-fkeyadd]", bob);
  app.click(`[data-copen="${bob}"]`);
  app.click("[data-fopen]");
  assert.equal(app.$("[data-fback]").textContent, "Back to Bob");
  app.click("[data-fback]");
  app.click("[data-cback]");
  assert.equal(app.$("[data-ftitle]").textContent, "Eclipse");
  assert.equal(app.$("[data-fback]").textContent, "Back to The city", "the route it was opened by is kept");
  app.click("[data-fback]");
  assert.equal(focusedKey(app), "data-gfopen=eclipse", "and lands on its Open");
  assert.deepEqual(app.errors, []);
});
