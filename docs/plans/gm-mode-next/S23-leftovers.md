# Work order S23: at the table, the leftovers

**Plan:** [`../gm-mode-next.md`](../gm-mode-next.md), session S23, and its §6 (*S23's leads*), with **W141**
(`.form-toggle`'s dark-mode frame) and **W145** (the GM's own tab icons, from Lucide: GQ60) folded in. **The leads** come from the GM-at-the-table reviews (U2's and U4's re-critiques, U3's and U5's reviews).
**Reopens:** Decision 272 in part (the Reset's key), and 179 in part (a member's line add, open by default).
**Status:** **drafted 2026-11-18** by Claude (Opus), the conductor, at Ken's pick ("we could draft S23"). **Approved by
Ken 2026-11-18**, in the conductor session: GQ61–GQ66 on their defaults ("the other defaults are good"). **GQ60
answered otherwise:** "Pick Lucide icons now". S23 gives each GM tab a Lucide icon of its own, and Scott's set can
replace them later.
**Branch:** from `main`; PR to `main`. GM mode is on for everyone (Decision 239), so nothing ships switched off.
**Runs beside:** **K3** (#365, the sheet's guide lines), being built in another session. Both may touch `shadows.css`
and `shared.js`. **Rebase after K3 merges, and don't touch `sheetGuide` or the sheet's Help.** **Say N everywhere.**

**Pre-flight** at `4c2e591` (`main`, after S11a's #364). **§6's line numbers are from `main` after #313, and every one has
moved.** Re-find each lead by the name given, not the number. Re-checked on this commit:
- **Clock steppers carry no id.** `data-clkminus` and `data-clkplus` are empty attributes (`gm.js` ~2128, ~2142).
  `keepPlace` finds the first one on the page.
- **An encounter step's audit label is the record's name.** `_recLabel` (`engine.js` ~7320) ends in `Changed ${n}`. An
  encounter's Next is one of the `_tableStamp(t, e)` writes (~9820–10034).
- **phone-check's `tabOut` ignores the bottom edge.** It takes left, right, and top only (`tools/phone-check.mjs` ~288).
- **"Ctrl/⌘" in the Keys list** is hard-coded (`gm.js` ~344, ~350).
- **At a Reset there's no Next.** `v.atReset ? "" : <Next>` (`gm.js` ~4031), so `N` has nothing to press.
- **U3's session test** looks for `[data-crew-name]` (`tests/smoke-table-play.test.mjs` ~2718). Dead Air's names are
  seats, so its `if (pressed)` skips.
- **phone-check's `statusUnderName`** is true whenever no Edit is open (`tools/phone-check.mjs` ~607). On the read view
  it proves nothing.
- **The GM's tab icons are still the sheet's.** `TABLE_SECTIONS[].ui` (`gm.js` ~265) names `tab_main`, `tab_trackers` and
  others from `shadows-icons.js`, which has no GM-only icon.
- **Not re-checked:** the leads §6 marks *critique*. Nobody has reproduced them, and this order asks the builder to
  reproduce each before fixing it (§5).

**Carried over** (S24's, S25's and S11a's reviews):
- **A drafted line was false twice** (S24's in-fight Heal; S11a's "lands at the top", when a new thread lands where
  New thread puts it). **Every behaviour §9 drafts is checked against the code's existing equivalent** before it's built.
  Say where it differs.
- **A drafted template missed a case** (S11a's "a"/"an"). Run each new string against real data, not one example.
- **An unremembered reader** (every sweep miss). Grep every reader of what you change.
- **The voice guard** (U4's "book:", S24). Grep `voice.test.mjs` for every word a fix changes.

## 1. Goal and Done when

**Goal.** The small things the GM-at-the-table reviews found and left for later: focus that lands in the wrong place,
labels that don't say what changed, guards and tests that prove nothing, and the critiques' leads that turn out to be
real. Plus Ken's calls on five behaviours (§4).

**Done when:**
1. **Clocks:** after Undo (toast or Ctrl/⌘+Z), focus returns to the stepper of the clock that changed, not the first
   clock on the page.
2. **An encounter's audit:** a step logs what it did ("Next: round 2, Rook acts", "Reset: round 3") in Activity and
   in "Undone: …". It doesn't log the encounter's name alone.
3. **Activity** opens with focus on its heading, not on an Undo button. `A` then Enter does nothing destructive.
4. **The Keys list** says Ctrl or ⌘, whichever this machine uses.
5. **W141:** `.form-toggle`'s ring and its pressed state are at least 3:1 in the dark theme, everywhere the component
   appears. A contrast guard in `build.test.mjs` pins both.
6. **The guards prove something:**
   - phone-check's `tabOut` counts the bottom edge;
   - `statusUnderName` is measured in Edit;
   - U3's session test finds its button by the seat selector and asserts that it found it.

   Each is mutation-tested.
7. **Each *critique* lead** in §5 is either reproduced and fixed, or reported as not reproduced, with how it was checked.
8. **Ken's calls** (GQ60–GQ66) are built as answered.
9. **W145:** no GM tab borrows a sheet tab's icon. Each has a Lucide icon that fits it, and the sheet's tabs are
   unchanged.

## 2. Tier, versions, numbers

**Rule or shape**, because of GQ61 and GQ64 (behaviours someone chose otherwise). Everything else is *Fix*.
- **App:** join `main`'s `[Unreleased]` heading (0.73.0, a minor) if it's still unreleased. Otherwise take a patch.
- **Game data, character, table and pack schemas:** none. Check that each fix leaves them alone, and stop if one
  doesn't.
- **Decisions:** **N** (GQ61, the Reset's key), and **N+1** (GQ64, a member's line add folded), if Ken takes those
  defaults. A GQ answered "leave it" makes no decision.
- **Flags:** none.
- **Wishes:** W141 and W145 granted. Scott's own set, if it comes, is a Fix that swaps the strings.

## 3. The decisions, drafted

```
N. **At an encounter's Reset, Finish the round takes Next's place, and N presses it.**
     *2026-11-18 · Ken + Claude · Touches: encounter Reset, Finish the round, Next, the N key, encResetHtml, the encounter bar, keys list, Decision 272*
     - **Decided:** While an encounter is at its Reset, the bar's primary button is **Finish the round**, where Next sits, and `N` presses it. The Reset's checklist is unchanged.
     - **Why:** At a Reset `N` did nothing and nothing said why, and on a phone Finish the round was below the fold. The same key moves the fight on at every point.
     - **Rejected:** A notice on `N` at the Reset: it explains a dead key instead of making it work. Moving the checklist up: it's long, and its order is the book's.
     - **Replaces:** Decision 272 in part: `N` presses Finish the round at a Reset.
     - **Revisit if:** a GM presses `N` at a Reset by mistake and skips the checklist.
     - **Built:** app X.Y.Z, PR #…, log 2026-11-…

N+1. **A cast member's crew-line add sits behind "Add a line", below the lines.**
     *2026-11-18 · Ken + Claude · Touches: castInteractionsHtml, a member's read view, crew lines, Add a line, Decision 179*
     - **Decided:** A member's read view lists their lines, then an **Add a line** button. Pressing it opens the add row where the button was, focused on its first field. Saving closes it.
     - **Why:** The open row put about 14 tab stops between Clocks and the GM note on every member. A GM reads a member far more often than they add a line.
     - **Rejected:** Keeping it open (179): the cost is paid on every read. Moving it to Edit: a line is added mid-scene, from the read view.
     - **Replaces:** Decision 179 in part: the add row is folded.
     - **Revisit if:** GMs add lines from a member's page more than they read it.
     - **Built:** as N.
```

**Supersession marks:** 272 and 179 → **superseded in part**, with their INDEX lines. W141 to `log/wishes-granted.md`.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| **GQ60** | **W145, the GM's own tab icons.** Scott is to draw six. They haven't arrived. | Default was "out of S23". **Answered (Ken, 2026-11-18): "Pick Lucide icons now".** Each GM tab gets a Lucide icon of its own (§5). |
| **GQ61** | **At a round's Reset, `N` does nothing.** On a phone, Finish the round is below the fold. | **Finish the round takes Next's place, and `N` presses it** (Decision N). |
| **GQ62** | **The Hit panel's Apply sits above its modifiers** (UQ24's order). A critique flagged it. | **Leave it.** UQ24 chose it so a plain hit is one tap, and nothing new has come up. |
| **GQ63** | **Cast and Players open on their Add form above the list** (critique). U3 put Add below the content elsewhere. | **Reproduce it first.** Wherever Add still sits above the list, move it below, as U3 did. This needs no decision: it follows U3's. |
| **GQ64** | **A member's read view keeps the crew-line add row open,** about 14 tab stops. | **Fold it behind "Add a line", below the lines** (Decision N+1). |
| **GQ65** | **The Sessions tab leads with Next session while a session is open,** and the list doesn't mark the open one. | **While a session is open, a line above Next session reads "Session N is open", with an Open button, and the list marks it "Open".** Next session stays where it is. |
| **GQ66** | **On a phone, every list tab starts with chrome.** The table's name and its "created" block repeat on every tab, and Cast's first card starts near 850px. | **Show the name block on Sessions only,** the table's first tab. Cast's filters are unchanged. A filter fold is its own change, if it's still needed after this. |
| — | **Ctrl/⌘+Z reaches across sections** (272: "on any page"). | Not asked. §6 says to revisit only if a GM reports it, and none has. |

## 5. The work, lead by lead

**Reproduced fixes** (pre-flighted above):

| Lead | Fix |
|---|---|
| Clock steppers carry no id | Give `data-clkminus` and `data-clkplus` the clock's id, and let `keepPlace` find that one. Grep every reader of the bare attribute (`gm.js` ~601, ~2152), and update each |
| An encounter step's audit label | Give `_recLabel`, or the encounter's own writers, a label from what changed: Next, Reset, a hit, a Condition. Check how S20's and U1's writers already pass a label, if any |
| phone-check's `tabOut` | Count the bottom edge. Mutation-test it: push the tab row's last tab below its frame, and the check fails |
| `statusUnderName` | Measure it with Edit open, or retarget it at the read view's own layout. Say which |
| U3's session test | Use the seat selector, and `assert.ok(pressed)` before the click |
| W141 | Raise `--frame` for `.form-toggle` in the dark theme, or give it its own token. Pin both ratios in the contrast guard, and check every screen that uses it in both themes |

**From the critiques** (reproduce each first, and fix it only if it's real):
- **Activity's focus** on its "Undo: …" button.
- **"Ctrl/⌘"** on every platform. Use `navigator.platform` or `userAgentData`, through one helper.
- **The keys are invisible outside ⋮ → Keys.** Add a `title` or `aria-keyshortcuts` hint on the tabs and on Next,
  where `keysOn()` already gates it.
- **No section heading to jump to.** Each section gets an `h1` or `h2` that a heading jump lands on.
- **The running fight's card** on Encounters looks like the planned ones.
- **The dossier's prose** runs 98–100 characters a line at 1024px. Cap it near 70ch.
- **The bar's chips truncate at 1024px** beside a long "Add to encounter: …" button.
- **The Tonight strip on a phone** drops Down when the fight leads, and a clock at 7 of 8 has no urgency colour.
- **The Tonight strip's `.74rem` type.** Also: the award log's IP readout, close-out's focus after an attendance toggle,
  and "Close to full" counting 2 of 4.
- **Modal titles in the display face.** Also: a seat card's dim SAN, Luck and Çredits; a raw TAG as a seat's name; and
  Threats' "Slot in a pack" button.

**From U3's review:**
- **The stat block's figures:** grey mono to Oxanium, with the modifiers in green and magenta (`readBlockHtml`, which
  Threats uses too).
- **"formula" under TOL and WILL** (S24's word now): add a tip, if it's still unexplained.
- **The read view and the form order a member's fields differently,** and Debrief and Close-out swap places. Make the
  read view follow the form's order.
- **A note's Edit** sits at its foot. Put it beside the name, as every dossier's is.
- **Edit lands focus on Status.** Land it on Name.
- **A member clock's owner link** loses the member page you came from. Back returns to that member.
- **"Attention: Active"** is a plain tag. Make it a Mono Caps label over a value. Also explain "Key to".

**W145 (GQ60): the GM's tab icons, from Lucide.** The sheet's `ui` set is Lucide (ISC, `shadows-icons.js`'s header).
For each GM tab that borrows a sheet tab's icon, add a Lucide icon to `ui` under a new `gmtab_*` key, and point
`TABLE_SECTIONS[].ui` at it. Copy each icon's SVG from Lucide's published source, at the version the set already uses,
if the header names one. Keep the stroke, weight and viewBox of the rest. The sheet's tabs keep theirs. Suggestions,
for the builder to confirm against Lucide's names:
- Players: `users`
- Cast: `contact`
- City: `map`
- Threats: `skull`
- Encounters: `swords`
- Reference: `book-open`

Sessions (`tab_sessions`) and Notes (`tab_notes`) keep theirs if no sheet tab uses them. Grep first. Every new key must
be read (Decision 135). Show all eight tabs in the preview at desktop and 375px, in both themes.

**Ken's calls:** GQ61–GQ66, as answered.

A lead that turns out larger than a fix, because it needs a new pattern, a data shape, or a decision nobody has made:
**stop and report it.** Don't build it. It becomes a wish, or part of S28 or S29.

## 6. Read first

`CLAUDE.md` (the change tiers, *Verify, don't assert*). SCHEMA §4: Decisions 139, 164, 165, 179, 207, 209, 239, 269–272,
278 and 293. `docs/plans/archive/gm-at-the-table.md`'s *Leads after U5* and UQ24. `DESIGN.md` (the four voices, Mono
Caps). `gm.js`: `keepPlace`, the clock lines, `encResetHtml`, the encounter bar, `castInteractionsHtml`,
`sessionsTabHtml`, `nextSessionHtml`, `readBlockHtml`, `bindEdit`. `engine.js`: `_recLabel`, the encounter writers.
`tools/phone-check.mjs`. `tests/build.test.mjs`'s contrast guards.

## 7. Out of scope

- **The cast's stat blocks at a glance** (S28, W78).
- **Home's empty column** (S29, W80).
- **A filter fold on Cast** (GQ66).
- **Ctrl/⌘+Z by section** (not asked).
- **Anything on the player's sheet** but `.form-toggle`'s token. K3 is building there.

## 8. The shapes

No data, save-file or table shape moves.
- **Clock steppers:** `data-clkminus="<clock id>"` and `data-clkplus="<clock id>"`.
- **An encounter's audit label:** a string chosen by the writer that changed it. The builder says where it's set.
- **The platform key:** one helper in `shared.js`, `modKey()` → "Ctrl" or "⌘". Every place that shows "Ctrl/⌘"
  reads it.

## 9. The UI

Copy is drafted for the voice pass. Every line is checked against the code's existing equivalent first.
- **The Reset's bar:** **Finish the round** (primary), then End the encounter. The Keys list: "N · Next, or Finish the
  round at a Reset".
- **A member's lines:** the list, then **Add a line**. The open row is today's row, and Cancel folds it.
- **Sessions while one is open:** "Session 4 is open" and an **Open** button, above Next session. The open session in the
  list carries an "Open" tag, in the style the list uses for its other tags.
- **Activity:** focus on its heading.
- **The Keys list:** "Ctrl+Z" or "⌘+Z", one of the two.
- **An encounter's audit:** "Next: round 2, Rook acts" and "Reset: round 3". The builder drafts the rest from what each
  writer changes, for the voice pass.

## 10. Worked examples, as named tests

Each fails on `main`, or the builder says why it already passes.
1. Smoke: `"S23: Undo returns focus to the clock that changed"`. Two clocks: step the second, Ctrl+Z, and focus is on
   the second clock's stepper.
2. Engine: `"S23: an encounter's Next logs what it did"`. The audit's label for a Next isn't the encounter's name.
3. Smoke: `"S23: Activity opens on its heading"`.
4. Smoke: `"Decision N: at a Reset, N presses Finish the round"`.
5. Smoke: `"Decision N+1: a member's line add opens from Add a line"`. Folded by default, opened by the button, folded on
   save.
6. Smoke: `"S23: Sessions marks the open session"` (GQ65).
7. Build: `"W141: .form-toggle's ring and pressed state are 3:1 in the dark theme"`.
8. phone-check: `tabOut`'s bottom edge, and `statusUnderName` in Edit. Each mutation-tested.

## 11. Tests beyond the examples

- **Mutation-test every new guard** (§1's item 6, and W141's).
- **The phone:** `npm run phone-check` passes. Preview at 375px, 1024px and desktop, light and dark, for the leads
  that are about layout.
- **Voice:** every new string.
- **The audit:** undo and redo over an encounter's steps still round-trip (Decision 124).

## 12. Steps

1. Baseline: `git submodule update --init private`, then `npm run test:fast`.
2. The reproduced fixes and the guard and test gaps (§5's first table). Run `npm run verify`.
3. W141. Verify, then the preview in both themes.
4. Ken's calls (Decisions N and N+1, GQ65, GQ66). Verify.
5. The critique and U3 leads, one at a time: reproduce it, fix it or report it. Verify after each group.
6. Docs and close-out. Rebase on K3 if it has merged. Run the full `npm run verify` and `npm run phone-check`.

## 13. Stop and ask

- **Stop** if:
  - a fix moves a data, save-file or table shape;
  - a lead needs a decision nobody has made;
  - W141's token change moves a sheet screen's contrast below a guard;
  - K3 has merged a conflicting change to `shadows.css`.
- **Expected, not stops:**
  - tests asserting the old audit label, the old focus, the open line row or the name block on every tab;
  - the version literals.

## 14. Close-out

The `close-the-session` skill for *Rule or shape*:
- Decisions N and N+1, with their INDEX lines and the marks on 272 and 179.
- The app version.
- STATE rewritten.
- The log, and a `shipped.md` row.
- The plan's S23 row set to built, and §6's leads marked built, not reproduced, or moved, one by one.
- W141 and W145 granted.

**CHANGELOG** (drafted, GM voice):
- "Undo puts you back on the clock you changed."
- "At a round's Reset, N finishes the round."
- "A cast member's page folds its Add a line."
- "Sessions shows which one is open."
- "Toggles are easier to see in the dark theme." (Players see this too.)
- "GM mode's tabs have icons of their own."

**PR title:** `fix(gm): at the table, the leftovers (S23, W141, W145, Decisions N and N+1)`.

**PR body:** the template's sections, plus **Leads: fixed, not reproduced, moved** (a table) and **New strings as
rendered**.

**Review checklist:**
- §1's nine checks.
- Each *critique* lead's verdict, re-checked.
- Every new guard mutation-tested.
- W141 in both themes, on every screen with a toggle.
- Nothing on the sheet moved but the token.

## 15. Handing it over

The builder and reviewer prompts are in `WORK-ORDERS.md`, with this order's path. Its own traps:
- **Every line number in §6 is stale.** Find each lead by name.
- **A critique lead isn't a finding until you reproduce it.** Report the ones you can't.
- **K3 is in flight.** Stay off the sheet's Help and guide lines, and rebase after it lands.
- **Don't let a lead grow.** A new pattern is a wish, not this order.
- **Take the numbers at build** (decisions, app) from `origin/main`, and again after any rebase.
