# Work order J3: type a number into a stepper

**Plan:** [`../pools-and-numbers.md`](../pools-and-numbers.md) §3, row J3. **Source:** **W121** (type a number into a stepper), with rider **W152** (an overspent pool reads with a true minus), both named in the plan's J3 row.

**Built on:** Decision 164 (a press that re-renders keeps the keyboard's place: `keepPlace`, `PLACES`), W59 (a control says what it changes, and the new value is announced), 312 (J1, the last decision on `main` before J2's 313), 313 (J2: its pool steppers are wizard-free, so J3 doesn't touch them, but its Remove and Add follow the same focus rule).

**Status: drafted 2026-11-23** by Claude (Opus), the orchestrator, from the approved plan row. **Awaiting Ken's approval.** His answers to the questions in §4 are recorded (2026-11-23, all on the defaults); the order is not approved, and no builder starts until he says so.

**Branch:** `claude/j3-typed-steppers`, cut from `origin/main` at **0be3075** (J2 merged, #383). PR to `main`. Nothing ships switched off. **No release**; its lines go under `## [Unreleased] — app 0.76.0` (JQ6: the release is cut once, after J4). **No app bump.**

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **J3 build** (Sonnet), then a fresh **J3 review** (Opus) once the PR is open. Nothing here says a builder has started.

**Runs alone** (the plan's default). It touches `wizard.js` (`stepper()` and its 17 call sites, `applyStep`, the `[data-step]` binder, the wizard's pool and CP pills), `shared.js` (`PLACES`, `announceStep`, `keepPlace` only if the field needs a twin rule), the stylesheet (the typed value's width), the tests and the docs. J4 reuses the control, so J4 waits for this.

**Pre-flight against `main` at `0be3075`.** Take the next free decision number on `origin/main` when it's written: **313** is the last there (`SCHEMA.md` §4), so this order says **N** (314 today).

```
stepper()          wizard.js:119. Returns a div: a − button (data-step "<key>|-1"), <span class="val">, a + button
                   (data-step "<key>|1"). The name lives in data-name; aria-label is "Lower <name>" / "<up> <name>".
call sites         17, not the plan's 16: wizard.js 262, 385, 412, 439, 442, 501, 506, 594, 639, 667 (twice, open and
                   closed branch), 680, 696, 712, 737, 790, 798. Stats, focus, wwbonus, natural advantages (2), Base
                   Powers (2), skills, disadvantages, advantages (2), luck, disciplines, power ranks (2), boosts (2).
[data-step] binder wizard.js:1075. Splits "<key>|<delta>", calls applyStep(key, delta), update(), announceStep(step),
                   and re-focuses the CP list's fold button if the pressed − folded its pick away (Decision 279).
applyStep          wizard.js:1268. One rule per kind: stat (floor D.statRules.base; cap by statAtCap), skill (0 ..
                   skillRankCap, deletes at 0, trimSelections), focus (statAtCap(…, true)), wwbonus (≥ 0), natadv (creates
                   the row on the first +1, mirrors into advantages, keeps selections), adv and disadv (their own gates),
                   luck (≥ 0 bonus), disc (buyDisciplineRank), bp (placeBasePower), apow (buyPowerRank), boost (addBoost).
                   Every refused press is a bare `return` (no message): the press is simply not taken.
announceStep      shared.js:113. Finds the pressed button by its data-step and announces "<name> <value>" after the
                   redraw, via announce() (a live region).
keepPlace         shared.js; Decision 164. PLACES (shared.js:254): ".trk, .alloc-row, .pick, details, tr, .sect".
                   A redraw refocuses the pressed control's twin, or the card it sat in.
W59               its own announcement: "each control says what it changes, and the new value is announced".
                   A native spinbutton announces itself, so a typed field must not double up with announce().
Pills (W152)     wizard.js:50-56 (the rail's three pills) and 73-74 (the Vitals flyout's pills): `${left}<small>/${total}</small>`
                   reads a JS number, so a negative reads "-3" with a hyphen-minus. The sheet's numbers use numText or
                   signed (shared.js:30, 32), which print a true minus (E5). The wizard's rail rows (wizard.js 75-80,
                   `vrow`) use plain `(a−b)+" / "+total`, the same hyphen. voice.test.mjs checks the minus on the sheet only.
Tests that pin     smoke-wizard.test.mjs:1280 pins a stepper's children as ["BUTTON","SPAN.val","BUTTON"]: a typed field
the markup         changes that (expected, §13). smoke-wizard 1234 and 1503 check `.stepper .val` exists (also expected).
                   smoke-sheet-archetypes, smoke-sheet-play, smoke-sheet-skills use data-step on the sheet's Admin
                   base-power row (sheet.js:4734), which is not a `stepper()` call and does not change.
Ledger             "stepper", "W59", "Decision 164", "keepPlace": 164 and 279 (fold), 266 (SFR's and TOL's ±1). None says a
                   stepper's value must be a span: the markup is free. 164 binds the focus rule the typed field needs.
Probes on main     (read from code, not run; the builder's first test shows each one failing on main.)
                   - a Stat's − at base 1 (statcap floor) is disabled: `downOk` = v > D.statRules.base.
                   - the Stats pill at −3 renders "-3" (wizard.js 52: `${sLeft}`), so W152's example is real.
                   - Advantages: an adv's + when `affordable` is false is disabled, not refused in applyStep: a typed
                     value would go past that gate unless the loop checks the button's state, not only applyStep.
Outputs            J3 changes every wizard step's markup (the value span becomes a field), so the outputs diff over the
snapshot           wizard steps will list every stepper. Expected: the markup of the value cell and the W152 pill minus,
                   nothing else. A value's text stays the same, so the rendered text diff is the field's own text only.
```

**Phone-check on `main` is environmental.** `npm run phone-check` fails on `main` at `0be3075` in this environment: row 301, `'all'`, `'frame fixture (94 frames)'`, "1 differ: sheet: trackers @390", and "Over budget at: all." It fails identically on a clean `origin/main` checkout (reviewed on PR #383, where the two outputs were byte-identical). It is not a finding of this order. A build that has the same output on main is not a regression.

## Carried over from J2

The order's misses, from J2's review (PR #383):
- **A 40-character name with no spaces overflowed the page at 375px.** The card label, the Trackers heading and the popover title spilled, so the page scrolled sideways. J2's fix (`overflow-wrap:anywhere`, 10c0503) is on `main`. **Here** any new text a stepper prints in a card or heading gets the same rule; the phone check in §12 step 7 is the test.
- **A SCHEMA sentence was split mid-line, and a test name overclaimed what it asserted.** Both fixed in J2. **Here** every amended paragraph is read whole after the edit, and every test name is checked against its assertions.
- **Rulings Ken made on J2's open questions, which this order follows:** a guard that can never fire, and whose mutation survives, is dropped and the order's §5/§8 amended, not kept untested (the data-panel-id check, J2). A spend on a count-down tracker is +1 (J2's §10). One warning covers a group, not one per item (J2's unnamed pools). A cleanup goes with the thing it cleans (J2's archetype change clears the counts).

## 1. Goal and Done when

A player types a number into a wizard stepper instead of clicking +/− fifteen times. The value is held to the same caps and pools that +/− are, and the arrow keys and the buttons still work. The overspent pool reads with a true minus.

**Done when** (each line names its test in §10):
- Every one of the 17 wizard steppers takes a typed number: the value is a field, and Enter or leaving the field commits it. *(`J3: a typed value commits on Enter or blur, through the same press the buttons make`)*
- A typed value past a cap or a pool stops at the highest value the buttons would reach, and says so once. *(`J3: a typed value is held to the caps and pools the buttons are`)*
- A typed value below a floor stops at the floor. *(`J3: a typed value below the floor stops at the floor`)*
- Text that isn't a whole number leaves the value as it was: no change, no commit, no message. Escape puts it back. *(`J3: text that isn't a whole number leaves the value as it was`)*
- The arrow keys on the field step it by one, as the + and − buttons do, and keep the place. *(`J3: the arrow keys step the field by one and keep its place`)*
- The announcement is made once per commit: the field does not also announce itself as a spinbutton. *(`J3: a typed value is announced once, not twice`)*
- An overspent pool reads "−3 / 40" with a true minus in the wizard's rail, the Vitals flyout and the CP pill. *(`W152: an overspent pool reads with a true minus in the wizard`)*
- A typed value that would open a pick (an Advantage with its choice) stops there and the pick is asked for as the + button asks. *(`J3: a typed value stops where a press would open a pick`)*
- Nothing on the sheet changes. *(the outputs diff in §11; and `smoke-sheet-*` unchanged)*

## 2. Tier, versions, numbers

- **Rule or shape.** A player could reasonably have a typed value held to the caps or not; that is a choice. One decision, **N** (314 today).
- **App: no bump.** JQ6: the release moves `[Unreleased]` to the next minor once, after J4. J3's lines go under `## [Unreleased] — app 0.76.0`. *(The plan's J3 row says "app minor"; JQ6 is what's built, and Ken can overrule it here.)*
- **Game data:** none. **Character schema:** none (a typed value is a stored value the buttons already write). **Table and pack schemas:** none.

## 3. The decision, drafted in full

```
N. **A wizard stepper takes a typed number, held to the caps and pools its buttons are.**
   *2026-11-23 · Ken + Claude · Touches: stepper(), applyStep, the [data-step] binder, Decision 164's keepPlace, W59's
   announcement, the wizard's rail and Vitals pills, W121, W152, the Custom pools' steppers (none: J2 has none)*
   - **Decided:** each wizard stepper's value is a field. A typed whole number is taken by stepping toward it through
     the same press the buttons make (`applyStep`, one press at a time), so every cap, floor, pool and gate the buttons
     apply applies to the typed value too. The value stops at the last press that is taken, and the field shows that
     value. Enter or leaving the field commits; Escape reverts. The arrow keys step by one. The rail's and the Vitals'
     pill read a true minus.
   - **Why:** the veteran knows the target (W121: spending the Skill pool alone is about 30 clicks). A typed number
     that went around the buttons' rules would make the pool's numbers lie; one press at a time keeps them true.
   - **Rejected:**
     - A typed value that writes straight to the character, skipping `applyStep`. It would skip the gates (an
       Advantage's `affordable`, a pick's open branch) and make a second writer for each kind (Decision 81).
     - A native `<input type="number">` with its own spinbutton announcement. It would announce twice (W59), and a
       `number` field accepts text the engine would then have to refuse.
     - A typed value that errors on an over-cap number. A player who types 30 to spend a pool of 20 wants the 20, not a
       message; the buttons already stop there.
   - **Replaces:** nothing. Extends 164 (the focus rule the field uses) and 279 (a fold after a press).
   - **Revisit if:** a stepper's press becomes expensive enough that 30 presses are slow (then a bulk apply is a
     separate decision); a stepper gains a rule that a press can't express.
   - **Built:** app 0.76.0 (unreleased), PR #…, log entry 2026-…
```

INDEX §3, under *Wizard & creation UI* (where 164 is):

```
- **N** *(Typed steppers — pools-and-numbers J3, W121, W152)* — every wizard stepper's value is a field: a typed number steps toward the target through the buttons' own press, held to the same caps and pools; Enter or blur commits, Escape reverts, the arrows step by one. The rail's and Vitals' pills read a true minus. Extends 164 and 279.
```

## 4. Questions for Ken

*Recorded by the conductor from Ken's answers (2026-11-23): all six on the defaults. The order itself is **awaiting Ken's approval**, not approved.*

Each has its default. A blank answer is the default; Ken answered every one with it.

- **JQ-J3-1: a typed value past the cap.** **Answered: Default (Ken, 2026-11-23).** **Default:** the value stops at the highest the buttons reach, and the field shows it, with the announcement "<name> <value>" once. *Alternative:* the field refuses the commit and keeps the old value, with a short message.
- **JQ-J3-2: a typed value below the floor** (a stat under its base, a skill under 0). **Answered: Default (Ken, 2026-11-23).** **Default:** stops at the floor, as the − button does. *Alternative:* refuses.
- **JQ-J3-3: a typed value that would open a pick** (an Advantage whose choice comes after it, a Base Power's open choice). **Answered: Default (Ken, 2026-11-23).** **Default:** the typed value stops at the last press that is taken, and the pick stays for the player to take, as a + press does. *Alternative:* a typed value doesn't take a stepper that opens a pick; the field is read-only there.
- **JQ-J3-4: commit timing.** **Answered: Default (Ken, 2026-11-23).** **Default:** Enter, or leaving the field, as Decision 164 says for typed values. *Alternative:* each keystroke commits (no Enter).
- **JQ-J3-5: the field's look.** **Answered: Default (Ken, 2026-11-23).** **Default:** the same 42px cell as today's value, a text field with `inputmode="numeric"` and an aria-label naming the stepper. *Alternative:* a wider field, and the buttons drawn as steppers around it, as they are now.
- **JQ-J3-6: W152's rider in this order.** **Answered: Default (Ken, 2026-11-23).** **Default:** yes, in J3, since its fix is the same pills. *Alternative:* W152 moves to its own small order.

## 5. The assumption sweep

| What changes | True today (where) | After | Guards and readers · where it renders · text that points at it |
|---|---|---|---|
| `stepper()` markup | a `<span class="val">` (wizard.js 123), data-step on both buttons | the `.val` cell is a text field with `data-val="<key>"`; the buttons keep their data-step | Readers: `announceStep` (shared 113: reads `.val`'s textContent: must read the field's value), smoke-wizard 1234, 1280, 1503 (expected break, §13), the CSS `.stepper .val` (shadows 232: width, font). Renders in every wizard step with a stepper (17 sites) |
| `applyStep(key, delta)` | one press per call; a refused press returns | unchanged; a new `stepTo(key, target)` loops applyStep toward the target and stops at the first refused press | Every kind's gate is applyStep's own; no kind gets a second path. Totality: a stepTo with NaN, Infinity, a fraction or a negative target does nothing |
| `[data-step]` binder (wizard 1075) | one press → applyStep → update → announceStep, keepPlace via update | unchanged for buttons; a `[data-val]` binder (change, keydown Enter/Escape/ArrowUp/ArrowDown) calls stepTo then update | Decision 279's fold re-focus (wizard 1081) runs for a typed commit too, when the commit folds a pick away |
| `keepPlace` / `PLACES` (shared 254) | `.trk, .alloc-row, .pick, details, tr, .sect` | the field's twin: its stepper's `.pick`, `.alloc-row` or `tr` contains it, so PLACES already covers the field's container; no edit expected (prove it) | A redraw after a typed commit refocuses the field, not `<body>` (164) |
| `announceStep` (shared 113) | announces "<name> <val>" | a typed commit announces once through this, not through a native spinbutton (none: the field is text) | W59. Live region only |
| Wizard pills (wizard 50-56, 73-74) | `${left}<small>/…` plain number | `${numText(left)}` for a negative, the sheet's way (shared 32) | voice.test.mjs (the minus check reads the sheet only, so it needs a wizard case: §11) |
| Rail rows (wizard 75-80) | `(a−b)+" / "+total` plain number | the same numText | Same as the pills |
| `vrow` (shared, wizard 77-79) | renders a value string | unchanged; its caller passes numText | — |
| CSS `.stepper .val` (shadows 232) | a 42px mono span | the same box as an input, no spinners, `text-align:center` | Phone: 44px buttons (shadows 1407): the field is the same height |
| Ledger | 164, 279 | N extends them | — |

Three questions for each row, answered by grep: **which guards read a value this changes** (the `.val`'s text: `announceStep`, the three smoke tests; the pills' number: voice.test.mjs and the wizard's own tests); **where each new string renders** (the field's aria-label in 17 steppers, the one announcement, the rail's minus); **what text points at it** (the wizard's own copy about "Raise"/"Lower", the W59 note, Decision 164's text; grep `Raise`, `Lower`).

## 6. Read first

- `CLAUDE.md`: hard constraints 3 (`index.html` stays a shell), 7 (store inputs; a typed value is an input: the character stores the number the buttons would), 8 (the engine is total), 9 (no build state in copy), and *Working rhythm*.
- `SCHEMA.md` §4: Decisions 81 (one writer for a mirror), 164 (keepPlace), 279 (the CP fold), 266 (±1 on a tracker), E5's minus (numText, signed).
- `wizard.js`: `stepper()` (119), the pills (50-56), the rail (73-80), the pick and step writers (262-798), the binder (1075), `applyStep` (1268).
- `shared.js`: `announceStep` (113), `announce` (the live region), `keepPlace` and `PLACES` (254), `signed` and `numText` (30-32), `vrow`.
- `shadows.css`: `.stepper` (228-232), the 44px phone rule (1407).
- `voice.test.mjs`: the minus check (sheet only, per W152).

## 7. Out of scope

- **J4** (spending several at once on a tracker's ±1): that is the sheet's trackers, not the wizard's steppers. J3 builds the control; J4 uses it later.
- **The sheet's own steppers** (Admin's Base Power row, sheet.js 4734): not `stepper()` calls and not in the wizard.
- **Expert mode as one page** (W131, which goes with W121 and stays on the plan's §4 list).
- **Any new rule** a stepper's press doesn't already have. A typed value adds no gate.
- **GM mode's number fields** (gm.js 1123-3076): already `type="number"`; they are a different surface.

## 8. The shapes

```js
// shared.js (new, beside applyStep: wizard.js 1268, since the caller is the wizard)
// stepTo(key, target): steps toward target, one applyStep press at a time, and returns
//   { value, reached, stopped }: the value the stepper now holds, whether it reached target,
//   and whether a press was refused. A non-integer or NaN target returns { value: <current>, reached:false, stopped:true }.
// It never writes outside applyStep; its loop is bounded by |target − current| and a hard cap of 200 presses.
```

- **`stepTo`** is a plain function in `wizard.js`, not an Engine function (the engine never sees a press: constraint 5 is about the DOM, and this is a UI loop over engine-owned writers). It reads the current value from the same source the `.val` shows (a `currentOf(key)` that mirrors each kind's read, written beside `applyStep`). **Every kind needs a `currentOf`**, so the 17 sites are one table in the order, and a test pins each one.
- **The value's read** (`currentOf`): stat → `ch.stats[id].base`; skill → rank or 0; focus, wwbonus → allocation or 0; natadv → the row's rank or 0; adv/disadv → rank or 0; luck → `ch.trackers.luck.bonus`; disc → `Engine.disciplineRanks`'s bought/rank; bp → placed; apow → `buyPowerRank`'s rank; boost → `Engine.addBoost`'s count. The builder confirms each against the stepper's own `val` argument in `wizard.js`.
- **On bad input** (constraint 8): `stepTo` on a key with no `currentOf` returns `{ reached:false, stopped:true }` and changes nothing.
- **The field's dataset:** `data-val="<key>"` (the same key the `+`/`−` use, without the delta).

## 9. The UI

**The stepper, rendered:** `[−] [ value field ] [+]`. The field is a text input, `inputmode="numeric"`, `pattern="-?[0-9]*"` (no spinners), `aria-label` = `<name> value`, `data-val` = the key, value = the current number. Width matches today's `.val` (42px); on a phone the buttons stay 44px and the field 44px.

**What each press does:**
| Press | Writes | Focus lands | Announced |
|---|---|---|---|
| **+ / −** | `applyStep(key, ±1)`, as now | the pressed button's twin (164) | "<name> <value>", once (as now) |
| Type a number, then **Enter** or leave the field | `stepTo(key, target)` | the field (keepPlace's twin) | "<name> <value>", once |
| **ArrowUp / ArrowDown** in the field | `applyStep(key, ±1)` (one press), as the buttons | the field | "<name> <value>", once |
| **Escape** in the field | nothing | the field, value restored | nothing |
| Text that isn't a whole number | nothing | the field, value restored | nothing |

**Copy** *(all marked for the voice pass)*: the field's aria-label `<name> value` (the name is the stepper's, as today); no new visible copy. The rail's minus is a glyph, not copy.

## 10. Worked examples, as named tests

Write these first; show each failing on `main` (or say why it passes).

`tests/smoke-wizard.test.mjs` (the wizard's own file, beside the J2 wizard tests):
- **`J3: a typed value commits on Enter or blur, through the same press the buttons make`**: a Stat at base 5, type 7, Enter → base 7, the same as two + presses; blur commits too.
- **`J3: a typed value is held to the caps and pools the buttons are`**: the Skill pool with 4 left, type 30 on a skill → stops where the + button stops; the Stats pool's total is not exceeded.
- **`J3: a typed value below the floor stops at the floor`**: a Stat at base 2 (the floor is 2 per D.statRules.base): type 0 → 2.
- **`J3: text that isn't a whole number leaves the value as it was`**: type "x", "1.5", "", "-"; Escape → the value is unchanged in each case, and no commit happens (undo count unchanged).
- **`J3: the arrow keys step the field by one and keep its place`**: ArrowUp → +1, focus stays on the field.
- **`J3: a typed value is announced once, not twice`**: count announce() calls and live-region writes for one typed commit: exactly one.
- **`J3: a typed value stops where a press would open a pick`**: an Advantage whose + opens a choice: the typed value takes the presses that don't open one and stops.
- **`J3: every one of the 17 steppers takes a typed value`**: a loop over the 17 sites (a fixture per kind), each typed commit moves the value as its + does.
- **`W152: an overspent pool reads with a true minus in the wizard`**: an overspent Skill pool: the rail row and the pill read "−3 / 40" with U+2212, not "-3".

`tests/engine.test.mjs`:
- No engine behaviour changes. Nothing to add beyond the existing suite (the engine is not touched).

`tests/voice.test.mjs`:
- **`W152: the wizard's overspent pool is checked for a true minus`**: the minus check gains a wizard case (the rail's pill over an overspent draft).

## 11. Tests beyond the examples

- **Totality:** `stepTo` on every key a stepper uses, with `NaN`, `Infinity`, `-0`, `1e308`, a fraction, a string: no throw, no change beyond applyStep's own. Add a case to the existing totality list in `engine.test.mjs` only if a function is exported; `stepTo` isn't, so the test is in the wizard file.
- **Hostile:** a typed value on a stepper whose key is in a hostile file (a key with `|` in the id, the `natadv` row missing): `currentOf` returns a number, `stepTo` stops, nothing is written. Add to `hostile.test.mjs` with the name `J3: a typed value on a hostile stepper key writes nothing`.
- **Voice:** the `W152` minus case (above); no new copy to pass.
- **The outputs diff:** `node tools/outputs.mjs` snapshot on `main` (`0be3075`) in a scratch worktree with its own `npm ci` and temp dir (as J2 did), then `--against`. **Expected:** every wizard step's stepper value cell (the field's markup), and the W152 pill minus for an overspent draft. **Nothing else.** Any other difference is a finding.
- **Mutation-test:** (a) `stepTo` writes straight to the character, skipping applyStep (the "held to the caps" test fails); (b) the field's Enter handler calls `update` without `stepTo` (the "commits on Enter" test fails); (c) the rail pill back to `${left}` (the W152 test fails); (d) drop the `keepPlace` twin for the field (the "keeps its place" test fails).

## 12. Steps

1. Pre-flight: `git submodule update --init private`; `npm run test:fast` on the fresh branch. Take the outputs snapshot on `main` in a scratch worktree (§11).
2. Write §10's examples; show them failing on `main`. `npm run verify`.
3. `currentOf` and `stepTo`, the 17-site table, and the field's markup and binder. `npm run verify`.
4. The pills and rail (W152), the CSS, the focus rule. `npm run verify`.
5. §11's hostile test, totality, the outputs diff, the four mutations.
6. Docs: SCHEMA §4 (Decision N) and its INDEX line; STATE rewritten; the log line; W121 and W152 move to `wishes-granted.md` with a pointer to this order; the plan's J3 row marked **Built**.
7. **Dev preview** (`shadows-dev-preview`; seed with `shadows.active.v1`, the memory note's recipe): in the wizard, type a Stat, a Skill over its pool, a Base Power, an Advantage. Enter and blur commit; Escape reverts; ArrowUp steps by one. At **375px**: the field and its buttons fit a row; no horizontal scroll (`scrollWidth == clientWidth`). `npm run phone-check`: it **fails on `main` in this environment** (see the header). The check is that it fails *the same way* on the PR: the same table and the same "Over budget at: all." line, and no new row.
8. Close-out (§14). `npm run verify` last.

## 13. Stop and ask

- If a kind in `applyStep` can't be expressed as a press (a press that also needs a pick, a dialog, a confirm): stop; that is JQ-J3-3.
- If `currentOf` for a kind would need to read something the stepper doesn't show: stop, and say which.
- If the outputs diff shows anything beyond §11's expected differences: stop.
- **Not stops:** smoke-wizard 1234, 1280 and 1503 (they pin the span; they change to the field); the stepper's `.val` selectors in the same tests; a test that counts `[data-step]` buttons (still two per stepper). The `phone-check` failure on `main` (environmental; say so, don't fix it).

## 14. Close-out

Per the `close-the-session` skill, *Rule or shape*:
- Decision **N** (§3) in `SCHEMA.md` §4 and its INDEX §3 line; 164 and 279 get an extends note, no supersession mark.
- **No `npm run bump`** (§2). No `gamedataVersion` or schema change.
- `CHANGELOG.md` under `## [Unreleased] — app 0.76.0`, then `npm run changelog`:
  - "**You can type a number into a wizard stepper.** Type it in the box and press Enter, or leave the box; the arrow keys step by one. It stops at the most the buttons would reach."
  - "**An overspent pool reads with a true minus** in the creation rail and the Vitals panel: −3, not -3."
- W121 and W152 move to `log/wishes-granted.md` with a pointer to this order. A line in `docs/log/2026.md`; a row in `docs/log/shipped.md`; STATE rewritten (Pools and numbers: J3 built, J4 next). The plan's J3 row: **Built** (Decision N).
- **PR title:** `feat(wizard): type a number into a stepper (Decision N, J3)`. Body: the template's sections, plus **Where the order didn't fit** and every new string as it renders (for the voice pass). **Say in the body: merge as a squash.** Say in the body: the phone-check failure on `main` is environmental (see the header).

**Review checklist:**
- Every *Done when* line has its named test, and each fails on `main`.
- Every one of the 17 steppers is in §10's table and takes a typed value; the table's count is 17.
- A typed value is held to the caps and pools by `applyStep` alone: no second writer (grep `ch.stats[`, `ch.skills[`, `trackers.` in the new code: only through applyStep).
- The field's Enter, Escape, Arrow and blur paths each have a test; none announce twice.
- The W152 minus appears in the rail, the Vitals flyout and the CP pill; the voice test covers the wizard.
- The outputs diff is §11's expected and nothing else.
- The four mutations fail as §11 says.
- No new copy names a decision, a wish id or "TBD" (`voice.test.mjs`).
- No app bump; no schema or game-data bump.
- The phone-check failure on `main` is recorded as environmental, not as a finding.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md` with this order's path, `docs/plans/pools-and-numbers/J3-typed-steppers.md`, plus these traps:

- **Seventeen call sites, not sixteen.** The plan says sixteen; `stepper()` is called 17 times (the advantage stepper at 667 has an open and a closed branch). Count from the code, and fail the review if the table has a different number.
- **A typed value goes through `applyStep`, one press at a time.** Don't write the character directly: each kind has a gate in applyStep, and a second writer would be Decision 81's mirror problem again.
- **`announceStep` reads `.val`.** Once the value is a field, it must read the field's value (or the announcement goes blank).
- **Focus after a typed commit.** A redraw replaces the field; keepPlace (164) must put focus back on the field, not `<body>`. PLACES already covers the containers; prove it.
- **The minus is U+2212, through `numText`.** Not a template literal around a plain number.
- **The phone-check fails on `main`.** Don't "fix" it inside this order; say it's environmental.
- **Take the outputs snapshot in a scratch worktree on `main`**, with its own `npm ci` and temp dir, before step 2 (J1's and J2's lesson).
