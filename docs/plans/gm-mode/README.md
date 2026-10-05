# GM mode — work orders

The plan is [`../gm-mode.md`](../gm-mode.md): what GM mode is, its shape, its
sessions and their order, and the open `GQ` questions. This folder holds
**work orders**: one per session, each detailed enough for a coding session to
build it without making a design choice of its own.

## The cadence

1. **An orchestrating session writes the next work order** (Opus): reads the
   plan, the code as it is now, and what the last session actually built, and
   drafts the session's decisions in full.
2. **Ken reads and approves it.** The work order *is* the proposal that
   `CLAUDE.md`'s *Rule or shape* tier asks for. Ken edits it, answers its
   questions, or sends it back. Nothing is built from an unapproved order.
3. **A building session runs it** (Sonnet), in a fresh session, on a branch,
   following `CLAUDE.md` and the order's steps, and **opens a PR without
   merging it**.
4. **The orchestrating session reviews the PR against the order** (its
   *Review checklist*), runs the thing, and either approves or lists fixes.
   The same session then writes the next order, using what it learned.
5. Fixes go back to a building session; Ken merges.

Review sits **before** the merge. It costs much less than the build, and it's
where a missed decision or an untested guard gets caught.

**Prompt for a building session** (paste as the first message):

> Read `CLAUDE.md`, then `docs/plans/gm-mode/<order>.md`, and build it. Follow
> its steps in order and its *Stop and ask* list exactly: if something isn't
> covered by the order, stop and ask me rather than choosing. Open a PR when
> its *Done when* is met; don't merge it.

## Running more than one at once

Don't, until the cadence is routine. These sessions share `engine.js`,
`shadows-data.js`, `sheet.js`, `app.js`, the decision ledger, the versions,
STATE and the changelog, and most of them depend on the one before. When two
can run together, the order says so, and the orchestrator reserves their
decision and flag numbers in advance and does the bookkeeping merge.

## The orders

| Order | Session | Status |
|---|---|---|
| [S01-crank-rep.md](S01-crank-rep.md) | S1 — CRANK reputation on the sheet | **Built 2026-10-05**, PR open for review |
| S3a | The table file | Next to write, after S1 is reviewed |

## What a work order contains

Every order has these sections, in this order. An order that can't fill one
isn't ready to hand over.

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
8. **The UI.** Where each thing goes, what it reuses, and its copy (drafted,
   marked for a voice pass).
9. **Tests.** By file and name, hostile cases included, and which guards to
   mutation-test.
10. **Steps.** In order, with a `npm run verify` checkpoint after each.
11. **Stop and ask.** The conditions that end the session early.
12. **Close-out.** The `close-the-session` skill's items for this tier, the
    changelog lines, the PR title.
13. **Review checklist.** What the orchestrator checks in the PR, beyond the
    tests passing.
