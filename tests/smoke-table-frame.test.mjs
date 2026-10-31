/**
 * End-to-end smoke test in jsdom, run against the built single-file artifact.
 *
 * This file: a GM table's frame (Decision 258): the class that gives it its own layout, the bar each page's Back sits in,
 * and a member's status. jsdom has no layout, so the geometry (the measures, the sheet's width, the pinned stat
 * block) is held by `npm run phone-check` against `tools/frame-fixture.json`; what's here is the structure that
 * geometry hangs on.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { boot } from "./harness.mjs";
import { GM_ON, lockedCharacter, runTable, tableHome, tableCard } from "./smokekit.mjs";

const cls = app => [...app.$("#app").classList].filter(c => c === "table-mode" || c === "sheet-mode").sort().join(" ");

test("258: a table's frame is table-mode, and Home, the wizard and the sheet aren't", () => {
  const app = boot({ storage: { ...GM_ON, "shadows.active.v1": { ch: lockedCharacter(), section: "main" } } });
  assert.equal(cls(app), "", "Home has neither class");
  runTable(app, "Frame", { stay: true });
  assert.equal(cls(app), "table-mode", "a table is table-mode, and not the sheet's");
  tableHome(app);
  assert.equal(cls(app), "", "Home after a table has neither class");
  app.click("[data-open]");
  assert.equal(cls(app), "sheet-mode", "a character's sheet is sheet-mode only");
  app.click("[data-menu-toggle]"); app.click("[data-home]");
  app.click("#btn-new");
  assert.equal(cls(app), "", "the wizard has neither class");
  app.click("header [data-home]");
  tableCard(app, "Frame").querySelector("[data-topen]").click();
  assert.equal(cls(app), "table-mode", "a table opened from Home is table-mode again");
});
