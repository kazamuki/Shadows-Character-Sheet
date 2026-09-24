# Contributing

**Found a bug, or playtesting?** Open a GitHub issue with the **Bug or playtest
report** template. Say what happened, what you expected, the app version from
the page footer, your device and browser, and attach your exported
`.shadows.json` if you can.

**Changing the repo?** [`CLAUDE.md`](CLAUDE.md) is the rulebook for everyone,
human or Claude: the hard constraints, the four version numbers, and what each
kind of change must touch. It isn't repeated here, because a second copy drifts.
Then read [`docs/STATE.md`](docs/STATE.md) for where things stand.

## Who edits what

| You are… | You edit | You leave alone |
|---|---|---|
| A **designer** changing game content | `src/data/shadows-data.js` | `src/engine/`, `src/ui/` |
| A **developer** changing behaviour | `src/engine/`, `src/ui/`, `src/styles/` | game content, unless a decision says so |
| **Anyone** recording a decision | `docs/SCHEMA.md` §4, and its line in `docs/INDEX.md` | — |

## Four things that aren't obvious

- **Run `npm install` once, then `npm run verify` before every commit.** If a
  test fails, fix the code, not the test.
- **Never change an `id`** in the game data. Saved characters point at it.
  Rename the `name` instead.
- **Don't decide a rules question in code.** Mark the entry `flagged: true`
  with a `flagNote` that names its F-number, and add the flag to
  `docs/SCHEMA.md` §5. Rules questions live there, not in GitHub issues.
- **Anything a player reads** follows `docs/VOICE-APP.md`.
