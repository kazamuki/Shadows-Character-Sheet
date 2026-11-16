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
import { Engine, D, lockedCharacter, openSheet } from "./smokekit.mjs";

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
const term = (app, id) => app.window.eval(`TIPS.term(${JSON.stringify(id)})`);
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
  for (const id of c.words) assert.ok(panel(app).textContent.includes(term(app, id).title), `${id}'s title isn't in the panel`);
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
    for (const [sec, c] of Object.entries(G.contexts)) for (const id of c.words) assert.ok(Engine.term(id, Engine.migrate(JSON.parse(JSON.stringify(ch)))), `${id} (${sec}) doesn't resolve for a ${arch}`);
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
  app.click("[data-shelp]");
  app.click("#ghelp [data-help-guide-off]");
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
  app.click("#ghelp [data-help-guide-on]");
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
  app.click("[data-shelp]");
  app.click("#ghelp [data-help-keys-off]");
  assert.equal(ls(app, KEYS), "off");
  pressEsc(app);
  assert.equal(questionMark(app).prevented, false);
  assert.equal(shown(app), false, "? worked with keys off");
  app.click("[data-shelp]");
  assert.equal(shown(app), true, "the button stopped working");
  assert.equal(app.$("[data-shelp]").hasAttribute("aria-keyshortcuts"), false);
  app.click("#ghelp [data-help-keys-on]");
  assert.equal(ls(app, KEYS), null);
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
