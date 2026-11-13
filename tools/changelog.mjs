/**
 * Shadows Character Sheet — changelog → in-app data.
 *
 * CHANGELOG.md is the one place release notes are written. The app can't read
 * it at run time (it runs from file://, where a fetch of a sibling file is
 * blocked), so this turns it into a classic data script the shell loads like
 * any other: src/data/shadows-changelog.js, which sets
 * window.SHADOWS_CHANGELOG. The generated file is committed, and
 * tests/docs.test.mjs fails if it's older than the markdown (Decision 123).
 *
 * Only the sections above the CUTOFF comment reach the app. Everything below
 * it was written for developers, not players, and stays in the repo.
 *
 * Usage:  node tools/changelog.mjs           → rewrite src/data/shadows-changelog.js
 *         node tools/changelog.mjs --check   → exit 1 if it's stale, write nothing
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "./build.mjs";

export const CUTOFF = "<!-- in-app changelog ends here -->";
export const OUT = "src/data/shadows-changelog.js";

const HEAD_RE = /^## (?:v([\d.]+)(?:\s+—\s+(\d{4}-\d{2}-\d{2}))?|\[Unreleased\]\s+—\s+app\s+([\d.]+))\s*$/;

/**
 * The player-facing sections, newest first:
 *   [{ version: "0.22.0", date: "2026-09-24" | null, intro: [para…], items: [bullet…],
 *      groups?: [{ title: "GM mode", items: [bullet…] }] }]
 * A `### Title` line inside a release starts a group: the bullets after it are
 * that group's, so a release can keep the sheet's lines apart from GM mode's.
 * `items` holds the bullets before the first group. `groups` is written only
 * when a release has one, so older sections generate as they always did.
 * Text keeps its **bold**, *emphasis* and `code` marks; the app renders them.
 * A heading or a line the parser doesn't recognise throws, so a new shape in
 * the markdown gets looked at rather than silently dropped.
 */
export function parseChangelog(md) {
  const text = md.replace(/\r\n?/g, "\n");
  const cut = text.indexOf(CUTOFF);
  if (cut < 0) throw new Error(`CHANGELOG.md has no "${CUTOFF}" line — it marks where the in-app notes stop`);
  const lines = text.slice(0, cut).split("\n");

  const releases = [];
  let rel = null, block = null, group = null;   // block: { kind: "intro" | "item", lines: [] }
  const flush = () => {
    if (block && rel) (block.kind === "item" ? (group ? group.items : rel.items) : rel.intro).push(block.lines.join(" "));
    block = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flush();
      const m = HEAD_RE.exec(line);
      if (!m) throw new Error(`CHANGELOG.md: unrecognised release heading "${line}"`);
      rel = { version: m[1] || m[3], date: m[2] || null, intro: [], items: [] };
      group = null;
      releases.push(rel);
      continue;
    }
    if (rel && line.startsWith("### ")) {
      flush();
      const title = line.slice(4).trim();
      if (!title) throw new Error(`CHANGELOG.md: an empty group heading inside ${rel.version}`);
      group = { title, items: [] };
      (rel.groups ||= []).push(group);
      continue;
    }
    if (!rel) continue;                  // the file's own preamble
    if (line === "") { flush(); continue; }
    if (line.startsWith("- ")) { flush(); block = { kind: "item", lines: [line.slice(2).trim()] }; continue; }
    if (line.startsWith("#")) throw new Error(`CHANGELOG.md: a sub-heading inside ${rel.version} ("${line}") has no in-app rendering`);
    if (block) block.lines.push(line.trim());
    else if (group) throw new Error(`CHANGELOG.md: a paragraph under "${group.title}" in ${rel.version}; a group holds bullets only`);
    else block = { kind: "intro", lines: [line.trim()] };
  }
  flush();
  for (const r of releases) for (const g of r.groups || [])
    if (!g.items.length) throw new Error(`CHANGELOG.md: "${g.title}" in ${r.version} has no bullets`);
  if (!releases.length) throw new Error("CHANGELOG.md: no release sections above the cutoff");
  return releases;
}

export function changelogScript(md) {
  const releases = parseChangelog(md);
  return `// GENERATED from CHANGELOG.md by tools/changelog.mjs — edit the markdown, then
// run \`npm run changelog\`. tests/docs.test.mjs fails if this falls behind.
window.SHADOWS_CHANGELOG = ${JSON.stringify(releases, null, 2)};
`;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const want = changelogScript(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8"));
  if (process.argv.includes("--check")) {
    let have = "";
    try { have = readFileSync(join(ROOT, OUT), "utf8").replace(/\r\n?/g, "\n"); } catch (e) {}
    if (have !== want) { console.error(`${OUT} is stale — run \`npm run changelog\``); process.exit(1); }
    console.log(`${OUT} is current`);
  } else {
    writeFileSync(join(ROOT, OUT), want);
    console.log(`wrote ${OUT}`);
  }
}
