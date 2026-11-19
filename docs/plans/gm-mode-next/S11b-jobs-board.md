# Work order S11b: a CRANK job paid at the close-out

**Plan:** [`../gm-mode-next.md`](../gm-mode-next.md), session S11, its second half. **S11a** (the Job Generator,
Decision 297) is built. **The ask:** Ken, 2026-11-18, after S11a merged: draft S11b, "the jobs board". **The book:**
`2625` (CRANK and Bank), *How CRANK Works* and *Reputation*. **The first plan's sketch:** `archive/gm-mode.md` §4c
(`jobs: [JobRecord]`) and §4i (client, tier, payout, status, crew). **Reopens:** Decision 205 in part (the award log).
**Status:** **drafted 2026-11-18** by Claude (Opus), S11a's reviewer, at Ken's ask through the conductor. **Approved
by Ken 2026-11-18**, in the conductor session: "All defaults". GQ67–GQ74 each take their default. **Builds after S23
merges** (Ken: no more than one build at a time).
**Branch:** from `main`; PR to `main`. Nothing ships switched off: GM mode is on for everyone (Decision 239).
**Runs beside:** S23's order (#366, docs only) and K3 (#365, the sheet's help). Neither touches the close-out. K3
edits `sheet.js` and the data, so expect a small merge there (§9's sheet line). **Say N everywhere.**

**This order recommends building less than the sketch.** The sketch's `JobRecord` and a board with five statuses
(posted, taken, done, failed, abandoned) would duplicate what S11a already made:
- A contract is a thread, and a thread is open, resolved or dropped.
- **Next session** lists the open threads.
- GM mode is the GM's alone, so the book's QUORUM curation ("only the postings you put in front of them") is how the
  app already works.

What's missing is the night a job **ends**: one payout split across the crew, +1 rep for each of them, and the
walk-out that costs nothing because the client broke the contract first. That happens at the close-out, so S11b puts
the job there. GQ67 asks Ken to choose between this and the sketch.

**Pre-flight** at `4c2e591` (`main`, after S11a's #364). `private/` at `c99bb58`.
- **The award log** (Decisions 205, 206; table schema 0.9) is `session.close = { at, lines }`. A line is
  `{ name, present, ip, milestone, credits, tier, note }` (`_closeLine`, engine ~7039).
  - `writeCloseOut` (~8541) replaces the whole log in one write.
  - The gate is `_close` (~7053): a line that makes no sense is dropped, never repaired.
  - **205 rejected "CRANK rep and gear as their own fields":** "rep is the player's, by the job (169); both fit the
    note until a dispatch needs them". What it didn't weigh: a job with a crew and an outcome, which is where rep
    comes from (*Search before you propose*, CLAUDE.md). This order keeps 205's line shape and derives rep from the job.
- **Readers of `close`:**
  - engine: `_close`, `migrateTable`'s 0.9 step, `_sessionFields` (~8355, Find), `closeOutDraft` (~8503; it reads
    earlier logs' `tier`), `writeCloseOut`, `awardTotals` (~8565, which sums `credits` though no screen shows it),
    `_seatHistory` (~8786, IP only);
  - `gm.js`: `closeDraftNew` (~2806), `closeSync` (~2837), `coLogLine` (~2858), `closeOutSectionHtml` (~2872),
    `coTotalsHtml` (IP only), `closeEndHtml` (~2958), and the write (~2996);
  - `tools/sample-table.mjs`: `closeOf` (~446); *Dead Air*'s sessions 1–3 each pay the crew alike (Ç1,200, Ç800, Ç600).
- **The close-out page** is Hours and Who was there, then *Improvement Points* (present lines: IP, Milestone,
  Çredits, Note), then *Away tonight* (took a job, tier, Çredits at the floor), the Milestone reminder, *Threads*, and
  *Anyone new?*.
  - **A thread's status changes there at once**, each its own `tableChange` (~3030), not at **Write**. So a job can
    name a thread but shouldn't change it (GQ71).
- **The sheet:** `crankControlsHtml` (`sheet.js` ~1612) has **Job done +1** and **Walked out −2** (`jobDone`,
  `jobWalkedOut`, data ~291) and a "which job" note.
  - CRANK's description (data ~290, the tip's text) ends "Walking out on a client is the one thing that follows you."
    Nothing says a walk-out on a client who broke the contract first isn't one. The book (`2625` *Losing rep*):
    "Walking away from a client who broke the contract first isn't abandonment, and the platform knows the difference."
- **The table doesn't know a player's rep** (S25's GQ52). Nothing here can halve a Burned character's pay, check a
  tier, or move rep. The log says what each player enters, as it does for IP.
- **The book on a job:**
  - "The payout covers the job, not each operator on it. The crew splits it however the crew splits things."
  - "Each successful job completion earns +1 rep." "Everyone who sees the job through earns the rep."
  - "Failing a job costs nothing."
  - "Abandoning a contract mid-job costs -2 rep."
  - "Off-screen work … doesn't build reputation. Rep is earned at the table."
- **Table schema** is 0.20 (S24). Neither open PR moves it.
- **`addThread` unshifts** (~8243), so a new thread is first in `t.threads`, but Threads shows it last of the open ones.
  S11a's order got this wrong (see *Carried over*).

**Carried over** (S11a's review):
- **A drafted behaviour was false** (§9: "lands at the top of Threads"). Check every behaviour this order drafts
  against the code's existing equivalent before building it. Where this order says "as X does", open X.
- **A template had no article rule** ("for <Client>"). This order's strings join data into sentences: a tier ("an
  Expert job", "a Skilled job"), an outcome, a thread's title. Run each against every value the data holds, not one
  example.
- **The reader sweep.** Grep `close.lines`, `.close`, `writeCloseOut`, `awardTotals` and `coLogLine` across `src/`,
  `tests/` and `tools/` before changing the shape.

## 1. Goal and Done when

**Goal.** A crew finishes a CRANK job tonight. At the close-out the GM says how it ended, what it paid and who was
on it, and the award log tells each player their share and their rep.

**Done when:**
1. The close-out page has a **CRANK jobs** section after *Away tonight*, with **Add a job**.
2. A job has:
   - **what job it was:** an open thread, a thread closed in this session, or a typed title;
   - **how it ended:** *Seen through*, *Failed*, *Walked out*, or *The client broke it*;
   - **a tier,** optional, which shows its pay range as a hint;
   - **the payout** (*Seen through* only);
   - **who was on it,** from the present lines, all ticked to start, each with a **share** prefilled as the payout
     split evenly and rounded down.
3. **Write the award log** writes the jobs with the lines, in the same single write and undo.
4. The written log, on the session page and the close-out's end page, gives each name its job clauses. For example:
   "From *CRANK: Courier for a Street Gang* (seen through): +Ç800 and +1 CRANK rep." Rep is the outcome's, from the
   data.
5. **Redo the close-out** brings the jobs back as written, so a redo never pays a job twice.
6. An away line can't be on a job. Off-screen pay stays the floor (Decision 295) and earns no rep.
7. CRANK's tip on the sheet says a walk-out on a client who broke the contract first costs nothing (GQ72).
8. *Dead Air* has a job in one close-out.

## 2. Tier, versions, numbers

**Rule or shape:** the table file's shape moves, and how a job pays is a player-facing behaviour.
- **App:** a minor. Join `main`'s `[Unreleased]` heading if it's still a minor (0.73.0 at drafting), else take the
  next.
- **Table schema:** **0.20 → 0.21.** `close` gains `jobs`, with a `migrateTable` step that gives every written log
  `jobs: []`. Nothing is guessed from a line's credits (Decision 203's rule).
- **Game data:** **none,** by Decision 68.
  - The outcomes are data no character observes. The table reads them, as S11a's tables were.
  - CRANK's description gains a sentence. It's text, not a value or a choice.
  - If a guard disagrees, stop and say so.
- **Character and pack schemas:** none.
- **Decisions:** **N** (a job is paid at the close-out, and there's no jobs record).
- **Flags:** none. Nothing here rules on the book: the GM types every payout and share, and rep is the book's +1, −2
  and 0.

## 3. The decision, drafted

```
N. **A CRANK job is settled at the close-out: how it ended, its payout and its crew, kept on the session's award log. A table keeps no jobs record and no board.**
     *2026-11-?? · Ken + Claude · Touches: close-out, award log, close.jobs, writeCloseOut, awardTotals, coLogLine, resources.crank.outcomes, jobDone, jobWalkedOut, CRANK description, the CRANK tip, table schema 0.21, migrateTable, JobRecord, S11b, Decision 169, Decision 205, Decision 295, Decision 297, GQ20, GQ52*
     - **Decided:** A written close-out is `{ at, lines, jobs }`. A job is `{ title, thread, outcome, tier, pay, crew:[{ name, share }] }`. The crew are present lines only. The outcome is one of the data's four, and each says its rep (+1 seen through, 0 failed, −2 walked out, 0 the client broke it). The log gives each crew member their share and that rep, to enter on their own sheet; `awardTotals` counts the shares as Çredits. Contracts stay threads (297), and the job doesn't change its thread.
     - **Why:** `2625`: one payout split however the crew splits it, +1 for everyone who sees it through, nothing for a failure or a client's breach, −2 for a walk-out. The close-out is where a night's awards are already written and read out (205, GQ20). A thread already holds the contract, its status and Next session's list (297), so a jobs record would be a second one.
     - **Rejected:** A `jobs` collection with the first plan's `JobRecord` and a posted/taken/done board: it duplicates threads, and the board is the GM's anyway (QUORUM). A `rep` field on each award line (205's rejected option): rep is read from the job's outcome, so it can't disagree with it. An even split only: the book says the crew splits it however they split things. Away characters on a job: off-screen work builds no rep (`2625`, 295). Halving a Burned character's share: the table doesn't know rep (GQ52).
     - **Replaces:** Decision 205 in part: the award log keeps the night's CRANK jobs, and rep reaches the log through them.
     - **Revisit if:** a GM wants jobs posted and tracked before they run (the board, W-new), the dispatch (W146) carries the log, or the book changes the +1, −2 or the split.
     - **Built:** app X.Y.Z, table schema 0.21, PR #…, log 2026-11-…
```

**Supersession marks:** 205 → **superseded in part by N**, and its INDEX line. 297's *Revisit if* named S11b's own
record. N answers it without superseding 297: it says why a record wasn't built.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| **GQ67** | **The shape.** (a) A job settled at the close-out, on the session's log, with no jobs record. (b) The first plan's `jobs` collection: a `JobRecord` with posted/taken/done/failed/abandoned, a crew and a board on the Sessions tab, with closing it filling the close-out. (c) Nothing more than S11a: the GM types shares into Çredits and rep into the note | **(a).** (b) makes a second record of what a thread already holds, and a board nobody but the GM sees. (c) leaves the split, the crew's rep and the client's breach to memory. (b) can still come later from (a): its jobs would point at the same threads |
| **GQ68** | **How a job ends.** | **Four outcomes, as data:** *Seen through* (+1, paid), *Failed* (0, unpaid), *Walked out* (−2, unpaid), *The client broke it* (0, unpaid). A GM who wants a breach to pay something types it into that line's own Çredits with a note. The book doesn't say whether a breach pays, so the app doesn't either |
| **GQ69** | **The split.** | **Each share prefilled** as the payout ÷ the crew, rounded down, and editable. What's left over shows ("Ç2 not split"). The book: "however the crew splits things" |
| **GQ70** | **Who can be on a job.** | **Present lines only.** An away character's job is the off-screen one: floor pay, no rep (295, `2625`) |
| **GQ71** | **The job's thread.** Does *Seen through* resolve it? | **No.** The job names a thread, or a typed title, and the *Threads* section below it settles the thread as now. A thread's status changes at once there, while a job waits for **Write**, so they can't share a press. A job can also be one step of a longer thread |
| **GQ72** | **The client who broke the contract, on the sheet.** | **One sentence in CRANK's description** (the tip): "Walking away from a client who broke the contract first isn't walking out, and costs nothing." No third button: a 0 needs no press. For the voice pass |
| **GQ73** | **A tier on a job.** | **Optional.** It shows the tier's range beside the payout ("Skilled pays Ç1,000–3,000") and names the job in the log ("a Skilled job"). Nothing checks it against anyone's rep (GQ52) |
| **GQ74** | **The jobs board.** | **To the wishlist** as a new W: posted jobs before they run, if Scott's play (S22) asks for it. GQ67's (a) leaves room for it |

## 5. The assumption sweep

| What | Today (where) | After |
|---|---|---|
| `resources.crank` (data ~288) | `jobDone`, `jobWalkedOut`, tiers, `jobs` (297) | adds `outcomes: [{ id, name, rep, paid }]`, four, in the book's order. **The ids are permanent**: a table file stores them. The rules test pins `done.rep === jobDone` and `walked.rep === jobWalkedOut` |
| CRANK's `description` (data ~290) | ends on the walk-out | plus GQ72's sentence |
| `_close` (engine ~7053) | `{ at, lines }` | also `jobs`. A job with no title, a bad outcome, or no crew is dropped. A crew name with no present line is dropped. A share is a whole number ≥ 0 or null, and `pay` is too, kept only on a paid outcome. `tier` is a known tier or null. `thread` is a thread id or null |
| `migrateTable` | 0.20 | a 0.21 step: every written `close` gets `jobs: []` |
| `writeCloseOut` (~8541) | lines | also takes `f.jobs`. It refuses, with a `why` and the job's index, a job with no title, no outcome, no crew, or a share that isn't a whole number. One write, one undo |
| `closeOutDraft` (~8503) | proposes lines | unchanged. The UI holds the jobs while the sheet is open, as it holds the lines |
| `awardTotals` (~8565) | sums `credits` per name | adds each crew share to that name's `credits`. No screen reads it today: say so in the test |
| `_sessionFields` (~8355, Find) | each line's name and note | each job's title |
| `_seatHistory` (~8786) | IP only | unchanged |
| `gm.js` close-out | lines in `S.closeOut` | `S.closeOut.jobs`, drafted, synced to Who was there by `closeSync` (a name leaving the present drops off every crew; one coming back isn't re-added), and rebuilt from the written log by `closeDraftNew` |
| `coLogLine` (~2858) | the line alone | plus that name's job clauses, after the line's own words |
| `closeEndHtml`, `closeOutSectionHtml` | `coLogLine` per line | unchanged (they read `coLogLine`). A job whose whole crew left the log can't exist (the gate) |
| Help (data ~5246, `closeout`) | Who came, IP, threads, anyone new | `for` gains a clause for the jobs. The glossary's `closeout` term too, if it lists the parts |
| The sheet's CRANK tip (`shared.js` ~604) | reads `description` | unchanged code |
| `tools/sample-table.mjs` | sessions 1–3 pay the crew alike | one of them carries a job (session 2: Ç2,400, three ways, seen through), and its lines' credits go blank so it isn't paid twice. `sample-table.test` gains a check that the job's crew are present |
| `voice.test.mjs` | — | every new string: no "abandon" as a button (the book's word is fine in the tip) |

## 6. Read first

`CLAUDE.md` (constraint 7, the change tiers). SCHEMA §4: Decisions 68, 169, 203, 205, 206, 254, 270, 295, 296 and
297. `2625`'s *How CRANK Works* and *Reputation*. `engine.js`: `_closeLine`, `_close`, `writeCloseOut`, `awardTotals`,
`_sessionFields`, `addThread`. `gm.js`: from `coKey` (~2795) to `bindCloseOut`, the whole close-out. `sheet.js`:
`crankControlsHtml`. `tools/sample-table.mjs`: `closeOf`.

## 7. Out of scope

- **A jobs record, a board, posted and taken jobs** (GQ67, GQ74).
- **Moving anyone's rep or Çredits.** The log says what to enter. The sheet's buttons do it (GQ20, GQ52).
- **Halving pay below 0 rep** (GQ52).
- **Changing a thread from a job** (GQ71).
- **Off-screen jobs.** They're 295's, on *Away tonight*.
- **The dispatch** (W146).

## 8. The shapes

- **Data:**
  ```
  outcomes: [
    { id:"done",   name:"Seen through",         rep:1,  paid:true  },
    { id:"failed", name:"Failed",               rep:0,  paid:false },
    { id:"walked", name:"Walked out",           rep:-2, paid:false },
    { id:"broken", name:"The client broke it",  rep:0,  paid:false }
  ]
  ```
  Names are for the voice pass. Every key is read: `name` by the picker and the log, `rep` by the log, `paid` by the
  payout field and the gate.
- **A written job:** `{ title:"CRANK: Courier for a Street Gang", thread:"TH-…"|null, outcome:"done", tier:"skilled"|null,
  pay:2400|null, crew:[{ name:"Mara Okonkwo", share:800 }, …] }`. `title` is copied from the thread when one is picked,
  so the log reads the same after the thread is renamed or deleted. It's an input, not a cache: the GM may type their
  own.
- **The log's clause** per crew member, joined after the line's own words:
  - Seen through, with a share: "From *<title>*, seen through: +Ç800 and +1 CRANK rep."
  - Seen through, with no share: "From *<title>*, seen through: +1 CRANK rep."
  - Walked out: "From *<title>*, walked out: −2 CRANK rep."
  - Failed, or the client broke it: "From *<title>*, failed: no rep lost." (or "the client broke it: no rep lost.")

  The minus is the true minus (S13a's SQ7), and the outcome's name is lower-cased in the sentence. Check every
  outcome × share case against the data, per *Carried over*.

## 9. The UI

Copy is drafted for the voice pass. Check every line against the engine before it ships.
- **The section,** after *Away tonight*, before the Milestone reminder: **CRANK jobs**, with a hint: "A job the crew
  finished, failed or walked out of tonight. Each name on it gets their share and their rep in the log." Then
  **Add a job**.
- **A job's card:**
  - **Job:** a select of the open threads and those closed in this session, newest first, then "Something else…",
    which shows a text field.
  - **How it ended:** a select of the outcomes.
  - **Tier:** an optional select. Beside it, the range ("Pays Ç1,000–3,000", `crankPayText`).
  - **Payout:** a whole number, shown only for a paid outcome.
  - **Crew:** a row per present line, ticked, each with a **Share** field. Under them: "Ç0 not split" when the shares
    don't add up to the payout, or nothing when they do.
  - **Remove this job.**
- **Prefill:** a payout typed, or a crew member ticked or unticked, re-splits the shares **the GM hasn't typed**, as
  Hours does for IP (`c.typed`).
- **Write the award log** refuses a job with no title or no crew. Its `why` focuses that job's field, as a line's
  does.
- **The written log** shows each name's clauses (§8). A job also shows once at the foot of the log: "Jobs: *<title>*,
  seen through, Ç2,400 (a Skilled job)." Mind the a/an: "an Expert job".
- **The sheet:** CRANK's description gains GQ72's sentence. The buttons are unchanged.
- **Phone:** the job card's fields wrap like the close-out's rows (`.co-row`) at 375px.

## 10. Worked examples, as named tests

Each fails on `main`, or the builder says why it already passes.
1. `tests/engine.test.mjs`, `"Decision N: a job seen through gives its crew their shares and +1 rep"`. A session
   with Mara, Dex and Juno present, and a job `{ title:"CRANK: Courier for a Street Gang", outcome:"done", pay:2400,
   crew: the three at 800 }`. `writeCloseOut` is ok, the log keeps the job, and `awardTotals` gives each 800 more
   Çredits.
2. `"Decision N: the gate keeps a job only with a title, an outcome and a crew on the log"`. A hostile `jobs`: null,
   a string, a job with outcome "x", a crew name not present, a share −5 or "800", a `pay` on a failed job. Nothing
   throws, and each bad part is dropped as §5 says.
3. `"Decision N: migrateTable 0.21 gives every written log jobs: []"`, and an unwritten `close` stays null.
4. `tests/rules.test.mjs`, `"Decision N: a job's rep is the book's"`: `done` is `jobDone` (+1), `walked` is
   `jobWalkedOut` (−2), and `failed` and `broken` are 0.
5. Smoke (`smoke-table-play`, or the close-out's own file):
   - **Add a job**, pick a thread, *Seen through*, payout 2400. Three shares of 800 show.
   - Untick Juno: two shares of 1,200.
   - Type Mara's share as 1,000. Dex's stays 1,200, because typing a share re-splits nothing, and "Ç200 not split"
     shows. Change the payout to 2,000: Dex's re-splits to 1,000 (untyped) and Mara's stays 1,000 (typed). Shares
     above the payout say "Ç… over the payout". Settle that copy with the voice pass.
   - **Write**. The log reads "From *CRANK: Courier for a Street Gang*, seen through: +Ç1,000 and +1 CRANK rep." for
     Mara, and one undo removes the log.
   - **Redo the close-out** shows the job as written.
   - Remove Dex from Who was there: Dex leaves the crew.
6. Smoke: a walked-out job's log says "−2 CRANK rep" with the true minus, and a failed one says "no rep lost".
7. Smoke: the sheet's CRANK tip has GQ72's sentence.

## 11. Tests beyond the examples

- **Mutation-test:**
  - the present-only crew (let an away name in, and test 2 fails);
  - the shares added into `awardTotals`;
  - Redo rebuilding the jobs (draft them empty, and test 5's Redo fails);
  - the typed share kept on a re-split.
- **Hostile files** (`hostile.test.mjs`): a table whose `close.jobs` holds markup in `title` and `name` renders as
  text on the session page and the end page.
- **The sample:** `sample-table.test` still passes, and the job's crew are that session's present names.
- **Phone:** the job card at 375px (`npm run phone-check` if it reaches the close-out, else the preview).
- **Voice:** every new string.

## 12. Steps

1. Baseline: `git submodule update --init private`, then `npm run test:fast`.
2. Write the worked examples, and show them failing.
3. Data (outcomes, the description), then the gate and `migrateTable`, then `writeCloseOut` and `awardTotals`. Run
   `npm run verify`.
4. The close-out's section, the log's clauses, Redo. Run verify, then the dev preview on *Dead Air* at desktop and
   375px, light and dark.
5. The sample, Help's line, docs, close-out. Run the full `npm run verify`.

## 13. Stop and ask

- **Stop** if:
  - Decision 205's line shape has to change for a job to work. This order keeps it;
  - writing the jobs and the lines can't be one undo;
  - a guard says the outcomes or the description need a game-data bump;
  - a reader of `close` outside the sweep's list turns up.
- **Expected, not stops:**
  - the sample's numbers moving (its test pins counts, not credits);
  - the version literals.

## 14. Close-out

The `close-the-session` skill for *Rule or shape*:
- Decision N, with its INDEX line and 205's marks.
- Table schema 0.21, with a row in `CLAUDE.md`'s sense: the `migrateTable` step.
- The app minor, with no game-data bump.
- STATE rewritten.
- The log, and a `shipped.md` row.
- The plan's S11 row: S11b built. GQ74's W added to `WISHLIST.md`.

**CHANGELOG** (drafted, GM voice, under *GM mode*; the sheet's line under *Character sheet*):
- "Close out a CRANK job: how it ended, what it paid and who was on it. The award log gives each of the crew their
  share and their rep."
- Sheet: "CRANK's tip says it: walking away from a client who broke the contract first costs no rep."

**PR title:** `feat(gm): a CRANK job paid at the close-out, its shares and its rep (S11b, Decision N)`.

**PR body:** the template's sections, plus **New strings as rendered** (every outcome, with and without a share and a
tier) and **Where the order didn't fit**.

**Review checklist:**
- §1's eight checks, run in the preview.
- Redo never pays a job twice.
- The crew is present names only, and stays so through Who was there changing.
- The gate against a hostile `jobs`.
- Every sentence the log can make, against the data.
- The voice of every string.

## 15. Handing it over

The builder and reviewer prompts are in `WORK-ORDERS.md`, with this order's path. Its own traps:
- **Keep 205's line shape.** Rep isn't a field on a line. It's read from the job.
- **The outcome ids are permanent.** Spell them once, as §8 does.
- **A share is the GM's,** once typed. Never re-split it.
- **The table moves nobody's rep or Çredits.** It writes what to enter.
- **Take the numbers at build** (decision, app, table schema) from `origin/main`, and again after any rebase.
