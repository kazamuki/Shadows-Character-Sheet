---
name: close-the-session
description: Finish a batch of Shadows work so the next session starts from the truth. It covers the version bump, changelog, STATE, the log, the shipped board, INDEX statuses and the PR, each only as far as the change tier requires. Use before committing the last change of a batch or opening its PR.
---

# Close the session

`CLAUDE.md` → **Change tiers** says what each tier must touch; this walks it
in order. Name the batch's **highest** tier first. Everything below it
applies, and nothing above it does.

## Every tier

- [ ] `npm run verify` passes. Any `todo` count matches `docs/STATE.md`'s
      suite line; a new `todo` is a confirmed defect, so say so.
- [ ] A new guard was mutation-tested: put the old code back and watch it fail.
- [ ] Ideas that came up and weren't done went to `docs/WISHLIST.md` as `W` ids.

## Fix: a player can see it

- [ ] `npm run bump -- X.Y.Z` (patch for a visible fix, minor for a new
      capability; CLAUDE.md's version table). It writes every version site and
      the `[Unreleased] — app X.Y.Z` heading.
- [ ] Lines under that heading in player voice, then `npm run changelog`.
- [ ] A named finding: its status in `docs/INDEX.md` §2, and its box in the
      plan it came from.

## Content

- [ ] `meta.gamedataVersion` per Decision 68. To prove a change invisible,
      `node tools/outputs.mjs a.json`, change it, then `--against a.json`.
- [ ] A closed flag's three edits (the `close-a-flag` skill).
- [ ] An entry appended to `docs/log/2026.md`: what was done, what it cost,
      what was learned. Figures in it are as of today and are never revised.

## Rule or shape

- [ ] It was proposed to Ken before it was built.
- [ ] A numbered decision (the `number-a-decision` skill).
- [ ] If the save file's shape moved: `meta.schemaVersion` and a `migrate()`
      step in the same commit, and a round-trip test.
- [ ] `docs/STATE.md` §1–§5 **rewritten**, not appended, for what's now true
      and what's next. It has a length limit that `docs.test.mjs` checks.

## The PR

- [ ] One row in `docs/log/shipped.md`, added in the PR itself.
- [ ] Commit subjects in the imperative, naming the finding or decision:
      `fix(ui): render aberrations once (A1)`.
- [ ] The PR title names the batch; the body gives Ken the 50,000-foot view
      first, then anything he must decide or check.
- [ ] Releasing is separate: the `cut-a-release` skill.
