# Work order S9a — The pack: a file a GM slots in, and the Threats tab

**Plan:** [`../gm-mode.md`](../gm-mode.md) §2, §4b, §6 *S9*, GQ10; W62 and
W63 (`WISHLIST.md`).
**Status:** drafted 2026-10-05 by Claude (Opus), after reviewing S8b's PR
(#117). **§4 answered by Ken, 2026-10-05** (every default taken). Ready to build once Ken approves the order.
**Branch:** from `main` **once #117 and its fix round are merged**, PR to
`main`, switched off (Decision 173).
**Runs alone.** It touches `engine.js`'s Tables section, `gm.js`, one line
of `wizard.js`, the ledger, `CLAUDE.md`'s versions table, the table schema
and STATE.

**What S9a is, and what it isn't.** The plan's S9 is four things: the pack
(a file, its gate, its storage, its import), the rolodex, the builder, and
the real Codex pack. That is S8's size twice over, and the parts don't need
each other in one session. Split, as S8 was (SQ1):

- **S9a (this order):** the pack file and everything that makes it safe to
  slot in; a **Threats** tab that reads it (entries, named NPCs, encounter
  groups, by search, origin, role and tier); and **Use**, which copies an
  entry into the cast. Tested against a **synthetic** pack.
- **S9b:** the builder (origin modifiers at construction, the tier's ranges
  beside each stat, the trait budget, traits from the glossary), and the
  cast's text matched to the pack's names (174 promised it "in S9").
- **S9c:** the real Codex pack, built from `private/`. Content: no app
  change, if S9a's shape is right. Its own short order.

Use **into a fight** is S10's.

**Carried over from S8b's review.** S8b's build was close to its order; the
review's findings were small. These are the order's, and S9a is written
against them:

- **Walk every delete through every view.** S8b's worst finding was a
  record that reached no view: an interaction with no crew name, once its
  member was deleted, showed nowhere, though the file kept it. S8a's
  lesson was the same one from a filter. **§8 has a *Reachable after*
  column**: after each remove, everything that remains can still be found
  on some screen.
- **Every draft the GM types lives on `S`, not only in the field.** S8b kept
  the add row's kind, crew and date on `S.intAdd`, but not *What*; a redraw
  from elsewhere on the page wiped a half-typed line. Here: the rolodex's
  search and filters, on `S`.
- **Key a focus target by an id, never a list position.** S8b's Back
  focused `[data-cwhere="0|…"]`, a group's index; a new crew name sorting
  first moved it. Here every `data-*` a press returns focus to carries an
  entry, group or pack id.
- **`aria-label` on an element with no role is not read.** S8b's struck
  name used `<s aria-label>`, which screen readers skip. Visible text, or
  visually hidden text, says it.
- Still true: the screenshot tool sometimes times out (it worked in S8b's
  review); metrics are the fallback proof at 390px. `toISOString()` is UTC.
  Mutation tests assert state (`aria-pressed`, a field's value), not only
  focus, because `keepPlace` restores focus by `data-*` through a full
  redraw. Count each decision with `wc -w` against the 350-word cap.

**Pre-flight** (README, *The pre-flight*), against `main` at `43778f4` with
#117's head `aa624b5` read alongside, since S9a builds on both. **Re-run the
greps once #117's fix round is merged**; what moved goes under *Where the
order didn't fit*.

- **The plan says the rolodex goes "through `openCatalog` (118) as a new
  `kind`".** It can't: `openCatalog(kind)` (`sheet.js:2351`) returns unless
  `S.ch` is open and `kind` is weapons, armor or gear, buys through
  `Engine.addLoadout`, and lives in `sheet.js`, which GM sessions don't
  edit. A modal also hides the list a GM is choosing from on a tablet. The
  rolodex is a **tab** in `gm.js`, built on the Cast tab's pattern (list,
  filters, a page per record). 182 says so.
- **`Engine.fileKind(obj)`** returns `"character"` when `meta` or
  `meta.kind` is missing, `"table"` for `"shadows-table"`, else
  `"unknown"`. It gains `"pack"`.
- **Home's Import routes by kind in `wizard.js`** (in `renderHome`'s
  `file-import` handler): `if (kind==="table" && featureOn("gm")){
  gmImportTable(raw); return; }`, then `kind!=="character"` → `notice(...)`.
  A pack can't reach `gm.js` without that line changing. 172 allows three
  call-in points, and this is the third (*"Home … routes an imported
  table"*): it widens to `gmImportFile(raw, kind)` for a table or a pack.
  **That one line is the only edit outside `gm.js`, `engine.js`, the CSS,
  tests and docs.** `GM_NOT_A_FILE` (`gm.js:12`) names a pack too.
- **Home's table list** is `gmTablesHtml(tables)`, which returns `""` with
  no tables. *Your packs* is drawn from `gm.js` in the same call, so Home's
  markup in `wizard.js` doesn't change; it must show with no tables.
- **Storage by the roster's pattern**: `TABLE_PREFIX`, `readTableEntry`,
  `tableEntries()`, `guardReplaceTable` (newer `meta.updated` replaces
  silently, older asks). Packs copy the pattern under their own prefix, as
  tables copied the roster's (the comment above `tableSupersedes` says why
  it's copied, not shared).
- **`_block(b)`** (175) coerces a stat block in place; `Engine.npc(block)`
  reads one on a copy. A pack's entry carries a block, so both are reused
  as they are.
- **`addCastMember(t, f)`** makes a member from a name and a line only;
  `CAST_TEXT` is `name flavor description origin enemyRole motivation
  resources line ifPushed gmNote`. *Use* needs a fuller constructor; it
  goes beside `addCastMember`, not into it.
- **`TABLE_SECTIONS`** is `[cast, notes]`, each `{ id, label, ui }`, where
  `ui` is an icon id from `shadows-icons.js` (the `tab_*` set: archetype,
  loadout, main, notes, progression, sessions, skills, trackers, traits).
  `bindTable` picks the notes binder by `[data-tnew]`, else the cast's by
  `S.tsection==="cast"`. A third section needs its own branch there.
- **Tests that pin today's numbers:** `engine.test.mjs` uses `"0.4"` as
  *a newer table* (around the `tableSchemaVersion` tests) and `"0.3"` as
  current; after 0.4 they become `"0.5"` and `"0.4"`. `docs.test.mjs`
  (~line 337) checks STATE's table schema against `newTable()`; the pack
  schema gets the same check.
- **`CLAUDE.md`** says "Versions — five of them". The pack schema makes six
  (180). `docs.test.mjs`'s version-agreement test reads specific files;
  check whether it parses that table before editing it.
- **The ledger** (Decision 130), searched by name: *pack*, *Codex*,
  *rolodex*, *catalog*, *openCatalog*, *import*, *fileKind*, *Home*,
  *storage*, *Threats*, *entry*, *version*. Hits: **118** (the catalog
  browser: not reused, cited in 182's *Rejected*), **170** (*Revisit if: a
  pack needs a kind this can't name*: it has happened, and 180 answers it
  without changing 170), **171** (Home's one Import: extended, 181),
  **172** (the call-in points: kept at three, 181), **174** (the cast's
  text "matched to the pack by name in S9": moved to S9b, 182 says so),
  **175** (the block, reused), **167** (the Codex lives in `private/`).
  W62 and W63 are wishlist, not ledger.
- **Decisions 180, 181, 182** assume #117 merges with 177–179. Check
  `origin/main`'s ledger before pasting; if a parallel branch took any,
  renumber this order's own uses only.

---

## 1. Goal

A GM **slots a pack into the browser once**, and every table they run can
read it: a **Threats** tab lists its threats, its named NPCs and its
encounter groups, filtered by origin, role and tier, each one readable as
the book prints it, with Health worked out. **Use** puts a copy of an entry
in the cast, which the GM then renames and changes freely; the copy
remembers where it came from. The pack never enters a table file.

**Done when:**

- Switched off: nothing changes anywhere, and a pack file imported on Home
  is refused as *"That file isn't a character."*
- Switched on, Home's **Import a file** takes a `.shadows-pack.json`.
  Home lists it under **Your packs** (name, content version, how many
  entries, when slotted in) with **Remove**, with or without any tables.
- A table has a **Threats** tab, second. With no pack it says so and offers
  the import there too (SQ6). With one, it lists entries; a toggle shows
  *Threats · People · Groups* (voice pass); search, origin, role and tier
  filter, in the pack's own order.
- An entry's page shows everything the book prints: name, its reference
  (*Entry 01*), roles, tier, flavor, description, the stat block with
  Health and HP derived, skills, armor, gear, traits, GM note. Origins and
  roles carry their pack text as a tip (139).
- A group's page lists its members (each a button to that entry), the
  situation and the tactics.
- **Use** on an entry adds a copy to the table's cast and opens it (SQ4).
  The member's page says *From <entry name>*; if the pack is slotted in,
  that's a button to the entry.
- Removing the pack leaves every copy whole. A table opened without the
  pack still shows *From <entry name>*, as text.
- A newer copy of the same pack replaces the old silently; an older one
  asks first.
- A hostile pack opens, renders as text, and every id, number, name and
  link comes out valid or dropped; a pack with no valid id is refused.
- A 0.3 table opens as 0.4, every member with `from: null`.
- `npm run verify` and `npm run phone-check` pass; the tab, an entry, a
  group and Home checked at 390px and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (a third kind of file, its gate and storage, a
  sixth version, the table's shape).
- **App:** no bump (switched off). One line to `changelog-pending.md`.
- **Game data, character schema:** unchanged. No character can observe a
  pack (Decision 68).
- **Table schema:** **0.3 → 0.4**: a cast member's `from` (182).
- **Pack schema:** new, **0.1**, a sixth row in `CLAUDE.md`'s versions
  table (180). The pack's **content version** is the author's text, shown,
  never compared and never bumped by us.
- **Reserved:** Decisions **180, 181, 182**. No F-flag.

## 3. The decisions, drafted

Paste after 179, under INDEX §3's **GM mode** heading, filling **Built**.
Counted as drafted with `wc -w`: 180 is 339 words (a dozen to spare), 181 is 265,
182 is 301. **Recount after filling Built**; the cap is 350. If one goes
over, trim its *Why*, not a *Rejected* line.

```
180. **A pack is its own file, `.shadows-pack.json`, gated by `migratePack()`, with its own id, a pack schema version, and the author's content version.**
     *2026-10-0X · Ken + Claude · Touches: pack, .shadows-pack.json, migratePack, packCheck, fileKind, meta.kind, PK- id, packSchemaVersion, contentVersion, origins, npcRoles, enemyRoles, tiers, entries, groups, versions table, CLAUDE.md, Decision 170, W63, GQ10*
     - **Decided:** A pack is `{ meta, origins, npcRoles, enemyRoles, tiers, entries, groups }` (shape in SCHEMA §3). `meta.kind` is `"shadows-pack"`; `meta.id` is `PK-` and eight TAG-alphabet characters, issued by whoever builds the pack and kept across its versions. `migratePack()` is its gate, as `migrateTable()` is a table's: total, every string a string, every number a whole number or null, a record with a bad or repeated id dropped, an entry's block through 175's gate, unknown keys kept, never read. A pack with no valid id is refused. The pack schema is a sixth version with its own row in `CLAUDE.md`. `contentVersion` is the author's text; the app shows it and never compares it.
     - **Why:** GQ10 made the Codex a file a GM slots in; a file made to be handed around is untrusted (124). W63 wants the same mechanism for the core game, so the kind names a pack, not a Codex.
     - **Rejected:**
       - A pack as a kind of table: a table is the GM's own work, exported and shared; a pack is someone else's book, imported once.
       - Renaming a bad id, as a table does: a cast copy would point at nothing on the next import.
       - Comparing content versions to decide which copy is newer: authors write them as they like; `meta.updated` decides, as a table's does.
       - A Codex-only kind: W63's core pack would need a second.
     - **Replaces:** nothing. It answers 170's *Revisit if* (a pack needs a kind) with a third kind beside it.
     - **Revisit if:** W63's core pack needs a section a GM pack can't hold, or two packs need to name each other.
     - **Built:** pack schema 0.1; PR #__; log 2026-10-0X.

181. **Packs live in the browser, one key each, outside every table; Home's one Import slots one in, and Home lists them with Remove.**
     *2026-10-0X · Ken + Claude · Touches: shadows.pack.v1, Your packs, Import a file, gmImportFile, GM_NOT_A_FILE, Remove, replace guard, Home, wizard.js, Decision 171, Decision 172, W62, GQ9, GQ10*
     - **Decided:** Each pack is one `localStorage` key, `shadows.pack.v1.<id>`, holding `{ pack, imported }`. Every table reads every pack in the browser; no table file holds pack content. With GM mode on, Home's **Import a file** reads a pack (the line in `wizard.js` that routes a table routes either, through `gmImportFile`), and Home lists **Your packs** with **Remove**, which asks. A newer copy of a pack (`meta.updated`) replaces the old silently; an older one asks.
     - **Why:** one Codex serves every table a GM runs, and a table file a GM shares with a co-GM must not carry a confidential book with it (167, GQ10). It is the third call-in point 172 already allows, widened, not a fourth.
     - **Rejected:**
       - The pack inside each table: a copy per table, and the Codex leaves with every exported table.
       - A second Import button on Home: 171's reason.
       - Export on a pack: the GM was handed the file; Remove says so.
       - W62's loading screen now: it's one primitive for every import, a session of its own.
     - **Replaces:** Decision 171 in part: Home's one Import reads a pack too, and Home lists packs.
     - **Revisit if:** storage fills (GQ9), or a GM wants a pack for one table only.
     - **Built:** as 180.

182. **A table's Threats tab reads the packs: threats, people and groups, filtered by search, origin, role and tier; Use copies an entry into the cast, which keeps where it came from.**
     *2026-10-0X · Ken + Claude · Touches: Threats tab, TABLE_SECTIONS, rolodex, packFilter, entry page, group page, Use, castFromEntry, from, { kind: "entry" } link, cast member, table schema 0.4, migrateTable, openCatalog, Decision 118, Decision 174, Decision 178, W29, GQ1*
     - **Decided:** `TABLE_SECTIONS` gains **Threats**, second. It lists every slotted pack's entries, a toggle showing threats, people or groups, filtered by search, origin, NPC role, enemy role and tier, in the pack's order. An entry's page shows the book's fields and `Engine.npc`'s Health; a group's lists its members. **Use** adds a copy to the cast: its text, roles and origin as their names, its block copied, and `from: { kind: "entry", pack, id, name }` (table schema 0.4). The copy never changes with the pack. The name is stored, because the pack lives outside the table (178's link otherwise). Matching a hand-made member's text to a pack's names is S9b's.
     - **Why:** Scott's one tool tomorrow is "a roster of enemies to quickly reference" (§1a). A tab keeps the list in view on a tablet.
     - **Rejected:**
       - The rolodex as an `openCatalog` kind (the plan's sketch): it is the character's, in `sheet.js`, and a modal hides the list.
       - A live link to the entry: a pack update would rewrite a GM's NPC.
       - Use into a fight: S10.
     - **Replaces:** Decision 174 in part: matching cast text to the pack moves to S9b. Decision 178 in part: a link to a record outside the table stores its name.
     - **Revisit if:** S10's fight needs a live entry, or W63's core pack shares this tab.
     - **Built:** as 180.
```

**Supersession marks:** 171 → `→ **Superseded in part by Decision 181** — Home's one Import reads a pack too, and Home lists packs.` 174 → append `; **in part by Decision 182** — matching cast text to a pack moves to S9b.` to its existing mark. 178 → `→ **Superseded in part by Decision 182** — a link to a record outside the table stores its name.` Mark the three INDEX lines likewise.

## 4. Questions for Ken

All nine answered by Ken, 2026-10-05: every default taken. On SQ1, Ken: splitting keeps each review cycle small, which has worked so far. On SQ2: the app reads our own file kinds rather than inventing a new one per use.

| # | Question | Answer |
|---|---|---|
| SQ1 | **Split S9** into S9a (pack, Threats tab, Use), S9b (builder, glossary, matching cast text), S9c (the real Codex pack, built in `private/`)? | **Yes** |
| SQ2 | **One pack kind for the GM's book and W63's core game?** `meta.kind: "shadows-pack"`, sections by name; S9a reads the GM sections and keeps any other | **Yes**: W63 would otherwise need a second file kind |
| SQ3 | Packs **browser-wide, outside tables**; a table file never carries pack content? | **Yes**: a shared table mustn't carry the Codex |
| SQ4 | **Use opens the copy** on the Cast tab (rename Street Tough to Vinnie at once), or **stays on the entry** with a toast and a count (*In the cast: 2*) for pulling three at a time? | **Opens the copy.** Three of a kind is S10's fight, not the cast |
| SQ5 | The **pack schema as a sixth version** in `CLAUDE.md`, plus the author's content version (shown, never compared)? | **Yes** |
| SQ6 | Import: **Home only**, or also a **Slot in a pack** button on the empty Threats tab (171 rejected a second Import *on Home*; this is another screen)? | **Both**: the empty tab is where a GM finds out they need one |
| SQ7 | **Groups readable now, usable in S10?** A group's page lists its members as links | **Yes** |
| SQ8 | **People in the pack** (the roster NPCs: Motivation, Resources, Line, If Pushed) as entries with `kind: "npc"`, shown under *People*? | **Yes**: one record shape, one Use |
| SQ9 | **Several packs at once?** The Threats tab lists every slotted pack's entries, each card naming its pack only when there's more than one | **Yes**, at no cost now; one pack is the common case |

## 5. Read first

- `CLAUDE.md` whole: constraints 1, 6, 7, 8, 9, 10; the versions table;
  tiers; Decisions; voice.
- `docs/STATE.md` whole.
- The plan: §2 (what the Codex holds), §4b, §4e, §6 *S9*, GQ10; W62, W63.
- `../gm-mode/S08a-cast.md` §7–§8 and `S08b-interactions.md` §7–§8: the
  shapes and UI this follows.
- `docs/SCHEMA.md` §3's *table file* block; Decisions **118**, **124**,
  **167**, **170–179**.
- **The patterns to copy:**
  - `engine.js`'s *Tables* section: `fileKind`, `migrateTable`,
    `tableCheck`, `_block`, `_castMember`, `_roleList`, `_int`, `_tier`,
    `_isoOrNull`, `addCastMember`, `castFilter`, `castAffiliations`.
  - `gm.js`: storage (`TABLE_PREFIX` … `tableEntries`,
    `guardReplaceTable`), Home (`gmTablesHtml`, `askRemoveTable`,
    `bindGmHome`, `gmImportTable`), the Cast tab (`castTabHtml`,
    `castListHtml`, `redrawCastList`, `bindCastCards`, the `.form-toggle`
    view toggle, `castStatBlockHtml`'s read of `Engine.npc`).
  - `shared.js`: `keepPlace`, `askFirst`, `notice`, `openModal`, `esc`,
    `attrSel`, the tip (139).
- Tests: `engine.test.mjs`'s cast and interactions blocks;
  `hostile.test.mjs`'s `hostileTable`; `smoke.test.mjs`'s `GM_ON` blocks.
- **Not** `private/`'s Codex for content: the tests use a synthetic pack.
  Read its *How to Read an Entry* and one entry to see the fields, nothing
  more.

## 6. Out of scope

- The builder, origin modifiers, tier ranges, the trait budget, the trait
  glossary as a list (S9b). A pack's `traits` section, if a file has one,
  rides along unread.
- Matching a hand-made cast member's origin or roles to a pack (S9b).
- The real Codex pack, and any tool that builds one (S9c).
- Use into a fight, unpacking a group (S10).
- W62's loading screen; W63's core pack and the demo.
- Any edit to `shared.js`, `sheet.js` or `app.js`; any edit to `wizard.js`
  but the one routing line.
- Undo on the table (176).

## 7. The shapes

**The pack, schema 0.1** (in SCHEMA §3, with synthetic examples only):

```js
{
  meta: { kind: "shadows-pack", id: "PK-XXXXXXXX", name: "",
          packSchemaVersion: "0.1",   // a newer stamp is kept, and packCheck() reports it
          contentVersion: "",          // the author's text, shown, never compared
          created: "<ISO>", updated: "<ISO>" },   // updated decides which copy is newer
  origins:    [ { id, name, text } ],
  npcRoles:   [ { id, name, text } ],
  enemyRoles: [ { id, name, tier, text } ],        // tier: whole number ≥ 1, or null
  tiers:      [ { id, name, text } ],              // id: whole number ≥ 1
  entries: [ {
    id, kind: "threat",                // "threat" | "npc"; anything else reads "threat"
    ref: "",                           // what the book calls it ("Entry 01"), shown small
    name, flavor, description, motivation, resources, line, ifPushed, gmNote,   // text
    origin: null,                      // an origins id, or null
    npcRoles: [ ],                     // npcRoles ids
    enemyRole: null,                   // an enemyRoles id, or null
    tier: null,                        // whole number ≥ 1, or null
    block: null                        // 175's stat block, through _block, or null
  } ],
  groups: [ { id, ref, name, origin, members: [ { entry, count } ], situation, tactics } ]
}
```

**`migratePack()`** (works on a copy, never throws):

- `meta.kind` set to `"shadows-pack"`. `meta.id` kept if it matches
  `/^PK-[0-9A-HJKMNP-TV-Z]{8}$/`, else **null** (not a new one: an id is the
  author's). `name`, `contentVersion` `_str`; stamps `_isoOrNull`; the
  schema stamp as `migrateTable`'s (a newer one kept).
- A record id (origins, roles, entries, groups) is a string matching
  `/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/`; tiers' a whole number ≥ 1. A record
  with a bad id, or one repeated **within its section**, is **dropped**.
- References are checked against the pack: an entry's `origin`,
  `enemyRole` or a `npcRoles` id that names nothing becomes null or is
  dropped; a group member whose `entry` names no entry is dropped, and its
  `count` is a whole number ≥ 1, else 1.
- Text fields `_str`. `block` through `_block` (175), else null.
- Unknown keys at every level kept. Idempotent.

**`packCheck(p)`** → `{ refuse, warnings }`: `refuse` is *"This pack has no
id, so it can't be slotted in."* (tool voice) when `meta.id` is null, else
null; `warnings` holds the newer-schema line, worded as `tableCheck`'s.

**The table, schema 0.4:** each cast member gains

```js
from: null    // or { kind: "entry", pack: "PK-XXXXXXXX", id: "<entry id>", name: "<entry name>" }
```

`migrateTable()`: **step 0.4** sets `from: null` on each member of a table
stamped before 0.4 (Decision 182). **Every load:** `from` is kept only if
it's an object whose `kind` is `"entry"`, `pack` matches the PK pattern,
`id` the record-id pattern, and `name` a string; else null.
`TABLE_SCHEMA_VERSION = "0.4"`.

**Engine** (Tables section; a *Packs* subsection; every reader total):

```js
Engine.fileKind(obj)                 // + "pack" for meta.kind "shadows-pack"
Engine.migratePack(p)                → pack
Engine.packCheck(p)                  → { refuse: string|null, warnings: [string] }
Engine.packFilter(packs, { q, view, origin, npcRole, enemyRole, tier })
  → [ { pack, entry } ]              // view "threat" | "npc"; in each pack's order, packs in the order given
  // q: name, ref, flavor, and the names of its origin and roles, case-folded
  // origin/npcRole/enemyRole are names, case-folded, so two packs' "Street" are one choice
Engine.packChoices(packs)            → { origins:[name], npcRoles:[name], enemyRoles:[name], tiers:[n] }
  // distinct, case-folded, first spelling, A–Z (tiers ascending)
Engine.packEntry(packs, packId, id)  → { pack, entry, origin, npcRoles, enemyRole } | null   // the records, not ids
Engine.packGroups(packs, { q })      → [ { pack, group, members:[ { entry, count } ] } ]
Engine.castFromEntry(t, pack, id)    → { ok:true, id } | { ok:false, why:"No such entry." }
  // first in the cast; text copied; origin/roles/enemyRole as their names; tier; block deep-copied;
  // affiliations []; status alive; from { kind:"entry", pack, id, name }; stamps
Engine.entryLink(packs, from)        → { name, packId, id, here }   // here: the pack is slotted in and has it; never throws
```

`packs` is always a list, so a GM with two packs costs nothing (SQ9).
`PACK_SCHEMA_VERSION = "0.1"`, `newPackId()` is **not** added: the app
never makes a pack.

## 8. The UI

All in `gm.js` but the one routing line. GM-facing tool voice; drafts
marked for a voice pass.

**Storage.** `PACK_PREFIX = "shadows.pack.v1."`; `{ pack, imported }`;
`packEntries()` (every slotted pack, by name), `savedPack(id)`,
`removePack(id)`, guarded like the tables'. A pack that won't fit in
storage: `notice` *"This browser is out of room for that pack."* and
nothing is half-written.

**Import.** `wizard.js`'s routing line becomes
`if ((kind==="table" || kind==="pack") && featureOn("gm")){ gmImportFile(raw, kind); return; }`.
`gmImportFile` sends a table to `gmImportTable` as now, and a pack through
`migratePack`, `packCheck` (refuse → `notice`), then the replace guard
(older asks: *Put an older copy of <name> in place of the newer one?*),
then stores it and toasts *<name> slotted in: <n> entries.* `GM_NOT_A_FILE`
becomes *"That file isn't a character, a table or a pack."*

**Home.** Under *Your tables* (or alone, if there are none): **Your packs**,
a card each: name, *version <contentVersion>* if any, *<n> entries*,
*slotted in <date>*, and **Remove**. Remove asks: *Remove <name>?* /
*Your tables keep everyone you've used from it. Import the file to bring
it back.* / **Remove**.

**The Threats tab** (`TABLE_SECTIONS`, second, an existing `tab_*` icon;
`bindTable` gains its branch):

- **No pack:** *No pack slotted in. A pack is a file of threats your GM
  material came with.* (voice pass), and **Slot in a pack** (SQ6), which
  opens a file picker made in `gm.js` and goes through `gmImportFile`.
- **The toggle:** *Threats · People · Groups*, a `.form-toggle` on
  `S.threatView`, `"threat"` by default.
- **Filters** (Threats and People): search; **Origin**, **Role** (NPC
  role), **Enemy role**, **Tier**, each *Any* first, from `packChoices`.
  On `S.threatQ`, `S.threatOrigin`, … ; kept while the table is open, as
  the cast's are. Each redraws only the list. Groups: search only.
- **A card:** name (wraps), then a meta line: ref, origin, roles, *Tier n*,
  and the pack's name only when more than one is slotted. The card opens
  the entry.
- **An entry's page:** **Back to threats**; the name; the meta line; the
  flavor; **Use** (primary); then description, motivation, resources,
  their line, if pushed (each only if it has text); the stat block, read
  through `Engine.npc` as `castStatBlockHtml` shows a member's, but **read
  only** (no inputs); GM note. The origin and each role is a tip (139)
  carrying its pack text. Nothing on the page is editable.
- **A group's page:** name, ref, origin; each member as *3× <name>*, the
  name a button to the entry; situation; tactics.
- A filter that leaves nothing: *Nothing matches.* and **Clear the
  filters**.

**Use.** `castFromEntry`, then `S.tsection="cast"`, `S.castOpen` the new id,
`S.castFrom=null`; the member's page opens with focus in its name field,
selected (SQ4). The member's page, under the title, shows *From <name>*:
a button to the entry's page when `entryLink(…).here`, else text.

**Where things land:**

| Press | The record | The view | Focus | Reachable after |
|---|---|---|---|---|
| Import a pack on Home | Stored | Home, *Your packs* | The new pack's card | — |
| *Slot in a pack* on the empty tab | Stored | The Threats list | The search | — |
| A filter chosen | — | Narrowed, pack order | That select | — |
| A card opened, then **Back to threats** | — | The list, filters kept | That card's button (by entry id) | — |
| **Use** | A cast member, first, `from` set | The member's page | Its name field, selected | Cast list (filters reset if they'd hide it, as quick-add does) |
| *From <name>* on a member's page | — | The entry's page; **Back to threats** goes to the Threats list | The entry's title | — |
| A group member's name | — | The entry's page; Back returns to the **group** | Back; then the member's button (by entry id) | — |
| Remove a pack on Home | Gone from storage | Home | The next pack's Remove, else Import | Every copy stays in its cast; *From <name>* is text |
| A table opened in a browser without its pack | — | Threats: the empty state | — | The copies, in the cast |

**What each interaction must do** (markup is a suggestion):

- Keyboard only: Threats tab, search, a filter, open an entry, **Use**,
  rename, Back: focus never on `<body>`.
- Typing in the search keeps its caret through the redraw.
- Long names, refs, pack names and trait text wrap; at 390px nothing
  scrolls sideways and the toggle and filters wrap to rows.

**`changelog-pending.md`**, a fourth line:

> - **Threats.** Slot in a pack and its threats, people and groups are a
>   tab away, ready to read or to copy into your cast.

## 9. Tests

`tests/engine.test.mjs`, *Packs (Decisions 180–182)*. A synthetic pack
only (origins *Dock*, *Spire*; roles *Fixer*, *Lookout*; enemy role
*Bruiser*; entries *Gull*, *Wren*, a person *Moss*; a group *Pier
Watch*):

- `fileKind`: a pack is `"pack"`; a table and a character unchanged.
- `migratePack` over junk: `entries: "x"`; records `null`, `5`, `{}`; an
  entry with `id: "bad id!"` dropped; two entries with one id: the second
  dropped; `origin: "nowhere"` → null; `npcRoles: ["Fixer-id", "nope", 5]`
  → the one; `tier: "2"` → 2, `0` → null; a block with `stats.BOD: "x"`
  → null; a group member naming no entry dropped, `count: 0` → 1;
  `meta.id: "PK-bad"` → null and `packCheck` refuses. Idempotent.
  `__proto__` at meta, entry, block and group levels: `({}).pwn` undefined.
- A newer `packSchemaVersion` is kept and `packCheck` warns.
- `packFilter`: by each filter, case-folded across two packs; `q` over
  name, ref and the origin's name; **in pack order**, not A–Z (a pack
  whose order isn't alphabetical, checked both ways).
- `packChoices`: distinct, first spelling, A–Z; tiers ascending.
- `castFromEntry`: first in the cast; names, not ids, for origin and
  roles; the block is a copy (change the pack's after, the member's
  doesn't move); `from` set; `Engine.npc` of the member's block equals the
  entry's.
- `entryLink`: here; pack gone; entry gone from a newer pack; `null`,
  `"x"` don't throw.
- `migrateTable`: a 0.3 table → 0.4, `from: null` on each member,
  everything else byte-identical; junk `from` → null; a valid one kept.
  The *newer table* test moves to `"0.5"`.

`tests/hostile.test.mjs`: a `hostilePack()` with `P(…)` in every text
field, a ref, a pack name, a trait and a group's tactics; slot it in,
render Home, the Threats list under each view, an entry, a group, Use,
and the copy's page: `injected` is `[]`, `app.errors` empty.

`tests/smoke.test.mjs`, *Packs (Decisions 180–182)*, with `GM_ON`:

- Switched off, importing a pack on Home: the character refusal; nothing
  stored.
- Import on Home: *Your packs* lists it with no tables; Remove → Cancel
  keeps, Remove removes.
- An older copy asks; a newer replaces; a pack with no id is refused.
- The empty Threats tab shows *Slot in a pack*.
- Filters narrow and keep pack order; the search keeps its caret; *Clear
  the filters*.
- Open an entry: Health and HP as `Engine.npc` gives; no input in the
  block; Back focuses that card.
- A group's member opens the entry, and Back returns to the group.
- **Use**: the member's page, name field focused and selected; *From
  Gull*; the cast lists them; export → import keeps `from`.
- Remove the pack; reopen the table: *From Gull* is text, the member whole.
- A saved 0.3 table opens as 0.4.
- At 390px the wrapping rules are on the new card, toggle and filters
  (jsdom has no layout; pixels by hand).

**Mutation-test** (each checked against `main` at drafting):

1. **Leave `TABLE_SCHEMA_VERSION` at `"0.3"`** → the stamp tests fail.
   Removing step 0.4 itself is moot (the every-load coercion sets
   `from: null`); say so, don't run it.
2. **Rename a bad entry id instead of dropping it** → the junk test fails.
3. **Keep a reference to a missing origin** → the junk test fails (null).
4. **Share the block with the pack in `castFromEntry`** (no copy) → the
   copy test fails.
5. **Sort `packFilter` A–Z** → the pack-order test fails (engine and smoke).
6. **Store the pack inside the table** (write it to `S.table` on import) →
   the export test fails: the exported table has no pack content. Write
   that assertion.
7. **Route a pack with GM mode off** (drop `featureOn` from the
   `wizard.js` line) → the switched-off smoke test fails.
8. **Back from an entry focuses the first card** → the smoke Back test
   fails. Assert the card by entry id, and that the filter is unchanged.
9. **`entryLink` throws on a missing pack** → the engine test fails, and
   the smoke *From Gull is text* test.

Record each, what you checked, and what failed, in the PR.

## 10. Steps

`git submodule update --init private`, then `npm run verify` before starting
and after each step.

1. Confirm #117 and its fix round are merged; branch from `main`; confirm
   180–182 free; re-run the pre-flight's greps.
2. Engine: `fileKind`, `migratePack`, `packCheck`, the readers,
   `castFromEntry`, `entryLink`; table step 0.4 and `from`. Engine tests.
3. `gm.js`: storage, `gmImportFile`, the `wizard.js` line, Home's *Your
   packs*. Smoke tests.
4. The Threats tab: list, toggle, filters, entry page, group page. Smoke.
5. **Use** and *From <name>*. Smoke.
6. Hostile tests, then the nine mutations.
7. In the browser (`shadows-dev-preview`, `?gm=on`), with the synthetic
   pack saved as a file: import, browse, Use, rename, Remove the pack,
   reopen; keyboard only; 390px and 1300px. Switched off, a pack is
   refused.
8. `npm run phone-check`.
9. Ledger, `CLAUDE.md`'s versions table, docs, close-out (§12).

## 11. Stop and ask

- #117 isn't merged, or 180–182 are taken.
- Anything needs a Codex word (an entry, roster or group name, an origin
  or role the Codex defines) in `src/` or `tests/`.
- Any change to `shared.js`, `sheet.js`, `app.js`, or to `wizard.js`
  beyond the routing line.
- `docs.test.mjs` can't be made to check the pack schema without changing
  what it checks for the other five.
- The pack needs a field §7 doesn't name, or a builder piece (modifiers,
  ranges, budget) looks necessary to make the tab useful.
- A decision goes over 350 words after filling *Built*.
- A test outside the ones named fails and the fix isn't obviously yours.

## 12. Close-out

*Rule or shape* tier:

- **SCHEMA:** 180–182; 171, 174 and 178 marked superseded in part; §3
  gains the pack's block and the cast member's `from`, with the step line
  (*0.4: from*).
- **`CLAUDE.md`:** the versions table's sixth row (**Pack schema**:
  `meta.packSchemaVersion` on a pack, stamped by `migratePack()`; bump it
  when the shape of a `.shadows-pack.json` changes, with a `migratePack()`
  step), and its heading's count.
- **INDEX:** three lines under **GM mode**; 171's, 174's and 178's marked.
- **STATE:** Versions gains `pack schema 0.1`, `table schema 0.4`; §1's GM
  clause gains the pack and the Threats tab (180–182); §5: S9a built,
  switched off; S9b's order next.
- **`changelog-pending.md`:** §8's line.
- **Log** entry; **shipped** row *(switched off)*.
- **The plan:** §6 *S9* split into S9a (built), S9b, S9c; §4e's
  `codexEntry?` points at `from`; README's table: S9a's row.
- **PR** titled `feat(gm): packs and the Threats tab, switched off (W29
  S9a, Decisions 180–182)`. Body: what changed; the nine mutations; the
  voice-pass lines; **Where the order didn't fit**.

## 13. Review checklist

- [ ] Every *Done when*, in the browser, switched off and on.
- [ ] A 0.3 table saved by S8b's build on `main` opens as 0.4, its cast,
      interactions and notes intact.
- [ ] `git diff` on `shared.js`, `sheet.js`, `app.js` is empty; on
      `wizard.js`, the one line.
- [ ] No Codex word in `src/` or `tests/` (grep every entry, roster and
      group name in `private/crb/Threat_Codex_Intro_Human.md` and
      `WIP_Threat_Codex_v2.md`).
- [ ] An exported table holds no pack content, only `from` links.
- [ ] The nine mutations are real, re-run locally.
- [ ] Keyboard only: Threats, filter, entry, Use, rename, Back; a group,
      a member, Back to the group; focus never on `<body>`.
- [ ] Remove the pack: every copy whole, *From* is text; nothing in any
      view points at nothing.
- [ ] 390px: no sideways scroll on the tab, an entry, a group, Home.
- [ ] 171, 174, 178 marked in SCHEMA and INDEX; nothing else unmarked
      (search *pack*, *import*, *Codex*, *link*).
- [ ] Table schema 0.4 and pack schema 0.1 in `engine.js`, STATE, SCHEMA
      and `CLAUDE.md`; no other bump.
