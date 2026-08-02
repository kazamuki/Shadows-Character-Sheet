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
import { fileURLToPath } from "node:url";

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

if (import.meta.url === `file://${process.argv[1]}`) {
  const html = buildHtml();
  const check = process.argv.includes("--check");
  if (!check) {
    mkdirSync(join(ROOT, "dist"), { recursive: true });
    const out = join(ROOT, "dist", "shadows-character-sheet.html");
    writeFileSync(out, html, "utf8");
    console.log(`built ${out}  (${(html.length / 1024).toFixed(0)} KB)`);
  } else {
    console.log(`build ok  (${(html.length / 1024).toFixed(0)} KB, nothing written)`);
  }
}
