/**
 * Decision 259: on a table, F opens Find and J opens Jot, never while typing, and
 * ⋮ → Keys lists them and turns them off.
 *
 * jsdom inserts no text on a keydown and has no scroll position, so nothing here asserts a
 * field's value after a key or a scroll value: those are phone-check's B1–B3 (Chromium).
 * Where the focus call's own options matter (preventScroll), the test records the call.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { GM_ON, runTable, castAdd, type, notesTab, openSheet, lockedCharacter } from "./smokekit.mjs";

const KEYS = "shadows.ui.keys";
const tableApp = (storage = GM_ON) => {
  const app = boot({ storage });
  runTable(app, "T");
  castAdd(app, "Dez", "a courier");
  return app;
};
const blurAll = app => { const a = app.doc.activeElement; if (a && a !== app.doc.body) a.blur(); };
// Dispatches a keydown on `target` (focusing it first) and says whether anything cancelled it.
const press = (app, target, key, init = {}) => {
  if (target && target !== app.doc.body) target.focus(); else blurAll(app);
  const ev = new app.window.KeyboardEvent("keydown", Object.assign({ key, bubbles: true, cancelable: true }, init));
  const notPrevented = (target || app.doc.body).dispatchEvent(ev);
  return { prevented: !notPrevented };
};
const modalOpen = app => !!app.$("dialog.modal[open]");
const pressEsc = app => app.$("#modal").dispatchEvent(new app.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
const card = app => app.$("[data-copen]");
// Records each focus() call's options, so a test can tell a key's return from a click's.
const spyFocus = app => {
  const calls = [];
  const proto = app.window.HTMLElement.prototype, was = proto.focus;
  proto.focus = function (opts) { calls.push({ el: this, opts }); return was.call(this, opts); };
  return calls;
};

test("Decision 259: F opens Find and J opens Jot on a table, the key held back from the box", () => {
  const app = tableApp();
  for (const from of ["body", "card"]) {
    const target = from === "body" ? app.doc.body : card(app);
    let r = press(app, target, "f");
    assert.ok(modalOpen(app), from + ": F opened nothing");
    assert.equal(app.doc.activeElement, app.$("[data-findq]"), from);
    assert.equal(r.prevented, true, from + ": F's keydown wasn't cancelled, so a browser types it into the box");
    pressEsc(app);
    r = press(app, target, "j");
    assert.ok(modalOpen(app), from + ": J opened nothing");
    assert.equal(app.doc.activeElement, app.$("[data-jottext]"), from);
    assert.equal(r.prevented, true, from + ": J's keydown wasn't cancelled");
    pressEsc(app);
  }
  // Caps Lock: key is "F", no Shift.
  const r = press(app, app.doc.body, "F");
  assert.ok(modalOpen(app) && r.prevented, "Caps-Lock F");
  assert.deepEqual(app.errors, []);
});

test("Decision 259: F and J do nothing in a field, with a modifier, on repeat, over an open box, or off a table", () => {
  const app = tableApp();
  const nothing = (target, key, init, why) => {
    const before = app.$("#modal") ? app.$("#modal").innerHTML : "";
    const r = press(app, target, key, init);
    assert.equal(app.$("#modal") ? app.$("#modal").innerHTML : "", before, why + ": a box opened or changed");
    assert.equal(r.prevented, false, why + ": the key was cancelled");
    if (target) assert.equal(app.doc.activeElement, target, why + ": focus moved");
  };
  // A cast member's page has a Name input, a Description textarea and a Status select.
  app.click("[data-copen]");
  const input = app.$("main input[type=text], main input:not([type])"), area = app.$("main textarea"), sel = app.$("main select");
  assert.ok(input && area && sel, "the member's page lacks a field to test");
  nothing(input, "f", {}, "an input");
  nothing(area, "j", {}, "a textarea");
  nothing(sel, "f", {}, "a select");
  const ce = app.doc.createElement("div"); ce.setAttribute("contenteditable", "true"); ce.tabIndex = 0; app.$("main").appendChild(ce);
  nothing(ce, "f", {}, "a contenteditable");
  const btn = card(app) || app.$("main button");
  nothing(btn, "f", { isComposing: true }, "isComposing");
  for (const init of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { repeat: true }]) nothing(btn, "f", init, JSON.stringify(init));
  nothing(btn, "F", { shiftKey: true }, "Shift+F");
  // The Find field itself is a field.
  app.click("[data-tfind]");
  nothing(app.$("[data-findq]"), "j", {}, "Find's own field");
  pressEsc(app);
  // Jot open, focus on Save: still Jot, its draft untouched.
  app.click("[data-tjot]");
  type(app, "[data-jottext]", "keep me");
  const save = app.$("[data-jotsave]");
  save.focus();
  const r = press(app, save, "f");
  assert.equal(r.prevented, false);
  assert.ok(app.$("[data-jottext]") && !app.$("[data-findq]"), "F over Jot replaced the box");
  assert.equal(app.window.eval("S.jotDraft"), "keep me");
  pressEsc(app);
  // ⋮ open: F and J are the page's behind a layer. Focus on a menu item, as Tab leaves it.
  app.click("[data-menu-toggle]");
  assert.equal(app.$("#hdrmenu").hidden, false);
  nothing(app.$("[data-trename]"), "f", {}, "⋮ open, on a menu item");
  nothing(app.doc.body, "j", {}, "⋮ open, on the page");
  app.click("[data-menu-toggle]");
  assert.equal(app.$("#hdrmenu").hidden, true);
  press(app, app.doc.body, "f"); assert.ok(modalOpen(app), "F stayed off after ⋮ closed"); pressEsc(app);
  // The two guards Home's empty `S.table` would otherwise hide: the switch pulled while a table is open, and a screen
  // that isn't a table's with a table still held (not a state the app reaches; the guard is what keeps it so).
  const feat = app.window.localStorage.getItem("shadows.feature.gm");
  app.window.localStorage.removeItem("shadows.feature.gm");
  nothing(app.doc.body, "f", {}, "the gm switch off under an open table");
  app.window.localStorage.setItem("shadows.feature.gm", feat);
  app.window.eval('S.screen = "sheet"');
  nothing(app.doc.body, "j", {}, "a screen that isn't a table's");
  app.window.eval('S.screen = "table"');
  press(app, app.doc.body, "f"); assert.ok(modalOpen(app), "the guards didn't let go again"); pressEsc(app);
  // Off a table: Home, the wizard, a locked character's sheet (real navigation, GM mode on), and Home with GM mode off.
  app.click("[data-menu-toggle]"); app.click("[data-thome]");
  assert.equal(app.window.eval("S.screen"), "home");
  nothing(app.$("#btn-run-table"), "f", {}, "Home");
  nothing(app.doc.body, "j", {}, "Home, body");
  const quiet = (a, target, key, why) => {
    const r = press(a, target, key);
    assert.equal(!!a.$("dialog.modal[open]"), false, why + ": a box opened");
    assert.equal(r.prevented, false, why + ": the key was cancelled");
    if (target !== a.doc.body) assert.equal(a.doc.activeElement, target, why + ": focus moved");
  };
  const wiz = boot({ storage: GM_ON });
  wiz.click("#btn-new");
  assert.notEqual(wiz.window.eval("S.screen"), "home", "New character didn't leave Home");
  assert.notEqual(wiz.window.eval("S.screen"), "table");
  quiet(wiz, wiz.doc.body, "f", "the wizard"); quiet(wiz, wiz.doc.body, "j", "the wizard");
  const sheet = openSheet(lockedCharacter(), "main", { storage: GM_ON });
  assert.equal(sheet.window.eval("S.screen"), "sheet");
  quiet(sheet, sheet.doc.body, "f", "a locked sheet"); quiet(sheet, sheet.doc.body, "j", "a locked sheet");
  assert.deepEqual([wiz.errors, sheet.errors], [[], []]);
  const off = boot();
  assert.equal(off.$("dialog.modal[open]"), null);
  const r2 = press(off, off.doc.body, "f"); assert.equal(r2.prevented, false);
  assert.equal(off.$("dialog.modal[open]"), null);
  assert.deepEqual(app.errors, []);
});

test("Decision 259: closing a box a key opened gives focus back to the button it was opened from, without scrolling", () => {
  const app = tableApp();
  const calls = spyFocus(app);
  const back = () => calls[calls.length - 1];
  press(app, card(app), "f"); calls.length = 0; pressEsc(app);
  assert.equal(app.doc.activeElement, card(app));
  assert.equal(back().opts && back().opts.preventScroll, true, "a key's return scrolls");
  press(app, app.doc.body, "f"); calls.length = 0; pressEsc(app);
  assert.equal(app.doc.activeElement, app.$("[data-tfind]"));
  assert.equal(back().opts && back().opts.preventScroll, true);
  // A click path is as it was: the same focus() with no options.
  app.click("[data-tfind]"); calls.length = 0; pressEsc(app);
  assert.equal(app.doc.activeElement, app.$("[data-tfind]"));
  assert.equal(back().opts, undefined, "a click's return changed");
  // Another box (Rename) is as it was too.
  app.click("[data-menu-toggle]"); app.click("[data-trename]"); calls.length = 0; pressEsc(app);
  assert.equal(back().opts, undefined, "Rename's return changed");
  assert.deepEqual(app.errors, []);
});

test("Decision 259: Jot's Save returns focus to where J was pressed", () => {
  const app = tableApp();
  press(app, card(app), "j");
  type(app, "[data-jottext]", "Dez owes Ike");
  app.click("[data-jotsave]");
  assert.equal(app.window.eval("S.table.notes.length"), 1);
  assert.equal(app.doc.activeElement, card(app), "Save sent focus to the header");
  // The Notes tab redraws, so the opener is gone: the header's Jot.
  notesTab(app);
  const b = app.$("#main button");
  assert.ok(b, "no button on the Notes tab");
  press(app, b, "j");
  type(app, "[data-jottext]", "second");
  app.click("[data-jotsave]");
  assert.equal(b.isConnected, false, "the Notes tab wasn't redrawn, so this tests nothing");
  assert.equal(app.doc.activeElement, app.$("[data-tjot]"));
  // From the button, as today.
  app.$("[data-tjot]").focus(); app.click("[data-tjot]");
  type(app, "[data-jottext]", "third"); app.click("[data-jotsave]");
  assert.equal(app.doc.activeElement, app.$("[data-tjot]"));
  assert.deepEqual(app.errors, []);
});

test("Decision 259: ⋮ → Keys lists the keys and turns F and J off and on for this browser", () => {
  const app = tableApp();
  app.$("[data-menu-toggle]").focus();   // a real click focuses the button; a dispatched one doesn't
  app.click("[data-menu-toggle]"); app.click("[data-tkeys]");
  assert.ok(modalOpen(app));
  assert.equal(app.$("#menu, #hdrmenu").hidden, true, "the menu stayed open under the box");
  const text = app.$("#modal").textContent;
  for (const k of ["F", "J", "Esc", "Enter"]) assert.ok(text.includes(k), k);
  assert.equal(app.$("#modal [data-keyon]").getAttribute("aria-pressed"), "true");
  app.click("#modal [data-keyoff]");
  assert.equal(app.window.localStorage.getItem(KEYS), "off");
  assert.equal(app.$("#modal [data-keyoff]").getAttribute("aria-pressed"), "true");
  assert.equal(app.$("#modal [data-keyon]").getAttribute("aria-pressed"), "false");
  assert.equal(app.$("[data-tfind]").hasAttribute("aria-keyshortcuts"), false);
  assert.equal(app.$("[data-tjot]").hasAttribute("aria-keyshortcuts"), false);
  app.click("#modal [data-modalclose]");
  assert.equal(app.doc.activeElement, app.$("[data-menu-toggle]"), "Keys closes to ⋮");
  const r = press(app, app.doc.body, "f");
  assert.equal(modalOpen(app), false, "F opened Find while off");
  assert.equal(r.prevented, false);
  // A fresh boot with the stored choice is still off.
  const again = boot({ storage: Object.assign({}, GM_ON, { [KEYS]: "off" }) });
  runTable(again, "U");
  assert.equal(press(again, again.doc.body, "f").prevented, false);
  assert.equal(modalOpen(again), false);
  assert.equal(again.$("[data-tfind]").hasAttribute("aria-keyshortcuts"), false);
  // On again: the key is removed and F works.
  app.click("[data-menu-toggle]"); app.click("[data-tkeys]"); app.click("#modal [data-keyon]");
  assert.equal(app.window.localStorage.getItem(KEYS), null);
  assert.equal(app.$("[data-tfind]").getAttribute("aria-keyshortcuts"), "F");
  app.click("#modal [data-modalclose]");
  press(app, app.doc.body, "f");
  assert.ok(modalOpen(app));
  assert.deepEqual(app.errors, []);
});

test("Decision 259: the header's Find and Jot say their keys while the keys are on", () => {
  const app = tableApp();
  const says = (why, on) => {
    const f = app.$("[data-tfind]"), j = app.$("[data-tjot]");
    assert.equal(f.getAttribute("aria-keyshortcuts"), on ? "F" : null, why);
    assert.equal(j.getAttribute("aria-keyshortcuts"), on ? "J" : null, why);
    assert.equal(f.textContent, "Find"); assert.equal(j.textContent, "Jot");
  };
  for (const sec of ["sessions", "players", "cast", "city", "threats", "encounters", "reference", "notes"]) { app.click(`[data-tsec="${sec}"]`); says(sec, true); }
  app.click('[data-tsec="cast"]'); app.click("[data-copen]"); says("a member's page", true);
  app.click('[data-tsec="encounters"]');
  type(app, "[data-enc-name]", "Docks"); app.click("[data-enc-new]");
  type(app, "[data-enc-pcname]", "Wren"); app.click("[data-enc-addpc]"); app.click("[data-enc-start]");
  assert.match(app.$(".enc-status").textContent, /Round 1/);
  says("a running encounter", true);
  const off = boot({ storage: Object.assign({}, GM_ON, { [KEYS]: "off" }) });
  runTable(off, "U");
  assert.equal(off.$("[data-tfind]").hasAttribute("aria-keyshortcuts"), false);
  assert.deepEqual(app.errors, []);
});
