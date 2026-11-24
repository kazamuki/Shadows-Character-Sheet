# Work order I1: What it changed

**Plan:** [`../motion.md`](../motion.md) §3, row I1. **Source:** Ken, after the Motion Lab page (2026-11-24):

> I think adding some movement to the page, either for taking damage, or something pulsing to click, or other effects could enhance the experience. Of course, I want to be very careful, since anything that loops can become annoying, and anything that takes too long will also be annoying.

and, after trying it: "These are all awesome. They add some flair and impact."

**Built on:** Decision 117 (a hit flashes what it changed, once), 163 (the take-once of `S.issued`), 164 (`keepPlace`), 166 (`syncVitals`), 313 (named pools' cards), 315 (spend an amount).

**Status: drafted 2026-11-24** by Claude (Opus), in the session that built the Motion Lab. **Not yet approved.** Ken answers the plan's IQ1–IQ6 (`../motion.md` §5) and this order's IQ7–IQ10 (§4); a blank one is "Default".

**Branch:** cut from `origin/main` at the pre-flight commit. PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **I1 build** (Sonnet), then a fresh **I1 review** (Opus) once the PR is open. §15 is the hand-over.

**Runs alone.** It touches `shared.js` (`commit`, the new kit), `app.js` (`renderMain`'s take-once), `sheet.js` (every tracker readout), `shadows.css`, `DESIGN.md`, the tests and the docs. No engine, data or schema change.

**Carried over:** nothing; this is the plan's first order. From J4's and K4's reviews: the walk in the browser is a named list (§12, step 6), and the PR body's sections are checked last.

**Pre-flight against `main` at `ef588bc`** (#390 merged; K5 drafted). Take the next free decision number on `origin/main` when it's written; the order says **N**.

```
commit()          shared.js:327-338. before=clone(ch); fn(); recordAction; S.landed=landedFrom(before, ch); update();
                  then the undo toast. Every tracker control on the sheet goes through it (Hurt, Heal, a typed damage
                  total, Take a hit's Apply, Turn Reset, Rest, Luck's spends, Çredits' add/spend, SFR and pools' − and +,
                  Sanity's stepper, Admin edits).
landedFrom()      shared.js:347-355. null unless locked; compares hlCells(before) and hlCells(ch); returns {cells:Set,
                  pain} only when damage or Massive went UP. Its comment (343-345) says "Healing and undo never flash".
Take-once         app.js:206-207: landedNow = S.landed||null; S.landed=null; issuedNow likewise. app.js:213: both cleared
                  after fill(), BEFORE renderDrawer() (so the drawer's rows never flash today). Only the sheet branch
                  takes them: a commit made elsewhere (a GM's seat, shared.js:313's runningNatural is "both hits")
                  leaves S.landed set until the next sheet render.
update()          shared.js:302-308: saveChar; renderMain(); sweepTip(); renderLedger(); renderVitals(); paintTonight on a
                  table. refreshPopover() runs inside renderMain (app.js:215), renderDrawer() too (app.js:214).
Undo              shared.js:406 (the toast) and sheet.js:4216-4217 (the Activity Log): Engine.undoLastAction + update().
                  Neither goes through commit(), so neither sets S.landed. The same holds for anything set in commit.
calm              shared.js:892 reads matchMedia("(prefers-reduced-motion: reduce)") inline for jumpTo's scroll. No
                  helper exists.
Frames            pretendToBeVisual gives jsdom a requestAnimationFrame. The log (2026-11, the line at docs/log/2026.md
                  :3717) records that a browser pane that isn't drawing never fires it.
Reduced-motion    build.test.mjs:349-365 (W43): every CSS rule with an animation, or a transition on transform, width,
guard             height, left, top, right, bottom or opacity, must be switched off in a reduced-motion block. It reads
                  shadows.css only: a transition a script sets inline is invisible to it.
W15's test        smoke-sheet-skills.test.mjs:257-280: counts .landed and .struck after a heal (must be 0). A new class
                  on a heal doesn't break it, as long as it isn't .landed or .struck.
```

Probes on `main` (a locked Professional from `lockedCharacter()`, on Trackers): pressing a Luck spend redraws `#main` by `innerHTML` (app.js:196), so every readout is a new element; the old value isn't anywhere in the new DOM. `Engine.luckState(ch).current` goes 4 → 3 with nothing on screen between. `data-dmg="1"` sets `.hl.landed` on the first box and `.big.struck` on Trackers' HP (W15's test passes on `main`).

---

## 1. Goal and Done when

**Goal.** When a player changes a tracker on the sheet, the number counts to where it landed and what it cost floats off the readout they're looking at. A hit fills its Health Levels in order, a meter's lost part lingers for a beat, and a heal gets one quiet green line. Undo, the wizard and reduced motion move nothing.

**Done when:**
- Spending 1 Luck on Trackers: every place that draws Luck counts 4 → 3 over .3s; one `−1` floats off Trackers' Luck block, and only there.
- The HTML says 3 from the first frame. If no frame is ever drawn, 3 is all that ever shows.
- A hit of two Health Levels' worth fills the two cells 60ms apart, left to right, each flashing as it fills (117's flash, now in step).
- Healing 3 counts HP up, empties cells right to left, and puts one green line (.35s) on the HP readouts. Nothing flashes magenta.
- On Main, spending Sanity leaves the lost part of its meter showing for .25s, then it drains over .4s.
- With the popover open, the float goes on the popover's readout, not the card behind it.
- Undo, a tab switch, a later render, and the wizard: nothing counts, floats or flashes.
- With reduced motion on: the numbers and cells are already final, no float, no line, no tail.
- `npm run verify` passes; W43's guard passes with the new CSS; W15's test passes unchanged.

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape* (a player-facing behaviour, and it supersedes Decision 117 in part).
- **App:** minor, 0.76.0 → **0.77.0** (or the next minor if another lands first). A player can see it.
- **Game data, character schema, table schema, pack schema, ruleset:** none. No data key, no save-file field; the beat lives in `S` and is never written into the character (constraint 7).
- **Decision:** one, **N** (§3). It supersedes **117 in part**.
- **Flags:** none.

## 3. The decisions, drafted

Paste this as written; fill *Built*.

```
N. **What an action changes on the sheet moves once: its numbers count to where they landed, the change floats off the readout you're looking at, and a heal gets a green line.**
     *2026-11-24 · Ken + Claude · Touches: commit, beatsFrom, S.beats, beatsNow, playBeats, calm, countHtml, data-count, data-float, beat-float, mended, beat-tail, landedFrom, landedCls, hlMiniHtml, hlTrackHtml, the vitals pills, the vitals drawer's rows, Main's condition cards, Trackers' readouts, the popover's readout, prefers-reduced-motion, W43's guard, DESIGN.md's Readouts, the Motion Lab, I1*
     - **Decided:** Every `commit()` on a locked sheet notes what HP, Sanity, Luck, SFR, each named pool and Çredits were and are, and which Health Level cells moved. The render after it takes that once. Every place that draws one of those numbers counts from the old value to the new over .3s, and the change floats off one readout: the popover's if it's open, else Main's card or Trackers' block. Cells fill in order, 60ms apart, each flashing as it fills. A meter on Main holds its lost part for .25s, then drains. A heal puts one green line (.35s) on the HP readouts. The right number is in the HTML from the start, and the count runs only once a frame is drawn. Nothing moves on undo, in the wizard, or under reduced motion.
     - **Why:** Ken, after the Motion Lab (2026-11-24). A number that jumps shows where you landed but not what it cost, and on a phone between turns you can't tell whether the tap took. One hook in `commit()`, as 117's, covers every control that changes a tracker, future ones included.
     - **Rejected:**
       - Counting inside the renderer: a re-render mid-count restarts it, and the HTML shows the old number until a frame is drawn.
       - Animating only the readout pressed: its twins jump while it counts, and on Trackers the pill and the block are on screen together.
       - A float on every twin: two or three floats for one spend.
       - Counting IP and MP here: they're Progress's, and the session register's (I2).
       - Flashing a heal as a hit does: magenta means harm.
     - **Replaces:** Decision 117 in part: a heal now moves (the count and a green line; undo still doesn't), and each cell's flash waits for that cell's fill.
     - **Revisit if:** players find the count slow in a fight (keep the float, drop the count); a tracker is added that doesn't change through `commit()`.
     - **Built:** app 0.77.0, PR (this one), log entry 2026-11-NN.
```

**Supersession marks** (`CLAUDE.md`, *Decisions*):
- Decision 117's entry (`SCHEMA.md`, the line starting `117. **(Let a hit land`): add `→ **Superseded in part by Decision N**: a heal now counts and gets a green line, and each cell's flash waits for its fill.`
- Its `INDEX.md` §3 line (`- **117** *(Let a hit land — W15)*`): add `→ **superseded in part by N**`.
- A new `INDEX.md` §3 line for **N**, under *Sheet & play tracking*, beside 117.

## 4. Questions for Ken

Answered before the build starts. A blank one is "Default".

- **IQ7 — Which readouts count.** HP, Sanity, Luck, SFR, each named pool, Çredits. Not CRANK's rep (it moves between sessions, not mid-scene), not IP or MP (I2). *Default: those six.*
- **IQ8 — The float for Çredits.** `−Ç200` and `+Ç200`, the sign first, as the ledger writes an amount. *Default: yes.*
- **IQ9 — Admin edits.** They go through `commit()`, so they count too. Special-casing them would be a second rule for no gain. *Default: they count.*
- **IQ10 — The float with a popover open.** On the popover's readout, since that's where the player is looking. *Default: yes.*

## 5. The assumption sweep

Every reader of every number this order animates, found by grepping `hpLeft`, `luck.current`, `san.current`, `credits.current`, `sfLeft`/`sf.value-`, `c.t.shown` and `hlCells` in `src/ui/` at `ef588bc`. **Twins count:** each place that draws the number is a row.

| What | Where (at `ef588bc`) | Today | After |
|---|---|---|---|
| The hook | `shared.js:327-338` `commit()` | sets `S.landed` | also sets `S.beats = beatsFrom(before, ch)` |
| `landedFrom` | `shared.js:343-355` | the flash's cells and Pain beat | unchanged in shape; its comment's "Healing and undo never flash" becomes "Undo never moves; a heal's beat is `beatsFrom`'s (N)" |
| Take-once | `app.js:206-213` | `landedNow` taken in the sheet branch only, cleared before `renderDrawer` | `S.beats` is taken at the **top** of `renderMain` on **every** screen (`const b=S.beats; S.beats=null;`), kept as `beatsNow` only on the sheet, and cleared by `playBeats()` |
| The player | `shared.js:302-308` `update()` | no post-render pass | `playBeats()` last, after `renderVitals()`, so the drawer and popover are drawn |
| HP pill | `sheet.js:356` | `hpLeft` in `.vv` | the number in `countHtml("hp", …)`; not a float host |
| HP drawer row | `sheet.js:388` `vrow("HP", …)` | `hpLeft / total` | count span; not a float host |
| HP card, Main | `sheet.js:544-545` `cond(…"hp")` | `hpLeft<small>` | count span; float host; takes `mended` on a heal |
| HP block, Trackers | `sheet.js:1786` `.big` | `hpLeft / total HP` | count span; float host; takes `mended` |
| HP popover | `sheet.js:1710` `now(…)` | `hpLeft / total HP` | count span; float host while open |
| HP, the hit modal | `sheet.js:1273` `.hit-now` | the HP before the hit | **unchanged**: the modal closes on Apply, so the count would run on a closed modal |
| HP, print | `sheet.js:3118` | | **unchanged**: paper |
| HP past zero | `sheet.js:356, 388` `"−"+pastZero` | the pill and row show a negative | no count when either side is past zero (the text isn't a plain number); the float still shows the HP change |
| HL cells, Main | `sheet.js:325-331` `hlMiniHtml` `.seg i` scaleX | final fill | final fill in the HTML; `playBeats` rewinds each moved cell and fills it in order |
| HL cells, Trackers | `sheet.js:1563-1572` `hlTrackHtml` `.hl .fill` scaleX | final fill | the same |
| SAN pill / drawer row | `sheet.js:360, 391` | `current/max%` | count span |
| SAN in the stat's detail | `sheet.js:404` `vrow("SAN", …)` | `current / max%` | count span |
| SAN card, Main | `sheet.js:550-551` | number + meter | count span; float host; meter tail |
| SAN popover / Trackers | `sheet.js:1717, 1821` | | count span; float host |
| LUCK pill / row / card / popover / Trackers | `sheet.js:361, 392, 552-553, 1720, 1827` | | count spans; the card, popover and Trackers block are float hosts; the card has a meter tail |
| SFR pill / card / popover | `sheet.js:362-363, 559-562, 1724` | | count spans; card meter tail |
| SFR and pools on Trackers | `sheet.js:1834` (the panel tracker rows) | `t.count` | count span; float host |
| Pool card / popover | `sheet.js:565, 1748` | `c.t.shown` | count span (`pool:<id>`); card meter tail |
| Çredits pill / row / card / popover / Trackers | `sheet.js:364, 394, 569, 1736, 1860` | `CR`+`numText(n)` | the `numText(n)` part in a count span, `CR` outside it |
| Çredits in sentences | `sheet.js:2199` (the shop's "You have"), `3848` (training) | | **unchanged**: a number inside a sentence isn't a readout |
| Çredits, print | `sheet.js:3288` | | unchanged |
| The cond card | `sheet.js:536-538` `cond()` | `<span class="meter"><i style="width:…%">` | the meter carries `data-meter="<pop key>"` so `playBeats` finds it |
| The 117 CSS | `shadows.css:437-446, 455-458` | `landed`, `struck`, `painup`; reduced block | unchanged rules; add `.mended`, `.beat-float`, `.beat-tail` and each into the reduced block |
| `.hl-mini .seg i` | `shadows.css:428` `transition:transform .3s` | a transition that never plays (new elements) | stays; `playBeats` sets its own inline transition only when not `calm()` |
| W43's guard | `build.test.mjs:349` | reads shadows.css | passes if every new animated rule is in a reduced block; the inline transitions are `calm()`'s job, pinned by §10's test 5 |
| W15's test | `smoke-sheet-skills.test.mjs:257` | `.landed`/`.struck` counts | passes unchanged (the heal's class is `mended`) |
| DESIGN.md | `DESIGN.md` *Readouts*, "**Hit landing:** … Never on heal or undo, never under reduced motion"; *Do's*: "keep motion short (.15–.35s, ease-out) and state-driven" | | the Hit landing line rewritten (§9); a **Counting** line added beside it |
| Words that point | Decision 117's text, `landedFrom`'s comment, DESIGN.md's line | "healing never flashes" | each updated or marked (§3) |

**Which guards read a value this changes?** None of the engine's: no character value moves. W43's guard and W15's test read the CSS and the classes (rows above). `keepPlace` refocuses the pressed control by its `data-*` attributes (164): the new `data-count` and `data-float` attributes sit on readouts, not on controls, so no control's twin match changes. The builder checks that by grepping `keepPlace`'s matcher for which elements it reads.

**Where does each new thing render?** The count spans: every row marked "count span". The float: one host per action (§9). The tail: Main's cards only. The green line: the HP card, the HP block, the pill.

**What text points at it?** Decision 117, `landedFrom`'s comment, DESIGN.md's Hit landing line. The changelog's 0.22.0 entry is history and stays.

## 6. Read first

- `CLAUDE.md`: constraints 1 (no network), 2 (no modules), 5 (the engine never touches the DOM: everything here is `src/ui/`), 7 (nothing derived is stored: `S.beats` is view state).
- `SCHEMA.md` §4: Decisions 117, 163, 164, 166, 313, 315.
- `DESIGN.md`: *Readouts*, *Do's and Don'ts*.
- `src/ui/shared.js`: `commit`, `landedFrom`, `landedCls`, `update`, `refreshPopover`, `keepPlace`, the popover (`popState`, `drawPopover`).
- `src/ui/app.js`: `renderMain`.
- `src/ui/sheet.js`: `pill`, `vrow`, `cond`, `hlMiniHtml`, `hlTrackHtml`, the popover's `now()`, the Trackers blocks.
- `tests/smoke-sheet-skills.test.mjs` (W15's test) and `tests/smokekit.mjs`, `tests/harness.mjs`.

## 7. Out of scope

- **IP, MP, the session register, Milestones, Lock & Export's nudge**: I2.
- **GM mode**: I3. A seat's sheet in GM mode renders through `renderTable`, which never takes `S.beats` (§5's take-once row clears it there).
- **The wizard's rail and its pills**: creation isn't play; `beatsFrom` returns null until locked.
- **CRANK's rep** (IQ7), sentences that name a number, print.
- **Any change to what a control does.** Every number lands exactly where it lands on `main`.

## 8. The shapes

All in `src/ui/shared.js`, beside `landedFrom`. Nothing is saved.

```js
// true when the player asked for less motion. Read on every call, never cached at boot.
calm() -> boolean

// What a commit changed, for the render after it. null unless ch is locked and something below moved.
beatsFrom(before, ch) -> null | {
  counts: { [key]: { from: number, to: number } },  // keys: "hp" "san" "luck" "sfr" "cred" "pool:<panel id>", only those that moved
  cells:  [{ i: number, from: number, to: number }], // Health Level cells whose fill changed, in play order:
                                                     // ascending i when damage went up, descending when it went down
  healed: boolean                                    // damage went down (a heal, Rest, Focused Healing, a typed lower total)
}

// The number, wrapped so playBeats can find every twin.
countHtml(key, text) -> `<span data-count="${key}">${text}</span>`   // text is already formatted and escaped by the caller

// The post-render pass. Reads beatsNow, clears it, returns nothing. A no-op when beatsNow is null or calm().
playBeats()
```

- **The values** are read with the readers the renderers use: `Engine.painState(ch).hpLeft` (skipped when `pastZero` on either side, §5), `Engine.sanState(ch).current`, `Engine.luckState(ch).current`, `Engine.sfr(ch)` with `trackers.sfr.spent` as the card computes it, `poolCardsOf(ch)`'s `t.shown`, `Number(ch.trackers.credits.current)||0`. A reader that returns nothing usable (no SFR) gives no key.
- **beatsFrom is total**: a character with no trackers, a hostile file, a NaN: no key for what it can't read, never a throw (constraint 8's spirit, in the UI).
- **The count**: in the first `requestAnimationFrame`, write `from` into every `[data-count="key"]` and count to `to` over 300ms, ease-out, formatted as the renderer formats it (`numText` for Çredits, a plain integer otherwise). A timeout at 300ms + 100ms writes `to` and stops, in case frames stop mid-count. `playBeats` cancels any count still running from the last action first. Every `[data-count]` element carries `data-from` from the moment `playBeats` runs until it lands, so a test can see a count without timing frames.
- **No frame, no rewind**: nothing is written into a count span before the first frame callback runs. If `requestAnimationFrame` is missing, nothing counts.

## 9. The UI

**Where the float goes.** One `.beat-float` per moved key per action, `aria-hidden="true"`, removed on `animationend` (and by a timeout as a fallback). Its host is the first that exists of: the open popover's `[data-float="key"]`; `#main`'s `[data-float="key"]`. The pill, the drawer's rows and the stat's detail row are never hosts. Hosts are positioned so the float sits at the readout's top right.

| Key | Moved down | Moved up | Float text |
|---|---|---|---|
| hp | magenta | green | `−3` / `+3` |
| san | magenta | cyan | `−2` / `+2` |
| luck, sfr, pool | gold | gold | `−1` / `+1` |
| cred | gold | gold | `−Ç200` / `+Ç200` (IQ8) |

**The cells.** For each moved cell, in `cells` order, at position *n*: in the first frame, set its fill (`.seg i` on Main, `.hl .fill` on Trackers) to `scaleX(from)` with no transition, force a reflow, then transition to `scaleX(to)` over 180ms ease-out with a delay of *n* × 60ms. A cell that 117 marks `landed` gets the same delay on its flash (`animation-delay`), so it flashes as it fills.

**The tail.** For a key that moved **down** whose Main card has a meter (`[data-meter="key"]`): insert an `<i class="beat-tail">` under the meter's bar at the `from` width, then after 250ms transition its width to the bar's over 400ms, and remove it. Pale magenta for SAN, pale gold otherwise.

**The green line.** When `healed`, the HP card on Main, the HP block on Trackers and the HP pill take `.mended` once: a 1px green line that fades over .35s. Never with `.landed` in the same action.

**Focus and place.** Nothing here moves focus or scroll. `keepPlace` (164) does what it does today.

| Press | The number in the HTML | What moves | Where focus is |
|---|---|---|---|
| A Luck spend on Trackers | the new value | every Luck readout counts; one float on Trackers' Luck block | the pressed button's twin (164) |
| Hurt, Heal, a typed total | the new HP | HP readouts count; cells fill or empty in order; a heal's line | the same |
| A spend in the popover | the new value | the popover's readout floats; every twin counts | the popover's control (164) |
| Undo (toast or Activity Log) | the old value | nothing | as today |
| A tab switch, any later render | as stored | nothing | as today |

**DESIGN.md** (*Readouts*): replace the Hit landing line with:
- **Hit landing:** one magenta flash (.7s, ease-out) on each Health Level box as it fills, 60ms apart, on the HP readouts, and twice on the Pain readouts when the Pain Level rose. A heal gets one green line (.35s) instead. Never on undo, never under reduced motion.
- **Counting:** a tracker's readouts count to their new value over .3s, and the change floats off the one in view, in the colour of what it is. A meter on Main holds its lost part for .25s before it drains. The right number is in the page from the first frame.

**Copy.** None beyond the floats' numbers. No voice pass.

## 10. Worked examples, as named tests

A new file, `tests/smoke-sheet-beats.test.mjs` (the `tests/*.test.mjs` glob runs it; no list to add it to). Write these first and show each failing on `main`.

1. **`I1: a spend counts in every place it's drawn and floats off the readout you touched`** — `lockedCharacter()` on Trackers; press a Luck spend of 1. Immediately: every `[data-count="luck"]` reads the new value and carries `data-from` with the old one; there are at least two (the vitals pill and Trackers' block); exactly one `.beat-float` in the document, inside Trackers' Luck block, reading `−1`. After 450ms: no `data-from`, every count reads the new value.
2. **`I1: with no frame drawn, the right number is all that ever shows`** — stub `window.requestAnimationFrame` to never call back; record every text the Luck spans take with a `MutationObserver`; spend 1. The old value never appears; after 500ms every span reads the new one.
3. **`I1: a beat plays once: a later render, a tab switch and an undo move nothing`** — spend 1, wait 450ms, switch to Main and back: no `data-from`, no `.beat-float`. Undo from the toast: no `data-from`, no `.beat-float`, no `.mended`, no `.landed`.
4. **`I1: a hit fills its Health Levels in order, and a heal gets a green line instead of a flash`** — on Trackers, set damage to two cells' worth (`[data-dmgset]`). The two moved cells' fills carry delays of 0ms and 60ms, ascending with their index; each `.landed` cell's `animation-delay` matches its fill's. Then Heal 3: `.mended` on the HP block and the pill, no `.landed` and no `.struck`; the moved cells' delays run descending. A hit never carries `.mended`.
5. **`I1: reduced motion gets the end state`** — stub `window.matchMedia` so `(prefers-reduced-motion: reduce)` matches (after boot: `calm()` reads it on each call); spend 1 Luck and take a hit. No `data-from`, no `.beat-float`, no `.mended`, no `.beat-tail`, no inline transition on any cell; every number final.
6. **`I1: on Main a meter holds what you lost, and with the popover open the float goes there`** — on Main, open Sanity's popover from its card and lower Sanity by 2. The float is inside the popover, not the card. The card's `[data-meter="san"]` holds one `.beat-tail` at the old width; after 800ms it's gone.

## 11. Tests beyond the examples

- **Totality:** `beatsFrom` on each fixture in `tests/hostile.test.mjs`'s set (after `migrate()`), before and after a Hurt, returns null or the shape in §8 and never throws. Add it to the hostile file's render loop if that's where renders are driven.
- **The wizard:** a commit on an unlocked character returns null (one assertion in test 3's file).
- **A seat in GM mode:** a commit on a seat, then opening a player's sheet: nothing counts (the take-once on every screen). One test, in the beats file.
- **W43's guard and W15's test:** unchanged, and passing.
- **Mutation-test each guard** against the pre-fix code, and list each in the PR with the test that catches it:
  - `playBeats` not clearing `beatsNow` (test 3)
  - writing `from` before the first frame (test 2)
  - dropping the `calm()` check (test 5)
  - cells in the wrong order (test 4)
  - a float on every twin (test 1's count of one)
  - `.mended` on a hit (test 4)
  - the take-once only on the sheet branch (the seat test)

## 12. Steps

1. `git submodule update --init private`; on a branch fresh from `origin/main`, `npm run test:fast`.
2. Write §10's six tests; run them and show each failing on `main` in the PR.
3. The kit in `shared.js`: `calm`, `beatsFrom`, `countHtml`, `playBeats`; the hook in `commit()`; the take-once at the top of `renderMain`; `playBeats()` last in `update()`. `npm run verify`.
4. The twins: `countHtml` in every row §5 marks "count span", `data-float` on every host, `data-meter` in `cond()`. `npm run verify`.
5. The cells, the tail and the line; the CSS, each new animated rule in a reduced-motion block. `npm run verify`.
6. **The walk, in the dev preview** (`shadows-dev-preview`; seed a locked character as `shadows.active.v1` and press Open sheet), at Slow and Real speed by eye:
   1. Trackers: spend Luck 1 and 3 (Decision 315's amount), pay and add Çredits, lower and raise Sanity.
   2. Trackers: Hurt 1, a typed total two cells deep, Take a hit through the modal, Heal 3, Rest.
   3. Main: the same spends from each card's popover; watch the tail on Sanity, Luck and SFR.
   4. Five quick Hurt presses: each restarts, nothing queues.
   5. Undo from the toast and from the Activity Log: nothing moves.
   6. The OS's reduce-motion setting on (or DevTools' emulation): nothing moves, every number is right.
   7. 375px wide: `scrollWidth` against `clientWidth` on the document, and no float past the viewport's right edge.
   8. Light theme: the float's colours fold as the tokens do.
7. The docs and versions (§14). `npm run verify`.

## 13. Stop and ask

Stop and ask the conductor if:
- a tracker changes without going through `commit()` (a binder that writes and calls `update()` itself): the order assumes there are none;
- a count span would sit inside an `aria-live` region (a screen reader would hear every step of the count);
- a readout §5 doesn't list draws one of the six numbers;
- `keepPlace` matches on an attribute this order adds;
- W15's test needs changing.

**Not stops:** the app version's literals that `npm run bump` moves; `docs.test.mjs` failing until the decision's INDEX line and 117's marks are in; a W15 assertion you have to *add* (not change) for the delayed flash.

## 14. Close-out

`close-the-session`, *Rule or shape* tier:
- Decision **N** pasted, *Built* filled; 117 marked superseded in part in SCHEMA and INDEX; N's INDEX §3 line.
- `npm run bump -- 0.77.0`; `CHANGELOG.md` under `[Unreleased] — app 0.77.0`, then `npm run changelog`:
  - *The numbers move now. Spend Luck, pay Çredits, take a hit or lose Sanity, and the number counts to where it landed, with what it cost floating off it.*
  - *A hit fills its Health Levels one after another, and a meter on Main holds what you lost for a moment before it drains. A heal gets a quiet green line.*
  - *If your device is set to reduce motion, none of it moves.*
- `DESIGN.md` (§9). STATE §5 and the plan's I1 row (built, the decision, the app version). A `docs/log/2026.md` entry and a `docs/log/shipped.md` row.
- **PR title:** `feat(sheet): what it changed moves once (Decision N, I1)`.
- **PR body:** the template's sections, plus *Where the order didn't fit* (empty is fine), the six tests failing on `main`, each mutation and its catching test, and the walk's eight items with what was seen.

**Review checklist** (beyond the suite passing):
- Re-grep the six numbers' readers on the PR (`hpLeft`, `luck.current`, `san.current`, `credits.current`, `sf.value-`, `t.shown`): every readout is a count span or a §5 "unchanged" row.
- Run the walk (§12, step 6) in the dev preview, at least items 1, 2, 5 and 6.
- With frames stopped (a background tab), the numbers are right.
- `S.beats` is never in a saved character (`saveChar`'s output after a spend).
- 117's marks, N's Replaces and its INDEX line agree.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md`, with this order's path: `docs/plans/motion/I1-what-it-changed.md`. This order's traps:

- **The frame trap is the one that matters.** Write nothing into a count span outside a frame callback. A count that rewinds first and counts second shows the old number in any pane that isn't drawing.
- **Take `S.beats` on every screen.** Taking it only in the sheet branch, as `landedNow` is, leaves a seat's commit to replay on the next sheet.
- **`playBeats` runs after `renderVitals`**, not inside `renderMain`: the drawer and the popover are drawn by then.
- **The float has one host.** It's tempting to put `data-float` on the pill; don't.
- **Reduced motion is two places:** the CSS block for classes, `calm()` for anything a script moves. W43's guard sees only the first.
- **A heal isn't a hit.** `.mended` and `.landed` never land on the same action.
