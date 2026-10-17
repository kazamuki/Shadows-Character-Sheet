/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: CRANK, buying and raising a power, and Milestones.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, D, lockedCharacter, onStep, CRANK_ON, openSheet, activeChar, clickIn, withDownloads, importFile, card, tipShown, pick, fill, focused } from "./smokekit.mjs";

// ── CRANK rep (Decision 169) ──────────────────────────────────────────
test("CRANK: Main's card reads 0 and Novice; the popover's Job done makes it 1, writes a ledger line, and Undo makes it 0", () => {
  const app = openSheet(lockedCharacter(), "main", { storage: CRANK_ON });
  const card = () => app.$('#main [data-vpop="crank"]');
  assert.ok(card(), "Main has no CRANK card");
  assert.match(card().textContent, /CRANK/);
  assert.match(card().textContent, /0.*Novice/);
  app.click('[data-vpop="crank"]');
  assert.match(app.$("#vpop").textContent, /0 · Novice/);
  assert.match(app.$("#vpop").textContent, /5 to Competent/);
  app.$("#vpop [data-crknote]").value = "the Kessel job";
  app.click("#vpop [data-crk=\"1\"]");
  assert.equal(activeChar(app).trackers.crank.rep, 1);
  assert.match(app.$("#vpop").textContent, /1 · Novice/);
  assert.match(app.$("#undotoast").textContent, /CRANK rep \+1 \(the Kessel job\)/);
  app.click('[data-sec="trackers"]');
  assert.match(app.$("#main").textContent, /Kessel job/, "the ledger line isn't on Trackers");
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).trackers.crank.rep, 0, "Undo didn't take the job back");
  assert.deepEqual(app.errors, []);
});

test("CRANK: Walked out at 0 shows -2 and Novice, and the tip carries the unsettled note", () => {
  const app = openSheet(lockedCharacter(), "trackers", { storage: CRANK_ON });
  app.click('#main [data-crk="-2"]');
  assert.equal(activeChar(app).trackers.crank.rep, -2);
  assert.match(app.$("#main").textContent, /-2/);
  assert.match(app.$("#main").textContent, /Novice/);
  clickIn(app, app.$('#main [data-tip="crank"]'));
  const shown = tipShown(app);
  assert.match(shown, /gray market/);
  for (const t of D.resources.crank.tiers) assert.ok(shown.includes(t.name) && shown.includes(Engine.crankPayText(t)), `the tip lacks ${t.name}`);
  assert.ok(shown.includes(D.resources.crank.playerNote), "the unsettled note is missing below zero");
  app.click('#main [data-crk="1"]'); app.click('#main [data-crk="1"]'); app.click('#main [data-crk="1"]');
  clickIn(app, app.$('#main [data-tip="crank"]'));
  assert.ok(!tipShown(app).includes(D.resources.crank.playerNote), "the note shows while rep is not below zero");
  assert.deepEqual(app.errors, []);
});

test("CRANK: the print view has the field, blank and filled", () => {
  const ch = lockedCharacter();
  ch.trackers.crank.rep = 7;
  const app = openSheet(ch, "main", { storage: CRANK_ON });
  const filled = app.window.renderPrintView(ch);
  assert.match(filled, /CRANK<\/span>.*7 · Competent/s);
  const blank = app.window.renderPrintView(null);
  assert.match(blank, /CRANK/);
  assert.doesNotMatch(blank, /Novice/);
});

test("CRANK: Admin corrects rep through the ledger, and Undo takes a correction back", () => {
  const app = openSheet(lockedCharacter(), "main", { storage: CRANK_ON });
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  app.click('[data-admin-crank="1"]');
  assert.equal(activeChar(app).trackers.crank.rep, 1);
  app.click('[data-admin-crank="-1"]');
  assert.equal(activeChar(app).trackers.crank.rep, 0);
  const led = [...activeChar(app).trackers.crank.ledger];
  assert.deepEqual([led.map(e => e.amount), led.map(e => e.note)], [[1, -1], ["Admin correction", "Admin correction"]]);
  app.click('[data-sec="sessions"]');
  app.click("button[data-undolast]");
  assert.equal(activeChar(app).trackers.crank.rep, 1, "Undo didn't take the last correction back");
  assert.deepEqual(app.errors, []);
});

test("CRANK: Main's card label opens the popover, and the tip lives on the tier name inside it", () => {
  const app = openSheet(lockedCharacter(), "main", { storage: CRANK_ON });
  const card = app.$('#main [data-vpop="crank"]');
  assert.ok(!card.querySelector("[data-tip]"), "a tip trigger inside the card's button swallows the tap");
  clickIn(app, card.querySelector(".lab"));
  assert.ok(!app.$("#vpop").hidden, "tapping the label didn't open the popover");
  assert.match(app.$("#vpop").textContent, /CRANK rep/);
  clickIn(app, app.$('#vpop [data-tip="crank"]'));
  assert.match(tipShown(app), /gray market/, "the tier name didn't open the tip");
  assert.deepEqual(app.errors, []);
});

// ── CRANK behind a switch (Decision 214) ───────────────────────────────
const crankLedgered = () => {
  const ch = lockedCharacter();
  ch.trackers.crank = { rep: 3, ledger: [
    { date: "2026-10-01T10:00:00.000Z", amount: 2, note: "the Halvorsen job" },
    { date: "2026-10-05T10:00:00.000Z", amount: 1, note: "the Kessel job" }] };
  return Engine.migrate(ch);
};

test("Decision 214: ?crank=on turns the switch on and keeps it, ?crank=off turns it off", () => {
  const app = boot();
  const w = app.window;
  assert.equal(w.eval('featureOn("crank")'), false, "CRANK ships off");
  w.eval('applyFeatureQuery("?crank=on")');
  assert.equal(w.localStorage.getItem("shadows.feature.crank"), "on");
  assert.equal(w.eval('featureOn("crank")'), true);
  assert.equal(w.eval('featureOn("gm")'), false, "?crank=on turned GM mode on");
  w.eval('applyFeatureQuery("?crank=off")');
  assert.equal(w.localStorage.getItem("shadows.feature.crank"), null);
  assert.equal(w.eval('featureOn("crank")'), false);
  assert.deepEqual(app.errors, []);
});

test("Decision 214: switched off, no CRANK on Main, Trackers, Admin or the print view, and its popover is null", () => {
  const ch = crankLedgered();
  const app = openSheet(ch, "main");
  assert.ok(!app.$("#main .cond.crank") && !app.$('#main [data-vpop="crank"]'), "Main shows a CRANK card");
  assert.doesNotMatch(app.$("#main").textContent, /CRANK/);
  assert.equal(app.window.eval('vitalPopover(S.ch, "crank")'), null);
  app.click('[data-sec="trackers"]');
  assert.doesNotMatch(app.$("#main").textContent, /CRANK|Halvorsen/, "Trackers shows CRANK");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  assert.ok(!app.$("[data-admin-crank]"), "Admin offers a CRANK correction");
  assert.doesNotMatch(app.$("#main").textContent, /CRANK/);
  assert.doesNotMatch(app.window.renderPrintView(ch), /CRANK/);
  assert.doesNotMatch(app.window.renderPrintView(null), /CRANK/);
  assert.deepEqual(app.errors, []);
});

test("Decision 214: switched off, rep and ledger survive an export and an import, and come back when it's on", async () => {
  const ch = crankLedgered();
  const first = openSheet(ch, "main");
  const downloads = withDownloads(first);
  first.window.eval("exportCharacter(S.ch)");
  const file = JSON.parse(await downloads[0].text());
  assert.equal(file.trackers.crank.rep, 3, "the export lost the rep");
  const fresh = boot();
  await importFile(fresh, file);
  const kept = fresh.window.eval("S.ch.trackers.crank");
  assert.equal(kept.rep, 3);
  assert.deepEqual([...kept.ledger].map(e => e.note), ["the Halvorsen job", "the Kessel job"]);
  const on = openSheet(file, "trackers", { storage: CRANK_ON });
  assert.match(on.$("#main").textContent, /Rep\s*3/);
  assert.match(on.$("#main").textContent, /CRANK ledger \(2\)/);
  assert.match(on.$("#main").textContent, /Halvorsen/);
  assert.deepEqual(on.errors, []);
});

test("Decision 214: whichever card is left alone on Main's last row takes it, with or without SFR and CRANK", () => {
  const rows = [
    { sfr: false, crank: true,  alone: null },
    { sfr: true,  crank: true,  alone: "crank" },
    { sfr: false, crank: false, alone: "cred" },
    { sfr: true,  crank: false, alone: null },
  ];
  for (const r of rows) {
    const ch = lockedCharacter(); if (r.sfr) ch.identity.archetype = "werewolf";
    const app = openSheet(ch, "main", { width: 1400, storage: r.crank ? CRANK_ON : {} });
    assert.equal(!!app.$("#main .cond.sfr"), r.sfr, "the fixture's SFR card is not as the row says");
    const alone = app.$$("#main .cond.alone").map(c => c.className.split(/\s+/).find(k => k === "crank" || k === "cred"));
    assert.deepEqual(alone, r.alone ? [r.alone] : [], `SFR ${r.sfr}, CRANK ${r.crank}`);
  }
});

// ── P5: Buy or Raise a Power (Decision 216) ──────────────────────────────
const customForm = (app, name, effect) => { fill(app, '#modal [data-pwcustom="name"]', name); fill(app, '#modal [data-pwcustom="effect"]', effect || ""); };
const logLabels = app => (activeChar(app).audit || []).map(e => e.label);

test("Buy or Raise a Power: a Strigoi learns a Bloodline power from the modal, raises it, and Undo takes the learn back (Decision 216)", () => {
  const ch = lockedCharacter();
  ch.identity.archetype = "vampire"; ch.creation.powerLevel = "street";
  ch.archetypeChoices.specialization = ["strigoi"]; ch.archetypeChoices.basePowers = { "shadow-play": 1 };
  ch.progression.ip.earned = 100;
  const app = openSheet(ch, "progression");
  assert.equal(app.$('[data-raiseopen="power"]').textContent, "Buy or Raise a Power");
  app.click('[data-raiseopen="power"]');
  const modal = () => app.$("#modal");
  assert.match(modal().textContent, /Your powers[\s\S]*Learn a new power[\s\S]*Custom power/);
  assert.ok(!app.$('#modal [data-raise="power|shadow-play"]').closest("tr").textContent.includes("Learn"), "a held power is on the Learn list");
  const veil = app.$('#modal [data-raise="power|veil-of-night"]');
  assert.equal(veil.textContent, "Learn");
  assert.match(veil.closest("tr").textContent, /40 IP/);
  assert.equal(app.$('#modal [data-raise="power|iron-hide"]'), null, "another Bloodline's power is offered");
  customForm(app, "Typed", "kept");
  app.click('#modal [data-raise="power|veil-of-night"]');
  assert.equal(app.$('#modal [data-pwcustom="name"]').value, "Typed", "a purchase wiped the typed name");
  assert.equal(activeChar(app).progression.powerIpe["veil-of-night"], 1);
  assert.match(modal().textContent, /You have 60 IP/);
  assert.equal(app.$('#modal [data-raise="power|veil-of-night"]').textContent, "Raise", "the learned power didn't move to Your powers");
  app.click('#modal [data-raise="power|veil-of-night"]');
  assert.equal(activeChar(app).progression.powerIpe["veil-of-night"], 2);
  app.click("#modal [data-modalclose]");
  assert.match(app.$("#main .journal").textContent, /Veil of Night \(Masked\) 0 → 1/);
  app.click('[data-sec="sessions"]');
  app.click("button[data-undolast]");                      // the raise
  app.click("button[data-undolast]");                      // the learn
  assert.equal(activeChar(app).progression.powerIpe["veil-of-night"], undefined, "Undo didn't take the learn back");
  assert.equal(activeChar(app).progression.ip.log.length, 0);
  assert.deepEqual(app.errors, []);
});

test("Buy or Raise a Power: a Professional adds a Custom power for 40 IP, sees it once on the Character tab, and Admin removes it (Decision 216)", () => {
  const ch = lockedCharacter(); ch.identity.archetype = "professional"; ch.progression.ip.earned = 50;
  const app = openSheet(ch, "progression");
  app.click('[data-raiseopen="power"]');
  assert.ok(!app.$('#modal [data-pwcustom="cost"]'), "a cost box shows off Admin");
  assert.match(app.$("#modal").textContent, /You have 50 IP[\s\S]*costs 40 IP/);
  app.click("#modal [data-pwcustom-go]");                  // no name
  assert.equal(activeChar(app).powers.length, 0, "a nameless power was added");
  customForm(app, "Ghost Sight", "Sees the dead.");
  app.click("#modal [data-pwcustom-go]");
  const c = activeChar(app);
  assert.deepEqual([c.powers.length, c.powers[0].name, c.powers[0].boughtWithCp, Engine.ipState(c).available], [1, "Ghost Sight", false, 10]);
  assert.match(app.$('#modal [data-raise]').closest("tr").textContent, /Ghost Sight[\s\S]*rank 1/, "it isn't under Your powers");
  assert.deepEqual(logLabels(app).filter(l => /Custom power/.test(l)), ["Custom power: Ghost Sight (40 IP)"]);
  customForm(app, "Too dear", "");                         // 10 IP left: refused, and the form keeps what was typed
  app.click("#modal [data-pwcustom-go]");
  assert.equal(activeChar(app).powers.length, 1);
  assert.equal(app.$('#modal [data-pwcustom="name"]').value, "Too dear", "a refusal cleared the form");
  app.click("#modal [data-modalclose]");

  app.click('[data-sec="main"]');                          // the Character tab is where the archetype lives
  const sec = app.$$("[data-sec]").map(b => b.dataset.sec).find(id => /arch|char/.test(id)) || "archetype";
  app.click(`[data-sec="${sec}"]`);
  assert.equal(app.$$("#main .pw-card").filter(el => /Ghost Sight/.test(el.textContent)).length, 1, "the custom power isn't shown exactly once");
  assert.ok(app.$("#main [data-pwimprove]"), "no Improve on the card");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  app.click(`[data-sec="${sec}"]`);
  app.click("#main [data-pwdel]");
  app.click("[data-askyes], #modal [data-yes]");
  assert.equal(activeChar(app).powers.length, 0, "Admin's Remove left the power");
  assert.equal(activeChar(app).progression.powerIpe[c.powers[0].id], undefined);
  assert.deepEqual(app.errors, []);
});

test("Buy or Raise a Power: on Admin the Custom power form has an IP cost box, and blank is free with no spend (Decision 216)", () => {
  const ch = lockedCharacter(); ch.identity.archetype = "professional"; ch.progression.ip.earned = 50;
  const app = openSheet(ch, "progression");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  app.click('[data-sec="progression"]');
  app.click('[data-raiseopen="power"]');
  assert.ok(app.$('#modal [data-pwcustom="cost"]'), "Admin has no cost box");
  customForm(app, "Ghost Sight", "");
  app.click("#modal [data-pwcustom-go]");
  const c = activeChar(app);
  assert.deepEqual([c.powers.length, Engine.ipState(c).available, c.progression.ip.log.length], [1, 50, 0]);
  assert.deepEqual(logLabels(app).filter(l => /Custom power/.test(l)), ["Custom power: Ghost Sight (free)"]);
  assert.deepEqual(app.errors, []);
});

test("The CP step's Custom power: 5 CP, or free as a GM grant, and Add is off with its reason when CP is short (Decision 216)", () => {
  const app = onStep("werewolf", "heroic", "character-points", ch => { ch.archetypeChoices.specialization = ["trueborn"]; });
  const left = () => Number(/Remaining (\d+) CP/.exec(app.$(".jump-cp").textContent)[1]);
  assert.match(app.$("#main").textContent, /Custom powers — a GM's, 5 CP each, or free/);
  assert.match(app.$("#main").textContent, /sheet doesn't roll it/);
  const before = left();
  const add = (name, free) => { fill(app, '#main [data-pwcustom="name"]', name); app.$("#main [data-pwcustom-free]").checked = !!free; app.$("#main [data-pwcustom-free]").dispatchEvent(new app.window.Event("change", { bubbles: true })); app.click("#main [data-pwcustom-go]"); };
  add("Moon-Eye");
  assert.equal(left(), before - 5, "a paid custom power didn't cost 5 CP");
  assert.match(app.$("#main").textContent, /Moon-Eye[\s\S]*5 CP/);
  add("Gift", true);
  assert.equal(left(), before - 5, "a GM grant cost CP");
  assert.match(app.$("#main").textContent, /Gift[\s\S]*GM grant/);
  app.click("#main [data-pwrm]");                          // Moon-Eye comes off: its 5 CP return
  assert.equal(left(), before);
  // Out of CP: Add is off and says why; the box turns it back on.
  app.window.eval("S.ch.trackers.luck.bonus = 99; update();");
  assert.ok(app.$("#main [data-pwcustom-go]").disabled);
  assert.ok(!app.$("#main [data-pwcustom-why]").hidden && /No Character Points left/.test(app.$("#main [data-pwcustom-why]").textContent));
  app.$("#main [data-pwcustom-free]").checked = true;
  app.$("#main [data-pwcustom-free]").dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.ok(!app.$("#main [data-pwcustom-go]").disabled);
  assert.deepEqual(app.errors, []);
  // The write-in archetype writes its powers free on the Archetype step: no form here.
  const wi = onStep(D.archetypes.find(a => a.writeIn).id, "heroic", "character-points");
  assert.equal(wi.$("#main [data-pwcustom-go]"), null);
});

// ── P6: Milestones (Decision 217) ────────────────────────────────────────
const p6Char = (arch = "professional", mp = 100) => { const c = lockedCharacter(); c.identity.archetype = arch; c.progression.milestonePoints = mp; return c; };
const undoLast = app => { app.click('[data-sec="sessions"]'); app.click("button[data-undolast]"); app.click('[data-sec="progression"]'); };

test("Decision 217: any Minor is taken twice from the picker, and Improved asks for 3d10 and adds 30", () => {
  const app = openSheet(p6Char("professional", 15), "progression");
  assert.ok(!app.$('[data-takeminor="improved"]').disabled);
  for (const dice of ["10", "20"]) {
    app.click('[data-takeminor="improved"]');
    const prompt = app.$("[data-improvroll]").closest(".trk");
    assert.match(prompt.textContent, /Roll 3d10/);
    assert.match(prompt.textContent, /\+ 30 IP/);
    app.$("[data-improvroll]").value = dice; app.click("[data-improvok]");
  }
  const now = activeChar(app);
  assert.deepEqual(now.progression.milestones.minor.map(m => m.id), ["improved", "improved"]);
  assert.deepEqual(now.progression.ip.log.map(e => e.amount), [40, 50]);
  assert.match(app.$("#main").textContent, /taken ×2/);
  assert.ok(app.$('[data-takeminor="improved"]').disabled, "none left to take, but it's enabled");
  assert.deepEqual(app.errors, []);
});

test("Decision 217: Skilled opens a chooser, takes two Skills free in one commit, and one Undo takes it all back", () => {
  const ch = p6Char("professional", 5); ch.skills.dodge = { rank: 10, ipe: 0 };
  const app = openSheet(ch, "progression");
  app.click('[data-takeminor="skilled"]');
  assert.ok(app.$("#modal").open || app.$("#modal [data-mcresults]"), "no chooser");
  assert.ok(app.$('#modal [data-mcpick="dodge"]').disabled, "a Skill at 10 is offered");
  const take = () => app.$("#modal [data-mctake]");
  assert.ok(take().disabled, "Take is on with nothing picked");
  app.click('#modal [data-mcpick="handguns"]');
  assert.ok(take().disabled, "Take is on with one of two");
  app.click('#modal [data-mcpick="handguns"]');                        // unpick
  app.click('#modal [data-mcpick="handguns"]'); app.click('#modal [data-mcpick="combat-sense"]');
  assert.ok(!take().disabled);
  const before = activeChar(app).progression.ip.log.length;
  app.click("#modal [data-mctake]");
  const now = activeChar(app);
  assert.equal(now.progression.milestones.minor.length, 1);
  assert.equal(now.progression.ip.log.length, before + 2);
  assert.equal(now.skills.handguns.ipe, 1);
  undoLast(app);
  const back = activeChar(app);
  assert.equal(back.progression.milestones.minor.length, 0);
  assert.equal((back.skills.handguns || { ipe: 0 }).ipe, 0);
  assert.equal(back.progression.ip.log.length, before);
  assert.deepEqual(app.errors, []);
});

test("Decision 217: Honed, Redeemed and Talented each open a chooser, commit once and undo once", () => {
  const ch = p6Char("professional", 100);
  ch.disadvantages = [{ id: "addiction", rank: 2, notes: "" }];
  ch.advantages = [{ id: "archery-master", rank: 1, notes: "" }];
  const app = openSheet(ch, "progression");
  const run = (minor, pick, check, restore) => {
    app.click(`[data-takeminor="${minor}"]`);
    app.click(`#modal [data-mcpick="${pick}"]`);
    app.click("#modal [data-mctake]");
    check(activeChar(app));
    assert.equal(activeChar(app).progression.milestones.minor.length, 1, `${minor} wasn't one commit`);
    undoLast(app);
    assert.equal(activeChar(app).progression.milestones.minor.length, 0, `${minor}: Undo left the Minor`);
    restore(activeChar(app));
  };
  run("honed", "WILL", c => assert.deepEqual(c.trackers.adjustments.map(a => [a.target, a.amount]), [["WILL", 1]]), c => assert.equal(c.trackers.adjustments.length, 0));
  run("redeemed", "addiction", c => assert.equal(c.disadvantages[0].rank, 1), c => assert.equal(c.disadvantages[0].rank, 2));
  run("talented", "archery-master", c => assert.equal(c.advantages[0].rank, 2), c => assert.equal(c.advantages[0].rank, 1));
  run("talented", "charismatic", c => assert.equal(c.advantages.length, 2), c => assert.equal(c.advantages.length, 1));
  assert.deepEqual(app.errors, []);
});

test("Decision 217: Steadied offers each restore, and says so when there is nothing to restore", () => {
  const ch = p6Char("professional", 5);
  const app = openSheet(ch, "progression");
  assert.ok(app.$('[data-takeminor="steadied"]').disabled);
  assert.match(app.$('[data-takeminor="steadied"]').closest(".pick").textContent, /Nothing to restore\./);
  const hurt = p6Char("professional", 5); hurt.trackers.san.loss = 12; hurt.trackers.massiveLevels = 1;
  const app2 = openSheet(hurt, "progression");
  app2.click('[data-takeminor="steadied"]');
  assert.match(app2.$("#modal").textContent, /Restore 10 SAN/);
  assert.match(app2.$("#modal").textContent, /Restore a Health Level/);
  app2.click('#modal [data-mcpick="massiveLevel"]'); app2.click("#modal [data-mctake]");
  const now = activeChar(app2);
  assert.equal(now.trackers.massiveLevels, 0);
  assert.equal(now.trackers.san.loss, 12, "the other option moved too");
  assert.deepEqual(app2.errors, []);
});

test("Decision 217: an Arcanist sees the plain line and Add one; a written-in Major goes in the journal; a saved General Major stays", () => {
  const ch = p6Char("arcanist", 10);
  const app = openSheet(ch, "progression");
  assert.match(app.$("#main").textContent, /No Major Milestones listed for this archetype\./);
  assert.doesNotMatch(app.$("#main").textContent, /Specialist|Defensive Dance|coming soon/i);
  app.$("[data-mmname]").value = "Aetheric Potency"; app.$("[data-mmdesc]").value = "More of it.";
  app.click("[data-mmadd]");
  const now = activeChar(app);
  assert.equal(now.progression.milestones.major.length, 1);
  assert.match(app.$("#main .journal").textContent, /Aetheric Potency/);
  assert.match(app.$("#main .journal").textContent, /More of it\./, "a written-in Major's description is not shown");
  app.$("[data-mmname]").value = "Second";
  app.click("[data-mmadd]");
  assert.equal(activeChar(app).progression.milestones.major.length, 1, "a second one used a slot that was not there");
  assert.equal(app.$("[data-mmname]").value, "Second", "a refusal threw away what was typed");

  const saved = p6Char("arcanist", 10); saved.progression.milestones.major = [{ id: "specialist", date: "2026-10-01" }];
  const app2 = openSheet(saved, "progression");
  assert.match(app2.$("#main .journal").textContent, /Specialist/);
  assert.deepEqual(app2.errors, []);
});

// ── P12a: IP beyond ranks (Decisions 227 and 228) ───────────────────────
const p12Char = (arch = "professional") => {
  const c = lockedCharacter(); c.identity.archetype = arch;
  c.meta.gamedataVersion = D.meta.gamedataVersion;
  c.progression.ip.earned = 400;
  return c;
};
const jrnl = app => app.$("#main .journal").textContent;
const banner = app => app.window.loadFindings(activeChar(app)).importIssues;

test("P12a 10: Buy an Advantage from Progression: a rank with its pick, the modal stays open, and one Undo restores it all", () => {
  const ch = p12Char();
  ch.advantages = [{ id: "favored-skill", rank: 1, notes: "", selections: { skill: ["handguns"] } }];
  const app = openSheet(ch, "progression");
  app.click('[data-ipopen="advantage"]');
  const buy = () => app.$('#modal [data-ipbuy="advantage|favored-skill"]');
  assert.ok(buy().disabled, "Buy is on before the pick is chosen");
  assert.match(buy().closest("tr").textContent, /rank 1 → 2|1 → 2/);
  assert.match(buy().closest("tr").textContent, /50 IP/);
  assert.ok(!app.$('#modal [data-ipfor="favored-skill"] option[value="handguns"]'), "the skill already chosen is offered again");
  const y0 = buy().getBoundingClientRect().y;
  pick(app, '#modal [data-ipfor="favored-skill"]', "dodge");
  assert.equal(buy().disabled, false, "Buy stayed off with a pick chosen");
  app.click('#modal [data-ipbuy="advantage|favored-skill"]');
  const c = activeChar(app);
  assert.equal(c.advantages.length, 1);
  assert.equal(c.advantages[0].rank, 2);
  assert.deepEqual([...c.advantages[0].selections.skill], ["handguns", "dodge"]);
  assert.equal(Engine.ipState(c).available, 350);
  assert.ok(app.$("#modal").open || app.$("#modal [data-ipresults]"), "the modal closed");
  assert.match(app.$("#modal").textContent, /You have 350 IP/);
  assert.ok(buy().disabled === true, "the next rank needs its own pick");
  assert.equal(buy().getBoundingClientRect().y, y0, "Buy moved after a purchase");
  app.click("#modal [data-modalclose]");
  assert.match(jrnl(app), /Advantage: Favored Skill 1 → 2/);
  assert.equal(banner(app).length, 0, "a bought rank reads as a hand edit");
  undoLast(app);
  const back = activeChar(app);
  assert.equal(back.advantages[0].rank, 1);
  assert.deepEqual([...back.advantages[0].selections.skill], ["handguns"]);
  assert.equal(back.progression.ip.log.length, 0);
  assert.deepEqual(app.errors, []);
});

test("P12a 10: a new Advantage, a Professional's Natural row left alone, a Vampire's non-Universal one off with its reason", () => {
  const ch = p12Char();
  ch.advantages = [{ id: "favored-skill", rank: 1, source: "natural", notes: "" }];
  const app = openSheet(ch, "progression");
  app.click('[data-ipopen="advantage"]');
  pick(app, '#modal [data-ipfor="favored-skill"]', "dodge");
  app.click('#modal [data-ipbuy="advantage|favored-skill"]');
  const c = activeChar(app);
  assert.equal(c.advantages.length, 2, "the rank went onto the natural row");
  assert.equal(c.advantages[0].rank, 1);
  assert.equal(c.advantages[0].source, "natural");
  assert.equal(c.advantages[1].source, undefined);
  app.click('#modal [data-ipbuy="advantage|hard-to-kill"]');
  assert.equal(activeChar(app).advantages.some(a => a.id === "hard-to-kill"), true);
  assert.equal(app.$('#modal [data-ipbuy="advantage|long-lived"]').disabled, true);
  assert.match(app.$('#modal [data-ipbuy="advantage|long-lived"]').closest("tr").textContent, /only be taken when a character is made/);
  assert.match(app.$('#modal [data-ipbuy="advantage|educated"]').closest("tr").textContent, /IP doesn't buy it in play/);
  assert.doesNotMatch(app.$("#modal").textContent, /\bF\d+\b/, "a flag id shows");
  const vamp = p12Char("vampire");
  const app2 = openSheet(vamp, "progression");
  app2.click('[data-ipopen="advantage"]');
  const off = D.advantages.find(a => !a.universal && !a.creationOnly && !a.flagged);
  const row = app2.$(`#modal [data-ipbuy="advantage|${off.id}"]`);
  assert.equal(row.disabled, true);
  assert.match(row.closest("tr").querySelector(".why").textContent, /can buy/);
  assert.deepEqual(app.errors, []);
  assert.deepEqual(app2.errors, []);
});

test("P12a 11: Buy off, Restore SAN and Restore a Health Level are each one commit with a journal line, no banner, and one Undo", () => {
  const ch = p12Char();
  ch.disadvantages = [{ id: "minor-insanity", rank: 2, notes: "" }, { id: "pact", rank: 1, notes: "" }];
  ch.trackers.san.loss = 12; ch.trackers.massiveLevels = 2;
  const app = openSheet(ch, "progression");
  const audits = () => activeChar(app).audit.length;
  app.click('[data-ipopen="disadvantage"]');
  assert.match(app.$("#modal").textContent, /No Character Points come back/);
  assert.match(app.$('#modal [data-ipbuy="disadvantage|pact"]').closest("tr").nextElementSibling.textContent, /Work out the pact|conditions for release/, "Pact's condition isn't readable before Buy off");
  const a0 = audits();
  app.click('#modal [data-ipbuy="disadvantage|minor-insanity"]');
  assert.equal(audits(), a0 + 1, "Buy off wasn't one commit");
  app.click('#modal [data-ipbuy="disadvantage|minor-insanity"]');
  assert.equal(activeChar(app).disadvantages.some(d => d.id === "minor-insanity"), false, "removed at rank 1");
  assert.equal(app.$('#modal [data-ipbuy="disadvantage|minor-insanity"]'), null, "the bought-off row is still listed");
  app.click("#modal [data-modalclose]");
  assert.match(jrnl(app), /Bought off: Minor Insanity/);
  app.click('[data-ipopen="restore"]');
  fill(app, "#modal [data-sann]", "10");
  assert.match(app.$("#modal [data-sanbtn]").textContent, /Restore 10 SAN · 50 IP/);
  app.click("#modal [data-sanbtn]");
  assert.equal(activeChar(app).trackers.san.loss, 2);
  assert.equal(app.$("#modal [data-sann]").value, "2", "the stepper didn't reset to what's left");
  app.click('#modal [data-ipbuy="restore|massiveLevel"]');
  assert.equal(activeChar(app).trackers.massiveLevels, 1);
  app.click("#modal [data-modalclose]");
  assert.match(jrnl(app), /Restored 10 SAN/);
  assert.match(jrnl(app), /Restored a Health Level/);
  assert.equal(banner(app).length, 0, "a buy-off or restore reads as a hand edit after a reload");
  undoLast(app); undoLast(app);
  const back = activeChar(app);
  assert.equal(back.trackers.san.loss, 12);
  assert.equal(back.trackers.massiveLevels, 2);
  assert.deepEqual(app.errors, []);
});

test("P12a 11: once Buy off or Restore has nothing left, closing it puts focus on Buy an Advantage, not the page", () => {
  const ch = p12Char();
  ch.disadvantages = [{ id: "minor-insanity", rank: 1, notes: "" }];
  ch.trackers.massiveLevels = 1;
  const app = openSheet(ch, "progression");
  for (const [kind, buy] of [["disadvantage", "disadvantage|minor-insanity"], ["restore", "restore|massiveLevel"]]) {
    app.click(`[data-ipopen="${kind}"]`);
    app.click(`#modal [data-ipbuy="${buy}"]`);
    app.click("#modal [data-modalclose]");
    assert.equal(app.$(`[data-ipopen="${kind}"]`), null, `${kind}'s button is still there`);
    assert.equal(focused(app), app.$('[data-ipopen="advantage"]'), `closing ${kind} lost focus`);
  }
  assert.deepEqual(app.errors, []);
});

test("P12a 11: Restore is off with nothing lost, and Buy off with nothing held", () => {
  const app = openSheet(p12Char(), "progression");
  assert.ok(app.$('[data-ipopen="advantage"]'));
  assert.equal(app.$('[data-ipopen="restore"]'), null);
  assert.equal(app.$('[data-ipopen="disadvantage"]'), null);
  assert.deepEqual(app.errors, []);
});

test("P12a 12: the Session Log counts hours: 3 hours fills 15, a typed IP wins, and neither turns Log off", () => {
  const app = openSheet(p12Char(), "sessions");
  const log = () => app.$("[data-seslog]");
  assert.equal(log().disabled, true, "Log is on with neither hours nor IP");
  assert.match(app.$("#main").textContent, /Enter the hours played or the IP earned/);
  assert.doesNotMatch(app.$("#main").textContent, /\b10 IP\b/, "the flat 10 is still in the copy");
  assert.match(app.$("#main").textContent, /5 IP an hour of play/);
  fill(app, "[data-seshours]", "3");
  assert.equal(app.$("[data-sesip]").value, "15");
  assert.equal(log().disabled, false);
  fill(app, "[data-seshours]", "2.5");
  assert.equal(app.$("[data-sesip]").value, "13", "12.5 must round up");
  fill(app, "[data-sesip]", "20");
  fill(app, "[data-seshours]", "4");
  assert.equal(app.$("[data-sesip]").value, "20", "hours overwrote a typed IP");
  app.click("[data-seslog]");
  assert.equal(activeChar(app).sessions[0].ipEarned, 20);
  const zero = openSheet(p12Char(), "sessions");
  fill(zero, "[data-sesip]", "0");
  assert.equal(zero.$("[data-seslog]").disabled, false, "0 is a value");
  zero.click("[data-seslog]");
  assert.equal(activeChar(zero).sessions[0].ipEarned, 0);
  assert.deepEqual(app.errors, []);
});

test("P12a: every flagged Advantage the IP buy refuses says why in the entry's own note, never a build-state line", () => {
  const app = openSheet(p12Char(), "progression");
  app.click('[data-ipopen="advantage"]');
  for (const a of D.advantages.filter(a => a.flagged)) {
    assert.ok(a.playerNote, `${a.id} is flagged with no playerNote`);
    assert.ok(app.$(`#modal [data-ipbuy="advantage|${a.id}"]`).closest("tr").textContent.includes(a.playerNote), `${a.id}'s row lacks its note`);
  }
  assert.ok(!app.$("#modal").textContent.includes(D.appCopy.unsettledRule), "the generic fallback line shows");
});

test("P12a: a flagged Advantage's note reads true on the wizard's Character Points step too, beside the live stepper", () => {
  const app = onStep("professional", "street", "character-points");
  const flagged = D.advantages.filter(a => a.flagged);
  assert.ok(flagged.length >= 2);
  for (const a of flagged) {
    const card = app.$$("#main .pick").find(c => c.textContent.includes(a.name) && c.textContent.includes(a.playerNote));
    assert.ok(card, `${a.name}'s note isn't on the Character Points step`);
    assert.doesNotMatch(a.playerNote, /yet\. Ask|can't buy it yet/, `${a.id}'s note reads as IP-only news at creation`);
    assert.match(a.playerNote, /your GM's call/, `${a.id}'s note doesn't hand the table the authority at creation`);
    assert.match(a.playerNote, /in play/, `${a.id}'s note doesn't say what IP does in play`);
  }
});

// ── P12b: Training (Decision 230) ───────────────────────────────────────────────
const trChar = (extra = {}) => {
  const c = lockedCharacter(); c.identity.archetype = "professional";
  c.meta.gamedataVersion = D.meta.gamedataVersion;
  c.skills.handguns = { rank: 5, ipe: 0 };
  c.skills.persuasion = { rank: 2, ipe: 0 };
  c.progression.milestonePoints = 9;
  c.trackers.credits.current = 1250;
  Object.assign(c, extra);
  return c;
};
const trainOn = ch => { ch.houseRules.training = true; return ch; };
const seeSkillRow = (app, id) => { app.click('[data-sec="skills"]'); return app.$(`#main [data-skillname="${id}"]`).closest("tr"); };

test("P12b 12: Train a Skill from Progression, landed by the Session Log, one Undo takes both back", () => {
  // Off: no button. Admin turns it on.
  const app = openSheet(trChar(), "progression");
  assert.equal(app.$("[data-trainopen]"), null, "Train a Skill shows with the rule off");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  const box = app.$("[data-admin-training]");
  assert.ok(box, "Admin has no Training checkbox");
  box.checked = true; box.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.equal(activeChar(app).houseRules.training, true);
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  app.click('[data-sec="progression"]');
  assert.ok(app.$("[data-trainopen]"), "Admin on, and still no Train a Skill");

  app.click("[data-trainopen]");
  assert.match(app.$("#modal").textContent, /You have Ç1,?250/);
  assert.match(app.$("#modal").textContent, /next Milestone is at 10 MP/, "the status line says when the next Milestone is");
  assert.ok(app.$('#modal [data-train="handguns"]'));
  assert.equal(app.$('#modal [data-train="persuasion"]'), null, "a MAG skill is offered");
  assert.equal(app.$('#modal [data-train="stealth"]'), null, "an untrained skill is offered");
  assert.match(app.$('#modal [data-train="handguns"]').closest("tr").textContent, /5 → 6/);
  assert.match(app.$('#modal [data-train="handguns"]').closest("tr").textContent, /Ç250/);
  assert.match(app.$('#modal [data-train="handguns"]').closest("tr").textContent, /teacher/i);
  app.click('#modal [data-train="handguns"]');
  const c1 = activeChar(app);
  assert.equal(c1.trackers.credits.current, 1000);
  assert.equal(c1.trackers.credits.ledger.at(-1).note, "Training: Handguns 5 → 6");
  assert.equal(c1.progression.training.skill, "handguns");
  assert.ok(app.$("#modal").open, "the modal closed after a start");
  const rows = [...app.$$("#modal [data-train]")];
  assert.ok(rows.length > 0 && rows.every(b => b.disabled), "every row is off after a start");
  assert.match(app.$("#modal").textContent, /Handguns 5 → 6 is in training/);
  assert.match(app.$("#modal").textContent, /10 Milestone Points/);
  assert.match(app.$("#modal").textContent, /In training until 10 Milestone Points|Handguns is in training until 10 Milestone Points/);
  app.click("#modal [data-modalclose]");
  // Raise a Skill refuses it, with the reason.
  app.click('[data-raiseopen="skill"]');
  const rr = app.$('#modal [data-raise="skill|handguns"]');
  assert.equal(rr.disabled, true);
  assert.match(rr.closest("tr").textContent, /In training until 10 Milestone Points\./);
  app.click("#modal [data-modalclose]");
  // The chip is on the skill's row.
  assert.match(seeSkillRow(app, "handguns").textContent, /in training · 10 MP/);
  // Log a session: the training lands, in the same commit.
  app.click('[data-sec="sessions"]');
  fill(app, "[data-sesip]", "0");
  app.click("[data-seslog]");
  assert.match(app.$("#undotoast").textContent, /Handguns trained to 6/);
  const c2 = activeChar(app);
  assert.equal(c2.skills.handguns.ipe, 1);
  assert.equal(c2.progression.training, null);
  app.click('[data-sec="progression"]');
  assert.match(app.$("#main .journal").textContent, /Trained: Handguns 5 → 6/);
  assert.doesNotMatch(seeSkillRow(app, "handguns").textContent, /in training/);
  assert.equal(app.window.loadFindings(activeChar(app)).importIssues.length, 0, "a landed training reads as a hand edit");
  // One Undo: the session and the training come back together.
  app.click("[data-toastundo]");
  const c3 = activeChar(app);
  assert.equal(c3.sessions.length, 0);
  assert.equal(c3.skills.handguns.ipe, 0);
  assert.equal(c3.progression.training.skill, "handguns");
  assert.deepEqual(app.errors, []);
});

test("P12b 12b: the manual MP stepper lands a training in its own commit, and deleting a session lands nothing", () => {
  const ch = trainOn(trChar());
  ch.progression.training = { skill: "handguns", mp: 9, credits: 250, date: "2026-10-16T00:00:00.000Z" };
  const app = openSheet(ch, "progression");
  app.click('[data-mp="1"]');
  const c = activeChar(app);
  assert.equal(c.skills.handguns.ipe, 1, "the stepper didn't land the training");
  assert.equal(c.progression.training, null);
  assert.equal(c.progression.ip.log.at(-1).via, "training");
  assert.match(app.$("#undotoast").textContent, /Handguns trained to 6/);
  app.click("[data-toastundo]");
  assert.equal(activeChar(app).skills.handguns.ipe, 0, "Undo left the rank behind");
  assert.equal(activeChar(app).progression.milestonePoints, 9);
  assert.ok(activeChar(app).progression.training, "Undo took the training with it");
  // A session deleted after a training landed leaves the rank.
  const landed = trainOn(trChar());
  Engine.logSession(landed, { title: "x", ipEarned: 0 });                 // MP 10
  landed.skills.handguns.ipe = 1;
  const app2 = openSheet(landed, "sessions");
  app2.click("[data-sesdel]"); app2.click("#modal [data-askyes]");
  assert.equal(activeChar(app2).skills.handguns.ipe, 1);
  assert.deepEqual(app.errors, []);
  assert.deepEqual(app2.errors, []);
});

test("P12b 12c: Train a Skill stays while one runs after the rule is turned off, and a short purse says so", () => {
  const ch = trChar();
  ch.progression.training = { skill: "handguns", mp: 9, credits: 250, date: "2026-10-16T00:00:00.000Z" };
  const app = openSheet(ch, "progression");
  assert.ok(app.$("[data-trainopen]"), "a running training hides its own button when the rule is off");
  app.click("[data-trainopen]");
  assert.match(app.$("#modal").textContent, /Handguns 5 → 6 is in training/);
  const poor = trainOn(trChar());
  poor.trackers.credits.current = 100;
  const app2 = openSheet(poor, "progression");
  app2.click("[data-trainopen]");
  const b = app2.$('#modal [data-train="handguns"]');
  assert.equal(b.disabled, true);
  assert.match(b.closest("tr").textContent, /Needs Ç250; you have Ç100/);
  const none = trainOn(lockedCharacter());
  none.meta.gamedataVersion = D.meta.gamedataVersion;
  const app3 = openSheet(none, "progression");
  app3.click("[data-trainopen]");
  assert.match(app3.$("#modal").textContent, /sharpens a Skill you already have/);
  assert.deepEqual(app.errors, []);
});

// ── P13: the tags wherever an Advantage or Disadvantage is chosen (Decision 232) ──
test("P13 10: the IP lists and Talented's pick show the tags: held for what the character holds, general for a new one", () => {
  const rule = (kind, id) => D[kind === "advantage" ? "advantages" : "disadvantages"].find(d => d.id === id).grants.find(g => g.type === "rule").ruleText;
  const tags = (root, key) => [...root.querySelector(`[data-ipbuy="${key}"]`).closest("tr").querySelectorAll(".effects .etag")].map(t => t.textContent);
  const ch = p12Char();
  ch.advantages = [{ id: "bullseye", rank: 2, notes: "" }, { id: "hard-to-kill", rank: 2, notes: "" }];
  ch.disadvantages = [{ id: "blood-lust", rank: 1, notes: "" }];
  const app = openSheet(ch, "progression");
  // IP buy list for Advantages.
  app.click('[data-ipopen="advantage"]');
  assert.deepEqual(tags(app.$("#modal"), "advantage|bullseye"), ["Called Shots: +6 damage."]);
  assert.deepEqual(tags(app.$("#modal"), "advantage|hard-to-kill"), ["+2 max HP on every Health Level"]);
  assert.deepEqual(tags(app.$("#modal"), "advantage|ambidextrous"), [rule("advantage", "ambidextrous")], "a new one reads its general line");
  assert.deepEqual(tags(app.$("#modal"), "advantage|educated"), ["+10 Skill Points per rank"], "a new one's computed tag is the per-rank rule");
  app.click("#modal [data-modalclose]");
  // IP buy-off for Disadvantages: both of Blood Lust's tags, and its fold stays.
  app.click('[data-ipopen="disadvantage"]');
  const bl = D.disadvantages.find(d => d.id === "blood-lust");
  // P20a: its Sanity cut (a computed row, held and unheld alike for one rank), P19: its rule rows, then the chip for the die face it computes.
  assert.deepEqual([...tags(app.$("#modal"), "disadvantage|blood-lust")], ["Max SAN −5", ...bl.grants.filter(g => g.type === "rule").map(g => g.ruleText), "Combat Sense checks fail on a natural 2 or 3 after you fail first blood's Sanity Check, for the encounter (a 1 still botches)"]);
  assert.ok(app.$('#modal [data-ipbuy="disadvantage|blood-lust"]').closest("tr").nextElementSibling.querySelector("details.ip-desc"), "What it says is gone");
  app.click("#modal [data-modalclose]");
  assert.deepEqual(app.errors, []);
  // Talented's pick: "Raise one you hold" held, "Take a new one" general.
  const t = openSheet(p6Char("professional", 100), "progression");
  t.window.eval(`S.ch.advantages = [{ id: "bullseye", rank: 2, notes: "" }]; update();`);
  t.click('[data-takeminor="talented"]');
  const row = id => t.$(`#modal [data-mcpick="${id}"]`).closest("tr");
  const rowTags = id => [...row(id).querySelectorAll(".effects .etag")].map(x => x.textContent);
  assert.deepEqual(rowTags("bullseye"), ["Called Shots: +6 damage."]);
  assert.deepEqual(rowTags("ambidextrous"), [rule("advantage", "ambidextrous")]);
  assert.deepEqual(t.errors, []);
  // Redeemed's pick (a Disadvantage to lower a rank of) shows the held tags too.
  const r = openSheet(p6Char("professional", 100), "progression");
  r.window.eval(`S.ch.disadvantages = [{ id: "blood-lust", rank: 1, notes: "" }]; update();`);
  r.click('[data-takeminor="redeemed"]');
  const rr = [...r.$('#modal [data-mcpick="blood-lust"]').closest("tr").querySelectorAll(".effects .etag")].map(x => x.textContent);
  assert.deepEqual(rr, ["Max SAN −5", ...bl.grants.filter(g => g.type === "rule").map(g => g.ruleText), "Combat Sense checks fail on a natural 2 or 3 after you fail first blood's Sanity Check, for the encounter (a 1 still botches)"], "Redeemed's pick has no tags");
  assert.deepEqual(r.errors, []);
});
