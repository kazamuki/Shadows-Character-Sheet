# Work order L3: Worn modifiers, first cut

**Plan:** [`../loadout-and-gear.md`](../loadout-and-gear.md) §3, row L3, and its *What each order settles* bullet. **Wish:** [W69](../../WISHLIST.md), without Powered Armor (L7). **Ken's answers that stand:** LQ3 (a carried tool's bonus counts while it's "in use": a gear row with modifiers gets an In use toggle, armor keeps Worn), LQ4 (the Hacking Visor's, Hacking Gloves' and PrecisionGrip Gloves' Skills are a flag for Deighton) and LQ6 (catalog entries only), all "Default", 2026-10-24. **Deighton's rulings** (`reference/rulings-2026-10-10.md`, Q12–Q16): a stat bonus reaches skill checks and damage only (Q12); two pieces stack (Q13); Electric and Burning count as energy (Q14); a worn bonus can pass 10 (Q15); Powered Armor is a vehicle (Q16, so L7). **The book:** `0460` *Gear*: the Smart Decks' "+1/+2/+3 Interface" (~976), the SMARTLink Gloves' "+2 ACC when using SMARTLink-compatible weapons" (~876) and its note that the +2 "stacks with weapon-native SMARTLink bonuses" (~921), and the three LQ4 items (~853, ~877). Decisions 100, 120, 233, 237, 247.

**Status: drafted 2026-10-25 by Claude (Opus), L2's reviewer, as the plan's orchestrator.** Not approved. Ken answered LQ19–LQ22 on 2026-10-25 (§4): LQ19 is Melee, not the default, and the order is revised to it (re-pre-flighted, below). The rest are Default. Waiting on Ken's approval.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md): **L3 build** (Sonnet), then a fresh **L3 review** (Opus) once the PR is open.

**Carried over from L2** (PR #254):
- **The order's misses.**
  - §9 said what a refused ACC shows for −1 and 1.5, but not for a string that isn't a number. In a browser a number field reads "1e" as `""`, so the handler cleared a stored ACC and audited it. The review fixed it (`9525d3d`). L3 has no number field, but every control it adds is in §9's *Where things land* with what a bad value does.
  - The drafted decision was 401 words against the ledger's 350 cap, and the builder cut its *Touches* line to fit. *Touches* is what a ledger search reads, so the review put the names back (`ff1b45a`). **This order's decision is drafted at 335 words (`docs.test.mjs` counts by whitespace), so it fits with *Built* filled. If it must shrink, cut prose, never *Touches*.**
  - §10 said L2 10 "keeps focus on the Type control", and the test only said so in a comment. The review added the assertion (`ff1b45a`). Here, **every *Where focus goes* cell in §9 is an assertion in a named test** (§10 says which).
- **The build's misses.** The two above landed as the build, and a code comment was left garbled ("A custom weapon is weapon of its type's Skill"). The builder raised no stops, and its PR body (the DOM reads, the phone metrics, every mutant's output, *Where the order didn't fit*) was the model for the review. Keep it.
- **From the conductor.** Ken took the review's drafts for the hint and the changelog line and kept the rest (PR #254, comment 6400264898). Voice-pass drafts go inline in the reviewer's message to the conductor, side by side. That worked: keep it.

**Pre-flight against `main` at `8bd32f8`** (#254 merged; app 0.55.0, game data 0.49, character schema 0.29; the highest decision is 247, so **N** is 248 today; the highest flag is F48, so **F‑N** is F49; schema **S** is 0.30).

```
What prints a bonus      Every armor and equipment entry whose text prints "+N" (script: 17 of 174, the plan said 16). Worn or used, so L3's:
                           smart-deck-i/ii/iii   equipment, tech   "+1/+2/+3 Interface"                        carried
                           smartlink-gloves      armor, hand       "+2 ACC when using SMARTLink-compatible weapons"  worn
                           hacking-visor         armor, head       "+5 to electronic interface and hacking checks"   worn  (LQ4: flag)
                           hacking-gloves        armor, hand       "+2 to electronic interface and hacking checks"   worn  (LQ4: flag)
                           precisiongrip-gloves  armor, hand       "+2 to precision skill checks"                    worn  (LQ4: flag)
                         Not L3's: the four timed drugs (LQ7), Quickstitch and Slowstitch (Health Levels), the two maintenance kits
                         (an action, not worn), Angel Rounds and the Explosive Tip (ammo)
Where "worn" lives       armor[i].worn, one per slot (setWorn ~2291). addLoadout ~2163 wears a new piece when its slot is free, so
                         buying the gloves puts them on. A scrapped piece's lining stops (resolveHit ~1555): the precedent here
Where "in use" lives     nowhere. A gear row is { id, qty, notes, chargesUsed?, roundsLeft? }; migrate ~4759. A second copy of a
                         non-charged entry stacks into the same row (addGearEntry ~2224), so two Smart Deck IIs are one row, qty 2
A Skill's check          skillLine ~1116: rank = held rank + IPE + boosts; base = rank>0 ? rank + primary + Synergy mod : primary.
                         Probe (INT 5, TECH 8): Interface untrained 5; rank 2 is 9 (TECH 8's Synergy counts only when trained)
                         traitRows ~1020 reads `grants` from grantSources(ch, true) ~240 (Decision 237's sources); an unconditional
                         checkMod is a part of checkBonus, shown on the row as "+2 <its name>" (skillRowPair ~364). Nothing here
                         is called a trait on screen. traitGrants ~277 reads grantSources(ch, false), which L3 must not reach
What reads `rank`        ipCost ~2762, checkPrereqs ~2919/2923, the IP buy list ~3096/3163/3311, canBoost ~966: all the held rank.
                         None reads checkBonus
A weapon's line          weaponDefLine ~2075: acc (number or null), damage (number or null), damageFormula; weaponLine ~1830 adds
                         mods' damageBonus and `aimed`. Custom rows: customWeaponLine ~1796 (L2). Readers of l.acc and l.damage:
                         Loadout's rows (sheet.js ~2111, ~2124), Main ~466/~470, print pWeaponRows ~2738. catalogLine ~2128 (the
                         picker) uses weaponDefLine, not weaponLine: it shows a weapon you don't hold yet
SMART Link weapons       ap7-sentry (handguns, ACC 3), ar9x-guardian (urbanRifles, ACC 2), argus-er3-nullifier (beamSpecialist, ACC 1)
                         Probe: AP-7 acc 3, AR-9X 2, Argus 1; Cheapshot 0. A custom weapon's `features` is text (L2 §7)
A weapon's class         Nothing computes one. Catalog damageType is the book's word (L1): Normal 6, Electric 4, Energy 8,
                         Ballistic 22, Burning 1, none 13 (8 grenades, 2 heavy, 3 bows: F48 and the three that deal no damage).
                         Every "Normal" weapon has a style: Blade, Blunt or Blade/Blunt, each a damageTypes NAME (resClass kinetic).
                         damageTypes' resClass: blade/blunt/ballistic kinetic; electric/energy/burning energy; the magical three
                         their own. A custom row stores the id (L2). Ranged or melee: nothing. All eight weapon Skills have
                         `category: "combat"`, so no key says melee; weaponCategories has id, skill, name. A grenade attacks
                         with Melee (every grenade's `skill`, and its type's, L2 4)
The key guard            (Decision 135, by key name) `class` is new: it fails until read. `to`, `feature`, `amount` and `melee`
                         are already read under those names (`melee` is the hit modal's flag, ~1576), so the guard passes them for
                         the wrong reason: L3 3, L3 4 and L3 5 are what prove each is read
Prototype                The data keys, wornGrants, traitRows' sources, weaponClass, weaponLine's bonuses and migrate's inUse step
                         (no UI), on this checkout: npm test gave 1356 pass, 26 fail, and all 26 are the schema literal "0.29" →
                         "0.30": 25 tests (29 occurrences: 26 in engine.test, 2 in hostile.test, 1 in smoke-sheet-play) and
                         docs.test's versions check. Probes on it: Interface (INT 5, TECH 8) untrained 5 → 7 with SMART Deck II
                         in use, rank 2 9 → 11, put away 9; AP-7 ACC 3 → 5 with the gloves on, Cheapshot 0 unchanged
Re-pre-flight for LQ19   2026-10-25, main still at 8bd32f8. The prototype again, with `melee` on the two Skills instead of two
  (Ken: Melee)             weapon types, and weaponClass reading the weapon's Skill: a fixture `{ to:"acc", class:"melee" }`
                           reaches 20 of 54 catalog weapons (the 8 grenades among them) and a custom Grenades row. npm test:
                           1356 pass, 26 fail, the same 26 tests as before, all the schema literal. No Skill entry's keys are
                           pinned by a test or drawn by a generic renderer (grep)
```

---

## 1. Goal and Done when

**Goal.** What a worn piece or a tool in use prints lands where it applies. A Smart Deck in use raises Interface's check, SMARTLink Gloves worn raise a SMART Link weapon's ACC, and taking either off takes the bonus away. The mechanism also reaches a weapon by its class (ranged or melee, kinetic or energy), so later gear, and L5's and L7's sources, need only data.

**Done when:**
- A catalog armor or equipment entry can carry modifiers in its data (`grants`). Nothing in code names an item.
- A Smart Deck's row on Loadout has an **In use** toggle. While it's on, Interface's check is higher by the deck's number on Skills, Main and print, and an untrained Interface gets the number without its Synergy. Interface's rank, its IP price, its caps and every prerequisite that reads it don't move.
- SMARTLink Gloves worn add +2 ACC to each SMART Link weapon's line on Loadout, Main and print, and to nothing else.
- A weapon's class is read from the data for every catalog and custom weapon, and a `weaponBonus` by class reaches every weapon of that class (shown by a test fixture: no catalog entry uses one yet).
- Two pieces stack; a row counts once however many it holds; a scrapped or unworn piece and a row not in use add nothing.
- The three LQ4 items say on their own card that the GM rules which checks they add to, and move no number.
- Toggling In use, like Worn, is one undoable action. A saved file opens with nothing in use, loses nothing in `migrate()`, and junk in `inUse` reads as not in use.
- With nothing worn or in use, no weapon's line and no Skill's check moves (L3 7's diff).

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** A data shape (`grants` on armor and equipment, a `weaponBonus` grant type, `skills[].melee`), a save-file shape (`gear[i].inUse`) and a player-facing behaviour someone could have chosen otherwise. One decision (§3), one flag (§3).
- **Character schema:** 0.29 → **S** (0.30 today), with a `migrate()` step (§8). Take the next minor if another branch lands first.
- **Game data:** `gamedataVersion` 0.49 → **0.50** (Decision 68): a character's computed values change once a piece is worn or in use. Take the next minor if another branch lands first.
- **App:** a minor, 0.55.0 → **0.56.0** (`npm run bump -- 0.56.0`), or the next minor.
- **Decision:** the next free number, written **N** here (248 today). **Flag:** the next free flag, written **F‑N** (F49 today).

## 3. Decisions

Paste this into SCHEMA §4 with N, F‑N and S filled in, and add its INDEX §3 line under Loadout. Decisions 237 and 120 are extended, not superseded (*Replaces*), so neither gets a mark.

```
N. **Worn armor and gear in use carry modifiers: a Skill's check, and a weapon's ACC or damage by its class or feature.**
   *2026-10-25 · Ken + Claude · Touches: grants on armor and equipment, wornGrants, traitRows, skillLine checkBonus, weaponLine, weaponClass, weaponBonus, checkMod, skills.melee, armor[i].worn, gear[i].inUse, setInUse, Loadout's armor card, Loadout's gear row, print gear rows, SMART Deck I–III, SMARTLink Gloves, Hacking Visor, Hacking Gloves, PrecisionGrip Gloves, F‑N, character schema S, W69, LQ3, LQ4, LQ6, LQ19–LQ22, Deighton Q12–Q15*
   - **Decided:** A catalog armor or equipment entry carries modifiers as `grants`, read only while its piece is worn and not scrapped, or its gear row is in use (`inUse`). A `checkMod` adds to the Skill's check, never its rank, so an untrained Skill gets the number without its Synergy, and prices, caps and prerequisites read the held rank. A `weaponBonus` adds to a weapon's ACC or damage, by class (`melee`, `ranged`, `kinetic`, `energy`) or by a catalog feature. A weapon's class is data: its Skill's `melee` (so a grenade is melee), and its damage type's `resClass` (a catalog word read as a damage type's name, or its style's when the word is "Normal"; a custom row's id). They stack, are never negative, and custom rows carry none.
   - **Why:** W69 (Ken, Deighton Q12–Q15): what a worn piece prints should land where it applies.
   - **Rejected:** worn ranks in `rank` (an untrained Skill would take its Synergy, and its price would move); "Normal" as a code word (its style names a damage type); the catalog's words as ids (L1 kept them); grenades as ranged (Ken, LQ19: a weapon follows its Skill); a class on each weapon (its Skill says it); typed modifiers on a custom row (LQ6); counting gear only carried (LQ3).
   - **Replaces:** nothing; extends Decisions 237 (traitRows' sources) and 120 (a line's ACC and damage).
   - **Revisit if:** Deighton rules F‑N; L5 or L7 needs a stat modifier or another source.
   - **Built:** app 0.56.0, game data 0.50, character schema S, PR #…, log entry.
```

**Flag F‑N** (SCHEMA §5 row and INDEX §2 line, by the `close-a-flag` skill): *Which Skills "electronic interface and hacking checks" (Hacking Visor +5, Hacking Gloves +2) and "precision skill checks" (PrecisionGrip Gloves +2) add to. Interface alone, or Interface, Programming and Security; and for precision, which Skills.* Owner: Deighton. Until he rules, the three keep their text and compute nothing (LQ4).

## 4. Questions for Ken

LQ3, LQ4 and LQ6 are answered (above) and aren't asked again.

| Id | Question | Default |
|---|---|---|
| LQ19 | Is a grenade a **ranged** weapon or a **melee** one, for a modifier on "ranged weapons"? It's thrown with the Melee Skill (0460's grenade table) | Ranged. **Ken, 2026-10-25: Melee.** A grenade counts as a melee weapon, following its Skill. So the flag is on the Skill, not the weapon type: `melee: true` on Melee and Martial Arts, and a weapon is melee when the Skill it attacks with is. The 8 grenades are melee, and a written-in weapon follows its type's Skill (L2) |
| LQ20 | A gear row with modifiers: is it **in use** when it's added? (Armor is worn when added if its slot is free) | **No.** It's added carried, with its In use toggle off. A deck in your bag isn't jacked in, and nothing is guessed. **Ken, 2026-10-25: Default** |
| LQ21 | Two different decks both in use (I and III): do they **stack**, +4 Interface? | **Yes,** per Deighton's Q13 ("they stack"). In use is the player's call. A row of two of the same deck counts once, since it's one row. **Ken, 2026-10-25: Default** |
| LQ22 | An untrained Skill with a worn bonus: does it count as **trained**, or meet a prerequisite ("Rank 1+ in Interface")? | **No.** The bonus is in the check, never the rank. The row still reads Rank 0 and untrained, with "+2 SMART Deck II" beside it, and every prerequisite reads the held rank. Deighton's "ranks only" says which part of the check it adds to, not that it trains you. **Ken, 2026-10-25: Default** |

## 5. The assumption sweep

| What | Today | Where | After |
|---|---|---|---|
| Armor and equipment `grants` | absent; their bonus is `notes` text | data ~4372–4379, ~4425–4427 | the decks: `checkMod` on `interface`, 1/2/3; the SMARTLink Gloves: `weaponBonus` +2 `acc`, `feature: "SMART Link"`. `notes` unchanged |
| The three LQ4 items | text only | data ~4372, ~4377, ~4379 | `flagged: true`, `flagNote` naming F‑N, `playerNote` (§9). No `grants` |
| `skills[].melee` | absent; every weapon Skill's `category` is "combat" | data, the `melee` Skill ~602 and `martial-arts` ~515 | `true` on those two; absent elsewhere (LQ19). A weapon is melee when its Skill is: 20 of 54 catalog weapons (6 Melee, 6 Martial Arts, 8 grenades) |
| `gear[i].inUse` | absent | migrate ~4759 | `true` or absent, on a catalog row only (§8) |
| `traitRows` sources | `grantSources(ch, true)` | engine ~1020 | also `wornGrants(ch)` (§8). `grantSources` itself is unchanged, so `traitGrants` and `naturalArmor` never see gear |
| `skillLine().checkBonus` | rank + stats + pain + conditions + form + traits | engine ~1146 | + a worn or in-use `checkMod`, as a `traitParts` entry named for the item. `rank` and `trained` unchanged |
| Readers of `rank` | held rank | ipCost ~2762, checkPrereqs ~2919/2923, IP list ~3096/~3163/~3311, canBoost ~966 | unchanged (LQ22). L3 1 pins ipCost, canBoost and skillRankCap equal with the deck in use |
| A Skill's row | parts: rank, stats, pain, conditions, `traitParts` | sheet.js skillRowPair ~364 | the deck shows as "+2 SMART Deck II" with no code change. Main's Combat skills and print read the same line |
| `weaponLine` | acc, damage from the def, mods | engine ~1830 | + each worn or in-use `weaponBonus` that reaches it: into `acc`, or into `damage` when it's a number; every one listed in `bonuses` [{ to, amount, from }]. Custom rows too (class only) |
| `Engine.weaponClass(ch, i)` | none | — | `{ melee: true|false|null, damageClass: "kinetic"|"energy"|null }` (§8) |
| Loadout's weapon rows, Main, print | read `l.acc`, `l.damage` | sheet.js ~2111, ~2124, ~466, ~2738 | follow the line; a sub line names each bonus ("+2 from SMARTLink Gloves") on Loadout. A text damage keeps its text and the sub line says the bonus |
| The catalog picker | `catalogLine` (weaponDefLine) | engine ~2128; sheet.js ~1797 | unchanged: it shows a weapon you don't hold yet |
| Loadout's armor card | Worn, name, slot, features; no catalog text | sheet.js armorRowHtml ~2150 | + what the piece adds while worn (§9), and a flagged piece's `playerNote` |
| Loadout's gear row | name, sub line, count, notes, ✕ | sheet.js gearRowsHtml ~1985 | + an In use toggle and what it adds, on a catalog row whose entry has modifiers only |
| `setInUse` | none | — | engine, one audited `commit()` per toggle (§8, §9) |
| Print's gear rows | name, type, notes | sheet.js pGearRows ~2752 | "in use" in the type column while it's on |
| `addGearEntry` | stacks a non-charged entry | engine ~2224 | unchanged; a stacked row keeps its `inUse` |
| `armor[i].worn` | the piece is on; one per slot | engine setWorn ~2291 | also turns its modifiers on. Not scrapped (the precedent at ~1555) |
| SCHEMA §2's armor and gear comments | "worn: the one body piece that rolls PROT" | SCHEMA ~980, ~936 | worn also turns a piece's modifiers on; the gear row's `inUse` (S) |
| W69's Plan line | "L1, L3 and L7" | WISHLIST ~281 | L3's order linked |
| `meta.schemaVersion` | "0.29" | engine `SCHEMA_VERSION`; 29 literals in 25 tests; docs | S |

**The three questions, answered by grep:**
- **Which guards read a value this changes?** The schema literal (29 occurrences in 25 tests: 26 in engine, 2 in hostile, 1 in smoke-sheet-play; the prototype's whole break list) and `docs.test.mjs`'s versions check. The key guard (Decision 135): `class` and `weaponBonus` are new names, so they fail until read; `to`, `feature`, `amount` and `melee` pass already (pre-flight), so L3 3–5 prove they're read. No test walks armor or equipment `grants` today (`grep -n "grants" tests/*.mjs`): the R6 sweep (~228) and the painLevel guard (~7546) read advantages, disadvantages and Majors only. L3 4 adds the walk.
- **Where does each new number or line render?** A Skill's check: Skills, Main's Combat skills, print, the wizard's review (no gear before lock), and every attack and maneuver that reads `checkBonus` (~699, ~5158). A weapon's ACC and damage: Loadout, Main, print. The In use state: Loadout's gear row and print's gear rows. Each is a row above.
- **What text points at what this changes?** SCHEMA §2's armor comment ("the one body piece that rolls PROT"), W69's own text ("a bonus it prints is text the player applies by hand"), and the decks' `notes` ("+2 Interface"), which stay: they're the book's line, and the computed part now agrees with them. `grep -rniE "applies by hand|in use|worn piece" src docs/SCHEMA.md` found no player-facing string that says a worn piece does nothing.

## 6. Read first

- `CLAUDE.md`: constraints 6, 7, 8 and 10; *Versions* (character schema, game data); *Change tiers* (Rule or shape); *Decisions*; *Flags*.
- SCHEMA §2's `gear` and `armor` comments (~936–988); Decisions 100 (one worn piece per slot), 120 (a line's mods), 233 and 237 (a `grants` row on a Skill's check), 247 (a custom weapon's picks).
- `src/engine/engine.js`: `grantSources` (~240) and `traitRows` (~1020), `skillLine` (~1116), `weaponLine` (~1830) and `customWeaponLine` (~1796), `weaponDefLine` (~2075), `addLoadout` and `addGearEntry` (~2144, ~2221), `setWorn` (~2291), `migrate`'s gear step (~4759).
- `src/ui/sheet.js`: `skillRowPair` (~355), `gearRowsHtml` (~1975), `weaponRowsHtml` (~2097), `armorRowHtml` (~2150), `pWeaponRows` and `pGearRows` (~2738, ~2752), the `data-worn` handler (~3999, the pattern for a toggle that commits).
- `reference/rulings-2026-10-10.md` Q12–Q16, and `0460`'s rows for the seven entries.

## 7. Out of scope

- **No stat modifiers and no power modifiers.** Q12's stat reach and Q15's "past 10" are L7's (Powered Armor). No catalog entry L3 reads carries either.
- **No Powered Armor** (L7) and **no vehicles** (L6).
- **No custom-row modifiers** (LQ6). A written-in weapon still receives a class bonus through its type and damage type (L2), never a feature bonus: its `features` is text (L2 §7).
- **No new source beyond worn armor and gear in use.** Advantages and Majors that would carry a `weaponBonus` are L5's (W136), which reuses this one.
- **No change to the catalog picker's line** (`catalogLine`), and **no change to `notes` text**.
- **No class on the hit.** `resolveHit` keeps reading the hit modal's damage type; L3's class is the attacking weapon's.
- **Natural weapons** (claws, fangs, the archetype's `archetypeWeapons` line ~699) aren't `weaponLine`s and take no bonus here: L4.
- **Not the timed consumables** (LQ7), the maintenance kits or ammunition.

## 8. The shapes

**Data** (`gamedataVersion` 0.50):

```js
// equipment
{ "id": "smart-deck-i",   …, "grants": [{ "type": "checkMod", "skills": ["interface"], "amount": 1 }] },
{ "id": "smart-deck-ii",  …, "grants": [{ "type": "checkMod", "skills": ["interface"], "amount": 2 }] },
{ "id": "smart-deck-iii", …, "grants": [{ "type": "checkMod", "skills": ["interface"], "amount": 3 }] },
// armor
{ "id": "smartlink-gloves", …, "grants": [{ "type": "weaponBonus", "to": "acc", "amount": 2, "feature": "SMART Link" }] },
{ "id": "hacking-visor", …, "flagged": true, "flagNote": "F‑N: …", "playerNote": "…" },   // and hacking-gloves, precisiongrip-gloves
// skills (LQ19: a weapon is melee when the Skill it attacks with is)
{ "id": "melee", "melee": true, "name": "Melee", … },
{ "id": "martial-arts", "melee": true, … },
```

A `weaponBonus` is `{ type: "weaponBonus", to: "acc" | "damage", amount: <whole number ≥ 1>, class?: "melee" | "ranged" | "kinetic" | "energy", feature?: <a string a catalog weapon's features carries> }`. It needs a `class` or a `feature`; with both, a weapon must match both. One with neither, an unknown `class` or `to`, or an amount that isn't a whole number ≥ 1 reaches nothing. A worn or in-use `checkMod` with an amount below 1 is skipped the same way (W69: never negative). The comment above `skills` gains a line: `melee` marks a Skill whose weapons are melee ones (a grenade's is Melee, LQ19), and a weapon attacking with any other Skill is ranged. The comments above `armor` and `equipment` gain one saying `grants` apply while worn or in use (Decision N).

**The saved row** (character schema S):

```js
{ id: "smart-deck-ii", qty: 1, notes: "", inUse: true }   // inUse: true, or absent. Never false on disk
```

**`migrate()`** (the gear step, ~4759): on a catalog row, `inUse` stays only when it's exactly `true`, and is deleted otherwise. On a custom row and on a part-used magazine it's deleted. Running it twice changes nothing.

**Engine** (exported as named):
- `wornGrants(ch) → [{ def, rank: 1, from: "armor" | "gear", index }]`: catalog armor with `worn === true` and not `scrapped`, and catalog gear rows with `inUse === true`, whose entry has a `grants` array. Total: junk rows are skipped. Not exported; `traitRows` and `weaponLine` read it.
- `traitRows(ch)` reads `[...grantSources(ch, true), ...wornGrants(ch)]`. A worn source has no `kind`, so a `skillsFromPick` row on gear reads as none.
- `weaponClass(ch, index) → { melee, damageClass } | null`. `melee` is its Skill's `melee === true`: a catalog weapon's own `skill`, a custom row's type's `skill` (L2). It's `false` for a known Skill without the flag, and `null` with no Skill (a custom row with no type). `damageClass` is `kinetic` or `energy`, from `damageTypes[].resClass`: a custom row's `damageType` id (L2); a catalog weapon's `damageType` read as a `damageTypes` **name**, or, when that names none ("Normal"), each word of its `style` split on "/", if every word names a type of one class. Anything else is `null`. Null for a row that isn't there.
- `weaponLine(ch, index)`, catalog and custom: after mods, each worn or in-use `weaponBonus` that reaches the weapon adds its amount to `acc` (a `null` acc becomes the amount) or, for `damage`, to a numeric `damage` (a text damage is left as text). Every one that reaches it is listed in `bonuses: [{ to, amount, from }]`, `from` the item's name; `bonuses` is `[]` when none does. A custom row matches by `class` only: its `features` never match.
- `setInUse(ch, index, on) → { ok: true } | { ok: false, why }`. It refuses a row that isn't on the sheet, a custom row, and a row whose entry has no `grants` ("Nothing on this works by being in use."). `on` true writes `inUse: true`; false deletes the key. A refusal writes nothing.

## 9. The UI

**A gear row** (catalog, its entry with `grants`): an **In use** toggle beside its count, and while it's on, a sub line saying what it adds ("+2 Interface"). A row whose entry has no `grants` has no toggle. Custom rows are unchanged.

**An armor card**: while the piece is worn and not scrapped, a sub line saying what it adds ("+2 ACC on SMART Link weapons"); unworn, the same line reads as what it would add, dimmed, so the player sees why to put it on (drafted: "Worn: +2 ACC on SMART Link weapons"). A flagged piece shows `flagHtml(def)` (its `playerNote`) on its own card, worn or not.

**A Skill's row** needs no change: the deck shows as a part ("+2 SMART Deck II"), and the Rank column and "untrained" stay as they are (LQ22).

**A weapon's row** on Loadout: the ACC cell's total includes the bonus, and a sub line names it ("+2 from SMARTLink Gloves"), as a mod's damage does ("+N from mods"). Main and print show the total only.

**Print's gear row**: "in use" joins its type column while it's on.

**Where things land:**

| Press | What's stored | Audit line (drafted) | Where focus goes |
|---|---|---|---|
| In use, turned on | `gear[i].inUse = true` | `Using SMART Deck II` | stays on the toggle (L3 9 asserts it) |
| In use, turned off | `inUse` deleted | `Put away SMART Deck II` | stays on the toggle (L3 9) |
| Worn, on or off | `armor[i].worn`, as today | `Put on` / `Took off` …, as today | as today |
| Undo of either | the row as it was | — | as the undo toast does today |
| `setInUse` refused (a hand-edited page) | nothing | — | a notice with the `why`; the toggle shows the stored state again |

A toggle is a checkbox, so it has no bad text value; a refusal can only come from a row the engine rejects.

All new copy is drafted for a voice pass: the toggle's label, the two sub lines' patterns ("+N <Skill>", "+N ACC on <feature> weapons", "+N damage on energy weapons" for a class), "Worn:" on an unworn card, the audit lines, `setInUse`'s refusal, and the three `playerNote`s (drafted: *The book gives +5 to "electronic interface and hacking checks" and doesn't say which Skills those are. Your GM rules which checks it adds to.*, with +2 and "precision skill checks" for the other two).

## 10. Worked examples, as named tests

The character for L3 1–3 and L3 9–10: `lockedCharacter()`-like, every stat 5 and TECH 8 (so Interface's Synergy is non-zero when trained), Handguns rank 3. "Before" numbers are read from `skillLine` and `weaponLine` on `main` in the test itself, never typed here. Write these first and show each failing on `main`, or say why it passes there.

| Test (file) | Pins |
|---|---|
| `L3 1 (engine): a Smart Deck in use adds to Interface's check, an untrained one without its Synergy, and its rank, price and caps don't move` (`engine.test.mjs`) | For each deck: carried, Interface's `checkBonus` equals the bare one; in use, bare + the deck's amount; put away, bare again. Untrained (rank 0): + amount, `trained` false, `rank` 0, `breakdown.synergy` unchanged. Trained (rank 2): + amount, `rank` 2. With the deck in use, `ipCost`, `canBoost`, `skillRankCap` and `checkPrereqs` on a rank-1 Interface requirement return what they return with it put away (LQ22). `breakdown.traitParts` names the deck. On `main`, `setInUse` doesn't exist |
| `L3 2 (engine): worn and in-use modifiers stack, and a row counts once however many it holds` (`engine.test.mjs`) | Decks I and III in use: + 4 (LQ21). One row of two SMART Deck IIs (added twice, qty 2) in use: + 2 |
| `L3 3 (engine): SMARTLink Gloves worn add 2 ACC to every SMART Link weapon and to nothing else` (`engine.test.mjs`) | Computed over `D.weapons`: carried, each weapon whose `features` include "SMART Link" has `acc` = its `main` acc + 2 (a null acc reads 2) and `bonuses` `[{ to:"acc", amount:2, from:"SMARTLink Gloves" }]`; every other weapon's line equals its line without the gloves. Gloves unworn (`setWorn` false), or worn and `scrapped`: no change. A custom weapon with `features: "SMART Link"` typed: no change. The book: 0460's row says +2 (L3 3b) |
| `L3 3b (rules): CRB 0460: the decks' Interface and the SMARTLink Gloves' ACC are the book's` (`rules.test.mjs`) | Parsed from `0460_Gear.md`'s rows: SMART Deck I/II/III "+1/+2/+3 Interface" equal the data's `checkMod` amounts on `interface`; SMARTLink Gloves' "+2 ACC" equals its `weaponBonus`; and the three LQ4 rows still read "+5"/"+2 to electronic interface and hacking checks" and "+2 to precision skill checks" (if the book names the Skills, F‑N can close: the test says so) |
| `L3 4 (engine): a weapon's class is read from the data, for catalog and custom weapons alike` (`engine.test.mjs`) | Computed over the data, never from §8's list: for each catalog weapon, `damageClass` is the `resClass` of the damage type its word names, else of its style's words, else null; `melee` is its Skill's flag. Spot pins: Cheapshot ranged kinetic; a Normal Blade weapon melee kinetic; an Electric melee weapon melee energy (Q14); a beam weapon ranged energy; the Burning heavy weapon energy (Q14); a grenade **melee** (LQ19) with damageClass null (F48). Custom: Handguns + ballistic ranged kinetic; Melee + burning melee energy; Grenades melee (its type's Skill is Melee); no picks `{ melee:null, damageClass:null }`. And every armor and equipment `grants` row in the data is a `checkMod` on real Skills or a well-formed `weaponBonus` whose `feature` some catalog weapon carries (the walk the R6 sweep lacks) |
| `L3 5 (engine): a class modifier reaches every weapon of its class, catalog and custom` (`engine.test.mjs`) | A fixture (`withData` on the SMARTLink Gloves' `grants`): `{ to:"damage", amount:2, class:"energy" }` worn. Every weapon whose `weaponClass` is energy, catalog and custom (a Melee row with `damageType: "burning"`), has a numeric damage + 2, or keeps its text with the bonus in `bonuses`; every other weapon is unchanged. Then `class: "melee"` + `to: "acc"`: it reaches every weapon whose Skill is Melee or Martial Arts, the 8 grenades and a custom Grenades row included (LQ19), and no other. Then `class: "ranged"`: no grenade |
| `L3 6 (engine): junk in a modifier or in inUse reaches nothing, from a file and from a call` (`engine.test.mjs`) | `migrate()`: `inUse` of `"true"`, 1, `false`, `{}` is gone; `inUse: true` on a custom row and on a part-used magazine is gone; a second migrate changes nothing. Fixture grants with `amount` −2, 1.5, 0, `"2"`; `to: "rof"`; `class: "plasma"`; neither `class` nor `feature`: no line or check moves. `setInUse` refuses a custom row, a row whose entry has no `grants`, index −1 and 99, and a non-object row, writing nothing. `weaponLine`, `weaponClass` and `skillLine` never throw on any of them |
| `L3 7 (engine): with nothing worn or in use, no weapon's line and no Skill's check moves` (`engine.test.mjs`) | A fixture captured on `main` **before** the engine changes (`tests/l3-lines.json`): every catalog weapon's carried `weaponLine` and every Skill's `skillLine` (rank 0 and rank 3), for stats 3, 5 and 8, with no armor and no gear. The branch's match it exactly, `bonuses` aside (it's new, and `[]`). Deleted with its fixture at close-out (§12, step 8), once the PR shows it passing |
| `L3 8 (engine): migrate to S keeps inUse only where it's true on a catalog row, and adds nothing` (`engine.test.mjs`) | A 0.29 file with a deck row, a custom gear row and a magazine: after `migrate()` the schema is S and no row has `inUse`. With `inUse: true` on the deck: kept. `migrate(migrate(x))` deep-equals `migrate(x)` |
| `L3 9 (sheet): a gear row with modifiers has an In use toggle, and turning it on is one undoable action that moves Interface's check` (`smoke-sheet-play.test.mjs`) | **Its own row** (found by its name): the toggle is in it; a row without modifiers (the SMART Brace) has none. Toggling on: one audit entry naming the deck, `inUse` stored, **focus on the toggle**, the row's sub line "+2 Interface", and the Skills tab's Interface row's check is + 2 with "+2 SMART Deck II" in its parts. Undo: no `inUse`, the check back. Toggling off: focus stays, one entry |
| `L3 10 (sheet): SMARTLink Gloves worn raise a SMART Link weapon's ACC on Loadout, Main and print, and say so on their card` (`smoke-sheet-play.test.mjs`) | The gloves' **own card** says "+2 ACC on SMART Link weapons". The AP-7's Loadout row's ACC is its base + 2 with "+2 from SMARTLink Gloves" in **that row**; the Cheapshot's row beside it unchanged. Main's AP-7 row and `pWeaponRows` show the same total. Took off: back, and the card's line reads as unworn |
| `L3 11 (sheet): a flagged piece says the GM rules it, on its own card, and moves no number` (`smoke-sheet-play.test.mjs`) | The Hacking Visor worn: its card holds its `playerNote`; the next card doesn't; no Skill's check differs from the visor unworn |

## 11. Tests beyond the examples

- **Mutation-test** each guard against the fixed code, recording the output in the PR. Each must fail:
  - L3 1: add the worn amount to `rank` instead of the check (an untrained Interface then takes its Synergy, and `ipCost` moves).
  - L3 1 and 9: read gear rows regardless of `inUse` (carried counts).
  - L3 3: match a `weaponBonus` feature by substring (`includes` on the joined text), or apply it to every ranged weapon.
  - L3 3: let a scrapped piece's grants through. Check for a second path first: does `armorPiece` or `armorState` already drop a scrapped piece? If it does, say so, and the mutant must beat both.
  - L3 4: map "Normal" to kinetic by a code word instead of the style; then break the style split (Blade/Blunt reads null). Each must fail on a computed weapon.
  - L3 5: apply a class bonus to custom rows by `features`, or skip custom rows.
  - L3 4 and 5: read `melee` from the weapon type's id (`melee`, `martialArts`) instead of the Skill. The grenades turn ranged, and each must fail on them (LQ19).
  - L3 6: drop the `amount ≥ 1` check (−2 reaches a line).
  - L3 9: commit the toggle without `setInUse`; draw the toggle on the next row (the off-row mutant L1 missed); re-render without keeping focus.
  - L3 10: draw the "+2 from…" sub line on the next weapon's row.
- **Hostile:** `hostile.test.mjs`'s gear gains `inUse` junk on every row kind, and an armor row with a `grants`-bearing id worn and `scrapped: "yes"`. The rendered page holds no injected markup, and no line throws.
- **Totality:** the engine's totality sweep (constraint 8) covers `setInUse` and `weaponClass` with bad indexes and non-object rows.
- **Round trip:** L3 8.
- **Voice:** `npm test` covers the new strings; the reviewer runs the voice pass (§14).

## 12. Steps

1. `git submodule update --init private`, `npm ci`, `npm run test:fast` (a fresh branch from `main`).
2. **Capture L3 7's fixture on unchanged code,** and commit it alone. Then write L3 1–11 and 3b and show them failing on `main` (L3 7 passes there by design: say so).
3. **The data:** the decks' and gloves' `grants`, the three flags (by the `close-a-flag` skill: data, SCHEMA §5, INDEX §2), `melee` on the two Skills, the comments, `gamedataVersion` 0.50. `npm run verify`: the key guard fails on `class`/`weaponBonus` only if a fixture names them before step 4, which is fine to leave until step 4.
4. **The engine:** `wornGrants`, `traitRows`' sources, `weaponClass`, `weaponLine`'s bonuses, `setInUse`, `migrate()`'s step, `SCHEMA_VERSION` S and the 29 schema literals in 25 tests (L2 6's included: its "migrate to 0.29" result moves to S; its old file stays 0.28). `npm run verify`.
5. **The UI:** the gear row's toggle and sub line, the armor card's line and flag, the weapon row's sub line, print's gear rows, the toggle's handler. `npm run verify`.
6. **The dev preview** (`shadows-dev-preview`; seed `shadows.active.v1` with a locked character carrying SMART Deck II and III, the SMARTLink Gloves, the Hacking Visor, an AP-7, a Cheapshot and a written-in weapon; then Open sheet). Toggle In use on and off and undo; check Skills' Interface row; put the gloves on and off; read the AP-7 on Loadout, Main and Print; open the catalog picker (the AP-7's line there is unchanged). Then the gear row and an armor card at 375 px. Screenshots if the tool draws. If it times out, paste the DOM reads and the phone-width metrics (`scrollWidth` against `clientWidth`, no element in `main` past the right edge) into the PR.
7. **Mutation tests** (§11), each recorded in the PR with its output.
8. **Close-out** (§14). Delete L3 7's test and `tests/l3-lines.json` in the close-out commit, and name in the PR the commit where they last passed.

## 13. Stop and ask

**Stop** if:
- A catalog weapon's line or a Skill's check moves in L3 7 with nothing worn or in use.
- A catalog weapon whose `damageType` is "Normal" has no `style`, or a style word that isn't a `damageTypes` name. The data has moved since this pre-flight.
- 0460's rows for the decks or the SMARTLink Gloves don't read as the pre-flight quotes (L3 3b). Don't edit the data to fit.
- A reader of `armor[i].worn`, a gear row or `skillLine().rank` turns up that §5 doesn't list, in `src/` or in GM mode.
- Any armor or equipment entry already has a `grants` key, or any Skill a `melee` key, when you start.
- Making `traitRows` read worn sources changes what `traitGrants`, `naturalArmor` or `grants()` return for any character (they must not see gear).

**Not a stop** (expected):
- The schema literal `"0.29"` failing in 25 tests (29 occurrences) and in `docs.test.mjs`: the prototype's whole break list. Update each to S, except a test's own old file that says an older version on purpose.
- The version literals the bumps move (`APP_VERSION`, `package.json`, `package-lock.json`, `README.md`, `STATE.md`, `meta.gamedataVersion`).
- `npm run changelog` regenerating `src/data/shadows-changelog.js`.
- L3 7 passing on `main`.
- The key guard passing `to`, `feature`, `amount` and `melee` before any reader of the new meaning exists. L3 3–5 prove they're read.
- `docs.test.mjs` failing on F‑N until its SCHEMA §5 row, INDEX §2 line and data `flagged` are all in (the `close-a-flag` skill's three edits land together).

## 14. Close-out

- **`CHANGELOG.md`**, under `## [Unreleased] — app 0.56.0`, in player voice, naming no list. Drafted for the voice pass:
  - "**Gear you wear or use now counts.** Put on SMARTLink Gloves and your SMART Link guns show the extra ACC. Mark a SMART Deck as in use and Interface goes up by what it gives."
  Then `npm run changelog`.
- **Versions:** `npm run bump -- 0.56.0`; `gamedataVersion` 0.50; `SCHEMA_VERSION` S.
- **Docs:**
  - SCHEMA §4: Decision N. INDEX §3: N's line. F‑N: SCHEMA §5's row and INDEX §2's line (with the data's `flagged`).
  - SCHEMA §2's `armor` and `gear` comments.
  - The plan's L3 row status (Merged, with the PR and versions); §6's *For L3's flag* bullet names F‑N. W69's Plan line: L3 built, L7 left (W69 stays open for L7).
  - A `docs/log/2026.md` entry, a `docs/log/shipped.md` row, and STATE rewritten (versions; L3 done, L4 next).
- **PR title:** `L3: worn armor and gear in use carry modifiers: a Skill's check, a weapon's ACC or damage (W69; Decision N)`.
- **PR body:** the template's sections, including **Where the order didn't fit**. Paste every new string as it renders: the toggle's label, the sub lines, "Worn:", the audit lines, the refusal, the three `playerNote`s and the changelog line.

**Review checklist** (the reviewer, beyond the tests passing):
- L3 4's class and grants walks compute from the data, not from §8's lists.
- L3 7's fixture commit precedes every engine and data commit and touches only the fixture. The PR names the commit where L3 7 last passed before its deletion.
- Every mutant in §11 was run and killed, with its output in the PR, including both off-row mutants.
- Every row in §5's sweep is built, and a fresh grep of the readers (`\.worn\b`, `inUse`, `traitRows(`, `grantSources(`, `\.acc\b`, `l\.damage\b`, `skillLine(` … `.rank`) finds none it missed.
- `traitGrants`, `naturalArmor` and `grants()` don't see gear (the stop's check, by a probe).
- No catalog weapon's display changed with nothing worn: open the catalog picker and a carried catalog weapon in the preview.
- A file saved before S opens with nothing in use, and saving it again keeps that.
- The toggle commits through `setInUse`, and an undo restores the check.
- Constraint 9: no decision number, flag id, LQ or W id in any rendered string, the `playerNote`s included.
- The voice pass on every new string, drafted side by side **inline in the message to the conductor**.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md` (*The prompts*), with `<plan>/<order>` = `loadout-and-gear/L3-worn-modifiers.md` and `<id>` = **L3**, plus these traps:

- **The bonus goes in the check, never the rank.** `skillLine` gives a Skill its Synergy when `rank > 0`, so a worn rank put into `rank` would make an untrained Interface trained, and move its IP price and caps. Add it as a `traitParts` entry through `traitRows`, as a trait's `checkMod` is (Decision 233).
- **`grantSources` stays as it is.** `traitGrants` and `naturalArmor` read it too, and gear must reach only a Skill's row and a weapon's line. `traitRows` reads `wornGrants` beside it.
- **A catalog weapon's damage type is a word; a custom row's is an id.** "Ballistic" is a `damageTypes` *name*; `"ballistic"` is an *id*. "Normal" names no type: read the weapon's `style` instead, whose words (Blade, Blunt) do. Never write "Normal" in code.
- **The key guard sees two of the new names.** `class` and `weaponBonus` are new; `to`, `feature`, `amount` and `melee` are already read elsewhere (the hit modal's `melee`), so the guard passes them before your reader exists. L3 3–5 are the proof.
- **A grenade is a melee weapon** (Ken, LQ19), because its Skill is Melee. The flag is on the Skill, so no grenade, type or custom row needs one of its own. Don't put `melee` on `weaponCategories`.
- **A stacked row is one row.** Two SMART Deck IIs are one row with qty 2; its In use counts once.
- **Buying armor wears it** when its slot is free (`addLoadout`). So adding the gloves turns their bonus on at once: that's today's behaviour, not a bug.
- **A custom weapon's `features` is text.** A feature bonus never reaches one; a class bonus does, through its type and damage type (L2).
- **Capture L3 7's fixture first,** in its own commit, before any data or engine edit.
