# Work order P17: The Vampire's Major Milestones

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3.

**Scope:** crb-v4-sync's **P4b** (VQ27): `0413`'s Vampire Majors, including Pure Blooded, Splice, and the second Bloodline that Cursed Evolution opens (VQ4: the New Power price). Opens no flag (PQ2 took its default).

**Status:** **drafted 2026-10-15 by Claude (Opus)**, pre-flighted against `main` at `cefdf68` (P9b, #190, merged; app 0.45.0, game data 0.38 and character schema 0.24, all unreleased). **Ken answered PQ1–PQ6 on 2026-10-15** (§4): all six take their defaults. No flag opens.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../../gm-mode/README.md) (*The cadence*). Ken starts **P17 build** (Sonnet) and, once the PR is open, a fresh reviewer (Opus).

**Carried over from P9b's review:**
- **The order's misses:**
  - It didn't say what the one-tap path does when nothing it could take is any use: one tap on Reload could lower a weapon's rounds. **Applied here:** every action in §8 says what it does when it has nothing to do, and what it refuses.
  - Its checklist asked for a mutant no test could kill: `migrate`'s gear pass is shadowed by `_coerceNumbers`. **Applied here:** §11's mutants were each checked for a second path (§11, last line).
- **The build's slip:** a fix commit cut a rejected alternative from the decision to save words it didn't need. **Applied here:** Decision N is cut only if `docs.test.mjs` says it's over 350 words.

**What P17 is.** `0413` gives the Vampire a Major pool of its own; the sheet offers it none. `growth.majorMilestones` is `[]`, so Progression reads "No Major Milestones listed for this archetype", and a Vampire can only write one in (Decision 217). P17 puts them in as data, on P3b's engine (Decision 199):
- a Bloodline prerequisite and a Major count;
- `rou` and `sfrMax` grants.

Three of them reach past that engine:
- **Pure Blooded** bars Splice and Cursed Evolution.
- **Splice** takes one power from another Bloodline.
- **Cursed Evolution**, an Innate power, opens a second Bloodline whose powers are bought with IP.

The sheet has never let a character hold another specialization's power. Decision 216 rejected it as "VQ4's door", and its *Revisit if* named exactly this.

**Probes against `main`** (`cefdf68`, a locked Street Strigoi from `lockedVampire("strigoi")`):

```
majorOffered(v)                    []                                              ← no Vampire Majors
Progression, Major                 "No Major Milestones listed for this archetype."
grants(v).rou / .sfrMax            0 / 0                                           sfr: value 17, rou 6
feedView kinds                     fresh 3 per HL (up to 17) · stored 2 per HL (up to 8)
archetypePowers (held)             bestial-blessings 2 · vitality-surge 1 · preternatural-speed 1 · cursed-evolution 1
powerRanks learn (rank 0)          the six Strigoi powers only                     ← Upyr's and Draugur's never listed
resolveHit 7 Withering, no armor   through 7, witheringDamage 7
D.ip.powerIncreaseCost             { perRank: 20, newPower: 40 }
```

**Cursed Evolution is held by every Vampire, at rank 1** (Decision 215: Innate powers are granted). So `0413`'s "Pure Blooded … can't be taken with … Cursed Evolution", read as *holding the power*, would bar Pure Blooded for everyone. PQ2 asks how to read it.

**The plan's row says 24 Majors; `0413` lists 22** (`private/crb/0413_Vampire.md` ~478–501, one version in the mirror's history). The table has a blank row between Reservoir and Blood Alchemist. This order builds the 22. §12 step 1 counts them again.

---

## 1. Goal

When P17 is merged:

1. **A Vampire's Progression offers `0413`'s 22 Majors.** A Major gated on another Bloodline isn't shown; one gated on a count or another Major is shown, with what it waits on.
2. **Five change a number the sheet shows** (PQ1):
   - **Blood Conditioning:** +2 RoU.
   - **Growing Hunger:** +6 maximum SFR.
   - **Blood Feast:** feeding on fresh blood gives +1 SFR per HL.
   - **Blood Alchemist:** stored blood fills SFR to its maximum, not half.
   - **Wither Ward:** Withering damage taken in a hit is halved, never below 1.

   The other seventeen are text.
3. **Pure Blooded and Splice bar each other.** Pure Blooded and a second Bloodline bar each other too (PQ2).
4. **Splice asks which power** from another Bloodline, and you hold it at rank 1. IP raises it as any held power (PQ3).
5. **Cursed Evolution opens one other Bloodline**, recorded on the sheet. Its powers then list under **Learn a new power**, at the New Power price (VQ4).
6. Decision 216 is superseded in part; 199 and 201 are extended.

## 2. Tier, versions, numbers

**Tier: Rule or shape.** Two new saved fields, a new prerequisite key, and three new grant types. One numbered decision, **N** (the next free number on `origin/main` when you write it).

**Character schema:** **0.24 → 0.25**, with its `migrate()` step in the same commit:
- a Major row may carry `power`;
- `progression.specializationsGained` is new.

**Table schema:** no bump.

**App version.** Check `CHANGELOG.md`'s heading and the tags:
- **0.45.0 still unreleased** (`git tag | sort -V | tail -1` is `v0.44.0`): no bump.
- **0.45.0 released:** `npm run bump -- 0.46.0`, minor: a new thing a player can do.

**Game data:** 22 Majors and new keys are content a character can choose (Decision 68).
- **0.38 still unreleased:** no bump.
- **0.38 released:** `gamedataVersion` 0.39.

Say in the PR which case applied.

## 3. The decision, drafted

Write it as Decision **N** in `SCHEMA.md` §4. Its INDEX §3 line goes under the topic Decision 199 is filed under. Ken's answers are filled in; trim only if `docs.test.mjs` says it's over 350 words.

```
N. **A Vampire's Major Milestones are data on Decision 199's engine; Splice holds one power of another Bloodline, and Cursed Evolution opens one other Bloodline for IP.**
     *2026-10-1x · Ken + Claude · Touches: growth.majorMilestones, checkPrereqs, notWith, noSpecializationGained, grants(), feed grant, withering grant, feedView, resolveHit, takeMajorChoice, milestones.major[].power, specializationsGained, gainSpecialization, gainsSpecialization, playPool, powerPool, Learn a new power, Wither Ward, Pure Blooded, Splice, Cursed Evolution, character schema 0.25, VQ4, VQ27*
     - **Decided:** `0413`'s 22 Majors are the Vampire's `growth.majorMilestones`, gated as the Werewolf's are. Five compute: +2 RoU, +6 SFR max, a `feed` grant (fresh +1 per HL; stored to the max), and a `withering` grant halving Withering through a hit, never below 1. `notWith` lists Majors that bar one; `noSpecializationGained` bars Pure Blooded once a Bloodline is opened, and opening once it's taken. Splice holds one other Bloodline's power at rank 1 (the Major's `power`); removing it leaves its IP spent. A power with `gainsSpecialization` opens that many Bloodlines (`specializationsGained`), whose powers are learned at the New Power price; they don't count for Majors. Schema 0.25.
     - **Why:** `0413` and VQ27, with Ken's defaults (PQ1–PQ6). Every Vampire holds Cursed Evolution (Decision 215), so only using it can bar Pure Blooded.
     - **Rejected:** Wither Ward as text; a flag on Pure Blooded's bar; Splice opening its power for 40 IP; a gained Bloodline counting for Majors; refusing to remove Splice; opening a Bloodline on Progression; gained Bloodlines in `powerPool`, where Base Powers would place ranks in them.
     - **Replaces:** Decision 216 in part (another Bloodline's power can be held or learned). Extends 199 (prerequisite and grant types) and 201 (a Major changes a feed kind).
     - **Revisit if:** power SFR costs or damage are computed (Pure Blooded, Dead Warrior); W98 computes movement; `0413`'s Majors change.
     - **Built:** app …, game data …, character schema 0.25, PR #…. Log 2026-10-1x (P17).
```

**Check *Replaces* against the text, not the title:**
- **216** rejects "another Bloodline's or Origin's powers (VQ4's door)", and its *Revisit if* is "Cursed Evolution or Splice opens another Bloodline's powers". That fires: mark it superseded in part.
- **199**'s *Revisit if* includes "the Vampire's Majors (P4b) need a grant this vocabulary can't say". It fires too, but 199 is extended, not replaced: nothing it decided changes. Say so in N's *Replaces*, as above.
- **201**'s *Revisit if* names "a Major (Blood Feast, Blood Alchemist, P4b) changes a kind's numbers". Also extended, not replaced.
- **215** grants Cursed Evolution at rank 1. That stands. PQ2 reads Pure Blooded around it.
- **217** (`majorListed`, the offer follows `growth.majorMilestones`) stands. Its guard at `engine.test.mjs` ~7623 reads the Vampire's list from the data and keeps passing.

## 4. Questions for Ken

| Id | Question | Default | Answer |
|---|---|---|---|
| PQ1 | **Which Majors compute.** | **Five**: Blood Conditioning (+2 RoU) and Growing Hunger (+6 SFR max), as P3b's Tireless and Deep Reserves; Blood Feast (+1 per HL fresh) and Blood Alchemist (stored to the max) on the Thirst panel, as Decision 201's *Revisit if* foresaw; **Wither Ward** on a hit, halving the Withering that gets through, after armor and Natural Armor, never below 1. **Text:** Pure Blooded and Dead Warrior (a power's SFR cost and damage are text on the sheet, e.g. Shadow Play's `"cost": "Rank + 2; rank alone for a glamour on yourself"`), Levitation and Night Wings (movement isn't computed, W98), Defiance of Sol (sunlight is entered as Withering by the player), and the rest. *Alternative:* Wither Ward as text, as the Werewolf's Silverscar is. Silverscar is silver only, and the sheet can't tell what a hit was made of; Wither Ward is all Withering, which the hit already knows. || **Ken, 2026-10-15: the default.** |
| PQ2 | **Pure Blooded and Cursed Evolution.** Every Vampire holds Cursed Evolution (Decision 215). | **Read it as *using* it**: Pure Blooded can't be taken once a second Bloodline is open, and none can be opened once Pure Blooded is taken. Cursed Evolution's own text, "Not available with Pure Blooded", reads the same way from the other side. *Alternatives:* a flag for Deighton (F-next), stubbed as the default meanwhile; or Pure Blooded removes Cursed Evolution, which changes a granted power and isn't what either line says. || **Ken, 2026-10-15: the default.** |
| PQ3 | **What Splice gives.** | **The power, held at rank 1.** Taking the Major is the price, as a Base Power is one rank; IP raises it as any held power: `ipCost`'s power branch, rank × 20, up to `D.ip.rankCap` (it reads no printed max today, and this order doesn't add one). *Alternative:* Splice opens the one power to **Learn a new power** at the New Power price (40 IP), as Cursed Evolution's Bloodline is. That's a Major plus 40 IP for one power. || **Ken, 2026-10-15: the default.** |
| PQ4 | **Does a Bloodline opened by Cursed Evolution count as yours for a Bloodline-gated Major** (Stolen Face needs Strigoi)? | **No.** `prerequisites.specialization` reads the Bloodline you were made with, `archetypeChoices.specialization`, as now. The opened one gives its powers, not its Majors. *Alternative:* yes, it counts. Stolen Face needs Shadow Play's glamour, which a Vampire who opened Strigoi can learn. || **Ken, 2026-10-15: the default.** |
| PQ5 | **Removing a taken Splice from the journal** when IP raised its power. | **The IP stays spent and the power stops being held.** Taking Splice again on the same power holds it again, at its old rank. Nothing is written back into the IP ledger, which records what was spent (constraint 7). The journal's ✕ asks first, naming the IP. *Alternative:* refuse the removal while IP sits on the power. That's safer, but it's the only Major the journal would refuse. || **Ken, 2026-10-15: the default.** |
| PQ6 | **Where Cursed Evolution's Bloodline is opened.** | **On the Archetype tab's Cursed Evolution card**: **Gained a bloodline** opens a chooser of the Bloodlines you weren't made with. It names the condition the table settles ("You drank at least 1 HL of a Vampire of that Bloodline and won the opposed WILL Essence check"); the app rolls nothing. One per Vampire (the data's `gainsSpecialization: 1`). Undo takes it back; there is no close button. *Alternative:* on Progression beside the Majors. But Cursed Evolution isn't a Milestone; it's a power. || **Ken, 2026-10-15: the default.** |

## 5. What this changes underneath (the assumption sweep)

Found by grepping the readers of each thing it touches, not from memory:
`growth.majorMilestones`, `majorOwnList`, `majorListed`, `majorOffered`, `majorPool`, `majorById`, `majorTakenIds`, `checkPrereqs`, `majorPrereqs`, `takeMilestone`, `untakeMilestone`, `grants(`, `formGrants`, `feedView`, `feedGain`, `resolveHit`, `.halved`, `powerPool(`, `archetypePowers`, `isHeld`, `powerRanks`, `ipCost` (power branch), `specializationIds(`, `progression.milestones.major` and `data-delmajor`.

**Check each row yourself before you build**, and say in the PR if one is wrong. Two questions are asked of every row:
- **Which guards read a value this changes?**
- **Where does each new or removed note or name render?**

| Today | Where | After P17 |
|---|---|---|
| Vampire `growth.majorMilestones: []` | data ~2664 | 22 entries (§8). Ids are new, so immutable from here (constraint 6). The data comment above the Werewolf's list (~2925–2938) gains the new keys. |
| `majorOffered` hides a Major whose `prerequisites.specialization` names another specialization | `engine.js` ~223 | Unchanged. Stolen Face, Breath of Winter and Returning Strike hide for the other two Bloodlines. **PQ4's default:** a gained Bloodline doesn't count; `specializationIds` stays the made-with one. |
| `checkPrereqs` speaks `stats`, `majorCount`, `skills`, `advantages`, `milestones`, `specialization`, `gear`, `note`, `gmApproval` | `engine.js` ~2106 | Adds **`notWith`** (Major ids; unmet "Can't be taken with Splice" if any is taken) and **`noSpecializationGained`** (unmet "Can't be taken once another Bloodline is open"). Its other callers (advantages' and skills' `requires`, a subtype's gate) never carry either key, so they're unchanged. **Decision 91: one vocabulary, one place.** |
| `takeMilestone(ch,"major",id)` pushes `{ id, date }` | `engine.js` ~2180–2190 | Refuses a Major with a `choice` ("Choose what it gives.", as the Minor branch does at ~2178). New **`takeMajorChoice(ch, id, pick)`** checks everything `takeMilestone` checks, then the pick (§8), and pushes `{ id, date, power }`. |
| Progression's **Take** on a Major commits `takeMilestone` | `sheet.js` ~3167–3171 | A Major with a `choice` opens a chooser instead, modelled on `openMinorChoice` (~739): Bloodlines as groups, each power with its cost and effect. **Load** commits `takeMajorChoice`, as one `commit()`. |
| `grants()` reads `rou`, `sfrMax`, `painLevel`, `skillPoints`, `hpPerLevel`, `luckCost`, `milestone` | `engine.js` ~158–188 | Adds `feed` (`out.feed[kind] = { perHL, upToShare }`, perHL summed, upToShare the highest) and `withering` (`out.witheringHalvedBy`: the Major's name, or null). **Every other caller of `grants()`** (`sfr` ~476, `hpPerLevel` readers, advantages) ignores keys it doesn't read; grep them. |
| `feedView` reads each kind's `perHL` and `upToShare` from the panel | `engine.js` ~2976–2992 | Adds `grants(ch).feed[kind.id]`: `perHL` added, `upToShare` raised (Blood Alchemist: 1, so `upTo` is the max). **Readers:** `feedGain` (~2993), the Thirst panel's note (`sheet.js` ~2128: "3 SFR per HL, up to 8"), the Feed handler (~3094). The panel note says why, e.g. "4 SFR per HL (Blood Feast)". |
| `resolveHit` puts `through` on the track, Withering when `cat.recordsWithering` | `engine.js` ~1095–1124 | With `witheringHalvedBy` and a Withering hit: `through = through>0 ? Math.max(1, Math.floor(through/2)) : 0`, last, after Natural Armor. The result gains `witherHalved: { by, from, to }` or null. **Readers of `through`:** `after`, `hitPrompts`, the patch's `damage` and `witheringDamage`, `soaked`. **Where it renders:** the hit panel's lines (`sheet.js` ~906, beside `r.halved`'s line) say "Wither Ward halves it: 7 → 3." **Twin:** `resolveEncounterHit`'s NPC stand-in (`engine.js` ~6612) has no progression, so it's unchanged; a PC row is `_resolvePcHit`, entered by the GM, so it's unchanged too. |
| **`powerPool(ch)`**: Innate plus the made-with specialization's powers | `engine.js` ~2784 | **Unchanged.** Its readers include `basePowerState` (~2807), Admin's specialization prune (`sheet.js` ~3439) and the wizard's (`wizard.js` ~905), and those must never see another Bloodline. |
| `archetypePowers` and `powerRanks`'s **learn** list read `powerPool` | `engine.js` ~2770, ~3059 | Both read a new **`playPool(ch)`**: `powerPool` plus every power of a gained specialization plus each taken Splice's `power`, deduplicated by id. **`isHeld`** also holds a power a taken Splice names, granted at rank 1 (as `isGranted`: `start` 1, no placement). **Learn** lists `playPool` powers not held, so a gained Bloodline's unheld powers list there and Splice's doesn't. `ipCost`'s power branch reads `powerRanks` (~2017), so the New Power price follows with no change there; check it. |
| `archetypeContent` shows `archetypePowers` and filters vulnerabilities by `origin` | `engine.js` ~3101–3112 | Powers follow `archetypePowers`. No Vampire vulnerability has an `origin` (checked: all five are the archetype's), so a gained Bloodline changes none. |
| `untakeMilestone` splices the row | `engine.js` ~2193; journal ✕ `sheet.js` ~3188–3191 | Unchanged in the engine. **PQ5's default:** the ✕ on Splice asks first, naming the power and its IP ("Shadow Play's 40 IP stay spent"). |
| `migrate` keeps a Major row's `id`, `date`, and a custom one's `name`, `benefit` | `engine.js` ~3589–3598 | Keeps `power` when it is a non-empty string, else deletes it. `progression.specializationsGained` becomes an array of strings, deduplicated, anything else dropped. A 0.25 step stamps the schema. `newCharacter()` gains `specializationsGained: []` (constraint 8: it must survive the round trip). |
| `SCHEMA_VERSION = "0.24"`, asserted in tests | `engine.js` ~25; **22** `"0.24"` literals in `tests/` (`grep -c '"0.24"' tests/*.mjs`) | `"0.25"`. **Expected breaks.** |
| SCHEMA §3's `progression` and Major row | `SCHEMA.md` (search `milestones: {`) | Adds `power?` on a Major row and `specializationsGained`, each with its rule. |
| The Werewolf's Majors, Decision 217's offer guard | `engine.test.mjs` ~5329, ~7623; `rules.test.mjs` ~1317 | Unchanged and still passing: they read `growth.majorMilestones` per archetype. |
| `versionCheck` reads a taken Major's id against the lookup | `engine.js` ~4314 | Unchanged. A Splice whose `power` the data no longer has reads as not held, and the power is gone from `playPool`. **Totality:** `archetypePowers` must not throw (§11). |
| GM mode | `gm.js` | **Not a reader** of a character's Majors or powers (`grep -n "majorTaken\|archetypePowers\|playPool" src/ui/gm.js` is empty today). Confirm. |
| The archetype-id guard: no archetype or discipline named in engine or UI code | `engine.test.mjs` ~481 | **No `vampire`, `strigoi`, `upyr`, `draugur`, `splice`, `pure-blooded` or `cursed-evolution` in `src/engine` or `src/ui`.** Everything keys off data: `choice`, `notWith`, `noSpecializationGained`, `gainsSpecialization`, the grants. |
| The data-key guard | `engine.test.mjs` ~363 | Fails until each new key is read: `notWith`, `noSpecializationGained`, `choice` on a Major, `gainsSpecialization`, the `feed` and `withering` grant fields. That's expected while you build, not a stop. |

## 6. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- `private/crb/0413_Vampire.md`: *Innate Powers* (~185–232, Cursed Evolution), *Growth & Milestones* (~474–501).
- `docs/plans/archive/crb-v4-sync.md` VQ4, VQ27; `archive/crb-v4-sync/P3b-werewolf-majors.md` (the engine this builds on).
- `SCHEMA.md` §4:
  - **91**: one prerequisite vocabulary;
  - **199**: archetype Majors, Bloodline gates, grants;
  - **201**: the Thirst;
  - **215**: Innate powers granted, Base Powers;
  - **216**: Learn a new power, "its own Bloodline";
  - **217**: the offer, the Minors' `choice`, custom Majors;
  - **219**: a hit's halving.
- `src/engine/engine.js`:
  - `grants`, `majorOwnList` … `formGrants` (~158–250);
  - `resolveHit` (~1075–1130);
  - `checkPrereqs`, `majorPrereqs`, `takeMilestone` (~2106–2195);
  - `archetypePowers`, `isHeld`, `powerPool`, `basePowerState` (~2766–2810);
  - `feedView`, `feedGain` (~2976–3005);
  - `powerRanks` (~3051);
  - `migrate`'s Major pass (~3589).
- `src/ui/sheet.js`:
  - `openMinorChoice` (~739);
  - Progression's Majors and journal (~1383–1416);
  - the hit panel's lines (~900–910);
  - the Thirst panel (~2120–2135);
  - the Archetype tab's power cards (~486–520);
  - the Take, ✕ and Feed handlers (~3094, ~3167–3191).

## 7. Out of scope

- **Computing** a power's SFR cost or damage, movement, or sunlight (PQ1's text Majors).
- **Ghouls**, and anything Kiss of Night or Unholy Covenant makes.
- **A second Bloodline's Majors, vulnerabilities or traits** (PQ4).
- **Base Powers or CP in another Bloodline.** Creation is unchanged; Splice and Cursed Evolution happen in play.
- **Closing an opened Bloodline**, except by undo (PQ6).
- **F39** (is one Base Power one rank) and **F41**: unchanged.

## 8. The shape

**Data: the Vampire's `growth.majorMilestones`**, 22 entries in `0413`'s order:
- ids are kebab-case of the name: `blood-conditioning` … `death-rites`;
- `benefit` is `0413`'s Effect text, as written;
- `prerequisites` as below;
- `grants` on the five of PQ1.

| Major | `prerequisites` | `grants` / other |
|---|---|---|
| Blood Conditioning | `{}` | `[{ "type": "rou", "amount": 2 }]` |
| Growing Hunger | `{}` | `[{ "type": "sfrMax", "amount": 6 }]` |
| Pure Blooded | `{ "notWith": ["splice"], "noSpecializationGained": true }` | text |
| Splice | `{ "notWith": ["pure-blooded"] }` | `"choice": { "type": "power", "from": "otherSpecialization" }` |
| Dead Warrior, Levitation | `{}` | text |
| Blood Feast | `{}` | `[{ "type": "feed", "kind": "fresh", "perHL": 1 }]` |
| Reservoir, Blood Alchemist, Dark Rending, Frenzy Resistance | `{ "majorCount": 1 }` | Blood Alchemist: `[{ "type": "feed", "kind": "stored", "upToShare": 1 }]`; others text |
| Night Wings | `{ "milestones": ["levitation"], "majorCount": 1 }` | text |
| Blood Control | `{ "milestones": ["frenzy-resistance"] }` | text |
| Stolen Face / Breath of Winter / Returning Strike | `{ "specialization": ["strigoi"] / ["upyr"] / ["draugur"], "majorCount": 1 }` | text |
| Defiance of Sol, Life Sense | `{ "majorCount": 2 }` | text |
| Wither Ward | `{ "majorCount": 2 }` | `[{ "type": "withering", "halve": true }]` |
| Kiss of Night, Unholy Covenant | `{ "majorCount": 3 }` | text |
| Death Rites | `{ "majorCount": 4 }` | text |

**Data: Cursed Evolution's power entry** gains `"gainsSpecialization": 1`. That's how many other specializations holding it can open. It's read by `gainSpecialization` and the Archetype tab's card, and nowhere else.

**The saved file (schema 0.25):**
- **`progression.milestones.major[i].power`**, a string: on a Major with a `choice` of type `power`, the power it holds. Ignored on any other Major.
- **`progression.specializationsGained`**, an array of specialization ids, `[]` by default. A reader keeps only ids that are this archetype's options and aren't the made-with one (an Admin change of Bloodline can make them equal), up to the held powers' total `gainsSpecialization`.

**Engine:**

1. **`checkPrereqs`:** `notWith` and `noSpecializationGained` (§5).
2. **`grants()`:** `feed` and `withering` (§5). `feedView` and `resolveHit` read them.
3. **`playPool(ch)`** (internal), and `isHeld`, `archetypePowers`, `powerRanks` read it (§5). `powerPool` is unchanged.
4. **`takeMajorChoice(ch, id, pick)`**, where `pick` is `{ power }`:
   - it refuses everything `takeMilestone` refuses;
   - it refuses a Major with no `choice`;
   - it refuses a power that isn't another specialization's of this archetype ("Choose a power of another Bloodline."), including one of the made-with specialization, an Innate one or an unknown id;
   - it refuses one already held ("You hold that already."). A gained Bloodline's power you haven't learned isn't held, so it can be picked.
   - On success it pushes `{ id, date, power }` and returns `{ ok: true, power: { id, name } }`.
   - The word "Bloodline" comes from the data's `specialization.label`, not from code.
5. **`gainSpecialization(ch, id)`**:
   - it refuses when no held power has `gainsSpecialization` ("Nothing you hold opens another.");
   - it refuses when all of them are used ("You've opened as many as you can.");
   - it refuses an id that isn't another option ("Choose another Bloodline.");
   - it refuses when a taken Major's prerequisites has `noSpecializationGained` ("Pure Blooded bars it.", the Major's name from the data);
   - otherwise it pushes the id and returns `{ ok: true, name }`.
   - **Nothing to do:** with every option opened or none left, the card shows no button, and the engine refuses as above.
6. **`takeMilestone`:** refuses a Major with a `choice` (§5).
7. **Total:** junk `power` (a number, an object, an unknown id) and junk `specializationsGained` (a string, `[1, {}]`, the made-with id, an unknown id) read as nothing held or opened, never a throw.

**UI** (behaviour, not markup):
- **Progression:** the Vampire's Majors draw as the Werewolf's do, under the archetype's name. **Take** on Splice opens the chooser. Choosing a power and **Take** commits once; Cancel changes nothing, and focus returns to Splice's Take button. The journal's Splice row names its power ("Splice: Bone Spines").
- **Archetype tab:** a Spliced power and a gained Bloodline's learned powers show with the others, each marked with its Bloodline ("Upyr"). Cursed Evolution's card has **Gained a bloodline** while one is still open to you (PQ6). The chooser lists the other Bloodlines, says the condition, and **Open** commits; afterwards the card reads "Opened: Upyr".
- **Buy or Raise a Power:** a gained Bloodline's powers list under **Learn a new power**, under its name, at 40 IP.
- **The Thirst panel's note** and **the hit's lines** say which Major changed the number (§5).

| Press | Where the record lands | Where focus goes |
|---|---|---|
| Splice → a power → Take | `milestones.major` gets `{ id: "splice", power }` | Splice's card, now taken |
| Splice chooser → Cancel | nothing | Splice's Take button |
| Gained a bloodline → Upyr → Open | `progression.specializationsGained: ["upyr"]` | the Cursed Evolution card |
| Journal ✕ on Splice → confirm | the row is gone; `powerIpe` unchanged (PQ5) | the journal |

Copy is drafted in tool voice. **Mark for a voice pass:** the chooser's condition sentence, "Gained a bloodline", and the refusals.

## 9. Worked examples, as the tests you write

**Write them first and run them on `main`'s code.** Each must fail, or you must say why it passes. Ruling tests in `rules.test.mjs` cite `0413`.

| Test name | File | Setup → result |
|---|---|---|
| `P17 1: a Vampire is offered 0413's Majors, less another Bloodline's` | rules | Strigoi: `majorOffered` has 20 ids, with Stolen Face and without Breath of Winter or Returning Strike. Upyr: Breath of Winter only of the three. |
| `P17 2: Blood Conditioning and Growing Hunger raise RoU and SFR` | rules | Street Strigoi: `sfr` 17 / RoU 6 → take both → 23 / 8. |
| `P17 3: Blood Feast and Blood Alchemist change the Thirst` | engine | `feedView` fresh 3 → 4 per HL; stored `upTo` 8 → 17. `feedGain` follows. |
| `P17 4: Wither Ward halves Withering through a hit, never below 1` | engine | 7 Withering → through 3, `witheringDamage` 3, `witherHalved` `{ from: 7, to: 3 }`. 1 Withering → 1. 7 Regular → 7. |
| `P17 5: Pure Blooded and Splice bar each other, and Pure Blooded bars a second Bloodline` | engine | With Pure Blooded: Splice unmet "Can't be taken with Pure Blooded"; `gainSpecialization` refuses "Pure Blooded bars it." With Upyr opened: Pure Blooded unmet. Per PQ2. |
| `P17 6: Splice holds one power of another Bloodline at rank 1, and IP raises it` | engine | Strigoi → Splice with `bone-spines`: `archetypePowers` has it at rank 1; `ipCost` raises it at 20 (rank × 20). `takeMilestone` refuses Splice without a pick; a Strigoi power, an Innate one, an unknown id, a held one each refuse and change nothing. Per PQ3. |
| `P17 7: Cursed Evolution opens one other Bloodline, whose powers are learned at the New Power price` | engine | Strigoi opens Upyr: Learn lists Upyr's six at rank 0; the first costs 40; a second open refuses; opening Strigoi refuses; Base Powers (`basePowerState`) still lists only Strigoi's. |
| `P17 8: a gained Bloodline doesn't count for a Bloodline's Majors` | engine | Strigoi with Upyr opened: Breath of Winter still hidden. Per PQ4. |
| `P17 9: the Major's power and the gained Bloodlines survive migrate and a hostile file` | engine | Junk as §8.7 reads as nothing; a round trip is equal; the schema reads 0.25; `newCharacter()` has `specializationsGained: []`. |
| `P17 10: Splice on Progression asks which power, and one undo takes it back` | smoke-sheet-skills | Take → the chooser lists Upyr and Draugur powers, no Strigoi; pick → one commit; undo → no Major, no power. |
| `P17 11: Gained a bloodline opens one, and Learn a new power lists it` | smoke-sheet-skills | Archetype tab → Gained a bloodline → Upyr → Open; the card reads "Opened: Upyr"; the Raise modal lists Upyr's powers under Learn a new power. |
| `P17 12: the Thirst panel and the hit say which Major changed the number` | smoke-sheet-skills (or the file the Thirst and hit smokes live in) | "Blood Feast" in the panel's note; "Wither Ward halves it: 7 → 3." in the hit's lines. |

## 10. Tests beyond §9

- **Totality:** the totality loop (`engine.test.mjs`, `degenerates()` ~605, run at ~675) gets a Vampire with junk `power` and `specializationsGained`, and calls `takeMajorChoice` and `gainSpecialization` with junk.
- **Hostile:** a Splice `power` and a `specializationsGained` entry with script-y strings render as text on Progression and the Archetype tab.
- **Voice:** the new copy passes `voice.test.mjs`.
- **The archetype-id guard** passes with no Vampire id in code.

## 11. Mutants, each of which must fail a test

List them in the PR and the log.

1. `notWith` ignored (P17 5).
2. `noSpecializationGained` checked on taking, not on opening (P17 5, its second half).
3. A gained Bloodline added to `powerPool` instead of `playPool`, so Base Powers see it (P17 7's last assertion).
4. Splice's power not held (P17 6).
5. `takeMajorChoice` accepting a made-with power (P17 6).
6. The `feed` grant ignored (P17 3).
7. Wither Ward without the floor of 1 (P17 4's second case).
8. Wither Ward halving Regular damage too (P17 4's third case).
9. `migrate` keeping a junk `power` (P17 9). **Second path:** check nothing else sanitises `power`. `_coerceNumbers` touches numbers only, and `power` is a string, so the Major pass is its only gate. Kill it there.
10. A gained Bloodline counted for Majors (P17 8).

**Second paths, checked in the pre-flight:** none of 1–8 or 10 is covered by another line. 9's only gate is the Major pass (above).

## 12. Steps

1. `git submodule update --init private`, then `npm run test:fast` on a fresh branch from `origin/main`. Note the totals. **Count `0413`'s Majors again** (`awk '/^## Growth/,0' private/crb/0413_Vampire.md | grep -c '^| [A-Z]'`, less the header). If it isn't 22, stop and ask.
2. Write §9's rows. Run them on `main`'s code and keep the output.
3. Data (§8), then the engine (§8.1–7), then `migrate`. `npm run test:fast`.
4. The UI (§8). `npm run verify`.
5. **Run it in the dev preview** (`shadows-dev-preview`) with a locked Strigoi:
   - take Blood Conditioning and Growing Hunger, and check Main's SFR and RoU;
   - feed with Blood Feast;
   - take a 7-Withering hit with Wither Ward;
   - Splice a power and undo it;
   - open Upyr and learn a power;
   - Pure Blooded refused;
   - at phone width: the Splice chooser and the Archetype card. Use metrics if the screenshot times out.
6. Docs:
   - Decision N with its INDEX line; 216 marked superseded in part, 199 and 201 noted as extended (§3).
   - SCHEMA §3.
   - The plan's P17 row; crb-v4-sync's P4b row and §1's `0413` line ("Majors: P4b" → built).
   - CHANGELOG plus `npm run changelog`; versions per §2.
7. `npm run verify` and `npm run phone-check`.

## 13. Stop and ask

- `0413` doesn't list 22 Majors, or one's text differs from §8's table.
- A row of §5 turns out to be wrong, and the fix isn't a line or two.
- **A code change outside:**
  - the engine functions named in §5 and §8;
  - `migrate` and `newCharacter`;
  - Progression's Major cards, journal and handlers, `openMinorChoice`'s pattern, the hit panel's lines, the Thirst panel, the Archetype tab's power cards, and the Raise modal's Learn list.
- PQ1–PQ6 unanswered when you start: they're Ken's, not yours.
- A test outside these **expected breaks** fails:
  - the `"0.24"` schema literals the bump moves;
  - the data-key guard, until each new key is read;
  - a test asserting the Vampire's `growth.majorMilestones` is empty, or "No Major Milestones listed" for a Vampire (none found in the pre-flight: `grep -n "No Major Milestones listed" tests/*.mjs` is empty; say so if one appears);
  - `"newCharacter matches the documented character schema"`, until SCHEMA §3 and `newCharacter` both carry `specializationsGained`.

## 14. Close-out and review checklist

**Close-out:** the close-the-session skill, *Rule or shape* tier. That covers:
- Decision N and its INDEX line; 216 marked;
- the log entry, with the mutants;
- `shipped.md`'s row;
- the plan's P17 row and crb-v4-sync's P4b;
- CHANGELOG plus `npm run changelog`;
- versions per §2;
- STATE rewritten (the Vampire row: Majors built; crb-v4-sync's last pass).

Suggested CHANGELOG lines (player voice):

- **Vampires have their own Major Milestones.** All 22, from Blood Conditioning to Death Rites. The ones that change a number change it on the sheet.
- **Splice and Cursed Evolution reach into another Bloodline.** Splice asks which power you take; Cursed Evolution opens a second Bloodline whose powers you learn with IP.

**Review checklist:**

- [ ] §9's twelve tests exist with those names, and the PR shows them run on `main`'s code.
- [ ] §5's rows are each confirmed or corrected in the PR.
- [ ] `git diff origin/main --stat -- src/engine src/ui` touches only what §13 allows.
- [ ] No archetype id in `src/engine` or `src/ui` (the A8 guard passes).
- [ ] `powerPool` is unchanged; Base Powers and Admin's prune never see another Bloodline.
- [ ] Decision N's shape passes `docs.test.mjs`; *Replaces* checked against 216's, 199's and 201's text; 216 is marked.
- [ ] Schema 0.25 with its `migrate()` step; `newCharacter` round trip.
- [ ] The dev-preview run happened (§12.5), including undo and phone width.
- [ ] Mutants are listed in the PR **and** the log.
- [ ] `npm run verify` and `phone-check` are green; versions are per §2, and the PR says which case.

## 15. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<plan>/<order>` = `sheet-wishlist/P17-vampire-majors.md`, `<id>` = **P17**, and these traps under the builder's:

> Six things in this order are easy to get wrong:
>
> 1. **`powerPool` doesn't change.** Base Powers and two Admin prunes read it. Another Bloodline goes in `playPool`, read by `archetypePowers` and `powerRanks` only.
> 2. **Every Vampire holds Cursed Evolution.** Pure Blooded is barred by a Bloodline *opened*, never by the power being held (PQ2).
> 3. **No archetype id in code.** Splice, Pure Blooded and Cursed Evolution work through data keys (`choice`, `notWith`, `noSpecializationGained`, `gainsSpecialization`); the A8 guard fails on `"splice"` in `engine.js`.
> 4. **Every action says what it does with nothing to do.** A full set of opened Bloodlines shows no button; Splice with every other power held refuses, saying so.
> 5. **Wither Ward halves last**, after armor and Natural Armor, and never below 1 when anything got through.
> 6. **Write a regex into a file with the editor, never through a shell heredoc**, which drops backslashes.
>
> Tier: Rule or shape. One numbered decision, the next free. Character schema 0.25. Versions per §2. Use the close-the-session skill at the end.
