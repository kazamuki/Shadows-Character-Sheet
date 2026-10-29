/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: a place's Site Profile, its track, Exposure and clocks (Decisions 250–251).
 * Every test reads what the page draws, never S.table in place of it; S.table is read only
 * to say what was stored. The pack fixture is four of the Codex pack's own sites, so the
 * text on the page is the book's.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot } from "./harness.mjs";
import { Engine, GM_ON, type, runTable, keyIn, castAdd, pick, packStored } from "./smokekit.mjs";
import { ROOT } from "../tools/build.mjs";
import { join } from "node:path";

const codex = JSON.parse(readFileSync(join(ROOT, "private/gm/threat-codex.shadows-pack.json"), "utf8"));
const SITE_IDS = ["long-stretch", "old-growth", "dead-block", "deep-door", "building-that-remembers"];
const sitePack = () => ({ meta: { ...codex.meta, name: "Sites" }, origins: [], npcRoles: [], enemyRoles: [], tiers: [], traits: [], entries: [], groups: [],
  sites: codex.sites.filter(s => SITE_IDS.includes(s.id)) });
const PK = codex.meta.id;
const book = id => codex.sites.find(s => s.id === id);

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
const pressed = (app, attr) => app.$$(`[${attr}]`).filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.getAttribute(attr) || b.textContent.trim());
const find = (app, q, kind) => {
  app.click("[data-tfind]");
  type(app, "[data-findq]", q);
  const hit = app.$$("#modal [data-fkind]").find(b => b.dataset.fkind === kind);
  assert.ok(hit, `a ${kind} hit for ${q}`);
  app.click(`#modal [data-fkind="${kind}"]`);
};
const pickSite = (app, id) => pick(app, "[data-psite]", `${PK}|${id}`);

// A table with the sites slotted in and The Old Pike (from the book) open on its page.
function setup(extra = {}) {
  const app = boot({ storage: { ...GM_ON, ...packStored(sitePack()), ...extra } });
  runTable(app, "Sites");
  cityTab(app);
  cityView(app, "city");
  app.click('[data-gadd="old-pike"]');
  cityView(app, "places");
  app.click("[data-popen]");
  return app;
}
const rowsOf = app => app.$$("[data-erow]");

test("251: a place's Site profile lists the slotted sites, and picking one draws it and its clock", () => {
  const app = setup();
  const sel = app.$("[data-psite]");
  assert.ok(sel, "the select is there");
  assert.equal(sel.options[0].textContent, "None");
  assert.deepEqual([...sel.querySelectorAll("optgroup")].map(g => g.label), ["Combat Zones", "Genius Loci", "Thin Places", "Gates"], "grouped by kind of ground");
  assert.equal(app.$("[data-psite-profile]"), null);
  pickSite(app, "long-stretch");
  assert.equal(focusedKey(app), "data-psite=", "focus stays on the select");
  assert.deepEqual(pressed(app, "data-pground"), ["thin-places"], "the ground follows the profile");
  const profile = app.$("[data-psite-profile]").textContent;
  assert.ok(profile.includes(book("long-stretch").presence), "the presence text is drawn");
  assert.ok(profile.includes("The Long Stretch") && profile.includes(book("long-stretch").canon));
  assert.equal(app.$$("[data-clock]").length, 1);
  assert.equal(app.$("[data-clockname]").textContent, "Drift");
  assert.equal(app.$(".clock-count").textContent, "0 of 4");
  assert.equal(app.$$("[data-psite] option").find(o => o.selected).textContent, "The Long Stretch");
  // The place's clock is the shared clock code's: + moves it, and so does editing it.
  app.click("[data-clkplus]");
  assert.equal(app.$(".clock-count").textContent, "1 of 4", "the place's clock moved");
  assert.equal(app.window.eval("S.table.clocks[0].filled"), 1);
  app.click("[data-clkedit]");
  both(app, '[data-kf="name"]', "Slip");
  assert.equal(app.$("[data-clockname]").textContent, "Slip", "and it takes an edit");
  app.click("[data-clkdone]");
  assert.deepEqual(app.errors, []);
});

test("251: a place's own kind of ground comes first in the select, and None clears the link and keeps the clocks", () => {
  const app = setup();
  app.click('[data-pground="gates"]');
  app.click("[data-pback]"); app.click("[data-popen]");
  assert.equal(app.$("[data-psite] optgroup").label, "Gates", "read when the page is drawn");
  pickSite(app, "dead-block");
  assert.equal(app.$$("[data-clock]").length, 1, "Attention is copied");
  assert.equal(app.$(".clock-count").textContent, "0 of 4");
  pick(app, "[data-psite]", "");
  assert.equal(app.$("[data-psite-profile]"), null);
  assert.equal(app.$$("[data-clock]").length, 1, "the clock stays");
  assert.deepEqual(pressed(app, "data-pground"), ["combat-zones"], "and so does the ground");
  assert.equal(focusedKey(app), "data-psite=");
  assert.deepEqual(app.errors, []);
});

test("251: with no pack slotted the select is replaced by the line that says why", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "None");
  cityTab(app); cityView(app, "city"); app.click('[data-gadd="old-pike"]'); cityView(app, "places"); app.click("[data-popen]");
  assert.equal(app.$("[data-psite]"), null);
  assert.match(app.$("[data-psite-none]").textContent, /^Slot in a pack with site profiles to use one here\.$/);
  assert.deepEqual(app.errors, []);
});

test("251: a levels track always has one level pressed, and a tap moves it", () => {
  const app = setup();
  pickSite(app, "old-growth");
  const og = book("old-growth").track;
  assert.deepEqual(pressed(app, "data-slevel"), ["tolerant"]);
  assert.equal(app.$("[data-slevel-text]").textContent, og.levels[1].text);
  app.click('[data-slevel="wary"]');
  assert.deepEqual(pressed(app, "data-slevel"), ["wary"]);
  assert.equal(app.$("[data-slevel-text]").textContent, og.levels[2].text);
  assert.equal(app.window.eval("S.table.places[0].siteLevel"), "wary");
  const n = auditLen(app);
  app.click('[data-slevel="wary"]');
  assert.deepEqual(pressed(app, "data-slevel"), ["wary"], "tapping it again leaves it pressed");
  assert.equal(auditLen(app), n, "and records nothing");
  assert.ok(app.$("[data-psite-profile]").textContent.includes(og.moves), "what moves it is drawn");
  assert.equal(app.$("[data-clockname]").textContent, "Lost", "Old Growth's Lost clock is copied");
  assert.match(app.$("[data-clock]").textContent, /0 of 4/);
  pickSite(app, "building-that-remembers");
  assert.equal(app.$$("[data-clock]").length, 1, "its clock is None, so nothing is copied and Lost stays");
  assert.ok(app.$("main, #main").textContent.includes(book("building-that-remembers").clockText), "its clock text is drawn under Clocks");
  assert.deepEqual(pressed(app, "data-slevel"), ["tolerant"], "and its own track starts where the book says");
  assert.deepEqual(app.errors, []);
});

test("251: a stored level the pack lacks shows the start pressed and says so, until a level is tapped", () => {
  const app = setup();
  pickSite(app, "old-growth");
  app.window.eval(`S.table.places[0].siteLevel = "frenzied"; renderTable();`);
  assert.deepEqual(pressed(app, "data-slevel"), ["tolerant"]);
  assert.match(app.$("[data-slevel-stale]").textContent, /^Last set to “frenzied”, which this pack doesn't have\.$/);
  assert.equal(app.$("[data-slevel-stale]").hidden, false);
  app.click('[data-slevel="hostile"]');
  assert.equal(app.$("[data-slevel-stale]").hidden, true);
  assert.deepEqual(pressed(app, "data-slevel"), ["hostile"]);
});

test("251: a table track and a none track draw as text with nothing to press", () => {
  const app = setup();
  pickSite(app, "deep-door");
  const dd = book("deep-door").track;
  assert.equal(app.$$(".site-profile .site-list li").length >= dd.rows.length, true);
  assert.equal(app.$$("[data-slevel], [data-eadd]").length, 0);
  assert.ok(app.$("[data-psite-profile]").textContent.includes(dd.rows[5].text));
  assert.equal(app.$(".clock-count").textContent, "0 of 4", "Widening is copied");
  pickSite(app, "dead-block");
  assert.ok(app.$("[data-psite-profile]").textContent.includes(book("dead-block").trackText));
  assert.deepEqual(app.errors, []);
});

test("251: Exposure rows count per character and show the step reached", () => {
  const app = setup();
  const lp = () => app.$("[data-psite-profile]");
  pickSite(app, "long-stretch");
  const ls = book("long-stretch").track;
  app.click("[data-eadd]");
  assert.equal(rowsOf(app).length, 1);
  assert.equal(focusedKey(app).startsWith("data-ename=0"), true, "Add someone focuses the blank name");
  assert.equal(app.$("[data-ename]").getAttribute("placeholder"), "Who?");
  const n0 = auditLen(app);
  assert.equal(app.$('[data-eplus="0"]').getAttribute("aria-label"), "Add one to row 1");
  both(app, "[data-ename]", "Vex");
  assert.equal(auditLen(app) - n0, 1, "typing is one entry");
  assert.deepEqual(["eminus", "eplus", "edel"].map(k => app.$(`[data-${k}="0"]`).getAttribute("aria-label")), ["Take one off Vex", "Add one to Vex", "Remove Vex"], "the typed name renames the row's buttons");
  // The profile's parts are h3s beside the track's; only the track's own parts sit under it as h4s.
  assert.deepEqual(app.$$("[data-psite-profile] h4").map(h => h.textContent), ["Marks here"]);
  assert.ok(app.$$("[data-psite-profile] h3").map(h => h.textContent).includes("Presence"));
  assert.equal(app.$("[data-undo-toast], .undo-toast") && !app.$(".undo-toast").hidden ? "toast" : "none", "none", "no toast while typing");
  for (let i = 0; i < 4; i++) app.click('[data-eplus="0"]');
  assert.equal(app.$('[data-ecount="0"]').textContent, "4");
  assert.equal(app.$('[data-estep="0"]').textContent, ls.steps[0].text, "the step-3 text");
  assert.equal(app.$('[data-eminus="0"]').disabled, false);
  app.click('[data-eplus="0"]');
  assert.equal(app.$('[data-estep="0"]').textContent, ls.steps[1].text, "5 reaches the second step");
  for (let i = 0; i < 5; i++) app.click('[data-eminus="0"]');
  assert.equal(app.$('[data-ecount="0"]').textContent, "0");
  assert.equal(app.$('[data-eminus="0"]').disabled, true, "− disables at 0");
  assert.equal(focusedKey(app), "data-eplus=0", "and focus moves to +");
  assert.equal(app.$('[data-estep="0"]').textContent, "", "nothing below the first step");
  assert.equal(app.window.eval("JSON.stringify(S.table.places[0].exposure)"), JSON.stringify([{ name: "Vex", n: 0 }]));
  // a second row, then Remove
  app.click("[data-eadd]"); both(app, '[data-ename="1"]', "Dez");
  assert.equal(rowsOf(app).length, 2);
  app.click('[data-edel="0"]');
  assert.equal(rowsOf(app).length, 1);
  assert.equal(app.$("[data-ename]").value, "Dez");
  assert.equal(focusedKey(app).startsWith("data-ename=0"), true, "focus goes to the next row's name");
  app.click('[data-edel="0"]');
  assert.equal(rowsOf(app).length, 0);
  assert.equal(focusedKey(app), "data-eadd=", "or to Add someone");
  assert.ok(lp().textContent.includes(ls.triggers) && lp().textContent.includes(ls.marks), "the triggers and the Marks here are drawn");
  assert.deepEqual(app.errors, []);
});

test("251: with its pack gone, a place keeps its site and says so", () => {
  const app = setup();
  pickSite(app, "long-stretch");
  app.click("[data-eadd]"); both(app, "[data-ename]", "Vex"); app.click('[data-eplus="0"]');
  const store = app.window.localStorage;
  store.removeItem("shadows.pack.v1." + PK);
  app.window.eval("renderTable()");
  assert.equal(app.$("[data-psite-profile]"), null);
  assert.match(app.$("[data-psite-gone]").textContent, /^The Long Stretch: its pack isn't slotted in\.$/);
  assert.ok(app.$("[data-psite]"), "the select is still offered");
  assert.equal(app.$$("[data-clock]").length, 1, "the clocks show");
  assert.equal(app.window.eval("JSON.stringify(S.table.places[0].exposure)"), JSON.stringify([{ name: "Vex", n: 1 }]), "the rows are kept");
  store.setItem("shadows.pack.v1." + PK, JSON.stringify({ pack: Engine.migratePack(sitePack()), imported: "2026-10-05T10:00:00.000Z" }));
  app.window.eval("renderTable()");
  assert.ok(app.$("[data-psite-profile]"), "slotted back, it reads again");
  assert.equal(rowsOf(app).length, 1);
  assert.deepEqual(app.errors, []);
});

test("251: a place's card says its profile and its clocks", () => {
  const app = setup();
  pickSite(app, "long-stretch");
  app.click("[data-pback]");
  assert.match(app.$(".place-card .roster-meta").textContent, /Thin Places · The Long Stretch · 1 clock$/);
  // A file's link may carry no name: the card leaves the profile out rather than an empty part.
  app.window.eval("delete S.table.places[0].site.name; renderTable()");
  assert.match(app.$(".place-card .roster-meta").textContent, /Thin Places · 1 clock$/);
});

test("251: deleting a place asks with its clock count, and Undo from Activity restores both", () => {
  const app = setup();
  pickSite(app, "long-stretch");
  app.click("[data-pdel]");
  assert.match(app.$("#modal").textContent, /Delete The Old Pike\?/);
  assert.match(app.$("#modal").textContent, /Its page goes with it, and its 1 clock\. Lines that named it keep its name, struck through\./);
  app.click("#modal [data-askyes]");
  assert.equal(focusedKey(app), "data-padd-name=");
  assert.equal(app.window.eval("S.table.clocks.length"), 0);
  app.click("[data-menu-toggle]"); app.click("[data-tactivity]");
  assert.match(app.$("#modal [data-act-undo]").textContent, /^Undo: Removed The Old Pike$/);
  app.click("#modal [data-act-undo]");
  app.click("#modal [data-modalclose]");
  app.click("[data-popen]");
  assert.equal(app.$$("[data-clock]").length, 1, "the clock came back");
  assert.ok(app.$("[data-psite-profile]"), "and the profile reads again");
  // a place with no clocks keeps today's text
  app.click("[data-pback]");
  cityView(app, "city"); app.click('[data-gadd="central-park"]'); cityView(app, "places");
  app.click(`[data-popen="${app.window.eval(`S.table.places.find(p => Engine.placeTitle(S.table, p) === "Central Park").id`)}"]`);
  app.click("[data-pdel]");
  assert.match(app.$("#modal").textContent, /Its page goes with it\. Lines that named it keep its name, struck through\./);
  assert.deepEqual(app.errors, []);
});

test("251: Find opens a place's clock on its name, and a place by its profile", () => {
  const app = setup();
  pickSite(app, "long-stretch");
  app.click("[data-pback]");
  castTab(app);
  find(app, "drift", "clock");
  assert.equal(app.$("#topnav .tab.active").textContent.trim(), "City");
  assert.equal(app.$("[data-ptitle]").textContent, "The Old Pike");
  assert.equal(app.doc.activeElement, app.$("[data-clockname]"));
  assert.equal(app.doc.activeElement.textContent, "Drift");
  app.click("[data-pback]");
  castTab(app);
  find(app, "stretch", "place");
  assert.equal(app.$("[data-ptitle]").textContent, "The Old Pike");
  assert.equal(app.doc.activeElement, app.$("[data-ptitle]"));
  assert.deepEqual(app.errors, []);
});

test("251: a faction's clocks behave as before the lift", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Lift");
  cityTab(app); cityView(app, "city");
  app.click('[data-gfadd="eclipse"]'); app.click('[data-gfopen="eclipse"]');
  app.click("[data-clkadd]");
  assert.equal(app.doc.activeElement, app.$('[data-kf="name"]'));
  both(app, '[data-kf="name"]', "Heat");
  both(app, '[data-kf="segments"]', "3");
  assert.equal(app.$$(".clock-box").length, 3);
  both(app, '[data-kf="whenFull"]', "they send someone");
  app.click("[data-clkdone]");
  assert.equal(app.doc.activeElement, app.$("[data-clkedit]"));
  app.click("[data-clkplus]"); app.click("[data-clkplus]"); app.click("[data-clkplus]");
  assert.equal(app.$(".clock-count").textContent, "3 of 3");
  assert.equal(app.$("[data-clkplus]").disabled, true);
  assert.equal(app.doc.activeElement, app.$("[data-clkminus]"), "focus moves to − when + disables");
  assert.equal(app.$("[data-clockfull]").hidden, false);
  assert.match(app.$("[data-clockfull]").textContent, /Full · they send someone/);
  app.click("[data-clkminus]");
  assert.equal(app.$(".clock-count").textContent, "2 of 3");
  app.click("[data-clkedit]");
  type(app, '[data-kf="segments"]', "99");
  assert.equal(app.window.eval("S.table.clocks[0].segments"), 3, "a refused number writes nothing while typing");
  app.$('[data-kf="segments"]').dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(app.$('[data-kf="segments"]').value, "3", "and leaving the field puts back what is stored");
  app.click("[data-clkdel]");
  assert.equal(app.$$("[data-clock]").length, 0);
  assert.equal(app.doc.activeElement, app.$("[data-clkadd]"));
  app.click("[data-clkadd]"); app.click("[data-clkdone]");
  app.click("[data-fback]");
  cityView(app, "factions");
  assert.match(app.$("[data-fcard] .roster-meta").textContent, /1 clock$/, "the faction card says its clock count the same way");
  assert.deepEqual(app.errors, []);
});

test("251: Met here → member → Back, and Key to → Back, still return", () => {
  const app = setup();
  castTab(app); castAdd(app, "Bob");
  cityTab(app); cityView(app, "places");
  const bob = app.window.eval(`S.table.cast.find(n => n.name === "Bob").id`);
  // Key to: a faction names Bob as a key NPC; the member's page links the faction and Back returns.
  cityView(app, "city"); app.click('[data-gfadd="eclipse"]'); app.click('[data-gfopen="eclipse"]');
  both(app, "[data-fkeyadd]", bob);
  app.click(`[data-copen="${bob}"]`);
  app.click("[data-fopen]");
  assert.equal(app.$("[data-fback]").textContent, "Back to Bob");
  app.click("[data-fback]");
  assert.equal(app.$("[data-ctitle]").textContent, "Bob");
  app.click("[data-cback]");
  assert.equal(app.$("[data-ftitle]").textContent, "Eclipse");
  // Met here: a line at the place names Bob; the place's page lists him, and Back returns to the place.
  app.window.eval(`(() => { const t = S.table, p = t.places[0];
    Engine.addInteraction(t, { cast: [${JSON.stringify(bob)}], kind: "shared", text: "Met at the pike", place: p.id }); renderTable(); })()`);
  app.click("[data-fback]");
  cityView(app, "places");
  app.click("[data-popen]");
  const met = app.$$("[data-cwhere]").find(b => b.dataset.cwhere.startsWith("met|"));
  assert.ok(met, "Met here lists Bob");
  app.click(`[data-copen="${bob}"][data-cwhere="met|${bob}"]`);
  assert.equal(app.$("[data-ctitle]").textContent, "Bob");
  app.click("[data-cback]");
  assert.equal(app.$("[data-ptitle]").textContent, "The Old Pike");
  assert.deepEqual(app.errors, []);
});
