/**
 * A character file is untrusted input (B16, R9 — the 2026-09-24 audit).
 *
 * `.shadows.json` files are made to be handed around: a GM passes them out,
 * players swap them. The app renders by template into innerHTML, so a file
 * is only safe if every string it carries reaches the page escaped and every
 * number it carries is a number. The audit found both holes: Admin mode
 * wrote two ids into attributes raw, and a string stored where a count
 * belongs rode the engine's `+` as text and reached every tab as markup.
 * A crafted undo entry could also write onto Object.prototype.
 *
 * This file loads a character with a payload in every string, id and number
 * the schema has, through the same doors a player uses, and fails if a
 * single element the payload describes appears in the page.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, loadEngine } from "./harness.mjs";

const { Engine, D } = loadEngine();

// Breaks out of an attribute (either quote) and out of text. If it ever
// becomes markup, an <i data-pwn> lands in the DOM, named for its field.
const P = tag => `"'><i data-pwn="${tag}"></i>`;

// Decision 153: the write-in archetype draws the character's own words, so
// every rendering test runs once on it too.
const WRITE_IN = D.archetypes.find(a => a.writeIn).id;
const ARCHETYPES = ["arcanist", WRITE_IN];

function hostileCharacter({ locked = true, archetype = "arcanist" } = {}) {
  const ch = Engine.newCharacter();
  const handgun = D.weapons.find(w => w.category === "handguns").id;
  Object.assign(ch.identity, { name: P("name"), age: P("age"), build: P("build"), hair: P("hair"),
    eyes: P("eyes"), skin: P("skin"), history: P("history"), archetype });
  ch.creation.powerLevel = "heroic";
  ch.creation.rolls = { statPoints: P("roll.stat"), skillPoints: P("roll.skill"), credits: P("roll.credits") };
  ch.creation.boosts = [{ targetType: "stat", targetId: P("boost.target"), times: P("boost.times") }];
  ch.creation.locked = locked;
  for (const s of D.stats) ch.stats[s.id].base = 6;
  ch.stats.BOD.base = P("stat.base"); ch.stats.REF.ipe = P("stat.ipe");
  ch.archetypeChoices = { rolls: { focusStatBonus: P("roll.focus"), startingSpells: P("roll.spells") },
    focusAllocation: { INT: P("focus") }, statBonusAllocation: {}, specialization: [P("spec.id"), "aethereal-link"],
    focusedSkillPicks: [P("fskill")], naturalAdvantages: [{ id: P("natadv.id"), rank: P("natadv.rank") }],
    disciplines: { enchantment: P("disc") },
    writeIn: { name: P("wi.name"), description: P("wi.desc"), classification: P("wi.cls"), classificationText: P("wi.clstext"),
      mechanics: [P("wi.mech"), "sfr", "magic"], traits: [{ name: P("wi.trait"), description: P("wi.traitdesc") }],
      vulnerabilities: [{ name: P("wi.vul"), description: P("wi.vuldesc") }] } };
  ch.powers = [{ id: P("pw.id"), custom: true, name: P("pw.name"), uses: P("pw.uses"), effect: P("pw.effect"), notes: P("pw.notes") }];
  ch.skills = { athletics: { rank: P("skill.rank"), ipe: P("skill.ipe") }, [P("skill.id")]: { rank: 1, ipe: 0 },
    "martial-arts": { rank: 1, ipe: 0, selections: { style: [P("sel.style")] } } };
  ch.advantages = [{ id: P("adv.id"), rank: P("adv.rank"), notes: P("adv.notes") },
    { id: "favored-skill", rank: 1, notes: "a|b", selections: { skill: [P("sel.skill")] } }];
  ch.disadvantages = [{ id: P("dis.id"), rank: 1, notes: "" },
    { id: "paranoia", rank: P("dis.rank"), notes: P("dis.notes"), selections: { detail: P("sel.text") } }];
  Object.assign(ch.trackers, {
    damage: P("damage"), massiveLevels: P("massive"), witheringDamage: P("withering"),
    luck: { bonus: P("luck.bonus"), spent: P("luck.spent") }, san: { loss: P("san") }, sfr: { spent: P("sfr") },
    credits: { current: P("credits"), ledger: [{ date: P("cr.date"), amount: P("cr.amount"), note: P("cr.note") }] },
    crank: { rep: "lots", ledger: [{ date: P("crk.date"), amount: "5", note: P("crk.note") }] },
    adjustments: [{ target: P("adj.target"), amount: P("adj.amount"), note: P("adj.note"), date: P("adj.date") }],
    conditions: [{ id: P("cond.id") }, { id: "agonized", note: P("cond.note") },
      { id: "injured", location: P("cond.loc") }, { id: "dying", marks: P("marks") }],
    aberrations: [{ id: P("ab.id"), permanence: P("ab.perm") }, { id: "drained", permanence: "permanent", note: P("ab.note") }],
    panel: { "tol-spent": { value: P("panel") } },
  });
  ch.weapons = [
    { custom: true, name: P("w.name"), type: P("w.type"), damage: P("w.dmg"), rof: P("w.rof"), capacity: P("w.cap"),
      ammo: P("w.ammo"), features: P("w.feat"), notes: P("w.notes"), roundsSpent: P("w.rounds") },
    { id: P("w.id"), notes: P("w.notes2") },
    { id: handgun, notes: P("w.notes3"), mods: [P("w.mod")], roundsSpent: P("w.rounds2") }];
  ch.armor = [
    { custom: true, name: P("a.name"), prot: P("a.prot"), res: P("a.res"), integrity: P("a.int"), coverage: P("a.cov"),
      integrityLoss: P("a.loss"), notes: P("a.notes"), worn: true, scrapped: false, upgrades: [P("a.upg")] },
    { id: D.armor[0].id, integrityLoss: P("a.loss2"), notes: P("a.notes2"), worn: false, scrapped: false, upgrades: [P("a.upg2")] }];
  ch.gear = [{ custom: true, name: P("g.name"), type: P("g.type"), notes: P("g.notes") },
    { id: P("g.id"), qty: P("g.qty") }, { id: D.equipment[0].id, qty: P("g.qty2"), notes: P("g.notes2") }];
  ch.panelData = { grimoire: [
    { custom: true, "Spell Name": P("sp.name"), Discipline: P("sp.disc"), TN: P("sp.tn"), TH: P("sp.th"),
      Effect: P("sp.effect"), Overflow: P("sp.over"), Notes: P("sp.notes") },
    { spellId: P("sp.id"), stage: P("sp.stage"), notes: P("sp.notes2") },
    { spellId: "firebolt", stage: "known", notes: P("sp.notes3") }] };
  ch.progression = { ip: { earned: P("ip.earned"), log: [
      { date: P("ip.date"), kind: "spend", amount: P("ip.amount"), targetType: "skill", targetId: P("ip.target"),
        from: P("ip.from"), to: P("ip.to"), note: P("ip.note") },
      { date: P("ip.date2"), kind: "grant", amount: P("ip.amount2"), note: P("ip.note2") },
      { date: P("ip.date3"), kind: "spend", amount: 5, targetType: "power", targetId: P("ip.power"), name: P("ip.powername"), note: "" }] },
    milestonePoints: P("mp"),
    milestones: { minor: [{ id: P("minor.id"), date: P("minor.date") }], major: [{ id: P("major.id"), date: P("major.date") }] } };
  ch.sessions = [{ date: P("s.date"), title: P("s.title"), ipEarned: P("s.ip"), milestonePoint: true, notes: P("s.notes") }];
  ch.notes = P("notes");
  ch.audit = [
    { seq: P("audit.seq"), date: P("audit.date"), kind: P("audit.kind"), label: P("audit.label"),
      patch: [{ path: ["notes"], type: "scalar", before: "earlier notes" }] },
    // Crafted: undo would write onto Object.prototype. migrate() must drop it.
    { seq: 2, date: "2026-09-24", kind: "edit", label: "crafted", patch: [{ path: ["__proto__", "pwned"], type: "scalar", before: "yes" }] },
    // Crafted: a legal path restoring a string where a number lives.
    { seq: 3, date: "2026-09-24", kind: "edit", label: P("audit.label3"), patch: [{ path: ["trackers", "damage"], type: "scalar", before: P("undo.value") }] }];
  Object.assign(ch.meta, { gamedataVersion: P("meta.gdv"), created: P("meta.created"), updated: P("meta.updated") });
  return ch;
}

// The payload elements present right now, labelled with where they were seen.
function injected(app, where) {
  return app.$$("[data-pwn]").map(e => `${e.getAttribute("data-pwn")} @${where}`);
}
function closeOverlays(app) {
  const x = app.$("#modal[open] [data-modalclose]");
  if (x) x.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  const p = app.$("#vpop:not([hidden]) [data-popclose]");
  if (p) p.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
}

for (const archetype of ARCHETYPES)
test(`a hostile ${archetype} file renders as text on every tab, in Admin, in print and in every picker (B16, R9)`, () => {
  const app = boot({ storage: { "shadows.active.v1": { ch: hostileCharacter({ archetype }), section: "main" } } });
  app.window.print = () => {};
  const found = [];
  let overlays = 0;   // proof the pickers were reached, not just their tabs
  const visit = (where, act) => {
    act();
    found.push(...injected(app, where));
    if (app.$("#modal[open]") || app.$("#vpop:not([hidden])")) overlays++;
    closeOverlays(app);
  };

  // Home's roster card shows the saved file before anything opens it (Decision 141).
  found.push(...injected(app, "home"));
  assert.ok(app.$("#main .roster-card"), "the hostile character isn't on Home's roster");
  // Open sheet is the resume door; it runs migrate() like Import does.
  const open = app.$$("#main button").find(b => /Open sheet/.test(b.textContent));
  assert.ok(open, "the hostile character didn't reach the Home screen's Open sheet button");
  visit("open", () => open.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true })));

  for (const sec of app.$$("[data-sec]").map(b => b.dataset.sec)) {
    visit(sec, () => app.click(`[data-sec="${sec}"]`));
    // Every modal and popover this tab can open, one at a time.
    const openers = [...new Set(app.$$("#main [data-hitopen], #main [data-actopen], #main [data-lobrowse], #main [data-spellpickopen], #main [data-abpickopen], #main [data-vpop]")
      .map(b => [...b.attributes].find(a => /^data-(hitopen|actopen|lobrowse|spellpickopen|abpickopen|vpop)$/.test(a.name)))
      .map(a => `[${a.name}="${a.value}"]`))];
    for (const sel of openers) visit(`${sec} ${sel}`, () => { const b = app.$(`#main ${sel}`); if (b) app.click(`#main ${sel}`); });
  }
  visit("admin", () => { app.click("[data-menu-toggle]"); app.click("[data-admin]"); });
  visit("print", () => { app.click("[data-menu-toggle]"); app.click("[data-print]"); });
  visit("what's new", () => app.click("[data-whatsnew]"));

  assert.deepEqual(found, [], "file content became markup");
  assert.ok(overlays >= 10, `only ${overlays} modals and popovers opened — did an opener's attribute change?`);
  assert.deepEqual(app.errors, [], "the hostile file threw while rendering");
});

for (const archetype of ARCHETYPES)
test(`a hostile ${archetype} draft renders as text on every wizard step (R9)`, () => {
  const ch = hostileCharacter({ locked: false, archetype });
  const app = boot({ storage: { "shadows.draft.v1": { ch, step: 0, maxReached: D.creationFlow.steps.length } } });
  app.click("[data-open]");
  const found = [];
  for (let i = 0; i <= D.creationFlow.steps.length; i++) {
    app.click(`[data-goto="${i}"]`);
    found.push(...injected(app, `step ${i + 1}`));
  }
  assert.deepEqual(found, [], "draft content became markup in the wizard");
  assert.deepEqual(app.errors, [], "the hostile draft threw while rendering");
});

test("migrate() reads every stored number as a number, and drops an undo entry that walks off the character (B16)", () => {
  const c = Engine.migrate(hostileCharacter());
  const numbers = {
    "stats.BOD.base": c.stats.BOD.base, "stats.REF.ipe": c.stats.REF.ipe, "skills.athletics.rank": c.skills.athletics.rank,
    "advantages[0].rank": c.advantages[0].rank, "disadvantages[1].rank": c.disadvantages[1].rank,
    "trackers.damage": c.trackers.damage, "luck.bonus": c.trackers.luck.bonus, "san.loss": c.trackers.san.loss,
    "credits.current": c.trackers.credits.current, "ledger.amount": c.trackers.credits.ledger[0].amount,
    "crank.rep": c.trackers.crank.rep, "crank.ledger.amount": c.trackers.crank.ledger[0].amount,
    "adjustments.amount": c.trackers.adjustments[0].amount, "panel.value": c.trackers.panel["tol-spent"].value,
    "ip.earned": c.progression.ip.earned, "ip.log.amount": c.progression.ip.log[0].amount,
    "milestonePoints": c.progression.milestonePoints, "sessions.ipEarned": c.sessions[0].ipEarned,
    "focusAllocation.INT": c.archetypeChoices.focusAllocation.INT, "boosts.times": c.creation.boosts[0].times,
    "weapons.roundsSpent": c.weapons[0].roundsSpent, "armor.integrityLoss": c.armor[0].integrityLoss,
  };
  const bad = Object.entries(numbers).filter(([, v]) => typeof v !== "number" || !Number.isFinite(v)).map(([k, v]) => `${k} = ${JSON.stringify(v)}`);
  assert.deepEqual(bad, [], "a stored number survived migrate() as something else");
  assert.equal(c.creation.rolls.statPoints, null, "an unreadable roll should read as not entered");
  assert.equal(c.identity.age, null, "an unreadable age should read as blank");
  assert.ok(!c.audit.some(e => e.label === "crafted"), "migrate() kept an undo entry whose path leaves the character");

  // A plain numeric string is the number it spells, not a default.
  const s = Engine.newCharacter();
  s.trackers.credits.current = "1200"; s.stats.BOD.base = "7";
  const m = Engine.migrate(s);
  assert.equal(m.trackers.credits.current, 1200);
  assert.equal(m.stats.BOD.base, 7);
  assert.equal(Engine.statValue(m, "BOD"), 7, "\"7\" + 0 would have been \"70\"");
});

test("undo never writes through a prototype, and what it restores is held to the same numbers (B16)", () => {
  const ch = Engine.migrate(Engine.newCharacter());
  ch.audit.push({ seq: 1, date: "x", kind: "edit", label: "crafted",
    patch: [{ path: ["__proto__", "pwned"], type: "scalar", before: "yes" }, { path: ["constructor", "prototype", "pwned"], type: "scalar", before: "yes" }] });
  Engine.undoLastAction(ch);
  assert.equal(Engine.newCharacter().pwned, undefined, "undo wrote onto Object.prototype");

  ch.audit.push({ seq: 2, date: "x", kind: "edit", label: "crafted",
    patch: [{ path: ["trackers", "damage"], type: "scalar", before: "<i>9</i>" }, { path: ["no", "such", "path"], type: "scalar", before: 1 }] });
  const r = Engine.undoLastAction(ch);
  assert.equal(r.ok, true, "a patch through a missing link should be skipped, not thrown");
  assert.equal(ch.trackers.damage, 0, "undo restored a string where damage is a number");
});

test("Admin edits the row it drew: a purchased copy beside a free one, and a row whose id isn't in the data (B16, A11)", () => {
  const ch = Engine.newCharacter();
  ch.identity.name = "Admin Test"; ch.identity.archetype = "professional"; ch.creation.powerLevel = "heroic";
  ch.creation.rolls = { statPoints: 40, skillPoints: 30, credits: 10 };
  for (const s of D.stats) ch.stats[s.id].base = 6;
  ch.creation.locked = true;
  ch.advantages = [{ id: "favored-skill", rank: 1, notes: "", source: "natural" }, { id: "favored-skill", rank: 1, notes: "" },
    { id: P("adv.id"), rank: 1, notes: "a|b" }];
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "main" } } });
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent)).click();
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  // Spread into this realm: an array made in jsdom never deepEquals a local one.
  const live = () => [...app.window.eval("S.ch").advantages].map(a => `${a.source || a.notes || "-"}:${a.rank}`);

  app.click('[data-admin-adv="1|1"]');
  assert.deepEqual(live().slice(0, 2), ["natural:1", "-:2"], "+ on the purchased row changed the wrong copy");
  app.click('[data-admin-adv="2|1"]');
  assert.equal(live()[2], "a|b:2", "+ on a row whose notes hold a | did nothing");
  app.click('[data-admin-adv="0|x"]');
  assert.deepEqual(live(), ["-:2", "a|b:2"], "remove took the wrong row");
  assert.deepEqual(injected(app, "admin"), [], "an unknown advantage id became markup");
  assert.deepEqual(app.errors, []);
});

test("a hostile CRANK tracker reads as numbers and a list (Decision 169)", () => {
  const c = Engine.migrate(hostileCharacter());
  assert.equal(c.trackers.crank.rep, 0, "\"lots\" should read as 0");
  assert.equal(c.trackers.crank.ledger[0].amount, 5, "\"5\" is the number it spells");
  assert.equal(typeof c.trackers.crank.ledger[0].note, "string");
  const s = Engine.migrate({ trackers: { crank: { rep: "7", ledger: "none" } } });
  assert.deepEqual([s.trackers.crank.rep, s.trackers.crank.ledger.length], [7, 0], "a non-array ledger should read as empty");
  assert.equal(Engine.crankState(Engine.migrate({ trackers: { crank: "lots" } })).rep, 0);
});

// ── A table file is untrusted too (Decisions 170, 124) ──────────────────
function hostileTable() {
  const t = Engine.newTable(P("tbl.name"));
  Object.assign(t.meta, { created: P("tbl.created"), updated: P("tbl.updated") });
  t.notes = [
    { id: P("note.id"), title: P("note.title"), text: P("note.text"), created: P("note.created"), updated: P("note.updated") },
    { id: "N-ABCDEFGH", title: P("note2.title"), text: P("note2.text") },
    null, 5, "x", { title: 7, text: {} },
  ];
  t.cast = [{ name: P("future.cast") }];
  return t;
}

test("a hostile table file renders as text on Home, the table screen and both modals, and pollutes nothing (Decisions 124, 170)", async () => {
  const t = hostileTable();
  const key = "shadows.table.v1." + t.meta.id;
  const app = boot({ storage: { "shadows.feature.gm": "on", [key]: { table: t, section: "notes", changed: "2026-10-05T10:00:00.000Z", exported: null } } });
  const found = [];
  found.push(...injected(app, "Home"));
  assert.ok(app.$("#main .tables .roster-card"), "the hostile table isn't on Home");
  app.$("[data-topen]").click();
  assert.equal(app.window.eval("S.screen"), "table");
  found.push(...injected(app, "the table screen"));
  assert.equal(app.doc.title, `${P("tbl.name")} — Shadows`, "the window's title isn't the name as text");
  assert.equal(app.$("#brandctx").textContent, P("tbl.name"));
  assert.ok(app.$$("[data-note]").length >= 3, "the notes weren't drawn");
  // A note whose text was an object or a number reads as empty text, not as its String().
  assert.ok(app.$$("[data-ntext]").every(el => el.value !== "[object Object]" && el.value !== "7"), "a non-string note field wasn't read as text");
  assert.ok(!app.$("#main").innerHTML.includes("[object Object]"), "a note field drew an object as text");
  app.click("[data-menu-toggle]"); app.click("[data-trename]");
  found.push(...injected(app, "the Rename modal"));
  app.click("#modal [data-modalclose]");
  app.$("[data-ndel]").click();
  found.push(...injected(app, "the Delete modal"));
  app.click("#modal [data-modalclose]");
  app.click("[data-menu-toggle]"); app.click("[data-thome]");
  app.$("[data-tremove]").click();
  found.push(...injected(app, "the Remove modal"));
  app.click("#modal [data-modalclose]");
  assert.deepEqual(found, [], "a table's text became markup");
  assert.deepEqual(app.errors, [], "the hostile table threw while rendering");

  // The same table through Import, with a __proto__ key in it.
  const raw = JSON.stringify(t).replace(/^\{/, '{"__proto__":{"pwn":1},');
  const imp = boot({ storage: { "shadows.feature.gm": "on" } });
  const input = imp.$("#file-import");
  const file = new imp.window.File([raw], "x.shadows-table.json", { type: "application/json" });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new imp.window.Event("change"));
  for (let i = 0; i < 50 && imp.window.eval("S.screen") === "home"; i++) await new Promise(r => setTimeout(r, 10));
  assert.equal(imp.window.eval("S.screen"), "table", "the hostile table didn't open");
  assert.deepEqual(injected(imp, "an imported table"), []);
  assert.equal(({}).pwn, undefined);
  assert.equal(imp.window.eval("({}).pwn"), undefined, "the page's Object.prototype was polluted");
  assert.deepEqual(imp.errors, []);
});
