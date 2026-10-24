# Work orders and the three-session loop

How a planned change gets built here: a **work order** drafted and approved
first, then a **builder** session and a fresh **reviewer** session, run by a
**conductor** session that Ken talks to. `CLAUDE.md`, *How Ken and Claude work
together*, says which work goes through it; this file says how. The
conductor's steps, as a runbook, are the `run-a-work-order` skill.

It started as GM mode's cadence (`plans/gm-mode/README.md`, 2026-10-05) and
was adopted for every plan on 2026-10-23 (Ken): no reviewed session had come
back clean, building on Sonnet saves tokens, and with a conductor Ken still
makes every decision without the sessions waiting on him to relay.

## Which work goes through it

- **Rule or shape**: always. The work order *is* the proposal that
  `CLAUDE.md`'s *Change tiers* asks for.
- **Content**: when it's more than a data edit (a new computed value, a
  catalog a reader has to learn). The order is a page (*How exact to be*).
- **Fix and Docs**: no. A named finding or a typo is done in the session
  that found it, and a plan's close is built from its plan row (Y3,
  2026-10-23). The loop's reviewer earns its keep on code an order shaped,
  and a Docs change has none.

## The roles

| Session | Model | Does | Never |
|---|---|---|---|
| **Orchestrator** | Opus | Drafts the next order from `main` with the last PR merged, and pre-flights it | Builds or reviews |
| **Conductor** | Opus | The session Ken talks to. Starts the builder and the reviewer, keeps notes for both, settles what the order already decides, and brings Ken everything else, batched, with a recommendation. Writes Ken's answers into the PR or the order | Builds, merges, or decides a design choice for Ken |
| **Builder** | Sonnet | Builds the order on its own branch and worktree, opens the PR, fixes the review's findings | Merges, or asks the reviewer anything that's Ken's |
| **Reviewer** | Opus, fresh | Reviews the PR against the order, fixes nits itself, re-reviews the fix commits narrowly, says "Ready to merge" | Merges, or shares the order's assumptions |

The orchestrator is usually **the last order's reviewer**, asked by the
conductor once that PR merges (step 7): it has just read the code the next
order starts from. With no reviewer to ask, the conductor drafts it.
**Ken merges.**

## The cadence

1. **The orchestrator writes the next work order**: reads the plan, the code
   as it is now, and what the last session actually built, and drafts the
   session's decisions in full.
2. **It pre-flights the order against the code** before Ken sees it (below).
   S1's review found five problems and all five were the order's, not the
   build's: a building session that follows an order exactly builds its
   mistakes exactly. The pre-flight is where those get caught for the price of
   a grep instead of a fix round.
3. **Ken reads and approves it.** Ken edits it, answers its questions, or
   sends it back. Nothing is built from an unapproved order. A question with
   a default that Ken leaves blank is answered "Default".
4. **The conductor starts the builder** (Sonnet), titled **`<id> build`**, in
   its own worktree cut from `main`, with the building prompt below and the
   order's *Handing it over* traps. It builds on a branch, following
   `CLAUDE.md` and the order's steps, writes the order's worked examples as
   tests first and shows them failing on `main`, and **opens a PR without
   merging it**. Every claim the PR makes about how the code behaves names
   the command or test that shows it.
5. **Once the PR is open, the conductor starts a fresh reviewer** (Opus),
   titled **`<id> review`**, in its own worktree, with the reviewer's prompt
   below. It reviews the PR **against the order, not just the diff**:
   - It re-does the order's assumption sweep itself and looks for what the
     sweep missed.
   - It probes the behaviour on `main` and on the PR, and doesn't take the
     PR's claims on trust.
   - It **runs the PR in a browser**, not only the tests. S1's worst bug
     passed every test: the tests checked that the tip opened, and nothing
     checked that the card still did.
   - It re-runs the PR's mutation tests itself.

   It posts must-fix and should-fix findings as inline comments, **fixes nits
   itself** in a commit on the PR branch, and messages the builder directly.

   Each finding is marked as the order's or the build's, and the order's go
   into the next order's *Carried over* note. A fix that changes what the
   order specified, not just how it was built, is Ken's call: the review
   recommends it, and it goes to the builder once he agrees (S9a's Back to the
   cast member). When the order builds a shape that later content will fill
   (a file kind, a data section), the review also checks that shape against
   the content's source, since the session that fills it is meant to need no
   code (S9a's pack against the Codex).
6. **The builder fixes and messages back** with its commits and the evidence
   for each. It already knows the code it wrote (S8a's knew `signed` was
   taken). The reviewer **re-reviews narrowly**: the fix commits against its
   findings, and whether a fix touched anything else, never the whole PR
   again. When nothing must-fix or should-fix is left, it says "Ready to
   merge" and tells the conductor, which tells Ken. Ken merges.

   A decision in a PR that **hasn't merged** is reworded in place by the fix
   round, never superseded: nothing has cited it yet (S8a's 176). Once
   merged, the ledger's supersession rules apply.

7. **Only then does the orchestrator write the next order**, from `main` with
   the last PR merged (Ken, 2026-10-06). **The last reviewer is the usual
   orchestrator**: it has just read the code the next order starts from, and
   the gotchas it found go straight into *Carried over*. The conductor asks
   Ken which session is next, sends the reviewer the request with its own
   notes (the stops it settled, Ken's answers), and brings the draft's
   questions to Ken. Never while that PR is open, for three reasons:
   - its *Carried over* note is what the fix round actually changed, not
     what the review expected;
   - its pre-flight reads the code it will be built from, with no "re-run
     once #N merges" step;
   - its plan row, STATE line and decision numbers can't collide with the
     open PR's.

   **An order that waited** (drafted, approved, then not built while other
   PRs merged) is re-pre-flighted against `main` before its builder starts:
   its line numbers, probes and expected test breaks are as of its pre-flight
   commit, and its *Carried over* note is missing every review since.

Review sits **before** the merge. It costs much less than the build, and it's
where a missed decision or an untested guard gets caught.

**Why separate sessions** (Ken, on trial from P8a, adopted 2026-10-15 after
P8a and P8b, and for every plan 2026-10-23): an orchestrator that reviews its
own order reviews against its own assumptions. P7's must-fix was a miss in
the order, not the build, and the orchestrator's review couldn't see it. A
fresh reviewer doesn't share the order's assumptions. Talking to the builder
directly saves Ken the relay, and the narrow re-review keeps the second round
cheap.

## The conductor

What the conductor does, and what Y1 and Y4 taught it (the skill has the
steps):

- **Anything for Ken goes to the conductor**, never between builder and
  reviewer: a change to what the order specifies, a choice it doesn't cover,
  a voice pass, a mismatch with the book. The two sessions message each other
  directly about everything else. Y1 ran with the conductor relaying every
  message, and the relay added only latency (Ken, 2026-10-23).
- **It settles what the order already decides.** Y4's builder stopped on a
  tenth failing test the order hadn't listed; it pinned a sentence the order
  rewrites, so updating it was the order's own instruction, not a new choice.
  The conductor said so and noted it as the order's miss. When it isn't
  sure, it's Ken's.
- **It brings Ken's questions together, each with a recommendation**, so he
  answers once (Y4's review raised three, answered in one go).
- **It records Ken's answers where the sessions can cite them**: a PR
  comment in his words, or the order. A session won't write "Approved by
  Ken" from a relayed message, and shouldn't.
- **It keeps notes** for both sessions in its scratchpad and points each
  session at them: the order's state, what's changed since it was drafted
  (a decision number another PR took), each session's id.
- **Sessions are addressed by id.** `ListAgents` didn't always show the
  builder to the reviewer; the conductor gives each the other's
  `local_…` id, which works either way.
- **The app starts a session only on Ken's own words.** A session the
  conductor starts from another session's message or an automated event
  becomes a card Ken clicks. So the reviewer usually waits on one click.
- It starts nothing Ken didn't ask for, and merges nothing.

## The pre-flight

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
  what it touches (a label, a class, a key), **and for the old wording of
  every sentence it rewrites**. Y4 listed nine tests that encoded the rule
  and missed a tenth that pinned a note the order itself rewrote.
- **Prototype when the rule is small**: change the lines in a scratch tree
  and run the suite, so the list of expected breaks is the suite's own (Y4).
- **The assumption sweep** is a table in the order. For each function,
  field or note the order changes, it lists what's true today, where (file
  and line), and what's true after. Three questions are asked of every row:
  - **Which guards read a value this changes?** P8a missed `soaked` reading
    the damage the order halved.
  - **Where does each new or removed note, line or number render?** P8a
    missed a `playerNote` left with nowhere to render. P8b missed two places
    that show the same HP number as the pill it changed: the popover the
    pill opens, and the pinned drawer that hides the pill. Y4's note
    rendered on Admin too, where a locked character has no CP step.
  - **What text points at what this changes?** Every sentence that names
    a control's place or a rule's numbers is a reader too. Y1 moved a
    picker to the top of the tab and kept a line beside its old place
    that said "Remove it" with nothing below it. Grep the copy, the
    data's notes and the comments for the rule's words, and give each
    hit a row.

  **Answer all three by grepping the field's readers** (`hpLeft`, `playerNote`,
  `.dying`), never from memory of where it shows. Every miss so far has been
  a reader nobody remembered, and **twins count**: everywhere that draws the
  same number is a row.
- **Probes on `main`** go in the header: what the changed functions return
  today, for the order's own examples. They become the worked examples'
  "before".

## How exact to be

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
  fifteen sections. A *Content* order (S13, S12) gets a page: goal, tier,
  scope, the sweep, tests, review checklist and the hand-over.
- **Prove "nothing else moves" by a diff, not a pin** (P21's review).
  Pinning a few numbers on a few characters misses the one that moved. The
  builder scripts the engine's outputs over every archetype, specialization
  and trait on `main`, keeps them as a fixture **before** the engine
  changes, and diffs the branch against it.
- **A list the order writes by hand is a convenience; the source is
  checked by script** (P21's review). P21's order named two Skills where two
  kickers meet, and the data made five reachable. The test reads the book's
  table or computes the list from the data, and never takes the order's list.
- **Sweep the readers that aren't about display** (P21's review). A flag put
  on Field Medic to show a note also stopped IP selling it. Grep every
  reader of a field and, for a switch on a kind, check what its default
  branch does with a new one.
- **The voice pass happens before merge.** The builder pastes every new
  string into the PR as it renders, and the reviewer drafts rewrites side by
  side for Ken to pick, through the conductor (P21, 2026-10-21).
- **Say what isn't a stop.** *Stop and ask* names the breaks the order
  expects, so the builder doesn't have to judge them: the version literals its
  own bump moves, or a test that asserts a note the order deletes. P8b's
  builder judged two such breaks correctly, but a rule that invites judgement
  gets skipped in the one place it matters.
- **Every "report it if…" is a review checklist item**, and every worked
  example names the sentence or count it pins, checked against the order's
  other sections (Y1's example counted a sentence the order kept twice).
- **Decision and flag numbers are never reserved**: the order writes **N**
  (`CLAUDE.md`, *Decisions*), and the same for a table, pack or character
  schema version it can't be sure of.

## The prompts

**Prompt for a building session** (its first message, with the session
titled `<id> build`, on Sonnet, in its own worktree cut from `main`). The
order's *Handing it over* adds its own traps under it, and the conductor adds
its notes' path:

> First run `git submodule update --init private`.
>
> Read `CLAUDE.md`, then `docs/plans/<plan>/<order>.md`, and build it. Ken's
> answers to its questions are in the order. Follow its steps in order and its
> *Stop and ask* list exactly: if something isn't covered by the order, stop
> and ask me rather than choosing. Where the order and the code or the ledger
> disagree in a way that doesn't stop you, build what the order says and list
> it in the PR under *Where the order didn't fit*. Open a PR when its review
> checklist holds; don't merge it.
>
> **Every claim in the PR about how the code behaves names the command or
> test that shows it** ("X doesn't run Y: `grep …`", "fails on `main`: test
> output"). A claim with no evidence is a finding in review.
>
> When the PR is open, say so here. A reviewer session will message you with
> findings. Fix them, push, and message it back with what you changed and the
> evidence for each.
>
> **Anything for Ken goes to the conductor** (the session that started you),
> never to the reviewer: a change to what the order specifies, a choice it
> doesn't cover, a voice pass, a mismatch with the book. Everything else you
> and the reviewer settle between you.

**Prompt for the reviewing session** (a fresh Opus session titled
`<id> review`, in its own worktree, started once the PR is open; the
conductor adds the builder's session id and its notes' path):

> First run `git submodule update --init private`: without the CRB mirror,
> every CRB-mirror test fails for a reason that has nothing to do with the PR.
> Review against the order's review checklist too, and follow its steps for
> the dev preview.
>
> Review PR #<n> adversarially against `docs/plans/<plan>/<order>.md`: the
> order, not just the diff. Re-do the order's assumption sweep yourself by
> grepping the readers of everything it changes, and look for what it missed.
> Run the tests, probe the behaviour on `main` and on the PR, and run it in
> the dev preview; don't take the PR's claims on trust.
>
> For the mechanical parts, such as running the full suite and sorting
> environmental failures from real ones, or a read-only sweep like "list
> every place that writes `trackers.damage`", use a Haiku subagent. Its
> results are leads, not findings: check anything you report yourself.
>
> Post the review on the PR: must-fix and should-fix as inline comments, on
> lines inside the diff (GitHub refuses others; name the real line in the
> comment). **Nits you fix yourself in one commit on the PR branch, and say
> so in the review**; don't send them back. Mutation-test a nit's guard by
> saving the fixed file and copying it back, never with `git checkout` on a
> file you just edited, which restores the unfixed version. Probe `main` in a
> scratch worktree with its own `npm ci`: don't link `node_modules` into it,
> because removing the worktree deletes through the link.
>
> Then message the builder (**<id> build**; the conductor gives you its
> session id) that the review is posted, with the must-fix and should-fix
> items. When it messages back, **re-review narrowly**: its fix commits
> against your findings, plus whether a fix touched anything else. Don't
> re-review the whole PR. When nothing must-fix or should-fix is left, say
> plainly "Ready to merge" and **tell the conductor** (the session that
> started you); don't merge. If you can't reach the builder, tell the
> conductor and it will relay.
>
> **Anything for Ken goes to the conductor**, never to the builder: a fix
> that changes what the order specified, a choice the order doesn't cover, a
> voice pass, a mismatch with the book. Give your recommendation with each.

## Running more than one at once

Don't, until the cadence is routine. These sessions share `engine.js`,
`shadows-data.js`, `sheet.js`, `app.js`, the decision ledger, the versions,
STATE and the changelog, and most of them depend on the one before. When two
can run together, the order says so, and the orchestrator does the
bookkeeping merge. Decision and flag numbers are never reserved: each order
says "the next free number" (`CLAUDE.md`, *Decisions*).

## What a work order contains

Every order has a header (plan link, status, branch, what it runs beside,
**the pre-flight's commit and findings**, and a *Carried over* note of what
the last review found in the last order), then these sections, in this
order. An order that can't fill one isn't ready to hand over; a *Content*
order may fold them down (see *How exact to be*). Drafting an order also
rewrites the **Plan** line of every wish it takes up or sets aside
(`WISHLIST.md`'s header has the rule).

1. **Goal and Done when.** What a player or GM can do afterwards, and the
   observable checks that prove it.
2. **Tier, versions, numbers.** The change tier and each version bump. Its
   decisions and flags are "the next free number", written **N** in the
   order and taken when it's built (`CLAUDE.md`, *Decisions*).
3. **Decisions, drafted in full.** In the ledger's shape, ready to paste. The
   building session doesn't write a decision; it pastes and fills *Built*.
4. **Questions for Ken.** Anything the order defaults that Ken might not
   want, each with its default. Answered before the build starts.
5. **The assumption sweep.** The pre-flight's table: what's true today, where,
   and what's true after, with its three questions answered by grep.
6. **Read first.** The `CLAUDE.md` rules, SCHEMA sections, files, functions
   and primitives that matter, by name.
7. **Out of scope.** What the session must not do, even if it looks nearby.
8. **The shapes.** Data keys, the saved-file field, `migrate()`, the engine
   functions with their signatures and what they return on bad input.
9. **The UI.** Where each thing goes, what it reuses, what each interaction
   must do (behaviour, not markup), and its copy (drafted, marked for a
   voice pass).
10. **Worked examples, as named tests.** Each example is a test with its
    exact name and file. The builder writes these first and shows them
    failing on `main`, or says why one already passes.
11. **Tests beyond the examples.** Totality, hostile cases, voice, and which
    guards to mutation-test.
12. **Steps.** In order, with a `npm run verify` checkpoint after each, and a
    run in the dev preview for anything a player sees.
13. **Stop and ask.** The conditions that end the session early, and the
    expected breaks that don't.
14. **Close-out.** The `close-the-session` skill's items for this tier, the
    changelog lines, the PR title, and the PR body's sections, always
    including **Where the order didn't fit** (empty is a fine answer). Then
    the **review checklist**: what the reviewer checks in the PR, beyond the
    tests passing.
15. **Handing it over.** The two prompts (above) with this order's path, plus
    this order's own traps: what the pre-flight found easy to get wrong.
