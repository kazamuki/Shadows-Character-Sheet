/**
 * K1: Help on the sheet. A ? in the header and the ? key open a panel for the tab that's open, from the data's `sheetGuide`;
 * every tab carries a guide line, and a Guide lines switch takes them away. From 1280px Help is a column that takes pinned
 * vitals' place while it's open; narrower it is a flyout.
 *
 * jsdom has no layout, so what these pin is state, focus, text and classes. The widths are the harness's `matchMedia`
 * (boot's `width`): the CSS that does the swapping is phone-check's (Chromium).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { boot } from "./harness.mjs";
import { Engine, D, lockedCharacter, lockedVampire, writtenInCharacter, openSheet } from "./smokekit.mjs";

const SG = () => D.sheetGuide;
const PIN = "shadows.ui.vitalsPinned", SGUIDE = "shadows.ui.sheetGuide", GMGUIDE = "shadows.ui.gmGuide", GMHELP = "shadows.ui.gmHelp", KEYS = "shadows.ui.keys";
const SECTIONS = ["main", "skills", "character", "trackers", "progression", "loadout", "notes"];
const panel = app => app.$("#ghelp");
const shown = app => !!panel(app) && !panel(app).hasAttribute("inert") && panel(app).getAttribute("aria-hidden") === "false";
const heading = app => panel(app).querySelector("h2").textContent;
const ls = (app, k) => app.window.localStorage.getItem(k);
const press = (app, key, init = {}, target) => {
  const t = target || app.doc.body;
  if (t !== app.doc.body) t.focus(); else { const a = app.doc.activeElement; if (a && a !== app.doc.body) a.blur(); }
  const ev = new app.window.KeyboardEvent("keydown", Object.assign({ key, bubbles: true, cancelable: true }, init));
  return { prevented: !t.dispatchEvent(ev) };
};
const questionMark = (app, target, init = {}) => press(app, "?", { shiftKey: true, code: "Slash", ...init }, target);
const pressEsc = app => (app.doc.activeElement || app.doc).dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
const term = (app, id) => app.window.eval(`Engine.word(${JSON.stringify(id)}, S.ch)`);
const sheet = (section, opts = {}) => openSheet(lockedCharacter(), section, opts);

test("K1: ? opens Help for the open tab, and closing it gives focus back", () => {
  const app = sheet("trackers");
  const btn = app.$("[data-shelp]");
  assert.ok(btn, "no Help button in the header");
  assert.equal(btn.getAttribute("aria-label"), "Help");
  assert.equal(btn.getAttribute("aria-controls"), "ghelp");
  assert.equal(btn.getAttribute("aria-expanded"), "false");
  const order = app.$$("#hdractions > button").map(b => b.hasAttribute("data-shelp") ? "help" : "menu");
  assert.deepEqual(order, ["help", "menu"], "Help sits between the tabs and ⋮");
  assert.equal(shown(app), false);
  btn.focus();
  app.click("[data-shelp]");
  assert.equal(shown(app), true);
  const c = SG().contexts.trackers;
  assert.equal(heading(app), c.title);
  assert.equal(app.$("[data-shelp]").getAttribute("aria-expanded"), "true");
  assert.equal(app.doc.activeElement, panel(app).querySelector("[data-help-close]"), "focus didn't go to Close");
  assert.deepEqual([...app.$$("#ghelp .help-when li")].map(li => li.textContent), [...c.when].map(w => SG().ui.when[w]));
  // A word the character can't have (SFR on an Arcanist) is left out of the tab's list; every other is in it.
  for (const id of c.words) { const w = term(app, id); assert.equal(panel(app).textContent.includes(w.title), !w.absent, `${JSON.stringify(id)}'s title ${w.absent ? "is" : "isn't"} in the panel`); }
  pressEsc(app);
  assert.equal(shown(app), false, "Esc left it open");
  assert.ok(panel(app).hasAttribute("inert"));
  assert.equal(app.doc.activeElement, app.$("[data-shelp]"), "focus didn't return to the ? button");
  assert.deepEqual(app.errors, []);
});

test("K1: every tab has help, and every word it names resolves", () => {
  const G = SG();
  assert.deepEqual(Object.keys(G.contexts).sort(), [...SECTIONS, "admin"].sort(), "a tab has no context, or a context has no tab");
  const app = sheet("main");
  for (const sec of SECTIONS) {
    app.click(`[data-sec="${sec}"]`);
    if (!shown(app)) app.click("[data-shelp]");
    assert.equal(heading(app), G.contexts[sec].title, `${sec}'s Help heading`);
  }
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  if (!shown(app)) app.click("[data-shelp]");
  assert.equal(heading(app), G.contexts.admin.title, "Admin's Help heading");
  for (const arch of ["professional", "arcanist", "vampire", "werewolf"]) {
    const ch = lockedCharacter(); ch.identity.archetype = arch;
    for (const [sec, c] of Object.entries(G.contexts)) for (const id of c.words) assert.ok(Engine.word(id, Engine.migrate(JSON.parse(JSON.stringify(ch)))), `${JSON.stringify(id)} (${sec}) doesn't resolve for a ${arch}`);
  }
  assert.deepEqual(app.errors, []);
});

test("K1: from 1280 Help is a column, and with vitals pinned it takes their place while open", () => {
  const app = sheet("trackers", { width: 1280, storage: { [PIN]: "pinned", [GMHELP]: "open" } });
  const drawer = () => app.$("#vdrawer");
  assert.equal(shown(app), false, "the table's preference opened the sheet's Help");
  assert.ok(app.doc.body.classList.contains("vitals-pinned"));
  assert.ok(!drawer().hasAttribute("inert"));
  app.click("[data-shelp]");
  assert.equal(shown(app), true);
  assert.ok(app.$("#app").classList.contains("help-pinned"), "no column");
  assert.ok(drawer().hasAttribute("inert") && drawer().getAttribute("aria-hidden") === "true", "the vitals drawer is still reachable under Help");
  assert.ok(app.$("#main .vbar .vpill"), "the vitals bar isn't in the page");
  assert.equal(ls(app, PIN), "pinned", "Help wrote the pin");
  app.click('[data-sec="skills"]');
  assert.equal(shown(app), true, "a tab press closed the column");
  assert.equal(heading(app), SG().contexts.skills.title, "the column didn't follow the tab");
  assert.equal(ls(app, PIN), "pinned");
  app.click("#ghelp [data-help-close]");
  assert.equal(shown(app), false);
  assert.ok(!app.$("#app").classList.contains("help-pinned"));
  assert.ok(!drawer().hasAttribute("inert") && drawer().getAttribute("aria-hidden") === "false", "the pinned column didn't come back");
  assert.equal(ls(app, PIN), "pinned", "closing Help moved the pin");
  assert.equal(ls(app, GMHELP), "open", "the sheet wrote the table's Help preference");
  // A new visit starts closed.
  app.click("[data-shelp]");
  app.click("[data-menu-toggle]"); app.click("[data-home]");
  const open = app.$$("#main button").find(b => /Open sheet/.test(b.textContent));
  open.dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  assert.equal(shown(app), false, "Help stayed open across visits");
  // Narrower, the same ? is a flyout with a scrim, and a tab press closes it.
  app.resize(1024);
  app.click("[data-shelp]");
  assert.equal(shown(app), true);
  assert.ok(app.$("#ghscrim").classList.contains("open"), "no scrim on a flyout");
  app.click('[data-sec="notes"]');
  assert.equal(shown(app), false, "a tab press left the flyout open");
  assert.deepEqual(app.errors, []);
});

test("K1: the ? key opens the sheet's Help, under the table's rules", () => {
  const app = sheet("main");
  assert.equal(questionMark(app).prevented, true);
  assert.equal(shown(app), true, "? didn't open Help");
  assert.equal(questionMark(app).prevented, true);
  assert.equal(shown(app), false, "? didn't close it");
  const nothing = (why, r) => { assert.equal(shown(app), false, why); assert.equal(r.prevented, false, why + ": the key was taken"); };
  app.click('[data-sec="notes"]');
  const field = app.$("#main textarea");
  assert.ok(field, "no field on Notes");
  nothing("in a field", questionMark(app, field));
  nothing("on a repeat", questionMark(app, null, { repeat: true }));
  nothing("with Ctrl", questionMark(app, null, { ctrlKey: true }));
  app.click("[data-menu-toggle]");
  nothing("with ⋮ open", questionMark(app));
  app.click("[data-menu-toggle]");
  app.click("[data-whatsnew]");
  assert.ok(app.$("dialog.modal[open]"), "no modal opened");
  nothing("with a modal open", questionMark(app));
  app.doc.querySelector("dialog.modal[open]").setAttribute("open", "");
  app.doc.querySelector("dialog.modal[open]").toggleAttribute("open", false);
  app.window.localStorage.setItem(KEYS, "off");
  nothing("with keys off", questionMark(app));
  app.window.localStorage.removeItem(KEYS);
  const w = boot();
  assert.equal(questionMark(w).prevented, false, "? did something on the home screen");
  assert.deepEqual(app.errors, []);
});

test("K1: Guide lines Off hides every guide line and keeps the rule lines, for this browser", () => {
  const app = sheet("main");
  const guides = () => app.$$("#main [data-guide]");
  const tabs = [...SECTIONS];
  for (const sec of tabs) {
    app.click(`[data-sec="${sec}"]`);
    assert.equal(guides().length, 1, `${sec} has no guide line`);
    assert.equal(guides()[0].textContent, SG().contexts[sec].intro.replace(/\*\*/g, ""), `${sec}'s guide line`);
  }
  const rule = { skills: "introSkills", progression: "introProgression", admin: "introAdmin" };
  const ruleText = k => D.appCopy[k].replace("{perHour}", String(D.ip.perHour));
  app.click('[data-sec="skills"]');
  app.click("[data-menu-toggle]");
  app.click('[data-menu-switch="guide"]');
  assert.equal(ls(app, SGUIDE), "off");
  assert.equal(ls(app, GMGUIDE), null, "the sheet's switch wrote the table's");
  for (const sec of tabs) { app.click(`[data-sec="${sec}"]`); assert.equal(guides().length, 0, `${sec} still shows its guide line`); }
  for (const [sec, key] of Object.entries(rule)) {
    if (sec === "admin") { app.click("[data-menu-toggle]"); app.click("[data-admin]"); } else app.click(`[data-sec="${sec}"]`);
    assert.ok([...app.$$("#main .step-note")].some(n => n.textContent === ruleText(key)), `${sec}'s rule line went with the guide lines`);
  }
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  const again = openSheet(lockedCharacter(), "skills", { storage: { [SGUIDE]: "off" } });
  assert.equal(again.$$("#main [data-guide]").length, 0, "a reload forgot the switch");
  app.click('[data-sec="notes"]');
  app.click("[data-menu-toggle]");
  app.click('[data-menu-switch="guide"]');
  assert.equal(ls(app, SGUIDE), null);
  assert.equal(guides().length, 1, "On didn't bring it back");
  assert.deepEqual(app.errors, []);
});

test("K1: one flyout at a time", () => {
  const app = sheet("skills", { width: 1024 });
  app.click("[data-vitals-toggle]");
  assert.ok(app.$("#vdrawer").classList.contains("open"));
  app.click("[data-shelp]");
  assert.equal(shown(app), true);
  assert.ok(!app.$("#vdrawer").classList.contains("open"), "the vitals flyout stayed open under Help");
  app.click("#ghscrim");
  app.click("[data-shelp]");
  app.window.eval("openVitals()");
  assert.equal(shown(app), false, "Help stayed open under the vitals flyout");
  assert.ok(app.$("#vdrawer").classList.contains("open"));
  assert.deepEqual(app.errors, []);
});

test("K1: the ? key switch in Help turns keys off for the table too", () => {
  const app = sheet("main");
  app.click("[data-menu-toggle]");
  app.click('[data-menu-switch="keys"]');
  assert.equal(ls(app, KEYS), "off");
  pressEsc(app);
  assert.equal(questionMark(app).prevented, false);
  assert.equal(shown(app), false, "? worked with keys off");
  app.click("[data-shelp]");
  assert.equal(shown(app), true, "the button stopped working");
  assert.equal(app.$("[data-shelp]").hasAttribute("aria-keyshortcuts"), false);
  app.click("[data-menu-toggle]");
  app.click('[data-menu-switch="keys"]');
  assert.equal(ls(app, KEYS), null);
  assert.deepEqual(app.errors, []);
});

test("K1: admin mode left on doesn't make every tab Admin's: Help and the guide line follow the tab", () => {
  const app = sheet("main");
  app.click("[data-menu-toggle]"); app.click("[data-admin]");
  assert.equal(app.$("#main [data-guide]").textContent, SG().contexts.admin.intro);
  app.click('[data-sec="skills"]');   // admin mode is still on
  assert.equal(app.window.eval("S.admin"), true, "the fixture isn't in admin mode");
  assert.equal(app.$("#main [data-guide]").textContent, SG().contexts.skills.intro, "Skills draws Admin's guide line");
  app.click("[data-shelp]");
  assert.equal(heading(app), SG().contexts.skills.title, "Skills' Help is headed Admin");
  assert.deepEqual(app.errors, []);
});

test("K1: below 480px the ? is in ⋮ as Help, and focus comes back to ⋮", () => {
  const app = sheet("trackers");
  const item = app.$("#hdrmenu [data-shelp-menu]");
  assert.ok(item, "no Help item in ⋮");
  app.click("[data-menu-toggle]");
  app.click("[data-shelp-menu]");
  assert.equal(shown(app), true);
  assert.equal(app.$("#hdrmenu").hidden, true, "the menu stayed open");
  assert.equal(heading(app), SG().contexts.trackers.title);
  app.click("#ghelp [data-help-close]");
  assert.equal(shown(app), false);
  assert.equal(app.doc.activeElement, app.$("[data-menu-toggle]"), "focus didn't return to ⋮");
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  assert.match(css, /@media \(max-width:479px\)\{ \.hdr-actions \[data-shelp\]\{display:none\} \.hdr-menu \[data-shelp-menu\]\{display:block\} \}/, "no rule swaps the button for the menu item below 480px");
  assert.deepEqual(app.errors, []);
});

test("K1: below 480px, Help opened by the key from the page closes back to ⋮, not to the hidden ?", () => {
  const app = sheet("trackers", { width: 390 });
  assert.equal(questionMark(app).prevented, true);
  assert.equal(shown(app), true, "? didn't open Help");
  app.$("#ghelp [data-help-close]").focus();   // a real press puts focus on Close first
  app.click("#ghelp [data-help-close]");
  assert.equal(shown(app), false);
  assert.equal(app.doc.activeElement, app.$("[data-menu-toggle]"), "focus went to the ? the stylesheet hides below 480px");
  const wide = sheet("trackers", { width: 1024 });
  questionMark(wide);
  wide.$("#ghelp [data-help-close]").focus();
  wide.click("#ghelp [data-help-close]");
  assert.equal(wide.doc.activeElement, wide.$("[data-shelp]"), "from 480px focus goes back to the ?");
  assert.deepEqual(app.errors, []);
});

test("K1: Main's guide line is drawn, and the stylesheet hides it only below 640px", () => {
  const app = sheet("main");
  const line = app.$("#main [data-guide=\"main\"]");
  assert.ok(line, "Main has no guide line");
  assert.equal(line.textContent, SG().contexts.main.intro);
  // jsdom evaluates no media query: the rule is read from the shipped stylesheet. phone-check proves it hides and shows in Chromium.
  const css = readFileSync(new URL("../src/styles/shadows.css", import.meta.url), "utf8");
  const m = /@media \(max-width:(\d+)px\)\{ #main \[data-guide="main"\]\{display:none\} \}/.exec(css);
  assert.ok(m, "no rule hides Main's guide line on a phone");
  assert.equal(m[1], "639", "the rule must stop at 640px");
  assert.equal(/\[data-guide="(?!main)/.test(css.replace(/\[data-guide="main"\]/g, "")), false, "a rule hides another tab's guide line");
});

// ── K2: Every word, from the sheet's Help ─────────────────────────────
const typeQ = (app, v) => { const q = app.$("#ghelp [data-help-q]"); q.focus(); q.value = v; q.dispatchEvent(new app.window.Event("input", { bubbles: true })); return q; };
const liveRows = app => app.$$("#ghelp .help-word").filter(r => !r.hidden);
const liveTitles = app => liveRows(app).map(r => r.querySelector("dt").firstChild.textContent.trim());
const letterBtn = (app, L) => app.$(`#ghelp [data-help-letter="${L}"]`);

test("K2: Every word opens from the sheet's Help, filters and jumps", () => {
  const app = sheet("main");
  app.click("[data-shelp]");
  app.click("#ghelp [data-hwords]");
  assert.equal(heading(app), SG().ui.wordsLink);
  const q = app.$("#ghelp [data-help-q]");
  assert.ok(q && q.type === "search", "no filter box");
  assert.equal(app.doc.activeElement, app.$("#ghelp [data-hwords]"), "K4: focus stays on the Vocab tab, not the filter box");
  assert.equal(app.$("#ghelp label[for='ghelp-q']").textContent, SG().ui.filterLabel);
  const all = Engine.words(Engine.migrate(JSON.parse(JSON.stringify(lockedCharacter()))));
  assert.equal(app.$$("#ghelp .help-word").length, all.length, "not every word is listed");
  assert.equal(liveRows(app).length, all.length, "the list starts unfiltered");
  // A title match wins: RES and the Resistance linings stay, and Blunt (whose text says "pressure") goes.
  typeQ(app, "res");
  const t = liveTitles(app);
  assert.ok(t.includes("RES"), "RES is gone");
  assert.ok(t.some(x => /^Resistance/.test(x)), "Resistance is gone");
  assert.ok(!t.includes("Blunt"), "Blunt matched on its text while titles matched");
  assert.equal(letterBtn(app, "B").disabled, true, "a letter with no word is pressable");
  assert.equal(letterBtn(app, "R").disabled, false);
  const where = app.doc.activeElement;
  letterBtn(app, "B").click();
  assert.equal(app.doc.activeElement, where, "a disabled letter moved focus");
  // No title matches: the text is looked at. Nothing matches: it says so.
  typeQ(app, "pressure waves");
  assert.ok(liveTitles(app).includes("Blunt"), "a text match found nothing");
  typeQ(app, "zzzzzz");
  assert.equal(liveRows(app).length, 0);
  assert.equal(app.$("#ghelp [data-help-none]").textContent, SG().ui.filterEmpty);
  // Esc: the box with text clears and stays; the box empty is the panel's.
  const key = () => app.$("#ghelp [data-help-q]").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  key();
  assert.equal(shown(app), true, "Esc with text in the box closed the panel");
  assert.equal(app.$("#ghelp [data-help-q]").value, "");
  assert.equal(liveRows(app).length, all.length);
  assert.equal(app.doc.activeElement, app.$("#ghelp [data-help-q]"));
  // A letter jumps to the first row under it, and its title takes focus.
  letterBtn(app, "B").click();
  const first = app.$$("#ghelp .help-word").find(r => r.dataset.hwLetter === "B");
  assert.equal(app.doc.activeElement, first.querySelector("dt"), "focus didn't land on the first B word");
  // K4: the tab back, and focus is on it.
  app.click("#ghelp [data-hpage]");
  assert.equal(heading(app), SG().contexts.main.title);
  assert.equal(app.doc.activeElement, app.$("#ghelp [data-hpage]"), "focus didn't stay on the pressed tab");
  // Closing clears the filter.
  app.click("#ghelp [data-hwords]"); typeQ(app, "tol");
  app.click("#ghelp [data-help-close]"); app.click("[data-shelp]"); app.click("#ghelp [data-hwords]");
  assert.equal(app.$("#ghelp [data-help-q]").value, "", "the filter outlived the panel");
  assert.deepEqual(app.errors, []);
});

test("K2: a name with two meanings says which, and a word nobody has ruled on says so", () => {
  const app = sheet("main");
  app.click("[data-shelp]"); app.click("#ghelp [data-hwords]");
  typeQ(app, "emp");
  const emp = liveRows(app).filter(r => r.dataset.hwTitle.split(" ").includes("emp"));
  assert.deepEqual([...emp.map(r => r.querySelector(".help-kind")).filter(Boolean).map(k => k.textContent).sort()], ["Spell tag", "Stat", "Weapon tag"]);
  typeQ(app, "tolerance");
  assert.equal(liveRows(app).length, 1);
  assert.equal(liveRows(app)[0].querySelector(".help-kind"), null, "TOL is one meaning and carries no label");
  typeQ(app, "aether");
  const aether = liveRows(app).find(r => r.querySelector("dt").textContent.startsWith("Aether"));
  assert.match(aether.textContent, /doesn't say yet what this damage is/);
  assert.match(aether.textContent, new RegExp(D.appCopy.unsettledLabel));
  assert.deepEqual(app.errors, []);
});

test("K2: the filter keeps its focus through a sheet redraw", () => {
  const app = sheet("main", { width: 1280 });
  app.click("[data-shelp]"); app.click("#ghelp [data-hwords]");
  const q = typeQ(app, "pro");
  const row = app.$("#ghelp .help-word");
  const before = liveTitles(app);
  assert.ok(before.length > 0 && before.length < app.$$("#ghelp .help-word").length);
  app.click('#main [data-dmg="1"]');   // Hurt 1: the page redraws beside the column
  assert.equal(app.$("#ghelp [data-help-q]"), q, "the box was drawn again");
  assert.equal(app.$("#ghelp .help-word"), row, "the list was drawn again");
  assert.equal(app.doc.activeElement, q, "the box lost focus");
  assert.equal(q.value, "pro");
  assert.deepEqual(liveTitles(app), before, "the list lost its filter");
  // A draw that does change the words (a forced repaint) still keeps the box, its text and its filter.
  app.window.eval("paintHelp(true)");
  const q2 = app.$("#ghelp [data-help-q]");
  assert.equal(app.doc.activeElement, q2, "a forced repaint dropped focus from the box");
  assert.equal(q2.value, "pro");
  assert.deepEqual(liveTitles(app), before);
  assert.deepEqual(app.errors, []);
});

test("K2: a tab press keeps Every word open in the column, and closes the flyout", () => {
  const wide = sheet("main", { width: 1280 });
  wide.click("[data-shelp]"); wide.click("#ghelp [data-hwords]");
  typeQ(wide, "luck");
  const kept = liveTitles(wide);
  wide.click('[data-sec="skills"]');
  assert.equal(shown(wide), true);
  assert.equal(heading(wide), SG().ui.wordsLink, "a tab press took Every word back to the tab's help");
  assert.equal(wide.$("#ghelp [data-help-q]").value, "luck");
  assert.deepEqual(liveTitles(wide), kept);
  // Admin is a mode that outlives its tab: the words are no more Admin's than Skills'.
  wide.click("[data-menu-toggle]"); wide.click("[data-admin]");
  assert.equal(heading(wide), SG().ui.wordsLink);
  wide.click("#ghelp [data-hpage]");
  assert.equal(heading(wide), SG().contexts.admin.title);
  wide.click('[data-sec="notes"]');
  assert.equal(heading(wide), SG().contexts.notes.title, "Back left the words on a tab");
  const narrow = sheet("main", { width: 1024 });
  narrow.click("[data-shelp]"); narrow.click("#ghelp [data-hwords]");
  narrow.click('[data-sec="skills"]');
  assert.equal(shown(narrow), false, "a tab press left the flyout open");
  // A resize across 1280 with Every word open: the same panel, nothing thrown, the filter kept.
  const rz = sheet("main", { width: 1280 });
  rz.click("[data-shelp]"); rz.click("#ghelp [data-hwords]");
  typeQ(rz, "luck");
  rz.resize(1024);
  assert.equal(shown(rz), true);
  assert.equal(rz.$("#ghelp [data-help-q]").value, "luck");
  assert.deepEqual(wide.errors.concat(narrow.errors, rz.errors), []);
});

test("K2: the tabs' words are drawn from where their rules live, and a tab leaves out what the character can't have", () => {
  const app = sheet("trackers");
  app.click("[data-shelp]");
  const text = () => app.$("#ghelp").textContent;
  for (const t of ["Health Levels (HP)", "PROT", "RES", "Integrity", "Çredits", "CRANK rep"]) assert.ok(text().includes(t), `${t} isn't on Trackers' Help`);
  const prof = lockedCharacter(); prof.identity.archetype = "professional";
  const p = openSheet(prof, "trackers"); p.click("[data-shelp]");
  assert.ok(!p.$("#ghelp").textContent.includes("Spiritual Force Rating"), "a Professional is shown SFR");
  const w = lockedCharacter(); w.identity.archetype = "werewolf";
  const ww = openSheet(w, "trackers"); ww.click("[data-shelp]");
  assert.ok(ww.$("#ghelp").textContent.includes("Spiritual Force Rating"), "a Werewolf isn't");
  assert.deepEqual(app.errors.concat(p.errors, ww.errors), []);
});

test("K2: no sentence on the sheet changed: the new words carry no forms", () => {
  const before = ["bright", "dim", "dark", "blind", "pain-level", "kicker-die", "take-x", "explode", "botch", "defensive-action", "skill-check", "TOL", "WILL", "SAN", "LUCK", "milestone-point"];
  const withForms = D.gameTerms.filter(r => Array.isArray(r.forms)).map(r => r.id);
  assert.deepEqual([...withForms], before, "a gameTerms row gained forms: every sentence that names it grows a trigger (KQ13)");
  const text = "IP HP PROT RES TN TH ACC RoF Capacity Integrity TAG Range Difficulty Health Levels Improvement Points Target Number Threshold";
  assert.deepEqual([...Engine.termSpans(text)], [], "a K2 word became a trigger");
});

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

// ── K4 (Decisions 306, 307) ──
test("K4: the sheet's Help has This tab and Vocab, and no Back", () => {
  const app = sheet("trackers");
  app.click("[data-shelp]");
  const tabs = () => [...app.$$("#ghelp .help-tabs button")];
  assert.deepEqual(tabs().map(b => b.textContent), [SG().ui.pageTab, SG().ui.wordsLink]);
  assert.deepEqual([SG().ui.pageTab, SG().ui.wordsLink], ["This tab", "Vocab"]);
  assert.equal(panel(app).querySelector("[data-help-back]"), null);
  assert.equal(panel(app).querySelector(".help-foot"), null);
  app.click("#ghelp [data-hwords]");
  assert.equal(app.$("#ghelp [data-hwords]").getAttribute("aria-current"), "page");
  assert.equal(app.doc.activeElement, app.$("#ghelp [data-hwords]"), "focus left the pressed tab");
  assert.ok(app.$("#ghelp [data-help-q]"), "Vocab's filter isn't shown");
  app.click("#ghelp [data-hpage]");
  assert.equal(heading(app), SG().contexts.trackers.title);
  assert.equal(app.$("#ghelp [data-hpage]").getAttribute("aria-current"), "page");
  assert.equal(app.doc.activeElement, app.$("#ghelp [data-hpage]"));
  assert.deepEqual(app.errors, []);
});

test("K4: the sheet's Guide lines and The ? key are in ⋮, show their state and flip in place", () => {
  const app = sheet("skills");
  app.click("[data-menu-toggle]");
  const item = n => app.$(`#hdrmenu [data-menu-switch="${n}"]`);
  for (const [name, key, pref] of [["guide", "guideSwitch", SGUIDE], ["keys", "keySwitch", KEYS]]) {
    assert.ok(item(name).textContent.includes(SG().ui[key]), name + "'s label");
    assert.equal(item(name).getAttribute("aria-pressed"), "true");
    app.click(`[data-menu-switch="${name}"]`);
    assert.equal(ls(app, pref), "off", name + " didn't write its setting");
    assert.equal(item(name).getAttribute("aria-pressed"), "false");
    assert.ok(item(name).textContent.includes(SG().ui.off));
    assert.equal(app.doc.activeElement, item(name), name + ": focus left the item");
    assert.equal(app.$("#hdrmenu").hidden, false, name + ": ⋮ closed");
  }
  assert.equal(app.$$("#main [data-guide]").length, 0, "the guide line is still on the page");
  assert.equal(app.$("[data-shelp]").hasAttribute("aria-keyshortcuts"), false);
  app.click('[data-menu-switch="guide"]'); app.click('[data-menu-switch="keys"]');
  assert.equal(ls(app, SGUIDE), null); assert.equal(ls(app, KEYS), null);
  assert.equal(app.$$("#main [data-guide]").length, 1);
  assert.deepEqual(app.errors, []);
});

test("K4: the sheet's tab press opens Help at its top; a redraw of the same view keeps its place", () => {
  const app = sheet("trackers", { width: 1280 });
  app.click("[data-shelp]");
  let top = 0; Object.defineProperty(panel(app), "scrollTop", { configurable: true, get: () => top, set: v => { top = v; } });
  top = 500; app.click("#ghelp [data-hwords]");
  assert.equal(top, 0, "Vocab opened where This tab was scrolled to");
  top = 500; app.click("#ghelp [data-hpage]");
  assert.equal(top, 0, "This tab opened where Vocab was scrolled to");
  top = 500; app.window.eval("paintHelp(true)");
  assert.equal(top, 500, "a redraw of the same view lost its place");
  // Vocab outlives a change of tab (keepView): a redraw after one, say a new word from an edit, keeps the reader's place.
  app.click("#ghelp [data-hwords]"); top = 500;
  app.click('[data-sec="skills"]');
  top = 500; app.window.eval("paintHelp(true)");
  assert.equal(top, 500, "Vocab jumped to its top on a redraw after a change of tab");
  assert.deepEqual(app.errors, []);
});
