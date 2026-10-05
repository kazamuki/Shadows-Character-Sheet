# Work order S3a — The table file, behind a feature switch

**Plan:** [`../gm-mode.md`](../gm-mode.md) §4a, §4c and §6 *S3a*.
**Status:** drafted 2026-10-05 by Claude (Opus), after reviewing S1's PR
(#111). **§4 answered by Ken, 2026-10-05.** His SQ1 answer added the feature
switch (Decision 173) and dropped the long branch, so the order was rewritten
around it: **Ken approves this version before it's built.**
**Branch:** from `main` **after PR #111 merges**, PR to `main`. Every GM-mode
session now does the same: it merges to `main` like any batch, switched off,
and releases go on as usual (Decision 173).
**Runs alone.** It adds a script file, touches `index.html`, `shared.js`,
`wizard.js`, `app.js`, `engine.js`, the ledger, `CLAUDE.md` and the release
skill.

**Carried over from S1's review.** All five of S1's review findings were the
order's, not the build's: a decision claimed a control that didn't exist
(Admin "corrects anything else"); a UI change quietly reversed part of
Decision 165 while the order said *Replaces: nothing*; a mutation test named
a line a second path (`_fillDefaults`) already covered; the order dictated
markup (a tip trigger inside the card's button) that swallowed the card's
tap; and it drafted copy that repeated its own label. So here every control
the decisions name is in §8 and checked in §13; §3 lists the ledger searches
behind each *Replaces*; each mutation in §9 says what else might cover it;
and §8 states interactions as behaviour, with markup only as a suggestion.

**Pre-flight** (README, *The pre-flight*), against `main` at `7cdaada` plus
PR #111. Found and fixed in this order:
- `_schemaBefore(meta, v)` reads `meta.schemaVersion` whatever it's given,
  so it can't compare `tableSchemaVersion` as written. §7 says how.
- `tests/engine.test.mjs`'s `CODE_FILES` is a hand-written list that the
  data-contract guard (Decision 135) and the archetype-id guard both read.
  `gm.js` would have been outside both. §9 derives the list.
- `tabButtonsHtml()` reads `SHEET_SECTIONS` directly and the sheet binds
  every `[data-sec]`, so the table's tabs need their own twin and attribute.
- Only `release.yml` deploys the live site, and only on a manual run or a
  `v*` tag; `verify.yml` runs on every push to `main` and deploys nothing.
  So merging switched-off code to `main` reaches no player by itself.
- "Flag" already means an F-numbered rules question here (`flagged: true`,
  the `close-a-flag` skill). The feature flag is therefore called a
  **feature switch**, and its object `FEATURES`, so the two never share a word.
- `tests/harness.mjs`'s `boot({ storage })` writes a string value as-is, so
  a test turns the switch on with `{ "shadows.feature.gm": "on" }`. Its URL is
  fixed (`https://shadows.test/`), so the `?gm=` query is tested through the
  function that reads it, not by navigating.
- Checked and fine: no test asserts the Import button's label or Home's last
  line; `renderLedger()` and `renderVitals()` already clear themselves when
  `S.ch` is null; the `build.test.mjs` guards over UI files (font sizes,
  blocking dialogs) read `BROWSER_JS`, so adding `gm.js` there covers them;
  `whenText`, `openModal`, `askFirst`, `notice`, `saveFailed` and `lite()`
  (`update(false)`) are as §5 and §8 describe.
- **Before building, re-run these greps** if `main` has moved past #111:
  anything that changed since is the building session's to raise under
  *Where the order didn't fit*.

---

## 1. Goal

A GM can **make a table**, give it a name, write notes in it, export it as a
`.shadows-table.json`, import it on another browser, and remove it, the way
a player does all of that with a character. It's the storage and the file
every later GM session builds on: S8's cast, S9's Codex, S10's fight and
S5's sessions all live inside this table.

All of it sits behind **a feature switch that ships off**. A player's app
looks exactly as it does today; Ken and Scott turn GM mode on in their own
browser with `?gm=on`. The release that turns it on for everyone is GM
mode's launch, once it's done.

The table holds very little yet: a name and freeform notes. That's on
purpose. Each later session **adds** its own record to the table; nothing a
GM has already written changes under them (Ken, SQ4), and every change to
the table's shape comes with a `migrateTable()` step from today on.

**Done when:**

- **Switched off** (a fresh browser): Home is exactly today's. No *Run a
  table*, no *Your tables* even if a table is saved, and the Import button
  keeps its label. Importing a table file says *That file isn't a
  character.*, saves nothing, and **doesn't become a character** (today it
  does: it opens as a blank draft with a new TAG).
- `?gm=on` turns it on in this browser, and it stays on across reloads;
  `?gm=off` turns it off.
- **Switched on:**
  - Home shows **Running the game? Run a table** under the roster. It opens
    a small modal that asks for a name and creates the table.
  - The new table opens on its own screen: its name in the header, a
    **Notes** tab, and a menu with **Rename**, **Export
    .shadows-table.json**, **What's new** and **Home**.
  - Notes: **New note** adds one; its title and text save as they're typed;
    **Delete** asks first. A reload keeps them.
  - Home lists the table under **Your tables** with Open, Export and Remove,
    and **Changes not exported yet** until it's exported. Remove asks, with
    *Export, then remove*.
  - Home's one **Import a file** reads either kind: a character opens as
    today, a table opens its table, anything else says so and saves nothing.
    A table file never becomes a character, and a character file never
    becomes a table.
  - An older copy of a saved table asks before it replaces the newer one; a
    newer copy replaces it silently.
- A hostile table file (a payload in every string, junk where rows belong, a
  `__proto__` key) opens, renders every string as text, and pollutes nothing.
- `npm run verify`, `npm run phone-check` and `npm run release:check` pass;
  the table screen is checked by hand at 390px and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (a new saved file and its gate, a storage key, a
  new script in the fixed order, the feature switch).
- **App:** **no bump.** With the switch off, no player can see a difference
  (CLAUDE.md: bump when a player can see one). The GM-facing changelog line
  goes to `docs/plans/gm-mode/changelog-pending.md` (new, §12), and moves
  into `CHANGELOG.md` with a minor bump in the release that switches GM mode
  on.
- **Game data:** unchanged. S3a adds no data.
- **Character schema:** unchanged. A character never learns about tables.
- **Table schema:** **new, `0.1`**. A fifth version, added to `CLAUDE.md`'s
  versions table (§12). **From today on, every change to the table's shape
  bumps it with a `migrateTable()` step in the same commit** (Ken, SQ4),
  switched on or not.
- **Ruleset:** unchanged.
- **Reserved:** Decisions **170, 171, 172, 173**. No F-flag: S3a asks no
  rules question. If `main` has taken any of them when the build starts,
  stop and ask (§11).

## 3. The decisions, drafted

Searched first (Decision 130): §4's Touches and text for *roster*, *Home*,
*import*, *localStorage*, *script order*, *four classic scripts*, *versions*,
*untrusted*, *intake number*, *release*, *hidden*, *build state*. What they
turn up is cited below. Paste all four into `docs/SCHEMA.md` §4 after 169,
filling **Built**. Their INDEX §3 lines go under a **new topic heading, "GM
mode"**, after the sheet's topic (169, CRANK, stays where it is: it's the
player's sheet). 173's line goes there too, since GM mode is the only
feature behind the switch.

```
170. **A GM's table is its own file, `.shadows-table.json`, gated by `migrateTable()`, with its own id and its own schema version.**
     *2026-10-0X · Ken + Claude · Touches: table file, .shadows-table.json, newTable, migrateTable, tableCheck, fileKind, isTableId, meta.kind, table id, TBL-, tableSchemaVersion, table notes, addTableNote, editTableNote, removeTableNote, versions table, CLAUDE.md, import, W29, GQ9*
     - **Decided:** A table is `{ meta: { kind: "shadows-table", id, name, tableSchemaVersion, created, updated }, notes: [ { id, title, text, created, updated } ] }`. `newTable()` issues its id (`TBL-` and twelve characters in the TAG's alphabet) and stamps table schema 0.1. `migrateTable()` is its gate, as `migrate()` is a character's: total, every string a string, every row an object with a unique id, a bad table id replaced, a newer schema stamp kept (and reported by `tableCheck()`), and keys it doesn't know kept and never read. `meta.kind` tells a table file from a character file (`fileKind()`). The table schema is a fifth version with its own row in `CLAUDE.md`; every change to the shape bumps it with a `migrateTable()` step, so a GM's table never changes under them.
     - **Why:** the GM's material never enters the character schema (the plan's §3, rule 3), and a table file is made to be shared, so it's untrusted (124). Without a kind, `migrate()` reads any JSON object as a blank character, so a table imported through Home would have become one. Ken (2026-10-05): GM mode grows by adding; what a GM has must not move.
     - **Rejected:**
       - Telling the kinds apart by shape (a table has `tableSchemaVersion`): a damaged table would open as a new, empty character.
       - A kind on character files too: a character schema bump for nothing. A file with no kind is a character, as every file ever exported is.
       - The TAG as the table's id: a TAG is a character's in-world number, and the roster keys on it.
       - Declaring the later records (cast, sessions, encounters) now as empty arrays: each is designed by its own session, and an empty array today is a shape nobody has designed.
       - Reshaping 0.1 freely until launch: Ken and Scott will keep real tables behind the switch, and the steps cost a few lines a session.
       - The table schema in the footer: every player would read a number only a GM's file carries.
     - **Replaces:** nothing. It extends 124's rule (one gate, typed output) to a second kind of file.
     - **Revisit if:** a pack (S9) or a dispatch (S2) needs a kind this can't name, or a seat (S3b) needs a character inside the table.
     - **Built:** table schema 0.1, no app, data or character schema bump (switched off, 173); PR #__; log 2026-10-0X (the table file).

171. **Tables live in the browser beside the roster, one key each; Home lists them, its one Import reads either kind, and a table opens on its own screen.**
     *2026-10-0X · Ken + Claude · Touches: shadows.table.v1, Home, Run a table, Your tables, Import a file, table screen, table tabs, data-tsec, Notes, Rename, unexported marker, Remove, replace guard, table undo, W29, GQ9*
     - **Decided:** Each table is one `localStorage` key, `shadows.table.v1.<id>`, holding `{ table, section, changed, exported }`, by the roster's rules (141): no index key, `changed` moves only forward, the unexported marker, Remove asks with *Export, then remove*, and only an older copy of a saved table asks before it replaces. With GM mode on (173), Home gains *Running the game? Run a table* under the roster and, once a table exists, *Your tables*, and its one Import, renamed *Import a file*, reads a character or a table by its kind. A table opens on its own screen: its name in the header, its tabs (Notes for now), and a menu with Rename, Export, What's new and Home. Nothing on a table is undoable yet; deleting a note asks first.
     - **Why:** 141's reasons hold for a table, and more so: a table grows for a year, and the file is the save (GQ9). Most people on Home are players, so the GM's door is quiet until a table exists.
     - **Rejected:**
       - Tables inside the roster's keys: the roster is keyed by TAG and lists characters; a table there needs a branch in every roster reader.
       - A second Import button for tables: two buttons for one action, and whoever picks the wrong one gets an error instead of their file.
       - *Run a table* among the hero's buttons: it puts a GM's action in front of every player.
       - Undo on the table now: notes are the only content and they're text. S8 is the first session whose edits are numbers, and it decides the table's audit trail.
     - **Replaces:** Decision 141 in part, with GM mode on: Home lists tables too, and its Import reads a table file.
     - **Revisit if:** storage fills (GQ9), a GM loses work to a deleted note, or S8 designs the table's audit trail.
     - **Built:** as 170.

172. **GM mode's interface is a fifth classic script, `src/ui/gm.js`, after `sheet.js`; its engine stays in `engine.js`.**
     *2026-10-0X · Ken + Claude · Touches: src/ui/gm.js, script order, index.html, build.test.mjs, BROWSER_JS, CODE_FILES, Decision 86, engine.js, Tables section, harness*
     - **Decided:** GM mode's renderers and bindings go in `src/ui/gm.js`, loaded between `sheet.js` and `app.js`, sharing the one global scope as the other four do (86). The other UI files call into it at three named places only: `update()` saves the open table, `renderMain()` renders the table screen, and Home draws its table list and routes an imported table. Its engine functions go in a *Tables (GM mode)* section of `engine.js`. The source-file guards in the tests read the script list from `index.html`, so a new file is covered without being remembered.
     - **Why:** GM mode is its own space (Ken) and will be as large as the sheet. In its own file, GM sessions mostly add code, so other work on `main` rarely conflicts with them. The table's gate needs `engine.js`'s private coercion (`_num`) and id (`randomChars`) helpers.
     - **Rejected:**
       - GM code in `sheet.js` and `app.js`: every GM session would edit the files every other batch edits.
       - A second engine file: it would need those private helpers exported, widening the engine for one caller, and a second file in the harness and the build.
       - A namespace object: 86 turned it down, and nothing about GM mode changes why.
     - **Replaces:** Decision 86 in part: five UI scripts, not four.
     - **Revisit if:** `gm.js` outgrows `sheet.js`, or GM mode needs engine code no character-side caller shares.
     - **Built:** as 170.

173. **An unfinished feature ships switched off: `FEATURES.gm` is false, a browser turns it on with `?gm=on`, and the release that sets it true is the feature's launch.**
     *2026-10-0X · Ken + Claude · Touches: FEATURES, feature switch, featureOn, applyFeatureQuery, ?gm=on, ?gm=off, shadows.feature.gm, Home, Run a table, Your tables, Import a file, release, cut-a-release, changelog-pending, constraint 9, W29*
     - **Decided:** `shared.js` holds `const FEATURES = { gm: false }`. `featureOn("gm")` is true when the constant is, or when this browser's `localStorage` key `shadows.feature.gm` is `"on"`. Loading the app with `?gm=on` sets that key and `?gm=off` removes it. Switched off, nothing of GM mode shows: Home is as it was, and a table file imported is refused, never read as a character. Every GM session merges to `main` and releases go on with the switch off. The release that sets `FEATURES.gm` to true is GM mode's launch: a minor bump, with `changelog-pending.md`'s lines moved into `CHANGELOG.md`.
     - **Why:** Ken (2026-10-05): merge each session, keep releasing, and show players GM mode only when it's done (a feature flag, as at his work). The app doesn't narrate its build state (constraint 9), so half a mode can't ship visible.
     - **Rejected:**
       - The plan's long `gm-mode` branch: months of syncing `main` into a branch that touches `shared.js` and `app.js`, decision numbers colliding, and STATE and the log diverging.
       - Holding releases until GM mode is done: W59, the CRB catch-up and every fix would wait months.
       - A build that leaves `gm.js` out: the dev server, the folder a GM is handed and the tests all run the same source, so testers would need a second build, and the switched-off code would go untested.
       - Calling it a *flag*: here that word means an F-numbered rules question.
     - **Replaces:** nothing numbered. It replaces the plan's §7 (one long branch), which was never a decision.
     - **Revisit if:** a second unfinished feature needs hiding at the same time, or a player finding `?gm=on` turns out to matter.
     - **Built:** as 170.
```

**Supersession marks** (CLAUDE.md *Decisions*): 141 → `→ **Superseded in part by Decision 171** — with GM mode on, Home lists tables too, and its Import reads a table file.`; 86 → `→ **Superseded in part by Decision 172** — five UI scripts: gm.js joins after sheet.js.` Mark both INDEX lines `→ **superseded in part by 171**` / `172`.

## 4. Questions for Ken

All four answered by Ken, 2026-10-05.

| # | Question | Answer |
|---|---|---|
| SQ1 | How do GM sessions reach `main` when the mode isn't finished? | **Merge each session to `main` behind a feature switch, and keep releasing; only the launch release turns it on** (Decision 173). Replaces the long-branch default |
| SQ2 | GM mode's interface in a fifth script, `src/ui/gm.js`? | **Yes:** it's a different space, so its own code file (Decision 172) |
| SQ3 | Home: a quiet *Run a table* line, *Your tables* once one exists, and Import renamed **Import a file**? | **Yes to all three**, with GM mode on |
| SQ4 | A name and freeform notes at 0.1, or a name only? | **Notes**, to build on by adding. **And:** what a GM has must not change under them, so the table schema bumps with a `migrateTable()` step on every shape change from now on, not only after launch |

## 5. Read first

- `CLAUDE.md` whole: the hard constraints (1–4, 8, 9 and 10 especially), the
  versions table (which this changes), the change tiers, Decisions, voice,
  and *Working rhythm*'s release paragraph.
- `docs/STATE.md` whole.
- The plan: `../gm-mode.md` §3 (the rules), §4a (where it lives), §4c (the
  table file) and §6 *S3a*. Its §7 (the long branch) is replaced by 173.
- `docs/SCHEMA.md` §3 (the character file's shape and its comments, the model
  for the table's) and Decisions **63** (migrate invents no timestamps),
  **86** (the four scripts), **124** (untrusted files), **128**, **133**
  (the TAG and its alphabet), **138** (releasing), **141** (the roster),
  **164** (keeping your place), and **169** (S1, for the shape of an entry).
- `.claude/skills/cut-a-release/SKILL.md`, which §12 adds a step to.
- **The patterns to copy:**
  - `src/engine/engine.js`: `INTAKE_ALPHABET`, `randomChars()`,
    `newIntakeId()`, `isIntakeId`; `_num`, `_schemaBefore`, `_coerceNumbers`'
    `isObj`/`rows` (a table's rows go through the same idea); `migrate()`'s
    opening (`if (!c || typeof c !== "object") c = {};`); `versionCheck()`;
    the export list at the end.
  - `src/ui/shared.js`, *The roster*: `CHAR_PREFIX`, `readEntry`,
    `writeEntry`, `saveChar`, `markExported`, `removeChar`, `rosterEntries`,
    `unexported`; `update()`; `supersedes()` and `guardReplace()`;
    `openModal`, `askFirst`, `notice`, `esc`.
  - `src/ui/wizard.js`: `rosterCardHtml`, `openEntry`, `askRemove`,
    `renderHome` and its `#file-import` handler.
  - `src/ui/sheet.js`: `tabButtonsHtml()`, and `bindSheet()`'s `lite`.
  - `src/ui/app.js`: `renderTopChrome()` (the sheet branch's tabs and kebab
    menu), `renderMain()`'s screen dispatch, `exportCharacter()`, `boot()`,
    and `PIN_KEY`/`vitalsPinned()` (a guarded `localStorage` setting, the
    model for the switch's key).
- Tests to copy from: `tests/smoke.test.mjs` *The roster* block
  (`withDownloads`, `importFile`, `charKeys`, `entryOf`, `card`, and the
  Decision 141 tests); `tests/hostile.test.mjs` (`P`, `hostileCharacter`,
  `injected`); `tests/engine.test.mjs` (the B18 TAG tests, "the new readers
  are total", `CODE_FILES`); `tests/build.test.mjs` (`BROWSER_JS` and the
  script-order test); `tests/docs.test.mjs` ("the game-data and
  character-schema versions agree with the docs"); `tests/harness.mjs`
  (`boot({ storage })`).

## 6. Out of scope

- Every record after notes: players and seats, the cast, sessions, threads,
  encounters, places, factions, clocks, jobs, dispatches. Not even as empty
  arrays (Decision 170).
- Links between records, and the Session 0 worksheet.
- Undo or an audit trail on a table (Decision 171 defers it to S8).
- W62's on-screen read-through of a slotted file.
- The character file, `migrate()`, the sheet, the wizard, the vitals. The
  only change a character-side file sees is the three hooks in Decision 172,
  the Import routing and its label, and the switch.
- Refactoring the roster to share code with tables. Copy the pattern into
  `gm.js` (`readTableEntry`, `saveTable`, …); don't generalize `readEntry`
  or `guardReplace`.
- A general feature-switch framework: one object, one key per feature, one
  query parameter. No settings screen, no list of switches anywhere a player
  can see.
- `phone-check` growing a table screen: check it by hand (§10 step 8).
- `CHANGELOG.md`, `package.json` and `APP_VERSION`: nothing a player can see
  changes.

## 7. The shapes

**The feature switch** (`shared.js`, near `S`):

```js
// Decision 173: an unfinished feature ships switched off. A browser turns
// one on with ?<name>=on (and off with ?<name>=off); the launch release sets
// it true here. Guarded: without storage, a feature is as the constant says.
const FEATURES = { gm: false };
const FEATURE_PREFIX = "shadows.feature.";
function featureOn(name){ ... }            // FEATURES[name] === true, or the key reads "on"
function applyFeatureQuery(search){ ... }  // reads ?gm=on / ?gm=off from a search string;
                                           // sets or removes the key; ignores any other value
                                           // and any name not in FEATURES
```

`boot()` calls `applyFeatureQuery(location.search)` before the first
render. It works from `file://` (a query on a file URL is still
`location.search`). It never rewrites the URL.

**The table file** (`.shadows-table.json`), table schema `0.1`:

```js
{
  meta: {
    kind: "shadows-table",                 // fileKind() reads this; always this string
    id: "TBL-XXXX-XXXX-XXXX",              // newTable() issues it; never reissued
    name: "",                              // the GM's; "" reads "Untitled table"
    tableSchemaVersion: "0.1",
    created: "<ISO>", updated: "<ISO>"     // updated moves on every change
  },
  notes: [ { id: "N-XXXXXXXX", title: "", text: "", created: "<ISO>", updated: "<ISO>" } ]
}
```

Document it in `SCHEMA.md` as a new block at the end of §3, headed
`### The table file (*.shadows-table.json)`, with comments in the character
block's style, and the rule that a shape change needs a step. Add one line to
§1's architecture if it lists the saved files.

**Engine** (`engine.js`, a new `// ── Tables (GM mode, Decisions 170–173) ──`
section; every function total, constraint 8):

```js
const TABLE_SCHEMA_VERSION = "0.1";       // beside SCHEMA_VERSION: "A bump needs a migrateTable() step in the same change."
Engine.isTableId(v)      → boolean         // /^TBL-<the TAG's body>$/
Engine.newTable(name)    → table           // name: String(name ?? ""); created = updated = now
Engine.fileKind(obj)     → "table" | "character" | "unknown"
  // a non-object or an array → "unknown"
  // meta.kind === "shadows-table" → "table"
  // meta.kind absent (or meta absent) → "character"   (every existing file)
  // any other meta.kind → "unknown"                    (a pack or dispatch, one day)
Engine.migrateTable(t)   → table
  // not an object → {} first, as migrate() does
  // meta: an object; kind forced to "shadows-table"; id kept if isTableId,
  //   else a new one; name a string ("" for anything else);
  //   created/updated kept if Date.parse reads them, else null (Decision 63:
  //   the gate invents no timestamps); tableSchemaVersion: a string newer
  //   than 0.1 is KEPT, anything else becomes "0.1". Compare with
  //   `!_schemaBefore({ schemaVersion: v }, TABLE_SCHEMA_VERSION)` plus an
  //   equality check, or a small twin; NOT `_schemaBefore(t.meta, …)`, which
  //   reads meta.schemaVersion and would see nothing
  // version-gated steps: none yet. Leave the place for them, commented, in
  //   the order migrate() keeps its own ("Schema 0.2 (Decision N): …")
  // notes: an array of objects (anything else dropped); each title and text a
  //   string (a non-string → ""); id kept if /^N-[the alphabet]{8}$/ and not
  //   already used in this table, else a new one; created/updated as meta's
  // every other key, at any level: kept as it is, never read
  // never assigns through a key taken from the file (no Object.assign of
  //   file objects onto a fresh object; copy known keys by name)
Engine.tableCheck(t)     → [ string ]      // [] or the one line in §8 when
                                           // tableSchemaVersion is newer than 0.1
Engine.addTableNote(t, { title, text })   → { ok:true, id }
Engine.editTableNote(t, id, { title?, text? }) → { ok:true } | { ok:false, why:"No such note." }
Engine.removeTableNote(t, id)             → { ok:true } | { ok:false, why:"No such note." }
  // each stamps the note's and the table's `updated`; strings coerced as migrateTable does
```

The engine knows nothing of the switch: `fileKind` and `migrateTable` work
the same either way. Only the UI asks `featureOn`.

Check that `migrateTable(migrateTable(x))` equals `migrateTable(x)` for every
fixture (idempotent), and that a table never comes out with a key `fileKind`
reads differently.

**Storage** (`gm.js`): `TABLE_PREFIX = "shadows.table.v1."`, an entry
`{ table, section, changed, exported }`, written and read by twins of the
roster's functions (`readTableEntry`, `writeTableEntry`, `saveTable`,
`markTableExported`, `removeTable`, `tableEntries`, `tableUnexported`), with
the same guards: a key whose suffix isn't `isTableId` is skipped, a parse
failure is skipped, a failed write sets `saveFailed` (the existing flag, so
the existing *couldn't save* line shows).

`S` gains `screen: "table"`, `S.table` (the open table) and `S.tsection`.
`update()` calls `saveTable()` when `S.screen === "table"`, beside its
`saveChar()`. `S.ch` stays `null` on the table screen (the wizard's ledger
and rail clear themselves when it is). Every change to a table goes through
one helper, `tableChange(fn, redraw = true)`: run `fn`, stamp
`S.table.meta.updated`, `update(redraw)`.

## 8. The UI

**Switched off** (`featureOn("gm")` false), Home renders exactly as it does
today: same buttons, same label, same last line, no table list even when
tables are saved. The import handler still calls `Engine.fileKind()` first:
a `"table"` or `"unknown"` file gets `notice("That file isn't a character.")`
and nothing is saved. This is the one change a player could ever meet, and
it closes a hole (a table file used to become a blank character).

**Switched on**, Home (`renderHome`, `wizard.js`, calling `gm.js`):

- After the roster section (and before *What's new*), when at least one table
  is saved: `<section class="roster tables">` headed **Your tables**, one
  card per table from `tableEntries()`, newest change first, in the roster
  card's markup and classes: the name (`Untitled table` when blank), a meta
  line **Table · 3 notes · changed 2 hours ago** (`whenText`), the
  unexported line, and **Open**, **Export**, **Remove**.
- The last line becomes two: *Playing at the table instead? [Print a blank
  character sheet]* as now, then **Running the game? [Run a table]**.
- **Run a table** opens a modal (`openModal`): title **Run a table**, one
  field **Table name** (placeholder *Tuesday nights*), **Create** (primary)
  and **Cancel**. Create makes the table with `Engine.newTable(name)`, saves
  it, and opens it.
- **Import a file** (the button renamed; `accept=".json"`): the handler
  parses, then branches on `Engine.fileKind(parsed)` **before** calling
  `migrate()`:
  - `"character"`: exactly today's path.
  - `"table"`: `migrateTable()`; if a table with its id is saved and the
    file is older by `meta.updated`, ask (below); otherwise save and open it.
    Then `markTableExported(id)`, since the file holds what's saved. If
    `tableCheck()` has a line, `notice()` it once: *This table was saved by
    a newer version of the app. What this version doesn't know is kept, but
    not shown.*
  - `"unknown"` or a parse failure: `notice("That file isn't a character or a table.")`
    and nothing is saved.
- **The older-copy question** (a `guardReplaceTable` in `gm.js`, worded as
  the character one): title *Open an older copy of <name>?*, lead *This file
  is an older copy of <name> than the one saved in this browser. Opening it
  puts it in place of the newer one.*, with **Export <name> first**, **Open
  the older copy** and **Cancel**.
- **Remove** (`askRemoveTable`): as `askRemove`, the three risk lines
  reworded for a table (*This browser holds the only copy of <name>…*).

**The table screen** (`gm.js`; `renderMain` dispatches to `renderTable()`
when `S.screen === "table"`, and `renderTopChrome` gets a `"table"`
branch). It can only be reached with the switch on; if the switch is off
when a table would open, Home renders instead.

- **Header:** the brand context is the table's name; the tab row is
  `TABLE_SECTIONS = [{ id:"notes", label:"Notes", ui:"tab_notes" }]`,
  drawn by `tableTabButtonsHtml()` in `gm.js`, a twin of the sheet's
  `tabButtonsHtml()` with its own attribute, `data-tsec`, so the sheet's
  `[data-sec]` binder never sees it. The kebab menu holds **Rename**,
  **Export .shadows-table.json**, **What's new** and **Home**.
  `document.title` is `<name> — Shadows`. The vitals, the flyout and the
  pin don't exist here: `renderMain` closes them as it does for the wizard.
- **Body:** the page title is the table's name, with a sub line *Table ·
  created <date>*. Then **Notes**:
  - **New note** (a `btn`) adds a note at the top.
  - Each note is a card: a title `<input type="text">` (placeholder
    *Untitled note*), a `<textarea>` for the text, and **Delete**. Each field
    saves through `Engine.editTableNote` and the storage write, without a
    full re-render while the GM is typing: the sheet's Notes field does this
    with `lite()`, which is `update(false)` (save, no redraw), in
    `bindSheet()`; `tableChange(fn, false)` is the same. Delete asks
    (`askFirst`: *Delete this note?* / *It isn't kept anywhere else unless
    you've exported the table.* / **Delete**), then `Engine.removeTableNote`.
  - None yet: *Nothing written yet. Notes stay with the table and travel in
    its file.*
- **Rename** opens the same one-field modal as Run a table, titled **Rename
  table**, filled with the name; **Save** writes `meta.name` through
  `tableChange`.
- **Export** downloads `<name>.shadows-table.json` (the same filename
  cleaning as `exportCharacter`; `table` when the name cleans to nothing)
  and calls `markTableExported`.
- Every string from the table is `esc()`'d: the name in the header, the
  title, `document.title` (as text), the cards, both modals, and each
  note's `value` attributes.

**What each interaction must do.** These are the contract; the markup above
is a suggestion, and if it fights one of these, the behaviour wins and the
PR says so under *Where the order didn't fit*.

- A tap anywhere on a table card that isn't one of its buttons opens the
  table; each button does only its own thing.
- Enter in either name modal's field does what its primary button does;
  Esc and Cancel leave the table as it was.
- **New note** puts the keyboard in the new note's title. Typing in a note
  and then tapping elsewhere, switching tabs, going Home or reloading never
  loses what was typed (save on `input` if `change` can be skipped; check by
  typing and pressing Home straight away).
- After **Delete** goes through, focus lands on the next note, or on **New
  note** when there's none; never on `<body>` (Decision 164's rule).
- After Rename's Save, the header, `document.title` and, back on Home, the
  card all show the new name with no reload.
- On a phone (390px) every control is reachable without sideways scroll,
  and a note's fields are the screen's width.
- Nothing on the table screen opens the vitals, the flyout or the pin, and
  going Home from it leaves no table state behind (`S` is replaced whole, as
  the sheet's Home does).
- `?gm=on` followed by a reload without the query keeps GM mode on;
  `?gm=off` turns it off, and Home goes back to today's at once.

**Copy** is GM-facing tool voice (the GM is working, not reading the city).
Mark only the empty-notes line and the Home line for a voice pass; the rest
is labels.

## 9. Tests

`tests/engine.test.mjs`, a *Tables (Decisions 170–173)* block:

- `newTable("Tuesday")`: kind, a valid `TBL-` id, name, version `0.1`,
  `notes: []`, ISO `created`/`updated`. Two calls give two ids.
- `fileKind`: `newCharacter()` → character; `{}` → character (a file with
  no kind); `newTable()` → table; `{meta:{kind:"shadows-pack"}}` → unknown;
  `null`, `5`, `"x"`, `[]` → unknown.
- `migrateTable` round trip keeps id, name, notes, dates; and is idempotent.
- `migrateTable` is total and typed over `[null, 5, "x", [], {}, {meta:5},
  {meta:{id:"TAG-…"}}, {notes:"x"}, {notes:[null, 5, "x", {}, {title:5,
  text:{}}]}, {meta:{tableSchemaVersion:9}}]`: never throws; id valid; every
  note an object with string `title`/`text` and a valid unique id.
- A valid id is kept; a TAG, `""`, `"TBL-0000"` and `42` are replaced. Two
  notes sharing an id come out with two ids, the first keeping its own.
- A file's `created` of `"yesterday"` comes out `null`, not now.
- `{meta:{tableSchemaVersion:"0.2"}}` keeps `"0.2"` and `tableCheck` reports
  it; `"0.1"`, `"0.0"`, `"junk"` and none read `"0.1"` with `tableCheck` `[]`.
- An unknown key (`cast: [{…}]`, `meta.future: 1`) survives a round trip.
- `JSON.parse('{"__proto__":{"pwn":1},"meta":{"__proto__":{"pwn":1}},"notes":[{"__proto__":{"pwn":1}}]}')`
  through `migrateTable` leaves `({}).pwn` undefined.
- `addTableNote` / `editTableNote` / `removeTableNote`: work, stamp
  `updated`, coerce a non-string to `""`, and refuse an unknown id.
- **`CODE_FILES` stops being a hand-written list.** Derive it from
  `index.html`'s `<script src>` tags, keeping those under `src/engine/` and
  `src/ui/` except `theme-init.js`, and assert it includes `src/ui/gm.js`.
  Both guards that read it (Decision 135's unread-data-key test and the
  archetype-id-in-code test) then cover `gm.js`.

`tests/hostile.test.mjs`: `hostileTable()` with `P(…)` in the name, every
note title and text, a note id and the dates. Seed it in storage with the
switch on, render Home (the table card), the table screen, the Rename modal
and the Delete modal; `injected(app, …)` is `[]` for each and `app.errors`
is empty.

`tests/smoke.test.mjs`, a *Tables and the feature switch (Decisions
171, 173)* block, with helpers `tableKeys(app)`, `tableEntryOf(app, id)`
and `GM_ON = { "shadows.feature.gm": "on" }` (spread into `boot`'s storage)
beside `charKeys`/`entryOf`:

- **Switched off**, with a table saved in storage: Home has no *Run a
  table*, no *Your tables*, and the Import button's label is today's.
  Importing a table file shows *That file isn't a character.*, writes **no
  `shadows.char.v1.` key** and no table key, and stays on Home.
- `applyFeatureQuery("?gm=on")` sets the key and `featureOn("gm")` is true;
  `"?gm=off"` removes it; `"?gm=yes"`, `"?other=on"` and `""` change nothing.
- **Switched on**, Home with no table: the *Run a table* line, no *Your
  tables*.
- Run a table → name → Create: the table screen, its name in the header;
  Home lists it with *Changes not exported yet*; no `shadows.char.v1.` key
  was written.
- Notes: New note, type a title and text; boot again from that storage and
  they're there. Delete → Cancel keeps it; Delete → Delete removes it.
- Rename changes the header, `document.title` and Home's card.
- Export downloads one blob named `….shadows-table.json` whose JSON
  `fileKind` reads as a table; Home's marker clears.
- Import a table file through `#file-import` (the existing `importFile`
  works for any object): it opens; a character file still opens its sheet;
  a table file writes no character key, and a character file no table key;
  a `{meta:{kind:"shadows-pack"}}` file shows the notice and writes nothing.
- An older copy of a saved table asks; *Open the older copy* replaces it;
  *Export first* downloads the saved one. A newer copy replaces silently.
- Remove asks; *Export, then remove* downloads before it goes.
- A character and a table in one browser: each list shows only its own.
- The interactions in §8: text typed in a note and followed at once by Home
  (no `change` event) is there on reopening; after Delete, focus is on the
  next note or **New note**, not `<body>`; Enter in the name field creates.

`tests/build.test.mjs`: `src/ui/gm.js` joins `BROWSER_JS` and the
script-order list, between `sheet.js` and `app.js`. And a test that
`FEATURES.gm` is `false` in the source, **unless** `CHANGELOG.md`'s
`[Unreleased]` section has a line starting `- **Run a table.**` (the launch
release moves it there), so the switch can't be left on by accident and
can't be turned on without the launch's changelog.

`tests/docs.test.mjs`: STATE's Versions line gains `· table schema \`0.1\``
after the character schema, and a test asserts it equals
`Engine.newTable().meta.tableSchemaVersion`. Keep the existing regex
matching (it stops at the character schema).

**Mutation-test**, and before each, check nothing else already covers the
line (S1's third mutation passed because `_fillDefaults` backfilled it):

1. Call `migrate()` before `fileKind()` in the import handler → the
   switched-off "a table file writes no character key" test fails.
2. Set `FEATURES.gm` to `true` → the switched-off Home test **and** the
   build test fail.
3. Drop `migrateTable`'s string coercion of a note's `text` → the hostile
   table test fails.
4. Let `migrateTable` lower a newer `tableSchemaVersion` to `0.1` → the
   `tableCheck` test fails.
5. Remove the `saveTable()` call from `update()` → the notes reload test
   fails. (Check first that no other path saves the table on change.)
6. Put an archetype id in a string in `gm.js` (`"arcanist"`) → the
   archetype-id guard fails, which it wouldn't with the old hand-written
   `CODE_FILES`.

Record the six, and what you checked for each, in the PR description.

## 10. Steps

Run `npm run verify` before starting, and after every step.

1. Confirm #111 is merged and branch from `main`. Confirm 170–173 are free
   on `main`. Re-run the pre-flight's greps if `main` moved past #111.
2. Engine: the Tables section, the exports, `TABLE_SCHEMA_VERSION`. Its
   engine tests.
3. `src/ui/gm.js`, empty but for a header comment; `index.html`'s script
   tag; `build.test.mjs`'s two lists; `CODE_FILES` derived. Verify, so the
   order change lands alone.
4. The switch: `FEATURES`, `featureOn`, `applyFeatureQuery`, the `boot()`
   call, the build test. The switched-off import refusal and its tests.
5. Storage in `gm.js`, the `update()` hook, `S.screen === "table"` in
   `renderMain` and `renderTopChrome`. The table screen and Notes.
6. Home, switched on: *Your tables*, *Run a table*, the import routing, the
   older-copy question, Remove, the button rename. Smoke tests.
7. Hostile tests. Then the mutation tests (§9).
8. In the browser (`shadows-dev-preview`): first with no query, check Home
   is today's and a table file is refused; then `?gm=on`, make a table,
   write two notes, rename, export, remove it, import the file back, import
   a character file and a junk file; then `?gm=off`. Look at the table
   screen at 390px and at 1300px. If the pane won't draw, take the
   screenshots with `playwright-core` against the dev server, as S1 did.
9. `npm run phone-check` (the sheet's widths shouldn't move) and
   `npm run release:check` (a release from this commit would be clean).
10. Ledger, docs and close-out (§12). `npm run verify`.

## 11. Stop and ask

Stop, say what you found, and wait, if:

- #111 isn't merged, or 170–173 are taken on `main`.
- A character-side file needs more than the three hooks, the Import
  routing and its label, and the switch (Decision 172 promises that).
- Switched off, anything on Home differs from today's in the rendered HTML.
- `renderTopChrome`'s tab row or kebab menu can't take a `"table"` branch
  without changing what the sheet's does.
- Deriving `CODE_FILES` makes the data-contract or archetype-id guard fail
  on code that isn't yours (it shouldn't: the list it derives is today's
  five files plus `gm.js`).
- Any part of this needs a record from §6, or a rules answer.
- A test outside the ones named here fails and the fix isn't obviously
  yours, or a fix would weaken or delete a test.

## 12. Close-out

The `close-the-session` skill for the *Rule or shape* tier:

- **SCHEMA:** 170–173 (§3, *Built* filled); 86 and 141 marked superseded in
  part; §3's new table-file block.
- **INDEX:** a **GM mode** topic in §3 with the four lines; 86's and 141's
  lines marked. Add *table file* / *TBL-* to anything INDEX §1 lists by file.
- **CLAUDE.md:**
  - The versions section becomes *five of them*, with a row: **Table
    schema** | `meta.tableSchemaVersion` on a table, stamped by `newTable()`
    and `migrateTable()` | **The shape of a saved `.shadows-table.json`
    changes.** Always needs a `migrateTable()` step in the same commit.
  - *Where things live*: `src/ui/` is five scripts, `gm.js` last before
    `app.js`.
  - *Working rhythm*, the release paragraph, one sentence: *An unfinished
    feature ships switched off (`FEATURES`, Decision 173); a release never
    turns one on except as that feature's launch.*
- **`.claude/skills/cut-a-release/SKILL.md`**, step 1, one check: every
  `FEATURES` entry is `false` unless this release is that feature's launch,
  in which case its pending changelog lines are in the `[Unreleased]`
  section (the build test enforces GM mode's).
- **`docs/plans/gm-mode/changelog-pending.md`** (new): a line saying what
  the file is (lines that move into `CHANGELOG.md` in GM mode's launch
  release, Decision 173), then its first line:
  > - **Run a table.** A GM can keep a table in the app: name it, write notes
  >   in it, and export it as a file of its own. Home's Import reads it.
- **STATE:** rewritten where it's now wrong: the Versions line gains the
  table schema; §1's paragraph a clause (the table file and GM mode's
  switch, 170–173); §3/§5 say S3a is built, switched off, and S8's order is
  next.
- **Log:** an entry in `docs/log/2026.md`; a row in `docs/log/shipped.md`
  marked *(switched off)*.
- **The plan:** `../gm-mode.md` §6 S3a marked built (a line, as S1's); §7
  says the long branch is replaced by the switch (173) and each session
  merges to `main`. This folder's README: S3a's status, and S8 next.
- **PR** to `main`, titled
  `feat(gm): the table file and Home's door, switched off (W29 S3a, Decisions 170–173)`.
  Body: what changed; the six mutation tests; screenshots of Home switched
  off and on (with a table), and the table screen at both widths; the two
  lines for a voice pass; and **Where the order didn't fit**: anything you
  built as written that the code or the ledger disagreed with, and anything
  §8's behaviours made you change from its suggested markup ("nothing" is a
  fine answer).

## 13. Review checklist (for the orchestrating session)

- [ ] Every *Done when* item, run in the browser, switched off and on.
- [ ] Import a table file on `main`'s build from before the PR: confirm it
      **did** become a character there, so the kind check closes a real
      hole and its test fails without it.
- [ ] Switched off, Home's HTML is byte-for-byte `main`'s (render both and
      diff), and `npm run release:check` passes on the PR's commit.
- [ ] No character-side file changed beyond the three hooks, the Import
      routing and its label, and the switch; `git diff` on `sheet.js` is
      empty.
- [ ] The six mutation tests are real: revert each locally and watch it
      fail; and check nothing else was quietly covering the line.
- [ ] §8's interactions, by hand: tap a card's body, Enter in the modal,
      type then Home at once, Delete's focus, Rename's refresh, `?gm=on`
      then a plain reload, `?gm=off`, 390px.
- [ ] *Where the order didn't fit* read first, and each item sorted as the
      order's fault or the build's; the order's go into S8's *Carried over*.
- [ ] The hostile table renders as text on Home, the table screen, both
      modals and `document.title`; `({}).pwn` is undefined after import.
- [ ] `migrateTable` invents no timestamps and keeps unknown keys; a 0.2
      stamp survives and is reported; the place for version steps is there.
- [ ] Every control a decision names exists: Rename, Export, Remove,
      *Export, then remove*, the older-copy question, Delete's question,
      `?gm=on` and `?gm=off`.
- [ ] 86 and 141 are marked superseded in part, in SCHEMA and INDEX, and
      nothing else the change touches went unmarked (search the ledger for
      *Home*, *Import*, *roster*, *script*, *release* again).
- [ ] The versions: no app, data or character bump; table schema 0.1 in
      `engine.js`, STATE and `CLAUDE.md`; `docs.test.mjs` checks it.
- [ ] `changelog-pending.md` exists with the line; `CHANGELOG.md` untouched;
      the release skill and `CLAUDE.md` carry the switch's rule.
- [ ] The table screen at 390px: no sideways scroll, the note fields full
      width, the kebab reachable.
- [ ] Nothing out of scope (§6) changed.
