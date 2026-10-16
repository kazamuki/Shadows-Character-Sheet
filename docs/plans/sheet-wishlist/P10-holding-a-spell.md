# Work order P10: Holding a spell

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3.

**Scope:** **W87**. Deighton's ruling of 2026-10-10 (`reference/rulings-2026-10-10.md` Q17–Q19) replaces `0480`'s "dice equal to its Threshold":
- a Concentration spell is held only once it succeeds;
- holding it sets aside **one die** from every Essence roll;
- an Arcanist holds at most their **Evocation rank** in spells;
- anything that would break concentration calls for a **WILL Essence check**, whose TN and TH aren't set yet.

Opens **one flag** (the check's TN and TH, the next free F-number), unless Deighton has set them by the time you build.

**Status:** **drafted 2026-10-15 by Claude (Opus)**, pre-flighted against `main` at `cd5146f` (P17, #192, merged; app 0.45.0, game data 0.38, character schema 0.25). The 0.45.0 release PR (#193) was open when this was written. **Ken answered PQ1–PQ7 on 2026-10-15** (§4): all seven take their defaults. F-next opens unless Deighton has set the check's TN and TH.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md) (*The cadence*). Ken starts **P10 build** (Sonnet) and, once the PR is open, a fresh reviewer (Opus).

**Carried over from P17's review:**
- **The order's miss:** §5 named `archetypePowers`' own readers but not *their* readers (`naturalArmor`, `archetypeWeapons`, `powerCpState`, the print sheet). All four were fine, found only by the review's grep. **Applied here:** §5 goes one level further: for each function P10 changes, the readers of the readers that render something.
- **The build:** nothing to carry. The PR was clean. Its "Where the order didn't fit" list was the most useful part of the PR body; keep doing it.
- **The review's one nit:** a confirm that asserted something without checking it ("no longer held"). **Applied here:** every confirm and refusal in §8 is computed by the engine, never written from what the UI assumes.

**What P10 is.** Today Concentration is a line in the Spellcraft reference (`spellRules.concentration`, and the `Concentration` tag's description), and both still say `0480`'s "dice equal to its Threshold". A player holding Fog Shroud has to remember the missing die on every Essence roll, and the Grimoire's **Beyond your pool** reads the full Evocation rank (`castingPool`, `engine.js` ~2661, whose comment says "Concentration's held dice are the table's to count"). P10 makes a hold something the sheet records:
- **Hold** on a Concentration spell in the Grimoire;
- the set-aside shown where Essence dice are shown;
- **Let go** to release it;
- a prompt for the WILL check when a hit gets through.

**Probes against `main`** (`cd5146f`; a locked Arcanist with Evocation 2 and Fog Shroud in the Grimoire):

```
grimoire(ch).pool                     { rank: 2, discipline: "Evocation", text: "Beyond your pool…" }
spells with duration "Concentration"  18
spells tagged "Concentration"         16      ← veil-of-shadows, dread-pulse untagged; the book says Concentration for both
spellRules.concentration              "…sets aside dice equal to its Threshold…"     ← the ruling replaces it
glossary tag Concentration            "…dice equal to the spell's Threshold are set aside…"
painState(ch).essencePenalty          0, floor 1 (painPenaltyLine, sheet.js ~9)
```

**The data disagrees with itself:** two spells the book gives `Duration: Concentration` (`Appendix_Book_of_Known_Spells.md` ~405 Veil of Shadows, ~1217 Dread Pulse) lack the tag. PQ2 settles which field the engine reads.

---

## 1. Goal

When P10 is merged:

1. **A Concentration spell in the Grimoire has Hold.** Pressing it records the hold. The button says it's for after the cast succeeds; the sheet rolls nothing.
2. **A hold sets aside one die**, shown:
   - in the Grimoire's pool line ("Evocation 3 · holding 1: roll 2");
   - in **Beyond your pool**, which compares a TH against what's left;
   - beside Pain's Essence penalty wherever that line shows ("Holding Fog Shroud: −1 Essence die").
3. **At most Evocation rank holds.** Past it, Hold refuses and says so.
4. **Let go** releases one. Removing a held spell from the Grimoire releases it too, and the confirm says so.
5. **A hit that gets through, while holding, prompts the WILL Essence check** in the hit panel, naming what's held, with a **Let go** per spell. The sheet doesn't decide; the player presses Let go or doesn't (Q19: "not a binary outcome", the GM's call).
6. `spellRules.concentration` and the tag's description say the ruling, not `0480`'s Threshold.

## 2. Tier, versions, numbers

**Tier: Rule or shape.** A new saved field, a data shape and a player-facing behaviour. One numbered decision, **N** (the next free number on `origin/main` when you write it), and one flag, **F-next** (PQ5).

**Character schema:** **0.25 → 0.26**, with its `migrate()` step in the same commit: `trackers.heldSpells` is new.

**Table schema:** no bump. A GM's PC row is entered by hand (`_resolvePcHit`); it doesn't read a character's holds.

**App version.** Check `CHANGELOG.md`'s heading and the tags:
- **0.45.0 released** (`git tag | sort -V | tail -1` is `v0.45.0`, the expected case): `npm run bump -- 0.46.0`, minor: a new thing a player can do.
- **0.45.0 still unreleased:** no bump.

**Game data:** the rules text changes, two spells gain a tag, and `spellcraftRules` gains `concentration`. A character can observe it (Decision 68).
- **0.38 released:** `gamedataVersion` 0.39.
- **0.38 still unreleased:** no bump.

Say in the PR which case applied.

## 3. The decision, drafted

Write it as Decision **N** in `SCHEMA.md` §4. Its INDEX §3 line goes under the topic Decisions 109–111 (magic on the sheet) are filed under. Fill in Ken's answers; trim only if `docs.test.mjs` says it's over 350 words.

```
N. **A held Concentration spell is recorded on the sheet and sets aside one die from every Essence roll; an Arcanist holds at most their Evocation rank.**
     *2026-10-1x · Ken + Claude · Touches: trackers.heldSpells, holdSpell, releaseSpell, heldSpells, castingPool, beyondPool, painPenaltyLine, hitPrompts, spellcraftRules.concentration, spellRules.concentration, the Concentration tag, Grimoire, W87, F-next*
     - **Decided:** Deighton's 2026-10-10 ruling (Q17–Q19): a Concentration spell (PQ2: its tag) is held once it succeeds; the player presses Hold after the cast. Each hold sets aside one die (`spellcraftRules.concentration.diceEach`) from every Essence roll: the casting pool and Beyond your pool read what's left, and the Pain line names it. Holds are capped at the Evocation rank. A hit that gets through prompts the WILL Essence check (TN and TH: F-next) with Let go per spell; nothing drops on its own. Schema 0.26.
     - **Why:** W87 (Brogan): a held spell is a die off every roll, and nothing reminded the player.
     - **Rejected:** <PQ alternatives Ken didn't take>; dropping holds automatically at 0 HP (Q19: the GM decides); the hold on the Grimoire row (it's play state, not what you know).
     - **Replaces:** nothing in the ledger. The code comment on `castingPool` citing Decision 111 ("the table's to count") is rewritten.
     - **Revisit if:** Deighton sets the check's TN and TH (close F-next); an inscribed Concentration spell (a Talisman holds it, `0480` ~795) is tracked; a written-in spell needs to be held.
     - **Built:** app …, game data …, character schema 0.26, PR #…. Log 2026-10-1x (P10).
```

**Check *Replaces* against the text, not the title.** Search §4 for `Concentration`, `castingPool`, `beyondPool`, `essencePenalty` and `painPenaltyLine` (the pre-flight found none in the ledger, only SCHEMA §2's data sketch at ~524–530, which needs `spellcraftRules.concentration` added). If one turns up, mark it.

## 4. Questions for Ken

| Id | Question | Default | Answer |
|---|---|---|---|
| PQ1 | **Where a hold is saved.** | **`trackers.heldSpells`: an array of spell ids**, play state beside Conditions. The reader keeps only ids that are in the Grimoire, are Concentration spells and are within the cap, in order. *Alternative:* `held: true` on the Grimoire row. But the Grimoire is what you know, edited on the Character tab; a hold is what you're doing this scene, undone with the rest of play. | **Ken, 2026-10-15: the default.** |
| PQ2 | **Which spells can be held.** | **The `Concentration` tag**, and add it to Veil of Shadows and Dread Pulse, whose `duration` (and the book) already say Concentration. A guard: every spell with `duration: "Concentration"` carries the tag. *Alternative:* read `duration === "Concentration"`. But `duration` is display text, and the tag is already the data's word for the mechanic. | **Ken, 2026-10-15: the default.** |
| PQ3 | **Where the set-aside shows.** | **Three places:** the Grimoire's pool line; **Beyond your pool** compares TH against the dice left; and Pain's line (`painPenaltyLine`, Main's vitals and the Trackers tab) gains "Holding Fog Shroud: −1 Essence die", **kept separate from Pain's** −N, because Pain's floor of 1 is the CRB's and the ruling says nothing of a floor for held dice. *Alternative:* fold it into Pain's number. One number is shorter, but it would put a floor on the hold nobody ruled. | **Ken, 2026-10-15: the default.** |
| PQ4 | **The cap when Evocation drops** (an Admin edit), or a file holds more than the cap. | **The reader counts the first `rank` holds in saved order**; the rest show on the Grimoire as "Not held: past your Evocation rank" with Let go. Nothing is deleted by a reader (constraint 7). *Alternative:* `migrate` trims the list. But an Admin rank change doesn't go through `migrate`. | **Ken, 2026-10-15: the default.** |
| PQ5 | **The WILL check's TN and TH.** | **A flag, F-next**, for Deighton (W87's open half), stubbed: the prompt reads "A WILL Essence check keeps it. Your GM sets the TN and TH." (`playerNote`). The flag's data entry is `spellcraftRules.concentration` (`flagged: true`, `flagNote` names F-next). *If Deighton has set them by build time:* put them in the data, open no flag, and say so in the PR. | **Ken, 2026-10-15: the default.** |
| PQ6 | **What prompts the check.** | **A hit that gets through** (`hitPrompts`' `tookDamage`), which covers a Shock and going down too, since both come from a hit. Also **a Turn Reset that ticks damage** (`applyReset`, an ongoing Condition). The prompt lists each held spell with Let go; no button means "kept". *Alternative:* only Shock and going down. Narrower, but Ken's follow-up says "taking damage". | **Ken, 2026-10-15: the default.** |
| PQ7 | **Written-in (custom) Grimoire spells.** | **Can't be held on the sheet**: they carry no tags, and their holding stays the table's to count, as today. A wish (W-next) if a tester asks. *Alternative:* a Concentration checkbox on a custom row. That's a new custom-row field, for a case no tester has raised. | **Ken, 2026-10-15: the default.** W109 (custom rows opt into behaviour) would revisit this. |

## 5. What this changes underneath (the assumption sweep)

Found by grepping the readers of each thing it touches, and **one level further** (their readers that render), not from memory:
`castingPool`, `grimoire(`, `.pool`, `beyondPool`, `spellRules.concentration`, `"Concentration"` (tag and duration), `painState`, `essencePenalty`, `painPenaltyLine`, `hitPrompts`, `prompts.`, `applyReset`, `data-spellrm`, `removeSpell`/the Grimoire's remove, `trackers.` in `migrate` and `newCharacter`, and `versionCheck`.

**Check each row yourself before you build**, and say in the PR if one is wrong. Ask two questions of every row:
- **Which guards read a value this changes?**
- **Where does each new or removed note or name render?**

| Today | Where | After P10 |
|---|---|---|
| `castingPool(ch)` returns `{ rank, discipline, text }` | `engine.js` ~2661 | Adds `held` (holds counted) and `rolls` (`max(0, rank − held × diceEach)`). Its comment loses "the table's to count". **Readers:** `grimoire()` (~2670), the picker's status (`sheet.js` ~2014), the picker list (~2045, ~2088). The picker runs at creation too, where nothing is held: `held` 0, unchanged. |
| `beyondPool: th > pool.rank` | `engine.js` ~2689 | `th > pool.rolls`. **Renders:** the Grimoire's and the picker's **Beyond your pool** chip. A creation test asserting it keeps passing (no holds). |
| `spellRules.concentration` and the glossary's `Concentration` tag say "dice equal to its Threshold" | data ~4490, ~4473 | The ruling's text. **Renders:** the Spellcraft reference (`sheet.js` ~650) and the tag's tip. **Voice:** player copy; mark for a voice pass. |
| `spellcraftRules` has `castingPool`, `mastery`, … | data ~4478 | Adds `concentration: { tag: "Concentration", diceEach: 1, capDiscipline: "evocation", checkText, flagged, flagNote }`. **The data-key guard** (`engine.test.mjs` ~363) fails until each key is read. Expected. |
| Veil of Shadows, Dread Pulse: `duration: "Concentration"`, no tag | data ~4647, ~4695 | Gain `"Concentration"` in `tags`. **Renders:** their tag chips. A new guard: duration and tag agree. |
| `painState` → `painPenaltyLine` shows Pain's Essence penalty | `engine.js` ~843; `sheet.js` ~9 | `painState` is unchanged (it's Pain). A new engine reader `heldSpells(ch)` returns `{ held:[{id,name}], over:[…], dice, cap }`; the UI's Pain line appends its sentence. **Readers of `painPenaltyLine`:** `sheet.js` ~330 (the vitals pill), ~1255 and ~1316 (the Trackers tab). **Each calls it only when `pain.level` is above 0**, so a hold at Pain 0 would show nowhere: the hold's sentence renders on its own condition (anything held), not inside `painPenaltyLine`'s guard. The print sheet doesn't call it; leave print alone. |
| `hitPrompts` returns `shock`, `atZero`, `deathMark`, `conditions` | `engine.js` ~1069 | Adds `concentration: { spells:[{id,name}], text }` when `tookDamage` and anything is held. **Readers:** `resolveHit`'s result, the hit panel (`sheet.js` ~906 onward). **Twin:** `resolveEncounterHit`'s stand-in has no Grimoire, so nothing is held. `_resolvePcHit` is unchanged. |
| `applyReset` ticks ongoing damage | `engine.js` ~1897 | PQ6: its result gains the same `concentration` prompt when damage ticks while holding. **Renders:** the Turn Reset panel. If this is more than a line or two, stop and ask (§13). |
| The Grimoire's Remove (`data-spellrm`) | `sheet.js` ~3330 | On a held spell, the confirm says the hold ends (computed: `heldSpells` on a clone after removal, as P17's review nit taught). The engine drops it from `heldSpells` in the same commit, so the saved list doesn't keep a dead id. |
| `newCharacter().trackers` / `migrate`'s trackers pass | `engine.js` ~82, ~3621 | `heldSpells: []`; `migrate` keeps strings, deduplicated, at most 20, each at most 120 characters. Constraint 8: survives the round trip. |
| `SCHEMA_VERSION = "0.25"` and its literals in `tests/` | `engine.js` ~25 | `"0.26"`. **Expected breaks:** the `"0.25"` literals (`grep -c '"0.25"' tests/*.mjs`). |
| SCHEMA §3's `trackers` and §2's `spellcraftRules` sketch | `SCHEMA.md` (search `trackers: {`, `spellcraftRules`) | Add `heldSpells` with its rule, and `concentration`. |
| `versionCheck` | `engine.js` ~4314 | A held id that is no longer a book spell reads as not held. No issue line is needed (it's play state). **Totality** covers it. |
| GM mode | `gm.js` | **Not a reader** of a character's Grimoire (`grep -n "grimoire\|heldSpells" src/ui/gm.js`). Confirm. |
| Archetype ids in code | `engine.test.mjs` ~481 | No `arcanist` and no `evocation` in `src/engine` or `src/ui`: the discipline comes from `capDiscipline` in the data. |

## 6. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- `docs/reference/rulings-2026-10-10.md` Q17–Q19, and `docs/WISHLIST.md` W87.
- `private/crb/0480_Magic.md` *Concentration* (~366–370), Step 2 (~242), *Concentration in an inscribed spell* (~795, out of scope).
- `docs/plans/crb-catch-up.md` ~121 (Ken's book edit for the same ruling; the app's text should say the same thing).
- `SCHEMA.md` §4: **109–111** (magic on the sheet, the casting pool, Beyond your pool); **104** and **219** (the hit panel's lines); **B8**'s floor note on `painPenaltyLine`.
- `src/engine/engine.js`:
  - `castingPool`, `grimoire` (~2640–2700);
  - `painState` (~800–855);
  - `hitPrompts`, `resolveHit` (~1069–1140);
  - `applyReset` (~1880–1905);
  - `migrate`'s trackers (~3610–3630).
- `src/ui/sheet.js`:
  - `painPenaltyLine` (~9) and its callers;
  - `grimoireHtml` (~2074–2115);
  - the hit panel's lines (~900–925);
  - the Spellcraft reference (~650);
  - the Remove handler (~3330).

## 7. Out of scope

- **Rolling anything.** The sheet records the hold; the player rolls.
- **An inscribed Concentration spell** (a Talisman holds it, `0480` ~795).
- **Holding a written-in spell** (PQ7).
- **Dropping holds on their own**, at 0 HP or anywhere (Q19).
- **Ken's CRB edit** (`crb-catch-up.md` ~121) is his, in the book.

## 8. The shape

**Data (`spellcraftRules.concentration`):**

```
"concentration": { "tag": "Concentration", "diceEach": 1, "capDiscipline": "evocation",
  "checkText": "A WILL Essence check keeps it. Your GM sets the TN and TH.",
  "flagged": true, "flagNote": "F-next: the TN and TH of the WILL Essence check that keeps a held spell (W87, Deighton)." }
```

`spellRules.concentration` and the glossary tag get the ruling's text (Content). Veil of Shadows and Dread Pulse gain the tag.

**The saved file (schema 0.26):** **`trackers.heldSpells`**, an array of spell ids, `[]` by default. A reader keeps:
- only book spells in the Grimoire that carry the tag;
- each once;
- in saved order;
- the first `cap` of them as held, and the rest as `over`.

**Engine:**

1. **`heldSpells(ch)`** → `{ held:[{ id, name }], over:[{ id, name }], dice, cap, capName }`. `dice` = held × `diceEach`; `cap` = the `capDiscipline`'s rank (from `disciplineRanks`). Total: a non-Arcanist, or no Grimoire, gives `held: []`, `cap: 0`.
2. **`holdSpell(ch, id)`**:
   - it refuses a spell not in the Grimoire ("That spell isn't in your Grimoire.");
   - it refuses one that isn't a Concentration spell ("Fog Shroud isn't held; it's cast and released.", the name from the data);
   - it refuses one already held ("You're holding that already.");
   - it refuses at the cap ("You hold as many as your Evocation rank (2).", the discipline's name from the data);
   - otherwise it pushes the id and returns `{ ok:true, name }`.
3. **`releaseSpell(ch, id)`**: removes it. On one not held it refuses ("You aren't holding that."). It also takes an `over` one off the list.
4. **`castingPool`** gains `held` and `rolls`; `grimoire()`'s `beyondPool` reads `rolls`.
5. **`hitPrompts`** (and `applyReset`'s result, PQ6) gain `concentration` when damage got through and something is held: `{ spells, text: checkText }`.
6. **Removing a Grimoire spell** drops it from `heldSpells` in the same mutation.
7. **Total:** junk `heldSpells` (a string, `[1, {}, null]`, an unknown id, a non-Concentration id, `__proto__`) reads as nothing held, never a throw. `holdSpell` and `releaseSpell` with junk refuse.

**UI** (behaviour, not markup):
- **Grimoire:** a Concentration spell's row has **Hold** (title: "After the cast succeeds") or, while held, a **Held** chip and **Let go**. Past the cap, Hold is disabled with the refusal as its title. The pool line reads "Evocation 3 · holding 1: roll 2" while anything is held.
- **The Pain line** (the vitals pill and the Trackers tab, where `painPenaltyLine` renders; **shown whenever anything is held, Pain 0 included**): "Holding Fog Shroud: −1 Essence die" / "Holding 2 spells: −2 Essence dice", separate from Pain's number.
- **The hit panel:** after the lines, "You're holding Fog Shroud. A WILL Essence check keeps it. Your GM sets the TN and TH." with **Let go** per spell. Applying the hit doesn't release anything.
- **Main:** while anything is held, a line under the vitals lists them, each with **Let go** (the Grimoire is a tab away mid-fight). **Mark for a voice pass**, with the other new copy.

| Press | Where the record lands | Where focus goes |
|---|---|---|
| Grimoire → Hold | `trackers.heldSpells` gets the id | the same row's **Let go** |
| Grimoire → Let go | the id is removed | the same row's **Hold** |
| Main → Let go | the id is removed | the next held spell's Let go, else the vitals' heading |
| Hit panel → Let go | the id is removed (its own commit, before or after Apply) | the hit panel's next Let go, else its Apply |
| Grimoire → Remove a held spell → confirm | the row and the hold go, in one commit | the Grimoire's list |

**Nothing to do:** a character with no Concentration spell shows no Hold anywhere; with nothing held, no Main line, no Pain sentence, no hit prompt.

## 9. Worked examples, as the tests you write

**Write them first and run them on `main`'s code.** Each must fail, or you must say why it passes. Ruling tests in `rules.test.mjs` cite `rulings-2026-10-10.md` Q17–Q19.

| Test name | File | Setup → result |
|---|---|---|
| `P10 1: a held Concentration spell sets aside one die, not its Threshold` | rules | Evocation 3, Fog Shroud (TH 2) held → `castingPool` `{ rank:3, held:1, rolls:2 }`. Per Q17. |
| `P10 2: an Arcanist holds at most their Evocation rank` | rules | Evocation 2, three Concentration spells: two hold, the third refuses with the rank in the text. Per Q17. |
| `P10 3: only a Concentration spell can be held, and the tag and duration agree` | engine | Holding a non-Concentration spell refuses; every `duration: "Concentration"` spell carries the tag (Veil of Shadows, Dread Pulse included). |
| `P10 4: Beyond your pool reads the dice left` | engine | Evocation 3, holding 2: a TH 2 spell is beyond (rolls 1); let one go and it isn't. |
| `P10 5: Let go releases, and removing a held spell releases it` | engine | Hold → release → held is []; hold → remove from the Grimoire → held is []. A release of one not held refuses. |
| `P10 6: past the cap reads as not held` | engine | `heldSpells: [a, b, c]`, Evocation 2 → held a, b; over c; `dice` 2. Drop Evocation to 1 (Admin's path) → held a; over b, c. Nothing deleted. |
| `P10 7: a hit that gets through prompts the WILL check while holding` | engine | Holding Fog Shroud, 5 Regular through → `prompts.concentration.spells` names it. 0 through → null. Nothing held → null. Per Q19. |
| `P10 8: holds survive migrate and a hostile file` | engine | Junk as §8.7 reads as nothing; a round trip is equal; the schema reads 0.26; `newCharacter()` has `trackers.heldSpells: []`. |
| `P10 9: Hold and Let go on the Grimoire, one undo each` | smoke-sheet-skills (the Grimoire's smokes) | Hold → chip and Let go, focus on Let go, the pool line says "roll 2"; undo → not held. |
| `P10 10: the Pain line and Main say what's held` | smoke-sheet-play | "Holding Fog Shroud: −1 Essence die" beside Pain's line; Main's Let go releases it. |
| `P10 11: the hit panel prompts the check and lets go` | smoke-sheet-play (the hit's smokes) | A 5-damage hit while holding shows the check sentence and Let go; Let go → released, Apply still applies the hit. |

## 10. Tests beyond §9

- **Totality:** add a "junk holds" Arcanist to `degenerates()` (`engine.test.mjs` ~605), and add `heldSpells` to the reader list at ~675 (it takes `(ch)` alone). Call `holdSpell` and `releaseSpell` with junk.
- **Hostile:** a held id with script-y text renders as text, or not at all, on the Grimoire, Main and the hit panel.
- **Voice:** the new copy passes `voice.test.mjs`; no flag id renders (constraint 9). F-next is in `flagNote` only.
- **The archetype-id guard** passes: no `arcanist` or `evocation` in code.

## 11. Mutants, each of which must fail a test

List them in the PR and the log. **Second paths were checked in the pre-flight**; each line says what else could cover it.

1. A hold sets aside the spell's TH, not 1 (P10 1). Second path: none; `castingPool` is the only arithmetic.
2. No cap (P10 2).
3. The cap read from the wrong discipline (P10 2 with Enchantment ≠ Evocation).
4. `beyondPool` still reads `rank` (P10 4). Second path: the picker's chip reads the same line field, so one test covers both.
5. A non-Concentration spell can be held (P10 3).
6. Removing a Grimoire spell leaves its hold in the saved list (P10 5's second half). **Second path:** the reader drops a dead id anyway, so assert on `trackers.heldSpells`, not on `heldSpells(ch)`, or the mutant survives.
7. Over-cap holds counted as held (P10 6).
8. The prompt shown with nothing through (P10 7).
9. `migrate` keeping a non-string in `heldSpells` (P10 8). **Second path:** the reader filters non-strings too, so assert on the migrated array itself.
10. The tag added to only one of the two spells (P10 3's guard).

## 12. Steps

1. `git submodule update --init private`, then `npm run test:fast` on a fresh branch from `origin/main`. Note the totals. Check `rulings-2026-10-10.md` and the ledger for a TN/TH Deighton may have set since (PQ5).
2. Write §9's rows. Run them on `main`'s code and keep the output.
3. Data (§8), then the engine (§8.1–7), then `migrate`. `npm run test:fast`.
4. The UI (§8). `npm run verify`.
5. **Run it in the dev preview** (`shadows-dev-preview`) with a locked Arcanist with Evocation 2 and three Concentration spells:
   - hold two; the third refuses;
   - read the pool line, Beyond your pool, the Pain line and Main's line;
   - take a 5-damage hit: the prompt; Let go from the panel;
   - remove a held spell from the Grimoire;
   - undo each;
   - at phone width: the Grimoire row, Main's line and the hit panel. Use metrics if the screenshot times out.
6. Docs:
   - Decision N with its INDEX line; SCHEMA §2 and §3.
   - F-next per the close-a-flag skill (open): its §5 row, `flagged` in the data, its INDEX §2 line.
   - W87 to `wishes-granted.md`; the plan's P10 row.
   - CHANGELOG plus `npm run changelog`; versions per §2.
7. `npm run verify` and `npm run phone-check`.

## 13. Stop and ask

- A row of §5 turns out to be wrong, and the fix isn't a line or two (PQ6's `applyReset` is the likeliest).
- **A code change outside:**
  - the engine functions named in §5 and §8;
  - `migrate` and `newCharacter`;
  - the Grimoire's rows, Remove handler and pool line, `painPenaltyLine` and its callers, Main's vitals area, the hit panel's lines, and the Turn Reset panel's result.
- PQ1–PQ7 unanswered when you start: they're Ken's, not yours.
- A test outside these **expected breaks** fails:
  - the `"0.25"` schema literals the bump moves;
  - the data-key guard, until each new key is read;
  - a test asserting `spellRules.concentration`'s or the tag's old Threshold text;
  - `"newCharacter matches the documented character schema"`, until SCHEMA §3 and `newCharacter` both carry `heldSpells`.

## 14. Close-out and review checklist

**Close-out:** the close-the-session skill, *Rule or shape* tier. That covers:
- Decision N and its INDEX line;
- F-next opened (three edits), or the TN/TH in the data if Deighton set them;
- the log entry, with the mutants;
- `shipped.md`'s row;
- the plan's P10 row; W87 granted;
- CHANGELOG plus `npm run changelog`;
- versions per §2;
- STATE rewritten (Arcanist / Magic row; §5's *Waiting on* line for W87's check).

Suggested CHANGELOG lines (player voice):

- **Holding a spell takes a die off the table.** Hold a Concentration spell from your Grimoire once it lands; the sheet sets aside one die from every Essence roll while you hold it, up to your Evocation rank in spells.
- **Taking a hit while you hold a spell asks whether you keep it.** Let it go from the hit, the Grimoire, or Main.

**Review checklist:**

- [ ] §9's eleven tests exist with those names, and the PR shows them run on `main`'s code.
- [ ] §5's rows are each confirmed or corrected in the PR, **including the readers one level further out**.
- [ ] `git diff origin/main --stat -- src/engine src/ui` touches only what §13 allows.
- [ ] No archetype or discipline id in `src/engine` or `src/ui` (the A8 guard passes).
- [ ] F-next opened in three places (or not needed, and the PR says why); no flag id renders.
- [ ] Decision N's shape passes `docs.test.mjs`; *Replaces* checked against the ledger's text.
- [ ] Schema 0.26 with its `migrate()` step; `newCharacter` round trip.
- [ ] The dev-preview run happened (§12.5), including undo and phone width.
- [ ] Mutants are listed in the PR **and** the log, with 6 and 9 asserted on the saved array.
- [ ] `npm run verify` and `phone-check` are green; versions are per §2, and the PR says which case.

## 15. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<plan>/<order>` = `sheet-wishlist/P10-holding-a-spell.md`, `<id>` = **P10**, and these traps under the builder's:

> Six things in this order are easy to get wrong:
>
> 1. **One die, not the Threshold.** The data and `0480` both still say Threshold; Deighton's ruling replaces it. Change the text, not just the arithmetic.
> 2. **Pain's floor isn't the hold's.** Keep the hold's −N separate from Pain's −N (PQ3).
> 3. **Nothing drops on its own.** Not at 0 HP, not on Apply. The player presses Let go (Q19).
> 4. **Readers hide junk; assert on the saved array.** Mutants 6 and 9 survive a test that reads `heldSpells(ch)`.
> 5. **No discipline id in code.** The cap's discipline comes from `capDiscipline`.
> 6. **Write a regex into a file with the editor, never through a shell heredoc**, which drops backslashes.
>
> Tier: Rule or shape. One numbered decision, the next free; one flag, the next free. Character schema 0.26. Versions per §2. Use the close-the-session skill at the end.
