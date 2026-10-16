# Work order P11: SFR and movement on Main

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3.

**Scope:** three wishes, all read on Main mid-fight:
- **W97**: Rate of Use counts what you've spent this round. The sheet shows RoU and counts nothing against it.
- **W54**: a written-in (Custom) archetype's SFR pool gets Main's card. Today it's counted only on Trackers.
- **W98**: Walk, Run, Sprint and Jump on Main, from MOB (`0530`, and Deighton's Jump ruling, Q23).

**Status:** **drafted 2026-10-15 by Claude (Opus)**, pre-flighted against `main` at `3cc2575` (P10, #195, merged; app 0.46.0, game data 0.39, character schema 0.26). 0.46.0 was released the same evening (v0.46.0, game data 0.39). **Ken answered PQ1–PQ8 on 2026-10-15** (§4): all eight take their defaults, PQ6 as meters. No flag opens.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md) (*The cadence*). Ken starts **P11 build** (Sonnet) and, once the PR is open, a fresh reviewer (Opus).

**Carried over from P10's review:**
- **The order's miss:** the cap equalled the pool, so a full hold rolled 0 dice, and the sheet promised an exploding 10 from nothing. Neither the order nor the build had done the arithmetic at the edges. **Applied here:** §9 pins each edge as a test: a turn count exactly at RoU, one past it, a pool of 0, MOB 1 (Jump rounds to 0), and a Custom pool with no max.
- **The sweep's miss:** P10 counted writers of a value by its name, and missed writers that reach it through a local alias (`t = ch.trackers`). **Applied here:** §5 lists every writer of `trackers.sfr.spent`, found by reading `feed`, `goUnfed`, `goUnrested` and `adjustPanelTracker`, not by grepping the field. The Thirst's daily loss is one of them, and it must **not** count against RoU (trap 1).
- **The build:** nothing to carry. Its "Where the order didn't fit" list was the most useful part of the PR again; keep doing it.

**What P11 is.** A Vampire spends SFR from the Trackers tab's SFR row (−1/+1), and Main's SFR card shows what's left with "RoU 4" beneath it. Nothing counts a round. A player can spend a whole pool in one turn, and the sheet doesn't notice (W97, Brogan). A Custom archetype that ticks **Uses SFR** sets its pool's size on Trackers, but Main shows no SFR card for it (W54). MOB's description promises running speed, sprint speed and a jump, and the sheet shows none of them (W98, Brogan). P11 makes the round's spend something the sheet counts and clears on **Turn Reset**, gives the Custom pool its card, and puts the four movement numbers on Main.

**Probes against `main`** (`3cc2575`; locked characters at Street Level, every stat 5):

```
vampire   sfr(ch)                      { value: 11, rou: 4, formula: "WILL × 3 + 8" }
vampire   +5 on the SFR row            trackers.sfr.spent 5; nothing records "this round"
vampire   resolveReset, nothing ticks  hasEffect false   ← Apply Reset is disabled today (resetPanelHtml → actButtons)
werewolf  sfr(ch)                      { value: 8, rou: 3 }
custom    Uses SFR, max typed as 12    archPanels: ["sfr"]; sfr(ch) null   ← so Main shows no SFR card (W54)
custom    where the 12 lives           trackers.panel.sfr.max (written by the UI, data-trkmax); the spend is trackers.sfr.spent
professional MOB                       5; the quick reference's movement rows are text: ["Run", "MOB ×3", "−1"]
```

**The wish and the book disagree once:** W98 says Fleet of Foot "doubles all three". The book (`0412_Professional.md` ~266) and the data (True Warrior's Power Style) say **Run, Sprint, and Jump are doubled**: Walk isn't. Build the book's. W98's text is corrected when it moves to `wishes-granted.md`.

**The wish cites the wrong decision:** W98's "as numbers (Decision 134)" means **135** (a number is a number; 134 is Focused Skills).

---

## 1. Goal

When P11 is merged:

1. **SFR spent this round is counted.** Each +1 on an SFR tracker that has a Rate of Use adds 1 to this round's count. Main's SFR card and the Trackers row show it ("3 of 4 this round").
2. **At RoU the sheet says so; past it, it warns** (PQ1: warn, never block). The +1 still works: past RoU is the GM's call.
3. **Turn Reset clears the count**, and is pressable when nothing ticks but SFR was spent. The Thirst's daily loss, Feeding and the −1 correction are not spending (PQ3).
4. **A Custom archetype's SFR pool has Main's card** when its max is set: what's left of it, with no RoU line, since it has no Rate of Use (PQ5).
5. **Main shows movement:** Walk, Run, Sprint and Jump from the live MOB (a Werewolf's form counts), with Run's and Sprint's attack penalties. A True Warrior also sees a second line, "Fleet of Foot, while active". A Condition that changes movement (Prone, Restrained) is named beside it, not computed (PQ7).

## 2. Tier, versions, numbers

**Tier: Rule or shape.** A new saved field (W97), two data shapes (W97's per-round cap on a panel; W98's movement numbers and a movement grant), and player-facing behaviour. **Two numbered decisions**, the next free numbers on `origin/main` when you write them: **N** (W97, the round's count) and **N+1** (W98, movement). W54 is a Fix inside the order: no decision of its own; its line goes in N's *Decided*. **No flag:** PQ6 was answered (meters).

**Character schema: 0.26 → 0.27**, with its `migrate()` step in the same commit: `trackers.sfr.turn` is new. (The Custom pool's `trackers.panel.<id>.max` already exists and `migrate` already keeps it as a number or null, `engine.js` ~3709. No step is needed for it.)

**Table schema:** no bump. GM mode's encounter rows don't read a character's SFR (`grep -n "sfr" src/ui/gm.js` finds nothing).

**App version.** Check `CHANGELOG.md`'s heading and the tags:
- **0.46.0 released** (`git tag | sort -V | tail -1` is `v0.46.0`, the expected case): `npm run bump -- 0.47.0`, minor: new things a player can do.
- **0.46.0 still unreleased:** no bump.

**Game data:** a panel field, the movement numbers, and Fleet of Foot's grant. A character can observe them (Decision 68).
- **0.39 released:** `gamedataVersion` 0.40.
- **0.39 still unreleased:** no bump.

Say in the PR which case applied.

## 3. The decisions, drafted

Write them as Decisions **N** and **N+1** in `SCHEMA.md` §4. N's INDEX §3 line goes under the topic Decision 201 (the Thirst) is filed under; N+1's under the one Decision 104 (Natural Armor's conditional grants) is filed under. Fill in Ken's answers; trim only if `docs.test.mjs` says one is over 350 words.

```
N. **SFR spent this round is counted against Rate of Use and cleared by Turn Reset; the sheet warns at RoU and never blocks.**
     *2026-10-1x · Ken + Claude · Touches: trackers.sfr.turn, turnCap, adjustPanelTracker, panelTracker, resolveReset, applyReset, Turn Reset, hasEffect, sfr(), panelMax, trackers.panel.<id>.max, Main's SFR card, the SFR popover, Custom (Uses SFR), RoU, W97, W54*
     - **Decided:** an SFR tracker whose panel declares `turnCap` counts each +1 into `trackers.<resource>.turn`; the −1 takes back from it first (PQ3). Feeding, A day unfed and A day without rest move `spent` and never `turn`. At the cap the row and Main's card say so, past it they warn (PQ1); the spend still lands. Turn Reset sets `turn` to 0 and can be applied when that's all it does. Sustained powers are spent by the player each round (PQ2). A Custom pool's player-set max is read by the engine (`panelMax`), so `sfr()` and Main's card see it (W54); it has no RoU, so nothing is counted for it (PQ5). Schema 0.27.
     - **Why:** W97 (Brogan): a whole pool spent in one turn went unnoticed. W54: the Custom pool was invisible on Main.
     - **Rejected:** <PQ alternatives Ken didn't take>; deriving the round's count from `spent` (the Thirst's daily loss would count as channelled); a block (the GM's rule taken out of their hands).
     - **Replaces:** nothing in the ledger. Extends Decision 201's resource (`trackers.sfr`) and Decision 135's tracker `counts`/`resource` with `turnCap`.
     - **Revisit if:** sustained powers' costs become numbers (W-next, PQ2); a Custom pool needs a Rate of Use (PQ5); GM mode's encounter Reset (Decision 189) should clear a linked character's count.
     - **Built:** app …, game data …, character schema 0.27, PR #…. Log 2026-10-1x (P11).

N+1. **Movement is computed from MOB: Walk, Run and Sprint by the book's multipliers, Jump as Sprint ÷ 4 rounded down, and Fleet of Foot doubles Run and Sprint while active.**
     *2026-10-1x · Ken + Claude · Touches: movementRules, movement(), MOB, statTable, Walk, Run, Sprint, Jump, Fleet of Foot, grants type "movement", while, True Warrior, Main's Combat section, Prone, Restrained, the quick reference's movement table, W98*
     - **Decided:** `movementRules` holds each pace's multiplier and attack penalty, and Jump's source and divisor, as numbers; `movement(ch)` reads the live MOB (a shifted form counts, Decision 195). A `movement` grant with `while` is listed, never summed (as Natural Armor's conditional grants are, Decision 104): Fleet of Foot doubles Run and Sprint, and Jump is computed from the doubled Sprint (Deighton, Q23). A Condition that changes movement is named, not computed (PQ7). The quick reference's table stays text, and a guard keeps it and the numbers agreeing.
     - **Why:** W98 (Brogan): MOB promised speeds the sheet never showed.
     - **Rejected:** <PQ alternatives Ken didn't take>; doubling Walk (the book doesn't); a Fleet of Foot toggle saved on the character (no Chi ability has an active state on the sheet; Iron Shirt is listed the same way); generating the quick reference's rows from the numbers (two readers of one table, for a table nobody edits).
     - **Replaces:** nothing.
     - **Revisit if:** Chi abilities get an active state; a power's or spell's MOB bonus (Preternatural Speed, Wind Walker, Apex Fury) is computed; Prone's halving is ruled with its rounding.
     - **Built:** app …, game data …, PR #…. Log 2026-10-1x (P11).
```

**Check *Replaces* against the text, not the title.** Search §4 for `sfr`, `RoU`, `Turn Reset`, `resolveReset`, `hasEffect`, `panelMax`, `trkmax`, `MOB`, `movement` and `Fleet`. The pre-flight found: 135 (tracker `counts`/`resource`), 199 (`grants()` `rou`), 201 (the Thirst writes `trackers.sfr.spent`), 100 and 189 (Turn Reset, and GM mode's per-row Reset). None is replaced; N extends 135 and 201. If something else turns up, mark it.

## 4. Questions for Ken

| Id | Question | Default | Answer |
|---|---|---|---|
| PQ1 | **At RoU: warn or block?** (W97's open question) | **Warn.** At the cap: "4 of 4 this round: that's your Rate of Use." Past it: "6 this round, 2 past your Rate of Use. Your GM's call." The +1 still lands. *Alternative:* block the +1 at the cap. But the book's "limits" is the GM's to enforce, a block can't be argued with mid-fight, and a mis-tap past the cap would need an Admin edit. || **Ken, 2026-10-15: the default.** |
| PQ2 | **Sustained powers** ("2 SFR per round, sustained", "Rank per round, sustained"). | **The player spends them each round**, with +1 like anything else; the count catches it. A wish (W-next) to mark a power active and have Turn Reset charge it. *Alternative:* an Active toggle per sustained power now. But every cost is text ("Rank + 2 per round"), so that's a data pass over ~10 powers turning costs into numbers (Decision 135) first: a P of its own. || **Ken, 2026-10-15: the default.** |
| PQ3 | **What isn't spending.** | **Feeding, A day unfed and A day without rest** move the pool and never the round's count. **The −1** is a correction: it takes back from this round's count first, never below 0. **Undo** restores whatever was saved, count included (it's a structural diff). *Alternative:* −1 leaves the count alone. But then a mis-tap +1 then −1 reads as a spend. || **Ken, 2026-10-15: the default.** |
| PQ4 | **Where the count shows, and where you spend.** | **Main's SFR card** gains a sub-line ("RoU 4 · 3 this round") and **opens a popover with the SFR row's −1/+1**, as Luck's does, so a fight doesn't need the Trackers tab. **The Trackers row** shows the same line. *Alternative:* the count on both, spending only on Trackers, as today. Smaller, but P10 put Let go on Main for the same reason: the Trackers tab is a tab away mid-fight. || **Ken, 2026-10-15: the default.** |
| PQ5 | **A Custom pool and RoU.** (W54) | **Main's card shows the pool once its max is set, and no RoU line.** A Custom archetype has no Rate of Use in the data, so nothing is counted for it. A wish if a tester asks for a player-set RoU. *Alternative:* a RoU field beside the max on Trackers. Another number for a GM to invent with the player, for a case no tester has raised. || **Ken, 2026-10-15: the default.** |
| PQ6 | **Movement's units.** The book never says what MOB measures (`0530` ~190: "Your MOB is the baseline"); range bands are in meters. | **Meters**, written "m" ("Walk 5m · Run 15m"), if Ken confirms it's the book's intent (it's his CRB). *If not answered:* bare numbers and a flag (F-next) for the unit, `playerNote` on `movementRules`. W100 (meters or feet) would build on whichever. || **Ken, 2026-10-15: meters, the default.** Write "m"; no flag. |
| PQ7 | **Conditions that change movement.** Prone ("Movement halved"), Restrained ("Movement reduced to 0"). | **Named beside the numbers, not computed**: "Prone: movement halved." Halving's rounding isn't ruled, and the numbers stay MOB's. *Alternative:* a `movement: { times }` on each Condition and computed numbers. Neater, but it would round a half nobody ruled. || **Ken, 2026-10-15: the default.** |
| PQ8 | **Movement on the print sheet.** | **Not in P11.** Main only; print is unchanged. A wish if the table wants it on paper. *Alternative:* a line on the print sheet's combat card. Print has its own layout decisions; keep P11 to Main. || **Ken, 2026-10-15: the default.** |

## 5. What this changes underneath (the assumption sweep)

Found by grepping the readers of each thing it touches, **one level further** (their readers that render), and, for a stored field, **every writer, read through local aliases** (`t = ch.trackers`, `t[p.resource]`), not just `grep "sfr.spent"`:
`trackers.sfr`, `t[p.resource]`, `panelStore`, `adjustPanelTracker`, `panelTracker`, `panelMax`, `data-trk`, `data-trkmax`, `sfr(`, `Engine.sfr(`, `.rou`, `feed(`, `goUnfed`, `goUnrested`, `resolveReset`, `applyReset`, `hasEffect`, `resetPanelHtml`, `actButtons`, `vitalPopover`, `MOB`, `statTable`, `movement`, `Fleet of Foot`, `"while"`, `naturalArmor(`, `conditionTotalsNote`, the quick reference's `Movement` rows.

**Check each row yourself before you build**, and say in the PR if one is wrong. Ask two questions of every row:
- **Which guards read a value this changes?**
- **Where does each new note or name render?**

| Today | Where | After P11 |
|---|---|---|
| `trackers.sfr` is `{ spent }` | `newCharacter` ~84; `migrate` ~3692, ~3763 | `{ spent, turn }`; `migrate` makes `turn` a whole number ≥ 0 (junk → 0). Constraint 8: survives the round trip. |
| **Writers of `trackers.sfr.spent`** (via `t[p.resource]`) | `adjustPanelTracker` (~2875, the −1/+1); `feed` (~3213); `goUnfed` (~3224); `goUnrested` (~3240) | **Only `adjustPanelTracker` touches `turn`**, and only for a panel with `turnCap`: +n adds n, −n takes back first (PQ3). The other three **must not** (trap 1). A test on each (§9 P11 4). |
| SFR tracker panels: Vampire, Werewolf (`max: "startingSFR"`, `resource: "sfr"`), Custom (`resource: "sfr"`, no `max`, `when: "sfr"`) | data ~2585, ~2885, ~3041 | Vampire's and Werewolf's gain **`"turnCap": "rou"`**, read as `sfr(ch).rou`. Custom's doesn't (PQ5). **The data-key guard** fails until `turnCap` is read. Expected. No panel id in code (Decision 135). |
| `panelTracker(ch, p)` → `{ count, max, down, shown }` | `engine.js` ~2867 | Adds `turn: { spent, cap, at, past }` when the panel has `turnCap` and the cap is a number, else `null`. **Readers:** the Trackers tab's row (`sheet.js` ~1366), and Main's card and popover (new). |
| `panelMax(ch, p)`: `"TOL"`, `"startingSFR"`, a number, else `null` | `engine.js` ~2843 | Falls back to the stored player-set max (`trackers.panel[p.id].max`, a number ≥ 0) when the data gives none. **Readers:** `panelTracker`, `adjustPanelTracker`'s `stepsFrom` clamp, `feedView`. The Trackers row's own `manualMax` read (`sheet.js` ~1370) then reads the engine's. |
| `sfr(ch)` is `null` without a scaling row's `startingSFR` | `engine.js` ~484 | For an archetype with an SFR tracker panel and no scaling row, returns `{ value: <panelMax>, rou: null, formula: "", setBy: "player" }` once the max is set; `null` before. **Readers:** the vitals bar (`sheet.js` ~225), the vitals panel (~256), Main's card (~361), the wizard's vitals (`wizard.js` ~85, ~107), `panelMax`'s `startingSFR` branch, and `feedView` (a Custom has no feed panel). **Each that prints `RoU ${…rou}` must hide it when `rou` is null** (Main ~361 and `wizard.js` ~107 do today; `undefined` would render). |
| `resolveReset` → `hasEffect: total>0 || !!dyingCheck` | `engine.js` ~1898 | Adds `turnSpend: [{ title, spent }]` for each `turnCap` panel with `turn>0`, and `hasEffect` includes it. **Renders:** the Turn Reset panel's result ("SFR spent this round: 3 → 0") and its Apply button (`actButtons(r.ok && r.hasEffect, …)`, `sheet.js` ~1118). The commit label (`sheet.js` ~3198) names it. |
| `applyReset` writes `damage`, marks, Conditions | `engine.js` ~1902 | Also sets each `turnCap` resource's `turn` to 0. One commit, one Undo. **GM mode's Reset** (`resolveEncounterReset`, Decision 189) is unchanged: it doesn't touch a character. |
| Main's SFR card: `cond("sfr", …, "RoU ${sf.rou}", …)`, no popover | `sheet.js` ~359–362 | Sub-line "RoU 4 · 3 this round" (with the at/past wording, PQ1), the danger class at the cap; opens a popover with the row's −1/+1 (PQ4). **`vitalPopover`** (~1276) gains an `sfr` key. **`cardsAfterLuck`** (~356) counts the SFR card for a Custom pool too, or W45's "alone" layout breaks. |
| MOB has no derived numbers | data ~79 (MOB's description) | `movementRules: { stat:"MOB", paces:[{ id, name, times, attack }], jump:{ name, from:"sprint", divideBy:4 } }`, and engine **`movement(ch)`** → `{ mob, paces:[{ id, name, value, attack }], jump, conditional:[{ name, while, paces, jump }], conditions:[{ name, short }] }`. Reads `statTable(ch)` (live, a form's +2 MOB counts), not `baseStatTable`. |
| The quick reference's Movement rows: `["Run", "MOB ×3", "−1"]` | data ~4373 | **Unchanged text.** A new guard: each row's multiplier and penalty equal `movementRules`' numbers. **Readers of the table:** the Reference tab and GM mode's Reference (Decision 204): unchanged. |
| True Warrior's Power Style: "Fleet of Foot [Chi 3]: Run, Sprint, and Jump are doubled." (text); its `grants` holds Iron Shirt's `naturalArmor` | data ~2351, ~2357 | `grants` gains `{ "type": "movement", "id": "fleet-of-foot", "name": "Fleet of Foot", "times": 2, "paces": ["run", "sprint"], "while": "while active" }`. **Readers of `grants`:** `grants()` (~162) ignores an unknown type (it falls through); `naturalArmor` (~932) returns at `g.type!=="naturalArmor"`. Confirm both, and that no other `grants` reader iterates types it doesn't know. |
| Conditions Prone ("half move"), Restrained ("can't move") | data ~4288, ~4292 | Named on the movement line by their `short` text when active (PQ7). How to pick them without naming ids in code: a Condition gains **`"movement": true`** (a flag read by `movement()`), or the builder proposes better in the PR. **No Condition id in code.** |
| Main's Combat section | `sheet.js` ~384 | A movement line at its top, before the weapons: "Walk 5m · Run 15m (−1) · Sprint 30m (−3) · Jump 7m", the Fleet line beneath for a True Warrior. **Phone width:** it wraps, never scrolls sideways. |
| SCHEMA §3's `trackers` and §2's data sketch | `SCHEMA.md` (search `sfr:    { spent`, `quickReference`/`coreMechanic.panels`) | `turn` with its rule; `turnCap`; `movementRules`; the `movement` grant type; the Condition flag. |
| `SCHEMA_VERSION = "0.26"` and its literals in `tests/` | `engine.js` ~25 | `"0.27"`. **Expected breaks:** the `"0.26"` literals (`grep -c '"0.26"' tests/*.mjs`). |
| GM mode | `gm.js` | **Not a reader** of a character's SFR or MOB (`grep -n "sfr\|movement\|MOB" src/ui/gm.js`). Confirm. |
| Archetype ids in code | `engine.test.mjs` (the A8 guard) | No `vampire`, `werewolf`, `custom`, `professional` or `true-warrior` in `src/engine` or `src/ui`: the cap comes from `turnCap`, Fleet from its grant. |

## 6. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- `docs/WISHLIST.md` W97, W54, W98; `docs/reference/rulings-2026-10-10.md` Q23 (Jump).
- `private/crb/0530_Combat_Encounters.md` *Movement* (~188–200) and its quick-reference table (~790); `0412_Professional.md` Fleet of Foot (~266); `0413_Vampire.md` and `0414_Werewolf.md` on RoU (search "Rate of Use").
- `SCHEMA.md` §4: **135** (tracker `counts`/`resource`, numbers as numbers), **199** (`grants()`' `rou`), **201** (the Thirst), **100** and **189** (Turn Reset), **104** (Natural Armor's conditional grants), **195** (a form's stats). W45's card layout is in `renderShMain` (search `aloneLast`), not a decision.
- `src/engine/engine.js`:
  - `sfr` (~484), `grants` (~161), `statTable` (~309);
  - `panelMax`, `panelStore`, `panelTracker`, `adjustPanelTracker` (~2843–2885);
  - `feed`, `goUnfed`, `goUnrested` (~3213–3250);
  - `resolveReset`, `applyReset` (~1869–1925);
  - `naturalArmor` (~928) for the `while` pattern;
  - `migrate`'s trackers (~3692, ~3709, ~3763).
- `src/ui/sheet.js`:
  - `sheetVitalsBar` (~210), `vitalsPanelHtml` (~236);
  - `renderShMain`'s vitals and Combat section (~324–390), `vitalPopover` (~1276);
  - the Trackers tab's tracker rows (~1366) and their handlers (`data-trk` ~3226, `data-trkmax` ~3270);
  - `resetPanelHtml` (~1097) and the Apply handler (~3187).

## 7. Out of scope

- **Rolling anything.** The sheet counts; the player and GM decide.
- **Charging sustained powers automatically** (PQ2).
- **A Custom pool's Rate of Use** (PQ5).
- **Computing a Condition's movement** (PQ7), or a power's or spell's MOB bonus (Preternatural Speed, Wind Walker, Apex Fury: text today).
- **A Fleet of Foot toggle**, or any Chi ability's active state.
- **The print sheet** (PQ8), and **GM mode's** encounter Reset.
- **W100** (meters or feet).

## 8. The shape

**Data:**

```
// on Vampire's and Werewolf's SFR tracker panels:
"turnCap": "rou"

"movementRules": { "stat": "MOB",
  "paces": [ { "id": "walk", "name": "Walk", "times": 1, "attack": 0 },
             { "id": "run", "name": "Run", "times": 3, "attack": -1 },
             { "id": "sprint", "name": "Sprint", "times": 6, "attack": -3 } ],
  "jump": { "name": "Jump", "from": "sprint", "divideBy": 4 },
  "unit": "m" }                         // PQ6: meters (Ken)

// True Warrior's grants, beside Iron Shirt's:
{ "type": "movement", "id": "fleet-of-foot", "name": "Fleet of Foot", "times": 2, "paces": ["run", "sprint"], "while": "while active" }

// Prone and Restrained:
"movement": true
```

**The saved file (schema 0.27):** **`trackers.sfr.turn`**, a whole number, `0` by default. It's the SFR spent since the last Turn Reset, an input (constraint 7): never derived from `spent`.

**Engine:**

1. **`adjustPanelTracker(ch, id, delta)`**: for a panel with `turnCap`, a positive delta adds to `turn`; a negative one takes `min(turn, −delta)` back. Its result gains `turn` (the new count) and `cap`.
2. **`panelTracker`** gains `turn: { spent, cap, at: spent===cap, past: max(0, spent−cap) }`, or `null` without a numeric cap.
3. **`panelMax`** falls back to the stored player-set max; **`sfr`** returns a Custom pool as §5 says.
4. **`resolveReset`** gains `turnSpend` and widens `hasEffect`; **`applyReset`** zeroes `turn`.
5. **`movement(ch)`** as §5: each pace `floor(MOB × times)`; Jump `floor(Sprint ÷ divideBy)`; each conditional grant's paces `× times` with Jump from its Sprint; the active Conditions flagged `movement`. **Edges:** MOB 1 gives Jump 1 (6 ÷ 4); MOB 0 (an Admin edit) gives all zeros, never a negative, never a throw.
6. **Total:** junk `trackers.sfr` (a string, `{ turn: "x" }`, `{ turn: -3 }`, `null`) reads as 0 and migrates to 0; `movement` on a character with no stats or a junk MOB returns zeros.

**UI** (behaviour, not markup):
- **Main's SFR card:** "RoU 4 · 3 this round"; at the cap, "4 of 4 this round: that's your Rate of Use", the danger class; past it, "6 this round, 2 past your Rate of Use. Your GM's call." Pressing it opens the popover with the row's −1/+1 and the same line (PQ4).
- **The Trackers row:** the same line, under the pool.
- **Turn Reset:** "SFR spent this round: 3 → 0" in its result; Apply is pressable for that alone.
- **A Custom pool:** Main's card once its max is set, no RoU line.
- **Main's Combat section:** the movement line, the Fleet line for a True Warrior, the Condition names when one is active.
- **Mark for a voice pass:** every new line above.

| Press | Where the record lands | Where focus goes |
|---|---|---|
| Main's SFR card → popover +1 | `spent` +1, `turn` +1 (one commit) | stays on +1, the line re-read |
| Trackers → SFR +1 / −1 | as above / takes back | stays on the button |
| Turn Reset → Apply, SFR spent | `turn` → 0 (with any ticks, one commit) | as today after Apply |
| Feed / A day unfed | `spent` only | as today |

**Nothing to do:** a character with no SFR tracker shows no count; a Custom with no max shows no card; a character with no MOB (a junk file) shows zeros, not an error.

## 9. Worked examples, as the tests you write

**Write them first and run them on `main`'s code.** Each must fail, or you must say why it passes. Ruling tests in `rules.test.mjs` cite the book or `rulings-2026-10-10.md`.

| Test name | File | Setup → result |
|---|---|---|
| `P11 1: Walk, Run and Sprint are MOB ×1, ×3 and ×6, and Jump is Sprint ÷ 4 rounded down` | rules | MOB 5 → 5, 15, 30, Jump 7; penalties 0, −1, −3. MOB 1 → 1, 3, 6, Jump 1. Per `0530` and Q23. |
| `P11 2: Fleet of Foot doubles Run and Sprint, not Walk, and Jump comes from the doubled Sprint` | rules | A True Warrior, MOB 5 → its conditional line: Run 30, Sprint 60, Jump 15 (not 14); Walk absent. Per `0412` and Q23. |
| `P11 3: a round's spend is counted, and only spending counts` | engine | A Vampire, RoU 4: +3 → `turn` 3; −1 → 2; −5 → 0, `spent` 0. **Asserted on `trackers.sfr.turn`**. |
| `P11 4: Feeding and the Thirst move the pool, never the round` | engine | +2 (turn 2); `goUnfed` → `spent` rises, `turn` still 2; `feed` → `spent` falls, `turn` still 2; `goUnrested` likewise. |
| `P11 5: at RoU and past it` | engine | +4 → `turn: { spent:4, cap:4, at:true, past:0 }`; +2 more → `{ spent:6, at:false, past:2 }`. The +1 past the cap landed (`spent` 6): **warn, never block** (PQ1). |
| `P11 6: Turn Reset clears the round, and can be applied for that alone` | engine | Nothing ticking, `turn` 3 → `resolveReset().hasEffect` true, `turnSpend` names SFR; `applyReset` → `turn` 0, `spent` unchanged. With `turn` 0 and nothing ticking → `hasEffect` false (today's behaviour kept). |
| `P11 7: a Custom pool's max is read by the engine` | engine | Custom, Uses SFR, max 12, spent 5 → `sfr(ch)` `{ value:12, rou:null }`, `panelTracker` max 12, `turn` null. No max → `sfr(ch)` null. A Vampire's `sfr()` unchanged. |
| `P11 8: the round's count survives migrate and a hostile file` | engine | Junk as §8.6 reads and migrates to 0; a round trip is equal; the schema reads 0.27; `newCharacter()` has `trackers.sfr.turn: 0`. **Asserted on the migrated object.** |
| `P11 9: movement reads the live MOB and names a Condition that changes it` | engine | A Werewolf in Werewolf form → MOB +2 counted. Prone active → `conditions` names it; the numbers unchanged (PQ7). MOB 0 → zeros. |
| `P11 10: Main's SFR card counts the round and warns past RoU` | smoke-sheet-play | A Vampire: popover +1 ×5 → the card says "5 this round, 1 past your Rate of Use"; the spend landed; Turn Reset's Apply is enabled and clears it; one Undo puts it back. |
| `P11 11: a Custom pool gets Main's card` | smoke-sheet-play | Custom, Uses SFR, max typed 12 on Trackers → Main has an SFR card "12/12" and no "RoU" text; W45's layout class is right (the card alone on its row or not). |
| `P11 12: Main shows movement, and Fleet of Foot for a True Warrior` | smoke-sheet-play | Main's Combat section has "Walk 5m · Run 15m (−1) · Sprint 30m (−3) · Jump 7m"; a True Warrior also has "Fleet of Foot, while active"; a Vampire hasn't. |

## 10. Tests beyond §9

- **Totality:** add a "junk SFR round" Vampire and a "MOB 0" character to `degenerates()` (`engine.test.mjs`), and add `movement` to the reader list (it takes `(ch)` alone). Call `adjustPanelTracker` with junk deltas.
- **The quick reference agrees:** each Movement row's "MOB ×N" and penalty equal `movementRules` (P11's guard; mutate one side to prove it).
- **Hostile:** a Custom pool's max as script-y text renders as nothing (the engine reads a number or null).
- **Voice:** the new copy passes `voice.test.mjs`; no flag id renders (constraint 9).
- **The archetype-id guard** passes: no archetype, specialization or Condition id in code.
- **Phone width:** `npm run phone-check`, and Main at 375px with the movement line and a Fleet line.

## 11. Mutants, each of which must fail a test

List them in the PR and the log. **Second paths were checked in the pre-flight**; each line says what else could cover it.

1. `turn` counted from `spent`'s change (P11 4). **Second path:** none; this is the trap.
2. `goUnfed` (or `feed`) touching `turn` (P11 4).
3. The −1 leaving `turn` alone (P11 3).
4. A block at the cap: the +1 refused (P11 5, asserted on `spent`).
5. Turn Reset not clearing `turn` (P11 6). **Second path:** the reader could hide the count after a Reset some other way, so assert on `trackers.sfr.turn`.
6. `hasEffect` not widened: Apply stays disabled with only SFR spent (P11 6 and P11 10).
7. `migrate` keeping a negative or non-number `turn` (P11 8). **Second path:** the reader clamps too, so assert on the migrated object.
8. Fleet doubling Walk (P11 2).
9. Jump computed as `2 × floor(Sprint ÷ 4)` instead of from the doubled Sprint (P11 2: 14, not 15).
10. `movement` reading `baseStatTable` (P11 9: the form's +2 is lost).
11. A Custom `sfr()` returning `rou: undefined`, rendering "RoU undefined" (P11 11, asserted on the text).

## 12. Steps

1. `git submodule update --init private`, then `npm run test:fast` on a fresh branch from `origin/main`. Note the totals. PQ1–PQ8 are answered in §4 (all defaults, PQ6 meters).
2. Write §9's rows. Run them on `main`'s code and keep the output.
3. Data (§8), then the engine (§8.1–6), then `migrate`. `npm run test:fast`.
4. The UI (§8). `npm run verify`.
5. **Run it in the dev preview** (`shadows-dev-preview`):
   - a locked Vampire: spend 5 from Main's popover; read the card at 4 and at 5; Turn Reset with nothing ticking clears it; Undo;
   - Feed and A day unfed after spending: the count doesn't move;
   - a Custom with Uses SFR: type a max on Trackers, then read Main;
   - a Professional True Warrior: the movement line and the Fleet line; set Prone;
   - a Werewolf: switch to Werewolf form, and Run goes up by 6;
   - at phone width: Main's card, the popover and the movement line. Use metrics if the screenshot times out.
6. Docs:
   - Decisions N and N+1 with their INDEX lines; SCHEMA §2 and §3.
   - W97, W54 and W98 to `wishes-granted.md` (W98's "doubles all three" corrected); W-next for PQ2's active powers (Ken took the default); the plan's P11 row.
   - CHANGELOG plus `npm run changelog`; versions per §2.
7. `npm run verify` and `npm run phone-check`.

## 13. Stop and ask

- A row of §5 turns out to be wrong, and the fix isn't a line or two (likeliest: `panelMax`'s fallback changes what `feedView` or the `stepsFrom` clamp sees).
- **A code change outside:**
  - the engine functions named in §5 and §8, `migrate` and `newCharacter`;
  - Main's vitals and Combat section, `vitalPopover`, the Trackers tab's tracker rows and handlers, the Turn Reset panel and its Apply, and the vitals bar and panel's SFR line.
- An answer in §4 that reads differently from what you're about to build: they're Ken's, not yours.
- A test outside these **expected breaks** fails:
  - the `"0.26"` schema literals the bump moves;
  - the data-key guard, until `turnCap`, `movementRules` and the Condition flag are read;
  - `"newCharacter matches the documented character schema"`, until SCHEMA §3 and `newCharacter` both carry `turn`;
  - a test asserting Turn Reset's Apply is disabled with nothing ticking (it still is, unless SFR was spent: check which it asserts).

## 14. Close-out and review checklist

**Close-out:** the close-the-session skill, *Rule or shape* tier. That covers:
- Decisions N and N+1 and their INDEX lines;
- the log entry, with the mutants;
- `shipped.md`'s row;
- the plan's P11 row; W97, W54 and W98 granted;
- CHANGELOG plus `npm run changelog`;
- versions per §2;
- STATE rewritten (the Vampire / Werewolf and the Custom archetype rows, or wherever SFR lives in §3).

Suggested CHANGELOG lines (player voice):

- **Your Rate of Use counts the round.** Spend SFR from Main's SFR card or the Trackers tab, and the sheet counts what you've spent this round. It tells you when you reach your Rate of Use and when you go past it; Turn Reset starts the count again.
- **A written-in pool shows on Main.** A Custom archetype that uses SFR gets Main's SFR card once you set its size.
- **Main shows how far you move.** Walk, Run, Sprint and Jump from your MOB, with the attack penalty for running and sprinting, and Fleet of Foot's distances for a True Warrior.

**Review checklist:**

- [ ] §9's twelve tests exist with those names, and the PR shows them run on `main`'s code.
- [ ] §5's rows are each confirmed or corrected in the PR, **including every writer of `trackers.sfr.spent`** and the readers one level further out.
- [ ] `git diff origin/main --stat -- src/engine src/ui` touches only what §13 allows.
- [ ] No archetype, specialization or Condition id in `src/engine` or `src/ui` (the A8 guard passes).
- [ ] Decisions N and N+1 pass `docs.test.mjs`; *Replaces* checked against the ledger's text.
- [ ] Schema 0.27 with its `migrate()` step; `newCharacter` round trip.
- [ ] The dev-preview run happened (§12.5), including Undo and phone width.
- [ ] Mutants are listed in the PR **and** the log, with 1, 5 and 7 asserted on the saved object.
- [ ] `npm run verify` and `phone-check` are green; versions are per §2, and the PR says which case.

## 15. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<plan>/<order>` = `sheet-wishlist/P11-sfr-and-movement.md`, `<id>` = **P11**, and these traps under the builder's:

> Six things in this order are easy to get wrong:
>
> 1. **The round's count is its own field, not a diff of `spent`.** The Thirst's daily loss and Feeding move `spent` too, and they aren't channelling. Only the tracker's +1 counts.
> 2. **Warn, never block** (PQ1, Ken's answer). The +1 past RoU lands.
> 3. **Turn Reset must be pressable for the count alone.** Today `hasEffect` keeps Apply disabled when nothing ticks.
> 4. **A Custom pool has no RoU.** Every reader that prints `RoU ${…}` must hide it when it's null, or players read "RoU undefined".
> 5. **Fleet of Foot doubles Run and Sprint, not Walk** (the book, not W98's text), and Jump comes from the doubled Sprint: 15, not 14, at MOB 5.
> 6. **No archetype, specialization or Condition id in code.** The cap is `turnCap`, Fleet is a grant, a Condition says `movement: true`. Write a regex into a file with the editor, never through a shell heredoc.
>
> Tier: Rule or shape. Two numbered decisions, the next free; no flag (PQ6: meters). Character schema 0.27. Versions per §2. Use the close-the-session skill at the end.
