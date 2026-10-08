# Plan — CRB catch-up: the sheet vs the book

**Status:** open, Ken's (a CRB writing pass, weekend of 2026-10-03). This is where Ken's CRB fixes live; `STATE.md` §5 points here instead of listing them. Tick an item off here when the book has it, and close the plan once nothing is left unticked or unasked.
**Compiled:** 2026-10-01, against every `.docx` in `%OneDrive%\Documents\Gaming\Shadows\Core Rule Book\CRB in progress\CRB v4\` as saved that night (0450 included), and game data 0.28 / app 0.36.0. Item ids (`CQ`_n_, F-numbers, Decisions) are the repo's; the Exceptions List's ids (`AD-`, `AR-`, `GR-`…) are the team's tracker in the same folder.
**Re-checked:** 2026-10-08, against the mirror as pulled 2026-10-07 (`private/` at `cea99a8`), which renamed every chapter to the source's four-digit numbers (`054` is now `0540_Conditions_and_Recovery.md`; the full mapping is in `log/2026.md`, 2026-10-08). Items the pull showed done are ticked, each marked *(10-07)*.
**Tier:** *Docs*. Nothing here changes the app. The app's own catch-up work moved to `crb-v4-sync.md`, which goes through the usual tiers.

**How this was checked.** Every chapter was converted and read against `shadows-data.js`. The catalogs were compared by script: all 57 Advantages, 30 Disadvantages, 36 Skills and 125 spells. Costs, max ranks, Universal tags, stat pairs, descriptions, TN/TH and Overflow lines all **match**, apart from the few items listed below. Most of what's left is rules the design team ruled on that the book never got.

**Legend:** ☐ to write · ⚖ the ruling is made, the book just needs it · ❓ needs a call before you can write it (who's named) · ✅ already done in the book (it used to be on STATE §5's list)

---

## 0200_Synergy_System

- ✅ ⚖ **The Core of Synergy › Stats › sidebar "Beyond Human Limits".** It says "the exact mechanics for this are explained later", but nothing later explains them. The curve was ruled on 2026-09-22 (Decision 98): **11–15 = +5, 16–20 = +6, 21–25 = +7, then +1 for every 5 points after that.** Write it into 0400's Bonuses table (below) and point this sidebar there.
- ✅ The TOL formula (Attributes) already reads INT, BOD and COOL. The Exceptions List's **AD-05** can close for 0200 and 040. It still names a `Stats_and_Attributes` file that isn't in the v4 folder.

## 0300_Core_Mechanics

- ✅ ⚖ **Resources › Luck.** The book never says what Luck you start with. **Everyone starts with 4 LUCK** at every Power Level (Decision 157), and more can be bought at creation for **1 CP a point** (Decision 97). A bought point sits on top of the 4.
- ✅ ❓ **Resources › Credits.** The book never says what Çredits you start with. The sheet rolls **Street 3d4 × 100 · Heroic 4d4 × 100 · Shadows 5d4 × 100 · World Coming Down 5d10 × 100**. Those numbers came from the older REF draft. Confirm they still stand (Ken/D), then put them here or in 0400's table.

## 0400_Character_Creation

This chapter carries most of the creation economy, and almost none of it is written down.

- ✅ ⚖ **Rolling Stat Points.** Replace "Roll 3d10 + 30" with Deighton's playtested table (Decision 150). The GM picks one of two methods:
  - **Flat:** Street 45 · Heroic 50 · Shadows 55 · World Coming Down 60.
  - **Rolled:** 5 below the flat number + 1d10, so 40 / 45 / 50 / 55 + 1d10.
  - **The climbing buy:** every stat starts at 1 for free. Each point up to 6 costs 1 Stat Point, and each point from 7 to 10 costs 2, so **a 10 costs 13**. (Deighton confirmed that the base 1 is free.)
- ☐ ⚖ **Bonuses & Penalties table.** Add the rows past 10 from Decision 98 (see 0200). *(2026-10-04: not in the book yet. Ken is putting them at the end of character creation, after the Archetype is chosen, so mortals never see them while buying stats. 0200's sidebar already points to "character creation".)*
- ☐ ⚖ **Step 7, "Allocate any remaining points".** The book never says what leftover CP buys. The sheet uses these rules, all of them ruled:
  - Boosting a **stat or skill costs 1 CP per point** (Decision 97).
  - **A power rank costs 5 CP**, for any power: Disciplines today, Vampire powers later. It's capped by **Max Power Rank: 2 / 3 / 4 / 5** (Decision 157).
  - **Max Boost:** no single stat or skill can be boosted more than **2 / 3 / 4 / 5** times by Power Level, and the table caps (stat 10, Max Skill Rank) still apply (Decision 3).
  - **LUCK** at 1 CP a point is exempt from Max Boost (Decision 5).
- ☐ (suggestion) **One Campaign Power Level table.** The numbers are spread over 0400, 0420 and 0430, and two of those three are now wrong. A single table in 0400 would fix that: Stat Points (flat/rolled), Skill Points, Max Skill Rank, CP, Max Power Rank, Max Boost and starting Çredits. 0420 and 0430 would point to it.

## 0410–0414: Archetypes, Arcanist, Professional, Vampire, Werewolf

- ✅ ⚖ **Archetypes (opening list).** Two things are missing:
  - **Classification:** Arcanist and Professional are **Mortal**; Werewolf and Vampire are **Supernatural** (Decision 152).
  - **The Custom archetype**, written by the player with the GM. It names its own classification, which can be Mortal, Supernatural, or **Other** in its own words (Decision 153). 0450 and 2530 already mention custom archetypes, but 0410 doesn't.
- ✅ ⚖ **Werewolf › Baseline Traits › Supernatural.** "Unable to Purchase Advantages" should become **"Universal Advantages only"** (Decision 152, Deighton). The sheet already says so.
- ✅ ⚖ **Professional › Mercenary › Focused Skills.** "Handgun" should be **Handguns**.
- ✅ ⚖ **Professional › Slayer** and **› True Warrior › Focused Skills.** "Occult" should be **Occult Lore**.
- ✅ ⚖ **Professional › Jack of All Trades › Master of None.** Say that "up to rank 4" means ranks bought up to 4 cost 3 × rank, and that 4 → 5 is at the standard price (Ken's reading, which the sheet uses). Whether it also raises every skill's starting cap is still F33 for Deighton.
- ✅⚖ **Professional › Growth & Milestones reminder.** "Every session completed grants you ten IP" should read **5 IP per hour of play**, with Minor Milestones at 5, 15, 25 and Major Milestones at 10, 20, 30. This matches 0450 and its own conformance callout.
- ✅ ⚖ **General Milestones › 1 Major Milestone Required › Hardcore Parkour.** Prerequisites should be **1 Major Milestone, Acrobatics 4, Danger Sense 1**. Drop Cat Like Balance and Time Sense (Decision 129, Deighton).
- ✅ **General Milestones › 2 Major Milestones Required › Cyber Psion.** "Cyber Prothetical Advantage" should be **Cyber-Prophetical**. *(New typo.)*
- ✅ **End of the Arcanist section.** "Sythnosapien (Under Construction)": *now just delete it (see Cyborg removal below).* It also has no heading of its own, so it sits inside the Arcanist's Growth & Milestones. *(New since the 09-24 mirror: the Cyborg narrative was cut and replaced with this line.)*
- ❓ **Arcanist › Growth & Milestones** is empty (F32, Ken): bring in REF's Arcanist Majors, or wait for the Origins rewrite.
- ❓ **General Milestones placement** (F9, Ken/D): they sit under Professional, but the sheet treats them as open to everyone. The Exceptions List's AR-08 moves four of them to a universal list. Whatever happens, they need a home outside the Professional section.
- ☐ **0414 Werewolf › slips** (found by `crb-v4-sync` P3, 2026-10-08; the sheet's data has the right words): "Not all Werewolves **carries**" (Werewolves in NYTE City's lead-in) → *carry*; "Trueborn **ar** the oldest" → *are*; "how you **refule**" (Origin intro) → *refuel*; "If your shifting check **fales**" → *fails*; "Most of what **make** a Werewolf dangerous" → *makes*; "the moon **nd** the bloodline … the **odl** duty" (Trueborn Powers) → *and*, *old*. A stray empty `##` heading sits above Playing a Werewolf.
- ☐ **0414 Werewolf › Baseline Traits › Supernatural** prints two empty bullets under SFR/RoU and three more after the list closes. Fill or delete them.
- ☐ **0414 Werewolf › Wildblood** has an empty four-column table and four empty `#####` headings before its Features. Delete them, or they were meant to hold something (the spirits?).
- ☐ **0414 Werewolf › the heading still says "(Under Construction)".** The chapter is complete enough that the sheet carries all of it (Decisions 195–197). Drop the tag when you agree.
- ❓ **0414 Werewolf › Forge Fang's shift.** "Shift into Werewolf form by spending 1 HL." The sheet spends one Health Level *as the werewolf form counts them* (BOD +4 can make each Level bigger), so the track shows exactly one Level gone while shifted (Decision 195). Say which form's HL it is, if it matters to you.

## 0420–0423: Skills

- ☐ ⚖ **Skills › Campaign Power Level table.** *(10-07: Skill Points and Shadows are in; **World Coming Down still prints Max Skill Rank 6**, where Decision 150 has 7; Ken confirmed 7, VQ6.)* This whole table moved in Decision 150:

  | Power Level | Skill Points (book now → should be) | Max Skill Rank (book now → should be) |
  |---|---|---|
  | Street | 40 + 3d10 → **40 + INT + REF** | 4 → **4** |
  | Heroic | 45 + 3d10 → **45 + INT + REF** | 5 → **5** |
  | Shadows | 50 + 3d10 → **50 + INT + REF** | 5 → **6** |
  | World Coming Down | 55 + 3d10 → **55 + INT + REF** | 6 → **7** |

  Skill Points are not rolled. A CP Boost to INT or REF raises them too (Ken).
- ☐ *(10-07)* **0422_Utility_Skills** carries all sixteen General skills after the nine Utility ones, so they print twice (again in `0423_General_Skills`). Probably the source `.docx` kept them when the chapter was split.

## 0430_Advantages

- ✅ ⚖ **Advantages & Disadvantages › Campaign Power Level table.** CP should be **5 / 10 / 15 / 20**. The book says 10 / 15 / 20 / 25 (Decision 150).
- ✅ ⚖ **Intro: define "Universal".** Fifteen entries carry the tag, but the book never says what it means. Universal Advantages are open to every classification; the rest are Mortal-only, so **Werewolves and Vampires buy only the 15 Universal ones** (Decision 152). 2530 › Creating a Custom Advantage already has a sentence you can borrow ("Universal means it lands on every character sheet…").
- ✅ ⚖ **Long-Lived.** Say that ranks **stack**, so rank 3 gives 2 Minor + 1 Major Milestone, and that it's creation-only. The table as printed reads like each rank replaces the last (Decision 97, F17).
- ✅ ⚖ **Ghost TAG(s).** Add a line saying that the street calls this a Black TAG. *(Or put it in Gear's TAG section, below. One place is enough.)*
- ✅ The "Ambidextrousa" typo is fixed.

## 0440_Disadvantages

- ✅ **Faultlessly Honest.** The heading reads "Faultlessly Honest**1**", with a stray "1". *(New since the 09-24 mirror.)*
- ☐ ⚖ **End of the section: buying LUCK with CP.** Add a line on buying extra LUCK at **1 CP a point**, at creation, exempt from Max Boost (Decisions 5, 97). 0300 › Luck states the price, but this is where players spend leftover CP (Ken, 2026-10-04).
- ✅ **Minor Insanity.** "You may spend IP during play to buy out this Disadvantage" should say **between sessions**, matching 0450 and its own callout.

## 0450_Advancement

0450 is ahead of the sheet in most places, and the sheet will follow it. Three things to decide while you're in there:

- ❓ **Minor Milestones: repeats.** 0450 says "any option can be taken again". The sheet (Decision 29, from the old REF) won't repeat one until all five have been taken once. Pick one. It's a team call.
- ❓ **Your own editorial callouts:** Talented scope (AD-02), Advantage rank pricing (AD-03), Milestones past IPE (AD-04), Supernatural ceilings, and the MD threshold (AD-06). Each one blocks text elsewhere.
- ❓ **Supernatural ceilings vs. the Werewolf section.** 0450 says Werewolf and Vampire stats go past 10 "and their archetype sections set how far". *(10-08)* 0414 now says a Werewolf's bonus points go on its Focus Stats and "can push a base stat beyond 10", and the sheet follows it (Decision 197), but it still never says how far. One sentence on the ceiling, in 0414 and 0413.

## 0460_Gear

- ☐ ⚖ **Armor › Upgrades › Warding.** Replace the single Warding ("extends RES to magical damage") with **Warding — Elemental, Warding — Spirit, Warding — Aether and Self-mending**, each taking a mod slot, as 0480 Magic's Services already price them (Decision 143).
- ☐ ⚖ **Equipment › Field & Recovery › Nanomed Kit.** "Clears Bleeding, Poisoned, and Agonized" should add **Paralyzed**, to match 0540 (Decision 105, CQ12).
- ☐ ⚖ **Introduction › The TAG (Black TAG paragraph).** Say a Black TAG *is* the Ghost TAG(s) Advantage (Decision 146), unless you put it in 0430 instead.
- ❓ **Weapons › Grenades table (new 1x / 2x+ column).** The Thunderclap and the Junk Bomb escalate to **Injured** at 2x+. The design team ruled that **only Massive damage causes Injured or Maimed** (CQ5). Either grenades deal Massive, which the table should say, or that column changes. *(This is new: the table was rebuilt after the 09-24 mirror.)*
- ✅ **Siege** now reads "This weapon deals Massive damage", and the Massive category covers people (CQ4).
- ✅ **The Conditions table is gone**, leaving a pointer to Conditions & Recovery (CQ8).
- ✅ **Suppression** and **Blast** now have rules. That answers F28 and F29 from the book's side; the sheet needs to catch up (see the end of this list).
- ❓ Still open in Gear, all for Deighton: **Anti-Materiel** against people (F30); what the **Reach tag** adds to the Reach column (F31); whether a **shotgun counts as a rifle** for the Scope and Angel Mod (F26); the **RES class of Electric and Burning**, and when the Resistance upgrade's 50% applies (F23).

## 0480_Magic

- ☐ ⚖ **Wherever "½ SP" is first explained.** Say that **halves round up** (Ken, Decision 147). Mostly it's the spells that use ½ SP, but the rule belongs here once.
- ☐ ⚖ **Spellcraft › Mastery.** "A Mastered spell costs 30 IP × TH" should say **by default**, modified by Origin: Book 25, Blood 35 (0411). This comes from 0450's conformance callout.
- ❓ **Enchantment/Alchemy, the Artifact line** ("built from a Known spell uses that spell's TN"). The Book of Known Spells prints **TN 8** on four inscribed Cantrips (Everlight, Hearthstone, Sure Grip, Watchward), where a Cantrip is TN 7. One of them moves (Scott). The sheet follows the appendix's TN 8.

## Appendix_Book_of_Known_Spells

- ✅ **Counterspell and Silence are back** (Counterspell under Advanced › Soul).
- ℹ️ Mastering an inscribed spell prices off the form's TH, so Warding — Aether (TH 9) costs **270 IP** to Master. That isn't a mistake, but Scott may want to see the number.

## 0530_Combat_Encounters

- ☐ ⚖ **Making an Attack › Rate of Fire › Single** ("Stunt – Called Shot … apply the Injured or Maimed condition") and **Stunts › Called Shot › Limb** ("normal damage, plus Injured"). Both should say that a Called Shot inflicts Injured or Maimed **only when the weapon deals Massive damage**, a sniper rifle for example (CQ5). Also **Tens and Ones** ("the same grenade might … escalate to Injured") ties to the grenade question above.
- ❓ **Damage and Armor › Massive Damage** still uses "1 Health Level per 10 points". 0450's callout and the Exceptions List's AD-06 say Deighton is moving to MD ratings (MD 1–2 = Injured, MD 3–4 = Maimed). Don't rewrite this until that's ruled; the sheet runs the per-10 version today.
- ✅ **CQ11 looks resolved.** Enemy armor is "static and doesn't roll", and the worked example's vest now "absorbs 2". Worth one glance, then strike it.

## 0540_Conditions_and_Recovery

- ☐ ⚖ **Conditions table.** Add a **Dying** row (CQ9). Effect: Helpless; WILL Essence TN 8 TH 2 at every Reset; a failure or any damage is a Death Mark; three Death Marks and you die. Recovery: Medical (Difficulty 20) or a Nanomed Kit.
- ☐ ⚖ **Conditions table, Injured** (and 0550, below). 0540 says "Focused Healing or 1 week downtime", but 0550 says Injured "must be resolved through Focused Healing". Make them agree (CQ13). The sheet allows both.
- ☐ ⚖ **How Conditions Work.** Add two ruled lines (Decision 98, F20, F21, CQ2):
  - A Condition's "−1 to all rolls" comes off **Skill Checks only**, not Essence dice or Breaker %.
  - **Different Conditions stack with each other**, and all the penalties on one roll stop at **−8**. 0530's Quick Reference has the −8 cap for modifiers but doesn't say it includes Conditions.
- ☐ ⚖ **Going Down › Shock.** "Half your Health Levels" means **half your maximum, rounded up**: BOD 5 → 3 (CQ10).
- ☐ (optional) Only **Injured and Maimed** take a body part, and the same one can be on two parts, e.g. an Injured arm and an Injured leg (CQ3).

## 0550_Downtime

- ☐ ⚖ **Healing › Focused Healing.** Make it agree with 0540 on Injured (CQ13).

## 2530_Customizing_Characters (GM Workshop)

- ☐ **Advantages and Disadvantages, the paragraph on buying off a Disadvantage.** "bought off with IP **during play**" should say **between sessions**, the same fix as 044.
- ☐ (suggestion) **Custom Archetypes › The Mechanical Skeleton.** Add **classification** (Mortal / Supernatural / Other). It decides which Advantages a custom archetype can buy, and the sheet's Custom archetype asks for it (Decisions 152–153).

---

## Cyborg removal: every place the book mentions it

*Added after the 2026-10-01 decision. Cyborg is no longer an archetype. Cybernetics become a list, plus a mini-game that's still in flux, open to Professionals only. Arcanists, Vampires and Werewolves can't take cybernetics.*

**Rules chapters**
- ✅ **0000_Index** › Archetypes: "3. Cyborg". Remove it. 0470 Cybernetics stays.
- ✅ **0200_Synergy_System** › Attributes › Tolerance: "running cybernetics that feed on your bioelectricity". Keep it or cut it, depending on whether the mini-game uses TOL (question below).
- ✅ *(10-07)* **0300_Core_Mechanics** › Resources › Credits: "for anyone running on hardware – cyborgs especially". Reword to anyone running chrome.
- ✅ *(10-07)* **0410_Archetypes** › Archetypes (opening list): remove the Cyborg entry. Also remove the "Sythnosapien (Under Construction)" line, which makes that typo fix moot. Reading Archetypes lists "Chrome Loadout" as a specialization example; drop it.
- ☐ **0450_Advancement** › Spending IP: "Cyborgs spend IP to make new hardware their own" should be **Professionals with cybernetics**, or wherever the mini-game prices it.
- ☐ **0470_Cybernetics** is the chapter this hits hardest. It's still an outline, and it's written as the Cyborg's core mechanic: it calls Overdraw "the Cyborg's equivalent of a Bound caster choosing to Rupture". It needs re-scoping to "what a Professional can install", plus the mini-game.
- ✅ *(10-07)* **0550_Downtime** › Exhaustion: "Cyborgs and Arcanists run on Tolerance". Arcanists only, unless the mini-game uses TOL.
- ☐ **Appendix_Book_of_Known_Spells** *(10-07: Consecrate is fixed; the inscribed Consecration still says "cyborgs")* › Consecration and the matching Standard spell (Withering (Holy)): "werewolves, Arcanists, cyborgs and ordinary people feel nothing". Remove "cyborgs".

**GM Workshop**
- ☐ **2110_What_is_Shadows**: "vampires, werewolves, arcanists, cyborgs, and professionals".
- ☐ **2120_Character_Creation** › Archetypes › Cyborg: this is a whole subsection (lines 35–41). The callout "Cyberware and maintenance for the Cyborg" needs to move to the Professional.
- ☐ **2510_What_Holds_the_System_Together** › the roles paragraph: "A Professional can acquire cybernetics, but not so many that they stop needing a Cyborg". This argument for keeping Cyborgs is now the argument against them; rewrite it.
- ☐ **Vire, the GM Workshop's example Cyborg**, appears in **2310** (cast list), **2510** (Vire interfacing with nodes; Rook's black-market implant) and **2530** › Pack Leader Protocol › Spotlight check ("Cyborgs can interface with systems…"). Recast Vire as a chromed Professional, probably a Fence or a Wheelman.
- ☐ **2200** › Tone ("a rooftop cyborg attack"), **2230** › enemy roles ("a vampire, a cyborg, or…") and **2420** › Milestones ("a powerful Cyborg…"). Here "cyborg" mostly means an NPC or the genre. Fine for NPCs; reword where it means a PC archetype.
- ☐ **2000_GM_Workshop** has 21 mentions, but it's the stale compiled file (TC-02). Rebuild or retire it rather than editing it.

**Exceptions List:** AR-01, AR-02, AR-03, CY-01, CY-02, TC-04 and FP-04's "Sequence after AR-01" all assumed a Cyborg or Synthosapien archetype. Close or re-scope them.

**Questions this raises (for the meeting that settles the mini-game)**
- ❓ **Forge Fangs.** Werewolves can't take cybernetics, but the Forge Fang is "corporate engineering and primal biology", and 2530's Pack Leader Protocol example is built on "corporate cybernetics". Is Seta-16 genetic, not chrome (1200 Powers says "genetic re-sequencing"), and does 2530's example need rewording?
- ❓ **Does the mini-game run on TOL?** That decides 0200's and 0550's wording, and whether TOL matters to a Professional at all.
- ❓ **Custom archetypes and cybernetics:** allowed, GM's call, or a fourth line in the Mechanical Skeleton?
- ❓ **"Cannot get cybernetics" vs. classification.** The Arcanist is Mortal but can't take chrome, so this rule isn't Mortal vs. Supernatural. 0410 and 0470 should say it per archetype, and the reason (Aether and chrome don't mix?) is worth a line of fiction.
- ℹ️ **These still fit as they are:** the Cybernetics skill, Cyber-Prophetical, Cyber Allergy, the Cyber Psion milestone, and the Enforcer's free implants (all Professional-reachable). Cyber-Prophetical's open SAN-vs-TOL question (F5) moves to the mini-game.

---

## Questions to send before writing

These block book text, so send them before you write those sections. Deighton's flags are already grouped as one ask in `STATE.md` §5:

- **Deighton:** F23 + F25 (RES class of Electric and Burning, and how Natural Armor answers a hit), F24 (ongoing damage while Dying), F26, F30, F31, F33, F34 (does a swapped magazine keep its rounds?), F36 (is damage past zero kept?), the MD threshold, and whether grenades deal Massive.
- **Team:** whether Minor Milestones can repeat, Talented scope, Advantage rank pricing, Milestones past 10, Supernatural ceilings, and starting Çredits.
- **Scott:** TN 8 vs. TN 7 on the inscribed Cantrips, and whose 0480 review closes MG-01 and MG-02.

## Not CRB edits: where the book is ahead of the sheet

Moved on 2026-10-08 to **`plans/crb-v4-sync.md`**, which is the app's side of
this plan: every place the 2026-10-07 mirror is ahead of the sheet, sorted into
passes, each through its own tier. This plan keeps only what the book needs.
