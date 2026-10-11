# GM mode — work orders

The plan is [`../gm-mode.md`](../gm-mode.md): what GM mode is, its shape, its
sessions and their order, and the open `GQ` questions. This folder holds
**work orders**: one per session, each detailed enough for a coding session to
build it without making a design choice of its own.

## The cadence

1. **An orchestrating session writes the next work order** (Opus): reads the
   plan, the code as it is now, and what the last session actually built, and
   drafts the session's decisions in full.
2. **It pre-flights the order against the code** before Ken sees it (below).
   S1's review found five problems and all five were the order's, not the
   build's: a building session that follows an order exactly builds its
   mistakes exactly. The pre-flight is where those get caught for the price of
   a grep instead of a fix round.
3. **Ken reads and approves it.** The work order *is* the proposal that
   `CLAUDE.md`'s *Rule or shape* tier asks for. Ken edits it, answers its
   questions, or sends it back. Nothing is built from an unapproved order.
4. **A building session runs it** (Sonnet), in a fresh session, on a branch,
   following `CLAUDE.md` and the order's steps, and **opens a PR without
   merging it**.
5. **The orchestrating session reviews the PR against the order** (its
   *Review checklist*), and **runs it in a browser**, not only the tests: S1's
   worst bug passed every test, because the tests checked that the tip opened
   and nothing checked that the card still did. It re-runs the PR's mutation
   tests itself, then either approves or lists fixes. Each fix is marked as
   the order's or the build's: the order's go into the next order's
   *Carried over* note. A fix that changes what the order specified, not
   just how it was built, is Ken's call: the review recommends it, and it
   goes into the prompt once he agrees (S9a's Back to the cast member).
   When the order builds a shape that later content will fill (a file
   kind, a data section), the review also checks that shape against the
   content's source, since the session that fills it is meant to need no
   code (S9a's pack against the Codex).
6. Fixes go back as one pasted prompt **to the session that built the PR**:
   it already knows the code it wrote (S8a's knew `signed` was taken).
   Write the prompt self-contained anyway, and start a fresh session only
   if that one has been compacted or closed. The orchestrator reviews the
   fix commit the same way; Ken merges.

   A decision in a PR that **hasn't merged** is reworded in place by the fix
   round, never superseded: nothing has cited it yet (S8a's 176). Once
   merged, the ledger's supersession rules apply.

7. **Only then does the same orchestrating session write the next order**,
   from `main` with the last PR merged (Ken, 2026-10-06). Never while
   that PR is open, for three reasons:
   - its *Carried over* note is what the fix round actually changed, not
     what the review expected;
   - its pre-flight reads the code it will be built from, with no "re-run
     once #N merges" step;
   - its README row, STATE line and decision numbers can't collide with
     the open PR's.

   S9a was the last order drafted early.

Review sits **before** the merge. It costs much less than the build, and it's
where a missed decision or an untested guard gets caught.

**The orchestrator reviews against its own assumptions**, which is a blind
spot that running the app only partly covers. Before the release that
switches GM mode on for everyone (Decision 173), GM mode gets one
**fresh-context review** as a whole (the adversarial review, once per batch).

## Shipping while unfinished

GM sessions merge to `main` like any batch, **switched off**: `FEATURES.gm`
is `false`, so a player's app is unchanged and releases go on as usual. Ken
and Scott turn it on in their own browser by opening the app with `?gm=on`
(and off with `?gm=off`); it stays on across reloads. The release that sets
`FEATURES.gm` to `true` is GM mode's launch: a minor bump, with the lines
collected in [`changelog-pending.md`](changelog-pending.md) moved into
`CHANGELOG.md`. Until then a GM-mode session bumps no app version unless a
player could see its change switched off, and the table schema bumps with a
`migrateTable()` step on every shape change, launched or not. (Ken calls
this a feature flag; it's a *switch* here because *flag* already means an
F-numbered rules question.)

### The pre-flight

Before an order goes to Ken, the orchestrator checks it against the code at
the commit it'll be built from, and records the commit and anything it found
in the order's header:

- **Every claim a decision makes is true of the code**, or the order builds
  it: every control, function, guard and behaviour it names ("Admin
  corrects anything else" was false in S1).
- **Every function, helper, list and test the order names exists and does
  what the order says.** Open it and read it; don't trust the name
  (`_schemaBefore` reads `schemaVersion`, whatever you pass it).
- **Every guard that lists files by hand** gets any new file added (S3a:
  `CODE_FILES`).
- **The ledger is searched for every UI element, field and file the order
  moves**, not just its topic, and each hit is either cited or marked
  superseded. *Replaces: nothing* is a claim to check (S1 missed 165).
- **Each mutation test is checked for a second path** that already covers
  the line (S1's `_fillDefaults`).
- **Every test the order changes or might break** is found by grepping for
  what it touches (a label, a class, a key).

### How exact to be

- **Exact** for shapes, data keys, the saved file, function signatures,
  decisions, tests and versions. Those are where a building session's guess
  costs most.
- **Behaviour, not markup, for interaction.** Say what a tap, a key or a
  focus change must do ("tapping the card opens its popover; the tier table
  is a tap away"), and give markup only as a suggestion. An order that
  dictates markup passes its interaction bugs through intact (S1's tip
  inside a button).
- **Where things land.** For every press that changes a status, a filter
  or a view, the order says where the record ends up and where focus goes,
  in one table. S8a specified its status and its filter apart, and a member
  marked Missing vanished on Back; only the browser review caught it.
- **What a refused or empty value shows.** A field the gate refuses shows
  what was stored once it loses focus; an empty row is either not added or
  doesn't count as filled. Say which (S8a's tier field, its blank rows).
- **Proof at phone width** is metrics when the screenshot tool times out,
  as it does here: the document's `scrollWidth` against `clientWidth`, and
  no element in `main` past the viewport's right edge.
- **Size the order to its tier.** A *Rule or shape* order earns all
  thirteen sections. A *Content* or *Fix* session (S13, S12) gets a page:
  goal, tier, scope, tests, review checklist.

**Prompt for a building session** (paste as the first message):

> Read `CLAUDE.md`, then `docs/plans/gm-mode/<order>.md`, and build it. Follow
> its steps in order and its *Stop and ask* list exactly: if something isn't
> covered by the order, stop and ask me rather than choosing. Where the order
> and the code or the ledger disagree in a way that doesn't stop you, build
> what the order says and list it in the PR under *Where the order didn't fit*.
> Open a PR when its *Done when* is met; don't merge it.

## Running more than one at once

Don't, until the cadence is routine. These sessions share `engine.js`,
`shadows-data.js`, `sheet.js`, `app.js`, the decision ledger, the versions,
STATE and the changelog, and most of them depend on the one before. When two
can run together, the order says so, and the orchestrator reserves their
decision and flag numbers in advance and does the bookkeeping merge.

## The orders

| Order | Session | Status |
|---|---|---|
| [S01-crank-rep.md](S01-crank-rep.md) | S1 — CRANK reputation on the sheet | **Built and reviewed 2026-10-05**, merged in PR #111 after one fix round |
| [S03a-table-file.md](S03a-table-file.md) | S3a — The table file, its gate and Home's door, behind the feature switch | **Built and reviewed 2026-10-05**, merged in PR #113 after one fix round (focus, wrapping, the launch test, the notes copy) |
| [S08a-cast.md](S08a-cast.md) | S8a — The cast: the record, the stat block, the Cast tab | **Built and reviewed 2026-10-05**, merged in PR #115 after one fix round (the *In play* default and status order, refused numbers, blank rows, trimmed roles). The plan's S8 is split: S8b is interactions; Keep and Promote move to S10 |
| [S08b-interactions.md](S08b-interactions.md) | S8b — Who knows what: interactions, affiliations, the crew's view | **Built and reviewed 2026-10-05**, merged in PR #117 after one fix round (a line with no crew name reachable, the What draft kept, Back keyed by crew name, the removed name spoken, wrapping rows). History moves to a later session (SQ1) |
| [S09a-pack.md](S09a-pack.md) | S9a — The pack: a file a GM slots in, and the Threats tab | **Built and reviewed 2026-10-06**, merged in PR #119 after one fix round (roles labelled on an entry's page, a group's composition on its card, the filters two to a row on a phone, the tier as a tip, Back to the cast member, the `TIPS` guard). The plan's S9 is split: S9b is the builder, S9c the real Codex pack |
| [S09b-builder.md](S09b-builder.md) | S9b — The builder: a cast member's page that reads the pack | **Built and reviewed 2026-10-06**, merged in PR #121 after one fix round (a blank trait row not counted, a hostile assertion that could fail, and a Use copy saying the book's stats already include its origin) |
| [S09c-codex-pack.md](S09c-codex-pack.md) | S9c — The Codex pack: the real book, built from the mirror | **Built and reviewed 2026-10-06**, merged in PR #123 after one fix round (the ledger's rename and retire refuse what would lose an id, gear one line per item, the ⚠ marks stripped, and 187's dedupe). Released switched off in v0.37.0. GQ22 is Scott's |
| [S10a-encounter.md](S10a-encounter.md) | S10a — The encounter: who's in it, whose turn, and what's still on them | **Built and reviewed 2026-10-07**, merged in PR #126 after one fix round (Dying at Reset follows F24's stub, the turn tracks who has acted, `setTurn` refuses at Reset, the tab's listeners released off the table); drafted 2026-10-06 after #123 merged and v0.37.0 released (step 7); **SQ1–SQ10 answered by Ken 2026-10-07** (an encounter of no type, any number planned and one running; HP, Health Levels and Pain shown together). The plan's S10 is split: S10b is the hit pipeline, armor numbers, traits as reminders, Keep and Promote |
| [S10b-hit.md](S10b-hit.md) | S10b — The hit: an NPC takes damage the way a player does | **Built and reviewed 2026-10-07**, merged in PR #128 after two fix rounds (armor wear stored with the piece it was taken on, `armorId`; the Hit panel's groups named; Decision 189's *Revisit if* restored, and a supersession mark no longer counts toward the 350 words; no F38, since 053 answers scrap armor); Decisions 191–192, table schema 0.6, switched off; drafted after #126 merged; **SQ1–SQ9 answered by Ken 2026-10-07** (SQ2: 053's static enemy armor is the PROT die's average rounded up plus RES; SQ5: a PC row takes a hit too, after armor). S10 splits again: S10c is the encounter's end (Keep, Promote, the history line) |
| [S10c-encounter-end.md](S10c-encounter-end.md) | S10c — The encounter's end: who's kept, and what the cast remembers | **Built and reviewed 2026-10-07**, merged in PR #130 after one fix round (wear lists anyone *struck*, by the armor or the body; *killed* only when the wrap-up kills; a linkless cast row renders) (Decision 193, table schema 0.7, switched off; the Thrall's armor line stripped in `private/`); drafted after #128 merged; **SQ1–SQ8 answered by Ken 2026-10-07** (wounds don't carry for now, GQ26; the history line is a *fought* interaction; Keep, labelled *Keep as a cast member*; the wear roll a reminder; every PC in the room is the line's crew). W68 raised: how well a cast member knows each of the crew |
| [S05a-sessions.md](S05a-sessions.md) | S5a — Sessions and threads: what happened, and what's still open | **Built and reviewed 2026-10-08–09**, merged in PR #138 after two fix rounds (*last session* skips tonight's session and any dated later; Resolved ↔ Dropped keeps the GM's *Closed in*; Next session never a heading over nothing; Back names the session) (Decisions 203–204, table schema 0.8, switched off; the order's 194–195 were taken by 0.38.0 and 0.39.0). **SQ1–SQ9 answered by Ken 2026-10-08**; GQ27 for Scott. The plan's S5 is split: S5b is the close-out |
| [S05b-close-out.md](S05b-close-out.md) | S5b — The close-out: what each character got, written down | **Built and reviewed 2026-10-09**, merged in PR #141 after one fix round (a typed IP kept when *Who was there* is corrected a letter at a time; Redo lets an IP that still matches the hours follow them; an off-screen job needs a tier; the away line says *no session to log*) (Decisions 205–206, table schema 0.9, switched off). Ken's answers SQ1–SQ10 (2026-10-09): IP rounds up at 5 an hour, the GM picks an absent name's tier and the next close-out remembers it, Legendary's off-screen range is 10,000–15,000 (GQ28 for Deighton), absent means seen at an earlier session until S3b's seats, the pay is typed, not rolled. *Away tonight* listing everyone ever seen is a known limit for S3b |
| [S13a-reference.md](S13a-reference.md) | S13a — The Reference: the rules a GM looks up, on one page | **Built 2026-10-09** (Decision 207, switched off), after #141 and #143 merged; **SQ1–SQ8 answered by Ken 2026-10-09** (a **Reference** tab after Encounters, not *Screen*; one search and a sticky jump bar; the book's Quick Reference and check table in the data, verbatim, with a conformance test; thirteen panels, Conditions and the Codex first; a minus is a minus, and the search folds `−` to `-`; the Reference only, printing is S13b, W84) |
| [S14-secretary.md](S14-secretary.md) | S14 — The secretary: Find, one search over the whole table, and Jot, a line kept as a note with its session (W85) | **Built 2026-10-09** (Decision 208, table schema 0.10, switched off), after #144 merged, from Deighton's answers (§1a); Ken chose it over S6, turns by side and the Reference's additions. **SQ1–SQ8 answered by Ken 2026-10-09: every default** (Find and Jot as words in the header; every word, any order; two characters at least; a jot takes today's one session; no shortcut key) |
| [S10d-sides.md](S10d-sides.md) | S10d — Wave Initiative: sides that act in turn, best Combat Sense first (`0530`'s "as sides, in waves"; Deighton's wave initiative, §1a) | **Built 2026-10-09** (Decision 210, table schema 0.11, switched off; SQ8–SQ12 on their defaults); drafted 2026-10-09, after #146 and #147 merged; Ken chose it over S6, W86 with W84, and the Reference's additions. Decision 210 and table schema 0.11 reserved; GQ30 for Deighton. **SQ1–SQ7 answered by Ken 2026-10-09** (one at a time by default; the best Combat Sense picks the side; more than two sides, moved by a select; a cast member can fight with the crew; *Wave Initiative*, with a tip); **SQ8–SQ12 accepted on their defaults by Ken** (SQ8 with the review's refinement: an acted row still counts toward its side's best). Merged in PR #149 after one fix round (a side's wave not split by an acted row going Out; the Turns toggle out of the sticky bar; a no-op mode press writes nothing) |
| [S10e-add-to-fight.md](S10e-add-to-fight.md) | S10e — Adding to a fight: Add to always on screen, the Codex searchable inside an encounter, Add on a Threats card (W74, W75, W76) | **Built 2026-10-10** (Decision 211, switched off), merged in PR #151 after one fix round (groups found by their origin, the Codex search in pack order, `addToEncounter` refusing a non-table); drafted 2026-10-09 after #149 merged; Ken chose it over table undo (W83), export and print (W86 with W84) and the gazetteer (S6). Decision 211 reserved; no table schema bump. **SQ1–SQ5 answered by Ken 2026-10-09: every default** (the running encounter, then the newest planned, then a new one; a card's Add to cast stays on the list; the Codex search from two characters, 25 shown; threats, people and groups in one list; the new encounter named in the notice) |
| [S15-table-undo.md](S15-table-undo.md) | S15 — The table's memory: an activity log, with undo (W83) | **Built 2026-10-10** (Decision 212, table schema 0.12, switched off), merged in PR #153 after three fix rounds (a field's change on blur no longer an entry of its own; a block of records in or out one op, and records matched by id when a list also changed inside, so End stays under 4 KB; a label names only what came and went; a burst folds by its paths, not a label rebuilt from the clock); drafted 2026-10-10, after #151 merged; Ken chose it over the interaction sentence (W79 with W82), the GM layout (W80, W77, W78), and export and print (W86 with W84). Decision 212 and table schema 0.12 reserved. **SQ1–SQ7 answered by Ken 2026-10-10: every default** (a toast and Activity in the menu; typing folds; 500 kept; deletes still ask; the trail in the file; computed labels; no redo) |
| [S16-interaction-sentence.md](S16-interaction-sentence.md) | S16 — A line reads as a sentence, and a fight's line leads to its fight (W79, W82) | **Drafted 2026-10-10**, after #153 merged; Ken chose it over Supernatural Orders (S12a), the GM layout (W80, W77, W78), and export and print (W86 with W84). Decision 213 and table schema 0.13 reserved. **SQ1–SQ8 answered by Ken 2026-10-10: every default** (a sentence with Edit on a member's page; *Bob owes Scott*; old fight lines left as written; Back returns to where the tap came from) |

## What a work order contains

Every order has a header (plan link, status, branch, what it runs beside,
**the pre-flight's commit and findings**, and a *Carried over* note of what
the last review found in the last order), then these sections, in this
order. An order that can't fill one isn't ready to hand over; a *Content* or
*Fix* order may fold them down (see *How exact to be*).

1. **Goal and Done when.** What a player or GM can do afterwards, and the
   observable checks that prove it.
2. **Tier, versions, numbers.** The change tier, each version bump, and the
   decision and flag numbers reserved for it.
3. **Decisions, drafted in full.** In the ledger's shape, ready to paste. The
   building session doesn't write a decision; it pastes and fills *Built*.
4. **Questions for Ken.** Anything the order defaults that Ken might not
   want, each with its default. Answered before the build starts.
5. **Read first.** The `CLAUDE.md` rules, SCHEMA sections, files, functions
   and primitives that matter, by name.
6. **Out of scope.** What the session must not do, even if it looks nearby.
7. **The shapes.** Data keys, the saved-file field, `migrate()`, the engine
   functions with their signatures and what they return on bad input.
8. **The UI.** Where each thing goes, what it reuses, what each interaction
   must do (behaviour, not markup), and its copy (drafted, marked for a
   voice pass).
9. **Tests.** By file and name, hostile cases included, and which guards to
   mutation-test.
10. **Steps.** In order, with a `npm run verify` checkpoint after each.
11. **Stop and ask.** The conditions that end the session early.
12. **Close-out.** The `close-the-session` skill's items for this tier, the
    changelog lines, the PR title, and the PR body's sections, always
    including **Where the order didn't fit** (empty is a fine answer).
13. **Review checklist.** What the orchestrator checks in the PR, beyond the
    tests passing.
