/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: a seat in a fight (Decision 257). A PC row named for a seat reads the copy and takes the
 * whole hit; the guard is the last test: no press in a fight writes the copy or the roster.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, GM_ON, lockedCharacter, tableCard, type } from "./smokekit.mjs";

const DEZ_TAG = "TAG-EEEE-EEEE-EEEE";

/** Dez: every stat 6 (30 HP), filed at 4 damage with Bleeding, in a Reinforced Denim Vest with 1 Integrity lost. */
function dez() {
  const ch = lockedCharacter();
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 6;
  ch.identity.name = "Dez"; ch.meta.id = DEZ_TAG; ch.meta.updated = "2026-10-02T10:00:00.000Z";
  ch.armor = [{ id: "reinforced-denim-vest", worn: true, integrityLoss: 1 }];
  ch.trackers.damage = 4;
  Engine.addCondition(ch, { id: "bleeding" });
  return ch;
}
function open(ch = dez()) {
  const t = Engine.newTable("Dead Air");
  const pid = Engine.addPlayer(t, { name: "Brogan" }).id;
  assert.ok(Engine.importSeat(t, pid, ch).ok);
  t.audit = [];
  const app = boot({ storage: { ["shadows.table.v1." + t.meta.id]: { table: t, section: "encounters", changed: "2026-10-05T10:00:00.000Z", exported: null }, ...GM_ON } });
  tableCard(app, "Dead Air").querySelector("[data-topen]").click();
  return app;
}
const changeTo = (app, sel, value) => { const el = app.$(sel); el.value = value; el.dispatchEvent(new app.window.Event("change", { bubbles: true })); };
const submit = (app, sel) => app.$(sel).dispatchEvent(new app.window.Event("submit", { bubbles: true, cancelable: true }));
const ev = (app, expr) => app.window.eval(expr);
const stored = app => { const ls = app.window.localStorage; for (let i = 0; i < ls.length; i++) if (ls.key(i).startsWith("shadows.table.v1.")) return JSON.parse(ls.getItem(ls.key(i))); return null; };
const copiesOf = app => JSON.stringify((stored(app).table || stored(app)).copies);
const withDez = app => {
  app.click('[data-tsec="encounters"]');
  type(app, "[data-enc-name]", "Docks"); app.click("[data-enc-new]");
  app.click("[data-enc-player]"); type(app, "[data-enc-pname]", "Dez"); app.click("[data-enc-addplayer]");
  return app.$("[data-erow]").dataset.erow;
};
const hitDez = (app, id, damage = "10", prot = "3") => {
  app.click(`[data-ehit="${id}"]`);
  type(app, "[data-ehit-damage]", damage);
  type(app, "[data-ehit-prot]", prot);
};

test("257: a claimed row's name opens the read-only sheet, and Back returns to the row", () => {
  const app = open();
  withDez(app);
  assert.match(app.$("[data-erow]").textContent, /From Dez's sheet · file from/);
  app.click("[data-eopenseat]");
  const h1 = app.$("#main h1[data-rosheeth]");
  assert.equal(h1.textContent, "Dez");
  assert.equal(app.doc.activeElement, h1);
  assert.equal(app.$("[data-seatback]").textContent, "Back to Docks");
  app.click("[data-seatback]");
  assert.equal(app.doc.activeElement, app.$("[data-erow] [data-eopenseat]"));
  assert.ok(app.$("[data-erow]"), "the encounter, the row in place");
  // A header tab from the sheet clears the route: the way back to Players is Players.
  app.click("[data-eopenseat]");
  app.click('[data-tsec="players"]'); app.click("[data-seat]");
  assert.equal(app.$("[data-seatback]").textContent, "Back to players");
  assert.equal(ev(app, "S.backEnc"), null);
  assert.deepEqual(app.errors, []);
});

test("257: the Hit panel on a claimed row asks the sheet's questions, and Apply hits through the armor", () => {
  const app = open();
  const id = withDez(app);
  assert.match(app.$("[data-erow] .enc-health").textContent, /HP 26 \/ 30/);
  assert.match(app.$("[data-erow]").textContent, /Reinforced Denim Vest · PROT 1d4 · RES \+4 · INT 9\/10/);
  assert.equal(app.$("[data-ehp]"), null, "the GM's own HP field is hidden while claimed");
  app.click(`[data-ehit="${id}"]`);
  assert.ok(app.$("[data-ehit-prot]"), "PROT roll");
  assert.ok(app.$("[data-ehit-ap]"), "AP");
  assert.doesNotMatch(app.$("[data-ehitpanel]").textContent, /Got through/);
  type(app, "[data-ehit-damage]", "10");
  assert.match(app.$("[data-ehit-preview]").textContent, /Enter the PROT die you rolled\./);
  assert.equal(app.$("[data-ehit-apply]").disabled, true);
  type(app, "[data-ehit-prot]", "3");
  assert.match(app.$("[data-ehit-preview]").textContent, /Reinforced Denim Vest stops 7 \(PROT 3 \+ RES 4\) · 3 through · 1 Health Level/);
  app.click("[data-ehit-apply]");
  assert.match(app.$("[data-erow] .enc-health").textContent, /HP 23 \/ 30/);
  assert.equal(JSON.parse(ev(app, "JSON.stringify(S.table.audit.map(e => e.label))")).at(-1), "Hit Dez");
  assert.equal(ev(app, "S.ch"), null);
  assert.deepEqual(Object.keys(app.window.localStorage).filter(k => k.startsWith("shadows.char.v1.")), []);
  assert.deepEqual(app.errors, []);
});

test("257: no press in a fight writes a seat's copy", () => {
  const app = open();
  const id = withDez(app);
  const was = copiesOf(app);
  const same = (what) => { assert.equal(copiesOf(app), was, what); assert.deepEqual(Object.keys(app.window.localStorage).filter(k => k.startsWith("shadows.char.v1.")), [], what); assert.equal(ev(app, "S.ch"), null, what); };
  hitDez(app, id); app.click("[data-ehit-apply]"); same("a hit");
  app.click(`[data-edmg="${id}|1"]`); type(app, "[data-edmgn]", "2"); submit(app, "[data-edmgform]"); same("a Take");
  app.click(`[data-edmg="${id}|-1"]`); type(app, "[data-edmgn]", "1"); submit(app, "[data-edmgform]"); same("a Heal");
  app.click(`[data-econdopen="${id}"]`); changeTo(app, "[data-econd-id]", "stunned"); app.click("[data-econd-add]"); same("a Condition");
  app.click("[data-enc-start]"); app.click("[data-enext]");
  app.click("[data-efinish]"); same("a Reset");
  assert.match(JSON.parse(ev(app, "JSON.stringify(S.table.audit.map(e => e.label))")).at(-1), /^Reset /, "the Reset ran");
  app.click("[data-enc-end]"); app.click("[data-ew-end]"); same("End");
  assert.equal(ev(app, "S.table.encounters[0].status"), "ended", "End ran");
  assert.deepEqual(app.errors, []);
});

test("257: a claimed row's Hit panel says which of two worn body pieces counts, as the sheet does", () => {
  const ch = dez();
  ch.armor.push({ id: "kevlar-vest", worn: true, integrityLoss: 0 });
  const app = open(ch);
  const id = withDez(app);
  app.click(`[data-ehit="${id}"]`);
  assert.match(app.$("[data-ehitpanel] .enc-seat-asks").textContent, /2 body pieces are marked worn\. Armor doesn't layer, so only Reinforced Denim Vest counts\./);
  assert.deepEqual(app.errors, []);
});

test("257: the preview says what the armor lost, and a clash among three seats says all", () => {
  const app = open();
  const id = withDez(app);
  hitDez(app, id, "3", "4");
  assert.match(app.$("[data-ehit-preview]").textContent, /0 through · 0 Health Levels · INT −1$/);
  app.click("[data-ehit-cancel]");
  for (const n of ["Wren", "Vex"]) {
    const f = dez(); f.identity.name = n; f.meta.id = n === "Wren" ? "TAG-FFFF-FFFF-FFFF" : "TAG-GGGG-GGGG-GGGG";
    assert.equal(ev(app, `(() => { const r = Engine.importSeat(S.table, S.table.players[0].id, ${JSON.stringify(f)}); Engine.setSeat(S.table, ${JSON.stringify(f.meta.id)}, { names: ["Dez"] }); return r.ok; })()`), true);
  }
  app.click('[data-tsec="players"]'); app.click('[data-tsec="encounters"]');
  assert.match(app.$("[data-erow]").textContent, /Dez, Wren and Vex all answer to this name, so it counts as none of them\./);
  assert.deepEqual(app.errors, []);
});

test("257: a Compromised vest reads 'Compromised: RES is gone' on the row and in the Hit panel, and scrap reads Scrap", () => {
  const app = open();
  const id = withDez(app);
  ev(app, `tableChange(() => { const r = S.table.encounters[0].rows[0]; r.armorLoss = 10; })`);
  assert.match(app.$("[data-erow] .enc-armor").textContent, /INT 0\/10 · Compromised: RES is gone$/);
  app.click(`[data-ehit="${id}"]`);
  assert.match(app.$(".enc-seat-armor").textContent, /INT 0\/10 · Compromised: RES is gone$/);
  ev(app, `tableChange(() => { S.table.encounters[0].rows[0].scrapped = true; })`);
  assert.match(app.$("[data-erow] .enc-armor").textContent, /· Scrap$/);
  assert.deepEqual(app.errors, []);
});
