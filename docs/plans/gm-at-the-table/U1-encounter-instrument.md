# Work order U1: the encounter as an instrument

**Plan:** [`../gm-at-the-table.md`](../gm-at-the-table.md), session U1. It owns findings #1–#8 (plan §2).
**Status:** **drafted 2026-11-05 by Claude (Opus)**, the critique's conductor acting as orchestrator, the first
order of its plan, so nothing is carried over. **Ken's shape answers** are in §9's head. They came from
`/impeccable shape` on the encounter row, asked as the plan's §3 says (2026-11-05). UQ9–UQ12 (§4) are this
order's own questions. **Approved by Ken 2026-11-05** ("Approve, all defaults", in the conductor session):
UQ9–UQ12 are each their default.
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Pre-flight:** against `main` at `5303568` (PR #302 merged: app 0.62.0, game data 0.53, character schema 0.34,
table schema 0.19). Findings:
- `encounterView`'s `health` has no `hpPer`, so a row can't draw its Health Levels without it
  (`engine.js:9934`, `:9943`). `_pcHealth` and `hlState` both compute it already.
- `hlCells(ch)` (`sheet.js:222`) takes a character. A row has no character, only the view's numbers.
- `.enc-bar` is a `.scroll-row` (`gm.js:3363`). That class sets `overflow-x:auto` (`shadows.css:766`), so at
  375px the bar scrolls sideways and End the encounter sits off-screen.
- The Hit panel's live block (`[data-ehit-live]`) is replaced whole on each keystroke (`hitLive`,
  `gm.js:3432`). A live region replaced whole isn't reliably announced, and Apply sits below it, so Apply moves
  as the preview grows.
- About ten smoke tests pin the row's health sentence exactly ("HP 18 / 30 · 12 taken · 4 of 6 Health
  Levels · …", `smoke-table-play.test.mjs:87`, `:343`, `:405`, `:421`, `:503`; `smoke-table-seat-fight`
  `:73`, `:86`). The order keeps that sentence's text unchanged (§9).
- "Add to <encounter>" is decided wording (Decisions 190, 211). Four test files match it.

**Carried over:** nothing. This is the plan's first order. The critique snapshot it answers is
`.impeccable/critique/2026-11-06T04-35-27Z__src-ui-gm-js.md`.

---

## 1. Goal and Done when

A GM running a fight sees at once whose turn it is, what each row has left, and the one or two presses each row
needs. A slip on the Hit panel is caught before it lands.

**Done when** (Dead Air seeded, *Achterberg's clinic, moonrise* running):

1. The acting row carries a **Now** badge. Pressing Next keeps focus on Next, scrolls the new actor into view
   below the bar, and announces "<label> acts" once. The status in the bar reads "Round 2 · <label>".
2. Every row with Health Levels shows its HP as a green Oxanium number over one thin segment per Health
   Level, the sheet's `hl-mini` (filled magenta, Massive hatched). A Down row's number is magenta and reads
   **Down**. The row's health sentence reads, as text, exactly what it reads on `main`.
3. A row's own buttons are **Hit** (primary) and **Heal**, then **More**. Everything else is under More: Take,
   Add a Condition, Delay, the name, Goes last, Out, Side, Remove. A row that can't take a Hit (no BOD) shows
   **Take** where Hit would be. A waiting row also shows **Act now** (UQ9).
4. A **Down** row shows Heal and More, and not Hit, unless it has the Dying Condition. While it's Dying, a hit
   is a Death Mark, so Hit stays.
5. Two rows both named "Reclaim cleaner" read "Reclaim cleaner A" and "Reclaim cleaner B" everywhere the
   encounter page draws a row: the rows, the Reset panel and the wrap-up. That label is never stored or
   written into a line.
6. On the Hit panel, Apply and Cancel sit under the fields and above the preview, so typing never moves them.
   The preview is announced as it changes. A hit of more than twice what the row can hold asks first: "That's
   99 against 12 HP. Apply it?" (copy for a voice pass).
7. At 375px, every control in the encounter bar is on screen. The bar wraps, and nothing scrolls sideways.
8. The plan form's four long labels become a short Mono Caps label with the worksheet's remaining words as a
   hint under it. The read-only plan uses the same short labels.
9. The Add to button names the encounter: "Add to encounter: Achterberg's clinic, moonrise" (UQ10).
10. The browser overlay (plan §3) shows no content finding on the Encounters page at 1024px or 375px,
    `npm run phone-check` passes, and the reviewer's re-critique scores H1, H5 and H8 above the baseline's 2.

## 2. Tier, versions, numbers

- **Rule or shape.** A player-facing behaviour someone could have chosen otherwise: what a row offers and when,
  and the ask before a big hit.
- **App:** a minor (0.62.0 → 0.63.0 at the pre-flight; the builder takes the next minor on `main`).
  **No** game data, character, table or pack schema bump: nothing stored changes.
- **Decision:** one, numbered **N**, the next free number on `main` when built (`CLAUDE.md`, *Decisions*).

## 3. The decision, drafted

```
N. **An encounter row reads like the sheet's Health readout: one row acts at a time, two buttons are its own, and a hit past twice what it holds asks first.**
     *2026-11-05 · Ken + Claude · Touches: encounter row, encRowHtml, encHealthHtml, enc-acts, More, Hit, Heal, Take, Add a Condition, Delay, Act now, Down, Dying, Now badge, enc-status, nextTurn, encounterView, health.hpPer, label, hl-mini, hlCells, Hit panel, Apply, preview, live region, encHitLiveHtml, enc-bar, scroll-row, plan labels, planField, encPlanReadHtml, Add to <encounter>, encAddText, Decision 188, Decision 190, Decision 191, Decision 211, Decision 253, Decision 258*
     - **Decided:** A row's HP is a health-coloured readout over one segment per Health Level (the sheet's `hl-mini`), with its health sentence unchanged as text. The acting row says **Now**, and Next announces it and keeps focus. A row's own buttons are Hit and Heal (Take where it can't be hit), and Act now while it waits; Take, Add a Condition, Delay and the rest are under More. A Down row offers no Hit unless it's Dying. Duplicate names get A, B, … on the page, by the order rows were added, never stored. The Hit panel's Apply sits above its preview, and a hit over twice the row's HP (or its Health Levels, for Massive) asks before it applies. The bar wraps rather than scrolling sideways; Add to reads "Add to encounter: <title>".
     - **Why:** the critique of 2026-11-05 found the fight the weakest readout in the app, and Ken ruled GM mode play-first. Ken's shape answers picked the segments, the two buttons and the Down rule.
     - **Rejected:**
       - Full Health Level boxes on every row: about three times taller, so seven rows no longer fit a laptop screen.
       - Keeping every button and re-weighting them: least change, least gain; six equal choices per row was the finding.
       - Blocking a big hit: a GM sometimes means it (UQ4).
       - Asking the GM to rename duplicates: work they didn't ask for mid-fight (UQ5).
       - Moving focus to the actor on Next: a keyboard GM presses Next again and again, and would lose it.
     - **Replaces:** Decision 211 in part (the button reads "Add to encounter: <title>"; where it goes stands) and Decision 190 in part (the same words).
     - **Revisit if:** a GM wants a button back on the row, a table runs fights too big for a row each, or the sheet's Health readout changes.
     - **Built:** app 0.63.0; PR #…; log 2026-11-…
```

`docs.test.mjs` checks the shape. The builder pastes this, fills *Built*, adds the INDEX §3 line under GM
mode's encounters, and marks 190 and 211 `→ **Superseded in part by Decision N**` with the clause, with their
INDEX lines to match.

## 4. Questions for Ken

The plan's UQ1–UQ8 have defaults; this order relies on UQ4 (ask, don't block) and UQ5 (A, B drawn, never
stored).

| Id | Question | Default |
|---|---|---|
| **UQ9** | A waiting row (it Delayed): does **Act now** stay on the row beside Hit and Heal? | Yes. It's the one press that row is waiting for. Delay itself goes under More |
| **UQ10** | Add to's words: "Add to encounter: <title>", or keep "Add to <title>"? | "Add to encounter: <title>". The title alone reads like a place ("Add to Achterberg's clinic") |
| **UQ11** | Next's announcement: "<label> acts", or the round too ("Round 2: <label> acts")? | "<label> acts". The round is already in the bar |
| **UQ12** | Apply above the preview: is that order right, or keep Apply last and let it move? | Above. The critique's slip came from Apply moving as the preview grew |

## 5. The assumption sweep

| What changes | True today, where | True after | Readers (by grep) |
|---|---|---|---|
| `encounterView` row `health` | `{ taken, total, left, pastZero, down, levels, levelsLeft, gone, pain }` (`engine.js:9934`, `:9943`) | adds `hpPer` (number or null): the stand-in's `hlState(stand).hpPer`; a PC row's `_pcHealth(r).hpPer` | `encHealthHtml`, `encWrapUp` (`engine.js:9563`), `endEncounter` lines (`:9544`), smoke tests. The new key is read only by the row; no writer |
| `encounterView` row `label` | none; drawn names are `name` | `label`: `name`, or `name` + " A"/" B"… when two or more rows' trimmed names match case-insensitively, lettered by `e.rows` order (when added, not turn order); past Z, 27, 28… | new: `encRowHtml`, the Reset panel (by `rowId`), the wrap-up rows, `encSideHtml`, aria-labels that name a row. **Not** `encounterWrapUp` lines, interactions, `tableActionLabel`, Find (they keep `name`) |
| `hlCells(ch)` | `sheet.js:222`, reads `Engine.hlState(ch)` | split: `hlCellsOf({ levels, hpPer, damage, massive })` does the work; `hlCells(ch)` calls it with `hlState(ch)`. Same output | `hlMiniHtml`, `hlTrackHtml` (sheet), the row (new). Sheet output must be byte-identical (§11) |
| Row actions | Delay, Act now, Take, Hit, Heal, Add a Condition, More (`gm.js:3064-3074`) | Hit (or Take), Heal, Act now (waiting), More holding Take, Add a Condition, Delay, then today's More | tests click `data-edmg`, `data-econdopen`, `data-edelay-open` (`smoke-table-play`, `-seat-fight`, `-encplan`, `hostile:633`). Selectors stay, only the place moves. **Twin:** `encSideHtml`'s More (`gm.js:3274`) is a side's, not a row's: unchanged |
| Down row | every action | Heal, More; Hit only with the Dying Condition | `v.health.down`; Dying is a Condition id in `v.conditions` (`dying`). Twin: the seat row (`v.seat`) reads the same `health.down` |
| Now badge, status | `aria-current="step"`, cyan left border (`shadows.css:1363`); status "Round N" (`gm.js:3360`) | plus a **Now** tag in the head; status "Round N · <label>" while a row acts | `enc-status` is read by `smoke-table-frame:96` (class only) |
| Next | focus stays on Next, `toActive()` scrolls (`gm.js:3414`) | the same, plus one polite announcement from a region that **persists across redraws** (outside `main`, or kept by `keepPlace`) | `notice()` is a toast, not this; check `aria-live` in `gm.js:498` (Find's count) for the pattern |
| Hit panel order | fields, then `[data-ehit-live]` = preview, prompts, Apply/Cancel (`gm.js:2989-2997`) | fields, Apply/Cancel, then the live block; the preview text sits in a node `hitLive` updates in place (not `outerHTML`) | `hitLive` (`gm.js:3432`), tests' `preview(app)` (reads `[data-ehit-preview]`), `data-ehit-apply` clicks |
| Big hit | applies | asks first (`askFirst`, `danger:false`) when damage > 2 × `health.total` (regular, withering), or HL gone > 2 × `levels`… see §8 | `data-ehit-apply`'s handler (`gm.js:3526`), which Enter in the damage or From field also calls (`gm.js:3650`): the ask sits in the handler, so both ask |
| `.enc-bar` | `.scroll-row` (`gm.js:3363`, `shadows.css:766`) | not a `.scroll-row`; wraps (it's already `flex-wrap:wrap`, `shadows.css:1359`) | `bindScrollRows` (Decision 165) finds `.scroll-row`: check the bar's `data-row="encbar"` isn't read elsewhere; `phone-check` names `.enc-bar` |
| Plan labels | four long worksheet labels (`gm.js:3306`, `:3318`, `:3321`; read view `:3335`, `:3339`, `:3340`) | short label + hint (§9) | `planField`; Find's field names for the plan (`tableSearch`: does a hit name the field by this label? grep `Terrain`), voice test |
| Add to words | `Add to ${title}` (`gm.js:2834`), aria `Add ${subject} to ${title}` (`:2835`) | `Add to encounter: ${title}`; aria `Add ${subject} to the encounter ${title}`; "Add to a new encounter" unchanged | `hostile`, `smoke-table-factions`, `-frame`, `-play` match "Add to "; **expected breaks**, update to the new words |

The three questions, answered by grep at the pre-flight:

- **Which guards read a value this changes?** `voice.test.mjs` reads every string in `gm.js` (the new copy must
  pass). `build.test.mjs`'s contrast guard reads tokens: the readout's colour must be a token (`--green`), not
  a hex.
- **Where does each new note or number render?** `hpPer` and `label` render only on the encounter page. The
  ask renders in the modal. The announcement renders in one live region.
- **What text points at what this changes?** `D.armorRules.enemyText` and the Hit panel's notes don't name
  Apply's place. Decision 258's text says "an encounter's status bar comes first, Back leads it, and it never
  lets go", and that still holds. The CHANGELOG's past lines are history, not readers.

## 6. Read first

- `CLAUDE.md`: constraints 5 (the engine never touches the DOM), 7 (store inputs) and 8 (the engine is
  total). *Change tiers*, *Decisions*.
- `DESIGN.md`: *Readouts (signature)*, *Colors* (green = health, magenta = harm, cyan = where you are), the
  Four Voices and Mono Caps rules, *Touch targets*.
- Decisions 188, 191, 192 (the hit and its prompts), 211, 253 (Delay, Act now), 257 (seat rows), 258 (the
  frame and the bar), 165 (`scroll-row`), 164 (`keepPlace`).
- `src/ui/gm.js`:
  - `encRowHtml`, `encHealthHtml`, `encHitHtml` and `encHitLiveHtml`;
  - `bindEncounters`, with its `next`, `hitLive` and `data-ehit-apply` handlers;
  - `encPageHtml`, `encPlanEditHtml`, `encPlanReadHtml`, `encAddText` and `encResetHtml`;
  - `encWrapRowHtml` and `encSideHtml`.
- `src/ui/sheet.js`: `hlCells`, `hlMiniHtml`, `hlTrackHtml`.
- `src/engine/engine.js`: `encounterView`, `_pcHealth`, `hlState`.
- `.impeccable/critique/2026-11-06T04-35-27Z__src-ui-gm-js.md`: the priority issue this order answers.
- Impeccable's `craft-floor.md`, read before the first UI edit (plan §3).

## 7. Out of scope

- **The Tonight strip** and anything outside the Encounters tab (U2).
- **Activity labels' values** ("Hit Reclaim drone A"?) (U4, #32). A label here is drawn, not written, so
  activity entries keep the stored name.
- Restyling the sheet's own Health readout. `hlCells` is split, not changed.
- A side's More in Wave Initiative (`encSideHtml`), which belongs to a side, not a row.
- Dying's own Reset prompts, the wrap-up's sentences, and what End writes (Decision 193).
- New keys (U5). Next stays a button.
- Any stored field or schema bump. If one turns out to be needed, that's a stop (§13).

## 8. The shapes

**Engine (reader additions only, total):**

- `encounterView(t, encId, packs).rows[i].health.hpPer`: a positive number, or `null` when the row has no
  whole Health Levels (no BOD, or a PC row whose HP doesn't divide by its levels). Never throws, and never
  `NaN`.
- `encounterView(…).rows[i].label`: a string, never empty ("Unnamed" + letter at worst). The letters come
  from the rows' order in `e.rows`. Rows that are `gone` (a removed cast member) still count, so a letter
  never shifts mid-fight when one is struck through.
- `Engine.encounterView` on a hostile table (a row with `damage: "x"`, `hp: -3`, a 10,000-character name)
  returns a view, with `hpPer` `null` or a positive number and a string `label`.

**The big-hit rule** (UI, from the view's numbers, computed at Apply):

- Regular or Withering, on a row with `health.total` > 0: ask when the damage entered is more than
  `2 × health.total`.
- Massive (Health Levels gone), on a row with `health.levels` > 0: ask when the amount is more than
  `2 × health.levels`.
- An unclaimed PC row's "Got through" counts as damage. A row with no total never asks.
- The ask is `askFirst({ title:"Apply this hit?", text:"That's <n> against <total> HP.", yes:"Apply it",
  danger:false })` (copy for a voice pass). **Cancel returns focus to the damage field**, with the value kept.
  **Apply it** applies exactly as Apply does today.

**UI helper:** `hlCellsOf({ levels, hpPer, damage, massive })` → the same cells `hlCells` returns. It lives
where both `sheet.js` and `gm.js` can call it: `shared.js`, or `sheet.js`, which loads before `gm.js`
(Decision 172). Builder's choice, noted in the PR.

## 9. The UI

**Ken's shape answers (2026-11-05):** Health Levels as **mini segments**. **Hit and Heal** stay on the row and
the rest goes under More, with Take standing in where a row can't be hit. A **Down** row shows **Heal and its
Conditions**, with Hit kept only while it's Dying.

**A row, top to bottom** (behaviour, not markup):

1. **The head:** label, its kind tag (PC, Cast, Codex ref), **Now** when acting, then today's tags (Out,
   Done, opening, Goes last, Tied) and the Combat Sense field. **Now** is a Mono Caps tag in cyan (cyan is
   "where you are"); `aria-current="step"` stays.
2. **The readout:** HP as Oxanium at readout weight, coloured by what it is: `--green` while up, the magenta
   read token with the word **Down** while down. Beside it, `hl-mini` segments, `aria-hidden`.
   - **The sentence below is unchanged as text.** "HP 39 / 50 · 11 taken · 8 of 10 Health Levels · <Pain>".
     The readout can re-set the "HP 39 / 50" part visually, but `textContent` of `.enc-health` reads what it
     reads on `main`, so a screen reader and the tests get the same words.
   - A row with no Health Levels shows no segments. A row with no total shows the sentence alone, as today.
3. **Armor, the seat line, traits and Conditions:** as today. Conditions stay visible on every row, Down
   included.
4. **Actions:**
   - **Up:** `Hit` (primary) and `Heal`, then `More ▾`.
   - **No BOD:** `Take` in Hit's place.
   - **Waiting:** `Act now` before Hit (UQ9).
   - **Down, not Dying:** `Heal` and `More ▾`.
   - **Down and Dying:** `Hit`, `Heal`, `More ▾`.
   - **More holds, in this order:** Take (when it isn't on the row), Add a Condition, Delay (the acting row
     only), then today's More: the name, Goes last / Out, Side and Remove.
   - **A press inside More leaves More open after the redraw** (`S.encMore` already persists it), and focus
     returns to the control pressed, as today.

**The bar:** Back, then the status ("Round 2 · Reclaim drone A", or "Planned", "Ended · 3 rounds"), then Start,
Next and End. It's no longer a sideways scroller. At ≤ 640px it wraps to two lines, with Back and the status on
the first. It still sticks and never lets go (258). Every button keeps 44px on a touchscreen.

**Next:** focus stays on Next. The new actor scrolls into view below the bar, which `toActive` already does
with `scroll-margin`. One polite announcement says "<label> acts" (UQ11), from a region that is the same node
before and after the redraw.

**The Hit panel:** the fields, then **Apply · Cancel**, then the preview line and the prompts. The preview's
text node updates in place, inside a polite live region, so it's announced without stealing focus. The
prompts (Shock, At Zero, the Conditions it can cause) can still come and go below. Apply never moves, because
it's above them.

**Duplicate labels** draw on: the row's name, the Reset panel's row names (map `rowId` → `label`), the
wrap-up's row heading, the side lists in Wave Initiative, and every aria-label that names a row. Never in
what's stored or written.

**The plan's labels** (the worksheet's words stay, split into a label and a hint):

| Today | Label (Mono Caps) | Hint under it (Inter, dim) |
|---|---|---|
| Terrain (cover, elevation, visibility) | Terrain | Cover, elevation, visibility |
| New threads, clues, NPC attitudes | New threads | Clues, NPC attitudes |
| Links to character goals / Milestones | Character goals | Links to goals and Milestones |
| Quick pivot if encounter goes off-script | Quick pivot | If the encounter goes off-script |

The hint is the field's description (`aria-describedby`), not its placeholder. The read-only plan shows the
label in bold before the text, as today, with no hint.

**Copy for the voice pass** (the builder pastes each one in the PR as it renders):

- "Now"
- "<label> acts"
- "Round 2 · <label>"
- "Apply this hit?" / "That's 99 against 12 HP." / "Apply it"
- "Add to encounter: <title>" / "Add <subject> to the encounter <title>"
- The four labels and their hints.

## 10. Worked examples, as named tests

The builder writes these first and shows each failing on `main`, or says why one already passes.

| Test | File | Pins |
|---|---|---|
| `U1: a row's HP is a readout over its Health Levels, and its sentence is unchanged` | `smoke-table-play.test.mjs` | Wren at 12 taken of 30 / 6 levels: `.enc-health` text is "HP 18 / 30 · 12 taken · 4 of 6 Health Levels · <pain>"; 6 segments, 2 filled; the HP number has the readout class |
| `U1: the acting row says Now, and Next keeps focus and announces the next` | `smoke-table-play.test.mjs` | one `Now` tag, on `aria-current="step"`; after Next, `activeElement` is Next; the live region's text is "<label> acts"; the same region node before and after |
| `U1: a row's own buttons are Hit and Heal; the rest are under More` | `smoke-table-play.test.mjs` | outside `[data-emore]`: `data-ehit` and `data-edmg="…|-1"` only; inside it: Take, Add a Condition |
| `U1: a row that can't be hit shows Take` | `smoke-table-play.test.mjs` | a cast row whose member has no BOD (no stand-in, so `canHit` is false): `data-edmg="…|1"` outside More, no `data-ehit` |
| `U1: a Down row offers Heal, and Hit only while Dying` | `smoke-table-play.test.mjs` | Down: no `data-ehit`; add Dying: `data-ehit` back |
| `U1: two rows with one name read A and B, and nothing stores it` | `engine.test.mjs` + `smoke-table-play.test.mjs` | `encounterView` labels "Reclaim cleaner A", "… B" by `e.rows` order; reordering Combat Sense keeps them; the table JSON has no "Reclaim cleaner A" |
| `U1: a hit past twice the row's HP asks first; Cancel keeps the number` | `smoke-table-play.test.mjs` | 99 against a 12 HP row: a modal; Cancel: damage field focused, value "99", damage unchanged; again with Apply it: applied |
| `U1: Apply sits above the preview and the preview updates in place` | `smoke-table-play.test.mjs` | Apply precedes `[data-ehit-preview]` in document order; typing changes the preview node's text, not the node |
| `U1: the encounter bar wraps and scrolls nothing sideways at phone width` | `smoke-table-frame.test.mjs` (`boot({ width:375 })`) | the bar isn't `.scroll-row`; plus `phone-check`'s real-Chromium metric (§11) |
| `U1: the plan's long labels are a label and a hint` | `smoke-table-encplan.test.mjs` | "Terrain" label, "Cover, elevation, visibility" hint by `aria-describedby`; read view shows "Terrain" |
| `U1: Add to names the encounter` | `smoke-table-factions.test.mjs` | "Add to encounter: <title>", "Add to a new encounter" |

## 11. Tests beyond the examples

- **The sheet doesn't move.** `hlMiniHtml` and `hlTrackHtml` produce byte-identical markup before and after the
  split, over every fixture character in `smokekit.mjs`. Diff it; don't pin it (`WORK-ORDERS.md`, *Prove
  "nothing else moves" by a diff*).
- **Totality:** `encounterView` over `hostile.test.mjs`'s hostile table gives `hpPer` null or a positive number
  and a string `label`. Add a hostile row with a 10,000-character duplicate name.
- **Voice:** every new string passes `voice.test.mjs`.
- **Contrast:** the readout's colours are tokens (`--green`, `--magenta-text`), checked by `build.test.mjs`.
- **Mutation-test:**
  - the Down rule (drop the Dying exception and the Dying test must fail);
  - the 2× threshold (make it 1× and the 99/12 test still asks, but a 20/12 case that shouldn't ask must
    fail, so add that case);
  - the label's order source (letter by turn order and the reorder test must fail).
- **`npm run phone-check`** passes. Add `.enc-bar`'s children to what it measures at 375px, if it doesn't
  already.
- **Expected breaks, updated, not stops:** the "Add to " tests (the new words), and any test that asserts Take
  or Add a Condition is outside More or in a fixed button order. Each is listed in the PR with its old and new
  assertion.

## 12. Steps

1. `git submodule update --init private`, then `npm run test:fast` (a fresh branch from `main`).
2. Write §10's tests and show them failing on `main`.
3. Engine: `hpPer` and `label` in `encounterView`, with the totality tests. Then `npm run verify`.
4. Split `hlCells` into `hlCellsOf` and diff the sheet's output (§11). Then `npm run verify`.
5. Read `craft-floor.md`. Run **`/impeccable typeset`** and **`/impeccable colorize`** on the row (the readout,
   Now, Down). Build the row's readout, actions, More, the Down rule and labels. Then `npm run verify`, and
   check it in the dev preview.
6. **`/impeccable harden`** on the Hit panel: Apply's place, the live preview, and the big-hit ask. Then
   `npm run verify`, and check it in the dev preview.
7. **`/impeccable adapt`** on the bar at 375px, then the plan labels and Add to's words. Then
   `npm run verify` and `npm run phone-check`.
8. The plan §3 gate: inject the browser overlay on Encounters (list, running and ended) at 1024px and 375px.
   Fix each content finding, or name it as a false positive in the PR.
9. **`/impeccable polish`** on the Encounters page, reading the critique snapshot's priority issues.
10. Close-out (§14).

## 13. Stop and ask

**Stop** (to the conductor) if:

- a stored field turns out to be needed (a schema bump isn't in this order);
- the sheet's `hlMiniHtml` or `hlTrackHtml` output changes at all;
- a Decision outside 190 and 211 needs a supersession mark;
- the live announcement can't persist across `renderTable()` without restructuring how the table redraws;
- the overlay finds something outside the Encounters tab that this order's changes caused.

**Not stops** (expected, and updated in place):

- the "Add to " test assertions;
- tests that assumed Take or Add a Condition sat outside More;
- the version literals the bump moves.

## 14. Close-out

- **The tier's items** (`close-the-session`):
  - the decision and its INDEX line, plus the supersession marks on 190 and 211;
  - `CHANGELOG.md` lines in player voice, then `npm run changelog`;
  - `npm run bump -- 0.63.0` (or the next minor);
  - a log entry in `docs/log/2026.md`;
  - STATE rewritten where §3's GM-mode row and §5 name U1;
  - the plan's §4 row marked built;
  - a row in `docs/log/shipped.md`.
- **The changelog** (draft, for a voice pass):
  - "In a fight, the one acting says Now, and each row shows its HP over its Health Levels at a glance."
  - "Each row keeps Hit and Heal to hand; the rest is under More. A row that's down offers Heal."
  - "Two of the same enemy read A and B."
  - "A hit far bigger than its target asks before it lands."
- **The PR:** title `U1: the encounter as an instrument (gm-at-the-table; Decision N)`, using the template's
  sections. *Where the order didn't fit* is required, and "Nothing" is an acceptable answer.
- **The re-critique** (plan §3.6): the reviewer runs `/impeccable critique` on GM mode with Dead Air seeded,
  commits the snapshot, and puts the heuristic table beside the baseline's in the review.

**Review checklist** (beyond the tests passing):

- [ ] Run it in the dev preview with Dead Air seeded, at 1024px and 375px. Use the mouse *and* the keyboard
      only: Next three times, a Hit with Shock, a Down row, then the Dying row.
- [ ] `.enc-health`'s text is byte-identical to `main`'s for every row in Dead Air's running encounter.
- [ ] The sheet's Health readout is unchanged (the diff in §11).
- [ ] No duplicate's letter reaches storage, the activity log or a written line (grep the exported table).
- [ ] The announcement is one node that persists, and it says each actor once per Next.
- [ ] Apply doesn't move while typing a damage that brings in Shock, then At Zero.
- [ ] The big-hit ask: Cancel keeps the value and focus. No ask at 2× exactly. No ask on a row with no total.
- [ ] The overlay is clean on Encounters, or each finding is named.
- [ ] The re-critique is in the review, and H1, H5 and H8 are each above 2, or the review says why not.
- [ ] Every new string is in the PR for the voice pass.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md`, with this order's path `docs/plans/gm-at-the-table/U1-encounter-instrument.md`.
This order's traps:

- **The health sentence is pinned by about ten tests.** Restyle it, but don't reword it. Keep its
  `textContent` identical.
- **`hitLive` replaces `[data-ehit-live]` whole.** The live region has to sit outside what it replaces, or the
  preview has to be updated in place. Otherwise nothing is announced, and the Apply button is recreated under
  the pointer.
- **A closed `<details>` hides its controls from focus in a real browser, but not in jsdom.** A test that
  clicks Take without opening More passes in jsdom and lies about a browser. Open More in the tests.
- **Letters come from `e.rows`, not turn order.** `encounterView` iterates `ord.rows`, the turn order, so it
  has to look up each row's position in `e.rows`.
- **`.scroll-row` carries `bindScrollRows`' wheel handler and edge fades** (Decision 165). Removing the class
  from the bar removes both, and that's intended. Check nothing else selects `[data-row="encbar"]`.
- **Seat rows (Decision 257) read `health` from the copy.** The Down rule and the readout use the view's
  `health`, so they apply to a seat row unchanged. Test one.
- **The overlay's chrome findings are known false positives** (the header's brand violet and cyan, Inter). Only
  the Encounters content counts.
