# Work order W143: powers bought with Character Points

**Closed 2026-11-07, kept as history** (Ken). Built in #292 (Decisions 264 and 265, app 0.61.0).

**Wish:** **W143** (`WISHLIST.md`), Ken's, raised 2026-11-04. No multi-session plan: this order is its own plan, one session.
Decisions 3, 135, 157, 162, 194, 215, 216, 218 and 240.
**Status:** **drafted 2026-11-04 by Claude (Opus)**, pre-flighted against `main` at `47824b2` (PR #290 merged, app 0.60.0
released, game data 0.51, schema 0.32). **Approved by Ken 2026-11-04**, BQ1–BQ13 answered (§4): BQ1–BQ4, BQ7, BQ8,
BQ10, BQ13 in his words, the rest on their defaults. **BQ12, done:** the mirror is refreshed for this order, in part
(private `cbe379a`, 2026-11-04: `0411`, `0413`, `0414`, `0480` re-pulled and the new `0433`, `0434` added). The suite
passes against it unchanged. **Before the builder starts**, that commit is pushed and `main`'s `private` pointer moved
to it. The rest of the 11-01 split (`0430`–`0432`, the spells, Gear…) waits for a full refresh of its own.
**Built 2026-11-04** (app 0.61.0, Decisions 264 and 265, PR #292).
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs alone.** It touches `engine.js` (the powers and Disciplines readers, `spendable`, `validate`, `ipCost`),
`wizard.js` (the CP step's Powers and Disciplines, the Base Powers note, the Power Level card), one `sheet.js` line, the
data (the Arcanist's Disciplines, both supernaturals' notes, step 7's note, `powerLevels`), tests and docs. Nothing in
`gm.js` or `private/`. **No schema bump** (§8a says why).
**Carried over:** no order ran before this one in its area. From L5's review (the last order): the voice pass happens
before merge, with every new string pasted into the PR as it renders.

**The pre-flight found, in short:**

1. **The book is already ahead of the sheet.** Ken's source `0433_Final_Character_Points` (saved 2026-11-01, mirrored
   2026-11-04) prints the rule: *"The Campaign Power Level caps the boost Character Points buy on any one Stat, Skill, or
   Power"* and *"5 Character Points raise a Power by 1 rank or give you a new Power at rank 1."* The recap, `0434`, prints
   Max CP Boost and **no Max Power Rank**. `0413` and `0414` still say only that CP raises the placed powers "up to your
   Max Starting Rank", which doesn't forbid a new one. So for Vampires and Werewolves the order builds the book. The one
   sentence that is wrong is `0411`'s "Evocation is … the only one available at character creation" (still there in
   Ken's copy saved today).
2. **For a Vampire or Werewolf the Boost cap never binds today.** Max Starting Rank is 1/2/2/3 (Vampire) and 1/1/2/2
   (Werewolf) against a Max CP Boost of 2/3/4/5, so reaching the ceiling from rank 0 takes fewer Boosts than the cap
   allows, at every level. "A CP rank is a Boost" is built for every power, but only the Disciplines show it, and a
   test with a lowered `maxBoost` proves the path for the rest.
3. **The saved file already holds it.** `archetypeChoices.powerCp` keeps CP ranks per power id and isn't pruned by
   whether the power is held (only by the specialization's pool, `wizard.js:935`, `sheet.js:4226`). A power with CP on
   it just has to count as held. No new key.
4. **Ken's Boost check passes on `main`** (probed): a Street human's BOD 9 goes to 10 for 1 CP and the next is refused
   "Stat cap 10."; LUCK stops at 6 ("Max Character Point Boost reached: 2 each at Street Level."); a skill stops at Max
   Skill Rank. §10's example 1 pins it; it isn't new work.
5. **Max Power Rank caps nothing once Scott's rule lands.** Today it is read only by the Arcanist's `maxRankBy`, the
   Power Level card's "Power cap" chip (`wizard.js:206`) and Admin's note (`sheet.js:2550`). Disciplines lose it (Scott),
   Vampires and Werewolves use Max Starting Rank (240), a custom power is rank 1 only (216). BQ3 retires it.
6. **`spendable("cp")` is decided by Boosts first.** `canBoost` takes an untrained skill, so with 1 CP left the lock
   already waits; the new power and Discipline terms are kept correct but no test can make them decide (§11).
7. **The Disciplines' stepper has no engine gate.** `wizard.js:1197` writes `archetypeChoices.disciplines` directly; the
   stepper's disabled state is the only check. A prerequisite needs a `buyDisciplineRank`, as `buyPowerRank` is for
   powers.

---

## 1. Goal and Done when

When this is merged:

1. **A Vampire or Werewolf can learn a power it doesn't hold, at creation, for 5 CP.** On the CP step, the Powers
   section lists every power of the character's Bloodline or Origin it doesn't hold, at rank 0, with + to learn it at
   rank 1. Further ranks cost 5 CP each, up to Max Starting Rank (and the book's printed maximum). − gives back exactly
   5 CP a rank, and at 0 the power is unheld again.
2. **Every rank CP buys on a power is a Boost** of that power: at most Max CP Boost of them on any one power, and never
   past its ceiling, the lower binding. Placements, Innate grants and IP count no Boost.
3. **An Arcanist's Disciplines follow Scott's rule.** Evocation starts at its scaling rank (1/2/3/4) and CP raises it up
   to Max CP Boost times on top (Street 1 → 3). Enchantment and Alchemy count their Boosts from 0. Enchantment's first
   rank needs Evocation 3, Alchemy's needs Enchantment 3, at creation and with IP in play. The stepper says why when
   it's off.
4. **Custom powers stay open to every archetype**, Professional included, at 5 CP at creation or free as a GM's grant
   (Decision 216, unchanged). The supernaturals' Powers section points at it.
5. **Max Power Rank is gone** from what a player reads (BQ3); **Max Starting Rank** is the one term for an archetype's
   printed ceiling.
6. **Lock still waits on every point that can buy something** (162): a learnable power, or a Discipline whose
   prerequisite is met, is a sink for CP. (In practice a skill Boost already keeps `spendable("cp")` true while 1 CP
   is left, since `canBoost` takes an untrained skill too; the power term is kept right, not relied on.)
7. **A locked character is never touched.** A saved file above the new ceilings, or holding Enchantment without
   Evocation 3, loads exactly as it is, and neither `migrate()` nor `versionCheck` says anything.
8. **Everything else is unchanged**, shown by an outputs diff (§11): no existing character's numbers move except an
   Arcanist's Discipline caps, and the CP step's new rows.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** Two numbered decisions, **N** and **N+1** (the lowest free numbers on `origin/main` when you
  write them; the ledger ends at 263 as of the pre-flight).
- **App: minor**, `npm run bump -- 0.61.0` (a new capability). If `[Unreleased]` already heads another minor when you
  build, add to it and don't bump again; say which in the PR.
- **Game data: 0.51 → 0.52** (Decision 68): what a character can choose at creation moves, a cap changes, a data key is
  removed.
- **Character, table and pack schemas: no bump.** No saved field is added, renamed or reshaped (§8a).
- **No flag opens or closes.** The custom-power ceiling question (BQ1) stays outside the app: a custom power is rank 1
  at creation, as Decision 216 has it, so the app guesses nothing.

## 3. The decisions, drafted

Paste these as **N** and **N+1** in `SCHEMA.md` §4, each with an INDEX §3 line under the topic Decision 240 is filed
under, and mark what each replaces.

```
N. **At creation, 5 CP learns a power of the character's own Bloodline or Origin at rank 1, and every power rank CP buys is a Boost, held to the Max Character Point Boost.**
     *2026-11-xx · Ken + Claude · Touches: powersBought, isHeld, archetypePowers, powerPool, powerCpState, buyPowerRank, placeBasePower, basePowerState, archetypeChoices.powerCp, powerCpSpent, powerRanks, Learn a new power, spendable cp, validate, maxBoost, Max Character Point Boost, Max Starting Rank, cpPerPowerRank, Character Points step, Base Powers block, campaignPowerScaling.notes, creationFlow step 7, 0433, W143*
     - **Decided:** Under `powersBought`, CP raises any power of the character's own pool from rank 0 at `powerRankCost()` a rank, and CP on a power (`archetypeChoices.powerCp`) holds it, as a placement or IP does; one with no ranks is held for one rank's price. Each rank CP buys on any power, a Discipline included, is one Boost of it: at most `maxBoost` on one power, and never past its ceiling (here Max Starting Rank and the printed maximum), the lower binding. A placement, an Innate grant and IP are no Boost. A Base Power can't go in a power CP learned. A locked file is never changed or reported.
     - **Why:** `0433` (Ken, 2026-11-01): "5 Character Points raise a Power by 1 rank or give you a new Power at rank 1", and the Max CP Boost caps "any one Stat, Skill, or Power". Ken (2026-11-04): only CP spent counts, as LUCK's starting 4 doesn't.
     - **Rejected:** a new power only with IP after play (240's reading of `0413`/`0414`, which `0433` extends); counting placements and grants as Boosts; a separate learned-with-CP list (`powerCp` already holds the ranks, so no schema bump); a Base Power on top of a CP-learned power (it double-pays the first rank); every power at rank 0 with its own max (BQ4, W144); trimming a locked file.
     - **Replaces:** Decision 240 in part (CP raised a held power only; its Revisit if, "lets CP buy a new power at creation", happened in `0433`). Decision 157 in part (a power rank isn't held to Max Power Rank; it's a Boost). Decision 3 in part (power ranks are boosted targets again, at 5 CP a rank).
     - **Revisit if:** a Max Starting Rank passes the Max CP Boost (the cap then binds these archetypes), or custom powers get CP ranks past 1.
     - **Built:** app 0.61.0, game data 0.52, no schema bump, PR #…, log 2026-11-xx (W143).

N+1. **A Discipline takes CP Boosts up to the Max Character Point Boost on top of its start, with no other creation ceiling; Enchantment needs Evocation 3 and Alchemy needs Enchantment 3, at creation and in play; Max Power Rank is retired.**
     *2026-11-xx · Ken + Scott + Claude · Touches: coreMechanic.disciplines, maxRankBy, prerequisite, disciplineRanks, disciplineCap, buyDisciplineRank, disc stepper, ipCost power, spendable cp, validate, startingSpells, Evocation, Enchantment, Alchemy, powerLevels.maxPowerRank, Max Power Rank, Power cap chip, Admin Power Level note, 0411, 0434, 0480, W143*
     - **Decided:** Evocation starts at `evocationStartingRank`, Enchantment and Alchemy at 0, and CP raises each up to `maxBoost` times on top (N). The Arcanist's `disciplines.maxRankBy` goes; the engine still honours one an archetype declares. A Discipline's `prerequisite` (`{ discipline, rank }`, data) must be met for its first rank, bought with CP or IP: Evocation 3 for Enchantment, Enchantment 3 for Alchemy. Lowering the one before in the wizard is allowed, and `validate` blocks the lock until it's fixed. `powerLevels[].maxPowerRank`, which caps nothing now, is removed with its chip; Max Starting Rank is the one term for an archetype's printed ceiling.
     - **Why:** Scott's ruling (via Ken, 2026-11-04). `0480` already asks for 3 ranks of Evocation "before attempting Enchantment". The book's recap (`0434`) prints no Max Power Rank.
     - **Rejected:** Max Power Rank 2/3/4/5 as the Discipline ceiling (Scott); the prerequisite in code (Decision 135); refusing − on Evocation while Enchantment is held (a broken pick is named, as a starting spell above its rank is); the prerequisite at creation only (`0480` says before attempting, at any time); keeping `maxPowerRank` as a label (a number that caps nothing reads as a rule).
     - **Replaces:** Decision 157 in part (Max Power Rank capped a Discipline). Decision 3 in part (Max Power Rank no longer applies on top). Decision 135 stands: the cap, the start and the prerequisite are data.
     - **Revisit if:** Scott or Deighton put a creation ceiling back on Disciplines, or Deighton gives custom powers a ceiling of their own (BQ1).
     - **Built:** app 0.61.0, game data 0.52, no schema bump, PR #…, log 2026-11-xx (W143).
```

**Supersession marks** (`docs.test.mjs` reads only the first mark on an entry, so extend an existing one, as P7 did):

- **Decision 3** already reads "Superseded in part by Decision 218": make it "Decisions 218, N and N+1", with the clause
  "power ranks are boosted targets again (N), and Max Power Rank no longer applies (N+1)". Its INDEX line likewise.
- **Decision 157** already reads "Superseded in part by Decision 218": make it "Decisions 218, N and N+1", clause "a
  power rank bought with CP is a Boost (N), and a Discipline has no Max Power Rank (N+1)". INDEX likewise.
- **Decision 240** has none: add `→ **Superseded in part by Decision N**: CP also learns a power not held, at rank 1.`
  INDEX: `→ **superseded in part by N**`.

Not superseded, and why (so the reviewer doesn't have to re-derive it): **194** (a Discipline's rank is start + CP + IP;
printed caps are creation caps: still true); **215** (already marked by 216 and 240, whose rule this extends); **216**
(custom powers unchanged; its rejected "CP ranks past 1" stands); **218** (LUCK's rule is the model this follows);
**162** (extended: two new sinks, the rule unchanged).

## 4. Questions for Ken

Each has a default. A question left blank is answered "Default" (`WORK-ORDERS.md`).

| Id | Question | Default | Answer |
|---|---|---|---|
| BQ1 | **Build now, or wait on Deighton?** W143 said nothing builds until Deighton and Scott answer. Since then the pre-flight found your `0433` already prints both rules (a new power for 5 CP, the Boost cap on powers), and `0413`/`0414` don't contradict them. The only Deighton question left is whether a custom power gets CP ranks past 1, with a ceiling (flat 2/3/4/5, or a row of its own), and this order doesn't touch custom ranks. | **Build now.** Custom powers stay rank 1 at creation (216). The ceiling question goes on Deighton's next page, as a W id if he wants it built. | **Ken, 2026-11-04: build now.** |
| BQ2 | **Scott's Discipline rule, as relayed: enough to build?** Its consequences, to show Scott: Street Evocation reaches 3 (was 2), Heroic 5 (was 3), Shadows 7 (was 4), WCD 9 (was 5). Enchantment and Alchemy keep 2/3/4/5, but now behind 3 of the one before. At Street, Evocation 3 costs 10 CP of a 5 CP budget, so Enchantment needs Disadvantages and Alchemy is out of reach (Enchantment stops at 2). At Heroic, Evocation 3 and Enchantment 1 is exactly the 10 CP. A higher Evocation also opens higher-TH starting spells. | **Build.** You confirm with Scott alongside, and the builder adds `0411`'s "the only one available at character creation" to `crb-catch-up.md`. | **Ken, 2026-11-04: build.** "We want players to get disadvantages, so dangling the carrot of a new rank in Evocation in front of them is key." |
| BQ3 | **One term.** The book prints Max Starting Rank (`0413`, `0414`) and never Max Power Rank (`0434`'s table dropped it). After this order, Max Power Rank caps nothing. Every place it's used today: `powerLevels[].maxPowerRank` ×4 (data), the Arcanist's `maxRankBy` (data), the "Power cap" chip (`wizard.js:206`), Admin's Power Level note (`sheet.js:2550`), comments at `engine.js:4090` and `shadows-data.js:5429`, `SCHEMA.md` §2's example (137–158, 368), `crb-catch-up.md` (lines 7, 8, 40), and the tests in §5. | **Retire Max Power Rank**: remove the key and the chip, reword the note and comments, keep the ledger as history. **Max Starting Rank** stays the term for an archetype's ceiling. | **Ken, 2026-11-04: agreed.** Max Starting Rank it is; Max Power Rank is retired. |
| BQ4 | **"All powers start at rank 0", your idea to weigh.** It would drop the "a power with no ranks" case (215) so every power reads the same. But it changes the data shape of every unranked power and of the Werewolf's starter power (a specialization's feature, not a pool power), so saved files need a `migrate()` step and a schema bump, and W143 doesn't need it: an unheld power already reads as rank 0 in `powerRanks` (Learn a new power), and this order adds no special case. | **Out.** The builder files it as **W144** under Wizard, "Claude, from W143", with this reasoning. | **Ken, 2026-11-04: drop it, file it as W144.** (It was meant to make the calculations easier later.) |
| BQ5 | **Taking back the last Base Power on a power CP also raised.** Today both go (`placeBasePower`, `engine.js:4233`), and the CP comes back. Now the CP alone could keep the power, at rank = its CP. | **Both go, as today.** One press undoes the pick; nothing stays held by surprise. | **Ken, 2026-11-04: the default.** |
| BQ6 | **A Base Power into a power CP learned.** Placing would double-pay its first rank (1 placed + 1 CP). | **Refused**, saying why: take the CP back first. | **Ken, 2026-11-04: the default.** |
| BQ7 | **Lowering Evocation below 3 while Enchantment is held**, in the wizard. | **Allowed**; `validate` names it as an error, so the lock waits. As a starting spell above its rank is today. | **Ken, 2026-11-04: allowed** (the default). |
| BQ8 | **The prerequisite in play.** `0480`: "3 ranks of Evocation before attempting Enchantment". | **Applies to IP too**: Raise a Power refuses Enchantment's first rank at Evocation 2. Admin bypasses it, as Admin does every cap. | **Ken, 2026-11-04: yes**, the same requirement for IP. |
| BQ9 | **An unlocked draft built under the old rule** (Enchantment bought with Evocation 1). | **Refused at lock until fixed**, as Decision 240 did with old placements (YQ4). Locked files are untouched. | **Ken, 2026-11-04: the default.** |
| BQ10 | **A learnable power with no ranks** (a Draugur's Deathless Resilience). `0433` says "a new Power at rank 1". | **Yes**: 5 CP holds it. Nothing raises it further. | **Ken, 2026-11-04: yes.** |
| BQ11 | **One order or two?** The Disciplines could be their own order (W143b). | **One.** The Boost-cap path is only visible through the Disciplines, and both share the CP step's code. The Disciplines are the order's last steps, so the review can see them apart. | **Ken, 2026-11-04: the default** (one order). |
| BQ12 | **The mirror lacks `0433`.** `private/crb` is from before you split 0430. | **If you refresh the mirror before the build**, the builder pins `0433`'s two sentences in `rules.test.mjs`. If not, it pins them as your ruling, quoting `0433`, and says so in the PR. | **Ken, 2026-11-04: refresh the mirror now.** See the status line for where that stands. |
| BQ13 | **The word on the screen** for a power not held: "unheld", "not learned" and "rank 0" all appear in W143. | **"Learn"**, as Progression's *Learn a new power* says it. Rows read "rank 0", the sub-heading is "Powers you could learn" (voice pass). | **Ken, 2026-11-04: "Learn".** |

## 5. The assumption sweep

Grepped at `47824b2`. Line numbers are as of the pre-flight.

| What | Today (where) | After | Guards that read it · where it renders · text that points at it |
|---|---|---|---|
| `isHeld` | grant, placement, IP, splice (`engine.js:4124`) | + `powerCpOf(ch)[id] > 0` | Readers: `archetypePowers` 4115, `specializationAllowance` 4152, `specializationOpening` 4171, `powerRanks`' learn rows 4463. A CP-learned power leaves *Learn a new power* by itself. |
| `archetypePowers` | `start` = placement or 1; `cp` only on a ranked power (4118) | a CP-learned ranked power: start 0, rank = CP + IP. **A CP-learned unranked power reads held at rank 1**, as a placed one does (see trap 2) | Renders everywhere powers do: Character tab (`sheet.js:590`), print, GM seats, Main's natural weapons (`archetypeWeapons`, `power` + `perRank`). All correct by construction once it's held. |
| `powerCpState` | held, ranked powers; cap = min(Max Starting Rank, printed) (4263) | + every pool power not held (start 0), unranked ones with cap 1; each row's cap = min(ceiling, start + `maxBoost`), with which one binds | Readers: wizard CP step 626–644, `spendable` 5525, `validate` 5717–5721, `buyPowerRank` 4282. |
| `buyPowerRank` | refuses unheld and unranked ("isn't one you hold, or it has no ranks") | learns an unheld pool power; refuses a held unranked one ("… has no ranks."), one outside the pool ("That power isn't one you can take."), a Boost past `maxBoost` (218's words), a rank past the ceiling (today's words) | Tests 5674, 5774 assert the old refusal (§13). |
| `placeBasePower` | refuses a second placement; deletes CP with the last placement (4224–4243) | also refuses a power with CP and no placement (BQ6); keeps the deletion (BQ5) | `basePowerState` rows need it too, or `spendable("basePowers")` (5512) counts a refused row as open and a lock waits forever: give the row `learned: true` and leave it out of "open". |
| `spendable("cp")` | `rankOpen` = any `powerCpState` row under cap, any Discipline under cap (5517–5530) | the same over the new rows, and a Discipline counts only if its prerequisite is met | Decision 162's lock gate and the nav's "what's left". |
| `validate("character-points")` | CP on a non-row id is "isn't a power you hold"; rank past cap; Discipline past cap (5697–5721) | an unheld **pool** power with CP is a row, not stray; out-of-pool ids keep their message; + a Discipline held without its prerequisite (BQ7, BQ9) | Renders in the wizard's issues list and the Review gate. Only the wizard calls `validate`. |
| `disciplineRanks`, `disciplineCap` | one cap for all three, `maxRankBy` → `maxPowerRank` (952, 4082) | each row's cap = min(declared ceiling, base + `maxBoost`), plus `needs` (`{ id, name, rank, met }` or null); `disciplineCap` returns the declared ceiling or null | Readers: wizard 352, 355, 613–620; sheet 627 (Character tab), 2408 (the Disciplines panel); `spendable`; `validate`; `startingSpells` (its TH cap is Evocation's rank: a higher Evocation opens more). |
| Disciplines stepper | writes `archetypeChoices.disciplines` directly (`wizard.js:1197`) | goes through a new `Engine.buyDisciplineRank` | The stepper's + is enabled by the same answer; its `title` says why when off. |
| `ipCost(ch, "power", id)` | rank 0 → `newPower`, else rank × 20; no prerequisite (2981) | a Discipline at rank 0 with an unmet prerequisite refuses (BQ8) | Raise a Power on Progression; GM's seat sheet is read-only. Admin doesn't go through `ipCost`. |
| `powerLevels[].maxPowerRank` | 2/3/4/5 (data 342…408) | **removed** (BQ3) | Chip `wizard.js:206`; `rules.test.mjs:1194`; `engine.test.mjs:402–414`, 3044; `SCHEMA.md` §2 137–158. |
| Arcanist `disciplines.maxRankBy` | `"powerLevel.maxPowerRank"` (data 2401) | **removed**; a `prerequisite` on Enchantment and Alchemy | `engine.test.mjs:284–292` lists the path keys it checks. |
| Copy that states the old rule | Base Powers note "CP raises any of your powers … up to rank N" / "At this Power Level, CP raises no power: every one starts at rank 1." (`wizard.js:440`); the CP step's same sentence (630); the Disciplines heading "· cap N" (616); step 7's note (data 5483); both supernaturals' `campaignPowerScaling.notes` (data 2832, 3125); Admin's note (`sheet.js:2550`); the data comment at 5429 | each rewritten (§9) | Tests that pin them: `smoke-sheet-archetypes.test.mjs:717, 761–777`; `smoke-wizard.test.mjs:529`; `rules.test.mjs:1466, 1470, 1476, 1477` (the data notes; the mirror's `0413` sentence at 1474–1475 stays true and stays). |
| `crb-catch-up.md` | lines 7–8 hold both flags; 40 says Max Power Rank caps a power rank | lines 7–8 say what the sheet now builds; 40 reworded; a new `0411` item (BQ2) | Docs only. |

**Not touched, checked:** `migrate()` (normalizes `powerCp` to the IP rank cap, 5164, never by held); `versionCheck`
(reads IP journal entries, not CP); `cp()` (`powerCpSpent` already counts every `powerCp` entry × 5); the
specialization-change prunes (`wizard.js:935`, `sheet.js:4226`, by pool, so a CP-learned power of the same Bloodline
survives and another Bloodline's goes); `addCustomPower` (216, unchanged); `gm.js` (no reader of `powerCp` or the
Discipline caps).

## 6. Read first

- `CLAUDE.md`, then `docs/STATE.md`, then W143 in `WISHLIST.md` (Ken's points are the brief).
- Decisions **3, 135, 157, 162, 194, 215, 216, 218, 240** in `SCHEMA.md` §4 (INDEX tells you where).
- `src/engine/engine.js`: `cp`, `canBoost`, `boostSpent` (935–990); `disciplineSpent`, `disciplineCap` (946–952);
  `ipCost`'s power branch (2981); `disciplineRanks` (4082); `archetypePowers`, `isHeld`, `isGranted`, `powerPool`,
  `playPool` (4110–4146); `basePowerState`, `placeBasePower`, `powerCpOf`, `powerCpSpent`, `powerCpState`,
  `buyPowerRank` (4192–4289); `powerRanks` (4455); `spendable` (5500); `validate("character-points")` (5697–5725).
- `src/ui/wizard.js`: the Power Level card (~200), `basePowersHtml` (435), `renderCP`'s Disciplines, Powers and Custom
  powers (612–664), the stepper handler (1190–1205).
- `src/data/shadows-data.js`: `powerLevels` (~320–410), the Arcanist's `campaignPowerScaling` and `coreMechanic.disciplines`
  (2282, 2400), the Vampire's and Werewolf's scaling, `powersBought` (2824–2880, 3117–3170), step 7 (5479).
- `private/crb/0480_Magic.md:741` (the prerequisite), `0411_Arcanist.md:169`, `0413_Vampire.md:48`, `0414_Werewolf.md:50`.
- Tests: `engine.test.mjs` 284–414, 3013–3050, 5437–5830; `rules.test.mjs` 1180–1200, 1440–1480;
  `smoke-sheet-archetypes.test.mjs` 700–780; `smoke-wizard.test.mjs` 340–362, 520–530; `smokekit.mjs`'s `arcanistOnCP`.

## 7. Out of scope

- **IP prices** for a power not held (40 IP, Decision 216) or any rank in play. Creation's price only.
- **Custom powers' ranks.** Rank 1 at creation, 5 CP or free (216). BQ1's question is Deighton's.
- **The starter power** and any power with no ranks becoming ranked (BQ4).
- **Another Bloodline's or Origin's powers** at creation (Splice, Cursed Evolution's door: play only, Decision 223).
  The CP list is `powerPool`, the Bloodline the character is made with.
- **Admin.** It edits placements and Disciplines freely; no cap or prerequisite is added there.
- **The book.** `crb-catch-up.md` gets its lines; the CRB is Ken's to write.
- **The Arcanist's Origins** and creation-time Unique Aberrations (STATE: don't invest).

## 8. The shapes

### 8a. Data and the saved file

1. **`powerLevels[]`**: remove `maxPowerRank` from all four (BQ3). Nothing else in the row changes.
2. **The Arcanist's `coreMechanic.disciplines`**: remove `"maxRankBy"`. On Enchantment add
   `"prerequisite": { "discipline": "evocation", "rank": 3 }`, on Alchemy
   `"prerequisite": { "discipline": "enchantment", "rank": 3 }`. Update the DISCIPLINES comment (~2254): `maxRankBy`
   is optional, a ceiling below the Max CP Boost; `prerequisite` names the Discipline and rank its first rank needs.
3. **Notes**, drafted for a voice pass:
   - Both supernaturals' `campaignPowerScaling.notes`: "…, and Character Points raise a power up to your Max Starting
     Rank." becomes "…, and Character Points raise a power up to your Max Starting Rank or learn a new one at rank 1."
   - Step 7's `note`: "…Leftover CP may buy LUCK, boost skills and stats, or raise or learn a power, up to the Max
     Character Point Boost on each."
   - The data comment at ~5429 and the `powersBought` comments (2867–2873, 3161): CP learns a power at rank 1 too
     (Decision N), and a CP rank is a Boost.
4. **`gamedataVersion`** 0.51 → 0.52.
5. **The saved file: no change.** `archetypeChoices.powerCp[id]` already stores CP ranks on any id (5164 keeps every
   key, clamped). CP on an unheld pool power now *holds* it: a reader change, not a shape change, so no `migrate()`
   step and no schema bump. `archetypeChoices.disciplines` is unchanged. **Pin it**: a file saved on `main` with CP on
   a pool power it didn't hold (which `validate` refused there) round-trips through `migrate()` byte for byte.

### 8b. Engine

Every reader stays total (constraint 8): bad input gives a refusal, never a throw.

1. **`isHeld(ch, a, p, placed)`** adds `powerCpOf(ch)[p.id] > 0`.
2. **`archetypePowers`**: for a CP-learned ranked power, `start` 0 and `rank` = `cp` + `ipe`. For an unranked power held
   only by CP, `rank` 1 and `cp` 1, as a placed one reads (trap 2).
3. **A Boost cap for any power** (one helper, used by both lists):
   `powerBoostCap(ch, start, ceiling)` → `Math.min(ceiling ?? Infinity, start + powerLevel(ch).maxBoost)`, with which
   bound binds (`"boost"` or `"ceiling"`). No power level: no cap reached, as `canBoost` does (`{ ok:false }` is the
   caller's job).
4. **`powerCpState(ch)`**: rows are every held power with ranks (as today) **plus every `powerPool` power not held**
   (start 0; ranked or not). Each row: `{ id, name, origin, ranked, learned (held only by CP), held, start, cp, rank,
   cap, capBy, effect, perRank }`, where the ceiling is min(Max Starting Rank, printed max), 1 for an unranked power,
   and `cap` comes from (3). Held unranked powers stay out (nothing to raise). Order: held first in today's order, then
   unheld grouped by `origin` in the data's order.
5. **`buyPowerRank(ch, id, delta)`** for delta 1: the row (4) or refuse; `cp >= maxBoost` refuses with
   `Max Character Point Boost reached: ${n} each at ${level}.` (218's string, from one place: lift it out of
   `canBoost` into a helper both call); `rank >= ceiling` keeps `${name} is at its highest starting rank, ${cap}.`; an
   unranked row past 1 says `${name} has no ranks.`; then the CP check. Delta −1 unchanged (at 0 the entry goes, so the
   power is unheld again).
6. **`placeBasePower`**: refuse a power with CP and no placement:
   `${name} is yours already: Character Points learned it. Take that back to place a Base Power here.`
   `basePowerState` rows carry `learned`, and `spendable("basePowers")` skips them.
7. **`disciplineRanks(ch)`** rows add `cap` (min(declared `maxRankBy` ceiling, base + `maxBoost`)), `capBy`, and
   `needs`: `{ id, name, rank, met }` from `prerequisite`, null without one. **`met`** reads the named Discipline's
   creation rank (`start`) before lock and its full `rank` after (IP counts in play). A `prerequisite` naming no
   Discipline in the list is `needs: null` and a `dataWarning`, never a throw. `disciplineCap(ch)` returns the declared
   ceiling or null.
8. **`buyDisciplineRank(ch, id, delta)`**, new, exported: for +1 refuse an unknown id, a Boost past `maxBoost` (the
   same string), a rank past a declared ceiling (`${name} is at its highest starting rank, ${cap}.`), a first rank with
   `needs.met` false (`${name} needs ${needs.name} ${needs.rank}.`), or CP short; else write it. −1 never refuses while
   there's a bought rank (BQ7). The wizard's `disc|` handler calls it.
9. **`ipCost(ch, "power", id)`**: a Discipline at rank 0 whose `needs.met` is false refuses with the same
   `${name} needs ${needs.name} ${needs.rank}.` (BQ8).
10. **`spendable("cp")`**: `rankOpen` over the new `powerCpState` rows and over Disciplines where `needs` is null or met,
    each under its own cap.
11. **`validate("character-points")`**: an unheld **pool** power with CP is no longer "isn't a power you hold"; the
    rank-past-cap line covers the Boost cap through `cap`; add, per Discipline held (start > base) with `needs` unmet:
    `${name} needs ${needs.name} ${needs.rank}. Raise ${needs.name} or take back ${name}.` (an error, BQ9).
12. **Nothing else changes**: `cp()`, `migrate()`, `versionCheck`, `addCustomPower`, `canBoost` (bar the lifted string),
    `addBoost`.

## 9. The UI

Copy is drafted for a **voice pass** (`VOICE-APP.md`, tool voice for refusals); paste each into the PR as it renders.

| Where | Today | After |
|---|---|---|
| CP step, Powers section (`wizard.js:626`) | held rows only; "At this Power Level, CP raises no power: every one starts at rank 1." when all are capped | Held rows as today, each with its effect behind the fold (`foldBtn`), then a sub-heading **Powers you could learn** with the unheld rows grouped by Bloodline/Origin name, each "rank 0", a stepper labelled "Learn ${name} with CP" (W59), its effect folded. When every held row is at its cap: "Your powers start at rank 1 at this Power Level. CP can still learn one you don't have." A note under the section: "Or write one with your GM under Custom powers, below." |
| A learned row | — | moves up into the held rows with "learned with CP · rank 1"; − takes it back to the learn list |
| A refused + | `title` on the ⛔, as stats do | the same, from `buyPowerRank`'s `why` without changing anything (call it on a clone, or a `canBuyPowerRank` twin of `canBoost`; your pick, one source for the words) |
| Base Powers note (`wizard.js:440`) | "CP raises any of your powers on the Character Points step, up to rank N." / "At this Power Level, CP raises no power: every one starts at rank 1." | "On the Character Points step, CP raises any of your powers up to rank N, or learns a new one." / "On the Character Points step, CP can learn a new power at rank 1; none rises past it at this Power Level." |
| A Base Power row on a CP-learned power | — | the stepper's + off, `title` the refusal (8b.6) |
| Disciplines heading (616) | "Disciplines — 5 CP per rank · cap N" | "Disciplines — 5 CP per rank · up to +${maxBoost} each (Max CP Boost)" |
| A Discipline row | "starts at 1 · rank 2" | "starts at 1 · rank 2 · up to 3"; with `needs` unmet, a chip "needs Evocation 3" and + off with that `title` |
| Power Level card (`wizard.js:206`) | "Power cap 2" chip | **removed** (BQ3). `npm run phone-check` confirms the card still fits |
| Admin Power Level note (`sheet.js:2550`) | "(Max Skill Rank, Max Power Rank, Max Character Point Boost)" | "(Max Skill Rank, Max Character Point Boost, and an archetype's Max Starting Rank)" |

**Where things land:** a + or − on a power or Discipline redraws through `keepPlace` (Decision 164) and focus stays on
that stepper; a learned power moving from the learn list to the held rows takes focus with it to its new row's stepper.
Nothing here changes a filter or a view.

## 10. Worked examples, as named tests

Write these first, show them failing on `main` (or say why one passes), then build. Characters are the engine tests'
`vampire()`, `werewolf()`, `arcanist()` helpers or `subject()`; CP is drained with Advantages or Boosts within the cap
(never `luck.bonus` past it, 218).

| # | Test name (file) | Setup → action | After |
|---|---|---|---|
| 1 | "W143: a CP Boost on a stat, a skill or LUCK is 1 for 1 under the Max CP Boost and the human cap (Decisions 3, 218)" (`rules.test.mjs`) | Street Professional, BOD 9: one Boost; LUCK +2; a skill at 3 of Max Skill Rank 4 | BOD 10 for 1 CP, the next refused "Stat cap 10."; LUCK 6, the third refused (218's words); skill 4, then "Max Skill Rank 4.". **Passes on `main`**: say so. |
| 2 | "Decision N: 5 CP learns an unheld Bloodline power at rank 1, and a second rank to Max Starting Rank" (`engine.test.mjs`) | Heroic Strigoi (10 CP, Max Starting Rank 2), nothing placed: `buyPowerRank(ch, "bone-spines", 1)` twice, then a third | rank 1, held, CP spent 5; rank 2, 10; third refused "Bone Spines is at its highest starting rank, 2."; `powerRanks` no longer lists it to learn |
| 3 | "Decision N: giving back a learned power's last rank refunds 5 CP and it's unheld again" (`engine.test.mjs`) | from 2: −1 twice | CP spent 0; `powerCp` has no `bone-spines`; it's back in `powerRanks`' learn rows and `powerCpState`'s unheld rows |
| 4 | "Decision N: a Street Vampire learns one power at rank 1 with its 5 CP, and raises none" (`engine.test.mjs`) | Street Strigoi (5 CP, MSR 1), Shadow Play and Veil of Night placed: learn Bone Spines | rank 1, CP left 0; a + on Shadow Play refused "highest starting rank, 1" |
| 5 | "Decision N: a power with no ranks is learned for 5 CP and raises no further" (`engine.test.mjs`) | Draugur at Shadows: learn Deathless Resilience, then + again | held, rank 1, CP 5; then "Deathless Resilience has no ranks." |
| 6 | "Decision N: a CP rank is a Boost, so the Max CP Boost binds below Max Starting Rank" (`engine.test.mjs`) | Shadows Strigoi (MSR 2), `withData` the level's `maxBoost` 1: learn one power, + again | rank 1; the second refused "Max Character Point Boost reached: 1 each at Shadows." **Placements count no Boost:** a placed power still takes one CP rank to 2 |
| 7 | "Decision N: a Base Power can't go in a power CP learned, and Base Powers left don't wait on it" (`engine.test.mjs`) | Heroic Strigoi with `withData` giving it 6 Base Powers; CP-learned Bone Spines: place one in it; then place the other five Strigoi powers | refused (8b.6), `basePowers` unchanged; with 1 Base Power left and only Bone Spines unplaced, `spendable("basePowers")` is false |
| 8 | "Decision N: taking back a Base Power takes the CP on it too (BQ5)" (`engine.test.mjs`) | existing assertion at ~5697 kept | unchanged: the test that already pins it stays green |
| 9 | "Decision N: powerCpState lists every unheld Bloodline power at rank 0, and only the character's own" (`engine.test.mjs`) | Heroic Strigoi, two placed | its unheld rows are exactly the Strigoi powers not placed, each start 0, cap 2; no Upyr or Draugur power; computed from the data, not a hand list |
| 10 | "Decision N+1: Evocation rises the Max CP Boost above its start, and no further" (`engine.test.mjs`) | for every level in `D.powerLevels` (no id in code): an Arcanist with CP to spare (`withData` on `characterPoints`; WCD needs 25) buys Evocation until refused | Evocation = start + `maxBoost` (Street 3, WCD 9); the refusal is 218's string |
| 11 | "Decision N+1: Enchantment needs Evocation 3, and Alchemy Enchantment 3" (`engine.test.mjs`) | Heroic Arcanist (Evocation 2, 10 CP): + Enchantment; + Evocation; + Enchantment | refused "Enchantment needs Evocation 3."; Evocation 3; Enchantment 1, CP left 0. Alchemy at Enchantment 1: refused "Alchemy needs Enchantment 3." |
| 12 | "Decision N+1: lowering Evocation under Enchantment's prerequisite is allowed and blocks the lock (BQ7, BQ9)" (`engine.test.mjs`) | from 11: −1 Evocation | allowed; `validate("character-points")` errors "Enchantment needs Evocation 3. Raise Evocation or take back Enchantment." |
| 13 | "Decision N+1: IP can't buy Enchantment's first rank before Evocation 3 (BQ8)" (`engine.test.mjs`) | locked Arcanist, Evocation 2, IP to spare: `ipCost(ch, "power", "enchantment")`; then Evocation's IP to 3 | refused with the same words; then `{ ok:true, cost: 40 }` |
| 14 | "Decision N+1: a Street Arcanist's Evocation 3 opens TH 3 starting spells" (`smoke-wizard.test.mjs`, beside the Firebolt test) | Street Arcanist with a 5-point Disadvantage: Evocation +2 | a TH 3 spell's add is enabled in the picker |
| 15 | "Decisions N, N+1: a locked file over the new caps loads unchanged and reported nowhere" (`engine.test.mjs`) | a locked Street Arcanist saved with Enchantment 2 and Evocation 1; a locked Heroic Strigoi with `powerCp` 3 on a placed power | `migrate()` keeps both; `versionCheck` silent; the sheet shows the stored ranks |
| 16 | "Decision N: a Professional buys a custom power for 5 CP at creation, and has no learn list" (`engine.test.mjs`) | Street Professional, 5 CP | `addCustomPower(…, { creation:true })` ok, cost 5; `powerCpState` empty |
| 17 | "Decision N: the CP step lists the powers you could learn, and learning one moves it up" (`smoke-sheet-archetypes.test.mjs`) | a Heroic Strigoi draft on step 7 | the sub-heading and rows render; + on one moves it to the held rows with focus on its stepper; the Street note reads the new sentence |
| 18 | "Decision N+1: the Power Level card has no Power cap chip, and the Disciplines heading names the Max CP Boost" (`smoke-wizard.test.mjs`) | step 1, then an Arcanist on step 7 | no "Power cap" text; "up to +N each (Max CP Boost)" |
| 19 | "CRB 0433: 5 CP raises a power a rank or gives a new one at rank 1, under the Max CP Boost" (`rules.test.mjs`) | `crb("0433_Final_Character_Points.md")` | matches "caps the boost Character Points buy on any one Stat, Skill, or Power" and "5 Character Points raise a Power by 1 rank or give you a new Power at rank 1."; and `crb("0434_Character_Creation_Recap.md")` has a Max CP Boost column and no Max Power Rank |

## 11. Tests beyond the examples

- **The outputs diff** (`WORK-ORDERS.md`, *Prove nothing else moves by a diff*): `node tools/outputs.mjs before.json` on
  `main` **before** the engine changes, then `--against before.json` at the end. **Expected moves only:** an Arcanist's
  Discipline caps and the CP step's Disciplines heading and rows; the CP step's Powers section for a Vampire or Werewolf
  (the learn rows, the note); the Base Powers note; the Power Level card's chip; Admin's note. Every number on every
  sheet tab, and every Vampire's, Werewolf's and Professional's `archetypePowers`, stays put. Paste the diff's summary
  into the PR.
- **Totality** (`engine.test.mjs`'s hostile and totality sweeps): `powerCpState`, `buyPowerRank`,
  `buyDisciplineRank`, `disciplineRanks` on a character with junk in `powerCp` and `disciplines` (strings, negatives,
  ids of no power), and a `prerequisite` naming a Discipline that doesn't exist (`withData`): no throw.
- **Decision 135**: `prerequisite` is read; no Discipline or archetype id in code (the guard at `engine.test.mjs`
  ~284–360 covers paths; `buyDisciplineRank` reads the data's list).
- **Voice**: every new string through `voice.test.mjs`'s checks; no "Max Power Rank" in a string a player reads (add it
  to the voice tests' banned phrases if they have a place for them; else a smoke assertion).
- **Mutation-test**, and list the mutants in the PR and the log: drop `powerCpOf` from `isHeld`; drop `start +
  maxBoost` from the cap; drop the `learned` skip in `spendable("basePowers")`; drop the prerequisite from
  `buyDisciplineRank`, from `ipCost`, and from `validate`; drop the unranked case from `archetypePowers` (trap 2).
  Each must fail a test. (`spendable("cp")`'s power and Discipline terms can't be killed by a test: a skill Boost
  answers first, §1.6. Say so in the PR rather than inventing a fixture for it.) **Check each for a second path** that already covers the line (the stepper's
  disabled state is not a guard: the engine's refusal is).

## 12. Steps

`npm run verify` after each step; `npm run test:fast` inside them.

1. `git submodule update --init private`, then `npm run verify` on the fresh branch; note the totals. Write
   `before.json` with `tools/outputs.mjs` now, before any engine change.
2. §10's examples as failing tests (1 passes on `main`; say so).
3. **Powers (Decision N):** engine 8b.1–8b.6, 8b.10–11 for powers; the wizard's Powers section and Base Powers note;
   the data notes. Update the tests §5 lists for powers.
4. **Disciplines (Decision N+1):** data 8a.2; engine 8b.7–8b.9 and the Discipline halves of 8b.10–11; the stepper
   handler; the Disciplines heading and rows.
5. **Max Power Rank (BQ3):** data 8a.1; the chip; Admin's note; the comments; `rules.test.mjs`'s table loses its
   `powerCap` column; `engine.test.mjs` 402–414 and 3044 follow the new cap.
6. The dev preview (`shadows-dev-preview`; `node tools/devserver.mjs` if it isn't wired): a Heroic Strigoi learns a
   power and gives it back; a Street Vampire's note; a Heroic Arcanist buys Evocation 3 then Enchantment 1, then lowers
   Evocation and reads the error; the Power Level card at 375px. Screenshots or, if the tool times out, the metrics
   `WORK-ORDERS.md` names.
7. Docs (§14), Decisions N and N+1 with their marks, CHANGELOG and `npm run changelog`, the versions (§2), the outputs
   diff, `npm run verify` and `npm run phone-check`.

## 13. Stop and ask

**Stop** if:

- any reader of `powerCp`, `isHeld` or `disciplineRanks` that §5 doesn't list turns up and would show or count a
  CP-learned power differently from a placed one;
- a test other than the ones below breaks;
- the outputs diff moves a number on a sheet tab, or anything for a character with no CP on an unheld power and no
  Disciplines;
- a CP-learned power would need a new field on the character, or `migrate()` would have to change;
- `validate` turns out to run on a locked character anywhere;
- the mirror's `0413`/`0414` sentence (`rules.test.mjs` 1474–1475) no longer matches (Ken refreshed it and the book
  moved).

**Expected breaks, not stops** (update them to the order's rule, never weaken the guard):

- `engine.test.mjs`: 284–292 (the Arcanist's `maxRankBy` path is gone), 395–414 (`disciplineCap` and the
  "can start at N" Discipline line), 3044–3048 (the creation cap's number), 5674–5712 (its "never an unranked or
  unheld one" half, and the "isn't one you hold, or it has no ranks" refusal), 5733–5747 ("isn't a power you hold"
  for a pool power with CP), 5774–5800 (the refusals stand; the unheld-power ones become learns).
- `rules.test.mjs`: 1180–1200 (`powerCap` column), 1466, 1470, 1476, 1477 (the data notes' sentence).
- `smoke-sheet-archetypes.test.mjs`: 717, 761–777 (the "CP raises no power" sentences).
- `smoke-wizard.test.mjs`: 529 (the Disciplines heading).
- The version literals your bump moves.

## 14. Close-out

Use the **close-the-session** skill, Rule-or-shape tier: Decisions N and N+1 with their INDEX lines and the marks on
3, 157 and 240; STATE rewritten (versions; §5's next); the log entry with the mutants and the outputs diff;
`log/shipped.md`'s row; **W143 moves whole to `log/wishes-granted.md`** with a pointer to this order; **W144** filed
(BQ4) if Ken left it on its default; `crb-catch-up.md` lines 7, 8, 40 and a `0411` item (BQ2); CHANGELOG plus
`npm run changelog`; the versions (§2); this order's status line reads built.

**CHANGELOG** (player voice, drafted):

- **Vampires and Werewolves can learn a new power at creation**: 5 Character Points takes one of your Bloodline's or
  Origin's powers at rank 1, and more ranks cost 5 each, up to your Max Starting Rank.
- **An Arcanist's Disciplines go further at creation**: Character Points raise each one up to your Max Character Point
  Boost above where it starts. Enchantment opens at Evocation 3, and Alchemy at Enchantment 3.
- **The Power cap is gone from the Campaign Power Level card.** Each power's own ceiling is shown where you buy it.

**PR title:** `feat(powers): learn a power with CP at creation; Disciplines take Boosts (W143, Decisions N and N+1)`.
**PR body:** the template's sections, plus *Where the order didn't fit* (empty is fine), the mutants, the outputs
diff's summary, every new string as it renders (for the voice pass).

### Review checklist

- [ ] §10's rows pinned, each green; example 1 shown passing on `main`.
- [ ] `isHeld` is the one place a power counts as held; nothing else re-derives it.
- [ ] One source for the Max CP Boost refusal's words; `canBoost` and both power buyers use it.
- [ ] A CP-learned power reads like a placed one everywhere `archetypePowers` renders (Character tab, print, a GM's
      seat, Main's weapons), and leaves *Learn a new power*.
- [ ] `spendable("basePowers")` and `spendable("cp")` agree with what the steppers allow, with no lock that waits
      forever.
- [ ] The prerequisite is data, read in `buyDisciplineRank`, `ipCost` and `validate`, and only there.
- [ ] A locked file over any new cap loads unchanged; `migrate()` and `versionCheck` untouched.
- [ ] No `maxPowerRank` left in `src/`; no "Max Power Rank" or "Power cap" in a string a player reads.
- [ ] Decisions N and N+1 pass `docs.test.mjs`'s shape; 3, 157 and 240 marked, in SCHEMA and INDEX.
- [ ] The outputs diff moves only what §11 expects.
- [ ] Mutants in the PR and the log; `npm run verify` and `phone-check` green; versions per §2.
- [ ] Run in the dev preview: the Strigoi, the Street Vampire, the Arcanist, the card at 375px.

## 15. Handing it over

The two prompts are `WORK-ORDERS.md`'s, with this order's path, `docs/plans/w143-powers-bought-with-cp.md`. Session
titles: **W143 build** (Sonnet) and **W143 review** (Opus, fresh). Add these traps under the builder's prompt:

> Seven things in this order are easy to get wrong:
>
> 1. **Held is one function.** CP on a pool power holds it because `isHeld` says so. Don't add a second test for
>    "held" in `powerCpState`, the wizard or `validate`; read `isHeld` or `archetypePowers`.
> 2. **An unranked power held only by CP must read rank 1.** `archetypePowers` gives an unranked power `cp` 0 and a
>    `start` from its placement, so a CP-only one would read rank 0. Check the Draugur's Deathless Resilience on the
>    Character tab, not just in the engine.
> 3. **The Boost cap never binds a Vampire or Werewolf with today's numbers.** A test that only uses real levels
>    passes with the cap missing. Example 6 lowers `maxBoost` with `withData`; keep it.
> 4. **The Disciplines' stepper had no engine gate.** Route `disc|` through `buyDisciplineRank`; a disabled stepper
>    is not a guard, and the mutation tests must hit the engine.
> 5. **Two ranks for the prerequisite.** Before lock it reads the named Discipline's creation rank (`start`); after
>    lock, its full rank with IP. An Arcanist who raised Evocation to 3 in play can buy Enchantment with IP.
> 6. **A refused Base Power row must not count as open**, or Review waits on a Base Power that can't be placed.
> 7. **The mirror is only partly refreshed.** `0433`, `0434`, `0411`, `0413`, `0414` and `0480` are from 2026-11-04;
>    `0430_Advantages` and `0440_Disadvantages` are still the pre-split chapters. Pin only the six, and
>    don't edit `0413`/`0414`'s pinned sentences.
>
> Tier: Rule or shape. Two decisions, the next free numbers. App 0.61.0, game data 0.52, no schema bump. Use the
> close-the-session skill at the end.
