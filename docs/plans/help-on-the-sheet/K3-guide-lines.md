# Work order K3: Guide lines everywhere

**Plan:** [`../help-on-the-sheet.md`](../help-on-the-sheet.md) §3, row K3, and K3's pre-flight line. **Wishes:** [W156](../../WISHLIST.md) (Help on the sheet: the guide lines beyond the tab intros) and W154 (the seat sheet's intros). **Built on:** [`K1-one-help.md`](K1-one-help.md) (the switch, the tab intros, Decision 289) and [`K2-every-word.md`](K2-every-word.md) (`Engine.word`, Decision 291). Decisions 68, 135, 139, 201, 215, 256, 273, 278, 282, 287, 289, 291.

**Status: drafted 2026-11-16** by Claude (Opus), the K2 reviewer, at the conductor's request. **Not approved.** The plan's KQ1–KQ8 are answered (Ken, 2026-11-15: every default). This order's KQ19–KQ22 (§4) are **answered (Ken, 2026-11-16, in the conductor's session): Default on all four** ("No Help in it", "No guide lines on a seat", "Hides with guide lines", "Out of K3").

**Branch:** cut from `origin/main` at the pre-flight commit. PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **K3 build** (Sonnet), then a fresh **K3 review** (Opus) once the PR is open. §15 is the hand-over.

**Runs alone.** It touches `sheet.js` (about a dozen lines and one helper), `gm.js` (the seat's Help context and the seat's lines), `shadows-data.js` (`sheetGuide.lines`, `sheetGuide.seat`, `appCopy.ranksAdvanceInPlay` moves, the Thirst panel's `unrested.text`, the Difficulty quote), the tests and the docs. It's no engine change. If another order is open when this one builds, the versions, CHANGELOG's heading and the decision number go to whichever merges second.

**Carried over from K2** (its review, PR #352):
- **The order's misses.**
  - §8's merge rule named the gameTerms rows that fold into another source (derived, Stat, LUCK, Condition) and said nothing about `painLevel`. The build dropped Pain Levels 0–3 from *Every word*, and the count test counted them as merged, which pinned the gap.
  - The pre-flight read the data's difficulty names against one CRB chapter (0300) and not the others (2130, the GM Workshop), so the book's own contradiction surfaced only at review.
  - Example 2 asked for EMP's three meanings to be adjacent, while §8 sorted by title and made a Stat's title its name. The order contradicted itself.
  - §9 made the find bar sticky on a phone only. Ken wanted it sticky at every width.
  - Quoting a book line that starts lowercase ("**Threshold (TH)**: the number of Hits…") wasn't covered. The build dropped the defining clause. Quoting from the label passes the cross-check.

  **Here:** §5's table is the source list, and every row says where it lands, including the ones that stay. Each copy change is read against every CRB chapter that states it (§12, step 5). No example asks for something §8's rules can't give.
- **The build's misses.**
  - The PR body lacked the gap lists and the expected breaks old → new.
  - The walk skipped a Professional and 1024.
  - The builder hit its usage limit in the middle of a merge from `main` and resumed later.

  **Here:** the PR body's sections are checked last (§14). The walk is a named list (§12, step 8). §12, step 6 says to commit before merging `main`.
- **Impeccable, without the `context` launcher.** K2's builder didn't run the launcher, because it downloads a binary. Harden was done by hand and polish needed Ken. K3 adds little UI (a dozen lines move, one helper draws them), so **harden and polish are done by hand against §12, step 7's checklist**, and the PR reports each item. The launcher isn't run.
- **Ken (K1):** Main's guide line is hidden under 640px (`@media (max-width:639px){ #main [data-guide="main"]{display:none} }`). K3 keeps that. Its new lines use `data-guide-line`, not `data-guide`, so neither that rule nor K1's guard (`/\[data-guide="(?!main)/`) moves.

**Pre-flight against `main` at `c963402`** (0.72.0, K2 and L5b merged). Game data 0.58, character schema 0.34. Take the next free numbers on `origin/main` when they're written. Nothing was committed but this order.

```
step-note lines     sheet.js has 77 `step-note` occurrences (grep -c), in 40 functions, all classified in §5's first table.
                    The plan expected a sweep of 76 guide lines. Most are state (an empty list, a pick owed, Pain) or rule
                    (a cost, a cap, what the sheet does or doesn't apply). Only 11 sentences are guide, in 11 places.
Other note classes  modal-note ×6, hitnote ×19 (Take a hit), p-note ×2 (print), note ×4 (Admin's banner at 249, journal rows).
                    Dialogs and print are out (§7, KQ22). Admin's banner (249) is state + rule: it stays.
The switch today    sheetGuideOn() (sheet.js:48): on a table screen it's the table's guideOn(); on the sheet it's
                    shadows.ui.sheetGuide !== "off". Only sheetHeader (sheet.js:167) reads it: one guide line per tab.
The seat today      drawReadOnly (gm.js ~4347) runs SHEET_RENDER[section] with S.ch the clone and S.screen "table", so the
                    seat draws the player's guide lines under the table's switch and the player's rule lines as they are.
                    Its Progression says "Log a session when it truly ends…" on a sheet nobody can log on (W154).
                    smoke-table-sheet.test.mjs:346 (E5) pins both the seat's intros and a [data-guide] on each tab.
The seat's Help     tableHelpContext (gm.js:386) answers "character" for a seat's sheet: gmGuide.contexts.character, the
                    same text whichever tab is open, words ["characterCopy"]. KQ6's default ("names the sheet's tab
                    that's open and shows that tab's words") isn't built.
Expert mode         wizard only: app.js:60 draws it in the header when S.screen==="wizard"; expertStep() is wizard steps.
                    The sheet has no Expert mode, so the plan's "Expert mode" context has nothing to attach to. Dropped
                    (KQ7 keeps the wizard out).
Admin               already a context (K1: sheetGuide.contexts.admin). Nothing to add.
The owed-pick       Decision 273: a line at the top of each tab (state) and a dialog. The ? key is off under a modal
dialog              (sheet.js:157), and the panel sits behind the dialog's top layer. KQ19.
The Thirst line     sheet.js:2789 draws v.unrested.text ("Instead of A day unfed: the day's Thirst and 2 more.",
                    shadows-data.js ~3076) under the buttons. sheet.js:2788 puts the same text in the A day without rest
                    button's `title`. It doesn't name the button, so it reads as a stray tooltip (Ken, on a vampire). It
                    states a rule, so it stays visible (KQ5). It's the only `label` + `text` pair in the data drawn this
                    way (grep '"label": …"text":': tagReads and tagless render with their label).
Difficulty          gameTerms "difficulty" (K2, Ken's answer) quotes 0300's first sentence only. main's CRB mirror
                    (private @ c99bb58) now reads "Typically: 10 for easy, 15 for average, and 20 for challenging
                    difficulty." Ken's amendment has landed, so K3 quotes the whole sentence.
Tests that pin a    grep of every guide sentence below in tests/: only voice.test (appCopy.ranksAdvanceInPlay) and
guide sentence      smoke-table-sheet E5 (the seat). The rest are unpinned, so §10 pins them.
```

---

## 1. Goal and Done when

**Goal.** With **Guide lines** off, the sheet shows its state and its rules and nothing that only explains the sheet, on every tab. With it on, it reads as today, apart from the lines this order rewrites. A seat's copy on a table reads as a copy, not as the player's own sheet (W154), and the table's Help on a seat names the open tab and its words (KQ6).

**Done when:**
1. Every sentence §5 marks **guide** is in `sheetGuide.lines` and is drawn through one helper that returns nothing when the switch is off. No guide sentence is left in `sheet.js`.
2. With the switch off, the only text that leaves any tab, for any of the four archetypes, in a full state and in an empty one, is the guide lines. Every state and rule sentence is still there (§10, example 1, by diff).
3. Mixed paragraphs are split: the guide sentence goes, and the state or rule beside it stays.
4. A guide line that points at a tab (`{tab:loadout}`) draws that tab's button, as `data-gotab` does today.
5. On a seat (KQ20): no sheet guide line draws, and Progression's rule line reads from `sheetGuide.seat`, saying that the player logs sessions on their own sheet.
6. The table's Help on a seat names the open tab ("A character's sheet: Loadout") and lists that tab's `sheetGuide` words, read through `Engine.word` for the seat's copy.
7. The Thirst panel's line under its buttons names **A day without rest**. The button's `title` stays as it is.
8. *Every word*'s Difficulty quotes 0300's whole sentence, and E8 3 passes.
9. Main's guide line still hides under 640px, and K1's test for it passes unedited.
10. `npm run phone-check` passes.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** It's a data shape (`sheetGuide.lines`, `sheetGuide.seat`) and a player-facing behaviour someone could have chosen otherwise: what the switch hides, and what a seat shows.
- **App:** minor. The next on `origin/main` at build: **0.73.0**, or the one after.
- **Game data:** **no bump.** Decision 68 bumps for a computed value or an available choice. This order moves copy and quotes more of one sentence. K1 added `sheetGuide` with no bump (`shipped.md`), and that's the precedent. If the build finds a computed value moved, it stops (§13).
- **Character, table, pack schemas:** unchanged. The switch is browser view state (`shadows.ui.sheetGuide`), as in K1.
- **Decision N** (§3): the next free number on `origin/main` when it's written. No flags.

## 3. The decision, drafted

Paste as is; fill *Built*.

```
N. **Every guide line obeys the sheet's switch: a sentence that only explains the sheet lives in sheetGuide.lines and hides when Guide lines is off; a seat's copy draws none, and its Help names the open tab.**
     *2026-11-?? · Ken + Claude · Touches: sheetGuide.lines, sheetGuide.seat, guide line, rule line, step-note, Guide lines, shadows.ui.sheetGuide, sheetLine, {tab:…}, data-guide-line, data-gotab, ranksAdvanceInPlay, introProgression, Manual Adjustments, Major Milestones, custom spells, Training, Admin, seat sheet, drawReadOnly, tableHelpContext, gmGuide.contexts.character, unrested, A day without rest, Difficulty, Decision 201, Decision 256, Decision 273, Decision 278, Decision 289, W154, W156*
     - **Decided:** Every sentence the sheet writes is state, rule or guide. A guide sentence (where something is, what a section is for, what to do next) lives in `sheetGuide.lines`, is drawn by one helper and hides when Guide lines is off. A mixed paragraph is split. State and rule always show. A `{tab:id}` in a line is that tab's button. A seat's copy draws no guide line, and a rule line that tells the player to act reads from `sheetGuide.seat`. The table's Help on a seat names the open tab and lists its words.
     - **Why:** W156: with the switch off, the sheet should show what's true and what the rules say, and nothing that only explains the sheet. K1 hid the tab intros but left a dozen guide sentences behind. W154: a seat read as the player's own sheet.
     - **Rejected:**
       - Hiding whole `step-note`s: most hold state or a rule (KQ5).
       - Guide lines on a seat under the table's switch: they tell a player what to do on a sheet the GM can't change (KQ20).
       - A Help context for the owed-pick dialog: Help can't sit beside a modal (KQ19).
       - An Expert mode context: Expert mode is the wizard's (KQ7).
     - **Replaces:** Decision 289 in part (a seat draws no sheet guide line, and the switch reaches every guide line, not only the tab intros). Decision 278 in part (the table's `character` context names the seat's tab and lists its words).
     - **Revisit if:** players want a guide line back while the others stay off (one switch per line), or the wizard joins Help (KQ7).
     - **Built:** app 0.7?.0, no game-data or schema move, PR #?, log 2026-11-??.
```

## 4. Questions for Ken

The plan's KQ1–KQ8 are answered. These four came out of the pre-flight.

| Id | Question | Default | Alternative |
|---|---|---|---|
| **KQ19** | **Help for the owed-pick dialog** (Decision 273), which the plan names as a K3 context. | **No context of its own.** The dialog is a modal: the **?** key is off under it, and the panel sits behind it. The line that opens it is state ("1 Focused Skill to choose") and stays. | A Help button inside the dialog that opens a `focusedPick` context over it. That's a second Help, layered over a modal. |
| **KQ20** | **W154: what a seat's copy shows.** Today it draws the player's guide lines under the table's switch, and Progression says "Log a session when it truly ends…". | **No sheet guide line on a seat**, whichever switch is on: the table's Help says what a copy is. A rule line that tells the player to act reads from `sheetGuide.seat`, and today that's only Progression's: "The player logs sessions on their own sheet. Each pays {perHour} IP an hour of play, 1 Milestone Point, and refreshes their LUCK." (voice pass). | Guide lines stay on a seat under the table's switch, as today, and only Progression's rule line changes. |
| **KQ21** | **Flavour in an empty state.** "No sessions yet. NYTE City is patient." The second sentence isn't state, rule or guide. | **It hides with the guide lines.** A player who turned them off asked for a cleaner sheet. | It stays: the city's voice isn't orientation. |
| **KQ22** | **Guide sentences inside dialogs**, e.g. Improve a power's "Rewrite what changed. Its rank rises on Progression. Your notes stay yours." | **Out of K3.** A dialog is opened on purpose, and its lines belong to the action. They're listed for the voice pass. | They obey the switch too, through the same helper. |

## 5. The assumption sweep

### Every `step-note` in `sheet.js`, classified

**State:** what's true of this character now, including an empty list. **Rule:** a cost, a cap, a number, or what the sheet does or doesn't apply. **Guide:** where something is, what a section is for, what to do next. The review checks this classification, not a hunch. Line numbers are at `c963402`.

| Line | Function | Text (or its source) | Class | K3 |
|---|---|---|---|---|
| 33 | holdingHtml | holdingSentence | state | stays |
| 167 | sheetHeader | `sheetGuide.contexts.*.intro` | guide | K1's; on a seat, none (KQ20) |
| 168 | sheetHeader | the rule line (`introSkills`, `introProgression`, `introAdmin`) | rule | stays; Progression's reads `sheetGuide.seat` on a seat |
| 227 | conditionsHtml | "No Conditions." | state | stays |
| 243 | conditionTotalsNote | Conditions' totals | state | stays |
| 589, 646 | Main, Skills | Pain Level — checks take −N | state + rule | stays |
| 622, 662 | Main, Skills | "No combat skills defined." / "No skills defined." | state | stays |
| 701, 710 | Character | the archetype's description, its core mechanic | rule (catalog text) | stays |
| 702 | Character | Classification | state | stays |
| 734 | Character | "N Base Powers to place, on Admin." | state | stays (it's what's owed) |
| 735 | Character | Base Powers / Max Starting Rank | rule | stays |
| 740, 748 | Character | `content.powersText` | rule (catalog) | stays |
| **784** | Character | `appCopy.ranksAdvanceInPlay`: "Ranks rise with IP, on Progression." | **guide** | → `lines.ranksOnProgression`, "Ranks rise with IP, on {tab:progression}." |
| 785, 804, 813, 818 | Character | "Nothing here yet." / "None." / "No … on record." / "No archetype selected." | state | stays |
| 802, 803 | Character | Focused: advance at N× | rule | stays |
| 806 | Character | focusedOwedLines | state | stays |
| 848, 849 | Character | "No advantages." / "No disadvantages." | state | stays |
| **855** | Character | "What you carry is on **Loadout**." | **guide** | → `lines.carryOnLoadout`, "What you carry is on {tab:loadout}." |
| **856** | Character | "The pools you spend are on **Trackers**." | **guide** | → `lines.poolsOnTrackers`, "The pools you spend are on {tab:trackers}." |
| 973, 974, 976 | aberrationsHtml | "No Aberrations." + noStacking, permanent, adjustNote | state + rule | stays |
| 995 | minorChoiceBodyHtml | an option's `off` | rule | stays |
| 1001, 1008, 1183, 2089, 2597, 3408, 3541 | search results | "No … matches that." | state | stays |
| 1123, 1125 | openingHtml | "Opened: …" / "… bars it." | state | stays |
| **1810** | Trackers | "For what the sheet doesn't add up by itself: an item, a ruling, a scar the city left." **then** "A Stat moves everything…" | **guide + rule** | split: 1st → `lines.manualAdjustmentsFor`; the rest stays |
| **1874** | Progression | "Nothing yet. Log sessions to earn IP." | **state + guide** | split: "Nothing yet." stays; → `lines.ipFromSessions` "Log sessions to earn IP." |
| **1917** | Progression (Major) | "Each once, in any order, when you meet what it asks." **then** "Where the book leaves it to judgement, your table decides: taking one marked GM asks you to confirm." | **rule + guide** | split: 1st stays; 2nd → `lines.majorGmChip`, its chip by `{gmChip}`. *The plan cites this whole line as a guide line. The first sentence is a rule (Decision 217's Majors are each once), so it stays.* |
| 1936, 2002, 2229, 2296, 2456, 2536, 2657, 2858, 2878, 2898, 3548, 3694 | various | empty states | state | stays |
| **1985** | sessionHistoryHtml | "No sessions yet. NYTE City is patient." | **state + flavour** | split: 1st stays; 2nd → `lines.sessionsPatient` (KQ21) |
| **2183** | adminWriteInHtml | "Classification: X. It stays as it was at lock. Powers are edited, added and removed on Character." | **state + rule + guide** | split: the first two stay; → `lines.powersOnCharacter` "Powers are edited, added and removed on {tab:character}." |
| 2232 | powersPanelHtml | `powerAddNote` / `powerAddAdminNote` + "You have N IP." | rule + state | stays |
| 2242 | openImprovePower (dialog) | `powerImproveNote` | rule + guide | out (KQ22) |
| 2354 | reloadChooser | swap text + rounds left | rule + state | stays |
| 2450 | weaponRowsHtml | "Attack is 1d10 + the weapon's skill…" | rule | stays |
| **2694** | grimoireHtml | "Spells you improvised, or settled with your GM." **then** "Their numbers are yours, not the book's." | **guide + rule** | split: 1st → `lines.customSpells`; 2nd stays (the sheet doesn't check them) |
| 2731–2733 | togglePanelHtml | summary, changedBy, on.text | rule | stays |
| 2734 | togglePanelHtml | `applyFromText` "Apply these from their text." | rule (the sheet doesn't apply them) | stays |
| 2781 | feedPanelHtml | "Your SFR has no maximum yet." | state | stays |
| 2782 | feedPanelHtml | the kinds of blood, SFR per HL | rule | stays |
| **2789** | feedPanelHtml | `unrested.text` | **rule** (Ken's finding) | stays visible; copy names the button (§8) |
| **2853** | Admin | "TOL and WILL are worked out from other Stats, so they don't change here." **then** "Change the Stats they come from, or add a Manual Adjustment on Trackers." | **rule + guide** | split: 1st stays; 2nd → `lines.tolWillWhere`, with `{tab:trackers}` |
| 3337 | customPowerFormHtml | `powerAddNote` / `powerAddAdminNote` | rule | stays |
| 3375 | raiseResultsHtml | "TOL and WILL can't be raised with IP. They move when the Stats they come from do." | rule | stays |
| 3449 | focusedPickBodyHtml (dialog) | focusedOwedLines | state | stays |
| 3559, 3586 | ipDisadvantagesHtml, ipRestoreHtml | "No Character Points come back." / "Nothing is lost." | rule / state | stays |
| **3751** | trainResultsHtml | "Training sharpens a Skill you already have." **then** "Learn one with IP first, then train it here." | **rule + guide** | split: 1st stays; 2nd → `lines.trainLearnFirst` |
| (249) | Admin banner (`class="note"`) | "Free editing — caps and pools are off. Every change is logged…" | state + rule | stays |

The builder re-greps `step-note` at build. A line added since `c963402` gets a row in the PR and goes to the reviewer, who decides its class. The builder doesn't.

### What changes, and its readers

Readers were found by grep: `sheetGuideOn`, `sheetHeader`, `SHEET_GUIDE_PREF`, `guideOn`, `data-guide`, `data-gotab`, `ranksAdvanceInPlay`, `introProgression`, `drawReadOnly`, `RO_READERS`, `tableHelpContext`, `gmGuide.contexts.character`, `characterCopy`, `unrested`, `sheetGuide`, `step-note`.

| What changes | True today (where) | True after | Guards that read it · where it renders · text that points at it |
|---|---|---|---|
| `sheetGuide.lines` | — | `{ key: text }`. Text may hold `{tab:<SHEET_SECTIONS id>}`, `{gmChip}` and the `**bold**` marks | Decision 135's unread-key guard: `engine.test.mjs:327` MAPS gains `lines` (keyed by the line's id). A new test checks each key is read by a `sheetLine("<key>")` in sheet.js and each call names a key. voice.test walks `sheetGuide` already (`voice.test.mjs:105`) |
| `sheetLine(key, vars)` in sheet.js | — | `<p class="step-note guide-line" data-guide-line="key">…</p>` (or a `<span>` inside `.tab-links`), or `""` when `sheetGuideOn()` is false **or** `S.screen==="table"` (a seat, KQ20) | `{tab:id}` becomes `<button class="btn sm" data-gotab="id">` + the tab's label from `SHEET_SECTIONS`. `data-gotab` is a reader on a seat (`RO_READERS`), but a seat draws no line anyway |
| `appCopy.ranksAdvanceInPlay` | `sheet.js:784`, voice corpus | **Removed**, now `sheetGuide.lines.ranksOnProgression` | `voice.test.mjs` (the key list): updated, an expected break. `engine.test`'s *sheetGuide is shaped* refuses a guide line left in appCopy (K1, line 437): extend its list with `ranksAdvanceInPlay` |
| The split paragraphs (1810, 1874, 1917, 1985, 2183, 2694, 2853, 3751) | one `<p>` each | the rule or state `<p>` as it was, minus the guide sentence, then the guide `sheetLine` | Grep found no test pinning any of them. `tools/frame-fixture.json` holds whatever phone-check frames: re-record only after explaining each frame that moves |
| `sheetGuide.seat` | — | `{ introProgression: "…{perHour}…" }`: the seat's version of a rule line that tells the player to act | `sheetHeader`'s note: Progression passes the seat line when `S.screen==="table"`. `smoke-table-sheet.test.mjs:346` (E5) pins the old one and `[data-guide]` on a seat: **an expected break**, updated with the decision (289 superseded in part) |
| A seat's guide lines | drawn under `guideOn()` (sheet.js:49) | none (KQ20) | `sheetGuideOn`'s table branch stays for nothing else: grep shows `sheetHeader` is its only reader. `sheetHeader`'s guide goes through the same seat check. The table's switch still governs the table's own lines (gm.js:650) |
| `gmGuide.contexts.character` on a seat | one text for every tab (gm.js:386, `helpBodyHtml`) | the heading names the seat's open tab (`gmGuide.ui.seatTab`, "{title}: {tab}"), and *On this tab* lists `sheetGuide.contexts[S.seatSheet].words` through `Engine.word(ref, readOnlyChar)`, drawn as the sheet draws them (`sheetWordBodyHtml`), with an absent word left out | `tableHelpContext` stays "character". **The repaint key**: the table host's key is `id|view`, so a seat tab press (same context id) wouldn't repaint. The key must include `S.seatSheet`. Test it (§10, example 5). `smoke-table-help`'s existing tests pass unedited |
| `unrested.text` | "Instead of A day unfed: the day's Thirst and 2 more." (data ~3076), drawn at sheet.js:2789 and as the button's `title` at :2788 | "A day without rest: instead of A day unfed, the day's Thirst and 2 more." (voice pass) | `smoke-sheet-archetypes.test.mjs:855–864` press the button and don't read the text. The `title` stays the same string. That's fine, and it's a rule a mouse can read twice |
| gameTerms `difficulty` | 0300's first sentence (K2) | 0300's whole sentence, now that the mirror has Ken's amendment | `rules.test`'s E8 3 checks it word for word against `private/crb` at main's pointer (`c99bb58`). **Mount the submodule at that commit**, or the old text fails the check |
| Main's guide line under 640px | `shadows.css` `@media (max-width:639px){ #main [data-guide="main"]{display:none} }` | unchanged | K1's test (`smoke-sheet-help`, *Main's guide line is drawn…*) passes unedited. The new attribute is `data-guide-line`, so the CSS and the guard's regex don't see it |
| Print | `printSheet` draws `p-note`, never `step-note` | unchanged: no guide line prints | the print tests unedited |

## 6. Read first

- `CLAUDE.md`: constraints 3 and 9, *Flags* (none here), *Change tiers*.
- `SCHEMA.md` §4: Decisions 289 (the switch, guide line vs rule line), 278 (the table's Help, `character`), 256 (the seat's copy), 273 (the owed line and dialog), 201 and 215 (the Thirst and A day without rest), 282 (what lives on Character vs Loadout), 135 (no unread key), 68.
- `K1-one-help.md` §8–§9 (the guide line and rule line split, KQ5) and K2's review on PR #352.
- `sheet.js`: `sheetGuideOn`, `sheetHeader`, every row of §5's first table. `gm.js`: `drawReadOnly`, `readOnlySheetHtml`, `tableHelpContext`, `helpBodyHtml`, `HELP_HOSTS.table`'s key. `shared.js`: `paintHelp`.
- `private/crb/0300_Core_Mechanics.md` line 97 (at `c99bb58`). The unrested rule is Deighton's Day Rest ruling (Decision 215): the CRB doesn't state it.
- `VOICE-APP.md`: a guide line is tool voice, short, out of the way. A seat line is the table's voice.

## 7. Out of scope

- The wizard and Expert mode (KQ7).
- Dialogs' lines (KQ22), the Take a hit notes (`hitnote`), print (`p-note`).
- Moving state or rule text into the data. Only guide sentences move. Rule text in `sheet.js` (1810's second half, 2450, 2853's first sentence) is a separate sweep (a W item if the voice pass wants it).
- K2's words and *Every word*, apart from the Difficulty quote.
- A switch per line.
- Rewording a guide line beyond the `{tab:…}` swap. The voice pass does that.

## 8. The shapes

```js
"sheetGuide": {
  "ui": { … },                     // K1 and K2, unchanged
  "contexts": { … },               // unchanged
  "lines": {
    "ranksOnProgression":  "Ranks rise with IP, on {tab:progression}.",
    "carryOnLoadout":      "What you carry is on {tab:loadout}.",
    "poolsOnTrackers":     "The pools you spend are on {tab:trackers}.",
    "manualAdjustmentsFor":"For what the sheet doesn't add up by itself: an item, a ruling, a scar the city left.",
    "ipFromSessions":      "Log sessions to earn IP.",
    "majorGmChip":         "Where the book leaves it to judgement, your table decides: taking one marked {gmChip} asks you to confirm.",
    "sessionsPatient":     "NYTE City is patient.",
    "powersOnCharacter":   "Powers are edited, added and removed on {tab:character}.",
    "customSpells":        "Spells you improvised, or settled with your GM.",
    "tolWillWhere":        "Change the Stats they come from, or add a Manual Adjustment on {tab:trackers}.",
    "trainLearnFirst":     "Learn one with IP first, then train it here."
  },
  "seat": {
    "introProgression": "The player logs sessions on their own sheet. Each pays {perHour} IP an hour of play, 1 Milestone Point, and refreshes their LUCK."
  }
},
"gmGuide": { "ui": { …, "seatTab": "{title}: {tab}" } }
```

- **`sheetLine(key, vars)`** (sheet.js): returns `""` when `!sheetGuideOn()` or `S.screen==="table"`, or when `lines[key]` is missing (total, for a data file that lost a key). Otherwise the text, escaped, with `**bold**` through `helpMd`'s rule, then `{tab:id}` → the tab's button (a missing id is plain text, not a button), `{gmChip}` → `<span class="chip gold">GM</span>`, and other `{x}` from `vars`. One helper, so a test can count its calls.
- **A line inside a `.tab-links` row** (855–856) is a `<span>`, so the helper takes `{ inline:true }`. With both off, the row draws nothing: no empty `.tab-links` box (check its margin).
- **`sheetGuide.seat`**: the key is the rule line's `appCopy` key, so `sheetHeader`'s caller can pick it. One key today.
- **The copy** is drafted for the voice pass: the seat's line, the Thirst line and `seatTab`. The moved lines keep today's words, except `{tab:…}`.

## 9. The UI

**Direction:** nothing new to look at. The lines that move render where they did, in the same `step-note` style, and go when the switch is off.

**Where things land:**

| Press | Lands on | Focus | Says |
|---|---|---|---|
| **Guide lines: Off** in Help (sheet) | the page redraws: the tab intro and every guide line on every tab gone; state and rules unchanged | stays on **Off** (K1) | — |
| **Guide lines: On** | they come back where they were | stays on **On** | — |
| A `{tab:loadout}` button in a line | Loadout, at its top (as `data-gotab` today) | as today's `data-gotab` | — |
| A seat's tab, with the table's Help open | the seat's tab. Help's heading becomes "A character's sheet: Loadout" and *On this tab* that tab's words | unchanged (the tab button) | — |
| **Guide lines: Off** in the table's Help | the table's own lines go (as today). A seat had none to begin with | as today | — |
| A Vampire's **A day without rest** | as today (Decision 215) | as today | the line under it names the button |

**Never:** a rule or a number hides; a guide line prints; a seat says "you" to the GM about logging a session; the `.tab-links` row leaves an empty box.

## 10. Worked examples, as named tests

The builder writes these first and **shows each failing on `main`**, or says why one passes there.

| # | Test (file) | Pins |
|---|---|---|
| 1 | `K3: Guide lines off takes exactly the guide lines` (smoke-sheet-help) | For a Professional, an Arcanist, a Vampire and a Werewolf, each in a full state (sessions, IP, a custom spell, Training on) and an empty one: render every tab with the switch on, then off. The text that went equals the tab's intro plus the `sheetGuide.lines` drawn there, sentence for sentence, and nothing else changed. Computed from the data, never a list typed into the test |
| 2 | `K3: every guide line is read, and every {tab:} names a tab` (engine.test) | each `sheetGuide.lines` key has a `sheetLine("<key>"` in sheet.js and the reverse; every `{tab:x}` is a `SHEET_SECTIONS` id; no `step-note` in sheet.js holds one of the lines' sentences (the move is complete) |
| 3 | `K3: a line's tab button goes to the tab` (smoke-sheet-help) | Character's **Loadout** in "What you carry is on Loadout" opens Loadout; Admin's **Trackers** opens Trackers |
| 4 | `K3: a seat's copy draws no guide line, and its Progression says the player logs` (smoke-table-sheet, new) | every seat tab: no `[data-guide]`, no `[data-guide-line]`, with the table's switch on; Progression's rule line is `sheetGuide.seat.introProgression` filled |
| 5 | `K3: a seat's Help names the open tab and lists its words` (smoke-table-help, new) | Help open on a seat, Main → heading "A character's sheet: Main", TOL and LUCK listed; press Loadout → heading changes and ACC is listed, **without closing Help** (the repaint key) |
| 6 | `K3: A day without rest's line names its button` (smoke-sheet-archetypes) | the line under the Thirst buttons starts with the button's label |
| 7 | `K3: Difficulty quotes 0300 whole` (rules.test) | the row names easy, average and challenging (E8 3 already checks it word for word) |

**Expected to fail on `main`:** all seven. Example 7 passes on `main` once the mirror is at `c99bb58` and the quote is changed, so show it failing on `main`'s data.

## 11. Tests beyond the examples

- **Voice:** `sheetGuide.lines` and `sheetGuide.seat` are in the corpus (the walk covers them). There's no guide sentence left in `sheet.js` (example 2).
- **The data-key guard:** MAPS gains `sheetGuide.lines` and `sheetGuide.seat`. Show it failing once, by adding a key that nothing reads.
- **Totality:** `sheetLine` with a missing key, a missing tab id or a non-string line → `""` or plain text, never a throw. A hostile `.shadows.json` doesn't reach it, since the data isn't the file. One unit test is enough.
- **Mutation-test** (and check each for a second path):
  - leave one guide sentence in sheet.js → example 2 fails;
  - make `sheetLine` ignore the switch → example 1 fails;
  - let a seat draw guide lines → example 4 fails;
  - drop `S.seatSheet` from the table's repaint key → example 5 fails (Help keeps the old tab);
  - hide a rule sentence with the guide line (merge a split back) → example 1 fails.
- **Expected breaks, updated, not stops:**
  - the version literals;
  - `smoke-table-sheet` E5 (the seat's intros and `[data-guide]`): updated to KQ20's default, with Decision N superseding 289 in part;
  - voice.test's appCopy key list (`ranksAdvanceInPlay` moves);
  - `tools/frame-fixture.json` and `samples/`, if a frame or the sample moves: find out why before re-recording.

## 12. Steps

1. Mount `private/` **at main's pointer** (`git submodule update --init private`, then check it's `c99bb58` or later), then `npm run test:fast`.
2. Re-grep `step-note` and diff against §5's first table. List any new line in the PR for the reviewer.
3. Write §10's tests and **run them on `main`: all fail**. Paste the run.
4. **The shape:** `sheetLine`, `sheetGuide.lines` (data **before** `sheetGuide`'s doc comment or inside its block, never between a comment and the key it documents), the MAPS entry. Then `npm run verify`. Commit.
5. **The moves:** each guide sentence of §5, split where marked, then `ranksAdvanceInPlay`. **Read each split paragraph on the running sheet**, both switch settings. Then the Thirst line and the Difficulty quote: read the Difficulty quote against 0300 at `c99bb58`, and the Thirst line against Decision 215 (the rule is Deighton's ruling, not CRB text). Then `npm run verify`. Commit.
6. **The seat:** no guide lines, `sheetGuide.seat`, the Help context's tab and words, the repaint key. **Commit before any merge from `main`**, so a stop mid-merge leaves a clean tree. Then `npm run verify`. Commit.
7. **Harden and polish by hand** (the `context` launcher is not run). Report each item in the PR:
   - the split paragraphs at 390: no orphaned punctuation, no empty `<p>`, no gap where a line went;
   - `.tab-links` with both lines off: no empty box;
   - a `{tab:…}` button inside a sentence: its touch target, its focus ring, and its wrap at 390;
   - both themes: a moved line is the same colour as before;
   - the seat's Help heading at 390: a long tab name wraps;
   - `npm run phone-check`.
8. **The walk** (it isn't optional). In the dev preview, on Dead Air's Professional, Arcanist, Werewolf, and a Vampire for the Thirst:
   - at 390, 1024 and 1280: every tab with the switch on and off, reading each split against §5;
   - on a table: a seat's every tab, then Help on a seat across three tabs.

   Put the list in the PR.
9. The close-out (§14).

## 13. Stop and ask

**Stop** (to the conductor) if:
- a sentence won't sort into state, rule or guide, or §5's class looks wrong once it's read on the sheet. That's the reviewer's call, through the conductor;
- a guide sentence turns out to carry a number or a rule (KQ5);
- the seat needs a guide line to make sense;
- the table's repaint-key change moves anything in `smoke-table-help`'s existing tests;
- a computed value moves (outputs.mjs over every archetype: there should be no engine change);
- the CRB mirror at main's pointer doesn't have the amended 0300 sentence.

**Not stops:** §11's expected breaks, a new `step-note` since the pre-flight (listed for the reviewer), and a guide sentence found outside §5's table (listed, classified by the reviewer).

## 14. Close-out

- **The tier's items** (`close-the-session`):
  - decision N, its INDEX line, and 289 and 278 marked *in part*;
  - `CHANGELOG.md` lines, then `npm run changelog`;
  - `npm run bump`, with **one** `[Unreleased]` heading;
  - a log entry, and STATE §3's Help line;
  - the plan's K3 row built;
  - W154 to `log/wishes-granted.md`, and W156's Plan line;
  - a row in `docs/log/shipped.md`, **checked once after any merge from `main`**.
- **The changelog** (a draft, for the voice pass):
  - "**Guide lines** off now clears every line that only explains the sheet, not just the tab intros. What's true and what the rules say stays."
  - "A Vampire's Thirst names **A day without rest** in the line under it."
  - (GM mode) "A player's sheet on a seat reads as a copy: no lines telling you what to do on it, and Help names the tab you're on and its words."
- **The PR:** title `K3: Guide lines everywhere (help-on-the-sheet; Decision N)`, with the template's sections, and:
  - **Where the order didn't fit** (required; "Nothing" is fine);
  - §12.3's failing run on `main`;
  - the step-note re-grep against §5;
  - every moved and split sentence, before → after;
  - the seat's line, the Thirst line and `seatTab` as they render, for the voice pass;
  - every expected break, old → new;
  - the harden and polish checklist, item by item;
  - step 8's walk.

**Review checklist** (beyond the tests passing):
- [ ] §5's classification: read every **guide** row and five **rule** rows on the running sheet. A rule never hides.
- [ ] The switch off, on every tab, at 390 and 1280, for a Professional and a Vampire: only guide lines go. The splits read cleanly, with no empty box.
- [ ] A seat: no guide line on any tab. Progression's seat line is there. Help names the tab, follows a tab press, and lists that tab's words for the seat's copy.
- [ ] The Thirst line names its button, and the button still works (Decision 215).
- [ ] Difficulty reads 0300 whole, against the mirror at main's pointer.
- [ ] Main's guide line still hides under 640px.
- [ ] No guide sentence left in `sheet.js`, no unread `sheetGuide` key, and voice.test scans the new keys.
- [ ] N is pasted whole (its *Touches* too), 289 and 278 are marked in part, and INDEX matches.
- [ ] Each new test was shown failing once (mutation).
- [ ] **Last, after every push:** the PR body still has its failing run, its before → after list, the expected breaks, the checklist and the walk.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md`, with this order's path, `docs/plans/help-on-the-sheet/K3-guide-lines.md`. Both sessions are **local**. Impeccable's `context` launcher is not run (it downloads a binary): harden and polish are §12, step 7's checklist, done by hand.

This order's traps:
- **Most `step-note`s are not guide lines.** The plan expected 76 and there are 11. A line that says what's true (an empty list) or what the rules say (a cost, a cap, what the sheet doesn't apply) stays, whatever its tone.
- **Split, don't hide.** A paragraph with a rule and a guide sentence becomes two elements. Hiding the paragraph hides the rule.
- **The seat runs the sheet's renderers on a table screen.** `sheetGuideOn()` answers the table's switch there. `sheetLine` checks `S.screen` itself, so it never relies on the switch to keep a seat clean.
- **The table's repaint key.** A seat's tab press keeps the context id "character". Without `S.seatSheet` in the key, Help shows the old tab's words.
- **The mirror.** E8 3 reads `private/crb`. A stale checkout has the old 0300 sentence and fails the new quote. Mount at main's pointer.
- **K2's misses, again:**
  - commit before merging `main`;
  - one `[Unreleased]` heading, and no duplicate `shipped.md` row;
  - mutation-test every new test;
  - walk the preview, including a Professional and 1024;
  - the PR body's gap lists and expected breaks.
