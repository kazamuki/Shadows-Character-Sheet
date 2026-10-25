# Work order L2: Custom weapons read like the catalog's

**Plan:** [`../loadout-and-gear.md`](../loadout-and-gear.md) §3, row L2, and its *What each order settles* bullet. **Wish:** [W137](../../WISHLIST.md). **Ken's answers that stand:** LQ8 (a custom weapon's Skill comes from its weapon type, as data on each `weaponCategories` row) and LQ9 (a saved free-text `type` is kept as text, shown until the player picks a type), both "Default", 2026-10-24. **The book:** `0460` *Reading the Tables* (Skill, DMG, Dam Type, ACC, Range) and its weapon tables; `0530` *Range bands*. Decisions 100, 120, 135, 145.

**Status: drafted 2026-10-24 by Claude (Opus), L1's reviewer, as the plan's orchestrator. Approved by Ken 2026-10-24 ("approved"), as revised at `2649ca2`.** Ready for **L2 build**. Ken answered LQ14–LQ18 on 2026-10-24 (§4): LQ16 is the book's range bands, not the default, and the order is revised to it (re-pre-flighted, below). The rest are Default.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md): **L2 build** (Sonnet), then a fresh **L2 review** (Opus) once the PR is open.

**Carried over from L1** (PR #252):
- **The order's misses.**
  - The changelog line's set of weapons was written from memory ("the two launchers", "bows"), not from the data, so it needed a rewrite in the voice pass. This order's changelog line names no list (§14).
  - The order's own counts ("13", "2 launchers") went stale after LQ12 and reached SCHEMA, INDEX and STATE. This order has no hand-counted list.
  - L1 5 checked the whole tab for a note that belonged on one card, so a mutant that moved the note off the card survived. Every UI test here reads **the row itself** (§10), and §11 names the off-row mutant.
  - L1 4's fixture was left for the review to delete. This order decides: the builder deletes it at close-out (§12, step 8).
- **The build's misses.** The builder didn't check the dev preview; the review did, by reading the DOM. Here the preview check is a step (§12, step 6). When the screenshot tool times out, as it does here, the builder pastes the DOM read and the phone-width metrics into the PR instead.
- **From the conductor.** Ken picked Draft A for both L1 strings (PR #252, comment 6394072688). Voice-pass drafts go inline in the reviewer's message to the conductor, not in a file the conductor may not be able to reach.

**Pre-flight against `main` at `32baff6`** (#252 merged; app 0.54.3, game data 0.48, schema 0.28; the highest decision is 246, so N is 247 today).

```
A custom weapon today    engine weaponLine ~1789: { index, custom, name, notes, rounds, fireModes }. Nothing else: no skill, attack,
                         damage, type, ACC or range. Probe (BOD 5, Handguns rank 3; a row typed Zip gun / BOD+3 / S / 4):
                           custom  {"index":1,"custom":true,"name":"Zip gun","notes":"","rounds":{"max":4,...},"fireModes":[Single]}
                           catalog Cheapshot: skill Handguns (trained), attack 8, acc 0, damage 5, damageType "Ballistic", range "Low"
Its stored row           addCustomLoadout ~2233: { custom, name, type:"", damage:"", rof:"", capacity:"", ammo:"", features:"",
                         notes:"", roundsSpent:0 }. Edited as eight text cells (shared.js WEAPON_COLS ~1073, data-cell, keystrokes,
                         unaudited: sheet.js ~3881)
Weapon types             weaponCategories: 14 rows, id and name only (grenades also a note). Every catalog weapon in a category
                         names the same skill (script, all 54): melee→melee, martialArts→martial-arts, handguns, smgs,
                         grenades→melee, urbanRifles/shotguns/sniperRifles→rifles, heavyWeapons→heavy-weapons,
                         beamSidearms/Longarms/Specialist/Heavy→beam-weapons, archery. So no type could take two Skills (LQ8)
Damage                   weaponDamage ~1773: a number is fixed; "BOD+3" → BOD + 3; anything else stays text. A typed "8" is a
                         string, so it would read as text: the order coerces a digits-only string. No catalog damage is one
Damage types             damageTypes: blade, blunt, ballistic, electric, energy, burning (non-magical); elemental, spirit, aether
                         (magical: true). Nine in all. A catalog weapon's damageType is the book's display word (L1), "Normal"
                         included. "Regular" isn't a damage type: it's a damageCategories entry (Regular, Withering, Massive:
                         how a hit resolves), picked per hit in the hit modal and never stored on a weapon
Ranges (re-pre-flighted  A catalog weapon's range is Low 8, Medium 14, Long 10, Extreme 2 (20 have none). 0530's range bands
  for LQ16)                are Close 0–3m, Short 3–40m, Medium 40–120m, Long 120–400m, Extreme 400m+, so the catalog's "Low"
                           isn't a band. The bands are in the data once, as display text: the quick reference's `modifiers`
                           panel, its "Range bands" part (data ~4830, `columns`), shown by gmReference. No data list holds them
                           as a vocabulary
                         Readers of a weapon's range: weaponDefLine ~2038 (passes it through); sheet.js ~1794 (catalog picker),
                           ~2089 (Loadout card's Range cell), ~2725 (print). All display: no rule, modifier or guard reads a
                           range, and none reads the catalog's words beside the bands. Main's Weapons has no Range column
                         After L2, Loadout's Range column and the print sheet's hold both vocabularies: a catalog Cheapshot
                           "Low" above a custom pistol's "Short". The catalog picker shows catalog weapons only, so it's unchanged
                         L3 addresses weapons by ranged or melee and by kinetic or energy (plan §3); neither reads a range
                           word. No decision governs a weapon's range (ledger searched for "range band" and weapon range)
ACC                      0, 1, 2, 3, 5 on the catalog; never negative
Readers of a custom      engine: weaponLine ~1789 (the line), fireWeapon ~1857 and reloadWeapon ~1917 (rounds only), reloadSource
  weapon row               ~1884 (a custom row reloads from nothing, so a Reload is free), weaponModOptions ~1998 (null: no mods),
                           versionCheck ~5465 (catalog ids only), migrate ~4709, ~4731 (no mods), ~4735 (no loaded), the
                           number gate ~4580 (roundsSpent)
                         sheet.js: Main's Weapons ~464 (reads the raw row: name, features, damage, rof, capacity, ammo); Loadout's
                           folded row ~2100 (raw row: type, features, damage, rof, capacity, ammo); Loadout's open row ~2109
                           (WEAPON_COLS cells); the step note ~2107 ("Attack is 1d10 + the weapon's skill", shown only if a
                           catalog weapon is carried); print pWeaponRows ~2720 (raw row: name · type, damage, rof, capacity);
                           loName ~3893 (name only)
                         gm.js, wizard.js, app.js: none
Text that points at it   engine ~1783 ("A custom weapon is whatever was typed, so there's nothing to compute"); sheet.js ~452,
                         ~2715 ("a custom one what was typed"); SCHEMA §2's weapons comment (~955, ~969); Decision 100 ("A custom
                         weapon reads back what was typed"). CHANGELOG's past lines stay as they shipped
Guards                   engine.test "every catalog weapon resolves" (~1509) and the R6 reference sweep (~200: weaponCategory is a
                         set; a category's skill would be a new reference, not yet listed). The key guard is by key name.
                         `skill` collides with a name already read (a weapon's own), so the guard passes it for the wrong
                         reason, and L2 4 is what proves it's read. `rangeBands` is a new name, so the guard sees it, and
                         fails until the custom line reads it. hostile.test (~80) gives a custom weapon a
                         payload in every typed field, `type` included
Prototype                The data keys, the engine line, weaponDamage's coercion, migrate's step and WEAPON_COLS without `type`, on
                         a scratch copy: 1346 pass, 25 fail, and all 25 are the schema literal "0.28" → "0.29" (23 tests across
                         engine, hostile and smoke-sheet-play; docs.test's versions check; "newCharacter matches the documented
                         character schema"). No other test pins a custom weapon's line or its type column. The prototype used
                         the catalog's words under `ranges`; LQ16's bands under `rangeBands` change only which words, and add
                         the key guard as a check that the line reads them (above)
```

---

## 1. Goal and Done when

**Goal.** A weapon the player writes in reads like one from the catalog. It has a weapon type, and so a Skill and an attack number. Its damage is worked out the way the book says, and it has a damage type, a range and an ACC. That gives L3's class modifiers ("+2 to energy weapons") something to find on it.

**Done when:**
- A custom weapon can pick a **type** from `weaponCategories`. Its attack is then that type's Skill's check bonus, the same number a catalog weapon of that type shows, on Loadout, Main and the printed sheet.
- Its typed damage computes as a catalog weapon's: `BOD+3` is BOD + 3, `8` is 8, and anything else stays text.
- It can pick a **damage type** (the six non-magical ones, LQ15) and a **range band** (0530's Close, Short, Medium, Long or Extreme, LQ16), and type an **ACC** (a whole number, 0 or more). Each shows where a catalog weapon's does.
- Each pick is one undoable action in the audit trail. The text fields stay as they are.
- A saved weapon with a free-text `type` keeps it, shows it until a type is picked, and loses nothing in `migrate()`.
- Junk in any of the four picks reads as empty, from a file and from a call (constraints 8 and 10).
- No catalog weapon's line moves (L2 7's diff).

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** A save-file shape changes (four new fields on a custom weapon row), a data shape changes (`weaponCategories[].skill`, `weaponRules.rangeBands`), and the line is a player-facing behaviour someone could have chosen otherwise. One decision (§3).
- **Character schema:** 0.28 → **N** (0.29 today), with a `migrate()` step (§8). Take the next minor if another branch lands first.
- **Game data:** `gamedataVersion` 0.48 → **0.49** (Decision 68): a custom weapon's computed values and choices change. Take the next minor if another branch lands first.
- **App:** a minor, 0.54.3 → **0.55.0** (`npm run bump -- 0.55.0`), or the next minor: a capability players didn't have.
- **Decision:** the next free number, written **N** here (247 today). **Flags:** none.

## 3. Decisions

Paste this into SCHEMA §4 with N filled in, add its INDEX §3 line under Loadout, and mark Decision 100 as below.

```
N. **A custom weapon picks its weapon type, damage type and range and types its ACC, and its line is computed like a catalog weapon's.**
   *2026-10-24 · Ken + Claude · Touches: weaponLine, customWeaponLine, setCustomWeapon, weaponDamage, weaponCategories.skill, weaponRules.rangeBands, range bands, weapons[i].category, weapons[i].damageType, weapons[i].range, weapons[i].acc, weapons[i].type, WEAPON_COLS, addCustomLoadout, Loadout's custom weapon row, Main's Weapons, the print sheet's weapons, character schema N, W137, LQ8, LQ9, LQ14–LQ18*
   - **Decided:** A custom weapon stores four picks: `category` (a `weaponCategories` id), `damageType` (a non-magical `damageTypes` id), `range` (one of 0530's range bands, `weaponRules.rangeBands`) and `acc` (a whole number, 0 or more). Its Skill is its category's `skill`, so its attack is that Skill's check bonus. Its typed damage reads as a catalog weapon's: a number, `BOD+3`, or text. A saved free-text `type` is kept and shown until a type is picked, and new rows have none. Each pick is one audited action; the typed fields stay unaudited keystrokes.
   - **Why:** Ken (W137): a weapon the player writes in should read like the catalog's, and L3's class modifiers need a type and a damage type to find it. One pick gives the Skill (LQ8), and the file stays the player's (LQ9).
   - **Rejected:** the player picks the Skill as well as the type (LQ8: two picks that can disagree); matching an old `type` to a weapon type (LQ9: a guess can pick the wrong Skill); storing the damage type's display name, as a catalog weapon does (a name may change, an id can't, constraint 6); the catalog's range words, Low to Extreme (Ken, LQ16: the book's bands, though a catalog "Low" and a custom "Short" then share Loadout's Range column); reading the bands from the quick reference's display table (a vocabulary shouldn't hang off a panel's columns: a test ties the two instead); auditing the text fields' keystrokes (W70's rows type freely, and a pick is the only part that changes a number).
   - **Replaces:** Decision 100 in part: "A custom weapon reads back what was typed." Its four picks and its damage now compute; its other fields still read as typed.
   - **Revisit if:** L3's class reading finds that the catalog's display word and a custom row's id want one resolver, or a custom weapon should take mods or reload from carried ammunition (LQ14).
   - **Built:** app 0.55.0, game data 0.49, character schema N, PR #…, log entry.
```

**Decision 100's mark:** after its *Weapons* bullet's sentence "A custom weapon reads back what was typed.", add `→ **Superseded in part by Decision N**: a custom weapon's type, damage type, range, ACC and damage now compute.` Then mark its INDEX line `→ **superseded in part by N**`.

## 4. Questions for Ken

LQ8 and LQ9 are answered (above) and aren't asked again.

| Id | Question | Default |
|---|---|---|
| LQ14 | Once a custom weapon has a type, should Reload take matching ammunition from what's carried, the way a catalog weapon of that type does (Decision 145)? Today a custom weapon reloads for free. | **Not in L2.** It reloads as it does now. Ammunition fitting a written-in gun is W109's question (a custom row opting into what a book row does). **Ken, 2026-10-24: Default** |
| LQ15 | Which damage types a custom weapon can pick | **The six non-magical ones:** Blade, Blunt, Ballistic, Electric, Energy, Burning. Elemental, Spirit and Aether are magic's, and Warding answers them. "Normal" isn't offered: it's the book's word for melee, and a written-in melee weapon picks Blade or Blunt instead. "Regular" isn't offered either: it isn't a damage type but a damage category (Regular, Withering, Massive: how a hit resolves), which the hit modal asks for on each hit and no weapon stores. **Ken, 2026-10-24: Default** |
| LQ16 | A custom weapon's Range. The catalog's words are Low, Medium, Long and Extreme, but 0530's range bands are Close, Short, Medium, Long and Extreme, so "Low" isn't a band | The catalog's words, as data, so a custom weapon reads like the catalog's. **Ken, 2026-10-24: the book's bands.** A custom weapon picks from 0530's five bands, kept as data (`weaponRules.rangeBands`). The catalog's own ranges don't change (§7), so its "Low" stays a mismatch with the book, now on the catalog's side. It goes on the CRB catch-up list |
| LQ17 | Reach and Parry for a written-in melee weapon | **Not in L2.** W137 asks for the type, damage type, range and ACC. A melee weapon's Reach and Parry stay in its Notes. **Ken, 2026-10-24: Default** |
| LQ18 | Picking a type: should it fill in that type's usual damage type (Handguns → Ballistic)? | **No.** Nothing is guessed. The damage type is its own pick, and starts empty. **Ken, 2026-10-24: Default** |

## 5. The assumption sweep

| What | Today | Where | After |
|---|---|---|---|
| `weaponCategories` rows | `id`, `name` (grenades: `note`) | data ~4153 | + `skill` on all 14, from the catalog's own (pre-flight) |
| `weaponRules.rangeBands` | absent; the bands exist only as the quick reference's display columns | data ~4138; the reference ~4830 | `["Close", "Short", "Medium", "Long", "Extreme"]` (LQ16). The reference table is unchanged, and L2 3 ties the two |
| A catalog weapon's `range` | Low, Medium, Long, Extreme | data, weapons | unchanged (§7); its "Low" now sits beside a custom weapon's band in one column |
| A custom row's stored fields | 8 typed fields + `roundsSpent` | engine `addCustomLoadout` ~2233 | + `category`, `damageType`, `range`, `acc` when picked; a new row has no `type` |
| `weaponLine` on a custom row | name, notes, rounds, fireModes | engine ~1789 | the full line (§8): skill, attack, acc, damage, damageFormula, damageType (the name), range, rof, capacity, typeText, tags [], features [], rounds, fireModes |
| `weaponDamage` on `"8"` | text, value null | engine ~1773 | 8. No catalog damage is a digits-only string (L2 7) |
| `migrate()` on a custom row | drops mods and loaded | engine ~4731 | also keeps each pick only if it's real, deleting it otherwise; `type` untouched (LQ9) |
| `fireWeapon`, `reloadWeapon` | read `rounds` | engine ~1857, ~1917 | unchanged; a custom weapon still reloads from nothing (LQ14) |
| `weaponModOptions` | null for custom | engine ~1998 | unchanged |
| Main's Weapons, a custom row | the raw row; Attack "—" | sheet.js ~464 | the line, as a catalog row: Attack, ACC on Single, Dmg, RoF, Cap |
| Loadout, a folded custom row | the raw row, type and features as sub lines | sheet.js ~2100 | the line, as a catalog row: sub line "Skill · damage type" (or the old `type` text while there's no type), Attack, Damage, Range (a band), RoF, Cap, Notes, Edit and ✕ |
| Loadout's Range column, catalog rows | the catalog's word | sheet.js ~2089 | unchanged, beside custom rows' bands |
| The catalog picker's range | the catalog's word | sheet.js ~1794 | unchanged: it lists catalog weapons only |
| Loadout, an open custom row | 8 text cells | sheet.js ~2109, `WEAPON_COLS` | 7 text cells (no `type`) and four controls: Type, Damage type, Range, ACC |
| Loadout's step note | only with a catalog weapon carried | sheet.js ~2107 | also when a custom weapon has an attack |
| Print sheet's weapons | name · type, damage, rof, capacity; no attack or range | sheet.js ~2720 | attack and range from the line; the name carries the old `type` only while there's no type |
| `loName` | name | sheet.js ~3893 | unchanged |
| The R6 reference sweep | no category skill | engine.test ~205 | each `weaponCategories[].skill` is a `skill` reference |
| SCHEMA §2's weapons comment | "freeform … every field preserved as typed" | SCHEMA ~955, ~969 | the four picks, with (N) |
| Comments that say a custom weapon computes nothing | engine ~1783, sheet.js ~452, ~2715 | — | rewritten |
| Decision 100 | "A custom weapon reads back what was typed" | SCHEMA §4 | superseded in part by N (§3) |
| `meta.schemaVersion` | "0.28" | engine `SCHEMA_VERSION` ~25; 23 test literals; docs | N |

**The three questions, answered by grep:**
- **Which guards read a value this changes?** The schema literal in 23 tests and in `docs.test.mjs` (the prototype's whole break list). The R6 sweep gains a reference. "Every catalog weapon resolves" reads a weapon's own `skill`, and L2 4 adds that it agrees with its category's. `hostile.test.mjs` already puts a payload in every typed field; L2 5 adds the four picks.
- **Where does each new number or line render?** A custom weapon's attack, ACC, damage, damage type and range render on Loadout (folded row), on Main and on the print sheet: three twins, each a row above. The old `type` text renders on the folded row's sub line, the open row's hint and the print name, and only while there's no type.
- **What text points at what this changes?** The three code comments, SCHEMA §2's comment and Decision 100 (rows above). `grep -rn "custom weapon\|what was typed\|as typed" src docs/SCHEMA.md` found no player-facing string about a custom weapon computing nothing. The plan's §2 sweep ("A custom weapon computes nothing") stays as true as of its date.

## 6. Read first

- `CLAUDE.md`: constraints 6, 7, 8 and 10; *Versions* (character schema, game data); *Change tiers* (Rule or shape); *Decisions*.
- SCHEMA §2's `weapons` comment (~953–969); Decision 100's *Weapons* bullet; Decisions 120 and 145 (mods and reload stay catalog-only); Decision 135 (a data key is read).
- `src/engine/engine.js`: `weaponDamage` (~1773), `weaponLine` (~1785), `weaponDefLine` (~2030), `addCustomLoadout` (~2230), `migrate`'s weapons step (~4723) and the number gate (~4580).
- `src/ui/sheet.js`: Main's Weapons (~456), `weaponRowsHtml` (~2077), the custom armor form in `armorRowHtml` (~2137, the pattern for a form of picks that commit), the `data-armorfield` handler (~3981), `loOpen` and the W70 handlers (~1856, ~3924), `pWeaponRows` (~2717).
- `tests/smoke-sheet-play.test.mjs`'s W70 tests (~1255): the open and fold behaviour this must keep.

## 7. Out of scope

- **No mods on a custom weapon** (Decision 120), and **no reload from carried ammunition** (LQ14).
- **No Reach or Parry** (LQ17), and **no style.** A written-in melee weapon picks Blade or Blunt as its damage type.
- **No class field and no reader of class.** L3 decides how a damage type becomes kinetic or energy, for catalog and custom rows alike.
- **No change to a catalog weapon's line,** its data or its display (L2 7). That includes its `range`: the catalog keeps "Low" though a custom weapon picks 0530's bands (LQ16). Moving the catalog to the bands is a book change first (§14's catch-up note), and a question for Ken if a builder finds it must move.
- **No change to the quick reference's "Range bands" table.** L2 3 checks it agrees with `rangeBands`; it isn't rebuilt from it.
- **No matching of an old `type` to a weapon type** (LQ9), and no prefilled damage type (LQ18).
- **Features stay text.** A custom weapon's `features` isn't read as tags.
- **Not custom armor or custom gear.** LQ6 already keeps their modifiers out of L3.

## 8. The shapes

**Data** (`gamedataVersion` 0.49):

```js
"weaponCategories": [
  { "id": "melee", "skill": "melee", "name": "Melee" },
  { "id": "martialArts", "skill": "martial-arts", "name": "Martial Arts" },
  { "id": "handguns", "skill": "handguns", "name": "Handguns" },
  { "id": "smgs", "skill": "smgs", "name": "Submachine Guns" },
  { "id": "grenades", "skill": "melee", "name": "Grenades", "note": "…" },
  { "id": "urbanRifles", "skill": "rifles", … }, { "id": "shotguns", "skill": "rifles", … }, { "id": "sniperRifles", "skill": "rifles", … },
  { "id": "heavyWeapons", "skill": "heavy-weapons", … },
  { "id": "beamSidearms", "skill": "beam-weapons", … }, … (all four beam rows),
  { "id": "archery", "skill": "archery", "name": "Archery" }
],
"weaponRules": { …, "rangeBands": ["Close", "Short", "Medium", "Long", "Extreme"], … }
```

Each category's `skill` is the one every catalog weapon in it already names. L2 4 checks that by script, never from this list. The comment above `weaponCategories` gains a line saying `skill` is what a custom weapon of that type attacks with. Grenades' Skill is Melee because the book's grenade table says so (thrown). `rangeBands` are 0530's *Range bands*, in their order; the comment above `weaponRules` says they're what a custom weapon's Range picks from, and that a catalog weapon keeps the catalog's own word. The quick reference's "Range bands" part (~4830) stays as it is: L2 3 checks the two agree.

**The saved row** (character schema N):

```js
{ custom: true, name, damage, rof, capacity, ammo, features, notes, roundsSpent: 0,
  category: "handguns",       // a weaponCategories id; absent until picked
  damageType: "ballistic",    // a damageTypes id with no `magical: true`; absent until picked
  range: "Short",             // one of weaponRules.rangeBands; absent until picked
  acc: 1,                     // a whole number >= 0; absent until typed
  type: "pistol" }            // only on a row saved before N (LQ9); never written again
```

**`migrate()`** (in the existing weapons step, ~4731): for a custom row, each of the four is kept only when it's real (the same test as the line's, below), and deleted otherwise. `type` is untouched. Running it twice changes nothing.

**Engine** (exported as named):
- `weaponDamage(ch, d)`: a string of digits (`/^\s*\d+\s*$/`) reads as that number, with no formula. Nothing else changes.
- `weaponLine(ch, index)` on a custom row returns:

  ```js
  { index, custom: true, name, notes,
    category: "handguns" | null,
    skill: { id, name, trained } | null,      // the category's skill, as weaponDefLine builds it
    attack: <that skill's checkBonus> | null,
    acc: 1 | null, damage: 8 | null, damageFormula: "BOD+3" | "2d6" | null,
    damageType: "Ballistic" | null,           // the damageTypes entry's NAME, as a catalog line shows it
    range: "Short" | null, rof: "S" | null, capacity: "4" | null,
    typeText: "pistol" | null,                // the old type, only while category is null
    tags: [], features: [], rounds, fireModes }
  ```

  A pick that isn't real (an unknown or inherited id such as `"__proto__"`, a magical type, a range not in the list, a negative, fractional or non-number ACC) reads as null, never throws.
- `setCustomWeapon(ch, index, field, value) → { ok:true, field, value } | { ok:false, why }`. `field` is one of `category`, `damageType`, `range`, `acc`. A value of `""` or `null` clears the pick (deletes the key). It refuses a row that isn't custom, a field not in the four, and a value that isn't real, with a `why` in tool voice ("ACC is a whole number, 0 or more."). It writes nothing on a refusal.
- `addCustomLoadout(ch, "weapons")` no longer writes `type`.

## 9. The UI

**A folded custom row** (it has a name and isn't open, as W70 left it) draws like a catalog row, from the line:
- Name, and under it the sub line: the Skill's name and the damage type, " · " between them (as a catalog row's), or the old `type` text while there's no type. Typed features stay a sub line of their own.
- Attack (`1d10 + N`, or "—" with no type), "+N ACC on Single" when ACC is above 0, Damage (the number, or the text), Range, RoF, Cap. with its fire buttons and Reload, Notes, Edit, ✕.

**An open custom row** keeps W70's behaviour (Edit opens it, Done folds it, a nameless row is open, an undo folds it). It holds:
- The text fields, as today: name, damage, rof, capacity, ammo, features, notes. They're keystrokes, unaudited, with their `data-cell` hooks unchanged, so W70's tests still find `[data-cell="weapons|i|name"]`.
- **Four controls**, each committing one audited action on change, through `setCustomWeapon`, like the custom armor form's picks:
  - **Type:** "—" then every `weaponCategories` name, in the data's order.
  - **Damage type:** "—" then the six non-magical names.
  - **Range:** "—" then `weaponRules.rangeBands` (Close, Short, Medium, Long, Extreme).
  - **ACC:** a number field, min 0. Blank clears it.
- While there's no type and the row has an old `type`, a hint beside Type shows it (drafted: *You wrote "pistol". Pick its type.*, for the voice pass).

**Where things land:**

| Press | What's stored | Audit line (drafted) | Where focus goes |
|---|---|---|---|
| Type picked | `category` | `<name>: type → Handguns` | stays on the Type control; the row stays open |
| Type set back to "—" | `category` deleted | `<name>: type → —` | the same |
| Damage type or Range picked | `damageType` / `range` | `<name>: damage type → Ballistic` / `<name>: range → Short` | stays on that control |
| ACC typed, field left | `acc` | `<name>: ACC → 2` | stays on the field |
| ACC refused (−1, 1.5) | nothing | — | a notice with the `why`; the field shows the stored value once it loses focus |
| Done | nothing (view state) | — | Edit, as W70 has it |

A pick mutates the row object in place, so `S.loOpen` still holds it and the row stays open after the re-render. An undo replaces rows with clones and folds the row, as W70 recorded.

**Main** draws a custom row as it draws a catalog row: Attack, Dmg, RoF, Cap. **Print** fills Attack (`1d10+N (+A ACC)`) and Range from the line, and puts the old `type` in the name only while there's no type. **Loadout's step note** ("Attack is 1d10 + the weapon's skill…") shows when any weapon line, catalog or custom, has an attack.

All new copy is drafted for a voice pass: the four labels, "—", the hint, the audit lines and `setCustomWeapon`'s refusals.

## 10. Worked examples, as named tests

The character for L2 1–3 and L2 8: `subject()`-like, BOD 5, Handguns rank 3, a custom row named "Zip gun", damage `BOD+3`, rof `S`, capacity `4`. Write these first and show each failing on `main`, or say why it passes there.

| Test (file) | Pins |
|---|---|
| `L2 1 (engine): a custom weapon typed Handguns attacks with Handguns, the same number a catalog handgun shows` (`engine.test.mjs`) | With `category: "handguns"`: `line.skill.id === "handguns"`, and `line.attack` equals `weaponLine` of a carried Cheapshot's `attack` (8 for this character). With no category: `skill` and `attack` null. On `main`, a custom line has no `attack` at all |
| `L2 2 (engine): a custom weapon's damage reads as the book's: BOD+3 is BOD + 3, a number is fixed, anything else is text` (`engine.test.mjs`) | `BOD+3` → damage 8, formula "BOD+3"; `"8"` → 8, formula null; `"2d6"` → null, "2d6"; `""` → null, null. And `weaponDamage(ch, "8")` → 8 on its own |
| `L2 3 (engine): a custom weapon's damage type, range and ACC are its picks, and its damage type reads by name` (`engine.test.mjs`) | `damageType: "ballistic"` → line `"Ballistic"`; `range: "Short"` → `"Short"`; `acc: 2` → 2. `damageType: "elemental"` (magical) → null; `range: "Low"` (the catalog's word, not a band) → null. `weaponRules.rangeBands` equals the columns of 0530's *Range bands* table, parsed from the CRB, and the quick reference's "Range bands" part's columns. The rules half goes in `rules.test.mjs` as `L2 3b (rules): CRB 0530: a custom weapon's range bands are the book's` |
| `L2 4 (engine): every weapon type names a Skill, and every catalog weapon's Skill is its type's` (`engine.test.mjs`) | For each `weaponCategories` row, `skill` is a real Skill. For each catalog weapon, `w.skill === category.skill`. Computed over the data, never from §8's list |
| `L2 5 (engine): junk in a custom weapon's picks reads as empty, from a file and from a call` (`engine.test.mjs`) | `migrate()` on a row with `category: "__proto__"`, `damageType: "x"`, `range: "Low"` (the catalog's word, not a band), `acc: -1` (and in turn `"2"`, `1.5`, `NaN`, `{}`): each key is gone, and a second migrate changes nothing. `setCustomWeapon` refuses each with `ok:false`, writes nothing, and refuses on a catalog row and on a field outside the four. `weaponLine` never throws on any of them |
| `L2 6 (engine): migrate to N keeps a saved type as text, shows it until a type is picked, and adds nothing` (`engine.test.mjs`) | A 0.28 file with `{ custom:true, name:"Old iron", type:"pistol", … }`: after `migrate()` the schema is N, `type` is still "pistol", and no pick was added. `line.typeText === "pistol"` until `category` is set, then null, and `type` stays in the row. A new row from `addCustomLoadout` has no `type` key |
| `L2 7 (engine): no catalog weapon's line moves` (`engine.test.mjs`) | A fixture captured on `main` **before** the engine changes (`tests/l2-weapon-lines.json`): `catalogLine` and a carried `weaponLine` for every catalog weapon, for BOD 3, 5 and 8 (so every `BOD+N` resolves three ways). The branch's lines match it exactly. Deleted with its fixture at close-out (§12, step 8), once the PR shows it passing |
| `L2 8 (sheet): a typed custom weapon's folded row on Loadout reads like a catalog row` (`smoke-sheet-play.test.mjs`) | The Zip gun with `category: "handguns"`, `damageType: "ballistic"`, `range: "Short"`, `acc: 1`, folded. **Its own row** (found by its name, as L1 5's `card()` does): sub line exactly "Handguns · Ballistic", the Attack cell `1d10 + 8`, "+1 ACC on Single", Damage 8, Range "Short". The Cheapshot's row beside it reads the same Attack, and its Range is still "Low" (LQ16 leaves the catalog's word). On `main`, the Zip gun's row has none of these |
| `L2 9 (sheet): Main and the print sheet show a typed custom weapon's attack and range` (`smoke-sheet-play.test.mjs`) | Main's Weapons row for the Zip gun has Attack `1d10 + 8`. `pWeaponRows` (or the printed sheet's row) has attack `1d10+8 (+1 ACC)` and range "Short" |
| `L2 10 (sheet): each pick on an open custom weapon is one undoable action, and a saved type shows until a type is picked` (`smoke-sheet-play.test.mjs`) | On an open row with `type: "pistol"`: the hint is in **that row** and contains "pistol". Picking Handguns stores `category`, adds one audit entry naming the weapon and "Handguns", keeps the row open, keeps focus on the Type control, and removes the hint. Undo restores no `category` and the hint. Typing in the name cell adds no audit entry. An ACC of −1 is refused with a notice and stores nothing |

## 11. Tests beyond the examples

- **Mutation-test** each guard against the fixed code, recording the output in the PR. Each must fail:
  - L2 4: change grenades' `skill` to `"archery"`; separately, give a catalog handgun `skill: "smgs"`.
  - L2 5: let `customWeaponFields` (or its equivalent) accept any string id. Also check whether a second path, the number gate (~4580), already covers `acc`. If it does, say so; the mutant has to beat both.
  - L2 1: read the attack from the custom row's `type` text instead of `category`.
  - L2 3 and 3b: drop "Close" from `rangeBands`; separately, put the catalog's "Low" in it. Each must fail.
  - L2 8: draw the sub line on the next row instead of this one (the off-row mutant L1 missed). L2 8 must fail.
  - L2 10: commit the pick without `setCustomWeapon`'s refusal check, so −1 is stored.
- **Hostile:** `hostile.test.mjs`'s custom weapon gains a payload in `category`, `damageType`, `range` and `acc`. Its existing `type` payload must still render escaped, now as the hint and the sub line.
- **Totality:** the engine's totality sweep (constraint 8) covers `setCustomWeapon` with bad indexes and a non-object row.
- **Round trip:** `migrate(migrate(x))` deep-equals `migrate(x)` for a row with all four picks, as the W16 test does.
- **Voice:** `npm test` covers the new strings; the reviewer runs the voice pass (§14).

## 12. Steps

1. `git submodule update --init private`, `npm ci`, `npm run test:fast` (a fresh branch from `main`).
2. **Capture L2 7's fixture on unchanged code,** and commit it alone. Then write L2 1–10 and show them failing on `main` (L2 7 passes there by design, since nothing has moved yet: say so).
3. **The data:** the 14 `skill`s, `gamedataVersion` 0.49, the comment. Then the R6 sweep's new reference. `npm run verify`.
4. **The engine:** `weaponRules.rangeBands` and its comment (here, not in step 3: the key guard fails on it until the custom line reads it), `weaponDamage`, the custom line, `setCustomWeapon`, `addCustomLoadout`, `migrate()`'s step, `SCHEMA_VERSION` N and the 23 test literals. `npm run verify`.
5. **The UI:** the folded row, the open row's four controls and hint, Main, print and the step note. `npm run verify`.
6. **The dev preview** (`shadows-dev-preview`; seed `shadows.active.v1` with a locked character holding the Zip gun, typed and untyped, a saved `type`, and a Cheapshot; then Open sheet). Check the folded row, the open row, every pick, an undo, Main and Print, and the open row at 375 px. Screenshots if the tool draws. If it times out, paste the DOM read of both rows and the phone-width metrics (`scrollWidth` against `clientWidth`, no element in `main` past the right edge) into the PR.
7. **Mutation tests** (§11), each recorded in the PR with its output.
8. **Close-out** (§14). Delete L2 7's test and `tests/l2-weapon-lines.json` in the close-out commit, and name in the PR the commit where they last passed.

## 13. Stop and ask

**Stop** if:
- Any catalog weapon in a category names a different Skill from the rest of that category (L2 4). The data has moved since this pre-flight, and §4's LQ8 note no longer holds.
- Any catalog weapon's line moves in L2 7.
- A reader of a custom weapon row turns up that §5 doesn't list, in `src/` or in GM mode.
- `weaponRules` already has a `rangeBands` key, or `weaponCategories` a `skill`, when you start.
- 0530's *Range bands* table doesn't read Close, Short, Medium, Long, Extreme (L2 3b). The book has moved: don't edit the data to fit.
- A W70 test fails for a reason other than the schema literal.

**Not a stop** (expected):
- The schema literal `"0.28"` failing in 23 tests and in `docs.test.mjs`. Update each to N.
- The version literals the bumps move (`APP_VERSION`, `package.json`, `package-lock.json`, `README.md`, `STATE.md`, `meta.gamedataVersion`).
- `npm run changelog` regenerating `src/data/shadows-changelog.js`.
- L2 7 passing on `main`.
- The key guard passing for `skill` before any reader exists (a weapon's own `skill` is read under that name). L2 4 proves it's read.
- The key guard failing on `rangeBands` if it's added before the custom line reads it. Step 4 adds both together.

## 14. Close-out

- **`CHANGELOG.md`**, under `## [Unreleased] — app 0.55.0`, in player voice. It names no list of weapons. Drafted for the voice pass:
  - "**Weapons you write in work like the catalog's.** Pick a type, a damage type and a range, and give its ACC. Loadout, Main and the printed sheet then show its attack from your Skill and its damage worked out from BOD."

  Then `npm run changelog`.
- **Versions:** `npm run bump -- 0.55.0`; `gamedataVersion` 0.49; `SCHEMA_VERSION` N.
- **Docs:**
  - SCHEMA §4: Decision N, and Decision 100's mark. INDEX §3: N's line, and 100's mark.
  - SCHEMA §2's weapons comment.
  - The plan's L2 row status (Merged, with the PR and versions). W137's Plan line.
  - A `docs/log/2026.md` entry, a `docs/log/shipped.md` row, and STATE rewritten (versions; L2 done, L3 next).
  - LQ16's mismatch on `plans/crb-catch-up.md`, now on the catalog's side: Gear's weapon tables use "Low" for a Range, which isn't one of 0530's bands, while a written-in weapon picks a band. Ken's call whether the tables move to the bands. The data doesn't until the book does.
- **PR title:** `L2: custom weapons read like the catalog's: type, damage type, range, ACC (W137; Decision N)`.
- **PR body:** the template's sections, including **Where the order didn't fit**. Paste every new string as it renders: the four labels, the hint, the audit lines, the refusals and the changelog line.

**Review checklist** (the reviewer, beyond the tests passing):
- L2 4 computes the type→Skill agreement from the data, not from §8's list.
- L2 7's fixture commit precedes every engine and data commit and touches only the fixture. The PR names the commit where L2 7 last passed before its deletion.
- Every mutant in §11 was run and killed, with its output in the PR, including the off-row mutant for L2 8.
- Every row in §5's sweep is built, and a fresh grep of a custom row's readers (`\.custom\b`, `weaponLine(`, `WEAPON_COLS`, `ch.weapons[`) finds none it missed.
- No catalog weapon's display changed: open the catalog picker and a carried catalog weapon in the preview.
- A file saved before N opens with its `type` shown, and saving it again keeps it.
- The four picks commit through `setCustomWeapon`, and the text cells still don't audit.
- Constraint 9: no decision number, LQ or W id in any rendered string.
- The voice pass on every new string, drafted side by side **inline in the message to the conductor**.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md` (*The prompts*), with `<plan>/<order>` = `loadout-and-gear/L2-custom-weapons.md` and `<id>` = **L2**, plus these traps:

- **Stored and shown damage types differ.** A custom row stores the id (`"ballistic"`); its line shows the name (`"Ballistic"`), as a catalog line shows the book's word. Don't compare a catalog weapon's `damageType` with a custom row's stored one.
- **The key guard sees one of the two keys.** `skill` is already read under that name (a weapon's own), so the guard passes it before any reader exists, and L2 4 is the proof. `rangeBands` is a new name: add it in step 4 with its reader, or the guard fails.
- **Two range vocabularies share one column, on purpose** (LQ16). A custom weapon's range is one of 0530's bands; a catalog weapon keeps the catalog's word ("Low"). Don't map one to the other, and don't touch a catalog weapon's `range`.
- **A digits-only damage string is new.** `weaponDamage` now reads `"8"` as 8. No catalog damage is a string of digits, and L2 7 proves no catalog line moved. Don't widen it to `"8 "` plus text.
- **Keep the `data-cell` hooks.** W70's tests find the open row by `[data-cell="weapons|i|name"]`. The new controls are extra, not a replacement.
- **A pick must not fold the row.** It mutates the row in place, so `S.loOpen` keeps it open. Check this in the browser, not only in jsdom.
- **The old `type` is never written.** Not by `addCustomLoadout`, not by a pick, and not cleared by one. LQ9 keeps it in the file.
- **Capture L2 7's fixture first,** in its own commit, before any data or engine edit.
