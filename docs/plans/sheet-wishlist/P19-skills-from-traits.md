# Work order P19: Skills learn from traits

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3, row P19. **Source:** the effects sign-off, [`../../reference/rulings-2026-10-16.md`](../../reference/rulings-2026-10-16.md) (*A Skill's check*, unanimous; *Take X: choose first*; *Light levels*). Decisions 96, 156, 229, 231, 232.

**Scope.** The Advantages and Disadvantages that change a Skill's check stop being table rules and show on the Skill's row:
- **the number:** Ghost Step +3 on Stealth, Defect/Flaw −2 on each Skill it names. These go into the check, so every reader of it follows: the row, attacks, a maneuver's check, print;
- **kicker dice:** Field Medic +1d4 on Medical, Hyper Vigilance +1d4 on Combat Sense. The row reads "1d10 + 7 + 1d4", the sign-off's own example;
- **Take X, as an exact total, chosen first:** "Take 6: 13". Deighton: "they need to choose FIRST". The holders are Common Sense, Lightning Calculator, Machindo, Sense of Direction and Aura Sight; a conditional one carries its "when";
- **the die faces:** fails on a natural 2 or 3 (Distractable, Social Stigma, Gullible, Blood Lust) and explodes on a natural 9 or 10 (Refined Skill), each marked on the Skills it touches, a conditional one with its "when";
- **Night Vision:** the light levels it cancels, named from the book (Bright, Dim −1, Dark −3, Blind −5, `0530`).
- **A rider, not about Skills: the Expert mode toggle shows on every step of character creation** (Ken, 2026-10-17). Today it appears only on the three steps it folds, and Ken found the coming and going confusing. It rides here because it's tomorrow's session, not because it touches P19's Skills (§1.8, PQ9, Decision **N+1**).

**Status:** **drafted 2026-10-16 by Claude (Opus)**, P13's reviewer. Pre-flighted against `main` at `1803b4d` (#211 merged; live site v0.48.0; app 0.48.1 unreleased). **Questions PQ1–PQ8 below are open.** None blocks the shape; each has a default.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md) (*The cadence*). Ken starts **P19 build** (Sonnet), then a fresh reviewer (Opus) once the PR is open.

**Carried over from P13's review:**
- **The order's miss:** P13's sweep grepped `src/ui` for where Advantages are *read* and missed Redeemed, whose options are built in the engine. **Applied here:** §5 sweeps the readers of `skillLine().checkBonus` across `src/engine`, `src/ui` and `tools`, not just the Skills tab.
- **The wrong assumption:** P13's §4 said `.selected` marks a held pick, and a natural-only Advantage broke it. **Applied here:** every test that holds one of these entries also holds one with **ranks summed over a natural and a bought row**, or one taken from a **pick**, wherever the data allows it.

**Pre-flight against `main`** (`1803b4d`; engine read, data dumped with node):

```
Rows that become computed   16 entries (§8's table). Each loses its rule row, or the part of it that P19 computes.
                            What stays is a rule row: Lightning Calculator's "+1 to whoever you help",
                            Refined Skill's Combat Cunning exclusion, Blood Lust's Sanity Check
Stealth with Ghost Step     the Skills tab reads the same with or without it (the sign-off's probe: 15 → 15)
checkBonus readers          about 25 call sites: the Skills tab and Main's Combat table (skillRowPair), weapon attacks
                            (formView, weaponView, 3570), maneuver checks (Decision 229, engine ~4656), print
                            (two), IP Skills list, the wizard's Skills step. GM mode reads none (grep gm.js)
Take X in the book          0300: "treat the d10 result as X ... cannot explode and cannot botch. You can always
                            choose to roll instead." So the total is X + the check's modifiers
Light levels in the book    0530 Visibility: attacks Dim −1, Dark −3, Blind −5; Stealth +1/+3/+5. No number for
                            Awareness. Not in the data
Overlaps today              no Skill holds two kickers; no Skill holds a kicker and a Take X; Basic Tech can hold
                            three Take X (Common Sense, Lightning Calculator, Machindo)
```

---

## 1. Goal

When P19 is merged:

1. **The check counts what a trait does to it.** Ghost Step held: Stealth's check is 3 higher everywhere the check shows. Defect/Flaw ×2 on Handguns and Dodge: both are 2 lower, and so is a Handguns weapon's attack (§3, PQ2). The Skills tab's breakdown names each one ("+3 Ghost Step", "−2 Defect/Flaw").
2. **A kicker shows on the row.** Field Medic held: Medical reads "1d10 + N + 1d4". Hyper Vigilance does the same on Combat Sense, in the Skills tab and Main's Combat table. Print reads "1d10+N+1d4".
3. **Take X is a total.** Common Sense on Investigation: the row shows **"Take 6: 13"** with "choose before you roll" (Deighton's ruling), where 13 = 6 + the check's bonus, Pain and Conditions included. A conditional one says when: Lightning Calculator's "not in combat", Machindo's "with technology", Sense of Direction's "to navigate", Aura Sight's "when you can see their aura". Several on one Skill each show.
4. **The die faces are marked.** Distractable: Awareness and Combat Sense read "fails on a natural 2 or 3 (a 1 still botches)". Social Stigma does the same on Persuasion. Gullible's mark adds "spotting a lie, unless it's preposterous", and Blood Lust's adds "after you fail first blood's Sanity Check, for the encounter". Refined Skill on its chosen Skill: "explodes on a natural 9 or 10".
5. **Night Vision names what it cancels.** Awareness: "no Dim or Dark penalty on visual checks". Main's attacks: "Dim −1 and Dark −3 don't apply to your attacks". The numbers come from a new `visibility` table, `0530`'s.
6. **The CP step and the Character tab follow.** These rows are computed now, so their tags are chips written from the numbers (Decision 231's mechanism, with 232's held reading). Defect/Flaw held on Handguns reads "−2 on checks with Handguns".
7. **Nothing else moves.** An entry P19 doesn't name reads exactly as today. A character holding none of them computes byte for byte what it does on `main`.
8. **The Expert mode toggle is always in the wizard's header** (the rider). It's beside Home on all eight steps, Review included, pressed per `shadows.ui.expert`, and still absent on Home, the sheet and GM mode. Its tooltip says what it folds and where: "Folds the reading on the Archetype, Skills and Character Points steps. Tap ? to read one." (PQ9). On a step it doesn't fold, a press changes the setting and the button's pressed state, and nothing else moves. The first-sight hint (`expertHintHtml`) still shows only on the three steps it describes.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** It adds computed `grants` types and a data table, changes `skillLine`'s return, and moves 16 entries from table rule to computed. One numbered decision, **N** (the next free number on `origin/main` when built), extending 96 and 229 and superseding 231 in part. Propose-before-build is §3.
- **Game data: bump** `0.40` → `0.41` (Decision 68): a character holding Ghost Step or Defect/Flaw computes a different check.
- **App: minor**, `npm run bump -- 0.49.0` (0.48.1 is unreleased; the bump moves its heading and keeps the Stats line under it). If 0.48.1 has been released by then, it's still `0.49.0`.
- **Character schema: no bump.** Nothing new is saved. Picks are already stored.
- **No flag.** Ken's kicker-stacking question is unanswered and unreachable with today's data (PQ6).
- **The rider is its own decision, N+1.** It reverses P13's PQ4 answer ("shown on the steps it changes"). Decision 232 doesn't record where the toggle shows, so nothing is superseded, but it's a player-facing choice Ken made the other way once, so it's numbered (`CLAUDE.md`, *Decisions*). It adds no version of its own: it ships in 0.49.0.

## 3. Questions for Ken

| Id | Question | Default |
|---|---|---|
| PQ1 | **A conditional number** (Dwarf: "+3 to Stealth when hiding"): in the check, or a mark? | **A mark**, "+3 when hiding (Dwarf)", never in the total. The total is what every roll gets. *Alternative:* in the total with a footnote, which is wrong on every roll that isn't hiding. |
| PQ2 | **Defect/Flaw on an attack Skill** (Handguns, Melee, Martial Arts): does the −2 reach the weapon's attack and a maneuver's check? | **Yes: it's the Skill's check**, and the attack and maneuver checks read it (Decision 229). *Alternative:* the Skills tab only, which makes the attack row disagree with the Skill row. |
| PQ3 | **Print** (the front page is full, Decision 96). | The number changes with it, and a kicker is appended ("1d10+7+1d4"). **Take X and the marks aren't printed**: a fourth line per Skill breaks the page. *Alternative:* a "Traits on your checks" box on page 2. A W if wanted. |
| PQ4 | **The wizard's Skills step** shows "+N" per Skill. | **The number follows** (it's `checkBonus`), and **no marks, kickers or Take X** in the wizard; the sheet shows them. *Alternative:* a chip per mark, on a step P13 just folded. |
| PQ5 | **Where Night Vision shows.** | On Awareness's row, and once under **Main's attacks table**. Not on each weapon. *Alternative:* a chip on every weapon row. |
| PQ6 | **Two kickers on one Skill** (Ken: "Does kicker dice stack? if they do, does it move to the next die size up?"). Nobody answered, and no Skill can hold two today. | **Show each** ("+ 1d4 + 1d4"), as each entry says, with no flag, since nothing reaches it. The decision's *Revisit if* names it. *Alternative:* open an F-number now. |
| PQ7 | **Hallucinations** ("Awareness and Combat Sense checks fail" while hallucinating) and **Favored Skill's re-roll**: marks too? | **No: they stay rule rows.** A Skill that always fails while a state lasts, and a once-per-encounter re-roll, aren't a face of the die or a number. *Alternative:* marks with their "when". |
| PQ8 | **Several Take X on one Skill** (Basic Tech: Common Sense, Lightning Calculator, Machindo). | **Each shows**, the unconditional one first, each with its source. They all read "Take 6: N", but their whens differ. *Alternative:* one "Take 6: N" with every source named, which hides the conditions. |
| PQ9 | **The toggle's tooltip** once it shows on steps it doesn't fold (a press on Stats changes nothing you can see). | **Name the steps:** `appCopy.expertTitle`, "Folds the reading on the Archetype, Skills and Character Points steps. Tap ? to read one." It's the button's `title`, marked for a voice pass. `aria-label` stays "Expert mode". *Alternative:* keep today's `expertHint` as the title, which doesn't say where it works. |

## 3a. The decision, drafted

```
N. **A trait that changes a Skill's check shows on its row: a number in the check, a kicker beside it, a Take X as its total, and a die-face rule as a mark.**
     *2026-10-1x · Ken + Claude · Touches: skillLine, checkBonus, breakdown.traits, kickers, takeX, marks, grants checkMod, kicker, takeX, failOn, explodeOn, visibility, effectTags, visibility table, Skills tab, Main's Combat table, attacks, maneuver check, print, Ghost Step, Defect/Flaw, Dwarf, Field Medic, Hyper Vigilance, Common Sense, Lightning Calculator, Machindo, Sense of Direction, Aura Sight, Distractable, Social Stigma, Gullible, Blood Lust, Refined Skill, Night Vision*
     - **Decided:** `checkMod`, `kicker`, `takeX`, `failOn`, `explodeOn` and `visibility` are computed `grants` types; a row names its Skills (`skills`) or a pick (`skillsFromPick`). An unconditional `checkMod` adds to `skillLine().checkBonus`, so every reader of the check follows. A `whenText` makes any row a mark, never a number. Take X shows as X + the check, to choose before rolling (Deighton). Night Vision names the light levels `0530` sets.
     - **Why:** The sign-off, unanimous: "put them all on the Skill rows". A number the sheet shows and doesn't apply is the drift Decision 231 exists to end, and Take X is only useful as the number you'd get.
     - **Rejected:** a conditional bonus in the total (wrong on every other roll); the −2 on the Skills tab only (the attack row would disagree with the Skill); Take X as the bare "Take 6" (the player does the sum the sheet can do); marks on the printed page (the front page is full, 96).
     - **Replaces:** Decision 231 in part (these 16 entries' effects are computed rows; `effectTags` gains their templates). Extends 96 (a trait's number joins Pain and Conditions in the check) and 229 (a maneuver's check includes it).
     - **Revisit if:** a Skill can hold two kickers (Ken's stacking question, unanswered); a Take X and a kicker meet on one Skill; the book gives Awareness a light penalty.
     - **Built:** app 0.49.0, game data 0.41, no schema bump, PR #…. Log 2026-10-1x (P19).
```

```
N+1. **The Expert mode toggle shows on every step of character creation, not only the three it folds.**
     *2026-10-1x · Ken + Claude · Touches: Expert mode, renderTopChrome, expertStep, wizard header, expertTitle, P13 PQ4*
     - **Decided:** The wizard's header carries the Expert mode toggle beside Home on every step, Review included. Its tooltip names the Archetype, Skills and Character Points steps, the ones it folds. The first-sight hint still shows only on those three. Off the wizard (Home, the sheet, GM mode) there is no toggle.
     - **Why:** Ken: a button that appears only once it can affect something reads as the header changing under you. A setting that stays put is easier to find and trust.
     - **Rejected:** P13's PQ4 answer, the toggle only on the steps it changes (the coming and going confused Ken); a toggle that's present but disabled elsewhere (it looks broken, and the setting is still worth changing ahead of the step).
     - **Replaces:** nothing. Decision 232 doesn't record where the toggle shows; P13's PQ4 answer did, and this reverses it.
     - **Revisit if:** players press it on Stats and expect something to change, or Expert mode reaches a fourth step.
     - **Built:** app 0.49.0, with P19, PR #…. Log 2026-10-1x (P19).
```

## 4. Read first

`CLAUDE.md` (constraints 5, 7, 8; *Decisions*; *Watch for mechanical drift*). `SCHEMA.md` §4: Decisions 96, 156, 229, 231, 232 (INDEX §3 finds them). `engine.js`: `skillLine` (~757), `effectTagsFor` and `fillTag` (~212–290), `picksFor`, `grants()` (~165). `sheet.js`: `skillRowPair` (~318), `skillTableHtml`, the print skill cells (~2535, ~2670). The rulings page's *A Skill's check*, *Take X: choose first* and *Light levels*. **The CRB, before writing any template:** `0300` (*Kicker Die*, *Take X*), `0530` (*Visibility*), and `0430`/`0440` for each entry in §8.

## 5. What this changes underneath (the sweep)

Answered by grepping readers (`skillLine(`, `.checkBonus`, `effectTagsFor`, `grants` types). **Check each row before you build**, and say in the PR if one is wrong.

| Today | Where | After P19 |
|---|---|---|
| `skillLine(ch,id)` returns `checkBonus` = base + Pain + Conditions + form penalty, with `breakdown` | `engine.js` ~757 | Adds `breakdown.traits` (sum) and `breakdown.traitParts` `[{name, amount}]` from unconditional `checkMod` rows, included in `checkBonus`. Adds `kickers`, `takeX` and `marks` (§6). An orphaned skill id still returns its stub, with empty lists. |
| Weapon attack = the weapon skill's `checkBonus` | `formView` ~449, ~1599, ~3570 | Follows on its own (PQ2). Pin it: Defect/Flaw on Handguns lowers a pistol's attack by 2. |
| A maneuver's check = `checkBonus` + the style's bonus (Decision 229) | `engine.js` ~4656 | Follows on its own. Pin it with Defect/Flaw on Martial Arts. |
| `ipCost` / Training / Minor choices read `skillLine().rank` only | ~2269, ~2603, ~2669, ~2786, ~2817 | **Unchanged.** Rank never includes a trait. |
| Skills tab and Main's Combat table: `skillRowPair` prints "1d10 + N", breakdown "rank · stats · pain · conditions" | `sheet.js` ~318–336 | "1d10 + N" + each kicker; breakdown adds each `traitParts` entry; the Take X lines and marks under the name, beside the existing chips (§9). |
| Print: "1d10+N" in two places | `sheet.js` ~2535, ~2670 | + each kicker (PQ3). Nothing else. |
| IP Skills list: "rank R · check +N" | `sheet.js` ~2933 | Follows on its own. |
| Wizard Skills step: "+N" | `wizard.js` ~530 | Follows on its own; no marks (PQ4). |
| `effectTagsFor` fills computed rows for 6 types; others are rule rows | `engine.js` ~240 | Fills the 6 new types (§6), held and unheld; `skillsFromPick` reads the held picks via `heldRow`'s selections. |
| `effectTags` / `effectTagsHeld` | `shadows-data.js` ~1080 | Gain the new types' templates (§6). The data-key guard accepts them because `effectTagsFor` reads them. |
| No light levels in the data | — | `visibility`: `0530`'s four, read by Night Vision's `visibility` row. |
| P18 tests pin some of these as rule rows: `rules` ~2029 (Common Sense's held "Take 6 on Investigation."), ~229 and ~279 (lists including Defect/Flaw and Refined Skill), and the two **P18 6** tests (Common Sense in their fixtures) | `tests/` | **Expected breaks** (§13): each moves to the computed reading in the same change, named in the PR. **P18 4** (rule rows compute nothing) must still pass unchanged. |
| GM mode | `gm.js` | Reads no `skillLine` (grep). Unchanged. |
| **The rider.** `renderTopChrome`'s wizard branch draws the toggle only when `expertStep()` | `app.js` ~57 | It draws it on every wizard step. `expertStep()` keeps its other reader, `expertHintHtml` (`shared.js` ~689), unchanged. The button's `title` reads `copy("expertTitle")` (PQ9). |
| `phone-check` measures the wizard header with both buttons on Archetype, Skills and CP (P13), and with Home alone on Stats (P4) | `tools/phone-check.mjs` | Both buttons now show on every step. The Stats row's header measurement now has two buttons, and must hold its height at 320px. |
| P13 6 asserts the toggle is present on three steps and absent on the rest | `smoke-wizard` ~1179 | **An expected break** (§14). It now asserts present on all eight steps, and still absent on Home and the sheet. |

## 6. The shapes

**`grants` rows.** Common fields: `skills` (an array of skill ids) **or** `skillsFromPick` (a pick id on the same entry, its held choices, one Skill per rank as each pick already says), and an optional `whenText`. A row with `whenText` is a **mark**: it never changes a number.

```
{ "type": "checkMod",  "amount": 3,  "skills": ["stealth"] }                                      // Ghost Step
{ "type": "checkMod",  "amount": -2, "skillsFromPick": "skill" }                                  // Defect/Flaw
{ "type": "checkMod",  "amount": 3,  "skills": ["stealth"], "whenText": "when hiding" }           // Dwarf (PQ1)
{ "type": "kicker",    "die": "1d4", "skills": ["medical"] }                                      // Field Medic
{ "type": "takeX",     "x": 6, "skillsFromPick": "skill" }                                        // Common Sense
{ "type": "takeX",     "x": 6, "skills": ["programming","basic-tech","engineering"], "whenText": "not in combat" }
{ "type": "failOn",    "faces": [2,3], "skills": ["awareness","combat-sense"] }                   // Distractable
{ "type": "failOn",    "faces": [2,3], "skills": ["combat-sense"], "whenText": "after you fail first blood's Sanity Check, for the encounter" }
{ "type": "explodeOn", "faces": [9,10], "skillsFromPick": "skill" }                               // Refined Skill
{ "type": "visibility","ignore": ["dim","dark"], "on": ["attacks","awareness"] }                  // Night Vision
```

**`visibility`** (top level, `0530`), read by the `visibility` row and nothing else yet:
```
"visibility": [
  { "id": "bright", "name": "Bright", "attack": 0,  "stealth": 0 },
  { "id": "dim",    "name": "Dim",    "attack": -1, "stealth": 1 },
  { "id": "dark",   "name": "Dark",   "attack": -3, "stealth": 3 },
  { "id": "blind",  "name": "Blind",  "attack": -5, "stealth": 5 }
]
```
`stealth` is the book's and is read by no code yet. **Leave it out** if the data-key guard refuses it, rather than inventing a reader. Say so in the PR.

**`skillLine(ch,id)` additions** (total: bad rows, unknown skills, a missing pick, a non-finite amount and an unknown die are each skipped, never thrown):
```
breakdown.traits      number   sum of unconditional checkMod amounts on this skill
breakdown.traitParts  [{ name, amount }]           in data order; name = the entry's name
kickers               [{ die: "1d4", from: name }]
takeX                 [{ x, total: x + checkBonus, from: name, whenText: string|null }]   unconditional first (PQ8)
marks                 [{ kind: "checkMod"|"failOn"|"explodeOn"|"visibility", text, from: name, whenText }]
```
The rank that counts is the held rank, natural and bought rows summed (`heldRow`'s rule). `skillsFromPick` reads `Engine.picksFor`'s chosen values, cut to the rank, so the row never names a pick the picker lacks (P18's review fix). `die` is checked against `/^\d*d(4|6|8|10|12)$/`.

**Templates** (drafted, **marked for a voice pass**). Tags go in `effectTags` / `effectTagsHeld`; the Skills tab's lines go in a new `skillRowText`. A `…When` key is used when the row has `whenText`, so `fillTag` never meets an empty placeholder. `{skills}` lists the skill names; unheld with `skillsFromPick` it's `effectTags.pickedSkill` ("the Skill you choose"). `{amount}` is signed, with a true minus (−2).
```
effectTags:     checkMod "{amount} on checks with {skills}" · checkModWhen "{amount} on checks with {skills} {whenText}"
                kicker "+{die} Kicker Die on {skills} checks"
                takeX "Take {x} on {skills}; choose before you roll" · takeXWhen "Take {x} on {skills} {whenText}; choose before you roll"
                failOn "{skills} checks fail on a natural {faces} (a 1 still botches)" · failOnWhen "… {whenText} (a 1 still botches)"
                explodeOn "{skills} explodes on a natural {faces}"
                visibility "No penalty in {levels} light on {on}"
                pickedSkill "the Skill you choose"
effectTagsHeld: the same keys, read on a held card, where {skills} names the picks ("−2 on checks with Handguns, Dodge")
skillRowText:   takeX "Take {x}: {total} (choose before you roll)" · takeXWhen "Take {x}: {total} {whenText} (choose before you roll)"
                failOn "Fails on a natural {faces} (a 1 still botches)" · failOnWhen "Fails on a natural {faces} {whenText}"
                explodeOn "Explodes on a natural {faces}" · checkModWhen "{amount} {whenText}"
                visibilityAwareness "No Dim or Dark penalty on visual checks" · visibilityAttacks "{levels} don't apply to your attacks"
```
`{faces}` reads "2 or 3", "9 or 10". `{levels}` reads "Dim −1 and Dark −3", from `visibility`.

## 7. Out of scope

- **Essence checks** (Animal Ken, True Faith, Terminal Disease's TN) and **Junkyard Genius**'s device. They aren't a Skill's row, and they stay rule rows.
- **Time Sense** ("a Skill Check about time"): no named Skill, so it stays a rule row.
- **Combat Cunning** (stunts, no Skill) and **Untouchable** (one Dodge use): stay rule rows.
- **Hallucinations** and **Favored Skill**, unless Ken says otherwise (PQ7).
- **A light-level picker** on the attack panel, and Stealth's light bonus applied. Both are a W if wanted.
- **P20's areas** (SAN, Pain, stat caps, Wealthy, healing, Take a hit). **Kicker stacking** (PQ6). **Any change to a ruled sentence**: a row's words move from `ruleText` into a template, and §12 checks that they still say the same thing.

## 8. The entries

| Entry | Becomes | Stays a rule row |
|---|---|---|
| Ghost Step | `checkMod` +3 Stealth | — |
| Defect/Flaw | `checkMod` −2 `skillsFromPick: "skill"` | — (its `detail` pick still asks for the defect) |
| Dwarf | `checkMod` +3 Stealth `whenText` "when hiding" | "At most 3'6" tall." |
| Field Medic | `kicker` 1d4 Medical | "stacks with other kickers" (PQ6) |
| Hyper Vigilance | `kicker` 1d4 Combat Sense | — |
| Common Sense | `takeX` 6 `skillsFromPick` | — |
| Lightning Calculator | `takeX` 6 Programming, Basic Tech, Engineering, "not in combat" | "Anyone you help with a TECH Skill gets +1. Not in combat." |
| Machindo | `takeX` 6 Basic Tech, Engineering, Interface, Robotics, Pilot, "with technology" | — |
| Sense of Direction | `takeX` 6 Survival, "to navigate" | "Always know the cardinal directions." |
| Aura Sight | `takeX` 8 Intuition, "when you can see their aura" | — |
| Distractable | `failOn` 2,3 Awareness, Combat Sense | — |
| Social Stigma | `failOn` 2,3 Persuasion | — |
| Gullible | `failOn` 2,3 Intuition, "spotting a lie, unless it's preposterous" | — |
| Blood Lust | `failOn` 2,3 Combat Sense, "after you fail first blood's Sanity Check, for the encounter" | the Sanity Check itself (P20's SAN is separate) |
| Refined Skill | `explodeOn` 9,10 `skillsFromPick` | "Not on a Combat Cunning stunt." |
| Night Vision | `visibility` dim, dark on attacks, awareness | — |

**Check every "when" against the entry's book text** (`0430`, `0440`), not against this table. The table paraphrases, and a paraphrase is where drift happens.

## 9. The UI

- **Skills tab and Main's Combat table** (`skillRowPair`): the Check cell reads "1d10 + N" plus " + 1d4" for each kicker. The breakdown cell adds "+3 Ghost Step" / "−2 Defect/Flaw" after Conditions. Under the name, beside the existing chips (focused, +IP, training, shifted, maneuvers): one line per Take X, then one per mark, each with its source in a muted tail ("· Common Sense"). On a phone the lines wrap inside the name cell, and nothing scrolls sideways (§11).
- **Main's attacks table:** one line under it for Night Vision (PQ5).
- **CP step, Character tab, Natural Advantages, IP lists, Talented/Redeemed:** `effectsHtml` as now. The new rows are chips because they're computed.
- **Print:** the kicker joins "1d10+N" (PQ3).
- **No new control.** Nothing here is pressed, so there's no *where things land* table.

## 10. Worked examples, as named tests (write first; run on `main` and keep the output)

| Name | File | Setup → result |
|---|---|---|
| `P19 1: Ghost Step and Defect/Flaw are in the check, everywhere it's read` | rules | Ghost Step: Stealth's `checkBonus` +3, `traitParts` names it. Defect/Flaw ×2 on Handguns and Dodge: each −2; a pistol's attack −2; a Martial Arts maneuver check −2 with Defect/Flaw on Martial Arts. With neither held, every value equals `main`'s. **On `main`: fails.** |
| `P19 2: a kicker is on its Skill's row, never in the number` | rules + smoke-sheet-skills | Field Medic: Medical's `kickers` = `[{die:"1d4"}]`, `checkBonus` unchanged; the row reads "1d10 + N + 1d4"; Combat Sense the same with Hyper Vigilance; print's cell "1d10+N+1d4". |
| `P19 3: Take X shows its total, choose-first, with its when` | rules + smoke-sheet-skills | Common Sense on Investigation: `takeX[0].total` = 6 + `checkBonus`, and the row reads "Take 6: 13 (choose before you roll)" for the fixture's 7. With a Pain penalty the total drops with it. Basic Tech holding Common Sense, Lightning Calculator and Machindo: three lines, the unconditional first. **Common Sense with ranks on a natural row and a bought row** isn't reachable (it isn't in the pool), so use two ranks with two picks. |
| `P19 4: the die faces are marked on the Skills they touch` | rules + smoke-sheet-skills | Distractable: Awareness and Combat Sense each carry a `failOn` mark, and nothing else does. Gullible's carries its `whenText`. Refined Skill ×2 on Stealth and Medical: both explode on 9 or 10. No number moves. |
| `P19 5: Night Vision names the light levels it cancels, from the data` | rules + smoke-sheet-main | Awareness's mark, and the line under Main's attacks: "Dim −1 and Dark −3 don't apply to your attacks". Change Dim's `attack` in a copy of the data and the line follows. |
| `P19 6: the tags are computed now, held and unheld` | rules | Each §8 entry's computed tags: unheld reads the general template (Defect/Flaw "−2 on checks with the Skill you choose"), held names its picks; a `whenText` row uses its `…When` template; P18 4 still passes. |
| `P19 7: a conditional row is a mark, never a number` | rules | Dwarf: Stealth's `checkBonus` unchanged, a `checkMod` mark "+3 when hiding". Mutating `whenText` away makes it a number (it's the guard's mutant). |
| `P19 8: skillLine and effectTagsFor are total over hostile rows` | engine | `skills` not an array, an unknown skill id, `skillsFromPick` naming no pick, `amount` "3" or NaN, `die` "1d7", `faces` [] or ["x"], a pick holding a skill id the data lacks, an orphaned skill on the character: nothing throws; bad rows are skipped. |
| `P19 9: the Expert mode toggle is in the header on every step of character creation` | smoke-wizard | Present beside Home on all eight steps (Review included), `aria-pressed` per the setting; absent on Home and the sheet. On Stats, a press flips `aria-pressed` and writes `shadows.ui.expert`, focus stays on it, and `#main`'s HTML is unchanged. Its `title` is `appCopy.expertTitle`. The hint is present on Skills (setting off, never pressed) and absent on Stats. **On `main`: fails** (no toggle on Stats). |

## 11. Tests beyond the examples

- **Totality:** P19 8, plus the existing totality guards over `skillLine` and `effectTagsFor`.
- **Voice:** the new templates and `skillRowText` pass `voice.test.mjs`; P18 7's template scan covers the new keys.
- **Phone width:** `npm run phone-check` with a character holding Common Sense, Machindo and Distractable (Basic Tech and Awareness each with two or three lines). `scrollWidth` = `clientWidth` on Skills and Main at 320 and 375.
- **Dev preview** (`shadows-dev-preview`): the Skills tab at 375px and at desktop, with the fixture above plus Ghost Step and Field Medic. Screenshot or measure in the PR.
- **Mutation-test** each guard in §12 against the pre-fix code.

## 12. Mutants, each of which must fail a test

1. A `checkMod` left out of `checkBonus` (P19 1).
2. A `checkMod` with `whenText` added to `checkBonus` (P19 7).
3. The attack reading the Skill's check without the trait (an attack computed from `base`, not `checkBonus`) (P19 1).
4. Take X's total computed from `base` without Pain (P19 3).
5. A kicker added to `checkBonus` (P19 2).
6. `skillsFromPick` reading every pick, not the ones cut to the rank (P19 4, Refined Skill at 1 with two picks stored).
7. `failOn` marked on every Skill (P19 4).
8. Night Vision's numbers typed into the template instead of read from `visibility` (P19 5).
9. One of the 16 entries left as a rule row (P19 6).
10. The toggle back behind `expertStep()` (P19 9, on Stats).
11. The first-sight hint shown on every step (P19 9, on Stats).

## 13. Steps

1. Read §4; confirm each §5 row; **check §8's whens against the book**. `npm run test:fast`.
2. Write §10's tests; run them on `main`; keep the output for the PR.
3. Data: the `grants` rows, `visibility`, the templates. `gamedataVersion` 0.41. `npm run test:fast`.
4. Engine: `skillLine`, then `effectTagsFor`. `npm run verify`.
5. UI: `skillRowPair`, Main's attacks line, print. `npm run verify`, the dev preview, `npm run phone-check`.
6. Mutants (§12), scripted: apply, run the named test, restore from a saved copy.
7. Close-out (§15).

## 14. Stop and ask

- **A ruled sentence would change meaning** when its words move into a template (compare each against `0430`/`0440` and the rulings page). Say which, and stop.
- **A Take X and a kicker on one Skill**, or **two kickers on one Skill**, become reachable (PQ6, and the decision's *Revisit if*).
- **A computed value moves for a character holding none of §8's entries.**
- **Anything saved in the character.** Nothing should be.
- **An existing test fails** other than these **expected breaks**: `rules` ~2029–2032 (Common Sense's held rule line), the rule-row lists at `rules` ~229 and ~279 where they name a §8 entry, the two **P18 6** tests' Common Sense lines, and any other test that reads a §8 entry's rule line (grep the 16 ids). Each moves to the computed reading, named in the PR. **P18 4 must pass unchanged.**
- **The data-key guard refuses `visibility.stealth`:** not a stop. Drop the key and say so.
- **P13 6's step assertion** (the toggle on three steps only) is an **expected break**: rewrite it to every wizard step, keep its focus checks, and name it in the PR. Its title changes to say so.

## 15. Close-out and review checklist

**Close-out** (the close-the-session skill, *Rule or shape*):
- Decision **N** in `SCHEMA.md` §4, its INDEX §3 line, Decision 231 and its INDEX line marked **superseded in part by N**, and 96 and 229 noted as extended. SCHEMA §2 gains the six `grants` types, `visibility` and `skillRowText`. STATE rewritten.
- Decision **N+1** (the rider) in `SCHEMA.md` §4 with its INDEX §3 line. Nothing is marked superseded (§2). P13's order, PQ4: a one-line note that N+1 reverses it.
- `gamedataVersion` 0.41; `npm run bump -- 0.49.0`; CHANGELOG, then `npm run changelog`.
- The plan's P19 row; a `shipped.md` row; a `log/2026.md` entry (versions and what was learned).
- PR title: `P19: Skills learn from traits (Decision N, app 0.49.0, data 0.41)`. The body includes **Where the order didn't fit**.

Suggested CHANGELOG lines (player voice):
- **Your Skills count your Advantages and Disadvantages.** Ghost Step adds 3 to Stealth, Defect/Flaw takes 2 off the Skill it hurts, and your attacks follow.
- **Kicker dice show on the Skill:** Field Medic's Medical reads 1d10 + your bonus + 1d4.
- **Take X shows what you'd get:** Common Sense on Investigation reads "Take 6: 13". Choose it before you roll.
- **Your Skills say when they fail or explode early:** Distractable on Awareness and Combat Sense, Refined Skill on the Skill you chose, and the rest.
- **Night Vision says what it cancels:** Dim −1 and Dark −3 don't touch your attacks.
- **Expert mode stays in the header through all of character creation,** so it's where you left it on every step.

**Review checklist:**
- [ ] §10's tests exist with those names, run on `main`'s code in the PR (P19 1 fails there).
- [ ] §5's rows each confirmed or corrected; the attack and maneuver rows pinned.
- [ ] §8's whens match the book, not just this order.
- [ ] `git diff origin/main --stat -- src` touches only `shadows-data.js`, `engine.js`, `sheet.js`, the generated changelog and, for the rider, `app.js` (the wizard header's branch) and `tools/phone-check.mjs`. `wizard.js` and `shared.js` need nothing (their readers follow `checkBonus` and `effectsHtml` on their own, and `expertStep` is unchanged).
- [ ] Decision N passes `docs.test.mjs`; 231 marked superseded in part.
- [ ] P18 4 passes unchanged; the edited existing assertions are exactly §14's list.
- [ ] Mutants 1–9 in the PR, each with its test.
- [ ] Phone-check and the dev preview's measurements in the PR.
- [ ] `npm run verify` green; versions as §2.
- [ ] The rider: the toggle on all eight steps in the dev preview (Stats and Review included), the header's height at 320px in phone-check, and the hint still only on the three steps.

## 16. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<plan>/<order>` = `sheet-wishlist/P19-skills-from-traits.md` and `<id>` = **P19**, and these traps under the builder's:

> Seven things in this order are easy to get wrong:
>
> 1. **A row with `whenText` is a mark, never a number.** Dwarf's +3 is only when hiding; adding it to `checkBonus` makes every Stealth roll wrong.
> 2. **Take X's total is X + the whole check**, Pain and Conditions included. It can't explode or botch, and the line always says to choose before rolling (Deighton).
> 3. **A kicker is beside the number, never in it.** `checkBonus` stays a number every reader can add to.
> 4. **The −2 reaches attacks and maneuvers because they read `checkBonus`.** Don't special-case them, and pin them in P19 1.
> 5. **`skillsFromPick` reads the picks cut to the rank** (`Engine.picksFor`), and ranks sum over natural and bought rows.
> 6. **The book is the source for every "when", and the rulings page for the light levels.** Moving a sentence into a template is where drift hides: compare each one.
> 7. **The rider moves the toggle, not the hint.** `expertStep()` stops gating the button and keeps gating `expertHintHtml`. A press on a step it doesn't fold must not re-render `#main` into anything different.
>
> Tier: **Rule or shape**. Two decisions (the next two free numbers: P19's, then the rider's), game data 0.41, app 0.49.0, no schema bump. Use the close-the-session skill at the end.
