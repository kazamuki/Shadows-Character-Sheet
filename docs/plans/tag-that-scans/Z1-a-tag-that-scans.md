# Work order Z1: A TAG that scans

**Plan:** [`../tag-that-scans.md`](../tag-that-scans.md). **Source:** Ken, 2026-11-26: the TAG's barcode should be a real one, with a button beside it, shown on hover, that flips it to black-on-white for scanning on the dark theme.

**Built on:** Decisions 128 (the intake number and its decorative bars: this order replaces its "the bars are decoration"), 133 (the number is a TAG; hovering says what a TAG is), 146 and 155 (a Ghost TAG's label, a TAGless number's reading: neither changes), 163 (locking prints the TAG once: the bars wipe in, the number stamps), 316–319 (the motion kit: `calm()`, the one-beat rule), 135 (a data key nothing reads fails the build), 137 (no network), 68 (copy moves no `gamedataVersion`).

**Status: approved 2026-11-26** by Ken, in chat ("Approve, defaults"): ZQ1–ZQ8 are answered Default. Drafted the same day by Claude (Opus).

**Branch:** cut from `origin/main` at the pre-flight commit. PR to `main`. Nothing ships switched off. **Runs alone**: it touches `engine.js`, `shared.js`, `shadows.css`, `shadows-data.js` (`appCopy`), `package.json` (a dev dependency), the tests, `tools/phone-check.mjs` and the docs. No schema moves and no saved file changes.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **Z1 build** (Sonnet), then a fresh **Z1 review** (Opus). §15 is the hand-over.

**Pre-flight against `main` at `afb4220`** (#401; the working tree carries the uncommitted motion-archive docs, which touch nothing this order reads). Read, not run, unless it says "run". **Six things the order's picture needed corrected:**

1. **The bars are exactly what Decision 128 said: decoration.** `intakeBarsSvg(id)` (shared.js:1341) turns each of the twelve characters into five bars, wide or narrow by the character's five bits, with a two-bar guard at each end. 173 units wide, drawn at 1.4px a unit (242px), 20px tall. No start, stop or checksum. It cannot be read, and it is unique per TAG.
2. **Light-on-dark doesn't scan; this is the whole reason for the button.** Run: a real Code 128 decoder (`@zxing/library`, in the prototype) read the dark-on-white raster of every payload tried and failed on all of them inverted. The sheet draws the bars in `currentColor`, which is `--dim` on the dark theme.
3. **The light theme needs nothing.** `--dim` is `#5B6472` (shadows.css:24) on white, about 6:1 by hand, about 4.4:1 at the bars' `opacity:.85`. A camera reads that, so the button is for the dark theme only (Ken's words). The builder re-measures the computed colours.
4. **A clean decoder is not a camera.** The same decoder read a perfect raster with **no** white margin at all, and at 1px a unit. A phone won't. So the order gives the flipped patch a real margin, and **the last check is Ken's own phone** (§12 step 8).
5. **At 1.4px a unit, `crispEdges` rounds a 1-unit bar to 1 or 2 device pixels at 1× DPR**, up to 70% off its neighbour. That's fine for decoration and bad for a decoder. A whole number of CSS pixels per unit (2) is exact at 1×, 1.5×, 2× and 3×. It costs width: 334px for the 167 units (ZQ2).
6. **The bars are drawn in three places, and only two are the screen's.** `intakeHtml` (shared.js:1363) is called by `sheetHeader` (sheet.js:530: Main, and the GM's read-only seat sheet) and by the wizard's Review step (wizard.js:829). The print header draws them again by itself (sheet.js:3092), dark on white, 10pt tall (print.css:79). That's 0.5pt a unit, about 0.18mm, under the usual floor for a reliable scan. The print front page is full (Decision 96), so this order does not enlarge it (ZQ7).

**Probes on `main` (run in the prototype, which carries a copy of today's drawing):** the sample TAG `TAG-WEDP-2K7Z-YA82` draws 173 units. The same twelve characters as Code 128 B are **167 units, 91 runs, checksum value 48 (pattern `313121`)**. Those become §10's examples.

**Carried over**

- **From the motion plan's I3 (the ones that apply):** a new rule says what it sits over or under (§9, *Stacking*); a colour is checked computed in both themes; the order's *Done when* was checked against §5 and §9 before hand-over (the print header's "untouched but for the new bars" is in §1, §5 row 5, §9 and ZQ7, and all four agree).
- **From the conductor:** nothing yet.

---

## 1. Goal and Done when

**Goal.** Point a phone at a character's TAG and it reads. On the dark theme, hover the barcode: a small **Scan** button appears beside it. Press it and the bars flip to black on a white patch a phone can read; press again and they go back. Nothing around them moves.

**Done when:**
- **The bars are Code 128.** `Engine.tagBars("TAG-WEDP-2K7Z-YA82")` returns text `WEDP2K7ZYA82`, 167 units and the runs in §10. An independent decoder reads those runs back to the same text for the example and for fifty generated TAGs.
- **Every place that draws the bars draws these:** Main (`sheetHeader`), the GM's read-only seat sheet (the same), the Review step, and the print header. Same TAG, same bars, everywhere. A Ghost TAG's label, a TAGless number's reading and the lock's wipe-in are unchanged.
- **The button.** On the dark theme, every `.intake` (Main, Review) has a real `<button>` beside its bars. It is invisible until the pointer is over the `.intake`, or focus is inside it, or the bars are flipped. It is reachable by Tab, and Enter and Space work.
- **Pressing it flips every `.intake` on the page** to black bars on a white patch with a margin, and `aria-pressed` is true. Pressing again flips back. **Nothing else on the page moves** (measured, §11). The flip survives a re-render in the same sitting (an HP change, a tab press) and is gone on reload.
- **The light theme has no button**, and a flip made in the dark theme doesn't leave a white patch there.
- **The print header is untouched** but for the new bars: no button, no flip, same size.
- **Reduced motion:** the flip is instant. Otherwise it is one short wipe (§9).
- `npm run phone-check` passes with the new checks (§11), and so does `npm run verify`.
- **Ken scans a flipped TAG with his own phone** and it reads (§12, step 8). If it doesn't, the order doesn't merge: ZQ2.

## 2. Tier, versions, numbers

- **Tier:** *Rule or shape*. A player-facing behaviour someone could have chosen otherwise, and it replaces part of Decision 128.
- **App:** minor, 0.80.0 → **0.81.0** (or the next minor, if another lands first): a new capability.
- **Game data:** none. `appCopy.tagScan` is copy no character's values read (Decision 68).
- **Character, table and pack schema, ruleset:** none. The barcode is computed from `meta.id` and the flip is module state. Nothing is stored (constraint 7).
- **Decision:** one, **N** (§3). It replaces Decision 128 in part.
- **Flags:** none.
- **A new dev dependency:** `@zxing/library`, in `devDependencies` only, used by one test. It ships nothing (constraint 1 is about the app) and `package-lock.json` moves (ZQ6).

## 3. The decision, drafted

Paste it as written and fill in *Built*. Under 350 words.

```
N. **The TAG's barcode is a real Code 128 of its twelve characters, and a button beside it flips it to dark-on-white for scanning.**
     *2026-11-NN · Ken + Claude · Touches: meta.id, TAG, tagBars, code128Runs, intakeBarsSvg, intakeHtml, intake-bars, intake-flip, tagScanOn, appCopy.tagScan, p-intake, prefers-reduced-motion, light theme, hover, @zxing/library*
     - **Decided:** the bars under a character's name are Code 128 (subset B) of the TAG's twelve characters, drawn by `Engine.tagBars` and the UI's one drawing, on the sheet, the Review step and the print header. A phone that reads one gets the twelve characters. On the dark theme a **Scan** button beside the bars, shown on hover and focus, flips them to black on a white patch with a margin, for every `.intake` on the page, and back. The flip is view state in module memory: not saved, not in `S`, gone on reload. The light theme has no button. The print header is the same drawing at the same size. It is unique per TAG, as the old bars were.
     - **Why:** Ken (2026-11-26): the barcode should be a real one, an easter egg for a curious scanner. Light-on-dark bars fail in a real decoder, so a scannable dark theme needs a patch, and a button leaves the look alone until someone asks.
     - **Rejected:**
       - Code 39, which Decision 128 weighed: wider for the same text, no checksum, and no lowercase if a URL ever joins it.
       - A QR code: square, so it breaks the line under the name; hand-rolling error correction with no imports; and it reads as a payment sticker, not a form's barcode.
       - A URL in the bars (the site plus the TAG): about twice the width (343 units against 167), and no page on either site takes a TAG. ZQ1 kept it open.
       - Dark bars on a light patch all the time: changes how the header looks for every player to serve a rare scan.
       - Saving the flip: it is a moment, not a preference.
     - **Replaces:** Decision 128 in part: its "a scannable Code 39 barcode, until a decoder can verify it; the bars are decoration". A decoder now verifies it.
     - **Revisit if:** a phone fails to read the flipped bars at the shipped size, or a page on shadowsrpg.com takes a TAG (then ZQ1's alternative is worth a look).
     - **Built:** app 0.81.0, PR (this one), log entry 2026-11-NN.
```

## 4. Questions for Ken

Each has a default. One left blank is answered **Default**.

- **ZQ1: What the barcode says.** *Default (a):* the TAG's twelve characters, `WEDP2K7ZYA82`. Narrowest; unique per character; a scan shows the TAG and nothing else. *(b)* the full `TAG-WEDP-2K7Z-YA82`: 233 units, a third wider, same data as the text under it. *(c)* `shadowsrpg.com/#WEDP2K7ZYA82`: opens the site (the `#` keeps the TAG off the server, so no 404) but is 343 units, about 686px at ZQ2's 2px a unit, which doesn't fit under a name on a phone. It would need 1px a unit and the scan-from-a-screen odds drop. It also needs a data key (`tag.scanHost`) and a changelog line promising a page. `getdangerous.net` is two characters longer again.
- **ZQ2: How wide the bars are.** *Default (a):* 2 CSS pixels a unit, 334px: exact at every device pixel ratio (pre-flight 5). They scale down only when the line is narrower than that (a 320px phone), and the builder says what scale it settled at. *(b)* today's 1.4px, 234px: the same width as now, softer edges at 1× DPR, and the likeliest to fail a phone. If Ken's phone fails (a), the next step is a taller patch or a bigger unit, and it comes back to him.
- **ZQ3: The button on a touch screen.** *Default (a):* with no hover to reveal it, it is shown, quietly (about 60% opacity), on devices where the primary input can't hover. *(b)* hidden there: the phone header stays as it is, and a tablet or phone can't flip. (Scanning your own phone's screen with itself isn't possible, but a second phone can.)
- **ZQ4: Which theme.** *Default (a):* the dark theme only, Ken's words. The light theme's bars measure about 4.4:1 and read as they are (pre-flight 3). *(b)* the button in both themes: the same press also gives black-on-white in the light theme, a little more contrast than `--dim` at 85%.
- **ZQ5: How long it stays flipped.** *Default (a):* until pressed again or the page reloads. *(b)* it goes back by itself after 60 seconds, so a white patch isn't left glaring at a dim table.
- **ZQ6: The decoder in the tests.** *Default (a):* `@zxing/library` as a dev dependency, one test file, so the bars are checked by a decoder that shares none of our code (that is Decision 128's own condition). *(b)* a small decoder written in the test: nothing new in `package-lock.json`, but it shares the encoder's table, so a typo in the table could cancel out.
- **ZQ7: The printed header.** *Default (a):* same size (10pt tall, about 0.18mm a unit). The bars become Code 128, and the changelog says nothing about printing. Whether a phone reads them off paper is Ken's to try, and a bigger print size is a wish of its own (the front page is full: Decision 96). *(b)* widen them in print now. That is a layout change to a full page, not a one-line order.
- **ZQ8: The words.** *Default (a):* §9's drafts, each marked for a voice pass, and the reviewer drafts rewrites side by side for Ken to pick, through the conductor. *(b)* Ken or the voice skill rewrites them in this order first.

## 5. The assumption sweep

Every reader was found by grepping `intakeBarsSvg`, `intake-bars`, `intakeHtml`, `intake-no`, `\.intake\b`, `p-intake`, `tagPrint`, `barcode` and `tagNumber` in `src/`, `tests/`, `tools/` and `docs/` at `afb4220`. **Twins count.**

| # | What | Where | Today | After |
|---|---|---|---|---|
| 1 | `intakeBarsSvg(id)` | shared.js:1341 | draws the decoration from the id; `""` if none | draws `Engine.tagBars(id)`'s runs: bars at the even runs, `viewBox` the unit count, width = units × the unit (2px), `""` when `tagBars` is null. Same signature. Still `aria-hidden` |
| 2 | `intakeHtml(ch)` | shared.js:1363 | label, bars, number inside `.intake`, a `title` on it | label, bars, **the button**, number; `.scan` when `tagScanOn`; the `title` stays. Dark theme's button only (§9) |
| 3 | Main and the read-only seat sheet | sheet.js:530 `sheetHeader` | `intakeHtml(ch)` | unchanged call; it gets the button. A GM's read-only seat sheet therefore has one |
| 4 | The Review step | wizard.js:829 | `intakeHtml(ch)` in `.review-block` | unchanged call; it gets the button |
| 5 | The print header | sheet.js:3092, print.css:77-79 | `intakeBarsSvg(intakeOf(ch))` in `.p-intake`, `height:10pt;width:auto;color:#222` | **same call**, now Code 128; no button, no `.scan`; same CSS. Width becomes 167:20 of the height, 83pt |
| 6 | `.intake`, `.intake-bars`, `.intake-no` | shadows.css:322-324 | `.intake-bars{flex:none;opacity:.85}` | `.intake-bars` may shrink on a narrow line (`flex:0 1 auto;max-width:100%`); `.intake-no` keeps `white-space:nowrap` (tests/build.test.mjs:586) and `.intake` keeps `flex-wrap:wrap` (:587) |
| 7 | The lock's wipe | shadows.css:469-473, 549 | `.intake.issued .intake-bars{animation:tagPrint}`; the number stamps | **unchanged**. The wipe draws the new bars in. Reduced motion (:549) already drops it. The button is not animated |
| 8 | The old bars' tests | grep of `tests/` for `intake` | `smoke-roster.test.mjs:357-404` read the label and number text only; `smoke-sheet-archetypes.test.mjs:478,485` read `.issued`; `build.test.mjs:586-587` read two rules. **None reads a bar** | no expected break. If one breaks, it's the order's miss: report it |
| 9 | `tools/frame-fixture.json` | six `div.intake` rows: 358×47.8 at 390, 736×20, 1240×20, 940×20, 1920×20, 1620×20 | the line wraps at 390 only | the button adds ~30px and the bars grow to 334: **at 390 it still wraps to two lines** (bars on the first; button and number on the second), at the rest it fits. The row at 390 should still read 47.8, and a different number is the builder's to explain. Regenerate **only** the `.intake` rows |
| 10 | `tools/phone-check.mjs` | widths at 453, 484, 741, 852: | measures header height and sideways overflow | gains §11's checks |
| 11 | Text that points at the bars | grep of `src/`, `README.md`, `docs/` (not the ledger, log or audits) for `barcode`, `bars`, `intake number` | the changelog's old lines (history, never edited), the audit's notes | **none to fix**. `D.tag.text` doesn't mention the bars |
| 12 | The "TAG's hover" | `title` on `.intake` (shared.js:1365) | says what a TAG is | **unchanged**; the button has its own `title` (§9) |
| 13 | `window.SHADOWS_DATA` keys | `appCopy` | none for this | `appCopy.tagScan` `{button, flip, back}`, all read by `intakeHtml`. Decision 135's guard fails if one isn't |
| 14 | Anything that reads `meta.id` or `tagNumber` | engine.js:651, 8918 (`tagNumber` in the roster part) | text | **unchanged**. `tagBars` is a new reader of `meta.id`, total over a bad one |

**The three questions, answered by grep.** *Which guards read a value this changes?* None reads a bar (row 8); `build.test.mjs:586-587` read `.intake-no` and `.intake`, which keep their rules. *Where does each new thing render?* The button, Main, the seat sheet and the Review step: rows 3 and 4. The print header never (row 5). *What text points at what this changes?* None (row 11).

## 6. Read first

`CLAUDE.md`: constraints 1 (no network: the decoder is dev-only), 2 (no `import`/`export` in `src/`), 3 (`index.html` stays a shell: no inline style from JS either, classes only), 5 (the engine never touches the DOM) and 8 (totality). `docs/SCHEMA.md` §4: 128, 133, 163, 135, 68, 316–319. `docs/VOICE-APP.md` for the button's words. Files: `src/ui/shared.js` (`intakeBarsSvg`, `intakeHtml`, the module state like `issuedNow` and I2's take-once state, `calm()` from I1's kit), `src/engine/engine.js` (`isIntakeId`, `tagNumber`, `INTAKE_ALPHABET`, the export list near 10698), `src/styles/shadows.css` (:322-325, 469-473, 549), `src/styles/print.css` (:77-79), `tests/smokekit.mjs`, `tools/phone-check.mjs`.

## 7. Out of scope

- **A URL or anything but the twelve characters in the bars**, unless ZQ1 says so.
- **A QR code, Code 39, any other symbology.**
- **Enlarging the print header's bars** (ZQ7), or touching the print front page's layout.
- **A setting, a saved preference, or a field on the character.** Nothing is stored.
- **A different TAG.** `meta.id` never changes (Decision 133, constraint 6).
- **A scan button anywhere but beside the TAG** (the Home roster, the GM's table, an export).
- **Restyling `.intake`'s label or number**, or changing the lock's wipe.

## 8. The shapes

No data shape, no saved-file field, no `migrate()` step. Two engine functions and one data key:

```
Engine.code128Runs(text) -> number[] | null
  Code 128, subset B. The runs, alternating bar and space, starting with a bar:
  start B (104), each character's value (its code minus 32), the checksum
  (start + each value x its 1-based position, mod 103), and the stop pattern.
  null (never a throw) for a non-string, an empty string, or a character
  outside codes 32-126.
Engine.tagBars(id) -> { text, runs, modules } | null
  text    the twelve characters: the id with "TAG-" and the hyphens removed.
  runs    code128Runs(text).
  modules the sum of the runs (167 for any twelve-character TAG).
  null    unless Engine.isIntakeId(id): a counterfeit, an old NCR- number, "", null,
          undefined, a number, markup. Total: it never throws.
appCopy.tagScan = { button, flip, back }   // §9
```

Both functions are exported beside `tagNumber` (engine.js:10698) and nothing outside the engine reads the 107-row pattern table.

## 9. The UI

**Drawing (`intakeBarsSvg`).** One `<rect>` per bar from the runs, `fill="currentColor"`, `shape-rendering="crispEdges"`, `preserveAspectRatio="none"`, `aria-hidden="true"`, height 20, no margin inside the SVG (the quiet zone is the patch's, below). `width` is units × the unit (ZQ2: 2px) as an attribute, and the CSS lets it shrink on a narrow line.

**The button.** A real `<button type="button" class="intake-flip">` after the bars and before the number, inside `.intake`. Text, not an icon: **Scan**, in the number's mono face, size and tracking, so it reads as part of the form. `aria-pressed` carries the state, `title` and `aria-label` say what a press does. It never takes part in `.intake`'s `title`.

| State | Button's `title` / `aria-label` | Draft (voice pass) |
|---|---|---|
| shows as | the label | **Scan** |
| not flipped | what it will do | **Flip the barcode so a phone can read it** |
| flipped | what it will do | **Flip it back** |

All three are `appCopy.tagScan` and **city voice**; mark each for a voice pass (ZQ8) and paste each into the PR as it renders. The reviewer drafts rewrites side by side.

**Behaviour, not markup.**
- **Visible:** hidden (not removed) by default. Shown when `.intake` is hovered, when focus is inside `.intake`, and while flipped. On a device that can't hover, shown quietly (ZQ3). Its space is reserved either way, so showing it moves nothing.
- **A press flips every `.intake` on the page at once and does not re-render.** Focus stays on the button, and a render here would drop it. It sets `tagScanOn` (module state in `shared.js`, never `S`, never storage) and toggles `.scan` on each `.intake`; `intakeHtml` reads `tagScanOn` for the render that follows, so a re-render keeps it. Pressing again clears it.
- **Flipped:** the bars draw `#000` on a `#fff` patch, `opacity:1`. The patch extends **at least 8px past the bars on each side** (about 6 units at 1.4px, 4 at 2px), as padding with the same negative margin, so no neighbour moves. The number's left edge is 10px from the bars, so the patch must not paint over it: the builder sets the margin and says what it chose.
- **The motion:** under `calm()`, none. Otherwise the patch takes one short wipe reusing `tagPrint` (shadows.css:469), about .2s. It plays on the press only, never on a re-render that keeps the flip.
- **Light theme:** `:root[data-theme="light"] .intake-flip{display:none}`, and `.scan`'s patch is dark-theme only, so a flip carried into the light theme shows nothing odd (ZQ4 (a)). The theme toggle while flipped works in both directions.
- **Stacking.** The patch sits over `.intake`'s own gap, under the number's text, and under the sticky header (z 60). `.intake.issued`'s wipe on the bars and the button's flip are separate rules on the same element: state which one wins when a lock's wipe is playing (the flip, on a press, replaces it).

**The print header.** `.p-intake svg` is unchanged; it gets Code 128 because it calls the same function. No `.intake-flip` is ever in `#printSheet`.

## 10. Worked examples, as named tests

The builder writes these first and shows them failing on `main`, or says why one already passes. Fixtures come from §8's rule, not from the prototype's files.

1. **`tests/tagbars.test.mjs`: "Z1 1: the pattern table is Code 128's".** The engine's 106 six-digit patterns each sum to 11, are pairwise different, and the stop pattern sums to 13. (Reaches the table through `code128Runs`: start B, then each value 0–95 as a character, checking the six runs after the start, and the stop.)
2. **"Z1 2: a one-letter text".** `Engine.code128Runs("A")` is `[2,1,1,2,1,4, 1,1,1,3,2,3, 1,3,1,1,2,3, 2,3,3,1,1,1,2]`: start B, the value 33, checksum 34, stop. 46 units. *(A hand check: 104 + 33×1 = 137, 137 mod 103 = 34.)*
3. **"Z1 3: the sample TAG".** `Engine.tagBars("TAG-WEDP-2K7Z-YA82")` has `text` `WEDP2K7ZYA82`, `modules` 167, and `runs` `2112143113211321131123133131212232111123313121313123113121131113233112222232113131212331112` (91 runs). The checksum's six runs, the 79th–84th from the front, are `313121`: its value is 48. The first six are the start, `211214`, and the last seven the stop, `2331112`. *(A hand check: the weighted sum plus 104 is 2829, and 2829 mod 103 = 48.)*
4. **"Z1 4: a decoder reads it back".** With `@zxing/library` (ZQ6 (a)): for the sample and for fifty `Engine.newCharacter().meta.id`s, rasterise the runs to a luminance array (3px a unit, 40px tall, a 10-unit white margin each side, dark on light), decode as Code 128, and get `text` back. Also: the same raster **inverted** fails to decode. That is the reason for the button, and it must stay true.
5. **"Z1 5: a bad id is no barcode".** `tagBars` of `""`, `null`, `undefined`, `5`, `{}`, `"TAG-"`, `"TAG-WEDP-2K7Z-YA8"`, `"NCR-WEDP-2K7Z-YA82"`, `"TAG-wedp-2k7z-ya82"` and `"<script>"` is `null` and never throws. `code128Runs("é")`, `code128Runs("")` and `code128Runs(7)` are `null`.
6. **`tests/smoke-roster.test.mjs`: "Z1 6: Main's TAG has a flip button, and it flips every TAG".** Dark theme, a locked character: `#main .intake .intake-flip` exists with `aria-pressed="false"` and the label from `appCopy.tagScan`. A click makes it `"true"` and gives every `.intake` in the document `.scan`. A re-render (a commit that redraws Main) keeps `.scan`. A second click clears both. The focus is on the button after the click.
7. **"Z1 7: the Review step and the seat sheet draw it too, the print header doesn't".** The Review step's `.intake` has the button. A read-only seat sheet's has it. `#printSheet .p-intake` has an `svg` and no `button`.
8. **"Z1 8: the same TAG has the same bars everywhere".** The `d` of each bar, or the sequence of `rect` widths, in the Main `.intake`, the Review `.intake` and `.p-intake` are identical for one character.
9. **"Z1 9: a Ghost TAG and a TAGless number read as before".** The label (`Ghost TAG`, `Off grid`) and `intake-no`'s text are what `smoke-roster.test.mjs:373-404` already pin, with the bars now Code 128. Those tests stay unchanged and pass.
10. **`tests/build.test.mjs`: "Z1 10: the button's CSS".** By parse: `.intake-flip` is hidden by default (the property the builder chose, `opacity:0` or equivalent, but not `display:none`); shown under `.intake:hover`, `.intake:focus-within` and `.intake.scan`; shown (quietly) inside `@media (hover:none)`; `:root[data-theme="light"] .intake-flip` is `display:none`; `.intake.scan .intake-bars` sets `color:#000` and `background:#fff`; and `.intake-no` and `.intake` keep the two rules `build.test.mjs:586-587` pin.
11. **"Z1 11: copy is read".** Every `appCopy.tagScan` key is read by `intakeHtml` (Decision 135's guard), and `voice.test.mjs` passes on all three strings.

## 11. Tests beyond the examples

- **`tools/phone-check.mjs`, in Chromium, dark theme.** At 320, 375, 390, 768 and 1280: Main's `.intake` and the Review step's, with the flip off and on. **Flipping moves nothing**: the number's, the label's and the heading's rects are identical before and after. The bars sit inside the viewport's width, the page's `scrollWidth` equals its `clientWidth`, and `.intake` wraps rather than overflows. Report the bars' rendered width at each size and the scale it settled at (ZQ2).
- **Computed colours, both themes.** Flipped, in dark: the bars `#000` on the patch's `#fff`, contrast 21:1. In light: the bars' computed contrast against the page (the pre-flight's 4.4:1 by hand, re-measured), and that `.intake-flip` computes `display:none`.
- **Reduced motion.** With the media feature on, a press changes `.scan` with no animation (`getComputedStyle().animationName` is `none` on the bars and the patch).
- **Theme toggle while flipped.** Dark, flip, light: no white patch. Back to dark: still flipped.
- **Mutation-test each new guard** against the pre-fix code (a guard that passes before and after is decoration): drop the checksum from `code128Runs` (Z1 3 and 4 fail); change one pattern digit (Z1 1 fails); drop `.scan` from `intakeHtml`'s class (Z1 6's re-render step fails); remove the `:focus-within` rule (Z1 10 fails); have the print header draw a button (Z1 7 fails); move the number when flipped (phone-check fails). Say which test caught each.

## 12. Steps

Each ends with `npm run verify` (or `test:fast` while working), and the visible ones with the dev preview.

1. **Setup.** `git submodule update --init private`. Baseline: `npm run test:fast`. Write §10's examples 1–5 and 11, show them failing on `main`.
2. **The engine.** `code128Runs`, `tagBars`, exported beside `tagNumber`. Examples 1–5 pass. Add `@zxing/library` to `devDependencies` (ZQ6) and run `npm install` so `package-lock.json` moves.
3. **The drawing.** `intakeBarsSvg` from `tagBars`. Examples 8 and 9 pass. Look at it in the dev preview (`shadows-dev-preview`, which runs `tools/devserver.mjs`) on Main, on Review and in the print preview, at 1280 and 375.
4. **The button, the state and the CSS.** `appCopy.tagScan`, `tagScanOn`, the flip in `shared.js`, the rules in `shadows.css` (§9), examples 6, 7 and 10 pass. Seed a locked character in the preview (`shadows.active.v1`, then **Open sheet**).
5. **Walk it by eye, in the preview**, and say what you saw: hover shows the button and moving off hides it; Tab reaches it and shows it; press flips every `.intake`; a commit keeps it; press again clears it; the theme toggle both ways; reduced motion (the emulated media feature); the lock's wipe on a fresh lock; a Ghost TAG and a TAGless character; the Review step; the GM's read-only seat sheet (`?gm=on`, the *Dead Air* sample).
6. **phone-check** (§11): add the checks, run `npm run phone-check`, and put the table in the PR.
7. **The frame fixture.** Run whatever reads it; only the `.intake` rows may move (§5 row 9).
8. **Ken's phone.** The builder leaves the PR's dev preview steps; the conductor brings Ken the flipped dark-theme TAG on his screen and asks him to scan it with his phone. It must read as the twelve characters. A failure comes back as ZQ2's next step (a taller patch, a bigger unit), not as a merge.
9. **Close-out** (§14).

## 13. Stop and ask

Stop and ask the conductor if:
- the old bars were read by something §5 doesn't list (a test, a script, a doc);
- a decoder in the test reads the *flipped* look wrong where §10's example 4 says it should read: the encoder is off;
- the flip can't be done without a re-render (a re-render drops focus: that is a finding, not a workaround);
- the `.intake` row in the frame fixture moves by more than the §5 row 9 prediction, or any other row moves;
- Ken's phone doesn't read it (step 8);
- `npm install` of `@zxing/library` pulls anything that wants a network at test time.

**Not stops:** the version literals the bump moves (`APP_VERSION`, `package.json`, the lockfile's app version, README, STATE), the changelog and its generated file, a `.intake` row moving as §5 row 9 says, and `package-lock.json` gaining `@zxing/library` and its dependencies.

## 14. Close-out

Run the `close-the-session` skill for this tier. In particular:
- **The ledger:** §3's entry as the next free number, under SCHEMA §4; its `INDEX.md` §3 line; **Decision 128 marked `→ **Superseded in part by Decision N**`** (what changed: the bars are no longer decoration, a decoder verified a real barcode) and its INDEX line `→ **superseded in part by N**`. 133, 163 and 135 are cited, not marked.
- **The versions:** `npm run bump -- 0.81.0` (or the next minor), then the changelog.
- **CHANGELOG, in player voice** (draft, voice pass): "**The barcode under your name is a real one.** Point a phone at your TAG and it reads. On the dark theme, hover the barcode and press **Scan** to flip it to black on white, which phones read, and press it again to flip it back. Characters you've already made keep the same TAG." Then `npm run changelog`.
- **`docs/log/shipped.md`**: one row. **`docs/log/2026.md`**: an entry (a new dev dependency; the pre-flight's measures). **`STATE.md`**: rewritten: §5's next list loses Z1 once merged; the live version line stays as it is until a release. **`INDEX.md`**: the `Z`/`ZQ` row is already in §2; its text says where the questions live. **`docs/plans/tag-that-scans.md`**: row Z1 built.
- **The prototype:** `tmp-barcode-proto/` is deleted in the PR (it is untracked and must not ship).
- **PR title:** `feat(sheet): the TAG's barcode scans (Decision N, Z1)`. **PR body:** the template's sections plus *Where the order didn't fit*, and every claim naming its command or test.

**Review checklist** (beyond the tests passing):
- [ ] The reviewer re-runs the sweep (§5) by grepping `intakeBarsSvg`, `intakeHtml`, `intake-bars` and `p-intake`, and says what it found that I didn't.
- [ ] The mutations (§11) were run, each caught by the test the PR names.
- [ ] **Run in the preview**, dark and light: hover, keyboard, press, re-render, theme toggle, reduced motion, the lock's wipe, the Review step, the seat sheet. Nothing next to the bars moves when flipped.
- [ ] **A real decoder reads the PR's flipped look**: render the patch to an image and decode it, not only the raster in the test. Report what read and at what size.
- [ ] Every string in §9's table is pasted into the PR as it renders, with the reviewer's side-by-side rewrites for Ken (ZQ8).
- [ ] The print header: Code 128, no button, unchanged size; `npm run phone-check` and the print preview checked by eye.
- [ ] `package.json` gained only `@zxing/library` under `devDependencies`; nothing in `src/` imports it, and `tests/build.test.mjs`'s no-network and no-import guards pass.
- [ ] Decision 128 is marked in the ledger and in INDEX; the new decision's text is under 350 words and says what it replaced.

## 15. Handing it over

The two prompts are in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md), *The prompts*, with this order's path: `docs/plans/tag-that-scans/Z1-a-tag-that-scans.md`, plan `tag-that-scans`. This order's own traps:

- **A decoder isn't a camera.** The tests prove the bars encode the text. They don't prove a phone reads the screen. Step 8 is Ken's phone, and no test stands in for it.
- **Don't re-render on a press.** Toggle the class on the existing `.intake`s. A render drops focus off the button, and the screen reader loses its place.
- **A whole number of CSS pixels a unit.** The old 1.4 is exactly what blurs a bar at 1× DPR. If the line is narrower than 334px, scale down and say so; don't go back to 1.4 to make it fit without telling the conductor.
- **The patch must not move anything.** Padding with a matching negative margin, checked in Chromium by the number's rect, not by eye. jsdom has no layout: a smoke test can't prove this.
- **The light theme.** The button isn't there, and a flip from the dark theme must not leave a white patch (§9). The `hover:none` rule must not show the button in the light theme either.
- **The print header is a twin.** It calls the same drawing, so it changes whether you meant it or not. Look at the print preview.
- **Nothing in `src/` imports the decoder.** `@zxing/library` is for `tests/` only; constraint 2 and the no-network guard are enforced by `build.test.mjs`.
- **Don't invent a payload.** The bars say the twelve characters. A URL or a prefix is ZQ1's alternative, and it isn't this order's.
- **`tmp-barcode-proto/`** is an untracked scratch folder with the encoder the engine's is checked against. Use it to cross-check, never import from it, and delete it in the PR.
