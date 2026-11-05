# Work order H2: powers that answer a hit

**Plan:** [`powers-that-run.md`](../powers-that-run.md), session H2. **Wish:** **W132** (Ken, from re-running P21's pre-flight), its "hit" half.
Decisions 104, 135, 219, 223, 225, 236, 256, 257, 266.
**Status:** **drafted 2026-11-05 by Claude (Opus)**, the H1 reviewer acting as orchestrator. Pre-flighted against `main` at `93c1a99` (PR #297
merged: app 0.62.0 under `[Unreleased]`, game data 0.53, character schema 0.33, table 0.19, pack 0.3; the last decision is 266).
**Awaiting Ken.**
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs alone.** H3 doesn't wait on it, but both touch `engine.js`'s running code and `sheet.js`'s card, so don't run them at once
(`WORK-ORDERS.md`, *Running more than one at once*). It touches `engine.js` (the running reader to take in starter rows, a hit
stage, `grants()`'s withering row, `hitAsks`, `migrate`), `sheet.js` (Take a hit's boxes, the power card's Running line, the
popover's row), `shared.js` (`powerHtml`'s columns, `runningNatural`'s twin), `gm.js` (the seat hit's boxes), the data, tests and
docs. **Character schema bump** (§8a).

**Carried over** from H1 (PR #297), the last order and its review:
- *The order's misses.* §13 expected phone-check frames to move, but the frame fixture seeds only an arcanist, so no frame opens a
  power card or a popover. §13 here says so. §9 drafted a second toast where the commit label (the Undo toast) was the better home,
  so §9 here puts every new sentence on the commit label. The decision draft ran to 414 words against `docs.test.mjs`'s 350-word
  cap, and the trim lost a Rejected item and half of the Why. §3's draft here is under 350 as written, and its Rejected and Why
  must not be the part that's cut. The order didn't cover Start when the pool can't pay, so Ken ruled it refused, "${name} needs
  ${sfr} SFR, ${left} left.". The order specified a disabled button whose reason was only its `title`, which is hidden on touch, so
  Ken ruled a visible reason line under it.
- *The build's misses.* A stale `running` entry started free when the form came back (fixed in review, `177daba`). The decision
  trim cut load-bearing text. The past-RoU sentence went in the commit label and was listed as a fit, rightly.
- *Ken's answers on H1* (PR #297, issuecomment-6667114721, "All recommendations"): the pool refusal, the four voice drafts, and the
  visible reason line. H2 reuses all three. Every refusal is in tool voice, a refused control is disabled **and** says why on the
  page (`data-runwhy`'s pattern), and a spend the pool can't cover is refused with "${name} needs ${n} SFR, ${left} left."
- *What H2 starts from.* H1 built `runningPowers` / `isRunning` as the one reader, `trackers.running` as `[{ id }]`, `runCost`,
  `startCheck` (with the pool refusal and `short` reasons), `resetRunning` charging only `each: "round"` rows, `runningNatural`
  seeding both hits' Natural Armor boxes, and the card's and popover's Start/Stop. Spectral Veil already runs and costs SFR, but
  does nothing on a hit.

**The pre-flight found, in short:**

1. **Two of the plan's eight don't fit the sheet as the book prints them.**
   - **Battle Hardened** (`0412:224`) grants immunity to "Dazed, Knocked Down, Agony, or Sickened". `0540` and the data's 20
     Conditions have no Dazed and no Sickened. Agony and Knocked Down are near Agonized and Prone, but they aren't those words.
   - **Elemental Blood** (Appendix Aberrations) halves "Fire, Cold, or Lightning". The sheet's damage types have no fire and no
     cold. Burning and Electric are *Energy* (Decision 219), and spells deal *Elemental*. Decision 219's own Revisit if ("the book
     names a cold damage type") is exactly this.

   Both need the book, not code (HQ11). This order builds the other six and holds these two out.
2. **"Physical" is the data's `magical` partition.** The rebalancing sheet (line 35): "armor stops Physical damage, not
   Elemental, Spirit, or Aether". In the data, Elemental, Spirit and Aether are the three `magical: true` types, and the other six
   (Blade, Blunt, Ballistic, Electric, Energy, Burning) are Physical. Immunity reads `magical !== true`, so no type id appears in
   code.
3. **Decision 236 already decided the stage.** Its Rejected list has "Giant and Scrapper before armor", and its Revisit if is
   "P21 adds power reductions to the same stage". Odin's Aegis and Null Field therefore act on what has got through, after armor
   and Natural Armor and beside `meleeTaken` (HQ12). Immunity is different: nothing gets through, so it answers before armor and
   asks for no PROT roll.
4. **`grants()`'s `withering` row would read Silverscar as Wither Ward.** `engine.js:184` sets `witheringHalvedBy` from any
   `withering` grant with `halve: true`. Silverscar's `from: "silver"` row must be read apart from it, or every Werewolf with
   Silverscar halves all Withering. This is a trap (§15).
5. **Adaptive Skeleton isn't a power the running code can see.** It's a row of the Forge-Fang option's `starterPower` table
   (`shadows-data.js:3287`), with no `id`, read only by `traitRows`' `wide` pass (`engine.js:260`) and drawn by `powerHtml`
   (`shared.js:1000`). **`powerHtml` takes the table's columns from the first row's keys**, so a key added to a row can turn into
   a column (an "Id" column, or "Run" showing `[object Object]`). `runningPowers`' form check returns `[]` for *every* power out
   of the form (`engine.js` `runningPowers`, `if (form && !form.on) return []`), but `0414` says CyberWolf Protocol "works in both
   forms".
6. **H1's card and popover say "a round" for every running power** (`runCardHtml`'s `Running · ${sfr} SFR a round`; the
   popover's `${name} · ${sfr} SFR a round`). That's false for an `each: "start"` power, which pays once.
7. **The seat hit can't spend.** Decision 257: a seat's hit runs on a clone and "the row keeps the fight, never written back".
   Null Field's absorbed amount and Odin's Aegis's SFR would be written to the clone and lost, so the field would never run down
   from the GM's side. Immunity, Silverscar and Natural Armor are stateless, so they work there (HQ15).
8. **H1's rules test refuses a non-sustained `run`** (`rules.test.mjs:3478–3479`: "has a run and a cost that isn't sustained";
   `each` must be `"round"`). It's an expected break, and it's rewritten to check the `"start"` kind against its cost text.

**Probes on `main` at `93c1a99`** (each one is the "before" of a §10 row; characters are built as `engine.test.mjs`'s helpers do,
locked, with stats 6 unless named):

| Character | Today |
|---|---|
| Heroic Draugur, Spectral Veil rank 1 (placed), started | `startPower` ok, spent 3. `resolveHit` Ballistic 10, torso, no armor: through 10, conditions `["bleeding"]`. Spirit 10: through 10. Massive Ballistic 10: through 0, levels lost per `damageRules.massive` |
| Heroic Upyr, Red Mist and Icebound Resilience rank 1 | `startPower` → "That power doesn't run." for both. Icebound's Natural Armor: conditional, +1, never ticked |
| Street Forge-Fang, Null Field placed, Werewolf Form | `startPower` → "That power doesn't run." Spirit 10: through 10. `archetypePowers` has no Adaptive Skeleton; `naturalArmor` lists no source |
| Heroic Draugur, BOD 8 (mod 2), Odin's Aegis rank 2 | Nothing on the hit. SFR 17, RoU 6 |
| Street Wildblood with Silverscar taken | `grants(ch).witheringHalvedBy` null. Withering 9, torso: through 9 |
| any Vampire | `hitAsks(ch)` → `{ melee: false }` |

---

## 1. Goal and Done when

When this is merged:

1. **Spectral Veil and Red Mist make their holder immune to Physical damage while they run.** Take a hit shows a box for each,
   ticked while the power runs. A Physical hit with it ticked does nothing: no damage, no wear, no Conditions offered, no PROT asked.
   Elemental, Spirit and Aether still land.
2. **Red Mist, Null Field, Icebound Resilience and Adaptive Skeleton run** as `each: "start"` powers. Start pays once, Turn Reset
   charges nothing for them, and the player stops them, as with H1's.
3. **Null Field absorbs** up to 5 × rank Elemental, Spirit or Aether damage across hits, after armor. The sheet keeps what it has
   absorbed, and the field stops when it's used up.
4. **Odin's Aegis is a reaction on the hit.** On an Elemental, Spirit or Aether hit the player ticks it. It takes BOD bonus + 2 ×
   rank off what got through and spends rank SFR in the same commit. A Physical hit or a short pool disables it, with the reason on
   the page.
5. **Silverscar halves Withering from silver**, never below 1. Take a hit asks "From silver" only for a Withering hit on a
   character with a grant that reads it.
6. **Adaptive Skeleton's Natural Armor 2 and Icebound Resilience's +1 start ticked** on a hit while they run (H1's
   `runningNatural`). Adaptive Skeleton runs in either form.
7. **A GM's seat hit** offers the immunity boxes, ticked from the copy, and Silverscar's question. It doesn't offer Null Field or
   Odin's Aegis, and says so in one line.
8. **One undo takes back a hit**, with what Null Field absorbed and what Odin's Aegis spent.
9. **Nothing else moves**, shown by an outputs diff (§11).

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** One decision, **N** (the lowest free number on `origin/main` when you write it; 267 at the
  pre-flight).
- **App:** `[Unreleased]` heads **0.62.0** at the pre-flight, a minor not yet released. Add to it and don't bump. If 0.62.0 is
  released before you build, `npm run bump -- 0.63.0`. Say which in the PR.
- **Game data:** a computed value moves (a hit's damage, Start's charge for four more powers). At the pre-flight 0.53 is
  unreleased, so no bump (Decision 68's unreleased rule, as 219 and 223 did). If it has shipped, 0.54.
- **Character schema: N** (0.33 → 0.34 at the pre-flight): a `running` entry may carry `used` (Null Field). The `migrate()` step
  goes in the same commit.
- **Table and pack schemas: no bump.** A seat's copy passes through `migrate()` (`migrateTable()`), as in H1.
- **No flag opens or closes.** Battle Hardened and Elemental Blood go to §6 of the plan as book items (HQ11), not flags: nothing
  is stubbed in code.

## 3. The decision, drafted

Paste as **N** in `SCHEMA.md` §4, with an INDEX §3 line under the topic Decision 266 is filed under. The draft is **335 words**
as written, by `docs.test.mjs`'s count. If the build's wording grows it, trim *Decided*, never *Rejected* or *Why*.

```
N. **A running power can answer a hit: Spectral Veil and Red Mist make Physical damage nothing, Null Field absorbs and runs down, Odin's Aegis is a reaction that spends, and Silverscar halves silver's Withering.**
     *2026-11-xx · Ken + Claude · Touches: hitTaken, immune, absorb, react, magical, running.used, runningPowers, starterPower rows, runsIn, resolveHit, applyHit, hit.powers, hit.react, hit.silver, hitAsks, withering grant, from, Take a hit, the seat hit, powerHtml, Natural Armor boxes, migrate, character schema N, W132*
     - **Decided:** A `hitTaken` grant on a power answers a hit while the power runs (`immune`, `absorb`) or when its holder ticks it (`react`, the power's SFR spent in the hit's commit). Immunity covers every type that isn't `magical` and comes before armor; reductions come after Natural Armor, beside `meleeTaken`, Odin's Aegis then Null Field. Null Field's `used` is stored on its `running` entry, and it stops when used up. Red Mist, Null Field, Icebound Resilience and a starter row (Adaptive Skeleton) run as `each: "start"`; a starter row ignores `runsIn`. A `withering` grant with `from` halves only a hit marked from it. A seat's hit offers only what writes nothing.
     - **Why:** W132; `0413`, `0414` and the rebalancing sheet ("armor stops Physical damage, not Elemental, Spirit, or Aether"); Decision 236's Revisit if ("power reductions to the same stage").
     - **Rejected:** reductions before armor (Decision 236 rejected it for Giant); an immune hit that still wears armor; Odin's Aegis as a running power ("as a reaction"); Null Field refilling each scene by itself (the sheet knows no scene, W128); a type list in code; Silverscar as Wither Ward; spending from a seat's clone (Decision 257); Battle Hardened and Elemental Blood before the book names their Conditions and elements.
     - **Replaces:** nothing; extends 236 (the stage) and 266 (`each: "start"`, `used`, starter rows).
     - **Revisit if:** the book defines Dazed and Sickened or a cold type; W128 knows a scene; a power needs a countdown.
     - **Built:** app 0.6x.0, game data 0.5x, character schema N, PR #…, log 2026-11-xx (H2).
```

**Supersession marks:** none. Decision 236 is *extended*, not superseded: its stage gains rows, and its rule ("after Natural
Armor, before Wither Ward") stands. Decision 266 is extended too, because its draft named `each: "start"` as H2's. Check the
ledger for anything else that says a hit's order (search §4's Touches for `resolveHit`, `mitigateNatural`, `meleeTaken`,
`witheringHalvedBy`). At the pre-flight that's 99, 104, 219, 223, 236 and 257, and none of them is contradicted.

Not superseded, and why: **219** (Resistance still halves first; immunity sits before it only because nothing gets through);
**223** (Wither Ward is unchanged, and Silverscar is a second reader of its grant type); **257** (the seat hit still writes nothing
back; this keeps it that way); **104** (Natural Armor unchanged; two more sources start ticked, through 266's rule).

## 4. Questions for Ken

Each has a default. A question left blank is answered "Default" (`WORK-ORDERS.md`). H1 used HQ6–HQ10; these continue.

| Id | Question | Default | Answer |
|---|---|---|---|
| HQ11 | **Battle Hardened and Elemental Blood** name Conditions (Dazed, Sickened) and elements (Fire, Cold) the sheet doesn't have | **Hold both out of H2.** They go to the plan's §6 *For the book* and W132 keeps them. H2b, or H3's order if it's sooner, takes them once the book names them. The alternative, mapping Agony → Agonized, Knocked Down → Prone and Fire → Burning, answers a rules question in code | |
| HQ12 | **Where Odin's Aegis and Null Field act on a hit** | **After armor and Natural Armor, beside `meleeTaken`** (Decision 236's stage), Odin's Aegis first and then Null Field, so the field keeps what the reaction already stopped. The alternative is before armor, like a Resistance (219), which Decision 236 rejected for flat cuts | |
| HQ13 | **What immunity to Physical stops** | **The whole hit**, Massive included: no damage, no Integrity lost, no Conditions or Shock offered, no PROT asked. Physical is every type without `magical`. The alternative is that armor still takes wear, but there's nothing for it to soak | |
| HQ14 | **Null Field running down** | **It stores what it absorbed** (`used`, character schema N) and **stops when used up**. The book prints "until used up or the scene ends", so this stop is the book's (plan §1). Log session ends it as a scene end (HQ3). Starting it again pays again and starts empty | |
| HQ15 | **The GM's seat hit** | **Offers immunity (ticked from the copy) and Silverscar's question, not Null Field or Odin's Aegis**, with the line "Null Field and Odin's Aegis answer on the player's own sheet." Spending from the clone would be lost (Decision 257). The alternative is to absorb on the seat hit without running the field down, which makes it limitless | |
| HQ16 | **"From silver" on Take a hit** | **Asked only on a Withering hit, and only when a held grant reads it** (Silverscar), as the melee box is (Decision 236, `hitAsks`). Never saved | |
| HQ17 | **Icebound Resilience and Adaptive Skeleton run** (Natural Armor, the hit's business) | **Yes, both, as `each: "start"` data.** Icebound costs Rank + 2 and Adaptive Skeleton 2 SFR. Adaptive Skeleton runs in either form, because it's a starter row and `runsIn` reads only `powers`. Their other effects (+2 BOD, +2 REF, resistances) stay text. Neither counts its rounds or scene down (plan §2.6) | |
| HQ18 | **Odin's Aegis's controls** | **A box on the hit, unticked by default** (it costs SFR), labelled with what it takes off and costs. It's disabled with the reason on the page when the hit is Physical ("Elemental, Spirit or Aether only") or the pool is short ("Not enough SFR"). If it's ticked anyway (a stale form), Apply refuses with "Odin's Aegis needs 2 SFR, 1 left." | |

## 5. The assumption sweep

Grepped at `93c1a99`. Line numbers are as of the pre-flight.

| What | Today (where) | After | Guards that read it · where it renders · text that points at it |
|---|---|---|---|
| `trackers.running` entries | `{ id }` only; `migrate` drops every other key (`engine.js` ~5170) | `{ id, used? }`; `used` a whole number ≥ 0, at most 999, kept only where a number was | `hostile.test.mjs:71` already writes `used: P("run.used")` (it now survives as a number, or goes); `SCHEMA.md` §3's `running` line; H1's migrate test ("junk is dropped" expects `{ id: "iron-hide", used: 2 }` → `{ id }`: **an expected break**); the Dead Air sample's stamps |
| `runningPowers` / `runnableDefs` / `nameOfRunnable` / `startCheck` / `stopRunningOutsideForm` | read `archetypePowers(ch)` only; the form check is all-or-nothing | also the chosen options' `starterPower.rows` that carry `id` and `run` (rank 1); the form check applies per row, to `powers` only | `runnablePowers` → the card and the popover; `runningNatural` (`shared.js`); `resetRunning` (still `each==="round"` only); `setToggle`'s stop (must not stop a starter row); `logSession` |
| `runCost` | `perRank × (rank‖1) + plus` | unchanged (starter rows rank 1) | — |
| `run.each: "start"` | parsed (`runningPowers` keeps `"start"`), never in the data | on four rows (§8a) | `resetRunning`'s filter, which already skips it (pin it); the card's and popover's "a round" (below); `rules.test.mjs:3478–3479` (**expected break**) |
| The card's Running line | `Running · ${sfr} SFR a round` (`sheet.js` `runCardHtml`) | per `each`: "a round" stays for `"round"`; `"start"` reads `Running`, and with `absorb` `Running · ${left} left` | smoke `Decision 266: Start and Stop on the card…` pins the round text (unchanged for Iron Hide) |
| The popover's running row | `${name} · ${sfr} SFR a round` (`sheet.js` `vitalPopover`) | the same rule | the same smoke test |
| `powerHtml` | columns = the first row's keys (`shared.js:1003–1004`) | skips the keys code reads: `id`, `run`, `grants` | every starter table: CyberWolf Protocol's, and the other Origins' (each Origin with `starterPower`); the wizard's specialization step and the Character tab both call `optionPowersHtml` (grep it) |
| A starter row's Start | none | a Start/Stop per runnable row, under the starter table on the Character tab, and in the popover through `runnablePowers` | `inertSheet` disables it on the read-only sheet (keep it off `RO_READERS`) |
| `naturalArmor` sources | advantages, disadvantages, Majors, specialization options, `archetypePowers` (`engine.js:1495–1508`) | + starter rows with `id` and `grants` (rank 1) | `mitigateNatural`; both hits' boxes (`sheet.js` ~1102, `gm.js` ~3025); print's Nat column reads `naturalArmor(ch).base`, which is unchanged because the new source is `while` |
| `grants()` `withering` | `halve: true` → `witheringHalvedBy` (`engine.js:184`) | a row with `from` goes to `witheringHalvedFrom: { [from]: name }` instead | `resolveHit`'s Wither Ward line (`engine.js:1729`), both hits' result lines ("Wither Ward halves it"; grep `witherHalved` in `src/ui`) |
| `hitAsks` | `{ melee }` | `{ melee, silver }` (`silver` true when `witheringHalvedFrom.silver`) | the sheet's hit panel (`sheet.js:1086`), the seat hit (`gm.js:3018`) |
| `resolveHit` input | `{ damage, damageType, category, ap, spell, melee, location, protRoll, natural }` | + `powers` (ids ticked: immunity, absorb), `react` (ids ticked), `silver` (boolean) | `hitInput` (`sheet.js:1021`), `encHitInput` (`gm.js` ~2922), `resolveEncounterHit` / `applyEncounterHit` (`engine.js` ~9576, ~9599) |
| `resolveHit` stages | armor → Natural Armor → `meleeTaken` → Wither Ward | **immune** (before armor, short-circuit) → armor → Natural Armor → **Odin's Aegis → Null Field** → `meleeTaken` → Wither Ward / **silver** | every hit test (grep `resolveHit(` in `tests/`): none ticks a power, so none moves |
| `applyHit` | writes damage, wear and Conditions | + Null Field's `used`, its stop when used up, and Odin's Aegis's charge through `adjustPanelTracker` | the sheet's hit commit label (`sheet.js` ~3498); the seat's `applyEncounterHit` (on the clone: §8b keeps it from spending) |
| `cost` text | the card's chips, print's Uses column, the wizard rows | unchanged, checked against `run`/`react` by a test | — |

**Not touched, checked:** `resetRunning` and `chargeRunning` (they already skip `"start"`); `versionCheck`; the wizard (nothing runs
before lock); GM mode's encounter Reset (Decision 189); `traitRows`' `wide` pass (it reads starter rows' `grants` for Skill rows,
and a `naturalArmor` or `hitTaken` grant isn't one: check that its default branch ignores both); `effectTagsFor` (advantages and
disadvantages only); Bestial Blessings, Steel Fangs and Serrated Claws (activated, but not the hit's business: H3 or later).

## 6. Read first

- `CLAUDE.md`, `docs/STATE.md`, the plan (§2 whole and §6), and H1's order (§8–§9: what you're extending).
- Decisions **104, 135, 219, 223, 236, 256, 257, 266**.
- `src/engine/engine.js`: `grants()` (~160–230, the `withering` row at 184), `traitRows` (~240–265), `naturalArmor` (1479),
  `mitigateArmor`, `mitigateNatural`, `mitigateMelee`, `hitAsks`, `resolveHit`, `applyHit` (~1585–1800), the running block
  (`runCost` … `chargeRunning`, ~4115–4230), `migrate`'s `running` step (~5170), `resolveEncounterHit` / `applyEncounterHit`
  (~9570–9610).
- `src/ui/sheet.js`: `runCardHtml` (~1008), `hitInput` and the hit panel (1021–1110), `vitalPopover`'s SFR rows (~1425), the hit
  binders (~3480–3500). `src/ui/shared.js`: `runningNatural`, `powerHtml`, `optionPowersHtml`. `src/ui/gm.js`: `encHitNew`,
  `encHitInput`, the seat hit panel (~3010–3030), `data-ehit`.
- `private/crb/0413_Vampire.md` (Red Mist ~348, Odin's Aegis ~396, Spectral Veil ~404), `0414_Werewolf.md` (Adaptive Skeleton 155,
  Null Field ~347, Silverscar ~509), `APPROVED_Vampire_and_Werewolf_rebalancing.md:35`.

## 7. Out of scope

- **Battle Hardened and Elemental Blood** (HQ11). Don't add a pick, a grant or a schema field for either.
- **Everything else these powers do**: Red Mist's "unable to attack", Spectral Veil's Stealth (a `whenText` mark already),
  Adaptive Skeleton's and Icebound's +2 BOD/+2 REF, Icebound's resistances, Elemental Blood's melee backlash.
- **Counting down** Red Mist's minute, Icebound's 3 rounds or Adaptive Skeleton's scene (plan §2.6). The player stops them.
- **Sunlight** ("Sunlight still burns you"): the sheet doesn't know it.
- **Healing**: H3's.
- **Defiance of Sol** (plan §2.6).
- **EMP / DeSync** of Null Field or CyberWolf Protocol.
- **A GM writing a seat** (Decision 257).

## 8. The shapes

### 8a. Data and the saved file

1. **New `run` rows** (`each: "start"`), beside `cost`, which is unchanged:

   | Power | `cost` | `run` |
   |---|---|---|
   | Red Mist (Upyr) | "3 SFR" | `{ "sfr": { "plus": 3 }, "each": "start" }` |
   | Icebound Resilience (Upyr) | "Rank + 2" | `{ "sfr": { "perRank": 1, "plus": 2 }, "each": "start" }` |
   | Null Field (Forge-Fang) | "Rank" | `{ "sfr": { "perRank": 1 }, "each": "start" }` |
   | Adaptive Skeleton (Forge-Fang's `starterPower` row) | "2 SFR" | `{ "sfr": { "plus": 2 }, "each": "start" }`, and the row gains `"id": "adaptive-skeleton"` |

2. **`hitTaken` grants** (new type; amounts are numbers, never read from text):
   - Spectral Veil and Red Mist: `{ "type": "hitTaken", "immune": true }`. It covers each damage type without `magical: true`.
   - Null Field: `{ "type": "hitTaken", "absorb": { "perRank": 5 }, "magical": true }`. Its capacity is perRank × rank, and it
     answers only `magical` types.
   - Odin's Aegis: `{ "type": "hitTaken", "minus": { "stat": "BOD", "perRank": 2 }, "magical": true }`, plus on the power
     `"react": { "sfr": { "perRank": 1 } }` (its cost: "Rank, as a reaction"). It takes the stat's modifier + perRank × rank.
3. **Adaptive Skeleton's row** gains `"grants": [{ "type": "naturalArmor", "amount": 2, "while": "while Adaptive Skeleton is
   running" }]`.
4. **Silverscar** gains `"grants": [{ "type": "withering", "halve": true, "from": "silver" }]`.
5. **A comment** beside the first `hitTaken` naming Decision N and the stage.
6. **The saved file:** a `running` entry is `{ id, used? }`. `migrate()` keeps `used` when it's a finite number, floored to a
   whole number in 0–999, and drops it otherwise. Every other rule is H1's. A 0.33 file round-trips with nothing added. Character
   schema N.

### 8b. Engine

Every reader stays total (constraint 8).

1. **Starter rows run.** `runnableDefs(ch)` = `archetypePowers(ch)` with `run`, plus each chosen option's `starterPower.rows`
   that are plain objects with a string `id` and a `run`, taken as `{ id, name: augmentation, rank: 1, run, grants, starter: true
   }`. The form check (`runForm`) applies only to a def without `starter`, in `runningPowers`, `startCheck` and
   `stopRunningOutsideForm`. `nameOfRunnable` reads the same list.
2. **`naturalArmor`** also scans those starter rows' `grants` at rank 1.
3. **`hitAnswers(ch)`** → `{ immune: [{ id, name }], absorb: [{ id, name, cap, used, left }], react: [{ id, name, minus, sfr, can:
   { ok, why, short } }] }`. `immune` and `absorb` come from `runningPowers`. `react` lists held powers with `react` and a `hitTaken`
   `minus`, and `can` uses the pool rule ("${name} needs ${sfr} SFR, ${left} left.", short "Not enough SFR"). It's one reader for
   both hit panels, so nothing in the UI reads `hitTaken`.
4. **`grants()`**: a `withering` row with a string `from` goes to `witheringHalvedFrom[from] = name`, never to
   `witheringHalvedBy`. `hitAsks(ch)` returns `{ melee, silver: !!witheringHalvedFrom.silver }`.
5. **`resolveHit(ch, hit)`**, with the new inputs `powers` (ids), `react` (ids) and `silver` (boolean). Each id counts only if
   `hitAnswers` lists it, and a hostile id is ignored.
   - **Immune first:** if the type isn't `magical` and a ticked `immune` row exists, return the result with `through: 0`,
     `levelsLost: 0`, no armor patch, no prompts, and `immuneBy: name`. Don't ask for PROT.
   - Then armor and Natural Armor, as today.
   - Then, on a `magical` type, **Odin's Aegis** takes `min(through, minus)` off, then **Null Field** takes `min(through, left)`.
     Each is reported (`reactBy: { id, name, from, to, sfr }`, `absorbedBy: { id, name, from, to, usedAfter, usedUp }`).
   - Then `meleeTaken` and Wither Ward as today. **Silverscar** halves (never below 1) when the category records Withering,
     `hit.silver === true`, and `witheringHalvedFrom.silver` is set, after Wither Ward if both somehow hold.
   - A ticked `react` the pool can't pay returns `{ ok: false, why }` (HQ18). A ticked `react` on a Physical hit is ignored.
   - `patch` gains `running` (the new `used`, or the entry removed when used up) and `sfrSpend`.
6. **`applyHit`** writes `patch.running` and charges `sfrSpend` through `adjustPanelTracker` (the one writer, so `turn` counts it).
   It still re-resolves from inputs.
7. **The seat hit** (`resolveEncounterHit` / `applyEncounterHit`): `react` and `absorb` are dropped from its input before
   resolving. `powers` keeps only `immune` ids, and `silver` passes. Nothing is spent on the clone.
8. **Nothing else changes**: `resetRunning`, `chargeRunning`, `sfr`, `heldSpells`, `versionCheck`, `migrateTable`.

## 9. The UI

Copy is drafted for a **voice pass** (tool voice for controls and refusals). Every new sentence after a press goes on the commit
label (the Undo toast), never a second toast.

| Where | Today | After |
|---|---|---|
| Take a hit: immunity | — | one box per `hitAnswers.immune` row, **ticked**: "Spectral Veil: immune to Physical". On a Physical hit with it ticked, the result reads "Spectral Veil: no damage." and the PROT field doesn't show |
| Take a hit: Null Field | — | a box, **ticked**: "Null Field: absorbs up to ${left} Elemental, Spirit or Aether" |
| Take a hit: Odin's Aegis | — | a box, **unticked**: "Odin's Aegis: −${minus}, ${sfr} SFR". Disabled with a reason line under it: "Elemental, Spirit or Aether only" on a Physical hit, or "Not enough SFR" |
| Take a hit: silver | — | on a Withering hit when `hitAsks.silver`: a box "From silver". The result reads "Silverscar halves it: ${from} → ${to}." |
| The hit's commit label | `Hit: …` | adds "Odin's Aegis −${n} (${sfr} SFR)", "Null Field absorbed ${n}" or "Null Field absorbed ${n}, used up", and "immune (Spectral Veil)" |
| Card, `each: "start"` | — | the Running line reads "Running" (Null Field: "Running · ${left} left"); Start and Stop as in H1 |
| Popover, `each: "start"` | — | "${name} · running" (Null Field: "${name} · ${left} left"), with Stop |
| Character tab, starter table | a table | the same table (no Id or Run column), and under it a run row per runnable row: Start/Stop, its reason line, and its Running line |
| GM seat hit | Natural Armor boxes | + the immunity boxes (ticked from the copy) and "From silver"; one line when the copy runs Null Field or holds Odin's Aegis: "Null Field and Odin's Aegis answer on the player's own sheet." |

**Where things land** (Decision 164's `keepPlace`):

| Press | The record | Focus |
|---|---|---|
| Tick or untick a hit box | the result redraws | the box |
| Apply a hit | the modal closes as today | as today |
| Start/Stop on a starter row | the row shows Running/Start | the other half of the pair, on the same row |
| Null Field used up on Apply | its card and popover read Start again | as today (the hit's return) |

## 10. Worked examples, as named tests

Write these first, show them failing on `main`, then build. Characters are `engine.test.mjs`'s `vampire()` and `werewolf()`,
locked, stats 6 unless named. "No armor" means nothing worn, so no PROT is asked.

| # | Test name (file) | Setup → action | Pins |
|---|---|---|---|
| 1 | "Decision N: a running Spectral Veil makes a Physical hit nothing, and Spirit still lands" (`engine.test.mjs`) | Heroic Draugur, Spectral Veil placed (rank 1), started. `resolveHit` Ballistic 10, torso, `powers: ["spectral-veil"]`; the same with `powers: []`; Spirit 10 with it ticked; Massive Ballistic 10 with it ticked | through 0, `immuneBy` "Spectral Veil", `prompts.conditions` `[]`; unticked: through 10; Spirit: through 10; Massive: through 0 and `levelsLost` 0 |
| 2 | "Decision N: immunity asks no PROT and wears no armor (HQ13)" (`engine.test.mjs`) | the same Draugur wearing body armor that covers the torso, `protRoll: ""`, Ballistic 10, ticked | `ok` true, through 0, `patch.armor` null; unticked: `ok` false, "Enter the PROT die you rolled." |
| 3 | "Decision N: Red Mist runs from Start and Turn Reset charges nothing for it" (`engine.test.mjs`) | Heroic Upyr, Red Mist placed: `startPower`, then `applyReset` | spent 3, turn 3; after Reset spent 3, turn 0, `isRunning` true, `charged` `[]` |
| 4 | "Decision N: Odin's Aegis takes BOD bonus + 2 × rank off a Spirit hit and spends rank SFR (HQ18)" (`engine.test.mjs`) | Heroic Draugur, BOD 8 (mod 2), Odin's Aegis at rank 2 (`basePowers: { "odins-aegis": 2 }`, as H1's `upyrRunning`): `applyHit` Spirit 10, torso, `react: ["odins-aegis"]` | `reactBy` `{ from: 10, to: 4, sfr: 2 }`; damage +4; spent 2, turn 2. Ballistic 10 with it ticked: through 10, spent unchanged. At spent 16 (1 left): `resolveHit` `{ ok: false, why: "Odin's Aegis needs 2 SFR, 1 left." }` |
| 5 | "Decision N: Null Field absorbs across hits and stops when used up (HQ14)" (`engine.test.mjs`) | Street Forge-Fang, Null Field placed (rank 1), Werewolf Form, started (spent 1). `applyHit` Spirit 3, `powers: ["null-field"]`; then Spirit 8 | first: through 0, `running` entry `used: 3`, `hitAnswers.absorb[0].left` 2; second: through 6, `usedUp` true, `isRunning` false. Ballistic 8 with it ticked: `used` unchanged |
| 6 | "Decision N: Silverscar halves Withering from silver, never below 1, and nothing else (HQ16)" (`engine.test.mjs`) | Street Wildblood with `silverscar` taken: Withering 9 torso `silver: true`; `silver: false`; Withering 1 `silver: true`; Regular 9 `silver: true`. A Vampire with Wither Ward: Withering 9, no silver | 4; 9; 1; 9; Wither Ward still 4. `grants(ch).witheringHalvedBy` null for the Werewolf; `hitAsks(ch).silver` true |
| 7 | "Decision N: Adaptive Skeleton runs in either form and its Natural Armor starts ticked (HQ17, 0414)" (`engine.test.mjs`) | Street Forge-Fang in Human form: `startPower("adaptive-skeleton")`; `naturalArmor(ch, ["adaptive-skeleton"])`; `setToggle` Werewolf then Human | ok, spent 2; the source amount 2, total 2; after both shifts still running, while a running Null Field stopped on the shift back |
| 8 | "Decision N: Icebound Resilience runs, and its +1 doesn't stack with Iron Hide (HQ17, Decision 215)" (`engine.test.mjs`) | Heroic Upyr, Icebound placed and Iron Hide placed + 1 CP (rank 2), both started | spent 3 + 2; `naturalArmor(ch, ["icebound-resilience", "iron-hide"]).total` 3 |
| 9 | "Decision N: a running entry keeps a whole used through migrate(), and junk goes" (`engine.test.mjs`) | `running` `[{ id: "null-field", used: 3.7 }, { id: "a", used: -2 }, { id: "b", used: "x" }, { id: "c", used: 5000 }]` | `[{ id: "null-field", used: 3 }, { id: "a", used: 0 }, { id: "b" }, { id: "c", used: 999 }]`; schema N. **H1's "junk is dropped" row with `used: 2` now keeps it: update that expectation** |
| 10 | "Decision N: the seat hit offers immunity and silver, and spends nothing (HQ15)" (`smoke-table-seat-fight.test.mjs`) | a seat whose copy runs Spectral Veil and Null Field and holds Odin's Aegis: open the seat hit | the immunity box checked, no Null Field or Odin's Aegis box, the "own sheet" line; Apply Ballistic 10 → the row's damage +0 |
| 11 | "Decision N: every run and react agrees with the power's cost text" (`rules.test.mjs`, **rewriting** H1's test) | every power and starter row with `run` or `react`, by script | "sustained" ↔ `each: "round"`; otherwise `"start"`; "Rank + N", "Rank", "N SFR" ↔ the numbers; "Rank, as a reaction" ↔ `react`; sustained count still 7; the `"start"` rows computed from the data are Red Mist, Icebound Resilience, Null Field and Adaptive Skeleton |
| 12 | "CRB 0413/0414: the hit's powers say what the data does" (`rules.test.mjs`) | `crb(…)` | Red Mist's and Spectral Veil's "immune to Physical damage"; Null Field's "Absorbs up to 5 Elemental, Spirit, or Aether damage, until used up"; Odin's Aegis's "BOD bonus + 2 × rank"; Silverscar's "halved (never below 1)"; Adaptive Skeleton's "Natural Armor 2"; the rebalancing sheet's "armor stops Physical damage, not Elemental, Spirit, or Aether" |
| 13 | "Decision N: Take a hit's power boxes: immunity and Null Field ticked, Odin's Aegis disabled with its reason, and one undo takes it all back" (`smoke-sheet-play.test.mjs`) | a Draugur with Spectral Veil running and Odin's Aegis held: open Take a hit, Ballistic, then Spirit; tick Odin's Aegis; Apply; undo | immunity checked; Odin's Aegis disabled with "Elemental, Spirit or Aether only" on Ballistic; enabled on Spirit; after Apply the label names it and spent +rank; undo restores damage and spent |
| 14 | "Decision N: a starter row's table has no Id or Run column, and its Start sits under it" (`smoke-sheet-play.test.mjs`) | a Forge-Fang on the Character tab | the CyberWolf Protocol table's headers are exactly Augmentation, Cost, Effect; a Start labelled "Start Adaptive Skeleton"; after Start, focus on its Stop and the line reads "Running" |
| 15 | "Decision N: a Withering hit asks From silver only with Silverscar" (`smoke-sheet-play.test.mjs`) | the Wildblood with and without Silverscar, Withering then Regular | the box shows only for Withering with Silverscar |

## 11. Tests beyond the examples

- **The outputs diff** (`WORK-ORDERS.md`). **Expected moves:** apart from the version stamps, Upyr fixtures gain Start on Red
  Mist's and Icebound's cards where held; Forge-Fang fixtures gain the Adaptive Skeleton run row and Start in the popover, and
  Null Field's Start where held. No number moves on any tab. **Note it:** `tools/outputs.mjs` cuts long outputs, so list which
  outputs differ beyond the stamps, by name, from its full output.
- **Totality:** `hitAnswers`, `resolveHit` and `applyHit` with junk in `powers`, `react` and `silver` (strings, numbers, ids not
  held, ids held but not running), and with a `hitTaken` row with strings for numbers (`withData`); `runningPowers` with a starter
  row lacking `id`; a `starterPower` that isn't an object. No throw, no NaN.
- **Decision 135:** the key guard sees `hitTaken`, `immune`, `absorb`, `minus`, `react`, `from` (and `magical` on a grant) read.
  No power, type or archetype id in the new code.
- **Hostile:** `running` with `used` as markup renders nowhere as markup; a hit input naming a power the character doesn't hold
  changes nothing.
- **Voice:** every new string through `voice.test.mjs`.
- **Mutation-test**, listing the mutants in the PR and the log: immunity after armor (PROT asked); immunity on a `magical` type;
  Odin's Aegis without its charge; Odin's Aegis charged on a Physical hit; Null Field not storing `used`; Null Field not stopping
  when used up; Silverscar read as Wither Ward (any Withering halved); the starter row under `runsIn`; `powerHtml` keeping the `id`
  column; the seat hit spending Null Field. **Check each for a second path**: the disabled box isn't the guard, the engine's
  refusal is.

## 12. Steps

`npm run verify` after each; `npm run test:fast` inside them.

1. `git submodule update --init private`, `npm run verify` on the fresh branch (note the totals), and `before.json` with
   `tools/outputs.mjs` before any engine change.
2. §10's rows as failing tests.
3. Data (8a.1–8a.5) and the store (8a.6, the schema bump, the expected literal breaks).
4. Engine 8b.1–8b.2 (starter rows run, Natural Armor), then 8b.3–8b.4 (`hitAnswers`, `grants`, `hitAsks`), then 8b.5–8b.7 (the
   hit).
5. The UI (§9): the card and popover lines, `powerHtml`, the starter run row, the two hit panels.
6. **The dev preview** (`shadows-dev-preview`). Run each of these, with screenshots or the metrics if the tool times out:
   - A Heroic Draugur starts Spectral Veil, takes Ballistic 10 (nothing), then Spirit 10 with Odin's Aegis (−4 at BOD 6, rank 2).
   - A Forge-Fang starts Adaptive Skeleton in human form (Natural Armor box ticked), shifts, starts Null Field, takes two Spirit
     hits until it's used up, then shifts back.
   - The Wildblood with Silverscar takes a Withering hit from silver.
   - The seat hit on Dead Air's Dex (seed a copy running Spectral Veil if needed, or note that Dex holds none).
   - The card and the hit modal at 375px.
7. Docs (§14), Decision N, CHANGELOG and `npm run changelog`, the versions (§2), the outputs diff, `npm run verify`, and `npm run
   phone-check`.

## 13. Stop and ask

**Stop** if:

- a reader of `resolveHit`'s result that §5 doesn't list would show a power's answer wrong (grep `.through`, `.natural`, `.taken`
  in `src/ui`);
- a starter row other than Adaptive Skeleton turns out to need `run` to make a test pass;
- the outputs diff moves a number for a character with nothing running and no new box ticked;
- a test other than the ones below breaks.

**Expected breaks, not stops** (update them, never weaken the guard):

- H1's rules test (`rules.test.mjs:3469–3487`): rewritten as §10 row 11;
- H1's migrate test's `{ id: "iron-hide", used: 2 }` expectation (§10 row 9);
- every `"0.33"` character-schema literal (grep `0.33` in `tests/`, `samples/`, `SCHEMA.md` §3, `README.md`, `STATE.md`);
- `hostile.test.mjs:71`'s `used` (a markup string) now meets `used`'s rule and is dropped, so check what that test asserts about it;
- the Dead Air sample's stamps (`tools/sample-table.mjs` regenerates it);
- the version literals your bumps move, if any (§2);
- **`phone-check`: no frame should move.** The frame fixture seeds an arcanist only, and opens no power card, popover or hit with a
  power. Its 12 differing frames on `main` (home, the Character Points step) are not this order's. Re-record nothing, and say so
  with the before/after rows.

## 14. Close-out

Use the **close-the-session** skill, Rule-or-shape tier:

- Decision N with its INDEX line, and no supersession marks (§3), but say "extends 236 and 266" in both;
- STATE rewritten (versions, the powers row, H3 next, Battle Hardened and Elemental Blood waiting on the book);
- the log entry with the mutants and the outputs diff;
- `log/shipped.md`'s row;
- **W132 stays open**, its Plan line pointing at H3 and at the two held out (HQ11);
- the plan's §6 gains the two book items, and its H2 row reads built;
- CHANGELOG plus `npm run changelog`, and the versions (§2);
- this order's status line reads built.

**CHANGELOG** (player voice, drafted):

- **Powers answer a hit.** While Spectral Veil or Red Mist runs, Physical damage does nothing. Null Field soaks up Elemental, Spirit
  and Aether damage until it's spent, and Odin's Aegis takes its bite out of one such hit for its SFR, right in Take a hit.
- **Silverscar halves silver's Withering**, and Adaptive Skeleton's and Icebound Resilience's Natural Armor counts while they run.

**PR title:** `feat(powers): powers answer a hit (H2, W132, Decision N)`.
**PR body:** the template's sections, plus *Where the order didn't fit* (empty is fine), the mutants, the outputs diff's summary
(by name, §11), and **For Ken**: every new string as it renders (§9's rows, the refusals, the commit labels), for the voice pass.

### Review checklist

- [ ] §10's rows pinned, each naming what it pins, each failing on `main` first.
- [ ] `hitAnswers` is the one reader of `hitTaken`; `runningPowers` is still the one place running is decided, and starter rows go
      through it.
- [ ] Immunity reads `magical`, never a type id; it short-circuits before PROT.
- [ ] The stage order is immune → armor → Natural Armor → Odin's Aegis → Null Field → `meleeTaken` → Wither Ward/silver.
- [ ] Every SFR spent goes through `adjustPanelTracker`. Odin's Aegis's refusal is the engine's, and its disabled box shows the
      reason on the page.
- [ ] Silverscar never sets `witheringHalvedBy`; Wither Ward is unchanged.
- [ ] `migrate()` keeps a whole `used` in 0–999; a 0.33 file round-trips.
- [ ] The seat hit offers immunity and silver only, and its clone spends nothing.
- [ ] `powerHtml` has no Id or Run column on any starter table, in the wizard and on the Character tab.
- [ ] Decision N passes `docs.test.mjs` with its Rejected and Why whole; INDEX line present.
- [ ] The outputs diff moves only §11's expected; `phone-check` rows match `main`'s.
- [ ] Mutants in the PR and the log; `npm run verify` green; versions per §2.
- [ ] Run in the dev preview: the Draugur, the Forge-Fang through both forms, Silverscar, the seat hit, 375px.

## 15. Handing it over

The two prompts are `WORK-ORDERS.md`'s, with this order's path, `docs/plans/powers-that-run/H2-powers-answer-a-hit.md`. Session
titles: **H2 build** (Sonnet) and **H2 review** (Opus, fresh). Add these traps under the builder's prompt:

> Seven things in this order are easy to get wrong:
>
> 1. **Silverscar is not Wither Ward.** `grants()` turns any `withering` + `halve` into `witheringHalvedBy`. A row with `from`
>    must go elsewhere first, or every Silverscar Werewolf halves all Withering.
> 2. **Immunity comes before PROT.** `mitigateArmor` refuses a covered hit with no PROT roll. An immune Physical hit must return
>    before it's asked, or the player is told to roll for a hit that does nothing.
> 3. **`powerHtml` turns keys into columns.** Adding `id`, `run` or `grants` to a starter row adds a column, unless `powerHtml`
>    skips the keys code reads.
> 4. **A starter row isn't under `runsIn`.** H1's `runningPowers` returns `[]` for every power out of the form. Move the check
>    per def, or Adaptive Skeleton stops on a shift the book says it survives.
> 5. **"Physical" is `magical !== true`.** Don't list types.
> 6. **The seat hit spends nothing** (Decision 257). Drop `react` and `absorb` before resolving there, in the engine, not only
>    in the panel.
> 7. **"a round" is H1's line for `each: "round"` only.** A started power that paid once says "Running".
>
> Tier: Rule or shape. One decision, the next free number. Character schema N. App and game data per §2 (add to an unreleased
> `[Unreleased]`). Use the close-the-session skill at the end.
