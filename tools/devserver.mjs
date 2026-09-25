// Ephemeral dev-preview server. NOT part of the shipped app (which runs from
// file:// with no server, see CLAUDE.md) — this exists only so a browser tool
// can execute the app's scripts to visually verify a change.
//
// It listens on loopback only and serves nothing outside the repo (audit C12):
// on shared Wi-Fi, listen(PORT) alone served any file the user could read to
// anyone who asked for /../../ it.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
// PORT lets two worktrees preview side by side; 8420 when nothing assigns one.
const PORT = Number(process.env.PORT) || 8420;
const HOST = "127.0.0.1";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };

createServer(async (req, res) => {
  let file;
  try {
    const path = new URL(req.url, "http://x").pathname;
    file = resolve(ROOT, "." + decodeURIComponent(path === "/" ? "/index.html" : path));
  } catch {
    res.writeHead(400); res.end("bad request"); return;
  }
  if (file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403); res.end("outside the repo"); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404); res.end("not found");
  }
}).listen(PORT, HOST, () => console.log(`dev preview on http://localhost:${PORT} (${HOST} only)`));
