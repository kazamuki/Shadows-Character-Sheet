/**
 * The Threat Codex pack and the script that builds it (Decision 186).
 *
 * The pack is built from the private mirror by private/gm/build-codex-pack.mjs,
 * so these tests need that submodule, and fail loudly without it, the way
 * rules.test.mjs does. They name no Codex word: the real pack is checked by
 * counts, shapes and ids, and the builder by a made-up codex written below.
 * Every name in it was grepped against private/crb/ before it was used.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { loadEngine } from "./harness.mjs";
import { ROOT } from "../tools/build.mjs";

const BUILDER = join(ROOT, "private/gm/build-codex-pack.mjs");
const PACK = join(ROOT, "private/gm/threat-codex.shadows-pack.json");
const LEDGER = join(ROOT, "private/gm/ids.json");
const FIX = "run `git submodule update --init private` (needs read access to kazamuki/Shadows-Private)";
const have = existsSync(BUILDER);
const B = have ? await import(pathToFileURL(BUILDER).href) : null;
const { Engine, D } = loadEngine();
const builder = () => { assert.ok(have, `private/gm/build-codex-pack.mjs is missing: ${FIX}`); return B; };
const file = p => { assert.ok(existsSync(p), `${p} is missing: ${FIX}`); return readFileSync(p, "utf8").replace(/\r\n/g, "\n"); };   // a Windows checkout may have made it CRLF
const plain = x => JSON.parse(JSON.stringify(x));   // out of the engine's realm
const RECORD_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/;

// ── A made-up codex, in the shapes the real one has ─────────────────────────
// Three threats in two sections, one roster person, two groups, four traits.
const STATS = ["BOD", "REF", "MOB", "INT", "TECH", "COOL", "MAG", "EMP", "TOL", "WILL"];
const ENTRIES = [
  { key: "a", n: 1, name: "Brindle Hound", sec: 0, role: "Lampwright", enemy: "Grindstone", tier: 1, s: [6, 5, 6, 3, 4, 5, 4, 5, 1, 2], audit: { TOL: 3 },
    skills: "Combat Sense (6), Handgun (6), Lampwork (4)", armor: "Tin Coat (PROT 1d4, RES +2) ⚠",
    gear: "Tin Spoon (DMG 1, 1,200Ç) ⚠, Brass Fist (DMG 2) or Salt Gun (DMG 3), Slate Knife 1,200Ç; Pocket Watch — kept, wound nightly, Glass Eye", traits: [["Salt Rampart", "Holds the door."], ["Fennick’s Promise", "Keeps one back."]] },
  { key: "b", n: 2, name: "Ashwick Clerk", sec: 0, role: "Tidecaller", enemy: "Skimmer", tier: 2, s: [5, 7, 8, 3, 4, 6, 4, 5, 1, 2], audit: {},
    skills: "Combat Sense (7), Handguns (8)", armor: "Denim Rag (PROT 1d4)", gear: "Slate Pen (DMG 1)", traits: [["Salt Rampart", "Holds the door."]] },
  { key: "c", n: 3, name: "Tallow Saint", sec: 1, role: "Lampwright / Tidecaller", enemy: "None", tier: 2, s: [8, 5, 5, 3, 4, 6, 4, 4, 2, 3], audit: {},
    skills: "Combat Sense (5), Melee (9)", armor: "Wax Duster (PROT 1d6)", gear: "Candle Staff (BOD+2)", traits: [["Hollow Bell", "Rings twice."]] },
];
const SECTIONS = [["ZEPHYRINE", "BOD +1 · MOB +1 · INT –1"], ["QUARRELMERE", "INT +1 · TECH +1 · BOD –1"]];
const GROUPS = [
  { n: 1, name: "Ledger Fire", sec: 0, comp: [[2, "a"], [1, "b"]] },
  { n: 2, name: "Slack Water", sec: 1, comp: [[1, "c"], [1, "a"]] },
];

// o.shift renumbers every entry, o.names renames by key, o.extra adds an entry,
// and the rest each break one thing a check should catch.
function codex(o = {}) {
  const shift = o.shift || 0, ents = ENTRIES.map(e => ({ ...e, name: (o.names || {})[e.key] || e.name, n: e.n + shift }));
  if (o.extra) ents.push({ key: "x", n: 4 + shift, name: o.extra, sec: 1, role: "Tidecaller", enemy: "Skimmer", tier: 1, s: [5, 5, 5, 5, 5, 5, 5, 5, 1, 1], audit: {},
    skills: "Combat Sense (5)", armor: "Rag", gear: "Rock", traits: [["Salt Rampart", "Holds the door."]] });
  const no = n => String(n).padStart(2, "0"), ref = k => ents.find(e => e.key === k);
  const entry = e => `**ENTRY ${no(e.n)}**

**${e.name}**

**NPC Role:** ${e.role} **Enemy Role:** ${e.enemy} **Tier:** ${e.tier}

> *A flavor line for ${e.name}.*

A description of ${e.name}.

A second paragraph.

|  |  |  |  |  |  |  |  |  |  |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
${"| " + STATS.map(s => `**${s}**`).join(" | ") + " |"}
${"| " + e.s.join(" | ") + " |"}

**Health:** ${e.key === "a" && o.health ? o.health : `${e.s[0] * 5} (${e.s[0]} Health Levels)`}

**Armor:** ${e.armor}

**SKILLS**

${e.skills}

**GEAR**

${e.gear}

> **⚠ GEAR FLAG:** *A note for the maintainers.*

**TRAITS**

${e.traits.map(([n, t]) => `**${n}.** ${t}`).join("\n\n")}

> **GM Note:** *Run ${e.name} quietly.*
`;
  const group = g => `**EG-${no(g.n)} ${g.name}**

**Composition:** ${g.comp.map(([c, k]) => `${c}× ${ref(k).name} (Entry ${no(k === "a" && o.compRef ? o.compRef : ref(k).n)})`).join(" + ")}

**Situation:** Something at the dock.

**Tactics:** Hold the line.
`;
  const sections = SECTIONS.map(([name, mods], i) => `**SECTION 0${i + 1} // ${name}**

*Origin Modifier: ${i === 0 && o.humanMods ? o.humanMods : mods}*

An origin paragraph.

${ents.filter(e => e.sec === i).map(entry).join("\n")}
**ENCOUNTER GROUPS — ${name}**

${GROUPS.filter(g => g.sec === i).map(group).join("\n")}`).join("\n");
  const td = t => `<td style="text-align: left;">${t}</td>`;
  const row = (n, k, t) => `<tr>\n${td(`<strong>${n}</strong>`)}\n${td(`<strong>${k}</strong>`)}\n${td(t)}\n${td("<em>Entry 01</em>")}\n</tr>`;
  const head = h => `<tr>\n<td colspan="4"><strong>${h}</strong></td>\n</tr>`;
  const glossary = o.noGlossary ? "" : `**PART C**

**Trait Glossary**

<table>
<tbody>
${head("UNIVERSAL TRAITS")}
${head("GROUP ONE")}
${row("Salt Rampart", "UNIVERSAL", "Holds the door &amp; the window.")}
</tbody>
</table>

<table>
<tbody>
${head("ORIGIN TRAITS")}
${head("ZEPHYRINE")}
${row("Hollow Bell", "ORIGIN", "Rings twice.")}
<tr>
<td colspan="4"><em>Note: a design note.</em></td>
</tr>
</tbody>
</table>

<table>
<tbody>
${head("SIGNATURE TRAITS")}
${head("QUARRELMERE")}
${row("Fennick's Promise", "SIGNATURE", "Keeps one back.")}
</tbody>
</table>
`;
  const human = `<!-- a mirror -->

**How to Read an Entry**

|  |  |
|----|----|
| **FIELD** | **WHAT IT TELLS YOU** |
${o.noTierRow ? "" : "| Tier | The weight: T1 (light touch), T2 (hard stop), T4/Apex (one of a kind). See Tier Reference. |"}

**TOL and WILL Calculation**

**PART B**

${sections}
**GEAR FLAGS SUMMARY**

A flag.

${glossary}
**PART D**

**Trait Library**
`;
  const v2 = `# A Codex

### NPC Roles

| ROLE | IN THE WORLD | RESOURCES AND TOOLS | WHEN TURNED HOSTILE |
|----|----|----|----|
| Lampwright | Keeps the lamps | Oil, ladders | Goes dark |
| Tidecaller | Reads the water | Charts | Floods the room |

### Enemy Roles

| ROLE | TIER | COMBAT FUNCTION | WHAT REMOVING THEM DOES | PRIMARY PRESSURE |
|----|----|----|----|----|
| Grindstone | T1 | Wears them down. | The grind stops. | Numbers |
| Skimmer | T2 | Takes the top off. | The surface settles. | Pace |

#### Origin Modifiers

<table>
<thead>
<tr>
<th>ORIGIN</th>
<th>MODIFIER</th>
<th>STAT PROFILE</th>
<th>FORMATION NOTES</th>
</tr>
</thead>
<tbody>
<tr>
<td>Zephyrine</td>
<td>BOD +1 · MOB +1 ·<br />
INT –1</td>
<td>Fast and thin.</td>
<td>Raised on rooftops.</td>
</tr>
<tr>
<td>Quarrelmere</td>
<td>INT +1 · TECH +1 ·<br />
BOD –1</td>
<td>Careful and soft.</td>
<td>Raised in offices.</td>
</tr>
</tbody>
</table>

### Tiers

| **TIER** | **ROLES** | **STAT PROFILE** | **TRAITS** | **ENCOUNTER ROLE** |
|----|----|----|----|----|
| T1 | Grindstone | Most stats 4–6. | 1–2 | Pressure through numbers. |
| T2 | Skimmer | One stat at 8. | 2–3 | One clear question. |

## NPC Roster

A roster.

### Pell Marrow — The Lamp Lender

**Origin:** Zephyrine **NPC Role:** Lampwright/Tidecaller **Enemy Role:** ${o.badRole || "None"}

*Lends lamps, and not for free.*

A description of Pell.

A second paragraph.

**Motivation:** Light, mostly.

**Resources:** A cart of lamps.

**Their Line:** Never after dark.

| BOD | REF | MOB | INT | TECH | COOL | MAG | EMP | TOL | WILL |
|:---:|-----|-----|-----|------|------|-----|-----|-----|------|
|  4  | 4   | 4   | 6   | 5    | 6   | 6   | 6   | 1   | 1    |

**Skills:** Lampwork (5), Handgun (4)

**If Pushed:** Pell shuts the shutters.

> Use **Entry ${no(ents[0].n)}: ${ents[0].name}** for the help.

**GM Note:** Keep Pell alive.

**\\**
Enemy Matrix
------------

Later things.
`;
  const auditRow = (type, name, s, tol, will, over = "") => `| ${type} | x | | ${name} | Zephyrine | ${s.join(" | ")} | ${tol} | ${over} | ${tol} | ${will} |`;
  const audit = `# Audit

## Summary

| nothing |

## Audit

| Type | Section / Order | ID | Name | Origin | BOD | REF | MOB | INT | TECH | COOL | MAG | EMP | Listed TOL | TOL Override | Calc TOL | Listed WILL |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
${auditRow("NPC Roster", "Pell Marrow — The Lamp Lender", [4, 4, 4, 6, 5, 6, 6, 6], 2, 1)}
${ents.map(e => auditRow("Mortal Entry", e.name, e.s.slice(0, 8).map((v, i) => (o.auditStat && e.key === "a" && i === 0) ? o.auditStat : v), (e.audit.TOL ?? e.s[8]), e.s[9])).join("\n")}
${auditRow("Supernatural", ents[0].name, [1, 1, 1, 1, 1, 1, 1, 1], 9, 9)}
${o.dupName ? auditRow("Mortal Entry", ents[0].name, [1, 1, 1, 1, 1, 1, 1, 1], 1, 1) : ""}
`;
  return { human, v2, audit };
}
const ledgerFor = src => {
  const { data, problems } = builder().parseCodex({ ...src, Engine, D });
  assert.deepEqual(problems, [], "the made-up codex must parse");
  return B.newLedger(data, { codex: "2026-01", v2: "2026-02-03", audit: "2026-01-15" }, "2026-02-04T00:00:00.000Z");
};
const build = (src, ledger) => builder().buildPack({ ...src, ledger, Engine, D });
const once = (o, ledger) => build(codex(o), ledger);
const idsOf = (pack, sec) => Object.fromEntries(pack[sec].map(r => [r.name, r.id]));

// ── buildPack() on the made-up codex ────────────────────────────────────────
test("the made-up codex builds, and what it builds is a pack the engine keeps whole", () => {
  const src = codex(), ledger = ledgerFor(src), r = build(src, ledger);
  assert.deepEqual(r.problems, []);
  assert.equal(r.warnings.length, 1, r.warnings.join("\n")); assert.match(r.warnings[0], /Entry 01.*comma after a dash.*Pocket Watch/);
  const p = r.pack;
  assert.equal(p.entries.length, 4); assert.equal(p.groups.length, 2); assert.equal(p.traits.length, 3);
  assert.deepEqual(plain(Engine.migratePack(plain(p))), plain(p), "nothing dropped, nothing coerced");
  const a = p.entries[0];
  assert.equal(a.ref, "Entry 01"); assert.equal(a.origin, "zephyrine"); assert.deepEqual(a.npcRoles, ["lampwright"]); assert.equal(a.enemyRole, "grindstone");
  assert.equal(a.block.authored.TOL, 3, "TOL is the audit's, not the table's 1");
  assert.deepEqual(a.block.gear, ["Tin Spoon (DMG 1, 1,200Ç)", "Brass Fist (DMG 2) or Salt Gun (DMG 3)", "Slate Knife 1,200Ç", "Pocket Watch — kept, wound nightly, Glass Eye"],
    "one line per item: split on ; and on , outside parentheses; 1,200 and an or stay whole; a comma after a dash stays in its line; the ⚠ and its space are gone");
  assert.deepEqual(a.block.armor, ["Tin Coat (PROT 1d4, RES +2)"]);
  assert.equal(a.description, "A description of Brindle Hound.\n\nA second paragraph.");
  assert.equal(a.gmNote, "Run Brindle Hound quietly.", "the GEAR FLAG note lands nowhere");
  assert.deepEqual(a.block.skills.map(k => k.skill), ["combat-sense", "handguns", null], "a name the game doesn't know keeps its total");
  assert.equal(p.entries[1].block.skills[1].skill, "handguns", "Handguns, as printed, matches too");
  assert.equal(p.entries[2].enemyRole, null); assert.deepEqual(p.entries[2].npcRoles, ["lampwright", "tidecaller"]);
  const pell = p.entries[3];
  assert.equal(pell.kind, "npc"); assert.equal(pell.name, "Pell Marrow"); assert.equal(pell.ref, "The Lamp Lender"); assert.equal(pell.tier, null);
  assert.equal(pell.flavor, "Lends lamps, and not for free."); assert.equal(pell.line, "Never after dark."); assert.equal(pell.block.authored.TOL, 2, "the roster's TOL is the audit's too");
  assert.equal(pell.ifPushed, "Pell shuts the shutters.\n\nUse Entry 01: Brindle Hound for the help.");
  assert.deepEqual(pell.block.traits, []); assert.deepEqual(pell.block.gear, []);
  assert.deepEqual(p.groups[0].members, [{ entry: a.id, count: 2 }, { entry: p.entries[1].id, count: 1 }]);
  assert.deepEqual(p.origins.map(o => o.modifiers), [{ BOD: 1, MOB: 1, INT: -1 }, { INT: 1, TECH: 1, BOD: -1 }]);
  assert.equal(p.origins[0].text, "Fast and thin.\n\nRaised on rooftops.");
  assert.deepEqual(p.tiers.map(t => t.name), ["Light touch", "Hard stop"]);
  assert.equal(p.tiers[1].statGuide, "One stat at 8."); assert.equal(p.tiers[1].traitGuide, "2–3"); assert.equal(p.tiers[1].text, "One clear question.");
  assert.equal(p.enemyRoles[1].tier, 2); assert.match(p.enemyRoles[1].text, /^Combat function: Takes the top off\.\nWhat removing them does: .*\nPrimary pressure: Pace$/);
  const t = Object.fromEntries(p.traits.map(x => [x.name, x]));
  assert.equal(t["Salt Rampart"].kind, "universal"); assert.equal(t["Salt Rampart"].origin, null); assert.equal(t["Salt Rampart"].text, "Holds the door & the window.");
  assert.equal(t["Hollow Bell"].origin, "zephyrine"); assert.equal(t["Fennick's Promise"].origin, "quarrelmere"); assert.equal(t["Fennick's Promise"].kind, "signature");
  assert.equal(p.meta.id, "PK-C0DEX7H4"); assert.equal(p.meta.contentVersion, "Codex 2026-01 · v2 2026-02-03 · audit 2026-01-15");
  assert.equal(p.meta.updated, "2026-02-03T00:00:00.000Z"); assert.equal(p.meta.created, "2026-02-04T00:00:00.000Z");
  for (const sec of ["origins", "npcRoles", "enemyRoles", "traits", "entries", "groups"]) for (const x of p[sec]) assert.match(x.id, RECORD_ID, `${sec} id ${x.id}`);
});

test("a typographic apostrophe in a glossary name and a straight one in an entry are one trait to the engine (187)", () => {
  const src = codex(), p = build(src, ledgerFor(src)).pack;
  const m = Engine.castPackMatch([plain(p)], { block: plain(p.entries[0].block) });
  assert.equal(m.counts.written, 0, "every trait the first entry carries is in the glossary");
  assert.equal(m.counts.total, 2);
});

test("buildPack twice gives the same pack, byte for byte", () => {
  const src = codex(), ledger = ledgerFor(src);
  assert.equal(B.serialize(build(src, ledger).pack), B.serialize(build(src, ledger).pack));
});

test("renumbered: the same names under new entry numbers keep every id; only ref moves", () => {
  const ledger = ledgerFor(codex());
  const before = build(codex(), ledger).pack, after = once({ shift: 20 }, ledger);
  assert.deepEqual(after.problems, []);
  assert.deepEqual(idsOf(after.pack, "entries"), idsOf(before, "entries"));
  assert.deepEqual(idsOf(after.pack, "groups"), idsOf(before, "groups"));
  assert.deepEqual(after.pack.entries.slice(0, 3).map(e => e.ref), ["Entry 21", "Entry 22", "Entry 23"]);
  assert.deepEqual(after.pack.groups.map(g => g.members.map(m => m.entry)), before.groups.map(g => g.members.map(m => m.entry)), "and the groups still resolve");
});

test("renamed: a name the ledger doesn't know stops the build and is named; no pack", () => {
  const ledger = ledgerFor(codex()), r = once({ names: { b: "Ashwick Ledger-Clerk" } }, ledger);
  assert.equal(r.pack, null);
  assert.ok(r.problems.some(p => p.includes("Ashwick Ledger-Clerk") && /new or renamed/.test(p)), r.problems.join("\n"));
});

test("new: an extra entry stops the build; once recorded as --add would, it has a fresh slug", () => {
  const ledger = ledgerFor(codex()), r = once({ extra: "Cobalt Sexton" }, ledger);
  assert.equal(r.pack, null);
  assert.ok(r.problems.some(p => p.includes("Cobalt Sexton")), r.problems.join("\n"));
  const id = B.ledgerAdd(ledger, "entries", "Cobalt Sexton");
  assert.equal(id, "cobalt-sexton");
  const ok = once({ extra: "Cobalt Sexton" }, ledger);
  assert.deepEqual(ok.problems, []);
  assert.equal(idsOf(ok.pack, "entries")["Cobalt Sexton"], "cobalt-sexton");
});

test("retired: a ledger name gone from the book is a warning, the pack lacks it, and its slug is never reused", () => {
  const withExtra = codex({ extra: "Cobalt Sexton" }), ledger = ledgerFor(withExtra);
  const r = once({}, ledger);   // the book no longer has it
  assert.deepEqual(r.problems, []);
  assert.ok(r.warnings.some(w => w.includes("Cobalt Sexton")), r.warnings.join("\n"));
  assert.ok(!r.pack.entries.some(e => e.name === "Cobalt Sexton"));
  assert.equal(B.ledgerAdd(ledger, "entries", "The Cobalt Sexton"), "cobalt-sexton-2", "a new entry whose slug is the absent one's takes -2");
  ledger.retired.entries = [ledger.sections.entries["Cobalt Sexton"]]; delete ledger.sections.entries["Cobalt Sexton"];
  assert.equal(B.ledgerAdd(ledger, "entries", "Cobalt Sexton!"), "cobalt-sexton-3", "a retired id is held too, and never reused");
});

test("apostrophes: an entry renamed only ’ → ' keeps its id and raises nothing", () => {
  const ledger = ledgerFor(codex({ names: { b: "Ashwick’s Clerk" } }));
  const r = once({ names: { b: "Ashwick's Clerk" } }, ledger);
  assert.deepEqual(r.problems, []);
  assert.equal(idsOf(r.pack, "entries")["Ashwick's Clerk"], "ashwicks-clerk");
  assert.deepEqual(Object.keys(ledger.sections.entries).filter(k => /Ashwick/.test(k)), ["Ashwick's Clerk"], "the ledger's key is folded");
});

test("every check trips on a codex that breaks it", () => {
  const ledger = ledgerFor(codex());
  const problems = o => { const r = once(o, ledger); assert.equal(r.pack, null); return r.problems.join("\n"); };
  assert.match(problems({ health: "99 (6 Health Levels)" }), /Entry 01.*Health is printed 99/, "Health that isn't the engine's");
  assert.match(problems({ compRef: 77 }), /Ledger Fire.*Entry 77/, "a composition naming an entry that isn't there");
  assert.match(problems({ humanMods: "BOD +2 · MOB +1 · INT –1" }), /origin modifier for "Zephyrine" differs/, "v2 and the human Codex disagreeing");
  assert.match(problems({ badRole: "Nonesuch" }), /enemy role "Nonesuch" is in no list/, "a role in no list");
  assert.match(problems({ auditStat: "x" }), /Stat Audit's.*BOD isn't a whole number/, "an audit stat that isn't a number");
  assert.match(problems({ dupName: true }), /two records with one name in the Stat Audit: "Brindle Hound"/);
  assert.match(problems({ noGlossary: true }), /no Trait Glossary/, "no glossary");
  assert.match(problems({ noTierRow: true }), /no Tier row|no tier label/, "no tier label");
  assert.match(problems({ names: { b: "Brindle Hound" } }), /two records with one name in entries: "Brindle Hound"/, "two records, one name");
  const noLedger = builder().buildPack({ ...codex(), ledger: null, Engine, D });
  assert.equal(noLedger.pack, null); assert.match(noLedger.problems.join(), /no id ledger/);
});

test("a record the audit lacks falls back to the book's table, with a warning", () => {
  const src = codex(); src.audit = src.audit.replace(/^\| Mortal Entry \| x \| \| Tallow Saint .*$/m, "");
  const r = build(src, ledgerFor(codex()));
  assert.deepEqual(r.problems, []);
  assert.ok(r.warnings.some(w => w.includes("Tallow Saint") && /Stat Audit/.test(w)), r.warnings.join("\n"));
  assert.equal(r.pack.entries[2].block.authored.TOL, 2); assert.equal(r.pack.entries[2].block.stats.BOD, 8);
});

test("slugs: a leading The goes, an apostrophe goes, 32 characters at most, a clash takes -2", () => {
  const { slug } = builder();
  assert.equal(slug("The Long Way Home", new Set()), "long-way-home");
  assert.equal(slug("Fennick’s Promise", new Set()), "fennicks-promise");
  assert.equal(slug("A".repeat(50), new Set()).length, 32);
  const long = slug("a".repeat(32), new Set(["a".repeat(32)]));
  assert.equal(long.length, 32); assert.ok(long.endsWith("-2"));
  assert.equal(slug("Mark", new Set(["mark", "mark-2"])), "mark-3");
  assert.equal(slug("— !", new Set()), null, "a name with nothing in it has no slug");
  assert.match(slug("Yö Dawg", new Set()), RECORD_ID);
});

// ── The real pack ───────────────────────────────────────────────────────────
function real() {
  builder();
  const sources = B.sources(), ledger = JSON.parse(file(LEDGER));
  return { sources, ledger, r: B.buildPack({ ...sources, ledger, Engine, D }), committed: file(PACK) };
}

test("the committed Codex pack is what the mirror builds, byte for byte", () => {
  const { r, committed } = real();
  assert.deepEqual(r.problems, [], "the builder has problems with the mirror as it is");
  assert.equal(committed, B.serialize(r.pack), "the mirror, the ledger or the builder moved without a rebuild: run `npm run codex-pack`");
});

test("the Codex pack: the engine's gate changes nothing, and packCheck has nothing to say", () => {
  const pack = JSON.parse(real().committed);
  assert.deepEqual(plain(Engine.migratePack(plain(pack))), pack, "nothing dropped, nothing coerced");
  const c = plain(Engine.packCheck(pack));
  assert.equal(c.refuse, null); assert.deepEqual(c.warnings, []);
  assert.equal(pack.meta.packSchemaVersion, "0.2"); assert.ok(Engine.isPackId(pack.meta.id));
});

test("the Codex pack's counts", () => {
  const p = JSON.parse(real().committed);
  assert.deepEqual([p.origins.length, p.npcRoles.length, p.enemyRoles.length, p.tiers.length, p.traits.length, p.entries.length, p.groups.length], [7, 9, 8, 4, 114, 53, 29]);
  assert.equal(p.entries.filter(e => e.kind === "threat").length, 42); assert.equal(p.entries.filter(e => e.kind === "npc").length, 11);
  assert.deepEqual(p.traits.reduce((a, t) => (a[t.kind] = (a[t.kind] || 0) + 1, a), {}), { universal: 17, origin: 37, signature: 60 });
  assert.ok(p.tiers.every(t => t.name && t.text && t.statGuide && t.traitGuide), "every tier has its label and both guides");
  assert.ok(p.origins.every(o => Object.keys(o.modifiers).length === 3), "every origin has its three modifiers");
});

test("the Codex pack: everything points at something, and every id is the engine's kind and used once", () => {
  const { ledger, committed } = real(), p = JSON.parse(committed);
  const ids = sec => new Set(p[sec].map(r => r.id));
  for (const sec of ["origins", "npcRoles", "enemyRoles", "traits", "entries", "groups"]) {
    assert.equal(ids(sec).size, p[sec].length, `${sec} repeats an id`);
    for (const r of p[sec]) assert.match(r.id, RECORD_ID);
  }
  for (const g of p.groups) { assert.ok(g.members.length > 0); for (const m of g.members) assert.ok(ids("entries").has(m.entry), `${g.ref} member ${m.entry}`); assert.ok(ids("origins").has(g.origin)); }
  for (const e of p.entries) {
    for (const r of e.npcRoles) assert.ok(ids("npcRoles").has(r), `${e.ref} role ${r}`);
    if (e.enemyRole !== null) assert.ok(ids("enemyRoles").has(e.enemyRole));
    if (e.origin !== null) assert.ok(ids("origins").has(e.origin));
  }
  assert.equal(p.entries.filter(e => e.origin === null).length, 1, "exactly one entry has no origin");
  for (const sec of Object.keys(ledger.sections)) {
    const held = new Set([...Object.values(ledger.sections[sec]), ...((ledger.retired || {})[sec] || [])]);
    for (const r of p[sec] || []) assert.ok(held.has(r.id), `${sec} "${r.id}" isn't in the ledger`);
    for (const id of Object.values(ledger.sections[sec])) assert.ok(!p[sec] || ids(sec).has(id), `the ledger's ${sec} id "${id}" isn't in the pack`);
  }
});

test("the engine's Health for each threat is the one the book prints", () => {
  const { sources, committed } = real(), p = JSON.parse(committed);
  const printed = [...sources.human.matchAll(/^\*\*Health:\*\*\s*(\d+)\s*\((\d+) Health Levels?\)/gm)].map(m => [Number(m[1]), Number(m[2])]);
  const threats = p.entries.filter(e => e.kind === "threat");
  assert.equal(printed.length, threats.length, "one Health line per threat");
  threats.forEach((e, i) => {
    const h = Engine.npc(plain(e.block)).health;
    assert.deepEqual([h.total, h.levels], printed[i], `${e.ref}`);
  });
});

test("entry traits found in the glossary, after folding apostrophes: at least 110 of 118", () => {
  const p = JSON.parse(real().committed);
  const all = p.entries.flatMap(e => e.block.traits).length;
  assert.equal(all, 118);
  const m = Engine.castPackMatch([plain(p)], { block: { traits: p.entries.flatMap(e => e.block.traits) } });
  assert.equal(m.counts.total, 118);
  assert.ok(m.counts.total - m.counts.written >= 110, `only ${m.counts.total - m.counts.written} of ${m.counts.total} match the glossary`);
});

test("every skill row on a threat has a skill the game knows", () => {
  const p = JSON.parse(real().committed);
  const rows = p.entries.filter(e => e.kind === "threat").flatMap(e => e.block.skills);
  assert.equal(rows.length, 324);
  assert.equal(rows.filter(k => k.skill).length, 324, "the plural spelling (one letter) is matched");
  assert.ok(rows.every(k => Number.isInteger(k.total)));
});

test("every entry's authored TOL and WILL, and every stat, are its Stat Audit row's", () => {
  const { sources, committed } = real(), p = JSON.parse(committed);
  const audit = B.parseAudit(sources.audit);
  assert.equal(Object.keys(audit).length, 53);
  for (const e of p.entries) {
    const row = audit[e.kind === "npc" ? `${e.name} — ${e.ref}` : e.name];
    assert.ok(row, `${e.ref} (${e.name}) has no audit row`);
    assert.equal(e.block.authored.TOL, row.TOL, `${e.name} TOL`); assert.equal(e.block.authored.WILL, row.WILL, `${e.name} WILL`);
    assert.deepEqual(e.block.stats, row.stats, `${e.name} stats`);
  }
});

test("the ledger's rename and retire: the normal cases, and what each refuses", () => {
  const { ledgerRename, ledgerRetire } = builder();
  const ledger = () => ({ sections: { entries: { Old: "old", Taken: "taken", Kept: "kept" }, groups: { Twin: "twin-g" }, traits: { Twin: "twin-t" },
    origins: {}, npcRoles: {}, enemyRoles: {} }, retired: {} });
  const book = (o = {}) => ({ entries: [], groups: [], traits: [], origins: [], npcRoles: [], enemyRoles: [], ...o });
  // rename: the id moves
  let l = ledger();
  ledgerRename(l, book({ entries: ["New", "Taken", "Kept"] }), "Old", "New");
  assert.deepEqual(l.sections.entries, { Taken: "taken", Kept: "kept", New: "old" });
  // refused: the new name already has an id (nothing else changes)
  l = ledger();
  assert.throws(() => ledgerRename(l, book({ entries: ["Taken", "Kept"] }), "Old", "Taken"), /entries: "Taken" already has an id \(taken\)/);
  assert.deepEqual(l, ledger(), "a refusal changes nothing");
  // refused: the old name is still in the book
  assert.throws(() => ledgerRename(l, book({ entries: ["Old", "New"] }), "Old", "New"), /"Old" is still in the book/);
  assert.deepEqual(l, ledger());
  assert.throws(() => ledgerRename(l, book({ entries: ["Other"] }), "Old", "Other2"), /Nothing to rename/);
  assert.deepEqual(l, ledger());
  // retire: a name gone from the book
  l = ledger();
  ledgerRetire(l, book({ entries: ["Taken", "Kept"] }), "Old");
  assert.deepEqual(l.retired, { entries: ["old"] }); assert.equal("Old" in l.sections.entries, false);
  // retire acts only where the book no longer has the name: Twin is a group and a trait, and the book still prints the trait
  l = ledger();
  ledgerRetire(l, book({ traits: ["Twin"] }), "Twin");
  assert.deepEqual(l.retired, { groups: ["twin-g"] }); assert.equal(l.sections.traits.Twin, "twin-t"); assert.equal("Twin" in l.sections.groups, false);
  // refused: still in the book everywhere, or not in the ledger
  l = ledger();
  assert.throws(() => ledgerRetire(l, book({ groups: ["Twin"], traits: ["Twin"] }), "Twin"), /still in the book/);
  assert.throws(() => ledgerRetire(l, book(), "Nobody"), /not in the ledger/);
  assert.deepEqual(l, ledger());
});

test("no ⚠ reaches the made-up pack, in gear or armor", () => {
  const src = codex(), p = build(src, ledgerFor(src)).pack;
  assert.ok(!JSON.stringify(p).includes("⚠"));
  assert.equal(p.entries[0].block.armor[0], "Tin Coat (PROT 1d4, RES +2)");
});

test("no text anywhere in the Codex pack carries the maintainers' ⚠ mark", () => {
  assert.ok(!real().committed.includes("⚠"));
});

test("the Codex pack's gear is one line per item: none is over a long list, and none splits a price", () => {
  const p = JSON.parse(real().committed), lines = p.entries.filter(e => e.kind === "threat").flatMap(e => e.block.gear);
  assert.ok(lines.length > 100, `${lines.length} gear lines`);
  assert.ok(lines.every(l => l.trim() === l && l.length > 0 && !l.startsWith(", ")));
  assert.ok(lines.every(l => (l.match(/\(/g) || []).length === (l.match(/\)/g) || []).length), "no line cuts a parenthesis in two");
  assert.ok(lines.every(l => !/[;]/.test(l.replace(/\([^)]*\)/g, ""))), "no ; left outside parentheses");
});
