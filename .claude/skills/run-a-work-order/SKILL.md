---
name: run-a-work-order
description: Conduct an approved Shadows work order through its builder and reviewer sessions — start the Sonnet builder, start the fresh Opus reviewer once the PR is open, settle what the order decides, bring Ken the rest, and record his answers. Use when Ken asks you to be the conductor for an order, or to build or review one "the usual way".
---

# Run a work order (the conductor)

The rule is in `CLAUDE.md` → **How Ken and Claude work together**; the loop,
the pre-flight and both prompts are in `docs/WORK-ORDERS.md`. Read its *The
conductor* and *The prompts* first. You build nothing, review nothing and
merge nothing.

## 1. Before the builder

1. Read `CLAUDE.md`, `docs/WORK-ORDERS.md`, the order and its plan.
2. **Check it's approved** (its header says so, and its questions are
   answered; a blank default is "Default"). Don't re-ask an answered one.
3. **Check what moved since it was drafted:** `git fetch`, then compare the
   order's pre-flight commit with `origin/main`. Has another PR taken the
   decision number it expected, or the minor version, or STATE lines it
   names? If code it reads has moved, the order needs a re-pre-flight
   (*An order that waited*) before it's built: tell Ken, don't start.
4. **Write your notes** in your scratchpad (`<id>-conductor-notes.md`): the
   order's path, what's settled, what's moved, and a log. Each session gets
   the path and reads it when it needs to.

## 2. Start the builder

`start_session`, `initiation: "user_asked"` (Ken asked for it), `context:
"fresh"`, `use_worktree: true`, `source_branch: "main"`, model the Sonnet id,
title **`<id> build`**, `wake_when_done: true`. Its prompt is the building
prompt from `docs/WORK-ORDERS.md` with the order's path, then the order's
*Handing it over* traps under it, then your notes: what's moved since the
draft, and the notes file's full path. Record the session id in the notes.

## 3. While it builds

- **A stop it raises:** if the order already decides it (a test pinning a
  sentence the order rewrites, an expected break it named differently),
  answer it, tell it to list it under *Where the order didn't fit* as the
  order's miss, and note it. If it's a choice the order doesn't cover, a
  change to what it specifies, a voice pass, or a mismatch with the book,
  it's Ken's: bring it with your recommendation.
- Check its report against the repo (`gh pr view`) before telling Ken the
  PR is open.

## 4. Start the reviewer

Once the PR is open: the reviewing prompt with the PR number and the order's
path, plus your notes: the builder's **session id** (`ListAgents` doesn't
always show it), anything you settled that the reviewer should check, and
the notes path. Opus, `use_worktree: true`, title **`<id> review`**.

The app starts a session only on Ken's own words. If you're answering the
builder's turn-end note, the start is refused: propose it
(`initiation: "own_initiative"`) and tell Ken it's a card to click, then
start it by `proposal_id` when he says so.

## 5. The review's questions

- Verify each claim that bears on Ken's choice (read the line it cites).
- Ask Ken **once, all together**: each item with the reviewer's
  recommendation and yours, as `AskUserQuestion` options with the
  recommended one first.
- **Record his answers in his words** as a PR comment (`gh pr comment
  --body-file`), headed as recorded by the conductor. A session won't
  record an approval from a relayed message.
- Send them to the builder with the comment's link (by session id), and
  tell the reviewer they're coming.

## 6. Ready to merge

When the reviewer says "Ready to merge": check the PR's head and CI
(`gh pr view <n> --json headRefOid,mergeable`, `gh pr checks <n>`), then
tell Ken, with the head commit, the verify result, and whether CI is green.
**Ken merges.** Once it's merged, the next order is drafted from `main`
(`docs/WORK-ORDERS.md`, step 7).

## If something goes wrong

- **The two can't reach each other:** give each the other's `local_…` id;
  relay only if that fails.
- **A session's turn-end note** is its report, not proof. Check the PR or
  the branch before you repeat it.
