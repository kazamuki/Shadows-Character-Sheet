# Work order P21: Skills learn from powers, tweaks and Milestones

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3, row P21. **Source:** the inventory, [`P21-inventory.md`](P21-inventory.md) (every effect the Majors, Minors, tweaks, powers, traits and Aberrations state, sorted). **Ken's ruling of 2026-10-17** on Take X with a kicker (§1.3). Decisions 104, 200, 215, 226, 231, 233.

**Scope.** P19 put 16 Advantages' and Disadvantages' Skill-check effects on the Skill's row. This order does the same for every other source that has them:
- **the Professional's tweaks**: Cleaner's Vanish, Fence's Concierge, Wheelman's Stunt Driver, Slayer's Hunter's Calling, and True Warrior's Unwavering Focus and Wind Dancing Defense;
- **the Arcanist's** creation Aberrations (Thaumaturgical Sight, Resonant Whispers) and its trait Aetheric Attunement;
- **taken Major Milestones**: Quick Study, Hardcore Parkour, Survival Instinct, Iconic Weapon, Night Wings, Life Sense;
- **held powers at their rank**: Veil of Night, Spectral Veil, Preternatural Speed, Battleborn Instinct, and seven Werewolf powers;
- **the Werewolf's traits and starter power**: Feral Instincts, Pack Mentality, Active Camouflage;
- **rolled Aberrations**: Mimetic Skin, Marked, Night Eyes, Nocturnal.

That is the inventory's (b) and (c) Skill-row rows: **37 effects**. On top of them comes **Ken's ruling on Take X with a kicker**: "Take 6: 13 + 1d4".

**Rider: Speed Heal lasts 24 hours** (Ken, 2026-10-21, folded in here). P20b's review found it, and it's on `main` too. The Rest panel multiplies **every** day of a rest by Speed Heal's ×2, but the book says *"2× healing rate for 24 hours"* (`0460` Gear) and the panel itself says *"Speed Heal doubles it for 24 hours."* So 3 days on Speed Heal at BOD 6 proposes 36, where the book gives 24 (12 for the dosed day, then 6 and 6). It shares no file with the Skill work except the data's version and the close-out (§1.7, §3 PQ15, §5's Speed Heal rows, §10's P21 11).

**Status:** **drafted 2026-10-17 by Claude (Opus)**, from the inventory. Pre-flighted against `main` at `2d38dc9` (#213 merged: P19, app 0.49.0 and data 0.41, unreleased). **Ken answered PQ1–PQ14 on 2026-10-17:** "Take all the defaults for most questions, here are the differences: PQ7: lets flag that one to ask D / PQ9: lets flag that one for D for kicker die. I believe they combine to the next die size up, but I need confirmation / PQ10: Flag for D". So every PQ is **Default** except **PQ7, PQ9 and PQ10, which are Deighton's**. The build opens them as three flags (§2a), each stubbed as its PQ's default says. Nothing that waits on them is guessed.

**Amended 2026-10-21 by Claude (Opus), P20b's reviewer.** P20a and P20b are merged and released in v0.51.0. The pre-flight was re-run against `main` at `24401f7` (below; every line still holds, and the line numbers moved). Ken folded in the Speed Heal rider, which adds **PQ15. Ken answered it on 2026-10-21: Default** (one tick is one dose, and it doubles one day).

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../../gm-mode/README.md). P20 has merged, and the pre-flight below is the re-run. Ken starts **P21 build**, then a fresh reviewer once the PR is open.

**Carried over from P19's review:**
- **The miss is this order.** P19's sweep found every reader of `checkBonus`, but its scope was "Advantages and Disadvantages", and nobody asked what else carries the same effects. The review asked, and the inventory found 37. **Applied here:** §5 lists every source the sheet stores an archetype effect in, and says for each one whether `traitRows` reads it.
- **The wrong assumption:** P19's §1 assumed no Skill could hold a Take X and a kicker. This order makes that reachable (Quick Study and Hyper Vigilance, both on Combat Sense), and Ken has ruled on it. **Applied here:** §10 pins it, and §13 names the test lines it changes.

**Pre-flight against `main`**, re-run 2026-10-21 at `24401f7` (v0.51.0: P19, P20a and P20b merged and released; engine read). The first draft's was at `2d38dc9`.

```
traitRows                   reads ch.advantages and ch.disadvantages only (engine ~997), via heldRank. attackNotes reads it (~1094)
Other scans today           traitGrants (~240, Decision 235, new since the draft): advantages, disadvantages (ranks summed), taken
                            Majors, specializationChosen, archetypePowers (at rank). naturalArmor (~1345) and movement (~1395)
                            scan the same five. None reads baselineTraits, a starterPower or trackers.aberrations.
                            grants() (~165) reads three (advantages, disadvantages, taken Majors), ranks summed since P20b
Cleaner, Stealth 3          skillLine(ch,"stealth").kickers  →  []   (Vanish's 1d6 not read: traitRows never sees a spec option)
Take X with a kicker        skillLine's takeX[].total = x + checkBonus; takeX[].text never names a kicker;
                            sheet.js checkText (~337) appends kickers to the Check cell only
A conditional kicker        traitEffects (~1024) drops a kicker with whenText; explodeOn with whenText too
Majors' saved shape         milestones.major[] = { id, date, power? }: no Skill or weapon pick (Decision 223)
Power "running" state       none stored. naturalArmor's activeIds come from the hit panel's ticks (W110 is open)
Overlaps after P21          Take X + kicker: Combat Sense (Quick Study + Hyper Vigilance). Two kickers: Combat Sense (Hyper Vigilance + Unwavering Focus,
                            the second conditional); Dodge (Wind Dancing Defense + Survival Instinct, both conditional). P20 added no Skill rows
Pain in a check             painState now carries Terminal Disease and Pain Tolerance (Decision 236): P21 3's "hurt" case still drops by Pain
Speed Heal (the rider)      naturalHealing(ch, { days, speed }) (~2273): proposed = BOD × each healTimes × days × 2 with speed, so every
                            day doubles. BOD 6, 3 days, Speed Heal → 36 (the book: 24). The Rest panel's sum line (sheet ~1199) prints
                            "× 2 (Speed Heal) × 3 days" under recoveryRules.naturalHealing.speedHealText "Speed Heal doubles it for 24 hours."
                            The history label (~3608) reads factors; the kit leaves your gear (~3611, one dose) as today
```

---

## 1. Goal

When P21 is merged:

1. **A tweak's, Major's, power's, trait's or Aberration's effect on a Skill shows on its row**, as P19's do. Cleaner: Stealth reads "1d10 + N + 1d6", and the kicker's source is *Vanish*. Quick Study: Combat Sense reads "Take 6: N (choose before you roll)". Stunt Driver: Pilot is marked "Explodes on a natural 9 or 10". Each row names its source (the tweak, Major, power or Aberration by name).
2. **A power's bonus grows with its rank.** Scent Tracking at rank 3: Tracking's mark reads "+4 while Scent Tracking runs", from `perRank` × rank + `plus`, the same shape as Iron Hide's Natural Armor (Decision 200).
3. **Take X adds a kicker** (Ken, 2026-10-17, verbatim): *"kicker die are always 'add on' to the roll as a modifier. So if I 'take 6' on a skill, that just means the die face of the dice I rolled for the skill is 6, but if I have a kicker die, then I roll that die and add its results to the overall skill check."* Quick Study with Hyper Vigilance: Combat Sense reads **"Take 6: 13 + 1d4 (choose before you roll)"**. `total` stays 6 + the check; only the line gains the kicker. A conditional kicker isn't appended: it stays its own mark.
4. **A conditional kicker is a mark.** Survival Instinct: Dodge and Melee read "+1d4 once per encounter, on a Defensive Action · Survival Instinct". It is never in the Check cell.
5. **Light, from the table.** Night Eyes: under Main's attacks, "In Dark, attacks take Dim's −1; in Blind, Dark's −3", and on Awareness, "Dark reads as Dim, Blind as Dark". Nocturnal: one line atop the Skills tab, "+1 to every check in Dim or Dark, −1 in Bright". Every number comes from `visibility`.
6. **Nothing else moves**, except the rider (7). A character holding none of §8's sources computes byte for byte what it does on `main`. Natural Armor, movement, SFR and the Form read exactly as today.
7. **Speed Heal doubles one day of a rest.** BOD 6, 3 days, Speed Heal: the Rest panel proposes **24** (6 × 2 for the dosed day, + 6 + 6), not 36. With Rapid Healing rank 2 it's 18 × 2 + 18 + 18 = **72**, not 108. A one-day rest is unchanged (12; 36 with Rapid Healing 2). The sum line and the session log's label say which day the dose doubled. Nothing else in the panel moves: one tick, one dose out of your gear, Focused Healing and the Nanomed Kit as today.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** New source scans in `traitRows`, `perRank` on `checkMod`, a conditional kicker, `skillsFrom`, and two `visibility` fields; 37 effects move from text to computed. One decision, **N** (the next free number on `origin/main` when built), extending 233.
- **The rider is Fix-tier inside this order.** Ken took PQ15's default, which is the book's own sentence that the code got wrong. So it takes no decision: a test, a CHANGELOG line, a log line, and SCHEMA §1's *Healing (055)* prose corrected (it says the panel "multiplies by days and by Speed Heal's ×2", which states the bug). Decision 236's "multiply a rest with each other and Speed Heal" stays true of the dosed day, so nothing is superseded.
- **Game data:** bump (Decision 68), **`0.43` → `0.44`**. `0.43` shipped in v0.51.0, so nothing unreleased is carrying a bump. A Cleaner's Stealth and a Quick Study holder's Combat Sense compute differently. (The rider changes no data.)
- **App: minor, `0.51.0` → `0.52.0`.** `[Unreleased]` is empty since v0.51.0, so this opens it.
- **Character schema: no bump.** Nothing new is saved. Skill Paragon, God Tier, Grace Under Fire, Weapon Expert and Aspect of the Beast, which do need a saved pick, are out of scope (§7).
- **Three flags, opened by the build** (Ken, PQ7, PQ9, PQ10). Like a decision, each takes the next free F-number on `origin/main` when built, written **FN**, **FN+1**, **FN+2** here. See §2a.

## 2a. The flags (Deighton's)

Open each with the `close-a-flag` skill:
- **Data:** on the entry named, `flagged: true` and a `flagNote` naming the F-number. Maintainer text: it is never rendered.
- A **`playerNote`** where the player would otherwise meet a guess (`docs/VOICE-APP.md`: no F-numbers, no "TBD"; marked for a voice pass).
- A **SCHEMA §5 row** and an **INDEX §2 line**.
- **STATE's Deighton line**, grouped: one ruling on kickers may clear FN+1 and FN+2 together.

`flagHtml` renders a flagged entry's `playerNote`:
- on a Major card (`sheet.js` ~1613);
- on a specialization option in the wizard (`wizard.js` ~307);
- on an Advantage on the CP step (`wizard.js` ~588).

Check that each one shows, and say where in the PR.

| Flag | The question | On the entry | The stub (the PQ's default) | `playerNote` (drafted) |
|---|---|---|---|---|
| **FN** (PQ7, inventory E4) | Concierge's "Whenever making an appraisal of gear, contraband, or any standard items you may add a 1d4 kicker die to the roll to assess their value." No Skill is named: which Skill appraises? | `professional` · `fence` (the option) | The appraisal kicker isn't computed. It stays the tweak's text. Concierge's Take 5 (b2) is built. | "Which Skill an appraisal uses is your GM's call; add the 1d4 when it applies." |
| **FN+1** (PQ9, E3) | Do kicker dice stack, and if so, do they combine into the next die size up? **Ken believes they combine to the next size up, and needs Deighton's confirmation.** Evidence: Weapon Expert's "If you have a +1d4 already applied … it increases by one die increment to +1d6 instead." | `field-medic` (its rule row says it "stacks with other kickers") | Each kicker shows on its own, as P19 does: the unconditional one in the Check cell, a conditional one as its mark. Nothing combines them, and no die is stepped up. | "When two Kicker Dice meet on one roll, your GM rules how they combine." |
| **FN+2** (PQ10, E1, E2) | Specialist's "Your Kicker Die increases by 1 size" and Make My Own Luck's "When rolling your Kicker Die, roll twice and take the higher result": which kicker is "your Kicker Die"? Every one the character holds, one they choose, or another? | `specialist` and `make-my-own-luck` (`majorGeneral`) | No kicker changes size or reads "roll twice". The row still shows 1d4 with Specialist taken, and the card says why. | Specialist: "Which Kicker Die grows is your GM's call until the rule is settled." Make My Own Luck: the same, for rolling twice. |

**The build never steps a die, combines kickers, or names an appraisal Skill.** A test pins each stub (§10, P21 10).

## 3. Questions for Ken

| Id | Question | Default | Ken, 2026-10-17 |
|---|---|---|---|
| PQ1 | **Which sources `traitRows` reads.** | **All six:** held Advantages and Disadvantages (today), the chosen specialization options (`grants`), taken Majors (`majorById`), held archetype powers at rank, the archetype's `baselineTraits`, the chosen Origin's `starterPower`, and held Aberrations (`aberrationState(ch).active`). *Alternative:* the first four, leaving Feral Instincts, Pack Mentality, Aetheric Attunement, Active Camouflage and the Aberrations as text. | Default |
| PQ2 | **A power's bonus, with nothing stored to say it's running.** | **Always a mark**, "+4 while Scent Tracking runs", never in the number. *Alternative:* a "running" tick per power (W110's shape), which turns a mark into a number while ticked. That's its own order. | Default |
| PQ3 | **Hardcore Parkour's "+3 to the Dodge Skill Check" "when performing a dodge as a defensive action".** Almost every Dodge is one. | **A mark.** A conditional bonus is a mark (Decision 233). *Alternative:* in the number, since Dodge exists to be a Defensive Action. | Default |
| PQ4 | **Feral Instincts' "+2 to Awareness Skill checks that rely on sight, smell, or hearing".** | **A mark**, for PQ3's reason. *Alternative:* in the number (most Awareness checks rely on one of the three). | Default |
| PQ5 | **Mimetic Skin's "+3 to Stealth when not wearing heavy armor".** The loadout knows worn armor, and the catalog has `material: "Heavy"`. | **A mark.** Whether `material: "Heavy"` is the book's "heavy armor" is a reading the code shouldn't make. *Alternative:* in the number when no worn piece is `material: "Heavy"`. | Default |
| PQ6 | **"Combat checks"** (Hunter's Calling, Battleborn Instinct; inventory E5). | **The attacks:** Hunter's Calling marks Archery, Beam Weapons, Handguns, Heavy Weapons, Martial Arts, Melee, Rifles and SMGs; Battleborn Instinct marks Melee (its Ancient Weapon is a Melee weapon). *Alternative:* Dodge and Combat Sense too. | Default |
| PQ7 | **Concierge's appraisal kicker** names no Skill (E4). | **Left out**: it stays tweak text. *Alternative:* name the Skill (Streetwise?) and it's a conditional kicker on that row. | **Deighton's: flag FN** (§2a). Stubbed as the default |
| PQ8 | **Life Sense's "Human Perception, Med Tech, and First Aid"** aren't Shadows Skills (E6). | **Only the Awareness half** is computed; the rest stays text until the CRB names Skills. *Alternative:* Intuition (intent) and Medical (injuries). | Default |
| PQ9 | **Two kickers on one Skill**, now reachable as a kicker beside a conditional one (E3). | **Show each, as P19 does:** the Check cell has the unconditional one, and the mark the other. *Alternative:* wait for Deighton. | **Deighton's: flag FN+1** (§2a). Ken believes they combine to the next die size up, unconfirmed. Stubbed as the default |
| PQ10 | **Specialist and Make My Own Luck** (E1, E2): "your Kicker Die". A Professional with Field Medic and Specialist sees 1d4 today. | **No change**, raised with Deighton. *Alternative:* a mark on every kicker row, "Specialist: one size larger, if your GM agrees". That's the app narrating an open question, which CLAUDE.md constraint 9 rules out. | **Deighton's: flag FN+2** (§2a). Stubbed as the default, with a `playerNote` |
| PQ11 | **Night Eyes and Nocturnal** (c16, c17) extend `visibility`. | **In**, from the table: Night Eyes shifts a level, Nocturnal adds per level on every check. *Alternative:* text, and leave light to a later order. | Default |
| PQ12 | **The source a row names.** | **The part's own name:** *Vanish* (not *Cleaner*), *Quick Study*, *Scent Tracking*, *Active Camouflage*, *Night Eyes*. | Default |
| PQ13 | **Tags on the Major, power and tweak cards** (Decision 231's chips). | **None.** Their text already says it, and P19's `effectTagsFor` reads Advantages only. *Alternative:* chips on every card, a P18-sized change. | Default |
| PQ14 | **Aberrations "as" an Advantage** (E9: Aura Sight, Danger Sense and six more). | **Out of scope.** Today `as` is display text, and P21 doesn't change that. *Alternative:* the Aberration counts as holding the Advantage, everywhere: grants, prerequisites and `traitRows`. That's its own decision. | Default |
| PQ15 | **Speed Heal on a rest longer than a day** (the rider). The panel has one Speed Heal tick, and it takes one dose from your gear. | **The tick is one dose, and it doubles one day** of the rest: the book's "2× healing rate for 24 hours". A longer course is several rests, one dose each, which the session log already records one by one. *Alternative:* a "Doses" number beside the tick (1 up to the days, and up to what you carry), each dose doubling a day and leaving your gear. That's a new control and its own decision (N+1). | **Default** (2026-10-21: "One Speed Heal tick is one dose and doubles one day of the rest.") |

## 3a. The decision, drafted

```
N. **A tweak's, Major's, power's, trait's or Aberration's effect on a Skill's check shows on its row, as an Advantage's does; Take X adds a kicker.**
     *2026-10-xx · Ken + Claude · Touches: traitRows, traitEffects, skillLine, attackNotes, checkMod perRank, checkMod plus, kicker whenText, skillsFrom, visibility shift, visibility mod, skillRowText, takeX text, specializationChosen, majorById, archetypePowers, baselineTraits, starterPower, aberrationState, Vanish, Concierge, Stunt Driver, Hunter's Calling, Unwavering Focus, Wind Dancing Defense, Thaumaturgical Sight, Resonant Whispers, Aetheric Attunement, Quick Study, Hardcore Parkour, Survival Instinct, Iconic Weapon, Night Wings, Life Sense, Veil of Night, Spectral Veil, Preternatural Speed, Battleborn Instinct, Predator's Mark, Scent Tracking, Pheromone Aura, Ancestral Wisdom, Predator's Allure, Instinctive Awareness, Predator's Silence, Combat Analytics, Feral Instincts, Pack Mentality, Active Camouflage, Mimetic Skin, Marked, Night Eyes, Nocturnal*
     - **Decided:** `traitRows` reads the chosen specialization options, taken Majors, held archetype powers (at rank), the archetype's baseline traits, the chosen Origin's starter power and held Aberrations, as well as Advantages and Disadvantages. A `checkMod` can grow with rank (`perRank` × rank + `plus`); a `kicker` with `whenText` is a mark; `skillsFrom: "focused"` names the Focused Skills; `visibility` can `shift` a level or `mod` every check. A power's effect is a mark ("while it runs"). Take X's line adds each unconditional kicker ("Take 6: 13 + 1d4"), and its total stays X + the check (Ken, 2026-10-17).
     - **Why:** P19's review: a Skill row that shows no kicker reads as "nothing applies", and 37 effects from these sources were text. Ken's ruling: a kicker is "always 'add on' to the roll as a modifier", Take X or not.
     - **Rejected:** a power's bonus in the number (nothing says it's running); the subtype's name as the source (the tweak is what the book names); Majors with a pick (Skill Paragon, God Tier) in this order (a schema change of their own); light from Night Eyes typed into a template (the table holds the numbers).
     - **Replaces:** nothing; extends Decision 233 (its sources and types) and answers its *Revisit if* "a kicker and a Take X" (Ken's ruling).
     - **Revisit if:** Deighton rules on flags FN–FN+2 (an appraisal's Skill, kicker stacking, Specialist and Make My Own Luck); a power's "running" state is stored (W110); an Aberration "as" an Advantage counts as one (PQ14).
     - **Built:** app …, game data …, no schema bump, PR #…. Log 2026-10-xx (P21).
```

## 4. Read first

`CLAUDE.md` (constraints 5, 7, 8, 9; *Decisions*; *Watch for mechanical drift*). `SCHEMA.md` §4: Decisions 104, 200, 215, 226, 231, 233 (INDEX §3 finds them). `engine.js` (lines at `24401f7`): `traitRows` and `traitEffects` (~997–1050), `skillLine` (~1051), `attackNotes` (~1094), `visLevels`/`visOn` (~403–410), **`traitGrants` (~240, Decision 235: the five-source walk this order extends)**, `naturalArmor` (~1345, for how a power's `perRank` and `plus` read), `specializationChosen` (~5048), `majorById`/`majorTakenIds` (~546), `archetypePowers` (~3689), `aberrationState` (~3260), `focusedSkillIds` (~2475). `sheet.js`: `skillFxHtml`, `checkText` (~329–337), `skillRowPair` (~353). **The rider:** `naturalHealing` (~2273), `restPanelHtml` (~1195), the rest's history label (~3608); Decision 236 and SCHEMA §1's *Healing (055)*; `0460` Gear (Speed Heal) and `0550`. The inventory. **The CRB, before writing any `whenText`:** `0412` (tweaks, Majors), `0413`, `0414`, `0411`, `Appendix_Aberrations`, `0530` (*Visibility*; Parry is a Melee check).

## 5. What this changes underneath (the sweep)

Answered by grepping readers (`traitRows(`, `traitEffects(`, `.kickers`, `.takeX`, `.marks`, `attackNotes(`, `checkText(`). **Check each row before you build**, and say in the PR if one is wrong.

| Today | Where | After P21 |
|---|---|---|
| `traitRows(ch)` reads advantages and disadvantages, one per trait, and the rank via `heldRank` | `engine.js` ~997 | Also reads the six sources in PQ1. **Re-run finding:** `traitGrants` (Decision 235) already walks five of the seven (advantages and disadvantages with ranks summed, taken Majors once each, `specializationChosen`, `archetypePowers` at rank) with the totality guard (`safe`). Factor that walk out so both read it, rather than writing a third scanner beside it and `grants()`. **`traitGrants` keeps its five sources:** `derivedMod`, `statMax` and `startingCredits` must not start reading a baseline trait or an Aberration (P21 4 pins it). `traitRows` takes all seven. Keep `traitRows`' `skillsFromPick`, which reads an Advantage's picks. Each yields `{ g, ids, name, rank }`: `rank` is the power's rank, else 1. `skillsFromPick` stays Advantage-only; `skillsFrom: "focused"` reads `focusedSkillIds(ch)`. Orphans are skipped: an unknown option, Major, power or Aberration, and a power whose archetype isn't the character's. |
| `traitEffects` takes `checkMod` `amount` | ~860 | `amount`, or `perRank` × rank + `plus` (each finite; a bad row skipped). The amount of a mark is filled the same way. |
| A `kicker` with `whenText` is dropped | ~864 | A mark: `{ kind:"kicker", text: skillRowText.kickerWhen }`. Never in `kickers`. |
| `visibility` rows only `ignore` levels; `on` is attacks or awareness | ~854, `visLevels` ~265 | Gains `shift` (`{ dark:"dim", blind:"dark" }`, each level's numbers read from the table) and `mod` (`{ dim:1, dark:1, bright:-1 }`, `on: ["checks"]`). Night Vision's row reads as today. |
| `skillLine().takeX[].text` = `takeX`/`takeXWhen` template, no kicker | ~906 | With unconditional kickers, `takeXKicker`/`takeXKickerWhen`: "Take {x}: {total} + {kickers} …". `total` unchanged (a number). |
| `attackNotes(ch)`: Night Vision's line | ~918 | Also Night Eyes' shift line. |
| Skills tab: `skillFxHtml` lists Take X, then marks | `sheet.js` ~305 | Unchanged code; it shows the new marks and lines. Nocturnal's line goes once above the Skills table (a new `checksNotesHtml`, beside `attackNotesHtml`). |
| `checkText` appends `kickers` to the Check cell; print uses it | `sheet.js` ~314, ~2550, ~2685 | Unchanged: it gains Vanish's kicker on its own. Print follows (P19's PQ3: kickers print, marks don't). |
| Weapon attack rows read `checkBonus`, never `kickers` | `formView`, `weaponView` | **Unchanged.** No attack Skill gains an unconditional kicker here (Hunter's Calling's is a mark). Pin it: Slayer's Handguns attack row has no "+ 1d6". |
| `naturalArmor`, `movement`, `grants()` | ~1161, ~1211, ~165 | **Unchanged.** They ignore the new types (pin it: P21 4). Adaptive Skeleton's Natural Armor (inventory b21) isn't in this order. |
| The data-key guard (Decision 135) | `engine.test.mjs` ~364 | `grants` on a baseline trait, a starter power and an Aberration are read by `traitRows`. `perRank`, `plus`, `shift`, `mod` and `skillsFrom` are read by `traitEffects`. |
| P19's tests | `rules` 2134–2340, `smoke-sheet-skills` ~1091–1168 | **All pass unchanged.** No P19 fixture holds a kicker and a Take X on one Skill. If one does, it's an expected break (§13). |
| **`P19 7b: no Skill can hold two kickers, or a kicker and a Take X`**: a trip-wire over Advantages and Disadvantages only (`P18_DEFS`) | `rules` ~2359 | It still passes, because it never sees the new sources, and that's the problem: it would stay green while P21 makes both overlaps reachable. **Rewrite it, as an expected break:** scan every source `traitRows` reads, and assert that the overlaps reachable are exactly the ones this order lists (Combat Sense: Hyper Vigilance with Quick Study and with Unwavering Focus; Dodge: Wind Dancing Defense with Survival Instinct). A new overlap then fails it until someone decides how it reads. Rename it `P21 9: the Skills that can hold two kickers, or a kicker and a Take X, are the ones the order names`. |
| GM mode | `gm.js` | Reads no `skillLine` (grep). Unchanged. |
| **Rider:** `naturalHealing(ch, { days, speed })` multiplies the whole proposal by Speed Heal's ×2 (`factors` holds it beside Rapid Healing and Fast Metabolism) | `engine.js` ~2273 | `proposed` = `daily × days`, plus one more `daily × (x − 1)` when Speed Heal is ticked and `days ≥ 1`, where `daily` = BOD × each every-day factor. Speed Heal's entry in `factors` gains `days: 1` (the every-day factors carry no `days`), so P20b 3's `factors.map(f => [f.name, f.x])` passes unchanged. One reader still (Decision 236): the panel, its label and the tests read `proposed`. |
| **Rider:** the Rest panel's sum line, `data-restsum` | `sheet.js` ~1199 | One day: unchanged ("BOD 6 × 3 (Rapid Healing) × 2 (Speed Heal) = 36 a day"). Longer: names the dosed day, e.g. "BOD 6 × 3 (Rapid Healing) = 18 a day × 3 days, + 18 for Speed Heal's day = 72" (drafted, **marked for a voice pass**). It must read from `naturalHealing`'s fields and type no number. |
| **Rider:** the rest's history label | `sheet.js` ~3608 | One day: unchanged ("Rested 1 day (×3 Rapid Healing, ×2 Speed Heal)"). Longer: "Rested 3 days (×3 Rapid Healing; ×2 Speed Heal for a day)" (drafted). |
| **Rider, text that restates the rule:** `recoveryRules.naturalHealing.speedHealText` ("Speed Heal doubles it for 24 hours."), the gear's `notes` ("2× healing rate for 24 hours"), and the reference panel (`engine.js` `_refPart("Natural healing", …)`) | data, engine | **Unchanged: they were right all along.** SCHEMA §1's *Healing (055)* ("multiplies by days and by Speed Heal's ×2") is the one that states the bug, and it's corrected in the same change. |
| **Rider:** Speed Heal leaving your gear (`gearUseHtml`, `gearId` ~3611) | `sheet.js` | **Unchanged:** one tick, one dose (PQ15's default). |
| **Rider:** P20b's tests that tick Speed Heal | `rules` P20b 3, `smoke-sheet-play` P20b 3b, `engine` P20b 8 | **All pass unchanged:** each ticks it on a one-day rest, and P20b 8 compares a hostile character with a clean one at the same 2 days. Grep `speed: true` and `data-act="speed"` before the build, and name any other hit as an expected break. |

## 6. The shapes

**Where the rows go.** On a specialization option, beside `tweak` (Professional) or in its own `grants` (Arcanist). On a Major in `growth.majorMilestones` or `majorGeneral`. On a power in `powers`. On a baseline trait, a `starterPower` row (CyberWolf's `rows[]` gains `grants` on Active Camouflage's row), and an Aberration. Each beside the text it computes, which stays as written.

```
{ "type":"kicker",   "die":"1d6", "skills":["stealth"] }                                            // Vanish
{ "type":"takeX",    "x":5, "skills":["persuasion"], "whenText":"when negotiating prices with vendors, merchants and black marketeers" }
{ "type":"explodeOn","faces":[9,10], "skills":["pilot"] }                                           // Stunt Driver
{ "type":"takeX",    "x":6, "skills":["pilot"], "whenText":"on your next Pilot check, in place of a free stunt" }
{ "type":"takeX",    "x":6, "skills":["combat-sense"] }                                             // Quick Study
{ "type":"kicker",   "die":"1d4", "skills":["dodge","melee"], "whenText":"once per encounter, on a Defensive Action" }   // Survival Instinct
{ "type":"kicker",   "die":"1d4", "skillsFrom":"focused", "whenText":"while Unwavering Focus is active" }
{ "type":"checkMod", "perRank":1, "plus":1, "skills":["tracking"], "whenText":"for creatures within a mile, while Scent Tracking runs" }
{ "type":"checkMod", "amount":3, "skills":["acrobatics","dodge","melee"], "whenText":"in the air" }  // Night Wings
{ "type":"visibility","shift":{"dark":"dim","blind":"dark"}, "on":["attacks","awareness"] }       // Night Eyes
{ "type":"visibility","mod":{"dim":1,"dark":1,"bright":-1}, "on":["checks"] }                      // Nocturnal
```

**`skillLine(ch,id)`:** the same fields as P19's. `marks[].kind` gains `"kicker"`, and `takeX[].text` names the unconditional kickers. Total: bad rows, an unknown source, a non-finite `perRank`/`plus`, an unknown level in `shift`/`mod`, and `skillsFrom` other than `"focused"` are each skipped, never thrown.

**Templates** (drafted, **marked for a voice pass**), in `skillRowText`:
```
takeXKicker      "Take {x}: {total} + {kickers} (choose before you roll)"
takeXKickerWhen  "Take {x}: {total} + {kickers} {whenText} (choose before you roll)"
kickerWhen       "+{die} {whenText}"
visibilityShift  "In {from}, attacks take {to}'s {penalty}"            (joined: "In Dark, attacks take Dim's −1; in Blind, Dark's −3")
visibilityShiftAwareness "{from} reads as {to}"
visibilityChecks "{mods} on every check"                                ("+1 in Dim or Dark, −1 in Bright")
```
`{kickers}` joins with " + ". A power's `whenText` names the power ("while Scent Tracking runs"), so the `from` tail (PQ12) repeats it. That's accepted: the tail is muted.

## 7. Out of scope

- **Anything that needs a saved pick:** Skill Paragon, God Tier, Grace Under Fire, Weapon Expert (a Major's Skill or weapon), Aspect of the Beast (the spirit), Battle Hardened (the immunity). One later order, with a schema bump. God Tier waits on E8 as well.
- **Weapon and armor rows** (Tuned Edge, Custom Fit, the Signature line, the natural-weapon powers), **stats while a power runs**, **movement**, **Essence checks**, **SFR and RoU numbers**, **magic** (Tremor, Slow Tide), **Luck** (Stunt Driver's Lucky while piloting). The inventory's (c) "Elsewhere", grouped for later orders.
- **P20's areas**, built by P20a and P20b (Decisions 235, 236): Arcane Fortitude's TOL, SAN, the stat caps, Pain, rest and the trait half of Take a hit. The rider is the one exception, folded in by Ken.
- **The power half of Take a hit and healing has no order** (found re-running the pre-flight). The inventory sent Odin's Aegis, Null Field, Red Mist, Spectral Veil's immunity, Elemental Blood, Silverscar, Battle Hardened, Regeneration, Bone and Sinew and Vitality Surge to P20 (c44–c53). P20b's order passed them on: *"P21 … owns the reductions that run with a power"*. This order leaves them to "later orders". Nothing here builds them. **Ken parked them as [W132](../../../WISHLIST.md)** (2026-10-21), outside this plan, so the plan can close.
- **Adaptive Skeleton's Natural Armor** (b21): `naturalArmor` would need a `starterPower` scan. A one-line follow-up, but not a Skill row.
- **Ruling on** Specialist, Make My Own Luck, kicker stacking or Concierge's appraisal: the build opens flags FN–FN+2 and stubs them (§2a), never more. **Aberrations "as" Advantages** (PQ14) and **Life Sense's old Skill names** (PQ8) stay out.
- **A "running" state for powers** (PQ2, W110).

## 8. The entries

The inventory has each row's exact sentence. **Check every `whenText` against it and the book**, not against this table: a paraphrase is where drift hides.

| Source | Row(s) | Skills |
|---|---|---|
| Vanish (cleaner) | `kicker` 1d6 | Stealth |
| Concierge (fence) | `takeX` 5, when | Persuasion |
| Stunt Driver (wheelman) | `explodeOn` 9,10; `takeX` 6, when | Pilot |
| Hunter's Calling (slayer) | `kicker` 1d6, when (PQ6); `kicker` 1d6, "when hunting your quarry" | the attacks; Occult Lore, Tracking |
| Unwavering Focus (true-warrior) | `kicker` 1d4, `skillsFrom:"focused"`, when | Focused Skills |
| Wind Dancing Defense (true-warrior) | `kicker` 1d6, "using Dodge in combat, while active" | Dodge |
| Thaumaturgical Sight · Resonant Whispers (arcanist) | `checkMod` +2 · +3, when | Occult Lore |
| Aetheric Attunement (arcanist trait) | `checkMod` +5, when | Awareness |
| Quick Study | `takeX` 6 | Combat Sense |
| Hardcore Parkour | `takeX` 6, when; `checkMod` +3, when (PQ3) | Acrobatics; Dodge |
| Survival Instinct | `kicker` 1d4, when | Dodge, Melee |
| Iconic Weapon | `checkMod` +5, "while your Signature weapon is visible" | Deception, Intimidation, Persuasion, Seduction |
| Night Wings | `checkMod` +3, "in the air" | Acrobatics, Dodge, Melee |
| Life Sense | `checkMod` +5, "hearing-based, within 20 meters" (PQ8) | Awareness |
| Veil of Night · Preternatural Speed | `checkMod` +2, while | Stealth · Dodge, Melee |
| Spectral Veil · Battleborn Instinct | `checkMod` `perRank` 1 `plus` 1, while | Stealth · Melee (PQ6) |
| Predator's Mark · Combat Analytics | `checkMod` `perRank` 1, when | Melee · the attacks |
| Scent Tracking · Pheromone Aura · Predator's Allure · Instinctive Awareness · Predator's Silence | `checkMod` `perRank` 1 `plus` 1, when | Tracking · Intimidation · Persuasion, Seduction · Intuition · Stealth |
| Ancestral Wisdom | `checkMod` `perRank` 1 `plus` 2, "about supernatural matters" | Occult Lore |
| Feral Instincts · Pack Mentality (werewolf traits) | `checkMod` +2 · +1, when (PQ4) | Awareness · Melee, Martial Arts |
| Active Camouflage (forge-fang starter) | `checkMod` +2, "while it runs, until you attack" | Stealth |
| Mimetic Skin · Marked | `checkMod` +3 · −2, when (PQ5) | Stealth · Deception, Disguise |
| Night Eyes · Nocturnal | `visibility` `shift` · `mod` (PQ11) | attacks, Awareness · every check |

## 9. The UI

- **Skills tab and Main's Combat table:** no new code beyond Nocturnal's line. The Check cell gains Vanish's kicker; the name cell's lines gain the new Take X and marks, each with its source.
- **Take X with a kicker:** "Take 6: 13 + 1d4 (choose before you roll) · Quick Study". On a phone it wraps inside the name cell (§11).
- **Main's attacks:** Night Eyes' line under the table, beside Night Vision's.
- **Skills tab:** Nocturnal's line once above the table.
- **Print:** Vanish's kicker joins "1d10+N+1d6". Nothing else (P19's PQ3).
- **No new control.** Nothing here is pressed.

## 10. Worked examples, as named tests (write first; run on `main` and keep the output)

| Name | File | Setup → result |
|---|---|---|
| `P21 1: a tweak's kicker, Take X and die face are on its Skill's row` | rules + smoke-sheet-skills | Cleaner: Stealth's `kickers` `[{die:"1d6", from:"Vanish"}]`, `checkBonus` unchanged, the cell "1d10 + N + 1d6", print "1d10+N+1d6". Wheelman: Pilot explodes on 9 or 10, and its Take 6 carries its when. Fence: Persuasion's Take 5 with its when. **On `main`: fails.** |
| `P21 2: a taken Major's effect is on the row, and not before it's taken` | rules | Quick Study taken: Combat Sense `takeX[0]` `{x:6, from:"Quick Study"}`. Not taken: no line. Hardcore Parkour: Acrobatics' when-line. A Major in the file twice counts once. |
| `P21 3: Take X adds the kicker, and its total doesn't` | rules + smoke-sheet-skills | Quick Study + Hyper Vigilance: Combat Sense's `takeX[0].total` = 6 + `checkBonus`, and `.text` = "Take 6: {total} + 1d4 (choose before you roll)". Hurt: the total drops with Pain, and the kicker stays. Survival Instinct only on Dodge, with no Take X there: nothing changes. **On `main`: fails** (no kicker in the text). |
| `P21 4: a power's mark grows with its rank, and nothing else moves` | rules | Scent Tracking at rank 1 and 3: Tracking's mark "+2 …" then "+4 …", `checkBonus` unchanged both times. A Werewolf holding none of §8's: every Skill's `skillLine`, plus `naturalArmor`, `movement` and `sfr`, deep-equal `main`'s. |
| `P21 5: a conditional kicker is a mark, never in the Check cell` | rules + smoke-sheet-skills | Survival Instinct: Dodge and Melee have `kickers` `[]` and a `kicker` mark "+1d4 once per encounter, on a Defensive Action". Unwavering Focus: each Focused Skill (from `focusedSkillIds`) has the mark, and no other Skill does. |
| `P21 6: every source is read: spec, Major, power, trait, starter, Aberration` | rules | One effect from each source on its Skill; remove each source and its effect goes. A Vampire's power id saved on a Werewolf (an orphan) gives nothing. |
| `P21 7: Night Eyes and Nocturnal read the visibility table` | rules + smoke-sheet-main | Night Eyes' attack line names Dim's −1 and Dark's −3. Change Dim's `attack` in a copy of the data and the line follows. Nocturnal's line reads "+1 in Dim or Dark, −1 in Bright". |
| `P21 8: traitRows and skillLine are total over hostile sources` | engine | A spec id the data lacks, a Major `{}`, a power with rank "3" or NaN, `perRank` "1", `plus` Infinity, `shift` `{dark:"nope"}`, `mod` `{dim:"x"}`, `skillsFrom:"all"`, `trackers.aberrations` not an array: nothing throws, and bad rows are skipped. |
| `P21 10: the flagged kicker rules are stubbed, not guessed` | rules + smoke-sheet-main | Specialist taken with Field Medic: Medical's `kickers` is still `[{die:"1d4"}]`, with no "roll twice" anywhere on the row, and the Major card shows its `playerNote` (FN+2). Hyper Vigilance with Unwavering Focus: Combat Sense's Check cell has one 1d4 and the other is a mark; no 1d6 appears (FN+1). A Fence's Skills carry no appraisal kicker on any row, and the option shows its `playerNote` in the wizard (FN). Each entry is `flagged` with a `flagNote` naming an open F-number (`docs.test.mjs`). |
| `P21 9: the Skills that can hold two kickers, or a kicker and a Take X, are the ones the order names` | rules | Replaces P19 7b (§5). It scans every source and lists the overlaps. They're exactly §5's: Combat Sense and Dodge. |
| `P21 11: Speed Heal doubles one day of a rest` | rules + smoke-sheet-play | BOD 6: 3 days with Speed Heal → **24**; 1 day → 12; 3 days without → 18; 0 days with Speed Heal → 0. Rapid Healing 2, 3 days with Speed Heal → **72**. Speed Heal's `factors` entry has `days: 1`. Smoke: the Rest panel's HP box proposes 24 for 3 days, the sum line names the dosed day and holds no "× 2 (Speed Heal) × 3 days", the label after Apply says "×2 Speed Heal for a day", and one dose leaves your gear. **On `main`: fails** (36). |

## 11. Tests beyond the examples

- **Totality:** P21 8, and the existing guards over `skillLine` and `effectTagsFor`, extended to a character with each source.
- **Voice:** the new `skillRowText` keys pass `voice.test.mjs`.
- **Phone width:** `npm run phone-check` with a True Warrior holding Hyper Vigilance and Quick Study (Combat Sense: a Take X with a kicker and a kicker mark). `scrollWidth` = `clientWidth` on Skills and Main at 320 and 375.
- **Dev preview** (`shadows-dev-preview`): a Cleaner's and a Werewolf's Skills tab at 375px and desktop, in the PR.
- **Mutation-test** each guard in §12.

## 12. Mutants, each of which must fail a test

1. `traitRows` back to advantages and disadvantages only (P21 1, 2, 6).
2. A conditional kicker pushed into `kickers` (P21 5).
3. Take X's text without the kicker (P21 3).
4. Take X's `total` with the kicker's average added (P21 3).
5. `perRank` ignored, `amount` only (P21 4).
6. A power's `checkMod` in `checkBonus` (P21 4: the number moved).
7. Majors scanned without dedup (P21 2: counted twice).
8. `skillsFrom:"focused"` marking every Skill (P21 5).
9. Night Eyes' numbers typed into the template (P21 7).
10. A taken Major's `kicker` added to Stealth in the data (a new, unlisted overlap) (P21 9).
11. Specialist stepping Medical's kicker to 1d6 (P21 10).
12. Speed Heal back over every day of the rest (P21 11: 36, not 24).
13. Speed Heal's extra day added with no day rested (P21 11: 0 days proposes 6).

## 13. Steps and stop-and-ask

**Steps:** (1) Read §4; confirm each §5 row; check §8's whens against the inventory and the book; `npm run test:fast`. (2) Write §10's tests and run them on `main`. (3) Data: the rows, `skillRowText`, the version. (4) Engine: `traitRows`, `traitEffects`, `skillLine`, `attackNotes`; `npm run verify`. (5) UI: Nocturnal's line; the dev preview; `npm run phone-check`. (6) **The rider**, after the Skill work is green: P21 11 first (on `main` it fails at 36), then `naturalHealing`, the sum line, the label, SCHEMA §1's prose. (7) The mutants, scripted. (8) Close-out.

**Stop and ask:**
- **A `whenText` would say less, or more, than the book's sentence.**
- **A computed value moves for a character holding none of §8's sources** (P21 4), other than the rider's: a rest of more than one day on Speed Heal.
- **Anything saved in the character.**
- **An existing test fails** other than these **expected breaks**: **P19 7b**, rewritten as P21 9 (§5); a P19 test whose fixture holds a kicker and a Take X on one Skill (none known; grep `hyper-vigilance` and `field-medic` beside `takeX`); and any test asserting a §8 source's text *is* its whole effect.
- **Deighton rules on FN, FN+1 or FN+2 before the build ends:** stop. The ruling becomes its own change, closing the flag; this order builds only the stubs.

## 14. Close-out and review checklist

- Decision **N** in `SCHEMA.md` §4 and its INDEX §3 line; 233 noted as extended (its *Revisit if* "a kicker and a Take X" answered by Ken's ruling). SCHEMA §2 gains the new fields and sources. STATE rewritten, with flags FN–FN+2 in its Deighton line. Flags FN–FN+2 opened per §2a: data, SCHEMA §5, INDEX §2.
- The game data and app versions (§2); CHANGELOG, then `npm run changelog`.
- The plan's P21 row; a `shipped.md` row; a `log/2026.md` entry.
- PR title: `P21: Skills learn from powers, tweaks and Milestones (Decision N, …)`. The body includes **Where the order didn't fit**.

Suggested CHANGELOG lines (player voice):
- **Your archetype counts on your Skills.** A Cleaner's Stealth rolls its 1d6 Kicker, a Wheelman's Pilot explodes on a 9 or 10, and Quick Study's Take 6 shows on Combat Sense.
- **Powers say what they add while they run:** Scent Tracking at rank 3 reads +4 on Tracking.
- **Take X keeps your Kicker Die:** "Take 6: 13 + 1d4".
- **Night Eyes and Nocturnal say what the light does to you.**
- **Speed Heal lasts a day, as the dose says.** On a longer rest it doubles one day's healing, not all of them.

**Review checklist:**
- [ ] §10's tests exist with those names, run on `main` (P21 1 and 3 fail there).
- [ ] §5's rows confirmed or corrected; the weapon row pinned without a kicker.
- [ ] Every `whenText` matches the book (the inventory quotes it).
- [ ] `git diff origin/main --stat -- src` touches only `shadows-data.js`, `engine.js`, `sheet.js` (Nocturnal's line, the Rest panel's sum line and label) and the generated changelog.
- [ ] The rider: P21 11 fails on `main` (36) and passes; mutants 12 and 13; SCHEMA §1's *Healing (055)* no longer says every day doubles; a log line.
- [ ] `traitRows` and `traitGrants` share one source walk, and `traitGrants`' readers (`derivedMod`, `statMax`, `startingCredits`) didn't move (P21 4).
- [ ] Decision N passes `docs.test.mjs`.
- [ ] Flags FN–FN+2 open in all three places, each `playerNote` seen on screen (where, in the PR), and P21 10 pins the stubs.
- [ ] Mutants 1–11 in the PR; P19 7b rewritten as P21 9 and named in the PR.
- [ ] Phone-check and the dev preview's measurements in the PR.
- [ ] `npm run verify` green.

## 15. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<order>` = `sheet-wishlist/P21-skills-from-powers-and-milestones.md` and `<id>` = **P21**, and these traps under the builder's:

> 1. **A power's effect is always a mark** (nothing says it's running), even unconditional-sounding ones like Pheromone Aura's +2.
> 2. **Take X's total is X + the check; the kicker joins the line, never the total** (Ken's ruling, quoted in §1.3).
> 3. **A conditional kicker is a mark, and Take X's line names only unconditional kickers.**
> 4. **`perRank` × rank + `plus`, the way `naturalArmor` reads Iron Hide.** A rank-1 Scent Tracking is +2, not +1.
> 5. **A Major counts once however often the file lists it** (`grants()`'s rule, Decision 199).
> 6. **The book is the source for every "when"** (the inventory quotes each). The data paraphrases the Professional's tweaks.
>
> 7. **Three rules wait on Deighton (§2a): never step a kicker up a size, combine two kickers, or name an appraisal Skill.** Open flags FN–FN+2 with their `playerNote`s and stub them; Ken's belief that kickers combine to the next size up is unconfirmed.
> 8. **Speed Heal doubles one day, not the rest** (the rider): the book's "for 24 hours". A one-day rest reads exactly as today; zero days heal nothing, Speed Heal or not.
> 9. **`traitGrants` keeps its five sources.** Share its walk with `traitRows`; don't widen it.
>
> Tier: **Rule or shape**, with a Fix-tier rider. One decision and three flags (the next free numbers), game data `0.44`, app `0.52.0`, no schema bump. Use the close-the-session skill at the end.
