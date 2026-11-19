# Work order S25: CRANK (off-screen pay, rep's floor, Reputation and Burned)

**Plan:** [`../gm-mode-next.md`](../gm-mode-next.md), session S25, with **W161** folded in (Reputation and Burned as CRANK
rep, raised 2026-11-16). **Rulings:** GQ28 and F37 (Scott, 2026-11-03), and GQ7, which Scott answered "per the
Reputation Advantage in `0432`". The book: `0432` (Reputation, ~444), `0431` (Burned), `2625` (CRANK and Bank).
**Reopens:** Decision 169 (CRANK rep) and Decision 206 (the close-out's off-screen pay).
**Status:** **drafted 2026-11-18** by Claude (Opus), the conductor, at Ken's pick ("lets draft S25!"). Not approved.
GQ48–GQ53 below, each with a default; an unanswered one is answered "Default".
**Branch:** from `main`; PR to `main`. Nothing ships switched off. CRANK has been on for everyone since Decision 239.
**Runs beside:** nothing open on `main` at drafting. **S11** (the Job Generator, `2625`'s five d10 tables) is the
natural next order. It shares `2625` and nothing else, so draft it after this merges. **Say N everywhere.**

**Pre-flight** at `c204250` (`main`, after S24's #359). `npm run test:fast` green.
- **Rep is one stored number with a ledger.** `trackers.crank: { rep, ledger:[{date, amount, note}] }` (engine ~87,
  Decision 169). `crankState(ch)` (~4086) derives the tier, the next tier and `unsettled` (rep < 0, F37's stub).
  `addCrankRep` (~4096) adds any whole amount and never floors it. Readers:
  - `shared.js` ~593: the tip. Its note is the F37 playerNote while unsettled.
  - `sheet.js` ~558: Main's card.
  - `sheet.js` ~1682: the popover.
  - `sheet.js` ~1791: Trackers and its ledger.
  - `sheet.js` ~2918: the print front page.
  - Admin's correction.
  - `engine.js` ~2758: the help.
  - `engine.js` ~8737: the seat line.
- **The data** (`resources.crank`, ~288): `jobDone: 1`, `jobWalkedOut: -2`, and `flagged` / `flagNote` (F37) /
  `playerNote`. It has five tiers. Legendary has `pay.max: null` and **`offScreenMax: 15000`** (GQ28's old default).
- **Off-screen pay** (`offScreenPay(tierId)`, ~8436, Decision 206) runs from the tier's minimum to the midpoint of
  its range, or to `offScreenMax`. Readers:
  - `closeOutDraft`'s `absent[].range` (~8470).
  - The Reference's CRANK panel (`_refCrank`, ~9137, an "off-screen" column).
  - The close-out UI in `gm.js`: grep `range`, `absent`.

  `writeCloseOut` (~8500) requires a tier for every absent line.
- **The book now differs from the sheet:**
  - **Reputation** (`0432` ~444): **4 points, Max Rank 3, Universal.** "Start with additional rep on CRANK": rank 1
    starts at 5 (Competent), rank 2 at 12 (Skilled), rank 3 at 20 (Expert). "Legendary can't be bought. It's earned on
    the job." "Can't be taken with Burned."
  - **Burned** (`0431`): **1 point, Max Rank 3.** "Each rank starts you at –2 rep on CRANK. While rep is below 0 you
    are a Novice, and every payout is halved. The only way to remove this Disadvantage is to earn rep back up to 0."
    "Can't be taken with Reputation."
  - The sheet's `reputation` (data ~1734) is still the fame version: cost 4, **maxRank 4**, a neighborhood up to whole
    territories. There's no `burned`.
- **F37 against Burned.** Scott ruled "rep stops at 0". The book's Burned starts rep *below* 0. They agree if a
  *loss* never takes rep below 0, and only Burned's start can (GQ48).
- **Off-screen pay against the book.** `2625` says off-screen pay is "in the lower half of their tier's payout
  range". Scott's later ruling is "always the lowest of the range; Legendary shouldn't be done off-screen". Ruling
  first, and a `crb-catch-up.md` line for Ken's book.
- **The machinery exists:**
  - `excludes` locks a pair across Advantages and Disadvantages (`optionLock` ~6097, Decision 235's Dwarf and Giant).
  - `creationOnly` refuses the IP buy (`advantageBarred` ~3393, Long-Lived).
  - Lock goes through `Engine.buildExport(ch, { lock:true })` (`wizard.js` ~1140), which is the one place to write a
    start.
- **A computed start is a trap.** If rep were `stored + start(held traits)`, removing a paid-off Burned would raise
  rep by 2 a rank at once. So the start is written once, at lock, as a ledger line (GQ49).
- **Probes on `main`** (run 2026-11-18, `offScreenPay`, `crankState`, `addCrankRep`):
  - `offScreenPay("competent")` is `{ min:300, max:550 }`, and `"legendary"` is `{ min:10000, max:15000 }`.
  - A character at rep 1 who walks out goes to −1, reads Novice, and `unsettled` is true.

**Carried over** (S24's review):
- **The pre-flight missed an earlier voice decision and its guard** (U4's "book:"). Grep `voice.test.mjs` and the log for every
  word this order changes ("off-screen", "range", "rep", "Reputation").
- **A drafted line was false** (S24's in-fight Heal). Every sentence §9 drafts is checked against the engine before
  it ships.
- **A path went unasserted** (S24's running-fight start). Every entry point in §5 gets a test.

## 1. Goal and Done when

**Goal.**
- **For a player:** Reputation and Burned work as the book prints them. A rank of either sets the character's CRANK
  rep when they lock, and rep never falls below 0 except through Burned.
- **For a GM:** an absent character's off-screen job pays the floor of their tier, and Legendary work never happens
  off-screen.

**Done when:**
1. In the wizard, Reputation is 4 points with max rank 3, and its text is the book's. Burned is a 1-point
   Disadvantage with max rank 3. Holding either locks the other, with the existing lock message.
2. A character locked with Reputation 2 opens with rep **12** (Skilled). The ledger's first line is "Start: Reputation
   rank 2", +12.
3. A character locked with Burned 2 opens with rep **−4**, reads Novice, and the sheet says payouts are halved while
   rep is below 0.
4. Walking out at rep 1 leaves rep at **0**, not −1. At −4 (Burned), walking out leaves it at −4. A job done raises it
   either way.
5. Once a Burned character's rep reaches 0, the sheet says Burned can be removed. Removing it doesn't change rep.
6. The close-out offers an absent Competent character **Ç300**, a single figure filled in for the GM to edit. An absent
   Legendary character's line says there's no off-screen work at Legendary, with credits blank.
7. Reputation can't be bought with IP after creation.
8. F37 is closed: no "unsettled" note on rep, and the flag's three edits are done.

## 2. Tier, versions, numbers

**Rule or shape.**
- **Game data:** bump it. A cost, a max rank and a new Disadvantage all move (Decision 68).
- **App:** a minor, for a new capability. Take the next minor after `main`'s `[Unreleased]` heading, or join it if
  that's already a minor.
- **Character schema:** none. The start is an ordinary ledger line. A held Reputation rank 4 needs a landing (GQ50),
  but nothing about the save's shape moves.
- **Table schema:** none. The close-out's lines keep their shape.
- **Decisions:** **N** (off-screen pay) and **N+1** (rep's floor, and the start from Reputation and Burned).
- **Flags:** **F37 closes.** No new flag.

## 3. The decisions, drafted

```
N. **An off-screen CRANK job pays the floor of its tier's range, and Legendary work isn't done off-screen.**
     *2026-11-18 · Ken + Claude, from Scott (GQ28, 2026-11-03) · Touches: offScreenPay, offScreenMax, closeOutDraft, absent, writeCloseOut, the close-out's absent line, the Reference's CRANK panel, Legendary, 2625, GQ28, Decision 206*
     - **Decided:** `offScreenPay(tier)` is the tier's `pay.min`, one figure, and null for a tier marked `offScreen: false` (Legendary). `offScreenMax` leaves the data. The close-out fills an absent line's credits with that figure for the GM to edit; a Legendary line says there's no off-screen work and leaves credits blank. The Reference shows the floor, and "—" for Legendary.
     - **Why:** Scott: "Off-screen jobs always pay the lowest of the range. Legendary shouldn't be done off-screen." One figure is what a GM pays, and a range invites a roll nobody asked for.
     - **Rejected:** Keeping the range's lower half, as `2625` prints it: Scott's ruling is later and narrower (a `crb-catch-up.md` line asks Ken to align the book). Refusing a Legendary absent line: the character exists and was absent; the line just has no job.
     - **Replaces:** Decision 206 in part: off-screen pay is the floor, not the minimum to the midpoint, and Legendary has none.
     - **Revisit if:** the book keeps "lower half", or a GM wants off-screen Legendary work back.
     - **Built:** app X.Y.Z, data X.Y, PR #…, log 2026-11-…

N+1. **CRANK rep stops at 0, except for Burned; Reputation and Burned set a character's starting rep, written once at lock.**
     *2026-11-18 · Ken + Claude, from Scott (F37, GQ7) and `0431`/`0432` · Touches: crankState, addCrankRep, jobWalkedOut, trackers.crank, the ledger, buildExport lock, Reputation, Burned, crankStart, excludes, creationOnly, payouts halved, the crank tip, Main's CRANK card, Trackers' CRANK section, F37, GQ7, W161, Decision 169, Decision 235*
     - **Decided:** A loss never takes rep below 0, or below where it already is when that's under 0. Reputation (4 points, max 3, creation only) and Burned (1 point, max 3) are an `excludes` pair, and each carries a `crankStart` grant: Reputation's ranks start rep at 5, 12 and 20; Burned's at −2 a rank. At lock, each held one writes a ledger line, "Start: <name> rank N", and rep moves by it. Below 0 a character reads Novice and the sheet says payouts are halved; at 0 or above, a held Burned is marked paid off and can be removed without moving rep.
     - **Why:** Scott: rep stops at 0. The book: Burned is the one way below it, and earning back to 0 is the only way out. Writing the start once keeps rep an input (constraint 7) and lets Burned leave without a jump.
     - **Rejected:** A start computed from what's held: removing Burned would raise rep by 2 a rank. A clamp at 0 for everything: Burned can't exist. Removing Burned by itself at 0: the engine never edits what a player holds. Reputation bought with IP raising rep: the book says it's a record from before the story starts.
     - **Replaces:** Decision 169 in part: rep has a floor and a start. Closes F37.
     - **Revisit if:** Scott wants a walk-out below 0 to stack with Burned, or Reputation to be bought in play.
     - **Built:** as N.
```

**Supersession marks:**
- 206 → **superseded in part by N**.
- 169 → **superseded in part by N+1**.
- Both INDEX lines.
- F37 closed (its §5 row, `flagged` in the data, INDEX §2).
- GQ7 and GQ28 in `archive/gm-mode.md` §9 marked built.
- W161 to `log/wishes-granted.md`.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| **GQ48** | **The floor against Burned.** Scott's "rep stops at 0" and the book's Burned (rep below 0). How do they meet? | **A loss never takes rep below 0, nor below where it already is.** Only Burned's start goes below 0. At −4, walking out leaves −4. A job done always counts. |
| **GQ49** | **How the start is applied.** Written once at lock as a ledger line, or computed from what's held? | **Written once at lock:** "Start: Reputation rank 2", +12. Computed would make removing a paid-off Burned raise rep by 4 at once. A GM corrects anything after lock on Admin, as today. |
| **GQ50** | **Characters saved with the old Reputation** (the fame version), some at rank 4. | **Nothing converted.** A rank above 3 reads as 3, and Admin notes "Reputation's top rank is now 3". A character already locked gets no start line. The GM sets their rep on Admin if it should match. |
| **GQ51** | **The close-out's absent line.** Prefill the credits, or show the figure beside an empty field? | **Prefilled with the floor,** editable. Legendary's line reads "No off-screen work at Legendary", with credits blank. |
| **GQ52** | **"Every payout is halved"** while rep is below 0. Compute it anywhere? | **The sheet says it,** on the tip and the CRANK card, and the GM halves. The table doesn't know a player's rep, so the close-out can't. |
| **GQ53** | **Reputation after creation.** | **Creation only** (`creationOnly`, as Long-Lived). The IP buy refuses it with the existing message. Burned is a Disadvantage, so IP never buys it. |

## 5. The assumption sweep

| What | Today (where) | After |
|---|---|---|
| `offScreenPay` | min to midpoint or `offScreenMax` (~8436) | `{ min, max:min }` kept as a shape, or one number (the builder picks and says which), and null when `offScreen:false` |
| `closeOutDraft` absent | `range` (~8470) | the floor, and a `noJob` flag for Legendary |
| Close-out UI (`gm.js`) | grep `range`, `absent`, `offScreen` | credits prefilled; Legendary's line |
| `_refCrank` (~9137) | an "off-screen" range column | the floor; "—" for Legendary |
| `offScreenMax` (data ~301) | Legendary 15000 | gone; `offScreen:false` on Legendary. The unread-key guard (135) passes |
| `addCrankRep` (~4096) | adds anything | a negative amount floors at `min(rep, 0)` |
| `crankState` (~4086) | `unsettled: rep<0` | `below: rep<0` (Novice, halved), and `paidOff` when Burned is held and rep ≥ 0. `unsettled` goes, and its readers move |
| The crank tip (`shared.js` ~593) | F37's note while unsettled | "Below 0: you're a Novice and every payout is halved" while below; nothing otherwise |
| `resources.crank` flag keys | `flagged`, `flagNote`, `playerNote` | removed (F37 closes) |
| Main card, popover, Trackers, print (sheet.js ~558, ~1682, ~1791, ~2918) | rep and tier | the same, plus the halved line while below 0 and the paid-off line |
| Reputation (data ~1734) | fame text, maxRank 4 | the book's text, maxRank 3, `creationOnly`, `excludes:["burned"]`, a `crankStart` grant `byRank:[5,12,20]` |
| Burned | absent | a new Disadvantage: 1 point, max 3, a `crankStart` grant `perRank:-2`, the book's text |
| `buildExport(ch, {lock:true})` | locks | also writes each held `crankStart` as a ledger line, and moves rep. Once only: a character already locked is never written again |
| The grant renderer | rule grants | `crankStart` renders its held text ("Starts CRANK rep at 12") on the Advantage card. Grep how a new grant type reaches the cards |
| Rank above max | nothing reads a held rank over `maxRank` | Reputation's effects read `min(rank, 3)`; Admin's note (GQ50) |
| `voice.test.mjs`, the log | grep "off-screen", "range", "Reputation", "rep" | any guard on these words is updated in the open, citing N or N+1 |
| `crb-catch-up.md` | — | `2625`'s "lower half" against Scott's floor; "Legendary can't be done off-screen" |
| Hostile files | `trackers.crank` coercion (~5704) | unchanged. Add a case: a start line forged in the ledger is just a ledger line |

## 6. Read first

`CLAUDE.md` (constraint 7, the change tiers, *Flags*). SCHEMA §4: Decisions 68, 152, 169, 205, 206, 214, 235 and 239,
and F37's row. The book's `0432` ~444, `0431`'s Burned and `2625`'s *How CRANK Works* and *Reputation*. `engine.js`:
`crankState`, `addCrankRep`, `offScreenPay`, `closeOutDraft`, `writeCloseOut`, `_refCrank`, `optionLock`,
`advantageBarred`, `buildExport`. `sheet.js`'s CRANK readers (above). `gm.js`'s close-out.

## 7. Out of scope

- **The Job Generator and jobs board** (S11, next).
- **Halving payouts on the table** (GQ52).
- **Converting old Reputation ranks** (GQ50).
- **Changing what a job done or walked out on is worth** (+1 and −2 stay).
- **The book's text.** Ken's, through `crb-catch-up.md`.

## 8. The shapes

- **Data:**
  - On a tier, `offScreen: false` (Legendary). A tier without it has off-screen work.
  - Grant type `crankStart`: `{ type:"crankStart", byRank:[…] }` or `{ type:"crankStart", perRank:n }`, with a `heldText`.
  - Reputation: `creationOnly: true`, `excludes: ["burned"]`.
  - Burned: id `burned`. **The id is new, so choose it once:** ids are immutable.
- **`Engine.crankStart(ch)`** → `[{ id, name, rank, amount }]` for each held trait with a `crankStart` grant, with the rank capped at its `maxRank`.
- **Lock** (`buildExport` with `lock:true`, when the character wasn't locked before): for each entry,
  `ledger.push({ date, amount, note:"Start: <name> rank N" })` and `rep += amount`. It's idempotent: a `start:true`
  marker on the line means a second lock writes nothing. The builder says which way.
- **`addCrankRep(ch, amount, note)`**: a negative amount brings rep to `max(rep + amount, min(rep, 0))`. When the
  floor holds, the ledger line records the amount actually applied, and the note says so ("−2, stopped at 0"). A
  positive amount is unchanged.
- **`crankState(ch)`**: `{ rep, tier, next, toNext, below, paidOff }`. `below` is `rep < 0`. `paidOff` is true when Burned
  is held and `rep >= 0`.
- **`offScreenPay(tierId)`**: the floor, or null.

## 9. The UI

Copy is drafted for the voice pass. Every line is checked against the engine before it ships.
- **The wizard's Advantage and Disadvantage lists** show Reputation and Burned with the book's text, and the lock between
  them reads as today's lock (Decision 235).
- **The sheet's CRANK card and Trackers:**
  - While below 0: "Below 0: Novice, and every payout is halved."
  - When paid off: "Burned is paid off. Remove it on Admin."
- **The ledger:** the start line reads "Start: Reputation rank 2 · +12".
- **The close-out's absent line:**
  - Credits prefilled with the floor ("Ç300").
  - At Legendary: "No off-screen work at Legendary.", with credits blank.
- **The Reference's CRANK panel:** the off-screen column shows the floor, and "—" for Legendary.

## 10. Worked examples, as named tests

Each fails on `main`, or the builder says why it already passes.
1. `tests/rules.test.mjs`, `"Decision N: an off-screen job pays its tier's floor, and Legendary has none"` (`2625`'s
   table): Competent 300, Skilled 1000, Expert 4000, Legendary null.
2. `"Decision N+1: a walk-out stops at 0, and below 0 only Burned goes"`: rep 1, walk out, 0. Rep −4, walk out, −4.
   Rep −4, job done, −3.
3. `"Decision N+1: Reputation 2 starts rep at 12, written once at lock"` (`0432`): lock it, rep 12, one start line.
   A second `buildExport` lock adds nothing.
4. `"Decision N+1: Burned 2 starts rep at −4, Novice and halved"` (`0431`): `below` true, tier Novice.
5. `"Decision N+1: Burned paid off can go without moving rep"`: earn 4 to reach 0, `paidOff` true, remove Burned, rep
   still 0.
6. `"Decision N+1: Reputation and Burned lock each other"`: `optionLock` both ways.
7. `"Decision N+1: Reputation is creation only"`: the IP buy is refused.
8. `tests/engine.test.mjs`, `"Decision N: the close-out offers the floor, and no job at Legendary"`.
9. `"Decision N+1: an old rank-4 Reputation reads as rank 3 and writes nothing on open"` (GQ50).
10. Smoke: the sheet's below-0 line and paid-off line; the close-out's prefilled credits and Legendary line; the
    Reference's floor column.

## 11. Tests beyond the examples

- **Totality:** `crankStart`, `crankState` and `offScreenPay` on null, `{}`, a character with no trackers, and a
  forged ledger.
- **Mutation-test:**
  - the floor in `addCrankRep`;
  - the once-only guard at lock;
  - `offScreen:false`;
  - the `excludes` pair (drop it from the data, and example 6 fails).
- **Fixture diff** over every archetype's character: nothing moves but CRANK for one holding Reputation or Burned,
  and a character with neither is identical.
- **Voice:** every new string.

## 12. Steps

1. Baseline: `git submodule update --init private`, then `npm run test:fast`.
2. Write the worked examples, and show them failing.
3. Off-screen pay (N). Run `npm run verify`.
4. The floor, the data (Reputation, Burned, `crankStart`), lock and `crankState` (N+1). Verify.
5. The UI: sheet, wizard, close-out, Reference. Verify, then the dev preview at desktop and 375px, and print.
6. Close F37, docs, close-out. Run the full `npm run verify`.

## 13. Stop and ask

- **Stop** if:
  - any character without Reputation or Burned changes (the fixture diff);
  - the lock path isn't `buildExport` alone;
  - `excludes` can't pair an Advantage with a Disadvantage;
  - the book's numbers differ from §1 when you re-read them.
- **Expected, not stops:**
  - tests asserting `unsettled`, F37's note, the off-screen range or `offScreenMax`;
  - Reputation's old text and its rank 4;
  - the version literals.

## 14. Close-out

The `close-the-session` skill for *Rule or shape*:
- Decisions N and N+1, with their INDEX lines and supersession marks.
- F37's three edits.
- The game-data bump and the app minor.
- STATE rewritten.
- The log, and a `shipped.md` row.
- The plan's S25 row set to built.
- GQ7 and GQ28 marked built.
- W161 granted.
- `crb-catch-up.md`'s `2625` line.

**CHANGELOG** (drafted, player voice):
- "Reputation now sets your CRANK rep when you lock: 5, 12 or 20."
- "New Disadvantage: Burned. Each rank starts you 2 rep under, and you pay it back on the job."
- "Walking out on a client can't take your rep below 0."

GM voice:
- "An absent character's off-screen job pays the bottom of their tier, and Legendary work stays on-screen."

**PR title:** `feat(crank): off-screen pay at the floor, rep's floor, Reputation and Burned (S25, W161, Decisions N and N+1)`.

**PR body:** the template's sections, plus **New strings as rendered**, **Fixture diff** and **Where the order didn't
fit**.

**Review checklist:**
- §1's eight checks, run in the preview.
- The once-only lock.
- A character without either trait is untouched.
- F37's three edits.
- The book's numbers.
- The voice of every string.

## 15. Handing it over

The builder and reviewer prompts are in `WORK-ORDERS.md`, with this order's path. Its own traps:
- **Never compute the start from what's held** (GQ49). Burned's removal is the reason.
- **`burned` is a new id forever.** Spell it once, lower case.
- **The floor is `min(rep, 0)`, not 0.** A Burned character at −4 who walks out stays at −4. They don't jump to 0.
- **Two readers of `unsettled` live in the UI.** Grep it, and move both.
- **The table doesn't know a player's rep.** Don't make the close-out halve anything (GQ52).
- **Take the numbers at build** (decision, game data, app) from `origin/main`, and again after any rebase.
