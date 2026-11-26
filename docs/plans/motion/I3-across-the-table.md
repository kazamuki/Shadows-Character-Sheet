# Work order I3: Across the table

**Plan:** [`../motion.md`](../motion.md) §3, row I3, and its I3 pre-flight bullet; §5 (IQ5: in GM mode only a seat crossing a Major gets a burst, and a Minor gets its gold chip). **Source:** the Motion Lab page's GM cards, which Ken approved with the plan (2026-11-24).

**Built on:** Decision 316 (I1's kit: `calm()`, `beatRun`, `stopBeats`, the count, the float, the frame trap) and 317 (I2: `beat-print`, `beat-stamp`, the burst, the skip, `nudgeToNight`'s lesson). Also 212 (`tableChange`, the table's undo and toast), 241 (a line reads as a sentence), 253 (the opening, Delay, Act now, Reset), 269 (one row acts at a time; the encounter row), 270 (the Tonight strip; Close out ends on its awards), 272 (N runs Next), 205/206/302 (the award log and its jobs), 254 (a seat's copy), 178 (clocks).

**Status: drafted 2026-11-25** by Claude (Opus), I2's reviewer, at the conductor's request. **Approved by Ken 2026-11-25**, in the conductor's session: "Approve, defaults", so IQ18–IQ25 are Default (IQ21 is (b)). The plan's IQ1–IQ6 are Default (Ken, 2026-11-24). IQ5 is reopened by IQ21, because the app can't do what it assumed.

**Branch:** cut from `origin/main` at the pre-flight commit. PR to `main`. Nothing ships switched off. GM mode is on (`FEATURES.gm`).

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **I3 build** (Sonnet), then a fresh **I3 review** (Opus) once the PR is open. §15 is the hand-over.

**Runs alone.** It touches `shared.js` (I2's burst and skip move out of `playNight` into the kit), `gm.js` (`tableChange`, the encounter page, the clocks, the close-out's end), `shadows.css`, `tools/phone-check.mjs`, `DESIGN.md`, the tests and the docs. It changes no engine, data or schema.

**Pre-flight against `main` at `f881bcd`** (#397, I2, merged). Take the next free decision number on `origin/main` when it's written (the order says **N**); at the pre-flight it was 318. Everything below was measured in the dev preview (`?gm=on`, the *Dead Air* sample, the running encounter `EN-T0R5ADN7` at round 2), at 1280×900 and 375×812. **The pre-flight found five places where the plan's picture isn't the app's:**

1. **GM mode can't see a seat cross a Major (IQ21).** The close-out writes an award log (`writeCloseOut`, engine.js:8658), and the log says "log a session with the Milestone Point". It never touches a seat's character. A seat's copy is the last file imported (254), so its Milestone Points are as of that import. `awardTotals` (8706) counts the logs' ticked Milestone Points by name. No screen reads them, and none adds them to a copy. There's no number that crosses 10.
2. **The register lines and *Written* are on two pages (IQ22).** Write (`data-co-write`, gm.js:3227) lands on the close-out's own end page (`closeEndHtml`, 3180): "Session 7 is closed out", then the log's lines. It scrolls to 0, with the heading at 179–264 and the lines at 270–448 at 375px, all above the toast at 673. *Written* (`closeOutSectionHtml`, 3060) is on the session page, which the GM sees only after Done. So the beat goes on the end page, and *Written* doesn't move.
3. **Tonight's chip is never drawn where a row goes down (IQ20).** `paintTonight` (564) draws nothing when `main` has an `.enc-bar`, and an open running encounter always has one. A row is hit on that page, so the *Down* chip appears only after the GM leaves it: on a tab switch, which is never a beat.
4. **The acting row ends at the screen's bottom edge, under the undo toast (IQ19).** Next (`next`, 4360) calls `toActive()`, which is `scrollIntoView({ block:"nearest" })`. At 1280×900 each Next left the new row ending at 888 of 900, with the toast at 819–864 over its middle. At 375×812 it ended at 800 of 812, with the toast (91–284 × 651–776) over its lower half. Next and "Round 2 · Reclaim drone" are in the sticky `.enc-bar` (`.enc-status`) at the top: 57–113 at 1280, 57–170 at 375. So the button the GM pressed is 600–750px from the row that moved.
5. **A clock's + doesn't redraw (the take-once).** Both clock binders (`bindClockLines`'s `step`, 2187; `bindClocks`'s `clockEdit`, 2225) call `tableChange(…, false)` and then paint the row in place after `update(false)` returns. `update(false)` skips `renderMain` (shared.js:305), so a beat stored in `S` for the next render would sit there until a tab switch, then replay. The close-out's Write and its edits (`edit`, 3200) are `false` too.

```
tableChange()      gm.js:96-108. fn(); r=recordTableAction(t, tableBase.copy, …); rebaseTable(); update(redraw); the toast.
                   The before is tableBase.copy (the table as of the last record), not a copy taken here: most presses run
                   their Engine writer first and tableChange(()=>{}) after (the comment at 80-84). Typing folds (typingNow).
undoTableEntry()   gm.js:112-126. Engine.undoTableAction; update(). Never through tableChange.
update()           shared.js:302-309. renderMain (only when redraw), …, playBeats() (sheet beats), then paintTonight() on a table.
renderMain         app.js:191: S.beats taken on every screen, kept only when S.screen==="sheet". Tables never set S.beats.
S replaced         gm.js:128 openTable, gm.js:614 renderTable (S=homeState() with GM off), shared.js:94 goHome. (I2's SF1.)
Next turn          gm.js:4360 next: Engine.nextTurn → tableChange(()=>{}) → focus Next, toActive(), announce("<name> acts").
Who acts, else     4415 start (startEncounter), 4444 Act now (actNow), 4530 a pick (setTurn, data-eturn), 4605 Delay
                   (delayTurn), 4378 the opening (setOpening), 4597 Finish the round (resolveEncounterReset), key N
                   (gm.js:458 clicks the same button). Every one ends in tableChange. engine.js:10029 nextTurn; e.turn, e.round.
Round              The new round starts at Finish the round (resolveEncounterReset); the bar's .enc-status reads "Round N · name".
Rows               encRowHtml gm.js:3975. .enc-row.active (cyan left edge, shadows.css:1670), .enc-row.out (opacity .65, 1671),
                   the HP line's <b class="enc-down">Down</b> (gm.js:3785) when health.down.
Clocks             clockHtml 2148 (a block: .clock-boxes, .clock-count role="status", [data-clockfull] "Full"),
                   clockLineHtml 2171 (a line: [data-cline-n] "n of m" or "Full"). Painted in place by paint (2181) and
                   paintClock (2228), which rewrites .clock-boxes' innerHTML. Tonight's clock chip (557) is a third twin.
Close-out's end    gm.js:3240 S.coEnd=id; scrollPageTop(); update(); focus [data-coend-h]. closeEndHtml 3180, its .co-log lines.
I2's kit           shared.js: calm, announce, beatRun, stopBeats (removes .beat-burst everywhere), playNight's burst() and
                   finish/off (closures inside playNight: not reusable as they stand), beat-print, beat-stamp, tagPrint.
```

**Probes on `main`** (the dev preview, the *Dead Air* sample, encounter `EN-T0R5ADN7`, round 2):
- Four presses of Next go Reclaim drone → Reclaim cleaner B → Juno Park → Dr. Imani Achterberg, then the round's reset. The page scrolls 311 → 488 → 730 → 893 at 1280. Each press's acting row ends 12px from the viewport's bottom. The toast is up from the second press on. `announce` says "<name> acts".
- At the fifth press, `nextTurn` returns `reset`: the rows give way to the reset step, and the page is at 8. *Finish the round* starts round 3.
- Tonight's clock chip read "Dex before the full moon 7 of 8". From it, + makes the line read "Full" in place (the same element, 446–496 at 375), and focus goes to −. The chip moves on to the next-nearest clock ("Joss's network 3 of 4").
- Write on the open session (`SE-HR5CH1JX`, Session 7): the end page, three log lines, the toast "Closed out Session 7".

**Carried over**

*From I2's order (what the order got wrong or left out):*
- **Three placement misses, none of them measured.** IQ11 (d) assumed the page's top was where the player looked, and Log session's scroll put the strip off-screen (MF1). The fix's first phone-check row centred the button, which hid the edge case of a button at the screen's bottom. The nudge then put the strip under the undo toast (SF3). The review caught each one only by pressing the button in a real layout. **This order measured every beat's place in the pre-flight** (findings 2–4 above), and §11's phone-check pass presses from where Playwright's own click leaves the control, never a centred one, and checks the toast.
- **A once-a-sitting flag kept in `S`** (I2's SF1): every `S =` wipes it. GM mode has two of those (gm.js:128, 614). Nothing here keeps state in `S` that must outlive a render.

*From I2's build:*
- **The frame fixture was 64 frames stale** when I2 started (J1–J4, I1 and K5 never re-recorded it). I2 re-recorded it (a4cf7c6). I3 moves no sheet frame. The fixture has no table frames (`recordFrames` opens the sheet and the wizard), so it should not change. If it does, that's a stop.
- **A mutation script died before it restored `shared.js`.** Restore every mutated file in a `trap` (bash) or a `finally` (node), and diff it against the saved copy before moving on.
- **A background run ended and the builder never woke**, so it stalled until the conductor nudged it. Never end a turn waiting on a run nothing watches; watch it with a monitor, or run it in the foreground.
- **phone-check runs outside `npm test`** (CI has no browser), so the builder and the reviewer each run it by hand and paste what it says.

*From the conductor:* Ken's answers in I2 were IQ11 (d), then "Yes, stop scrolling" (MF1), then "Yes, nudge it": the smallest scroll, never to the top, capped under the header, and above the undo toast. "Keep it" for focus on a group's summary when no Take is enabled. IQ17: "Yes, words as built".

---

## 1. Goal and Done when

**Goal.** At the table, a GM who looks up from their notes can see what just changed. Next turn marks the row acting now, in the sticky bar where they pressed it and on the row itself, and a new round takes a stamp. A clock's + draws its segment in, and a clock that fills takes the stamp on *Full*. A row that goes down fades back instead of snapping, and its *Down* takes a stamp. Writing a close-out prints the award log's lines in, one by one, and its heading takes the stamp. Undo, a later render, a tab switch and reduced motion move nothing.

**Done when:**
- **Next turn:** the bar's actor name takes the stamp (`beat-stamp`), and the new acting row's cyan edge draws in top to bottom (.25s). The same happens for every other press that moves the turn: Start, a pick, Act now, Delay, the opening, key N. The page scrolls only as it does today, and with IQ19 the acting row ends above the undo toast.
- **Finish the round:** the bar's "Round N" takes the stamp, and the screen reader hears "Round N" once.
- **A clock's +:** the segment it filled draws in (`tagPrint`, .25s) in every twin drawn on the page: the block, the line, and Tonight's chip count. A clock that reaches full stamps its *Full* (the block's `[data-clockfull]`, the line's `[data-cline-n]`). **−** moves nothing.
- **A row goes down or out:** a row marked out fades to its .65 over .3s instead of snapping. A row whose health turns *Down* stamps its `.enc-down`. Nothing plays for Tonight's chip (IQ20).
- **Write the award log:** on the end page, the heading "X is closed out" takes the stamp, and the log's lines print in 60ms apart (eight at most, then the rest at once). A line that took a Milestone Point has its words "the Milestone Point" in gold, as state, not a beat (IQ21's default). Redo then Write plays it again; Back, Done, a tab switch or a later render don't.
- Undo (the toast, Activity, Ctrl/⌘+Z), a tab switch, a later render, typing in a field: nothing moves. With reduced motion, everything is already final, nothing moves, and the screen reader still hears "<name> acts" (as today) and "Round N".
- `phone-check` measures each beat's place (§11) at 1280px and 375px, and runs again under reduced motion and in the light theme. `npm run verify` passes, and W43's guard and the contrast guard pass with the new CSS.

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape*: a player-facing behaviour in GM mode, and the acting row's scroll (IQ19).
- **App:** minor, 0.78.0 → **0.79.0** (or the next minor, if another lands first).
- **Game data, character, table and pack schema, ruleset:** none. Nothing is saved. The beat lives in a module variable in `gm.js`, never in `S` and never in the table (constraint 7).
- **Decision:** one, **N** (§3). It replaces nothing. The builder still greps §4's Touches for `toActive`, `enc-row`, `paintTonight`, `clockHtml`, `closeEndHtml`, `tableChange` and `scrollIntoView` (§5's last row), and marks anything a hit says otherwise.
- **Flags:** none.

## 3. The decision, drafted

Paste it as written and fill in *Built*. It is under 350 words.

```
N. **The table moves once too: the acting row and the round, a clock's segment and its Full, a row going down, and the award log printing in.**
     *2026-11-NN · Ken + Claude · Touches: tableChange, tableBeatsFrom, playTableBeats, tableBeat, beatBurst, beatSkip, enc-bar, enc-status, enc-row.active, toActive, enc-row.out, enc-down, clockHtml, clockLineHtml, data-clockfull, data-cline-n, Tonight, paintTonight, closeEndHtml, co-log, coJustWritten, announce, phone-check, I3*
     - **Decided:** A table press that moves the turn stamps the bar's actor name and draws the acting row's cyan edge; Finish the round stamps the round. A clock's + draws its segment in wherever it's drawn, and a clock that fills stamps Full. A row marked out fades; a row gone Down stamps it. Writing a close-out prints the award log's lines in on its end page, one by one, under a stamped heading. The acting row is kept clear of the undo toast. Nothing moves on undo, typing, a later render or under reduced motion; the screen reader hears the turn and the round.
     - **Why:** Ken, after the Motion Lab (2026-11-24): a GM who looks up has lost the turn.
     - **Rejected:**
       - A cyan edge that slides from the old row to the new: the page scrolls under it, so it would be measured mid-scroll.
       - A burst when a seat crosses a Major: the table doesn't hold a seat's Milestone Points (IQ21).
       - Tonight's chip sliding in when a row goes down: the strip isn't drawn on the encounter page (IQ20).
       - The beat kept in S for the next render: a press that doesn't redraw (a clock's +) would replay it later.
     - **Replaces:** nothing. It extends Decisions 316 and 317's kit to GM mode.
     - **Revisit if:** the table learns a seat's Milestone Points (a seat's copy updated by the close-out), or the encounter page draws the Tonight strip.
     - **Built:** app 0.79.0, PR (this one), log entry 2026-11-NN.
```

## 4. Questions for Ken

Each has a default. One left blank is answered **Default**.

- **IQ18: Where Next turn's beat plays.** **Default** (Ken, 2026-11-25). The GM presses Next in the sticky bar at the top, and the row that moved ends at the screen's bottom (finding 4). *Default:* both. The bar's actor name takes the stamp, and the acting row's cyan edge draws in top to bottom. *Not taken:* the plan's "slides the cyan edge to the row acting now". The page scrolls during the press, so a slide between two rows would be measured mid-scroll, which is I1's float trap. The draw-in reads as the same thing with nothing to measure.
- **IQ19: The acting row and the undo toast.** **Default** (Ken, 2026-11-25). At both widths, Next leaves the acting row at the screen's bottom edge with the undo toast over it (finding 4). *Default:* `toActive` keeps the row's bottom above the toast. When the toast is showing, the row gets a bottom scroll margin of the toast's height plus 8px. It's still "nearest", and it scrolls the least it can. This changes what a press scrolls, as I2's MF1 did, so it's asked. *Alternative:* leave it, and the beat plays half under the toast.
- **IQ20: Tonight's Down chip.** **Default** (Ken, 2026-11-25). The chip isn't drawn while the encounter page is open (finding 3), so it can never slide in where the hit happens. *Default:* no motion for the chip. The row's own *Down* takes the stamp. *Alternative:* the chip slides in the first time it's drawn after a row went down, on another tab. That's a beat played away from its press, which the plan's rule 1 rules out.
- **IQ21: A seat crossing a Major (reopens IQ5).** **Default** (Ken, 2026-11-25). The table doesn't know a seat's Milestone Points (finding 1). *Default (b):* no burst in GM mode. On the end page, a line that took a Milestone Point shows "the Milestone Point" in gold, as state. The Major's big moment stays on the player's own sheet (I2), which is IQ5's own reason. *(a):* a dry run on the seat's copy: when the copy was imported before this session, add this line's Milestone Point to the copy's `milestoneState` and burst when a Major opens. A copy that's out of date gives a wrong burst, or none, and a wrong burst is worse than none. *(c):* defer it to a wish (the close-out updates a seat's copy), and build nothing for it here.
- **IQ22: Where *Written* is stamped.** **Default** (Ken, 2026-11-25). Write lands on the end page, and the session page's "Written" is seen only later (finding 2). *Default:* the end page's heading "X is closed out" takes the stamp, and the session page's "Written <day>" never moves.
- **IQ23: The round's beat.** **Default** (Ken, 2026-11-25). *Default:* Finish the round stamps the bar's "Round N", and the screen reader hears "Round N", once, from the page's live region. Starting an encounter is round 1 and stamps too.
- **IQ24: The award log's lines.** **Default** (Ken, 2026-11-25). *Default:* they print in (`tagPrint`) 60ms apart. After eight, the rest appear at once, so a big table doesn't wait. The jobs line comes last.
- **IQ25: New words.** **Default** (Ken, 2026-11-25). *Default:* one new string, the screen reader's "Round {n}", as `appCopy.tableRound`. No new visible words. *Not taken:* new visible copy on the end page.

## 5. The assumption sweep

Every reader was found by grepping `tableChange`, `toActive`, `enc-row`, `.active`, `enc-down`, `health.down`, `.out`, `clockHtml`, `clockLineHtml`, `clockBoxesHtml`, `data-clockfull`, `data-cline-n`, `paintTonight`, `tonightItems`, `closeEndHtml`, `co-log`, `coLogLine`, `S.coEnd`, `writeCloseOut`, `announce(`, `scrollIntoView` and `S=` in `src/` and `tests/` at `f881bcd`. **Twins count.**

| What | Where (at `f881bcd`) | Today | After |
|---|---|---|---|
| `tableChange` | gm.js:96-108 | records, rebases, `update(redraw)`, toast | before `rebaseTable()`, sets `tableBeat=tableBeatsFrom(tableBase.copy, t)` when `!typing` and `tableBase.table===t`; nothing else moves |
| `tableBeatsFrom(before, t)` | new, gm.js | | `{ turn:{enc,row}\|null, round:{enc,n}\|null, clocks:[{id,from,to,full}], out:[rowId], down:[rowId] }` from the running encounter's `turn`/`round`, each clock's `filled`, each row's `out` and `encounterView`'s `health.down`; `null` when nothing moved. Each part in its own `try`: total |
| `tableBeat` | new, gm.js, module state | | taken and cleared at the start of `playTableBeats`, never in `S` (I2's SF1) |
| `update()` | shared.js:308 | `paintTonight()` on a table | then `playTableBeats()`. It runs on `update(false)` too, so a clock's + plays on its own press |
| `playTableBeats()` | new, gm.js | | `calm()` → return (after the round's `announce`). Otherwise everything runs in the first frame (`requestAnimationFrame`), after the binders' in-place paints and `toActive`'s scroll: looks the elements up then, adds classes, takes them off when done |
| `undoTableEntry` | gm.js:112 | `update()` | **unchanged**: it never sets `tableBeat`, so undo moves nothing |
| `renderMain`'s take-once | app.js:191 | `S.beats` on the sheet only | **unchanged**: tables never set `S.beats` |
| `next` | gm.js:4360 | `announce("<name> acts")` | **unchanged**, as are the other turn binders (4415, 4444, 4530, 4605, 4378, 4597, key N at 458): the diff catches every one |
| `.enc-bar .enc-status` | encounter page bar | "Round N · name" | the name and the round take `beat-stamp` from the frame |
| `.enc-row.active` | shadows.css:1670 | cyan `border-left` | a `::before` the edge's height draws `scaleY(0→1)` on `beat-edge` (.25s); the border stays as it is |
| `toActive` | gm.js:4358 | `scrollIntoView({block:"nearest"})` | IQ19: with the toast showing, the row's `scroll-margin-bottom` is the toast's height + 8 for the scroll, then back to its CSS |
| `.enc-row.out` | shadows.css:1671 | opacity .65, instant | `transition: opacity .3s` on the frame that adds it (class `beat-fade`, removed after) |
| `.enc-down` | gm.js:3785 | "Down" | `beat-stamp` on a `down` beat's row |
| Clock block | `clockHtml` 2148, `paintClock` 2228 | boxes repainted in place | the `filled-1` box (0-based) takes `beat-draw`; a `full` beat stamps `[data-clockfull] strong` |
| Clock line | `clockLineHtml` 2171, `paint` 2181 | "n of m" / "Full" | a `full` beat stamps `[data-cline-n]`; a line has no boxes |
| `.clock-count` | `role="status"` | announces | **unchanged**, and never counted: it's a live region (I1's stop) |
| Tonight's clock chip | `tonightItems` 557, `paintTonight` 564 | "7 of 8" | **unchanged** |
| Tonight's Down chip | `tonightItems` 547 | | **unchanged** (IQ20) |
| The close-out's Write | gm.js:3227-3241 | `tableChange(…, false)`, then `S.coEnd=id; update()` | sets `coJustWritten=id` before its `update()`; **no `tableBeat`** for it (`writeCloseOut` moves no turn, round, clock or row) |
| `closeEndHtml` | gm.js:3180 | heading, `.co-log` lines | takes `coJustWritten` once (reads it, clears it): the heading `beat-stamp`, the lines `beat-print` with `animation-delay` 60ms apart |
| `closeOutSectionHtml` | gm.js:3054 | "Written <day>." | **unchanged** (IQ22) |
| `coLogLine` | gm.js:3040 | "…with the Milestone Point" | IQ21 (b): those words in `<span class="co-mp">`, gold. A sentence still (241) |
| `sessionMarkdown` | gm.js:2656 | reads the log lines' text | **unchanged**: the span adds no text |
| I2's burst and skip | shared.js `playNight` closures | | IQ21 (b) needs neither. If (a), `burst` and `finish/off` move out as `beatBurst(host,n,cls,x,y,ms,reach)` and `beatSkip(run, finish)`, and `playNight` calls them; I2's tests must pass unchanged |
| `stopBeats` | shared.js | cancels the sheet's run | also called by `playTableBeats` first, so a sheet beat and a table beat never overlap (`beatRun` is shared) |
| `announce()` | shared.js:99 | | "Round {n}" (`appCopy.tableRound`) on a `round` beat, calm or not |
| `S=` | gm.js:128, 614; shared.js:94 | | **nothing new in `S`** |
| Contrast guard | build.test.mjs `textless` | | `::before` edges are exempt; `.co-mp` is text on the card (gold on `--panel`: measured, not assumed) |
| W43's guard | build.test.mjs | | every new animated rule in the reduced block |
| Tests that read this text | `tests/smoke-table-*.test.mjs`: `.co-log`, `coLogLine`'s sentences, `.enc-status`, `.clock-line`, `[data-cline-n]`'s text | | the `.co-mp` span keeps `textContent`; no class change alters text. List each hit in the PR |
| `sample-table.test.mjs` | the sample's own checks | | **unchanged** (nothing saved) |

**Which guards read a value this changes?** None of the engine's. The contrast guard, W43's guard, and `smoke-table-keys`'s N test (Next still focuses Next). `keepPlace` matches on `data-` attributes, and this adds none to a control.

**Where does each new thing render?** The stamp: the bar's `.enc-status`, `.enc-down`, a clock's *Full*, the end page's heading. The edge: `.enc-row.active`. The draw: a clock block's box. The fade: `.enc-row.out`. The print: `.co-log` lines. The gold words: `coLogLine`, so the end page, the session page's log and Copy as Markdown (text only).

**What text points at it?** The plan's §3 I3 row. DESIGN.md's *Readouts* (adds **At the table**, §9). `appCopy.tableRound` (new). Help's GM guide doesn't name motion (grep `gmGuide` for "slide", "stamp", "flash": none).

## 6. Read first

- `CLAUDE.md`: constraints 2, 5, 7 and 9.
- `SCHEMA.md` §4: Decisions 316, 317 (all of them), 212, 253, 269, 270, 272, 205, 302.
- `DESIGN.md`: *Readouts* (I1's and I2's lines), *Do's and Don'ts*.
- `src/ui/shared.js`: `update`, `calm`, `announce`, `stopBeats`, `playBeats`, `playNight`, `nudgeToNight`.
- `src/ui/gm.js`: `tableChange`, `rebaseTable`, `typingNow`, `undoTableEntry`, `paintTonight`, `encRowHtml`, the encounter binder's `act` table (`next`, `toActive`), `bindClockLines`, `bindClocks`, `closeEndHtml`, `bindCloseOut`'s Write, `coLogLine`.
- `tests/smoke-table-play.test.mjs`, `tests/smoke-table-keys.test.mjs`, `tests/smoke-sheet-night.test.mjs` (I2's), `tests/smokekit.mjs` (`seedTable`, `runTable`), `tools/phone-check.mjs` (`nightFloors`, `tableScreens`).

## 7. Out of scope

- **A seat's Milestone Points** (IQ21 (b)): no copy is updated, and no total is added up.
- **Tonight's chips** (IQ20): none move.
- **The read-only seat sheet** (`seatSheet`): it draws the sheet's renderers, and I1's beats don't play there (`beatsNow` is the sheet's). Leave it.
- **What's new, the nudge, tabs**: as the plan says.
- **Changing what a press does,** except IQ19's margin. Every turn, round and clock lands where it lands on `main`.

## 8. The shapes

All in `gm.js` except the one `update()` line (and, only under IQ21 (a), `beatBurst` and `beatSkip` in `shared.js`). Nothing is saved.

```js
let tableBeat = null;          // set by tableChange, taken by playTableBeats on the same update(); never in S
let coJustWritten = null;      // a session id: set by Write, taken by closeEndHtml's next draw

tableBeatsFrom(before, t) -> null | {
  turn:  null | { enc:string, row:string },     // the running encounter's e.turn changed to a row (not to null)
  round: null | { enc:string, n:number },       // its e.round rose, or it started (round 1)
  clocks: [{ id, from, to, full:boolean }],     // each clock whose filled rose; full when to>=segments
  out:   [rowId],                               // rows whose .out became true
  down:  [rowId]                                // rows whose encounterView health.down became true
}
// before is tableBase.copy (no audit, no copies); t the live table. A row or clock that is new has no "before": nothing.
// null when every list is empty and turn and round are null.

playTableBeats() -> void      // reads tableBeat, clears it; announce the round; calm() → return; stopBeats(); one frame; classes
```

- **Total.** A `before` with no `encounters` or `clocks`, a hostile row (`health` missing), `encounterView` throwing: that part is empty, and nothing throws. Test it with direct inputs (I1's lesson): `tableBeatsFrom({}, t)`, `tableBeatsFrom(t, {})`, and `null` on either side.
- **The frame.** `next` calls `toActive()` *after* `tableChange` returns, and the clock binders paint *after* it too. So `playTableBeats` looks every element up inside its frame callback, never before. With no frame drawn, nothing plays and the HTML is already right.
- **Typing** (`typingNow()`) records a fold and sets no beat.

## 9. The UI

| Moment | What moves | When |
|---|---|---|
| The turn moves | the bar's actor name: `beat-stamp` (.3s); the acting row's cyan edge draws top to bottom (.25s) | first frame |
| A round starts | the bar's "Round N": `beat-stamp`; announce "Round N" | first frame |
| A clock's + | the newly filled box draws in left to right (`tagPrint` .25s), in the block; the line and chip only change their number | first frame |
| A clock fills | its *Full*: `beat-stamp`, in the block and the line | +.15s |
| A row marked out | fades to .65 (.3s) | first frame |
| A row goes Down | its `Down`: `beat-stamp` | first frame |
| Write | the heading `beat-stamp` (.3s, +.1s); each log line prints (`tagPrint` .3s), 60ms apart, eight at most | render-time (`coJustWritten`) |

**Where things land:**

| Press | What moves | Where focus is | Scroll |
|---|---|---|---|
| Next (or N, Start, a pick, Act now, Delay, the opening) | bar name stamp, row edge | as today | as today, plus IQ19's margin |
| Finish the round | round stamp | as today | as today |
| A clock's + | the box, *Full* | as today (− when full) | none |
| A clock's − | nothing | as today | none |
| A hit that downs a row | *Down* stamp | as today | none |
| Mark a row out | the fade | as today | none |
| Write the award log | heading, lines | `[data-coend-h]`, as today | 0, as today |
| Undo, Activity, Ctrl/⌘+Z, a tab switch, a later render, typing | nothing | as today | as today |

**Colour:** the stamps follow `beat-stamp` (gold glow on its text; `nightStamp`). The row edge is cyan, as the edge already is. `.co-mp` is `var(--gold)`. Every new colour rule is checked computed in both themes (I1's tail).

**DESIGN.md** (*Readouts*), after I2's lines: **At the table:** a turn stamps the name in the bar and draws the acting row's edge; a round stamps its number; a clock draws its segment and stamps *Full*; a row going down stamps *Down*; the award log prints in on its end page. A GM's beat never bursts: the big moment is the player's.

## 10. Worked examples, as named tests

A new file, `tests/smoke-table-beats.test.mjs`, built on `seedTable`/`runTable` and an encounter set up by the test (as `smoke-table-play` does). Write these first, and show each failing on `main`.

1. **`I3: Next stamps the bar's name and draws the acting row's edge, once`**: a running encounter with three rows. Press Next. After a frame, `.enc-bar .enc-status` has a `beat-stamp` span on the new name, and the active row has `beat-edge`. After .6s, neither. A tab switch and back: neither.
2. **`I3: every press that moves the turn plays it, and only those`**: a pick (`data-eturn`), Act now, Delay, key N, each gives `beat-edge` on the row that now acts. Editing a row's name (a typed field) gives none.
3. **`I3: Finish the round stamps the round and says it`**: run Next to the reset, then Finish the round. The round has `beat-stamp`, and the announcer reads "Round 3" once a frame has run.
4. **`I3: a clock's + draws its segment in, and Full stamps, in every twin on the page`**: a clock at 7 of 8 on a session page with its block, and on Next session with its line. Press + on each. The block's 8th box has `beat-draw`, and both *Full*s have `beat-stamp`. − gives nothing.
5. **`I3: a clock's beat plays on its own press and never later`**: + (which is `update(false)`), wait 1s, switch tabs and back: no `beat-*` anywhere. This is the take-once trap in finding 5.
6. **`I3: a row going down stamps Down; a row marked out fades`**: a hit that downs a row gives its `.enc-down` `beat-stamp`. Marking a row out gives `beat-fade`. Neither plays for Tonight's chip (IQ20): `.tn` has no `beat-*`.
7. **`I3: Write prints the award log's lines in, once`**: write a close-out with three lines. The end page's heading has `beat-stamp`, and its three `.co-log` lines have `beat-print` with delays 0, 60 and 120ms. Done, then the session page: no `beat-*`. Redo and Write again: it prints again.
8. **`I3: undo, a later render, typing and reduced motion move nothing`**: Next, then Undo from the toast: no `beat-*`. `update()`: none. Type in a field: none. Then reduced motion (I1's `matchMedia` stub): Next and Finish the round give no `beat-*`, while the announcer still says the round.
9. **`I3: with no frame drawn, the table is right and nothing plays`**: stub `requestAnimationFrame` so it never calls back. Next: the right row is `.active`, the bar reads the new name, and there's no `beat-*`.
10. **`I3: tableBeatsFrom never throws on direct hostile inputs`**: `({}, t)`, `(t, {})`, `null`, a row with no `health`, a clock with string `filled`: `null` or the shape.
11. **`I3: a seat line's Milestone Point reads gold, as words`** (IQ21 (b)): the end page's line for a present name with the Milestone Point ticked has `.co-mp`, and its text is unchanged. `sessionMarkdown` is unchanged.

## 11. Tests beyond the examples

- **Position, in real Chromium** (`tools/phone-check.mjs`, a new `tableBeatFloors` pass; it runs outside `npm test`, and the PR pastes its output). Seed the *Dead Air* sample (`samples/`), open `EN-T0R5ADN7`, at 1280×900 and 375×812:
  - press Next **with Playwright's own click** (no centring). After a frame, the bar's stamped name is inside the viewport under the header. The active row's top is inside the viewport. Its bottom is above the undo toast's top (IQ19), and its edge's `::before` box is inside the row;
  - Tonight's clock chip, then + (the chip's clock at 7 of 8): the stamped *Full* is inside the viewport and above the toast;
  - Write on `SE-HR5CH1JX`: the heading and every printed line inside the viewport, above the toast;
  - `scrollWidth === clientWidth`;
  - then under `reducedMotion: "reduce"` (`document.getAnimations()` empty a frame after each press), and with `colorScheme: "light"` (`.co-mp` and the stamps resolve to the light theme's `--gold`, read with `getComputedStyle`).
  **Mutation-test the IQ19 row** without the margin: it must fail at both widths. At 375 the pre-flight measured the toast over the row's lower half, so it should.
- **Totality with direct inputs** (example 10).
- **The contrast guard and W43's guard:** unchanged, and passing.
- **Mutation-test each guard** against the pre-fix code, and list each in the PR with the test that catches it:
  - the beat kept in `S` for the next render (examples 5 and 1's tab switch)
  - `tableBeat` set while typing (example 8)
  - the frame's lookups done before the frame (example 4: a clock's box is rewritten after `update` returns, so the class lands on a removed node)
  - `playTableBeats` without `calm()` (example 8)
  - `coJustWritten` not cleared (example 7's Done)
  - undo setting a beat (example 8)
  - `toActive` without the toast margin (phone-check's IQ19 row)

## 12. Steps

1. `git submodule update --init private`; on a branch fresh from `origin/main`, `npm run test:fast`.
2. Write §10's tests. Run them, and show each failing on `main` in the PR.
3. `tableBeatsFrom`, `tableBeat` in `tableChange`, `playTableBeats` and the `update()` line. `npm run verify`.
4. The turn and the round: the bar, the edge, IQ19's margin. `npm run verify`.
5. The clocks, the rows (out, Down). `npm run verify`.
6. The close-out's end page (`coJustWritten`), `.co-mp`. The CSS, every animated rule in the reduced block. `npm run verify`.
7. **The walk, in the dev preview** (`shadows-dev-preview`, `?gm=on`, the *Dead Air* sample seeded as `CLAUDE.md` says; the 16ms shim if the pane is hidden). Name each item in the PR with what was seen:
   1. Next ×4 at 1280 and 375: the bar's name, the edge, the row clear of the toast.
   2. Finish the round: the round's stamp.
   3. + from Tonight's clock chip to *Full*; − after it.
   4. A hit that downs a row; mark a row out.
   5. Close out Session 7 and Write: the heading, the lines one by one; Done; Redo and Write again.
   6. Undo from the toast and from Activity: nothing moves.
   7. Reduced motion and the light theme, by eye where the pane allows, and by phone-check where it doesn't.
8. `npm run phone-check` with the new pass; paste its output. The frame fixture should not move (it holds no table frames). If it does, stop.
9. The docs and versions (§14). `npm run verify`.

## 13. Stop and ask

Stop and ask the conductor if:
- a press moves the turn, a clock or a row without `tableChange` (a binder that writes the table and calls `update()` itself);
- a beat would sit inside a live region (`.clock-count`, the announcer);
- `keepPlace` or `dataKey` matches on an attribute this order adds;
- the frame fixture or a test outside §10 changes, other than the version literals that `npm run bump` moves;
- any measured place in §11 can't be met without a scroll the order doesn't name (say what you saw, with the metrics).

**Not stops:** `docs.test.mjs` failing until N's INDEX line is in; the contrast guard asking for a `textless` entry for a new filled shape (add it with a one-line comment); `phone-check`'s B19 phone-width header row, which fails on `main` by design.

## 14. Close-out

`close-the-session`, *Rule or shape* tier:
- Decision **N** pasted whole, with *Built* filled in. Its INDEX §3 line goes under *GM mode*, beside 270.
- `npm run bump -- 0.79.0`. Add `CHANGELOG.md` lines under `[Unreleased] — app 0.79.0`, then run `npm run changelog`:
  - *At the table, Next marks who's up: their name in the bar, and the edge on their row. A new round stamps its number.*
  - *A clock draws its new segment, and Full lands with a stamp. A row that goes down says so.*
  - *Writing the award log prints it in, line by line.*
- `DESIGN.md` (§9). The plan's I3 row (built, the decision, the app version). **STATE:** Motion's one line ("I4 is next", or what Ken picks). Check it's under its cap with `node --test tests/docs.test.mjs`. Add a `docs/log/2026.md` entry and a `docs/log/shipped.md` row.
- **PR title:** `feat(gm): the table moves once (Decision N, I3)`.
- **PR body:** the template's sections, plus:
  - *Where the order didn't fit* (empty is fine);
  - the tests failing on `main`;
  - each mutation and its catching test;
  - `phone-check`'s output;
  - the walk's seven items, with what was seen;
  - every new string as it renders (`appCopy.tableRound`).

**Review checklist** (beyond the suite passing):
- Re-grep every path that moves the turn, a clock or a row (`Engine.nextTurn`, `setTurn`, `actNow`, `delayTurn`, `setOpening`, `startEncounter`, `resolveEncounterReset`, `editClock`, `applyEncounterHit`, `editParticipant`): each ends in `tableChange`.
- Press Next, +, and Write in a real layout yourself, from where a GM's own scroll leaves the control (the bottom edge included). Check that each beat plays inside the viewport and clear of the undo toast; don't take the PR's numbers.
- A clock's + and the close-out's edits are `update(false)`: check that nothing replays on the next tab switch.
- Undo from the toast, from Activity and with Ctrl/⌘+Z: nothing moves.
- Every new colour rule's computed value in both themes, against the card it sits on.
- Nothing new in `S`, nothing saved; `tableBeat` and `coJustWritten` are module state.
- I2's sheet beats still play: `smoke-sheet-night` and `smoke-sheet-beats` pass unchanged.

## 15. Handing it over

Use the two prompts in `WORK-ORDERS.md`, with this order's path: `docs/plans/motion/I3-across-the-table.md`. Add the conductor's notes path. This order's traps:

- **The before is `tableBase.copy`, not a copy taken in `tableChange`.** Most presses write first and call `tableChange(()=>{})` after (gm.js:80-84). A copy taken inside would see no change.
- **`update(false)` never renders, but it does call `playTableBeats`.** Take the beat there, on the same update, not in `renderMain`. A beat left in a variable that a later render reads is finding 5's replay.
- **Look elements up inside the frame.** `toActive()` scrolls after `tableChange` returns, and the clock painters rewrite boxes after it too.
- **Nothing in `S`.** `openTable` and `renderTable` replace `S` (I2's SF1).
- **The close-out's end page is a render-time take-once** (`coJustWritten`), because Write's `tableChange` is `false` and the page draws on the next `update()`.
- **Live regions don't count.** `.clock-count` is `role="status"`: stamp *Full*, never animate the count's text.
- **Press from where a real click leaves the control** in phone-check. I2's centred button hid MF1's edge case, and its first nudge hid the toast.
- **Restore mutated files in a `trap` or a `finally`**, and never end a turn on a background run nothing watches (I2's build).
- **phone-check runs by hand,** for both the builder and the reviewer.
