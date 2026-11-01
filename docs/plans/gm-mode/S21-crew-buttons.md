# Work order S21: the crew as buttons

**Plan:** [`../gm-mode.md`](../gm-mode.md), the *Still to build* row "S21". Ken's request,
2026-10-31, after using the launched table (through the conductor):

> when adding players to an encounter, I think it should be a set of buttons to click, with an
> option to 'add a player' that lets you enter a name. Right now you have to click the text box
> and you see a list of players, but it does not look intuitive. Most tables will not have more
> than 5 characters at it, so I think it'll look fine. If there are a lot of characters, it could
> fill in the space, until it reflows.

**Status:** **Drafted 2026-10-31** by Claude (Opus), the S20 reviewer, after #283 (S20,
Decision 261) merged. **Ken's answers already given** (2026-10-31, in the conductor session),
written in below as settled, not asked:
1. Buttons for **active seats only**; **Add a player** opens a field for any other name.
2. A name already in the encounter shows its button **disabled and marked**, not hidden.
3. **One press adds one row.** No multi-select.
4. A session's **Who was there** gets the same treatment, in the same order.

**Questions left for Ken:** SQ1–SQ4 (§4).
**Branch:** from `main` at `66b4303` or later, PR to `main`. **GM mode is launched (260):
nothing is switched off.** This ships visible, with a `CHANGELOG.md` line and an app bump.
**No `private/` commit.**
**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md).
The conductor (Opus) starts **S21 build** (Sonnet), then a fresh **S21 review** (Opus) once the
PR is open. Builder and reviewer message each other directly. Anything for Ken goes to the
conductor. §15 is the hand-over.
**Runs alone.** It touches:
- `engine.js`: one new reader (`seatPicks`), and `addParticipant`'s refusal of a seat already in;
- `gm.js`: the encounter's Add section, the session page's and the close-out's **Who was there**,
  their handlers, and four focus fallbacks that name the fields this replaces;
- `shadows.css`: one rule for a row of buttons that wraps, and the pressed and marked looks;
- `tools/phone-check.mjs` (one step that fills the old field);
- the ledger, INDEX, the plan, STATE, the log, `CHANGELOG.md`.

No data change, no table schema change (nothing stored is new), no `index.html` change.

**Tier: Rule or shape.** A player-facing behaviour someone could have chosen otherwise, and a new
engine refusal. One decision, **N**. It supersedes **nothing**; it cites 188, 203, 254, 255
and 257 (§0, the ledger).

**Carried over from S20's review** (#283: one review, one fix round; Ken's answers in #283's
issuecomment-6551783727). Each item is marked as the order's or the build's:

- **The order's: an automatic re-pick that never weighed a choice made by hand.** §8 re-picked
  the turn on every roll typed, and a GM's tapped turn snapped back; Ken ruled "keep the tap".
  **Here:** §9's *Where things land* has a row for each thing the GM has already chosen by hand:
  a spelling typed before seats existed, a row renamed, a row removed, a name toggled off.
- **The order's: line numbers that went stale.** #282 merged after S20's pre-flight. **Here:**
  every line number below is `66b4303`'s, and §12's step 1 says to re-find them by name.
- **The order's: a decision over the cap.** S20's draft was 363 words. **Here:** §3's draft is
  counted (`wc -w`, Touches included): **N** is 324.
- **The order's: a sample number the old rule doesn't give** (Pier 9's Eclipse). **Here:** the
  sample isn't touched; §11 reads the seats it already has.
- **The build's: trimming a decision dropped citations** (189 and 253 from 261's Touches; the
  reviewer restored them). **Here:** the draft is under the cap, so it goes in whole.
- **What worked:** mutants in the background; the voice table in the reviewer's first message;
  the browser numbers in the PR. Keep all three.
- **For the record, not a finding:** equal rolls typed at the Reset show no *Tied* until round 2.

**Pre-flight** (`docs/WORK-ORDERS.md`, *The pre-flight*), against `main` at **`66b4303`**,
2026-10-31. The functions below were opened and read. The probes ran in Node through
`tests/harness.mjs`'s `loadEngine` on `samples/dead-air.shadows-table.json`, by a scratch script
that isn't committed.

- **The encounter's Add section** (`encAddHtml`, `gm.js:3176`): **From the cast** (a toggle,
  `data-enc-pick`, `aria-expanded`), then a **PC name** field (`data-enc-pcname`,
  `list="sess-crew"`, placeholder "Who's at the table?") with **Add a PC** (`data-enc-addpc`),
  then **From the Codex**. Hidden when ended, at the Reset or wrapping up (`gm.js:3305`).
  `addPc()` (`:3468`) reads the field, calls `addParticipant(t, id, { kind:"pc", name })`, and
  returns focus to the field; Enter in it adds (`:3553`).
- **The list behind the field** is `sessionCrewNames` (`gm.js:1904`): the seats' names first,
  alphabetical (`namesSeatsFirst`, `:3583`, via `seatNames`, `:3577`: each **active** seat's
  name and every name it answers to), then every crew name, `present` name and PC row name the
  table has typed. It feeds three datalists, all `id="sess-crew"`: the encounter (`:3181`), the
  session page (`:1992`) and the close-out (`:2287`).
- **A session's Who was there** is a comma-separated text field in two places: the session's
  page (`data-sf="present"`, `:1989`; saves on every `input` through `editSession`, `:2083–2091`)
  and the close-out (`data-cosf="present"`, `:2284`; saves on `input`, then `closeSync()` and
  `drawLists()`, `:2294–2306`). Both store `present`, a list of typed names (`_roleList`,
  `engine.js:5811`; Decision 203).
- **Probe P1 (the seats):** *Dead Air*'s `playerList` has four players. Active seats: **Mara
  Okonkwo** (answers to Mara), **Dex Villanueva** (Dex), **Juno Park** (Juno), each with a copy.
  Folded: a **retired** seat with no copy and no name, whose `name` is its TAG
  (`TAG-S7GW-10QH-HW76`); **Kit Moreau**, benched; **Hollis Reyes**, dead. **Alex Brandt** has
  no seats.
- **Probe P2 (twice in):** on the running *Achterberg's clinic* (by person), `addParticipant`
  with `Mara Okonkwo` twice → `{ ok:true }` both times: **two rows claim one seat's copy**
  (257). A cast member twice is refused, "Already in." (`engine.js:8544`), and the cast picker
  shows **Already in** in place of Add (`encPickHtml`, `gm.js:3148`).
- **Probe P3 (present):** sessions 1–3 have `present` `["Mara Okonkwo","Dex Villanueva","Juno
  Park"]`; each answers to its seat through `seatFor`.
- **Focus that names the replaced fields**, found by grep: `data-erm`'s fallback after a row is
  removed (`gm.js:3458`, `focus("[data-enc-pcname]")`); `addPc`'s return (`:3472`); the cast
  page's Back into the close-out (`:1161`, `'[data-cosf="present"]'`); the close-out's Write
  refused (`:2324`); opening the close-out (`:2372`).
- **Not a reader:** the cast's **Between them and the crew** (`data-icrew`, `:789`;
  `data-iacrew`, `:806`) uses its own datalist, `crew-names` (`:803`, `crewNameChoices`). Out
  of scope (§7).
- **The ledger**, searched by name in *Touches* and text for: `PC name`, `Add a PC`, `PC row`,
  `datalist`, `present`, `Who was there`, `attendance`, `answers to`, `seatFor`, `addParticipant`,
  `Already in`, `crew names`, `sess-crew`, `Add`, `encounter Add section`. The hits that govern this:
  - **188** (rows, the PC row a typed name): cited. A PC row is still a typed name; the button
    types it.
  - **203** (sessions, `present` as names): cited. `present` stays typed names; the button
    writes the seat's name, and toggling it off removes the names that answer to the seat.
  - **254** (seats, names that answer to them, nothing typed rewritten): cited. The buttons read
    `seatFor`; no stored name is rewritten.
  - **255** (the Players tab, its datalist, the PC name field offering seats): cited. The
    datalist stays, on the **Add a player** field; its order is unchanged.
  - **257** (a PC row named for a seat is that character): cited. The refusal stops P2's two
    rows on one copy.
  - **211** (the encounter's Add section, its Codex search): cited, unchanged.

  None of them decides how a GM picks the crew, so **Replaces: nothing** holds.

## 1. Goal

A GM adding the crew to a fight presses each player's character, one press each. Someone the
table hasn't seated is a press on **Add a player** and a name. A character already in the fight
can't be added twice, and says so. A session's **Who was there** works the same way, in the same
order, and a name pressed by mistake comes off with a second press.

**Done when:**
- The encounter's Add section shows one button per active seat with a name, in the Players tab's
  order, then **Add a player** (W1).
- One press adds one PC row under the seat's name; the button then shows disabled and marked
  **In** ✎ (W2).
- `addParticipant` refuses a PC row whose name answers to a seat already in, "Already in.", the
  typed field included (W3).
- **Add a player** opens a field; Enter or its button adds a row and keeps the field open, empty,
  focused (W4).
- A session's **Who was there**, on its page and in the close-out, shows the same buttons in the
  same order, each pressed while a name in `present` answers to it; a press toggles; any other
  name in `present` shows as a pressed button after the seats; **Add a player** adds a name
  (W5, W6, SQ1).
- Nothing stored changes shape; a table saved before this opens with the same `present` and rows.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape.
- **App:** **0.58.0 → 0.59.0** (minor), under SQ4's default. One `CHANGELOG.md` line under
  `## [Unreleased] — app 0.59.0` (§9), then `npm run changelog`. `npm run bump -- 0.59.0`.
- **Table schema, game data, character schema, pack schema, ruleset:** unchanged.
- **`private/`:** untouched.
- **Decision:** the next free number, **N** (the ledger ends at 261 on `66b4303`).
- **Wishes:** W142 (the cast's **Between them and the crew** as buttons) is added by this order
  as the follow-up (§7). None taken up.

## 3. The decision, drafted

Paste it after the last decision, under INDEX §3's **GM mode** heading, and fill in **Built**.
324 words, Touches included (`wc -w`). Worded for the defaults; a different SQ answer rewords it.

```
N. **The crew is a row of buttons: one per active seat, in the Players tab's order, then Add a player for any other name; in an encounter a seat already in is disabled, and in Who was there a press toggles.**
     *2026-10-XX · Ken + Claude · Touches: encounter Add section, Add a PC, PC name, Add a player, Who was there, present, close-out, seatPicks, addParticipant, Already in, seatFor, datalist, sess-crew, active seat, Decision 188, Decision 203, Decision 254, Decision 255, Decision 257*
     - **Decided:** The encounter's Add section and a session's Who was there (page and close-out) show a button per active seat with a name, in the Players tab's order, then Add a player, a field for any other name. In an encounter a press adds one PC row under the seat's name; a seat already in shows disabled, marked In, and `addParticipant` refuses it. In Who was there a seat's button is pressed while a name in `present` answers to it and a press toggles it; other names in `present` follow as pressed buttons. Nothing stored changes.
     - **Why:** Ken (2026-10-31): a field with a hidden list "does not look intuitive"; most tables seat five or fewer, so buttons fit and reflow. Two rows on one seat ran two fights on one copy (257).
     - **Rejected:**
       - Every seat, benched and retired too: more to scan past.
       - Hiding a seat already in: it reads as gone.
       - Several at once, then Add: two presses for the commonest act.
       - Toggling in the encounter: a row carries damage and Conditions, so it keeps its own Remove.
       - The typed field beside the buttons: two ways to do one thing.
     - **Replaces:** nothing.
     - **Revisit if:** tables routinely seat more than eight, a GM needs a benched seat in a fight often, or the cast's crew lines (W142) get the same buttons.
     - **Built:** app 0.59.0; PR #…; log 2026-10-XX (S21).
```

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **Who was there, removing a name.** Default: **a seat's button toggles** (press to add, press again to remove every name in `present` that answers to it), and **any other name in `present`** (a guest, a benched seat's name, a spelling typed before seats) shows as a pressed button after the seats, a press removing it. The encounter keeps Ken's rule (a seat already in is disabled) and removing a row stays the row's own **Remove**, with its question: a row carries damage and Conditions, a name in a list doesn't. Or **the same as the encounter**: a name in is disabled, and Who was there gains a × on each to remove it? Two controls where one press does it. | **Toggle; other names as pressed buttons** | |
| SQ2 | **A seat twice in a fight.** P2: today a second row for the same seat is added, and both claim its copy (257). Default: **`addParticipant` refuses it, "Already in."**, as it refuses a cast member twice; the typed field gets the same answer, so the disabled button is the engine's rule, not only the UI's. A rename onto a seat already in isn't refused (`editParticipant`, out of scope). Or **only the button stops it**, and a typed name still adds a second row? | **The engine refuses** | |
| SQ3 | **The buttons' order.** Ken said "in the same order" in both places. Default: **the Players tab's order** (each player as listed, their active seats in order), so a GM sees the crew in one order on the card spread, the fight and the session. Or **alphabetical**, as today's datalist sorts the seats? | **The Players tab's order** | |
| SQ4 | **The bump.** Default: **minor, 0.59.0**: how a GM adds the crew is new. Or **patch, 0.58.1**, as a usability fix? | **Minor** | |

Settled by the order, not asked (say so if Ken disagrees):
- **A seat with no name** (its `name` is its TAG: no copy, nothing typed) gets **no button**, as
  `seatNames` already leaves it out of the datalist. It can still be typed through **Add a player**.
- **The datalist stays** on each **Add a player** field, unchanged (`sessionCrewNames`), so a
  benched seat's or a guest's name still completes as it's typed.
- **A seat whose name clashes** (two seats answer to it, 254) gets its button; a row added under
  it answers to neither (257's line says why), so `seatPicks` never marks it **In**.

## 5. The assumption sweep

Every reader was found by grep on `66b4303`. The last column answers the three questions for each
row: which guards read it, where it renders, and what text points at it.

| What changes | Today, where | After | Readers and twins |
|---|---|---|---|
| A new reader | none | `seatPicks(t, names)` → `[{ tag, name, player, in }]` (§8) | Called by the encounter (rows' names) and by Who was there (`present`); exported beside `seatFor` (`engine.js:9369`'s list) |
| `addParticipant`, a PC row | Adds any name (`engine.js:8548–8553`) | Refuses a name that answers to a seat a PC row in the encounter answers to, "Already in." (SQ2) | `addPc` (`gm.js:3468`, shows `r.why`); `addToEncounter` (cast and Codex only: grep, unaffected); `participantsFromGroup` (entries: unaffected); engine tests of 188, 191, 257 that add a seat's row once (unaffected) |
| The encounter's Add section | **PC name** field + **Add a PC** (`gm.js:3180–3181`) | The seat buttons, then **Add a player** (a toggle, as **From the cast**), its field and **Add** when open; datalist kept | `encAddHtml`'s callers (`:3305`); `addPc` (`:3468`); Enter (`:3553`); `data-erm`'s fallback (`:3458`); smoke helpers `addPcRow` (`smoke-table-play:32`), `addPc` (`smoke-table-encplan:24`), `smoke-table-seat-fight:41`, `smoke-table-keys:236`; `tools/phone-check.mjs:317`; test "255: the encounter's PC name field offers the seats' names" (`smoke-table-seats:285`) |
| Session page's Who was there | Text field, `data-sf="present"` (`gm.js:1989`) | Buttons + **Add a player** | The `[data-sf]` loop (`:2083`: `present`'s branch goes, the rest stay); `sessionLine` (`:1900`, reads `present`: unchanged); tests 203 (`smoke-table-play:622`, `:851`) |
| Close-out's Who was there | Text field, `data-cosf="present"` (`gm.js:2284`) | Buttons + **Add a player**; a press saves, then `closeSync()` and `drawLists()` as typing did | The `[data-cosf]` loop (`:2294`); focus at `:1161`, `:2324`, `:2372`; `coLines`' kept lines (`:2177–2189`: a typed IP and an away line's tier survive a name going and coming back, test 206 review, `smoke-table-play:1127`); tests 205–206 (`:906`, `:1050`, `:1100`) |
| `sessionCrewNames` | Three datalists | Unchanged; read by the three **Add a player** fields | `smoke-table-seats:299` (the datalists offer seats first: still true) |
| CSS | `.cast-add` grid (`shadows.css:1269`) | A wrapping row of `.btn`s; the pressed and the **In** looks | `.btn:disabled` (`:290`, dims to .45: the **In** mark must still read, §9); touch height (`:1227`, `.btn` 44px); no other reader of the new class |
| Text that points at the old controls | — | Rewritten | `gm.js:1903`'s comment ("for the Who was there field"); 255's *Touches* ("PC name", history, unchanged); `smoke-table-play:56`'s message ("Add a PC didn't return to the name field"); the placeholder "Who's at the table?" and "Names, separated by commas" (gone) |
| **Player's side** | — | Nothing | `grep -rn "seatPicks\|sessionCrewNames\|data-enc-pcname\|data-sf=\|data-cosf" src/ui/` hits `gm.js` only. The new CSS class is read by `gm.js` only |

## 6. Read first

- `CLAUDE.md`: constraints 7 (store inputs: `present` stays names), 8 (the engine is total), 9
  (no build-state copy). *Decisions*.
- `docs/SCHEMA.md` §4: 188, 203, 254, 255, 257.
- `engine.js`: `playerList`, `seatView`, `_seatIndex`, `seatFor`, `addParticipant`.
- `gm.js`: `encAddHtml`, `encPickHtml` (the **Already in** precedent), `addPc`, the
  `data-enc-pick` toggle (the pattern for **Add a player**), `sessionPageHtml` and
  `bindSessionPage`, `closeSheetHtml` and `bindCloseOut`, `seatNames`, `sessionCrewNames`.
- `tests/smoke-table-play.test.mjs` from `:32` (`addPcRow`), `:622` (sessions), `:906`
  (the close-out); `tests/smoke-table-seats.test.mjs` from `:285`.

## 7. Out of scope

- **The cast's Between them and the crew** (`data-icrew`, `data-iacrew`). A line's crew is who
  was in one moment, often one name, written while the line is; it isn't the roll call Ken
  described, and it has its own list (`crew-names`). Logged as **W142** for after this lands.
- **Renaming a row onto a seat already in** (`editParticipant`). Not refused here.
- **Benched, retired and dead seats as buttons.** Typed through **Add a player**.
- **Changing what `present` stores**, or a seat link in it (254 rejected that).
- **The cast and Codex parts of Add.** Unchanged.

## 8. The shapes

No stored shape changes. One reader:

```
seatPicks(t, names) → [{ tag, name, player, in }]
```
- One entry per **active** seat whose `name` isn't its TAG, in `playerList`'s order (SQ3): each
  player as stored, their seats as stored. `name` is the seat's (`seatView(...).name`);
  `player` is the player's name, for an `aria-label` only.
- `in`: some string in `names` answers to the seat (`seatFor(t, n)===tag`). A name two seats
  answer to answers to neither (254), so it never marks one.
- Total: `t` not a table, `names` not an array, junk inside it → `[]`, or `in:false` for the junk.

**`addParticipant`, a PC row (SQ2):** before the push, if `seatFor(t, name)` is a TAG and a PC
row in the encounter answers to the same TAG, `{ ok:false, why:"Already in." }`, writing nothing.
Cast rows: unchanged.

**Who was there, a press** (UI, through `editSession`'s existing `present`):
- On a seat that isn't pressed: `present` + the seat's `name`.
- On a pressed seat: `present` without every name that answers to it (`seatFor`), the seat's
  own spelling and any typed before.
- On another name's button: `present` without that name.
- **Add a player:** `present` + the typed name, trimmed; nothing if empty; nothing if a name
  already in `present` folds to it.

## 9. The UI

**The row of buttons** (behaviour; markup a suggestion): a heading-less group labelled for
assistive tech (**Crew** ✎), its buttons wrapping to the width ("fill in the space, until it
reflows"). Each is the seat's name. In the encounter a seat already in is `disabled` and carries
a visible **In** ✎ that still reads at `.btn:disabled`'s opacity (a tag beside the name, not
colour alone), with `aria-label` "<name>, already in" ✎. In Who was there each button has
`aria-pressed`, and the pressed look isn't colour alone (a ✓ ✎ before the name, say).

**Add a player** ✎ is a toggle like **From the cast** (`aria-expanded`). Open: a field labelled
**Name** ✎ (the `sess-crew` datalist, no placeholder) and **Add** ✎. Enter in the field adds.

**The encounter**, at the place of today's **PC name**: the buttons, then **Add a player**.
**From the cast** and **From the Codex** keep their places.

**Who was there**, on the session's page in the `sess-head` where the field was, and in the
close-out the same: a label **Who was there** over the buttons, the other names' buttons after
the seats', then **Add a player**.

**The changelog line** ✎, under `## [Unreleased] — app 0.59.0`:
> Add the crew to a fight, and to who was there, with a press: each seated character is a button,
> and **Add a player** takes anyone else.

**Where things land** (with S20's lesson: what the GM already chose by hand):

| State | A press does | Focus after |
|---|---|---|
| Encounter, a seat not in (planned, running, waves) | Adds one PC row under the seat's name (on the crew's side); the button turns **In**; the turn is untouched (`addParticipant` never moves it) | The next enabled seat button, else **Add a player** |
| Encounter, a seat already in | Nothing: it's disabled | — |
| Encounter, **Add a player**, a name | Adds a row; the field stays open, empty | The field |
| Encounter, **Add a player**, a seat's name already in | Refused, "Already in." (toast); the field keeps the text | The field |
| Encounter, the GM removes a seat's row (**Remove**) | The seat's button is enabled again | Today's next or previous row; with none, the first enabled seat button, else **Add a player** (was `[data-enc-pcname]`) |
| Encounter, a row renamed by hand onto a seat | That seat's button shows **In** | Unchanged |
| Encounter, a row renamed by hand off its seat | The seat's button is enabled | Unchanged |
| Encounter, Undo of an add | The row goes; the button is enabled | As Undo leaves it |
| Ended, at the Reset, wrapping up | No Add section (`gm.js:3305`, unchanged) | — |
| Who was there, a seat not pressed | `present` gains the seat's name | The same button, now pressed |
| Who was there, a pressed seat whose name was typed by hand before seats (*Dex* for *Dex Villanueva*) | Removes every name answering to it, the hand-typed one included | The same button |
| Who was there, another name | Removes it; its button goes | The next button in the group, else **Add a player** |
| Who was there, **Add a player**, a name | `present` gains it; it shows as a pressed button; the field stays open, empty | The field |
| Close-out, any of the above | As on the page, then `closeSync()` and `drawLists()`: a typed IP or an away line's tier survives a name going and coming back (206's review) | As on the page |
| Close-out opened, Write refused, Back from the cast | Was `[data-cosf="present"]` | The first button in Who was there, else **Add a player** |
| No active seats | No buttons; **Add a player** only | As above |

## 10. Worked examples, as named tests

The builder writes these first and shows each failing on `main`. Each names the screen it runs on
and its mutant.

Engine (`tests/engine.test.mjs`, beside 257's):

- **W1** `N: seatPicks lists the active seats with a name, in the Players tab's order, and marks those a name answers to` —
  on *Dead Air*: `["Mara Okonkwo","Dex Villanueva","Juno Park"]`; no TAG, no Kit, no Hollis;
  with names `["dex"]` only Dex is `in` (P1, P3). *Mutants:* folded seats listed; the TAG seat
  listed; `in` by exact spelling.
- **W3** `N: addParticipant refuses a PC row for a seat already in, and a typed name that answers to it` —
  *Achterberg's clinic*: `Mara Okonkwo` → "Already in.", the table byte-identical; `mara` →
  "Already in."; `Wren` twice → both `ok` (no seat). After Mara's row is removed, `Mara` → `ok`.
  *Mutant:* no refusal (P2's two rows).

Smoke, on the real pages through `smokekit.mjs`:

- **W2** `N: the encounter's crew buttons add one row each and show In; Remove enables the button again` —
  `smoke-table-seats`: a seated table, a planned encounter; three buttons; press Mara → one row
  named *Mara Okonkwo*, the button `disabled` with **In**, focus on Dex's button; Remove the row
  → enabled, focus on Mara's button. *Mutants:* the button not disabled; focus not moved.
- **W4** `N: Add a player opens a field that adds a row and stays open; a seat already in is refused` —
  `smoke-table-play`: **Add a player** → field focused; type *Wren*, Enter → row *Wren*, field
  empty and focused; type *Mara* when Mara's in → toast "Already in.". *Mutant:* field closes.
- **W5** `N: Who was there on a session's page toggles a seat, keeps a hand-typed name as its own button, and adds a player` —
  a session with `present` `["Dex","Rook"]`: Dex's seat pressed, *Rook* a pressed button after
  the seats; press Dex → `present` `["Rook"]` (the hand-typed *Dex* went); press Mara →
  `["Rook","Mara Okonkwo"]`; press *Rook* → `["Mara Okonkwo"]`; Add a player *Wren* →
  `["Mara Okonkwo","Wren"]`. *Mutants:* toggle off removes only the seat's spelling; other names
  dropped from the group.
- **W6** `N: the close-out's Who was there toggles too, and a typed IP survives a name going and coming back` —
  206 review's case on buttons: type Rook's IP, press Rook off and on, the IP is still the typed
  one. *Mutant:* `drawLists()` not called after a press.
- **W7** `N: the crew buttons are in the same order in the encounter, the session and the close-out` —
  the three groups' labels equal. *Mutant:* the session's group sorted alphabetically.

## 11. Tests beyond the examples

- **Totality:** `seatPicks` on `null`, `{}`, a table with `players: "x"`, `names` `[5, {}, null]`.
- **Undo:** one press is one entry; Undo takes the row (or the name) back.
- **At 390 and 1300:** five seats with long names (*Ines "Nine" Baptiste-Okonkwo*): no element
  in `main` past the right edge; the buttons wrap.
- **Mutation-test** every guard in §10, **in the background** (§12 step 6).

## 12. Steps

`git submodule update --init private`, then `npm run test:fast`. **Commit at the end of each step.**

1. Take N: the lowest free on `origin/main`. Re-find every line number above by name.
2. **The tests first:** W1–W7. Show them failing on `main`.
3. **The engine:** `seatPicks`, `addParticipant`'s refusal. W1, W3.
4. **The UI:** the encounter's buttons and **Add a player**; Who was there on the page and in the
   close-out; the four focus fallbacks; the CSS. W2, W4–W7. Then the breaks in §13.
5. **`tools/phone-check.mjs`:** its step that filled `[data-enc-pcname]` presses the seat's
   button (or **Add a player**).
6. **Mutants, in the background.** Commit first; one at a time, copy the file aside, edit, run
   `npm run test:fast` plus the one smoke file, copy back. **Never `git checkout`.**
7. **In the browser** (`shadows-dev-preview`, *Dead Air*). **Report every number.**
   - *Achterberg's clinic* (running): the three seats show **In**; Remove Juno's row, press Juno.
   - A new planned encounter: press all three; **Add a player** *Wren*; try *Mara* again.
   - Session 7 (to play): Who was there; toggle Dex off and on; Add a player; the close-out.
   - At 390 and 1300 (§11): `scrollWidth === clientWidth`, nothing past the edge.
   - `npm run phone-check`: compare the frame fixture line with `main`'s (it differed on Home at
     four widths on `4829559`).
8. **The docs** (§14), `npm run bump -- 0.59.0`, the `CHANGELOG.md` line, `npm run changelog`.

## 13. Stop and ask

- N is taken, or the ledger search finds a decision about picking the crew that the pre-flight
  doesn't name.
- A test outside §13's lists fails.
- Anything would store a seat link or rewrite a stored name.
- Any change to `index.html`, the data, the table schema, or a decision.
- **Expected to break, and not a stop** (by grep on `66b4303`; no prototype was run):
  - **The helpers that type into `[data-enc-pcname]`:** `addPcRow` (`smoke-table-play:32`),
    `addPc` (`smoke-table-encplan:24`), `smoke-table-seat-fight:41`, `smoke-table-keys:236`,
    and `tools/phone-check.mjs:317`. Each opens **Add a player** first (or presses the seat's
    button where the name is a seat's); the tests calling them don't change.
  - `smoke-table-play`'s "Decisions 188–189: plan an encounter…" (`:46`): its check that focus
    returns to the name field (`:56–57`) becomes the open **Add a player** field.
  - `smoke-table-seats`'s "255: the encounter's PC name field offers the seats' names" (`:285`):
    rewritten to N's buttons, keeping its check that the datalist leads with the seats.
  - **The session tests that type `present`:** "Decision 203: every field on a session saves as
    it's typed…" (`:622`), "Decisions 203–204: export and import keep sessions and threads…"
    (`:851`), "205–206: Close out opens the sheet on Who was there…" (`:906`), "205: Write stores
    the log…" (`:1050`), "205: Write refused names the field…" (`:1100`), "206 (review): a typed
    IP survives correcting a letter in Who was there…" (`:1127`). Each enters names through
    **Add a player** or the buttons; what each checks of the close-out stays. The 206 review's
    "correcting a letter" case has no meaning with whole names: W6 replaces that half.
- **Expected not to break:** `smoke-table-seats`'s "254: Who knows what … the datalists offer the
  seats first" (`:299`), every 257 test (a seat's row is added once), every engine session test.

## 14. Close-out

*Rule or shape*, launched: **app 0.59.0, no schema change, no `private/` commit** (say each in
the PR body).

- **SCHEMA:** N. No supersession marks.
- **INDEX:** N under **GM mode**. After the voice pass, re-read N against Ken's picks.
- **The plan:** the *Still to build* row "S21" → *Built*; `gm-mode/README.md` gains S21's row.
- **WISHLIST:** W142 stays open (§7).
- **`CHANGELOG.md`:** the ✎ line; `npm run changelog`.
- **STATE:** the versions line (app 0.59.0), the GM row.
- **The log:** an entry naming what the pre-flight found (P2: one seat could be added twice, both
  rows on one copy). Plus a row in `docs/log/shipped.md`.
- **PR title:** `feat(gm): the crew as buttons in an encounter and in Who was there (S21, Decision N)`.
- **PR body:** the template's sections, plus the browser numbers (step 7), the mutants with what
  caught each, every new string as it renders, and **Where the order didn't fit**.

**Review checklist** (beyond the tests passing):
- **Re-do the sweep by grep:** every reader of `data-enc-pcname`, `data-enc-addpc`,
  `data-sf="present"`, `data-cosf="present"`, `sess-crew`, `addPc`, `addParticipant`; and
  nothing outside `gm.js` reads them.
- **Every row of §9's *Where things land*** by hand in the dev preview, focus checked after each.
- **The close-out's kept lines:** a typed IP and an away line's tier survive a toggle off and on.
- **Old tables:** a session whose `present` holds a spelling typed before seats opens with the
  seat pressed and nothing rewritten (export and compare).
- **The bump:** footer reads 0.59.0; What's new shows the line.
- **The voice pass:** every ✎ string, drafted side by side in the first review, and pasted into
  the message to the conductor and onto the PR.

## 15. Handing it over

**To the builder:** `WORK-ORDERS.md`'s building prompt, with this order's path
(`docs/plans/gm-mode/S21-crew-buttons.md`). Add these traps:

- **GM mode is launched.** No feature gate; the change ships visible.
- **`in` comes from the engine** (`seatPicks`), never a second copy of "answers to" in `gm.js`.
  The refusal and the disabled button are one rule.
- **A disabled button can't hold focus.** After a press, focus moves on (§9), or it lands on
  `body`.
- **Four focus fallbacks name the old fields** (`gm.js:1161`, `:2324`, `:2372`, `:3458`). Grep
  for `data-enc-pcname` and `data-cosf="present"` after the change: none may be left.
- **The close-out redraws its lists after a press**, as it did after typing; a typed IP lives in
  the draft's kept lines, not in `present`.
- **Toggling a seat off removes every name that answers to it**, the hand-typed ones included;
  nothing else in `present` is rewritten.
- **Mutants in the background** (step 6), restored by copying back, never `git checkout`.
- **Fill N everywhere at build time**, comments and test names included.

**To the reviewer:** `WORK-ORDERS.md`'s reviewing prompt, with this order's path, the builder's
session id, and the checklist in §14. Draft the voice pass for every ✎ string in the first
review, side by side, and **paste the table into the message to the conductor and onto the PR**.
