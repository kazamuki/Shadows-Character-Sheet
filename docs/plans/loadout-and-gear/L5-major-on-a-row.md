# Work order L5: a Major on one weapon or armor row

**Plan:** [`../loadout-and-gear.md`](../loadout-and-gear.md) §3, row L5, and its *What each order settles* bullet. **Wish:** [W136](../../WISHLIST.md), its Majors half. **The book:** `0412` *Professional*, the General Majors: Custom Fit and Tuned Edge (no Major required), Signature Weapon and Weapon Expert (1 required), Iconic Weapon (3), Legendary Weapon (5) (`private/crb/0412_Professional.md` ~410–560). Decisions 120, 217, 223, 233, 237, 247, 248.

**The split (Ken's ruling, 2026-11-01, in the conductor session).** W136 had two halves: the six General Majors that change one carried weapon or armor row, and eight Vampire and Werewolf powers that change claws, fangs and melee damage while they run (LQ5). The powers can't be drafted without L4. A natural line has only a display name today ("Bite", "Claws", "Fangs"), so nothing says which line a power that names "your bite" reaches. And whether "+3 melee damage" reaches natural attacks is the question L4's handoff put to the 2026-10-29 meeting. Ken picked **"Split it"** over "hold all of L5" and "S13b instead". **L5 is the six Majors. The eight powers are L5b, after L4,** drafted from the meeting's notes, and LQ5's answer (conditional marks, never summed) stays with them.

**Status: built 2026-11-01 (Decision 263; app 0.60.0, game data 0.51, character schema 0.32), PR #288.** Drafted by Claude (Opus), S21's reviewer, as the plan's orchestrator. Ken's voice pass on the review (six rewrites) is applied.

**Approved by Ken 2026-11-01** (in the conductor session: "Approve it"), as drafted.
**LQ29–LQ34 answered by Ken 2026-11-01 (in the conductor session): every default.** He picked "On the row", "On Loadout", "Both defaults" for LQ31 + LQ32, and "Both defaults" for LQ33 + LQ34. Recorded on #286 (issuecomment-6553843606).

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **L5 build** (Sonnet), then a fresh **L5 review** (Opus) once the PR is open. Builder and reviewer message each other directly. Anything for Ken goes to the conductor. §15 is the hand-over.

**Runs alone.** It touches `engine.js` (the loadout readers, `migrate()`, `untakeMilestone`), `shadows-data.js` (six Majors, `armorRules`), `sheet.js` (Loadout's weapon rows and armor cards, Main, print, Progression's Major journal), `shadows.css` (one rule at most), and the docs.

**Carried over** (the last two reviews):
- **From S21 (#285), the order's misses.**
  - §8 said "`present` + the typed name" and missed that main's field split names on commas (its placeholder said so). Ken ruled "split on commas". *Lesson: when an order replaces a control, sweep what the old control **parsed**, not just where it rendered.* **Here:** L5 replaces no control. It adds a field to two kinds of row, so the sweep (§5) lists every **writer** of a weapon or armor row (add, remove, custom, migrate, the GM's copy), not only the readers.
  - The **Add a player** refusal wasn't in §9's *Where things land* for Who was there, though the encounter's twin had it. *Lesson: a twin control gets every row its twin has.* **Here:** the weapon row's Majors and the armor card's are twins. §9's table has a column for each, and every refusal is a row.
  - The decision was counted at 324 words, and a clause the fix round added took it to 331. *Keep headroom.* **Here:** §3's draft is **300 words** (`wc -w`, *Touches* included), so 50 are free under the cap.
- **From S21, what worked:** the voice table in the reviewer's first message, mutants re-run by the reviewer, and browser numbers in the PR. Keep all three.
- **From L3 (#257, in `L4-handoff.md` §4):** a reader nobody remembered (the written-in weapon's edit row read the line's ACC, which by then had the worn bonus in it). **Here:** Tuned Edge changes a written-in row's damage, so §5 has a row for the edit row's damage field.

**Pre-flight against `main` at `b81e030`** (#285 merged). App **0.59.0**, which is still `[Unreleased]` (the live site is 0.57.0). Game data 0.50, character schema 0.31. The highest decision is 262, so **N** is 263 today. The highest flag is F49. This order raises none. The probes ran in Node through `tests/harness.mjs`'s `loadEngine`, from a scratch script that isn't committed: a Professional, every stat 5, carrying a Combat Knife, an AP-7 "Sentry", a Cheapshot, a written-in "Pipe" (Melee, `BOD+2`) and an Urban Tactics Vest, with all six Majors pushed onto `milestones.major`.

```
Who is offered them   majorListed(Professional) holds all six. They're `majorGeneral`, the Professional's alone (Decision 217, F9);
                      any other archetype holds one only if it kept it from before 217
What they do on main  Nothing. Held, each changes no number: Combat Knife attack 5, damage 8 (BOD+3), 0 slots; AP-7 attack 5,
                      ACC 3, damage 6, slots {3, used 0, free 3}; Cheapshot 5 / 0 / 5, 0 slots; Pipe damage 7 (BOD+2), no
                      modSlots; the vest PROT 1d6, protMax 6. Every `bonuses` is []. No line has `kickers`
A Major's saved row   { id, date } (takeMilestone ~3121); { id, date, power } for a choice (Decision 223, ~3184); { id, custom,
                      name, benefit, date } written in (~3200). migrate ~4858 keeps `power` and the custom three, nothing else
A weapon row          { id, notes, mods, roundsSpent, loaded? }; written in: { custom, name, damage, capacity, ammo, features,
                      notes, roundsSpent, category?, damageType?, range?, acc?, rofModes?, loaded? }. No id of its own
An armor row          { id, integrityLoss, notes, worn, scrapped, upgrades }; written in: { custom, name, prot, res, integrity,
                      coverage, … }. No id of its own
Rows move             removeLoadout ~2405 splices: remove weapon 0 and the AP-7 becomes weapon 0. An index saved anywhere
                      moves with it. That's the plan's worry, confirmed
migrate and a stray   migrate keeps an unknown key on a row: { id:"ap7-sentry", majors:["tuned-edge"] } comes through as is.
                      So L5's step must clean it, and today's files can't hold a `majors` the engine would trust
Kickers that could    Every `kicker` grant in the data (8): Combat Sense 1d4 and Medical 1d4 (always); Stealth 1d6 (always);
  meet Weapon Expert  Hunter's Calling 1d6 on all eight attack Skills (when); Unwavering Focus 1d4 on the focused Skills (when);
                      Wind Dancing 1d6 Dodge (when); Survival Instinct 1d4 Dodge and Melee (when, a Defensive Action).
                      No unconditional 1d4 reaches an attack Skill today, so Weapon Expert's 1d6 is reached only through a
                      condition (Unwavering Focus) or later data
Mod slots             25 of 54 catalog weapons have `mods` > 0. A written-in weapon has no `modSlots` and takes no mod
                      (weaponModOptions ~2163 returns null for one). Slots come only from the data (`line.modSlots`, ~1948)
PROT dice             Body armor in the catalog rolls 1d4, 1d6 or 1d8. A written-in piece's PROT is typed text. `dieMax`
                      reads "d6" or "1d6"; "2d6" or "1d6+1" read as no die (protMax null)
Who reads the PROT    armorState ~1439 builds every piece through armorPiece ~1402, and everything that rolls or shows a worn
                      piece's PROT reads armorState: resolveHit ~1699 (and its cap, ~1590), the hit modal (sheet ~1053,
                      ~1082), Loadout's card (~2157), Main (~475), print (~2736, ~2773), and GM mode's seat (engine ~9317).
                      armorPiece's other callers (setWorn, the upgrade checks, catalogLine) read slot, upgrades or a
                      catalog entry, never a row's PROT. GM's ~9320 rebuilds a cast row's piece from its id: not a PC row
Who reads a weapon    weaponLine ~1929: Loadout (sheet ~2107; catalog rows ~2122, written-in rows ~2132, the open edit row),
  line                Main (~458; ~466, ~470), print (~2753; ~2755, ~2758), weaponModOptions ~2167 (reads modSlots),
                      validate ~5652 (reads `missing`), the fire-mode handler (~4051). catalogLine ~2253 draws a weapon you
                      don't hold yet from weaponDefLine, never weaponLine: no row, no Major
```

---

## 1. Goal and Done when

**Goal.** A Professional who takes Tuned Edge, Custom Fit, Signature Weapon or Weapon Expert puts it on the one weapon or armor it's for, and the sheet does the arithmetic the card describes. That weapon's damage is 1 higher, that armor's PROT die a step up, that weapon has more mod slots or a kicker on its attack. Iconic and Legendary Weapon add to whichever weapon carries Signature. Removing another row never moves a Major. Removing its own row takes the Major's effect with it, as the book says ("lost if it is sold, destroyed, or replaced").

**Done when:**
- A held Tuned Edge, Custom Fit, Signature Weapon or Weapon Expert can be put on one row of its kind, moved to another, or taken off, on Loadout. Each is one undoable action.
- **Tuned Edge** on a weapon: its numeric damage +1 on Loadout, Main and print, with "+1 from Tuned Edge" under it on Loadout. A text damage keeps its text and still lists the +1.
- **Custom Fit** on a body piece: its PROT die one step up the book's ladder (d4 → d6 → d8 → d10 → d12, never past d12) on its card, the hit modal (and the roll's cap), Main, print and a GM's seat.
- **Signature Weapon** on a catalog weapon: +2 mod slots. **Iconic** +1 and **Legendary** +1 more on the same weapon, while each is held.
- **Weapon Expert** on a weapon: a **1d4** kicker beside its attack on Loadout, Main and print. It's a **1d6** instead when an unconditional 1d4 kicker already reaches that weapon's Skill. A conditional 1d4 shows as a note.
- Removing another row leaves every Major where it was. Removing a Major's row, or removing the Major (Progression's ✕), leaves the Major off every row.
- A saved file opens with every Major off every row. `migrate()` keeps only a well-formed `majors` list, and junk reaches nothing.
- With none of the six held, or held and on no row, no weapon line and no armor piece moves (L5 8's diff).

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** A save-file shape (`majors` on a weapon or armor row), a data shape (`row` on a Major, `protDice` on `armorRules`), and player-facing behaviour someone could have chosen otherwise.
- **Character schema:** 0.31 → **0.32**, with a `migrate()` step (§8). Take the next minor if another branch lands first.
- **Game data:** 0.50 → **0.51** (Decision 68): a character's computed values change once a Major is on a row.
- **App:** a minor, **0.60.0** (`npm run bump -- 0.60.0`). 0.59.0 is still under `[Unreleased]`, and the heading moves to 0.60.0. Take the next minor if another branch lands first.
- **Decision:** the next free number, written **N** (263 today). **Flags:** none.
- **Wishes:** W136 stays open for its powers half (L5b). Its *Plan* line is rewritten by this order's docs PR.

## 3. The decision, drafted

Paste it after the last decision, add its INDEX §3 line under **Sheet & play tracking** (beside 248), and fill in **Built**. 300 words with *Touches* (`wc -w`), so 50 are free under the cap. If it must shrink, cut prose, never *Touches*. It supersedes nothing, so it gets no marks.

```
N. **A General Major that changes one weapon or armor goes on that row: the row keeps the Major's id, so removing another row never moves it, and removing the row loses it.**
     *2026-11-0X · Ken + Claude · Touches: majors on weapons and armor rows, setMajorRow, majorRows, untakeMilestone, row on a Major, follows, weaponLine, armorState, protDice, modSlots, kickers, bonuses, Tuned Edge, Custom Fit, Signature Weapon, Iconic Weapon, Legendary Weapon, Weapon Expert, W136, L5b, LQ29–LQ34, character schema 0.32, Decision 120, Decision 223, Decision 233, Decision 248*
     - **Decided:** A Major whose data has `row` goes on one weapon or armor row of its `kind`, stored as its id in that row's `majors`; one row at a time, moved or cleared on Loadout, cleared when the Major is removed. Tuned Edge adds 1 damage (listed in `bonuses`); Custom Fit steps a body piece's PROT die up `armorRules.protDice`, never past d12; Signature adds 2 mod slots to a catalog weapon and Iconic and Legendary 1 each to Signature's (`follows`); Weapon Expert puts a 1d4 kicker on the line, a 1d6 when an unconditional 1d4 reaches its Skill. Readers count a Major only while it's held.
     - **Why:** W136; the book says each applies "only to that weapon" or armor, "lost if it is sold, destroyed, or replaced".
     - **Rejected:** the row on the Major, with an id on every loadout row (LQ29); an index (rows move); a pick when taken (LQ30); refusing a move (LQ31); Signature on a written-in weapon (no mods).
     - **Replaces:** nothing; extends 120 (mod slots), 233 (a kicker beside the attack), 248 (`bonuses`).
     - **Revisit if:** L5b's powers need the pointer; Ken rules a weapon's "free Upgrade" (LQ34); a written-in weapon takes mods.
     - **Built:** app 0.60.0, game data 0.51, character schema 0.32, PR #…, log 2026-11-0X (L5).
```

## 4. Questions for Ken

| Id | Question | Default | Answer |
|---|---|---|---|
| LQ29 | **Where the pick is saved.** The plan's row says "a Major saves which row it changed". Saved that way, every weapon and armor row needs an id of its own (they have none: rows are an array), and removing the row leaves the Major pointing at nothing. The other way round, the **row** keeps the Major's id (`majors: ["tuned-edge"]`), so the pick goes wherever the row goes, and removing the row takes it with it, as the book's "lost if sold, destroyed or replaced" says. Which? | **On the row.** One field on the rows that carry a Major, no id on every row, and nothing left dangling. The plan's wording is rewritten to match | Default (Ken, 2026-11-01) |
| LQ30 | **Where the player puts it.** On Loadout, each weapon row (and each body armor card) lists the held Majors that can go on it as checkboxes, so the pick is made beside the weapon. Or asked on Progression when the Major is taken, as Splice asks for its power? | **On Loadout.** A Professional can take Tuned Edge before buying the weapon, and a picker at take time has nothing to offer then. Progression's journal says where each one is ("Tuned Edge: AP-7 "Sentry"", or "not on a weapon yet") | Default (Ken, 2026-11-01) |
| LQ31 | **Moving it.** The book says Tuned Edge is lost if the weapon is replaced, and Signature can be rebuilt. Once a Major is on a row, can the player move it to another row (one press, undoable, logged), or is it refused once placed? | **Moving is allowed.** The sheet keeps the player's record; whether the move is earned is the GM's call, as with every Milestone. The log line says it moved | Default (Ken, 2026-11-01) |
| LQ32 | **Signature's slots in use.** A weapon with 3 slots of its own and 5 mods on (2 in Signature's slots). Moving Signature off it: refuse until mods come off, or allow, with the line reading "5 of 3 slots used"? | **Refuse the move** ("Take 2 slots of mods off first: they're in Signature Weapon's slots."). Removing the Major itself (Progression's ✕) can't be refused, so a line over its slots shows "5 of 3 slots used", and no new mod fits until it's back under | Default (Ken, 2026-11-01) |
| LQ33 | **A written-in weapon.** It takes no mods (L2), so Signature's slots would have nowhere to go. Can Signature go on one? | **No.** Tuned Edge and Weapon Expert can go on any weapon, written in or not. Signature, Iconic and Legendary need a catalog weapon. Custom Fit needs a body piece whose PROT reads as one die (a written-in piece too) | Default (Ken, 2026-11-01) |
| LQ34 | **The book (yours): a weapon's "free Upgrade".** Signature, Iconic and Legendary each give "+1 free Upgrade". In `0460` an Upgrade is armor's (an armorer installs it in a mod slot), and a weapon takes *mods*, which the app doesn't price. Is a weapon's Upgrade a mod that takes no slot, or something else? | **Compute nothing for now.** The weapon's row names the Majors on it, and each Major's card keeps its text. If it's "a mod that takes no slot", that's a later order's one rule | Default (Ken, 2026-11-01) |

**Settled by the order, not asked** (say so if Ken disagrees):
- **Removing the Major removes it from its row** in the same action, so taking it again starts off every row and nothing is guessed. One undo restores both.
- **Iconic and Legendary aren't placed.** They follow Signature's row (`follows`). With Signature on no row, or not held, they add nothing, and their journal row says "goes with Signature Weapon".
- **Weapon Expert's 1d6** is computed only from an unconditional 1d4 on the weapon's Skill, and none reaches an attack Skill today (the probes). A conditional 1d4 (Unwavering Focus while active) leaves the line at 1d4, with a note: "1d6 instead while Unwavering Focus is active". The Skill's own row still shows its own kicker. F46 (how two kickers combine) isn't touched, because Weapon Expert's text says how its own does.
- **Custom Fit applies whether or not the piece is worn,** since it's a fact about that armor. Only a worn piece rolls.
- **Tuned Edge's "significantly modified again"** isn't detected. Installing a mod doesn't take it off. That's the GM's call, and the player can take it off.

## 5. The assumption sweep

Every reader and writer below was found by grep on `b81e030`. The last column answers the three questions for each row: which guards read the value, where it renders, and what text points at it.

| What changes | Today, where | After | Readers, writers and twins |
|---|---|---|---|
| A weapon row | No Major field (`addLoadout` ~2266, the written-in push ~2401) | `majors?: [id]` (§8), absent when empty | **Writers:** `addLoadout`, the written-in push, `removeLoadout` ~2405 (splice: the field goes with the row), `migrate` ~4908, `setMajorRow` (new), `untakeMilestone` (new step). A GM's seat copy is a whole character through `migrate` (Decision 254), so it needs nothing else. **Readers:** `weaponLine` and through it everything in the pre-flight's "Who reads a weapon line" |
| An armor row | No Major field (~2282, ~2400) | `majors?: [id]` | **Writers:** as weapons, and `setWorn` ~2414 (must leave `majors` alone: it only flips `worn`), `scrapArmor`/upgrades (~2461, ~2468: they touch `upgrades`, not `majors`). **Readers:** `armorState` and everything that reads its pieces |
| A Major in the data | Six with `benefit` text; Iconic has a `checkMod` grant (`whenText`, unchanged) | Each gains `row` (§8) | Decision 135's key guard (`tests/engine.test.mjs` ~307), by key name: `follows`, `catalog` and `becomes` are new and fail until read; `row`, `over`, `kind`, `slot`, `grants`, `type`, `amount` and `die` already pass, because other code reads those names, so L5 1–L5 4 are what prove each is read here. `protStep` and `modSlots` are `type` values, not keys. `grantSources` reads a Major's top-level `grants` (Iconic's), never `row.grants`, so nothing in `row` reaches a Skill's row (L5 7 pins it) |
| `armorRules` | No ladder | `protDice: ["1d4","1d6","1d8","1d10","1d12"]` | `armorRules`' readers: armorPiece's `R`, the hit modal's `R` (sheet ~1272). `protDice` is a new key, so the guard fails until `armorState` reads it (L5 2) |
| `weaponLine` | `bonuses` (L3), `modSlots` (catalog), no `kickers`, no `majors` | Tuned Edge in `bonuses`; Signature's slots in `modSlots`; `kickers: []` and `majors: []` on every line, catalog and written in | `weaponModOptions` ~2167 (reads `modSlots`: Signature's slots become installable with no other change); Loadout's slot text (sheet ~2078, "N of M slots free"); `bonusLinesHtml` ~2018 (shows Tuned Edge with no change); **the written-in edit row** (`weaponOpenRowHtml`): its damage field must show the stored text, never the line's damage with Tuned Edge in it (L3's ACC lesson; `accPicked` is the precedent); tests pinning `bonuses` to `[]` (~10575, ~10578, ~10673, ~10708: none holds a Major, so they still pass) and `modSlots` (~2443) |
| The attack as drawn | `attackText(l.attack)` in six places | The kicker beside it: "+5 + 1d4", as a Skill's row reads (Decision 233, sheet ~339) | Loadout ~2122, ~2132; Main ~466, ~470; print ~2755, ~2758 (twins: every one gets it). Not the catalog picker (~1797, no row) and not natural lines (~2432, ~2453, not weaponLine) |
| `armorState` | Pieces from `armorPiece(e, i)` | Custom Fit's step on the piece's `prot` and `protMax`, and `majors` on each piece | resolveHit and its cap (~1590, the message names the die, which reads the stepped one); hit modal (sheet ~1082); Loadout card (`armorStatLine` ~2157); Main (~475); print (~2741, ~2774); GM seat (engine ~9317, `die: worn.prot`). Not `armorPiece`'s other callers (slot and upgrades only) |
| `untakeMilestone` | Splices the Major (~3187) | Also removes its id from every row's `majors` | Progression's ✕ (sheet ~3837–3844). Its confirm text names a spliced power; it gains the row's name the same way ("Tuned Edge comes off AP-7 "Sentry" too") |
| Progression's Major journal | `name: power` for a choice (sheet ~1690) | `name: <row name>` for a row Major, or "not on a weapon yet" / "goes with Signature Weapon" | Its only reader is that row. The Major's card (`majorHtml`) is unchanged |
| `migrate` | A stray `majors` comes through as is (the probes) | §8's step | `tests/hostile.test.mjs` (a file's junk), the schema literal (§13) |
| **Player's side only** | — | — | `grep -rn "majors\b" src/ui/` hits nothing on `b81e030`. GM mode reads a seat through `armorState` and `skillLine`, never `weaponLine` (grep), so a GM sees Custom Fit's die on a seat and nothing else |
| Text that points at this | — | — | The six Majors' `benefit` text stays the book's. `0460`'s "Slots cannot be added after manufacture" is the book's general rule, and Signature is its exception (no app text quotes it: grep). W136's *Plan* line and the plan's L5 row (this order's docs PR) |

## 6. Read first

- `CLAUDE.md`: constraints 6 (ids immutable: a Major's id in a row is referenced from files), 7 (store inputs: the pick is stored, every number computed), 8 (total), 10 (a file is untrusted). *Decisions*.
- `docs/SCHEMA.md` §4: 120, 217, 223, 233, 237, 247, 248.
- `engine.js`: `weaponLine`, `applyWeaponBonuses`, `customWeaponLine`, `weaponModOptions`, `armorPiece`, `armorState`, `dieMax`, `skillLine` (its `kickers` and `marks`), `takeMilestone`, `untakeMilestone`, `majorById`, `majorTakenIds`, `addLoadout`, `removeLoadout`, `migrate`'s weapons and armor steps (~4908, ~4928).
- `sheet.js`: `weaponRowsHtml`, `weaponOpenRowHtml`, `weaponModsHtml`, `armorRowHtml`, `armorStatLine`, Main's weapon and armor block (~458–480), `pWeaponRows` and the print armor rows (~2736–2780), Progression's Major journal (~1683) and its ✕ handler (~3837).
- `private/crb/0412_Professional.md`, the six Majors.
- `L3-worn-modifiers.md` §8–§9: the pattern this reuses (a modifier on the line, a sub line naming its source, a toggle that's one action).

## 7. Out of scope

- **The eight powers on natural weapons (L5b).** Rend and Tear, Bone Spines, Monstrous Maw, Rending Claws, Blood of Valhalla, Let It Loose, Steel Fangs and Serrated Claws. Not here, even as text.
- **Natural lines** (`archetypeWeapons`, `formView`): no Major reaches them.
- **Signature's Attunement, Iconic's +5 social (already a grant), Legendary's Signature Effect and Attunement:** text, as today.
- **A weapon's "free Upgrade"** (LQ34): nothing computed.
- **Tools of the Trade** ("+1 to checks made with one specific tool or kit") is also one row, a gear row. It isn't in W136, and it would need a gear row's `majors` and a `checkMod` scoped to a row. Raise it as a wish if Ken wants it (§14).
- **Detecting "significantly modified"** (Tuned Edge) or "sold, destroyed, or replaced" beyond removing the row.
- **A Major written in by a GM** (Decision 217): it has no `row`, so it can't be placed.

## 8. The shapes

**Data** (`gamedataVersion` 0.51), on the six `majorGeneral` entries and `armorRules`:

```js
{ "id": "tuned-edge", …,       "row": { "kind": "weapons", "grants": [{ "type": "weaponBonus", "to": "damage", "amount": 1 }] } },
{ "id": "custom-fit", …,       "row": { "kind": "armor", "slot": "body", "grants": [{ "type": "protStep", "amount": 1 }] } },
{ "id": "signature-weapon", …, "row": { "kind": "weapons", "catalog": true, "grants": [{ "type": "modSlots", "amount": 2 }] } },
{ "id": "iconic-weapon", …,    "row": { "follows": "signature-weapon", "grants": [{ "type": "modSlots", "amount": 1 }] } },
{ "id": "legendary-weapon", …, "row": { "follows": "signature-weapon", "grants": [{ "type": "modSlots", "amount": 1 }] } },
{ "id": "weapon-expert", …,    "row": { "kind": "weapons", "grants": [{ "type": "kicker", "die": "1d4", "over": "1d4", "becomes": "1d6" }] } },
// armorRules
"protDice": ["1d4", "1d6", "1d8", "1d10", "1d12"],
```

- `row.kind` is `"weapons"` or `"armor"`. `slot` limits armor to a slot. `catalog: true` refuses a written-in row. `follows` names a Major whose row this one adds to, and it never has a `kind`.
- A `weaponBonus` in `row.grants` has no `class` or `feature`: it reaches only its row. `amount` is a whole number ≥ 1 (L3's `goodWhole`), else it reaches nothing.
- `protStep` moves the die `amount` places up `protDice`, stopping at the last. A die not in the list (typed "2d6") is unchanged.
- `modSlots` adds `amount` to a catalog line's `modSlots.slots`.
- `kicker` puts `die` on the line, or `becomes` when an unconditional kicker of exactly `over` reaches the weapon's Skill.
- A comment above `majorGeneral` gains one line: a Major with `row` goes on one loadout row, its `grants` read only there (Decision N). One above `armorRules.protDice` says it's the book's ladder for Custom Fit.

**The saved row** (character schema 0.32):

```js
{ id: "ap7-sentry", notes: "", mods: [], roundsSpent: 0, majors: ["tuned-edge", "signature-weapon"] }   // absent when empty
{ id: "urban-tactics-vest", …, majors: ["custom-fit"] }
```

**`migrate()`**, on weapons and armor (after the existing steps, ~4908 and ~4928): `majors` keeps only strings that name a `majorGeneral` entry whose `row.kind` is this list's (`follows` Majors are never kept), each once. Across the list, the first row holding an id keeps it and later rows lose it. An empty result deletes the key. Running it twice changes nothing. It doesn't check that the Major is held: readers do (constraint 7).

**Engine** (exported as named):
- `majorRows(ch) → [{ id, name, kind, index, rowName, follows }]`: one entry per held Major with `row`, in `milestones.major` order. `index` is the row's index, or `null` when it's on none; `rowName` is that row's name or `null`; `follows` is the followed Major's id or `null` (then `kind` and `index` are the followed Major's). Total: `[]` for anything that isn't a character.
- `setMajorRow(ch, id, index) → { ok: true, moved: <the old row's name or null> } | { ok: false, why }`. `index` null takes it off. It refuses:
  - a Major that isn't held ("Take it first.");
  - one with no `row`, or a `follows` one ("It goes with Signature Weapon.");
  - a row that isn't there;
  - a row of the wrong kind or slot, or a written-in row with `catalog` ("A weapon you wrote in takes no mods.");
  - Custom Fit on a piece whose PROT isn't one die ("Its PROT isn't one die.");
  - Signature off a row whose mods use its slots (LQ32's sentence).

  On success it removes the id from every row of that kind and adds it to `index`'s. A refusal writes nothing.
- `untakeMilestone(ch, "major", i)`: as today, then removes that id from every weapon's and armor's `majors`.
- `weaponLine(ch, index)`, catalog and written in, after `applyWeaponBonuses`:
  - each held Major on this row (and each held `follows` of one) applies its `row.grants`;
  - `weaponBonus` adds as L3's do, into `bonuses` with `from` the Major's name;
  - `modSlots` adds to `modSlots.slots`, with `free` recomputed (never below 0) and `over` = used − slots when that's positive;
  - `kicker` pushes `{ die, from, instead?: [{ die, whenText }] }` into `kickers`.
  
  `majors: [{ id, name }]` lists every one that applied. `kickers` and `majors` are `[]` on every line.
- `armorState(ch)`: each piece gains `majors`, and Custom Fit's step replaces `prot` and `protMax`, with `protBase` keeping the die before it. Total, as today.

## 9. The UI

**A weapon row on Loadout** (catalog and written in): when the character holds a placeable weapon Major, a line under the row, **Majors** ✎, with a checkbox per held placeable weapon Major that this row can take. Each is ticked while it's on this row. One that's on another row is unticked, with "on <that row's name>" beside it ✎. Ticking it moves it. A Major this row can't take (Signature on a written-in row) isn't listed. With none of the six held, nothing renders. Under the row's numbers:
- Tuned Edge as the existing sub line, "+1 from Tuned Edge";
- Signature's slots in the existing "N of M slots free", plus a sub line "+2 from Signature Weapon" ✎ (Iconic and Legendary the same);
- Weapon Expert in the Attack cell, "+5 + 1d4", with "1d4 from Weapon Expert" ✎ under it, and any `instead` note ("1d6 instead while Unwavering Focus is active" ✎).

**A body armor card**: the same **Majors** line for Custom Fit. Its stat line reads "PROT 1d8" ✎, with "1d6 + a step from Custom Fit" under it.

**Main and print**: the totals only. The kicker joins the attack ("1d10+5+1d4"), the stepped die joins PROT.

**Progression's Major journal**: a row Major's line reads "Tuned Edge: AP-7 "Sentry"", "Tuned Edge: not on a weapon yet" ✎, "Custom Fit: not on armor yet" ✎, or "Iconic Weapon: goes with Signature Weapon" ✎.

**Where things land** (both twins, each with every row):

| Press | Weapon row | Armor card | Stored | Audit line ✎ | Focus after |
|---|---|---|---|---|---|
| Tick a Major on no row | — | — | `majors` gains the id on this row | `Tuned Edge on AP-7 "Sentry"` | the same checkbox, ticked |
| Tick one that's on another row | the other row loses it | the same | moved | `Tuned Edge moved to Combat Knife` | the same checkbox |
| Untick | the row loses it | the same | removed (key deleted when empty) | `Tuned Edge off AP-7 "Sentry"` | the same checkbox |
| Refused (LQ32, or a hand-edited page) | nothing changes | nothing changes | nothing | — | a notice with the `why`; the checkbox shows what's stored |
| Remove another row (✕) | every Major stays on its row | the same | as today | as today | as today |
| Remove the Major's row (✕) | its Majors go with it; the journal says "not on a weapon yet" | the same | as today | as today | as today |
| Remove the Major (Progression ✕) | its row loses it in the same action; the confirm names the row | the same | both | `Remove Major: Tuned Edge` (as today) | as today |
| Undo of any of these | as it was | as it was | as it was | — | as the undo toast does today |
| No placeable Major held | no **Majors** line | no **Majors** line | — | — | — |

A checkbox has no bad text value, so a refusal can only come from LQ32 or a row the engine rejects.

**New copy, for the voice pass** (✎): the **Majors** label; "on <row>"; the three sub line patterns; the kicker's "instead" note; the journal's three phrasings; the three audit lines; `setMajorRow`'s six refusals; the ✕ confirm's "comes off <row> too"; and the changelog line, drafted:
> **Majors on your gear.** Put Tuned Edge, Custom Fit, Signature Weapon or Weapon Expert on the weapon or armor it's for, on Loadout, and the sheet does the math: the damage, the PROT die, the mod slots, the kicker.

## 10. Worked examples, as named tests

The character: a locked Professional, every stat 5, Handguns and Melee rank 3, carrying the probes' rows (Combat Knife, AP-7, Cheapshot, the Pipe, the Urban Tactics Vest), with the Majors each test names on `milestones.major`. "Before" numbers are read from `main`'s functions in the test, never typed here. Write these first and show each failing on `main`, or say why one passes there.

| Test (file) | Pins |
|---|---|
| `L5 1 (engine): Tuned Edge on a weapon adds 1 to its damage, lists it, and stays on it when another row is removed` (`engine.test.mjs`) | On the AP-7: `damage` = before + 1, `bonuses` `[{ to:"damage", amount:1, from:"Tuned Edge" }]`; every other row's line unchanged. On the Pipe (written in, `BOD+2`): damage + 1, and the edit row's damage field still reads "BOD+2". Remove the Combat Knife (index 0): the AP-7, now index 0, still has it. Remove the AP-7: no row has it, `majorRows` says index null. Not held (`untakeMilestone`): no row moves. *Mutants:* the bonus not added; added by index (a row removed before moves it) |
| `L5 2 (engine): Custom Fit steps a body piece's PROT die up the ladder, never past d12, and the hit reads the stepped die` (`engine.test.mjs`) | Computed over every catalog body piece: 1d4 → 1d6, 1d6 → 1d8, 1d8 → 1d10, protMax to match, `protBase` the old die. A written-in piece typed "1d12" stays 1d12; one typed "2d6" is refused by `setMajorRow`. The vest worn: `resolveHit` accepts a PROT roll of 8 (refused on `main`, cap 6), and its refusal names "1d8". A hand piece is refused. *Mutants:* no cap at d12; the step not applied in `armorState` |
| `L5 3 (engine): Signature Weapon adds 2 mod slots to a catalog weapon, and Iconic and Legendary 1 each to the same one` (`engine.test.mjs`) | The AP-7 (3 slots): Signature → 5, + Iconic → 6, + Legendary → 7; `weaponModOptions` offers a mod into slot 4. The Cheapshot (0): Signature → 2, and "has no mod slots" is gone. Iconic held with Signature on no row: nothing. Signature on the Pipe: refused. *Mutants:* `follows` ignored; Iconic counted without Signature placed |
| `L5 4 (engine): Weapon Expert puts a 1d4 kicker on the line, a 1d6 when an unconditional 1d4 already reaches its Skill, and a note for a conditional one` (`engine.test.mjs`) | On the AP-7: `kickers` `[{ die:"1d4", from:"Weapon Expert" }]`, attack unchanged (a kicker is never in the number, 233). A fixture (`withData`) gives Handguns an unconditional 1d4: the kicker is "1d6". A fixture with that 1d4 conditional: "1d4" with `instead` `[{ die:"1d6", whenText }]`. Computed from the data, never from §4's list: no unconditional 1d4 reaches an attack Skill in the real data (the probe), so without a fixture it's 1d4 everywhere. *Mutant:* `over` ignored |
| `L5 5 (engine): setMajorRow puts a Major on one row, moves it, takes it off, and refuses what doesn't fit, writing nothing` (`engine.test.mjs`) | Every refusal in §8, each leaving the character deep-equal. A move removes it from the old row. LQ32: the AP-7 with 5 slots of mods and Signature, moved to the knife, is refused with its sentence. Removing the Major on Progression (`untakeMilestone`) takes it off its row. *Mutants:* a move that leaves the old row's id; untake that leaves it |
| `L5 6 (engine): migrate to 0.32 keeps a well-formed majors list and drops the rest` (`engine.test.mjs`, and `hostile.test.mjs` for the junk) | A 0.31 file with no `majors`: unchanged but the schema. `majors` of `"tuned-edge"` (a string), `[5, null, "nope", "custom-fit"]` on a weapon (only weapons' kinds kept: none), `["tuned-edge","tuned-edge"]` (once), `["iconic-weapon"]` (a `follows`: dropped), the same id on two rows (the first keeps it): each as §8 says. `migrate(migrate(x))` deep-equals `migrate(x)`. `weaponLine`, `armorState`, `majorRows` and `setMajorRow` never throw on any of them |
| `L5 7 (engine): a row Major's grants reach only its row, never a Skill's row or another weapon` (`engine.test.mjs`) | With all six held and placed: every Skill's `skillLine` equals its line with none held. `traitRows` holds Iconic's social `checkMod` (as on `main`) and nothing from any `row` |
| `L5 8 (engine): with none held, or held and on no row, no weapon line and no armor piece moves` (`engine.test.mjs`) | A fixture captured on `main` **before** the engine changes (`tests/l5-lines.json`): every catalog weapon's carried `weaponLine` and every catalog armor piece from `armorState`, worn and not, for stats 3, 5 and 8. The branch's lines match it, `kickers`, `majors` and `protBase` aside (new), with none held, and again with all six held and on no row. Deleted with its fixture at close-out (§12), once the PR shows it passing |
| `L5 9 (rules): CRB 0412: the six Majors' numbers are the book's` (`rules.test.mjs`) | Parsed from `0412_Professional.md`: Tuned Edge's "+1 to damage", Custom Fit's "d4 to d6, d6 to d8, max d12" (the ladder's first steps and last die), Signature's "+2 Mod Slots", Iconic's and Legendary's "+1 Mod Slot", Weapon Expert's "+1d4" and "+1d6" equal the data |
| `L5 10 (sheet): a Major ticked on a weapon row moves its numbers, is one undoable action, and moves between rows` (`smoke-sheet-play.test.mjs`) | **In the AP-7's own row:** the **Majors** line with Tuned Edge. Tick: one audit entry, `majors` stored, "+1 from Tuned Edge" in that row's damage cell, **focus on that checkbox**. Tick it on the knife: the AP-7's row loses it, its checkbox reads "on Combat Knife" ✎ beforehand, focus stays. Undo: back on the AP-7. A refusal (LQ32): a notice, nothing stored, the box unticked. A character with none of the six: no **Majors** line anywhere |
| `L5 11 (sheet): Custom Fit's die and Weapon Expert's kicker show on Loadout, Main, print and the hit modal` (`smoke-sheet-play.test.mjs`) | The vest's card "PROT 1d8"; Main's armor line and print's the same; the hit modal's PROT field takes 8. The AP-7 with Weapon Expert: Loadout's Attack cell has "1d4", Main's and print's attack reads "1d10+…+1d4" |
| `L5 12 (sheet): Progression's journal says where each Major is, and removing one takes it off its row` (`smoke-sheet-play.test.mjs`) | "Tuned Edge: AP-7 "Sentry"", "Weapon Expert: not on a weapon yet", "Iconic Weapon: goes with Signature Weapon". The ✕ on Tuned Edge: its confirm names the AP-7; after it, the AP-7's damage is back and its row has no `majors` |

## 11. Tests beyond the examples

- **Totality:** `majorRows`, `setMajorRow`, `weaponLine` and `armorState` on `null`, `{}`, a character whose `weapons` is `"x"`, a row that's `5`, and `majors` of every junk shape in L5 6.
- **Hostile** (`hostile.test.mjs`): a file whose `majors` names an id 10,000 characters long, or 500 ids, comes out as §8 says, with nothing over the data's ids.
- **Voice** (`voice.test.mjs` already walks the sheet): no new string names a decision, flag or LQ.
- **Mutation-test**, in the background, every guard in §10: the mutants each test names, plus `migrate`'s "first row keeps it" and `armorState`'s `protBase`.
- **At 390 and 1300:** the AP-7's row with all four weapon Majors ticked and their sub lines, and the vest's card. `scrollWidth === clientWidth`, and nothing in `main` past the right edge.

## 12. Steps

`git submodule update --init private`, then `npm run test:fast`. **Commit at the end of each step.**

1. Take N, the schema (0.32) and the app minor (0.60.0) as the lowest free on `origin/main`. Re-find every line number above by name.
2. **The fixture first** (L5 8's `tests/l5-lines.json`), captured on `main`'s engine.
3. **The tests:** L5 1–L5 12, and show them failing on `main`.
4. **The data:** the six `row`s, `armorRules.protDice`, the comments. `gamedataVersion` 0.51.
5. **The engine:** `migrate`'s step and `SCHEMA_VERSION` 0.32, `majorRows`, `setMajorRow`, `untakeMilestone`'s step, `weaponLine`'s and `armorState`'s Majors. L5 1–L5 9.
6. **The UI:** Loadout's **Majors** lines (both twins), the sub lines, the attack's kicker in all six places, Progression's journal and ✕ confirm, and the CSS. L5 10–L5 12.
7. **Mutants, in the background.** One at a time: copy the file aside, edit, run `npm run test:fast` plus the one smoke file, copy back. **Never `git checkout`.**
8. **In the browser** (`shadows-dev-preview`, a locked Professional seeded into `shadows.active.v1` as `tests/hostile.test.mjs` ~144 does, then Open sheet). **Report every number:**
   - every row of §9's *Where things land*, focus read after each;
   - Custom Fit on the vest, then Take a hit with a PROT roll of 8;
   - 390 and 1300 (§11).
9. **The docs** (§14), `npm run bump -- 0.60.0`, the `CHANGELOG.md` line, `npm run changelog`. Delete L5 8's fixture and test once the PR shows it passing.

## 13. Stop and ask

- N, 0.32 or 0.60.0 is taken and the next one isn't obvious, or the ledger search finds a decision about a Major on a row that the pre-flight doesn't name.
- A test outside this section's lists fails.
- Anything would need a natural line, a power, or L4's fists (that's L5b).
- Anything would store a computed number (a stepped die, a slot count) instead of the id.
- Any change to `index.html` or to a Major's `benefit` text.
- **Expected to break, and not a stop:**
  - **The schema literal "0.31" → "0.32":** 28 occurrences in `engine.test.mjs`, 2 in `hostile.test.mjs`, 1 in `smoke-sheet-play.test.mjs` (`grep -c`), plus `docs.test.mjs`'s versions check until STATE and the rest move.
  - **The app version literals** that `npm run bump` moves.
  - **Decision 135's key guard** until each new key is read (it's how the build proves it).
- **Expected not to break:** every L3 test pinning `bonuses` to `[]` (no Major is held in them), `modSlots`' test (~2443), every 223 test (a Major's `power` is untouched).

## 14. Close-out

*Rule or shape*: **app 0.60.0, game data 0.51, character schema 0.32, no `private/` commit** (say each in the PR body).

- **SCHEMA:** N. No supersession marks.
- **INDEX:** N under **Sheet & play tracking**, beside 248. After the voice pass, re-read N against Ken's picks (LQ29–LQ34).
- **The plan:** the L5 row → *Built*. The L5b row stays as this order's docs PR wrote it.
- **WISHLIST:** W136's *Plan* line names L5 built and L5b to come. If Ken wants Tools of the Trade (§7), a new wish.
- **`CHANGELOG.md`:** the ✎ line under `## [Unreleased] — app 0.60.0`; `npm run changelog`.
- **STATE:** the versions line and the gear plan's lines.
- **The log:** an entry naming what the pre-flight found (rows have no id and move on removal; `migrate` kept a stray key; no unconditional 1d4 reaches an attack Skill). Plus a row in `docs/log/shipped.md`.
- **PR title:** `feat(loadout): a Major on one weapon or armor row (L5, Decision N)`.
- **PR body:** the template's sections, plus the browser numbers (step 8), the mutants with what caught each, every new string as it renders, and **Where the order didn't fit**.

**Review checklist** (beyond the tests passing):
- **Redo the sweep by grep:** every writer and reader of a weapon or armor row (`addLoadout`, `removeLoadout`, the written-in pushes, `setWorn`, upgrades, `migrate`), every reader of `weaponLine`, `armorState`, `modSlots`, `kickers` and `prot`. Nothing outside `sheet.js` and `engine.js` reads `majors`.
- **Every row of §9's *Where things land*** by hand in the dev preview, on both twins, with focus checked after each.
- **The written-in edit row** shows the stored damage, never the Tuned Edge total.
- **A GM's seat** with Custom Fit shows the stepped die on the encounter's seat line (GM mode, a seated copy).
- **Old files:** a 0.31 character opens with nothing moved (L5 8), and one with a hand-written `majors` comes out cleaned.
- **The bump:** the footer reads 0.60.0; What's new shows the line.
- **The voice pass:** every ✎ string, drafted side by side in the first review, and pasted into the message to the conductor and onto the PR.

## 15. Handing it over

**To the builder:** `WORK-ORDERS.md`'s building prompt, with this order's path (`docs/plans/loadout-and-gear/L5-major-on-a-row.md`). Add these traps:

- **The pointer is on the row, never an index** (LQ29's default). A test that removes an earlier row is what proves it (L5 1).
- **Held is computed, never stored.** `migrate` cleans the list, and readers check the Major is held. Don't strip ids in `migrate` because a Major isn't held: a GM's Admin could add it back.
- **Custom Fit goes in `armorState`, not `armorPiece`.** `armorPiece` has no character, and its other callers don't read PROT. Everything that rolls or shows a worn piece reads `armorState`, GM mode's seat included.
- **Six places draw an attack** (Loadout ×2, Main ×2, print ×2). Every one gets the kicker. The catalog picker and the natural lines get none.
- **The written-in edit row** reads the stored damage, not the line's (L3's ACC lesson).
- **`row.grants` never reaches `grantSources`.** Iconic's top-level `checkMod` must keep working, and nothing in `row` may reach a Skill's row (L5 7).
- **Mutants in the background,** restored by copying back, never `git checkout`.
- **Fill N everywhere at build time,** comments and test names included.

**To the reviewer:** `WORK-ORDERS.md`'s reviewing prompt, with this order's path, the builder's session id, and the checklist in §14. Draft the voice pass for every ✎ string in the first review, side by side, and **paste the table into the message to the conductor and onto the PR**.
