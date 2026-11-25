# Work order K4: Help's layout, and a scrollbar beside the page

**Plan:** [`../help-on-the-sheet.md`](../help-on-the-sheet.md) §3, row K4 (added by this order). **Source:** Ken, after a night of filling in GM mode with Deighton (2026-11-19), in three notes:

> the help text feels scattered as far as when you click around and what you see first. The "A night at the table" feels like its own thing and should be a "tab" in the help that is always in reach, explaining what a night at the table really is.
>
> The main page scrollbar when seeing the help should be on the left of the column, otherwise it is harder to grab the scrollbar. This feedback applies to the character sheet as well!
>
> "close" should always be visible (as well as other buttons or navigation) -- I know you can click the help icon to toggle it on and off, but I think options should always be in reach if possible.

**Built on:** K1 (the shared panel, Decision 289), K2 (*Every word*'s list, 291), K3 (298), S31 (278), the pinned vitals (160, 166). Decisions 140, 160, 166, 258, 278, 289, 291, 298.

**Status: drafted 2026-11-20** by Claude (Opus), the S31 conductor, at Ken's request ("yeah, lets draft that. it is not affected by the text deighton is reviewing"). **Approved by Ken 2026-11-20, in the S31 conductor's session: "Approve, Defaults"** (KQ28 and KQ29 on their defaults). Ken answered KQ23–KQ27 on 2026-11-20 (§4, in his words): *Vocab*, *Shortcuts*, the switches in ⋮, KQ26 Default, and KQ27 "seems reasonable" with a fuller explanation asked for. He also asked to take Deighton's notes on the night now (Deighton answered the S31 page's round 1 by 2026-11-20), so the night's three parts are rewritten from them (§9), and KQ28–KQ29 were added and answered Default.

**Branch:** cut from `origin/main` at the pre-flight commit. PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../../WORK-ORDERS.md). The conductor starts **K4 build** (Sonnet), then a fresh **K4 review** (Opus) once the PR is open. §15 is the hand-over.

**Runs alone.** It touches `shared.js` (the panel, `jumpTo`, `anchorKept`, the popover and tip placement), `gm.js` (Help's body and 50 jumps to the top), `sheet.js` (Help's body, the vitals head, 6 jumps), `app.js` (2 jumps, the wizard's vitals head), `wizard.js` (2 jumps), `shadows.css`, `shadows-data.js` (`gmGuide.ui`, `sheetGuide.ui`), `tools/phone-check.mjs`, the tests and the docs. It's no engine change. **`gmGuide`'s copy moves only where this order says** (§8): the night's three entries and their three labels, from Deighton's notes; the tab labels; `ui.back` and the switch labels go. Everything else in it waits for the renames round (Round 3 on the S31 page), which edits the same strings.

**Carried over from K3** (its review): the PR body's sections are checked last; the walk in the browser is a named list (§12, step 7); commit before merging `main`. Harden and polish by hand against §12, step 6's checklist; the Impeccable launcher isn't run.

**Pre-flight against `main` at `ea537b4`** (#373 merged; K1–K3, S31 and #343 built). Take the next free numbers on `origin/main` when they're written; the order says **N** and **N+1**.

```
Help's head       gm.js:412-413 helpBodyHtml's head(): <div class="dhead"> h2#ghelp-h + Close, then a Back button when a
                  view is open. sheet.js:96-98 (Every word) and :111-112 (a tab) draw their own .dhead the same way.
                  #ghelp itself is the scroller (shadows.css:901, overflow-y:auto); paintHelp keeps el.scrollTop
                  (shared.js:1231, 1237). Nothing in the head sticks: scroll Help and Close is gone.
The views         GM: S.helpView null | "night" | "words", switched from the FOOT (gm.js:425-427: data-hnight,
                  data-hwords, data-hkeys), back by data-help-back (gm.js:413, 434; S.helpWas holds the link to refocus).
                  Sheet: null | "words", from the foot's data-hwords (sheet.js:118), back by data-help-back (98, 134).
                  On a 1280 column the foot sits under the whole page's help; on a phone about 530px below the fold
                  (S31's review, WISHLIST's E6 line).
The night view    gm.js:414-416: heading u.nightLink, then each gmGuide.night entry (when, text, section buttons).
                  No sentence says what a night at the table is.
Every word        helpListHtml (shared.js:1246): .help-find sticks at top:-18px inside #ghelp (shadows.css:922).
                  The letter jump (shared.js:1270-1274) subtracts the find bar's height from the reach, and nothing else.
Vitals head       sheet.js:407-409 (Pin, Close) and app.js:159-160 (the wizard's flyout, Close): .dhead in #vdrawer,
                  which is its own scroller (shadows.css:859). Nothing sticks.
The page scroll   The window scrolls. A pinned column is position:fixed; right:0 (shadows.css:859, 901) and the page
                  makes room with padding-right (.app.help-pinned 941, body.vitals-pinned .app 888). So the window's
                  scrollbar is drawn at the screen's right edge, AFTER the column, beside the column's own scrollbar.
                  header.top sticks at top:0 (shadows.css:79), and six bars stick under it (--hdr-off: 323, 1212,
                  1227, 1285, 1298, 1565). .footer and .toast are fixed and already move left of a column (944, 894).
Window-scroll     window.scrollTo(0,0) at 60 call sites: gm.js ×50, sheet.js ×6, app.js ×2, wizard.js ×2
callers           (grep -n "window.scrollTo(0,0)" src/ui/*.js). Five reads of the window's position:
                  shared.js:548-549 (placePopover: scrollX/scrollY into a top/left), :707 (the tip's host offset),
                  :828 (anchorKept: window.scrollBy), :890 (jumpTo: window.scrollTo with scrollY).
                  shared.js:688 listens for scroll on document in the capture phase, so it hears any scroller already.
Tests             smoke-table-frame.test.mjs:292 and smoke-table-play.test.mjs:1329 stub window.scrollTo and read
                  its calls. harness.mjs:44 stubs scrollTo/scrollIntoView (jsdom has no layout).
                  smoke-table-help.test.mjs:297, 318-331, 362-378 and smoke-sheet-help.test.mjs:275-384 press
                  data-hnight / data-hwords / data-help-back and check focus comes back to the foot's link.
                  smoke-table-keys.test.mjs:571 presses #ghelp [data-hkeys].
phone-check       tools/phone-check.mjs seeds "1300px, vitals pinned" (68, 166-179) and measures the header once
                  the page is scrolled: it scrolls the window.
Ledger            "scrollbar" appears once (Decision 209's Why, a row's own scrollbar). No decision says which
                  element scrolls the page. 160 says the page "makes room" for a pinned column; 278 put the night,
                  words and Keys links in Help's foot; 289 gave the sheet the foot's Every word link and its Back.
```

**Probes on `main`, for the builder to record first** (the screenshot tool times out here, so as metrics, in the dev preview at 1300×900): with Help pinned on a GM table, `document.documentElement.clientWidth` and `$("ghelp").getBoundingClientRect().right` (equal: the column ends where the window's scrollbar starts); scroll Help to its end and check `$("ghelp").querySelector("[data-help-close]").getBoundingClientRect().bottom < 0` (Close is gone). The same two on a locked sheet with the vitals pinned. These are the worked examples' "before".

---

## 1. Goal and Done when

**Goal.** Help reads as a few places you can move between, not a page with its links at the bottom. The night is one of them, says what a session is, and walks its three parts in Deighton's words. Close and the way between them never scroll away, in Help or in the vitals. The switches that change the whole screen live in ⋮, where the screen's other settings are. On a wide screen the page's scrollbar sits beside the page, not on the far side of a column.

**Done when:**
- Help opens with a row of tabs under its heading and Close: on a GM table **This page · Running a session · Vocab**, then **Shortcuts**; on the sheet **This tab · Vocab**. The open tab is marked. A press switches the view. Help has no foot.
- *Running a session* opens with a short paragraph on what a session is, then **Session prep**, **Current session** and **Debrief**, each from Deighton's notes (§9).
- There is no Back button anywhere in Help.
- Scrolled to its end, Help's heading, Close and tabs are still on screen, and so are the vitals' Pin and Close. *Vocab*'s filter and letters stay just under them.
- **Guide lines** is in ⋮ on a table and on the sheet, and **The ? key** is in ⋮ on the sheet. Each shows whether it's on and flips with a press. GM mode's **Keys** is **Shortcuts** everywhere it's shown (⋮, its box's title, Help's head).
- From 1280px the page scrolls in its own box. With a column pinned, the page's scrollbar is at the column's left edge; with none, it is at the screen's edge as now. The header and every sticky bar stick as they did, every "back to the top" lands at the top, and a jump to a section lands under the header.
- Below 1280px nothing about scrolling changes, and the flyouts behave as they did (Decision 166), with the new tabs and sticky head.
- `npm run verify` and `npm run phone-check` pass.

## 2. Tier, versions, numbers

- **Rule or shape**: a player-facing behaviour someone could have chosen otherwise, and it supersedes parts of 160, 278 and 289.
- **App: minor** (a new way to move through Help; the page scrolls differently). Nothing a file stores changes: **no** game data, character, table or pack schema bump. `ui` keys are added and removed and `gmGuide.night`'s copy is rewritten; Decision 68 doesn't bump `gamedataVersion` for Help's copy (no character can observe it).
- **Two decisions**, the next free numbers on `origin/main`: **N** (Help's tabs and the heads that stay) and **N+1** (the page's own scroll box).

## 3. The decisions, drafted

```
N. **Help opens on a row of tabs that stays at its top with Close: This page, Running a session, Vocab (Shortcuts after them on a table); its switches move to ⋮; the vitals' head stays too.**
     *2026-11-20 · Ken + Deighton + Claude · Touches: Help, #ghelp, .dhead, data-help-close, data-help-back, data-hnight, data-hwords, data-hkeys, data-tkeys, helpView, helpWas, help-foot, gmGuide.ui, gmGuide.night, sheetGuide.ui, nightIntro, pageTab, nightLink, wordsLink, keysLink, guideSwitch, keySwitch, ui.when, A night at the table, Every word, Keys, Shortcuts, hdr-menu, help-find, letter jump, vdrawer, dpin, dclose, Decision 272, Decision 278, Decision 289*
     - **Decided:** Help's heading, Close and a row of tabs stay at the top of the panel as it scrolls. A table's tabs are This page, Running a session and Vocab, then Shortcuts (GM mode's Keys, renamed everywhere), which opens its box; a sheet's are This tab and Vocab. The open tab is marked, and the ? opens on This page. Running a session says what a session is, then Session prep, Current session and Debrief. Guide lines, and the sheet's ? key switch, are in ⋮; Help has no foot and no Back. The vitals' Pin and Close stay at its top too.
     - **Why:** Ken, after a night with Deighton: the night read as its own thing, its link was under the page's whole help, and Close scrolled away. Every option in reach. A switch that changes the whole screen belongs with the screen's settings, not inside one page's help. The night's words are Deighton's.
     - **Rejected:**
       - The links at the top instead of the foot, Back kept: three ways out of a view where one row does.
       - The night as a dialog: it's read beside the page, as the rest of Help is.
       - Close fixed, the tabs in the scroll: the tabs are how you move, so they're what must stay.
       - The switches at Help's foot: out of reach, and about the screen, not the page.
     - **Replaces:** Decision 278 in part (the foot's links are tabs at the top; the night's name, parts and copy; Guide lines in ⋮). Decision 289 in part (the sheet's Every word is a tab, Back is gone, its switches are in ⋮). Decision 272 in part (Keys is Shortcuts).
     - **Revisit if:** Help gets a fourth view, a phone can't spare the head's height, or ⋮ grows past what a phone shows without scrolling.
     - **Built:** app X.Y.0; PR #…; log 2026-11-… (K4).

N+1. **From 1280px the page scrolls in its own box, so with a column pinned its scrollbar is at the column's left edge.**
     *2026-11-20 · Ken + Claude · Touches: #app, scroll box, pageScroller, scrollPageTop, jumpTo, anchorKept, placePopover, tip placement, help-pinned, vitals-pinned, header.top, --hdr-off, phone-check, Decision 140, Decision 160*
     - **Decided:** From 1280px `#app` is the page's scroll box, the height of the window; the window doesn't scroll. A pinned column narrows it instead of padding it, so the page's scrollbar sits between the page and the column. Every "back to the top", jump and placement goes through one helper that knows which box scrolls. Narrower, the window scrolls, as before.
     - **Why:** Ken: the window's scrollbar was on the far side of Help's column, beside the column's own, and hard to grab. It holds for the sheet's pinned vitals too.
     - **Rejected:**
       - The column's scrollbar on its left: it would sit where the page's should and scroll Help.
       - The box only while a column is pinned: opening Help would move the page between two scrollers mid-read, and the desktop would run two scroll models.
       - The column on the left of the page: it moves every layout Decision 258 and 160 settled.
     - **Replaces:** Decision 160 in part (a pinned column narrows the page's box, not its padding).
     - **Revisit if:** a browser's keyboard or wheel scrolling misses the box, or print or the phone needs the window back.
     - **Built:** app X.Y.0; PR #…; log 2026-11-… (K4).
```

## 4. Questions for Ken

A question left blank is answered **Default**. **Answered by Ken, 2026-11-20** (his words quoted); KQ28–KQ29 **answered Default** ("Approve, Defaults").

- **KQ23 — The tabs' names.** **Answered:** "instead of 'every word', 'vocab'". So **This page** (the sheet: **This tab**), the night's tab (KQ28), **Vocab**. `wordsLink` is "Vocab" in both guides, and the view's heading says so too.
- **KQ24 — Keys.** **Answered:** "Shortcuts instead of 'keys'". In the tab row after the tabs, drawn as a button, not a tab (it opens a box, not a view). **Shortcuts** replaces **Keys** everywhere GM mode shows it: ⋮, the box's title and its switch's label, and Help's head. The `data-tkeys`/`data-hkeys` attributes and `shadows.ui.keys` keep their names (they're ids, constraint 6's spirit; tests use them).
- **KQ25 — The switches.** **Answered:** "the guide line switch … could be in the ... menu, since it affects the sheet as a whole". There are three today: GM mode's **Guide lines** (Help's foot), the sheet's **Guide lines** and **The ? key** (Help's foot), and GM mode's keys switch, which is already in the Keys box. So: both **Guide lines** go to ⋮ on their screen, and so does the sheet's **The ? key**. GM mode's keys switch stays in Shortcuts, where the keys are listed. Help has no foot.
- **KQ26 — Which tab ? opens on.** **Answered: Default.** This page, every time.
- **KQ27 — The scroll box at every width from 1280px, or only while a column is pinned.** **Answered:** "This seems reasonable, can [you] explain this in more detail?" Explained to Ken 2026-11-20; **Default unless he says otherwise**: every width from 1280px. With no column it looks and scrolls exactly as now; opening a column only narrows the box, so the page never jumps, and there's one way of scrolling to test on a desktop instead of two that hand the position back and forth.
- **KQ28 — The night tab's name.** **Answered: Default** (Running a session). Scott (round 1): "Is the section called 'a night at the table' also? I would change that if possible." Deighton's notes call its parts Session prep, Current session and Debrief, and define a session as an hour or more of play.
  - **Default:** **Running a session**. It names what the tab walks through, and fits beside This page and Vocab.
  - *Alternative:* **Session flow**, or keep **A night at the table**.
- **KQ29 — The parts' names, Deighton's** **Answered: Default** (take all three now). (Session prep, Current session, Debrief; today Before a session, At the table, After). They're `gmGuide.ui.when`, so they also rename the **When** chips on every page's Help.
  - **Default:** take all three now. Nobody else named the parts; Ken and Scott marked the old copy as fine.
  - *Alternative:* wait for Round 3, because **Debrief** is also Deighton's pick for the close-out page itself (R-closeout), where Ken and Scott picked "End the session". If Round 3 lands on Debrief for the page too, the part and the page share a name, which is the point; if not, the part is still a fair name for what comes after play.

## 5. The assumption sweep

Every row was found by grep at `ea537b4`. "Twins" are rows that draw the same thing.

| What | Today (where) | After |
|---|---|---|
| Help's head | `.dhead` with h2 + Close, scrolls away (gm.js:412-413; sheet.js:96-97, 111-112) | One head per panel, sticky at the top of `#ghelp`: h2, Close, the tab row. Drawn by one helper both hosts call, so the two can't drift |
| The tab row | none | `This page / Running a session / Vocab` + Shortcuts (table), `This tab / Vocab` (sheet). Each sets `S.helpView` (null, `"night"`, `"words"`) and repaints |
| Foot links `data-hnight`, `data-hwords`, `data-hkeys` | gm.js:425-427; sheet.js:118 | Gone from the foot; the tab row carries the same data attributes, so the tests' selectors and Keys' `returnTo:"[data-hkeys]"` (gm.js:435) still find them |
| Back, `data-help-back` | gm.js:413, 434; sheet.js:98, 134 | Gone. `S.helpWas` (gm.js:432, 434) only existed to refocus the link Back returned to: removed |
| `ui.back` | gmGuide.ui "Back to this page" (data:5182); sheetGuide.ui "Back to this tab" (5050) | Removed: nothing reads it, and Decision 135's test fails on an unread key |
| `ui.pageTab` | none | New: gmGuide "This page", sheetGuide "This tab" (KQ23) |
| `ui.nightIntro` | none | New, gmGuide: §9's paragraph. Drawn first in the night view |
| `ui.nightLink`, `wordsLink`, `keysLink` | foot link labels: "A night at the table", "Every word" (both guides), "Keys" (data:5189-5194, 5049) | The tab labels: "Running a session" (KQ28), "Vocab", "Shortcuts" |
| "Keys" in code | ⋮ item (gm.js:308), the box's title and its switch's `aria-label` and label (gm.js:338, 341, 353) | "Shortcuts". `tests/smoke-table-cast.test.mjs:87` pins ⋮'s labels: an expected break. Grep the tests and `gmGuide` for `"Keys"` and `Keys` in copy; the Keys box's own list of keys says **?** opens Help, unchanged |
| `gmGuide.night[].text` | the three parts' copy (data:5202-5230) | Rewritten from Deighton's notes (§9). `sections` unchanged |
| `gmGuide.ui.when` | "Before a session", "At the table", "After" (data:5196-5200); read by the night's headings (gm.js:415) **and every page's When chips** (gm.js:422) | "Session prep", "Current session", "Debrief" (KQ29). **Twin:** `tests/engine.test.mjs:435` checks the keys, not the words; nothing else pins them. `sheetGuide.ui.when` (5058) is the sheet's and doesn't change |
| GM's Guide lines switch | Help's foot, `data-help-switch` (gm.js:428; helpSwitchHtml 397-402; wiring 442-447) | A ⋮ item on the table's menu (gm.js:304-310) that shows On or Off and flips with a press. It still repaints the table (`renderTable()`, as gm.js:445 does) |
| The sheet's switches | Help's foot, `data-help-guideswitch`, `data-help-keyswitch` (sheet.js:119-120; wiring 123-137) | Two ⋮ items on the sheet's menu (app.js:38-45). Guide lines redraws the page (`renderMain()`); The ? key repaints nothing but itself and the ?'s `aria-keyshortcuts` (app.js:36) |
| `ui.guideSwitch`, `ui.keySwitch`, `ui.on`, `ui.off` | the switches' labels in both guides | Still read, now by ⋮. If ⋮ draws "Guide lines: On" from them, keep all four; any one left unread fails Decision 135's test, which is the check |
| Switch tests | smoke-table-help.test.mjs:221-233; smoke-sheet-help.test.mjs:159-203 press `#ghelp [data-help-guide-*]`/`[data-help-keys-*]` | Expected breaks: they press the ⋮ item instead. Focus stays on the item, and ⋮ stays open after the press |
| The night view | gm.js:414-416, heading `nightLink` + Back | Same heading and entries, the intro first, no Back. Its section buttons (`data-hsec`, gm.js:436-441) keep what they do |
| Focus on a tab press | the view's filter or heading (gm.js:432; sheet.js:132) | The pressed tab keeps focus (the view changes under it); on Vocab, focus stays on the tab, not the filter. **Twin:** `paintHelp`'s refocus when focus was inside (shared.js:1238) must not move it to the h2 |
| `.help-find` | sticky `top:-18px` (css:922) | Sticky just under the head (the head's height, not a literal) |
| The letter jump's reach | subtracts the find bar only (shared.js:1271-1273) | Subtracts the head too: a word jumped to lands under both |
| `paintHelp`'s kept scroll | `top` kept only when the view is unchanged (shared.js:1231) | Unchanged: a tab press starts the new view at its top |
| The vitals' head | sheet.js:407-409; app.js:159-160 | Sticky at the top of `#vdrawer` (CSS only). **Twin:** the wizard's flyout (app.js) has no Pin, and gets the same rule |
| The page's scroller | the window | From 1280px: `#app` (`height:100vh; overflow-y:auto`), `html,body` don't scroll. Below: the window |
| A pinned column's room | `.app.help-pinned{padding-right}` (css:941); `body.vitals-pinned .app{padding-right}` (888) | From 1280px the box's width ends at the column (a right margin or width), so its scrollbar is at the column's left edge. `.footer` and `.toast` already move (944, 894) |
| `window.scrollTo(0,0)` | 60 sites (sheet ×6, gm ×50, app ×2, wizard ×2) | `scrollPageTop()` in shared.js, which scrolls whichever box scrolls the page. A test greps `src/ui` and fails on any `window.scrollTo(`, `window.scrollBy(` or `window.scrollY` outside that helper |
| `jumpTo` | `window.scrollTo` with `window.scrollY` (shared.js:890) | Scrolls the page's box; the offset is still the header and stuck bar's |
| `anchorKept` | `window.scrollBy` (shared.js:828) | Scrolls the page's box by the same delta |
| `placePopover` | adds `window.scrollX/Y` (shared.js:548-549) | Today the popover is placed in document coordinates. If the box scrolls, the popover must still sit under its trigger and move with it: **read where the popover lives in the DOM before choosing** (inside `#app` → the box's scroll offsets; outside → fixed coordinates). Report which in the PR |
| The tip's host offset | `-window.scrollX/Y` (shared.js:707) | The same choice as the popover, for the same reason |
| Scroll listener | `document` capture (shared.js:688) | Unchanged: capture hears `#app`'s scroll |
| Sticky header and bars | `top:0` / `--hdr-off` inside the window | Unchanged values; they now stick inside `#app`. Check every one in the browser (§12, step 7) |
| Keyboard scrolling | the window takes PageDown, Space, arrows | The box must take them with focus anywhere in the page, and after a click on the page's background. If it doesn't, the box gets `tabindex="-1"` and is focused on a jump to the top. **Stop and ask** if neither works |
| Print | `#app` hidden in print (print.css:19) | Unchanged |
| `phone-check` | scrolls the window at 1300px pinned (phone-check.mjs:166-179) | Scrolls the page's box from 1280px. Its fixture should not move; if it does, stop and ask |
| WISHLIST E6 line | "Help's foot about 530px below the fold on a phone" (WISHLIST.md:159) | Rewritten: Help's tabs are at its top since K4 |

**What text points at what this changes?** gmGuide's tips and `for` lines were grepped for "foot", "Back", "below", "link" and "A night at the table": none names the foot or Back. `sheetGuide` the same. The Keys dialog lists **?** as Help and doesn't name the foot.

## 6. Read first

- `CLAUDE.md`: constraints 1–5, *Change tiers*, *Decisions*.
- SCHEMA §4: Decisions 140, 160, 166, 258, 259, 272, 278, 289, 291.
- `src/ui/shared.js`: the Help section (1149-1290), `placePopover` (≈540), the tip (≈680-720), `anchorKept` (≈820), `jumpTo` (≈880).
- `src/ui/gm.js`: 364-460 (the table's Help host). `src/ui/sheet.js`: 88-164 (the sheet's), 400-420 (the vitals head).
- `src/styles/shadows.css`: 55-90 (root and header), 855-960 (vitals and Help).
- `tests/smoke-table-help.test.mjs`, `tests/smoke-sheet-help.test.mjs`, `tests/smokekit.mjs`, `tests/harness.mjs`.

## 7. Out of scope

- Any change to Help's copy beyond §8's list. Deighton's other notes (the page titles, *Cast*, *Threads*, *Clocks*, the words) go to the renames round's Round 3 and the copy Fix after it.
- The renames themselves: *Close out*, *Next session*, *Jot* and the tab names keep today's labels here, and the night's copy names them as they are.
- The column's width, its side, or the 1280px threshold.
- The wizard's Help (KQ7 kept it out of the plan).
- Phones' scrolling: below 1280px the window scrolls as now.
- The modals (`dialog.modal`), which scroll themselves.

## 8. The shapes

- **Data, `gmGuide`.** `ui`: add `pageTab: "This page"` and `nightIntro` (§9); `nightLink` → "Running a session" (KQ28); `wordsLink` → "Vocab"; `keysLink` → "Shortcuts"; `when` → `before: "Session prep"`, `during: "Current session"`, `after: "Debrief"` (KQ29); remove `back`. `night[0..2].text` → §9's three paragraphs; their `when` and `sections` don't change.
- **Data, `sheetGuide`.** `ui`: add `pageTab: "This tab"`; `wordsLink` → "Vocab"; remove `back`.
- **No other key moves.** `guideSwitch`, `keySwitch`, `on`, `off` stay and are read by ⋮.
- **`scrollPageTop()`** in `shared.js`: scrolls the page's box to the top. **`pageScroller()`**: returns `#app` when it's the box (the media query matches and `#app` exists), else `document.scrollingElement`. Both total: no `#app`, no throw. Nothing else knows which one scrolls.
- **One head helper** (`helpHeadHtml(title, tabs, u)` or as the builder names it) in `shared.js`, called by both hosts. A host passes its tabs as `[{ view, label, attr }]` and, for the table, Shortcuts.
- **A ⋮ switch item**: one helper both menus call, drawing a button that names the switch and its state from the guide's `ui` ("Guide lines: On", or the label with a state chip; the builder picks and shows it in the PR) with `aria-pressed`. A press flips the setting, redraws that one item in place, keeps focus on it and leaves ⋮ open. Esc and a click outside close ⋮ as now.
- **No saved file changes.** `S.helpView` stays view state.

## 9. The UI

**The head.** At the top of Help, always: the page's (or view's) title, Close at its right, and under them one row of tabs. It sticks to the top of the panel and has the panel's background, so nothing shows through. Below 1280px, in the flyout, the same.

**The tabs.** Buttons, like the table's own tab row: the open one has `aria-current="page"` and the active style. Pressing one switches the view and keeps focus on it. Tab order: Close, then the tabs, then the view. On a phone at 375px the row wraps rather than scrolls sideways; check it fits in two lines at most.

**Shortcuts** (KQ24): after the tabs, styled as a button, opening the Shortcuts box (today's Keys box, renamed). Focus returns to it when the box closes.

**This page / This tab.** As now, with no foot.

**⋮.** On a table: **Guide lines** joins the menu, before What's new. On the sheet: **Guide lines** and **The ? key**, after Help. Each shows its state and flips in place (§8). GM mode's **Keys** item is **Shortcuts**.

**Running a session** (KQ28). The intro, then the three parts under Deighton's names (KQ29), each with its section buttons as now. Deighton's notes (S31 page, round 1, N-before / N-during / N-after) are the source; the drafts below keep what he asked for and name the buttons as the app labels them today (*New session*, not "Start New Session"; *Close out*, not "Close It Out"), since the renames are Round 3's. **For a voice pass, and for Deighton to read once more:**

> **Intro:** A session is one sitting of play, an hour or more, whenever you play. GM mode follows it in three parts: **Session prep** before you start, the **Current session** while you play, and the **Debrief** once you're done.

> **Session prep:** Open **Sessions** and read **Next session** for everything the coming session needs. Check the loose ends from last time, if there are any. Note the objectives, places and people you want the crew to run into, and work over any fight built from the **Threats** you're using. Note what the players don't know yet but could find out with the right choices.

> **Current session:** Press **New session** when you're ready to play. **Jot** (J) catches a detail as it happens, without leaving the page you're on. Run fights from **Encounters**, which tracks the turns and the threats in them. **Reference** has the rules for anything that isn't clear in the moment.

> **Debrief:** Once the session's over, press **Close out**. Say how long you played, award the IP, and fill in what else happened. Then **Export** from ⋮ to download a copy of the table and everything that changed.

What today's copy says that these drop, for Ken to weigh in the voice pass: the strip under the header (round, thread, nearest clock), **Players** for HP and Conditions at a glance, closing threads and adding the people the crew met at close-out, and "the file is the copy that lasts". The builder checks each button and key the drafts name against the code (`J` for Jot, *Close out*, *Export* in ⋮, *Reference* as a table tab) before pasting them.

**Vocab.** Today's *Every word*, renamed, with its filter and letters sticking under the head.

**The vitals.** Pin and Close stick at the top of the flyout and the pinned column; nothing else moves.

**The page's scrollbar.** From 1280px, with a column pinned, the page's scrollbar sits at the column's left edge, the column's own at the screen's edge. With no column, one scrollbar at the screen's edge, as now. Wheel, trackpad and keys scroll the page as before.

**Where things land:**

| Press | The view | Focus | Scroll |
|---|---|---|---|
| ? (button or key) | This page | Close | top of Help |
| A tab | that view | the tab | top of Help |
| A letter in Vocab | unchanged | the word's `dt` | the word just under the head and filter |
| Shortcuts | unchanged | the Shortcuts box; back to Shortcuts on close | unchanged |
| A ⋮ switch | unchanged (the page redraws for Guide lines) | stays on the item; ⋮ stays open | unchanged |
| A night's section button | the page's own help (column) / closed (flyout) | the page's tab, as now | page at the top |
| Close | — | where ? was pressed, as now | page unchanged |
| Any jump to a page or "back to the top" | — | as now | the page's box at the top |

## 10. Worked examples, as named tests

Write these first and show them failing on `main`.

1. `smoke-table-help.test.mjs` — **"K4: a table's Help opens on This page with its tabs and Close in one head"**: open Help; the head holds h2, Close and tabs labelled `ui.pageTab`, `ui.nightLink`, `ui.wordsLink` ("This page", "Running a session", "Vocab"), in that order, then a Shortcuts button; This page has `aria-current="page"`; there's no `[data-help-back]`, no `.help-foot` and no switch inside `#ghelp`.
2. `smoke-table-help.test.mjs` — **"K4: Running a session says what a session is, then Session prep, Current session and Debrief"**: press the night tab; the first paragraph is `ui.nightIntro`'s text; three `h3` follow, reading "Session prep", "Current session", "Debrief"; the night tab is current and has focus. And a page's **When** chips read the new names (Sessions shows "Session prep").
3. `smoke-sheet-help.test.mjs` — **"K4: the sheet's Help has This tab and Vocab, and no Back"**: open Help on Trackers; two tabs; press Vocab; it's current, focus on it, the filter shows; press This tab; Trackers' help, focus on This tab.
4. `smoke-table-help.test.mjs` and `smoke-sheet-help.test.mjs` — **"K4: Guide lines is in ⋮, shows its state and flips in place"**: open ⋮; the Guide lines item reads On (`aria-pressed="true"`); press it; the page's guide lines are gone, the item reads Off, focus is on it, ⋮ is still open, and `shadows.ui.gmGuide` (table) / `shadows.ui.sheetGuide` (sheet) is "off". On the sheet the same for The ? key and `shadows.ui.keys`. And ⋮ → Shortcuts opens a box titled "Shortcuts".
5. `smoke-table-frame.test.mjs` — **"K4: from 1280px a jump to the top scrolls the page's box, not the window"**: at 1280, stub `window.scrollTo` to record and give `#app` a `scrollTop` setter that records; press a table tab; the box was scrolled to 0 and the window wasn't called. At 1024 the window was.
6. `build.test.mjs` (it holds the other `src/ui` guards) — **"K4: nothing but the page helper scrolls the window"**: no `window.scrollTo(`, `window.scrollBy(` or `window.scrollY`/`scrollX` in `src/ui` outside `scrollPageTop`/`pageScroller`. Mutation-test it by putting one `window.scrollTo(0,0)` back.
7. **CSS checks, in jsdom where they can be read** (`getComputedStyle` sees the stylesheet's rules, not layout): `#ghelp .dhead` (or the head's class) is `position:sticky`; `.vdrawer .dhead` is too; under `min-width:1280px` `#app` has `overflow-y:auto`. If jsdom can't evaluate the media query, assert the rule's text in `shadows.css` instead, and say so.

## 11. Tests beyond the examples

- **The expected breaks** (update them, they're not stops): the S31 and K2 tests that press the foot's `[data-hnight]`/`[data-hwords]` and `[data-help-back]` and check focus returns to the foot's link (smoke-table-help.test.mjs:318-331, 362-378; smoke-sheet-help.test.mjs:275-384). A tab press replaces each Back press; focus checks move to the tab. The switch tests (smoke-table-help.test.mjs:221-233; smoke-sheet-help.test.mjs:159-203) press the ⋮ item. `smoke-table-cast.test.mjs:87` pins ⋮'s labels: it gains Guide lines, and Keys reads Shortcuts. A test that pins `nightLink`, `wordsLink` or the old `when` words reads the data, so it follows; one that pins the literal "Every word" or "Keys" is an expected break. `smoke-table-keys.test.mjs:571` keeps working through the same attribute. `smoke-table-frame.test.mjs:292` and `smoke-table-play.test.mjs:1329` record `window.scrollTo`: at their width the window still scrolls, or they move to the box; say which.
- **Decision 135:** the unread-key test fails while `ui.back` is still in the data: that's the proof it had to go.
- **Totality:** `pageScroller()` with no `#app` returns the document's scroller; `scrollPageTop()` with no `matchMedia` scrolls the window.
- **Voice:** `nightIntro` and the three night paragraphs pass `voice.test.mjs`.
- **Mutation-test** example 6's guard and the sticky-head assertion (drop `position:sticky` and watch it fail).

## 12. Steps

1. Record the probes (header) on `main` in the dev preview. Write §10's examples; show them failing. `npm run test:fast`.
2. The data keys and copy (§8); the head helper; both hosts draw the head and tabs; remove the foot, Back, `S.helpWas`; the ⋮ switch items on both menus; Keys → Shortcuts. Update the expected breaks. `npm run verify`.
3. The sticky heads (Help, vitals both drawers), the find bar under the head, the letter jump's reach. `npm run verify`.
4. `pageScroller`/`scrollPageTop`; replace all 60 call sites; then `jumpTo`, `anchorKept`, the popover and the tip. The guard (example 6). `npm run verify`.
5. The CSS: `#app` as the box from 1280px, the pinned columns narrowing it. `phone-check` updated to scroll the box. `npm run verify`, `npm run phone-check`.
6. **Harden and polish by hand**, reporting each in the PR: keyboard only through the head and tabs; a 200% zoom; the reduced-motion setting; light theme; the tab row at 375px, 768px and 1280px; a long seat title (`seatTab`) wrapping in the head.
7. **Walk it in the dev preview**, at 1300×900 then 1024 then 375, each with metrics: (a) a GM table, Help pinned, scrolled to the end of every tab — Close on screen; (b) the page's scrollbar: `$("app").getBoundingClientRect().right` equals the column's left, and `$("app").scrollHeight > clientHeight` on a long page; (c) every sticky bar sticks (the header, `tbl-bar`, `enc-bar`, the jump bar, the cast panel) on Sessions, a running encounter, Cast and Reference; (d) a popover and a tip opened low on a scrolled page sit under their trigger, then follow it when the page scrolls; (e) a locked sheet, vitals pinned, scrolled — Pin and Close on screen, the page's scrollbar beside the vitals; (f) Help and vitals swap (Decision 289) still works; (g) at 1024 and 375, nothing about scrolling changed. Use the sample table (`samples/`, CLAUDE.md says how to seed it).
8. Close-out (§14).

## 13. Stop and ask

**Stop if:**
- The keyboard can't scroll the page's box without focus tricks beyond `tabindex="-1"` on it.
- A sticky bar can't stick inside the box at its current `top`.
- `phone-check`'s fixture moves.
- The tab row needs more than two lines at 375px.
- A popover or tip can't follow its trigger with either placement.

**Not stops:** the expected breaks in §11; the unread-key failure for `ui.back`; renaming a test that names "the foot".

## 14. Close-out

- **`close-the-session`** for *Rule or shape*: the app minor bump (`npm run bump`), CHANGELOG lines, `npm run changelog`, the two decisions with INDEX lines and the supersession marks on **160, 272, 278 and 289** (entries and INDEX lines), STATE rewritten where Help's line is, a log entry, a `shipped.md` row, the plan's K4 row marked built, the WISHLIST E6 line.
- **CHANGELOG** (under the GM mode and sheet headings as fits; player voice):
  - **Help has tabs.** *This page*, *Running a session* and *Vocab* sit at the top with Close, and stay there as you scroll. *Running a session* says what a session is, then walks Session prep, Current session and Debrief.
  - **Guide lines is in ⋮.** So is the sheet's switch for the **?** key. GM mode's Keys are now **Shortcuts**.
  - **Close stays in reach.** Help's and the vitals' buttons no longer scroll away.
  - **The scrollbar is beside the page.** On a wide screen with Help or the vitals pinned, the page's scrollbar sits next to the page, not past the column.
- **PR title:** `feat(help): tabs at Help's top, heads that stay, the page's own scrollbar (K4, Decisions N, N+1)`
- **PR body:** the template's sections, plus **Probes before and after** (the header's metrics), **The 60 call sites** (one line: the grep, before and after), **Popover and tip placement** (which choice, why), **New strings as they render** (for the voice pass), **Where the order didn't fit**.

**Review checklist** (beyond the tests passing):
- Re-grep `window.scroll`, `scrollY`, `scrollX`, `pageYOffset`, `scrollingElement` in `src/ui` yourself.
- Run §12, step 7's walk yourself, at all three widths, including (d) and (f).
- Check every sticky element in `shadows.css` (the pre-flight counts 11 `position:sticky`) on a page that uses it.
- Open the Shortcuts box from the head and from ⋮, and check focus comes back to each.
- Flip each ⋮ switch with the keyboard and check ⋮ stays open with focus on it.
- Grep the ledger and `docs/` for "Keys" as a label (259, 272) and "Every word" (289, 291): every decision whose text names the old label is either marked superseded in part or cited.
- The supersession marks on 160, 272, 278, 289, entries and INDEX.
- The four night strings pasted in the PR for Ken's voice pass, and nothing in `gmGuide` changed beyond §8's list (`git diff` on the data).

## 15. Handing it over

The two prompts in `WORK-ORDERS.md`, with this order's path: `docs/plans/help-on-the-sheet/K4-help-layout.md`. This order's own traps:

- **The page scrolls in `#app`, not the window, only from 1280px.** jsdom has no layout: a test that sets the width through the harness gets the media query, but `scrollTop` on an element is a plain property. Stub what you read.
- **`#ghelp` is the scroller of Help.** A sticky head goes inside it; don't split it into a head and a scrolling body, or `paintHelp`'s kept `scrollTop` and the letter jump both break.
- **The find bar sticks at `top:-18px`** to cover the panel's padding. Under a sticky head it needs the head's height; don't hard-code a pixel count that a wrapped tab row breaks.
- **The popover and the tip are placed in document coordinates today.** Read where each element lives before choosing how it follows the page.
- **Keep the data attributes** `data-hnight`, `data-hwords`, `data-hkeys`, `data-tkeys` and the `shadows.ui.*` keys: tests and Shortcuts' `returnTo` use them. Only the labels change.
- **Don't touch `gmGuide`'s other strings**: Round 3 of the renames edits them.
- **The night's drafts name buttons.** Check every one against the code before pasting; a label that's wrong is a fix to the draft, reported in the PR, not a change to the button.
