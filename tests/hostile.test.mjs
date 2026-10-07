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
  t.cast = [{ id: "C-ABCDEFGH", name: P("future.cast"), affiliations: [P("future.aff"), 5, " "] }];
  t.interactions = [
    { id: P("int.id"), kind: P("int.kind"), cast: [{ kind: "cast", id: "C-ABCDEFGH" }, { kind: "cast", id: "C-ZZZZZZZZ", name: P("int.linkname") }],
      crew: [P("int.crew"), 5], text: P("int.text"), date: P("int.date"), created: P("int.created") },
    { kind: "shared", cast: [{ kind: "cast", id: "C-ABCDEFGH", name: { x: 1 } }, { kind: "place", id: "C-ABCDEFGH" }], crew: P("int2.crew"), text: P("int2.text"), date: "2026-10-05" },
    null, 5, "x",
  ];
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

// ── A table's cast is untrusted too (Decisions 174–176, 124) ────────────
test("a hostile cast renders as text in the list, a member's page and the Delete question, and every number comes out a number or blank", () => {
  const t = Engine.newTable(P("tbl.name"));
  const stats = {}; for (const s of D.stats) stats[s.id] = P("stat." + s.id);
  const text = {}; for (const k of ["name", "flavor", "description", "origin", "enemyRole", "motivation", "resources", "line", "ifPushed", "gmNote"]) text[k] = P("cast." + k);
  t.cast = [
    { id: P("cast.id"), ...text, npcRoles: [P("cast.role"), 5, null], tier: P("cast.tier"), status: P("cast.status"),
      block: { stats, authored: { TOL: P("auth.TOL"), WILL: { x: 1 } },
               skills: [{ name: P("skill.name"), total: P("skill.total"), skill: P("skill.id") }, null, 7],
               armor: [P("armor.line"), 5], gear: [P("gear.line")], traits: [{ name: P("trait.name"), text: P("trait.text") }, "x"] },
      created: P("cast.created"), updated: P("cast.updated") },
    null, 5, "x", { name: 7, block: "x", tier: { a: 1 } },
  ];
  const key = "shadows.table.v1." + t.meta.id;
  const app = boot({ storage: { "shadows.feature.gm": "on", [key]: { table: t, section: "cast", changed: "2026-10-05T10:00:00.000Z", exported: null } } });
  const found = [];
  app.$("[data-topen]").click();
  assert.equal(app.window.eval("S.tsection"), "cast");
  found.push(...injected(app, "the Cast list"));
  assert.ok(app.$$("[data-ccard]").length >= 2, "the hostile cast wasn't drawn");
  assert.ok(!app.$("#main").innerHTML.includes("[object Object]"), "the list drew an object as text");
  app.$("[data-copen]").click();
  found.push(...injected(app, "a member's page"));
  assert.ok(app.$$("[data-cstat]").length > 0);
  for (const el of app.$$("#main input[type=number]")) assert.ok(el.value === "" || Number.isFinite(Number(el.value)), `a number field read ${el.value}`);
  assert.ok(app.$$("[data-cstat]").every(el => el.value === ""), "a payload string became a stat");
  assert.ok(!app.$("#main").innerHTML.includes("[object Object]"), "the page drew an object as text");
  app.click("[data-cdel]");
  found.push(...injected(app, "the Delete question"));
  app.click("#modal [data-modalclose]");
  assert.deepEqual(found, [], "a cast member's text became markup");
  assert.deepEqual(app.errors, [], "the hostile cast threw while rendering");
});

test("a cast file with __proto__ keys at every level pollutes nothing on import", async () => {
  const raw = '{"__proto__":{"pwn":1},"meta":{"kind":"shadows-table"},"cast":[{"__proto__":{"pwn":1},"name":"x","block":{"__proto__":{"pwn":1},"stats":{"__proto__":{"pwn":1}},"authored":{"__proto__":{"pwn":1}},"skills":[{"__proto__":{"pwn":1}}],"traits":[{"__proto__":{"pwn":1}}]}}]}';
  const imp = boot({ storage: { "shadows.feature.gm": "on" } });
  const input = imp.$("#file-import");
  const file = new imp.window.File([raw], "x.shadows-table.json", { type: "application/json" });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  input.dispatchEvent(new imp.window.Event("change"));
  for (let i = 0; i < 50 && imp.window.eval("S.screen") === "home"; i++) await new Promise(r => setTimeout(r, 10));
  assert.equal(imp.window.eval("S.screen"), "table");
  imp.$("[data-copen]").click();
  assert.equal(({}).pwn, undefined);
  assert.equal(imp.window.eval("({}).pwn"), undefined, "the page's Object.prototype was polluted");
  assert.deepEqual(imp.errors, []);
});

// ── Interactions and affiliations are untrusted too (Decisions 177–179, 124) ──
test("hostile interactions and affiliations render as text on a member's page, the filtered Cast list and Who knows what, and every kind, date and link comes out valid or blank", () => {
  const t = hostileTable();
  const key = "shadows.table.v1." + t.meta.id;
  const app = boot({ storage: { "shadows.feature.gm": "on", [key]: { table: t, section: "cast", changed: "2026-10-05T10:00:00.000Z", exported: null } } });
  const found = [];
  app.$("[data-topen]").click();
  assert.equal(app.window.eval("S.tsection"), "cast");
  found.push(...injected(app, "the Cast list"));
  const aff = app.$("[data-caff]");
  assert.equal(aff.options.length, 2, "the payload wasn't the one affiliation offered");
  aff.value = aff.options[1].value;
  aff.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(app.$$("[data-ccard]").length, 1, "the affiliation filter didn't narrow the list");
  found.push(...injected(app, "the Cast list with an affiliation chosen"));
  app.click('[data-cview="crew"]');
  assert.ok(app.$$(".crew-group").length >= 2, "Who knows what wasn't drawn");
  assert.ok(app.$(".int-line s + .vh"), "a gone name wasn't struck through");
  found.push(...injected(app, "Who knows what"));
  app.click("[data-copen]");
  found.push(...injected(app, "a member's page"));
  assert.ok(app.$$("[data-int]").length >= 2, "the member's interactions weren't drawn");
  for (const el of app.$$("[data-idate]")) assert.ok(el.value === "" || /^\d{4}-\d{2}-\d{2}$/.test(el.value), "a date field read " + el.value);
  assert.ok(app.$$("[data-ikind].on").every(b => /\|(shared|learned|helped|wronged|killed|owes|owed)$/.test(b.dataset.ikind)), "a payload kind was pressed");
  assert.ok(!app.$("#main").innerHTML.includes("[object Object]"), "a field drew an object as text");
  app.click("[data-idel]");
  found.push(...injected(app, "the Delete question"));
  app.click("#modal [data-modalclose]");
  assert.deepEqual(found, [], "an interaction's or affiliation's text became markup");
  assert.deepEqual(app.errors, [], "the hostile interactions threw while rendering");
});

// ── A pack file is untrusted too (Decisions 180–182, 124) ───────────────
// Every id here is valid, so the records survive the gate and their text is
// what gets drawn; the junk ids and numbers are the engine tests'.
const PK = "PK-ABCD2345";
function hostilePack() {
  const text = tag => P(tag);
  return {
    meta: { kind: "shadows-pack", id: PK, name: text("pk.name"), packSchemaVersion: "0.2", contentVersion: text("pk.version"),
            created: "2026-10-01T10:00:00.000Z", updated: "2026-10-02T10:00:00.000Z" },
    origins: [{ id: "o1", name: text("origin.name"), text: text("origin.text"), modifiers: { BOD: 1, [text("mod.key")]: 2, REF: text("mod.val") } }, null, 5],
    npcRoles: [{ id: "r1", name: text("role.name"), text: text("role.text") }],
    enemyRoles: [{ id: "e1", name: text("enemy.name"), tier: 1, text: text("enemy.text") }],
    tiers: [{ id: 1, name: text("tier.name"), text: text("tier.text"), statGuide: text("tier.stat"), traitGuide: text("tier.trait") }],
    traits: [{ id: "t1", name: text("trait.name"), text: text("gl.text"), kind: text("gl.kind"), origin: "o1" },
             { id: "t2", name: text("gl.name2"), text: text("gl.text2"), kind: "signature", origin: text("gl.origin") }, null, 5],
    entries: [
      { id: "a", kind: "threat", ref: text("ref"), name: text("entry.name"), flavor: text("entry.flavor"), description: text("entry.desc"),
        motivation: text("entry.mot"), resources: text("entry.res"), line: text("entry.line"), ifPushed: text("entry.push"), gmNote: text("entry.gm"),
        origin: "o1", npcRoles: ["r1"], enemyRole: "e1", tier: 1,
        block: { stats: { BOD: 5 }, authored: { TOL: 2 }, skills: [{ name: text("skill.name"), total: 4 }], armor: [text("armor")], gear: [text("gear")],
                 traits: [{ name: text("trait.name"), text: text("trait.text") }] } },
      { id: "b", kind: "npc", ref: text("ref2"), name: text("person.name"), motivation: text("person.mot"), origin: "nowhere", npcRoles: ["r1", "nope"],
        block: { stats: { BOD: "x" }, traits: [{}] } },
    ],
    groups: [{ id: "g", ref: text("group.ref"), name: text("group.name"), origin: "o1", members: [{ entry: "a", count: 2 }, { entry: "zz", count: 9 }],
               situation: text("group.situation"), tactics: text("group.tactics") }],
  };
}

test("a hostile pack renders as text on Home, every Threats view, an entry, a group, its tips, Use and the copy (Decisions 124, 180–182)", () => {
  const key = "shadows.pack.v1." + PK;
  const app = boot({ storage: { "shadows.feature.gm": "on", [key]: { pack: hostilePack(), imported: "2026-10-05T10:00:00.000Z" } } });
  const found = [];
  found.push(...injected(app, "Home"));
  assert.ok(app.$("#main .packs .roster-card"), "the hostile pack isn't on Home");
  app.click("#btn-run-table"); app.$("#tbl-name").value = "Pier"; app.click("#modal [data-nameyes]");
  app.click('[data-tsec="threats"]');
  found.push(...injected(app, "the Threats list"));
  assert.ok(app.$("[data-tentry]"), "the hostile entry isn't listed");
  for (const v of ["npc", "group", "threat"]) {
    app.click(`[data-tview="${v}"]`);
    found.push(...injected(app, `the ${v} view`));
  }
  for (const [sel, i] of [["[data-torigin]", 1], ["[data-trole]", 1], ["[data-tenemy]", 1], ["[data-ttier]", 1]]) {
    const el = app.$(sel);
    assert.equal(el.options.length, 2, sel + " didn't offer the payload as its one choice");
    el.value = el.options[i].value; el.dispatchEvent(new app.window.Event("change", { bubbles: true }));
    found.push(...injected(app, "a filtered list " + sel));
  }
  app.click('[data-tview="group"]');
  app.$("[data-tgroup]").click();
  found.push(...injected(app, "a group's page"));
  assert.match(app.$("#main").textContent, /2× /);
  app.$("[data-tmember]").click();
  found.push(...injected(app, "an entry's page"));
  for (const chip of app.$$('[data-tip="packrec"]')) {
    chip.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
    found.push(...injected(app, "a pack tip"));
  }
  assert.ok(!app.$("#main").innerHTML.includes("[object Object]"), "a field drew an object as text");
  app.click("[data-tuse]");
  found.push(...injected(app, "the copy's page"));
  assert.match(app.$(".cast-from").textContent, /^From /);
  // The builder (Decisions 183–185): the origin and tier match, so the modifiers and guides draw; the picker lists the glossary.
  assert.match(app.$('[data-cmod="BOD"]').textContent, /\+1$/, "the matched origin's modifier didn't draw");
  assert.ok(app.$("[data-cstatguide]") && !app.$("[data-cstatguide]").hidden && !app.$("[data-ctguide]").hidden, "the matched guides didn't draw");
  found.push(...injected(app, "the builder's guidance"));
  app.click("[data-ctpick]");
  assert.equal(app.$$("#modal [data-tpadd]").length, 2);
  found.push(...injected(app, "the trait picker"));
  app.click("#modal [data-tpadd]");
  found.push(...injected(app, "the page after Add"));
  assert.ok(app.$("[data-ctcount]").textContent.length > 0);
  assert.ok(!app.$("#main").innerHTML.includes("[object Object]"));
  app.click("[data-tfrom]");
  found.push(...injected(app, "the entry again, from the copy"));
  app.click("[data-tback]");
  app.click('[data-tsec="cast"]');
  found.push(...injected(app, "the cast list"));
  app.click("[data-menu-toggle]"); app.click("[data-thome]");
  app.click("[data-premove]");
  found.push(...injected(app, "the Remove modal"));
  app.click("#modal [data-modalclose]");
  assert.deepEqual(found, [], "a pack's text became markup");
  assert.deepEqual(app.errors, [], "the hostile pack threw while rendering");
});

test("a pack file with __proto__ keys at every level pollutes nothing on import, and a pack with a payload for an id is refused", async () => {
  const raw = '{"__proto__":{"pwn":1},"meta":{"__proto__":{"pwn":1},"kind":"shadows-pack","id":"PK-ABCD2345"},"entries":[{"__proto__":{"pwn":1},"id":"a","name":"x","block":{"__proto__":{"pwn":1},"stats":{"__proto__":{"pwn":1}}}}],"groups":[{"__proto__":{"pwn":1},"id":"g","members":[{"__proto__":{"pwn":1},"entry":"a"}]}]}';
  const imp = boot({ storage: { "shadows.feature.gm": "on" } });
  const pickFile = async text => {
    const input = imp.$("#file-import");
    const file = new imp.window.File([text], "x.shadows-pack.json", { type: "application/json" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new imp.window.Event("change"));
    await new Promise(r => setTimeout(r, 200));
  };
  await pickFile(raw);
  assert.ok(imp.$("#main .packs .roster-card"), "the pack wasn't slotted in");
  assert.equal(({}).pwn, undefined);
  assert.equal(imp.window.eval("({}).pwn"), undefined, "the page's Object.prototype was polluted");
  const bad = JSON.parse(raw); bad.meta.id = P("pk.id");
  await pickFile(JSON.stringify(bad));
  assert.match(imp.$("#undotoast").textContent, /no id/);
  assert.deepEqual(injected(imp, "the refusal"), []);
  assert.deepEqual(imp.errors, []);
});

// ── An encounter is untrusted too (Decisions 188–190, 124) ─────────────
function hostileEncounters() {
  const t = Engine.newTable(P("tbl.name"));
  t.cast = [{ id: "C-ABCDEFGH", name: P("enc.cast") }];
  const cond = (o = {}) => ({ id: "burning", source: P("cond.source"), note: P("cond.note"), rounds: 3, ...o });
  t.encounters = [
    { id: "EN-ABCDEFGH", name: P("enc.name"), status: "running", round: "4", turn: "R-ABCDEFGH", created: P("enc.created"), updated: "2026-10-05T10:00:00.000Z",
      rows: [
        { id: "R-ABCDEFGH", kind: "pc", name: P("row.name"), order: "7", damage: "-5", hp: 0, levels: -3, awareness: "x", last: "yes", out: 1,
          conditions: [cond(), cond(), cond({ id: P("cond.id") }), cond({ id: "injured" }), cond({ id: "injured", location: P("cond.loc") }),
                       cond({ id: "dying", marks: "9", rounds: -1 }), cond({ id: "bleeding", rounds: "x" }), 5, null, "x"] },
        { id: "R-ABCDEFGH", kind: "cast", name: P("row2.name"), cast: { kind: "cast", id: "C-ZZZZZZZZ", name: P("row2.link") }, hp: 30, levels: 6, awareness: 4,
          damage: 1e400, order: 1e400, conditions: "x" },
        { kind: "entry", name: P("row3.name"), from: { kind: "entry", pack: P("pk"), id: "x", name: P("row3.from") },
          block: { stats: { BOD: "8" }, skills: [{ name: P("sk"), total: "5", skill: "awareness" }], traits: [{ name: P("tr"), text: P("tr.text") }] },
          cast: { kind: "cast", id: "C-ABCDEFGH" }, hp: 20, damage: 2.5 },
        { kind: P("kind"), name: 7, cast: { kind: "cast", id: "C-ABCDEFGH" } },
        null, 5, "x", { name: { x: 1 }, conditions: [{ id: "bleeding", rounds: 2 }] },
      ] },
    { id: "EN-ABCDEFGH", name: 5, status: "running", round: -2, turn: "R-NOTHERE", updated: "2026-10-06T10:00:00.000Z", rows: [{ id: "R-ZZZZZZZZ", name: "B" }] },
    { name: P("enc3.name"), status: "running", turn: "R-ZZZZZZZZ", updated: "2026-10-01T10:00:00.000Z", rows: "x" },
    { status: P("status"), rows: [{ name: "C", kind: "pc" }] },
    null, 5, "x",
  ];
  return t;
}

test("a hostile encounter comes out of the gate typed: numbers are numbers or null, one runs, ids are unique, nothing is dropped but junk", () => {
  const m = Engine.migrateTable(hostileEncounters());
  assert.equal(m.encounters.length, 4, "an encounter that is an object was dropped");
  assert.equal(m.encounters.filter(e => e.status === "running").length, 1, "more than one running");
  assert.equal(m.encounters[1].status, "running", "the newest running one should have kept running");
  assert.equal(new Set(m.encounters.map(e => e.id)).size, 4, "an encounter id repeated");
  for (const e of m.encounters) {
    assert.ok(/^EN-[0-9A-HJKMNP-TV-Z]{8}$/.test(e.id));
    assert.equal(typeof e.name, "string"); assert.ok(["planned", "running", "ended"].includes(e.status));
    assert.ok(Number.isSafeInteger(e.round) && e.round >= 0);
    assert.ok(e.turn === null || (e.status === "running" && e.rows.some(r => r.id === e.turn)), "a turn names nothing, or an encounter that isn't running");
    assert.equal(new Set(e.rows.map(r => r.id)).size, e.rows.length, "a row id repeated");
    for (const r of e.rows) {
      assert.ok(["pc", "cast", "entry"].includes(r.kind));
      assert.ok(/^R-[0-9A-HJKMNP-TV-Z]{8}$/.test(r.id));
      for (const k of ["order", "hp", "levels", "awareness"]) assert.ok(r[k] === null || Number.isSafeInteger(r[k]), `${k}: ${r[k]}`);
      assert.ok(Number.isSafeInteger(r.damage) && r.damage >= 0, `damage: ${r.damage}`);
      assert.equal(typeof r.last, "boolean"); assert.equal(typeof r.out, "boolean");
      if (r.kind !== "pc") for (const k of ["hp", "levels", "awareness"]) assert.equal(r[k], null, `${k} on a ${r.kind} row`);
      if (r.kind !== "cast") assert.equal(r.cast, null);
      if (r.kind !== "entry") { assert.equal(r.from, null); assert.equal(r.block, null); }
      for (const c of r.conditions) {
        assert.ok(D.conditions.some(x => x.id === c.id), "a Condition the data doesn't have");
        assert.ok(c.rounds === null || (Number.isSafeInteger(c.rounds) && c.rounds >= 1));
        assert.equal(typeof c.source, "string");
        if (c.id === "dying") assert.ok(c.marks >= 0 && c.marks <= 3, `marks ${c.marks}`);
        if (c.id === "injured") assert.ok(D.bodyLocations.some(l => l.id === c.location), "a location Condition with no valid location");
      }
      assert.equal(new Set(r.conditions.map(c => c.id + "@" + (c.location || ""))).size, r.conditions.length, "a Condition twice");
    }
  }
  const first = m.encounters.find(e => e.name === P("enc.name"));
  const pc = first.rows[0];
  assert.equal(pc.order, 7); assert.equal(pc.damage, 0, "damage -5 → 0"); assert.equal(pc.hp, null); assert.equal(pc.levels, null);
  assert.equal(first.rows[1].hp, null, "hp survived on a cast row");
  assert.equal(first.rows[1].order, null); assert.equal(first.rows[1].damage, 0);
  assert.equal(first.rows[2].cast, null, "a cast link survived on an entry row");
  assert.equal(first.rows[2].damage, 0);
  assert.equal(first.rows[3].kind, "pc");
  assert.equal(first.rows.length, 5, "junk rows weren't the only ones dropped");
  assert.equal(pc.conditions.map(c => c.id).join(), "burning,dying,bleeding");
  assert.equal(pc.conditions.map(c => c.rounds).join(), "3,,");
  assert.equal(pc.conditions[1].marks, 3, "marks 9 → the counter's max");
  // Idempotent: a second pass changes nothing.
  assert.deepEqual(JSON.parse(JSON.stringify(Engine.migrateTable(m))), JSON.parse(JSON.stringify(m)));
});

test("a hostile encounter file with __proto__ keys at every level pollutes nothing", () => {
  const raw = '{"__proto__":{"pwn":1},"meta":{"kind":"shadows-table"},"encounters":[{"__proto__":{"pwn":1},"name":"x","status":"running","rows":[{"__proto__":{"pwn":1},"name":"y","conditions":[{"__proto__":{"pwn":1},"id":"burning","constructor":{"x":1}}],"block":null}],"constructor":{"prototype":{"pwn":2}}}]}';
  const m = Engine.migrateTable(JSON.parse(raw));
  assert.equal(({}).pwn, undefined);
  assert.equal(m.encounters.length, 1);
  assert.equal(m.encounters[0].rows[0].conditions[0].id, "burning");
});

test("hostile encounters render as text on the list, the page, the Reset and Past encounters, and the Add to buttons", () => {
  const t = hostileEncounters();
  const key = "shadows.table.v1." + t.meta.id;
  const app = boot({ storage: { "shadows.feature.gm": "on", [key]: { table: t, section: "encounters", changed: "2026-10-05T10:00:00.000Z", exported: null } } });
  const found = [];
  app.$("[data-topen]").click();
  assert.equal(app.window.eval("S.tsection"), "encounters");
  found.push(...injected(app, "the Encounters list"));
  assert.ok(app.$$("[data-enc-open]").length >= 4, "the encounters weren't listed");
  for (const e of app.window.eval("S.table.encounters.map(e => e.id)")) {
    app.window.eval(`S.encOpen = ${JSON.stringify(e)}; renderTable();`);
    for (const d of app.$$("[data-emore] summary")) d.click();
    const open = app.$("[data-econdopen]"); if (open) open.click();
    found.push(...injected(app, "an encounter page"));
    app.window.eval("S.tsection = 'threats'; renderTable();");
    found.push(...injected(app, "Threats with an encounter open"));
    app.window.eval("S.tsection = 'encounters'; renderTable();");
  }
  assert.ok(!app.$("#main").innerHTML.includes("[object Object]"), "an object was drawn as text");
  assert.equal(app.window.eval("({}).pwn"), undefined, "the page's Object.prototype was polluted");
  assert.deepEqual(found, [], "an encounter's text became markup");
  assert.deepEqual(app.errors, [], "the hostile encounter threw while rendering");
});
