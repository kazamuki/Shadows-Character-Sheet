/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: written-in archetypes, the Werewolf and the Vampire.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, stored } from "./harness.mjs";
import { Engine, D, lockedCharacter, onArchetypeStep, onStep, CRANK_ON, openSheet, activeChar, arcanistOnCP, draft, withDownloads, named, card, writtenInCharacter, focused, lockedVampire, fill } from "./smokekit.mjs";

// ── A written-in archetype on the sheet (Decision 153, custom archetype S4) ──
// Decision 158: Traits and Archetype are one Character tab. A saved section
// from before lands on it, its jump bar reaches every section, Expand all
// opens every Advantage and Disadvantage and is remembered, and the buttons
// at its foot go to Loadout & Powers and Trackers.
test("Character: the archetype, then Advantages beside Disadvantages, one tab, with Expand all (Decision 158)", () => {
  const ch = lockedCharacter();
  ch.advantages = [{ id: D.advantages[0].id, rank: 1 }];
  ch.disadvantages = [{ id: D.disadvantages[0].id, rank: 1 }];
  for (const legacy of ["traits", "archetype"]) {
    const app = boot({ storage: { "shadows.active.v1": { ch, section: legacy } } });
    app.$$("#main button").find(b => /Open sheet/.test(b.textContent))
      .dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
    assert.equal(app.$(".tab.active").dataset.sec, "character", `a saved "${legacy}" section didn't land on Character`);
  }
  const app = openSheet(ch, "character");
  assert.deepEqual(app.errors, []);
  const jumps = app.$$("#main .jumpbar [data-jump]").map(b => b.textContent);
  for (const s of ["Archetype", "Baseline Traits", "Advantages", "Disadvantages", "Magic reference"]) assert.ok(jumps.includes(s), `the jump bar has no ${s}: ${jumps}`);
  assert.ok(app.$("#main .jumpbar.sticky"), "the jump bar doesn't stay in view");
  assert.equal(app.$$("#main .trait-cols > .trait-col").length, 2, "Advantages and Disadvantages aren't two columns");
  assert.match(app.$$("#main .trait-col")[0].textContent, new RegExp(D.advantages[0].name));
  assert.match(app.$$("#main .trait-col")[1].textContent, new RegExp(D.disadvantages[0].name));

  // Decision 168: the archetype beside its core mechanic, its parts in one
  // flow of columns, and each side's cards in a grid as many across as fit.
  const top = app.$$("#main .arch-top > .arch-top-part");
  assert.equal(top.length, 2, "the archetype and its core mechanic aren't one band");
  assert.match(top[0].textContent, /Arcanist/);
  assert.match(top[1].textContent, new RegExp(D.archetypes.find(a => a.id === "arcanist").coreMechanic.name));
  const parts = app.$$("#main .arch-flow > .arch-part").map(p => p.querySelector(".sect").textContent);
  assert.ok(parts[0] === "Baseline Traits" && parts.includes("Disciplines"), `the archetype's parts aren't one flow: ${parts}`);
  assert.equal(app.$$("#main .trait-col > .trait-grid details.pick.trait").length, 2, "the trait cards aren't in a grid");

  const cards = () => app.$$("#main details.pick.trait");
  assert.ok(cards().length === 2 && cards().every(d => !d.open), "trait cards should start closed");
  app.click("[data-traits-all]");
  assert.ok(cards().every(d => d.open), "Expand all didn't open every card");
  assert.equal(app.$("[data-traits-all]").textContent, "Collapse all");
  app.click('[data-sec="main"]'); app.click('[data-sec="character"]');
  assert.ok(cards().every(d => d.open), "Expand all wasn't remembered across a re-render");
  app.click("[data-traits-all]");
  assert.ok(cards().every(d => !d.open), "Collapse all didn't close every card");

  app.click('[data-gotab="trackers"]');
  assert.equal(app.$(".tab.active").dataset.sec, "trackers", "the Trackers button didn't go to Trackers");
});

// Decision 159: Raise a Stat and Raise a Skill are buttons that open a modal,
// so the Milestones aren't below two long lists. A raise is one undoable IP
// spend and the modal stays open with the new prices; a raise you can't
// afford is off and says why.
test("Progression: Raise a Stat and Raise a Skill open modals, and a raise keeps it open (Decision 159)", () => {
  const ch = lockedCharacter();
  ch.progression.ip.earned = 60;
  const skill = D.skills[0];
  ch.skills[skill.id] = { rank: 2 };
  const app = openSheet(ch, "progression");
  assert.equal(app.$$("#main [data-raiseopen]").length, 3, "an Arcanist's Progression lacks Raise a Stat, a Skill or a Power");
  assert.ok(!app.$("#main [data-raise]"), "the raise lists are still on the page");
  const modal = () => app.$("#modal");

  app.click('[data-raiseopen="stat"]');
  assert.ok(modal().open, "Raise a Stat didn't open a modal");
  assert.match(modal().textContent, /You have 60 IP/);
  app.click('#modal [data-raise="stat|BOD"]');            // 5 → 6 for 50 IP
  assert.equal(activeChar(app).stats.BOD.ipe, 1, "the raise didn't land");
  assert.ok(modal().open, "the modal closed after one raise");
  assert.match(modal().textContent, /You have 10 IP/, "the modal's IP didn't refresh");
  const bod = app.$('#modal [data-raise="stat|BOD"]');
  assert.ok(bod.disabled && /Needs 60 IP; you have 10\./.test(bod.closest("tr").textContent), "an unaffordable raise doesn't say why");
  app.click("#modal [data-modalclose]");
  assert.ok(!modal().open);

  app.click('[data-raiseopen="skill"]');
  assert.match(modal().textContent, /Your skills[\s\S]*Learn a new skill/);
  const q = app.$("#modal [data-raiseq]");
  q.value = skill.name; q.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  assert.ok(app.$(`#modal [data-raise="skill|${skill.id}"]`), "searching hid the skill it names");
  assert.ok(!app.$(`#modal [data-raise="skill|${D.skills.find(s => !s.name.includes(skill.name) && !(s.description||"").includes(skill.name)).id}"]`), "the search didn't narrow the list");
  assert.deepEqual(app.errors, []);
});

test("Raise a Power: a Discipline and a written power rise on Progression, the journal says from what to what, and a Professional gets Custom power only (Decisions 194, 216)", () => {
  const ch = lockedCharacter();
  ch.progression.ip.earned = 100;
  const evo = Engine.disciplineRanks(ch).find(d => d.id === "evocation").rank;
  const app = openSheet(ch, "progression");
  app.click('[data-raiseopen="power"]');
  const modal = app.$("#modal");
  assert.ok(modal.open && /Buy or Raise a Power/.test(modal.textContent), "Buy or Raise a Power didn't open its modal");
  assert.match(modal.textContent, /Evocation[\s\S]*Enchantment[\s\S]*Alchemy/);
  assert.match(app.$('#modal [data-raise="power|alchemy"]').closest("tr").textContent, /Learn|40 IP/);
  app.click('#modal [data-raise="power|evocation"]');
  const c = activeChar(app);
  assert.equal(Engine.disciplineRanks(c).find(d => d.id === "evocation").rank, evo + 1, "the raise didn't land");
  assert.ok(modal.open, "the modal closed after one raise");
  assert.match(modal.textContent, new RegExp(`You have ${100 - 20 * evo} IP`), "the modal's IP didn't refresh");
  app.click("#modal [data-modalclose]");
  assert.match(app.$("#main .journal").textContent, new RegExp(`Evocation ${evo} → ${evo + 1}`), "the journal doesn't say what the raise bought");
  assert.deepEqual(app.errors, []);

  const w = writtenInCharacter(); w.progression.ip.earned = 100;
  const wapp = openSheet(w, "progression");
  wapp.click('[data-raiseopen="power"]');
  wapp.click(`#modal [data-raise="power|${w.powers[0].id}"]`);
  wapp.click("#modal [data-modalclose]");
  wapp.click(`[data-sec="${loadoutSec(wapp)}"]`);
  assert.match(wapp.$(".pw-card").textContent, /Fade\s*rank 2/, "Loadout doesn't show the written power's new rank");
  assert.deepEqual(wapp.errors, []);

  const pro = lockedCharacter(); pro.identity.archetype = "professional";
  const papp = openSheet(pro, "progression");
  assert.equal(papp.$('[data-raiseopen="power"]').textContent, "Buy or Raise a Power", "a Professional isn't offered the button");
  papp.click('[data-raiseopen="power"]');
  assert.ok(!papp.$("#modal [data-raise]") && papp.$("#modal [data-pwcustom-go]"), "a Professional's modal is more than Custom power");
});

// Decision 160: the vitals panel pins beside the sheet. The pin is the
// browser's (CSS honours it from 1280px, which jsdom can't lay out), the
// panel's vitals open the same popovers as the bar, from the panel, and
// Unpin puts it back.
test("Pinned vitals: Pin keeps the panel, its vitals open their popovers, Unpin returns the bar (Decision 160)", () => {
  const app = openSheet(lockedCharacter(), "skills");
  const body = app.window.document.body, drawer = () => app.$("#vdrawer");
  assert.ok(!body.classList.contains("vitals-pinned"), "pinned before anyone asked");
  app.click("#vdrawer [data-vitals-pin]");
  assert.ok(body.classList.contains("vitals-pinned"), "Pin didn't pin");
  assert.equal(app.window.localStorage.getItem("shadows.ui.vitalsPinned"), "pinned", "the pin isn't remembered");
  assert.equal(drawer().querySelector("[data-vitals-pin]").textContent, "Unpin");
  for (const k of ["hp", "pain", "san", "luck", "cred"]) assert.ok(drawer().querySelector(`[data-vpop="${k}"]`), `the panel's ${k} doesn't open anything`);

  app.click('#vdrawer [data-vpop="luck"]');
  const pop = app.$("#vpop");
  assert.ok(!pop.hidden && pop.classList.contains("from-rail"), "the panel's LUCK didn't open its popover from the panel");
  assert.match(pop.textContent, /Boost the roll/);
  assert.equal(drawer().querySelector('[data-vpop="luck"]').getAttribute("aria-expanded"), "true");
  app.click('#main [data-vpop="luck"]');                  // the bar's own LUCK is a different trigger
  assert.ok(!pop.hidden && !pop.classList.contains("from-rail"), "the bar's LUCK didn't take the popover over");

  app.click('[data-sec="main"]');
  assert.ok(body.classList.contains("vitals-pinned") && drawer().querySelector('[data-vpop="hp"]'), "the panel left Main");
  app.click("#vdrawer [data-vitals-pin]");
  assert.ok(!body.classList.contains("vitals-pinned"), "Unpin didn't unpin");
  assert.equal(app.window.localStorage.getItem("shadows.ui.vitalsPinned"), "unpinned");
  assert.deepEqual(app.errors, []);
});

// W58's harden re-run: Home and the wizard only closed the flyout, so a
// pinned panel stayed beside them with the last character's numbers in it.
test("W58: a pinned panel goes with the sheet, to Home and on into the wizard", () => {
  const app = openSheet(lockedCharacter(), "skills");
  const body = app.window.document.body, drawer = () => app.$("#vdrawer");
  app.click("#vdrawer [data-vitals-pin]");
  assert.ok(body.classList.contains("vitals-pinned"), "Pin didn't pin");
  app.click("[data-menu-toggle]"); app.click("[data-home]");
  assert.ok(!body.classList.contains("vitals-pinned"), "Home kept the pinned panel beside it");
  assert.equal(drawer().innerHTML, "", "Home kept the last character's vitals in the panel");
  assert.equal(drawer().getAttribute("aria-hidden"), "true");
  app.click("#btn-new");
  assert.ok(!body.classList.contains("vitals-pinned") && !drawer().innerHTML, "the wizard kept the pinned panel");
  assert.equal(app.window.localStorage.getItem("shadows.ui.vitalsPinned"), "pinned", "leaving the sheet forgot the pin");
  assert.deepEqual(app.errors, []);
});

// W58: the closed flyout is inert, so Tab can't walk into controls nobody
// can see. jsdom doesn't implement inert, so these pin the attribute and
// where focus goes; real Chromium is what proves Tab skips it.
const esc = app => (app.window.document.activeElement || app.window.document.body)
  .dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));

test("W58: closed, the flyout is inert on every tab; open, focus goes in; closed again, it comes back to the toggle", () => {
  const app = openSheet(lockedCharacter(), "skills");
  const drawer = () => app.$("#vdrawer");
  for (const sec of ["main", "skills", "character", "trackers", "loadout"]) {
    app.click(`[data-sec="${sec}"]`);
    assert.ok(drawer().hasAttribute("inert"), `the closed flyout takes focus on ${sec}`);
    assert.equal(drawer().getAttribute("aria-hidden"), "true");
  }
  app.click('[data-sec="skills"]');
  app.click("#main [data-vitals-toggle]");
  assert.ok(!drawer().hasAttribute("inert") && drawer().classList.contains("open"), "the toggle didn't open it");
  assert.ok(focused(app).matches("#vdrawer [data-vitals-close]"), "opening left focus behind on the toggle");
  app.click("#vdrawer [data-vitals-close]");
  assert.ok(drawer().hasAttribute("inert"), "closed, it isn't inert");
  assert.ok(focused(app).matches("#main [data-vitals-toggle]"), "closing didn't hand focus back to the toggle");
  app.click("#main [data-vitals-toggle]");
  app.click("#vscrim");
  assert.ok(drawer().hasAttribute("inert") && focused(app).matches("#main [data-vitals-toggle]"), "the scrim left focus nowhere");
  assert.deepEqual(app.errors, []);
});

test("W58: Esc closes one layer, and a move to another tab closes the flyout", () => {
  const app = openSheet(lockedCharacter(), "skills");
  const drawer = () => app.$("#vdrawer");
  app.click("#main [data-vitals-toggle]");
  app.click('#vdrawer [data-vpop="luck"]');
  assert.ok(!app.$("#vpop").hidden, "the flyout's LUCK didn't open its popover");
  esc(app);
  assert.ok(app.$("#vpop").hidden, "Esc didn't close the popover");
  assert.ok(drawer().classList.contains("open") && !drawer().hasAttribute("inert"), "one Esc closed the flyout under the popover too");
  assert.ok(focused(app).matches('#vdrawer [data-vpop="luck"]'), "focus didn't go back to the row that opened the popover");
  esc(app);
  assert.ok(drawer().hasAttribute("inert") && focused(app).matches("#main [data-vitals-toggle]"), "the second Esc didn't close the flyout");

  app.click("#main [data-vitals-toggle]");
  app.click('[data-sec="main"]');
  assert.ok(!drawer().classList.contains("open") && drawer().hasAttribute("inert"), "the flyout followed the player to Main");
  assert.deepEqual(app.errors, []);
});

test("W58: pinned with room is not closed, and crossing 1280px with focus in the panel hands it to the toggle", () => {
  const app = openSheet(lockedCharacter(), "skills", { width: 1400 });
  const drawer = () => app.$("#vdrawer");
  app.click("#main [data-vitals-toggle]");
  app.click("#vdrawer [data-vitals-pin]");
  assert.ok(!drawer().hasAttribute("inert") && drawer().getAttribute("aria-hidden") === "false", "the pinned panel is inert");
  app.$('#vdrawer [data-vpop="hp"]').focus();
  app.resize(1000);
  assert.ok(drawer().hasAttribute("inert"), "narrower than the pin, the panel isn't inert");
  assert.ok(focused(app).matches("#main [data-vitals-toggle]"), "focus stayed in the panel as it left");
  app.resize(1400);
  assert.ok(!drawer().hasAttribute("inert") && drawer().getAttribute("aria-hidden") === "false", "back past 1280px the pinned panel is still inert");
  assert.deepEqual(app.errors, []);
});

// W45: on a phone every tab spent a third of the screen before its content.
// jsdom has no layout, so these pin the structure; `npm run phone-check`
// measures the rows and the fold in real Chromium.
test("W45: Main puts combat before Stats, and no sheet tab carries the Live Sheet eyebrow", () => {
  const app = openSheet(lockedCharacter(), "main");
  const grid = [...app.$("#main .main-grid").children].map(e => e.className);
  assert.deepEqual(grid, ["main-combat", "main-stats"], "Stats come before the weapon on a phone");
  for (const sec of ["main", "skills", "character", "trackers", "progression", "sessions", "loadout", "notes"]) {
    app.click(`[data-sec="${sec}"]`);
    assert.ok(!app.$("#main .eyebrow"), `the ${sec} tab still opens on an eyebrow`);
  }
  assert.deepEqual(app.errors, []);
});

test("W45: the vitals bar and the sheet's jump bars are one row each, with what rides with them outside the scroller", () => {
  const ch = lockedCharacter(); ch.advantages.push({ id: "danger-sense", rank: 1, notes: "" });
  const app = openSheet(ch, "skills");
  const row = app.$("#main .vbar > .vbar-row.scroll-row");
  assert.ok(row && row.querySelector('[data-vpop="hp"]'), "the vitals bar's pills aren't in a sideways row");
  assert.ok(app.$("#main .vbar > [data-vitals-toggle]") && !row.querySelector("[data-vitals-toggle]"),
    "the Vitals toggle scrolls away with the pills");
  app.click('[data-sec="character"]');
  assert.ok(app.$("#main .jumpbar.row > .jump-row.scroll-row [data-jump]"), "Character's jump bar isn't one row");
  assert.ok(app.$("#main .jumpbar.row > [data-traits-all]"), "Expand all scrolls away with the chips");
  app.click(`[data-sec="${loadoutSec(app)}"]`);
  assert.ok(app.$("#main .jumpbar.row .jump-row [data-jump]"), "Loadout's jump bar isn't one row");
  // Step 7's bar keeps its filter and wraps, as before.
  const wiz = arcanistOnCP();
  assert.ok(wiz.$("#main .jumpbar.sticky [data-jumpfilter]") && !wiz.$("#main .jumpbar.row"), "step 7's bar changed");
  assert.deepEqual([...app.errors, ...wiz.errors], []);
});

test("W45: CRANK alone takes its row (Decision 169), and Pin is reachable from Main", () => {
  const app = openSheet(lockedCharacter(), "main", { width: 1400, storage: CRANK_ON });   // Pin shows from 1280px
  assert.ok(!app.$("#main .cond.sfr"), "the fixture grew an SFR card");
  assert.ok(app.$("#main .cond.cred") && app.$("#main .cond.crank") && !app.$("#main .cond.alone"), "without SFR, Çredits and CRANK share a row");
  // With SFR the row above is full, so CRANK takes the next one alone.
  const sfr = lockedCharacter(); sfr.identity.archetype = "werewolf";
  const withSfr = openSheet(sfr, "main", { width: 1400, storage: CRANK_ON });
  assert.ok(withSfr.$("#main .cond.sfr"), "the werewolf fixture has no SFR card");
  assert.ok(withSfr.$("#main .cond.crank.alone"), "CRANK doesn't know it's alone on its row");
  assert.ok(!withSfr.$("#main .cond.cred.alone"), "Çredits shares the row with SFR");
  app.click("[data-vitals-pin-main]");
  assert.ok(app.window.document.body.classList.contains("vitals-pinned"), "Pin from Main didn't pin");
  assert.equal(focused(app), app.$("#vdrawer [data-vitals-pin]"), "focus didn't follow the panel to Unpin");
  assert.equal(focused(app).textContent, "Unpin");
  assert.deepEqual(app.errors, []);
});

// W45's harden pass: a name of only spaces is no name, everywhere it shows.
test("W45: a name of only spaces reads Unnamed in the header, Main's heading and the panel", () => {
  const blank = lockedCharacter(); blank.identity.name = "   ";
  const app = openSheet(blank, "main");
  assert.equal(app.$("#brandctx").textContent, "Unnamed", "the header went blank");
  assert.equal(app.$("#main h1").textContent, "Unnamed", "Main's heading went blank");
  assert.equal(app.$("#vdrawer .vname").textContent, "—", "the panel's name went blank");
  assert.equal(app.window.document.title, "Unnamed — Shadows");
  assert.deepEqual(app.errors, []);
});

const loadoutSec = app => app.$$("[data-sec]").map(b => b.dataset.sec).find(s => /loadout/.test(s));

test("the sheet draws a written-in archetype: its name everywhere, its classification, traits, powers and vulnerabilities", () => {
  const home = boot({ storage: { "shadows.active.v1": { ch: writtenInCharacter(), section: "main" } } });
  assert.match(home.$("#main .roster-card").textContent, /Changeling/, "Home's roster names the archetype's data name");
  const app = openSheet(writtenInCharacter(), "character");
  const main = () => app.$("#main").textContent;
  assert.equal(app.$("#chr-0").textContent, "Changeling", "the Character tab doesn't open on the archetype's name");
  const parts = app.$$("#main .arch-flow > .arch-part").map(p => p.querySelector(".sect").textContent);
  for (const s of ["Baseline Traits", "Powers", "Vulnerabilities"]) assert.ok(parts.includes(s), `${s} isn't in the archetype's flow: ${parts}`);
  assert.match(app.$("#main .arch-class").textContent, /Other: Fae/);
  for (const t of ["Glamour", "Fade", "uses SFR", "Cold iron", "Stolen as a child."]) assert.ok(main().includes(t), `the Archetype tab is missing ${t}`);
  app.click('[data-sec="main"]');
  assert.match(main(), /Changeling ·/, "Main's header still says the archetype's data name");
  app.click('[data-sec="trackers"]');
  assert.ok(app.$$("#main .trk h2").some(h => h.textContent === "SFR"), "Uses SFR didn't put SFR on Trackers");
  assert.ok(!app.$$("#main .trk h2").some(h => h.textContent === "TOL Spent"), "TOL Spent showed without Uses magic");
  app.click(`[data-sec="${loadoutSec(app)}"]`);
  // Decision 154: in play a power reads as written, its notes free to edit.
  assert.deepEqual(app.$$("[data-pwedit]").map(e => e.dataset.pwedit.split("|")[1]), ["notes"], "a power's words are editable in play");
  assert.match(app.$(".pw-card").textContent, /Fade[\s\S]*uses SFR[\s\S]*Unseen/, "the power doesn't read as written");
  assert.equal(app.$$("[data-pwimprove]").length, 1, "a power has no Improve");
  assert.equal(app.$$("[data-pwdel]").length, 0, "Remove is Admin's, not play's");
  // A built-in archetype draws none of it.
  const b = openSheet(lockedCharacter(), "character");
  assert.equal(b.$("#chr-0").textContent, "Arcanist");
  assert.match(b.$("#main .arch-class").textContent, /Mortal/);
  assert.deepEqual([app.errors, b.errors], [[], []]);
});

test("Add power in play costs a new power's price: the row and the spend are one change, and one Undo takes both (Decision 194)", () => {
  const NEW = D.ip.powerIncreaseCost.newPower;
  const short = openSheet(writtenInCharacter(), "main");      // 30 IP
  short.click(`[data-sec="${loadoutSec(short)}"]`);
  assert.ok(!short.$('[data-pwnew="cost"]'), "play still asks for a price the book sets");
  assert.match(short.$(".pw-add").textContent, new RegExp(`a new power costs ${NEW} IP`));
  short.$('[data-pwnew="name"]').value = "Thorn hedge";
  short.click("[data-pwadd-go]");
  assert.equal(activeChar(short).powers.length, 1, "a power was added short of its price");
  assert.equal(short.$('[data-pwnew="name"]').value, "Thorn hedge", "a refusal threw away what was typed");
  assert.match(short.$("#undotoast").textContent, new RegExp(`Not enough IP \\(need ${NEW}\\)`));

  const ch = writtenInCharacter(); ch.progression.ip.earned = NEW + 15;
  const app = openSheet(ch, "main");
  app.click(`[data-sec="${loadoutSec(app)}"]`);
  const fill = (k, v) => { app.$(`[data-pwnew="${k}"]`).value = v; };
  fill("name", "Thorn hedge"); fill("effect", "Briars erupt."); fill("note", "after the raid");
  app.click("[data-pwadd-go]");
  let c = activeChar(app);
  assert.equal(JSON.stringify([c.powers.map(p => p.name), c.progression.ip.log.map(e => [e.targetType, e.amount, e.note])]),
    JSON.stringify([["Fade", "Thorn hedge"], [["power", NEW, "after the raid"]]]));
  assert.equal(Engine.ipState(c).available, 15);
  assert.match(app.$$(".pw-card")[1].textContent, /rank 1/, "a new power doesn't say its rank");
  app.click("[data-toastundo]");
  c = activeChar(app);
  assert.equal(JSON.stringify([c.powers.length, c.progression.ip.log.length]), "[1,0]", "one Undo didn't take back both");

  // A note is one logged change when the field is left.
  const note = app.$('[data-pwedit$="|notes"]');
  note.value = "Twice tonight."; note.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  c = activeChar(app);
  assert.equal(c.powers[0].notes, "Twice tonight.");
  assert.match(c.audit[c.audit.length - 1].label, /Fade: notes/);
  assert.deepEqual(app.errors, []);
});

test("Improve rewrites a power for IP: the cost is required, a refusal keeps the form, and one Undo takes back both (Decision 154)", () => {
  const app = openSheet(writtenInCharacter(), "main");
  app.click(`[data-sec="${loadoutSec(app)}"]`);
  app.click("[data-pwimprove]");
  assert.ok(app.$("#modal[open]"), "Improve didn't open");
  const field = k => app.$(`#modal [data-pwimp="${k}"]`);
  assert.equal(field("name").value, "Fade", "Improve didn't start from the power's words");
  field("effect").value = "Unseen for two rounds.";
  app.click("#modal [data-pwimp-go]");
  assert.ok(app.$("#modal[open]"), "a refusal closed the form");
  assert.match(app.$("#undotoast").textContent, /costs IP/);
  assert.equal(field("effect").value, "Unseen for two rounds.", "a refusal threw away what was typed");
  assert.equal(activeChar(app).powers[0].effect, "Unseen for a round.", "a refused improvement was written");

  field("cost").value = "10";
  app.click("#modal [data-pwimp-go]");
  let c = activeChar(app);
  assert.ok(!app.$("#modal[open]"), "Improve stayed open after it worked");
  assert.equal(JSON.stringify([c.powers[0].effect, c.progression.ip.log.map(e => [e.targetType, e.amount])]),
    JSON.stringify(["Unseen for two rounds.", [["power", 10]]]));
  assert.match(c.audit[c.audit.length - 1].label, /Improved Fade \(10 IP\)/);
  app.click("[data-toastundo]");
  c = activeChar(app);
  assert.equal(JSON.stringify([c.powers[0].effect, c.progression.ip.log.length]), JSON.stringify(["Unseen for a round.", 0]), "one Undo didn't take back both");
  assert.deepEqual(app.errors, []);
});

test("Admin edits a written-in archetype's words and lists, and removes a power behind a question", () => {
  const app = openSheet(writtenInCharacter(), "main");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  app.click("[data-admin-open]");
  const name = app.$('[data-admin-wi="name"]');
  assert.ok(name, "Admin has no written-in archetype block");
  name.value = "Fetch"; name.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  app.click('[data-admin-wiadd="vulnerabilities"]');
  app.click('[data-admin-wirm="traits|0"]');
  let w = activeChar(app).archetypeChoices.writeIn;
  assert.equal(JSON.stringify([w.name, w.traits.length, w.vulnerabilities.length]), JSON.stringify(["Fetch", 0, 2]));

  app.click(`[data-sec="${loadoutSec(app)}"]`);
  // Decision 154: Admin edits a power's words in place, and adds one free.
  assert.equal(app.$$("[data-pwedit]").length, 4, "Admin can't edit a power's words");
  const eff = app.$('[data-pwedit$="|effect"]');
  eff.value = "Unseen for two rounds."; eff.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  let c = activeChar(app);
  assert.equal(c.powers[0].effect, "Unseen for two rounds.");
  assert.match(c.audit[c.audit.length - 1].label, /^Admin: Fade: effect/);
  app.$('[data-pwnew="name"]').value = "Forgotten";
  app.click("[data-pwadd-go]");
  c = activeChar(app);
  assert.equal(JSON.stringify([c.powers.map(p => p.name), c.progression.ip.log.length]), JSON.stringify([["Fade", "Forgotten"], 0]), "Admin's blank cost wasn't free");
  assert.equal(c.audit[c.audit.length - 1].label, "Admin: added power Forgotten");
  app.click("[data-toastundo]");
  app.click("[data-pwdel]");
  assert.ok(app.$("#modal[open]"), "removing a power didn't ask first");
  assert.equal(activeChar(app).powers.length, 1, "it removed before the answer");
  app.$$("#modal[open] button").find(b => /Remove power/.test(b.textContent)).dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.equal(activeChar(app).powers.length, 0);
  assert.deepEqual(app.errors, []);
});

// ── The archetype on paper (Decision 153, custom archetype S5, XQ4) ─────
test("print gives every archetype a page of its own: a written-in one's words, a built-in's data, and lines when blank", () => {
  const app = openSheet(writtenInCharacter(), "main");
  const page = html => { const box = app.doc.createElement("div"); box.innerHTML = html; const p = box.querySelectorAll(".p-page"); return p[p.length - 1]; };
  const rows = (pg, sel) => [...pg.querySelectorAll(sel + " tbody tr")].map(tr => [...tr.cells].map(td => td.textContent.trim()));
  const custom = page(app.window.renderPrintView(activeChar(app)));
  const text = custom.textContent;
  for (const t of ["Changeling", "Other: Fae", "Stolen as a child."]) assert.ok(text.includes(t), `the archetype page is missing ${t}`);
  assert.equal(JSON.stringify(rows(custom, ".p-powertable")), JSON.stringify([["Fade (rank 1)", "SFR", "Unseen for a round."]]), "a written power prints without its rank (Decision 194)");
  assert.ok(text.includes("Glamour") && text.includes("Cold iron"));

  const ww = lockedCharacter();
  ww.identity.archetype = "werewolf"; ww.archetypeChoices.specialization = ["trueborn"];
  const built = page(app.window.renderPrintView(ww)), def = D.archetypes.find(a => a.id === "werewolf");
  assert.ok(built.textContent.includes("Supernatural") && built.textContent.includes("Trueborn"));
  for (const t of def.baselineTraits) assert.ok(built.textContent.includes(t.name), `print is missing the Werewolf's ${t.name}`);

  const blank = page(app.window.renderPrintView(null));
  assert.equal(JSON.stringify([".p-archtable", ".p-powertable"].map(s => blank.querySelectorAll(s + " tbody tr").length)), JSON.stringify([5 + 8 + 4, 8]),
    "the blank page's write-in lines changed");
  assert.ok(blank.querySelector(".p-archfields .p-line"), "the blank page has no Archetype line to write on");
  assert.equal(blank.textContent.includes("Changeling"), false);
  assert.deepEqual(app.errors, []);
});

test("Decision 162: Review's Lock waits until every point that can buy something is spent", () => {
  const half = named("Unspent"); half.creation.locked = false; half.skills = {};
  const app = boot({ storage: { "shadows.draft.v1": { ch: half, step: 7, maxReached: 7 } } });
  card(app, "Unspent").querySelector("[data-open]").click();
  const lock = () => app.$("[data-lock]");
  assert.ok(lock(), "Review didn't render");
  assert.equal(lock().disabled, true, "Lock was open with Skill Points unspent");
  assert.match(app.$("#wiz-issues").textContent, /Skill Points unspent\. Spend them before you lock\./);
  assert.match(app.$(".wiznav-why").textContent, /to fix first/, "the nav doesn't say what's holding the lock");
  assert.deepEqual(app.errors, []);
});

test("Decision 163: a lock prints the TAG once, beside the export, and says where the file went", () => {
  for (const tagless of [false, true]) {
    const half = named(tagless ? "Wren" : "Rook Vance"); half.creation.locked = false; half.identity.tagless = tagless;
    const app = boot({ storage: { "shadows.draft.v1": { ch: half, step: 7, maxReached: 7 } } });
    const got = withDownloads(app);
    card(app, half.identity.name).querySelector("[data-open]").click();
    app.window.eval("S.ch.creation.rolls.credits = 5; update();");
    app.click("[data-lock]");
    assert.equal(got.length, 1, "the export left the lock's click");
    assert.ok(app.$("#main .intake.issued"), "the sheet after a lock didn't print the TAG");
    const file = tagless ? "Wren.shadows.json" : "Rook_Vance.shadows.json";
    const C = app.window.SHADOWS_DATA.appCopy, say = tagless ? C.lockIssuedTagless : C.lockIssued;
    assert.equal(app.$("#undotoast").textContent.replace("×", "").trim(),
      say.replace("{tag}", app.Engine.tagNumber(app.window.eval("S.ch"))).replace("{file}", file));
    assert.equal(app.window.document.activeElement, app.$("#main h1"), "focus wasn't handed to the character");
    app.window.eval("update();");
    assert.equal(app.$("#main .intake.issued"), null, "the TAG printed again on a re-render");
    assert.deepEqual(app.errors, []);
  }
});

// ── The Werewolf to 0414 (crb-v4-sync P3, Decisions 195–197) ─────────
function wolf(origin) {
  const ch = lockedCharacter();
  ch.identity.archetype = "werewolf";
  ch.archetypeChoices.specialization = [origin];
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 8;
  ch.progression.ip.earned = 200;
  return ch;
}

test("Main shifts a Forge Fang: the switch names the HL it costs, Claws and Fangs lead the weapons, BOD reads 12, and one Undo takes it all back", () => {
  const app = openSheet(wolf("forge-fang"), "main");
  const btn = () => app.$('#main .main-form [data-ptoggle="form|Werewolf"]');
  assert.ok(btn(), "Main has no Form switch");
  assert.match(btn().textContent, /Werewolf \(1 HL of Withering damage\)/, "the switch doesn't say what shifting costs");
  assert.equal(app.$$("#main .main-combat tbody tr").filter(r => /Claws|Fangs/.test(r.textContent)).length, 0, "claws before the shift");
  app.click('#main .main-form [data-ptoggle="form|Werewolf"]');
  const ch = activeChar(app);
  assert.equal(ch.panelData.form, "Werewolf");
  assert.deepEqual([ch.trackers.damage, ch.trackers.witheringDamage], [7, 7], "the shift didn't spend one shifted HL as Withering");
  const rows = app.$$("#main .main-combat tbody tr").map(r => r.textContent.replace(/\s+/g, " "));
  assert.match(rows[0], /^ ?Claws ?Werewolf form · Melee ?1d10 \+ \d+ ?20 ?—/);
  assert.match(rows[1], /^ ?Fangs ?Werewolf form · Melee ?1d10 \+ \d+ ?22 ?—/);
  assert.match(app.$("#main .main-form").textContent, /\+2 REF, \+2 MOB and \+4 BOD/);
  const bod = app.$$("#main .statcell").find(c => c.querySelector(".sid").textContent === "BOD");
  assert.match(bod.textContent, /12.*\+4 form/s, "the stat block doesn't show the shifted BOD");
  assert.match(app.$("#main .cond.hp").textContent, /10 HL × 7/);
  app.click('[data-sec="sessions"]');
  assert.match(app.$("#main").textContent, /Form: Werewolf \(1 HL Withering\)/, "the Activity Log doesn't name the shift and its cost");
  app.click("button[data-undolast]");
  const back = activeChar(app);
  assert.deepEqual([back.panelData.form || null, back.trackers.damage, back.trackers.witheringDamage], [null, 0, 0]);
  assert.deepEqual(app.errors, []);
});

test("a Trueborn's sheet: the powers with ranks and costs, Base Powers placed, Raise a Power past the book's 3, Call of the Wild's step, and TECH barred while shifted (Decision 215)", () => {
  const ch = wolf("trueborn");
  ch.archetypeChoices.basePowers = { "apex-fury": 1 };
  ch.progression.powerIpe = { "apex-fury": 2 };
  ch.progression.ip.log.push({ date: "2026-10-08", kind: "spend", amount: 20, targetType: "power", targetId: "apex-fury", from: 1, to: 2, name: "Apex Fury", note: "" },
                             { date: "2026-10-08", kind: "spend", amount: 40, targetType: "power", targetId: "apex-fury", from: 2, to: 3, name: "Apex Fury", note: "" });
  ch.panelData.form = "Werewolf";
  const app = openSheet(ch, "character");
  const text = app.$("#main").textContent;
  assert.match(text, /Base Powers 1 · Max Starting Rank 1/);
  assert.doesNotMatch(text, /call for now|Base Powers? to place/, "F38's note, or a Base Power to place, is still beside the powers");
  const apex = app.$$("#main .pick").find(p => /^Apex Fury/.test(p.querySelector("h2").textContent));
  assert.match(apex.textContent, /rank 3.*3 SFR.*Per rank: Rank 2: anywhere\. Rank 3: anytime\./s);
  assert.ok(!/Steel Fangs|Predator's Allure|EMP/.test(text), "a Trueborn sees another Origin's powers or EMP");
  assert.match(text, /summon a pack of allied wolves/, "the pack text isn't under the powers");

  app.click('[data-sec="progression"]');
  app.click('[data-raiseopen="power"]');
  const row = app.$$("[data-raiseresults] tr").find(r => /Apex Fury/.test(r.textContent));
  assert.match(row.textContent, /Archetype power · rank 3 · \+2 from IP · past the book's 3.*3 → 4.*60 IP/s);
  assert.equal(app.$$("[data-raiseresults] tr").filter(r => !r.querySelector("[data-raise]").closest("tr").textContent.includes("Learn")).length, 6, "Raise a Power doesn't list the Innate five and the one Trueborn power placed");
  app.click("#modal [data-modalclose]");

  app.click('[data-sec="trackers"]');
  app.click('#main [data-trk="call-of-the-wild|1"]');
  const cotw = app.$$("#main .trk").find(t => /Call of the Wild/.test(t.textContent));
  assert.match(cotw.textContent, /Need: An hour of moonlit time under the night sky\. Step 1: Weakened: Moonsworn's passive bonuses fade\./);

  app.click('[data-sec="skills"]');
  const tech = D.skills.filter(s => s.primaryStat === "TECH").map(s => s.name);
  const barred = app.$$("#main tr.skill-line").filter(r => /not while shifted/.test(r.textContent)).map(r => r.querySelector("td").firstChild.textContent.trim());
  assert.equal(barred.sort().join(), tech.sort().join(), "Feral Mind didn't bar exactly the TECH skills");
  assert.deepEqual(app.errors, []);
});

test("Decision 199: Progression lists a Trueborn's own Majors above the shared ones, greys an unmet one, and takes one; the form says what a Major changed", () => {
  const ch = wolf("trueborn");
  ch.progression.milestonePoints = 100;
  const app = openSheet(ch, "progression");
  const text = app.$("#main").textContent;
  assert.match(text, /Werewolf\s*Tireless.*Swift Change.*Between Forms.*The Calling/s, "the Werewolf's Majors aren't listed");
  assert.doesNotMatch(text, /General|Specialist|Defensive Dance/, "a Werewolf is offered the General Majors (Decision 217)");
  assert.doesNotMatch(text, /Forge Fang Mark|Wildblood Mark|Off the Leash/, "a Trueborn is offered another Origin's Majors");
  const take = id => app.$(`[data-takemajor="${id}"]`);
  assert.ok(take("between-forms").disabled, "Between Forms is takeable with no Major");
  assert.match(take("between-forms").closest(".pick").textContent, /1 Major Milestone taken/);
  assert.ok(take("clear-head").disabled, "Clear Head is takeable with no Major");
  app.click('[data-takemajor="tireless"]');
  assert.deepEqual(activeChar(app).progression.milestones.major.map(m => m.id), ["tireless"]);
  assert.match(app.$("#main .journal").textContent, /Tireless/, "the journal doesn't name the Werewolf Major");
  assert.ok(!take("between-forms").disabled, "Between Forms stayed locked after a Major");
  app.click('[data-takemajor="clear-head"]');
  app.click('[data-takemajor="iron-jaw"]');

  app.click('[data-sec="main"]');
  app.click('[data-ptoggle="form|Werewolf"]');
  const main = app.$("#main").textContent;
  assert.match(main, /Clear Head: In Werewolf form, you can use TECH-based skills at −2\./, "the form doesn't say what Clear Head changed");
  const claws = app.$$("#main tr").find(r => /^Claws/.test(r.textContent));
  assert.match(claws.textContent, /AP/, "Iron Jaw's AP isn't on the claws");
  app.click('[data-sec="skills"]');
  assert.match(app.$("#main").textContent, /−2 while shifted|-2 while shifted/, "a TECH skill doesn't show Clear Head's penalty");
  assert.doesNotMatch(app.$("#main").textContent, /not while shifted/, "a TECH skill is still barred");
  assert.deepEqual(app.errors, []);
});

// ── The Vampire (0413) in the wizard and on the sheet (crb-v4-sync P4,
// Decisions 200–202) ──────────────────────────────────────────────────────

test("crb-v4-sync P4: the Bloodline step offers three; a Draugur picks a weapon and writes a Code; Base Powers spend, and the lock waits on them", () => {
  const app = onArchetypeStep("vampire", "heroic");   // 3 Base Powers, rank 2
  const main = () => app.$("#main").textContent;
  assert.deepEqual(app.$$("#main [data-spec]").map(b => b.dataset.spec), ["strigoi", "upyr", "draugur"]);
  assert.equal(app.$$('#main [data-step^="bp|"]').length, 0, "Base Powers before a Bloodline");
  app.click('[data-spec="draugur"]');
  assert.deepEqual(app.$$("#main [data-optpick]").map(b => b.dataset.optpick), ["ancient-weapon|blade", "ancient-weapon|blunt", "ancient-weapon|spear"]);
  assert.match(main(), /The Road.*Only those who have chosen violence/s, "the Code's examples aren't shown");
  app.click('[data-optpick="ancient-weapon|spear"]');
  assert.equal(app.$('[data-optpick="ancient-weapon|spear"]').getAttribute("aria-pressed"), "true");
  // A tenet saves as it's typed, without a redraw, so the caret stays.
  const hunt = app.$('[data-opttext="code|hunt"]');
  hunt.focus(); hunt.value = "Only the guilty"; hunt.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  assert.equal(app.window.document.activeElement, hunt, "typing a tenet redrew the field");
  // The Draugur's own are bought; the Innate four are granted, with no stepper (Decision 215).
  const offered = app.$$('#main [data-step$="|1"]').map(b => b.dataset.step).filter(s => s.startsWith("bp|")).map(s => s.split("|")[1]);
  assert.ok(offered.includes("odins-aegis") && !offered.includes("bestial-blessings") && !offered.includes("shadow-play"), offered.join());
  assert.match(main(), /Innate powers.*Bestial Blessings.*granted · rank 1.*Preternatural Speed.*granted(?! ·)/s, "the Innate powers aren't shown granted");
  assert.match(main(), /place 3 Base Powers/);
  app.click('[data-step="bp|odins-aegis|1"]');
  assert.ok(app.$('[data-step="bp|odins-aegis|1"]').disabled, "a power took a second Base Power (Decision 240)");
  app.click('[data-step="bp|battleborn-instinct|1"]');
  // Review: the Base Power left blocks the lock while something can still take it.
  const steps = D.creationFlow.steps.map(s => s.id);
  app.click(`[data-goto="${steps.length}"]`);   // Review follows the data's steps
  assert.match(main(), /1 Base Power unplaced\. Spend them before you lock/);
  app.click(`[data-goto="${steps.indexOf("archetype")}"]`);
  app.click('[data-step="bp|deathless-resilience|1"]');
  const draft = stored(app, { locked: false });
  assert.deepEqual({ ...draft.archetypeChoices.basePowers }, { "odins-aegis": 1, "battleborn-instinct": 1, "deathless-resilience": 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(draft.archetypeChoices.optionPicks)), { "ancient-weapon": "spear", code: { hunt: "Only the guilty" } });
  // Changing Bloodline takes back the old one's ranks and choices; Built to Last is no choice (F41).
  app.click('[data-step="bp|odins-aegis|-1"]');
  app.click('[data-spec="upyr"]');
  const after = stored(app, { locked: false });
  assert.deepEqual([{ ...after.archetypeChoices.basePowers }, { ...after.archetypeChoices.optionPicks }], [{}, {}]);
  assert.deepEqual(app.$$("#main [data-optpick]").map(b => b.dataset.optpick), []);
  assert.ok(app.$('[data-step="bp|iron-hide|1"]') && app.$('[data-step="bp|icebound-resilience|1"]'), "an Upyr can't buy both Built to Last powers");
  assert.deepEqual(app.errors, []);
});

test("crb-v4-sync P4: the Character tab shows the placed powers at their ranks and the Draugur's choices; Main shows the bite, the claws and the blade", () => {
  const app = openSheet(lockedVampire(), "character");
  const text = app.$("#main").textContent;
  assert.match(text, /Bestial Blessings\s*rank 2/);
  assert.match(text, /Battleborn Instinct\s*rank 2/);
  assert.match(text, /Vitality Surge\s*rank 1/, "an Innate power isn't granted");
  assert.ok(!app.$$("#main .pick h2").some(h => /Hel's Dread/.test(h.textContent)), "a power never placed is held");
  assert.doesNotMatch(text, /Base Powers? to place/, "all three Base Powers are placed");
  assert.match(text, /Base Powers 3 · Max Starting Rank 2/);
  assert.match(text, /The Ancient Weapon: Blade/);
  assert.match(text, /The Hunt: Only the guilty/);
  app.click('[data-sec="main"]');
  // Weapon, its line under it, then Dmg in the third cell: BOD 6 + 3, + 4 at rank 2, + 6.
  const weapon = name => { const r = app.$$("#main .main-combat table.ref tbody tr").find(tr => tr.cells[0] && tr.cells[0].firstChild && tr.cells[0].firstChild.textContent === name);
    return r ? [r.querySelector(".lo-sub").textContent, r.cells[2].textContent] : null; };
  assert.deepEqual(weapon("Bite"), ["Fangs of the Fallen · Melee", "9"]);
  assert.deepEqual(weapon("Claws"), ["with Bestial Blessings · rank 2 · Melee", "10"]);
  assert.deepEqual(weapon("Blade"), ["The Ancient Weapon · Melee · Reach 1m · Parry +1", "12"]);
  // Breaking the Code silences the weapon; one Undo restores it.
  app.click('[data-ptoggle="code|Broken"]');
  assert.match(app.$("#main").textContent, /Broken: \+1 TH on every Essence check/);
  assert.match(app.$("#main").textContent, /It doesn't answer while your Code is broken\./);
  app.click("[data-toastundo]");
  assert.equal(stored(app, { locked: true }).panelData.code, undefined);
  assert.deepEqual(app.errors, []);
});

test("crb-v4-sync P4: Feed and A day unfed on Main are one Undo each, and Hunger speaks at RoU", () => {
  const ch = lockedVampire("upyr");
  const app = openSheet(ch, "main");
  const max = Engine.sfr(Engine.migrate(JSON.parse(JSON.stringify(ch)))).value, rou = 6;
  assert.ok(app.$("#main .main-feed"), "no Thirst on Main");
  assert.doesNotMatch(app.$("#main .main-feed").textContent, /Hunger/);
  app.click('[data-unfed="thirst"]');
  assert.equal(stored(app, { locked: true }).trackers.sfr.spent, rou / 2);
  // Down to RoU: the Hunger notice.
  for (let left = max - rou / 2; left > rou; left -= rou / 2) app.click('[data-unfed="thirst"]');
  assert.match(app.$("#main .main-feed").textContent, /Hunger.*WILL Essence check \(TN 7, TH 1\)/s);
  const spent = stored(app, { locked: true }).trackers.sfr.spent;
  // Feed fresh, 2 HL: +6.
  app.click('[data-feedkind="thirst|fresh"]');
  const hl = app.$('[data-feedhl="thirst"]');
  hl.value = "2"; hl.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  app.click('[data-feed="thirst"]');
  assert.equal(stored(app, { locked: true }).trackers.sfr.spent, spent - 6);
  assert.match(app.$("[data-toastundo]").parentElement.textContent, /Fed: 2 HL fresh, \+6 SFR/);
  app.click("[data-toastundo]");
  assert.equal(stored(app, { locked: true }).trackers.sfr.spent, spent, "one Undo didn't take the feed back");
  // A refusal says why and changes nothing.
  hl.value = ""; app.click('[data-feed="thirst"]');
  assert.equal(stored(app, { locked: true }).trackers.sfr.spent, spent);
  // Trackers carries the same panel; Loadout doesn't draw an empty one.
  app.click('[data-sec="trackers"]');
  assert.ok(app.$("#main .trk-feed [data-feed]"));
  app.click('[data-sec="loadout"]');
  assert.doesNotMatch(app.$("#main").textContent, /The Thirst/);
  assert.deepEqual(app.errors, []);
});

test("crb-v4-sync P4: Admin sets a saved Vampire's Bloodline, its choices and its Base Powers, each one Undo", () => {
  const ch = lockedVampire();
  ch.archetypeChoices.specialization = [];
  ch.archetypeChoices.basePowers = {};
  ch.archetypeChoices.optionPicks = {};
  const app = openSheet(ch, "main");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  const sel = app.$("[data-admin-spec]");
  sel.value = "upyr"; sel.dispatchEvent(new app.window.Event("change", { bubbles: true }));
  assert.deepEqual([...stored(app, { locked: true }).archetypeChoices.specialization], ["upyr"]);
  assert.equal(app.$('.admin-arch [data-optpick]'), null, "Built to Last is still a pick on Admin");
  app.click('.admin-arch [data-step="bp|iron-hide|1"]');
  assert.deepEqual({ ...stored(app, { locked: true }).archetypeChoices.basePowers }, { "iron-hide": 1 });
  app.click("[data-toastundo]");
  assert.deepEqual({ ...stored(app, { locked: true }).archetypeChoices.basePowers }, {});
  assert.deepEqual(app.errors, []);
});

test("Decisions 215, 240: a Street Strigoi's Bloodline step shows the Innate powers granted and the Bloodline's with steppers, and a Heroic one's CP step raises a rank for 5 CP", () => {
  const app = onArchetypeStep("vampire", "street");   // 2 Base Powers, Max Starting Rank 1
  app.click('[data-spec="strigoi"]');
  const innate = ["bestial-blessings", "vitality-surge", "preternatural-speed", "cursed-evolution"];
  for (const id of innate) assert.equal(app.$(`[data-step^="bp|${id}|"]`), null, `${id} has a Base Power stepper`);
  for (const id of ["shadow-play", "veil-of-night", "bone-spines"]) assert.ok(app.$(`[data-step="bp|${id}|1"]`), `${id} has no stepper`);
  assert.match(app.$("#main").textContent, /Your Innate powers are yours at rank 1\. Each Base Power takes one of your Bloodline's powers at rank 1\. At this Power Level, CP raises no power/);
  app.click('[data-step="bp|shadow-play|1"]'); app.click('[data-step="bp|veil-of-night|1"]');
  const draft = stored(app, { locked: false });
  assert.deepEqual({ ...draft.archetypeChoices.basePowers }, { "shadow-play": 1, "veil-of-night": 1 });
  assert.deepEqual(app.errors, []);

  const cp = onStep("vampire", "heroic", "character-points", ch => {   // Max Starting Rank 2
    ch.archetypeChoices.specialization = ["strigoi"];
    ch.archetypeChoices.basePowers = { "shadow-play": 1, "veil-of-night": 1 };
  });
  const text = () => cp.$("#main").textContent;
  assert.match(text(), /Powers — 5 CP per rank/);
  assert.equal(cp.$('[data-step="apow|preternatural-speed|1"]'), null, "a power with no ranks is on the CP step");
  const left = () => Engine.cp(Engine.migrate(JSON.parse(JSON.stringify(stored(cp, { locked: false }))))).left;
  const before = left();
  cp.click('[data-step="apow|bestial-blessings|1"]');
  assert.deepEqual({ ...stored(cp, { locked: false }).archetypeChoices.powerCp }, { "bestial-blessings": 1 });
  assert.equal(left(), before - 5, "a press didn't spend 5 CP");
  assert.ok(cp.$('[data-step="apow|bestial-blessings|1"]').disabled, "CP passed Max Starting Rank 2");
  cp.click('[data-step="apow|bestial-blessings|-1"]');
  assert.equal(left(), before);
  assert.deepEqual(cp.errors, []);
});

test("Decision 240: a Heroic Strigoi's Bloodline step takes each power once, and the CP step raises one to rank 2, no further", () => {
  const app = onArchetypeStep("vampire", "heroic");   // 3 Base Powers, Max Starting Rank 2
  app.click('[data-spec="strigoi"]');
  assert.match(app.$("#main").textContent, /Each Base Power takes one of your Bloodline's powers at rank 1\. CP raises any of your powers on the Character Points step, up to rank 2\./);
  app.click('[data-step="bp|shadow-play|1"]');
  assert.ok(app.$('[data-step="bp|shadow-play|1"]').disabled, "a power took a second Base Power");
  assert.equal(app.$('[data-step="bp|veil-of-night|1"]').disabled, false);
  assert.match(app.$('[data-step="bp|shadow-play|1"]').closest(".pick").textContent, /rank 1/);
  assert.deepEqual(app.errors, []);

  const cp = onStep("vampire", "heroic", "character-points", ch => {
    ch.archetypeChoices.specialization = ["strigoi"];
    ch.archetypeChoices.basePowers = { "shadow-play": 1 };
  });
  cp.click('[data-step="apow|shadow-play|1"]');
  assert.ok(cp.$('[data-step="apow|shadow-play|1"]').disabled, "CP passed Max Starting Rank 2");
  assert.deepEqual({ ...stored(cp, { locked: false }).archetypeChoices.powerCp }, { "shadow-play": 1 });
  assert.deepEqual(cp.errors, []);
});

test("Decision 240: a Street Vampire is told CP raises no power, and a locked Vampire placed under Decision 215 keeps rank 2 on Admin", () => {
  const app = onArchetypeStep("vampire", "street");
  app.click('[data-spec="strigoi"]');
  assert.match(app.$("#main").textContent, /At this Power Level, CP raises no power/);
  assert.doesNotMatch(app.$("#main").textContent, /CP raises any of your powers/);
  // The CP step says it too, under its header, with the rows kept (Ken, on the review).
  const cpStreet = onStep("vampire", "street", "character-points", ch => {
    ch.archetypeChoices.specialization = ["strigoi"];
    ch.archetypeChoices.basePowers = { "shadow-play": 1 };
  });
  assert.match(cpStreet.$("#main").textContent, /Powers — 5 CP per rank\s*At this Power Level, CP raises no power: every one starts at rank 1\./);
  assert.ok(cpStreet.$('[data-step="apow|shadow-play|1"]'), "the rows went");
  const cpHeroic = onStep("vampire", "heroic", "character-points", ch => {
    ch.archetypeChoices.specialization = ["strigoi"];
    ch.archetypeChoices.basePowers = { "shadow-play": 1 };
  });
  assert.doesNotMatch(cpHeroic.$("#main").textContent, /CP raises no power/);
  assert.deepEqual([app.errors, cpStreet.errors, cpHeroic.errors], [[], [], []]);
  assert.deepEqual(app.errors, []);

  const ch = lockedVampire();
  ch.archetypeChoices.basePowers = { "battleborn-instinct": 2 };   // one Base Power left, so a disabled + is the cap's doing
  const sheet = openSheet(ch, "character");
  assert.match(sheet.$("#main").textContent, /Battleborn Instinct\s*rank 2/);
  sheet.click("[data-menu-toggle]"); sheet.click("[data-admin]");
  // Admin is past creation: its note says what a Base Power is and stops, whatever the Power Level.
  assert.match(sheet.$(".admin-arch").textContent, /Each Base Power takes one of your Bloodline's powers at rank 1\./);
  assert.doesNotMatch(sheet.$(".admin-arch").textContent, /CP raises/);
  const street = lockedVampire(); street.creation.powerLevel = "street"; street.archetypeChoices.basePowers = { "battleborn-instinct": 1 };
  const streetSheet = openSheet(street, "main");
  streetSheet.click("[data-menu-toggle]"); streetSheet.click("[data-admin]");
  assert.doesNotMatch(streetSheet.$(".admin-arch").textContent, /CP raises/);
  assert.ok(sheet.$('.admin-arch [data-step="bp|battleborn-instinct|1"]').disabled, "Admin's + went past rank 1");
  assert.equal(sheet.$('.admin-arch [data-step="bp|battleborn-instinct|-1"]').disabled, false);
  assert.equal(sheet.$('.admin-arch [data-step="bp|odins-aegis|1"]').disabled, false);
  assert.deepEqual(sheet.errors, []);
});

test("Decision 215: CP left on a power with no row shows a take-back-only row, and one press clears its error", () => {
  const app = onStep("vampire", "street", "character-points", ch => {
    ch.archetypeChoices.specialization = ["strigoi"];
    ch.archetypeChoices.powerCp = { "shadow-play": 1, "preternatural-speed": 1 };
  });
  const rows = () => app.$$("#main .pick").filter(p => p.querySelector('[data-step^="apow|"]'));
  const sp = app.$('[data-step="apow|shadow-play|-1"]'), ps = app.$('[data-step="apow|preternatural-speed|-1"]');
  assert.ok(sp && ps, "a stray CP has no stepper to take it back");
  assert.ok(app.$('[data-step="apow|shadow-play|1"]').disabled && app.$('[data-step="apow|preternatural-speed|1"]').disabled, "a stray row can go up");
  assert.match(sp.closest(".pick").textContent, /not a power you hold/);
  assert.match(ps.closest(".pick").textContent, /no ranks to raise/);
  app.click('[data-step="apow|shadow-play|-1"]'); app.click('[data-step="apow|preternatural-speed|-1"]');
  assert.deepEqual({ ...stored(app, { locked: false }).archetypeChoices.powerCp }, {});
  assert.equal(app.$('[data-step="apow|shadow-play|-1"]'), null);
  assert.deepEqual(app.errors, []);
});

test("Decisions 215, 240: a Werewolf's Bloodline step is the Vampire's: the Innate five granted, the Origin's powers bought", () => {
  const app = onArchetypeStep("werewolf", "street");   // 1 Base Power, Max Starting Rank 1
  app.click('[data-spec="trueborn"]');
  assert.match(app.$("#main").textContent, /place 1 Base Power/);
  assert.match(app.$("#main").textContent, /Each Base Power takes one of your Origin's powers at rank 1/);
  assert.equal(app.$('[data-step^="bp|primal-leap|"]'), null, "an Innate power has a stepper");
  assert.match(app.$("#main").textContent, /Innate powers.*Primal Leap.*granted · rank 1/s);
  assert.ok(app.$('[data-step="bp|apex-fury|1"]'));
  assert.equal(app.$('[data-step="bp|steel-fangs|1"]'), null, "another Origin's power is offered");
  app.click('[data-step="bp|apex-fury|1"]');
  assert.ok(app.$('[data-step="bp|ancestral-wisdom|1"]').disabled, "a second Base Power went in on one");
  assert.deepEqual({ ...stored(app, { locked: false }).archetypeChoices.basePowers }, { "apex-fury": 1 });
  assert.deepEqual(app.errors, []);
});

test("Decision 215: a saved Vampire with Base Powers to place says how many on its Character tab, and placing one on Admin is one Undo", () => {
  const ch = lockedVampire("strigoi");
  ch.archetypeChoices.basePowers = { "shadow-play": 1 };   // 3 Base Powers at Heroic, one placed
  ch.archetypeChoices.powerCp = {};
  ch.archetypeChoices.optionPicks = {};
  const app = openSheet(ch, "character");
  assert.match(app.$("#main").textContent, /2 Base Powers to place, on Admin\./);
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  app.click('.admin-arch [data-step="bp|veil-of-night|1"]');
  assert.deepEqual({ ...stored(app, { locked: true }).archetypeChoices.basePowers }, { "shadow-play": 1, "veil-of-night": 1 });
  app.click("[data-toastundo]");
  assert.deepEqual({ ...stored(app, { locked: true }).archetypeChoices.basePowers }, { "shadow-play": 1 });
  assert.deepEqual(app.errors, []);
});

test("Decision 215: A day without rest on Main takes half RoU and 2 more, Undo puts it back, and it stops at empty", () => {
  const ch = lockedVampire("upyr");   // Heroic: RoU 6, so −5
  const app = openSheet(ch, "main");
  assert.match(app.$("#main .main-feed").textContent, /A day without rest \(−5\)/);
  assert.match(app.$("#main .main-feed").textContent, /Instead of A day unfed: the day's Thirst and 2 more\./);
  app.click('[data-unrested="thirst"]');
  assert.equal(stored(app, { locked: true }).trackers.sfr.spent, 5);
  assert.match(app.$("[data-toastundo]").parentElement.textContent, /A day without rest: −5 SFR/);
  app.click("[data-toastundo]");
  assert.equal(stored(app, { locked: true }).trackers.sfr.spent, 0, "one Undo didn't take the day back");
  const max = Engine.sfr(Engine.migrate(JSON.parse(JSON.stringify(ch)))).value;
  for (let i = 0; i < Math.ceil(max / 5) + 1; i++) app.click('[data-unrested="thirst"]');
  assert.equal(stored(app, { locked: true }).trackers.sfr.spent, max, "it went past empty");
  app.click('[data-sec="trackers"]');
  assert.ok(app.$("#main .trk-feed [data-unrested]"), "Trackers lacks the button");
  assert.deepEqual(app.errors, []);
});

// ── P18: the tags show on a folded Character card (Decision 231) ─────
test("P18 6: a folded Character card shows its tags, held for its rank and picks", () => {
  const ch = lockedCharacter();
  ch.advantages = [{ id: "hard-to-kill", rank: 2 }, { id: "bullseye", rank: 2 }, { id: "common-sense", rank: 1, selections: { skill: ["investigation"] } }];
  ch.disadvantages = [{ id: "blood-lust", rank: 1 }];
  const app = openSheet(ch, "character");
  assert.deepEqual(app.errors, []);
  const card = name => app.$$("#main details.pick.trait").find(d => d.querySelector(".th").textContent.startsWith(name));
  const bl = card("Blood Lust");
  assert.ok(!bl.open, "the card should be folded");
  const rule = D.disadvantages.find(d => d.id === "blood-lust").grants.find(g => g.type === "rule").ruleText;
  assert.equal(bl.querySelector("summary .effects .etag.rule").textContent, rule, "the tags aren't in the summary");
  assert.equal(card("Hard to Kill").querySelector("summary .effects .etag.computed").textContent, "+2 max HP on every Health Level");   // Decision 232: a held ×2 states its total
  assert.equal(card("Bullseye").querySelector("summary .effects .etag.rule").textContent, "Called Shots: +6 damage.");
  assert.equal(card("Common Sense").querySelector("summary .effects .etag.computed").textContent, "Take 6 on Investigation; choose before you roll");   // P19: a computed Take X now
});
