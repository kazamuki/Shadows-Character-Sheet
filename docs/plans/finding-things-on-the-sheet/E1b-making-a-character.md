# Work order E1b — Making a character, for everyone

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), session E1 (E1b; E1a was the older file).
**Status:** drafted 2026-11-11 by the conductor (Opus), not by E1a's reviewer: Ken asked for it, since that review ran on Sonnet. Ken answered EQ7–EQ10 on 2026-11-11 (§4). EQ7's answer added Decision N+3 (Cyborg retired from the picker). **Awaiting Ken:** approval of the order as amended, and EQ11–EQ12.
**Branch:** the builder's own, cut from `main`.
**Runs beside:** E4 (colour), which touches no wizard renderer. Not E2 or E5: E5 rewords copy this order adds.
**Impeccable:** `/impeccable onboard the character creation wizard for a first-time player, with Expert mode as the veteran's path`. Its analysis is in this order (§1, §9), from a walkthrough at 375×812 on a blank character. The builder runs `/impeccable clarify` on §9's new words to check them, not to reopen the shape.
**Pre-flight:** `main` at `43ac1c5` (E1a merged, app 0.66.1, last decision 273). Findings:
- **The step order is the book's, twice over.** `0400_Character_Creation.md` lists the seven steps in the wizard's order, and the recap (`0434`) repeats them: Concept before Stats, Stats ("the person you were before power found you") before Archetype. The plan's question, whether the order can move, is answered **no**. This order brings the archetype's demands forward to the Stats step instead (Decision N+2).
- **Only Professional's subtypes carry stat requirements** (`requires.stats` on all 8 options). Arcanist's Aberrations, Vampire's Bloodlines and Werewolf's Origins carry none, and Cyborg has no options yet. Everything in N+2 is read from the data, so it shows for whatever archetype gains one.
- **The walkthrough at 375×812:** step 1 opens with "Choose a Campaign Power Level." in the error colour below four cards of numbers, and "1 thing to fix first" in the sticky nav. Step 2 does the same with "Your character needs a name." Spending 45 Stat Points round-robin took 42 presses and left BOD 7 and COOL 6. Choosing Professional, then Enforcer, gave four errors: two unmet requirements (BOD 8, COOL 7) the player could not have seen while spending, plus two picks not yet made, all the same colour. The Archetype step is 1,656px before a choice, 6,261px with Professional chosen, and 8,710px with a subtype chosen. The Custom path reads well (3,266px, mostly plain prompts and four classification cards) and is left alone.
- **The build-state badges** come from Decision 15 (Batch 1: "`status` badges for tbd/draft content") and Decision 71 (they read through `appCopy.statusLabel`). Four of six archetype cards say IN PROGRESS, and the sheet's Character tab wears the same chip (`sheet.js:551`). Hard constraint 9 says the app doesn't narrate its own build state. "In progress" is exactly that, and Decision 71 only renamed it.
- **"Formerly 'Freebie Points'…" shows twice** on Character Points because one data note is drawn twice: once by `stepHeader` (`wizard.js:186`, from `creationFlow.steps[].note`) and once by `renderCP`'s `dice-note` (`wizard.js:558`).
- **`validate()` has 47 error sites** (`engine.js:5980–6225`). About half are a choice not yet made ("Choose…", "Enter your … roll", "Name your archetype", "(0/1)"), and half something wrong (overspent, over a cap, a requirement unmet, a pick that can't be). Today they all render alike (`issuesHtml`, `shared.js:1024`; `.issues li`, `shadows.css:292`).
- **Ledger search:** no decision governs the tone of a step's errors on arrival (searched "on arrival", "untouched", "touched", `wiznav-why`, `issuesHtml`). Decision 162 governs what blocks Lock and is kept. Decision 161 governs the rail and is replaced in part (the dashes).
**Carried over** from E1a's review (it ran on Sonnet; I checked it, §15):
- *The order's miss:* E1a's sweep listed `commit()` re-rendering `#main` but not the dialog, then tested only the picks, not the toast's Undo. Here, any dialog or fold this order adds is redrawn from `update()`, and a test presses Undo with it open.
- *The build's:* no screenshots reached the PR. Step 4 asks for them again; the reviewer checks they're there.
- *Left for later:* a GM's read-only view of a player sheet reads "Choose" on a disabled button (E5 or GM mode).

---

## 1. Goal and Done when

**Goal:** someone who has never made a Shadows character can start one and get to Lock without being scolded for what they haven't done yet. They aren't surprised by a rule the app knew about two steps earlier, and they aren't told the game is unfinished. A veteran loses nothing: Expert mode, the ledger and every control stay where they are.

**Done when:**
- A new character's step 1 and step 2 show what's left to do in the neutral tone, with no error colour, and the nav says what's left rather than what to fix. A wrong value, such as an overspend or an unmet requirement, is still an error, in the error colour.
- The rail before a Power Level is chosen is the character's name and one line, not a column of dashes.
- No archetype card and no sheet chip says "in progress". The Cyborg isn't offered to a new character, and a saved one opens and plays as before.
- The Stats step shows which subtypes need which stats, marked met or not as the player spends. A subtype card says what's short before it's chosen. Once a subtype is chosen, the others fold to one line each, and the player can open them again.
- Character Points says "Formerly 'Freebie Points'" once.
- Step 1 says what's coming and whose call the Power Level is (§9).
- The Archetype step with Professional and Enforcer chosen is at most half today's 8,710px at 375×812.
- `npm run verify` and `npm run phone-check` pass.

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape*: four player-facing behaviours someone could have chosen otherwise, one of them (N+3) also *Content*, plus *Fix*-tier copy riding along.
- **Versions:** app **patch** (EQ12). Game data **bumps** (Decision 68), because N+3 changes the choices a new character has: Cyborg is no longer offered. Nothing else in the data moves: the new `appCopy` keys are words, not content. Character, table and pack schemas unchanged. No `migrate()` step: a saved Cyborg loads as before. `validate()`'s issue objects gain an optional field, but they're computed, never stored.
- **Numbers:** four decisions, **N** to **N+3**, the next free numbers on `origin/main` when built (274–277 if nothing lands first). No flags: F6 and F19 stay open on the Cyborg's data.

## 3. Decisions, drafted in full

```
N. **A creation step says what's left to do in a neutral tone; only something wrong is an error.**
     *2026-11-?? · Ken + Claude · Touches: validate, todo, issuesHtml, wizIssuesHtml, wizWhyHtml, wiznav-why, .issues li.todo, wizardRailHtml, vitals rail, Decision 161, Decision 162, E1b*
     - **Decided:** `validate()` marks an issue `todo: true` when it asks for something the player hasn't entered yet (a choice, a roll, a name, points unspent), and leaves it unmarked when something entered is wrong (over a pool or a cap, a requirement unmet, a pick that can't be). Both stay `level: "error"`, so Continue and Lock wait exactly as before. A to-do renders in the neutral tone, and the nav counts "N left to do" while every error is a to-do, or "N to fix" once any isn't. Before a Power Level is chosen, the rail shows the name and one line saying the numbers fill in as the character is built.
     - **Why:** A new character met "Choose a Campaign Power Level." in the error colour before touching anything, and the same on step 2. A choice not yet made isn't a mistake. Telling the two apart is a fact the engine already has, so the tone needs no memory of what the player touched.
     - **Rejected:** hiding errors until the player has touched the step or pressed Continue (it needs per-step state that a redraw, an undo or a reload can lose, and a disabled Continue then has no visible reason); making to-dos warnings (Continue would let a player past a missing choice, against 162's reasoning); a separate to-do list beside the errors (two lists for one question: why can't I go on?).
     - **Replaces:** Decision 161 in part: before a Power Level the rail is one line, not the stats as dashes; after it, 161's "not yet" dashes stand.
     - **Revisit if:** a step needs a required choice the engine can't tell apart from a wrong one.
     - **Built:** app X.Y.Z (patch), PR #…, log entry.

N+1. **No archetype wears a build-state badge; one whose rules aren't written says so where it's chosen.**
     *2026-11-?? · Ken + Claude · Touches: archetype status, .badge, statusLabel, appCopy.statusLabel, renderArchetype, the sheet's archetype chip, archetypeUnwritten, Decision 15, Decision 71, E1b*
     - **Decided:** An archetype whose `status` is `draft` shows no badge, on the wizard's card or the sheet's Character tab. One whose `status` is `tbd` keeps its badge, in `appCopy.statusLabel.tbd`'s words, and its `archetypeUnwritten` note when chosen. `written-in` (Custom) keeps "off the books". `status` stays in the data for the maintainers.
     - **Why:** Four of six cards read IN PROGRESS: a first-timer reads that as an unfinished product, and hard constraint 9 says the app doesn't narrate its build state. A draft archetype is playable; its open questions already reach the player as `playerNote`s where they bite. An unwritten one isn't playable from the book, and the player needs to know before building it.
     - **Rejected:** dropping every badge (Cyborg would be chosen blind); rewording "in progress" (any wording of it is still build state).
     - **Replaces:** Decision 15 in part (badges for `draft` content) and Decision 71 in part (`statusLabel.draft` no longer renders).
     - **Revisit if:** the CRB marks an archetype provisional in print, as a rule the table should know.
     - **Built:** app X.Y.Z (patch), PR #…, log entry.

N+2. **The Stats step shows what each archetype's choices demand, and the Archetype step folds what wasn't chosen.**
     *2026-11-?? · Ken + Claude · Touches: requires.stats, specialization options, renderStats, renderArchetype, the subtype card, data-spec, foldAttr, Expert mode, E1b*
     - **Decided:** Wherever the data gives specialization options `requires.stats`, the Stats step carries a closed panel listing each option's demands, marked met or not against the stats as they're spent; with an archetype already chosen, it lists only that archetype's options, open. Before an option is chosen, its card says what's short ("BOD 8, you have 7"). Once the specialization is complete, every other option folds to its name and demands, and one press opens them all again. The book's step order is unchanged.
     - **Why:** An Enforcer's BOD 8 and COOL 7 first showed on step 4, after the Stat Points were spent, so the player went back and re-spent them. The book puts Stats first on purpose (0400, 0434), so the demands come forward instead of the step. The chosen subtype's other seven cards were most of the 8,710px a phone scrolled.
     - **Rejected:** moving Archetype before Stats (the book's order, twice); disabling options the stats don't meet (the player may mean to raise the stats; the error already blocks Continue); a dialog for the demands (it hides them while the player spends).
     - **Replaces:** nothing. (Decisions 91 and 134 are kept: the gate is still `requires` data checked by `checkPrereqs`.)
     - **Revisit if:** demands come to depend on something other than stats (a skill, an advantage), which the panel would then have to read too.
     - **Built:** app X.Y.Z (patch), PR #…, log entry.

N+3. **The Cyborg is retired in place: a new character can't choose it, and one that has it keeps it.**
     *2026-11-?? · Ken + Claude · Touches: cyborg, retired, archetypes, renderArchetype, the Admin archetype select, F6, F19, W61, Decision 143, E1b*
     - **Decided:** An archetype with `"retired": true` isn't offered: it has no card in the wizard and no option in Admin's archetype select, unless it's the character's own. A character already on it loads, plays and saves as before, with its computed values unchanged. The Cyborg is marked `retired`. Its id, data and flags stay.
     - **Why:** The team cut the Cyborg (cybernetics become gear for Professionals, W90), and its card offered a first-timer an archetype with no rules. Retiring in place is Decision 143's pattern for armor upgrades, and needs no conversion.
     - **Rejected:** folding Cyborg characters into Custom now (W61: it needs the cybernetics design, F6 and F19, and its caveats weighed); deleting the archetype (constraint 6); keeping its card with a "not written yet" badge (it offers a choice the team has cut).
     - **Replaces:** nothing. (W61's fold stays on the wishlist as the later step.)
     - **Revisit if:** the Cyborg returns as an archetype, or W61 is built.
     - **Built:** app X.Y.Z (patch), gamedata X.Y, PR #…, log entry.
```

On Decision 161: `→ **Superseded in part by Decision N**: before a Power Level the rail is one line.` On 15: `→ **Superseded in part by Decision N+1**: no badge for draft content.` On 71: `→ **Superseded in part by Decision N+1**: statusLabel.draft no longer renders.` Each INDEX line gets its mark.

## 4. Questions for Ken

- **EQ7:** Drop the "in progress" badge (N+1)? **Default: yes**, from the wizard and the sheet. Cyborg keeps "not written yet", and Custom keeps "off the books". *Ken, 2026-11-11: "Let's drop it, but should we also drop the cyborg at this point, since that was a large wishlist item change. If you think we should wait, we can wait."* **Conductor's call, on Ken's leave:** don't wait. The Cyborg is retired from the picker now, in place (N+3); W61's fold into Custom waits for the cybernetics design, as its Plan line says. With no `tbd` archetype offered, N+1's `tbd` rule stays only for one that's added later.
- **EQ8:** To-do or error, by what the engine knows (N) or by what the player has touched? **Default: what the engine knows.** It holds through a reload or an undo, and needs no state. *Ken, 2026-11-11: Default.*
- **EQ9:** Character Points is still about 24,000px at 1280 (11,800 in Expert mode). Shorten it here, or in its own session? **Default: its own session, E1c**, added to the plan. It turns on how Disadvantages and Advantages fold for a first-timer, which Decisions 232 and 234 shaped for Expert mode, and it wants measuring on its own. E1b fixes only the doubled note. *Ken, 2026-11-11: Default.*
- **EQ10:** W131 (Expert mode as one page) and W121 (type a number into a stepper)? **Default: set aside by E1b.** Both are for the veteran, and this order is the first-timer's. Their Plan lines say so in this order's PR. *Ken, 2026-11-11: Default.*
- **EQ11:** Step 1's new lines (§9): the book's own words on taking time, and "your GM picks this"? **Default: yes.**
- **EQ12:** App patch or minor? **Default: patch.** Nothing new becomes possible, and three behaviours change.

## 5. The assumption sweep

| What | True today | Where | True after |
|---|---|---|---|
| An issue's shape | `{level, msg}`, plus `pool` on some warnings | `validate`, `engine.js:5982` | `{level, msg, todo?}`. `E()` takes a second argument, or a `T()` beside it; each of the 47 sites is classed by §8's rule |
| What blocks Continue | `navErrors`: `level==="error"` | `wizard.js:168` | Unchanged: a to-do is still an error |
| What blocks Lock | Review's errors (162) | `renderReview`, `wizard.js:748`; `engine.js:6219` | Unchanged. Unspent points at Review become to-dos in tone and still block |
| The ledger's ✓ and ! | Any error or warning on a passed step is `attn` | `renderLedger`, `wizard.js:18` | Unchanged |
| How an issue renders | `<li class="${level}">`; `.issues li` is the error colour, `.warn` gold | `issuesHtml`, `shared.js:1024`; `shadows.css:292` | `<li class="error todo">` for a to-do, in the neutral tone (`--text-dim` or the step-note colour; check both themes against the contrast guard) |
| Other `issuesHtml` readers | Load findings (`level:"warn"`), save failed | `shared.js:986, 992`; `gm.js:543` | Unchanged: they pass no `todo` |
| The nav's count | "N thing(s) to fix first" | `wizWhyHtml`, `wizard.js:170`; Review `:771`; in-place redraw `:1145–1151` | "N left to do" when every error is a to-do, else "N to fix first". The count is all errors, as now. All three call sites |
| The rail before a Power Level | Name, "no archetype · no power level", then eight stats and five derived rows as dashes | `wizardRailHtml`, `wizard.js:60` | Name group, then one line from `appCopy` (§9). The phone's `vstrip` already shows only Vitals before a PL (`wizard.js:52`): unchanged |
| The archetype badge | `<span class="badge ${status}">` on every card | `renderArchetype`, `wizard.js:266` | None for `draft`. `tbd` and `written-in` unchanged |
| The sheet's archetype chip | A chip for any status but `final` | `sheet.js:551` | None for `draft` |
| `statusLabel.draft` | Rendered by the two above | `shadows-data.js:4025` | Unread by the UI. Keep the key: `voice.test.mjs:160` requires it, and `engine.test.mjs:326` exempts the block from the unread-key guard. Check that guard passes |
| `.badge.draft` CSS | Gold frame | `shadows.css:160` | Unused: remove it |
| A subtype's demands, before choosing | "requires BOD 8, COOL 7", green when met | `renderArchetype`, `wizard.js:305–308` | Names each shortfall: "BOD 8 (you have 7)". Read through `Engine.statValue`, as now |
| The other options once chosen | All drawn in full | `renderArchetype`, spec block | Folded to a name-and-demands line once `specializationNeed` is met; a "Show all N" button reopens them (browser state, `S`, never the character). A Werewolf or Vampire has 3: the fold still applies |
| Expert mode's folds | `foldAttr`/`foldBtn` per option | `shared.js:711–716`; `wizard.js:312` | Unchanged. A folded option has no description to fold |
| Demands on Stats | Not shown | `renderStats`, `wizard.js:236` | A `<details>` after the allocation rows, only when some option carries `requires.stats`. Redrawn with the stats on every press: the step re-renders `#main` |
| The doubled note | Header and `dice-note` both draw `steps[].note` | `stepHeader`, `wizard.js:186`; `renderCP`, `wizard.js:558` | Header only |
| Power Level cards | "Stats 45 · Skills 40+INT+REF · CP 5 · Skill cap 4 · Max CP Boost 2 · Ç 3d4×100" | `renderPowerLevel`, `wizard.js:195` | Labels as §9. No number moves |
| Archetypes offered | Every entry in `D.archetypes` | `renderArchetype`, `wizard.js:263`; Admin's select, `sheet.js:2634` | Not `retired`, unless it's the character's own. **Grep every reader of `D.archetypes`/`D().archetypes`** (`engine.js:109, 3903, 3971`; `sheet.js:704, 1730, 4360`; `wizard.js:794`) and class each one as *offers a choice* (filter) or *reads a held one* (don't) |
| A saved Cyborg | Loads; `versionCheck` reports nothing | `migrate`, `versionCheck` | Unchanged. Its computed values diff identical before and after (script it, per *How exact to be*) |
| `gamedataVersion` | Current on `main` | `shadows-data.js` `meta` | Bumped, per Decision 68, for N+3 |
| Tests that pick Cyborg | Any test booting a new Cyborg through the wizard (`voice.test.mjs:191` boots one by storage, which still works) | grep `cyborg` in `tests/` | A storage-seeded Cyborg still loads; a test that *clicks* the Cyborg card is an expected break |
| Tests that pin the nav's words | `/to fix first/`; `^N things? to fix first$` | `smoke-sheet-archetypes.test.mjs:464`; `smoke-wizard.test.mjs:717, 726` | 464 stays (unspent points on Review are to-dos: it becomes "left to do"); 717 and 726 count to-dos on a nameless Custom. Expected breaks |
| Tests that count `li.error` | A nameless Custom's errors | `smoke-wizard.test.mjs:712` | They gain `todo`; still `li.error`. Check it holds |
| The badge guard | No leaf reads a raw status | `voice.test.mjs:171–209` | Still passes; it boots Arcanist (draft, now no badge) and Cyborg (tbd) |

## 6. Read first

- `CLAUDE.md`: hard constraints 5, 7 (UI state like the fold isn't stored), 8 (the engine is total: `todo` on every path), 9; *Change tiers*; *Decisions*.
- `SCHEMA.md` §4: Decisions **15**, **71**, **72** (`validate()` writes player copy), **78** (what's an error), **91** and **134** (`requires` gates), **153** (write-in), **161** (the rail), **162** (Lock), **232** and **234** (Expert mode).
- `docs/VOICE-APP.md`: tool voice for to-dos and errors; NYTE voice for step 1's lines.
- `private/crb/0400_Character_Creation.md` (the flow, and its own line on taking time) and `0434_Character_Creation_Recap.md`.
- `src/engine/engine.js`: `validate`, `checkPrereqs`, `specializationNeed`, `statValue`.
- `src/ui/wizard.js`: `renderLedger`, `wizardRailHtml`, `wizNav`/`wizWhyHtml`, `stepHeader`, `renderPowerLevel`, `renderStats`, `renderArchetype`, `renderCP`, `renderReview`, `refreshNav`.
- `src/ui/shared.js`: `issuesHtml`, `foldAttr`, `foldBtn`, `expertOn`.

## 7. Out of scope

- **Character Points' length** (EQ9): only the doubled note.
- **The step order**: the book's (§ pre-flight).
- **W131 and W121** (EQ10).
- **The Custom archetype's path**: it reads well.
- **The orphan lines and every other wording pass**: E5.
- **The locked sheet**, beyond the one chip (N+1).

## 8. The shapes

- **`validate(stepId, ch)`** keeps its signature and returns the same array, and each issue may carry `todo: true`. **The rule:** a to-do is an issue whose fix is entering something not yet entered, where nothing entered is undone. The builder classes all 47 `E(` sites by it and lists them in the PR as a two-column table, to-do or error, with the line. Expected to-dos: 6013, 6014, 6020, 6021, 6031, 6036, 6037, 6053 (first branch), 6066, 6075, 6095, 6101, 6115, 6121, 6126, 6139, 6145, 6208, 6221. Expected errors: the rest, including 6023 (a roll out of range: something entered is wrong) and 6055 ("Too many"). Where the table and this list differ, the rule wins and the PR says why.
- **Totality:** `todo` is added only where `E()` is called; no new throw. `validate` on a junk character still returns an array.
- **No data shape changes.** New `appCopy` keys: `railEmpty`, `stepOneIntro`, `stepOneGm`, `leftToDo`, `toFix`, `showAllOptions` (names are suggestions). Each is read by code, per Decision 135.

## 9. The UI

**Step 1, under its title** (NYTE voice; voice pass):
> Character Creation takes time. Pause when you need to. Nothing locks in until you're ready.
> Your GM picks the Power Level. If they haven't, ask before you go on.

The first line is the book's own (0400). The ledger already shows the eight steps, so this doesn't list them.

**Power Level cards:** the numbers stay, with plain labels: *Stat Points 45 · Skill Points 40 + INT + REF · Character Points 5 · Skills start at 4 at most · Boost up to 2 · Çredits 3d4 × 100*. *(Voice pass.)*

**To-dos:** the same list above the nav, each to-do in the neutral tone with no icon. The nav reads **"1 left to do"** or **"2 left to do"**, linking to the list as now, and **"N to fix first"** once anything is wrong. *(Voice pass.)*

**The rail before a Power Level:** the name group, then *"Your numbers fill in as you build."* *(Voice pass.)*

**Stats:** after the stat rows, a closed `<details>`: *"Some archetypes' choices need minimum stats"*. Inside, one line per option: *Professional · Enforcer — BOD 8 ✓, COOL 7 (6)*. A met demand is marked met in more than colour alone (a ✓ or the word). With an archetype chosen, the panel lists that archetype's options and starts open.

**Archetype, before choosing a subtype:** a card's demand reads *"requires BOD 8 (you have 7), COOL 7"* for an unmet one, and as today when met.

**Archetype, once the specialization is complete:** the chosen option(s) in full. The rest are one row each: name and demands. One button, *"Show all 8 Subtypes"* (from `specialization.label`), opens them, and they stay open until the step is left. Choosing a different option works from a folded row's own button. Focus stays on the button pressed (Decision 164's `keepPlace`).

**Character Points:** the note once, under the title.

**Where things land:**

| Press | Record | View | Focus |
|---|---|---|---|
| A Power Level | `creation.powerLevel` | The to-do goes, and the rail fills | Stays on the card |
| A stat + or − | `stats[id].base` | The demands panel re-marks | Stays on the stepper (`keepPlace`) |
| A subtype that completes the set | `archetypeChoices.specialization` | The others fold | Stays on the chosen option's button |
| Show all | nothing (`S`) | The others open | Stays on the button, which now reads "Show fewer" |
| Undo (toast) of a subtype pick | back | The fold undoes, and the others open | Unchanged |

## 10. Worked examples, as named tests

Write these first, and show each failing on `main`.

1. `engine.test.mjs`: **"Decision N: a choice not yet made is a to-do; a wrong value isn't"**. A new character: `validate("power-level")` is one issue with `level:"error"` and `todo:true`. A Professional with Enforcer, BOD 7 and COOL 6: the two `requires` issues have no `todo`, and the Focused Skill issue has it. Stat Points overspent: no `todo`.
2. `smoke-wizard.test.mjs`: **"Decision N: a new character's first step shows what's left to do, not an error"**. A new character on step 1: `#wiz-issues li.todo` is 1; no `li.error:not(.todo)`; the nav reads "1 left to do", and Continue is disabled. Choose Street Level: no issues; Continue is enabled. Step 2 is the same with the name.
3. Same file: **"Decision N: a wrong value is an error beside a to-do, and the nav says to fix"**. The Enforcer above: two `li.error:not(.todo)` and at least one `li.todo`; the nav reads `^\d+ to fix first$`.
4. Same file: **"Decision N: before a Power Level the rail is one line"**. No stat row in `.vfull` before a PL; `railEmpty`'s words are there. Choosing a PL brings the rows back, with 161's dashes.
5. Same file: **"Decision N+1: no card or chip says 'in progress'; an unwritten archetype still says so"**. Every archetype card's text, and the Character tab of a locked draft-status character, lack `statusLabel.draft`. The `tbd` archetype's card has `statusLabel.tbd`. The test reads the statuses from the data, never names an archetype.
6. Same file: **"Decision N+2: the Stats step shows each option's demands, and they follow the stats"**. Reads every option with `requires.stats` from the data. On Stats, the panel has one line per option. Raising a stat to an option's demand marks it met, with no reload.
7. Same file: **"Decision N+2: an unmet option says what's short, and a complete choice folds the rest"**. Before choosing: an unmet card reads `(you have \d+)`. Choose one: the others have no `.desc`, and the show-all button reads its count. Press it: all are full. Undo from the toast: none folded.
8. Same file: **"the Character Points note shows once"**. The note's text occurs once in `#main`.
9. Same file: **"Decision N+3: a retired archetype isn't offered, and a character on it keeps it"**. The Archetype step has no card for any `retired` archetype (read from the data). A locked character seeded on one opens with no error, shows its archetype on Character, and Admin's select keeps it as the current option while offering no other retired one.

## 11. Tests beyond the examples

- **Totality:** `validate` over every step, on `newCharacter()` and on junk (`{}`, a string), returns an array, and every issue's `todo` is `true` or absent.
- **Phone:** at 375×812, Professional + Enforcer, the Archetype step is at most 4,355px (half today's). Put it in `phone-check` if it can hold it, or say in the PR why not.
- **Contrast:** the to-do tone passes the contrast guard in both themes.
- **Voice:** `voice.test.mjs` over the new `appCopy`.
- **Mutation tests**, against the built code: drop `todo` from 6013 (example 2 fails); mark a `requires` issue `todo` (example 3 fails); render the draft badge (example 5 fails); drop the demands panel's redraw (example 6 fails); skip the fold (example 7 fails); restore the `dice-note` note (example 8 fails); drop the `retired` filter from the wizard (example 9 fails), and from Admin's select.
- **Nothing else moves:** a script of every computed output for a saved Cyborg, before and after, diffs identical.

## 12. Steps

1. Examples 1–8 as failing tests. `npm run test:fast`.
2. N: `todo` in `validate`, the 47-site table, `issuesHtml`, the CSS, the three nav sites, the rail. `npm run verify`.
3. N+1: the card and the chip, and remove `.badge.draft`. `npm run verify`.
4. N+2: the Stats panel, the shortfall on the card, the fold. `npm run verify`.
5. N+3: `retired` on the Cyborg, the filter at every reader that offers a choice, `gamedataVersion`. The before-and-after diff of a saved Cyborg. `npm run verify`.
6. The copy (§9) and the doubled note. `npm run verify`.
7. In the dev preview, at 375×812 and 1280×860: a blank character from step 1 to Archetype as Professional/Enforcer, spending Stats past and short of the demands; Arcanist's card with no badge, no Cyborg card, a seeded Cyborg on the sheet; Custom unchanged; Expert mode on, the same path. **Screenshots in the PR.** `npm run phone-check`.
8. Mutation tests (§11). Close-out (§14).

## 13. Stop and ask

- **Stop** if a `validate` site can't be classed by §8's rule (it's neither entering nor undoing).
- **Stop** if folding the options needs a change to what a `[data-spec]` press does.
- **Stop** if the to-do tone can't pass the contrast guard in either theme with an existing token.
- **Not a stop:** the expected breaks in §5's last three rows, and any test that pins "to fix first" for issues that are now to-dos: rewrite it to N.

## 14. Close-out

- `close-the-session` for *Rule or shape*: N to N+3 pasted from §3 with *Built* filled; 15, 71 and 161 and their INDEX lines marked; app patch; `gamedataVersion` bumped; STATE rewritten (the Cyborg row too) where E1b stands; a log entry; a `shipped.md` row. W131's and W121's Plan lines already say E1b set them aside (this order's PR), and E1c is in the plan: check both still hold.
- **CHANGELOG** (player voice):
  - "Making a character no longer greets you with errors: what's still to choose reads as what's left to do, and only a real mistake shows as one."
  - "The Stats step shows which archetype choices need minimum stats, so an Enforcer's BOD 8 isn't a surprise on the next step."
  - "Once you've picked a Subtype, Bloodline or Origin, the others fold away. Show all brings them back."
  - "Archetype cards no longer say 'in progress'."
  - "The Cyborg is no longer offered to a new character; cybernetics are on their way as gear. A character who has one keeps it."
- **PR title:** `feat(wizard): to-dos not errors, demands on Stats, no build-state badges, Cyborg retired (E1b, Decisions N–N+3)`.
- **PR body:** the template's sections, the 47-site table (§8), **every new string as it renders** (for the voice pass), **Where the order didn't fit**, and the screenshots from step 7.
- **Review checklist:**
  - Run step 6's path yourself in a browser at both widths, with Expert mode on and off.
  - Check the 47-site table against §8's rule, line by line, not just against its list.
  - Lock still waits on unspent points (162), and the ledger's ! still marks a passed step with a to-do.
  - No `appCopy` key added and unread; no archetype id in code.
  - Undo with the options folded, and Undo with the demands panel open.
  - Re-run §11's mutations.

## 15. Handing it over

The builder and reviewer prompts are in `docs/WORK-ORDERS.md`, with this order's path. This order's traps:
- **Every `E(` site is a reader of the rule.** Grep `E(` inside `validate`, not the messages you remember. Review's own pass (`engine.js:6219`) re-reads other steps' issues, so `todo` must survive it.
- **`refreshNav` redraws the issues and the nav in place** (`wizard.js:1141`) while a field has focus. All three nav sites change, or typing a name flips the wording back.
- **A redraw that isn't `#main`** (E1a's miss): the demands panel and the fold live in `#main` and redraw with it. If you put either anywhere else, `update()` has to redraw it, and a test presses Undo with it open.
- **The fold is browser state.** It never touches the character (constraint 7), and Undo's structural diff must not see it.
- The test characters are gitignored and live in Ken's main checkout under `tests/TestCharacters/`. This order mostly needs a blank character, so seed one rather than copying them.
- Run `git submodule update --init private` in a fresh worktree before the suite, or the CRB-mirror tests fail.
