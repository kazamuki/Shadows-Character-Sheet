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
   *Carried over* note.
6. Fixes go back to a building session as one pasted prompt; the
   orchestrator reviews the fix commit the same way; Ken merges. The same
   session then writes the next order, using what it learned.

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
| [S03a-table-file.md](S03a-table-file.md) | S3a — The table file, its gate and Home's door, behind the feature switch | **§4 answered 2026-10-05**; rewritten around the switch (173), awaiting Ken's approval |
| S8 | The cast | Next to write, after S3a is reviewed |

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
