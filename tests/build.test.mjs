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
import { buildHtml, buildBlankSheetHtml, ROOT } from "../tools/build.mjs";

const BROWSER_JS = [
  "src/ui/theme-init.js",
  "src/engine/engine.js",
  "src/ui/shared.js",
  "src/ui/wizard.js",
  "src/ui/sheet.js",
  "src/ui/app.js",
  "src/data/shadows-data.js",
  "src/data/shadows-changelog.js",
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

test("inlining keeps a stylesheet's media gate (the blank demo site, v0.13.0–v0.14.0)", () => {
  // print.css hides #app for printing and relies on media="print" to keep
  // that off the screen. The build used to inline every stylesheet as a bare
  // <style>, so the built page hid itself: a blank blue page on the demo site
  // and in the dist/ file players get. jsdom ignores `media` and has no
  // layout, so no smoke test could see it. This checks the markup instead.
  const shell = readFileSync(join(ROOT, "index.html"), "utf8");
  const html = buildHtml();
  const gated = [...shell.matchAll(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi)]
    .map(m => ({ href: (/href=["']([^"']+)["']/.exec(m[0]) || [])[1], media: (/media=["']([^"']+)["']/.exec(m[0]) || [])[1] }))
    .filter(l => l.media && !/^https?:/.test(l.href));
  assert.ok(gated.some(l => l.href === "src/styles/print.css"), "index.html no longer gates print.css — did the shell change?");
  for (const l of gated) {
    const esc = l.href.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    assert.match(html, new RegExp(`<style media="${l.media}">\\s*/\\* ${esc} \\*/`),
      `${l.href} was inlined without media="${l.media}"`);
  }
  // And the rule that blanked the page must never reach the screen ungated.
  for (const [, attrs, body] of html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi))
    if (/#app\b[^{]*\{[^}]*display\s*:\s*none/.test(body))
      assert.match(attrs, /media=["']print["']/, "a stylesheet hiding #app is not gated to print");
});

test("script order in the shell is theme-init → data → icons → engine → ui", () => {
  // theme-init.js runs first and alone, in <head> before the shadows.css
  // <link> — it has to beat first paint (Decision 90), which is a different
  // concern from the data → icons → engine → ui pipeline that follows it in
  // <body>. Everything after it must keep that original order.
  const shell = readFileSync(join(ROOT, "index.html"), "utf8");
  const order = [...shell.matchAll(/<script[^>]*src=["']([^"']+)["']/g)].map(m => m[1]);
  assert.deepEqual(order, [
    "src/ui/theme-init.js",
    "src/data/shadows-data.js",
    "src/data/shadows-changelog.js",   // generated from CHANGELOG.md (Decision 123)
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

// The blank sheet is a second, standalone artifact for a direct download link
// (e.g. from shadowsrpg.com) — no wizard, no app chrome, just the fillable
// template. It's generated by booting the real app in jsdom and calling
// Sheet.renderPrintView(null) there, so it can't drift from what the live
// app actually renders for a character-less sheet.
test("buildBlankSheetHtml() renders a standalone, character-free template", () => {
  const html = buildBlankSheetHtml();
  assert.ok(html.includes("<title>Shadows"), "missing a title");
  assert.ok(html.includes('id="printSheet"'), "print container missing");
  // print.css is inlined WITHOUT its media="print" gate, so the page looks
  // right immediately rather than only once printed. (print.css's own header
  // comment mentions media="print" in prose, so check the tag, not the text.)
  assert.doesNotMatch(html, /<style[^>]*media=["']print["']/i,
    "print.css should be unconditional here, not print-only");
  assert.ok(html.includes("Health Levels") || html.includes("HEALTH LEVELS"),
    "expected section headers from renderPrintView are missing");
  // No app chrome, no engine, no game-data blob — this is a rendered fragment,
  // not the interactive app.
  assert.ok(!html.includes("window.SHADOWS_DATA"), "the blank sheet should not carry the whole game-data script");
  assert.ok(!html.includes("/*ENGINE-START*/"), "the blank sheet should not carry the engine");
});

test("`node tools/build.mjs` also writes the standalone blank sheet", () => {
  const out = join(ROOT, "dist", "shadows-blank-sheet.html");
  rmSync(out, { force: true });
  const r = spawnSync(process.execPath, ["tools/build.mjs"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(out), "dist/shadows-blank-sheet.html was not written");
  const html = readFileSync(out, "utf8");
  assert.ok(html.includes('id="printSheet"'), "print container missing from the written file");
});

test("every rule that paints a token background leaves readable text on it, in both themes (W7)", () => {
  // W7: `.btn.primary` set a violet background and no color, so its text
  // inherited --text, which the light theme turns near-black (2.2:1). A token
  // change can do that again to any filled control, so check them all: each
  // rule with `background: var(--token)` against the color it declares, or
  // its un-hovered base rule's, or --text it inherits. WCAG AA, 4.5:1.
  const css = readFileSync(join(ROOT, "src/styles/shadows.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim().replace(/\s+/g, " "), body: m[2] }));
  const decl = (body, prop) => {
    const m = [...body.matchAll(/(?:^|;)\s*([\w-]+)\s*:\s*([^;]+)/g)].find(d => d[1] === prop);
    return m && m[2].trim();
  };
  const tokens = sel => Object.fromEntries(rules.filter(r => r.sel === sel)
    .flatMap(r => [...r.body.matchAll(/--([\w-]+)\s*:\s*([^;]+)/g)].map(m => [m[1], m[2].trim()])));
  const dark = tokens(":root"), light = Object.assign({}, dark, tokens(':root[data-theme="light"]'));
  assert.ok(dark.text && light.text && dark.text !== light.text, "couldn't read both themes' tokens — did the :root blocks move?");
  const resolve = (v, t, d = 0) => { const m = /^var\(--([\w-]+)\)$/.exec(v || ""); return m && d < 5 ? resolve(t[m[1]], t, d + 1) : v; };
  const lum = hex => [0, 2, 4].map(i => parseInt(hex.slice(1 + i, 3 + i), 16) / 255)
    .map(x => x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
    .reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const base = s => s.replace(/:(hover|focus|active|focus-visible)\b/g, "").replace(/:not\([^)]*\)/g, "");
  // Filled shapes that never hold text (checked in the renderers, 2026-09-23).
  const textless = new Set([".admin-banner .dot", ".cond-counter .pip.on"]);
  const hex = /^#[0-9a-f]{6}$/i, bad = [];
  let checked = 0;
  for (const r of rules) {
    const bg = decl(r.body, "background") || decl(r.body, "background-color");
    if (!/^var\(--[\w-]+\)$/.test(bg || "") || textless.has(r.sel) || /::(after|before)| i$/.test(r.sel)) continue;
    let fg = decl(r.body, "color");
    if (!fg) { const b = rules.find(x => x.sel === base(r.sel) && decl(x.body, "color")); fg = b ? decl(b.body, "color") : "var(--text)"; }
    for (const [name, t] of [["dark", dark], ["light", light]]) {
      const B = resolve(bg, t), F = resolve(fg, t);
      if (!hex.test(B || "") || !hex.test(F || "")) continue;
      checked++;
      const c = ratio(B, F);
      if (c < 4.5) bad.push(`${name}: ${r.sel} — ${F} on ${B} is ${c.toFixed(2)}:1`);
    }
  }
  assert.ok(checked > 20, `only ${checked} rule/theme pairs checked — did the parser break?`);
  assert.deepEqual(bad, []);
});
