# Work order S5a — Sessions and threads: what happened, and what's still open

**Plan:** [`../gm-mode.md`](../gm-mode.md) §1a (Scott's prep, the current
quest), §4g (*Sessions*) and §6 *S5*; Decisions 171, 176, 177, 178, 179, 193.
**Status:** **drafted 2026-10-08 by Claude (Opus)**, after #130 (S10c) merged
with its one fix round (README step 7). **§4 answered by Ken, 2026-10-08.**
**Branch:** from `main` at or after `0c36eaf`, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js` (the Tables section only), `gm.js`,
the CSS, the ledger, the table schema and STATE. Nothing in `private/`.

**What S5a is.** The cast, the Codex and the fight are built (S8–S10). What a
table still can't hold is the campaign between fights: which session this
was, who came, what happened, and what's left open. Scott preps by rereading
last session for open threads, wants "a to-do list from last session", and
forgets "what the current quest is" (§1a). S5a gives a table its
**sessions**, each with the book's **Campaign Journal** (227), and
**threads** as records, one of them current. A new **Sessions** tab leads
with **Next session**, computed: the current thread, the other open threads,
last session's seed, and anyone met last session who still has no stat
block.

**The plan's S5 is split here** (SQ1). S5a is the record: sessions, the
journal, threads, Next session. **S5b** is the close-out (§4g's seven
steps): IP at 5 an hour to those present, the Milestone Point, the absent's
off-screen CRANK job, the arc counter, *anyone new?*, and the award log. The
**Session 0 worksheet** goes with S5b or later. S5a stores `hours` and
`present` so S5b has them; it computes nothing from them.

**Two things the plan leaves open are settled here** (Ken confirmed
both, §4):

- **An interaction gets its session when it's made, not on load.** 177
  promised that "S5 offers each interaction a session by its date; it never
  converts on load". So a new interaction (written by hand or by an
  encounter's end) takes the one session dated that day, if there is
  exactly one. A session's page offers the lines from its day that have
  none yet, one tap each. Nothing already in a file is converted. SQ4.
- **A session's number is the GM's, stored**, defaulting to the next one.
  A campaign moved in from paper starts at 21, and the book has a Session
  0. Ordering by date alone would renumber a campaign whenever a date was
  corrected. SQ2.

**Carried over from S10c's review** (#130, one fix round; the first two
were the order's):

- **Store that something happened; don't infer it from what it left
  behind.** S10c's order listed a PC for wear only when their damage was
  above 0, and missed a hit the armor stopped (`struck` fixed it). Here, a
  thread stores the session that **closed** it when it closes, and an
  interaction stores its **session** when it's made. Neither is inferred
  from dates later.
- **A label read from the state after an act credits acts that didn't
  happen in it.** S10c wrote *Killed them* for a member who was already
  dead. Here, *Met last session* reads the interactions **linked to** last
  session, never the cast's `created` stamps or the member's status.
- **A record whose link the gate can drop must still render.** A hostile
  cast row with no link crashed `encRowHtml`. Here, a thread whose `opened`
  or `closed` session is gone, and an interaction whose session is gone,
  render as if it were null, and the hostile tests prove it.
- **The orchestrator's review of #130 didn't run the browser itself** (the
  README's step 5); the building session's check was the only one. This
  order's review runs it (§13).
- **A PR body goes stale between rounds** (#130's said the private commit
  needed merging after it had been). Re-read the body before each push.

**Pre-flight** (README, *The pre-flight*), against `main` at `0c36eaf`:

- **`TABLE_SECTIONS`** (`gm.js:218`) is Cast, Threats, Encounters, Notes.
  `openTable(t, section)` opens the stored section when it's a known one,
  else the first (`gm.js:87`), and `writeTableEntry` stores `S.tsection`, so
  a table reopens where it was left (171). **Putting Sessions first changes
  which tab a new table opens on.** Tests that assert a new table opens on
  Cast: `smoke.test.mjs:3444` (*Decision 176: a table opens on Cast, with
  Notes beside it*), `hostile.test.mjs:323` and `:362`, and the
  `S.tsection` asserts near `smoke.test.mjs:4413` and `:4447`. Grep
  `S.tsection"), "cast"` and `data-tsec` for the rest before changing them.
- **Interactions:** `addInteraction(t, f)` takes `{ kind, cast: [ids],
  crew: [names], text, date }`, refuses with no kind and no text (*"Say what
  happened."*), unshifts, calls `_killLinked`, and stamps. `editInteraction`
  reads `kind`, `crew`, `text` and `date`. `_interaction(x, used)` is the
  gate. `interactionsFor(t, castId)` and `crewView(t, f)` read them; the
  member page's crew field suggests names from `crewView`
  (`castInteractionsHtml`, the `crew-names` datalist).
- **`endEncounter`** (193) writes its lines through `addInteraction` with
  `date: _today()`, so the session rule in `addInteraction` covers a
  fight's lines with no change to `endEncounter`.
- **Days:** the engine's `_day(v)` (a real `YYYY-MM-DD` or null) and
  `_today()`; `gm.js`'s `localDay()` and `dayText(day)`.
- **Ids:** `NOTE_ID_RE`, `CAST_ID_RE`, `INTERACTION_ID_RE`, `ENCOUNTER_ID_RE`
  and `ROW_ID_RE` (`engine.js:3203`) share the TAG alphabet after a prefix;
  `newInteractionId(used)` is the pattern. `SE-` and `TH-` are free.
- **"No stat block yet"** is `gm.js`'s `hasNumber(b)` (`gm.js:341`), UI
  only. The engine needs its own (§7); the UI then reads the engine's.
- **Names:** the **character** file has a `sessions` list (its session
  log). The table's `sessions` is a different file's key; nothing shares a
  reader. Don't reuse a character helper for it.
- **No undo on a table** (171, 176): Delete asks.
- **The ledger**, searched by name: *session*, *sessions*, *journal*,
  *Campaign Journal*, *thread*, *current*, *attendance*, *present*,
  *hours*, *Next session*, *landing*, *TABLE_SECTIONS*, *opens on*, *date*,
  *interaction*. Hits:
  - **171** (a table reopens on its stored section; already superseded in
    part);
  - **176** (*a table opens on Cast*; **Revisit if** GQ1's tab order says
    otherwise). **Superseded in part by 195**;
  - **177** (*S5 offers each interaction a session by its date; it never
    converts on load*). Cited and built as promised, **not superseded**:
    the gate converts nothing. The one step past "offers", a **new** line
    taking its day's session, is SQ4. If Ken reads that as a reversal, 194
    marks 177 *in part*;
  - **178** (links as `{ kind, id }`; a deleted target's name is kept). Not
    followed for `session`, on purpose: see 194's *Rejected*;
  - **179** (the crew's names; *Who knows what*);
  - **193** (fought lines dated today).
- **Decisions 194 and 195 and GQ27** are free on `origin/main` and every
  open branch (checked 2026-10-08). Check again before pasting.

---

## 1. Goal

A GM opens a table and sees what's next: the current thread, everything
still open, what last session set up, and who the crew met without a stat
block. After a session, they open it, note who came and for how long, and
fill in the journal. A thread is opened from the session it started in and
closed from the one that ended it. The interactions the crew had that day,
by hand or in a fight, are on that session's page.

**Done when:**

- Switched off: nothing changes anywhere.
- A table's tabs are **Sessions**, Cast, Threats, Encounters, Notes. A new
  table opens on Sessions. A table reopens on the tab it was left on (171).
- **Sessions** shows, in order: **Next session**; **Threads** (add one;
  open first, then the closed); **Sessions**, newest first, with **New
  session**.
- **Next session** reads: the current thread; the other open threads,
  oldest first; last session's seed; *Met last session* (cast members
  linked by last session's interactions whose block has no number). With
  no sessions and no threads it says so in one line.
- A **session's page** edits its number, day, who was there, hours and the
  journal's six parts, saving as typed. It lists the threads opened and
  closed in it, with a field to open one. It lists its interactions, and
  offers the lines from its day that have no session, each with **Add to
  this session**. Delete asks.
- A **thread** has a title, a status (Open, Resolved, Dropped), **Current**
  (one at a time, open only) and notes. Resolving or dropping it records
  the session it closed in, the newest by default, changeable.
- A new interaction, by hand or from an encounter's end, takes the one
  session dated that day. With none, or two, it takes none.
- Export, import, reload and a 0.7 table keep every field. A 0.7 table
  opens as 0.8 with no sessions, no threads, and every interaction's
  `session` null.
- A hostile table opens: bad ids replaced, bad links null, at most one
  current thread, and nothing renders as markup.
- `npm run verify` and `npm run phone-check` pass. The Sessions tab and a
  session's page are checked by hand at 390px, 768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (two records, a field on interactions, the tab
  order).
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** **no bump**, no data change.
- **Character schema, pack schema:** unchanged.
- **Table schema:** **0.7 → 0.8**, with `migrateTable()`'s step: a table
  gains `sessions: []` and `threads: []`, and each interaction gains
  `session: null`.
- **Reserved:** Decisions **194** and **195**; **GQ27** (the journal's
  prompts as fields?) in the plan's §9, for Scott. No F-flag: no player
  rule changes.

## 3. The decisions, drafted

Paste after 193, under INDEX §3's **GM mode** heading, filling **Built**.
Count each with `wc -w`; the cap is 350 (a supersession mark doesn't
count).

```
194. **A table keeps its sessions: a number, a day, who was there, hours, and the Campaign Journal's six parts; an interaction takes its session when it's made.**
     *2026-10-0X · Ken + Claude · Touches: sessions, table.sessions, SE- id, session number, session date, present, attendance, hours, Campaign Journal, journal, interaction session, addInteraction, editInteraction, removeSession, table schema 0.8, migrateTable, Decision 177, Decision 193, W29, GQ27*
     - **Decided:** Table schema 0.8 adds `sessions` (shape in §3): an id (`SE-`), a `number` the GM sets (the next one by default), a local `date`, `present` (names, as an interaction's crew), `hours` (half hours from 0 to 24, or null) and `journal`, the worksheet's six parts as text. An interaction gains `session`, a session's id or null. A new interaction takes the one session on its day; a session's page offers its day's lines that have none. The gate converts nothing. Deleting a session clears every `session`, `opened` and `closed` that named it.
     - **Why:** Scott's prep starts from last session (§1a), and the journal is the record the book already asks a GM to keep (227). 177 promised a session by date, never converted on load.
     - **Rejected:**
       - A number derived from the order: a campaign moved from paper starts at 21, and a corrected date would renumber it.
       - A field per prompt (sixteen): a tablet page of boxes; the prompts are hints (GQ27).
       - Matching every interaction by date on load: two sessions in a day, or none, and the gate would guess (177).
       - `session` as 178's link with a kept name: a line keeps its own date, so a deleted session leaves nothing to name.
       - Attendance by seat: seats are S3b.
       - IP from hours now: the close-out is S5b's.
     - **Replaces:** nothing. It builds what 177 promised.
     - **Revisit if:** GQ27 asks for the prompts as fields, S3b's seats claim attendance, or a GM often runs two sessions in a day.
     - **Built:** table schema 0.8, switched off (173); PR #__; log 2026-10-0X.

195. **Threads are records, one of them current; a table opens on Sessions, which leads with Next session, computed from the threads, last session's seed and who was met without a stat block.**
     *2026-10-0X · Ken + Claude · Touches: threads, table.threads, TH- id, thread status, open, resolved, dropped, current, opened, closed, Next session, Met last session, Sessions tab, TABLE_SECTIONS, landing page, Decision 171, Decision 176, W29, GQ1*
     - **Decided:** Table schema 0.8 adds `threads`: an id (`TH-`), a title, a status (open, resolved or dropped), `current` (one open thread at most), `opened` and `closed` (session ids or null) and notes. `TABLE_SECTIONS` gains **Sessions**, first: a new table opens on it, and a table reopens where it was left (171). The tab leads with **Next session**, read every time and never stored: the current thread, the other open threads oldest first, last session's seed, and the cast members last session's interactions name whose block has no number. Then the threads, then the sessions, newest first.
     - **Why:** Scott wants "a to-do list from last session" and forgets "what the current quest is" (§1a). A thread as a record makes *still open* computed, not copied forward by hand.
     - **Rejected:**
       - Threads as journal text: *still open* would be copied forward by hand.
       - Next session as its own tab: one more on a tablet, for what is the top of Sessions.
       - Always opening on Sessions: a reload mid-fight would leave the GM's tab.
       - Threads linked to the cast now: the text names them; links wait for a GM who asks.
     - **Replaces:** Decision 176 in part: a new table opens on Sessions, not Cast.
     - **Revisit if:** GQ1's tab order says otherwise, S7's clocks join Next session, or a GM wants a thread linked to the cast.
     - **Built:** as 194.
```

**Supersession marks:** 176 *in part* → **superseded in part by 195**, in
the ledger (`→ **Superseded in part by Decision 195** — a new table opens on
Sessions`) and its INDEX line. If Ken reads SQ4 as reversing 177, 177 gets
the same mark from 194 (*a new line takes its day's session*). If the
ledger search at build time finds anything else either overrides, stop and
ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **Split S5.** S5a: sessions, the journal, threads, Next session. S5b: the close-out (IP at 5 an hour, the Milestone Point, the off-screen CRANK job, the arc counter, *anyone new?*, the award log). The Session 0 worksheet with S5b or later | **Yes** | **Yes** (Ken) |
| SQ2 | **A session's number is stored and the GM's**, defaulting to one past the highest (1 for the first). Sessions list by number, newest first | **Yes**: a moved campaign starts at 21; Session 0 exists | **Yes** (Ken) |
| SQ3 | **The journal is six text boxes**, the worksheet's six parts, each with its prompts shown as a hint under the label (*Major events · Key decisions made by the PCs*). Not sixteen boxes | **Yes**, and ask Scott (GQ27) whether he'd rather have the prompts as their own boxes | **Yes** (Ken); GQ27 goes to Scott for later |
| SQ4 | **A new interaction takes its day's session**: a line added by hand, or written by an encounter's end, gets the one session dated that day, if there's exactly one. Older lines are offered on the session's page, never converted. *Is that "offering" (177), or a step past it that needs a mark on 177?* | **Offering**: nothing already stored changes | **Default** (Ken): offering; 177 is cited, not superseded |
| SQ5 | **Sessions is the first tab**, so a new table opens there; a table you reopen goes back to the tab you left (171) | **Yes**: Next session is the landing page for prep, and mid-session the GM is on Cast or Encounters, where a reload should leave them | **Yes** (Ken) |
| SQ6 | **A thread is a title, a status, Current and notes.** No links to the cast or a faction yet; the text names them | **Yes** | **Yes** (Ken) |
| SQ7 | **Closing a thread records a session**: resolving or dropping one sets `closed` to the newest session, changeable on the thread. Reopening clears it | **Yes** | **Yes** (Ken) |
| SQ8 | **Who was there** is typed names, suggested from every crew name the table knows (interactions, past sessions, PC rows). **Hours** is optional, in half hours. S5a computes nothing from either | **Yes** | **Yes, for now** (Ken): typed until S3b's seats claim the names, as they claim an interaction's crew and a PC row (plan §6 *S3b*) |
| SQ9 | ***Met last session*** lists the cast members that last session's interactions name and whose block has no number: the GM's "finish their stat block" list. A Kept Codex copy has a block, so it isn't listed | **Yes** | **Yes** (Ken) |

## 5. Read first

- `CLAUDE.md` whole: constraints 7, 8, 9 and 10; *Decisions*.
- `docs/STATE.md` whole.
- The plan: §1a (Scott's prep row and the current quest), §4g
  (*Sessions*), §6 *S5*.
- `docs/SCHEMA.md` §3's table shape; §4: Decisions **171**, **176**,
  **177**, **178**, **179**, **193**.
- `private/crb/227_Campaign_Journal_Tracker.md`: the six parts and their
  prompts, word for word (§8 uses them).
- **The code:** `engine.js`'s Tables section: the id regexes and
  `newInteractionId`, `_day`, `_today`, `_roleList`, `_interaction`,
  `addInteraction`, `editInteraction`, `removeInteraction`,
  `interactionsFor`, `crewView`, `linkName`, `_tableStamp`, `newTable`,
  `migrateTable` and its 0.7 step, `endEncounter`. `gm.js`'s
  `TABLE_SECTIONS`, `openTable`, `renderTable`, `bindTable`, the Notes tab
  (`notesTabHtml`, `bindNotes`: the save-as-typed pattern), the cast page's
  interactions (`castInteractionsHtml`, `interactionRowHtml`, the
  `crew-names` datalist), `hasNumber`, `localDay`, `dayText`, `askFirst`,
  `keepPlace`.

## 6. Out of scope

- **The close-out** (SQ1): IP, the Milestone Point, the off-screen job, the
  arc counter, *anyone new?*, the award log. Hours and attendance are
  stored and nothing reads them.
- **The Session 0 worksheet**, notes linked to anything.
- **Seats** (S3b): attendance is typed names.
- **Clocks** on Next session (S7), factions, places.
- **Threads linked to the cast** (SQ6).
- **Encounters linked to a session.** An encounter's fight lines reach the
  session through their day (SQ4), and that's all.
- **Any change** to the cast page, *Who knows what*, the Encounters tab or
  `endEncounter`, beyond what the session rule in `addInteraction` and a
  session name on an interaction need (§8).
- **Undo** on a table (176).

## 7. The shapes

**The table, schema 0.8** (added beside `interactions` and `encounters`):

```js
sessions: [ {
  id: "SE-XXXXXXXX",             // the TAG alphabet; unique in the table
  number: 1,                     // a whole number from 0, or null; the GM's (SQ2)
  date: "YYYY-MM-DD",            // the GM's local day, a real one, or null
  present: [ "" ],               // names, trimmed, no empties: who was there (SQ8)
  hours: null,                   // a number in half hours from 0 to 24, or null
  journal: {                     // the Campaign Journal's six parts (227), text
    happened: "", fallout: "", threads: "", impact: "", reflection: "", seed: ""
  },
  created: "<ISO>", updated: "<ISO>"
} ],
threads: [ {
  id: "TH-XXXXXXXX",
  title: "",
  status: "open",                // open | resolved | dropped (anything else reads open)
  current: false,                // true on one open thread at most
  opened: null, closed: null,    // session ids, or null; closed only when not open
  notes: "",
  created: "<ISO>", updated: "<ISO>"
} ],
interactions: [ { …, session: null } ]   // 0.8: a session's id, or null
```

**The gate** (`migrateTable`, step *Schema 0.8 (Decisions 194–195): a
table keeps its sessions and threads*): before 0.8, `sessions` and
`threads` are `[]` when not arrays, and every interaction's `session` is
null. Then on every load:

- **A session:** an object; `id` by `SESSION_ID_RE`, replaced when bad or
  repeated; `number` is `_int` and 0 or more, else null; `date` is `_day`;
  `present` is `_roleList`; `hours` is a finite number, a multiple of 0.5,
  from 0 to 24, else null; `journal` an object whose six keys are `_str`
  (other keys ride along, never read); the stamps `_isoOrNull`.
- **A thread:** likewise, `THREAD_ID_RE`; `title` and `notes` `_str`;
  `status` one of the three, else `"open"`; `opened` and `closed` a string
  naming a session in this table, else null; `closed` null on an open
  thread; `current` exactly `true` on an open thread, else false, and on
  the **first** such thread in the list only.
- **An interaction:** `session` a string naming a session in this table,
  else null. Sessions are gated before interactions and threads, so the ids
  they're checked against are final.

**Engine** (Tables section, *Sessions and threads (Decisions 194–195)*).
S10a's rules: writers take the table first, stamp, and return `{ ok: true,
… }` or `{ ok: false, why }` with nothing changed; readers are total.

| Function | Does | Refuses / returns |
|---|---|---|
| `addSession(t, f?)` | a session: `number` `f.number` or one past the highest (1 for the first), `date` `f.date` or today, everything else blank. Unshifted | → `{ ok, id }` |
| `editSession(t, id, f)` | sets any of `number`, `date`, `present`, `hours`, and `journal.<part>` for the six parts (`f.journal` an object of them) | no such session; a number that isn't a whole number from 0 (*"Enter a whole number."*); hours that aren't half hours from 0 to 24 (*"Enter hours, in halves."*). A blank number or hours is null, not a refusal. A bad date is null |
| `removeSession(t, id)` | removes it; every interaction's `session`, every thread's `opened` and `closed` that named it, become null | no such session |
| `sessionList(t)` | the sessions, by `number` highest first (null last), then `date` newest first, then `created` | `[]` |
| `sessionTitle(s)` | ✎ *Session 4*, or *Session* with no number; the day is the UI's | never throws |
| `sessionInteractions(t, id)` | the interactions whose `session` is this one, newest first (`_newest`) | `[]` |
| `sessionOffered(t, id)` | the interactions with no session whose `date` is this session's (none when it has no date) | `[]` |
| `addThread(t, f)` | a thread: `title` trimmed, `opened` `f.opened` when it names a session, status open | a blank title (*"Name the thread."*) |
| `editThread(t, id, f)` | sets any of `title` (a blank one refused), `notes`, `status`, `current`, `closed`. Resolving or dropping sets `closed` to `f.closed` when it names a session, else the first of `sessionList`, else null, and clears `current`. Reopening clears `closed`. `current: true` on an open thread clears every other thread's | no such thread; a blank title; an unknown status (*"Choose a status."*); `current` on a closed thread (*"Only an open thread can be current."*) |
| `removeThread(t, id)` | removes it | no such thread |
| `threadList(t)` | open first (current first, then oldest `created` first), then resolved and dropped, most recently `updated` first | `[]` |
| `nextSession(t)` | **reader**: `{ current, open, last, seed, unbuilt }`. `current` the current thread or null; `open` the other open threads, oldest first; `last` the first of `sessionList` or null; `seed` its `journal.seed` trimmed, or ""; `unbuilt` the cast members named by `last`'s interactions, each once, in the cast's order, whose `block` has no number (`blockHasNumber`) | never throws; an empty table → `{ current: null, open: [], last: null, seed: "", unbuilt: [] }` |
| `blockHasNumber(b)` | true when any stat, authored stat or skill total in a block is a number. The engine's, so `gm.js`'s `hasNumber` becomes a call to it | false for anything else |

**`addInteraction`** gains the session rule: `f.session` when it names a
session; otherwise, when exactly one session has `date === x.date` (and
`x.date` isn't null), that one; otherwise null. **`editInteraction`**
accepts `session` (a session's id, or null to clear; anything else
refused, *"No such session."*). Neither changes for any other key.
`endEncounter` is untouched: its lines reach `addInteraction` with today's
date.

**Where the record lives:** every field saves as it's typed, through
`tableChange`, like a note (no draft on `S`). `S.sessOpen` (a session's id,
or null for the tab) and `S.threadAdd` (the add field's text) are the only
new state.

## 8. The UI

All in `gm.js` and the CSS, GM-facing, tool voice. Drafts marked ✎ are for
a voice pass. **Built for a tablet** (§1a), and Scott preps on paper today,
so the tab has to read well at 1300px too.

**The tab, top to bottom:**

- **Next session** (heading). The current thread first, marked ✎
  *Current*; then ✎ *Still open*: the other open threads, oldest first,
  each its title, a tap opens it in Threads below. Then ✎ *Last session
  set up*: the seed, with *Session N · <day>* above it as a tap to that
  session; nothing when the seed is blank. Then ✎ *Met last session, no
  stat block yet*: names, each a tap to the member's page, whose Back
  returns to Sessions. Empty table: ✎ *Nothing yet. Start a session after
  you play, or add a thread you want to follow.*
- **Threads** (heading): a field and **Add** (Enter adds, the keyboard
  stays in the field, as quick-add does). The list: open first, then ✎
  *Closed* in a fold, collapsed by default. Each thread is a row: its
  title (editable), **Current** (a toggle; pressed on one clears the
  others), **Status** (Open, Resolved, Dropped) and, when not open,
  ✎ *Closed in* (a select of the sessions by title and day). ✎ *Notes* (a
  textarea) and **Delete** behind ✎ *More*, so a list of twenty threads
  stays one line each on a tablet. Delete asks.
- **Sessions** (heading): **New session** and the list, newest first:
  ✎ *Session 4 · 3 Oct · Wren, Rook · 4 hours*, each a tap to its page.
  ✎ *No sessions yet.*

**A session's page** (replaces the tab, as a member's page replaces the
Cast tab), with **Back to sessions**:

- **Number**, **Day** (a date field), **Who was there** (one text field,
  names split on commas, suggested from the table's crew names as the cast
  page's crew field is), **Hours** (a number field, step 0.5).
- **The journal**, six labelled boxes in the worksheet's order and words:
  ✎ *What happened* (*Major events · Key decisions made by the PCs*),
  *Consequences and fallout* (*Immediate consequences · Unresolved outcomes
  · Who was affected? · Escalations in motion*), *New threads* (*Open hooks
  · Player interests · Questions raised*), *Faction and city impact*
  (*Faction shifts · City-level changes*), *Session close reflection* (*What
  worked well? · What felt slow or unclear?*), *Seed for next session*
  (*Situation · Likely turning point · Possible escalation*). Each hint is
  the 227 prompts, shortened only where marked.
- Under *New threads*: the threads opened in this session, each a title,
  and a field with ✎ **Open a thread** that adds one with `opened` this
  session. Then the threads closed in it, read-only, ✎ *Resolved* or
  *Dropped*.
- ✎ **What passed between the crew and the cast**: this session's
  interactions, read-only, as *Who knows what* draws a line (kind, who,
  crew, text), each name a tap to the member. Below, when there are any,
  ✎ *Also that day*: the offered lines, each with ✎ **Add to this
  session**.
- **Delete** (danger) at the bottom. It asks: ✎ *Delete Session 4? Its
  threads and interactions stay; they just won't say which session they
  were in.*

**An interaction row** on a member's page gains nothing to edit, but shows
its session after its day when it has one (✎ *Session 4*), as text.

| Press | The record | The view | Focus |
|---|---|---|---|
| **New session** | a session, next number, today | its page | **Number** |
| A tap on a session | — | its page | **Back to sessions** |
| **Back to sessions** | — | the tab, scrolled to the top | that session's row |
| A field on a session, typed | saved as typed | no redraw | the same field |
| **Open a thread**, Enter or the button | a thread, `opened` this session | the list under *New threads* | the same field, emptied |
| **Add to this session** | the line's `session` | the line moves up into this session's list | the next **Add to this session**, or the list's heading |
| **Delete** (session), confirmed | removed; links cleared | the tab | **New session** |
| Threads' **Add** | a thread, `opened` null | the list | the same field, emptied |
| **Current** | this one current, others cleared | Next session updates | the same toggle |
| **Status** → Resolved or Dropped | `closed` the newest session; `current` cleared | the row moves into *Closed* | the row's title in *Closed* (its fold opens) |
| **Status** → Open | `closed` cleared | the row moves back up | the row's title |
| A tap on a thread in Next session | — | Threads, that row's *More* open | its title |
| A *Met last session* name | — | the member's page; Back returns to Sessions | the page's Back |
| A refused edit (a blank title, a bad number) | — | the field shows what's stored once it loses focus; the refusal is a `notice()` | the same field |

**What a refused or empty value shows:** a blank **Number** or **Hours** is
null and reads blank (the list then shows *Session* with no number). A
blank thread title is refused and the field shows the stored title on
blur. A blank **Who was there** is `[]`.

**Copy** (✎ throughout; tool voice). No flag id, no "S5a", no "coming
soon", no mention of IP or awards (constraint 9).

## 9. Tests

**`tests/engine.test.mjs`**, *Sessions and threads (194–195)*, synthetic
names only:

- `newTable()` has `sessions: []` and `threads: []`; a 0.7 table opens as
  0.8 with both empty and every interaction's `session` null, and
  everything else deep-equal.
- `addSession`: the first is 1; the next is one past the highest, not past
  the count (sessions 1 and 21 → 22); today's local day.
- `editSession`: each field; a refused number and hours leave the session
  deep-equal; a blank one is null.
- `sessionList`: by number, nulls last, then date, then created.
- `removeSession` clears interactions' `session` and threads' `opened` and
  `closed`.
- `addInteraction`'s rule: one session that day → linked; none → null; two
  that day → null; `f.session` wins; a date of null → null. **An encounter's
  end** (`endEncounter` with a line) on a day with one session links its
  line.
- `sessionOffered`: same day, no session, listed; linked lines and other
  days, not; a session with no date offers nothing.
- Threads: `addThread` refuses a blank title; `current` moves (one at a
  time); a closed thread can't be current; resolving sets `closed` to the
  newest session (by number, not by the order they were made) and clears
  `current`; reopening clears `closed`; `threadList`'s order.
- `nextSession`: on an empty table; with a current thread and two open
  ones (oldest first); `seed` from the highest-numbered session even when
  another was made later; `unbuilt` from last session's interactions only
  (a member met two sessions ago isn't listed), each once, without anyone
  whose block has a number, without a removed member.
- `blockHasNumber` against `gm.js`'s old `hasNumber` on every block in the
  existing cast tests.

**`tests/hostile.test.mjs`**, the table file: sessions with bad and
repeated ids, `number` as `"1"`, `-1`, `1.5`, `{}`; `hours` as `0.3`, `25`,
`"4"`; `journal` as a string, an array, and with a part of `<img onerror>`
(renders as text); `present` with a number in it. Threads with a bad
`status`, `current: "true"`, two currents (only the first kept), `current`
on a resolved thread (false), `opened` and `closed` naming a session that
isn't there (null), `closed` on an open thread (null). Interactions with
`session` naming nobody, a number, an object (null). Every name and text
field once as markup. The Sessions tab, Next session, a session's page and
a thread's *More* all render with `app.errors` empty.

**`tests/smoke.test.mjs`**, switched on:

- A new table opens on **Sessions**; the tab order is Sessions, Cast,
  Threats, Encounters, Notes; reopened from Home after moving to Cast, it
  opens on Cast. The 176 tests that asserted Cast change to say so.
- Empty: Next session's one line; New session opens Session 1 on today,
  focused on Number.
- Type each field on a session, go Home and back: all kept, no redraw while
  typing (focus stays).
- Open a thread from the session; make it current; add a second from
  Threads. Next session lists the current one first and the other under
  *Still open*. Resolve the current one: it moves to *Closed in Session 1*,
  Next session has no current thread.
- An interaction added on a member's page on the session's day shows
  *Session 1* on the member's page and on the session's page; one dated
  another day doesn't. An older line on the day, made before the session
  (seed it), is offered under *Also that day*; **Add to this session**
  moves it and focus goes to the next offer.
- *Met last session*: a quick-added member with an interaction in the last
  session is listed; giving them a BOD removes them; their name opens their
  page and Back returns to Sessions.
- Delete a session: it asks, then its thread's *Closed in* is gone and the
  interaction's *Session 1* is gone.
- Switched off: Home is as it was, and there is no table to open.

**Mutation-test** (record each in the PR, with **the test that actually
caught it**). Check each for a second path before naming it:

1. **`addSession` numbers by count, not highest** → the 1-and-21 test.
2. **`addInteraction` links on two sessions that day** (first match) → the
   two-sessions test.
3. **`removeSession` leaves `closed` pointing at it** → the remove test.
4. **The gate keeps two current threads** → the hostile test.
5. **`nextSession` reads `seed` from the most recently made session** →
   the highest-number test.
6. **`unbuilt` reads every session's interactions** → the two-sessions-ago
   test.
7. **Resolving leaves `current`** → the resolve test.
8. **The gate converts interactions by date on load** → the 0.7 table
   test.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and
after each step.

1. Confirm 194, 195 and GQ27 are free on `origin/main`. Search the ledger
   again for the pre-flight's names. Confirm `SE-` and `TH-` are unused.
2. **The gate:** `TABLE_SCHEMA_VERSION` 0.8, the step, the regexes and id
   makers, `_session`, `_thread`, `session` in `_interaction`, `newTable`.
   Hostile tests.
3. **Sessions:** `addSession`, `editSession`, `removeSession`,
   `sessionList`, `sessionTitle`, the rule in `addInteraction`,
   `editInteraction`'s `session`, `sessionInteractions`, `sessionOffered`.
   Their tests.
4. **Threads and Next session:** `addThread`, `editThread`,
   `removeThread`, `threadList`, `blockHasNumber` (and `hasNumber` calling
   it), `nextSession`. Their tests.
5. **The UI:** `TABLE_SECTIONS`, the Sessions tab, a session's page,
   Threads, the session name on an interaction row, Back from a member to
   Sessions. Update the 176 tests (pre-flight).
6. **In the browser** (`shadows-dev-preview`, `?gm=on`): a new table; play
   out two sessions a week apart with threads, a quick-added member, a
   hand-written interaction and a short encounter ended with a line (Use a
   Codex entry if the pack is slotted). Read Next session after each. Then,
   **at 768 × 1024**, the tab and a session's page with every journal box
   filled; **at 390px**, no sideways overflow on either, every *More* open;
   **at 1300px**, the journal boxes readable without a scroll inside each.
7. The mutations (§9).
8. Ledger, INDEX, plan, STATE, docs, close-out (§12).

## 11. Stop and ask

- 194, 195 or GQ27 is taken, or `SE-` or `TH-` is used.
- The ledger search finds a decision that 194 or 195 overrides and §0
  doesn't name.
- The session rule can't live in `addInteraction` without changing what
  `endEncounter` or the cast page sends it.
- Putting Sessions first breaks a test you can't update by changing which
  tab it expects, or changes what reopening a table does (171).
- A member's page or *Who knows what* needs more than the session's name to
  show one.
- The journal's prompts in 227 differ from §8's list.
- The tablet check fails and the fix is a layout change outside the
  Sessions tab.
- Either decision goes over 350 words.
- A test outside the ones named fails and the fix isn't obviously yours.

## 12. Close-out

*Rule or shape* tier, switched off:

- **SCHEMA:** 194 and 195; 176 marked *superseded in part by 195* (and 177
  by 194 if SQ4 says so); §3's table block gains `sessions`, `threads` and
  the interaction's `session`, and the step history gains 0.8.
- **INDEX:** two lines under **GM mode**; 176's line marked.
- **STATE:** §1's GM clause gains sessions and threads (194–195); §5: S5a
  built, switched off, and what's next (S5b, the close-out).
- **The plan:** §6 *S5* says it's split (S5a built, S5b the close-out, the
  Session 0 worksheet with S5b or later); §4b's tab table puts Sessions
  first; §9 gains **GQ27** for Scott (*The Campaign Journal's prompts: one
  box per part with the prompts as hints, or a box per prompt? Default: one
  per part*).
- **`changelog-pending.md`:** ✎ *Keep your sessions: who came, what
  happened and what it set up, in the book's Campaign Journal. Threads you
  can follow, one of them the current quest, and a Next session page that
  says what's still open.*
- **Log** entry; **shipped** row *(switched off)*; README's table: S5a's
  row.
- **PR** titled `feat(gm): sessions, the Campaign Journal and threads, with
  Next session, switched off (W29 S5a, Decisions 194-195)`. Body: what
  changed; the mutations; the browser check (including the tablet); **Where
  the order didn't fit**.

## 13. Review checklist

- [ ] **In the browser, by the orchestrator** (#130's review skipped
      this): two sessions played out, Next session read after each, a
      member's page and a session's page agreeing on the session.
- [ ] A new table opens on Sessions; a reopened one where it was left.
- [ ] A fight's line on a session day lands in that session; on a day with
      two sessions it lands in none, and is offered on both.
- [ ] Nothing already in a 0.7 file is converted (seed a table with dated
      interactions and sessions on those days: every `session` null).
- [ ] Delete a session: nothing points at it afterwards.
- [ ] Every focus in §8's table, pressed, not assumed.
- [ ] A hostile table opens; nothing renders as markup.
- [ ] Nothing in the sheet, the cast page's editing, the Encounters tab or
      `endEncounter` changed.
- [ ] Two mutations re-run locally.
- [ ] No version bump but the table schema; `changelog-pending.md` has the
      line.
