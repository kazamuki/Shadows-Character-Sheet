/**
 * Documentation consistency.
 *
 * Every volatile fact in the docs has drifted at least once, and the file a
 * cold session reads FIRST was the worst offender: `CLAUDE.md` told three
 * sessions the suite was "20 passing, 2 todo" when it was 51/1, and that the
 * decision ledger was "at 54" when it was at 73. Separately, F10 was recorded
 * as closed in the docs on 2026-08-29 while `flagged: true` stayed in the data
 * — so players kept seeing a Design flag for finished work for four days.
 *
 * Docs that lie to the next session are a defect, not untidiness. This file
 * makes them fail the build (Decision 74).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadEngine } from "./harness.mjs";
import { ROOT } from "../tools/build.mjs";

const { D } = loadEngine();
const read = p => readFileSync(join(ROOT, p), "utf8");
const STATE = read("docs/STATE.md");
const SCHEMA = read("docs/SCHEMA.md");
const CLAUDE = read("CLAUDE.md");

test("STATE.md reports the real suite result", () => {
  // Counted from source rather than by running the suite — this test IS the
  // suite, so it cannot run itself.
  //
  // Match from `test(` to the callback's arrow, because a { todo: } option
  // object is the SECOND argument and is routinely written on its own line.
  // The first version of this only looked at the `test(` line, missed the one
  // real todo, and agreed with an updater script that had the identical bug —
  // which is exactly how a guard ends up validating its own blind spot.
  const files = readdirSync(join(ROOT, "tests")).filter(f => f.endsWith(".test.mjs"));
  let total = 0, todo = 0;
  for (const f of files) {
    for (const [, head] of read(join("tests", f)).matchAll(/^test\(([\s\S]*?)=>\s*\{/gm)) {
      total++;
      if (/\{\s*todo:/.test(head)) todo++;
    }
  }
  assert.ok(todo > 0 || !/\{\s*todo:/.test(files.map(f => read(join("tests", f))).join("")),
    "a { todo: } exists in the tests but the counter found none — the parser is broken");
  const passing = total - todo;

  const m = /\*\*(\d+) passing, (\d+) todo, (\d+) failing\*\* \((\d+) tests, (\w+) files\)/.exec(STATE);
  assert.ok(m, "STATE.md's suite line is missing or reworded — keep the format so this can check it");
  assert.equal(Number(m[1]), passing, "STATE.md's passing count is stale");
  assert.equal(Number(m[2]), todo,    "STATE.md's todo count is stale");
  assert.equal(Number(m[3]), 0,       "STATE.md claims failing tests");
  assert.equal(Number(m[4]), total,   "STATE.md's total test count is stale");

  const words = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8 };
  assert.equal(words[m[5]], files.length, "STATE.md's test-file count is stale");
});

test("the decision ledger's numbering is unbroken and nothing restates its count", () => {
  const nums = [...SCHEMA.matchAll(/^(\d{1,3})\. \*\*/gm)].map(m => Number(m[1]));
  assert.ok(nums.length > 50, `only found ${nums.length} decisions — did §4's format change?`);
  for (let i = 1; i < nums.length; i++) {
    assert.equal(nums[i], nums[i - 1] + 1,
      `decision numbering jumps: ${nums[i - 1]} → ${nums[i]}`);
  }
  // CLAUDE.md used to say "§4 is the ledger; it's at 54" and went stale twice.
  // The count belongs in exactly one place: the ledger itself.
  assert.doesNotMatch(CLAUDE, /§4 is (?:the ledger; it's )?at \d+|at \d+ decisions/,
    "CLAUDE.md is restating the decision count — that number drifts, leave it in SCHEMA §4");
  assert.doesNotMatch(CLAUDE, /\d+ passing|\d+ todo/,
    "CLAUDE.md is restating the suite result — that number drifts, leave it in STATE.md");
});

test("closing a flag is two edits: the SCHEMA table AND the data", () => {
  // F10's table row was struck through while `skillsFlags.flagged` stayed true,
  // so the app kept rendering it. Whichever half you did, this catches the other.
  const section = SCHEMA.slice(SCHEMA.indexOf("## 5. Open Flags"), SCHEMA.indexOf("## 6."));
  const openRows = [...section.matchAll(/^\| (F\d+) \|/gm)].map(m => m[1]);
  assert.ok(openRows.length > 5, `parsed only ${openRows.length} open-flag rows — did §5's table change?`);
  const open = new Set(openRows);

  // F-numbers the data still carries a live `flagged: true` for.
  const live = new Map();
  (function walk(o, path) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) return o.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (o.flagged === true && typeof o.flagNote === "string") {
      const m = /\b(F\d+)\b/.exec(o.flagNote);
      if (m) live.set(m[1], o.id || path);
    }
    for (const k of Object.keys(o)) walk(o[k], path ? `${path}.${k}` : k);
  })(D, "");

  const stale = [...live].filter(([f]) => !open.has(f))
    .map(([f, where]) => `${f} is closed in SCHEMA §5 but "${where}" still has flagged:true`);
  assert.deepEqual(stale, []);
});

test("every document CLAUDE.md points at exists", () => {
  const refs = [...CLAUDE.matchAll(/`(docs\/[\w./-]+\.md|docs\/[\w-]+\/)`/g)].map(m => m[1]);
  assert.ok(refs.length > 4, `only found ${refs.length} doc references — did CLAUDE.md change shape?`);
  const missing = [...new Set(refs)].filter(r => !existsSync(join(ROOT, r)));
  assert.deepEqual(missing, []);
});

test("STATE.md is short enough that a cold session actually reads it", () => {
  // The whole reason HANDOFF.md was retired: it grew to 411 lines, 60% of it
  // append-only log, and the part you needed sat below the fold. STATE.md is
  // rewritten rather than appended, so it has no reason to grow. If this fails,
  // something belongs in log/ or SCHEMA.md instead.
  const lines = STATE.split("\n").length;
  assert.ok(lines < 200, `STATE.md is ${lines} lines — move history to docs/log/, reference to SCHEMA.md`);
});
