---
name: close-a-flag
description: Open or close a Shadows rules flag (an F-number) across the data, docs/SCHEMA.md §5 and docs/INDEX.md §2. Use when a rules question comes up that the app must not answer, or when Deighton (or Ken, for CRB questions) rules on an open flag.
---

# Open or close a flag

The rule is in `CLAUDE.md` → **Flags**: never resolve a rules question in code.
`tests/docs.test.mjs` fails on a `flagged: true` whose `flagNote` names no
open F-number, so the three places below have to move together.

## Opening one

1. **Next number:** the highest F-number anywhere in SCHEMA, open or closed,
   plus one. Numbers are never reused.
   `grep -o "\bF[0-9]\+\b" docs/SCHEMA.md | sort -u -V | tail -1`
2. **Data** (`src/data/shadows-data.js`): on the entry, `flagged: true` and a
   `flagNote` that names the F-number (maintainer text, never rendered). Stub
   the behaviour, and give the player a `playerNote` if they'd otherwise meet
   a guess. `playerNote` follows `docs/VOICE-APP.md`: no F-numbers, no "TBD".
3. **SCHEMA §5:** a row in the table: the question, the stub, who rules, and
   whether it blocks.
4. **INDEX §2**, under *Open flags*: `` | `Fn` | question; Stubbed: … | who | ``.
5. If it's for Deighton, add it to his grouped question in `docs/STATE.md` §3
   and §5. Group related flags; one philosophical ruling usually clears several.

## Closing one: three edits

1. **SCHEMA §5:** delete the row and add the F-number to the **Closed:** line
   with what closed it (a decision number, usually).
2. **Data:** remove `flagged` and `flagNote` from the entry, and a `playerNote`
   that only existed to explain the stub. Build what the ruling says.
3. **INDEX §2:** remove the line from *Open flags*.

A ruling that changes what the app does is a *Rule or shape* change: number
it (the `number-a-decision` skill) and bump what CLAUDE.md's version table
says. If the CRB states a worked example, pin it in `tests/rules.test.mjs`.
Then drop the flag from STATE's waiting-on lists.

## Check

```bash
npm run test:fast
```
