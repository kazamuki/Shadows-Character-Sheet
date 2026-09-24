# Plan: acting on the 2026-09-24 whole-app audit

**Status:** proposed 2026-09-24, **waiting on Ken.** Nothing here is a decision until Ken says yes and the session that builds it numbers it in `SCHEMA.md` §4.
**Covers:** every finding in [`audits/2026-09-24_whole-app-audit.md`](../audits/2026-09-24_whole-app-audit.md) (A4–A12, B11–B19, C4–C15) and its recommended practices (R1–R13).
**Sources:** the audit's own probes, `docs/reference/crb/041_Archetypes.md` and `043_Advantages.md` (pulled 2026-09-22/23).

When a session finishes, tick its box in §3 and mark its findings closed in `INDEX.md` §2. When every session is done or dropped, this file gets a one-line "done" header and stays as history.

---

## 1. Why this, and why now

The app is in good shape. The audit's point is that **the way it's built and documented has started costing more than it should**, and that "data drives the app" has gaps just where the next two archetypes will land. Cyborg (F6) and Vampire are both waiting on design. Every session spent on this plan before they arrive makes them data, not special cases.

There are also three player-facing problems worth fixing regardless:
- a crafted file can run script in Admin mode (B16);
- importing a file silently replaces your saved sheet (B18);
- mastering a spell makes the app accuse you of editing your file (B11).

## 2. The order, and why

1. **Safety and correctness first (S1).** These are small, need no rulings, and a player can hit them today.
2. **The docs diet next (S2).** It's pure docs, it needs Ken's answers more than code, and **it makes every later session cheaper**. Every session after it pays the smaller per-change cost.
3. **Then the data contract (S3, S4).** It's the structural fix behind A8/A9 and B12–B14, and it wants the lighter process from S2 in place first.
4. **Tooling (S5) can go any time.** It's independent, and a cloud session can do most of it alone.
5. **Table feel (S6) waits on design answers** (AQ4, AQ5, AQ10). Its items then go through the wishlist like any other UX work.
6. **Structure (S7) is opportunistic.** Do each item when a session is already in that code, never as a session of its own.

S1 and S5 can run in parallel with anything. S3 and S4 touch the same engine functions, so run them one after the other.

## 3. Sessions

### S1: Safety and correctness (no rulings needed)
- [ ] **B16**: escape the two Admin ids; while there, stop using `notes` inside Admin's button addresses.
- [ ] **R9**: a permanent hostile-file render test covering every tab, Admin, print and each modal. Mutation-test it against the pre-fix `sheet.js` so it's shown to catch B16.
- [ ] **B18**: before Import or New replaces a slot holding a different character, confirm and offer Export. Needs AQ5 for anything beyond that.
- [ ] **B11**: `versionCheck()` checks spell targets against the Grimoire row's stage. Also **C4**: import warnings stay until dismissed.
- [ ] **B17**: render an option's `starterPower`/`additionalPowers` generically on the Archetype tab and in the wizard card. Display only.
- [ ] **R6, first part**: one generic referential-integrity test over every id-bearing field. It fails today on B15 and the Professional's prose, so:
- [ ] **B15**: flag Hardcore Parkour (a new F-number, with a `playerNote` saying why it's locked) and add "what is Cat Like Balance?" to Ken's CRB fixes (AQ8). Let the test except the Professional prose until S3.
- [ ] **C13**: add a Werewolf and a Professional sheet, and Admin, to the voice corpus.

*Versions:* app minor (0.24.0), since B17 and B18 are visible. Game data: per Decision 68, likely none. *Size:* one session.

### S2: The docs diet and change tiers (docs only; needs AQ1, AQ2, AQ7)
- [ ] **R2**: write the change tiers into `CLAUDE.md`, then number them. Tie "close the session" (rewrite STATE, append the log) to the tiers.
- [ ] **R1**: the short decision template, applied from the next decision on. Existing entries are untouched.
- [ ] **A4 / R3**:
  - `SCHEMA.md` header and §1 rewritten, and §2's stale example lines fixed;
  - §6 moves to `log/`;
  - §5's preamble cut to the table plus one line on closed flags;
  - `README.md` Layout corrected, and it points in;
  - `CONTRIBUTING.md` shrinks to a pointer, or to the human-contributor rules with no volatile facts (AQ7 decides the issue-template half);
  - `docs/README.md` folds into `INDEX.md` §1;
  - the `HANDOFF.md` stub retires;
  - `INDEX.md` §2's namespace count and §4's "generated" claim are fixed.
- [ ] **`CLAUDE.md`** per audit §7: drop the line count; correct the script order; describe the branch names actually used; state each procedure once; three orientation docs, not four plus seven.
- [ ] **A7**: an F-number for every flag. The four weapon tags become F27–F30, added to the grouped Deighton question with F23–F26. The archetype content notes link to F6/F7/F13 or drop their flag.
- [ ] **R6, flag guard**: a test that every `flagged: true` has an F-number open in §5.
- [ ] **C10**: move `meta.notes` history into `log/`, leaving `meta` what the app reads.
- [ ] **C11**: Ken's open CRB fixes (CQ8, CQ9, CQ11–CQ13, plus B15's) move out of the closed combat plan into STATE §5.
- [ ] **A6**: drop STATE's exact test count and the "Live:" line if AQ2 says so, and loosen `docs.test.mjs` to match. It keeps checking the `todo` count, which means something.

*Versions:* none. *Size:* one session, mostly Ken's reading time.

### S3: The Professional as data (needs AQ3, and the data shape proposed first)
- [ ] **A8, Professional half / R7**:
  - `focusedSkills` becomes ids plus a structured pick (e.g. `{ ids: [...], choose: { count: 1, category: "combat" } }`);
  - the Jack-of-all-Trades rule becomes data (e.g. `allSkillsFocused: { upToRank: 4 }`);
  - one generic reader;
  - the three regex/name-matching sites and both `a.id==="professional"` checks go.
- [ ] **B12**: the Mercenary's pick appears. **B13**: `focusedSkillMaxBonus` raises the cap in `canBoost`, the wizard stepper and `validate`. **B14**: Jack-of-all-Trades costs 3× up to rank 4.
- [ ] Pin each with a `rules.test.mjs` case quoting 041.
- [ ] **R13, first table**: test the Professional scaling table against the mirrored 041.

*Versions:* game data minor (available choices change, Decision 68). Character schema: probably none, since `focusedSkillPicks` already stores ids. The proposal must confirm that. App minor. *Size:* one session.

### S4: Read it or label it (engine change, propose first)
- [ ] **A8, Arcanist half**: `disciplines.cpPerRank` read by `disciplineSpent` and the wizard (the two hardcoded 6s go); `maxRankBy` read; the Evocation starting rank declared on the discipline, not matched by id.
- [ ] **A9**, for each "setting the engine ignores": read it, or rename it as display text. The IP formulas and SAN formula become numbers the engine reads. `boostRules` is read or trimmed. `startingSFR` becomes `{ stat, times, plus }`. The credit symbol comes from data. The milestone cadence prose (two data fields, two engine strings) is generated from the numbers.
- [ ] **R6, key guard**: a test that every data key is read by code or named as display text (`*Text`, `*Note`, `description`, `flavorLine`, …).
- [ ] Before and after, diff every computed output across a set of characters, as Batch 1 did. If nothing moves, there's no game-data bump (Decision 68).

*Versions:* none if the diff is clean. *Size:* one session.

### S5: Tooling (independent; a cloud session can do most of it)
- [ ] **R5**: `.claude/settings.json` with a `SessionStart` hook running `npm ci`. Project skills for *close the session*, *number a decision*, *close a flag*, *cut a release*.
- [ ] **R4**: `npm run bump <x.y.z>` writes all five version sites. `npm run release:check` runs before tagging.
- [ ] **R8 / C15**: `npm run test:fast` for engine, rules, docs and build (about 10 s).
- [ ] **R11 / C14**: one dispatchable release workflow (checks, builds once, tags, releases with the CHANGELOG section and both artifacts, deploys Pages). AQ9 decides tag creation.
- [ ] **R12**: a phone-width Playwright check script (header height budget, no horizontal overflow). Outside `npm test` unless CI should install a browser.
- [ ] **C12**: the dev server binds `127.0.0.1` and confines paths to the repo.
- [ ] **C7**: fonts per AQ6.

*Versions:* none, unless fonts are embedded (app patch). *Size:* one session.

### S6: Table feel (after AQ4, AQ5, AQ10; runs through the wishlist)
- [ ] **B19**: the phone header (collapse the tabs, or a header that scrolls away). New wishlist item, design first.
- [ ] **C5**: refusals go to the toast or inline, confirmations to `openModal`. The 33 `alert()`/`confirm()` calls go.
- [ ] **A10**, per AQ4: weapon/spell tag tooltips in the catalog browser and on Loadout; archetype `lore` on the Archetype tab; drop or show ammunition, arrowheads and the Enchantment tables.
- [ ] **R10**: an "unsaved since last export" marker; a roster if AQ5 says so.

*Versions:* app minor. *Size:* one or two sessions.

### S7: Structure (opportunistic, never a session of its own)
- **A11**: `source: "natural"` replaces `notes: "natural"`, with the next character-schema bump that has another reason to happen.
- **A12**: move each screen's binders beside its renderers when a session is already editing them.
- **C6**: delete the no-op, the `skillsFlags` read and stale comments on sight. Regroup the engine's export object by domain the next time it's touched.
- **C8, C9**: revisit if a save file passes about 1 MB, or before a migration that reshapes an array.

## 4. Versions this will move

| Session | App | Game data | Character schema |
|---|---|---|---|
| S1 | minor | none expected | none |
| S2 | none | none | none |
| S3 | minor | minor | probably none; the proposal confirms |
| S4 | none if outputs are identical | none if outputs are identical | none |
| S5 | patch only if fonts are embedded | none | none |
| S6 | minor | none | none (a roster lives in `localStorage` keys, not the file) |
| S7 | with whatever carries it | none | A11 needs a bump and a `migrate()` step |

## 5. Open questions

For Ken unless marked. Each is answered in one line where possible.

- **AQ1: How much docs weight to shed?** Specifically, yes or no to each:
  - (a) short decision records from now on (R1);
  - (b) change tiers deciding what each change must touch (R2);
  - (c) retiring `docs/README.md`, the `HANDOFF.md` stub and SCHEMA §6, and shrinking `CONTRIBUTING.md`.

  Also: does anyone besides Claude read SCHEMA §4 end to end? If Deighton or Scott do, the template should suit them.
- **AQ2: STATE's exact test count and "Live:" line.** Drop both? The CI result and the footer already carry them. The `todo` count stays.
- **AQ3: B12–B14 now, or with the Professional's final pass?** The CRB is unambiguous on all three, so no ruling is needed. The question is only whether the Professional's data is about to change anyway.
- **AQ4: Unshown content (A10), render or drop, item by item.** The weapon and spell tag glossaries (the audit's pick for tooltips), archetype `lore`, ammunition and arrowheads, the Enchantment tables, archetype `growth`.
- **AQ5: The browser's saved sheet.** Is confirm-before-replace enough, or do players need a roster of several characters in one browser?
- **AQ6: Fonts offline.** Embed them (about +100–200 KB in the single file) or accept the system-font fallback?
- **AQ7: GitHub issues.** No issue has ever been filed, and flags live in SCHEMA §5. Delete the issue templates and CONTRIBUTING's issue flow, or start using issues (for playtest bug reports, say)?
- **AQ8 (CRB fix, Ken): What is "Cat Like Balance"?** Hardcore Parkour requires it at rank 1. 043 has no such Advantage (B15).
- **AQ9: Releasing from a cloud session.** OK with one dispatchable workflow that creates the tag itself? The alternative is a token Ken provides so a tag push triggers the existing workflows.
- **AQ10: How do players reach the app at the table?** Phone, tablet or laptop sets B19's priority.
- **Deighton (via S2):** F27–F30, the Suppression, Blast, Anti-Materiel and Reach weapon tags. Ask with F23–F26 as one grouped question.
