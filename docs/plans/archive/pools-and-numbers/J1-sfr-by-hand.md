# Work order J1: SFR max and Rate of Use by hand

**Plan:** [`../pools-and-numbers.md`](../pools-and-numbers.md) §3, row J1. **Source:** Deighton, through Ken (2026-11-22): in Admin mode, adjust a character's maximum SFR, up or down. Ken added Rate of Use (JQ1, yes) and the plan's defaults (JQ2–JQ8, 2026-11-22). **Riders:** W174 (Esc in ⋮) and W153 (the no-data heading), both *Fix*.

**Built on:** Decision 26 (the Manual Adjustments ledger), 199 and 223 (Majors' `rou` and `sfrMax` grants), 225 (the round's count against RoU, the Custom pool's max), 266 (`adjustPanelTracker`, `powerCostCap`), 201 (Feeding reads the max), 278 (Esc one layer at a time), 306 (switches in ⋮).

**Status: drafted 2026-11-22** by Claude (Opus), the plan's conductor, at Ken's request ("Draft J1"). **Approved by Ken 2026-11-22: "All defaults"** (JQ9–JQ12 on their defaults).

**Branch:** cut from `origin/main` at the pre-flight commit. PR to `main`. Nothing ships switched off. **No release** at the end (JQ6): the app version moves to the next minor and J2–J4 add their lines under the same heading.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **J1 build** (Sonnet), then a fresh **J1 review** (Opus) once the PR is open. §15 is the hand-over.

**Runs alone.** It touches `engine.js` (`sfr()`, `panelMax`, `panelTracker`), `sheet.js` (Manual Adjustments, the Trackers SFR panel, Admin), `app.js` (Esc, the no-data screen), `shadows-data.js` (`appCopy`, one string), the tests and the docs.

**Carried over:** nothing; J1 is the plan's first order. From K4's review, as standing practice: the PR body's sections are checked last, and the browser walk is a named list (§12).

**Pre-flight against `main` at `a81ad6c`** (#379 merged). Take the next free decision number on `origin/main` when it's written (311 is the last there today); the order says **N**.

```
sfr()            engine.js:896-911. A scaling row with startingSFR: value = formula(WILL…) + grants().sfrMax;
                 rou = row.rou + grants().rou when row.rou is a number (every row's is: data 2994-3015, 3303-3324).
                 No scaling row (the Custom pool, Decision 225): { value: playerPool(ch), rou:null, setBy:"player" }.
                 adjFor(ch,"SFR") / adjFor(ch,"ROU") are read NOWHERE: an adjustment row with either target is
                 kept by migrate() (5742) and ignored (probe below).
panelMax         engine.js:4520. "startingSFR" → sfr().value (so the Werewolf's and Vampire's panels follow sfr()).
                 max==null → storedMax(ch,p): the Custom pool's typed number, read DIRECTLY, not through sfr().
                 >>> An adjustment added only in sfr() would move the card and every spend check, and not the
                 Custom pool's Trackers panel. Both must move (JQ3).
panelTracker     engine.js:~4559. out.manual = p.max==null && max!=null. sheet.js:1749-1756 shows max in the
                 data-trkmax box when manual, so the box would show the ADJUSTED max and an edit would store it.
panelTurnCap     engine.js:4527: turnCap "rou" → sfr().rou. powerCostCap 4670 the same (the Vampire's).
Readers of       sheet.js 349/362 (vitals pill), 377/393 (drawer row), 516/547 (Main's card, sfrCardMeta 1624),
sfr().value/rou  1658-1667 (popover), 1749 (Trackers, via panelTracker). wizard.js 86, 108-109 (a draft: no
                 adjustments exist before lock). engine.js 4657 (canStart), 4695 sfrLeft (surge), 4748
                 resetRunning, 4783 hit reactions, 5220 feedView (upTo and unfed read the max and RoU),
                 2770 (the SFR word's `absent`). All read sfr(): they move with it, and each keeps its
                 Math.max(0, …) on what's left. gm.js reads none (grep -i sfr src/ui/gm.js: nothing). Print
                 shows no SFR (sheet.js 3176-3245).
Manual Adjust.   sheet.js:1800-1820 (render, on Trackers, not Admin-gated): a <select data-adjtarget> written in
                 code: the stats (cascade), TOL, WILL, SAN, LUCK, HP. The journal row prints a2.target raw.
                 Binder 4197-4210: commit("adjustment", …) pushes { target, amount: trunc, note, date }.
                 The step-note at 1803 names "TOL, WILL and the maximums".
Admin            renderShAdmin, sheet.js:2801. Intro is appCopy.introAdmin (pinned by smoke-sheet-progression
                 818, 852 and smoke-sheet-help 155): don't change it. S.admin stays on across tabs (sheet.js:69).
Esc / ⋮          app.js:403 closeMenu (hides #hdrmenu, aria-expanded=false, moves no focus). 404-413: Esc closes
                 vitals or Help, then closeMenu(). Focus stays on the hidden item: the next Tab starts at <body>.
                 The What's new click (416-421) already focuses ⋮ after closing: the pattern to copy.
No-data          app.js:362-365: <h1>No game data</h1> + "Place shadows-data.js next to this file and reload."
                 No test pins it (grep "No game data" tests/: nothing). The built file inlines the data, so only
                 the source folder can show it.
Tests today      No smoke test presses data-adjadd (grep: none). smoke-sheet-play 1070-1080 presses the SFR
                 card's +1. hostile.test.mjs:75 writes a hostile adjustment row (target, amount, note, date).
Ledger           "Manual adjustments" Touches: 26 (and 217 in part). "Rate of Use": 199, 223, 225, 266. "Admin":
                 230, 263's Admin line, 298. None says SFR can't be adjusted; 26's list simply stops at HP.
```

**Probes on `main`** (a locked character, every Basic Stat 5, `tests/_probe_j1.mjs`, deleted after):

| Character | `sfr()` | Trackers panel |
|---|---|---|
| Werewolf (WILL 1) | value 8, rou 3, formula `WILL × 3 + 5` | max 8, shown 8, turn cap 3 |
| Werewolf + `{ target:"SFR", amount:2 }` | value **8** (ignored) | max **8** |
| Vampire (WILL 1) | value 11, rou 4 | max 11, turn cap 4 |
| Custom, Uses SFR, typed max 20 | value 20, rou null, setBy player | max 20, manual |
| Custom + `{ target:"SFR", amount:-3 }` | value **20** (ignored) | max **20** |
| Professional, Arcanist | null | no panel |

---

## 1. Goal and Done when

A GM, or a player at the GM's word, moves a character's **SFR max** or its **Rate of Use** up or down, with a reason, and Undo takes it back. Every number worked out from either moves with it.

**Done when:**
- Manual Adjustments offers **SFR max** to a character with an SFR pool and **SFR Rate of Use** to one whose pool has a Rate of Use; a Professional sees neither.
- A Werewolf with SFR 8 and +2 SFR max reads 10 on Main's card, the vitals pill, the popover and the Trackers panel; a spend check and Feeding's cap read 10.
- A Vampire with RoU 4 and +1 reads RoU 5 on Main's card, the round's line warns at 5, and a Start's "more than your RoU" reads 5.
- A Custom pool typed at 20 with −3 reads 17, and its max box still shows 20.
- Neither number goes below 0, whatever the ledger holds.
- The Trackers SFR panel says what's been added by hand.
- Admin has a button that opens Trackers at Manual Adjustments.
- Esc with ⋮ open puts focus back on ⋮ (W174).
- The no-data screen speaks in tool voice (W153).

## 2. Tier, versions, numbers

- **Rule or shape** (engine behaviour; it extends Decision 26). One decision, **N**.
- **App:** minor, 0.75.1 → **0.76.0** (`npm run bump -- 0.76.0`).
- **Game data:** no bump. The new `appCopy` string changes no computed value or choice (Decision 68); the targets are code, as 26's are.
- **Character schema:** no bump. An adjustment row already holds any target string, and `migrate()` keeps it (engine.js 5742).
- **W174, W153:** Fix riders, no decision. Their INDEX statuses don't exist (they're wishes): their entries move to `log/wishes-granted.md`.

## 3. The decision, drafted in full

```
N. **SFR max and Rate of Use take Manual Adjustments, as the other maximums do.**
   *2026-11-22 · Deighton + Ken + Claude · Touches: Manual Adjustments, `sfr()`, `panelMax`, `panelTracker`, SFR max, Rate of Use, the Custom SFR pool, Admin*
   - **Decided:** Two more targets join Decision 26's ledger: `SFR` (the pool's max) and `ROU` (its Rate of Use), read by `sfr()` after the formula and the Majors, and never below 0. They're offered only to a character whose pool has that number; a Custom pool's adjustment adds to the max its player typed, which stays what the box shows. What's left is the max less what's spent, so raising the max raises it, as HP's does. Admin opens them with a button; it has no control of its own.
   - **Why:** Deighton wanted a GM to rule SFR up or down, and the ledger already does that for SAN, LUCK and HP: a delta with a reason, logged and undone, that keeps moving when WILL does.
   - **Rejected:** a number on Admin that sets the max outright (freezes it against a later WILL raise, says nothing about why, and is a second way to say what the ledger says, JQ2); keeping what's left still when the max moves, as Drained does for TOL (Decision 110), since an SFR ruling is about the pool's size and HP's max already moves what's left (JQ9); the target list moved into the data (26's targets are code, and a target is something the engine reads, Decision 135).
   - **Replaces:** nothing. Extends 26 (its targets) and 225 (the Custom pool's max).
   - **Revisit if:** a rule in the book or a Major starts adjusting SFR or RoU the same way across many entries; then it's a `grants` type, as `sfrMax` and `rou` already are.
   - **Built:** app 0.76.0, PR #…, log entry 2026-…
```

INDEX §3, under *Sheet & play tracking* (where 26 is; 225 is under *Archetypes & specialization*):

```
- **N** *(SFR max and Rate of Use by hand — pools-and-numbers J1)* — Manual Adjustments' `SFR` and `ROU` targets, read by `sfr()` after the formula and Majors, never below 0, offered only where the pool has that number; a Custom pool's adds to its typed max, which the box keeps showing; Admin has a button to them. Extends 26 and 225.
```

## 4. Questions for Ken

JQ1–JQ8 are the plan's (answered). This order's, **answered 2026-11-22 (Ken): Default on all four.**

- **JQ9 — Raising the max raises what's left.**
  - **Default:** yes. Spent is what's stored, so +2 SFR max gives +2 left, as +2 HP max does today.
  - *Alternative:* keep what's left where it is, by moving spent with the max, as Drained keeps current TOL (Decision 110). It's the right call for a scar, less so for "you're +3 after the ritual".
- **JQ10 — Where the sheet says it's been adjusted.**
  - **Default:** one line on the Trackers SFR panel ("+2 max and −1 RoU by hand, in Manual Adjustments"), and the Manual Adjustments journal. Main's card keeps its short line (Decision 225: it never grows into a sentence).
  - *Alternative:* also in the SFR popover.
- **JQ11 — Admin's way in is a button, not a guide line.**
  - **Default:** a button, **Adjust a maximum**, under Admin's Budgets, that opens Trackers at Manual Adjustments with focus on its target. A button isn't a guide line, so **Guide lines** off (Decision 298) doesn't hide it.
  - *Alternative:* a guide line in `sheetGuide.lines`, hidden with the others.
- **JQ12 — The no-data screen's words** (W153; tool voice, marked for the voice pass).
  - **Default:** heading **This sheet is missing a file**, then "Put `shadows-data.js` back in the folder beside this page, then reload."
  - *Alternative:* keep the heading's shape: **The sheet's rules didn't load**.

## 5. The assumption sweep

| What changes | True today (where) | After | Guards that read it · where it renders · text that points at it |
|---|---|---|---|
| `sfr().value` | formula + `grants().sfrMax`; Custom: `playerPool` (engine 896-911) | + `adjFor(ch,"SFR")` in both branches, then `Math.max(0, …)` | Guards: `canStart` 4657, `sfrLeft` 4695, `resetRunning` 4748, hit reactions 4783, `feedView` 5220 (`upTo`, Hunger's `low.at`), the SFR word's `absent` 2770 (an adjustment never makes a pool appear: only offered where one exists). Renders: pill 362, drawer 393, Main card 547, popover 1660-1667, Trackers 1749. Text: none names the formula's total |
| `sfr().rou` | `row.rou + grants().rou` when a number; Custom null | + `adjFor(ch,"ROU")` when a number, then `Math.max(0, …)`; null stays null | Guards: `panelTurnCap` 4527 (the round's at/past), `powerCostCap` 4670 (Vampire's "more than your RoU"), `feedView`'s `unfed` (half RoU). Renders: `sfrCardMeta` 1625, popover 1667, `sfrRoundText` 1616, the Start/Surge commit labels 3963/3979, wizard 109 (a draft: none) |
| `sfr()`'s report | `fromMilestones: { rou, sfrMax }` | also `byHand: { sfrMax, rou }` (0 when none) | Read by J1's Trackers line only. `fromMilestones` keeps its meaning (Majors) |
| `panelMax` for an `sfr`-resource panel with `max == null` | `storedMax(ch,p)`, unadjusted (4523) | `storedMax + adjFor(ch,"SFR")`, floor 0, when a max is typed; null while none is | Every `panelTracker` and `adjustPanelTracker` reader. **Twin:** must equal `sfr().value` (a test pins it) |
| `panelTracker(ch,p)` | `manual` true for a typed max; the box shows `max` (sheet 1750) | adds `typed`: the stored number, or null. The box shows `typed`; the big number shows `max` | `data-trkmax`'s binder 4190 stores the box's value: unchanged, it now stores what was typed, never the adjusted max |
| Manual Adjustments' targets | code list, sheet 1805-1808 | + **SFR max** (`SFR`) when `sfr()` has a value, + **SFR Rate of Use** (`ROU`) when its `rou` is a number | The journal (1813-1818) prints `target` raw: it prints the option's label for a known target, the escaped raw text otherwise (a hostile file). The step-note 1803: "TOL, WILL, the maximums and Rate of Use take the amount as it is" |
| Admin | no SFR control (2801-) | a button (JQ11) | Lands: Trackers, scrolled to Manual Adjustments, focus on `[data-adjtarget]`, Admin still on (sheet.js:69) |
| Esc with ⋮ open | `closeMenu()`, focus left on a hidden item (app 412) | focus moves to `[data-menu-toggle]` when the menu was open and focus was inside it | An outside click (415) still closes without moving focus. A modal or popover open: unchanged (the layer check at 408). K4's switch press keeps ⋮ open (Decision 306): not Esc, untouched |
| No-data screen | app 363-364 | JQ12's words | Can't use `appCopy` (the data didn't load): stays a literal in `app.js`. `voice.test.mjs` doesn't read it today |

## 6. Read first

- `CLAUDE.md`: hard constraints 7 (store inputs: the ledger holds the delta, never the total), 8 (the engine is total) and 10 (a file is untrusted). The *Fix* and *Rule or shape* tiers.
- `SCHEMA.md` §4: Decisions 26, 110, 225, 266, 278, 298, 306.
- `engine.js`: `adjFor` (156), `sfr()` (896), `playerPool`/`storedMax`/`panelMax`/`panelTurnCap` (4510-4530), `panelTracker` and `adjustPanelTracker` (~4559-4586), `migrate()`'s adjustments (5742).
- `sheet.js`: `renderShTrackers` (1681; Manual Adjustments 1800), its binder (4197), the SFR panel (1745-1760), `renderShAdmin` (2801), `commit()`.
- `app.js`: the `keydown` Esc branch and `closeMenu` (403-421), `boot()` (361).

## 7. Out of scope

- A typed override of the max anywhere (JQ2's alternative).
- The Custom pool's Rate of Use: it has none (Decision 225), and J1 doesn't give it one.
- Moving the target list into the data.
- Typing an amount on the tracker (J4), named pools (J2), wizard steppers (J3).
- `introAdmin`'s words; `sheetGuide`'s Admin context. (Help's Admin context may name the button only if K2's word list needs it; it doesn't.)
- C3 (`panelMax` / SFR display copy) stays open: it waits on F6 and F7.

## 8. The shapes

**No data shape and no save-file shape changes.** An adjustment row is `{ target, amount, note, date }` as now, with `target` `"SFR"` or `"ROU"`.

```js
// engine.js, sfr(): both branches end through one helper
const byHand = ch => ({ sfrMax: adjFor(ch, "SFR"), rou: adjFor(ch, "ROU") });
// Custom:  own==null ? null : { value: Math.max(0, own + h.sfrMax), rou: null, formula: "", setBy: "player", byHand: h }
// A row:   value: v==null ? v : Math.max(0, v + g.sfrMax + h.sfrMax)
//          rou:   typeof row.rou==="number" ? Math.max(0, row.rou + g.rou + h.rou) : row.rou
//          fromMilestones unchanged; byHand: h
```

- `panelMax(ch, p)`: when `p.max == null` and `p.resource === "sfr"`, a typed max `m` gives `Math.max(0, m + adjFor(ch,"SFR"))`; no typed max gives null, as now. Other panels: unchanged.
- `panelTracker(ch, p)` returns `typed: p.max==null ? storedMax(ch,p) : null` beside `manual`.
- **On bad input** (constraint 8): `adjFor` sums `amount`, which `migrate()` makes a number; a sum past ±1e15 still floors at 0 and stays finite. A `target` that's not a string is never `"SFR"`. None of these throws.

## 9. The UI

**Manual Adjustments** (Trackers). Two options after HP max, in this order, each only when it applies:
- **SFR max** (value `SFR`), when `Engine.sfr(ch)` has a value.
- **SFR Rate of Use** (value `ROU`), when its `rou` is a number.

The journal row reads the option's label for `SFR` and `ROU` ("SFR max", "SFR Rate of Use") and for the existing targets as now; any other target prints escaped, as now. A row whose target isn't offered any more (the pool went away) still lists and can be removed. The step-note becomes: "A Stat moves everything worked out from it. TOL, WILL, the maximums and Rate of Use take the amount as it is, and the Stats they come from don't move." *(voice pass)*

**The Trackers SFR panel** (JQ10) gains one sub line when `byHand` has a non-zero number: "+2 max by hand", "−1 RoU by hand", or both joined with " and ", then ", in Manual Adjustments." *(voice pass)* The big number is the adjusted max; a Custom pool's box shows `typed`.

**Admin** (JQ11): a button **Adjust a maximum** after Budgets. Pressing it:

| Press | Where the view lands | Focus |
|---|---|---|
| **Adjust a maximum** on Admin | Trackers, Manual Adjustments' heading in view; Admin mode still on | `[data-adjtarget]` |

Its label is `appCopy.adminAdjustMaximum` (data, read by code). It's a control, so **Guide lines** off leaves it.

**Esc with ⋮ open** (W174): the menu closes and focus goes to the ⋮ button, as What's new's close already does. Only when the menu was open and focus was inside it.

**No-data screen** (W153): JQ12's words, a literal in `app.js` (no `appCopy` without data).

## 10. Worked examples, as named tests

Write these first; show each failing on `main` (or say why it passes).

`tests/engine.test.mjs`:
- **`J1: an SFR adjustment moves a Werewolf's pool and its tracker`**: the probe's Werewolf (8). +2 → `sfr().value` 10, `byHand.sfrMax` 2, panel max 10, shown 10.
- **`J1: a ROU adjustment moves Rate of Use and the round's cap`**: the probe's Vampire (rou 4). +1 → `sfr().rou` 5, `panelTracker(...).turn.cap` 5; with 5 spent this round, `turn.at` true.
- **`J1: SFR and Rate of Use never go below 0`**: Werewolf, SFR −50 and ROU −50 → value 0, rou 0; shown 0; nothing throws.
- **`J1: a Custom pool's adjustment adds to its typed max, and the box keeps what was typed`**: Custom, Uses SFR, typed 20, −3 → `sfr().value` 17, panel max 17, `typed` 20. Pins the twin: `sfr().value === panelTracker(...).max` for every probe row.
- **`J1: a character with no SFR pool ignores SFR and ROU adjustments`**: Professional with both → `sfr()` null; no panel.
- **`J1: a Custom pool has no Rate of Use to adjust`**: Custom, ROU +2 → `rou` null.

`tests/smoke-sheet-play.test.mjs`:
- **`J1: Manual Adjustments offers SFR max and Rate of Use to a Werewolf, and neither to a Professional`**.
- **`J1: +2 SFR max reads 10 on Main's card and the Trackers panel, and Undo takes it back to 8`**: apply through the form; the panel's line says "+2 max by hand"; one Undo.
- **`J1: the journal names SFR max and SFR Rate of Use`**.
- **`J1: Admin's Adjust a maximum opens Trackers with focus on the target`**.
- **`W174: Esc with ⋮ open puts focus back on ⋮`**: open ⋮, focus an item, Esc → menu hidden, `document.activeElement` is `[data-menu-toggle]`. Then: a click outside with ⋮ open doesn't move focus.

`tests/smoke-roster.test.mjs` (or wherever boot without data can be run; if the harness can't boot without `SHADOWS_DATA`, say so in the PR and pin the words with a source read in `build.test.mjs`):
- **`W153: the no-data screen says which file is missing`**.

## 11. Tests beyond the examples

- **Hostile** (`hostile.test.mjs`): the hostile character also gets `{ target:"SFR", amount: <hostile> }` and `{ target:"ROU", … }`; every reader stays a finite number ≥ 0, and the journal prints a hostile target as text.
- **Totality** (`engine.test.mjs`'s sweep over `migrate()`-able characters): `sfr()` and `panelTracker` return for every one with the new targets present.
- **Nothing else moves:** with no `SFR`/`ROU` rows, every archetype's `sfr()` and SFR panel are as on `main`. Script it over every archetype and specialization (`WORK-ORDERS.md`, *Prove "nothing else moves" by a diff*), not a few pins.
- **Mutation-test:** remove `adjFor(ch,"SFR")` from `panelMax` (the Custom twin test must fail); remove the `Math.max(0` floor on `rou` (the floor test must fail); remove the focus line in Esc (W174's test must fail).

## 12. Steps

1. `git submodule update --init private`; `npm run test:fast` on the fresh branch.
2. Write §10's engine examples; show them failing on `main`. Build `sfr()`, `panelMax`, `panelTracker.typed`. `npm run verify`.
3. Write the sheet examples; build Manual Adjustments' options, the journal labels, the step-note, the Trackers line and the Custom box's `typed`. `npm run verify`.
4. Admin's button and its landing. `npm run verify`.
5. W174, then W153, each with its test. `npm run verify`.
6. §11's hostile, totality, the outputs diff and the three mutations.
7. **Dev preview** (`shadows-dev-preview`; seed a locked character per the memory note on `shadows.active.v1`): a Werewolf: +2 SFR max, check Main's card, the pill, the popover and Trackers; Undo. +1 RoU: spend to the cap on Main's card and see the warning at the new number. A Custom pool: type 20, −3, check 17 and the box's 20. Admin: **Adjust a maximum**, check focus. ⋮ then Esc. At 375px: Manual Adjustments' select and Admin's button don't overflow (`scrollWidth` against `clientWidth`).
8. Close-out (§14). `npm run verify` last.

## 13. Stop and ask

- If a reader of `sfr()` or `panelMax` exists that §5 doesn't list, and it would show an unadjusted number: stop.
- If showing `typed` in the Custom box breaks something the box's binder relies on: stop.
- If any rules text in the data or CRB mirror says what SFR max or RoU adjustments do (`grep -i "rate of use" private/crb`): stop, it's Deighton's.
- **Not stops:** the version literals `npm run bump` moves; a test asserting Manual Adjustments' old step-note (update it to §9's); a test that counts the `<option>`s of `[data-adjtarget]` on a character with SFR.

## 14. Close-out

Per the `close-the-session` skill, *Rule or shape*:
- Decision **N** (§3) in `SCHEMA.md` §4 and its INDEX §3 line. 26's entry gets no supersession mark (extended, not replaced).
- `npm run bump -- 0.76.0`. `CHANGELOG.md` under `[Unreleased] — app 0.76.0`, then `npm run changelog`:
  - "**Your GM can move your SFR.** Manual Adjustments on Trackers take SFR max and Rate of Use, up or down, with a note, and Undo takes it back. Admin has a button that goes straight there."
  - "**Esc in the ⋮ menu** puts you back on ⋮, so the next Tab carries on from there."
  - "**A sheet missing its rules file** says which file and what to do."
- W174 and W153 move whole to `log/wishes-granted.md` with a pointer to this order. A line in `docs/log/2026.md`; a row in `docs/log/shipped.md`; STATE rewritten (§5's Pools and numbers line: J1 built, J2 next). This plan's J1 row: **Built** (Decision N, app 0.76.0).
- **PR title:** `feat(sheet): SFR max and Rate of Use by hand (Decision N, J1)`. Body: the template's sections, plus **Where the order didn't fit** and every new string as it renders (for the voice pass).

**Review checklist:**
- The Custom twin: `sfr().value` and the Trackers panel's max agree, and the box shows what was typed.
- Every row of §5 checked by grep, including the readers that aren't about display (Feeding, Hunger's line, `powerCostCap`, Turn Reset's stops).
- The Admin button lands where §9's table says, in the browser.
- Esc's focus change doesn't fire on an outside click, or with a modal or popover open.
- The outputs diff over every archetype is empty without the new rows.
- The three mutations fail as §11 says.
- No new copy names a decision, a wish id or "TBD" (`voice.test.mjs`).

## 15. Handing it over

The two prompts in `WORK-ORDERS.md` with this order's path, `docs/plans/pools-and-numbers/J1-sfr-by-hand.md`, plus these traps:

- **The Custom pool reads its max twice.** `sfr()` and `panelMax` both read the typed number; adjust one and not the other and the card and the tracker disagree. §10's twin test is there for it.
- **The box must keep what was typed.** If it shows the adjusted max, the next edit stores the adjusted number and the adjustment counts twice.
- **Floor after summing, not per part.** A Major's +6 and a −8 adjustment give 0 from a pool of 1, not 0 and then +6.
- **Esc's focus is for the menu only.** `closeMenu()` is also the outside click's (app.js 415), which must not pull focus back.
