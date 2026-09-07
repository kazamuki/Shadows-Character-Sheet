/**
 * Shadows Character Sheet — build.
 *
 * Inlines every local <link rel="stylesheet"> and <script src> referenced by
 * index.html into a single self-contained HTML file. This is the documented
 * "ship path" (SCHEMA.md §1): players get one file they can double-click.
 *
 * Development does NOT need this script — open index.html straight from disk.
 * Usage:  node tools/build.mjs            → dist/shadows-character-sheet.html
 *         node tools/build.mjs --check    → build in memory, print size, write nothing
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const LINK_RE = /[ \t]*<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"':]+)["'][^>]*>\s*\n?/gi;
const SCRIPT_RE = /[ \t]*<script[^>]*src=["']([^"':]+)["'][^>]*><\/script>\s*\n?/gi;

/** Guard: an inlined asset containing a literal closing tag would truncate the document. */
function assertInlineSafe(path, text, tag) {
  const needle = new RegExp(`<\\/${tag}`, "i");
  if (needle.test(text)) {
    throw new Error(`${path} contains a literal </${tag} sequence and cannot be inlined verbatim.`);
  }
}

/** Returns the single-file HTML as a string. Used by the build and by the test harness. */
export function buildHtml(root = ROOT) {
  const shell = readFileSync(join(root, "index.html"), "utf8");

  const css = (_m, href) => {
    const text = readFileSync(join(root, href), "utf8");
    assertInlineSafe(href, text, "style");
    return `<style>\n/* ${href} */\n${text.trimEnd()}\n</style>\n`;
  };
  const js = (_m, src) => {
    const text = readFileSync(join(root, src), "utf8");
    assertInlineSafe(src, text, "script");
    return `<script>\n/* ${src} */\n${text.trimEnd()}\n</script>\n`;
  };

  // Every local asset the shell references must be consumed. Remote <link>s
  // (web fonts) are expected and left alone.
  const expected = (shell.match(/<(script|link)[^>]*(src|href)=["'](?!https?:)[^"']+["']/gi) || []).length;
  const out = shell.replace(LINK_RE, css).replace(SCRIPT_RE, js);
  const consumed = expected - (shell.replace(LINK_RE, "").replace(SCRIPT_RE, "")
    .match(/<(script|link)[^>]*(src|href)=["'](?!https?:)[^"']+["']/gi) || []).length;
  if (consumed !== expected) {
    throw new Error(`Unresolved local asset(s) in index.html: ${expected - consumed} of ${expected} not inlined.`);
  }
  return out;
}

/**
 * A second, standalone artifact: the blank fillable sheet, for a link on
 * shadowsrpg.com or anywhere else that shouldn't require the wizard first.
 * `Sheet.renderPrintView(null)` is a pure function of game data once no
 * character is passed — it never touches the DOM — but it's easiest to reach
 * by booting the real app in jsdom (the same trick tests/harness.mjs uses)
 * and calling it there, so this can never drift from what the live app
 * actually renders. print.css is inlined WITHOUT its media="print" gate, so
 * the page looks like the finished sheet immediately, not only once printed.
 */
export function buildBlankSheetHtml(root = ROOT) {
  const dom = new JSDOM(buildHtml(root), { runScripts: "dangerously", url: "https://shadows.invalid/" });
  let body;
  try {
    body = dom.window.eval("renderPrintView(null)");
  } finally {
    dom.window.close();
  }
  const printCss = readFileSync(join(root, "src/styles/print.css"), "utf8");
  assertInlineSafe("src/styles/print.css", printCss, "style");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Shadows — Blank Character Sheet</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&family=Chakra+Petch:wght@500;600;700&display=swap" rel="stylesheet">
<style>
body{background:#fff;margin:0}
.p-print-btn{position:fixed;top:10px;right:10px;z-index:10;font:600 13px 'Inter',system-ui,sans-serif;
  background:#712B8C;color:#fff;border:0;border-radius:4px;padding:8px 14px;cursor:pointer}
@media print{ .p-print-btn{display:none} }
${printCss.trimEnd()}
</style>
</head>
<body>
<button class="p-print-btn" onclick="window.print()">Print this sheet</button>
<div id="printSheet">${body}</div>
</body>
</html>
`;
}

// Run-as-CLI guard. `file://${process.argv[1]}` looked right but never matched:
// argv[1] is whatever was typed on the command line, so `node tools/build.mjs`
// yields "file://tools/build.mjs" while import.meta.url is a fully-resolved
// absolute URL. The comparison silently failed on every platform, which made
// `npm run build` and `npm run check` no-ops that exited 0 — no dist/, nothing
// checked, and a release tag that would have failed at the upload step.
// pathToFileURL resolves against cwd and produces the same href to compare.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const html = buildHtml();
  const blank = buildBlankSheetHtml();
  const check = process.argv.includes("--check");
  if (!check) {
    mkdirSync(join(ROOT, "dist"), { recursive: true });
    const out = join(ROOT, "dist", "shadows-character-sheet.html");
    writeFileSync(out, html, "utf8");
    console.log(`built ${out}  (${(html.length / 1024).toFixed(0)} KB)`);
    const blankOut = join(ROOT, "dist", "shadows-blank-sheet.html");
    writeFileSync(blankOut, blank, "utf8");
    console.log(`built ${blankOut}  (${(blank.length / 1024).toFixed(0)} KB)`);
  } else {
    console.log(`build ok  (${(html.length / 1024).toFixed(0)} KB, nothing written)`);
    console.log(`blank sheet ok  (${(blank.length / 1024).toFixed(0)} KB, nothing written)`);
  }
}
