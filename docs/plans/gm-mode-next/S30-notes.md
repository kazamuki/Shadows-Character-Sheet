# Work order S30: Notes that organise themselves, at the table and on the sheet

**Plan:** [`../gm-mode-next.md`](../gm-mode-next.md), session S30. **The ask:** W140 (Ken, 2026-10-30): a GM tags a note,
files it under a category, and sees one session's notes beside another's. **Ken, 2026-11-27, in the conductor session:**
"I bet we could extend that to the character sheet itself. I realized that the 'notes' section for the Character sheet is
just a big text box. Being able to make notes and categorize them as a player would be helpful as well." He chose **one
order, two PRs**: this order designs **one note shape and one list** for both sides.
- **PR 1** builds it in GM mode (W140; table schema and `migrateTable()`).
- **PR 2** brings it to the sheet's Notes tab (W55 folds in; character schema and `migrate()`).

**Status:** **drafted 2026-11-27** by Claude (Opus, the S27 reviewer), from `main` at `b711c3a` (S27 merged, #408).
Not approved.
**Branch:** PR 1 and PR 2 each from `main`, PR 2 cut after PR 1 merges. Each PR goes to `main`. Nothing ships switched
off: GM mode is on for everyone (Decision 260), and the sheet has no switch.
**Runs beside:** nothing. One build at a time (Ken). **Say N everywhere.** Two decisions (**N** in PR 1, **N+1** in PR 2),
each taken at its own build.

**Pre-flight** at `b711c3a`. The probes on `main`, run with `loadEngine()` against `samples/dead-air.shadows-table.json`:
- *Dead Air* has **8** notes, keys `id, title, text, session, created, updated`; two are filed to session `SE-PJB1ZXSS`.
  `Engine.sessionNotes(t, "SE-PJB1ZXSS")` returns *The Listener (spoilers)* and *Session 6: loose ends*. Table schema
  **0.22**.
- `migrateTable()` **keeps** fields it doesn't know on a note: a note given `tags:["lead"]` and `category:"Rules"` comes
  through with both. So an app older than PR 1 that opens a PR 1 table keeps the tags (and `tableCheck` warns it's newer).
- `Engine.addTableNote(t, { category, tags })` ignores both today; `tableSearch` reads a note's title and text only
  (engine ~8559).
- `Engine.migrate()` keeps a key it doesn't know (`noteCards` came through), and **turns a `notes` that isn't a string
  into `""`** (engine ~6034). So a sheet note list stored under `ch.notes` would be **wiped** by any older copy of the app
  that opened the file. That decides PR 2's key (§8).
- A player's Session Log entry is `{ date, title, ipEarned, milestonePoint, notes }`: **no id**. Delete removes it by
  index (sheet.js ~4515), so nothing can point at one safely today.
- Character schema **0.35**. The ledger ends at **322**.

### Carried over (S27's review; the order's own, not the build's)

- **Run every script the order cites as evidence, and record the rows it read.** S27's audit said "0 differences" on a stat
  check whose regex never matched. This order's probes above are counted (8 notes, 2 filed, 5 player fields).
- **Read a decision before paraphrasing it.** S27's GQ94 said `rulingSource` is "shown as 288 shows it"; 288 says never
  shown. Every decision this order cites was opened at `b711c3a`.
- **Grep every worked example's term in the data or the sample.** S27 searched for "silenced", which is in nothing. Every
  example in §10 names a note from *Dead Air* or one the test makes.
- **List every field a shape reads and every field it leaves out.** S27's §8 dropped armor `feature`/`notes`, weapon
  `notes`, grenade fields and power `origin`, and review added them back on Ken's yes. §8 here has a "left out" line for
  every shape.
- **Record `npm run verify`'s exit code.** S27's first full verify was piped through `head` and its result lost. Run it with
  output to a file and `echo exit $?`.
- From S26 onward: **name what prints**, **a screen rule goes in `shadows.css`**, and **the review runs it at 375px**.

## 1. Goal and Done when

**Goal.** A GM or a player writes a note, gives it a category and a few tags, and finds it again by category, by tag or by
the session it came from, in one list that reads the same at the table and on the sheet.

**Done when, PR 1 (GM mode):**
1. A table note has a **category** (one, optional) and **tags** (any number), typed as text, with the ones already in use
   offered as you type.
2. The Notes tab still lists titles, one open at a time (Decision 271), now **grouped**: by **Category** (the default), by
   **Session**, or **Newest first** (today's list). A row of the tags in use filters the list to one tag. Grouping and the
   filter are view state: nothing is stored.
3. **Find** reaches a note by its category and its tags. A session's page still lists its notes.
4. Every change is in the Activity log and undoes (Decision 212). Typing folds as today.
5. A table saved before PR 1 opens with every note uncategorized and untagged; nothing is lost. Table schema bumps, with a
   `migrateTable()` step.

**Done when, PR 2 (the sheet):**
6. The sheet's Notes tab has the same list, over the player's own notes: add, open one at a time, category, tags, a
   session from the player's Session Log, grouped and filtered the same way.
7. Today's free-form notes are untouched: they stay below the list as they are (GQ95).
8. Add, Delete, a category, a tag and a session are logged and undo (W55: "logged"); typing a note's title or text
   isn't, as today's free notes and a gear row's notes aren't (GQ97).
9. A character saved before PR 2 opens with no notes in the list and its free notes intact. Character schema bumps, with a
   `migrate()` step; Session Log entries gain an id.
10. The GM's read-only view of a seat (Decision 256's sheet) shows the list read-only, groups and filter still live.

## 2. Tier, versions, numbers

**Rule or shape**, both PRs. Each moves a saved file's shape.
- **PR 1:** table schema **0.23** (or the next free, if another PR bumps it first) with a `migrateTable()` step.
  App: a minor. Decision **N**.
- **PR 2:** character schema **0.36** (or the next free) with a `migrate()` step. App: a minor. Decision **N+1**.
- **Game data:** none. The new copy is Help (`gmGuide`, `sheetGuide`) and `appCopy`. No character's computed values or
  choices move (Decision 68).
- **Pack schema:** none. **Flags:** none.

## 3. The decisions, drafted

```
N. **A note has a category and tags, and the Notes tab groups and filters by them and by session.**
     *2026-11-?? · Ken + Claude · Touches: table notes, note category, note tags, addTableNote, editTableNote, noteGroups, noteTagsInUse, Notes tab, Group by, tag filter, tableSearch, Find, sessionNotes, migrateTable, table schema 0.23, Decision 208, Decision 212, Decision 271, W140, W55*
     - **Decided:** a table note gains `category` (one typed string, "" for none) and `tags` (typed strings, trimmed, a tag kept once whatever its case), both stored as written; the groupings are computed (`Engine.noteGroups`). The Notes tab groups its titles by Category, Session or Newest first, and a row of the tags in use filters it; both are view state. Find reads a note's category and tags. The list is drawn by one renderer the sheet will share.
     - **Why:** W140. A GM's notes are for many reasons (a name, a ruling, a hook, a promise), and a flat list of titles stops scaling after a few sessions. Typed text keeps the note an input (constraint 7), and the session link the note already has (208) is the third grouping for free.
     - **Rejected:**
       - Tags as links to the cast, threads or places: a line (an interaction) already ties a cast member, a thread, a place and a session together; a note is what doesn't fit a line.
       - A category list the GM manages: a second record to keep in step, where the categories in use are already in the notes.
       - Several categories per note: that's what tags are for.
       - Storing the chosen grouping: it's a view, like Reference's search.
     - **Replaces:** Decision 271 in part (Notes lists titles, now in groups); Decision 208 in part (Find reads a note's category and tags).
     - **Revisit if:** a GM wants a note tied to a record (then a note gains links, and the line is reconsidered), or the tag row is too long to use at 375px.
     - **Built:** table schema 0.23, app X.Y.Z, PR #…, log 2026-…
```

```
N+1. **The sheet's Notes tab keeps the player's notes as a list, the same shape and list as the table's, above the free notes.**
     *2026-11-?? · Ken + Claude · Touches: noteCards, notes, Notes tab, renderShNotes, note category, note tags, note session, sessions id, logSession, Delete session, migrate, character schema 0.36, print, read-only sheet, RO_SECTIONS, RO_READERS, sheetGuide, Decision N, Decision 256, W55*
     - **Decided:** a character gains `noteCards`, a list of notes in Decision N's shape, whose `session` is the id of an entry in the player's Session Log; each Session Log entry gains an `id` (`migrate()` gives each one, and Delete clears the notes that pointed at it). The Notes tab draws Decision N's list above the free-form `notes`, which is unchanged. Add, Delete, a category, a tag and a session are logged and undo; typing isn't. The printed sheet lists the notes before the free text. The GM's read-only seat view shows the list read-only.
     - **Why:** Ken (2026-11-27): the Notes tab is a big text box, and a player sorts notes the way a GM does. One shape and one list means one set of rules and one renderer.
     - **Rejected:**
       - The list under `notes`, the free text turned into its first note: any older copy of the app opening the file sets a non-string `notes` to "" and loses every note (the pre-flight's probe); a new key costs nothing.
       - A session as the entry's index or date: Delete shifts indexes, and two sessions can share a day.
       - Logging every keystroke: the sheet's undo has no typing fold, and today's free notes aren't logged.
     - **Replaces:** nothing. W55's "the free-form page stays as it is" holds.
     - **Revisit if:** players stop using the free notes (then fold them in, by a migrate step that keeps the text), or a player wants a note shared with the GM.
     - **Built:** character schema 0.36, app X.Y.Z, PR #…, log 2026-…
```

**Supersession marks (PR 1):** 271 → **superseded in part by N** (Notes groups its titles); 208 → **superseded in part
by N** (Find reads category and tags), and both INDEX lines. **Read, not changed:** 203, 212, 255, 256, 270, 305.
**PR 2:** none expected. If PR 1's review moved the shape, N+1's **Replaces** names the change (§13).

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| **GQ95** | **Today's free notes on the sheet.** (a) Stay as they are, below the new list. (b) Become the list's first note, titled "Notes", and the text box goes | **(a).** W55 asked for it; nothing about a player's file changes meaning; and (b) needs the text moved to a new key anyway (the pre-flight's probe: an older app wipes a non-string `notes`). If the free notes go unused, (b) is a later migrate step |
| **GQ96** | **A player's note's session.** (a) An id on each Session Log entry, given by `migrate()`, cleared from notes when the session is deleted. (b) No session link on the sheet: group by Category and Newest only | **(a).** It's the same grouping the GM has, and the Log is where a player's sessions are. It moves the Log's shape a little (an id); nothing reads the id but notes |
| **GQ97** | **What the sheet logs.** (a) Add, Delete, category, tags and session logged; typing a title or text not (as today's free notes and a gear row's notes). (b) Every keystroke logged (no fold on the sheet) | **(a).** The table folds typing (212); the sheet has no fold, so (b) would put one entry per keystroke in the Activity Log |
| **GQ98** | **Is a player's note the GM's to read?** The GM's read-only seat view already shows the free notes | **Yes, as today.** The player chose to hand the file over. A private note is its own wish if asked |
| **GQ99** | **Group by's default.** (a) Category. (b) Newest first (today's order) | **(a).** It's what the feature is for; a list with no categories yet reads as one "No category" group in today's order, so nothing moves for a GM who never types one |
| **GQ100** | **What prints.** (a) The sheet prints the notes (title, category, text) before the free text; the table's session page prints its notes as today. (b) Notes don't print | **(a).** The sheet already prints its free notes (sheet.js ~3365) |

## 5. The assumption sweep

Every row was found by grepping the field's readers at `b711c3a`.

### PR 1: the table

| What | Today (where) | After |
|---|---|---|
| A table note's shape | `{ id, title, text, session, created, updated }`; `migrateTable` sets those six (engine ~7360) and keeps other keys | adds `category` ("" when missing or not a string, trimmed) and `tags` (strings only, trimmed, empty dropped, one per case-folded value, in their order). Step for 0.23: every note gets `category:""`, `tags:[]` |
| `TABLE_SCHEMA_VERSION` (engine ~7215) | `"0.22"` | `"0.23"` (or next). `tests/` pins it: grep `0.22` in `tests/` and update the literal the bump moves (§13: expected) |
| `addTableNote(t, f)` (~7635) | title, text, session; `jot` rules (270) | also `category`, `tags` from `f` through the same cleaners. Jot passes neither: a jot is uncategorized |
| `editTableNote(t, id, f)` (~7649) | title, text, session | also `"category" in f`, `"tags" in f` |
| `tableActionLabel` (~7496) | a changed note reads `_recLabel("Changed", "notes", …)` | unchanged for typing; a tag or category press passes its own label (§9) through `tableChange(fn, redraw, label)` |
| `tableSearch` notes (~8559) | `[["Title", …], ["Note", …]]` | adds `["Category", category]` and one `["Tag", t]` per tag. **Check** the field name `test(kind, id, title, fields)` records (engine ~8544) reaches the Find modal's hit line (gm.js ~847) |
| `sessionNotes(t, id)` (~8387) | the notes filed to a session | unchanged. The session page (gm.js ~2714) lists them as today; it may show a note's category, not required |
| `removeSession` (~8366) | clears `n.session` | unchanged |
| `notesTabHtml(t)` (gm.js ~606) | flat `<ul>` of `noteCardHtml`, newest first | the Group by control, the tag row, then one `<ul>` per group under a heading. Through a renderer in **`shared.js`** (§9), so PR 2 calls the same one |
| `noteCardHtml(n)` (gm.js ~594) | title button, a session tag; open shows text; editing shows Title, Note, Session | closed: adds the category and tags as `tag plain` chips; editing adds **Category** (input with a datalist of those in use) and **Tags** (§9) |
| `bindNotes` (gm.js ~762) | title/text on `input`, session on `change`, open, New note, Delete | category on `input` (folds as typing), tag add/remove as presses, Group by and tag filter as view state (`S.noteGroup`, `S.noteTag`), not stored |
| `S.noteOpen` / focus (gm.js ~475, ~721) | one open note; leaving the tab clears it | unchanged. A group change keeps the open note open if it's still shown; a tag filter that hides it closes it |
| Jot (gm.js ~920–948) | `addTableNote({ text, date, jot:true })`; redraws Notes or the session page | unchanged; the new note lands in "No category" |
| Help `gmGuide.contexts.notes.for` (data ~5622) | "Anything you want to keep for yourself: a campaign pitch, safety notes, spoilers, rulings you've made, a rumor table." | adds one sentence on categories and tags (§9). Grep `gmGuide.words` and the `tips` for "Notes" lines |
| `samples/` (*Dead Air*) via `tools/sample-table.mjs` | 8 notes, 0.22 | the builder gives several notes a category and tags (e.g. *Campaign pitch*, *Safety and table notes* and *House rulings so far* under **Table**; *The Listener (spoilers)* tagged `listener`), so the sample shows the feature; `sample-table.test.mjs` re-reads it |
| `tests/hostile.test.mjs` table notes | title/text/session hostile | adds hostile `category` and `tags` (an object, a number, `<img>`, a 10,000-char tag) |
| A session's page, its print and its Markdown (gm.js ~2714 `jottedHtml`, ~2748; Decisions 304, 305) | the session's notes under **Jotted**: title (or first line), printed and copied | unchanged: a note's category and tags aren't added there. **Check** `jottedHtml` reads only `noteName` and text, so it needs nothing new |
| Print | the Notes tab doesn't print | unchanged |

### PR 2: the sheet

| What | Today (where) | After |
|---|---|---|
| `newCharacter()` (engine ~104) | `sessions:[], notes:""` | adds `noteCards:[]`. `notes` stays a string |
| `migrate()` (~6034) | `if (typeof c.notes!=="string") c.notes=""` | unchanged for `notes`. `noteCards` through the same cleaner as a table note (one function: §8); its `session` kept only if it names an entry in `c.sessions` |
| `ch.sessions[]` (`logSession`, ~4020) | `{ date, title, ipEarned, milestonePoint, notes }`, no id | gains `id` (`S-` + eight, unique within the character). `migrate()` gives one to every entry without a valid one |
| Delete session (sheet.js ~4515) | `ch.sessions.splice(i,1)` inside `commit` | also clears `session` on every note that named it, in the same `commit` (one undo restores both) |
| `ipState` / `milestoneState` (engine ~3429, ~3662) | sum over `ch.sessions` | unchanged: an id adds nothing to a sum. **Check** no reader compares session objects whole |
| `diffChar` / `recordAction` / undo (~5708) | a patch over the character's keys; `safePath` gate on undo | `noteCards` is a character key, so it diffs. **Check** `safePath` admits `noteCards` paths (Decision 124) |
| `renderShNotes()` (sheet.js ~2943) | the header, then a textarea `data-notes` | the shared list (§9) over `ch.noteCards`, then the textarea, its label "Free notes" (copy for the voice pass) |
| Notes bind (sheet.js ~4980) | `ch.notes = value; lite()` | unchanged for the textarea. The list's handlers: add/delete/category/tag/session through `commit("notes", label, fn)`; title/text through `lite()` |
| Print (sheet.js ~3365) | `<div class="p-section">Notes</div>` then the free text | the notes (title, category, text), grouped by category, then the free text (GQ100). `print.css` for any new class |
| The GM's read-only seat view (gm.js ~4836–4871) | `RO_SECTIONS` includes Notes; `RO_READERS` lists what stays live | the list draws read-only (no Add, no edit); Group by, the tag row and a note's open/close stay live: add their selectors to `RO_READERS` |
| `sheetGuide.contexts.notes` (data ~5154) | intro "Freeform. The city keeps receipts — so should you."; for "Free text for what the sheet has no place for…" | the `for` line says notes have categories and tags (§9); the intro stays |
| The roster, export, `fileKind` | read `meta`, not notes | unchanged. **Check** the roster's card reads nothing from `notes` |
| `tests/hostile.test.mjs` character | hostile `notes` string | adds hostile `noteCards` and session ids |

## 6. Read first

`CLAUDE.md` (constraints 7, 8, 10; the change tiers; versions). SCHEMA §4: Decisions **170** (table migrate), **203**,
**208**, **212**, **256** (the read-only sheet), **270**, **271**, **124** (untrusted files and undo's paths), **154**
(Notes stays free). `engine.js`: the table notes (~7625–7665), `migrateTable`'s note loop (~7356–7368), `tableSearch`
(~8540–8580), `recordTableAction` and its fold (~7540), `migrate` (~5868–6040), `logSession` (~4017), `recordAction`
(~5708). `gm.js`: `noteName`, `noteCardHtml`, `notesTabHtml`, `bindNotes` (590–795), Find (~840), the read-only seat
(~4836). `sheet.js`: `renderShNotes` (~2943), the session delete (~4515), the print's Notes (~3365). `shared.js`: `commit`
(~328).

## 7. Out of scope

- **Links from a note to a cast member, thread, place or faction.** A line already does that (§3, Rejected).
- **A category list the GM edits, renames or orders**, and renaming a tag everywhere at once. A later wish if asked.
- **Jot with a category or tags.** Jot stays one line.
- **Notes the GM sends a player, or a player's note shared with the GM** (W146, the dispatch).
- **The free notes' textarea** (GQ95 (a)): it isn't restyled or moved into the list.
- **The thread's, place's and faction's own `notes` fields**, and a Session Log entry's `notes`: they're text on a record,
  not notes in the list.

## 8. The shapes

**One note, both sides.** A note is `{ id, title, text, category, tags, session, created, updated }`.
- `id`: the table's `N-` + eight (`NOTE_ID_RE`); the sheet uses the same pattern.
- `category`: a string, trimmed; "" for none.
- `tags`: an array of strings, each trimmed and at most 40 characters; empty ones dropped; a tag kept once by its folded
  form (`_fold`, Decision 187), the first spelling winning.
- `session`: an id in the same file's sessions (`t.sessions` on a table, `ch.sessions` on a character), else `null`.
- `created`, `updated`: ISO strings or `null`, as today.
- **Left out on purpose:** a colour, a pin, an order the user sets, links to records (§7). Nothing derived is stored.

**Engine** (one normaliser, one reader, used by both sides):
- `_note(n, usedIds, sessionIds)` cleans one note in place. `migrateTable` and `migrate` both call it.
- `Engine.noteGroups(notes, sessions, { by, tag })` returns `[{ key, title, notes }]`.
  - `by:"category"` (the default): one group per category in first-use order, then "" last, titled by the category, or
    `null` for "" (the UI says "No category").
  - `by:"session"`: newest session first by date, then the unfiled.
  - `by:"newest"`: one group, today's order.
  - `tag`: keeps only notes with that tag, matched folded.
  - **Total:** notes or sessions not arrays give `[]`; a note that isn't an object is skipped; an unknown `by` reads as
    "category". **Left out:** it never sorts within a group; groups keep the list's order (newest first, as `unshift`
    makes it).
- `Engine.noteTagsInUse(notes)` returns the distinct tags, in first-use order, folded-unique, for the tag row and the
  datalist. `Engine.noteCategoriesInUse(notes)` does the same for categories.
- **PR 1:** `addTableNote`/`editTableNote` take `category` and `tags` (§5).
- **PR 2:** `addNoteCard(ch, f)`, `editNoteCard(ch, id, f)`, `removeNoteCard(ch, id)` mirror the table's three; `logSession`
  gives the new entry an id; `Engine.removeSessionEntry(ch, i)` deletes a Log entry and clears its notes' links (the sheet
  calls it inside `commit`).

**The saved files.** PR 1: table 0.23. A 0.22 table's notes get `category:""` and `tags:[]`; nothing is guessed. PR 2:
character 0.36. A 0.35 file gets `noteCards:[]` and an id on each Log entry; `notes` is untouched.

## 9. The UI

**One renderer, in `shared.js`:** `notesListHtml(notes, sessions, view, opts)` draws the Group by control, the tag row and
the groups of titles; `opts` says whether it's editable (the read-only seat passes `false`), the `data-` prefix it binds,
and the session label function. PR 1 moves the table's card markup into it. PR 2 calls it with the character's notes. A
note's card stays the table's: closed is the title with its session, category and tags as chips; open shows the text;
**Edit** gives the form.

**The form** gains **Category** (a text input with a `<datalist>` of `noteCategoriesInUse`) and **Tags**: the note's tags as
chips, each with a remove ✕ (a `button` named "Remove tag X"), and an input with a datalist of `noteTagsInUse`. Enter or a
comma adds the typed tag. Behaviour, not markup: what matters is that adding and removing are single presses with their
own log labels, and typing a category folds.

**Group by:** a three-way control above the list (Category · Session · Newest), a radio group or segmented buttons. **The
tag row:** one chip per tag in use; pressing one filters to it and marks it pressed (`aria-pressed`); pressing it again
clears the filter. With no tags in use, the row isn't drawn. At 375px the tag row wraps (Decision 209's chips).

**Where things land:**

| Press | The record | The view | Focus |
|---|---|---|---|
| New note | an empty note (no category; no tag, even with a tag filter on) | it opens in edit at the top of the list, above the groups, until Done | Title |
| Add a tag (Enter) | the tag added | the note stays open in edit; if a tag filter is on and the note now matches it, it stays shown | the tag input, cleared |
| Remove a tag | the tag gone | stays open; if the filter is that tag, the note stays shown until Done (no vanish mid-edit) | the next chip's ✕, else the tag input |
| Change the category | category set (typing, folds) | the group it belongs to changes on **Done**, not while typing | stays in the input |
| Done | nothing | the list redraws grouped; the note is closed-open (read view) in its new group | the note's Edit |
| Group by / a tag chip | nothing stored | the list regroups; an open note stays open if shown, else closes | the control pressed |
| Delete | the note gone (asks first, as today) | the list | the next note's title, else New note |

**Log labels** (Decision 212's toast and Activity), drafted for the voice pass: `Tagged "<note>" <tag>`, `Untagged "<note>"
<tag>`, `Filed "<note>" under <category>` (one entry per typing burst, folded), `Filed "<note>" under no category`.

**Copy, drafted for the voice pass:**
- Group by's label: "Group by"; options "Category", "Session", "Newest".
- The unfiled group: "No category"; the unsessioned: "No session".
- Help, `gmGuide.contexts.notes.for`, adds: "Give a note a category and a few tags, and the list groups and filters by them."
- Help, `sheetGuide.contexts.notes.for` (PR 2): "Notes for what the sheet has no place for, each with a category and tags to
  find it again. The free notes below are for anything else. It's all saved with your character."
- The sheet's textarea label (PR 2): "Free notes".

## 10. Worked examples, as named tests

Each fails on `main` or the builder says why it passes. PR 1's in `tests/engine.test.mjs` and `tests/smoke-table-*.test.mjs`
(the file that already draws Notes); PR 2's in `tests/engine.test.mjs` and `tests/smoke-sheet-*.test.mjs`.

**PR 1:**
1. `"N: an older table's notes open uncategorized and untagged, and keep everything else"`: *Dead Air* at 0.22 through
   `migrateTable`: 8 notes, each `category:""`, `tags:[]`, title, text and session unchanged (deep-equal the rest).
2. `"N: a note's tags are trimmed and kept once whatever their case"`: `editTableNote(t, id, { tags:[" Lead", "lead",
   "", 5, "Ibarra "] })` → `["Lead", "Ibarra"]`; a 41-char tag is cut to 40.
3. `"N: noteGroups groups by category, session and newest, and a tag filters"`: three notes made in the test (categories
   "Rules", "", "Rules"; tags `["lead"]`, `[]`, `["Lead","ibarra"]`): by category → groups "Rules" (2) then `null` (1); tag
   "LEAD" → the two tagged notes; by session over *Dead Air* → `SE-PJB1ZXSS`'s group holds *The Listener (spoilers)* and
   *Session 6: loose ends*.
4. `"N: Find reaches a note by its category and its tags"`: give *House rulings so far* category "Table" and tag "ruling";
   `tableSearch(t, "ruling")` hits it with field "Tag"; `tableSearch(t, "Table")` hits it with field "Category".
5. `"N: tagging and untagging a note is one undoable entry each, with its own label"`: tag, tag, untag → three entries;
   undo three times → the note as it was.
6. Smoke, `"N: the Notes tab groups by category, filters by a tag, and keeps the open note"`: on *Dead Air* with the sample's
   categories, the tab shows a heading per category; pressing a tag chip leaves only its notes; an open note that matches
   stays open; Group by Session shows *Session 6: loose ends* under its session's title. A hostile tag (`<img src=x>`)
   renders as text.
7. `"N: noteGroups and the note cleaner are total"`: notes, sessions and a note's fields as `null`, `"x"`, `5`, `{}`,
   arrays of junk: never throws, returns arrays.

**PR 2:**
8. `"N+1: an older character opens with no listed notes, its free notes and sessions intact, each session with an id"`: a
   0.35 character with `notes:"Contacts"` and two Log entries → `noteCards:[]`, `notes:"Contacts"`, both sessions keep their
   fields and gain distinct ids.
9. `"N+1: deleting a session clears the notes that named it, and one undo restores both"`.
10. `"N+1: a note card is the table's shape"`: the same cleaner; a note with `session` naming no Log entry comes out `null`.
11. Smoke, `"N+1: the Notes tab lists the player's notes above the free notes, and typing isn't logged"`: add a note, tag it,
    type its text, then Undo → the tag goes and the typed text stays.
12. Smoke, `"N+1: the GM's read-only seat shows a player's notes, and Group by still works"`.
13. `"N+1: the printed sheet lists the notes before the free notes"`.

## 11. Tests beyond the examples

- **Mutation-test:** the cleaner keeping a duplicate tag (2 fails); `tableSearch` not reading tags (4 fails); `migrateTable`'s
  step dropped (1 fails); Delete session not clearing notes (9 fails); the sheet's tag press going through `lite()` instead
  of `commit` (11 fails). For each, check a second path doesn't cover the line.
- **Hostile:** `hostile.test.mjs` for a table and a character with junk `category`, `tags`, `noteCards`, and a session id
  aimed at `__proto__`.
- **Round trip (constraint 8):** `newCharacter()` → `migrate()` keeps `noteCards`; `newTable()` → `migrateTable()` keeps
  both new fields.
- **Voice:** `voice.test.mjs` over the new copy.
- **Phone:** `npm run phone-check` passes; the Notes tab at 375px with a long tag row.

## 12. Steps

**PR 1:**
1. Baseline: `git submodule update --init private`, `npm run test:fast`.
2. Write §10's 1–7; show them failing on `main`.
3. The cleaner, `noteGroups`, `noteTagsInUse`, `noteCategoriesInUse`, the migrate step, add/edit, Find. `npm run test:fast`
   and `npm run test:table`.
4. The shared renderer and the Notes tab; Help's line; the sample's categories and tags (`tools/sample-table.mjs`).
   `npm run test:table`. Run it in the dev preview (*Dead Air*: the samples line in `CLAUDE.md`), desktop and 375px.
5. Close-out. Full `npm run verify` to a file, with its exit code.

**PR 2** (after PR 1 merges; re-read §13's last rule first):
1. Baseline as above, then §10's 8–13 failing on `main`.
2. Session ids, the note cards, `migrate`, Delete. `test:fast` and `test:sheet`.
3. The Notes tab, the print, the read-only seat, Help's line. `test:sheet`, `test:table`. The dev preview.
4. Close-out and the full `verify` with its exit code.

## 13. Stop and ask

- **Stop** if:
  - a note's category or tags need a value the user didn't type (anything derived to store);
  - the shared renderer can't serve both sides without a branch on which side it is (that means the shape isn't one shape);
  - Delete session can't clear notes inside the same `commit`;
  - Find's hit line can't name the field "Tag" or "Category" without a change to the Find modal's markup beyond its label.
- **Expected, not stops:** the schema literals the bumps move in tests; `sample-table.test.mjs`'s counts if the sample
  gains categories; the Notes tab smoke tests that count `.tbl-note` (the groups wrap them, the count holds).
- **What PR 2 may change if PR 1's review moved the shape.** PR 2 takes the shape as merged on `main`, not as this order
  wrote it. If review changed a field's name, its cleaning rule or `noteGroups`' signature, PR 2 follows the merged code,
  says so under *Where the order didn't fit*, and N+1's **Replaces** names it. PR 2 may **not** change the merged table shape
  or Decision N (that would be a table schema bump, its own order); if it needs to, stop and ask.

## 14. Close-out

Each PR runs the `close-the-session` skill for *Rule or shape*:
- **PR 1:** Decision N, its INDEX line, the marks on 208 and 271. App minor; table schema 0.23. STATE's GM mode row. The log,
  a `shipped.md` row, the plan's S30 row ("PR 1 built"). W140's Plan line.
- **PR 2:** Decision N+1 and its INDEX line. App minor; character schema 0.36. STATE. The log, `shipped.md`, the plan's S30
  row built. W55 and W140 move to `log/wishes-granted.md`.

**CHANGELOG** (drafted, player and GM voice, bold lead-ins):
- PR 1, under *GM mode*: "**Notes have categories and tags.** File a note under a category, tag it, and the Notes tab groups
  them by category or session, or shows one tag's notes."
- PR 2, under *Character sheet*: "**Notes you can sort.** The Notes tab keeps notes with a category and tags, grouped and
  filtered like a GM's. Your free notes are still there, below them."

**PR titles:** `feat(gm): notes have categories and tags (S30 PR 1, Decision N)` and `feat(sheet): notes you can sort (S30
PR 2, Decision N+1)`.

**PR body:** the template's sections, plus **New strings as rendered**, **Screenshots** (desktop and 375px), **What prints**,
and **Where the order didn't fit**.

**Review checklist:**
- §1's checks for that PR, run in the preview at desktop and 375px.
- *Dead Air* opened from 0.22 (PR 1) or a 0.35 character (PR 2): nothing lost, by a deep-equal of the fields that didn't
  move.
- Every label in the Activity log for a tag, category and session press, as rendered.
- The open-note rows of §9's table, each pressed in the preview.
- Hostile tags and categories; the voice of every string.
- `npm run phone-check`; the tag row at 375px.
- PR 2: the read-only seat; the print preview's Notes section; Delete session then Undo.

## 15. Handing it over

The builder and reviewer prompts are in `WORK-ORDERS.md`, with this order's path and **which PR** (PR 1 or PR 2). Its own
traps:
- **The sheet's `notes` is a string and stays one.** The list is `noteCards`. Setting `notes` to anything else loses a
  player's text in any older copy of the app.
- **One renderer, in `shared.js`.** Not a copy in `sheet.js`. Script order: `shared` loads before `gm` and `sheet`.
- **Group by and the tag filter are view state.** Nothing about them goes in the file.
- **Typing folds on the table, and isn't logged on the sheet.** A press is one entry on both.
- **Take the numbers at build** (the decisions, both schemas, the app) from `origin/main`, and again after any rebase.
