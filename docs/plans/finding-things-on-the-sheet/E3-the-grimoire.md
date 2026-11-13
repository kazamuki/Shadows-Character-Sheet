# Work order E3 — The Grimoire's read mode

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), session E3. The plan gave E3 two parts:
- Main's columns at 1280px. **Ken left them as E2b made them (EQ32)**, and §1 keeps the measurements behind that.
- The Grimoire's own spells, which should read as rows with editing one press away, with no truncated text and no four-line "Link to the book". That is what this order builds.

**Status:** drafted 2026-11-12 by the Opus session that reviewed E2b, at the conductor's request. Ken answered EQ32–EQ35 on 2026-11-12 (§4), and the order was reworked to his answers: EQ32 took Alternative B. **Approved by Ken 2026-11-12** ("B stands, approve E3", in the conductor's session, after the 96px correction).
**Branch:** the builder's own, cut from `main` once this order has merged.
**Runs beside:** E4 (colour), E5 (the words) and E6 (the phone). With Main's columns left as they are, E6 has nothing here to wait for: the Grimoire's line is the same at every width.
**Impeccable:** `/impeccable layout Main at 1280px and the Grimoire's own spells`. The analysis is §1 and §9, run on `main` at 1280×860 and 1600×900 in the dev preview with the five TestCharacters. The builder doesn't run it again.

**Pre-flight:**
- **The commit is `bbff2a4`** (main after #332: app 0.68.1 under `[Unreleased]`, game data 0.54, last decision 285).
- **Main's columns were measured, prototyped and answered.** §1 holds the figures and EQ32 Ken's answer, so a later session doesn't relitigate it. Nothing on Main changes in this order.
- **Read first, the sheet's own way.** The plan says "the pattern GM mode already uses" (Decision 271: a record reads, Edit swaps in the form). The sheet has its own version, closer to the Grimoire's case: **W70** (app 0.54.1, PR #238; a *Fix*, so it has no decision).
  - A named custom weapon, armor or gear row on Loadout reads as a line. **Edit** opens it and **Done** folds it.
  - It's view state, held in `S.loOpen`, a `WeakSet` of the row objects, so it follows a row when one above it goes.
  - A row with no name reads open. A new `S` or an undo folds every named row.
  - The Grimoire's own spells take W70's rule and its `loOpen()`, so the sheet has one read-then-edit pattern.
- **Wren is the case.** Her three own spells are Zap, Kindle and Staunch, and all three match a book spell.
  - Today each is a row of seven inputs, **103px** tall at 1280.
  - Effect, Overflow and Notes truncate in three of them.
  - "Link to the book" sits in a 56px cell, wrapped to four lines and 72px tall.
- **Probes on `main`** (the worked examples' "before"):
  - `Engine.grimoire(wren).lines.filter(l=>l.custom)` holds three lines, each with a `match` and a `row` of the panel's seven `columns`.
  - Wren's Character tab draws 21 `[data-cell]` inputs in the Grimoire.
  - Own rows live in `ch.panelData.grimoire`, beside the book rows (`{ spellId, stage, notes }`).
- **Ledger search.** Searched by name: `grimoireHtml`, Your own spells, `data-cell`, Link to the book, `linkSpell`, `linkSpellRow`, `data-spelllink`, `data-spellown`, `data-spellrm`, `loOpen`, W70, `editTable`, `table.edit`, read view, Edit, Done, `inertSheet`, `RO_READERS`.
  - Superseded: none.
  - Cited, and they stand:
    - **108**: free entry for your own spells, and Link to the book.
    - **271**: GM mode's read-first, which the plan named; the sheet's W70 is the nearer rule.
    - **282**: the Grimoire is on Character.
    - **256**: the seat sheet's readers.
  - **108 is not superseded.** Its "free entry stays" is still true: the row is the same, and only how it reads at rest changes.

**Carried over** (E2b's review, 2026-11-12):
- *The order's misses*, each answered here:
  - **E2b's pre-flight said no TestCharacter held a form, but Dax is in Werewolf form.** This order's probes are run, not assumed.
  - **E2b's order said focus "stays on the button" on Hide, but it has to be moved there,** since Safari doesn't focus a clicked button. §9's *Where things land* says "moves to" wherever focus follows a press.
  - **E2b's "before" heights only reproduced when taken exactly as its §1 was.** §1 here defines its measure, including the sticky header.
  - **E2b's example 9 couldn't build two of its cases from the data.** This order's examples were checked against the data and the fixtures before they were written. Example 7 says where a fixture has to be extended.
  - **E2b's folded rise left out the button's 8px.** E3's first draft repeated the same kind of miss: it measured the fight's span against the whole 860px screen, forgetting the 88px sticky header. §1 corrects it.
- *The build's*, as review nits:
  - A header row was drawn over no rows.
  - A "next character" check passed vacuously, because it booted a fresh page.
  - An option that was off drew more than before.
  - A CSS rule was written twice.
  - The ledger and the shipped row had placeholder figures.
  - The builder didn't re-run the full suite after its last change, and took no light-theme, desktop or seat-sheet screenshots. §12 makes each a step.
- *Ken's answers on E2b*:
  - EQ28, EQ29 and EQ31 took their defaults. EQ30 went against its default: what the character has stays in view.
  - In the voice pass he kept the strings as built, except the changelog's third line.
  - He kept the primary-stat chip at full colour on an untrained row.
- **Shipped behaviour to keep:** all GM seats share one `S.combatUntrained`. This order doesn't touch Main, so the fold's button and its `RO_READERS` entry are untouched.

---

## 1. Goal and Done when

**Goal:** your own spells read like the book's: a line you can read whole, with editing one press away.

**Done when:**
- In the Grimoire, an own spell with a name reads as a line (EQ34):
  - its name, "Discipline · TN *n* / TH *n*" and its effect;
  - under them, its overflow and its notes when it has any;
  - all of it in full.
- **Edit** opens that spell's fields, and **Done** folds it (EQ35). A spell with no name reads open. No own spell's text is cut off, read or open.
- **Link to the book** sits on the spell's line, on one line, at 1280px and at 375px.
- Nothing is saved or logged by Edit or Done. The character's JSON is byte-identical before and after.
- GM mode's seat sheet reads every own spell whole. Its Edit and ✕ are disabled, and nothing that writes is enabled.
- Main is unchanged: `phone-check`'s `sheet: main` frames don't move.
- `npm run verify` and `npm run phone-check` pass. The frame fixture is re-recorded only for the frames §13 names.

**Main's columns, as measured and left (EQ32).** These figures are kept so the question isn't reopened without new facts.
- **How it was measured:** at 1280×860 on `bbff2a4`, unpinned, in the dev preview, with the five TestCharacters loaded by `openEntry()`. The sticky header (`header.top`) is 88px, so **772px** of the screen shows the page.

| 1280×860 | Dax | Juno | Kade | Sigrun | Wren |
|---|---|---|---|---|---|
| Combat column, as % of the screen | 129 | 73 | 89 | 106 | 69 |
| Stats, as % of the screen | 60 | 54 | 54 | 54 | 54 |
| Weapons to the last combat skill or the fold (px) | 868 | 540 | 682 | 751 | 473 |
| Fits in the 772px under the header? | **no, by 96** | yes | yes | yes, with 21 to spare | yes |

- **Since E2b, four of the five fights fit one screen.** Dax's doesn't, because his Form switch and its text add 135px above his weapons.
- **The band was prototyped.** It put the form, weapons and armor beside the combat skills, with Stats one row under them, wherever Main itself was 1,100px or wider.
  - It brought the spans to 542, 303, 324, 512 and 200, and shortened Main for four of five.
  - It moved Stats down 393–671px, below the fight.
  - Its `npm test` passed 1,792 of 1,792, and `phone-check` moved only six `sheet: main` frames.
- **A second prototype lost.** It put the combat skills in the right column above Stats: rows wrapped, Main grew for four of five, and Stats fell anyway.
- **Ken kept the columns (EQ32).**
- **Revisit if:**
  - a character's fight runs past the screen under the header by more than a few pixels (today only Dax's does, by 96px);
  - or E6 changes a skill row's or a card's height.

  The prototype's lessons, for whoever reopens it:
  - Key the layout on Main's own width with a container query, because pinned at 1280 Main is 905px.
  - Keep both blocks inside `.main-combat`, because 34 test lines find things under it.

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape*.
  - How an own spell reads, and what Edit opens, are player-facing behaviours someone could have chosen otherwise. EQ34 and EQ35 were exactly those choices.
  - W70, the same pattern on Loadout, shipped as a *Fix* with no decision. That's the one argument for *Fix* here, and §4 notes it. The order keeps the decision, since Ken chose between alternatives.
- **Versions:**
  - **App: patch.** A visible change with no new capability, as W70's was. `npm run bump` moves `[Unreleased]` from whatever it reads when built (0.68.1 now) to the next patch.
  - **Game data: unchanged** (Decision 68). The panel's `columns` are read, not changed.
  - **Character, table and pack schemas: unchanged.** Which spell is open is `S.loOpen`, browser state. No `migrate()` step.
- **Numbers:** one decision, **N**: the next free number on `origin/main` when it's built (286 if nothing lands first). No flags.

## 3. Decisions, drafted in full

```
N. **Your own spells read like the book's: a named one is a line, Edit opens it, Done folds it.**
     *2026-11-?? · Ken + Claude · Touches: grimoireHtml, Your own spells, own spell line, data-cell, data-spelledit, data-spelldone, data-spelllink, Link to the book, data-spellown, Add your own, data-spellrm, loOpen, S.loOpen, W70, inertSheet, RO_READERS, Grimoire, Character tab, E3*
     - **Decided:** In the Grimoire an own spell with a name reads as a line: its name, "Discipline · TN n / TH n", its effect, then its overflow and notes when it has any, all in full, with Link to the book (when its name matches a book spell), Edit and ✕ on the line (EQ34). Edit opens its fields as a form whose long fields wrap, and Done folds it (EQ35). A spell with no name reads open. It's view state, as W70's Loadout rows are (`S.loOpen`): nothing is saved or logged, and another character, a reload or an undo folds every named row.
     - **Why:** the critique's P2: Wren's three spells were rows of seven inputs, 103px tall, three cut off, with Link to the book wrapped to four lines. W70 already reads Loadout's custom rows this way, so the sheet keeps one pattern.
     - **Rejected:**
       - GM mode's page-level Edit (Decision 271): a spell is a row, like a custom weapon.
       - The input row with wider columns: still a form where a player reads.
       - Today's row opened in place (EQ35): long text is still cut off while it's typed.
       - ✕ only inside Edit (EQ34): W70's rows keep theirs on the line.
       - Tap a line to edit: Decision 271 rejected it, because it hides what's editable.
     - **Replaces:** nothing. It extends W70 to the Grimoire. Decision 108's free entry and Link to the book stand.
     - **Revisit if:** a player edits their own spells more often than they read them, or the book's spells gain an editable field beyond notes.
     - **Built:** app X.Y.Z (patch), PR #…, log entry.
```

No supersession marks. N gets one INDEX §3 line, under *Sheet & play tracking*.

## 4. Questions for Ken

**Ken's answers, 2026-11-12** (in the conductor's session, recorded on [PR #333](https://github.com/kazamuki/Shadows-Character-Sheet/pull/333#issuecomment-6845859792)). In his words: "I just read over the questions, I agree with you. I think Alternative B is a good place for EQ32, and the defaults on EQ33, 34, and 35 made sense to me".

- **EQ32 — What a wide Main does.** **Alternative B, not the default:** Main's columns stay as E2b left them. §1 keeps the measurements and the *Revisit if*.
  - *Default (not taken):* the band. Weapons and armor beside the combat skills, with Stats one row under them.
  - *Alternative A (not taken):* the combat skills in the right column above Stats.
  - **A correction Ken should see:** the reason given with the answer was that Dax's fight is "over by 8px", which compared his 868px to the whole 860px screen. The sticky header leaves 772px, so Dax's is over by **96px**. The other four fit, and Sigrun's has 21px to spare. B still stands on the rest of its reasoning (the band would drop every character's Stats 393–671px), but Ken took it with the smaller figure in mind. **Shown the 96px, Ken kept B:** "B stands, approve E3" (2026-11-12, in the conductor's session).
- **EQ33 — Where "wide" starts.** **Default** (Main itself ≥ 1,100px). Under EQ32's Alternative B there's no band, so it governs nothing. It's kept in §1 for whoever reopens the band.
- **EQ34 — What an own spell's line shows.** **Default:**
  - its name, "Evocation · TN 7 / TH 1", then its effect;
  - under them, the overflow ("Overflow: …") and the notes, each only when it has any;
  - Link to the book, Edit and ✕ at the line's end, as W70's Loadout rows keep their ✕.
- **EQ35 — What Edit opens.** **Default:** a form in the spell's place.
  - Name, Discipline, TN and TH on one row.
  - Effect, Overflow and Notes full width, each a field that wraps (a `textarea` that grows with its text).
  - Done at its end.

## 5. The assumption sweep

| What | True today | Where | True after |
|---|---|---|---|
| Own spells | A `table.edit` of the panel's `columns` (Spell Name, Discipline, TN, TH, Effect, Overflow, Notes), every row inputs (`data-cell="grimoire|i|col"`), with Link to the book and ✕ in a 34px cell | `grimoireHtml`, `sheet.js:2520–2529`; columns at `shadows-data.js:2432` | A named own spell is a line (EQ34); an open one is a form (EQ35). The fields keep `data-cell` and the same keys, so the generic binder (`sheet.js:4155`) writes them as today. The columns stay the data's, so no column is named in code (Decision 135) |
| Which own spells are open | — | — | `loOpen(row)` on the panel row object, W70's function (`sheet.js:2007`): open while it's in `S.loOpen`, or while it has no name. Edit adds it and Done deletes it. A named row stays open until Done, so naming it doesn't fold it away |
| The name `loOpen` reads | `e.name`, a weapon's or gear row's field | `sheet.js:2011` | An own spell's name is the panel's first column (`columns[0]`, "Spell Name"), not `name`. Give `loOpen` the name to read (a second argument, or a small wrapper), from the data. Never test the literal "Spell Name". W70's callers are unchanged |
| Link to the book | In the row's ✕ cell; wraps to 4 lines | `sheet.js:2525`; binder `:4115`; `linkSpellRow` | On the line, on one line (`white-space:nowrap`). Same `data-spelllink`, same title, same result: the row becomes the book's spell and keeps its notes. The spell picker's "Link yours" (`:2425`) is unchanged |
| + Add your own | Pushes `{custom:true}`; focus stays on the button | `sheet.js:4132` | Pushes it as today. The new row is nameless, so it reads open, and focus moves to its name field |
| ✕ on an own spell | `data-spellrm` | `sheet.js:4120` | Unchanged, on the line (EQ34) |
| Undo | Replaces the rows with clones | `diffChar` | Every named own spell folds, as W70's rows do (the clones aren't in the `WeakSet`) |
| A held own spell | — | `holdSpell` reads book lines only | Own spells can't be held, so there's nothing to keep |
| The seat sheet's Grimoire | Inputs disabled by `inertSheet` | `gm.js:4413` | Lines; Edit and ✕ disabled (they aren't readers); the GM reads every spell whole. **No entry is added to `RO_READERS`** |
| The wizard | Uses the spell picker, never `grimoireHtml` | `sheet.js:669` is `grimoireHtml`'s only caller | Unchanged |
| The book's spells | `<details class="spell">`: a summary line, then the notes input inside | `sheet.js:2492–2516` | Unchanged. The own line borrows the summary's look (the name, `.sub`, `.eff`), so the two lists read alike |
| Tests that read the Grimoire | The Link test presses `[data-spelllink="0"]` | `smoke-sheet-skills.test.mjs:19–30` | It must pass unchanged. No test reads `[data-cell="grimoire|…"]`: every `[data-cell]` test reads weapons or gear (`smoke-sheet-play.test.mjs:1268–1860`) |
| The table fixture's Arcanist | One book spell, no own one | `smoke-table-sheet.test.mjs:28–34` | Unchanged. Example 7 pushes an own row in its own test |
| The changelog's old line about Link to the book | Release notes for 0.17.0 | `src/data/shadows-changelog.js:719` | History. Unchanged |
| `phone-check`'s frames | `sheet: character` at 390, 768, 1300 and 1980, pinned and not | `tools/frame-fixture.json` | They move only if the fixture's character holds an own spell. §13 |
| Main | — | — | Untouched (EQ32) |

## 6. Read first

- `CLAUDE.md`: constraint 3 (styles go in `shadows.css`), constraint 7 (an open flag never goes on the row), *Change tiers*, *Decisions*.
- `SCHEMA.md` §4: Decisions **108, 271, 282, 256**.
- `docs/log/wishes-granted.md`, W70; `docs/log/shipped.md`'s W70 row (#238).
- `DESIGN.md`: the spacing scale.
- `src/ui/sheet.js`:
  - `grimoireHtml` (`:2487`);
  - `loOpen`, `loEditHtml` and `loDoneHtml` (`:2001–2016`);
  - `gearRowsHtml`'s fold (`:2124`), the nearest worked case;
  - the `data-loedit` and `data-lodone` binders (`:4199–4220`);
  - the `data-spellown`, `data-spelllink`, `data-spellrm` and `data-cell` binders (`:4110–4160`).
- `src/styles/shadows.css`: `details.spell`, `table.edit` (`:541–548`), `.grim-sp` (`:644`).

## 7. Out of scope

- **Main's columns** (EQ32). §1 says when to reopen them.
- **E5, the words:** the Grimoire's "Improvised spells and ones your GM agreed to…" line, and every intro.
- **The book spells' notes field.** It's one field, and it already sits behind a tap.
- **Loadout's custom rows**, which already work this way (W70).
- **The spell picker.**

## 8. The shapes

No data shape, save-file field, engine function or `migrate()` step changes. Browser state only: own spell rows join `S.loOpen`, W70's set.

## 9. The UI

**An own spell, read** (EQ34):
- The name in bold, "Evocation · TN 7 / TH 1" in the book line's `.sub` style, and the effect in its `.eff` style, all from the row's columns.
- Under them, the overflow ("Overflow: …") and the notes, each only when it has any. All in full: they wrap, never truncate.
- At the line's end: **Link to the book** when the name matches a book spell (on one line), **Edit**, and ✕.
- A blank column draws nothing, never "undefined" or an empty " · ". A spell with only a name reads as its name.

**An own spell, open** (EQ35):
- A form in the spell's place: name, Discipline, TN and TH on one row; Effect, Overflow and Notes full width, each a field that wraps.
- **Done** at its end, hidden while the name is blank, as W70's is.
- ✕ stays.
- Each field keeps today's `data-cell` key and its `aria-label` (its column's name).

**Where things land:**

| Press | Record | View | Focus |
|---|---|---|---|
| Edit on a spell | Nothing (`S.loOpen` gains the row) | That spell opens in place; the others stay lines | Moves to its name field |
| Done | Nothing (`S.loOpen` loses it) | It folds to its line, showing what was typed | Moves to its Edit |
| + Add your own | A `{custom:true}` row, logged as today | A nameless spell, open, at the end of Your own spells | Moves to its name field |
| Link to the book (on a line) | As today: the row becomes the book's spell, notes kept, logged | It leaves Your own spells and joins the book's | As today |
| ✕ | As today | Gone | As today |
| Undo | As today | Every named own spell folds | As today |
| A reload, or another character | — | Every named own spell is a line | As today |

**Copy.** One new label, "Overflow:", written before a spell's overflow on its line. It's the panel's own column name. Mark it for the voice pass anyway.

## 10. Worked examples, as named tests

Write these first, and show each failing on `main`, or say why it passes there.

1. `smoke-sheet-skills.test.mjs`: **"Decision N: a named own spell reads as a line, in full, with Link to the book on it"**.
   - Build three own rows on a locked character from the data: the `grimoire` panel's `columns` (found by `type`, not by id), one row named after a book spell (`D.spells`, found by search, not named), one with a 200-character Effect, and one with Overflow and Notes.
   - The Grimoire has no `[data-cell]`.
   - Each line's text has its name, its discipline, "TN", "TH" and its whole Effect, equal to the stored string.
   - Overflow and Notes appear only on the spell that has them.
   - `[data-spelllink]` is on the matching line only.
2. Same file: **"Decision N: Edit opens one spell and Done folds it, and neither writes"**.
   - Press Edit on the second spell. Its fields appear with the stored values, and the other two are still lines. Focus is on its name field.
   - The character's JSON is unchanged, and the Activity Log has no new entry.
   - Type into its Effect: it's stored, as today.
   - Done: the line shows the new Effect, and focus is on its Edit.
3. Same file: **"Decision N: Add your own opens a nameless spell with focus in its name, and only Done folds it"**.
   - Add your own: a new open spell is last, focus is in its name field, and its Done is hidden.
   - Type a name: Done shows, and the spell stays open.
4. Same file: **"Decision N: a reload and an undo fold every named own spell, and a nameless one stays open"**.
   - Open two named spells, then undo something: both are lines.
   - Open one again, then open the same character through `openEntry` **in the same page** (a fresh boot would pass whatever `openEntry` did; that was E2b's vacuous test). Every named spell is a line, and a nameless one is open.
5. Same file: **"Decision N: an own spell with only a name reads as its name"**. No " · ", "TN", "undefined" or "Overflow" in its line.
6. The existing **Link to the book** test (`:19`) passes unchanged, pressing `[data-spelllink="0"]` on the line.
7. `smoke-table-sheet.test.mjs`: **"Decision N: the seat sheet reads an own spell whole, and its Edit is dead"**.
   - Push an own row onto the `arcanist()` character's `panelData.grimoire` in this test; the fixture holds only a book spell.
   - On the seat sheet's Character tab: a line, and no `[data-cell]`.
   - Edit and ✕ are disabled, and Decision 256's "no writer is enabled" check holds.
8. **In Chromium** (the preview, or `phone-check` if it already loads an Arcanist), at 1280 and at 375:
   - Link to the book is one line tall.
   - No own-spell text box's `scrollWidth` exceeds its `clientWidth`, read or open.
   - Nothing in `main` passes the right edge.

## 11. Tests beyond the examples

- **Measure** Wren's Grimoire at 1280 and 375 before and after: each own spell's height, read and open, and Link to the book's height. Put both in the PR.
- **No stored state moved** (example 2).
- **`phone-check`:** every `sheet: main` frame is unchanged.
- **Voice:** `voice.test.mjs` passes on "Overflow:".
- **Mutation tests**, each against the built code:
  - Draw own spells always open (`loOpen` true): examples 1 and 4 fail.
  - Fold a nameless spell: example 3 fails.
  - Read the name from `name`, not the first column: examples 1 and 4 fail, since every own spell reads nameless and open.
  - Write on Edit (commit, not view state): example 2 fails.
  - Cut the Effect at a length (`.slice(0, 80)`): example 1 fails.
  - Drop focus on Edit: example 2 fails.
  - Join blank columns anyway: example 5 fails.
  - Put Edit in `RO_READERS`: example 7 fails.
- **Check each for a second path** that already covers the line.

## 12. Steps

1. **The examples as failing tests.** Write examples 1–7, then run `npm run test:fast`.
2. **N.** The line, the form, Edit and Done with `loOpen`, and Add your own's focus. Run `npm run verify`.
3. **The decision (§3)**, with its INDEX line.
4. **In the dev preview,** at 1280×860 and 375×812, in both the dark and the light theme:
   - Wren's Character tab: her Grimoire read, one spell open, a new one added, an undo, a reload;
   - GM mode's seat sheet (Dead Air) on Character, with an own spell.

   Put the **screenshots in the PR**: Wren's Grimoire read and open at 1280 in both themes, read at 375, and the seat sheet's Grimoire.
5. **`npm run phone-check`.** Re-record the frame fixture only if the frames §13 names moved.
6. **The mutation tests (§11).**
7. **After the last change of any kind, the full `npm run verify` again, and say so in the PR.** (E2b's builder didn't re-run it after its last trim.)
8. **Close-out (§14).**

## 13. Stop and ask

**Stop if:**
- `loOpen` can't serve the Grimoire without changing what it does for Loadout's rows.
- An own spell's fields can't keep their `data-cell` keys, so the generic binder would need a Grimoire branch.
- A test you didn't expect reads an own spell's input outside the Grimoire (the print, a popover, the wizard).
- Any `sheet: main` frame moves.

**Not a stop.**
- **The Grimoire's expected breaks** are tests that read `[data-cell="grimoire|…"]` or `table.edit` inside the Grimoire. Grep finds none.
- **A `sheet: character` frame** moves only if the fixture's character holds an own spell. If it does, that frame is expected.
- **The app version literals** the patch bump moves.

## 14. Close-out

- **`close-the-session`, for *Rule or shape*:**
  - N from §3, with *Built* filled in, its PR number and measured figures included, never placeholders (E2b's nit);
  - the app patch bump;
  - STATE rewritten where E3 stands;
  - a log entry;
  - a `shipped.md` row with the PR number.
  - In the plan's §3, the E3 row links this order and reads "E3 built".
- **CHANGELOG** (player voice, for the voice pass):
  - "Spells you wrote yourself read like the book's, in full. **Edit** opens one, and **Done** puts it back."
- **PR title:** `feat(sheet): your own spells read like the book's (E3, Decision N)`.
- **PR body:**
  - the template's sections;
  - every new string as it renders, for the voice pass;
  - the measurements (§11);
  - **Where the order didn't fit**;
  - the screenshots (§12 step 4);
  - a line saying the full suite was run after the last change.
- **Review checklist:**
  - Re-do §5's sweep by grepping for readers: `grimoireHtml(`, `data-spelllink`, `data-spellown`, `data-spellrm`, `data-cell`, `loOpen(`, `RO_READERS`, `panelData.grimoire`.
  - Read `loOpen`'s change beside its W70 callers: a Loadout row behaves exactly as before.
  - Wren's Grimoire, in both themes at 1280 and 375: three lines, nothing cut off, Link to the book on one line; then Edit and Done, Add your own, an undo, a reload.
  - GM mode's seat sheet: own spells read whole, and nothing that writes is enabled.
  - Re-run §11's mutations.
  - Run `npm run verify` on the PR's head yourself.

## 15. Handing it over

The builder and reviewer prompts are in `docs/WORK-ORDERS.md`, with this order's path. This order's traps:
- **W70 is the pattern.** Use `loOpen` and its `WeakSet`. Don't write a second one for the Grimoire, and don't store an open flag on the row, which would write view state into the character file (constraint 7).
- **The name is the panel's first column**, from the data. `loOpen` reads `name` today, so teach it to take the name, and leave Loadout's calls as they are.
- **A blank column draws nothing.** An own spell typed with only a name must not read "· TN  / TH ".
- **jsdom can't see wrapping.** Examples 1–7 pin the text and the structure. Only Chromium (example 8) proves nothing is cut off and Link to the book is one line.
- **A fresh boot isn't a reload.** Test the fold across `openEntry` in the same page.
- **Re-run the full suite after the last change**, and take the light-theme and seat-sheet screenshots. E2b's builder skipped both.
- **Mount the private repo** with `git submodule update --init private` in a fresh worktree before the suite.
