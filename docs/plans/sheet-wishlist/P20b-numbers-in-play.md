# Work order P20b: Numbers in play

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3, row P20b (P20, split). **Source:** the effects sign-off, [`../../reference/rulings-2026-10-16.md`](../../reference/rulings-2026-10-16.md) (*Pain Levels*, *Healing*, *Take a hit*, all unanimous; Scrapper's text, Deighton). Decisions 96, 99, 104, 110, 202, 213, 219, 220, 223, 231.

**Scope.** The numbers a trait changes while the character is played, which today are table rules:
- **Pain:** Terminal Disease's "always at Pain Level 1" adds, then Pain Tolerance takes 1 off a rank.
- **Healing:** Rapid Healing multiplies natural healing (×2, ×3, ×4 by rank), stacking with Speed Heal. Fast Metabolism (a Cascade Aberration: "You heal twice as fast from rest") joins it (found by the P21 inventory; PQ6).
- **Take a hit:** Scrapper halves Melee and Martial Arts damage (rounded down, never below 1), Giant takes 4 off it, and Thick Skull ignores a head hit's bonus damage. Deighton keyed Scrapper to "Melee and Martial Arts, like Giant", so **Take a hit gains that input**.

**Not here:** P20a ([`P20a-numbers-at-creation.md`](P20a-numbers-at-creation.md)), the build's numbers. **P21** (the inventory session, 2026-10-17) owns the reductions that run with a power: Odin's Aegis, Null Field, Red Mist, Spectral Veil, Elemental Blood, Silverscar, Battle Hardened's immunity (which needs a saved pick), and Regeneration's per-round healing. P20b builds Take a hit's new stage so they can join it as rows.

**Status:** **drafted 2026-10-17 by Claude (Opus)**, P19's reviewer. Pre-flighted against `main` at `2d38dc9`. **Ken answered PQ1–PQ10 on 2026-10-17: the defaults**, PQ9 included (Take a hit doubles an unredirected Head hit, and Thick Skull skips it). Builds after P20a, or beside it: they share no file but the data, and no line in it.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md). Ken starts **P20b build**, then a fresh reviewer once the PR is open.

**Carried over from P19's review:** every choice made without a ruling is a PQ (PQ1–PQ10). The worst one is PQ9: Take a hit doesn't double a head hit today, though `0530` says it does, so Thick Skull has nothing to cancel until that's decided.

**Pre-flight against `main`** (`2d38dc9`):

```
painState      band for HL lost (or Withering's, Pain Immunity, 202) + Conditions + Aberrations, clamped 0–3;
               then Decision 213's `painLevel` grant (onlyIfHurt: true, only at ≥1), capped at 3. 213's Revisit if:
               "another trait shifts Pain unconditionally (onlyIfHurt: false is the room left for it)". Terminal Disease is that
painState readers  skillLine (the check's Pain), essence and breaker penalties, Main and the vitals, print's ladder,
               shared.js ~318 (the before/after toast), GM mode's PC rows (an NPC stand-in holds no traits)
Rest           naturalHealing() proposes BOD a day; the Rest panel multiplies by speedHealMultiplier when Speed Heal is ticked
               (sheet.js ~1124). Focused Healing and a Nanomed Kit take the HP the player enters
Take a hit     resolveHit: Resistance halving → PROT + RES → Natural Armor → Wither Ward (Withering only, last, ≥1).
               Inputs: damage, type, category, AP, spell, location, PROT roll, natural toggles. No "what hit you"
Head           `location` is an input (and a helmet's Headshot Defense redirects head → torso), but nothing doubles a head hit.
               0530 Called Shot: "Head — double damage … the damage doubles and goes straight to Health Levels"
GM mode        encounter rows go through resolveHit/applyHit (engine ~7367–7510), a PC row on the character itself
```

---

## 1. Goal

When P20b is merged:

1. **Terminal Disease holds you at Pain Level 1 or more.** Unhurt: Pain 1, with "Terminal Disease" in the sources. Two Health Levels lost: one more than the band gives, up to 3.
2. **Pain Tolerance takes it off.** Rank 1 with Terminal Disease, unhurt: Pain 0. Rank 2 at band 3: Pain 1. The check's Pain penalty, the Essence and Breaker penalties and every Pain display follow, and the Pain card names what's ignored ("−1 Pain Tolerance").
3. **Rest heals faster.** Rapid Healing rank 2: the Rest panel proposes BOD × 3 a day, ×6 with Speed Heal (PQ5). It says why ("×3 Rapid Healing"). Focused Healing and a Nanomed Kit are unchanged.
4. **Take a hit asks what hit you, when it matters.** A character holding Scrapper or Giant sees "Melee or Martial Arts" on the form. Ticked: Giant takes 4 off what gets through, then Scrapper halves it (never below 1), each named in the result. Unticked, or neither held: the hit resolves as today.
5. **A head hit follows the book, and Thick Skull answers it** (PQ9, Ken). An unredirected Head hit doubles (Regular only). With Thick Skull it doesn't, and the result says so.
6. **The tags follow.** Terminal Disease's Pain, Pain Tolerance, Rapid Healing, Scrapper, Giant's −4 and Thick Skull become computed rows.
7. **Nothing else moves**, except PQ9's head doubling if Ken takes the default: a character holding none of these computes byte for byte what it does on `main`.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** New computed `grants` types, an extension of Decision 213, a new Take a hit input and stage, and (PQ9) a book rule Take a hit didn't apply. One numbered decision, **N**, superseding 213 in part (unconditional Pain).
- **Game data: bump** (`0.42` → `0.43` after P20a, or `0.41` → `0.42` if this lands first; Decision 68).
- **App: minor** (`0.51.0` after P20a, else `0.50.0`).
- **Character schema: no bump.** Nothing new is saved; the "what hit you" box lives in the form, as `location` does.
- **No flag** unless Ken sends PQ9 to Deighton.

## 3. Questions for Ken

| Id | Question | Default |
|---|---|---|
| PQ1 | **The order of Pain's terms and the clamp.** | **Band + Conditions + Aberrations + Terminal Disease, then Pain Sensitive (213), clamp to 3, then Pain Tolerance, floor 0.** So at band 3 with Terminal Disease, Pain Tolerance 1 reads 2 (the table's 3 is what you'd feel, and you ignore one). *Alternative:* subtract before the clamp (band 3 + 1 − 1 = 3). |
| PQ2 | **Does Terminal Disease count as "hurt" for Pain Sensitive?** (213 applies it only once Pain is ≥1.) | **Yes:** "always at Pain Level 1" is Pain. Unhurt with both reads 2. *Alternative:* only Health Levels, Conditions and Aberrations count. |
| PQ3 | **What Pain Tolerance ignores.** | **Any Pain**, from Health Levels, Conditions (Agonized), Aberrations or traits. The book says "Ignore 1 level of Pain per rank". *Alternative:* only Health Levels' Pain. |
| PQ4 | **Pain Immunity (a Vampire) with Terminal Disease.** | **It adds:** Pain Immunity narrows which Health Levels count (202), and the disease isn't Health Levels. *Alternative:* Pain Immunity cancels it. |
| PQ5 | **Rapid Healing with Speed Heal:** "stacks". | **The multipliers multiply:** rank 1 with Speed Heal is ×4. *Alternative:* they add (×2 and ×2 make ×3, one extra each). |
| PQ6 | **Fast Metabolism** (Cascade Aberration, "heal twice as fast from rest"). | **In:** an Aberration field `naturalHealingTimes: 2`, read by `naturalHealing` as `painLevels` is (Decision 110's pattern), multiplying with the rest (PQ5). Its "recover from conditions more quickly" and toxins lines stay text. *Alternative:* leave it for P21. |
| PQ7 | **Where Giant's −4 and Scrapper's halving go in the hit.** Giant: "Incoming … damage you receive is reduced by 4"; Scrapper: "Damage taken … is halved". | **After armor and Natural Armor, on what gets through, and before Wither Ward** (223, which stays last): Giant's −4 first, then Scrapper halves, never below 1 if anything got through. *Alternative:* before armor ("incoming"), which makes Giant worth 4 PROT. |
| PQ8 | **Which hits they answer.** | **Regular and Withering**, not Massive (which takes Health Levels outright, Decision 219). *Alternative:* Regular only. |
| PQ9 | **The head hit.** Take a hit lets you pick Head but never doubles it; `0530` doubles an unhelmeted head. Thick Skull ignores "bonus damage from normal attacks hitting the head". | **Take a hit doubles an unredirected Head hit** (Regular only, after Resistance, before armor, since no body armor covers a head), the book's rule, and Thick Skull skips the doubling. "Damage added from an exploded roll still applies" needs nothing: the entered damage already holds it. **This is the one change a character holding nothing sees**, named in the CHANGELOG. *Alternative:* the player doubles it as today, and Thick Skull is a line on the form when Head is picked. |
| PQ10 | **"Melee or Martial Arts" on the form.** | **Shown only when a held trait reads it** (Scrapper or Giant today), so the form doesn't grow for everyone. The same box on a PC row in GM mode's encounter hit. *Alternative:* always shown (P21's power reductions may want it). |

## 3a. The decision, drafted

```
N. **Pain, rest and Take a hit read the traits that change them: Terminal Disease adds Pain, Pain Tolerance ignores it, Rapid Healing multiplies rest, and Scrapper, Giant and Thick Skull answer a hit.**
     *2026-10-1x · Ken + Claude · Touches: painState, painLevel grant, onlyIfHurt, painIgnore, fromTraits, painSources, naturalHealing, Rest, Speed Heal, healTimes, naturalHealingTimes, resolveHit, hit.melee, meleeTaken, head doubling, Headshot Defense, Thick Skull, Terminal Disease, Pain Tolerance, Rapid Healing, Fast Metabolism, Scrapper, Giant, Take a hit, GM encounter hit*
     - **Decided:** `painLevel` with `onlyIfHurt: false` adds always; `painIgnore` ({ perRank }) comes off after the clamp, floor 0. `healTimes` ({ byRank }) and an Aberration's `naturalHealingTimes` multiply rest with Speed Heal. Take a hit takes `melee` when a held trait reads it; `meleeTaken` rows ({ minus } or { halve, floor }) apply after Natural Armor and before Wither Ward, Giant's before Scrapper's. A Head hit not redirected doubles (Regular), unless Thick Skull. 
     - **Why:** The sign-off, unanimous, and Deighton's Scrapper text; 213's own Revisit if.
     - **Rejected:** Pain Tolerance before the clamp; only Health Levels counting as hurt; Pain Tolerance ignoring only Health Levels' Pain; Pain Immunity cancelling Terminal Disease; Speed Heal and Rapid Healing adding; Giant and Scrapper before armor; the melee stage on Massive; leaving the head's doubling to the player; the melee box always shown.
     - **Replaces:** Decision 213 in part (an unconditional Pain shift). Decision 231 in part (these entries' effects become computed rows). Extends 99 and 223 (a stage after Natural Armor) and 220 (rest's proposal).
     - **Revisit if:** P21 adds power reductions to the same stage; Deighton rules the head differently.
     - **Built:** app 0.5x.0, game data 0.4x, no schema bump, PR #…. Log 2026-10-1x (P20b).
```

## 4. Read first

`CLAUDE.md`. `SCHEMA.md` §4: Decisions 96, 99, 104, 110, 202, 213, 219, 220, 223, 231. `engine.js`: `painState` (~1047), `grants()` (~165, the `painLevel` branch), `naturalHealing` (~2057), `resolveHit` and its stages (~1243–1420), Wither Ward's step, the encounter row's hit (~7367–7510). `sheet.js`: the Take a hit form (~970–1060), the Rest panel (~1115–1180), the Pain card. `gm.js`: the encounter hit form (~1987). **The CRB:** `0430` (Pain Tolerance, Rapid Healing, Scrapper, Thick Skull), `0440` (Giant, Terminal Disease), `0530` (Called Shot's head; Natural Armor), `0540`/`0550` (Pain, natural healing).

## 5. What this changes underneath (the sweep)

| Today | Where | After P20b |
|---|---|---|
| `painState`: band + Conditions + Aberrations, clamp, + 213's shift (only at ≥1), clamp | `engine.js` ~1047 | + `onlyIfHurt: false` shifts with the base (PQ2), clamp, − `painIgnore` (PQ1, PQ3), floor 0. Reports `fromTraits` (signed) and `ignored`, and names each source. |
| `grants()` sums `painLevel` only for `onlyIfHurt: true` | ~186 | Sums both kinds separately (`painLevelAlways`, `painLevel`), and `painIgnore`. |
| The check's Pain, Essence and Breaker penalties | ~891, painState's return | Follow on their own. Pin: Terminal Disease, unhurt, puts −1 on every Skill check; Pain Tolerance 1 removes it. |
| GM mode NPC Pain (`engine` ~7517) | ~7517–7553 | A stand-in holds no traits: **unchanged**. A PC row reads the character: follows. |
| `naturalHealing` returns `perDay` and `speedHealMultiplier` | ~2057 | Also `times: [{ name, x }]` from `healTimes` and Aberrations' `naturalHealingTimes`. The Rest panel's proposal is BOD × days × each `x` × Speed Heal's (PQ5), and says each. |
| The Rest panel multiplies by Speed Heal | `sheet.js` ~1124 | Reads `times` too. Focused and Nanomed: unchanged. |
| `resolveHit` stages end with Wither Ward | ~1363 | + **head doubling** (PQ9: after Resistance, before armor; a `doubled` field; skipped when redirected, not Regular, or Thick Skull) and a **`meleeTaken`** stage after Natural Armor, before Wither Ward (PQ7, PQ8), reporting each reduction `{ name, from, to }`. The result's `through` is after both. |
| `hit` has no "what hit you" | the form, `hitInput` | `melee: boolean`, shown only when `Engine.hitAsks(ch)` says a held trait reads it (PQ10). Read by `resolveHit`; never saved. |
| GM mode's encounter hit (`gm.js` ~1987, `engine` ~7470) | gm.js, engine | Passes `melee` through for a PC row; the box shows on a PC row by the same `hitAsks`. An NPC stand-in: no traits, so no box, but **PQ9's doubling applies to it too** (it's the book's rule for anyone). |
| `effectTagsFor` | ~240 | Fills `painLevel` (both kinds), `painIgnore`, `healTimes`, `meleeTaken`, `headBonus` (Thick Skull), held and unheld. |

## 6. The shapes

```
{ "type": "painLevel", "amount": 1, "onlyIfHurt": false }             // Terminal Disease
{ "type": "painIgnore", "perRank": 1 }                                // Pain Tolerance
{ "type": "healTimes", "byRank": [2, 3, 4] }                          // Rapid Healing
{ "type": "meleeTaken", "minus": 4 }                                  // Giant
{ "type": "meleeTaken", "halve": true, "floor": 1 }                   // Scrapper
{ "type": "headBonus", "ignore": true }                               // Thick Skull
aberrations[].naturalHealingTimes: 2                                  // Fast Metabolism (PQ6)
```
Engine additions, total: `painState(ch).ignored`, `naturalHealing(ch).times`, `Engine.hitAsks(ch)` → `{ melee: bool }`, `resolveHit(...).doubled` and `.taken` (`[{ name, from, to }]`).

**Templates** (drafted, **marked for a voice pass**):
```
effectTags:  painLevelAlways "Always at least Pain Level {amount}" · painIgnore "Ignore {perRank} Pain Level a rank"
             healTimes "Rest heals ×{v}" · meleeTaken (minus) "Melee and Martial Arts damage to you −{minus}"
             meleeTaken (halve) "Melee and Martial Arts damage to you halved (never below {floor})" · headBonus "A hit to your head doesn't double"
effectTagsHeld: painIgnore "Ignore {total} Pain Level{s}"
appCopy:     hitMelee "Melee or Martial Arts" · hitDoubled "Head: ×2" · hitThickSkull "Head: not doubled (Thick Skull)"
```

## 7. Out of scope

- **P20a's areas.** **P21's power reductions** (listed in the scope). **Heroic Conditioning** (which checks are "physical activity" is a question; P21). **Hemophiliac's bleeding** (W130's proposal). **Giant's Easy Target and grappling** (rule rows).
- **A limb's Called Shot** (Injured) and any other Called Shot effect beyond the head's doubling.
- **Rapid Healing in combat**, and Fast Metabolism's other lines.

## 8. The entries

| Entry | Becomes | Stays a rule row |
|---|---|---|
| Terminal Disease | `painLevel` 1, `onlyIfHurt: false` | Essence TN +1; death in 5 + 1d4 months |
| Pain Tolerance | `painIgnore` perRank 1 | — |
| Rapid Healing | `healTimes` [2, 3, 4] | "out of combat" is the Rest panel's own condition |
| Fast Metabolism (Aberration) | `naturalHealingTimes: 2` (PQ6) | conditions and toxins |
| Scrapper | `meleeTaken` halve, floor 1 | — |
| Giant | `meleeTaken` minus 4 | Easy Target, grappling, height; P20a's caps |
| Thick Skull | `headBonus` (PQ9) | the explosion line, if PQ9's alternative |

## 9. The UI

- **Pain card and vitals:** the level, with "Terminal Disease" among the sources and "−1 Pain Tolerance" when it ignores any.
- **Rest panel:** "BOD 6 × 3 (Rapid Healing) × 2 (Speed Heal) = 36 a day".
- **Take a hit:** the "Melee or Martial Arts" box (PQ10) beside *Where*; the result names "Head ×2", "Giant −4: 9 → 5", "Scrapper: 5 → 2". Same in GM mode's PC rows.
- **No new control** outside the box.

## 10. Worked examples, as named tests (write first; run on `main`)

| Name | File | Setup → result |
|---|---|---|
| `P20b 1: Terminal Disease adds Pain, always` | rules | Unhurt: Pain 1, source named, every Skill check −1. Band 2: 3. Band 3: 3. With Pain Sensitive, unhurt: 2 (PQ2). Pain Immunity: still 1 (PQ4). None held: `painState` equals `main`'s for a ladder of HL lost. **On `main`: fails.** |
| `P20b 2: Pain Tolerance ignores Pain after the clamp` | rules | Rank 1 + Terminal Disease, unhurt: 0. Rank 2 at band 3: 1 (PQ1). Agonized only, rank 1: 0 (PQ3). Never below 0. **On `main`: fails.** |
| `P20b 3: rest heals by every multiplier` | rules + smoke-sheet-play | BOD 6, Rapid Healing 2, 1 day: 18; with Speed Heal: 36 (PQ5); Fast Metabolism on top: 72 (PQ6). Focused Healing: the entered HP, unchanged. |
| `P20b 4: Giant and Scrapper answer Melee and Martial Arts, after Natural Armor` | rules | 12 Regular, no armor, melee: Giant alone → 8, Scrapper alone → 6, both → 8 then 4 (PQ7). 1 through with Scrapper: 1. Not melee: unchanged. Massive: unchanged (PQ8). Withering melee: halved, then Wither Ward. |
| `P20b 5: a head hit doubles unless a helmet or Thick Skull says otherwise` | rules | 6 to Head, no helmet: 12. Motorcycle Helmet: torso, 6 into armor. Thick Skull: 6, result names it. Withering to the head: not doubled (PQ9). |
| `P20b 6: Take a hit asks what hit you only when it matters` | smoke-sheet-play + smoke-table-play | Scrapper held: the box shows, and ticking it changes `through`. Neither held: no box. A PC row in an encounter: the box shows; an NPC row: none. |
| `P20b 7: the tags are computed, held and unheld` | rules | Each §8 entry's tags; Pain Tolerance held at 2: "Ignore 2 Pain Levels"; P18 4 passes. |
| `P20b 8: the readers are total over hostile rows` | engine | `perRank` "1", `byRank` short or holding text, `minus` NaN, `halve` "yes", a hit with `melee: "true"`: nothing throws; bad rows are skipped. |

## 11. Tests beyond the examples

- **Totality:** P20b 8, plus the guards over `painState`, `resolveHit`, the encounter hit.
- **Voice:** the templates and `appCopy` keys pass `voice.test.mjs`.
- **Phone width:** the Take a hit form with the box at 320px (`phone-check`).
- **Dev preview:** Take a hit with Scrapper and Giant, a head hit, and the Rest panel with Rapid Healing. Screenshot or measure in the PR.

## 12. Mutants, each of which must fail a test

1. Terminal Disease's shift left `onlyIfHurt` (P20b 1, unhurt).
2. Pain Tolerance before the clamp (P20b 2, band 3).
3. Pain Tolerance below 0 (P20b 2).
4. Speed Heal and Rapid Healing added, not multiplied (P20b 3).
5. Scrapper before Giant (P20b 4, both held).
6. Scrapper's floor dropped (P20b 4, 1 through).
7. The melee stage on Massive (P20b 4).
8. The head doubled after a helmet's redirect (P20b 5).
9. Thick Skull ignored (P20b 5).
10. The box shown with neither trait (P20b 6).

## 13. Steps

1. Read §4; confirm each §5 row; check §8 against the book. `npm run test:fast`.
2. Write §10's tests; run on `main`; keep the output.
3. Data, then engine (`painState`, `naturalHealing`, `resolveHit`, the encounter hit), then UI. `npm run verify` after each.
4. The dev preview, `npm run phone-check`, mutants, close-out (§15).

## 14. Stop and ask

- **A ruled sentence would change meaning** in a template.
- **A computed value moves for a character holding none of §8's entries**, other than PQ9's head doubling (if taken).
- **Anything saved in the character.**
- **An existing test fails** other than these expected breaks: tests reading a §8 entry's rule line (grep the seven ids), and any test that hits a Head and expects undoubled damage (PQ9: name each in the PR). Decision 213's own tests (Pain Sensitive) must pass unchanged.

## 15. Close-out and review checklist

**Close-out** (the close-the-session skill, *Rule or shape*): Decision **N**, its INDEX line, 213 and 231 marked superseded in part; SCHEMA §2 gains the types, the Aberration field, the hit's `melee` and the result's `doubled`/`taken`; STATE rewritten; data and app bumps; CHANGELOG, then `npm run changelog`; the plan's row, `shipped.md`, `log/2026.md`. PR title: `P20b: Numbers in play (Decision N, app 0.5x.0, data 0.4x)`.

Suggested CHANGELOG lines (player voice):
- **Terminal Disease keeps you in pain, and Pain Tolerance lets you ignore it.**
- **Rapid Healing speeds up your rest,** and stacks with Speed Heal.
- **Take a hit knows a Melee or Martial Arts hit** when you're a Scrapper or a Giant, and takes your trait off it.
- **A hit to the head doubles, as the book says,** unless your helmet or your Thick Skull says otherwise.

**Review checklist:** §10's tests run on `main` (1 and 2 fail there); §5 confirmed; §8 against the book; PQ1–PQ10 in the decision's Rejected; mutants 1–10; phone-check and the dev preview; `npm run verify` green.

## 16. Handing it over

The README's two prompts, with `<order>` = `sheet-wishlist/P20b-numbers-in-play.md` and `<id>` = **P20b**, and these traps:

> 1. **Pain Tolerance comes off after the clamp**, and never below 0.
> 2. **Terminal Disease is 213's `onlyIfHurt: false`**, not a new type. 213 left the room for it.
> 3. **Giant's −4 and Scrapper's halving go after Natural Armor and before Wither Ward**, Giant's first, and only on Regular and Withering.
> 4. **The head doubles only when it isn't redirected**, only on Regular, and never with Thick Skull. An NPC stand-in doubles too.
> 5. **The "Melee or Martial Arts" box is form state**, never saved, and shown only when a held trait reads it.
>
> Tier: **Rule or shape**. One decision, a data bump, an app minor, no schema bump.
