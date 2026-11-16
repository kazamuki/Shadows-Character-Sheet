# Work order K2: Every word

**Plan:** [`../help-on-the-sheet.md`](../help-on-the-sheet.md) §3, row K2, and K2's pre-flight line. **Wishes:** [W156](../../WISHLIST.md) (Help on the sheet, its *Every word* part) and W150 (Help's polish, its A–Z jump). **Built on:** [`K1-one-help.md`](K1-one-help.md), the order that built the sheet's Help (Decision 289). Decisions 68, 71, 116, 135, 139, 207, 278, 287, 289.

**Status: drafted 2026-11-15** by Claude (Opus), the K1 reviewer, at the conductor's request. **Not approved.** The plan's KQ1–KQ8 are answered (Ken, 2026-11-15: every default); this order's KQ13–KQ18 (§4) are open.

**Branch:** cut from `origin/main` at the pre-flight commit; PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **K2 build** (Sonnet), then a fresh **K2 review** (Opus) once the PR is open. §15 is the hand-over.

**Runs alone, or beside L4.** It touches `engine.js` (one reader, two exports), `shared.js` (Every word's list, filter and jump, shared by both panels), `sheet.js` (the sheet's host draws the link and the view), `gm.js` (the table's Every word takes the shared list), `shadows-data.js` (`gameTerms` rows, `damageTypes` descriptions, `sheetGuide`), `shadows.css`, the tests and the docs. L4 touches `sheet.js`'s Weapons table and print, `engine.js`'s weapon lines and other data. The two meet in `engine.js` and `shadows-data.js` (different sections), and in the versions, CHANGELOG's heading and decision numbers: whichever merges second takes the next minor and the next decision number.

**Carried over from K1** (its review, PR #351):
- **The order's misses.**
  - Main's guide line broke the Health card's fold: the pre-flight measured the header, not the fold.
  - `S.admin` is a mode that outlives the Admin tab, so a context function that read it made every tab Admin's (M1).
  - phone-check's name check measured an inline `<span>` (always 0/0), so it couldn't fail (M2).
  - Trackers' Help didn't match the running tab (S1).
  - Below 480px, Help handed focus back to a hidden button.

  **Here:** every context function and view state in §5 is checked against admin mode, the seat and a resize across 1280. Every phone-check assertion this order adds names the element it measures, and is shown failing once (§11).
- **The build's misses.**
  - The decision's *Touches* line was trimmed from the draft.
  - A merge left a second `[Unreleased]` heading (now a `docs.test` guard) and a duplicate `shipped.md` row.
  - The new tests weren't all mutation-tested.
  - Help was never read against the running sheet, and there was no walk in the preview.
  - New data was placed between `gmGuide`'s comment and `gmGuide`.

  **Here:** they're traps in §15.
- **Not run in K1:** the Impeccable harden and polish passes. *Every word* is new UI (a list, a filter, a letter jump in a narrow panel), so both run here, on it alone (§12, steps 7–8).

**Pre-flight against `main` at `107ef34`** (0.70.0, K1 merged). Game data 0.54, character schema 0.34. The highest decision is 289 and the highest flag F51; take the next free numbers on `origin/main` when they're written. The probes ran in Node through `tests/smokekit.mjs`; the gap list ran in jsdom over Dead Air's five characters (`samples/`), every tab. Nothing was committed but this order.

```
The two readers today   Engine.term(id, ch, n) (engine.js ~2607): gameTerms rows only (18; from kinds visibility, painLevel,
                        check, derived, luck, stats, milestones, conditions, or a description). Engine.glossary(term, kind)
                        (~2460): weaponTagGlossary, weaponFeatureGlossary, spellTagGlossary only, spell first for kind "spell".
                        Nothing reads weaponModGlossary, armorFeatureGlossary or armorUpgradeGlossary as words: sheet.js:2348,
                        2468 and 2472 read them in place. damageTypes (9) have no description at all.
Probes                  term("TOL") → Tolerance · term("EMP") → the Stat, "Empathy 5" · term("PROT"), term("IP"),
                        term("Ballistic"), term("Bleeding") → null (term("bleeding") → the Condition: ids, not names) ·
                        glossary("EMP") → the weapon tag (electronics) · glossary("EMP","spell") → the spell tag ·
                        glossary("Scope") → the weapon feature; the mod "Scope" is unreachable · glossary("AP") and
                        glossary("AP","spell") → two texts
The sources (counts)    gameTerms 18 · Stats 8 · derived 3 · Conditions 20 · weapon tags 29 · weapon features 6 · weapon mods 7
                        · armor features 10 · armor upgrades 13 (one flagged, F42) · spell tags 9 · damage types 9 (no text) ·
                        resources 5 (healthLevels, luck, credits, crank, sfr; healthLevels has no description). About 137 rows
The plan's "28 effect   are `effectTags`: templates for Advantage effect chips ("+{perRank} Skill Points per rank"), not words.
tags"                   Not a source. K1's Appendix said "K2 adds the trait and power tags": there are none to add
Words in two sources    EMP (Stat Empathy · weapon tag · spell tag: three meanings) · AP (weapon tag · spell tag, Decision 116)
(case-folded)           · Bleeding, Burning (weapon tag · Condition; Burning a damage type too) · Conceal (weapon tag · weapon
                        feature) · Scope (weapon feature · weapon mod) · TOL, WILL, SAN (derived · gameTerms: the same rule)
                        · LUCK (gameTerms · resources.luck: the same rule)
The gap list            192 labels on the five characters' tabs that no source answers. Most are catalog names (KQ4: not
(tools script, §11)     words) or UI labels (Date, Undo). The game words among them are §8's table: PROT, RES, Integrity,
                        ACC, RoF, Capacity, HP and Health Levels, IP, Milestone Points (MP), TN, TH, the difficulties (Easy
                        10, Average 15, Challenging 20), Çredits, SFR, TAG, the damage types. Mechanics owned by one
                        archetype (Rupture, Focused Skill, Tweak, Aspect, Origin, Domain, Glyphs, Grimoire) are KQ16
Where the gaps' rules   Already in the data, read by no word: armorRules.protNote, .resNote, .integrityNote ·
live                    spellcraftRules.rollNote (TN and TH together) · skillCheckRules.difficulties (numbers only) ·
                        resources.credits.description · resources.sfr.description · tag.text · weaponRules.rofModes,
                        .rangeBands. In the CRB only: Health Levels and HP (0300, Hit Points & Health Levels), IP (0450),
                        six damage types (0460, Damage Types: Blunt, Blade, Ballistic, Electric, Energy, Burning).
                        Nowhere: Elemental, Spirit, Aether as damage types (0480 names them, never says what they are)
GM mode's Every word    gm.js ~408: S.helpView "words", gmGuide.words (43 table words) A–Z by term, no filter, no jump.
                        smoke-table-help.test.mjs:323 pins it ("each term once, A to Z, and Back returns to the link")
The sheet's Help        K1: sheetGuide.contexts.*.words are gameTerms ids (main 5, skills 4, trackers 2, progression 2,
                        the rest 0). The host's repaint key is the whole rendered panel (sheet.js, HELP_HOSTS.sheet.key),
                        and every sheet redraw calls paintHelp: a view that redraws on its key loses an input's focus
A view across a tab     paintHelp (shared.js) resets S.helpView when the context changes: a table's Every word, open in
change                  the column, falls back to the new page's help on a tab press
```

---

## 1. Goal and Done when

**Goal.** A player can open *Every word* from the sheet's Help and find any of the game's words: A–Z, a filter, a jump to a letter, each word read from where its rule lives, for their own character. A context's *On this tab* can name any of those words, not only `gameTerms`. The words the sheet uses that had no definition get one, quoted from the CRB, or a flag to Deighton where the book has none. GM mode's *Every word* gets the same filter and jump (W150).

**Done when:**
1. Help's foot on the sheet has **Every word**. It swaps the panel to the list, with **Back to this tab**, as GM mode's does.
2. The list holds every word from every source (§8, *The sources*), each once per meaning, A–Z by its title. A word two sources give the same meaning to (TOL, LUCK) is one row; a word with two meanings (EMP, AP, Scope…) is a row each, labelled by its kind (KQ14).
3. A filter box narrows the list as the player types, by title first and then by text. A letter row jumps to the first word under that letter, and a letter with no word is shown but can't be pressed. Neither redraws the panel or loses the box's focus.
4. Each row reads for the open character, as a tip does: a Stat shows its score and what it means (`TIPS.stat`), a flagged word shows its `playerNote`.
5. `Engine.word(ref, ch)` answers any reference (§8) or returns null; `Engine.words(ch)` lists every word. Neither throws on anything `migrate()` can produce, and neither touches the DOM.
6. Every context's `words` resolve through `Engine.word`: a reference that doesn't fails a test. The contexts carry the words §9's table gives them.
7. The gap words have a definition from the data's own rule (a `gameTerms` row with `from.rule`) or from the CRB (a quoted `description`). Elemental, Spirit and Aether are flagged, one flag each, and show on *Every word* with their `playerNote` and no definition (KQ8).
8. GM mode's *Every word* has the same filter and letter jump, and otherwise does what it did: `smoke-table-help.test.mjs` passes with no edit beyond what §11 lists.
9. No sentence the sheet writes changes: the new words have no `forms` (KQ13), so `termSpans` finds what it found. `node tools/outputs.mjs --against` the pre-K2 snapshot shows only the version strings.
10. `npm run phone-check` passes, including §11's new rows.

## 2. Tier, versions, numbers

- **Tier: Rule or shape** (an engine reader and a data shape: `from.rule`, references in `words`), with **Content** in it (new definitions and three flags).
- **App:** minor. The next minor on `origin/main` at build: **0.71.0**, or the one after if L4 has taken it.
- **Game data:** **bump** (0.54 → 0.55, or the next). Damage types gain descriptions and `gameTerms` gains rows (the plan: "a game data bump if a definition is added"). Decision 68's test is met: a player can read a definition that wasn't there. No computed value moves, and outputs.mjs is the evidence.
- **Character, table, pack schemas:** unchanged. The filter is view state and isn't stored.
- **Decision N** (§3) and **flags N, N+1, N+2** (Elemental, Spirit, Aether): the next free numbers on `origin/main` when they're written.

## 3. The decision, drafted

Paste as is; fill *Built*. Fill **Replaces** from the ledger search if the build finds one this draft missed.

```
N. **Every word: the game's words in one list, each read from where its rule lives, A–Z with a filter and a jump to a letter; a word the sheet uses with no rule gets one from the data or the CRB, or a flag.**
     *2026-11-?? · Ken + Claude · Touches: Every word, Engine.word, Engine.words, Engine.term, Engine.glossary, gameTerms, from.rule, damageTypes, weaponModGlossary, armorFeatureGlossary, armorUpgradeGlossary, spellTagGlossary, sheetGuide, words, gmGuide.words, filter, letter jump, helpView, TIPS, PROT, RES, Integrity, TN, TH, IP, Health Levels, EMP, AP, Decision 116, Decision 135, Decision 139, Decision 278, Decision 287, Decision 289, W150, W156*
     - **Decided:** One engine reader, `Engine.word(ref, ch)`, answers a reference to any of the game's words: a gameTerms id, a Stat, a derived stat, a Condition, a weapon tag, feature or mod, an armor feature or upgrade, a spell tag, a damage type or a resource. `Engine.words(ch)` lists them all, one row per meaning, A–Z. A context's words are references. The sheet's Help gains *Every word*, with a filter and a letter jump that GM mode's *Every word* shares. A word the sheet uses with no rule gets a gameTerms row pointing at the data's own rule (`from.rule`), or a description quoted from the CRB, or a flag. New rows carry no forms, so no sentence changes.
     - **Why:** W156: the sheet defines about 140 words, each reachable only by tripping over it. One reader keeps each definition where its rule is (135); a list that copied them would drift.
     - **Rejected:**
       - A glossary in sheetGuide: a second copy of every definition (135).
       - One row per name, with one source winning: EMP the Stat and EMP the tag aren't the same word (KQ14).
       - Forms on the new rows: every sentence naming IP or HP would grow a trigger, a sweep of its own (KQ13).
       - The catalog on Every word: it buries the words (KQ4).
     - **Replaces:** Decision 289 in part (a context's words are references, not only gameTerms ids). Decision 287 in part (gameTerms gains a `rule` kind).
     - **Revisit if:** players want the new words found inside sentences (forms), or a GM wants the game's words on the table's Every word (KQ15).
     - **Built:** app 0.7?.0, game data 0.5?, PR #?, log 2026-11-??.
```

**The flags** (three rows in `SCHEMA.md` §5, three lines in `INDEX.md` §2, `flagged: true` with a `flagNote` naming the F-number on each `damageTypes` row): *What Elemental (Spirit, Aether) damage is.* The CRB names each, in 0480's Warding rows and the Backlash table, and never says what it is. Each `playerNote`: "The book doesn't say yet what this damage is." These are Deighton's, batched on one page of one-tap picks with any other flag K2 opens (the plan's KQ8, and the memory *Rules questions as a page*).

## 4. Questions for Ken

The plan's KQ1–KQ8 are answered. These six came out of the pre-flight.

| Id | Question | Default | Alternative |
|---|---|---|---|
| **KQ13** | **Do the new words become triggers inside the sheet's sentences?** A `gameTerms` row with `forms` makes `termSpans` find it in every line that names it: IP, HP and PROT are in dozens. | **No forms in K2.** The new rows answer *Every word* and Help only, so no sentence on the sheet changes and outputs.mjs proves it. Forms are a wish (W), with its own sweep of every line they'd touch. | Forms now, with the sweep in this order. |
| **KQ14** | **A name with two meanings.** EMP is the Stat Empathy, a weapon tag (electronics) and a spell tag. AP is a weapon tag and a spell tag (Decision 116). Conceal, Scope, Bleeding and Burning are in two sources. | **A row per meaning, labelled by kind** ("EMP · Stat", "EMP · Weapon tag"), next to each other in A–Z. Two sources that read **the same rule** are one row: gameTerms' TOL, WILL, SAN and LUCK point at the derived stats and LUCK's resource, so they merge. | One row per name, with a fixed order of sources deciding the text and the rest as lines under it. |
| **KQ15** | **GM mode's *Every word*.** It lists the table's 43 words. | **It takes the shared filter and letter jump (W150) and keeps its own words.** A GM's Help is about the table. | It also lists the game's words, under its own. |
| **KQ16** | **Mechanics only one archetype has.** The gap list finds Rupture, Focused Skill, Tweak, Aspect, Origin, Domain, Glyphs, Grimoire and the Arcanist's TN and TH lines. | **Out of K2,** as part of the archetype's own text (KQ4's catalog). TN and TH get rows because the check table uses them for everyone. The rest go to a W item. | In K2, a row each, from the archetype's own data. |
| **KQ17** | **Where *Every word* opens on the sheet.** | **A link in Help's foot, as GM mode's**, swapping the panel's view, with **Back to this tab**. The **?** key still toggles the panel. | A button beside the panel's heading, always in view. |
| **KQ18** | **A tab press while *Every word* is open.** Today a table's Help falls back to the new page's help, filter and all. | **On the sheet, *Every word* stays open**, with its filter, until **Back** or Close: it isn't about the tab. GM mode keeps what it does (KQ15). | It falls back, as on a table. |

## 5. The assumption sweep

Every reader was found by grep: `Engine.term`, `Engine.glossary`, `TIPS.term`, `TIPS.tag`, `TIPS.spelltag`, `TIPS.stat`, `termForms`, `termReadable`, `TERM_KINDS`, `gameTerms`, `damageTypes`, `weaponModGlossary`, `armorFeatureGlossary`, `armorUpgradeGlossary`, `spellTagGlossary`, `sheetGuide`, `gmGuide.words`, `helpView`, `helpCtx`, `HELP_HOSTS.sheet.key`, `data-hwords`, `wordsLink`.

| What changes | True today (where) | True after | Guards that read it · where it renders · text that points at it |
|---|---|---|---|
| `TERM_KINDS` (engine.js ~2489) | 8 kinds | + `rule`: `from: { rule: "<root>.<key>[.<key>]" }`, root one of a closed list (§8). `termReadable` is true when the path ends at a non-empty string | `termForms` skips rows without `forms` (new rows have none: KQ13). `termSpans` therefore finds nothing new: **outputs.mjs over every archetype is the proof**. The data-key guard (Decision 135, `engine.test` MAPS) must accept `from.rule`'s strings as read |
| `Engine.term` | gameTerms only | Unchanged in signature and result for every id it answers today; the new rows answer through it too | `TIPS.term`, `termsHtml`, K1's `sheetHelpWordsHtml`. `smoke-sheet-help`'s *every word it names resolves*, and every Decision 287 test, must pass unedited |
| `Engine.glossary` | three lists | **Unchanged.** `Engine.word` reads it, never the other way | `TIPS.tag`, `TIPS.spelltag`, `tagChipsHtml`, the Grimoire, the catalog. Their tests unedited |
| `Engine.word`, `Engine.words` | — | New exports (§8) | The totality sweep (constraint 8): **add both beside engine.test's *Decision 266: every reader and writer is total***, on every `migrate()` output and junk characters |
| `damageTypes[].description` | absent on all 9 | Six quoted from 0460 (Blunt, Blade, Ballistic, Electric, Energy, Burning), each with a `bookSource`; three flagged. *E8 3*'s quote check extends to them | Readers of `damageTypes`: sheet.js:1271 (Take a hit's select), :2371 (written-in weapon), :3021 (print, Warding), :4439, gm.js:3437 and :3537 (encounter hit). **None reads a description:** confirm by grep, and that print doesn't start printing it |
| `sheetGuide.contexts.*.words` | gameTerms ids (strings) | Strings **or** references (`{ stat:"BOD" }`). A string stays a gameTerms id, so K1's lists are valid as they are | `sheetHelpWordsHtml` (sheet.js) draws through `Engine.word`. engine.test's *sheetGuide is shaped* checks each resolves for a Professional, an Arcanist, a Vampire and a Werewolf. voice.test walks `sheetGuide` |
| `sheetGuide.ui` | K1's labels | + `wordsLink`, `back`, `filterLabel`, `filterEmpty`, `jumpLabel`, `kinds` (§8) | Decision 135's unread-key guard: each new key needs a reader. voice.test walks them |
| `gmGuide.words`' view | gm.js `helpBodyHtml`, `S.helpView==="words"`: A–Z, no filter, no jump | The shared list (shared.js) draws it: filter and jump added, rows and order the same | `smoke-table-help.test.mjs:323` (one row per term, A–Z, Back returns): **it must pass unedited**; new assertions for the filter go in a new test |
| `S.helpView` across a context change | `paintHelp` sets it null when `S.helpCtx` changes (shared.js) | On the sheet's host, `"words"` survives a context change (KQ18); the table's is unchanged | A host option, not a branch on `S.screen`. **Check it against admin mode** (Admin is a context), **the seat** (the table's host: unchanged) and **a resize across 1280** (a flyout closes on a tab press anyway: Decision 166) |
| The sheet's repaint key | `HELP_HOSTS.sheet.key` is the whole rendered panel; every sheet draw calls `paintHelp` | The filter's text and the scroll live outside the key: the list is drawn once per view, and the filter hides rows in place | **A repaint while the box has focus loses it.** Every sheet redraw (Heal, a toggle in the page beside the column) calls `paintHelp`: the key must not change because of the filter. Test it (§10, 4) |
| A Stat's row | `TIPS.stat` reads `statReading` for `tipChar()` | *Every word*'s Stat rows read the same, through `Engine.word` with the open character | On a seat, `tipChar()` is the read-only character; on the sheet, `S.ch` |
| `W150` | its A–Z jump waits on K2 | Built for both panels | `WISHLIST.md`: W150 moves to `log/wishes-granted.md` if this was its last part (its foot and heading halves: check what K1 left) |

## 6. Read first

- `CLAUDE.md`: constraints 5 (the engine never touches the DOM), 8 (the engine is total), 9 (maintainer text), and *Flags*.
- `SCHEMA.md` §4: Decisions 287 (gameTerms, `term`, `termSpans`), 289 (the sheet's Help), 278 (Help, *Every word*), 139 (tips), 116 (AP on a spell), 135 (no second copy, no unread key), 207 (the GM Reference's *Copying the tips' text* rejection), 68 (gamedataVersion).
- `K1-one-help.md` §8 and §15, and PR #351's review: the traps this panel already has.
- `engine.js` ~2460–2615 (`glossary`, `TERM_KINDS`, `termReadable`, `termForms`, `termSpans`, `termBody`, `term`); `shared.js` `TIPS`, the Help panel (`paintHelp`, `HELP_HOSTS`); `sheet.js` `HELP_HOSTS.sheet`, `sheetHelpWordsHtml`; `gm.js` `helpBodyHtml`'s `"words"` view.
- `private/crb/0460_Gear.md` (Damage Types), `0300_Core_Mechanics.md` (Hit Points & Health Levels), `0450_Advancement.md` (Improvement Points), `0480_Magic.md` (Warding and Backlash, for the three flags).
- `VOICE-APP.md`: the list's labels are tool voice; a definition is the book's words.

## 7. Out of scope

- **Forms on the new rows** (KQ13), so no line the sheet writes gains a trigger.
- The catalog (Skills, Advantages, gear, spells, powers) and an archetype's own mechanics (KQ4, KQ16).
- The table's words on the sheet, or the game's on the table (KQ15).
- K3's contexts (the owed-pick dialog, Expert mode, the seat) and the sheet's other guide lines.
- Renaming a tag or a word: ids are immutable (constraint 6), and EMP stays EMP.
- Any definition the CRB doesn't state. That's a flag, never copy.

## 8. The shapes

**A reference** names a word by its kind and id. A plain string is a `gameTerms` id (K1's shape, still valid).

```js
"TOL"                         // a gameTerms id
{ "stat": "BOD" }             // also: derived, condition, tag (a weapon tag), feature (a weapon feature), mod (a weapon mod),
{ "spellTag": "AP" }          //        armorFeature, upgrade (an armor upgrade), spellTag, damageType, resource, term
```

- **`Engine.word(ref, ch)`** → `{ kind, id, title, text, more:[{ text, signed? }], note, flagged }` or null. It reads the rule where it lives: a Stat through `statReading` when `ch` is given, a `term` through `termBody`, a glossary row's `description`, a damage type's `description` or, when flagged, its `playerNote` as `note` and `text: ""`, and a resource's `description` or `refresh`. It never throws, never formats a sign (`signed` as `term` does) and never touches the DOM. An unknown kind, a missing id, a non-object `ch`: null, or the row without the character's reading.
- **`Engine.words(ch)`** → every word: `[{ ref, kind, id, title, text, more, note, flagged, letter }]`, sorted by `title` (case-insensitive, `localeCompare`, then by kind's order). `letter` is the title's first letter A–Z, or `#` for anything else. **One row per meaning:** a `gameTerms` row whose `from` points at a derived stat, a Stat, LUCK's resource or a Condition is merged into that row's own entry (TOL appears once). Two sources with the same name and different rules give two rows (KQ14).
- **The kinds' order** (for ties, and the label): Stat, derived, term, Condition, damage type, resource, weapon tag, weapon feature, weapon mod, armor feature, armor upgrade, spell tag. The labels are copy: `sheetGuide.ui.kinds`.
- **`gameTerms` `from.rule`**: `{ "id": "prot", "title": "PROT", "from": { "rule": "armorRules.protNote" } }`. The root is one of `armorRules`, `weaponRules`, `spellcraftRules`, `skillCheckRules`, `resources`, `tag`, `ip`, `damageRules`, `recoveryRules`. The path ends at a non-empty string, or at an object with a `description` or `text`. `termReadable` checks it, so a row whose rule went missing says nothing. **No `forms`** (KQ13).
- **The gap words** (pre-flight; the build re-runs the script and lists any it adds or drops):

| Word | Its rule | How |
|---|---|---|
| PROT | `armorRules.protNote` | `from.rule` |
| RES | `armorRules.resNote` | `from.rule` |
| Integrity | `armorRules.integrityNote` | `from.rule` (title "Integrity"; never "INT", which is the Stat) |
| TN, TH | `spellcraftRules.rollNote` holds both; the check table uses them for everyone | one row each, `from.rule`, unless the note can't stand for each alone: then a `description` quoted from 0300's check rules |
| Difficulty | `skillCheckRules.difficulties` (Easy 10, Average 15, Challenging 20) | a `description` quoted from 0300 that names the three, with `bookSource` |
| Çredits | `resources.credits.description` | the resource itself (`{ resource:"credits" }`): no new row |
| SFR | `resources.sfr.description` | the resource |
| TAG | `tag.text` | `from.rule` |
| IP | the CRB only (0450, "Improvement Points") | `description`, quoted, `bookSource` |
| Health Levels, HP | the CRB only (0300, "Hit Points & Health Levels") | `description`, quoted, `bookSource`; one row, title "Health Levels (HP)" unless the book splits them |
| ACC, RoF, Range | `weaponRules.rofModes`, `.rangeBands` | `from.rule` where a string stands alone; else quoted from 0460 |
| Capacity | 0460 | quoted |
| Blunt, Blade, Ballistic, Electric, Energy, Burning | 0460, *Damage Types* | `damageTypes[].description`, quoted |
| Elemental, Spirit, Aether | none | a flag each (§3) |

- **`sheetGuide.ui`** gains: `"wordsLink": "Every word"`, `"back": "Back to this tab"`, `"filterLabel": "Find a word"`, `"filterEmpty": "No word matches."`, `"jumpLabel": "Jump to a letter"`, and `"kinds": { "stat": "Stat", "derived": "Stat", "term": "Rule", "condition": "Condition", "damageType": "Damage type", "resource": "Resource", "tag": "Weapon tag", "feature": "Weapon feature", "mod": "Weapon mod", "armorFeature": "Armor feature", "upgrade": "Armor upgrade", "spellTag": "Spell tag" }`. GM mode's labels for the same controls go in `gmGuide.ui` (its own voice and its own `back`).
- **Nothing stored.** The filter's text lives in view state and clears when the panel closes.

## 9. The UI

**Direction:** GM mode's *Every word*, with a filter and a letter row. Nothing new in the panel's frame.

**The view, top to bottom:** the heading **Every word** and **Close**; **Back to this tab**; the filter box (`type="search"`, labelled **Find a word**); the letter row (A–Z and `#`, each a button; a letter with no word under the current filter is `disabled`); the list, a `dl` as today, each row's title, then its kind in small caps when the name has more than one meaning, then its text, its `more` lines and its note. **On a phone (below 600px)** the filter and the letter row stick to the top of the panel's scroll.

**Where things land:**

| Press | Lands on | Focus | Says |
|---|---|---|---|
| **Every word** in Help's foot | the list, unfiltered, at its top | the filter box | — |
| A letter | the first row under it scrolls to the top of the list | that row's title (`tabindex="-1"`) | — |
| Typing in the filter | rows that match stay, others hide; letters with none disable | stays in the box | a polite live region: "N words" (copy: `filterCount`, if Ken wants it; else nothing) |
| A filter with no match | `filterEmpty` | stays in the box | `filterEmpty` |
| Esc in the box with text in it | the filter clears | stays in the box | — |
| Esc in the box when it's empty | as Help's Esc does today | as today | — |
| **Back to this tab** | the tab's help, as before | the **Every word** link | — |
| A tab press, ≥1280 | *Every word* stays, filter kept (KQ18) | where the press put it | — |
| A tab press, <1280 | the flyout closes (Decision 166) | where the press put it | — |
| A term inside a row | its tip, as anywhere (139) | unchanged | — |
| A sheet redraw beside the column (Heal, a toggle) | nothing in the panel moves | unchanged: **the box keeps focus** | — |
| GM mode, **Every word** | the table's 43 words with the same filter and letters | the filter box | — |

**Each tab's *On this tab*, after K2** (K1's ids stay; new ones are the gap rows' ids from §8, lowercase, or references). A word is on a tab only if the tab shows it; the walk (§12, 9) checks each.

| Context | Words |
|---|---|
| main | `TOL`, `WILL`, `LUCK`, `skill-check`, `defensive-action`, `health-levels` |
| skills | `skill-check`, `kicker-die`, `explode`, `botch`, `difficulty` |
| character | `{ resource:"sfr" }` where the archetype has SFR, else none (KQ16 keeps the archetype's own words out) |
| trackers | `SAN`, `LUCK`, `health-levels`, `prot`, `res`, `integrity`, `{ resource:"credits" }`, `{ resource:"crank" }`, `{ resource:"sfr" }` |
| progression | `milestone-point`, `LUCK`, `ip` |
| loadout | `acc`, `rof`, `capacity`, `prot`, `res`, `integrity` |
| notes, admin | none |

A context's word that the open character can't have (SFR on a Professional) is left out of *On this tab* when `Engine.word` reads it as absent for that character: the build says how, or drops the word and lists it.

**Never:** the filter writes to storage, the list redraws while the box has focus, a letter jump moves the page behind the panel, or a row's text is copied into `sheetGuide` (135).

**Copy:** §8's `ui` strings and the gap words' definitions. The definitions are the book's words, quoted and cited (`bookSource`), not a voice pass's. The labels go to the voice pass with the PR.

## 10. Worked examples, as named tests

The builder writes these first and **shows each failing on `main`**. The engine's go in `tests/engine.test.mjs`, the UI's in `tests/smoke-sheet-help.test.mjs`, the table's in a new test in `smoke-table-help.test.mjs` (none of its current tests edited).

| # | Test | Pins |
|---|---|---|
| 1 | `K2: Engine.word answers every kind, and nothing else` | `word("TOL", ch).title` "Tolerance"; `word({stat:"BOD"}, ch).title` starts "Body" and carries the score; `word({tag:"EMP"})` and `word({stat:"EMP"}, ch)` differ; `word({mod:"Scope"})` is the mod (glossary can't reach it); `word({damageType:"blunt"}).text` is 0460's sentence; `word({damageType:"aether"})` is flagged with a note and no text; `word({nope:"x"})`, `word(null)`, `word(42)`, `word({stat:"ZZZ"})`: null |
| 2 | `K2: Engine.words lists each meaning once, A to Z` | TOL once (gameTerms merged into derived); EMP three times, kinds Stat, Weapon tag, Spell tag, adjacent; AP twice; sorted by title, case-insensitive; every row's `letter` is A–Z or `#`; the count equals the sources' sum less the merges (computed from the data, never a literal) |
| 3 | `K2: Every word opens from the sheet's Help, filters and jumps` | Help → **Every word** → the list, focus in the box; type "res" → RES and Resistance rows stay, Blunt hides; press a disabled letter: nothing; clear; press **B** → focus on the first B row; **Back to this tab** → the tab's help, focus on the link |
| 4 | `K2: the filter keeps its focus through a sheet redraw` | at 1280, Every word open with "pro" typed: Heal 1 on Main (a redraw) → the box still has focus and still reads "pro", the list still filtered |
| 5 | `K2: a tab press keeps Every word open in the column, and closes the flyout` | at 1280: Every word, filter "luck", press Skills → still Every word, still "luck"; at 1024 the same press closes the flyout |
| 6 | `K2: every context's words resolve, for each archetype` | every `sheetGuide.contexts.*.words` reference gives a non-null `Engine.word` for a Professional, an Arcanist, a Vampire and a Werewolf; a reference to a missing id makes the guard fail (mutation) |
| 7 | `K2: no sentence on the sheet changed` | `Engine.termSpans` over every `appCopy` string and every rule note a sentence draws is the same on this branch as a fixture taken before (or: the new rows carry no `forms`, asserted, plus outputs.mjs in the PR) |
| 8 | `K2: a table's Every word filters and jumps too` (smoke-table-help, new) | the table's 43 words, filter "clock" → the clock rows; letter **S** → first S word; Back as today |

## 11. Tests beyond the examples

- **Totality** (`engine.test.mjs`, beside *Decision 266: every reader and writer is total*): `word` and `words` on every `migrate()` output and on junk characters, every kind, and hostile refs (a getter that throws, a proxy, `__proto__` as an id). Never throws.
- **Data shape** (`engine.test.mjs`):
  - every `gameTerms` `from.rule` root is in the closed list and its path resolves;
  - every `damageTypes` row has a `description` or is `flagged` with a `playerNote` and a `flagNote` naming its F-number;
  - every new `gameTerms` row with a `description` has a `bookSource`;
  - no new row has `forms` (KQ13).
- **The gap script is a tool, not a test:** `tools/word-gaps.mjs` (the pre-flight's script, cleaned up) renders every tab for the sample table's characters and prints the labels no source answers. The PR pastes its output before and after, and the reviewer reads it. Don't make it a test: its list is a judgement of what's a word.
- **CRB cross-check:** `rules.test.mjs`'s *E8 3: a term's quoted rule is the book's, word for word* already checks every `gameTerms` `description` sentence by sentence against its `bookSource` file, so the new rows are covered as they land. **Extend it to `damageTypes[].description`** (with a `bookSource` on each, "0460 Gear, Damage Types"). A paraphrase fails.
- **Voice:** `sheetGuide.ui`'s new strings in the corpus (they're walked already); no label in `shared.js`, `sheet.js` or `gm.js`.
- **No sentence moves:** `node tools/outputs.mjs out.json` on `main` before the build, `--against` after; only version strings differ. Paste the summary.
- **phone-check** (each assertion names the element it measures, and **is shown failing once**, in the PR, by a mutation):
  - at 390, Every word open: `#ghelp`'s `scrollWidth` ≤ its `clientWidth` (it's a block with overflow, unlike K1's span). Show it failing by giving the letter row `white-space:nowrap`;
  - at 390, the filter box and the letter row are inside the panel's first screen, and still are after scrolling the list (sticky). Show it failing by removing `position:sticky`;
  - at 1300 with vitals pinned, Every word open: `main`'s right edge is left of `#ghelp`'s left edge.
- **Mutation-test** (and check each for a second path):
  - merge rows by name, not by rule → example 2 fails (EMP once);
  - drop `from.rule` from `termReadable` → example 1 fails (PROT null);
  - put the filter's text in the sheet host's repaint key → example 4 fails;
  - reset `helpView` on a context change for the sheet → example 5 fails;
  - make a context word a missing id → example 6 fails;
  - give a new row `forms` → the shape test and example 7 fail;
  - change one quoted definition's words → the CRB cross-check fails.
- **Expected breaks, updated, not stops:**
  - the version literals and the gamedataVersion pins;
  - `tools/frame-fixture.json`, if a sheet frame moves (it shouldn't: no sentence changes). If it does, find out why before re-recording;
  - the data-key guard's MAPS, if `from.rule` needs an entry.

## 12. Steps

1. Mount `private/` (`git submodule update --init private`), then `npm run test:fast`.
2. Take the befores: `node tools/outputs.mjs` on `main` into the scratchpad, and `tools/word-gaps.mjs`'s list (write the tool first, from the pre-flight's script).
3. Write §10's tests and **run them on `main`: all fail**. Paste the run.
4. **The reader:** `from.rule`, `Engine.word`, `Engine.words`, totality. Then `npm run verify`. Commit.
5. **The data:** the gap words (§8's table, each checked against the CRB and its quote pinned), the damage types, the three flags (three edits each), `sheetGuide.ui`, the contexts' references (§9's words). Then `npm run verify`. Commit. Bump game data.
6. **The UI:** the shared list with filter and jump (shared.js), the sheet's link and view, the table's view on the shared list, KQ18's host option, the CSS. Then `npm run verify` and the dev preview (step 9's walk, roughly).
7. **`/impeccable harden`** on *Every word* alone: a 30-letter word at 390, a filter with no match, Esc in the box, a redraw beside the column, a resize across 1280 while filtering, the table's list. Then `npm run verify` and `npm run phone-check`.
8. **`/impeccable polish`** on *Every word* alone.
9. **The walk** (it isn't optional, and K1's builder skipped it). In the dev preview, at 390, 1024 and 1280 (vitals pinned and not), on Dead Air's Professional, Arcanist and Werewolf: open Every word, filter, jump, read twenty rows against the rule they claim, tab with it open, open a tip from inside a row, then do the same on a table. **Read each definition you added against the CRB passage it quotes.** Put the list of what you read in the PR.
10. The close-out (§14).

## 13. Stop and ask

**Stop** (to the conductor) if:
- the merge rule (one row per meaning) can't be decided from the data alone, and needs a hand-kept list of which words are the same;
- a gap word's rule is in neither the data nor the CRB, and it isn't one of the three flagged damage types (that's a new flag: say which, don't write copy);
- a CRB passage contradicts the data's rule for the same word (a mismatch with the book is Ken's);
- `smoke-table-help.test.mjs`'s existing tests need an edit to pass;
- keeping the filter's focus through a redraw needs a change to `paintHelp`'s contract beyond a host option;
- `Engine.term`'s result changes for any id it answers today;
- an Impeccable command wants anything outside §9.

**Not stops:** §11's expected breaks, a gap word dropped because the script was wrong about it (listed), a context's word swapped for a better one (listed), and a definition taken from the data's rule rather than the CRB because both exist and agree.

## 14. Close-out

- **The tier's items** (`close-the-session`):
  - the decision and its INDEX line, with 289 and 287 marked *in part*;
  - the three flags: their §5 rows, INDEX §2 lines and `flagged` in the data;
  - `CHANGELOG.md` lines, then `npm run changelog`;
  - `npm run bump` (and **one** `[Unreleased]` heading: `docs.test` checks);
  - the `gamedataVersion` bump;
  - a log entry; STATE §3's Help line;
  - the plan's K2 row built;
  - W156's and W150's Plan lines (W150 to `log/wishes-granted.md` if nothing of it is left);
  - a row in `docs/log/shipped.md`, **checked once after any merge from `main`** (K1's got a duplicate).
- **The changelog** (a draft, for the voice pass):
  - "Help has **Every word**: every word the game uses, A to Z, with a box to find one and a letter to jump to. Each reads from its rule, for your character."
  - "Damage types say what they are: Blunt, Blade, Ballistic, Electric, Energy and Burning."
  - (GM mode) "Every word in Help has a box to find a word and a letter to jump to."
- **The PR:** title `K2: Every word (help-on-the-sheet; Decision N)`, with the template's sections, and:
  - **Where the order didn't fit** (required; "Nothing" is fine);
  - §12.3's failing run on `main`;
  - `word-gaps.mjs` before and after;
  - outputs.mjs's summary;
  - every definition added, with its `bookSource` and the quote;
  - the flags opened, as Deighton's page will ask them;
  - every phone-check assertion's failing run;
  - every expected break, old → new;
  - the **Impeccable** section (what each pass changed);
  - step 9's walk;
  - every new label as it renders, for the voice pass.

**Review checklist** (beyond the tests passing):
- [ ] Every word on the sheet at 390, 1024 and 1280 (vitals pinned and not): filter, jump, Back, Esc in the box. Type in the box, then press Heal on Main beside the column: the box keeps its focus.
- [ ] Read twenty rows against their rules, and **every added definition against the CRB passage it cites**. Spot-check five in the code.
- [ ] EMP, AP, Scope, Conceal, Bleeding and Burning each read right, and TOL, WILL, SAN and LUCK are one row each.
- [ ] The three flags: three edits each, the playerNote shown, and nothing that guesses what the damage is.
- [ ] GM mode: Every word filters and jumps, and otherwise nothing differs from `main`.
- [ ] No sentence on the sheet changed: outputs.mjs, and a spot-check of five lines with IP, HP or PROT in them.
- [ ] Admin mode on, then a tab: Help and Every word still behave (K1's M1 was this). The seat: the table's Help, unchanged.
- [ ] Each phone-check assertion was shown failing once.
- [ ] No Help string in `shared.js`, `sheet.js` or `gm.js`; no `sheetGuide` key unread (135); `voice.test` scans it.
- [ ] N is pasted whole (its *Touches* too), and 289 and 287 are marked in part. INDEX matches.
- [ ] **Last, after every push:** the PR body still has its failing run, its gap lists, its outputs summary, the Impeccable section and the walk.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md`, with this order's path, `docs/plans/help-on-the-sheet/K2-every-word.md`. Both sessions are **local**, where Impeccable is installed: run §12's commands through the Skill tool and nothing else, and treat a command reaching outside §9 as a stop.

This order's traps:
- **One reader, no copies.** `Engine.word` reads each rule where it lives. A definition typed into `sheetGuide`, or a list that caches text, is the second copy Decision 135 forbids.
- **Merge by rule, not by name.** EMP the Stat and EMP the tag share three letters and nothing else. TOL in `gameTerms` and TOL in `derived` are the same rule. The data says which: a `gameTerms` `from` that points at a row.
- **No forms.** A new `gameTerms` row with `forms` turns every "IP" on the sheet into a trigger. KQ13 says not in K2.
- **The filter lives outside the repaint key.** Every sheet draw calls `paintHelp`. If the key includes the filter's text or the scroll, typing redraws the panel and the box loses focus.
- **Check modes, not just tabs** (K1's M1): admin mode is on across tabs; the seat is the table's host; a resize across 1280 turns the column into a flyout.
- **A phone-check assertion that can't fail is decoration** (K1's M2). Name the element, check it has a box, and show the assertion failing once.
- **Quote, don't paraphrase.** A definition is the CRB's sentence with its `bookSource`, pinned by the cross-check. Where the book says nothing, it's a flag, and the copy says so plainly.
- **K1's build misses, again:**
  - paste the decision's *Touches* whole;
  - after a merge from `main`, check CHANGELOG has one `[Unreleased]` heading (`docs.test` now fails if not) and `shipped.md` has no duplicate row;
  - mutation-test every new test;
  - walk the preview and read the copy against the running sheet;
  - put new data **before** a section's doc comment or after its block, never between `gmGuide`'s comment and `gmGuide`.
