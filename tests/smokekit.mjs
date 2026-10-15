/**
 * Shared helpers for the smoke-*.test.mjs files: the jsdom end-to-end tests,
 * split by area so node --test runs them in parallel. A helper lives here once
 * a second file uses it; one only its own section needs stays with it.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot, loadEngine, stored } from "./harness.mjs";
import { syntheticPack, PACK_ID } from "./packfixture.mjs";

export const { Engine, D } = loadEngine();

export function lockedCharacter() {
  const ch = Engine.newCharacter();
  ch.identity.name = "Test Subject";
  ch.identity.archetype = "arcanist";
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 5;
  ch.creation.locked = true;
  return ch;
}

/** Drop a draft character on the Archetype step and open the wizard there. */
export function onArchetypeStep(archetype, powerLevel = D.powerLevels[0].id) {
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = archetype;
  ch.creation.powerLevel = powerLevel;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 8;
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("archetype"), maxReached: steps.length - 1 } } });
  const resume = app.$$("#main button").find(b => /Resume draft/.test(b.textContent));
  resume.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  return app;
}

// The wizard on any step, from a draft (Decision 215 reaches the CP step too).
export function onStep(archetype, powerLevel, stepId, mutate = () => {}) {
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = archetype;
  ch.creation.powerLevel = powerLevel;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 8;
  mutate(ch);
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf(stepId), maxReached: steps.length - 1 } } });
  const resume = app.$$("#main button").find(b => /Resume draft/.test(b.textContent));
  resume.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  return app;
}

// Decision 214: CRANK is behind a switch, off; its tests boot with it on.
export const CRANK_ON = { "shadows.feature.crank": "on" };

export function openSheet(ch, section, opts = {}) {
  const app = boot({ ...opts, storage: { "shadows.active.v1": { ch, section }, ...(opts.storage || {}) } });
  const open = app.$$("#main button").find(b => /Open sheet/.test(b.textContent));
  open.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  app.click(`[data-sec="${section}"]`);
  return app;
}

export const activeChar = app => stored(app, { locked: true });

// W4: the catalog is a modal. Open it and press a row's Add or Buy.
export function pickFromCatalog(app, kind, id, how = "add") {
  app.click(`[data-lobrowse="${kind}"]`);
  const b = app.$(`#modal [data-cat${how}="${id}"]`);
  assert.ok(b, `${id} isn't in the ${kind} catalog`);
  return b;
}

// The picker is a modal since Decision 111.
export function search(app, q) {
  const box = app.$("#modal [data-spellq]");
  box.value = q; box.dispatchEvent(new app.window.Event("input"));
}

export const clickIn = (app, el) => el.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));

export function arcanistOnCP(setup) {
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = "arcanist";
  ch.creation.powerLevel = "street";                                   // Evocation starts at 1
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 5;
  if (setup) setup(ch);
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf("character-points"), maxReached: steps.length } } });
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
     .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  return app;
}

export const draft = app => stored(app, { locked: false });

// Import goes through the real file input and FileReader; downloads are
// caught at URL.createObjectURL, which jsdom doesn't implement.
export function withDownloads(app) {
  const got = [];
  app.window.URL.createObjectURL = blob => { got.push(blob); return "blob:shadows-test"; };
  app.window.URL.revokeObjectURL = () => {};
  return got;
}

export async function importFile(app, ch) {
  const input = app.$("#file-import");
  const file = new app.window.File([JSON.stringify(ch)], "x.shadows.json", { type: "application/json" });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new app.window.Event("change"));
  for (let i = 0; i < 50 && !app.$("#modal[open]") && app.window.eval("S.screen") === "home"; i++) await new Promise(r => setTimeout(r, 10));
}

export const named = (name, extra = {}) => Object.assign(lockedCharacter(), { identity: Object.assign(lockedCharacter().identity, { name }) }, extra);

export const charKeys = app => {
  const ls = app.window.localStorage, out = [];
  for (let i = 0; i < ls.length; i++) if (ls.key(i).startsWith("shadows.char.v1.")) out.push(ls.key(i));
  return out;
};

export const card = (app, name) => app.$$("#main .roster-card").find(c => c.querySelector(".roster-name").textContent === name);

export const sheetHome = app => { app.click("[data-menu-toggle]"); app.click("[data-home]"); };

// The engine tests prove the engine reads each number. These prove the
// screens do too: change the number in the booted app's own data, and what
// the wizard and sheet draw follows it. A value typed into the UI beside the
// data (the 6 CP, INT · COOL · EMP) passes every other test while the data
// happens to agree with it.
export function draftOn(archetype, stepId, tweak) {
  const steps = D.creationFlow.steps.map(s => s.id);
  const ch = Engine.newCharacter();
  ch.identity.name = "Probe";
  ch.identity.archetype = archetype;
  ch.creation.powerLevel = D.powerLevels[0].id;
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 1000 };
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 5;
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: steps.indexOf(stepId), maxReached: steps.length - 1 } } });
  if (tweak) tweak(app.D);
  app.$$("#main button").find(b => /Resume draft/.test(b.textContent))
    .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  return app;
}

export const tip = app => app.$("#tip");

export const tipShown = app => tip(app) && !tip(app).hidden ? tip(app).textContent : "";

export const wizCss = () => readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");

export function writtenInCharacter() {
  const ch = lockedCharacter();
  ch.identity.archetype = D.archetypes.find(a => a.writeIn).id;
  Object.assign(ch.archetypeChoices.writeIn, { name: "Changeling", description: "Stolen as a child.",
    classification: "other", classificationText: "Fae", mechanics: ["sfr"],
    traits: [{ name: "Glamour", description: "Looks like whoever you expect." }],
    vulnerabilities: [{ name: "Cold iron", description: "Burns." }] });
  Engine.newPower(ch);
  Object.assign(ch.powers[0], { name: "Fade", uses: "SFR", effect: "Unseen for a round." });
  ch.progression.ip.earned = 30;
  return ch;
}

export const focused = app => app.window.document.activeElement;

export const GM_ON = { "shadows.feature.gm": "on" };

export const tableKeys = app => {
  const ls = app.window.localStorage, out = [];
  for (let i = 0; i < ls.length; i++) if (ls.key(i).startsWith("shadows.table.v1.")) out.push(ls.key(i));
  return out;
};

export const tableCard = (app, name) => app.$$("#main .tables .roster-card").find(c => c.querySelector(".roster-name").textContent === name);

export const seedTable = (name, extra = {}) => {
  const t = Engine.newTable(name);
  Object.assign(t.meta, extra);
  return [t, { ["shadows.table.v1." + t.meta.id]: { table: t, section: "notes", changed: "2026-10-05T10:00:00.000Z", exported: null } }];
};

export const type = (app, sel, value) => {
  const el = app.$(sel);
  el.value = value;
  el.dispatchEvent(new app.window.Event("input", { bubbles: true }));
};

// A new table opens on Sessions (Decision 204). Most tests are about the Cast and
// below, so this goes on to Cast; `stay` keeps the table where it opened.
export const runTable = (app, name, { stay = false } = {}) => {
  app.click("#btn-run-table");
  app.$("#tbl-name").value = name;
  app.click("#modal [data-nameyes]");
  if (!stay) app.click('[data-tsec="cast"]');
};

export const notesTab = app => app.click('[data-tsec="notes"]');

export const tableHome = app => { app.click("[data-menu-toggle]"); app.click("[data-thome]"); };

export const tableFile = async blob => JSON.parse(await blob.text());

// A synthetic NPC only: Dez, a courier. Nothing here is the Codex's.
export const keyIn = (app, sel, k) => app.$(sel).dispatchEvent(new app.window.KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

export const castAdd = (app, name, line = "") => {
  type(app, "[data-cadd-name]", name); type(app, "[data-cadd-line]", line);
  keyIn(app, "[data-cadd-name]", "Enter");
};

export const pick = (app, sel, value) => { const el = app.$(sel); el.value = value; el.dispatchEvent(new app.window.Event("change", { bubbles: true })); };

export const packStored = (pack = syntheticPack(), imported = "2026-10-05T10:00:00.000Z") =>
  ({ ["shadows.pack.v1." + pack.meta.id]: { pack: Engine.migratePack(pack), imported } });

export const threatsTab = app => app.click('[data-tsec="threats"]');

// A table with the pack slotted in, open on its Threats tab.
export const tableWithPack = (pack = syntheticPack()) => {
  const app = boot({ storage: { ...GM_ON, ...packStored(pack) } });
  runTable(app, "Pier night");
  threatsTab(app);
  return app;
};

export const entryButton = (app, id) => app.$(`[data-tentry="${PACK_ID}|${id}"]`);

export function lockedVampire(bloodline = "draugur") {
  const ch = lockedCharacter();
  ch.identity.archetype = "vampire";
  ch.creation.powerLevel = "heroic";
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 6;
  ch.archetypeChoices.specialization = [bloodline];
  ch.archetypeChoices.basePowers = { "battleborn-instinct": 2, "odins-aegis": 1 };
  ch.archetypeChoices.powerCp = { "bestial-blessings": 1 };
  ch.archetypeChoices.optionPicks = { "ancient-weapon": "blade", code: { hunt: "Only the guilty", bond: "The crew", word: "Kept" } };
  return ch;
}

export const fill = (app, sel, v) => { const el = app.$(sel); assert.ok(el, `no ${sel}`); el.value = v; el.dispatchEvent(new app.window.Event("input", { bubbles: true })); };
