/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: the sheet's Notes tab, a list of the player's notes with a category, tags and a session, above the free
 * notes (Decision 324, S30 PR 2). The same list the table's Notes tab draws (Decision 323), through shared.js's one renderer.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, GM_ON, lockedCharacter, tableCard, openSheet, activeChar, type } from "./smokekit.mjs";

const SEAT_TAG = "TAG-CCCC-CCCC-CCCC";
const press = (app, el, key) => el.dispatchEvent(new app.window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
const heads = app => app.$$("#main .note-group").map(h => h.textContent);
const shown = app => app.$$("#main [data-nopen]").map(b => b.textContent);
const live = (app, expr) => JSON.parse(app.window.eval(`JSON.stringify(${expr})`));
const log = app => live(app, "S.ch.audit").map(e => e.label);

/** A character with a Session Log of two, and a few notes already filed. */
function noted() {
  const ch = lockedCharacter();
  ch.notes = "Owes Ivo a favour.";
  Engine.logSession(ch, { date: "2026-11-01", title: "Dead drop", ipEarned: 4 });
  Engine.logSession(ch, { date: "2026-11-08", title: "The Listener", ipEarned: 6 });
  const [a, b] = ch.sessions.map(s => s.id);
  Engine.addNoteCard(ch, { title: "Ibarra", text: "Owes me.", category: "Leads", tags: ["lead", "debt"], session: a });
  Engine.addNoteCard(ch, { title: "The cord", text: "Red.", category: "Leads", tags: ["Lead"], session: b });
  Engine.addNoteCard(ch, { title: "House rule", text: "", category: "Table", tags: [] });
  Engine.addNoteCard(ch, { title: "Loose end", text: "x" });
  ch.noteCards.reverse();   // the list is newest first; the first one made is last
  ch.audit = [];
  return ch;
}

test("324: the Notes tab lists the player's notes above the free notes, and typing isn't logged", () => {
  const ch = lockedCharacter(); ch.notes = "Owes Ivo a favour.";
  const app = openSheet(ch, "notes");
  assert.ok(app.$("[data-snew]"), "New note");
  assert.equal(app.$("[data-ngroup]"), null, "no list controls with nothing listed");
  assert.equal(app.$("[data-notes]").value, "Owes Ivo a favour.", "the free notes are as they were");
  assert.equal(app.$("[data-notes]").closest("label").textContent.trim().startsWith("Free notes"), true);
  assert.ok(app.$("[data-snew]").compareDocumentPosition(app.$("[data-notes]")) & 4, "the list sits above the free notes");
  // Add: one entry, the note opens in its form at the top, focus on Title.
  app.click("[data-snew]");
  assert.deepEqual(log(app), ["Added a note"]);
  const id = app.window.eval("S.ch.noteCards[0].id");
  assert.ok(app.$(`#main .note-pinned [data-note="${id}"]`), "a new note opens above the groups");
  assert.equal(app.doc.activeElement, app.$(`[data-ntitle="${id}"]`));
  // Title and text typed: stored, and no entry.
  type(app, `[data-ntitle="${id}"]`, "Ibarra"); type(app, `[data-ntitle="${id}"]`, "Ibarra's debt");
  assert.deepEqual(log(app), ["Added a note"], "typing a title isn't logged");
  // A tag is a press with its own entry.
  type(app, `[data-ntagin="${id}"]`, " Lead , Debt ");
  press(app, app.$(`[data-ntagin="${id}"]`), "Enter");
  assert.deepEqual(log(app), ["Added a note", 'Tagged "Ibarra\'s debt" Lead, Debt']);
  assert.deepEqual(live(app, "S.ch.noteCards[0].tags"), ["Lead", "Debt"]);
  assert.equal(app.doc.activeElement, app.$(`[data-ntagin="${id}"]`)); assert.equal(app.$(`[data-ntagin="${id}"]`).value, "");
  assert.match(app.$("#undotoast").textContent, /Tagged "Ibarra's debt" Lead, Debt/);
  type(app, `[data-ntext="${id}"]`, "Owes me, and knows it.");
  assert.deepEqual(log(app).length, 2, "typing the text isn't logged either");
  // Undo takes the tag, and leaves what was typed after it.
  app.click("#undotoast [data-toastundo]");
  const n = live(app, "S.ch.noteCards[0]");
  assert.deepEqual(n.tags, []);
  assert.equal(n.text, "Owes me, and knows it."); assert.equal(n.title, "Ibarra's debt");
  assert.deepEqual(app.errors, []);
});

test("324: a category is one entry when the field is let go, a session is an entry, and Done files the note", () => {
  const app = openSheet(noted(), "notes");
  const id = app.window.eval(`S.ch.noteCards.find(n => n.title === "House rule").id`);
  assert.deepEqual(heads(app), ["Leads", "Table", "No category"]);
  const inGroup = () => { const h = [...app.$$("#main .note-group")].find(x => x.nextElementSibling.querySelector(`[data-note="${id}"]`)); return h && h.textContent; };
  // Edit holds the note in its group (Ken's ruling on PR 1, Decision 323).
  app.click(`[data-nopen="${id}"]`); app.click(`[data-nedit="${id}"]`);
  assert.equal(app.$("#main .note-pinned"), null); assert.equal(inGroup(), "Table");
  assert.equal(app.doc.activeElement, app.$(`[data-ntitle="${id}"]`));
  const cat = app.$(`[data-ncat="${id}"]`);
  cat.focus(); type(app, `[data-ncat="${id}"]`, "H"); type(app, `[data-ncat="${id}"]`, "Hooks");
  assert.deepEqual(log(app), [], "typing a category isn't an entry yet");
  assert.equal(live(app, `S.ch.noteCards.find(n => n.id === "${id}").category`), "Hooks", "but it is stored as it goes");
  assert.equal(inGroup(), "Table", "and moves nothing");
  app.$(`[data-ncat="${id}"]`).dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.deepEqual(log(app), ['Filed "House rule" under Hooks']);
  // Undo gives back the category it had.
  app.click("#undotoast [data-toastundo]");
  assert.equal(live(app, `S.ch.noteCards.find(n => n.id === "${id}").category`), "Table");
  // A session is an entry too.
  const sel = app.$(`[data-nsess="${id}"]`);
  assert.deepEqual([...sel.options].map(o => o.textContent), ["None", "The Listener · 2026-11-08", "Dead drop · 2026-11-01"]);
  sel.value = sel.options[2].value; sel.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.deepEqual(log(app), ['Put "House rule" in Dead drop · 2026-11-01']);
  const sel2 = app.$(`[data-nsess="${id}"]`); sel2.value = ""; sel2.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(log(app).pop(), 'Took "House rule" out of its session');
  // Done reads it in its group, focus on Edit.
  app.click(`[data-ndone="${id}"]`);
  assert.equal(inGroup(), "Table");
  assert.equal(app.doc.activeElement, app.$(`[data-nedit="${id}"]`));
  assert.deepEqual(app.errors, []);
});

test("324: Group by and a tag filter the list as the table's do, and are never saved", () => {
  const app = openSheet(noted(), "notes");
  assert.equal(app.$$("#main .tbl-note").length, 4);
  assert.deepEqual(app.$$("#main .note-tagpick").map(b => b.textContent), ["lead", "debt"], "a tag once, whatever its case");
  app.click('[data-ntag="lead"]');
  assert.deepEqual(shown(app).sort(), ["Ibarra", "The cord"]);
  assert.equal(app.doc.activeElement, app.$('[data-ntag="lead"]'));
  app.click('[data-ntag="lead"]'); assert.equal(shown(app).length, 4);
  app.click("[data-ngroup=session]");
  assert.deepEqual(heads(app), ["The Listener · 2026-11-08", "Dead drop · 2026-11-01", "No session"]);
  app.click("[data-ngroup=newest]");
  assert.deepEqual(heads(app), []); assert.equal(app.$$("#main ul.note-list").length, 1);
  assert.ok(!/ngroup|snBy|snTag|snOpen/.test(JSON.stringify(app.window.eval("S.ch"))), "nothing about the view is in the character");
  assert.equal(activeChar(app).noteCards.length, 4);
  assert.deepEqual(app.errors, []);
});

test("324: deleting a session unfiles its notes, and Undo brings the session and the link back", () => {
  const app = openSheet(noted(), "notes");
  const ibarra = app.window.eval(`S.ch.noteCards.find(n => n.title === "Ibarra").id`);
  const sid = live(app, `S.ch.noteCards.find(n => n.id === "${ibarra}").session`);
  assert.ok(sid);
  app.click('[data-sec="progression"]');
  const at = app.window.eval(`S.ch.sessions.findIndex(s => s.id === "${sid}")`);
  app.click(`[data-sesdel="${at}"]`); app.click("#modal [data-askyes]");
  assert.equal(live(app, `S.ch.noteCards.find(n => n.id === "${ibarra}").session`), null);
  assert.equal(app.window.eval("S.ch.sessions.length"), 1);
  app.click("#undotoast [data-toastundo]");
  assert.equal(live(app, `S.ch.noteCards.find(n => n.id === "${ibarra}").session`), sid);
  assert.equal(app.window.eval("S.ch.sessions.length"), 2);
  assert.deepEqual(app.errors, []);
});

test("324: Delete asks first, is one entry, and focus goes to the next note as the list groups it", () => {
  const app = openSheet(noted(), "notes");
  const idOf = t => app.window.eval(`S.ch.noteCards.find(n => n.title === ${JSON.stringify(t)}).id`);
  const id = idOf("Ibarra");
  app.click(`[data-nopen="${id}"]`); app.click(`[data-nedit="${id}"]`);
  app.click(`[data-ndel="${id}"]`);
  assert.equal(app.window.eval("S.ch.noteCards.length"), 4, "nothing goes until it's confirmed");
  app.click("#modal [data-askyes]");
  assert.deepEqual(log(app), ['Deleted "Ibarra"']);
  assert.equal(app.doc.activeElement.dataset.nopen, idOf("The cord"));
  app.click("#undotoast [data-toastundo]");
  assert.equal(app.window.eval("S.ch.noteCards.length"), 4);
  assert.deepEqual(app.errors, []);
});

test("324: a hostile category, tag or title renders as text", () => {
  const ch = lockedCharacter();
  const bad = "<img src=x onerror=alert(1)>";
  Engine.addNoteCard(ch, { title: bad, text: bad, category: bad, tags: [bad] });
  const app = openSheet(ch, "notes");
  assert.equal(app.$$("#main img").length, 0);
  const id = app.window.eval("S.ch.noteCards[0].id");
  app.click(`[data-nopen="${id}"]`); app.click(`[data-nedit="${id}"]`);
  assert.equal(app.$$("#main img").length, 0);
  assert.ok(app.$("#main").textContent.includes(bad));
  assert.deepEqual(app.errors, []);
});

test("324: the printed sheet lists the notes before the free notes", () => {
  const app = openSheet(noted(), "main");
  app.window.print = () => {};
  app.click("[data-menu-toggle]"); app.click("[data-print]");
  const p = app.$("#printSheet .p-ncards"), free = app.$("#printSheet .p-notes.small");
  assert.ok(p, "the notes print");
  assert.ok(p.compareDocumentPosition(free) & 4, "before the free notes");
  assert.deepEqual([...p.querySelectorAll(".p-ncat")].map(x => x.textContent), ["Leads", "Table", "No category"]);
  assert.ok(/Ibarra/.test(p.textContent) && /Owes me\./.test(p.textContent) && /lead, debt/.test(p.textContent));
  assert.equal(free.textContent, "Owes Ivo a favour.");
  // A sheet with no listed notes prints as it did.
  const bare = openSheet(lockedCharacter(), "main"); bare.window.print = () => {};
  bare.click("[data-menu-toggle]"); bare.click("[data-print]");
  assert.equal(bare.$("#printSheet .p-ncards"), null);
  // One category still names itself; a list with none prints no heading.
  const printed = cards => {
    const ch = lockedCharacter();
    for (const c of cards) Engine.addNoteCard(ch, c);
    const one = openSheet(ch, "main"); one.window.print = () => {};
    one.click("[data-menu-toggle]"); one.click("[data-print]");
    return [...one.$("#printSheet .p-ncards").querySelectorAll(".p-ncat")].map(x => x.textContent);
  };
  assert.deepEqual(printed([{ title: "Ibarra", category: "Leads" }, { title: "The cord", category: "Leads" }]), ["Leads"]);
  assert.deepEqual(printed([{ title: "Ibarra" }, { title: "The cord" }]), []);
  assert.deepEqual(app.errors, []);
});

// ── The GM's read-only seat ──────────────────────────────────────────────
function seated() {
  const ch = noted();
  ch.identity.name = "Chrome"; ch.meta.id = SEAT_TAG; ch.meta.updated = "2026-10-02T10:00:00.000Z";
  const t = Engine.newTable("Dead Air");
  const pid = Engine.addPlayer(t, { name: "Brogan" }).id;
  assert.ok(Engine.importSeat(t, pid, ch).ok);
  t.audit = [];
  const app = boot({ storage: { ["shadows.table.v1." + t.meta.id]: { table: t, section: "players", changed: "2026-10-05T10:00:00.000Z", exported: null }, ...GM_ON } });
  tableCard(app, "Dead Air").querySelector("[data-topen]").click();
  return app;
}

test("324: the GM's read-only seat shows a player's notes, and Group by still works", () => {
  const app = seated();
  app.click(`[data-seat="${SEAT_TAG}"]`); app.click('[data-rotab="notes"]');
  const before = app.window.eval("JSON.stringify(S.table)");
  assert.deepEqual(heads(app), ["Leads", "Table", "No category"]);
  assert.equal(app.$("[data-snew]"), null, "no Add");
  assert.equal(app.$("[data-nedit]"), null);
  assert.equal(app.$("[data-ndel]"), null);
  const free = app.$("[data-notes]"); assert.equal(free.readOnly, true); assert.equal(free.value, "Owes Ivo a favour.");
  // The view stays live: Group by, a tag, and a note's open and close.
  assert.equal(app.$("[data-ngroup=session]").disabled, false);
  app.click("[data-ngroup=session]");
  assert.deepEqual(heads(app), ["The Listener · 2026-11-08", "Dead drop · 2026-11-01", "No session"]);
  app.click('[data-ntag="debt"]'); assert.deepEqual(shown(app), ["Ibarra"]);
  app.click('[data-ntag="debt"]');
  app.click("[data-ngroup=category]");
  const cord = app.$$("#main [data-nopen]").find(b => b.textContent === "The cord");
  cord.click();
  assert.equal(app.$$("#main .tbl-note.open").length, 1);
  assert.match(app.$("#main .tbl-note.open").textContent, /Red\./);
  assert.equal(app.$("#main .tbl-note.open [data-nedit]"), null, "open to read, no Edit");
  assert.equal(app.window.eval("JSON.stringify(S.table)"), before, "nothing the table holds changed");
  assert.deepEqual(app.errors, []);
});

test("324: letting go of a category records it without a redraw, so the click on Done that follows lands", () => {
  const app = openSheet(noted(), "notes");
  const id = app.window.eval(`S.ch.noteCards.find(n => n.title === "House rule").id`);
  app.click(`[data-nopen="${id}"]`); app.click(`[data-nedit="${id}"]`);
  const cat = app.$(`[data-ncat="${id}"]`); cat.focus(); type(app, `[data-ncat="${id}"]`, "Hooks");
  const done = app.$(`[data-ndone="${id}"]`);
  cat.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.deepEqual(log(app), ['Filed "House rule" under Hooks']);
  assert.ok(done.isConnected && cat.isConnected, "the form was not redrawn under the pointer");
  assert.match(app.$("#undotoast").textContent, /Filed "House rule" under Hooks/);
  done.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.equal(app.window.eval("S.snEdit"), null);
  assert.equal(app.doc.activeElement, app.$(`[data-nedit="${id}"]`));
  assert.deepEqual(app.errors, []);
});

test("324: a half-written note is gone after a trip to another tab, and another character opens clean", () => {
  const app = openSheet(noted(), "notes");
  app.click("[data-snew]");
  const id = app.window.eval("S.snNew");
  assert.ok(id && app.$(`[data-ntitle="${id}"]`));
  app.click('[data-sec="main"]'); app.click('[data-sec="notes"]');
  assert.equal(app.$(`[data-ntitle="${id}"]`), null, "no form left open");
  assert.equal(app.$("#main .note-pinned"), null);
  assert.equal(app.window.eval("[S.snOpen, S.snEdit, S.snNew, S.snHold].join()"), ",,,");
  // A tag filter and an open note belong to one character.
  const ibarra = app.window.eval(`S.ch.noteCards.find(n => n.title === "Ibarra").id`);
  app.click('[data-ntag="lead"]'); app.click(`[data-nopen="${ibarra}"]`);
  assert.equal(app.window.eval("S.snOpen"), ibarra);
  app.window.eval(`S.ch.meta.id = "TAG-ZZZZ-ZZZZ-ZZZZ"; update();`);
  assert.equal(app.window.eval("[S.snTag, S.snOpen].join()"), ",");
  assert.deepEqual(app.errors, []);
});
