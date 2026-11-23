# Plan — Pools and numbers

**Status:** **approved 2026-11-22** (Ken: JQ1 yes, JQ2–JQ8 on their defaults). Nothing here is a
decision until the session that builds it numbers it in `SCHEMA.md` §4. Its
sessions are `J`_n_ (the next free letter: `R` is the 2026-09 audit's, `P`
and `T` are taken) and its questions `JQ`_n_ (§5). Its orders will be in
`plans/pools-and-numbers/`, each drafted from `main` once the one before it
has merged (`WORK-ORDERS.md`, step 7).
**Covers:** Deighton's request (2026-11-22, through Ken): in Admin, move a
character's **maximum SFR** up or down; Ken added its **Rate of Use** (JQ1).
**W49** (a pool the player names), **W121** (type a number into a stepper),
and **W176** (spend several at once on a tracker), which this plan raises.
Small fixes riding along: **W174** (Esc in ⋮), **W153** (the no-data
heading), **W152** (the wizard's overspent pools).
**Sources:** `src/engine/engine.js` (`sfr()` at 896, `adjFor` at 156,
`grants()`'s `rou`/`sfrMax` at 175, `playerPool`/`panelMax`/`panelTurnCap`
at 4515–4530, `mechanicsOn` at 5324, `migrate()`'s adjustments at 5742),
`src/ui/sheet.js` (Manual Adjustments at 1800 and its binder at 4197; the
SFR pill, vitals row, Main card and popover at 362, 393, 547 and 1658; the
tracker panels' ±1 at 1668 and 1754; `data-trkmax` at 4190),
`src/ui/wizard.js` (`stepper()` at 119 and its 16 calls; the pool pills at
55 and 72–74; the `[data-step]` binder at 1064), `src/ui/app.js`
(`closeMenu`, the no-data screen at 349), and the Custom archetype's
`writeIn` in the data. Decisions 26, 110, 153, 164, 199, 223, 225, 266.
**Pre-flight base:** `a81ad6c` (main, 2026-11-22).
**Tier:** *Rule or shape*, every session.

---

## 1. The problem, as a player and a GM meet it

- **A GM can't move SFR.** Every other pool has a way: Manual Adjustments
  (Decision 26) takes SAN max, LUCK max and HP max, and a stat moves TOL and
  WILL. SFR is worked out from the archetype's formula plus what Majors
  grant (Tireless, Deep Reserves, the Vampire's +6, Decision 199, 223), and
  nothing else reaches it. A ruling at the table ("you burned out, −4 SFR
  until you rest", "the ritual left you +3") has nowhere to go. Rate of Use
  is the same: the scaling row's number plus Majors, and no way in.
- **A Custom character gets two pools, and the game has more ideas.** The
  Custom archetype ticks **Uses magic** (TOL Spent) or **Uses SFR**
  (`writeIn.mechanics`, Decision 153). Glamour, Chi, a Blood Pool, a battery
  have to live in Notes, where nothing counts them.
- **Every number is one click at a time.** In the wizard, spending the Skill
  pool alone is about 30 presses, before stats, boosts and Advantages (W121).
  On the sheet, a 6-SFR power is six presses of **+1**, each counted against
  the round's Rate of Use one by one.

**What this plan is not.** It doesn't change a rule. How big an SFR pool is,
and what a named pool does, stay the GM's call; the sheet only gives them a
place to write it and counts it.

## 2. The shape

- **Adjust, don't override.** SFR max and Rate of Use join Manual
  Adjustments as two more targets, `SFR` and `ROU`, read by `adjFor()` in
  `sfr()`. The adjustment is a delta with a note, logged and undoable, and it
  moves with everything else: raise WILL afterwards and a Werewolf's pool
  still grows. A typed override on Admin would freeze the number against
  later changes and carry no reason, and it would be a second way to say
  what the ledger already says. No save-file shape moves: an adjustment row
  already stores any target as text, and `migrate()` keeps it.
- **Admin points at it.** Deighton asked for it in Admin mode. The ledger
  lives on Trackers, so Admin gets a line linking to it (JQ2), not a second
  control.
- **A named pool is a panel the player writes.** A Custom character's
  `writeIn` gains `pools`: a list of `{ id, name }`, the id issued once and
  never reused (`pool-1`, `pool-2`, …). Each draws a tracker panel exactly as
  the Custom SFR pool does (counts down, max typed on Trackers, stored in the
  generic `trackers.panel[id]`), so the engine's panel readers, undo and
  Turn Reset need nothing new. Its name is the player's text, escaped
  everywhere (constraint 10). Character schema bump; `migrate()` fills
  `pools: []`.
- **A typed number is held to the same rules as +.** One control, in
  `shared.js`: the value is a number field with the buttons beside it.
  Typing 6 does what six presses would, refused where the sixth press would
  be, and announced once (W59). The arrow keys step it.
- **A tracker spends an amount.** The ±1 on a tracker becomes the same
  control: type 6 and press **Spend**, and it is one change, one Undo, and
  six against the round's Rate of Use.

## 3. Sessions

| Session | Name | What a player or GM gets | Tier · versions | Waits on | Status |
|---|---|---|---|---|---|
| **J1** | SFR max and Rate of Use by hand | Deighton's request: **SFR max** and **SFR Rate of Use** as Manual Adjustment targets, offered only to a character with an SFR pool; the pool's card and popover say what's adjusted ("WILL × 3 + 5, +2 adjusted"); never below 0. Admin says where to make the change. Riders: **W174** (Esc in ⋮ gives focus back to ⋮) and **W153** (the no-data heading in tool voice) | *Rule or shape* (extends 26) · app minor, no data or schema bump | Nothing | **Built** (Decision 312, app 0.76.0, 2026-11-22): [`J1-sfr-by-hand.md`](pools-and-numbers/J1-sfr-by-hand.md) |
| **J2** | A pool the player names | **W49**: the Custom archetype's third mechanic, **Uses another pool**. The player names it (Glamour, Chi) and the GM sizes it; it counts down on Trackers and Main like the Custom SFR pool, sits in a power's **Uses** list, and prints on the archetype's page | *Rule or shape* · app minor, character schema bump, game data bump (a new mechanic a character can choose) | J1 merged | Planned |
| **J3** | Type a number into a stepper | **W121**: every wizard stepper takes a typed number and the arrow keys, held to the caps and pools + and − are. Rider: **W152** (an overspent pool reads with a true minus), since the pills it touches are the ones a typed number overspends | *Rule or shape* · app minor | J1 merged (J2 isn't needed) | Planned |
| **J4** | Spend several at once | **W176**: a tracker's ±1 takes an amount: SFR, TOL Spent and J2's pools. One change, one Undo; the round's count moves by the amount, and at or past Rate of Use it warns as one press does now (Decision 225) | *Rule or shape* · app minor | J2 and J3 merged (it reuses J3's control on J2's panels) | Planned |

**One release at the end (JQ6).** The orders merge one at a time; the first
moves `[Unreleased]` to the next minor, and the others add their lines under
it. Each session is finished when it merges, so nothing needs a `FEATURES`
switch (Decision 173). Ken cuts the release after J4.

**Why this order.** J1 is what Deighton asked for and the smallest; it lands
first so the request isn't waiting on the rest. J2 before J4, so J4's spend
box lands on every pool at once. J3 builds the control J4 reuses, and is
independent of J2, so J2 and J3 *could* run side by side (`WORK-ORDERS.md`,
*Running more than one at once*); they share `shared.js` and the ledger, so
the default is one after the other.

**What each order's pre-flight must check** (beyond `WORK-ORDERS.md`'s list):

- **J1:** every reader of `Engine.sfr()`'s `value` and `rou`, twins
  included: the vitals pill (`sheet.js` 362), the drawer row (393), Main's
  card (547), the popover (1658), the round line (`sfrRoundText`), every
  power's affordability (`sfrLeft`, `runCost`, `powerCostCap`), the hit
  panel's reactions and Turn Reset's stops (`resetRunning`), the GM seat
  line, and print. A max cut below what's spent: each `Math.max(0, …)`
  holds it at 0, and the order says so. A Custom pool (`setBy: "player"`)
  takes the adjustment on its typed max (JQ3). The target list is the
  data's or the code's: today it's code (`sheet.js` 1806), and the order
  decides whether it moves to data (Decision 135).
- **J2:** every reader of `writeIn.mechanics` and of a panel's `title`
  (`archetypeContent`, `archPanels`, `panelTracker`, print's archetype page,
  GM mode's seat), and every place that assumes a tracker's title comes from
  the data. `powerUses` and the **Uses** datalist. The hostile test's
  character gets a pool named with markup. Main's card grid with one more
  card at 375px (`phone-check`).
- **J3:** all 16 `stepper()` calls in one table, each with the cap and pool
  its + reads, so a typed number is held to the same ones and the review
  checks a table, not a hunch. W59's announcement against a native
  spinbutton's own (don't double up). Decision 164: a typed value commits on
  Enter or leaving the field, and the redraw keeps the place.
- **J4:** every writer of `trackers.sfr.spent` and `.turn`
  (`adjustPanelTracker` is the one, Decision 266); the TOL Spent tracker's
  `overMax: "cascade"` with an amount that crosses zero (one Cascade check,
  or one per point: the order asks, JQ8, unless the CRB answers it); Feeding
  (Decision 201) never counts against the round.

## 4. Out of the plan

- **A named pool on a book archetype.** A Professional given Chi by the GM
  is a Custom row question (W109), not this plan's.
- **A pool with its own Rate of Use or refill rule.** A named pool counts and
  nothing else; its rules are prose in its note, as the Custom SFR pool's
  are. If the same refill rule turns up across many characters, Decision 26's
  *Revisit if* applies.
- **W131** (Expert mode as one long page). It goes with W121 and stays on the
  wishlist: its cost is re-rendering, not typing.
- **Typed numbers on the sheet's other controls** (Luck, Çredits, CRANK,
  damage). Damage already takes an amount through **Take a hit**; the rest
  are W-items if they're wanted.

## 5. Questions for Ken

**Answered 2026-11-22 (Ken): JQ1 yes, and Default on JQ2–JQ8.** So the
control is Manual Adjustments with a line on Admin, a Custom pool takes it,
named pools are a list with a card on Main, J4 is in, and nothing is
released until J4 merges.

- **JQ1 — Rate of Use too.** **Answered 2026-11-22 (Ken): yes.**
- **JQ2 — Where the control lives.**
  - **Default:** Manual Adjustments on Trackers, where SAN, LUCK and HP max
    already are; Admin gets one line pointing there. It's the one ledger, and
    a later stat change still moves the pool.
  - *Alternative:* a number on the Admin tab that sets the max outright. It's
    what Deighton literally asked for, but it fixes the max against later
    changes and says nothing about why.
- **JQ3 — A Custom pool's adjustment.**
  - **Default:** it adds to the max the player typed, the same as on any
    other archetype.
  - *Alternative:* not offered, since a Custom pool's max is already typed.
- **JQ4 — How many named pools.**
  - **Default:** a list. One is the usual case, but a list of one is cheap
    and a second shape later costs a migration.
  - *Alternative:* exactly one.
- **JQ5 — A named pool on Main.**
  - **Default:** yes, a card beside SFR, as the Custom SFR pool has
    (Decision 225), if J2's pre-flight finds it fits at 375px.
  - *Alternative:* Trackers only.
- **JQ6 — One release.**
  - **Default:** nothing is released between J1 and J4. A fix that can't
    wait ships with whatever J work has merged, which is finished work.
  - *Alternative:* release after each order.
- **JQ7 — W176, spend several at once.**
  - **Default:** in the plan, as J4. It's the same pain W121 names, on the
    sheet a player uses every round.
  - *Alternative:* out; W176 stays on the wishlist.
- **JQ8 — An amount that crosses zero on TOL Spent.** J4's order checks
  the CRB first; the default if it's silent is **one Cascade check for the
  amount**, as one spell's cost is one check. If the CRB doesn't say, it's a
  flag for Deighton rather than a guess (`close-a-flag`).
