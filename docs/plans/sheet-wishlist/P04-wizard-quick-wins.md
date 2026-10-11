# Work order P4 — The wizard, quick wins

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W94, W96, W64,
W59** (`WISHLIST.md`); Decisions 150, 152, 86, 172.
**Status:** **drafted 2026-10-11 by Claude (Opus)**, pre-flighted against
`main` at `59ee44d` (#163, P3, merged). Waiting on Ken: PQ1–PQ3.
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs alone.** It touches `wizard.js`, `app.js`, `shared.js`, `sheet.js` (one
handler), `gm.js` (one line), `shadows.css`, `engine.js` (one small function),
`tools/phone-check.mjs`, the tests and the docs. No data change, and nothing in
`private/`.

**What P4 is.** Four things a playtester runs into while making a character.
None of them is a rule:

- **W94:** nearly everyone's first move is eight trips of three clicks to put
  every stat at 4.
- **W96:** a Vampire scrolls past 42 Advantages it can't buy to reach its 15.
- **W64:** the wizard has no way back to Home.
- **W59:** every stepper reads "increase, button", and a screen reader never
  hears the new value.

---

## 1. Goal

When P4 is merged:

1. **Set all to 4.** The Stats step has a button that raises every stat below
   4 to 4, spending Stat Points exactly as the steppers would. It leaves a stat
   at 4 or above alone. If the pool runs out, it raises what it can (PQ3) and
   the step says which stats it couldn't reach.
2. **A Supernatural sees only what it can buy.** On the CP step, a Vampire or
   Werewolf sees the Universal Advantages, plus any non-Universal one it
   already holds, so that one can still be taken back. The search box and its
   count work on that list.
3. **Home from the wizard.** The wizard's header has a Home control (PQ2) that
   goes back to the roster. Nothing is lost by using it. The sheet's menu, the
   wizard and the GM table all reset to Home through one helper.
4. **Steppers say what they change.** Every stepper button is named for what it
   changes ("Raise Body", "Lower Handguns"). After a press, the new value is
   announced once, politely. This works in the wizard and in Admin's Base
   Powers block.

## 2. Tier, versions, numbers

- **Tier: Fix (UI)**, as the plan has it. No rule moves, no data or save shape
  changes, and nothing here is a player-facing behaviour anyone would
  reasonably have chosen differently. **No numbered decision.** If the
  reviewer disagrees about any piece, that piece is the one that stops (§11).
- **App:** **minor** (PQ1), with `npm run bump -- X.Y.0`. Set all to 4 and Home
  from the wizard are new things a player can do. The current number is in
  `docs/STATE.md`.
- **Game data:** **no bump.** No computed value or available choice changes
  (Decision 68). W96 hides choices that were never available.
- **Character schema:** **no bump.** Nothing new is stored.
- **CHANGELOG:** four lines under `[Unreleased]`, in player voice (§12).

## 3. Questions for Ken

| Id | Question | Default |
|---|---|---|
| PQ1 | **The version.** The Fix tier's table says "patch" for a visible fix, but the versions table says a new capability is minor. Set all to 4 and Home from the wizard are both new. | **Minor.** The versions table decides the number, and the tier decides the paperwork. Both new controls are things a player couldn't do before. |
| PQ2 | **Home in the wizard header: a button or a menu?** W64 says "a Home control in the wizard header, matching the sheet's", and the sheet's Home sits in its ⋮ menu. | **A visible Home button**, as a plain text button styled like the ⋮ (same border, same 44px touch target). A ⋮ menu with one item in it is two taps for one choice, and hides the only way out. If the wizard's header gets more actions later, they can move into a ⋮ then. |
| PQ3 | **Set all to 4 when the pool can't cover every stat.** W94 says to raise what it can "in stat order". The other choice is one point at a time, round-robin, which leaves the stats level instead. Either way this needs a player who already spent most of the pool: the smallest pool is 41 (Street, rolled 40 + 1), and raising all eight from 1 to 4 costs 24. | **Stat order, as W94 says**, from BOD through EMP, each one taken all the way to 4 before the next. It's predictable and matches the order on the page. The step names the stats it couldn't reach. |

## 4. Read first

- `CLAUDE.md`, then `docs/STATE.md`. Decisions **150** (Stat Points and
  `raiseCost`), **152** (a classification's Advantages), **86** and **172** (the
  UI files share one scope; `gm.js` loads after `wizard.js` and `sheet.js`).
- `docs/WISHLIST.md`: W94, W96, W64 and W59. The text below corrects two
  things in them (§7c, §7d).
- `src/ui/wizard.js`:
  - `stepper()` at ~114, and all 16 calls to it (~242, 328, 355, 378, 434, 438,
    514, 547, 572 (two), 583, 593, 606, 616, 649, 657).
  - `renderStats()` at ~226–247; the `stat` branch of `applyStep()` at ~1043.
    **It doesn't check the pool**: the disabled button is the only guard.
  - `renderCP()` at ~527: the Advantages block at ~552–575 (`gated`,
    `advList`, `openCount`).
  - `bindMain()`: `[data-home]` at ~842, which is dead (see §7c), and
    `[data-step]` at ~913.
- `src/ui/app.js`: `renderTopChrome()` at ~20–60. The sheet's menu Home is at
  ~52; on the wizard branch at ~54–56, `act.innerHTML = ""`.
- `src/ui/shared.js`: `S` at ~79; `keepPlace()` at ~235 (it already puts focus
  back on the stepper that was pressed, through its `data-step` key); the
  undo toast's live region at ~305–316, the pattern for §7d's.
- `src/ui/gm.js`: `homeState()` at ~124 and `[data-thome]` at ~296.
- `src/ui/sheet.js`: Admin's `.admin-arch [data-step^="bp|"]` handler at ~3276.
- `src/styles/shadows.css`: `.hdr-actions` and `.kebab` at ~893–897; the 44px
  hit areas at ~1109–1119; `.sr-only` at ~1384.
- `tools/phone-check.mjs`: it measures Home and every sheet tab, **never the
  wizard** (§7c).

## 5. Out of scope

- **W95** (Expert mode, compact steppers) is P12, which builds on this order's
  labels. Don't move the number out from between the buttons here.
- **The sheet's own controls** (Main's +/−, Trackers' fields). Only `stepper()`
  buttons are relabelled. The rest of W59's audit belongs to whoever picks up
  an accessibility pass.
- **An Undo in the wizard.** W94's "Undo behaves as eight clicks would" holds
  trivially: the wizard has no Undo, and the steppers take the points back.
- **The wizard's other header actions** (Export, What's new). PQ2 adds Home only.

## 6. The shape

### 6a. W94 — Set all to 4

**Engine** (pure, no DOM, unit-tested): add `raiseStatsToFloor(ch)` beside
`statPool`/`nextStatCost`.

- The floor is read from `statRules.modifiers`, never hard-coded: it's the
  lowest score whose modifier is 0 or more (4 today). Export it as
  `statFloor()`, so the button's label reads it too.
- Going through `D.stats` in order, raise each stat's `base` one point at a
  time while it is under the floor and `nextStatCost(ch, id)` ≤ what's left
  (`statPool(ch).total − statSpent(ch)`). These are exactly the stepper's
  rules.
- Return `{ ok, raised:[ids], short:[ids] }`. `short` is the stats left below
  the floor.
- Return `{ ok:false, why }` when the pool has no total yet (a rolled pool
  with no roll entered), and when nothing is below the floor.

**Wizard:** in `renderStats()`'s `roll-entry` row, after the pool, add
`<button class="btn sm" data-stat-floor>Set all to ${Engine.statFloor()}</button>`.
It's disabled when no stat's base is below the floor, or the pool has no
total. Its handler calls the engine and then `update()`. When `short` isn't
empty, keep a one-shot note in `S` (like `S.landed`) that the next render
shows under the row, in `<p class="step-note" role="status">`: *"Not enough
Stat Points for Cool, Magnetism and Empathy. They stay where they are."*
Tool voice, and the names are the ones the rows show. Clear the note on the render after.

### 6b. W96 — Hide what a Supernatural can't buy

In `renderCP()`, when `gated`:

- `advList` becomes the open Advantages, then the ones the character holds
  that aren't open (`cur > 0`), in the book's order. Nothing else is drawn.
  A held one keeps its take-back-only stepper and its *Not for …s* tag, as
  today. `validate()` already reports it.
- The `<summary>` reads `${openCount} open to ${cls.name}s`, plus
  `· ${held} held that aren't` when any are. Drop "· N not open".
- The rule line stays as it is (*only Universal Advantages are open*).
- An ungated character (a Mortal) sees exactly what it sees today.

The jump bar's search filters and counts the `[data-filterable]` picks that
are actually drawn, so it follows with no change. Check that in a test anyway
(§8, test 6).

### 6c. W64 — Home from the wizard

The wish needs one correction. It says to reuse "the `data-home` handler in
`bindMain`". That handler (`wizard.js` ~842) only binds inside `#main`, and
nothing in `#main` renders a `data-home`. It's dead, and a header button would
never reach it.

1. **One reset.** Move `homeState()` from `gm.js` into `shared.js`, beside `S`.
   Add `goHome()`: `S = homeState(); renderHome();`. Use it in the sheet's
   menu (`app.js` ~52), the new wizard button, and the GM table's
   `[data-thome]` (`gm.js` ~296, which keeps its `lastTableSaved = null`
   first). That ends the drift W64 noticed: the wizard's copy left out
   `section` and `admin`. Delete the dead `bindMain` handler.
2. **The button.** On the wizard branch of `renderTopChrome()`,
   `act.innerHTML = '<button class="hdr-btn" data-home="1">Home</button>'`,
   bound to `goHome()`. `.hdr-btn` copies `.kebab`'s look, and joins the
   44px `::after` hit-area rules at ~1109–1119. Leave the Home screen's own
   header (the `else` branch) empty, since it is Home.
3. **Nothing is lost.** No "are you sure". A touched character is already
   saved (`saveChar` on every `update`), and an untouched new one was never
   saved and just goes. That's W64's own reasoning, and it's still true.
4. **`phone-check` learns the wizard.** Add one screen: a new character on its
   Stats step, which is the longest header the wizard has (with a character
   name in it). The header must stay one row, and Home must clear 44px on the
   touch phone. Without this, nothing measures the new button.

### 6d. W59 — Steppers say what they change

1. **`stepper(val, dataAttr, downOk, upOk, name)`.** The new `name` is the
   row's own label, already in hand at every call site. The buttons become
   `aria-label="Lower ${name}"` / `"Raise ${name}"`, and the group gets
   `data-name="${name}"`, escaped. `name` is required: §8's test fails on a
   stepper without one.

   | Kind (`dataAttr`) | `name` | Example |
   |---|---|---|
   | `stat`, `focus`, `wwbonus` | the stat's name | Raise Body |
   | `skill` | the skill's name | Lower Handguns |
   | `adv`, `disadv`, `natadv` | the Advantage's or Disadvantage's name | Raise Ambidextrous |
   | `luck` | `LUCK` | Raise LUCK |
   | `disc` | the Discipline's name | Raise Enchantment |
   | `bp` | `Base Powers in ${power}` | Raise Base Powers in Shadow Play |
   | `apow` | `${power} with CP` | Raise Bestial Blessings with CP |
   | `boost\|stat`, `boost\|skill` | `boosts to ${name}` | Raise boosts to Body |

   `bp` and `apow` say which pool they spend from, because the same power can
   show up on two steps.
2. **One live region, outside `#main`.** `#main` is replaced on every render,
   so a region inside it is a new node each time and is never announced. Add
   `announce(text)` to `shared.js`, modelled on the undo toast's element: one
   `<p id="announcer" class="sr-only" role="status" aria-live="polite">`,
   created once on `document.body`. It clears the text, then sets it on the
   next frame, so the same words twice in a row are still read.
3. **What's announced.** After a stepper's handler has called `update()`,
   `keepPlace` has put focus back on the pressed button (or its card when that
   button is now disabled). Find the stepper by the pressed `data-step` key,
   and announce `${name} ${val}`, e.g. *"Body 5"*. `val` is the `.val` the new
   render shows. One helper, `announceStep(key)`, is called from both handlers:
   the wizard's `[data-step]` (~913) and Admin's Base Powers (~3276, after its
   `commit`).
4. **Nothing visible changes.** The buttons still show − and +.

## 7. The UI

Two visible changes:

- **The Stats step:** a **Set all to 4** button in the pool row, plus the
  occasional short note under it.
- **The wizard header:** **Home** at the right, where the sheet's ⋮ sits.

Check both at phone, tablet and desktop widths. `npm run phone-check` must
pass with the new wizard screen. W96 changes only how long the CP step is for
a Supernatural.

## 8. Tests

Every new guard is **mutation-tested** (§9).

**`tests/engine.test.mjs`:**

1. `statFloor()` is 4, and it's read from the data: change
   `statRules.modifiers["4"]` to −1 in a cloned data object and the floor
   becomes 5. Use the harness's way of loading changed data, if it has one. If
   it doesn't, say so in the PR and pin 4 alone.
2. `raiseStatsToFloor`:
   - On a fresh Street character it raises all eight to 4 and spends 24.
   - A stat already at 7 is untouched.
   - §10's third row: INT and TECH reach 4, and `short` is COOL, MAG and
     EMP (PQ3). Then a variant with 2 left after INT: TECH goes to 3, and
     it's in `short` too, one point at a time as the stepper would.
   - A rolled pool with no roll entered is refused.
   - With nothing below 4, it's refused.
   - Pressing it twice gives the same result as pressing it once.

**`tests/smoke.test.mjs`:**

3. **Set all to 4:** on the Stats step, one press puts all eight at 4,
   Remaining drops by 24, and the button is disabled. On §10's third row, the
   short note names COOL, MAG and EMP, and is gone after the next render.
4. **Home from the wizard:** start a New character, type a name, press the
   header's Home. You're on Home, the roster lists the character, and `S`
   equals `homeState()`. Do the same with an untouched New character: the
   roster has no entry for it. The sheet's menu Home and (with `GM_ON`) the
   table's Home both still land on Home with `S` equal to `homeState()`.
5. **The header button exists only in the wizard.** It's in the wizard; it's
   not on Home; and on the sheet, the ⋮ menu is unchanged.
6. **W96:** a Vampire on the CP step has exactly 15 Advantage picks, each one
   Universal. Its summary says *15 open to Supernaturals*. Typing in the
   search box counts within those 15. Give the Vampire a held, non-Universal
   Advantage (in the stored character, before boot): it shows with a
   take-back-only stepper, the summary adds *· 1 held that aren't*, and one
   press takes it back. A Mortal's CP step still lists all 57.
7. **W59, labels:** walk every wizard step for a Street Strigoi and for a
   Professional. **No** `[data-step]` button has an aria-label of `increase`
   or `decrease` or an empty one. Every one matches `/^(Raise|Lower) \S/`.
   Admin's Base Powers block passes the same check.
8. **W59, the announcement:** press `[data-step="stat|BOD|1"]`. Afterwards
   `#announcer` sits outside `#main`, is `role="status"`, and reads
   *"Body 2"* once the frame has run (use the harness's way of flushing
   `requestAnimationFrame`, or let `announce` fall back to `setTimeout(0)`
   when rAF is missing). Then press Admin's Base Power stepper on a locked
   Vampire and read the announcer.

**`tests/build.test.mjs`:** nothing new. `index.html` doesn't change, because
the announcer is created by script.

## 9. Steps

1. Branch from `main`. Run `npm ci`, `git submodule update --init private`,
   then `npm run verify`, and note the count.
2. §6a's engine function, with tests 1–2. Run `npm run test:fast`.
3. §6d **first among the UI changes**: it changes `stepper()`'s signature,
   so every later diff is written against the new one. Then do §6a's button,
   §6b and §6c, with tests 3–8.
4. Run `npm run verify` and `npm run phone-check` (with the wizard screen
   from §6c, step 4).
5. **Mutation-test:**
   - Drop `name` from one call site: test 7 fails.
   - Put the announcer inside `#main`: test 8 fails.
   - Let `raiseStatsToFloor` skip the pool check: test 2's short case fails.
   - Drop the `cur > 0` half of W96's list: test 6's held case fails.
   - Bind the wizard's Home with the old three-key reset: test 4 fails.

   Record each one in the PR.
6. Run it with `shadows-dev-preview`:
   - a Street Professional through Stats (press Set all to 4) and on to CP;
   - a Vampire to CP (15 Advantages);
   - Home from the Archetype step, which comes back to the roster.

   Use the keyboard alone for one stepper press, and check that focus stays
   on the button. Screenshots of the Stats step and the wizard header, phone
   and desktop.
7. Close out (§12).

## 10. Worked examples (pin these)

| Character | Before | Press | After |
|---|---|---|---|
| Street, flat pool 45, fresh | every stat 1, Remaining 45 | Set all to 4 | every stat 4, Remaining 21 (8 × 3 spent) |
| Street, BOD 10 (13), REF 6, MOB 6, INT 6 (5 each) | Remaining 17 | Set all to 4 | TECH, COOL, MAG, EMP to 4 (12): Remaining 5, nothing short |
| Street, BOD 10, REF 10, MOB 10 (13 each) | Remaining 6 | Set all to 4 | INT and TECH to 4 (6): Remaining 0; COOL, MAG, EMP short at 1, and the note names them |
| Vampire, CP step | 57 Advantage picks | — | 15, all Universal |

Each Stat Point cost is `raiseCost`'s (1 a point to 6, 2 from 7). Check these
rows against `statRules` before pinning them, and pin the numbers the data
gives you, not this table, if they differ.

## 11. Stop and ask

- If any step's stepper has no label within reach of its call site (the row's
  name isn't in hand), say which. Don't invent a generic one.
- If `phone-check` can't open the wizard without a new boot path in the app,
  stop. The tool may drive the UI, but the app gains no test-only path.
- If a reviewer or test says one of these is a rule or a choice (the floor at
  the modifier's zero, hiding barred Advantages), stop on that piece and say
  which. The rest can still land.
- If a test outside §8's list fails, name it. A test that counted Advantage
  picks for a Supernatural is the likely one, and it encodes the old list.

## 12. Close-out

Use the **close-the-session** skill. For this session that means:

- **CHANGELOG** under `[Unreleased]`, in player voice, then `npm run changelog`:
  - "**Set all to 4** on the Stats step: every stat below 4 goes to 4 in one
    press, from your Stat Points."
  - "**A Vampire or Werewolf sees only the Advantages it can take** when
    spending Character Points."
  - "**Home** is in the header while you make a character. Your character is
    saved as you go."
  - "**Screen readers hear what a + or − changes**, and the new value after a
    press."
- `npm run bump -- X.Y.0` (PQ1). No `gamedataVersion` bump, no schema bump.
- **W94, W96, W64, W59** move whole to `log/wishes-granted.md`, each heading
  pointing at this PR and the app version, and out of `WISHLIST.md`. W95's
  text names W59 as its floor: leave W95 where it is, and change "W59" there
  to "W59 (built, 0.X.0)".
- **STATE**: rewrite §5's *Where to start* (P4 built; P5 next). A `log/2026.md`
  entry only if something was learned the hard way. A row on `log/shipped.md`.
- **`sheet-wishlist.md`** §3: P4's status becomes *built, #…*.
- **The release (WQ2):** P4 is small and player-visible. Say in the PR whether
  it should go out alone or wait for P5 (Milestones, a data change Deighton's
  players will notice).

## 13. Review checklist

For the orchestrator, against the PR:

- [ ] Set all to 4: the floor is read from the data; it spends as the
      steppers do; the short note names the stats; it's disabled when there's
      nothing to do.
- [ ] A Supernatural's CP step: 15 Universal Advantages, plus any held one with
      take-back only; a Mortal's is unchanged; the search box counts the shown
      list.
- [ ] Home in the wizard header; one `homeState()` and `goHome()` in
      `shared.js`, used by the sheet, the wizard and the table; the dead
      `bindMain` handler gone; `phone-check` measures the wizard and passes.
- [ ] Every `stepper()` has a name; no "increase" or "decrease" is left;
      `#announcer` is outside `#main` and reads the new value; it covers
      Admin's Base Powers too.
- [ ] No data change, no schema change, no numbered decision.
- [ ] The app's minor version is bumped; four CHANGELOG lines;
      `npm run changelog` was run.
- [ ] The mutation tests are in the PR.
- [ ] Run it in a browser: keyboard-only stepper presses, phone and desktop.
