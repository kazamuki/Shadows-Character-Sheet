# Work order P14: Loadout rows (vehicles, and a custom row that folds)

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3, row P14. **Wishes:** [W91](../../WISHLIST.md) (vehicles you can buy and own, Powered Armor among them; first cut) and [W70](../../WISHLIST.md) (a custom item the player is done writing reads like the catalog's). **The book:** `0460` Gear, *Vehicles, Powered Armor & Mech Suits*. **Deighton's rulings** of 2026-10-10 (`reference/rulings-2026-10-10.md`), Q6 and Q16. Decisions 68, 96, 100, 118, 120, 121, 124, 134, 135.

**Scope.**
- **W91, first cut:** a vehicle catalog in Loadout's picker, and an owned vehicle on Loadout that reads like a catalog line. It covers the Grounders, the Jumpers and Powered Armor, all from `0460`'s tables. Nothing computes a vehicle's damage yet.
- **W70:** a custom weapon, armor or gear row folds into a read-only line when the player is done with it, and **Edit** opens it again.

The two share Loadout and its catalog code, and nothing else.

**Status: ⏸ shelved 2026-10-23 (Ken), waiting on Deighton.** Moved to the end of the plan, with P15 behind it. Drafted 2026-10-21 by Claude (Opus), P21's reviewer, after #221 merged. **Don't start the build** until the items below are settled and this order is revised to match.

**Answered.** Deighton's rulings are in [`reference/rulings-2026-10-23.md`](../../reference/rulings-2026-10-23.md), round one (SH1–SH8) and round two (the follow-ups).
- **PQ1, PQ2, PQ4, PQ5, PQ6, PQ7, PQ8: Default**, by Deighton (SH1, SH2, SH4, SH8, SH5, SH6, SH7).
- **PQ9 and PQ10 (W70): Default**, by Ken, 2026-10-21: folding is view state, and all three custom kinds fold. Ken on the catalogs: "vehicles or mechs feel like they should be their own category". The defaults already do that: Vehicles is its own Loadout section and catalog kind, and mechs would join as a section of their own.

**Still open before the build:**
1. **PQ3, a vehicle the player types in.** Deighton picked the default, then wrote "I don't understand this question at all". It's reworded as round two's SH3, which is unanswered.
2. **Vehicles without PROT and RES.** Round two's VD1: a hit comes straight off Integrity, so vehicles would lose those columns. Suits keep both (PA4). He wants to "discuss it in person at some point", so the change isn't final.
3. **The Mods number.** Mod slots are out (VK1, VK4). Round two's VK1b, whether the sheet shows the number at all, is unanswered.

**What revising the order must change:**
- **Vehicle data.** §6 and §8 drop PROT and RES (and Mods, if VK1b says so) for Grounders and Jumpers, and keep them for Powered Armor (item 2).
- **The catalog line, §9's copy and the print table** (PQ8's columns) follow the data.
- **Suit prices are 300% up** (PA9a–d): Glimmer Man 20,020Ç, SS3 17,800Ç, Hyper Tactical 18,300Ç, Renzo X1 13,020Ç+.
- **P14 1 compares the data with `0460`**, so it fails until the book catches up. The order either waits for Ken's CRB update (`plans/crb-catch-up.md`) or lists these as named exceptions.
- **The 17 unanswered follow-ups** (VD2c–VD6b, VK1a–VK4, VO3–VO5b) feed the damage order and W69, not this one, except SH3 and VK1b above.

**W70 needs none of this.** It could be split out and built on its own.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). Ken starts **P14 build** once the PQs are answered, then a fresh reviewer once the PR is open.

**Carried over from P21's review.** Each lesson below is applied in this order where it says.
1. **A field's readers include the ones that aren't about display.** P21 put a flag on Field Medic to show a note, and the flag also stopped IP selling it (`advantageBarred`, Decision 227). The order's sweep had listed only `flagHtml`. **Applied here:** §5 lists every reader of the loadout lists and of the `kind` strings, including the ones that fall through to a default. `catalogGroups` and `loName` both treat any unknown kind as armor. No entry in this order is `flagged`; if one needs to be, grep `flagged` and see what it bars before setting it.
2. **"Nothing else moves" is proved by a scripted before/after diff, not by pinning a few numbers.** P21 4b pinned Natural Armor, movement and SFR on four characters. The review diffed every engine output for every archetype, specialization, Aberration and Major instead. **Applied here:** P14 5 is that diff, run by script on `main` and on the branch (§10, §11).
3. **A list the order writes by hand is checked by a script against its source.** P21's order listed two Skills where two kickers meet, and the data made five reachable. **Applied here:** P14 1 parses `0460`'s three tables and compares them row by row with the data. §8's table is a convenience, and the book is the source.
4. **A rule the data keeps by convention gets a guard.** "A power's effect is always a mark" held only because every power row happened to carry a `whenText`. **Applied here:** P14 9 guards the vehicle data's invariants.
5. **A file can hold anything twice, or junk.** An Aberration held twice was read twice. **Applied here:** `migrate()` and `vehicleLine` are total over junk (P14 4). Two of the same car is a real thing to own, so nothing deduplicates vehicles.
6. **Each drafted string is written once, in §9.** P21's order gave Nocturnal's line two different ways. **The reviewer runs the voice pass before merge** and gives Ken the strings side by side to pick from.
7. **Tests assert whole strings.** P21's Rest test matched only the end of the line (`for Speed Heal's day = N$`), and "BOD 5 = 5 a day" got past it. **Applied here:** §10's string checks are `assert.equal` on the whole line, or `match` anchored at both ends.
8. **The UI does no arithmetic.** P21's Rest line computed a number in `sheet.js`. **Applied here:** every number on a vehicle line comes from `vehicleLine`, and `sheet.js` adds nothing.

**Pre-flight against `main` at `3cbfd02`** (#221 merged: P21, app 0.52.0 and game data 0.44, unreleased; character schema 0.28, released).

```
Vehicles                 none anywhere in src, tools or tests (grep -ri vehicle: Pilot's text, Machindo, Bankrupt's rule text only)
Loadout lists            ch.weapons, ch.armor, ch.gear (newCharacter ~92); listOf(ch, kind) ~1759 is generic
The kind switches        engine: loadoutDef ~1762 (armor | weapons | gear, else null), catalogLine ~2083, addLoadout ~2099,
                         addCustomLoadout ~2229 ("Weapons or armor only."); removeLoadout ~2237 is generic
                         sheet: openCatalog ~2873 (whitelist + title map), catalogGroups ~1747 (an unknown kind FALLS THROUGH to
                         armor), CATALOG_SORTS ~1762 (keyed by kind; a missing key breaks the picker), catalogCellsHtml ~1785 and
                         catalogResultsHtml ~1801 (else armor), catalogPickerHtml ~1827, loadoutAddHtml ~1838, loName ~3861
                         (else "armor"); data-lorm / data-lonote handlers ~3891, ~3918 are generic over "kind|index"
A price                  priceOf ~1760: a number > 0, else null, so "Add" works and "Buy" is refused with its reason
Custom rows today        weapons: an editable WEAPON_COLS table (sheet ~2077); gear: an editable GEAR_COLS table (~1979; added by
                         "+ Your own", data-rowadd="gear"); armor: a field row inside the card (~2104). Main (~452) and print
                         (pWeaponRows ~2689, pGearRows ~2702) already draw custom rows read-only
Print, Loadout page      p3 ~2795: Gear and Armor side by side (pRowsTableHtml); the blank sheet draws empty rows
versionCheck             orphan lines for weapons, armor, gear (~5465)
migrate()                ~4609; loadout normalised at ~4580, ~4693, ~4709–4745. Schema 0.28 (P12b)
Tests that list kinds    engine.test: the totality harness (~1466: addLoadout, addCustomLoadout, removeLoadout, catalogLine by kind);
                         newCharacter round trip (~600); data-key guard (~365, MAPS ~320); hostile.test fixtures (~79)
Book                     0460: Grounders ~1370 (6 rows), Jumpers ~1396 (4), Vehicle Armor Kits ~1420 (12), Powered Armor ~1468
                         (5 rows, entries ~1494–1648), Mech Suits ~1649 (6 chassis), Combat System Packages ~1825
GM mode                  gm.js reads no character's ch.gear/weapons/armor (its armor and gear are NPC block text): unaffected
```

---

## 1. Goal

When P14 is merged:

1. **Loadout has a Vehicles section** after Gear, with **Browse the vehicle catalog**. The catalog modal works as the other three do (Decision 118): search, a section filter (Grounders, Jumpers, Powered Armor), sort, *What I can afford*, and Add and Buy side by side (Decision 100). Buying a Solaris Stellar takes 5,000Ç out of Çredits in the same action, and one undo takes back both.
2. **An owned vehicle reads like a catalog line.** Atlas Thunderbolt: "Jumper · Seats 6 · 180 km/h", then "PROT 1d10 · RES +10 · Integrity 250 · Mods 5", a notes field, and ✕. A Powered Armor suit adds its coverage, its helmet's Combat System Package, its enhancements (each list saying how many to choose), and its standard features. The line shows these as text and computes nothing from them.
3. **A vehicle the book gives no price** (the Punknaught) can be added and not bought, and the button says why, as for any catalog piece today.
4. **Nothing computes a vehicle's damage.** Take a hit, armor, Natural Armor, every Skill and every derived number read exactly as on `main`. One line above the list says the GM runs a vehicle's Integrity (§9).
5. **A custom row folds.** A custom weapon, armor piece or gear row with a name reads as a finished line, the way a catalog piece does. **Edit** opens it, and **Done** folds it. A new or nameless row reads open. Folding and opening save nothing, so they're not on the undo trail.
6. **The printed Loadout page lists the vehicles** (PQ8).
7. **Saved files:** `vehicles: []` on every character (schema 0.29). An old file migrates with an empty list, and a junk list or entry comes out clean.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** It adds a save-file shape (`vehicles`) and a loadout kind, so it numbers one decision, **N** (the next free number on `origin/main` when built). W70 rides along as **Fix**-tier view state and numbers nothing, unless Ken takes PQ9's alternative.
- **Character schema: `0.28` → `0.29`**, with a `migrate()` step in the same commit. 0.28 shipped in v0.47.0.
- **Game data:** content is added that a character can choose (Decision 68).
  - If `0.44` (P21) is still unreleased when you build, P14 rides it, since nothing released carries 0.44 yet.
  - If v0.52.0 has been released, bump to `0.45`.
  - Check `CHANGELOG.md`'s `[Unreleased]` heading and STATE first.
- **App:** a new capability (minor), under the same rule. Ride `0.52.0` if `[Unreleased] — app 0.52.0` is still open. If not, bump to `0.53.0` with `npm run bump -- 0.53.0`.
- **No flags.** Deighton has ruled on what this order touches (Q16: Powered Armor is a vehicle with its own Integrity), and the damage itself is out of scope (§7).

## 3. Questions for Ken

| Id | Question | Default |
|---|---|---|
| PQ1 | **The first cut's catalogs** (the plan's "W91's first-cut columns"). | **Grounders (6), Jumpers (4) and Powered Armor (5)**, from `0460`'s tables. *Alternative:* Mech Suits (6 chassis) as a fourth section. The book says mechs "are not personal purchases for most operators", two of the six have no street price, and their Mounts are a weapon system of their own. |
| PQ2 | **Vehicle Armor Kits** (12, `0460`). | **Out.** A kit fills a vehicle's Mods slots and raises its RES. That is the vehicle-upgrade order, the way armor upgrades fill a vest's slots (Decision 120's pattern). *Alternative:* in the catalog as things you buy and keep in gear, not installed. |
| PQ3 | **A vehicle of your own** (a typed row, like custom armor). | **None in the first cut.** The catalog covers what the book prices, and a GM's one-off goes in gear's "+ Your own". *Alternative:* "+ Custom vehicle" with name, category, Seats, PROT, RES, Integrity, Speed and Mods, folding as W70's rows do. |
| PQ4 | **What an owned vehicle saves.** | **`{ id, notes }`.** Integrity damage is the later damage order, which adds `integrityLoss` with its own `migrate()` step. Saving a field nothing reads is how a file drifts from the code. *Alternative:* `integrityLoss` now, with a bar and repair, which is that damage order pulled forward. |
| PQ5 | **Powered Armor's enhancements**: "Physical Enhancement (Choose 1)" and "Software Enhancement (Choose 2)". | **Text on the line, each list stating how many to choose. No pick is saved and nothing is computed:** W69 computes a worn bonus, and a later order saves the pick. *Alternative:* a saved pick per suit now (a schema field), still not computed. |
| PQ6 | **Powered Armor and a hit.** The book says it's worn; Deighton (Q16) says it's a vehicle with its own Integrity. | **It sits in the vehicle catalog and never in `armorState`.** Take a hit doesn't read it, and the Vehicles note says the GM runs it. *Alternative:* none in this order, because how damage reaches the wearer (Q6: an MD is 10 Integrity, then 1 HL once it gets through) is the damage order's. |
| PQ7 | **Speed.** | **A number, `speedKph`, printed "180 km/h" from a template** (Decision 134: store numbers; W100's metric/imperial switch reads it later). Powered Armor has no Speed and shows none. *Alternative:* the book's text as it is. |
| PQ8 | **Print.** | **A Vehicles table on the Loadout page** (Name · Seats · PROT · RES · Integrity · Speed · Notes), under Gear and Armor. On the blank sheet it gets two empty rows. The page count stays the same, and the builder checks it. *Alternative:* not on paper in the first cut. |
| PQ9 | **W70: is folding saved?** | **View state.** A custom row with a name reads folded, and a new or nameless row reads open. Edit opens it and Done folds it, and nothing is saved, so a reload folds every named row again. *Alternative:* a stored flag on the row, which needs a schema field, a `migrate()` rule for old rows, and a decision. |
| PQ10 | **W70: which rows.** | **All three custom kinds on Loadout:** weapons, armor, and gear's "Your own". Main and print already draw them read-only. *Alternative:* weapons and armor only. |

## 3a. The decision, drafted

```
N. **Vehicles are a fourth loadout list: the Gear chapter's Grounders, Jumpers and Powered Armor in Loadout's catalog, owned as `{ id, notes }` and read as a catalog line; nothing computes their damage yet.**
     *2026-10-xx · Ken + Claude · Touches: vehicles, vehicleCategories, ch.vehicles, vehicleById, vehicleLine, loadoutDef, catalogLine, addLoadout, removeLoadout, openCatalog, catalogGroups, CATALOG_SORTS, versionCheck, migrate, Powered Armor, speedKph, print Loadout page, W91, W70*
     - **Decided:** `vehicles` (15 entries from `0460`) and `vehicleCategories` are a catalog kind, `"vehicles"`, beside weapons, armor and gear. A character's `vehicles` holds `{ id, notes }` (schema 0.29). Its line states the book's Seats, PROT, RES, Integrity, Speed (stored as `speedKph`) and Mods; a Powered Armor suit adds its coverage, helmet package, enhancements (with how many to choose) and standard features, as text. Powered Armor is a vehicle (Deighton, Q16) and never reaches `armorState`. A custom weapon, armor or gear row folds once it has a name; folding is view state.
     - **Why:** W91: playtesters want to own a car, and the book prices fifteen. Store the inputs; the damage track is its own order.
     - **Rejected:** `integrityLoss` saved now (nothing reads it yet); Powered Armor as worn armor (Q16); Mech Suits and the Armor Kits in the first cut (PQ1, PQ2); a saved enhancement pick (PQ5); folding as a saved flag (PQ9).
     - **Replaces:** nothing; extends Decisions 100 and 118 to a fourth kind.
     - **Revisit if:** the vehicle damage order lands (Integrity, Systems, the Integrity Check), W69 computes a suit's enhancements, or mechs become personal purchases.
     - **Built:** app …, game data …, character schema 0.29, PR #…. Log 2026-10-xx (P14).
```

If Ken changes a PQ, the build edits the matching clause, and its **Rejected** entry moves to **Decided**.

## 4. Read first

- **`CLAUDE.md`:** constraints 5, 6, 7, 8 and 10; *Change tiers*; *Decisions*.
- **`SCHEMA.md` §4:** Decisions 100, 118, 120, 121, 124, 134 and 135 (INDEX §3 finds them).
- **`engine.js` (lines at `3cbfd02`):** `listOf`, `priceOf` and `loadoutDef` (~1759); `weaponLine` (~1785); `catalogLine` and `addLoadout` (~2083); `gearLine` (~2160); `addCustomLoadout` and `removeLoadout` (~2229); `armorState` (~1357), which this order must not touch; `migrate` (~4609); `versionCheck` (~5440).
- **`sheet.js`:** `catalogGroups`, `CATALOG_SORTS`, `catalogCellsHtml`, `catalogResultsHtml` and `catalogPickerHtml` (~1747–1837); `loadoutAddHtml` (~1838); `gearRowsHtml` (~1952); `weaponRowsHtml` (~2052); `armorRowHtml` (~2097); `renderShLoadout` (~2291); the print helpers (~2689–2712) and page 3 (~2795); `openCatalog` (~2873); the Loadout handlers (~3846–3925, including `loName`).
- **`shared.js`:** `WEAPON_COLS` and `GEAR_COLS` (~1053).
- **The book:** `0460`, *Vehicles, Powered Armor & Mech Suits*, read whole, and Deighton's Q6 and Q16.

## 5. What this changes underneath (the sweep)

Answered by grepping readers: `listOf(`, `loadoutDef(`, `catalogLine(`, `addLoadout(`, `"weapons"`, `"armor"`, `"gear"`, `ch.gear`, `.armor`, `data-lo`, `CATALOG_SORTS`, `versionCheck`. **Check each row before you build**, grep once more for anything that switches on a loadout kind, and say in the PR if a row is wrong.

| Today | Where | After P14 |
|---|---|---|
| `loadoutDef(kind, id)`: armor, weapons, gear, else `null` | `engine.js` ~1762 | `"vehicles"` → `vehicleById`. Everything that calls it (`catalogLine`, `addLoadout`) learns the kind through it. |
| `catalogLine` picks `armorPiece`, `gearDefLine` or `weaponDefLine` | ~2083 | `vehicleDefLine(def)` for vehicles: the same fields `vehicleLine` returns, without `index` or `notes`. Then price, availability, `flavorLine` and `buy`, as today. |
| `addLoadout`: a gear branch, an armor branch, and **else a weapon-shaped row** `{ id, notes, mods, roundsSpent }` | ~2099 | **A vehicles branch before the else**: push `{ id, notes:"" }`. Without it a vehicle is saved as a weapon. Buy pays in the same action, as today. |
| `addCustomLoadout`: armor or weapons, else "Weapons or armor only." | ~2229 | **Unchanged** (PQ3). Its refusal still reads true. |
| `removeLoadout`, `listOf`, the `data-lorm` and `data-lonote` handlers: generic over `kind\|index` | ~2237, ~1759; `sheet.js` ~3891, ~3918 | **Unchanged.** Each works for `"vehicles"` once the list exists. Pin it: remove and notes on a vehicle (P14 6). |
| `catalogGroups(kind)`: gear, weapons, **else armor** | `sheet.js` ~1747 | A vehicles branch: one group per `vehicleCategories` entry, in book order. **Without it, the vehicle catalog shows armor.** |
| `CATALOG_SORTS[kind]` | ~1762 | `vehicles`: book order, price (both ways), `-integrity`, name. A missing key breaks the picker's sort select. |
| `catalogCellsHtml` and `catalogResultsHtml`: head and cells per kind, else armor | ~1785, ~1801 | A vehicles branch. Each result shows its stat line, price and availability (§9). |
| `catalogPickerHtml`: armor's "Every kind", and a search placeholder for gear or not | ~1827 | Vehicles: "Every section", placeholder "Search name or kind". |
| `openCatalog`: whitelist `["weapons","armor","gear"]` and a title per kind | ~2873 | Adds `"vehicles"`, titled "The vehicle catalog". |
| `loadoutAddHtml(kind)`: a label per kind, then "+ Your own" (gear) or "+ Custom …" (else) | ~1838 | Vehicles: **Browse the vehicle catalog** only, with no custom button (PQ3). The else branch must not hand vehicles "+ Custom armor". |
| `loName(kind, i)`: weapons, gear, **else armor** (the undo label) | ~3861 | A vehicles branch reading `vehicleLine(…).name`. Without it, removing a car logs "Removed armor". |
| `renderShLoadout`: Weapons, Armor, Gear | ~2291 | Adds `secs.sect("Vehicles") + vehicleRowsHtml(ch)` after Gear, which also adds a jump bar entry. |
| `newCharacter()`: `powers:[], gear:[], weapons:[], armor:[]` | `engine.js` ~92 | Adds `vehicles:[]`. Schema 0.29. |
| `migrate()`: loadout normalised at ~4580, ~4693, ~4709–4745 | ~4609 | A 0.29 step for `vehicles` (§6). `engine.test`'s round trip over `newCharacter()` (~600) fails until it does: an expected break, fixed by the step itself. |
| `versionCheck`: orphan lines for weapons, armor, gear | ~5465 | Adds "Vehicle "x" no longer exists in game data." |
| Undo (`recordAction`: a structural diff) and export | ~4449 | **Unchanged**: generic over the character (Decision 124). Pin an undo of Buy (P14 6). |
| `armorState`, `armorPiece`, `applyHit`, `naturalArmor`, `derived`, every `skillLine` | ~1357, ~1727 | **Unchanged.** None reads `vehicles`; P14 5 diffs them. **Powered Armor never reaches `armorState`** (PQ6). |
| Main's weapons table | `sheet.js` ~452 | **Unchanged.** No vehicle on Main in the first cut. |
| Print: `pWeaponRows`, `pGearRows`, `pArmorRows`; page 3 Gear and Armor | ~2689–2712, ~2795 | Adds `pVehicleRows(ch)` and a Vehicles table (PQ8). The blank sheet passes `ch` as null, so `pVehicleRows(null)` gives `[]` and two empty rows. |
| Custom rows: weapons and gear an editable table, armor a field row | ~2077, ~1979, ~2104 | W70 (§9): a named row is drawn folded, inside the same list as the catalog rows. Main (~452) and print are already read-only: **unchanged.** |
| GM mode | `gm.js` | Reads no character's loadout lists (its armor and gear lines are NPC block text, ~925–951, ~1734). **Unchanged.** |
| Bankrupt's rule text ("no legal weapons, armor or vehicles until it's paid") | data ~2167 | **Unchanged**: text, enforced for none of the three today. |
| `tools/outputs.mjs` (~87): a `catalogLine` sample of five weapons | tools | Unchanged (optional). |
| **Tests that list kinds** | `engine.test` ~1466 (totality harness), ~365 (data-key guard, MAPS ~320), ~504 (duplicate ids and skill refs per catalog); `hostile.test` ~79 (loadout fixtures) | **Extended, not broken:** the harness calls each new export with junk; the key guard sees every vehicle key read (P14 9); `hostile.test` gains a junk `vehicles` fixture. If the totality harness insists on an entry for every export, `vehicleLine` and `vehicleById` need theirs. |

## 6. The shapes

**Data** (game data per §2). It goes after `equipment`, with a header comment naming Decision N.

```
"vehicleCategories": [
  { "id": "grounders",    "name": "Grounders",     "note": "Surface vehicles, wheeled and hover." },
  { "id": "jumpers",      "name": "Jumpers",       "note": "Aerial vehicles in the city's traffic lanes." },
  { "id": "poweredArmor", "name": "Powered Armor", "note": "Worn and amplifying, with its own Integrity." }
],
"vehicles": [
  { "id": "solaris-stellar", "name": "Solaris Stellar", "category": "grounders", "seats": 4, "prot": "1d6", "res": 4,
    "integrity": 100, "speedKph": 90, "mods": 2, "availability": "Common", "cost": 5000, "flavorLine": "…" },
  { "id": "punknaught", "name": "Punknaught", "category": "grounders", "seats": 20, "prot": "1d10", "res": 8,
    "integrity": 300, "speedKph": 70, "mods": 6, "availability": null, "cost": null, "flavorLine": "…" },
  { "id": "neurodyne-glimmer-man", "name": "Neurodyne Glimmer Man", "category": "poweredArmor", "prot": "1d8", "res": 4,
    "integrity": 55, "availability": "Rare", "cost": 5005, "coverage": "Partial Coverage", "helmet": "Class III Combat System Package",
    "enhancements": [ { "name": "Physical Enhancement", "choose": 1, "options": ["Enhanced Reflexes: +1 to all REF based Skill Checks", "…"] },
                      { "name": "Software Enhancement", "choose": 1, "options": ["…"] } ],
    "features": ["Grounding Net — Grounds powerful electrical surges, preventing surge damage", "…"], "flavorLine": "…" }
]
```

- **Ids** (constraint 6, never changed once shipped):
  - Grounders: `crotchrocket`, `solaris-stellar`, `arcadian-g7`, `arcadian-infinity-executive`, `enigma-striker-xl`, `punknaught`.
  - Jumpers: `hyperion-eclipse`, `atlas-skyhawk-l2`, `arcadian-aero-executive`, `atlas-thunderbolt`.
  - Powered Armor: `darksun-power-sleeves`, `neurodyne-glimmer-man`, `ndt-ss3-heavy-tactical`, `hd-hyper-tactical-uc`, `shinsei-renzo-x1`.
- **Numbers are numbers.** `res` is the book's figure without its "+" (the line adds the sign). Grounders and Jumpers have `seats`, `speedKph` and `mods`; Powered Armor has none of the three.
- **Absent, not invented.** The Punknaught's "—" is `availability: null, cost: null`.
- **Shinsei Renzo X1:**
  - `availability: "Exotic (By Invitation)"`, `cost: 3255`, and `costNote: "Base cost reflects unmodified chassis only."`, from the book's "3,255Ç+" and its italic line (`0460` ~1647).
  - Its enhancements are `"Base Physical Enhancements (included)"`: one entry with `choose: null` and three options.
- **Darksun Power Sleeves:** its single physical enhancement has no "(Choose 1)" in the book, so `choose: null` with one option.
- **The text keys:** `enhancements[].options`, `features`, `coverage`, `helmet` and `costNote` are the book's words, verbatim, so P14 1 can check them.
- **`flavorLine`:** the first sentence of the entry's prose in `0460`, verbatim.
- **Mechs, the Kits and the Combat System Packages are not in the data** (PQ1, PQ2).

**`appCopy.vehiclesNote`** (drafted in §9, read once by the Vehicles section).

**The character (schema 0.29).** `vehicles: []`. An entry is `{ id: "<vehicle id>", notes: "" }`.

**`migrate()`, schema 0.29:**
- Not an array → `[]`.
- Each entry becomes `{ id, notes }`:
  - it is dropped unless it's a plain object with a non-empty string `id`;
  - `notes` is kept if it's a string, else `""`;
  - every other key is dropped.
- **An unknown id is kept**, the same orphan rule armor follows: `versionCheck` reports it, and the row says "no longer in the game data".
- Totality: no throw on any input (Decision 124). A file saved after this build round-trips unchanged (constraint 8).

**Engine** (all exported, all total):
- **`vehicleById(id)`** → the entry or `null`.
- **`vehicleLine(ch, index)`** → `null` when the entry isn't an object. An orphan gives `{ index, missing:true, name:String(id), notes }`. Otherwise:
  - the row itself: `{ index, id, name, notes }`;
  - its category: `category`, `categoryName`;
  - its numbers: `seats`, `prot`, `res`, `integrity`, `speedKph`, `speedText`, `mods`;
  - its price: `availability`, `price`, `costNote`;
  - Powered Armor's text: `coverage`, `helmet`, `enhancements: [{ name, choose, options }]`, `features: []`.
  - A key the entry lacks is `null`, or `[]` for the two lists. `speedText` is `fillTag(D().vehicleText.speed, { kph })`, or `null` without a speed.
  - Every value is read from the data. Bad data (a non-number `res`, `options` that isn't an array) reads as absent, never thrown.
- **`catalogLine(ch, "vehicles", id)`** is that line without `index` and `notes`, plus `kind`, `price`, `availability`, `flavorLine` and `buy`, as today.
- **`addLoadout(ch, "vehicles", id, { buy })`** → `{ ok, index, name, paid }`; an unknown id gives `{ ok:false, why:"Choose something from the list first." }`, as today.

**`vehicleText`** (data, drafted in §9): `speed`, and the line templates the UI fills.

## 7. Out of scope

- **A vehicle's damage:** Integrity loss, Systems, the Integrity Check, the System Failure table, Wrecked and Destroyed, EMP, repair, and how an MD reaches the wearer (Q6). The later W91 order, with `integrityLoss` and its migrate step.
- **Mounted weapons**, mech Mounts, and firing from a vehicle.
- **Mech Suits** (PQ1), **Vehicle Armor Kits** and vehicle mods (PQ2), **Combat System Packages** (the helmet line is text).
- **Computing anything from Powered Armor:** its enhancements are W69's to compute, and a saved pick is a later order's (PQ5). Its features (Gyro Stabilizers' +2 Athletics, the Stealth Module's +2) stay text.
- **Pilot checks:** Stunt Driver and the Wheelman read as they do today.
- **A custom vehicle** (PQ3), and **vehicles on Main.**
- **Bankrupt** enforcing "no legal vehicles": it enforces nothing today.
- **W100**, metres or feet: it can read `speedKph` later.

## 8. The entries

`0460` is the source, and **P14 1 checks the data against it by script**: the table below is a reader's convenience, not a second source. Where the two disagree, the book wins and the PR says so.

| Section | Entries |
|---|---|
| Grounders (`0460` ~1370) | Crotchrocket, Solaris Stellar, Arcadian G7, Arcadian Infinity Executive, Enigma Striker XL, Punknaught (no availability, no price) |
| Jumpers (~1396) | Hyperion Eclipse, Atlas SkyHawk L2, Arcadian Aero Executive, Atlas Thunderbolt |
| Powered Armor (~1468, entries ~1494–1648) | Darksun Power Sleeves, Neurodyne Glimmer Man, NDT SS3 Heavy Tactical, HD Hyper Tactical UC, Shinsei Renzo X1 |

## 9. The UI

**Every string here is drafted, written once, and marked for the voice pass, which the reviewer runs with Ken before merge (P21's lesson 6).**

**Vehicles on Loadout** (after Gear, with a jump bar entry):
- The note, above the list, once (`appCopy.vehiclesNote`): **"Your GM runs a vehicle's Integrity and its System Failures. Keep them in its notes."**
- An owned vehicle, one block per row, following the gear row's layout:
  - **Name** in bold, then a sub line: `{categoryName} · Seats {seats} · {speedText}`. A missing part is left out with its separator; Powered Armor's sub line is `{categoryName} · {coverage}`.
  - **The stat line**: `PROT {prot} · RES +{res} · Integrity {integrity} · Mods {mods}`, from `vehicleText`. Powered Armor has no `Mods`.
  - **Powered Armor only**, beneath it:
    - the helmet line, `Helmet: {helmet}`;
    - each enhancement as `{name} (choose {choose}): {options joined " · "}`, or `{name}: …` when `choose` is null;
    - `Standard: {features joined " · "}` when it has any.
  - A notes field (`data-lonote="vehicles|i"`) and ✕ (`data-lorm="vehicles|i"`), as gear's.
  - An orphan reads `{name}` and "no longer in the game data", with notes and ✕, as armor's does.
- Nothing owned: "No vehicles yet."
- One button: **Browse the vehicle catalog** (`data-lobrowse="vehicles"`).

**The catalog modal** (`openCatalog("vehicles")`):
- Titled "The vehicle catalog", with three sections.
- Each result row shows its name, its sub line and stat line as above, availability, and the price (`5,000Ç`, or "No street price"); a `costNote` sits after the price.
- Tapping a row opens its `flavorLine` (and, for Powered Armor, its helmet, enhancements and features), as the other catalogs' rows do.
- Add and Buy behave as Decision 100's, and Buy refuses the Punknaught with today's reason.
- The modal stays open for the next pick.

**Where things land:**

| Press | The record | Focus |
|---|---|---|
| Buy in the vehicle catalog | One `commit("loadout", "Bought {name} (−{price}Ç)")`: the row and the Çredits, one undo | Stays in the modal; the status line counts it |
| Add | `commit("loadout", "Added {name}")` | Stays in the modal |
| ✕ on a vehicle | `commit("loadout", "Removed {name}")`, with `loName` naming it | Wherever ✕ on a gear row puts it today |
| Notes on a vehicle | As gear's notes today | Stays |
| **Edit** on a folded custom row | **Nothing saved** (view state) | The row's first field |
| **Done** on an open custom row | **Nothing saved** | That row's **Edit** |
| "+ Custom weapon" / "+ Custom armor" / "+ Your own" | As today (one commit); the new row reads open | The new row's first field |
| ✕ on any custom row | As today | As today; **the open/closed state of rows below it follows them, never their index** |

**W70: a custom row folds** (PQ9 view state, PQ10 all three kinds):
- **The rule.** A custom row whose `name`, trimmed, isn't empty reads **folded**, unless the player opened it this visit. A nameless row always reads **open**: Done is not offered until it has a name.
- **The state.** `S.loOpen`: a `Set` of the row objects the player opened. Key it by the row, not its index, so removing a row above doesn't open the wrong one. If `commit()` replaces `S.ch` with a copy and the identities break, key it by a per-visit id kept in a `WeakMap`, and say which in the PR. It's cleared when the sheet changes character.
- **Folded weapon:** a row in the same weapons table as the catalog rows, after them:
  - the name in bold, with `type` beneath it;
  - Attack "—", Damage as typed, Range "—", RoF as typed;
  - Cap.: the rounds counter with Fire and Reload, as today, and `ammo` after it;
  - Notes as an input, as a catalog row's are;
  - `features` beneath the name, as text;
  - **Edit**, then ✕.
- **Folded gear:** a `lo-gear-row` with the name, `type` as its sub line, notes, **Edit** and ✕.
- **Folded armor:** the card without its field row. The head (Worn, the name, slot, ✕) and the stat line and Integrity bar stay; **Edit** sits in the head.
- **Open:** each row as today, with **Done** at its end.

**Print** (PQ8): a Vehicles table on page 3, under Gear and Armor, with columns Name, Seats, PROT, RES, Integrity, Speed and Notes. Powered Armor's Seats and Speed are blank. The blank sheet gets two empty rows. Check the page count before and after (`npm run build`, then print to PDF in the dev preview), and say it in the PR.

**Drafted strings** (`vehicleText`, `appCopy`):
```
vehicleText.speed     "{kph} km/h"
vehicleText.sub       "{categoryName} · Seats {seats} · {speedText}"
vehicleText.stats     "PROT {prot} · RES +{res} · Integrity {integrity} · Mods {mods}"
vehicleText.helmet    "Helmet: {helmet}"
vehicleText.choose    "{name} (choose {choose}): {options}"
vehicleText.included  "{name}: {options}"
vehicleText.features  "Standard: {features}"
appCopy.vehiclesNote  "Your GM runs a vehicle's Integrity and its System Failures. Keep them in its notes."
```
Each template's parts are read from the line. A template whose part is missing drops that part and its separator: say how in the PR. One way is a template per shape.

## 10. Worked examples, as named tests (write first; run on `main` and keep the output)

| Name | File | Setup → result |
|---|---|---|
| `P14 1: the vehicle catalog is 0460's three tables, row for row` | rules | Parse `0460`'s Grounders, Jumpers and Powered Armor tables, using the `crb()` helper. Every row is a `vehicles` entry with equal Seats, PROT, RES, Integrity, Speed, Mods, Availability and Cost, and nothing extra is in the data. Each Powered Armor entry's coverage, helmet, enhancement names, choose counts and options, and features match its section's lines. **On `main`: fails** (no `vehicles`). |
| `P14 2: a vehicle is added and bought like any catalog piece` | rules | Çredits 6,000. Buy a Solaris Stellar: `vehicles` is `[{ id:"solaris-stellar", notes:"" }]` and Çredits are 1,000, ledger line "Bought Solaris Stellar". Buy a second: refused, with `addLoadout`'s reason as today, and nothing changes. Punknaught: Buy refused with the no-street-price reason, Add ok. An unknown id: refused. **On `main`: fails.** |
| `P14 3: a vehicle's line reads the catalog` | rules | Atlas Thunderbolt: `{ categoryName:"Jumpers", seats:6, prot:"1d10", res:10, integrity:250, speedKph:180, speedText:"180 km/h", mods:5, availability:"Rare", price:50000 }`. Neurodyne Glimmer Man: `seats`, `speedKph` and `mods` null, and `enhancements` deep-equal to the book's two lists with `choose` 1 and 1. Renzo X1: `choose` null, and `costNote` set. Change Thunderbolt's `integrity` in a copy of the data and the line follows. |
| `P14 4: migrate makes vehicles a clean list` | engine | A 0.28 file → `vehicles: []`, schema 0.29. Junk: `vehicles: "car"`, `{}`, `[null, 3, "x", { id: 7 }, { id: "" }, { id: "atlas-thunderbolt", notes: 9, extra: true }, { id: "no-such" }]` → `[{ id:"atlas-thunderbolt", notes:"" }, { id:"no-such", notes:"" }]`. `versionCheck` names "no-such". A migrated file round-trips byte for byte. Nothing throws. **On `main`: fails.** |
| `P14 5: nothing else moves` | engine | **A scripted diff, not a pin.** For every archetype × every specialization option, and a character holding each Aberration, run the engine's outputs on `main` and on the branch: `derived`, `health`, `naturalArmor`, `movement`, `sfr`, `startingCredits`, `grants`, `validate`, `armorState`, `attackNotes`, every `skillLine` and 40 `weaponDefLine`s. Keep `main`'s as a fixture file. On the branch they deep-equal it, both with `vehicles: []` and with a Thunderbolt and a Renzo X1 owned. And `armorState(ch).pieces` never names a vehicle. |
| `P14 6 (sheet): Vehicles on Loadout: browse, buy, the line, notes, remove, undo` | smoke-sheet-play | Open Loadout and browse the vehicles. The three sections are there, and the Punknaught's Buy is disabled with its reason. Buy the Atlas SkyHawk L2: its block reads the sub line and stat line exactly (`assert.equal`), and Çredits drop. Undo restores both. Type a note, and ✕ logs "Removed Atlas SkyHawk L2". The note (`vehiclesNote`) shows once. A Glimmer Man shows its helmet, both enhancement lines and its standard features. No errors. |
| `P14 7 (sheet): the printed Loadout page lists vehicles` | smoke-roster (print) | A character with a Thunderbolt: the Vehicles table has its row, with cells exactly as written. On the blank sheet the table has two empty rows. The page's section count is unchanged. **Drop this test if Ken takes PQ8's alternative.** |
| `P14 8 (sheet): a custom row folds, opens and folds again, and saves nothing` | smoke-sheet-play | A character with a named custom weapon, armor piece and gear row, and one nameless weapon. On Loadout:<br>• each named row reads folded (no `data-cell` or `data-armorfield` input; its name shown);<br>• the nameless one is open, with no Done;<br>• Edit opens a row and moves focus to its first field; Done folds it and moves focus to Edit;<br>• `ch.audit` gains nothing;<br>• "+ Custom weapon" adds a row that reads open, with focus in it;<br>• open the second of two custom weapons, then ✕ the first: the one left is still open;<br>• a reload folds every named row. |
| `P14 9: the vehicle data keeps its own rules` | engine | Ids are unique across `vehicles` and kebab-case. Every `category` is a `vehicleCategories` id, and every category holds at least one. Numbers are finite: `res`, `integrity`, and when present `seats`, `speedKph`, `mods` and `cost`. `prot` is a die (`goodDie`'s shape). `choose` is null or an integer from 1 to its options' length. Powered Armor carries no `seats`, `speedKph` or `mods`, and the others carry no `enhancements`. The data-key guard (Decision 135) sees every key read. |

## 11. Tests beyond the examples

- **Totality.** Add `vehicleLine`, `vehicleById`, `catalogLine(ch, "vehicles", …)` and `addLoadout(ch, "vehicles", …)` to `engine.test`'s harness (~1466), with junk indexes and ids. Add a junk `vehicles` fixture to `hostile.test` (~79), so a hostile file's Loadout renders.
- **P14 5's fixture.** Generate it with a script run on `main`, commit the script (`tests/fixtures/p14-main.mjs` or beside the test), and say in the PR how to regenerate it. Write the fixture before you change the engine.
- **Voice.** `voice.test.mjs` passes over the new strings, and the Vehicles section renders in the full-render voice check.
- **Phone width.** `npm run phone-check` with a fixture owning a Thunderbolt and a Glimmer Man (its enhancement lines are the long ones). Loadout's `scrollWidth` must equal `clientWidth` at 320 and 375.
- **Dev preview** (`shadows-dev-preview`), at 375px and at desktop width:
  - Loadout with two vehicles, the open catalog, and a folded and an open custom row of each kind.
  - **Paste every new string as it renders into the PR.** The reviewer runs the voice pass from that list.
- **Mutation-test each guard in §12.**

## 12. Mutants, each of which must fail a test

1. `addLoadout`'s vehicles branch removed, so a car saves as a weapon row (P14 2).
2. `catalogGroups`' vehicles branch removed, so the modal shows armor (P14 6).
3. `loName`'s vehicles branch removed (P14 6: "Removed armor").
4. A Grounder's `res` off by one in the data (P14 1).
5. A Powered Armor `choose` changed from 2 to 1 (P14 1).
6. `migrate()` keeping a non-string id (P14 4).
7. `migrate()` dropping an unknown id (P14 4: the orphan must stay).
8. A Powered Armor suit added to `armorState`'s pieces (P14 5).
9. `speedText` typed into the template as "180 km/h" (P14 3: change the data, and the line must follow).
10. W70's open state keyed by index (P14 8: ✕ above an open row).
11. Done writing an audit entry (P14 8).
12. A vehicle entry with an unread key (P14 9 / Decision 135's guard).

## 13. Steps and stop-and-ask

**Steps:**
1. Read §4. Confirm each §5 row, read `0460`'s chapter whole, then run `npm run test:fast`.
2. Write P14 5's script and generate `main`'s fixture. Then write §10's tests and run them on `main`, keeping the output.
3. Data: `vehicleCategories`, `vehicles`, `vehicleText` and `appCopy.vehiclesNote`, plus the game data version (§2). Run P14 1 and P14 9.
4. Engine: `vehicleById`, `vehicleLine`, `vehicleDefLine`, and the kind in `loadoutDef`, `catalogLine` and `addLoadout`; `newCharacter`, `migrate` 0.29, `versionCheck`. Then `npm run verify`.
5. UI: the Vehicles section, the catalog branches, `loName`, print. Then the dev preview and `npm run phone-check`.
6. W70: the fold, the dev preview again, `npm run verify`.
7. The mutants, scripted.
8. Close-out.

**Stop and ask:**
- **The book and §6 disagree** about a number, a key, or which entries exist.
- **A computed value moves in P14 5** for any character.
- **Anything saved beyond `vehicles: [{ id, notes }]`**, including a folding flag (PQ9).
- **An existing test fails**, other than these **expected breaks**:
  - `engine.test`'s `newCharacter()` round trip (~600), until the 0.29 step lands;
  - the version literals your own bump moves;
  - a test asserting Loadout's sections are exactly Weapons, Armor, Gear (grep `secs.sect` and `data-lobrowse`), which now gains Vehicles;
  - a test asserting a custom row's inputs are always present (grep `data-cell="weapons|`, `data-cell="gear|` and `data-armorfield`), which now reads folded.
- **Deighton rules on vehicle damage** before the build ends: it becomes its own order.

## 14. Close-out and review checklist

- **Decision N**, with its INDEX §3 line, and Decisions 100 and 118 noted as extended.
- **SCHEMA:**
  - §2 gains `vehicles` and `vehicleCategories`;
  - §3 gains the character's `vehicles` and the 0.29 step.
- **STATE** rewritten.
- **Versions** per §2.
- **CHANGELOG**, then `npm run changelog`.
- **The plan's P14 row**, a `shipped.md` row and a `log/2026.md` entry.
- **The wishlist:**
  - W70 moves whole to `log/wishes-granted.md`;
  - W91 stays open, with its first cut struck through and "Later" kept: the damage track, mounted weapons, mechs and kits.
- **PR title:** `P14: Vehicles on Loadout, and a custom row that folds (Decision N, schema 0.29)`. The body includes **Where the order didn't fit**, and **every new string as it renders** (§11).

Suggested CHANGELOG lines, in player voice and marked for the voice pass:
- **Own a vehicle.** Loadout has a vehicle catalog: the city's Grounders and Jumpers, and Powered Armor. Buy one and it reads on your sheet with its seats, speed, PROT, RES and Integrity.
- **Your own gear folds when it's done.** A custom weapon, armor piece or item you've named reads like the catalog's, and Edit opens it again.

**Review checklist:**
- [ ] §10's tests exist with those names and were run on `main`. P14 1, 2 and 4 fail there.
- [ ] §5's rows are confirmed or corrected, including `catalogGroups`' and `loName`'s fall-through to armor.
- [ ] P14 5's fixture was generated on `main` before the engine changed, and the script is committed.
- [ ] P14 1 checks the data against the book by script, and no number was typed from §8.
- [ ] Nothing is saved beyond `{ id, notes }`. Folding writes no audit entry.
- [ ] `git diff origin/main --stat -- src` touches only `shadows-data.js`, `engine.js`, `sheet.js`, `shared.js` (if the columns move), `app.js` (the version), the generated changelog, and `shadows.css` (if a class is new).
- [ ] Decision N passes `docs.test.mjs`.
- [ ] Mutants 1–12 are in the PR.
- [ ] Phone-check and the dev preview's measurements are in the PR, with every new string as rendered.
- [ ] **The voice pass is run by the reviewer with Ken before merge.**
- [ ] `npm run verify` is green.

## 15. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<order>` = `sheet-wishlist/P14-loadout-rows.md` and `<id>` = **P14**, and these traps under the builder's:

> 1. **Every kind switch has a default, and the default is armor or weapons.** `addLoadout` saves an unknown kind as a weapon row; `catalogGroups`, `catalogCellsHtml`, `catalogResultsHtml` and `loName` read it as armor. Give vehicles their own branch in each (§5), and grep for any switch §5 missed.
> 2. **The book is the source of every number and every line.** P14 1 parses `0460` and compares. Don't type a number from §8.
> 3. **Powered Armor is a vehicle (Deighton, Q16).** It never enters `armorState`, Take a hit or Natural Armor, and its enhancements compute nothing.
> 4. **An owned vehicle saves `{ id, notes }` and nothing else.** An unknown id is kept as an orphan, as armor's is.
> 5. **P14 5 is a diff against `main`'s outputs, generated before you change the engine.** Don't pin a few numbers instead.
> 6. **Folding saves nothing, and its state follows the row, not its index.**
> 7. **No number is computed in `sheet.js`.** Every number on a vehicle line comes from `vehicleLine`.
> 8. **Paste every new string as it renders into the PR**, so the voice pass can be run from it.
>
> Tier: **Rule or shape**, with W70 as Fix-tier view state. One decision, the next free number; character schema 0.29; game data and app per §2; no flags. Use the close-the-session skill at the end.
