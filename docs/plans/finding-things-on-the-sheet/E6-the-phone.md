# Work order E6 — The phone

**Plan:** [finding-things-on-the-sheet](../finding-things-on-the-sheet.md), session E6. The plan gave E6 four things, from the 2026-11-12 critique:
- the name shows twice on Main (header and title);
- the Crank tile sits alone on its row;
- attack values (`1d10 + 22`) wrap in the weapons table;
- keep `phone-check` green, and put any new floor into it.

The conductor asked for a sweep of the running sheet at 375 for anything else that breaks, and for the order to say which of those E6 takes and which it leaves to E7 or the wishlist (§5, *The rest of the sweep*).

**Status:** drafted 2026-11-14 by the Opus session that reviewed E4, at the conductor's request. **Waiting on Ken's answers to EQ52–EQ57 (§4).**
**Branch:** the builder's own, cut from `main` once this order has merged.
**Runs beside:** E7 waits for all. E4 is merged (#341). Nothing else is open on `shadows.css`.
**Impeccable:** `/impeccable adapt the running sheet at 375px`. The pre-flight below is that pass's analysis, done by hand in the dev preview with the measurements given. The builder doesn't run it again.

**Pre-flight:**
- **The commit is `2d2f836`**: main after #341 (E4). App 0.69.1 is under `[Unreleased]`, game data 0.54, last decision 287, last EQ 51, next free W158.
- **How it was run:** the dev preview (`shadows-dev-preview`), with the five test characters (Dax, Wren, Sigrun, Kade, Juno). The long-named character was Kade renamed "Anastasia Valentina Okonkwo-Delacroix". The widths were 375×812 with touch (the pane's mobile preset), 390×844 (phone-check's width), 768×1024 and 1280×860. GM mode's seat sheet was checked on Dead Air, seeded from `samples/`. Every tab was probed with every `<details>` opened. Layout doesn't change with the theme, so the light theme was read only where E6 might change a colour (none, by default).
- **Probes on `main`** (the worked examples' "before"):
  - **The name twice (Main only).** At 375 the header's `#brandctx` reads "Dax Harlan" at y 17, and Main's `h1.step-title` reads "Dax Harlan" at y 114, above the TAG barcode and "Werewolf · Trueborn · Heroic". Every other tab's `h1` is the tab's own name ("Skills", "Trackers"…), so the doubled name is Main's alone. With the long name, the header ends in "…" ("Shadows // Anastasia Vale…") and Main's `h1` wraps to two lines (64px), the only place the name is seen whole. On the seat sheet the header reads the table's name ("Dead Air"), so GM mode doesn't double it.
  - **The CRANK card.** Dax at 375 draws seven vitals cards: Health, Pain, Sanity, Luck, SFR, Çredits and CRANK. The odd one, CRANK, carries `.alone` (`sheet.js:443`) and takes the whole row (`shadows.css:1366`, `@container (max-width:415px)`). That's 343×102px holding "CRANK · 0 · Novice", the last thing before Combat. With six cards (Kade, Wren, Juno), nothing is alone. At 768 the grid has five columns and `.alone` does nothing. At 1280 the grid is 1205px wide with eight columns, so the container query never fires.
  - **Attack values.** Main's weapons `table.ref` (`sheet.js:475`) gives Attack 84px at 375 and 390. "1d10 + 22" (`td.num`, `white-space:normal`, 13.1px mono) breaks to two lines on all five characters, and on Loadout's `lo-weapons` inside `.lo-scroll` at 375, 390 and 768. Seat sheets: Mara's "1d10 + 11" and Dex's "1d10 + 20" wrap the same way. With `white-space:nowrap` on the value (a prototype, in the page), Attack takes 91px, Weapon gives up 7px, and the table still ends at 359px: no sideways scroll. At 1280 the value is already one line.
- **What the pre-flight found that the plan didn't say:**
  - **An Arcanist's Character tab scrolls the page 179px sideways at 375 (164px at 390).** Opening the Magic reference folds "Charging and tiers" and "Materials" draws a six-column tier table 538px wide and a five-column materials table 446px wide in `.ref-body`, which doesn't scroll (`sheet.js:761`, `:765`, drawn by `referencePanelHtml`, `:804`). This hits Wren and Juno, and Juno Park's seat sheet in GM mode. `phone-check` misses it because it measures overflow with the folds closed. It opens them only for text size. GM mode's Reference tab already solves the same problem: its column tables sit in `.ref-frame` (`gm.js:936`, `shadows.css:1653–1659`), which scrolls inside itself, and it has no overflow with every fold open. That's EQ55.
  - **Progression's spend row is ragged at 375.** E4 made the spend buttons default buttons. In `.raise-row`'s wrapping flex (`shadows.css:1063`), they fall into rows of 2/1/1/1 (Kade) or 2/1/1 (Sigrun, Juno), each lone button a different width. That's EQ56.
  - **`.raise-row` has a second user.** Minor choice's modal (`sheet.js:862`) draws its options in a `.raise-row`. A rule for Progression's row must be scoped so it doesn't reach the modal.
  - **The name twice is two decisions.** Decision 140 put the name in the header's first row at every width. Decision 165 kept it in Main's title, and rejected "the name only in the header: a long name would never be seen whole on the sheet". That's EQ52.
  - **The CRANK card alone is a decision too.** Decision 214 (in part, kept by 239) says "whichever card is left alone on the last row takes the whole row". E6 can change how that row looks without changing that it takes the row. That's EQ53.
  - **E3's revisit condition** ("if E6 changes a skill row's or a card's height", for Main's columns at 1280×860) **isn't met by the defaults.** The one card height they change is the alone card's, and only inside `@container (max-width:415px)`, which doesn't fire at 1280. No skill row changes. The attack value is already one line at 1280. EQ53's and EQ56's alternatives don't change desktop heights either. If Ken picks something that does, the conductor raises E3's revisit.
- **Ledger search.** I searched §4's Touches lines and text by name for: header, brand, `#brandctx`, `ctx`, `step-title`, name, `cond-grid`, alone, CRANK, Çredits, `vital-verbs`, weapons table, Attack, `attackText`, `td.num`, `table.ref`, `ref-body`, `ref-frame`, reference panel, `REFERENCE_SECTIONS`, `.raise-row`, Raise a Stat, phone, 375, 390, `phone-check`, frame fixture.
  - **Cited, and they stand:**
    - **140:** the header is two thin rows, and a long name ends in "…". E6 keeps it (EQ52's default).
    - **165:** on a phone the sheet gives the screen to play, and Main's title keeps the name. E6 keeps it, and EQ52 doesn't reopen its rejected option.
    - **214, 239:** the card alone on its row takes the row, and CRANK shows for everyone. E6 keeps both and changes only the alone card's inner layout under 415px (EQ53).
    - **151:** Heal 1 · Hurt 1 · Take a hit sit under Health and Pain. Unchanged.
    - **100, 200, 247:** what a weapon row computes. E6 changes how the value wraps, not what it says.
    - **159:** Progression's actions are buttons that open a modal. Unchanged, except where they sit on a phone (EQ56).
    - **207, 209:** GM mode's Reference tab, whose `.ref-frame` E6 reuses. Unchanged.
  - **Superseded: none,** on the defaults. EQ52's Alternative A would supersede 140 in part and make E6 *Rule or shape* (§2).
- **Search for tests that read what E6 touches:** `.cond.alone` is read by `smoke-sheet-archetypes:279–285`, `smoke-sheet-play:1111` and `smoke-sheet-progression:159`, all by class, none by size. Weapon text "1d10 +" appears in 14 assertions (`smoke-sheet-skills` ×10, `rules` ×2, `engine` ×1, `smoke-wizard` ×1). A wrapping `<span>` leaves `textContent` unchanged, but a non-breaking space would break them (§15). `phone-check` has no reader of `.raise-row` or `.ref-body`. `engine.test.mjs:2165` checks only that the Arcanist's reference panel names real data.

**Carried over** (E3's, E4's, E5's and E8's reviews):
- **No test reads computed CSS.** CSS changes are whole lines, never a substring replace. Every rule E6 adds or edits is pinned by a `build.test.mjs` test that parses the stylesheet the way E4's do. The preview check reads `getComputedStyle` for each changed rule *and* its neighbours (§12 step 5), at 375, 390 and 768, and at 1280 to show nothing moved there.
- **Examples are written first, run red on `main`, and each failure is quoted in the PR.**
- **Fixtures assert their state before the test uses them**: seven cards with CRANK alone; an Arcanist with the Magic reference; a character with at least six spend buttons.
- **The seat sheet is checked in the browser**, not only in jsdom.
- **Screenshots can't be attached.** The preview check goes in the PR body as text: what was loaded, at what size, and what was read.
- **The frames that may move are listed exactly** (§13), and **a class-only change to a frame's `deep` hash counts as a move**. E4's six Progression hashes moved on a class alone and the order hadn't listed them.
- **Colour and voice picks go to Ken through the conductor.** E6's defaults pick no colour and add no string.
- **Contrast holds wherever E6 changes a size or colour.** The defaults change neither a colour nor a font size. If the builder finds one must, it's a stop (§13).
- **In a worktree, check `git status` after every pull.** The stale-file pattern hit in E8's and E4's reviews.

---

## 1. Goal and Done when

**Goal:** on a phone, the running sheet reads without breaking. A dice roll is one line, no fold pushes the page sideways, Main's vitals end without an orphaned card, and Progression's spend buttons sit in an even grid.

**Done when:**
- **Attack values** (EQ54): wherever the sheet draws a weapon's attack (Main, Loadout, the catalog browser, a form's and an archetype's weapon rows), the dice expression "1d10 + N" never breaks inside itself, at any width. A kicker or a sub-line after it may still wrap. The seat sheet shows the same.
- **The page never scrolls sideways with the folds open** (EQ55). On every sheet tab at 375, 390 and 768, with every `<details>` opened, `scrollWidth` equals `clientWidth`. A reference table wider than the screen scrolls inside its own frame, which can take focus and is labelled. The prose tables keep wrapping as they do today.
- **The alone card** (EQ53): under the existing `@container (max-width:415px)`, the card alone on its row lays out on one line (its label, value and tier or note), about 64px tall instead of 102. It still takes the whole row, is still a button, and still opens its popover. At 768 and 1280 nothing changes.
- **Progression's spend row** (EQ56): below 640px it's an even grid of two columns. An odd last button takes the row, as the alone card does. Minor choice's `.raise-row` is unchanged.
- **The name** (EQ52's default): unchanged. Main keeps its title and the header keeps the name (Decisions 140, 165).
- **`phone-check` holds the new floors** (§11): overflow with every fold open on every sheet tab, and the attack value on one line on Main and Loadout.
- **The neighbours are unchanged,** read by `getComputedStyle`:
  - a vitals card that isn't alone;
  - the alone card at 768 and 1280;
  - the Heal/Hurt/Take a hit row;
  - Damage, RoF and Cap. cells in the weapons table;
  - `.raise-row` in Minor choice's modal;
  - the reference panel's prose tables;
  - GM mode's `.ref-frame`.
- **The seat sheet** (GM mode) shows the same in the browser: an Arcanist seat's Character tab doesn't scroll sideways, and attack values hold to one line.
- `npm run verify` and `npm run phone-check` pass. The frame fixture moves only as §13 allows.

## 2. Tier, versions, numbers

- **Tier: *Fix*,** on the defaults. CSS, a class hook or wrapper in the renderers, and `phone-check`'s floors. No rule, data shape or engine reader moves, and every decision cited stands.
  - **EQ52's Alternative A would make it *Rule or shape*:** it changes what Decision 140's header shows on Main, so it needs a numbered decision (**N**) superseding 140 in part. The conductor says so before the build if Ken picks it.
- **Versions:**
  - **App: patch.** A player can see it. `npm run bump` moves `[Unreleased]` from whatever it reads at build (0.69.1 now) to the next patch.
  - **Game data: unchanged** (Decision 68).
  - **Schemas: unchanged.**
- **Numbers:** no decision or flag on the defaults. EQ52–EQ57 are this order's questions.

## 3. Decisions

None on the defaults (§2). If Ken picks EQ52's Alternative A, the conductor drafts decision **N** before the build. It would say that Main's header hides the name while Main's title is on screen, and it would supersede Decision 140 in part.

## 4. Questions for Ken

Each has a default. A question Ken leaves blank is answered "Default".

- **EQ52 — The name shown twice on Main.**
  - **Default: keep both.** Decision 140 put the name in the header at every width, and Decision 165 kept it in Main's title. 165 rejected "the name only in the header" because a long name ends in "…" there and would never be seen whole. Hiding the header's name wouldn't save height either: its first row holds ⋮ and the theme button anyway. The two do different jobs. The header says whose sheet this is on every tab. Main's title is the card: name, TAG and archetype line.
  - *Alternative A:* while Main's title is on screen, the header shows no name; once the title scrolls under the header, the name appears there. That's the familiar large-title-collapses pattern. It's one observer in `app.js`, and *Rule or shape* (it supersedes 140 in part), so a decision.
  - *Alternative B:* Main's title drops the name on a phone. That's the option 165 rejected, with nothing new to weigh, so it isn't recommended.
- **EQ53 — The CRANK card alone on its row.**
  - **Default: the alone card is one line on a phone.** Under the existing `@container (max-width:415px)`, the card alone on its row (CRANK on a character with SFR; whichever card is left over, per 214) lays out label, value and tier on one row. It goes from 102px to about 64px, and Combat starts 38px higher. It still takes the row (214), is still a button, and still opens its popover. Only its inner layout changes. The prototype was `display:flex; align-items:baseline; gap:12px; flex-wrap:wrap` on `.cond-grid > .cond.alone`, which kept every child and stayed above 44px.
  - *Alternative:* leave it as 214 drew it. The critique's "orphaned" stays.
- **EQ54 — Attack values that wrap.**
  - **Default: the dice expression never breaks, everywhere the sheet draws an attack.** This covers Main (`sheet.js:479`, `:483`), Loadout (`:2296`, `:2306`), the catalog browser (`:1943`), and the form's and archetype's weapon rows (`:2606`, `:2627`). The seat sheet gets it through the same renderers. A kicker or a sub-line after it ("+1 ACC Single", "untrained") may still wrap.
  - *Alternative:* Main only, where the critique saw it. Loadout's table already scrolls sideways in `.lo-scroll`, so the wrap there costs height rather than legibility.
- **EQ55 — Reference tables that push the page sideways** (not in the plan; found by the sweep).
  - **Default: E6 takes it.** In the archetype's reference panel (`REFERENCE_SECTIONS`, `sheet.js:740–790`), every table with a header row sits in a frame that scrolls sideways inside itself. That's GM mode's `.ref-frame`, with its `role="region"`, `tabindex="0"` and `aria-label`. The two-column prose tables (`row()`, "Charging, holding and learning") are left as they are, because a `max-content` width would put each sentence on one long line. `phone-check` gains a floor: overflow measured with every fold open (§11).
  - *Alternative:* leave it for E7. Then an Arcanist on a phone scrolls the whole page sideways whenever a Magic reference fold is open.
- **EQ56 — Progression's spend row on a phone** (not in the plan; found by the sweep).
  - **Default: E6 takes it.** Below 640px, Progression's `.raise-row` is a grid of two equal columns, and an odd last button takes the row. The rule is scoped to Progression's row, so Minor choice's modal row (`sheet.js:862`) is untouched. Each button stays at least 44px tall.
  - *Alternative:* leave it for E7's polish.
- **EQ57 — Which widths `phone-check`'s new floors run at.**
  - **Default: the phone widths it already has** (390, and 390 with touch), plus 768 for the overflow floor. Both breaks reproduce at 390 (the Arcanist's overflow is 164px there, and "1d10 + 22" is two lines), so the floors go red on `main` without a new width, and the frame fixture keeps its four sizes.
  - *Alternative:* add 375 as a fifth width. That's closer to the plan's wording, but it adds a set of frames to `tools/frame-fixture.json` and about a minute to every run, for breaks 390 already catches.

## 5. The assumption sweep

Each row was found by grepping the selector or the function, not by reading a tab. Line numbers are at `2d2f836`.

| What | True today | Where | True after |
|---|---|---|---|
| The header's name | `#brandctx`, Decision 140; ends in "…" when long | `app.js` (header), `shadows.css:81` | Unchanged (EQ52 default) |
| Main's title | `h1.step-title` with the name, TAG barcode, archetype line; 1.3rem below 640px (Decision 165) | `sheet.js` `sheetHeader` | Unchanged |
| The vitals grid | `.cond-grid`: `repeat(auto-fit,minmax(132px,1fr))`, `container-type:inline-size` | `shadows.css:606`, `:1365` | Unchanged |
| Who writes `.alone` | `aloneLast` = cards after Luck odd; Çredits alone without CRANK, CRANK alone with it | `sheet.js:438–443` | Unchanged markup |
| The alone card's rule | `@container (max-width:415px){ .cond-grid > .cond.alone{grid-column:1/-1} }` | `shadows.css:1366` | Same container, plus a one-line inner layout (EQ53) |
| Tests on `.alone` | By class, never by size | `smoke-sheet-archetypes:279–285`, `smoke-sheet-play:1111`, `smoke-sheet-progression:159` | Unchanged |
| The attack value | `attackText` → "1d10 + N" (plain text); `attackWithKicker` appends the kicker | `sheet.js:1887`, `:1890` | The dice expression can't break (a wrapper class, or the cell's rule; the builder's choice, §9). Text unchanged |
| Who draws it | Main `:479`, `:483`; catalog `:1943`; Loadout `:2296`, `:2306`; form `:2606`; archetype `:2627` | `sheet.js` | All seven |
| `table.ref td.num` | mono, cyan; no `white-space` | `shadows.css:285` | Unchanged as a rule. Other `td.num` cells hold long text (Minor choice's "Gets"), so a blanket `nowrap` there is wrong |
| Print's attack | `#printSheet table.p-table td.num{white-space:nowrap}` already | `print.css:205` | Unchanged; the precedent |
| Tests reading "1d10 +" | 14 assertions by `textContent` | `smoke-sheet-skills` ×10, `rules` ×2, `engine` ×1, `smoke-wizard` ×1 | Unchanged if the text is unchanged (no `&nbsp;`) |
| The reference panel | `referencePanelHtml`: each part in `<details class="group"><div class="ref-body">` | `sheet.js:804–810` | Column tables wrapped in `.ref-frame` (EQ55) |
| Its tables | Domain `:749`, tier TH/time `:761`, Materials `:765`, TN/TH `:770`, Aberration roll `:778`; prose `row()` tables `:796–800` | `sheet.js` | The five with a `<thead>` framed; the prose ones not |
| `.ref-body` | `padding:4px 0 8px`; `>p` 80ch | `shadows.css:688–689`, `:1218` (table mode) | Unchanged |
| `.ref-frame` | `overflow-x:auto`; table `width:max-content` below 640, `100%` from 640 | `shadows.css:1653–1659`; written by `gm.js:936` | Reused as is. GM's Reference unchanged |
| Progression's spend row | `.raise-row{display:flex; flex-wrap:wrap; gap:10px}` | `shadows.css:1063`; `sheet.js:1719` | A two-column grid below 640, scoped to Progression's row (EQ56) |
| Minor choice's row | `.raise-row` of option buttons in a modal | `sheet.js:862` | **Unchanged** |
| The seat sheet | Draws the same renderers read-only (`drawReadOnly`) | `gm.js:4440` | Gets every change; nothing GM-specific |
| `phone-check` | Overflow measured with folds closed; text size with folds open; widths 390, 390 touch, 768, 1024 | `tools/phone-check.mjs:65–76`, `:135` | Overflow also measured with folds open; attack value on one line (§11) |
| The frame fixture | 4 sizes; `deep` hashes class and box | `tools/frame-fixture.json`, `phone-check.mjs:146` | Moves only as §13 lists |

**What text points at what this changes.**
- No player copy names a layout. No string is added or reworded.
- `.impeccable/critique/2026-11-12T01-36-16Z__src-ui-sheet-js.md` names the findings. It's a record, so leave it.
- The comment at `sheet.js:438` ("whichever card is alone on its row in two columns takes the whole row") stays true.

**The rest of the sweep** (every tab, five characters plus the long name, at 375, 390 and 768):
- **E6 takes:** the plan's three items (EQ52–EQ54), the reference tables (EQ55) and Progression's spend row (EQ56).
- **Checked, and it holds:**
  - no sideways overflow on any tab with the folds closed;
  - the header is 94px at 375 and 88px at 768;
  - the vitals bar and jump bars scroll sideways on purpose (Decision 165);
  - Loadout's tables scroll in `.lo-scroll` on purpose;
  - no text under 11px;
  - the touch-size floor is phone-check's, and it passes.
- **Left, and where:**
  - **Main's TAG number breaks over two lines beside the barcode** at 375 ("TAG-SERS-" / "5VDS-4TQR"). **E7.**
  - **Skills' "+1 IP?" cell wraps** ("Handguns +1 IP?") at 375 and 768. **E7.**
  - **A weapon's tag chips wrap one to a line** ("Paired" alone under "AP Conceal"). Natural wrapping. **E7, if anything.**
  - **Trackers' Health Level track breaks a Pain band onto its own line** (Wren, Juno: "Pain 2 5/5"). The bands carry weight as meaning (the One-Line Frame Rule), so a layout change there is a design question. **E7.**
  - **At 768 the vitals grid has five columns,** and Çredits and CRANK sit on a last row with three empty cells. That's a tablet look, not a phone break. **E7.**
  - **The long name in the header ends in "…"**, as Decision 140 says. Not a defect.

## 6. Read first

- `CLAUDE.md`: constraints 1, 3 and 7; *Change tiers* (*Fix*).
- `docs/SCHEMA.md` §4: Decisions 140, 165, 214 and 239 (the alone card).
- `DESIGN.md`: Shapes (the One-Line Frame Rule), Components (Cards, Buttons), and anything on phone layout.
- `src/styles/shadows.css`:
  - `.cond-grid` and its container (`:606`, `:1365–1366`);
  - `table.ref` (`:281–285`);
  - `.raise-row` (`:1063–1065`);
  - `.ref-body` (`:688`);
  - `.ref-frame` (`:1653–1659`).
- `src/ui/sheet.js`:
  - the vitals cards (`:410–445`);
  - Main's weapons (`:470–490`);
  - `attackText`/`attackWithKicker` (`:1887–1890`);
  - `REFERENCE_SECTIONS` and `referencePanelHtml` (`:740–810`);
  - Progression's spend row (`:1716–1726`);
  - Minor choice's row (`:862`).
- `src/ui/gm.js:936`: the `.ref-frame` markup to copy.
- `tools/phone-check.mjs`: the overflow measure, the fold-opening for text size, `WIDTHS`, `FIXTURE_SIZES` and `frameBoxes`.
- `tests/build.test.mjs`: E4's CSS tests (the block at the end) as the model.

## 7. Out of scope

- **The header and Main's title** (EQ52's default). If Ken picks Alternative A, the conductor re-scopes.
- **Any colour, font size or token.** If one seems needed, it's a stop (§13).
- **Any word.** No string is added or reworded.
- **The items §5 leaves to E7.**
- **GM mode's own views.** The seat sheet changes only through the shared renderers. GM's Reference tab and encounter screens are untouched.
- **Print** (`print.css`). It already holds its attack cells to one line.
- **What any number says.** Weapon lines, CRANK rep and the reference tables' contents are unchanged.

## 8. The shapes

No data key, save-file field, engine function or schema changes. The hooks the builder may add (the tests rely on whichever it picks, named in the PR):

| Hook | On | Why |
|---|---|---|
| A class on the dice expression (for example `<span class="atk">`), or a class on the weapons tables' Attack cell | the seven sites in §5 | so the expression can't break while the kicker and sub-lines can |
| `.ref-frame` with `role="region" tabindex="0" aria-label="<the part's title>"` | each `<thead>` table in `REFERENCE_SECTIONS` | GM mode's pattern, reused |
| a modifier on Progression's spend row (for example `raise-row spend`) | `sheet.js:1719` | so the phone grid doesn't reach Minor choice's row |

`attackText` keeps returning the same visible text. If it gains markup, every caller must still put it in HTML, never in an attribute or through `esc()`. Grep its callers (seven today) and say so in the PR.

## 9. The UI

**What a player sees** (375, dark; layout is the same in light):

| Where | Before | After |
|---|---|---|
| Main's weapons | "1d10 +" / "22" on two lines | "1d10 + 22" on one; Weapon column 7px narrower |
| Loadout's weapons | Same wrap, inside its sideways scroller | One line; the scroller may get a little wider |
| Character, an Arcanist, Magic reference open | The page scrolls 179px sideways | The tier and materials tables scroll inside their own frame; the page doesn't |
| Main's vitals, Dax | CRANK alone, 343×102, three lines | CRANK alone, 343×~64, one line |
| Progression's spend row, Kade | Rows of 2/1/1/1, lone buttons of different widths | Two equal columns; an odd last button takes the row |
| Main's name | Header and title | Unchanged |

**Interaction:**
- A framed reference table can take focus (`tabindex="0"`), and arrow keys scroll it, as GM's Reference does. Focus shows the standard cyan outline.
- No other press, focus or record moves. The alone card is still a button that opens its popover, and the spend buttons still open their modals.

**CSS, by whole lines** (the builder writes them; this is what each must say):
- The dice expression: `white-space:nowrap` on the hook §8 picks. Not on `table.ref td.num` as a whole.
- `.ref-frame` is reused as is. No new rule, unless the sheet's `.ref-body` needs a `min-width:0` for the frame to shrink inside a grid card (the builder checks in the preview).
- `@container (max-width:415px)`: `.cond-grid > .cond.alone` gains its one-line layout, on the existing line or a new line beside it, edited whole. The `.corner` icon stays absolutely placed. No font size changes.
- `@media (max-width:639px)`: Progression's spend row is `display:grid; grid-template-columns:1fr 1fr`, and an odd last child spans both columns. The hook keeps it off Minor choice's row.
- **No colour, font size or token changes.**

**For the voice pass:** no new player-facing string.

## 10. Worked examples, as named tests

Write these first, run them on `main`, and **paste each failure into the PR** (§12 step 1). An example that passes on `main` is a stop unless the PR says why. The CSS examples parse `shadows.css` the way E4's do (strip comments, split rules, match the selector exactly, and read the `@container`/`@media` block by its prelude).

1. `build.test.mjs`: **"E6 1: an attack's dice can't break"**.
   - The hook §8 picks sets `white-space: nowrap`.
   - `table.ref td.num` itself does not.
   - Fails on `main`.
2. `smoke-sheet-play.test.mjs`: **"E6 2: every place the sheet draws an attack wraps the dice in the hook"**.
   - A locked character holding a catalog firearm and a melee weapon (assert both are in `ch.weapons` and that `Engine.weaponLine` returns an attack for each).
   - On Main and on Loadout, each Attack cell's dice expression is inside the hook, and the hook's text equals `"1d10 + " + attack` (read from `weaponLine`).
   - A kicker or "ACC" sub-line is outside it.
   - Fails on `main`.
3. `smoke-sheet-archetypes.test.mjs`: **"E6 3: a reference panel's column tables sit in a frame, and its prose tables don't"**.
   - An Arcanist (assert its reference panel exists, from `coreMechanic.panels`, never typed).
   - On Character, every `[data-reference] table.ref` with a `thead` has a parent `.ref-frame[role=region][tabindex="0"][aria-label]`.
   - No table without a `thead` has one.
   - Fails on `main`.
4. `build.test.mjs`: **"E6 4: the alone card is one line on a phone, and still takes the row"**.
   - Inside `@container (max-width:415px)`, `.cond-grid > .cond.alone` keeps `grid-column: 1/-1` and gains the one-line layout (`display: flex`).
   - No `.cond` rule outside that container changed.
   - Fails on `main`.
5. `smoke-sheet-progression.test.mjs`: **"E6 5: Progression's spend row carries its hook, and Minor choice's row doesn't"**.
   - The E4 4 fixture (a held Disadvantage, so five or more buttons).
   - `#main .raise-row` has the hook.
   - Open Minor choice's modal (a character with an owed Minor, as the existing Minor-choice tests build one): its `.raise-row` has no hook.
   - Fails on `main`.
6. `build.test.mjs`: **"E6 6: the spend row's phone grid is scoped"**.
   - Inside `@media (max-width:639px)`, the hook's rule sets `grid-template-columns: 1fr 1fr`.
   - Plain `.raise-row` keeps its flex rule.
   - Fails on `main`.
7. `smoke-table-sheet.test.mjs`: **"E6 7: the seat sheet frames an Arcanist's reference and wraps an attack's dice"**.
   - A seat copy that is an Arcanist holding a weapon (assert both from the engine).
   - On the read-only seat sheet's Character, its column tables sit in `.ref-frame`.
   - On Main, the attack's dice sit in the hook.
   - Fails on `main`.

## 11. Tests beyond the examples

- **`phone-check`'s new floors.** Each must fail on `main`, and the PR quotes the failure.
  - **Overflow with every fold open.** On every sheet tab, at each phone width and at 768, open every `<details>` in `main`, then measure `scrollWidth` against `clientWidth` as the existing overflow check does. The fixture's seed is an Arcanist (`lockedCharacter()`'s default), so its Magic reference is there; assert that in the script, as the order asks of every fixture. Expected on `main`: about 164px at 390.
  - **The attack on one line.** On Main and on Loadout at the phone widths, each Attack cell's dice expression has one line box (`Range.getClientRects()` tops). If the seed holds no weapon, the floor uses its own character with one. **Never change the frame fixture's seed**, or every frame moves.
  - **The alone card's height:** at the phone widths, a `.cond.alone` is no taller than 72px, on a seven-card character (SFR plus CRANK). It uses its own character too.
  - **Progression's spend row:** at the phone widths, every button in the row has the same width as its row-mate, or the row's whole width if it's the odd last.
- **The Read Rule** (`build.test.mjs` W43) and the touch-size floor must still pass with no new exemption.
- **Mutation tests**, each against the built code:
  - The dice hook dropped from Main only: example 2 fails on Main, and `phone-check`'s attack floor fails at 390.
  - `nowrap` moved to `table.ref td.num`: example 1 fails.
  - `.ref-frame` put on the prose tables too: example 3 fails.
  - `.ref-frame` dropped: example 3 fails, and `phone-check`'s open-fold overflow fails at 390.
  - The alone card's container dropped, so the rule applies at every width: example 4 fails. The 768 and 1280 preview reads would show it too.
  - The spend-row hook put on Minor choice's row too: example 5 fails.
  - The phone grid on plain `.raise-row`: example 6 fails.
- **Check each for a second path:** example 2 reads text that 14 other assertions also read. Make sure it fails on the hook, not the text.
- **Every fixture asserts its state first** (Carried over).

## 12. Steps

1. **The examples as failing tests on `main`,** and the new `phone-check` floors run on `main`'s build. Paste each failure's name and assertion into the PR's Evidence.
2. **The renderers' hooks:** the dice wrapper at the seven sites, `.ref-frame` around the reference panel's `<thead>` tables, and the spend row's modifier. Run `npm run verify`.
3. **The CSS,** whole lines, one rule at a time, with `npm run verify` after the group.
4. **`phone-check`'s floors** (§11). Run `npm run phone-check`.
5. **In the dev preview, recorded in the PR as text** (what was loaded, the size, and what `getComputedStyle` and the box reads returned):
   - **At 375×812 with touch, 390×844, 768×1024 and 1280×860:**
     - Dax: Main's Attack cell line count, the alone card's height and `grid-column`, Combat's top;
     - Wren: Character with every fold open, `scrollWidth` against `clientWidth`, and the frame's `scrollWidth`;
     - Kade: Progression's spend buttons' widths.
   - **The neighbours, the same way:**
     - a vitals card that isn't alone;
     - the alone card at 768 and 1280 (unchanged);
     - Heal/Hurt/Take a hit;
     - Damage, RoF and Cap. cells;
     - Minor choice's row (open it);
     - a reference prose table;
     - GM's Reference tab with its folds open.
   - **The long name** (rename a copy): Main at 375 still shows it whole in the title.
   - **Keyboard:** Tab to a framed reference table, and arrow keys scroll it.
   - **GM mode's seat sheet** (Dead Air): Juno Park's Character with the folds open, and Dex's or Mara's Main attack, read in the browser.
6. **`npm run phone-check`,** and the frames it moved, against §13.
7. **The mutation tests** (§11).
8. **After the last change of any kind, the full `npm run verify` again,** and say so in the PR.
9. **Close-out** (§14).

## 13. Stop and ask

**Stop if:**
- A change needs a colour, a font size or a token's value, or `!important`.
- The Read Rule or the touch-size floor fails, or needs an exemption.
- The one-line alone card can't hold every child (label, value, tier, icon) at 343px, or drops below 44px.
- `attackText` is found inside an attribute, a `title`, or `esc()`, so markup would break it.
- A frame not listed below moves, or a listed frame moves in height by more than the change explains.
- A test you didn't expect reads one of these classes and fails.
- An example passes on `main` with no reason you can write down.
- Anything changes at 1280×860 on Main (E3's revisit condition).

**Not a stop** (re-record and list each in the PR, with what moved):
- The app version literals the patch bump moves.
- **`sheet: main @390`:** the Attack cell's boxes (and the alone card's, if the seed has seven cards).
- **`sheet: loadout @390` and `sheet: loadout @768`:** the Attack cell's boxes inside `.lo-scroll`.
- **`sheet: progression @390`:** the spend row's boxes, and its class-only `deep` hash change.
- **`sheet: character @390` and `@768`:** a `deep` hash change from the new `.ref-frame` boxes. A closed fold's boxes have no size, so the count shouldn't move. If it does, say why.
- **A class-only `deep` hash change on any of the frames above** counts as a move, and it is listed. On any other frame it's a stop.

## 14. Close-out

- **`close-the-session`, for *Fix*:**
  - a CHANGELOG line and `npm run changelog`;
  - the app patch bump;
  - the plan's §3 row: E6 links this order and reads "E6 built";
  - STATE's §3 line for the plan;
  - a log line only if something was learned the hard way.
- **CHANGELOG** (player voice, for the voice pass): "**The sheet sits right on a phone.** Attack rolls stay on one line, a spellcaster's reference tables scroll on their own instead of pushing the page sideways, the card alone at the bottom of Main's vitals takes one line, and Progression's buttons line up in pairs."
- **PR title:** `fix(sheet): the running sheet on a phone (E6)`.
- **PR body:**
  - the template's sections;
  - **Evidence:** each example's failure on `main`, quoted; the new `phone-check` floors' failures on `main`; the mutation list; the preview reads (§12 step 5) as text; `phone-check`; the frames re-recorded, each with what moved;
  - **Where the order didn't fit**;
  - a line saying the full suite ran after the last change.
- **Review checklist:**
  - **Redo §5's sweep:**
    - grep `attackText(` and `attackWithKicker(` and check every site has the hook, and that none is in an attribute;
    - grep `REFERENCE_SECTIONS`' tables and check each `<thead>` one is framed and no prose one is;
    - grep `raise-row` and check Minor choice's row has no hook.
  - **The CSS by whole lines:** diff `shadows.css`, and check each changed line is one §9 names, and no neighbour on a shared line was dropped (E3's fold).
  - **The neighbours by `getComputedStyle` and box reads,** at 375, 390, 768 and 1280, as §12 step 5 lists. Don't take the PR's word for it.
  - **At 1280×860, Main unchanged** (E3's revisit condition): Combat's top and the fight's bottom match `main`.
  - **The seat sheet in the browser,** with an Arcanist seat's folds open.
  - **Keyboard:** a framed table takes focus and scrolls by arrow keys.
  - **The fixtures' state:** the Arcanist really has its reference panel, the seven-card character really has an alone CRANK, and the Progression fixture really shows five or more buttons.
  - **Mutations:** re-run §11's yourself.
  - **The examples and floors on `main`:** check they fail there (scratch worktree, its own `npm ci`).
  - **`phone-check`'s frames:** `git diff tools/frame-fixture.json`, with only §13's frames moved, and each `deep` hash change explained.
  - **The suite:** `npm run verify` on the PR's head.

## 15. Handing it over

The builder and reviewer prompts are in `docs/WORK-ORDERS.md`, with this order's path. This order's traps:
- **`nowrap` goes on the dice, not on `td.num`.** Other `td.num` cells hold long text (Minor choice's "Gets"), and a blanket rule pushes a phone sideways.
- **No `&nbsp;` in the text.** Fourteen assertions read "1d10 + N" with plain spaces.
- **`.ref-frame` only on column tables.** On a prose table, its `max-content` width puts each sentence on one long line.
- **`.raise-row` has two users.** Scope the phone grid to Progression's row.
- **The alone card keeps `grid-column:1/-1`** (Decision 214). Only its inside changes, and only inside the container query.
- **Never change `phone-check`'s frame seed.** A floor that needs a weapon or seven cards brings its own character.
- **A class change moves a frame's `deep` hash.** §13 lists where that's expected. Anywhere else, it's a stop.
- **CSS by whole lines,** and check the neighbours at four widths.
- **Examples and floors first, red on `main`, quoted in the PR. Fixtures checked for their state.**
- **The seat sheet in the browser.**
- **Mount the private repo** (`git submodule update --init private`) in a fresh worktree before the suite.
- **After a `git pull`, check `git status`.**
