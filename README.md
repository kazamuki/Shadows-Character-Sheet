# Shadows — Digital Character Sheet

Character creation and live play sheet for **Shadows**, the cyberpunk-noir urban fantasy RPG running on the **Synergy** system. Get Dangerous Games.

Build a character through an eight-step intake, lock it, and the app becomes a running sheet: damage and Pain Levels, Sanity, Luck, Çredits, IP and Milestones, session log, loadout, and a full undo-able audit trail of everything that happens at the table.

**Status:** app `0.8.0` · character schema `0.5` · game data `0.5` · ruleset target **CRB v4 (in progress)**
Read [`docs/SCHEMA.md`](docs/SCHEMA.md) before changing anything. It is the project's memory.

---

## Run it

**No install, no server, no build step.** Clone or download, then open `index.html` in a browser.

That constraint is load-bearing, not laziness — a GM should be able to hand a player a folder and have it work. It is why the game data is a `.js` file instead of `.json`, why the icons are inline SVG strings, and why nothing in `src/` may use ES `import`/`export`. See `docs/SCHEMA.md` §1.

**One-file version** (what you hand to players):

```bash
npm run build     # → dist/shadows-character-sheet.html
```

Everything gets inlined into a single self-contained HTML file. Same architecture, one artifact.

## Work on it

```bash
npm install       # jsdom, for tests only — the app ships with zero dependencies
npm test          # engine unit tests + jsdom end-to-end smoke
npm run verify    # build check + tests (run this before every commit)
```

## Layout

```
index.html              Shell only: markup + script tags. No logic, no styles.
src/
  data/
    shadows-data.js     All game content. Designers edit this, in any text editor.
    shadows-icons.js    Brand stat icons + Lucide UI icons, as inline SVG strings.
  engine/engine.js      Pure rules engine. No DOM. Every computed value lives here.
  ui/app.js             Wizard, sheet, session tracking. Renders off the engine.
  styles/shadows.css    Brand tokens and all styling.
docs/
  SCHEMA.md             Architecture, both schemas, locked decisions, open flags, roadmap.
  STATE.md              Current status, the batch board, what happens next. Start here.
  audits/               Whole-app audits, dated.
tests/                  Engine units, jsdom smoke, build/architecture guards.
tools/build.mjs         Inlines everything into dist/.
```

## The two rules that keep this working

**Store inputs, compute everything else.** A character file records `BOD = 7`. It never records the +1 modifier, the 7 Health Levels, or the 35 HP — those are computed from game data on every render. Change a formula in `shadows-data.js` and every existing character updates on next load. This is why the audit/undo system could be a generic structural diff instead of a pile of inverse handlers.

**IDs are the contract.** Every id in `shadows-data.js` is referenced by saved `.shadows.json` character files. Renaming an id orphans real characters. Names can change freely; ids cannot.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md). Short version: run `npm run verify`, log design questions as issues rather than deciding them in code, and update `docs/SCHEMA.md` in the same commit as any decision.

---

© Get Dangerous Games. All rights reserved. Licensing is deliberately unset pending entity formation — do not add a license file without a founders' decision.
