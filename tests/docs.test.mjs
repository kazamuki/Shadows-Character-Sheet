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
const INDEX  = read("docs/INDEX.md");

// One `## ` section of a document, from its heading to the next `## ` or the
// end. The slices used to end at "## 6.", which went when SCHEMA's roadmap
// moved to docs/log/archive.md: a missing end marker made indexOf return -1,
// and slice(a, -1) quietly kept going to the end of the file.
function section(doc, heading) {
  const start = doc.indexOf(heading);
  assert.ok(start >= 0, `no "${heading}" heading — did the document change shape?`);
  const next = doc.indexOf("\n## ", start + heading.length);
  return doc.slice(start, next < 0 ? undefined : next);
}
const LEDGER = section(SCHEMA, "## 4. Locked Decisions");
const FLAGS  = section(SCHEMA, "## 5. Open Flags");

test("STATE.md reports the real number of todo tests", () => {
  // Counted from source rather than by running the suite — this test IS the
  // suite, so it cannot run itself. Only the todo count is stated: a todo is
  // a confirmed defect written as a failing test, which a cold session must
  // know about. The pass total was dropped on Ken's call (AQ2, 2026-09-24):
  // CI reports it, and restating it cost every change a STATE edit.
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
  assert.ok(total > 100, `found only ${total} tests — did the test() format change?`);
  // The parser's own sanity check: if the sentinel appears anywhere in the test
  // sources but the counter found none, the counter is broken rather than the
  // suite being clean. THIS file is excluded from that scan, because the
  // assertion message below contains the sentinel itself — with it included the
  // check could never pass at zero todos, which is exactly the state Batch 3
  // reached. A guard that cannot express "all clear" is not a guard.
  const others = files.filter(f => f !== "docs.test.mjs").map(f => read(join("tests", f))).join("");
  assert.ok(todo > 0 || !/\{\s*todo:/.test(others),
    "a todo option exists in the tests but the counter found none — the parser is broken");

  const m = /\*\*Suite:\*\* `npm run verify` passes · \*\*(\d+) todo\*\*/.exec(STATE);
  assert.ok(m, "STATE.md's suite line is missing or reworded — keep the format so this can check it");
  assert.equal(Number(m[1]), todo, "STATE.md's todo count is stale");
  assert.doesNotMatch(STATE, /\d+ passing/, "STATE.md is restating the pass count again — CI reports it (AQ2)");
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

test("every flag in the data names an F-number that is open in SCHEMA §5", () => {
  // Two ways a flag goes untracked. F10's table row was struck through while
  // `skillsFlags.flagged` stayed true, so the app kept rendering it. And seven
  // flags never had a number at all, so nothing asked their questions: four
  // weapon tags said "confirm with Deighton" in no list Deighton sees (audit
  // A7). A flag is `flagged: true` plus a flagNote that names every F it waits
  // on, and each of those must be open. Closing a flag is its three edits.
  const openRows = [...FLAGS.matchAll(/^\| (F\d+) \|/gm)].map(m => m[1]);
  assert.ok(openRows.length > 5, `parsed only ${openRows.length} open-flag rows — did §5's table change?`);
  const open = new Set(openRows);

  const problems = [];
  (function walk(o, path) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) return o.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (o.flagged === true) {
      const where = o.id ? `${path} (${o.id})` : path;
      const named = [...String(o.flagNote || "").matchAll(/\bF(\d+)\b/g)].map(m => `F${m[1]}`);
      if (!named.length) problems.push(`${where} is flagged but its flagNote names no F-number`);
      for (const f of named) {
        if (!open.has(f)) problems.push(`${where} names ${f}, which is not open in SCHEMA §5`);
      }
    }
    for (const k of Object.keys(o)) walk(o[k], path ? `${path}.${k}` : k);
  })(D, "");
  assert.deepEqual(problems, []);
});

test("the app version agrees across app.js, package.json and STATE.md", () => {
  // The point of the app version is that Ken and Claude can confirm they are
  // looking at the same build. Three places state it, so all three must agree
  // or it is worse than having none — the footer would be quietly lying.
  const inApp = /const APP_VERSION = "([\d.]+)"/.exec(read("src/ui/app.js"));
  assert.ok(inApp, "APP_VERSION is missing from src/ui/app.js");

  const inPkg = JSON.parse(read("package.json")).version;
  assert.equal(inPkg, inApp[1], "package.json and APP_VERSION disagree");

  // Batch 3 found the lockfile a full version behind (0.4.0 while the app said
  // 0.5.0) because nothing here looked at it, and `npm install` rewrites it
  // from package.json — so the drift only surfaces as a stray diff in someone
  // else's commit. Both places it states the version are checked.
  const lock = JSON.parse(read("package-lock.json"));
  assert.equal(lock.version, inApp[1], "package-lock.json and APP_VERSION disagree");
  assert.equal(lock.packages[""].version, inApp[1],
    "package-lock.json's root package entry and APP_VERSION disagree");

  const inState = /\*\*Versions:\*\* app `([\d.]+)`/.exec(STATE);
  assert.ok(inState, "STATE.md's Versions line is missing or reworded");
  assert.equal(inState[1], inApp[1], "STATE.md and APP_VERSION disagree");

  // The footer is what Ken actually reads, so prove it renders the constant
  // rather than a literal that could drift on its own.
  assert.match(read("src/ui/app.js"), /app <b>\$\{esc\(APP_VERSION\)\}<\/b>/,
    "the footer is not rendering APP_VERSION");
});

test("the game-data and character-schema versions agree with the docs", () => {
  // These two used to share the name `meta.schemaVersion` and mean different
  // things (Decision 75). Pin both so the rename cannot silently regress.
  const m = /game data `([\d.]+)` · character schema `([\d.]+)`/.exec(STATE);
  assert.ok(m, "STATE.md's Versions line lost its data/schema numbers");
  assert.equal(D.meta.gamedataVersion, m[1], "STATE.md's game data version is stale");
  assert.equal(D.meta.schemaVersion, undefined,
    "the data file is back to calling its version `schemaVersion` — that name means the CHARACTER schema");

  const { Engine } = loadEngine();
  assert.equal(Engine.newCharacter().meta.schemaVersion, m[2],
    "STATE.md's character schema version is stale");

  // README.md is the first thing anyone outside the project reads, and it had
  // been claiming game data 0.2 since the CRB v4 pass took it to 0.3 — nothing
  // was checking it. All three numbers now come from the same source of truth.
  const readme = read("README.md");
  const r = /\*\*Status:\*\* app `([\d.]+)` · character schema `([\d.]+)` · game data `([\d.]+)`/.exec(readme);
  assert.ok(r, "README.md's Status line is missing or reworded — keep the format so this can check it");
  const app = /const APP_VERSION = "([\d.]+)"/.exec(read("src/ui/app.js"))[1];
  assert.equal(r[1], app, "README.md's app version is stale");
  assert.equal(r[2], m[2], "README.md's character schema version is stale");
  assert.equal(r[3], m[1], "README.md's game data version is stale");

  // CHANGELOG.md sat at "[Unreleased] — app 0.7.0" through eight releases
  // because nothing read it (W18). The current version needs a heading: the
  // unreleased one while it's in flight, the tag's once it ships.
  const log = read("CHANGELOG.md");
  const esc = app.replace(/\./g, "\\.");
  assert.match(log, new RegExp(`^## (\\[Unreleased\\] — app ${esc}|v${esc})\\b`, "m"),
    `CHANGELOG.md has no section for app ${app} — add its lines under "## [Unreleased] — app ${app}"`);
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

test("INDEX.md lists every decision and every open flag, exactly once", () => {
  // An index nobody maintains is worse than no index — it sends the next
  // session to the wrong place with confidence. So it is generated from the
  // ledger and checked against it: add a decision without indexing it, or close
  // a flag without removing its row, and the build fails.
  const ledger = [...LEDGER.matchAll(/^(\d{1,3})\. /gm)].map(m => Number(m[1]));
  assert.ok(ledger.length > 50, `parsed only ${ledger.length} decisions — did §4's format change?`);

  const topics = INDEX.slice(INDEX.indexOf("## 3. Decisions by topic"));
  const listed = [...topics.matchAll(/^- \*\*(\d{1,3})\*\*/gm)].map(m => Number(m[1]));

  const dupes = listed.filter((n, i) => listed.indexOf(n) !== i);
  assert.deepEqual([...new Set(dupes)], [], "INDEX.md lists a decision under more than one topic");

  const set = new Set(listed);
  const unindexed = ledger.filter(n => !set.has(n));
  assert.deepEqual(unindexed, [],
    "decisions exist in SCHEMA §4 with no row in INDEX.md §3 — add them to the topic list");

  const phantom = listed.filter(n => !ledger.includes(n));
  assert.deepEqual(phantom, [], "INDEX.md lists a decision number that SCHEMA §4 does not have");

  // Every flag still open in §5 needs a row in the id registry, and nothing else.
  const open = [...new Set([...FLAGS.matchAll(/^\| (F\d+) \|/gm)].map(m => m[1]))];
  const registry = INDEX.slice(INDEX.indexOf("### Open flags"), INDEX.indexOf("## 3."));
  const indexed = [...new Set([...registry.matchAll(/^\| `(F\d+)` \|/gm)].map(m => m[1]))];
  assert.deepEqual(open.filter(f => !indexed.includes(f)), [],
    "an open flag in SCHEMA §5 has no row in INDEX.md §2");
  assert.deepEqual(indexed.filter(f => !open.includes(f)), [],
    "INDEX.md lists a flag that SCHEMA §5 no longer carries — closing a flag is now three edits");
});


test("a superseded decision says so in SCHEMA and in INDEX, the same way", () => {
  // Decision 18's INDEX line said "+1 per point above 10" for weeks after
  // Decision 98 replaced it: the ledger noted it inline, the index line looked
  // current. A decision that a later one replaces carries a marker in the
  // ledger -- `→ **Superseded [in part] by Decision N**` -- and the same claim
  // in INDEX -- `→ **superseded [in part] by N**` -- struck through when whole.
  // Decision 102.
  const nums = t => (t.match(/\d+/g) || []).map(Number).sort((a, b) => a - b);
  const sec = LEDGER;
  const ledger = new Map();
  for (const part of sec.split(/\n(?=\d{1,3}\. )/)) {
    const n = part.match(/^(\d{1,3})\. /);
    const m = n && part.match(/→ \*\*Superseded (in part )?by Decisions? ([\d, and]+?)\*\*/);
    if (m) ledger.set(Number(n[1]), { part: !!m[1], by: nums(m[2]) });
  }
  assert.ok(ledger.size >= 7, `found only ${ledger.size} superseded decisions — did the marker's format change?`);

  const topics = INDEX.slice(INDEX.indexOf("## 3. Decisions by topic"));
  const index = new Map(), lines = new Map();
  for (const line of topics.split("\n")) {
    const n = line.match(/^- \*\*(\d{1,3})\*\*/);
    const m = n && line.match(/→ \*\*superseded (in part )?by ([\d, and]+?)\*\*/);
    if (m) { index.set(Number(n[1]), { part: !!m[1], by: nums(m[2]) }); lines.set(Number(n[1]), line); }
  }

  const all = new Set([...sec.matchAll(/^(\d{1,3})\. /gm)].map(m => Number(m[1])));
  for (const [n, s] of ledger) {
    for (const b of s.by) assert.ok(all.has(b) && b > n, `Decision ${n} is superseded by ${b}, which is not a later decision`);
    assert.deepEqual(index.get(n), s, `Decision ${n}'s supersession in SCHEMA §4 and its INDEX line disagree`);
    if (!s.part) assert.match(lines.get(n), /~~.+~~/, `Decision ${n} is wholly superseded — strike its INDEX line through`);
  }
  assert.deepEqual([...index.keys()].filter(n => !ledger.has(n)), [],
    "INDEX marks a decision superseded that SCHEMA §4 does not");

  // The load-bearing table points at decisions by number; a wholly superseded
  // one does not belong there.
  const load = INDEX.slice(INDEX.indexOf("**Load-bearing.**"), INDEX.indexOf("### Rules the app enforces"));
  const cited = [...load.matchAll(/^\| (\d{1,3}) \|/gm)].map(m => Number(m[1]));
  assert.ok(cited.length > 5, "the load-bearing table is missing or changed shape");
  for (const n of cited) {
    assert.ok(all.has(n), `the load-bearing table cites Decision ${n}, which SCHEMA §4 does not have`);
    assert.ok(!(ledger.has(n) && !ledger.get(n).part), `the load-bearing table cites Decision ${n}, which is wholly superseded`);
  }
});

test("a decision from 124 on is a short record, and a load-bearing one says what it rejected", () => {
  // Decisions 99 and 100 ran past a hundred lines each: build detail, test
  // names and review notes buried the choice, and a settled question got
  // reopened because nobody could see what had already been turned down (audit
  // A5; plan §6; Decision 130). From 124 on an entry is the decision in bold,
  // an italic *date · who · Touches: …* line, and six fields in order, about
  // 25 wrapped lines at most. Older entries are history and exempt, except the
  // load-bearing ones INDEX §3 names, which were backfilled with what they
  // rejected and when to reopen them, because those are the ones worth
  // reopening by mistake.
  const FIELDS = ["Decided", "Why", "Rejected", "Replaces", "Revisit if", "Built"];
  const entries = new Map();
  for (const part of LEDGER.split(/\n(?=\d{1,3}\. )/)) {
    const n = /^(\d{1,3})\. /.exec(part);
    if (n) entries.set(Number(n[1]), part.trimEnd());
  }
  const bad = [];
  let checked = 0;
  for (const [n, text] of entries) {
    if (n < 124) continue;
    checked++;
    const [first, second = ""] = text.split("\n");
    if (!/^\d{1,3}\. \*\*[^*].*\*\*$/.test(first)) bad.push(`${n}: line 1 should be the decision alone, in bold`);
    if (!/^\s+\*\d{4}-\d{2}-\d{2} · .+ · Touches: .+\*$/.test(second)) bad.push(`${n}: line 2 should be *YYYY-MM-DD · who · Touches: …*`);
    const got = [...text.matchAll(/^\s+- \*\*([A-Za-z ]+):\*\*/gm)].map(m => m[1]);
    if (got.join("|") !== FIELDS.join("|")) bad.push(`${n}: has ${got.join(", ") || "no fields"}; needs ${FIELDS.join(", ")}, in that order`);
    const words = text.split(/\s+/).length;
    if (words > 350) bad.push(`${n}: ${words} words; a decision is a short record, and build detail goes to log/ or the PR`);
  }
  assert.ok(checked >= 6, `checked only ${checked} decisions from 124 on — did §4's format change?`);

  const load = INDEX.slice(INDEX.indexOf("**Load-bearing.**"), INDEX.indexOf("### Rules the app enforces"));
  for (const [, num] of load.matchAll(/^\| (\d{1,3}) \|/gm)) {
    const text = entries.get(Number(num)) || "";
    for (const f of ["Rejected", "Revisit if"]) {
      if (!new RegExp(`^\\s+- \\*\\*${f}:\\*\\* \\S`, "m").test(text)) bad.push(`${num} is load-bearing but has no ${f} line`);
    }
  }
  assert.deepEqual(bad, []);
});

test("the in-app release notes are generated from the current CHANGELOG.md (Decision 123)", async () => {
  // The app can't read CHANGELOG.md from file://, so What's new reads a
  // generated copy. An edit to the markdown without `npm run changelog`
  // would leave players reading last release's notes.
  const { changelogScript } = await import("../tools/changelog.mjs");
  const want = changelogScript(read("CHANGELOG.md"));
  const have = read("src/data/shadows-changelog.js").replace(/\r\n?/g, "\n");
  assert.equal(have, want, "src/data/shadows-changelog.js is stale — run `npm run changelog` and commit it");

  // And the current version is in them, released or not.
  const app = /const APP_VERSION = "([\d.]+)"/.exec(read("src/ui/app.js"))[1];
  assert.match(want, new RegExp(`"version": "${app.replace(/\./g, "\.")}"`),
    `What's new has no section for app ${app}`);
});
