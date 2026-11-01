/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: the crew as buttons (Decision 262). The encounter's Add section and a session's
 * Who was there (its page and its close-out) show a button per active seat, in the Players tab's
 * order, and Add a player for anyone else. Every test reads what the page draws.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, GM_ON, lockedCharacter, type, keyIn, tableCard } from "./smokekit.mjs";

const TAGS = { Dez: "TAG-AAAA-AAAA-AAAA", Wren: "TAG-BBBB-BBBB-BBBB", Ivo: "TAG-CCCC-CCCC-CCCC", Kit: "TAG-DDDD-DDDD-DDDD" };
const file = name => {
  const ch = lockedCharacter();
  ch.identity.name = name;
  ch.meta.updated = "2026-10-02T10:00:00.000Z";
  ch.meta.id = TAGS[name];
  return ch;
};

/** Dez (also written "Dezzy"), Wren and Ivo seated on Brogan, Kit benched; a planned encounter and two sessions. */
function crewTable(present = ["Wren", "Rook"]) {
  const t = Engine.newTable("Crew");
  const pid = Engine.addPlayer(t, { name: "Brogan" }).id;
  for (const n of ["Dez", "Wren", "Ivo", "Kit"]) assert.ok(Engine.importSeat(t, pid, file(n)).ok);
  assert.ok(Engine.setSeat(t, TAGS.Dez, { names: ["Dezzy"] }).ok);
  assert.ok(Engine.setSeat(t, TAGS.Kit, { status: "benched" }).ok);
  Engine.addEncounter(t, { name: "Docks" });
  const a = Engine.addSession(t, { number: 3, date: "2026-09-01" }).id;
  Engine.editSession(t, a, { present, hours: 3.5 });
  const key = "shadows.table.v1." + t.meta.id;
  return { t, a, storage: { ...GM_ON, [key]: { table: t, section: "encounters", changed: "2026-10-05T10:00:00.000Z", exported: null } } };
}
const open = ({ storage }) => { const app = boot({ storage }); tableCard(app, "Crew").querySelector("[data-topen]").click(); return app; };
const present = (app, id) => JSON.parse(app.window.eval(`JSON.stringify(S.table.sessions.find(s => s.id === ${JSON.stringify(id)}).present)`));
const seatBtns = app => app.$$("[data-enc-seat]");
const seatLabels = app => seatBtns(app).map(b => b.textContent.replace(/\s*In$/, "").trim());
const rows = app => app.$$("[data-erow] .enc-name").map(x => x.textContent.trim());
const whoBtns = app => app.$$("[data-crew-box] .crew-btns button:not([data-crew-add])");
const whoNames = app => whoBtns(app).map(b => b.textContent.replace("✓", "").trim());
const whoPress = (app, name) => whoBtns(app).find(b => b.textContent.replace("✓", "").trim() === name).click();
const whoAdd = (app, name) => { if (!app.$("[data-crew-input]")) app.click("[data-crew-add]"); type(app, "[data-crew-input]", name); app.click("[data-crew-go]"); };
const newFight = app => { app.click('[data-tsec="encounters"]'); type(app, "[data-enc-name]", "Fight"); app.click("[data-enc-new]"); };
const coRow = (app, name) => app.$$("[data-co-row]").find(r => r.querySelector(".co-name").textContent === name);
const coField = (app, name, f) => coRow(app, name).querySelector(`[data-co="${f}"]`);

test("262: the encounter's crew buttons add one row each and show In; Remove enables the button again", () => {
  const app = open(crewTable());
  newFight(app);
  assert.deepEqual(seatLabels(app), ["Dez", "Wren", "Ivo"], "active seats only, in the Players tab's order");
  assert.ok(seatBtns(app).every(b => !b.disabled));
  assert.equal(app.$('[data-enc-seat]').closest("[role=group]").getAttribute("aria-label"), "Crew");
  assert.equal(app.$("[data-enc-pcname]"), null, "the old field is gone");
  seatBtns(app)[0].click();
  assert.deepEqual(rows(app), ["Dez"]);
  assert.equal(seatBtns(app)[0].disabled, true);
  assert.match(seatBtns(app)[0].textContent, /In$/);
  assert.equal(seatBtns(app)[0].getAttribute("aria-label"), "Dez, already in");
  assert.equal(app.doc.activeElement, seatBtns(app)[1], "focus moves to the next seat that can still be added");
  seatBtns(app)[1].click(); seatBtns(app)[2].click();
  assert.deepEqual(rows(app), ["Dez", "Wren", "Ivo"]);
  assert.equal(app.doc.activeElement, app.$("[data-enc-player]"), "with none after it, focus lands on Add a player");
  app.click(`[data-erm="${app.$$("[data-erow]")[1].dataset.erow}"]`); app.click("#modal [data-askyes]");
  app.click(`[data-erm="${app.$$("[data-erow]")[1].dataset.erow}"]`); app.click("#modal [data-askyes]");
  app.click(`[data-erm="${app.$$("[data-erow]")[0].dataset.erow}"]`); app.click("#modal [data-askyes]");
  assert.equal(app.$$("[data-erow]").length, 0);
  assert.ok(seatBtns(app).every(b => !b.disabled), "Remove enables the button again");
  assert.equal(app.doc.activeElement, seatBtns(app)[0], "with no row left, focus lands on the first seat button");
  assert.deepEqual(app.errors, []);
});

test("262: Undo of an add takes the row back and enables the button", () => {
  const app = open(crewTable());
  newFight(app);
  seatBtns(app)[1].click();
  assert.equal(seatBtns(app)[1].disabled, true);
  app.click("#undotoast [data-toastundo]");
  assert.deepEqual(rows(app), []);
  assert.equal(seatBtns(app)[1].disabled, false);
  assert.deepEqual(app.errors, []);
});

test("262: Add a player opens a field that adds a row and stays open; a seat already in is refused", () => {
  const app = open(crewTable());
  newFight(app);
  assert.equal(app.$("[data-enc-pname]"), null, "closed until pressed");
  assert.equal(app.$("[data-enc-player]").getAttribute("aria-expanded"), "false");
  app.click("[data-enc-player]");
  assert.equal(app.$("[data-enc-player]").getAttribute("aria-expanded"), "true");
  assert.equal(app.doc.activeElement, app.$("[data-enc-pname]"));
  type(app, "[data-enc-pname]", "Cord"); keyIn(app, "[data-enc-pname]", "Enter");
  assert.deepEqual(rows(app), ["Cord"]);
  assert.equal(app.$("[data-enc-pname]").value, "");
  assert.equal(app.doc.activeElement, app.$("[data-enc-pname]"), "the field stays open, empty, focused");
  seatBtns(app)[1].click();
  type(app, "[data-enc-pname]", "wren"); app.click("[data-enc-addplayer]");
  assert.match(app.$("#undotoast").textContent, /Already in\./);
  assert.equal(app.$("[data-enc-pname]").value, "wren", "the field keeps the text");
  assert.equal(app.doc.activeElement, app.$("[data-enc-pname]"));
  assert.deepEqual(rows(app), ["Cord", "Wren"]);
  assert.deepEqual(app.errors, []);
});

test("262: Who was there on a session's page toggles a seat, keeps a hand-typed name as its own button, and adds a player", () => {
  const c = crewTable(["Dezzy", "Rook"]);
  const app = open(c);
  app.click('[data-tsec="sessions"]'); app.click(`.sess-open[data-sopen="${c.a}"]`);
  assert.deepEqual(whoNames(app), ["Dez", "Wren", "Ivo", "Rook"], "the seats, then the other names");
  assert.deepEqual(whoBtns(app).map(b => b.getAttribute("aria-pressed")), ["true", "false", "false", "true"], "a hand-typed name presses its seat");
  assert.equal(app.$("[data-sf=present]"), null);
  whoPress(app, "Dez");
  assert.deepEqual(present(app, c.a), ["Rook"], "the hand-typed name went with the seat");
  assert.equal(app.doc.activeElement, whoBtns(app)[0]);
  whoPress(app, "Wren");
  assert.deepEqual(present(app, c.a), ["Rook", "Wren"]);
  whoPress(app, "Rook");
  assert.deepEqual(present(app, c.a), ["Wren"]);
  whoAdd(app, "Cord");
  assert.deepEqual(present(app, c.a), ["Wren", "Cord"]);
  assert.deepEqual(whoNames(app), ["Dez", "Wren", "Ivo", "Cord"]);
  assert.equal(app.doc.activeElement, app.$("[data-crew-input]"), "the field stays open and focused");
  whoAdd(app, " cord ");
  assert.deepEqual(present(app, c.a), ["Wren", "Cord"], "a name already there is not added twice");
  whoPress(app, "Cord");
  assert.equal(app.doc.activeElement, app.$("[data-crew-add]"), "with no button after it, focus lands on Add a player");
  assert.deepEqual(app.errors, []);
});

test("262: the close-out's Who was there toggles too, and a typed IP survives a name going and coming back", () => {
  const c = crewTable(["Wren", "Rook"]);
  const app = open(c);
  app.click('[data-tsec="sessions"]'); app.click(`.sess-open[data-sopen="${c.a}"]`); app.click("[data-co-open]");
  assert.equal(app.doc.activeElement, whoBtns(app)[0]);
  type(app, `[data-co-row="${coRow(app, "Rook").dataset.coRow}"] [data-co="ip"]`, "20");
  whoPress(app, "Rook");
  assert.equal(coRow(app, "Rook"), undefined, "Rook is off the list");
  whoAdd(app, "Rook");
  assert.equal(coField(app, "Rook", "ip").value, "20", "the typed IP is still the typed one");
  whoPress(app, "Ivo");
  assert.ok(coField(app, "Ivo", "ip"), "pressing a seat puts its line on the list");
  assert.deepEqual(present(app, c.a), ["Wren", "Rook", "Ivo"]);
  assert.deepEqual(app.errors, []);
});

test("262: the crew buttons are in the same order in the encounter, the session and the close-out", () => {
  const c = crewTable([]);
  const app = open(c);
  newFight(app);
  const enc = seatLabels(app);
  app.click('[data-tsec="sessions"]'); app.click(`.sess-open[data-sopen="${c.a}"]`);
  const sess = whoNames(app);
  app.click("[data-co-open]");
  assert.deepEqual(enc, ["Dez", "Wren", "Ivo"]);
  assert.deepEqual(sess, enc);
  assert.deepEqual(whoNames(app), enc);
  assert.deepEqual(app.errors, []);
});

test("262: an old table opens with the seat pressed and nothing rewritten; no seats means Add a player only", () => {
  const c = crewTable(["dezzy", "Dez Okafor"]);
  const app = open(c);
  const before = JSON.stringify(app.window.eval("S.table.sessions[0].present"));
  app.click('[data-tsec="sessions"]'); app.click(`.sess-open[data-sopen="${c.a}"]`);
  assert.equal(whoBtns(app)[0].getAttribute("aria-pressed"), "true");
  assert.equal(JSON.stringify(app.window.eval("S.table.sessions[0].present")), before);
  const bare = Engine.newTable("Crew");
  const id = Engine.addSession(bare, { number: 1, date: "2026-09-01" }).id;
  const alone = boot({ storage: { ...GM_ON, ["shadows.table.v1." + bare.meta.id]: { table: bare, section: "sessions", changed: "2026-10-05T10:00:00.000Z", exported: null } } });
  tableCard(alone, "Crew").querySelector("[data-topen]").click();
  alone.click(`.sess-open[data-sopen="${id}"]`);
  assert.deepEqual(whoNames(alone), []);
  assert.ok(alone.$("[data-crew-add]"));
  assert.deepEqual([...app.errors, ...alone.errors], []);
});

test("262: Add a player in Who was there says Already in. for a name that's there or answers to a pressed seat, and keeps the text", () => {
  const c = crewTable(["Dez", "Rook"]);
  const app = open(c);
  app.click('[data-tsec="sessions"]'); app.click(`.sess-open[data-sopen="${c.a}"]`);
  for (const name of ["dez", "Dezzy", "rook"]) {
    app.window.eval("document.querySelector('#undotoast') && (document.querySelector('#undotoast').textContent = '')");
    whoAdd(app, name);
    assert.match(app.$("#undotoast").textContent, /Already in\./, name);
    assert.deepEqual(present(app, c.a), ["Dez", "Rook"], name);
    assert.equal(app.$("[data-crew-input]").value, name, "the field keeps the text");
    assert.equal(app.doc.activeElement, app.$("[data-crew-input]"));
  }
  whoPress(app, "Dez");
  whoAdd(app, "Dezzy");
  assert.deepEqual(present(app, c.a), ["Rook", "Dezzy"], "with the seat not pressed, its other name presses it");
  assert.deepEqual(app.errors, []);
});
