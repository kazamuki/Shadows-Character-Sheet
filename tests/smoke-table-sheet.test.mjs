/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: a seat's copy on the real sheet, read-only (Decision 256). The guard is E3: a press,
 * a key or a typed value on any tab changes nothing the table or the roster holds.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, D, GM_ON, lockedCharacter, tableCard, clickIn, tipShown, charKeys, wizCss } from "./smokekit.mjs";

const CY_TAG = "TAG-CCCC-CCCC-CCCC", AR_TAG = "TAG-DDDD-DDDD-DDDD";
const SECTIONS = ["main", "skills", "character", "trackers", "progression", "loadout", "notes"];

/** A Cyborg with damage taken, two Conditions, a note and one audit entry; its Loadout writes panelData into what it draws. */
function cyborg(updated = "2026-10-02T10:00:00.000Z") {
  const ch = lockedCharacter();
  ch.identity.name = "Chrome"; ch.identity.archetype = "cyborg";
  ch.meta.id = CY_TAG; ch.meta.updated = updated;
  ch.trackers.damage = 4;
  ch.notes = "Owes Ivo a favour.";
  Engine.addCondition(ch, { id: "bleeding" });
  Engine.addCondition(ch, { id: "stunned" });
  Engine.recordAction(ch, "edit", "Took a hit", { trackers: { damage: 0 } });
  return ch;
}
/** An Arcanist with a spell in the Grimoire. */
function arcanist(updated = "2026-10-02T10:00:00.000Z") {
  const ch = lockedCharacter();
  ch.identity.name = "Wren"; ch.meta.id = AR_TAG; ch.meta.updated = updated;
  const sp = D.spells && D.spells[0];
  if (sp) Engine.addSpell(ch, sp.id);
  return ch;
}
function tableWith(...chars) {
  const t = Engine.newTable("Dead Air");
  const pid = Engine.addPlayer(t, { name: "Brogan" }).id;
  for (const c of chars) assert.ok(Engine.importSeat(t, pid, c).ok);
  t.audit = [];
  return { ["shadows.table.v1." + t.meta.id]: { table: t, section: "players", changed: "2026-10-05T10:00:00.000Z", exported: null }, ...GM_ON };
}
function open(chars = [cyborg(), arcanist()]) {
  const app = boot({ storage: tableWith(...chars) });
  tableCard(app, "Dead Air").querySelector("[data-topen]").click();
  return app;
}
const ev = (app, expr) => app.window.eval(expr);
const tableJson = app => ev(app, "JSON.stringify(S.table)");
const storedTable = app => { const ls = app.window.localStorage; for (let i = 0; i < ls.length; i++) if (ls.key(i).startsWith("shadows.table.v1.")) return ls.getItem(ls.key(i)); return null; };
const openSheet = (app, tag = CY_TAG) => app.click(`[data-seat="${tag}"]`);
const tabs = app => app.$$("[data-rotab]");
const goTab = (app, id) => app.click(`[data-rotab="${id}"]`);
const seatedOnly = chars => {
  const storage = tableWith(...chars), key = Object.keys(storage).find(k => k.startsWith("shadows.table.v1."));
  storage[key].table.copies = [];
  return storage;
};

test("256: a card with a copy opens its read-only sheet on Main, and Back lands on the card", () => {
  const app = open();
  openSheet(app);
  const h1 = app.$("#main h1[data-rosheeth]");
  assert.equal(h1.textContent, "Chrome");
  assert.equal(app.doc.activeElement, h1);
  assert.match(app.$("#main").textContent, /Read only · File from .+ · Imported/);
  assert.match(app.$("#main").textContent, /Brogan/);
  assert.equal(app.$('[data-rotab="main"]').getAttribute("aria-current"), "page");
  app.click("[data-seatback]");
  assert.equal(app.doc.activeElement, app.$(`[data-seat="${CY_TAG}"]`));
  assert.deepEqual(app.errors, []);
});

test("256: every tab but Admin draws on the read-only sheet, from the copy", () => {
  const app = open();
  openSheet(app);
  assert.deepEqual(tabs(app).map(b => b.textContent.trim()), ["Main", "Skills", "Character", "Trackers", "Progression", "Loadout", "Notes"]);
  for (const id of SECTIONS) {
    goTab(app, id);
    assert.ok(app.$("[data-rosheet]").children.length > 0, id);
    assert.doesNotMatch(app.$("[data-rosheet]").textContent, /can't show this tab/, id);
    assert.equal(app.$(`[data-rotab="${id}"]`).getAttribute("aria-current"), "page");
  }
  assert.equal(app.$('[data-rotab="admin"]'), null);
  assert.deepEqual(app.errors, []);
});

test("256: HP past zero reads on the sheet as it does on the card", () => {
  const ch = cyborg();
  ch.trackers.damage = Engine.health(ch).total + 7;
  const app = open([ch]);
  const cardText = app.$("[data-seatcard]").textContent;
  openSheet(app);
  goTab(app, "skills");
  assert.match(app.$('[data-rosheet] [data-vpop="hp"]').textContent, /−7/);
  assert.match(cardText, /HP −7\//);
});

test("256: no press on the read-only sheet writes", () => {
  const app = open();
  openSheet(app);
  const before = tableJson(app), beforeStored = storedTable(app), audit = ev(app, "S.table.audit.length");
  const check = where => {
    assert.equal(ev(app, "S.ch"), null, `S.ch after ${where}`);
    assert.deepEqual(charKeys(app), [], `a roster key after ${where}`);
    assert.equal(tableJson(app), before, `S.table in memory after ${where}`);
    assert.equal(storedTable(app), beforeStored, `the stored table after ${where}`);
    assert.equal(ev(app, "S.table.audit.length"), audit, `the activity log after ${where}`);
    const toast = app.$("#undotoast");
    assert.ok(!toast || toast.hidden, `an undo toast after ${where}`);
  };
  let pressed = 0, typed = 0;
  for (const id of SECTIONS) {
    goTab(app, id);
    const body = () => app.$("[data-rosheet]");
    for (const b of [...body().querySelectorAll("button")]) {
      if (!b.isConnected || b.matches("[data-gotab]")) continue;   // a go-to moves to another tab, and each tab is visited here
      clickIn(app, b); pressed++;
      if (!app.$(`[data-rotab="${id}"][aria-current]`)) goTab(app, id);
      check(`${id}: ${b.textContent.trim().slice(0, 20)}`);
    }
    for (const el of [...body().querySelectorAll("input, textarea, select")]) {
      if (!el.isConnected) continue;
      if (el.tagName === "SELECT") { if (el.options.length > 1) el.value = el.options[el.options.length - 1].value; }
      else if (el.type === "checkbox" || el.type === "radio") el.checked = !el.checked;
      else el.value = "9";
      el.dispatchEvent(new app.window.Event("input", { bubbles: true }));
      el.dispatchEvent(new app.window.Event("change", { bubbles: true }));
      typed++;
      check(`${id}: a ${el.tagName} change`);
    }
  }
  assert.ok(pressed > 100 && typed > 5, `it pressed ${pressed} and changed ${typed}`);
  assert.deepEqual(app.errors, []);
});

test("256: every live control on the read-only sheet only reads", () => {
  const app = open();
  openSheet(app);
  const readers = ev(app, "RO_READERS");
  for (const id of SECTIONS) {
    goTab(app, id);
    const body = app.$("[data-rosheet]");
    for (const el of body.querySelectorAll("button, select")) assert.ok(el.disabled || el.matches(readers), `${id}: live ${el.tagName} ${el.textContent.trim().slice(0, 20)}`);
    for (const el of body.querySelectorAll("input")) {
      if (["checkbox", "radio", "file", "range", "button", "submit"].includes(el.type)) assert.ok(el.disabled, `${id}: live ${el.type}`);
      else assert.ok(el.readOnly, `${id}: writable ${el.type}`);
    }
    for (const el of body.querySelectorAll("textarea")) assert.ok(el.readOnly, `${id}: writable textarea`);
  }
});

test("256: a stat's tip reads the copy on the read-only sheet", () => {
  const app = open();
  openSheet(app);
  const trigger = app.$('[data-rosheet] [data-tip="stat"]');
  assert.ok(trigger, "Main has a stat tip");
  assert.ok(!trigger.disabled, "a tip trigger stays enabled");
  trigger.focus();
  const name = Engine.statReading(Engine.seatCharacter(JSON.parse(tableJson(app)), CY_TAG), trigger.dataset.term).name;
  assert.match(tipShown(app), new RegExp(`${name} 5`));
  assert.notEqual(ev(app, "tipChar()"), null);
  app.click("[data-seatback]");
  assert.equal(ev(app, "tipChar()"), null, "once the page is left, nothing is left to read");
  openSheet(app);
  app.click("[data-menu-toggle]"); app.click("[data-thome]");
  assert.equal(ev(app, "S.screen"), "home");
  assert.equal(ev(app, "tipChar()"), null, "nor once the table is closed from the sheet");
});

test("256: a seat with no copy opens its page, with no Read the sheet", () => {
  const app = boot({ storage: seatedOnly([cyborg()]) });
  tableCard(app, "Dead Air").querySelector("[data-topen]").click();
  app.click(`[data-seat="${CY_TAG}"]`);
  assert.ok(app.$("[data-seatblock]"), "the seat's page");
  assert.equal(app.$("[data-seatread]"), null);
  assert.equal(app.$("[data-rosheet]"), null);
  assert.equal(app.doc.activeElement, app.$("h1[data-seath]"));
});

test("256: Seat and Read the sheet move between the two, each landing on its h1", () => {
  const app = open();
  openSheet(app);
  app.click("[data-roseat]");
  assert.ok(app.$("[data-seatblock]"));
  assert.equal(app.doc.activeElement, app.$("h1[data-seath]"));
  app.click("[data-seatread]");
  assert.ok(app.$("[data-rosheet]"));
  assert.equal(app.doc.activeElement, app.$("h1[data-rosheeth]"));
  goTab(app, "trackers");
  app.click("[data-roseat]");
  app.click("[data-seatread]");
  assert.equal(app.$('[data-rotab="main"]').getAttribute("aria-current"), "page", "it opens on Main");
  app.click("[data-seatback]");
  assert.ok(app.$("[data-seatcard]"));
});

test("256: Find opens a seat the way its card does", () => {
  const app = open();
  ev(app, `openFound("seat", ${JSON.stringify(CY_TAG)})`);
  assert.ok(app.$("[data-rosheet]"));
  assert.equal(app.doc.activeElement, app.$("h1[data-rosheeth]"));
  const bare = boot({ storage: seatedOnly([cyborg()]) });
  tableCard(bare, "Dead Air").querySelector("[data-topen]").click();
  ev(bare, `openFound("seat", ${JSON.stringify(CY_TAG)})`);
  assert.ok(bare.$("[data-seatblock]"), "no copy: its page, as the card does");
});

test("256: the sheet goes with its seat", () => {
  const app = open([cyborg()]);
  ev(app, `tableChange(() => { Engine.importSeat(S.table, S.table.players[0].id, ${JSON.stringify(arcanist())}); }, true, "Seated Wren")`);
  openSheet(app, AR_TAG);
  assert.ok(app.$("[data-rosheet]"));
  assert.equal(ev(app, "S.table.audit.at(-1).label"), "Seated Wren");
  ev(app, "undoTableEntry(S.table, S.table.audit.at(-1))");
  assert.equal(app.$("[data-rosheet]"), null);
  assert.ok(app.$("[data-seatcard]"), "the Players tab");
  assert.equal(ev(app, "S.seatSheet"), null);
});

test("256: Print prints the copy", () => {
  const app = open();
  let calls = 0;
  app.window.print = () => { calls++; };
  openSheet(app);
  app.click("[data-roprint]");
  assert.equal(calls, 1);
  assert.match(app.$("#printSheet").textContent, /Chrome/);
  assert.equal(app.doc.activeElement, app.$("[data-roprint]"));
});

test("256: drawing the read-only sheet leaves S, saveFailed and the table's banner as they were", () => {
  const app = open();
  ev(app, "Storage.prototype.setItem = () => { throw new Error('full'); }");   // every save from here fails, so saveFailed is true when the sheet draws
  openSheet(app);
  assert.equal(ev(app, "saveFailed"), true);
  const text = app.$("#main").textContent;
  assert.equal((text.match(/This browser couldn't save your last change\. Export the table now/g) || []).length, 1, "the table's banner shows once");
  assert.doesNotMatch(text, /Export the character now/);
  assert.equal(ev(app, "saveFailed"), true);
  assert.equal(ev(app, "S.admin"), false);
  assert.equal(ev(app, "S.section"), "main");
  assert.equal(ev(app, "S.ch"), null);
  ev(app, "S.importIssues = ['an old issue']; S.importSticky = true");
  goTab(app, "skills");
  assert.deepEqual(JSON.parse(ev(app, "JSON.stringify(S.importIssues)")), ["an old issue"], "S.importIssues is as it was");
});

test("256: a table change after reading a sheet adds nothing to the roster", () => {
  const app = open();
  openSheet(app);
  goTab(app, "loadout");
  app.click("[data-seatback]");
  app.click('[data-tsec="notes"]');
  app.click("[data-tnew]");
  assert.deepEqual(charKeys(app), []);
  app.click('[data-tsec="players"]');
  const el = app.$("[data-pyadd-name]"); el.value = "Ivo";
  app.click("[data-pyadd]");
  assert.deepEqual(charKeys(app), []);
  assert.equal(ev(app, "S.ch"), null);
});

test("256: the player's own sheet keeps its readers", () => {
  const ch = lockedCharacter();
  ch.identity.name = "Own";
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "skills" } } });
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent)).dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click('[data-sec="skills"]');
  const sd = app.$("[data-skilldesc]");
  assert.ok(sd, "a skill with a description toggle");
  const row = app.$(`[data-descrow="${sd.dataset.skilldesc}"]`), was = row.hidden;
  app.click(`[data-skilldesc="${sd.dataset.skilldesc}"]`);
  assert.equal(row.hidden, !was, "a skill's description toggles");
  app.click('[data-sec="trackers"]');
  const dd = app.$("[data-derivdesc]");
  if (dd) { const r = app.$(`[data-derivrow="${dd.dataset.derivdesc}"]`), w = r.hidden; app.click(`[data-derivdesc="${dd.dataset.derivdesc}"]`); assert.equal(r.hidden, !w, "a derivation toggles"); }
  assert.deepEqual(app.errors, []);
});

// U4 (finding 36): the copy is the page's, not a second one stacked on it.
test("U4: the seat copy names its seat once, and its disabled controls read as disabled", () => {
  const app = open();
  openSheet(app);
  const main = app.$("#main");
  const named = [...main.querySelectorAll("h1, h2, h3, .step-title")].filter(h => h.textContent.trim() === "Chrome");
  assert.equal(named.length, 1, "the name is drawn more than once");
  assert.equal(named[0].matches("h1[data-seath]"), true, "the page's own h1 is the one that stays");
  assert.match(wizCss(), /h1\.step-title\{font-family:var\(--display\)/, "the page's h1 is the display face");
  // Every tab keeps it to one, and the sheet's own tabs are the quiet row: a label, no icons.
  for (const id of SECTIONS) { goTab(app, id); assert.equal([...app.$("#main").querySelectorAll("h1")].filter(h => h.textContent.trim() === "Chrome").length, 1, id); }
  assert.equal(app.$(".ro-label").textContent, "Sheet");
  assert.equal(app.$(".ro-tabs .tico"), null, "the copy's tabs still carry icons");
  assert.equal(app.$(".ro-tabs").getAttribute("aria-labelledby"), "ro-tabs-l");
  // A disabled control looks disabled: dimmed, with a dashed edge.
  goTab(app, "main");
  const off = app.$(".ro-sheet .btn:disabled");
  assert.ok(off, "no disabled .btn on Main");
  const cs = app.window.getComputedStyle(off);
  assert.ok(Number(cs.opacity) < 1, "a disabled .btn isn't dimmed (opacity " + cs.opacity + ")");
  assert.equal(cs.borderStyle, "dashed");
  // The readers the sheet draws as buttons carry the numbers, so they stay at full strength (contrast).
  const tiles = app.$$(".ro-sheet button.cond.act, .ro-sheet button.vpill.act");
  assert.ok(tiles.length, "no vitals tile on Main");
  for (const r of tiles) assert.equal(app.window.getComputedStyle(r).opacity, "1", "a reader is dimmed: " + r.className);
  assert.match(app.$("#main").textContent, /Read only/);
  assert.deepEqual(app.errors, []);
});

test("Decision 284: the read-only seat sheet's fold opens, and nothing that writes is pressable", () => {
  const app = open();
  openSheet(app);
  const btn = app.$("[data-rosheet] [data-untrainedfold]");
  assert.ok(btn, "no fold on the seat sheet's Main");
  assert.equal(btn.disabled, false, "the fold is dead on the read-only sheet");
  const rows = app.$("[data-rosheet] [data-untrainedrows]");
  assert.equal(rows.hidden, true);
  const before = tableJson(app);
  clickIn(app, btn);
  assert.equal(app.$("[data-rosheet] [data-untrainedrows]").hidden, false, "pressing the fold showed nothing");
  assert.equal(tableJson(app), before, "the fold wrote to the table");
  const readers = ev(app, "RO_READERS");
  for (const el of app.$("[data-rosheet]").querySelectorAll("button, select")) assert.ok(el.disabled || el.matches(readers), `live ${el.tagName} ${el.textContent.trim().slice(0, 20)}`);
  assert.deepEqual(app.errors, []);
});

test("Decision 286: the seat sheet reads an own spell whole, and its Edit is dead", () => {
  const ar = arcanist(), cols = Engine.archPanels(ar).find(x => x.type === "grimoire").columns;
  const eff = "e".repeat(30) + " " + "reads whole ".repeat(20).trim();
  ar.panelData.grimoire.push({ custom: true, [cols[0]]: "Handwritten", [cols[1]]: "Wards", [cols[4]]: eff });
  const app = open([cyborg(), ar]);
  openSheet(app, AR_TAG); goTab(app, "character");
  const body = app.$("[data-rosheet]");
  const line = body.querySelector(".spell.own");
  assert.ok(line && line.textContent.includes(eff), "the own spell isn't a whole line");
  assert.equal(body.querySelectorAll('[data-cell^="grimoire|"]').length, 0);
  const readers = ev(app, "RO_READERS");
  for (const sel of ["[data-spelledit]", "[data-spellrm]"]) {
    const els = body.querySelectorAll(sel);
    assert.ok(els.length > 0, sel);
    for (const el of els) assert.ok(el.disabled && !el.matches(readers), `${sel} is live`);
  }
  assert.deepEqual(app.errors, []);
});

// E5: the seat sheet draws the same intros and chips as the player's own.
test("E5: the seat sheet reads the same intros, and the same chip for what the rules dropped", () => {
  const ch = cyborg();
  ch.weapons = [{ id: "gone-gun" }]; ch.armor = [{ id: "gone-vest" }]; ch.gear = [{ id: "gone-kit", qty: 1 }];
  ch.archetypeChoices.specialization = ["gone-origin"];
  const app = open([ch, arcanist()]);
  openSheet(app);
  const intro = k => D.appCopy[k].replace("{perHour}", String(D.ip.perHour));
  for (const [tab, key] of [["skills", "introSkills"], ["character", "introCharacter"], ["progression", "introProgression"], ["loadout", "introLoadout"], ["notes", "introNotes"]]) {
    goTab(app, tab);
    assert.ok([...app.$$("#main .step-note")].some(n => n.textContent === intro(key)), `the seat sheet's ${tab} intro`);
  }
  goTab(app, "loadout");
  assert.equal(app.$("#main").textContent.split(D.appCopy.orphanChip).length - 1, 3, "the seat's weapon, armor and gear wear the chip");
  goTab(app, "character");
  assert.ok(app.$("#main").textContent.includes(D.appCopy.orphanChip), "the seat's specialization wears the chip");
  assert.doesNotMatch(app.$("#main").textContent, /game data/);
});

// ── E8: a term on the seat sheet opens its tip, read-only (W133) ──────
test("E8 7: a term on the seat sheet opens its tip, read-only", () => {
  const ch = cyborg();
  ch.stats.BOD.base = 9;
  const app = open([ch, arcanist()]);
  openSheet(app);
  goTab(app, "skills");
  const rank = app.$('#main [data-tip="term"]');
  assert.ok(rank, "no term on the seat's Skills tab");
  clickIn(app, rank);
  assert.ok(tipShown(app).length > 0, "the term opened nothing on the seat sheet");
  const want = Engine.statReading(Engine.migrate(JSON.parse(JSON.stringify(ch))), "BOD").value;
  const title = app.window.eval('TIPS.term("BOD").title');
  assert.equal(title, `${D.stats.find(s => s.id === "BOD").name} ${want}`, "a Stat term doesn't read the seat's character");
  assert.deepEqual(app.errors, []);
});
