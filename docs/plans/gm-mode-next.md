# Plan — GM mode: what's next

**Status:** **approved by Ken 2026-11-06** (in the GM-at-the-table conductor session), when that plan closed.
GM mode's first plan, [`archive/gm-mode.md`](archive/gm-mode.md) (W29), built S1–S21 and launched in 0.57.0
(Decision 260), and [`archive/gm-at-the-table.md`](archive/gm-at-the-table.md) made it work in play (U1–U5,
Decisions 269–272). Both are history now. This plan holds only what's left, re-vetted with Ken: what stays a
session, what waits on Scott, and what went to the wishlist.
**Tier of this document:** *Docs*. Each session names its own tier.

Sessions keep GM mode's letter: `S`, from **S22** (S1–S21 are the first plan's). Open questions keep theirs too: `GQ`,
from **GQ31** for new ones; the first plan's still-open GQs are carried in §5 under their own numbers.

## 1. What Ken decided (2026-11-06)

- **The first plan is archived, not trimmed.** Its 997 lines were mostly the built sessions' drafts. This plan is the rest.
- **The dispatch is a wish, not a session.** S2 (the dispatch and inbox), S4 (GM writes) and S13's handouts are **W146**,
  built only if hand entry drifts (GQ20: Scott and Deighton both say it works) or live sync starts. `accounts-and-sync.md`'s
  N5 cites it.
- **Scott's three stay, marked waiting:** S12a, S17 and S11, with his to-do list (§4).
- **Every ready item stays a session** (§3), with printing joining a session's name and Markdown, and Reference+ a
  session of its own.
- **Scott's play report comes first** (S22): GM mode changed a lot in U1–U5, and his use of it reorders what's left.

## 2. The order, and why

S22 first, because it can reorder everything after it. S23 next: it's fixes with no questions, the leads the last plan's
reviews logged while they're fresh. After that, Ken picks the next one when the last has merged; the table's order is a
suggestion, not a queue.

## 3. Sessions

| Session | What | Tier | Waits on | Status |
|---|---|---|---|---|
| **S22** | **Scott's play report, and a closing critique.** Scott runs a session on the live version and says what got in the way; the conductor re-runs `/impeccable critique` on Dead Air (the last plan's run: 24 → 25 → 27 → 28 → 28 → 27) and reorders this table from both | Docs | **Scott**: a session run on the live version | No order needed |
| **S23** | **At the table, the leftovers.** The leads the GM-at-the-table reviews logged outside their sessions (§6), and W141 (`.form-toggle`'s dark-mode frame) and W145 (GM tabs with their own icons) | Fix, and Rule or shape for two of Ken's calls | Nothing | **Built** in app 0.73.0 (Decisions 299, 300; Ken approved 2026-11-18, GQ61–GQ66 on their defaults, GQ60: W145 in, with Lucide icons): [`gm-mode-next/S23-leftovers.md`](gm-mode-next/S23-leftovers.md). §6's verdicts are below it |
| **S24** | **NPC rules.** An NPC's TOL and WILL (175 reopened): TOL the formula with an override where an entry means it; **WILL a floor**, so a value below the formula is an error the builder shows (GQ6, Scott 2026-11-03). And a cast member **carries their wounds** into the next fight; the GM says how much heals between fights, and back-to-back fights heal nothing (GQ26, Scott 2026-11-03; supersedes 193) | Rule or shape (table schema) | Nothing | **Built** in app 0.73.0 (Decisions 293, 294; table schema 0.20): [`gm-mode-next/S24-npc-rules.md`](gm-mode-next/S24-npc-rules.md) |
| **S25** | **CRANK.** An off-screen job pays the bottom of its tier's range, and Legendary can't be taken off-screen (GQ28, Scott 2026-11-03; changes 206 and `offScreenMax`). Rep stops at 0 (F37: closes the flag), and the Reputation Advantage sets starting rep as `0432` says (GQ7) | Rule or shape (player sheet, app bump) | Reading `0432` for GQ7's how (read: Reputation and Burned, W161) | **Built** in app 0.73.0 (Decisions 295, 296; game data 0.59; F37 closed): [`gm-mode-next/S25-crank.md`](gm-mode-next/S25-crank.md), W161 folded in |
| **S26** | **A session's record.** A session can have a name (W73); a session copied out as Markdown (W86, Deighton's ask); printing a cast member, an encounter and a session's journal (W84, the first plan's S13b) | Rule or shape (table schema for the name) | Nothing | **Built** 2026-11-19 in app 0.74.0 (Decisions 303–305): [`gm-mode-next/S26-session-record.md`](gm-mode-next/S26-session-record.md) |
| **S27** | **Reference+.** Skills, Powers and Equipment as Reference panels beside the thirteen (GQ29, Scott 2026-11-03, as Deighton asked) | Content + shape | Nothing | **Built** 2026-11-27, app 0.81.0, Decision 322 (all defaults, GQ86–GQ94; Ken): [`gm-mode-next/S27-reference-plus.md`](gm-mode-next/S27-reference-plus.md) (also records the mirror check: pack and Reference match `c99bb58`) |
| **S28** | **The cast reads at a glance.** The cast list shows each member's stat block (W78); Origin and Enemy role look like what they do (W81); the cast's crew lines as buttons too (W142); what's left of W77. Whether to add how well a cast member knows each of the crew (W68) is GQ31 | Rule or shape | U3's read view (built) | **Built** 2026-11-20, app 0.75.0, Decisions 308–310 (all defaults: GQ31, GQ81–GQ85; Ken): [`gm-mode-next/S28-cast-at-a-glance.md`](gm-mode-next/S28-cast-at-a-glance.md) |
| **S29** | **Home's rest.** Home's empty left column (W80: S18 left it, SQ5); a GM's first screen is the one surface U1–U5 didn't touch | Fix (UI) | Nothing | No order yet |
| **S30** | **Notes, at the table and on the sheet.** A note gets a category and tags, and Notes groups by category or session and filters by a tag (W140). Ken (2026-11-27) extended it to the player's Notes tab: one note shape and one list for both, in **two PRs**: PR 1 GM mode (table schema), PR 2 the sheet (W55; character schema) | Rule or shape (table schema, then character schema) | Nothing | **Built** 2026-11-27, app 0.81.0: PR 1 (GM mode, Decision 323) and PR 2 (the sheet, Decision 324, character schema 0.36). Ken approved GQ95–GQ100 on their defaults: [`gm-mode-next/S30-notes.md`](gm-mode-next/S30-notes.md) |
| **S31** | **Help on every page.** A **?** in the header and the `?` key open a panel for the page that's open: what it's for, when in a night you'd use it, its words and a tip; *A night at the table*; every word GM mode uses, defined once; a guide line under each section; empty states that teach. Deighton's ask (via Ken, 2026-11-11): he couldn't tell how, why or when to use much of GM mode. The help's words go to Deighton as a page before the build | Rule or shape | **Deighton**: his read of the help's words (GQ39), which land on the PR before it merges | **Built** in app 0.67.0 (Decision 278): [`gm-mode-next/S31-help.md`](gm-mode-next/S31-help.md) |
| **S12a** | **Supernatural Orders:** the seven Orders and their modifiers in the builder (GQ17 approved 2026-10-10) | Content | **Scott**: the Orders table, with its Profile and Formation columns, moved from `WIP_Threat_Codex_v2` into the mirrored `2610` | Waiting on Scott |
| **S17** | **The Codex's Shared Rules and card format:** a swarm takes at most 1 from a single-target attack; an NPC parries with the weapon's skill plus its Parry; social checks against Difficulty 15, and the Free, Fast and full Action, as a Reference panel; and each entry's Tag line, Role line and Hook on its Threats card. GQ22's trait names ride with it | Content + shape | **Scott**: `2612`'s entries in v2's format. The pack builder follows first (a Fix in `private/`, Y0's size), then this | Waiting on Scott |
| **S11** | **CRANK work,** split 2026-11-18. **S11a, the Job Generator:** `2625`'s five d10 tables, rolled or picked in the Sessions tab, a contract saved as a thread, and the tables on the Reference (Ken, 2026-11-18). **S11b, the jobs board:** a job record, its payout in the award log, not a dispatch (GQ20), and the walk-out a client caused; the board is the GM's, not a list players browse | Rule or shape (S11a); Content + shape (S11b) | `2625` confirmed: the 2026-10-22 mirror is the revision, unchanged in the 11-15 refresh | **S11a built** in 0.73.0 (297; GQ54–GQ59 all on their defaults): [`gm-mode-next/S11a-job-generator.md`](gm-mode-next/S11a-job-generator.md). **S11b built** in 0.73.0 (302; GQ67–GQ74 all on their defaults; the board is W172): [`gm-mode-next/S11b-jobs-board.md`](gm-mode-next/S11b-jobs-board.md), a job settled at the close-out rather than a jobs record (GQ67) |

Each session's order goes in `plans/gm-mode-next/` when it's drafted, through the loop in
`WORK-ORDERS.md`. The first plan's session drafts (S11, S12, S17) are in `archive/gm-mode.md` §6, *What's left*.

## 4. What's left for Scott

Things to do, not questions; he tells Ken when one is done, and the session that hears it ticks it here.

| To do | Unblocks | Done |
|---|---|---|
| Run a session on the live version and say what got in the way | S22, and the order of everything after it | |
| Move the Orders table, with its Profile and Formation columns, from `WIP_Threat_Codex_v2` into the mirrored `2610` | S12a | |
| Bring the entries in `2612` into v2's format (Tag, Role and Hook lines, the Shared Rules section); fix GQ22's eight trait names while he's there, or say they stay | S17 | |
| Approve the fifteen Site Profiles, or say what changes (2026-11-03: not yet; the pack keeps its draft label) | the label comes off | |
| Send the revised `2625` | S11 | Ticked on his page 2026-11-03; confirmed 2026-11-18: the 10-22 mirror is the revision |
| Send Cerulean Nights (the font file) and his artwork: the wordmark with its text outlined, the LUCK glyph, the silhouettes | the print restyle (PQ1, PQ2) | |
| Revise the Book of Known Spells to TN 7 on Watchword, Sure Grip, Everlight and Hearthstone (the app already uses 7) | nothing in the app | |
| Origins, spheres and implements: the four-way talk with Deighton, Bill and Ken | the Arcanist's Origins leaving `draft`; not blocking | |

## 5. Questions

The first plan's GQ table stays in `archive/gm-mode.md` §9 with every answer as given. Still open from it:

| # | Question | For | Default |
|---|---|---|---|
| GQ5 | Is the Origin Matrix's 7 × 8 concept grid canon, and with which origins? | Scott | Not in the app until it's in the Codex |
| GQ7 | How does the Reputation Advantage set a character's starting CRANK rep? | Ken, from `0432` | **Built** in S25 (Decision 296): its ranks start rep at 5, 12 and 20 |
| GQ22 | Eight trait names on entries aren't in the glossary under that name (`archive/gm-mode.md` §9) | Scott | Keep the names as printed; goes with S17 |
| **GQ31** | **Should a cast member record how well they know each of the crew** (a face, a regular, a name: W68)? It's a new stored field | Ken | **Answered** 2026-11-19 on its default, not built (Ken): [`gm-mode-next/S28-cast-at-a-glance.md`](gm-mode-next/S28-cast-at-a-glance.md) §4 |
| **GQ43–GQ47** | S24's: the roster's low TOLs, a WILL below its floor, what carries, how the GM heals, when a row takes its wounds | Ken | **Answered** 2026-11-16, each on its default (Ken), in [`gm-mode-next/S24-npc-rules.md`](gm-mode-next/S24-npc-rules.md) §4 |
| **GQ48–GQ53** | S25's: rep's floor against Burned, how the start is written, old Reputation ranks, the close-out's absent line, halved payouts, Reputation after creation | Ken | **Answered** 2026-11-18, each on its default (Ken), in [`gm-mode-next/S25-crank.md`](gm-mode-next/S25-crank.md) §4 |
| **GQ54–GQ59** | S11a's: whether the app rolls, where the generator lives, one contract or several, a contract as a thread, a tier on it, and S11b | Ken | **Answered** 2026-11-18, each on its default (Ken), in [`gm-mode-next/S11a-job-generator.md`](gm-mode-next/S11a-job-generator.md) §4 |
| **GQ60–GQ66** | S23's: W145 left out, the Reset's key, the Hit panel's Apply, Add above the list, a member's line add, the open session on Sessions, the name block on every tab | Ken | **Answered** 2026-11-18 (Ken): GQ61–GQ66 on their defaults, GQ60 "Pick Lucide icons now", in [`gm-mode-next/S23-leftovers.md`](gm-mode-next/S23-leftovers.md) §4 |
| **GQ67–GQ74** | S11b's: a job at the close-out or a jobs record, how a job ends, the split, who can be on it, its thread, the client's breach on the sheet, a tier on it, and the board | Ken | **Answered** 2026-11-18, each on its default (Ken): [`gm-mode-next/S11b-jobs-board.md`](gm-mode-next/S11b-jobs-board.md) §4 |
| **GQ75–GQ80** | S26's: how a named session reads, how a page prints, which way up, copy or save the Markdown, its order, and which pages print | Ken | **Answered** 2026-11-19, each on its default (Ken): [`gm-mode-next/S26-session-record.md`](gm-mode-next/S26-session-record.md) §4 |
| **GQ81–GQ85** | S28's: what a cast card shows, Health on a hurt member's card, Origin and Enemy role as buttons, a line's crew as buttons alone, and the add row's crew after Add | Ken | **Answered** 2026-11-19, each on its default (Ken): [`gm-mode-next/S28-cast-at-a-glance.md`](gm-mode-next/S28-cast-at-a-glance.md) §4 |
| **GQ86–GQ94** | S27's: a newer mirror than `c99bb58` (answered: no), what Powers covers, how much Equipment and in how many panels, "has this gear" per character, a flagged entry, the panels' order, the Recovery panel's missing With Skill actions, keeping the audit's scripts as guards, and marking two weapon tags as rulings ahead of the book | Ken | **Answered** 2026-11-20, all defaults: [`gm-mode-next/S27-reference-plus.md`](gm-mode-next/S27-reference-plus.md) §4 |
| **GQ95–GQ100** | S30's: the sheet's free notes, a player's note's session, what the sheet logs, whether the GM reads a player's notes, Group by's default, and what prints | Ken | Answered, every default (2026-11-27): [`gm-mode-next/S30-notes.md`](gm-mode-next/S30-notes.md) §4 |

## 6. S23's leads

From the GM-at-the-table reviews, each outside the session that met it: that plan's *Leads after U5* (U2's and U4's
re-critiques) and U5's review. Line numbers are `main` after #313. S23's pre-flight re-checks each one: a lead marked
*critique* came from a scoring pass and nobody has reproduced it yet.

**Fixes (reproduced in review):**

- After a redraw that loses focus (the toast's Undo, Ctrl/⌘+Z), focus lands on the **first** clock's −, not the one that
  changed, so the next Enter changes the wrong clock: the steppers carry no id (`gm.js:1934`, `:1948`, `data-clkminus` and
  `data-clkplus` empty), so `keepPlace` finds the first. Predates U5; costs H9.
- An encounter step's audit label is the encounter's name: every Next logs "Changed Achterberg's clinic, moonrise"
  (`engine.js:6900`), so "Undone: …" and Activity can't say what came back.
- phone-check's `tabOut` ignores the tab row's bottom edge (`tools/phone-check.mjs:276`).

**Fixes (from the critiques; check first):**

- Activity opens with focus on its "Undo: …" (`gm.js:662`), so `A` then Enter is an undo.
- "Ctrl/⌘" shows on every platform in the Keys list (`gm.js:348`); show the one this machine has.
- The keys are invisible outside ⋮ → Keys: no hint on the tabs or on Next (H6 at 2).
- Each section's only `h1` is the table's name, so a heading jump has no section heading to land on.
- The running fight's card on Encounters looks like the planned ones.
- The dossier's prose (`p.dos-p`) runs 98–100 characters a line at 1024px.
- The bar's chips truncate at 1024 on a dossier beside a long "Add to encounter: …" button.
- On a phone the Tonight strip drops **Down** whenever the fight leads (U2's H1 gap; Ken: a lead, not a reopening of
  *Fight first*), and a clock at 7 of 8 has no urgency colour.
- The strip's `.74rem` type; the award log's ceremony (IP as a gold readout); close-out's focus on a pressed attendance
  toggle; "Close to full" counting 2 of 4.
- Modal titles in the display face (`.modal-head h2`); a seat card's dim SAN / Luck / Çredits (DESIGN.md names it as a
  known gap); a raw TAG shown as a seat's name; Threats' "Slot in a pack" button.

**From U3's review** (outside U3's order; `gm.js` lines at `2f0f4b5`):

- The stat block reads off-voice: grey Roboto Mono figures, no green or magenta on modifiers, where DESIGN.md's four
  voices want Oxanium (`readBlockHtml`, `gm.js:3073`; Threats uses it too).
- "book: N" under TOL and WILL isn't explained anywhere (`gm.js:1170`, and `readBlockHtml`'s rows at `:3077`). S24 changes
  what it means, so it may land there instead.
- The read view and the form order their fields differently (read: want, pushed, line, clocks, got; the form from
  `gm.js:1069`: want, got, line, pushed), and Debrief sits after Close-out when read but before it in Edit
  (`sessionReadHtml`, `:2430`). H4's remainder.
- A note's Edit is at its foot, where every dossier's is beside the name (`noteCardHtml`, `gm.js:442`).
- Edit lands focus on Status, not Name: `bindEdit` takes the first field (`gm.js:426`), and the member form's first is the
  Status select (`:1069`).
- A member clock's owner link opens the faction with "Back to Factions", losing the member page you came from
  (`bindClockLines`' `[data-cown]`, `gm.js:1974`, through `openFound`).
- "Attention: Active" is a plain tag, not a Mono Caps label over a value (`factionReadHtml`, `gm.js:2068`), and "Key to"
  isn't explained (`castKeyToHtml`, `:2111`).
- Test gap: U3's session test un-presses only `[data-crew-name]`, and Dead Air's names are seats, so `if (pressed)` skips
  silently (`tests/smoke-table-play.test.mjs:2703`). Use the seat selector and assert it was found.
- Guard gap: phone-check's L8 cast walk now runs on the read view, where `statusUnderName` is trivially true
  (`tools/phone-check.mjs:424`). Measure it in Edit, or retarget it.

**Ken's call, raised in S23's order (each changes a behaviour someone chose):**

- At a round's reset, `N` does nothing and nothing says why (`gm.js:3826` draws no Next while `atReset`), and on a phone
  Finish the round is below the fold. Option: Finish the round takes Next's place, and `N` presses it (272 in part).
- The Hit panel's Apply above its modifiers (UQ24's order).
- Cast and Players open on their Add form above the list (*critique*; U3 put Add below the content, so check which pages).
- A member's read view keeps the crew-line add row open, about 14 tab stops between Clocks and the GM note
  (`castInteractionsHtml`, `gm.js:998`). Fold it behind "Add a line" below the list (179 kept it open).
- The Sessions tab leads with Next session while a session is open, and the list doesn't mark the open one
  (`sessionsTabHtml`, `gm.js:2371`; `nextSessionHtml`, `:2319`).
- On a phone the first screen of every list tab is chrome: the table's name and "created" block repeats on every tab
  (`gm.js:565`), and on Cast at 375px the first card starts near 850px, under quick-add and three filter rows.
- Ctrl/⌘+Z reaches across sections, by design (272; the Keys line says "on any page"). Revisit only if GMs report it;
  the cheap middle is a toast that names the section.

**S23's verdicts** (built 2026-11-18, app 0.73.0). Each lead above, by what the builder found:

- **Built:** the clock steppers' ids; an encounter step's audit label (Next, Start, Delay, Act now, rows, Conditions, the opening);
  phone-check's `tabOut` and `statusUnderName`; U3's session test; Activity's focus (its heading); Ctrl or ⌘ (`modKey`); a key hint
  on the tabs and Next (`title`, with `aria-keyshortcuts`); a section heading to jump to (an unseen h1 that names the section, on
  every tab but Sessions); the running fight's card; the dossier's prose at 70ch; a clock one segment from full in magenta; the stat
  block's figures in Oxanium with green and magenta modifiers; a note's Edit beside its name; Edit on a member landing on Name; a
  member clock's owner link going Back to the member; Attention as a label and "Key to" explained; a seat's SAN, Luck and Çredits at
  full strength; Add below the list on Cast and Players (GQ63, reproduced on both); GQ61, GQ64, GQ65, GQ66.
- **Partly:** the bar's chips beside a long "Add to encounter: …" at 1024px: the button now gives way first (13rem, its full words in
  a `title`), but four chips and a Back still don't all fit. The remainder is **W170**.
- **Down on a phone** (not Decision 270's: Ken said a lead, not a reopening of *Fight first*): kept on a tab's own bar, where it fits at
  375px (`.tn-bar .tn-item.tn-down`). On a page's bar the strip holds a fixed 14rem, and measured at 375px a third chip cut the lead
  and Unexported to stubs (the lead measured 96px, Down 37px). Left hidden there: **W170**.
- **Not reproduced:** close-out's focus after a pressed attendance toggle (focus stays on that seat's button); the award log's gold IP
  readout (a taste call, no defect found).
- **Left, by Decision 270:** "Close to full" counting 2 of 4 (270: within two segments).
- **Left, the builder's own call:** the strip's `.74rem`. Not changed: 11.1px passes phone-check's 11px floor, and a larger size
  widens chips that already cut.
- **Moved, each to a wish:** a raw TAG as a seat's name (**W165**, reproduced; Ken's answer, "<player>'s character" with the TAG beneath, is **W171**); "formula" under TOL and WILL (**W166**); the read
  view's field order and Debrief against Close-out (**W167**, which reopens 271); modal titles in the display face (**W168**, shared
  with the sheet's dialogs); Threats' "Slot in a pack" (**W169**, voice).
