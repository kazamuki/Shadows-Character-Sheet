/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: what an action changed moves once (Decision 316, I1). A tracker change counts its numbers, floats what it
 * cost off the readout in view, fills Health Levels in order, lingers a meter's lost part, and gives a heal a green line.
 * Undo, a later render, the wizard and reduced motion move nothing.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, D, GM_ON, lockedCharacter, openSheet, tableCard } from "./smokekit.mjs";

const wait = ms => new Promise(r => setTimeout(r, ms));
const luckNow = app => app.$$('[data-count="luck"]').map(e => e.textContent);
const spend = (app, n = 1) => app.click(`#main [data-luckspend="${n}"]`);
const firstSpend = app => app.$("#main [data-luckspend]").dataset.luckspend;

test("I1: a spend counts in every place it's drawn and floats off the readout you touched", async () => {
  const ch = lockedCharacter();
  const app = openSheet(ch, "trackers");
  const was = Engine.luckState(ch).current, cost = Number(firstSpend(app));
  spend(app, cost);
  const now = String(was - cost);
  const spans = app.$$('[data-count="luck"]');
  assert.ok(spans.length >= 2, "Luck should be drawn at least in the pill and on Trackers");
  for (const s of spans) { assert.equal(s.textContent, now, "the HTML must say the new number from the first frame"); assert.equal(s.dataset.from, String(was), "a count carries its old value while it runs"); }
  const floats = app.$$(".beat-float");
  assert.equal(floats.length, 1, "one float per action, not one per twin");
  assert.ok(app.$('#main .trk[data-float="luck"]').contains(floats[0]), "the float should sit in Trackers' Luck block");
  assert.equal(floats[0].textContent, `−${cost}`);
  await wait(450);
  assert.equal(app.$$("[data-from]").length, 0, "the count should have landed");
  assert.deepEqual(luckNow(app), spans.map(() => now));
  assert.deepEqual(app.errors, []);
});

test("I1: with no frame drawn, the right number is all that ever shows", async () => {
  const ch = lockedCharacter();
  const app = openSheet(ch, "trackers");
  app.window.requestAnimationFrame = () => 0;                      // a pane that isn't drawing never calls back
  const seen = [];
  new app.window.MutationObserver(ms => ms.forEach(m => { for (const n of [m.target, ...m.addedNodes]) { const t = (n.nodeType === 1 ? n : n.parentElement); if (t && t.closest && t.closest('[data-count="luck"]')) seen.push(t.closest('[data-count="luck"]').textContent); } }))
    .observe(app.doc.body, { subtree: true, childList: true, characterData: true });
  const was = Engine.luckState(ch).current, cost = Number(firstSpend(app));
  spend(app, cost);
  assert.ok(luckNow(app).length >= 2, "Luck's twins should be count spans");
  await wait(500);
  assert.ok(!seen.includes(String(was)), `the old number ${was} showed: ${seen}`);
  assert.deepEqual(luckNow(app).filter(t => t !== String(was - cost)), [], "every span reads the new number");
  assert.equal(app.$$("[data-from]").length, 0, "a count that never ran leaves no marker behind");
});

test("I1: a beat plays once: a later render, a tab switch and an undo move nothing", async () => {
  const ch = lockedCharacter();
  const app = openSheet(ch, "trackers");
  spend(app, Number(firstSpend(app)));
  assert.ok(app.$$("[data-from]").length >= 2 && app.$$(".beat-float").length === 1,"the spend should have played a beat first");
  await wait(800);
  app.window.eval("update(false)");                                   // a pass that skips the page's render still plays nothing
  assert.equal(app.$$("[data-from], .beat-float").length, 0, "a pass with no render replayed the beat");
  app.click('[data-sec="main"]'); app.click('[data-sec="trackers"]');
  assert.equal(app.$$("[data-from], .beat-float").length, 0, "a tab switch replayed the beat");
  app.click("[data-dmg='1']");                                      // a hit, so undo has a flash to (not) replay
  await wait(450);
  app.click("[data-toastundo]");
  assert.equal(app.$$("[data-from], .beat-float, .mended, .landed, .struck").length, 0, "undo moved something");
  assert.deepEqual(app.errors, []);
});

test("I1: a hit fills its Health Levels in order, and a heal gets a green line instead of a flash", async () => {
  const ch = lockedCharacter();
  const app = openSheet(ch, "trackers");
  const per = Engine.health(ch).hpPer;
  const set = app.$("[data-dmgset]"); set.value = String(per * 2);
  set.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(app.$$(".mended").length, 0, "a hit never carries .mended");
  await wait(60);
  const landed = app.$$("#main .hl.landed");
  assert.equal(landed.length, 2);
  const delays = landed.map(c => c.querySelector(".fill").style.transitionDelay);
  assert.deepEqual(delays, ["0ms", "60ms"], "cells fill left to right, 60ms apart");
  assert.deepEqual(landed.map(c => c.style.animationDelay), ["0ms", "60ms"], "each flash waits for its fill");
  await wait(450);
  app.click('[data-dmg="-5"]');                                     // Heal 5 (a heal step is the engine's)
  assert.ok(app.$("#main .trk .big.mended") && app.$("#main .vpill.mended"), "a heal should put a green line on the HP block and the pill");
  assert.equal(app.$$(".landed, .struck").length, 0, "a heal isn't a hit");
  await wait(60);
  const delays2 = app.$$("#main .hl .fill").map(f => f.style.transitionDelay).filter(Boolean).map(d => Number.parseInt(d));
  assert.ok(delays2.length >= 1, "a heal should empty cells");
  assert.deepEqual(delays2, [...delays2].sort((x, y) => y - x), "cells empty right to left");
  assert.equal(Math.min(...delays2), 0);
});

test("I1: reduced motion gets the end state", async () => {
  const ch = lockedCharacter();
  const app = openSheet(ch, "trackers");
  app.window.matchMedia = media => ({ media, matches: /prefers-reduced-motion:\s*reduce/.test(media), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  const was = Engine.luckState(ch).current, cost = Number(firstSpend(app));
  spend(app, cost);
  assert.ok(luckNow(app).length >= 2, "Luck's twins should be count spans");
  app.click('[data-dmg="1"]'); app.click('[data-dmg="1"]');
  app.click('[data-dmg="-1"]');                                       // and a heal: no green line either
  await wait(100);
  assert.equal(app.$$("[data-from], .beat-float, .mended, .beat-tail").length, 0, "reduced motion moved something");
  assert.equal(app.$$("#main .hl .fill, #main .hl-mini i").filter(f => f.style.transition || f.style.transitionDelay).length, 0, "a cell got an inline transition");
  assert.deepEqual(luckNow(app).filter(t => t !== String(was - cost)), [], "every number is final");
});

test("I1: on Main a meter holds what you lost, and with the popover open the float goes there", async () => {
  const ch = lockedCharacter();
  const app = openSheet(ch, "main");
  app.click('#main [data-vpop="san"]');
  assert.ok(app.$("#vpop:not([hidden])"), "the popover should be open");
  const lose = app.$("#vpop [data-sanset]"); lose.value = "2";            // Sanity down by 2
  lose.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  await wait(60);
  const floats = app.$$(".beat-float");
  assert.equal(floats.length, 1, "one float for the last press");
  assert.ok(app.$("#vpop").contains(floats[0]), "the float goes on the popover's readout");
  assert.equal(app.$$('#main .beat-float').length, 0, "not on the card behind it");
  const tails = app.$$('#main [data-meter="san"] .beat-tail');
  assert.equal(tails.length, 1, "the card's meter holds one tail");
  await wait(800);
  assert.equal(app.$$(".beat-tail, .beat-float").length, 0, "the tail and the float are gone");
  assert.deepEqual(app.errors, []);
});

// ── beyond the examples ───────────────────────────────────────────────

test("I1: a commit on an unlocked character, or on a table screen, leaves nothing to replay", async () => {
  const draft = lockedCharacter(); draft.creation.locked = false;
  const app = boot();
  const out = app.window.eval(`(function(){ const ch=${JSON.stringify(draft)}; return beatsFrom(clone(ch), Object.assign(clone(ch), { trackers: Object.assign(clone(ch.trackers), { luck: { spent: 1, bonus: 0 } }) })); })()`);
  assert.equal(out, null, "the wizard's commits make no beat");
});

test("I1: a commit made on a table screen is not replayed on the next sheet", async () => {
  const t = Engine.newTable("Dead Air");
  const pid = Engine.addPlayer(t, { name: "Brogan" }).id;
  const seat = lockedCharacter(); seat.meta.id = "TAG-AAAA-AAAA-AAAA";
  assert.ok(Engine.importSeat(t, pid, seat).ok);
  const app = boot({ storage: { ["shadows.table.v1." + t.meta.id]: { table: t, section: "encounters", changed: "2026-10-05T10:00:00.000Z", exported: null }, ...GM_ON } });
  tableCard(app, "Dead Air").querySelector("[data-topen]").click();
  assert.equal(app.window.eval("S.screen"), "table");
  app.window.eval(`(function(){ const ch=${JSON.stringify(seat)}; S.ch=ch; commit("luck","t",()=>{ ch.trackers.luck.spent=1; }); S.ch=null; })()`);
  assert.equal(app.window.eval("S.beats"), null, "a table screen's render must take the beat");
});

test("I1: beatsFrom never throws on a hostile file, and answers null or the shape", () => {
  const app = boot();
  const bad = [null, {}, { creation: { locked: true } }, { creation: { locked: true }, trackers: null },
    { creation: { locked: true }, trackers: { luck: { spent: "x" }, sfr: 7, credits: { current: NaN }, damage: "9" } }];
  for (const b of bad) for (const a of bad) {
    const r = app.window.eval(`(function(){ try { const r = beatsFrom(${JSON.stringify(b)}, ${JSON.stringify(a)}); return r === null || (typeof r === "object" && Array.isArray(r.cells)) ? "ok" : "shape"; } catch (e) { return "threw: " + e.message; } })()`);
    assert.equal(r, "ok");
  }
});
