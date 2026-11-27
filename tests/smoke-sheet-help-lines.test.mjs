/**
 * K1: Help on the sheet. A ? in the header and the ? key open a panel for the tab that's open, from the data's `sheetGuide`;
 * every tab carries a guide line, and a Guide lines switch takes them away. From 1280px Help is a column that takes pinned
 * vitals' place while it's open; narrower it is a flyout.
 *
 * jsdom has no layout, so what these pin is state, focus, text and classes. The widths are the harness's `matchMedia`
 * (boot's `width`): the CSS that does the swapping is phone-check's (Chromium).
 *
 * This half: the guide lines on every tab (Decision 298). Its other half is smoke-sheet-help-panel.
 * The file was split in two so node --test runs the halves in parallel.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Engine, D, lockedCharacter, lockedVampire, writtenInCharacter, openSheet, sheet, SG, SECTIONS, SGUIDE } from "./smokekit.mjs";

// ── K3: Guide lines everywhere (Decision 298) ─────────────────────────────

const SEC_LABEL = { main: "Main", skills: "Skills", character: "Character", trackers: "Trackers", progression: "Progression", loadout: "Loadout", notes: "Notes" };

const norm = s => s.replace(/\s+/g, " ").trim();

// A guide line as it reads on screen: **bold** loses its marks, {tab:id} is that tab's label and {gmChip} is the chip's.
const lineSaid = t => norm(t.replace(/\*\*/g, "").replace(/\{tab:(\w+)\}/g, (m, id) => SEC_LABEL[id] || m).replace("{gmChip}", "GM"));

const guideEls = root => [...root.querySelectorAll("[data-guide], [data-guide-line]")];

/** A locked character of an archetype, in a full state (a session, IP, Training on) or an empty one. */
function k3Char(arch, full) {
  const ch = arch === "vampire" ? lockedVampire("upyr") : arch === "writein" ? writtenInCharacter() : lockedCharacter();
  if (arch !== "writein") ch.identity.archetype = arch;
  ch.meta.id = "TAG-K3K3-K3K3-K3K3";
  if (full) {
    Engine.logSession(ch, { title: "The job", ipEarned: 4 }); ch.houseRules = { training: true };
    ch.armor.push({ id: "kevlar-vest", integrityLoss: 0, notes: "", worn: true, scrapped: false, upgrades: [] });   // a worn vest: Trackers' wear note and its repairs line
    ch.disadvantages.push({ id: "burned", rank: 1, notes: "" });   // Burned at rep 0: paid off, and its note says where to remove it
    ch.trackers.crank.rep = 0; ch.trackers.crank.ledger.push({ date: "2026-10-01T00:00:00.000Z", amount: 0, note: "Start: Burned rank 1", start: "burned" });
  }
  return ch;
}

/** Every tab (Admin last), read with the switch on or off: { tab: { text, guides: [{ key, text }] } }. */
function k3Read(arch, full, off) {
  const app = openSheet(k3Char(arch, full), "main", off ? { storage: { [SGUIDE]: "off" } } : {});
  const out = {};
  const grab = tab => {
    const clone = app.$("#main").cloneNode(true), els = guideEls(clone);
    out[tab] = { guides: els.map(e => ({ key: e.getAttribute("data-guide-line") || "intro", text: norm(e.textContent) })) };
    els.forEach(e => e.remove());
    out[tab].text = norm(clone.textContent);
  };
  for (const tab of SECTIONS) { app.click(`[data-sec="${tab}"]`); grab(tab); }
  app.click("[data-menu-toggle]"); app.click("[data-admin]"); grab("admin");
  assert.deepEqual(app.errors, []);
  return { out, app };
}

// The rule or state half of each split paragraph: the code's own sentences, which stay with the switch off (never part of a line).
// [sentence, tab, archetype it needs (or null), state it needs: "empty" | null]
const KEPT = [
  ["A Stat moves everything worked out from it.", "trackers", null, null],
  ["Each once, in any order, when you meet what it asks.", "progression", null, null],
  ["Their numbers are yours, not the book's.", "character", "arcanist", null],
  ["TOL and WILL are worked out from other Stats, so they don't change here.", "admin", null, null],
  ["No sessions yet.", "progression", null, "empty"],
  ["Nothing yet.", "progression", null, "empty"],
  ["It stays as it was at lock.", "admin", "writein", null],
  ["Anyone who took a hit rolls once for wear after the fight", "trackers", null, "full"],
  ["No body armor worn.", "trackers", null, "empty"],
  ["Peels back the most recent action", "progression", null, null],
  ["Burned is paid off.", "trackers", null, "full"],
  ["Buy-ups above the base of", "admin", null, null],
  ["Corrections only.", "admin", null, null],
];

test("K3: Guide lines off takes exactly the guide lines", () => {
  const lines = SG().lines || {}, drawn = new Set(), keptSeen = new Set();
  for (const [sentence] of KEPT) for (const [k, t] of Object.entries(lines)) assert.ok(!lineSaid(t).includes(sentence), `lines.${k} holds a rule or state sentence: ${sentence}`);
  assert.ok(Object.keys(lines).length > 0, "sheetGuide.lines is empty");
  for (const arch of ["professional", "arcanist", "vampire", "werewolf", "writein"]) for (const full of [true, false]) {
    const on = k3Read(arch, full, false).out, off = k3Read(arch, full, true).out;
    for (const tab of Object.keys(on)) {
      const where = `${arch} ${full ? "full" : "empty"} ${tab}`;
      assert.equal(off[tab].guides.length, 0, `${where}: a guide line is drawn with the switch off`);
      assert.equal(off[tab].text, on[tab].text, `${where}: more than the guide lines changed`);
      for (const [sentence, kt, ka, ks] of KEPT) if (kt === tab && (!ka || ka === arch) && (ks === "empty" ? !full : ks === "full" ? full : true)) {
        assert.ok(off[tab].text.includes(sentence), `${where}: "${sentence}" went with the guide lines`);
        keptSeen.add(sentence);
      }
      for (const g of on[tab].guides) {
        if (g.key === "intro") continue;
        assert.ok(lines[g.key], `${where}: ${g.key} is no sheetGuide line`);
        assert.equal(g.text, lineSaid(lines[g.key]), `${where}: ${g.key} reads differently from its data`);
        drawn.add(g.key);
      }
    }
  }
  // The Train a Skill dialog holds one line (its results, Decision 298); it hides the same way.
  for (const off of [false, true]) {
    const app = openSheet(k3Char("professional", true), "progression", off ? { storage: { [SGUIDE]: "off" } } : {});
    app.click("[data-trainopen]");
    const t = norm(app.$("#modal").textContent);
    assert.ok(t.includes("Training sharpens a Skill you already have."), "the rule left with the guide line");
    assert.equal(t.includes(lineSaid(lines.trainLearnFirst || "?")), !off, `trainLearnFirst ${off ? "shows" : "is missing"}`);
    if (!off) drawn.add("trainLearnFirst");
  }
  assert.deepEqual(Object.keys(lines).filter(k => !drawn.has(k)).sort(), [], "a guide line the matrix never draws");
  assert.deepEqual(KEPT.map(k => k[0]).filter(x => !keptSeen.has(x)), [], "a kept sentence the matrix never reads");
});

test("K3: a line's tab button goes to the tab", () => {
  const app = sheet("character");
  assert.ok(app.$(`#main [data-guide-line] [data-gotab="loadout"]`), "no Loadout button in What you carry is on Loadout");
  app.click(`#main [data-guide-line] [data-gotab="loadout"]`);
  assert.equal(app.window.eval("S.section"), "loadout");
  app.click('[data-sec="character"]');
  app.click(`#main [data-guide-line] [data-gotab="trackers"]`);
  assert.equal(app.window.eval("S.section"), "trackers");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  assert.ok(app.$('#main [data-guide-line="tolWillWhere"] [data-gotab="trackers"]'), "Admin's TOL and WILL line has no Trackers button");
  app.click('#main [data-guide-line="tolWillWhere"] [data-gotab="trackers"]');
  assert.equal(app.window.eval("S.section"), "trackers");
  assert.deepEqual(app.errors, []);
});

test("K3: sheetLine is total, and a seat or a switch that's off draws nothing", () => {
  const app = sheet("main");
  const ev = x => app.window.eval(x);
  assert.equal(ev(`sheetLine("noSuchKey")`), "");
  assert.doesNotThrow(() => ev(`sheetLine(null)`));
  ev(`D.sheetGuide.lines.__t = "Go to {tab:nowhere} or {tab:loadout}."; D.sheetGuide.lines.__n = 5`);
  assert.match(ev(`sheetLine("__t")`), /Go to \{tab:nowhere\} or <button[^>]*data-gotab="loadout"/);
  assert.equal(ev(`sheetLine("__n")`), "");
  ev(`S.screen="table"`);
  assert.equal(ev(`sheetLine("__t")`), "", "a seat drew a line");
  ev(`S.screen="sheet"`);
  app.window.localStorage.setItem(SGUIDE, "off");
  assert.equal(ev(`sheetLine("__t")`), "", "the switch was ignored");
});
