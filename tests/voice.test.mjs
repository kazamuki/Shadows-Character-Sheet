/**
 * Voice enforcement — maintainer content must not reach a player.
 *
 * The app was built to be demonstrated, so it narrated its own roadmap:
 * "Session tracking arrives in Phase 3", "this archetype ships as TBD", a
 * literal "F14 — pending a ruling from D." Separately, `flagNote` is written
 * for Ken and Deighton — flag ids, data-file field paths — and the app
 * rendered it verbatim to whoever was making a character.
 *
 * Batch 2 split the audiences (Decision 70) and moved state copy into
 * `appCopy` (Decision 71). This file is what stops it coming back: it renders
 * the whole app and reads every string a player can see.
 *
 * If you are here because this test failed, you have not broken a style rule —
 * you have shipped a maintainer note to a player. See docs/VOICE-APP.md.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, loadEngine } from "./harness.mjs";

const { Engine, D } = loadEngine();

function lockedCharacter() {
  const ch = Engine.newCharacter();
  ch.identity.name = "Test Subject";
  ch.identity.archetype = "arcanist";
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 5;
  ch.creation.locked = true;
  return ch;
}

/**
 * Visible text only. The single-file build inlines shadows-data.js into a
 * <script> tag, and `body.textContent` happily returns the entire game data —
 * which made the first version of this test "fail" on notes nobody could see.
 * Strip script/style, then read.
 */
function visibleText(app) {
  const clone = app.doc.body.cloneNode(true);
  for (const el of [...clone.querySelectorAll("script, style")]) el.remove();
  return clone.textContent;
}

/** Every string a player can read: all nine sheet tabs, plus each wizard step. */
function renderedCorpus() {
  const parts = [];

  const sheet = boot({ storage: { "shadows.active.v1": { ch: lockedCharacter(), section: "main" } } });
  const open = sheet.$$("#main button").find(b => /Open sheet/.test(b.textContent));
  open.dispatchEvent(new sheet.window.MouseEvent("click", { bubbles: true }));
  for (const id of sheet.$$("[data-sec]").map(t => t.dataset.sec)) {
    sheet.click(`[data-sec="${id}"]`);
    parts.push(visibleText(sheet));
  }

  // Wizard: resume a draft parked on each step in turn. Every archetype gets a
  // pass, because the draft/tbd copy only renders for the unfinished ones.
  for (const arch of D.archetypes) {
    for (let step = 0; step < D.creationFlow.steps.length + 1; step++) {
      const ch = Engine.newCharacter();
      ch.identity.name = "Vex";        // never a status word — see the check below
      ch.identity.archetype = arch.id;
      ch.creation.powerLevel = D.powerLevels[0].id;
      ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
      const app = boot({ storage: { "shadows.draft.v1": { ch, step, maxReached: step } } });
      const resume = app.$("#btn-resume");
      if (!resume) continue;
      resume.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
      parts.push(visibleText(app));
    }
  }
  return parts.join("\n");
}

const CORPUS = renderedCorpus();

test("the corpus actually rendered something", () => {
  // Guards the guard: if boot silently failed, every assertion below passes.
  assert.ok(CORPUS.length > 20000, `corpus is only ${CORPUS.length} chars — did the app render?`);
  // ...and that it is RENDERED text, not the inlined data script.
  assert.ok(!CORPUS.includes("SHADOWS_DATA"), "corpus still contains script source");
  assert.match(CORPUS, /Intake Ledger/);
  assert.match(CORPUS, /NYTE CITY REGISTRY/);
});

test("no flagNote reaches a player (Decision 70)", () => {
  // flagNote is maintainer text by definition. Collect every one in the data
  // and prove none of it is on screen. playerNote is what renders instead.
  const notes = [];
  (function walk(o) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) return o.forEach(walk);
    if (typeof o.flagNote === "string") notes.push(o.flagNote);
    for (const k of Object.keys(o)) walk(o[k]);
  })(D);
  assert.ok(notes.length > 5, `expected the flag notes to still exist, found ${notes.length}`);

  const leaked = notes.filter(n => CORPUS.includes(n.slice(0, 40)));
  assert.deepEqual(leaked.map(n => n.slice(0, 60)), [],
    "a maintainer flagNote is rendering — pass the entry to flagHtml, not the note");
});

test("the app never narrates its own build state", () => {
  // Roadmap language aimed at a player. These are the exact shapes that were
  // in the file: a phase number, release vocabulary, an internal shorthand.
  const banned = [
    [/\bPhase \d/i,            'a phase number ("arrives in Phase 3")'],
    [/\bships as\b/i,          'release vocabulary ("ships as TBD")'],
    [/\bcoming soon\b/i,       '"coming soon" — the app promises nothing about its future'],
    [/\bconfirm with D\b/i,    '"confirm with D" — a player does not know who D is'],
    [/\bflagged for D\b/i,     '"flagged for D"'],
    [/\bDesign flag\b/i,       '"Design flag" — designer vocabulary'],
    [/\bpending a ruling\b/i,  '"pending a ruling"'],
    [/\bstubbed\b/i,           '"stubbed"'],
    [/\bWIP\b/,                '"WIP"'],
    [/\bTBD\b/,                '"TBD"'],
    [/\bF\d{1,2}:/,            'an internal flag id ("F14:")'],
  ];
  const found = banned.filter(([re]) => re.test(CORPUS)).map(([re, why]) => {
    const m = re.exec(CORPUS);
    const at = CORPUS.slice(Math.max(0, m.index - 60), m.index + 60).replace(/\s+/g, " ");
    return `${why} — …${at}…`;
  });
  assert.deepEqual(found, []);
});

test("state copy lives in appCopy, so the voice is a data edit (Decision 71)", () => {
  for (const k of ["unsettledLabel", "unsettledRule", "statusLabel",
                   "specializationUnwritten", "applyFromText", "ranksAdvanceInPlay"]) {
    assert.ok(D.appCopy[k], `appCopy.${k} is missing`);
  }
  // A raw status must never be what the player reads.
  for (const s of ["draft", "tbd"]) {
    assert.ok(D.appCopy.statusLabel[s], `appCopy.statusLabel.${s} is missing`);
    assert.notEqual(D.appCopy.statusLabel[s], s, `statusLabel.${s} still shows the raw status`);
  }
  // The fallback has to carry the whole job when an entry has no playerNote.
  assert.match(CORPUS, new RegExp(D.appCopy.unsettledLabel));

  const inUse = new Set(D.archetypes.map(a => a.status).filter(s => s !== "final"));
  assert.ok(inUse.size > 0, "no unfinished archetypes left to check");
  for (const s of inUse) assert.ok(CORPUS.includes(D.appCopy.statusLabel[s]));
});

test("no element renders a raw status as its own text", () => {
  // Corpus scanning cannot catch this: three sites render a status badge, so
  // reverting one still leaves the labels on screen, and banning the bare word
  // "draft" would fire on the home screen's legitimate "Resume draft". Check
  // the DOM instead — a LEAF element whose entire text is a raw status is a
  // badge that stopped going through statusLabel().
  const raw = new Set(Object.keys(D.appCopy.statusLabel));
  const offenders = [];

  const scan = app => {
    for (const el of [...app.doc.querySelectorAll("body *")]) {
      if (el.children.length) continue;                       // leaves only
      const t = (el.textContent || "").trim().toLowerCase();
      if (raw.has(t)) offenders.push(`<${el.tagName.toLowerCase()} class="${el.className}">${t}`);
    }
  };

  for (const arch of ["cyborg", "arcanist"]) {
    const ch = Engine.newCharacter();
    // NOT "Draft" — the character's own name renders in the header and vitals,
    // and would trip the raw-status check below on its own fixture.
    ch.identity.name = "Vex"; ch.identity.archetype = arch;
    ch.creation.powerLevel = D.powerLevels[0].id;
    ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
    const w = boot({ storage: { "shadows.draft.v1": { ch, step: 3, maxReached: 7 } } });
    w.$("#btn-resume").dispatchEvent(new w.window.MouseEvent("click", { bubbles: true }));
    scan(w);

    const locked = { ...JSON.parse(JSON.stringify(ch)) };
    for (const id of Object.keys(locked.stats)) locked.stats[id].base = 5;
    locked.creation.locked = true;
    const s = boot({ storage: { "shadows.active.v1": { ch: locked, section: "archetype" } } });
    const open = s.$$("#main button").find(b => /Open sheet/.test(b.textContent));
    open.dispatchEvent(new s.window.MouseEvent("click", { bubbles: true }));
    for (const sec of ["main", "archetype"]) { s.click(`[data-sec="${sec}"]`); scan(s); }
  }
  assert.deepEqual(offenders, [], "a status badge is printing the raw status instead of appCopy.statusLabel");
});

test("every flagged entry a player meets says something in voice", () => {
  // Not every flag needs its own playerNote — the appCopy fallback covers them.
  // What must never happen is a flagged entry rendering nothing at all.
  const flagged = [];
  (function walk(o, path) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) return o.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (o.flagged === true) flagged.push({ path, id: o.id || path, playerNote: o.playerNote });
    for (const k of Object.keys(o)) walk(o[k], path ? `${path}.${k}` : k);
  })(D, "");

  assert.ok(flagged.length > 0, "no flagged entries left — did a data edit clear them all?");
  for (const f of flagged) {
    if (f.playerNote === undefined) continue;                 // falls back, fine
    assert.equal(typeof f.playerNote, "string", `${f.id}: playerNote must be a string`);
    assert.ok(f.playerNote.length > 10, `${f.id}: playerNote is too short to say anything`);
    assert.doesNotMatch(f.playerNote, /\bF\d{1,2}\b|confirm with D|TBD|WIP|Phase \d/,
      `${f.id}: playerNote is written in maintainer voice`);
  }
});
