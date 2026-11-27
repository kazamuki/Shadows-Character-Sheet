// Which tests to run, and where (Decision 321). NOT part of the shipped app: a classic Node script, no dependency.
//
//   node tools/test-run.mjs area <sheet|table|wizard> [--list]
//       the fast four plus that area's files; runs them, or with --list only prints them
//   node tools/test-run.mjs shard <i>/<n>
//       prints the files for job i of n (1-based), slowest first, dealt to the lightest job (CI pipes this to `node --test`)
//   node tools/test-run.mjs list
//       prints every test file with its area and its shard (of 4)
//   node tools/test-run.mjs docs-only <path>...
//       exit 0 if every path is a docs path (ZQ1), 1 if not. No paths, or the empty string, is 1: an empty diff runs everything
//   node tools/test-run.mjs time
//       runs each file alone and rewrites tests/timings.json (seconds, one decimal, sorted by name)
//
// Deterministic: ties break by file name. A file missing from tests/timings.json weighs UNTIMED seconds.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TESTS = join(ROOT, "tests");
const TIMINGS = join(TESTS, "timings.json");

export const UNTIMED = 60;
export const SHARDS = 4;

// The inner loop's four: engine, rules, docs and build (npm run test:fast).
export const FAST = ["engine.test.mjs", "rules.test.mjs", "docs.test.mjs", "build.test.mjs"];

// An area is the fast four plus the files its patterns match. A pattern ending in `*` is a prefix; any other is the whole name.
export const AREAS = {
  sheet: ["smoke-sheet-*", "tagbars"],
  table: ["smoke-table-*", "sample-table", "codexpack"],
  wizard: ["smoke-wizard*", "smoke-roster", "smoke-readout"],
};
// Files in no area: they run in the whole suite and in CI, never in an area run.
export const WHOLE_ONLY = ["hostile", "voice"];

const stem = f => f.replace(/\.test\.mjs$/, "");
const matches = (pattern, file) => pattern.endsWith("*") ? stem(file).startsWith(pattern.slice(0, -1)) : stem(file) === pattern;

export const testFiles = () => readdirSync(TESTS).filter(f => f.endsWith(".test.mjs")).sort();
export const loadTimings = () => JSON.parse(readFileSync(TIMINGS, "utf8"));

export function areaFiles(name, files = testFiles()) {
  if (!AREAS[name]) throw new Error(`no area "${name}" (${Object.keys(AREAS).join(", ")})`);
  const own = files.filter(f => AREAS[name].some(p => matches(p, f)) && !FAST.includes(f));
  return [...FAST.filter(f => files.includes(f)), ...own];
}

export const areasOf = (file, files) => Object.keys(AREAS).filter(a => areaFiles(a, files).includes(file));

// Deal the files slowest first, each to the lightest job so far; ties by name, then by job number.
export function shards(n = SHARDS, files = testFiles(), timings = loadTimings()) {
  const weight = f => timings[f] === undefined ? UNTIMED : timings[f];
  const order = [...files].sort((a, b) => weight(b) - weight(a) || (a < b ? -1 : a > b ? 1 : 0));
  const jobs = Array.from({ length: n }, () => ({ files: [], seconds: 0 }));
  for (const f of order) {
    const job = jobs.reduce((lo, j) => j.seconds < lo.seconds ? j : lo);
    job.files.push(f);
    job.seconds += weight(f);
  }
  return jobs;
}

// ZQ1: a docs path is anything under docs/, or a .md file anywhere, except what a test reads as code:
// CHANGELOG.md (three tests read it, and it regenerates a src/ file) and docs/plans/crb-catch-up.md (rules.test.mjs reads it).
const CODE_DOCS = ["CHANGELOG.md", "docs/plans/crb-catch-up.md"];
export function isDocsOnly(paths) {
  const list = (paths || []).map(p => String(p).trim().replace(/\\/g, "/")).filter(Boolean);
  if (!list.length) return false;
  return list.every(p => !CODE_DOCS.includes(p) && (p.startsWith("docs/") || p.endsWith(".md")));
}

const rel = f => `tests/${f}`;

function run(files) {
  const r = spawnSync(process.execPath, ["--test", ...files.map(rel)], { cwd: ROOT, stdio: "inherit" });
  return r.status === null ? 1 : r.status;
}

function timeAll() {
  const out = {};
  for (const f of testFiles()) {
    const t0 = process.hrtime.bigint();
    const r = spawnSync(process.execPath, ["--test", rel(f)], { cwd: ROOT, stdio: "ignore" });
    const s = Number(process.hrtime.bigint() - t0) / 1e9;
    out[f] = Math.round(s * 10) / 10;
    console.log(`${s.toFixed(1).padStart(7)}  ${f}${r.status ? "  FAILED" : ""}`);
    if (r.status) { console.error(`${f} failed; timings.json not written`); return 1; }
  }
  writeFileSync(TIMINGS, JSON.stringify(out, null, 2) + "\n");
  console.log(`total ${Object.values(out).reduce((a, b) => a + b, 0).toFixed(1)}s -> tests/timings.json`);
  return 0;
}

function main(argv) {
  const [cmd, ...rest] = argv;
  if (cmd === "area") {
    const files = areaFiles(rest[0]);
    if (rest.includes("--list")) { console.log(files.map(rel).join("\n")); return 0; }
    return run(files);
  }
  if (cmd === "shard") {
    const m = /^(\d+)\/(\d+)$/.exec(rest[0] || "");
    const i = m && Number(m[1]), n = m && Number(m[2]);
    if (!m || i < 1 || i > n) { console.error("usage: shard <i>/<n>, with 1 <= i <= n"); return 2; }
    console.log(shards(n)[i - 1].files.map(rel).join("\n"));
    return 0;
  }
  if (cmd === "list") {
    const files = testFiles(), jobs = shards();
    for (const f of files) {
      const areas = FAST.includes(f) ? ["fast"] : areasOf(f, files);
      console.log(`${f.padEnd(40)} ${(areas.join(",") || (WHOLE_ONLY.includes(stem(f)) ? "whole suite only" : "NO AREA")).padEnd(18)} shard ${jobs.findIndex(j => j.files.includes(f)) + 1}/${SHARDS}`);
    }
    return 0;
  }
  if (cmd === "docs-only") return isDocsOnly(rest) ? 0 : 1;
  if (cmd === "time") return timeAll();
  console.error("usage: test-run.mjs area <sheet|table|wizard> [--list] | shard <i>/<n> | list | docs-only <path>... | time");
  return 2;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exit(main(process.argv.slice(2)));
