# Changelog

Phase-level history lives in `docs/SCHEMA.md` §6 (roadmap) and §4 (numbered decisions).
This file maps phases to release tags so a download can be traced back to a state of the design.

Four versions move independently — app, game data, character schema, ruleset. The rules
for each are in `CLAUDE.md`; current values are in `docs/STATE.md` and the app prints its
own in the footer.

## [Unreleased] — app 0.7.0

Character schema **0.5** · game data **0.4** · ruleset CRB v4 (in progress).

**Player-visible**

- The intake ledger tells the difference between "done" and "passed, but something's
  still open." A step you've walked past with unspent points or an unresolved pick now
  shows a gold `!` instead of a green checkmark, and a callout below the ledger jumps you
  back to the first one.
- Advantages, Disadvantages and Skills can now ask you for something when you take them:
  a Skill from a named list (Common Sense), any Skill and a different one per rank
  (Favored Skill, Refined Skill), up to two Martial Arts styles, or a line of text for the
  ones the rulebook hands to your GM (Cursed, Pact, Immunity and seven more).
- An entry the table has to settle — "work out the curse with your GM" — **warns** rather
  than blocking. You can finish a character before that conversation happens.
- Long-Lived is marked creation-only, as the CRB says.
- One specialization block per archetype. The Arcanist used to render its Aberrations twice
  and demand a pick from each; a Professional's Subtype and a Werewolf's Origin never showed
  up on the sheet at all. Both fixed.
- Resuming an in-progress draft now upgrades it like every other load path, so a draft saved
  under an older version keeps its choices.

**Earlier in this release**

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
- One selection & constraint system — `picks` / `excludes` / `requires` — hosted by
  advantages, disadvantages and skills. Archetype specialization runs on it too (**A3**),
  which retired the per-archetype renderer branches and closed **A1** and **A2**.
- Character schema **0.4 → 0.5**: one `archetypeChoices.specialization` array replaces
  `identity.specialization`, `subtype` and `aberrations`, with a `migrate()` step. Game data
  **0.3 → 0.4**: fifteen entries now ask for an input they did not before.
- The suite has **no `todo` for the first time**. An independent adversarial review of the
  Batch 3 PR found five further defects, all fixed before merge (Decision 82).
- Docs guards extended: `package-lock.json` and `README.md`'s version line are now checked
  against `APP_VERSION`, both having drifted a full version unnoticed.

## v0.4.0-phase-3.3

Character schema **0.4** · game data **0.2** · ruleset CRB v4 (WIP).
Audit trail with global undo, admin mode, HL segment strip, TOL/WILL/SAN derivations surfaced.
See `docs/SCHEMA.md` decisions 48–53.
