/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: Training, the tags on pickers, the Session Log inside Progression, and the pickers' plain buttons. Its other half is smoke-sheet-progression-spend.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { Engine, D, lockedCharacter, openSheet, activeChar, pick, fill, p6Char, p12Char } from "./smokekit.mjs";

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
  app.click('[data-sec="progression"]');
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

// ── E2a: Session Log is part of Progression (Decision 281) ─────────────

test("Decision 281: a sheet saved on Session Log opens on Progression, with the log, IP, Milestones, History and the Activity Log", () => {
  const ch = lockedCharacter();
  ch.sessions = [{ date: "2026-10-01", title: "One", notes: "", ipEarned: 10, milestonePoint: true },
                 { date: "2026-10-08", title: "Two", notes: "", ipEarned: 5, milestonePoint: false }];
  // Not openSheet: it presses the tab afterwards, which would hide a missing LEGACY_SECTION entry.
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "sessions" } } });
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent)).dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.equal(app.window.eval("S.section"), "progression");
  for (const sel of ["[data-seslog]", "[data-ipgrant]", "[data-takeminor]", "[data-undolast]"])
    assert.ok(app.$(`#main ${sel}`), `Progression lacks ${sel}`);
  assert.deepEqual(app.$$("#main .jumpbar [data-jump]").map(b => b.textContent), ["Log a session", "IP", "Milestones", "History", "Activity Log"]);
  assert.equal(app.$$("#main h1.step-title").length, 1, "two page titles");
  // Log a session there, then Undo there: one Undo takes it back.
  app.$("#main [data-seshours]").value = "2";
  app.$("#main [data-seshours]").dispatchEvent(new app.window.Event("input", { bubbles: true }));
  app.click("#main [data-seslog]");
  assert.equal(activeChar(app).sessions.length, 3);
  app.click("#main button[data-undolast]");
  assert.equal(activeChar(app).sessions.length, 2, "one Undo didn't take the session back");
  assert.deepEqual(app.errors, []);
});

test("Decision 281: Undo on Progression peels back an action taken on another tab", () => {
  const app = openSheet(lockedCharacter(), "main");
  const before = activeChar(app).trackers.damage;
  app.click(`[data-dmg="1"]`);
  assert.notEqual(activeChar(app).trackers.damage, before, "Hurt didn't land");
  app.click('[data-sec="progression"]');
  app.click("#main button[data-undolast]");
  assert.equal(activeChar(app).trackers.damage, before);
  assert.deepEqual(app.errors, []);
});

test("Decision 281: opening every tab, a saved Session Log included, writes nothing to the character", () => {
  const ch = lockedCharacter();
  const app = openSheet(ch, "main");
  const before = JSON.stringify(activeChar(app));
  for (const sec of ["skills", "character", "trackers", "progression", "loadout", "notes", "main"]) app.click(`[data-sec="${sec}"]`);
  assert.equal(JSON.stringify(activeChar(app)), before, "a tab changed the stored character");
  const old = boot({ storage: { "shadows.active.v1": { ch, section: "sessions" } } });
  old.$$("#main button").find(b => /Open sheet/.test(b.textContent)).dispatchEvent(new old.window.MouseEvent("click", { bubbles: true }));
  assert.equal(JSON.stringify(activeChar(old)), before, "opening a sheet saved on Session Log changed the character");
  assert.deepEqual([app.errors, old.errors], [[], []]);
});

// E5: the intros are the city's lines, from appCopy, not a second copy in sheet.js.
// K1: Character's, Loadout's and Notes' intros moved into sheetGuide as their tab's guide line, word for word. The three that state a
// rule keep their appCopy line (a rule line), which now sits under the guide line.
const INTROS = { skills: "introSkills", progression: "introProgression" };

const GUIDE_ONLY = { character: "What you are and what it gives you, then the Advantages and Disadvantages you carry.", loadout: "Weapons, armor and gear: what you carry into the city.", notes: "Freeform. The city keeps receipts — so should you." };

const introOf = (key) => D.appCopy[key].replace("{perHour}", String(D.ip.perHour));

const RULE = "#main h1.step-title + [data-guide] + .step-note";

test("E5: each tab's intro is its appCopy line, or the guide line it moved into", () => {
  const app = openSheet(lockedCharacter(), "main");
  for (const [sec, key] of Object.entries(INTROS)) {
    app.click(`[data-sec="${sec}"]`);
    const note = app.$(RULE);
    assert.ok(note, `${sec} has no rule line under its guide line`);
    assert.equal(note.textContent, introOf(key), `${sec}'s rule line isn't appCopy.${key}`);
    assert.doesNotMatch(note.textContent, /\bTap\b/, `${sec}'s intro tells the player how to use the app`);
  }
  for (const [sec, text] of Object.entries(GUIDE_ONLY)) {
    app.click(`[data-sec="${sec}"]`);
    const note = app.$("#main h1.step-title + [data-guide]");
    assert.ok(note, `${sec} has no guide line under its title`);
    assert.equal(note.textContent, D.sheetGuide.contexts[sec].intro, `${sec}'s guide line isn't sheetGuide's`);
    assert.equal(note.textContent, text, `${sec}'s line moved a word`);
    assert.doesNotMatch(note.textContent, /\bTap\b/, `${sec}'s intro tells the player how to use the app`);
  }
  // Admin isn't a [data-sec] tab: the menu opens it
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  const admin = app.$(RULE);
  assert.equal(admin && admin.textContent, introOf("introAdmin"), "Admin's intro isn't appCopy.introAdmin");
  assert.doesNotMatch(admin.textContent, /\bTap\b/, "Admin's intro tells the player how to use the app");
  assert.deepEqual(app.errors, []);
});

test("E5: Manual Adjustments doesn't ask for a Minor that applies itself", () => {
  const chosen = D.milestones.minorShared.filter(m => m.choice);
  assert.ok(chosen.length, "no Minor has a choice, so the check proves nothing");
  const app = openSheet(lockedCharacter(), "trackers");
  const sect = [...app.$$("#main .sect")].find(s => /Manual Adjustments/.test(s.textContent));
  const note = sect.nextElementSibling.textContent, why = app.$("[data-adjnote]").getAttribute("placeholder");
  for (const m of chosen) {
    const name = String(m.name || m.id).toLowerCase();
    assert.ok(!note.toLowerCase().includes(name), `the note names ${name}, which applies itself (Decision 217)`);
    assert.ok(!why.toLowerCase().includes(name), `the placeholder names ${name}`);
  }
  assert.doesNotMatch(note, /engine/i);
});

// E8: each intro's listed words are triggers; their text is still appCopy's.
test("E8 5: the intros' terms are triggers, and their text is still appCopy's", () => {
  const triggers = el => [...el.querySelectorAll('[data-tip="term"]')].map(t => t.textContent);
  const app = openSheet(lockedCharacter(), "main");
  const want = { skills: ["Rank"], progression: ["Milestone Point", "LUCK"] };
  for (const [sec, key] of Object.entries(INTROS)) {
    app.click(`[data-sec="${sec}"]`);
    const note = app.$(RULE);
    assert.equal(note.textContent, introOf(key), `${sec}'s text moved`);
    if (want[sec]) assert.deepEqual(triggers(note), want[sec], `${sec}'s triggers`);
  }
  app.click('[data-sec="skills"]');
  assert.equal(app.$$(`${RULE} [data-tip="term"][data-term^="skill-check"]`).length, 1, "Skills' intro has one skill-check trigger");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  const admin = app.$(RULE);
  assert.equal(admin.textContent, introOf("introAdmin"));
  assert.deepEqual(app.errors, []);
});

// E4: the spend buttons are peers; Log session is the page's one commitment.
test("E4 4: Progression's spend buttons are peers, and Log session is the one commitment", () => {
  const ch = lockedCharacter();
  ch.disadvantages = [{ id: D.disadvantages[0].id, rank: 1 }];
  assert.ok(Engine.disById(D.disadvantages[0].id), "the fixture's Disadvantage isn't one the sheet knows");
  const app = openSheet(ch, "progression");
  const row = app.$$("#main .raise-row .btn");
  assert.ok(row.length >= 5, `only ${row.length} spend buttons drew`);
  assert.ok(app.$('#main .raise-row [data-ipopen="disadvantage"]'), "the Disadvantage buy-off button didn't draw, so the row is short of five");
  assert.equal(app.$$("#main .raise-row .btn.primary").length, 0, "a spend button is still primary");
  assert.equal(app.$$("#main [data-seslog].btn.go").length, 1);
  assert.deepEqual(app.errors, []);
});

// E6: the phone grid is for Progression's spend row; Minor choice's row keeps its own layout.
test("E6 5: Progression's spend row carries its hook, and Minor choice's row doesn't", () => {
  const ch = lockedCharacter();
  ch.disadvantages = [{ id: D.disadvantages[0].id, rank: 1 }];
  assert.ok(Engine.disById(D.disadvantages[0].id), "the fixture's Disadvantage isn't one the sheet knows");
  const app = openSheet(ch, "progression");
  const rows = app.$$("#main .raise-row");
  assert.equal(rows.length, 1, "Progression draws more than one .raise-row");
  assert.ok(rows[0].querySelectorAll(".btn").length >= 5, "the fixture's spend row is short of five buttons");
  assert.ok(rows[0].classList.contains("spend"), "Progression's spend row has no hook");
  const hurt = p6Char("professional", 5); hurt.trackers.san.loss = 12; hurt.trackers.massiveLevels = 1;
  const app2 = openSheet(hurt, "progression");
  app2.click('[data-takeminor="steadied"]');
  const modalRow = app2.$("#modal .raise-row");
  assert.ok(modalRow && modalRow.querySelectorAll("[data-mcpick]").length >= 2, "Minor choice's row didn't draw its options");
  assert.ok(!modalRow.classList.contains("spend"), "Minor choice's row carries the spend hook");
  assert.deepEqual([app.errors, app2.errors], [[], []]);
});

// ── E7: a list's rows are peers (E4's EQ48, applied to the pickers) ──
// Five pickers, five separate sites: each is opened on its own and read on its own, so a mutation at one site fails here for that site.

{
  const rowsOf = (app, sel) => {
    const bs = app.$$(`#modal ${sel}`);
    assert.ok(bs.length >= 2, `${sel}: ${bs.length} rows drew, two wanted`);
    return bs;
  };
  const peers = (app, sel) => {
    for (const b of rowsOf(app, sel)) {
      assert.ok(b.classList.contains("btn") && b.classList.contains("sm"), `${sel}: a row button isn't .btn.sm`);
      assert.ok(!b.classList.contains("primary"), `${sel}: a row button is still primary`);
    }
  };
  test("E7 6a: the catalog's Buy rows are peers", () => {
    const ch = lockedCharacter(); ch.trackers.credits.current = 1500;
    const app = openSheet(ch, "loadout");
    app.click('[data-lobrowse="weapons"]');
    peers(app, "[data-catbuy]");
    assert.deepEqual(app.errors, []);
  });
  test("E7 6b: Raise a Stat's rows are peers", () => {
    const ch = p12Char(); const app = openSheet(ch, "progression");
    app.click('[data-raiseopen="stat"]');
    peers(app, "[data-raise]");
    assert.deepEqual(app.errors, []);
  });
  test("E7 6c: Buy an Advantage's rows are peers, and the Restore buttons keep primary", () => {
    const ch = p12Char(); ch.trackers.san.loss = 12; ch.trackers.massiveLevels = 2;
    const app = openSheet(ch, "progression");
    app.click('[data-ipopen="advantage"]');
    peers(app, "[data-ipbuy]");
    app.click("#modal [data-modalclose]");
    app.click('[data-ipopen="restore"]');
    const rs = app.$$("#modal .ip-restore [data-ipbuy]");
    assert.equal(rs.length, 2, "the SAN and Health Level restore buttons didn't both draw");
    for (const b of rs) assert.ok(b.classList.contains("primary"), "a Restore button lost primary");
    assert.deepEqual(app.errors, []);
  });
  test("E7 6d: Add a style's rows are peers", () => {
    const ch = lockedCharacter(); ch.identity.archetype = "professional"; ch.meta.gamedataVersion = D.meta.gamedataVersion;
    ch.skills["martial-arts"] = { rank: 2, ipe: 0, selections: { style: ["karate"] } };
    const app = openSheet(ch, "main");
    app.click('#main [data-addstyle="martial-arts"]');
    peers(app, "[data-addpick]");
    assert.deepEqual(app.errors, []);
  });
  test("E7 6e: Train a Skill's rows are peers", () => {
    const c = lockedCharacter(); c.identity.archetype = "professional"; c.meta.gamedataVersion = D.meta.gamedataVersion;
    c.skills.handguns = { rank: 5, ipe: 0 }; c.skills.melee = { rank: 4, ipe: 0 };
    c.progression.milestonePoints = 9; c.trackers.credits.current = 1250; c.houseRules.training = true;
    const app = openSheet(c, "progression");
    app.click("[data-trainopen]");
    peers(app, "[data-train]");
    assert.deepEqual(app.errors, []);
  });
  test("E7 6f: a Condition's Add keeps primary once a body part is picked", () => {
    const app = openSheet(lockedCharacter(), "main");
    app.click('[data-condquick="injured"]');
    const add = app.$("[data-condadd]");
    assert.ok(add, "Injured drew no Add");
    assert.ok(add.classList.contains("primary"), "Add lost primary");
    assert.deepEqual(app.errors, []);
  });
}

// ── E7 (Ken: "Plain in this PR"): the Pick lists' buttons are plain until picked, then `go`; the foot keeps primary ──

const pickClasses = (app, sel, attr) => app.$$(`#modal ${sel}`).filter(b => !b.disabled).map(b => ({ id: b.getAttribute(attr), cls: [...b.classList] }));

test("E7 6g: a Minor choice's rows are plain until picked, then go", () => {
  const ch = p6Char("professional", 5); ch.skills.dodge = { rank: 10, ipe: 0 };
  const app = openSheet(ch, "progression");
  app.click('[data-takeminor="skilled"]');
  const before = pickClasses(app, "[data-mcpick]", "data-mcpick");
  assert.ok(before.length >= 2, `${before.length} pickable rows, two wanted`);
  for (const b of before) assert.ok(b.cls.includes("sm") && !b.cls.includes("primary") && !b.cls.includes("go"), `${b.id} is ${b.cls}`);
  app.click(`#modal [data-mcpick="${before[0].id}"]`);
  const after = pickClasses(app, "[data-mcpick]", "data-mcpick");
  assert.ok(after.find(b => b.id === before[0].id).cls.includes("go"), "a picked row isn't go");
  for (const b of after.filter(b => b.id !== before[0].id)) assert.ok(!b.cls.includes("primary") && !b.cls.includes("go"), `${b.id} is ${b.cls}`);
  assert.ok(app.$("#modal [data-mctake]").classList.contains("primary"), "the foot's Take lost primary");
  assert.deepEqual(app.errors, []);
});

test("E7 6h: a Minor choice's restore buttons are plain until picked, then go", () => {
  const hurt = p6Char("professional", 5); hurt.trackers.san.loss = 12; hurt.trackers.massiveLevels = 1;
  const app = openSheet(hurt, "progression");
  app.click('[data-takeminor="steadied"]');
  const before = [...app.$$("#modal .raise-row [data-mcpick]")];
  assert.ok(before.length >= 2, `${before.length} restore buttons, two wanted`);
  for (const b of before) assert.ok(b.classList.contains("btn") && !b.classList.contains("primary") && !b.classList.contains("go"), `${b.dataset.mcpick} is ${b.className}`);
  app.click('#modal [data-mcpick="massiveLevel"]');
  assert.ok(app.$('#modal [data-mcpick="massiveLevel"]').classList.contains("go"), "a picked restore isn't go");
  assert.ok(!app.$('#modal [data-mcpick="san"]').classList.contains("primary"), "the unpicked restore is primary");
  assert.ok(app.$("#modal [data-mctake]").classList.contains("primary"), "the foot's Take lost primary");
  assert.deepEqual(app.errors, []);
});
