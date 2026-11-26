/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: the table moves once (Decision 318, I3). Next turn stamps the name in the bar and draws the acting row's edge, a new
 * round stamps its number, a clock's + draws its segment and Full stamps, a row going down stamps Down and one marked out fades,
 * and writing the award log prints its lines in on the end page. Undo, a later render, a tab switch, typing and reduced motion
 * move nothing. Where each beat lands in the page is measured in real Chromium (tools/phone-check.mjs), not here: jsdom has no
 * layout.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, deadAirApp, type } from "./smokekit.mjs";

const wait = ms => new Promise(r => setTimeout(r, ms));
const calmed = app => { app.window.matchMedia = media => ({ media, matches: /prefers-reduced-motion:\s*reduce/.test(media), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }); };
const BEATS = ".beat-stamp, .beat-edge, .beat-draw, .beat-fade, .beat-print";
const beats = app => app.$$(BEATS);
const fight = () => { const app = deadAirApp("encounters"); app.click('[data-tn="fight"]'); return app; };
const encId = app => app.window.eval("S.encOpen");
const acting = app => app.$(".enc-row.active");
const nameOf = li => li.querySelector(".enc-name").textContent;
const status = app => app.$(".enc-bar .enc-status");
// A running encounter's own clock, one short of full, so the block is on the encounter's page.
const addClock = (app, filled = 7) => { app.window.eval(`tableChange(()=>Engine.addClock(S.table, { name: "Alarm", segments: 8, filled: ${filled}, on: { kind: "encounter", id: S.encOpen } }));`); return app.$('[data-clock] [data-clkplus]').closest("[data-clock]"); };
const press = (app, key) => { app.doc.body.dispatchEvent(new app.window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })); };
const toReset = app => { for (let i = 0; i < 12 && !app.$("[data-efinish]"); i++) app.click("[data-enext]"); assert.ok(app.$("[data-efinish]"), "never reached the reset"); };

test("I3: Next stamps the bar's name and draws the acting row's edge, once", async () => {
  const app = fight();
  assert.equal(beats(app).length, 0, "opening the page moves nothing");
  app.click("[data-enext]");
  await wait(60);
  const stamped = status(app).querySelector(".beat-stamp");
  assert.ok(stamped && stamped.textContent === nameOf(acting(app)), "the bar's new name takes the stamp");
  assert.equal(status(app).textContent, `Round 2 · ${stamped.textContent}`, "the bar still reads as one sentence");
  assert.ok(acting(app).classList.contains("beat-edge"), "the acting row's edge draws in");
  assert.equal(app.$$(".beat-edge").length, 1);
  assert.equal(app.$$(".enc-row.beat-stamp, .enc-row .beat-stamp").length, 0, "no row is stamped for a turn");
  await wait(700);
  assert.equal(beats(app).length, 0, "everything that moved is done");
  const eid = encId(app); app.click('[data-tsec="notes"]'); app.click('[data-tsec="encounters"]'); if (app.$(`[data-enc-open="${eid}"]`)) app.click(`[data-enc-open="${eid}"]`);
  assert.equal(beats(app).length, 0, "a tab switch doesn't replay it");
  assert.deepEqual(app.errors, []);
});

test("I3: every press that moves the turn plays it, and only those", async () => {
  const app = fight();
  // A pick: the head of a row that hasn't acted.
  const other = app.$$("[data-erow]").find(li => !li.classList.contains("active") && li.querySelector("[data-eturn]"));
  other.querySelector("[data-eturn]").click();
  await wait(60);
  assert.ok(app.$(`[data-erow="${other.dataset.erow}"]`).classList.contains("active") && app.$(`[data-erow="${other.dataset.erow}"]`).classList.contains("beat-edge"), "a pick draws the edge");
  await wait(700);
  // Key N.
  press(app, "n");
  await wait(60);
  assert.ok(acting(app).classList.contains("beat-edge"), "N draws the edge");
  await wait(700);
  // Delay, then Act now on the delayed row.
  const id = acting(app).dataset.erow;
  app.click(`[data-edelay-open="${id}"]`); type(app, "[data-edelay-until]", "the door opens");
  app.$("[data-edelayform]").dispatchEvent(new app.window.Event("submit", { bubbles: true, cancelable: true }));
  await wait(60);
  assert.ok(acting(app).classList.contains("beat-edge") && acting(app).dataset.erow !== id, "Delay draws the new row's edge");
  await wait(700);
  app.click(`[data-eacnow="${id}"]`);
  await wait(60);
  assert.ok(acting(app).dataset.erow === id && acting(app).classList.contains("beat-edge"), "Act now draws the edge");
  await wait(700);
  // Editing a name moves no turn: typed, then changed.
  const name = app.$("[data-ename]");
  if (name) { type(app, `[data-ename="${name.dataset.ename}"]`, "Renamed"); await wait(60); assert.equal(beats(app).length, 0, "a name moves nothing"); }
  assert.deepEqual(app.errors, []);
});

test("I3: Finish the round stamps the round and says it", async () => {
  const app = fight();
  toReset(app);
  await wait(60);
  const src = app.$$("[data-esrc]");
  src.forEach(el => { el.value = "3"; el.dispatchEvent(new app.window.Event("input", { bubbles: true })); });
  await wait(700);
  assert.equal(beats(app).length, 0);
  app.click("[data-efinish]");
  await wait(60);
  assert.equal(app.$("#announcer").textContent, "Round 3", "the screen reader hears the round once");
  assert.ok(status(app).querySelector("[data-eround].beat-stamp"), "the round takes the stamp");
  assert.match(status(app).textContent, /^Round 3/);
  assert.deepEqual(app.errors, []);
});

test("I3: a clock's + draws its segment in, and Full stamps, in every twin on the page", async () => {
  const app = fight();
  const block = addClock(app);
  block.querySelector("[data-clkplus]").click();
  await wait(60);
  const root = app.$("[data-clock]");
  assert.ok(root.querySelectorAll(".clock-box")[7].classList.contains("beat-draw"), "the 8th box draws in");
  assert.equal(root.querySelectorAll(".beat-draw").length, 1);
  assert.ok(root.querySelector("[data-clockfull] strong.beat-stamp"), "Full stamps");
  assert.equal(root.querySelector(".clock-count .beat-stamp, .clock-count.beat-stamp, [role=status].beat-stamp"), null, "the live count never moves");
  await wait(700);
  assert.equal(beats(app).length, 0);
  // − gives nothing.
  root.querySelector("[data-clkminus]").click();
  await wait(60);
  assert.equal(beats(app).length, 0, "− moves nothing");
  // The line, on Next session: Dex before the full moon is 7 of 8.
  const app2 = deadAirApp("sessions");
  const line = app2.$$("[data-cline]").find(l => /Dex before the full moon/.test(l.textContent));
  assert.ok(line, "the sample's line");
  line.querySelector("[data-clkplus]").click();
  await wait(60);
  assert.ok(app2.$$("[data-cline]").find(l => /Dex before the full moon/.test(l.textContent)).querySelector("[data-cline-n].beat-stamp"), "the line's Full stamps");
  assert.equal(app2.$$(".beat-draw").length, 0, "a line has no boxes");
  assert.deepEqual(app.errors.concat(app2.errors), []);
});

test("I3: a clock's beat plays on its own press and never later", async () => {
  const app = fight();
  const block = addClock(app);
  block.querySelector("[data-clkplus]").click();
  await wait(1000);
  assert.equal(beats(app).length, 0);
  const eid = encId(app);
  app.click('[data-tsec="notes"]'); await wait(60);
  app.click('[data-tsec="encounters"]'); if (app.$(`[data-enc-open="${eid}"]`)) app.click(`[data-enc-open="${eid}"]`); await wait(60);
  assert.equal(beats(app).length, 0, "nothing replays on a tab switch");
  app.window.eval("update()"); await wait(60);
  assert.equal(beats(app).length, 0, "nor on a later render");
});

test("I3: a row going down stamps Down; a row marked out fades; Tonight's chip doesn't move", async () => {
  const app = fight();
  const e = encId(app), mara = app.$$("[data-erow]").find(li => nameOf(li) === "Mara Okonkwo").dataset.erow;
  app.window.eval(`tableChange(()=>Engine.participantDamage(S.table, ${JSON.stringify(e)}, ${JSON.stringify(mara)}, 999))`);
  await wait(60);
  const down = app.$(`[data-erow="${mara}"] .enc-down`);
  assert.ok(down && down.classList.contains("beat-stamp"), "Down takes the stamp");
  assert.equal(app.$$(".tn [class*=beat-]").length, 0, "Tonight's chip has no motion");
  await wait(700);
  const other = app.$$("[data-erow]").find(li => nameOf(li) === "Juno Park").dataset.erow;
  app.window.eval(`tableChange(()=>Engine.editParticipant(S.table, ${JSON.stringify(e)}, ${JSON.stringify(other)}, { out: true }))`);
  await wait(60);
  assert.ok(app.$(`[data-erow="${other}"]`).classList.contains("out") && app.$(`[data-erow="${other}"]`).classList.contains("beat-fade"), "an out row fades");
  assert.equal(app.$(`[data-erow="${mara}"] .enc-down.beat-stamp`), null, "and Down doesn't play twice");
  assert.deepEqual(app.errors, []);
});

test("I3: Write prints the award log's lines in, once", async () => {
  const app = deadAirApp("sessions");
  app.window.eval(`(()=>{ const s=S.table.sessions.find(x=>x.status!=="closed" && !x.close) || S.table.sessions[0]; window.__s=s.id; })()`);
  const sid = app.window.eval("window.__s");
  app.click(`[data-sopen="${sid}"]`);
  app.click("[data-co-open]");
  assert.ok(app.$("[data-co-write]"), "the close-out is open");
  app.click("[data-co-write]");
  const h = app.$("[data-coend-h]");
  assert.ok(h && h.classList.contains("beat-stamp"), "the heading stamps");
  const lines = app.$$(".co-log > li");
  assert.ok(lines.length >= 3, "the sample has at least three lines");
  const printed = lines.filter(l => l.classList.contains("beat-print"));
  assert.equal(printed.length, lines.length, "every line prints in");
  assert.deepEqual(printed.slice(0, 3).map(l => l.style.animationDelay), ["0ms", "60ms", "120ms"]);
  app.window.eval("update()");
  assert.equal(beats(app).length, 0, "a later render of the end page prints nothing");
  assert.equal(app.$$(".co-log > li").length, lines.length, "and it is all still there");
  app.click("[data-coend-done]");
  assert.equal(beats(app).length, 0, "the session page moves nothing");
  // Redo, then Write again: it prints again.
  app.click("[data-co-redo]"); app.click("#modal [data-askyes]");
  app.click("[data-co-write]");
  assert.ok(app.$("[data-coend-h]").classList.contains("beat-stamp") && app.$$(".co-log > .beat-print").length > 0, "Redo then Write plays it again");
  assert.deepEqual(app.errors, []);
});

test("I3: undo, a later render, typing and reduced motion move nothing", async () => {
  const app = fight();
  app.click("[data-enext]"); await wait(700);
  app.click("[data-enext]"); await wait(20);
  app.click("[data-toastundo]"); await wait(60);
  assert.equal(beats(app).length, 0, "undo moves nothing");
  app.window.eval("update()"); await wait(60);
  assert.equal(beats(app).length, 0, "a later render moves nothing");
  // Typing in a field records a fold and sets no beat: a press that moves the turn straight after a typed event still reads as typed.
  const f = app.$("[data-ename]");
  assert.ok(f, "a name field to type in");
  type(app, `[data-ename="${f.dataset.ename}"]`, "Typed");
  app.window.eval("tableChange(()=>Engine.nextTurn(S.table, S.encOpen))"); await wait(60);
  assert.equal(beats(app).length, 0, "typing moves nothing");
  const calm = fight(); calmed(calm);
  calm.click("[data-enext]"); await wait(60);
  assert.equal(beats(calm).length, 0, "reduced motion gets the end state");
  assert.equal(acting(calm).getAttribute("aria-current"), "step");
  const calm2 = fight(); calmed(calm2);
  toReset(calm2);
  calm2.$$("[data-esrc]").forEach(el => { el.value = "3"; el.dispatchEvent(new calm2.window.Event("input", { bubbles: true })); });
  calm2.click("[data-efinish]"); await wait(60);
  assert.equal(beats(calm2).length, 0);
  assert.equal(calm2.$("#announcer").textContent, "Round 3", "the screen reader still hears the round");
});

test("I3: with no frame drawn, the table is right and nothing plays", async () => {
  const app = fight();
  app.window.requestAnimationFrame = () => 0;
  const before = acting(app).dataset.erow;
  app.click("[data-enext]"); await wait(60);
  assert.notEqual(acting(app).dataset.erow, before);
  assert.equal(status(app).textContent, `Round 2 · ${nameOf(acting(app))}`);
  assert.equal(beats(app).length, 0);
});

test("I3: tableBeatsFrom never throws on direct hostile inputs", () => {
  const app = fight();
  const t = app.window.eval("S.table");
  const run = (a, b) => app.window.eval(`tableBeatsFrom(${a}, ${b})`);
  app.window.__t = t;
  for (const [a, b] of [["{}", "__t"], ["__t", "{}"], ["null", "__t"], ["__t", "null"], ["null", "null"], ["undefined", "undefined"], ["{ encounters: 'x', clocks: 5 }", "{ encounters: [null, 3], clocks: [null] }"]]) {
    const r = run(a, b);
    assert.ok(r === null || typeof r === "object", `${a}, ${b}`);
  }
  // A row with no health, a clock with a string filled.
  app.window.eval(`window.__w = JSON.parse(JSON.stringify(S.table)); window.__w.encounters[0].rows.forEach(r=>{ delete r.health; }); window.__w.clocks.forEach(c=>{ c.filled = "7"; });`);
  assert.doesNotThrow(() => app.window.eval("tableBeatsFrom(S.table, __w)"));
  assert.equal(app.window.eval("tableBeatsFrom(__w, __w)"), null);
  assert.equal(app.window.eval("tableBeatsFrom(S.table, S.table)"), null, "nothing moved");
});

test("I3: a seat line's Milestone Point reads gold, as words", () => {
  const app = deadAirApp("sessions");
  const sid = app.window.eval("S.table.sessions.find(s=>s.close && s.close.lines.some(l=>l.milestone)) ? S.table.sessions.find(s=>s.close && s.close.lines.some(l=>l.milestone)).id : null");
  assert.ok(sid, "the sample has a closed-out session with a Milestone Point");
  const html = app.window.eval(`(()=>{ const s=S.table.sessions.find(x=>x.id===${JSON.stringify(sid)}); const l=s.close.lines.find(x=>x.milestone && x.present); return coLogLine(l, s.close); })()`);
  assert.match(html, /<span class="co-mp">the Milestone Point<\/span>/);
  assert.equal(html.replace(/<[^>]+>/g, "").includes("the Milestone Point"), true, "the words are unchanged");
});
