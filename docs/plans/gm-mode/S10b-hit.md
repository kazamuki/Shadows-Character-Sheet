# Work order S10b — The hit: an NPC takes damage the way a player does

**Plan:** [`../gm-mode.md`](../gm-mode.md) §4h and §6 *S10*; GQ18, GQ23, GQ24 (new).
**Status:** **drafted 2026-10-07 by Claude (Opus)**, after #126 (S10a) merged
with its fix round (README step 7). **§4 answered by Ken, 2026-10-07**, SQ2
included: his CRB ruling on 053's "Enemy armor is static". SQ5 changed the
order: a PC row takes a hit too, after armor (§7).
**Branch:** from `main` at or after `74ec84e`, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js` (the Tables section only), `gm.js`,
the CSS, one data key, the ledger, the table schema and STATE.

**Why S10b is split again (SQ1).** The plan's S10b was five things: a hit
through the pipeline, armor numbers, At Zero and Dying for NPCs, traits with
their triggers, and Keep, Promote and a history line. Two of them don't
belong with the other three:

- **Keep, Promote and the history line write to the cast.** Decision 188
  says nothing on an encounter writes to the cast, a pack or a character.
  Reversing that in part is a decision of its own, and it needs a cast-shape
  change (`history`). That's **S10c**, the encounter's end.
- **Trait triggers aren't data.** Every trait in the Codex pack is
  `{ name, text }`. *"A Street Tough reduced to their last Health Level does
  not retreat"* is prose, and lighting it means parsing prose or a new
  authored pack field. Scott would have to author that field, so it's a
  question for him (GQ25), not a build. S10b shows traits as reminders,
  without triggers.

So **S10b is the hit**: armor, Shock, Massive, At Zero and Dying's marks
for an NPC row, and traits a tap away on the active row. **S10c** is Keep,
Promote, the history line, and anything Scott's use of S10a and S10b turns
up.

**Carried over from S10a's review** (#126, one fix round; two of its findings
were the order's):

- **A stored "state" that is really a derived one needs every writer to
  respect it.** S10a's *at Reset* was `turn === null`, and `setTurn` didn't
  know. Here: a row that is **Down** or **Dying** is read from the
  pipeline's own state (`hlState`, `isDying`), never from a flag stored on
  the row.
- **The order's turn rule broke under a mid-round edit** (the 10/8/5 case).
  That was the order's fault, not the build's. Here: §9 names the mid-hit
  edits, a row's block changed while its Hit panel is open, and a
  Condition removed between preview and apply, and §7 says the writer
  re-resolves.
- **Player voice reached a GM's panel.** Some `recovery` strings are second
  person. Here: every damage-rule `text` in the data (Shock's, At Zero's) is
  written to the player, so the Hit panel shows each prompt's **`check`**
  and the **names** of the Conditions it leads to, never its `text` (§8).

**Pre-flight** (README, *The pre-flight*), against `main` at `74ec84e`:

- **The pipeline runs on a stand-in character as it is.** A
  `newCharacter()` with its stats' `base` set to the NPC block's values gives
  `hlState(ch)` equal to `npc(block).health` for **every BOD 1–14**:
  `levels`, `hpPer` and `total`, with zero mismatches (checked: no archetype
  means no `archStatBonus`, and no advantages means no `grants`).
  `resolveHit` on that stand-in, wearing `{ id:"leather-jacket", worn:true }`,
  returns the sheet's result: 12 ballistic with PROT 3 → 5 absorbed, 7
  through, Bleeding offered. 25 Massive → 3 levels gone. **So the adapter is
  a stand-in, not a second pipeline**, as §4h asks.
- **053 already answers part of GQ18.** *"Enemy armor is static and doesn't
  roll"* (`053` *Damage and Armor*, and again in its summary box). It doesn't
  say what the static number is. The Codex's front matter says *"roll PROT +
  RES (1d4+2), or … just use the average (5)"*. 1d4 averages 2.5; rounded up
  it's 3, and 3 + RES 2 is 5. **That's the Leather Jacket and the Denim
  Jacket exactly** (PROT 1d4, RES +2): the front matter's example is one
  piece's static value, not a rule for every NPC. Only 7 of the 42 entries
  with catalog armor wear a 1d4 + 2 piece. SQ2.
- **The Codex's armor is the Gear catalog's.** 42 of 53 entries print one armor
  line whose name, before ` (`, is a body piece in `D.armor` by name (after
  folding `’` to `'`, the `_fold` of 187). Its printed PROT, RES, INT and
  coverage match the catalog's on every one. Two lines aren't in the catalog
  (*Layered Street Clothes*, the ⚠ the S9c strip left as text). One has
  trailing text that changes the rule (*Hammerlock Reaper Overcoat … with
  Warding upgrade — extends RES to magical damage*). Eleven entries (the
  roster) have no armor line. No entry has two.
- **`armorPiece`** builds coverage from `armorRules.coverageLocations`
  (light: torso; medium: + arms; full: + legs). `hitLocation` defaults to
  `armorRules.defaultHitLocation` (torso). `mitigateArmor` takes
  `hit.protRoll` and checks it against the die's max. **A static PROT is a
  `protRoll` the adapter fills in**, so `mitigateArmor` doesn't change.
- **`applyHit`'s writes** are: `trackers.damage`, `massiveLevels`,
  `witheringDamage`; `ch.armor[i].integrityLoss` and `scrapped`; Conditions
  through `addCondition` (appended, `{ id, location?, marks? }`); and one
  Death Mark through `setConditionMarks` while Dying. Nothing else. The
  encounter writer copies exactly these back to the row (§7).
- **The prompts' `text` is player voice.** `damageRules.shock.text` (*"That
  hit took half your Health Levels…"*), `atZero.text` (*"Your last Health
  Level is gone…"*). Each also has a `check` (*BOD Essence Check TN 8 TH 2*)
  and `onFail`/`onPass` Condition ids. The panel uses those.
- **`isDying(ch)`** reads `trackers.conditions` for `whileDying.condition`.
  A row's Dying is already a Condition on the row (S10a), so the stand-in
  carries it for free.
- **`atZero.freePass`** reads `ch.advantages` (Nine Lives). A stand-in has
  none, so it's never held. Correct for an NPC.
- **`naturalArmor`** reads advantages, milestones and specializations: all
  empty on a stand-in, so 0. NPC natural armor (*subdermal plating*, in two
  armor lines' trailing text) is out of scope (§6).
- **S10a's `encounterView`** derives an NPC row's Health from
  `npc(block).health` and Pain from `painFor`. A row that has lost Massive
  levels needs `hlState`'s `massive` and `capacity`. NPC rows move to the
  stand-in (§7). `painFor` stays for PC rows, and its parity test stays.
- **The ledger**, searched by name: *hit*, *armor*, *PROT*, *RES*,
  *static*, *Integrity*, *Shock*, *Massive*, *At Zero*, *Dying*, *Death
  Mark*, *trait*, *NPC*, *adapter*, *encounter*, *Take*. Hits:
  - **99** (a hit: the stages, the prompts, the one writer);
  - **100** (Loadout and recovery: armor wear, Compromised);
  - **98** (PROT doesn't layer; one worn body piece);
  - **104** (Natural Armor, F25);
  - **151** (Take a hit at zero);
  - **175** (a block stores what the book prints: armor is text);
  - **188**, **189** (the encounter, its round, Take and Heal as HP
    straight on).

  **189 is superseded in part by 191**: its *"Damage is HP straight onto a
  row (no armor, no Shock)"* now holds for Take and Heal only; every row also
  takes a hit. Nothing else is overridden. 175 stands: the block keeps the text,
  and the engine reads the catalog by name at hit time.
- **Decisions 191, 192** are free on `origin/main` and on every open branch
  (checked 2026-10-07). So are **GQ24** and **GQ25**. Check again before
  pasting.

---

## 1. Goal

A GM hits an NPC the way a player takes a hit on the sheet: damage, its
type, Regular, Withering or Massive, AP, where it lands. The app takes off
what the NPC's armor stops, by the book's rule for enemy armor, and shows what
got through, the Health Levels it costs, and what the hit asks for (Shock,
At Zero, a Death Mark, the Conditions its type causes). The GM answers what
they rolled, and it lands on the row. The NPC's traits are a tap away while
it's their turn.

**Done when:**

- Switched off: nothing changes anywhere.
- An NPC row (cast or entry) whose block has a BOD has **Hit** beside Take
  and Heal. An NPC with no BOD doesn't, and keeps Take and Heal.
- **A PC row has Hit too, after armor** (SQ5): the GM enters what got
  through, as the player calls it out, and its type. The row takes it, its
  Health follows from the GM's own HP and Health Levels, the Conditions its
  type causes are offered, and Shock and At Zero show as reminders of the
  check the player makes on their sheet.
- The row shows its armor on one line: the piece's name, what it stops
  (*stops 5*), and its Integrity (*INT 10/10*), or the printed line marked
  *not in the Gear tables*, or nothing.
- **Hit** opens a panel in place. As the GM fills it in, the panel previews
  the result (*Leather Jacket stops 5 · 7 through · 1 Health Level*) and the
  prompts the hit raises. **Apply** writes it. Every number on the row
  follows.
- A hit while Dying adds a Death Mark to the row's Dying. Massive takes
  levels away outright, and the row says how many are gone.
- The active row shows its traits' names, each one's text a tap away.
- Export, import, reload and a 0.5 table keep every field. A 0.5 table opens
  as 0.6 with no armor wear and no Massive levels on any row.
- A hostile table opens, its new numbers come out numbers, and nothing
  renders as markup.
- `npm run verify` and `npm run phone-check` pass. The Hit panel is checked
  by hand at 390px, 768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (an NPC's armor rule, the table's shape, a
  pipeline adapter).
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** **no bump.** One key is added, `armorRules.enemyText`,
  which no character can observe (Decision 68).
- **Character schema, pack schema:** unchanged.
- **Table schema:** **0.5 → 0.6**, with `migrateTable()`'s step.
- **Reserved:** Decisions **191, 192**; **GQ24** (do NPCs make the At
  Zero check?) and **GQ25** (trait triggers as a pack field) in the plan's §9.
  No F-flag: no player rule changes.

## 3. The decisions, drafted

Paste after 190, under INDEX §3's **GM mode** heading, filling **Built**.
Count each with `wc -w`; the cap is 350.

```
191. **An encounter row takes a hit: an NPC's through the sheet's own pipeline, standing in as a character, its armor the Gear catalog's piece by name and static (053); a PC's after their armor.**
     *2026-10-0X · Ken + Claude · Touches: hit, NPC adapter, stand-in, resolveHit, applyHit, encounter row, armor, Gear catalog, PROT, RES, static armor, Integrity, scrap, Massive, Withering, PC row, table schema 0.6, massive, armorLoss, scrapped, GQ18, Decision 99, Decision 100, Decision 175, Decision 189*
     - **Decided:** an NPC row whose block has a BOD is hit by `resolveHit` and `applyHit` on a stand-in: `newCharacter()` with the block's stats and the row's damage, Massive levels and Conditions, wearing the first armor line whose name is a catalog body piece. Enemy armor doesn't roll: PROT is the die's average rounded up, so 1d4 + 2 stops 5. A line the catalog lacks stops nothing. A PC row takes what got through, as the player calls it, read against the GM's own numbers. Rows store Massive levels, NPC rows their armor's wear.
     - **Why:** one pipeline (§4h); the stand-in's Health matches `npc()` at every BOD. The Codex's armor is the catalog's. 053 says enemy armor is static, and the Codex's (5) is the 1d4 + 2 piece's average rounded up. A PC's armor is on their sheet.
     - **Rejected:**
       - An NPC-only pipeline: two rules to keep in step.
       - A PC row through the pipeline on the GM's numbers: it would guess their armor and advantages.
       - A flat 5: true for 7 of 42 armored entries.
       - Parsing the printed PROT and RES: the catalog has them.
       - Wear written to the cast: S10c's.
     - **Replaces:** Decision 189 in part: "Damage is HP straight onto a row (no armor, no Shock)" now holds for Take and Heal only.
     - **Revisit if:** seats arrive (S3b: a claimed PC row takes the whole hit on a copy of the character, never written back), GQ18 is answered otherwise, or NPC natural armor arrives.
     - **Built:** table schema 0.6; PR #__; log 2026-10-0X.

192. **A hit asks an NPC what it asks a player: Shock, At Zero and a Death Mark while Dying, each offered and none forced, and the active row shows its traits as reminders.**
     *2026-10-0X · Ken + Claude · Touches: Shock, At Zero, Dying, Death Mark, onFail, onPass, inflicts, Conditions from a hit, source, traits, reminders, active row, GQ23, GQ24, GQ25, F24, F36, Decision 99, Decision 151, Decision 189*
     - **Decided:** the Hit panel shows each prompt `resolveHit` raises by its `check` and the names of the Conditions it leads to, never its player-voiced `text`. On an NPC row the GM answers Passed or Failed, or leaves it: an unanswered prompt adds nothing, and the row reads Down. On a PC row Shock and At Zero are reminders of the check the player makes on their sheet, with nothing to answer. A hit while Dying adds a Death Mark, as on the sheet. The Conditions a hit's type causes are offered, the type's always-ones ticked, and land on the row with the hit's From as their source and no rounds. The active row lists its block's traits by name, each one's text a tap away; nothing lights on a trigger.
     - **Why:** the players' rule, applied as GQ23's default applies Pain; a GM who drops an NPC at zero just doesn't answer. Triggers are prose in the Codex, so lighting them would be a guess.
     - **Rejected:**
       - At Zero forced for every NPC: a mook doesn't need a check (GQ24).
       - Prompts' text as written: it speaks to the player.
       - Triggers parsed from trait text: a guess at the book's meaning.
       - Traits on every row: thirteen rows of text; the GM needs the one whose turn it is.
     - **Replaces:** nothing.
     - **Revisit if:** GQ24 says NPCs drop at zero, GQ25 gives traits a trigger field, F24 or F36 is answered.
     - **Built:** as 191.
```

**Supersession marks:** 189 *in part* → **superseded in part by 191**, in
the ledger (`→ **Superseded in part by Decision 191** — every row also
takes a hit; Take and Heal stand`) and its INDEX line. If the ledger search
at build time finds anything else either overrides, stop and ask.

## 4. Questions for Ken

Answered by Ken, 2026-10-07. SQ5 changed the order.

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **Split S10b again:** S10b is the hit (armor, Shock, Massive, At Zero, Dying's marks, traits as reminders). S10c is the encounter's end (Keep, Promote, the history line, writing back to the cast), which reverses part of 188. | **Yes** | **Yes** |
| SQ2 | **Enemy armor's static number** (`053`: "static and doesn't roll"; Ken's CRB, so his ruling). | **The PROT die's average rounded up, plus RES where the type allows** (1d4 → 3, 1d6 → 4, 1d8 → 5). It reproduces the Codex's "(5)" for its 1d4 + 2 example | **Yes** |
| SQ3 | **Which armor:** the first armor line whose name, before ` (`, is a catalog body piece (apostrophes folded). A line that isn't in the catalog is shown, marked *not in the Gear tables*, and stops nothing. Trailing text (*with Warding upgrade…*) is shown under it and not applied. | **Yes** | **Yes** |
| SQ4 | **At Zero and Shock for NPCs:** offered by the players' rule, each answerable or left blank. Blank adds nothing, and the row just reads Down. Goes to Scott as GQ24. | **Offered, not forced** | **Yes** |
| SQ5 | **A PC row takes no hit.** The player takes it on their sheet and calls out the result; the GM's row keeps Take and Heal. | **Yes** | **Changed:** a PC row takes a hit too, so the GM can keep track. **After armor:** the GM enters what got through, as the player calls it, and the type; the row's Health follows from the GM's own numbers, the type's Conditions are offered, and Shock and At Zero are reminders of the player's check (§7, §8). Once seats exist (S3b), a claimed row takes the whole hit on a copy of the seated character (191's *Revisit if*) |
| SQ6 | **Take and Heal stay on NPC rows** beside Hit, for the GM who already knows the number. | **Yes** | **Yes** |
| SQ7 | **Traits on the active row only**: names, each one's text a tap away. Every row's traits are also on its entry's or member's page, a tap away from its name. | **Yes** | **Yes** |
| SQ8 | **The Hit panel has a From field** (*Rook's SMG*). A Condition the hit causes takes it as its source; rounds are left blank. | **Yes** | **Yes** |
| SQ9 | **Armor wear stays on the row:** Integrity lost to soaked hits and Massive, and scrap. It never reaches the cast member in S10b. The end-of-encounter wear roll (1d4–1d10 by difficulty) is S10c's. | **Yes** | **Yes** |

## 5. Read first

- `CLAUDE.md` whole: constraints 7, 8, 9 and 10; *Decisions*; *Flags*.
- `docs/STATE.md` whole.
- The plan: §4h, §6 *S10*, §9 GQ18, GQ23.
- `docs/SCHEMA.md` §4: Decisions **98**, **99**, **100**, **104**, **151**,
  **175**, **188**, **189**; §5's **F24**, **F25**, **F36**.
- `private/crb/053_Combat_Encounters.md`: *Damage and Armor* and its summary
  box (*"Enemy armor is static"*). `054_Conditions_and_Recovery.md`: Shock,
  At Zero, Dying. `Gear.md`: armor, coverage, Integrity.
- **The code:** `engine.js`'s `newCharacter`, `statValue`, `health`,
  `hlState`, `painState`, `armorPiece`, `armorState`, `hitArmor`,
  `hitLocation`, `mitigateArmor`, `mitigateBypass`, `isDying`,
  `damagePrompts`, `hitPrompts`, `resolveHit`, `applyHit`, `_fold`, `npc`,
  and S10a's Encounters section (`_encRow`, `_encounters`, `_rowTotals`,
  `_rowBlock`, `encounterView`, `painFor`, `participantDamage`). `sheet.js`'s
  *Take a hit* (`hitPanelHtml`, `hitInput`, `hitChoices`): what the GM's
  panel should feel like, not code to share. `gm.js`'s Encounters tab, the
  Take form (`data-edmg`), `TIPS.condition`.

## 6. Out of scope

- **S10c:** Keep, Promote, the history line, anything written to the cast,
  a pack or a character, and the end-of-encounter wear roll.
- **A PC's armor, Natural Armor or advantages in a hit.** A PC row takes
  what got through (SQ5). The whole hit on a PC waits for seats (S3b).
- **NPC natural armor** (subdermal plating, a trait that stops damage), and
  armor upgrades read from text (Warding).
- **Trait triggers**, and anything that parses a trait's text.
- **Withering's bookkeeping.** `applyHit` writes `witheringDamage`; the
  encounter drops it. It matters to healing over downtime, which an encounter
  doesn't have.
- **Pain applied** to anything (GQ23), rolling anything, Surprise, Ambush,
  Delay, the Encounter Design worksheet.
- **Any change to the sheet's pipeline** (`resolveHit`, `applyHit`, the
  `mitigate…` stages, `damagePrompts`, `hitPrompts`), the sheet's UI, or
  the Gear data. The adapter calls them; it changes none of them.
- Any pack change, any Codex word in `src/` or `tests/`.

## 7. The shapes

**The row, schema 0.6** (added to 188's shape):

```js
Row = {
  …S10a's fields…,
  massive: 0,        // Health Levels gone to Massive damage: whole number ≥ 0 (every kind of row)
  armorLoss: 0,      // Integrity its armor has lost in this encounter: whole number ≥ 0 (NPC rows; 0 on a PC row)
  scrapped: false    // its armor was taken to 0 by Massive (NPC rows; false on a PC row)
}
```

**The gate** (`migrateTable`, step *Schema 0.6 (Decision 191): a row keeps
its Massive levels and its armor's wear*): before 0.6, every row gets
`massive: 0, armorLoss: 0, scrapped: false`. Then every load: `massive` and
`armorLoss` through `_int`, floored at 0, else 0; `scrapped === true`;
`armorLoss` and `scrapped` `0`/`false` on a PC row (`massive` is kept: a PC
row takes Massive levels the player calls out). No cap here: the readers cap (`hlState`
caps Massive at the levels, `armorPiece` caps the loss at the piece's
Integrity), so a block edited smaller never makes a stored number invalid.

**The data:** `armorRules.enemyText: "Enemy armor is static and doesn't roll."`
(053's words; the Hit panel shows it beside the armor line). No other data
change.

**Engine** (Tables section, *The hit (Decisions 191–192)*). Same rules as
S10a: writers take the table first, stamp it, and return `{ ok: true, … }`
or `{ ok: false, why }` with nothing changed; readers are total.

| Function | Does | Refuses / returns |
|---|---|---|
| `encounterArmor(block)` | **reader**: `{ line, piece, extra, stops }` for the first armor line whose name (the text before ` (`, folded by `_fold`) is a catalog body piece's: `line` the printed text, `piece` the catalog def, `extra` any text after the closing `)` (trimmed of a leading `—`), `stops` `{ prot, res }` (§SQ2: `prot` = `ceil((dieMax + 1) / 2)`, `res` the piece's). No line matches: `{ line: <the first non-blank line> or null, piece: null, extra: "", stops: null }` | never throws; `null` block → all null |
| `_staticProt(piece)` | `ceil((dieMax(piece.prot) + 1) / 2)`, or null when the die doesn't parse | — |
| `_standIn(t, row)` | **private**: `null` for a PC row or a block with no BOD. Else a `newCharacter()` with `stats[id].base` = the block's value for each stat it has (blank stats keep `newCharacter`'s default), `armor` = `[{ id: piece.id, worn: true, integrityLoss: row.armorLoss, scrapped: row.scrapped }]` when `encounterArmor` matched, else `[]`, and `trackers.damage`, `massiveLevels`, `conditions` from the row (**a deep copy**: the stand-in never shares an object with the row) | — |
| `resolveEncounterHit(t, encId, rowId, hit)` | **pure**. A PC row takes its own path (below). An NPC row: `resolveHit(standIn, { ...hit, protRoll: <static PROT> })` when the hit is covered, `hit.protRoll` ignored. Returns its result plus `armor: encounterArmor(block)` and `from: _str(hit.from).trim()` | no such row; ended; an NPC with no BOD (*"Their block has no BOD, so there are no Health Levels to hit. Use Take."*); and every `resolveHit` refusal, word for word |
| `applyEncounterHit(t, encId, rowId, hit, choices)` | **re-resolves first** (nothing written on a refusal). Then runs `applyHit` on a fresh stand-in and copies back exactly: `damage`, `massive` (`massiveLevels`), `armorLoss` and `scrapped` (from `ch.armor[0]`, when there is armor), and the Conditions: **the row's own entries keep their `source`, `rounds` and `note`**, with `marks` taken from the stand-in's entry at the same index (the Death Mark). Each Condition `applyHit` appended joins the row with `source: from`, `rounds: null`. `witheringDamage` is dropped (§6). Returns `{ ok, added, skipped }` as `applyHit` | as resolve |

`choices` is `applyHit`'s: `{ shock: "pass"|"fail", atZero: "pass"|"fail",
conditions: [id] }`. An absent answer adds nothing (SQ4).

**A PC row's hit** (SQ5) takes the same two functions, on a path of its own,
because a PC row has no block, no armor and no stand-in:

- **`hit`:** `{ damage, damageType, category, location, from, gone }`.
  `damage` is **what got through**, after the player's armor. For a Massive
  hit, `gone` is the Health Levels the player calls out and `damage` is
  ignored, because Massive deals levels, not HP (`mitigateBypass`'s
  `through` is 0). `ap` and `protRoll` are ignored.
- **Refuses** with the same words as `resolveHit` for a blank damage or
  `gone`, a type or a category it doesn't know, and on an ended encounter.
- **Returns** `{ ok, pc: true, through, gone, before, after, lostThisHit,
  prompts }`. `before` and `after` are `{ total, left, levels,
  levelsLeft, lost, down }` from the row's own `hp` and `levels`, by
  `hlState`'s rule: emptied = `min(levels − massive, floor(damage /
  hpPer))`, capacity = `total − massive × hpPer`, left = `max(0, capacity −
  damage)`, down when `damage ≥ capacity`. **This is one helper, `_pcHealth(row,
  over)`, shared with `encounterView`'s PC row** (which then also counts
  `massive`). A PC row without `hp` and `levels` that divide gets `before` and
  `after` with nulls.
- **`prompts`:** `conditions` and `always`, as `hitPrompts` builds them
  (the type's and category's `inflicts`, filtered to known ids); `shock` as
  **a reminder**, `{ check, onFail }`, when the levels are known and
  `lostThisHit ≥ ceil(levels × shock.fractionOfMaxLevels)` and the row isn't
  down after; `atZero` as a reminder `{ check, onPass, onFail }` when the hit
  did damage, the row is down after and it isn't Dying, as `damagePrompts`
  has it; `deathMark` when the hit did damage and the row has Dying.
- **`applyEncounterHit`** adds `damage` (or `gone` to `massive`, capped at
  the row's `levels` when known), the ticked Conditions (`choices.conditions`
  only; a location Condition lands on `location`), each with the From as
  source and `rounds: null`, and one Death Mark while Dying. It **never adds
  a Shock or At Zero Condition**: the player rolls those on their sheet and
  calls out the result, and the GM adds it with *Add a Condition*.
- **Parity:** `_pcHealth` against `hlState`, and the reminders against
  `hitPrompts`, on a synthetic character whose levels and HP per level
  match the row's, at every damage from 0 to its total and with Massive
  levels 0–2 (§9).

**`encounterView`'s `health`** for an NPC row now reads the stand-in:
`total` from `hlState(s).total`, `left` from `hpLeft`, `down`,
`levels`, `levelsLeft = levels − lost`, a new **`gone`** (`massive`), and
`pain` from `painState(s)` (`level`, `label`, `description`,
`fromConditions`). With no stand-in (no BOD), no totals: S10a's behaviour.
**A PC row** reads `_pcHealth` (the GM's own numbers, now with `massive`)
and `painFor`, and gains `gone` too. Each row view
gains **`armor`** (`encounterArmor`, plus `integrity` and `integrityMax`
from `armorPiece` on the row's wear, and `compromised`), and **`traits`**
(the block's traits with a name or text, `{ index, name, text }`).

**Where the record lives:** *Apply* writes the row only. Nothing on an
encounter writes to the cast, a pack or a character (188, unchanged).

## 8. The UI

All in `gm.js` and the CSS, in GM-facing tool voice. Drafts marked ✎ are
for a voice pass. **Built for a tablet** (§1a): every control a tap, at least the
sheet's tap size. The Hit panel fits at 390px with no sideways scroll.

**A row's armor line** (NPC rows with an armor line), under Health, in its
small mono type:

- matched: ✎ *Leather Jacket · stops 5 · INT 10/10*. When Compromised:
  *INT 0/10 · Compromised: RES is gone*. When scrapped: *Scrap*. The piece's
  name is plain text (there is no armor tip kind; adding one is not this
  session's).
- not matched: ✎ *Layered Street Clothes (PROT 1d4, RES +2, INT 10) · not in
  the Gear tables*.
- `extra`, when there is any: on its own line under it, small.

**Hit** (NPC rows with a stand-in, and every PC row; not on an ended
encounter, not at Reset).
It sits between **Take** and **Heal**, and opens a panel in place, as Take's
field does (one panel open on the encounter at a time: opening Hit closes
Take or a Condition form, and the other way round):

- **Damage** (number), **Type** (the data's damage types), **Regular /
  Withering / Massive** (a toggle, Regular pressed), **AP** (a toggle),
  **Where** (the body parts, Torso selected), **From** (text, optional,
  placeholder ✎ *Rook's SMG*).
- **The preview**, live as the fields change (`resolveEncounterHit`):
  - one line: ✎ *Leather Jacket stops 5 (PROT 3 + RES 2) · 7 through · 1
    Health Level*, with *RES doesn't apply: AP* (or *: Compromised*, or *: not
    against Energy*) when it's skipped; *Not covered: Head* when the piece
    doesn't cover where it landed; *Massive: 3 Health Levels gone* for
    Massive;
  - `armorRules.enemyText` beside the armor, small;
  - a refusal (*Enter the damage.*) in place of the preview, not as a notice.
- **The prompts**, under the preview, each only when raised:
  - **Shock:** ✎ *Shock: BOD Essence Check TN 8 TH 2. Failed: Unconscious,
    Prone.* with **Passed** and **Failed** (a toggle; neither pressed);
  - **At Zero:** ✎ *At zero: WILL Essence Check TN 8 TH 2. Passed:
    Unconscious, Prone. Failed: Dying.* with **Passed** and **Failed**;
  - **Dying:** ✎ *Dying: this hit is a Death Mark.* (no buttons; it's
    applied);
  - **Conditions:** ✎ *This hit can cause:* each offered Condition a
    checkbox with its name (its rule a tap away, `TIPS.condition`), the
    type's always-ones ticked.
  - Every name comes from the data (`conditionById(id).name`); no prompt's
    `text` is shown (Carried over).
- **Apply** (primary) and **Cancel**. Apply is disabled while the preview is
  a refusal.

**A PC row's Hit panel** (SQ5) is the same panel with three differences:

- **Damage** is labelled ✎ *Got through* (what's left after their armor),
  and there is no **AP** toggle and no armor line. With **Massive** pressed,
  *Got through* gives way to ✎ *Health Levels gone*.
- **The preview** reads ✎ *7 through · 1 Health Level*, or just ✎ *7
  taken* when the row has no HP and Health Levels to read.
- **Shock and At Zero are reminders, not questions:** ✎ *Shock: they make
  a BOD Essence Check TN 8 TH 2 on their sheet. Failed: Unconscious, Prone.*
  No Passed or Failed. The GM adds what the player calls out with *Add a
  Condition*. *Dying: this hit is a Death Mark.* and the offered Conditions
  are as an NPC's.

**Traits** (the active row only, running encounters): a line ✎ *Traits:*
then each trait's name as a tag button whose tip is its text (a new
`TIPS.enctrait` kind keyed `rowId|index`, read from the row's view; S9a's
`TIPS` guard covers it). A row with no traits shows nothing.

**Where things land:**

| Press | The record | The view | Focus |
|---|---|---|---|
| **Hit** | — | the panel opens on the row; Take's field or a Condition form closes | **Damage** |
| A field in the panel | — | the preview and prompts redraw; the field keeps its value and its caret | the same field |
| **Passed** / **Failed** | — | the toggle shows it | the same toggle |
| **Apply** | the row's damage, Massive, wear, Conditions, marks | the panel closes; the row's Health, armor line and chips follow | the row's **Hit** |
| **Apply**, refused (the row changed under it) | — | the refusal in the panel | **Apply** |
| **Cancel** | — | the panel closes | the row's **Hit** |
| **Next** with a Hit panel open | `turn` | the panel stays open on its row, its fields kept (S10a's Take field does the same: `next` doesn't clear `S.encDmg`) | **Next** |
| A trait's name | — | its tip opens | the tip, as every tip |

**What a refused or empty value shows:** Damage blank is *Enter the
damage.* in the preview, and Apply stays disabled. A number field that can't
be a whole number shows the preview's refusal. An unanswered prompt is
allowed (SQ4).

**Copy** (✎ throughout; tool voice). No flag id, no "S10c", no "coming
soon" (constraint 9).

## 9. Tests

**`tests/engine.test.mjs`**, *The hit (191–192)*, synthetic names only:

- **Parity:** for BOD 1–14, `encounterView`'s NPC `health` (`total`,
  `levels`) equals `npc(block).health`, as S10a's did. With damage, it
  equals S10a's numbers (no Massive), so S10a's health tests pass unchanged.
- `encounterArmor`: a catalog name (with `’`), a name with trailing
  text (`extra`), a line not in the catalog, two lines (the first matched
  wins), none, a `null` block. `stops` for 1d4 + 2 is `{ prot: 3, res: 2 }`;
  1d6 → 4; 1d8 → 5. **The Codex's own example:** a 1d4 + 2 piece stops 5.
- `resolveEncounterHit`: refuses a no-BOD NPC row and an ended
  encounter, and passes `resolveHit`'s refusals through word for word.
  It ignores a `protRoll` passed in, and uses the static one. **It's pure**
  (the table deep-equals before and after).
- Against the sheet: a synthetic character with the same BOD and the same
  piece, hit with the same numbers and `protRoll` = the static PROT, gives
  the same `absorbed`, `through`, `levelsLost`, `after.lost` and prompts as
  the row. **This is the adapter's parity test.**
- `applyEncounterHit`: damage and Massive land; a soaked hit costs 1 INT
  (`armorLoss`); Massive to 0 scraps; a Compromised piece skips RES;
  AP skips RES; an uncovered location skips the armor. Conditions:
  an existing Condition keeps its `source` and `rounds`; a new one gets the
  hit's From and `rounds: null`; a location Condition lands where the hit
  landed; Shock failed adds Unconscious and Prone; At Zero failed adds
  Dying; **unanswered adds nothing**; a hit while Dying adds one mark and
  keeps the Dying entry's source and rounds. `witheringDamage` isn't on the
  row. Nothing on the cast or a pack changes.
- **A PC row's hit** (SQ5):
  - *Got through* lands as damage, and Massive's *gone* adds to `massive`
    (capped at the levels);
  - the type's Conditions are offered and the ticked ones land with the From;
  - Shock and At Zero come back as reminders, and **apply adds neither
    Condition** (an `atZero: "fail"` passed in is ignored);
  - a hit while Dying adds a mark;
  - a PC row with no HP or Health Levels takes the damage with null figures.
  - **Parity:** for a synthetic character at each BOD 1–14, a PC row with
    `hp` and `levels` set to that character's `health()`: `_pcHealth` against
    `hlState`, and the reminders against `hitPrompts`' `shock` and `atZero`,
    at every damage from 0 to its total, with Massive 0, 1 and 2. The same
    answer every time. (A row whose HP per level no BOD gives, 36 over 6,
    is still read by the same helper; the parity runs where a character
    exists to compare.)
  - S10a's PC Health tests pass unchanged with `massive` 0.
- **The re-resolve:** remove a Condition between a resolve and an apply,
  or change the block's BOD: the apply reads the row as it is now.
- Every writer refuses on an ended encounter and leaves the table deep-equal
  (add `applyEncounterHit` to S10a's list).
- `newTable()` and a 0.5 table: rows have `massive: 0, armorLoss: 0,
  scrapped: false`, and everything else deep-equals.

**`tests/hostile.test.mjs`**, the encounter file: `massive`, `armorLoss` as
strings, `-3`, `1e400`, objects (→ numbers ≥ 0 or 0); `scrapped: "yes"` (→
false); `massive: 99` on a BOD 4 row (opens, reads all levels gone, no
throw); a PC row with all three set (→ 0, 0, false); a block armor line of
`<img onerror>` (renders as text, matches nothing). The PC row keeps its
`massive` (a whole number ≥ 0) and loses `armorLoss` and `scrapped`.

**`tests/smoke.test.mjs`**, switched on:

- An entry row from a synthetic pack whose block wears a catalog piece: the
  armor line reads its name, *stops 5* and *INT 10/10*; **Hit** with 12
  ballistic to the torso previews *stops 5 · 7 through*; Apply: the row's
  HP and Health Levels follow and Bleeding is offered and ticked.
- A hit big enough for Shock: the prompt shows the check and *Unconscious,
  Prone*, never Shock's `text`; Failed and Apply: both chips appear with the
  From as their source.
- At zero: the At Zero prompt; left unanswered, Apply: the row reads Down
  and has no new Condition.
- A PC row (HP 30, Health Levels 6) has Hit: *Got through* 12, Ballistic:
  the row reads *HP 18 / 30* and *4 of 6 Health Levels*, Bleeding is
  offered, and a big enough hit shows the Shock reminder with no buttons.
  A cast row whose member has no BOD has no Hit.
- The active row lists its traits; the tip opens with the text.
- Focus, per §8's table: Hit → Damage; Apply → the row's Hit; Cancel → Hit.
- Switched off: no Encounters tab, as before.

**Mutation-test** (record each in the PR, and what failed). Check each for
a second path that covers the same line before naming it:

1. **The stand-in shares the row's Conditions array** (no deep copy) → the
   purity test.
2. **The GM's `protRoll` used instead of the static one** → the
   resolve test.
3. **`_staticProt` rounds down** → the 1d4 + 2 stops 5 test.
4. **An existing Condition's source dropped on apply** → the apply test.
5. **A new Condition without the hit's From** → the apply test.
6. **An unanswered At Zero treated as Failed** → the unanswered test.
7. **`armorLoss` kept on a PC row by the gate** → the hostile test.
8. **`applyEncounterHit` writing before it re-resolves** (a refused apply
   leaves a change) → the re-resolve test.
9. **A prompt's `text` rendered** → the smoke Shock test.
10. **Massive levels not passed to the stand-in** → the parity test with
    Massive.
11. **A PC row's apply adds At Zero's Condition** → the PC hit test.
12. **`_pcHealth` ignores `massive`** → the PC parity test.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and
after each step.

1. Confirm 191–192 and GQ24–25 free on `origin/main`. Search the ledger
   again for §0's names.
2. **The gate:** `TABLE_SCHEMA_VERSION` 0.6, the step, the coercion, and
   the three fields in `addParticipant`, `_entryRow` and
   `participantFromEntry`. Hostile tests.
3. **The armor reader and the stand-in:** `encounterArmor`,
   `_staticProt`, `_standIn`, `armorRules.enemyText`. The parity tests.
4. **The hit:** `resolveEncounterHit`, `applyEncounterHit`, their tests.
5. **`encounterView`** on the stand-in for NPC rows (Health, Pain, `gone`,
   `armor`, `traits`). S10a's tests pass unchanged.
6. **The UI:** the armor line, Hit and its panel, the prompts, the traits
   on the active row, `TIPS.enctrait`.
7. **In the browser** (`shadows-dev-preview`, `?gm=on`, the real Codex
   pack): a running encounter with Corner Crew and Lobby Detail. For **every
   row**, read the armor line against the entry's printed armor and the
   Gear table (S9c's lesson). Then hit:
   - a Street Tough: 12 ballistic to the torso;
   - an arm on a Light-coverage piece (not covered);
   - an Energy hit (RES skipped);
   - AP;
   - Massive to scrap;
   - one hit to Shock (Failed);
   - one to zero (At Zero left unanswered, then another row Failed into
     Dying, then a hit while Dying: a mark).

   Then **at 768 × 1024**: the panel open, the active row and **Next**
   still on screen. **At 390px**: no sideways overflow with the panel open
   and every prompt showing.
8. The mutations (§9).
9. Ledger, INDEX, plan, STATE, docs, close-out (§12).

## 11. Stop and ask

- 191, 192, GQ24 or GQ25 are taken.
- The stand-in needs a change to `resolveHit`, `applyHit`, a `mitigate…`
  stage, `hlState`, `painState` or `newCharacter` to give the right answer.
- An entry's printed armor matches a catalog name but its printed numbers
  don't match the catalog's.
- A prompt can't be shown without its player-voiced `text` (a prompt with no
  `check`).
- Anything needs a rules answer: what an NPC's armor stops beyond SQ2,
  natural armor, a Death Mark's count beyond the sheet's, Pain applied.
- The tablet check fails and the fix is a layout change outside the
  Encounters tab.
- A decision goes over 350 words.
- A test outside the ones named fails and the fix isn't obviously yours.

## 12. Close-out

*Rule or shape* tier, switched off:

- **SCHEMA:** 191 and 192; 189 marked *superseded in part by 191*; §3's
  table block gains the row's three fields.
- **INDEX:** two lines under **GM mode**; 189's line marked.
- **STATE:** §1's GM clause gains the hit (191–192); §3 and §5: S10b
  built, switched off, and S10c next (Keep, Promote, the history line), or
  whatever Scott's use says.
- **The plan:** §6 *S10*'s split paragraph names S10b (built) and S10c
  with its list. §9 gains **GQ24** for Scott (*Do NPCs make the At Zero
  check, or drop at zero? Default: offered, never forced; the GM leaves it
  unanswered to drop them*) and **GQ25** for Scott (*Should a trait carry a
  trigger the app can light, "at their last Health Level", as a field in
  the pack? Default: no; traits are text, shown on the active row*). GQ18's
  row records SQ2's answer (Ken, 2026-10-07: 053's static armor, the die's
  average rounded up plus RES; the Codex's "(5)" is the 1d4 + 2 piece's).
  §6 *S3b* gains: *a PC row claimed by a seat takes the whole hit on a copy
  of the seated character, never written back (191)*.
- **`changelog-pending.md`:** ✎ *Hit an NPC the way the sheet takes a hit:
  their armor, Shock, Massive damage, At Zero and Dying, by the book's
  rules for enemies, and their traits on screen when it's their turn.*
- **Log** entry; **shipped** row *(switched off)*; README's table: S10b's
  row.
- **PR** titled `feat(gm): an NPC takes a hit through the sheet's
  pipeline, switched off (W29 S10b, Decisions 191–192)`. Body: what
  changed; the mutations; the browser check (including the tablet); **Where
  the order didn't fit**.

## 13. Review checklist

- [ ] In the browser with the real pack: every row's armor line against the
      book and the Gear table; each hit in §10 step 7, read against
      a hand calculation.
- [ ] The adapter's parity test compares against the sheet's own
      `resolveHit`, not a copy of its arithmetic.
- [ ] No prompt's `text` reaches the screen (grep the rendered panel for
      "your").
- [ ] An existing Condition's source and rounds survive a hit; a new one
      has the From.
- [ ] At 768 × 1024 the Hit panel, the active row and **Next** are on screen
      together. At 390px: no sideways overflow with every prompt showing.
- [ ] Every focus in §8's table, pressed, not assumed.
- [ ] A 0.5 table opens; the hostile table opens; nothing renders as markup.
- [ ] Nothing in the sheet's pipeline or UI changed (`git diff` on
      `resolveHit`, `applyHit`, the `mitigate…` stages, `sheet.js` is empty).
- [ ] Two mutations re-run locally.
- [ ] No version bump but the table schema; `changelog-pending.md` has the
      line.
