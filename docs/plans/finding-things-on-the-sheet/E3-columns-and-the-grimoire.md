# Work order E3 — Main's columns and the Grimoire's read mode

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), session E3. Its section reads: Main's first column ran 167% of the screen against Stats at 60%, so rebalance it so the weapons and the combat skills E2 keeps on Main show together without scrolling; and the Grimoire's own spells read as rows, with editing one press away, with no truncated text and no four-line "Link to the book".
**Status:** drafted 2026-11-12 by the Opus session that reviewed E2b, at the conductor's request. Awaiting Ken's answers to EQ32–EQ35 (§4), then approval.
**Branch:** the builder's own, cut from `main` once this order has merged.
**Runs beside:** E4 (colour). E6 (the phone) waits for it. E5 (the words) doesn't, and touches none of this order's strings.
**Impeccable:** `/impeccable layout Main at 1280px and the Grimoire's own spells`. The analysis is §1 and §9, run on `main` at 1280×860 and 1600×900 in the dev preview with the five TestCharacters. The builder doesn't run it again.

**Pre-flight:**
- **The commit is `bbff2a4`** (main after #332: app 0.68.1 under `[Unreleased]`, game data 0.54, last decision 285).
- **E2b moved the problem, and the order measures what's left.** The critique's 167% was taken before E2b folded the untrained combat skills. At 1280×860 on `bbff2a4`, the Combat column is **69–129%** of the screen against Stats at **54–60%**. What's left is that Combat runs 124–586px longer than Stats, and that Dax's weapons and his last combat skill are **868px** apart, more than the 860px screen. §1 has the table.
- **Measured** in the dev preview with the five TestCharacters loaded by `openEntry()`, at 1280×860 and 1600×900, unpinned and pinned. Every figure is the top or height of an element in page pixels (`getBoundingClientRect().top + scrollY`). E2b's "before" figures only matched when measured exactly the way they were first taken, so the builder measures the same way, in the same preview session, before and after.
- **Prototyped.** The layout was built in a scratch copy of `sheet.js` (3 lines) and `shadows.css` (10 lines), measured, and run against `npm test` (1,792 of 1,792 passed) and `npm run phone-check` (only six `sheet: main` frames moved). §13 has the detail. The scratch was reverted, and none of it is on this branch. The Grimoire wasn't prototyped. Its readers are §5's, found by grep, and its pattern is W70's, which is already built and tested.
- **Two prototypes were tried, and the first lost.**
  - **The combat skills moved into the right column above Stats:** at 1280 the right column is 588px, so a skill row wraps from 33 to 47px (Dax's from 81 to 106). Main got **taller** for four of the five (Juno +166px), and Stats fell 220–562px.
  - **The order's layout** (a wide band, §9) shortens Main for four of the five and keeps every skill row at its two-column height.
  - EQ32 asks Ken to choose between them, and to say whether he'd rather leave the columns alone.
- **The pinned panel is the trap.** At 1280 with the vitals pinned, Main is **905px** wide, and the band's skill rows ran **223px** tall there in the first prototype. So the layout is decided by **Main's own width**, by a container query, never by the screen's: the band from 1,100px of Main. Unpinned that is a screen of 1,175px or more. Pinned it is about 1,500px or more. `.cond-grid` and `.arch-part` already use container queries, so this is no new primitive.
- **Read first, the sheet's own way.** The plan says "the pattern GM mode already uses" (Decision 271: a record reads, Edit swaps in the form). The sheet already has its own version, closer to the Grimoire's case: **W70** (app 0.54.1, PR #238; a *Fix*, so no decision). A named custom weapon, armor or gear row on Loadout reads as a line, **Edit** opens it and **Done** folds it. It's view state in `S.loOpen`, a `WeakSet` of the row objects, so it follows a row when one above it goes. A row with no name reads open, and a new `S` or an undo folds every named row. The Grimoire's own spells take W70's rule and its `loOpen()`, so the sheet has one read-then-edit pattern.
- **Wren is the Grimoire's case.** Her three own spells are Zap, Kindle and Staunch, and all three match a book spell. Today each is a row of seven inputs, **103px** tall. Effect, Overflow and Notes truncate in three of them. "Link to the book" sits in a 56px cell, wrapped to four lines and 72px tall.
- **Probes on `main`** (the worked examples' "before"):
  - `Engine.grimoire(wren).lines.filter(l=>l.custom)` holds three lines, each with a `match` (Zap, Kindle, Staunch) and a `row` of seven columns.
  - On Wren's Character tab the Grimoire draws 21 `[data-cell]` inputs.
  - `Engine.formState(dax)` is Werewolf. Feral Mind bars INT skills, none of them combat (E2b's carried miss).
- **Ledger search.** Searched by name: `renderShMain`, `main-grid`, `main-combat`, `main-stats`, `statgroups`, `statgroup`, `STAT_GROUPS`, Combat skills, Weapons, Armor, the Form switch, `vitals-pinned`, `PIN_MEDIA`, `main-pin`, W13, W45, `grimoireHtml`, Your own spells, `data-cell`, Link to the book, `linkSpell`, `data-spelllink`, `data-spellown`, `data-spellrm`, `loOpen`, W70, `editTable`, `table.edit`, read view, Edit, Done.
  - Superseded in part: **165**. Its "Combat … the left column when wide" becomes "the band above Stats" on a wide Main. Its page order (Combat before Stats at every width) stands.
  - Cited, and they stand:
    - **32**: already superseded in part by 165, and not marked again.
    - **122**: Main is the fight view. That is why the fight takes the band.
    - **160**: the pin. Why the width is Main's, not the screen's.
    - **284**: the fold, and its button and `RO_READERS` entry, which ride in the skills block.
    - **108**: free entry for your own spells stays, and so does Link to the book.
    - **271**: GM mode's read-first, which the plan named; the sheet's W70 is the nearer rule.
    - **282**: the Grimoire is on Character.
  - **108 is not superseded.** Its "free entry stays" is still true: the row is the same, and only how it reads at rest changes.

**Carried over** (E2b's review, 2026-11-12):
- *The order's misses*, each answered here:
  - **E2b's pre-flight said no TestCharacter held a form, but Dax is in Werewolf form.** This order probes it (above).
  - **E2b's order said focus "stays on the button" on Hide, but it has to be moved there,** because Safari doesn't focus a clicked button. §9's *Where things land* says "moves to" wherever focus must follow a press.
  - **E2b's "before" heights only reproduced when taken exactly as its §1 was.** The builder's own `#main` measure ran 86px under. The pre-flight above defines the measure.
  - **E2b's example 9 couldn't build two of its cases from the data.** This order's examples were checked against the data before they were written.
  - **E2b's folded rise left out the button's 8px.** §1 gives the band's figures with everything drawn.
- *The build's*, as review nits:
  - A header row was drawn over no rows.
  - A "next character" check passed vacuously, because it booted a fresh page.
  - An option that was off drew more than before.
  - A CSS rule was written twice.
  - The ledger and the shipped row had placeholder figures.
  - The builder didn't re-run the full suite after its last change, and took no light-theme, desktop or seat-sheet screenshots. §12 makes each of those a step.
- *Ken's answers on E2b*:
  - EQ28, EQ29 and EQ31 took their defaults. EQ30 went against its default: what the character has stays in view.
  - In the voice pass he kept the strings as built, except the changelog's third line, where he took the reviewer's rewrite.
  - He kept the primary-stat chip at full colour on an untrained row.
- **Shipped behaviour to keep:** the fold's button and its `RO_READERS` entry ride in the skills block wherever it moves. All GM seats share one `S.combatUntrained`.

---

## 1. Goal and Done when

**Goal:** on a wide screen, the fight reads across: the weapons and armor you carry beside the combat skills you roll, with Stats under them. And your own spells read like the book's: a line you can read whole, with editing one press away.

**Done when:**
- When Main is at least **1,100px** wide, the Combat section's heading, its Pain line, movement and conditions note span Main. Under them, the form switch, Weapons and Armor take the left half and Combat skills (with its Show N untrained) the right. Stats follows as one row, its four spheres side by side (EQ32, EQ33).
- Narrower than 1,100px (any screen with the vitals pinned under about 1,500px, any screen under 1,175px, and every phone), Main is exactly as it is on `bbff2a4`.
- The page order is unchanged at every width: Combat (its heading, then the form, weapons and armor, then the combat skills), then Stats. Tab and a screen reader meet them in that order (165).
- At 1280×860 unpinned, with no popover open, every TestCharacter's weapons-to-last-skill span and Main's height come within 10px of the prototype's, or under it:

| 1280×860 | Dax | Juno | Kade | Sigrun | Wren |
|---|---|---|---|---|---|
| Weapons to the last skill (or the fold), today | 868 | 540 | 682 | 751 | 473 |
| … prototype | **542** | **303** | **324** | **512** | **200** |
| Main's height, today | 1,795 | 1,268 | 1,438 | 1,764 | 1,245 |
| … prototype | 1,570 | 1,236 | 1,346 | 1,657 | 1,253 |
| Stats' top, today | 650 | 605 | 633 | 816 | 615 |
| … prototype | 1,321 | 998 | 1,108 | 1,419 | 1,015 |

  Dax's skills block starts 135px *above* his weapons, beside his Form switch, so his span is measured from whichever starts first. At 1600×900 the prototype's spans are 442, 251, 283, 428 and 184. Pinned at 1600, Main is 1,225px wide and takes the band: Dax 525, Juno 303.
- In the Grimoire, an own spell with a name reads as a line: its name, "Discipline · TN *n* / TH *n*", its effect, and under them its overflow and its notes when it has any, all in full. **Edit** opens that spell's fields and **Done** folds it (EQ34). A spell with no name reads open. No own spell's text is cut off, read or open (EQ35).
- **Link to the book** sits on the spell's line, on one line.
- Nothing is saved or logged by Edit or Done. The character's JSON is byte-identical before and after.
- GM mode's seat sheet lays out Main exactly as the player's own sheet does at the same width (`phone-check`'s L2). Its Grimoire reads as lines, Edit is disabled there, and Show N untrained still works.
- `npm run verify` and `npm run phone-check` pass. The frame fixture is re-recorded only for the frames §13 names.

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape*. Where Main puts Stats on a wide screen is a player-facing layout someone could have chosen otherwise, and it supersedes Decision 165 in part. How an own spell reads is the same kind of choice.
- **Versions:**
  - **App: patch.** A visible change with no new capability, as E2b's was. `npm run bump` moves `[Unreleased]` from whatever it reads when built (0.68.1 now) to the next patch.
  - **Game data: unchanged** (Decision 68).
  - **Character, table and pack schemas: unchanged.** Edit state is `S.loOpen` (browser state, as W70's). No `migrate()` step.
- **Numbers:** two decisions, **N and N+1**: the next free numbers on `origin/main` when it's built (286–287 if nothing lands first). No flags.

## 3. Decisions, drafted in full

```
N. **On a wide Main the fight reads across: the form, weapons and armor beside the combat skills, and Stats one row under them.**
     *2026-11-?? · Ken + Claude · Touches: renderShMain, main-grid, main-combat, combat-arms, combat-skills, main-stats, statgroups, statgroup, STAT_GROUPS, container query, Combat skills, Weapons, Armor, Form switch, Show N untrained, vitals-pinned, Pin vitals, phone-check, L2, E3*
     - **Decided:** When Main is at least 1,100px wide (a container query on its width, so the pinned panel counts), Combat's heading, Pain line, movement and conditions note span Main. The form switch, Weapons and Armor take the left half, and Combat skills with Show N untrained take the right. Stats follows as one row, its four spheres side by side. Narrower, Main is as before. Combat comes before Stats in the page at every width (Decision 165).
     - **Why:** after E2b, at 1280×860, Combat still ran 124–586px past Stats, and Dax's weapons and his last combat skill were 868px apart. The band brought that to 200–542px and shortened Main for four of the five test characters (E3's §1).
     - **Rejected:**
       - The combat skills in the right column above Stats (EQ32): its rows wrap at 588px, Main grew for four of five, and Stats fell as far.
       - Three columns: Stats' four spheres don't fit in ~390px.
       - A media query on the screen: pinned, Main is 905px at a 1280px screen.
       - CSS `order`: Decision 165.
       - Leaving the columns as E2b left them: Dax's fight still didn't fit one screen.
     - **Replaces:** Decision 165 in part (on a wide Main, Combat is the band above Stats, not the left column). Decisions 122, 160 and 284 stand.
     - **Revisit if:** players look up a stat mid-fight more often than a combat skill, or E6 changes a skill row's height.
     - **Built:** app X.Y.Z (patch), PR #…, log entry.

N+1. **Your own spells read like the book's: a named one is a line, Edit opens it, Done folds it.**
     *2026-11-?? · Ken + Claude · Touches: grimoireHtml, Your own spells, own spell line, data-cell, data-spelledit, data-spelldone, data-spelllink, Link to the book, data-spellown, Add your own, data-spellrm, loOpen, S.loOpen, W70, inertSheet, RO_READERS, Grimoire, Character tab, E3*
     - **Decided:** In the Grimoire an own spell with a name reads as a line: its name, "Discipline · TN n / TH n", its effect, then its overflow and notes when it has any, all in full, with Link to the book (when its name matches a book spell), Edit and ✕. Edit opens that spell's fields and Done folds it. A spell with no name reads open. It's view state, as W70's Loadout rows are (`S.loOpen`): nothing is saved or logged, and another character, a reload or an undo folds every named row.
     - **Why:** the critique's P2. Wren's three spells were rows of seven inputs, 103px tall, three of them cut off, with Link to the book wrapped to four lines. W70 already reads Loadout's custom rows this way, so the sheet keeps one pattern.
     - **Rejected:**
       - GM mode's page-level Edit (Decision 271): a spell is a row, like a custom weapon, not a page.
       - The input table with wider columns: still a form where a player reads.
       - Tap a line to edit: Decision 271 rejected it, because it hides what's editable.
     - **Replaces:** nothing. It extends W70 to the Grimoire, and Decision 108's free entry and Link to the book stand.
     - **Revisit if:** a player edits their own spells more often than they read them, or the book's spells gain an editable field beyond notes.
     - **Built:** app X.Y.Z (patch), PR #…, log entry.
```

**Supersession marks** (CLAUDE.md, *Decisions*):
- **165:** `→ **Superseded in part by Decision N**: on a wide Main (1,100px or more), Combat is the band above Stats, its form, weapons and armor beside its combat skills; the page order stands.`
- Its INDEX §3 line gets the same mark. N and N+1 each get a line under *Sheet & play tracking*.

## 4. Questions for Ken

Each question has a default, and one left blank takes it.

- **EQ32 — What a wide Main does.**
  - **Default:** the band. Weapons and armor beside the combat skills, and Stats one row under them. Measured at 1280: the fight's span is 200–542px and Main shortens by up to 225px, but Stats falls 393–671px, below the fight.
  - *Alternative A:* the combat skills move into the right column above Stats, which stays beside the fight. Measured: the span is about the same, but skill rows wrap (Dax's run 106px), Main grows for four of five (Juno +166px), and Stats falls 220–562px anyway.
  - *Alternative B:* leave the columns as E2b left them. Dax's fight doesn't fit one screen (868px), and the rest fit.
- **EQ33 — Where "wide" starts.**
  - **Default:** when Main itself is 1,100px or wider, so a 1280px screen gets the band unpinned and keeps today's two columns pinned.
  - *Alternative:* from a 1280px screen whatever the pin. Pinned, Main is 905px, and the prototype's skill rows ran 223px tall.
- **EQ34 — What an own spell's line shows.**
  - **Default:**
    - Its name, "Evocation · TN 7 / TH 1", then its effect, as a book spell's summary reads.
    - Under them, the overflow ("Overflow: …") and the notes, each only when it has any.
    - Link to the book, Edit and ✕ at the line's end, as W70's Loadout rows keep their ✕.
  - *Alternative:* Remove only inside Edit, as GM mode's Delete is (Decision 271).
- **EQ35 — What Edit opens.**
  - **Default:** a form under the spell's name. Name, Discipline, TN and TH on one row; Effect, Overflow and Notes full width, each a field that wraps (a `textarea` that grows with its text), so nothing is cut off while it's typed. Done at its end.
  - *Alternative:* today's seven-column input row, opened in place, as Loadout's Edit opens a weapon's row. It's the same pattern, but long text is still cut off while it's being edited.

## 5. The assumption sweep

| What | True today | Where | True after |
|---|---|---|---|
| Main's Combat section | One `section.main-combat`: the heading with the Pain chip, the Pain line, movement, the conditions note, then each toggle panel, Weapons, attack notes, Armor, the Combat skills heading, the skill table and its fold | `renderShMain`, `sheet.js:459–495` | The same section, the same children in the same order, but the form, weapons and armor are wrapped in one block (`combat-arms`, say) and the skills heading, table and fold in another (`combat-skills`). The heading, Pain line, movement and conditions note stay direct children. The builder names the blocks |
| `.main-grid`'s children | `main-combat`, `main-stats`, in that order | `sheet.js:454–498`; pinned by `smoke-sheet-archetypes.test.mjs:249` (W45) | Unchanged. That test passes as it is |
| The section's headings | Combat, (Form), Weapons, Armor, Combat skills, in page order | `smoke-sheet-skills.test.mjs:645` (W13) | Unchanged in page order. The test passes as it is |
| Every test that finds a weapon, a reload, the movement line or a skill row under `.main-combat` | `smoke-sheet-play:406, 1116, 1686–1699`; `smoke-sheet-skills:479–572, 1153–1240, 1261, 1305, 1321, 1355`; `smoke-sheet-archetypes:505–510, 648` | — | Unchanged. Both blocks are inside `.main-combat`. That's why the section isn't split |
| The wide layout | `.main-grid` two columns (1.15fr / .85fr) from 901px; one below | `shadows.css:1044–1050` | From 1,100px of `.main-grid`'s own width (`container-type:inline-size` on it, queried by its children): both sections span the grid; `.main-combat` is two columns with its direct children other than the two blocks spanning both; `.statgroups` puts each sphere's cards in a row. Below 1,100px, nothing changes |
| An empty arms block | — | — | A character with no form, weapons or armor draws no arms block, and the skills block takes the full width of the band. Build it in example 3 |
| The phone | `.main-grid` one column ≤900px; `.statgroups` 2 columns ≤540px | `shadows.css:1050–1051` | Unchanged. A phone's Main is byte-identical in layout (`phone-check`'s frames) |
| The pinned panel | Main is 905px at 1280; 1,225px at 1600 | Decision 160; `body.vitals-pinned` | The container query sees Main's width, so the pin decides it with no rule of its own |
| GM's seat sheet | Draws `renderShMain` inside `.ro-sheet`; `phone-check` L2 checks its `.main-grid` columns equal the player's own at 1300 and wider | `gm.js:4440`; `tools/phone-check.mjs:417–455` | The container query sees the seat sheet's own width. L2 must still pass. If the seat sheet's Main is narrower than the player's at the same screen, the two lay out differently and L2 fails: that's a stop (§13). L2's `cols()` reads `.main-grid`'s template, which the band doesn't change, so L2 also gains a comparison of whether `.main-combat` is two columns |
| The fold (Decision 284) | Its button and `[data-untrainedrows]` in `.main-combat`; `[data-untrainedfold]` in `RO_READERS` | `sheet.js:384–394`, `3815`; `gm.js:4397` | Inside the skills block. Unchanged |
| The Pain line's "totals below include it" | Above the weapons and the skills | `sheet.js:461` | Still above both: it spans the band. Decision 285's line is still the line above the table |
| Stats in one row | — | `groupedStatBlockHtml`, `sheet.js:201`; `statCellHtml`, `:187` | Cards are ~106px wide at 1280. A form boost's "+4 form", TOL's and WILL's `?` and the gold frame all fit (prototype). E4 recolours the gold; this order doesn't touch it |
| Print | Its own layout | `print.css`; `pSkillCellsHtml` | Unchanged. No print rule names `main-` or `statgroup` |
| Own spells | A `table.edit` of the panel's `columns` (Spell Name, Discipline, TN, TH, Effect, Overflow, Notes), every row inputs (`data-cell="grimoire|i|col"`), with Link to the book and ✕ in a 34px cell | `grimoireHtml`, `sheet.js:2520–2529`; columns in `shadows-data.js:2432` | A named own spell is a line (EQ34); an open one is a form (EQ35). The fields keep `data-cell` and the same keys, so the generic binder (`sheet.js:4155`) writes them as today. The columns stay the data's: no column is named in code (Decision 135) |
| Which own spells are open | — | — | `loOpen(row)` on the panel row object, W70's function (`sheet.js:2007`): open when held in `S.loOpen` or nameless. Edit adds it, Done deletes it. A named row stays open until Done, so naming it doesn't fold it away |
| The name column | — | — | The panel's first column, `columns[0]` ("Spell Name"). It's what `loOpen` reads as `name` for a weapon, so the Grimoire passes the row's first column. Say so in a comment, and test it from the data, never by the literal |
| Link to the book | In the row's ✕ cell; wraps to 4 lines | `sheet.js:2525`; binder `:4115`; `linkSpellRow` | On the line, one line (`white-space:nowrap`). Same `data-spelllink`, same title, same result: the row becomes a book spell and keeps its notes. The spell picker's "Link yours" (`:2425`) is unchanged |
| + Add your own | Pushes `{custom:true}`; focus stays on the button | `sheet.js:4132` | Pushes it as today. The new row is nameless, so it reads open, and focus moves to its name field |
| ✕ on an own spell | `data-spellrm` | `sheet.js:4120` (asks first if it's held) | Unchanged, on the line (EQ34's default) |
| Undo | Replaces rows with clones | `diffChar` | Every named own spell folds, as W70's rows do |
| A held own spell | — | — | Own spells can't be held (`holdSpell` reads book lines). Nothing to keep |
| The seat sheet's Grimoire | Inputs disabled by `inertSheet` | `gm.js:4413` | Lines; Edit and ✕ disabled (they aren't readers); the GM reads every spell whole. **No reader is added to `RO_READERS`** |
| The wizard | Its Grimoire step uses the spell picker, not `grimoireHtml` | `sheet.js:669` is the only caller | Unchanged |
| The book spells | `<details class="spell">`, summary line, notes input inside | `sheet.js:2492–2516` | Unchanged. The own line borrows its look (`.spell` summary's name, `.sub`, `.eff`), so the two lists read alike |
| The changelog's old line about Link to the book | Release notes for 0.17.0 | `src/data/shadows-changelog.js:719` | History. Unchanged |
| `phone-check`'s frame fixture | Records `main`'s boxes on every sheet tab at 390, 768, 1300 and 1980, pinned and not, plus a hash of every box under `main` | `tools/frame-fixture.json`; `frameBoxes`, `phone-check.mjs:130` | **The prototype moved six frames, all `sheet: main`:** at 390, 768 and 1300 pinned only the box count (+2, the two wrapper blocks), with every position the same; at 1300, 1980 and 1980 pinned, `.main-grid`'s height (468 → 498, 447 and 481 for the fixture's character). The Grimoire adds `sheet: character` only if the fixture's character has an own spell. §13 |

## 6. Read first

- `CLAUDE.md`: constraint 3 (the layout is `shadows.css`, with no inline styles), *Change tiers*, and *Decisions*.
- `SCHEMA.md` §4: Decisions **122, 160, 165, 108, 271, 282, 284**.
- `docs/log/wishes-granted.md`, W70; `docs/log/shipped.md`'s W70 row (#238). The pattern N+1 extends.
- `DESIGN.md`: the spacing scale, and The Signal-Not-Decor Rule (the band adds no frame).
- `src/ui/sheet.js`:
  - `renderShMain` (`:398`) and `groupedStatBlockHtml` (`:201`);
  - `grimoireHtml` (`:2487`), and `loOpen`, `loEditHtml` and `loDoneHtml` (`:2001–2016`);
  - the gear rows' fold (`gearRowsHtml`, `:2124`);
  - the binders for `data-loedit` and `data-lodone` (`:4199–4220`), and for `data-spellown`, `data-spelllink`, `data-spellrm` and `data-cell` (`:4110–4160`).
- `src/styles/shadows.css`: `.main-grid` and `.statgroups` (`:1043–1051`); the container queries at `:1018–1024` and `:1339–1340`; `details.spell` and `table.edit` (`:541–548`).
- `tools/phone-check.mjs`: L2 (`:417–455`).

## 7. Out of scope

- **E6, the phone:** anything under 1,100px of Main, a phone's skill rows, Stats' 2-column phone grid.
- **E4, colour:** the gold frame on a form-boosted stat.
- **E5, the words:** the Grimoire's "Improvised spells and ones your GM agreed to…" line, and every intro.
- **The book spells' notes field** (an input inside each `details.spell`). It's one field, and it already sits behind a tap.
- **Main's top band** (the cards, the verbs, Conditions), and Identity & History.
- **Pinned under 1,500px.** EQ33 leaves it as today; its Main is 905–1,099px.
- **Loadout's custom rows**, which already work this way (W70).

## 8. The shapes

No data shape, save-file field, engine function or `migrate()` step changes. Browser state only: own spell rows join `S.loOpen`, W70's set.

## 9. The UI

**A wide Main** (Main at least 1,100px wide):
- **Spanning the band:** the Combat heading (and its Pain chip), the Pain line, movement and the conditions note.
- **Left half:** each toggle panel (the form switch), then Weapons and its attack notes, then Armor.
- **Right half:** Combat skills, its table and Show N untrained. Its heading shows whenever the left half has anything, as today's rule draws it (`lines.length || natural || worn || natMain`).
- **Stats:** one row under the band, the four spheres in their order, each sphere's cards side by side. Its heading stays.
- **Narrower:** as today. No gap, frame or colour is added; the spacing is the existing `.main-grid` gap (30px between columns).

**An own spell, read** (EQ34's default):
- The name in bold, "Evocation · TN 7 / TH 1" in the book line's `.sub` style, and the effect in its `.eff` style. These are the same parts a book spell's summary draws, from the row's columns.
- Under them, the overflow ("Overflow: …") and the notes, each only when it has any. All in full: they wrap, never truncate.
- At the line's end: **Link to the book** when the name matches a book spell (one line), **Edit**, and ✕.
- A blank column draws nothing, never "undefined" or an empty " · ". A spell with only a name reads as its name.

**An own spell, open** (EQ35's default):
- A form in the spell's place. Name, Discipline, TN and TH on one row; Effect, Overflow and Notes full width, each a field that wraps.
- **Done** at its end, hidden while the name is blank, as W70's is.
- ✕ stays.
- Each field keeps today's `data-cell` key and `aria-label` (its column's name), so typing writes as it does now.

**Where things land:**

| Press | Record | View | Focus |
|---|---|---|---|
| Edit on a spell | Nothing (`S.loOpen` gains the row) | That spell opens in place; the others stay lines | Moves to its name field |
| Done | Nothing (`S.loOpen` loses it) | It folds to its line, showing what was typed | Moves to its Edit |
| + Add your own | A `{custom:true}` row, logged as today | A nameless spell, open, at the end of the list | Moves to its name field |
| Link to the book (on a line) | As today: the row becomes the book's spell, notes kept, logged | It leaves Your own spells and joins the book's list | As today |
| ✕ | As today (asks first if it's the book's held spell) | Gone | As today |
| Undo | As today | Every named own spell folds | As today |
| A reload, or another character | — | Every named own spell is a line | As today |
| Main at 1,100px or wider (a resize, the pin) | — | The band, live, with no re-render (pure CSS) | Unchanged |
| Show N untrained, in the band | `S.combatUntrained` | Rows show in the right half | As E2b |

**Copy.** No new string. "Overflow:" is the only new label, written before a spell's overflow text on its line, and it's the panel's own column name. Mark it for the voice pass anyway.

## 10. Worked examples, as named tests

Write these first, and show each failing on `main` or say why it passes there.

1. `smoke-sheet-skills.test.mjs`: **"Decision N: Main's Combat section holds the form, weapons and armor in one block and the combat skills in the next, under its heading"**. Use a character with a form switch, a weapon and worn armor (build Dax's shape from the data: a Werewolf, the first `toggle` panel, a catalog weapon, a catalog armor).
   - `.main-combat`'s direct children, in order: the heading, the Pain line when hurt, movement, the conditions note, the arms block, the skills block.
   - The arms block holds the form switch, the weapons table and the armor. The skills block holds the Combat skills heading, the skill table and `[data-untrainedfold]`.
   - `.main-grid`'s children are still `main-combat`, `main-stats`.
2. Same file: **"Decision N: the stylesheet lays out the band from 1,100px of Main"**. Read `shadows.css`, as E2b's example 5 did, since jsdom has no layout. `.main-grid` is an inline-size container; a `@container (min-width:1100px)` rule spans both sections, makes `.main-combat` two columns, and puts a sphere's cards in a row. This is a structure guard; example 10 is the proof.
3. Same file: **"Decision N: with no form, weapon or armor there's no arms block, and the skills take the band"**. A locked character with a trained combat skill and nothing carried: no arms block, and the skills block is present.
4. Same file: **"Decision N+1: a named own spell reads as a line, in full, with Link to the book on it"**.
   - Build an Arcanist with three own rows from the data: the `grimoire` panel's `columns`, one row named after a book spell (from `D.spells`, found by search, not named), one with a 200-character Effect, one with Overflow and Notes.
   - The Grimoire has no `[data-cell]`.
   - Each line's text contains its name, its discipline, "TN", "TH", and the whole Effect.
   - The long one isn't cut off: the line's text equals the stored string.
   - Overflow and Notes appear only on the spell that has them.
   - `[data-spelllink]` is on the matching line only.
5. Same file: **"Decision N+1: Edit opens one spell and Done folds it, and neither writes"**.
   - Press Edit on the second spell. Its fields appear with the stored values, the other two are still lines, and focus is on its name field.
   - The character's JSON is unchanged, and the Activity Log has no new entry.
   - Type into its Effect: it's stored, as today.
   - Done: the line shows the new Effect, and focus is on its Edit.
6. Same file: **"Decision N+1: Add your own opens a nameless spell with focus in its name; a reload and an undo fold every named one"**.
   - Add your own: a new open spell is last, focus is in its name field, and its Done is hidden. Type a name: Done shows, and it stays open.
   - Open a second, named one, then undo the add. Every named spell is a line.
   - Reload the sheet (`openEntry` in the same page, not a fresh boot: E2b's vacuous test): every named spell is a line, and the nameless one is open.
7. Same file, the existing **Link to the book** test (`:25`): it presses `[data-spelllink="0"]` on a line, not in a table cell. It must still pass unchanged. If it doesn't, the button moved out of reach.
8. `smoke-table-sheet.test.mjs`: **"Decision N+1: the seat sheet reads an own spell whole, and its Edit is dead"**.
   - The file's `arcanist()` fixture holds one book spell and no own one, so push an own row onto its `panelData.grimoire` in this test, rather than changing the fixture other tests share.
   - On the seat sheet's Character tab, the own spell is a line, with no `[data-cell]`.
   - Edit and ✕ are disabled. Decision 256's "no writer is enabled" check holds.
9. `smoke-table-sheet.test.mjs`: **"Decision N: the seat sheet's Main has the same blocks as the player's"**. On the seat sheet's Main, `.main-combat` has the arms and skills blocks, and the fold still opens.
10. **In Chromium** (`phone-check` gains this as a check, so it runs every time):
    - **1280×860, unpinned:** the arms and skills blocks' tops are within 1px of each other, and `.main-stats`' top is below both blocks' bottoms.
    - **1280×860, pinned:** `.main-stats` is beside `.main-combat` (their tops within 1px), as today.
    - **Just under the threshold, unpinned:** as today. Find the screen width where Main measures 1,099px (about 1,174px, since Main is the screen less 75px at 1280), and check there; then check 2px wider, where the band shows. Take both widths from a measure, not from this order.
    - Mutation: drop the container rule. The 1280 check fails.

## 11. Tests beyond the examples

- **Measure** §1's table for the build, the same way, in the same preview session as a `main` checkout. Put it in the PR, with 1600×900 unpinned and pinned.
- **No stored state moved:** a character's JSON is byte-identical before and after Edit and Done (example 5), and the Activity Log has no entry for either.
- **`phone-check`:** the phone's `sheet: main` frames are unchanged. A phone never gets the band.
- **Voice:** `voice.test.mjs` passes on "Overflow:".
- **Mutation tests**, each against the built code:
  - Draw the skills block inside the arms block: example 1 fails.
  - Drop the arms block when it has content: example 1 fails.
  - Draw an empty arms block: example 3 fails.
  - Drop the `@container` rule: examples 2 and 10 fail.
  - Make the container query read the screen (`@media`): example 10's pinned case fails.
  - Draw own spells always open (`loOpen` returns true): examples 4 and 6 fail.
  - Fold a nameless spell: example 6 fails.
  - Write on Edit (commit instead of view state): example 5 fails.
  - Cut the Effect at a length (`.slice(0, 80)`): example 4 fails.
  - Drop focus on Edit: example 5 fails.
- **Check each for a second path** that already covers the line.

## 12. Steps

1. **The examples as failing tests.** Write examples 1–9, and example 10's `phone-check` rows, then run `npm run test:fast`.
2. **N: the band.** Wrap the two blocks in `renderShMain`, then the container rule in `shadows.css`. Run `npm run verify`.
3. **N+1: the Grimoire.** The line, the form, Edit and Done with `loOpen`, and Add your own's focus. Run `npm run verify`.
4. **The decisions and the mark (§3)**, with their INDEX lines.
5. **In the dev preview, with all five TestCharacters, at 1280×860 (unpinned and pinned), 1600×900 (unpinned and pinned), just under the threshold (example 10) and 375×812, in both the dark and the light theme:**
   - Main;
   - Wren's Character tab, with her Grimoire read, one spell open, and a new one added;
   - GM mode's seat sheet (Dead Air) on Main and on Character.

   Put the **screenshots in the PR**: 1280 Main for Dax and Wren, unpinned and pinned; 1600 Main for one character; Wren's Grimoire read and open, in both themes; and the seat sheet's Main at 1300.
6. **`npm run phone-check`.** Re-record the frame fixture only if the frames §13 names moved.
7. **The mutation tests (§11).**
8. **After the last change of any kind, the full `npm run verify` again, and say so in the PR.** (E2b's builder didn't re-run it after its last trim.)
9. **Close-out (§14).**

## 13. Stop and ask

**Stop if:**
- §1's span or Main's height comes more than 10px over the prototype's for any TestCharacter at 1280×860.
- L2 fails: the seat sheet's Main lays out differently from the player's at the same screen. Report both widths, and don't special-case the seat sheet.
- An own spell's fields can't keep their `data-cell` keys, so the generic binder would need a Grimoire branch.
- A test you didn't expect reads an own spell's input outside the Grimoire (the print, a popover, the wizard).

**Not a stop.**
- **The prototype's `npm test` at `bbff2a4`**, with the two blocks and the container rule, **passed 1,792 of 1,792**. No existing test reads Main's layout, and the blocks sit inside `.main-combat`. So the band has no expected test break, and every test of it is new (§10).
- **Its `npm run phone-check` passed every check but the frame fixture**, L2 included (read-only 696+514 against the player's own 696+514 at 1300). The six frames that moved are all `sheet: main`, at 390, 768, 1300 and 1980, pinned and not: re-record for those. At 390 and 768, only the hash moved (two more boxes, the same positions). Any other frame that moves is a stop.
- **The Grimoire's expected breaks** are the tests that read `[data-cell="grimoire|…"]` or `table.edit` inside the Grimoire. Grep finds none, because every `[data-cell]` test reads weapons or gear. A `sheet: character` frame moves only if the fixture's character has an own spell; if it does, that frame is expected too.
- **The app version literals** the patch bump moves.

## 14. Close-out

- **`close-the-session`, for *Rule or shape*:**
  - N and N+1 from §3, with *Built* filled in, PR number and measured figures included, never placeholders (E2b's nit);
  - 165's mark, and its INDEX line;
  - the app patch bump;
  - STATE rewritten where E3 stands (E3 built; E6 is unblocked);
  - a log entry;
  - a `shipped.md` row with the PR number.
  - In the plan's §3, the E3 row links this order and reads "E3 built".
- **CHANGELOG** (player voice, for the voice pass):
  - "On a wide screen, Main lays the fight out side by side: your weapons and armor next to your combat skills, with your stats in one row underneath."
  - "Spells you wrote yourself read like the book's, in full. **Edit** opens one, and **Done** puts it back."
- **PR title:** `feat(sheet): a wide Main reads across, and your own spells read like the book's (E3, Decisions N–N+1)`.
- **PR body:**
  - the template's sections;
  - every new string as it renders, for the voice pass;
  - §1's figures, measured;
  - **Where the order didn't fit**;
  - the screenshots (§12 step 5);
  - and a line saying the full suite was run after the last change.
- **Review checklist:**
  - Re-do §5's sweep by grepping for readers: `main-combat`, `main-grid`, `main-stats`, `statgroup`, `grimoireHtml(`, `data-spelllink`, `data-spellown`, `data-cell`, `loOpen(`, `RO_READERS`.
  - In Chromium, 1280×860 unpinned and pinned, 1600 both ways, one pixel under the threshold, and 375: the band shows exactly when Main is 1,100px or wider. Check it on the seat sheet too.
  - Every TestCharacter's Main at 1280: weapons and combat skills sit side by side, Stats is one row, and nothing overflows sideways.
  - Wren's Grimoire, in both themes: three lines, nothing cut off, Link to the book on one line, Edit/Done, Add your own, an undo, a reload.
  - GM mode's seat sheet: own spells read whole; nothing that writes is enabled.
  - Re-run §11's mutations.
  - Run `npm run verify` on the PR's head yourself.

## 15. Handing it over

The builder and reviewer prompts are in `docs/WORK-ORDERS.md`, with this order's path. This order's traps:
- **The pinned panel narrows Main.** Decide by Main's width (a container query), never by the screen's. At 1280 pinned, Main is 905px.
- **Don't split `.main-combat`.** Thirty-four lines in three test files find a weapon, a reload or a skill row under it. Wrap the two blocks inside it.
- **jsdom can't see a layout.** Examples 1–3 pin the structure and the rule. Only example 10, in Chromium, proves the band. Run it before you claim the layout.
- **W70 is the pattern.** `loOpen` and its `WeakSet`. Don't write a second one for the Grimoire, and don't store an open flag on the row: that would write view state into the character file (constraint 7).
- **The name is the panel's first column**, from the data, not the string "Spell Name".
- **A blank column draws nothing.** An own spell typed with only a name must not read "· TN  / TH ".
- **Measure the way §1 did**, in the same preview session for before and after.
- **Re-run the full suite after the last change**, and take the light-theme and seat-sheet screenshots. E2b's builder skipped both.
- **Mount the private repo** with `git submodule update --init private` in a fresh worktree before the suite.
