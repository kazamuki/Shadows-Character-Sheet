/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: the Players tab (Decisions 254–255): players, the characters seated on them, the
 * card spread, import, Answers to, and Find. Every test reads what the page draws; S.table is
 * read only to say what was stored.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, GM_ON, lockedCharacter, type, runTable, keyIn, tableCard } from "./smokekit.mjs";

const playersTab = app => app.click('[data-tsec="players"]');
const both = (app, sel, value) => {
  const el = app.$(sel); el.value = value;
  el.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  el.dispatchEvent(new app.window.Event("change", { bubbles: true }));
};
const tick = ms => new Promise(r => setTimeout(r, ms));

/** A character file as a player would export it. */
function charFile(name, updated, tag) {
  const ch = lockedCharacter();
  ch.identity.name = name;
  ch.meta.updated = updated;
  if (tag) ch.meta.id = tag;
  return ch;
}
const DEZ_TAG = "TAG-AAAA-AAAA-AAAA", WREN_TAG = "TAG-BBBB-BBBB-BBBB";
const dez = (updated = "2026-10-02T10:00:00.000Z") => charFile("Dez", updated, DEZ_TAG);
const wren = (updated = "2026-10-02T10:00:00.000Z") => charFile("Wren", updated, WREN_TAG);

/** Hand files to an input the way the browser does, and wait for the import to finish. */
async function pickFiles(app, sel, files) {
  const input = app.$(sel);
  const list = files.map((f, i) => f instanceof app.window.File ? f
    : new app.window.File([typeof f === "string" ? f : JSON.stringify(f)], `file${i}.json`, { type: "application/json" }));
  Object.defineProperty(input, "files", { value: list, configurable: true });
  input.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  await tick(80);
}
const cards = app => app.$$("[data-seatcard]");
const cardLines = c => [...c.querySelectorAll(".seat-line")].map(x => x.textContent);
const stored = (app, expr) => app.window.eval(expr);
const labels = app => JSON.parse(stored(app, "JSON.stringify(S.table.audit.map(a => a.label))"));
const rosterKeys = app => { const ls = app.window.localStorage, out = []; for (let i = 0; i < ls.length; i++) if (ls.key(i).startsWith("shadows.char.v1.")) out.push(ls.key(i)); return out; };
const addPlayer = (app, name) => { type(app, "[data-pyadd-name]", name); keyIn(app, "[data-pyadd-name]", "Enter"); };
const playerId = (app, name) => app.window.eval(`S.table.players.find(p => p.name === ${JSON.stringify(name)}).id`);
const importBtn = (app, name) => `[data-pyfile="${playerId(app, name)}"]`;

function fresh() {
  const app = boot({ storage: GM_ON });
  runTable(app, "Seats", { stay: true });
  playersTab(app);
  return app;
}

test("255: the Players tab is second, and a new table says nobody is seated", () => {
  const app = fresh();
  assert.deepEqual(app.$$("#topnav .tab").map(b => b.textContent.trim()).slice(0, 3), ["Sessions", "Players", "Cast"]);
  assert.equal(app.$("#topnav .tab.active").textContent.trim(), "Players");
  assert.match(app.$("#main").textContent, /Nobody seated yet\. Add a player, then import their characters\./);
  assert.deepEqual(app.errors, []);
});

test("255: Add a player, then Import characters takes two files onto them as two cards", async () => {
  const app = fresh();
  type(app, "[data-pyadd-name]", "Brogan");
  app.click("[data-pyadd]");
  assert.equal(app.$("h2[data-pyh]").textContent, "Brogan");
  assert.match(app.$("#main").textContent, /No characters yet\./);
  assert.equal(app.doc.activeElement, app.$(`[data-pyimport="${playerId(app, "Brogan")}"]`), "focus lands on the new player's Import");
  assert.deepEqual(labels(app), ["Added Brogan"]);
  await pickFiles(app, importBtn(app, "Brogan"), [dez(), wren()]);
  assert.equal(cards(app).length, 2);
  const lines = cardLines(cards(app)[0]);
  assert.match(lines[0], /^HP \d+\/\d+/);
  assert.match(lines[1], /^Awareness [+−]?\d+$/);
  assert.match(lines[2], /^(No Conditions|Conditions: .+)$/);
  assert.equal(lines.length, 3, "Health, Awareness and Conditions come first");
  assert.equal(cards(app)[0].querySelector(".cast-open").textContent, "Dez");
  assert.equal(app.doc.activeElement, cards(app)[0].querySelector("[data-seat]"), "focus lands on the first new card");
  assert.deepEqual(labels(app), ["Added Brogan", "Seated Dez", "Seated Wren"]);
  assert.match(app.$("#undotoast").textContent, /Seated Dez[\s\S]*Seated Wren/);
  assert.match(cards(app)[0].textContent, /File from .+Imported /);
  assert.deepEqual(rosterKeys(app), [], "a copy never reaches the roster");
  assert.deepEqual(app.errors, []);
});

test("255: a draft, a table, a pack and text that isn't JSON are refused by file name, and a newer copy updates quietly", async () => {
  const app = fresh();
  addPlayer(app, "Brogan");
  await pickFiles(app, importBtn(app, "Brogan"), [dez()]);
  const draft = charFile("Vex", "2026-10-02T10:00:00.000Z"); draft.creation.locked = false;
  const files = [
    new app.window.File([JSON.stringify(draft)], "vex.json"), new app.window.File([JSON.stringify(Engine.newTable("T"))], "table.json"),
    new app.window.File(["not json"], "junk.json"), new app.window.File([JSON.stringify(dez("2026-10-02T10:00:00.000Z"))], "same.json"),
    new app.window.File([JSON.stringify(dez("2026-10-09T10:00:00.000Z"))], "newer.json")];
  await pickFiles(app, importBtn(app, "Brogan"), files);
  const said = app.$("#undotoast").textContent;
  assert.match(said, /vex\.json: Vex isn't locked yet: there's no sheet to read\./);
  assert.match(said, /table\.json: That isn't a character\./);
  assert.match(said, /junk\.json: That isn't a character\./);
  assert.match(said, /Dez is already up to date\./);
  assert.match(said, /Updated Dez/);
  assert.equal(cards(app).length, 1);
  assert.deepEqual(labels(app), ["Added Brogan", "Seated Dez"], "an update records nothing");
  assert.match(cards(app)[0].textContent, new RegExp("File from " + new Date("2026-10-09T10:00:00.000Z").toLocaleDateString().replace(/\//g, "\\/")));
  assert.deepEqual(rosterKeys(app), []);
});

test("255: an older copy asks; Cancel writes nothing; Use takes it", async () => {
  const app = fresh();
  addPlayer(app, "Brogan");
  await pickFiles(app, importBtn(app, "Brogan"), [dez("2026-10-05T10:00:00.000Z")]);
  const updated = () => stored(app, "S.table.copies[0].character.meta.updated");
  await pickFiles(app, importBtn(app, "Brogan"), [dez("2026-10-01T10:00:00.000Z")]);
  assert.ok(app.$("#modal[open]"), "an older copy asks");
  assert.match(app.$("#modal-title").textContent, /Use an older copy of Dez\?/);
  assert.match(app.$("#modal .modal-body").textContent, /This file was saved .+; the table's copy is from /);
  const before = stored(app, "JSON.stringify(S.table.copies)");
  app.click("#modal [data-modalclose]");
  await tick(30);
  assert.equal(updated(), "2026-10-05T10:00:00.000Z");
  assert.equal(stored(app, "JSON.stringify(S.table.copies)"), before, "Cancel writes nothing");
  await pickFiles(app, importBtn(app, "Brogan"), [dez("2026-10-01T10:00:00.000Z")]);
  app.click("#modal [data-askyes]");
  await tick(60);
  assert.equal(updated(), "2026-10-01T10:00:00.000Z");
  assert.match(app.$("#undotoast").textContent, /Updated Dez/);
  assert.deepEqual(app.errors, []);
});

test("255: Benched folds a card below its player, and the disclosure keeps its marker", async () => {
  const app = fresh();
  addPlayer(app, "Brogan");
  await pickFiles(app, importBtn(app, "Brogan"), [dez(), wren()]);
  assert.equal(app.$("[data-seatshut]"), null, "no disclosure at none");
  app.click(`[data-seat="${WREN_TAG}"]`);
  assert.equal(app.$("h1[data-seath]").textContent, "Wren");
  assert.equal(app.$$("[data-seatst]").filter(b => b.getAttribute("aria-pressed") === "true").length, 1);
  app.click('[data-seatst="benched"]');
  assert.equal(app.$('[data-seatst="benched"]').getAttribute("aria-pressed"), "true");
  assert.equal(app.$('[data-seatst="active"]').getAttribute("aria-pressed"), "false");
  assert.equal(labels(app).at(-1), "Changed Brogan");
  app.click("[data-seatback]");
  assert.equal(cards(app).length, 2, "the list shows both cards");
  const summary = app.$("[data-seatshut] summary");
  assert.equal(app.window.document.activeElement, summary, "Back from a folded seat lands on its list's summary");
  assert.match(summary.textContent, /^Benched, retired and dead \(1\)$/);
  assert.equal(app.window.getComputedStyle(summary).display, "list-item", "the disclosure keeps its marker");
  for (const s of [summary, app.$("[data-pymore] summary")]) assert.equal(app.window.getComputedStyle(s).minHeight, "44px", "a disclosure is a 44px target");
  assert.equal(app.$("ul.roster-list > [data-seatcard]").getAttribute("data-seatcard"), DEZ_TAG, "the active card is outside the fold");
  assert.ok(app.$(`[data-seatshut] [data-seatcard="${WREN_TAG}"]`), "the benched card is inside it");
  assert.match(app.$(`[data-seatcard="${WREN_TAG}"]`).textContent, /Benched/);
  assert.deepEqual(app.errors, []);
});

/** A saved table: Brogan with Dez seated, and five closed sessions that say "dez okafor". */
function playedTable() {
  const t = Engine.newTable("Dead Air");
  const pid = Engine.addPlayer(t, { name: "Brogan" }).id;
  assert.ok(Engine.importSeat(t, pid, dez()).ok);
  for (let n = 1; n <= 5; n++) {
    const id = Engine.addSession(t, { number: n, date: `2026-09-0${n}` }).id;
    Engine.editSession(t, id, { present: ["dez okafor"], hours: 2 });
    Engine.writeCloseOut(t, id, { lines: [{ name: "dez okafor", present: true, ip: 8, milestone: false, credits: null, tier: null, note: "" }] });
  }
  assert.ok(Engine.addInteraction(t, { kind: "shared", crew: ["dez okafor"], text: "told Ivo about the pier", date: "2026-09-04" }).ok);
  t.audit = [];
  return { ["shadows.table.v1." + t.meta.id]: { table: t, section: "players", changed: "2026-10-05T10:00:00.000Z", exported: null }, ...GM_ON };
}
const openSaved = app => { tableCard(app, "Dead Air").querySelector("[data-topen]").click(); };

test("254: Answers to: a name typed counts the old sessions, and Remove's label follows it", () => {
  const app = boot({ storage: playedTable() });
  openSaved(app);
  assert.doesNotMatch(app.$("[data-seatcard]").textContent, /Last at/, "nothing counts until the name answers to Dez");
  app.click(`[data-seat="${DEZ_TAG}"]`);
  assert.match(app.$("[data-seatnames]").textContent, /Dez\s*always/);
  app.click("[data-seatnameadd]");
  assert.equal(app.doc.activeElement, app.$('[data-seatname="0"]'), "focus lands on the new row");
  assert.equal(app.$('[data-seatnamedel="0"]').getAttribute("aria-label"), "Remove name 1");
  both(app, '[data-seatname="0"]', "Dez Okafor");
  assert.equal(app.$('[data-seatnamedel="0"]').getAttribute("aria-label"), "Remove Dez Okafor");
  assert.match(app.$("[data-seatblock]").textContent, /Last at Session 5 · 40 IP awarded here/);
  assert.equal(stored(app, "S.table.sessions.every(s => s.present[0] === 'dez okafor')"), true, "nothing typed is rewritten");
  app.click("[data-seatback]");
  assert.match(app.$("[data-seatcard]").textContent, /Last at Session 5 · 40 IP awarded here/);
  app.click('[data-tsec="sessions"]');
  assert.match(app.$(".co-totals").textContent, /IP so far: Dez 40/);
  assert.deepEqual(app.errors, []);
});

test("254: a name two seats answer to counts as neither, and each page says so", async () => {
  const app = boot({ storage: playedTable() });
  openSaved(app);
  await pickFiles(app, `[data-pyfile="${stored(app, "S.table.players[0].id")}"]`, [wren()]);
  app.click(`[data-seat="${DEZ_TAG}"]`);
  app.click("[data-seatnameadd]"); both(app, '[data-seatname="0"]', "Dez Okafor");
  assert.match(app.$("[data-seatblock]").textContent, /Last at Session 5/);
  app.click("[data-seatback]"); app.click(`[data-seat="${WREN_TAG}"]`);
  app.click("[data-seatnameadd]"); both(app, '[data-seatname="0"]', "DEZ OKAFOR");
  assert.match(app.$("[data-seatclash]").textContent, /Dez answers to DEZ OKAFOR too, so it counts as neither\./);
  app.click("[data-seatback]"); app.click(`[data-seat="${DEZ_TAG}"]`);
  assert.match(app.$("[data-seatclash]").textContent, /Wren answers to Dez Okafor too, so it counts as neither\./);
  assert.doesNotMatch(app.$("[data-seatblock]").textContent, /Last at/);
  assert.deepEqual(app.errors, []);
});

test("254: Remove from the table asks, and Undo from Activity brings the seat and its copy back", async () => {
  const app = fresh();
  addPlayer(app, "Brogan");
  await pickFiles(app, importBtn(app, "Brogan"), [dez()]);
  app.click(`[data-seat="${DEZ_TAG}"]`);
  app.click("[data-seatdel]");
  assert.equal(app.$("#modal-title").textContent, "Remove Dez?");
  assert.match(app.$("#modal .modal-body").textContent, /Dez's copy goes with the seat\. Undo brings both back until the table is next opened; after that, import the file again\./);
  app.click("#modal [data-modalclose]");
  assert.equal(cards(app).length, 0 + (app.$("[data-seath]") ? 0 : 1), "Cancel keeps the seat");
  app.click("[data-seatdel]"); app.click("#modal [data-askyes]");
  assert.equal(cards(app).length, 0);
  assert.match(app.$("#main").textContent, /No characters yet\./);
  assert.equal(app.doc.activeElement, app.$(importBtn(app, "Brogan").replace("pyfile", "pyimport")));
  assert.equal(labels(app).at(-1), "Removed Dez");
  app.click("[data-menu-toggle]"); app.click("[data-tactivity]");
  assert.match(app.$("#modal [data-act-undo]").textContent, /^Undo: Removed Dez$/);
  app.click("#modal [data-act-undo]");
  assert.equal(cards(app).length, 1);
  assert.equal(stored(app, "S.table.copies.length"), 1, "the copy came back with the seat");
  assert.match(cards(app)[0].textContent, /HP \d+\/\d+/);
  assert.deepEqual(app.errors, []);
});

test("255: Remove a player asks with the count of characters that go with them", async () => {
  const app = fresh();
  addPlayer(app, "Brogan");
  await pickFiles(app, importBtn(app, "Brogan"), [dez(), wren()]);
  app.click(`[data-pydel="${playerId(app, "Brogan")}"]`);
  assert.equal(app.$("#modal-title").textContent, "Remove Brogan?");
  assert.match(app.$("#modal .modal-body").textContent, /^Brogan and their 2 characters go\. Undo brings them back until the table is next opened\.$/);
  app.click("#modal [data-askyes]");
  assert.equal(app.$$("[data-player]").length, 0);
  assert.equal(labels(app).at(-1), "Removed Brogan");
  assert.equal(app.doc.activeElement, app.$("[data-pyadd-name]"));
});

test("255: Replace from a file takes a newer copy on the seat's own player, and a different TAG is seated as new", async () => {
  const app = fresh();
  addPlayer(app, "Brogan"); addPlayer(app, "Ana");
  await pickFiles(app, importBtn(app, "Brogan"), [dez()]);
  app.click(`[data-seat="${DEZ_TAG}"]`);
  await pickFiles(app, "[data-seatfile]", [dez("2026-10-20T10:00:00.000Z")]);
  assert.equal(app.doc.activeElement, app.$("[data-seath]"));
  assert.match(app.$("#undotoast").textContent, /Updated Dez/);
  assert.equal(stored(app, "S.table.copies[0].character.meta.updated"), "2026-10-20T10:00:00.000Z");
  await pickFiles(app, "[data-seatfile]", [wren()]);
  assert.match(app.$("#undotoast").textContent, /Seated Wren/);
  assert.equal(stored(app, "S.table.players[0].seats.length"), 2, "the new TAG is seated on this seat's player");
  assert.deepEqual(rosterKeys(app), []);
});

test("255: Find finds a seat and opens its page on the heading", async () => {
  const app = boot({ storage: playedTable() });
  openSaved(app);
  app.click(`[data-seat="${DEZ_TAG}"]`);
  app.click("[data-seatnameadd]"); both(app, '[data-seatname="0"]', "Okafor");
  app.click("[data-seatback]");
  for (const q of ["okafor", "brogan", DEZ_TAG.slice(4, 13)]) {
    app.click("[data-tfind]");
    type(app, "[data-findq]", q);
    assert.ok(app.$('[data-fkind="seat"]'), q);
    assert.ok(app.$$("#modal .find-h").some(h => /^Players 1$/.test(h.textContent)), q);
    app.click('[data-fkind="seat"]');
    assert.equal(app.$("h1[data-seath]").textContent, "Dez", q);
    assert.equal(app.doc.activeElement, app.$("[data-seath]"), q);
    app.click("[data-seatback]");
  }
  assert.deepEqual(app.errors, []);
});

test("255: the encounter's PC name field offers the seats' names", () => {
  const app = boot({ storage: playedTable() });
  openSaved(app);
  app.click(`[data-seat="${DEZ_TAG}"]`);
  app.click("[data-seatnameadd]"); both(app, '[data-seatname="0"]', "Okafor");
  app.click('[data-tsec="encounters"]');
  type(app, "[data-enc-name]", "Docks"); app.click("[data-enc-new]");
  const input = app.$("[data-enc-pcname]");
  assert.equal(input.getAttribute("list"), "sess-crew");
  assert.deepEqual([...app.$$("#sess-crew option")].map(o => o.value).slice(0, 2).sort(), ["Dez", "Okafor"]);
  assert.equal(input.getAttribute("placeholder"), "Who's at the table?");
  assert.deepEqual(app.errors, []);
});

test("254: Who knows what groups a name that answers to a seat under the character, and the datalists offer the seats first", () => {
  const app = boot({ storage: playedTable() });
  openSaved(app);
  app.click('[data-tsec="cast"]'); app.click('[data-cview="crew"]');
  assert.deepEqual(app.$$(".crew-name").map(h => h.textContent), ["dez okafor"], "a group of its own until the name answers to the seat");
  app.click('[data-tsec="players"]'); app.click(`[data-seat="${DEZ_TAG}"]`);
  app.click("[data-seatnameadd]"); both(app, '[data-seatname="0"]', "Dez Okafor");
  app.click('[data-tsec="cast"]'); app.click('[data-cview="crew"]');
  assert.deepEqual(app.$$(".crew-name").map(h => h.textContent), ["Dez"], "one group, headed by the character");
  app.click('[data-tsec="sessions"]'); app.click("[data-snew]");
  assert.equal([...app.$$("#sess-crew option")][0].value, "Dez", "the seat's name leads Who was there");
  assert.deepEqual(app.errors, []);
});

test("255: a batch that seats two shows its notice without an Undo, the card reads the sheet's HP and leaves out Pain at level 0, and a file with no TAG is refused by name", async () => {
  const app = fresh();
  addPlayer(app, "Brogan");
  const hurt = dez(); hurt.trackers.damage = 40;
  const noTag = charFile("Vex", "2026-10-02T10:00:00.000Z"); delete noTag.meta.id;
  await pickFiles(app, importBtn(app, "Brogan"), [hurt, wren(), noTag]);
  assert.equal(cards(app).length, 2);
  assert.match(app.$("#undotoast").textContent, /Seated Dez[\s\S]*Seated Wren[\s\S]*file2\.json: Vex has no TAG yet\. Open the file on Home, then export it again\./);
  assert.equal(app.$("[data-toastundo]"), null, "a batch of two has no Undo that takes back one");
  assert.match(cardLines(cards(app)[0])[0], /^HP −\d+\/\d+/, "past zero reads as the sheet's −N");
  assert.doesNotMatch(cards(app)[1].textContent, /Pain Lv/, "an unhurt character has no Pain line");
  assert.deepEqual(app.errors, []);
});

test("254: Remove, another change, then two undos from Activity bring the seat back with its copy", async () => {
  const app = fresh();
  addPlayer(app, "Brogan");
  await pickFiles(app, importBtn(app, "Brogan"), [dez()]);
  app.click(`[data-seat="${DEZ_TAG}"]`);
  app.click("[data-seatdel]"); app.click("#modal [data-askyes]");
  addPlayer(app, "Ana");
  app.click("[data-menu-toggle]"); app.click("[data-tactivity]");
  app.click("#modal [data-act-undo]"); app.click("#modal [data-act-undo]");
  app.click("#modal [data-modalclose]");
  assert.equal(cards(app).length, 1);
  assert.match(cards(app)[0].textContent, /HP \d+\/\d+/, "the copy came back, not 'No copy yet'");
  assert.deepEqual(app.errors, []);
});

test("255: a hurt character's card reads Pain the way the sheet's chip does", async () => {
  const app = fresh();
  addPlayer(app, "Brogan");
  const hurt = dez(); hurt.trackers.damage = 10;
  await pickFiles(app, importBtn(app, "Brogan"), [hurt]);
  assert.match(cards(app)[0].textContent, /Pain Lv \d+ \(−\d+ skill\)/);
  assert.deepEqual(app.errors, []);
});
