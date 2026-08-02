# Changelog

Phase-level history lives in `docs/SCHEMA.md` §6 (roadmap) and §4 (numbered decisions).
This file maps phases to release tags so a download can be traced back to a state of the design.

## [Unreleased]

- Repository restructure: the single `index.html` split into `src/` (data, engine, ui, styles)
  with `index.html` as a shell; build script inlines everything back into one file for release.
- Test suite formalized: engine units (no DOM), jsdom end-to-end smoke, architecture guards.
- Known findings from the rev 9 audit tracked as `todo` tests: **A1** (Arcanist aberrations
  render twice) and **B7** (`validate` throws on a character with no power level).

## v0.4.0-phase-3.3

Character schema **0.4** · game data **0.2** · ruleset CRB v4 (WIP).
Audit trail with global undo, admin mode, HL segment strip, TOL/WILL/SAN derivations surfaced.
See `docs/SCHEMA.md` decisions 48–53.
