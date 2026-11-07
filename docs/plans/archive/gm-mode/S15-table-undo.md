# Work order S15 — The table's memory: an activity log, with undo

**Plan:** [`../gm-mode.md`](../gm-mode.md) §4 (the table), §6; the wishlist's
**W83** (Ken, 2026-10-09, from S5b's SQ6); Decisions 48–50, 107 (W12's toast),
124, 164, 171, 176.
**Status:** **drafted 2026-10-10 by Claude (Opus)**, after #151 (S10e, 211)
merged (README step 7). **Ken chose this session (2026-10-10)** over the
interaction sentence (W79 with W82), the GM layout (W80, W77, W78), and
export and print (W86 with W84).
**SQ1–SQ7 answered by Ken 2026-10-10: every default** (SQ4: keep asking, revisited if someone complains).
**Branch:** from `main` at `eabccf4` or later, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js` (the audit section and the table's
gate), `gm.js` (`tableChange`, the header menu, a new modal), `shared.js`
(the toast, a little), the CSS, the ledger and STATE. **Table schema 0.12.**
No data, nothing in `private/`, and **no change to a character's audit**.

**What S15 is.** A character records every change and undoes any of them, last
first (Decisions 48–49). A table records nothing. A GM who writes the wrong
close-out, deletes a session, ends the wrong encounter, or mis-taps Next turn
has Redo, retyping, or an exported copy. The ledger promised a trail twice and
dropped it twice: 171 left it "until S8 designs the table's audit trail", 176
moved it to S10, and S10a–e built the fight with no trail. Each session since
has added writers it will have to cover. S15 gives the table the character's
model, which was built to be cheap here: a table stores only inputs
(constraint 7), so one structural diff serves every writer, including the
ones not written yet.

**Carried over from S10e's review** (#151, one fix round). Two of the three
fixes were the **order's**:

- **Copy that promises a behaviour gets checked against the reader that
  delivers it.** S10e's order wrote *Type a name, a role or an origin* for a
  search whose group half never read the origin. This order's copy makes
  claims too: the labels name a record, and the toast names the press. §8
  says which function delivers each, and the pre-flight checked them.
- **An ordering an SQ states gets checked against the calls named to produce
  it.** SQ4 said "pack order" and named two `packFilter` calls that can't
  give it. Here the cap and the fold are rules about order: §7 states them on
  the engine function that does them, not on the UI.
- The third fix, `addToEncounter`'s half guard, was the build's.

**Pre-flight** (README, *The pre-flight*), against `main` at `eabccf4`:

- **The character's audit** (`engine.js`): `_walk` (`:2767`), `_arrayDiff`
  (`:2780`), `diffChar` (`:2797`, skips `audit` and `meta`), `safePath`
  (`:2808`, refuses `__proto__`, `prototype`, `constructor` and non-string,
  non-number keys), `_applyOp` (`:2815`), `recordAction` (`:2829`),
  `undoLastAction` (`:2837`, pops, then `_coerceNumbers`), exported at
  `:5964`. `migrate()`'s audit gate (`:3089`) keeps an entry only if every
  op's path is safe.
- **`_arrayDiff` can't serve a table, and this was measured, not guessed.**
  It recognises only *append* and a single *removeAt*. Anything else,
  including **an edit inside one element**, falls back to `set`, which stores
  a copy of the **whole array**. Tables **unshift** (`addCastMember`,
  `castFromEntry`, `addInteraction` and `addEncounter` all prepend), so even
  an add falls back. On a realistic table (40 cast members, 150 interactions,
  56 KB), `diffChar` gives **15 KB** to rename one member or add one, and
  **40 KB** to add one interaction. 500 entries would be about 10 MB, well
  past browser storage. A prototype that recurses into same-length arrays by
  index and recognises a single **insertAt** gave **60–700 bytes an entry,
  about 250 on average**, across a rename, an add, a removal (which also
  strikes the member's name in four interactions), Start, a hit, Next turn
  and End. Clone plus diff of that table took **1.8 ms**.
- **The character's diff must not change.** A character's saved `audit`
  holds `diffChar`'s ops, and Decision 48's *Revisit if* is about exactly
  this. The table gets its own entry point over a shared walker, with
  `diffChar` byte-identical (§7, §9).
- **The write path** (`gm.js`): `tableChange(fn, redraw=true)` (`:78`) runs
  `fn`, stamps `meta.updated` and calls `update(redraw)`. `update()`
  (`shared.js:249`) calls `saveTable()` (`gm.js:32`) when the screen is a
  table. `openTable` (`:85`) sets `S.table`. There are **46 `tableChange`
  sites. 18 are `tableChange(()=>{})`, where the engine writer already ran
  before the call**. Nearly every Encounters-tab press does this
  (`addToEncounter`, `addParticipant`, `startEncounter`, `nextTurn`,
  `applyEncounterHit`, `applyEncounterReset`, `endEncounter`, `addSide`,
  `removeSide`, `participantDamage`…), as do the card's and the entry page's
  **Add to cast** (`castFromEntry`). **So a snapshot taken when `tableChange`
  starts would miss most of the fight.** The recording point is a
  **baseline**: a copy of the table as it was after the last recorded change,
  diffed against the table when `tableChange` runs (§8). That catches every
  writer however it's called, and needs no edit at the 46 sites.
- **No writer bypasses `tableChange`** that the grep found: every
  `Engine.<writer>(S.table, …)` in `gm.js` is followed by `tableChange` in
  the same handler, or sits inside one (`setCastBlock` at `:851` is inside
  `block`'s `tableChange`, `:849`). A stray one would still be caught. Its
  change would land in the *next* entry, with that entry's label. §11 makes a
  newly found one a stop.
- **The toast** (`shared.js`): `undoToastEl` (`:300`), `hideUndoToast`
  (`:320`), `showUndoToast(ch, entry, label, done)` (`:327`) is
  character-bound (`S.ch`, `ch.audit`, `undoLastAction`) and undoes only
  while its entry is the newest **by identity** (107). `TOAST_MS` is 6000.
  **`notice(msg)` (`:596`) writes into the same element**, replacing whatever
  toast is up. `gm.js` calls `notice` 43 times. Most successful presses call
  `tableChange` **then** `notice` (*Gull is in Dock fight.*), so an undo toast
  raised in `tableChange` would be overwritten a line later. §8 settles it:
  the press's notice becomes the toast's words, with Undo kept.
- **The gate** (`engine.js`): `TABLE_SCHEMA_VERSION` is `"0.11"` (`:3959`).
  `newTable` (`:3960`) has `meta`, `notes`, `cast`, `interactions`,
  `encounters`, `sessions` and `threads`. `migrateTable` (`:3974`) **works on
  a copy** and returns it; "unknown keys ride along untouched". It filters
  junk out of each collection and replaces a bad or repeated id. Version
  steps run on `arrived`, with 0.11's at `:4030`.
- **The header menu** (`gm.js:238–252`): Find, Jot, then ⋮ with Rename,
  Export, What's new and Home. **Find is a modal** (`openFind`, `:344`). The
  Activity log follows Find's lead: a modal from the menu, not a tab.
- **What the page shows after an undo** is already safe for a record that
  undo removed. `castOpenMember` (`:495`), `sessOpenNow` (`:953`) and
  `encOpenNow` (`:1819`, which also clears `S.encOpen`) return `null` for a
  missing id, and their tabs draw the list. §8's draft rule covers the
  encounter's panels.
- **Find** (`tableSearch`, `engine.js:4528`) reads named collections only, so
  it never searches the trail.
- **The labels' helpers exist**: `sessionTitle` (`:4382`) and
  `encounterTitle` (`:5189`) in the engine. A thread's title and a note's
  title are plain fields (`gm.js`'s `threadTitle` is a UI one-liner the
  engine copies).
- **Tests that pin the version:** `engine.test.mjs` asserts
  `tableSchemaVersion` `"0.11"` at `:3079`, `:3154`, `:3206`, `:3429`,
  `:3791`, `:4000`, `:4516`, `:4987` and `:5359`, and `docs.test.mjs:358`
  checks STATE against `newTable()`. These move to `"0.12"`. No test asserts
  a table's key list (grep). Each refused-press test deep-equals the table
  before and after a refusal. That still holds, because a refusal records
  nothing.
- **The ledger,** searched by name: *undo*, *audit*, *Activity*, *toast*,
  *commit()*, *Delete*, *Remove*, *asks*, *table undo*, *Redo*,
  *tableChange*. Hits:
  - **171** (*Nothing on a table is undoable yet*; *Rejected: undo on the
    table now*; *Revisit if … S8 designs the table's audit trail*):
    **superseded in part.** Its Revisit has happened, by way of 176.
  - **176** (*a cast still has no undo, and Delete asks*; *S10 … decides the
    table's audit trail*; *Rejected: Undo now, by the character's structural
    diff: a second audit to design before anything at the table changes in
    play*): **superseded in part.** Damage, turns and the close-out now change
    in play, which was the condition it waited for. Its rejection is answered:
    this **is** the second audit, designed. Delete still asks (SQ4).
  - **48, 49, 50**: the model, cited. 48 (one wrapper and a structural
    diff), 49 (LIFO, an undo isn't logged, no out-of-order undo), 50 (the
    log as a list, newest first, with an Undo and a guarded Clear). Extended
    to a table, not replaced. 48's *Revisit if* (undo crossing a `migrate()`
    step that reshapes an array) is met head-on by §7's rule: a schema step
    clears the trail.
  - **107** (W12, an undo toast on every `commit()`, by identity): cited and
    followed.
  - **124** (undo only writes inside the file, and what it restores is
    gated): cited and extended to a table, which needs more than a character:
    `meta.id` is the table's storage key (§7).
  - **164** (a press keeps the keyboard's place): cited for the modal's Undo.
  - **184**'s *Rejected* says not to apply an origin's modifiers, partly
    because "a table has no undo (176)". That reason now lapses, but its
    first reason (a block can't tell a fresh stat from a printed one) stands,
    and its *Revisit if* hasn't happened. **Cited, not reopened.**
  - **193** (the wrap-up is one writer, all or nothing) and **205** (Redo
    reopens the close-out): unchanged. Each is now one entry, undone whole.
  - Nothing else mentions table undo.
- **Numbers:** Decision **212** and table schema **0.12** are free on
  `origin/main` (checked 2026-10-10, no open PRs). W83 is granted. Check
  again before pasting.

---

## 1. Goal

Scott ends *Dock fight*, and the wrap-up writes the fight onto four cast
members. He meant to Keep the Gull, not leave it. The toast says *Ended Dock
fight · Undo*. One tap and the encounter is running again, every row as it
was, the four lines gone. Later he deletes Session 3 instead of Session 4.
The delete asked first and he said yes anyway. He opens ⋮ → **Activity**: the
top line is *Removed Session 3*, and **Undo** brings it back with its
close-out. Mid-fight, he typed a cast member's motivation over the old one.
**Activity** lists *Changed Marta* once, not once a keystroke, and Undo puts
back what was there before he started typing.

**Done when:**

- Switched off: nothing changes anywhere.
- Every change to a table through the app is recorded as one entry, with a
  label naming what changed. That covers the cast, interactions, sessions,
  threads, notes, encounters, close-outs and the table's name. A refused press
  records nothing.
- A press that records an entry shows a toast for six seconds: the press's
  own notice if it has one, else the entry's label, with **Undo**. Typing in a
  field shows none.
- Typing in one field records **one** entry per burst, and its undo restores
  the field as it was before the burst.
- ⋮ → **Activity** opens a modal: **Undo** for the newest entry, then every
  entry newest first, with its time. **Clear activity** asks first and can't
  be undone.
- Undo is last-in, first-out, isn't itself recorded, and restores the table
  exactly (deep-equal) to before the entry, gated afresh.
- The trail goes in the table's file, keeps at most **500** entries, and
  averages under 1 KB an entry on the realistic fixture.
- A crafted trail in a file can't write outside the table's records, can't
  touch `meta.id`, and can't throw.
- A character's audit is byte-for-byte unchanged.
- At 390px the modal fits and nothing scrolls sideways.
- `npm run verify` and `npm run phone-check` pass. Checked by hand at 390px,
  768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape: a saved-file shape (the table's `audit`), and a
  GM-facing behaviour someone could have chosen otherwise. It reopens 171 and
  176 in part.
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** no bump; no data changes.
- **Table schema:** **0.11 → 0.12**, with a `migrateTable()` step: `audit`,
  a list, `[]` for every table already saved.
- **Character and pack schemas:** unchanged. **A character's audit doesn't
  change.**
- **Reserved:** Decision **212**. W83 is granted.

## 3. The decision, drafted

Paste after 211, under INDEX §3's **GM mode** heading, filling **Built**.
Count it with `wc -w`; the cap is 350.

```
212. **A table keeps an activity log as a character does: every change one entry, undone last first, with a toast on each press and an Activity list in the menu.**
     *2026-10-XX · Ken + Claude · Touches: table audit, audit, undo, Undo, Activity, Clear activity, tableChange, diffTable, recordTableAction, undoTableAction, insertAt, migrateTable, table schema 0.12, undo toast, notice, Decision 48, Decision 49, Decision 50, Decision 107, Decision 124, Decision 171, Decision 176, W83, GQ9*
     - **Decided:** Table schema 0.12 adds `audit`: entries of a label and a patch, diffed from the table as it was after the last change, so every writer is covered without naming it. Arrays diff element by element, and an insert is one op. Typing in one field folds into one entry. Undo pops the newest and gates the table afresh; it isn't logged. A press's toast carries Undo; ⋮ → **Activity** lists the rest and clears them. 500 entries kept; a schema step clears them.
     - **Why:** a GM's slip at the table had no way back but retyping (W83), and the trail was promised in 171 and 176. A table stores inputs, so one diff serves every writer.
     - **Rejected:**
       - The character's `diffChar` as is: every table action stored a whole array, 15–40 KB an entry, over storage within a session.
       - Recording inside `tableChange`'s callback: most Encounters presses write before it runs.
       - A label written at each of 46 call sites: a new writer would forget, and computing it from the record can't.
       - Undo in any order: 49's reason, dependent state.
       - The trail in browser storage only: the file is the save (GQ9).
     - **Replaces:** Decision 171 in part (a table is undoable) and 176 in part (its trail is this, not S10's). Extends 48–50, 107 and 124 to a table.
     - **Revisit if:** a table's trail outgrows storage at 500, a GM asks for redo, or W38's two tabs reach tables.
     - **Built:** table schema 0.12, switched off (173); log 2026-10-XX.
```

**Supersession marks:**

- 171 gets *→ **Superseded in part by Decision 212** — a table is undoable:
  every change is an entry in its activity log.*
- 176 gets *→ **Superseded in part by Decision 212** — the table's trail is
  212's; Delete still asks.*
- Their INDEX lines get *→ **superseded in part by 212***.

If the ledger search at build time finds another, stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **Where the log is seen.** A toast after each recorded press, as the sheet's (107), and ⋮ → **Activity**, a modal like Find's: *Undo <label>*, then the entries newest first with their time, and **Clear activity** at the foot. Not a tab | **Toast and a menu modal** | **Default** (Ken) |
| SQ2 | **Typing.** Keystrokes in one field fold into one entry while they touch the same fields and the last was under 5 minutes ago. If the field ends where it started, the entry goes. No toast while typing | **Fold, 5 minutes, no toast** | **Default** (Ken) |
| SQ3 | **How much is kept.** The newest **500** entries; older ones drop off as new ones arrive. At ~250 bytes each that's ~125 KB, against a table's few hundred KB a year | **500** | **Default** (Ken) |
| SQ4 | **Do deletes still ask?** Removing a cast member, session, thread, note or encounter asks first today (171, 176). With undo, the ask could go, Gmail-style. Default: **keep asking**. A table is a year's work, a toast is easy to miss, and Activity is a second chance, not the first | **Keep asking** | **Default** (Ken; revisit if a GM finds the ask in the way) |
| SQ5 | **The trail goes in the file.** Exported and imported with the table, as a character's is, so a table moved to a tablet keeps its undo | **In the file** | **Default** (Ken) |
| SQ6 | **Labels.** Computed from what changed: the verb from the diff (*Added*, *Removed*, *Changed*), the record by its name when the entry was made (*Added Marta to the cast*, *Removed Session 3*, *Changed Dock fight*). A few compound presses name themselves (§8: End, Reset, the close-out, a hit). ✎ all | **Computed, four named** | **Default** (Ken) |
| SQ7 | **Redo.** None, as on the sheet (49). An undone entry is gone | **No redo** | **Default** (Ken) |

## 5. Read first

- `CLAUDE.md` whole: constraints 7, 8 and 10; *Decisions*; *Change tiers*;
  *Versions* (the table schema).
- `docs/STATE.md` whole.
- `docs/SCHEMA.md` §3, *The table file*; §4, Decisions **48**, **49**,
  **50**, **107** (W12), **124**, **164**, **171**, **176**, **193**,
  **205**.
- `docs/WISHLIST.md`: **W83**; **W38** (two tabs, out of scope).
- **The code:** `engine.js`'s `_walk`, `_arrayDiff`, `diffChar`, `safePath`,
  `_applyOp`, `recordAction`, `undoLastAction`, `migrate()`'s audit gate
  (`:3089`), `TABLE_SCHEMA_VERSION`, `newTable`, `migrateTable` (whole),
  `sessionTitle`, `encounterTitle`; `shared.js`'s `commit`, `update`,
  `undoToastEl`, `hideUndoToast`, `toastLanding`, `showUndoToast`, `notice`,
  `askFirst`, `openModal`; `gm.js`'s `saveTable`, `tableChange`, `openTable`,
  `renderTableChrome` (the menu), `openFind`, and the 18
  `tableChange(()=>{})` sites.

## 6. Out of scope

- **A character's audit.** `diffChar`'s output doesn't change by a byte.
  Giving a character the element-wise diff is a later wish, not this.
- **Redo** (SQ7), and **undo out of order** (49).
- **Things outside the table object:** a pack slotted or removed, a table
  removed from Home, Import replacing a table. Remove and Replace keep their
  asks.
- **UI state:** filters, the open tab, a draft in a panel. None of it is in
  the table.
- **W38** (two tabs on one table): a second tab's trail is its own, as a
  character's is today.
- **Dropping the delete asks** (SQ4's default keeps them).
- **Reaching a character** through seats or dispatches (S3b, S2): nothing
  here writes to a character.

## 7. The shapes

**The table file, 0.12:**

```js
audit: [ {
  seq: 1,                 // a whole number, rising; a popped seq is reused, as a character's is (107)
  date: "<ISO>",          // when it was made; a fold moves it to the last keystroke
  label: "",              // the words the toast and Activity show, fixed when made
  patch: [ op, … ]        // diffTable's ops, below; never empty
} ]                       // oldest first, at most 500
```

**An op** is the character's, plus one: `{ path, type:"scalar", before }`;
`{ path, type:"array", op:"append", count }`;
`{ path, type:"array", op:"removeAt", index, item }`;
`{ path, type:"array", op:"set", before }`; and new,
**`{ path, type:"array", op:"insertAt", index }`** (undo removes the element
at `index`).

**Engine:**

| Function | Does | On bad input |
|---|---|---|
| `_walk` / `_arrayDiff` | gain one switch, `deep`. Off (the character's): exactly today's ops. On (the table's): **same-length arrays recurse by index**; one element longer, with removing one index giving `before`, is **`insertAt`**; then append, removeAt and set as today | — |
| `diffTable(before, after)` | **new.** The ops between two tables, `deep` on. Skips `audit`, and every `meta` key **except `name`** (a rename is undoable; the stamps aren't) | non-objects diff as empty |
| `tableActionLabel(before, after, patch)` | **new, read-only.** §8's rule | never throws; falls back to ✎ *Changed the table* |
| `recordTableAction(t, before, label, now)` | **new.** Diffs `before` against `t`. An empty patch records nothing (`{ ok:false, noop:true }`). Otherwise, **the fold:** if the newest entry's patch is all `scalar` ops on exactly the same paths as the new one, and its label is the same, and `now` is under 5 minutes after its `date`, it keeps the newest's `before` values and takes `now` as its `date`. If every op then has `before` equal to the current value, the entry is dropped. Else it pushes `{ seq, date:now, label: label || tableActionLabel(…), patch }`, then drops the oldest past 500. Returns `{ ok, entry, folded }` | `now` defaults to the current time (a parameter so tests needn't wait) |
| `undoTableAction(t)` | **new.** Applies the newest entry's ops in reverse (`_applyOp`, which learns `insertAt`), pops it, then **gates the table in place**: `migrateTable(t)`'s result written back onto `t`'s own object, so `S.table` stays the same object. Returns `{ ok:true, undone }`, or `{ ok:false, why:"Nothing to undo." }` | a non-table refuses |
| `clearTableActivity(t)` | **new.** `audit = []` | — |
| `migrateTable` | **0.12 step:** `audit = []` where there was none. **Every load, the gate:** `audit` is a list. An entry is kept only if `seq` is a whole number, `label` a string, `date` an ISO or null, and `patch` a non-empty list of ops whose `type` and `op` are the ones above, whose `index` and `count` are whole numbers ≥ 0, and whose `path` is safe (`safePath`) **and starts at a table record**: `notes`, `cast`, `interactions`, `encounters`, `sessions`, `threads`, or exactly `["meta","name"]`. Never `meta.id`, the version, the stamps or `audit`. Then the newest 500. **A file whose version is older than the app's has its trail emptied after the steps run**, so undo never crosses a schema step (48's *Revisit if*) | drops; never throws |

`diffChar`, `recordAction`, `undoLastAction` and `migrate()` are unchanged
in behaviour. A test pins `diffChar`'s ops byte-for-byte on a fixture set
(§9).

## 8. The UI

All in `gm.js`, `shared.js` and the CSS; tool voice; ✎ for a voice pass.
**Built for a tablet** (§1a): every control a tap, 44px.

**The recording point.** `tableChange(fn, redraw, label)` runs `fn`, then
`Engine.recordTableAction(S.table, base, label)`, where `base` is a copy of
the table as it stood after the last record or undo, kept beside `S.table`
(set by `openTable`, by every record, by every undo and by Clear). Then it
stamps `meta.updated` and calls `update(redraw)` as now. Because the diff runs
against `base`, a writer called before `tableChange` (the 18 empty-callback
sites) is recorded the same as one inside it. **No call site changes**
except the four that name themselves.

**Labels** (`tableActionLabel`), from the records the patch touches: a
record is an element of `cast`, `interactions`, `sessions`, `threads`,
`notes` or `encounters`. Changes inside an encounter's rows, sides or
Conditions belong to the encounter.

| Touches | Label ✎ |
|---|---|
| one record, inserted or appended | *Added Marta to the cast* · *Added a line* (an interaction) · *Added Session 3* · *Added the thread The Ledger* · *Added a note* · *Added Dock fight* |
| one record, removed | *Removed …*, named from `before` |
| one record, changed | *Changed Marta* · *Changed a line* · *Changed Session 3* · *Changed The Ledger* · *Changed a note* · *Changed Dock fight* |
| `meta.name` only | *Renamed the table* |
| more than one record | the first by the order encounters, sessions, cast, interactions, threads, notes, then *and N more*: *Changed Dock fight and 4 more* |

Names come from `sessionTitle`, `encounterTitle`, a member's trimmed name
(*Unnamed*), a thread's title (*Untitled*) and a note's title (*a note*).
**Four presses name themselves** through `tableChange`'s `label`: End's
wrap-up (*Ended Dock fight*), Finish at Reset (*Reset Dock fight, round 3*),
writing the close-out (*Closed out Session 3*) and applying a hit (*Hit
Gull*). ✎ all.

**The toast.** After `tableChange` records a **new** entry (not a fold), and
**no text field in `#main` has focus** (typing never toasts), it shows the
undo toast: the label, **Undo**, ×, for `TOAST_MS`. The character's
`showUndoToast` is generalised or a table twin is added; either way it
undoes only while its entry is the newest **by identity** and `S.table` is
still the table it was raised on (107). **A `notice(msg)` in the same press,
while that toast is up, replaces the words and keeps Undo.** So a press
reads *Gull is in Dock fight. · Undo*, not one toast then another. A
`notice` with no undo toast up behaves as now. Pressing Undo undoes, redraws,
and shows *Undone: <label>* for 2.5 s, as the sheet's does.

**Activity** (⋮ → **Activity**, after Export ✎): a modal titled
**Activity**, returning focus to ⋮.

- With entries: **Undo** ✎ *Undo: <newest label>* (primary), then a list,
  newest first: each label and its time (*21:40*, or *Oct 9, 21:40* if not
  today), then ✎ *N actions kept; the oldest go after 500.* and **Clear
  activity** (danger).
- With none: ✎ *Nothing to undo yet. Every change you make to this table
  shows here.*

| Press | The record | The view | Focus |
|---|---|---|---|
| Any recorded press | an entry (or a fold) | as now, plus the toast (not while typing) | as now |
| The toast's **Undo** | the newest entry undone; the table gated | the page redraws; *Undone: …* | where it was; the toast's own rule (107, W47) if it was on the toast |
| ⋮ → **Activity** | — | the modal | the modal's Undo, or its close if none |
| The modal's **Undo** | the newest undone | the page behind redraws; the list redraws; a notice *Undone: …* | the modal's Undo (now naming the next), or the modal's title if none is left |
| **Clear activity** | asks ✎ *Clear this table's activity? You won't be able to undo anything before now.*; yes empties `audit` | the list redraws to the empty line | the modal's title |
| A refused press | nothing | `notice(why)` as now | as now |

**After any undo,** the page redraws on what's still there. A cast member,
session or encounter page whose record undo removed draws its tab's list
(the resolvers already return `null`). The Encounters tab's open panels
(`S.encDmg`, `S.encHit`, `S.encCond`, `S.encReset`, `S.encWrap`) close, since
they're drafts over rows that may have moved. A close-out draft (`S.closeOut`)
and an interaction draft (`S.intAdd`) stay unless their record is gone.

**At width:** the modal's list scrolls inside the modal; a long label wraps;
nothing scrolls sideways.

## 9. Tests

**`tests/engine.test.mjs`**, *The table's activity log (212)*:

- **`diffTable`:** a member renamed is two scalar ops (`name`, `updated`) at
  `["cast", i, …]`. A prepended member is one `insertAt` at index 0. A removed
  one is `removeAt` with the item. `meta.updated` alone diffs empty.
  `meta.name` diffs. `audit` never diffs.
- **The size, on the realistic fixture** (40 members, 150 interactions):
  rename, add a member, add an interaction, remove a member, Start, a hit,
  Next turn, End. Every entry is under 1 KB and the average under 500 bytes.
- **Round trips:** for each writer family (cast, interactions, sessions with
  a close-out, threads, notes, an encounter through start, hit, Reset and
  End with a Keep), record then undo, and the table deep-equals its state
  before (`meta.updated` aside).
- **LIFO:** three entries undone newest first restore each state in turn. An
  undo isn't recorded. `undoTableAction` on none says *Nothing to undo.*
- **The fold:** five edits to one name are one entry, undone to the
  original. A name typed and erased back records nothing. The same field 6
  minutes later is a second entry. A different field is a second entry.
- **The cap:** 520 records keep the newest 500, seqs rising.
- **The gate:** an entry with a path of `__proto__`, `["meta","id"]`,
  `["meta","tableSchemaVersion"]`, `["audit",0]` or `["evil"]`, an op type
  `"x"`, an index of `-1`, `1.5` or `"2"`, an empty patch, or a non-object is
  dropped, and its neighbours kept. 700 valid entries keep 500. Undoing a
  kept entry whose `before` is `"5"` where a number lives comes out a number.
  **A 0.11 file carrying an `audit` loads with it empty.** `newTable()`
  round-trips through `migrateTable` with `audit: []` (constraint 8).
- **The character is untouched:** `diffChar` on a fixed set of character
  before/after pairs (a damage, a raise, a gear append, a removal, an Admin
  edit) gives ops deep-equal to ones pinned in the test.

**`tests/smoke.test.mjs`**, switched on:

- **A press that writes before `tableChange`:** on a running encounter, Take
  6 on a row, then the toast's Undo: the row's damage is back.
  **Add to <encounter>** from a card, then Undo: the row is gone and the
  toast read the notice's words with Undo.
- **Typing:** type a cast member's motivation a letter at a time. No toast
  shows, Activity lists one *Changed <name>*, and its Undo restores the old
  text.
- **Activity:** ⋮ → Activity lists entries newest first. Undo takes the
  newest, the page behind redraws, focus is on the next Undo. Undo a member's
  add while their page is open and the Cast list draws, `app.errors` empty.
  Clear asks, then empties.
- **Delete still asks** (SQ4): removing a session asks; after yes, the toast
  offers Undo, and Undo brings it back with its close-out.
- **End then Undo:** end an encounter with a Keep. The toast reads *Ended
  …*; Undo puts the encounter back to running and removes the kept member
  and the fight's lines.
- **A leftover toast:** record A, then B through another press. A's toast
  (if still in the DOM) undoes nothing (107's identity rule).
- **Export and Import:** an exported table carries its trail; imported
  fresh, Activity lists it and Undo works.
- **Version pins:** the nine `"0.11"` assertions move to `"0.12"`; nothing
  else in those tests.

**`tests/hostile.test.mjs`:** a table file whose trail carries a label of
`<img onerror>` and a crafted entry in every way §7's gate drops. It renders
the label as text in Activity and the toast, drops the crafted ones, and an
Undo of what's left writes only inside the table. `Object.prototype` is
untouched, `meta.id` is unchanged, and there's no `img` in the page.

**Mutation-test** (record each in the PR with the test that actually caught
it). Check each for a second path first:

1. **Snapshot at `tableChange`'s start instead of the baseline** → smoke
   *Take 6 then Undo* (the Encounters write happened before).
2. **`diffTable` with `deep` off** → engine *the size* (and the rename's
   two scalar ops).
3. **`diffChar` with `deep` on** → engine *the character is untouched*.
4. **The fold ignoring paths** (any two scalar entries fold) → engine *a
   different field is a second entry*.
5. **The gate letting `["meta","id"]` through** → engine *the gate* and the
   hostile test.
6. **The toast's identity check removed** → smoke *a leftover toast*.
7. **`notice` replacing the undo toast whole** → smoke *Add to … then Undo*
   (no Undo on the toast).
8. **The trail kept across a schema step** → engine *a 0.11 file carrying an
   audit*.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and at
the end; the targeted test files after each step.

1. Confirm 212 and 0.12 are free on `origin/main`. Search the ledger again for
   the pre-flight's names.
2. **The walker:** `deep` on `_walk`/`_arrayDiff`, `insertAt` in `_applyOp`.
   The character pin test first, green before and after.
3. **The table's engine:** `diffTable`, `tableActionLabel`,
   `recordTableAction`, `undoTableAction`, `clearTableActivity`, exported.
   The 0.12 step and the gate in `migrateTable`. The version pins. Engine
   tests.
4. **The recording point:** `tableChange`'s baseline and `label`, the four
   named presses, the drafts closing on undo. Smoke for a press, a typed
   field and End.
5. **The toast:** the table's undo toast, `notice` keeping Undo, no toast
   while typing.
6. **Activity:** the menu item, the modal, Undo, Clear.
7. **Hostile** test; the CSS for the modal's list.
8. **In the browser** (`shadows-dev-preview`, `?gm=on`, a pack slotted):
   run an encounter, a hit, End with a Keep, then Undo from the toast. Type a
   motivation, then Undo from Activity. Delete a session, say yes, Undo. Add
   to an encounter from a card, Undo. Export, re-import, Undo. Then
   **390px**, **768 × 1024**, **1300px**. `npm run phone-check`.
9. The mutations (§9).
10. Ledger (212, 171 and 176 marked), INDEX, SCHEMA §3 (`audit` in the table
    file, 0.12), the plan, STATE, W83 to `log/wishes-granted.md`, docs,
    close-out (§12).

## 11. Stop and ask

- 212 or 0.12 is taken.
- The ledger search finds a decision 212 overrides that the pre-flight
  doesn't name.
- A table writer that **doesn't** reach `tableChange` (a write followed by a
  bare `update()` or `saveTable()`).
- `diffChar`'s pinned ops change at all.
- Any entry on the fixture is over 1 KB other than End's, or End's is over
  4 KB.
- Undo's round trip isn't deep-equal for some writer: name it, don't patch
  around it.
- An existing test needs a change beyond the nine version pins.
- The voice test flags any of the new copy.
- The decision goes over 350 words.

## 12. Close-out

*Rule or shape* tier, switched off, table schema 0.12:

- **SCHEMA:** 212; 171's and 176's marks; §3's table file gains `audit` and
  0.12's line.
- **INDEX:** 212's line under **GM mode**; 171's and 176's lines marked.
- **STATE:** the versions line (table schema 0.12); §1's GM clause gains *and
  keeps an activity log, every change undoable last first, a toast on each
  press and Activity in the menu (212)*; what's next.
- **The plan:** the build-order table gains S15 (W83, Decision 212).
- **Wishlist:** W83 moves whole to `log/wishes-granted.md`, its heading
  pointing at *→ Decision 212 (switched off)*.
- **`changelog-pending.md`:** ✎ *Undo at the table. Every change to your
  table, from a hit to a close-out, can be taken back, last first: from the
  toast, or from Activity in the menu.*
- **Log** entry (the measurement: 15–40 KB an entry with the character's
  diff, ~250 bytes with the table's; why the baseline, not the callback);
  **shipped** row *(switched off)*; README's table: S15's row.
- **PR** titled `feat(gm): the table's activity log, with undo, switched off
  (S15, Decision 212)`. Body: what changed; the mutations; the browser
  check; the sizes measured; **Where the order didn't fit**.

## 13. Review checklist

- [ ] **In the browser, by the orchestrator:** a hit, then End with a Keep,
      each undone from the toast; a typed field is one entry; Activity's Undo
      keeps focus; a deleted session comes back; an Add to's toast reads its
      notice with Undo.
- [ ] Undo round-trips deep-equal for every writer family.
- [ ] `diffChar` unchanged; the character pin test is mutation-checked.
- [ ] The gate drops `meta.id` paths, and a 0.11 file's trail.
- [ ] The sizes in the PR match §9's limits.
- [ ] Only the nine version pins changed in existing tests.
- [ ] 390px: the modal fits; nothing scrolls sideways.
- [ ] 171 and 176 marked; table schema 0.12 everywhere it's written.
- [ ] Two mutations re-run locally.
