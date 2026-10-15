# Work order P8a: The hit (Resistance, AP on a spell, grenades)

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W102**, its
hit half (`WISHLIST.md`). Closes **F18, F23, F25**. Opens one flag (§3).
Decisions 99, 100, 104, 143, 191 and 192.
**Status:** **drafted 2026-10-14 by Claude (Opus)**, pre-flighted against
`main` after #177 (P7 merged, 0.43.1 unreleased). **Approved by Ken
2026-10-14, PQ1–PQ6 on their defaults** (§4); ready to build.
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**P8 was split** (Ken, 2026-10-14) into this order, the hit, and **P8b**,
healing (F24 and F36, the gritty option, a character-schema bump). P8b's
order is written after this one merges.

**What P8a is.** Deighton ruled on how a hit lands (`reference/rulings-2026-10-10.md`
Q1–Q3, Q6, Q7). Three changes reach the hit calculator:

- **F23: the Resistance upgrade is applied.** Its 50% halves the damage
  **first, then PROT and RES** (Q2). Electric and Burning stay Energy, as
  stubbed (Q1), so those two flags close with no change to the numbers.
- **F25: AP on a spell pierces Natural Armor** (Ken's follow-up to Q3). The
  rest of the stub stands: Natural Armor ignores AP, Kinetic means bullets and
  melee weapons, and Massive skips it.
- **F18 and grenades: grenades and explosives deal Massive** (Q7). There are no
  MD ratings to assign (Q6): one MD is 10 Massive damage, which is the rule the
  engine already runs (Decision 99). That half is a flag closing with nothing
  built.

**The book.** 0460 says Resistance is "50% damage reduction against heat,
electric, or cold-based attacks. Specify type at installation", and gives no
order and no rounding. Those are Deighton's ruling (order) and PQ1 (rounding),
not quotes. Pin them as rulings.

---

## 1. Goal

When P8a is merged:

1. **Resistance names its type.** Loadout offers **Resistance — Thermal**,
   **Resistance — Electric** and **Resistance — Freezing** as three upgrades,
   the way Warding became three (Decision 143). The old untyped **Resistance**
   is retired: it stays where it's installed, stops nothing, and says so.
2. **A covered hit of a type the lining answers is halved first** (PQ1's
   rounding), then PROT and RES, then Natural Armor. The breakdown says so in
   one line. Nothing tells the player to adjust by hand any more.
3. **The hit modal asks "From a spell"** when the hit is armor-piercing and
   the character has Natural Armor. Ticked, AP gets past Natural Armor, and
   the breakdown says so.
4. **Grenades that deal damage on the throw carry Siege** ("Deals Massive
   damage"), as PQ5 lists. The grenades category's note and the Massive
   category's text say so.
5. **F18, F23 and F25 are closed** (three edits each, F18 two since it has no
   data entry). **One new flag** for the Resistance types the book doesn't
   map (§3).
6. **GM mode's encounter hit is unchanged** except that the F23 note stops
   showing (it reads the same `resolveHit`, Decisions 191–192). An NPC has no
   installed upgrades and no Natural Armor, so no number on a row moves.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** It changes how the hit resolver computes damage,
  which someone could reasonably have built otherwise. One numbered decision,
  **N** (the next free number on `origin/main` when you write it), and one new
  flag, **F-next** (the next free F-number on `origin/main`).
- **App: minor**, because the hit calculator does something it didn't before.
  - **0.43.1 still unreleased** (`CHANGELOG.md` heads `[Unreleased] — app 0.43.1`):
    `npm run bump -- 0.44.0`. P7's lines stay under the renamed heading.
  - **0.43.1 released:** `npm run bump -- 0.44.0`, with a new `[Unreleased]` heading.
- **Game data:** what a hit computes moves (Decision 68).
  - **0.37 unreleased** (no release since #177): no bump. P7 already moved it
    for this release, and no player has seen 0.37.
  - **0.37 released:** `gamedataVersion` 0.38.
  - Say which case applied in the PR.
- **Character schema: no bump.** Upgrades stay a list of glossary ids. The
  three typed Resistances are new ids, not a new shape (§7a.1). `migrate()`
  doesn't change.

## 3. The decision and the flag, drafted

Write this as Decision **N** in `SCHEMA.md` §4, its INDEX §3 line under the
topic Decision 99 is filed under, and the marks in §3a.

```
N. **A hit is halved first by a matching Resistance, AP on a spell pierces Natural Armor, and grenades deal Massive.**
     *2026-10-1x · Ken + Deighton + Claude · Touches: Resistance, Resistance — Thermal, Resistance — Electric, Resistance — Freezing, halves, armorUpgradeGlossary, resolveHit, mitigateArmor, mitigateNatural, naturalArmorRules, spellApPierces, hit.spell, From a spell, AP, Natural Armor, Electric, Burning, Energy, grenades, Siege, Massive, F18, F23, F25, W102*
     - **Decided:** Resistance comes in three upgrades, one per type, and the untyped one is retired: it stays installed and stops nothing. A hit whose damage type the worn body piece's Resistance answers, on a part it covers, is halved first, rounding down, then PROT and RES, then Natural Armor; it doesn't halve Massive or Compromised armor, and AP doesn't affect it. Each typed Resistance installs once. AP on a hit the player marks as a spell gets past Natural Armor; any other AP still doesn't. Electric and Burning are Energy. Grenades that deal damage on the throw, and the grenade launcher, carry Siege. There are no MD ratings: one MD is 10 Massive damage, as Decision 99 already computes.
     - **Why:** Deighton's rulings of 2026-10-10 (Q1–Q3, Q6, Q7) and Ken's follow-up on AP and magic. Three ids follow Decision 143's Warding, so the type is chosen at installation, as 0460 says, with no new save shape.
     - **Rejected:** a type stored on the upgrade entry (every reader filters upgrades to strings, and it needs a schema bump for what three ids say); halving after PROT and RES (Q2); applying it to Massive (Massive skips the armor's answers); a separate "spell" damage type (spells already pick Blunt, Ballistic or a magical type); MD ratings on every weapon (Q6).
     - **Replaces:** Decision 99 in part (Resistance applied; F23 closed). Decision 100 in part (Resistance is no longer one repeatable upgrade). Decision 104 in part (AP on a spell pierces Natural Armor; F25 closed).
     - **Revisit if:** the book names a cold damage type, or rules whether Resistance answers Elemental magic (F-next), or playtests find halving first too strong.
     - **Built:** app 0.44.0, game data …, no schema bump, PR #…. Log 2026-10-1x (P8a).
```

**The flag, F-next**, a row in `SCHEMA.md` §5 and a line in `INDEX.md` §2:

> **Which damage Resistance answers.** 0460 names Thermal, Electric and
> Freezing. The app maps Thermal → Burning and Electric → Electric. No damage
> type is cold, so Freezing answers nothing yet. Elemental spells (fire,
> frost, lightning) are magic, so no Resistance answers them; Warding does.
> Stubbed as written. For Deighton.

It goes on `Resistance — Freezing` as `flagged: true` with a `flagNote`
naming F-next and a `playerNote` (tool voice, VOICE-APP). Thermal and Electric
aren't flagged: their mapping is the plain reading.

### 3a. Supersession marks

`docs.test.mjs` reads **only the first mark** on an entry, and it must match
the INDEX line's first mark.

- **Decision 99** already carries `Superseded in part by Decisions 100, 112 and 143`.
  Extend it to `Decisions 100, 112, 143 and N`, with a clause, and its INDEX
  line the same.
- **Decision 100** already carries `Superseded in part by Decisions 104 and 105`.
  Extend it to `Decisions 104, 105 and N`, and its INDEX line the same.
- **Decision 104** carries three separate mark lines (143, 196, 199). Add a
  fourth line, `→ **Superseded in part by Decision N** — AP on a spell pierces
  it; F25 closed.`, and a fourth `→ **superseded in part by N**` on its INDEX
  line. The first mark stays first.

## 4. Questions for Ken

| Id | Question | Answer |
|---|---|---|
| PQ1 | **Rounding.** Halving 13 damage: does 6 or 7 go on to PROT? 0460 doesn't say, and the app has no precedent for halving damage. | **Ken, 2026-10-14: the default.** **Down** (6). The wearer paid for the lining. Add a line to `crb-catch-up.md` asking the book to say so. |
| PQ2 | **When the lining doesn't answer.** RES skips Compromised armor and AP. Resistance isn't flat, so the AP glossary ("makes the flat damage reduction irrelevant") doesn't reach it. | **Ken, 2026-10-14: the default.** **It halves on a covered location only, skips Massive (as PROT and RES do), and skips Compromised or scrap armor (as RES does). AP doesn't affect it.** |
| PQ3 | **Two of the same type.** 0460: "each Resistance upgrade covers one damage type." Is a second Electric worth anything? | **Ken, 2026-10-14: the default.** **No.** Each typed Resistance installs once (not `repeatable`). The retired untyped one stays `repeatable`, so a file with two still reads. |
| PQ4 | **How a spell is marked.** Damage type can't tell: Iron Lance, the one AP spell, is "physical", so the player picks Blunt or Ballistic. | **Ken, 2026-10-14: the default.** **A "From a spell" tick in the hit modal**, shown only when Armor-piercing is ticked and the character has any Natural Armor (always-on or conditional). GM mode doesn't get it: an NPC has no Natural Armor (Decision 191). |
| PQ5 | **Which grenades are Massive.** "Grenades/Explosives are massive damage weapons." Some grenades deal no damage (Shockwave, Curtain, Sunburst, Blackout), and two deal theirs per round (Cinder's burn, Star Dust's cloud). | **Ken, 2026-10-14: the default.** **Siege on Thunderclap, Junk Bomb and the HGL-4 Anvil** (the launcher; the other explosives already carry Siege). Per-round damage is a Condition ticking, not the blast, so Cinder and Star Dust stay as they are. The grenades note says "A grenade's blast is Massive damage." |
| PQ6 | **An old untyped Resistance in a saved file.** Its type was never recorded. | **Ken, 2026-10-14: the default.** **Retired, kept, stops nothing.** Its description says to remove it and install a typed one. No migration: the app can't know which type the player meant. |

## 5. What this changes underneath (the assumption sweep)

Pre-flighted against `main` at #177. Each row is something that is true today
and stops being true, or a reader that has to learn the new thing. **Check
each one yourself before you build** (`grep`, a probe), and say in the PR if
any row is wrong.

| Today | Where | After P8a |
|---|---|---|
| `armorPiece` keeps only string upgrades (`entry.upgrades.filter(u=>typeof u==="string")`) | `engine.js` ~853 | Unchanged. This is why the type goes in the id, not on an object (§3 *Rejected*). |
| Resistance's `playerNote` is pushed on **every covered hit**, Ballistic included (probe: Urban Tactics Vest, Ballistic 12, PROT 2 → the "adjust by hand" note) | `resolveHit` ~1087, the `flagged && playerNote` loop | The note is gone with the flag. The loop stays for any upgrade still flagged, so `Resistance — Freezing` shows its F-next note. Pin that it shows **only** on a hit Freezing would govern, which today is none, so the test asserts it never shows. |
| Electric and Burning hits carry F23's `playerNote` | `damageTypes`, `resolveHit` notes | No note. GM mode's encounter hit shows `res.notes` too (`gm.js` ~2033), so its Electric line goes as well. That's intended. |
| `naturalArmorRules.ignoresAp: true` with no exception | data ~3811, `mitigateNatural` ~1013 | `spellApPierces: true` beside it. `mitigateNatural` skips with `"ap"` when `hit.ap && hit.spell && n.spellApPierces`. `naturalArmor()` returns the flag so the reader doesn't reach into data twice. |
| The hit modal draws no line for `natural.skipped === "ap"`, because it never happened | `sheet.js` ~903, `natLine` | A line: "Armor-piercing magic goes straight past Natural Armor." |
| `upgradeOptions` offers `Resistance` (repeatable) | `engine.js` ~1564 | Retired ids aren't offered (Decision 143's filter already does it). The three typed ones are offered, each once. |
| `mitigateArmor` takes `damage` straight into PROT + RES | `engine.js` ~1000 | It takes the halved damage, and the result carries `halved: { by, from, to }` (or null) for the breakdown and the audit. `absorbed` and `through` count from the halved number. |
| `soaked` means PROT + RES stopped it all | `mitigateArmor` | Unchanged, but count from the halved damage. A 6-damage hit halved to 3 and stopped by PROT 3 is still soaked, and costs the 1 Integrity. Pin it. |
| Decision 215's spendable fix showed a comment can carry an assumption | — | Read every comment in the functions you touch (`armorPiece`, `mitigateArmor`, `mitigateNatural`, `resolveHit`, `upgradeOptions`) and fix any that the change makes false. List them in the PR. |
| Smoke test "Take a hit: an Electric hit says its RES rule is unsettled; a Blade hit doesn't" | `smoke.test.mjs` ~694 | It pins F23's stub. It now asserts **no** unsettled notice on Electric. That's the test following the ruling, not a weakened guard. Say so in the PR. |
| Engine test "F23 surfaces where it bites" | `engine.test.mjs` ~1419 | Same: it now asserts `notes.length === 0` for Electric. |
| Engine test "Natural Armor … AP doesn't get past it" | `engine.test.mjs` ~1590 | Keep every assertion. Add the spell case beside it. Its `/natural armor/i` playerNote assertion goes with F25: replace it with "no note". |
| The print sheet lists installed upgrade ids under Features | `sheet.js` ~2373 | Reads the new ids as they are. Check it prints `Resistance — Electric` whole. |
| The weapon tag glossary test lists every tag a weapon carries | `engine.test.mjs` ~2455 | `Siege` already has a glossary entry, so nothing new is bare. Run it to be sure. |

## 6. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- `WISHLIST.md` W102, and `reference/rulings-2026-10-10.md` Q1–Q3, Q6, Q7.
- `SCHEMA.md` §4: Decisions **99** (the hit), **100** (upgrades, `repeatable`),
  **104** (Natural Armor, the F25 stub), **143** (Warding's three ids and a
  retired one: the model for this order), **191–192** (GM mode's hit). §5's
  F18, F23, F25 rows. INDEX tells you where each is.
- `src/engine/engine.js`: `armorPiece`/`armorState` (~848–900),
  `naturalArmor` (~906), `mitigateArmor`, `mitigateNatural`, `resolveHit`
  (~985–1120), `upgradeOptions`/`addUpgrade` (~1561–1597).
- `src/ui/sheet.js`: the hit modal (`hitInput` ~818, the panel ~866–935),
  Loadout's upgrade chips (~1825), print's Features (~2373).
- `src/data/shadows-data.js`: `armorUpgradeGlossary` (Resistance ~3835, the
  Wardings beside it), `naturalArmorRules` (~3811), `damageTypes` and
  `damageCategories` (~4121), the grenades (~3673, ~3714–3721) and the Anvil.
- `src/ui/gm.js` ~1988 (`encHitInput`) and ~2033 (notes): read, don't change.

## 7. Out of scope

- **Healing, the Reset while Dying, damage past zero** (F24, F36): P8b.
- **Elemental Immunity** on the gloves (a 50% after six seconds): its own
  question, not this flag.
- **Weapon damage feeding the hit modal.** The modal is for incoming damage
  (Decision 100). The player still picks Massive for a grenade hit.
- **EMP Shielding** and **Blackout**'s EMP: cybernetics (F6, F19).
- **GM mode**: no change to `gm.js`. If a GM test breaks for a reason other
  than the F23 note, stop and ask (§11).
- **The book.** `crb-catch-up.md` gets lines (§7d); the CRB is Ken's.

## 8. The shape

### 8a. Data

1. **`armorUpgradeGlossary`:**
   - `Resistance`: `retired: true`, keep `repeatable: true`, drop `flagged`,
     `flagNote` and `playerNote`. Description (PQ6, tool voice): it's an older
     lining with no type, it stops nothing, and to remove it and install
     Thermal, Electric or Freezing Resistance.
   - Three new entries, beside it, named like the Wardings:
     `"Resistance — Thermal"` (`halves: ["burning"]`),
     `"Resistance — Electric"` (`halves: ["electric"]`),
     `"Resistance — Freezing"` (`halves: []`, `flagged`, `flagNote` F-next,
     `playerNote`). Not `repeatable` (PQ3). Each description is 0460's,
     for its own type.
   - `halves` lists **damage type ids**, not `resClass`es: Electric and
     Energy share a class, and the lining answers one.
2. **`naturalArmorRules`:** drop `flagged`, `flagNote`, `playerNote`. Add
   `"spellApPierces": true`. Its `text` gains a clause: armor-piercing magic
   gets past it.
3. **`damageTypes`:** Electric and Burning lose `flagged`, `flagNote` and
   `playerNote`. `resClass` stays `energy`. The comment above them (~4114)
   says they're Energy by ruling (Decision N), not by stub.
4. **Grenades** (PQ5): `tags: ["Siege"]` on `fg1-thunderclap` and
   `junk-bomb`, `"Siege"` added to `hgl4-anvil`'s tags. The `grenades`
   category's `note` gains "A grenade's blast is Massive damage." The Massive
   category's `text` says "Siege weapons, vehicle guns, grenades and other
   explosives."
5. `gamedataVersion` per §2.

### 8b. Engine

1. **`mitigateArmor(damage, type, hit, armor, covered)`:** before PROT, if
   `covered` and the armor isn't Compromised or scrap (PQ2), find an
   installed upgrade whose glossary `halves` includes `type.id`. If one does,
   the damage becomes `Math.floor(damage / 2)` (PQ1) and the result carries
   `halved: { by: <upgrade id>, from, to }`. Otherwise `halved: null`. AP
   doesn't change this (PQ2). `mitigateBypass` (Massive) never halves.
   `armorPiece` should expose the installed `halves` ids, so `mitigateArmor`
   reads the piece and not the glossary again.
2. **`resolveHit`** returns `halved` at the top level beside `prot` and `res`.
   `patch` is unchanged in shape.
3. **`mitigateNatural`:** `else if (hit.ap && !(n.ignoresAp && !(hit.spell && n.spellApPierces))) out.skipped = "ap";`
   or an equivalent you find clearer. `naturalArmor()` returns
   `spellApPierces`. `hit.spell` is read only here.
4. **`applyHit`** re-resolves, so it needs nothing new. The audit label
   (`hitLabel`, `sheet.js` ~829) reads only the damage, the type and what got
   through ("Hit: 13 Electric → 4 through"), so it needs nothing either.
5. Nothing in `migrate()`, `armorWear`, `repairArmor`, `hlState` or
   `damagePrompts` changes.

### 8c. UI

1. **The hit modal** (`sheet.js`):
   - `hitInput` passes `spell: !!st.spell`. `newHitForm` starts it `false`.
   - The tick, `<label class="check"><input type="checkbox" data-hit="spell"> From a spell</label>`,
     beside Armor-piercing, shown only when AP is ticked and the character
     has Natural Armor (PQ4). Unticking AP clears it.
   - The breakdown: when `r.halved`, a line before PROT's:
     `${upgrade name} halves it: ${from} → ${to}.` When `natural.skipped === "ap"`:
     `Armor-piercing magic goes straight past Natural Armor.`
2. **Loadout** needs nothing new: the picker lists the three typed ones and
   hides the retired one. Check the chip of an installed retired Resistance
   shows its new description on hover.
3. **No change to `gm.js`.**

### 8d. Docs

1. Decision N and its three marks (§3, §3a). The flag F-next: its §5 row, its
   INDEX §2 line, the data flag.
2. **Close F18, F23 and F25**: each §5 row says closed by Decision N; each
   INDEX §2 line is struck through or marked closed as the others are; F23's
   and F25's data flags come off (§8a). F18 has no data entry.
3. **`plans/crb-catch-up.md`**: under 0460's Armor Upgrades, a line asking the
   book to say Resistance halves first, rounding down (PQ1), and which
   damage types each covers. Mark the Grenades line (~111) as built in the app
   (it stays ☐ for the book). Line ~198's Deighton list still names F23 and
   F25 as open: strike them.
4. W102: it isn't granted yet (P8b holds F24 and F36). Add a line to its
   entry: "The hit half built as P8a (Decision N)." It moves to
   `wishes-granted.md` with P8b.

## 9. Worked examples, as the tests you write

Each row is a test with this name, in the file named. **Write them first and
watch them fail on `main`**, then build until they pass. A row you can't make
pass as written is a *Stop and ask*.

The armor is the **Urban Tactics Vest** (PROT 1d6, RES 2, Integrity 20, two
mod slots, light coverage). The character is a Professional at BOD 6 with no
Natural Armor unless the row says so.

| Test name | File | Setup → result |
|---|---|---|
| `P8a 1: Electric Resistance halves an Electric hit first, rounding down` | rules | Electric installed. Electric 13, PROT 2 → halved 13 → 6, PROT 2, RES 0 (Energy), through 4. |
| `P8a 2: a halved hit PROT stops is still soaked and costs 1 Integrity` | engine | Electric installed. Electric 6, PROT 3 → 3, stopped. `soaked`, `integrityLost` 1. |
| `P8a 3: Resistance answers its own type only` | engine | Electric installed. Burning 12, PROT 2 → not halved, through 10. Thermal installed instead → halved to 6, through 4. |
| `P8a 4: Resistance skips Massive, an uncovered part and Compromised armor` | engine | Electric installed. Massive Electric 20 → `halved` null, Integrity −20. Electric 12 to the head (light coverage) → null. Electric 12 with Integrity at 0 → null. |
| `P8a 5: AP doesn't touch Resistance` | engine | Electric installed. Electric 12, AP, PROT 2 → halved to 6, RES skipped, through 4. |
| `P8a 6: the retired Resistance stops nothing and isn't offered` | engine | `upgrades: ["Resistance"]`. Electric 12, PROT 2 → through 10, no notes. `upgradeOptions` lists the three typed ones and not `Resistance`. A file with two untyped ones still reads (no throw, `armorState` lists both). |
| `P8a 7: each typed Resistance installs once` | engine | Install Electric, then Electric again → refused "Already installed." Thermal beside it → ok. |
| `P8a 8: AP on a spell gets past Natural Armor; other AP doesn't` | rules | Thick Skin rank 3, no armor. Blunt 8 AP → through 5. Blunt 8 AP, spell → through 8, `natural.skipped` "ap". Blunt 8, spell, no AP → through 5. |
| `P8a 9: Electric and Burning are Energy, and nothing calls it unsettled` | rules | Electric and Burning `resClass` `energy`, no `flagged`. An Electric hit's `notes` is empty. |
| `P8a 10: the frag grenades and the launcher carry Siege` | rules | Thunderclap, Junk Bomb, HGL-4 Anvil tags include `Siege`; Cinder, Star Dust, Shockwave, Curtain, Sunburst, Blackout don't. `Siege`'s glossary says Massive. |
| `P8a 11: GM mode's encounter hit is unchanged but for the note` | engine | `resolveEncounterHit` on the S10b fixtures (`engine.test.mjs` ~4655): every number matches `main`'s, and an Electric row's notes are empty. |
| `P8a 12: the hit modal says what halved it` | smoke | Vest worn with Resistance — Electric. Electric 13, PROT 2: the panel reads "Resistance — Electric halves it: 13 → 6." and no unsettled notice. |
| `P8a 13: From a spell shows only with AP and Natural Armor` | smoke | Thick Skin: no tick until AP is ticked; then "From a spell"; ticked, the panel says "Armor-piercing magic goes straight past Natural Armor." Untick AP → the tick goes and `spell` is false. A character with no Natural Armor never sees it. |
| `P8a 14: Loadout offers the three typed Resistances` | smoke | The picker lists Thermal, Electric and Freezing and not the untyped one. An installed untyped one shows its chip. |

Ruling tests in `rules.test.mjs` name the ruling, not the book: "Deighton's
ruling (2026-10-10, Q2): …". Rows 1, 8, 9 and 10 are those.

## 10. Tests beyond §9

- **Totality:** the degenerate-character loop (`engine.test.mjs` ~1428) runs
  `resolveHit` with `spell: true` and with the three typed upgrades installed
  on junk armor entries.
- **Voice:** the new descriptions and the F-next `playerNote` pass
  `voice.test.mjs` as they stand.
- **Mutation-test**, each must fail a test, in the log and the PR:
  halving after PROT instead of before; `Math.ceil` for `Math.floor`; the
  halving applied to Massive; `halves` matched on `resClass` instead of
  type id; the spell exception dropped; the spell exception applied without
  AP.

## 11. Steps

1. `npm run verify` on a fresh branch, with `private/` mounted
   (`git submodule update --init private`). Note the totals.
2. **Write §9's engine and rules rows. Run them on `main`'s code and keep the
   output**: each must fail, or say why it already passes.
3. Data §8a, engine §8b. `npm run test:fast`.
4. UI §8c with §9's smoke rows.
5. Run it in the dev preview (`shadows-dev-preview`): a vest with Resistance —
   Electric takes an Electric 13; a Thick Skin character takes AP from a
   spell. Screenshots if you can attach them; if not, say what you saw.
6. Docs §8d, Decision N, the flag, CHANGELOG, `npm run changelog`, versions
   per §2.
7. `npm run verify` and `npm run phone-check`.

## 12. Stop and ask

- A row of §5 turns out to be wrong, and the fix isn't a line or two.
- A test outside §5's list breaks.
- Anything in `gm.js` needs to change.
- `armorPiece`'s string filter, `migrate()` or the save shape would have to
  change.
- A player-facing "Resistance" or "RES" is ambiguous between the upgrade and
  the armor's RES stat, and §8 doesn't say which.

## 13. Close-out

The **close-the-session** skill, Rule-or-shape tier: Decision N and its
marks, the new flag, the three closed flags, STATE rewritten (P8a built, P8b
next), the log entry with the mutants, `shipped.md`'s row, W102's line,
CHANGELOG plus `npm run changelog`, versions per §2, and the plan's P8a row.

Suggested CHANGELOG lines (player voice):

- **The Resistance armor upgrade works now.** Pick Thermal, Electric or
  Freezing when you install it, and Take a hit halves damage of that type
  before your armor rolls. An older Resistance with no type stops nothing:
  swap it for one that names its type.
- **Armor-piercing magic gets past Natural Armor.** Take a hit asks whether
  an armor-piercing hit came from a spell.
- **Frag grenades and the grenade launcher are Siege weapons**, so their
  damage is Massive.

## 14. Review checklist

- [ ] §9's fourteen tests exist with those names, and the PR shows them
      failing on `main`'s code.
- [ ] §5's rows are each confirmed or corrected in the PR.
- [ ] Halving happens in one place (`mitigateArmor`), before PROT.
- [ ] No `migrate()` change, no schema bump, no upgrade entry that isn't a string.
- [ ] `gm.js` untouched; its numbers unchanged (row 11).
- [ ] Decisions 99, 100 and 104 marked; F18, F23, F25 closed; F-next opened.
- [ ] Mutants in the PR **and** the log.
- [ ] `npm run verify` and `phone-check` green; versions per §2, and the PR
      says which case.

## 15. Handing it over

Two fresh sessions, both started by Ken. The builder can't start the
reviewer: a session only starts sessions on its own model or a cheaper one.
They talk to each other directly, and Ken is in both.

### 15a. The builder (Sonnet)

Start it with the title **P8a build**, and paste:

> Read `CLAUDE.md`, then `docs/plans/sheet-wishlist/P08a-the-hit.md`, and
> build it. Ken's answers to PQ1–PQ6 are in its §4 (all six on their defaults). Follow its steps (§11) in
> order and its *Stop and ask* list (§12) exactly. If something isn't covered
> by the order, stop and ask me rather than choosing. Where the order and the
> code or the ledger disagree in a way that doesn't stop you, build what the
> order says and list it in the PR under *Where the order didn't fit*. Open a
> PR when §14's checklist holds; don't merge it.
>
> **Every claim in the PR about how the code behaves names the command or
> test that shows it** ("X doesn't run Y: `grep …`", "fails on `main`: test
> output"). A claim with no evidence is a finding in review.
>
> When the PR is open, say so here. A reviewer session will message you with
> findings. Fix them, push, and message it back with what you changed and the
> evidence for each.
>
> Six things in this order are easy to get wrong:
>
> 1. **Resistance's type goes in the id**, three new glossary entries like
>    the Wardings. Don't store it on an object: `armorPiece` drops any upgrade
>    that isn't a string, so it would silently vanish.
> 2. **Halve before PROT, in `mitigateArmor` only.** `absorbed`, `through`
>    and `soaked` count from the halved number.
> 3. **`halves` lists damage type ids, not `resClass`.** Electric and Energy
>    share a class, and the lining answers one.
> 4. **Massive never halves**; it goes through `mitigateBypass`.
> 5. **`hit.spell` matters only with AP**, and only to Natural Armor. RES
>    still skips on AP, spell or not.
> 6. **Three tests pin the stubs this closes** (§5's last rows). Change them
>    to follow the ruling and say so in the PR. Don't touch any other
>    failing test without stopping.
>
> Tier: Rule or shape. One numbered decision and one new flag (the next
> free of each). App 0.44.0; game data per §2. No schema bump. Use the
> close-the-session skill at the end.

### 15b. The reviewer (Opus), once the PR is open

Start a fresh Opus session and paste, with the PR number filled in:

> Review PR #<n> adversarially against
> `docs/plans/sheet-wishlist/P08a-the-hit.md`: the order, not just the diff.
> Check the order's §5 sweep yourself and look for what it missed, the way
> #177's review found `spendable` losing its power-rank sink. Run the tests
> and probe the behaviour against `main`; don't take the PR's claims on
> trust. First mount the CRB mirror (`git submodule update --init private`):
> a fresh worktree doesn't have it, and without it every CRB-mirror test fails
> for a reason that has nothing to do with the PR.
>
> For the mechanical parts, such as running the full suite and sorting
> environmental failures from real ones, or a read-only sweep like "list
> every player-facing string that says Resistance", use a Haiku subagent.
> Its results are leads, not findings: check anything you report yourself.
>
> Post the review on the PR: must-fix and should-fix as inline
> comments. **Nits you fix yourself in one commit on the PR branch, and say
> so in the review**; don't send them back.
>
> Then find the builder session with `ListAgents` (its title is **P8a
> build**) and message it that the review is posted, with the must-fix and
> should-fix items. When it messages back, **re-review narrowly**: its fix
> commits against your findings, plus whether a fix touched anything else.
> Don't re-review the whole PR. When nothing must-fix or should-fix is left,
> tell Ken it's ready to merge.
>
> If you can't reach the builder, tell Ken and he'll relay.
