# Work order S26: a session's record — its name, its Markdown, its print

**Plan:** [`../gm-mode-next.md`](../gm-mode-next.md), session S26. **The wishes:** W73 (a session can have a name),
W86 (a session copied out as Markdown, Deighton's ask: he keeps his notes in Obsidian), W84 (print a cast member, an
encounter, a session's journal; the first plan's S13b). **The ask:** Ken, 2026-11-19, after S11b merged: "Draft S26".
**Status:** **drafted 2026-11-19** by Claude (Opus), the conductor. **Not approved.** GQ75–GQ80 are open.
**Branch:** from `main`; PR to `main`. Nothing ships switched off: GM mode is on for everyone (Decision 239).
**Runs beside:** nothing. One build at a time (Ken). **Say N everywhere** (N, N+1, N+2).

**Pre-flight** at `e0428dd` (`main`, after S11b's #369). `private/` at `c99bb58`.
- **A session is named in one place.** `Engine.sessionTitle(s)` (engine ~8292) returns "Session 5", or "Session" with
  no number. Every screen that names a session calls it: the list (`sessionLine`, gm.js ~2466), the page's `<h1>`,
  Back buttons, a line's session tag (`sentTag` ~1146), a note's tag and its Session picker (~528, ~535), *Closed in*
  (~2569, through `sessionLine`), Next session's *Last session set up* (~2556, through `sessionLine`), *Session N is
  open* (~2597), the close-out's title and **Close out Session N** (~2939, ~3051), the delete ask (~2812), the
  activity log's labels (engine ~7338, `Closed out …` ~3111), Find (`_sessionFields` ~8412) and the seat history
  (~8887). So W73 is one function and two "has a number" checks (~2939, ~3051), not a sweep of screens.
- **A session has no title field.** `addSession` (~8236) builds `{ id, number, date, present, hours, journal, close,
  created, updated }`; `editSession` (~8249) takes `number`, `date`, `present`, `hours` and the journal; the gate is
  `_session` (~7090). Table schema is **0.21** (S11b).
- **The session page** (`sessionReadHtml` ~2655) is the bar (Back to sessions), `recHeadHtml` (the `<h1>` and
  **Edit**), the day, Who was there and Hours (live), the threads block, the lines, *Also that day*, *Jotted*, the
  close-out (`closeOutSectionHtml` ~2938) and the Debrief (`debriefReadHtml`), a `<details>` **folded while the
  session is the one being played** (Decision 270). The form (`sessionFormHtml`) has Number, Day, Who, Hours.
- **The page's words already exist as functions.** A line is `sentenceHtml` (~1059), the award log is `coLogLine` +
  `coJobsLine` (~2906–2933, HTML with `<strong>` and `<em>`), a jot is `jottedHtml`'s text-then-title, the journal's
  labels are `JOURNAL` (~2453, gm.js, not the engine or the data), the day is `dayText` (~1087).
- **Printing today is the character's.** `printSheet(ch)` (app.js ~227) fills `#printSheet` and calls
  `window.print()`. `print.css` hides `#app` and every overlay and shows `#printSheet`, at `@page{ size: letter
  landscape }`, on Scott's paper look (Decision 96). GM mode prints a seat's character the same way (`data-roprint`,
  gm.js ~4688). **Nothing prints a table page:** the browser's own Print on a GM page prints `#printSheet`, which is
  empty or holds the last character printed.
- **No clipboard code exists.** Files leave the app as a Blob and an `<a download>` (`exportChar`, app.js ~240;
  the table's export, gm.js ~139). `announce()` (shared.js ~99) and the toast (`undoToastEl`, shared.js ~365) are
  the two ways the app says something happened.
- **`playwright-core` is a dev dependency** (`tools/phone-check.mjs`), so a scratch script can render print media
  in real Chromium (`page.emulateMedia({ media: "print" })`, `page.pdf()`). jsdom can't.
- **The ledger:** Decisions 203 (a session's shape), 205/302 (the award log), 208 (jots), 270 (the Debrief folds
  while played), 271 (read views, Edit), 96 (the print sheet's look), 160 (the pinned vitals), 258 (the cast page's
  docked stat block). 293's *Touches* says "the cast's print": it means the cast page's *printed* numbers (the book's),
  not a print feature. Nothing has ruled on a session's name, a table page's print, or Markdown.
- **Probes on `main`:** `Engine.sessionTitle({ number: 5 })` is "Session 5"; `({ number: null })` is "Session";
  `({ number: 5, title: "The Hub" })` is "Session 5" (the title is ignored, and `migrateTable` keeps an unknown key).

**Carried over** (S11b's review):
- **The reader sweep missed a tool.** `tools/sample-table.mjs`'s character builder (~873) reads the close-out's
  lines, and S11b's sweep didn't list it. Grep `tools/` and `tests/` as well as `src/` for every function and field
  this order changes: `sessionTitle`, `.number`, `JOURNAL`, `print.css`, `#printSheet`, `printSheet(`.
- **A drafted string disagreed with its neighbours** ("+Ç800" beside "+800 Çredits"). This order's strings sit beside
  existing ones: a named session inside "Back to …", "Close out …", "Delete …?" and the activity log. Read each in
  place, not alone.

## 1. Goal and Done when

**Goal.** A GM can give a session a name the table will remember it by, take a session out of the app as Markdown
to paste into their own notes, and print a session, a cast member or an encounter as the page reads.

**Done when:**
1. A session's form has a **Name** field after Number. "Session 5" with the name "The Hub" reads **"Session 5: The
   Hub"** everywhere a session is named (the pre-flight's list), and the list still sorts by number.
2. A session with a name and no number reads "The Hub"; with neither, "Session", as today. **Close out …** and the
   close-out's title use the name when there's no number.
3. A session's page has **Copy as Markdown**. It copies the session (§8's file) to the clipboard and says "Copied as
   Markdown." If the clipboard refuses, it saves `<Session title>.md` instead and says "Saved as Markdown."
4. A session's page, a cast member's page and an encounter's page have **Print**. It prints that page as it reads,
   on white, in portrait: its words, its numbers and its lines, without the header, the tabs, the bar or any button
   that only acts. The Debrief prints open even while the session is being played.
5. Printing a character (the header's **Print sheet**, a seat's **Print**, the blank sheet) prints exactly what it
   does today.
6. *Dead Air*'s sessions have names, all but one.

## 2. Tier, versions, numbers

**Rule or shape:** the table file's shape moves (a session's `title`), and how a page prints and what the Markdown
holds are player-facing behaviours someone could have chosen otherwise.
- **App:** a minor. Join `main`'s `[Unreleased]` heading if it's still a minor (0.73.0 at drafting), else take the
  next.
- **Table schema:** **0.21 → 0.22.** A session gains `title`, with a `migrateTable` step that gives every session
  `title: ""`. Nothing is guessed (203's rule).
- **Game data, character schema, pack schema:** none.
- **Decisions:** **N** (a session's name), **N+1** (a table page prints as it reads), **N+2** (a session as Markdown).
- **Flags:** none. No rule of the book is touched.

## 3. The decisions, drafted

```
N. **A session can have a name, read after its number: "Session 5: The Hub". The number stays its identity and its order.**
     *2026-11-?? · Ken + Claude · Touches: sessions, session title, sessionTitle, sessionLine, addSession, editSession, _session, the session form, Name, Closed in, Last session set up, Find, table schema 0.22, migrateTable, W73, GQ75, Decision 203*
     - **Decided:** A session keeps `title`, text, "" by default. `Engine.sessionTitle` reads "Session 5: The Hub" with both, "Session 5" with a number alone, "The Hub" with a name alone, and "Session" with neither, and every screen that names a session reads it. The list still sorts by number, then day (203).
     - **Why:** A table refers to its past by session ("Session 2, The Ledger"), and the number alone doesn't say which night that was. One function already names a session everywhere, so the name reaches every screen at once.
     - **Rejected:** The name instead of the number: a GM's number is the order and Ken's "last session" (S5a's review). A name separated by "·": the session list already uses "·" between the day, who came and the hours. Sorting by name: a name is text, not an order.
     - **Replaces:** Decision 203 in part: a session also keeps a name.
     - **Revisit if:** a GM wants sessions grouped into arcs by name, or the player's own Session Log wants the GM's name.
     - **Built:** app X.Y.Z, table schema 0.22, PR #…, log 2026-11-…

N+1. **A table page prints as it reads: a session, a cast member or an encounter, in portrait, without the app around it.**
     *2026-11-?? · Ken + Claude · Touches: Print, print.css, @page, #printSheet, #app, printSheet, the session page, the cast member's page, the encounter page, the Debrief, recHeadHtml, W84, GQ76, GQ77, GQ80, Decision 96, Decision 270*
     - **Decided:** **Print** on a session's, a cast member's or an encounter's page prints the page itself: `print.css` shows `#app`'s page instead of `#printSheet` while a table page is being printed, drops the chrome and every button that only acts, opens any folded part, and uses a portrait page of its own. The character's print is unchanged.
     - **Why:** The page is already what a GM wants on paper: its stat block, its rows, its award log, in its own words. A second renderer per page would say the same things twice and drift from the screen.
     - **Rejected:** A print renderer per page in `#printSheet` (three twins of three pages). Scott's paper look for table pages (96 is the character sheet's; a GM's page is a working page). Landscape (the sheet's: a session's journal and a cast page read down). The browser's own Print reaching table pages too (it would have to tell a character's print from a page's; W-new).
     - **Replaces:** nothing.
     - **Revisit if:** a GM wants a blank encounter for paper play (the worksheet, 252), a page prints badly enough to need its own layout, or places and factions want Print.
     - **Built:** as N.

N+2. **A session copies out as Markdown: its journal, then its threads, lines, jots and award log, in the page's own words.**
     *2026-11-?? · Ken + Claude · Touches: Copy as Markdown, sessionMarkdown, the session page, JOURNAL, sentenceHtml, coLogLine, coJobsLine, jottedHtml, the clipboard, .md, W86, GQ78, GQ79, Decision 205, Decision 208*
     - **Decided:** **Copy as Markdown** on a session's page copies one Markdown document: the session's title as a heading, its day, who came and the hours, then each written part of the Campaign Journal under its label, one bullet a line, then the threads it opened and closed, its lines, its jots and its award log. If the clipboard refuses, the same file is saved as `.md`. It reads the table and writes nothing.
     - **Why:** Deighton keeps his notes in Obsidian, as bulleted outlines, and wants what he wrote at the table there without retyping (W86). The journal is the night's story, so it leads; the record follows it.
     - **Rejected:** The whole table as one file (Obsidian keeps a note per session). Building it in the engine (the words are the page's, built in `gm.js`). Escaping the GM's own prose (Markdown the GM types should stay Markdown). Rich text (Obsidian pastes Markdown).
     - **Replaces:** nothing.
     - **Revisit if:** a GM wants a cast member or the whole campaign as Markdown, or Notes (S30) wants the same.
     - **Built:** as N.
```

**Supersession marks:** 203 → **superseded in part by N**, and its INDEX line. 205 and 302 are read, not changed.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| **GQ75** | **How a named session reads.** (a) "Session 5: The Hub". (b) "Session 5 · The Hub". (c) "Session 5, The Hub" | **(a).** The list line already uses "·" between the day, who came and the hours, so (b) blurs the name into them. (c) reads oddly inside "Close out Session 5, The Hub" |
| **GQ76** | **How a page prints.** (a) The page as it reads, its buttons dropped. (b) A paper layout of its own per page, like the character sheet's | **(a).** One mechanism for three pages, and it can't drift from the screen. (b) is three new renderers; a page that prints badly can still get one later |
| **GQ77** | **Which way up.** | **Portrait.** A journal and a cast page read down the page. The character sheet stays landscape |
| **GQ78** | **Copy or save the Markdown.** (a) Copy, saving a `.md` file when the clipboard refuses. (b) Two buttons, Copy and Save. (c) Save only | **(a).** Deighton pastes into Obsidian. One button, and it still works where a browser won't allow the clipboard from a file |
| **GQ79** | **The Markdown's order.** (a) The journal first, then threads, lines, jots and the award log. (b) The page's order (the record, then the Debrief last) | **(a).** The journal is the night's story, which is what goes in a GM's notes. (b) puts it under the bookkeeping |
| **GQ80** | **Which pages print.** (a) W84's three: a session, a cast member, an encounter. (b) Those and a place and a faction | **(a).** Each page that prints needs its own check on paper. A place's or a faction's Print is a button each later (*Revisit if*) |

## 5. The assumption sweep

| What | Today (where) | After |
|---|---|---|
| `_session` (engine ~7090) | no title | `x.title = _str(x.title)` |
| `migrateTable` | 0.21 | a 0.22 step: every session gets `title: ""` |
| `addSession` (~8236) | no title | `title: ""`, or `f.title` trimmed when given |
| `editSession` (~8249) | number, date, present, hours, journal | also `title`, trimmed. Any text is fine; "" clears it |
| `sessionTitle` (~8292) | number or "Session" | §8's four cases |
| `sessionList` (~8284) | by number, day, made | unchanged |
| `_sessionFields` (~8412, Find) | "Session", `sessionTitle` | unchanged code: Find matches the name through `sessionTitle` |
| Activity log labels (~7338, ~3111) | `sessionTitle` at the time | unchanged code: a label keeps the name it had when written |
| Seat history (~8887) | `sessionTitle` | unchanged code |
| `closeOutSectionHtml` (~2939), the close-out's head (~3051) | "this session" when there's no number | "this session" when there's **neither** a number nor a name |
| `sessionFormHtml` | Number, Day, Who, Hours | **Name** after Number (`data-sf="title"`, text) |
| `sessionLine`, `sentTag`, a note's tag and picker, *Closed in*, *Last session set up*, *Session N is open*, Back labels, the delete ask | `sessionTitle` | unchanged code. **Check each at 375px with a long name** (the note's `.tag plain` chip, the list row) |
| `sheet.js` ~2003 | a character's own Session Log entry's `title` | unchanged: the player's log, not the table's |
| `tools/sample-table.mjs` (~441, the session factory) | no title | a `title` on all sessions but one. The character builder (~879, ~880) keeps writing "Session N" into the **player's** log: the player names their own entries |
| `tests/sample-table.test.mjs` | — | every session has a `title` key; one is "" |
| `print.css` | hides `#app`, shows `#printSheet`, `@page` landscape | the same unless `body` has the table-print class; with it, `#app`'s page shows, `#printSheet` and the chrome hide, and a named page is portrait |
| `printSheet` (app.js ~227), `data-roprint` (gm.js ~4688) | the character | unchanged. Test it: §11 |
| `recHeadHtml` (~508) | `<h1>` and Edit | the three pages' heads also carry **Print**; the session's carries **Copy as Markdown**. A planned encounter has no `recHeadHtml` (its name is a field, ~4208): put Print beside its title row |
| `JOURNAL` (~2453) | the form's and the Debrief's labels | also the Markdown's headings |
| `coLogLine`, `coJobsLine`, `sentenceHtml`, `jottedHtml` | HTML for the page | unchanged; the Markdown reads their output (§8) |
| Help (data, `gmGuide`, the Sessions page's entry) | how a session is made and closed | a clause for the name, the Markdown and Print. And the cast's and encounters' entries, for Print |
| `voice.test.mjs` | — | every new string |

## 6. Read first

`CLAUDE.md` (constraints 3, 7 and 10; the change tiers). SCHEMA §3's `sessions` and §4: Decisions 96, 203, 205,
208, 270, 271, 302. `engine.js`: `_session`, `addSession`, `editSession`, `sessionList`, `sessionTitle`,
`_sessionFields`, `migrateTable`'s 0.21 step. `gm.js`: `sessionLine`, `sessionReadHtml`, `sessionFormHtml`,
`sessionBodyHtml`, `debriefReadHtml`, `jottedHtml`, `coLogLine`, `coJobsLine`, `sentenceHtml`, `recHeadHtml`,
`encPageHtml`, the cast member's read view (~1233). `app.js`: `printSheet`, `exportChar`. `shared.js`: `announce`,
`undoToastEl`. `src/styles/print.css` whole. `tools/sample-table.mjs`: the session factory (~441) and the character
builder (~873).

## 7. Out of scope

- **The browser's own Print on a table page** (it still prints `#printSheet`). Add it to the wishlist as a new W.
- **A blank encounter to run on paper** (the worksheet, 252).
- **Print for places, factions, threads or Notes** (GQ80).
- **Markdown for anything but a session**, and a whole table's export.
- **The player's Session Log** taking the GM's name.
- **Scott's paper look** on table pages (Decision 96's is the sheet's).
- **W80's action rail** (S29). Print and Copy sit in the page's head.

## 8. The shapes

- **A session:** `{ id, number, title:"", date, present, hours, journal, close, created, updated }`. SCHEMA §3 gains
  the line `title: "",  // 0.22: the GM's name for it, text, or "" (Decision N)`.
- **`Engine.sessionTitle(s)`:**
  - number and name: `"Session 5: The Hub"`;
  - number only: `"Session 5"`;
  - name only: `"The Hub"`;
  - neither: `"Session"`.

  The name is trimmed when read. A non-object is "Session" (total).
- **The Markdown** (`sessionMarkdown(s)` in `gm.js`, returning a string; the button copies or saves it):
  ```
  # Session 5: The Hub

  14 Nov 2026 · Mara, Dex, Juno · 4 hours

  ## What happened
  - <each non-blank line of the part, one bullet each>
  ## Consequences and fallout
  - …
  (each written part, in JOURNAL's order, under its label; an empty part is left out)

  ## Threads
  - Opened: <title>
  - Resolved: <title>
  - Dropped: <title>

  ## What passed between the crew and the cast
  - <each line's sentence, as the page reads it>

  ## Jotted
  - <text> (<title>)

  ## Close-out
  - <each coLogLine>
  - Jobs: <coJobsLine>
  ```
  - **The day line** is `dayText`, `present` and `hoursText`, joined as `sessionLine` joins them, without the title.
  - **A section with nothing in it is left out**, its heading too.
  - **A part's lines:** a line that already starts with `- `, `* ` or `• ` keeps one bullet (`- `); its leading
    spaces are kept, so an outline stays nested. Other text passes through as typed: Markdown the GM writes stays
    Markdown.
  - **A line that would start a Markdown block** by accident (`#`, `>`, `1.`) is escaped at its start with `\`.
  - **The page's HTML becomes Markdown:** `<strong>` → `**`, `<em>` → `*`, then the text alone. Build it from the same
    functions the page uses, so a line in the file is the line on the page (§10's test 6 holds it to that).
  - **The file's name** when saved: the session's title, with characters a file name can't hold dropped, then `.md`.

## 9. The UI

Copy is drafted for the voice pass.
- **Name** (the session form, after Number): a text field, placeholder "The night in a few words". Saved as the form's
  other fields are.
- **The session's head:** **Edit**, **Copy as Markdown** and **Print**, as `btn sm`, in that order.
- **The cast member's head and the encounter's:** **Print** after Edit (or after Rename on a running encounter, or
  beside the Name field on a planned one).
- **Print:**
  - prints the read view, never a form. If the page is being edited, Print isn't shown;
  - opens every `<details>` on the page for the print and puts each back as it was afterwards (`afterprint`, and after
    `window.print()` returns);
  - focus stays on Print.
- **On paper:**
  - white, the app's fonts, black text, the brand's purple only for headings;
  - no header, tabs, footer, bar, toast or overlay;
  - no button that only acts (Back, Edit, Print, Add…, Open a thread, CRANK job, Make current, Redo). A button that is
    a name or a title (`cast-open`) prints as text;
  - a field prints its value and no box; an empty field doesn't print;
  - the cast page's docked stat block (258) prints in the page's flow, not pinned.
- **Copy as Markdown:** the toast says "Copied as Markdown." or "Saved as Markdown." Focus stays on the button.
- **Phone:** the head's three buttons wrap at 375px, and a long session name in the list, a chip or Back doesn't push
  the page sideways.

**Where things land:**

| Press | Record | Focus |
|---|---|---|
| Name typed, form left | `title` saved; the `<h1>` reads the new title on Done | as other fields |
| Copy as Markdown | nothing written | stays on the button |
| Print | nothing written; `<details>` restored afterwards | stays on Print |

## 10. Worked examples, as named tests

Each fails on `main`, or the builder says why it already passes.
1. `tests/engine.test.mjs`, `"Decision N: a session's name reads after its number"`: the four cases of §8, and a
   name of spaces reads as none.
2. `"Decision N: migrateTable 0.22 gives every session a title"`: a 0.21 table's sessions gain `title: ""`; a hostile
   `title` (a number, an object, markup) comes out a string.
3. `"Decision N: editSession saves a name, trimmed, and the list still sorts by number"`.
4. Smoke (`smoke-table-play`): New session, Edit, type "The Hub" in Name, Done. The `<h1>`, the list row, Back from a
   line's cast member, a note's session tag, *Closed in* and **Close out Session 1: The Hub** all read it.
5. Smoke: a session with a name and no number: **Close out The Hub**, and the close-out's title is "Close out The Hub".
6. Smoke, `"Decision N+2: the Markdown is the page's words"`: on *Dead Air*'s session 5, `sessionMarkdown` has the
   heading, the day line, each written journal part under its label, and **each line of the award log equal to the
   `textContent` of the matching `.co-log` item**, `**`/`*` aside. Its jobs line reads "Jobs: *…*, seen through,
   4,500 Çredits." (check the sample's actual figure).
7. Smoke: **Copy as Markdown** with a stubbed `navigator.clipboard.writeText` copies that string and says "Copied as
   Markdown."; with it refusing, an `<a download>` named `Session 5 The Hub.md` (or the sample's name) is clicked and
   it says "Saved as Markdown."
8. Smoke, `"Decision N+1: Print on a table page prints the page, and the sheet's print is unchanged"`: with
   `window.print` stubbed, Print on a session being played sets the table-print class, the Debrief is open when
   `print` is called, and both are back afterwards. **Print sheet** on a character leaves the class off and fills
   `#printSheet` as before.

## 11. Tests beyond the examples

- **Mutation-test:**
  - `sessionTitle` ignoring the name (tests 1 and 4 fail);
  - the 0.22 step removed (test 2 fails);
  - the Markdown built from its own sentences rather than the page's functions (change one clause in `coLogLine`, and
    test 6 fails);
  - the Debrief left folded for print (test 8 fails).
- **Real print, in Chromium** (a scratch script with `playwright-core`, `emulateMedia({ media: "print" })`): on *Dead
  Air*, a session, a cast member with a docked stat block and a running encounter, plus a character's Print sheet.
  Attach a screenshot or the PDF's first page of each to the PR. The character's must match `main`'s.
- **Hostile files:** a session `title` with markup renders as text on every screen, and the Markdown carries it as
  text, not HTML.
- **The sample:** `sample-table.test` passes, with the names.
- **Phone:** the session page's head and a long name at 375px (`npm run phone-check` if it reaches them, else the
  preview's metrics).
- **Voice:** every new string.

## 12. Steps

1. Baseline: `git submodule update --init private`, then `npm run test:fast`.
2. Write the worked examples, and show them failing.
3. The name: the gate, `migrateTable`, `addSession`, `editSession`, `sessionTitle`, the form, the two checks. Run
   `npm run verify`, then the preview at desktop and 375px.
4. The Markdown: `sessionMarkdown`, the button, copy and save. Run verify.
5. Print: the class, the buttons, `print.css`, `<details>`. Run verify, then the Chromium print script.
6. The sample, Help, docs, close-out. Run the full `npm run verify`.

## 13. Stop and ask

- **Stop** if:
  - the character's print can't stay byte-for-byte the same in Chromium;
  - a page needs a second renderer to print legibly (that's GQ76's (b));
  - a screen names a session without `sessionTitle`, outside the sweep's list;
  - the clipboard works neither from `file://` nor from the dev server in Chromium, so only the save is ever used.
- **Expected, not stops:**
  - tests that assert "Session 1" on an unnamed session: they still pass;
  - the version literals and the sample's restamp to 0.22.

## 14. Close-out

The `close-the-session` skill for *Rule or shape*:
- Decisions N, N+1, N+2, with their INDEX lines and 203's marks.
- Table schema 0.22: SCHEMA §3's line and the `migrateTable` step.
- The app minor.
- STATE rewritten.
- The log, and a `shipped.md` row.
- The plan's S26 row: built. The wishlist: W73, W84 and W86 built, and a new W for the browser's own Print on a table
  page (§7).

**CHANGELOG** (drafted, GM voice, under *GM mode*):
- "Give a session a name. It reads after its number everywhere: Session 5: The Hub."
- "Copy a session as Markdown, its journal first, to paste into your own notes."
- "Print a session, a cast member or an encounter, as the page reads."

**PR title:** `feat(gm): a session's name, its Markdown and Print for table pages (S26, Decisions N–N+2)`.

**PR body:** the template's sections, plus **New strings as rendered**, **The prints** (the four screenshots) and
**Where the order didn't fit**.

**Review checklist:**
- §1's six checks, run in the preview and on paper.
- Every screen in the pre-flight's list, with a long name, at 375px.
- The character's print against `main`'s.
- The Markdown against the page, line by line, on a session with every section.
- Hostile titles.
- The voice of every string.

## 15. Handing it over

The builder and reviewer prompts are in `WORK-ORDERS.md`, with this order's path. Its own traps:
- **One function names a session.** Don't format "Session N" anywhere new; call `sessionTitle`.
- **The number is the order.** A name never sorts.
- **The Markdown is the page's words.** Don't write a second set of sentences for it.
- **The character's print must not move.** Its rules are unchanged when the class is off; prove it in Chromium.
- **Take the numbers at build** (decisions, app, table schema) from `origin/main`, and again after any rebase.
