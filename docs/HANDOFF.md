# Handoff — Shadows Digital Character Sheet

**As of:** 2026-08-02
**Build:** Phase 3.4 · character schema `0.4` · game data `0.2` · ruleset target **CRB v4 (WIP)**
**Repo state:** restructured from a single `index.html` into a source tree; test suite formalized; no behavior changes. Docs re-verified against the code and corrected 2026-08-02 — see §10.

If you are a new session picking this up: read this file, then `docs/SCHEMA.md`. SCHEMA is the authority on architecture, both schemas, the 54 numbered decisions, and the open flags. This file is the *current position* — what works, what's broken, and what happens next.

---

## 1. What this is

A browser-based character creator and live play sheet for **Shadows** (Synergy system). Eight-step intake wizard → lock → a nine-tab running sheet with damage/Pain Levels, Sanity, Luck, Çredits, IP and Milestones, session log, loadout, and an undo-able audit trail of every action.

It runs from `file://` with no server and no build step. That constraint drives most of the architecture and is enforced by tests.

## 2. Repository layout

```
index.html              Shell: markup + script tags. 31 lines. No logic, no styles.
src/
  data/shadows-data.js     All game content (2,839 lines). Designers edit this.
  data/shadows-icons.js    Brand stat icons + Lucide UI icons as inline SVG strings.
  engine/engine.js         Pure rules engine (714 lines). No DOM. 56 exported functions.
  ui/app.js                Wizard + sheet (1,910 lines). One IIFE. Renders off the engine.
  styles/shadows.css       Brand tokens + all styling (448 lines).
docs/
  SCHEMA.md                Project memory. Read before touching anything.
  HANDOFF.md               This file.
  audits/                  Dated whole-app audits; findings referenced by id (A1, B2, C3).
tests/
  harness.mjs              jsdom boot + a bare-VM engine loader.
  engine.test.mjs          Engine units, run with no DOM present.
  smoke.test.mjs           Boot, wizard, all nine sheet tabs.
  build.test.mjs           Architecture guards (no ES modules, shell stays a shell, script order).
tools/build.mjs            Inlines everything into dist/shadows-character-sheet.html.
```

**Commands**

```bash
npm install      # jsdom only; the app itself ships with zero dependencies
npm run verify   # build check + full suite — run before every commit
npm run build    # → dist/shadows-character-sheet.html (the file players get)
```

## 3. What changed in the restructure (and what didn't)

**Did change:** the monolithic `index.html` was cut into five files along seams that already existed — the `/*ENGINE-START*/`…`/*ENGINE-END*/` markers, the `/*UI-START*/`…`/*UI-END*/` markers, and the `<style>` block. Script order in the shell is fixed: **data → icons → engine → ui**. The markers were kept as comments so any older harness that extracts by marker still works.

**Did not change:** a single line of application logic. The split is a pure file operation. Verified by booting the built artifact in jsdom with zero runtime errors and rendering all nine sheet tabs.

**Deliberately not done:** decomposing `src/ui/app.js` further. It is one closure where ~90 functions share `S`, `D`, `$`, `esc`, `update`, and `commit`. Splitting it means rewriting hundreds of cross-references, and doing that in the same change as a repo restructure destroys your ability to tell which change broke what. See §7 for when and how to do it.

### Constraints the tests now enforce

1. **No ES modules in `src/`.** `import`/`export` are blocked by CORS on `file://`. `build.test.mjs` fails on either keyword.
2. **`index.html` stays a shell.** No inline `<style>`, no inline `<script>`, under 4 KB.
3. **The engine never touches the DOM.** `engine.test.mjs` loads it in a bare VM with only `window` stubbed. Any reach for `document` kills that suite.
4. **Every local asset inlines cleanly** into the single-file build.
5. **Script order** is asserted explicitly.

## 4. Test suite — current results

**20 passing, 2 `todo`, 0 failing.**

The two `todo` tests are not aspirational; they are the two confirmed defects below, written as failing assertions so they flip green the moment they're fixed. This is where the audit findings live now — in code, not only in markdown.

| Suite | Covers |
|---|---|
| `engine.test.mjs` | Engine loads with no DOM · `newCharacter` shape vs schema 0.4 · derived values computed and never stored · health follows BOD · `validate` returns issues for every step · audit record/undo round-trip · `diffChar` reports only changes · `migrate` 0.3→0.4 seeds `audit` · `versionCheck` surfaces mismatch · every skill references a stat that exists (guards the `BODY`/`BOD` class of bug) |
| `smoke.test.mjs` | Boots clean on Home · New character opens step 1 · a locked character resumes from storage and all nine tabs render with zero errors · the sheet survives a data change |
| `build.test.mjs` | The five architecture constraints in §3 |

## 5. Known defects — verified against the current build

The rev 9 audit (`docs/audits/2026-06-16_rev9-whole-app-audit.md`) is the reference. **Every finding in it is still open in this build.** Whatever earlier fixes were made, they are not in the file that was handed over. Two were re-confirmed empirically here, not just by reading:

- **A1 — Arcanist renders its aberrations twice, both required. [verified 2026-08-02]** Driving a draft to the archetype step produces **6 `[data-spec]` buttons + 6 `[data-aber]` buttons** for the same six aberrations. A player must pick one up top *and* N below to clear validation. Tracked by a `todo` test in `smoke.test.mjs`.
- **B2 — the two dead stat aliases are worse than the audit recorded. [verified 2026-08-02]** The real stat ids are `BOD, REF, MOB, INT, TECH, COOL, MAG, EMP`. `STAT_ALIASES` maps `MOVEMENT→"MA"` and `ATTRACTIVENESS→"ATTR"` — *neither target exists*. Should be `MOB` and `MAG`, or dropped if no legacy data uses those names.

Still open, unchanged from the audit: **A2** (the sheet's Specialization section can't see non-Arcanist picks), **A3** (the unification that fixes A1+A2), **B1** (stale "Session tracking arrives in Phase 3" copy at `app.js:493`), **B3** (`levelsPerBOD` is an authoritative-looking data knob the engine ignores), **B4** (`Engine.undoIP` is dead code, superseded by `undoLastAction`), **B5** (review step number hardcoded as `n:8`), **B6** (unlocked-draft import is a shallow merge), **C1–C3** (forward notes, not bugs).

**New finding from this session:**

- **B7 — `validate` is not total.** `validate("stats", ch)` throws `TypeError: Cannot read properties of null (reading 'roll')` at `engine.js:579` when the character has no power level, because `statPool()` returns null. The wizard gates this so it is not live, but a corrupt import or an admin edit reaches it. `validate` should report an issue, never throw. Tracked by a `todo` test in `engine.test.mjs`.

**Quick wins, no design input needed:** B1, B2, B4, B5. **B3** and **B6** want a one-line "is this intended?" first.

## 6. Open design flags

Full table in `SCHEMA.md` §5. Fourteen flags, thirteen entries in `shadows-data.js` carrying `flagged: true`. Grouped by who unblocks them:

**Deighton rules these:**
- **F8 — Stat Point roll conflict. The only wizard-blocking flag.** WIP says a flat `3d10+30` for all power levels; REF scales by level (`30+2d10` … `60+5d10`). The data file uses the scaled table pending a ruling. When ruled, this is a **four-number data edit** — no code change, because the wizard reads `statPoints` off the power-level entry.
- F1 — LUCK buy-up cost in CP per point (stubbed 1:1)
- F2 — CP boost exchange rate across skills/stats/powers (stubbed 1:1)
- F5 — Adv/Disadv audit flags (Poverty, Combat Paralysis, Field Medic, Cyber-Prophetical)
- F14 — Skill IP cost at rank 0: "5 × current rank" prices learning a new skill at zero; the app charges rank 1 (5 IP; Focused 3), flagged in the Progression UI

**Docs/reconciliation (Ken):**
- F10 — Professional Focused Skills reference **Occult** and **Survival**, neither of which exists in the 34-skill catalog; plus "Handgun" vs "Handguns". *Affects subtype selection in the wizard.*
- F9 — are "General Milestones" shared across archetypes or Professional-only? (data treats them as shared)
- F11 — Quick Study milestone requires an "Intuition Advantage"; Intuition is a *Skill*
- F12 — Minor Milestones pool sourced from REF v3.5; WIP defers to an unwritten Advancement Section
- F13 — Vampire `canPurchaseAdvantages: false` assumed from the Werewolf baseline — confirm

**Design work:**
- F6 — Biomech/Cyborg rewrite (NCI tiers, Set Bonuses, Kicker Dice, TOL pressure); ships as `status: "tbd"`
- F7 — SFR per archetype: Werewolf defined (WILL×3+N, RoU); Vampire Blood Pool TBD

Archetype status in the data today: `arcanist: draft · professional: draft · werewolf: draft · cyborg: tbd · vampire: tbd`.

## 7. Where this goes next

The sequencing from the audit still holds, and the restructure was done specifically to make step 2 safe.

**Phase 4 — the selection & constraint system.** One piece of machinery, three payoffs.

1. **Clear F8** whenever Deighton rules. Four numbers. Unblocks the wizard.
2. **Build `picks` / `excludes` / `requires`** as the adv/disadv feature (audit §4). Data shape and character storage are already specified there. Self-contained, high value at the table: mutual locks, freeform text prompts, per-rank skill picks.
3. **Retrofit specialization onto it** (A3). Delete the `arcanist` / `professional` / `werewolf` branches in `renderArchetype` and the aberration-only branch in `renderShArchetype`. A1 and A2 fix themselves as a side effect, and the `todo` test flips green.
4. **Then the Biomech rewrite** (F6) lands as *data* — "Chrome Loadout" is a specialization with picks, NCI tiers and augment slots are panels — instead of a fourth special case.

Doing 2→3 before 4 means Biomech is the first archetype authored entirely through the generic system. That is the real test of the project's thesis: if a designer can describe an archetype in `shadows-data.js` and the app just renders it, the rulebook can run without Deighton in the room.

**When to decompose `src/ui/app.js`.** Not yet, and not as a standalone chore. The natural moment is *during* step 2, when `renderCP`, `renderArchetype`, and `renderShTraits` are already being rewritten. The mechanism: introduce one explicit namespace object (`const SH = {}`) holding the shared state and helpers, move the leaf renderers out first (sheet tabs — they mostly read `S` and call `update`), and leave `bindMain` / `bindSheet` / `boot` in a core file until last. Do it one file at a time with `npm run verify` between each. Do not attempt it in the same commit as a behavior change.

**Also pending:** the `shadows-data.js` update pass from the Thursday meeting resolutions. **ID immutability is the contract** — ids in the data are referenced by saved `.shadows.json` files, so a regen or large edit must preserve every existing id. Names may change; ids may not.

## 8. Conventions a new session must not break

- **Store inputs, compute everything else.** A character stores `BOD = 7`, never the modifier, the Health Levels, or the HP. This is why audit/undo could be a generic structural diff instead of per-action inverse handlers, and why a formula change updates every existing character on next load.
- **IDs are immutable.** Display names are free.
- **Design questions are not resolved in code.** They get a `flagged: true` entry, a line in `SCHEMA.md` §5, and an issue on the `design-flag` template. The app surfaces the uncertainty at the table rather than hiding a guess.
- **Decisions are numbered.** `SCHEMA.md` §4 is at 54. A decision that isn't numbered didn't happen.
- **Prose edits belong in the markdown source first**, then flow into the data file; structural or mechanical changes go directly into the `.js` or through a structured changelist. Wholesale regeneration overwrites machine-readable metadata.
- **Player-facing copy is in-world writing**, not UI microcopy. It follows `GUIDE_Shadows_Voice.md` — the app speaks as NYTE City, not as a rulebook author instructing the reader.

## 9. Starting a session

> Continue the Shadows character sheet build. The repo is in project knowledge — read `docs/HANDOFF.md`, then `docs/SCHEMA.md`. Run `npm run verify` before and after any change.

Close every session by updating `SCHEMA.md` (decisions, flags, roadmap) and this file in the same commit as the code.

---

## 10. Session log

### 2026-08-02 — handoff verification & doc reconciliation (PR #1)

First session run from the restructured repo rather than from project knowledge. **No application code was touched.** The purpose was to confirm the handoff actually lands cold, and it does.

**Verified, not assumed:**

- `npm run verify` → **20 passing, 2 todo, 0 failing**, matching §4 exactly. Requires `npm install` first — `node_modules` is not committed.
- Both `todo`s are the right two. A1 fails with the precise signature §5 records (`36 !== 0` — six `[data-spec]` + six `[data-aber]`).
- Every finding spot-checked against source is real and at the cited line: **B2** `engine.js:201`, **B7** `engine.js:579`, **B1** `app.js:493`, **B5** `app.js:21`, **B4** `engine.js:317`.
- `index.html` is a 31-line shell with script order data → icons → engine → ui, as §3 claims.
- CI (`.github/workflows/verify.yml`) confirmed working end to end — green on `pull_request` and on the post-merge push to `main`.

**Corrected — four stale facts, all in docs:**

- `SCHEMA.md` header read schema `0.3`; Decision 53 bumped it to `0.4`.
- `SCHEMA.md` §1 architecture table still described `index.html` as the whole app; Decision 54 split it into `src/`. Table now lists the six real source files.
- `SCHEMA.md` §1 ship path described manual inlining; it is `npm run build` now.
- Decision count read 53 in three places (this file ×2, `docs/README.md`); §4 lists 54.

No decision number assigned — reconciling docs to Decisions 53 and 54 is not itself a decision.

**Standing caution for the next session:** the drift above was all in the direction of *docs lagging the code*, and `SCHEMA.md` was stale in its own summary line while remaining the designated authority. Spot-check the claim you are about to rely on. Line numbers in §5 were accurate; the version stamps were not.

**Unrelated note:** `index.html` loads three typefaces from Google Fonts. `tools/build.mjs` inlines *local* assets only, so a GM opening the folder offline gets system-font fallback. Not a defect — flagged because "hand a player a folder and it works" is load-bearing and the typography is brand.

**Position unchanged.** Phase 4 sequence stands as §7 describes it: clear F8, build `picks`/`excludes`/`requires`, retrofit A3, then Biomech. Quick wins B2/B4/B5 remain mechanical and unclaimed; **B1** touches player-facing copy and wants a voice pass rather than a straight deletion.
