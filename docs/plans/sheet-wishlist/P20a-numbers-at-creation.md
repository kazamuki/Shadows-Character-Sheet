# Work order P20a: Numbers at creation

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3, row P20a (P20, split). **Source:** the effects sign-off, [`../../reference/rulings-2026-10-16.md`](../../reference/rulings-2026-10-16.md) (*Sanity cuts*, *Stat maximums*, *Starting Çredits*, all unanimous; *Dwarf and Giant exclude each other*, Deighton). Decisions 77, 110, 135, 150, 152, 227, 231, 232.

**Scope.** The numbers a trait sets on a character's build, which today are table rules the sheet shows and doesn't apply:
- **Sanity cuts:** Blood Lust −5, Berserker −15, Fanatic −15, Hallucinations −25 and Minor Insanity −5 a rank come off max SAN as points ("5% is 5 points").
- **Arcane Fortitude's +2 TOL.** An Arcanist Aberration (a specialization option) whose benefit text says "Gain +2 to TOL". Probed on `main`: `derived(ch).TOL` is 1 with it and 1 without. It shares SAN's mechanism, so it rides here (found by the P21 inventory, 2026-10-17).
- **Stat maximums:** Age (BOD 5, REF 6, MOB 6), Dwarf (BOD 8, MOB 3) and Giant (BOD 11, REF 5, MOB 8) cap their stats in the wizard. Giant's BOD 11 lifts the cap above 10.
- **Dwarf and Giant exclude each other** (Deighton). It's the first real `excludes` pair in the data (Decision 77).
- **Wealthy's Ç10,000**, once, at the start. The Ç2,000 a month a rank stays a table rule (W129, the Milestone payday, is its future).

**Not here: P20b** ([`P20b-numbers-in-play.md`](P20b-numbers-in-play.md)) takes the numbers that move in play: Pain (Terminal Disease, Pain Tolerance), healing (Rapid Healing) and Take a hit (Scrapper, Giant, Thick Skull). They share no code with P20a. Split this way, each PR has one reviewer's worth of rules in it.

**Status:** **drafted 2026-10-17 by Claude (Opus)**, P19's reviewer. Pre-flighted against `main` at `2d38dc9` (#213 merged; app 0.49.0, data 0.41). **PQ1–PQ9 open.**

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md) (*The cadence*). Ken starts **P20a build**, then a fresh reviewer once the PR is open.

**Carried over from P19's review:**
- **The order's miss:** P19 computed only Advantages and Disadvantages, and the same effects sit on Milestones, archetype ranks, specializations and powers. **Applied here:** the new `grants` types are read from every source `naturalArmor()` already scans (Advantages, Disadvantages, taken Majors, `specializationChosen`, `archetypePowers`). That's how Arcane Fortitude, a specialization, gets in. The P21 inventory owns the rest of those sources.
- **The silent rules answer:** P19's review found three rules questions the code answered by default (Defect/Flaw's scope, untrained checks, Specialist). **Applied here:** every place a choice is made without a ruling is a PQ below, each with a default, and nothing is decided in code that isn't in §3.

**Pre-flight against `main`** (`2d38dc9`; engine read, data dumped with node):

```
SAN max          derived(ch).SAN = EMP × 10, floor 10, cap 95 (data `derived`). Five Disadvantages say "Sanity −N%":
                 rule rows today, never applied. Minor Insanity's is byRank [5,10,15,20,25]
TOL              derived(ch).TOL = 1 + mods, floor 1, + the Arcanist scaling row's tolBonus. Arcane Fortitude's
                 "+2 to TOL" is a `benefit` string on a specialization option: probe 1 → 1
derived readers  sanState, Cascade's TOL deltas (~3059–3083), starting spells counted from TOL (~3317), a panel whose max is TOL (~3368),
                 the sheet's derivedBreakdownStr (sheet.js ~148), the vitals cards, print, the wizard rail (~62, ~103) and review (~723)
Stat cap         D().statRules.max (10), read in five engine places (~781 CP boost, ~2332 ipCost, ~2747 Honed,
                 ~4834 spendable) and four wizard places (~248, ~335, ~362, ~368, ~1122). No per-trait cap exists
Above 10         statMod handles >10 (beyondTen); health() adds HP per level past BOD 10. Focus points
                 "can push a stat past 10" (wizard ~335)
excludes         optionLock is symmetric and tested on a synthetic fixture (engine.test ~701). No entry declares one
Çredits          buildExport (~5123) seeds trackers.credits.current = roll × multiplier at lock, once, while the ledger is empty
Wizard order     Stats (step 3) comes before Character Points (step 7), where Age, Dwarf and Giant are bought
```

---

## 1. Goal

When P20a is merged:

1. **A Sanity cut lowers max SAN.** EMP 6 with Berserker: max SAN 45, not 60. Minor Insanity at rank 3: −15. The vitals card, print, the wizard's rail and review, and the SAN breakdown all read the cut max. The breakdown names each cut ("EMP 6 × 10 = 60% − 15 Berserker → 45%").
2. **Arcane Fortitude adds 2 to TOL.** An Arcanist who took it reads TOL 3 where they read 1, and every reader of TOL follows. The TOL breakdown names it.
3. **A trait's stat maximum binds.** Dwarf held: MOB stops at 3 in the wizard, CP boosts, IP raises and Honed. The stepper's + is disabled at the cap, and the row says why ("Max 3 (Dwarf)"). Giant: BOD can reach 11. With none held, every cap is `statRules.max` exactly as today.
4. **Taking a cap you're already past is caught.** MOB 5, then Dwarf on the CP step: the card says so, and the lock is refused until MOB is 3 or lower, with an error that names the stat and the Stats step. Nothing lowers a stat on its own.
5. **Dwarf and Giant can't both be held.** Holding one locks the other on the CP step and in every IP list, with optionLock's existing reason.
6. **Wealthy starts you Ç10,000 richer.** Held at lock: starting Çredits = the roll × the multiplier + 10,000, in the wizard's review line and on the sheet.
7. **The tags follow.** The five SAN cuts, Arcane Fortitude, and the three caps become computed rows with tags from templates. Wealthy's +Ç10,000 is a computed row too. A held card states its total (Minor Insanity at rank 3: "Max SAN −15").
8. **Nothing else moves.** A character holding none of these computes byte for byte what it does on `main`.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** New computed `grants` types, a new engine reader for stat caps, a first `excludes` pair, and a value written at lock. One numbered decision, **N** (the next free number on `origin/main` when built), extending 135 (archetypes stay data) and 231 (computed rows). Propose-before-build is §3.
- **Game data: bump** `0.41` → `0.42` (Decision 68): max SAN, TOL, the stats a character can buy, and starting Çredits all change for a holder.
- **App: minor**, `npm run bump -- 0.50.0` (or the next minor if another order lands first).
- **Character schema: no bump.** Nothing new is saved. Starting Çredits are already written at lock, from inputs; the formula gains a term.
- **No flag** unless Ken answers PQ1 with "ask Deighton".

## 3. Questions for Ken

| Id | Question | Default |
|---|---|---|
| PQ1 | **Age's MOB cap.** Deighton would drop it ("kids are freaking fast", W130). The book still says MOB Max 6. | **Build the book's three caps** (BOD 5, REF 6, MOB 6). If Deighton drops MOB, that's a one-line data edit and a data bump. *Alternative:* leave MOB out now and flag Age (F-number) until he rules. |
| PQ2 | **Where a cap binds.** The sign-off says "cap them in the wizard"; Ken: "a GM could override this, but that could be after creation, I think?" | **Creation and play:** the wizard, CP boosts, IP raises and Honed all stop at the cap. **Admin** (the GM's override) can set a stat past it, as it can any number. *Alternative:* the wizard only, with IP free to pass it. |
| PQ3 | **A cap and an archetype's Focus points**, which the wizard says "can push a stat past 10". | **A trait's cap still binds:** Dwarf's MOB 3 is a body, and Focus can push only past the *human* max. Giant's BOD 11 is the ceiling a Giant's Focus reaches. *Alternative:* Focus ignores trait caps as it ignores 10. |
| PQ4 | **Two caps on one stat** (Age's BOD 5 and Giant's BOD 11; Age and Dwarf). | **The lowest cap wins.** Giant's 11 "lifts the cap" only above `statRules.max`, never above another trait's lower cap. No pair is excluded except Dwarf and Giant. *Alternative:* ask Deighton for an Age/Giant exclusion too. |
| PQ5 | **Taking a cap you're already past** (MOB 5, then Dwarf). | **Allowed, and the lock is refused** with an error naming the stat, the cap, the trait and the Stats step. The CP card shows the same line. The engine never lowers a stat or refunds points. *Alternative:* refuse the trait until the stat is lowered, which makes the player leave the CP step first. |
| PQ6 | **The SAN floor after cuts.** EMP 1 is SAN 10 (the floor), and Berserker with Hallucinations cuts 40. | **The cuts come off after the cap and the floor, and max SAN never goes below 1**: a character with no Sanity can't be played. *Alternative:* the floor of 10 holds after cuts, which makes a cut do nothing at low EMP. |
| PQ7 | **The cap of 95, then the cut.** EMP 10 is 100, capped at 95. | **Cut from 95:** EMP 10 with Blood Lust is 90 ("points off the max"). *Alternative:* cut from 100, then cap (Blood Lust does nothing at EMP 10). |
| PQ8 | **Wealthy bought in play** (Decision 227 sells Advantages for IP). | **No Ç10,000:** the book says "start with", so it's paid only when Wealthy is held at lock. A rank bought later doesn't pay it again. In play, the tag says the bonus was a starting one. *Alternative:* pay it once whenever the first rank is taken. |
| PQ9 | **Arcane Fortitude here or in P21?** It's a specialization, P21's territory, but it's a number like SAN's, with no ruling needed. | **Here**, as the same `grants` type on the specialization option. P21 inherits the scan. *Alternative:* leave it for P21. |

## 3a. The decision, drafted

```
N. **A trait's cut or bonus to a derived stat, its cap on a Basic Stat, and Wealthy's starting Çredits are computed: max SAN, TOL, the stats a character can buy, and the lock's Çredits follow them.**
     *2026-10-1x · Ken + Claude · Touches: derived, derivedParts, sanState, statMax, statRules.max, grants derivedMod, statMax, startingCredits, buildExport, optionLock, excludes, Blood Lust, Berserker, Fanatic, Hallucinations, Minor Insanity, Arcane Fortitude, Age, Dwarf, Giant, Wealthy, Stats step, Character Points step, Honed, ipCost, effectTags*
     - **Decided:** `derivedMod` ({ stat, amount | perRank }) and `statMax` ({ stat, max }) are computed `grants` types, read from Advantages, Disadvantages, taken Majors, specializations and archetype powers. A derived stat's mods apply after its floor and cap; max SAN never drops below 1. `Engine.statMax(ch, id)` is the one cap: the lowest trait cap, else `statRules.max`, and Giant's 11 is a cap like any other. It binds the wizard, CP boosts, IP and Honed; Admin can pass it. A cap already passed refuses the lock. Wealthy's `startingCredits` row adds at lock only. Dwarf and Giant exclude each other.
     - **Why:** The sign-off, unanimous: SAN cuts as points off the max, stat caps in the wizard, Ç10,000 once. A number the sheet shows and doesn't apply is the drift 231 ends.
     - **Rejected:** (from PQ1–PQ9's alternatives, as answered)
     - **Replaces:** Decision 231 in part (these entries' effects become computed rows). Extends 77 (the first real `excludes` pair) and 135.
     - **Revisit if:** Deighton drops Age's MOB cap (W130); a cap must bind only at creation; Wealthy's monthly pay becomes a Milestone payday (W129).
     - **Built:** app 0.50.0, game data 0.42, no schema bump, PR #…. Log 2026-10-1x (P20a).
```

## 4. Read first

`CLAUDE.md` (constraints 7, 8; *Decisions*; *Watch for mechanical drift*). `SCHEMA.md` §4: Decisions 77, 110 (aberration adjust and its floor), 135, 150, 152, 227, 231, 232. `engine.js`: `derived` (~594), `naturalArmor`'s scan (~1170–1191, the pattern to copy), `grants()` (~165), `statMod` (~134), the four `statRules.max` readers, `optionLock` (~4610), `buildExport` (~5117), `validate`'s `review` branch (~5097). `wizard.js`: `renderStats` (~240), the Focus and bonus allocators (~330–370), the stepper guard (~1122). `sheet.js`: `derivedBreakdownStr` (~148). **The CRB, before any template:** `0440` for each Disadvantage, `0430` for Wealthy, `0411` for Arcane Fortitude, and `0400`/`0450` for stat caps and Focus.

## 5. What this changes underneath (the sweep)

Answered by grepping readers (`derived(`, `.SAN`, `.TOL`, `statRules.max`, `optionLock`, `startingCredits`, `rolls.credits`). **Check each row before you build**, and say in the PR if one is wrong.

| Today | Where | After P20a |
|---|---|---|
| `derived(ch)`: formula, floor/cap, the scaling row's `tolBonus`, manual `adjustments`, then Aberrations with `adjustFloor` | `engine.js` ~594 | Adds the held `derivedMod` rows after the scaling row and before `adjustments` (so a manual adjustment still reads last, and the Aberration floor is unchanged). SAN never drops below 1 (PQ6). Exposes `derivedParts(ch, id)` → `[{ name, amount }]` for the breakdown. |
| `sanState`: max = `derived(ch).SAN` | ~2205 | Follows on its own. `loss` above the new max reads current 0 (already floored). |
| IP restores SAN "never past the maximum" (Decision 227) | ~2388, ~2835 | Follows on its own: it reads `sanState`. Pin it: Minor Insanity bought off a rank raises the max by 5. |
| Cascade's TOL deltas, starting spells (counted from TOL), a panel whose max is TOL | ~3059–3083, ~3317, ~3368 | Follow on their own. Pin one: Arcane Fortitude raises the starting-spells count by 2. |
| `derivedBreakdownStr` rebuilds the number from the data and calls any difference "bonus" (TOL) or "floor / cap" (SAN) | `sheet.js` ~148 | Reads `derivedParts` and names each ("+2 Arcane Fortitude", "−15 Berserker"). A SAN cut no longer reads as "(floor 10 / cap 95)". |
| `statRules.max` read directly | `engine.js` ~781, ~2332, ~2747, ~4834 | Each reads `Engine.statMax(ch, id)`. The refusal text names the trait ("Max 3 (Dwarf).") through a template, not a typed string. |
| The wizard's stepper and allocators read `D.statRules.max` | `wizard.js` ~248, ~335, ~362, ~368, ~1122 | Read `Engine.statMax`. `renderStats` shows "Max N (Trait)" on a capped row (PQ3, PQ4). The Focus line's "past 10" stays (it's the human max), and a capped stat stops there. |
| `validate` has no stat-cap check | ~5040–5100 | An **error** for a Basic Stat above its `statMax` (PQ5), naming the stat, cap, trait and the Stats step. Template in `appCopy`. |
| No entry has `excludes` | data | `dwarf.excludes = ["giant"]` (the lock is symmetric, so Giant needs no entry). Its first real use. The synthetic fixture tests stay. STATE §2's "No entry declares `excludes`" is rewritten. |
| `buildExport` seeds Çredits = roll × multiplier | ~5123 | + each held `startingCredits` row's `amount`, only while the ledger is empty (as now) and only at lock (PQ8). The wizard's review line (`wizard.js` ~718) shows the sum, with Wealthy named. |
| `effectTagsFor` fills Decision 231's and 233's types | ~240–330 | Fills `derivedMod`, `statMax` and `startingCredits`, held and unheld (`effectTagsHeld.derivedMod` states the total for Minor Insanity's rank). |
| `naturalArmor()` scans five sources; `grants()` three | ~1170, ~165 | A new `traitGrants(ch, type)` (or the same scan inline) reads the five sources for `derivedMod` and `statMax`. **Don't widen `grants()`'s scan.** It feeds numbers this order doesn't touch. |
| GM mode | `gm.js` | Reads `Engine.npc`'s TOL/WILL as authored (Decision 175). **Unchanged.** A PC row reads the character's own `derived`, so it follows. |
| `tools/outputs.mjs` snapshots `derived` | tools | Expect differences only for fixtures holding these entries. |

## 6. The shapes

**`grants` rows** (computed; tags from templates):
```
{ "type": "derivedMod", "stat": "SAN", "amount": -5 }                 // Blood Lust (−15 Berserker, Fanatic; −25 Hallucinations)
{ "type": "derivedMod", "stat": "SAN", "perRank": -5 }                // Minor Insanity (replaces byRank [5..25])
{ "type": "derivedMod", "stat": "TOL", "amount": 2 }                  // Arcane Fortitude, on the specialization option
{ "type": "statMax", "stat": "BOD", "max": 8 }                        // one row per stat: Age ×3, Dwarf ×2, Giant ×3
{ "type": "startingCredits", "amount": 10000 }                        // Wealthy
```
`stat` for `derivedMod` must be a `D().derived` id; for `statMax`, a `D().stats` id. A row naming anything else is skipped, never thrown (constraint 8).

**Engine readers** (total):
```
Engine.statMax(ch, id)       → { max, by: name|null }   lowest held cap, else { max: statRules.max, by: null }
Engine.derivedParts(ch, id)  → [{ name, amount }]       in data order
Engine.startingCredits(ch)   → { roll, multiplier, bonus: [{ name, amount }], total|null }
```

**Templates** (drafted, **marked for a voice pass**):
```
effectTags:     derivedMod "Max {statName} {amount}" · statMax "{statName} max {max}" · startingCredits "+Ç{amount} to start"
effectTagsHeld: derivedMod "Max {statName} {total}"      (Minor Insanity: perRank × rank)
appCopy:        statMaxBy "Max {max} ({by})." · statMaxLock "{stat} is {value}, over {by}'s max of {max}. Lower it on the Stats step."
```
`{amount}` and `{total}` are signed with a true minus. `{statName}` is the derived or Basic Stat's `name`.

## 7. Out of scope

- **P20b's areas:** Pain, healing, Take a hit.
- **Wealthy's Ç2,000 a month** (W129). **Poverty's tracker** (W124).
- **Conditional stat changes** (a power that lifts MOB while it runs; P21's inventory lists five). **Unshakable Mind's +10% to Sanity Breakers** (the sheet computes no Breaker roll; P21).
- **Age's other text** (dependent, restricted, targeted) and **Dwarf's and Giant's other lines** (height, Easy Target, grappling). They stay rule rows. Giant's −4 is P20b's.
- **Any change to a ruled sentence.** A row's words move from `ruleText` into a template, and §13 checks they still say the same thing.

## 8. The entries

| Entry | Becomes | Stays a rule row |
|---|---|---|
| Blood Lust | `derivedMod` SAN −5 | the Sanity Check; P19's failOn |
| Berserker | `derivedMod` SAN −15 | the start-of-combat check and berserk |
| Fanatic | `derivedMod` SAN −15 | EMP TN +1, the once-per-encounter check |
| Hallucinations | `derivedMod` SAN −25 | the hallucination itself |
| Minor Insanity | `derivedMod` SAN `perRank` −5 | the traits, the IP buy-off |
| Arcane Fortitude (Arcanist Aberration option) | `derivedMod` TOL +2 on the option's `grants` | its `benefit` text stays (it's what the picker shows) |
| Age | `statMax` BOD 5, REF 6, MOB 6 (PQ1) | 13 to 15, dependent, restricted, targeted |
| Dwarf | `statMax` BOD 8, MOB 3; `excludes: ["giant"]` | height; P19's Stealth mark |
| Giant | `statMax` BOD 11, REF 5, MOB 8 | Easy Target, grappling, height; the −4 (P20b) |
| Wealthy | `startingCredits` 10000 | the Ç2,000 a month a rank |

**Check each number against the book** (`0440`, `0430`, `0411`), not against this table.

## 9. The UI

- **Stats step:** a capped row shows "Max N (Trait)" under the name (it's a price-like line, so Expert mode never folds it, as P19's `.next-cost`). + is disabled at the cap.
- **CP step:** a card for a cap the character is already past says so in its tags' place ("MOB is 5, over Dwarf's max of 3"), and the lock error repeats it.
- **Vitals, Main, print, the wizard rail and review:** read the numbers; no new control.
- **The SAN and TOL breakdowns** name each part (§5).
- **Review:** "Starting Ç: 12,000 + 10,000 Wealthy = 22,000" (the multiplier as today).
- **No new control.** Nothing here is pressed, so there's no *where things land* table.

## 10. Worked examples, as named tests (write first; run on `main` and keep the output)

| Name | File | Setup → result |
|---|---|---|
| `P20a 1: a Sanity cut comes off max SAN, everywhere it's read` | rules | EMP 6, Berserker: `derived.SAN` 45, `sanState.max` 45, `derivedParts` names it. Minor Insanity ranks 1–5: 55/50/45/40/35. EMP 10 with Blood Lust: 90 (PQ7). EMP 1 with Berserker and Hallucinations: 1 (PQ6). With none held, every `derived` value equals `main`'s. **On `main`: fails.** |
| `P20a 2: Arcane Fortitude adds 2 to TOL` | rules | An Arcanist with the option chosen: TOL +2; the starting-spells count +2; not chosen: as `main`. **On `main`: fails.** |
| `P20a 3: a trait's cap binds every way a stat goes up` | rules | Dwarf: `statMax(MOB)` = { 3, "Dwarf" }; `cpBoost` at MOB 3 refused with "Max 3 (Dwarf)."; `ipCost` refused; Honed's MOB option `off`. Giant: BOD reaches 11 through IP. Age + Giant: BOD max 5 (PQ4). None held: `statRules.max` everywhere. |
| `P20a 4: a cap already passed refuses the lock` | rules + smoke-wizard | MOB 5, Dwarf bought: `validate` errors name MOB, 3, Dwarf and Stats; the CP card shows it; lowering MOB to 3 clears it. MOB never changes on its own. |
| `P20a 5: the Stats step shows and enforces the cap` | smoke-wizard | Dwarf held, back on Stats: MOB's + disabled at 3, "Max 3 (Dwarf)" shown; Expert mode on: the line still shows. |
| `P20a 6: Dwarf and Giant exclude each other` | rules + smoke-wizard | Dwarf held: Giant locked on the CP step and in the IP buy list, reason "Dwarf"; and the reverse. |
| `P20a 7: Wealthy's Ç10,000 is paid once, at lock` | rules + smoke-wizard | Roll 6 at a ×2,000 level, Wealthy held: the review reads the sum and the locked sheet holds 22,000. Rank 3: still +10,000. Bought by IP after lock: no change (PQ8). A ledger with entries: no reseed. |
| `P20a 8: the tags are computed, held and unheld` | rules | Each §8 entry's computed tags; Minor Insanity held at 3 reads "Max SAN −15"; P18 4 still passes. |
| `P20a 9: the breakdowns name the parts` | smoke-sheet-* | The SAN and TOL breakdowns name Berserker and Arcane Fortitude, with no "floor / cap" when neither applies. |
| `P20a 10: the readers are total over hostile rows` | engine | `stat` unknown, `amount` "5" or NaN, `max` negative or "8", `perRank` on a rank-0 row, a `startingCredits` amount that isn't a number: nothing throws; bad rows are skipped. |

## 11. Tests beyond the examples

- **Totality:** P20a 10, plus the existing guards over `derived`, `validate` and `effectTagsFor`.
- **Voice:** the new templates pass `voice.test.mjs`; P18 7's template scan covers the new keys.
- **Phone width:** `npm run phone-check` with Dwarf held on the Stats step (the "Max" line) at 320px.
- **Dev preview:** the Stats step at 375px with Dwarf held, and the CP card past a cap. Screenshot or measure in the PR.
- **Outputs:** `tools/outputs.mjs` before and after; every difference is a fixture holding a §8 entry.

## 12. Mutants, each of which must fail a test

1. A `derivedMod` applied before the cap (P20a 1, EMP 10).
2. The SAN floor of 1 dropped (P20a 1, EMP 1).
3. `derivedMod` read only from Advantages and Disadvantages, not specializations (P20a 2).
4. One `statRules.max` reader left unconverted (each of P20a 3's four refusals).
5. The highest cap winning instead of the lowest (P20a 3, Age + Giant).
6. The lock check removed (P20a 4).
7. `excludes` written on both entries' sides, then one removed (P20a 6, in both directions).
8. Wealthy's bonus paid per rank (P20a 7, rank 3).
9. Wealthy's bonus paid when bought after lock (P20a 7).
10. One of §8's entries left as a rule row (P20a 8).

## 13. Steps

1. Read §4; confirm each §5 row; **check §8's numbers against the book**. `npm run test:fast`.
2. Write §10's tests; run them on `main`; keep the output for the PR.
3. Data: the `grants` rows, `excludes`, the templates. `gamedataVersion` 0.42. `npm run test:fast`.
4. Engine: `derived` and `derivedParts`, `statMax` and its readers, `validate`, `buildExport`, `effectTagsFor`. `npm run verify`.
5. UI: the Stats step, the CP card, the breakdowns, the review line. `npm run verify`, the dev preview, `npm run phone-check`.
6. Mutants (§12), scripted: apply, run the named test, restore from a saved copy.
7. Close-out (§15).

## 14. Stop and ask

- **A ruled sentence would change meaning** when its words move into a template. Say which, and stop.
- **A computed value moves for a character holding none of §8's entries.**
- **Anything new saved in the character.** Nothing should be.
- **A stat would be lowered, or points refunded, by the engine.** Never (PQ5).
- **An existing test fails** other than these **expected breaks**: tests that read a §8 entry's rule line (grep the ten ids), the `excludes` synthetic-fixture comment ("The CRB names no mutually exclusive pair yet", `engine.test` ~701, whose text is now false; the test stays), and any `outputs` fixture holding a §8 entry. **P18 4 must pass unchanged.**

## 15. Close-out and review checklist

**Close-out** (the close-the-session skill, *Rule or shape*):
- Decision **N** in `SCHEMA.md` §4, its INDEX §3 line, Decision 231 and its INDEX line marked **superseded in part by N**, and 77 and 135 noted as extended. SCHEMA §2 gains `derivedMod`, `statMax`, `startingCredits`, the templates and `appCopy` keys. STATE §1 and §2 (the `excludes` bullet) rewritten.
- `gamedataVersion` 0.42; `npm run bump -- 0.50.0`; CHANGELOG, then `npm run changelog`.
- The plan's P20a row; a `shipped.md` row; a `log/2026.md` entry.
- PR title: `P20a: Numbers at creation (Decision N, app 0.50.0, data 0.42)`. The body includes **Where the order didn't fit**.

Suggested CHANGELOG lines (player voice):
- **Your Disadvantages cost you Sanity.** Berserker, Blood Lust, Fanatic, Hallucinations and Minor Insanity take their points off your max SAN.
- **Arcane Fortitude adds 2 to your TOL.**
- **Age, Dwarf and Giant set how high your stats can go,** and a Giant's BOD can reach 11. Dwarf and Giant can't be taken together.
- **Wealthy starts you with Ç10,000 more.**

**Review checklist:**
- [ ] §10's tests exist with those names, run on `main`'s code in the PR (P20a 1 and 2 fail there).
- [ ] §5's rows each confirmed or corrected; every `statRules.max` reader converted (grep shows none left outside `statMax`).
- [ ] §8's numbers match the book, not just this order.
- [ ] PQ1–PQ9 as answered, each in the decision's **Rejected**.
- [ ] Decision N passes `docs.test.mjs`; 231 marked superseded in part.
- [ ] Mutants 1–10 in the PR, each with its test.
- [ ] Phone-check and the dev preview's measurements in the PR.
- [ ] `npm run verify` green; versions as §2.

## 16. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<plan>/<order>` = `sheet-wishlist/P20a-numbers-at-creation.md` and `<id>` = **P20a**, and these traps under the builder's:

> Six things in this order are easy to get wrong:
>
> 1. **A derived stat's cut comes after its floor and cap,** and max SAN never drops below 1. The breakdown must say so, not call it "floor / cap".
> 2. **`statMax` is the one cap.** Grep `statRules.max` when you're done: only `statMax` should read it. A trait's cap and Giant's lift are the same row type.
> 3. **The lowest cap wins**, and Focus points stop at a trait's cap (PQ3, PQ4).
> 4. **The engine never lowers a stat.** A cap already passed refuses the lock and says where to fix it.
> 5. **Read the five sources `naturalArmor()` reads**, not `grants()`'s three. Arcane Fortitude is a specialization option.
> 6. **Wealthy pays once, at lock, while the ledger is empty.** Not per rank, not when bought in play.
>
> Tier: **Rule or shape**. One decision (the next free number), game data 0.42, app 0.50.0, no schema bump. Use the close-the-session skill at the end.
