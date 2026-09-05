# CLAUDE.md

Standing instructions for this repository. Read this first, every session.

This file holds what is true across *all* sessions. It deliberately carries **no
counts** — no test totals, no decision numbers — because those drifted here twice
and a cold session read them as current. Live numbers are in `docs/STATE.md`.

## Orientation — before touching anything

1. **`docs/STATE.md`** — where the build stands, the batch board, what is blocked
   on whom, what is next. Short by design. Read it whole.
2. **`docs/SCHEMA.md`** — the authority: architecture, both schemas, the numbered
   decision ledger, the flag table, the roadmap. **Do not read it front to back.**
   Open the section you need. If it and this file disagree, SCHEMA wins and this
   file needs fixing.
3. **`docs/INDEX.md`** — the map. Where each kind of thing is written down, what
   every `A`/`B`/`C`/`F` id means and whether it is closed, and every decision
   grouped by topic. Use it instead of grepping; it is checked against the ledger.
4. **`docs/audits/`** — findings are referenced by id (A1, B2, C3) throughout.
   Look up the id before working on it.

Also here when relevant: `docs/VOICE-APP.md` (player-facing copy),
`docs/log/2026.md` (session history — why something was done),
`docs/reference/` (mirrors of CRB-project documents; never edited here).

Do not start editing before reading 1 and 2. Most mistakes on this project are
made by someone who had the local picture but not the design picture.

## The project in one paragraph

A browser character creator and live play sheet for **Shadows**, a cyberpunk-noir
urban fantasy RPG running on the **Synergy** system (Get Dangerous Games).
Eight-step intake wizard → lock → a nine-tab running sheet with damage and Pain
Levels, Sanity, Luck, Çredits, IP and Milestones, session log, loadout, and an
undo-able audit trail. Deighton is the lead designer and holds all rules
authority. Scott works on the GM toolkit and magic system. Ken writes and
maintains the CRB and builds this app.

## Commands

```bash
npm run verify   # build check + full test suite — run BEFORE and AFTER every change
npm test         # engine units, CRB conformance, voice enforcement, jsdom smoke, architecture guards
npm run build    # → dist/shadows-character-sheet.html (the file players get)
```

`npm install` first — `node_modules` is not committed.

The expected result is in `docs/STATE.md`. Any `todo` tests are **confirmed
defects written as failing assertions on purpose** — they flip green when fixed.
Do not delete one to make the output cleaner.

If `npm run verify` fails, fix the code, not the test. The exception: a test
encoding an outdated decision, in which case update `docs/SCHEMA.md` in the same
change.

**Seeing a UI change run, not just pass tests:** opening `index.html` straight
from `file://` renders inert in some embedded/automated browsers — the markup
shows but no script executes, so nothing is clickable. `tools/devserver.mjs` is
a zero-dependency static file server (not shipped, not part of the app or its
build) that serves the repo over plain HTTP so a browser tool can actually run
it: `node tools/devserver.mjs` → `http://localhost:8420`. `.claude/launch.json`
wires it up as `shadows-dev-preview` for Claude Code's browser tool to start on
its own. Check before reaching for a different one or building it again.

## Hard constraints — breaking any of these breaks the app for players

1. **The app runs from `file://` with no server and no build step.** A GM hands a
   player a folder and it works. This is load-bearing, not a preference.
2. **No ES `import`/`export` anywhere in `src/`.** CORS blocks modules from disk.
   Everything is a classic script sharing script scope.
3. **`index.html` stays a shell** — markup and `<script src>` tags only. No inline
   styles, no inline logic.
4. **Script order is fixed:** data → icons → engine → ui.
5. **The engine never touches the DOM.** `src/engine/engine.js` reads
   `window.SHADOWS_DATA` and returns values. Tests load it with no DOM present.
6. **IDs are immutable.** Every id in `shadows-data.js` may be referenced by a
   saved `.shadows.json` character file. Display `name` changes freely; `id`
   never does. If an id truly must change, it needs a `migrate()` step and a
   schema bump.
7. **Store inputs, compute everything else.** A character stores `BOD = 7` —
   never the modifier, the Health Levels, or the HP. Never write a derived value
   into the character object. This is why audit/undo could be a generic
   structural diff instead of per-action inverse handlers.
8. **The engine is total.** Every exported reader returns something for any
   character `migrate()` can produce — it reports a problem, it never throws.
   `migrate()`'s completeness *is* the migration guarantee: a field added to
   `newCharacter()` must survive a round trip through it.
9. **Maintainer content never renders.** `flagNote` is for Ken and Deighton;
   `playerNote` and `appCopy` are what a player sees. The app does not narrate
   its own build state — no phases, no "TBD", no flag ids, no "confirm with D".

Constraints 2–5 are enforced by `tests/build.test.mjs` and `tests/engine.test.mjs`;
8 by `tests/engine.test.mjs`; 9 by `tests/voice.test.mjs`. If a test fails on one
of them, the test is right.

## Versions — four of them, four different triggers

Four numbers move independently. Bumping the wrong one, or none, is how a
session ends up debugging a build the other person isn't looking at. Current
values are in `docs/STATE.md`; the app renders its own in the footer, so **the
first move when something looks wrong is to compare the footer against STATE**.

| Version | Lives in | Bump it when |
|---|---|---|
| **App** | `APP_VERSION` at the top of `src/ui/app.js`, mirrored in `package.json` | **A player can see a difference.** patch = visible fix · minor = new capability · major = existing character files or the workflow break |
| **Game data** | `meta.gamedataVersion` in `shadows-data.js` | **A character's computed values or available choices can change** — content added or removed, a cost or cap altered, an id retired. *Never* for a change no character can observe (Decision 68) |
| **Character schema** | `meta.schemaVersion` on the character, stamped by `newCharacter()` and `migrate()` | **The shape of a saved `.shadows.json` changes.** Always needs a `migrate()` step in the same commit |
| **Ruleset** | `meta.rulesetVersion` in `shadows-data.js` | The CRB moves. Not ours to bump on a whim — it tracks Ken's document |

Two traps worth knowing:

- **Don't bump on a no-op.** Batch 1 removed a data field and added four, and
  bumped nothing: sixty computed outputs were diffed before and after and every
  one was identical. A version that cries wolf stops being read.
- **`schemaVersion` used to mean two different things** — the data file's own
  content version *and* the character file's schema version. The data key was
  renamed to `gamedataVersion` (Decision 75) to match the field it stamps onto
  characters. If you see `meta.schemaVersion`, you are looking at a character.

`tests/docs.test.mjs` fails the build if `APP_VERSION`, `package.json`,
`package-lock.json`, `README.md` and `STATE.md` disagree. **The numbers above are
deliberately absent from this table** — all three were written here once and all
three went stale. `docs/STATE.md` is the only place they live.

## Layout

```
index.html              Shell. 34 lines.
src/data/               Game content + icons. Designers edit these.
src/engine/engine.js    Pure rules engine. No DOM.
src/ui/                 Wizard + sheet, as four classic scripts sharing one
                        global scope (shared, wizard, sheet, then app for
                        chrome/boot) — no namespace object, see Decision 86.
src/styles/shadows.css  Brand tokens + styling.
docs/                   INDEX, STATE, SCHEMA, VOICE-APP, log, audits, reference.
tests/                  Engine units, CRB conformance, voice, smoke, architecture guards.
tools/build.mjs         Inlines everything into dist/.
```

Adding a stat, skill, advantage, archetype, or panel should require **zero** app
changes. If it doesn't, that's a bug in the app — not a reason to special-case
the data.

## How Ken and Claude work together

**Propose before you build.** Engine changes, schema changes, and anything
structural get described and approved before implementation. Ken wants the shape
of the change and its consequences first, not a finished diff to review
backwards. Small, obvious, in-scope fixes (a typo, a named audit finding, a test)
can just be done.

**Give the 50,000-foot view first.** Macro-level pattern mismatches before
line-level notes. If something is wrong at the architecture level, say that
before listing the small stuff.

**Frank pushback is the standing expectation**, especially on UX. If an approach
is worse than an alternative, say so plainly and say why. Agreeing to be
agreeable wastes Ken's time.

**Suggestions are inspiration, not directives.** Ken often writes his own version
of a proposal and has it audited afterward. Offer the reasoning, not just the
artifact.

**Verify, don't assert.** Run the thing. Three findings on this project were
worse than two rounds of documentation recorded, and each was only caught by
executing the code rather than reading it. When you add a guard, **mutation-test
it** against the pre-fix code — a guard that passes before and after is
decoration.

**Never resolve a rules question in code.** Design questions go to Deighton. Stub
the behavior, mark the data entry `flagged: true` with a `flagNote`, add it to
the flag table in `SCHEMA.md` §5, and surface the uncertainty in the app rather
than hiding a guess. One philosophical ruling usually clears several flags at
once, so group related flags rather than pressing them one at a time.

**A decision isn't made until it's numbered.** `SCHEMA.md` §4 is the ledger. Add
the decision in the same change as the code it describes.

**Player-facing copy follows `docs/VOICE-APP.md`.** The app speaks as NYTE City —
except where the player is stuck, which is tool voice: clear, short, out of the
way. Three files generate player copy and one of them surprises people:
`src/ui/` (wizard/sheet renderers, split across `shared.js`/`wizard.js`/
`sheet.js`/`app.js` — Decision 86), **`src/engine/engine.js` (`validate()`
writes every wizard error and warning)**, and the data. When a string is doing
real narrative work, flag it for a voice pass rather than shipping a guess.

**Watch for mechanical drift.** Rewording an entry can quietly change what it
does — an absolute floor becoming a relative modifier, a cost shifting, a
stacking rule inverting. Any edit that touches rules text gets cross-checked
against the CRB before it lands, and if the CRB states a worked example, pin it
in `tests/rules.test.mjs`.

## Working rhythm

- Branch per unit of work: `feat/picks-system`, `fix/a1-double-aberration`,
  `data/biomech-rewrite`. Batches from the board in `STATE.md` get one branch each.
- Commit subjects in the imperative, naming the finding or decision:
  `fix(ui): render aberrations once (A1)`.
- `main` is always openable and always passes `npm run verify`.
- **Close every session by rewriting `docs/STATE.md` and appending to
  `docs/log/2026.md`**, in the same commit as the code. STATE is rewritten; the
  log is append-only and never revised — its figures are true as of that entry.
- Tag when a phase closes: `v0.4.0-phase-3.3`. CI attaches the single-file build
  to the release.

## What's next

See the board in `docs/STATE.md` §2. Batch 3b — `grants` — is next. It needs one
ruling from Ken before it can be built (Educated is bought at step 7 and grows
the step-6 Skill Point pool retroactively), so read §2 before starting it.
