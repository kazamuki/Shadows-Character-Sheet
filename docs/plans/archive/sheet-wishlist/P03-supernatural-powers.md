# Work order P3 — Vampire and Werewolf powers at creation

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W88, W105**
(`WISHLIST.md`); flags **F38, F39, F41**; Decisions 157, 162, 194, 196, 200, 201;
`reference/rulings-2026-10-10.md` Q20–Q21.
**Status:** **drafted 2026-10-11 by Claude (Opus)**, pre-flighted against
`main` at `153c1f7` (#160, P2, merged). **Approved by Ken 2026-10-11, PQ1–PQ6 on their defaults.** Ready to build.
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs alone.** It touches `engine.js`, `shadows-data.js`, `wizard.js` and
`sheet.js`, plus tests and docs. Nothing in `gm.js` or `private/`.

**What P3 is.** Brogan made a Vampire and expected its Innate powers to come
free, and CP to raise a power the way it raises an Arcanist's Discipline.
Neither works. Ken ruled on 2026-10-10 for both archetypes (W88), and Deighton
ruled the Upyr's Built to Last and the Vampire's Day Rest (W105). Today's
behaviour is the stubs: F39's (a Vampire spends Base Powers on Innate and
Bloodline powers alike, Decision 200), F38's (a Werewolf holds every Innate and
Origin power and spends nothing, Decision 196), and F41's (Built to Last is a
creation pick). P3 replaces all three stubs with the rulings, and gives each
saved character a migration path.

---

## 1. Goal

When P3 is merged:

1. **Innate powers are granted.** A Vampire and a Werewolf hold every Innate
   power at rank 1 without spending anything. A power with no ranks
   (Preternatural Speed) is held.
2. **Base Powers buy the Bloodline's or the Origin's powers.** One Base Power
   is one rank, and no Base Power raises a power past Max Starting Rank or the
   book's printed maximum. Two Base Powers in one power make it rank 2. They
   can't be placed in an Innate power.
3. **The Werewolf spends Base Powers too**, in the wizard and on Admin, the
   same way the Vampire does. Its Origin's starter power is still the
   Origin's, as today (PQ4).
4. **CP raises any held, ranked power**, Innate or bought, at 5 CP a rank
   (Decision 157's `powerRankCost()`). It sits on the CP step beside the
   Disciplines and counts in `cp()`. Its cap is PQ1's.
5. **An Upyr can hold both Iron Hide and Icebound Resilience** (F41). They're
   ordinary Upyr powers (PQ5), and the hit panel never adds both: it counts the
   higher.
6. **A day without rest** is a button on the Thirst panel, beside **A day
   unfed**, and takes half RoU + 2 SFR (PQ6).
7. **Saved characters migrate** (schema bump): a Vampire's Base Powers placed in
   Innate powers come back to be placed again, and a Werewolf's Base Powers
   start unplaced (PQ2, PQ3). A locked character places them on Admin, as it
   can today.
8. **F38, F39 and F41 close**, with three edits each.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** It changes engine behaviour, data shapes and the save
  file. One numbered decision covers it all, since it's one model.
- **Decision number:** the next free number in `SCHEMA.md` §4 on `origin/main`
  when you build (`CLAUDE.md`, *Decisions*). This order writes it **N**.
- **App:** **minor** (`npm run bump -- X.Y.0`). CP buying power ranks is a new
  capability. The current number is in `docs/STATE.md`.
- **Game data:** **bump** (Decision 68). Available choices change: what Base
  Powers can buy, what CP can buy, and the Upyr's choice is gone.
- **Character schema:** **bump, with a `migrate()` step.** A new stored field
  (`archetypeChoices.powerCp`), and `basePowers` changes meaning for the
  Vampire.
- **CHANGELOG:** lines under `[Unreleased]`, player voice (§12).

## 3. The decision, drafted

```
N. **A Vampire's and a Werewolf's Innate powers are granted at rank 1; Base Powers buy ranks in the Bloodline's or Origin's powers; CP raises any held power; an Upyr holds both Built to Last powers; a day without rest costs half RoU + 2.**
     *2026-10-1x · Ken + Deighton + Claude · Touches: powersBought, granted, archetypePowers, powerPool, basePowerState, placeBasePower, archetypeChoices.basePowers, archetypeChoices.powerCp, powerCpSpent, cp, Max Starting Rank, Max Power Rank, maxRank, starterPower, Built to Last, Iron Hide, Icebound Resilience, noStack, naturalArmor, optionPicks, feed panel, unrested, goUnrested, A day without rest, Admin Base Powers, character schema 0.20, F38, F39, F41, W88, W105*
     - **Decided:** Under `powersBought`, a power with no `origin` is granted at rank 1 (`granted: "innate"`), and Base Powers place ranks only in the specialization's powers, none past Max Starting Rank or the printed max. The Werewolf buys this way too. CP raises any held, ranked power at `powerRankCost()` a rank (`archetypeChoices.powerCp`), up to Max Power Rank and the printed max. Built to Last is no longer a choice: both powers are Upyr powers, and `noStack` counts only the higher. A day without rest takes half RoU + 2. Schema 0.20: `powerCp`, and Base Powers placed in a granted power are given back.
     - **Why:** Ken's ruling from the first playtest (W88), and Deighton's on F41 and Day Rest (Q20, Q21). One model serves both archetypes, as Decision 196 meant it to.
     - **Rejected:** Max Starting Rank capping CP too (CP could raise nothing at Street Level, PQ1); grandfathering a saved Werewolf's whole kit (two rules at one table, PQ2); a Vampire's Innate placements turned into CP ranks (spends CP it may not have, PQ3); a rank on the starter power (nothing for it to raise, PQ4); both Built to Last powers free (two powers no other Bloodline gets, PQ5); a day without rest as +2 beside A day unfed (charges the half twice, PQ6).
     - **Replaces:** Decision 196 in part (the Werewolf no longer holds every Origin power; Base Powers buy them). Decision 200 in part (Innate powers are granted, not bought; Built to Last is not a pick). Extends Decision 157 (the one power price now reaches archetype powers) and 201 (the Thirst gains a day without rest).
     - **Revisit if:** W72 lets IP learn an unheld Bloodline or Origin power, `0450`'s ceilings change what binds play, or Deighton defines how a power that doesn't stack combines with anything else.
     - **Built:** app X.Y.0, game data 0.xx, schema 0.20, PR #…, log 2026-10-1x.
```

Marks: 196 gets *→ **Superseded in part by Decision N**: Innate powers are
granted, and Base Powers buy the Origin's.* 200 gets *→ **Superseded in part by
Decision N**: Innate powers are granted, Base Powers buy only the Bloodline's,
and Built to Last is not a pick.* Their INDEX lines get *→ **superseded in part
by N***. The new INDEX §3 line goes under the archetypes topic, beside 200:
`- **N** *(Supernatural powers at creation — sheet-wishlist P3, W88, W105)* —
Innate powers granted at rank 1; Base Powers buy the Bloodline's or Origin's,
Werewolf included; CP raises any held power; an Upyr holds both Built to Last
powers, never stacked; a day without rest; schema 0.20.`

Keep the entry under `docs.test.mjs`'s word cap. P2's ran over, so trim
**Why** before you trim **Decided**.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| PQ1 | **Which cap binds at creation.** Max Starting Rank (MSR: Werewolf 1/1/2/2, Vampire 1/2/2/3) and Max Power Rank (MPR: 2/3/4/5) both bind a rank at creation, and MPR is always the higher. `0413` reads "no power starts above your Max Starting Rank". Your W88 ruling reads "CP raises any held power … capped by Max Power Rank". | **MSR binds Base Powers; MPR binds CP.** A Base Power can't take a power past MSR, and CP can then raise it to MPR. The printed `maxRank` binds both (a Werewolf's 3, Cursed Evolution's 3). The other reading has MSR cap the starting rank however it's bought. Then CP at Street Level could raise nothing, for either archetype, and that's what Brogan hit. `crb-catch-up.md`'s 0413 line already says "Bloodline powers"; it gains "no Base Power takes a power above MSR; CP can raise it to MPR". **Ken, 2026-10-11: the default** |
| PQ2 | **A saved Werewolf.** Today it holds every Origin power at rank 1. After P3 it holds the Innate powers and whatever its Base Powers place, and nothing is placed yet. | **Place nothing; the player places them on Admin.** Admin already has the Base Powers block (Decision 200). Until they're placed, the Character tab says how many are left and points at Admin. IP already spent on an Origin power stays in `powerIpe`, and `versionCheck` already reports it ("…that power isn't on the sheet any more"). Placing a Base Power there brings the power back with its IP ranks. The alternative is to grandfather every saved Werewolf's full kit. That stores a flag the rules don't know, and makes two Werewolves at one table play by different rules. **Ken, 2026-10-11: the default** |
| PQ3 | **A saved Vampire** whose Base Powers went into an Innate power. | **Given back to place again (W88 says so).** `migrate()` drops `basePowers` keys for granted powers, so that power drops to rank 1, granted. The freed Base Powers wait on Admin, as in PQ2. The alternative is to convert a placement above rank 1 into CP ranks, but that spends CP the character may not have. **Ken, 2026-10-11: the default** |
| PQ4 | **The Werewolf's starter power** (Moonsworn, Aspect of the Beast, CyberWolf Protocol). W88 says "granted at rank 1". `0414` gives it no rank and no per-rank line; in the data it's an Origin's `starterPower`, not one of `powers`. | **It stays as it is:** the Origin's, held, shown with the Origin, and unranked. A rank would raise nothing. `crb-catch-up.md`'s 0414 line drops "at rank 1" for the starter power. **Ken, 2026-10-11: the default** |
| PQ5 | **What "holds both" means for Built to Last** (F41). | **Both are ordinary Upyr powers.** A Base Power, CP or IP buys either or both, and neither is free. That's the reading F41 asked about: "two powers that only don't stack". The alternative is that both come free with the Bloodline. That gives an Upyr two powers no other Bloodline gets. **Don't stack:** each grant carries `noStack: "built-to-last"`, and `naturalArmor()` counts only the higher of a `noStack` group's active grants. The feature text becomes "Iron Hide is a long shell, Icebound Resilience a short surge. You can hold both; they don't stack." **Ken, 2026-10-11: the default** |
| PQ6 | **A day without rest** (Q21: "1/2 Rate of Use per day + 2 more SFR lost for not resting. It doesn't rise.") | **One button, "A day without rest", that takes half RoU + 2, pressed instead of "A day unfed", not as well as it.** Deighton's note counts the day's Thirst inside it, so pressing both would charge the half twice. The panel's line says so. The other reading is +2 on its own, pressed beside A day unfed. **Ken, 2026-10-11: the default** |

## 5. Read first

- `CLAUDE.md`, then `docs/STATE.md`. Decisions **157** (one power price),
  **162** (lock once every point that can buy something is spent), **194**
  (ranks and IP), **196** (the Werewolf), **200** (the Vampire), **201** (the
  Thirst), **104** (Natural Armor), **124** (a file is untrusted).
- `docs/WISHLIST.md` W88 and W105; `reference/rulings-2026-10-10.md` Q20–Q21;
  `private/crb/0413_Vampire.md` (scaling table ~43; Built to Last ~115; Innate
  ~185; Day Rest ~444) and `0414_Werewolf.md` (scaling ~45; "whole kit" ~52;
  starter powers ~113, 148, 177).
- `src/engine/engine.js`:
  - `powerRankCost`, `disciplineSpent`, `cp` (~528–546).
  - `naturalArmor` (~853–890).
  - `archetypePowers`, `powerPool`, `basePowersOf`, `basePowerState`,
    `placeBasePower` (~2415–2490); `optionChoiceDefs`/`setOptionPick` (~2495–2540).
  - `feedView`, `goUnfed` (~2575–2625); `powerAllowance`, `powerRanks` (~2627–2645).
  - `migrate()`'s schema 0.19 step (~3238–3252); `spendable()` (~3514, 3519);
    `validate`'s Base Powers block (~3630–3640); `versionCheck`'s power block (~3818).
  - `newCharacter`'s `archetypeChoices` (~53).
- `src/ui/wizard.js`: the archetype step's `basePowersHtml` (~312, ~423–445),
  the CP step's Disciplines (~589–597), the specialization switch that drops
  stray placements (~854–858), `stepper` kinds (~1086–1091).
- `src/ui/sheet.js`: the Character tab's Powers part and its `allowHtml` with
  F38's flag (~485–505); Admin's `adminArchChoicesHtml` (~1487–1495) and its
  handlers (~3250–3270); the Thirst panel (~1992–2003) and its handlers (~2913–2935);
  the hit panel's Natural Armor row (~808).
- `src/data/shadows-data.js`: the Werewolf (`flagged`, `flagNote`, `playerNote`;
  `powers`; `specialization.options[].starterPower`) and the Vampire
  (`flagged`, `flagNote`, `powersBought`, `powers`, Upyr's `features` and
  `choices` ~2520–2545, the `thirst` panel).

## 6. Out of scope

- **W72** (learning an unheld Bloodline or Origin power with IP, 40 IP). P11.
  Raise a Power still lists only held powers.
- **Cursed Evolution's other-Bloodline powers, Splice, the Vampire's Majors**
  (P4b of `crb-v4-sync`).
- **Supernatural ceilings past 10** (Q22, still open).
- **GM mode.** Nothing in `gm.js` reads these.
- **The book.** `crb-catch-up.md` already has the 0413/0414 lines. Touch them
  only as PQ1 and PQ4 say.

## 7. The shape

### 7a. Data

1. **`powersBought` on both archetypes**, with one new key:
   `{ countBy, maxRankBy, granted: "innate" }`. `granted: "innate"` means every
   power with no `origin` is held at rank 1, and Base Powers never go into one.
   The Werewolf gains `powersBought` with the same `countBy`/`maxRankBy` paths
   as the Vampire's (its scaling table already has `basePowers` and
   `maxStartingRank`). Decision 135: the key is read by code, and no archetype
   id appears in code.
2. **The Werewolf and the Vampire lose `flagged`/`flagNote`** (F38, F39), and
   the Werewolf loses F38's `playerNote`. Check that nothing else on either
   archetype is flagged before removing `flagged`.
3. **Upyr:** the `built-to-last` entry leaves `choices` (F41), and the feature's
   text changes (PQ5). Iron Hide's and Icebound Resilience's `naturalArmor`
   grants each gain `"noStack": "built-to-last"`.
4. **The Thirst panel** gains
   `"unrested": { "label": "A day without rest", "share": 0.5, "plus": 2, "text": "Instead of A day unfed: the day's Thirst and 2 more." }`
   (PQ6). Word the text in VOICE-APP's tool voice; flag it for a voice pass
   if it's doing narrative work.
5. **Scaling notes:** the Vampire's `campaignPowerScaling.notes` says "Spend
   your Base Powers on Innate and Bloodline powers". It becomes "Innate powers
   are yours at rank 1. Spend your Base Powers on your Bloodline's powers; none
   starts above your Max Starting Rank." The Werewolf's gains the Origin
   equivalent.

### 7b. Engine

1. **`powerPool(ch)`** loses the Built to Last bar. The `power`-type choice
   code stays generic: no data uses it now, so check whether the engine-key
   guard (Decision 135) objects. If it does, stop and ask (§11).
2. **`archetypePowers(ch)`:** with `powersBought`, a power is held if it's
   granted (no `origin`, and `granted === "innate"`) **or** has a placement.
   Its rank is `start + cp + ipe`, where `start` is 1 for a granted or
   unranked power and the placement otherwise, and `cp` is
   `powerCp[id]` (0 for an unranked one). Without `powersBought` (no archetype
   today), keep the current behaviour.
3. **`basePowerState(ch)`:** `rows` lists only the specialization's powers.
   Each row's `cap` stays `min(MSR, printed)`. A placement in a granted power
   counts as `stray`, so validate names it. `migrate()` removes these, so in
   practice this only catches an undo or a hand edit.
4. **CP on powers.** Add `powerCpOf(ch)` (normalized like `basePowersOf`),
   `powerCpSpent(ch)` (the sum × `powerRankCost()`), and
   `powerCpState(ch)` → `[{ id, name, start, cp, rank, cap }]` for every held,
   ranked archetype power. Here `cap = min(Max Power Rank, printed maxRank)` and
   `rank = start + cp` (creation only, without IP). Add
   `buyPowerRank(ch, id, delta)` → `{ ok }` or `{ ok, why }`: it refuses an
   unheld or unranked power, a rank past `cap`, and a buy CP can't cover.
   `cp()` adds `powerCpSpent` beside `disciplineSpent`.
5. **`placeBasePower(ch, id, -1)`** that takes a power's last placement away also
   drops `powerCp[id]`, so CP is never left on a power nobody holds. Do the
   same in both specialization switches (wizard ~858, Admin ~3255): clear
   `powerCp` for ids that left the pool.
6. **`spendable(ch, "cp")`** needs no change: it's already true whenever LUCK
   is affordable, and a power rank costs more. Say so in a comment, and pin it
   in a test (§9).
7. **`validate("archetype")`:** keep the Base Powers block. Add, for CP:
   CP in a power not held → error ("Take back the CP in X"); a CP rank past
   `cap` → error.
8. **`naturalArmor(ch, activeIds)`:** among `counted` grants that share a
   `noStack` value, keep only the highest. Don't change `always`/`conditional`
   as listed; only the sum.
9. **`feedView`/`goUnrested(ch, panelId)`:** `unrested` mirrors `unfed`, with
   amount `floor(rou × share) + plus`, stopping at empty. One Undo each.
10. **`migrate()`, schema 0.20:** `archetypeChoices.powerCp` normalized like
   `basePowers` (whole, positive, capped at `ip.rankCap`, junk dropped). For an
   archetype with `powersBought.granted`, drop `basePowers` keys that name a
   granted power (PQ3). Nothing else for the Werewolf (PQ2). Leave an Upyr's
   `optionPicks["built-to-last"]` alone: nothing reads it (W105 asked to check;
   say in the PR what you found). Add `powerCp:{}` to `newCharacter()`.
11. **`powerAllowance`** stays (the Character tab's "Base Powers N · Max
    Starting Rank M" line). Rewrite its comment: it's no longer F38's stub.

### 7c. UI

1. **Wizard, archetype step.** `basePowersHtml` shows the Werewolf's block as
   well as the Vampire's. **Innate powers** appear as a group with no stepper
   and the tag *granted · rank 1* (*granted* for an unranked one). The
   specialization's powers have steppers, as today. The intro line under
   "Powers — place N Base Powers" says Base Powers go into the
   Bloodline's/Origin's powers. Take the noun from `specialization.label`, not
   by archetype.
2. **Wizard, CP step.** A **Powers** section after Disciplines: "Powers — 5 CP
   per rank", one row per `powerCpState` row, the stepper kind `apow|<id>`, up
   while `rank < cap` and CP covers it. It looks like the Disciplines rows.
3. **Character tab.** Drop `flagHtml(a)` from `allowHtml`. On a locked
   character with `basePowerState().left > 0`, add one line under the
   allowance: "N Base Powers to place, on Admin." (tool voice).
4. **Admin.** No new block: `adminArchChoicesHtml` already shows
   `basePowersHtml`, and Built to Last's picker goes because its choice is gone.
   Check that the Werewolf's Admin shows the block (its specialization has
   options and `specializationNeed` is 1).
5. **Thirst panel** (Main and Trackers): the **A day without rest** button
   beside **A day unfed**, with its amount, `data-unrested`, and one commit
   labelled like Feed's.
6. **Hit panel:** no change. Both Built to Last grants show as conditional
   rows, and the total counts the higher.

## 8. Worked examples (pin these)

| Character | Base Powers / MSR / MPR | Placed | CP | Holds |
|---|---|---|---|---|
| Street Strigoi | 2 / 1 / 2 | Shadow Play 1, Veil of Night 1 | Bestial Blessings +1 (5 CP) | Bestial Blessings 2, Vitality Surge 1, Preternatural Speed, Cursed Evolution 1, Shadow Play 1, Veil of Night 1 |
| Street Strigoi | — | Shadow Play 2 | — | refused: "Shadow Play can start at rank 1 at most." |
| Street Strigoi | — | Bestial Blessings 1 | — | refused: Innate powers aren't bought |
| Shadows Trueborn | 2 / 2 / 4 | Apex Fury 2 | Apex Fury +1 (5 CP) | 5 Innate at 1; Apex Fury 3 (printed max 3: a 4th CP rank is refused) |
| Heroic Upyr | 3 / 2 / 3 | Iron Hide 2, Icebound Resilience 1 | — | both held; hit panel with both active: Natural Armor 3 (Iron Hide's rank + 1), not 4 |
| Street Werewolf saved at 0.19, IP 2 in Apex Fury | 1 / 1 / 2 | none (migrated) | — | 5 Innate at 1; Apex Fury not held; versionCheck names it; one Base Power on Admin brings it back at 1 + 2 = 3 |
| Heroic Vampire saved at 0.19, `basePowers { bestial-blessings: 2, shadow-play: 1 }` | 3 / 2 / 3 | migrated to `{ shadow-play: 1 }` | — | Bestial Blessings 1 (granted); 2 Base Powers to place |
| Vampire, RoU 6, SFR 30 full | — | — | — | A day without rest: −5 (3 + 2); A day unfed: −3 |

Check each row against the data before pinning it. Read the Werewolf's and the
Vampire's printed maxima, and each power level's MSR and MPR, from
`shadows-data.js`, not from this table.

## 9. Tests

Every new guard is **mutation-tested** against the code it guards (§10).

**Tests that encode a superseded stub get updated in the same change as the
decision** (CLAUDE.md's exception). Don't delete one; rewrite it to the ruling,
and keep its name saying which decision it now pins:
- `engine.test.mjs` ~5160–5250 (Decision 200: placement on Innate, Built to
  Last's bar, Iron Hide's rank), ~5202 (`basePowerState(werewolf)` is null:
  it isn't now), ~5319–5340 (schema 0.19's migrate test stays; add 0.20's).
- `rules.test.mjs` ~1364–1366 (`powersBought`'s exact JSON gains `granted`),
  ~1419 (Built to Last's choice: now absent, and the feature's text).
- `smoke.test.mjs` ~5545–5552 (F38's player note: it's gone now).
- `hostile.test.mjs` ~49: add `powerCp` junk beside `basePowers`.

**New, in `engine.test.mjs`** (one per row of §8 at least):
1. Granted: a fresh Vampire and Werewolf of each specialization hold every
   Innate power at rank 1 with no placement.
2. Base Powers refuse an Innate power and a rank past MSR or the printed max.
3. CP: `buyPowerRank` raises a granted and a bought power, refuses past the
   cap (PQ1), an unranked power and an unheld one; `cp().spent` moves by
   `powerRankCost()` a rank; taking the last placement back drops the CP;
   `spendable(ch, "cp")` is unchanged.
4. `noStack`: both Built to Last powers active count the higher; one counts
   itself; a grant without `noStack` still sums.
5. `goUnrested`: half RoU + 2, stops at empty, one Undo.
6. `migrate()` 0.20: `powerCp` normalized (junk, negatives, fractions, huge);
   the Vampire's granted placements dropped and the others kept; the Werewolf
   untouched but for the stamp; a round trip of `newCharacter()` keeps `powerCp`
   (constraint 8).
7. `versionCheck` on the migrated Werewolf of §8 names the power, and stops
   naming it once a Base Power is placed.

**`rules.test.mjs`:** the book's scaling rows are already pinned. Add the
Werewolf's `powersBought` paths reading the same columns as the Vampire's.

**`smoke.test.mjs`:**
8. Wizard: a Street Strigoi's archetype step shows the Innate powers granted
   with no stepper, and its Bloodline's with steppers; the CP step shows
   Powers, and a press spends 5 CP.
9. Wizard: a Werewolf's archetype step has the Base Powers block.
10. A locked Vampire migrated with unplaced Base Powers: the Character tab
    says how many and points at Admin; placing one on Admin is one Undo.
11. Thirst: A day without rest on Main takes the right amount, and Undo puts
    it back.

## 10. Steps

1. Branch from `main`. `npm ci`, `git submodule update --init private`, then
   `npm run verify` (note the count).
2. Take the decision's number (§2).
3. Data (§7a). `npm run test:fast`: the rules tests that read the old shapes
   fail here. Update them as §9 says, never weaker.
4. Engine (§7b) with its tests 1–7. `npm run test:fast`.
5. UI (§7c) with smoke tests 8–11. `npm run verify`, `npm run phone-check`.
6. **Mutation-test:** let Base Powers into an Innate power (2 fails); drop
   `powerCpSpent` from `cp()` (3 fails); sum `noStack` grants (4 fails); leave
   out the migrate step that drops granted placements (6 fails). Record each
   in the PR.
7. Run it with `shadows-dev-preview`: make a Street Strigoi and a Shadows
   Trueborn through the wizard; import a 0.19 Vampire and Werewolf (build them
   on `main` first, or hand-write a fixture) and place their Base Powers on
   Admin; press A day without rest. Screenshots for the PR, phone and desktop.
8. Close out (§12).

## 11. Stop and ask

- If the engine-key guard (Decision 135) fails once Built to Last leaves
  `choices` because no data uses `type: "power"` any more. Don't delete the
  code path or invent data to feed it; say which.
- If anything other than F38/F39 keeps either archetype `flagged`.
- If a test outside §9's list fails, and it isn't one that encodes 196 or 200's
  stubs. Name it.
- If `0413`/`0414`'s numbers disagree with the data for any row of §8.
- If PQ1's cap makes any existing locked character fail `validate`: say which
  fixture and how.

## 12. Close-out

Use the **close-the-session** skill. For this session:

- **CHANGELOG**, player voice, then `npm run changelog`:
  - "**Vampire and Werewolf powers work the way the book means.** Your Innate
    powers are yours at rank 1. Base Powers buy your Bloodline's or Origin's
    powers, and CP raises any power you hold, 5 CP a rank."
  - "**Saved Vampires and Werewolves:** Base Powers that need placing again are
    waiting on Admin."
  - "**An Upyr can hold both Iron Hide and Icebound Resilience.** They don't
    stack: a hit counts the higher."
  - "**A day without rest** is on the Thirst panel: half your RoU and 2 more."
- `npm run bump -- X.Y.0`; `gamedataVersion` per Decision 68; schema 0.20.
- **Decision N** in `SCHEMA.md` §4, the marks on 196 and 200, the INDEX §3 line.
- **F38, F39, F41 close:** each one's §5 row, `flagged` in the data, and its
  INDEX §2 line (the `close-a-flag` skill).
- **W88 and W105** move whole to `log/wishes-granted.md`, each heading pointing
  at Decision N, and out of `WISHLIST.md`.
- **`crb-catch-up.md`:** the 0413 and 0414 power lines as PQ1 and PQ4 say.
- **STATE**: rewrite §5's *Where to start* (P3 built; P4 next), and the
  Vampire/Werewolf sentences in §2 that say "F39's stub" and "F41's stub". Add
  a `log/2026.md` entry and a row on `log/shipped.md`.
- **`sheet-wishlist.md`** §3: P3's status becomes *built, #…*.
- **The release:** say in the PR whether P3 should go out alone. A schema bump
  is worth a release of its own, so playtesters migrate early.

## 13. Review checklist

For the orchestrator, against the PR:

- [ ] §8's table holds, row by row, in tests and in the browser.
- [ ] Innate powers granted for both archetypes; Base Powers refused there.
- [ ] CP: the Powers section on the CP step, `cp()` counts it, the cap is PQ1's,
      and the last placement taken back drops its CP.
- [ ] `noStack` counts the higher; Built to Last's choice is gone; its feature
      text is PQ5's.
- [ ] A day without rest: amount, stops at empty, one Undo.
- [ ] Schema 0.20: `powerCp` round-trips, junk dropped (hostile test), the
      Vampire's granted placements returned, the Werewolf untouched.
- [ ] Locked and migrated: the Character tab points at Admin; Admin places.
- [ ] F38, F39, F41 closed with three edits each; no `flagged` left that names them.
- [ ] Superseded tests rewritten to the ruling, none deleted or weakened.
- [ ] No archetype id in code; `granted` and `noStack` read by code (Decision 135).
- [ ] Versions: app minor, gamedataVersion, schema 0.20; CHANGELOG lines;
      `npm run changelog` run.
- [ ] Mutation tests in the PR.
- [ ] Run it in a browser: wizard for both archetypes, an imported 0.19 file,
      phone and desktop.
