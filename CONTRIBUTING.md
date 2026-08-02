# Contributing

This repo has three kinds of contributor and the rules differ for each.

| You are… | You edit | You do not touch |
|---|---|---|
| A **designer** changing game content | `src/data/shadows-data.js` | anything in `src/engine/`, `src/ui/` |
| A **developer** changing behavior | `src/engine/`, `src/ui/`, `src/styles/` | game content, unless a decision says so |
| **Anyone** recording a decision | `docs/SCHEMA.md` | — |

---

## Before you commit

```bash
npm run verify     # build check + full test suite
```

If a test fails, fix the code, not the test — unless the test itself encodes an outdated decision, in which case update `docs/SCHEMA.md` in the same commit.

## Hard constraints

These are not style preferences. Breaking any of them breaks the app for players.

1. **No ES modules in `src/`.** `import` and `export` are blocked by CORS on `file://`. Everything is a classic script sharing script scope. `tests/build.test.mjs` enforces this.
2. **`index.html` stays a shell.** Markup and `<script src>` tags only — no inline styles, no inline logic.
3. **The engine never touches the DOM.** `src/engine/engine.js` reads `window.SHADOWS_DATA` and returns values. `tests/engine.test.mjs` loads it with no DOM present; if it reaches for `document`, that suite dies.
4. **IDs are immutable.** Any id in `shadows-data.js` may be referenced by a saved character. Change a display `name` freely; never change an `id`. If an id truly must change, it needs a `migrate()` step and a schema bump.
5. **Store inputs, compute everything else.** Never write a derived value into the character object.
6. **Script order is fixed:** data → icons → engine → ui.

## Game data changes

- Every content entry supports `"flagged": true` + `"flagNote": "..."`. Use them. An unresolved rules question shipped with a flag is fine; an unresolved question shipped silently is not.
- Adding a stat, skill, advantage, archetype, or panel should require **zero** app changes. If it doesn't, that's a bug in the app, not a reason to special-case the data.
- Bump `meta.schemaVersion` in `shadows-data.js` when the *shape* changes, not when content is added.

## Character schema changes

Any change to the shape of `*.shadows.json`:

1. Bump `meta.schemaVersion` in `newCharacter()`.
2. Add the upgrade to `migrate()` so older saves survive.
3. Add a migration assertion to `tests/engine.test.mjs`.
4. Record it as a numbered decision in `docs/SCHEMA.md` §4.

## Player-facing copy

Step notes, flavor lines, and empty-state text are **in-world writing**, not UI microcopy. They follow the Shadows voice guide (`GUIDE_Shadows_Voice.md`, in the CRB project) — the app speaks as NYTE City, not as a rulebook author instructing the reader. When in doubt, route the string past a voice pass before it ships.

## Design questions

Do not resolve rules questions in code. Open an issue using the **Design flag** template, label it `deighton-ruling` or `docs-question`, and stub the behavior with a `flagged: true` entry so the app surfaces the uncertainty at the table. Flags are tracked in `docs/SCHEMA.md` §5.

## Commits and branches

- `main` is always openable and always passes `npm run verify`.
- Branch per unit of work: `feat/picks-system`, `fix/a1-double-aberration`, `data/biomech-rewrite`, `docs/schema-phase-4`.
- Commit subject in the imperative, and name the finding or decision when there is one: `fix(ui): render aberrations once (A1)`.
- Tag a release when a phase closes: `v0.4.0-phase-3.3`. The build artifact is attached to the release, not committed.
