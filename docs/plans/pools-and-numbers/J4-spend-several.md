# Work order J4: spend several at once

**Plan:** [`../pools-and-numbers.md`](../pools-and-numbers.md) §3, row J4. **Source:** **W176** (spend several at once on a tracker), raised by the plan. J4 is the **last row** of the plan's §3 table (J1, J2, J3, J4), so when it merges the plan is done and the release is Ken's (JQ6).

**Status: Approved (Ken, 2026-11-24).** Drafted 2026-11-24 by Claude, at J2's session's request. The §4 questions are answered (recorded below, 2026-11-24). Nothing is built, and no builder has been started.

**Built on:** Decision 225 (the round counts `trackers.<resource>.turn`, warns at and past Rate of Use and never blocks), 266 (`adjustPanelTracker` is the one writer of a spend), 26 (Manual Adjustments), 106 (the Cascade, which the engine reads and never rolls), 201 (Feeding never counts against the round), 312 (J1: SFR max and RoU by hand), 313 (J2: a named pool's card and popover), 314 (J3: a typed number in a stepper, and its misses), 164 (`keepPlace`), 135 (a data key is read by code).

**Branch:** `claude/j4-spend-several`, cut from `origin/main` at **883ce5e** (the pre-flight commit, J3 merged as #385). PR to `main`. Nothing ships switched off. **No app bump**: J4's lines go under `## [Unreleased] — app 0.76.0` (JQ6: the release is cut once, after J4, by Ken).

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). Nothing here says a builder has started. **Runs alone**: it touches `sheet.js` (the Trackers row, the SFR and pool popovers, the commit handler), the stylesheet, the tests, `tools/outputs.mjs` and the docs; no other open order touches those.

**Pre-flight against `main` at `883ce5e`.** Decision: **315** is the next free (314 is the last on `main`, `SCHEMA.md` §4). Flag: **F56** is the next free (the highest in `SCHEMA.md` §5 is F55; no `F56` exists in `docs/` or `src/`). This order writes **N** = 315 and **FN** = F56, taken when it's built.

```
Tracker ±1, the sheet        sheet.js 1681 (the SFR popover: data-trk="sfr|-1" / "sfr|1"), 1698 (a named pool's popover,
                             key pool:<id>, same pair), 1791-1792 (the Trackers row: the same pair, every tracker panel,
                             TOL Spent included). The commit: sheet.js 4015 (`commit("tracker", "<title> ±1", adjustPanelTracker(ch, pid, delta))`).
                             A max box beside the Trackers row: 1793 (data-trkmax), handler 4258.
Engine, the one writer      engine.js 4610 adjustPanelTracker(ch, panelId, delta): ALREADY takes an amount. Math.trunc of a
                             finite delta; a non-finite delta is 0 (ok:true, nothing moves); the count clamps at 0; a
                             +delta adds to `turn`, a −delta takes back from `turn` first (never below 0). Its other callers
                             pass costs: startPower (4718), runCost spends (4771), the Turn Reset's (4804). Engine tests
                             already pass amounts (engine.test.mjs 531-538, 3278-3288, 8916-9023, 12735).
Probes on main (node, the harness's loadEngine; a vampire at Street, RoU 4):
                             adjustPanelTracker(ch,"sfr",6) → ok, turn 6, cap 4, spent 6.
                             then (…,-9) → spent 0, turn 0. (…,Infinity) → ok, spent unchanged (0).
                             (…,1e21) → spent 1e+21 STORED (the engine is total but not bounded: the UI must cap).
                             Arcanist, TOL max 1, adjustPanelTracker(ch,"tol-spent",6) → count 6, shown 6 (no clamp).
The round, readers          trackers.sfr.turn is read by panelTracker's turn (engine 4600), sfrTurn (sheet 1627),
                             sfrRoundText (1629: "N of RoU this round" / "N this round, M past your Rate of Use. Your GM's
                             call."), sfrCardMeta (1637), Main's SFR card (561: the danger class), the SFR popover
                             (1673, 1680, 1683: the line, the Turn Reset button), the Trackers row (1787, 1796). Print and GM
                             seat: grep in the build (§5).
TOL Spent's Cascade         shadows-data.js: the tol-spent panel with "overMax": "cascade" (the Arcanist's, line 2597, and
                             the Bound's coreMechanic, line 3632, whose note reads "Past zero, you Cascade."). The sheet
                             shows cascadePanelHtml (sheet 950) once the count is past the max (sheet 1800: `cur>effMax`),
                             with no roll. Engine.cascade (Decision 106) takes a Rupture's degree and is not called from here.
Named pools' readers        poolCardsOf (sheet 515), Main's pool cards (cond("pool"…) at 565, opens pool:<id>), the pool's
                             popover (1694). J2's Activity Log title: trackerTitle.
Tests that pin the ±1       smoke-sheet-play.test.mjs 491 (tol-spent|1), 1073-1084 (the SFR popover's +1 and its focus),
                             2620-2655 (a named pool's ±1 on Main and the popover), smoke-sheet-archetypes.test.mjs 551
                             (call-of-the-wild|1). The attribute `data-trk="<id>|<d>"` stays, so these keep working at
                             amount 1; only tests that read the button's TEXT ("−1", "+1") could break (grep in the build).
outputs.mjs                 `visible()` reads `body.textContent` (tools/outputs.mjs 91-94). An <input>'s value is not in
                             its textContent, so every field's digits are invisible to the snapshot. This is J3's miss (§7).
Ledger                      "Decision 225" (round, warns, never blocks), 266, 201, 106; no decision says a spend's amount.
                             Searched: the ledger's Touches lines name `adjustPanelTracker` (225, 266) and `trackers.sfr.turn`;
                             both are extended, not superseded.
Phone-check on main         fails in this environment (`Over budget at: all.`), the same as J3 found. It is environmental.
```

## Carried over from J3

J3's review (PR #385, merged as 883ce5e) left three things. J4 takes each:

- **The outputs snapshot can't see a field's value.** `tools/outputs.mjs`'s `visible()` reads `textContent`, so a number typed into an `<input>` (J3's stepper field, and J4's amount field) is invisible to the diff. J3's own proof had to read the field values in a scratch copy. **The fix is in this order (§12 step 1), not left as a note:** `visible()` reads each `input`'s and `textarea`'s value into the snapshot, and the baseline is taken on `main` with the fixed tool before any J4 change.
- **A stepper's field is named by the name alone** (`aria-label="<name>"`, J3's build), not `<name> value` as J3's order §9 said. J4's amount field is different: it sits beside two buttons on a card with its title, so its label is `<title> amount` (JQ-J4-6). J3's amendment (§4a) stands.
- **`currentOf` was not built.** J3's `stepTo` reads the rendered field's `defaultValue` in place of a per-kind `currentOf` table, and the order was amended to say so. J4 has no such table and does not need one: the amount is typed, and the engine's `adjustPanelTracker` takes it.

**A correction to the plan.** The plan's J4 row says J4 "reuses J3's control on J2's panels". J3's control is `stepper()` in `wizard.js`, with `pressKey`, `stepTo` and `typedCommit` bound to the wizard's `applyStep`. The sheet's ±1 is not a stepper and can't use it. §2 below builds a separate amount field on the sheet, with the same typed-value rules, and the plan's row is corrected in this order's commit (§9, the docs).

## 1. Goal and Done when

A player or GM types an amount beside a tracker's − and + and presses +: the amount is spent as **one change**, one Undo takes it back, the round's count moves by the amount, and at or past Rate of Use the round line warns as it does now.

**Done when** (each line names its test in §10):
- Every tracker control on the sheet has an amount field, on each of its three twins: the Trackers row, the SFR popover and a named pool's popover. *(`J4: every tracker control has an amount field on each of its twins`)*
- At the default amount (1) a press does what the ±1 does today: the same count, the same round, the same Activity Log line. *(`J4: at the default amount a press is the ±1 it was`)*
- A typed amount is one change and one Undo: the count moves by the whole amount, and Undo takes it all back. *(`J4: a typed amount is one change and one Undo`)*
- The round counts the amount, and warns at and past Rate of Use as one press does now. *(`J4: an amount counts against the round as its amount, and warns at and past Rate of Use`)*
- A take-back of more than the count stops at zero and takes back the round first, never below zero. *(`J4: a take-back of more than the count stops at zero and takes back the round first`)*
- An amount past a TOL Spent max shows the Cascade panel once, not once per point, with no roll. *(`J4: an amount past TOL shows the Cascade panel once, with no roll`)*
- A named pool's amount moves its count and names the pool in the Activity Log. *(`J4: a named pool's amount moves its count and is named in the Activity Log`)*
- Text that isn't a whole number from 1 to 9999 (zero, a fraction, letters, a blank) changes nothing and commits nothing. *(`J4: text that isn't a whole amount from 1 to 9999 changes nothing`)*
- Enter in the amount field spends it (the + side); Escape puts the field back to 1. *(`J4: Enter spends the typed amount and Escape puts the field back to 1`)*
- Nothing else on the sheet changes. *(the outputs diff in §11, read through the fixed tool)*

## 2. Tier, versions, numbers

- **Rule or shape.** A spend that takes an amount is a choice someone could have made otherwise (one press per point, or one change). One decision, **N** (315). Extends 225 and 266. One flag, **FN** (F56), opened by the build: the TOL question in §5 (JQ-J4-7 and the flag's own text).
- **App: no bump.** J4's lines go under `## [Unreleased] — app 0.76.0` (JQ6). **Game data:** none. **Character schema:** none (an amount is a number the existing `trackers` writers already store). **Table and pack schemas:** none.

## 3. Decisions, drafted in full

```
N. **A tracker's spend takes an amount: one change, one Undo, counted against the round as the amount.**
   *2026-11-24 · Ken + Claude · Touches: adjustPanelTracker, trackers.sfr.turn, the tracker controls (the Trackers row,
   the SFR popover, a named pool's popover), the Activity Log's label for a spend, TOL Spent's overMax, W176*
   - **Decided:** a tracker's − and + take a whole amount from the control beside them, 1 to 9999, and the amount is 1
     until the player types another. One press is one change: one Undo entry; the count moves by the amount and clamps
     at 0; the round (`turn`) moves by the amount, and a take-back takes back from it first, never below 0. Nothing is
     refused: at or past Rate of Use the round line warns as it does now (225), and past a TOL Spent max the Cascade
     panel shows once (the Cascade is a roll the player makes, not a count the sheet keeps).
   - **Why:** W176. A 6-SFR power is six presses, each one Activity Log line and one Undo step, and the round's count
     should read the spend as the one thing it was.
   - **Rejected:**
     - A confirmation for large amounts. The GM's table moves at its own pace, and a confirm is one more click per spend.
     - Holding the spend to what's left (SFR's room, a pool's room). 225 says the sheet never blocks, and a named pool
       already reads 0 past its max, so a refused amount would be the one place the sheet says no.
     - One Cascade per point on TOL Spent. The CRB's Cascade is one roll with the Rupture's degree (0480); whether a
       voluntary spend Cascades at all, and how many, is FN's question for Deighton, not a count the sheet invents.
   - **Replaces:** nothing. Extends 225 (the round counts the amount) and 266 (the one writer takes the amount).
   - **Revisit if:** FN is answered (a Cascade per point, or by degree): the TOL overMax shape changes; a spend needs a
     room rule (SFR's room, a pool's room) the table asks for.
   - **Built:** app 0.76.0 (unreleased), PR (this one), log entry 2026-11-24.
```

INDEX §3, under the Rounds and trackers topic (where 225 is), as a line:

```
- **N** *(Spend several at once — W176, J4)* — a tracker's − and + take a whole amount (1 to 9999, default 1) from the control beside them: one change, one Undo; the count moves by the amount and clamps at 0; the round counts the amount, a take-back takes it back first; the warning at and past Rate of Use is unchanged; TOL Spent's Cascade panel shows once past its max. Extends 225 and 266.
```

Flag for `SCHEMA.md` §5 and INDEX §2 (opened by the build, closed only by Deighton):

```
| FN | **A voluntary TOL spend past zero: does it Cascade, and once or per point?** The CRB says "If a Rupture pushes TOL below zero, a Cascade follows immediately" (0480, the TOL section) and "Cosmic Intervention … TOL decreases by the cost … The mechanic is identical" (0480, How TOL Is Spent) — it doesn't say a voluntary spend past zero Cascades. The app's note on the Bound's TOL Spent says "Past zero, you Cascade." (shadows-data.js, the Bound's coreMechanic). `Engine.cascade` takes a Rupture's degree (Decision 106); a voluntary spend has none. J4 shows the Cascade panel once, as today, and rolls nothing. | Deighton | No |
```

## 4. Questions for Ken

*Recorded by the conductor from Ken's answers (2026-11-24): JQ-J4-2 is not held to what's left (the default); JQ-J4-7 is one Cascade panel with no roll, and F56 opens for Deighton. JQ-J4-1, -3, -4, -5 and -6 take their defaults. The order is awaiting Ken's approval.*

Each has its default. A blank answer is the default.

- **JQ-J4-1: where the amount is typed.** **Default:** a number field between the − and + of each tracker's control, on the Trackers row, the SFR popover and a named pool's popover (the three twins), not as a separate dialog. *Alternative:* the amount is typed on Trackers only; the popovers keep ±1.
- **JQ-J4-2: is the spend held to what's left?** **Answered 2026-11-24 (Ken): the default.** **Default:** no (225: the sheet never blocks; a named pool past its max reads 0 already). *Alternative:* an amount past the room (SFR's max less its spend, a pool's count to its max) is refused with the room said in words.
- **JQ-J4-3: does the amount go back to 1 after a press?** **Default:** yes. A stale 6 can't be spent again by a second tap. *Alternative:* it stays until changed.
- **JQ-J4-4: a cap on the amount.** **Default:** 1 to 9999; more, zero, a fraction or text changes nothing (the same refusal J3 gives a stepper). *Alternative:* no cap.
- **JQ-J4-5: Enter and Escape in the field.** **Default:** Enter spends the typed amount (the + side); Escape puts the field back to 1. *Alternative:* Enter does nothing; the buttons are the only commit.
- **JQ-J4-6: the amount field's label.** **Default:** `<title> amount` (a card has three controls, and "SFR" alone would be ambiguous beside the buttons). *Alternative:* the title alone, as J3's stepper field is named.
- **JQ-J4-7: the TOL question (FN).** **Answered 2026-11-24 (Ken): the default, and F56 opens for Deighton.** **Default:** J4 ships as §3 says: one Cascade panel for the amount, no roll, and FN goes to Deighton with the evidence. *Alternative:* none. The answer changes only the TOL panel's shape, not this order's mechanics.

## 5. The assumption sweep

| What changes | True today (where) | After | Readers · where it renders · text that points at it |
|---|---|---|---|
| The − / + pair on a tracker | `data-trk="<id>\|-1"` and `"<id>\|1"` with the text "−1" and "+1" (sheet 1681, 1698, 1791-1792) | the same `data-trk` pair, with the amount field between them; the amount is read from `[data-trkamt="<id>"]` | Guards: smoke-sheet-play 491, 1073-1084, 2620-2655; smoke-sheet-archetypes 551 (the attribute, unchanged). Renders on the Trackers row for every tracker panel, the SFR popover and a named pool's popover. Text: any test or copy that says "+1" or "−1" on a tracker (grep: `"+1"`, `"−1"`, `+1`, `−1` in `tests/smoke-sheet-*` and `src/ui/sheet.js`). |
| `commit("tracker", "<title> ±1", …)` (sheet 4015) | the label is the title and a signed 1 | the label is the title and the signed amount (`signed(delta * amount)`): "SFR +6" | Readers: the Activity Log (its line for a tracker), Undo's label. Text: any test that reads "SFR +1" or "Activity" lines (grep `+1` in the activity tests). |
| `adjustPanelTracker(ch, id, delta)` (engine 4610) | takes any finite delta; stores 1e21 as given | unchanged; the UI parses and caps (1 to 9999) | Callers: startPower (4718), the runCost spends (4771), the Turn Reset (4804), the sheet's commit. Tests: engine.test.mjs 531-538, 3278-3288, 8916-9023, 12735 (unchanged). |
| `trackers.<resource>.turn` (engine 4573 `turnCount`) | counts each +1; a −1 takes back first (225) | counts the amount; a take-back takes back first; never below 0 | Readers: panelTracker's `turn` (4600), sfrTurn (sheet 1627), sfrRoundText (1629), sfrCardMeta (1637), Main's SFR card (561, the danger class), the SFR popover (1673, 1680, 1683), the Trackers row (1787, 1796). Print and the GM seat: grep `turn`/`sfrRoundText` in `print` and `gm` (the build's first check). |
| `sfrRoundText` copy | "N this round, M past your Rate of Use. Your GM's call." | unchanged | Text that points at it: Decision 225's wording ("the sheet warns at RoU and never blocks"), the popover's round line. Unchanged copy, so no voice pass. |
| TOL Spent's Cascade panel (sheet 1800, `cur>effMax`) | shows once when the count is past the max | unchanged; one panel for an amount | Readers: cascadePanelHtml (950), `overMax` in the data (2597, 3632). FN is opened and not answered; the panel stays as it is. |
| The Activity Log's line for a named pool | the pool's title and ±1 (J2) | its title and the signed amount | J2's Activity Log readers: trackerTitle. |
| The amount field's own state | none (new) | browser state, not saved: a map from panel id to the typed amount, kept on the sheet's view and dropped when the character changes | Constraint 7: never written into the character. W70's `S.loOpen` is the precedent for view state. |
| `tools/outputs.mjs` `visible()` (91-94) | `body.textContent` | reads each `input`'s and `textarea`'s value into the text | Readers: the whole snapshot (every archetype, power level and tab). Its diff is J4's proof, so it's fixed first (§12 step 1), on `main`, with the baseline. |

Three questions for each row, answered by grep: **which guards read a value this changes** (the three smoke files above; the Activity Log's tests; the round's readers); **where each new string renders** (the amount field's label on three twins, the two buttons' new labels, the commit label); **what text points at it** (the words "+1" and "−1" in tests and copy, and Decision 225's sentence). The build greps `"+1"`, `"−1"`, `"this round"` and `turn` across `src/`, `tests/` and `docs/` and records each hit as a row here or in the PR body.

## 6. Read first

- `CLAUDE.md`: hard constraints 3 (`index.html` stays a shell), 7 (store inputs: the amount is an input, the count is the stored number), 8 (the engine is total), 9 (no build state in copy), 10 (a character file is untrusted: `migrate()` is the gate), and *Working rhythm*.
- `SCHEMA.md` §4: Decisions 225 (the round), 266 (the one writer), 201 (Feeding never counts), 106 (the Cascade), 164 (`keepPlace`), 313 (J2's named pools' card), 314 (J3's typed field and its rules).
- `SCHEMA.md` §5: the flag table (FN is the next row).
- `engine.js`: `adjustPanelTracker` (4610), `panelTracker` (4600), `panelStore` (4583), `panelTurnCap` (4568), `turnCount` (4573), `sfr()` (897).
- `sheet.js`: `sfrPanel` (1626), `sfrTurn` (1627), `sfrRoundText` (1629), the SFR popover's case (1673), the pool popover (1694), the Trackers loop (1783), the commit handler (4015), `cascadePanelHtml` (950).
- `wizard.js`: `stepper()` (119), `stepTo`/`typedCommit` (1391-1430) — the typed-value rules J4 mirrors, not reuses.
- `CRB`: `private/crb/0480_Magic.md`, the TOL section (about line 107) and How TOL Is Spent (about line 390).

## 7. Out of scope

- **A stepper's amount (J3's control)** in the wizard, and any change to it: J3 is merged and its rules stay.
- **Typed numbers on the sheet's other controls** (Luck, Çredits, CRANK, damage). Damage already takes an amount through Take a hit.
- **The Cascade table** and any roll: the sheet still rolls nothing (Decision 106). FN is Deighton's.
- **A held spend** (JQ-J4-2's alternative), unless Ken answers it.
- **The release.** Cut by Ken after J4 merges (JQ6). No app bump here.
- **The outputs tool's other gaps** beyond input values (for example, the tool's sample of characters): a W-item if wanted.

## 8. The shapes

- **Engine: no change.** `adjustPanelTracker(ch, panelId, delta)` stays as it is. The test added in §10 pins what it already does: an amount counts, a take-back takes back from `turn` first, the count clamps at 0, a non-finite delta moves nothing and throws nothing. The engine doesn't bound the amount (1e21 is stored as given); the UI does (§9). That is deliberate: a bound is a rule about what the sheet accepts, and the UI is where the sheet accepts input.
- **Sheet (browser state, not saved):** `trkAmt` (a map from a panel id to the typed amount, default 1). Its reader is `trkAmount(id)`, which returns the typed whole number from 1 to 9999 or 1. It is cleared when the character changes, as other view state is (W70's precedent). It is never written to the character (constraint 7).
- **The parser:** `amountOf(text)` returns an integer from 1 to 9999, or `null` for anything else (zero, a fraction, letters, a blank, a sign, more than 9999). A `null` changes nothing and commits nothing (§9).
- **No data key, no save-file field, no `migrate()` step, no schema bump.** The panel's `resource`, `turnCap`, `overMax` and `counts` keep their meaning.

## 9. The UI

**The tracker's control, rendered:** `[ − ] [ amount ] [ + ]`, on each of the three twins. The amount is a text field, `inputmode="numeric"`, `pattern="[0-9]*"`, `autocomplete="off"`, `data-trkamt="<panel id>"`, value `1` or the typed amount, `aria-label` `<title> amount` (JQ-J4-6). The − and + keep `data-trk="<id>|-1"` and `"<id>|1"`, so the existing presses and their tests keep working at amount 1. Width: 48px; on a phone the buttons and the field are 44px (the same rule as J3's `.stepper`).

**What each action does:**

| Action | Writes | Focus lands | Announced |
|---|---|---|---|
| **+** (or Enter in the field) | `adjustPanelTracker(ch, id, +amount)` as one commit, then the amount goes back to 1 (JQ-J4-3) | the field's twin (164), so a second press on + is one tap away | the Activity Log line, "<title> +<amount>", once (W59) |
| **−** | `adjustPanelTracker(ch, id, −amount)` as one commit, then the amount goes back to 1 | the field's twin | "<title> −<amount>", once |
| Type a number, then leave the field | nothing (the amount is held in `trkAmt`; no commit) | the field stays where the player left it | nothing |
| **Escape** in the field | the field goes back to 1 | the field | nothing |
| Text that isn't a whole amount from 1 to 9999 | nothing; the field shows the last amount | the field | nothing (no message) |

**Copy** *(all marked for the voice pass)*: the buttons' accessible names: `Spend <amount> on <title>` and `Take back <amount> from <title>`, with the visible glyphs "+" and "−". The field's label `<title> amount`. The Activity Log line: the title and the signed amount, as the ±1 line is now. No new visible prose; the round line's words are unchanged.

**Twins:** the Trackers row (1787-1796), the SFR popover (1673-1683), a named pool's popover (1694-1700). A named pool's card on Main opens its popover (no buttons of its own), so it's covered. TOL Spent has no popover: its Trackers row is its only control.

**The round's warning:** unchanged. A spend that crosses Rate of Use shows the round line in the danger class (Main's card, the popover, the Trackers row) exactly as a press does now.

## 10. Worked examples, as named tests

Write these first; show each failing on `main` (or say why it passes). Files: `tests/smoke-sheet-play.test.mjs` (the sheet's, beside the J2 and J3 blocks at its end) and `tests/engine.test.mjs`.

`tests/smoke-sheet-play.test.mjs`:
- **`J4: every tracker control has an amount field on each of its twins`**: every `type: "tracker"` panel on the Trackers row, the SFR popover and a named pool's popover has a `[data-trkamt]` with its panel id, and a `data-trk` pair.
- **`J4: at the default amount a press is the ±1 it was`**: the SFR popover's + with the field at 1: spent 1, the Activity Log line "SFR +1", the same round as before.
- **`J4: a typed amount is one change and one Undo`**: type 6, Spend: spent 6, one Activity Log entry, Undo takes the 6 back and nothing else.
- **`J4: an amount counts against the round as its amount, and warns at and past Rate of Use`**: a vampire at Street (RoU 4): amount 3 then 3 more: the round line reads "3 of 4 this round", then "6 this round, 2 past your Rate of Use. Your GM's call.", the danger class on Main's card.
- **`J4: a take-back of more than the count stops at zero and takes back the round first`**: spent 2 and turn 2; take back 9: spent 0, turn 0, one entry, Undo restores spent 2 and turn 2.
- **`J4: an amount past TOL shows the Cascade panel once, with no roll`**: an Arcanist with TOL 1: amount 6 on TOL Spent: the Cascade panel appears once (`cascadePanelHtml`), the count is 6, no roll is recorded.
- **`J4: a named pool's amount moves its count and is named in the Activity Log`**: a J2 pool (`pool-aaaaaaaa`, as J2's tests use), amount 4 on its popover: the count moves by 4 and the log line names the pool's title.
- **`J4: text that isn't a whole amount from 1 to 9999 changes nothing`**: "x", "1.5", "0", "-2", "", "10000": each leaves the count and the log unchanged, and commits nothing.
- **`J4: Enter spends the typed amount and Escape puts the field back to 1`**: type 5, Enter: spent 5 and the field reads 1 after the press; type 7, Escape: the field reads 1 and nothing is spent.

`tests/engine.test.mjs`:
- **`J4: adjustPanelTracker takes an amount, takes a take-back from the round first, clamps at zero, and moves nothing on a non-finite delta`**: the three values from the probe (6, −9, Infinity) on a vampire at Street, plus a `turn` of 4 against RoU 4.

`tests/hostile.test.mjs`:
- **`J4: a hostile tracker title with markup is escaped in the amount's label and its Activity Log line`**: a named pool with `<img src=x onerror=…>` in its title; the field's aria-label and the log line show it as text.

`tests/voice.test.mjs`:
- **`J4: the amount's buttons and label say what they do, with no decision number or wish id`**: the new accessible names and the field's label contain no `Decision`, `W\d`, `TBD` or `F\d`.

## 11. Tests beyond the examples

- **Totality:** the parser (`amountOf`) on `NaN`-like text, `Infinity`, `-0`, `1e308`, a string of 400 digits, a number with a leading `+`: each returns `null` or an integer from 1 to 9999, and nothing throws (a unit test in `smoke-sheet-play`).
- **Mutation-test** the four rules the examples depend on: (a) the − stops clamping at 0 (the take-back test fails); (b) the commit ignores the amount and counts 1 (the "one change" and "round as its amount" tests fail); (c) the amount doesn't go back to 1 after a press (the "Enter spends" test fails); (d) TOL's Cascade panel counted per point (the TOL test fails). Save each file, copy the mutant in, run the named tests, copy the original back. Never `git checkout` a file you just edited.
- **The outputs diff** (§12 step 1 and step 5): the baseline is `main` at 883ce5e, taken with the fixed `visible()` in a scratch worktree with its own `npm ci` and its own temp dir. The diff against the PR is expected to show: the amount field's digit `1` on every tracker row and popover that renders, the new button names where the snapshot reads them, and nothing else. Any other difference is a finding.
- **Phone-check:** the Trackers row's three controls and a named pool's popover at 375px. Fails on `main` in this environment (`Over budget at: all.`): the check is that it fails the same way on the PR, with no new row.

## 12. Steps

1. **Pre-flight and the outputs fix.** `git submodule update --init private`; `npm run test:fast` on the fresh branch. Fix `tools/outputs.mjs` `visible()` to read `input` and `textarea` values into the text, in its own commit. Take the baseline snapshot on `main` at 883ce5e in a scratch worktree with its own `npm ci`, with the fixed tool, then `--against` on the branch later. **Expected on this commit alone:** no difference on `main`, since no field's value changed (the J3 stepper fields are now read; their digits match their spans).
2. Write §10's examples; show each failing on `main`. `npm run verify`.
3. The engine test (§10). No engine code change. `npm run verify`.
4. The sheet: the amount field and its handlers, the parser, the commit label, the three twins, the stylesheet's `.trk-amt` (48px; 44px on a phone). `npm run verify`.
5. §11's totality, the hostile and voice tests, the four mutations, the outputs diff against the baseline.
6. Docs: `SCHEMA.md` §4 (Decision N) and §5 (flag FN, with the evidence above); the INDEX §3 line and the INDEX §2 flag line; STATE rewritten (Pools and numbers: J4 built; the plan is complete; the release is Ken's); the plan's J4 row **Built** and its "Waits on" text corrected (the plan's correction in *Carried over*); W176 moved to `log/wishes-granted.md` with a pointer to this order; a line in `docs/log/2026.md`; a row in `docs/log/shipped.md`. `CHANGELOG.md` under `## [Unreleased] — app 0.76.0`, then `npm run changelog`.
7. **Dev preview** (`shadows-dev-preview`, seeded with `shadows.active.v1` per the memory recipe, a vampire at Street and an Arcanist with TOL spent): at **375px**, type 6 on SFR, Spend, and check the round line and the danger class; type 9 on a take-back past zero; type "x" and check nothing moves; Enter and Escape; the Cascade panel once on TOL. `scrollWidth == clientWidth` on the Trackers row and the popover. Check Tab out of the field keeps focus on the next control (the J3 lesson: the commit waits a tick, not during the focus move).
8. Close-out (§14). `npm run verify` last.

## 13. Stop and ask

- If JQ-J4-2 is answered "held to what's left": stop; the held amount is a new rule with its own tests (the order's §3 changes).
- If the FN answer arrives before the build and changes the TOL panel's shape: stop and amend §3 and §9 first.
- If the outputs diff shows anything beyond §11's expected lines: stop.
- If a test pins the text "+1" or "−1" in a way the copy change breaks: update the test to the new accessible name and say so in the PR body. This is an expected break, not a stop.
- **Not stops:** the attribute `data-trk` and its tests (unchanged); the phone-check failure on `main` (environmental: say so, don't fix it).

## 14. Close-out

Per the `close-the-session` skill, *Rule or shape*:
- Decision **N** (§3) in `SCHEMA.md` §4 and its INDEX §3 line; 225 and 266 get an extends note, no supersession mark. Flag **FN** in `SCHEMA.md` §5 and INDEX §2.
- **No `npm run bump`** (§2). No `gamedataVersion` or schema change.
- `CHANGELOG.md` under `## [Unreleased] — app 0.76.0`, then `npm run changelog`:
  - "**You can spend several at once on a tracker.** Type an amount beside the − and + and press +: it's one change, one Undo, and the round counts the whole amount. At or past your Rate of Use, the round line says so, as before."
- W176 moves to `log/wishes-granted.md`. A line in `docs/log/2026.md`; a row in `docs/log/shipped.md`; STATE rewritten. The plan's J4 row **Built** (Decision N). The plan is complete when J4 merges.
- **PR title:** `feat(sheet): spend several at once on a tracker (Decision N, J4)`. Body: the template's sections, plus **Where the order didn't fit** and every new string as it renders (for the voice pass). **Say in the body: merge as a squash.** Say in the body: the phone-check failure on `main` is environmental (see the header).

**Review checklist:**
- Every *Done when* line has its named test, and each fails on `main`.
- The three twins (the Trackers row, the SFR popover, a named pool's popover) each carry an amount field; the table in §5 has no row the build didn't check.
- A typed amount is one `adjustPanelTracker` call per commit: grep the sheet's new code for `ch.trackers` and `.spent`/`.turn`: nothing writes them except through `adjustPanelTracker`.
- The amount is browser state: nothing in §8's `trkAmt` reaches the character or a save file.
- The outputs diff is §11's expected lines and nothing else, read through the fixed tool.
- The four mutations fail as §11 says.
- No new copy names a decision, a wish id or "TBD" (`voice.test.mjs`).
- FN is opened with the CRB evidence and is **not** answered in code.
- No app bump; no schema or game-data bump.
- The plan's J4 row, the W176 Plan line and the INDEX lines are all updated.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md` with this order's path, `docs/plans/pools-and-numbers/J4-spend-several.md`, plus these traps:

- **Fix the outputs tool first, on its own commit, and take the baseline on `main` before any J4 change.** J3's proof had to read field values in a scratch copy; J4's proof is the same kind of diff, so it can't rely on the text snapshot.
- **`adjustPanelTracker` already takes an amount.** The work is the UI and the one commit label. Don't add a second writer, and don't cap in the engine: the cap is the sheet's input rule (§9).
- **`data-trk` keeps its `|d` form.** The tests that press it keep working at amount 1; don't rename the attribute to save a line.
- **The amount is not J3's control.** Don't import `stepTo` or `typedCommit`; they're bound to the wizard's `applyStep`. Copy the rules (whole number, Enter spends, Escape resets), not the code.
- **The TOL Spent Cascade is shown, not rolled, and FN is Deighton's.** Don't add a roll or a per-point count to answer it in code.
- **Focus after a spend.** The field's commit redraws the card; `keepPlace` (164) must put focus back on the field's twin. The Tab-out lesson from J3's review applies: a commit on `change` waits a tick.
