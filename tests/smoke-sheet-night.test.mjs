/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: the night's end moves once (Decision 317, I2). Logging a session prints its register line and counts IP and MP; a
 * track draws the new point; an opened Minor or Major gets a burst and a plate that ends on Choose; a Milestone taken settles
 * in; Lock & Export rings three times once a sitting. Undo, a later render, a tab switch and reduced motion move nothing.
 * Where each beat lands in the page is measured in real Chromium (tools/phone-check.mjs), not here: jsdom has no layout.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, D, lockedCharacter, openSheet, activeChar, fill, onStep, card } from "./smokekit.mjs";

const wait = ms => new Promise(r => setTimeout(r, ms));
const night = n => {
  const ch = lockedCharacter();
  ch.sessions = Array.from({ length: n }, (_, i) => ({ date: `2026-10-${String(i + 1).padStart(2, "0")}`, title: `Night ${i + 1}`, ipEarned: 10, milestonePoint: true, notes: "" }));
  return ch;
};
const logOne = (app, { hours = "2", title = "Dead Air" } = {}) => { fill(app, "[data-sestitle]", title); fill(app, "[data-seshours]", hours); app.click("[data-seslog]"); };
const calmed = app => { app.window.matchMedia = media => ({ media, matches: /prefers-reduced-motion:\s*reduce/.test(media), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }); };
const histRow = app => app.$$("#main .pick").filter(p => /\+\d+ IP/.test((p.querySelector(".cost") || { textContent: "" }).textContent))[0];
const pip = (app, n) => app.$(`#main [data-pip="${n}"]`);
const BEATS = "[data-from], .beat-float, .beat-burst, .beat-print, .beat-stamp, .beat-row, .beat-settle, .beat-in, .beat-draw, .beat-flash";

test("I2: logging a session prints its register line, counts IP and MP, floats them, draws the new point and drops the row in", async () => {
  const app = openSheet(night(4), "sessions");
  logOne(app);
  for (const k of ["ip", "mp"]) {
    const spans = app.$$(`[data-count="${k}"]`);
    assert.ok(spans.length >= 3, `${k} should be a count span in the pill, the drawer and Progression's block`);
    for (const s of spans) assert.ok(s.dataset.from !== undefined, `${k}: a count carries its old value while it runs`);
  }
  assert.deepEqual(app.$$('[data-count="mp"]').map(e => e.textContent), ["5", "5", "5"].slice(0, app.$$('[data-count="mp"]').length), "the new MP is in the HTML from the first frame");
  const floats = app.$$(".beat-float");
  assert.equal(floats.length, 2, "one float for IP, one for MP");
  assert.equal(app.$('#main .trk[data-float="ip"] .beat-float').textContent, "+10");
  assert.equal(app.$('#main .trk[data-float="mp"] .beat-float').textContent, "+1");
  const strip = app.$("#main [data-night]"), line = strip.querySelector(".night-line");
  assert.ok(line.classList.contains("beat-print"));
  assert.match(line.textContent.replace(/\s+/g, " "), /Dead Air \+10 IP \+1 MP/);
  assert.ok(line.querySelector(".nl-ip.beat-stamp") && line.querySelector(".nl-mp.beat-stamp"));
  assert.ok(line.compareDocumentPosition(strip.querySelector(".mp-track")) & 4, "the line is above the track");
  assert.ok(pip(app, 5).classList.contains("on"));
  assert.ok(histRow(app).classList.contains("beat-row"), "History's first row drops in");
  await wait(1500);
  assert.equal(app.$$("[data-from], .beat-float, .beat-burst, .beat-draw, .beat-flash, .beat-in").length, 0, "everything that moved is done");
  app.click('[data-sec="main"]'); app.click('[data-sec="progression"]');
  const again = app.$("#main .night-line");
  assert.ok(again && /Dead Air/.test(again.textContent), "the register line is state: it's still there");
  assert.equal(app.$$(BEATS).length, 0, "and it doesn't replay");
  assert.deepEqual(app.errors, []);
});

test("I2: the fifth point opens a Minor: a burst, and a plate that stays and ends on Choose", async () => {
  const app = openSheet(night(4), "sessions");
  logOne(app);
  await wait(60);
  const plate = app.$("#main .ms-plate");
  assert.ok(plate && plate.classList.contains("minor") && plate.querySelector('[data-mschoose="minor"]'));
  assert.equal(plate.querySelectorAll(".beat-burst").length, 1, "one burst, inside the plate");
  assert.equal(app.$("#announcer").textContent, "Minor Milestone ready");
  await wait(1300);
  app.click('[data-sec="main"]'); app.click('[data-sec="progression"]');
  assert.ok(app.$("#main .ms-plate.minor"), "a plate is state: still there after a tab switch");
  assert.equal(app.$$(".beat-burst, .beat-in").length, 0, "with no burst and no animation class");
  assert.match(app.$("#main .ms-plate").textContent, /Minor Milestone/);
  assert.match(app.$("#main .ms-plate").textContent, /1 to pick/);
  assert.deepEqual(app.errors, []);
});

test("I2: the tenth point lights every point in turn, and a tap skips to the end", async () => {
  const app = openSheet(night(9), "sessions");
  const doc = app.window.document, live = new Set();
  const add = doc.addEventListener.bind(doc), rm = doc.removeEventListener.bind(doc);
  doc.addEventListener = (t, f, o) => { if (t === "pointerdown" || t === "keydown") live.add(f); return add(t, f, o); };
  doc.removeEventListener = (t, f, o) => { if (t === "pointerdown" || t === "keydown") live.delete(f); return rm(t, f, o); };
  logOne(app);
  await wait(50);
  const pips = app.$$("#main [data-pip]");
  assert.equal(pips.length, 10);
  assert.deepEqual(pips.map(p => parseInt(p.style.animationDelay, 10)), [350, 400, 450, 500, 550, 600, 650, 700, 750, 800]);
  assert.equal(app.$$("#main .beat-burst.major").length, 1);
  assert.ok(app.$("#main .ms-plate.major"), "the Major plate");
  assert.ok(live.size >= 1, "the skip is listening during the beat");
  await wait(50);
  const target = app.$("#main [data-mschoose]"); let clicked = 0;
  target.addEventListener("click", () => clicked++);
  target.dispatchEvent(new app.window.Event("pointerdown", { bubbles: true }));
  assert.equal(app.$$(".beat-burst").length, 0, "the burst is gone");
  assert.ok(pips.every(p => p.classList.contains("on") && !p.style.animationDelay && !p.classList.contains("beat-flash")), "every point lit and at rest");
  assert.ok(!app.$("#main .ms-plate").classList.contains("beat-in") && !app.$("#main .ms-plate").style.animationDelay, "the plate is at rest");
  target.click();
  assert.equal(clicked, 1, "the press still did what it does");
  assert.equal(live.size, 0, "the skip took itself off");
  await wait(1400);
  assert.equal(live.size, 0);
  assert.deepEqual(app.errors, []);
});

test("I2: the skip also takes itself off when nobody taps", async () => {
  const app = openSheet(night(9), "sessions");
  const doc = app.window.document, live = new Set();
  const add = doc.addEventListener.bind(doc), rm = doc.removeEventListener.bind(doc);
  doc.addEventListener = (t, f, o) => { if (t === "pointerdown") live.add(f); return add(t, f, o); };
  doc.removeEventListener = (t, f, o) => { if (t === "pointerdown") live.delete(f); return rm(t, f, o); };
  logOne(app);
  await wait(60);
  assert.equal(live.size, 1);
  await wait(1600);
  assert.equal(live.size, 0, "the listener is gone once the beat is over");
});

test("I2: Choose opens the owed group at its first Take, and never the Focused Skill dialog", () => {
  const app = openSheet(night(5), "sessions");
  const grp = app.$("#ms-minor");
  assert.ok(grp && app.$('[data-mschoose="minor"]'));
  grp.open = false;
  app.click('[data-mschoose="minor"]');
  assert.equal(grp.open, true);
  const first = [...grp.querySelectorAll("[data-takeminor]")].find(b => !b.disabled);
  assert.ok(first, "a Minor can be taken");
  assert.equal(app.window.document.activeElement, first);
  assert.equal(app.$$("dialog.modal[open]").length, 0, "no dialog opened");
  assert.equal(app.$("[data-fowedopen]"), null);
  const both = openSheet(night(10), "sessions");
  assert.equal(both.$$("[data-mschoose]").length, 1, "one plate, the Major's");
  assert.equal(both.$("[data-mschoose]").dataset.mschoose, "major");
  assert.equal(both.$$("#ms-minor [data-takeminor]").some(b => !b.disabled), true, "a Minor is owed too");
  both.$("#ms-major").open = false;
  both.click('[data-mschoose="major"]');
  assert.equal(both.$("#ms-major").open, true);
  const act = both.window.document.activeElement, enabled = both.$$("#ms-major [data-takemajor]").find(b => !b.disabled);
  assert.ok(both.$("#ms-major").contains(act), `focus should be in the Major group, not ${act.tagName}`);
  assert.equal(act, enabled || both.$("#ms-major summary"), "its first enabled Take, or its heading when none can be taken yet");
  assert.equal(both.$$("dialog.modal[open]").length, 0);
  assert.deepEqual([app.errors, both.errors], [[], []]);
});

test("I2: a manual Milestone Point plays the Milestone beat, not History's", async () => {
  const app = openSheet(night(4), "sessions");
  app.click('[data-mp="1"]');
  await wait(60);
  assert.ok(app.$("#main .ms-plate.minor"), "the plate");
  assert.equal(app.$$("#main .beat-burst").length, 1, "the burst");
  assert.equal(app.$$("#main .night-line.beat-print, #main .beat-stamp, #main .beat-row").length, 0, "no register line beat, no History beat");
  assert.match(app.$("#main .night-line").textContent, /Night 4/, "the register line still shows the last session");
  assert.ok(pip(app, 5).classList.contains("on"));
  await wait(100);
  assert.deepEqual(app.errors, []);
});

test("I2: a beat plays once: undo, a later render and a tab switch move nothing", async () => {
  const app = openSheet(night(4), "sessions");
  logOne(app);
  assert.ok(app.$$(BEATS).length > 3, "the beat played first");
  await wait(1500);
  app.window.eval("update(false)");
  app.window.eval("update()");
  assert.equal(app.$$(BEATS).length, 0, "a later render replayed");
  app.click('[data-sec="main"]'); app.click('[data-sec="progression"]');
  assert.equal(app.$$(BEATS).length, 0, "a tab switch replayed");
  app.click("[data-toastundo]");
  assert.equal(app.$$(BEATS).length, 0, "undo moved something");
  assert.equal(app.$("#main .ms-plate"), null, "nothing is owed once the session is undone");
  assert.equal(activeChar(app).sessions.length, 4);
  assert.deepEqual(app.errors, []);
});

test("I2: reduced motion gets the end state, and the screen reader still hears it", async () => {
  const app = openSheet(night(9), "sessions");
  calmed(app);
  logOne(app);
  await wait(100);
  assert.equal(app.$$(BEATS).length, 0, "reduced motion moved something");
  assert.ok(pip(app, 10).classList.contains("on"));
  assert.ok(app.$("#main .ms-plate.major"), "the plate is there");
  assert.match(app.$("#main .night-line").textContent, /Dead Air/);
  assert.equal(app.$$("#main [data-pip]").filter(p => p.style.animationDelay || p.style.transition || p.querySelector("i").style.animationDelay).length, 0);
  assert.deepEqual(app.$$('[data-count="mp"]').filter(e => e.textContent !== "10"), []);
  assert.equal(app.$("#announcer").textContent, "Major Milestone ready");
  assert.deepEqual(app.errors, []);
});

test("I2: with no frame drawn, the new number and the new point are all that ever show", async () => {
  const app = openSheet(night(4), "sessions");
  app.window.requestAnimationFrame = () => 0;
  const seenMp = [], offs = [];
  new app.window.MutationObserver(ms => ms.forEach(m => {
    for (const n of [m.target, ...m.addedNodes]) { const t = n.nodeType === 1 ? n : n.parentElement; const c = t && t.closest && t.closest('[data-count="mp"]'); if (c) seenMp.push(c.textContent); }
    if (m.target.closest && m.target.closest("[data-pip]") && !pip(app, 5).classList.contains("on")) offs.push("off");
  })).observe(app.doc.body, { subtree: true, childList: true, characterData: true, attributes: true });
  logOne(app);
  await wait(200);
  assert.ok(!seenMp.includes("4"), `the old MP showed: ${seenMp}`);
  assert.ok(pip(app, 5).classList.contains("on") && offs.length === 0, "pip 5 was never un-lit");
  assert.equal(app.$$(".beat-burst, .beat-draw, .beat-in").length, 0, "no frame, so nothing is hidden for a draw that never comes");
  await wait(1500);
  assert.equal(app.$$("[data-from]").length, 0);
});

test("I2: a Milestone taken settles into its list once", async () => {
  // Each Minor asks a chooser or a roll first (Decision 217): take the first the chooser lets through, from its own dialog.
  const app = openSheet(night(5), "sessions");
  for (const m of D.milestones.minorShared) {
    if (app.$$("#main #ms-minor .journal .jrow").length) break;
    if (Engine.ipRoll(m.id)) continue;
    app.click(`[data-takeminor="${m.id}"]`);
    const opt = app.$$("dialog.modal[open] [data-mcpick]").find(b => !b.disabled);
    if (opt) { opt.click(); const t = app.$("dialog.modal[open] [data-mctake]"); if (t && !t.disabled) t.click(); }
    app.$$("dialog.modal[open] [data-modalclose]").forEach(b => b.click());
  }
  const row = app.$$("#main #ms-minor .journal .jrow");
  assert.equal(row.length, 1);
  assert.ok(row[0].classList.contains("beat-settle"), "the new row settles");
  assert.equal(app.$("#main .ms-plate"), null, "nothing owed, so the plate is gone");
  await wait(100);
  app.click('[data-sec="main"]'); app.click('[data-sec="progression"]');
  assert.equal(app.$$("#main .beat-settle").length, 0, "a tab switch doesn't settle it again");
  // A Major written in takes the Major journal's row the same way.
  const big = openSheet(night(10), "sessions");
  fill(big, "[data-mmname]", "Burned the file"); fill(big, "[data-mmdesc]", "Gone.");
  big.click("[data-mmadd]");
  assert.ok(big.$("#main #ms-major .journal .jrow.beat-settle"), "the Major row settles too");
  assert.deepEqual([app.errors, big.errors], [[], []]);
});

test("I2: the threshold is the data's: a cadence of 3 opens at 3, and 5 is nothing special", async () => {
  const app = openSheet(night(2), "sessions");
  app.window.eval("D.milestones.rules.minorFirstAt = 3; D.milestones.rules.minorEvery = 4; update();");
  assert.equal(app.$("#main .ms-plate"), null);
  logOne(app);
  await wait(60);
  assert.ok(app.$("#main .ms-plate.minor"), "3 MP opened a Minor");
  assert.equal(app.$$("#main .beat-burst").length, 1);
  await wait(1500);
  app.window.eval("S.ch.progression.milestones.minor.push({ id: 'skilled', date: '2026-11-01' }); update();");
  assert.equal(app.$("#main .ms-plate"), null, "taken, so nothing is owed");
  logOne(app);                                   // 4 MP: nothing opens at 4 (the next is 3 + 4 = 7)
  await wait(60);
  assert.equal(app.$$("#main .beat-burst").length, 0, "no threshold, no burst");
  assert.deepEqual(app.errors, []);
});

test("I2: a session with its Milestone Point unticked logs without opening anything", async () => {
  const app = openSheet(night(4), "sessions");
  app.$("[data-sesmp]").checked = false;
  logOne(app);
  assert.ok(app.$("#main .night-line.beat-print"), "it logged");
  assert.equal(app.$("#main .nl-mp"), null, "and earned no MP");
  assert.equal(app.$("#main .ms-plate"), null);
  assert.equal(app.$$("#main .beat-burst").length, 0);
  assert.equal(app.$("#announcer"), null, "nothing opened, nothing announced");
  assert.deepEqual(app.errors, []);
});

test("I2: the register line reads the last session, never a copy", () => {
  const app = openSheet(night(3), "sessions");
  assert.match(app.$("#main .night-line").textContent, /Night 3/);
  app.window.eval("S.ch.sessions.pop(); update();");
  assert.match(app.$("#main .night-line").textContent, /Night 2/);
  app.window.eval("S.ch.sessions.length = 0; update();");
  assert.equal(app.$("#main .night-line"), null, "no sessions, no line");
  app.window.eval("S.ch.sessions.push({ date: '2026-11-02', title: '', ipEarned: 15, milestonePoint: false, notes: '' }); update();");
  assert.match(app.$("#main .night-line").textContent.replace(/\s+/g, " "), /2026-11-02 \+15 IP/);
  assert.doesNotMatch(app.$("#main .night-line").textContent, /MP/);
  assert.deepEqual(app.errors, []);
});

test("I2: re-rendering with Choose focused keeps focus on Choose", () => {
  const app = openSheet(night(5), "sessions");
  app.$('[data-mschoose="minor"]').focus();
  app.window.eval("update();");
  assert.equal(app.window.document.activeElement, app.$('[data-mschoose="minor"]'));
});

test("I2: beatsFrom never throws on direct hostile inputs, and says nothing about the night it can't read", () => {
  const app = boot();
  const lock = x => ({ creation: { locked: true }, ...x });
  const bad = [lock({}), lock({ sessions: "x" }), lock({ sessions: null }), lock({ progression: null }), lock({ progression: { milestones: null } }),
    lock({ progression: { milestones: { minor: "x", major: 7 }, milestonePoints: "9" }, sessions: [1, null, "x"] }), lock({ trackers: null, sessions: [] })];
  for (const b of bad) for (const a of bad) {
    const r = app.window.eval(`(function(){ try { const r = beatsFrom(${JSON.stringify(b)}, ${JSON.stringify(a)}); return r === null || typeof r === "object" ? "ok" : "shape"; } catch (e) { return "threw: " + e.message; } })()`);
    assert.equal(r, "ok");
  }
  const one = app.window.eval(`JSON.stringify(beatsFrom(${JSON.stringify(night(4))}, ${JSON.stringify(night(5))}))`), r = JSON.parse(one);
  assert.equal(r.logged, true);
  assert.deepEqual(r.opened, { minor: 1, major: 0 });
  assert.equal(r.taken, null);
  for (const html of ["nightLineHtml({ sessions: 'x' })", "nightLineHtml({ sessions: [null] })", "mpTrackHtml({})", "msPlateHtml({})", "msPlateHtml(null)"])
    assert.equal(typeof app.window.eval(html), "string", html);
});

test("I2: Lock & Export rings three times the first time it's ready, then never again that sitting", () => {
  // A real draft has a dozen issues to clear, so Review's check is stood in for: one issue while the name is empty.
  const stub = app => app.window.eval(`Engine.validate = (id, ch) => ch.identity.name ? [] : [{ level: "error", msg: "Name it." }]; update();`);
  const probe = onStep("professional", "street", "review", ch => { ch.identity.name = ""; });
  stub(probe);
  const lock = () => probe.$("[data-lock]");
  assert.equal(lock().disabled, true, "the draft is one issue short");
  assert.ok(!lock().classList.contains("beat-ring"));
  probe.window.eval(`S.ch.identity.name = "Probe"; refreshNav();`);
  assert.equal(lock().disabled, false);
  assert.ok(lock().classList.contains("beat-ring"), "fixed the last issue: it rings");
  probe.window.eval(`S.ch.identity.name = ""; refreshNav(); S.ch.identity.name = "Probe"; refreshNav();`);
  probe.window.eval(`update();`);
  assert.ok(!lock().classList.contains("beat-ring"), "fixing and re-breaking doesn't ring it again");
  probe.click('[data-nav="-1"]'); probe.click('[data-nav="1"]');
  assert.ok(lock() && !lock().classList.contains("beat-ring"), "back and forward doesn't either");
  const done = onStep("professional", "street", "review");
  stub(done); done.window.eval("S.lockRung = new Set(); update();");
  assert.equal(done.$("[data-lock]").disabled, false);
  assert.ok(done.$("[data-lock]").classList.contains("beat-ring"), "a complete draft opened on Review rings once");
  assert.deepEqual([probe.errors, done.errors], [[], []]);
});
