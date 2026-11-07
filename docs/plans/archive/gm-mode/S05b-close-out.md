# Work order S5b — The close-out: what each character got, written down

**Plan:** [`../gm-mode.md`](../gm-mode.md) §4g (*Closing a session*, steps
1–7) and §6 *S5*; Decisions 11, 169, 173, 177, 203, 204.
**Status:** **drafted 2026-10-09 by Claude (Opus)**, after #138 (S5a) merged
with two fix rounds (README step 7). **SQ1–SQ4 answered by Ken 2026-10-09,
before drafting; SQ5–SQ10 answered the same day** (all defaults; SQ10's
ruling below).
**Branch:** from `main` at or after `2c43c88`, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js` (the Tables section and the CRANK
reader), `shadows-data.js` (two keys, no character can observe them), `gm.js`,
the CSS, the ledger, the table schema and STATE. Nothing in `private/`.

**What S5b is.** S5a gave a table its sessions: who came, for how long, and
the journal. What happens at the end of one is still done in the GM's head:
work out each player's IP, remember who missed it and what they were doing
instead, notice that session 5 means a Milestone, settle the threads, and
give the NPCs made up on the spot a line. S5b is **the close-out**: one sheet
on a session that works all of that out, lets the GM change any of it, and
writes **the award log**, the record of what each character got. The book
says players "track it directly on their character sheets before they go"
(`2260`), so the log is written to be read out.

**It sends nothing.** There are no seats (S3b) and no dispatches (S2) yet,
so the table can't reach a character file. The award log is the GM's record
whether or not a dispatch ever carries it (GQ20). Each line reads as what
the player enters on their own sheet's **Log a session**.

**Ken's answers, given before drafting (2026-10-09):**

- **IP rounds up.** Hours are kept in halves, so 5 an hour gives 2.5 per half
  hour; 3.5 hours is 18 IP. The GM can change any line before it's written.
- **The absent take an off-screen CRANK job.** The GM picks each absent
  name's tier; the next close-out suggests the tier last picked for that
  name. The sheet shows the pay range and the GM types the Çredits (SQ5:
  typed, not rolled).
- **Legendary** has no top to its pay range. Ken's default for its
  off-screen range is **10,000 to 15,000**, as an editable default, and
  GQ28 asks Deighton to print one.
- **Who's absent:** every name at an earlier session that isn't at this
  one, each one the GM can untick. This is the **fallback for a table
  without seats.** Once S3b's seats exist, attendance and the absent list
  come from the seats, and a seated character's own CRANK rep gives the tier
  (plan §6 *S3b*). S3b replaces this list; it doesn't add a second one.

**Carried over from S5a's review** (#138, two fix rounds; all four were the
order's):

- **A computed "latest" must say what it does with a record dated today, and
  one dated later.** S5a's *last session* was the highest number, so making
  tonight's session blanked last week's seed, and one made ahead did the
  same. Here: the absent list reads **earlier** sessions by `sessionList`'s
  order, never "every other session", and the remembered tier is from the
  latest **written** close-out before this one.
- **A default fills a blank once; it never overwrites what the GM set.**
  S5a's Resolved → Dropped re-stamped the GM's *Closed in*. Here: changing
  **Hours** on the close-out sheet recomputes the IP of every line the GM
  hasn't typed in, and leaves the typed ones alone. A remembered tier is a
  suggestion the GM's pick replaces.
- **Every empty combination gets a line**, not just the all-empty one. S5a's
  Next session showed a heading over nothing. §8 says what each part of the
  sheet shows when it has nothing.
- **Back says where it goes.** S5a's Back read *Back to sessions* and went to
  a session's page.
- Round 2's commit `05265bd` (a session dated after today is never last
  session) merged without an orchestrator review, by Ken's call. This
  pre-flight read it: `nextSession` does what Decision 204 now says.

**Pre-flight** (README, *The pre-flight*), against `main` at `2c43c88`:

- **Sessions:** `addSession`, `editSession`, `removeSession`, `sessionList`
  (number highest first, nulls last, then date, then `created`),
  `sessionTitle`, `sessionInteractions`, `nextSession` (`engine.js:4260`–
  `4399`). `_session(x, used)` gates a session (`:3888`). `present` is
  `_roleList` (trimmed names, no empties); `hours` is `_hours` (halves, 0 to
  24) or null. The 0.8 step is `migrateTable`'s last (`:3985`).
- **Threads:** `editThread(t, id, f)` closes in `f.closed` when it names a
  session, **else the newest session**. A thread resolved from the
  close-out must pass this session's id (§8), or it closes in tonight's.
- **The session page:** `sessionPageHtml(s)` / `bindSessionPage(main, s)`
  (`gm.js:867`, `:963`); `S.sessOpen` names it. Fields save as typed through
  `tableChange`. `keepPlace` keeps focus on a redraw (Decision 164).
- **The cast:** `editCastMember(t, id, f)` (`engine.js:4100`) takes the text
  keys in `CAST_TEXT` (`:3809`), which include `motivation`, `resources` and
  `line` (*What they want*, *What they've got*, *Their line*).
  `addCastMember` stamps `created`. **Quick-add writes no interaction**
  (`gm.js:390`: a name and *Who they are*), so a member made mid-play and
  never written into a line is only findable by `created` (SQ8).
- **CRANK:** `resources.crank.tiers` (`shadows-data.js:288`): five tiers,
  each `pay: { min, max }`; Legendary's `max` is `null`. `crankState(ch)`
  reads a character, not a table; the table needs a data-only reader (§7).
  The book: *"hand them credits in the lower half of their tier's payout
  range. Off-screen work closes a gear gap — it doesn't build reputation"*
  (`2000_GM_Workshop.md`, Part VI).
- **The app never rolls dice** (Decision 11). Every roll is the player's,
  typed in and checked by `checkRoll`. The book names no dice for off-screen
  pay, so the GM types an amount (SQ5).
- **IP:** `ip.perSession` is **10** (`shadows-data.js:3537`, Decision 13's
  "10 IP per session (WIP Professional)"); the sheet's **Log a session**
  defaults to it. CRB v4's `0450` says *"Every hour of play earns 5 IP"*,
  and `2260` *"roughly 5 IP per hour"*. Nothing reads an hourly rate. S5b
  adds `ip.perHour` and leaves `perSession` and Decision 13 alone: the
  player's default is a separate, player-visible fix (out of scope, §6).
  **Ken, 2026-10-09:** the rule is 5 IP an hour of play and 1 Milestone
  Point a session; the 10 was a shortcut for two-hour sessions.
- **Milestones:** `milestones.rules` (`:3046`): one Milestone Point a
  session; Minor at `minorFirstAt` 5 then every `minorEvery` 10; Major at
  `majorFirstAt` 10 then every `majorEvery` 10. `0450`'s table agrees (Minor
  5, 15, 25…; Major 10, 20, 30…). The sheet already grants a session's MP
  from its own log (`milestoneState`), so the close-out's Milestone Point is
  a line in the log, not a new rule (GQ8).
- **Version stamps in tests:** `"0.9"` is the "newer than the app" table
  stamp in `engine.test.mjs:3148`, `:3213`, `:3438` and `smoke.test.mjs:3414`.
  0.9 is now real. Change them to `"9.0"`, which no table will reach, so the
  next bump doesn't move them again.
- **The ledger,** searched by name: *award*, *close-out*, *closing a session*,
  *IP*, *ipEarned*, *perSession*, *Milestone Point*, *absent*, *CRANK*,
  *Çredits*, *tier*, *pay*, *hours*, *present*, *roll*. Hits:
  - **11** (*all rolls are physical*): followed (SQ5).
  - **13** (*10 IP per session*): cited, **not superseded** here. It's a
    player default; S5b's GM rate is a separate key.
  - **169** (CRANK rep on the character; the tier derived from the data,
    never stored on a character): followed. An award line stores the tier
    the GM **picked** for a typed name, which is the GM's input, not a
    character's derived tier.
  - **203** (sessions; `present` and `hours` stored for S5b): built on.
  - **204** (threads; *Closed in*): followed, with this session passed.
  - **177** (interactions; one place for the sentence): the award log is a
    different record (what was given, not what passed between them).
- **Decisions 205 and 206, GQ28, `SE-` lines' shape `close`**: free on
  `origin/main` (checked 2026-10-09; the only other open branch,
  `traits-archetype-layout`, is from 2026-10-02 and uses none). Check again
  before pasting.

---

## 1. Goal

At the end of a session, the GM opens it, presses **Close out**, and reads
one sheet: each player present with their IP and Milestone Point, each
absent player with an off-screen job's tier and pay, a reminder when the
session number brings a Milestone, the open threads to settle, and the NPCs
made up tonight to give a line. They change what they want and press
**Write the award log**. The session then shows the log, a line per
character, in the words the player types into their own sheet.

**Done when:**

- Switched off: nothing changes anywhere.
- A session's page has a **Close-out** section: before writing, a **Close
  out Session N** button; after, the award log and **Redo the close-out**.
- The close-out sheet works out IP as `ceil(hours × 5)` per name present,
  a Milestone Point each, and lists the absent with a suggested tier and its
  off-screen range. Every number is editable, and changing Hours recomputes
  only the lines the GM hasn't typed.
- The arc reminder shows on sessions 5, 15, 25… (Minor) and 10, 20, 30…
  (Major), by the session's own number.
- Resolving or dropping a thread from the close-out closes it **in this
  session**.
- *Anyone new?* lists this session's NPCs with no line, each with three
  fields saved as typed.
- **Write the award log** stores it; reload, export and import keep it; a
  0.8 table opens as 0.9 with no session closed out.
- The Sessions tab shows **IP so far**, per name, once any session has a log.
- A hostile table opens: bad lines dropped or nulled, nothing renders as
  markup.
- `npm run verify` and `npm run phone-check` pass; the sheet is checked by
  hand at 390px, 768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (a record on a session, two data keys, the close-out
  rule).
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** **no bump.** `ip.perHour` and Legendary's `offScreenMax`
  are read only by GM mode; no character's computed values or choices
  change (Decision 68). State it in the log.
- **Character schema, pack schema:** unchanged.
- **Table schema:** **0.8 → 0.9**, with `migrateTable()`'s step: every
  session gains `close: null`.
- **Reserved:** Decisions **205** and **206**; **GQ28** (Legendary's
  off-screen range) in the plan's §9, for Deighton. No F-flag: no player
  rule changes, and the convention for GM-only questions is a GQ (GQ23–26).

## 3. The decisions, drafted

Paste after 204, under INDEX §3's **GM mode** heading, filling **Built**.
Count each with `wc -w`; the cap is 350 (a supersession mark doesn't
count).

```
205. **A session keeps its award log: what each character got at the close-out, written once, read out to the players.**
     *2026-10-09 · Ken + Claude · Touches: close-out, award log, session close, close.lines, writeCloseOut, awardTotals, IP so far, Milestone Point, Çredits, Log a session, table schema 0.9, migrateTable, Decision 203, GQ8, GQ20, W29*
     - **Decided:** Table schema 0.9 gives each session `close`: null until the GM writes the close-out, then `{ at, lines }`, a line per character: a name, present or not, IP, the Milestone Point, Çredits, the tier an off-screen job paid at, and a note. Writing it again (Redo) replaces it. It sends nothing; each line reads as what the player enters on their own sheet. The Sessions tab sums IP per name across every log.
     - **Why:** the book has the GM hand out IP before anyone leaves and players "track it directly on their character sheets" (2260), and asks the GM to track "the total IP dispensed" (2400). With no seats or dispatch, a written log is the record (GQ20).
     - **Rejected:**
       - Computing the awards from hours and attendance every time: the GM changes them (bonus IP, a player who left early), and an edit to hours later would rewrite history.
       - Lines editable in place after writing: two surfaces for one record; Redo reopens the sheet.
       - CRANK rep and gear as their own fields: rep is the player's, by the job (169); both fit the note until a dispatch needs them.
       - A dispatch now: S2 and S3b don't exist (GQ20).
     - **Replaces:** nothing. It builds the close-out §4g promised.
     - **Revisit if:** S3b's seats arrive (the lines name seats), S2's dispatch carries the log, or GQ8 says the GM awards Milestones.
     - **Built:** table schema 0.9, switched off (173); log 2026-10-XX.

206. **The close-out works it out: IP at 5 an hour rounded up, the absent at an off-screen job's pay, the Milestone reminder by session number, and tonight's new faces.**
     *2026-10-09 · Ken + Claude · Touches: closeOutDraft, ip.perHour, IP rounding, absent, off-screen job, offScreenPay, offScreenMax, CRANK tier, Legendary, arc reminder, Minor Milestone, Major Milestone, anyone new, editThread closed, Decision 11, Decision 13, Decision 169, Decision 204, GQ28*
     - **Decided:** `closeOutDraft` proposes, the GM edits, nothing is written until they press **Write**. IP is `ceil(hours × ip.perHour)` (5, `0450`) for each name present; Hours changed recomputes only the lines not typed. The absent are the names at earlier sessions, not this one; each gets the tier last written for that name and its range: the tier's pay from its minimum to its midpoint, or `offScreenMax` (Legendary: 10,000–15,000, GQ28). The GM types the amount. A reminder shows when the session's number is a Minor or Major Milestone's. A thread settled here closes in this session. *Anyone new?* lists the members this session's lines name, or made on its day, with no motive, resources or Line.
     - **Why:** Ken, 2026-10-09: round up, remember the tier, absent means seen before. The book: 5 an hour, present only (0450); off-screen pay in the lower half (2000); Milestones at 5 and 10 (2400).
     - **Rejected:**
       - A roll for off-screen pay: the app never rolls (11), and the book names no dice.
       - Rounding down or whole hours: Ken chose up; the book says "roughly".
       - The absent as every other session's names: a planned session would count.
       - Changing `ip.perSession` (13) here: a player default, its own fix.
     - **Replaces:** nothing.
     - **Revisit if:** S3b's seats give attendance and tiers, GQ28 is answered, or the CRB changes 5 an hour.
     - **Built:** as 205.
```

**Supersession marks:** none. 13 is cited, not superseded (§0). If the
ledger search at build time finds anything either overrides, stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **IP rounding.** 5 an hour, hours in halves, IP whole | Round up | **Round up** (Ken, 2026-10-09) |
| SQ2 | **Where an absent character's tier comes from**, with typed names | The GM picks; the next close-out suggests the last pick for that name | **Yes** (Ken) |
| SQ3 | **Legendary's off-screen range**, which the book leaves open | 10,000–15,000, editable, GQ28 to Deighton | **10,000–15,000** (Ken); GQ28 for Deighton |
| SQ4 | **Who's absent** | Names at earlier sessions, not this one; each can be unticked | **Yes, as the fallback** (Ken): seats are the happy path (S3b) |
| SQ5 | **The off-screen pay is typed, not rolled.** The answers above said "offers a roll"; the app never rolls dice (Decision 11), and the book names none. The sheet shows the range (*Competent: 300–550*) and the amount field starts blank | **Typed** | **Typed** (Ken) |
| SQ6 | **Written once, then Redo.** The award log is read-only once written; **Redo the close-out** asks, reopens the sheet with the written lines, and writing replaces them | **Yes** | **Yes** (Ken); an audit trail with undo for a table is W83 |
| SQ7 | **Çredits and a note on every line**, present or absent. CRANK rep and gear go in the note, not fields of their own (169: rep moves by the job, on the player's sheet) | **Yes** | **Yes** (Ken) |
| SQ8 | ***Anyone new?*** is the cast members this session's interactions name **or** made on this session's day (`created`, in the GM's local day), whose *What they want*, *What they've got* and *Their line* are all blank. `created` is needed because quick-add writes no interaction | **Yes** | **Yes** (Ken) |
| SQ9 | **The arc reminder goes by the session's number**, against `milestones.rules`: a campaign moved in at 21 is reminded at 25, not at its fifth session in the app | **Yes** | **Yes** (Ken) |
| SQ10 | **`ip.perHour: 5` in the data**, sourced to `0450`; the sheet's `ip.perSession: 10` stays as it is. The sheet defaulting to 10 while the book says 5 an hour is a separate fix (see §6) | **Yes** | **Yes** (Ken): the rule is **5 IP an hour of play and 1 Milestone Point a session** (`0450`); the 10 was a shortcut for the two-hour sessions the table ran then. The sheet's own default moves in its own player-facing fix, which supersedes 13 in part |

## 5. Read first

- `CLAUDE.md` whole: constraints 6, 7, 8, 9 and 10; *Decisions*; *Flags*.
- `docs/STATE.md` whole.
- The plan: §4g (*Closing a session*), §6 *S5* and *S3b*, §9 GQ8 and GQ20.
- `docs/SCHEMA.md` §3's table shape; §4: Decisions **11**, **13**, **169**,
  **203**, **204**.
- `private/crb/0450_Advancement.md` (IP and Milestone Points),
  `2260_Session_One.md` (handing out IP), `2400_Part_IV_Campaign_Play.md`
  (the two numbers to track), `2000_GM_Workshop.md` Part VI (*Running a
  CRANK job off-screen*).
- **The code:** `engine.js`'s sessions and threads section, `_session`,
  `migrateTable` and its 0.8 step, `_roleList`, `_int`, `_hours`,
  `_isoOrNull`, `editThread`, `editCastMember`, `CAST_TEXT`, `crankData`.
  `gm.js`'s `sessionPageHtml`, `bindSessionPage`, `sessionsTabHtml`,
  `threadRowHtml`, the encounter wrap-up's draft on `S` (`S.encWrap`, the
  pattern for a sheet that edits before it writes; its Back clears it, which
  this one's doesn't), `_fold`, `askFirst`, `keepPlace`,
  `notice`. The sheet's **Log a session** (`sheet.js:1306`), whose fields
  the award log's words follow.

## 6. Out of scope

- **Seats, dispatches, reconciliation** (S2, S3b, S4). Nothing reaches a
  character file.
- **The sheet's own IP default** (`ip.perSession: 10`, Decision 13) against
  CRB v4's 5 an hour. Ken ruled the rule is 5 an hour (SQ10); the sheet's
  change is player-visible, bumps the app and the game data, and supersedes
  13 in part, so it's its own fix. S5b must not touch it.
- **The Session 0 worksheet** (plan §4g's last paragraph): later.
- **CRANK rep changes and gear as fields** (SQ7).
- **Any change** to the cast page, the Encounters tab, `endEncounter`,
  `nextSession` or Next session.
- **Undo** on a table (176).

## 7. The shapes

**The table, schema 0.9:**

```js
sessions: [ { …,                       // as 0.8 (Decision 203)
  close: null                          // 0.9: null until written (Decision 205)
    | { at: "<ISO>",                   // when it was written; the gate's _isoOrNull
        lines: [ {
          name: "Wren",                // trimmed, not empty; unique in the log, ignoring case and spaces
          present: true,               // true or false
          ip: 18,                      // a whole number from 0, or null
          milestone: true,             // true only on a present line
          credits: null,               // a whole number from 0, or null
          tier: null,                  // a resources.crank.tiers id, or null; only on an absent line
          note: ""                     // text
        } ] }
} ]
```

**The data** (no `gamedataVersion` bump, §2):

- `ip.perHour: 5`, beside `perSession`, with a source comment (`0450`).
- `resources.crank.tiers` Legendary gains `"offScreenMax": 15000`, with a
  comment naming GQ28. No other tier carries it.

**The gate** (`migrateTable`, step *Schema 0.9 (Decisions 205–206): a
session keeps its award log*): before 0.9, every session's `close` is null.
Then on every load, in `_session`:

- `close` null unless an object with a `lines` array; `at` `_isoOrNull`.
- Each line: an object, else dropped. `name` `_str` trimmed; a blank name,
  or one already in the log (compared with the engine's `_fold`), dropped. `present`
  exactly `true`, else false. `ip` and `credits` `_int` and 0 or more, else
  null. `milestone` exactly `true` **and** present, else false. `tier` a
  tier id in the data **and** not present, else null. `note` `_str`. Other
  keys ride along, never read.
- A `close` whose lines all dropped keeps `lines: []` (it was written; it
  said nothing).

**Engine** (*Sessions and threads*, after `nextSession`). Writers take the
table first, stamp, and return `{ ok: true, … }` or `{ ok: false, why }`
with nothing changed; readers are total.

| Function | Does | Refuses / returns |
|---|---|---|
| `offScreenPay(tierId)` | **reader, data only**: `{ min, max }`: the tier's `pay.min` to its `offScreenMax`, else to `floor((min + max) / 2)` | `null` for an unknown tier, or one with neither a `max` nor an `offScreenMax` |
| `arcDue(number)` | **reader**: `{ minor, major }`, each true when a whole `number` is that Milestone's by `milestones.rules` (`first`, then every `every`) | `{ minor:false, major:false }` for null, 0 or anything not a whole number |
| `closeOutDraft(t, id)` | **reader**: `{ session, perHour, present, absent, arc, threads, newcomers }`. `present`: each name in `session.present`, `{ name, ip, milestone: true }`, `ip` `ceil(hours × perHour)` or null with no hours. `absent`: each name (folded, first spelling, in the order first met) in the `present` of sessions **after this one in `sessionList`** and not in this one's, `{ name, tier, range }`, `tier` from the newest written line for that name with a tier in those earlier sessions, `range` `offScreenPay(tier)`. `arc`: `arcDue(session.number)`. `threads`: the open threads, `threadList`'s order. `newcomers`: cast members linked by this session's interactions, or whose `created` falls on its date in the GM's local day, with `motivation`, `resources` and `line` all blank, in the cast's order, each once | never throws; no such session → `null` |
| `writeCloseOut(t, id, f)` | sets `close` to `{ at: now, lines }` from `f.lines`, each line checked as the gate checks it | no such session; no lines (*"Nobody to write down."*); a line with a blank or repeated name (*"Each line needs its own name."*); an IP or Çredits that isn't a whole number from 0 (*"Enter a whole number."*); a tier that isn't one (*"Choose a tier."*). A blank IP or Çredits is null, not a refusal |
| `awardTotals(t)` | **reader**: per name across every written log, folded, first spelling, in the order first written: `{ name, ip, milestones, credits, sessions }` (sums; `sessions` counts present lines) | `[]` |

`closeOutDraft` never writes. Settling a thread from the close-out calls
`editThread(t, threadId, { status, closed: sessionId })`. Giving a newcomer
a line calls `editCastMember`.

**Where the draft lives:** `S.closeOut = { id, lines, typed }` while the
sheet is open, on `S` as the encounter wrap-up's `S.encWrap` is, with one
difference: the wrap-up's Back clears it, and this one's doesn't. `lines` the
draft lines, `typed` the set of line keys (`name|ip`, `name|credits`, …)
the GM has typed into, so a recompute knows what to leave. Back keeps the
draft until the table closes or the log is written; opening the sheet again
resumes it. The fields at the top (Who was there, Hours) save to the
session as typed, as on its page.

## 8. The UI

All in `gm.js` and the CSS, GM-facing, tool voice. Drafts marked ✎ are for
a voice pass. **Built for a tablet** (§1a).

**On a session's page**, after *What passed between the crew and the cast*
and before **Delete**: a heading ✎ **Close-out**, then:

- **Not written:** ✎ **Close out Session 4** (primary; *Close out this
  session* with no number).
- **Written:** ✎ *Written 3 Oct.* and the log, a line per character, in the
  words of the player's **Log a session**:
  - present: ✎ *Wren: log a session with **18 IP** and the Milestone
    Point; +250 Çredits. Note.*
  - absent: ✎ *Rook (away): an off-screen job, Competent; +400 Çredits.*
  - a line with nothing: ✎ *Dez: nothing this time.*

  Then ✎ **Redo the close-out**, which asks: ✎ *Redo the close-out? You'll
  start from what's written; writing again replaces it.*

**The close-out sheet** (replaces the session's page, as the page replaces
the tab), with ✎ **Back to Session 4**, and the heading ✎ *Close out
Session 4*:

1. **Who was there** and **Hours**, the page's two fields, saved as typed.
   A change recomputes the IP of untyped lines and redraws the lists below,
   keeping focus in the field.
2. ✎ **Improvement Points** (✎ hint: *5 an hour, rounded up. Change any of
   it.*): a row per name present: the name, **IP** (a number field),
   **Milestone Point** (a checkbox, ticked), **Çredits** (blank), **Note**.
   No names: ✎ *Add who was there to work out IP.* No hours: each IP blank,
   ✎ *Add the hours to work out IP.*
3. ✎ **Away tonight** (only when there are absent names): a row per name: ✎
   **Took a job** (a checkbox, ticked), **Tier** (a select of the five, the
   suggestion selected, or ✎ *Choose a tier* with none), the range as text
   (✎ *Pays 300–550*), **Çredits** (blank), **Note**. Unticked: the row
   folds to the name and writes no line.
4. ✎ *Session 5: a Minor Milestone comes due. Each player's sheet counts
   their own.* (Major likewise; both on a session that is both.) Nothing
   otherwise.
5. ✎ **Threads** (only when any are open): each open thread's title,
   **Status** (Open, Resolved, Dropped) and **Current**. Resolving or
   dropping one here closes it in this session; it leaves the list. None
   open: ✎ *No open threads.*
6. ✎ **Anyone new?** (only when there are newcomers): each one's name (a tap
   to their page; its Back returns to the sheet) and three fields, ✎ *What
   they want*, *What they've got*, *Their line*, saved as typed. A member
   given any of the three stays listed until the sheet is reopened.
7. ✎ **Write the award log** (primary). Writes, clears `S.closeOut`, and
   returns to the session's page.

**On the Sessions tab**, under the Sessions heading, once any log exists: ✎
*IP so far: Wren 63 · Rook 48 · Dez 15* (`awardTotals`, IP only).

| Press | The record | The view | Focus |
|---|---|---|---|
| **Close out Session N** | — (a draft on `S`) | the sheet | **Who was there** |
| **Back to Session N** (the sheet) | — (the draft kept) | the session's page | **Close out Session N** |
| **Hours** or **Who was there**, typed | the session, as typed | the lists redraw | the same field |
| An **IP**, **Çredits** or **Note**, typed | — (the draft; the field joins `typed`) | no redraw | the same field |
| **Took a job** unticked / ticked | — | the row folds / opens | the same checkbox |
| A **Status** on a thread | the thread, closed in this session | it leaves the list | the next thread's Status, else the Threads heading |
| A newcomer's field, typed | the member, as typed | no redraw | the same field |
| A newcomer's name | — | the member's page; Back returns to the sheet | the page's Back |
| **Write the award log** | `close` written | the session's page | the *Close-out* heading |
| **Write**, refused | — | the sheet | the field the refusal names, with a `notice()` |
| **Redo the close-out**, confirmed | — (a draft from the written lines; every field `typed`) | the sheet | **Who was there** |

**What a refused or empty value shows:** a blank IP or Çredits is null and
the log leaves it out (*log a session with the Milestone Point*). A bad
number is refused on **Write**, and the field keeps what was typed so the
GM can fix it.

**Copy** (✎ throughout; tool voice). No flag id, no GQ, no "S5b", no
"dispatch", no "coming soon" (constraint 9).

## 9. Tests

**`tests/engine.test.mjs`**, *The close-out (205–206)*, synthetic names:

- `newTable()`'s sessions get `close: null`; a 0.8 table opens as 0.9 with
  every session's `close` null and everything else deep-equal.
- `offScreenPay`: each tier's range, by the midpoint rule; Legendary
  10,000–15,000 from `offScreenMax`; an unknown tier null.
- `arcDue`: 5, 15, 25 minor; 10, 20 major; 0, 4, null, 5.5 nothing.
- `closeOutDraft`: 3.5 hours → 18 each; no hours → null IP; the absent from
  **earlier** sessions only (a name only at a later or future-numbered session
  isn't absent), folded, first spelling; the tier from the newest written
  line before this session, not the oldest; newcomers by line and by
  `created`, not one with a Line, each once; no such session → null.
- `writeCloseOut`: each refusal leaves the table deep-equal; a blank IP is
  null; a Redo replaces, never appends; `milestone` false on an absent line
  and `tier` null on a present one, whatever was sent.
- `awardTotals`: sums across two logs, folded names, first spelling.
- A thread settled with `closed: this` closes in this session, not the
  newest.

**`tests/hostile.test.mjs`**, the table file: `close` as a string, an array,
`{ lines: "x" }`; lines with a blank name, a repeated name (`"Wren"` and `"
wren "`), `ip` as `-1`, `1.5`, `"7"`, `{}`; `credits` as `-5`; `milestone:
"true"`; `milestone: true` on an absent line; `tier: "mythic"`; `tier` on a
present line; a name and note as `<img onerror>` (render as text). The
close-out sheet and the written log render with `app.errors` empty.

**`tests/smoke.test.mjs`**, switched on:

- A session with Wren and Rook, 3.5 hours: **Close out** opens the sheet
  focused on Who was there; each IP reads 18, Milestone Point ticked.
- Type Rook's IP as 20, change Hours to 3: Wren's is 15, Rook's stays 20.
- An earlier session had Dez: Dez is under *Away tonight*, Tier *Choose a
  tier*; pick Competent, *Pays 300–550* shows; type 400. Write. The next
  session's close-out suggests Competent for Dez.
- Session number 5: the Minor reminder; 10: the Major one; 4: neither.
- Resolve a thread from the sheet: its *Closed in* is this session, though a
  newer session exists.
- A quick-added member made today, no line: under *Anyone new?*; type *What
  they want*, reopen the sheet: gone.
- Write: the session's page shows the log in the player's words; the Sessions
  tab shows *IP so far*; reload, export and import keep it. **Redo** asks and
  starts from the written lines.
- Back from the sheet keeps the draft; Back's label names the session.
- Every focus in §8's table, pressed.
- Switched off: Home is as it was.

**Mutation-test** (record each in the PR, with **the test that actually
caught it**). Check each for a second path first:

1. **IP rounds down** (`Math.floor`) → the 3.5-hour test.
2. **The absent come from every other session**, not earlier ones → the
   later-session test.
3. **The tier from the oldest written line** → the remembered-tier test.
4. **Legendary's range ignores `offScreenMax`** → the Legendary test.
5. **The gate keeps `milestone` on an absent line** → the hostile test.
6. **Redo appends** → the Redo test.
7. **Changing Hours recomputes typed lines** → the typed-IP smoke test.
8. **A thread settled from the sheet closes in the newest session** → the
   close-out threads test.
9. **The arc reminder counts sessions**, not the number → the arc test with
   a table whose only session is number 5.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and
after each step.

1. Confirm 205, 206 and GQ28 are free on `origin/main`. Search the ledger
   again for the pre-flight's names.
2. **The gate:** `TABLE_SCHEMA_VERSION` 0.9, the step, `close` in `_session`,
   `newTable`; the four `"0.9"` test stamps to `"9.0"`. Hostile tests.
3. **The data and its readers:** `ip.perHour`, Legendary's `offScreenMax`,
   `offScreenPay`, `arcDue`. Their tests.
4. **The close-out in the engine:** `closeOutDraft`, `writeCloseOut`,
   `awardTotals`. Their tests.
5. **The UI:** the session page's Close-out section, the sheet, the
   Sessions tab's line, Back from a newcomer's page.
6. **In the browser** (`shadows-dev-preview`, `?gm=on`): a table with three
   sessions, numbered 4, 5 and 6, attendance varying; close out each in turn
   with a typed IP, an off-screen job, a thread resolved, and a quick-added
   member given a line; read the log and *IP so far* after each. Then at
   **768 × 1024** the sheet with five names present and two away; at
   **390px** no sideways overflow on the sheet or the log; at **1300px**
   the rows readable on one line each.
7. The mutations (§9).
8. Ledger, INDEX, plan, STATE, docs, close-out (§12).

## 11. Stop and ask

- 205, 206 or GQ28 is taken.
- The ledger search finds a decision 205 or 206 overrides that §0 doesn't
  name.
- `closeOutDraft` can't find the absent or the newcomers without storing
  something new.
- Settling a thread from the sheet needs a change to `editThread`.
- The award log's words can't follow **Log a session**'s fields (the sheet
  changed).
- A new key in the data trips the unread-key guard (Decision 135) in a way
  that reading it from `engine.js` doesn't fix.
- The tablet check fails and the fix is a layout change outside the session
  page and the sheet.
- Either decision goes over 350 words.
- A test outside the ones named fails and the fix isn't obviously yours.

## 12. Close-out

*Rule or shape* tier, switched off:

- **SCHEMA:** 205 and 206; §3's table block gains `close` on a session, and
  the step history gains 0.9; §2's data shape gains `ip.perHour` and
  `offScreenMax` if it lists those blocks.
- **INDEX:** two lines under **GM mode**.
- **STATE:** §1's GM clause gains the close-out (205–206) and table schema
  0.9; §5: S5b built, switched off, and what's next.
- **The plan:** §6 *S5* says S5b is built; §9 gains **GQ28** for Deighton
  (*Legendary's CRANK pay has no top. What should an off-screen Legendary
  job pay? Default: 10,000–15,000, editable*).
- **`changelog-pending.md`:** ✎ *Close out a session: everyone's IP worked
  out from the hours, the Milestone Point, an off-screen job for whoever
  missed it, and a written award log to read out at the table.*
- **Log** entry (state the no-bump of game data, and why); **shipped** row
  *(switched off)*; README's table: S5b's row.
- **PR** titled `feat(gm): the close-out and the award log, switched off
  (W29 S5b, Decisions 205-206)`. Body: what changed; the mutations; the
  browser check (including the tablet); **Where the order didn't fit**.

## 13. Review checklist

- [ ] **In the browser, by the orchestrator:** three sessions closed out in
      turn; the remembered tier; a typed IP surviving an Hours change; the
      log's words against the sheet's **Log a session**.
- [ ] The absent list ignores a later-numbered session.
- [ ] A thread resolved from the sheet closes in this session.
- [ ] Nothing in a 0.8 file is converted (every `close` null).
- [ ] Redo replaces, and asks first.
- [ ] Every focus in §8's table, pressed, not assumed.
- [ ] A hostile table opens; nothing renders as markup.
- [ ] `ip.perSession`, the sheet and `nextSession` unchanged.
- [ ] Two mutations re-run locally.
- [ ] No version bump but the table schema; `changelog-pending.md` has the
      line.
