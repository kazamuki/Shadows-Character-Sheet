/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: a file reads in (Decision 319, I4). A character, a table or a pack slotted in through Home's Import (or a pack
 * through the Threats tab) prints what the gate let through for about a second over a page that is already open, and lands on
 * one line in the toast. A tap or key ends it and still acts; the same file again, reduced motion, a refusal and Cancel on an
 * older-copy ask don't read in. Where the panel sits is measured in real Chromium (tools/phone-check.mjs), not here.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, importFile, named, sheetHome, GM_ON, GM_OFF, deadAirApp, seedTable, runTable, threatsTab } from "./smokekit.mjs";
import { syntheticPack } from "./packfixture.mjs";

const wait = ms => new Promise(r => setTimeout(r, ms));
const calmed = app => { app.window.matchMedia = media => ({ media, matches: /prefers-reduced-motion:\s*reduce/.test(media), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }); };
const lines = app => app.$$("#readout .ro-line").map(l => l.textContent);
const toast = app => app.$("#undotoast").textContent.replace(/×$/, "").trim();
const clone = o => JSON.parse(JSON.stringify(o));
const homeGm = () => boot({ storage: GM_ON });
const char = (name, over = {}) => { const c = Engine.migrate(named(name)); c.meta.updated = "2026-09-24T10:00:00.000Z"; return Object.assign(c, over); };
const pickPack = async (app, obj) => {
  const input = app.$("#pack-file");
  const file = new app.window.File([JSON.stringify(obj)], "t.shadows-pack.json", { type: "application/json" });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new app.window.Event("change"));
  for (let i = 0; i < 50 && app.$("#pack-file"); i++) await wait(10);
  await wait(20);
};
// importFile returns once the destination opens; a pack stays on Home, so give the reader a beat.
const bring = async (app, obj) => { await importFile(app, obj); await wait(30); };

test("I4: a character reads in: its name, archetype, TAG and record, then lands in the toast", async () => {
  const app = homeGm();
  const c = char("Mara Okonkwo", { sessions: [1, 2, 3].map(n => ({ date: "2026-11-0" + n, title: "", ipEarned: 2, milestonePoint: true, notes: "" })) });
  c.progression.ip.earned = 0;
  await bring(app, c);
  assert.equal(app.window.eval("S.screen"), "sheet", "the sheet wasn't open in the same tick");
  const r = app.$("#readout"); assert.ok(r, "no readout");
  assert.equal(r.getAttribute("aria-hidden"), "true");
  const l = lines(app), tag = Engine.tagNumber(Engine.migrate(clone(c)));
  assert.equal(l[0], "Reading x.shadows.json");
  assert.equal(l[1], "Mara Okonkwo");
  assert.equal(l[2], Engine.archetypeContent(Engine.migrate(clone(c))).name);
  assert.equal(l[3], tag);
  assert.match(l[4], /^3 on the record · 6 IP to spend · 3 MP$/);
  assert.equal(l[l.length - 1], "Mara Okonkwo is in.");
  assert.equal(toast(app), "Mara Okonkwo is in.");
  assert.ok(!app.$("#main #readout"), "the readout sits inside #main");
  await wait(1250);
  assert.equal(app.$("#readout"), null, "the readout didn't take itself off");
  assert.equal(toast(app), "Mara Okonkwo is in.", "the toast went with it");
  assert.deepEqual(app.errors, []);
});

test("I4: a draft reads in as a draft, and a TAGless one as Off grid", async () => {
  const app = homeGm();
  const d = char("Draft Dana"); d.creation.locked = false;
  await bring(app, d);
  assert.equal(app.window.eval("S.screen"), "wizard");
  const l = lines(app);
  assert.ok(l.includes("Still on the intake form")); assert.ok(!l.some(x => /on the record|IP to spend/.test(x)));
  await wait(1250);
  const t = char("Off Ollie"); t.identity.tagless = true; t.meta.id = "TAG-OFFG-RID1-2";
  app.window.eval("goHome()");
  await bring(app, t);
  const m = lines(app);
  assert.ok(m.includes("Off grid"), m.join("|")); assert.ok(!m.some(x => /TAG/.test(x)));
  assert.deepEqual(app.errors, []);
});

test("I4: the load check's findings print as a count, and stay above the sheet", async () => {
  const app = homeGm();
  const c = char("Old Orla"); c.meta.gamedataVersion = "0.0.1"; c.advantages.push({ id: "no-such-advantage", rank: 1 });
  await bring(app, c);
  const issues = app.$$(".import-issues li, .import-issues .issue").length || app.$(".import-issues").textContent;
  assert.ok(issues, "the load check didn't show");
  const n = app.window.eval("(S.importIssues||[]).length");
  const f = lines(app).find(x => /to look at/.test(x));
  assert.ok(f, lines(app).join("|"));
  assert.ok(n === 0 || f.startsWith(String(n)) || /One thing/.test(f));
  assert.ok(/^\d+ to look at, above the sheet$|^One thing/.test(f));
  assert.deepEqual(app.errors, []);
});

test("I4: a table reads in, and its newer-version warning stays in the toast", async () => {
  const app = homeGm();
  const t = Engine.migrateTable(JSON.parse((await import("node:fs")).readFileSync(new URL("../samples/dead-air.shadows-table.json", import.meta.url), "utf8")));
  await bring(app, t);
  assert.equal(app.window.eval("S.screen"), "table");
  const l = lines(app);
  assert.equal(l[1], "Dead Air");
  assert.ok(l.some(x => /sessions/.test(x) && /in the cast/.test(x) && /at the table/.test(x)), l.join("|"));
  assert.ok(l.some(x => /^A fight is on: round \d+$/.test(x)), l.join("|"));
  assert.equal(l[l.length - 1], "Dead Air is open.");
  assert.equal(toast(app), "Dead Air is open.");
  await wait(1250);
  const [t2] = seedTable("Later");
  app.window.eval("goHome()");
  const newer = clone(t2); newer.meta.tableSchemaVersion = "9.0";
  await bring(app, newer);
  assert.match(toast(app), /is open\./); assert.match(toast(app), /newer version of the app/);
  assert.deepEqual(app.errors, []);
});

test("I4: a pack reads in from Home and from the Threats tab, and keeps today's toast", async () => {
  const app = homeGm();
  await bring(app, syntheticPack());
  assert.equal(app.window.eval("S.screen"), "home");
  const l = lines(app);
  assert.equal(l[1], "Test Pack"); assert.ok(l.includes("Version v2 (test)"), l.join("|"));
  assert.ok(l.some(x => /threat/.test(x) || /NPC/.test(x)), l.join("|"));
  assert.equal(toast(app), "Test Pack slotted in: 3 entries.");
  await wait(1250);
  const app2 = boot({ storage: { ...GM_ON } });
  runTable(app2, "Pack Table", { stay: true }); threatsTab(app2);
  await pickPack(app2, syntheticPack());
  assert.ok(app2.$("#readout"), "no readout from the Threats tab");
  assert.equal(lines(app2)[0], "Reading t.shadows-pack.json");
  assert.equal(toast(app2), "Test Pack slotted in: 3 entries.");
  assert.deepEqual(app.errors, []); assert.deepEqual(app2.errors, []);
});

test("I4: an older copy asks first; Open reads it in, Cancel reads nothing", async () => {
  const vex = char("Vex Morrow"); vex.meta.updated = "2026-09-24T10:00:00.000Z";
  const app = boot({ storage: { ...GM_ON, ["shadows.char.v1." + vex.meta.id]: { ch: vex, section: "main", changed: "2026-09-24T10:00:00.000Z", exported: null } } });
  const older = clone(vex); older.meta.updated = "2026-09-23T09:00:00.000Z";
  await bring(app, older);
  assert.ok(app.$("#modal[open]")); assert.equal(app.$("#readout"), null, "read in before the answer");
  app.click("#modal [data-modalclose]");
  assert.equal(app.$("#readout"), null, "Cancel read something in"); assert.ok(!app.$("#undotoast") || app.$("#undotoast").hidden || !/is in/.test(app.$("#undotoast").textContent));
  await bring(app, older);
  app.click("#modal [data-replacego]");
  assert.ok(app.$("#readout"), "Open the older copy didn't read in");
  assert.equal(toast(app), "Vex Morrow is in.");
  assert.deepEqual(app.errors, []);
});

test("I4: the same file twice in a sitting gives the toast only; a newer copy reads in again", async () => {
  const app = homeGm();
  const c = char("Twice Tess");
  await bring(app, c); assert.ok(app.$("#readout")); await wait(1250);
  sheetHome(app);
  await bring(app, c);
  assert.equal(app.$("#readout"), null, "the same file read in twice");
  assert.equal(toast(app), "Twice Tess is in.");
  sheetHome(app);
  const n = clone(c); n.meta.updated = "2026-09-24T10:01:00.000Z";
  await bring(app, n);
  assert.ok(app.$("#readout"), "a newer copy didn't read in");
  assert.equal(app.window.eval("typeof S.readSeen"), "undefined", "read state is in S");
  assert.deepEqual(app.errors, []);
});

test("I4: a tap or a key ends it, and still does what it does", async () => {
  const app = homeGm();
  await bring(app, char("Tap Tilly"));
  assert.ok(app.$("#readout"));
  const tab = app.$$("[data-sec]").find(b => b.dataset.sec && b.dataset.sec !== app.window.eval("S.section"));
  const down = new app.window.Event("pointerdown", { bubbles: true, cancelable: true });
  tab.dispatchEvent(down);
  assert.equal(down.defaultPrevented, false, "the skip stopped the tap");
  assert.equal(app.$("#readout"), null, "a tap didn't end it");
  tab.click();
  assert.equal(app.window.eval("S.section"), tab.dataset.sec, "the tap didn't do its work");
  // A key, on the table: Decision 259's tab keys.
  const app2 = deadAirApp("sessions");
  const t = JSON.parse(JSON.stringify(app2.window.eval("S.table")));
  app2.window.eval("goHome()");
  await bring(app2, t);
  assert.ok(app2.$("#readout"));
  const ke = new app2.window.KeyboardEvent("keydown", { key: "2", bubbles: true, cancelable: true });
  app2.doc.body.dispatchEvent(ke);
  assert.equal(app2.$("#readout"), null, "a key didn't end it");
  assert.equal(ke.defaultPrevented, false);
  assert.deepEqual(app.errors, []); assert.deepEqual(app2.errors, []);
});

test("I4: reduced motion gets the toast only", async () => {
  const app = homeGm(); calmed(app);
  await bring(app, char("Calm Cora"));
  assert.equal(app.$("#readout"), null);
  assert.equal(toast(app), "Calm Cora is in.");
  assert.deepEqual(app.errors, []);
});

test("I4: a refused file never reads in", async () => {
  const app = homeGm();
  await bring(app, { meta: { kind: "shadows-other" } });
  assert.equal(app.$("#readout"), null); assert.match(toast(app), /isn't a character, a table or a pack/);
  const bad = syntheticPack(); bad.meta.id = "PK-bad";
  await bring(app, bad);
  assert.equal(app.$("#readout"), null); assert.match(toast(app), /no id/);
  const full = app.window.localStorage.setItem; app.window.Storage.prototype.setItem = function () { throw new Error("full"); };
  await bring(app, syntheticPack());
  assert.equal(app.$("#readout"), null); assert.match(toast(app), /out of room/);
  const off = boot(GM_OFF);
  await bring(off, syntheticPack());
  assert.equal(off.$("#readout"), null); assert.match(toast(off), /That file isn't a character\./);
  void full;
});

test("I4: the page under it is today's page", async () => {
  const fixed = { character: char("Same Sam"), pack: syntheticPack() };
  const run = async (kind, stub) => {
    const app = kind === "table" ? deadAirApp("sessions") : homeGm();
    if (stub) app.window.eval("readIn = function(){}");
    const file = kind === "character" ? clone(fixed.character) : kind === "pack" ? clone(fixed.pack) : clone(app.window.eval("S.table"));
    if (kind === "table") app.window.eval("goHome()");
    await bring(app, file);
    return { main: app.$("#main").innerHTML, focus: app.window.document.activeElement && app.window.document.activeElement.outerHTML.slice(0, 120), screen: app.window.eval("S.screen") };
  };
  for (const kind of ["character", "table", "pack"]) {
    const a = await run(kind, false), b = await run(kind, true);
    assert.deepEqual(a, b, `${kind}: the page differs`);
  }
});

test("I4: readoutLines never throws, and reads hostile names as text", async () => {
  const app = homeGm();
  const call = (k, o) => app.window.eval(`readoutLines(${JSON.stringify(k)}, ${o}, {})`);
  for (const k of ["character", "table", "pack"]) for (const o of ["null", "{}", "[]", "undefined", "5", '"x"']) {
    const r = call(k, o);
    assert.ok(Array.isArray(r.lines) && typeof r.last === "string" && r.lines.every(x => typeof x === "string") && r.lines.length <= 7, `${k} ${o}`);
  }
  for (const [k, o] of [["character", '{identity:{name:"A"},sessions:"x",creation:{locked:true}}'], ["pack", '{meta:{name:"P"},entries:5}'], ["table", '{meta:{name:"T"},players:{},cast:3,sessions:"s"}']]) call(k, o);
  const c = char("<img src=x onerror=alert(1)>");
  await bring(app, c);
  assert.ok(app.$("#readout")); assert.equal(app.$("#readout img"), null, "a name was set as HTML");
  assert.ok(lines(app).some(x => x.includes("<img")));
  assert.deepEqual(app.errors, []);
});
