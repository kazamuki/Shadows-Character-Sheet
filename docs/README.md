# Docs

Read in this order. The first two are enough to start work.

| File | What it is | When to read it |
|---|---|---|
| `../CLAUDE.md` | Standing instructions: hard constraints, conventions, how we work. No live numbers — those drift. | First, every session. |
| `STATE.md` | Where the build stands, the batch board, who can clear what, branches in flight. **Rewritten, never appended.** | Second, every session. Read it whole. |
| `SCHEMA.md` | The authority: architecture, both schemas, the numbered decision ledger, the flag table, the roadmap. | **Not front to back.** Open the section you need. |
| `VOICE-APP.md` | City voice vs tool voice, for player-facing strings. | Before writing any string a player reads. |
| `log/` | Session history, append-only. Why something was done, what it cost, what to watch for. | When you need the reasoning behind a past change. |
| `audits/` | Dated whole-app audits. Findings referenced by id (A1, B2, C3) everywhere else. | Look up the id before working on it. |
| `reference/` | Mirrors of documents mastered in the CRB project. **Never edited here** — re-pull instead. | When you need the source standard. |

`HANDOFF.md` was retired on 2026-09-02 (Decision 74) and split: current state →
`STATE.md`, history → `log/2026.md`. A stub remains so older prompts still land.

## Update rules

- **A decision is not made until it is numbered** in `SCHEMA.md` §4.
- **A flag is not tracked** until it is in `SCHEMA.md` §5. Closing one is *two*
  edits — the table **and** `flagged` in the data. F10 stayed live to players for
  four days because only the first was done.
- **Volatile facts — suite results, decision counts — live in `STATE.md` and
  nowhere else.** Log entries state figures as of that session and are never
  revised.
- `tests/docs.test.mjs` enforces the three rules above. If it fails, a document
  is lying to the next session.
- All of it gets updated in the same commit as the code it describes.
