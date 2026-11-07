# Plan — GM mode at the table

**Status:** **proposed 2026-11-05 by Claude (Opus)**, from an Impeccable critique of GM mode on the Dead Air
sample table (24/40; the snapshot is `.impeccable/critique/2026-11-06T04-35-27Z__src-ui-gm-js.md`). Ken's
answers to the critique: **GM mode is a play-first product** (it's designed for the GM running a session, and
prep comes second), **the encounter screen goes first**, and the work runs as work orders, with Impeccable's
commands used inside each session. **Approved by Ken 2026-11-05:** he merged it (#302) and asked for U1's order
("okay, lets build our first work order for U1!"). UQ1–UQ8 were left blank, so each is its default
(`WORK-ORDERS.md`). Each order is pre-flighted against `main` when it's drafted.
**Tier of this document:** *Docs*. U1, U2, U3 and U5 are *Rule or shape*. U4 is *Fix*.

Sessions are `U1`… (U for *use at the table*). Questions are `UQ`_n_. Not `T`, because `TQ` is the two-tabs
plan's, and not `G`, because `GQ` is GM mode's. A critique finding is `#`_n_ (§2), used only inside this plan.

This plan sits beside [`gm-mode.md`](gm-mode.md), not inside it. That plan is about what a table *holds*: its
records, its rules and its file. This one is about how the screen behaves while a game is running. Each U
session touches records that gm-mode.md's decisions built, and cites them.

---

## 1. What it must respect

- **The three-session loop** (`../WORK-ORDERS.md`). Every U session is an order: drafted from `main` once the
  last one has merged, pre-flighted, approved by Ken, then built by a Sonnet builder and checked by a fresh
  Opus reviewer. U4, a *Fix*, gets a one-page order, because it lands five areas at once and benefits from the
  reviewer.
- **Decision 130.** Three sessions reopen a decision, and each says why, through something new its Rejected
  list didn't weigh. That new thing is Ken's play-first answer and the critique's walk-through:
  - **U3** reopens **176** in part ("a member's page edits every field in place").
  - **U2** reopens **208** in part (Jot's session: "the one session dated today, else none").
  - **U4** restyles **255**'s seat card without moving its order (Health, Awareness and Conditions still come
    first).
- **Store inputs, compute everything else** (constraint 7). Nothing in this plan stores anything derived:
  - the NOW badge, the Tonight strip and clock progress are computed;
  - a duplicate name's A/B is drawn when the screen is drawn and never saved.
  The one stored change is Jot's session, and that rule already lives in the engine.
- **Decision 258's frame.** One column with a measure per page, and Back held in a bar under the header. The
  Tonight strip (U2) joins that bar. It doesn't add a second sticky band.
- **DESIGN.md is the system.** Colour carries one meaning, type has four voices, every surface has a one-line
  frame, and labels are Mono Caps. GM mode currently breaks the Four Voices and Mono Caps rules (#27, #28).
  Each session leaves the parts it touches inside the system. Once U3 has merged, `/impeccable document`
  records GM mode's own components in DESIGN.md.
- **Nothing here touches the player sheet**, except where the encounter reuses its Health Level track (U1).
  That reuse is a reader, never a writer (Decisions 256 and 257).

## 2. The findings, and who owns each

Every point the critique raised has exactly one owner. **A session isn't done until each of its findings has
been fixed, or has been set aside by Ken with a reason in the order.** Findings marked *(det.)* came from the
detector rather than from the design review.

| # | Finding | Owner |
|---|---|---|
| 1 | The acting row is marked only by a cyan left border (`shadows.css:1363`). There's no NOW label, and Next doesn't move focus or scroll to the actor | U1 |
| 2 | An encounter row's HP is small plain mono text, with no health colour and none of the sheet's Health Level boxes | U1 |
| 3 | Every row has six buttons of equal weight. A row that's Down keeps all six | U1 |
| 4 | Duplicate names can't be told apart (two Reclaim cleaners) | U1 |
| 5 | The Hit panel takes any amount of damage without a word ("87 past zero"). Apply moves as the preview grows. The preview isn't announced | U1 |
| 6 | At 375px, End the encounter is off-screen in the sideways `.enc-bar`. The bar sits flush to the left edge *(det.)* | U1 |
| 7 | The encounter plan's labels are long sentences in mono caps ("Terrain (cover, elevation, visibility)"; `gm.js:3295-3337`) *(det.)* | U1 |
| 8 | "Add to Achterberg's clinic, moonrise" doesn't say it's an encounter | U1 |
| 9 | There's no running view. The live encounter, the current thread, nearly full clocks and who's down are spread over five tabs | U2 |
| 10 | The table never says it has changes no file holds. Only Home does | U2 |
| 11 | Opening a table lands partway down Sessions, because Home's scroll position carries over | U2 |
| 12 | Jot goes to table Notes whenever no session is dated today, which happens with a game past midnight or a session resumed on another night (Decision 208) | U2 |
| 13 | Close out has no ending: no summary of what was awarded, no nudge to export, and Delete sits just below it | U2 |
| 14 | A session still being played shows seven debrief textareas | U2 |
| 15 | Clocks are scattered across places, factions and encounters. Lists say "1 clock", never "4 of 6", and a clock can't be ticked from a list | U2 |
| 16 | Cast members, places, factions, threads and sessions open as forms. There's no read view anywhere (Decision 176) | U3 |
| 17 | Notes is eight editors, all open, with no list of titles and with textareas that scroll inside the page | U3 |
| 18 | Reaching the prose on a cast or place page takes a long run of tabbing through inputs (keyboard and screen reader) | U3 |
| 19 | The Add form leads every section, above the content | U3 |
| 20 | Place breadcrumbs repeat themselves ("Techtopia · Central City · Techtopia · The Annex") | U3 |
| 21 | A place's "N lines" is unexplained | U3 |
| 22 | Card grids change between two and three columns (places, factions) | U3 |
| 23 | The Sessions list zigzags in two columns (7, 6 / 5, 4) | U3 |
| 24 | On a thread that isn't current, the "Current" toggle reads as a state label | U3 |
| 25 | A cast page has the clock it needs (Ibarra's patience) at the bottom of another record's page | U3 |
| 26 | Each entity page has no summary at the top (who, what they want, their line) | U3 |
| 27 | A seat card's live vitals show in italic dim Inter, because they reuse `.cast-line` (`gm.js:3691`, `shadows.css:1281`) | U4 |
| 28 | Section headings ("Threads", "Clocks", "Stat block") are Inter bold in sentence case (`.cast-h`, `.next-h`), where DESIGN.md calls for Mono Caps | U4 |
| 29 | GM tabs reuse the player sheet's icons (`gm.js:260`): Players has Main's, Encounters has Trackers' | U4 (UQ6) |
| 30 | Software voice shows through: "not in the Gear tables" (`gm.js:2906`), "formula 2" (`gm.js:927`), "Slot in a pack with site profiles…" (`gm.js:1288`) | U4 |
| 31 | Delete confirmations say it "isn't kept anywhere else", even though Undo would restore it | U4 |
| 32 | Activity labels have no values ("Hit Reclaim drone", "Changed The tide at Wharf 17") | U4 |
| 33 | Two inline `style=` (`gm.js:204`, `gm.js:209`) | U4 |
| 34 | The heading scale is flat: h3 is 15.2px against a 15px body *(det.)* | U4 |
| 35 | Home sums up a table as "Table · 8 notes", the least telling count, with no changed time | U4 |
| 36 | The seat copy shows the name twice in the display face and two identical tab bars stacked. "Read only" sits beside Heal and Hurt buttons that look live (Decision 256) | U4 |
| 37 | The empty Threats tab says "a file of threats your GM material came with", which doesn't tell a GM what to do next | U4 |
| 38 | The section tabs have no `aria-current`, so the open section isn't announced (`gm.js:263-268`) | U5 |
| 39 | At phone width, the active section tab can sit off-screen | U5 |
| 40 | The only keys are F and J. There are none for the sections, Next turn or Undo (W139's rest) | U5 |
| 41 | Activity and Undo are buried under ⋮ | U5 |

The critique's remaining points are folded into the rows above. Its open questions, about who GM mode serves
and whether prep or play comes first, are answered by Ken's play-first ruling.

## 3. Every session runs the whole critique on what it touches

Owning a finding is the floor. Each session also checks the critique's full lens on every screen it changes,
so that one area isn't fixed while it drifts somewhere else:

1. **Before the order.** The orchestrator runs **`/impeccable shape`** on the session's screens, and the
   order's §9 (*The UI*) is drafted from it: behaviour, not markup (`WORK-ORDERS.md`, *How exact to be*).
   Where the order would add or move a visual pattern, the shape brief says which DESIGN.md rule it follows.
2. **While building.** The builder runs the Impeccable commands that the session's row names (§4) on its
   screens, with `craft-floor.md` read before the first UI edit. It runs no other commands, so the build
   doesn't drift into a redesign. **A command that wants to change something outside the order's §9 is a
   stop**, put to the conductor, never a judgement call.
3. **The detector gate.** `impeccable detect` can't read markup written in `gm.js` template strings (the CLI
   returned 0 on 4,000 lines). So the gate is the **browser overlay**, injected over the dev preview on every
   section the session touched, at desktop width and at 375px. A content finding is either fixed or named in
   the PR as a false positive. The shared header's brand palette is a known false positive.
4. **Phone and screen reader.** Run `npm run phone-check`. Check `scrollWidth` against `clientWidth` at 375px.
   Every new control must be reachable by keyboard, and every state change must be announced.
5. **The voice pass.** Every new string goes into the PR as it renders (`WORK-ORDERS.md`).
6. **The reviewer re-runs `/impeccable critique` on GM mode** with Dead Air seeded (`samples/`, `CLAUDE.md`
   explains how), and puts the score and the session's findings in the review. A session that lowers any
   heuristic score explains why. The snapshot is committed beside this one, so the trend accumulates. The
   critique's two assessments run as the reviewer's own subagents. Its closing questions are answered with
   `Questions skipped: this is a review`, and anything in them that needs Ken goes to the conductor.
7. **Close.** **`/impeccable polish`** runs on the session's screens before *Ready to merge*, reading the
   latest snapshot's priority issues.
8. **The PR says what ran.** Its body has an **Impeccable** section: each command run, on which screen, and what
   it changed (or "nothing"), plus the overlay's findings per section and width. A command the order names that
   didn't run is a must-fix in review, and so is a missing section. Nothing else enforces these steps, so the
   review does.

## 4. Sessions

| Session | What a GM gets | Findings | Impeccable | Tier | Waits on |
|---|---|---|---|---|---|
| **U1** — the encounter as an instrument (**built**, app 0.63.0, Decision 269: [U1](gm-at-the-table/U1-encounter-instrument.md)) | The acting row carries a Now badge, and Next scrolls to it and announces it, keeping focus on Next. HP is a green Oxanium readout over the sheet's Health Level segments (`hl-mini`), read-only. Hit and Heal are each row's primary pair, with the rest under More; a row that's Down shows only what it can still use. Duplicate names get A/B when drawn. The Hit panel keeps Apply in one place, warns past 2× HP (UQ4), and announces its preview. The encounter bar wraps at phone width. The plan form's labels are short and in sentence case | 1–8 | shape (the row) · typeset · colorize · harden · adapt · polish | Rule or shape (app minor; no schema) | Ken: this plan, UQ1–UQ5 |
| **U4** — back inside the system (**built**, app 0.63.1, no decision: [U4](gm-at-the-table/U4-back-inside-the-system.md)) | Seat vitals are readouts. Section heads are Mono Caps. The heading scale is stepped. Tab icons stay borrowed until Scott's set (UQ16, W145). The software voice goes. Delete copy knows about Undo. Activity labels carry their values. Home's table card leads with sessions, cast and when it last changed. The seat copy has one name and one tab bar, and its inert buttons read as inert | 27–37 | typeset · clarify · polish | Fix (app patch) | U1 merged |
| **U2** — Tonight (**built**, app 0.64.0, Decision 270: [U2](gm-at-the-table/U2-tonight.md)) | One strip in 258's bar, shown while an encounter runs or a session is open: round and actor, the current thread, the clocks within two of full, who's down, and *Unexported* (UQ7). A table opens at the top. Jot files to today's session, or else to the latest one not closed out (UQ3). A live session folds its debrief until Close out. Close out ends on its award summary and an Export (UQ8). Clocks show "4 of 6" and tick from any list. **Carried from U1 (KQ3, Ken 2026-11-06):** the running encounter, distilled: its title a heading, not a Name input (no h1 today); Combat Sense as text on a running row; More sorted into play, setup and Remove; on a phone, damage, preview and Apply together in the Hit panel | 9–15 | shape (the strip) · layout · distill · onboard (close-out's end) · polish | Rule or shape (app minor; Jot's rule is engine, no schema) | U4 merged |
| **U3** — read first (**built**, app 0.65.0, Decision 271: [U3](gm-at-the-table/U3-read-first.md)) | Cast members, places, factions, threads and sessions open as a dossier: the name in the display face, a summary line, then the line, what they want and if pushed, as prose; the stat block as readouts; their clocks first. **Edit** turns the page into today's form (UQ2). Notes is a list of titles that opens one at a time. Add sits below the content. Grids, breadcrumbs and Sessions' order are made consistent. **Carried from U4's re-critique (2026-11-06):** every tab puts focus in its Add field; "Slot in a pack" is still the software's verb; "Delete this note?" doesn't name the note; modal titles are in the display face (`.modal-head h2`); a seat card's SAN, Luck and Çredits are a dim meta line, not readouts; one seat card shows a raw TAG as its name | 16–26 | shape (the dossier) · distill · layout · typeset · polish · **document** (after merge: GM components into DESIGN.md) | Rule or shape (app minor; no schema) | U2 merged |
| **U5** — keys and landmarks (**drafted** 2026-11-07: [U5](gm-at-the-table/U5-keys-and-landmarks.md), UQ35–UQ42) | The section tabs announce the open section and keep it in view. The keys W139 left open: `1`–`8` for sections, `N` for Next turn on a running encounter's own page, Ctrl/⌘+Z for Undo of the last table change (Ken, shaping: no `U`, since there's no Redo), `A` for Activity, and `?` for the list. Each follows 259's rules: never while typing, all listed and switched off in ⋮ → Keys | 38–41 | audit · harden · polish | Rule or shape (app minor) | U3 merged (it binds U3's pages) |

**Leads after U5** (not any session's findings yet; from U2's and U4's re-critiques, where they fell outside the session that met them):
- **U2's H1 gap** (Ken, 2026-11-06: a lead, not a reopening of *Fight first*):
  - on a phone the strip drops **Down** whenever the fight leads;
  - a clock at 7 of 8 has no urgency colour.
- **U2's re-critique:**
  - the strip's .74rem type;
  - the award log's ceremony (IP as a gold readout);
  - the Hit panel's Apply above its modifiers (UQ24's order);
  - close-out's focus on a pressed attendance toggle;
  - "Close to full" counting 2 of 4.
- **U4's, not on U3's pages:**
  - modal titles in the display face (`.modal-head h2`);
  - a seat card's dim SAN / Luck / Çredits;
  - a raw TAG shown as a seat's name;
  - Threats' "Slot in a pack" button.

A later *Fix* order takes them, once U5 has merged.

**Why this order.** Ken put the encounter first (U1). U4 comes next because it's cheap and it stops every
later session from building on the drift. U2 comes before U3 because the strip is what a GM sees on *every*
tab, while the dossier changes one page at a time. U5 comes last because its keys bind the screens the
others change.

**None of them run beside one another.** All five share `gm.js` and `shadows.css`, and each one waits on the
one before (`WORK-ORDERS.md`, *Running more than one at once*). If Ken wants two at once, U4 and U1 come
closest, because their findings don't overlap. Even then they'd both touch the encounter row's CSS, so the
orchestrator would do the merge.

### What each session's decisions are, in one line

Each is written **N** in its order, and the building session takes the next free number when it builds it
(`CLAUDE.md`, *Decisions*).

- **U1:** *An encounter row reads as the sheet's Health readout, one row acts at a time, and a hit past twice
  a row's HP asks before it applies.* Replaces nothing (it cites 188, 191, 192 and 253). Check 253's *Act
  now* and *Delay* still fit under More.
- **U2:** *A table that's running shows one Tonight strip; Jot files to the open session; Close out ends on
  its award summary and an Export.* Replaces **208** in part (Jot's session) and **258** in part (the bar
  holds the strip).
- **U3:** *A record opens to read, and Edit opens its fields; Notes lists titles.* Replaces **176** in part
  ("edits every field in place"), and the same sentence wherever 243, 244 and 245's pages inherited it.
- **U4:** no decision (Fix tier). If UQ6 brings new icons, that's data, logged.
- **U5:** *A table's sections, Next turn and Undo each have a key, on 259's rules.* Replaces **259** in part.

## 5. Questions for Ken

Each has a default. A question with a default that Ken leaves blank is answered "Default" (`WORK-ORDERS.md`).

| Id | Question | Default |
|---|---|---|
| **UQ1** | Is the order U1 → U4 → U2 → U3 → U5 right? | Yes |
| **UQ2** | U3's read view: one **Edit** toggle per page, or click a passage to edit just that one? | One Edit toggle per page. Click-to-edit hides what's editable, and on a phone a tap meant to scroll would start editing |
| **UQ3** | Jot with no session dated today: file to the latest session not yet closed out, or keep 208 (no session)? | The latest session not closed out. With every session closed, there's no session, as now |
| **UQ4** | A hit past 2× the row's HP: ask first ("That's 99 against 12 HP. Apply?"), or block it? | Ask first. A GM sometimes means it (a Massive hit on a mook). Nothing is blocked, in the spirit of Decision 225 |
| **UQ5** | Duplicate names: A, B, C drawn on screen and never stored, or ask the GM to rename? | Drawn, never stored. Renaming a mook mid-fight is work the GM didn't ask for |
| **UQ6** | GM tab icons: ask Scott for six (Sessions, Players, Cast, City, Threats, Encounters), or drop icons from the GM tabs? | Ask Scott. Until his arrive, U4 keeps the borrowed ones and logs that it did |
| **UQ7** | Tonight: one strip in 258's bar, or a live block at the top of Sessions only? | The strip. A block on Sessions repeats the tab-hunting the critique found |
| **UQ8** | Close out's end: offer Export there, or only show *Unexported* in the strip? | Both. Close out is when a GM is most likely to leave without exporting |

## 6. What this plan doesn't do

- **Reopen what a table holds.** No new record kinds, and no table schema bump is planned. A session that
  finds it needs one stops and asks (its order's *Stop and ask*).
- **Restyle the player sheet.** The sheet's Health Level track is reused by U1, not changed.
- **W140**, Notes that organise themselves (tags, categories, by session), stays gm-mode.md's *Notes* row.
  U3's list of titles is the screen W140 will later fill. Its order says so and leaves room.
- **Home's layout** (W80's rest). U4 fixes only what a table's card says.
- **Printing** (S13b, W84).

## 7. Where things land

The orders go in [`gm-at-the-table/`](gm-at-the-table/), one per session, named `U1-encounter-instrument.md`
and so on, in `WORK-ORDERS.md`'s fifteen sections (U4's folded to a page). The critique snapshots go in
`.impeccable/critique/`, committed. When U5 merges, this plan closes to `plans/archive/` with a line in
`log/shipped.md`, and gm-mode.md's *Still to build* row for it is struck.
