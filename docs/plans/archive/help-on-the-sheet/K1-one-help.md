# Work order K1: one Help, on the sheet too

**Plan:** [`../help-on-the-sheet.md`](../help-on-the-sheet.md) §3, row K1, and §2's shape. **Wishes:** [W156](../../../WISHLIST.md) (Help on the sheet, its first part) and W150 (Help's polish, its layout half). **Built on:** [`../gm-mode-next/S31-help.md`](../gm-mode-next/S31-help.md), the order that built GM mode's Help. Decisions 139, 160, 166, 256, 272, 278, 281, 282, 287.

**Status: drafted 2026-11-15** by Claude (Opus). **Approved by Ken 2026-11-15, in the drafting session: "Approved, build it".** The plan's KQ1–KQ8 are answered (Ken, 2026-11-15: every default). **This order's KQ9–KQ12 are answered too (Ken, 2026-11-15, in the drafting session):** KQ10–KQ12 on their defaults, and KQ9 as Ken and Claude reshaped it: from 1280px Help is a column, as on a table, and with vitals pinned it takes their column while it's open, the vitals showing as the bar; it starts closed each visit (§4). Ken's standing requirement, from the plan: **the Guide lines switch is a must**, so a veteran player gets a clean sheet.

**Branch:** cut from `claude/l4-order` at the approval commit, since this order and its plan aren't on `main` yet (L4's builder was cut the same way); PR to `main`. The PR carries that branch's docs commits until one of the two PRs lands them. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../../WORK-ORDERS.md). The conductor starts **K1 build** (Sonnet), then a fresh **K1 review** (Opus) once the PR is open. §15 is the hand-over.

**Runs alone, or beside L4.** It touches `shared.js` (the panel, lifted), `gm.js` (Help's code moves out, and its host is what's left), `sheet.js` (`sheetHeader`'s lines), `app.js` (the sheet's header, a `?` key), `shadows-data.js` (`sheetGuide`, and three `appCopy` keys move into it), `shadows.css` (Help's rules, renamed off "a GM table's"), and the docs. L4 touches `sheet.js`'s Weapons table and print, `engine.js` and other data: the two collide only in versions, CHANGELOG's heading and decision numbers. Whichever merges second takes the next minor and the next decision number.

**Carried over:**
- **From S31's review:** Help's foot was about 530px below the fold on a phone (W150). **Here:** the sheet's panel is short (no *A night* view, no Keys link), and the foot moves to the top of the body on a phone (§9).
- **From E5 and E8:** the intros are tested by selector (`h1.step-title + .step-note`) and by `appCopy` key in two files. **Here:** both tests are expected breaks (§11), rewritten to read where each line now lives.
- **From every sweep so far:** the misses were readers nobody remembered. **Here:** §5 greps every reader of Help's state and of the three keys that move.

**Pre-flight against `main` at `56dee35`** (0.69.3 live). Game data 0.54, character schema 0.34. The highest decision is 287 and L4's draft also writes N, so take the next free number on `origin/main` when the entry is written. The probes ran by reading the code and the data in Node; nothing was committed.

```
GM Help today      gm.js ~368–495: HELP_PREF, GUIDE_PREF, helpContext, helpShown, syncHelp, openHelp, closeHelp,
                   toggleHelp, helpEscCloses, helpBodyHtml, paintHelp, helpMd, helpWordsHtml, helpSwitchHtml. It draws
                   into #ghelp / #ghscrim (index.html:29–30). Called from outside gm.js: app.js:184 (syncHelp when the
                   screen isn't a table), app.js:~392 (Esc → helpEscCloses/closeHelp), wizard.js:896 (syncHelp)
The ? key          gm.js:527's document keydown, gated: featureOn("gm"), S.screen==="table", keysOn() (KEYS_PREF
                   "shadows.ui.keys", gm.js:331), not repeat or composing, not inField, no open modal, ⋮ closed.
                   inField is gm.js's. The sheet has no key at all today
The sheet header   app.js ~28–52: the tabs, then ⋮ (Admin, Export, Print, What's new, Home), then the theme toggle.
                   No Expert on the sheet (that's the wizard's header). phone-check checks the sheet's name isn't
                   cut to "…" in the header: a ? that costs the name its room fails there
The right column   From 1280px the vitals panel can be pinned (Decision 160): body.vitals-pinned, --pin-w 300px,
                   shadows.css ~878–889. GM Help pins into the same right edge (.app.help-pinned, --help-w 21rem,
                   ~893–919). Both at once would leave the sheet about 640px at 1280. They have never met: a table
                   has no vitals panel
The vitals flyout  app.js ~98–133: S.vitalsOpen, syncVitals, closes when the section changes (app.js:192). z-index 80,
                   the same as Help's flyout
The intros         sheetHeader(title, note) (sheet.js:39) draws note as the step-note under the h1. Skills,
                   Character, Progression, Loadout, Notes and Admin pass appCopy.intro*; Main passes the archetype
                   line (not an intro); Trackers passes none
Their words        introSkills and introProgression state rules (a Skill's roll; what a session pays). introAdmin
                   says what free edit does and that it's logged. introCharacter, introLoadout and introNotes only
                   orient. All six go through termsHtml (Decision 287)
Tests that pin     smoke-sheet-progression.test.mjs:780–829 (E5 and E8 5: each intro equals its appCopy key, by
them               selector), smoke-table-sheet.test.mjs:353 (the seat draws the same five), engine.test.mjs:326
                   (MAPS: gmGuide's keyed maps), :388 (gmGuide's shape), voice.test.mjs:103 (gmGuide in the corpus)
Words available    gameTerms ids, read by Engine.term(id, ch, n): bright dim dark blind pain-level kicker-die take-x
                   explode botch defensive-action skill-check TOL WILL SAN LUCK milestone-point, any Stat id, any
                   Condition id. K2 widens this to every glossary
```

---

## 1. Goal and Done when

**Goal.** A player can open Help on any tab of their sheet and read what the tab is for, when they'd use it, the words on it and a tip. A player who knows the sheet can turn its guide lines off and keep a clean sheet. GM mode's Help is the same panel, unchanged in what it does.

**Done when:**
1. On a locked sheet, a **?** in the header and the **?** key open Help for the tab that's open (Admin included). It names the tab, says what it's for, shows *When* as chips, lists the words on it (each from its rule, through `Engine.term`) and a tip or two.
2. **From 1280px, Help on the sheet is a column beside it, as on a table**: nothing is dimmed, the sheet stays live, and Help follows the tab. **With vitals pinned, Help takes their column while it's open**, and the vitals show as the bar at the top, so they never leave the screen; closing Help gives the column back. The pin itself is never changed (KQ9). Help starts closed on every visit. **Below 1280px** it's a flyout with a scrim, as on a table, closing on Close, Esc, the scrim, a tab press, and when the vitals flyout opens. Focus goes back to what opened it.
3. Every tab has a **guide line** under its title, Main and Trackers included (KQ11). Help's foot has the **Guide lines** On/Off switch. Off hides every guide line on every tab, and keeps the three rule lines (Skills, Progression, Admin). The browser remembers it (`shadows.ui.sheetGuide`). The character file doesn't change.
4. The **?** key on the sheet follows the same rules as a table's (never in a field, a modal or with ⋮ open), and obeys the browser's keys setting, which sheet Help's foot can turn off (KQ10).
5. GM mode's Help does what it did: `smoke-table-help.test.mjs` and `smoke-table-keys.test.mjs` pass **without an edit**.
6. On GM mode's seat sheet, the table's Help stays, and the seat's guide lines follow the table's switch (KQ12).
7. `npm run phone-check` passes, and at 390px the character's name keeps its room (KQ1's fallback if it doesn't).

## 2. Tier, versions, numbers

- **Tier: Rule or shape** (a numbered decision; a data section; shared code moved).
- **App:** minor (a new capability). The next minor on `origin/main` at build: **0.70.0**, or **0.71.0** if L4 has taken 0.70.0.
- **Game data:** **unchanged.** `sheetGuide` and the moved intros are copy; no computed value or choice moves (Decision 68, S31's precedent). `node tools/outputs.mjs` before and after is the evidence.
- **Character, table, pack schemas:** unchanged. The switch is browser storage (constraint 7).
- **Decision N** (§3): the next free number on `origin/main` when it's written. No flag.

## 3. The decision, drafted

Paste as is; fill *Built*. About 290 words with *Touches*.

```
N. **The sheet has Help: a ? and the ? key open it for the tab that's open, from the data's sheetGuide; every tab has a guide line, and a Guide lines switch hides them all.**
     *2026-11-?? · Ken + Claude · Touches: Help, ?, data-shelp, sheetGuide, sheetHeader, guide line, rule line, shadows.ui.sheetGuide, shadows.ui.keys, #ghelp, helpHost, help-pinned, vitals-pinned, vitals bar, syncHelp, helpEscCloses, introCharacter, introLoadout, introNotes, seat sheet, vitals flyout, Decision 160, Decision 166, Decision 256, Decision 278, Decision 287, W156*
     - **Decided:** Help's panel is shared: the table and the sheet each give it a guide and a context. On the sheet a ? between the tabs and ⋮, and the ? key under the table's rules and the browser's keys setting, open it for the open tab: what it's for, when, its words (by gameTerms id) and a tip. From 1280px it is a column, as on a table, starting closed each visit; with vitals pinned it takes their column while open and the vitals show as the bar, the pin unchanged. Narrower it is a flyout, one at a time. Every tab has a guide line from sheetGuide; a line that states a rule stays in appCopy and always shows. Guide lines, in Help's foot, hides them for this browser. A seat keeps the table's Help and switch.
     - **Why:** W156: the sheet explains its words but never its tabs, and a player who knows it can't put the intros away. Help is read against the screen, so nothing it explains is dimmed or taken away.
     - **Rejected:**
       - A second panel in sheet.js: two to keep in step (KQ3).
       - Two columns, Help beside pinned vitals: the sheet falls to about 640px at 1280.
       - A flyout over a dimmed sheet: the player can't read the screen Help describes.
       - Unpinning and re-pinning vitals: every way Help closes must restore it.
       - One switch for table and sheet (KQ2); hiding the rule lines too (KQ5).
     - **Replaces:** Decision 278 in part (Help's panel serves the sheet as well as a table).
     - **Revisit if:** players want Help to stay open across visits, as a table's does, or the wizard asks for the same (KQ7).
     - **Built:** app 0.7?.0, no game-data or schema bump, PR #?, log 2026-11-??.
```

## 4. Questions for Ken

The plan's KQ1–KQ8 are answered. These four came out of the pre-flight. **All four are answered (Ken, 2026-11-15):** KQ10–KQ12 on their defaults, KQ9 as reshaped below.

| Id | Question | Answer |
|---|---|---|
| **KQ9** | **Help beside the sheet at 1280px?** GM Help pins into the right edge. On the sheet that edge is the pinned vitals panel's (Decision 160); both at once leave the sheet about 640px wide. | **Answered (Ken, 2026-11-15): a column from 1280px, as on a table, and it takes the pinned vitals' column while it's open.** The vitals show as the bar at the top while Help is open, so the player can always read Help against what they're seeing. The swap is drawn from Help being open, never by changing the pin, so closing Help gives the column back with nothing to restore. Help **starts closed each visit** on the sheet (a table's stays as the browser left it); if players ask for it to stay open, that's a follow-up. *Considered and dropped in the discussion:* a flyout at every width (the draft's default), and a flyout beside the pinned vitals: both dim the sheet the player is trying to read. Unpinning and re-pinning: every way Help closes would have to restore the pin. |
| **KQ10** | **The ? key and a way to turn it off.** A one-key shortcut needs an off switch (WCAG 2.1.4); GM mode's is the Keys box, which the sheet doesn't have. | **The sheet's ? key obeys the browser's keys setting** (`shadows.ui.keys`, the table's), and sheet Help's foot has **The ? key** On/Off, which writes the same setting. One keyboard setting per browser. *Alternative:* no key on the sheet, the button only. |
| **KQ11** | **Main and Trackers have no intro today.** | **Each gets a guide line** (Appendix A), since the switch can take them away. Every tab's guide line moves into `sheetGuide`: Character's, Loadout's and Notes' word for word, from `appCopy`. *Alternative:* the two stay bare. |
| **KQ12** | **A seat's guide lines.** GM mode's seat sheet draws the player's tabs, intros included (256), under the table's Help (KQ6). | **They follow the table's switch** (`shadows.ui.gmGuide`), since that's the switch on that screen. *Alternative:* they follow the sheet's, which the GM can't reach from there. |

**Why KQ9 landed here.** Help is read against the screen: a player asks what a word on Trackers means while looking at Trackers. A dimmed sheet defeats that, and so would vitals that vanish while Help is open. The column keeps the sheet live; the bar keeps the vitals in view. The sheet narrows by only about 36px (21rem against 300px), so the swap barely moves it.

## 5. The assumption sweep

Every reader was found by grep: `helpShown`, `syncHelp`, `openHelp`, `closeHelp`, `toggleHelp`, `helpEscCloses`, `paintHelp`, `helpContext`, `HELP_PREF`, `GUIDE_PREF`, `KEYS_PREF`, `keysOn`, `inField`, `#ghelp`, `ghscrim`, `help-pinned`, `data-thelp`, `introCharacter`, `introLoadout`, `introNotes`, `sheetHeader(`, `vitalsOpen`.

| What changes | True today (where) | True after | Guards that read it · where it renders · text that points at it |
|---|---|---|---|
| Help's panel code | `gm.js` ~368–495, one host (the table) | The panel in `shared.js`, taking a **host**: its guide, its context, whether it pins, its foot, what to redraw. The table's host stays in `gm.js`; the sheet's is in `sheet.js` | Callers outside gm.js: `app.js:184`, `app.js` Esc (~392), `wizard.js:896`. They keep calling `syncHelp`, `helpEscCloses`, `closeHelp` by those names. `smoke-table-help` and `smoke-table-keys`, unedited, are the proof |
| `syncHelp` on a screen change | Empties `#ghelp` when `S.screen!=="table"` (`gm.js:423`) | Empties it when the screen's host changes, and keeps it for the sheet's | `app.js:184` calls it when the screen isn't a table: on the sheet that call must not shut a sheet's open Help mid-draw. Read `releaseMain`'s order there |
| `helpMd`, `inField`, `keysOn`, `KEYS_PREF` | `gm.js` | `shared.js` (script order: shared before gm and sheet) | Every gm.js use still resolves (classic scripts, one scope). Grep for a second definition left behind |
| `helpContext()` | Table's, total | Unchanged, now the table host's. The sheet's is `S.admin ? "admin" : normSection(S.section)`, total, falling back to `main` | The walk test (§10, 3) |
| CSS | `.ghelp`, `.ghelp-scrim`, `.app.help-pinned` under "A GM table's Help" (`shadows.css` ~891) | The same selectors, the comment says both; `.app.help-pinned` now set on a sheet too. **New:** with `body.vitals-pinned` and `.app.help-pinned` at once (≥1280), the vitals drawer is hidden and inert, the bar's pills show, `.app`'s right padding is `--help-w` (not both), and the footer and toast follow Help's width, not the pin's | phone-check's `tableHelp` (~391) reads `#ghelp` at 1280 for a table. It must still pass. Every `body.vitals-pinned` rule (~881–888: `.app` padding, `.vdrawer`, `.vbar`, `.footer`, `.toast`) gets a row in the build's check: each has a `help-pinned` counterpart or is shown not to matter |
| The vitals pin | `body.vitals-pinned`, set from its saved preference (Decision 160) | **Unchanged in storage.** While Help is a column, the swap is CSS off `.help-pinned`; closing Help removes the class and the column is back. No code writes the pin's preference on Help's behalf | Grep the pin's preference key and every writer of `vitals-pinned`: none is in Help's code. The drawer's focusable controls aren't reachable while it's hidden (inert), and focus inside it when Help opens goes to Help's Close |
| Help's open state across visits | A table: `shadows.ui.gmHelp` (`helpPref`) reopens it at ≥1280 | A sheet: no preference; `S.helpOpen` starts false on every sheet open | The table's `helpPref` stays the table host's only. A sheet opened after a table with Help open starts closed |
| The header's ? | Table: `[data-thelp]` (gm.js:304) | Sheet: `[data-shelp]`, between the tabs and ⋮, `aria-label="Help"`, `aria-controls="ghelp"`, `aria-expanded` | `helpHandBack` reads `[data-thelp]` (gm.js:408) and `syncHelp` sets its `aria-expanded` (:422): each becomes the host's button. phone-check's name-fits check at 390 |
| The ? key on the sheet | None | One `keydown` for the sheet, with the table's gates (§9) | The table's listener (gm.js:527) is gated on `S.screen==="table"`, so the two never both run. `smoke-table-keys`' matrix stays green |
| `appCopy.introCharacter`, `introLoadout`, `introNotes` | Read by `sheet.js:730`, `:2570`, `:2654` | Deleted; their text is `sheetGuide.contexts.<tab>.intro` | Decision 135's unread-key guard (`engine.test`): a key left in `appCopy` with no reader fails. `smoke-sheet-progression:780–829` and `smoke-table-sheet:353` read them: expected breaks (§11) |
| `appCopy.introSkills`, `introProgression`, `introAdmin` | Read by `sheet.js:517`, `:1710`, `:2665` | **Unchanged** in place and text: the rule lines. Each tab also gets a guide line above it | Same tests. Their text and terms don't move (E8 5's triggers still pass on them) |
| `sheetHeader(title, note, under)` | One note | A guide line (`data-guide`, from `sheetGuide`, shown while the switch is on) then the rule line, if any | Every caller (sheet.js:406, 517, 730, 1567, 1710, 2570, 2654, 2665). **Main's** note is the archetype line, not an intro: it stays, and Main's guide line goes after it. The seat sheet draws through the same function (256) |
| The vitals flyout | Closes on a section change (app.js:192) | Below 1280: also closes when Help opens; Help closes when it opens. From 1280 with vitals unpinned, the vitals flyout opening over a Help column leaves the column open (it's a page column, as a table's is) | `smoke-sheet-play`'s vitals tests (grep `vitalsOpen`, `data-vitals`) stay green |
| `voice.test`'s corpus | `gmGuide` walked (`:103`) | `sheetGuide` walked too | Constraint 9 on every new string |
| `engine.test` MAPS (`:326`) | `gmGuide.(contexts\|words\|empty\|ui.when)` | Plus `^sheetGuide\.(contexts\|ui\.when)$` | The key guard |

## 6. Read first

- `CLAUDE.md`: constraints 3 (no inline logic), 4 (script order), 7 (store inputs), 9 (maintainer text).
- `SCHEMA.md` §4: Decisions 278 (Help), 166 (the flyout, one setter), 160 (the pinned vitals), 256 (the seat sheet), 287 (terms in a sentence), 272 (keys).
- `S31-help.md` §8, §9 and §15: the shape and the traps this panel already has.
- `gm.js` ~331–495 (Keys and Help), ~527 (the keydown); `app.js` ~25–60 (the header), ~98–133 and ~184–195 (vitals and the screen change), ~387 (Esc); `sheet.js:39` (`sheetHeader`); `shared.js` `TIPS.term` and `termsHtml`.
- `VOICE-APP.md`: Help is tool voice; a guide line may lean city.

## 7. Out of scope

- *Every word* on the sheet, and words outside `gameTerms` (K2). The sheet's Help has no *Every word* link yet.
- Any `step-note` besides the tab intros (K3), and Help for the owed-pick dialog, Expert mode or the seat (K3).
- The wizard (KQ7), print (paper has no Help).
- GM mode's copy. `gmGuide` doesn't change, and W150's *A–Z jump* waits for K2's filter, which GM mode's *Every word* can take then.
- Renaming anything a guide line names.

## 8. The shapes

**Nothing stored in a character, table or pack.** One data section, three keys moved into it, one browser preference read by a second screen.

```js
"sheetGuide": {
  "ui": { "title": "Help", "close": "Close", "on": "On", "off": "Off",
          "forLabel": "What it's for", "whenLabel": "When", "wordsLabel": "On this tab", "tipsLabel": "Try this",
          "guideSwitch": "Guide lines", "keySwitch": "The ? key",
          "when": { "before": "Before you play", "during": "At the table", "between": "Between sessions" } },
  "contexts": {        // one per SHEET_SECTIONS id, and "admin"
    "main": { "title": "Main", "intro": "…", "for": "…", "when": ["during"], "words": ["TOL", "WILL", …], "tips": ["…"] },
    …
  }
}
```

- **`intro`** is the tab's guide line, on every context (KQ11). It goes through `termsHtml`.
- **`when`** is a non-empty subset of `before`, `during`, `between`, in that order.
- **`words`** are ids `Engine.term` answers for a plain character (`Engine.term(id, ch)` non-null). A Stat or Condition id counts. An id with a number (`take-x|5`) isn't used in K1. K2 widens the shape; K1's strings stay valid.
- **`tips`**: at most two.
- **The rule lines** stay `appCopy.introSkills`, `introProgression`, `introAdmin`, unchanged.
- **The host** (in `shared.js`, a suggestion, not markup): `{ id, guide(), context(), pins(), button, footHtml(), bindFoot(el), guideOn(), setGuide(on), redraw() }`. The table's host is S31's behaviour exactly. The sheet's `pins()` is true from 1280px, as the table's, but it has no open-state preference: it starts closed each visit. The functions other files call keep their names: `syncHelp`, `helpShown`, `openHelp`, `closeHelp`, `toggleHelp`, `helpEscCloses`, `paintHelp`.
- **Preferences** (this browser's, in try/catch as `keysOn` is):
  - `shadows.ui.sheetGuide`: `"off"` or absent; absent means the guide lines show.
  - `shadows.ui.keys`: unchanged in meaning; now read by the sheet's ? key too (KQ10).
  - `shadows.ui.gmHelp` and `shadows.ui.gmGuide`: unchanged, the table's. **No `sheetHelp` preference**: the sheet's Help starts closed each visit (KQ9).
  - The vitals pin's preference: unchanged, and never written by Help.

## 9. The UI

**Direction:** nothing new visually. Help on the sheet is GM Help's panel: a column from 1280px, a flyout below.

**The column and the pinned vitals** (KQ9). From 1280px Help is a column on the right that the sheet makes room for, as on a table: no scrim, the sheet live beside it, the panel following the tab. If the vitals are pinned, Help's column is where theirs was while it's open: the vitals drawer steps out of the way (hidden, inert) and the vitals bar's pills come back at the top, as they look unpinned. Close Help and the pinned column is back, because the pin never changed. The sheet narrows by about 36px (Help's 21rem against the pin's 300px) and nothing else moves.

**The button:** **?**, the header's own button style, between the tab row and ⋮, `aria-label="Help"`, `aria-controls="ghelp"`, `aria-expanded`. While keys are on it carries `aria-keyshortcuts="?"`. If at 390px phone-check finds the character's name loses its room, the button moves into ⋮ as **Help** below 480px (KQ1's fallback) and the key still works; report the measurement in the PR either way.

**The key:** `?` (any layout's `?`, Shift allowed, as the table's) toggles Help on a locked sheet, when: `S.screen==="sheet"`, keys are on, not a repeat, not composing, focus not in a field (`inField`), no modal open, ⋮ closed. Anything else is the browser's, and the key isn't prevented.

**The panel, top to bottom:** the tab's name and **Close**; *What it's for*; *When* as chips; *On this tab* (each word: the tip's title, its text and its `more` lines, as `TIPS.term` builds them, read for the open character); *Try this*; then the foot: **Guide lines** On/Off and **The ? key** On/Off, each a `form-toggle`. **On a phone (below 600px) the foot is drawn first**, under the heading, so the switches are in reach without scrolling (W150's finding). From 600px it's last, as on a table.

**Where things land:**

| Press | Lands on | Focus | Says |
|---|---|---|---|
| **?** button or key, closed, ≥1280 | the column opens and the sheet makes room; with vitals pinned, Help takes their column and the vitals bar shows | the panel's Close | — |
| **?**, closed, <1280 | the flyout opens with its scrim; an open vitals flyout closes | the panel's Close | — |
| **?**, open | Help closes; with vitals pinned, their column is back | the ? button, or where the key was pressed | — |
| Close or Esc | the same | the ? button (or, below 480 under KQ1's fallback, ⋮) | — |
| The scrim (<1280) | the flyout closes | the ? button | — |
| A tab, a `data-gotab` link, ⋮ → Admin, ≥1280 | the new tab; the column repaints for it | where the press puts it, unchanged | — |
| The same, <1280 | the new tab; the flyout closes (166) | where the press puts it | — |
| The vitals toggle, <1280 | the vitals flyout opens; Help closes | the vitals' Close | — |
| A vitals pill in the bar, ≥1280 with Help open | its popover, as an unpinned sheet's pill does | the popover | — |
| Guide lines Off / On | the tab's guide line goes or comes back beside the panel (or under the scrim); the rule line stays | the pressed half | — |
| Leaving the sheet, or a reload | Help is closed next time; a pinned vitals column is pinned as before | — | — |
| The ? key Off / On | the setting changes; with it off, ? does nothing on the sheet or a table | the pressed half | — |
| A word's term in the panel | its tip, as anywhere (139) | unchanged | — |

**Never:** the panel traps focus (166), shows on the wizard or home screen, or stays open on a screen change. From 1280px nothing is dimmed. Help never writes the vitals pin, and the vitals are never off the screen while Help is open: the column or the bar shows them. A modal opened from the page sits above it. Esc closes one layer at a time (a tip, then the panel). At 1280 with Help open, the sheet's cards keep the floors they have with vitals pinned (it's 36px narrower, so measure, don't assume).

**The guide line** sits under the title (and under Main's archetype line), above the rule line. It's `step-note`-weight, marked `data-guide`. With the switch off it isn't drawn at all, so it doesn't take a tab stop or a screen reader's time.

**On a seat** (GM mode's read-only sheet): no `[data-shelp]`, no sheet key; the table's Help and **?** as today. The seat's guide lines read `shadows.ui.gmGuide` (KQ12). Its rule lines show.

**Copy:** Appendix A. The builder pastes every string into the PR as it renders, and the reviewer drafts rewrites beside any that don't hold up. **Every sentence that says what the sheet does is checked against the sheet** (§12, step 7). A help line that's wrong is worse than none.

## 10. Worked examples, as named tests

The builder writes these first and **shows each failing on `main`**, and pastes the run into the PR. A new file, `tests/smoke-sheet-help.test.mjs`, holds 1–7; 8 goes in `smoke-table-sheet.test.mjs`.

| # | Test | Pins |
|---|---|---|
| 1 | `K1: ? opens Help for the open tab, and closing it gives focus back` | a locked character on Trackers: `[data-shelp]` → `#ghelp.open`, heading "Trackers", `aria-expanded=true`, focus on Close; *When* reads Appendix A's chips; each of `words` renders its `Engine.term` title; Esc → closed, `inert`, focus on `[data-shelp]` |
| 2 | `K1: every tab has help, and every word it names resolves` | for each `SHEET_SECTIONS` id and Admin: Help's heading is that context's `title`; every `words` id gives a non-null `Engine.term(id, ch)` for a Professional, an Arcanist, a Vampire and a Werewolf; no context is missing |
| 3 | `K1: from 1280 Help is a column, and with vitals pinned it takes their place while open` | at 1280 (`boot({ width: 1280 })`), vitals pinned, and `shadows.ui.gmHelp` "open" (a table's, which must not reopen the sheet's): the sheet opens with Help closed. ? → `#app` carries `help-pinned`, no scrim is open, the vitals drawer is `inert` and `aria-hidden`, the vitals bar's pills are in the page (jsdom has no layout: phone-check proves they show), and the pin's preference is byte-for-byte what it was; a tab press keeps Help open and repaints it for the new tab; Close → no `help-pinned`, the drawer is shown and not inert, the preference unchanged. Reopen the sheet → Help closed. At 1024 the same ? opens a flyout with its scrim, and a tab press closes it |
| 4 | `K1: the ? key opens the sheet's Help, under the table's rules` | `?` (Shift, `Slash`) toggles it; in a text field, with a modal open, with ⋮ open, on a repeat, and with `shadows.ui.keys` "off": nothing happens and the event isn't prevented; on the wizard, nothing |
| 5 | `K1: Guide lines Off hides every guide line and keeps the rule lines, for this browser` | each tab shows its `intro` (`[data-guide]`); Help → Guide lines Off → no `[data-guide]` on any tab, Skills' and Progression's and Admin's rule lines still equal their `appCopy`; `shadows.ui.sheetGuide` is "off"; reload → still off; the table's `shadows.ui.gmGuide` untouched; On → back |
| 6 | `K1: one flyout at a time` | at 1024: open vitals, then ? → vitals closed, Help open; then the vitals toggle → Help closed, vitals open |
| 7 | `K1: the ? key switch in Help turns keys off for the table too` | Help → The ? key Off → `shadows.ui.keys` "off"; ? on the sheet does nothing; Help's button still opens it |
| 8 | `K1: a seat keeps the table's Help, and its guide lines follow the table's switch` | Dead Air, a seat's sheet: no `[data-shelp]`; `[data-thelp]` opens the table's `character` context; with `shadows.ui.gmGuide` "off" the seat's tabs show no `[data-guide]`; with `shadows.ui.sheetGuide` "off" and `gmGuide` absent, they do |

## 11. Tests beyond the examples

- **Data shape** (`engine.test.mjs`, beside S31's): every context has `title`, `intro`, `for`, `when` ⊆ {before, during, between} in order, `words` (array), `tips` (≤ 2); `contexts` has exactly the `SHEET_SECTIONS` ids plus `admin` (read from `shared.js` as S31's test reads `TABLE_SECTIONS`); `ui.when` has the three keys.
- **The three moved keys are gone from `appCopy`** and nothing reads them (Decision 135's guard does it; check it fails if one is left).
- **Voice:** `voice.test.mjs` walks `sheetGuide` into its corpus (constraint 9). No string in `sheet.js` or `shared.js` for Help's labels: they're `sheetGuide.ui`'s.
- **No game-data change:** `node tools/outputs.mjs` before and after: identical.
- **GM mode unchanged:** `git diff main -- tests/smoke-table-help.test.mjs tests/smoke-table-keys.test.mjs` is empty, and both pass.
- **phone-check:** the sheet's header at 390 and 768 with the button: height within its share, the name not cut, no overflow. Add the sheet's Help to phone-check:
  - at 390, open it and assert the foot's switches sit above the fold;
  - at 1300 with vitals pinned, open it: the vitals drawer has no visible box, the bar's pills are visible, `main`'s right edge is left of Help's left edge, nothing in `main` runs past it, and no scrim is visible. Close it: the drawer is back and the bar's pills are gone;
  - at 1300 with Help open, the sheet's cards meet the same floor they meet with vitals pinned (it's 36px narrower).
- **Mutation-test** (and check each for a second path):
  - Return `"main"` from the sheet's context always → example 2 fails.
  - Let the sheet's Help draw its flyout at 1280 → example 3 fails.
  - Write the vitals pin's preference when Help opens or closes → example 3 fails.
  - Read `shadows.ui.gmHelp` for the sheet → example 3 fails (it opens on its own).
  - Drop the `vitals-pinned` + `help-pinned` rule → phone-check's 1300 case fails (jsdom can't see it: say so in the PR).
  - Drop the field gate from the sheet's key → example 4 fails through the key, not the button.
  - Ignore `shadows.ui.sheetGuide` → example 5 fails.
  - Read `sheetGuide`'s switch on a seat → example 8 fails.
  - Leave `appCopy.introNotes` in place → the key guard fails.
- **Expected breaks, updated, not stops:**
  - `smoke-sheet-progression.test.mjs:780–829` (E5, E8 5): Character's, Loadout's and Notes' intros now read `sheetGuide.contexts.*.intro` under `[data-guide]`; Skills', Progression's and Admin's rule lines keep their `appCopy` keys but are no longer `h1 + .step-note` (the guide line is). Update the selectors; keep every text and trigger assertion.
  - `smoke-table-sheet.test.mjs:353`: the same five, on a seat.
  - Version literals.

## 12. Steps

1. `git submodule update --init private`, then `npm run test:fast`.
2. Keep `node tools/outputs.mjs` over the sample characters as the before.
3. Write §10's tests and **run them on `main`: all eight fail**. Paste the run into the PR.
4. **The lift, with no behaviour change.** Move the panel and its helpers into `shared.js` behind the host; the table's host in `gm.js`. Then `npm run verify`: `smoke-table-help` and `smoke-table-keys` pass unedited, and phone-check's table Help passes. Commit this alone.
5. `sheetGuide` into the data from Appendix A; the three keys moved; the shape guard; MAPS; voice corpus. Then `npm run verify` (the expected breaks show here; update them).
6. The sheet's host, the button, the key, the column and the swap with pinned vitals, the flyout below 1280, the guide lines and both switches, the one-flyout rule, the seat's switch. Then `npm run verify`, and in the dev preview at 390, 1024 and 1280, with vitals pinned and not at 1280.
7. **Read every help sentence against the sheet**, tab by tab, on a Professional, an Arcanist and a Werewolf in form. List any that aren't true in the PR, and fix the copy to match the sheet, never the sheet to match the copy.
8. **`/impeccable harden`** on the sheet's panel: a long name at 390, Esc with a tip open, a modal over the flyout, the vitals flyout open when ? is pressed, a resize across 1280 while open. Then `npm run verify` and `npm run phone-check`.
9. **`/impeccable polish`**, then the close-out (§14).

## 13. Stop and ask

**Stop** (to the conductor) if:
- the lift can't keep `smoke-table-help` or `smoke-table-keys` green without editing them;
- the sheet's `?` needs a change to the table's key listener, or the two listeners can both act on one press;
- at 390 the button fails phone-check both in the header and with KQ1's fallback;
- `syncVitals` or the vitals flyout's code has to change beyond closing it when Help opens;
- the swap can't be drawn from Help being open alone, and needs code that writes or clears the vitals pin;
- at 1300 with Help open and vitals pinned, the sheet's cards fall under the floor they keep with vitals pinned;
- a word Appendix A names doesn't resolve through `Engine.term` and no other id in `gameTerms` fits (don't add a `gameTerms` row: that's K2);
- a help sentence can only be true by changing what a tab does (list it as a lead instead);
- an Impeccable command wants anything outside §9.

**Not stops:** §11's expected breaks, the version literals, a help sentence §12.7 finds untrue (fixed in the copy, listed), and a word dropped from a context because it doesn't fit there (listed).

## 14. Close-out

- **The tier's items** (`close-the-session`): the decision and its INDEX line, with 278 marked *in part*; `CHANGELOG.md` lines, then `npm run changelog`; `npm run bump`; a log entry; STATE §5's Help line; the plan's K1 row built; W150's Plan line (its layout half done; the A–Z jump left for K2); a row in `docs/log/shipped.md`.
- **The changelog** (a draft, for the voice pass):
  - "Every tab of your sheet has Help: press ? (the button or the key) for what the tab is for, when you'd use it, and what its words mean."
  - "Each tab has a one-line guide under its title. Know the sheet already? Help's Guide lines switch turns them off."
- **The PR:** title `K1: Help on the sheet (help-on-the-sheet; Decision N)`, with the template's sections, and:
  - **Where the order didn't fit** (required; "Nothing" is fine);
  - §12.3's failing run on `main`;
  - step 4's commit, named, as the lift with no behaviour change;
  - every expected break, old → new, by file;
  - KQ1's measurement at 390;
  - §12.7's list of sentences found untrue and how each was fixed;
  - an **Impeccable** section (harden, polish: the screen each ran on and what it changed);
  - every new string as it renders, for the voice pass.

**Review checklist** (beyond the tests passing):
- [ ] At 1280 with vitals pinned: open Help, and the vitals are in the bar, live (a pill opens its popover); change tabs, and Help follows; close it, and the pinned column is back. Reload with Help open: it comes back closed and the vitals still pinned. Nothing on the sheet is dimmed at any point.
- [ ] In the dev preview at 390, 1024 and 1280 (vitals pinned and not), read every tab's help against the tab. Every sentence that says what the sheet does is true. Spot-check five against the code.
- [ ] By keyboard alone: ? opens and closes it, Esc closes it (a tip first, if one is open), focus comes back each time; ? in a Notes field types a ?.
- [ ] GM mode: open a table, use Help pinned at 1280 and as a flyout at 1024, and the keys. Nothing differs from `main`.
- [ ] A seat's sheet: the table's Help, and its guide lines go with the table's switch.
- [ ] Guide lines Off on a lived-in character: every tab is cleaner, and nothing that states a rule or the character's state went with them.
- [ ] No Help string in `shared.js`, `sheet.js` or `gm.js`; no `sheetGuide` key unread (135); `voice.test` scans it.
- [ ] `gamedataVersion` didn't move, and `outputs.mjs` shows why.
- [ ] N is pasted whole, 278 marked in part, and INDEX matches.
- [ ] **Last, after every push:** the PR body still has its failing run, its expected breaks, §12.7's list and the Impeccable section.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md`, with this order's path, `docs/plans/help-on-the-sheet/K1-one-help.md`. Both sessions are **local**, where Impeccable is installed: run §12's commands through the Skill tool and nothing else, and treat a command reaching outside §9 as a stop.

This order's traps:
- **Lift first, alone.** Step 4 is a move with no behaviour change, its own commit, proven by two test files nobody edited. Building the sheet's Help into the moved code in the same step makes a regression in GM mode impossible to tell from new work.
- **Names other files call stay.** `app.js`, `wizard.js` and the Esc handler call `syncHelp`, `helpEscCloses` and `closeHelp` today. Keep them working, by those names.
- **`syncHelp` empties the panel off a table today** (gm.js:423), and `app.js:184` calls it on every non-table draw. On the sheet that would shut Help on every redraw. Make it follow the host, not `S.screen!=="table"`.
- **Mirror the vitals flyout, don't reuse it** (S31's trap, still true): 166's setter is the vitals', and Help has its own.
- **The swap never touches the pin.** It's drawn from `.help-pinned` meeting `body.vitals-pinned`. Code that unpins on open and re-pins on close is the design Ken and Claude dropped (KQ9): every way Help closes would have to remember to restore it.
- **The sheet's Help starts closed.** Don't read the table's `shadows.ui.gmHelp`, and don't add a sheet one.
- **A guide line isn't a rule line.** Skills' roll and Progression's IP stay when the switch is off. Hiding them is the KQ5 alternative Ken didn't take.
- **The words are gameTerms ids in K1.** Don't add a `gameTerms` row or a glossary reader to make a context's list longer; that's K2.
- **Copy lives in the data.** A Help label in code is a finding.

---

## Appendix A — The help, drafted

**For the voice pass.** Tool voice, since a player opening Help is stuck; a guide line may lean city. Words in **bold** are buttons or labels as they are on screen. Every line was written from the code and the decisions named beside it, **not from the running sheet**: §12.7 checks each one, and a line the sheet contradicts is fixed in the copy.

### A1. Guide lines (`intro`) and rule lines

| Tab | Guide line (`sheetGuide.contexts.*.intro`) | Rule line (stays in `appCopy`) |
|---|---|---|
| Main | Who you are tonight: your Stats, your health, and the checks you'll roll most. | — |
| Skills | Every Skill you have, and what you add to the roll. | `introSkills`, unchanged |
| Character | What you are and what it gives you, then the Advantages and Disadvantages you carry. *(from `introCharacter`, word for word)* | — |
| Trackers | The pools you spend and refill as the night goes. | — |
| Progression | What the city paid you, and what you spend it on. | `introProgression`, unchanged |
| Loadout | Weapons, armor and gear: what you carry into the city. *(from `introLoadout`)* | — |
| Notes | Freeform. The city keeps receipts — so should you. *(from `introNotes`)* | — |
| Admin | Free edit, for when the sheet has something wrong. | `introAdmin`, unchanged |

### A2. Each tab (`contexts`)

**main** · title "Main" · when: during
- **for:** The tab you play from. Your Stats and what they give, your health and Pain, any Conditions on you, the combat Skills you've trained, and your weapons. **Heal**, **Hurt** and **Take a hit** are here, and so is every on/off switch your character has, like a Werewolf's form. *(Decisions 151, 282, 283, 284.)*
- **words:** `TOL`, `WILL`, `LUCK`, `skill-check`, `defensive-action`
- **tips:** "Press a Stat or a Condition to read what it does." · "Damage goes in with **Take a hit**: it works out armor and Pain for you."

**skills** · title "Skills" · when: during
- **for:** Every Skill, trained or not, with the total you add to a d10. A Skill's **?** says what it covers and what's particular to it. *(Decision 285.)*
- **words:** `skill-check`, `kicker-die`, `explode`, `botch`
- **tips:** "Pain's penalty is already in these totals. The line above the table says so once."

**character** · title "Character" · when: before, during
- **for:** Your archetype and what it lets you do: its powers, its core mechanic and your specialization. Then your Advantages and Disadvantages. What you can do lives here; what you carry is on **Loadout**. *(Decision 282.)*
- **words:** none in K1 (K2 adds the trait and power tags)
- **tips:** "Press a tag on a power or a trait to read what it means."

**trackers** · title "Trackers" · when: during, between
- **for:** The pools you spend and get back: Sanity, LUCK, Çredits and CRANK. **Manual Adjustments** is for what the sheet doesn't add up by itself: an item, a ruling, a scar.
- **words:** `SAN`, `LUCK`
- **tips:** "Spend LUCK here when you spend it at the table, so the sheet stays true."

**progression** · title "Progression" · when: between
- **for:** Between sessions. **Log a session** when one ends, then spend what it paid: IP on Skills, Stats and powers, and Milestones as you meet them. **History** and the **Activity Log** are below it, and **Undo** takes back your last change. *(Decision 281.)*
- **words:** `milestone-point`, `LUCK`
- **tips:** "The jump bar under the title reaches each part in one press."

**loadout** · title "Loadout" · when: before, between
- **for:** What you carry: weapons, armor and gear, from the catalog or written in. **Buy** pays the price out of your Çredits in the same step, so one Undo takes back both.
- **words:** none in K1 (K2 adds weapon and armor tags)
- **tips:** "Ammo is gear: carry it here, and reload from it on the weapon's line."

**notes** · title "Notes" · when: during, between
- **for:** Free text for what the sheet has no place for: names, debts, what you saw. It's saved with your character.
- **words:** none
- **tips:** none

**admin** · title "Admin" · when: between
- **for:** Free edit, for fixing a mistake. Change any number, past creation's caps and pools. Every change is in the Activity Log and can be undone. Leave it from ⋮: **Exit admin mode**.
- **words:** none
- **tips:** "Use Progression's spends for what you earned. Admin is for what's wrong."

### A3. The panel's own words (`ui`)

As §8: Help · Close · On · Off · What it's for · When · On this tab · Try this · Guide lines · The ? key · Before you play · At the table · Between sessions.
