/**
 * Claude Code's SessionStart hook (.claude/settings.json): make `npm run
 * verify` work from the first command. A cloud session starts without
 * node_modules, and verify fails until someone thinks to install (audit §7,
 * R5). Not part of the app or its build.
 *
 * Runs `npm ci` only when node_modules is missing or older than
 * package-lock.json, so an ordinary local start costs nothing. Silent when
 * there's nothing to do: what it prints goes into the session's context.
 * It never fails the session: a failed install is reported, and verify will
 * say the rest.
 */
import { statSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Not ./build.mjs's ROOT: that imports jsdom, which is what may be missing.
const ROOT_DIR = fileURLToPath(new URL("..", import.meta.url));

const mtime = f => { try { return statSync(join(ROOT_DIR, f)).mtimeMs; } catch { return 0; } };
// npm rewrites node_modules/.package-lock.json on every install.
const installed = mtime("node_modules/.package-lock.json");
if (installed && installed >= mtime("package-lock.json")) process.exit(0);

const why = installed ? "package-lock.json changed since the last install" : "node_modules is missing";
const r = spawnSync("npm", ["ci", "--no-audit", "--no-fund"], {
  cwd: ROOT_DIR, encoding: "utf8", shell: process.platform === "win32",
});
if (r.status === 0) console.log(`SessionStart: ran \`npm ci\` (${why}).`);
else console.log(`SessionStart: \`npm ci\` failed (${why}); run it by hand before \`npm run verify\`.\n${(r.stderr || "").trim().split("\n").slice(-5).join("\n")}`);
