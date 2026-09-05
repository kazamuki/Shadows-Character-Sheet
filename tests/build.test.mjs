/**
 * Build & architecture guards.
 *
 * These protect the two constraints that are easy to break by accident and
 * expensive to discover at the table:
 *   1. The app must run from `file://` with no server and no build step.
 *   2. `index.html` must stay a shell — content lives in src/.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { buildHtml, ROOT } from "../tools/build.mjs";

const BROWSER_JS = [
  "src/engine/engine.js",
  "src/ui/shared.js",
  "src/ui/wizard.js",
  "src/ui/sheet.js",
  "src/ui/app.js",
  "src/data/shadows-data.js",
  "src/data/shadows-icons.js",
];

test("browser sources are classic scripts, not ES modules", () => {
  // ES modules are blocked by CORS on file:// — `import`/`export` here would
  // break the double-click-to-open workflow the whole architecture rests on.
  for (const f of BROWSER_JS) {
    const src = readFileSync(join(ROOT, f), "utf8");
    assert.doesNotMatch(src, /^\s*import\s.+from\s/m, `${f} uses ES import`);
    assert.doesNotMatch(src, /^\s*export\s/m, `${f} uses ES export`);
  }
});

test("index.html is a shell, not the app", () => {
  const shell = readFileSync(join(ROOT, "index.html"), "utf8");
  assert.doesNotMatch(shell, /<style>/i, "styles belong in src/styles/");
  assert.doesNotMatch(shell, /<script(?![^>]*\bsrc=)/i, "scripts belong in src/");
  assert.ok(shell.length < 4000, "index.html grew past shell size");
});

test("every local asset is inlined by the build", () => {
  const html = buildHtml();
  // Strip inlined bodies first — source comments legitimately mention <script src>.
  const markup = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "<script></script>")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "<style></style>");
  assert.doesNotMatch(markup, /<(script|link)[^>]*(src|href)=["'](?!https?:)/i);
  assert.match(html, /window\.SHADOWS_DATA/);
  assert.match(html, /window\.SHADOWS_ICONS/);
  assert.match(html, /\/\*ENGINE-START\*\//);
  assert.match(html, /\/\*UI-START\*\//);
});

test("script order in the shell is data → icons → engine → ui", () => {
  const shell = readFileSync(join(ROOT, "index.html"), "utf8");
  const order = [...shell.matchAll(/<script[^>]*src=["']([^"']+)["']/g)].map(m => m[1]);
  assert.deepEqual(order, [
    "src/data/shadows-data.js",
    "src/data/shadows-icons.js",
    "src/engine/engine.js",
    "src/ui/shared.js",
    "src/ui/wizard.js",
    "src/ui/sheet.js",
    "src/ui/app.js",
  ]);
});

test("no stray build artifacts committed under src/", () => {
  const stray = readdirSync(join(ROOT, "src")).filter(f => f.endsWith(".html"));
  assert.deepEqual(stray, []);
});

// The rest of this file imports buildHtml() directly, so it kept passing while
// the CLI itself was dead: the run-as-CLI guard compared import.meta.url against
// `file://${process.argv[1]}`, which never matched, so `npm run build` and
// `npm run check` exited 0 having done nothing. Nothing was written to dist/,
// nothing was checked, and the release workflow's upload step would have failed
// on a missing file. These two spawn the CLI the way npm does.
test("`node tools/build.mjs --check` actually runs and reports", () => {
  const r = spawnSync(process.execPath, ["tools/build.mjs", "--check"],
    { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /build ok/,
    "CLI produced no output — the run-as-CLI guard did not fire");
});

test("`node tools/build.mjs` writes the shippable single file", () => {
  const out = join(ROOT, "dist", "shadows-character-sheet.html");
  rmSync(out, { force: true });
  const r = spawnSync(process.execPath, ["tools/build.mjs"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(out), "dist/shadows-character-sheet.html was not written");
  // buildHtml() already throws on an unresolved local asset, so this only has to
  // confirm the payload landed on disk. Don't grep the output for `<script src>`
  // to prove self-containment — shadows-icons.js documents its own loading in a
  // comment, and inlining that comment looks exactly like a surviving reference.
  const html = readFileSync(out, "utf8");
  assert.ok(html.includes("window.SHADOWS_DATA"), "game data was not inlined");
  assert.ok(html.includes("/*ENGINE-START*/"), "engine was not inlined");
  assert.ok(html.length > 100_000, `built file suspiciously small (${html.length} bytes)`);
});
