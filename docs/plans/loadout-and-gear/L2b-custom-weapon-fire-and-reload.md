# Work order L2b: Custom weapons pick their fire modes and reload from carried ammo

**Plan:** [`../loadout-and-gear.md`](../loadout-and-gear.md) §3, row L2b. **Wish:** [W109](../../WISHLIST.md), the part about a written-in weapon (a custom row doing what a book row does). **Ken, 2026-10-28, to the conductor:** "I noticed that custom weapon rows don't let me choose the types of firing modes for ammo-using weapons (S, B, F). Also, a bug: when reloading a weapon, the ammo is not being reduced. … we should fold it into the next work order in this plan." Ken confirmed that the reload was a **written-in** weapon's, and chose a new order, L2b, ahead of L4. **It reopens LQ14** ("Not in L2… Ken, 2026-10-24: Default"), which Decision 247's *Revisit if* names. Decisions 120, 145, 149, 222, 247.

**Status: drafted 2026-10-28 by Claude (Opus), L3's reviewer, as the plan's orchestrator. Approved by Ken 2026-10-28 ("Approve it").** Ken answered LQ23–LQ28 on 2026-10-28 (§4), Default on each, recorded on PR #258 (comment 6484215080). Ready for **L2b build**, in a fresh session.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md): **L2b build** (Sonnet), then a fresh **L2b review** (Opus) once the PR is open.

**Carried over from L3** (PR #257):
- **The order's misses.**
  - **A twin reader the sweep didn't list.** L3's §5 listed every reader of `l.acc` that *draws* a line, and missed one that *edits* it. A written-in weapon's open row filled its ACC field from `l.acc`, which L3 made bonus-inclusive. With a class bonus worn, a stored ACC 1 opened as 3, and editing the field would save the bonus into the file (review `113dff8`, L3 12). **Here, §5 lists every reader of each line field this order changes, edit rows included** (`l.rof`, `l.fireModes`, `l.reloadFrom`, `l.loaded`, the raw `w.rof` and `w.ammo`). §11 makes the open row's controls a mutant.
  - **A mutant no data could kill.** L3's §11 listed "Normal read as kinetic by a code word" as a mutant that "must fail on a computed weapon". No catalog weapon could kill it, so the builder called it equivalent; the review killed it with a `withData` fixture (`b6631dc`). **Here, every mutant in §11 says what kills it, and where the data has no case, the test builds one.**
- **The build's misses.** The builder called that mutant equivalent instead of building the fixture, and drew a scrapped piece's bonus line as working (the review fixed both, `b6631dc`). The PR body was a model again (every mutant's output, the DOM reads, *Where the order didn't fit*): keep it.
- **From the conductor.** The voice pass ran as drafted, side by side in the reviewer's message to the conductor, and Ken took every pick (PR #257, comment 6483407208). Keep it.

**Pre-flight against `main` at `1ba6454`** (#257 merged; app 0.56.0 under `[Unreleased]`, game data 0.50, character schema 0.30; the highest decision is 248, so **N** is 249 today; the highest flag is F49, and this order opens none; schema **S** is 0.31 today).

```
The bug, as Ken saw it   Probe: a written-in Zip gun (handguns, capacity "15", rof "S/B", roundsSpent 5) and 2 Handgun Rounds carried.
                           weaponLine: rounds 10/15, fireModes [S, B], NO reloadFrom
                           reloadWeapon: { ok, left 15, kept null }; Handgun Rounds still 2. A free reload
                         The same carry with a catalog Cheapshot (spent 3): reloadFrom says Handgun Rounds, 1 carried; Reload
                           takes the mag (2 → 1 when two are carried) and keeps the old one as a part-used mag of 4 (P9b)
Why                      reloadSource ~2018: ammoFor(e && !e.custom && e.id ? weaponDefById(e.id) : null, …), so a custom row
                           gets null and `if (!src){ e.roundsSpent = 0; return done; }` (~2060) fills it from nothing. This is
                           L2's LQ14 as decided, and Decision 145 says so: "A weapon nothing fits reloads as before: launchers,
                           the belt-fed guns … and custom weapons"
                         putBack ~2111 has the same twin: its standard kind is ammoFor(weaponDefById(e.id), []), null for a
                           custom row, so a part-used magazine out of a written-in gun would vanish if only reloadSource changed
                         ammoFor ~2009 matches `reload.categories` against `def.category` OR `reload.weapons` against `def.id`.
                           A typed custom row has a category and no id, so { category } is all it needs. needsMod rounds (Angel)
                           need a mod; a custom weapon has none (Decision 120), so they never fit. firesOnly comes from mods: none
The ammo                 equipment with `reload` (data, script): handgun-rounds (handguns), smg-rounds (smgs), rifle-rounds
                           (urbanRifles, sniperRifles), shotgun-shells (shotguns, a round at a time), power-cell (the four beam
                           types, "shot"), silver-rounds (handguns, urbanRifles, sniperRifles; specialty), holy-points (handguns;
                           specialty), angel-rounds (four types; specialty, needsMod "Angel Mod"). Nothing fits melee,
                           martialArts, grenades, heavyWeapons or archery, so those types reload as a launcher does
`loaded` on a custom row migrate ~4889: `if (w.custom || typeof w.loaded!=="string") delete w.loaded;`. A written-in handgun that
                           took Silver Rounds would lose them on the next open. The line's `loaded` (~1947) is catalog-only too
Fire modes today         A custom row's `rof` is a text cell (shared.js WEAPON_COLS ~1073). fireModesOf ~1981 splits it on
                           anything that isn't a letter and keeps rofModes ids. Probe: "S" → S; "S/B/F" → S B F; "s/b" → S B;
                           "S,F" → S F; "Semi", "3", "SB", "Continuous", "" → none (one "−1" Fire button). So "S/B" typed
                           already works; nothing says so, and nothing offers the three
weaponRules.rofModes     data ~4145: S Single 1, B Burst 3, F Full Auto 10. The catalog's rof is S 12, S/B 11, S/B/F 10,
                           "Continuous" 1, none 20. Decision 120: "A custom weapon's typed capacity and RoF count the same way"
Without a capacity       Probe (capacity ""): rounds null, fireModes [S, B]; fireWeapon refuses ("doesn't track rounds"). No
                           buttons draw: roundsHtml ~2022 shows the capacity text
Readers (grep)           engine: customWeaponLine ~1834 (rof: customText(e.rof)), weaponLine ~1923 (fireModes: fireModesOf(e.rof);
                           no loaded, no reloadFrom), fireWeapon ~1991, reloadSource ~2018, reloadWeapon ~2051, putBack ~2111,
                           addCustomLoadout ~2369 (writes rof: ""), migrate ~4879/~4889
                         sheet.js: Main's Weapons ~464 (l.rof; roundsHtml(l, w.capacity); raw w.ammo), Loadout's folded custom
                           row ~2129–2130 (l.rof; roundsHtml; raw t("ammo")), the open row weaponOpenRowHtml ~2086 (WEAPON_COLS
                           text cells, rof among them; roundsHtml(l, "")), roundsHtml ~2022 (l.fireModes, l.reloadFrom, l.loaded),
                           reloadTitle ~2034, reloadChooser ~2047, the data-reload handler ~4055 (noAmmo → "Reload anyway?",
                           choose → the chooser), the data-weaponpick handler ~4027, print pWeaponRows ~2751 (RAW w.rof, not l.rof:
                           a twin), ~2752 (raw w.capacity, w.ammo)
                         gm.js, wizard.js, app.js: none
Text that points at it   Decision 145 ("… and custom weapons" reload as before); Decision 120 ("typed capacity and RoF"); Decision
                           222 ("a catalog weapon that ammo fits"); Decision 247's Revisit if (LQ14); SCHEMA §2's weapons comment
                           (~969: "and any on a custom weapon"; ~978: the row's shape); engine comments ~2003 ("A weapon nothing
                           fits (… a custom weapon) reloads as it always did"), ~4887; engine.test ~2202 ("Nothing in the ammo
                           table fits a launcher or a custom weapon"); WISHLIST W109's Plan line. reloadTitle's "Fill the
                           magazine" stays true for a weapon nothing fits
Prototype                The engine half on a scratch copy of 1ba6454 (no UI): SCHEMA_VERSION 0.31; `rofModes` in CUSTOM_WEAPON_PICKS
                           and customWeaponPick; the custom line's rof and fireModes from it; one helper for loaded/reloadFrom on
                           both paths; ammoDefOf in reloadSource and putBack; the no-source put-back; migrate keeping a custom
                           `loaded`. Probe: the typed Zip gun's reloadFrom says Handgun Rounds, 2 carried; Reload takes one
                           (2 → 1) and keeps a part-used mag of 10. npm test: 1366 pass, 28 fail:
                           - 27 are the schema literal "0.30" → "0.31": 24 in engine.test (27 occurrences), 2 in hostile.test,
                             1 in smoke-sheet-play, and docs.test's versions check
                           - 1 encodes the rule this order changes: engine.test ~2256, "W40: migrate() keeps a loaded round's id
                             and drops anything else (schema 0.14)", whose third case is a custom row's `loaded` dropped. It now
                             stays (LQ25): update the case and the test's name, and cite Decision N
                           No test types into a custom row's `rof` cell: W70's tests find rows by their name cell only (~1268–1341)
```

---

## 1. Goal and Done when

**Goal.** A written-in gun works like a catalog one at the table. You tick which fire modes it has, and Single, Burst and Full Auto spend its rounds. Reload takes a magazine of the ammunition its weapon type takes from what you carry, and the half-empty one comes back as a part-used magazine. That's the same as a catalog weapon of that type does.

**Done when:**
- A written-in weapon's open row offers **Single, Burst and Full Auto** (from `weaponRules.rofModes`, never a list in code). Each tick or untick is one undoable action, and its fire buttons on Loadout and Main, its RoF on Loadout, Main and print follow the ticks.
- A saved row's typed `rof` keeps working as it does today until a mode is ticked. Nothing in it is lost or guessed (LQ26).
- A written-in weapon **with a weapon type** reloads from carried ammunition whose `reload.categories` includes that type: one magazine, or a shell a round, off the carried row. A part-used magazine comes back as one, the chooser asks when two kinds fit, and with none carried it asks "Reload anyway?". That is Decisions 145, 149 and 222, applied as they are to a catalog weapon of that type.
- A written-in weapon with **no type**, or a type nothing fits (melee, martial arts, grenades, heavy weapons, archery), reloads as it does today (LQ24).
- Silver Rounds and Holy Points load into a written-in gun of a type they fit, and stay loaded across a save (LQ25). Angel Rounds never do: they need a mod, and a written-in weapon takes none (Decision 120).
- No catalog weapon's line, fire, or reload moves (L2b 8's diff).

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** A save-file shape changes (`rofModes` on a custom row; `loaded` kept on one), a reopened decision (LQ14), and a player-facing behaviour someone could have chosen otherwise. One decision (§3), no flag.
- **Character schema:** 0.30 → **S** (0.31 today), with a `migrate()` step (§8). Take the next minor if another branch lands first.
- **Game data:** **no bump.** No data key or value changes (Decision 68: nothing in `shadows-data.js` moves; `rofModes` and every `reload` block are read as they are). If the build finds it must add a data key, that's a stop (§13).
- **App:** a minor, **0.57.0** (`npm run bump -- 0.57.0`), *unless* 0.56.0 is still under `## [Unreleased]` when the build starts. Then the lines join 0.56.0's section and nothing is bumped (it's unreleased today, at the pre-flight).
- **Decision:** the next free number, written **N** here (249 today).

## 3. Decisions

It's drafted at 297 words (`docs.test.mjs` counts by whitespace, against 350), so it fits with *Built* filled; if it must shrink, cut prose, never *Touches*. Paste it into SCHEMA §4 with N and S filled in, add its INDEX §3 line under Loadout, and mark Decisions 120, 145 and 222 as below. Decisions 247 and 149 are extended, not superseded: nothing either decided is reversed (247's *Revisit if* named this; 149's specialty rounds fit "the weapons their standard kind does", and a typed custom row is now one of them).

```
N. **A written-in weapon ticks its fire modes, and one with a weapon type reloads from carried ammunition as a catalog weapon of that type does.**
   *2026-10-28 · Ken + Claude · Touches: customWeaponPick, customWeaponLine, setCustomWeapon, weaponLine, fireModesOf, reloadSource, ammoFor, putBack, reloadWeapon, weapons[i].rofModes, weapons[i].rof, weapons[i].loaded, weapons[i].ammo, weaponRules.rofModes, WEAPON_COLS, reloadFrom, part-used magazine, Reload anyway, Loadout's custom weapon row, Main's Weapons, the print sheet's weapons, character schema S, W109, LQ14, LQ23–LQ28*
   - **Decided:** A written-in weapon stores its fire modes as `rofModes` (`weaponRules.rofModes` ids), ticked on its open row, one audited action each; a row from before keeps its typed `rof` until a tick. One with a weapon type reloads from carried ammunition whose `reload.categories` names that type, by the catalog's own path: magazines or shells, the chooser, part-used magazines, "Reload anyway?", specialty rounds in `loaded`. Never by a weapon's id, never rounds that need a mod. No type, or one nothing fits, reloads as before. `ammo` stays a note.
   - **Why:** Ken (2026-10-28): a written-in gun's reload didn't spend ammo, and its fire modes couldn't be picked. Its type (247) already says what fits.
   - **Rejected:** a free reload (LQ14's default, reopened by Ken); ticks rewriting `rof` (LQ26: a typed "Semi" is lost); converting a readable `rof` on open (nothing guessed); reading the `ammo` text (LQ27: a guess); refusing Reload without a type (LQ24: old rows stop reloading).
   - **Replaces:** Decisions 145 in part (only an untyped written-in weapon reloads as before), 222 in part (a typed one keeps part-used magazines) and 120 in part (its fire modes are ticked). Extends 247 and 149.
   - **Revisit if:** W109 lets custom rows opt into a book row's behaviour; a written-in weapon takes mods; W108 sizes magazines per weapon.
   - **Built:** app version, character schema S, PR #…, log entry.
```

**The marks** (CLAUDE.md, *Decisions*):
- **Decision 145:** after "A weapon nothing fits reloads as before: launchers, the belt-fed guns (Gear treats Heavy Rounds as unlimited) and custom weapons.", add `→ **Superseded in part by Decision N**: a written-in weapon with a weapon type reloads from what fits that type; one with none still reloads as before.` INDEX: `→ **superseded in part by 149, N**`.
- **Decision 222:** after its *Decided* sentence's "a catalog weapon that ammo fits", add `→ **Superseded in part by Decision N**: a written-in weapon with a type keeps its part-used magazine the same way.` INDEX: `→ **superseded in part by N**`.
- **Decision 120:** after "A custom weapon's typed capacity and RoF count the same way.", add `→ **Superseded in part by Decision N**: a written-in weapon's fire modes are ticked; a typed RoF from before still counts until they are.` INDEX: add N to its "superseded in part by" list.

## 4. Questions for Ken

LQ14 is reopened by Ken's own report (2026-10-28) and isn't asked again: a written-in weapon reloads from carried ammo.

| Id | Question | Default |
|---|---|---|
| LQ23 | What ammunition fits a written-in weapon? | **What fits its weapon type**, read from each ammo entry's `reload.categories` (Handguns: Handgun Rounds, Silver Rounds, Holy Points). Never an entry's `reload.weapons` list: those name catalog guns by id. With none carried it asks "Reload anyway?", as a catalog gun does, and the audit says so **Ken, 2026-10-28: Default** |
| LQ24 | A written-in weapon with **no** type, or a type no ammunition fits (Melee, Martial Arts, Grenades, Heavy Weapons, Archery) | **It reloads as today:** full, from nothing, with no question, as a grenade launcher or a belt-fed gun does (Decision 145). Refusing until a type is picked would stop every row from before L2 reloading mid-session. If it holds Silver Rounds from an earlier type, they come back to your gear first (§8) **Ken, 2026-10-28: Default** |
| LQ25 | Specialty rounds in a written-in gun: Silver Rounds and Holy Points fit Handguns, and Silver Rounds fit Urban and Sniper Rifles. Can a written-in gun of those types load them? | **Yes,** as a catalog gun of the type can. Their tags join its line, and the magazine shows their name (Decision 149). That means `loaded` is kept on a written-in row, which `migrate()` deletes today: part of the schema bump. **Angel Rounds never** fit: they need the Angel Mod, and a written-in weapon takes no mods (Decision 120) **Ken, 2026-10-28: Default (Yes)** |
| LQ26 | How a written-in weapon's fire modes are stored | **A pick of their own, `rofModes`** (ids: `["S", "B"]`), ticked on the open row, as L2's four picks are. The typed `rof` cell leaves the open row (as `type` did in L2). A row from before keeps its typed `rof`, which reads as it does today ("S/B" already gives two buttons), until the first tick replaces it as the source. *The alternative:* keep `rof` as the only store and have the ticks rewrite it as "S/B". That avoids a key, but a typed "Semi" or "3 bursts" gets overwritten on the first tick, and one field holds both a pick and a note **Ken, 2026-10-28: Default (a pick of their own)** |
| LQ27 | The row's free-text **Ammo** field ("9mm", ".38") | **It stays a note,** shown where it's shown today (under the magazine on Loadout, beside it on Main and print). Reload never reads it: matching ".38" to an ammo entry would be a guess, and the type already says what fits **Ken, 2026-10-28: Default** |
| LQ28 | Fire modes on a weapon whose capacity doesn't read (blank, or "belt") | **Ticks are offered anyway,** and RoF shows them. There are no fire buttons until the capacity reads as a number, which is how it is today and how a catalog weapon with no capacity works. No hint: the capacity cell is beside them **Ken, 2026-10-28: Default** |

## 5. The assumption sweep

| What | Today | Where | After |
|---|---|---|---|
| A custom row's stored fields | 7 typed + `roundsSpent` + L2's four picks; `loaded` deleted | engine `addCustomLoadout` ~2369; migrate ~4879, ~4889 | + `rofModes` when ticked; `loaded` kept when it's a string (as on a catalog row). New rows have no `rof` key |
| `customWeaponPick` / `CUSTOM_WEAPON_PICKS` | category, damageType, range, acc | engine ~1825 | + `rofModes`: an array whose every entry is a `rofModes` id, returned in the data's order, deduped; empty or anything else is not real |
| `setCustomWeapon` | the four picks | engine ~1850 | + `rofModes` (an array; `[]` or null clears it). Refusal drafted in §8 |
| `customWeaponLine().rof` | `customText(e.rof)` | engine ~1846 | the picked ids joined "/" ("S/B", as a catalog rof reads), else the typed `rof` as today |
| A custom line's `fireModes` | `fireModesOf(e.rof)` | engine ~1924 | from `rofModes` when picked, else `fireModesOf(e.rof)` as today |
| A custom line's `loaded`, `reloadFrom` | absent | engine ~1923 (catalog: ~1945–1966) | computed as a catalog line's, from the type's ammo (§8). One shared helper for both, so they can't drift |
| `ammoFor`'s weapon | `weaponDefById(e.id)` | engine ~2018 (reloadSource), ~2115 (putBack) | one helper, `ammoDefOf(e)`: a catalog weapon's def, or `{ category }` for a custom row with a real category, else null. Both callers use it (the twin) |
| `reloadWeapon` with no source | `roundsSpent = 0`; `loaded` left | engine ~2060 | the same, but a custom row's `loaded` is put back first (`putBack`) and then deleted (LQ24) |
| `fireWeapon` | reads `l.fireModes` | engine ~1991 | unchanged; it follows the line |
| Main's Weapons, a custom row | `l.rof`; `roundsHtml(l, w.capacity)`; `(w.ammo)` | sheet.js ~464–468 | unchanged code; the RoF cell and buttons follow the line, and Reload's title now says what it takes |
| Loadout's folded custom row | `l.rof`; roundsHtml; ammo sub line | sheet.js ~2129–2130 | unchanged code, as above |
| Loadout's open custom row | WEAPON_COLS text cells incl. `rof`; the four picks | sheet.js ~2086–2099; shared.js ~1073 | WEAPON_COLS without `rof`; + three fire-mode ticks beside the picks, showing the line's `fireModes` (so a typed "S/B" shows two ticked); a hint while a typed `rof` reads as no mode (§9) |
| `roundsHtml`, `reloadTitle`, `reloadChooser`, the Reload handler | read `l.fireModes`, `l.reloadFrom`, `l.loaded`, `pre.noAmmo`, `pre.choose` | sheet.js ~2022, ~2034, ~2047, ~4055 | unchanged code: they now get a custom row's reloadFrom, choose and noAmmo, which they already handle for a catalog one |
| The `data-weaponpick` handler | 4 fields; audit `<name>: <what> → <shown>` | sheet.js ~4027 | the ticks are a new handler (an array, not one select's value), or this one taught `rofModes`. One audited commit per tick either way (§9) |
| Print's weapons, a custom row | **raw `w.rof`** (twin); raw capacity and ammo | sheet.js ~2751–2752 | `l.rof` (so ticks print); capacity and ammo unchanged |
| SCHEMA §2's weapons comment | "any on a custom weapon" dropped; the row's shape | SCHEMA ~969, ~978–981 | `loaded` kept on a typed custom row; `rofModes` (S) |
| Decisions 145, 222, 120 | as quoted (pre-flight) | SCHEMA §4 | marked in part (§3) |
| Code comments | "A weapon nothing fits (… a custom weapon) reloads as it always did" | engine ~2003–2006 | a custom weapon with no type, or a type nothing fits |
| The W30 test's comment | "Nothing in the ammo table fits a launcher or a custom weapon" | engine.test ~2202 | "… a launcher, or a written-in weapon with no type" |
| W109's Plan line | set aside by the plan's §4 | WISHLIST ~544 | L2b takes a written-in weapon's reload and fire modes; the rest stays set aside |
| `meta.schemaVersion` | "0.30" | engine `SCHEMA_VERSION` ~25; the test literals; docs | S |

**The three questions, answered by grep:**
- **Which guards read a value this changes?** The schema literal (the prototype's break list, at the end of the header) and `docs.test.mjs`'s versions check. `hostile.test.mjs`'s L2 test (~1293) gives a custom weapon a payload in every pick: L2b adds `rofModes` and `loaded`. No test pins a custom row's free reload except the W30 test's comment (~2202), which asserts only the launcher. The smoke test at `smoke-sheet-skills.test.mjs` ~483 ("reloaded from nothing without asking") is a catalog rifle: unaffected. The key guard (Decision 135) reads data keys; this order adds none.
- **Where does each new number or line render?** Fire buttons: Loadout and Main (both `roundsHtml`). RoF: Loadout, Main and print (print reads the raw row today: a twin, a row above). Reload's title, the chooser and "Reload anyway?": Loadout and Main. `loaded`'s name: `roundsHtml`. The ticks: the open row only.
- **What text points at what this changes?** Decisions 145, 120 and 222, SCHEMA §2's comment, the engine comment and the W30 test's comment (rows above). `grep -rniE "custom weapon|written-in|from nothing|reloads? (as|for free)" src` finds only the engine comment, and no player-facing string says a written-in weapon reloads free. CHANGELOG's past lines stay as they shipped.

## 6. Read first

- `CLAUDE.md`: constraints 6, 7, 8 and 10; *Versions* (character schema; why game data doesn't move); *Change tiers* (Rule or shape); *Decisions*.
- SCHEMA §2's weapons comment (~960–981); Decisions 120 (rounds, RoF), 145 (Reload from what you carry), 149 (specialty rounds, `loaded`, the chooser), 222 (part-used magazines), 247 (a written-in weapon's picks).
- `src/engine/engine.js`: `customWeaponPick`, `customWeaponLine`, `setCustomWeapon` (~1825–1862), `weaponLine` (~1919, both paths), `roundsOf` and `fireModesOf` (~1974, ~1981), `fireWeapon` (~1991), `ammoFor`, `reloadSource` (~2009, ~2018), `reloadWeapon` (~2051), `putBack` (~2111), `addCustomLoadout` (~2366), `migrate`'s weapons step (~4876–4890).
- `src/ui/sheet.js`: `weaponOpenRowHtml` (~2086), the folded custom row (~2124), Main's Weapons (~456), `roundsHtml`, `reloadTitle`, `reloadChooser` (~2022–2068), the `data-weaponpick` and `data-reload` handlers (~4027, ~4055), `pWeaponRows` (~2746).
- `tests/engine.test.mjs`'s W30 and W40 tests (~2165, ~2209), and P9b's part-used magazine tests (grep `roundsLeft`): what a catalog reload does, which a typed custom row now does too.

## 7. Out of scope

- **No mods on a written-in weapon** (Decision 120), so no Angel Rounds and no `firesOnly`.
- **No reload by `reload.weapons`.** Those lists name catalog guns by id; a written-in weapon matches by its type only.
- **No reading of the `ammo` text** (LQ27), and no change to where it shows.
- **No new fire mode.** "Continuous" (one catalog heavy weapon) isn't in `rofModes`, and the ticks offer exactly `rofModes`. A typed "Continuous" from before stays as text.
- **No conversion of a typed `rof` in `migrate()`** (LQ26). It's read as it is until a tick.
- **No change to a catalog weapon** (L2b 8), to the ammo data, or to `reloadTitle`'s words.
- **No change to what a type means** (Decision 247), and changing a type doesn't empty the magazine: the next Reload takes out what's in it.
- **Not custom armor or gear**, and not W109's other kinds (spells, powers).

## 8. The shapes

**Data:** none. `weaponRules.rofModes` and the `reload` blocks are read as they are.

**The saved row** (character schema S):

```js
{ custom: true, name, damage, capacity, ammo, features, notes, roundsSpent: 0,
  category, damageType, range, acc,          // L2's picks (0.29), unchanged
  rofModes: ["S", "B"],                      // rofModes ids, the data's order; absent until ticked (S)
  loaded: "silver-rounds",                   // a specialty round in the magazine, as on a catalog row; now kept (S)
  rof: "Semi" }                              // only on a row saved before S, or never ticked; never written again
```

**`migrate()`** (the weapons step, ~4876):
- `rofModes` joins `CUSTOM_WEAPON_PICKS`, so the existing loop keeps it only when it's real (an array of known ids, written back in the data's order) and deletes it otherwise.
- `loaded` is kept on a custom row by the same rule as a catalog row (a string), so `if (w.custom || typeof w.loaded!=="string")` becomes `if (typeof w.loaded!=="string")`. A string that isn't a specialty round reads as nothing on the line (`loadsAs`), as on a catalog row today.
- `rof` is untouched (LQ26). Running it twice changes nothing.

**Engine:**
- `customWeaponPick("rofModes", v)`: `v` an array, every entry a `weaponRules.rofModes` id. Returns those ids in the data's order, deduped; `undefined` for an empty array, a non-array, or any entry that isn't one.
- `setCustomWeapon(ch, i, "rofModes", value)`: `[]` or null clears it (deletes the key), as `""` does for the four; an unreal value is refused, writing nothing, with *"Pick from Single, Burst and Full Auto."* (drafted, built from the data's names, not typed in code).
- `customWeaponLine`: `rof` is the picked ids joined "/" when picked, else `customText(e.rof)` as today.
- `weaponLine`, custom path: `fireModes` from the picked ids (through `fireModesOf` of the joined string, or directly) when picked, else `fireModesOf(e.rof)`. Then the same `loaded` and `reloadFrom` the catalog path computes, **from one shared helper** both paths call, so the two can't drift.
- `ammoDefOf(e)` (not exported): a catalog row's `weaponDefById(e.id)`; a custom row with a real `category`, `{ category }`; else null. `reloadSource` and `putBack` both call `ammoFor(ammoDefOf(e), …)`. A custom row has no mods, so `modsOf(e)` is `[]`, and `needsMod` rounds never fit.
- `reloadWeapon`, the no-source path: for a row with a `loaded` round, `putBack` it first (it comes back to gear as a part-used or whole magazine of that kind, Decision 222), then `delete e.loaded`. Otherwise unchanged. For a catalog weapon nothing fits this path can't hold a `loaded`, so it's a no-op there.
- `addCustomLoadout(ch, "weapons")` no longer writes `rof`.

Total (constraint 8): junk in `rofModes` or `loaded` reads as no pick and nothing loaded, never throws, from a file and from a call.

## 9. The UI

**An open written-in row** keeps W70's behaviour and L2's four picks. Beside them, **three ticks** labelled from `rofModes` (drafted: **Single**, **Burst**, **Full Auto**, the data's names, under a **Fire modes** label). They show the line's `fireModes`, so a row from before with a typed "S/B" opens with Single and Burst ticked. Ticking or unticking one commits the whole set through `setCustomWeapon`, one audited action; the last one unticked clears it. While no mode is ticked and the typed `rof` reads as none ("Semi"), a hint beside them says what was typed (drafted: *You wrote "Semi". Tick the modes it fires.*), as L2's type hint does.

The `rof` text cell leaves the open row (`WEAPON_COLS`), as `type` did in L2. The folded row, Main and print still show a typed `rof` from before, through the line.

**Reload** on a written-in weapon with a type draws and behaves as a catalog weapon's: its title says what it takes ("Handgun Rounds: 2 mags carried"), "dry" when none is carried, the chooser when two kinds fit, "Reload anyway?" with none. No new UI: `roundsHtml`, `reloadTitle`, `reloadChooser` and the handler already do this for a catalog row.

**Where things land:**

| Press | What's stored | Audit line (drafted) | Where focus goes |
|---|---|---|---|
| A fire mode ticked or unticked | `rofModes` (the whole set), or deleted when none | `Zip gun: fire modes → Single, Burst` / `Zip gun: fire modes → —` | stays on that tick; the row stays open (L2b 6 asserts it) |
| A tick refused (a hand-edited page) | nothing | — | a notice with the `why`; the ticks show the stored set again |
| Reload, one kind carried | `roundsSpent`; the carried row −1 (or −N shells); a part-used row if rounds were left | as a catalog reload: `Reloaded Zip gun (15/15), −1 mag of Handgun Rounds, the old mag kept with 10 rounds` | as today |
| Reload, none carried | after "Reload anyway?": `roundsSpent` 0 | `Reloaded Zip gun anyway, no Handgun Rounds on the sheet` | as today |
| Reload, no type | `roundsSpent` 0 (and any `loaded` put back) | `Reloaded Zip gun (15/15)` | as today |
| Undo of any | the row and gear as they were | — | as the undo toast does today |

All new copy is drafted for a voice pass: the **Fire modes** label, the hint, the audit lines and `setCustomWeapon`'s refusal. The tick labels are the data's names.

## 10. Worked examples, as named tests

The character for L2b 1–5: `subject()`-like, every stat 5, Handguns rank 3, a written-in **Zip gun**: `category: "handguns"`, damage `BOD+3`, capacity `"15"`, `roundsSpent: 5`. "Before" numbers are read on `main` in the test itself, never typed here. Write these first and show each failing on `main`, or say why it passes there.

| Test (file) | Pins |
|---|---|
| `L2b 1 (engine): a written-in handgun reloads from carried Handgun Rounds, as a Cheapshot does` (`engine.test.mjs`) | Two Handgun Rounds carried (one row, qty 2). `weaponLine(...).reloadFrom` deep-equals what a carried Cheapshot's says, but its name; Reload: `ok`, `used` 1, the carried row qty 1, `roundsSpent` 0, and a part-used Handgun Rounds row with `roundsLeft` 10 (Decision 222). The same Zip gun with **no** `category`: a free reload, qty still 2, no `reloadFrom` (LQ24). On `main` the typed one reloads free, qty 2 |
| `L2b 2 (engine): a written-in gun reloads only what fits its type, never by a catalog id or a mod` (`engine.test.mjs`) | **Computed over the data**: for every `weaponCategories` id, a Zip gun of that type with every ammo entry carried. `reloadFrom.ammo`'s kinds equal the entries whose `reload.categories` include the type and have no `needsMod`, never one matched only by `reload.weapons`. **The data has no ammo fitting a catalog weapon by id alone** (pre-flight: no `reload.weapons` today), so a `withData` fixture adds one (`reload: { weapons: ["cheapshot"], fills: "magazine" }`), and it must not fit a Zip gun typed Handguns. Melee, Martial Arts, Grenades, Heavy Weapons, Archery: no `reloadFrom`, a free reload |
| `L2b 3 (engine): a written-in gun loads Silver Rounds, keeps them across a save, and gives them back when its type stops fitting` (`engine.test.mjs`) | Handgun Rounds and Silver Rounds carried: Reload asks (`choose`, both ids). Load Silver: `loaded` "silver-rounds", their tags on the line, and `migrate(JSON round trip)` keeps `loaded`. Angel Rounds carried alone: `noAmmo` (they need a mod). Then `setCustomWeapon(... "category", "")` and Reload: `loaded` gone, and a Silver Rounds magazine (whole or part-used) is back in gear (LQ24) |
| `L2b 4 (engine): a written-in weapon's fire modes are a pick, and a typed RoF from before reads until it's ticked` (`engine.test.mjs`) | `rofModes: ["B", "S"]` → line `rof` "S/B", `fireModes` ids `["S","B"]` (the data's order); `fireWeapon(…, "B")` spends 3, `"F"` is refused. No `rofModes`, typed `rof` "S/B/F" → three modes, as on `main`; typed "Semi" → none, and one "−1" Fire. `setCustomWeapon` with `["S","S"]` stores `["S"]`; with `[]` deletes the key; refuses `["X"]`, `"S"`, `[1]`, writing nothing. A new row from `addCustomLoadout` has no `rof` key |
| `L2b 5 (engine): junk in rofModes or loaded reads as nothing, from a file and from a call` (`engine.test.mjs`) | `migrate()` on a custom row with `rofModes` of `"S"`, `["Q"]`, `[]`, `{}`, `[null]`, `["S", 3]`: the key is gone; `["F","S","F"]` becomes `["S","F"]`. `loaded` of `7`, `{}` is gone; `"nonsense"` is kept and reads as nothing loaded. A second migrate changes nothing. `weaponLine`, `fireWeapon` and `reloadWeapon` never throw on any |
| `L2b 6 (sheet): the open row's fire-mode ticks are one undoable action each, and the fire buttons follow them` (`smoke-sheet-play.test.mjs`) | **The Zip gun's own open row** (found by its name): three ticks named Single, Burst, Full Auto, and no `rof` text cell. Ticking Burst: one audit entry naming the Zip gun and "Burst", `rofModes` stored, **focus on that tick**, the row still open. Folded: **that row's** fire buttons are S and B, the next row's unchanged. Undo: no `rofModes`. A second written-in row typed `rof: "Semi"` shows the hint in **its own** row and not the Zip gun's |
| `L2b 7 (sheet): Reload on a written-in handgun takes a mag from Loadout and from Main, and says so` (`smoke-sheet-play.test.mjs`) | With 2 Handgun Rounds carried: **the Zip gun's** Reload title names Handgun Rounds; pressing it on Loadout takes one (carried row qty 1), the audit line is the catalog's shape ("Reloaded Zip gun (15/15), −1 mag of Handgun Rounds…"), and a part-used row appears. Fire again, then Reload on **Main**: the second mag goes. With none left: "Reload anyway?" asks, and the audit says no Handgun Rounds on the sheet. Print's row for a ticked Zip gun reads RoF "S/B" (the twin) |
| `L2b 8 (engine): no catalog weapon's line, fire or reload moves` (`engine.test.mjs`) | A fixture captured on `main` **before** the engine changes (`tests/l2b-catalog.json`): every catalog weapon's carried `weaponLine`, and the result of `reloadWeapon` (half-spent) with every ammo entry carried one at a time and with none. The branch's match exactly. Deleted with its fixture at close-out (§12, step 8), once the PR shows it passing |
| `L2b 9 (engine): migrate to S keeps a typed rof, adds nothing, and keeps loaded` (`engine.test.mjs`) | A 0.30 file with a written-in row `rof: "S/B"` and `loaded: "silver-rounds"`, and one with `rof: "Semi"`: after `migrate()` the schema is S, both `rof`s unchanged, no `rofModes` added, `loaded` kept. `migrate(migrate(x))` deep-equals `migrate(x)` |

## 11. Tests beyond the examples

- **Mutation-test** each guard against the fixed code, recording the output in the PR. Each must fail, and each line says what kills it:
  - L2b 1: change `reloadSource` back to catalog-only (the free reload): L2b 1's qty. Separately, change only `reloadSource` and leave `putBack` on `weaponDefById` (the twin): L2b 1's part-used row must be missing, and the test must fail on it.
  - L2b 2: let a custom row match `reload.weapons` (e.g. `ammoDefOf` returning `{ id: e.name, category }`, or matching on any id): **the `withData` fixture** kills it, since no data entry can.
  - L2b 2 and 3: drop the `needsMod` check for a custom row: Angel Rounds fit, L2b 3 fails.
  - L2b 3: leave `migrate()` deleting `loaded` on a custom row: the round trip fails. Separately, skip the put-back on the no-source path: the Silver magazine isn't returned.
  - L2b 4: return `rofModes` in stored order instead of the data's: `["B","S"]` reads "B/S". Separately, read `rof` even when `rofModes` is set.
  - L2b 6: draw the ticks or the fire buttons on the next row (the off-row mutant); commit a tick without `setCustomWeapon`; re-render without keeping focus. Each must fail.
  - L2b 7: print reading the raw `w.rof` (today's twin): a ticked Zip gun prints no RoF.
- **Hostile:** `hostile.test.mjs`'s L2 written-in weapon (~1293) gains `rofModes: P("w.rof")`, `loaded: P("w.loaded")` and a typed `rof` payload. The open row (ticks and hint), the folded row, Main and print render it as text, and nothing throws.
- **Totality:** the engine's totality sweep (constraint 8) calls `setCustomWeapon` with `"rofModes"` and bad indexes, and `reloadWeapon` on a custom row with junk `category` and `loaded`.
- **Round trip:** L2b 9.
- **Voice:** `npm test` covers the new strings; the reviewer runs the voice pass (§14).

## 12. Steps

1. `git submodule update --init private`, `npm ci`, `npm run test:fast` (a fresh branch from `main`).
2. **Capture L2b 8's fixture on unchanged code,** and commit it alone. Then write L2b 1–9 and show them failing on `main` (L2b 8 passes there by design: say so).
3. **The engine:** `customWeaponPick`'s `rofModes`, `setCustomWeapon`, `customWeaponLine`'s `rof`, the custom path's `fireModes`, the shared `loaded`/`reloadFrom` helper, `ammoDefOf` in `reloadSource` and `putBack`, the no-source put-back, `addCustomLoadout`, `migrate()`'s step, `SCHEMA_VERSION` S and the schema literals. `npm run verify`.
4. **The UI:** `WEAPON_COLS` without `rof`, the three ticks and their handler, the hint, print's `l.rof`. `npm run verify`.
5. **The dev preview** (`shadows-dev-preview`; seed `shadows.active.v1` with a locked character holding a written-in Zip gun typed Handguns, capacity 15, one with no type and `rof: "Semi"`, a Cheapshot, 2 Handgun Rounds and a Silver Rounds; then Open sheet). Tick Single and Burst and fire a Burst; undo. Reload the Zip gun on Loadout and on Main, and check the Handgun Rounds count and the part-used row each time. Load Silver Rounds through the chooser. Reload the untyped one. Print. Then the open row at 375 px. Screenshots if the tool draws. If it times out, paste the DOM reads and the phone-width metrics (`scrollWidth` against `clientWidth`, no element in `main` past the right edge) into the PR.
6. **Mutation tests** (§11), each recorded in the PR with its output.
7. **Docs:** Decision N and its marks (§3), SCHEMA §2's comment, the plan's row, W109's Plan line.
8. **Close-out** (§14). Delete L2b 8's test and `tests/l2b-catalog.json` in the close-out commit, and name in the PR the commit where they last passed.

## 13. Stop and ask

**Stop** if:
- A catalog weapon's line, fire or reload moves in L2b 8.
- Any ammo entry's `reload` has a key this order doesn't name (`categories`, `weapons`, `fills`, `specialty`, `needsMod`, `countUnit`), or any carries a `reload.weapons` list. The data has moved since this pre-flight, and L2b 2's fixture may no longer be the only case.
- A written-in row already carries a `rofModes` key, or `weaponRules.rofModes` has more or fewer than S, B and F, when you start.
- A reader of a custom row's `rof`, `ammo`, `loaded`, `fireModes` or `reloadFrom` turns up that §5 doesn't list, in `src/` or in GM mode, edit rows included.
- The build needs a data key or value to change (then game data would bump, which §2 says it doesn't).
- A W70 test, or an L2 test, fails for a reason other than the schema literal or the `rof` cell leaving `WEAPON_COLS`.

**Not a stop** (expected):
- The schema literal `"0.30"` failing in the tests listed in the prototype note, and in `docs.test.mjs`. Update each to S, except a test's own old file that says an older version on purpose.
- The W40 migrate test (engine.test ~2256) failing on its custom row's `loaded`: it encodes the rule LQ25 changes. Update that case and the test's name to say a custom row keeps it (Decision N).
- A test that types into `[data-cell="weapons|i|rof"]`, or counts `WEAPON_COLS`' cells, failing because the `rof` cell is gone: update it to the ticks. The prototype found none (it didn't touch the UI), so one that turns up is expected, not a stop.
- The version literals the bump moves, if there is one (§2).
- `npm run changelog` regenerating `src/data/shadows-changelog.js`.
- L2b 8 passing on `main`.

## 14. Close-out

- **`CHANGELOG.md`**, under the `[Unreleased]` heading (§2 says which), in player voice, naming no list. Drafted for the voice pass:
  - "**Weapons you write in reload like the catalog's.** Give one a type and Reload takes a magazine of the ammo it fits from what you carry, keeping a half-empty one. Silver Rounds and Holy Points load too. Tick the fire modes it has, and Single, Burst and Full Auto spend its rounds."
  Then `npm run changelog`.
- **Versions:** the app per §2; `SCHEMA_VERSION` S. No `gamedataVersion` bump.
- **Docs:**
  - SCHEMA §4: Decision N and the three marks; INDEX §3: N's line and the three marks.
  - SCHEMA §2's weapons comment: `rofModes` (S), `loaded` kept on a written-in row, and the shape line.
  - The plan's L2b row (Merged, with the PR and versions). W109's Plan line: L2b took a written-in weapon's reload and fire modes; the rest stays set aside by the plan's §4.
  - A `docs/log/2026.md` entry, a `docs/log/shipped.md` row, and STATE rewritten (versions; L2b done, L4 next).
- **PR title:** `L2b: written-in weapons tick their fire modes and reload from carried ammo (W109; Decision N)`.
- **PR body:** the template's sections, including **Where the order didn't fit**. Paste every new string as it renders: the Fire modes label, the hint, the audit lines, the refusal and the changelog line.

**Review checklist** (the reviewer, beyond the tests passing):
- L2b 2 computes what fits from the data, and its `withData` fixture is what kills the `reload.weapons` mutant.
- L2b 8's fixture commit precedes every engine commit and touches only the fixture. The PR names the commit where L2b 8 last passed before its deletion.
- Every mutant in §11 was run and killed, with its output in the PR, including the twin (`putBack`) and both off-row mutants.
- Every row in §5's sweep is built, and a fresh grep of a custom row's readers (`\.rof\b`, `fireModes`, `reloadFrom`, `\.loaded\b`, `\.ammo\b`, `WEAPON_COLS`, `ammoFor(`, `weaponDefById(e.id)`) finds none it missed, **edit rows included**.
- `reloadSource` and `putBack` read the weapon through one helper, and the catalog and custom lines build `loaded`/`reloadFrom` through one helper.
- In the preview: a written-in gun's Reload lowers the Handgun Rounds count on Loadout and on Main, and a catalog Cheapshot's Reload still does exactly what it did.
- A file saved before S opens with its typed `rof` working and its fire buttons unchanged; saving it again keeps it.
- Constraint 9: no decision number, LQ or W id in any rendered string.
- The voice pass on every new string, drafted side by side **inline in the message to the conductor**.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md` (*The prompts*), with `<plan>/<order>` = `loadout-and-gear/L2b-custom-weapon-fire-and-reload.md` and `<id>` = **L2b**, plus these traps:

- **Two readers of the weapon for ammo, not one.** `reloadSource` decides what goes in; `putBack` decides what a half-empty magazine comes back as. Change only the first and a written-in gun's part-used magazine vanishes. Both go through `ammoDefOf`.
- **One helper for `loaded` and `reloadFrom`.** The catalog path computes both inline today. Move it to a helper both paths call; don't copy it.
- **A custom row has a category and no id.** `ammoFor` matches `reload.weapons` by id; a written-in weapon must never match by id, and its name is never an id (constraint 6).
- **Angel Rounds need a mod.** `modsOf` a custom row is `[]`, so `needsMod` already keeps them out. Don't special-case them.
- **The ticks show the line, not the stored key.** A row from before with a typed "S/B" has no `rofModes` and opens with two ticked. The first tick writes the whole set.
- **`rof` is never written again, and never cleared.** Not by `addCustomLoadout`, not by a tick. Print reads the line (`l.rof`), not the raw row: that's the twin L2 left.
- **`loaded` now survives on a written-in row.** `migrate()`'s guard changes, and the no-source Reload puts it back before forgetting it.
- **Capture L2b 8's fixture first,** in its own commit, before any engine edit.
