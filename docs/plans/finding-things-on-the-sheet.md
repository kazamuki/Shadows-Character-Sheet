# Plan — Finding things on the sheet

**Status:** open, proposed 2026-11-11. Ken's goal for the pass is usability and
access to information: a player mid-scene should find any number or rule in
as few moves as possible. Sessions are added here as they come up (§6); the
plan closes when Ken says the pass is done. Nothing here is a decision until
the session that builds it numbers it in `SCHEMA.md` §4. Its sessions are
`E`_n_ (E for easy to find) and its questions `EQ`_n_ (§5).
**Covers:** the 2026-11-11 critique of the running sheet (26/40, snapshot
`.impeccable/critique/2026-11-12T01-36-16Z__src-ui-sheet-js.md`), every
finding in it, and Ken's ask for a shape-and-distill pass over the tabs.
**Sources:** `src/ui/sheet.js`, `src/ui/shared.js` (`SHEET_SECTIONS`, the
vitals bar, `importIssuesHtml`), `src/styles/shadows.css`, `PRODUCT.md`,
`DESIGN.md`; Decisions 140, 151, 156, 158, 160 and 165.
**Tier:** mixed, per session (§3). Anything that moves where a piece of
information lives is *Rule or shape*.

---

## 1. The problem, as a player meets it

A locked sheet has eight tabs (Decision 158) and a lot on each. The critique
loaded five lived-in characters and found the information is all there and
all correct, but it takes knowing the sheet to find it:

- **The same thing lives in two places, and not identically.** The combat
  skills table is on Main and on Skills. Damage is Heal 1 · Hurt 1 · Take a
  hit on Main (Decision 151) and eleven controls on Trackers. A Werewolf's
  form toggle is on Main and on Loadout & Powers.
- **"What can I do" is split three ways.** Powers, Advantages and
  Disciplines are spread over Character, Progression and Loadout & Powers,
  so a player has to know which tab a thing was filed under.
- **Signal is buried in repetition.** "−1 pain" sits on every skill row under
  a banner that already says the totals include it, and untrained rows weigh
  the same as rank-5 ones.
- **What needs attention takes over.** An older file (Kade's) opened with an
  owed Focus choice as ten full-width rows above every tab; on a phone his
  vitals started a full screen down.
- **What works:** the vitals bar on every tab, `?` on every skill, and
  breakdowns inline. The pass keeps those and builds on them.

## 2. Before every session

- **The test characters.** `tests/TestCharacters/` holds five characters on
  the current format (Dax, Juno, Kade, Sigrun, Wren). They're gitignored, so
  they exist only in Ken's main checkout: copy them into the worktree, or
  seed them in the dev preview from there. The originals from before the
  2026-11-11 refresh are in `_pre-refresh-2026-11-11/`; E1 needs those,
  because they are exactly the old files a returning player brings.
- **Seeing it run.** `shadows-dev-preview` (`.claude/launch.json`), then
  check at 1280px and 375px. `npm run phone-check` holds the phone floors
  (44px controls, one-row vitals and jump bars, Decision 165).
- **The impeccable command** named in each session is how the session runs
  its design work: invoke it with the scope given, then build what it settles.
  A command's output is a proposal like any other: *Rule or shape* changes go
  to Ken before they're built.

## 3. Sessions

| Session | What | Impeccable | Tier | After |
|---|---|---|---|---|
| E1 | Opening an older file | `onboard`, then `clarify` | Rule or shape | — |
| E2 | Where everything lives: the tabs, shaped and distilled | `shape`, then `distill` | Rule or shape | — |
| E3 | Main's columns and the Grimoire's read mode | `layout` | Rule or shape | E2 |
| E4 | Colour that keeps its one meaning | `colorize` | Fix | — |
| E5 | The words: intros, placeholders, the `?` modifiers | `clarify` | Fix | E2 |
| E6 | The phone | `adapt` | Fix | E3 |
| E7 | Polish, then measure | `polish`, then `critique` | Fix | all |

E1 and E4 stand alone and can run beside anything. E2 decides what each tab
holds, so the sessions that lay a tab out or word it wait for it.

### E1 — Opening an older file

`/impeccable onboard the first seconds after opening an older character file: owed choices and the load notice`,
then `/impeccable clarify` on the notice's words.

- An owed choice (Kade's Focus skill) becomes one strip under the vitals,
  for example *"Kade owes one choice since the rules changed · Choose ▸"*,
  that opens the picker in a sheet. The vitals stay first on every tab.
- The load notice (`Engine` load issues: "saved against game data 0.9;
  loaded data is 0.53", and the "no longer exists in game data" lines with
  raw ids) is rewritten in tool voice and says what to do.
- Making the choice confirms it, with an undo toast like every other change.
- **Done when:** the five pre-refresh files each open with their vitals in
  the first screen at 375px, and Kade's choice is one strip.

### E2 — Where everything lives: the tabs, shaped and distilled

Ken asked for this as one session. It runs in two halves with Ken in the
middle, because the first half's answer is *Rule or shape*.

**First half, `/impeccable shape`:**
`/impeccable shape the running sheet's tab structure: where each piece of information lives and how a player finds a number or rule mid-scene on a phone`

- An inventory of every piece of information on the eight tabs: where it
  shows, where else it shows, and what a player does to reach it.
- The tasks a player does at the table, ranked by how often (take a hit,
  roll a skill, spend Luck, check a weapon, look up a power, log a
  session), and how many moves each takes today.
- Whether **W133** (game terms in a sentence a tap away) joins the pass:
  what it would add to finding a rule, and what it would cost (EQ1).
- A proposal: one home for each piece of information, what (if anything)
  is mirrored on Main, and whether the tab count changes (it may: EQ2). It cites
  Decisions 140, 151, 156, 158, 160 and 165 and says, for each one it would
  move, what is new since (the critique's lived-in files).
- **Stop here.** The proposal goes to Ken; nothing is built until he
  answers.

**Second half, `/impeccable distill`,** on what Ken approved:

- Remove the duplicates the proposal settles (the combat skills table,
  the damage controls, the form toggle).
- Take out the repetition: per-row "−1 pain" where a banner already says
  so; untrained rows dimmed to Overcast Steel.
- Trim tab intros that describe the software rather than help the player.
- **Done when:** every piece of information has one home, a decision is
  numbered for each move, and the critique's tasks take no more moves than
  before.

### E3 — Main's columns and the Grimoire's read mode

`/impeccable layout Main at 1280px and the Grimoire's own spells`

- Main's first column runs 167% of the screen against stats at 60%:
  rebalance so weapons and the combat skills E2 keeps on Main show
  together without scrolling.
- The Grimoire's own spells read as rows, with editing one press away (the
  pattern GM mode already uses); no truncated text, and no four-line
  "Link to the book" button.

### E4 — Colour that keeps its one meaning

`/impeccable colorize the sheet's state colours against DESIGN.md's One Meaning Rule`

- Werewolf form boosts are framed in Signal Gold (spend/caution): give them
  violet, the archetype's colour.
- Scrapped armor (Dax's jacket, 0/10) keeps the cyan active frame and glow,
  with PROT and RES in cyan: show it as damaged instead.
- Progression's five equal violet buttons: one primary.

### E5 — The words

`/impeccable clarify the sheet's player-facing copy`

- Whatever tab intros survive E2, in NYTE voice (`docs/VOICE-APP.md`).
- The IP amount placeholder cut to "amoun".
- TOL and WILL show a `?` where a modifier goes, which reads as "unknown".
- Hyphen-minus and true minus mixed in the same table: true minus
  throughout.

### E6 — The phone

`/impeccable adapt the running sheet at 375px`

- The name shows twice on Main (header and title).
- The Crank tile sits alone on its row.
- Attack values (`1d10 + 22`) wrap in the weapons table.
- Keep phone-check green; any new floor goes into it.

### E7 — Polish, then measure

`/impeccable polish`, then `/impeccable critique load full character sheets at tests/TestCharacters`

- The dashed weapon-tag underlines on the Tekko-Kagi and the Autobaton, and
  anything left over.
- The re-run critique is scored against the 26/40 snapshot; its trend line
  goes into this plan's closing entry.

## 4. Kept out

- **W147** (an old file with no TAG becomes a new character on every
  import): Ken put it on the wishlist on 2026-11-11 rather than in this
  pass. It is an engine fix, not design.
- **The printed sheet**: its own plan (`print-sheet-scotts-look.md`).
- **The wizard and Home**: the critique was of the running sheet.

## 5. Questions for Ken

All three answered by Ken on 2026-11-11, each on the recommendation.

- **EQ1:** Does **W133** (a game term inside a sentence is a tap away) belong
  in E2? It is the same goal, finding a rule without leaving the line you're
  reading. **Answered: E2's shape weighs it**, and Ken decides from the
  proposal whether it joins the pass or stays a wish.
- **EQ2:** E2's proposal may suggest fewer tabs. Is the tab count open, or
  should the proposal work inside eight? **Answered: open.** Decision 158 is
  the last time it moved, and the critique is the new evidence.
- **EQ3:** One release at the end, or each session ships when it merges?
  **Answered: each ships** when it merges, with its own CHANGELOG lines and
  app bump; E1 and E4 are worth having on their own.

## 6. Adding a session

The plan stays open. A new session takes the next `E` number, a row in §3's
table and a section in §3, and names its impeccable command and its tier.
A session that turns out to be its own project gets its own plan instead.
