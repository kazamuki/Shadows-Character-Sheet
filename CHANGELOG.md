# Changelog

Phase-level history lives in `docs/SCHEMA.md` §6 (roadmap) and §4 (numbered decisions).
This file maps phases to release tags so a download can be traced back to a state of the design.

Four versions move independently — app, game data, character schema, ruleset. The rules
for each are in `CLAUDE.md`; current values are in `docs/STATE.md` and the app prints its
own in the footer.

## [Unreleased] — app 0.5.0

Character schema **0.4** · game data **0.3** · ruleset CRB v4 (in progress).

**Player-visible**

- The sheet now states the CRB's Pain Level floors — "−3 Essence dice (min 1) · −15% Breaker
  (min 10%)" — instead of bare penalties a player could read down to zero dice.
- The app no longer narrates its own build state. No phases, no "TBD", no internal flag ids,
  no "confirm with D". Unsettled rules say what isn't settled and hand the table its authority.
- A character holding a skill the game data no longer defines still opens.
- The footer carries the app version.

**Under the hood**

- Repository restructure: the single `index.html` split into `src/` (data, engine, ui, styles)
  with `index.html` as a shell; build script inlines everything back into one file for release.
- The engine has a totality contract with a guard behind it, and `migrate()` guarantees its
  own completeness — a pre-0.2 character used to be unopenable.
- `tests/rules.test.mjs`: the CRB's worked examples run as tests. A rules change the app
  misses fails the build.
- Test suite: engine units (no DOM), CRB conformance, voice enforcement, jsdom smoke,
  architecture guards, doc consistency.
- **A1** (Arcanist aberrations render twice) is the only remaining `todo`; it closes with A3.

## v0.4.0-phase-3.3

Character schema **0.4** · game data **0.2** · ruleset CRB v4 (WIP).
Audit trail with global undo, admin mode, HL segment strip, TOL/WILL/SAN derivations surfaced.
See `docs/SCHEMA.md` decisions 48–53.
