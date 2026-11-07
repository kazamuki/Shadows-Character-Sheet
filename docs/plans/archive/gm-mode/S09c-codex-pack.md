# Work order S9c — The Codex pack: the real book, built from the mirror

**Plan:** [`../gm-mode.md`](../gm-mode.md) §6 *S9*, GQ6, GQ10, GQ12, GQ17,
GQ22 (new).
**Status:** drafted 2026-10-06 by Claude (Opus), after #121 (S9b) merged
with its fix round (README step 7). **§4 answered by Ken, 2026-10-06**, SQ9 changed to the book's labels on the orchestrator's recommendation. Approved to build.
**Branch:** from `main` at or after `aab360b`, PR to `main`. The pack itself
is committed in the private repo; the public PR carries the build's tests,
one engine fix, the npm script and the moved submodule pointer.
**Runs alone.** It touches `engine.js`'s matching helper, `package.json`,
a new test file, the ledger, STATE, and `private/`.

**What S9c is.** S9a built the pack file and S9b the builder, both against a
synthetic pack. S9c turns the real Threat Codex into a
`.shadows-pack.json` a GM can import: the 42 human entries, the 11 roster
NPCs, the 29 encounter groups, the trait glossary, and v2's roles, origins
and tiers. It is **built by a script from the mirror**, not typed by hand,
because the mirror moves (Scott's Codex is still changing) and a rebuilt pack
replaces the old one in a GM's browser (181). What has to survive a rebuild
is **the ids**: a cast member made with Use keeps `from { pack, id }` (182),
and the book renumbers its entries. So the order's centre is an **id ledger**.

No pack shape changes. S9b's claim that 0.2 holds everything S9c needs is
checked below and holds.

**Carried over from S9b's review** (#121, one fix round, three fixes; the
first was the order's):

- **Say what a blank row counts as.** S9b's count treated an empty trait row
  as *written*; the order hadn't said. Here: the builder never writes an
  empty row, and §7 says what each empty source field becomes.
- **Say what a number means where it could be read two ways.** *Dock +1*
  beside a stat the book had already raised needed a line saying so (Ken:
  "more clarification is always a win"). Here: a skill whose name the game
  doesn't know is still kept with its total, and §7 says so.
- **A guard can be unreachable.** S9b's mutation 9 first survived because
  the gate made the check dead code. Here: every builder check (§9) is
  mutation-tested against a synthetic codex that can actually trip it.
- **Names match by case only, and the book uses two apostrophes.** Found in
  this pre-flight, not the review: entries print `’`, the glossary prints
  `'`. S9b's count calls a Use copy of a trait *written* when the glossary
  has it. Fixed here (187).

**Pre-flight** (README, *The pre-flight*), against `main` at `aab360b` and
the mirror at `a25e0c1`. A script parsed the mirror the way §7 says the
builder will:

- **The human Codex parses cleanly.** 42 entries, each with a ref
  (*Entry NN*), a unique name, the role line, a ten-stat table, Health,
  Armor, Skills, Gear, Traits and a GM Note. 29 groups, every composition of
  the form *N× Name (Entry NN)* joined by `+`. 114 glossary traits (17
  Universal, 37 Origin, 60 Signature), every name unique, under section
  heads that give each Origin and Signature trait its origin.
- **The stats against Scott's Stat Audit** (2026-10-03, newer than the
  mirror's Codex): the eight stats and WILL agree everywhere; **TOL differs
  on 9 records**: Entries 08 and 10, and 7 of the 11 roster NPCs (Chen
  3→5, the Archivist 4→6, Kira 3→4, Threadbare 2→3, the Warden 3→5, Juno
  2→3, the Patron 2→6). The audit's TOL is the formula (GQ6, answered:
  the formula, with an override). The audit wins (SQ2).
- **Origin modifiers** agree between v2's table and the human Codex's
  section heads for all seven origins.
- **Skills:** 324 skill entries, 275 matching a game skill by name. The
  other 49 are *Handgun* (38), *Rifle* (10) and *SMG* (1), which the data
  calls *Handguns*, *Rifles* and *SMGs*. The builder matches the one plural
  form (§7); a name that still matches nothing keeps `skill: null`.
- **Gear:** 12 of 42 lines have `;` between items, 8 an *or* between
  alternatives, 3 an *optionally*.
- **Entry traits against the glossary:** 118 named traits on entries, 108
  matching a glossary name. Of the other 10:
  - 2 differ only by the apostrophe (*You’re Not Going Anywhere*, *I’ve Had
    Worse*): 187 fixes the matching.
  - 3 are on the Pointman and in no glossary row (*Controlled Violence*,
    *Clear the Room*, *Take the Hit*).
  - 2 are the glossary's *Know the Gaps* under the entries' own names
    (*Ghost Roads*, *Terrain Native*; the glossary's note says so).
  - 2 are design notes set in bold inside a traits section, not traits
    (*Interface (17) / Programming (17)* on the Architect, *TOL 7 / WILL 5*
    on the Converted).
  - 1 carries a condition in its name (*Sanctified Rosary — if carried*;
    the glossary's row is *Sanctified Rosary*).

  The last eight are the book's, not ours: kept as printed (175) and sent
  to Scott as **GQ22** (SQ5).
- **The shape holds.** Everything maps onto pack 0.2: the roster's title
  (*The Café Owner*) to `ref`, its Push Profile to `ifPushed`, the
  Patron's *Various* origin to `null`, *Enemy Role: None* to `null`, v2's
  tier table to `statGuide` / `traitGuide` / `text`, an enemy role's *T2*
  to `tier`. No field is invented and no pack schema bump is needed.
- **Out of the pack** (SQ4): the drone reference (no shape; a fight's, S10),
  the Trait Library (design prose; the GM screen's, S13), the Apex tier's
  entries (the book has none), and everything supernatural: Orders, the
  review copy, Site Profiles (GQ17, S12). The tier table's T4 row is in
  (it's guidance, and a GM building an Apex reads it).
- **`_folded`** (engine.js, Tables section) is `trim().toLowerCase()` and
  is used only by GM readers (`castFilter`, `castAffiliations`,
  `packFilter`, `packTraits`, `castPackMatch`, `packGroups`): changing it
  reaches no player. But four searches compare a folded query against a
  haystack that is only lower-cased (`.toLowerCase().includes(q)`); those
  fold the haystack too (§7).
- **The ledger** (Decision 130), searched by name: *pack*, *Codex*, *id*,
  *ledger*, *private*, *mirror*, *submodule*, *apostrophe*, *fold*, *match*,
  *contentVersion*. Hits:
  - **167** (the mirror is a private submodule; this builds on it);
  - **180** (a pack's ids are the author's, never renamed; the ledger is
    how the author keeps them);
  - **181** (a newer copy replaces an older one: a rebuild reaches GMs by
    re-import);
  - **182** (`from { pack, id }`: why the ids must survive);
  - **184**, **185** (match by name, case-folded: 187 adds the apostrophe);
  - **68** (no character observes a pack: no `gamedataVersion` bump).
- **Decisions 186, 187** and **GQ22** are free on `origin/main`. Check
  again before pasting.

---

## 1. Goal

A GM imports **one file** and has the book: every human threat, every roster
NPC, every encounter group, and the glossary, on the Threats tab and in the
builder, with the book's own numbers. When Scott changes the Codex, the
mirror is re-pulled, the pack rebuilt and re-imported, and every cast
member a GM copied still points at the entry it came from.

**Done when:**

- `npm run codex-pack` builds `private/gm/threat-codex.shadows-pack.json`
  from the mirror, deterministically (two runs, byte-identical files).
- The pack imports through Home with `?gm=on`, and `migratePack()` changes
  nothing in it: nothing dropped, nothing coerced.
- On the Threats tab: 42 threats, 11 people, 29 groups; every filter has
  the book's origins, roles, enemy roles and tiers; every group's members
  resolve.
- **Use** on any entry gives a cast member whose page shows the origin's
  modifiers with S9b's note, the tier's guides, and a trait count with no
  *written* except where §0's GQ22 list says so.
- **Renumbering survives:** the builder, given a codex whose entries are
  renumbered, gives every entry its old id. Given a renamed or new entry,
  it **stops** and names it. Given `--add`, it records the new one.
- **Typed names match across apostrophes:** *You're* and *You’re* are one
  name in every pack match and search.
- A public test builds the pack and checks it (§9) without a Codex word in
  `tests/`. `npm run verify` passes with the private submodule initialised.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (a build tool, a permanent-id scheme, and a
  matching behaviour someone could choose otherwise).
- **App:** no bump: every changed reader is GM-only and switched off. No
  changelog line (the pack isn't in the app; `changelog-pending.md`'s
  *Threats* line already covers what a GM sees).
- **Game data, character schema, table schema, pack schema:** unchanged.
  The pack's own `contentVersion` is the book's dates (§7).
- **Reserved:** Decisions **186, 187**; **GQ22** in the plan's §9. No
  F-flag: nothing here is a player rule.

## 3. The decisions, drafted

Paste after 185, under INDEX §3's **GM mode** heading, filling **Built**.
**Count each with `wc -w`**; the cap is 350.

```
186. **The Threat Codex pack is built by a script in `private/` from the mirror, and an id ledger keyed by the book's names keeps every record's id across rebuilds.**
     *2026-10-0X · Ken + Claude · Touches: Threat Codex pack, private/gm, build-codex-pack, ids.json, npm run codex-pack, pack meta.id, contentVersion, Stat Audit, Decision 167, Decision 180, Decision 181, Decision 182, GQ6, GQ10, GQ17, GQ22*
     - **Decided:** `private/gm/build-codex-pack.mjs` reads the mirror (the human Codex for entries, groups, the glossary and the tiers' names; v2 for roles, origins, tiers and the roster; the Stat Audit for every stat it lists) and writes `private/gm/threat-codex.shadows-pack.json`, committed in the private repo. `private/gm/ids.json` maps each record's name in the book to a permanent id; renumbering changes only `ref`, and a name the ledger doesn't know stops the build until a person says whether it is new or renamed. Ids are never reused.
     - **Why:** the Codex is still moving, and a rebuilt pack replaces the old (181); cast copies point at entries by id (182), so ids must outlive the book's numbering and survive a re-pull. A person decides a rename because no script can tell a rename from a new entry.
     - **Rejected:**
       - The pack typed by hand: 53 entries and 114 traits re-typed on every Codex change.
       - Ids from the entry number (`entry-07`): the book renumbers.
       - Ids from the name, unrecorded: a rename would silently orphan every copy.
       - The builder in the public `tools/`: it encodes the book's structure, and the public repo shouldn't have to change when the book's layout does (167).
       - The mirror's stats over the audit's: the audit is Scott's newer copy, with TOL corrected (GQ6).
     - **Replaces:** nothing.
     - **Revisit if:** Scott keeps the Codex as structured data of his own, his documents are combined (a reconciliation pass over the ledger, the whole Codex at once), or GQ17 brings the supernatural sections in.
     - **Built:** pack content `<contentVersion>`; PR #__; private repo `<commit>`; log 2026-10-0X.

187. **Pack names match with case and apostrophes folded: `’`, `‘` and `ʼ` read as `'`, in every match and search.**
     *2026-10-0X · Ken + Claude · Touches: _folded, castPackMatch, packFilter, packTraits, packGroups, castFilter, castAffiliations, trait count, Decision 184, Decision 185*
     - **Decided:** the engine's name folding maps the three typographic apostrophes to `'` before comparing, on both sides of every comparison: a typed name against a record, and a search against the text it searches.
     - **Why:** the book prints `’` in entries and `'` in the glossary, so a Use copy's trait counted as *written*; and a GM's keyboard types `'`.
     - **Rejected:**
       - Normalising the apostrophes in the built pack: it fixes the book's own mismatch but not a GM typing, and it changes the book's text.
       - Folding every punctuation mark: dashes and quotes carry meaning in names (*Sanctified Rosary — if carried*).
     - **Replaces:** nothing. 184 and 185's "case-folded" now also folds apostrophes.
     - **Revisit if:** a pack's names differ by another character a GM can't type.
     - **Built:** as 186.
```

**Supersession marks:** none. If the ledger search at build time finds a
decision either overrides, stop and ask.

## 4. Questions for Ken

Answered by Ken, 2026-10-06. Each row keeps the default it offered.

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **The builder, its ledger and the built pack live in `private/gm/`**, run from the public repo by `npm run codex-pack`. The public repo carries only the tests, which read no Codex words. | **Yes** | **Yes** |
| SQ2 | **Where each part comes from:** entries, groups and glossary from the human Codex; roles, enemy roles, origins, tiers and the roster from v2; **every stat, TOL and WILL from the Stat Audit** where it lists the record (9 TOLs differ from the mirror; the audit is newer). | **Yes** | **Yes.** The sources may change; the shape holds |
| SQ3 | **Ids:** a ledger keyed by the book's name. Renumbering changes `ref` only. A new or renamed name stops the build; `--add "<name>"` records a new one as a slug, `--rename "<old>" "<new>"` moves an id to a new name. A retired id is kept in the ledger and never reused. | **Yes** | **Yes.** A later pass may reconcile the ledger when Scott combines documents: the whole Codex at once, a session of its own |
| SQ4 | **Out of the pack:** the drone reference (S10), the Trait Library (S13), anything supernatural (S12, GQ17). The T4 tier row is in. | **Yes** | **Yes.** None of the four is built here; each comes in once approved |
| SQ5 | **The book's quirks kept as printed** (175: a block is what the book prints): the Architect's and the Converted's bold design notes stay in their traits; *Sanctified Rosary — if carried* keeps its name. All eight trait mismatches go to Scott as **GQ22**. Or move the two design notes into the entry's GM Note? | **As printed**, and GQ22 | **As printed**, and GQ22 |
| SQ6 | **Gear:** one block line per `;`-separated part, *or* and *optionally* kept inside the line, as the book wrote them. | **Yes** | **Yes.** **Changed in the fix round (Ken, #123):** one line per *item*: split on `;` and on a comma followed by a space, outside parentheses; a comma after a dash (` — `) stays in its line, and the builder warns of each such line; `or` and `optionally` still stay inside theirs. The maintainers' ⚠ is stripped, with the space before it (armor lines too) |
| SQ7 | **The roster:** `kind: "npc"`, `name` the person (*Bob*), `ref` the title (*The Café Owner*), the Push Profile and the *Use Entry 05…* line under it in `ifPushed`, no Health or armor (the roster prints none), and a block with the stats and skills. | **Yes** | **Yes** |
| SQ8 | **The pack's name and version:** `name` *Threat Codex (human origins)*; `contentVersion` the sources' dates, *Codex 2026-09 · v2 2026-10-02 · audit 2026-10-03*. `meta.id` fixed once in the ledger: `PK-C0DEX7H4`. | **Yes** | **Yes** |
| SQ9 | **Tier names:** v2's table has none, so `name` is empty and the builder chip reads *Tier 2* (S9b's fallback). Or use the *How to Read* labels (*Baseline pressure*, *Specialist function*…)? | **Empty**, the book names none | **The book's labels** (Ken took the recommendation: a chip reading *Tier 2* beside a field reading 2 tells the GM nothing). Only the first letter is capitalised |
| SQ10 | **Apostrophe folding (187) in this PR**, not a fix session of its own. | **Yes**: it's what makes the real pack's count right | **Yes** |

## 5. Read first

- `CLAUDE.md` whole, especially constraints 6 (ids), 9, 10, the versions
  table, and *Decisions*.
- `docs/STATE.md` whole; `private/README.md` (two commits per private
  change) and `private/crb/README.md` (each mirror file's source and date).
- The plan: §6 *S9*, §9 GQ6, GQ10, GQ12, GQ17.
- `docs/SCHEMA.md` §3's *pack file* block; Decisions **167**, **175**,
  **180**, **181**, **182**, **184**, **185**.
- `S09a-pack.md` §7 and `S09b-builder.md` §7: the pack's shape, field by
  field.
- **The code:** `engine.js`'s `migratePack`, `packCheck`, `_block`,
  `_folded` and every caller of it, `packFilter`, `packTraits`,
  `castPackMatch`, `packGroups`; `tests/rules.test.mjs`'s `crb()` (how a
  test fails loudly without the mirror); `tests/harness.mjs`'s
  `loadEngine`.
- **The mirror:** `Threat_Codex_Intro_Human.md` (one entry, one group, the
  glossary's first table and an Origin section), `WIP_Threat_Codex_v2.md`
  (*NPC Roles*, *Enemy Roles*, *Origin Modifiers*, *Tiers*, one roster
  NPC), `Threat_Codex_Stat_Audit.md` (*Audit*).

## 6. Out of scope

- Any pack schema change, any `migratePack` change, any UI change.
- The drone reference, the Trait Library, the supernatural sections, Site
  Profiles, Orders (SQ4).
- Editing the mirror. A quirk in the book is GQ22's, not a fix.
- GQ6's change to what the block shows for TOL and WILL (its own session).
- Shipping the pack anywhere. Ken hands it out.
- Any Codex word (a name, a trait, a role, an origin, a section title) in
  `src/`, `tests/` or `tools/`.

## 7. The shapes

**Files in `private/gm/`** (new folder; `private/README.md`'s *Planned*
line becomes a row):

```
private/gm/build-codex-pack.mjs        // node, no dependencies; exports buildPack(); runs it when called directly
private/gm/ids.json                    // the ledger (below), committed, edited by --add / --rename only
private/gm/threat-codex.shadows-pack.json   // the output, committed
```

**`buildPack({ human, v2, audit, ledger, Engine, D })`**, pure, returns
`{ pack, problems, warnings }`. Also exported: `parseAudit(audit)` →
`{ "<name>": { stats, TOL, WILL } }`, for the tests.

- `human`, `v2`, `audit`: the three mirror files' text. `Engine` and `D`:
  the engine and the game data (stat ids, skill names, Health), loaded by
  the CLI from `src/` the way `tests/harness.mjs`'s `loadEngine` does.
- `problems`: an array of strings. **Any problem stops the CLI** (exit 1,
  each printed, nothing written). The checks:
  - a record name not in the ledger (*new or renamed: "<name>" (Entry 07)*);
  - two records with one name in the same section;
  - an entry's printed Health that isn't `Engine.npc(block)`'s Health;
  - a composition member naming an entry ref that isn't parsed;
  - an origin modifier that differs between v2 and the human Codex section;
  - an entry's role, enemy role or origin naming nothing in the pack's
    lists;
  - a stat in the audit that isn't a whole number;
  - a section the parser expected and didn't find (no glossary, no tier
    table, no tier label in *How to Read*): a structure change in the book.
- Deterministic: records in the book's order, keys in a fixed order, no
  timestamps but `meta.created` and `meta.updated`, which come from the
  ledger (`created` fixed at first build; `updated` the newest source date).

**The ledger, `ids.json`:**

```js
{
  "packId": "PK-C0DEX7H4",
  "created": "2026-10-0XT00:00:00.000Z",
  "sections": {
    "entries":    { "<name in the book>": "<id>" },   // threats and roster NPCs share one map: one id space
    "groups":     { "<name>": "<id>" },
    "traits":     { "<name>": "<id>" },
    "origins":    { "<name>": "<id>" },
    "npcRoles":   { "<name>": "<id>" },
    "enemyRoles": { "<name>": "<id>" }
  },
  "retired": { "entries": ["<id>"] }                    // an id whose name left the book: never reused
}
// tiers need none: a tier's id is its number.
```

- **Keys are the book's name, apostrophes folded (187) and trimmed**, so a
  `’`/`'` change isn't a rename.
- **Ids:** a slug of the name at first record (`a`–`z`, `0`–`9`, `-`, up to
  32, leading *The* dropped), unique within the section; a clash takes `-2`.
  Every id passes `RECORD_ID_RE`.
- **CLI flags:** `--add "<name>"` (records a new name with a fresh slug),
  `--rename "<old>" "<new>"` (moves the id; the old key goes),
  `--retire "<name>"` (moves its id to `retired`), `--init` (first build
  only: records every name; refuses if the ledger has any). The build
  itself never edits the ledger.
- A name in the ledger that the book no longer has is a **warning**, not a
  problem: it prints, and the build continues (a GM's copies keep their
  name; `entryLink` already handles a missing entry).

**The pack, field by field** (pack 0.2; every field already exists):

| Pack field | From | Rule |
|---|---|---|
| `meta` | ledger, SQ8 | `kind`, `id`, `name`, `packSchemaVersion: "0.2"`, `contentVersion`, `created`, `updated` |
| `origins[]` | v2 *Origin Modifiers* | `name` as printed (*Street*); `text` the stat profile and formation notes, two paragraphs; `modifiers` parsed from the modifier cell (`–` is a minus) |
| `npcRoles[]` | v2 *NPC Roles* | `name`; `text` the three columns as three short lines, each with its column's heading |
| `enemyRoles[]` | v2 *Enemy Roles* | `name`; `tier` from *T1*–*T4*; `text` the function, what removing them does, and the pressure, as three lines |
| `tiers[]` | v2 *Tiers*; the human Codex's *How to Read an Entry* | `id` 1–4; `name` the *Tier* row's label for that tier (*T2 (specialist function)* → *Specialist function*; each the whole bracketed label, first letter capitalised: T4/Apex's is *Campaign-level, one-of-a-kind*; SQ9); `text` the encounter-role column; `statGuide` the stat-profile column; `traitGuide` the traits column |
| `traits[]` | human *Trait Glossary* | `name`, `text` the mechanical summary; `kind` from the type column, lower-cased; `origin` from the section head it sits under (an origin's id), `null` under Universal and Drone |
| `entries[]` (42 threats) | human *ENTRY NN* | `kind: "threat"`; `ref` *Entry NN*; `name`; `flavor` the blockquote line; `description` the paragraphs before the stat table; `gmNote` the GM Note blockquote's text; `origin` the section's origin; `npcRoles` and `enemyRole` the role line, split on `/`, `None` → null; `tier` the number; `motivation`, `resources`, `line`, `ifPushed` "" |
| `entries[].block` | the stat table, the audit | `stats` and `authored` (TOL, WILL) **from the audit row** (SQ2); `skills` `[{ name, total, skill }]` with `skill` the data's id by name, else by name + `s`, else `null`; `armor` the Armor line's text, one line, ⚠ stripped; `gear` one line per item (SQ6, changed in the fix round), ⚠ stripped; `traits` `[{ name, text }]` from each bold-named paragraph under TRAITS, as printed (SQ5) |
| `entries[]` (11 roster) | v2 *NPC Roster* | `kind: "npc"`; `name` before the dash, `ref` after it (SQ7); `flavor` the italic line; `description` the paragraphs; `motivation`, `resources`, `line` (*Their Line*), `ifPushed` (with any blockquote under it), `gmNote`; roles from the role line (`None` → null, *Various* → `origin: null`); `tier` null; `block` stats from the audit, skills from **Skills:**, armor, gear and traits empty |
| `groups[]` | human *ENCOUNTER GROUPS* | `ref` *EG-NN*; `name`; `origin` the section's; `members` from the composition by entry ref → id; `situation`; `tactics` |

**Text:** markdown emphasis stripped (`**`, `*`), HTML entities decoded, `<br />`
a newline, paragraphs joined by a blank line, nothing else changed. No text
is ever empty because a parse failed: a field the book has and the parser
didn't find is a problem, not a `""`.

**Engine, 187** (Tables section):

```js
const _fold = v => _str(v).replace(/[‘’ʼ]/g, "'").trim().toLowerCase();   // was _folded's body
// _folded stays the name every caller uses: const _folded = _fold.
// Every `.toLowerCase().includes(q)` against a folded q folds its haystack with _fold instead:
// castFilter, packFilter, packTraits, packGroups. Grep for `.toLowerCase().includes(` in the Tables
// and Packs sections; each one is in scope.
```

Nothing in the player's half reads `_folded`; check with a grep and say so
in the PR.

## 8. The UI

None. The pack goes through S9a's import and S9b's builder unchanged. §1's
*Done when* is checked in the browser with the real pack.

## 9. Tests

**`tests/codexpack.test.mjs`** (new; add it to any guard that lists test
files by hand). It needs the mirror; without it, it fails loudly with the
fix, as `rules.test.mjs`'s `crb()` does. **It names no Codex word**: it
checks counts, shapes and ids.

*The real pack:*

- The committed pack equals a fresh `buildPack()` of the mirror, byte for
  byte (`JSON.stringify(pack, null, 2) + "\n"`). A mirror moved without a
  rebuild fails here, with the fix (`npm run codex-pack`).
- `problems` is empty.
- `migratePack(clone)` deep-equals the pack: nothing dropped or coerced.
  `packCheck` reports nothing.
- Counts: 7 origins, 9 NPC roles, 8 enemy roles, 4 tiers, 114 traits, 53
  entries (42 `threat`, 11 `npc`), 29 groups.
- Every group member resolves to an entry; every entry's roles and enemy
  role resolve; exactly one entry has `origin: null`.
- Every id passes `Engine`'s record-id rule; no id repeats within a section;
  every ledger id is in the pack or in `retired`.
- `Engine.npc(entry.block)`'s Health equals the printed Health for every
  threat (the builder checked it; the test proves the engine agrees).
- Every entry trait whose name a glossary has, after 187's folding: at
  least **110** of 118. (A number, not names: GQ22's eight are the rest.)
- Skills: all **324** of the threats' skill rows have a `skill` id.
- Every entry's authored TOL and WILL equal its audit row's (mutation 5).

*`buildPack()` on a synthetic codex* (built in the test from template
strings, made-up names grepped against `private/crb/` before use):

- **Renumbered:** the same names under new entry numbers → the same ids,
  new `ref`s, groups' members still resolve.
- **Renamed:** one name changed → a problem naming it, and no pack.
- **New:** an extra entry → a problem naming it; with the ledger given that
  name (as `--add` would), the pack has it with a fresh slug.
- **Retired:** a ledger name gone from the book → a warning, the pack
  without it, and a fresh entry with the same slug gets `-2`.
- **Apostrophes:** an entry renamed only `'`→`’` → the same id, no problem.
- **Health mismatch, bad composition ref, modifier disagreement, missing
  glossary:** each → its problem.
- `buildPack` twice → identical output.

**`tests/engine.test.mjs`**, *187*:

- `castPackMatch`: a block trait `You’re X` against a glossary `You're X`
  (synthetic names) matches; `‘` and `ʼ` too.
- `packTraits` with `q: "you’re"` finds the `'` trait, and the reverse.
- `castFilter` and `packFilter` searches likewise.

**Mutation-test** (record each in the PR, and what failed):

1. **Key the ledger by `ref`** instead of name → *renumbered* fails.
2. **Skip the unknown-name check** (silently slug it) → *renamed* fails.
3. **Reuse a retired id** → *retired* fails.
4. **Drop the apostrophe fold from the ledger key** → *apostrophes* fails.
5. **Take TOL from the mirror's table, not the audit** → the test that
   every entry's authored TOL and WILL equal the audit's row (read with the
   builder's exported `parseAudit`, numbers only) fails on the 9 records
   §0 lists. Write that test first: the byte-for-byte test alone wouldn't
   catch it, since the mutant would rebuild the committed file too.
6. **Fold only the query, not the haystack** in `packTraits` → the
   reverse-search test fails.
7. **Remove the plural skill match** → the skills count fails.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and
after each step.

1. Confirm 186, 187 and GQ22 free on `origin/main`. Grep every made-up name
   you'll use in tests against `private/crb/`.
2. **187** in the engine, with its tests. Verify.
3. `private/gm/build-codex-pack.mjs`: `buildPack()` and the CLI, against the
   synthetic codex tests first.
4. `--init`: write `ids.json` from the mirror, then the first build.
   Read the ledger by eye: every slug sensible, no `-2` you didn't expect.
5. `tests/codexpack.test.mjs` against the real pack. Then the seven
   mutations.
6. `package.json`: `"codex-pack": "node private/gm/build-codex-pack.mjs"`.
7. **In the browser** (`shadows-dev-preview`, `?gm=on`): import the built
   pack through Home. The Threats tab's counts and filters; three entries'
   pages against the book (one per tier); one group; Use on a T3 entry, its
   page's modifiers note, guides and trait count; the picker's glossary with
   *Origin* and *Signature*; a roster NPC's page. Remove and re-import:
   *Replace* (181), and the copy still opens its entry.
8. **The private repo:** the submodule is checked out on a detached HEAD, so
   first `git -C private switch main` (it must be at the pinned commit; if
   `main` has moved past it, stop and ask). Commit `private/gm/` and the
   README row there and push `main`, then commit the moved submodule pointer here. The two commits
   are named in the PR.
9. Ledger, plan (§6 S9 *built*, §9 GQ22), docs, close-out.

## 11. Stop and ask

- 186, 187 or GQ22 are taken.
- You can't push to the private repo.
- A Codex word would land in `src/`, `tests/` or `tools/`.
- The mirror doesn't parse as §0 says: a count is off, a section is
  missing, a composition doesn't match its form. The book moved; ask before
  adapting the parser.
- Any pack schema or `migratePack` change seems needed.
- `--init`'s ledger has a slug clash you can't explain.
- A decision goes over 350 words.
- A test outside the ones named fails and the fix isn't obviously yours.

## 12. Close-out

*Rule or shape* tier:

- **SCHEMA:** 186, 187. §3's pack block gains one line under its prose:
  *The Threat Codex pack is built from the mirror by
  `private/gm/build-codex-pack.mjs`; its ids are kept in
  `private/gm/ids.json` (186).*
- **INDEX:** two lines under **GM mode**.
- **CLAUDE.md:** the *Commands* block gains `npm run codex-pack`, with a
  three-word note (*the GM's pack*). Nothing else.
- **STATE:** §1's GM clause gains the Codex pack (186) and the apostrophe
  (187); §5: S9c built; next is GQ6's block session or S10 (the plan says
  which).
- **The plan:** §6 *S9* built; §9 gains **GQ22** for Scott (§0's eight
  trait names: the Pointman's three missing from the glossary, *Know the
  Gaps*' two other names, the two design notes, the Rosary's name), and the
  *Handgun*/*Handguns* spelling as a line in it.
- **`private/README.md`:** `gm/` becomes a row.
- **Log** entry (the pre-flight's numbers are its evidence); **shipped** row
  *(switched off)*.
- README's table: S9c's row.
- **PR** titled `feat(gm): the Codex pack, built from the mirror (W29 S9c,
  Decisions 186–187)`. Body: what changed; the private commit; the seven
  mutations; the browser check; **Where the order didn't fit**.

## 13. Review checklist

- [ ] `npm run codex-pack` twice: byte-identical; then edit one entry's
      number in a scratch copy of the mirror and rebuild: same ids.
- [ ] The real pack in the browser: counts, filters, three entries against
      the book, a group, Use, the builder's guidance and count, a roster
      page; re-import replaces.
- [ ] `ids.json` read by eye: every slug sensible.
- [ ] No Codex word in `src/`, `tests/`, `tools/` (grep the glossary's
      names, the entries' names, the origins and roles).
- [ ] 187: grep shows every `.includes(` against a folded query folds its
      haystack; nothing in the player's half calls `_folded`.
- [ ] The seven mutations are real; re-run at least two locally.
- [ ] The private commit is pushed and the pointer moves to it; CI's
      checkout can read it.
- [ ] No version bump; `packSchemaVersion` still 0.2.
