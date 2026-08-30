# CLAUDE.md

Standing instructions for this repository. Read this first, every session.

## Orientation — before touching anything

1. `docs/HANDOFF.md` — where the build stands right now, known defects, open flags, what's next.
2. `docs/SCHEMA.md` — the project's memory: architecture, both schemas, 58 numbered decisions, the flag table, the phase roadmap. It is the authority. If this file and SCHEMA disagree, SCHEMA wins and this file needs fixing.
3. `docs/audits/` — findings are referenced by id (A1, B2, C3) throughout. Look up the id before working on it.

Do not start editing before reading 1 and 2. Most mistakes on this project are made by someone who had the local picture but not the design picture.

## The project in one paragraph

A browser character creator and live play sheet for **Shadows**, a cyberpunk-noir urban fantasy RPG running on the **Synergy** system (Get Dangerous Games). Eight-step intake wizard → lock → a nine-tab running sheet with damage and Pain Levels, Sanity, Luck, Çredits, IP and Milestones, session log, loadout, and an undo-able audit trail. Deighton is the lead designer and holds all rules authority. Scott works on the GM toolkit and magic system. Ken writes and maintains the CRB and builds this app.

## Commands

```bash
npm run verify   # build check + full test suite — run BEFORE and AFTER every change
npm test         # engine units, jsdom smoke, architecture guards
npm run build    # → dist/shadows-character-sheet.html (the file players get)
```

Expected result: **20 passing, 2 todo, 0 failing.** The two `todo`s are confirmed defects (A1 and B7) written as failing tests on purpose. They flip green when fixed — do not delete them to make the output cleaner.

If `npm run verify` fails, fix the code, not the test. The exception: a test encoding an outdated decision, in which case update `docs/SCHEMA.md` in the same change.

## Hard constraints — breaking any of these breaks the app for players

1. **The app runs from `file://` with no server and no build step.** A GM hands a player a folder and it works. This is load-bearing, not a preference.
2. **No ES `import`/`export` anywhere in `src/`.** CORS blocks modules from disk. Everything is a classic script sharing script scope.
3. **`index.html` stays a shell** — markup and `<script src>` tags only. No inline styles, no inline logic.
4. **Script order is fixed:** data → icons → engine → ui.
5. **The engine never touches the DOM.** `src/engine/engine.js` reads `window.SHADOWS_DATA` and returns values. Tests load it with no DOM present.
6. **IDs are immutable.** Every id in `shadows-data.js` may be referenced by a saved `.shadows.json` character file. Display `name` changes freely; `id` never does. If an id truly must change, it needs a `migrate()` step and a schema bump.
7. **Store inputs, compute everything else.** A character stores `BOD = 7` — never the modifier, the Health Levels, or the HP. Never write a derived value into the character object. This is why audit/undo could be a generic structural diff instead of per-action inverse handlers.

Constraints 2–5 are enforced by `tests/build.test.mjs` and `tests/engine.test.mjs`. If a test fails on one of them, the test is right.

## Layout

```
index.html              Shell. 31 lines.
src/data/               Game content + icons. Designers edit these.
src/engine/engine.js    Pure rules engine. No DOM.
src/ui/app.js           Wizard + sheet. One IIFE, ~90 functions sharing state.
src/styles/shadows.css  Brand tokens + styling.
docs/                   SCHEMA, HANDOFF, audits.
tests/                  Engine units, jsdom smoke, architecture guards.
tools/build.mjs         Inlines everything into dist/.
```

Adding a stat, skill, advantage, archetype, or panel should require **zero** app changes. If it doesn't, that's a bug in the app — not a reason to special-case the data.

## How Ken and Claude work together

**Propose before you build.** Engine changes, schema changes, and anything structural get described and approved before implementation. Ken wants the shape of the change and its consequences first, not a finished diff to review backwards. Small, obvious, in-scope fixes (a typo, a named audit finding, a test) can just be done.

**Give the 50,000-foot view first.** Macro-level pattern mismatches before line-level notes. If something is wrong at the architecture level, say that before listing the small stuff.

**Frank pushback is the standing expectation**, especially on UX. If an approach is worse than an alternative, say so plainly and say why. Agreeing to be agreeable wastes Ken's time.

**Suggestions are inspiration, not directives.** Ken often writes his own version of a proposal and has it audited afterward. Offer the reasoning, not just the artifact.

**Never resolve a rules question in code.** Design questions go to Deighton. Stub the behavior, mark the data entry `flagged: true` with a `flagNote`, add it to the flag table in `SCHEMA.md` §5 or file a `design-flag` issue, and surface the uncertainty in the app rather than hiding a guess. One philosophical ruling from Deighton usually clears several flags at once, so group related flags rather than pressing them one at a time.

**A decision isn't made until it's numbered.** `SCHEMA.md` §4 is the ledger; it's at 54. Add the decision in the same change as the code it describes.

**Player-facing copy is in-world writing, not UI microcopy.** Step notes, flavor lines, and empty states speak as NYTE City — not as a rulebook author instructing the reader. That designer-voice slip is the primary failure mode. The voice guide (`GUIDE_Shadows_Voice.md`) lives in the CRB project, not here; when a string is doing real narrative work, flag it for a voice pass rather than shipping a guess.

**Watch for mechanical drift.** Rewording an entry can quietly change what it does — an absolute floor becoming a relative modifier, a cost shifting, a stacking rule inverting. Any edit that touches rules text gets cross-checked against the CRB reference before it lands.

## Working rhythm

- Branch per unit of work: `feat/picks-system`, `fix/a1-double-aberration`, `data/biomech-rewrite`.
- Commit subjects in the imperative, naming the finding or decision: `fix(ui): render aberrations once (A1)`.
- `main` is always openable and always passes `npm run verify`.
- Work in defined batches. At the end of a session, update `docs/SCHEMA.md` (decisions, flags, roadmap) and `docs/HANDOFF.md` so the next session — or the next person — can pick it up cold.
- Tag when a phase closes: `v0.4.0-phase-3.3`. CI attaches the single-file build to the release.

## What's next

Phase 4 — the selection & constraint system. In order:

1. Clear **F8** when Deighton rules (a four-number data edit; the only wizard-blocking flag).
2. Build `picks` / `excludes` / `requires` for advantages & disadvantages — shape is specified in the rev 9 audit §4.
3. Retrofit archetype specialization onto it (**A3**), retiring the Arcanist/Professional/Werewolf branches. **A1** and **A2** fix themselves as a side effect.
4. Then the Biomech rewrite (**F6**) lands as data instead of a fourth special case.

Quick wins available any time, no design input needed: **B1, B2, B4, B5**. **B3** and **B6** want a one-line "is this intended?" first.

`src/ui/app.js` will eventually need decomposing, but **not as a standalone chore** — it belongs with the Phase 4 renderer rewrites. See `docs/HANDOFF.md` §7 for the mechanism.
