---
name: number-a-decision
description: Record a choice in the Shadows decision ledger (docs/SCHEMA.md §4) with its INDEX line and supersession marks. Use when a change is in the "Rule or shape" tier, when a proposal is about to be made (to search the ledger first), or when Ken approves something that someone could reasonably have chosen otherwise.
---

# Number a decision

The rules are in `CLAUDE.md` → **Decisions**: what counts as a decision, the
entry's shape, and marking what it replaces. This is the order to do it in.
`tests/docs.test.mjs` checks the shape and that ledger and index agree; it
can't find a replacement nobody marked, which is step 1's job.

## 1. Before proposing: search

Search §4's **Touches** lines, then the ledger's text, for **every** stat,
field, rule or UI element the change touches, by name:

```bash
grep -n "Touches:.*<term>" docs/SCHEMA.md
grep -n "<term>" docs/SCHEMA.md | head -40
```

For each hit, read its **Rejected** and **Revisit if**. Cite what covers the
change. Propose reopening one only if its Revisit-if has happened, or there's
something new its Rejected list didn't weigh, and say which. Buried rulings
count: Decision 102 exists because a TOL formula sat inside a data-merge entry.

## 2. Propose, and wait

Tell Ken the shape and its consequences before building. Put each open
question to him; don't settle a rules question yourself (see `close-a-flag`).

## 3. Write the entry, in the same change as the code

- Next number: `grep -n "^[0-9]\{3\}\. \*\*" docs/SCHEMA.md | tail -1`, plus one.
  Never renumber or delete.
- Append it at the end of §4, just above `## 5. Open Flags`, in the shape
  CLAUDE.md gives: the one-line decision, the `*date · who · Touches: …*` line,
  then Decided · Why · Rejected · Replaces · Revisit if · Built. About 25
  lines at most; build detail goes in the log or the PR.
- **Touches** names things the way a future search would: field names,
  tab names, rule names, finding and flag ids.

## 4. Index it

Add a line under the right topic in `docs/INDEX.md` §3:
`- **N** *(short tag)* — one-line summary.`

## 5. Mark what it replaces

For every earlier decision it overrides, in whole or in part:

- in SCHEMA, the old entry gets `→ **Superseded by Decision N**` (or `in part`)
  and a clause saying what changed;
- in INDEX, its line gets `→ **superseded [in part] by N**`, struck through
  (`~~…~~`) when wholly replaced;
- the new entry's **Replaces** says so.

## 6. Check

```bash
npm run test:fast
```
