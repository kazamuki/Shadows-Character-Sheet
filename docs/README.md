# Docs

| File | What it is | When to read it |
|---|---|---|
| `SCHEMA.md` | The project's memory: architecture, game-data schema, character schema, 58 numbered decisions, open flags, phase roadmap. | Before touching anything. |
| `HANDOFF.md` | Where the build stands right now and what happens next. | Starting a session. |
| `audits/` | Dated whole-app audits. Findings are referenced by id (A1, B2, C3) everywhere else. | When picking up cleanup work. |

**Update rule:** a decision is not made until it is numbered in `SCHEMA.md` §4. A flag is not
tracked until it is in §5 or filed as a `design-flag` issue. Both get updated in the same
commit as the code they describe.
