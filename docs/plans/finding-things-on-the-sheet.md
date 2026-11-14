# Plan — Finding things on the sheet

**Status:** open, proposed 2026-11-11. Ken's goal for the pass is usability and
access to information: a player mid-scene should find any number or rule in
as few moves as possible. Sessions are added here as they come up (§6); the
plan closes when Ken says the pass is done. Nothing here is a decision until
the session that builds it numbers it in `SCHEMA.md` §4. Its sessions are
`E`_n_ (E for easy to find) and its questions `EQ`_n_ (§5).
**Covers:** the 2026-11-11 critique of the running sheet (26/40, snapshot
`.impeccable/critique/2026-11-12T01-36-16Z__src-ui-sheet-js.md`), every
finding in it, Ken's ask for a shape-and-distill pass over the tabs, and
(E1b) making a character as easy as possible for everyone. Its orders are
in `plans/finding-things-on-the-sheet/`.
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
| E1a | Opening an older file: an owed choice as one line, the load notice in plain words ([order](finding-things-on-the-sheet/E1a-opening-an-older-file.md), built: PR #317, app 0.66.1, Decision 273) | `onboard`, then `clarify` | Rule or shape | — |
| E1b | Making a character, for everyone: the wizard's first-timer path ([order](finding-things-on-the-sheet/E1b-making-a-character.md), built: PR #320, app 0.66.2, Decisions 274–277) | `onboard` | Rule or shape | E1a |
| E1c | Character Points for a first-timer: how Disadvantages and Advantages fold (EQ9), and the Natural Advantage panel ([order](finding-things-on-the-sheet/E1c-character-points.md), built: PR #324, app 0.67.1, Decisions 279–280) | `distill` | Rule or shape | E1b |
| E2 | Where everything lives: the tabs, shaped and distilled ([shape](finding-things-on-the-sheet/E2-where-everything-lives.md), answered 2026-11-12: seven tabs, as E2a then E2b; E2a, the moves: [order](finding-things-on-the-sheet/E2a-the-moves.md), **E2a built**, PR #327; E2b, the distill: [order](finding-things-on-the-sheet/E2b-the-distill.md), **E2b built**, Decisions 284–285) | `shape`, then `distill` | Rule or shape | — |
| E3 | The Grimoire's read mode ([order](finding-things-on-the-sheet/E3-the-grimoire.md), approved 2026-11-12, **E3 built**, Decision 286, EQ32–EQ35 answered). Main's columns stay as E2b left them (EQ32, Alternative B); revisit if a character's fight runs past the screen under the header by more than a few pixels (today Dax's, by 96px at 1280×860), or E6 changes a skill row's or a card's height. The measurements are in the order's §1 | `layout` | Rule or shape | E2 |
| E4 | Colour that keeps its one meaning | `colorize` | Fix | — |
| E5 | The words: intros, placeholders, the `?` modifiers ([order](finding-things-on-the-sheet/E5-the-words.md), approved 2026-11-13, EQ36–EQ40 answered: all Default; **E5 built**) | `clarify` | Fix | E2 |
| E6 | The phone | `adapt` | Fix | E3 |
| E7 | Polish, then measure | `polish`, then `critique` | Fix | all |
| E8 | The game's words a tap away (W133), from E2's shape (EQ22) | `clarify` | Rule or shape | E5 |

E1a and E4 stand alone and can run beside anything. E2 decides what each tab
holds, so the sessions that lay a tab out or word it wait for it.

### E1 — The first minutes: an older file, and a new character

Ken widened E1 on 2026-11-11: onboarding covers making a character too, so
that creating one is as easy as possible for everyone, not only veterans
in Expert mode. It is two orders, because they share a goal but not code:
E1a is a small change to the sheet and is ready now; E1b is a shaping job
over the whole wizard, and gets its order once E1a merges (the cadence in
`WORK-ORDERS.md`: an order is drafted from `main` with the last PR merged).

#### E1a — Opening an older file

Order: [E1a-opening-an-older-file.md](finding-things-on-the-sheet/E1a-opening-an-older-file.md).
An owed choice (Kade's Focused Skill) becomes one line with a Choose
button on every tab, and the picker opens in a dialog (Decision 238 in
part). The load notice's game-data line says the file was saved under
earlier rules, in tool voice. The orphan lines ("no longer exists in game
data") move to E5.

#### E1b — Making a character, for everyone

`/impeccable onboard the character creation wizard for a first-time player, with Expert mode as the veteran's path`

Like E2, it runs in two halves: the onboard analysis ends in a proposal
for Ken, and nothing is built until he answers. What the 2026-11-11
walkthrough (a new character, then a filled draft through all eight steps,
normal and Expert, at 1280px) gives it to start from:

- **The first screen is a rules table.** Step 1 asks for a Campaign Power
  Level with *Stats 45 · Skills 40+INT+REF · CP 5 · Max CP Boost 2 ·
  Ç 3d4×100* on each card, before the player knows what any of it means.
  It's the GM's call, and nothing says so up front, or what making a
  character involves, or how long it takes.
- **Errors before input.** Step 1 shows "Choose a Campaign Power Level."
  and step 2 "Your character needs a name." in the error colour on
  arrival, beside a disabled Continue and "1 thing to fix first".
- **The order asks for numbers before identity.** Concept (step 2) is
  name, age, build, hair, eyes and skin; the archetype, the real concept,
  is step 4, after Stats. A subtype's required stats (Enforcer: BOD 8,
  COOL 7) only show on step 4, after the stats are spent. *Whether the
  order can move is a CRB question first:* check the book's own order
  before proposing one, and cite it.
- **Two steps are very long.** Archetype is about 4,600px tall;
  Character Points about 24,000px (11,800px in Expert mode), with every
  Disadvantage open. "Formerly 'Freebie Points'…" is said twice on it.
- **The archetype cards wear build-state chips.** Four of six read
  IN PROGRESS and Cyborg NOT WRITTEN YET. To a first-timer, that reads as
  an unfinished product. Find the decision that put them there before
  proposing anything.
- **The vitals rail on step 1 is a column of dashes.**
- **What already works:** the step ledger with ✓ and !, Back on every
  step, filters and category chips on Skills and Character Points, `?` on
  every entry, and Expert mode (Decisions 234 and its predecessors) for
  the veteran.
- **Not looked at yet:** the wizard on a phone; a full run from a blank
  character to Lock & Export; the Custom archetype's path.

**Weighs:** W131 (Expert mode as one long page) and W121 (type a number
into a stepper), both on the wishlist, as part of the proposal. **Set aside**
by E1b's order (EQ10, Ken 2026-11-11): both are the veteran's, E1b the
first-timer's.

#### E1c — Character Points for a first-timer

Split from E1b by EQ9 (Ken, 2026-11-11). The step is about 24,000px at
1280px (11,800px in Expert mode), with every Disadvantage open. How the
lists fold for someone reading them for the first time, against Decisions
232 and 234 (Expert mode's folds), measured before it's shaped. Its order
is drafted once E1b merges.

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
  together without scrolling. → **Left as E2b made it (Ken, EQ32,
  2026-11-12):** after E2b four of the five fights fit one 1280px screen,
  and the band that fit Dax's dropped every character's Stats 393–671px.
  The order's §1 has the figures and when to revisit.
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
- The orphan lines from the load check ("Skill "x" no longer exists in
  game data.") and the sheet's "no longer in the game data" chips, as one
  wording, engine and UI together (moved here from E1a).
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

### E8 — The game's words a tap away

W133, set apart from E2 by Ken on 2026-11-12 (EQ22): a game term inside a
sentence the app writes opens its rule on hover or tap, on Decision 139's
primitive. It comes after E5, which rewrites the same sentences. W133 has
the shape and what to respect.

## 4. Kept out

- **W147** (an old file with no TAG becomes a new character on every
  import): Ken put it on the wishlist on 2026-11-11 rather than in this
  pass. It is an engine fix, not design.
- **The printed sheet**: its own plan (`print-sheet-scotts-look.md`).
- **Home**: the critique was of the running sheet. (The wizard was out too,
  until Ken widened E1 on 2026-11-11: E1b.)

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
