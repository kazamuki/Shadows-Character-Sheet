# P21 inventory: what the other sources do, and what the sheet can compute

**For:** work order P21 ([`P21-skills-from-powers-and-milestones.md`](P21-skills-from-powers-and-milestones.md)), in [`../sheet-wishlist.md`](../sheet-wishlist.md) §3.
**Swept:** 2026-10-17 by Claude (Opus), against `main` at `2d38dc9` (#213 merged: P19, Decision 233, app 0.49.0, data 0.41) and the CRB mirror at `private/` `cea99a8`. **Tier:** Docs. Nothing here is built.

**Why.** P19 computes what 16 Advantages and Disadvantages do to a Skill's check. Its review found that the archetypes' own parts carry the same kinds of effect and nothing reads them, so a Skill row with no kicker reads as "nothing applies". Ken asked for every milestone, archetype rank, tweak and power to be checked for "things the sheet can compute", not only Skill checks.

## How to read it

**What the words mean in the data.** Ken's "archetype ranks" are the Professional's **subtypes** (`archetypes[professional].specialization.options`: Cleaner, Fence, Wheelman and the rest), and his "tweaks" are each subtype's **`tweak`** (Vanish, Concierge, Stunt Driver). The Arcanist's creation **Unique Aberrations** are the same kind of thing, `specialization.options`. **Powers** are `archetypes[*].powers`, held with a rank (`archetypePowers`); a Werewolf Origin's **`starterPower`** is separate (Moonsworn, Aspect of the Beast, CyberWolf Protocol). The Vampire and Werewolf **baseline traits** (`baselineTraits`) are included, since they're archetype effects too. **Aberrations** are the Arcanist's rolled ones in `trackers.aberrations` (`0480`, `Appendix_Aberrations`).

**Sources swept.** `milestones.minorShared`, `milestones.majorGeneral` (the Professional's, Decision 217), the Vampire's and Werewolf's `growth.majorMilestones`, every archetype's `specialization.options` (tweaks, Unique Aberrations, Bloodline and Origin features, starter powers), `powers`, `baselineTraits`, `coreMechanic` panels where they state an effect, and `aberrations`. Book: `0411`–`0414`, `0450`, `0530` (Parry is a Melee check), `0300` (*Kicker Die*, *Take X*), `Appendix_Aberrations`. **`1200` is the factions chapter** (corporations, the Unseen Court): it gives a character no effect, so nothing in it is listed. The Arcanist has no Majors yet (F32), and Custom's powers and Majors are written-in text that the sheet computes nothing from by design (Decisions 216, 217).

**The book's sentences.** Quoted from the mirror. The Vampire's and Werewolf's Majors, powers and traits, and every Aberration, are in the data verbatim. A script compared all of them against the mirror, and only Odin's Aegis and Sanguine Harvest differ, neither of them a Skill effect. The Professional's tweaks are paraphrased in the data, so their rows quote `0412`.

**Readers, grepped on `main`.** Each claim below was checked against the code, not taken from a name:
- `traitRows` (`engine.js` ~821) reads **only** `ch.advantages` and `ch.disadvantages`. Everything P19 computes comes through it. `attackNotes` (~918) reads it too.
- `grants()` (~165) reads advantages, disadvantages and **taken Majors** (`majorTakenIds` → `majorById`), for `rou`, `sfrMax`, `feed`, `withering`, `painLevel`, `skillPoints`, `hpPerLevel`, `luckCost` and `milestone`.
- `naturalArmor()` (~1161) and `movement()` (~1211) read advantages, disadvantages, taken Majors, `specializationChosen` (each option's `grants`) and `archetypePowers` (at rank). **Neither reads `baselineTraits`, a `starterPower`, or `trackers.aberrations`.**
- `formGrants` (~395) reads taken Majors' `form` rows. `aberrationState` (~3035) reads an Aberration's `painLevels` and `adjust`, nothing else.
- **An Aberration's `as` ("Aura Sight Advantage") is display text only** (`sheet.js` 593, 700, 753, 958, 964). No engine code reads it.
- **Probes on `main`:** a Cleaner with Stealth 3 has `skillLine(ch,"stealth").kickers` `[]` (Vanish's 1d6 isn't read). An Arcanist's `derived(ch).TOL` is 1 with Arcane Fortitude chosen and 1 without (its +2 isn't read).

**Verdicts.** **(a)** already computed (the reader is named) · **(b)** an existing `grants` type would compute it (Decision 233's or 231's), once the row is written and its source is scanned · **(c)** computable, but needs a new type, a new field, or a new place on the sheet · **(d)** a table rule: the sheet can't know when it applies · **(e)** a rules question first. One row is one effect: an entry with three effects has three rows.

**Where the leads went.** All seven were checked; two were misfiled in the brief:
- Cleaner's Vanish: (b), [b1](#b).
- Wheelman's Stunt Driver: (b) for the explode and the Take 6 ([b3](#b), [b4](#b)); its Lucky-while-piloting is (c).
- Fence's Concierge: the Take 5 is (b) ([b2](#b)); the appraisal kicker is (e) ([E4](#e)).
- **"When making a Combat Sense Skill Check, you may Take 6" is a Major, Quick Study, not a Minor.** It's (b), [b8](#b).
- **"Take 6 on Acrobatics stunts" is the Major Hardcore Parkour.** (b), [b9](#b).
- **"Once per encounter, a 1d4 kicker on a Defensive Action" is the Major Survival Instinct.** (c), [c5](#c): a conditional kicker is new.
- Specialist and Make My Own Luck: (e), [E1](#e) and [E2](#e).

There are only six Minors (`0450`), and all of them are (a).

## Counts

| Verdict | Effects | Of which on a Skill's row |
|---|---|---|
| (a) already computed | 36 | 1 (Clear Head's −2, through `formPenalty`) |
| (b) an existing type | 21 | 20 |
| (c) a new type or place | 77 | 17 |
| (d) a table rule | 114 | — |
| (e) a question first | 15 effects, 9 questions | 8 |
| **Total** | **263** | |

**P21 computes (b) and (c)'s Skill-row rows: 37 effects** (20 + 17), plus Ken's 2026-10-17 ruling on Take X with a kicker. The other (c) rows are grouped at the end of (c) by where they'd live, for later orders. Rows in P20's areas are marked **P20**: [§ For P20](#for-p20).

---

## (a) Already computed — 36

| # | Source · id | Effect | Reader |
|---|---|---|---|
| a1 | Minor · skilled | Two Skills +1 rank each | `minorChoice`/`takeMinorChoice`, `skillRanks` (217) |
| a2 | Minor · improved | 3d10+30 IP, 10s explode | `ipRoll` (217) |
| a3 | Minor · talented | An Advantage ≤5 or a rank | `takeMinorChoice`, `advantageRank` |
| a4 | Minor · redeemed | A Disadvantage rank ≤5 removed | `takeMinorChoice`, `disadvantageRank` |
| a5 | Minor · honed | A Stat +1, WILL, TOL or LUCK included | `takeMinorChoice`, `statPoint` → `adjFor` |
| a6 | Minor · steadied | 10 SAN or a lost Health Level restored | `takeMinorChoice`, `restore` (P20's SAN) |
| a7 | Major · shake-it-off | "Gain 5 Natural armor", twice | `naturalArmor` (Majors, `amount` × times) |
| a8 | Professional · true-warrior · Iron Shirt | "Natural Armor equal to BOD Bonus + 1" | `naturalArmor` (specialization, `while`) |
| a9 | Professional · true-warrior · Fleet of Foot | "Run, Sprint, and Jump are doubled" | `movement` (specialization, `while`; Jump from the doubled pace) |
| a10 | Professional · jack-of-all-trades · Master of None | Every Skill Focused through rank 4 | `focusedSkillSpec`, IP cost (~2268) |
| a11 | Professional baseline · Focused Skills | IP 3 × rank; max rank + the Focused bonus | IP cost, `skillRankCap` |
| a12 | Professional baseline · Natural Advantages | Free ranks from the pool | `naturalAdvantagePool` |
| a13 | Vampire baseline · Pain Immunity | "no pain penalties from ordinary damage" | `painImmunity` → `painState` (202) |
| a14 | Vampire baseline · Fangs of the Fallen | Bite: Melee, BOD+3 | `archetypeWeapons` |
| a15 | Vampire · bestial-blessings | Claws BOD+3, AP, +1 damage a rank | `archetypeWeapons` (`perRank`) |
| a16 | Vampire · draugur · The Ancient Weapon | The bound weapon, off while the Code is broken | `archetypeWeapons` (`offWhen`) |
| a17 | Vampire · iron-hide | "Natural Armor equal to rank + 1" | `naturalArmor` (powers, `while`, `noStack`) |
| a18 | Vampire · icebound-resilience | "+1 Natural Armor" | `naturalArmor` (powers, `while`, `noStack`) |
| a19 | Vampire · upyr · Built to Last | "You can hold both; they don't stack." | `naturalArmor` `noStack` (215) |
| a20 | Vampire Major · blood-conditioning | "+2 RoU." | `grants().rou` → `sfr` |
| a21 | Vampire Major · growing-hunger | "+6 maximum SFR." | `grants().sfrMax` |
| a22 | Vampire Major · blood-feast | "+1 SFR per HL when feeding on fresh blood." | `grants().feed` → `feedView` |
| a23 | Vampire Major · blood-alchemist | "Stored blood can fill your SFR to its maximum" | `grants().feed` `upToShare` |
| a24 | Vampire Major · wither-ward | "All Withering damage you take is halved, never below 1." | `grants().witheringHalvedBy` → `resolveHit` |
| a25 | Vampire Major · splice | "Select one power from a different bloodline." | `takeMajorChoice`, `otherSpecPowers` (223) |
| a26 | Vampire · cursed-evolution | Opens another Bloodline | `gainSpecialization` (223) |
| a27 | Werewolf Form | +2 REF, +2 MOB, +4 BOD; Claws, Fangs; no TECH | `formState`/`formView` (195) |
| a28 | Werewolf · forge-fang · Shifting | "spending 1 HL. This counts as Withering damage." | `toggleCost` |
| a29 | Werewolf Major · tireless | "+2 RoU." | `grants().rou` |
| a30 | Werewolf Major · deep-reserves | "+5 maximum SFR." | `grants().sfrMax` |
| a31 | Werewolf Major · hardline-shift | The shift's HL isn't Withering | `formGrants` `withering` |
| a32 | Werewolf Major · clear-head | "TECH-based skills at −2" | `formGrants` → `skillLine` `formPenalty` (the one Skill row here) |
| a33 | Werewolf Major · iron-jaw | "Your claws and fangs gain AP." | `formGrants` `weaponTags` |
| a34 | Aberration · drained | "Your maximum TOL is reduced by 2." | `aberrationState` `adjust` → `derived` |
| a35 | Aberration · phantom-pain | "one Pain Level higher than your Health Levels indicate" | `aberrationState` `painLevels` → `painState` |
| a36 | Vampire · The Thirst | Feed, A day unfed, A day without rest, Hunger's prompt at RoU | `feedView`, the Thirst panel (201, 215) |

---

## (b) An existing type computes it — 21

The row is written in the data, and the source is added to the reader's scan. **Scan** says which list the reader would have to learn: *spec* `specializationChosen`, *major* taken Majors, *power* `archetypePowers` at rank, *baseline* the archetype's `baselineTraits`, *starter* the chosen Origin's `starterPower`, *aberration* `aberrationState(ch).active`. "Mark" means a `whenText` row (Decision 233: shown, never in the number).

| # | Source · id | The book | Changes | When | Shape | Scan |
|---|---|---|---|---|---|---|
| b1 | Professional · cleaner · Vanish | "Gain a 1d6 Kicker die for all Stealth Checks." (`0412`) | Stealth kicker | always | `kicker` 1d6 `skills:[stealth]` | spec |
| b2 | Professional · fence · Concierge | "You can choose to take 5 on Persuasion checks whenever negotiating prices with other vendors, merchants, and black marketeers." | Persuasion Take X | negotiating prices | `takeX` 5, `whenText` | spec |
| b3 | Professional · wheelman · Stunt Driver | "Pilot Skill Checks explode on a natural 9 or 10." | Pilot die face | always | `explodeOn` [9,10] `skills:[pilot]` | spec |
| b4 | Professional · wheelman · Stunt Driver | "…or you can take 6 on your next Pilot check instead." | Pilot Take X | first stunt on your turn, instead of the free stunt | `takeX` 6, `whenText` | spec |
| b5 | Arcanist · thaumaturgical-sight | "Gain +2 for any Occult Check when analyzing magic" (`0411`) | Occult Lore +2 | analyzing magic | `checkMod` mark | spec |
| b6 | Arcanist · resonant-whispers | "Gain +3 to any Occult check to discern the properties of any talisman or artifact." | Occult Lore +3 | a minute's touch on a talisman or artifact | `checkMod` mark | spec |
| b7 | Arcanist baseline · Aetheric Attunement | "…gain a +5 modifier when attempting to identify or detect magical effects within meters equal to your WILL." `0480`: "Resonance is perceived with an Awareness check, and Arcanists add their Aetheric Attunement bonus." | Awareness +5 | detecting magic, within WILL meters | `checkMod` mark | baseline |
| b8 | Major · quick-study | "When needing make a Combat Sense Skill Check, you may Take 6" | Combat Sense Take X | always | `takeX` 6 `skills:[combat-sense]` | major |
| b9 | Major · hardcore-parkour | "When performing Stunts in an encounter that would require an Acrobatics Skill Check, you can Take 6" | Acrobatics Take X | a stunt in an encounter | `takeX` 6, `whenText` | major |
| b10 | Major · hardcore-parkour | "When performing a dodge as a defensive action, add +3 to the Dodge Skill Check." | Dodge +3 | a Dodge as a Defensive Action | `checkMod` mark (in the number? PQ3) | major |
| b11 | Major · iconic-weapon | "Gain +5 on social skills (Deception, Intimidation, Persuasion, Seduction) when the weapon is visible." | Four Skills +5 | the Signature weapon visible | `checkMod` mark | major |
| b12 | Vampire Major · night-wings | "…with +3 to Acrobatics checks and Defensive Actions in the air." | Acrobatics, Dodge, Melee (Parry) +3 | in the air | `checkMod` mark | major |
| b13 | Vampire Major · life-sense | "+5 to hearing-based Awareness checks within 20 meters" | Awareness +5 | hearing, within 20 m | `checkMod` mark | major |
| b14 | Vampire · veil-of-night | "Darkness within 20 meters: +2 Stealth" | Stealth +2 | while it runs | `checkMod` mark | power |
| b15 | Vampire · preternatural-speed | "+2 to defensive actions (Dodge and Parry)" | Dodge, Melee (Parry) +2 | while it runs | `checkMod` mark | power |
| b16 | Werewolf baseline · Feral Instincts | "Gain +2 to Awareness Skill checks that rely on sight, smell, or hearing." | Awareness +2 | sight, smell or hearing (in the number? PQ4) | `checkMod` mark | baseline |
| b17 | Werewolf baseline · Pack Mentality | "Gain +1 to Close-range Melee and Martial Arts attacks against a target an ally is also attacking in Close range." | Melee, Martial Arts +1 | an ally on the same target, Close range | `checkMod` mark | baseline |
| b18 | Werewolf · forge-fang · CyberWolf Protocol · Active Camouflage | "+2 to Stealth checks, and invisible to electronic surveillance. Both end the moment you attack." | Stealth +2 | while it runs, until you attack | `checkMod` mark | starter |
| b19 | Aberration · mimetic-skin | "+3 to Stealth when not wearing heavy armor." | Stealth +3 | no heavy armor (computable from loadout? PQ5) | `checkMod` mark | aberration |
| b20 | Aberration · marked | "−2 to Deception and Disguise to pass as ordinary." | Deception, Disguise −2 | passing as ordinary | `checkMod` mark | aberration |
| b21 | Werewolf · forge-fang · CyberWolf Protocol · Adaptive Skeleton | "+2 BOD, +2 REF, and Natural Armor 2 until end of scene" | **Natural Armor 2** (not a Skill) | while it runs | `naturalArmor` 2 `while` | starter (in `naturalArmor`, not `traitRows`) |

b21 is the one (b) outside the Skill row: `naturalArmor` already computes the type, but it doesn't scan a `starterPower`. Its +2 BOD and +2 REF are (c), [c-stats](#c).

---

## (c) Computable, with something new — 77

### On the Skill row: P21 builds these (17)

Three additions do all of it: **`perRank` + `plus` on `checkMod`** (a power's bonus grows with its rank, read the way `naturalArmor` reads Iron Hide's: perRank × rank + plus); **a conditional kicker** (P19 drops a `kicker` with `whenText`; P21 makes it a mark); **`skillsFrom: "focused"`** (the character's Focused Skills, `focusedSkillIds`). The light rows need **`shift` and `mod` on `visibility`**.

| # | Source · id | The book | Changes | When | Needs | Scan |
|---|---|---|---|---|---|---|
| c1 | Professional · slayer · Hunter's Calling | "When facing a supernatural enemy, you gain a +1d6 kicker die to combat checks against those targets." | Attacks: kicker 1d6 | against a supernatural enemy | conditional kicker; **which Skills are "combat checks"** (E5) | spec |
| c2 | Professional · slayer · Hunter's Calling | "This applies to Occult and Tracking skills as well when hunting your quarry." | Occult Lore, Tracking: kicker 1d6 | hunting your quarry | conditional kicker | spec |
| c3 | Professional · true-warrior · Unwavering Focus | "Focused Skills gain 1d4 kicker die while active." | Each Focused Skill: kicker 1d4 | while it's active | conditional kicker, `skillsFrom:"focused"` | spec |
| c4 | Professional · true-warrior · Wind Dancing Defense | "Gain a 1d6 kicker die when using Dodge during combat." | Dodge: kicker 1d6 | in combat, while active | conditional kicker | spec |
| c5 | Major · survival-instinct | "Once per encounter, you may add a 1d4 Kicker Die when taking a Defensive Action (such as Dodge or Parry)." | Dodge, Melee (Parry): kicker 1d4 | once per encounter | conditional kicker | major |
| c6 | Vampire · spectral-veil | "+2 Stealth"; per rank "+1 Stealth (max 3)" | Stealth +rank+1 | while it runs | `perRank` | power |
| c7 | Vampire · battleborn-instinct | "With an Ancient Weapon: +2 to all combat checks"; per rank "+1 to combat checks" | Melee +rank+1 | with the Ancient Weapon, while it runs | `perRank`; "combat checks" (E5) | power |
| c8 | Werewolf · predators-mark | "+1 to melee attacks against it"; per rank "+1 to melee attacks (max 3)" | Melee +rank | against your marked prey | `perRank` | power |
| c9 | Werewolf · scent-tracking | "+2 to Tracking checks for creatures within a mile."; "+1 to the check (max 3)" | Tracking +rank+1 | within a mile, while it runs | `perRank` | power |
| c10 | Werewolf · pheromone-aura | "+2 to Intimidation checks."; "+1 to the check (max 3)" | Intimidation +rank+1 | while it runs | `perRank` | power |
| c11 | Werewolf · ancestral-wisdom | "+3 to Occult Lore checks about supernatural matters."; "+1 to the check (max 3)" | Occult Lore +rank+2 | about supernatural matters | `perRank` | power |
| c12 | Werewolf · predators-allure | "+2 to Persuasion or Seduction checks within 10 meters."; "+1 to the check (max 3)" | Persuasion, Seduction +rank+1 | within 10 m, while it runs | `perRank` | power |
| c13 | Werewolf · instinctive-awareness | "+2 to Intuition checks to sense threats or the emotional state of a target within 10 meters." | Intuition +rank+1 | sensing threats or a target's state, within 10 m | `perRank` | power |
| c14 | Werewolf · predators-silence | "+2 to Stealth checks."; "+1 to the check (max 3)" | Stealth +rank+1 | while it runs | `perRank` | power |
| c15 | Werewolf · combat-analytics | "gain +1 to your attacks against it for the scene"; "+1 to attacks (max 3)" | Attacks +rank | the scanned target, for the scene | `perRank` | power |
| c16 | Aberration · night-eyes | "Treat Dark visibility as Dim, and Blind as Dark." | Attacks and Awareness: the light level one step brighter | in Dark or Blind | `visibility` `shift` | aberration |
| c17 | Aberration · nocturnal | "+1 to all checks in Dim or Dark visibility, −1 to all checks in Bright." | Every check ±1 by light | by light | `visibility` `mod`, one line for every check | aberration |

**Also P21, not a row:** Ken's ruling of 2026-10-17 on Take X with a kicker. Today `skillLine`'s Take X total is `x + checkBonus`, and the line ignores the kickers. It becomes "Take 6: 13 + 1d4". It's reachable once b8 lands: Quick Study's Take 6 and Hyper Vigilance's 1d4, both on Combat Sense.

### Elsewhere on the sheet: later orders (60)

| Where it would live | # | Source · id | Effect (the book's words, cut) | Needs |
|---|---|---|---|---|
| **A pick on a Major** (schema) | c18 | Major · skill-paragon | "That skill no longer can suffer a botch by rolling a 1" | the chosen Skill saved on the Major (today only `power` is, Decision 223), and a `noBotch` mark |
| | c19 | Major · grace-under-fire | "LUCK Spent to Boost or Explode … on that Skill is reduced to 1", in an encounter | the Skill saved; a `luckCost` per Skill |
| | c20 | Major · weapon-expert | "+1d4 kicker to any combat rolls using this weapon" | the weapon saved; a kicker on a weapon row |
| **A pick on an Origin** (schema) | c21 | Werewolf · wildblood · Aspect of the Beast (6 rows) | Rougarou "+2 to Melee attacks and Intimidation checks", … Ōkami "+2 REF and +2 to Combat Sense checks" | which spirit rode the shift, saved; then `checkMod` and stat rows |
| **A weapon or armor row** (loadout) | c22 | Major · tuned-edge | "it gains a +1 to damage" | a flag on one weapon row |
| | c23 | Major · custom-fit | "increase its damage reduction die by one step" | a flag on one armor row |
| | c24–c26 | Majors · signature-weapon, iconic-weapon, legendary-weapon | Mod slots and Upgrades (+2/+1, +1/+1, +1/+1) | a flag on one weapon row |
| | c27 | Vampire · rend-and-tear | "Claws and fangs gain AP 2 and inflict Bleeding for 2 rounds." | a natural weapon's tags `while` |
| | c28 | Vampire · bone-spines | "+3 melee damage, +5 while grappling" | damage `while` on Melee weapons |
| | c29 | Vampire · monstrous-maw | "your bite gains +10 damage and AP 3" | bite damage `while` |
| | c30 | Vampire · rending-claws | "+2 damage per rank and inflict Bleeding for rounds equal to rank" | claw damage `while`, `perRank` |
| | c31 | Vampire · blood-of-valhalla | "+2 melee damage" | damage `while` |
| | c32 | Werewolf · let-it-loose | "Spirit damage instead of Physical"; "+1 damage with natural weapons" a rank | natural weapons `while`, `perRank` |
| | c33 | Werewolf · steel-fangs | "Bite attacks gain +2 damage and AP" | bite `while` |
| | c34 | Werewolf · serrated-claws | "claw attacks cause Bleeding for rounds equal to rank" | claw tags `while` |
| **Stats while a power runs** (P20's stats) | c35 | Vampire · icebound-resilience | "+2 BOD, +2 REF" for 3 rounds | a `statMod` `while`, or a toggle like Form |
| | c36 | Werewolf · trueborn · Moonsworn | "+1 REF, +1 BOD", in Werewolf form under the night sky | `statMod` `while` |
| | c37 | Werewolf · apex-fury | "+2 REF, BOD, and MOB until the encounter ends" | `statMod` `while` |
| | c38 | Werewolf · forge-fang · Adaptive Skeleton | "+2 BOD, +2 REF" | `statMod` `while` (its Natural Armor is b21) |
| | c39 | Vampire · preternatural-speed | "+2 MOB" | `statMod` `while` (movement follows MOB) |
| | c40 | Arcanist · arcane-fortitude | "Gain +2 to TOL" | **always on, and not read** (probe above): an `adjust` on a specialization option, read by `derived`. **P20** |
| **Movement** | c41 | Vampire Major · levitation / night-wings | glide "at your MOB speed"; "flight at 160 kph" | a `movement` row that adds a pace |
| | c42 | Werewolf · primal-leap | "Leap BOD × 2 meters horizontally or BOD meters vertically"; "+2 meters across and +1 meter up" a rank | a jump from BOD, `perRank` |
| | c43 | Vampire · bestial-blessings | "+2 MOB for climbing" | a climbing pace |
| **Healing** (P20's healing) | c44 | Werewolf baseline · Regeneration; Major bone-and-sinew | "While transformed, regenerate 1 HL per round"; "Regeneration restores 2 HL per round" | the Form is known, so a Heal-per-round control on Main. **P20** |
| | c45 | Vampire · vitality-surge; blood-of-valhalla | "heal up to your rank in HL per round", 2 SFR per HL; "regenerate HL equal to rank each round (never Withering)" | a heal that spends SFR; a heal a round while running. **P20** |
| | c46 | Aberration · fast-metabolism | "You heal twice as fast from rest" | Rapid Healing's multiplier (P20's type). **P20** |
| | c47 | Aberration · quick-clot | "Bleeding ends on its own at the next Reset." | Reset clears Bleeding. **P20** (Conditions) |
| **The hit** (P20's Take a hit) | c48 | Professional · mercenary · Battle Hardened | "immunity to one combat condition: Dazed, Knocked Down, Agony, or Sickened"; a second and third "in place of a Major Milestone" | the immunity saved (schema); the hit and Conditions refuse it. **P20** |
| | c49 | Vampire · odins-aegis | "Reduce the damage of one Elemental, Spirit, or Aether attack by your BOD bonus + 2 × rank" | a reaction on the hit panel, number computed. **P20** |
| | c50 | Werewolf · null-field | "Absorbs up to 5 Elemental, Spirit, or Aether damage"; "+5 absorbed" a rank | the same. **P20** |
| | c51 | Vampire · red-mist / spectral-veil | "immune to Physical damage" while it runs | a hit-panel option. **P20** |
| | c52 | Aberration · elemental-blood | "Halve damage you take from that element" (rolled 1d3) | the element saved; Resistance-like. **P20** |
| | c53 | Werewolf Major · silverscar | "Withering damage from silver is halved (never below 1)" | the hit knows silver. **P20** |
| **SFR and RoU** | c54 | Werewolf · forge-fang · withdrawal step 1 | "−1 RoU." | Call of the Wild's step read by `sfr().rou` |
| | c55 | Werewolf · trueborn, forge-fang · withdrawal step 2 | "SFR can't refill above half." | a cap on Feed and refuel |
| | c56 | Werewolf · seta-16-surge | "regain SFR equal to your rank × 3" | an action on the SFR card |
| | c57 | Vampire Major · pure-blooded; strigoi · Glamour | "Bloodline powers cost 1 less SFR, to a minimum of 1."; "Shadow Play cast only on your own appearance, voice, and scent costs SFR equal to its rank." | power costs as numbers (they're text) |
| **Essence checks** (no row today) | c58 | Professional · enforcer · Hard Knock Life; slayer · Hunter's Calling; wheelman · Stunt Driver | 2 Automatic Hits (BOD, dealing with death…); Hits = EMP bonus (WILL, defending); 1 Hit (REF, piloting) | an Essence-check line per stat, with marks |
| | c59 | Majors · unbreakable; Vampire frenzy-resistance; Werewolf master-of-the-change | 2 Hits; +1 Hit; +1 Hit | the same |
| | c60 | Werewolf · Moonsworn; CyberWolf · Corporate Conditioning; wildblood withdrawal step 1 | +1 Hit; +1 Hit; "+1 to the TN of WILL and COOL Essence checks" | the same |
| | c61 | Aberrations · clean-blood, dense-frame, warded-flesh | "+1 die to resist Poisoned"; "+2 dice to resist being pushed…"; "+1 die on any defender check against a spell" | the same |
| **Magic** | c62 | Aberration · tremor / slow-tide | "−1 die on Enchantment and Alchemy rolls"; "TOL recovers at 1 point per 2 hours" | the Discipline pool and TOL Spent's rest line |
| **Luck** | c63 | Professional · wheelman · Stunt Driver | "While piloting any vehicle you have the advantage of Lucky" | a `luckCost` with a `when`; the Luck card names it |

Some rows hold more than one effect: c24–c26 three; c41, c44, c45, c51, c57 and c62 two each; c58–c61 three each. The 46 rows hold **60 effects**.

---

## (d) Table rules — 114

The sheet can't know the moment: an opponent's roll, an ally's position, a once-per-scene choice, a narrative trigger, or someone else's sheet. Each stays as its text (the Major's `benefit`, the power's `effect`, the tweak's `benefits`). No row in the table changes the character's own numbers.

| Source | Effects |
|---|---|
| **General Majors (14)** | Defensive Dance, Bullet Ballet, Martial Momentum (+4 after two successes in a round); Tools of the Trade (a specific kit, no Skill named); Hardcore Parkour's fall damage; Unfazed (a SAN breaker passed once an encounter, **P20**); Bullet Dodger (the attacker's breaker); Cyber Psion (both halves; cybernetics are being cut); Can't See Me (both halves: a WILL check in place of Stealth, invisible to Aura Sight); Legendary Weapon's Signature Effect and Attunement |
| **Professional tweaks (8)** | Vanish's automatic Stealth successes (REF bonus a session; the count is computable, c-like, but the use is the table's); Hard Knock Life's two implants (cybernetics cut); Concierge's Streetwise details; Master of None's per-encounter kickers; Battle Hardened's +3 when Surprised; Death Touch (AP unarmed); Flying Talons; the Power Style activation check and Chi budget (a TOL-sized budget is countable, but no tracker exists) |
| **Arcanist (2)** | Aethereal Link; Aetheric Magnetism (the +1 after a lucky Breaker) |
| **Vampire Majors and Bloodline features (13)** | Reservoir; Dead Warrior (power damage is text); Dark Rending; Blood Control; Stolen Face; Breath of Winter; Returning Strike; Defiance of Sol; Kiss of Night; Unholy Covenant; Death Rites; Frozen Fire (+2 damage at half SFR: power damage is text); Acting on the Code (+1 for the scene) |
| **Vampire powers and features (13)** | Shadow Play; Nightmare Echo; Cold Embrace; Nightmare Visage; Hel's Dread (all on targets); Deathless Resilience (both halves); Blood of Valhalla's crash (−4 for 1d4 rounds); Preternatural Speed's extra movement action; Bestial Blessings retracting; Breaking the Code (+1 TH on Essence, shown by the Code toggle's `effectText`); Masked and Unmasked; Every Mind at the Table |
| **Vampire traits and vulnerabilities (7)** | Sanguine Harvest; Fangs's feeding effects (on the victim); Sunlight; Consecration; Staking; Day Rest's helplessness (the day's cost is a36); Blood Frenzy's checks (Hunger's prompt is a36; the Frenzy is the table's) |
| **Werewolf Majors (22)** | Lead the Pack; Trueborn Mark, Tracking, Pheromones, Howl; Swift Change; Between Forms; Wildblood Mark, Tracking, Pheromones, Howl (all on allies or targets); Spirit's Favor; Two Riders; Forge Fang Mark, Tracking, Pheromones, Howl; Override Protocol; The Wolf Beneath; Bone and Sinew's "ends Maimed"; The Calling; Off the Leash |
| **Werewolf powers and Origins (13)** | Ferocious Howl; Moonlit Vitality; Ancestral Dominance; Spirit Pack; Shield of the Tribe (on an ally's hit); Shadow Pack; The Passenger's Eyes; Drone Pack; Trueborn's and Wildblood's Shifting checks (Forge Fang's is a28); the three Origins' Refuel (by time outdoors, a wild place, or a dose at the scene's end) |
| **Werewolf traits (2)** | Silver (Withering, shown); Call of the Wild's Needs |
| **Aberrations (20)** | Aether Reservoir; Echolocation; Electrocytes (its SP is shown by `spAmounts`); Inactive Camouflage; Magnetic Grip; Steady Heart; Sure Step; Bioluminescence; Fine Bristles; Heterochromia; Light Frame; Ozone Trail; Static Charge; Thought Projection; Unreflected; Voltivorous; Glossolalia; Dense Frame's swimming; Clean Blood's immunity to ordinary toxins; Elemental Blood's melee backlash |

---

## (e) Rules questions first — 15 effects, 9 questions

Each is a question for Ken (a reading of his book) or Deighton (a ruling). **None is answered here, and none is opened as a flag.** E1–E3 are flag candidates (Deighton's); E4–E9 can be the order's PQs (Ken's).

| # | Effects waiting | The question | For |
|---|---|---|---|
| E1 | Major · specialist | "Your Kicker Die increases by 1 size (from d4 to d6, d6 to d8, or d8 to d10)." **Which kicker is "your Kicker Die"?** Every one the character holds (Field Medic's 1d4 reads 1d6), one they choose, or the archetype's own? (Decision 233 names this in its *Revisit if*; it's reachable today: a Professional with Field Medic who takes Specialist sees 1d4.) | Deighton (flag candidate) |
| E2 | Major · make-my-own-luck | "When rolling your Kicker Die, roll twice and take the higher result." The same question: every kicker? | Deighton (with E1) |
| E3 | The stacking rule itself | **Kicker stacking** (Ken: "Does kicker dice stack? if they do, does it move to the next die size up?"). Still unanswered. **Evidence:** Weapon Expert's text answers it for itself: "If you have a +1d4 already applied when using this weapon it increases by one die increment to +1d6 instead." That reads as "the next size up, not a second die". **After P21 it's reachable** as a kicker beside a conditional one: Hyper Vigilance's 1d4 and Unwavering Focus's 1d4 on a True Warrior's Combat Sense, and Wind Dancing Defense's 1d6 and Survival Instinct's 1d4 on Dodge. | Deighton (flag candidate) |
| E4 | Professional · fence · Concierge | "Whenever making an appraisal … you may add a 1d4 kicker die to the roll to assess their value." **Which Skill appraises?** No Skill is named (Streetwise? Basic Tech? Investigation?). | Ken |
| E5 | Slayer's Hunter's Calling (c1), Battleborn Instinct (c7), Weapon Expert (c20) | **What are "combat checks" / "combat rolls"?** Attacks only (the weapon Skills and Martial Arts), or Dodge, Parry, Combat Sense and Tactics too? P21 needs the answer for c1 and c7. | Ken |
| E6 | Vampire Major · life-sense (the second half) | "+5 to Human Perception, Med Tech, and First Aid when detecting intent or injuries." **None of the three is a Shadows Skill.** Read them as Intuition (intent) and Medical (injuries)? A CRB fix either way. | Ken |
| E7 | Major · heroic-conditioning | "When doing any physical activity that requires a Skill Check, Essence Check, or Breaker Check, ignore 1 Pain Level of penalties." **Which checks are physical?** The BOD, REF and MOB Skills? Then the sheet could show the Pain line with one level off on those rows. **P20** (Pain). | Ken, or Deighton |
| E8 | Major · god-tier | "The selected Skill has a +25 Modifier on it instead of the standard Rank + Primary Skill + Synergy Bonus." **Do Pain, Conditions and a trait's number still apply on top?** And it needs the Skill saved (c18's shape). | Ken |
| E9 | Aberrations · animal-ken, aura-sight, danger-sense ("Rank 3"), eidetic-memory, medium, beacon, hemophiliac, paranoia (8) | **Does an Aberration "as" an Advantage count as holding it?** If so, Aura Sight's Take 8 on Intuition (Decision 233) reaches an Arcanist who rolled it, Danger Sense meets Quick Study's prerequisite, and Hemophiliac's rule applies. Today `as` is display text. | Ken |

E1–E4 and E6–E8 hold one effect each (E3's is the stacking rule). E5 holds back c1, c7 and c20, already counted in (c). E9 holds eight. **15 effects.** On a Skill's row: E1–E4, E6–E8, and E9's Aura Sight.

---

## For P20

Effects in P20's areas (SAN, Pain, stat caps, healing, Take a hit, Wealthy), sent to the P20 session to fold in:

- **Stats.** Arcane Fortitude's "+2 to TOL" is never read (c40). Probe: `derived(ch).TOL` 1 with it and without. It's an always-on number, so arguably a *Fix*, and it waits on no ruling.
- **Stats while a power runs:** Icebound Resilience, Moonsworn, Apex Fury, Adaptive Skeleton and Preternatural Speed (c35–c39). This also meets 0450's open "Supernatural ceilings" question and Ken's question to Deighton on headroom past 10.
- **SAN.** Unshakable Mind (Arcanist): "+10% bonus to any Sanity Breaker Check." This is (c) if P20 puts a Sanity Breaker on the sheet. Unfazed: once an encounter, an automatic pass (d). Steadied's 10 SAN is already (a).
- **Pain.** Heroic Conditioning: ignore 1 Pain Level on physical checks (E7: which checks). Pain Immunity and Phantom Pain are already (a).
- **Healing.** Regeneration and Bone and Sinew (the Form is known, so "1 HL a round", or 2, could be a control); Vitality Surge (rank HL a round at 2 SFR each); Fast Metabolism ("heal twice as fast from rest", which is Rapid Healing's multiplier in all but name, so it should be the same type); Quick Clot (Bleeding ends at Reset). c44–c47.
- **Take a hit.** Battle Hardened's condition immunity (Dazed, Knocked Down, Agony or Sickened; it needs the pick saved); Odin's Aegis and Null Field (reduction numbers the sheet can compute); Red Mist and Spectral Veil (immune to Physical while running); Elemental Blood (halve one element); Silverscar (halve silver's Withering). c48–c53.
- **Wealthy:** nothing in these sources.
