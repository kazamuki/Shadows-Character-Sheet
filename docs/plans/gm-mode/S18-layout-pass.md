# Work order S18: The Layout pass. A table gets its own frame, a measure for every page, and a bar that keeps Back in reach

**Plan:** [`../gm-mode.md`](../gm-mode.md), the *Still to build* row "Layout pass"
(W80, W77; Ken: before launch, 2026-10-30), and [`WISHLIST.md`](../../WISHLIST.md)'s
W80 and W77.
**Status:** **Built 2026-10-30** (Decision 258, switched off). Drafted 2026-10-30 by Claude (Opus), the S3d reviewer, after #274
(S3d, Decision 257) merged. Ken picked it as the next order (2026-10-30, through the
conductor).
**Approved by Ken 2026-10-30** (in the conductor session), as Rule or shape, one decision, no version moves, no `private/` commit.
**SQ1–SQ6 answered by Ken 2026-10-30: every default.** He picked SQ1 (*Gone, one bar*), SQ2 (*Pages only*) and SQ3 (*Measures, no cap*) by name, and SQ4–SQ6 as one set (*Approve, defaults*).
**Branch:** from `main` at `85588e3` or later, PR to `main`, switched off
(Decision 173). **No `private/` commit.**
**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md).
The conductor (Opus) starts **S18 build** (Sonnet), then a fresh **S18 review** (Opus)
once the PR is open. Builder and reviewer message each other directly. Anything for
Ken goes to the conductor. §15 is the hand-over.
**Runs alone.** It touches:
- `app.js`: one class on `#app` while a table is open;
- `gm.js`: each page's Back and its Add to joining a bar, and the cast member's page;
- `shadows.css`: the table's frame, the page measures and the bar;
- `tools/phone-check.mjs`: the frame fixture and the table's numbers;
- the ledger and STATE.

No engine change, no data change, no schema moves.

**Tier: Rule or shape.** The frame is a choice someone could have made otherwise:
the rail goes, and Back moves into a bar that sticks. One decision, **N**. It
supersedes Decision 211 in part and extends 35, 140 and 188/189's encounter bar.

**Carried over from S3d's review** (#274: one review, two fix rounds, Ken took every
recommendation and every voice draft in one round, recorded on #274,
issuecomment-6533444160). Each item is marked as the order's, the build's or the
process's:

- **The order's: a key collided with a data id.** The custom-armor key `custom` was
  the custom archetype's id, and Decision 135's guard failed on it. **Here:** this
  order adds no data key and no id literal. Its new class name and CSS custom
  properties are checked against `shadows-data.js` ids in pre-flight (`table-mode`,
  `--table-measure`, `--bar-h`: none is an id).
- **The order's: a twin marked "Unchanged" wasn't.** §5 marked the wrap-up
  "Unchanged", but the start had moved what it read. **Here:** every screen that
  shares `.app`, `main`, `.roster-list`, `nav.ledger` or `aside.vitals` with a table
  is a sweep row, Home and the wizard included. "Doesn't move" is proved by a
  geometry diff (§11), not by reading.
- **The order's: a promise a computed rule can't keep.** SQ6, 257 and INDEX promised
  a line the claim couldn't give. **Here:** every behaviour in §9 names the code that
  makes it true. The decision says only what §9 builds.
- **The order's: a case nobody wrote down** (a rename to another seat). **Here:** §9's
  *Where things land* has a row for every route into and out of a page with a bar.
- **The order's: a doc reader missed.** SCHEMA §3's table shape still said a PC row
  had no wear. **Here:** §5's last row lists every doc sentence that names the 920px
  cap, the rail or the vitals column, found by grep.
- **The build's: the browser walk was partial**, and the reviewer did the wizard walk,
  the Cyborg, Shock Failed, the Undo of a seat and the Tab-through. **Here:** §12
  step 7 names each measurement, and the PR body must report every number. A missing
  number is a should-fix.
- **The build's: a pin test went in without its mutation run.** **Here:** every test
  §10 and §11 add is mutation-tested, and the PR's table names what caught each.
- **Process: a notes file for Ken was out of the conductor's reach.** **Here:** the
  reviewer pastes the voice-pass table into its message to the conductor, and onto
  the PR.

**Pre-flight** (`docs/WORK-ORDERS.md`, *The pre-flight*), against `main` at
**`85588e3`**, 2026-10-30. The functions below were opened and read. The geometry was
measured in the dev preview (`shadows-dev-preview`, `?gm=on`) on the sample table
*Dead Air* (`samples/`), with one seat (Dez) imported in the page and added to a
planned encounter. Overflow was counted as elements in `main` past the viewport's
right edge **outside a sideways scroller** (the read-only sheet's tab row and the
Reference's jump bar scroll by design). Line numbers are `85588e3`'s.

- **The frame.** `index.html` is `#app.app` holding `header.top`, `nav.ledger#ledger`,
  `main#main` and `aside.vitals#vitals`. `.app` is a three-column grid,
  `var(--rail-w) 1fr var(--vitals-w)` = 218px, 1fr, 248px (`shadows.css:23,65`), and
  `main` is `max-width:920px` (`:127`). Only `.app.sheet-mode` escapes: one column,
  no rail, no vitals, no cap (`:561–564`, Decision 35). `renderMain` toggles
  `sheet-mode` (`app.js:179`), and `renderHome` removes it (`wizard.js:813`).
- **On a table, the rail and the vitals column are always empty.** `renderLedger`
  blanks the rail off the wizard (`wizard.js:13`). Opening a table sets `S.ch:null`
  (`gm.js:127`), so `renderVitals` blanks the vitals (`wizard.js:41`), and
  `aside.vitals:empty{display:none}` (`:310`) hides the box but **not its grid
  column**.
- **Below 1060px the wizard's rules apply to a table.** `.app:not(.sheet-mode)
  nav.ledger{display:flex; … padding:6px 8px}` (`:1005`) draws the empty rail as a
  **13px strip under the header** on every table screen at 768 and 390. `main{order:2}`
  and `--strip-off` (`:1095–1096, 1119`) are the wizard's sticky line, and are inert
  on a table (`--vstrip-live` 0). `smoke-wizard.test.mjs:728` pins
  `.app:not(.sheet-mode) main{order:2}` **as a literal**.
- **Probes on `main`, every GM screen** (sessions, a session, players, the read-only
  sheet, a seat's page, cast, a member, city, threats, encounters, an encounter, its
  Hit panel on a claimed row, reference, notes):
  - **1980:** `main` is 920px at x 218–1138 on every screen, with **827–842px empty
    to its right**, beside the 218px empty rail.
  - **1300:** `main` is 819–834px, with the rail (218) and the vitals column (248)
    empty: **466px, 36% of the screen**.
  - **768 and 390:** `main` fills, with no overflow outside a scroller, and the 13px
    empty strip under the header (88px at 768, 94px at 390).
- **Prototype: the cap lifted alone** (one column, no rail, no vitals,
  `main{max-width:none}`) at 1980. `main` is 1965px. **Fields grow to 1905–1920px**
  (a session's journal, a member's Description, the encounter's PC name, Notes), prose
  to 1905px, and every card on Cast, City, Players, Sessions and Encounters, and
  every encounter row, is 1905px wide. **So lifting the cap alone is worse than the
  cap**, and the order gives each kind of page a measure (§9).
- **The read-only sheet (S3c) under the prototype lays out exactly as the player's
  own sheet does.** Dez's Main at 1980: `.main-grid` columns **1078 + 797px** on
  both. Under today's cap they are **477 + 353px**. Its tab row scrolls sideways at
  768 and 390 as the player's does.
- **The lists** are `ul.roster-list` grids with one card per row (`:1148`). They
  hold Cast (`cast-card`), City (`place-card`), Players (`seat-card`), Sessions
  (`sess-item`) and Encounters (`cast-card`). `.roster-list` is **also Home's roster
  of player characters**, so any change must be scoped to the table. An encounter's
  rows are `ul.enc-rows` (`:1310`), in turn order.
- **Back on every page** is `<p><button class="btn sm" data-…back>` at the top of
  the page, and it scrolls away. There are 8 kinds, found by grep:
  - `data-cback` (a cast member, `gm.js:760`);
  - `data-pback` (a place, `:1357`);
  - `data-fback` (a faction, `:1675`);
  - `data-sback` (a session, `:1919`);
  - `data-co-back` (the close-out, `:2216`);
  - `data-tback` (a Threats entry or group, `:2552`, `:2565`);
  - `data-seatback` (a seat's page and the read-only sheet, `:3575`, `:3633`);
  - `data-enc-back` (an encounter, `:3224`).
  A member's page and a Threats group's page also have **Add to <encounter>** at
  the top, beside Back (a member's at y 114, Decision 211). Measured at 1980: an encounter page is 6567px tall, a member's 2829,
  a session's 2219.
- **The encounter already has the pattern.** `.enc-bar` (`gm.js:3209`,
  `shadows.css:1308`) is `position:sticky; top:var(--hdr-off)`. It holds the status,
  Start/End or Next/End the encounter, and stays in view while the rows scroll
  (Decisions 188–189). Its Back (`data-enc-back`) sits above it and scrolls away.
  `smoke-table-play.test.mjs:1610` checks that the Turns group is outside
  `.enc-bar`.
- **The contrast guards already parse every rule** (`build.test.mjs:208, 259`): a
  new filled or coloured rule is checked in both themes with no new test.
- **`phone-check`** (`tools/phone-check.mjs`) is real Chromium, outside `npm test`,
  and measures Home, the wizard and every sheet tab at its widths. It doesn't open a
  table today.
- **The ledger**, searched by name in *Touches* and text: `.app`, `sheet-mode`,
  `920px`, `max-width`, `ledger`, `rail`, `vitals column`, `aside.vitals`, `1060px`,
  `1280px`, `action rail`, `sticky`, `enc-bar`, `Back to`, `roster-list`, `W80`,
  `W77`. The hits:
  - **35** (*"`.app.sheet-mode` collapses the grid to one column and drops the 920px
    content cap"*): extended, not replaced: a table escapes the same way.
  - **140** (the header's two rows, sticky): extended: the bar sticks under it, by
    its own `--hdr-off`.
  - **160** (pinned vitals from 1280): untouched. A table has no vitals. W77's
    pinned stat block borrows its width rule (SQ4).
  - **161** (the wizard's rail below 1060): untouched. Its selectors stay as written,
    and the table's rules come after them (§15).
  - **188 / 189** (the encounter's sticky status bar with Next): extended: Back
    joins `.enc-bar`.
  - **211** (Add to <encounter> always on screen; *Revisit if* "W80's action rail
    gives these buttons one home"): **replaced in part**: on a page it sits in the
    bar.
  - **256** (the read-only sheet): cited. It lays out at the sheet's width now.

  No other decision names the frame.

## 1. Goal

A GM's table uses the screen it's on. On a wide screen a page has room to read: the
read-only sheet as wide as the player's own, lists in columns, fields and prose at a
readable measure. On every screen, Back (and on a member's page, Add to <encounter>)
stays in reach while the page scrolls. **Nothing outside a table moves**: Home, the
wizard and a player's sheet are pixel for pixel what they were.

**Done when:**
- On every table screen there's no rail and no vitals column at any width, and no
  empty strip under the header below 1060px (L1).
- The read-only sheet lays out as the player's own sheet at 1300 and 1980 (L2).
- At 1980 no field is wider than its measure, no prose line is wider than its measure,
  and the lists are in columns (L3, L4).
- An encounter's rows keep turn order in one column, at their measure (L5).
- Every page with a Back has a bar under the header that holds it while the page
  scrolls. Its press lands where it does today (L6, L7).
- (SQ4) A member's page shows their status under the name, and from 1280px their stat
  block is a panel on the right that stays put (L8).
- The frame fixture diff shows **zero** change on Home, all eight wizard steps (and
  Expert), and every sheet tab, unpinned and pinned, at 390, 768, 1300 and 1980 (L9).
- Every number in §12 step 7 is met and reported.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (the header).
- **App:** **no bump.** Every change is behind the table's class, and a table is
  switched off (173). One line in `changelog-pending.md` (§9).
- **Game data, character schema, table schema, pack schema, ruleset:** unchanged.
- **`private/`:** untouched.
- **Decision:** the next free number, **N** (the ledger ends at 257 on `85588e3`).
- **Wishes:** W80 and W77 move to the plan's row (their *Plan* lines change in this
  docs PR). W80's Home part stays open (SQ5).

## 3. The decision, drafted

Paste it after the last decision, under INDEX §3's **GM mode** heading, and fill in
**Built**. Under 350 words, Touches included (`wc -w`). It's worded for the defaults;
a different SQ answer rewords it.

```
N. **A table has its own frame: no rail and no vitals column, each page at a readable measure, and Back held in a bar under the header.**
     *2026-10-XX · Ken + Claude · Touches: .app, table-mode, sheet-mode, main, 920px, nav.ledger, aside.vitals, roster-list, enc-rows, enc-bar, action bar, Back, Add to encounter, read-only sheet, cast member page, stat block, phone-check, frame fixture, W80, W77, Decision 35, Decision 140, Decision 188, Decision 189, Decision 211, Decision 256*
     - **Decided:** While a table is open `#app` is `table-mode`: one column, no rail, no vitals column, `main` uncapped. Fields stop at 36rem, prose at 75ch, cards fill 20–36rem columns, an encounter's rows stay one 64rem column, and the read-only sheet lays out as the player's own. Each page's Back, and a member's Add to <encounter>, sit in a bar that sticks under the header at every width; on an encounter page Back joins its status bar. From 1280px a member's stat block is a panel on the right that stays put. Home, the wizard and a player's sheet don't move.
     - **Why:** At 1300 the empty rail and vitals took 36% of the screen; at 1980 the read-only sheet used 920 of 1980px. The cap lifted alone stretched fields to 1905px. Back scrolled away on pages 2,000–6,500px tall, and a tablet is mostly below 1060px, where a rail can't show.
     - **Rejected:**
       - W80's action rail from 1060px: two homes for one button, and a tablet sees only the bar.
       - A wider cap: it still stretches fields and keeps the read-only sheet narrower than the player's.
       - The bar on every tab: a tab's action sits with its fields.
     - **Replaces:** Decision 211 in part (on a page Add to sits in the bar). Extends 35 (a table escapes the frame), 140 (a bar under the header), 188–189 (Back joins the encounter's bar).
     - **Revisit if:** Home gets a layout of its own (W80's rest), or a GM tab needs a column the measures don't give.
     - **Built:** switched off (173); PR #…; log 2026-10-XX.
```

**Supersession marks** (on the ledger entry **and** its INDEX line, each as its own
line below the existing marks):
- 211: *→ **Superseded in part by Decision N**: on a page, Add to <encounter> sits
  in the bar under the header.*

35, 140, 188 and 189 are extended, not replaced: no mark. Cite them in N only.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **The rail on a table.** Gone, with Back (and Add to) held in one bar under the header **at every width**? Or W80's **action rail** from 1060px, with the same buttons in a bar below 1060? Or gone with **no bar** (the frame only, and Back stays at the top of the page)? A tablet (§1a) is below 1060px in portrait and usually in landscape, so a rail would mostly show on a desktop, and it gives back 218px of the width this order is reclaiming. | **Gone, one bar at every width** | Default (Ken, 2026-10-30) |
| SQ2 | **What the bar holds.** Default: on a **page**, its Back, plus a member's (and an entry's or group's) **Add to <encounter>**. On an **encounter**, Back joins the existing status bar beside Start / Next / End. On a **tab** (Sessions, Cast…) there's **no bar**: each tab's action (quick-add, New encounter, Add a player) sits with the field it needs. Or also put each tab's one primary action in a bar (W80's "on a tab, its one primary action")? That means splitting buttons from their fields. | **Pages only; tabs keep their actions with their fields** | Default (Ken, 2026-10-30) |
| SQ3 | **The page's measure.** `main` fills the screen, and the page sets measures: fields ≤ 36rem, prose ≤ 75ch, cards in columns of 20–36rem, an encounter's rows one column ≤ 64rem, and the read-only sheet at the sheet's own width. Or a single wider cap (e.g. 1400px) and nothing else? The cap is simpler, but it still stretches fields to ~1340px, and it keeps the read-only sheet narrower than the player's. | **Measures, no cap** | Default (Ken, 2026-10-30) |
| SQ4 | **W77 on a cast member's page.** Status (alive, dead, missing, gone) under the name. From 1280px, the stat block a panel on the right that stays put while the page scrolls (160's width rule), and below that where it is now. Or status only? Or neither (W77 stays a wish)? | **Both** | Default (Ken, 2026-10-30) |
| SQ5 | **Home.** Home's left rail is empty too (W80), but Home is the player's door. Default: Home stays as it is, so nothing a player sees moves and no app bump is needed. W80 keeps a line for Home's layout. Or fix Home in this order too (a player-visible change: an app patch and a `CHANGELOG.md` line)? | **Home stays** | Default (Ken, 2026-10-30) |
| SQ6 | **The bar on a short screen.** Below 540px tall, the bar scrolls away with the header (140). While a field in `main` has focus, it stops sticking, so an on-screen keyboard doesn't squeeze the field (161's rule). Or always stick? | **140's and 161's rules** | Default (Ken, 2026-10-30) |

## 5. The assumption sweep

Every reader was found by grep on `85588e3`. The last column answers the three
questions for each row: which guards read it, where it renders, and what text points
at it.

| What changes | Today, where | After | Readers and twins |
|---|---|---|---|
| **The frame class** | `renderMain` toggles `sheet-mode` (`app.js:179`); `renderHome` removes it (`wizard.js:813`) | `renderMain` also toggles `table-mode` on `S.screen==="table"`, and `renderHome` removes both | `renderTable` is also called directly by many binders (`gm.js:854`, `966`…); the class set by the `renderMain` that opened the table stays. **Twins:** `sheet-mode`. **Guard:** L1 |
| **The grid** | `.app` three columns (`:65`); the rail and vitals drawn by `renderLedger`/`renderVitals` | `.app.table-mode{grid-template-columns:1fr}`; `nav.ledger` and `aside.vitals` `display:none` under it | The wizard's narrow rules (`:1005, 1095, 1096, 1119`) are **left as written**. The table's rules come later in the file with equal specificity, so `smoke-wizard.test.mjs:726–732`'s literals hold |
| **`main`'s cap** | `max-width:920px` (`:127`) | `.app.table-mode main{max-width:none}` | **Twins:** `.sheet-mode main` (`:564`). `main`'s padding stays 26/30 (and 20/16 below 1060), the same as the sheet's, which is why L2 matches |
| **Fields** | stretch with their container | inside `.table-mode main`: text inputs, selects and textareas `max-width:min(100%, 36rem)` (textareas: 48rem) | **Readers:** every `.field` in `gm.js`. `.enc-hit`'s own 26rem cap (S3d) stays. Grids of fields (`.cast-add`, `.cast-filters`, `.threat-filters`, `.sess-head`) keep their tracks; a field stops inside its track. `smoke-table-cast.test.mjs:1219–1221` pin those tracks as literals: don't change them |
| **Prose** | full width | `p`, `.step-note`, `dd` and a text block inside `.table-mode main` stop at `75ch` | **Twins:** the read-only sheet's own prose follows the sheet's rules. **Excluded:** inside `.ro-sheet` (L2 must match the player's sheet) and inside `.enc-row` (its own measure) |
| **Lists** | `.roster-list{display:grid; gap:10px}`, one card per row (`:1148`) | `.table-mode .roster-list{grid-template-columns:repeat(auto-fill, minmax(min(100%, 20rem), 1fr))}`, cards ≤ 36rem | **Home's roster uses `.roster-list`** and must not move (L9). `smoke-table-seats.test.mjs:155` (the active card first) reads DOM order, which doesn't change. The folded *benched / retired / dead* lists are `roster-list` too: they go in columns as well |
| **Encounter rows** | `ul.enc-rows`, full width | one column, `max-width:64rem` | Turn order is top-down; never columns. The Hit panel is inside the row. **Twins:** `.enc-bar` keeps the page's width |
| **The read-only sheet** | 920px wide | the sheet's width | It's drawn by the sheet's renderers (256); with no cap it matches (pre-flight). `.sheet-mode`-only rules (`:132` the phone title, `:1213` the Pin button) **don't** apply to it: by design (no pin on a copy), and the title stays the table's title |
| **Back and Add to** | `<p><button data-…back>` at the top of each page, 8 kinds (pre-flight); Add to beside a member's Back | each page's Back (and Add to) in a `.tbl-bar` that is the page's first child, `position:sticky; top:var(--hdr-off)`, one row, sideways scroll if it can't fit | **Same buttons, same attributes, same handlers.** Every `[data-…back]` selector in `gm.js` (focus targets, e.g. `:1101`, `:1949`) and in the tests still finds it. **Twins:** `.enc-bar`, which the encounter page keeps |
| **The encounter's Back** | above `.enc-bar`, scrolls away | inside `.enc-bar`, first | `smoke-table-play.test.mjs:1610` (Turns group outside the bar) holds. `.enc-row`'s `scroll-margin-top` (`:1311`) already counts the bar: check it still clears it |
| **A member's page (SQ4)** | status in the Codex fields, after Origin, roles and Tier; the stat block at the bottom | status under the name; from 1280px the stat block in a right-hand panel, `position:sticky` | `blockHasNumber` (204) says whether there's a block. The panel holds the block's existing markup, moved, not a twin. Below 1280px, the DOM order a screen reader meets is unchanged (no CSS `order`, 165's reason) |
| **The jump bars** | `.jumpbar.sticky` on Reference and City (`gm.js:557, 1200`) | unchanged; those tabs have no bar | A page with both a bar and a jump bar: none today. If one appears, stop |
| **`phone-check`** | Home, wizard, sheet tabs | + **the frame fixture** (L9) and **every table screen** at 390, 768, 1300, 1980 | It's outside `npm test` (needs a browser) |
| **Text that points at this** | SCHEMA 35's "drops the 920px content cap sheet-wide"; W80 and W77; the plan's row; STATE | N; W80/W77's *Plan* lines; the plan's row → *Built*; STATE | Grep the docs for `920`, `rail`, `left column`, `vitals column` and `action rail`, and give each hit a line in step 9 |

## 6. Read first

- `CLAUDE.md`, whole: constraint 3 (the shell stays a shell: no new element in
  `index.html`), *Change tiers*, *Decisions*.
- `docs/STATE.md`, whole.
- `docs/SCHEMA.md` §4: Decisions **35**, **140**, **160**, **161**, **165**, **188**,
  **189**, **211**, **256**, **257**.
- `docs/WISHLIST.md`: **W80**, **W77**.
- `docs/VOICE-APP.md`: the bar is tool voice. It adds no words.
- **The code:**
  - `app.js`: `renderMain`, `renderTopChrome`, and the `--hdr-live` measure (`:362`);
  - `wizard.js`: `renderLedger`, `renderVitals`, `renderHome`;
  - `gm.js`: `renderTable`, `renderTableChrome`, each page's renderer that draws a
    Back (the 8 kinds), `seatPageHtml`, `readOnlySheetHtml`, the encounter's bar
    (`:3209`), and the cast member's page;
  - `shadows.css`: `:23, 65, 127, 310, 561–564, 1003–1012, 1082, 1085–1125, 1148,
    1306–1312`;
  - `tools/phone-check.mjs`, whole.

## 7. Out of scope

- **Home, the wizard and a player's sheet** (SQ5's default). Nothing they draw may
  move; L9 is the proof.
- **`.sheet-mode`'s rules**, the wizard's narrow rules (`:1003–1125`) and their
  literals in `smoke-wizard.test.mjs`. Add after them; don't edit them.
- **Any tab's own action** moving (SQ2's default).
- **New words.** The bar holds existing buttons. If a page needs a label, stop.
- **W78** (stat blocks on the cast list), **W81**, and Find/Jot's place in the
  header.
- **The engine, the data, every schema, and `private/`.**

## 8. The shapes

No data key, no saved field, no engine function. **UI state: none new.** The class is
computed from `S.screen` every draw.

- `#app.table-mode`: set by `renderMain` while `S.screen==="table"`, removed
  otherwise.
- `.tbl-bar`: a page's first child in `main`, built by `gm.js`. It holds the page's
  existing Back (and Add to) elements, moved there, not copied.
- CSS custom properties: `--table-measure:75ch`, `--table-field:36rem`,
  `--table-card:20rem` / `36rem`, `--enc-measure:64rem`. Names are suggestions,
  checked against `shadows-data.js` ids.

## 9. The UI

**The frame** (every table screen, every tab and page):
- No rail, no vitals column, at any width. Below 1060px, nothing under the header but
  the page.
- `main` fills the width, with the sheet's padding.

**Measures** (inside `.table-mode main`, except inside `.ro-sheet`):
- Text fields and selects stop at **36rem**, textareas at **48rem**. A field inside a
  grid track stops inside its track.
- Prose stops at **75ch**.
- Lists (`.roster-list`) are columns of cards, each **20–36rem**, with the gap they
  have now. At 390px, one column.
- An encounter's rows are one column at **≤ 64rem**, in turn order. Its bar and its
  Add section keep the page's width.

**The read-only sheet** lays out as the player's own sheet at the same width.

**The bar** (SQ1, SQ2 defaults):
- On a page with a Back, the bar is the page's first thing. It holds Back and, on a
  member's, an entry's or a group's page, **Add to <encounter>**. It sticks under the
  header while the page scrolls. It's one row; if it can't fit, it scrolls sideways
  (165's bars do the same).
- On an encounter, Back joins `.enc-bar`, first, before the status.
- Below 540px tall it scrolls away with the header. While a field in `main` has
  focus, it stops sticking (SQ6).
- On a tab, no bar.

**A member's page** (SQ4): status under the name. From 1280px, the stat block is a
right-hand panel (**22–28rem**), sticky under the bar, and the rest of the page is the
content column. Below 1280px, everything is as it is now.

**Where things land.**

| Press | Lands on | Focus |
|---|---|---|
| Back in a bar | where Back lands today | where it lands today (every `focus` call unchanged) |
| Add to <encounter> in a bar | as today (211) | as today |
| A page opened from a tab, Find or a link | the page, scrolled to the top, the bar at the top | as today (the page's `h1`, or the field it opens on) |
| A header tab | the tab, no bar | the tab |
| Scrolling down a page | the bar stays under the header | — |
| A field in `main` takes focus | the bar lets go and scrolls with the page | the field |
| Opening Home, a character or the wizard from a table | no `table-mode` | as today |
| Resizing across 1280px on a member's page | the panel docks or returns to the bottom; the page doesn't jump to the top | unchanged |

**Copy:** none new. ✎ only for the changelog line in `changelog-pending.md`, under a
new bullet **The table's screen**: ✎ *"A table fills a wide screen: the read-only
sheet as wide as your own, lists in columns, and Back always in reach at the top of a
page."*

**Width.** Every number in §12 step 7, at 390, 768, 1300 and 1980.

**Keyboard.** The bar's buttons come first in a page's tab order, as Back does today.
The stat block panel's controls keep their DOM order.

## 10. Worked examples, as named tests

Write these first and show each failing on `main`, or say why it already passes.
Smoke tests go in a new **`tests/smoke-table-frame.test.mjs`** (jsdom: classes,
structure, focus). The geometry goes in **`tools/phone-check.mjs`** (Chromium: L2–L5,
L8, L9), reported in the PR, because jsdom has no layout.

**jsdom (`npm test`):**
- **L1** `N: a table's frame is table-mode, and Home, the wizard and the sheet aren't`.
  Open the sample table: `#app.table-mode`, no `sheet-mode`. Home: neither class. Open
  a character: `sheet-mode` only. Back to the table: `table-mode` only. Fails on
  `main`: no class.
- **L6** `N: each page's Back is in a bar at the top, and lands where it did`. For each
  of the 8 Back kinds, open the page: the Back button is inside `.tbl-bar` (or
  `.enc-bar`), which is the page's first element. Pressing it lands, with focus, where
  the existing test for that Back expects. Fails on `main`: no bar.
- **L7** `N: a member's Add to sits in the bar beside Back`. And the press adds as
  211's tests expect.
- **L8a** (SQ4) `N: a member's status is under their name`.

**Chromium (`phone-check`, numbers in the PR):**
- **L2** the read-only sheet's Main for the S3d fixture (Dez) against the player's own
  sheet of the same file, at 1300 and 1980, unpinned: `.main-grid` columns equal
  (±1px). Today 477 + 353 against 1078 + 797.
- **L3** at 1980, on every table screen: the widest text field ≤ 576px (36rem), the
  widest textarea ≤ 768px, the widest prose block ≤ 75ch (report its px). Today 1905.
- **L4** at 1980: Cast, City, Players, Sessions and Encounters show ≥ 4 cards a row;
  ≥ 3 at 1300; 2 at 768; 1 at 390. Every card is 320–576px wide, or the row at 390.
- **L5** the encounter's rows are ≤ 1024px (64rem) at 1980, in one column, with the
  Hit panel open on the claimed row (S3d), and no overflow.
- **L8** (SQ4) at 1300 and 1980, a member's stat block is a right-hand panel
  352–448px wide whose top stays under the bar while the page scrolls 1000px. At 1279
  it's at the bottom, as today.
- **L9 the frame fixture**: before any CSS change, on `main` at `85588e3`, record the
  boxes (x, y, width, height) of `header.top`, `nav.ledger`, `main`, `aside.vitals` and
  `main`'s direct children, for:
  - Home;
  - each of the wizard's eight steps (and Expert's four);
  - each sheet tab, unpinned, and pinned at 1300 and 1980;

  at 390, 768, 1300 and 1980. Save it as `tools/frame-fixture.json`. `phone-check`
  diffs the branch against it, and **any difference fails**.

## 11. Tests beyond the examples

- **No overflow:** every table screen at 390, 768, 1300 and 1980: `scrollWidth ===
  clientWidth`, and no element in `main` past the right edge outside a sideways
  scroller (the pre-flight's rule; phone-check).
- **The header and the bar:** at 390×844, the header and the bar together are ≤ 20%
  of the screen (`HEADER_MAX_SHARE`). The bar is one row (≤ 48px) on every page.
- **The contrast guards** (`build.test.mjs`) run over the new rules as they stand.
- **The data guard (135):** no id literal added.
- **Mutation-test** each, and record in the PR what caught it. Commit first; save the
  file, mutate it, run under a `timeout`, copy the saved file back, never with
  `git checkout`:
  1. `renderHome` not removing `table-mode` → **L1** (Home after a table);
  2. `table-mode` set on the sheet too → **L9** (the sheet moves);
  3. `.table-mode .roster-list` written unscoped (`.roster-list`) → **L9** (Home's
     roster moves);
  4. one Back left out of its bar → **L6**;
  5. the bar a copy of Back (the original left in place) → **L6** (two buttons with
     the attribute);
  6. the prose measure applied inside `.ro-sheet` → **L2**;
  7. the frame rules placed before the wizard's narrow rules → **L1/L9** at 768
     (the 13px strip comes back).

## 12. Steps

`git submodule update --init private`, then `npm run test:fast` (a fresh branch).
**Commit at the end of each step.**

1. Take N: the lowest free on `origin/main`. Search the ledger again for §5's names.
2. **The fixture, first:** build `tools/frame-fixture.json` on `main`'s CSS, then
   commit it **before any CSS change**. Run `phone-check` to see it pass against
   itself.
3. **The class and the frame:** `table-mode`, the grid, no cap. L1. Then
   `phone-check`: the fixture diff must be zero.
4. **The measures:** fields, prose, lists, encounter rows. L3–L5 in `phone-check`.
5. **The bar:** the 8 Backs and Add to, and the encounter's Back into `.enc-bar`. L6,
   L7.
6. **A member's page** (SQ4). L8a, L8.
7. **In the browser** (`shadows-dev-preview`, `?gm=on`, the sample table plus one
   seat, as the pre-flight did). **Report every number. A missing number is a
   should-fix.**
   - For every table screen at **390, 768, 1300 and 1980**: `main`'s box, overflow
     (the pre-flight's rule), the widest field, prose block and card, cards a row.
   - **L2's** columns for the read-only sheet and the player's sheet, side by side.
   - The bar: its height at 390, header + bar as a share of 390×844, and that it
     stays under the header after scrolling 2000px on a session and 4000px on an
     encounter.
   - **Keyboard:** Tab from the header into a member's page: the bar's buttons first.
     Back by Enter lands where it did.
   - **Both themes:** contrast of the bar's text and ground, and its focus ring
     (≥ 4.5:1 and ≥ 3:1).
   - `npm run phone-check`, with the fixture diff's line.
8. The mutations (§11).
9. **The docs:**
   - the ledger: N, and 211's mark **in both SCHEMA and INDEX**;
   - INDEX;
   - the plan's row → *Built*;
   - `gm-mode/README.md`'s row;
   - W80 and W77's *Plan* lines (W80 keeps Home open);
   - STATE;
   - every hit of §5's last row;
   - `changelog-pending.md`.

## 13. Stop and ask

- N is taken, or the ledger search finds a decision this overrides that the
  pre-flight doesn't name.
- **The fixture diff isn't zero** and the fix isn't scoping a rule to `.table-mode`.
- A page needs a bar label, or a button that doesn't exist today.
- A Back's handler or focus target has to change for the bar.
- Any change to `index.html` (constraint 3).
- An existing test needs a change.
- **Expected not to break:** `smoke-wizard.test.mjs:726–732` (the wizard's narrow
  rules, left as written); `smoke-table-cast.test.mjs:1219–1221` (the filter tracks);
  `smoke-table-play.test.mjs:1610` (the Turns group outside the bar);
  `smoke-table-seats.test.mjs:155` (DOM order); the contrast guards. If one fails,
  it's a real break: stop.
- phone-check's known OVER rows on the player sheet's HP pill are not a stop.

## 14. Close-out

*Rule or shape*, switched off: **no version bump, no schema bump, no `private/`
commit** (say each in the PR body).

- **SCHEMA:** N, and 211's mark.
- **INDEX:** N under **GM mode**, and 211's line marked. After the voice pass, re-read
  N against Ken's picks.
- **`changelog-pending.md`:** the ✎ line.
- **STATE:** the GM row and §4's *what's next*.
- **The log:** an entry naming what the pre-flight found (the empty 466px at 1300, the
  1905px fields with the cap lifted alone, the read-only sheet matching the player's
  sheet, the 13px strip), plus a row in `docs/log/shipped.md`.
- **The plan, its README, W80 and W77**, as step 9 says.
- **PR title:** `feat(gm): a table gets its own frame, a measure for every page, and Back in a bar, switched off (S18, Decision N)`.
- **PR body:** the template's sections, plus:
  - **the browser numbers** (step 7), every one;
  - **the fixture diff's line**;
  - **the mutations**, each with what caught it;
  - **Where the order didn't fit** (empty is fine).

**Review checklist** (beyond the tests passing):
- **Re-do the twin sweep by grep:** every selector on `.app`, `main`, `nav.ledger`,
  `aside.vitals` and `.roster-list`, and every renderer that draws a Back. Name why
  each new rule can't reach Home, the wizard or the sheet.
- **Run `phone-check` yourself on `main` and on the PR:** the fixture diff is zero,
  and the table numbers are the PR's.
- **The read-only sheet against the player's sheet** at 1300 and 1980, by hand.
- **Every Back by hand**, from the page it's on, with the keyboard: it lands where it
  did. Find → a member → Back. The encounter's Back mid-fight.
- **The bar on a phone** (390×844) and a phone on its side (844×390): one row, and it
  lets go on a short screen and when a field has focus.
- **Both themes, both contrasts**, measured.
- **The voice pass**: the changelog line, drafted side by side in the first review.

## 15. Handing it over

**To the builder:** `WORK-ORDERS.md`'s building prompt, with this order's path
(`docs/plans/gm-mode/S18-layout-pass.md`). Add these traps:

- **Record the fixture before you touch the CSS.** A fixture taken after the first
  change proves nothing. Commit it on its own.
- **Scope every rule to `.table-mode`.** `.roster-list` and `main` are Home's too.
  The fixture diff is the guard. Don't argue with it.
- **Add after the wizard's narrow rules; don't edit them.** `.app:not(.sheet-mode)`
  is pinned as a literal in `smoke-wizard.test.mjs`. Equal specificity, later in the
  file, wins.
- **Move each Back, don't copy it.** Every handler and focus target finds it by its
  attribute. Two copies pass a quick look and fail L6.
- **Overflow inside a sideways scroller isn't overflow.** The read-only sheet's tab
  row and the Reference's jump bar scroll by design. Measure outside them.
- **The read-only sheet is the sheet's layout.** Keep the measures out of `.ro-sheet`,
  or L2 fails.
- **Commit before mutating, and restore by copying a saved file back, never with
  `git checkout`.**
- **Report the browser numbers in the PR body.** The order names every one.
- **Fill N everywhere at build time**, comments and test names included.

**To the reviewer:** `WORK-ORDERS.md`'s reviewing prompt, with this order's path, the
builder's session id, and the checklist in §14. Draft the voice pass for the
changelog line in the first review, side by side, and **paste the table into the
message to the conductor and onto the PR**.
