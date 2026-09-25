/**
 * Shadows Character Sheet — the mechanical half of versioning and releasing.
 *
 * CLAUDE.md says *when* each version moves and how a release goes; this does
 * the typing, so nothing is written in five places by hand (audit A6, R4).
 *
 *   npm run bump -- 0.27.0     the app version, everywhere it's written:
 *                              APP_VERSION, package.json, package-lock.json
 *                              (twice), README's and STATE's version lines,
 *                              and CHANGELOG's [Unreleased] heading (renamed,
 *                              or added empty for you to fill). Then
 *                              regenerates What's new.
 *   npm run release:prep       dates the [Unreleased] heading as the release,
 *                              `## vX.Y.Z — <today>` (or --date YYYY-MM-DD),
 *                              and regenerates What's new. Commit, PR, merge.
 *   npm run release:check      what must be true before a tag: one version
 *                              everywhere, a dated CHANGELOG section with
 *                              lines in it, What's new current, the tag free.
 *                              Pass a version to also require it's the app's.
 *                              --tagged: the tag may exist, at this commit.
 *   node tools/release.mjs notes 0.27.0
 *                              prints that CHANGELOG section, for the release body.
 *
 * The release workflow runs check and notes; see .github/workflows/release.yml.
 * The game-data and schema versions aren't here on purpose: each needs a
 * judgement (Decision 68) or a migrate() step, not a find-and-replace.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { ROOT } from "./build.mjs";
import { changelogScript, OUT as CHANGELOG_JS, CUTOFF } from "./changelog.mjs";

const SEMVER = /^\d+\.\d+\.\d+$/;
const read = f => readFileSync(join(ROOT, f), "utf8");
const write = (f, s) => writeFileSync(join(ROOT, f), s);
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Each place the app version is written: how to find it, and how to replace it.
// A pattern that stops matching is an error, not a skip, so a reworded line
// gets noticed here rather than left behind.
const SITES = [
  { file: "src/ui/app.js", re: /(const APP_VERSION = ")([\d.]+)(")/ },
  { file: "package.json", re: /^(\{[^{}]*?"version": ")([\d.]+)(")/ },
  { file: "package-lock.json", re: /^(\{[^{}]*?"version": ")([\d.]+)(")/ },
  { file: "package-lock.json", re: /("packages": \{\s*"": \{[^{}]*?"version": ")([\d.]+)(")/ },
  { file: "README.md", re: /(\*\*Status:\*\* app `)([\d.]+)(`)/ },
  { file: "docs/STATE.md", re: /(\*\*Versions:\*\* app `)([\d.]+)(`)/ },
];

export function versions() {
  return SITES.map(s => {
    const m = s.re.exec(read(s.file));
    if (!m) throw new Error(`${s.file}: can't find the app version (${s.re}) — was the line reworded?`);
    return { file: s.file, version: m[2] };
  });
}

export const appVersion = () => /const APP_VERSION = "([\d.]+)"/.exec(read("src/ui/app.js"))[1];

const UNRELEASED = /^## \[Unreleased\] — app ([\d.]+)[ \t]*$/m;
const released = v => new RegExp(`^## v${escRe(v)} — (\\d{4}-\\d{2}-\\d{2})[ \\t]*$`, "m");

/** The markdown under a version's heading, up to the next heading or the cutoff. */
export function section(md, v) {
  const text = md.replace(/\r\n?/g, "\n");
  const head = new RegExp(`^## (v${escRe(v)}\\b|\\[Unreleased\\] — app ${escRe(v)}\\b).*$`, "m").exec(text);
  if (!head) return null;
  const rest = text.slice(head.index + head[0].length);
  const end = rest.search(new RegExp(`^## |^${escRe(CUTOFF)}`, "m"));
  return (end < 0 ? rest : rest.slice(0, end)).trim();
}

const cmp = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number);
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };

function regenerateChangelog() {
  write(CHANGELOG_JS, changelogScript(read("CHANGELOG.md")));
}

export function bump(next) {
  if (!SEMVER.test(next || "")) throw new Error(`usage: npm run bump -- X.Y.Z (got "${next ?? ""}")`);
  const vs = versions(), cur = appVersion();
  const odd = vs.filter(v => v.version !== cur);
  if (odd.length) throw new Error(`the version sites already disagree — fix by hand first:\n${vs.map(v => `  ${v.file}: ${v.version}`).join("\n")}`);
  if (cmp(next, cur) <= 0) throw new Error(`${next} isn't after the current app version, ${cur}`);
  for (const s of SITES) {
    const text = read(s.file);
    write(s.file, text.replace(s.re, `$1${next}$3`));
  }
  for (const f of ["package.json", "package-lock.json"]) JSON.parse(read(f));   // still JSON
  let log = read("CHANGELOG.md"), note;
  const u = UNRELEASED.exec(log);
  if (u) {
    log = log.replace(UNRELEASED, `## [Unreleased] — app ${next}`);
    note = `renamed CHANGELOG's [Unreleased] heading ${u[1]} → ${next}`;
  } else {
    const first = /^## /m.exec(log);
    if (!first) throw new Error("CHANGELOG.md has no release headings to add one above");
    log = log.slice(0, first.index) + `## [Unreleased] — app ${next}\n\n` + log.slice(first.index);
    note = `added "## [Unreleased] — app ${next}" to CHANGELOG.md — put this change's lines under it`;
  }
  write("CHANGELOG.md", log);
  regenerateChangelog();
  return [`app ${cur} → ${next} in ${[...new Set(SITES.map(s => s.file))].join(", ")}`, note, `regenerated ${CHANGELOG_JS}`];
}

export function prep(date = new Date().toISOString().slice(0, 10)) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`--date wants YYYY-MM-DD, got "${date}"`);
  const v = appVersion(), log = read("CHANGELOG.md"), u = UNRELEASED.exec(log);
  if (!u) throw new Error(released(v).test(log) ? `${v} is already dated in CHANGELOG.md` : "CHANGELOG.md has no [Unreleased] heading");
  if (u[1] !== v) throw new Error(`CHANGELOG's [Unreleased] heading says ${u[1]}, APP_VERSION says ${v} — run \`npm run bump -- ${u[1]}\` or fix the heading`);
  write("CHANGELOG.md", log.replace(UNRELEASED, `## v${v} — ${date}`));
  regenerateChangelog();
  return [`CHANGELOG: "## v${v} — ${date}"`, `regenerated ${CHANGELOG_JS}`];
}

const git = (...args) => spawnSync("git", args, { cwd: ROOT, encoding: "utf8" });

/** Everything that must hold before tagging. Returns a list of problems; empty is good. */
export function check(want, { tagged = false } = {}) {
  const problems = [];
  let v;
  try {
    const vs = versions();
    v = appVersion();
    for (const s of vs) if (s.version !== v) problems.push(`${s.file} says ${s.version}, APP_VERSION says ${v}`);
  } catch (e) { problems.push(e.message); return problems; }
  if (want && want !== v) problems.push(`asked to release ${want}, but APP_VERSION is ${v}`);

  const log = read("CHANGELOG.md");
  if (UNRELEASED.test(log)) problems.push(`CHANGELOG.md still has "${UNRELEASED.exec(log)[0]}" — run \`npm run release:prep\``);
  if (!released(v).test(log)) problems.push(`CHANGELOG.md has no "## v${v} — YYYY-MM-DD" heading`);
  else if (!/^- /m.test(section(log, v) || "")) problems.push(`CHANGELOG.md's v${v} section has no lines in it`);

  let have = "";
  try { have = read(CHANGELOG_JS).replace(/\r\n?/g, "\n"); } catch {}
  let wantJs = null;
  try { wantJs = changelogScript(log); } catch (e) { problems.push(e.message); }
  if (wantJs !== null && have !== wantJs) problems.push(`${CHANGELOG_JS} is stale — run \`npm run changelog\``);

  const tag = `v${v}`;
  const local = git("rev-parse", "-q", "--verify", `refs/tags/${tag}^{commit}`).stdout.trim();
  const remote = git("ls-remote", "--tags", "origin", `refs/tags/${tag}`, `refs/tags/${tag}^{}`);
  if (remote.status !== 0) problems.push(`couldn't ask origin whether ${tag} exists: ${remote.stderr.trim()}`);
  // An annotated tag lists twice; the ^{} line is the commit it points at.
  const refs = Object.fromEntries(remote.stdout.trim().split("\n").filter(Boolean).map(l => l.split(/\s+/).reverse()));
  const onOrigin = refs[`refs/tags/${tag}^{}`] || refs[`refs/tags/${tag}`] || "";
  if (tagged) {
    const head = git("rev-parse", "HEAD").stdout.trim();
    for (const [where, sha] of [["locally", local], ["on origin", onOrigin]])
      if (sha && sha !== head) problems.push(`${tag} ${where} points at ${sha.slice(0, 7)}, not this commit (${head.slice(0, 7)})`);
  } else if (local || onOrigin) {
    problems.push(`${tag} already exists${onOrigin ? " on origin" : " locally"} — a released version is never re-tagged; bump instead`);
  }
  return problems;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, ...args] = process.argv.slice(2);
  const flag = n => { const i = args.indexOf(n); return i < 0 ? undefined : args.splice(i, 2)[1]; };
  try {
    if (cmd === "bump") {
      for (const l of bump(args[0])) console.log(l);
    } else if (cmd === "prep") {
      for (const l of prep(flag("--date"))) console.log(l);
    } else if (cmd === "check") {
      const tagged = args.includes("--tagged");
      const want = args.find(a => a !== "--tagged");
      const problems = check(want, { tagged });
      if (problems.length) {
        console.error(`not ready to release:\n${problems.map(p => `  - ${p}`).join("\n")}`);
        process.exit(1);
      }
      console.log(`ready to release v${appVersion()}`);
    } else if (cmd === "notes") {
      const s = section(read("CHANGELOG.md"), args[0] || appVersion());
      if (!s) throw new Error(`CHANGELOG.md has no section for ${args[0] || appVersion()}`);
      process.stdout.write(s + "\n");
    } else {
      throw new Error("usage: node tools/release.mjs bump X.Y.Z | prep [--date YYYY-MM-DD] | check [X.Y.Z] [--tagged] | notes [X.Y.Z]");
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
