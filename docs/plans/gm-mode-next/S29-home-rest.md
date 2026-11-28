# Work order S29: Home's rest

**Plan:** [`../gm-mode-next.md`](../gm-mode-next.md), session S29. **The ask:** W80 (Ken, 2026-10-08), "the left column:
the page's actions, or gone", **use it or remove it**. S18 removed the column from a table's screens (Decision 258) and
left Home as it was (S18's SQ5, Ken 2026-10-30: "Home stays", with "W80 keeps a line for Home's layout"). Home is the last
screen with an empty column, and it is the first screen every player and every GM sees.
**Status:** **drafted 2026-11-27** by Claude (Opus, the S30 PR 2 reviewer), at the conductor's request (Ken chose S29 on
2026-11-27). **Approved by Ken 2026-11-27**, in the conductor session, both questions on their default: GQ101 "Remove it", GQ102 "560px column, centred".
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs beside:** nothing.

**Pre-flight** at `d581a47` (`main`, after S30 PR 2's #411 and 0.81.0's release heading, #412). Measured in the dev preview,
on Home with three characters and *Dead Air* in the roster:
- **Home has no frame class.** `renderHome()` removes `sheet-mode` and `table-mode` (`wizard.js` ~910) and adds nothing,
  so `.app` keeps the default grid: `var(--rail-w) 1fr var(--vitals-w)` (218px | 1fr | 248px, `shadows.css` ~69).
- **The left column is drawn, empty.** `renderLedger()` empties `#ledger` on every screen but the wizard (`wizard.js`
  ~10–13), but nothing hides it on Home: `nav.ledger` is `display:block`, 218px wide, the panel's background, and a 1px
  right border, the full height of the page.
- **The right track is empty, and still takes its width.** `aside.vitals` is empty on Home (`renderVitals`, `wizard.js`
  ~41: no character) and `aside.vitals:empty{display:none}` hides it (~348). The grid still reserves 248px for it.
- **`main` is capped at 920px** (`shadows.css` ~131) and starts at 218px, so Home's 560px column (`.home-hero`, ~362) is
  centred in `main`, not on the screen. At **1300×900** the column's centre is 628px against the screen's 650px. At
  **1980×1100** it is **678px against 990px**: 312px left of centre, with about 840px of nothing on its right.
- **Below 1060px the empty column becomes an empty strip.** `.app:not(.sheet-mode) nav.ledger{display:flex; …;
  border-bottom:1px solid; padding:6px 8px}` (~1258) draws a **13px band with a bottom border** under the header, at
  **1024px** and at **375px**. `main` starts at 70px instead of 57px.
- **No sideways scroll today.** `scrollWidth` = `clientWidth` at 375, 1024, 1300 and 1980.
- **Home's actions are at the top of its own page:** New character and Import a file under the title, then *Your
  characters*, *Your tables* and *Your packs*, What's new, Print a blank sheet, and Run a table (`wizard.js` ~915–930,
  `gm.js` ~282–296). Everything on Home is inside `.home-hero` (560px). Nothing else draws into `main` on Home: `notice()`
  is a toast (`shared.js` ~977) and the read-in readout is an overlay.
- **Every door into Home calls `renderHome()` directly, not `renderMain()`:** `goHome()` (`shared.js` ~94), the header's
  Home, boot (`app.js` ~432), Remove or Export of a character, table or pack (`wizard.js` ~903, ~943; `gm.js` ~324, ~338,
  ~3533, ~3579), and a table that's gone (`gm.js` ~693). **Every door out goes through `update()` → `renderMain()`**, which
  toggles `sheet-mode` and `table-mode` (`app.js` ~193): New character, Open, Import, `openTable()` (`gm.js` ~207).
- **Prototyped** (§9's three edits, in a scratch copy of this commit): Home is one column at every width, the band is gone
  (`main` starts at 57px at 375px), the column's centre is 983px against 990px at 1980 (the difference is the
  scrollbar), and the wizard, a sheet and a table keep their classes through every door above. phone-check on the
  prototype fails only its frame fixture, and only on Home's four frames (§13).

### Carried over (S30's review)

- **Say where every press leaves the view, for the existing case as well as the new one.** S30's §9 pinned only New note,
  and the builder pinned every Edit until Ken ruled. Here: §9's door table covers every way into Home and every way out,
  not only the one that creates something.
- **When a sweep row says a generic mechanism covers something, read that mechanism.** S30 said `noteCards` "diffs" and
  undo lost typing. Here the mechanisms are the cascade below 1060px and `renderMain()`'s class toggle. Both are read and
  quoted in §5, and the order of the rules is a test (§10).
- **If a press redraws, the order names the focus after it.** This order changes no press and no redraw. §9 says so, and
  the review checks that focus on Home lands where it does on `main`.

## 1. Goal and Done when

**Goal.** Home stops drawing a column with nothing in it. It is one column, centred on the screen, at every width, for a
player and a GM alike.

**Done when:**
1. On Home, at every width, no `nav.ledger` is drawn: no 218px panel from 1060px up, and no 13px band below it.
2. Home's 560px column is centred on the screen (within the scrollbar's width) at 1300 and 1980.
3. The wizard, a character's sheet and a table look exactly as they do on `main`: phone-check's frame fixture changes for
   Home's frames only.
4. Every door into Home gives it the new frame, and every door out takes it away (§9).
5. Nothing scrolls sideways at 375px (`npm run phone-check`).

## 2. Tier, versions, numbers

**Fix (UI)**, as the plan's row and S18's SQ5 both size it ("a player-visible change: an app patch and a `CHANGELOG.md`
line").
- **App:** a patch, joining `[Unreleased]` if one is open by then. 0.81.0 has its release heading on `main`
  (`d581a47`), so as of this draft that's **0.81.1**.
- **Game data, character, table and pack schemas:** none.
- **Decision:** none. This applies Ken's own rule in W80 ("a screen with nothing to put there gives the column back to the
  page") with the reasons Decision 258 already weighed. See §3 for why it stays a Fix, and GQ101 for the one way it
  wouldn't.
- **Flags:** none.

## 3. The decisions, drafted

None. **Why this isn't *Rule or shape*:** the tier table asks whether someone could reasonably have chosen the behaviour
otherwise. The choice W80 offers was made in S18, for the same reasons Home has:
- **A rail on Home** would hold Home's actions, which already sit at the top of Home's page. Decision 258 rejected
  W80's action rail for a table as "two homes for one button; a tablet sees only the bar", and both halves hold here:
  below 1060px (every phone and most tablets) the rail can't show.
- **Removing the column** is what W80 says to do when there is nothing to put in it, and what 258 did to the table's
  screens. 258's *Revisit if* names this order ("Home gets its own layout (W80's rest)"). This doesn't change 258: its
  "Home, the wizard and a player's sheet don't move" was that order's scope, and stays true of that order.

If Ken wants Home to use the room instead (GQ101 (b)), this becomes *Rule or shape* with a decision, and the order is
redrafted.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| **GQ101** | **Home's empty column: use it or remove it** (W80). (a) Remove it: Home is one centred column at every width, as a table's screens are (258). (b) Use it: a rail holding Home's actions (New character, Import a file, Run a table) from 1060px up, and nothing below it | **(a).** Those actions are already at the top of Home's page. Below 1060px (phones, most tablets) a rail can't show, so (b) would give the same buttons two homes, which 258 rejected for the same reason |
| **GQ102** | **Home's width on a wide screen.** (a) The 560px column it has today, centred on the screen. (b) The roster and the tables widen into a grid of cards, two or three across, as a table's lists do (258, 271) | **(a).** It's the fix W80 asks for and nothing else: a player sees the same column, just centred. (b) is a new layout: a decision, a review of the card at every width, and a wish of its own if Ken wants it |

## 5. The assumption sweep

Every row was found by grepping the readers at `d581a47`.

| What | Today (where) | After |
|---|---|---|
| `.app`'s classes on Home | none: `renderHome()` removes `sheet-mode` and `table-mode` (`wizard.js` ~910) | `home-mode`, added there |
| `renderMain()`'s class toggles (`app.js` ~193) | `sheet-mode` when `S.screen==="sheet"`, `table-mode` when `"table"` | also toggles `home-mode` off on every screen that isn't `"home"`. **Read:** `renderMain()` returns early into `renderHome()` for `"home"` (~199), after the toggles, so either place can set it; the class must be added in `renderHome()`, because most doors into Home skip `renderMain()` |
| `.app`'s grid (`shadows.css` ~69) | `var(--rail-w) 1fr var(--vitals-w)` on Home | `.app.home-mode{grid-template-columns:1fr}` |
| `nav.ledger` on Home (~110, ~1258) | drawn and empty: a 218px panel from 1060px, a 13px bordered band below | `.app.home-mode nav.ledger{display:none}` |
| `aside.vitals` on Home (~342–348) | hidden by `:empty`; its 248px track stays | `.app.home-mode aside.vitals{display:none}`, so it never depends on `:empty` |
| `main`'s cap (~131) | 920px, from 218px | `.app.home-mode main{max-width:none}`; `.home-hero` (560px, `margin:48px auto 0`) centres itself |
| **The cascade below 1060px** (~1256–1262, ~1359–1361) | `.app:not(.sheet-mode) nav.ledger{display:flex}` and `.app:not(.sheet-mode) main{order:2}` | **Read:** `.app.home-mode nav.ledger` ties `.app:not(.sheet-mode) nav.ledger` on specificity (0,2,1), so it wins only by **coming later in the file**. Put the four `home-mode` rules beside `.app.table-mode`'s (~1391), which sit after both blocks for the same reason (the comment at ~1388 says so). `main{order:2}` is harmless with the band gone |
| `--strip-off` (~1360, ~1384) and `--vstrip-live` (`app.js` ~389) | the wizard's sticky line; on Home `aside.vitals` is empty, so 0 | unchanged |
| Other `:not(.sheet-mode)` rules | only the four above (`grep -n ':not(.sheet-mode)' src/styles/shadows.css`) | unchanged |
| `tests/smoke-table-frame.test.mjs` ~15–32 (*258: a table's frame is table-mode, and Home, the wizard and the sheet aren't*) | `cls()` reads only `table-mode` and `sheet-mode`; asserts Home has neither | `cls()` also reads `home-mode`. Home is `home-mode`; the table, the sheet and the wizard aren't. **Expected change** (§13) |
| `tests/smoke-wizard-steps.test.mjs` ~777 | asserts `.app:not(.sheet-mode) main{order:2}` exists | unchanged: the rule stays |
| `tools/phone-check.mjs` frame fixture (`tools/frame-fixture.json`, ~121–145) | records the header, rail, `main`, vitals and a hash of `main`'s boxes on Home, every wizard step and every sheet tab, at 390, 768, 1300 and 1980 | Home's frames change at all four widths (the rail goes, `main` moves). **Re-record**, then `git diff tools/frame-fixture.json` must show Home's entries only. **Expected change** (§13) |
| `phone-check`'s own Home pass (`tools/phone-check.mjs` ~180–182, ~1328–1331) | measures Home and its What's new; `mustFit` skips Home's name check | unchanged; it must still print "Every width fits" |
| Help (`syncHelp`, Decision 278; the sheet's K1) | Home has no Help column; `renderHome()` calls `syncHelp()` to close a table's | unchanged |
| The toast and the footer | positioned against the viewport | unchanged |
| Copy | nothing on Home names the column, the rail or the left side (`grep -n -i "left\|rail\|column" ` over `renderHome` and `gm.js` ~282–296) | no copy changes |
| Decision 258's *Revisit if* | "Home gets its own layout (W80's rest)" | happened: the log entry and W80's move to `wishes-granted.md` say so. 258 is not superseded (§3) |
| Decision 211's *Revisit if* (`SCHEMA.md` ~4902) | "W80's action rail gives these buttons one home" | can no longer happen. Read, not changed: a ledger entry's *Revisit if* is history |

## 6. Read first

`CLAUDE.md` (constraint 3: no markup in `index.html`; the change tiers). SCHEMA §4: Decisions **258** (a table's frame),
**35** (the sheet's), **161** (the wizard below 1060px), **141** and **171** (what Home lists). S18's order,
`plans/archive/gm-mode/S18-layout-pass.md` (SQ5). `shadows.css`: the frame (~69–131), the left rail (~110–128), the
narrow block (~1256–1262), the wizard's sticky line (~1350–1386), `.table-mode`'s frame (~1386–1394), Home (~362–365,
~1495–1508). `wizard.js`: `renderLedger` (~10), `renderVitals` (~39), `renderHome` (~909). `app.js`: `renderMain`
(~189).

## 7. Out of scope

- **A rail on Home, or anything put in the left column** (GQ101 (b)).
- **Widening Home's lists into a grid** (GQ102 (b)).
- **The wizard's rail and its strip below 1060px**: the one screen that uses the column (W80). Nothing about it moves.
- **Moving or restyling Home's buttons, its roster cards or its sections.** Only the frame around them changes.
- **`index.html`.** `nav.ledger` and `aside.vitals` stay in the shell (constraint 3); CSS hides them.

## 8. The shapes

None. No data, no saved file, no engine function. `S.screen` already says `"home"`.

## 9. The UI

**The frame.** A class on `#app`, `home-mode`, while Home is open, and four rules in `shadows.css` beside
`.app.table-mode`'s (§5 says why they must come after the narrow block):
```css
.app.home-mode{grid-template-columns:1fr}
.app.home-mode nav.ledger,
.app.home-mode aside.vitals{display:none}
.app.home-mode main{max-width:none}
```
The rules are a suggestion; the class is what the tests read. **One shortcut that doesn't work:** `nav.ledger:empty{display:none}`
alone. The grid keeps its three tracks, and `main` is auto-placed into the first one, the 218px track the rail left.

**Where the class lands, for every door.** Nothing is stored; nothing a press does changes.

| Door | Code path | `#app` after |
|---|---|---|
| Boot, with no character open | `renderHome()` (`app.js` ~432) | `app home-mode` |
| Header **Home**, from the wizard or a sheet | `goHome()` → `renderHome()` | `app home-mode` |
| A table's menu **Home**, or a table that's gone | `goHome()`, or `S=homeState(); renderHome()` (`gm.js` ~693) | `app home-mode` (and not `table-mode`) |
| Remove or Export a character, table or pack, on Home | `renderHome()` | `app home-mode` |
| **New character** | `update()` → `renderMain()` | `app` (the wizard: the rail is back) |
| **Open** a character (locked / not) | `openEntry()` → `update()` | `app sheet-mode` / `app` |
| **Import a file** (a character, a table, a pack) | `update()`, `openTable()` or `gmImportFile()` | the screen it opens, without `home-mode` |
| **Run a table**, a table card's **Open** | `openTable()` → `update()` | `app table-mode` |

**Focus.** No press, redraw or focus move changes. Home draws as it does on `main` and its buttons hand focus where they
do now. The review checks focus after the header's Home from a sheet, and after Remove, against `main`.

**Copy.** None.

## 10. Worked examples, as named tests

Each fails on `main`.
1. `tests/smoke-table-frame.test.mjs`, the existing *258: a table's frame is table-mode, and Home, the wizard and the
   sheet aren't*, renamed **`"S29: Home is home-mode at every door, and the wizard, the sheet and a table aren't"`**. `cls()`
   reads all three classes. Home at boot is `home-mode`; a table, then Home → `home-mode` only; a sheet, then Home (header)
   → `home-mode` only; New character → none; Home (header) from the wizard → `home-mode`; a table opened from Home →
   `table-mode` only. Add one door the old test doesn't: Remove a character on Home → still `home-mode`.
2. `tests/smoke-table-frame.test.mjs`, **`"S29: Home's frame rules hide the rail and the vitals column, uncap main, and
   come after the narrow block"`**. Read `src/styles/shadows.css`: the four rules exist, and each starts after the last
   `.app:not(.sheet-mode) nav.ledger` rule in the file (by index), so the cascade can't lose them to a later
   `:not(.sheet-mode)` rule.
3. **phone-check** (not in `verify`; run by hand and by the review): Home's re-recorded frames have the rail at zero size
   and `main` at x = 0 at all four widths. At 390, `main`'s top equals the header's bottom.

## 11. Tests beyond the examples

- **Mutation-test:** drop `home-mode` from `renderHome()` (1 fails at boot); drop the toggle from `renderMain()` (1 fails:
  a sheet opened from Home is `sheet-mode home-mode`); move the four rules above the narrow block (2 fails). For each,
  check that no second path already covers the line. A toggle in `renderMain()` alone would pass the boot assertion if
  boot ran through `renderMain()`, and still fail every direct `renderHome()` door, so test 1 must include `goHome()` from
  a sheet and Remove on Home.
- **No new string**, so `voice.test.mjs` has nothing new to read.
- **Phone:** `npm run phone-check` prints "Every width fits", and the fixture's diff is Home's alone.

## 12. Steps

1. Baseline: `git submodule update --init private`, `npm run test:fast`.
2. Write §10's 1 and 2; show them failing on `main`.
3. The class (`renderHome()`, `renderMain()`) and the four rules. `npm run test:fast`, `npm run test:table`,
   `npm run test:wizard`.
4. `npm run phone-check -- --record-fixture`, then `git diff tools/frame-fixture.json`: Home's entries only. Then
   `npm run phone-check` without the flag.
5. The dev preview: Home with a roster and *Dead Air* (the samples line in `CLAUDE.md`), at 375, 1024, 1300 and 1980.
   Then each door in §9's table.
6. Close-out (§14). Full `npm run verify` with its output to a file, and record the exit code.

## 13. Stop and ask

- **Stop** if:
  - the fixture's diff moves a frame that isn't Home's (a rule reached the wizard or the sheet);
  - Home needs a markup change in `index.html` (constraint 3);
  - any element in `main` on Home sits past the viewport's right edge at 375px after the change.
- **Expected, not stops:** the rename and the new assertions in *258: a table's frame…* (§10, 1); Home's entries in
  `tools/frame-fixture.json`; the CHANGELOG and version literals the patch bump moves (`docs.test.mjs` checks them).
- **phone-check on the prototype** (at the pre-flight, without `--record-fixture`): exit 1, on one row only, the
  frame fixture: *"4 differ: home @390; home @768; home @1300; home @1980"*. Every other check passed. That row is the
  expected break, and re-recording clears it.

## 14. Close-out

The `close-the-session` skill for **Fix**, player-visible:
- `CHANGELOG.md` under `## [Unreleased] — app 0.81.1` (or the open heading), *Character sheet* (Home is the player's
  door): "**Home sits in the middle of the screen.** The empty column down its left side is gone, and so is the empty band
  under the header on a phone." Drafted for the voice pass. Then `npm run changelog`, and `npm run bump -- 0.81.1` if no
  `[Unreleased]` is open.
- **W80** moves to `log/wishes-granted.md` (Home was its last screen); the plan's S29 row reads built. The log gets an
  entry (a Fix normally skips it; this one closes a wish and meets 258's *Revisit if*). A row in `log/shipped.md`. STATE's
  GM mode row only if its "what's next" names S29.
- INDEX: nothing (no decision, no finding id).

**PR title:** `fix(ui): Home is one column, centred (S29, W80)`. **PR body:** the template's sections, plus
**Screenshots** (Home at 375 and 1980, before and after), **phone-check** (its last line and the fixture diff's
file list), and **Where the order didn't fit**.

**Review checklist:**
- §1's checks, in the dev preview at 375, 1024, 1300 and 1980, with a roster and *Dead Air*: no band, no panel, the column
  centred (within the scrollbar).
- Every door in §9's table, pressed in the preview, with `#app`'s class read after each.
- The wizard at 1300 and at 375 (its rail and its band are unchanged) and a sheet at 1300 (no rail, as on `main`).
- Focus after the header's Home from a sheet and after Remove on Home, against `main`.
- `npm run phone-check`, and `git diff tools/frame-fixture.json`'s entries are Home's only.
- The changelog line's voice.

## 15. Handing it over

The builder and reviewer prompts are in `WORK-ORDERS.md`, with this order's path. Its own traps:
- **Most doors into Home skip `renderMain()`.** Add the class in `renderHome()`. Removing it in `renderMain()` covers
  every door out. A class set in only one of the two places passes some doors and fails others; §10's test 1 walks them all.
- **The new rules win by their place in the file, not their specificity.** They tie the narrow block's
  `.app:not(.sheet-mode)` rules, so they go after it, beside `.table-mode`'s.
- **Re-record the fixture, then read its diff.** A Home-only diff is the proof that the wizard and the sheet didn't move.
- **Take the app version at build** from `origin/main`: join an open `[Unreleased]`, else bump the patch.
