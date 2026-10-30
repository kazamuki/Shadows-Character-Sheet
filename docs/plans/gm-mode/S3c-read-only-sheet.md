# Work order S3c — The read-only sheet: a seat's copy on the real sheet

**Plan:** [`../gm-mode.md`](../gm-mode.md) §6 *S3b* (*the read-only sheet*)
and *Still to build*'s S3c row; GQ13.
**Status:** **drafted 2026-10-30 by Claude (Opus)**, the S3b reviewer, after
#268 (S3b, Decisions 254–255) merged (`WORK-ORDERS.md`, step 7). **Ken chose
this session (2026-10-30).** Not yet approved.
**Branch:** from `main` at `1c5f6fa` or later, PR to `main`, switched off
(Decision 173). **No `private/` commit.**
**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md):
the conductor (Opus) starts **S3c build** (Sonnet), then a fresh **S3c
review** (Opus) once the PR is open. Builder and reviewer message each other
directly. Anything for Ken goes to the conductor. §15 is the hand-over.
**Runs alone.** It touches:
- `engine.js`: one reader, `seatCharacter`.
- `gm.js`: the seat's routes, a new page and its binder.
- `sheet.js`: the reading binders move into a shared function.
- `shared.js`: the tips' character.
- The CSS, the ledger and STATE.

**No schema moves.** The table schema stays 0.18 and the character schema
stays where it is: nothing is stored that wasn't. One decision, **N** below.

**Tier: Rule or shape.** A new way to open a seat and a new route, and an
architectural rule: how a character that isn't the open one can be drawn by
the sheet's renderers without one of the sheet's writers reaching it.

**Carried over from S3b's review** (#268: one fix round, then a copy-only
commit; Ken's answers are in issuecomments 6511643464 and 6516481344). Each
item is marked as the order's, the build's, or the process's:

- **The order's: a gate that undo re-runs, traced through one undo, not
  every undo.** The order said a removed seat's copy survives an undo. But
  `undoTableAction` re-runs the gate after *every* undo, so an unrelated
  undo first dropped the orphaned copy. The fix passes `keepCopies` to the
  gate on undo. **Here, §5 traces every path that re-draws or re-gates while
  the sheet is open**: an undo, a Replace, a Jot, a Find. The read-only view
  reads the copy fresh on every draw, so whatever the gate keeps is what it
  shows.
- **The order's: a file with no TAG got a fresh one from `migrate()` each
  time.** Ken ruled to refuse it. Here, the sheet only ever draws a copy the
  gate kept, under its own TAG.
- **The order's: the card's Pain and HP didn't match the sheet.** Ken ruled
  that they match it. **Here, the sheet is the sheet's own renderer**, so the
  numbers can't drift. The only copy this order writes is its own chrome
  (§9), listed for the voice pass up front.
- **The order's: "Changed" on the card read like the GM's own edit.** It
  became "File from". **This order's chrome reuses the card's wording as
  shipped** (*File from … · Imported …*) and writes no new date phrase.
- **The build's: a batch import's toast offered Undo for the last file
  only.** Here, nothing the read-only sheet does is undoable, so it shows
  no toast at all (E3 checks `#undotoast`).
- **The build's: a non-character object was refused as a draft.** Not
  reachable here: the sheet draws only a gated copy.
- **The build's: HP past zero read 0.** The sheet's own HP pill already
  draws past zero. E2 pins one.
- **Process: the builder hit a usage limit mid-round**, and the conductor
  restarted it. The order's steps end at a commit each, so a restart picks
  up from the last commit.
- **Process: Ken's voice pass reached the builder after its fix commits
  were pushed**, so it needed a second, copy-only commit. **§9's strings are
  named here, before the build.** The builder pastes them into the PR as
  they render. The reviewer drafts its rewrites in its first review, so
  Ken's picks land with the fix round.

**Pre-flight** (`docs/WORK-ORDERS.md`, *The pre-flight*) against `main` at
**`1c5f6fa`**, 2026-10-30. Every function below was opened and read. The line
numbers are `1c5f6fa`'s.

- **The write paths, counted by grep** (§5 gives each its row):
  - `commit(` at 129 sites in `sheet.js`; its definition is `shared.js:293`;
  - `update(` at 16 sites in `sheet.js`, 30 in `wizard.js`, 55 in `gm.js`
    and 3 in `app.js`;
  - `saveChar()` (`shared.js:161`), called from `update()` (`:282`) and
    from nothing else in the sheet;
  - `localStorage.setItem` once in `sheet.js`, for the traits' *Expand all*
    preference.

  Every call in `sheet.js` and `wizard.js` sits inside a binder:
  `bindSheet` (`sheet.js:3591`), `bindMain` (`wizard.js:890`), or a modal
  or popover those open. The binders are called in one place,
  `renderMain`'s sheet branch (`app.js:200`). **Writers that bypass
  `commit()`:** some handlers change the character and then call `update()`
  directly, for example Undo (`[data-undolast]`) and Clear the log
  (`ch.audit=[]`). So "no `commit()` reachable" isn't enough on its own.
  The rule this order builds is that **no sheet binder runs on the
  read-only page**, and that **the character drawn is never one a write
  could land on**.
- **`saveChar()` writes whatever `S.ch` holds** into the GM's roster
  (`shadows.char.v1.<TAG>`), on every `update()`. That includes every
  table press, because `update()` is shared. **So `S.ch` must be `null`
  whenever a handler can run.** If it isn't, the next table change seats
  the player's character in the GM's own roster.
- **The renderers read `S.ch`, `S.section` and `S.admin`, not
  `S.screen`.** `grep -n "S\.screen" src/ui/sheet.js` finds nothing. Probe:
  with `S.screen` left alone, every archetype renders every tab from a
  clone set into `S.ch` for the call, with no throw and no storage write
  (48 renders).
- **A renderer writes into the character it draws.** Probe: Loadout on a
  Cyborg sets `panelData.augments = []`, through `panelRows`
  (`shared.js:1084`, `if (!ch.panelData[key]) ch.panelData[key]=[]`).
  Drawn from the table's stored copy, that is a silent write: the copy is
  outside the activity log (254), so it would save with no entry and no
  undo. **So the sheet draws a fresh copy, never the stored one.**
- **`migrate()` changes its argument in place** (`engine.js:4787`,
  `_fillDefaults(c, …)`). So a fresh copy is
  `migrate(clone(stored))`, never `migrate(stored)`.
- **Some readers run when the page is used, not when it's drawn.**
  - `TIPS.stat` and `TIPS.crank` (`shared.js:562`, `:569`) read `S.ch`
    when the tip is shown. On the read-only page `S.ch` is null, so a stat's
    tip would show nothing.
  - `bindScrollRows` (`shared.js:794`) keys its memory by `S.section`.
- **Three things that draw with the sheet would draw wrong here:**
  - `sheetHeader` → `importIssuesHtml` (`shared.js:964`) shows *"Export
    the character now"* when `saveFailed`. The table draws its own banner
    for the same flag (`gm.js:318`), so the page would show both.
  - `loadIssuesHtml` (`:968`) empties `S.importIssues` as it draws.
  - `renderVitals` (`wizard.js:39`) and `renderLedger` (`:10`) are empty
    while `S.ch` is null, which is what keeps the wizard's rail off the
    table.
- **The sheet's layout class.** `renderMain` toggles `.app.sheet-mode` on
  `S.screen==="sheet"` (`app.js:179`). The sheet's CSS uses it for the full
  width and the hidden rail (`shadows.css:561–564`, `:1213`). The table
  screen never has it, so the read-only page draws in the table's column.
- **Tips need no binding.** They're delegated on `document`
  (`shared.js:592–624`), so a `data-tip` in the read-only page opens on
  hover, focus and tap, as it does on the sheet. A disabled `<button
  data-tip>` gets no click in a browser, so **a tip trigger must stay
  enabled**.
- **jsdom fires `onclick` on a disabled button through `dispatchEvent`**
  (probe: 1 of 1), while `.click()` doesn't. `smokekit`'s `clickIn` uses
  `dispatchEvent`, so E3 presses every control, disabled ones included: a
  writer bound to a disabled control still gets caught.
- **No attribute collides with the table's binders inside `<main>`.** The
  sheet's markup and `gm.js`'s selectors share `data-act`, `data-sec`,
  `data-tip` and `data-modalclose`. Only `[data-act]` is queried by
  `gm.js` (`:395`), and only inside the Activity modal's body.
- **Print takes a character.** `printSheet(ch)` (`app.js:216`) and
  `renderPrintView(ch)` (`sheet.js:2830`) read no `S`. `print.css` hides
  `#app` and shows `#printSheet` on any screen.
- **The seat's routes today:** `openSeat` (`gm.js:3575`) is the card and
  its name; `openFound`'s `seat` kind (`:455`) is Find; the tab binder
  clears `S.seatOpen` (`:276`); Back is `[data-seatback]` (`:3627`); Remove
  is `:3669`. `seatPageNow` (`:3436`) reads `S.seatOpen` only.
- **Engine:** `_copyOf(t, tag)` finds the stored copy. Nothing exported
  returns a character; `seatView` returns the card's numbers (`:7714`).
- **The ledger.** Decision 255's *Rejected* lists "Opening the sheet from a
  card now: the read-only sheet is its own order (S3c)", and its *Revisit
  if* is "S3c builds the read-only sheet (a card opens it)". So N replaces
  255 in part. 254's *Revisit if* ("S3c or S3d needs more of the copy than
  its file") hasn't happened: the sheet reads only the file. Also searched,
  by name: *read-only*, *readOnly*, *GQ13*, *printSheet*, *TIPS*, *tip*,
  *bindSheet*, *commit*, *saveChar*, *roster*, *Decision 139*, *Decision
  141*, *Decision 160*, *Decision 172*. They are cited where they bear, and
  nothing else is superseded.

## 1. Goal

A GM reads a seated character the way its player sees it: the real sheet,
every tab but Admin, every number and rule tip as the sheet draws them. And
nothing on that page can change the character, the table, or the GM's own
roster.

**Done when:**
- A card whose seat has a copy opens the **read-only sheet** on Main, and
  every tab but Admin draws from that copy.
- No press, key or typed value on the page changes the stored table or
  creates a roster entry, and `S.ch` is null whenever a handler can run
  (E3).
- Every control that would write is inert: buttons and selects disabled,
  fields read-only. Every enabled control only reads: a tip, a tab, a jump,
  a description toggle (E4).
- A stat's tip reads the copy (E5).
- The page names whose sheet it is and how old the copy is, and goes to the
  seat's page and back. **Print** prints the copy (E7, E10).
- Find opens a seat the way its card does (E8). The sheet closes when its
  seat goes (E9).
- Every guard in §11 is mutation-tested.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (see the header).
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** **no bump** (68).
- **Table schema:** **unchanged** (0.18). Nothing is stored: which tab the
  sheet is on is UI state, like `S.seatOpen`.
- **Character schema:** unchanged. **Pack schema, ruleset:** unchanged.
- **`private/`:** untouched.
- **Decision:** the next free number, **N**.

## 3. The decision, drafted

Paste it after the last decision, under INDEX §3's **GM mode** heading, and
fill in **Built** with the PR number. It must stay under 350 words, Touches
included (`wc -w`). It is worded for the defaults; a different answer to an
SQ rewords it.

```
N. **A seat's copy reads on the real sheet: the sheet's own renderers draw a fresh copy from the engine, no sheet binder runs on it, and every control but a reader is inert.**
     *2026-10-XX · Ken + Claude · Touches: read-only sheet, seatCharacter, seat card, seat page, openSeat, openFound, Find, Print, SHEET_RENDER, bindSheet, bindMain, bindSheetReaders, commit, update, saveChar, S.ch, roster, TIPS, tips, importIssuesHtml, panelRows, GQ13, Decision 139, Decision 141, Decision 254, Decision 255*
     - **Decided:** A card whose seat has a copy opens the read-only sheet: every tab but Admin, drawn by the sheet's own renderers from `Engine.seatCharacter`, a migrated clone that is never the stored copy. `S.ch` holds it only for the draw. No sheet binder runs; a shared one binds the readers (tabs, jumps, descriptions), tips work as on the sheet, and every other control is disabled or read-only. The page says whose sheet it is and how old the copy is, prints it, and leads to the seat's page. Find opens a seat the same way.
     - **Why:** the GM reads the sheet its player sees, so its numbers can't drift from a summary (S3b's Pain and HP). A clone and an empty `S.ch` make a write impossible rather than merely unbound: a renderer writes into what it draws (`panelRows`), and `saveChar` saves whatever `S.ch` holds.
     - **Rejected:**
       - A `readOnly` flag threaded through the sheet's 129 `commit()` sites and 16 `update()`s: every new control is one more place to forget.
       - Opening the copy on the sheet's screen with `S.ch` set: the next table press saves it into the GM's roster.
       - Hiding the write controls: the condition chips and steppers are how the sheet shows state.
       - A summary card and the printed sheet only (GQ13's fallback): the real sheet measured cheap.
     - **Replaces:** Decision 255 in part (a card with a copy opens the sheet; the seat's page is a press away).
     - **Revisit if:** S3d shows the GM's scratch hits on the sheet, a player wants a view-only sheet, or a renderer needs bound state to draw.
     - **Built:** switched off (173); PR #…; log 2026-10-XX.
```

**Supersession marks.** Put the mark on the ledger entry **and** on its INDEX
line, both by hand: `docs.test.mjs` doesn't see a missing ledger mark. Add
it as its own line below the existing marks.

- 255: *→ **Superseded in part by Decision N** — a card with a copy opens the
  read-only sheet; the seat's page is a press away.*

If the ledger search at build time finds another, stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **What a card opens.** A card whose seat has a copy opens the **read-only sheet**; the seat's page (status, names, Replace, Remove) is a press away from it. A seat with no copy still opens its page. 255's *Revisit if* expected this. Or keep the card on the seat's page, and put **Read the sheet** there? | **The sheet** | |
| SQ2 | **The write controls.** Keep them where they are, **disabled** (buttons, selects, checkboxes) or **read-only** (fields), so the page has the sheet's own layout and its chips still show state? Or hide them? Hiding moves the layout and loses what a pressed chip shows. | **Disabled in place** | |
| SQ3 | **The tabs.** Every tab but Admin: Main, Skills, Character, Trackers, Progression, Sessions, Loadout & Powers, Notes. Or fewer? | **All but Admin** | |
| SQ4 | **The vitals pills.** The pills show their numbers but don't open, since their popovers hold Hurt, Heal and Spend. Or build read-only popovers too? That's more renderer work for numbers the pill already shows. | **Pills shown, not opened** | |
| SQ5 | **Print.** The page has **Print**, which prints the copy as a player's Print does. Or no Print? | **Print** | |
| SQ6 | **Find.** A seat found by Find opens the way its card does. Or always its page? | **The way its card does** | |

## 5. The assumption sweep

Every reader below was found by grep on `1c5f6fa`. The last column answers the
three questions for each row: which guards read it, where it renders, and what
text points at it.

| What changes | Today, where | After | Readers and twins |
|---|---|---|---|
| **The sheet's writers: `commit()`** | 129 sites in `sheet.js`; the definition is `shared.js:293`. Every site is in `bindSheet` (`sheet.js:3591`) or in a modal or popover a `bindSheet` handler opens | **Not one is reachable from the read-only page**: `bindSheet` isn't called there | `commit()` returns early on a null `S.ch` (`:294`), which is a second safety, not the guard. The guard is E3 (behaviour) and the static guard in §11. The spell picker, the catalog, Raise, Buy, the Minor and Major choices and the aberration picker are all opened from `bindSheet` handlers: `grep -n "openModal" src/ui/sheet.js`, each opener checked |
| **The sheet's writers: `update()` and direct writes** | 16 `update(` sites in `sheet.js`, among them `ch.audit=[]`, `Engine.undoLastAction(ch)` and the `lite` save for typing | Unreachable, as above | Each is in `bindSheet` (`grep -n "update(" src/ui/sheet.js`, every hit read) |
| **The wizard's writers** | `bindMain` (`wizard.js:890`), 30 `update(` sites | Not called by the read-only page | `renderMain` calls `bindMain(); bindSheet();` in its sheet branch (`app.js:200`) and `bindMain()` in the wizard's. **Static guard (§11):** `bindSheet(` and `bindMain(` are each called only from `renderMain` |
| **`saveChar()` and `S.ch`** | `update()` → `saveChar()` (`shared.js:282`, `:161`), which writes `S.ch` to `shadows.char.v1.<TAG>` | `S.ch` is set only inside `drawReadOnly`'s `try`, and restored in its `finally` | Every `update()` in `gm.js` (55) runs `saveChar()` first, so `S.ch` must be null by the time any handler runs (E3, E12). `renderVitals` and `renderLedger` stay empty because `S.ch` is null. **Static guard:** `gm.js` assigns `S.ch` only inside `drawReadOnly` |
| **The character drawn** | none; `_copyOf` (`engine.js`) is internal | `Engine.seatCharacter(t, tag)`: `migrate(clone(stored))`, or null (§8) | `panelRows` (`shared.js:1084`) writes into what it draws (a Cyborg's Loadout), so the clone carries weight (E3 with a Cyborg; mutation 1). `migrate()` changes its argument in place, so the clone comes first (mutation 2) |
| **What the renderers read** | `S.ch`, `S.section`, `S.admin` (`sheet.js:125`, `:132`, `:1724`, `:1935`, `:1949`, `:2984`, `:2989`, `:3819`) | During the draw: the copy, the read-only tab, `admin:false` | `S.screen` stays `"table"` (no renderer reads it). `landedNow` and `issuedNow` stay null: only `renderMain`'s sheet branch sets them. **E11** pins that a draw leaves `S` as it was |
| **The sheet's banners** | `sheetHeader` (`sheet.js:39`) → `importIssuesHtml` (`shared.js:964`): `saveFailed`'s *"Export the character now"*, then `loadIssuesHtml` (`:968`), which empties `S.importIssues` | During the draw, `saveFailed` reads false and `S.importIssues` is empty; both are restored | The table's own banner (`gm.js:318`) is the one that shows (E11). **Twins:** the banner text's only other reader is the player's sheet, unchanged |
| **Tips** | `TIPS.stat`, `TIPS.crank` read `S.ch` when shown (`shared.js:562`, `:569`); `tagChipsHtml` reads `TIPS[kind]` when drawn | Both read `tipChar()`: `S.ch`, else the character the read-only page last drew | Delegated on `document`, so nothing to bind. `tipChar()` is null once the page isn't drawn (E5, mutation 4). The other tips read the glossary only |
| **The reading binders** | In `bindSheet`: `[data-gotab]`, `[data-skilldesc]`, `[data-derivdesc]`, `bindScrollRows`; `[data-jump]` → `jumpTo` (`shared.js:814`); `[data-traits-all]` writes a preference | Moved into **`bindSheetReaders(main, goTab)`** in `sheet.js`, called by `bindSheet` (with the sheet's tab change) and by the read-only binder (with its own) | `[data-traits-all]` stays in `bindSheet` and is inert here (it writes `localStorage`). `[data-vitals-toggle]` and `[data-vpop]` stay in `bindSheet` (SQ4). **The player's sheet must behave the same after the move**: the existing smoke tests for skill descriptions, derivations, jumps and *go to tab* pass unchanged |
| **The controls** | Probe on a locked Arcanist: Main 43 buttons, Trackers 43 buttons and 8 fields, Progression 14 and 4, Sessions 2 and 6, Loadout 13, Notes 1 field | **`inertSheet(root)`**: every button, select and checkbox not matching `RO_READERS` is `disabled`, and every text field and textarea is `readOnly` with `aria-readonly` | `RO_READERS` is one selector list in `gm.js` (§8). `[data-tip]` is in it. E4 checks that every enabled control matches it |
| **The layout** | `.app.sheet-mode` only on `S.screen==="sheet"` (`app.js:179`; `shadows.css:132`, `:561–564`, `:1004`, `:1095`, `:1119`, `:1213`) | The page draws in the table's column, without `sheet-mode` | 390px: no sideways overflow (step 8). `.main-pin` (the Pin button, `:1213`) stays hidden, which is right: there's no drawer |
| **The seat's routes** | `openSeat` (`gm.js:3575`); `openFound` `seat` (`:455`); the tab binder clearing `S.seatOpen` (`:276`); Back (`:3627`); Remove (`:3669`); `seatPageNow` (`:3436`) | `S.seatSheet` (a tab id, or null) beside `S.seatOpen`; the sheet is drawn when both are set and the seat has a copy | `openSeat(tag)` sets `S.seatSheet="main"` when `seatView(t, tag).copy` (SQ1). `openFound` goes through `openSeat` (SQ6). The tab binder and Back clear both. Every route has its row in §9's table |
| **A re-draw while the sheet is open** | Jot (`tableChange`), Activity's Undo (`undoTableEntry`, a gate with `keepCopies`), Replace on the seat's page, Find, a table tab | Each re-draw reads `seatView` and `seatCharacter` fresh | A seat that's gone (an undo of *Seated Dez*) drops the sheet to the Players tab (E9). A Replace shows the new copy when the sheet is next opened. Nothing caches the copy in `S` |
| **Print** | `printSheet(S.ch)` from the sheet's menu (`app.js:216`) | `printSheet(Engine.seatCharacter(t, tag))` from the page | `renderPrintView` reads no `S` (`sheet.js:2830`) |
| **Text that points at this** | 255's *Rejected* and *Revisit if*; the plan's S3c row and §6 *S3b* (*"the real renderer with a `readOnly` flag"*); GQ13; STATE §3's GM row and §4's *what's next*; `gm-mode/README.md` | S3c built | **Grep the docs for *read-only sheet*, *readOnly* and *S3c***: the plan's *"with a `readOnly` flag"* becomes what was built (no flag). Each hit gets a line in step 10 |

## 6. Read first

- `CLAUDE.md`, whole: constraints 5, 7, 9 and 10; *Decisions*; *Change tiers*.
- `docs/STATE.md`, whole.
- `docs/SCHEMA.md` §4: Decisions **139** (tips), **141** (the roster),
  **160** (pinned vitals), **172** (the table screen), **212** (the table's
  undo), **254**, **255**.
- `docs/plans/gm-mode.md` §6 *S3b*, GQ13.
- `docs/plans/gm-mode/S3b-seats.md` §9, for the seat's page and card as
  ordered, and this order's *Carried over*.
- `docs/VOICE-APP.md`: the chrome here is tool voice.
- **The code:**
  - `shared.js`: `S`, `homeState`, `saveChar`, `update`, `commit`,
    `clone`, `TIPS`, the tip listeners, `importIssuesHtml`,
    `loadIssuesHtml`, `panelRows`, `bindScrollRows`, `jumpTo`,
    `keepPlace`, `takeFocus`.
  - `app.js`: `renderMain` (its sheet branch is the model for the draw),
    `printSheet`.
  - `sheet.js`: `SHEET_SECTIONS`, `SHEET_RENDER`, `sheetHeader`,
    `tabButtonsHtml`, `bindSheet`'s first forty lines (the readers).
  - `gm.js`: `renderTable`, `bindTable`, `bindPlayers`, `openSeat`,
    `seatPageHtml`, `bindSeatPage`, `openFound`, the tab binder,
    `tableChange`, `undoTableEntry`.
  - `engine.js`: `_copyOf`, `_copies`, `seatView`, `migrate`.

## 7. Out of scope

- **A PC row on a seat's copy** (S3d). The encounter's PC rows stay typed
  names with the GM's scratch numbers (188, 191).
- **Writing anything into a copy**: no note, award or hit. That is S2 and
  S4's dispatch.
- **Read-only popovers** for the vitals pills (SQ4).
- **Exporting the copy**: the player's file is the source.
- **The player's sheet** gains nothing and loses nothing. The readers move
  into `bindSheetReaders` with the same behaviour.
- **`panelRows` writing while it draws on the player's own sheet.** That's
  harmless there, since the character is the open one and the next
  `update()` saves it anyway. Changing it is a separate Fix: list it in the
  PR as a follow-up, don't fix it here.
- **Anything in `private/`.**

## 8. The shapes

**Engine.** One reader, exported beside `seatView`:

```js
// A seat's character to draw: a migrated clone of its copy, never the stored object (Decision N).
seatCharacter(t, tag) → character | null
```

| Input | Returns |
|---|---|
| a table, a seated TAG with a copy | `migrate(JSON.parse(JSON.stringify(copy.character)))`: a new object every call |
| a TAG that isn't seated, or a seat with no copy | `null` |
| `null`, `{}`, a string, a table whose `copies` is a string, a copy whose `character` is `[]` | `null`, never a throw (constraint 8) |
| a copy whose `migrate()` throws | `null` |

**UI state** (on `S`, never stored; `openTable` and `homeState` reset it):
- `S.seatSheet`: a `SHEET_SECTIONS` id other than `admin`, or null. The
  sheet is drawn when `S.tsection==="players"`, `S.seatOpen` is set, and
  `S.seatSheet` is set and the seat has a copy. Otherwise it's the seat's
  page or the tab, as today.

**UI functions** (in `gm.js` unless said; names are suggestions, the
behaviour is not):
- `drawReadOnly(ch, section)` → HTML. It saves `S.ch`, `S.section`,
  `S.admin`, `S.importIssues` and `saveFailed`, sets them to `ch`,
  `section`, `false`, `[]` and `false`, calls `SHEET_RENDER[section]()`,
  and restores all five in a `finally`. A throw returns a one-line note
  (✎ §9), never a broken page. It keeps `ch` as the tips' character until
  the next table draw that isn't this page.
- `inertSheet(root)`: the disabling pass in §5's *controls* row.
- `RO_READERS`: `[data-tip], [data-jump], [data-gotab], [data-skilldesc],
  [data-derivdesc]`, plus the page's own chrome. One list, read by
  `inertSheet` and by E4.
- `bindSheetReaders(main, goTab)` in `sheet.js`: the readers moved out of
  `bindSheet`, called with `goTab(id)`, the caller's own tab change.
- `bindReadOnlySheet(main)`: `bindSheetReaders` with the page's own
  `goTab`, plus the page's chrome. **It calls no writer**: it never calls
  `commit`, `update` with `S.ch` set, `Engine` writers, or `localStorage`
  (the static guard).
- `tipChar()` in `shared.js`: `S.ch` if set, else the read-only page's
  character if that page is drawn, else null.

## 9. The UI

**The page.** Inside the Players tab, in place of the seat's page:

1. **Back to players** (the seat's page's button and wording).
2. The character's name as the `h1` (`tabindex=-1`, `data-rosheeth`), with
   the status chip when the seat isn't active (the card's chip).
3. One line: **Read only** ✎ · *File from <date> · Imported <date>* (the
   card's words as shipped). Then the player's name.
4. Two buttons: **Seat** ✎ (to the seat's page) and **Print**.
5. The sheet's tabs as a row of buttons, the sheet's own labels and icons
   (`SHEET_SECTIONS` without Admin). The active one has `aria-current`.
   They sit inside `<main>`, not in the header: the header stays the
   table's (its tabs, Find, Jot, ⋮).
6. The tab's body, from `drawReadOnly`, after `inertSheet`.

**The seat's page** gains **Read the sheet** ✎ beside Replace when the seat
has a copy.

**Where things land.**

| Press | Lands on | Focus |
|---|---|---|
| A card, or its name, with a copy (SQ1) | The read-only sheet, Main | Its `h1` |
| A card with no copy | The seat's page, as today | Its `h1` |
| A tab on the read-only sheet | That tab | The pressed tab |
| A *go to* button inside the sheet (`data-gotab`) | That tab | That tab's button |
| **Seat** | The seat's page | Its `h1` |
| **Read the sheet** on the seat's page | The read-only sheet, Main | Its `h1` |
| **Back to players** (from either page) | The Players tab | The seat's card button; a folded card's `summary` (S3b's fix) |
| A table tab in the header | That table tab; the sheet closes | The tab |
| Find → a seat (SQ6) | As its card | As its card |
| Jot, saved while the sheet is open | The same tab, redrawn in place | Where it was (`keepPlace`) |
| An undo (Activity) that leaves the seat | The same tab | Where it was |
| An undo that removes the seat | The Players tab | The tab's `h1` |
| **Print** | The print dialog, then the same page | **Print** |
| A reload | The Players tab (UI state isn't stored) | — |

**Refused and empty.**
- Every inert control does nothing when pressed, typed into or changed. A
  disabled control can't take focus. A read-only field can (to select and
  copy) but doesn't change.
- A tip opens from every `data-tip`, as on the sheet.
- A copy a renderer can't draw shows ✎ *"This tab couldn't be drawn from
  this copy."* on that tab only; the other tabs and the chrome still work.
- A benched, retired or dead seat reads the same, with its status chip.

**Copy** (✎ = new, drafted for the voice pass; the builder pastes each as it
renders, and the reviewer drafts rewrites in its first review):
- ✎ **Read only**: the line's first words.
- ✎ **Seat**: the button to the seat's page.
- ✎ **Read the sheet**: the seat's page's button.
- ✎ *"This tab couldn't be drawn from this copy."*
- Reused as shipped, not for the voice pass: **Back to players**, **Print**,
  *File from … · Imported …*, the status chips, every sheet string.

**Keyboard.** Tab reaches the chrome, the tab row, every tip and every
reader, and skips every disabled control. ↑/↓ change nothing. Esc closes a
pinned tip, as on the sheet.

## 10. Worked examples, as named tests

Write these first and show each failing on `main` (no route, no
`seatCharacter`), or say why it already passes. Engine tests go in
`tests/engine.test.mjs`; the rest in a new **`tests/smoke-table-sheet.test.mjs`**,
which uses `smokekit`'s helpers and a seat seeded through storage, the way
`smoke-table-seats.test.mjs` does. **Its fixture is a Cyborg** with damage
taken, two Conditions, a note, and one audit entry, so that Loadout writes
`panelData` (the pre-flight's probe). It's seated with a second character:
an Arcanist with a spell.

**Engine:**
- **E0** `N: seatCharacter returns a fresh migrated copy, never the stored one`.
  It covers:
  - `!==` the stored character, and `!==` a second call;
  - a change to the result leaves `JSON.stringify(t)` as it was;
  - an unseated TAG or a seat with no copy is `null`;
  - §8's bad inputs are all `null`.

**The page:**
- **E1** `N: a card with a copy opens its read-only sheet on Main, and Back lands on the card`.
  The `h1` is the name, the line reads *Read only · File from …*, and Back
  focuses the card's button.
- **E2** `N: every tab but Admin draws on the read-only sheet, from the copy`.
  The tab row lists the eight labels and no Admin. Each tab draws with no
  page error. Main's HP reads the copy's, past zero for a copy with more
  damage than HP.
- **E3** `N: no press on the read-only sheet writes` (**the guard**). On
  every tab, it dispatches a click on every button in the body and an
  `input` and a `change` on every field and select, with a changed value.
  After each, it checks:
  - `S.ch` is `null`;
  - no `shadows.char.v1.` key exists;
  - the in-memory `S.table` and the stored table are each byte-equal to
    the table before;
  - `S.table.audit.length` is unchanged;
  - `#undotoast` is hidden.

  The Cyborg's Loadout is among the tabs.
- **E4** `N: every live control on the read-only sheet only reads`. On every
  tab, every button, select and checkbox in the body that isn't disabled
  matches `RO_READERS`, and every text field and textarea is read-only.
- **E5** `N: a stat's tip reads the copy on the read-only sheet`. Focusing a
  `data-tip="stat"` trigger shows the copy's stat and value. Once the page
  is left, `tipChar()` is null.
- **E6** `N: a seat with no copy opens its page, with no Read the sheet`.
- **E7** `N: Seat and Read the sheet move between the two, each landing on its h1`.
- **E8** `N: Find opens a seat the way its card does`.
- **E9** `N: the sheet goes with its seat`. Undo *Seated …* from Activity
  while the sheet is open; it lands on the Players tab.
- **E10** `N: Print prints the copy`. With `window.print` stubbed,
  `#printSheet` holds the copy's name and the stub was called once.
- **E11** `N: drawing the read-only sheet leaves S, saveFailed and the table's banner as they were`.
  With `saveFailed` set true:
  - the table's banner shows once;
  - *"Export the character now"* is absent;
  - `S.importIssues`, `S.section` and `S.admin` read as before the draw.
- **E12** `N: a table change after reading a sheet adds nothing to the roster`.
  It reads the sheet, then Jots a note and adds a player; no
  `shadows.char.v1.` key exists.
- **E13** `N: the player's own sheet keeps its readers` (`bindSheetReaders`).
  On a player's sheet: a skill's description, a derivation and a *go to*
  button behave as before. Existing tests may cover this; if so, name them
  in the PR instead.

## 11. Tests beyond the examples

- **The static guard** in `tests/engine.test.mjs`, beside the other
  architecture guards (`smoke-…` is for behaviour):
  - `bindSheet(` and `bindMain(` are each called from exactly one function,
    `renderMain` (their definitions aside);
  - `gm.js` assigns `S.ch` only inside `drawReadOnly`: the set and the
    restore, and nowhere else;
  - `bindReadOnlySheet`'s body has no `commit(`, `saveChar(`,
    `localStorage` or `S.ch=`. Read its body by brace-matching from its
    `function` line, the way the existing guards read a function.
- **Totality:** `seatCharacter` on every input in §8's table.
- **Voice:** every ✎ string through `tests/voice.test.mjs`.
- **The data guard** (135): no data key is added.
- **Mutation-test** each of these, and record in the PR what caught it.
  Check each for a second path first. Find each site by `grep`, never by
  line number, and run each narrowly under a `timeout`:
  1. the page drawing the stored copy (`_copyOf(…).character`, or `S.table.copies[i].character`) instead of `seatCharacter`'s → **E3** (the Cyborg's Loadout writes `panelData`; the in-memory table check catches it before any save does);
  2. `seatCharacter` returning `migrate(stored)` without the clone → **E0**;
  3. `drawReadOnly` without its `finally` restore (`S.ch` left set) → **E3** and **E12**;
  4. `TIPS.stat` reading `S.ch` instead of `tipChar()` → **E5**;
  5. `inertSheet` skipped → **E4**;
  6. `drawReadOnly` not clearing `saveFailed` → **E11**;
  7. `bindSheet()` called after the read-only draw → **the static guard**. E3 may not catch it, because `commit()` returns on a null `S.ch`; say which caught it;
  8. a second `S.ch=` in `gm.js` → **the static guard**;
  9. `openFound`'s `seat` kind setting `S.seatOpen` directly, not through `openSeat` → **E8**.

## 12. Steps

Run `git submodule update --init private`, then `npm run test:fast` before
starting (a fresh branch from `main`). Run the targeted files after each step,
and **commit at the end of each step**, so a restarted session picks up from
the last commit (*Carried over*).

1. Take the decision number: the lowest free on `origin/main`. Search the
   ledger again for §5's names.
2. **The engine:** `seatCharacter`, its export, E0 and totality.
3. **The readers move:** `bindSheetReaders` out of `bindSheet`. Run every
   `smoke-sheet*` file and E13 before going on: the player's sheet must not
   move.
4. **The tips:** `tipChar()`, `TIPS.stat` and `TIPS.crank`.
5. **The page:** `S.seatSheet` and its resets; `drawReadOnly`,
   `inertSheet`, `RO_READERS`, the chrome, `bindReadOnlySheet`; the routes
   (`openSeat`, Back, **Seat**, **Read the sheet**, the tab binder,
   `openFound`); Print. E1–E12.
6. **The static guard** (§11).
7. **CSS:** the chrome and the tab row at 390px; disabled controls read as
   disabled in both themes and still pass 3:1 on their edge (the sheet's
   existing `:disabled` style, if it does).
8. **In the browser** (`shadows-dev-preview`, `?gm=on`). Make a Cyborg and
   an Arcanist in the wizard, lock and export them, and import both onto a
   player. Then:
   - Open each card. Walk every tab. Hover, focus and tap tips, a stat's
     among them.
   - Press, type into and change every control you can see. In DevTools,
     confirm that the table in `localStorage` hasn't changed and that no
     `shadows.char.v1.` key appeared.
   - **Seat** and **Read the sheet**, Back, a header tab, Find by the
     character's name, Jot, then Activity's Undo of *Seated …*.
   - Print, and look at the preview.
   - **390px**, **768 × 1024** and **1300px**, and `npm run phone-check`.
     **Proof at phone width** is metrics if the screenshot times out
     (`WORK-ORDERS.md`).
   - **Both themes.** **Report it if** any text is under 4.5:1 or a
     control's edge under 3:1.
   - **Keyboard:** Tab through the chrome, the tab row and a tab's tips;
     no disabled control takes focus.
9. The mutations (§11).
10. The docs:
    - the ledger: N, with 255 marked **in both SCHEMA and INDEX**;
    - INDEX;
    - the plan: S3c's row moves to *Built*, and §6 *S3b*'s *"with a
      `readOnly` flag"* is reworded to what was built; GQ13's answer, *the
      real sheet, built (S3c)*;
    - `gm-mode/README.md`'s row;
    - STATE;
    - the close-out (§14).

## 13. Stop and ask

- N is taken, or the ledger search finds a decision this overrides that the
  pre-flight doesn't name.
- **A press on the read-only page writes anything** (E3 fails) and the fix
  isn't the clone or the restore.
- **A renderer needs `S.screen==="sheet"`**, or a binder, to draw.
- Moving the readers into `bindSheetReaders` changes the player's sheet (a
  `smoke-sheet*` test fails).
- `RO_READERS` needs a selector that a writer also uses.
- A control can't be inerted without changing its renderer.
- An existing test needs a change beyond the decision-number pins.
- The voice test flags new copy, or the decision goes over 350 words.
- **Not a stop:**
  - `engine.test.mjs`'s *"208: a search over 200 members and 100 sessions
    is quick"* failing on timing while the dev preview runs, if it passes
    when run alone;
  - phone-check's two OVER rows on the player sheet's HP pill.

## 14. Close-out

This is the *Rule or shape* tier, switched off, with **no schema bump and no
`private/` commit** (say both in the PR body):

- **SCHEMA:** N, and 255's mark **in the ledger**.
- **INDEX:** N under **GM mode**, and 255's line marked. **Check that
  `docs.test.mjs` passes.**
- **`gm-mode/changelog-pending.md`:** a line under *Players*: *A card opens
  the character's sheet as their player sees it, to read and print.* ✎
- **STATE:** the GM row (S3c built; S3d next) and §4's *what's next*.
- **The log:** an entry in `docs/log/2026.md` naming what the pre-flight's
  probes found (the renderer writing `panelData`, the tips reading `S.ch`
  when shown), and a row in `docs/log/shipped.md`.
- **The plan and its README**, as step 10 says.
- **PR title:** `feat(gm): a seat's character reads on the real sheet, read-only, switched off (S3c, Decision N)`.
- **PR body:** the template's sections, plus:
  - **Every new string**, pasted as it renders, for the voice pass;
  - **The mutations**, each with what caught it;
  - **Where the order didn't fit** (empty is fine);
  - **Follow-ups**: `panelRows` writing while it draws (§7).

**Review checklist** (the reviewer checks these beyond the tests passing):
- **Re-do the write-path sweep by grep**, not from this order:
  - every `commit(`, `update(`, `saveChar(`, `localStorage.setItem` and
    `S.ch =` in `src/ui/`;
  - every function that sets an `on…` handler or calls
    `addEventListener` (the document-level ones included).

  For each, name the reason it can't run on the read-only page or can't
  reach the table or the roster.
- **Look for a reader that runs late**, as the tips did: anything a
  renderer schedules (`setTimeout`, `requestAnimationFrame`, a promise) or
  a listener reads off `S` after the draw.
- **Run E3's loop by hand in the browser** on one tab, and look at
  `localStorage`.
- **The player's sheet**: open one and use a skill description, a jump and
  a *go to* button. Readers moved; nothing else should.
- **A copy from an older file** (a schema step behind) draws every tab.
- **Twins:** the card's numbers and the sheet's agree on HP, Pain and
  Conditions for the same copy.
- The voice pass is drafted in the first review (*Carried over*).

## 15. Handing it over

**To the builder:** `WORK-ORDERS.md`'s building prompt, with this order's path
(`docs/plans/gm-mode/S3c-read-only-sheet.md`). Add these traps:

- **`S.ch` is the whole game.** `saveChar()` saves whatever `S.ch` holds on
  every `update()`, table presses included. Set it only inside
  `drawReadOnly`'s `try` and restore it in the `finally`. Never set it to
  "open" the sheet.
- **Draw a clone, always**: `Engine.seatCharacter`, never the stored copy.
  Loadout writes `panelData` into what it draws.
- **Don't add a `readOnly` flag to the renderers.** The renderers stay as
  they are. The page draws them, and then `inertSheet` disables what
  writes. If a control can't be inerted that way, stop.
- **`clickIn` fires on disabled buttons in jsdom.** That's what makes E3
  strong; don't switch it to `.click()`.
- **E3's table check reads `S.table` in memory as well as storage.** A
  write into the copy isn't saved until the next `update()`, so the stored
  table alone would miss it.
- **A tip trigger stays enabled.** A disabled `<button data-tip>` gets no
  click.
- **Moving the readers changes `bindSheet`.** Run every `smoke-sheet*`
  file after step 3, before building anything on top.
- **Fill N everywhere at build time**, comments and test names included.
- **Commit at the end of each step** (§12).

**To the reviewer:** `WORK-ORDERS.md`'s reviewing prompt, with this order's
path, the builder's session id, and the checklist in §14. Draft the voice
pass for §9's four ✎ strings and the changelog line in the first review, side
by side, for Ken through the conductor.
