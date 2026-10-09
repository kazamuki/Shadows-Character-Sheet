# Work order S14 — The secretary: find anything on the table, and jot a line from anywhere

**Plan:** [`../gm-mode.md`](../gm-mode.md) §1a (Deighton's answers, and the
50,000-foot reading of both GMs), **W85** (`WISHLIST.md`); Decisions 164,
170, 171, 187, 203, 204.
**Status:** **drafted 2026-10-09 by Claude (Opus)**, after #144 (S13a)
merged with one fix round (README step 7), and with #145 (Deighton's answers
and W85) open beside it. **Ken chose this session over S6, turns by side and
the Reference's additions (2026-10-09).** SQ1–SQ8 are open; each has a
default.
**Branch:** from `main` with #145 merged, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js` (the Tables section), `gm.js`, the
CSS, the ledger, the table schema and STATE. No data, nothing in `private/`.

**What S14 is.** Deighton's one tool tomorrow is "a secretary, to keep track
of the details". He forgets names first, then, as time passes, the plot and
why anyone was doing anything. He keeps an improvised NPC in his head or
asks a player to write it down, and he'd jot during play "if it's fast and
easy". The table already holds most of what he loses (journals, the cast and
their interactions, threads, notes, encounters), but each tab filters only
its own records. S14 adds two things, both in the header so they work from
any page, a running fight included:

- **Find:** one search over the whole table. Each hit says what it is and
  where the word was, and opens that record.
- **Jot:** one line, saved without leaving the page. It's a **note** that
  remembers the session it was written in (the one session dated today),
  and that session's page lists it.

**It stores almost nothing new.** The search is computed on every keystroke
from what the table holds, never an index in the file (constraint 7). The jot
is a note, so the only new field is a note's `session`: table schema **0.10**.

**Carried over from S13a's review** (#144, one fix round; three of the four
fixes were the order's):

- **A search must read every field a GM would look for**, not only the
  obvious one. S13a's search skipped column headings and footnotes, so
  *cover* missed the Modifiers table. Here §7 lists, per record, every field
  the search reads, and the tests search for a word that lives only in each
  of the less obvious ones.
- **A test that checks presence can pass with the wrong structure.** S13a's
  conformance test found each piece somewhere in the section, not in its
  row. Here: a hit names **the record and the field** it came from, and the
  tests assert both, not just that some hit exists.
- **An empty result is the reader's to decide, not the page's.** S13a's UI
  printed one panel's empty line under any panel that came back empty. Here
  the engine returns nothing for a query under two characters, and the UI's
  one empty line is *Nothing on the table matches.*
- **The field is never redrawn while typing** (S13a, kept): only the results
  below it are.

**Pre-flight** (README, *The pre-flight*), against `main` at `d325685`:

- **Notes** (`engine.js` `addTableNote`, `editTableNote`, `removeTableNote`;
  `gm.js` `noteCardHtml`, `notesTabHtml`, `bindNotes`): a note is
  `{ id, title, text, created, updated }`, newest first (`unshift`). The Notes
  tab draws every note as an editable card, saved on `input` with no redraw.
- **`migrateTable` normalises `notes` before `sessions`.** A note's `session`
  must be checked against the table's session ids, so the notes loop **moves
  below** the sessions loop (`usedSession` is built there). Nothing else in
  the notes loop reads sessions.
- **A session on a day:** `addInteraction` (`engine.js:4220`) gives a new
  line "the one session dated that day" (Decision 203), inline. S14 lifts that
  to one helper, `_sessionOnDay(t, day)`, used by both; the interaction's
  behaviour must not change (its tests stay green untouched).
- **`removeSession`** (`:4332`) nulls the session on interactions and
  threads; it gains notes.
- **Folding:** `_fold` (`:4174`) maps the three typographic apostrophes to
  `'`, trims and lowercases (187). It **trims**, so its indices don't map
  back to the original string; the snippet needs a fold that keeps every
  character's place (§7).
- **The records and their text fields:** `CAST_TEXT` (`:3809`: name, flavor,
  description, origin, enemyRole, motivation, resources, line, ifPushed,
  gmNote) plus `npcRoles`, `affiliations` and a block's `traits`, `armor` and
  `gear`; an interaction's `text`, `crew` and its cast links' names
  (`linkName`); a session's `present`, its six `journal` parts (`JOURNAL`,
  `gm.js:842`) and its close-out lines' `name` and `note`; a thread's `title`
  and `notes`; a note's `title` and `text`; an encounter's `name`, its rows'
  names (a cast row's through its link) and each row condition's `note` and
  `source`.
- **Opening a record:** `S.castOpen` (a member's page), `S.sessOpen` (a
  session's page), `showThread(id)` (`gm.js:967`: the Sessions tab, the
  thread expanded and focused), `S.encOpen` (an encounter), `S.castView =
  "crew"` (Who knows what). An interaction lives on its session's page and
  its members' pages (`[data-int="<id>"]`).
- **The header:** `renderTableChrome` (`gm.js:228`) fills `#hdractions` with
  ⋮ only. Decision 140: "row one is the name, ⋮ and the theme button", two
  thin rows at every width, the name ending in "…"; 171: a table's screen
  has "a menu with Rename, Export, What's new and Home". Two buttons in row
  one touch both (see §3). `npm run phone-check` measures the header.
- **The modal:** `openModal({ title, html, foot, bind, returnTo, onClose })`
  (`shared.js:371`), `closeModal`; Esc closes, focus returns to the opener.
- **The schema stamp** is pinned at `"0.9"` in ten `engine.test.mjs`
  assertions and one test title (`:3079`, `:3147`'s title and `:3154`,
  `:3206`, `:3429`, `:3791`, `:4000`, `:4516`, `:4987`, `:5359`, `:5647`) and
  in STATE (`docs.test.mjs:358`). All move to
  `"0.10"`; `_versionNewer` compares numerically, so 0.10 is newer than 0.9.
- **The ledger,** searched by name: *search*, *find*, *filter*, *notes*,
  *table notes*, *Notes tab*, *header*, *kebab*, *hdractions*, *menu*,
  *modal*, *session on its day*, *fold*, *apostrophe*. Hits:
  - **140** (the header's two rows): **in part.** Row one on a table's
    screen gains Find and Jot; the two-row rule and the phone-check stand.
  - **171** (a table's screen and its menu): **in part.** Its header gains
    Find and Jot beside the menu; the menu is unchanged.
  - **170** (a table is `{ meta, notes }`, every change a schema bump):
    followed.
  - **203** (a new interaction takes the one session on its day): followed,
    and extended to a jot.
  - **187** (apostrophes fold in every name match): followed, in the search.
  - **164** (a press that redraws keeps the keyboard's place): followed.
  - **207** (the Reference's search): cited. Its own search stays; the
    Reference and packs are not in Find (§6).
- **Decision 208, W86**: free on `origin/main` (checked 2026-10-09; #145 adds
  W85 only). Check again before pasting.

---

## 1. Goal

Mid-fight, a player names a fixer from three sessions ago. The GM taps
**Find**, types *dock*, and sees *Marta Voss* (Cast: *flavor*), Session 3
(*What happened*) and a line between the crew and Marta. They tap Marta and
land on her page. Later a player invents a bartender; the GM taps **Jot**,
types *Bartender at the Lantern: Ike, owes Rook*, presses **Save**, and is
back on the encounter, which never moved. That night the line is on Session
6's page under *Jotted*, and on the Notes tab.

**Done when:**

- Switched off: nothing changes anywhere.
- A table's header has **Find** and **Jot** beside ⋮, on every tab and page.
- Find searches every record kind and field in §7; every word must match
  somewhere in a record; each hit names its kind, its record and the field,
  with the words around the match; a hit opens its record.
- The field keeps its value and focus while typing; only the results redraw.
- Jot saves a note with the session dated today (the one, if exactly one),
  without moving the page; an empty jot isn't saved; a draft survives
  closing the jot.
- A session's page lists its jotted notes; a note's card shows and changes
  its session.
- Table schema 0.10, with a `migrateTable()` step; an old table opens with
  every note's `session` null.
- `npm run verify` and `npm run phone-check` pass; checked by hand at 390px,
  768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape: a table-file shape, a header change two decisions
  name, and GM-facing behaviour someone could have chosen otherwise.
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** no bump; no data changes.
- **Table schema:** **0.9 → 0.10**: a note's `session`. A `migrateTable()`
  step in the same commit (170).
- **Character and pack schemas:** unchanged.
- **Reserved:** Decision **208**; **W86** (a session copied out as Markdown,
  for Obsidian: Deighton's notes app, out of scope here).

## 3. The decision, drafted

Paste after 207, under INDEX §3's **GM mode** heading, filling **Built**.
Count it with `wc -w`; the cap is 350.

```
208. **A table's header has Find, one search over every record, and Jot, a line kept as a note with the session it was written in.**
     *2026-10-09 · Ken + Claude · Touches: Find, Jot, tableSearch, table notes, note session, addTableNote, editTableNote, removeSession, _sessionOnDay, header, hdractions, table schema 0.10, Decision 140, Decision 171, Decision 203, Decision 187, W85, W86*
     - **Decided:** On a table's screen, row one of the header gains **Find** and **Jot** beside ⋮, on every tab and page. Find searches the cast, sessions, interactions, threads, notes and encounters; every word must appear somewhere in a record; a hit names its record and field, with the words around the match, and opens it. Jot saves a line as a note with `session`: the one session dated today, else none. A session's page lists its notes. Table schema 0.10.
     - **Why:** Deighton loses details, names first, and asked for a secretary; Scott loses what went to whom (§1a). The table holds both, but only per tab.
     - **Rejected:**
       - A seventh tab: Find and Jot are wanted from the page you're on, mid-fight included.
       - A stored index: constraint 7; the search is computed.
       - A jot as its own record: a note is already a dated text; two lists for one thing.
       - Appending the jot to the journal: it writes into the GM's own outline.
       - A floating Jot button: it covers the encounter's rows on a phone.
       - Packs and the Reference in Find: they have their own searches.
       - The whole phrase as typed: words in any order find more.
     - **Replaces:** Decision 140 in part (row one on a table's screen also holds Find and Jot) and 171 in part (the table's header holds more than its menu). 203's rule now gives a jot its session too.
     - **Revisit if:** the header can't fit them at phone width, a table grows past what a search per keystroke keeps up with, or seats (S3b) let a player jot.
     - **Built:** table schema 0.10, switched off (173); log 2026-10-XX.
```

**Supersession marks:** 140 and 171, each `→ **Superseded in part by
Decision 208**` with its clause (140: *on a table's screen, row one also
holds Find and Jot*; 171: *the header holds Find and Jot beside the menu*),
and each INDEX line `→ **superseded in part by 208**`. If the ledger search
at build time finds another, stop and ask.

## 4. Questions for Ken

| # | Question | Default |
|---|---|---|
| SQ1 | **Where Find and Jot live.** Row one of the header, as words, before ⋮; below 480px the name loses more to "…" | **Header, as words** |
| SQ2 | **How words match.** Every word somewhere in the record, any order (*dock fixer* finds a fixer whose flavor says docks) | **Every word, any order** |
| SQ3 | **The result order.** Cast, sessions, interactions, threads, notes, encounters: names first, since they slip first (Deighton) | **As listed** |
| SQ4 | **A jot's session.** The one session dated today; none when there's no session today or more than one. The GM can change it on the note's card | **Today's one session** |
| SQ5 | **A jot's title.** Empty: it reads *Untitled note* on the Notes tab, as an untitled note does now; the session page shows the text | **Empty** |
| SQ6 | **Where an interaction opens.** Its session's page if it has one; else its first member's page; else Who knows what. Focus on the line | **As listed** |
| SQ7 | **The shortest search.** Two characters; one returns nothing | **Two** |
| SQ8 | **A keyboard shortcut.** None now; `/` for Find is a later Fix if a GM at a laptop asks | **None** |

## 5. Read first

- `CLAUDE.md` whole: constraints 7, 8 and 10; *Decisions*; *Change tiers*.
- `docs/STATE.md` whole.
- The plan: §1a (both GMs), §4c (the table file); `WISHLIST.md` W85.
- `docs/SCHEMA.md` §3's table block and its step history; §4: Decisions
  **140**, **164**, **170**, **171**, **187**, **203**, **207**.
- **The code:** `engine.js`'s `migrateTable`, `addTableNote`,
  `editTableNote`, `removeTableNote`, `addInteraction`, `removeSession`,
  `sessionInteractions`, `_fold`, `_str`, `CAST_TEXT`, `linkName`,
  `sessionTitle`, `encounterTitle`, `_sessions`, `_interactions`, `_threads`;
  `gm.js`'s `renderTableChrome`, `noteCardHtml`, `notesTabHtml`, `bindNotes`,
  `sessionPageHtml`, `showThread`, `JOURNAL`, `castPageHtml`'s Back,
  `encOpenNow`; `shared.js`'s `openModal`, `closeModal`, `keepPlace`;
  `tools/phone-check.mjs`.

## 6. Out of scope

- **Packs and the Reference** in Find (their own searches, 182 and 207).
- **A session copied out as Markdown** for Obsidian: **W86**.
- **A player jotting** (needs seats, S3b, and a dispatch, S2).
- **Turns by side** in an encounter (the plan's §6 S10 note).
- **Any change to the Cast, Threats or Reference searches**, or to how an
  interaction is dated (203 stays as built; S14 only lifts its rule into a
  helper).
- **Remembering the search across a reload.** `S.findQ` goes when the table
  closes.
- **Undo** for a jot (W83 covers the whole table).

## 7. The shapes

**The note** (table schema 0.10):

```js
notes: [ { id: "N-XXXXXXXX", title: "", text: "",
           session: null,        // 0.10: a session's id in this table, or null (Decision 208)
           created: "<ISO>", updated: "<ISO>" } ]
```

**`migrateTable()`:** step 0.10, for a table that arrived before it: every
note's `session` is `null` (nothing is guessed from dates, as 0.8 did for
interactions). Then, always: the notes loop runs **after** the sessions loop,
and a note's `session` is kept only when it's a string naming a session in
this table, else `null`. SCHEMA §3's step history gains: *0.10 adds each
note's `session`, null for everyone already there (nothing is converted).*

**Engine** (the Tables section):

| Function | Does | On bad input |
|---|---|---|
| `_sessionOnDay(t, day)` | the id of the one session dated `day`, else `null` (none, or more than one). `addInteraction` uses it, unchanged in behaviour | `null` |
| `addTableNote(t, f)` | as now, plus `session`: `f.session` when it names a session in `t`; else `_sessionOnDay(t, f.date)` when `f.date` is a day; else `null`. **Refuses an empty jot:** with `f.jot === true` and `text` blank after trimming, `{ ok:false, why:"Write something first." }` (the Notes tab's **New note** still makes an empty note) | as now |
| `editTableNote(t, id, f)` | as now, plus `f.session`: an id in `t` or `null`; anything else leaves it | as now |
| `removeSession(t, id)` | as now, plus every note with that `session` gets `null` | as now |
| `sessionNotes(t, id)` | **reader.** The notes whose `session` is `id`, newest first (by `created`, then as stored) | `[]` |
| `tableSearch(t, q)` | **reader.** The hits, below | `[]` |

**`tableSearch(t, q)`**, exactly:

- **The words:** `q` folded with `_fold`, split on whitespace, empties
  dropped. Under two characters in total (after folding): `[]` (SQ7).
- **A record matches** when every word is a substring of at least one of its
  fields (any field per word, SQ2).
- **The fields**, per kind, in this order (the first field holding the first
  word is the hit's `field`):
  - **cast** (`kind:"cast"`): `name`, `flavor`, `description`, `origin`,
    `npcRoles` (each), `enemyRole`, `affiliations` (each), `motivation`,
    `resources`, `line`, `ifPushed`, `gmNote`, and a block's `traits` (each
    `name`, `text`), `armor` and `gear` (each line).
  - **session** (`"session"`): `sessionTitle` (*Session 3*), `present`
    (each), the six `journal` parts, the close-out's lines (each `name`,
    `note`).
  - **interaction** (`"interaction"`): `text`, `crew` (each), its cast links'
    names (`linkName`, so a deleted member's kept name counts).
  - **thread** (`"thread"`): `title`, `notes`.
  - **note** (`"note"`): `title`, `text`.
  - **encounter** (`"encounter"`): `encounterTitle`, each row's name (a cast
    row's from its link), each row condition's `note` and `source`.
- **A hit:** `{ kind, id, title, field, snip:{ before, hit, after } }`.
  `title`: the member's name (*Unnamed* if blank), `sessionTitle`, the
  interaction's first member's name or first crew name or *A line*, the
  thread's title (*Untitled*), the note's title (*Untitled note*), the
  encounter's title. `field`: the GM's word for it, from the table below.
  `snip`: the field's text cut around the first word's first match, up to
  60 characters before and after, cut at a space where there is one, `…`
  where it was cut; `hit` is the matched text **as written**, not folded.
- **Folding for the snippet** keeps every character's place: each character
  is lowercased only when its lowercase is one character, and `‘ ’ ʼ` read
  `'`. No trim. So `hit` is always the original characters at the match.
- **Order** (SQ3): cast, sessions, interactions, threads, notes,
  encounters. Within a kind: cast by name (folded), sessions as
  `sessionList`, interactions and notes newest first, threads as
  `threadList`, encounters newest first.
- Total and read only: it never writes the table.

The `field` labels (✎, tool voice):

| Kind | Field → label |
|---|---|
| cast | name *Name* · flavor *Flavor* · description *Description* · origin *Origin* · npcRoles *Role* · enemyRole *Enemy role* · affiliations *Affiliation* · motivation *Motivation* · resources *Resources* · line *Line* · ifPushed *If pushed* · gmNote *GM note* · traits *Trait* · armor *Armor* · gear *Gear* |
| session | title *Session* · present *Who was there* · journal parts their `JOURNAL` labels · close lines *Close-out* |
| interaction | text *What happened* · crew *Crew* · cast names *With* |
| thread | title *Thread* · notes *Notes* |
| note | title *Title* · text *Note* |
| encounter | title *Encounter* · rows *In it* · conditions *Condition* |

`JOURNAL`'s labels live in `gm.js`; the engine can't read the UI (constraint
5). The engine returns the part's key as `field` (`"journal.happened"`), and
the UI labels it from `JOURNAL`. Every other label is the engine's.

**Where the state lives:** `S.findQ` (the search as typed) and `S.jotDraft`
(an unsaved jot), on `S`; `openTable` resets `S`.

## 8. The UI

All in `gm.js` and the CSS; tool voice; ✎ for a voice pass. **Built for a
tablet** (§1a).

**The header** (`renderTableChrome`): `#hdractions` gains two buttons before
⋮: **Find** and **Jot** (`data-tfind`, `data-tjot`), text, each at least
44px to tap. Every tab and page of a table has them.

**Find** opens a modal (`openModal`, title ✎ *Find on this table*):

1. A search field (`data-findq`, `type=search`, placeholder ✎ *Names,
   places, anything you wrote*), focused, holding `S.findQ`.
2. The results (`data-findres`), redrawn on every `input`; **the field is
   never redrawn**. Under two characters: nothing. With hits: a heading per
   kind (✎ *Cast*, *Sessions*, *Lines*, *Threads*, *Notes*, *Encounters*)
   with its count, then a button per hit: its `title`, then the field's
   label and the snippet with `hit` in `<mark>`. Everything is escaped
   (`esc`) piece by piece; `<mark>` is the only markup.
3. No hits: ✎ *Nothing on the table matches.*

A hit closes the modal and opens its record (focus as below). The query
stays in `S.findQ`, so **Find** again shows the same results.

**Jot** opens a modal (title ✎ *Jot it down*):

1. A textarea (`data-jottext`), focused, holding `S.jotDraft`.
2. One line saying where it goes ✎: *Goes with Session 6.* (today's one
   session) or *Goes on the table's notes. No session is dated today.* (or
   ✎ *…More than one session is dated today.*).
3. **Save** (`data-jotsave`) and **Cancel**. Ctrl+Enter or ⌘+Enter saves.
   Save with nothing written: ✎ *Write something first.* under the field,
   focus stays. Save: the note is added (`addTableNote(t, { text, date:
   <today, local>, jot:true })`), `S.jotDraft` cleared, the modal closes, a
   toast ✎ *Jotted.*; the page under it is **not redrawn** unless it's the
   Notes tab or that session's page, which redraw in place (164).
4. Cancel, ×, Esc or a tap outside: the modal closes and `S.jotDraft` keeps
   what was typed.

**A note's card** (`noteCardHtml`) gains a **Session** select (`data-nsess`):
✎ *None*, then `sessionList`'s sessions by `sessionTitle` and day. A change
saves at once (`editTableNote`), no redraw.

**A session's page** (`sessionPageHtml`) gains, after the interactions and
before the close-out: `h2` ✎ *Jotted* and the session's notes (text, then
title when it has one), each a button that opens the Notes tab on that note.
With none, the section isn't drawn.

| Press | The record | The view | Focus |
|---|---|---|---|
| **Find** | — | the modal, with `S.findQ`'s results | the search field |
| A letter in Find | — (`S.findQ`) | the results redraw; the field doesn't | the field, caret where it was |
| A cast hit | — | the member's page (`S.castOpen`, Cast tab) | the page's title |
| A session hit | — | the session's page (`S.sessOpen`) | the page's title |
| An interaction hit | — | its session's page; else its first live member's page; else Who knows what (SQ6) | the line (`[data-int]`), else the page's title |
| A thread hit | — | `showThread(id)` | the thread's title (as now) |
| A note hit, or a *Jotted* line | — | the Notes tab, that note's card in view | its **Note** field |
| An encounter hit | — | the encounter (`S.encOpen`, Encounters tab) | the page's title |
| **Jot** | — | the modal, with `S.jotDraft` | the textarea |
| **Save** | a note, `session` today's one | the page as it was (the Notes tab or that session's page redraw) | **Jot** in the header |
| Cancel / Esc | — (`S.jotDraft` kept) | the page as it was | **Jot** in the header |
| A note's **Session** | `session` | — | the select |

**At width:** the header stays two rows at 390px (the name takes the "…");
the modal's results wrap, never scroll sideways. `npm run phone-check` passes.

## 9. Tests

**`tests/engine.test.mjs`**, *The secretary (208)*:

- **0.10:** `newTable().meta.tableSchemaVersion` is `"0.10"`; the ten
  `"0.9"` pins and the title move. A 0.9 table with notes carrying `session` (a real id, a
  wrong one) opens with every note `session: null`. A 0.10 table keeps a real
  id and nulls a wrong one, a number and an object. A note naming a session
  the same file defines **later in its array** keeps it (the loop order).
- **`_sessionOnDay` through `addInteraction`:** the existing 203 tests stay
  green untouched (that's the refactor's test).
- **A jot:** `addTableNote(t, { text:"Ike", date:<day>, jot:true })` takes
  the one session on that day; two sessions that day, or none, `null`; an
  explicit `session` wins; blank text with `jot:true` is refused with its
  `why` and adds nothing; without `jot`, an empty note is still made.
- `editTableNote` sets and clears `session`, ignores a stranger id;
  `removeSession` nulls its notes; `sessionNotes` newest first.
- **`tableSearch`, one record per kind**, each found by a word that lives
  **only in its least obvious field**, asserting `kind`, `id` **and**
  `field`: a cast member by a trait's text, by a gear line and by an
  affiliation; a session by a close-out line's note and by `journal.seed`; an
  interaction by a deleted member's kept name; a thread by its notes; a note
  by its title; an encounter by a condition's source.
- **Every word, any order:** *fixer dock* finds the member whose `flavor`
  says *fixer* and whose `line` says *docks*; *fixer zzzz* finds nothing.
- **Folding:** *ROOK*, *  rook  * and *rook's* against *Rook’s*; `hit` is
  *Rook’s* as written. A field with `İ` before the match still puts `hit` on
  the matched characters.
- **The snippet:** a match 200 characters into a journal part gives `before`
  starting with `…`, at most 61 characters, cut at a space; a match at the
  start has no `…` before.
- **Order:** one hit of each kind comes back in SQ3's order.
- Under two characters: `[]`. Totality: `tableSearch` of `undefined`, `null`,
  `{}`, a migrated hostile table, with `q` as `undefined`, `5`, `{}`;
  returns an array, throws nothing, and leaves the table byte-for-byte equal
  (`JSON.stringify` before and after).

**`tests/smoke.test.mjs`**, switched on:

- The header has **Find** and **Jot** on every tab, on a member's page and on
  a running encounter; switched off, Home is as it was.
- **Find:** type *dock* a letter at a time: focus stays in the field, its
  value is *dock*, the results show Cast and Sessions headings with their
  counts; the snippet's `<mark>` holds the match. Tap the cast hit: the
  member's page, focus on its title, modal closed. **Find** again: *dock*
  and the same results. *zzzz*: *Nothing on the table matches.*
- An interaction hit with a session opens that session's page with focus on
  the line; one with no session opens its member's page.
- **Jot** on a running encounter: type, **Save**: the encounter's page is
  the same nodes as before (no redraw), focus on **Jot**, the toast shows;
  the note is on the Notes tab with its session selected and under the
  session's *Jotted*. **Save** empty: *Write something first.*, nothing
  added. Type, Esc, **Jot**: the draft is back.
- A note's **Session** select changes and clears its session.
- `app.errors` empty throughout.

**`tests/hostile.test.mjs`:** a hostile table (names, journal, notes and a
condition's source as `<img onerror>`): Find on a word inside each, the
results show the text as text, no `img` in the modal or `#main`,
`app.errors` empty. A hostile note's `session` (`"__proto__"`, an object)
reads `null`.

**Mutation-test** (record each in the PR with the test that actually caught
it). Check each for a second path first:

1. **The notes loop stays above the sessions loop** → the *defined later in
   its array* case.
2. **The search reads only the first field of each record** → the
   least-obvious-field tests.
3. **Any word, not every word** → *fixer zzzz*.
4. **`hit` taken from the folded string** → the `Rook’s` case.
5. **Find redraws its field** (the whole modal on `input`) → the smoke focus
   test.
6. **Jot redraws the page under it** → the *same nodes* smoke test.
7. **`removeSession` leaves a note's session** → its engine test.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and
at the end; the targeted test files after each step.

1. Confirm 208 and W86 are free on `origin/main`. Search the ledger again
   for the pre-flight's names.
2. **The shape:** schema 0.10, the `migrateTable` step and the loop move,
   `_sessionOnDay`, the notes functions, `removeSession`, `sessionNotes`;
   their tests, the `"0.9"` pins.
3. **The search:** `tableSearch`, its fold and snippet; its tests.
4. **The UI:** the header buttons, Find, Jot, the note's select, the
   session's *Jotted*; the smoke and hostile tests.
5. **In the browser** (`shadows-dev-preview`, `?gm=on`): a table with two
   sessions (one dated today), a cast of three with a trait and an
   affiliation, an interaction, a thread, a note and a running encounter.
   Find *dock*, a trait word, a journal word, a word in two kinds; open one
   hit of each kind. Jot from the running encounter, the Cast tab and a
   member's page. Then **390px** (header two rows; `scrollWidth` equals
   `clientWidth`; the modal's results don't scroll sideways), **768 ×
   1024**, **1300px**. `npm run phone-check`.
6. The mutations (§9).
7. Ledger (208, 140 and 171 marked), INDEX, SCHEMA §3's note and step
   history, the plan, STATE, docs, close-out (§12).

## 11. Stop and ask

- 208 or W86 is taken.
- The ledger search finds a decision 208 overrides that the pre-flight
  doesn't name.
- The header doesn't fit Find and Jot in two rows at 390px, or the
  phone-check fails, and the fix is more than the buttons' own CSS.
- Moving the notes loop changes any existing `migrateTable` test.
- `_sessionOnDay` changes any existing interaction test.
- A search over a 200-member, 100-session table takes over 50 ms a keystroke
  in jsdom (measure once; say what it was).
- The voice test flags any of the new copy.
- The decision goes over 350 words.

## 12. Close-out

*Rule or shape* tier, switched off:

- **SCHEMA:** 208; 140 and 171 marked in part; §3's note gains `session`,
  the step history gains 0.10.
- **INDEX:** 208's line under **GM mode**; 140's and 171's lines marked.
- **STATE:** the table schema to 0.10; §1's GM clause gains Find and Jot
  (208); what's next.
- **The plan:** §6 gains **S14** (the secretary, W85) in the build-order
  table and a section; W85 moves to `log/wishes-granted.md` with a pointer.
- **WISHLIST:** **W86**, *A session copied out as Markdown* (Deighton keeps
  his notes in Obsidian, as an outline of bulleted lists; a session's
  journal, its lines and its jots as one Markdown file to paste or save).
- **`changelog-pending.md`:** ✎ *Find and Jot, on every page of a table:
  search everything you've written, and jot a line down mid-fight without
  leaving it.*
- **Log** entry (table schema 0.10, and why a jot is a note); **shipped**
  row *(switched off)*; README's table: S14's row.
- **PR** titled `feat(gm): the secretary, Find and Jot, switched off (W85
  S14, Decision 208)`. Body: what changed; the mutations; the browser check;
  **Where the order didn't fit**.

## 13. Review checklist

- [ ] **In the browser, by the orchestrator:** step 5's searches and jots,
      one hit of each kind opened, a jot from a running encounter.
- [ ] Each kind found by a word only in its least obvious field, `field`
      asserted.
- [ ] `hit` is the original characters (typographic apostrophe, `İ`).
- [ ] The search field and the page under Jot never redraw.
- [ ] An old table opens with every note's `session` null; a wrong id nulls.
- [ ] 390px: the header is two rows; nothing scrolls sideways.
- [ ] A hostile table's text renders as text in the results.
- [ ] 140 and 171 marked; table schema 0.10 everywhere it's written.
- [ ] Two mutations re-run locally.
