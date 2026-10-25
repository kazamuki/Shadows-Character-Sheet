# Work order L1: Weapon damage types

**Plan:** [`../loadout-and-gear.md`](../loadout-and-gear.md) §3, row L1. **Wish:** [W69](../../WISHLIST.md) (worn gear modifiers), its data step. **The book:** `0460` Gear, *Damage Types* and the weapon tables. **Rulings:** Deighton's Q14 (2026-10-10: Electric and Burning count as energy, `reference/rulings-2026-10-10.md`). Ken's LQ2 (2026-10-24: flag what the book doesn't type). Decisions 68, 135.

**Status: drafted 2026-10-24 by Claude (Opus), the plan's conductor. Approved by Ken 2026-10-24, with LQ11–LQ13 on their defaults** (§4). Ready for **L1 build**.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md): **L1 build** (Sonnet), then a fresh **L1 review** (Opus) once the PR is open.

**Carried over.** This is the plan's first order, so no review has fed it yet. It applies these lessons from the sheet-wishlist plan's reviews:
- **Sweep the readers that aren't about display.** P21's flag on Field Medic also stopped IP selling it. Here, `flagged` is read by `advantageBarred` (engine ~2602) for Advantages only, and by `flagHtml`'s callers in `sheet.js`. A flagged weapon is read by **nothing** today (§5).
- **A list the order writes by hand is checked by script against its source.** L1 1 parses `0460`'s tables. §7's list is a convenience.
- **"Nothing else moves" is proved by a diff, not a pin.** L1 4 diffs every catalog weapon's line.

**Pre-flight against `main` at `49d1d08`** (#249 merged; app 0.54.2, game data 0.47, schema 0.28).

```
Weapons                  54. 25 have no damageType: handguns 6, smgs 6, grenades 8, heavyWeapons 2, archery 3
damageType values         "Normal" (6: melee 3, martialArts 3), "Ballistic" (10), "Energy" (8), "Electric" (4), "Burning" (1: the HFT-3 Hellmouth)
                          A weapon's damageType is the book's display word, not a damageTypes id; "Normal" is the book's own
                          (0460's melee table, Dam Type column) and isn't a damageTypes name. Every other value is one (by name)
The book                  0460 Damage Types: "Ballistic — High-velocity projectiles: firearms of all categories."
                          The Handguns and SMG tables have no Dam Type column. Neither do grenades, heavy weapons or archery.
                          Three grenades deal no damage (DMG "—"): SG-2 Shockwave, VS-3 Curtain, Sunburst. The IG-7 Cinder's Notes say
                          "Incendiary, Burning". The data typed the Hellmouth Burning from its Burning tag, and the HGL-4 Anvil
                          (a Blast launcher) Ballistic
Readers of a weapon's     engine weaponDefLine ~2037 (passes it through); sheet.js ~1775 (catalog search matches it), ~1813 (catalog
  damageType              result's sub line, hides "Normal"), ~2088 (Loadout weapon card's sub line, hides "Normal"); wizard.js ~419
                          (an archetype weapon choice's stats). Main's Weapons table (~458) and the print sheet (pWeaponRows ~2716)
                          don't show it. The hit modal's Type select (~1067) and GM mode's (gm.js ~2665) read damageTypes, never a weapon
Readers of flagged        engine advantageBarred ~2602 (Advantages only); engine resolveHit ~1684, ~1688 (damage types, armor upgrades);
                          sheet.js: Majors ~1656, weapon mods ~2071, armor upgrades ~2158, ~2356, the IP buy ~3022. Not one reads a
                          flagged weapon, so a weapon's playerNote would render nowhere
Guards                    docs.test.mjs (~108): a flagged entry's flagNote names an open F. engine.test.mjs's key guard (~366) is by
                          key name, and flagged, flagNote, playerNote are all read or text. voice.test.mjs (~217) reads every
                          flagged entry's playerNote
Prototype                 the 12 Ballistic edits on a scratch copy: the full suite passes (1367, 0 fail). No test pins a handgun's
                          or SMG's line, the catalog row's text, or the count of untyped weapons
```

---

## 1. Goal and Done when

**Goal.** Every weapon the book types has its damage type, so W69's "+2 to energy weapons" (L3) and a custom weapon's pick (L2) have a vocabulary to read. The ones the book doesn't type go to Deighton as one flag. The sheet says so instead of guessing.

**Done when:**
- The 12 handguns and SMGs read **Ballistic** on their Loadout card and in the catalog picker ("Handguns · Ballistic").
- The 10 weapons the book doesn't type (§7) are `flagged`, under one new flag, and each one's Loadout card shows the unsettled note.
- The three grenades that deal no damage stay untyped and unflagged (LQ12).
- A guard fails if a weapon's `damageType` isn't a `damageTypes` name or the book's `Normal`, or if a weapon with damage has none and isn't flagged.
- Nothing else in any catalog weapon's line moves (L1 4's diff).

## 2. Tier, versions, numbers

- **Tier: Content.** A character's computed values change (a weapon line's `damageType`), and a flag opens. No decision: the data's shape doesn't move. A weapon keeps the book's display word, and L3 decides how a word becomes a class (§6).
- **Game data:** `gamedataVersion` 0.47 → **0.48** (Decision 68). If another branch lands first, take the next minor.
- **App:** a patch, 0.54.2 → **0.54.3** (`npm run bump -- 0.54.3`), or the next patch if one lands first. Players see Ballistic and the note.
- **Schema:** none. A saved character stores a weapon's `id`, never its type.
- **Flag:** the next free number, written **FN** here. Today that's F48 (the highest anywhere in SCHEMA is F47). Take it at build time (`close-a-flag` skill, *Opening one*).

## 3. Decisions

None. The choice this order makes, keeping the book's display word with no class field yet, is recorded in the log entry, not the ledger. L3 numbers the class reading where it's first read (Decision 135: no field before its reader).

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| LQ11 | The IG-7 Cinder's Notes say "Incendiary, Burning", and the data already types the Hellmouth flamethrower Burning from its Burning tag. Type the Cinder **Burning** now, or put it in the flag with the rest? | **In the flag,** as LQ2 said: the callout's Burning names "incendiary rounds", not grenades. The flag suggests Burning for it. **Ken, 2026-10-24: Default** |
| LQ12 | Three grenades deal no damage (Shockwave, Curtain and Sunburst: the book's DMG is "—"). A damage type means nothing for them. Leave them untyped and **out of the flag**, which narrows LQ2's 13 to 10? | **Yes:** no type, no flag. The guard accepts an untyped weapon that has no damage. **Ken, 2026-10-24: Default** |
| LQ13 | Where the flag's note shows | **On the Loadout weapon card**, under its row, the way a flagged weapon mod's does (`flagHtml`). Not in the catalog picker, on Main or in print, where the type doesn't show either. **Ken, 2026-10-24: Default** |

## 5. The assumption sweep

| What | Today | Where | After |
|---|---|---|---|
| 12 handguns and SMGs' `damageType` | absent | `shadows-data.js` weapons | `"Ballistic"` |
| 10 untyped weapons with damage (§7) | absent, unflagged | same | absent; `flagged: true`, `flagNote` naming FN, `playerNote` (§8) |
| Shockwave, Curtain, Sunburst | absent | same | unchanged (LQ12) |
| `weaponDefLine().damageType` | null for 25 | engine ~2037 | `"Ballistic"` for 12; null for 13 |
| Loadout card sub line | "Handguns" | sheet.js ~2088 | "Handguns · Ballistic" |
| Catalog result sub line | "Handguns" (after the category label) | sheet.js ~1813 | gains "Ballistic" |
| Catalog search | "ballistic" doesn't find a handgun | sheet.js ~1775 | it does |
| Loadout card, a flagged weapon | no note (nothing reads a weapon's `flagged`) | sheet.js ~2088–2100 | `flagHtml(def)` under the row (LQ13) |
| Main's Weapons, print | no damage type | sheet.js ~458, ~2716 | unchanged |
| An archetype weapon choice | its own `damageType` | wizard.js ~419 | unchanged (no archetype weapon is in §7) |
| The hit modal, GM mode's hit | the player picks a `damageTypes` id | sheet.js ~1067, gm.js ~2665 | unchanged: nothing reads a weapon here |
| `meta.gamedataVersion` | `"0.47"` | data `meta` | `"0.48"` |
| SCHEMA §5, INDEX §2, STATE | no FN | — | FN's row, its INDEX line, Deighton's list in STATE §5 |

**The three questions, answered by grep:**
- **Which guards read a value this changes?** `docs.test.mjs`'s flag guard (FN must be open in §5), and `voice.test.mjs`'s flagged-`playerNote` check. No test counts untyped weapons. The grenade test (`rules.test.mjs` ~1383) reads escalation, defense and radius, not type.
- **Where does each new note or word render?** Ballistic: the Loadout card, the catalog row and the catalog search, and nowhere else (`grep -n "damageType" src/ui`). The `playerNote`: nowhere today, so the order adds the Loadout card (LQ13).
- **What text points at what this changes?** `WISHLIST.md` W69 ("only 29 of the 54 weapons carry today … so the rest need one"): add a line saying L1 typed 12 and flagged 10. The plan's §2 ("25 of 54 weapons have none"): leave it, since it's the plan's sweep, true as of its date.

## 6. Read first

- `CLAUDE.md`: constraint 6 (ids), 9 (maintainer text never renders), *Flags*, *Change tiers* (Content), *Versions* (game data).
- `.claude/skills/close-a-flag/SKILL.md`, *Opening one*.
- `0460_Gear.md`: *Damage Types* (~107), Handguns (~350), SMG (~376), Grenades (~402), Heavy Weapons (~567), Archery (~647) and its Arrowheads table.
- `docs/VOICE-APP.md`, for the `playerNote`.
- `src/ui/shared.js` `flagHtml` (~1063). `src/ui/sheet.js` `weaponRowsHtml` (~2077) and `weaponModsHtml` (~2066), for where a mod's flag renders.

## 7. Out of scope

- **No class field and no reader of class.** L3 decides how "Ballistic" becomes kinetic.
- **No change to "Normal"** on melee and Martial Arts weapons. It's the book's word, and their `style` (Blade, Blunt) says the rest.
- **Not the arrowheads.** An Incendiary or Silver-Tipped arrow's tag is ammunition (W40), and stays so.
- **Not the hit modal.** It doesn't read a weapon, and making it do so is a different wish.
- **No guessing.** The flag row offers Deighton a suggestion per weapon; the data gets none of them.

## 8. The data

**Typed Ballistic (12)**, by `0460`'s "firearms of all categories": `cheapshot`, `ads-lp9-viper`, `vs4-ironside`, `ap7-sentry`, `hk5-breach`, `bdf-oni` (handguns); `chatter`, `ads-cs4-whisper`, `ts7-bulldog`, `hs3-phantom`, `vs12-rampart`, `ads-sr1-specter` (SMGs). Add `"damageType": "Ballistic"` after `"damage"`, as the rifles have it.

**Flagged (10):** `fg1-thunderclap`, `eg3-blackout`, `ig7-cinder`, `junk-bomb`, `star-dust-grenade`, `hrl1-thunderhead`, `hxc1-absolute`, `urban-recurve-bow`, `bdf-yumi`, `ads-tc1-strix`. On each:

```js
"flagged": true,
"flagNote": "FN: 0460 gives no damage type for this weapon (W69, plans/loadout-and-gear.md L1). Untyped until Deighton rules.",
"playerNote": "Its damage type isn't set yet, so your GM says what a hit from it counts as."
```

The `playerNote` is drafted for a voice pass.

**Left alone (3):** `sg2-shockwave`, `vs3-curtain`, `sunburst-grenade` (no damage, LQ12).

**SCHEMA §5's row** (the question, the stub, who rules, whether it blocks):

> | FN | **Which damage type do the book's untyped weapons deal?** 0460 types firearms (Ballistic) and lists melee's, but gives none for 3 bows, 5 grenades that deal damage, and 2 launchers. Suggestions: the bows Blade (a broadhead cuts and pierces; an arrowhead's own tag adds to it); FG-1 Thunderclap Ballistic (fragments) or Blunt; EG-3 Blackout Electric (0460: Electric "treat as an EMP interaction"); IG-7 Cinder Burning (its Notes, and the Hellmouth's precedent); Junk Bomb by its 1d4 (a Frag roll as the Thunderclap); Star Dust none (its damage is the Wither cloud); HRL-1 Thunderhead and HXC-1 Absolute Ballistic, as the HGL-4 Anvil is. Stubbed (L1): untyped, and the Loadout card says the GM rules. W69's class modifiers (L3) skip them | Deighton | Doesn't block L1; L3 skips them until ruled |

**INDEX §2:** `` | `FN` | Which damage type the book's untyped weapons deal (3 bows, 5 damaging grenades, 2 launchers). Stubbed: untyped, the Loadout card says the GM rules (L1) | Deighton | ``.

**STATE §5:** add FN to Deighton's line, beside the vehicle follow-ups.

## 9. The UI

- **The Loadout weapon card** (`weaponRowsHtml`): a catalog line whose def is `flagged` gets `flagHtml(def)` under its row, as `weaponModsHtml` puts a flagged mod's. It shows only on the card, once per weapon carried. Two of the same bow give two cards, each with its note, as two flagged mods do.
- **Nothing else changes by hand.** The sub line's "Ballistic" comes from the existing `l.damageType` render.

## 10. Worked examples, as named tests

Write these first and show each failing on `main`, or say why it passes there.

| Test (file) | Pins |
|---|---|
| `L1 1 (rules): CRB 0460: every handgun and SMG is Ballistic, firearms of all categories` (`rules.test.mjs`) | Parses the Handguns and SMG tables' rows (the grenade test's pattern), matches each to the data by name, and asserts the same count and `damageType === "Ballistic"`. Also asserts the *Damage Types* callout still contains "firearms of all categories", so a book edit trips it |
| `L1 2 (rules): CRB 0460: a grenade the book gives no damage has no damage type, and isn't flagged` (`rules.test.mjs`) | From the grenade table, the rows whose DMG is "—" (exactly Shockwave, Curtain, Sunburst, found by script): no `damageType`, no `flagged` |
| `L1 3 (engine): every weapon's damage type is the book's word, and an untyped weapon is flagged or does no damage` (`engine.test.mjs`) | For all 54: `damageType` is absent, or `"Normal"`, or a `damageTypes` name. An absent one has `flagged: true` with a `flagNote` naming an F, or has no `damage` |
| `L1 4 (engine): only the twelve firearms' lines change` (`engine.test.mjs`) | A fixture of `weaponDefLine` for every catalog weapon, captured on `main` **before** the data changes (`tests/l1-weapon-lines.json`; there is no fixtures folder, and the other fixtures are `.mjs` modules beside the tests). The branch's lines match it except `damageType` null → `"Ballistic"` on exactly the 12. Delete the fixture and the test at close-out if the reviewer agrees it's served its purpose; say which in the PR |
| `L1 5 (sheet): a handgun's Loadout card says Ballistic, and a bow's says its type is the GM's call` (`smoke-sheet-play.test.mjs`) | A locked character carrying `cheapshot` and `urban-recurve-bow`. The Cheapshot's sub line is exactly "Handguns · Ballistic". The bow's card contains `appCopy.unsettledLabel` and the bow's `playerNote` whole. The Cheapshot's card contains neither. Main contains neither |

## 11. Tests beyond the examples

- **Mutation-test the guard (L1 3)** against: a handgun's `"Balistic"`; a bow with its `flagged` removed; a bow's `flagNote` with no F. Each must fail. Then check L1 3 isn't the only thing standing: `docs.test.mjs` also kills the third.
- **Mutation-test the UI (L1 5)** by removing the `flagHtml(def)` call. L1 5 must fail.
- **Voice:** `npm test` covers the new `playerNote` (`voice.test.mjs`). The reviewer runs the voice pass on it (§14).

## 12. Steps

1. `git submodule update --init private`, `npm ci`, `npm run test:fast` (a fresh branch from `main`).
2. Capture L1 4's fixture **on unchanged data**, and commit it alone. Then write L1 1–5 and show them failing (L1 4 passes until step 3, by design: say so).
3. The data (§8): 12 Ballistic, 10 flagged, `gamedataVersion` 0.48. `npm run verify`.
4. The flag: SCHEMA §5's row, INDEX §2's line, STATE §5 (`close-a-flag`). `npm run verify`.
5. The UI (§9). `npm run verify`. In the dev preview (`shadows-dev-preview`, a locked character seeded with both weapons): screenshot the two cards, and the catalog picker searching "ballistic".
6. Mutation tests (§11), each recorded in the PR.
7. Close-out (§14).

## 13. Stop and ask

**Stop** if:
- `0460`'s Handguns or SMG table doesn't match the data by name and count (L1 1). The book has moved: don't edit the data to fit.
- Any weapon other than the 12 changes in L1 4's diff.
- A reader of a weapon's `damageType` or `flagged` turns up that §5 doesn't list.
- The flag number on `main` isn't free, and taking the next one would change anything but the number.

**Not a stop** (expected):
- The version literals the bumps move (`APP_VERSION`, `package.json`, `package-lock.json`, `README.md`, `STATE.md`, `meta.gamedataVersion`) and `docs.test.mjs` asking for them to agree.
- `npm run changelog` regenerating `src/data/shadows-changelog.js`.
- L1 4 passing on `main` before the data changes.

## 14. Close-out

- **`CHANGELOG.md`**, under `## [Unreleased] — app 0.54.3`, in player voice (drafted, for the voice pass):
  - "Handguns and SMGs say their damage type, Ballistic, on Loadout and in the catalog."
  - "Bows, most grenades and the two launchers say their damage type is your GM's call, until it's settled."

  Then `npm run changelog`.
- **Versions:** `npm run bump -- 0.54.3`; `meta.gamedataVersion` 0.48.
- **Docs:** the plan's L1 row status (Merged, with the PR, app and data versions); `WISHLIST.md` W69's line (§5's third question); a `docs/log/2026.md` entry (Content); a `docs/log/shipped.md` row; STATE §5 for FN.
- **PR title:** `L1: weapon damage types: twelve firearms Ballistic, ten flagged (W69; FN)`.
- **PR body:** the template's sections, including **Where the order didn't fit**. Paste the two new strings as they render (the `playerNote` and both CHANGELOG lines).

**Review checklist** (the reviewer, beyond the tests passing):
- L1 1 reads the book's tables, not a list from this order.
- L1 4's fixture was captured before the data changed (its commit precedes the data commit).
- Every mutant in §11 was run and killed, with output in the PR.
- The `playerNote` renders only on the Loadout card. Grep the other `flagHtml` callers and check none of them picks up a weapon.
- `flagNote` never renders (constraint 9): no "FN", "F48" or "Deighton" in any rendered string.
- The SCHEMA row's suggestions are in §5 only. No suggested type reached the data.
- The voice pass on the `playerNote` and both changelog lines, drafted side by side for Ken through the conductor.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md` (*The prompts*), with `<plan>/<order>` = `loadout-and-gear/L1-weapon-damage-types.md` and `<id>` = **L1**, plus these traps:

- **Nothing reads a flagged weapon today.** The note renders only because this order adds the `flagHtml(def)` call. If L1 5 passes before step 5, the test is wrong.
- **"Normal" isn't a `damageTypes` name,** and it's right. L1 3 accepts it by name, not by lowercasing it into an id.
- **Count the grenades by script.** The three no-damage ones are found by the book's "—", not by this order's list (L1 2).
- **Capture L1 4's fixture first,** in its own commit, before any data edit.
