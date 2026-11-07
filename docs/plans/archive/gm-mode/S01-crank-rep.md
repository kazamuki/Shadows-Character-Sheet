# Work order S1 — CRANK reputation on the sheet

**Plan:** [`../gm-mode.md`](../gm-mode.md) §5 item 1 and §6 *S1*.
**Status:** drafted 2026-10-02 by Claude (Opus), **approved by Ken 2026-10-02**,
§4 answered. Ready to build.
**Branch:** from `main`, PR to `main`. S1 is independent of the rest of GM
mode and ships on its own (GQ14's default).
**Runs alone.** It touches `engine.js`, `shadows-data.js`, `sheet.js`, the
ledger and the versions, so nothing else from the GM plan runs beside it.

---

## 1. Goal

A player's sheet tracks their **CRANK reputation**: their standing on NYTE
City's gray-market job board. It's a number that climbs +1 for every job
finished and drops −2 for a job walked out on, read as one of five tiers,
Novice to Legendary, each with the pay its jobs offer. It sits beside Çredits
on Main, has its own section and ledger on Trackers, prints on the front
page, and is undoable like everything else.

**Done when:**

- A new character has rep 0, reads **Novice**, and shows "5 to Competent".
- On Main, the CRANK card opens a popover with **Job done (+1)** and **Walked
  out (−2)**; each takes an optional note, writes a ledger line, and Undo
  takes it back.
- Trackers has a CRANK section: rep, tier, the next tier, the same two
  controls, and the ledger, newest first.
- A tip on the CRANK label shows the five tiers with their rep and pay, and
  what CRANK is.
- The printed front page shows CRANK, filled and blank, and is still one page.
- An old character file (schema 0.16) loads with rep 0; a hostile one with
  `"rep": "lots"` loads with rep 0 and renders as text everywhere.
- `npm run verify` and `npm run phone-check` pass.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (a save-file shape, a data shape, a player-facing
  behaviour someone could have chosen otherwise).
- **App** `0.36.1` → `0.37.0` (a new capability): `npm run bump -- 0.37.0`.
- **Game data** `0.28` → `0.29`: a character can observe the new tiers.
- **Character schema** `0.16` → `0.17`: `trackers.crank` is new, with a
  `migrate()` step in the same commit.
- **Ruleset:** unchanged.
- **Reserved:** Decision **169**, flag **F37**. If either number is taken on
  `main` when the build starts, stop and ask (§11).

## 3. The decision, drafted

Paste into `docs/SCHEMA.md` §4 after 168, filling **Built** at the end. Its
INDEX §3 line goes under the topic that holds the Çredits decisions (find
where 135's `credits.symbol` or the trackers decisions sit, and put it there).

```
169. **CRANK reputation is a resource on the character: +1 a job done, −2 a job walked out on, read as five tiers from the data.**
     *2026-10-0X · Ken + Claude · Touches: CRANK, crank rep, trackers.crank, resources.crank, crankState, addCrankRep, Main CRANK card, Trackers CRANK section, crank tip, print front page, Reputation Advantage, schema 0.17, F37, W29, GQ7, GQ11, GQ14*
     - **Decided:** A character stores `trackers.crank: { rep, ledger }`, the Çredits shape; the tier, the next tier and the pay are derived from `resources.crank.tiers`, never stored. The sheet raises it by the job (+1 done, −2 walked out), each with a note and an undo; Admin corrects anything else. It shows on Main beside Çredits, on Trackers with its ledger, in a tip with the tier table, and on the printed front page.
     - **Why:** Ken (2026-10-02): rep goes on the sheet. It's the player's record ("a career resource, not a running score", `200` Part VI), and the GM mode's session close and job board (W29) will award it. A tracked number with a ledger is the shape Çredits already has.
     - **Rejected:**
       - Free amounts with Raise/Lower, like Çredits: the book moves rep only by +1 and −2, so two job buttons say the rule; a correction is Admin's.
       - Storing the tier: it's derived from rep and the data, so storing it could only disagree (constraint 7).
       - Page 2 of the print sheet (GQ11's first default; Ken chose the front page): the front page's third field row had two of four places free, so CRANK fits there without adding height.
       - A pill in the header: the header is two thin rows (Decision 140) and rep changes once a session at most.
     - **Replaces:** nothing.
     - **Revisit if:** the team links the Reputation Advantage to starting rep (GQ7), F37 is answered (rep below zero), the GM Workshop changes the tier table or the +1/−2, or the GM mode's dispatch needs a rep change the two buttons can't express.
     - **Built:** app 0.37.0, game data 0.29, schema 0.17; PR #__; log 2026-10-0X (CRANK rep).
```

And the flag, in `SCHEMA.md` §5's table (after F36), with its INDEX §2 line:

```
| F37 | **Can CRANK rep go below zero?** `200` Part VI: "Abandoning a contract mid-job costs -2 rep", and the tier table starts at Novice, 0. A Novice at 0 or 1 who walks out goes where? Stubbed (Decision 169): rep goes negative and reads Novice, and the tip says the rule isn't settled. Scott wrote CRANK; ask him with Deighton | Scott/Deighton | No |
```

## 4. Questions for Ken

All four answered by Ken, 2026-10-02.

| # | Question | Answer |
|---|---|---|
| SQ1 | CRANK is GM Workshop content (Gear says "the full CRANK system is detailed in Part VI of the GM Workshop"), and GQ10 put the Workshop's tables in the GM's pack. Is the **tier table** (five names, rep, and pay) fine in the free sheet? | **Yes, free.** The job generator stays in the pack |
| SQ2 | Two buttons (+1, −2) and Admin for anything else, or a free amount like Çredits? | **Two buttons;** Admin covers any other edit |
| SQ3 | The front page, not page 2 (GQ11's default changes)? | **The front page,** in the third field row beside IP |
| SQ4 | The tip says rep isn't the **Reputation** Advantage (GQ7)? | **No: keep it clean.** The team wants to discuss the Reputation Advantage setting a character's starting CRANK rep, so the two may end up linked. The tip says nothing about it, and GQ7 stays open in the plan |

## 5. Read first

- `CLAUDE.md` whole: the hard constraints (7, 8 and 10 especially), the
  versions table, the change tiers, Decisions, Flags, voice.
- `docs/STATE.md` whole.
- `docs/SCHEMA.md` §2 `resources` (around `credits: { symbol … }`), §3
  `trackers` (around `credits: { current: 800, ledger … }`), and the ledger
  entries for Decisions **68** (game-data bumps), **96** (the full front
  page), **124** (character files are untrusted), **135** (every data key is
  read; formulas are numbers), **139** (the tip), **140** (the header),
  **160/165/166** (Main and the vitals on a phone and pinned).
- `private/crb/200_GM_Workshop.md`, *Crank and Bank* → *How CRANK Works* and
  *Reputation* (search `### Reputation`). The table and the +1/−2 rules are
  what this pins. If `private/` is empty: `git submodule update --init private`.
- **The pattern to copy is Çredits, everywhere it appears:**
  - `src/engine/engine.js`: `newCharacter()` (`trackers.credits`),
    `addCredits()`, `migrate()` (`t.credits = Object.assign(…)`),
    `_coerceNumbers()` (`if (isObj(t.credits))`), `creditSymbol()`, the
    public export list near the end, and `luckState`/`sanState` for a
    `…State` reader's naming.
  - `src/ui/sheet.js`: Main's cards (`cond(hasSfr?"cred":"cred alone", …)`),
    the vital popovers (`if (key==="cred") return { title:"Çredits", …`),
    `creditControlsHtml`, the Trackers tab's Çredits section and its ledger,
    the `[data-cr]` binder, and `renderPrintView`'s `p-fieldrow`s.
  - `src/ui/shared.js`: `commit(kind, label, fn)` and `TIPS` (Decision 139).
- Tests to copy from: `tests/hostile.test.mjs` (the hostile fixture's
  `credits:` line and "migrate() reads every stored number as a number"),
  `tests/engine.test.mjs` (the readers list near "readers take (ch) alone"
  and "the new readers are total"; the unread-data-key test),
  `tests/smoke.test.mjs` ("the print sheet carries a Conditions box, blank
  and filled"), `tests/rules.test.mjs` (`crb(name)`).

## 6. Out of scope

- Anything GM-side: tables, the job generator, payouts paid out, the
  off-screen job, dispatches. S1 is the player's number only.
- The header pills, the vitals bar and flyout, the wizard. CRANK appears on
  Main, in its popover, on Trackers, in the tip and on paper, nowhere else.
- Changing Çredits, or merging the two into a shared component. Copy the
  pattern; don't refactor it.
- The Reputation Advantage. Don't touch its data or text, and don't mention
  it in CRANK's copy (SQ4): whether it sets starting rep is still being
  discussed.
- Deciding F37. Stub it as §7 says.

## 7. The shapes

**Data** — `resources.crank` in `src/data/shadows-data.js`, beside
`resources.credits`. Every key below must be read by code or be text
(Decision 135; the unread-key test enforces it).

```js
"crank": {
  "name": "CRANK rep",
  "description": "<tip text, §8>",
  "jobDone": 1,              // read by the Job done button and its label
  "jobWalkedOut": -2,        // read by the Walked out button and its label
  "flagged": true,
  "flagNote": "F37: can rep go below zero? Stubbed: it can, and reads Novice.",
  "playerNote": "<§8, shown in the tip only while rep is below zero>",
  "tiers": [
    { "id": "novice",    "name": "Novice",    "rep": 0,  "pay": { "min": 50,    "max": 200 } },
    { "id": "competent", "name": "Competent", "rep": 5,  "pay": { "min": 300,   "max": 800 } },
    { "id": "skilled",   "name": "Skilled",   "rep": 12, "pay": { "min": 1000,  "max": 3000 } },
    { "id": "expert",    "name": "Expert",    "rep": 20, "pay": { "min": 4000,  "max": 8000 } },
    { "id": "legendary", "name": "Legendary", "rep": 30, "pay": { "min": 10000, "max": null } }
  ]
}
```

Tier ids are permanent (constraint 6). Update `SCHEMA.md` §2's `resources`
block with the shape and a one-line comment.

**Check the flag mechanics first:** search the data for `"flagged": true` and
`tests/docs.test.mjs` for how flags are found. If the docs test doesn't scan
`resources`, stop and ask (§11) rather than moving the flag somewhere it
will be found.

**Character** — schema `0.17`:

```js
trackers.crank = { rep: 0, ledger: [ { date, amount, note } ] }
```

- `newCharacter()`: add it beside `credits`.
- `migrate()`: `t.crank = Object.assign({rep:0, ledger:[]}, t.crank)`, ledger
  forced to an array, exactly as `credits`. No version-gated step is needed:
  seeding 0 is right for every older file. Bump `SCHEMA_VERSION` to `"0.17"`.
- `_coerceNumbers()`: `rep` through `_num(…, 0)`, the ledger through `rows()`,
  each `amount` through `_num(…, 0)`. A `note` stays a string (whatever the
  existing code does for Çredits notes).
- Update `SCHEMA.md` §3's `trackers` block with a `(0.17)` comment.

**Engine** — two exports, both total (constraint 8):

```js
Engine.crankState(ch) → {
  rep,          // number; 0 for a character with no tracker
  tier,         // { id, name, rep, pay } — the highest tier whose rep ≤ rep;
                //   the first tier when rep is below every tier (F37's stub);
                //   null only if the data has no tiers
  next,         // the tier after `tier`, or null at the top
  toNext,       // next.rep − rep, or null
  unsettled     // true when rep < 0 (F37), so the tip shows the playerNote
}
Engine.addCrankRep(ch, amount, note) → { ok:true } | { ok:false, why }
  // Math.trunc(Number(amount)); 0 or NaN → { ok:false, why:"Enter an amount." }
  // adds to rep, pushes { date: ISO string, amount, note: note||"" }
Engine.crankPayText(tier) → "Ç50–200" | "Ç10,000+" | ""
  // creditSymbol() + numbers with toLocaleString("en-US"); max null → "+"
```

Tiers are read in data order and assumed ascending by `rep`; a test pins
that the data is ascending, so the reader doesn't need to sort.

## 8. The UI

**Main** (`renderShMain`'s vitals cards): a card **CRANK** beside Çredits,
opening the popover `"crank"`. Big: the rep. Meta: the tier name. Today
Çredits takes a whole row when there's no SFR (`"cred alone"`); with CRANK it
shares the row instead, so CRANK changes that class logic: no SFR → Çredits
and CRANK share a row; SFR → SFR and Çredits as now, CRANK on a row of its
own like Çredits alone today. Check at 390, 768, 1100 and 1300px pinned, and
run `npm run phone-check`.

**Popover** (beside `key==="cred"`): title **CRANK rep**; the `now(…)` line
reads `<rep> · <tier name>`, the sub line "<toNext> to <next name>" or
"Top tier" at Legendary; then a note field and the two buttons, then a
**Ledger on Trackers** button like Çredits'.

**Trackers** (after the Çredits section): heading **CRANK**, a `trk` block
with the rep, tier and next tier, the same controls, and a ledger in the
Çredits ledger's markup (date, signed amount, note), newest first.

**Controls** — one helper, `crankControlsHtml()`, used by the popover and
Trackers (as `creditControlsHtml` is):

```html
<input type="text" data-crknote placeholder="which job" aria-label="CRANK job note">
<button class="btn sm" data-crk="1">Job done +1</button>
<button class="btn sm" data-crk="-2">Walked out −2</button>
```

The `data-crk` values come from `resources.crank.jobDone` and `jobWalkedOut`,
not literals; so do the button labels' numbers. The binder sits beside
`[data-cr]`'s: `commit("crank", "CRANK rep +1 (note)", () => Engine.addCrankRep(…))`.

**Admin:** if Admin mode offers a direct edit of `trackers.credits.current`,
offer `trackers.crank.rep` the same way; if it doesn't, add nothing.

**Tip** — a `TIPS.crank` kind in `shared.js`. Its trigger is the CRANK label
on the Main card and the Trackers heading (`data-tip="crank"`). It shows:
the data's `description`; a small table of the five tiers (name, rep, pay via
`crankPayText`); and, only while `unsettled`, the `playerNote` under the
existing `appCopy.unsettledLabel`.

**Print** — `renderPrintView`'s third `p-fieldrow` gets
`pField("CRANK", …)` reading `"<rep> · <tier name>"` filled, blank when `ch`
is null. Then check in Chromium's print preview (or `npm run build` and print
the dist file) that the front page is **still exactly one page**, filled and
blank. If it isn't, stop and ask.

**Copy, drafted for a voice pass** (city voice; the player isn't stuck). Put
`description` and `playerNote` in the data as above; label strings stay in
`sheet.js` as Çredits' do.

- `description`: "CRANK is the gray market's job board, on every device in
  NYTE City. Your rep is your record there: one job at a time, and it doesn't
  fade. Walking out on a client is the one thing that follows you."
- `playerNote`: "Below zero isn't settled yet. Until it is, you read Novice
  and your GM has the last word."

Mark both in the PR description as **needs a voice pass**.

## 9. Tests

`tests/engine.test.mjs`:
- `newCharacter()` has `trackers.crank` `{ rep:0, ledger:[] }`, and a
  migrate round trip keeps a rep of 7 and its ledger.
- A schema-0.16 character (no `crank`) migrates to rep 0.
- `crankState` boundaries: rep −2, 0, 4, 5, 11, 12, 19, 20, 29, 30 and 100
  give the right tier, `next` and `toNext`; −2 is Novice and `unsettled`;
  30 and 100 are Legendary with `next` null.
- `addCrankRep`: +1 and −2 write a ledger line; 0, `"x"` and `NaN` refuse.
- `crankPayText` for Novice (`Ç50–200`) and Legendary (`Ç10,000+`).
- `crankState` joins the readers list that's run against every character
  `migrate()` can return.
- The data's tiers are ascending by `rep`, and ids are unique.

`tests/rules.test.mjs`: read `200_GM_Workshop.md` with `crb()`, parse the
*Reputation* table, and assert each row's name, rep and pay equal the data's;
assert the book still says `+1 rep` for a completed job and `-2 rep` for an
abandoned one, and the data's `jobDone`/`jobWalkedOut` match.

`tests/hostile.test.mjs`: add `crank` to the hostile fixture beside
`credits` (a hostile note, a string rep, a string amount). Assert `"lots"` →
0, `"5"` → 5, a non-array ledger → `[]`, and that the existing every-tab and
print render tests still show the note as text.

`tests/smoke.test.mjs`:
- Main shows the CRANK card reading 0 and Novice; its popover's Job done
  makes it 1, writes a ledger line on Trackers, and Undo makes it 0.
- Walked out at 0 shows −2, Novice, and the tip carries the unsettled note.
- The print view has CRANK, blank and filled.

**Mutation-test** (`CLAUDE.md`: a guard that passes before and after is
decoration). Break each, see a test fail, restore:
1. Remove the `crank` coercion from `_coerceNumbers()` → a hostile test fails.
2. Change `≤` to `<` in the tier lookup → a boundary test fails.
3. Remove the `t.crank` line from `migrate()` → the 0.16 test fails.
Record the three in the PR description.

## 10. Steps

Run `npm run verify` before starting, and after every step.

1. Confirm 169 and F37 are free on `main`. Bump: `npm run bump -- 0.37.0`.
2. Data: `resources.crank`; `gamedataVersion` → `0.29`. SCHEMA §2.
3. Engine: the tracker, `migrate()`, `_coerceNumbers()`, `SCHEMA_VERSION`,
   the three exports. SCHEMA §3. Engine, rules and hostile tests.
4. Sheet: Main card, popover, Trackers, controls and binder, Admin if it
   applies. Smoke tests. `npm run phone-check`.
5. Tip and print. Their smoke tests. Check print is one page.
6. Mutation tests (§9).
7. Ledger, flag and docs (§12). `npm run verify`.
8. Open the browser preview (`shadows-dev-preview`), make a character, press
   both buttons, undo, open the tip, print. Screenshot Main and Trackers for
   the PR.

## 11. Stop and ask

Stop, say what you found, and wait, if:

- 169 or F37 is taken on `main`.
- A rules question comes up that §3 and §7 don't settle (anything about
  payouts being paid, off-screen jobs, tiers gating anything).
- The flag can't live on `resources.crank` (§7).
- The front page breaks to two pages.
- A test outside the ones named here fails and the fix isn't obviously yours,
  or a fix would mean weakening or deleting a test.
- You'd need to change a file this order doesn't name, other than docs.

## 12. Close-out

Use the `close-the-session` skill for the *Rule or shape* tier. For S1 that's:

- **SCHEMA:** Decision 169 (§3 above, *Built* filled); F37 in §5; §2 and §3's
  shapes.
- **INDEX:** 169's line in §3; F37's line in §2.
- **CHANGELOG** under `[Unreleased] — app 0.37.0`, then `npm run changelog`:
  > - **CRANK rep.** Your standing on the city's job board now sits beside
  >   your Çredits on Main: +1 for a job done, −2 for one you walked out on,
  >   and your tier from Novice to Legendary, with what each tier's jobs pay.
  >   It prints on the front page too.
- **STATE:** rewritten where it's now wrong: the versions line, §1's
  paragraph (one clause: CRANK rep, 169), §3 (F37 joins Deighton's grouped
  question, with Scott), §5 (S1 built; the next GM-mode order is S3a).
- **Log:** an entry in `docs/log/2026.md`; a row in `docs/log/shipped.md`.
- **The plan:** in `../gm-mode.md`, mark S1 built (§6), and GQ11 and GQ14
  answered as built. GQ7 stays open. In this folder's README, S1's status.
- **PR title:** `feat: CRANK rep on the sheet (W29 S1, Decision 169)`. The
  body: what changed, the three mutation tests, screenshots, and the two
  strings that need a voice pass.

## 13. Review checklist (for the orchestrating session)

- [ ] Every *Done when* item, run in the browser, not just read in a test.
- [ ] No derived value stored: no `tier` on the character.
- [ ] The buttons and labels read `jobDone`/`jobWalkedOut` from the data.
- [ ] The three mutation tests are real: revert each fix locally and watch
      its test fail.
- [ ] The hostile fixture's note appears as text on Main, Trackers, the
      popover, the tip and print.
- [ ] A 0.16 file from `main` loads, shows rep 0, and saves as 0.17.
- [ ] Main's card rows are right with and without SFR, at phone width too.
- [ ] Front page is one page, filled and blank.
- [ ] Decision 169 has every field, its INDEX line, and nothing it replaces
      is left unmarked; F37's three places agree.
- [ ] The changelog line is in player voice; `shadows-changelog.js` was
      regenerated; versions agree everywhere (`docs.test.mjs` passes).
- [ ] Nothing out of scope (§6) changed.
