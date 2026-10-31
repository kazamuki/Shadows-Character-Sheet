/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: GM encounters, sessions, the close-out, the Reference, the
 * secretary and the activity log.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot } from "./harness.mjs";
import { syntheticPack, PACK_ID } from "./packfixture.mjs";
import { Engine, lockedCharacter, openSheet, clickIn, withDownloads, importFile, card, tipShown, GM_ON, GM_OFF, tableKeys, tableCard, type, runTable, notesTab, tableHome, tableFile, keyIn, castAdd, pick, threatsTab, tableWithPack, entryButton } from "./smokekit.mjs";

// ── The Encounters tab (Decisions 188–190) ─────────────────────────────
const encTab = app => app.click('[data-tsec="encounters"]');
const changeTo = (app, sel, value) => {
  const el = app.$(sel);
  el.value = value;
  el.dispatchEvent(new app.window.Event("change", { bubbles: true }));
};
const submit = (app, sel) => app.$(sel).dispatchEvent(new app.window.Event("submit", { bubbles: true, cancelable: true }));
const encRowByName = (app, name) => app.$$("[data-erow]").find(li => li.querySelector(".enc-name").textContent === name);
const encId = (app, i = 0) => app.window.eval(`S.table.encounters[${i}].id`);
const rowId = (li) => li.dataset.erow;
const newEncounter = (app, name) => { type(app, "[data-enc-name]", name); app.click("[data-enc-new]"); };
const addPcRow = (app, name) => { type(app, "[data-enc-pcname]", name); app.click("[data-enc-addpc]"); return encRowByName(app, name); };
const statesOf = app => JSON.parse(app.window.eval("JSON.stringify(S.table.encounters)"));

test("Decision 188: switched off there is no Encounters tab; switched on it sits between Threats and Notes (Reference follows it)", () => {
  const off = boot(GM_OFF);
  assert.equal(off.$("#btn-run-table"), null);
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  assert.deepEqual(app.$$("[data-tsec]").map(b => b.dataset.tsec), ["sessions", "players", "cast", "city", "threats", "encounters", "reference", "notes"]);
  encTab(app);
  assert.match(app.$("#main").textContent, /Nothing on the books\./);
  assert.deepEqual(app.errors, []);
});

test("Decisions 188–189: plan an encounter, run a round with Take, Bleeding and Burning at Reset, and end it", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  app.window.eval(`Engine.addCastMember(S.table, { name: "Dez" }); Engine.setCastBlock(S.table, S.table.cast[0].id, { stats: { BOD: 4 }, skills: [] });`);
  encTab(app);
  newEncounter(app, "Warehouse job");
  assert.equal(app.doc.activeElement, app.$("[data-enc-title]"), "New encounter didn't put the keyboard in the name");
  assert.equal(app.$("[data-enc-title]").value, "Warehouse job");
  // Rows: a PC, then a cast member from the picker (which stays open and says Already in).
  const wren = addPcRow(app, "Wren");
  assert.equal(app.doc.activeElement, app.$("[data-enc-pcname]"), "Add a PC didn't return to the name field");
  assert.equal(app.$("[data-enc-pcname]").value, "");
  changeTo(app, `[data-ehp="${rowId(wren)}"]`, "30"); changeTo(app, `[data-elevels="${rowId(wren)}"]`, "6");
  app.click("[data-enc-pick]");
  app.click("[data-enc-addcast]");
  assert.match(app.$("[data-encpicklist]").textContent, /Already in/);
  const dez = encRowByName(app, "Dez");
  assert.ok(dez, "the cast member isn't a row");
  // Results: the order re-sorts, a tie is flagged on both rows.
  changeTo(app, `[data-eorder="${rowId(encRowByName(app, "Dez"))}"]`, "9");
  changeTo(app, `[data-eorder="${rowId(encRowByName(app, "Wren"))}"]`, "9");
  assert.equal(app.$$(".enc-tied").length, 2, "a tie wasn't flagged on both rows");
  assert.equal(app.doc.activeElement, app.$(`[data-eorder="${rowId(encRowByName(app, "Wren"))}"]`), "the field lost the keyboard when the rows moved");
  changeTo(app, `[data-eorder="${rowId(encRowByName(app, "Wren"))}"]`, "12");
  assert.deepEqual(app.$$("[data-erow] .enc-name").map(x => x.textContent), ["Wren", "Dez"]);
  assert.equal(app.$$(".enc-tied").length, 0);
  // Start.
  app.click("[data-enc-start]");
  assert.equal(app.doc.activeElement, app.$("[data-enext]"), "Start didn't land on Next");
  assert.match(app.$(".enc-status").textContent, /Round 1/);
  assert.equal(app.$$("[aria-current=step] .enc-name").map(x => x.textContent).join(), "Wren");
  // Take 12 on the PC: HP, damage taken, Health Levels and the data's Pain for two levels lost.
  app.click(`[data-edmg="${rowId(encRowByName(app, "Wren"))}|1"]`);
  assert.equal(app.doc.activeElement, app.$("[data-edmgn]"));
  app.$("[data-edmgn]").value = "12"; submit(app, "[data-edmgform]");
  const painLabel = app.D.resources.healthLevels.painLevels.find(p => p.hlLostThreshold === 2).label;
  assert.match(encRowByName(app, "Wren").textContent, new RegExp(`HP 18 / 30 · 12 taken · 4 of 6 Health Levels · ${painLabel}`));
  assert.equal(app.doc.activeElement, app.$(`[data-edmg="${rowId(encRowByName(app, "Wren"))}|1"]`), "OK didn't return to Take");
  // Heal 2 puts it back.
  app.click(`[data-edmg="${rowId(encRowByName(app, "Wren"))}|-1"]`); app.$("[data-edmgn]").value = "2"; submit(app, "[data-edmgform]");
  assert.match(encRowByName(app, "Wren").textContent, /HP 20 \/ 30 · 10 taken/);
  // Conditions: a refusal shows in the picker; Bleeding with a source and rounds; Burning.
  const wid = rowId(encRowByName(app, "Wren"));
  app.click(`[data-econdopen="${wid}"]`);
  assert.equal(app.doc.activeElement, app.$("[data-econd-id]"));
  changeTo(app, "[data-econd-id]", "bleeding");
  type(app, "[data-econd-src]", "Corner Shot's burst"); type(app, "[data-econd-rounds]", "1");
  app.click("[data-econd-add]");
  assert.match(encRowByName(app, "Wren").textContent, /Bleeding/); assert.match(encRowByName(app, "Wren").textContent, /1 round/); assert.match(encRowByName(app, "Wren").textContent, /Corner Shot's burst/);
  app.click(`[data-econdopen="${wid}"]`); changeTo(app, "[data-econd-id]", "bleeding"); app.click("[data-econd-add]");
  assert.match(app.$("[data-econdform] .enc-err").textContent, /Already Bleeding/);
  changeTo(app, "[data-econd-id]", "burning"); type(app, "[data-econd-rounds]", "3"); app.click("[data-econd-add]");
  assert.equal(app.$("[data-econdform]"), null);
  assert.ok(app.$(`${attrSelTest("data-erow", wid)} .enc-cond [data-tip="condition"]`), "the Condition's rule isn't a tap away");
  // Next to the end: Dez, then Reset.
  app.click("[data-enext]");
  assert.equal(app.$$("[aria-current=step] .enc-name").map(x => x.textContent).join(), "Dez");
  app.click("[data-enext]");
  assert.match(app.$("#main").textContent, /Reset: round 1 ends/);
  const fin = app.$("[data-efinish]");
  assert.equal(fin.disabled, true, "Finish was open with a Burning number missing");
  assert.match(app.$("#main").textContent, /Bleeding: 1 HP/);
  assert.match(app.$("#main").textContent, /Runs out now/);
  assert.match(app.$("#main").textContent, /Nothing on: Dez\./);
  const src = app.$(`[data-esrc^="${wid}|"]`);
  src.value = "3"; src.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  assert.equal(app.$("[data-efinish]").disabled, false);
  app.click("[data-efinish]");
  assert.match(app.$(".enc-status").textContent, /Round 2/);
  const e = statesOf(app)[0], w = e.rows.find(r => r.id === wid);
  assert.equal(w.damage, 10 + 1 + 3, "Bleeding 1 and Burning 3 ticked");
  assert.deepEqual(w.conditions.map(c => [c.id, c.rounds]), [["burning", 2]], "Bleeding ran out, Burning counted down");
  assert.equal(app.doc.activeElement, app.$("[data-enext]"));
  // End it: it heads Past encounters.
  app.click("[data-enc-end]"); app.click("[data-ew-end]");
  assert.equal(app.doc.activeElement, app.$("[data-enc-new]"));
  assert.match(app.$("#main").textContent, /Past encounters/); assert.match(app.$("#main").textContent, /Warehouse job/);
  app.click("[data-enc-open]");
  assert.equal(app.$("[data-edmg]"), null, "an ended encounter has controls");
  assert.equal(app.$("[data-eorder]"), null);
  assert.match(app.$("#main").textContent, /Ended · 2 rounds/);
  assert.deepEqual(app.errors, []);
});

const attrSelTest = (name, v) => `[${name}="${String(v).replace(/["\\]/g, "\\$&")}"]`;

test("Decision 189: Keep leaves a Condition at 1 round; Dying's check is named; marks move; Out is skipped by Next", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  encTab(app); newEncounter(app, "E");
  const a = addPcRow(app, "A"), b = addPcRow(app, "B"), c = addPcRow(app, "C");
  const [ia, ib, ic] = [a, b, c].map(rowId);
  for (const [id, n] of [[ia, 9], [ib, 8], [ic, 7]]) changeTo(app, `[data-eorder="${id}"]`, String(n));
  // B is Out: open More, press Out.
  app.$(`[data-emore="${ib}"] summary`).click();
  app.click(`[data-eout="${ib}"]`);
  assert.equal(app.$(`[data-erow="${ib}"]`).classList.contains("out"), true);
  assert.equal(app.doc.activeElement, app.$(`[data-eout="${ib}"]`));
  for (const [id, cond, rounds] of [[ia, "deafened", "1"], [ic, "dying", ""]]) {
    app.click(`[data-econdopen="${id}"]`); changeTo(app, "[data-econd-id]", cond); type(app, "[data-econd-rounds]", rounds); app.click("[data-econd-add]");
  }
  app.click("[data-enc-start]");
  app.click("[data-enext]");
  assert.equal(app.$$("[aria-current=step]").map(x => x.dataset.erow).join(), ic, "Next skipped Out");
  app.click("[data-enext]");
  assert.match(app.$("#main").textContent, new RegExp(`Dying: ${app.D.damageRules.whileDying.resetCheck}`));
  app.click(`[data-emarks$="|1"]`);
  assert.match(app.$(".enc-reset").textContent, /Death Marks 1\/3/);
  // Deafened: End is pressed; Keep keeps it.
  const keep = app.$(`[data-ekeep="${ia}|0|keep"]`), end = app.$(`[data-ekeep="${ia}|0|end"]`);
  assert.equal(end.getAttribute("aria-pressed"), "true");
  keep.click();
  assert.equal(app.$(`[data-ekeep="${ia}|0|keep"]`).getAttribute("aria-pressed"), "true");
  app.click("[data-efinish]");
  const e = statesOf(app)[0];
  assert.deepEqual(e.rows.find(r => r.id === ia).conditions.map(x => [x.id, x.rounds]), [["deafened", 1]]);
  assert.equal(e.round, 2);
  assert.equal(e.rows.find(r => r.id === ic).conditions[0].marks, 1);
  assert.deepEqual(app.errors, []);
});

test("Decision 190: Add to cast and Add to the encounter open; two planned, the button names the one open; a group adds every member", () => {
  const app = tableWithPack();
  app.window.eval(`Engine.addEncounter(S.table, { name: "First" }); Engine.addEncounter(S.table, { name: "Second" });`);
  entryButton(app, "gull").click();
  assert.equal(app.$("[data-tuse]").textContent, "Add to cast");
  assert.equal(app.$("[data-tenc]").textContent, "Add to Second", "with none open, the newest planned (211)");
  app.click('[data-tsec="encounters"]');
  app.$$("[data-enc-open]").find(b => b.textContent === "Second").click();
  app.click('[data-tsec="threats"]');
  assert.equal(app.window.eval("S.threatOpen"), null, "the Threats tab kept its page across a tab switch");
  entryButton(app, "gull").click();
  assert.equal(app.$("[data-tenc]").textContent, "Add to Second");
  const btn = app.$("[data-tenc]"); btn.focus();
  app.click("[data-tenc]"); app.click("[data-tenc]");
  assert.match(app.$("#undotoast").textContent, /Gull 2 is in Second\./);
  assert.equal(app.window.eval("S.tsection"), "threats", "the page didn't stay");
  assert.equal(app.$("[data-tenc]"), btn, "the page was redrawn under the button");
  assert.equal(app.doc.activeElement, btn);
  const ids = app.window.eval("S.table.encounters.map(e => e.name + ':' + e.rows.map(r => r.name).join('|'))");
  assert.deepEqual([...ids], ["Second:Gull|Gull 2", "First:"]);
  assert.equal(app.window.eval("S.table.cast.length"), 0, "Add to the encounter touched the cast");
  // A group: every member, and back on the list the button names the other one.
  app.click("[data-tback]"); app.click('[data-tview="group"]'); app.click("[data-tgroup]");
  assert.equal(app.$("[data-tgrpenc]").textContent, "Add to Second");
  app.click("[data-tgrpenc]");
  assert.match(app.$("#undotoast").textContent, /Pier Watch: 4 added to Second\./);
  assert.equal(app.window.eval("S.table.encounters[0].rows.length"), 6);
  app.click('[data-tsec="encounters"]'); app.click("[data-enc-back]");
  app.$$("[data-enc-open]").find(b => b.textContent === "First").click();
  app.click('[data-tsec="threats"]'); app.click('[data-tview="group"]'); app.click("[data-tgroup]");
  assert.equal(app.$("[data-tgrpenc]").textContent, "Add to First");
  // Add to cast does what Use did.
  app.click("[data-tback]"); app.click('[data-tview="threat"]'); entryButton(app, "gull").click(); app.click("[data-tuse]");
  assert.equal(app.window.eval("S.tsection"), "cast");
  assert.equal(app.window.eval("S.table.cast.length"), 1);
  // A cast member's page offers the encounter, and Back from a row returns to it.
  assert.equal(app.$("[data-cenc]").textContent, "Add to First");
  app.click("[data-cenc]");
  assert.match(app.$("#undotoast").textContent, /Gull is in First\./);
  app.click("[data-cenc]");
  assert.match(app.$("#undotoast").textContent, /Already in\./);
  app.click('[data-tsec="encounters"]');
  assert.ok(app.$("[data-enc-back]"), "the encounter wasn't kept open");
  app.click("[data-eopencast]");
  assert.equal(app.$("[data-cback]").textContent, "Back to First");
  app.click("[data-cback]");
  assert.equal(app.window.eval("S.tsection"), "encounters");
  assert.ok(app.$("[data-enc-title]"));
  assert.equal(app.doc.activeElement, app.$("[data-eopencast]"));
  assert.deepEqual(app.errors, []);
});

test("Decision 188: an ended encounter offers no Add to, a cast row survives its member being removed, and export keeps the encounters", async () => {
  const app = tableWithPack(); const downloads = withDownloads(app);
  app.window.eval(`Engine.addCastMember(S.table, { name: "Dez" }); Engine.addEncounter(S.table, { name: "Done" }); Engine.addParticipant(S.table, S.table.encounters[0].id, { kind: "cast", id: S.table.cast[0].id });`);
  app.click('[data-tsec="encounters"]'); app.click("[data-enc-open]");
  app.click("[data-eopencast]"); app.click("[data-cdel]"); app.click("#modal [data-askyes]");
  app.click('[data-tsec="encounters"]');
  const li = app.$("[data-erow]");
  assert.equal(li.querySelector(".enc-name").textContent, "Dez");
  assert.equal(li.querySelector("[data-eopencast]"), null, "a removed member is a button");
  assert.match(li.textContent, /0 taken/);
  app.click("[data-enc-end]"); app.click("#modal [data-askyes]");
  app.click('[data-tsec="threats"]'); entryButton(app, "gull").click();
  assert.equal(app.$("[data-tenc]").textContent, "Add to a new encounter", "an ended encounter is never a target (211)");
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  const file = await tableFile(downloads[0]);
  assert.equal(file.encounters.length, 1); assert.equal(file.encounters[0].status, "ended");
  const fresh = boot({ storage: GM_ON }); withDownloads(fresh);
  await importFile(fresh, file);
  assert.equal(JSON.parse(fresh.window.eval("JSON.stringify(S.table.encounters)"))[0].rows[0].name, "Dez");
  assert.deepEqual([...app.errors, ...fresh.errors], []);
});

test("Decision 188: export and import mid-round and at Reset keep the same encounter and turn", async () => {
  const app = boot({ storage: GM_ON }); const downloads = withDownloads(app);
  runTable(app, "T"); encTab(app); newEncounter(app, "E");
  const a = addPcRow(app, "A"), b = addPcRow(app, "B");
  changeTo(app, `[data-eorder="${rowId(a)}"]`, "5"); changeTo(app, `[data-eorder="${rowId(b)}"]`, "3");
  app.click("[data-enc-start]"); app.click("[data-enext]");
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  let file = await tableFile(downloads[0]);
  assert.equal(file.encounters[0].turn, rowId(b)); assert.equal(file.encounters[0].round, 1);
  app.click("[data-enext]");
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  file = await tableFile(downloads[1]);
  assert.equal(file.encounters[0].turn, null); assert.equal(file.encounters[0].status, "running");
  const fresh = boot({ storage: GM_ON }); withDownloads(fresh);
  await importFile(fresh, file);
  fresh.click('[data-tsec="encounters"]');
  assert.match(fresh.$("#main").textContent, /Round 1/);
  fresh.click("[data-enc-open]");
  assert.match(fresh.$("#main").textContent, /Reset: round 1 ends/);
  assert.deepEqual([...app.errors, ...fresh.errors], []);
});

// ── Fix round (review of #126) ─────────────────────────────────────────
test("Decision 189 (review): the Encounters tab's listeners on <main> go when the table closes; Done tags who has acted; a negative Take is refused; Dying shows the marks and the check (Decision 220)", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); encTab(app); newEncounter(app, "E");
  const a = addPcRow(app, "A"), b = addPcRow(app, "B");
  const [ia, ib] = [a, b].map(rowId);
  changeTo(app, `[data-eorder="${ia}"]`, "9"); changeTo(app, `[data-eorder="${ib}"]`, "5");
  app.click(`[data-econdopen="${ia}"]`); changeTo(app, "[data-econd-id]", "dying"); app.click("[data-econd-add]");
  app.click(`[data-econdopen="${ia}"]`); changeTo(app, "[data-econd-id]", "bleeding"); app.click("[data-econd-add]");
  app.click("[data-enc-start]"); app.click("[data-enext]");
  assert.match(app.$(`[data-erow="${ia}"]`).textContent, /Done/);
  assert.doesNotMatch(app.$(`[data-erow="${ib}"]`).textContent, /Done/);
  // A negative number in Take or Heal is refused, not applied.
  app.click(`[data-edmg="${ib}|1"]`);
  assert.equal(app.$("[data-edmgn]").min, "0");
  app.$("[data-edmgn]").value = "-4"; submit(app, "[data-edmgform]");
  assert.match(app.$("#undotoast").textContent, /Enter a whole number\./);
  assert.equal(app.window.eval("S.table.encounters[0].rows.find(r => r.id === " + JSON.stringify(ib) + ").damage"), 0);
  app.click("[data-edmgcancel]");
  app.click("[data-enext]");
  const W = app.D.damageRules.whileDying;
  assert.match(app.$(".enc-reset").textContent, /1 source ticked/);
  assert.match(app.$(".enc-reset").textContent, new RegExp(W.resetCheck), "Decision 220: the check is asked beside the marks");
  assert.ok(app.$("main").onclick, "the tab's listener wasn't there to begin with");
  app.click("[data-menu-toggle]"); app.click("[data-thome]");
  for (const k of ["onclick", "onchange", "oninput", "onsubmit", "onkeydown"]) assert.equal(app.$("main")[k], null, `main.${k} survived the table`);
  assert.deepEqual(app.errors, []);
});

// ── The hit (Decisions 191–192) ────────────────────────────────────────
const JACKET_LINE = "Leather Jacket (PROT 1d4, RES +2, INT 10, Medium Coverage, Uncommon, 1 mod, 175Ç)";
// A running encounter with Dez (BOD 8, a Leather Jacket, two traits) as a cast row and Wren as a PC row.
const hitApp = (block = {}) => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  app.window.eval(`Engine.addCastMember(S.table, { name: "Dez" }); Engine.setCastBlock(S.table, S.table.cast[0].id, ${JSON.stringify({
    stats: { BOD: 8 }, armor: [JACKET_LINE], traits: [{ name: "Cold", text: "Never flinches." }, { name: "Loud", text: "Shouts." }], ...block })});
    const e = Engine.addEncounter(S.table, { name: "Job" }).id;
    Engine.addParticipant(S.table, e, { kind: "cast", id: S.table.cast[0].id });
    Engine.editParticipant(S.table, e, Engine.addParticipant(S.table, e, { kind: "pc", name: "Wren" }).id, { hp: 30, levels: 6 });
    Engine.editParticipant(S.table, e, S.table.encounters[0].rows[0].id, { order: 9 });
    Engine.startEncounter(S.table, e);`);
  encTab(app);
  app.click("[data-enc-open]");
  return app;
};
const hitBtn = (app, name) => app.$(`[data-ehit="${rowId(encRowByName(app, name))}"]`);
const preview = app => app.$("[data-ehit-preview]").textContent;
const fillHit = (app, damage, kind = "ballistic", from = "") => {
  type(app, "[data-ehit-damage]", String(damage)); changeTo(app, "[data-ehit-type]", kind);
  if (from) type(app, "[data-ehit-from]", from);
};

test("Decision 191: the armor line, then a hit previews what the armor stops and Apply lands it on the row", () => {
  const app = hitApp();
  const dez = () => encRowByName(app, "Dez");
  assert.match(dez().querySelector(".enc-armor").textContent, /^Leather Jacket · stops 5 · INT 10\/10$/);
  assert.equal(app.$$(".enc-armor").length, 1, "PC rows show no armor line");
  assert.ok(hitBtn(app, "Wren"), "a PC row has Hit too");
  hitBtn(app, "Dez").click();
  assert.equal(app.doc.activeElement, app.$("[data-ehit-damage]"), "Hit didn't land on Damage");
  assert.equal(preview(app), "Enter the damage.");
  for (const g of app.$$("[data-ehitpanel] [role=group]")) assert.ok((g.getAttribute("aria-label") || "").trim() || g.getAttribute("aria-labelledby"), "a toggle group in the Hit panel has no accessible name");
  assert.ok(app.$$("[data-ehitpanel] [role=group]").length >= 2, "the Hit panel's toggle groups weren't found");
  assert.ok(app.$("[data-ehit-apply]").disabled, "Apply was live with no damage");
  fillHit(app, 12, "ballistic", "Rook's SMG");
  assert.equal(preview(app), "Leather Jacket stops 5 (PROT 3 + RES 2) · 7 through · 1 Health Level");
  assert.match(app.$(".enc-hit").textContent, /Enemy armor is static and doesn't roll\./);
  assert.equal(app.$("[data-ehit-damage]").value, "12", "typing in a later field cleared an earlier one");
  const bleeding = app.$('[data-ehit-cond="bleeding"]');
  assert.ok(bleeding, "Bleeding isn't offered"); assert.equal(bleeding.checked, false);
  assert.ok(app.$('.enc-hit [data-tip="condition"][data-term="bleeding"]'), "the Condition's rule isn't a tap away");
  bleeding.click();
  app.click("[data-ehit-apply]");
  assert.equal(app.$("[data-ehitpanel]"), null, "the panel stayed open");
  assert.match(dez().textContent, /HP 33 \/ 40 · 7 taken · 7 of 8 Health Levels/);
  assert.match(dez().querySelector(".enc-conds").textContent, /Bleeding/); assert.match(dez().querySelector(".enc-conds").textContent, /Rook's SMG/);
  assert.equal(app.doc.activeElement, hitBtn(app, "Dez"), "Apply didn't return to Hit");
  // A soaked hit costs the piece 1 INT.
  hitBtn(app, "Dez").click(); fillHit(app, 4); app.click("[data-ehit-apply]");
  assert.match(dez().querySelector(".enc-armor").textContent, /INT 9\/10/);
  // Cancel returns to Hit and writes nothing.
  const before = JSON.stringify(statesOf(app));
  hitBtn(app, "Dez").click(); fillHit(app, 50); app.click("[data-ehit-cancel]");
  assert.equal(app.$("[data-ehitpanel]"), null); assert.equal(app.doc.activeElement, hitBtn(app, "Dez"));
  assert.equal(JSON.stringify(statesOf(app)), before);
  assert.deepEqual(app.errors, []);
});

test("Decision 192: Shock and At Zero show the check and the Conditions, never the rule's own words; Failed adds them, unanswered adds nothing", () => {
  const app = hitApp();
  const dez = () => encRowByName(app, "Dez"), conds = () => statesOf(app)[0].rows.find(r => r.name === "Dez").conditions.map(c => [c.id, c.source]);
  hitBtn(app, "Dez").click(); fillHit(app, 30, "ballistic", "Rook");
  const panel = app.$("[data-ehitpanel]").textContent;
  assert.match(panel, /Shock: BOD Essence Check TN 8 TH 2\. Failed: Unconscious, Prone\./);
  assert.doesNotMatch(panel, /took half|\byour\b/i, "a prompt's own words reached the GM's panel");
  assert.equal(app.$$("[data-ehit-ans]").length, 2);
  const fail = () => app.$('[data-ehit-ans="shock|fail"]');
  fail().click();
  assert.equal(fail().getAttribute("aria-pressed"), "true"); assert.equal(app.doc.activeElement, fail(), "Failed lost the keyboard");
  fail().click();
  assert.equal(fail().getAttribute("aria-pressed"), "false", "a second press clears the answer");
  fail().click();
  app.click("[data-ehit-apply]");
  assert.deepEqual(JSON.parse(JSON.stringify(conds())), [["unconscious", "Rook"], ["prone", "Rook"]]);
  assert.match(dez().querySelector(".enc-conds").textContent, /Unconscious/);
  // To zero: the At Zero prompt; left unanswered the row reads Down and gains nothing.
  hitBtn(app, "Dez").click(); fillHit(app, 60);
  assert.match(app.$("[data-ehitpanel]").textContent, /At zero: WILL Essence Check TN 8 TH 2\. Passed: Unconscious, Prone\. Failed: Dying\./);
  app.click("[data-ehit-apply]");
  assert.match(dez().textContent, /Down/); assert.equal(conds().length, 2);
  // Down and hit again: At Zero is asked again; Failed is Dying; then a hit while Dying is a Death Mark.
  hitBtn(app, "Dez").click(); fillHit(app, 20);
  app.click('[data-ehit-ans="atZero|fail"]'); app.click("[data-ehit-apply]");
  assert.ok(conds().some(c => c[0] === "dying"));
  hitBtn(app, "Dez").click(); fillHit(app, 20);
  assert.match(app.$("[data-ehitpanel]").textContent, /Dying: this hit is a Death Mark\./);
  app.click("[data-ehit-apply]");
  assert.match(dez().querySelector(".enc-conds").textContent, /Death Marks 1\/3/);
  assert.deepEqual(app.errors, []);
});

test("Decision 191: Massive takes Health Levels and scraps the armor; an arm on a Light piece isn't covered; AP skips RES", () => {
  const app = hitApp({ armor: ["Kevlar Vest (PROT 1d6, RES +2, INT 20, Light Coverage, Mid, 900Ç)"] });
  const dez = () => encRowByName(app, "Dez");
  assert.match(dez().querySelector(".enc-armor").textContent, /^Kevlar Vest · stops 6 · INT 20\/20$/);
  hitBtn(app, "Dez").click(); fillHit(app, 12); changeTo(app, "[data-ehit-loc]", "left-arm");
  assert.equal(preview(app), "Not covered: Left Arm · 12 through · 2 Health Levels");
  changeTo(app, "[data-ehit-loc]", "torso"); app.click("[data-ehit-ap]");
  assert.equal(preview(app), "Kevlar Vest stops 4 (PROT 4) · RES doesn't apply: AP · 8 through · 1 Health Level");
  changeTo(app, "[data-ehit-type]", "energy"); app.click("[data-ehit-ap]");
  assert.match(preview(app), /RES doesn't apply: not against Energy/);
  assert.equal(app.doc.activeElement, app.$("[data-ehit-ap]"));
  app.click('[data-ehit-cat="massive"]');
  type(app, "[data-ehit-damage]", "25");
  assert.equal(preview(app), "Massive: 3 Health Levels gone · Kevlar Vest scrapped");
  app.click("[data-ehit-apply]");
  assert.match(dez().textContent, /5 of 8 Health Levels/);
  assert.match(dez().querySelector(".enc-armor").textContent, /^Kevlar Vest · Scrap$/);
  assert.equal(statesOf(app)[0].rows[0].massive, 3);
  assert.deepEqual(app.errors, []);
});

test("Decision 191: a PC row takes what got through; Shock and At Zero are reminders with nothing to answer", () => {
  const app = hitApp();
  const wren = () => encRowByName(app, "Wren");
  hitBtn(app, "Wren").click();
  assert.match(app.$("[data-ehitpanel]").textContent, /Got through/);
  assert.equal(app.$("[data-ehit-ap]"), null, "a PC row has no AP");
  fillHit(app, 12, "ballistic");
  assert.equal(preview(app), "12 through · 2 Health Levels");
  app.$('[data-ehit-cond="bleeding"]').click();
  app.click("[data-ehit-apply]");
  assert.match(wren().textContent, /HP 18 \/ 30 · 12 taken · 4 of 6 Health Levels/);
  assert.match(wren().querySelector(".enc-conds").textContent, /Bleeding/);
  hitBtn(app, "Wren").click(); fillHit(app, 15, "energy");
  assert.match(app.$("[data-ehitpanel]").textContent, /Shock: they make a BOD Essence Check TN 8 TH 2 on their sheet\. Failed: Unconscious, Prone\./);
  assert.equal(app.$$("[data-ehit-ans]").length, 0, "a PC row's Shock is a reminder, not a question");
  app.click('[data-ehit-cat="massive"]');
  assert.match(app.$("[data-ehitpanel]").textContent, /Health Levels gone/);
  type(app, "[data-ehit-damage]", "2");
  assert.equal(preview(app), "Massive: 2 Health Levels gone");
  app.click("[data-ehit-apply]");
  assert.match(wren().textContent, /HP 8 \/ 30/); assert.equal(statesOf(app)[0].rows.find(r => r.name === "Wren").massive, 2);
  // A cast member with no BOD has no Hit.
  app.window.eval(`Engine.addCastMember(S.table, { name: "Ivo" }); Engine.addParticipant(S.table, S.table.encounters[0].id, { kind: "cast", id: S.table.cast.find(n => n.name === "Ivo").id }); renderTable();`);
  assert.equal(hitBtn(app, "Ivo"), null);
  assert.deepEqual(app.errors, []);
});

test("Decision 192: the active row lists its traits, and a trait's text is a tap away; Next keeps a Hit panel open on its row", () => {
  const app = hitApp();
  const active = () => app.$("[aria-current=step]");
  assert.match(active().querySelector(".enc-traits").textContent, /Traits:\s*Cold\s*Loud/);
  clickIn(app, active().querySelector('[data-tip="enctrait"]'));
  assert.match(tipShown(app), /Never flinches\./);
  assert.equal(app.$$(".enc-traits").length, 1, "only the active row shows its traits");
  hitBtn(app, "Dez").click(); fillHit(app, 5);
  app.click("[data-enext]");
  assert.equal(app.$$("[aria-current=step] .enc-name").map(x => x.textContent).join(), "Wren");
  assert.ok(app.$("[data-ehitpanel]"), "Next closed the panel");
  assert.equal(app.$("[data-ehit-damage]").value, "5", "its fields were lost");
  assert.equal(app.doc.activeElement, app.$("[data-enext]"));
  assert.equal(app.$(".enc-traits"), null, "a row with no traits shows none");
  // Opening Take closes Hit, and the other way round.
  app.click(`[data-edmg="${rowId(encRowByName(app, "Wren"))}|1"]`);
  assert.equal(app.$("[data-ehitpanel]"), null);
  hitBtn(app, "Wren").click();
  assert.equal(app.$("[data-edmgform]"), null);
  assert.deepEqual(app.errors, []);
});

test("Decision 191 (hostile): a block's armor line of markup is text, and the panel's fields come out as text", () => {
  const app = hitApp({ armor: ["<img src=x onerror=window.__pwn=1> (PROT 1d4)"], traits: [{ name: "<b>x</b>", text: "<img src=y onerror=window.__pwn=1>" }] });
  assert.match(encRowByName(app, "Dez").querySelector(".enc-armor").textContent, /^<img src=x onerror=window\.__pwn=1> \(PROT 1d4\) · not in the Gear tables$/);
  hitBtn(app, "Dez").click(); fillHit(app, 5, "blade", "<img src=z onerror=window.__pwn=1>");
  app.click('[data-ehit-cond="bleeding"]'); app.click("[data-ehit-apply]");
  clickIn(app, app.$('[data-tip="enctrait"]'));
  assert.equal(app.window.__pwn, undefined, "markup ran");
  assert.equal(app.$("#main img"), null);
  assert.equal(app.$("#tip img"), null);
  assert.deepEqual(app.errors, []);
});

// ── The encounter's end (Decision 193) ─────────────────────────────────
// Synthetic names only: Dez at the cast, two Gulls from a pack, Wren (hit) and Rook as the crew.
const wrapApp = () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  app.window.eval(`Engine.addCastMember(S.table, { name: "Dez" }); Engine.setCastBlock(S.table, S.table.cast[0].id, { stats: { BOD: 8 }, skills: [] });
    const pack = Engine.migratePack(${JSON.stringify(syntheticPack())});
    const e = Engine.addEncounter(S.table, { name: "Job" }).id;
    const dez = Engine.addParticipant(S.table, e, { kind: "cast", id: S.table.cast[0].id }).id;
    Engine.participantFromEntry(S.table, e, pack, "gull"); Engine.participantFromEntry(S.table, e, pack, "gull");
    const wren = Engine.addParticipant(S.table, e, { kind: "pc", name: "Wren" }).id;
    Engine.addParticipant(S.table, e, { kind: "pc", name: "Rook" });
    Engine.startEncounter(S.table, e);
    Engine.participantDamage(S.table, e, dez, 2); Engine.participantDamage(S.table, e, wren, 5);
    Engine.participantAddCondition(S.table, e, dez, { id: "prone" });`);
  encTab(app);
  app.click("[data-enc-open]");
  return app;
};
const wrapRow = (app, name) => app.$$("[data-ewrow]").find(li => li.querySelector(".enc-name").textContent === name);
const castLine193 = app => app.window.eval("S.table.cast.map(n => n.name + ':' + n.status).join('|')");

test("Decision 193: End on a running encounter opens the wrap-up, the cast row's line on and Keep off", () => {
  const app = wrapApp();
  app.click("[data-enc-end]");
  assert.equal(app.$("#modal [data-askyes]"), null, "a running encounter's End opens a wrap-up, not a question");
  assert.equal(app.doc.activeElement, app.$("[data-ew-h]"));
  assert.match(app.$("[data-ew-h]").textContent, /Wrap up Job/);
  assert.equal(app.$("[data-enext]"), null);
  assert.equal(app.$$("[data-ewrow]").length, 3, "PC rows aren't wrapped up");
  const dez = wrapRow(app, "Dez");
  assert.match(dez.textContent, /\d+ of 8 Health Levels · Prone/);
  assert.equal(dez.querySelector("[data-ew-line]").checked, true);
  assert.match(dez.querySelector("[data-ew-text]").value, /^\d+ of 8 Health Levels left; Prone\.$/);
  for (const n of ["Gull", "Gull 2"]) assert.equal(wrapRow(app, n).querySelector("[data-ew-keep]").checked, false);
  assert.equal(wrapRow(app, "Gull").querySelector("[data-ew-name]"), null, "Keep's fields show once it's ticked");
  // How hard was it names the die, and only the PC who was hit.
  assert.equal(app.$("[data-ew-says]").textContent, "");
  changeTo(app, "[data-ew-diff]", "hard");
  assert.equal(app.$("[data-ew-says]").textContent, "Wren: roll 1d8 for armor wear on your sheet.");
  assert.equal(app.doc.activeElement, app.$("[data-ew-diff]"));
  assert.deepEqual(app.errors, []);
});

test("Decision 193: Keep one, rename it, set another Dead, End the encounter: the cast, the lines and Kept as", () => {
  const app = wrapApp();
  app.click("[data-enc-end]");
  const keep = wrapRow(app, "Gull").querySelector("[data-ew-keep]");
  keep.checked = true; keep.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(app.doc.activeElement, app.$(`[data-ew-keep="${keep.dataset.ewKeep}"]`));
  const name = wrapRow(app, "Gull").querySelector("[data-ew-name]");
  assert.equal(name.value, "Gull");
  type(app, `[data-ew-name="${name.dataset.ewName}"]`, "Old Gull");
  changeTo(app, `[data-ewrow] [data-ew-status="${wrapRow(app, "Dez").dataset.ewrow}"]`, "dead");
  assert.equal(app.window.eval("S.table.cast.length"), 1, "nothing is written before End the encounter");
  app.click("[data-ew-end]");
  assert.equal(app.doc.activeElement, app.$("[data-enc-new]"));
  assert.equal(castLine193(app), "Old Gull:alive|Dez:dead");
  assert.equal(app.window.eval("S.table.interactions.map(x => x.kind).sort().join()"), "fought,killed");
  // Past encounters: the kept row reads Kept as, and it opens the member, whose Back returns.
  app.click("[data-enc-open]");
  assert.equal(app.$("[data-ew-h]"), null);
  const kept = app.$$("[data-erow] .enc-kept").map(p => p.textContent);
  assert.deepEqual(kept, ["Kept as Old Gull"]);
  app.click("[data-erow] .enc-kept [data-eopencast]");
  assert.match(app.$("#main").textContent, /Old Gull/);
  assert.match(app.$(".int-line").textContent, /fought Old Gull in .+ on /);
  app.click("[data-cback]");
  assert.match(app.$(".enc-status").textContent, /Ended/);
  // Dez's page lists the Killed line.
  app.click("[data-eopencast]");
  assert.match(app.$(".int-line").textContent, /killed Dez in .+ on /);
  assert.deepEqual(app.errors, []);
});

test("Decision 193: Cancel writes nothing and returns to the running encounter", () => {
  const app = wrapApp();
  const before = app.window.eval("JSON.stringify(S.table)");
  app.click("[data-enc-end]");
  const keep = wrapRow(app, "Gull").querySelector("[data-ew-keep]");
  keep.checked = true; keep.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  changeTo(app, `[data-ew-status="${wrapRow(app, "Dez").dataset.ewrow}"]`, "dead");
  app.click("[data-ew-cancel]");
  assert.equal(app.doc.activeElement, app.$("[data-enc-end]"));
  assert.ok(app.$("[data-enext]"), "the running encounter is back");
  assert.equal(app.window.eval("JSON.stringify(S.table)"), before);
  assert.deepEqual(app.errors, []);
});

test("Decision 193: a planned encounter's End asks as before and opens no wrap-up", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  encTab(app); newEncounter(app, "Soon");
  app.click("[data-enc-end]");
  assert.ok(app.$("#modal [data-askyes]"));
  app.click("#modal [data-askyes]");
  assert.equal(app.$("[data-ew-h]"), null);
  assert.equal(app.window.eval("S.table.encounters[0].status"), "ended");
  assert.deepEqual(app.errors, []);
});

test("Decision 193: Add an interaction offers Fought them last", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  app.window.eval(`Engine.addCastMember(S.table, { name: "Dez" })`);
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  const kinds = app.$$("[data-iakind]");
  assert.equal(kinds[kinds.length - 1].textContent, "Fought them");
  assert.equal(kinds.length, 8);
});

// ── Sessions and threads (Decisions 203–204) ────────────────────────────
const dayToday = () => { const d = new Date(), p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
const tableReopen = (app, name) => { tableHome(app); tableCard(app, name).querySelector("[data-topen]").click(); };
const sessTab = app => app.click('[data-tsec="sessions"]');
const sessionRows = app => app.$$(".sess-open").map(b => b.textContent);
const typeChange = (app, sel, value) => { const el = app.$(sel); el.value = value; el.dispatchEvent(new app.window.Event("change", { bubbles: true })); };
const addThreadHere = (app, title) => { type(app, "[data-thadd]", title); keyIn(app, "[data-thadd]", "Enter"); };
const nextText = app => app.$(".next-session") ? app.$(".next-session").textContent : app.$("#main").textContent;

test("Decision 204: a new table opens on Sessions, in this tab order, and a table reopens on the tab it was left on", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Landing", { stay: true });
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.deepEqual(app.$$("#topnav .tab").map(b => b.textContent.trim()), ["Sessions", "Players", "Cast", "City", "Threats", "Encounters", "Reference", "Notes"]);
  assert.deepEqual(app.$$("[data-tsec]").map(b => b.dataset.tsec), ["sessions", "players", "cast", "city", "threats", "encounters", "reference", "notes"]);
  assert.ok(app.$('[data-tsec="sessions"]').classList.contains("active"));
  tableReopen(app, "Landing");
  assert.equal(app.window.eval("S.tsection"), "sessions", "an untouched table reopens where it was");
  app.click('[data-tsec="cast"]');
  tableReopen(app, "Landing");
  assert.equal(app.window.eval("S.tsection"), "cast", "a table left on Cast reopens on Cast");
  assert.deepEqual(app.errors, []);
});

test("Decision 203: empty, Next session says so in one line; New session opens Session 1 on today, focused on Number", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Empty", { stay: true });
  assert.match(nextText(app), /Nothing yet\. Start a session when you sit down to play, or add a thread you want to follow\./);
  assert.match(app.$("#main").textContent, /No sessions yet\./);
  app.click("[data-snew]");
  assert.equal(app.$("h1.step-title").textContent, "Session 1");
  assert.equal(app.$('[data-sf="number"]').value, "1");
  assert.equal(app.$('[data-sf="date"]').value, dayToday());
  assert.equal(app.doc.activeElement, app.$('[data-sf="number"]'));
  assert.equal(app.$$("[data-sj]").length, 6, "the journal is six boxes");
  assert.deepEqual(app.$$("[data-sj]").map(e => e.dataset.sj), ["happened", "fallout", "threads", "impact", "reflection", "seed"]);
  assert.match(app.$("#main").textContent, /Major events · Key decisions made by the PCs/);
  assert.match(app.$("#main").textContent, /Situation · Likely turning point · Possible escalation/);
  app.click("[data-sback]");
  assert.deepEqual(sessionRows(app), [`Session 1 · ${app.window.eval(`dayText("${dayToday()}")`)}`]);
  assert.equal(app.doc.activeElement.dataset.sopen, app.window.eval("S.table.sessions[0].id"), "Back lands on that session's row");
  assert.deepEqual(app.errors, []);
});

test("Decision 203: every field on a session saves as it's typed with no redraw, and is there after Home and back", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Fields", { stay: true });
  app.click("[data-snew]");
  const num = app.$('[data-sf="number"]');
  type(app, '[data-sf="number"]', "21");
  assert.equal(app.$("h1.step-title").textContent, "Session 21");
  assert.equal(app.$('[data-sf="number"]'), num, "typing redrew the field");
  type(app, '[data-sf="date"]', "2026-09-30");
  type(app, '[data-sf="present"]', "Wren,  Rook ,");
  type(app, '[data-sf="hours"]', "4.5");
  const parts = ["happened", "fallout", "threads", "impact", "reflection", "seed"];
  for (const k of parts) type(app, `[data-sj="${k}"]`, `text ${k}`);
  const s = app.window.eval("S.table.sessions[0]");
  assert.deepEqual([s.number, s.date, s.hours, s.present.join("|")], [21, "2026-09-30", 4.5, "Wren|Rook"]);
  assert.equal(s.journal.seed, "text seed");
  tableReopen(app, "Fields");
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.match(sessionRows(app)[0], /^Session 21 · .* · Wren, Rook · 4\.5 hours$/);
  app.$(".sess-open").click();
  assert.equal(app.$('[data-sf="present"]').value, "Wren, Rook");
  for (const k of parts) assert.equal(app.$(`[data-sj="${k}"]`).value, `text ${k}`);
  // A refused number or hours changes nothing and reads what's stored once it loses focus.
  typeChange(app, '[data-sf="hours"]', "25");
  assert.equal(app.$('[data-sf="hours"]').value, "4.5");
  assert.match(app.$("#undotoast").textContent, /Enter hours, in halves\./);
  typeChange(app, '[data-sf="number"]', "1.5");
  assert.equal(app.$('[data-sf="number"]').value, "21");
  typeChange(app, '[data-sf="number"]', "");
  assert.equal(app.$("h1.step-title").textContent, "Session");
  assert.deepEqual(app.errors, []);
});

test("Decision 204: threads: open one from a session, make it current, add another; Next session orders them; resolving moves it to Closed", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Threads", { stay: true });
  app.click("[data-snew]");
  type(app, "[data-sthadd]", "Find Wren");
  keyIn(app, "[data-sthadd]", "Enter");
  assert.equal(app.doc.activeElement, app.$("[data-sthadd]"));
  assert.equal(app.$("[data-sthadd]").value, "", "the field is emptied");
  assert.equal(app.window.eval("S.table.threads[0].opened"), app.window.eval("S.table.sessions[0].id"));
  assert.match(app.$(".sess-threads").textContent, /Find Wren/);
  app.click("[data-sback]");
  addThreadHere(app, "Pay the fixer");
  assert.equal(app.doc.activeElement, app.$("[data-thadd]"));
  assert.equal(app.$$("[data-thtitle]").length, 2);
  assert.match(nextText(app), /Still open[\s\S]*Find Wren[\s\S]*Pay the fixer/, "oldest first");
  assert.doesNotMatch(nextText(app), /Current/);
  // Current: pressed on one clears the others.
  const cur = title => app.$$("[data-thtitle]").find(e => e.value === title).dataset.thtitle;
  app.click(`[data-thcur="${cur("Pay the fixer")}"]`);
  assert.equal(app.doc.activeElement.dataset.thcur, cur("Pay the fixer"));
  assert.match(app.$(".next-current").textContent, /Current\s*Pay the fixer/);
  assert.match(nextText(app), /Still open\s*Find Wren/);
  app.click(`[data-thcur="${cur("Find Wren")}"]`);
  assert.match(app.$(".next-current").textContent, /Find Wren/);
  assert.equal(app.window.eval("S.table.threads.filter(h => h.current).length"), 1);
  // Resolve the current one: it moves into Closed in Session 1, and no thread is current.
  const id = cur("Find Wren");
  pick(app, `[data-thstatus="${id}"]`, "resolved");
  assert.equal(app.$(".next-current"), null);
  assert.ok(app.$("[data-thshut]").open, "the fold opens");
  assert.ok(app.$("[data-thshut]").querySelector(`[data-thtitle="${id}"]`), "the row moved into Closed");
  assert.equal(app.doc.activeElement, app.$(`[data-thtitle="${id}"]`));
  assert.match(app.$(`[data-thclosed="${id}"]`).selectedOptions[0].textContent, /^Session 1/);
  assert.equal(app.window.eval("S.table.threads.find(h => h.status === 'resolved').closed"), app.window.eval("S.table.sessions[0].id"));
  // Reopen: back up, closed cleared.
  pick(app, `[data-thstatus="${id}"]`, "open");
  assert.equal(app.window.eval("S.table.threads.find(h => h.title === 'Find Wren').closed"), null);
  assert.equal(app.$("[data-thshut]"), null);
  // A blank title is refused and the field shows the stored one.
  typeChange(app, `[data-thtitle="${id}"]`, "  ");
  assert.equal(app.$(`[data-thtitle="${id}"]`).value, "Find Wren");
  assert.match(app.$("#undotoast").textContent, /Name the thread\./);
  // A tap on a thread in Next session opens its More and lands on its title.
  const next = app.$$("[data-thopen]")[0];
  assert.ok(next);
  next.click();
  assert.ok(app.$(`[data-thmore="${next.dataset.thopen}"]`).open);
  assert.equal(app.doc.activeElement.dataset.thtitle, next.dataset.thopen);
  // Delete asks.
  app.click(`[data-thdel="${next.dataset.thopen}"]`);
  assert.ok(app.$("#modal[open]"), "Delete didn't ask");
  app.click("#modal [data-modalclose]");
  assert.equal(app.window.eval("S.table.threads.length"), 2);
  assert.deepEqual(app.errors, []);
});

test("Decision 203: an interaction made on a session's day shows its session on both pages; another day's doesn't; older lines are offered", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Days");
  castAdd(app, "Dez", "a courier");
  app.click("[data-copen]");
  const memberId = app.window.eval("S.table.cast[0].id");
  // Two lines from today, written before there was a session.
  for (const text of ["older line", "older two"])
    app.window.eval(`Engine.addInteraction(S.table, { kind: "shared", cast: ["${memberId}"], crew: ["Wren"], text: "${text}", date: "${dayToday()}" })`);
  app.click("[data-cback]");
  sessTab(app);
  app.click("[data-snew]");
  assert.equal(app.$$("[data-soffered] [data-sadd]").length, 2);
  assert.equal(app.$("[data-sadd]").textContent, "Add to this session");
  app.click("[data-sback]");
  // Now a line on the member's page, today's and another day's.
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  app.click('[data-iakind="shared"]'); type(app, "[data-iwhat]", "today's line"); keyIn(app, "[data-iwhat]", "Enter");
  typeChange(app, "[data-iadate]", "2020-01-01"); type(app, "[data-iwhat]", "other day"); keyIn(app, "[data-iwhat]", "Enter");
  const sid = app.window.eval("S.table.sessions[0].id");
  const bySession = text => app.window.eval(`S.table.interactions.find(x => x.text === ${JSON.stringify(text)}).session`);
  assert.equal(bySession("today's line"), sid, "a new line takes its day's session");
  assert.equal(bySession("other day"), null);
  assert.equal(bySession("older line"), null, "nothing already stored is converted");
  assert.deepEqual(app.$$(".int-session").map(e => e.textContent), ["Session 1"]);
  // The session's page lists today's line, and offers the older two but not the other day's.
  sessTab(app); app.click(".sess-open");
  assert.match(app.$("#main").textContent, /today's line/);
  assert.doesNotMatch(app.$("#main").textContent, /other day/);
  assert.equal(app.$$("[data-soffered] [data-sadd]").length, 2);
  // Add to this session: it moves up, and focus goes to the next offer, then the heading.
  const first = app.$("[data-sadd]"), firstId = first.dataset.sadd;
  first.click();
  assert.equal(app.window.eval(`S.table.interactions.find(x => x.id === "${firstId}").session`), sid);
  assert.equal(app.$$("[data-sadd]").length, 1);
  assert.equal(app.doc.activeElement, app.$("[data-sadd]"));
  app.$("[data-sadd]").click();
  assert.equal(app.$("[data-soffered]"), null);
  assert.equal(app.doc.activeElement, app.$("[data-sint-h]"), "with none left, focus goes to the list's heading");
  // The member's page shows the session on those lines, and Back returns to the session.
  app.click("[data-copen]");
  assert.equal(app.window.eval("S.tsection"), "cast");
  assert.equal(app.$("[data-cback]").textContent, "Back to Session 1", "opened from a session's page, Back names it");
  assert.equal(app.$$(".int-session").length, 3);
  app.click("[data-cback]");
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.ok(app.$("[data-sback]"), "Back from a member opened on a session lands on that session");
  assert.deepEqual(app.errors, []);
});

test("Decision 204: Met last session lists a quick-added member last session named, until they have a number; their name opens their page and Back returns to Sessions", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Met");
  castAdd(app, "Dez", "a courier");
  app.click("[data-copen]");
  app.click('[data-iakind="shared"]'); type(app, "[data-iwhat]", "first meeting"); keyIn(app, "[data-iwhat]", "Enter");
  sessTab(app);
  assert.doesNotMatch(nextText(app), /Met last session/, "no session, no 'last session'");
  app.click("[data-snew]"); app.click("[data-sback]");
  assert.doesNotMatch(nextText(app), /Met last session/, "the line was made before the session, so it isn't linked");
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  app.click('[data-iakind="helped"]'); type(app, "[data-iwhat]", "in the session"); keyIn(app, "[data-iwhat]", "Enter");
  sessTab(app);
  assert.doesNotMatch(nextText(app), /Met last session/, "the session being played today isn't last session");
  app.click(".sess-open"); type(app, '[data-sf="date"]', "2026-09-30"); app.click("[data-sback]");
  assert.match(nextText(app), /Met last session, no stat block yet\s*Dez/);
  app.click(".next-session [data-copen]");
  assert.equal(app.window.eval("S.tsection"), "cast");
  assert.match(app.$("[data-cback]").textContent, /Back to sessions/);
  assert.equal(app.doc.activeElement, app.$("[data-cback]"));
  type(app, '[data-cstat="BOD"]', "6");
  app.click("[data-cback]");
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.doesNotMatch(nextText(app), /Met last session/, "a BOD removes them");
  // Back lands on the name that was pressed, when it's still there.
  app.window.eval("S.table.cast[0].block = null");
  app.window.eval("renderTable()");
  app.click(".next-session [data-copen]"); app.click("[data-cback]");
  assert.equal(app.doc.activeElement.dataset.copen, app.window.eval("S.table.cast[0].id"));
  // The Cast tab's own Back is unchanged.
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  assert.match(app.$("[data-cback]").textContent, /Back to the cast/);
  assert.deepEqual(app.errors, []);
});

test("Decision 204: Next session reads last session's seed under its title, a tap goes to that session", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Seed", { stay: true });
  app.click("[data-snew]");
  type(app, '[data-sf="date"]', "2026-09-30");
  type(app, '[data-sj="seed"]', "The heist goes wrong.");
  app.click("[data-sback]");
  assert.match(nextText(app), /Last session set up\s*Session 1[\s\S]*The heist goes wrong\./);
  // Tonight's session is made: Session 1's seed is still what Next session shows, and tonight isn't last session.
  app.click("[data-snew]");
  assert.equal(app.$("h1.step-title").textContent, "Session 2");
  app.click("[data-sback]");
  assert.match(nextText(app), /Last session set up\s*Session 1[\s\S]*The heist goes wrong\./);
  app.click(".next-session [data-sopen]");
  assert.equal(app.$("h1.step-title").textContent, "Session 1");
  assert.equal(app.doc.activeElement, app.$("[data-sback]"));
  type(app, '[data-sj="seed"]', "   ");
  app.click("[data-sback]");
  assert.doesNotMatch(nextText(app), /Last session set up/, "a blank seed shows nothing");
  assert.match(nextText(app), /Nothing open, and last session set nothing up\./, "sessions but nothing to say still says so");
  assert.deepEqual(app.errors, []);
});

test("Decision 203: Delete a session asks, and afterwards its thread's Closed in and the interaction's session are gone", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "Gone");
  castAdd(app, "Dez");
  app.click('[data-tsec="sessions"]');
  app.click("[data-snew]");
  type(app, "[data-sthadd]", "Loose end"); keyIn(app, "[data-sthadd]", "Enter");
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  app.click('[data-iakind="shared"]'); type(app, "[data-iwhat]", "a line"); keyIn(app, "[data-iwhat]", "Enter");
  assert.deepEqual(app.$$(".int-session").map(e => e.textContent), ["Session 1"]);
  sessTab(app); app.click(".sess-open");
  const id = app.$("[data-thopen]").dataset.thopen;
  app.click("[data-sback]");
  pick(app, `[data-thstatus="${id}"]`, "dropped");
  assert.match(app.$(`[data-thclosed="${id}"]`).selectedOptions[0].textContent, /^Session 1/);
  app.click(".sess-open");
  app.click("[data-sdel]");
  assert.ok(app.$("#modal[open]"), "Delete didn't ask");
  assert.match(app.$("#modal").textContent, /Its threads and interactions stay/);
  app.click("#modal [data-modalclose]");
  assert.equal(app.window.eval("S.table.sessions.length"), 1, "Cancel keeps it");
  app.click("[data-sdel]");
  app.click("#modal [data-askyes]");
  assert.equal(app.window.eval("S.table.sessions.length"), 0);
  assert.equal(app.doc.activeElement, app.$("[data-snew]"));
  assert.equal(app.$(`[data-thclosed="${id}"]`).value, "", "the thread no longer says where it closed");
  assert.equal(app.window.eval("S.table.threads[0].opened"), null);
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  assert.equal(app.$$(".int-session").length, 0);
  assert.deepEqual(app.errors, []);
});

test("Decisions 203–204: export and import keep sessions and threads, and a 0.7 table opens as 0.8 with none and every session null", async () => {
  const app = boot({ storage: GM_ON });
  const downloads = withDownloads(app);
  runTable(app, "Round", { stay: true });
  app.click("[data-snew]"); type(app, '[data-sj="happened"]', "Things."); type(app, '[data-sf="present"]', "Wren");
  type(app, "[data-sthadd]", "T1"); keyIn(app, "[data-sthadd]", "Enter");
  const before = JSON.parse(JSON.stringify(app.window.eval("({ s: S.table.sessions, t: S.table.threads })")));
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  const file = await tableFile(downloads[0]);
  assert.equal(file.meta.tableSchemaVersion, "0.18");
  assert.deepEqual(file.sessions, before.s); assert.deepEqual(file.threads, before.t);
  const fresh = boot({ storage: GM_ON });
  withDownloads(fresh);
  await importFile(fresh, file);
  assert.deepEqual(JSON.parse(JSON.stringify(fresh.window.eval("({ s: S.table.sessions, t: S.table.threads })"))), before);
  // A 0.7 table: no keys, lines with no session.
  const old = JSON.parse(JSON.stringify(file));
  old.meta.tableSchemaVersion = "0.7"; delete old.sessions; delete old.threads;
  old.interactions = [{ id: "I-AAAAAAAA", kind: "shared", text: "x", date: dayToday() }];
  const older = boot({ storage: GM_ON });
  withDownloads(older);
  await importFile(older, old);
  assert.equal(older.window.eval("S.table.meta.tableSchemaVersion"), "0.18");
  assert.equal(older.window.eval("S.table.sessions.length + S.table.threads.length"), 0);
  assert.equal(older.window.eval("S.table.interactions[0].session"), null);
  assert.deepEqual([...app.errors, ...fresh.errors, ...older.errors], []);
});

test("Decision 173: switched off, there is no table, so no Sessions tab", () => {
  const app = boot(GM_OFF);
  assert.equal(app.$("#btn-run-table"), null);
  assert.equal(app.$('[data-tsec="sessions"]'), null);
  assert.deepEqual(app.errors, []);
});

// ── The close-out (Decisions 205–206) ───────────────────────────────────
function closeApp(build) {
  const t = Engine.newTable("Close");
  const ids = build(t);
  const key = "shadows.table.v1." + t.meta.id;
  const app = boot({ storage: { ...GM_ON, [key]: { table: t, section: "sessions", changed: "2026-10-05T10:00:00.000Z", exported: null } } });
  app.click("[data-topen]");
  return { app, t, ids };
}
const mkSession = (t, number, date, present, hours) => {
  const id = Engine.addSession(t, { number, date }).id;
  Engine.editSession(t, id, { present, hours });
  return id;
};
const openSess = (app, id) => app.click(`.sess-open[data-sopen="${id}"]`);
const closeSheet = (app, id) => { openSess(app, id); app.click("[data-co-open]"); };
const coRow = (app, name) => app.$$("[data-co-row]").find(r => r.querySelector(".co-name").textContent === name);
const coField = (app, name, f) => coRow(app, name).querySelector(`[data-co="${f}"]`);
const coType = (app, name, f, v) => type(app, `[data-co-row="${coRow(app, name).dataset.coRow}"] [data-co="${f}"]`, v);

test("205–206: Close out opens the sheet on Who was there; IP is 5 an hour rounded up, the Milestone Point ticked", () => {
  const { app, ids } = closeApp(t => { mkSession(t, 3, "2026-09-01", ["Dez"], 2); return mkSession(t, 4, "2026-09-08", ["Wren", "Rook"], 3.5); });
  openSess(app, ids);
  assert.equal(app.$("[data-sco-h]").textContent, "Close-out");
  assert.equal(app.$("[data-co-open]").textContent, "Close out Session 4");
  app.click("[data-co-open]");
  assert.equal(app.$("h1.step-title").textContent, "Close out Session 4");
  assert.equal(app.doc.activeElement, app.$('[data-cosf="present"]'));
  assert.equal(app.$("[data-co-back]").textContent, "Back to Session 4");
  assert.deepEqual(["Wren", "Rook"].map(n => coField(app, n, "ip").value), ["18", "18"]);
  assert.ok(["Wren", "Rook"].every(n => coField(app, n, "milestone").checked));
  assert.match(app.$("#main").textContent, /5 an hour, rounded up\. Change any of it\./);
  assert.deepEqual(app.errors, []);
});

test("206: changing Hours recomputes the IP of lines the GM hasn't typed, and leaves a typed one", () => {
  const { app, ids } = closeApp(t => mkSession(t, 4, "2026-09-08", ["Wren", "Rook"], 3.5));
  closeSheet(app, ids);
  coType(app, "Rook", "ip", "20");
  const hours = app.$('[data-cosf="hours"]');
  type(app, '[data-cosf="hours"]', "3");
  assert.equal(app.$('[data-cosf="hours"]'), hours, "the field wasn't redrawn");
  assert.equal(app.window.eval("S.table.sessions[0].hours"), 3, "Hours saves to the session as typed");
  assert.equal(coField(app, "Wren", "ip").value, "15");
  assert.equal(coField(app, "Rook", "ip").value, "20", "a typed IP is left alone");
  type(app, '[data-cosf="hours"]', "");
  assert.equal(coField(app, "Wren", "ip").value, "", "no hours: blank");
  assert.equal(coField(app, "Rook", "ip").value, "20");
  assert.match(app.$("#main").textContent, /Add the hours to work out IP\./);
  assert.deepEqual(app.errors, []);
});

test("206: the absent are the earlier names; a tier is picked, its range shows, the Çredits are typed, and the next close-out suggests that tier", () => {
  const { app, ids } = closeApp(t => { mkSession(t, 3, "2026-09-01", ["Dez"], 2); mkSession(t, 9, "2026-12-01", ["Planned"], 2); const a = mkSession(t, 4, "2026-09-08", ["Wren"], 3); const b = mkSession(t, 5, "2026-09-15", ["Wren"], 2); return { a, b }; });
  closeSheet(app, ids.a);
  assert.equal(app.$("[data-co-away-h]").textContent, "Away tonight");
  assert.doesNotMatch(app.$("#main").textContent, /Planned/);
  assert.equal(coField(app, "Dez", "took").checked, true);
  assert.equal(coField(app, "Dez", "tier").value, "");
  assert.match(coField(app, "Dez", "tier").options[0].textContent, /Choose a tier/);
  typeChange(app, `[data-co-row="${coRow(app, "Dez").dataset.coRow}"] [data-co="tier"]`, "competent");
  assert.match(coRow(app, "Dez").textContent, /Pays 300–550/);
  assert.equal(app.doc.activeElement, coField(app, "Dez", "tier"));
  coType(app, "Dez", "credits", "400");
  app.click("[data-co-write]");
  assert.equal(app.doc.activeElement, app.$("[data-sco-h]"));
  assert.match(app.$(".co-log").textContent, /Dez \(away\): no session to log; an off-screen job, Competent; \+400 Çredits\./);
  app.click("[data-sback]");
  openSess(app, ids.b);
  app.click("[data-co-open]");
  assert.equal(coField(app, "Dez", "tier").value, "competent", "the last pick is suggested");
  assert.equal(coField(app, "Dez", "credits").value, "", "the amount isn't");
  // Unticked: the row folds and writes no line.
  app.click(`[data-co-row="${coRow(app, "Dez").dataset.coRow}"] [data-co="took"]`);
  assert.equal(coRow(app, "Dez").querySelector('[data-co="tier"]'), null);
  assert.equal(app.doc.activeElement, coField(app, "Dez", "took"));
  app.click("[data-co-write]");
  assert.deepEqual(JSON.parse(JSON.stringify(app.window.eval("S.table.sessions.find(s => s.number === 5).close.lines.map(l => l.name)"))), ["Wren"]);
  assert.deepEqual(app.errors, []);
});

test("206: the arc reminder goes by the session's number: 5 Minor, 10 Major, 4 neither", () => {
  const { app, ids } = closeApp(t => ({ four: mkSession(t, 4, "2026-09-01", ["Wren"], 2), five: mkSession(t, 5, "2026-09-08", ["Wren"], 2), ten: mkSession(t, 10, "2026-09-15", ["Wren"], 2) }));
  closeSheet(app, ids.five);
  assert.match(app.$("#main").textContent, /Session 5: a Minor Milestone comes due\. Each player's sheet counts their own\./);
  assert.doesNotMatch(app.$("#main").textContent, /Major Milestone comes due/);
  app.click("[data-co-back]"); app.click("[data-sback]");
  closeSheet(app, ids.ten);
  assert.match(app.$("#main").textContent, /Session 10: a Major Milestone comes due\./);
  app.click("[data-co-back]"); app.click("[data-sback]");
  closeSheet(app, ids.four);
  assert.doesNotMatch(app.$("#main").textContent, /Milestone comes due/);
  assert.deepEqual(app.errors, []);
});

test("206: a thread resolved from the sheet closes in this session, though a newer one exists, and focus moves on", () => {
  const { app, ids } = closeApp(t => {
    const a = mkSession(t, 4, "2026-09-01", ["Wren"], 2); mkSession(t, 6, "2026-09-15", ["Wren"], 2);
    Engine.addThread(t, { title: "First" }); Engine.addThread(t, { title: "Second" });
    return a;
  });
  closeSheet(app, ids);
  assert.equal(app.$$("[data-co-status]").length, 2);
  const first = app.$$("[data-co-thread]")[0].dataset.coThread;
  typeChange(app, `[data-co-status="${first}"]`, "resolved");
  assert.equal(app.window.eval(`S.table.threads.find(h => h.id === "${first}").closed`), ids, "closed in this session");
  assert.equal(app.$$("[data-co-status]").length, 1, "it left the list");
  assert.equal(app.doc.activeElement, app.$("[data-co-status]"), "focus lands on the next thread");
  typeChange(app, "[data-co-status]", "dropped");
  assert.match(app.$("#main").textContent, /No open threads\./);
  assert.equal(app.doc.activeElement, app.$("[data-co-threads-h]"));
  assert.deepEqual(app.errors, []);
});

test("206: Anyone new? lists a member made today with no line; typing saves it; reopening the sheet drops them", () => {
  const { app, t, ids } = closeApp(t => { Engine.addCastMember(t, { name: "Fresh" }); Engine.addCastMember(t, { name: "Known" }); Engine.editCastMember(t, t.cast.find(n => n.name === "Known").id, { line: "Stop." }); return mkSession(t, 4, dayToday(), ["Wren"], 2); });
  closeSheet(app, ids);
  assert.equal(app.$("[data-co-new-h]").textContent, "Anyone new?");
  const names = app.$$("[data-co-open-cast]").map(b => b.textContent);
  assert.equal(names.length, 1, names.join());
  const who = app.$("[data-co-member]");
  const field = who.querySelector('[data-co-cf="motivation"]');
  type(app, '[data-co-member] [data-co-cf="motivation"]', "Money.");
  assert.equal(app.$('[data-co-member] [data-co-cf="motivation"]'), field, "no redraw");
  assert.equal(app.window.eval("S.table.cast.find(n => n.motivation).motivation"), "Money.");
  // Still listed until reopened; after Back and in again, gone.
  assert.ok(app.$("[data-co-member]"));
  app.click("[data-co-back]"); app.click("[data-co-open]");
  assert.equal(app.$("[data-co-new-h]"), null);
  assert.ok(t);
  assert.deepEqual(app.errors, []);
});

test("205: a newcomer's name opens their page; its Back says where and returns to the sheet", () => {
  const { app, ids } = closeApp(t => { Engine.addCastMember(t, { name: "Fresh" }); return mkSession(t, 4, dayToday(), ["Wren"], 2); });
  closeSheet(app, ids);
  coType(app, "Wren", "ip", "7");
  app.click("[data-co-open-cast]");
  assert.equal(app.$("[data-cback]").textContent, "Back to the close-out");
  assert.equal(app.doc.activeElement, app.$("[data-cback]"));
  app.click("[data-cback]");
  assert.equal(app.$("h1.step-title").textContent, "Close out Session 4");
  assert.equal(coField(app, "Wren", "ip").value, "7", "the draft was kept");
  assert.equal(app.doc.activeElement.dataset.coOpenCast, app.window.eval("S.table.cast[0].id"));
  assert.deepEqual(app.errors, []);
});

test("205: Back keeps the draft and names the session; the page's button resumes it", () => {
  const { app, ids } = closeApp(t => mkSession(t, 4, "2026-09-08", ["Wren"], 2));
  closeSheet(app, ids);
  coType(app, "Wren", "ip", "99"); coType(app, "Wren", "note", "Bonus");
  app.click("[data-co-back]");
  assert.equal(app.$("h1.step-title").textContent, "Session 4");
  assert.equal(app.doc.activeElement, app.$("[data-co-open]"));
  assert.equal(app.window.eval("S.table.sessions[0].close"), null, "nothing written");
  app.click("[data-co-open]");
  assert.equal(coField(app, "Wren", "ip").value, "99");
  assert.equal(coField(app, "Wren", "note").value, "Bonus");
  app.click("[data-co-back]"); app.click("[data-sback]");
  openSess(app, ids);
  assert.equal(app.$("h1.step-title").textContent, "Session 4", "another visit opens the page, not the sheet");
  assert.deepEqual(app.errors, []);
});

test("205: Write stores the log in the player's words; IP so far shows; reload, export and import keep it; Redo asks and starts from it", async () => {
  const { app, ids } = closeApp(t => { mkSession(t, 3, "2026-09-01", ["Wren", "Dez"], 2); return mkSession(t, 4, "2026-09-08", ["Wren", "Rook", "Blank"], 3.5); });
  const downloads = withDownloads(app);
  assert.doesNotMatch(app.$("#main").textContent, /IP so far/);
  closeSheet(app, ids);
  coType(app, "Wren", "credits", "250"); coType(app, "Wren", "note", "Kept the gun.");
  coType(app, "Rook", "ip", ""); app.click(`[data-co-row="${coRow(app, "Rook").dataset.coRow}"] [data-co="milestone"]`);
  coType(app, "Blank", "ip", "");
  app.click(`[data-co-row="${coRow(app, "Blank").dataset.coRow}"] [data-co="milestone"]`);
  app.click(`[data-co-row="${coRow(app, "Dez").dataset.coRow}"] [data-co="took"]`);
  app.click("[data-co-write]");
  const log = app.$$(".co-log li").map(l => l.textContent);
  assert.deepEqual(log, ["Wren: log a session with 18 IP and the Milestone Point; +250 Çredits. Kept the gun.", "Rook: nothing this time.", "Blank: nothing this time."]);
  assert.match(app.$("#main").textContent, /Written \S+/);
  assert.equal(app.doc.activeElement, app.$("[data-sco-h]"));
  assert.equal(app.window.eval("S.closeOut"), null);
  app.click("[data-sback]");
  assert.match(app.$(".co-totals").textContent, /^IP so far: Wren 18 · Rook 0 · Blank 0$/);
  // Reload.
  tableReopen(app, "Close");
  assert.match(app.$(".co-totals").textContent, /Wren 18/);
  // Export, import.
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  const file = await tableFile(downloads[0]);
  const closed = file.sessions.find(s => s.number === 4).close;
  assert.equal(closed.lines.length, 3);
  assert.equal(file.sessions.find(s => s.number === 3).close, null);
  const fresh = boot({ storage: GM_ON });
  withDownloads(fresh);
  await importFile(fresh, file);
  assert.deepEqual(JSON.parse(JSON.stringify(fresh.window.eval("S.table.sessions.find(s => s.number === 4).close"))), closed);
  // Redo.
  openSess(app, ids);
  app.click("[data-co-redo]");
  assert.match(app.$("#modal").textContent, /Redo the close-out\?[\s\S]*You'll start from what's written; writing again replaces it\./);
  app.click("#modal [data-modalclose]");
  assert.ok(app.window.eval("S.closeOut") == null, "Cancel starts nothing");
  app.click("[data-co-redo]"); app.click("#modal [data-askyes]");
  assert.equal(app.doc.activeElement, app.$('[data-cosf="present"]'));
  assert.equal(coField(app, "Wren", "credits").value, "250");
  assert.equal(coField(app, "Wren", "note").value, "Kept the gun.");
  assert.equal(coField(app, "Rook", "milestone").checked, false);
  assert.equal(coField(app, "Dez", "took").checked, false, "who was left out is still on offer");
  coType(app, "Wren", "ip", "20");
  app.click("[data-co-write]");
  assert.equal(app.window.eval("S.table.sessions.find(s => s.number === 4).close.lines.length"), 3, "replaced, not appended");
  assert.match(app.$(".co-log").textContent, /Wren: log a session with 20 IP/);
  assert.deepEqual([...app.errors, ...fresh.errors], []);
});

test("205: Write refused names the field, keeps what was typed and writes nothing", () => {
  const { app, ids } = closeApp(t => mkSession(t, 4, "2026-09-08", ["Wren", "Rook"], 2));
  closeSheet(app, ids);
  coType(app, "Rook", "ip", "1.5");
  app.click("[data-co-write]");
  assert.match(app.$("#undotoast").textContent, /Enter a whole number\./);
  assert.equal(app.doc.activeElement, coField(app, "Rook", "ip"));
  assert.equal(coField(app, "Rook", "ip").value, "1.5");
  assert.equal(app.window.eval("S.table.sessions[0].close"), null);
  // Nobody: Who was there emptied.
  type(app, '[data-cosf="present"]', ""); typeChange(app, '[data-cosf="present"]', "");
  assert.match(app.$("#main").textContent, /Add who was there to work out IP\./);
  app.click("[data-co-write]");
  assert.match(app.$("#undotoast").textContent, /Nobody to write down\./);
  assert.equal(app.doc.activeElement, app.$('[data-cosf="present"]'));
  assert.deepEqual(app.errors, []);
});

test("205: deleting a session drops its draft", () => {
  const { app, ids } = closeApp(t => mkSession(t, 4, "2026-09-08", ["Wren"], 2));
  closeSheet(app, ids);
  app.click("[data-co-back]");
  app.click("[data-sdel]"); app.click("#modal [data-askyes]");
  assert.ok(app.window.eval("S.closeOut") == null);
  assert.deepEqual(app.errors, []);
});

test("206 (review): a typed IP survives correcting a letter in Who was there, and an away line's tier and Çredits survive being typed present and back", () => {
  const { app, ids } = closeApp(t => { mkSession(t, 3, "2026-09-01", ["Rook", "Dez"], 2); return mkSession(t, 4, "2026-09-08", ["Wren", "Rook"], 3.5); });
  closeSheet(app, ids);
  coType(app, "Rook", "ip", "20");
  type(app, '[data-cosf="present"]', "Wren, Roo");
  type(app, '[data-cosf="present"]', "Wren, Rook");
  assert.equal(coField(app, "Rook", "ip").value, "20", "Rook's typed IP");
  type(app, '[data-cosf="hours"]', "3");
  assert.equal(coField(app, "Rook", "ip").value, "20", "still typed after an Hours change");
  assert.equal(coField(app, "Wren", "ip").value, "15");
  typeChange(app, `[data-co-row="${coRow(app, "Dez").dataset.coRow}"] [data-co="tier"]`, "competent");
  coType(app, "Dez", "credits", "400");
  type(app, '[data-cosf="present"]', "Wren, Rook, Dez");
  assert.ok(coField(app, "Dez", "ip"), "Dez is present now");
  type(app, '[data-cosf="present"]', "Wren, Rook");
  assert.equal(coField(app, "Dez", "tier").value, "competent");
  assert.equal(coField(app, "Dez", "credits").value, "400");
  assert.deepEqual(app.errors, []);
});

test("206 (review): Redo leaves an IP that still matches the hours to the app, so changing Hours moves it; a typed one stays", () => {
  const { app, ids } = closeApp(t => mkSession(t, 4, "2026-09-08", ["Wren", "Rook"], 3.5));
  closeSheet(app, ids);
  coType(app, "Rook", "ip", "20");
  app.click("[data-co-write]");
  app.click("[data-co-redo]"); app.click("#modal [data-askyes]");
  type(app, '[data-cosf="hours"]', "5");
  assert.equal(coField(app, "Wren", "ip").value, "25");
  assert.equal(coField(app, "Rook", "ip").value, "20");
  assert.deepEqual(app.errors, []);
});

test("206 (review): Write with Took a job ticked and no tier is refused, focused on that row's Tier", () => {
  const { app, ids } = closeApp(t => { mkSession(t, 3, "2026-09-01", ["Dez"], 2); return mkSession(t, 4, "2026-09-08", ["Wren"], 3); });
  closeSheet(app, ids);
  app.click("[data-co-write]");
  assert.match(app.$("#undotoast").textContent, /Choose a tier\./);
  assert.equal(app.doc.activeElement, coField(app, "Dez", "tier"));
  assert.ok(app.window.eval("S.table.sessions.find(s => s.number === 4).close") == null);
  assert.deepEqual(app.errors, []);
});

// ── The Reference (Decision 207) ────────────────────────────────────────
const refTab = app => app.click('[data-tsec="reference"]');
const refHeads = app => app.$$("#main .ref-h").map(h => h.textContent);
const refChips = app => app.$$("#main .jumpbar .jump").map(b => b.textContent);

test("Decision 207: switched off there is no Reference tab; switched on, a panel per row of the data, in order, and a chip for each", () => {
  const off = boot(GM_OFF);
  assert.equal(off.$("#btn-run-table"), null);
  assert.equal(off.$('[data-tsec="reference"]'), null);
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); refTab(app);
  const titles = [...app.D.gmReference.panels.map(p => p.title)];
  assert.deepEqual(refHeads(app), titles);
  assert.deepEqual(refChips(app), titles);
  assert.match(app.$("#main").textContent, /Slot a pack on the Threats tab, and its tiers, roles, origins and traits show here\./);
  assert.ok(app.$("#main .jumpbar.sticky"), "the bar sticks (SQ8)");
  assert.equal(app.$$("#main table.ref").length > 6, true);
  assert.deepEqual(app.errors, []);
});

test("Decision 207: with a pack slotted the Codex shows its tiers and traits", () => {
  const app = tableWithPack(); refTab(app);
  const codex = app.$("#gr-codex").parentElement.textContent;
  assert.doesNotMatch(codex, /Slot a pack/);
  for (const s of ["Slight", "Middling", "Bruiser", "Gatherer", "Salt Nerve", "Pier Legs", "BOD +1 · REF −1"]) assert.ok(codex.includes(s), s);
  assert.deepEqual(app.errors, []);
});

test("Decision 207: the search keeps the field and its focus while it filters panels and chips; no match says so; Clear brings everything back", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); refTab(app);
  const q = app.$("[data-jumpfilter]"), all = [...app.D.gmReference.panels.map(p => p.title)];
  q.focus();
  type(app, "[data-jumpfilter]", "prone");
  assert.equal(app.$("[data-jumpfilter]"), q, "typing redrew the search field");
  assert.equal(q.value, "prone");
  assert.equal(app.doc.activeElement, q);
  assert.deepEqual(refHeads(app), ["Conditions", "Actions", "When a hit lands hard", "Weapon tags"]);
  assert.deepEqual(refChips(app), refHeads(app));
  assert.equal(app.window.eval("S.refQ"), "prone");
  type(app, "[data-jumpfilter]", "zzzz");
  assert.match(app.$("#main").textContent, /Nothing in the reference matches\./);
  assert.deepEqual(refChips(app), []);
  app.click("[data-refclear]");
  assert.deepEqual(refHeads(app), all);
  assert.equal(app.$("[data-jumpfilter]").value, "");
  assert.equal(app.doc.activeElement, app.$("[data-jumpfilter]"));
  assert.deepEqual(app.errors, []);
});

test("Decision 207: a chip lands on its panel's heading, whatever is filtered, and the search is kept across a trip to another tab", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); refTab(app);
  type(app, "[data-jumpfilter]", "tn 8");
  const chips = app.$$("#main .jumpbar .jump");
  assert.ok(chips.length >= 3);
  const last = chips.at(-1);
  last.click();
  const head = app.$(`#${last.dataset.jump}`);
  assert.equal(head.textContent, last.textContent);
  assert.equal(app.doc.activeElement, head);
  notesTab(app); refTab(app);
  assert.equal(app.$("[data-jumpfilter]").value, "tn 8", "the search as left");
  assert.deepEqual(app.errors, []);
});

test("a mouse wheel scrolls a sideways row of chips and lets the page have it at the end", () => {
  // jsdom has no layout: give each row 1200 px of chips in 500. The row hides its scrollbar.
  const wheelable = (app, row) => {
    let left = 0; const max = 700;
    Object.defineProperty(row, "scrollLeft", { get: () => left, set: v => { left = Math.max(0, Math.min(max, v)); } });
    const wheel = (dy, dx = 0) => { const e = new app.window.WheelEvent("wheel", { deltaY: dy, deltaX: dx, bubbles: true, cancelable: true }); row.dispatchEvent(e); return e.defaultPrevented; };
    assert.equal(wheel(120), true, "the wheel didn't move the row");
    assert.equal(left, 120);
    assert.equal(wheel(0, 40), false, "a sideways swipe was taken over");
    left = max;
    assert.equal(wheel(120), false, "the wheel was swallowed with nowhere to scroll");
  };
  const sheet = openSheet(lockedCharacter(), "character");
  wheelable(sheet, sheet.$("#main .jumpbar.row .jump-row.scroll-row"));
  assert.deepEqual(sheet.errors, []);
});

test("Decision 209: the Reference's chips all wrap in view, and a bar the CSS lets go on a phone isn't counted by a jump", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); refTab(app);
  const bar = app.$("#main .jumpbar.sticky.wrap");
  assert.ok(bar, "the Reference's bar doesn't wrap");
  assert.equal(bar.querySelector(".scroll-row"), null, "the chips still scroll sideways");
  assert.deepEqual(app.$$("#main .jump-row.jump-wrap .jump").map(b => b.textContent), [...app.D.gmReference.panels.map(p => p.title)]);
  type(app, "[data-jumpfilter]", "prone");
  assert.deepEqual(refChips(app), refHeads(app), "a search's chips land outside the wrapping box");
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  assert.match(css, /\.jump-wrap\{[^}]*flex-wrap:wrap/);
  assert.match(css, /@media \(max-width:639px\)\{ \.jumpbar\.sticky\.wrap\{position:static\} \}/);
  // jsdom has no layout: a 94 px header, a 311 px bar, and the heading 1000 px down.
  const w = app.window, realStyle = w.getComputedStyle;
  let position = "static", landed = null;
  w.getComputedStyle = el => el === bar ? { position, top: "94px" } : realStyle.call(w, el);
  w.scrollTo = o => { landed = o.top; };
  Object.defineProperty(app.$("header.top"), "offsetHeight", { get: () => 94 });
  Object.defineProperty(bar, "offsetHeight", { get: () => 311 });
  const chip = app.$("#main .jump"), head = app.$(`#${chip.dataset.jump}`);
  head.getBoundingClientRect = () => ({ top: 1000, bottom: 1030, left: 0, right: 300, width: 300, height: 30 });
  try {
    chip.click();
    assert.equal(landed, 1000 - 94 - 8, "a bar that scrolled away still pushed the heading down");
    position = "sticky"; chip.click();
    assert.equal(landed, 1000 - 94 - 311 - 8, "a sticky bar was not counted");
  } finally { w.getComputedStyle = realStyle; }
  assert.deepEqual(app.errors, []);
});

test("Decision 207: a running encounter is kept across a trip to the Reference and back", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); encTab(app);
  newEncounter(app, "Warehouse job"); addPcRow(app, "Wren");
  app.click("[data-enc-start]");
  assert.match(app.$(".enc-status").textContent, /Round 1/);
  refTab(app);
  assert.equal(app.$(".enc-status"), null);
  assert.ok(app.$("#gr-conditions"));
  encTab(app);
  assert.match(app.$(".enc-status").textContent, /Round 1/);
  assert.equal(app.$("[data-enc-title]").value, "Warehouse job");
  assert.deepEqual(app.errors, []);
});

// ── The secretary (Decision 208) ───────────────────────────────────────────
function secretaryApp() {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  app.window.eval(`(() => {
    const t = S.table, E = Engine;
    const m = E.addCastMember(t, { name: "Marta Voss" }).id;
    E.editCastMember(t, m, { flavor: "a fixer at the docks" });
    const s1 = E.addSession(t, { date: "2026-01-01" }).id;
    E.editSession(t, s1, { number: 3, journal: { happened: "Marta pointed at the dock crane" } });
    const s2 = E.addSession(t, { date: localDay() }).id;
    E.editSession(t, s2, { number: 6 });
    E.addInteraction(t, { kind: "shared", cast: [m], crew: ["Nyx"], text: "dock gossip", session: s1 });
    E.addInteraction(t, { kind: "shared", cast: [], crew: ["Nyx"], text: "dock rumour" });
    E.addThread(t, { title: "The courier" });
    tableChange(() => {});
  })()`);
  return app;
}
const findOpen = app => app.click("[data-tfind]");
const typeKeys = (app, sel, text) => { for (let i = 1; i <= text.length; i++) type(app, sel, text.slice(0, i)); };
const findHits = app => app.$$("#modal [data-fkind]");
const pressEsc = app => app.$("#modal").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

test("Decision 208: Find and Jot sit in the header on every tab and page of a table; switched off, Home has neither", () => {
  const off = boot();
  assert.equal(off.$("[data-tfind]"), null); assert.equal(off.$("[data-tjot]"), null);
  const app = secretaryApp();
  for (const sec of ["sessions", "players", "cast", "city", "threats", "encounters", "reference", "notes"]) {
    app.click(`[data-tsec="${sec}"]`);
    assert.ok(app.$("#hdractions [data-tfind]") && app.$("#hdractions [data-tjot]"), sec);
    assert.equal(app.$("#hdractions [data-tfind]").textContent, "Find");
  }
  app.click('[data-tsec="cast"]'); app.click("[data-copen]");
  assert.ok(app.$("[data-ctitle]") && app.$("[data-tfind]") && app.$("[data-tjot]"), "a member's page");
  encTab(app); newEncounter(app, "Docks"); addPcRow(app, "Wren"); app.click("[data-enc-start]");
  assert.match(app.$(".enc-status").textContent, /Round 1/);
  assert.ok(app.$("[data-tfind]") && app.$("[data-tjot]"), "a running encounter");
  assert.deepEqual(app.errors, []);
});

test("Decision 208: Find keeps its field and focus while typing, groups hits by kind with a count, marks the match; a cast hit opens the member", () => {
  const app = secretaryApp();
  findOpen(app);
  const q = app.$("[data-findq]");
  assert.equal(app.$("[data-findres]").getAttribute("aria-live"), null, "the results aren't a live region");
  assert.equal(app.doc.activeElement, q, "focus starts in the field");
  assert.equal(app.$("[data-findres]").textContent.trim(), "", "nothing under two characters");
  typeKeys(app, "[data-findq]", "dock");
  assert.equal(app.$("[data-findq]"), q, "typing redrew the field");
  assert.equal(app.doc.activeElement, q); assert.equal(q.value, "dock");
  const heads = app.$$("#modal .find-h").map(h => h.textContent.replace(/\s+/g, " ").trim());
  assert.deepEqual(heads, ["Cast 1", "Sessions 1", "Lines 2"]);
  assert.equal(app.$("[data-findcount]").textContent, "4 found");
  const marks = app.$$("#modal mark").map(m => m.textContent);
  assert.ok(marks.length >= 4 && marks.every(m => m.toLowerCase() === "dock"), marks.join("|"));
  const cast = findHits(app).find(b => b.dataset.fkind === "cast");
  assert.match(cast.textContent, /Marta Voss/); assert.match(cast.textContent, /Flavor/);
  cast.click();
  assert.equal(app.$("#modal").open, false, "the modal closes");
  assert.equal(app.window.eval("S.castOpen"), cast.dataset.fid);
  assert.equal(app.doc.activeElement, app.$("[data-ctitle]"));
  findOpen(app);
  assert.equal(app.$("[data-findq]").value, "dock"); assert.equal(findHits(app).length, 4, "the same results");
  typeKeys(app, "[data-findq]", "zzzz");
  assert.match(app.$("[data-findres]").textContent, /Nothing on the table matches\./);
  assert.deepEqual(app.errors, []);
});

test("Decision 208: a session hit opens its page; an interaction hit opens its session's page on the line, else its member, else Who knows what", () => {
  const app = secretaryApp();
  findOpen(app); typeKeys(app, "[data-findq]", "crane");
  findHits(app)[0].click();
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.equal(app.$("#main h1").textContent, "Session 3");
  assert.equal(app.doc.activeElement, app.$("#main h1"));
  findOpen(app); typeKeys(app, "[data-findq]", "gossip");
  const line = findHits(app).find(b => b.dataset.fkind === "interaction");
  line.click();
  assert.equal(app.window.eval("S.sessOpen"), app.window.eval("S.table.sessions.find(s => s.number === 3).id"));
  assert.equal(app.doc.activeElement, app.$(`[data-sline="${line.dataset.fid}"]`));
  findOpen(app); typeKeys(app, "[data-findq]", "rumour");
  findHits(app)[0].click();
  assert.equal(app.window.eval("S.tsection"), "cast"); assert.equal(app.window.eval("S.castView"), "crew");
  assert.equal(app.window.eval("S.castOpen"), null);
  assert.ok(app.doc.activeElement && app.doc.activeElement !== app.doc.body);
  // With a live member and no session, the member's page.
  app.window.eval(`(() => { const x = S.table.interactions.find(i => i.text === "dock rumour"); x.cast = [{ kind: "cast", id: S.table.cast[0].id }]; tableChange(() => {}); })()`);
  findOpen(app); typeKeys(app, "[data-findq]", "rumour");
  findHits(app).find(b => b.dataset.fkind === "interaction").click();
  assert.equal(app.window.eval("S.castOpen"), app.window.eval("S.table.cast[0].id"));
  assert.equal(app.doc.activeElement.dataset.int, app.window.eval("S.table.interactions.find(i => i.text === 'dock rumour').id"));
  assert.deepEqual(app.errors, []);
});

test("Decision 208: a thread, a note and an encounter hit each open their record", () => {
  const app = secretaryApp();
  app.window.eval(`(() => { Engine.addTableNote(S.table, { title: "Lantern", text: "Ike the bartender" }); tableChange(() => {}); })()`);
  encTab(app); newEncounter(app, "Harbour fight"); addPcRow(app, "Wren"); app.click("[data-enc-start]");
  findOpen(app); typeKeys(app, "[data-findq]", "courier");
  findHits(app).find(b => b.dataset.fkind === "thread").click();
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.equal(app.doc.activeElement.dataset.thtitle, app.window.eval("S.table.threads[0].id"));
  findOpen(app); typeKeys(app, "[data-findq]", "bartender");
  const n = findHits(app).find(b => b.dataset.fkind === "note");
  n.click();
  assert.equal(app.window.eval("S.tsection"), "notes");
  assert.equal(app.doc.activeElement, app.$(`[data-ntext="${n.dataset.fid}"]`));
  findOpen(app); typeKeys(app, "[data-findq]", "harbour");
  findHits(app).find(b => b.dataset.fkind === "encounter").click();
  assert.equal(app.window.eval("S.tsection"), "encounters");
  assert.equal(app.window.eval("S.encOpen"), app.window.eval("S.table.encounters[0].id"));
  assert.ok(app.doc.activeElement && app.doc.activeElement !== app.doc.body);
  assert.deepEqual(app.errors, []);
});

test("Decision 208: Jot from a running encounter saves a note with today's session and does not redraw the page under it", () => {
  const app = secretaryApp();
  encTab(app); newEncounter(app, "Docks"); addPcRow(app, "Wren"); app.click("[data-enc-start]");
  const before = [...app.$("#main").querySelectorAll("*")];
  const notesBefore = app.window.eval("S.table.notes.length");
  app.$("[data-tjot]").focus();   // a click focuses its button in a browser
  app.click("[data-tjot]");
  assert.equal(app.doc.activeElement, app.$("[data-jottext]"));
  assert.match(app.$("#modal").textContent, /Goes with Session 6\./);
  // Empty: refused, nothing added, nothing stamped or saved, focus stays.
  const stamp = () => [app.window.eval("S.table.meta.updated"), JSON.parse(app.window.localStorage.getItem(tableKeys(app)[0])).changed];
  const was = stamp();
  type(app, "[data-jottext]", "  " + String.fromCharCode(10) + " ");
  app.click("[data-jotsave]");
  assert.deepEqual(stamp(), was, "an empty Save counted as a change");
  assert.match(app.$("[data-jotwhy]").textContent, /Write something first\./);
  assert.equal(app.window.eval("S.table.notes.length"), notesBefore);
  assert.equal(app.doc.activeElement, app.$("[data-jottext]"));
  // Esc keeps the draft.
  type(app, "[data-jottext]", "Bartender at the Lantern: Ike");
  pressEsc(app);
  assert.equal(app.$("#modal").open, false);
  assert.equal(app.window.eval("S.jotDraft"), "Bartender at the Lantern: Ike");
  assert.equal(app.doc.activeElement, app.$("[data-tjot]"));
  app.click("[data-tjot]");
  assert.equal(app.$("[data-jottext]").value, "Bartender at the Lantern: Ike", "the draft is back");
  app.click("[data-jotsave]");
  assert.equal(app.$("#modal").open, false);
  const after = [...app.$("#main").querySelectorAll("*")];
  assert.equal(after.length, before.length); assert.ok(after.every((el, i) => el === before[i]), "the page under the jot was redrawn");
  assert.equal(app.doc.activeElement, app.$("[data-tjot]"));
  assert.match(app.$("#undotoast").textContent, /Jotted\./);
  assert.equal(app.window.eval("S.jotDraft"), "");
  const note = app.window.eval("S.table.notes[0]");
  assert.equal(note.text, "Bartender at the Lantern: Ike");
  assert.equal(note.session, app.window.eval("S.table.sessions.find(s => s.number === 6).id"));
  notesTab(app);
  assert.equal(app.$(`[data-nsess="${note.id}"]`).value, note.session);
  sessTab(app); app.window.eval(`S.sessOpen = S.table.sessions.find(s => s.number === 6).id; update()`);
  assert.match(app.$("#main").textContent, /Jotted/);
  assert.match(app.$("[data-jotopen]").textContent, /Bartender at the Lantern/);
  app.click("[data-jotopen]");
  assert.equal(app.window.eval("S.tsection"), "notes");
  assert.equal(app.doc.activeElement, app.$(`[data-ntext="${note.id}"]`));
  assert.deepEqual(app.errors, []);
});

test("Decision 208: a jot on the Notes tab or that session's page appears there; Ctrl+Enter saves; a note's Session select changes and clears", () => {
  const app = secretaryApp();
  notesTab(app);
  app.click("[data-tjot]");
  type(app, "[data-jottext]", "Owes Rook");
  app.$("[data-jottext]").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }));
  assert.equal(app.$("#modal").open, false);
  assert.equal(app.$$("[data-ntext]")[0].value, "Owes Rook", "the Notes tab redrew in place");
  const id = app.$$("[data-ntext]")[0].dataset.ntext;
  const sel = app.$(`[data-nsess="${id}"]`);
  assert.deepEqual([...sel.options].map(o => o.textContent.split(" · ")[0]), ["None", "Session 6", "Session 3"]);
  const three = app.window.eval("S.table.sessions.find(s => s.number === 3).id");
  changeTo(app, `[data-nsess="${id}"]`, three);
  assert.equal(app.window.eval(`S.table.notes.find(n => n.id === "${id}").session`), three);
  changeTo(app, `[data-nsess="${id}"]`, "");
  assert.equal(app.window.eval(`S.table.notes.find(n => n.id === "${id}").session`), null);
  // No session today, or two: the line says so and the jot has none.
  app.window.eval(`S.table.sessions.find(s => s.number === 6).date = "2026-01-02"; update()`);
  app.click("[data-tjot]");
  assert.match(app.$("#modal").textContent, /No session is dated today\./);
  pressEsc(app);
  app.window.eval(`S.table.sessions.forEach(s => { s.date = localDay(); }); update()`);
  app.click("[data-tjot]");
  assert.match(app.$("#modal").textContent, /More than one session is dated today\./);
  assert.deepEqual(app.errors, []);
});

// ── Wave Initiative (Decision 210) ─────────────────────────────────────
function waveApp() {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  encTab(app);
  newEncounter(app, "Docks");
  for (const n of ["Wren", "Rook"]) addPcRow(app, n);
  app.window.eval(`(function(){ const e = S.table.encounters[0], o = e.sides[1].id;
    for (const n of ["Tough", "Tough 2"]) { const r = Engine.addParticipant(S.table, e.id, { kind: "pc", name: n }); Engine.editParticipant(S.table, e.id, r.id, { side: o }); }
    renderTable(); })()`);
  return app;
}
const headings = app => app.$$(".enc-side-h").map(h => h.textContent);
const orderOf = (app, name, v) => changeTo(app, `[data-eorder="${rowId(encRowByName(app, name))}"]`, String(v));

test("210: a planned encounter is One at a time; Wave Initiative groups the rows under their sides and keeps the numbers", () => {
  const app = waveApp();
  assert.equal(app.$('[data-eby="person"]').getAttribute("aria-pressed"), "true");
  assert.equal(app.$$(".enc-side-h").length, 0, "one at a time has no headings");
  orderOf(app, "Wren", 14); orderOf(app, "Tough", 16);
  const wave = app.$('[data-eby="wave"]');
  wave.click();
  assert.equal(app.doc.activeElement, app.$('[data-eby="wave"]'), "focus left the pressed button");
  assert.equal(app.$('[data-eby="wave"]').getAttribute("aria-pressed"), "true");
  assert.deepEqual(headings(app), ["The other side", "The crew"], "16 beats 14");
  assert.match(app.$(".enc-side").textContent, /Best 16/);
  assert.ok(app.$("[data-eorder]"), "Combat Sense is still there");
  assert.equal(app.$$(".enc-tied").length, 0);
  // The tip.
  app.$('[data-tip="wave"]').click();
  assert.match(tipShown(app), /The side holding the best result acts first/);
  assert.deepEqual(app.errors, []);
});

test("210: a tie between sides is flagged on both headings and on no row; the order follows the numbers", () => {
  const app = waveApp();
  app.$('[data-eby="wave"]').click();
  orderOf(app, "Wren", 14); orderOf(app, "Tough", 14);
  assert.equal(app.$$(".enc-side-head .enc-tied").length, 2);
  assert.equal(app.$$(".enc-row .enc-tied").length, 0);
  orderOf(app, "Tough", 15);
  assert.equal(app.$$(".enc-tied").length, 0);
  assert.deepEqual(headings(app), ["The other side", "The crew"]);
  assert.deepEqual(app.errors, []);
});

test("210: Start lands on the best side's first row; Next goes through it, then the crew, then Reset", () => {
  const app = waveApp();
  app.$('[data-eby="wave"]').click();
  orderOf(app, "Wren", 14); orderOf(app, "Tough", 16);
  app.click("[data-enc-start]");
  const active = () => app.$$("[aria-current=step] .enc-name").map(x => x.textContent).join();
  assert.equal(active(), "Tough");
  assert.equal(app.doc.activeElement, app.$("[data-enext]"));
  const seen = [active()];
  for (let i = 0; i < 3; i++) { app.click("[data-enext]"); seen.push(active()); }
  assert.deepEqual(seen, ["Tough", "Tough 2", "Wren", "Rook"]);
  app.click("[data-enext]");
  assert.match(app.$("#main").textContent, /Reset: round 1 ends/);
  assert.deepEqual(app.errors, []);
});

test("210: a row's Side moves it under the other heading with its More open and focus on its select", () => {
  const app = waveApp();
  app.$('[data-eby="wave"]').click();
  const id = rowId(encRowByName(app, "Rook"));
  app.$(`[data-emore="${id}"] summary`).click();
  const sel = `[data-eside="${id}"]`;
  const other = app.window.eval("S.table.encounters[0].sides[1].id");
  changeTo(app, sel, other);
  assert.equal(app.window.eval(`S.table.encounters[0].rows.find(r => r.id === "${id}").side`), other);
  const sec = app.$(`[data-eside-sec="${other}"]`);
  assert.ok(sec.querySelector(`[data-erow="${id}"]`), "the row isn't under the other heading");
  assert.ok(app.$(`[data-emore="${id}"]`).open, "its More closed");
  assert.equal(app.doc.activeElement, app.$(sel));
  assert.deepEqual(app.errors, []);
});

test("210: Add a side opens a third heading with its Name focused; Remove side moves its rows, says so, and focus goes to Add a side", () => {
  const app = waveApp();
  app.$('[data-eby="wave"]').click();
  app.click("[data-eaddside]");
  assert.deepEqual(headings(app).length, 3);
  const nm = app.doc.activeElement;
  assert.ok(nm.matches("[data-esidename]"), "Name wasn't focused");
  const sid = nm.dataset.esidename;
  nm.value = "The Saints"; nm.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.ok(headings(app).includes("The Saints"));
  const rook = rowId(encRowByName(app, "Rook"));
  app.$(`[data-emore="${rook}"] summary`).click();
  changeTo(app, `[data-eside="${rook}"]`, sid);
  app.$(`[data-emore="${sid}"] summary`);
  app.click(`[data-esiderm="${sid}"]`);
  assert.equal(headings(app).length, 2);
  assert.match(app.$(".toast-msg").textContent, /Moved 1 to The other side\./);
  assert.equal(app.doc.activeElement, app.$("[data-eaddside]"));
  assert.ok(app.$(`[data-eside-sec="${app.window.eval("S.table.encounters[0].sides[1].id")}"] [data-erow="${rook}"]`));
  assert.deepEqual(app.errors, []);
});

test("210: a cast member who fights with the crew lands under The crew when added from their page; the toggle saves at once", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  app.window.eval(`Engine.addCastMember(S.table, { name: "Marta" });`);
  encTab(app);
  newEncounter(app, "Docks");
  app.$('[data-eby="wave"]').click();
  app.click('[data-tsec="cast"]');
  app.click("[data-copen]");
  const tog = app.$("[data-cally]");
  assert.equal(tog.getAttribute("aria-pressed"), "false");
  tog.click();
  assert.equal(app.$("[data-cally]").getAttribute("aria-pressed"), "true");
  assert.equal(app.window.eval("S.table.cast[0].ally"), true);
  app.click("[data-cenc]");
  encTab(app);
  const sec = app.$$(".enc-side").find(s => s.querySelector(".enc-side-h").textContent === "The crew");
  assert.ok(sec.textContent.includes("Marta"), "Marta isn't on the crew's side");
  assert.deepEqual(app.errors, []);
});

test("210: the Turns group is outside the sticky bar, planned or running; pressing the mode already on changes nothing", () => {
  const app = waveApp();
  const outside = () => { const g = app.$(".enc-turns"); assert.ok(g, "no Turns group"); assert.equal(g.closest(".enc-bar"), null, "the Turns group is inside the sticky bar"); };
  outside();
  app.click("[data-enc-start]");
  outside();
  app.window.eval(`S.table.meta.updated = "2000-01-01T00:00:00.000Z"; S.table.encounters[0].updated = "2000-01-01T00:00:00.000Z";`);
  app.$('[data-eby="person"]').click();
  assert.equal(app.window.eval("S.table.meta.updated"), "2000-01-01T00:00:00.000Z");
  assert.equal(app.window.eval("S.table.encounters[0].updated"), "2000-01-01T00:00:00.000Z");
  assert.equal(app.doc.activeElement, app.$('[data-eby="person"]'));
  app.$('[data-eby="wave"]').click();
  assert.notEqual(app.window.eval("S.table.meta.updated"), "2000-01-01T00:00:00.000Z", "a real change stamps");
  assert.deepEqual(app.errors, []);
});

test("210: switching back to One at a time drops the headings and keeps the numbers", () => {
  const app = waveApp();
  orderOf(app, "Wren", 14);
  app.$('[data-eby="wave"]').click();
  app.$('[data-eby="person"]').click();
  assert.equal(app.$$(".enc-side-h").length, 0);
  assert.equal(app.$(`[data-eorder="${rowId(encRowByName(app, "Wren"))}"]`).value, "14");
  app.$('[data-eby="wave"]').click();
  for (let i = 0; i < 6; i++) { const b = app.$("[data-eaddside]"); if (b) b.click(); }
  assert.equal(app.$("[data-eaddside]"), null, "Add a side is hidden at six");
  assert.deepEqual(app.errors, []);
});

// ── Adding to a fight from anywhere (Decision 211) ────────────────────────
const encRows = app => JSON.parse(app.window.eval("JSON.stringify(S.table.encounters.map(e => ({ name: e.name, status: e.status, rows: e.rows.map(r => r.name) })))"));

test("Decision 211: with no encounter at all, Add to a new encounter shows on a cast page, an entry page and a group page; a press makes one and relabels in place; a second goes to it", () => {
  const app = tableWithPack();
  entryButton(app, "gull").click();
  const btn = app.$("[data-tenc]"); btn.focus();
  assert.equal(btn.textContent, "Add to a new encounter");
  app.click("[data-tenc]");
  assert.match(app.$("#undotoast").textContent, /Gull is in a new encounter, Encounter \d{4}-\d\d-\d\d\./);
  assert.equal(app.$("[data-tenc]"), btn, "the page was redrawn under the button");
  assert.match(btn.textContent, /^Add to Encounter \d{4}-\d\d-\d\d$/);
  assert.equal(app.doc.activeElement, btn);
  app.click("[data-tenc]");
  assert.equal(encRows(app).length, 1);
  assert.deepEqual(encRows(app)[0].rows, ["Gull", "Gull 2"]);
  assert.equal(encRows(app)[0].status, "planned");
  app.click("[data-tback]"); app.click('[data-tview="group"]'); app.click("[data-tgroup]");
  assert.match(app.$("[data-tgrpenc]").textContent, /^Add to Encounter /);
  // A cast page, with every encounter ended, reads a new one.
  app.window.eval(`S.table.encounters[0].status = "ended"`);
  app.window.eval(`Engine.addCastMember(S.table, { name: "Dez" }); S.tsection = "cast"; S.castOpen = S.table.cast[0].id; S.threatGroup = null; update();`);
  assert.equal(app.$("[data-cenc]").textContent, "Add to a new encounter");
  app.click("[data-cenc]");
  assert.equal(encRows(app).length, 2);
  assert.match(app.$("[data-cenc]").textContent, /^Add to Encounter /);
  assert.deepEqual(app.errors, []);
});

test("Decision 211: a Threats card adds to the cast and the encounter without opening, keeps the search, numbers the rows, and works after a redraw", () => {
  const app = tableWithPack();
  app.window.eval(`Engine.addEncounter(S.table, { name: "Dock fight" });`);
  threatsTab(app);
  type(app, "[data-tsearch]", "gull");
  const card = () => app.$(`[data-tcard="${PACK_ID}|gull"]`);
  assert.equal(card().querySelectorAll("button").length, 3);
  const castBtn = card().querySelector("[data-tcardcast]"), encBtn = card().querySelector("[data-tcardenc]");
  assert.equal(castBtn.textContent, "Add to cast"); assert.equal(encBtn.textContent, "Add to Dock fight");
  assert.equal(encBtn.getAttribute("aria-label"), "Add Gull to Dock fight");
  assert.equal(castBtn.getAttribute("aria-label"), "Add Gull to the cast");
  encBtn.focus();
  for (let i = 0; i < 3; i++) app.click(`[data-tcardenc="${PACK_ID}|gull"]`);
  assert.equal(app.window.eval("S.threatOpen"), null, "a card press opened the card");
  assert.equal(app.$("[data-tsearch]").value, "gull");
  assert.deepEqual(encRows(app)[0].rows, ["Gull", "Gull 2", "Gull 3"]);
  assert.equal(app.doc.activeElement, encBtn);
  app.click(`[data-tcardcast="${PACK_ID}|gull"]`);
  assert.equal(app.window.eval("S.tsection"), "threats");
  assert.equal(app.window.eval("S.table.cast.length"), 1);
  assert.match(app.$("#undotoast").textContent, /Gull is in the cast\./);
  type(app, "[data-tsearch]", "gul");
  app.click(`[data-tcardenc="${PACK_ID}|gull"]`);
  assert.equal(encRows(app)[0].rows.length, 4, "a card's button died after the list redrew");
  app.click('[data-tview="group"]');
  const g = app.$("[data-tcard] [data-tcardgrp]");
  assert.equal(g.textContent, "Add to Dock fight");
  assert.equal(app.$("[data-tcard] [data-tcardcast]"), null, "a group card has no Add to cast");
  app.click("[data-tcardgrp]");
  assert.match(app.$("#undotoast").textContent, /Pier Watch: 4 added to Dock fight\./);
  assert.equal(encRows(app)[0].rows.length, 8);
  assert.deepEqual(app.errors, []);
});

test("Decision 211: a card's button names the running encounter, then the newest planned, and the open one first", () => {
  const app = tableWithPack();
  app.window.eval(`Engine.addEncounter(S.table, { name: "Old" }); Engine.addEncounter(S.table, { name: "Mid" });
    const r = Engine.addEncounter(S.table, { name: "Run" }).id; Engine.addParticipant(S.table, r, { kind: "pc", name: "Wren" }); Engine.startEncounter(S.table, r);
    Engine.addEncounter(S.table, { name: "New" });`);
  threatsTab(app);
  const label = () => app.$("[data-tcardenc]").textContent;
  assert.equal(label(), "Add to Run");
  app.window.eval(`S.table.encounters.find(e => e.name === "Run").status = "ended"; update();`);
  assert.equal(label(), "Add to New");
  app.click('[data-tsec="encounters"]');
  app.$$("[data-enc-open]").find(b => b.textContent === "Old").click();
  threatsTab(app);
  assert.equal(label(), "Add to Old", "the open encounter comes first");
  assert.deepEqual(app.errors, []);
});

test("Decision 211: From the Codex searches entries and groups from two characters and adds to this encounter, focus on the same Add", () => {
  const app = tableWithPack();
  app.click('[data-tsec="encounters"]'); newEncounter(app, "Dock fight");
  assert.ok(app.$("[data-enc-codex]"));
  app.click("[data-enc-codex]");
  assert.equal(app.$("[data-enc-codex]").getAttribute("aria-expanded"), "true");
  assert.equal(app.doc.activeElement, app.$("[data-enc-codexq]"));
  assert.match(app.$("[data-enccodexlist]").textContent, /Type a name, a role or an origin\./);
  type(app, "[data-enc-codexq]", "g");
  assert.equal(app.$$("[data-enc-addcodex]").length, 0, "one character listed something");
  type(app, "[data-enc-codexq]", "gu");
  const adds = app.$$("[data-enc-addcodex]");
  assert.deepEqual(adds.map(b => b.dataset.encCodexkind), ["entry", "group"]);
  assert.match(app.$("[data-enccodexlist]").textContent, /Group/);
  app.click(`[data-enc-addcodex="${PACK_ID}|gull"]`);
  assert.deepEqual(encRows(app)[0].rows, ["Gull"]);
  const again = app.$(`[data-enc-addcodex="${PACK_ID}|gull"]`);
  assert.equal(app.doc.activeElement, again, "focus left the Add");
  app.click(`[data-enc-addcodex="${PACK_ID}|gull"]`);
  assert.deepEqual(encRows(app)[0].rows, ["Gull", "Gull 2"]);
  app.click(`[data-enc-addcodex="${PACK_ID}|pier-watch"]`);
  assert.equal(encRows(app)[0].rows.length, 6);
  assert.equal(app.window.eval("S.table.cast.length"), 0);
  // Another encounter closes the search.
  app.click("[data-enc-back]"); newEncounter(app, "Second");
  assert.equal(app.$("[data-enc-codexq]"), null);
  assert.deepEqual(app.errors, []);
});

test("Decision 211: the Codex result's Add lands in the encounter it sits in, even with another running", () => {
  const app = tableWithPack();
  app.window.eval(`const r = Engine.addEncounter(S.table, { name: "Run" }).id; Engine.addParticipant(S.table, r, { kind: "pc", name: "Wren" }); Engine.startEncounter(S.table, r);
    Engine.addEncounter(S.table, { name: "Open" });`);
  app.click('[data-tsec="encounters"]');
  app.$$("[data-enc-open]").find(b => b.textContent === "Open").click();
  app.click("[data-enc-codex]"); type(app, "[data-enc-codexq]", "gull");
  app.click(`[data-enc-addcodex="${PACK_ID}|gull"]`);
  const by = Object.fromEntries(encRows(app).map(e => [e.name, e.rows]));
  assert.deepEqual(by.Open, ["Gull"]); assert.deepEqual(by.Run, ["Wren"]);
  assert.deepEqual(app.errors, []);
});

test("Decision 211: with no pack slotted, an encounter's Add says to slot one in", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); encTab(app); newEncounter(app, "E");
  assert.equal(app.$("[data-enc-codex]"), null);
  assert.match(app.$(".enc-add").textContent, /From the Codex: slot a pack in on Threats\./);
  assert.deepEqual(app.errors, []);
});

test("Decision 211: From the Codex lists entries in pack order (a person before a threat if the pack says so), then groups, and finds a group by its origin", () => {
  const pack = syntheticPack();
  pack.entries = [pack.entries.find(e => e.id === "moss"), ...pack.entries.filter(e => e.id !== "moss")];
  const app = tableWithPack(pack);
  app.click('[data-tsec="encounters"]'); newEncounter(app, "Dock fight");
  app.click("[data-enc-codex]");
  type(app, "[data-enc-codexq]", "dock");
  assert.deepEqual(app.$$("[data-enc-addcodex]").map(b => b.dataset.encAddcodex.split("|")[1]), ["moss", "gull", "pier-watch"]);
  assert.deepEqual(app.errors, []);
});

// ── The table's activity log (Decision 212) ───────────────────────────────

const rebase = app => app.window.eval("rebaseTable()");
const toastText = app => (app.$("#undotoast") && !app.$("#undotoast").hidden ? app.$("#undotoast").textContent : "");
const auditLabels = app => JSON.parse(app.window.eval("JSON.stringify(S.table.audit.map(e => e.label))"));
const openActivity212 = app => { app.click("[data-menu-toggle]"); app.click("[data-tactivity]"); };

test("Decision 212: a press that wrote before tableChange is recorded; the toast's Undo takes it back", () => {
  const app = hitApp();
  rebase(app);
  const dez = rowId(encRowByName(app, "Dez"));
  app.click(`[data-edmg="${dez}|1"]`); app.$("[data-edmgn]").value = "6"; submit(app, "[data-edmgform]");
  const damage = () => app.window.eval(`S.table.encounters[0].rows.find(r => r.id === "${dez}").damage`);
  assert.equal(damage(), 6);
  assert.match(toastText(app), /^Changed Job/);
  assert.ok(app.$("[data-toastundo]"));
  app.click("[data-toastundo]");
  assert.equal(damage(), 0, "the toast's Undo didn't take the damage back");
  assert.match(toastText(app), /Undone: Changed Job/);
  assert.equal(auditLabels(app).length, 0);
  assert.deepEqual(app.errors, []);
});

test("Decision 212: Add to an encounter shows its own words with Undo, and Undo removes the row", () => {
  const app = tableWithPack();
  entryButton(app, "gull").click();
  rebase(app);
  app.click("[data-tenc]");
  assert.match(toastText(app), /Gull is in a new encounter/);
  assert.ok(app.$("#undotoast [data-toastundo]"), "the notice replaced the toast without Undo");
  assert.equal(encRows(app).length, 1);
  app.click("#undotoast [data-toastundo]");
  assert.equal(encRows(app).length, 0, "Undo left the encounter");
  assert.deepEqual(app.errors, []);
});

test("Decision 212: a refusal a moment later doesn't borrow the leftover toast's Undo", () => {
  const app = tableWithPack();
  entryButton(app, "gull").click();
  rebase(app);
  app.click("[data-tenc]");
  assert.ok(app.$("#undotoast [data-toastundo]"));
  app.doc.body.click();
  app.window.eval(`notice("Something was refused.")`);
  assert.equal(app.$("#undotoast [data-toastundo]"), null, "a later notice kept the Undo");
});

test("Decision 212: Use on an entry page is recorded, and Undo takes the copy out of the cast", () => {
  const app = tableWithPack();
  entryButton(app, "gull").click();
  rebase(app);
  app.click("[data-tuse]");
  assert.equal(app.window.eval("S.table.cast.length"), 1);
  assert.match(auditLabels(app)[0], /^Added Gull to the cast$/);
  assert.ok(app.$("#undotoast [data-toastundo]"));
  app.click("#undotoast [data-toastundo]");
  assert.equal(app.window.eval("S.table.cast.length"), 0);
  assert.deepEqual(app.errors, []);
});

test("Decision 212: typing in a member's field shows no toast, makes one entry, and Activity's Undo restores the text", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  type(app, "[data-cadd-name]", "Marta"); keyIn(app, "[data-cadd-name]", "Enter");
  app.click("[data-copen]");
  rebase(app);
  app.click("[data-toastclose]");
  for (const v of ["W", "Wa", "Wan", "Want"]) type(app, '[data-cf="motivation"]', v);
  assert.equal(toastText(app), "", "typing showed a toast");
  // Tabbing away re-sends the same value on `change`: no entry of its own, and no toast.
  app.$('[data-cf="motivation"]').dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(toastText(app), "", "leaving the field showed a toast");
  assert.deepEqual(auditLabels(app), ["Added Marta to the cast", "Changed Marta"]);
  openActivity212(app);
  assert.match(app.$("#modal [data-act-undo]").textContent, /^Undo: Changed Marta$/);
  app.click("#modal [data-act-undo]");
  assert.equal(app.window.eval("S.table.cast[0].motivation"), "");
  assert.deepEqual(app.errors, []);
});

test("Decision 212: Activity lists newest first, Undo redraws the page behind and keeps focus on the next Undo; undoing the add of the open member draws the list", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  const add = name => { type(app, "[data-cadd-name]", name); keyIn(app, "[data-cadd-name]", "Enter"); };
  add("Marta"); add("Dez");
  assert.deepEqual(auditLabels(app), ["Added Marta to the cast", "Added Dez to the cast"]);
  openActivity212(app);
  assert.deepEqual(app.$$("#modal .act-label").map(e => e.textContent), ["Added Dez to the cast", "Added Marta to the cast"]);
  assert.equal(app.doc.activeElement, app.$("#modal [data-act-undo]"));
  app.click("#modal [data-act-undo]");
  assert.match(app.$("#modal [data-act-undo]").textContent, /Undo: Added Marta to the cast/);
  assert.equal(app.doc.activeElement, app.$("#modal [data-act-undo]"));
  assert.equal(app.window.eval("S.table.cast.length"), 1);
  assert.doesNotMatch(app.$("#main").textContent, /Dez/, "the page behind didn't redraw");
  app.click("#modal [data-act-undo]");
  assert.equal(app.$("#modal [data-act-undo]"), null);
  assert.match(app.$("#modal").textContent, /Nothing to undo yet/);
  assert.equal(app.doc.activeElement, app.$("#modal-title"));
  assert.deepEqual(app.errors, []);
});

test("Decision 212: undoing the add of the member whose page is open draws the cast list", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  type(app, "[data-cadd-name]", "Marta"); keyIn(app, "[data-cadd-name]", "Enter");
  app.click("[data-copen]");
  assert.ok(app.$("[data-cback]"));
  openActivity212(app);
  app.click("#modal [data-act-undo]");
  assert.ok(app.$("[data-cadd-name]"), "the cast list didn't draw");
  assert.deepEqual(app.errors, []);
});

test("Decision 212: Clear activity asks first, then empties", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  type(app, "[data-cadd-name]", "Marta"); keyIn(app, "[data-cadd-name]", "Enter");
  openActivity212(app);
  app.click("#modal [data-act-clear]");
  assert.match(app.$("#modal").textContent, /Clear this table's activity\?/);
  assert.equal(auditLabels(app).length, 1, "it cleared before asking");
  app.click("#modal [data-askyes]");
  assert.equal(auditLabels(app).length, 0);
  assert.match(app.$("#modal").textContent, /Nothing to undo yet/);
  assert.equal(app.window.eval("S.table.cast.length"), 1, "Clear changed the table");
  assert.deepEqual(app.errors, []);
});

test("Decision 212: deleting a session still asks, and Undo brings it back", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T", { stay: true });
  app.click("[data-snew]");
  app.click("[data-sback]");
  rebase(app);
  app.click("[data-sopen]");
  app.click("[data-sdel]");
  assert.ok(app.$("#modal [data-askyes]"), "Delete didn't ask");
  assert.equal(app.window.eval("S.table.sessions.length"), 1);
  app.click("#modal [data-askyes]");
  assert.equal(app.window.eval("S.table.sessions.length"), 0);
  assert.match(toastText(app), /^Removed Session 1/);
  app.click("#undotoast [data-toastundo]");
  assert.equal(app.window.eval("S.table.sessions.length"), 1);
  assert.deepEqual(app.errors, []);
});

test("Decision 212: End with a Keep reads Ended …, and Undo runs the encounter again without the kept member", () => {
  const app = wrapApp();
  rebase(app);
  app.click("[data-enc-end]");
  const keep = wrapRow(app, "Gull").querySelector("[data-ew-keep]");
  keep.checked = true; keep.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  app.click("[data-ew-end]");
  assert.match(toastText(app), /^Ended Job/);
  assert.equal(app.window.eval("S.table.encounters[0].status"), "ended");
  assert.equal(app.window.eval("S.table.cast.length"), 2);
  app.click("#undotoast [data-toastundo]");
  assert.equal(app.window.eval("S.table.encounters[0].status"), "running");
  assert.equal(app.window.eval("S.table.cast.length"), 1);
  assert.deepEqual(app.errors, []);
});

test("Decision 212: a leftover toast undoes nothing once a later press has been recorded", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T");
  type(app, "[data-cadd-name]", "Marta"); keyIn(app, "[data-cadd-name]", "Enter");
  const stale = app.$("#undotoast [data-toastundo]");
  assert.ok(stale);
  type(app, "[data-cadd-name]", "Dez"); keyIn(app, "[data-cadd-name]", "Enter");
  stale.click();
  assert.equal(app.window.eval("S.table.cast.length"), 2, "a stale toast undid a later action");
});

test("Decision 212: an exported table carries its trail, and imported fresh, Activity lists it and Undo works", async () => {
  const app = boot({ storage: GM_ON });
  const downloads = withDownloads(app);
  runTable(app, "T");
  type(app, "[data-cadd-name]", "Marta"); keyIn(app, "[data-cadd-name]", "Enter");
  app.click("[data-menu-toggle]"); app.click("[data-texport-open]");
  const file = await tableFile(downloads[0]);
  assert.equal(file.audit.length, 1);
  const fresh = boot({ storage: GM_ON }); withDownloads(fresh);
  await importFile(fresh, file);
  openActivity212(fresh);
  assert.deepEqual(fresh.$$("#modal .act-label").map(e => e.textContent), ["Added Marta to the cast"]);
  fresh.click("#modal [data-act-undo]");
  assert.equal(fresh.window.eval("S.table.cast.length"), 0);
  assert.deepEqual([...app.errors, ...fresh.errors], []);
});

// ── P8b: GM mode's Reset asks the check beside the marks (Decision 220) ────
test("P8b 18: GM mode's Reset row shows the marks and the check", () => {
  const app = boot({ storage: GM_ON });
  runTable(app, "T"); encTab(app); newEncounter(app, "E");
  const a = rowId(addPcRow(app, "A"));
  app.click(`[data-econdopen="${a}"]`); changeTo(app, "[data-econd-id]", "dying"); app.click("[data-econd-add]");
  app.click(`[data-econdopen="${a}"]`); changeTo(app, "[data-econd-id]", "bleeding"); app.click("[data-econd-add]");
  app.click("[data-enc-start]"); app.click("[data-enext]");
  const W = app.D.damageRules.whileDying;
  const text = app.$(".enc-reset").textContent;
  assert.match(text, /1 source ticked: 1 Death Mark\./);
  assert.ok(text.includes(W.resetCheck), "the check is asked beside the mark");
  assert.deepEqual(app.errors, []);
});

// ── P20b: numbers in play (Decision 236) ──
test("P20b 6c: an encounter hit has no melee box, and an NPC's head hit doubles", () => {
  const app = hitApp();
  // A PC row holds a name and the GM's numbers, no character, so there is no trait to ask; an NPC stand-in holds none either.
  for (const name of ["Dez", "Wren"]) {
    hitBtn(app, name).click();
    assert.equal(app.$('[data-ehitpanel] [data-ehit-melee], [data-ehitpanel] [data-hit="melee"]'), null, `${name}'s hit panel asks what hit it`);
    app.click("[data-ehit-cancel]");
  }
  // The book's rule applies to anyone: a head hit on Dez doubles, and the preview says so.
  hitBtn(app, "Dez").click();
  changeTo(app, "[data-ehit-loc]", "head");
  fillHit(app, 6, "blade");
  assert.match(preview(app), /Head: ×2 \(6 → 12\)/);
  assert.match(preview(app), /12 through/);
  changeTo(app, "[data-ehit-loc]", "left-leg");
  assert.doesNotMatch(preview(app), /×2/);
  assert.deepEqual(app.errors, []);
});

// ── A fight's line links its fight (Decision 241) ──────────────────────
// wrapApp's table, with a session dated today, and Dez set Dead at End: Dez's line reads "Wren and Rook killed Dez in Job".
const endedApp = () => {
  const app = wrapApp();
  app.window.eval(`Engine.addSession(S.table, { number: 1, date: Engine.localDay() }); renderTable();`);
  app.click("[data-enc-end]");
  changeTo(app, `[data-ewrow] [data-ew-status="${wrapRow(app, "Dez").dataset.ewrow}"]`, "dead");
  app.click("[data-ew-end]");
  return app;
};
const dezId = app => app.window.eval(`S.table.cast.find(n => n.name === "Dez").id`);
const openDez = app => { app.click('[data-tsec="cast"]'); pick(app, "[data-cstatus]", "all"); app.click(`[data-copen="${dezId(app)}"]`); };
const linkOf = app => app.window.eval(`S.table.interactions[0].encounter`);

test("241: End writes the link, its text is the figures, and the member's page reads the sentence", () => {
  const app = endedApp();
  assert.equal(JSON.stringify(linkOf(app)), JSON.stringify({ kind: "encounter", id: encId(app) }));
  assert.match(app.window.eval("S.table.interactions[0].text"), /^\d+ of 8 Health Levels left; Prone\.$/);
  openDez(app);
  const line = app.$(".int-line");
  assert.match(line.textContent, /^Wren and Rook killed Dez in Job on \S+: \d+ of 8 Health Levels left; Prone\./);
  assert.equal(line.querySelector("[data-copen]"), null, "the member's own name is a button on their own page");
  assert.equal(line.querySelectorAll("[data-eopenline]").length, 1);
  assert.deepEqual(app.errors, []);
});

test("241: the fight's name opens the ended encounter, and Back returns to the member's page, on the link", () => {
  const app = endedApp();
  openDez(app);
  app.click("[data-eopenline]");
  assert.equal(app.window.eval("S.tsection"), "encounters");
  assert.ok(app.doc.activeElement.hasAttribute("data-enc-h"), "focus isn't on the encounter's heading");
  assert.equal(app.$("[data-enc-back]").textContent, "Back to Dez");
  app.click("[data-enc-back]");
  assert.equal(app.window.eval("S.castOpen"), dezId(app));
  assert.ok(app.doc.activeElement.hasAttribute("data-eopenline"), "focus isn't on the link it came from");
  assert.deepEqual(app.errors, []);
});

test("241: the fight's name from Who knows what, and Back returns to the same view", () => {
  const app = endedApp();
  app.click('[data-tsec="cast"]'); app.click('[data-cview="crew"]');
  type(app, "[data-csearch]", "job");
  const copies = app.$$(".crew-group .int-line [data-eopenline]");
  assert.equal(copies.length, 2, "a line should show once per crew name");
  const link = copies[1], key = link.dataset.eopenline;
  assert.notEqual(copies[0].dataset.eopenline, key, "the two copies share a key");
  link.click();
  assert.equal(app.$("[data-enc-back]").textContent, "Back to Who knows what");
  app.click("[data-enc-back]");
  assert.equal(app.window.eval("S.castView"), "crew");
  assert.equal(app.window.eval("S.castOpen"), null);
  assert.ok(app.$(".crew-group"), "Who knows what wasn't drawn");
  assert.equal(app.$("[data-csearch]").value, "job", "the search was lost");
  assert.equal(app.doc.activeElement, app.$$(".crew-group .int-line [data-eopenline]")[1], "focus isn't on the copy that was tapped");
  assert.equal(app.doc.activeElement.dataset.eopenline, key);
  assert.deepEqual(app.errors, []);
});

test("241: the fight's name from a session's page, and Back returns to that session", () => {
  const app = endedApp();
  app.click('[data-tsec="sessions"]'); app.click("[data-sopen]");
  const sid = app.window.eval("S.sessOpen");
  const link = app.$("[data-sline] [data-eopenline]");
  assert.ok(link, "the session's page doesn't show the fight's line");
  link.click();
  assert.match(app.$("[data-enc-back]").textContent, /^Back to Session 1/);
  app.click("[data-enc-back]");
  assert.equal(app.window.eval("S.tsection"), "sessions");
  assert.equal(app.window.eval("S.sessOpen"), sid);
  assert.ok(app.doc.activeElement.hasAttribute("data-eopenline"));
  assert.deepEqual(app.errors, []);
});

test("241: reaching an encounter any other way, Back goes to the Encounters list as before", () => {
  const app = endedApp();
  openDez(app);
  app.click("[data-eopenline]");
  app.click('[data-tsec="encounters"]');            // a tab press clears the route; the encounter stays open
  assert.equal(app.$("[data-enc-back]").textContent, "Back to encounters");
  app.click("[data-enc-back]");
  assert.equal(app.window.eval("S.tsection"), "encounters");
  assert.equal(app.window.eval("S.encOpen"), null);
});

test("241: renaming the fight renames the sentence; removing it leaves its name struck through, with no button and no error", () => {
  const app = endedApp();
  // An ended encounter is read-only (188), so the rename is made in the data, as an earlier build or a hand edit would.
  app.window.eval(`S.table.encounters[0].name = "The Pier";`);
  openDez(app);
  assert.match(app.$(".int-line").textContent, /killed Dez in The Pier on /);
  app.click('[data-tsec="encounters"]'); app.click("[data-enc-open]");
  app.click("[data-enc-del]"); app.click("#modal [data-askyes]");
  openDez(app);
  const gone = app.$(".int-line s");
  assert.equal(gone.textContent, "The Pier");
  assert.ok(gone.nextElementSibling.classList.contains("vh"));
  assert.equal(app.$("[data-eopenline]"), null);
  assert.deepEqual(app.errors, []);
});

test("241: the wrap-up shows the sentence above each record's text, and it turns to killed when the status is set Dead", () => {
  const app = wrapApp();
  app.click("[data-enc-end]");
  const row = wrapRow(app, "Dez");
  const sent = () => row.querySelector("[data-ew-sent]").textContent;
  assert.match(sent(), /^Wren and Rook fought Dez in Job on \S+:$/);
  changeTo(app, `[data-ew-status="${row.dataset.ewrow}"]`, "dead");
  assert.match(sent(), /^Wren and Rook killed Dez in Job on \S+:$/);
  assert.equal(row.querySelector("[data-ew-sent] button"), null, "the preview has buttons");
  assert.deepEqual(app.errors, []);
});

test("241 (review): the wrap-up's sentence follows a Keep's name as it's typed, and a cleared name reads as the row's, as End writes it", () => {
  const app = wrapApp();
  app.click("[data-enc-end]");
  const keep = wrapRow(app, "Gull").querySelector("[data-ew-keep]");
  keep.checked = true; keep.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  const rid = keep.dataset.ewKeep, sent = () => app.$(`[data-ew-sent="${rid}"]`).textContent;
  assert.match(sent(), /^Wren and Rook fought Gull in Job on \S+:$/);
  type(app, `[data-ew-name="${rid}"]`, "Old Gull");
  assert.match(sent(), /^Wren and Rook fought Old Gull in Job on /, "the sentence didn't follow the name");
  type(app, `[data-ew-name="${rid}"]`, "  ");
  assert.match(sent(), /^Wren and Rook fought Gull in Job on /, "a cleared name didn't read as the row's");
  app.click(`[data-ew-line="${rid}"]`); app.click(`[data-ew-line="${rid}"]`);   // a redraw reads the draft the same way
  assert.match(sent(), /^Wren and Rook fought Gull in Job on /);
  assert.deepEqual(app.errors, []);
});
