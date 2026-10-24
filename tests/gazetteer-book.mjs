// Reads the setting chapters of the CRB mirror (private/crb/) into the shape
// the gazetteer's data should have, so the conformance test and whoever
// regenerates the data read the book the same way. Never writes to private/.
// Summaries are ours (Decision 242); everything else here is the book's.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const crb = (f) => fs.readFileSync(path.join(here, "..", "private", "crb", f), "utf8").replace(/\r/g, "").split("\n");

export const slug = (name) => name.toLowerCase().replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const SECTION_KIND = { "Notable Zones": "zone", "Supernatural Sites": "site", "Business Interests": "business", "Factions": "faction" };

// "Name (Paren)" with the last parenthetical split off; "(ADS)" / "(BDF)" stay in the name.
function splitName(inner) {
  const s = inner.replace(/\s*—\s*$/, "").trim();
  if (/^Blue Ridge Corridor/.test(s)) return { name: "Blue Ridge Corridor", paren: "Western Virginia" };
  const m = /^(.*?)\s*\(([^()]*)\)$/.exec(s);
  if (!m) return { name: s, paren: null };
  if (/^[A-Z]{2,4}$/.test(m[2])) return { name: s, paren: null };
  return { name: m[1].trim(), paren: m[2].trim() };
}

export function readPlaces() {
  const lines = crb("1100_Places.md");
  const out = { territories: [], beyond: [] };
  let part = null, terr = null, kind = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^## /.test(line)) { part = line.slice(3); terr = null; kind = null; continue; }
    if (part === "Territories of NYTE City") {
      let m = /^- \*\*(.+?)\*\* — (.+)$/.exec(line);
      if (m) { out.territories.push({ name: m[1], realWorld: m[2], zones: [], sites: [], businesses: [], factions: [] }); continue; }
      m = /^### (.+)$/.exec(line);
      if (m) { terr = out.territories.find((t) => t.name === m[1]) || null; kind = null; continue; }
      m = /^#### (.+)$/.exec(line);
      if (m) { kind = SECTION_KIND[m[1]] || null; continue; }
      m = /^\*\*(.+?)\*\*/.exec(line);
      if (m && terr && kind) {
        const { name, paren } = splitName(m[1]);
        terr[kind + (kind === "business" ? "es" : "s")].push({ name, paren });
      }
    } else if (part === "Beyond NYTE City") {
      const m = /^- \*\*(.+?)\*\* — (.+)$/.exec(line);
      if (m) out.beyond.push({ name: m[1], realWorld: m[2] });
    }
  }
  return out;
}

export function readPowers() {
  const out = [];
  let group = null;
  for (const raw of crb("1200_Powers.md")) {
    const line = raw.trim();
    let m = /^## (.+)$/.exec(line);
    if (m) { group = m[1]; if (group === "The Unseen Court") out.push({ group, name: "The Unseen Court" }); continue; }
    m = /^### (.+)$/.exec(line);
    if (m && group && !(group === "The Unseen Court" && m[1] === "Overview")) out.push({ group, name: m[1] });
  }
  return out;
}

export function readEnvironments() {
  const out = [];
  let on = false;
  for (const raw of crb("1300_Threats.md")) {
    const line = raw.trim();
    if (/^## /.test(line)) { on = line === "## Environmental Threats"; continue; }
    const m = /^### (.+)$/.exec(line);
    if (on && m) out.push(m[1]);
  }
  return out;
}

// The data the book implies, without the summaries. `summaries` is name → sentence.
export function expectedGazetteer(summaries = {}) {
  const book = readPlaces();
  const entries = [];
  const sum = (n) => summaries[n] ?? "";
  for (const t of book.territories) {
    const tid = slug(t.name);
    entries.push({ id: tid, kind: "territory", name: t.name, territory: null, zone: null, realWorld: t.realWorld, summary: sum(t.name), bookSource: "1100" });
    const zoneIds = new Map();
    for (const z of t.zones) zoneIds.set(z.name, slug(z.name));
    for (const k of ["zones", "sites", "businesses", "factions"]) {
      const kind = k === "businesses" ? "business" : k.slice(0, -1);
      for (const e of t[k]) {
        let zone = null, realWorld = null;
        if (kind === "zone") realWorld = e.paren;
        else if (e.paren) {
          const first = e.paren.split(/[;,]/)[0].trim();
          if (zoneIds.has(first)) zone = zoneIds.get(first);
          else realWorld = e.paren;
        }
        entries.push({ id: slug(e.name), kind, name: e.name, territory: tid, zone, realWorld, summary: sum(e.name), bookSource: "1100" });
      }
    }
  }
  for (const r of book.beyond) entries.push({ id: slug(r.name), kind: "region", name: r.name, territory: null, zone: null, realWorld: r.realWorld, summary: sum(r.name), bookSource: "1100" });
  for (const p of readPowers()) entries.push({ id: slug(p.name), kind: "power", group: p.group, name: p.name, territory: null, zone: null, realWorld: null, summary: sum(p.name), bookSource: "1200" });
  const environments = readEnvironments().map((n) => ({ id: slug(n), name: n, summary: sum(n), bookSource: "1300" }));
  return { entries, environments };
}
