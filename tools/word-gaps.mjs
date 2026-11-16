/**
 * Which labels on the sheet does no word answer? (K2, W156.)
 *
 *   node tools/word-gaps.mjs            the list, by tab, for every character in samples/dead-air
 *   node tools/word-gaps.mjs --json     the same, as JSON
 *   node tools/word-gaps.mjs --before    as it was before K2: only the words a tip could already open (gameTerms rows with forms,
 *                                        Stats, Conditions, the three tag glossaries)
 *
 * It opens each of the sample table's characters on every tab, reads the short labels the sheet draws (section heads, table
 * heads, field labels, chips, buttons, terms, small print), and prints the ones that are neither a word `Engine.words` lists,
 * nor a catalog's name (a Skill, an Advantage, a spell, a power, a weapon, a piece of armor or gear: KQ4 keeps those out of
 * Every word). What's left is a judgement, not a test: some are UI labels (Date, Undo), some are game words that want a
 * definition, and the PR says which. Not shipped, not part of `npm test`.
 */
import { readFileSync } from "node:fs";
import { boot, loadEngine } from "../tests/harness.mjs";

const { Engine, D } = loadEngine();
const table = JSON.parse(readFileSync(new URL("../samples/dead-air.shadows-table.json", import.meta.url), "utf8"));
const TABS = ["main", "skills", "character", "trackers", "progression", "loadout", "notes"];
const norm = s => String(s || "").replace(/\s+/g, " ").trim();
const key = s => norm(s).toLowerCase().replace(/[:.?]+$/, "");

// Everything a word answers to: its title, its id, and the name without its score ("Body 5" is Body).
const known = new Set();
if (process.argv.includes("--before")) {
  for (const r of D.gameTerms) if (Array.isArray(r.forms)) { known.add(key(r.id)); if (r.title) known.add(key(r.title)); r.forms.forEach(x => known.add(key(x))); }
  for (const d of D.derived) { known.add(key(d.id)); known.add(key(d.name)); }
  for (const c of D.conditions) known.add(key(c.name));
  for (const g of [...D.weaponTagGlossary, ...D.weaponFeatureGlossary, ...D.spellTagGlossary]) known.add(key(g.id));
} else for (const w of Engine.words(null)) { known.add(key(w.title)); known.add(key(w.id)); }
for (const s of D.stats) { known.add(key(s.id)); known.add(key(s.name)); }
// A catalog's names are not words (KQ4).
const catalogs = [D.skills, D.advantages, D.disadvantages, D.spells, D.weapons, D.armor, D.gear, D.archetypes, D.conditions, D.bodyLocations, D.powerLevels, D.classifications]
  .filter(Array.isArray).flat();
for (const c of catalogs) { if (c && c.name) known.add(key(c.name)); if (c && c.id) known.add(key(c.id)); }
for (const a of D.archetypes || []) for (const p of [...(a.powers || []), ...(a.baselineTraits || []), ...(a.vulnerabilities || [])]) if (p && p.name) known.add(key(p.name));

const SELECTOR = ".sect, .step-title, th, label, .chip, .tag, button, summary, dt, b, small, .cond-chip, .term, h2, h3";
const out = {};
for (const copy of table.copies) {
  const ch = Engine.migrate(JSON.parse(JSON.stringify(copy.character)));
  const name = (ch.identity && ch.identity.name) || copy.tag;
  const app = boot({ storage: { "shadows.active.v1": { ch, section: "main" } } });
  app.$$("#main button").find(b => /Open sheet/.test(b.textContent)).dispatchEvent(new app.window.MouseEvent("click", { bubbles: true }));
  for (const tab of TABS) {
    app.click(`[data-sec="${tab}"]`);
    for (const el of app.$$(`#main ${SELECTOR.split(", ").join(", #main ")}`)) {
      if (el.children.length) continue;   // a label is a leaf; a container reads as every label inside it run together
      const t = norm(el.textContent);
      if (!t || t.length > 40 || /^[\d\s+\-−×·.,/%Ç$]+$/.test(t)) continue;
      if (known.has(key(t)) || known.has(key(t.replace(/\s+[\d+−-]+$/, "")))) continue;
      (out[tab] = out[tab] || new Map()).set(key(t), norm(t));
    }
  }
}
const list = Object.fromEntries(Object.entries(out).map(([tab, m]) => [tab, [...m.values()].sort((a, b) => a.localeCompare(b))]));
if (process.argv.includes("--json")) console.log(JSON.stringify(list, null, 1));
else {
  const all = new Set(Object.values(list).flat());
  console.log(`${all.size} labels on ${TABS.length} tabs, over ${table.copies.length} characters, that no word answers:\n`);
  for (const [tab, labels] of Object.entries(list)) console.log(`${tab} (${labels.length}): ${labels.join(" | ")}\n`);
}
