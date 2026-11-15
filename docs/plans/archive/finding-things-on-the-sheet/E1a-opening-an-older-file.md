# Work order E1a — Opening an older file

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), session E1 (E1a; E1b is the wizard).
**Status:** approved by Ken 2026-11-11, on the defaults (EQ4–EQ6, §4). Ready for its builder.
**Branch:** the builder's own, cut from `main`.
**Runs beside:** anything that doesn't touch `sheetHeader`, `focusedOwedHtml` or `versionCheck`'s first line. E4 can run at the same time.
**Impeccable:** `/impeccable onboard the first seconds after opening an older character file`, then `/impeccable clarify` on the strip's and the notice's words. Both have done their analysis here (§1, §9); the builder runs them to check the build, not to reopen the shape.
**Pre-flight:** `main` at `a4b6ec0`, plan at `77266d1`. Findings:
- The critique said a pick "vanishes with no word". **That was wrong:** the pick goes through `commit()`, which shows the undo toast (`shared.js:317`). The critique clicked by script and never looked for the toast. Nothing in this order changes the toast.
- Decision 238 put the picker at the top of every tab and rejected a modal **on open**. This order keeps the ask on every tab and opens the picker only when the player presses, so 238 is replaced in part, not reversed.
- The load notice is written by the engine (`versionCheck`, `engine.js:6253`), and the wizard shows it too (`wizard.js:190`), so its new words reach a draft as well as a sheet.
**Carried over:** nothing; this is the plan's first order.

---

## 1. Goal and Done when

**Goal:** a player who opens an older character sees the character first. An owed choice is one line with a button, on every tab, and the picker opens in a dialog when they press it. The notice about the file's age says what happened and what to do, in tool voice, without version numbers that read like a downgrade.

**Done when:**
- Kade (the pre-refresh `tests/TestCharacters/_pre-refresh-2026-11-11/kade-mercer.shadows.json`) opens at 375×812 with his name and Health card on the first screen, on Main and on every other tab.
- Every sheet tab shows the owed line exactly once, with one **Choose** button and no picker.
- **Choose** opens a dialog holding the picker. A pick that completes the set closes the dialog, the line goes from every tab, and the undo toast says what was chosen. Undo brings the line back.
- A pick that doesn't complete the set (a Cleaner owes two) leaves the dialog open with the count updated.
- The notice on an older file reads as §9's copy, shows once as today (Decision 125), and names no version numbers.
- `npm run verify` and `npm run phone-check` pass.

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape*: where an owed choice is asked is a player-facing behaviour someone could have chosen otherwise (Decision 238 did).
- **Versions:** app **patch** (EQ6). Game data, character schema, table schema, pack schema: unchanged. No `migrate()` step: nothing stored moves.
- **Numbers:** one decision, **N** (the next free number on `origin/main` when it's built). No flags.

## 3. Decisions, drafted in full

```
N. **A locked character owed a pick sees one line at the top of each tab, and the picker opens in a dialog when they press Choose.**
     *2026-11-?? · Ken + Claude · Touches: focusedOwedHtml, focusedPickHtml, data-fpick, data-fowedopen, sheetHeader, .focused-owed, openModal, focusedOwedLines, versionCheck, loadIssuesHtml, E1a*
     - **Decided:** While `Engine.focusedPicks(ch)` is incomplete on a locked character, every sheet tab opens with one line saying what's owed and a Choose button; the picker is no longer on the page. Choose opens a dialog with the wizard's picker. Each pick is the one undoable action it was. The dialog closes when the picks are complete and stays open while more are owed. The load notice's game-data line says the file was saved under earlier rules and what to do, with no version numbers.
     - **Why:** Ten picker rows above every tab pushed a returning player's vitals a full phone screen down (the 2026-11-11 critique, with Kade). A line keeps 238's point, that whichever tab the sheet opens on asks, without taking the screen. "Saved against game data 0.9; loaded data is 0.53" read as a downgrade and said nothing to do.
     - **Rejected:** a dialog that opens by itself (238's reason: it blocks the sheet for a choice that can wait a tap); the picker on Main only (238: the sheet reopens on the tab it was left on); a Dismiss (238: a short pick is an unfinished character); keeping the version numbers in the line (EQ4; the footer shows the current version).
     - **Replaces:** Decision 238 in part: the picker moves from the top of each tab into a dialog opened from there; the ask itself, its tabs, its words and the Loadout panel's line stay.
     - **Revisit if:** another creation choice can go missing on a locked character (238's own condition); then the line becomes a list of what's owed, each with its button.
     - **Built:** app X.Y.Z (patch), no data or schema bump, PR #…, log entry.
```

And on Decision 238: `→ **Superseded in part by Decision N** — the picker opens in a dialog from a one-line ask; the ask, its tabs and its words stay.` Its INDEX line gets `→ **superseded in part by N**`.

## 4. Questions for Ken

- **EQ4:** Should the notice keep the version numbers, for a GM working out which build made a file? **Default: no.** *Ken, 2026-11-11: Default.* The footer shows the current version, and the numbers are what made it read like a downgrade.
- **EQ5:** Should the dialog open by itself the first time an owed character opens? **Default: no**, for Decision 238's reason. *Ken, 2026-11-11: Default.* The line is on every tab.
- **EQ6:** App patch or minor? **Default: patch.** *Ken, 2026-11-11: Default.* It changes an existing behaviour; nothing new is possible.

## 5. The assumption sweep

| What | True today | Where | True after |
|---|---|---|---|
| The owed block | Heading, the owed lines, the `n/m chosen` line and a toggle per allowed skill, on every tab (Admin too) | `focusedOwedHtml`, `shared.js:1078`; called by `sheetHeader`, `sheet.js:40` | The owed lines and one `button[data-fowedopen]`. No `[data-fpick]` on the page |
| The picker | Shared by the wizard (`data-fskill`) and the sheet (`data-fpick`) | `focusedPickHtml`, `shared.js:1055` | Unchanged. The sheet's copy renders inside the dialog |
| The pick's binder | Binds `[data-fpick]` under `main` | `sheet.js:4281` | Binds inside the dialog body. `commit()` re-renders `main`, not the dialog, so the dialog redraws its own body after each pick (the Raise picker's `refresh`, `sheet.js:3177`) |
| Focus after the last pick | n/a | `closeModal`, `shared.js:466` | `returnTo: "[data-fowedopen]"` is gone once complete. Focus lands on the tab's first heading (`toastLanding`'s rule, W47). Check it |
| The undo toast | Rides inside an open dialog, moves out on close | `undoToastEl`, `shared.js:347`; `closeModal` | Unchanged. Check it is visible after the dialog closes |
| The Loadout panel's line | "Choose 1 more … to Focus at the top of this tab." and "A pick at the top of this tab can't be a Focused Skill any more. Remove it there." | `focusedOwedLines(fp, true)`, `shared.js:1069` | Still true: the line at the top of the tab is where it starts. The second sentence's "Remove it there" now means through Choose. **Wording to the voice pass** (§9) |
| The ask isn't a live region | Pinned by a test | `smoke-wizard.test.mjs:510` | Still true of the line |
| `.focused-owed` | A framed panel | `shadows.css:300` | A one-row strip: text and button side by side, wrapping under 640px. 44px button on touch (phone-check) |
| The version line | "Character was saved against game data X; loaded data is Y." | `versionCheck`, `engine.js:6253` | §9's copy. Readers: `loadIssuesHtml` on the sheet (`sheet.js:40`) and the wizard (`wizard.js:190`) |
| Shows once | A version-only finding isn't sticky | `loadFindings`, `shared.js:980` (compares `gamedataVersion`, not the text) | Unchanged: the test is on the field, not the words |
| Tests that pin the old words | `/saved against game data 0\.0-ancient/`; `/game data/` | `smoke-roster.test.mjs:100`; `engine.test.mjs:672` | Updated to the new line (expected breaks) |
| Tests that pin the old block | Picker count per tab, picker on the page | `smoke-wizard.test.mjs:456–520` | Rewritten to N's shape (expected breaks: they encode 238) |
| GM mode's sheet view | Swaps `S.importIssues` while a player's sheet is open | `gm.js:4264` | Unchanged; check the line and dialog work from a GM's view of a player sheet |
| Print | Nothing prints (238) | — | Unchanged |

## 6. Read first

- `CLAUDE.md`: hard constraints 5 (the engine writes text, never markup), 9 (no build state in player copy); *Change tiers*; *Decisions*.
- `SCHEMA.md` §4: Decisions **238** (the ask), **134** (the Loadout panel's pick), **125** (load findings, shows once), **159** (a picker dialog stays open for the next pick), **164** (`keepPlace`), **70** (player copy).
- `docs/VOICE-APP.md`: tool voice, for where the player is stuck.
- `src/ui/shared.js`: `focusedOwedHtml`, `focusedOwedLines`, `focusedPickHtml`, `loadFindings`, `loadIssuesHtml`, `commit`, `openModal`, `closeModal`, `toastLanding`.
- `src/ui/sheet.js`: `sheetHeader`, the `[data-fpick]` binder, `openRaisePicker` (the dialog pattern to copy).
- `src/engine/engine.js`: `versionCheck`, `focusedPicks`.

## 7. Out of scope

- **The wizard** (E1b, its own order after this merges).
- **The orphan lines** ("Skill "x" no longer exists in game data.") and the sheet's "no longer in the game data" chips: one wording change across engine and UI, for E5.
- **Other owed choices** (a Base Power, a Natural Advantage): 238's *Revisit if* hasn't happened.
- **W147** (an old file with no TAG): on the wishlist.
- Anything about the vitals bar or Main's layout (E2, E3).

## 8. The shapes

No data, save-file or engine-signature change. `versionCheck` keeps its signature and return shape (an array of strings); only its first string's words change. `focusedPicks` is read, not changed.

## 9. The UI

**The line, every sheet tab, where the block is today (above the title):**

> **Focused Skills** · Choose 1 more Combat Skill to Focus. **[Choose]**

The words are `focusedOwedLines(fp)` as today; no new sentence. With an invalid pick: *"A pick can't be a Focused Skill any more."* and the button reads **Fix**. *(Voice pass.)*

**The dialog:** titled **Focused Skills**. It holds the owed lines, then `focusedPickHtml(ch, "data-fpick")` as the block held it. Each press is `commit("loadout", …)` with today's labels. After each, the body redraws. Complete: close. Esc and × close as any dialog does. Nothing in it asks to confirm.

**The Loadout panel's lines** keep pointing at the top of the tab. The invalid case says *"A pick at the top of this tab can't be a Focused Skill any more. Fix it there."* *(Voice pass.)*

**The notice's game-data line** (engine, `versionCheck`):

> This character was saved under an earlier version of the rules. It opens under the current ones; export it to keep this copy.

*(Tool voice; voice pass.)* With EQ4 answered "keep the numbers", append ` (game data X; now Y)`.

## 10. Worked examples, as named tests

Write these first, and show each failing on `main`.

1. `smoke-wizard.test.mjs`: **"Decision N: a locked Enforcer short its Combat Skill sees one line on every tab, and the picker only in the dialog"**. On each tab: one `[data-focused-owed]`, one `[data-fowedopen]`, no `[data-fpick]`. Press Choose: the dialog is open with `[data-fpick="rifles"]`. Pick Rifles: `focusedSkillPicks` is `["rifles"]`, the dialog is closed, no tab has the line. The toast reads "Focused Skill: Rifles"; Undo brings the line back. `app.errors` is empty.
2. Same file: **"Decision N: an invalid pick reads Fix, and Remove is in the dialog"** (238's second test, reshaped).
3. Same file: **"Decision N: a pick that leaves more owed keeps the dialog open"**. A locked Cleaner (`focusedSkills.choose.count` 2, `shadows-data.js:2617`) with no picks: Choose, pick one, the dialog is still open and reads 1/2; pick a second, it closes.
4. `smoke-roster.test.mjs`: **"Decision N: an older file's notice says it opens under the current rules, with no version numbers"** (replaces the `0.0-ancient` match at line 100; still shows once).
5. `engine.test.mjs`: **"Decision N: versionCheck's game-data line is player copy: no version numbers, no 'game data'"**.

## 11. Tests beyond the examples

- **Totality:** the line for a draft, no specialization, junk picks and no character is `""` (238's existing loop, kept).
- **Not a live region:** the line isn't inside `[role=status]`, `[role=alert]` or `[aria-live]` (kept).
- **Voice:** `tests/voice.test.mjs` passes over the new copy.
- **Mutation tests**, against the built code: put the picker back on the page (example 1 fails); drop the close on complete (example 1 fails); drop the redraw (example 3 fails); restore the old version sentence (examples 4 and 5 fail).

## 12. Steps

1. Examples 1–5 as failing tests. `npm run test:fast`.
2. `focusedOwedHtml` → the line; the dialog and its binder in `sheet.js`; `.focused-owed` as a strip. `npm run verify`.
3. `versionCheck`'s first line; the two tests that pin the old words. `npm run verify`.
4. In the dev preview: the pre-refresh Kade at 375×812 and 1280×860, every tab, Choose, pick, undo, and the GM's view of a player sheet. Screenshots in the PR. `npm run phone-check`.
5. Mutation tests (§11). Close-out (§14).

## 13. Stop and ask

- **Stop** if the dialog can't hold the picker without changing `focusedPickHtml`'s output for the wizard.
- **Stop** if any test other than §5's expected breaks fails on the new copy.
- **Not a stop:** the five expected breaks (§5's two rows); rewrite them to N.

## 14. Close-out

- `close-the-session` for *Rule or shape*: Decision N pasted from §3 with *Built* filled; 238 and its INDEX line marked; app patch; STATE rewritten where E1a stands; a log entry; a `shipped.md` row.
- **CHANGELOG** (player voice):
  - "A character that owes a choice since the rules changed now asks in one line at the top of each tab; Choose opens the picker."
  - "Opening an older file says it was saved under earlier rules and opens under the current ones."
- **PR title:** `feat(sheet): an owed pick is one line and a dialog; plain words for an older file (E1a, Decision N)`.
- **PR body:** the template's sections, plus **Where the order didn't fit**, and the screenshots from step 4.
- **Review checklist:**
  - Run the pre-refresh Kade in a browser at both widths, not only the tests.
  - Focus after the last pick lands on the tab's heading, and the toast is visible.
  - The wizard's Focused Skill picker (`data-fskill`) is unchanged.
  - Grep for every reader of the old version sentence and the old block; none left.
  - Re-run §11's mutations.

## 15. Handing it over

The builder and reviewer prompts are in `docs/WORK-ORDERS.md`, with this order's path. This order's traps:
- `commit()` re-renders `#main`, not the dialog: without a redraw the dialog keeps showing "0/1 chosen" after a pick.
- The Choose button disappears with the last pick, so `returnTo` finds nothing; check where focus goes.
- The test characters are gitignored and live in Ken's main checkout under `tests/TestCharacters/` (the pre-refresh ones in `_pre-refresh-2026-11-11/`). Copy them into the worktree or seed them from there; don't commit them.
- Run `git submodule update --init private` in a fresh worktree before the suite, or the CRB-mirror tests fail.
