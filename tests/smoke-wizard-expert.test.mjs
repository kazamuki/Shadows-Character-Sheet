/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This is the regression net for the split: if a source file is dropped from
 * index.html, loaded in the wrong order, or breaks under a real script-blocking
 * load, the app will not boot and these fail immediately.
 *
 * This file: Expert mode, numbers at creation, Boosts on Disciplines, a first-timer's wizard, the CP lists and the Natural Advantage panel folding, named pools and typed steppers. Its other half is smoke-wizard-steps.
 * The smoke tests are split by area so node --test runs the files in
 * parallel; the helpers more than one file uses are in smokekit.mjs.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot, stored } from "./harness.mjs";
import { Engine, D, lockedCharacter, onArchetypeStep, onStep, openSheet, search, arcanistOnCP, draft, card, wizCss, type, named, withDownloads, newCharacterApp, typed, statsDraft, sName, later } from "./smokekit.mjs";

// ── P13: Expert mode (Decision 232) ─────────────────────────────────────
// Folded text is still in the page (so the filter finds it); it is `hidden`
// until a ? opens it. Each test says what must stay shown as well as what folds.

const EXPERT = { "shadows.ui.expert": "on" };

const cpExpert = (mut, store = EXPERT) => onStep("professional", "street", "character-points", mut, store);

const pickOf13 = (app, name) => app.$$("#main .pick").find(p => p.querySelector("h2") && p.querySelector("h2").textContent === name);

const hiddenIn = el => !!el.closest("[hidden]");

const shownNames = app => app.$$("#main [data-filterable] .pick").filter(p => !p.hidden).map(p => p.querySelector("h2").textContent);

// Decision 279: the lists open folded; a test that counts all 88 asks for them open first.
const openLists = app => { for (const k of ["disadvantages", "advantages"]) app.click(`[data-cp-all="${k}"]`); return app; };

const typeFilter = (app, v) => { const f = app.$("#main [data-jumpfilter]"); f.value = v; f.dispatchEvent(new app.window.Event("input")); };

const holdThree = ch => {
  ch.advantages = [{ id: "bullseye", rank: 1, notes: "" }, { id: "common-sense", rank: 1, notes: "", selections: { skill: ["investigation"] } }];
  ch.disadvantages = [{ id: "blood-lust", rank: 1, notes: "" }];
};

test("P13 1: Expert mode folds the CP step's book text and keeps every control", () => {
  const app = cpExpert(ch => {
    holdThree(ch);
    ch.advantages.push({ id: "educated", rank: 1, notes: "" });                      // a flagged one, held
    Engine.addCustomPower(ch, { name: "Sidestep", effect: "Moves where the dice won't look.", free: true }, { creation: true });
  });
  assert.deepEqual(app.errors, []);
  const filterable = app.$$("#main [data-filterable] .pick");
  assert.equal(filterable.length, 88);
  for (const p of filterable) {
    const name = p.querySelector("h2").textContent;
    assert.ok(p.querySelector(".desc").hidden, `${name}: the book text is shown`);
    assert.ok(p.querySelector(".cost") && p.querySelector(".stepper"), `${name} lost a cost or stepper`);
    assert.ok(p.querySelector(".head [data-fold]"), `${name} has no ?`);
  }
  // LUCK's line stays folded too; a held entry's tags and picks stay shown.
  assert.ok(app.$$("#main .pick").find(p => /Buy up LUCK/.test(p.textContent)).querySelector(".desc").hidden, "LUCK's line is shown");
  const cs = pickOf13(app, "Common Sense");
  assert.ok(cs.querySelector("select[data-sel]") && !hiddenIn(cs.querySelector("select[data-sel]")), "a held pick's select folded");
  assert.ok(cs.querySelector(".effects .etag") && !hiddenIn(cs.querySelector(".effects")), "the tags folded");
  const ed = pickOf13(app, "Educated");
  assert.ok(ed.querySelector(".flag") && !hiddenIn(ed.querySelector(".flag")), "a flag note folded");
  const custom = pickOf13(app, "Sidestep");
  assert.ok(custom && !hiddenIn(custom.querySelector(".desc")) && /won't look/.test(custom.querySelector(".desc").textContent), "a custom power's own text folded");
  // ? opens one entry; a stepper's re-render keeps it open; the others stay folded.
  const q = () => app.$('[data-fold="advantage|ambidextrous"]');
  assert.equal(q().getAttribute("aria-expanded"), "false");
  app.click('[data-fold="advantage|ambidextrous"]');
  assert.equal(q().getAttribute("aria-expanded"), "true");
  assert.ok(!pickOf13(app, "Ambidextrous").querySelector(".desc").hidden, "? didn't open the text");
  assert.ok(pickOf13(app, "Animal Ken").querySelector(".desc").hidden, "? opened another entry");
  app.click('[data-step="luck|x|1"]');
  assert.equal(q().getAttribute("aria-expanded"), "true", "a re-render closed it");
  assert.ok(!pickOf13(app, "Ambidextrous").querySelector(".desc").hidden, "a re-render re-folded the text");
  app.click('[data-fold="advantage|ambidextrous"]');
  assert.ok(pickOf13(app, "Ambidextrous").querySelector(".desc").hidden, "? didn't close it again");
  assert.deepEqual(app.errors, []);
});

test("P13 1b: with Expert mode off the CP step shows every text and has no ?", () => {
  const app = cpExpert(() => {}, {});
  assert.equal(app.$$("#main [data-fold]").length, 0);
  assert.equal(app.$$("#main [data-foldbody]").length, 0);
  assert.ok(app.$$("#main [data-filterable] .pick .desc").every(d => !d.hidden));
});

test("P13 2: Expert mode folds the Skills step's descriptions and keeps the picks", () => {
  const app = onStep("professional", "street", "skills", ch => { ch.skills["martial-arts"] = { rank: 2, ipe: 0 }; ch.skills.handguns = { rank: 1, ipe: 0 }; }, EXPERT);
  assert.deepEqual(app.errors, []);
  const rows = app.$$("#main .alloc-row");
  assert.equal(rows.length, D.skills.length);
  const shown = () => app.$$("#main .alloc-row .name small").filter(s => !s.classList.contains("next-cost") && !s.hidden);
  assert.deepEqual(shown().map(s => s.textContent), [], "a description is shown");
  for (const r of rows) assert.ok(r.querySelector(".stepper .val") && r.querySelector(".mod") && r.querySelector("[data-fold]"), r.textContent);
  assert.ok(app.$$('#main select[data-sel^="skill|martial-arts"]').length, "Martial Arts' style picks are gone");
  assert.ok(rows.find(r => r.querySelector(".name").textContent.startsWith("Handguns")).querySelector(".skstats"), "the stat line is gone");
  app.click('[data-fold="skill|handguns"]');
  assert.equal(shown().length, 1);
  app.click('[data-step="skill|handguns|1"]');
  assert.equal(shown().length, 1, "a rank press closed it");
});

test("P13 3: Expert mode is the browser's, never the character's", () => {
  const app = onStep("professional", "street", "skills", () => {});
  const ch0 = JSON.stringify(app.window.eval("S.ch"));
  const toggle = () => app.$("#hdractions [data-expert]");
  assert.equal(toggle().getAttribute("aria-pressed"), "false");
  app.click("#hdractions [data-expert]");
  assert.equal(app.window.localStorage.getItem("shadows.ui.expert"), "on");
  assert.equal(toggle().getAttribute("aria-pressed"), "true");
  assert.equal(JSON.stringify(app.window.eval("S.ch")), ch0, "the character changed");
  assert.ok(!JSON.stringify(draft(app)).includes("expert"), "it was saved in the character");
  assert.ok(!app.$$("#main .alloc-row .name small").some(s => !s.classList.contains("next-cost") && !s.hidden));
  app.click("#hdractions [data-expert]");
  assert.equal(app.window.localStorage.getItem("shadows.ui.expert"), null);
  assert.ok(app.$$("#main .alloc-row .name small").filter(s => !s.classList.contains("next-cost")).every(s => !s.hidden));
  assert.equal(JSON.stringify(app.window.eval("S.ch")), ch0);
  // A boot with the key set starts folded; storage that throws starts unfolded, with no error.
  assert.equal(onStep("professional", "street", "skills", () => {}, EXPERT).$$("#main [data-foldbody]:not([hidden])").length, 0);
  const bad = onStep("professional", "street", "skills", () => {});
  bad.window.eval(`(()=>{ const g=Storage.prototype.getItem, s=Storage.prototype.setItem;
    Storage.prototype.getItem=function(k){ if(k==="shadows.ui.expert") throw new Error("denied"); return g.call(this,k); };
    Storage.prototype.setItem=function(k,v){ if(k==="shadows.ui.expert") throw new Error("denied"); return s.call(this,k,v); }; })()`);
  bad.window.eval("update()");
  assert.equal(bad.$$("#main [data-foldbody]").length, 0);
  bad.click("#hdractions [data-expert]");
  assert.deepEqual(bad.errors, []);
});

test("P13 4: the CP Boosts heading names Max CP Boost, and every stepper keeps its count", async () => {
  for (const pl of D.powerLevels.slice(0, 2)) {
    for (const store of [{}, EXPERT]) {
      const app = onStep("professional", pl.id, "character-points", () => {}, store);
      const h = app.$$("#main .sect").find(s => /Character Point Boosts/.test(s.textContent));
      assert.ok(h, "no Boosts heading");
      assert.match(h.textContent, new RegExp(`Max CP Boost \\+${pl.maxBoost}\\b`), `${pl.id}: ${h.textContent}`);
      assert.doesNotMatch(h.textContent, /up to \d+ each/);
      for (const s of app.$$("#main .stepper")) {
        const kids = [...s.children].map(c => c.tagName + (c.className ? "." + c.className : ""));
        assert.deepEqual(kids, ["BUTTON", "INPUT.val", "BUTTON"]);   // J3: the value is a typed field
      }
    }
  }
  const app = onStep("professional", "street", "character-points", () => {}, EXPERT);
  app.click('[data-step="boost|stat|BOD|1"]');
  await new Promise(r => app.window.setTimeout(r, 60));
  assert.match(app.$("#announcer").textContent, /^boosts to Body 1$/);
});

test("P13 5: the CP filter finds an entry by its name, in both modes", () => {
  for (const store of [{}, EXPERT]) {
    const app = openLists(cpExpert(() => {}, store));
    typeFilter(app, "Ambidextrous");
    assert.deepEqual(shownNames(app), ["Ambidextrous"], "the name didn't find its entry");
    assert.equal(app.$("#main [data-jumpcount]").textContent, "1 of 88");
    typeFilter(app, "Animal Ken");
    assert.deepEqual(shownNames(app), ["Animal Ken"]);
    typeFilter(app, "called shot");                          // only in a description
    assert.ok(shownNames(app).includes("Bullseye"), "folded text can't be found");
    typeFilter(app, "");
    assert.equal(shownNames(app).length, 88);
  }
  // Held entries stay, as before.
  const app = openLists(cpExpert(holdThree));
  typeFilter(app, "Ambidextrous");
  assert.deepEqual(shownNames(app).sort(), ["Ambidextrous", "Blood Lust", "Bullseye", "Common Sense"]);
});

test("P13 6: the header's Expert mode toggle shows on every creation step (P19 9) and keeps the keyboard's place", () => {
  const steps = [...D.creationFlow.steps.map(s => s.id), "review"];
  for (const id of steps) {
    const app = onStep("professional", "street", id, () => {});
    assert.ok(app.$("#hdractions [data-expert]"), `${id}: toggle absent`);
    assert.ok(app.$("#hdractions [data-home]"), `${id}: Home was pushed out`);
  }
  const app = onStep("professional", "street", "skills", () => {});
  for (const want of ["true", "false", "true"]) {
    app.$("#hdractions [data-expert]").focus();
    app.click("#hdractions [data-expert]");
    assert.equal(app.$("#hdractions [data-expert]").getAttribute("aria-pressed"), want);
    assert.equal(app.window.document.activeElement, app.$("#hdractions [data-expert]"), "focus left the toggle");
  }
  assert.ok(!openSheet(lockedCharacter(), "main").$("[data-expert]"), "the sheet has the toggle");
});

test("P13 7: Expert mode folds the Archetype step's prose and keeps what each choice gives", () => {
  for (const [arch, spec] of [["professional", ["mercenary"]], ["arcanist", ["arcane-fortitude"]]]) {
    const app = onStep(arch, "street", "archetype", ch => { ch.archetypeChoices.specialization = spec; }, EXPERT);
    assert.deepEqual(app.errors, [], arch);
    const prose = app.$$("#main [data-foldbody]");
    assert.ok(prose.length >= 5, `${arch}: only ${prose.length} folded texts`);
    assert.ok(prose.every(p => p.hidden), `${arch}: prose is shown`);
    // The archetype cards' summaries fold, each with a ? outside the card button.
    assert.ok(app.$$("#main [data-arch]").every(b => !b.querySelector("[data-fold]")), "a ? inside a button");
    assert.ok(app.$$("#main [data-arch]").every(b => hiddenIn(b.querySelector("p"))), "a card summary is shown");
    const lore = app.$("#main .arch-lore"); assert.ok(lore && hiddenIn(lore), "the lore is shown");
    const style = app.Engine.archetype(app.window.eval("S.ch")).gameplayStyle;
    if (style) assert.ok(app.$$("#main .step-note").filter(p => p.textContent.includes(style.slice(0, 40))).every(hiddenIn), "the gameplay style is shown");
    // What a choice gives stays.
    const mech = app.$$("#main .desc[data-mech]");
    assert.ok(mech.length >= 1 && mech.every(m => !hiddenIn(m)), `${arch}: a labelled line folded`);
    assert.ok(mech.every(m => m.firstElementChild && m.firstElementChild.tagName === "B"), "a prose line is marked as mechanics");
    const labelled = app.$$("#main .pick .desc").filter(d => d.firstElementChild && d.firstElementChild.tagName === "B");
    assert.ok(labelled.length && labelled.every(d => d.matches("[data-mech]")), "a labelled line isn't marked");
    assert.ok(app.$$("#main [data-spec]").length >= 6, "choice controls are gone");
    const need = app.Engine.specializationNeed(app.window.eval("S.ch"));
    if (need > 1) assert.match(app.$("#main").textContent, new RegExp(`\\d/${need} chosen`), "the count of choices folded");
    // ? opens an option's text, in place.
    const opt = app.$$('#main [data-fold^="spec|"]')[0];
    assert.ok(opt, `${arch}: an option has no ?`);
    app.click(`[data-fold="${opt.dataset.fold}"]`);
    assert.ok(app.$$(`#main [data-foldbody="${opt.dataset.fold}"]`).every(e => !e.hidden));
    assert.equal(opt.getAttribute("aria-expanded"), "true");
  }
  // Off: nothing folded, nothing marked.
  const off = onStep("professional", "street", "archetype", ch => { ch.archetypeChoices.specialization = ["mercenary"]; });
  assert.equal(off.$$("#main [data-fold], #main [data-foldbody], #main [data-mech]").length, 0);
});

test("P13 8: Held only shows the build, and works with the filter", () => {
  // Educated is held as natural ranks only (a Professional's free ones): it's held, though it has no bought row.
  const app = openLists(cpExpert(ch => { holdThree(ch); ch.advantages.push({ id: "educated", rank: 2, notes: "", source: "natural" }); }, {}));
  const held = ["Blood Lust", "Bullseye", "Common Sense", "Educated"];
  assert.ok(app.$("#main [data-heldonly]"), "no Held only toggle");
  assert.equal(app.$("#main [data-heldonly]").getAttribute("aria-pressed"), "false");
  app.click("#main [data-heldonly]");
  assert.deepEqual(shownNames(app).sort(), held);
  assert.equal(app.$("#main [data-jumpcount]").textContent, "4 held");
  assert.equal(app.$("#main [data-heldonly]").getAttribute("aria-pressed"), "true");
  typeFilter(app, "ambidextrous");                         // held stay; a match that isn't held doesn't join
  assert.deepEqual(shownNames(app).sort(), held, "a filter match that isn't held showed under Held only");
  app.click('[data-step="luck|x|1"]');                     // a re-render keeps both
  assert.deepEqual(shownNames(app).sort(), held);
  assert.equal(app.$("#main [data-heldonly]").getAttribute("aria-pressed"), "true");
  assert.equal(app.$("#main [data-jumpfilter]").value, "ambidextrous");
  app.click("#main [data-heldonly]");                      // off: the filter is still on
  assert.deepEqual(shownNames(app).sort(), ["Ambidextrous", ...held].sort());
  typeFilter(app, "");
  assert.equal(shownNames(app).length, 88);
  // It stops being shown once it's no longer held.
  app.click("#main [data-heldonly]");
  app.click('[data-step="adv|bullseye|-1"]');
  assert.deepEqual(shownNames(app).sort(), ["Blood Lust", "Common Sense", "Educated"]);
  assert.equal(app.$("#main [data-jumpcount]").textContent, "3 held");
  assert.deepEqual(app.errors, []);
});

test("P13 9: the Skills step's bar keeps Remaining in view and finds a skill by name", () => {
  const app = onStep("professional", "street", "skills", ch => { ch.skills.dodge = { rank: 1, ipe: 0 }; });
  const bar = app.$("#main .jumpbar.sticky");
  assert.ok(bar, "no sticky bar on Skills");
  const before = Number(/Remaining (\d+)/.exec(bar.textContent)[1]);
  app.click('[data-step="skill|handguns|1"]');
  assert.equal(Number(/Remaining (\d+)/.exec(app.$("#main .jumpbar.sticky").textContent)[1]), before - 1, "Remaining didn't follow a rank press");
  assert.deepEqual(app.$$("#main .jumpbar [data-jump]").map(b => b.textContent), ["Combat", "Utility", "General"]);
  const names = () => app.$$("#main .alloc-row").filter(r => !r.hidden).map(r => r.querySelector(".name").firstChild.textContent.trim());
  const f = app.$("#main [data-jumpfilter]"); f.value = "Handguns"; f.dispatchEvent(new app.window.Event("input"));
  assert.deepEqual(names(), ["Handguns"]);
  app.click('[data-step="skill|handguns|1"]');
  assert.equal(app.$("#main [data-jumpfilter]").value, "Handguns", "a rank press dropped the filter");
  assert.deepEqual(names(), ["Handguns"]);
  const g = app.$("#main [data-jumpfilter]"); g.value = ""; g.dispatchEvent(new app.window.Event("input"));
  assert.equal(names().length, D.skills.length);
  // The bar is spliced into the page, so a "$" pattern typed in the filter must stay text across a re-render.
  for (const q of ["$'", "$&", "$`"]) {
    const h = app.$("#main [data-jumpfilter]"); h.value = q; h.dispatchEvent(new app.window.Event("input"));
    app.click('[data-step="skill|handguns|1"]');
    assert.equal(app.$$("#main .alloc-row").length, D.skills.length, `the filter "${q}" duplicated the skills`);
    assert.equal(app.$("#main [data-jumpfilter]").value, q);
  }
  assert.deepEqual(app.errors, []);
});

test("P13 10: the Natural Advantages panel shows the tags, held or general, and keeps them when its text folds", () => {
  const general = D.advantages.find(a => a.id === "favored-skill").grants.find(g => g.type === "rule").ruleText;
  const panel = app => app.$$("#main .pick").find(p => p.querySelector("h2") && p.querySelector("h2").textContent === "Favored Skill");
  const setup = ch => { ch.archetypeChoices.specialization = ["mercenary"]; };
  let app = onStep("professional", "street", "archetype", setup);
  assert.ok(panel(app), "the Natural Advantages panel has no Favored Skill");
  assert.equal(panel(app).querySelector(".effects .etag.rule").textContent, general);
  const kids = [...panel(app).children].map(c => c.className.split(" ")[0]);
  assert.ok(kids.indexOf("effects") > kids.indexOf("head") && kids.indexOf("effects") < kids.indexOf("desc"), kids.join(","));
  const held = ch => {
    setup(ch); ch.archetypeChoices.naturalAdvantages = [{ id: "favored-skill", rank: 1 }];
    ch.advantages = [{ id: "favored-skill", rank: 1, notes: "", source: "natural", selections: { skill: ["stealth"] } }];
  };
  for (const store of [{}, EXPERT]) {
    app = onStep("professional", "street", "archetype", held, store);
    const tag = panel(app).querySelector(".effects .etag.rule").textContent;
    assert.match(tag, /Stealth/, "the held tag doesn't name the pick");
    assert.notEqual(tag, general);
    if (store === EXPERT) {
      assert.ok(hiddenIn(panel(app).querySelector(".desc")), "the panel's text is shown");
      assert.ok(!hiddenIn(panel(app).querySelector(".effects")), "the panel's tags folded");
      assert.ok(panel(app).querySelector("[data-fold]"));
    }
  }
});

test("the Stats step's line says point buy unless the table rolls for Stat Points", () => {
  const line = app => app.$("#main .step-note").textContent;
  const flat = onStep("professional", "street", "stats");
  assert.match(line(flat), /point buy/i);
  assert.doesNotMatch(line(flat), /roll|explosion/i, "a point-buy character is told to roll");
  const rolled = onStep("professional", "street", "stats", ch => { ch.creation.statMethod = "rolled"; });
  assert.match(line(rolled), /^Roll for your Stat Points/);
  assert.match(line(rolled), /Explosions do not happen on creation rolls\./);
  // Ticking the box on the Power Level step changes the line it leads to.
  const pl = onStep("professional", "street", "power-level");
  pl.$("#main [data-stat-rolled]").checked = true;
  pl.$("#main [data-stat-rolled]").dispatchEvent(new pl.window.Event("change"));
  pl.window.eval(`S.step = STEPS.findIndex(s => s.id === "stats"); update();`);
  assert.match(line(pl), /^Roll for your Stat Points/);
  assert.deepEqual([...flat.errors, ...rolled.errors, ...pl.errors], []);
});

// ── P19 (the rider): Expert mode reaches the Stats step, and its toggle is in the header on every step (Decision 234) ──

const ALL_STEPS = [...D.creationFlow.steps.map(s => s.id), "review"];

test("P19 9: the Expert mode toggle is in the header on every step of character creation", () => {
  assert.equal(ALL_STEPS.length, 8);
  for (const id of ALL_STEPS) {
    const app = onStep("professional", "street", id, () => {});
    const btn = app.$("#hdractions [data-expert]");
    assert.ok(btn, `${id}: no toggle`);
    assert.equal(btn.getAttribute("aria-pressed"), "false", id);
    assert.equal(btn.getAttribute("aria-label"), "Expert mode", id);
    assert.equal(btn.getAttribute("title"), D.appCopy.expertTitle, `${id}: the title`);
    assert.match(D.appCopy.expertTitle, /Stats, Archetype, Skills and Character Points/);
    assert.ok(app.$("#hdractions [data-home]"), `${id}: Home was pushed out`);
    // The first-sight hint is on the four steps it describes, and nowhere else.
    const hint = app.$$("#main .expert-hint").length;
    assert.equal(hint, ["stats", "archetype", "skills", "character-points"].includes(id) ? 1 : 0, `${id}: hint ×${hint}`);
  }
  // Off the wizard: Home and the sheet have none.
  assert.ok(!boot().$("[data-expert]"), "Home has the toggle");
  assert.ok(!openSheet(lockedCharacter(), "main").$("[data-expert]"), "the sheet has the toggle");
  // On Concept a press changes the setting and the button, and nothing else you can see.
  const app = onStep("professional", "street", "concept", () => {});
  const main0 = app.$("#main").innerHTML, ch0 = JSON.stringify(app.window.eval("S.ch"));
  app.$("#hdractions [data-expert]").focus();
  app.click("#hdractions [data-expert]");
  assert.equal(app.$("#hdractions [data-expert]").getAttribute("aria-pressed"), "true");
  assert.equal(app.window.localStorage.getItem("shadows.ui.expert"), "on");
  assert.equal(app.window.document.activeElement, app.$("#hdractions [data-expert]"), "focus left the toggle");
  assert.equal(app.$("#main").innerHTML, main0, "a press on Concept changed the page");
  assert.equal(JSON.stringify(app.window.eval("S.ch")), ch0);
  app.click("#hdractions [data-expert]");
  assert.equal(app.$("#hdractions [data-expert]").getAttribute("aria-pressed"), "false");
  assert.equal(app.$("#main").innerHTML, main0);
  assert.deepEqual(app.errors, []);
});

test("P19 10: Expert mode folds the Stats step's descriptions and keeps every control", () => {
  const on = onStep("professional", "street", "stats", ch => { ch.stats.BOD.base = 7; }, EXPERT);
  assert.deepEqual(on.errors, []);
  const rows = on.$$("#main .alloc-row");
  assert.equal(rows.length, D.stats.length);
  const descs = () => on.$$("#main .alloc-row .name small").filter(s => !s.classList.contains("next-cost"));
  assert.equal(descs().length, 8);
  assert.ok(descs().every(s => s.hidden), "a description is shown");
  for (const r of rows) {
    assert.ok(r.querySelector(".name") && r.querySelector(".stepper .val") && r.querySelector(".mod") && r.querySelector("[data-fold]"), r.textContent);
    assert.ok(!hiddenIn(r.querySelector(".stepper")) && !hiddenIn(r.querySelector(".mod")));
  }
  const body = rows[0];
  assert.match(body.querySelector(".name").textContent, /^Body/);
  assert.equal(body.querySelector(".stepper .val").value, "7");   // J3: the value is a typed field
  const next = body.querySelector(".next-cost");
  assert.ok(next && !hiddenIn(next), "the price folded");
  assert.match(next.textContent, /^The next point costs 2\.$/);
  // ? opens Body's text, in place, and a stepper press keeps it open.
  on.click('[data-fold="stat|BOD"]');
  assert.equal(on.$('[data-fold="stat|BOD"]').getAttribute("aria-expanded"), "true");
  assert.equal(descs().filter(s => !s.hidden).length, 1);
  assert.match(descs().find(s => !s.hidden).textContent, /\S/);
  on.click('[data-step="stat|BOD|-1"]');
  assert.equal(descs().filter(s => !s.hidden).length, 1, "a stepper press closed it");
  assert.equal(on.$$("#main .alloc-row")[0].querySelector(".stepper .val").value, "6");   // J3: the value is a typed field
  // The pool and the buy rule stay.
  assert.match(on.$("#main .pool").textContent, /Pool/);
  assert.ok(on.$("#main .dice-note") && !hiddenIn(on.$("#main .dice-note")), "the buy rule folded");
  // Off: the page is as it was, with no ? and nothing hidden.
  const off = onStep("professional", "street", "stats", ch => { ch.stats.BOD.base = 7; });
  assert.equal(off.$$("#main [data-fold], #main [data-foldbody]").length, 0);
  assert.ok(off.$$("#main .alloc-row .name small").every(s => !s.hidden));
  assert.equal(off.$$("#main .alloc-row .name small").filter(s => !s.classList.contains("next-cost")).length, 8);
  assert.deepEqual(off.errors, []);
});

// ── P20a: numbers at creation (Decision 235) ─────────────────────────────
// Every stat at 3 but the ones named, so the pool has points left and the + is disabled only by a cap.

const low20 = (extra = {}) => ch => {
  for (const id of Object.keys(ch.stats)) ch.stats[id].base = 3;
  Object.assign(ch.stats.BOD, { base: 3 });
  for (const [id, v] of Object.entries(extra)) ch.stats[id].base = v;
};

const trait20 = (id, rank = 1) => ({ id, rank, notes: "" });

const upBtn = (app, id) => app.$(`[data-step="stat|${id}|1"]`);

test("P20a 5: the Stats step shows and enforces the cap", () => {
  const dwarf = ch => { low20({ BOD: 8, MOB: 3 })(ch); ch.disadvantages = [trait20("dwarf")]; };
  for (const expert of [false, true]) {
    const app = onStep("professional", "street", "stats", dwarf, expert ? EXPERT : {});
    assert.deepEqual(app.errors, []);
    const row = id => upBtn(app, id).closest(".alloc-row");
    assert.ok(upBtn(app, "MOB").disabled, "MOB's + is open at Dwarf's cap");
    assert.ok(upBtn(app, "BOD").disabled, "BOD's + is open at 8");
    assert.ok(!upBtn(app, "REF").disabled, "REF's + is shut with nothing in its way");
    assert.match(row("MOB").textContent, /Max 3 \(Dwarf\)\./);
    assert.match(row("BOD").textContent, /Max 8 \(Dwarf\)\./);
    assert.doesNotMatch(row("REF").textContent, /Max \d/);
    const line = row("MOB").querySelector(".stat-max");
    assert.ok(line && line.classList.contains("next-cost") && !line.hidden, `Expert ${expert}: the cap line is hidden or loses its class`);
    // The press is refused too, not only the button.
    app.window.eval("applyStep('stat|MOB', 1)");
    assert.equal(app.window.eval("S.ch.stats.MOB.base"), 3);
    app.window.eval("applyStep('stat|REF', 1)");
    assert.equal(app.window.eval("S.ch.stats.REF.base"), 4);
  }
  // Nothing held: the stat tops out at 10, as before, and says nothing about a max.
  const plain = onStep("professional", "street", "stats", low20({ BOD: 10 }));
  assert.ok(upBtn(plain, "BOD").disabled);
  assert.equal(plain.$$("#main .stat-max").length, 0);
  // Giant: BOD can reach 11, REF stops at 5.
  const giant = onStep("professional", "street", "stats", ch => { low20({ BOD: 10, REF: 5 })(ch); ch.disadvantages = [trait20("giant")]; });
  assert.ok(!upBtn(giant, "BOD").disabled, "a Giant's BOD stops at 10");
  assert.ok(upBtn(giant, "REF").disabled);
  assert.match(upBtn(giant, "BOD").closest(".alloc-row").textContent, /Max 11 \(Giant\)\./);
  giant.window.eval("applyStep('stat|BOD', 1)");
  assert.equal(giant.window.eval("S.ch.stats.BOD.base"), 11);
  giant.window.eval("update()");
  assert.ok(upBtn(giant, "BOD").disabled, "BOD went past 11");
});

test("P20a 4: a cap already passed shows on the card and refuses the lock; nothing lowers a stat", () => {
  const over = ch => { ch.stats.MOB.base = 5; ch.disadvantages = [trait20("dwarf")]; };
  const app = onStep("professional", "street", "character-points", over);
  const pick = name => app.$$("#main .pick").find(p => p.querySelector("h2") && p.querySelector("h2").textContent === name);
  assert.equal(pick("Dwarf").querySelector(".effects .etag.over").textContent, "MOB is 5, over Dwarf's max of 3.");
  assert.equal(pick("Giant").querySelector(".etag.over"), null);
  assert.equal(app.window.eval("S.ch.stats.MOB.base"), 5, "the CP step lowered MOB");
  // The lock is refused, with the stat, the cap, the trait and where to fix it.
  const half = named("Over"); half.creation.locked = false; half.stats.MOB.base = 5; half.disadvantages = [trait20("dwarf")];
  const rev = boot({ storage: { "shadows.draft.v1": { ch: half, step: 7, maxReached: 7 } } });
  card(rev, "Over").querySelector("[data-open]").click();
  assert.equal(rev.$("[data-lock]").disabled, true, "Lock was open with MOB over Dwarf's cap");
  assert.match(rev.$("#wiz-issues").textContent, /MOB is 5, over Dwarf's max of 3\. Lower it on the Stats step\./);
  assert.equal(rev.window.eval("S.ch.stats.MOB.base"), 5);
  // At the cap the card is quiet.
  const ok = onStep("professional", "street", "character-points", ch => { ch.stats.MOB.base = 3; ch.disadvantages = [trait20("dwarf")]; });
  assert.equal(ok.$$("#main .etag.over").length, 0);
  assert.deepEqual([app.errors, rev.errors, ok.errors], [[], [], []]);
});

test("P20a 4: an Advantage's cap, passed, shows on its card as a Disadvantage's does (Decision 135)", () => {
  const app = onStep("professional", "street", "character-points", ch => { ch.stats.MOB.base = 5; ch.advantages = [trait20("wealthy")]; });
  app.window.eval(`D.advantages.find(a => a.id === "wealthy").grants.push({ type: "statMax", stat: "MOB", max: 3 }); update();`);
  const pick = app.$$("#main .pick").find(p => p.querySelector("h2") && p.querySelector("h2").textContent === "Wealthy");
  assert.equal(pick.querySelector(".effects .etag.over").textContent, "MOB is 5, over Wealthy's max of 3.");
  assert.deepEqual(app.errors, []);
});

test("P20a 6: Dwarf and Giant lock each other on the CP step", () => {
  const pickOf = (app, name) => app.$$("#main .pick").find(p => p.querySelector("h2") && p.querySelector("h2").textContent === name);
  for (const [held, other, byName] of [["dwarf", "Giant", "Dwarf"], ["giant", "Dwarf", "Giant"]]) {
    const app = onStep("professional", "street", "character-points", ch => { ch.disadvantages = [trait20(held)]; });
    const card = pickOf(app, other);
    assert.ok(card.querySelector("[data-step^='disadv|'][data-step$='|1']").disabled, `${other}'s + is open`);
    assert.match(card.querySelector(".head").textContent, new RegExp(`locked by ${byName}`));
    assert.deepEqual(app.errors, []);
  }
});

test("Decision 296: Reputation and Burned lock each other on the CP step, and their cards say the start", () => {
  const pickOf = (app, name) => app.$$("#main .pick").find(p => p.querySelector("h2") && p.querySelector("h2").textContent === name);
  const rep = onStep("professional", "street", "character-points", ch => { ch.advantages = [trait20("reputation", 2)]; });
  const burnedCard = pickOf(rep, "Burned");
  assert.ok(burnedCard.querySelector("[data-step^='disadv|'][data-step$='|1']").disabled, "Burned's + is open beside Reputation");
  assert.match(burnedCard.querySelector(".head").textContent, /locked by Reputation/);
  assert.match(pickOf(rep, "Reputation").querySelector(".effects").textContent, /Starts CRANK rep at 12/);
  assert.match(pickOf(rep, "Reputation").querySelector(".effects").textContent, /Creation only/);
  const bur = onStep("professional", "street", "character-points", ch => { ch.disadvantages = [trait20("burned", 2)]; });
  const repCard = pickOf(bur, "Reputation");
  assert.ok(repCard.querySelector("[data-step^='adv|'][data-step$='|1']").disabled, "Reputation's + is open beside Burned");
  assert.match(repCard.querySelector(".head").textContent, /locked by Burned/);
  assert.match(pickOf(bur, "Burned").querySelector(".effects").textContent, /Starts CRANK rep at −4/);
  assert.deepEqual([rep.errors, bur.errors], [[], []]);
});

test("Decision 296: the lock writes Reputation's start once, as a ledger line", () => {
  const half = named("Known"); half.creation.locked = false; half.creation.rolls.credits = 6;
  half.creation.powerLevel = "street"; half.advantages = [trait20("reputation", 2)];
  const app = boot({ storage: { "shadows.draft.v1": { ch: half, step: 7, maxReached: 7 } } });
  withDownloads(app);
  card(app, "Known").querySelector("[data-open]").click();
  app.click("[data-lock]");
  assert.equal(app.window.eval("S.ch.trackers.crank.rep"), 12);
  assert.equal(app.window.eval("S.ch.trackers.crank.ledger.map(e => e.note).join('|')"), "Start: Reputation rank 2");
  assert.deepEqual(app.errors, []);
});

test("P20a 7: the review line shows Wealthy's Ç10,000 and the lock seeds it, once", () => {
  const mult = D.powerLevels.find(p => p.id === "street").startingCredits.multiplier;
  const half = named("Rich"); half.creation.locked = false; half.creation.rolls.credits = 6;
  half.creation.powerLevel = "street"; half.advantages = [trait20("wealthy", 2)];
  const app = boot({ storage: { "shadows.draft.v1": { ch: half, step: 7, maxReached: 7 } } });
  const got = withDownloads(app);
  card(app, "Rich").querySelector("[data-open]").click();
  const n = v => v.toLocaleString("en-US");
  assert.match(app.$("#main .roll-entry .pool").textContent, new RegExp(`Starting .*${n(6 * mult)} \\+ 10,000 Wealthy = ${n(6 * mult + 10000)}`));
  app.click("[data-lock]");
  assert.equal(got.length, 1);
  assert.equal(app.window.eval("S.ch.trackers.credits.current"), 6 * mult + 10000);
  // A character with none of it reads the plain product, as before.
  const plain = named("Plain"); plain.creation.locked = false; plain.creation.rolls.credits = 6; plain.creation.powerLevel = "street";
  const p = boot({ storage: { "shadows.draft.v1": { ch: plain, step: 7, maxReached: 7 } } });
  card(p, "Plain").querySelector("[data-open]").click();
  assert.match(p.$("#main .roll-entry .pool").textContent, new RegExp(`Starting .*${6 * mult}\\b(?! \\+)`));
  assert.doesNotMatch(p.$("#main .roll-entry .pool").textContent, /Wealthy|=/);
  assert.deepEqual([app.errors, p.errors], [[], []]);
});

test("P20a 9: the breakdowns name the parts", () => {
  const app = boot();
  const bd = (mut, id) => app.window.eval(`(()=>{ const c = Engine.newCharacter(); c.creation.powerLevel = ${JSON.stringify(D.powerLevels[0].id)}; ${mut}; return derivedBreakdownStr(c, ${JSON.stringify(id)}); })()`);
  const hold = (list, id, rank = 1) => `c.${list}.push({ id: ${JSON.stringify(id)}, rank: ${rank}, notes: "" })`;
  // Neither a floor nor a cap applies: no "floor / cap" in the line.
  assert.equal(bd("c.stats.EMP.base = 6", "SAN"), "EMP 6 × 10 = 60%");
  assert.equal(bd(`c.stats.EMP.base = 6; ${hold("disadvantages", "berserker")}`, "SAN"), "EMP 6 × 10 = 60% − 15 Berserker → 45%");
  assert.equal(bd(`c.stats.EMP.base = 6; ${hold("disadvantages", "minor-insanity", 3)}`, "SAN"), "EMP 6 × 10 = 60% − 15 Minor Insanity → 45%");
  // The cap comes first and is named as the cap; the cut comes after it.
  assert.equal(bd(`c.stats.EMP.base = 10; ${hold("disadvantages", "blood-lust")}`, "SAN"), "EMP 10 × 10 = 100% → 95% (cap 95) − 5 Blood Lust → 90%");
  // The floor of 1 is its own clause.
  const low = bd(`c.stats.EMP.base = 1; ${hold("disadvantages", "berserker")}; ${hold("disadvantages", "hallucinations")}`, "SAN");
  assert.equal(low, "EMP 1 × 10 = 10% − 15 Berserker − 25 Hallucinations → 1% (never lower)");
  for (const s of [bd(`c.stats.EMP.base = 6; ${hold("disadvantages", "berserker")}`, "SAN"), low]) assert.doesNotMatch(s, /floor \/ cap/);
  // The Trackers tab's Sanity says the same, not "EMP × 10" over a cut number (Reviewer, P20a).
  const berserk = lockedCharacter(); berserk.stats.EMP.base = 6; berserk.disadvantages = [trait20("berserker")];
  const trk = openSheet(berserk, "trackers");
  assert.match(trk.$("#main").textContent, /45 \/ 45%/);
  assert.match(trk.$("#main").textContent, /Max is EMP 6 × 10 = 60% − 15 Berserker → 45%, computed/);
  assert.deepEqual(trk.errors, []);
  // TOL: the Aberration is named, and the line is the number.
  const tol = bd("c.identity.archetype = 'arcanist'; c.archetypeChoices.specialization = ['arcane-fortitude']; for (const k of Object.keys(c.stats)) c.stats[k].base = 5", "TOL");
  assert.match(tol, /\+ 2 Arcane Fortitude → \d+$/);
  assert.equal(bd("c.identity.archetype = 'arcanist'; c.archetypeChoices.specialization = ['unshakable-mind']; for (const k of Object.keys(c.stats)) c.stats[k].base = 5", "TOL"), "1 + INT 0 + BOD 0 + COOL 0 = 1");
  assert.deepEqual(app.errors, []);
});

test("P21 10 (wizard): a Fence's option shows the note a player needs", () => {
  const arch = onArchetypeStep("professional");
  const fence = [...arch.$$("#main .pick")].find(p => /Fence/.test(p.querySelector("h2") ? p.querySelector("h2").textContent : ""));
  assert.ok(fence, "the Fence option isn't on the Archetype step");
  assert.match(fence.textContent, /Your GM names the Skill an appraisal uses\. Add the 1d4 to that roll\./);
  assert.deepEqual(arch.errors, []);
});

// ── W143: Disciplines take Boosts; the Power Level card has no Power cap (Decision 265) ──

test("Decision 265: a Street Arcanist's Evocation 3 opens TH 3 starting spells", () => {
  const five = D.disadvantages.find(d => d.pointsGranted === 5);
  const app = arcanistOnCP(ch => {
    ch.archetypeChoices.rolls.startingSpells = 3;
    ch.disadvantages = [{ id: five.id, rank: 1, notes: "" }];             // 5 Disadvantage points: 10 CP in all
  });
  app.click('[data-spellpickopen="wizard"]');
  search(app, "fireball");                                               // Advanced, TH 3
  assert.equal(app.$('#modal [data-startadd="fireball"]').disabled, true, "a TH 3 spell was open at Evocation 1");
  assert.match(app.$('#modal [data-startadd="fireball"]').textContent, /Needs Evocation 3/);
  app.$("#modal").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  app.click('[data-step="disc|evocation|1"]'); app.click('[data-step="disc|evocation|1"]');
  app.click('[data-spellpickopen="wizard"]');
  search(app, "fireball");
  assert.equal(app.$('#modal [data-startadd="fireball"]').disabled, false, "Evocation 3 didn't open TH 3");
  assert.deepEqual(app.errors, []);
});

test("Decision 265: the Power Level card has no Power cap chip, and the Disciplines heading names the Max CP Boost", () => {
  const first = D.creationFlow.steps[0].id;
  const card1 = onStep("arcanist", "street", first);
  assert.doesNotMatch(card1.$("#main").textContent, /Power cap|Max Power Rank/);
  assert.match(card1.$("#main").textContent, /Max Character Point Boost/);
  const cp = onStep("arcanist", "heroic", "character-points");
  assert.match(cp.$("#main").textContent, /Disciplines — 5 CP per rank · up to \+3 each \(Max CP Boost\)/);
  assert.doesNotMatch(cp.$("#main").textContent, /Max Power Rank/);
  // Enchantment says what it needs, and its + is off with that for a title.
  const ench = cp.$('[data-step="disc|enchantment|1"]');
  assert.equal(ench.disabled, true);
  assert.match(ench.closest(".pick").textContent, /needs Evocation 3/);
  assert.match(ench.closest(".controls").querySelector(".mod").title, /^Enchantment needs Evocation 3\.$/);
  // Bought, then Evocation lowered under it (BQ7): the row still says what it needs.
  cp.click('[data-step="disc|evocation|1"]'); cp.click('[data-step="disc|enchantment|1"]'); cp.click('[data-step="disc|evocation|-1"]');
  const ench2 = cp.$('[data-step="disc|enchantment|1"]').closest(".pick");
  assert.match(ench2.textContent, /rank 1/);
  assert.match(ench2.textContent, /needs Evocation 3/, "a broken prerequisite went quiet on its row");
  assert.deepEqual([card1.errors, cp.errors], [[], []]);
});

// ── E1b: a first-timer's wizard (Decisions 274 to 277) ──────────────────

const todoNav = app => (app.$(".wiznav-why") || {}).textContent;

const specArch = () => D.archetypes.find(a => ((a.specialization || {}).options || []).some(o => o.requires && o.requires.stats));

const statOpt = () => specArch().specialization.options.find(o => o.requires && o.requires.stats);

const typeInto = (app, el, v) => { el.value = v; el.dispatchEvent(new app.window.Event("input", { bubbles: true })); };

test("Decision 274: a new character's first step shows what's left to do, not an error", () => {
  const app = newCharacterApp();
  assert.equal(app.$$("#wiz-issues li.todo").length, 1);
  assert.equal(app.$$("#wiz-issues li.error:not(.todo)").length, 0);
  assert.equal(todoNav(app), "1 left to do");
  assert.equal(app.$('[data-nav="1"]').disabled, true, "Continue let a missing Power Level through");
  app.click("[data-pl]");
  assert.equal(app.$$("#wiz-issues li").length, 0);
  assert.equal(app.$('[data-nav="1"]').disabled, false);
  app.click('[data-nav="1"]');
  assert.equal(app.$$("#wiz-issues li.todo").length, 1, "step 2 doesn't ask for the name as a to-do");
  assert.equal(app.$$("#wiz-issues li.error:not(.todo)").length, 0);
  assert.equal(todoNav(app), "1 left to do");
  // Typing a name redraws the nav in place: the wording must follow.
  const el = app.$('[data-id="name"]');
  typeInto(app, el, "Ada");
  assert.equal(app.$$("#wiz-issues li").length, 0);
  assert.equal(todoNav(app), undefined);
  typeInto(app, el, "");
  assert.equal(todoNav(app), "1 left to do", "the in-place redraw flipped the wording");
  assert.deepEqual(app.errors, []);
});

test("Decision 274: a wrong value is an error beside a to-do, and the nav says to fix", () => {
  const a = specArch(), o = statOpt();
  const app = onStep(a.id, D.powerLevels[0].id, "archetype", ch => {
    for (const id of Object.keys(ch.stats)) ch.stats[id].base = D.statRules.base;
    ch.archetypeChoices.specialization = [o.id];
  });
  assert.ok(app.$$("#wiz-issues li.error:not(.todo)").length >= 1, "no unmet requirement shown as an error");
  assert.ok(app.$$("#wiz-issues li.todo").length >= 1, "no to-do beside it");
  assert.match(todoNav(app), /^\d+ to fix first$/);
  assert.match(wizCss(), /\.issues li\.todo\{color:var\(--dim\)\}/, "the to-do tone isn't the neutral one");
});

test("Decision 274: before a Power Level the rail is one line", () => {
  const app = newCharacterApp();
  assert.equal(app.$$("#vitals .vfull .vrow").length, 0, "stat rows before a Power Level");
  assert.ok(app.$("#vitals .vfull").textContent.includes(D.appCopy.railEmpty));
  app.click("[data-pl]");
  assert.ok(app.$$("#vitals .vfull .vrow").length > 0, "choosing a Power Level didn't bring the rows back");
  assert.ok(!app.$("#vitals .vfull").textContent.includes(D.appCopy.railEmpty));
});

test("Decision 275: no card or chip says 'in progress'; an unwritten archetype still says so", () => {
  const draftLabel = D.appCopy.statusLabel.draft;
  assert.ok(D.archetypes.some(a => a.status === "draft"), "no draft archetype to test");
  const app = onArchetypeStep("");
  for (const a of D.archetypes.filter(a => !a.retired)) {
    const t = app.$(`[data-arch="${a.id}"]`).textContent;
    assert.ok(!t.includes(draftLabel), `${a.id}'s card says "${draftLabel}"`);
    if (a.status === "written-in") assert.ok(t.includes(D.appCopy.statusLabel[a.status]), `${a.id} lost its badge`);
  }
  // The sheet's chip, on a locked character whose archetype is a draft; and an unwritten one keeps its own.
  const dr = D.archetypes.find(a => a.status === "draft" && !a.retired);
  const ch = lockedCharacter(); ch.identity.archetype = dr.id;
  assert.ok(!openSheet(ch, "character").$("#main").textContent.includes(draftLabel), "the Character tab says in progress");
  const tbd = D.archetypes.find(a => a.status === "tbd");
  const ch2 = lockedCharacter(); ch2.identity.archetype = tbd.id;
  assert.ok(openSheet(ch2, "character").$("#main").textContent.includes(D.appCopy.statusLabel.tbd), "the unwritten chip went");
});

test("Decision 276: the Stats step shows each option's demands, and they follow the stats", () => {
  const withReq = D.archetypes.flatMap(a => ((a.specialization || {}).options || []).filter(o => o.requires && o.requires.stats));
  assert.ok(withReq.length);
  const app = onStep("", D.powerLevels[0].id, "stats", ch => { for (const id of Object.keys(ch.stats)) ch.stats[id].base = D.statRules.base; });
  const panel = () => app.$("[data-demands]");
  assert.ok(panel(), "no demands panel");
  assert.equal(panel().open, false, "with no archetype chosen the panel starts closed");
  assert.equal(panel().querySelectorAll("li").length, withReq.length);
  const o = statOpt(), [sid, need] = Object.entries(o.requires.stats)[0];
  const line = () => [...panel().querySelectorAll("li")].find(l => l.textContent.includes(o.name));
  const mark = new RegExp(`${sid} ${need} ✓`);
  assert.doesNotMatch(line().textContent, mark);
  const has = () => Engine.statValue(stored(app, { locked: false }), sid);
  for (let g = 0; has() < need && g < 20; g++) app.click(`[data-step="stat|${sid}|1"]`);
  assert.ok(has() >= need, "couldn't raise the stat");
  assert.match(line().textContent, mark, "the demand didn't mark met");
  // The panel keeps its open state through the redraw a press causes.
  panel().open = true; panel().dispatchEvent(new app.window.Event("toggle"));
  app.click(`[data-step="stat|${sid}|-1"]`);
  assert.equal(panel().open, true, "a redraw closed the panel");
  assert.deepEqual(app.errors, []);
});

test("Decision 276: an unmet option says what's short, and a complete choice folds the rest", () => {
  const a = specArch(), opts = a.specialization.options, o = statOpt();
  const app = onStep(a.id, D.powerLevels[0].id, "archetype", ch => { for (const id of Object.keys(ch.stats)) ch.stats[id].base = D.statRules.base; });
  const card = id => app.$$("#main .pick").find(p => p.querySelector(`[data-spec="${id}"]`));
  assert.match(card(o.id).textContent, /\(you have \d+\)/, "the card doesn't say what's short");
  assert.equal(app.$$("#main .pick.folded").length, 0);
  app.click(`[data-spec="${o.id}"]`);
  assert.equal(app.$$("#main .pick.folded").length, opts.length - 1, "the rest didn't fold");
  assert.equal(app.$$("#main .pick.folded .desc").length, 0);
  const all = app.$("[data-spec-all]");
  assert.ok(all.textContent.includes(String(opts.length)) && all.textContent.includes(a.specialization.label));
  const before = JSON.stringify(stored(app, { locked: false }).archetypeChoices);
  app.click("[data-spec-all]");
  assert.equal(app.$$("#main .pick.folded").length, 0, "Show all didn't open them");
  assert.equal(app.$("[data-spec-all]").textContent, D.appCopy.showFewerOptions);
  assert.equal(JSON.stringify(stored(app, { locked: false }).archetypeChoices), before, "the fold touched the character");
  app.click("[data-spec-all]");
  assert.equal(app.$$("#main .pick.folded").length, opts.length - 1);
  const other = opts.find(x => x.id !== o.id);
  app.click(`[data-spec="${other.id}"]`);
  assert.ok(card(other.id) && !card(other.id).classList.contains("folded"), "choosing from a folded row didn't work");
  // Show all was for this archetype's options: another archetype's complete choice folds its own.
  app.click("[data-spec-all]");
  const next = D.archetypes.find(x => x.id !== a.id && !x.retired && x.specialization && (x.specialization.options || []).length > 1);
  app.click(`[data-arch="${next.id}"]`);
  const need = Engine.specializationNeed(stored(app, { locked: false }));
  for (const x of next.specialization.options.slice(0, need)) app.click(`[data-spec="${x.id}"]`);
  assert.equal(app.$$("#main .pick.folded").length, next.specialization.options.length - need, "Show all carried over to another archetype");
  assert.deepEqual(app.errors, []);
});

test("Decision 274: the Character Points note shows once, and doesn't say Freebie", () => {
  const app = onStep("professional", D.powerLevels[0].id, "character-points");
  const note = D.creationFlow.steps.find(s => s.id === "character-points").note;
  const text = app.$("#main").textContent;
  assert.equal(text.split(note).length - 1, 1, "the note isn't drawn exactly once");
  assert.doesNotMatch(text, /Freebie/i);
});

test("Decision 277: a retired archetype isn't offered, and a character on it keeps it", () => {
  const retired = D.archetypes.filter(a => a.retired);
  assert.ok(retired.length, "nothing is retired");
  const app = onArchetypeStep("professional");
  for (const a of retired) assert.equal(app.$(`[data-arch="${a.id}"]`), null, `${a.id} has a card`);
  const ch = lockedCharacter(); ch.identity.archetype = retired[0].id;
  const sheet = openSheet(ch, "character");
  assert.deepEqual(sheet.errors, []);
  assert.ok(sheet.$("#main").textContent.includes(retired[0].name), "the sheet lost the archetype");
  sheet.click("[data-menu-toggle]"); sheet.click("[data-admin]");
  const opts = [...sheet.$("[data-admin-arch]").options].map(o => o.value);
  assert.ok(opts.includes(retired[0].id), "Admin dropped the character's own archetype");
  const s2 = openSheet(lockedCharacter(), "character"); s2.click("[data-menu-toggle]"); s2.click("[data-admin]");
  assert.ok(![...s2.$("[data-admin-arch]").options].some(o => retired.some(r => r.id === o.value)), "Admin offers a retired archetype");
});

// ── E1c: Character Points' lists, and the Natural Advantage panel, fold to what's taken ──

const cpBlank = (expert = false) => onStep("professional", D.powerLevels[0].id, "character-points", () => {}, expert ? { "shadows.ui.expert": "on" } : {});

const cpList = (app, key) => app.$(`[data-cp-list="${key}"]`);

const cpVisible = (app, key) => [...cpList(app, key).querySelectorAll(".pick")].filter(p => !p.hidden);

const cpAllBtn = (app, key) => cpList(app, key).querySelector(`[data-cp-all="${key}"]`);

test("Decision 279: Character Points opens with both lists folded, and Show all opens one", () => {
  const app = cpBlank();
  assert.equal(cpVisible(app, "disadvantages").length, 0, "a Disadvantage shows on a new character");
  assert.equal(cpVisible(app, "advantages").length, 0, "an Advantage shows on a new character");
  assert.ok(cpAllBtn(app, "disadvantages").textContent.includes(`Show all ${D.disadvantages.length} Disadvantages`), cpAllBtn(app, "disadvantages").textContent);
  assert.ok(cpAllBtn(app, "advantages").textContent.includes(`Show all ${D.advantages.length} Advantages`), cpAllBtn(app, "advantages").textContent);
  app.click('[data-cp-all="disadvantages"]');
  assert.equal(cpVisible(app, "disadvantages").length, D.disadvantages.length, "Show all didn't open the Disadvantages");
  assert.equal(cpVisible(app, "advantages").length, 0, "the Advantages opened too");
  assert.equal(cpAllBtn(app, "disadvantages").textContent, D.appCopy.showFewerOptions);
  assert.deepEqual(app.errors, []);
});

test("Decision 279: a held pick shows in a folded list, and taking it to 0 folds it away", () => {
  const app = cpBlank();
  const id = D.disadvantages[0].id;
  app.click('[data-cp-all="disadvantages"]');
  app.click(`[data-step="disadv|${id}|1"]`);
  assert.equal(cpVisible(app, "disadvantages").length, D.disadvantages.length, "buying folded the list");
  app.click('[data-cp-all="disadvantages"]');
  const shown = cpVisible(app, "disadvantages");
  assert.equal(shown.length, 1, "Show fewer left the wrong picks");
  assert.ok(shown[0].querySelector(`[data-step="disadv|${id}|1"]`));
  app.$(`[data-step="disadv|${id}|-1"]`).focus();
  app.click(`[data-step="disadv|${id}|-1"]`);
  assert.equal(cpVisible(app, "disadvantages").length, 0, "a pick taken to 0 stayed");
  assert.equal(app.window.document.activeElement, cpAllBtn(app, "disadvantages"), "focus didn't land on the fold row's button");
  assert.deepEqual(app.errors, []);
});

test("Decision 279: the filter reaches into folded lists, and clearing it folds them again", () => {
  const app = cpBlank();
  const adv = D.advantages[0], box = app.$("[data-jumpfilter]");
  const type = v => { box.value = v; box.dispatchEvent(new app.window.Event("input")); };
  type(adv.name);
  const hit = cpVisible(app, "advantages").find(p => p.querySelector(`[data-step="adv|${adv.id}|1"]`));
  assert.ok(hit, "the filter didn't reach a folded Advantage");
  type("");
  assert.equal(cpVisible(app, "advantages").length, 0, "clearing the filter didn't fold the list");
  assert.equal(cpVisible(app, "disadvantages").length, 0);
  app.click(`[data-step="disadv|${D.disadvantages[0].id}|1"]`);
  app.click("[data-heldonly]");
  assert.equal(cpVisible(app, "disadvantages").length, 1, "Held only shows more than what's held");
  assert.equal(cpVisible(app, "advantages").length, 0);
  assert.deepEqual(app.errors, []);
});

test("Decision 279: the fold resets with the step", () => {
  const app = cpBlank();
  app.click('[data-cp-all="advantages"]');
  assert.equal(cpVisible(app, "advantages").length, D.advantages.length);
  app.click("[data-nav='-1']"); app.click("[data-nav='1']");
  assert.equal(cpVisible(app, "advantages").length, 0, "Show all survived leaving the step");
  app.click('[data-cp-all="disadvantages"]');
  app.click("[data-nav='-1']"); app.click("[data-nav='1']");
  assert.equal(cpVisible(app, "disadvantages").length, 0);
  assert.deepEqual(app.errors, []);
});

test("Decision 279: with Expert mode on, the lists fold the same way", () => {
  const app = cpBlank(true);
  assert.equal(cpVisible(app, "disadvantages").length + cpVisible(app, "advantages").length, 0);
  app.click('[data-cp-all="advantages"]');
  assert.equal(cpVisible(app, "advantages").length, D.advantages.length);
  assert.deepEqual(app.errors, []);
});

test("Decision 279: Show all and the filter leave the character as it was", () => {
  const app = cpBlank();
  const before = JSON.stringify(stored(app, { locked: false }));
  app.click('[data-cp-all="advantages"]'); app.click('[data-cp-all="advantages"]'); app.click('[data-cp-all="disadvantages"]');
  const box = app.$("[data-jumpfilter]"); box.value = "a"; box.dispatchEvent(new app.window.Event("input"));
  assert.equal(JSON.stringify(stored(app, { locked: false })), before);
});

const natCards = app => app.$$("#main .pick").filter(p => p.querySelector('[data-step^="natadv|"]'));

function enforcerPool() {
  const app = onArchetypeStep("professional");
  app.click('[data-spec="enforcer"]');
  const ch = stored(app, { locked: false });
  return { app, need: Engine.scalingRow(ch).naturalAdvantageRanks, pool: Engine.naturalAdvantagePool(Engine.archetype(ch)).pool };
}

test("Decision 280: Natural Advantages fold once every rank is allocated", () => {
  const { app, need, pool } = enforcerPool();
  assert.equal(natCards(app).length, pool.length);
  assert.ok(natCards(app).every(p => p.querySelector(".desc")), "a card is folded before the ranks are allocated");
  const first = pool[0].advantageId;
  for (let i = 0; i < need; i++) app.click(`[data-step="natadv|${first}|1"]`);
  assert.equal(stored(app, { locked: false }).archetypeChoices.naturalAdvantages.reduce((s, n) => s + n.rank, 0), need);
  assert.equal(natCards(app).filter(p => !p.querySelector(".desc")).length, pool.length - 1, "the unallocated entries didn't fold");
  assert.ok(natCards(app).find(p => p.querySelector(".desc")).querySelector(`[data-step="natadv|${first}|-1"]`), "the allocated one folded");
  assert.ok(app.$("[data-nat-all]").textContent.includes(`Show all ${pool.length} Natural Advantages`), app.$("[data-nat-all]").textContent);
  app.click("[data-nat-all]");
  assert.ok(natCards(app).every(p => p.querySelector(".desc")), "Show all didn't open them");
  app.click("[data-nat-all]");
  assert.equal(natCards(app).filter(p => !p.querySelector(".desc")).length, pool.length - 1);
  app.click(`[data-step="natadv|${first}|-1"]`);
  assert.ok(natCards(app).every(p => p.querySelector(".desc")), "the fold stayed after a rank came back");
  assert.deepEqual(app.errors, []);
});

test("Decision 280: Show all on Natural Advantages resets when the subtype changes", () => {
  const { app, need, pool } = enforcerPool();
  const first = pool[0].advantageId;
  for (let i = 0; i < need; i++) app.click(`[data-step="natadv|${first}|1"]`);
  app.click("[data-nat-all]");
  const other = Engine.archetype(stored(app, { locked: false })).specialization.options.find(o => o.id !== "enforcer");
  app.click(`[data-spec="${other.id}"]`); app.click('[data-spec="enforcer"]');
  for (let i = 0; i < need; i++) app.click(`[data-step="natadv|${first}|1"]`);
  assert.ok(natCards(app).some(p => !p.querySelector(".desc")), "Show all survived a subtype change");
});

// ── J2: a pool the player names (Decision 313, W49) ──────────────────

const tickPools = (app, on = true) => {
  const box = app.$('[data-wimech="pools"]');
  box.checked = on; box.dispatchEvent(new app.window.Event("change", { bubbles: true }));
};

test("J2: ticking Uses another pool gives a pool to name, and Add a pool stops at four", () => {
  const custom = D.archetypes.find(a => a.writeIn);
  const app = onArchetypeStep(custom.id);
  assert.equal(app.$('[data-wipool]'), null, "a pool row shows before the mechanic is ticked");
  tickPools(app);
  assert.equal(app.$$("[data-wipool]").length, 1, "ticking gave no pool to name");
  assert.equal(app.doc.activeElement, app.$('[data-wipool]'), "the new pool's name didn't take focus");
  for (let i = 0; i < 3; i++) app.click("[data-wipooladd]");
  assert.equal(app.$$("[data-wipool]").length, 4);
  assert.equal(app.$("[data-wipooladd]"), null, "Add a pool is still offered at four");
  const pools = stored(app, { locked: false }).archetypeChoices.writeIn.pools;
  assert.equal(pools.length, 4);
  assert.ok(pools.every(p => /^pool-[a-z0-9]{8}$/.test(p.id)), "a pool's id isn't pool- and eight lowercase characters");
  assert.equal(new Set(pools.map(p => p.id)).size, 4, "two pools share an id");
  assert.deepEqual(app.errors, []);
});

test("J2: unticking hides the pools and keeps them", () => {
  const custom = D.archetypes.find(a => a.writeIn);
  const app = onArchetypeStep(custom.id);
  tickPools(app);
  type(app, '[data-wipool]', "Glamour");
  app.click("[data-wipooladd]");
  const second = app.$$("[data-wipool]")[1];
  second.value = "Chi"; second.dispatchEvent(new app.window.Event("input", { bubbles: true }));
  tickPools(app, false);
  assert.equal(app.$$("[data-wipool]").length, 0, "the pools still show with the mechanic unticked");
  assert.equal(JSON.stringify(stored(app, { locked: false }).archetypeChoices.writeIn.pools.map(p => p.name)), JSON.stringify(["Glamour", "Chi"]));
  tickPools(app);
  assert.equal(JSON.stringify(app.$$("[data-wipool]").map(i => i.value)), JSON.stringify(["Glamour", "Chi"]), "ticking again didn't bring them back");
});

test("J2: a named pool is a suggestion in a power's Uses", () => {
  const custom = D.archetypes.find(a => a.writeIn);
  const app = onArchetypeStep(custom.id);
  tickPools(app);
  type(app, '[data-wipool]', "Glamour");
  app.click("[data-wipooladd]");   // a redraw, so the Uses list picks up the name
  const uses = () => app.$$("#power-uses option").map(o => o.value);
  assert.ok(uses().includes("Glamour"), "the Uses list has no suggestion for a named pool");
  assert.ok(uses().includes("SFR"), "the Uses list lost the data's suggestions");
  tickPools(app, false);
  app.click("[data-pwadd]");
  assert.ok(!uses().includes("Glamour"), "an unticked pool is still a suggestion");
});

test("J2: changing archetype clears the pools", () => {
  const custom = D.archetypes.find(a => a.writeIn);
  const app = onArchetypeStep(custom.id);
  tickPools(app);
  type(app, '[data-wipool]', "Glamour");
  app.click('[data-arch="werewolf"]');
  app.click(`[data-arch="${custom.id}"]`);
  assert.deepEqual(stored(app, { locked: false }).archetypeChoices.writeIn.pools, []);
  assert.equal(app.$$("[data-wipool]").length, 0);
});

test("J2: changing archetype clears the pools and their counts together", () => {
  const custom = D.archetypes.find(a => a.writeIn);
  const app = onStep(custom.id, D.powerLevels[0].id, "archetype", ch => {
    ch.archetypeChoices.writeIn.mechanics = ["pools"];
    ch.archetypeChoices.writeIn.pools = [{ id: "pool-aaaaaaaa", name: "Glamour" }];
    ch.trackers.panel = { "pool-aaaaaaaa": { value: 2, max: 6 } };
  });
  app.click('[data-arch="werewolf"]');
  app.click(`[data-arch="${custom.id}"]`);
  const ch = stored(app, { locked: false });
  assert.deepEqual(ch.archetypeChoices.writeIn.pools, []);
  assert.equal(ch.trackers.panel["pool-aaaaaaaa"], undefined, "a cleared pool kept its count");
  assert.deepEqual(app.errors, []);
});

// ── J3: a stepper takes a typed number (W121, W152) ─────────────────
// A typed value is a field (data-val="<key>"). Enter or a change (leaving the field) commits it through the same
// press the buttons make; Escape reverts; the arrows step by one. Each press re-renders, so a press's gate is read fresh.

const setField = (app, key, text) => { const f = typed(app, key); f.value = text; return f; };

const keyIn = (app, f, key) => f.dispatchEvent(new app.window.KeyboardEvent("keydown", { key, bubbles: true }));

const changeIn = (app, f) => f.dispatchEvent(new app.window.Event("change", { bubbles: true }));

const statBase = (app, id) => stored(app, { locked: false }).stats[id].base;

test("J3: a typed value commits on Enter or blur, through the same press the buttons make", async () => {
  const app = statsDraft();
  const from = D.statRules.base;
  const f = setField(app, "stat|BOD", String(from + 2));
  keyIn(app, f, "Enter");
  await later(app);
  assert.equal(statBase(app, "BOD"), from + 2, "Enter didn't commit the typed value");
  const g = setField(app, "stat|BOD", String(from + 4));
  changeIn(app, g);                       // leaving the field
  await later(app);
  assert.equal(statBase(app, "BOD"), from + 4, "leaving the field didn't commit the typed value");
  assert.deepEqual(app.errors, []);
});

test("J3: a typed value is held to the caps and pools the buttons are", async () => {
  // The Stat pool is the gate here: a Stat's + is greyed by the pool's room (next <= left), and applyStep alone
  // caps only at the stat's maximum, so a typed value that skipped the button's state would overspend the pool.
  const key = "stat|BOD";
  // Spend the pool on the other stats first, so the pool, not the stat's cap, is what stops BOD.
  const spendOthers = app => {
    for (let round = 0; round < 40; round++) for (const s of D.stats.filter(x => x.id !== "BOD")) {
      const b = app.$(`#main [data-step="stat|${s.id}|1"]`);
      if (b && !b.disabled) app.click(`#main [data-step="stat|${s.id}|1"]`);
    }
  };
  const probe = statsDraft();
  spendOthers(probe);
  for (let i = 0; i < 200; i++) {
    const b = probe.$(`#main [data-step="${key}|1"]`);
    if (!b || b.disabled) break;
    probe.click(`#main [data-step="${key}|1"]`);
  }
  const reached = statBase(probe, "BOD");
  const app = statsDraft();
  spendOthers(app);
  const f = setField(app, key, "99");
  keyIn(app, f, "Enter");
  await later(app);
  assert.equal(statBase(app, "BOD"), reached, "a typed 99 went past where the + button stops");
  const ch = stored(app, { locked: false });
  assert.ok(Engine.statSpent(ch) <= Engine.statPool(ch).total, "the typed value overspent the Stat pool");
  assert.deepEqual(app.errors, []);
});

test("J3: a typed value below the floor stops at the floor", async () => {
  const floor = D.statRules.base;
  const app = statsDraft({ BOD: floor + 1 });
  const f = setField(app, "stat|BOD", "0");
  keyIn(app, f, "Enter");
  await later(app);
  assert.equal(statBase(app, "BOD"), floor, "a typed 0 went below the floor");
  assert.equal(typed(app, "stat|BOD").value, String(floor), "the field doesn't show the floor");
});

test("J3: text that isn't a whole number leaves the value as it was", async () => {
  const app = statsDraft({ BOD: D.statRules.base + 1 });
  const before = statBase(app, "BOD");
  for (const text of ["x", "1.5", "", "-"]) {
    const f = setField(app, "stat|BOD", text);
    keyIn(app, f, "Enter");
    await later(app);
    assert.equal(statBase(app, "BOD"), before, `"${text}" changed the value`);
  }
  const f = setField(app, "stat|BOD", "9");
  keyIn(app, f, "Escape");
  await later(app);
  assert.equal(statBase(app, "BOD"), before, "Escape committed");
  assert.equal(typed(app, "stat|BOD").value, String(before), "Escape didn't put the value back");
});

test("J3: the arrow keys step the field by one and keep its place", async () => {
  const app = statsDraft({ BOD: D.statRules.base + 1 });
  const before = statBase(app, "BOD");
  typed(app, "stat|BOD").focus();                       // the player is in the field
  keyIn(app, typed(app, "stat|BOD"), "ArrowUp");
  await later(app);
  assert.equal(statBase(app, "BOD"), before + 1, "ArrowUp didn't step by one");
  assert.equal(app.doc.activeElement, typed(app, "stat|BOD"), "focus left the field");
  keyIn(app, typed(app, "stat|BOD"), "ArrowDown");
  await later(app);
  assert.equal(statBase(app, "BOD"), before, "ArrowDown didn't step back");
});

test("J3: a typed value is announced once, not twice", async () => {
  const app = statsDraft();
  const calls = [];
  const real = app.window.announce;
  app.window.announce = (text) => { calls.push(text); return real(text); };
  const f = setField(app, "stat|BOD", String(D.statRules.base + 3));
  keyIn(app, f, "Enter");
  await later(app);
  assert.equal(calls.length, 1, `announced ${calls.length} times: ${JSON.stringify(calls)}`);
  assert.equal(app.$("#announcer").textContent, `${sName("BOD")} ${D.statRules.base + 3}`);
  assert.notEqual(typed(app, "stat|BOD").getAttribute("type"), "number", "the field is a native spinbutton, which announces itself too");
});

test("J3: every one of the 17 steppers takes a typed value", async () => {
  // Every stepper on every creation step is a field keyed as its buttons are, and where its + button is open, a typed
  // value one above the current moves it by one, as the + button does.
  const kinds = new Set();
  let fields = 0, typedUp = 0;
  for (const step of D.creationFlow.steps.map(s => s.id)) {
    const app = onStep("professional", "street", step, () => {});
    const found = app.$$("#main .stepper .val");
    for (const v of found) {
      const key = v.dataset.val;
      assert.ok(v.tagName === "INPUT" && key, `${step}: a stepper's value is not a field`);
      assert.ok(app.$(`#main [data-step="${key}|-1"]`) && app.$(`#main [data-step="${key}|1"]`), `${key} has no pair of buttons`);
      kinds.add(key.split("|")[0]);
      fields++;
    }
    // Each commit redraws, so each field is read again from the page, never from the list above.
    for (const key of found.map(v => v.dataset.val)) {
      const plus = app.$(`#main [data-step="${key}|1"]`);
      if (!plus || plus.disabled) continue;
      const cur = Number(typed(app, key).defaultValue), f = typed(app, key);
      f.value = String(cur + 1);
      keyIn(app, f, "Enter");
      await later(app);
      assert.equal(Number(typed(app, key)?.defaultValue), cur + 1, `${step} ${key}: a typed ${cur + 1} didn't move it as + does`);
      typedUp++;
    }
  }
  assert.ok(fields >= 17, `only ${fields} stepper fields across the steps (17 call sites)`);
  assert.ok(typedUp >= 5, `only ${typedUp} steppers took a typed press`);
  assert.ok(kinds.size >= 6, `only ${kinds.size} stepper kinds found`);
});

test("W152: an overspent pool reads with a true minus in the wizard", () => {
  const app = onStep("professional", "street", "skills", ch => { ch.skills[D.skills[0].id] = { rank: 40, ipe: 0 }; });
  const text = [...app.$$(".vstrip .vv")].map(v => v.textContent).join(" | ");
  assert.doesNotMatch(text, /(^|[^−\d])-\d/, `an overspent pool reads with a hyphen-minus: ${text}`);
  assert.match(text, /−\d+/, `an overspent pool doesn't read −: ${text}`);
});

// J3: a typed value reaches where the + button reaches, one press at a time, and no further.
const pressToEnd = (setup, key) => {
  const app = setup();
  for (let i = 0; i < 200; i++) {
    const b = app.$(`#main [data-step="${key}|1"]`);
    if (!b || b.disabled) break;
    app.click(`#main [data-step="${key}|1"]`);
  }
  return app.$(`#main [data-val="${key}"]`)?.defaultValue;
};

test("J3: a typed value stops where an Advantage's + greys out (its affordability gate)", async () => {
  const setup = () => onStep("professional", "street", "character-points", () => {});
  const probe = setup();
  const key = [...probe.$$("#main .stepper .val")].map(v => v.dataset.val)
    .find(k => k.startsWith("adv|") && probe.$(`#main [data-step="${k}|1"]`) && !probe.$(`#main [data-step="${k}|1"]`).disabled);
  assert.ok(key, "no Advantage with an open + on the Character Points step");
  const reached = pressToEnd(setup, key);
  const app = setup();
  const f = app.$(`#main [data-val="${key}"]`);
  f.value = "99";
  keyIn(app, f, "Enter");
  await later(app);
  assert.equal(app.$(`#main [data-val="${key}"]`).defaultValue, reached, "a typed 99 went past where the + button stops");
  assert.deepEqual(app.errors, []);
});

test("J3: a typed value then a press on + takes the typed value first, then the press", async () => {
  const app = statsDraft();
  const from = D.statRules.base;
  const f = setField(app, "stat|BOD", String(from + 3));
  const plus = app.$('#main [data-step="stat|BOD|1"]');
  const down = new app.window.MouseEvent("mousedown", { bubbles: true, cancelable: true });
  plus.dispatchEvent(down);
  assert.ok(down.defaultPrevented, "the mousedown let focus leave the field, so the redraw would land before the click");
  plus.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  await later(app);
  assert.equal(statBase(app, "BOD"), from + 4, "the typed value and the press didn't both land");
  assert.deepEqual(app.errors, []);
});

test("J3: a typed value stops at a cap on the press that follows it, and the press is then refused", async () => {
  const app = statsDraft();
  const f = setField(app, "stat|BOD", "99");
  const plus = app.$('#main [data-step="stat|BOD|1"]');
  plus.dispatchEvent(new app.window.MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  plus.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  await later(app);
  const ch = stored(app, { locked: false });
  assert.ok(Engine.statSpent(ch) <= Engine.statPool(ch).total, "the typed value and the press overspent the Stat pool");
  assert.deepEqual(app.errors, []);
});

test("J3: a typed value in one stepper survives a press on another stepper's +", async () => {
  const app = statsDraft();
  const from = D.statRules.base;
  const f = setField(app, "stat|REF", String(from + 3));
  const plus = app.$('#main [data-step="stat|BOD|1"]');
  const down = new app.window.MouseEvent("mousedown", { bubbles: true, cancelable: true });
  plus.dispatchEvent(down);
  assert.ok(down.defaultPrevented, "the press let focus leave the other stepper's field");
  plus.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  await later(app);
  assert.equal(statBase(app, "REF"), from + 3, "the typed value in REF was lost to a press on BOD");
  assert.equal(statBase(app, "BOD"), from + 1, "the press on BOD didn't land");
  assert.deepEqual(app.errors, []);
});
