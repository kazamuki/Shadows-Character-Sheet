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
import { GM_ON, runTable, castAdd, type, notesTab, openSheet, lockedCharacter, edit, deadAirApp } from "./smokekit.mjs";

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
  app.click("[data-copen]"); edit(app);
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
  // FEATURES and the browser's key are read at each press, so clearing both is the switch pulled, launched or not (Decision 260).
  const feat = app.window.localStorage.getItem("shadows.feature.gm");
  app.window.localStorage.removeItem("shadows.feature.gm");
  app.window.eval("FEATURES.gm = false");
  nothing(app.doc.body, "f", {}, "the gm switch off under an open table");
  app.window.eval("FEATURES.gm = true");
  if (feat !== null) app.window.localStorage.setItem("shadows.feature.gm", feat);
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
  app.click("[data-enc-player]"); type(app, "[data-enc-pname]", "Wren"); app.click("[data-enc-addplayer]"); app.click("[data-enc-start]");
  assert.match(app.$(".enc-status").textContent, /Round 1/);
  says("a running encounter", true);
  const off = boot({ storage: Object.assign({}, GM_ON, { [KEYS]: "off" }) });
  runTable(off, "U");
  assert.equal(off.$("[data-tfind]").hasAttribute("aria-keyshortcuts"), false);
  assert.deepEqual(app.errors, []);
});

test("Decision 259: ⋮ → Activity and ⋮ → What's new close back to ⋮, not to the menu item that was hidden", () => {
  for (const [item, name] of [["[data-tactivity]", "Activity"], ["#hdrmenu [data-whatsnew]", "What's new"]]) {
    const app = tableApp();
    const kb = app.$("[data-menu-toggle]");
    kb.focus(); app.click("[data-menu-toggle]");
    app.$(item).focus();   // a real press has focus on the item
    app.click(item);
    assert.ok(modalOpen(app), name);
    // jsdom focuses a hidden element, so what proves it is what the box will return to.
    assert.equal(app.window.eval("modalState.opener") === kb, true, name + ": the box would return focus to the hidden menu item");
    pressEsc(app);
    assert.equal(app.doc.activeElement, kb, name);
    assert.deepEqual(app.errors, []);
  }
});

test("Closing What's new from the sheet's ⋮ menu puts focus back on ⋮", () => {
  const app = openSheet(lockedCharacter(), "main");
  const kb = app.$("[data-menu-toggle]");
  kb.focus(); app.click("[data-menu-toggle]");
  app.$("#hdrmenu [data-whatsnew]").focus();
  app.click("#hdrmenu [data-whatsnew]");
  assert.ok(modalOpen(app));
  assert.equal(app.window.eval("modalState.opener") === kb, true, "the box would return focus to the hidden menu item");
  pressEsc(app);
  assert.equal(app.doc.activeElement, kb);
  assert.deepEqual(app.errors, []);
});

// ── U5: keys and landmarks (Decision 272) ───────────────────────────────────
// Dead Air, read as a GM would. Every control a key acts on is found with `$`, never `app.click`, which presses Edit when a selector is missing.
const SECTIONS = ["sessions", "players", "cast", "city", "threats", "encounters", "reference", "notes"];
const u5Later = app => new Promise(r => app.window.setTimeout(r, 60));
const tabNow = app => app.window.eval("S.tsection");
const currents = app => app.$$("#topnav [data-tsec][aria-current]").map(b => b.dataset.tsec + "=" + b.getAttribute("aria-current"));
const digit = (app, target, n, init = {}) => press(app, target, String(n), Object.assign({ code: "Digit" + n }, init));
const toastText = app => (app.$("#undotoast") && !app.$("#undotoast").hidden) ? app.$("#undotoast").textContent : "";
const auditLen = app => app.window.eval("S.table.audit.length");
const openFight = app => {
  app.window.eval("S.encOpen = null");
  app.click('[data-tsec="encounters"]');
  const b = app.$('[data-enc-open="EN-T0R5ADN7"]');
  assert.ok(b, "Dead Air's running fight");
  b.click();
  assert.ok(app.$("[data-enext]"), "the running fight's page draws Next");
};

test("U5: 1–8 open the sections in tab order, as a tab press does", () => {
  const app = deadAirApp("players");
  SECTIONS.forEach((id, i) => {
    const r = digit(app, app.doc.body, i + 1);
    assert.equal(tabNow(app), id, `${i + 1} → ${id}`);
    assert.equal(r.prevented, true, `${i + 1} acts, so it is held back`);
    assert.equal(app.doc.activeElement, app.$(`#topnav [data-tsec="${id}"]`), `${id}: focus is on the tab`);
    assert.deepEqual(currents(app), [id + "=page"], `${id}: aria-current on the open tab alone`);
  });
  // From a member's page, a digit leaves it for the list, as a press on the tab does.
  digit(app, app.doc.body, 3);
  app.$("[data-copen]").click();
  assert.ok(app.window.eval("S.castOpen"), "a member's page is open");
  digit(app, app.doc.body, 3);
  assert.equal(app.window.eval("S.castOpen"), null, "3 left the member's page");
  assert.ok(app.$("[data-copen]"), "the Cast list is back");
  // The numpad, and a layout where the digit needs Shift (AZERTY; QWERTY's Shift+1 is "!").
  press(app, app.doc.body, "6", { code: "Numpad6" });
  assert.equal(tabNow(app), "encounters", "Numpad6");
  press(app, app.doc.body, "&", { code: "Digit1", shiftKey: true });
  assert.equal(tabNow(app), "sessions", "Shift+Digit1");
  // With NumLock off the numpad's keys are End, ArrowDown, Home: they scroll the page, so they are the browser's.
  for (const [code, key] of [["Numpad1", "End"], ["Numpad2", "ArrowDown"], ["Numpad7", "Home"], ["Numpad3", "PageDown"]]) {
    const r = press(app, app.doc.body, key, { code });
    assert.equal(tabNow(app), "sessions", code + " with NumLock off changed section");
    assert.equal(r.prevented, false, code + " with NumLock off was cancelled");
  }
  // A held Ctrl or Alt or Meta is the browser's.
  for (const init of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }]) {
    const r = digit(app, app.doc.body, 3, init);
    assert.equal(tabNow(app), "sessions", JSON.stringify(init));
    assert.equal(r.prevented, false, JSON.stringify(init) + " was cancelled");
  }
  // 9 and 0 are no section.
  assert.equal(digit(app, app.doc.body, 9).prevented, false);
  assert.deepEqual(app.errors, []);
});

test("U5: N runs Next turn on a running encounter's page and nothing elsewhere", async () => {
  const app = deadAirApp("encounters");
  const who = () => { const r = app.$("[aria-current=step]"); return r && r.querySelector(".enc-name").textContent; };
  // On the list, and on Cast: nothing, and the key stays the browser's.
  let r = press(app, app.doc.body, "n");
  assert.equal(r.prevented, false, "N on the encounter list was cancelled");
  digit(app, app.doc.body, 3);
  r = press(app, app.doc.body, "n");
  assert.equal(r.prevented, false, "N on Cast was cancelled");
  // A planned encounter has no Next.
  app.click('[data-tsec="encounters"]');
  const planned = app.$('[data-enc-open="EN-7069Z3C4"]');
  assert.ok(planned);
  planned.click();
  assert.equal(app.$("[data-enext]"), null, "a planned encounter draws no Next");
  r = press(app, app.doc.body, "n");
  assert.equal(r.prevented, false);
  // The running fight.
  openFight(app);
  const before = who();
  r = press(app, app.doc.body, "n");
  await u5Later(app);
  assert.equal(r.prevented, true, "N acted, so it is held back");
  assert.notEqual(who(), before, "Now didn't move");
  assert.equal(app.doc.activeElement, app.$("[data-enext]"), "focus is on Next turn, as a press leaves it");
  assert.equal(app.$("#announcer").textContent, `${who()} acts`);
  // Ctrl+N, Shift+N and the rest are not N; Caps-Lock N (no Shift) is.
  const w1 = who();
  for (const init of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true }]) assert.equal(press(app, app.doc.body, "n", init).prevented, false);
  await u5Later(app);
  assert.equal(who(), w1, "a modified N moved Now");
  press(app, app.doc.body, "N");
  await u5Later(app);
  assert.notEqual(who(), w1, "Caps-Lock N");
  assert.deepEqual(app.errors, []);
});

test("U5: Ctrl+Z and ⌘+Z take back the newest change and say so", () => {
  const app = deadAirApp("sessions");
  const cid = app.$$("[data-clkplus]:not([disabled])")[0].closest("li").dataset.cline;
  const line = () => app.$(`[data-cline="${cid}"]`);
  const plus = () => line().querySelector("[data-clkplus]");
  const count = () => line().querySelector("[data-cline-n]").textContent;
  const c0 = count(), a0 = auditLen(app);
  plus().click();
  assert.notEqual(count(), c0, "the clock's + did nothing");
  assert.equal(auditLen(app), a0 + 1);
  const r = press(app, app.doc.body, "z", { ctrlKey: true });
  assert.equal(r.prevented, true, "Ctrl+Z acted, so the browser's is held back");
  assert.equal(count(), c0, "Ctrl+Z didn't take the + back");
  assert.equal(auditLen(app), a0);
  assert.match(toastText(app), /^Undone: .+/);
  // ⌘+Z on the next change.
  plus().click();
  assert.equal(press(app, app.doc.body, "z", { metaKey: true }).prevented, true);
  assert.equal(count(), c0);
  assert.match(toastText(app), /^Undone: /);
  // Ctrl+Shift+Z is Redo in a browser, and Ctrl+Alt+Z is nobody's: neither undoes.
  plus().click();
  const a1 = auditLen(app);
  for (const init of [{ ctrlKey: true, shiftKey: true }, { ctrlKey: true, altKey: true }, { ctrlKey: true, metaKey: true }]) {
    assert.equal(press(app, app.doc.body, "z", init).prevented, false, JSON.stringify(init));
    assert.equal(auditLen(app), a1, JSON.stringify(init) + " undid");
  }
  // An emptied log says so.
  app.window.eval("Engine.clearTableActivity(S.table); rebaseTable(); update()");
  assert.equal(auditLen(app), 0);
  const r2 = press(app, app.doc.body, "z", { ctrlKey: true });
  assert.equal(toastText(app), "Nothing to undo.");
  assert.equal(r2.prevented, true, "the key was heard, so the browser's is held back");
  // A bare Z is nothing.
  assert.equal(press(app, app.doc.body, "z").prevented, false);
  assert.deepEqual(app.errors, []);
});

test("U5: A opens Activity and ? opens Keys, and each closes back where it was pressed", () => {
  const app = deadAirApp("cast");
  const calls = spyFocus(app);
  const target = card(app);
  let r = press(app, target, "a");
  assert.ok(modalOpen(app), "A opened nothing");
  assert.equal(r.prevented, true);
  assert.match(app.$("#modal").textContent, /Activity/);
  calls.length = 0;
  pressEsc(app);
  assert.equal(app.doc.activeElement, target, "Activity returns to where A was pressed");
  assert.equal(calls[calls.length - 1].opts && calls[calls.length - 1].opts.preventScroll, true, "a key's return scrolls");
  r = press(app, target, "?", { shiftKey: true, code: "Slash" });
  assert.ok(modalOpen(app), "? opened nothing");
  assert.equal(r.prevented, true);
  const text = app.$("#modal").textContent;
  for (const k of ["1–8", "N", "Ctrl/⌘+Z", "A", "?", "F", "J", "Esc"]) assert.ok(text.includes(k), k + " isn't in the list");
  calls.length = 0;
  pressEsc(app);
  assert.equal(app.doc.activeElement, target, "Keys returns to where ? was pressed");
  // The one switch turns all of them off, F and J included.
  press(app, target, "?", { shiftKey: true });
  app.click("#modal [data-keyoff]");
  app.click("#modal [data-modalclose]");
  assert.equal(digit(app, app.doc.body, 1).prevented, false);
  assert.equal(tabNow(app), "cast", "1 acted while off");
  assert.equal(press(app, app.doc.body, "f").prevented, false);
  assert.equal(modalOpen(app), false);
  assert.equal(press(app, app.doc.body, "?", { shiftKey: true }).prevented, false, "? acted while the keys are off");
  assert.equal(modalOpen(app), false);
  // ⋮ → Activity is unchanged: it still returns to ⋮.
  const kb = app.$("[data-menu-toggle]");
  kb.focus();
  app.click("[data-menu-toggle]");
  app.click("[data-tactivity]");
  assert.ok(modalOpen(app));
  pressEsc(app);
  assert.equal(app.doc.activeElement, kb);
  assert.deepEqual(app.errors, []);
});

test("U5: no new key fires in a field, a box, the ⋮ menu, on repeat or with the keys off", () => {
  const app = deadAirApp("sessions");
  // Something to undo, so a Ctrl+Z that fired would show.
  app.$$("[data-clkplus]:not([disabled])")[0].click();
  const keys = [["3", { code: "Digit3" }, "3"], ["n", {}, "N"], ["a", {}, "A"], ["?", { shiftKey: true }, "?"], ["z", { ctrlKey: true }, "Ctrl+Z"]];
  const snap = () => JSON.stringify([tabNow(app), app.$("#modal") ? app.$("#modal").innerHTML : "", auditLen(app), toastText(app), app.$("[aria-current=step]") ? app.$("[aria-current=step]").textContent : ""]);
  const nothing = (target, why, init = {}) => {
    for (const [key, base, name] of keys) {
      const s0 = snap();
      const r = press(app, target, key, Object.assign({}, base, init));
      assert.equal(snap(), s0, `${why}: ${name} acted`);
      assert.equal(r.prevented, false, `${why}: ${name} was cancelled`);
      if (target && target !== app.doc.body) assert.equal(app.doc.activeElement, target, `${why}: ${name} moved focus`);
    }
  };
  // On the running fight's page, so N has something to run.
  openFight(app);
  const btn = app.$("[data-enext]");
  nothing(btn, "repeat", { repeat: true });
  nothing(btn, "composing", { isComposing: true });
  // A field (Ctrl+Z there is the browser's own text undo).
  app.click('[data-tsec="cast"]');
  app.$("[data-copen]").click();
  edit(app);
  const input = app.$("main input[type=text], main input:not([type])"), area = app.$("main textarea"), sel = app.$("main select");
  assert.ok(input && area && sel);
  nothing(input, "an input");
  nothing(area, "a textarea");
  nothing(sel, "a select");
  const ce = app.doc.createElement("div");
  ce.setAttribute("contenteditable", "true");
  ce.tabIndex = 0;
  app.$("main").appendChild(ce);
  nothing(ce, "a contenteditable");
  // A box: Find's own field, and the close button behind it.
  app.click("[data-tfind]");
  nothing(app.$("[data-findq]"), "Find's field");
  nothing(app.$("#modal [data-modalclose]"), "a box over the page");
  pressEsc(app);
  app.click("[data-tjot]");
  nothing(app.$("[data-jottext]"), "Jot's field");
  pressEsc(app);
  // ⋮ open.
  app.click("[data-menu-toggle]");
  assert.equal(app.$("#hdrmenu").hidden, false);
  nothing(app.$("[data-trename]"), "⋮ open, on a menu item");
  nothing(app.doc.body, "⋮ open, on the page");
  app.click("[data-menu-toggle]");
  // The keys off.
  app.window.localStorage.setItem(KEYS, "off");
  openFight(app);
  nothing(app.$("[data-enext]"), "the keys off");
  app.window.localStorage.removeItem(KEYS);
  // And on again, they act: this matrix tests something.
  press(app, app.doc.body, "a");
  assert.ok(modalOpen(app), "the matrix never saw a key act");
  pressEsc(app);
  assert.deepEqual(app.errors, []);
});

test("U5: the tabs, Next and Activity carry their keys while the keys are on", () => {
  const app = deadAirApp("cast");
  for (let i = 0; i < 8; i++) assert.equal(app.$(`#topnav [data-tsec="${SECTIONS[i]}"]`).getAttribute("aria-keyshortcuts"), String(i + 1), SECTIONS[i]);
  assert.equal(app.$("[data-tactivity]").getAttribute("aria-keyshortcuts"), "A");
  openFight(app);
  assert.equal(app.$("[data-enext]").getAttribute("aria-keyshortcuts"), "N");
  app.window.localStorage.setItem(KEYS, "off");
  app.window.eval("keyHints()");
  assert.equal(app.$("#topnav [data-tsec]").hasAttribute("aria-keyshortcuts"), false, "the tabs say their key while off");
  assert.equal(app.$("[data-tactivity]").hasAttribute("aria-keyshortcuts"), false);
  assert.equal(app.$("[data-enext]").hasAttribute("aria-keyshortcuts"), false);
  app.window.localStorage.removeItem(KEYS);
  app.window.eval("keyHints()");
  assert.equal(app.$("[data-enext]").getAttribute("aria-keyshortcuts"), "N");
  // A tab press rebuilds the tabs and they still say it.
  app.click('[data-tsec="notes"]');
  assert.equal(app.$('#topnav [data-tsec="notes"]').getAttribute("aria-keyshortcuts"), "8");
  assert.deepEqual(app.errors, []);
});
