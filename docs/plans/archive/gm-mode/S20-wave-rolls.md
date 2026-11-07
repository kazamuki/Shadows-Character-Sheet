# Work order S20: Wave Initiative by one roll a side

**Plan:** [`../gm-mode.md`](../gm-mode.md), the *Still to build* row "S20", and §9's GQ30,
answered by Deighton (`reference/rulings-2026-10-10.md`, Q34) with Ken's follow-up.
**Status:** **Drafted 2026-10-31** by Claude (Opus), the S19 reviewer, after #278 (S19,
Decision 259) and #279 (the launch, Decision 260) merged. Ken picked it as the next order
(2026-10-31, through the conductor).
**Approved by Ken 2026-10-31** (in the conductor session), as Rule or shape, one decision, table schema 0.19, app 0.58.0, no `private/` commit.
**SQ1–SQ5 answered by Ken 2026-10-31: every default.** He picked SQ1 (*Before acting, or at Reset*), SQ2 (*Order added, no row field*) and SQ4 (*Seed from the old best*) by name, and SQ3 and SQ5 as one pair (*Both defaults*).
**Branch:** from `main` at `9db5593` or later, PR to `main`. **GM mode is launched (260):
nothing is switched off.** This ships visible, with a `CHANGELOG.md` line and an app bump.
**No `private/` commit.**
**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md).
The conductor (Opus) starts **S20 build** (Sonnet), then a fresh **S20 review** (Opus)
once the PR is open. Builder and reviewer message each other directly. Anything for Ken
goes to the conductor. §15 is the hand-over.
**Runs alone.** It touches:
- `engine.js`: the sides' gate, `_encOrder`, one new writer, `encounterView`'s sides, the
  0.19 migration step;
- `gm.js`: a side's heading, a row's Combat Sense field in waves, the Reset screen, the tip,
  one change handler;
- `tools/sample-table.mjs` and `samples/` (rebuilt);
- the ledger, INDEX, the plan, STATE, the log, `CHANGELOG.md`.

No data change, no CSS beyond what the side's field needs (it reuses `.enc-num`), no
`index.html` change.

**Tier: Rule or shape.** How a wave's order is decided is a rule, and a side gains a stored
field. One decision, **N**. It supersedes **210 in part** and cites 189 and 253.

**Carried over from S19's review** (#278: one review, three fix rounds; Ken's answers A–D in
#278's comments, issuecomment-6545659332 and -6546294271). Each item is marked as the order's
or the build's:

- **The order's: a layer it didn't list.** F and J over an open ⋮ menu opened a box over it.
  **Here:** §9's *Where things land* has a row for every state an encounter can be in when a
  side's roll is typed: planned, running before anyone acts, mid-round, at the Reset, ended,
  and with More open on the side.
- **The order's: a test that skipped screens §10 named.** K2 left out the wizard and a locked
  sheet. **Here:** every example in §10 names the screen it runs on, and W8–W10 run on the
  real encounter page through `smokekit.mjs`, not a stub.
- **The order's: a shared element's readers on the player's side.** The What's new fix
  reached the live sheet through the shared `#hdrmenu`, and forced a patch bump the order said
  wouldn't happen. **Here:** §5's last rows sweep the shared CSS classes, `TIPS`, and the
  engine readers for anything outside `gm.js`. None reaches the player's sheet (grep in §5),
  and the app bump is planned, not a surprise.
- **The build's: the mutation run was long.** Running every mutant in the foreground blocked
  the builder for minutes. **Here:** §12's step 6 runs the mutants **in the background**
  (`run_in_background`), each against `npm run test:fast` plus the one smoke file that
  catches it, while the docs step goes ahead.
- **What worked:** every test named its mutant; the voice table went to the conductor in the
  reviewer's first message; the browser numbers were all in the PR. Keep all three.

**Pre-flight** (`docs/WORK-ORDERS.md`, *The pre-flight*), against `main` at **`9db5593`**,
2026-10-31. The functions below were opened and read. Line numbers are `9db5593`'s. The
probes were run in Node through `tests/harness.mjs`'s `loadEngine`, by a scratch script that
isn't committed.

- **Today a side has no roll.** A side is `{ id, name }` (`_coerceSides`, `engine.js:8195`;
  `addEncounter` `:8396`; `addSide` `:8423`). In waves, `_encOrder` (`:8475`) places each side
  by **the best `order` among its rows**, leaving out a row that is Out or Goes last unless it
  has acted this round (210's SQ8). Within a side, rows sort by their own `order`.
- **Probe P1** (two PCs on the crew, 14 and 8; T16 and TNone on the other side; waves):
  order **T16, TNone, PC14, PC8**; sides `[{ best:16 }, { best:14 }]`.
- **Probe P2:** the stored side is `{"id":"crew","name":""}`: no roll.
- **Probe P3:** `Engine.setSideRoll` is `undefined`.
- **Probe P4:** PC8's own result raised to 20 puts the crew first, **PC8, PC14, T16, TNone**:
  one row's roll moves its whole side. That is what Q34 says doesn't happen.
- **Probe P5–P6:** started, one row acted, the turn on TNone. Editing PC14 to 19 mid-round
  re-sorts the sides at once (**PC14, PC8, T16, TNone**) while the turn stays on TNone. The
  turn follows who has acted (189), so nobody is skipped, but the order shown jumps mid-wave.
- **The order is read in four places**, all through `_encOrder`: `_pick` (`:8646`, used by
  `startEncounter`, `nextTurn`, `removeParticipant`, `setOpening`, `applyEncounterReset`),
  `resolveEncounterReset` (`:8805`, the Reset screen's row order) and `encounterView`
  (`:9240`). Nothing else reads `best` but `encSideHtml` (`gm.js:3192`) and tests.
- **The UI:** `encSideHtml` (`gm.js:3183–3194`) draws the heading, **Best N** and *Tied:
  reroll*. `encRowHtml` draws every row's **Combat Sense** field in both modes (`:3029`); its
  change goes through the delegated handler (`:3484`, `row("eorder", …)`). `TIPS.wave`
  (`:2759`) says "Everyone rolls Combat Sense". The Reset screen (`encResetHtml`, `:3042`)
  replaces the sides while it's up, so nothing on it shows the order.
- **The gate:** `migrateTable`'s encounter gate (`:8334`) calls `_coerceSides`; the version
  steps run first (`:6094–6182`), the last is 0.18. `TABLE_SCHEMA_VERSION` is `"0.18"`
  (`:6060`). **A table saved under an older schema loads with an empty trail** (`:6225`,
  Decision 212), so the bump empties every saved table's Activity once. That is 212's rule,
  not this order's, and it has happened at every table bump.
- **The sample:** *Dead Air* has two wave encounters, *Wharf 17* and *Pier 9*, **both ended**
  (`samples/dead-air.shadows-table.json`; `tools/sample-table.mjs:597, 627`).
  `tools/sample-table.mjs:736` writes `tableSchemaVersion: "0.18"` as a literal, and
  `tests/sample-table.test.mjs:33` checks the gate keeps the sample exactly.
- **Prototype.** `_coerceSides` gained `roll`, `_encOrder` read it, and rows within a side
  went in the order added. With the table schema left at 0.18, **13 tests fail**: 9 in
  `engine.test.mjs` (210's), 3 in `smoke-table-play.test.mjs` (210's), and the sample's
  exact-gate test. With the bump to 0.19, **26 more** fail, every one a `"0.18"` literal.
  §13 lists them all.
- **The ledger**, searched by name in *Touches* and text for: `Wave Initiative`, `waves`,
  `sides`, `side`, `Combat Sense`, `_encOrder`, `order`, `ties`, `reroll`, `Goes last`,
  `Reset`, `GQ30`, `0530`, `Order of Engagement`. The hits that govern this:
  - **210** (Wave Initiative): **superseded in part.** Its *Revisit if* ("GQ30 says the book
    orders sides another way") has happened.
  - **189** (the round, one at a time): cited, unchanged. One at a time still orders rows by
    their own Combat Sense, ties flagged on rows. 189 already carries 210's mark; it needs no
    new one.
  - **253** (Surprise, Ambush, Delay): cited, **not** superseded. Its *Revisit if* names
    "GQ30 reorders a wave", but the opening never reads a side's place: `_ambushed`
    (`:8642`) reads a row's side, not the order. An Ambush's defenders still have no turn in
    round 1, whichever side rolled higher.
  - **212** (the table's trail): cited for the emptied trail above.
  - **174** (`ally`): unchanged.

  No other decision orders sides. `crb-catch-up.md:149` is the CRB's own to-do (Ken's
  document), not this order's.

## 1. Goal

A GM running a fight in waves does what Deighton does at the table: whoever on each side is
closest to the danger rolls Combat Sense, the GM types one number per side, and the higher
side goes first, its people in whatever order they work out; then the other side. When the
fight changes, the GM rolls again at the Reset. One at a time is untouched.

**Done when:**
- In waves, each side's heading has a **Combat Sense** field, and the sides go highest first
  (W1). Rows have no Combat Sense field in waves (W8).
- A row's own result doesn't move its side, nor its place within the side (W2).
- Equal rolls flag both headings *Tied: reroll*, and no row (W3).
- A side with no roll goes after those with one, the crew first among them (W4).
- A roll can be typed while planned, at the Reset, and in a round before anyone has acted;
  mid-round the field is text and the engine refuses, writing nothing (W5, W9).
- A fight saved before this opens in the order it had (W7).
- One at a time behaves exactly as before (every 189 test passes unchanged).

## 2. Tier, versions, numbers

- **Tier:** Rule or shape.
- **App:** **0.57.0 → 0.58.0** (minor), under SQ5's default: a GM does something new, one
  roll a side. One `CHANGELOG.md` line under `## [Unreleased] — app 0.58.0` (§9), then
  `npm run changelog`. `npm run bump -- 0.58.0` moves every literal.
- **Table schema:** **0.18 → 0.19**: a side gains `roll`. A `migrateTable()` step in the same
  commit (§8).
- **Game data, character schema, pack schema, ruleset:** unchanged.
- **`private/`:** untouched.
- **Decision:** the next free number, **N** (the ledger ends at 260 on `9db5593`).
- **Questions:** GQ30 closes (§9 of the plan): answered by Q34, built here.
- **Wishes:** none taken up or set aside.

## 3. The decision, drafted

Paste it after the last decision, under INDEX §3's **GM mode** heading, and fill in **Built**.
Under 350 words, Touches included (`wc -w`). It's worded for the defaults; a different SQ
answer rewords it.

```
N. **In Wave Initiative each side rolls Combat Sense once and the higher roll's side goes first; a side rolls again only before anyone acts in a round.**
     *2026-10-XX · Ken + Claude · Touches: Wave Initiative, encounter sides, side roll, setSideRoll, _encOrder, encounterView sides, Best, Tied: reroll, Combat Sense, row order, Goes last, Out, Reset, TIPS.wave, table schema 0.19, migrateTable, Decision 189, Decision 210, Decision 253, GQ30*
     - **Decided:** In waves a side has one Combat Sense result, `roll` (a whole number or null), typed on its heading: the roll of whoever is closest to the danger. Sides go highest roll first, a side with none after, in list order; equal rolls flag both headings for a reroll. A row's own result isn't read or shown in waves: within a side, rows go in the order added, Goes last at the end. A roll changes while planned, at the Reset, or before anyone has acted in the round; mid-round it's refused. One at a time is unchanged. Table schema 0.19: a wave fight not ended takes each side's old best as its roll.
     - **Why:** Deighton (GQ30, Q34): one roll a side, the higher side first, its players in any order, then it flips; a roll made during a wave leads the next one "when the turn resets". Whether to roll again "depends" (Ken), so it's the GM's call each Reset.
     - **Rejected:**
       - The best of everyone's result (210): one roll a side is the book's way.
       - A roll that applies mid-round: it can split a wave that has started.
       - A roll held until the Reset: a second number to store and explain.
       - Recording who rolled: nothing reads it.
       - Converting nothing: a saved fight would reorder mid-round.
     - **Replaces:** Decision 210 in part: a side's place is its own roll, not its rows' best; rows' results aren't read in waves, so SQ8's Out and Goes last rule goes.
     - **Revisit if:** a GM needs a side to reroll mid-round, the CRB's Order of Engagement words it otherwise, or Combat Paralysis should go after every side.
     - **Built:** app 0.58.0; table schema 0.19; PR #…; log 2026-10-XX (S20).
```

**Supersession marks** (`CLAUDE.md`, *Decisions*):
- 210: `→ **Superseded in part by Decision N**` — in waves a side's place is its own roll,
  not its rows' best; a row's result isn't read in waves.
- INDEX §3's 210 line: `→ **superseded in part by N**` (not struck through).
- N's **Replaces** says so (drafted above).

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **When a side's roll can change.** Deighton: a roll made during a wave "will lead the next wave when the turn resets". Default: **while planned, at the Reset, and in a round before anyone has acted**; mid-round the field shows the number as text, and the engine refuses. A typo found mid-round waits for the Reset. Or **any time, applied at once**, as a row's result is today (210): with three sides it can put an untouched side ahead of one halfway through its wave (probe P6 shows the jump). Or **any time, held until the Reset**: a second stored number, and a field that doesn't do what it shows. | **Before anyone acts, or at the Reset** | Default (Ken, 2026-10-31) |
| SQ2 | **The order within a side.** Deighton: the side's players act "in whatever order" they work out. Default: **in the order added**, Goes last at the end of its side; the GM taps whoever goes (as 210), and Next walks the rest. Rows have no Combat Sense field in waves. Or **by each row's own result** where it has one, as today, keeping the row's field in waves? That shows a box per row the ruling says nobody rolls. | **Order added; no row field in waves** | Default (Ken, 2026-10-31) |
| SQ3 | **Who rolled.** Default: **the number alone**. Or a **Rolled by** select on each side naming the row closest to the danger, shown but never read? | **The number alone** | Default (Ken, 2026-10-31) |
| SQ4 | **A fight saved before this.** Default: **a wave encounter that hasn't ended takes each side's old best as its roll**, worked out as 210 did, so a fight saved mid-round opens in the order it had. An ended one, and every one-at-a-time encounter, gets none. Or **convert nothing** (every migration since 0.8 has said so, 203): every side starts with no roll, so a wave fight saved mid-round reorders to the crew first on load. | **Seed open wave fights from the old best** | Default (Ken, 2026-10-31) |
| SQ5 | **The bump.** Default: **minor, 0.58.0**: a GM rolls once a side, which is new. Or **patch, 0.57.1**, as a fix to how waves already work? | **Minor** | Default (Ken, 2026-10-31) |

## 5. The assumption sweep

Every reader was found by grep on `9db5593`. The last column answers the three questions for
each row: which guards read it, where it renders, and what text points at it.

| What changes | Today, where | After | Readers and twins |
|---|---|---|---|
| A side's shape | `{ id, name }`: `_coerceSides` `engine.js:8195`, `addEncounter` `:8396`, `addSide` `:8423` | `{ id, name, roll }`, `roll` a safe integer or null (`_int`, `:5800`), the crew's included | `renameSide` `:8427` and `removeSide` `:8439` copy the list (a removed side's roll goes with it); `_sideList` `:8206` (every engine reader); the gate `:8334`; `hostile.test.mjs:990` (a hostile side); SCHEMA §3 `:1209` |
| How sides are placed in waves | `_encOrder` `:8475–8503`: the best row `order`, skipping Out and Goes last unless acted | The side's `roll`; null after, in list order; the comment rewritten | `_pick` `:8646` → `startEncounter` `:8703`, `nextTurn` `:8717`, `setTurn` `:8729`, `removeParticipant` `:8648`, `setOpening` `:8745`, `applyEncounterReset` `:8836`; `resolveEncounterReset` `:8805`; `encounterView` `:9240` |
| Rows within a side, in waves | Sorted by own `order` (`:8489`) | Goes last at the end, else the order added | `_pick` (Next's order); 210's tests at `engine.test.mjs:6793, 6807, 6850` (the last two pass under the prototype); one at a time's key unchanged |
| `encounterView(...).sides[i]` | `{ id, title, best, tied, rowIds }` | `{ id, title, roll, tied, open, rowIds }`; `best` goes; `open` is whether the roll can change now (SQ1) | `encSideHtml` `gm.js:3192` (the only UI reader of `best`); tests `engine.test.mjs:6757`, `smoke-table-play.test.mjs:1512` |
| A new writer | none (P3) | `setSideRoll(t, encId, sideId, n)` | Exported beside `renameSide` (`:9361`); the UI's change handler beside `esidename` (`gm.js:3488`) |
| A row's Combat Sense field | Drawn in both modes, `gm.js:3029` | One at a time only | `data-eorder`'s handler `:3484` (unchanged); `orderOf` in `smoke-table-play.test.mjs:1495` (used by the 210 smoke tests, which change) |
| The side heading's **Best N** | `gm.js:3192` | A **Combat Sense** field (`.enc-num`), or the number as text when it can't change, or nothing when ended with none | `.enc-num` `shadows.css:1366–1367` (the field fits as the row's does); `.enc-side-head` `:1379` wraps |
| The Reset screen | `encResetHtml` `gm.js:3042`: rows only | In waves, each side's Combat Sense field under a short heading, before the rows (§9) | `smoke-table-play`'s Reset tests (grep `Reset: round`); the Reset's focus on its first field |
| `TIPS.wave` | `gm.js:2759`: "Everyone rolls Combat Sense…" | Q34's way (✎, §9) | `smoke-table-play.test.mjs:1517` pins "The side holding the best result acts first" |
| Table schema | `"0.18"` `engine.js:6060`; the steps to 0.18 `:6094–6182` | `"0.19"` and a step (§8) | 26 literals (§13); STATE's versions line; `tools/sample-table.mjs:736`; `docs.test`'s STATE check (test 70) |
| The sample | Two ended wave fights with no rolls (`tools/sample-table.mjs:597, 627`) | Each side of those two has a roll (§8); every other side `roll: null`; rebuilt | `tests/sample-table.test.mjs:33, 44` |
| Text that points at the old rule | — | Rewritten or marked | `engine.js:8469–8474` (the comment); `gm.js:3183` (the heading's comment); SCHEMA 210 (marked); INDEX 210 (marked); `gm-mode.md:560` (S10d's row: history, unchanged) and `:958` (GQ30: closed, §14); `S10d-sides.md` (history, unchanged); `CHANGELOG.md`'s old lines (history, unchanged) |
| **Player's side** (S19's lesson) | — | Nothing | `grep -rn "encounterView\|_encOrder\|sideTitle\|setSideRoll" src/ui/` hits `gm.js` only. `.enc-num`, `.enc-tied`, `.enc-side-head` are read only by `gm.js` (grep over `src/ui/*.js` without `gm.js`: none). `TIPS.wave` is registered in `gm.js`. No shared menu or modal is touched |

## 6. Read first

- `CLAUDE.md`: constraints 7 (store inputs: a roll is an input), 8 (the engine is total), 10
  (a table file is untrusted). *Versions* (table schema and app). *Decisions* (superseding
  in part).
- `docs/SCHEMA.md` §3, the table file's `encounters` shape (`:1192–1245`); §4: 189, 210, 212,
  253.
- `docs/reference/rulings-2026-10-10.md:143–145` (Q34), and `private/crb/0530_Combat_Encounters.md`
  *Engagement* (`:120–135`).
- `engine.js`: `_coerceSides`, `_encOrder`, `_pick`, `setOpening` (the "nobody has acted, so
  re-pick the turn" pattern to copy), `applyEncounterReset`, `encounterView`, the
  `migrateTable` steps.
- `gm.js`: `encSideHtml`, `encRowHtml`, `encResetHtml`, `encPageHtml`, the encounter's
  change handler (`main.onchange`, `:3480–3495`).
- `tests/engine.test.mjs` from `:6688` (`waveTable`), `tests/smoke-table-play.test.mjs` from
  `:1480` (`waveApp`, `orderOf`).

## 7. Out of scope

- **One at a time.** No change to 189's order, ties or fields.
- **Combat Paralysis ("always go last") in waves.** A Goes last row stays last of its side,
  as 210 has it. Whether it should go after every side is a question for Deighton, not this
  order. N's *Revisit if* names it.
- **Rolling dice.** The app never rolls (189, 253).
- **The CRB text** (`crb-catch-up.md:149`). Ken writes it.
- **Who rolled** (under SQ3's default).
- **The emptied trail on load** (212). Not this order's to change.

## 8. The shapes

**A side** (SCHEMA §3, `encounters[].sides[]`):

```
sides: [ { id: "crew", name: "", roll: null },        // 0.19 (Decision N): roll, the side's Combat Sense result in waves; a safe integer or null; anything else is null
         { id: "SD-XXXXXXXX", name: "", roll: 14 } ]
```

The gate reads `roll` with `_int` for every side, **the crew's too** (today the crew's entry in
the file is skipped and rebuilt, so its `roll` must be read before that). Negative and zero
are kept, as a row's `order` is.

**The writer:**

```
setSideRoll(t, encId, sideId, n) → { ok:true } | { ok:false, why }
```
- `n`: a number or numeric string → `_int`; `null`, `""` or anything `_int` refuses → `null`
  (clears it).
- Refuses, writing nothing (no stamp): no such encounter, an ended one (`_live`'s whys), no
  such side ("No such side."), and **mid-round**: running, `turn!==null` and `acted` not
  empty → **"Roll again at the Reset."** ✎ (SQ1).
- Running with nobody acted (round 1 or just after a Reset): writes, then **re-picks the
  turn** with `_pick`, as `setOpening` does (`:8764–8765`), so the first side really goes
  first.
- At the Reset (`turn===null`): writes; `applyEncounterReset` picks the next round's first.
- Stamps the table and the encounter (`_tableStamp(t, e)`).

**`_encOrder`, in waves:** a side's place is its `roll`, highest first; null after those with
one, in list order; ties `tied` on both. Within a side: Goes last at the end, else the order
added. **The acted set no longer matters to a side's place**, so the SQ8 clause and its
`acted` read go. One at a time: unchanged, byte for byte.

**`encounterView(...).sides[i]`:** `{ id, title, roll, tied, open, rowIds }`. `open` is
`status!=="ended" && !(status==="running" && turn!==null && acted.length)`: the same rule as
the writer, written once in the engine and read by the UI.

**`migrateTable`, schema 0.19** (a step after 0.18's, in the same style):

```
//   Schema 0.19 (Decision N): a side keeps its Combat Sense roll. A wave fight not ended takes each side's best
//   as 210 read it, so a fight saved mid-round opens in the order it had; everything else starts with none.
```

- For an encounter with `by==="wave"` and `status!=="ended"`: each side's `roll` = the best
  `order` among its rows that aren't Out or Goes last, or that have acted (210's rule, the
  pre-flight's P1). Computed **from gated values**: run it after the encounter gate has
  typed rows, sides and `acted`, or type each value it reads with the gate's own helpers.
  Never from raw file values.
- Every other side: `roll: null` (the gate's default).
- Total on a hostile file (constraint 8): rows not an array, `order` a string, `acted` junk,
  sides missing. Opening the same old table twice gives the same file.
- Under SQ4's alternative, the step only stamps: no seed.

**`tools/sample-table.mjs`:** `tableSchemaVersion: "0.19"`; every side written with `roll`.
*Wharf 17*: the crew 15, the Ports 18 (the Listener's 18 led). *Pier 9*: the crew 16, the
Devils 6, Eclipse 13, Volkov 15. Any numbers will do; these are each side's old best, so the
fights read as they did. Then `node tools/sample-table.mjs` rebuilds `samples/`.

## 9. The UI

**On the encounter page, in waves** (`encSideHtml`):
- The heading: the side's title, then a **Combat Sense** field (`.enc-num`, `type=number`,
  `inputmode=numeric`, the same markup as the row's), *Tied: reroll* when tied, then More.
- When the roll can't change (`open` false, mid-round): **Combat Sense 14** as text, or
  **Combat Sense —** with none.
- Ended: **Combat Sense 14** as text, or nothing when none.
- Rows: **no Combat Sense field** in waves (SQ2). One at a time keeps it.
- A change saves at once (`change`, as the row's field does), with the encounter re-drawn and
  **focus kept on that side's field**, which may now be in another place on the page.

**On the Reset screen, in waves** (`encResetHtml`): before the rows, a section headed
**Next round** ✎ with one line, **Roll Combat Sense again if the fight has changed.** ✎, and
each side's Combat Sense field, labelled with the side's title. The fields hold this round's
rolls. A change saves at once and re-sorts nothing visible (the sides aren't drawn here). One
at a time: no section.

**The tip** (`TIPS.wave`) ✎:
> Whoever on each side is closest to the danger rolls Combat Sense. The higher roll's side
> acts first, everyone on it, in any order; then the next side. Roll again at the Reset if
> the fight has changed. The book runs a round "as individuals or as sides, in waves".

**The refusal** ✎: "Roll again at the Reset." (Only reachable by a stale field; the UI draws
text mid-round.)

**The changelog line** ✎, under `## [Unreleased] — app 0.58.0`:
> In Wave Initiative each side rolls Combat Sense once, and the higher roll goes first. Roll
> again at the Reset when the fight changes.

**Where things land** (S19's lesson: every state, with focus):

| State | The side's field | A change does | Focus after |
|---|---|---|---|
| Planned | Field | Writes; the sides re-sort | The same side's field |
| Running, nobody acted this round | Field | Writes; re-sorts; **the turn re-picks** | The same side's field (the turn moves, focus doesn't) |
| Running, someone acted | Text | — (the engine refuses a stale field: the toast says why, nothing written) | Unchanged |
| At the Reset | Field on the Reset screen | Writes; the next round's first is picked by Apply | The same field |
| Ended | Text, or nothing | — | — |
| More open on the side | Field (in the heading, not in More) | Writes; More stays open (`S.encMore`) | The same side's field |
| Switched to waves mid-round | Text (someone acted) | — | — |
| One at a time | No side field; rows' fields | As today | As today |

## 10. Worked examples, as named tests

The builder writes these first and shows each failing on `main` (every one does: P3, no
`setSideRoll`, and P2, no `roll`). Each names the screen it runs on and its mutant.

Engine (`tests/engine.test.mjs`, beside 210's, reusing `waveTable`):

- **W1** `N: in waves each side's own roll orders the sides, not its rows' results` — the
  crew 12, the other 9: **PC14, PC8, T16, TNone** (P1 was T16 first). The other 13: **T16,
  TNone, PC14, PC8**. *Mutant:* `_encOrder` reads the rows' best → fails on the first.
- **W2** `N: within a side rows go in the order added, Goes last at the end; a row's own result is not read in waves` —
  PC8 to 20: still **PC14, PC8** within the crew (P4 put PC8 first). PC14 Goes last: **PC8,
  PC14**. Back to one at a time: PC8 first (20). *Mutant:* the within-side key keeps `order`.
- **W3** `N: equal side rolls flag both sides, never a row` — 14 and 14: `sides[].tied`
  `[true, true]`, no row `ties`. *Mutant:* `tied` false.
- **W4** `N: a side with no roll goes after those with one, in list order; none anywhere is list order, the crew first` —
  three sides, the third 10, others null: third, crew, other. *Mutant:* null sorts first.
- **W5** `N: a side's roll changes before anyone acts and at the Reset; mid-round it is refused and writes nothing` —
  Start (crew first on 12 vs 9); other to 13 before anyone acts → `ok`, the turn is now T16.
  Next; other to 20 → `{ ok:false, why:"Roll again at the Reset." }`, the table
  byte-identical (`JSON.stringify` before and after, stamps included). Finish the round; at
  the Reset, the crew to 30 → `ok`; Apply → round 2's turn is PC14. *Mutants:* no mid-round
  refusal; no re-pick; refusal at the Reset.
- **W6** `N: setSideRoll refuses a bad side and an ended encounter, and reads a non-number as none` —
  `"SD-NOPE0000"` → "No such side."; ended → `_live`'s why; `"14"` → 14; `"x"`, `{}`, `1.5`,
  `NaN` → null.
- **W7** `N: a 0.18 table: an open wave fight takes each side's old best; an ended or one-at-a-time one gets none; it opens the same twice` —
  build P1's fight, start it, one row acts; stamp `"0.18"`, delete every `roll`. After
  `migrateTable`: rolls `[14, 16]`, `_pick` and the order unchanged from before; an ended wave
  copy and a person copy: all null; `migrateTable` twice equal. *Mutants:* seed on ended; seed
  on person; no seed.

Smoke (`tests/smoke-table-play.test.mjs`, beside 210's, on the real encounter page through
`waveApp`):

- **W8** `N: in waves a side's heading has Combat Sense and its rows don't; typing a roll re-sorts the headings and keeps focus on that field` —
  headings `["The crew", "The other side"]` with nothing typed; the other side 16 → `["The
  other side", "The crew"]`, `activeElement` is that side's field, no `[data-eorder]` in
  `main`; One at a time → `[data-eorder]` is back. *Mutant:* re-render without restoring
  focus.
- **W9** `N: mid-round a side's Combat Sense is text, and at the Reset the next round's rolls are fields` —
  Start, Next: the heading reads `Combat Sense 16`, no field. Run to the Reset: **Next
  round** with two fields; change one; Apply; round 2's first row is the higher side's.
  *Mutant:* `open` ignores `acted`.
- **W10** `N: the Wave Initiative tip says one roll a side` — the tip's text matches
  `/closest to the danger/`. (Pins §9's wording after the voice pass, not before.)

## 11. Tests beyond the examples

- **Hostile** (`tests/hostile.test.mjs:990`'s test, extended): a side's `roll` as `"14"`,
  `-3`, `1e309`, `"1e3"`, `{}`, `[]`, `true` → 14, -3, null, null, null, null, null. The crew's
  `roll` in the file is read. A hostile file with `by:"wave"`, rows junk, `acted` a string:
  the 0.19 step doesn't throw.
- **Totality:** `encounterView` on every encounter in the sample and on W7's hostile copies
  returns `sides` with `roll` a number or null.
- **Undo:** a side's roll typed, then Undo, restores the old roll and the old turn (one entry,
  the generic diff; `tableChange` records it).
- **The sample:** `sample-table.test.mjs` passes with the rebuilt file; *Pier 9*'s headings
  read in its old order.
- **Mutation-test** every guard named in §10, **in the background** (§12 step 6). The PR's
  table names each mutant and what caught it.

## 12. Steps

`git submodule update --init private`, then `npm run test:fast` (a fresh branch). **Commit at
the end of each step.**

1. Take N: the lowest free on `origin/main`. Search the ledger again for §5's names.
2. **The tests first:** W1–W10 and §11's hostile cases. Show them failing on `main`.
3. **The engine:** the side's `roll` in `_coerceSides`, `addEncounter`, `addSide`;
   `setSideRoll`; `_encOrder`; `encounterView`'s sides; the 0.19 step and
   `TABLE_SCHEMA_VERSION`. W1–W7. Then the 26 literals (§13).
4. **The UI:** the heading's field, the rows' field in waves, the Reset screen's section, the
   tip, the handler with focus kept. W8–W10, then 210's smoke tests rewritten (§13).
5. **The sample:** `tools/sample-table.mjs`, rebuilt.
6. **Mutants, in the background.** Commit first. Start the mutation run with
   `run_in_background` (one mutant at a time: copy the file aside, edit, run `npm run
   test:fast` plus the one smoke file that catches it, copy back, **never `git checkout`**),
   and go on to step 7 while it runs. Put the table in the PR when it finishes.
7. **In the browser** (`shadows-dev-preview`, the sample table, then a new wave fight).
   **Report every number; a missing one is a should-fix.**
   - A two-side fight: type both rolls, Start, Next through a wave, try the field mid-round
     (it's text), reach the Reset, change a roll, Apply: who goes first.
   - *Pier 9* (ended, four sides): the headings' order and their text.
   - At 390 and 1300: the heading with its field, More and *Tied: reroll* doesn't overflow
     (`scrollWidth === clientWidth`, no element in `main` past the right edge).
   - `npm run phone-check`: the frame fixture still `no difference`.
8. **The docs** (§14), `npm run bump -- 0.58.0`, the `CHANGELOG.md` line, `npm run changelog`.

## 13. Stop and ask

- N is taken, or the ledger search finds a decision about wave order that the pre-flight
  doesn't name.
- Any 189 test (one at a time) fails.
- `_pick`'s order changes for an encounter in **person** mode.
- A test outside §13's lists fails.
- The 0.19 step can't be computed from gated values without moving the gate's order.
- Any change to `index.html`, the data, or a decision other than 210's mark.
- **Expected to break, and not a stop** (the prototype's own list, `9db5593`):
  - **The rule (13):** `engine.test.mjs` — "210: table schema 0.11; a 0.10 table opens…"
    (the sides gain `roll`: update its `eq` and its `"0.18"`); "210: in waves the side
    holding the best Combat Sense goes first…"; "210: a side's best leaves out Out and Goes
    last rows…"; "210: ties are between sides in waves…"; "210: three sides: the middle
    result goes second"; "210: Start in waves lands on the best side's first row…"; "210:
    switching mid-round keeps who has acted…"; "210: a row that has acted and then goes Out
    or Goes last doesn't split its side's wave"; "210: editParticipant moves a row…".
    `smoke-table-play.test.mjs` — "210: a planned encounter is One at a time; Wave
    Initiative groups the rows…"; "210: a tie between sides is flagged on both headings…";
    "210: Start lands on the best side's first row…". `sample-table.test.mjs` — "the gate
    keeps the sample exactly as written" (rebuild the sample). **Rewrite each to N's rule**
    (sides by roll), keeping what it checked that still holds; the SQ8 test ("doesn't split
    its side's wave") becomes "an Out or Goes last row doesn't move its side", and its name
    says N.
  - **The version (26):** every `"0.18"` table-schema literal: `docs.test` (STATE's line),
    `engine.test.mjs`'s migration tests from 0.1 onward (`newTable stamps…`, `a newer table
    schema stamp…`, `a 0.1 table migrates…`, `a 0.2…`, `a 0.3…`, 188, 191, 193, 203, 205,
    208, 212, 241, 243, 244, 251, 252, 254), `hostile.test.mjs` (sessions and threads; a
    table file's trail), and the smoke tests for 174, 177–179, 182 (two) and 203–204. A
    literal goes to `"0.19"`; nothing else in those tests changes. **If a "converts nothing"
    test fails for anything but the literal, stop**: the gate is converting.
- **Expected not to break:** 210's "Start in waves picks the first side by its place, not the
  best row added first" and "setTurn in waves gives the turn to any side" (both passed under
  the prototype), every 189 and 253 test, every Reset test in one at a time.

## 14. Close-out

*Rule or shape*, launched: **app 0.58.0, table schema 0.19, no `private/` commit** (say each
in the PR body).

- **SCHEMA:** N; 210's mark; §3's side shape and the 0.19 line in the table's version history
  (`:1245`).
- **INDEX:** N under **GM mode**; 210's line marked. After the voice pass, re-read N against
  Ken's picks.
- **The plan:** the *Still to build* row "S20" → *Built*; §9's GQ30 row: "**Built (S20,
  Decision N)**" after Deighton's answer; `gm-mode/README.md` gains S20's row.
- **`CHANGELOG.md`:** the ✎ line; `npm run changelog`.
- **STATE:** the versions line (app 0.58.0, table schema 0.19), the GM row and what's next.
- **The log:** an entry naming what the pre-flight found (a row's own result moved its whole
  side, P4; a mid-round edit re-sorted the sides, P6; the bump empties a saved trail once,
  212). Plus a row in `docs/log/shipped.md`.
- **PR title:** `feat(gm): Wave Initiative by one Combat Sense roll a side, the higher first, rolled again at the Reset (S20, Decision N)`.
- **PR body:** the template's sections, plus:
  - **the browser numbers** (step 7), every one;
  - **the mutants**, each with what caught it;
  - **every new string as it renders**, for the voice pass;
  - **Where the order didn't fit** (empty is fine).

**Review checklist** (beyond the tests passing):
- **Re-do the sweep by grep:** every reader of `_encOrder`, `_pick`, `sides`, `.best`,
  `data-eorder`, `.enc-num`; and **outside `gm.js`** (S19's lesson): nothing on the player's
  side reads any of them.
- **The migration on a real saved table:** save a wave fight mid-round on `main` (a scratch
  worktree with its own `npm ci`, no linked `node_modules`), open it on the PR: the same
  order, the same turn. And a hostile one.
- **Run a wave fight by hand** in the dev preview: every row of §9's *Where things land*,
  with focus checked after each change.
- **One at a time unchanged**, by hand: a fight run both ways in one session (switch mid-round).
- **The bump:** footer reads 0.58.0; What's new shows the line.
- **The voice pass:** every ✎ string, drafted side by side in the first review, and pasted
  into the message to the conductor and onto the PR.

## 15. Handing it over

**To the builder:** `WORK-ORDERS.md`'s building prompt, with this order's path
(`docs/plans/gm-mode/S20-wave-rolls.md`). Add these traps:

- **GM mode is launched.** No `featureOn("gm")` gate to hide behind, no `changelog-pending.md`.
  Tests reach the switched-off path only through `boot({ features: { gm:false } })`
  (`GM_OFF`); this order doesn't need it.
- **The crew's entry in a file is skipped by `_coerceSides` today** (its id isn't `SD-`), so
  its `roll` is lost unless you read it before the rebuild.
- **The seed reads gated values.** Raw `order` can be `"14"` or `{}` in a file.
- **One rule for "can the roll change"**, in the engine (`open` on the view and the writer's
  refusal). Don't write a second copy in `gm.js`.
- **Re-pick the turn** when a roll changes with nobody acted, as `setOpening` does. Without
  it, Start's first row stays on the side that used to be first.
- **Focus follows the field, not its place**: the heading moves when the sides re-sort.
- **The 26 version literals are mechanical.** A "converts nothing" test failing on anything
  but the literal is a stop.
- **Mutants in the background** (step 6), and **restore by copying a saved file back, never
  with `git checkout`.**
- **Fill N everywhere at build time**, comments and test names included.

**To the reviewer:** `WORK-ORDERS.md`'s reviewing prompt, with this order's path, the
builder's session id, and the checklist in §14. Draft the voice pass for every ✎ string in the
first review, side by side, and **paste the table into the message to the conductor and onto
the PR**.
