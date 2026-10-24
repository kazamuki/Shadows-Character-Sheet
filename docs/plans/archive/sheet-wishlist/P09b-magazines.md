# Work order P9b: Partly spent magazines

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3.

**Scope:** **W104** (F34 alone since P9a). Closes **F34**. Opens no flag.

**Status:** **drafted 2026-10-15 by Claude (Opus)**, pre-flighted against `main` at `bf72019` (P9a, #186, and the plans archive, #187, merged; app 0.45.0 and game data 0.38 unreleased). **Ken answered PQ1–PQ5 on 2026-10-15** (§4): all five take their defaults, and PQ2 adds a **Drop** button on Loadout.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../../gm-mode/README.md) (*The cadence*). Ken starts **P9b build** (Sonnet) and, once the PR is open, a fresh reviewer (Opus).

**Carried over from P9a's review:**
- **The order's misses:**
  - It wrote "Replaces: nothing" when Decision 120's text stated the flags it removed. **Applied here:** §3's *Replaces* was checked against the text of 145 and 149, not their titles.
  - It predicted the key guard needed only `MAPS`. **Applied here:** every guard this order touches is named in §5 with the change it needs.
- **The build's slips:**
  - A guard's regex lost its backslashes on the way through a shell heredoc. **Applied here:** trap 6 in §14.
  - A test guard's exemption was widened for every key, not just the one it needed. **Applied here:** §10 asks for each new guard to be mutation-tested both ways.

**What P9b is.** Deighton ruled F34 (`reference/rulings-2026-10-10.md` Q11): **when you reload before a magazine is empty, the magazine is kept, with its count.** Today the rounds are lost:
- a part-spent magazine is thrown away;
- so is a *full* one swapped out for another kind;
- the swap chooser carries F34's "still being settled" note.

**Probes against `main`** (`bf72019`):

```
AR-9X, 18/31 left, 2 Rifle Rounds mags → Reload    weapon 31/31; gear [rifle-rounds ×1]           ← the 18 rounds are gone
AR-9X full of Silver, 1 Rifle mag → load Rifle     gear []                                         ← a full Silver mag vanished
LP-9 Viper, 6 left, Reload anyway                  gear []                                         ← the 6 rounds are gone
Falcon, 15/20 charge, 1 Power Cell → Reload        weapon 20/20; gear []                           ← the part-used cell is gone
One standard mag fills (Decision 145)              handgun 6+1 … 17+1 · SMG 25+1 … 40+1 · rifle 3+1 … 30+1 · cell 1 … 30
weaponRules.swap                                   flagged, F34; the chooser draws its playerNote
```

The last probe matters for PQ3: one Rifle Rounds magazine fills the VR-50 "Verdict" (3+1) or the AR-9X (30+1), so a magazine taken out of an AR can hold more than a sniper rifle takes.

---

## 1. Goal

When P9b is merged:

1. **A magazine taken out with rounds left in it is kept.** Reload, a swap, or a Reload anyway puts it in your gear as a **part-used magazine**: its own row, its kind (Rifle Rounds, Silver Rounds, a Power Cell) and its count ("18 rounds left").
2. **An empty magazine isn't kept, and a full one goes back on its stack**, as a whole magazine.
3. **A part-used magazine can be loaded again** (§8, PQ2). It loads what it holds, up to what the weapon takes (PQ3), and keeps its kind: a part-used Silver magazine loads Silver.
4. **Part-used rows behave as one magazine each.** They don't stack with whole ones, aren't counted as whole ones, and take no "+1". Loadout and print show their rounds.
5. **The swap chooser says what happens to the old magazine**, with no unsettled note. **F34 is closed** (three edits). W104 moves to `wishes-granted.md`.

## 2. Tier, versions, numbers

**Tier: Rule or shape.** A saved gear row gains a field, `roundsLeft`. That's a character schema bump, a `migrate()` step and one numbered decision, **N** (the next free number on `origin/main` when you write it).

**Character schema:** **0.23 → 0.24**, with its `migrate()` step in the same commit. **Table schema:** no bump.

**App version.** Check `CHANGELOG.md`'s heading and the tags:
- **0.45.0 still unreleased** (heading `[Unreleased] — app 0.45.0`, no `v0.45.0` tag): no bump.
- **0.45.0 released:** `npm run bump -- 0.46.0`. It's minor, because a part-used magazine is a new thing a player can do.

**Game data:** `weaponRules.swap` loses its flag and gains a sentence. Bump it under Decision 68's test: does anything a character computes, or can choose, change?
- **0.38 unreleased:** no bump.
- **0.38 released:** `gamedataVersion` 0.39.

Say in the PR which case applied.

## 3. The decision, drafted

Write it as Decision **N** in `SCHEMA.md` §4. Its INDEX §3 line goes under the topic Decision 149 is filed under.

```
N. **A magazine taken out before it's empty is kept with its count, as a part-used magazine in your gear.**
     *2026-10-1x · Ken + Deighton + Claude · Touches: reloadWeapon, gear rows, roundsLeft, part-used magazine, carriedGear, addGearEntry, useGear, gearLine, weaponLine.reloadFrom, weaponRules.swap, Reload chooser, Reload anyway, Power Cell, character schema 0.24, F34, W104*
     - **Decided:** When Reload, a swap or a Reload anyway takes a magazine out of a catalog weapon that ammo fits, the rounds left in it are kept: none and nothing is kept; all of them and a whole magazine of that kind goes back on its stack; some, and a gear row `{ id, qty: 1, roundsLeft, notes }` holds them, the kind's id being what was loaded or the weapon's standard rounds. A part-used magazine loads what it holds up to the weapon's capacity (PQ3), keeps its kind, and is one magazine: it doesn't stack, count as a whole one or take +1. <PQ2's answer, one sentence>. Shells taken out by a swap go back in the box (F34 closed).
     - **Why:** Deighton's ruling (2026-10-10, Q11): kept, with its count. A detached magazine has no capacity of its own, so it stores what's left in it, where a weapon stores what's spent (Decision 120). Its own row is the charged Talisman's precedent (Decision 121): each one keeps its own count.
     - **Rejected:** the counts as a list on the whole-magazine row (a row at qty 0 is removed, taking the list with it, and every reader of `qty` would need it); a spare magazine stored on the weapon (a magazine fits any weapon of its type, Decision 145); keeping only a swapped magazine (Deighton ruled both).
     - **Replaces:** Decision 149 in part (F34's stub: what a swapped or reloaded magazine keeps).
     - **Revisit if:** the CRB sizes magazines per weapon, or a table wants part-used magazines merged.
     - **Built:** app …, game data …, character schema 0.24, PR #…. Log 2026-10-1x (P9b).
```

**Check *Replaces* against the text, not the title.**
- **149** says "What a swapped magazine keeps is F34, stubbed as nothing", which this replaces. Its *Revisit if* ("F34 … is ruled") fires.
- **145** says Reload "takes one mag … off the carried row". That stays true for a whole magazine, so 145 isn't replaced. If you read it otherwise, say so in the PR.
- Mark 149's entry and its INDEX line (`CLAUDE.md`, *Decisions*).

## 4. Questions for Ken

| Id | Question | Default | Answer |
|---|---|---|---|
| PQ1 | **Where a part-used magazine's count lives.** | **Its own gear row**, `{ id, qty: 1, roundsLeft, notes }`, beside the whole-magazine row: the charged Talisman's precedent. *Alternatives:* a `partUsed: [18, 6]` list on the whole row (rejected in §3: a row at qty 0 is removed); a spare on the weapon (rejected: a magazine fits any weapon of its type). | **Ken, 2026-10-15: the default.** |
| PQ2 | **What one tap of Reload takes when part-used magazines are carried.** | **A whole magazine first.** Only when none of that kind is left does it take the **fullest part-used one**. The chooser (two kinds, or a full weapon swapping) lists each part-used magazine on its own line, so a player who wants one picks it there. One tap stays one tap in a fight. *Alternative:* Reload always asks once a part-used magazine of that kind is carried. | **Ken: the default.** He asked whether a player should be asked to drop the old magazine. Not at Reload, which would cost a tap mid-fight: Loadout's part-used row says **Drop** instead of **Use one** (§9). |
| PQ3 | **A part-used magazine holding more than the weapon takes** (18 rounds from an AR into the VR-50 "Verdict", 3+1). | **It loads up to the capacity, and the rest stays in its row** (4 loaded, 14 left), so rounds are never lost. *Alternatives:* the rest is lost; or a part-used magazine only loads a weapon of the capacity it came from (the sheet would have to remember it). | **Ken: the default**, noting it breaks immersion: one magazine fitting every weapon of a type (Decision 145) is the simplification behind it. Magazines sized per weapon is **W108**, an idea for later, not this order. |
| PQ4 | **A full magazine swapped out** (a full weapon of Silver, swapped for Rifle Rounds). | **It goes back on its stack as a whole magazine**, as a bought one would: a whole magazine fills any weapon of its type (Decision 145). | **Ken: the default.** |
| PQ5 | **Shells taken out by a swap** on a weapon loaded a round at a time. No specialty shell exists yet, so this is the rule for when one does. | **They go back in the box** (the kind's whole row, `+n`). | **Ken: the default.** |

## 5. What this changes underneath (the assumption sweep)

Found by grepping the readers of each thing it touches, not from memory: `ch.gear`, `listOf(ch, "gear")`, `carriedGear`, `addGearEntry`, `useGear`, `gearLine`, `reloadWeapon`, `reloadSource`, `reloadFrom`, `weaponRules.swap`, `qty`, `chargesUsed` (the precedent's readers) and `data-gearplus`. **Check each row yourself before you build**, and say in the PR if one is wrong. Two questions are asked of every row:
- **Which guards read a value this changes?**
- **Where does each new or removed note or name render?**

| Today | Where | After P9b |
|---|---|---|
| `reloadWeapon` sets `roundsSpent` and drops what was left: "What was left in the magazine isn't kept (F34's stub)" | `engine.js` ~1314–1348 | Takes what it loads first, then puts the old magazine back (§8). The comment is rewritten. |
| A swap on a weapon loaded a round at a time "empties it first" and the shells vanish | `engine.js` ~1340–1341 | The shells go back in the box (PQ5). |
| **`carriedGear(ch, id)`** returns the **first** row of an id with `qty > 0` | `engine.js` ~1526 | Skips part-used rows. **Otherwise** `reloadSource`'s `have` would report a part-used row as one whole magazine, and Nanomed-style callers wouldn't notice (they aren't ammo). |
| **`addGearEntry`** stacks a bought magazine onto the **first** row of its id | `engine.js` ~1518 | Stacks only onto a row that isn't part-used. Otherwise buying a mag would give a part-used row qty 2. |
| **`useGear(ch, i, -1)`** (Loadout's **+1**) adds to any consumable row | `engine.js` ~1533; `sheet.js` ~1704 (button), ~3246 (handler) | Refuses a part-used row ("A part-used magazine is one magazine."). Loadout draws no +1 on one, and labels its use button **Drop** (PQ2): same handler, `useGear(i, 1)`, which removes the row. |
| `gearLine` reads `qty` and `chargesUsed` | `engine.js` ~1503 | Also returns `roundsLeft` (a number) and `countUnit` on a part-used line, else `null`. |
| Loadout's gear row shows `×qty unit(s)`, with **Use one** and **+1** | `sheet.js` `gearRowsHtml` ~1688 | A part-used row reads "18 rounds left" (a Power Cell: "15 shots left"; §9), with **Drop** in place of **Use one**, and no +1. |
| Print's gear row types its count as `×qty` | `sheet.js` `pGearRows` ~2409 | A part-used row prints "18 rounds left". |
| `weaponLine.reloadFrom` gives `carried` (the sum of whole stacks), `kinds`, `swap` | `engine.js` ~1238–1243; read by `reloadTitle` (`sheet.js` ~1737) and `roundsHtml`'s **Reload** enable rule (~1732) | `carried` keeps meaning whole magazines. A new `parts` counts part-used ones. `swap` also counts a part-used magazine of another kind. The title adds "and 1 part-used". **Reload** is enabled when a part-used magazine could load. |
| **The swap chooser** draws `weaponRules.swap.text`, "N rounds left in it now", and `flagHtml(sw)` while it's flagged | `sheet.js` `reloadChooser` ~1742–1755 | No flag note. The swap text says the old magazine comes back (§8). Part-used magazines are their own lines (PQ2); a line's **Load** passes the row (§8). |
| `reloadAudit` reads "Reloaded X (31/31), −1 mag of Rifle Rounds" | `sheet.js` ~1739 | Adds what was kept: ", the old mag kept with 18 rounds" or ", the full mag back on its stack". |
| `weaponRules.swap` carries `flagged`, `flagNote` (F34) and `playerNote` | data ~3668 | All three go. `text`: "A Reload can swap one kind of rounds for another, once a turn. The magazine you take out goes back in your gear with what's left in it." |
| No ammo entry says what its count is in. A Power Cell's `unit` is "cell", and its capacity is a number with no word (`0460`: "Magazine or power cell size") | data ~3976–3984 | `power-cell`'s `reload` gains `"countUnit": "shot"` (§8). **The data-key guard** (`engine.test.mjs`, "every data key is read by code…") fails until `gearLine` reads it. That's expected while you build, not a stop. |
| `migrate()` sanitises gear `qty` and `chargesUsed`, in **two** places | `engine.js` ~3428–3430 (the hostile pass) and ~3536–3540 (the 0.10 shape pass) | Both also take `roundsLeft` through `nonNegInt` when present. A 0.24 step stamps the schema; no row from before has the field. |
| `SCHEMA_VERSION = "0.23"`, asserted in tests | `engine.js` ~25; `engine.test.mjs` ~37 ("newCharacter matches the documented character schema") and any other `0.23` literal | `"0.24"`. **Expected breaks**: the literals the bump moves. |
| SCHEMA §3's gear row shows `{ id, qty, chargesUsed? }` | `SCHEMA.md` ~853–857 | Adds `roundsLeft` with its rule and an example row. |
| `versionCheck` / `validate` read gear only for missing ids | `engine.js` ~4208 | Unchanged. A part-used row of a retired id reads as missing, like any row. |
| GM mode's "Gear" lines | `gm.js` ~660 | **Not a reader**: an NPC's stat block, text lines. Unchanged. |
| Weapons nothing fits (launchers, belt-fed, the Strix, custom weapons) reload "as before" | `reloadWeapon`, `!src` | **Unchanged.** Nothing is kept, because nothing on the sheet carries their rounds. |
| **The W30 and W40 tests** assert gear after a reload | `engine.test.mjs` ~2151–2236; `smoke-sheet-skills.test.mjs` ~476–535 | Most still pass (`carriedGear` skips part-used rows, and `gear[0]` stays the stack). **Expected breaks:**<br>• W40's `full.options` list, which now carries the kept part-used magazine;<br>• the smoke's `/still being settled/`, which inverts. |
| The totality loop runs `reloadWeapon` on degenerate characters | `engine.test.mjs` ~1466 | Add part-used rows with junk `roundsLeft` (§10). |

## 6. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- `WISHLIST.md` W104; `reference/rulings-2026-10-10.md` Q11.
- `SCHEMA.md` §4: **120** (rounds, `roundsSpent` as the stored input), **121** (gear rows; a charged Talisman is its own row), **145** (Reload from what you carry), **149** (W40, `loaded`, the chooser; F34's stub). §3's gear row. §5's F34 row.
- `src/engine/engine.js`: `weaponLine`'s rounds and `reloadFrom` (~1227–1243), `ammoFor`, `reloadSource`, `loadsAs`, `loadedOf`, `ammoOption`, `reloadWeapon` (~1281–1348), `gearLine`, `addGearEntry`, `carriedGear`, `useGear` (~1488–1543), `migrate`'s two gear passes.
- `src/ui/sheet.js`: `gearRowsHtml`, `roundsHtml`, `reloadTitle`, `reloadAudit`, `reloadChooser` (~1688–1755), the `data-reload` / `data-gearuse` / `data-gearplus` handlers (~3241–3334), `pGearRows` (~2407).
- `tests/engine.test.mjs` W30/W40 (~2151–2236); `tests/smoke-sheet-skills.test.mjs` W16/W30/W40 (~460–535).

## 7. Out of scope

- **Merging part-used magazines** into a whole one, and **topping one up** from loose rounds.
- **A weapon dropped from Loadout** with rounds in it: they go with the weapon, as today.
- **Per-weapon magazine sizes.** A whole magazine still fills any weapon of its type (Decision 145).
- **Rounds bought singly**, and any change to what fits what (P9a, Decisions 145 and 149).
- **Weapons nothing fits:** no ammo is tracked for them.
- **Recharging a Power Cell.** `0460` calls cells rechargeable, but nothing on the sheet recharges one, and an empty cell isn't kept (§1.2), as an empty magazine isn't.

## 8. The shape

**The saved file (schema 0.24).** A gear row may carry `roundsLeft`, a non-negative integer.
- **A part-used magazine** is a row whose catalog entry has `reload.fills === "magazine"` and whose `roundsLeft` isn't `null`. Write that predicate once, as a helper, and use it in every reader below.
- **`qty` on a part-used row** is written as 1 and **ignored** when read: the row is one magazine.
- **`roundsLeft` on any other row** (a shell box, a custom row, a non-ammo item) is ignored, never an error.
- **`roundsLeft: 0`** is an empty magazine. It's never offered to Reload, and **Drop** removes it.

**`migrate()`:** in both gear passes, `if (g.roundsLeft != null) g.roundsLeft = nonNegInt(g.roundsLeft)`. A `0.23 → 0.24` step stamps the schema and converts nothing. Round trip: a character with part-used rows comes back equal.

**Engine:**

1. **`carriedGear(ch, id)`**, `addGearEntry`: skip part-used rows (§5).
2. **`partUsedMags(ch, id)`** (new, internal or exported as the tests need): `[{ index, roundsLeft }]` for part-used rows of `id` with `roundsLeft > 0`, fullest first, then by row order.
3. **`useGear(ch, i, n)`**: on a part-used row, `n > 0` removes the row (it's one magazine), and `n < 0` refuses with "A part-used magazine is one magazine."
4. **`gearLine`**: `roundsLeft` on a part-used line, else `null`.
5. **`reloadSource` / `weaponLine.reloadFrom`**: `have` stays whole stacks. Add `parts` per kind. `reloadFrom.parts` is the count, and `swap` includes part-used magazines of a kind other than what's loaded.
6. **`reloadWeapon(ch, index, opts)`**:
   - `opts.ammo` (an id) loads a **whole** magazine of that kind, as now.
   - New: **`opts.part`** (a gear row index) loads that part-used magazine. A part index that isn't a part-used magazine fitting this weapon refuses with "That magazine doesn't load this weapon." and changes nothing.
   - **With no `opts`:** per PQ2, a whole magazine of the one kind when one is carried, else the fullest part-used one. The chooser (`choose: true`) opens exactly when it does today, plus when only part-used magazines of more than one kind are carried.
   - `options` carries whole kinds as now and each part-used magazine as `{ id, part: index, roundsLeft, name, unit, tags, loaded }`.
   - **Loading a part-used magazine:** `n = min(roundsLeft, max)`; the weapon's `roundsSpent = max − n`; the row's `roundsLeft −= n`, and the row is removed at 0 (PQ3).
   - **Putting the old magazine back**, after what's loaded has come off, so indices taken before don't shift. Only for a weapon `reloadSource` finds, loaded by the magazine:
     - **What it holds:** `left = max − spent` before the reload.
     - **Its kind:** `loadedOf(e)`, or else the weapon's standard rounds: the first non-specialty kind `ammoFor(def, [])` returns.
     - **None left:** nothing.
     - **All left (PQ4):** whole, `+1` on that kind's stack, or a new `{ id, qty: 1, notes: "" }`.
     - **Some left:** push `{ id, qty: 1, roundsLeft: left, notes: "" }`.
     - **Reload anyway** puts it back the same way.
   - **A round-at-a-time weapon's swap:** the shells taken out go `+left` onto the kind's whole row (PQ5).
   - **The result** gains `kept`: `{ id, name, roundsLeft, whole: boolean }`, or `null`.
   - **Total:** junk `roundsLeft` (a string, negative, `NaN`, an object) reads as `nonNegInt`. A `part` index out of range or `null` refuses.

**Data:**
1. `weaponRules.swap`: delete `flagged`, `flagNote` and `playerNote`, and set `text` as in §5.
2. **`reload.countUnit`**, new and optional: the word a part-used magazine's count reads in, singular. Absent means `"round"`. Set it to `"shot"` on `power-cell` only. The CRB gives a cell a capacity and no word for it; "shot" is the sheet's, and it's marked for the voice pass. It's read by `gearLine` (return the word as `countUnit` on a part-used line) and nowhere else. It's a key the data-key guard must see read (Decision 135); it holds a word, not display text, so it isn't named `…Text`.

## 9. The UI

- **Loadout, a part-used row:** its name, then "18 rounds left" in the count's place. The count's word is the kind's `reload.countUnit`, "round" when absent (§8), so a Power Cell reads "15 shots left". **Drop** in place of **Use one** (PQ2): the same handler, and it removes the row. No +1.
- **Reload's title:** "Rifle Rounds: 2 mags carried and 1 part-used". With only part-used magazines, "Rifle Rounds: 1 part-used (18 rounds)".
- **The chooser:**
  - Each whole kind keeps its line.
  - Each part-used magazine gets a line of its own: "Rifle Rounds — 18 rounds", with its tags and **Load**.
  - Under the lines, the swap text and "N rounds left in it now.", with no flag note.
  - **Load** on a part-used line passes `{ part: index }`, from an attribute of its own (`data-loadpart`, say), so `[data-loadammo="<id>"]` still means exactly one button: the whole kind's. The W40 smoke clicks `[data-loadammo="rifle-rounds"]` while a Rifle part is on offer.
  - Focus and Cancel are as today.
- **The audit and the undo toast:** `reloadAudit` adds ", the old mag kept with 18 rounds" or ", the full mag back on its stack". It's still one `commit()`, so one undo restores the weapon and every gear row.
- **Print:** "18 rounds left" as the row's type.

Copy is drafted in tool voice. **Mark for a voice pass:** the swap sentence, the **Drop** label, "shot", and the refusal "A part-used magazine is one magazine."

## 10. Worked examples, as the tests you write

**Write them first and run them on `main`'s code.** Each must fail, or you must say why it passes. Ruling tests in `rules.test.mjs` name the ruling: "Deighton's ruling (2026-10-10, Q11): …". Rows 3, 4 and 9 encode PQ2, PQ3 and PQ5's defaults; if Ken answers otherwise, they follow his answer.

| Test name | File | Setup → result |
|---|---|---|
| `P9b 1: a magazine reloaded before it's empty is kept with its count` | rules (Q11) | AR-9X at 18/31 with 2 Rifle Rounds mags → Reload: the weapon is at 31/31, `carriedGear` gives qty 1, and one row reads `{ id: "rifle-rounds", roundsLeft: 18 }`. `kept` is `{ roundsLeft: 18, whole: false }`. |
| `P9b 2: an empty magazine isn't kept, and a full one swapped out goes back on its stack` | engine | 0 left → no new row. An AR-9X full of Silver with 1 Rifle mag → load Rifle: `carriedGear("silver-rounds").qty` is 1, `kept.whole` true. |
| `P9b 3: one tap takes a whole magazine first, then the fullest part-used one` | engine | Rifle: 1 whole + parts of 6 and 18 → the whole one. Again → the 18. Again → the 6. |
| `P9b 4: a part-used magazine loads up to the weapon's capacity, and the rest stays` | engine | Part of 18 into the VR-50 "Verdict" (`vr50-verdict`, 3+1): 4/4 loaded, the row keeps 14. Into an AR-9X (31): `roundsSpent` 13, the row is gone. |
| `P9b 5: a part-used magazine keeps its kind, and Reload anyway keeps one too` | engine | A Silver part-used loads as `loaded: "silver-rounds"`, with the tag on the line. Silver taken out with rounds left → a `silver-rounds` part-used row. An LP-9 at 6 left, Reload anyway → a `handgun-rounds` row of 6. |
| `P9b 6: a part-used magazine is one magazine: it doesn't stack, count or take +1` | engine | Buying a Rifle mag stacks on the whole row. `carriedGear` and `reloadFrom.carried` exclude parts, and `reloadFrom.parts` counts them. `useGear(i, -1)` refuses; `useGear(i, 1)` drops the row. `gearLine`'s `countUnit` reads "shot" on a part-used Power Cell and "round" on a Rifle mag. |
| `P9b 7: the chooser lists each part-used magazine, and loads the one picked` | engine | Rifle and Silver carried, plus a Rifle part of 18: `options` carries `{ part, roundsLeft: 18 }`, and `{ part }` loads it. A wrong `part` (a whole row, out of range, a part of another kind that doesn't fit) refuses and changes nothing. |
| `P9b 8: roundsLeft survives migrate and a hostile file` | engine | `"x"` → 0, −3 → 0, 2.7 → 2, `{}` → 0. A round trip is equal; the schema reads 0.24. |
| `P9b 9: shells taken out by a swap go back in the box` | engine | Via `withData`, a specialty shell kind for shotguns: swapping the SG-88's 5 shells out puts `+5` on `shotgun-shells`. |
| `P9b 10: Reload keeps the old magazine on Loadout, and one undo puts it all back` | smoke-sheet-skills | AR-9X at 18/31 and 2 mags, Main → Reload: the toast says "kept with 18 rounds". Loadout's row reads "18 rounds left" with **Drop** and no +1. One undo restores the weapon and the gear. |
| `P9b 11: the swap chooser says the magazine comes back, with no unsettled note` | smoke-sheet-skills | Rifle + Silver + a Rifle part: the chooser has the part's line, the swap sentence, no `.flag` and no "still being settled". |
| `P9b 12: a part-used magazine prints its rounds` | smoke-roster | Print: the gear row's type reads "18 rounds left". |

## 11. Tests beyond §10

- **Totality:** the degenerate loop (`engine.test.mjs` ~1466) gets part-used rows with junk `roundsLeft` (`"x"`, `-1`, `null`, `{}`, `NaN`), and calls `reloadWeapon` with `{ part }` values `-1`, `99`, `"x"`, `null`.
- **Hostile:** `hostile.test.mjs` adds a part-used row with a script-y `notes` and a junk `roundsLeft`, rendered on Loadout and in print.
- **Voice:** the swap sentence, the refusal and the count text pass `voice.test.mjs`.
- **F34 closed:** the flag-to-F-number guard in `docs.test.mjs` passes with the three edits.
- **Mutants, each of which must fail a test** (list them in the PR and the log):
  1. The old magazine not put back (P9b 1, 10).
  2. A full magazine kept as a part-used row of `max` instead of on the stack (P9b 2).
  3. `carriedGear` counting part-used rows (P9b 6, and W30).
  4. `addGearEntry` stacking onto a part-used row (P9b 6).
  5. `+1` allowed on a part-used row (P9b 6, 10).
  6. One tap taking a part-used magazine while a whole one is carried (P9b 3).
  7. The capacity cap dropped, so a part loads all 18 into the Verdict (P9b 4).
  8. A part-used magazine loading as standard rounds (P9b 5).
  9. `migrate` not sanitising `roundsLeft` in either pass (P9b 8: run it for **each** pass).
  10. The flag note still drawn in the chooser (P9b 11).

## 12. Steps

1. `git submodule update --init private`, then `npm run test:fast` on a fresh branch from `origin/main`. Note the totals.
2. Write §10's rows. Run them on `main`'s code and keep the output.
3. Engine §8, then `migrate`. `npm run test:fast`.
4. Data (`weaponRules.swap`), then the UI (§9). `npm run verify`.
5. **Run it in the dev preview** (`shadows-dev-preview`):
   - Reload an AR-9X at 18/31 with mags carried;
   - Loadout's part-used row;
   - the chooser with a part-used line;
   - a Falcon's part-used cell;
   - undo;
   - print preview's gear;
   - at phone width too: metrics if the screenshot times out (`gm-mode/README.md`, *How exact to be*).
6. Docs:
   - Decision N, with its INDEX line, and 149 marked.
   - Close F34 (three edits).
   - W104 to `wishes-granted.md`.
   - SCHEMA §3's gear row.
   - CHANGELOG plus `npm run changelog`; versions per §2.
7. `npm run verify` and `npm run phone-check`.

## 13. Stop and ask

- A row of §5 turns out to be wrong, and the fix isn't a line or two.
- **A code change outside** the engine functions named in §8, `migrate`, and these UI functions: `gearRowsHtml`, `roundsHtml`, `reloadTitle`, `reloadAudit`, `reloadChooser`, `pGearRows` and their handlers.
- PQ1–PQ5 unanswered when you start: they're Ken's, not yours.
- A test outside these **expected breaks** fails:
  - the `0.23` schema literals the bump moves;
  - the data-key guard, until `gearLine` reads `countUnit`;
  - W40's `full.options` list, which now carries the kept part-used magazine;
  - W40's `/already full/` line. The Silver swapped out full now comes back on its stack (PQ4), so Silver is carried again and the weapon offers it. Rewrite that line to empty the gear first, keeping what it tests: a weapon full of standard rounds, with no other kind carried, refuses;
  - the smoke's `/still being settled/` (invert it);
  - any test asserting `weaponRules.swap` is flagged.

## 14. Close-out and review checklist

**Close-out:** the close-the-session skill, *Rule or shape* tier. That covers:
- Decision N and its INDEX line, with 149 marked;
- F34 closed in its three places;
- the log entry, with the mutants and 149's *Revisit if*;
- `shipped.md`'s row;
- W104 to `wishes-granted.md`;
- CHANGELOG plus `npm run changelog`;
- versions per §2;
- the plan's P9b row;
- STATE rewritten (§3's Gear row: F34 closed; nothing left of W104).

Suggested CHANGELOG lines (player voice):

- **A magazine you reload before it's empty is kept.** It goes in your gear with what's left in it, ready to load again. A full one you swap out goes back with the rest.
- **Swapping rounds says what happens to the old magazine.**

**Review checklist:**

- [ ] §10's twelve tests exist with those names, and the PR shows them run on `main`'s code.
- [ ] §5's rows are each confirmed or corrected in the PR.
- [ ] `git diff origin/main --stat -- src/engine src/ui` touches only what §13 allows.
- [ ] Decision N's shape passes `docs.test.mjs`; *Replaces* is checked against the text of 145 and 149, and 149 is marked.
- [ ] Schema 0.24 with its `migrate()` step; both gear passes sanitise `roundsLeft`; the round trip passes.
- [ ] F34 is closed in all three places.
- [ ] The dev-preview run happened (§12.5), including undo and print.
- [ ] Mutants are listed in the PR **and** the log.
- [ ] `npm run verify` and `phone-check` are green; versions are per §2, and the PR says which case.

## 15. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<plan>/<order>` = `sheet-wishlist/P09b-magazines.md`, `<id>` = **P9b**, and these traps under the builder's:

> Six things in this order are easy to get wrong:
>
> 1. **Every reader of a gear row takes the first match.** `carriedGear` and `addGearEntry` must skip part-used rows, and the predicate is written once.
> 2. **Take before you put back.** Load from a row, then push the old magazine, or a spliced row shifts the index you hold.
> 3. **A part-used magazine keeps its kind.** The kind is what was loaded, or else the weapon's standard rounds, never "whatever fits first".
> 4. **Full goes back on the stack; empty isn't kept.** Only a magazine with some rounds left becomes a part-used row.
> 5. **`migrate()` sanitises gear in two places.** Both get `roundsLeft`, and a mutant on each must fail.
> 6. **Write a regex into a file with the editor, never through a shell heredoc**, which drops backslashes (P9a's guard read `Fd+`).
>
> Tier: Rule or shape. One numbered decision, the next free. Character schema 0.24. Versions per §2. Use the close-the-session skill at the end.
