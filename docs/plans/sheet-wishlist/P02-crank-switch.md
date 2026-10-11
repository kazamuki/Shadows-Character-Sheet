# Work order P2 — CRANK behind a switch

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W101**
(`WISHLIST.md`); Decisions 165, 169, 173; `reference/rulings-2026-10-10.md` Q30.
**Status:** **drafted 2026-10-11 by Claude (Opus)**, pre-flighted against
`main` at `510e420` (#158, P1, merged). Waiting on Ken: PQ1–PQ4.
**Branch:** from `main`; PR to `main`. The switch ships **off**: that's the point.
**Runs alone.** It touches `shared.js` (`FEATURES`), `sheet.js` (five
places), the tests and the docs. No engine change, no data change, nothing
in `private/`.

**What P2 is.** CRANK shipped in 0.37.0 (Decision 169): rep on Main, on
Trackers with its ledger, in Admin, in a tip, and on the print sheet's front
page. Deighton doesn't know it and wants the team to talk it through before
anything changes (Q30: *"We can reactivate it for the sheet if we decide to
keep it"*). Ken's call (W101): hide it the way GM mode is hidden, and keep
the work. A character's rep and ledger stay in its file and come back when
the switch is on.

---

## 1. Goal

When P2 is merged:

1. With the switch off (the default), a player sees no CRANK anywhere on the
   sheet: not on Main, Trackers, Admin, the print view or the blank sheet.
2. `?crank=on` in a browser brings every one of those places back exactly as
   0.39.0 shows them, and `?crank=off` hides them again.
3. A character's `trackers.crank` (rep and ledger) is untouched by the switch:
   it loads, saves, exports and imports the same whether the switch is on or off.
4. Main's cards still tile cleanly: whichever card is left alone on the last
   row takes the whole row, with or without SFR, with or without CRANK.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** Withdrawing a released feature is a player-facing
  choice someone could have made otherwise (W101), and it extends 173 and
  amends 169. One numbered decision.
- **Decision number:** the lowest free number in `SCHEMA.md` §4 on
  `origin/main` when you build. Today that's **214**, but S16's order
  (`gm-mode/S16-interaction-sentence.md`, and its row in `gm-mode/README.md`)
  reserves 214. If S16 hasn't merged by then, take 214 and move S16's
  reservation to **215** in this PR: every `214` in that order refers to the
  decision, so it's a plain replace. P1 did the same thing (#158). The ledger
  test refuses a gap, so P2 can't take 215 while 214 is still empty. If S16
  has merged, take the next free number and leave S16 alone. The draft below
  says 214.
- **App:** a patch bump (`npm run bump -- X.Y.Z`; the current number is in
  `docs/STATE.md`). A player sees CRANK go.
- **Game data:** **no bump.** The data doesn't change, and no computed value or
  available choice moves (Decision 68): CRANK's tiers are still read when the
  switch is on.
- **Character schema:** **no bump.** Nothing new is stored, and nothing is removed.
- **CHANGELOG:** one line under `[Unreleased]`, player voice (§12).

## 3. The decision, drafted

```
214. **CRANK sits behind a switch, off, until the team decides whether it stays: a character keeps its rep and ledger, and `?crank=on` shows them.**
     *2026-10-1x · Ken + Claude · Touches: CRANK, FEATURES, featureOn, ?crank=on, ?crank=off, shadows.feature.crank, Main CRANK card, alone card, Trackers CRANK section, Admin CRANK rep, print front page, blank sheet, crank tip, launch line, W101, GQ7, F37, GQ28*
     - **Decided:** `FEATURES` gains `crank: false`. Switched off, the sheet shows no CRANK: Main's card and its popover, Trackers' section and ledger, Admin's correction, and the print front page's field (the blank sheet too). `trackers.crank` is still migrated, saved and exported, untouched. On Main, whichever card is left alone on the last row takes the whole row. GM mode's CRANK is unchanged (PQ1). Turning it on for everyone is a release that adds the line **CRANK is back.**
     - **Why:** Deighton wants the team to talk CRANK through before anything changes (rulings Q30), and Ken chose to hide it, as GM mode is hidden, rather than remove it (W101). The switch already exists (173), and the work and players' rep survive either answer.
     - **Rejected:** removing CRANK's code (the team may keep it, and Q30 says so); leaving it visible until the talk (Deighton asked to pause it); hiding it only for characters with no rep (PQ2: two players' sheets would differ for one rule); hiding GM mode's off-screen-job tier (PQ1: that changes how off-screen pay is set, which is the team's question); scrubbing old CRANK lines from the Activity Log (PQ3: history stays as it happened).
     - **Replaces:** Decision 169 in part (CRANK shows only with the switch on; the card alone on its row is whichever is left over, not CRANK by name). Decision 173 in part (`FEATURES` holds a second switch, for a released feature withdrawn; its *Revisit if*, "a second unfinished feature needs hiding", has happened).
     - **Revisit if:** the team decides CRANK (keep it: the **CRANK is back** release; drop it: a decision to remove the code and keep `trackers.crank` read-only in `migrate()`), or GQ7, F37 or GQ28 is answered.
     - **Built:** app X.Y.Z, no data or schema bump, PR #…, log 2026-10-1x.
```

Marks: 169 gets *→ **Superseded in part by Decision 214**: CRANK shows only
with the switch on, and the card alone on Main's last row is whichever is left
over.* 173 gets *→ **Superseded in part by Decision 214**: `FEATURES` holds
`crank` too, a released feature withdrawn.* Their INDEX lines get
*→ **superseded in part by 214***. The new INDEX §3 line goes beside 173:
`- **214** *(CRANK behind a switch — sheet-wishlist P2, W101)* — FEATURES.crank
false: no CRANK on the sheet, print or blank sheet; rep and ledger kept in the
file; ?crank=on shows it; GM mode's CRANK unchanged.`

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| PQ1 | GM mode uses CRANK twice: the close-out's off-screen job needs a CRANK tier to set its pay range (206), and the Reference tab has a CRANK panel (207). Hide them too? | **No, leave GM mode as it is.** GM mode is itself switched off, so only Ken and Scott see it, and off-screen pay *is* the CRANK tier in the book (`2000`). Hiding the tier means inventing a new pay rule, which is the team's question. W101 lists the off-screen job, so this is a change from the wish: say if you want the Reference panel hidden anyway (cheap: one `featureOn` check). |
| PQ2 | Hide CRANK for every character, or keep it showing on characters that already have rep or a ledger line? | **Every character.** One rule for every sheet, and Deighton asked to pause CRANK, not to grandfather it. The rep is safe in the file either way. |
| PQ3 | The Activity Log keeps entries like *CRANK rep +1 (the Halvorsen job)*, and What's new still has 0.37.0's CRANK line. Hide those? | **No.** They're history, and hiding them would rewrite what happened. Undo on an old CRANK entry still works with the switch off, because undo is a structural diff. |
| PQ4 | What's the line that turns it back on for everyone? | `- **CRANK is back.**` The build guard (§9, test 1) refuses `crank: true` without it, as it refuses `gm: true` without **Run a table.** |

## 5. Read first

- `CLAUDE.md`, then `docs/STATE.md`. Decisions **169** (CRANK), **173** (the
  switch), **165** (the card alone on its row), **124** (a file is untrusted;
  nothing changes there, but know why `migrate()` keeps `trackers.crank`).
- `src/ui/shared.js` lines 81–100: `FEATURES`, `featureOn`, `applyFeatureQuery`.
  The CRANK tip (`crank:` around line 536) stays as it is: once its
  `data-tip` spans are hidden, nothing can reach it.
- `src/ui/sheet.js`:
  - Main's cards, around 336–345: `hasSfr`, `crk`, the `cred` and `crank` cards.
  - `crankControlsHtml` and `crankSubHtml` (around 1037), and `vitalPopover`'s
    `crank` branch (around 1065).
  - Trackers' CRANK section and ledger (around 1172–1183).
  - Admin's CRANK rep row (around 2125).
  - The print front page's field row (around 2359).
  - The handlers `[data-crk]` (around 2758) and `[data-admin-crank]` (around
    3347). These need no change: with nothing rendered, nothing binds.
- `src/styles/shadows.css` around 1147: `.cond.alone`.
- `tests/build.test.mjs` around 335 (the `FEATURES.gm` guard), and
  `tests/smoke.test.mjs`: the `GM_ON` storage (around 3218), `openSheet` (518),
  and the CRANK tests (around 2758 and 3141–3215).
- `tools/build.mjs` around 74: the blank sheet is `renderPrintView(null)` in
  jsdom with empty storage, so it follows the constant.

## 6. Out of scope

- **GM mode** (PQ1's default): `gm.js`'s off-screen job, `crankTiers`, and the
  Reference's `crank` panel stay as they are.
- **The engine and the data.** `crankState`, `addCrankRep`, `crankPayText`,
  `resources.crank` and `migrate()`'s `trackers.crank` steps are unchanged. The
  engine never reads `FEATURES` (constraint 5: the switch is a UI fact).
- **History** (PQ3): the Activity Log's labels, What's new, CHANGELOG's 0.37.0
  section.
- **GQ7, F37, GQ28.** They stay open, waiting on the same talk.

## 7. The shape

### 7a. The switch

`shared.js`: `const FEATURES = { gm:false, crank:false };`, with the comment
above it saying a switch is either an unfinished feature (`gm`) or a released
one withdrawn until a decision (`crank`), per Decision 214.
`applyFeatureQuery` already loops over `FEATURES`' keys, so `?crank=on` and
`?crank=off` work with no other change. Check that in a test anyway (§9, test 3).

One helper beside `featureOn`, used by every site below, so the sites read the
same and a later removal finds them all:

```js
// Decision 214: CRANK is shown only with its switch on.
const crankOn = () => featureOn("crank");
```

### 7b. What hides, site by site

Each is a guard around existing markup. Nothing is moved or rewritten.

1. **Main's cards.** Skip the CRANK card when `!crankOn()`. Then work out
   `alone` from what's actually there, not by name. The cards after Luck are
   `[SFR if any, Çredits, CRANK if on]`. If that count is odd, the **last**
   one gets `alone`. That gives:

   | SFR | CRANK | Cards after Luck | `alone` on |
   |---|---|---|---|
   | no | on | Çredits, CRANK | none |
   | yes | on | SFR, Çredits, CRANK | CRANK (as today) |
   | no | off | Çredits | **Çredits** |
   | yes | off | SFR, Çredits | none |

   Rewrite the two comments above the cards to say this, citing 214.
2. **The popover.** `vitalPopover(ch, "crank")` returns `null` when
   `!crankOn()` (a popover left open from before the switch was turned off
   then just closes). It's belt and braces, because the card is gone.
3. **Trackers.** The CRANK section (its `.sect`, its `.trk` row and its
   ledger `<details>`) renders only when `crankOn()`.
4. **Admin.** The *CRANK rep* `.trk` row renders only when `crankOn()`.
5. **The print front page.** The third field row loses `pField("CRANK", …)`
   when `!crankOn()`, which leaves IP Available and IP Spent. Check in the
   print preview that two fields sit on that row without stretching oddly.
   If they do, say so in the PR and leave it: 169 placed CRANK there because
   the row had room, and the row was fine with two before 169.
   The blank sheet follows, because the build renders it with empty storage.

### 7c. What doesn't change

- `trackers.crank` in the character: `newCharacter()`, `migrate()`, save,
  export and import all keep it, whatever the switch says.
- A Werewolf, Vampire or any other archetype: CRANK is on every character, so
  nothing is archetype-specific here.
- The `crank` tip in `shared.js`'s tips, and `D.resources.crank`: still read
  with the switch on, and Decision 135's key guard
  (`engine.test.mjs`, around 358) reads the source, so it stays green.

## 8. The UI

Nothing new to draw. With the switch off, Main's card grid at phone, tablet
and desktop width must have no gap where CRANK was, and the Çredits card,
alone, spans its row in two columns. `npm run phone-check` must pass. With the
switch on, every screen matches 0.39.0.

## 9. Tests

Each new guard is **mutation-tested** (§10, step 6): it must fail on the code
it guards against.

**`tests/build.test.mjs`**:

1. Generalise the `FEATURES.gm` guard into one test over a table of launch
   lines: `gm` needs `- **Run a table.**`, `crank` needs `- **CRANK is back.**`
   (PQ4). Each switch set `true` without its line fails. Keep the test's name
   saying Decision 173, and add 214.
2. `FEATURES.crank` exists. (The generalised test should fail if `crank` is
   dropped from the object, so a later session can't remove the switch by
   accident and turn CRANK back on.)

**`tests/smoke.test.mjs`**. Add `const CRANK_ON = { "shadows.feature.crank": "on" }`
beside `GM_ON`. `openSheet` passes `opts` to `boot` **after** its own
`storage`, so today `opts.storage` would replace the active character rather
than add to it. Change it to merge: `storage: { "shadows.active.v1": { ch,
section }, ...(opts.storage||{}) }`. That's a test helper, not an app path.

3. **The existing CRANK tests run with the switch on.** Every test from
   around 2758 (W45's alone card) and 3141–3215 that expects CRANK boots with
   `CRANK_ON`. Don't delete or weaken one. They're the proof that `?crank=on`
   brings back 0.39.0 exactly. Also add one test that `?crank=on` sets the key
   and `?crank=off` removes it, as GM mode's does (`smoke.test.mjs` around 3265).
4. **Switched off (the default):** a locked character with rep 3 and two
   ledger lines.
   - Main: no `.cond.crank`, and `#main`'s text has no "CRANK".
   - Trackers: no "CRANK" in `#main`.
   - Admin: no `[data-admin-crank]`.
   - Print view: no "CRANK".
   - `vitalPopover(ch, "crank")` is null (through `app.window.eval`).
5. **Off, the rep survives:** export that character, import the file in a
   fresh boot, and its `trackers.crank` is `{ rep: 3, ledger: [ …two… ] }`.
   Then turn the switch on in the same storage, open it, and Trackers reads
   rep 3 with both ledger lines.
6. **The alone card, all four rows of §7b's table:** the class `alone` is on
   the card the table says, and on no other (a Vampire or anything with SFR
   for the SFR rows).
7. **The blank sheet:** `buildBlankSheetHtml()` (from `tools/build.mjs`) has no
   "CRANK". This can live in `build.test.mjs` if that's where blank-sheet
   tests sit.

**`tests/engine.test.mjs`:** nothing new. The engine's CRANK tests keep
passing unchanged, which is the point.

## 10. Steps

1. Branch from `main`. `npm ci`, `git submodule update --init private`, then
   `npm run verify` (note the count).
2. Check the decision number (§2) and, if needed, move S16's reservation.
3. §7a, then test 1–2 and the query half of test 3. `npm run test:fast`.
4. §7b, sites 1–5. Switch the existing CRANK smoke tests to `CRANK_ON` (test 3)
   **before** running the suite, so a failure means a real change, not a
   missing switch.
5. Tests 4–7. `npm run verify`, `npm run phone-check`.
6. **Mutation-test:** set `crank:true` with no launch line (test 1 fails);
   drop `crank` from `FEATURES` (test 2 fails); leave the Trackers section
   unguarded (test 4 fails); put `alone` back on CRANK by name (test 6 fails
   on the no-SFR, off row). Record each in the PR.
7. Open the sheet with `shadows-dev-preview`: Main switched off (Çredits
   alone), then `?crank=on` (CRANK back), at phone width and desktop.
   Screenshots for the PR.
8. Close out (§12).

## 11. Stop and ask

- If the decision number in §2 is taken in a way the order doesn't cover,
  don't renumber anyone else's beyond S16's reservation.
- If any test outside the CRANK ones fails with the switch off (a test that
  counts Main's cards, say), stop and say which. It may be checking a layout
  this order changes.
- If the voice test or any other guard reads the rendered page with the
  switch off and loses `resources.crank`, stop. Don't add a fake reader.
  (Decision 135's key guard reads the source, so it shouldn't.)

## 12. Close-out

Use the **close-the-session** skill. For this session that means:

- **CHANGELOG** under `[Unreleased]`, player voice, then `npm run changelog`:
  - "**CRANK steps off the sheet.** Your rep and its ledger stay in your
    character file, untouched."
- `npm run bump -- X.Y.Z` (patch). No `gamedataVersion` bump, no schema bump.
- **Decision 214** (or the number §2 gives) in `SCHEMA.md` §4, the marks on
  169 and 173, and the INDEX §3 lines (§3 above).
- **W101** moves whole to `log/wishes-granted.md`, its heading pointing at the
  decision, and out of `WISHLIST.md`.
- **STATE**: §5's *Where to start* (P2 built; P3 next), and the line that says
  CRANK waits on a team talk now says it's switched off meanwhile. A
  `log/2026.md` entry, a row on `log/shipped.md`.
- **`sheet-wishlist.md`** §3: P2's status becomes *built, PR #…*.
- **The release (WQ2):** P1 and P2 were planned to reach players together. Say
  in the PR that the merged pair is ready for a release.

## 13. Review checklist

For the orchestrator, against the PR:

- [ ] Off: no "CRANK" on Main, Trackers, Admin, the print view or the blank
      sheet; the popover returns null.
- [ ] On (`?crank=on`): every existing CRANK test passes unchanged, apart from
      booting with `CRANK_ON`.
- [ ] `trackers.crank` survives export and import with the switch off, and
      shows again when it's turned on.
- [ ] `alone` lands where §7b's table says, in all four rows; phone-check passes.
- [ ] No change to `engine.js`, `shadows-data.js` or `gm.js`.
- [ ] The build guard refuses `crank:true` without **CRANK is back.**, and the
      mutation tests are in the PR.
- [ ] Decision number per §2; 169 and 173 marked; S16's order moved if needed.
- [ ] Versions: app patch only. CHANGELOG has the line, and `npm run changelog`
      was run.
- [ ] Run it in a browser: off and on, phone and desktop.
