# Work order E2b — The distill: say each thing once on the skill tables

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), session E2, its second build. The shape is [E2-where-everything-lives](E2-where-everything-lives.md) (§1, §3.1, answered 2026-11-12). [E2a](E2a-the-moves.md) (the moves) merged as #327.
**Status:** drafted 2026-11-12 by an Opus session the conductor started. Awaiting Ken's answers to EQ28–EQ31 (§4).
**Branch:** the builder's own, cut from `main` once this order has merged.
**Runs beside:** E4 (colour). Not E3, E5 or E6, which wait for E2.
**Impeccable:** `/impeccable distill the running sheet's skill tables and tab intros: what a player reads twice, and what they never need on Main`. The analysis is in §1 and §9, run on `main` at 375×812. Nothing moves between tabs, so the builder doesn't run it again.

**Pre-flight:**
- **The commit is `301a714`** (main after #327: app 0.68.0 under `[Unreleased]`, last decision 283).
- **Measured at 375×812** in the dev preview, with the five TestCharacters loaded by `openEntry()`. Today's Main heights match E2a's §1 to the pixel, so this order's figures and E2a's were taken the same way.
- **Prototyped.** The fold, the row change, the dimming and the intro trims were made in a scratch copy of `sheet.js`, `gm.js` and `shadows.css` (about 20 lines), then measured. `npm test` was run against them, and it failed 1 of 1,782 (§13), so §13's list of expected breaks is the suite's own. The scratch was reverted, and none of it is on this branch.
- **The shape's target can't be met by the fold.** On a phone each combat skill row is a stacked card **85px** tall, whatever it holds. The shape's "at least 600px higher for every test character" therefore needs eight untrained combat skills folded, and four of the five have six or seven. The prototype raised Stats by **468–724px** (§1). The shape gave its targets as "to be confirmed by the build's measurement", and this is that measurement. → EQ28.
- **"−1 pain" off the rows costs no height.** On a phone the breakdown line wraps the same with or without it, and Dax's Skills tab is 4,075px either way. It is a reading change, not a height change.
- **The same row also says "−N conditions"** (`breakdown.conditions`), under a line that already says "Conditions take −N; totals include it." It's the same repetition. → EQ29.
- **Trap: the phone layout un-hides a hidden `<tbody>`.** Below 640px, `.skill-table tbody{display:block}` (`shadows.css:924`) beats the `hidden` attribute. The prototype's folded rows still showed until a `[hidden]` rule was added. `tr.skill-desc[hidden]` (`:934`) already needed the same fix.
- **Trap: GM mode's read-only sheet disables every button that isn't a reader** (`inertSheet`, `RO_READERS`, `gm.js:4397`). A fold button not on that list would be dead on the seat sheet, leaving the GM unable to open a player's untrained skills.
- **Progression's "auditable, undoable…" is already gone.** E2a replaced Progression's intro with Session Log's (§9 of E2a, voice-passed as V4). The intros left to trim are Trackers' and the first sentence of Skills'.
- **Ledger search.** Searched by name: `skillTableHtml`, `includeUntrained`, `skillRowPair`, `breakdown`, `untrained`, Rank 0, `painChip`, `painPenaltyLine`, `conditionTotalsNote`, "totals include", `main-combat`, `main-stats`, Combat skills, `sheetHeader`, the Skills tab, the Trackers tab, `RO_READERS`, `inertSheet`, `phone-check`.
  - Superseded in part: **156** (untrained rows at full strength, "Main's combat table included"; it *rejected* dimming), and **24** (Pain's reason "shown inline (breakdown column + chip)"). 24 wasn't in the brief; it's the oldest statement of the per-row pain. If EQ29 takes its default, **96**'s "reported separately as `breakdown.conditions`" still holds for the engine, and only the row's text changes, so 96 is cited, not marked.
  - Cited, and they stand: **165** (Combat before Stats; the fold is how the shape meant to bring Stats up), **151** (Take a hit; untouched), **233** (a trait's effect on a row: it still shows on every row drawn, folded or not), **256** (the read-only sheet's readers), **283** (Conditions on Main; the totals line it leaves is what EQ29 leans on).

**Carried over:**
- *From E2a's review (Opus), the order's:* none of its findings were the order's at the level of shape. Its voice pass fixed copy the build wrote (V1, V2, V5, V8). So this order's copy is short, and §9 marks every string for the voice pass.
- *From E1c's review:* a `<details open>` wrapper around a fold let one tap hide the held picks. **This fold has no wrapper.** The trained rows are drawn outside it, always, and the button reveals only the untrained rows. No tap anywhere on Main hides a trained combat skill.
- *From E1b:* a height target set from an estimate was missed by 33%. Every figure here is a measurement of the prototype, and the shape's 600px was an estimate, which is why EQ28 exists.

---

## 1. Goal and Done when

**Goal:** a player reads each number once. Main shows the combat skills they've trained, and the rest are one tap away. A skill row says what's particular to that skill, and the line above the table says what applies to all of them.

**Done when:**
- Main's Combat skills table shows only trained combat skills, and under it a button, **Show N untrained**. Pressing it shows the untrained rows in the same table, and it reads **Hide untrained**. No trained row is ever hidden.
- No skill row on Main or Skills says "pain". With EQ29's default, none says "conditions" either. The line above each table still names the penalty and says the totals include it.
- On Skills, and on Main once shown, an untrained row's name and check are Overcast Steel (`--dim`). Its chips keep their colours.
- Trackers has no intro under its title (EQ31). Skills' intro no longer starts "Every skill, grouped by category."
- GM mode's seat sheet: the fold button works, and nothing else on the sheet becomes pressable.
- At 375×812, with no popover open and the fold closed, Stats on Main sits within 10px of the prototype's position, or above it:

| | Dax | Juno | Kade | Sigrun | Wren |
|---|---|---|---|---|---|
| Untrained combat skills | 7 | 7 | 6 | 6 | 9 |
| Stats' top, today | 3,109 | 2,347 | 2,555 | 3,030 | 2,457 |
| Stats' top, prototype, folded | 2,556 | 1,793 | 2,087 | 2,562 | 1,733 |
| **Rise** | **553** | **554** | **468** | **468** | **724** |
| Main's height, today | 4,066 | 3,252 | 3,460 | 3,936 | 3,363 |
| Main's height, prototype, folded | 3,513 | 2,699 | 2,992 | 3,468 | 2,639 |
| Main's height, prototype, shown | 4,110 | 3,296 | 3,504 | 3,980 | 3,407 |

  Shown is today's height plus the button (44px). Skills' heights don't move (Dax 4,075, Juno 3,840, Kade 3,750, Sigrun 3,878, Wren 3,897). Trackers comes in by the intro's height.
- No task in E2's §2 takes more moves. Rolling an untrained combat skill from Main is one tap more than today. Rolling it from Skills is unchanged, and Skills is its home (E2's shape).
- `npm run verify` and `npm run phone-check` pass. The frame fixture is re-recorded only for `sheet: main`, `sheet: skills` and `sheet: trackers`.

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape*. What Main shows, and what a row says, are player-facing behaviours someone could have chosen otherwise, and it supersedes two decisions in part.
- **Versions:**
  - **App: patch.** A visible change with no new capability, as E1c's fold was. `npm run bump` moves the `[Unreleased]` heading from whatever it reads when built (0.68.0 now) to the next patch.
  - **Game data: unchanged** (Decision 68). No data string or value moves.
  - **Character, table and pack schemas: unchanged.** The fold is browser state (`S`), not stored. No `migrate()` step.
- **Numbers:** two decisions, **N and N+1**: the next free numbers on `origin/main` when it's built (284–285 if nothing lands first). No flags.

## 3. Decisions, drafted in full

```
N. **Main shows the combat skills you've trained, and folds the rest behind Show N untrained; an untrained row is dimmed wherever it's drawn.**
     *2026-11-?? · Ken + Claude · Touches: skillTableHtml, includeUntrained, renderShMain, main-combat, Combat skills, main-stats, data-untrainedfold, data-untrainedrows, S.combatUntrained, bindSheetReaders, RO_READERS, inertSheet, skillRowPair, skill-line, untrained, Rank 0, skill-table, Overcast Steel, --dim, Skills tab, phone-check, E2b*
     - **Decided:** Main's Combat skills table draws trained combat skills. Untrained ones are drawn in the same table, hidden, and a button under it, **Show N untrained**, shows them; it then reads **Hide untrained**. Nothing hides a trained row. The choice lasts while the sheet is open and starts folded for each character opened. On Main and on Skills an untrained row's text is Overcast Steel; its chips keep their colours. A skill is untrained when its rank is 0 (`skillLine().trained`), whatever its row carries (EQ30). Skills still lists every skill in full (Decision 156).
     - **Why:** the critique's five lived-in files: the full combat table ran 938–1,096px on a phone and put Stats 2,347–3,109px down, and an untrained row was drawn at the same weight as a trained one. Folding it raised Stats by 468–724px (E2b's §1). Skills is every skill's home (E2's shape), so Main can show only the ones a player rolls.
     - **Rejected:** the shape's 600px target for every character (EQ28: a phone draws each row 85px tall, so it needs eight rows folded, and four of the five fold six or seven); a `<details>` around the untrained rows (E1c: a wrapper you can tap can hide what's kept); a phone-only fold in CSS (Decision 165: a phone and a desktop would show different contents); keeping a row with a chip or a trait's effect out of the fold (EQ30); dimming the whole row, chips included (a chip is a signal, The Signal-Not-Decor Rule).
     - **Replaces:** Decision 156 in part (an untrained row is dimmed, not drawn at full strength, and Main's table shows trained skills, folding the rest). Decision 165 (Combat before Stats) and 233 (a trait's effect shows on its row) stand.
     - **Revisit if:** players roll untrained combat skills from Main often enough to want them open by default, or E6 slims the phone's skill rows, which changes what the fold is worth.
     - **Built:** app X.Y.Z (patch), PR #…, log entry.

N+1. **A skill row says what's particular to that skill: Pain's penalty, and a Condition's, are said once above the table.**
     *2026-11-?? · Ken + Claude · Touches: skillRowPair, breakdown, breakdown.pain, breakdown.conditions, painChip, conditionTotalsNote, Skills tab, Main's Combat table, Pain Lv chip, "totals include it", E2b*
     - **Decided:** No skill row says "−N pain" or "−N conditions". The penalty is in each row's check as before. The line above Main's Combat section and above the Skills table names it and says the totals include it, with the Pain Lv chip (EQ29). A row's breakdown keeps its rank, its stats, "untrained", and each trait's part, since those differ by row.
     - **Why:** Dax's Skills tab said "−1 pain" 36 times under a line that already said the totals include it (E2's §1). A number that's the same on every row is read once.
     - **Rejected:** keeping it on the rows (the critique's repetition); dropping the line above instead (it's the one place that says the totals include it); keeping "conditions" on the rows while dropping "pain" (EQ29: the same repetition, with the same line above it).
     - **Replaces:** Decision 24 in part (the reason is the line above the table and the chip, not the breakdown column). Decision 96's `breakdown.conditions` stays in the engine and keeps its readers; only the row's text changes.
     - **Revisit if:** a penalty starts to differ from one skill to the next (a Condition that hits only some skills), when the row is where it belongs again.
     - **Built:** app X.Y.Z (patch), PR #…, log entry.
```

**Supersession marks** (CLAUDE.md, *Decisions*):
- **156:** `→ **Superseded in part by Decision N**: an untrained row is dimmed, and Main's table folds the untrained rows behind Show N untrained.`
- **24:** `→ **Superseded in part by Decision N+1**: the reason is the line above the table and the chip, not each row.`
- Each mark goes on its INDEX §3 line too. N and N+1 each get a line under the sheet's topic.

## 4. Questions for Ken

Each question has a default, and one left blank takes it.

- **EQ28 — The height target.** The shape asked for Stats to rise at least 600px for every test character. Folding the untrained rows raises it 468–724px (Dax 553, Juno 554, Kade 468, Sigrun 468, Wren 724). A phone draws every skill row 85px tall, so 600px needs eight rows folded.
  - **Default:** take the measurement as the target, as §1's table, and leave a phone's row height to E6 (the phone).
  - *Alternative:* hit 600px here by slimming the phone's skill rows too (the breakdown line behind the `?`, say). That's E6's subject, and it would change Skills as well.
- **EQ29 — "−N conditions" on the rows.** It's the same repetition as "−1 pain": the line above the table already says "Conditions take −N; totals include it."
  - **Default:** it comes off the rows too.
  - *Alternative:* only "pain" comes off, as the shape named it.
- **EQ30 — What folds.** An untrained combat skill can still carry something on its row: an "in training" chip, a trait's mark or Take X (Decision 233), or "not while shifted". None of the five TestCharacters has one today.
  - **Default:** fold by rank alone. Untrained is untrained, and Skills shows every row in full.
  - *Alternative:* keep any untrained row that carries a chip or an effect out of the fold.
- **EQ31 — Trackers' intro.** "Current state only — every maximum on this page is computed and recalculates the moment an input changes." All of it describes the software.
  - **Default:** no intro. The title and the panels say what the page is, and E5 writes any intro that comes back, in NYTE's voice.
  - *Alternative:* one line of what's there, such as "Your pools, your recovery, your armor and your Çredits."

## 5. The assumption sweep

| What | True today | Where | True after |
|---|---|---|---|
| Main's combat table | Every combat skill, trained or not, at full strength | `skillTableHtml(…, {includeUntrained:true})`, `sheet.js:375`, called at `sheet.js:481` | Trained rows in one `<tbody>`; untrained rows in a second, hidden unless `S.combatUntrained`; the button under the table. `includeUntrained` keeps its name and now means "draw them folded". It has one caller |
| The table with nothing trained | Never empty: every combat skill draws | `sheet.js:377–378` | No trained combat skill: the button alone, under the Combat skills heading. Wren has two, so no TestCharacter shows this. Example 4 covers it |
| "No combat skills defined." | Shown when the data has no combat skills | `sheet.js:481` | Unchanged. It still means the data has none |
| A hidden `<tbody>` on a phone | — | `.skill-table tbody{display:block}`, `shadows.css:924` | A `[hidden]` rule that wins it, as `tr.skill-desc[hidden]` does at `:934` |
| A folded row's description | `skill-desc` rows open by `S.openSkills`, under their row | `skillDescRow`, `sheet.js:347` | Drawn in the hidden `<tbody>` with its row, so it hides with it. An open description on a folded row comes back open when the fold is shown |
| The fold's binder | — | `bindSheetReaders`, `sheet.js:3797` | Flips `hidden` and the label in place, with no re-render, as `[data-skilldesc]` does. In `bindSheetReaders` so the read-only sheet binds it too |
| GM's read-only sheet | `inertSheet` disables any button not in `RO_READERS` | `gm.js:4397`, `4413` | `RO_READERS` gains `[data-untrainedfold]`. `smoke-table-sheet`'s Decision 256 tests keep their "nothing writes" check |
| Fold state | — | `S` | `S.combatUntrained`, browser state. `openEntry` builds a new `S` (`wizard.js:870`), so each character opens folded. GM mode's seat sheet shares the GM's `S`: opening it on one seat opens it on the next. That's acceptable; say so in the PR |
| An untrained row's look | Rank 0 dimmed; the synergy chip dimmed (`.skstat.syn.off`); "untrained" in `--dim` | `shadows.css:914`; `shared.js:47`; `sheet.js:360` | The whole row's text in `--dim` (Overcast Steel, `#8C97B5`; slate `#5B6472` in light, `shadows.css:41`). Measured 6.1:1 on the dark ground. `.chip` keeps its own colour. The inline `color:var(--dim)` on "untrained" becomes redundant; remove it |
| Per-row pain | `−1 pain` in magenta when `b.pain` | `skillRowPair`, `sheet.js:361` | Gone |
| Per-row conditions | `−N conditions` in magenta when `b.conditions` | `sheet.js:362` | Gone (EQ29) |
| The line above Skills | "<Pain label> — all skill checks take −N; the totals below already include it." + chip; then `conditionTotalsNote(ch, false)` | `sheet.js:505–506` | Unchanged. It's what N+1 leans on |
| The line above Main's Combat | Chip in the heading; "<label> — all checks take −N; totals below include it."; `conditionTotalsNote(ch, true)` | `sheet.js:447–450` | Unchanged |
| `breakdown.pain`, `.conditions` | The engine reports both | `engine.js:1238` | Unchanged. Grepped across `src/`, `tests/` and `tools/`: the only UI reader is `skillRowPair` (`sheet.js:361–362`). The engine and rules tests read both (`engine.test.mjs:1163–1177`, `1369`; `rules.test.mjs:2243`, `2317`, `3047`) and stay as they are |
| The Pain popover and card | "−1 skill · −1 Essence · …" | `painPenaltyLine`, `sheet.js:9`; called at `410`, `1514`, `1588` | Unchanged. It's Pain's own card, not a skill row |
| Print | Combat Quick-Ref lists every combat skill's check; the Skills page has its own table | `pSkillCellsHtml`, `sheet.js:2776`; `pSkillsTableHtml`, `2930` | Unchanged. Print never showed per-row pain and doesn't fold |
| The wizard's skill line | Its own renderer, `skillStatsHtml` | `shared.js:47` | Unchanged |
| Trackers' intro | "Current state only — every maximum on this page is computed and recalculates the moment an input changes." | `sheet.js:1551` | None (EQ31). `sheetHeader` draws no `step-note` when `note` is empty |
| Skills' intro | "Every skill, grouped by category. Trained skills roll 1d10 + Rank + Primary Stat + Synergy; untrained roll 1d10 + Primary Stat only. Tap <b>?</b> on any skill for what it covers." | `sheet.js:504` | The first sentence goes. The roll is the game's, not the software's |
| Other intros | Character, Progression, Loadout (E2a's voice pass, V1, V4, V3); Notes ("Freeform. The city keeps receipts — so should you."); Main has none | `sheet.js:717`, `1694`, `2520`, `2604` | Unchanged. E5 owns the words |
| Comments that describe the table | "every combat skill" (`sheet.js:443–446`); "Decision 156: an untrained skill reads at full strength, Rank 0 dimmed" (`:366`); "Decision 156: every skill, trained or not…" (`:507`) | `sheet.js` | Rewritten to name N where they describe what changed. `:507` still holds for Skills |
| `phone-check` | Records `main`'s children on every sheet tab | `tools/phone-check.mjs:185` | `sheet: main`, `sheet: skills` and `sheet: trackers` move; re-record the fixture for those only |
| `PRODUCT.md` | "a nine-tab running sheet" | `PRODUCT.md` | Stale since E2a, and not this order's. A follow-up (§7) |

## 6. Read first

- `CLAUDE.md`: constraint 3 (the fold's styles go in `shadows.css`, not inline); constraint 9 (no build state in copy); *Change tiers*; *Decisions*.
- `SCHEMA.md` §4: Decisions **24, 96, 156, 165, 233, 256, 283**.
- `DESIGN.md`: Overcast Steel (the colour section), The Signal-Not-Decor Rule.
- `src/ui/sheet.js`: `skillRowPair`, `skillDescRow`, `skillTableHtml`, `renderShMain` (the Combat section), `renderShSkills`, `renderShTrackers`'s header, `bindSheetReaders`.
- `src/ui/gm.js:4393–4455` (the read-only sheet: `RO_READERS`, `inertSheet`, `bindReadOnlySheet`).
- `src/styles/shadows.css:909–935` (the skill table and its phone layout).
- E1b's fold (Decision 276, `wizard.js:341`, `S.specAll`) and E1c's (Decision 279): the "Show all N" pattern this follows.

## 7. Out of scope

- **E6, the phone:** the skill row's 85px height, and anything else that would bring Stats up further (EQ28).
- **E5, the words:** any intro beyond the two §5 trims, and the in-panel lines that describe the software (Sanity's "…, computed.", a tracker's "Capped by Tolerance (computed).", and the fallback "Set the max when the rules land — the tracker won't block on un-modeled rules.", which narrates build state if any panel reaches it). These are E5's leads; list them in its order.
- **E3:** Main's columns at 1280px.
- **The print sheet.**
- **The Pain card and popover's own line** (`painPenaltyLine`).
- **`PRODUCT.md`'s "nine-tab"** (stale since E2a). A one-line Docs fix; the conductor can take it.
- **Folding anything else on Main**, or Skills' own categories.

## 8. The shapes

No data shape, save-file field, engine function or `migrate()` step changes. Browser state only: `S.combatUntrained`.

## 9. The UI

**Main's Combat skills:** the heading, then the table of trained combat skills, then one button under it.
- **Show N untrained**, where N is the number of untrained combat skills. A `btn sm ghost`, or whatever reads as a quiet secondary control beside the table: the builder's call within DESIGN.md.
- Pressed, the untrained rows appear in the same table, after the trained ones, in data order, dimmed. The button reads **Hide untrained**.
- `aria-expanded` follows, and `aria-controls` names the folded rows.
- No untrained combat skills: no button.

**An untrained row**, on Main and on Skills: name, Rank 0, check and breakdown text in Overcast Steel. The `?`, the chips (focused, in training, not while shifted) and the synergy chip's own dimming are as they were.

**A skill row's breakdown:** rank (or "untrained"), the two stats, each trait's part. No "pain", no "conditions" (EQ29).

**Copy** (drafted, for Ken's voice pass):

| Where | Today | Draft |
|---|---|---|
| Main's fold, closed | — | "Show 7 untrained" |
| Main's fold, open | — | "Hide untrained" |
| Trackers' intro | "Current state only — every maximum on this page is computed and recalculates the moment an input changes." | None (EQ31) |
| Skills' intro | "Every skill, grouped by category. Trained skills roll 1d10 + Rank + Primary Stat + Synergy; untrained roll 1d10 + Primary Stat only. Tap **?** on any skill for what it covers." | "Trained skills roll 1d10 + Rank + Primary Stat + Synergy; untrained roll 1d10 + Primary Stat only. Tap **?** on any skill for what it covers." |

**Where things land:**

| Press | Record | View | Focus |
|---|---|---|---|
| Show N untrained | `S.combatUntrained = true` | The untrained rows show in place; nothing re-renders, and the page doesn't scroll | The first untrained row's name cell (`td[data-skillname]`, already `tabindex="-1"`), so a keyboard and a screen reader land on what appeared |
| Hide untrained | `S.combatUntrained = false` | The rows hide in place | Stays on the button, which is still there |
| Any action that re-renders Main (Hurt 1, a Condition, a reload of a weapon) | — | The fold stays as it was | As today |
| A `?` on a shown untrained row, then Hide, then Show | `S.openSkills` | The description comes back open | As above |
| Another character opened | new `S` | Folded | As today |
| The read-only sheet's fold (GM mode) | `S.combatUntrained` | The seat's rows show | As above. No writer becomes pressable |

## 10. Worked examples, as named tests

Write these first, and show each failing on `main`.

1. `smoke-sheet-skills.test.mjs`: **"Decision N: Main shows trained combat skills and folds the rest behind Show N untrained"**. A character with some combat skills trained and some not:
   - Main's Combat table's visible `.skill-line` rows are exactly the trained combat skills, from the data (`D.skills` by category, `Engine.skillLine(…).trained`), never a hand list;
   - the untrained ones are in the table and hidden;
   - the button reads "Show N untrained" with N the count;
   - press it: every combat skill is visible, the button reads "Hide untrained", `aria-expanded` is `true`, and focus is on the first untrained row's name cell;
   - press it again: they're hidden, and focus is on the button.
2. Same file: **"Decision N: the fold outlives a re-render and starts folded for the next character"**. Show the untrained rows, press Hurt 1: still shown. Open another character: folded.
3. Same file: **"Decision N: nothing on Main hides a trained combat skill"** (E1c's trap). Every `button`, `summary` and `[aria-expanded]` control in Main's Combat section is pressed in turn: every trained combat skill's row is still visible after each.
4. Same file: **"Decision N: a character with no combat skill trained gets the button alone, and one with every combat skill trained gets none"**. Build both from the data.
5. Same file: **"Decision N: an untrained row is dimmed on Skills, and its chips aren't"**. The `.untrained` class is on exactly the untrained rows (as Decision 156's test checks), and the stylesheet gives `tr.untrained td` the `--dim` colour. jsdom has no cascade worth trusting, so read the rule from `shadows.css` (as other style guards do) rather than `getComputedStyle`.
6. `smoke-sheet-skills.test.mjs`: **"Decision N+1: no skill row says pain or conditions, and the line above says the totals include them"**. A character at Pain Level 1 with a Condition carrying a `rollPenalty` (chosen from `D.conditions` by its field):
   - no `td.bd` on Skills or on Main says "pain" or "conditions";
   - every row's check still includes both (compare with `Engine.skillLine`);
   - Skills' line above the table names the Pain penalty and "already include it", and `conditionTotalsNote` says "totals include it";
   - Main's Combat section says the same.
7. `smoke-table-sheet.test.mjs`: **"Decision N: the read-only seat sheet's fold opens, and nothing that writes is pressable"**. Dead Air's seat sheet on Main: the fold button isn't disabled, pressing it shows the rows, and Decision 256's check that no writer is enabled still holds.
8. `smoke-sheet-play.test.mjs` (or wherever the tab intros are read): **"E2b: Trackers has no intro, and Skills' doesn't describe the software"**. Trackers' title has no `.step-note` after it (EQ31's default). Skills' first `.step-note` doesn't contain "grouped by category". No sheet tab's intro contains "computed", "recalculates", "auditable" or "undoable".

## 11. Tests beyond the examples

- **Phone:** record §1's table for the build in the PR, measured as §1's were (the five TestCharacters, `openEntry`, 375×812, fold closed and then open). Copy the TestCharacters from Ken's main checkout's `tests/TestCharacters`; they're gitignored.
- **The phone's hidden rows:** with the fold closed at 375px, the untrained rows' boxes have zero height in Chromium (`phone-check`, or the preview). jsdom can't see the `display:block` trap; only a real layout can.
- **No stored state moved:** a character's JSON is byte-identical before and after pressing the fold both ways.
- **Voice:** `voice.test.mjs` passes on the new strings.
- **Mutation tests**, each against the built code:
  - Draw the untrained rows unhidden: example 1 fails.
  - Put the trained rows inside the folded `<tbody>`: example 3 fails.
  - Reset `S.combatUntrained` in `renderShMain`: example 2 fails.
  - Drop `[data-untrainedfold]` from `RO_READERS`: example 7 fails.
  - Put back the `b.pain` line in `skillRowPair`: example 6 fails.
  - Drop the `[hidden]` rule from `shadows.css`: no jsdom test can fail. Say so in the PR, and show the phone measure catching it instead.
  - Check each for a second path that already covers the line, as the pre-flight asks.

## 12. Steps

1. **The examples as failing tests.** Write examples 1–8 and run `npm run test:fast`.
2. **N: the fold and the dimming.** `skillTableHtml`, the binder in `bindSheetReaders`, `RO_READERS`, the CSS (the `[hidden]` rule and `tr.untrained td`). Update the tests in §13 that read Main's untrained rows. Run `npm run verify`.
3. **N+1: the rows.** Drop the pain and conditions parts from `skillRowPair` (EQ29). Run `npm run verify`.
4. **The intros (§9)**, and the comments named in §5.
5. **The decisions and marks (§3)**, with their INDEX lines.
6. **In the dev preview, at 375×812 and 1280×860, with all five TestCharacters:** Main folded and shown, Skills, Trackers, and GM mode's seat sheet (Dead Air) with the fold pressed. Put the **screenshots in the PR**, with §1's figures before and after.
7. **`npm run phone-check`.** Re-record the frame fixture if only `sheet: main`, `sheet: skills` and `sheet: trackers` moved.
8. **Mutation tests (§11), then close-out (§14).**

## 13. Stop and ask

**Stop if:**
- Stats on Main, folded, sits more than 10px below §1's prototype figure for any TestCharacter: report the measurement, rather than trimming something else;
- the fold needs a re-render to work on the read-only sheet;
- a test you didn't expect pins a row's "pain" or "conditions" in a way that suggests another reader (the print, a popover, GM mode's Players view).

**Not a stop.** The prototype's `npm test` at `301a714`, with the fold, both rows' parts gone, the dimming and both intro trims, failed **1 of 1,782**. It is the suite's own list:
- **`smoke-sheet-play`, "a flat Condition penalty reaches the skill totals the sheet shows"** (`:246`) asserts `/-1 conditions/` on Main. Under EQ29's default that's the line N+1 removes: drop that assertion, and keep the test's other two (the total, and "Conditions take −1; totals include it"). Under EQ29's alternative nothing breaks.
- **Why so few:** every other test reads Main's combat skills through `textContent`, which includes hidden rows. So no existing test would notice a fold that hid a trained row, or one that hid nothing. Examples 1 and 3 check `hidden` on the rows, never `textContent`.
- **The re-recorded frame fixture** for `sheet: main`, `sheet: skills` and `sheet: trackers`.
- **The app version literals** the patch bump moves.

## 14. Close-out

- **`close-the-session`, for *Rule or shape*:**
  - N and N+1 from §3, with *Built* filled in;
  - the two supersession marks, and their INDEX lines;
  - the app patch bump;
  - STATE rewritten where E2 stands (E2 built; E3, E5 and E6 are unblocked);
  - a log entry;
  - a `shipped.md` row.
  - In the plan's §3, the E2 row links this order and reads "E2b built".
- **CHANGELOG** (player voice, for the voice pass):
  - "Main shows the combat skills you've trained. The rest are a tap away under **Show untrained**, and every skill is still on Skills."
  - "Untrained skills are dimmed, and a skill's row no longer repeats your Pain or Conditions penalty: the line above the table says it once, and the totals already include it."
- **PR title:** `feat(sheet): say each thing once: Main folds untrained combat skills, rows drop the shared penalty, untrained dims (E2b, Decisions N–N+1)`.
- **PR body:**
  - the template's sections;
  - every new string as it renders, for the voice pass;
  - §1's figures, before and after, folded and shown;
  - **Where the order didn't fit**;
  - the screenshots.
- **Review checklist:**
  - Re-do §5's sweep by grepping for readers: `skillTableHtml(`, `skillRowPair(`, `includeUntrained`, `breakdown.pain`, `breakdown.conditions`, `.untrained`, `RO_READERS`, `sheetHeader("Trackers"`.
  - At 375px in Chromium, the folded rows take no height. This is the trap jsdom can't see.
  - Every TestCharacter's Main: no trained combat skill is ever hidden, whatever's pressed.
  - Every TestCharacter's Skills: dimmed rows are untrained, and the chips on them keep their colours. Check the light theme too.
  - GM mode's seat sheet: the fold works, and nothing that writes is enabled.
  - Re-run §11's mutations.

## 15. Handing it over

The builder and reviewer prompts are in `docs/WORK-ORDERS.md`, with this order's path. This order's traps:
- **The phone un-hides a hidden `<tbody>`.** `.skill-table tbody{display:block}` below 640px beats `hidden`. Add the `[hidden]` rule, and check it in Chromium at 375px, since jsdom passes either way.
- **A reader the read-only sheet doesn't know is a dead button.** Add `[data-untrainedfold]` to `RO_READERS` and bind it in `bindSheetReaders`, not `bindSheet`.
- **`textContent` can't see a fold.** It includes hidden rows, which is why only one test broke in the prototype. A test of what Main shows reads each row's `hidden` (or its `<tbody>`'s), never the section's text.
- **No wrapper you can tap** (E1c). The trained rows sit outside anything that folds.
- **A folded row's description row** hides with it. Draw both in the folded `<tbody>`.
- **Measure the way §1 did**, in the same preview session for before and after.
- **Mount the private repo** with `git submodule update --init private` in a fresh worktree before the suite.
