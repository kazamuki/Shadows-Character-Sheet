# Work order S11a: the CRANK Job Generator

**Plan:** [`../gm-mode-next.md`](../gm-mode-next.md), session S11, split here. **S11a** is the generator. **S11b** is the
jobs board (a `JobRecord`, closing a job, the walk-out a client caused), and it stays on the plan with no order. **The
ask:** Ken, 2026-11-18: "a randomizer that rolls the various CRANK options to give a GM some options for threads they
could start if the crew wanted to do a CRANK job in a session rather than off screen". **The book:** `2625` (CRANK and
Bank), *The Job Generator* and its five d10 tables. **Reopens:** Decision 11 (the app never rolls), in part.
**Status:** **drafted 2026-11-18** by Claude (Opus), the conductor, at Ken's pick ("lets draft S11"). Not approved.
GQ54–GQ59 wait on Ken.
**Branch:** from `main`; PR to `main`. Nothing ships switched off: GM mode is on for everyone (Decision 239).
**Runs beside:** nothing open on `main` at drafting. **Say N everywhere.**

**Pre-flight** at `7b6e925` (`main`, after S25's #362). `private/` at `5541c61`, and `2625`'s mirror line says it was
pulled 2026-10-22.
- **Is this Scott's revised `2625`?** The plan asked to confirm it before the pre-flight. The 2026-10-22 mirror is the
  revision: the archived plan's §4i was written against it (the payout split, +1 for everyone who sees the job through,
  QUORUM curating, the client doing the scaling). The 2026-11-15 full refresh (`c99bb58`) didn't touch `2625`, so the
  book hasn't moved since. It's the five d10 tables with ten rows each, every row a name and a sentence or two.
- **No job code exists.** No `jobs` on a table, no `JobRecord`, no generator. `newTable` (~7108) has `threads:[]`, and
  the archived §4c sketch's `jobs:[JobRecord]` never got built.
- **Threads are the landing.** `addThread(t, { title, opened })` (~8243) makes `{ id, title, status:"open", current,
  opened, closed, notes, created, updated }`. `notes` is free text. Two callers in `gm.js`:
  - the Threads section's **New thread** (~2620), with no session;
  - a session page's thread add (~2695), which passes `opened:id`.

  `threadsHtml` (~2489) draws the Threads section on the Sessions tab, under **Next session** (the GM's prep screen,
  per its Help).
- **The CRANK data** is `resources.crank` (data ~288): `description`, `jobDone`, `jobWalkedOut`, `belowText`,
  `paidOffText`, and five `tiers` with `pay`. The Reference's CRANK panel (`_refCrank`, ~9181) is one part: the
  description and a tier table. The Reference quotes the book verbatim, checked against the mirror (Decision 207).
- **The app never rolls today.** Decision 11: "the app never rolls dice for creation pools… Players enter what they
  rolled". Its **Revisit if** is "a table plays where the dice can't be seen, remotely or through a GM mode (W29)".
  Decision 206 rejected a roll for off-screen pay, citing 11. The only randomness in `src/` is id-making
  (`engine.js` ~30, `crypto.getRandomValues`).
- **Modals:** `openModal({ title, html, foot, bind, returnTo, onClose, viaKey })` (`shared.js` ~454). Jot uses it.
- **Help** (Decision 278): the Sessions page's help is data ~5135, and its `words` include `thread`. An empty Threads
  section says "No threads yet. A thread is a question the story hasn't answered…" (data ~5695).

**Carried over** (S24's and S25's reviews):
- **The pre-flight missed an earlier voice decision and its guard** (U4's "book:"). Grep `voice.test.mjs` and the log for every
  word this order adds ("roll", "contract", "job").
- **A drafted line was false** (S24's in-fight Heal). Every sentence §9 drafts is checked against the engine before
  it ships.
- **An unremembered reader** (every sweep miss so far). Grep `resources.crank` and `_refCrank` across `src/` and `tests/`
  before changing either.

## 1. Goal and Done when

**Goal.** A GM who wants a CRANK job in tonight's session rolls one up in a few taps: the five columns, each rolled or
picked, any one rerolled, and the contract that results saved as a thread to run.

**Done when:**
1. The Sessions tab's Threads section has a **CRANK job** button beside **Add**. It opens the generator.
2. The generator shows five rows: Job Type, Client, Target, Location, Complication. Each row shows the entry's name and
   the book's line. **Roll all** fills all five, a die button on a row rerolls that row alone, and a picker on each row
   sets it by hand (1–10, the entry's name).
3. Nothing is stored while the generator is open. Closing it keeps nothing.
4. **Add as a thread** makes an open thread titled, for example, "CRANK: Courier for a Street Gang". Its notes hold the
   five lines, one per column ("Target: Unknown Package. No description. No manifest…"). It lands in Threads with its
   More open. Undo takes it back.
5. Opened from a session's page, the thread is opened in that session, as that page's own add does.
6. The Reference's CRANK panel shows the five tables, the book's words verbatim, and they're found by its search.
7. At 375px the generator fits without sideways scroll.

## 2. Tier, versions, numbers

**Rule or shape** (a player-facing behaviour someone could have chosen otherwise: the app rolling).
- **App:** a minor, for a new capability. Take the next minor after `main`'s `[Unreleased]` heading, or join it if
  that's already a minor.
- **Game data:** **none**, by Decision 68. The tables are data no character observes, as the Reference (S13a) and the
  gazetteer (S6) were. If a guard disagrees, stop and say so.
- **Character, table and pack schemas:** none. A rolled contract isn't stored. A saved one is an ordinary thread.
- **Decisions:** **N** (the generator rolls, and lands as a thread).
- **Flags:** none opened or closed.

## 3. The decision, drafted

```
N. **GM mode's CRANK Job Generator rolls the book's five d10 tables for the GM, or takes a pick, and keeps a contract only as a thread.**
     *2026-11-18 · Ken + Claude · Touches: Job Generator, resources.crank.jobs, crankJob, the Threads section, addThread, the Reference's CRANK panel, 2625, Decision 11, Decision 203, Decision 207, S11b*
     - **Decided:** The five tables (Job Type, Client, Target, Location, Complication) are data under `resources.crank.jobs`, each row the book's name and line. The Sessions tab's Threads section opens a generator that rolls any column or all five, or takes a pick from 1 to 10. Nothing is stored until the GM adds the contract as a thread: "CRANK: <Job Type> for <Client>", with the five lines as its notes. The Reference shows the tables.
     - **Why:** Ken, 2026-11-18: rolled options for a CRANK thread. `2625`: "Roll d10 on each column or choose manually… reroll anything that doesn't fit." The roll is the GM's prep, not a player's check, so it isn't what Decision 11 protects; a thread is how GM mode already follows a question from session to session.
     - **Rejected:** A `jobs` record now (the archived §4c's `JobRecord`): it's S11b's, and a thread carries a contract until a GM needs a payout or a walk-out on the record. Pick-only, honouring 11 to the letter: the ask is a randomizer, and a GM at a laptop often has no d10 to hand. Storing the last roll: nothing reads it.
     - **Replaces:** Decision 11 in part: the app rolls the GM's generator tables. A player's rolls stay physical.
     - **Revisit if:** S11b gives jobs their own record, or a GM wants a roll in front of the players.
     - **Built:** app X.Y.Z, PR #…, log 2026-11-…
```

**Supersession marks:** 11 → **superseded in part by N**, and its INDEX line. The archived plan's S11 line
(`archive/gm-mode.md` ~868) is marked split.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| **GQ54** | **Does the app roll?** Decision 11 says it never does. | **Yes, for the GM's generator only.** Every row also takes a pick, for a GM who rolls a real d10. A player's rolls stay physical. |
| **GQ55** | **Where the generator lives.** | **The Sessions tab, on a CRANK job button beside Threads' Add**, and on a session's own thread add. Not the Reference: that tab only reads. The Reference shows the tables (Done-when 6). |
| **GQ56** | **One contract or several at once.** | **One, with any row rerolled.** The book says "pick what looks interesting… reroll anything that doesn't fit". Three side by side would be fifteen rows on a phone. Roll again and add the ones you like: each add is its own thread. |
| **GQ57** | **What a saved contract is.** | **A thread.** Its title is "CRANK: <Job Type> for <Client>" and its notes are the five lines. A job record with a payout, crew and status is S11b's. |
| **GQ58** | **A tier on the contract.** The book: "The tables don't know the crew's tier, but you do", and the client does the scaling. | **None in S11a.** The GM reads the client at the crew's size. The pay ranges stay on the Reference. A tier and payout are the job record's (S11b). |
| **GQ59** | **S11b, the jobs board.** | **Kept on the plan, with no order**, and re-vetted after a GM has used S11a. The close-out already pays an absent player. The sheet's buttons already move rep. The open question from §4i, a walk-out where the client broke the contract first, waits for it. |

## 5. The assumption sweep

| What | Today (where) | After |
|---|---|---|
| `resources.crank` (data ~288) | description, job rep, two texts, tiers | adds `jobs: { text, columns:[{ id, name, rows:[{ name, text }] }] }`. The book's intro sentence and five tables, verbatim |
| The unread-key guard (Decision 135) | — | every new key is read: `text` and `rows` by the generator and the Reference, `id` by the picker's markup |
| `_refCrank` (~9181) | one part | adds five parts, one per column: a d10 / name / line table |
| The Reference's mirror check | grep `tests/` for how `gmReference` panels are compared to `private/crb` | the five tables checked word for word against `2625` |
| `Engine.crankJob(picks)` | none | new, total, pure (below). No randomness in the engine |
| The roll | none | in the UI: `crypto.getRandomValues`, as ids already do, through one helper |
| `threadsHtml` (~2489), a session page's thread add (~2695) | Add | plus **CRANK job** |
| `addThread` (~8243) | title, opened | unchanged. The generator passes `title` and `opened`, then `editThread` for `notes`, in one `tableChange` so one undo takes it back. Or `addThread` takes `notes`: the builder says which |
| Help, Sessions (data ~5135) | the thread word | a line under Threads for the generator, drafted for the voice pass. `words` gains `crankJob` if the help defines terms |
| `voice.test.mjs`, the log | grep "roll", "random", "dice" | any guard against the app rolling is updated in the open, citing N |
| `docs/SCHEMA.md` §4 | 11 says the app never rolls | 11 marked in part |

## 6. Read first

`CLAUDE.md` (constraint 5, the change tiers). SCHEMA §4: Decisions 11, 68, 135, 203, 204, 206, 207, 239 and 278. The
book's `2625`, whole. `engine.js`: `addThread`, `editThread`, `gmReference`, `_refCrank`, `crankData`. `gm.js`:
`threadsHtml`, the thread adds (~2620, ~2695), `referenceTabHtml`. `shared.js`: `openModal`.

## 7. Out of scope

- **The jobs board, a `JobRecord`, payouts, crew on a job, and the walk-out a client caused** (S11b).
- **A tier or a payout on a contract** (GQ58).
- **Sending a contract to a player.** That's the dispatch, W146.
- **Rolling anything else.** Off-screen pay stays the floor (Decision 295). Creation pools stay physical.
- **The book's text.** Ken's, through `crb-catch-up.md`.

## 8. The shapes

- **Data** (`resources.crank.jobs`):
  ```
  jobs: {
    text: "Roll d10 on each column or choose manually. …",      // the book's paragraph under *The Job Generator*
    columns: [
      { id:"type",         name:"Job Type",     rows:[{ name:"Courier", text:"Move something from one place to another. …" }, …] },
      { id:"client",       name:"Client",       rows:[…] },
      { id:"target",       name:"Target",       rows:[…] },
      { id:"location",     name:"Location",     rows:[…] },
      { id:"complication", name:"Complication", rows:[…] }
    ]
  }
  ```
  Ten rows each, in the book's order: row `i` is the d10's `i+1`. **The column ids are new and permanent.** Choose
  them once. Nothing stores them today, but the picker's markup names them.
- **`Engine.crankJob(picks)`**: `picks` is `{ type:3, client:7, … }`, each a whole number 1–10, or missing.
  - It returns `{ parts:[{ column, name, roll, entry, text }], title, notes, complete }`.
  - A missing or bad pick gives a part with `roll:null` and an empty entry.
  - `title` is "CRANK: <type> for <client>", or "CRANK job" while either is missing.
  - `notes` is the five lines joined with newlines: "Job Type: Courier. Move something…".
  - `complete` is true when all five are set.
  - It never throws on null, `{}`, strings or 0, and has no randomness.
- **The roll** (UI): `rollD(10)` in `shared.js`, built on `crypto.getRandomValues`. One helper, so a test stubs it.
- **The generator's state** lives on `S` while it's open (`S.crankJob = { type, client, … }`), and is dropped on
  close. It's never stored.

## 9. The UI

Copy is drafted for the voice pass. Every line is checked against the engine before it ships.
- **The button:** "CRANK job", a secondary button beside Threads' **Add**, and beside a session page's thread add.
- **The generator** (a modal, `openModal`):
  - **Title:** "A CRANK job".
  - **Lead:** the book's line, from the data: "Roll d10 on each column or choose manually…".
  - **Five rows,** each with:
    - the column's name;
    - a picker ("—", then "1 · Courier" … "10 · Blacksite Raid");
    - a die button ("Roll Job Type"), whose aria-label names the column;
    - the entry's line under it.
  - **Foot:** **Roll all**, **Add as a thread** (primary, enabled once all five are set), **Close**.
  - **Opening state:** all five rolled. Ken asked for a randomizer, so it opens with a contract to look at. A picker
    set to "—" clears its row.
- **After Add:** the modal closes. The thread lands at the top of Threads with its More open, and focus goes to its
  name, as **New thread** does. The notice reads "Added the thread CRANK: Courier for a Street Gang." (`TABLE_RECORDS`'
  existing line).
- **The Reference's CRANK panel:** after the tier table, five sub-tables headed with the column's name: d10, the
  entry, its line. Above them, the book's generator paragraph.

## 10. Worked examples, as named tests

Each fails on `main`, or the builder says why it already passes.
1. `tests/rules.test.mjs`, `"Decision N: the Job Generator's tables are 2625's, word for word"`: five columns of ten,
   each name and line compared to the mirror.
2. `tests/engine.test.mjs`, `"Decision N: crankJob reads a pick as the d10"`. `{ type:1, client:2, target:10, location:5,
   complication:1 }` gives the title "CRANK: Courier for a Street Gang", and notes starting "Job Type: Courier." with
   "Complication: Double-Cross." on the fifth line. `complete` is true.
3. `"Decision N: crankJob is total"`: null, `{}`, `{ type:0 }`, `{ type:11 }`, `{ type:"3" }` (the builder says whether a
   numeric string is a pick) and `{ type:2.5 }`. None throws. Bad picks are null, and the title is "CRANK job".
4. Smoke (`smoke-gm-*.test.mjs`, with `rollD` stubbed):
   - "CRANK job" opens the generator with five rows filled.
   - A row's die changes that row alone.
   - A picker sets a row.
   - "Add as a thread" makes one open thread with that title and notes, and one undo removes it.
   - From a session page, the thread's `opened` is that session.
   - Close stores nothing: the table's `updated` doesn't move.
5. Smoke: the Reference's CRANK panel has the five tables, and searching "Blacksite" finds it.

## 11. Tests beyond the examples

- **Mutation-test:**
  - the pick's 1–10 bound in `crankJob`;
  - the "nothing stored on close" path (write on open, and test 4's last check fails);
  - the single undo.
- **Architecture:** `crypto` and `Math.random` appear in `engine.js` only for ids. Grep the build test for a guard
  on randomness, and if there is one, extend it, citing N.
- **Phone:** the generator at 375px (`npm run phone-check` if it covers modals, else the preview).
- **Voice:** every new string.

## 12. Steps

1. Baseline: `git submodule update --init private`, then `npm run test:fast`.
2. Write the worked examples, and show them failing.
3. Data, then `crankJob`, then the Reference's parts. Run `npm run verify`.
4. The generator and its two buttons. Verify, then the dev preview at desktop and 375px, light and dark.
5. Help's line, docs, close-out. Run the full `npm run verify`.

## 13. Stop and ask

- **Stop** if:
  - the mirror's `2625` tables aren't five columns of ten;
  - a guard forbids randomness in `src/ui/` for a reason the ledger gives;
  - making a thread and its notes can't be one undo;
  - Decision 68 or a guard says GM-only data needs a game-data bump.
- **Expected, not stops:**
  - tests asserting `_refCrank` has one part;
  - the version literals.

## 14. Close-out

The `close-the-session` skill for *Rule or shape*:
- Decision N, with its INDEX line and 11's marks.
- The app minor, with no game-data bump.
- STATE rewritten.
- The log, and a `shipped.md` row.
- The plan's S11 row split: S11a built, S11b "No order yet".
- Scott's to-do line for `2625` ticked as confirmed.

**CHANGELOG** (drafted, GM voice):
- "GM mode: roll a CRANK job. The book's five tables, rolled or picked, and saved as a thread."
- "The Reference's CRANK panel has the Job Generator's tables."

**PR title:** `feat(gm): the CRANK Job Generator, rolled or picked and saved as a thread (S11a, Decision N)`.

**PR body:** the template's sections, plus **New strings as rendered** and **Where the order didn't fit**.

**Review checklist:**
- §1's seven checks, run in the preview.
- Nothing stored on close.
- One undo.
- The tables word for word.
- The roll lives in the UI, with the engine pure.
- The voice of every string.

## 15. Handing it over

The builder and reviewer prompts are in `WORK-ORDERS.md`, with this order's path. Its own traps:
- **The engine never rolls.** `crankJob` takes picks. The die is a UI helper, stubbed in tests.
- **Don't store the roll.** No `jobs` array and no table schema. A contract exists only once it's a thread.
- **The column ids are permanent.** Spell them once, lower case.
- **Quote the book exactly,** curly apostrophes and dashes included. The mirror check compares characters.
- **Take the numbers at build** (decision, app) from `origin/main`, and again after any rebase.
