# Work order H1: sustained powers run, and Turn Reset charges them

**Plan:** [`powers-that-run.md`](../powers-that-run.md), session H1. **Wish:** **W110** (Ken, from P11's PQ2).
Decisions 104, 135, 189, 195, 224, 225, 256, 264.
**Status:** **built 2026-11-05** (Decision 266; PR #…). **Drafted 2026-11-05 by Claude (Opus)**, pre-flighted against `main` at `377c2ce` (PR #292 merged: app
0.61.0, released 2026-11-05 after the pre-flight in #294, game data 0.52, character schema 0.32, table 0.19, pack 0.3; the last decision is 265). **Approved
by Ken 2026-11-04** ("All defaults", in the W143 conductor session): the plan's HQ1–HQ4 and this order's HQ6–HQ10 (HQ5 was withdrawn with W144).
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs alone.** H2 and H3 wait on it. It touches `engine.js` (a new reader and three writers, `resolveReset` and
`applyReset`, `setToggle`, `logSession`, `migrate`, `newCharacter`), `sheet.js` (the Character tab's power card,
Main's SFR popover, the Turn Reset panel, Take a hit's Natural Armor boxes), `gm.js` (one line: the seat hit's
boxes), the data (seven `run` rows and the Werewolf's `runsIn`), tests and docs. **Character schema bump** (§8a).
**Carried over** from W143 (PR #292), the last order and its review:
- *The order's misses*: it didn't list four tests its own rule moved; it missed Decision 19's supersession mark;
  it missed the phone-check frame fixture. So §5 lists every test found by grepping the old words and literals,
  §3 lists every decision the ledger search found, and §13 names the fixture.
- *The build's misses*: a worked example didn't pin the value it named (the stored ranks); the Learn stepper's
  `aria-label` read "Raise Learn …". So each §10 row names what it pins, and §9 gives every control's label.
- Ken does the voice pass before merge: §14's **For Ken** list.

**The pre-flight found, in short:**

1. **The book settles the timing.** `0414:180` (fresh): "Sustained powers pay their cost again each round; outside
   an encounter, they cost once per scene." The approved rebalancing sheet says the same for every sustained cost.
   Charging on Start and at every Turn Reset is exactly that: out of a fight nobody presses Reset.
2. **Let It Loose is per round.** Its cost reads "Rank, sustained", with no "per round", but the rebalancing
   sheet defines Sustained as "Pays its cost again every round it stays active". No question for Deighton.
3. **Seven sustained powers**, found by script over every `cost` in the data: Preternatural Speed (2), Veil of
   Night (rank), Iron Hide (rank), Cold Embrace (rank), Blood of Valhalla (rank + 2), Spectral Veil (rank + 2), Let
   It Loose (rank). No Major, Aberration or starter power has a sustained cost. Defiance of Sol's "2 SFR per round"
   is a Major's rule for sunlight, not a power that runs (plan §2.6).
4. **"Running" exists today only for one hit.** `naturalArmor(ch, activeIds)` (`engine.js:1477`) sums a `while`
   grant only when its id is in `activeIds`, which Take a hit builds from unticked boxes (`sheet.js:1007`,
   `S.hit.nat = {}`; the GM's seat hit, `gm.js:2920`, `nat:{}`). Iron Hide and Icebound Resilience are the two
   `while` grants on powers.
5. **The SFR tracker doesn't clamp a spend.** `adjustPanelTracker` (`engine.js:4081`) clamps only a panel with
   `stepsFrom`, and the SFR panel has none, so `spent` can pass the pool. "Left" floors at 0 where it shows. A
   Reset that stops an unpaid power (HQ2) is a new rule, not an existing limit.
6. **Turn Reset is one writer.** `applyReset` (`engine.js:2822`) zeroes every `turnCap` tracker's `turn`.
   `resolveReset` (2786) reports `turnSpend` and `hasEffect`. Main's Health card opens the panel
   (`sheet.js:1450`); the SFR popover's Turn Reset opens the same one (`sheet.js:1412`).
7. **Nothing says a Werewolf's powers need the form.** `0414:180` does. The Form is `panelData.form`
   (Decision 195), set by `setToggle` (`engine.js:723`), which Main's switch calls (`sheet.js:4175`).
8. **The GM's read-only sheet disables what's new by itself.** `inertSheet` (`gm.js:3759`) disables every button
   that isn't on `RO_READERS`. Start and Stop must not be added to that list.

**Probes on `main`** (each the "before" of a §10 row):

| Character | Today |
|---|---|
| Heroic Upyr, Iron Hide placed + 1 CP (rank 2), stats 6 | SFR 17, RoU 6. `naturalArmor(ch, [])` total 0, Iron Hide conditional, 3, not active; with `["iron-hide"]`, 3 |
| The same, +3 SFR on the tracker, then Turn Reset | spent 3, turn 3; `turnSpend` `[{ SFR, 3 }]`; after: spent 3, turn 0. Nothing charged |
| Street Wildblood, Let It Loose placed + 3 IP (rank 4), Werewolf form | SFR 8, RoU 3 (the shift moves neither). Its cost, rank, is 4 |
| Street Wildblood, Let It Loose placed (rank 1), Human form | SFR 8, RoU 3. `setToggle(ch, "form", "Werewolf")` → `{ ok, cost: null }` |
| Heroic Strigoi, Preternatural Speed (Innate, unranked) | rank 1, `ranked: false`; SFR 17, RoU 6 |

---

## 1. Goal and Done when

When this is merged:

1. **A Vampire or Werewolf starts a sustained power from its card**, and the first round's SFR is spent at once,
   counted against this round's Rate of Use. **Stop** ends it. Both are on the Character tab's power card and in
   Main's SFR popover.
2. **Turn Reset charges what's running.** Its panel lists each running power with its cost. Each is kept by
   default and can be stopped there. Apply clears the round and spends the kept ones into the next.
3. **A cost the pool can't pay stops the power** at Reset, and the panel says which and why (HQ2).
4. **A Werewolf's powers run only in Werewolf Form** (`0414:180`, HQ4). Start is refused in human form; shifting
   back stops them in the same press.
5. **Logging a session stops every running power** (HQ3).
6. **Iron Hide and Icebound Resilience's Natural Armor start ticked** on Take a hit while they run, on the sheet
   and on a GM's seat hit. Unticking still works for one hit.
7. **Past Rate of Use it warns and still starts** (Decision 225, HQ7). A Werewolf's power that costs more than its
   RoU also says so, from the data (`0414:180`); a Vampire's doesn't (`0413` prints no such limit).
8. **A GM's read-only sheet shows what's running** and can't change it.
9. **One undo takes back** a Start, a Stop, a Reset or a shift, its SFR included.
10. **Nothing else moves**, shown by an outputs diff (§11): no number on any tab changes for a character with
    nothing running.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** One decision, **N** (the lowest free number on `origin/main` when you write it; 266 at
  the pre-flight).
- **App: minor, `npm run bump -- 0.62.0`** (a new capability). 0.61.0 was released 2026-11-05 (#294). If
  `[Unreleased]` already heads another minor when you build, add to it and don't bump again; say which in the PR.
- **Game data: 0.52 → 0.53** (Decision 68): Turn Reset now spends SFR for a character with a running power, a
  computed value that moves, and two keys are added.
- **Character schema: 0.32 → 0.33** (or the next, if another branch takes it first): `trackers.running` is a new
  stored field, with its `migrate()` step in the same commit.
- **Table and pack schemas: no bump.** A table keeps a seated character's copy, and `migrateTable()` passes each
  one through `migrate()` (`engine.js:7780–7788`), so the copy gains `running` with the character's own step.
- **No flag opens or closes.**

## 3. The decision, drafted

Paste as **N** in `SCHEMA.md` §4, with an INDEX §3 line under the topic Decision 225 is filed under.

```
N. **A sustained power runs from Start until it's stopped: the sheet stores which, Start and every Turn Reset spend its SFR, and a Werewolf's run only in Werewolf Form.**
     *2026-11-xx · Ken + Claude · Touches: trackers.running, runningPowers, isRunning, startPower, stopPower, run, run.sfr, run.each, runsIn, cost, resolveReset, applyReset, turnSpend, running, adjustPanelTracker, setToggle, logSession, naturalArmor activeIds, Take a hit's Natural Armor boxes, the seat hit, Character tab power card, Main's SFR popover, Turn Reset panel, migrate, character schema 0.33, 0414, W110, W132*
     - **Decided:** A power with `run` (`{ sfr: { perRank, plus }, each: "round" }`) can be started by its player; `trackers.running` holds `{ id }` for each, and `runningPowers` is the one reader (held, with `run`, in its archetype's `runsIn` form). Start spends `perRank × rank + plus` through the SFR tracker, so the round counts it; every Turn Reset clears the round, then spends each kept one again, and one the pool can't pay stops. Leaving the form a `runsIn` names, and logging a session, stop them. A `while` grant on a running power starts ticked on Take a hit. Past Rate of Use it warns, and a power costing more than the RoU warns too where the archetype's `powerCostCap` says so.
     - **Why:** W110; `0414:180` and the rebalancing sheet: sustained powers "pay their cost again each round; outside an encounter, they cost once per scene", and a Werewolf's work only in Werewolf Form.
     - **Rejected:** a `running` flag on the power's row (play state, as Decision 224 rejected for a hold); counting rounds down (the player stops a power); stopping at encounter end (the sheet doesn't know one, W128); charging what's left when the pool can't pay (HQ2); refusing Start past RoU (Decision 225); the per-power RoU limit for a Vampire (`0413` prints none); summing `whenText` grants while running (each names a second condition); a cost read from the `cost` text (Decision 135).
     - **Replaces:** Decision 104 in part (a conditional source is asked on a hit only if it isn't running). Decision 225's Revisit if ("sustained powers' costs become numbers") happened; its rule stands. Extends 195 (the form ends a power) and 224 (the same shape of store).
     - **Revisit if:** W128 lets the sheet know an encounter; a power needs a countdown in rounds; a Vampire gets a form rule; H2 or H3 needs `each: "start"` (data only).
     - **Built:** app 0.62.0, game data 0.53, character schema 0.33, PR #…, log 2026-11-xx (H1).
```

**Supersession marks:** Decision 104 already carries four marks, one per line (143, 196, 199, 219), and its INDEX
line chains four. Add a fifth in the same style: `→ **Superseded in part by Decision N** — a conditional source on
a running power starts on.` under the others, and `→ **superseded in part by N**` at the end of its INDEX line.
`docs.test.mjs` compares only the first mark, so it can't catch a missing fifth: check it by eye.

Not superseded, and why: **225** (the round's count and its warning are unchanged; this adds what's spent into
it); **224** (holds stay holds); **195** (extended: the form now also stops a power); **189** (a GM's Reset; this
copies its "Keep a tap away" on the player's side and changes nothing there); **236** (no hit stage moves in H1).

## 4. Questions for Ken

The plan's HQ1–HQ4 come first. These are this order's. Each has a default; a question left blank is answered
"Default" (`WORK-ORDERS.md`).

| Id | Question | Default | Answer |
|---|---|---|---|
| HQ6 | **Where Start and Stop live.** The Character tab's power card has the power's text and cost; Main's SFR popover is where SFR is spent in a fight | **Both**: the card has Start/Stop, the popover lists what's running with Stop and offers Start for each sustained power held | **Ken, 2026-11-04: the default** ("All defaults", in the conductor session). |
| HQ7 | **Past Rate of Use.** `0414:180` says no single power can cost more than RoU, for Werewolves; `0413` prints no such limit. A Street Wildblood's Let It Loose at rank 4 (placed + 3 IP) costs 4 against RoU 3 | **Warn, never refuse** (Decision 225), and **only where the archetype's data names the limit** (`powerCostCap`, the Werewolf today). A Vampire past RoU gets the round's warning every spend gets (225) and no per-power line: warning it would answer a rules question `0413` doesn't ask. Whether Vampires share the limit is a book item for Ken (plan §6) | **Ken, 2026-11-04: the default** ("All defaults", in the conductor session). |
| HQ8 | **Starting a power already running** (a second press, or the popover and the card at once) | **Refused**, "Iron Hide is running." No second charge | **Ken, 2026-11-04: the default** ("All defaults", in the conductor session). |
| HQ9 | **Stop refunds nothing**, even in the round it started | **No refund.** The SFR is spent when it's paid, as the book prices it | **Ken, 2026-11-04: the default** ("All defaults", in the conductor session). |
| HQ10 | **The words on the button.** "Start / Stop" (tool voice), or the book's "activate", or the sheet's own "running" | **Start / Stop**, with the card's line reading "Running · 2 SFR a round". Voice pass | **Ken, 2026-11-04: the default** ("All defaults", in the conductor session). |

## 5. The assumption sweep

Grepped at `377c2ce`. Line numbers are as of the pre-flight.

| What | Today (where) | After | Guards that read it · where it renders · text that points at it |
|---|---|---|---|
| `trackers.running` | — | `[{ id }]`, newCharacter `[]` (`engine.js` ~88, beside `heldSpells`) | `migrate()` (~5048, `heldSpells`'s rule); `hostile.test.mjs:68` (every tracker key filled: add it); `SCHEMA.md` §3's tracker example (~893); the Dead Air sample (`samples/`, regenerated by `tools/sample-table.mjs`); undo's structural diff (by construction) |
| `run` (data) | — | on the seven powers (§8a); `runsIn` and `powerCostCap` on the Werewolf archetype | Decision 135's key guard (`engine.test.mjs` `dataKeys`, ~339): `run`, `sfr`, `each`, `runsIn`, `panel`, `option`, `powerCostCap` must each be read. `perRank` and `plus` are names the grants already use: check the guard doesn't pass them for that reason alone (its known gap, Decision 135) |
| `cost` text | rendered: Character tab card (`sheet.js:598`), print's Uses column (`sheet.js:2915`), wizard Base Powers rows (`wizard.js:444, 452`) | unchanged, and checked against `run` by a test | none of these change |
| `runningPowers`, `isRunning` | — | new, the one reader (plan §2.5) | H2 and H3 read it. Nothing in the UI derives running itself |
| `adjustPanelTracker` | the only writer that counts a round (4081) | Start and Reset's charge go through it (or one helper it shares), so `turn` counts them | `turnCount`, `panelTurnCap`, Main's SFR card (`sheet.js:248, 421`), Trackers' row (279), the popover (1405): all read `spent` and `turn`, so they follow |
| `resolveReset` | `turnSpend`, `hasEffect` (2786) | + `running`: `[{ id, name, sfr, payable }]`, and `hasEffect` true when any power runs | the Reset panel (`sheet.js:1172`, line list 1183); the commit label (3713) |
| `applyReset` | zeroes `turn` (2822) | zeroes `turn`, then charges each kept, payable one and removes the rest; `choices.stop` is the ids the player stopped | `tests` on `applyReset` (grep `applyReset(`): each passes `choices` without `stop`, so nothing they assert moves unless a fixture has `running` |
| `setToggle` | writes the form and its shift cost (723) | also removes `running` entries whose archetype's `runsIn` names this panel and an option that isn't the new one; returns `stopped` | Main's switch (`sheet.js:4175`): its commit label and toast say what stopped |
| `logSession` | pushes the session, clears LUCK spent (3518) | also empties `running`; returns `stopped` | the Sessions tab's commit (`sheet.js:3905`) |
| `naturalArmor(ch, activeIds)` | `while` grants active only by id (1477) | unchanged; the **callers** seed their boxes from `isRunning` when the hit opens | `sheet.js:1007` (`S.hit.nat`), `gm.js:2920` (`encHitNew`'s `nat`), the hit panel's rows (`sheet.js:1090–1094`), `mitigateNatural` (1648). `sheet.js:1065` (`hasNat`) and print's Nat column (`naturalArmor(ch).base`) are unchanged |
| The Character tab power card | rank, cost, drain, uses chips (`sheet.js:590–600`) | + Start/Stop and a "Running" line for a power with `run` | `inertSheet` disables them on the GM's read-only sheet: they must stay off `RO_READERS` (`gm.js`) |
| Main's SFR popover | −1/+1 and Turn Reset (`sheet.js:1405–1412`) | + the running list with Stop, and Start for each sustained power held (HQ6) | the popover's own smoke tests (grep `data-popreset`, `data-trk`) |
| Copy that states the old rule | `turnSpend`'s line "SFR spent this round: 3 → 0." (`sheet.js:1183`); Decision 225's comment "Decision 225: the SFR spent this round is cleared by a Reset" (`engine.js:2813`) | the line gains what's charged next ("…: 3 → 2, Iron Hide running"); the comment names N | tests that pin it: grep `spent this round` in `tests/` |
| The schema literal | `"0.32"` in `engine.test.mjs` (30), `hostile.test.mjs` (2), `smoke-sheet-play.test.mjs` (1), the sample (5), `SCHEMA.md`, `README.md`, `STATE.md` | `"0.33"` | expected breaks (§13) |

**Not touched, checked:** `versionCheck` (reads conditions and the IP journal, never `running`); `cp()` and the
wizard (nothing runs before lock); GM mode's encounter Reset (Decision 189, its own rows; it never writes a
seat); `heldSpells` (a separate list); `movement`'s `while` grants (True Warrior's Chi, not a power with `run`);
the 14 `whenText` "while X runs" grants (they stay marks, plan §2.5).

## 6. Read first

- `CLAUDE.md`, `docs/STATE.md`, and the plan (`powers-that-run.md`), §2 whole.
- Decisions **104, 135, 189, 195, 224, 225, 256, 264** (INDEX tells you where).
- `src/engine/engine.js`: `newCharacter` (~60–95), `sfr` (831), `formState`, `setToggle`, `toggleView` (674–760),
  `naturalArmor` (1477), `mitigateNatural` (1648), `resolveReset`, `applyReset` (2786–2840), `logSession` (3518),
  `heldSpells`, `holdSpell`, `releaseSpell` (3854–3905, the store to copy), `panelMax`, `turnCount`,
  `panelTracker`, `adjustPanelTracker` (4032–4100), `archetypePowers` (4165), `migrate`'s trackers (~5030–5060).
- `src/ui/sheet.js`: the power card (590–600), the hit's state and Natural Armor rows (1007, 1090–1094), the Reset
  panel (1142–1190), the popover (1400–1412), the action handlers (3687–3720), the Form switch (4170–4180).
- `src/ui/gm.js`: `encHitNew` (2920), `inertSheet` and `RO_READERS` (3740–3770).
- `private/crb/0414_Werewolf.md:180`; `private/crb/APPROVED_Vampire_and_Werewolf_rebalancing.md:22–30`.

## 7. Out of scope

- **`each: "start"` powers** (Red Mist, Null Field, Bestial Blessings, Icebound's 3 rounds). H2 and H3 add them
  as data. Don't add a `run` to any of them.
- **Any hit stage or healing.** Spectral Veil's immunity is H2's; Blood of Valhalla's healing is H3's. H1's only
  hit change is the Natural Armor boxes' starting state.
- **Counting rounds down**, encounter end (W128), and a GM writing a seat.
- **Werewolf costs beyond the seven**: "1 SFR per scene", "1 SFR per wolf (up to 3)". They're not sustained.
- **Written-in powers** (`powers[]`): no `run`.
- **`ranked`.** W144 is closed (Ken, 2026-11-05): an unranked power stays `ranked: false`, and nothing here
  changes it.

## 8. The shapes

### 8a. Data and the saved file

1. **`run` on seven powers**, beside `cost` (unchanged):

   | Power | `cost` | `run` |
   |---|---|---|
   | Preternatural Speed (Vampire, Innate, unranked) | "2 SFR per round, sustained" | `{ "sfr": { "plus": 2 }, "each": "round" }` |
   | Veil of Night (Strigoi) | "Rank per round, sustained" | `{ "sfr": { "perRank": 1 }, "each": "round" }` |
   | Iron Hide (Upyr) | "Rank per round, sustained" | the same |
   | Cold Embrace (Upyr) | "Rank per round, sustained" | the same |
   | Blood of Valhalla (Draugur) | "Rank + 2 per round, sustained" | `{ "sfr": { "perRank": 1, "plus": 2 }, "each": "round" }` |
   | Spectral Veil (Draugur) | "Rank + 2 per round, sustained" | the same |
   | Let It Loose (Wildblood) | "Rank, sustained" | `{ "sfr": { "perRank": 1 }, "each": "round" }` |

2. **`runsIn` and `powerCostCap` on the Werewolf archetype**: `runsIn: { "panel": "form", "option": "Werewolf" }`,
   and `powerCostCap: "rou"` (`0414:180`: "no single power can cost more than your RoU"; HQ7). `"rou"` reads the
   same Rate of Use `sfr()` returns, as `turnCap: "rou"` does. The Vampire has neither. It applies to the
   archetype's `powers` (Innate and Origin), which is what `0414:180` names. CyberWolf Protocol is a starter
   power, not in `powers`, so it's exempt by structure, as the book has it. The Vampire has none.
3. **A comment** beside the first `run` saying what it is (Decision N): `each: "round"` pays on Start and at every
   Turn Reset; `"start"` is the activated kind the plan reserves for H2 and H3.
4. **`gamedataVersion`** 0.52 → 0.53.
5. **The saved file:** `trackers.running`, a list of `{ id }`. `newCharacter()` gives `[]`. `migrate()` keeps
   plain objects whose `id` is a non-empty string, each id once, at most 20, the id cut to 120 characters, and
   drops every other key on an entry (H2 adds `used` with its own bump). A file at 0.32 gains `[]`. Character
   schema 0.33. Pin the round trip.

### 8b. Engine

Every reader stays total (constraint 8): bad input gives a refusal or an empty list, never a throw.

1. **`runCost(ch, p)`** → the SFR a running power costs now: `perRank × p.rank + plus`, from `p.run.sfr`, with a
   missing number read as 0 and the result never below 0. `null` for a power with no `run`.
2. **`runningPowers(ch)`** → `[{ id, name, rank, sfr, each, def }]`: each `trackers.running` entry whose id is in
   `archetypePowers(ch)`, whose power has `run`, and whose archetype's `runsIn` (if any) is met by `formState`.
   In `running`'s order. `isRunning(ch, id)` is `runningPowers(ch).some(…)`. **The one place running is
   decided.**
3. **`runnablePowers(ch)`** → the held powers with `run`, each `{ id, name, rank, sfr, running, can: { ok, why } }`
   for the Start control, where `why` is the refusal `startPower` would give (HQ8, the form).
4. **`startPower(ch, id)`**: refuse an id that isn't runnable ("That power doesn't run."), one already running
   ("${name} is running."), one whose form isn't on ("${name} works only in ${option} Form."), and an unlocked
   character ("Powers run once the character is locked."). Else push `{ id }`, then spend `runCost` through the
   SFR tracker's writer so `turn` counts it. Returns `{ ok, sfr, turn }` (the panel's `turn` and cap, as
   `adjustPanelTracker` returns them, so the caller can say "past RoU"), and `overCap: { sfr, rou }` when the
   archetype has `powerCostCap` and this power's cost passes it, else `null`. It starts either way (HQ7).
5. **`stopPower(ch, id)`**: remove every entry with that id. Refuse an id not in the list ("${name} isn't
   running."). No refund (HQ9).
6. **`resolveReset(ch, input)`** adds `running: [{ id, name, sfr, payable }]`, where `payable` is whether the
   pool's left (after this Reset's other changes) covers the running ones in order, each in turn. `hasEffect` is
   true when `running` has any. The line for the round's SFR keeps its shape.
7. **`applyReset(ch, input, choices)`**: zero `turn` as today, then for each `running` row not in `choices.stop`
   (an array of ids): payable, spend its SFR through the writer; not payable, remove it. Every id in
   `choices.stop` is removed. Returns `charged: [{ id, sfr }]` and `stopped: [{ id, why: "stop"|"unpaid" }]`.
8. **`setToggle`**: after writing the option, remove every entry whose power's archetype `runsIn` names this panel
   and an option other than the new one. Return `stopped: [ids]` beside `cost`.
9. **`logSession`**: empty `running`; return `stopped: [ids]` beside `trained`.
10. **Nothing else changes**: `naturalArmor`, `resolveHit`, `sfr`, `heldSpells`, `migrateTable`, `versionCheck`.

## 9. The UI

Copy is drafted for a **voice pass** (`VOICE-APP.md`; tool voice for controls and refusals). Paste each string
into the PR as it renders.

| Where | Today | After |
|---|---|---|
| Character tab, a power with `run` | rank, cost chips | + a line "Running · ${sfr} SFR a round" when it runs, and a button **Start** (or **Stop**). `aria-label` "Start ${name}" / "Stop ${name}". A refused Start is disabled with its `why` as `title` |
| Start past the limit (a Werewolf, HQ7) | — | the toast after Start: "${name} costs ${sfr} SFR, more than your RoU of ${rou}." The power runs |
| Main's SFR popover | −1/+1, Turn Reset | + under the round's line, each running power: "${name} · ${sfr} a round" with **Stop**; then **Start ${name}** for each held sustained power not running (HQ6). The popover's own −1/+1 are unchanged |
| Turn Reset panel | "SFR spent this round: 3 → 0." | + per running power, a row "${name}: ${sfr} SFR to keep it running" with a **Stop** checkbox (unticked = keep). One the pool can't pay reads "${name} stops: it needs ${sfr} SFR, ${left} left." and has no box |
| Take a hit, Natural Armor | boxes start unticked | a `while` grant whose power runs starts **ticked**; its label is unchanged |
| The Form switch | shifts, pays the shift | also stops what needs the form; the toast says "${names} stopped." |
| Log session | logs | also stops; the toast adds "${names} stopped." |
| A GM's read-only sheet | — | the Running line shows; Start and Stop are disabled (`inertSheet`) |
| A GM's seat hit | boxes unticked | as Take a hit: a running power's box starts ticked |

**Where things land** (Decision 164's `keepPlace`):

| Press | The record | Focus |
|---|---|---|
| Start on the card | the card shows Running and Stop | Stop, on the same card |
| Stop on the card | Start again | Start, on the same card |
| Stop in the popover | the row leaves the running list; Start for it appears below | that power's Start in the popover |
| Start in the popover | it moves up to the running list | its Stop in the popover |
| A Reset row's Stop box | stays in the panel until Apply | the box |
| Apply Turn Reset | the panel closes, as today | as today (Main's Turn Reset button) |

## 10. Worked examples, as named tests

Write these first, show them failing on `main`, then build. Characters are `engine.test.mjs`'s `vampire()` and
`werewolf()` helpers (`vampire` gives stats 6), locked. Each row says what it pins.

| # | Test name (file) | Setup → action | Pins |
|---|---|---|---|
| 1 | "Decision N: starting Iron Hide spends rank SFR into this round" (`engine.test.mjs`) | Heroic Upyr, Iron Hide placed + 1 CP (rank 2): `startPower` | `running` `[{ id: "iron-hide" }]`; spent 2, turn 2; `isRunning` true; `runningPowers(ch)[0].sfr` 2 |
| 2 | "Decision N: a Turn Reset charges a running power again" (`engine.test.mjs`) | from 1, +2 on the tracker (spent 4, turn 4): `resolveReset` then `applyReset` | `running` row `{ sfr: 2, payable: true }`; after: turn 2, spent 6, `charged` `[{ iron-hide, 2 }]` |
| 3 | "Decision N: a power stopped at Turn Reset isn't charged" (`engine.test.mjs`) | from 1 + 2 more: `applyReset(…, { stop: ["iron-hide"] })` | turn 0, spent 4, `running` empty, `stopped` `[{ iron-hide, "stop" }]` |
| 4 | "Decision N: a running power the pool can't pay stops at Turn Reset (HQ2)" (`engine.test.mjs`) | Heroic Upyr (SFR 17), spent 16, Iron Hide running: Reset | `payable` false; after: spent 16, `running` empty, `stopped` `[{ iron-hide, "unpaid" }]` |
| 5 | "Decision N: a Werewolf's power runs only in Werewolf Form, and shifting back stops it (0414)" (`engine.test.mjs`) | Street Wildblood, Let It Loose rank 1, Human: `startPower`; `setToggle` Werewolf; `startPower`; `setToggle` Human | refused "Let It Loose works only in Werewolf Form."; then ok, spent 1; then `stopped` `["let-it-loose"]`, `running` empty, spent still 1 |
| 6 | "Decision N: past Rate of Use a Werewolf's power still starts, and says it costs more than the RoU (HQ7, 0414)" (`engine.test.mjs`) | Street Wildblood, Let It Loose placed + 3 IP (rank 4; SFR 8, RoU 3), Werewolf form: `startPower`. Then a Street Draugur, Spectral Veil placed + 2 IP (rank 3; SFR 11, RoU 4) | Wildblood: ok, spent 4, `overCap` `{ sfr: 4, rou: 3 }`, the returned `turn` past its cap of 3. Draugur: ok, spent 5, the `turn` past its cap of 4, **`overCap` null** (no `powerCostCap` on the Vampire) |
| 7 | "Decision N: an unranked sustained power costs its flat price (Preternatural Speed)" (`engine.test.mjs`) | Heroic Strigoi: `startPower("preternatural-speed")` | spent 2 |
| 8 | "Decision N: a power can't start twice, and Stop refunds nothing (HQ8, HQ9)" (`engine.test.mjs`) | from 1: `startPower` again; `stopPower` | refused "Iron Hide is running.", spent still 2; stop: spent 2, `running` empty; `stopPower` again refused "Iron Hide isn't running." |
| 9 | "Decision N: logging a session stops every running power (HQ3)" (`engine.test.mjs`) | Iron Hide and Cold Embrace running: `logSession` | `running` empty, `stopped` both |
| 10 | "Decision N: a running power that isn't held is read as not running, and kept" (`engine.test.mjs`) | `running` `[{ id: "iron-hide" }]` on a Strigoi | `runningPowers` empty, `isRunning` false, `migrate` keeps the entry, Reset charges nothing |
| 11 | "Decision N: every run cost agrees with the power's cost text" (`rules.test.mjs`) | every power with `run`, by script | "Rank + 2" ↔ `{ perRank: 1, plus: 2 }`, "Rank" ↔ `{ perRank: 1 }`, "N SFR" ↔ `{ plus: N }`; "sustained" ↔ `each: "round"`; and every `cost` with "sustained" has a `run` (the seven, computed from the data, not a hand list) |
| 12 | "CRB 0414: sustained powers pay again each round, and a Werewolf's work only in Werewolf Form" (`rules.test.mjs`) | `crb("0414_Werewolf.md")` | the two sentences at `0414:180`; and `APPROVED_…rebalancing`'s Sustained line |
| 13 | "Decision N: trackers.running round-trips through migrate(), and junk is dropped" (`engine.test.mjs`) | a 0.32 file with no `running`; one with `["x", { id: 3 }, { id: "iron-hide", used: 2 }, { id: "iron-hide" }, null]` | `[]`; `[{ id: "iron-hide" }]`; schema 0.33 |
| 14 | "Decision N: one undo takes back a Start and its SFR" (`smoke-sheet-play.test.mjs`) | a locked Upyr on the Character tab: Start Iron Hide; undo | `running` empty, spent 0 |
| 15 | "Decision N: Start and Stop on the card and in the SFR popover, and focus stays" (`smoke-sheet-play.test.mjs`) | the same Upyr: Start on the card; open Main's SFR popover; Stop there | the card reads "Running · 2 SFR a round"; the popover lists it; after Stop, focus on its Start; every new control's `aria-label` as §9 |
| 16 | "Decision N: Turn Reset lists what's running and a Stop box keeps it from being charged" (`smoke-sheet-play.test.mjs`) | Iron Hide running: open Turn Reset, tick its Stop, Apply | the row's text; after: `running` empty, turn 0 |
| 17 | "Decision N: a running Iron Hide's Natural Armor starts ticked on Take a hit" (`smoke-sheet-play.test.mjs`) | running: open Take a hit | its box checked; Natural Armor 3; untick → 0 for that hit, and the box starts ticked on the next |
| 18 | "Decision N: a GM's seat hit starts a running power's box ticked, and the read-only sheet can't stop it" (`smoke-table-seat-fight.test.mjs`) | a seat whose copy runs Iron Hide | the seat hit's box checked; on the read-only sheet the Running line shows and Stop is disabled |

## 11. Tests beyond the examples

- **The outputs diff** (`WORK-ORDERS.md`): `node tools/outputs.mjs before.json` on `main` before any engine change,
  `--against` at the end. **Expected moves:** none for any fixture with nothing running, which is every fixture
  today, apart from the version stamps, the Character tab's Start buttons on the seven powers' cards, and Main's
  SFR popover. Every number on every tab stays put. Paste the summary into the PR.
- **Totality**: `runningPowers`, `runnablePowers`, `startPower`, `stopPower`, `resolveReset`, `applyReset` on a
  character with junk in `trackers.running` (a string, a number, `{}` entries, `null`), no archetype, no power
  level, a `run` with strings for numbers (`withData`), and a `runsIn` naming no panel: no throw.
- **Decision 135**: the key guard sees `run`, `each`, `runsIn`, `panel`, `option`, `powerCostCap` read; no power or archetype id
  in the new code (the existing guard).
- **Hostile** (`hostile.test.mjs`): a file whose `running` holds markup in an id renders it as text everywhere it
  shows (the card, the popover, the Reset row), and undo of a Start writes only inside the character.
- **Voice**: every new string through `voice.test.mjs`. No "activate"/"sustain" jargon in a button.
- **Mutation-test**, listing the mutants in the PR and the log: drop the charge from `startPower`; drop it from
  `applyReset`; let `applyReset` charge an unpayable one; drop the form check from `runningPowers`; drop
  `setToggle`'s stop; drop `logSession`'s stop; seed the hit's boxes unticked; give `overCap` to a Vampire (read the limit without `powerCostCap`); let `runningPowers` count an
  unheld power. Each must fail a test. **Check each for a second path** (the card's disabled Start is not a
  guard: `startPower`'s refusal is).

## 12. Steps

`npm run verify` after each; `npm run test:fast` inside them.

1. `git submodule update --init private`, `npm run verify` on the fresh branch (note the totals), and
   `before.json` with `tools/outputs.mjs` before any engine change.
2. §10's rows as failing tests.
3. Data (8a.1–8a.4) and the store (8a.5, `newCharacter`, `migrate`, the schema bump, the expected literal breaks).
4. Engine 8b.1–8b.5 (start and stop), then 8b.6–8b.7 (Reset), then 8b.8–8b.9 (form and session).
5. The UI: the card, the popover, the Reset panel, the two hits' boxes (§9).
6. The dev preview (`shadows-dev-preview`; `node tools/devserver.mjs` if it isn't wired): a Heroic Upyr starts
   Iron Hide on the card, takes a hit (the box ticked), presses Turn Reset (2 more spent), stops it in the popover;
   Dex in the Dead Air sample can't start Let It Loose in human form, shifts, starts it, shifts back; the card and
   the popover at 375px. Screenshots, or the metrics `WORK-ORDERS.md` names if the tool times out.
7. Docs (§14), Decision N with its mark on 104, CHANGELOG and `npm run changelog`, the versions (§2), the outputs
   diff, `npm run verify`, and `npm run phone-check`.

## 13. Stop and ask

**Stop** if:

- a reader of `trackers.sfr.spent` or `turn` that §5 doesn't list would show a Start's charge wrong, or a second
  writer of `turn` turns up;
- a power's `cost` text fits none of the four kinds (Flat, Rank, Signature, Sustained) once you read it;
- the outputs diff moves a number for a character with nothing running;
- a test other than the ones below breaks.

**Expected breaks, not stops** (update them, never weaken the guard):

- every `"0.32"` character-schema literal (§5's row), and `SCHEMA.md` §3's schema line;
- `hostile.test.mjs:68`'s every-tracker fixture (add `running`);
- a test pinning the Reset's SFR line if it now has the charge on it (grep `spent this round`);
- the Dead Air sample's schema stamps (`tools/sample-table.mjs` regenerates it);
- `phone-check`'s frame fixture: re-record **only** the frames this order moves (the Character tab with a
  Vampire's or Werewolf's power card, Main with the SFR popover if the fixture opens it), and keep the rest. The
  4 `home` frames already differ on `main` (W143's review): leave them;
- the version literals your bumps move.

## 14. Close-out

Use the **close-the-session** skill, Rule-or-shape tier: Decision N with its INDEX line and 104's mark; STATE
rewritten (versions; the powers row; H2 and H3 next); the log entry with the mutants and the outputs diff;
`log/shipped.md`'s row; **W110 moves whole to `log/wishes-granted.md`**, pointing at this order; W132's **Plan**
line keeps pointing at the plan (H2, H3); CHANGELOG plus `npm run changelog`; the versions (§2); this order's
status line reads built, and the plan's H1 row too.

**CHANGELOG** (player voice, drafted):

- **Sustained powers run.** Start one from its card or the SFR popover and its SFR is spent; each Turn Reset spends
  it again, and stops it if you can't pay. Iron Hide's Natural Armor counts on a hit while it runs.
- **A Werewolf's powers run only in Werewolf Form**, and shifting back stops them.

**PR title:** `feat(powers): sustained powers run, and Turn Reset charges them (H1, W110, Decision N)`.
**PR body:** the template's sections, plus *Where the order didn't fit* (empty is fine), the mutants, the outputs
diff's summary, and **For Ken**: every new string as it renders (§9's rows, the four refusals in 8b.4–8b.5, the
two toasts), for the voice pass.

### Review checklist

- [ ] §10's rows pinned, each naming what it pins, each failing on `main` first.
- [ ] `runningPowers` is the one place running is decided; the card, the popover, the Reset and the hits read it.
- [ ] Every charge goes through the SFR tracker's writer, so `turn` counts it; `applyReset` is still the only
      place a round ends.
- [ ] `run` agrees with `cost` by script, and every sustained cost has one.
- [ ] `runsIn` and `powerCostCap` are data; no archetype, panel or option name in code; a Vampire gets no per-power
      RoU line.
- [ ] `migrate()` normalizes `running`; a 0.32 file gains `[]`; junk goes; a hand-edited id renders as text.
- [ ] The seat hit (`gm.js`) and the sheet's hit both seed from `isRunning`; the read-only sheet's Start/Stop are
      disabled and absent from `RO_READERS`.
- [ ] Every new control's `aria-label` reads as §9 (W59's guard covers the steppers only: check these by hand).
- [ ] Decision N passes `docs.test.mjs`'s shape; 104 is marked in SCHEMA and INDEX.
- [ ] The outputs diff moves only §11's expected; `phone-check`'s fixture re-recorded for the moved frames only.
- [ ] Mutants in the PR and the log; `npm run verify` and `phone-check` green; versions per §2.
- [ ] Run in the dev preview: the Upyr, Dex in the sample, 375px.

## 15. Handing it over

The two prompts are `WORK-ORDERS.md`'s, with this order's path,
`docs/plans/powers-that-run/H1-sustained-powers.md`. Session titles: **H1 build** (Sonnet) and **H1 review**
(Opus, fresh). Add these traps under the builder's prompt:

> Six things in this order are easy to get wrong:
>
> 1. **Running is one function.** `runningPowers` decides it. Don't test `trackers.running` directly in the UI, a
>    hit or Reset; a stored id for a power the character no longer holds is not running.
> 2. **Charge through the writer.** `adjustPanelTracker` is the only place a round is counted (Decision 225). A
>    Start or a Reset that writes `spent` directly leaves `turn` wrong, and every RoU warning with it.
> 3. **Reset's order matters.** Zero the round, *then* charge the kept powers into the new one. Charging first and
>    zeroing after loses the charge from the round.
> 4. **The SFR tracker doesn't clamp.** "The pool can't pay" is `left < sfr`, computed: don't rely on the tracker
>    refusing a spend, because it won't.
> 5. **The form is data.** `runsIn` names the panel and the option. CyberWolf Protocol is exempt because it isn't
>    in `powers`, not by a check.
> 6. **The read-only sheet disables new buttons by itself.** Don't add Start or Stop to `RO_READERS`; do check the
>    Running line still shows there.
>
> Tier: Rule or shape. One decision, the next free number. App 0.62.0;
> game data 0.53; character schema 0.33. Use the close-the-session skill at the end.
