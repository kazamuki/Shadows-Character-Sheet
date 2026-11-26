# Work order I4: A file reads in

**Plan:** [`../motion.md`](../motion.md) §3, row I4, and its I4 pre-flight bullet ("the gate's real output for each file kind"). **Wish:** W62 (`WISHLIST.md`), whose Plan line already points here. **Source:** W62's own shape (Ken, 2026-10-02, and Claude's notes under it) and the Motion Lab page (2026-11-24).

**Built on:** Decision 316 (I1's kit: `calm()`, the frame trap), 317 (I2: `beat-print`, `beat-stamp`, the skip that finishes a beat and still lets the tap do what it does), 318 (I3: the take-once kept in module state, never `S`). Also 163 (the lock's toast speaks in city voice from `appCopy`), 125 (what the load check finds stays above the page until dismissed), 128 and 141 (the older-copy ask), 170, 171, 181 (the table's and the pack's gates, and Home's one Import; 181 set W62 aside as "a session of its own"), 172 (gm.js's call-in points), 212 (the undo toast is the page's one status line), 137 (no network: the mono font is embedded).

**Status: drafted 2026-11-26** by Claude (Opus), I3's reviewer, at the conductor's request. **Approved by Ken 2026-11-26**, in the conductor's session: he picked the default on every question, so IQ26 is (a), IQ29 is the toast for all three, IQ32 is the drafts shipped with rewrites side by side, and IQ27, IQ28, IQ30 and IQ31 are Default.

**Branch:** cut from `origin/main` at the pre-flight commit. PR to `main`. Nothing ships switched off. The character path runs with GM mode on or off; the table and pack paths need GM mode, as today.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **I4 build** (Sonnet), then a fresh **I4 review** (Opus) once the PR is open. §15 is the hand-over.

**Runs alone.** It touches `shared.js` (the readout), `wizard.js` (Home's Import, the character path), `gm.js` (`gmImportTable`, `slotPack`), `shadows-data.js` (`appCopy.readout`), `shadows.css`, `tools/phone-check.mjs`, `DESIGN.md`, the tests and the docs. It changes no engine, no schema and no saved file.

**Pre-flight against `main` at `ead544e`** (#399, I3, merged). Take the next free decision number on `origin/main` when it's written (the order says **N**); at the pre-flight it was 319. The app's next minor was 0.80.0. Everything below was measured in the dev preview (`?gm=on`; a character from the *Dead Air* sample's copies, the sample table itself, and a two-entry pack built for the probe), fed to Home's `#file-import` as a real `File`, at 1280×900 and 375×812. **The pre-flight found six places where W62's picture isn't the app's:**

1. **A character import says nothing (IQ29).** W62 says "a character file imports with a toast that names it". It doesn't. The file opens the sheet (or the wizard) with no toast and no announcement. **Focus is left on `<body>`**, so a screen reader hears nothing at all. A table opens with focus on its `h1` and no toast. Only a pack has a toast: "Test Pack slotted in: 2 entries.", with focus on its card on Home.
2. **No gate reports what it repaired (IQ28).** `migrate()`, `migrateTable()` and `migratePack()` coerce silently and return the repaired object. What a load does report is `versionCheck(c)` (engine.js:6719: older rules, and content the data no longer has, one line each), `tableCheck(t)` (7360: a newer table schema) and `packCheck(p)` (9131: `refuse` for a pack with no id, `warnings` for a newer pack schema). So "what was repaired" can't be read from what loaded. Making the gates count their repairs is an engine change of its own.
3. **The older-copy ask comes first.** A character (`guardReplace`, shared.js:1229) or a table (`guardReplaceTable`, gm.js:236) older than the browser's copy opens a modal, *Open an older copy of Mara Okonkwo?* (seen in the preview). A pack has its own (`gmImportPack`, gm.js:3477). The destination opens only in the `proceed` callback, after the answer. Cancel opens nothing.
4. **Four doors read a file, not one.** Home's **Import a file** (`#file-import`, wizard.js:946) reads a character, a table or a pack (`fileKind`, engine.js:7188, then `gmImportFile`). The Threats tab's **Slot in a pack** (`#pack-file`, `bindPackPicker`, gm.js:3505) reads a pack, and both pack doors meet in `slotPack` (3490). The Players tab's **Import characters** (`seatImport`, 4922) takes several character files onto a player, one notice line each. A seat page's replace-a-copy (`[data-seatfile]`, 4829) is the fourth. W62 names "a character, a table, a pack", and the seat doors are a GM's mid-table work (IQ30).
5. **Tests read the destination at once.** `smokekit.importFile` (smokekit.mjs:110) dispatches the change and returns as soon as `S.screen` leaves Home or a modal opens. About thirty tests then read the sheet, the table or the toast. So the destination must render exactly as today, in the same tick. The readout is a layer over it, never a step before it.
6. **A refused file already speaks tool voice.** "That file isn't a character, a table or a pack." (`GM_NOT_A_FILE`, gm.js:12), "That file isn't a character." (GM off), "That file didn't parse as a character: <error>" (GM off, bad JSON), "This pack has no id, so it can't be slotted in." and "That file isn't a pack." (the Threats tab). Each says what's wrong. None says what to do (IQ31).

```
Home Import      wizard.js:946-978  FileReader → JSON.parse → fileKind → (table|pack) gmImportFile | character: migrate →
                 guardReplace(have, c, words, proceed): proceed sets S (screen sheet|wizard, loadFindings(c)), update(),
                 markExported(id). No toast, no announce, focus on <body>.
Table            gm.js:256 gmImportTable: migrateTable → guardReplaceTable → proceed: openTable(t) (focus h1), markTableExported,
                 tableCheck(t)[0] as a notice if any.
Pack             gm.js:3473 gmImportPack: migratePack, packCheck (refuse → notice), older-copy modal → slotPack (3490): one
                 setItem (full → notice), notice("<name> slotted in: n entr(y|ies).<warning>"), renderTable|renderHome, focus.
Threats picker   gm.js:3505 bindPackPicker: its own #pack-file; a non-pack → notice "That file isn't a pack."; → gmImportFile.
Seat imports     gm.js:4922 seatImport, 4829 [data-seatfile]: Engine.importSeat; notice lines; Decision 254/255.
Load check       shared.js:1284 loadFindings → S.importIssues; loadIssuesHtml draws .import-issues above the page (125).
Toast            shared.js:616 undoToastEl, notice() 977: role=status aria-live=polite, the page's one status line (212).
I2's skip        shared.js playNight: pointerdown/keydown on document, capture, passive, never preventDefault, takes itself off.
```

**Probes on `main`** (the dev preview; *y* is the viewport's top edge):
- **1280×900.** Home's header ends at 57. The sheet's and the table's end at 88. The sheet's `h1` (the name) is at 82–124 and its intake (the TAG) at 130–150. The table's `h1` is at 165–207. The pack's toast is at 824–864, centred, 257px wide. A load check with two findings puts `.import-issues` at 114.
- **375×812.** Home's header ends at 57, the sheet's and the table's at 94. The sheet's `h1` is at 114–146 and its intake at 150–198. The table's `h1` is at 179–221. A two-line toast is at 722–783. No page scrolls sideways (`scrollWidth` 375).
- **Same file twice.** The second import of the same character (same `meta.id` and `meta.updated`) opens the same sheet with no ask. The same table opens the same way, and the same pack gives the same toast again.
- **Older copy.** A character saved in this browser with a later `meta.updated` makes the import ask *Open an older copy of Mara Okonkwo?* and open nothing until it's answered.

**Carried over**

*From I3's order (what the order got wrong or left out):*
- **Done when disagreed with §5 and §9.** It said a clock's segment draws in Tonight's chip, while §5 and §9 said the chip doesn't move. The builder followed §5/§9. **This order's Done when, §5 and §9 were checked against each other before hand-over** (§12 step 9 has the reviewer check them again).
- **A beat class lost the cascade (MF1).** `.enc-row.beat-edge` had the same specificity as `.enc-row.active` and came earlier, so the edge's draw was invisible. The order named the class but not the rule it had to outrank. **Here every new rule says what it sits over or under** (§9's *Stacking*). The readout is a new element with no state rule of its own, but it has to sit between the sticky header (z 60) and the page, under the toast (75), the drawer and Help (70–80).
- **In the light theme `--cyan` is `--frame`** (shadows.css:45). A colour chosen to contrast in one theme can match in the other. **Every colour the readout uses is checked computed in both themes, against the readout's own background** (§11).

*From I3's build:*
- **The PR body drifted from what was built:** point 3 said `--frame` after the fix used `transparent`. Re-read the PR body after each fix commit.
- **`npm run verify` took 10–17 minutes** (17 in CI), and a 10-minute Monitor expired before it finished. Watch it with a timeout longer than the run, or run it in the foreground.
- **The builder didn't walk Activity undo, Ctrl/⌘+Z, reduced motion or the light theme by eye.** §12's walk names each check this order needs as a step. Undo doesn't apply here (an import isn't undoable), but reduced motion, the light theme, a tap mid-readout and a key mid-readout are all steps.

*From the conductor:* Ken approved I3 with "Approve, defaults" (IQ21 (b)), and nothing came back to him during the build or the review.

---

## 1. Goal and Done when

**Goal.** Slotting a file in reads it onto the screen. For about a second, a panel under the header prints what the file really holds: its name, what it is, and its counts, read from what the gate let through. Then it lands on one line that stays in the toast. Any tap or key finishes it, and the tap still does what it does. The page under it is the page the import opens today, already there and already usable. A second load of the same file, or reduced motion, gets the line in the toast and nothing else. A refused file never reads in.

**Done when:**
- **A character** from Home's Import (GM mode on or off): the readout prints the file's name, the character's name, its archetype, its TAG (or *Off grid*), then either its record (sessions, IP to spend, MP) or that it's a draft. It prints the load check's findings as a count when there are any, and lands on "{name} is in." The same line is then the toast's.
- **A table** from Home's Import: the readout prints the file's name, the table's name, its counts (sessions, cast, players, each only when not zero), and a running fight's round. It lands on "{name} is open." The toast says that line, then `tableCheck`'s warning when there is one, in the same toast.
- **A pack** from Home's Import or the Threats tab's **Slot in a pack**: the readout prints the file's name, the pack's name, its version when it has one, and its threats and NPCs. It lands on today's words, "{name} slotted in: {n} entries.", which stay the toast's, with `packCheck`'s warning after them as today.
- **The page under it is today's page.** `S`, the rendered `#main`, where focus lands and the scroll are exactly what `main` gives for the same import. The readout sits outside `#main`, is `aria-hidden`, and takes no pointer. The screen reader hears the toast's line once, and never the readout's lines.
- **The older-copy ask comes first:** the readout plays only after *Open the older copy* (or *Put the older copy in place*), and never after Cancel.
- **Any `pointerdown` or `keydown` anywhere finishes it** at once (it's removed, with no fade), and that tap or key still does what it does. The readout is gone by 1.2s in any case, and nothing replays on a later render.
- **The same file twice in a sitting** (same kind, `meta.id` and `meta.updated`) gives the toast's line only. A newer copy of it reads in again. "A sitting" is the page's life: module state, never `S` and never storage.
- **Reduced motion** gets the toast's line only, and no readout is drawn.
- **A refused file never reads in:** not JSON, an unknown kind, a table or pack with GM mode off, a pack with no id, a pack that doesn't fit in storage, Cancel on an ask. Each shows today's notice, word for word (IQ31).
- **The seat doors on Players don't read in** (IQ30): `seatImport` and a seat's replace-a-copy are unchanged.
- `phone-check` measures the readout's place for each kind at 1280px and 375px (§11): under the header, above the toast, inside the viewport, and nothing sideways. It runs again under reduced motion and in the light theme. `npm run verify` passes, and W43's guard and the contrast guard pass with the new CSS.

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape*: a player-facing behaviour on every import, and a character or a table import gaining a toast it doesn't have (IQ29).
- **App:** minor, 0.79.0 → **0.80.0** (or the next minor, if another lands first).
- **Game data:** none. `appCopy` gains `readout`, which no character's computed values or choices read (Decision 68: no `gamedataVersion` bump for copy).
- **Character, table and pack schema, ruleset:** none. Nothing is saved. What's been read this sitting is a module `Set` in `shared.js`, never in `S` and never in storage (constraint 7, I2's SF1).
- **Decision:** one, **N** (§3). It replaces nothing. The builder still greps §4's Touches for `notice`, `toast`, `import`, `Import a file`, `slotPack`, `gmImportTable`, `guardReplace`, `loadFindings` and `fileKind`, and marks anything a hit says otherwise. At the pre-flight, 125, 141, 163, 171, 181 and 212 are the hits, and none is overridden.
- **Flags:** none.

## 3. The decision, drafted

Paste it as written and fill in *Built*. It is under 350 words.

```
N. **A file reads in: Home's Import and the Threats tab's Slot in a pack print what the file holds for about a second, then land on one line in the toast.**
     *2026-11-NN · Ken + Claude · Touches: readIn, readoutLines, readSeen, #readout, appCopy.readout, Import a file, file-import, gmImportTable, slotPack, bindPackPicker, guardReplace, guardReplaceTable, toast, notice, announce, versionCheck, tableCheck, packCheck, seatImport, phone-check, W62, I4*
     - **Decided:** A character, a table or a pack read through Home's Import, or a pack through the Threats tab, opens exactly as before, and a panel under the header prints the file's own contents over it: the name, what it is, its counts, and the load check's findings as a count. It lands on one line, which stays in the toast and is what the screen reader hears. Any tap or key ends it and still does what it does. The same file again in a sitting, or reduced motion, gets the toast's line only. A refused file, Cancel on an older-copy ask, and the Players tab's seat imports don't read in.
     - **Why:** W62 (Ken, 2026-10-02): slotting a file in should feel like jacking a script into a deck. A character import said nothing at all.
     - **Rejected:**
       - A terminal that holds the screen until it ends: the page is ready, and a beat never makes anyone wait (the plan's rule 4).
       - The readout before the page opens: a test, a GM and a player all read the page at once (pre-flight finding 5).
       - A line saying what was repaired: no gate reports its repairs (IQ28).
       - The Players tab's seat imports: a GM seats several files mid-table, and the notice already lists each (IQ30).
     - **Replaces:** nothing. It builds what Decision 181 set aside as W62's session, on Decisions 316–318's kit.
     - **Revisit if:** the gates learn to report what they repaired, or a dispatch (or another file kind) gets an import.
     - **Built:** app 0.80.0, PR (this one), log entry 2026-11-NN.
```

## 4. Questions for Ken

Each has a default. One left blank is answered **Default**.

- **IQ26: Where the readout plays.** *(Ken, 2026-11-26: Default.)* Today's destination opens at once, and tests and players read it at once (finding 5). *Default (a):* a panel fixed under the header, across the page's width (16px gutters, at most 36rem), over the top of whatever opened, for about a second. It never takes a tap, and it's gone by 1.2s. At 1280 it covers the sheet's name and TAG, at 82–150, for that second. *(b):* a strip at the top of `#main` that prints in and stays until the next render. It pushes the page down, so everything under it moves twice. *(c):* a full-screen terminal that holds the page until it ends or a tap ends it. That's W62's literal picture, and it makes the player wait, which the plan's rule 4 rules out.
- **IQ27: What each kind prints.** *(Ken, 2026-11-26: Default.)* *Default:* §9's lines, in order. A **character**: the file's name, the name, the archetype, the TAG or *Off grid*, then the record (locked) or that it's a draft, the findings when there are any, and "{name} is in." A **table**: the file's name, the name, the counts, a running fight's round, and "{name} is open." A **pack**: the file's name, the name, its version, threats and NPCs, and today's toast words. Every line is read from what loaded, and a count of zero is left out. *Not taken:* a line per entry for a pack. A Codex pack holds hundreds.
- **IQ28: "What was repaired."** *(Ken, 2026-11-26: Default.)* No gate reports its repairs (finding 2). *Default:* no repair line. The load check's findings are printed as a count ("2 to look at, above the sheet"), and the findings themselves stay where Decision 125 puts them. *Alternative:* teach `migrate()`, `migrateTable()` and `migratePack()` to count what they coerce. That's an engine shape change, an order of its own.
- **IQ29: The line that stays.** *(Ken, 2026-11-26: Default.)* A character import says nothing today, and a table import says nothing unless it has a warning (finding 1). *Default:* the readout's last line becomes the toast for all three kinds, a character and a table included, and it's the one thing the screen reader hears. A table's or a pack's warning follows it in the same toast, as a pack's does today. *Alternative:* no new toast. The last line is announced only, and a character import still shows nothing once the readout is gone.
- **IQ30: The Players tab's seat imports.** *(Ken, 2026-11-26: Default.)* `seatImport` takes several files onto a player, mid-table, one notice line each (finding 4). *Default:* out. They're unchanged. *Alternative:* in, with one readout for the batch (its seats and updates as lines). That's more copy and a second shape to measure.
- **IQ31: A refused file's words.** *(Ken, 2026-11-26: Default.)* Every refusal says what's wrong, and none says what to do (finding 6). *Default:* unchanged, word for word, and tests pin them. *Alternative:* add the fix's half, drafted for a voice pass in §9's last table. Five strings change, with the tests that pin them.
- **IQ32: The voice pass.** *(Ken, 2026-11-26: Default.)* Every new string is in §9's copy table, drafted, and **each is marked for a voice pass**. They're city voice, except a refusal (tool voice, unchanged under IQ31's default). *Default:* the builder ships §9's drafts, and the reviewer drafts rewrites side by side in the PR for Ken to pick, through the conductor (`WORK-ORDERS.md`, *How exact to be*). *Alternative:* Ken, or the voice skill, rewrites them in this order before the build.

## 5. The assumption sweep

Every reader was found by grepping `file-import`, `pack-file`, `FileReader`, `readAsText`, `fileKind`, `gmImportFile`, `gmImportTable`, `gmImportPack`, `slotPack`, `guardReplace`, `guardReplaceTable`, `loadFindings`, `versionCheck`, `tableCheck`, `packCheck`, `notice(`, `undotoast`, `announce(`, `importFile` and "slotted in" in `src/` and `tests/` at `ead544e`. **Twins count.**

| What | Where (at `ead544e`) | Today | After |
|---|---|---|---|
| Home's Import, a character | wizard.js:946-978 | `proceed`: `S=…`, `update()`, `markExported(id)` | the same, then `readIn("character", c, { file:f.name })` last in `proceed` |
| `guardReplace` | shared.js:1229 | asks for an older copy, `proceed` on yes | **unchanged**: `readIn` is inside `proceed`, so Cancel reads nothing in |
| `gmImportTable` | gm.js:256 | `openTable`, `markTableExported`, `notice(tableCheck[0])` | `readIn("table", t, { file, warnings:Engine.tableCheck(t) })` in place of the notice. The toast says the last line, then the warning |
| `gmImportFile` | gm.js:253 | routes a pack or a table | carries the file's name through (a new last argument, `file`) |
| `gmImportPack` | gm.js:3473 | `refuse` → notice, older ask → `slotPack` | **unchanged**: a refusal never reaches `slotPack` |
| `slotPack` | gm.js:3490 | one `setItem` (full → notice), then a notice, render, focus | the same `setItem` and its refusal; then render and focus as today; then `readIn("pack", p, { file, warnings })`, whose toast line is today's notice, word for word |
| `bindPackPicker` | gm.js:3505 | `#pack-file` → `gmImportFile(raw,"pack")` | passes `f.name` |
| `seatImport`, `[data-seatfile]` | gm.js:4922, 4829 | notice lines | **unchanged** (IQ30) |
| `openEntry` (a roster card) | wizard.js:881 | opens a saved character | **unchanged**: not a file |
| `loadFindings`, `.import-issues` | shared.js:1284, 1293 | the findings above the page (125) | **unchanged**. The readout prints only their count, from `S.importIssues.length` |
| `notice()` | shared.js:977 | the toast, plain text, 6s | `readIn` writes the toast through `notice()`, so 212's rules hold: a fresh table entry's Undo keeps its words (an import records none) |
| `announce()` | shared.js:99 | `#announcer` | **not called**: the toast is `role=status` and speaks the line once. A second voice would read it twice |
| `#undotoast` in tests | smoke-table-cast.test.mjs:1055, 206, 1106, 29, 201, 1109, 1121; hostile.test.mjs:557 | "Test Pack slotted in: 3 entries.", "newer version of the app", the refusals | each still matches: the pack's line is today's, the warning follows in the same toast, refusals are unchanged |
| `importFile` in tests | smokekit.mjs:110, about 30 callers (smoke-roster, smoke-sheet-progression, smoke-table-play, smoke-table-cast, hostile) | returns once `S.screen` leaves Home | **unchanged**: the destination is drawn in the same tick. A test reading the toast after a character import now finds the line (grep showed none that asserts it empty) |
| `stopBeats`, `beatRun` | shared.js:433 | the sheet's and the table's beats | **not used**: the readout has its own `readRun`, so a commit mid-readout doesn't end it (a tap does, by the skip) |
| I2's skip | shared.js `playNight` | `pointerdown`/`keydown` on `document`, capture, passive | the same rule, in `readIn`'s own listener. It never calls `preventDefault`, and it takes itself off |
| `goHome`, `openTable`, `renderTable` replacing `S` | shared.js:94, gm.js:209, 614 | | **nothing new in `S`**: `readSeen` and `readRun` are module state |
| `appCopy` keys read by code | engine.test.mjs (Decision 135) | | every `readout.*` key is read by `readoutLines` or `readIn`, or the guard fails |
| Voice guard | voice.test.mjs | appCopy and rendered text | the new strings pass (no flag ids, no build words, a true minus if any number goes negative: none does) |
| Contrast guard, W43's guard | build.test.mjs | | the readout's text on its own background in both themes; every new animated rule in the reduced block |
| Architecture (172) | build.test.mjs call-in guard | wizard.js may call `gmImportFile` | `readIn` lives in shared.js, so wizard.js and gm.js each call it, and no new call goes into gm.js |
| Help's guide | `gmGuide`, the sheet guide | | grep for "import", "slot": nothing names the toast or a readout. **Unchanged** |

**Which guards read a value this changes?** The toast's text, in the tests listed above, and none of the engine's. The contrast guard and W43's guard read the new CSS.

**Where does each new thing render?** The readout: `#readout`, a child of `<body>` outside `#main`, fixed under the header. The line: the toast. Nothing new renders in `#main`, on print, in an exported file, or in Copy as Markdown.

**What text points at it?** W62's entry (its Plan line already points at I4). The plan's §3 I4 row. DESIGN.md's *Readouts* (adds **A file reads in**, §9). Help names no import message.

## 6. Read first

- `CLAUDE.md`: constraints 1 (no network: fonts embedded), 2, 3, 7, 9 and 10 (a file is untrusted: the readout reads only what the gate let through, as text).
- `SCHEMA.md` §4: Decisions 316, 317, 318, 125, 141, 163, 171, 172, 181, 212.
- `docs/VOICE-APP.md`: *The test*, *City voice*, *Tool voice*.
- `DESIGN.md`: *Readouts* (I1–I3's lines), *Do's and Don'ts*.
- `src/ui/shared.js`: `calm`, `notice`, `undoToastEl`, `announce`, `guardReplace`, `loadFindings`, `playNight`'s skip.
- `src/ui/wizard.js`: `renderHome`'s `#file-import` handler, `rosterCardHtml` (its readers for the archetype and the TAG).
- `src/ui/gm.js`: `gmImportFile`, `gmImportTable`, `gmImportPack`, `slotPack`, `bindPackPicker`, `gmPackCardHtml`, `gmTableCardHtml`, `seatImport` (to leave it).
- `tests/smokekit.mjs` (`importFile`), `tests/smoke-roster.test.mjs`, `tests/smoke-table-cast.test.mjs` (the pack's toasts), `tests/hostile.test.mjs` (the import cases), `tests/packfixture.mjs`, `tools/phone-check.mjs` (`tableBeatFloors`, `tableSeed`).

## 7. Out of scope

- **What a gate repairs** (IQ28): no engine change.
- **The seat doors** (IQ30), and opening a saved character or table from Home's cards: not files.
- **Where focus lands after a character import.** Today it's `<body>` (finding 1). That's an accessibility defect of its own, and this order keeps today's focus so the page under the readout is today's. **Report it in the PR** under *Where the order didn't fit* as a proposed finding, and don't fix it.
- **The refusals' words** (IQ31's default), **the older-copy asks**, **the load check's banner** (125).
- **A dispatch, a pack builder's export, the blank sheet.** No file kind but the three.
- **What's new, the lock (163), the night (317), the table's beats (318):** untouched.

## 8. The shapes

All in `shared.js`, except the three call sites and the copy. Nothing is saved.

```js
let readSeen = new Set();      // `${kind}|${meta.id}|${meta.updated}` read in this sitting; never in S, never stored
let readRun = null;            // { el, timers:[], off } while a readout is up; null otherwise

readoutLines(kind, obj, o) -> { lines:[string], last:string }
// kind: "character" | "table" | "pack"; obj: what the gate returned; o: { file, issues:number, warnings:[string] }.
// Plain strings (rendered as textContent, never HTML). Each line is read in its own try: a line a hostile object breaks is
// left out, never guessed. `last` always exists (falls back to the kind's line with "Untitled"/"Unnamed" as the app names it
// elsewhere: charName, tableName, packName). At most seven lines. Total: never throws for any object the gate can return.

readIn(kind, obj, o) -> void
// Called last, after the destination rendered and focus moved. Writes `last` (+ " " + warnings[0], when there is one) to the
// toast through notice(). Then, unless calm(), or readSeen has the key, or no <header class="top"> is on the page: stops any
// readRun, builds #readout under <body> with every line already in it (the frame trap: nothing waits on
// requestAnimationFrame), adds the skip listener, and removes it all at 1150ms. Adds the key to readSeen either way, so a
// reduced-motion load followed by a normal one of the same file still counts as seen.
```

- **The key.** A character's `meta.id` is its TAG; a table's and a pack's are their ids. `meta.updated` is a string the gates keep. An object whose `meta.id` isn't a string never matches anything, so it always reads in.
- **The lines are read from the gate's output,** never from the raw file: `charName(c)`, `Engine.archetypeContent(c).name` (as the roster card does, only when `D.archetypes` has the id), `Engine.tagReading(c)` / `Engine.tagNumber(c)`, `Engine.ipState(c).available`, `Engine.milestoneState(c).mp`, `c.sessions.length`, and `c.creation.locked` for a draft. A file holds no wizard step (the step is the browser entry's, and an imported draft opens at step 0), so a draft's line names no step. For a table: `tableName(t)`, `t.sessions`, `t.cast`, `t.players`, and a running encounter's `round`. For a pack: `packName(p)`, `p.meta.contentVersion`, and `p.entries` counted by `kind` (`npc`, else a threat, as `packFilter` counts them).
- **The skip** is I2's: `pointerdown` and `keydown` on `document`, capture, passive, never `preventDefault`. It removes the readout at once and takes itself off.

## 9. The UI

| Moment | What moves | When |
|---|---|---|
| The readout appears | the panel fades in (.12s) | 0 |
| Each line | prints left to right (`tagPrint`, .25s), 90ms apart, at most seven | 0, 90, 180… |
| The last line | stamps (`nightStamp`, the gold glow on its text) | its print + .15s |
| The readout goes | fades out (.2s), then it's removed | 950ms → gone by 1150ms |
| A tap or key | the readout is removed at once, no fade; the tap or key does what it does | any time |
| Reduced motion, or the same file again | no readout; the toast's line only | — |

**Where things land:**

| Press | The readout | The toast | Focus | Scroll |
|---|---|---|---|---|
| Import a character (Home) | plays | "{name} is in." | as today (`<body>`) | as today (0) |
| Import a table (Home) | plays | "{name} is open." + the warning | as today (the table's `h1`) | as today |
| Import a pack (Home) | plays | today's "{name} slotted in: …" + the warning | as today (its card) | as today |
| Slot in a pack (Threats) | plays | as above | as today (`[data-tsearch]`) | as today |
| An older-copy ask: Open / Put in place | plays after the answer | as above | as today | as today |
| An older-copy ask: Cancel; any refusal | none | today's notice, if any | as today | as today |
| Seat imports (Players) | none | today's lines | as today | as today |

**The panel.** It's `position:fixed`, with its top 8px under the bottom of `header.top`, read when it's built: 65 on Home and 96 on the sheet and the table at 1280; 65 and 102 at 375. It's centred, `width:min(36rem, calc(100vw - 32px))`, and `pointer-events:none`, with `aria-hidden="true"`. The type is the mono font (`--mono`, already embedded) at .8rem, uppercase with letter-spacing like `.enc-status`, on `--panel` with a 1px `--frame` border and a 3px `--cyan` left edge. Lines don't wrap past the panel (`overflow-wrap:anywhere`). The file's name and the counts are `--dim`, the name is `--text`, the last line is `--text` with the stamp's gold glow.

**Stacking** (I3's MF1). `#readout` is a new element with no state rule to outrank. Its `z-index` is **55**: over the page and the sticky bars (20–30) and the fixed footer (40), under the header (60), the scrims (70), the drawer and Help (80), the toast (75) and the header's menu (90). A modal's `<dialog>` is in the top layer above it in any case. Every new rule is a class on `#readout` or its children, so nothing existing has to be outranked.

**Colour, both themes.** Text on `--panel`: `--text` and `--dim` in both themes, measured, not assumed. The 3px edge: `--cyan`, which is `--frame` in the light theme (shadows.css:45). Against a `--frame` border in the light theme the edge shows only as a thicker line, so **in the light theme the edge is `--gold`** (the stamp's colour, rgb(113, 43, 140) in the light theme), or the builder shows a computed difference in both themes in the PR.

**DESIGN.md** (*Readouts*), after I3's line: **A file reads in:** a character, a table or a pack slotted in prints what it holds under the header for about a second and lands on one line in the toast; any tap or key ends it; a second load, or reduced motion, gets the line alone.

**The copy** (`appCopy.readout`, city voice unless marked; **every line is marked for a voice pass**, IQ32). `{…}` is filled from what loaded, already plain text. A count of one takes the `…1` key.

| Key | Draft | Shows when |
|---|---|---|
| `head` | `Reading {file}` | first line, every kind (the file's own name) |
| `tag` | `TAG {tag}` | a character with a TAG (a Ghost TAG prints its reading's label first, as the intake does) |
| *(Off grid)* | *the label `Engine.tagReading(c)` returns (`tag.tagless.label`, "Off grid"): no new string* | a TAGless character |
| `record` | `{sessions} on the record · {ip} IP to spend · {mp} MP` | a locked character (each part left out at zero; all three at zero: no line) |
| `record1` | `1 on the record` | the sessions part at one |
| `draft` | `Still on the intake form` | a draft (a file holds no step) |
| `findings` | `{n} to look at, above the sheet` | the load check found two or more |
| `findings1` | `One thing to look at, above the sheet` | it found one |
| `charIn` | `{name} is in.` | a character's last line, and its toast |
| `tableCounts` | `{sessions} sessions · {cast} in the cast · {players} at the table` | a table (each part left out at zero) |
| `tableCounts1` | `1 session` / `1 at the table` (two keys: `session1`, `player1`) | a part at one |
| `fight` | `A fight is on: round {n}` | a table with a running encounter (the first) |
| `tableIn` | `{name} is open.` | a table's last line, and its toast |
| `version` | `Version {v}` | a pack with a `contentVersion` |
| `packCounts` | `{threats} threats · {npcs} NPCs` | a pack (each part left out at zero) |
| `threat1`, `npc1` | `1 threat`, `1 NPC` | a part at one |
| *(pack's last line)* | *today's notice, unchanged:* `{name} slotted in: {n} entries.` | a pack's last line, and its toast |

*Under IQ31's alternative only* (tool voice: what's wrong, then what to do; each with a voice pass):

| Today | Drafted |
|---|---|
| `That file isn't a character, a table or a pack.` | `That file isn't a character, a table or a pack. Choose a .shadows.json, .shadows-table.json or .shadows-pack.json.` |
| `That file isn't a character.` | `That file isn't a character. Choose a .shadows.json file.` |
| `That file didn't parse as a character: <error>` | `That file didn't open as a character. Choose the .shadows.json the app exported.` |
| `That file isn't a pack.` | `That file isn't a pack. Choose a .shadows-pack.json file.` |
| `This pack has no id, so it can't be slotted in.` | `This pack has no id, so it can't be slotted in. Export it again from the pack builder.` |

## 10. Worked examples, as named tests

A new file, `tests/smoke-readout.test.mjs`, built on `boot`, `importFile` and `deadAirApp`/`seedTable` from `smokekit.mjs`, and `syntheticPack` from `packfixture.mjs`. Write these first, and show each failing on `main` (or say why one passes there).

1. **`I4: a character reads in: its name, archetype, TAG and record, then lands in the toast`**: import a locked character with three sessions and 4 IP. `#readout` exists, is `aria-hidden`, and its lines read `Reading x.shadows.json`, the name, the archetype, `TAG <its number>`, `3 on the record · 4 IP to spend · …`, and `<name> is in.`, in that order. `#undotoast` reads `<name> is in.` After 1.2s there's no `#readout`. `S.screen` is `"sheet"` in the same tick as `main`.
2. **`I4: a draft reads in as a draft, and a TAGless one as Off grid`**: a draft gives `Still on the intake form` and no record line. A TAGless one gives `Off grid` and no `TAG` line.
3. **`I4: the load check's findings print as a count, and stay above the sheet`**: a file with an older `gamedataVersion` and an unknown skill gives `2 to look at, above the sheet`, and `.import-issues` holds both, as today.
4. **`I4: a table reads in, and its newer-version warning stays in the toast`**: the Dead Air sample gives its name, its counts and `A fight is on: round 2`, then `Dead Air is open.`. A table with a newer `tableSchemaVersion` gives a toast matching both `/is open\./` and `/newer version of the app/`.
5. **`I4: a pack reads in from Home and from the Threats tab, and keeps today's toast`**: `syntheticPack()` gives `Test Pack`, `Version v2 (test)`, its threats and NPCs, and the toast `Test Pack slotted in: 3 entries.`, through both doors.
6. **`I4: an older copy asks first; Open reads it in, Cancel reads nothing`**: with a newer copy saved, the import opens the ask and there's no `#readout`. Open the older copy: `#readout` appears. Again, then Cancel: no `#readout` and no toast line.
7. **`I4: the same file twice in a sitting gives the toast only; a newer copy reads in again`**: import, wait 1.2s, Home, import the same file: no `#readout`, and the toast reads the line. The same file with `meta.updated` a minute later: `#readout` again. `goHome()` between (which replaces `S`) doesn't forget it.
8. **`I4: a tap or a key ends it, and still does what it does`**: during the readout, a `pointerdown` on a sheet tab, then its click: `#readout` is gone and the tab opened. Again with a `keydown` of `1` on the table (Decision 259's tab key): the readout is gone and the tab moved.
9. **`I4: reduced motion gets the toast only`**: the `matchMedia` stub (as I3's). The import shows no `#readout`, and the toast reads the line.
10. **`I4: a refused file never reads in`**: not JSON, `{ meta:{ kind:"shadows-other" } }`, a table with GM mode off, a pack with id `"PK-bad"`, and a pack while `localStorage.setItem` throws. Each leaves no `#readout`, and its toast is today's words.
11. **`I4: the page under it is today's page`**: for a character, a table and a pack, compare `#main`'s `innerHTML`, `document.activeElement` and `S.screen` right after the import with the same import while `readIn` is stubbed to do nothing. They're equal.
12. **`I4: readoutLines never throws, and reads hostile names as text`**: direct inputs `(kind, null)`, `(kind, {})`, `(kind, [])`, a character named `<img src=x onerror=alert(1)>`, sessions as a string, `entries` as a number, a table whose `players` is an object. Each returns `{ lines, last }` with strings only. The hostile name renders as text in `#readout`: no `img` element.

## 11. Tests beyond the examples

- **Position, in real Chromium** (`tools/phone-check.mjs`, a new `readoutFloors` pass, and `--readout` runs only it; it runs outside `npm test`, and the PR pastes its output). At 1280×900 and 375×812, import with Playwright's `setInputFiles` on `#file-import`: a locked character (the `tableSeed`'s Dez), the Dead Air table, and the synthetic pack. Then the pack again through the Threats tab's `#pack-file`. After 300ms, for each:
  - `#readout`'s top is at or under `header.top`'s bottom, its bottom is above the toast's top, and it's inside the viewport left and right;
  - every line's `scrollWidth` ≤ its `clientWidth`;
  - `document.documentElement.scrollWidth === clientWidth`;
  - `getComputedStyle(#readout).pointerEvents === "none"`, and `elementFromPoint` at the readout's centre is not inside it;
  - its text and its edge, computed, against its background (≥ 4.5:1 for text; the edge differs from the border);
  - at 1.3s, no `#readout`.

  Then under `reducedMotion: "reduce"` (no `#readout`, and `document.getAnimations()` empty), and with `colorScheme: "light"` (the same colour checks, which is where I3's MF1 hid). **Mutation-test** it with the panel's top set to `0` (it must fail at both widths: under the header) and with the light theme's edge set back to `--cyan` (it must fail in the light theme).
- **Totality with direct inputs** (example 12).
- **The contrast guard and W43's guard:** pass with the new CSS. Every new animated rule is in the reduced block.
- **Decision 135's guard:** every `appCopy.readout` key is read. A drafted key nothing reads (for example `record1` when the code builds plurals another way) is removed, not kept.
- **Mutation-test each guard** against the pre-fix code, and list each in the PR with the test that catches it:
  - `readSeen` not added to (example 7);
  - `readSeen` kept in `S` (example 7's `goHome()`);
  - `calm()` not checked (example 9);
  - the readout built before `proceed` (example 6's Cancel);
  - the skip calling `preventDefault` (example 8: the tab doesn't open);
  - the readout inside `#main` (example 11);
  - a line set with `innerHTML` (example 12);
  - the toast's line not written for a table (example 4).

## 12. Steps

1. `git submodule update --init private`; on a branch fresh from `origin/main`, `npm run test:fast`.
2. Write §10's tests. Run them, and show each failing on `main` in the PR.
3. `readoutLines` and `appCopy.readout` (§8, §9's copy). `npm run test:fast`.
4. `readIn`, `readSeen`, `readRun`, the skip. The three call sites: wizard.js's character `proceed`, `gmImportTable`, `slotPack` (with `gmImportFile` and `bindPackPicker` carrying the file's name). `npm run verify`.
5. The CSS: the panel, the lines, the stamp, the fade, the light theme's edge, every animated rule in the reduced block. `npm run verify`.
6. **The walk, in the dev preview** (`shadows-dev-preview`, `?gm=on`; feed `#file-import` a real `File` through a `DataTransfer`, as the pre-flight did; the 16ms rAF shim if the pane is hidden). Name each item in the PR with what was seen:
   1. A locked character at 1280 and 375: the lines in order, the toast, gone by 1.2s, focus as today.
   2. A draft, and a file with findings: the draft's line, the count, and the banner.
   3. The Dead Air table: the counts, the fight, the toast.
   4. The pack from Home, then from the Threats tab.
   5. An older copy: Cancel (nothing), then Open (it plays).
   6. The same file again (the toast only), then a newer copy (it plays).
   7. **A tap during the readout**, on a sheet tab: it ends and the tab opens. **A key during it** (`1` on the table, Tab on the sheet): it ends and the key works.
   8. **Reduced motion, by eye** (the pane's emulation, or `matchMedia`): the toast only.
   9. **The light theme, by eye** (`data-theme="light"`): the panel, the edge and the stamp, computed against the panel.
   10. A refused file of each kind: today's toast, no readout.
7. `npm run phone-check` with the new pass; paste its output. The frame fixture should not move (it holds no import). If it does, stop.
8. The docs and versions (§14). `npm run verify`.
9. **Re-read the PR body against the diff**, after the last commit and after every fix commit in review (I3's drift).

## 13. Stop and ask

Stop and ask the conductor if:
- the destination can't open in the same tick (a test's `importFile` would have to wait);
- a gate's output lacks something a line reads, so the line would have to read the raw file;
- a line would need a word for a state the data names differently (a TAG reading, an archetype's name, a pack's entry kind);
- `notice()` can't take the line without changing what a table entry's toast keeps (212);
- the frame fixture or a test outside §10 changes, other than the version literals `npm run bump` moves and a test that reads a character's or a table's toast after an import (list each);
- any measured place in §11 can't be met at 375px (say what you saw, with the metrics).

**Not stops:** `docs.test.mjs` failing until N's INDEX line is in; the contrast guard asking for a `textless` entry for the panel's edge (add it with a one-line comment); `phone-check`'s B19 phone-width header row, which fails on `main` by design; Decision 135's guard on a drafted key nothing reads (remove the key).

## 14. Close-out

`close-the-session`, *Rule or shape* tier:
- Decision **N** pasted whole, with *Built* filled in. Its INDEX §3 line goes under the motion topic, beside 316–318.
- `npm run bump -- 0.80.0`. Add `CHANGELOG.md` lines under `[Unreleased] — app 0.80.0`, then run `npm run changelog`:
  - *Slotting a file in reads it onto the screen: a character's name, archetype and TAG, a table's sessions and cast, a pack's threats. Tap anywhere to skip it.*
  - *A character or a table you import now says so, in the bar at the bottom.*
- `DESIGN.md` (§9). W62's entry: unchanged until it ships (its Plan line already points at I4). The plan's I4 row: built, the decision, the app version. **STATE:** Motion's one line ("I1–I4 built; the plan closes", or what Ken picks). Check it's under its cap with `node --test tests/docs.test.mjs`. Add a `docs/log/2026.md` entry and a `docs/log/shipped.md` row.
- **PR title:** `feat(ui): a file reads in (Decision N, I4, W62)`.
- **PR body:** the template's sections, plus:
  - *Where the order didn't fit* (empty is fine), including the focus finding (§7);
  - the tests failing on `main`;
  - each mutation and its catching test;
  - `phone-check`'s output;
  - the walk's ten items, with what was seen;
  - **every new string as it renders**, beside its key, for the voice pass (IQ32).

**Review checklist** (beyond the suite passing):
- **Done when, §5 and §9 agree** with each other and with the diff (I3's miss): each door, each toast line, the seat doors left alone.
- Re-grep every way a file reaches the app (`FileReader`, `readAsText`, `type="file"`, `fileKind`): each either calls `readIn` after its destination opened, or is a seat door (IQ30).
- Import each kind yourself in a real layout at both widths, and from the Threats tab. Check that the readout is under the header and above the toast, and that a tap and a key each end it and still act. Don't take the PR's numbers.
- The older-copy ask: Cancel reads nothing in.
- The same file twice: the toast only, through a `goHome()`. A newer copy: it plays.
- Reduced motion and the light theme **by eye**, and every new colour computed against the panel in both themes.
- The page under it is today's: `#main`, focus and scroll, against `main` in a scratch worktree.
- Nothing new in `S`, nothing saved; `readSeen` and `readRun` are module state.
- I1–I3's beats still play: `smoke-sheet-beats`, `smoke-sheet-night` and `smoke-table-beats` pass unchanged.
- The voice pass: draft rewrites side by side for every new string, and send them to the conductor for Ken (IQ32).

## 15. Handing it over

Use the two prompts in `WORK-ORDERS.md`, with this order's path: `docs/plans/motion/I4-a-file-reads-in.md`. Add the conductor's notes path. This order's traps:

- **The page opens first, the readout goes over it.** Tests read the destination in the same tick (finding 5). Call `readIn` last, inside each `proceed`.
- **Inside `proceed`, never before the ask.** Cancel on an older copy must read nothing in.
- **Read the gate's output, never the raw file,** and set every line with `textContent`. A file is untrusted (constraint 10, Decision 124).
- **Nothing in `S`.** `goHome`, `openTable` and `renderTable` replace it (I2's SF1). `readSeen` is a module `Set`.
- **The skip is I2's:** capture, passive, never `preventDefault`. The tap that ends it still opens the tab.
- **No `requestAnimationFrame`.** The readout is built with its text in it and removed by a timer, so a pane that never draws shows nothing wrong (I1's frame trap).
- **One voice.** The toast speaks the line. Don't also `announce()` it.
- **The light theme's `--cyan` is `--frame`.** Check every colour computed in both themes (I3's MF1).
- **`npm run verify` takes 10–17 minutes.** Watch it with a timeout longer than that, or run it in the foreground (I3's build).
- **Restore mutated files in a `trap` or a `finally`**, and `cmp` them against the saved copy.
- **phone-check runs by hand,** for both the builder and the reviewer.
