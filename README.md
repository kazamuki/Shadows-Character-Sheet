# Shadows — Digital Character Sheet

Character creation and live play sheet for **Shadows**, the cyberpunk-noir urban fantasy RPG running on the **Synergy** system. Get Dangerous Games.

Build a character through an eight-step intake, lock it, and the app becomes a running sheet: damage and Pain Levels, Sanity, Luck, Çredits, IP and Milestones, session log, loadout, and a full undo-able audit trail of everything that happens at the table.

**Status:** app `0.27.1` · character schema `0.12` · game data `0.21` · ruleset target **CRB v4 (in progress)**
Working on it? Start with [`CLAUDE.md`](CLAUDE.md), then [`docs/STATE.md`](docs/STATE.md). [`docs/INDEX.md`](docs/INDEX.md) finds everything else.

---

## Run it

**Play it online** at [charactersheet.shadowsrpg.com](https://charactersheet.shadowsrpg.com), or download the single file from the [latest release](https://github.com/kazamuki/Shadows-Character-Sheet/releases/latest).

**Or run it from a folder: no install, no server, no build step.** Clone or download, then open `index.html` in a browser. It works offline, fonts included.

That constraint is load-bearing, not laziness — a GM should be able to hand a player a folder and have it work. It is why the game data is a `.js` file instead of `.json`, why the icons are inline SVG strings, and why nothing in `src/` may use ES `import`/`export`. See `docs/SCHEMA.md` §1.

**One-file version** (what you hand to players):

```bash
npm run build     # → dist/shadows-character-sheet.html, and dist/shadows-blank-sheet.html
```

Everything gets inlined into a single self-contained HTML file. Same architecture, one artifact. The blank sheet is the printable template on its own.

## Work on it

```bash
npm install       # dev tools only (jsdom, the font packages, playwright-core) — the app ships with zero dependencies
npm test          # engine unit tests + jsdom end-to-end smoke
npm run test:fast # engine, rules, docs and build tests: the quick loop
npm run verify    # build check + tests (run this before every commit)
```

The rest (`bump`, `release:check`, `phone-check`, the dev server) is under *Commands* in [`CLAUDE.md`](CLAUDE.md).

## Releases

A release is one GitHub Actions workflow. Date the changelog section (`npm run release:prep`) and merge it, then run **Actions → release** on `main` with the version. It checks, tests, builds, tags, publishes the Release with its notes and both files, and updates the live site. The full steps are in [`CLAUDE.md`](CLAUDE.md) and the `cut-a-release` skill.

## Layout

```
index.html              Shell only: markup + script tags. No logic, no styles.
src/
  data/
    shadows-data.js     All game content. Designers edit this, in any text editor.
    shadows-changelog.js  What's new in the app, generated from CHANGELOG.md.
    shadows-icons.js    Brand stat icons + Lucide UI icons, as inline SVG strings.
  engine/engine.js      Pure rules engine. No DOM. Every computed value lives here.
  ui/                   shared.js, wizard.js, sheet.js, app.js (+ theme-init.js):
                        classic scripts, one global scope. Render off the engine.
  styles/               shadows.css (screen), print.css (the printed sheet), and fonts.css:
                        the brand fonts embedded, generated, with their OFL licences in fonts/.
docs/
  STATE.md              Where things stand and what's next. Start here, after CLAUDE.md.
  INDEX.md              The map: where every decision, flag and finding lives.
  SCHEMA.md             Architecture, both schemas, the decision ledger, open flags.
  audits/  plans/  log/ Whole-app audits · multi-session plans · session history.
.claude/                Claude Code's session hook, dev-server launcher, and skills/: the procedures as runbooks.
.github/workflows/      verify (every PR) and release (one run: check, build, tag, publish, deploy).
tests/                  Engine units, CRB conformance, hostile files, voice, jsdom smoke, guards.
tools/                  build.mjs (the single file), changelog.mjs, release.mjs, and dev helpers.
```

## The two rules that keep this working

**Store inputs, compute everything else.** A character file records `BOD = 7`. It never records the +1 modifier, the 7 Health Levels, or the 35 HP — those are computed from game data on every render. Change a formula in `shadows-data.js` and every existing character updates on next load. This is why the audit/undo system could be a generic structural diff instead of a pile of inverse handlers.

**IDs are the contract.** Every id in `shadows-data.js` is referenced by saved `.shadows.json` character files. Renaming an id orphans real characters. Names can change freely; ids cannot.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Short version: run `npm run verify`, flag design questions in `docs/SCHEMA.md` §5 rather than deciding them in code, report bugs as GitHub issues, and update `docs/SCHEMA.md` in the same commit as any decision.

---

© Get Dangerous Games. All rights reserved. Licensing is deliberately unset pending entity formation — do not add a license file without a founders' decision.
