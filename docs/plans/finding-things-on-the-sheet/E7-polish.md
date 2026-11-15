# Work order E7 — Polish, then measure

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), session E7, the plan's last. The plan gave it:
- `/impeccable polish`, then `/impeccable critique load full character sheets at tests/TestCharacters`;
- the dashed weapon-tag underlines on the Tekko-Kagi and the Autobaton, "and anything left over";
- the re-run critique, scored against the 26/40 snapshot, with its trend line in the plan's closing entry.

The conductor added three asks:
- collect everything the earlier orders left to E7, from their sweeps and from their PRs' *Where the order didn't fit*;
- ask about `/impeccable audit`, which E4's EQ51 left for E7;
- plan the close of the whole plan.

**Status:** drafted 2026-11-14 by the Opus session that reviewed E6, at the conductor's request. Questions EQ58–EQ66 are for Ken (§4). Not yet approved.
**Branch:** the builder's own, cut from `main` once this order has merged.
**Runs beside:** nothing. It comes after every other session (§3 of the plan). Nothing else is open on `shadows.css` or `sheet.js`.
**Impeccable:** `/impeccable polish`. The pre-flight below is that pass's analysis: done by hand in the dev preview, with the measurements given. The builder doesn't run it again. `/impeccable critique` runs at the end (EQ65).

**Pre-flight:**
- **The commit is `351c674`**: `main` after #344 (E6).
  - App 0.69.2 is under `[Unreleased]`, and it isn't released yet.
  - Game data is 0.54. The last decision is 287, the last EQ is 57, and the next free W is W159.
- **How it was run:**
  - In the dev preview (`shadows-dev-preview`), with the five TestCharacters from Ken's main checkout (Dax, Juno, Kade, Sigrun and Wren, copied into the worktree and seeded into the roster).
  - At 375×812 with touch, 768×1024 and 1280×860, in dark, and light where it matters (colour or underline).
  - Every sheet tab, with every `<details>` opened, read by script for each character: page `scrollWidth` against `clientWidth`, elements past the right edge, clipped text, and short text on two lines.
  - GM mode's seat sheet on Dead Air (`samples/`): all five seats, every tab, at 375. Its Reference tab with every fold open.
- **What it found, in order of weight:**
  1. **Main's weapons table pushes the page sideways on a phone. This is a regression from E6, and it isn't released yet.**
     - Juno and Wren hold "Cheapshot". At 375 their Main scrolls 1px sideways, at 390 by 2.5px. Mara's seat sheet in GM mode does the same.
     - The cause: `.main-grid` is `grid-template-columns:1fr` below 900px (`shadows.css:1081`). Its one track grows to the weapons table's min-content, which is 360.5px against a 343px column: Weapon 100, Attack 91, Dmg 44, RoF 44 and Cap. 83, each with 10px padding a side.
     - E6's `.atk{white-space:nowrap}` added about 50px to Attack's min-content. Before E6 the table fitted.
     - `phone-check` missed it. Its E6 floor character holds the SG-88 and a combat knife, whose names are shorter. E6's review missed it too: the reviewer probed Dax, whose weapons have no ammo column.
     - **Prototyped:** 6px side padding on Main's weapons table below 640px. Wren, Juno, Dax and Kade all fit at 343, with no page overflow and every attack on one line. EQ58, EQ59.
  2. **The tag underline floats under the word** (the plan's Tekko-Kagi and Autobaton item).
     - A weapon's `.tag` draws its dotted line as `border-bottom` (`shadows.css:360`). Inside `.tags` it's an `inline-flex` box with `min-height:24px` (`:1335`), or 44px on touch (`:1348`), so the line sits at the bottom of that box. That's 6px under the text at 1280 and about 16px at 375 with touch: a dashed rule floating under the chip, not an underline.
     - E8's `.term` already solved this with `text-decoration:underline dotted; text-underline-offset:.18em` (`:366`). The log entry for E8 says why: a border underline grows every line by 1px, where `text-decoration` doesn't.
     - **Prototyped:** the same on `.tag`. The dots sit under "AP" and "Conceal" at both widths. EQ60.
  3. **E4's leftovers:**
     - `.ref td.bd .trait-part` is green whatever its sign (`shadows.css:1708`, written at `sheet.js:362`). It's latent: no negative part is reachable from today's data. The sheet's own pair, `.mod.pos` / `.mod.neg` (`shadows.css:230`: green and `--magenta-text`), is the fix, with no new colour.
     - The pickers have a `btn sm primary` on every row:
       - the catalog's Buy (`:1976`);
       - Raise a Stat or Skill (`:3190`);
       - Buy with IP (`:3349`);
       - Add an Advantage, Disadvantage or power (`:3520`);
       - Train (`:3575`).
       
       That's a list of peers each shouting, which E4 (EQ48) fixed for Progression's spend row. EQ61. Add a Condition's `btn sm primary` (`sheet.js:68`) isn't a row: it's the one action beside Cancel once a body part is picked, so it stays.
  4. **E6's leftovers, re-measured:**
     - **Main's TAG number breaks over two lines beside the barcode** at 375 (`span.intake-no`, 89px wide: "TAG-SERS-" / "5VDS-4TQR"). Still true. EQ62.
     - **Skills' "+1 IP ?" wraps.** It no longer reproduces: at 375 and 768, Wren's "Handguns +1 IP ?" is one line. Nothing to do.
     - **A weapon's tag chips wrap one to a line** ("Paired" alone under "AP Conceal"). With item 1's padding, Dax's three chips sit on one line at 375. Nothing more to do.
     - **Trackers' Health Level track puts a Pain band on its own line** (Wren: "Pain 2", one cell). Bands wrap whole and never split, and that's the One-Line Frame Rule working. EQ63.
     - **The vitals grid leaves empty cells:**
       - at 768: five tracks, so seven cards leave three empty;
       - at 1280: eight tracks of 142px, so seven cards leave one.
       
       Filling the row changes the cards' widths and heights at 1280, which is E3's revisit condition. EQ64.
  5. **W158** (GM mode's Reference wraps its sentences on a phone) is on the wishlist from E6's review.
     - E6 gave the sheet's reference `.ref-body .ref-frame table.ref{width:100%}`. GM's Reference keeps `max-content` below 640, so its *Checks* panel is 1387px wide at 375.
     - **Prototyped:** one base rule, `.ref-frame table.ref{… width:100% …}`, which makes both of E6's overrides redundant. *Checks* drops to 391px (it scrolls 48px inside its frame), and every other panel fits at 343. EQ66.
  6. **E1b's leftover** ("a GM's read-only view of a player sheet reads Choose on a disabled button"). `drawReadOnly` disables every button (`gm.js:4412`), so an owed Choose shows disabled. None of Dead Air's seats owes a pick, so it isn't visible on the sample. It's GM mode's own view, outside E7 (§7). It stays a known item, and nothing is added.
  7. **The light theme's fold**, where gold, magenta and violet are one colour (E4's sweep), is a palette question for Ken and Deighton. It's not E7's (§7).
- **Checked, and it holds:**
  - no other page overflow on any tab, character or seat at 375 or 768, with every fold open;
  - no clipped text;
  - every attack on one line;
  - the alone CRANK card at 64px;
  - Progression's spend grid;
  - the long name whole in Main's title;
  - the Magic reference frames at `main`'s widths.
- **Ledger search.** I searched §4's Touches lines and text by name for: `tag`, `.tags`, underline, `term`, `trait-part`, `traitParts`, `mod.neg`, `primary`, picker, `btn sm`, Raise, Train, Add, catalog, `main-grid`, weapons table, Attack, `atk`, `ref-frame`, Reference, `max-content`, `intake-no`, TAG, barcode, `cond-grid`, vitals, Pain band, `hl-band`.
  - **Cited, and they stand:**
    - **139** (the tip primitive a `.tag` opens): unchanged, only the underline's drawing changes.
    - **287** (`.term`'s look, which `.tag` adopts): unchanged.
    - **159** (Progression's buttons open modals) and **E4's EQ48** (peers aren't primary): EQ61 extends the second to the pickers' rows.
    - **165** (the sheet gives a phone to play): stands.
    - **207, 209** (GM's Reference and its frames): EQ66 changes only the table's width inside the frame, which 207 says "scrolls inside its own frame, never the page". That stays true.
    - **214, 239** (the alone card): untouched.
    - **140** (the header) and **E3's revisit condition**: untouched on the defaults (EQ64's default leaves the grid).
  - **Superseded: none,** on the defaults. EQ64's Alternative would reopen E3's columns, which is a separate question.
- **Search for tests that read what E7 touches:**
  - **`.tag`:** `smoke-sheet-skills:662–719` click `.tag[data-term]` by class (unchanged).
  - **`primary` in a picker:** no test reads it. `smoke-sheet-progression:841` reads only `.raise-row` (E4's, unchanged), and `build.test.mjs:209` (W7) reads `.btn.primary`'s own rule.
  - **`.trait-part`:** no reader in a test.
  - **The weapons table:** `smoke-sheet-archetypes:505`, `:510` and `:648` read `.main-combat table.ref tbody tr` by text, which a class added to the table keeps.
  - **The E6 tests:** E6 8 (`build.test.mjs`) asserts that GM's `.ref-frame table.ref` keeps `max-content`. EQ66's default rewrites it (§13, *expected*). `phone-check`'s E6 "strips" guard reads `#main .ref-body .ref-frame`, and EQ66 widens it to every `.ref-frame`.
  - **The prototype's own suite run** is in §13: every break it names is listed there.

**Carried over** (E3's, E4's, E5's, E6's and E8's reviews):
- **The order's E6 miss, the reason for item 1:** a floor character must hold the case that breaks. A fixture that passes because it's easy proves nothing. E7's weapons floor uses Cheapshot, with its state asserted (long name, ammo, two-digit attack).
- **No test reads computed CSS.**
  - CSS changes are whole lines, never a substring replace.
  - Every rule E7 adds or edits is pinned by a `build.test.mjs` test that parses the stylesheet the way E4's and E6's do.
  - The preview check reads `getComputedStyle` for each changed rule *and* its neighbours (§12 step 5), at 375, 768 and 1280, **in both themes** wherever a colour or an underline changes.
- **Examples are written first, run red on `main`, and each failure is quoted in the PR.**
- **Fixtures assert their state before the test uses them:**
  - a Cheapshot holder whose table is too wide on `main`;
  - a weapon with at least two tags that open a tip;
  - a trait part with a negative amount, built in the test since the data has none;
  - each picker open with at least two rows.
- **The seat sheet is checked in the browser**, not only in jsdom: Mara's Main, Juno's Character, and GM's Reference.
- **Screenshots can't be attached.** The preview check goes in the PR body as text: what was loaded, at what size, and what was read.
- **The frames that may move are listed exactly, at every width** (§13). That list comes from running the prototype through `phone-check`, not from reading the CSS. **A class-only change to a frame's `deep` hash counts as a move.** E6 listed five frames and moved twelve.
- **Contrast holds wherever E7 changes a colour (EQ51's bars).** The `.trait-part.neg` colour is `--magenta-text` on the breakdown cell: text needs 4.5:1, in both themes.
- **In a worktree, run `git status` after every pull or checkout.** In four sessions so far, the index or the files have come back stale (E4's, E6's builder and reviewer, and this pre-flight's checkout). The fix that worked each time was `git restore --source=HEAD --staged --worktree <the files>`, after checking `git diff HEAD` to make sure they weren't your own edits. Put an *Observations* line in the PR if it happens again.
- **Colour and voice picks go to Ken through the conductor.** E7's defaults pick no new colour and add no string.

---

## 1. Goal and Done when

**Goal:** the running sheet reads as finished, on a phone and at a desk. Nothing pushes the page sideways, a tag's underline sits under its word, peers in a list look like peers, and a sign reads in the colour of its sign. Then the pass is measured against where it started.

**Done when:**
- **Main's weapons table fits** (EQ58, EQ59). On every character and seat sheet, at 375 and 390, Main's `scrollWidth` equals its `clientWidth`, with every attack still on one line. `phone-check` holds it with a Cheapshot holder.
- **A tag's underline is an underline** (EQ60). Wherever a `.tag` opens a tip (Main, Loadout, the catalog, the Grimoire's spell tags, the wizard's gear, GM mode's encounter and pack tags), its dotted line is a `text-decoration`, `text-underline-offset:.18em` below the word, as `.term` is. A `.tag.plain` has none. Hover and focus still turn it cyan.
- **A trait part reads its sign:** a positive part is green and a negative one `--magenta-text`, as `.mod.pos` and `.mod.neg` are.
- **The pickers' rows are peers** (EQ61). Every row's action (Buy, Raise, IP buy, Add, Train) is a plain `btn sm`. A disabled row still reads disabled, and each modal's foot keeps its own buttons.
- **The TAG number** (EQ62's default): it doesn't break inside itself at 375. It wraps whole below the barcode, or sits on one line beside it.
- **GM's Reference** (EQ66's default, W158): no Reference table is wider than its frame when it would fit there, at any width. *Checks* scrolls only by what its columns need.
- **The neighbours are unchanged,** read by `getComputedStyle`:
  - Loadout's weapons table (in `.lo-scroll`);
  - the combat skills table under Main's weapons;
  - `.term`;
  - `.tag.plain`;
  - the modal foot's buttons;
  - `.mod.pos` / `.mod.neg`;
  - the barcode;
  - the sheet's Magic reference frames;
  - Progression's spend row.
- **The critique is re-run** (EQ65) on the merged build and recorded: the score, each heuristic beside the 26/40 snapshot's, and the trend line in the plan's closing entry. It's a record, not a gate.
- **The plan closes** (§14): its status, its §3 row, STATE §3, INDEX §1, and a log entry with the trend line.
- `npm run verify` and `npm run phone-check` pass. The frame fixture moves only as §13 lists.

## 2. Tier, versions, numbers

- **Tier: *Fix*,** on the defaults. It covers CSS, a class hook or two, the pickers' button class, and `phone-check`'s floors. No rule, data shape or engine reader moves.
- **Versions:**
  - **App: patch.** `npm run bump` moves `[Unreleased]` from whatever it reads at build (0.69.2 now) to the next patch.
    - If EQ58's default holds, 0.69.2 is never released on its own: E7's patch carries E6's lines too. The release can still happen either way.
  - **Game data: unchanged** (Decision 68).
  - **Schemas: unchanged.**
- **Numbers:**
  - No decision and no flag on the defaults.
  - EQ58–EQ66 are this order's questions.
  - If EQ66's default holds, W158 is granted (`WISHLIST.md`'s header rule). No new W number is taken.

## 3. Decisions

None on the defaults.
- EQ64's Alternative (fill the vitals row) would change card heights at 1280. That's E3's revisit condition, so it would come back to Ken as E3's question, not as a decision here.
- EQ62's Alternative B (drop the TAG number beside the barcode on a phone) would move where information lives, which is *Rule or shape*.

## 4. Questions for Ken

Each has a default, and my recommendation is the default unless it says otherwise. A question Ken leaves blank is answered "Default".

- **EQ58 — Main's weapons table overflows on a phone, from E6, and 0.69.2 isn't released.**
  - **Default: E7 takes it first, and 0.69.2 isn't released before E7 merges.** It's a 1–2.5px sideways scroll on Main for anyone holding a long-named gun with ammo (Juno, Wren, Mara's seat). Small to see, but it's the exact break E6 set out to remove, so releasing 0.69.2 alone ships it.
  - *Alternative A:* a one-line Fix now, as its own PR before E7, so 0.69.2 can be released. That's the same rule and the same floor, just sooner.
  - *Alternative B:* release 0.69.2 as is, and E7 fixes it in its patch.
- **EQ59 — How the weapons table fits.**
  - **Default: 6px side padding on Main's weapons table cells below 640px** (10px today), on a class hook on that table only (`table.ref.wpn`, for example). Prototyped: Weapon goes 100→92, Attack 91→83, Dmg and RoF 44→36, Cap. 83→97. The table is 343px with row heights unchanged. Dax's Tekko-Kagi row gets shorter, because its tags fit on one line.
  - *Alternative A:* let the weapon's name break anywhere (`overflow-wrap:anywhere`). "Cheapshot" would break mid-word, which is worse.
  - *Alternative B:* put Main's weapons table in a sideways scroller, as Loadout's is. That hides Cap. off-screen on Main, which is the one table a player reads in a fight.
- **EQ60 — The tag's underline.**
  - **Default: every `.tag` draws its dotted line as `.term` does** (`text-decoration:underline dotted; text-underline-offset:.18em`, with no `border-bottom`), everywhere a `.tag` renders: the sheet, the wizard, GM mode's encounters and packs. One look for "a word that opens its rule". GM's inline tags (no `min-height`) lose 1px of height and look the same otherwise.
  - *Alternative:* only `.tags .tag`, the weapon and spell chips, where the tall box is what floats the line. GM's tags keep the border.
- **EQ61 — The pickers' row buttons.**
  - **Default: every row's action is a plain `btn sm`,** not `primary`, in the five pickers (§5). It's E4's EQ48 reasoning, applied to the lists: rows are peers, and the violet fill is for the one action a screen asks of you. The IP restore buttons (`sheet.js:3406`, `:3411`) and Add a Condition's Add (`:68`) aren't rows of a list. Each is its box's one action, so they keep `primary`.
  - *Alternative:* leave them. E4 called them "a list of peers again, but inside a modal".
- **EQ62 — Main's TAG number beside the barcode, at 375.**
  - **Default: the number doesn't break inside itself.** When it doesn't fit beside the barcode it goes whole onto the next line: `white-space:nowrap` on `.intake-no` **and** `flex-wrap:wrap` on `.intake`. Nothing is removed.
    - Prototyped at 375 on Dax: the number is one line under the barcode, and `.intake` is 48px tall (36 today). At 1280 the pair already fits, so nothing moves.
    - **`nowrap` alone is wrong:** it pushes the page 44px sideways (the number is 149px, beside a 244px barcode in 343).
    - `.intake` is also drawn on the wizard's Review step (`wizard.js:813`, `intakeHtml`), so its frames move too (§13).
  - *Alternative A:* shrink the barcode on a phone so both fit on one line. That's a size change, so it needs a contrast and legibility read.
  - *Alternative B:* hide the number on a phone and keep only the barcode. That moves information, so it's *Rule or shape*. Not recommended.
- **EQ63 — A Pain band alone on its line in Trackers' Health Levels.**
  - **Default: leave it.** A band wraps whole and never splits. That's the One-Line Frame Rule doing its job, and a band alone on its line still reads as its band.
  - *Alternative:* wrap a band's cells inside it instead, so it packs denser. Not recommended: a band split across lines is exactly what the rule forbids.
- **EQ64 — The vitals grid's empty cells at 768 (three) and 1280 (one).**
  - **Default: leave it,** and add a wish (W159).
    - Filling the row changes every card's width at 1280, and so its height. That's E3's revisit condition for Main's columns, and E3 measured the balance it keeps.
    - At 768 it's a tablet look, not a break.
  - *Alternative:* E7 makes the grid fill its row (for example `auto-fill` → `auto-fit` with a max). It would come back to Ken as E3's revisit, measured at 1280×860.
- **EQ65 — Who runs the closing critique, and where it's recorded.**
  - **Default: the reviewer runs it**, on the PR's head once nothing must-fix or should-fix is left, before "Ready to merge".
    - The target is the same as the snapshot's: `load full character sheets at tests/TestCharacters`, at 1280 and 375.
    - It saves the snapshot to `.impeccable/critique/` and posts the score table, each heuristic beside the 26/40 snapshot's, as a PR comment.
    - The builder copies the trend line into the plan's closing entry in a last commit.
    - It's a record, never a gate: a lower score doesn't hold the merge, it becomes wishes.
    - The reviewer is a fresh Opus session that hasn't built the pass. That's the point of a critique.
  - *Alternative:* the builder runs it at the end. It's cheaper, but it scores its own work.
- **EQ66 — W158, GM's Reference tables on a phone.**
  - **Default: E7 takes it.** One base rule, `.ref-frame table.ref{min-width:100%; width:100%; max-width:none}`, replaces `max-content`. E6's two overrides then say nothing, and are deleted as whole lines:
    - `.ref-body .ref-frame table.ref{width:100%}`;
    - `@media (min-width:640px){ .ref-frame table.ref{width:100%} }`.
    
    Prototyped: *Checks* 1387→391px, and every other GM panel and the sheet's Magic reference unchanged at 343. W158 moves to `log/wishes-granted.md`.
  - *Alternative:* leave W158 on the wishlist. It's GM mode's screen, and the plan is the running sheet's.
- **On `/impeccable audit`** (EQ51 left it for E7): this isn't a separate number, it's EQ65's twin. **Default: its own session after E7,** as a read-only report.
  - The audit covers the whole app, a11y, performance and theming: the wizard, GM mode and print, not just the running sheet.
  - Its findings would be a new backlog, not polish on this one.
  - Ken triages the report into wishes or a new plan. E7 stays the sheet's.
  
  *Alternative:* inside E7, after the polish. Not recommended: it would double E7's size and mix a measure of this pass with a survey of everything.

## 5. The assumption sweep

Each row was found by grepping the selector or the function. Line numbers are at `351c674`.

| What | True today | Where | True after |
|---|---|---|---|
| Main's weapons table | `<table class="ref">` with Weapon, Attack, Dmg, RoF, Cap.; cells `padding:6px 10px` (`table.ref td`) | `sheet.js:475`; `shadows.css:283–285` | A class hook on this table; 6px side padding below 640 (EQ59) |
| Its grid | `.main-grid{grid-template-columns:1fr}` below 900; the track grows to the table's min-content | `shadows.css:1075`, `:1081` | Unchanged; the table's min-content fits |
| Its other readers | Seat sheet (same renderer, `gm.js` `drawReadOnly`); tests read rows by text | `smoke-sheet-archetypes:505`, `:510`, `:648`; `smoke-sheet-play:406`, `:1686` | Unchanged (a class added) |
| Loadout's weapons table | `.lo-weapons` in `.lo-scroll`, scrolls sideways on purpose | `sheet.js:2296–2311` | **Unchanged** (not the hook) |
| `.atk` | `white-space:nowrap` (E6) | `shadows.css:287` | Unchanged |
| `.tag` | `border-bottom:1px dotted var(--dim)`; hover `border-bottom-color` cyan; `.plain` no border | `shadows.css:359–364` | `text-decoration:underline dotted`, `text-underline-offset:.18em`; `.plain` `text-decoration:none`; hover cyan (EQ60) |
| `.tags .tag` | `inline-flex`, `min-height:24px` (44 on touch) | `shadows.css:1335`, `:1348` | Unchanged (the touch floor stays) |
| `.tag` writers | `tagChipsHtml` (sheet, wizard, seat) | `shared.js:606`; `sheet.js:482`, `:1972`, `:2521`; `wizard.js:469` | Unchanged markup |
| `.tag` in GM mode | Pack records, Pain level, Conditions, encounter traits, Surprise/Ambush/Wave tips, `.enc-now`, `.enc-tied`, `.cast-meta .tag` | `gm.js:3144`, `:3448`, `:3461`, `:3484`, `:3555`, `:3639`, `:3688`, `:3871`, `:3946–3965`; `shadows.css:1449`, `:1518` | Underline drawn as `.term`'s (EQ60 default); `.plain` ones unchanged |
| `.term` | The pattern E7 copies | `shadows.css:366–372` | **Unchanged** |
| Tests on `.tag` | Click `.tag[data-term]` | `smoke-sheet-skills:662–719` | Unchanged |
| `.trait-part` | One class, green | `sheet.js:362`; `shadows.css:1708` | Class by sign (`pos`/`neg`); colours from `.mod.pos`/`.mod.neg` (`:230`) |
| Picker rows | `btn sm primary` | `sheet.js:1976` (catalog Buy), `:3190` (Raise), `:3349` (IP buy), `:3520` (Add pick), `:3575` (Train) | `btn sm` (EQ61) |
| One-action buttons | `btn sm primary`, one per box | `sheet.js:68` (a Condition's Add, beside Cancel), `:3406`, `:3411` (IP restore) | **Unchanged** |
| `.btn.primary` | W7's contrast rule | `build.test.mjs:209` | Unchanged |
| The TAG number | `span.intake-no` beside the barcode in `.intake` (flex, no wrap) | `shared.js:997` `intakeHtml`, drawn by `sheetHeader` and the wizard's Review (`wizard.js:813`); `shadows.css:306–309`; `smoke-roster:404` reads its text | `.intake` wraps, `.intake-no` doesn't break (EQ62); text unchanged |
| `.ref-frame table.ref` | `width:max-content` below 640; `100%` from 640 (`@media`); the sheet's `.ref-body` override (E6 review) | `shadows.css:1661`, `:1666`, `:1668` | One rule, `width:100%`; the two overrides deleted (EQ66) |
| `.ref-frame` writers | GM's `refPartHtml`; the sheet's `refFrame` | `gm.js:936`; `sheet.js:742` | Unchanged markup |
| E6 8 | Asserts the sheet's override and GM's `max-content` | `build.test.mjs` (E6 block) | Rewritten: the base rule is `100%` (§13, expected) |
| `phone-check` "strips" | Reads `#main .ref-body .ref-frame table.ref` | `tools/phone-check.mjs` (E6 review) | Reads every `.ref-frame table.ref` (GM's Reference screen included) |
| `phone-check`'s E6 floor | `floorChar()`: a Werewolf with the SG-88 and a combat knife | `tools/phone-check.mjs:579–590` | Adds a Cheapshot holder, asserted, with Main's overflow measured |
| Print | `#printSheet` has its own tables; no `.tag`, `.trait-part`, `.ref-frame` or picker | `print.css` | Unchanged |

**What text points at what this changes.**
- No player copy names an underline, a button's colour or a table's width. No string is added or reworded.
- `DESIGN.md`'s Components may describe the tag's dotted underline. If it says "border", the builder updates that line (Docs, in the same PR).
- The comment at `shadows.css:1667` (E6 review: "GM's Reference … keeps max-content") becomes false under EQ66, and is deleted with its rule.
- `WISHLIST.md` W158's **Plan** line points at this order once it's approved. It's granted if EQ66's default holds.

## 6. Read first

- `CLAUDE.md`: constraints 1, 3 and 7, and *Change tiers* (*Fix*).
- `docs/SCHEMA.md` §4: Decisions 139, 165, 207, 214 and 287. E4's order, EQ48 (`E4-colour.md` §4).
- `DESIGN.md`: Components (Buttons, Chips/Tags), the One-Line Frame Rule, the One Meaning Rule.
- `src/styles/shadows.css`:
  - `table.ref` (`:281–287`);
  - `.tag` and `.term` (`:359–372`);
  - `.tags .tag` (`:1335`, `:1348`);
  - `.mod` (`:230`);
  - `.main-grid` (`:1075–1081`);
  - `.ref-frame` (`:1660–1668`);
  - `.trait-part` (`:1708`).
- `src/ui/sheet.js`:
  - Main's weapons (`:470–490`);
  - `skillRowPair` (`:355–370`);
  - the picker rows (§5);
  - `refFrame` (`:742`).
- `src/ui/shared.js:606` (`tagChipsHtml`).
- `tools/phone-check.mjs`: E6's `floorChar` and `phoneFloors`, and the open-fold "strips" read.
- `tests/build.test.mjs`: the E6 block, as the model.
- The 26/40 snapshot: `.impeccable/critique/2026-11-12T01-36-16Z__src-ui-sheet-js.md`.

## 7. Out of scope

- **GM mode's own views,** except where a shared rule reaches them (`.tag`, `.ref-frame`). E1b's disabled Choose on a read-only sheet stays where it is.
- **The light theme's palette fold** (gold, magenta and violet as one): Ken's and Deighton's.
- **The vitals grid's empty cells** (EQ64's default), and anything else that changes a skill row's or a card's height at 1280 (E3's revisit condition).
- **Any new colour, font size or token.** The trait-part's colours are `.mod`'s existing pair.
- **Any word.** No string is added or reworded.
- **`/impeccable audit`** (EQ65's twin): its own session.
- **Print** (`print.css`).
- **What any number says.**

## 8. The shapes

No data key, save-file field, engine function or schema changes. The hooks the builder may add (the tests rely on whichever it picks, named in the PR):

| Hook | On | Why |
|---|---|---|
| A class on Main's weapons table (for example `table.ref.wpn`) | `sheet.js:475` | So the phone padding reaches it and not Loadout's or the skills table |
| `pos` / `neg` on `.trait-part` | `sheet.js:362` | The sign's colour |

## 9. The UI

**What a player sees** (375, dark; the same layout in light):

| Where | Before | After |
|---|---|---|
| Main, Juno or Wren | The page scrolls 1px sideways | It doesn't. The weapons table is 343px |
| Main, Dax's Tekko-Kagi | "AP Conceal" with a dotted rule floating about 16px below, "Paired" on its own line | Dotted underlines under the words; all three chips on one line |
| Main or Skills, a trait part below 0 | Green | `--magenta-text` (latent today) |
| Any picker (Raise, Buy, Add, Train) | A violet button on every row | A plain button on every row |
| Main, the TAG number | "TAG-SERS-" / "5VDS-4TQR" beside the barcode | Whole, below or beside it |
| GM's Reference, *Checks* | 1387px wide, one sentence a line | 391px, wrapping |

**Interaction:** none changes. A tag still opens its tip on press, hover and focus. A picker's row button still does what it did, disabled where it was.

**CSS, by whole lines** (the builder writes them; this is what each must say):
- **The weapons table:** `@media (max-width:639px){ table.ref.<hook> th, table.ref.<hook> td{padding-left:6px; padding-right:6px} }`. No font size changes.
- **`.tag`:** its two-line rule (`:359–360`) is rewritten whole. The `border-bottom` goes, and `text-decoration:underline dotted; text-underline-offset:.18em` comes in. `:361` drops `border-bottom-color`, and `:363` reads `text-decoration:none`. The `font-size`, `line-height`, `color`, `white-space`, `padding` and `cursor` on the shared lines stay exactly as they are (E3's fold).
- **`.trait-part`:** `:1708` is replaced by `.pos` and `.neg` rules reading `var(--green)` and `var(--magenta-text)`.
- **`.intake` and `.intake-no`** (`shadows.css:306`, `:308`): `.intake` gains `flex-wrap:wrap`, and `.intake-no` gains `white-space:nowrap`. Each line is rewritten whole, keeping every other property. **Both, or neither:** `nowrap` alone overflows the page by 44px at 375.
- **`.ref-frame table.ref`:** `:1661` is rewritten whole with `width:100%`. `:1666` and `:1667–1668` are deleted whole.
- **No colour, font size or token changes.** No `!important`.

**For the voice pass:** no new player-facing string.

## 10. Worked examples, as named tests

Write these first, run them on `main`, and **paste each failure into the PR** (§12 step 1). An example that passes on `main` is a stop unless the PR says why. The CSS examples parse `shadows.css` the way E6's do: strip comments, split rules, match the selector exactly, and read an `@media` block by its prelude.

1. `build.test.mjs`: **"E7 1: Main's weapons table has phone padding, and Loadout's doesn't"**.
   - Inside `@media (max-width:639px)`, the hook's `td` sets `padding-left: 6px`.
   - No rule there names `.lo-weapons` or `table.ref td` bare.
   - Fails on `main`.
2. `smoke-sheet-play.test.mjs`: **"E7 2: Main's weapons table carries its hook, and Loadout's doesn't"**.
   - A locked character holding `cheapshot` (assert it's in `ch.weapons`, `weaponLine` returns an attack of two digits, and it has a capacity).
   - Main's weapons table has the hook. Loadout's `.lo-weapons` doesn't. The combat skills table doesn't.
   - Fails on `main`.
3. `build.test.mjs`: **"E7 3: a tag's underline is a text-decoration, as a term's is"**.
   - `.tag` sets `text-decoration` with `underline` and `dotted`, and `text-underline-offset`.
   - `.tag` has no `border-bottom` other than `0` or none.
   - `.tag.plain` sets `text-decoration: none`.
   - `.term`'s rule is unchanged.
   - Fails on `main`.
4. `smoke-sheet-skills.test.mjs`: **"E7 4: a trait part reads its sign"**.
   - A Skill line whose `traitParts` hold one negative and one positive amount. The data has no negative, so the test builds one (for example a cloned Advantage whose skill grant is negative, as `engine.test.mjs:10656` reads a positive one), and asserts that the negative amount reaches `breakdown.traitParts` before it reads the class.
   - The negative part has `.trait-part.neg`, the positive `.trait-part.pos`.
   - Fails on `main`.
5. `build.test.mjs`: **"E7 5: a trait part's colour is the sign's"**.
   - `.ref td.bd .trait-part.neg` reads `var(--magenta-text)` and `.pos` reads `var(--green)`.
   - No bare `.trait-part` colour rule is left.
   - Fails on `main`.
6. `smoke-sheet-progression.test.mjs`: **"E7 6: every picker's rows are peers"**.
   - Open each of the five pickers (§5) on a character that fills it with at least two rows. Assert the row count first.
   - No row button is `.primary`, and each is still `.btn.sm`.
   - The IP restore buttons, and a Condition's Add once a body part is picked, keep `.primary`.
   - Fails on `main`.
7. `smoke-sheet-archetypes.test.mjs` (or wherever Main's header is tested): **"E7 7: the TAG number never breaks inside itself"**. CSS by parse in `build.test.mjs` if the builder's fix is CSS only: `.intake-no` sets `white-space: nowrap`.
   - And `.intake` sets `flex-wrap: wrap` (without it, the `nowrap` pushes the page sideways).
   - Fails on `main`.
8. `build.test.mjs`: **"E7 8: every reference frame's table wraps to its frame"**.
   - `.ref-frame table.ref` sets `width: 100%`.
   - No rule anywhere sets `max-content` on it.
   - The two overrides are gone.
   - Fails on `main`.
   - This replaces E6 8's second assertion (§13).

## 11. Tests beyond the examples

- **`phone-check`'s new floors.** Each must fail on `main`, and the PR quotes the failure.
  - **Main fits with a long-named gun.** E6's `phoneFloors` gains a second character holding `cheapshot`, never the frame seed. Assert its state in the page: the table's name cell reads "Cheapshot" and its Cap. cell has a Reload button. At 390 and 390 with touch, Main's `scrollWidth` equals its `clientWidth`. Expected on `main`: about 2–3px over at 390.
  - **The tag's underline hugs its word.** On Main at the phone widths and at 1024, for each `.tags .tag:not(.plain)`: its computed `text-decoration-line` includes `underline` and `border-bottom-width` is `0px`. Read in the browser, because jsdom has no computed decoration. Expected on `main`: a 1px border.
  - **The strips guard covers GM's Reference.** Widen E6's read from `#main .ref-body .ref-frame` to every `.ref-frame table.ref` on the screen. Expected on `main`: red on GM's Reference at 390 (*Checks*).
- **The Read Rule** (`build.test.mjs` W43), **the touch-size floor** and **E8's inline exemption** must still pass with no new exemption. A `.tag` that loses its `border-bottom` keeps its `min-height`.
- **Contrast (EQ51's bars):** `.trait-part.neg` on the breakdown cell, in both themes, at 4.5:1 or better. The builder records the two colours and the ratio in the PR.
- **Mutation tests**, each against the built code:
  - the weapons hook dropped → example 2, and `phone-check`'s weapons floor fails at 390;
  - the padding rule moved out of the `@media` → example 1;
  - `.tag` given back its `border-bottom` → example 3, and `phone-check`'s underline floor;
  - `.trait-part` class by sign dropped → example 4;
  - one picker row left `primary` → example 6 (try each of the five once, since each is a separate site);
  - `.intake-no`'s `nowrap` dropped → example 7;
  - `.intake`'s `flex-wrap` dropped → example 7, and `phone-check`'s overflow (44px on Main at 390);
  - `max-content` restored on the base rule → example 8, and `phone-check`'s strips floor on GM's Reference.
- **Check each for a second path:** example 6 reads five sites. Make sure each site's mutation fails it on its own, not only the first picker it opens.
- **Every fixture asserts its state first** (Carried over).

## 12. Steps

1. **The examples as failing tests on `main`,** and the new `phone-check` floors run on `main`'s build. Paste each failure's name and assertion into the PR's Evidence.
2. **The renderers' hooks:** the weapons table's class, the trait-part's sign, and the five picker rows. Run `npm run verify`.
3. **The CSS,** whole lines, one rule at a time, with `npm run verify` after the group.
4. **`phone-check`'s floors** (§11). Run `npm run phone-check`.
5. **In the dev preview, recorded in the PR as text** (what was loaded, the size, the theme, and what `getComputedStyle` and the box reads returned):
   - **At 375×812 with touch, 390×844, 768×1024 and 1280×860, dark and light:**
     - Juno, Wren and Dax: Main's `scrollWidth` against `clientWidth`, the weapons table's width and its columns, and each attack's line count;
     - Dax and Kade: a weapon tag's `text-decoration`, `text-underline-offset` and `border-bottom-width`, and the gap between the text's bottom and the box's bottom;
     - the TAG number's line count;
     - each picker open: its row buttons' classes and colours.
   - **The neighbours, the same way:**
     - Loadout's weapons table (padding 10px, still in `.lo-scroll`);
     - the combat skills table;
     - a `.term` in a sentence;
     - a `.tag.plain` ("Paired");
     - a modal foot's buttons;
     - `.mod.pos` and `.mod.neg` on Main's stats;
     - the barcode's size;
     - the sheet's Magic reference frames (Wren, folds open: Domains 343, Spell tiers 343, Enchantment 538, Materials 446, Aberration 343 at 375);
     - Progression's spend row.
   - **At 1280×860, Main unchanged** (E3's revisit condition). Combat's top and the fight's bottom match `main` for Dax.
   - **GM mode** (Dead Air):
     - Mara's seat Main at 375 (no overflow);
     - Juno Park's Character with the folds open;
     - the Reference tab with every fold open at 375 (*Checks*' frame) and at 1280;
     - an encounter's Surprise and Ambush tags, and a Condition tag, in both themes.
   - **Keyboard:** Tab to a weapon tag, and its tip opens on Enter, with the focus outline showing.
6. **`npm run phone-check`,** and the frames it moved, against §13.
7. **The mutation tests** (§11).
8. **After the last change of any kind, the full `npm run verify` again,** and say so in the PR.
9. **Close-out** (§14).
10. **After review:** the reviewer runs the critique (EQ65). The builder then adds the trend line to the plan's closing entry in a last commit, and runs `npm run verify` once more.

## 13. Stop and ask

**Stop if:**
- A change needs a new colour, a font size, a token's value, or `!important`.
- The Read Rule, the touch-size floor or E8's inline exemption fails, or needs an exemption.
- A neighbour in §12 step 5 changes. That especially means Loadout's weapons table, `.term`, or the sheet's Magic reference frames.
- A frame not listed below moves, or a listed frame moves by more than its line says.
- A test you didn't expect reads one of these classes and fails.
- An example passes on `main` with no reason you can write down.
- Anything changes at 1280×860 on Main (E3's revisit condition), other than a tag's 1px.
- `.trait-part.neg` misses 4.5:1 in either theme.

**Expected, and not a stop** (re-record and list each in the PR, with what moved):
- The app version literals the patch bump moves.
- **E6 8's second assertion** (GM's `max-content`), which EQ66 rewrites. It's replaced by E7 8.
- **The frames.** Every default was prototyped at `351c674` and recorded with `npm run phone-check -- --record-fixture`. These eight moved, and nothing else (of 94):
  - **`sheet: main @390`:** `main`'s box 1843.4→1855.5px tall (+12.1), with its children and `deep`. That's the TAG number going under the barcode (EQ62). The seed holds no weapon, so the table's padding shows in no frame.
  - **`wizard: review @390`:** `main`'s box 1227.9→1204.4px (−23.5), with its children and `deep`. That's `.intake` on the Review step. It shrinks, which the pre-flight didn't explain: most likely the number was breaking over more lines in Review's block. The builder reads it in the preview at 390 on `main` and on the branch, and says the cause in the PR.
  - **`sheet: skills` @390, @768, @1300, @1300 pinned, @1980 and @1980 pinned:** `deep` only, class-only. The seed's trait parts gain `pos`. No box moves.
  - **Not moved:** every GM frame (no `.tag` and no Reference frame in them changes size), every `character` frame (the sheet's reference was already `width:100%`), and Progression.
  - If the builder's mechanism differs from the prototype's (a different hook name, say), a class-only change on these same frames is still expected. A move on any other frame is a stop.
- **A class-only `deep` hash change** on a frame listed above counts as a move, and it's listed. On any other frame it's a stop.

## 14. Close-out

This closes the plan, so it does more than a *Fix* usually does.

- **`close-the-session`, for *Fix*:**
  - a CHANGELOG line and `npm run changelog`;
  - the app patch bump;
  - a log line, because this closes a plan.
- **CHANGELOG** (player voice, for the voice pass): "**Finishing touches.** Main no longer slides sideways on a phone when you carry a long-named gun, a weapon's tags are underlined like the game's other words, the lists you buy and raise from don't shout on every row, and your TAG number stays in one piece." If EQ66 holds, add for the GM: "Reference tables wrap on a phone instead of running one sentence a line."
- **W158**, if EQ66 holds: moved whole to `log/wishes-granted.md`, with a pointer to the PR. **W159**, if EQ64 holds: "Main's vitals row fills its width at 768 and 1280", 💡, *Plan: set aside by* this order (E3's revisit condition).
- **The plan's close** (in this PR, except the trend line, which comes in the last commit after the critique):
  - `docs/plans/finding-things-on-the-sheet.md`:
    - The **Status** line reads closed, with the date, "kept as history (Ken)".
    - Its §3 E7 row links this order and reads "E7 built".
    - A **Closing entry** under §3 gives the critique's score beside the 26/40 snapshot, heuristic by heuristic, with the trend line and what's left (the wishes this pass added, W152–W159).
  - **Archive the plan** with its folder, as `powers-that-run` was: `git mv docs/plans/finding-things-on-the-sheet.md docs/plans/finding-things-on-the-sheet docs/plans/archive/`. The orders' relative links (`../finding-things-on-the-sheet.md`) still resolve, because they move together. Fix every other link to the old path:
    - `INDEX.md` §1 (the *open, Ken's usability pass* line) and the `EQ`/`E` row in §2;
    - STATE §3;
    - the decisions' INDEX lines that cite the plan;
    - the WISHLIST **Plan** lines.
    
    Grep `finding-things-on-the-sheet` across `docs/`, `src/` and `tests/`. `docs.test.mjs` checks links.
  - **STATE.md** is rewritten: §3's *Finding things on the sheet* line goes, or becomes one line saying it's closed (as the other closed plans read), and the versions line moves with the bump.
  - **`log/2026.md`:** an entry for E7 and the plan's close, with the trend line (26/40 → N/40), what moved most, and what's left as wishes.
  - **`log/shipped.md`:** E7's row.
- **PR title:** `fix(sheet): polish, then measure (E7); close finding-things`.
- **PR body:**
  - the template's sections;
  - **Evidence:**
    - each example's failure on `main`, quoted;
    - the new `phone-check` floors' failures on `main`;
    - the mutation list;
    - the preview reads (§12 step 5) as text, both themes;
    - the contrast pair;
    - `phone-check`;
    - the frames re-recorded, each with what moved;
  - **Where the order didn't fit**;
  - **Observations** (the stale-index line, if it happened);
  - a line saying the full suite ran after the last change.
- **Review checklist:**
  - **Redo §5's sweep:**
    - grep `class="tag` and `.tag` across `src/` (GM mode included) and check each renders with the new underline or none;
    - grep `btn sm primary` and check only the IP restore buttons and a Condition's Add keep it;
    - grep `.ref-frame` and `max-content`.
  - **The CSS by whole lines:** diff `shadows.css`. Check each changed line is one §9 names, and that no property on `.tag`'s shared lines was dropped (E3's fold).
  - **The neighbours by `getComputedStyle` and box reads,** at 375, 390, 768 and 1280, in both themes, as §12 step 5 lists. Don't take the PR's word for it.
  - **Main at 1280×860 is unchanged** (E3's condition).
  - **The seat sheet and GM's Reference in the browser.**
  - **Contrast:** `.trait-part.neg` in both themes, re-measured.
  - **The fixtures' state:** the Cheapshot holder really overflows on `main`; the negative trait part really reaches `traitParts`; each picker really has two or more rows.
  - **Mutations:** re-run §11's yourself.
  - **The examples and floors on `main`:** check that they fail there, in a scratch worktree with its own `npm ci`.
  - **`phone-check`'s frames:** `git diff tools/frame-fixture.json`, with only §13's frames moved.
  - **The plan's close:** the links resolve (`docs.test.mjs`), INDEX and STATE name the archive path, and nothing still calls the plan open.
  - **The suite:** `npm run verify` on the PR's head.
  - **Then the critique** (EQ65): the reviewer runs it and posts the table. That's not a gate.

## 15. Handing it over

The builder and reviewer prompts are in `docs/WORK-ORDERS.md`, with this order's path. This order's traps:
- **The weapons fix is Main's table only.** Loadout's scrolls on purpose, and the combat skills table under it is a phone card layout.
- **`.tag`'s rule shares lines with its font, colour and padding.** Rewrite the lines whole, and keep every other property (E3's fold).
- **`.tag` reaches GM mode.** Check an encounter's tags and a Condition tag in the browser, in both themes.
- **The trait-part's negative case isn't in the data.** Build it in the test, and assert it reaches `traitParts` before testing the class.
- **Five picker sites, five mutations.** One shared test can pass on the first site and miss the rest.
- **The IP restore buttons and a Condition's Add keep `primary`.** They're one action each, not rows.
- **Never change `phone-check`'s frame seed.** A floor that needs a Cheapshot brings its own character.
- **A class change moves a frame's `deep` hash.** §13 lists where that's expected, and anywhere else it's a stop.
- **CSS by whole lines,** and check the neighbours at four widths in both themes.
- **Examples and floors come first, red on `main`, quoted in the PR. Fixtures are checked for their state.**
- **The seat sheet and GM's Reference in the browser.**
- **Mount the private repo** (`git submodule update --init private`) in a fresh worktree before the suite.
- **After a `git pull` or checkout, run `git status`, and `git diff HEAD` if anything shows.** Four sessions have come back stale.
- **The critique is the reviewer's,** after the re-review, and it's never a gate.
