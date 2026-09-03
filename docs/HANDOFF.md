# Handoff — Shadows Digital Character Sheet

**As of:** 2026-09-02
**Build:** Phase 3.4 + CRB v4 content pass + quick-win pass + Batch 1 · character schema `0.4` · game data `0.3` · ruleset target **CRB v4 (WIP)**
**Repo state:** restructured from a single `index.html` into a source tree; test suite formalized. Skills, Advantages and Disadvantages re-merged from the CRB on 2026-08-29 — **data only, no app code touched** — see §10. Two passes landed on 2026-09-02: the quick wins (**B2, B4, B5** — Decisions 59-61) and **Batch 1** of the debt ledger (**B3, B6, B7, B8, B9, B10** and the stale **F10** flag — Decisions 62-68). Suite now **45 passing / 1 todo / 0 failing**.

If you are a new session picking this up: read this file, then `docs/SCHEMA.md`. SCHEMA is the authority on architecture, both schemas, the 68 numbered decisions, and the open flags. This file is the *current position* — what works, what's broken, and what happens next.

---

## 1. What this is

A browser-based character creator and live play sheet for **Shadows** (Synergy system). Eight-step intake wizard → lock → a nine-tab running sheet with damage/Pain Levels, Sanity, Luck, Çredits, IP and Milestones, session log, loadout, and an undo-able audit trail of every action.

It runs from `file://` with no server and no build step. That constraint drives most of the architecture and is enforced by tests.

## 2. Repository layout

```
index.html              Shell: markup + script tags. 31 lines. No logic, no styles.
src/
  data/shadows-data.js     All game content (2,940 lines). Designers edit this.
  data/shadows-icons.js    Brand stat icons + Lucide UI icons as inline SVG strings.
  engine/engine.js         Pure rules engine (771 lines). No DOM. 55 exported functions.
  ui/app.js                Wizard + sheet (1,921 lines). One IIFE. Renders off the engine.
  styles/shadows.css       Brand tokens + all styling (448 lines).
docs/
  SCHEMA.md                Project memory. Read before touching anything.
  HANDOFF.md               This file.
  audits/                  Dated whole-app audits; findings referenced by id (A1, B2, C3).
tests/
  harness.mjs              jsdom boot + a bare-VM engine loader.
  engine.test.mjs          Engine units, run with no DOM present.
  smoke.test.mjs           Boot, wizard, all nine sheet tabs.
  rules.test.mjs           CRB conformance — the rulebook's worked examples.
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

**45 passing, 1 `todo`, 0 failing** (46 tests, four files).

**A1 is the only `todo` left.** It is not aspirational — it is a confirmed defect written as a failing assertion so it flips green the moment A3 lands in Batch 3. B7's `todo` was promoted to a real assertion in Batch 1.

*Count history, because this line has drifted twice and is worth watching:* 20 at the restructure → 22 when PR #4 added two build-entrypoint tests (docs not updated) → 26 with the quick-win guards → 45 with Batch 1.

| Suite | Covers |
|---|---|
| `engine.test.mjs` | Engine loads with no DOM · `newCharacter` shape vs schema 0.4 · derived values computed and never stored · health follows BOD · `validate` returns issues for every step · audit record/undo round-trip · `diffChar` reports only changes · `migrate` 0.3→0.4 seeds `audit` · `versionCheck` surfaces mismatch · every skill references a stat that exists (guards the `BODY`/`BOD` class of bug) |
| `smoke.test.mjs` | Boots clean on Home · New character opens step 1 · a locked character resumes from storage and all nine tabs render with zero errors · the sheet survives a data change |
| `build.test.mjs` | The five architecture constraints in §3 · `build.mjs` actually runs and writes when invoked as a CLI (PR #4) |
| `rules.test.mjs` | **New in Batch 1.** CRB conformance — the rulebook's worked examples, each quoting its source line. Health/HL, the BOD-above-10 rate, Pain Level thresholds and stacking penalties, the two Pain floors, Luck costs, the modifier curve, the milestone cadence |

Added by the quick-win pass: every declared stat alias resolves to a live stat id (source-level, so new aliases are covered) · a legacy stat name resolves and an unresolvable one warns instead of throwing · the generic undo reverses an IP spend and `undoIP` is gone · the review step is numbered off the data.

Added by Batch 1: **`migrate()` returns every field `newCharacter()` has** (with three load-bearing exemptions) · **no exported reader throws on any character `migrate()` can return** — six degenerate characters × twenty-seven readers × every `validate` step, which is the guard that would have caught B2, B6 and B7 together and found B10 on its first run · the sheet states the CRB's pain floors · an orphaned skill id still renders.

## 5. Known defects — verified against the current build

The rev 9 audit (`docs/audits/2026-06-16_rev9-whole-app-audit.md`) is the reference. **Six of its findings are now closed** — B2, B3, B4, B5, B6 and B7, all on 2026-09-02. Batch 1 also opened and closed three findings the audit never had: **B8**, **B9** and **B10**.

- **A1 — Arcanist renders its aberrations twice, both required. [verified 2026-08-02]** Driving a draft to the archetype step produces **6 `[data-spec]` buttons + 6 `[data-aber]` buttons** for the same six aberrations. A player must pick one up top *and* N below to clear validation. Tracked by a `todo` test in `smoke.test.mjs`.
- ~~**B2 — the two dead stat aliases.**~~ **Closed 2026-09-02, Decision 59.** Worse a third time than recorded: because `normStat` returned its alias target unchecked, an unresolvable alias came back truthy and `skillLine` **threw** on `t[pri].value` rather than raising its `dataWarning` — confirmed empirically, `TypeError: Cannot read properties of undefined (reading 'value')`. Targets corrected to `MOB`/`MAG` and `normStat` now verifies them.

Also closed 2026-09-02: **B4** (`Engine.undoIP` deleted, Decision 60), **B5** (review step number derived, Decision 61), **B3** (`levelsPerBOD` deleted — the CRB settles it, Decision 64), **B6** (the `migrate()` completeness invariant, Decision 63) and **B7** (`validate` made total, Decision 62).

**Found and closed in Batch 1, not in the audit:**

- **B8 — the two Pain Level floors were never surfaced.** The CRB floors Essence Checks at 1 die and Breaker at 10% "to prevent automatic loss"; both lived in the data as an unread prose `notes` string and the sheet showed bare penalties. A player at Pain Level 3 read "−3 Essence die" with nothing saying where it stops. Decision 66.
- **B9 — the milestone cadence was stated twice and connected never.** Prose in the data beside arithmetic in the engine, plus an inert `milestonePointsPerSession`. They agreed on the day it was found, which is the only reason it was not already a bug. Decision 67.
- **B10 — an orphaned skill id crashed the review screen.** `skillLine` dereferenced a definition that `skillById` no longer returns — a case `versionCheck` *explicitly reports as supported*. **Found by the new totality guard on its first run**, which is the clearest argument for the guard existing.

Still open, unchanged from the audit: **A2** (the sheet's Specialization section can't see non-Arcanist picks), **A3** (the unification that fixes A1+A2), **B1** (stale "Session tracking arrives in Phase 3" copy at `app.js:493`), **B3** (`levelsPerBOD` is an authoritative-looking data knob the engine ignores), **B6** (unlocked-draft import is a shallow merge), **C1–C3** (forward notes, not bugs).

**Standing observation for the next session.** `statMod()` extrapolates +1 per point above 10, carrying an in-code comment reading "FLAG: confirm with D." `statRules.beyondHumanLimits` says the opposite — *"Once a stat passes 10, gains slow down."* Those disagree, and **this flag exists only as a code comment: it has no F-number and is not in the table.** That is the same drift class Batch 1 closed elsewhere. Not fixed here because it is a genuine rules question, not a data-honesty one — it belongs in the grouped Deighton ask.

**Everything mechanical is now closed.** What remains is Batch 2 (voice and the `playerNote` split), Batch 3 (picks/excludes/requires, then A3), and the flags. **B1** is Batch 2 — player-facing copy, and it turned out to be one of ten leak sites, not one string.

## 6. Open design flags

Full table in `SCHEMA.md` §5. Twelve open flags, eleven entries in `shadows-data.js` carrying `flagged: true`. The CRB v4 pass closed **F10** outright, three quarters of **F5**, and **F15** (raised and resolved the same day); it opened **F16**. Grouped by who unblocks them:

**Deighton rules these:**
- **F8 — Stat Point roll conflict. The only wizard-blocking flag.** WIP says a flat `3d10+30` for all power levels; REF scales by level (`30+2d10` … `60+5d10`). The data file uses the scaled table pending a ruling. When ruled, this is a **four-number data edit** — no code change, because the wizard reads `statPoints` off the power-level entry.
- F1 — LUCK buy-up cost in CP per point (stubbed 1:1)
- F2 — CP boost exchange rate across skills/stats/powers (stubbed 1:1)
- F5 — Adv/Disadv audit flags. **Three of four closed by the CRB v4 pass** (Field Medic now names "Medical"; Combat Paralysis is unambiguous; Poverty Max Rank ruled at 3). Only Cyber-Prophetical remains, and it waits on F6
- F14 — Skill IP cost at rank 0: "5 × current rank" prices learning a new skill at zero; the app charges rank 1 (5 IP; Focused 3), flagged in the Progression UI

**Docs/reconciliation (Ken):**
- F16 — Hemophiliac calls for a "First Aid Skill Check"; the catalog skill is **Medical**. The last real one — Field Medic's half was fixed in the same pass.
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

**Done 2026-08-29:** the `shadows-data.js` content pass for Skills, Advantages and Disadvantages (§10). ID immutability held — every existing id survived, so no `migrate()` step was needed. Still pending from the same meeting: the archetype sections (041) and anything downstream of the Biomech rewrite.

## 8. Conventions a new session must not break

- **Store inputs, compute everything else.** A character stores `BOD = 7`, never the modifier, the Health Levels, or the HP. This is why audit/undo could be a generic structural diff instead of per-action inverse handlers, and why a formula change updates every existing character on next load.
- **IDs are immutable.** Display names are free.
- **Design questions are not resolved in code.** They get a `flagged: true` entry, a line in `SCHEMA.md` §5, and an issue on the `design-flag` template. The app surfaces the uncertainty at the table rather than hiding a guess.
- **Decisions are numbered.** `SCHEMA.md` §4 is at 68. A decision that isn't numbered didn't happen.
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


### 2026-08-29 — CRB v4 content pass: Skills, Advantages & Disadvantages

**No application code was touched.** Data and docs only. `npm run verify` ran before the first change and after every batch: **20 passing, 2 todo, 0 failing** throughout, matching §4.

Merged from the CRB sources — `042_Skills.docx`, `043_Advantages.docx`, `044_Disadvantages.docx` — as Decisions 55-58.

**What moved:**

- **Skills 34 → 36.** New: `occult-lore` (INT/COOL), `survival` (BOD/INT). Recategorised: `tactics` general → combat, `streetwise` utility → general. Now 11 combat / 9 utility / 16 general. Every skill carries a `flavorLine`; eight carry `notes`; Martial Arts carries `styles`.
- **Advantages 57, Disadvantages 30 — every id preserved.** No renames, no removals, so no `migrate()` step and no risk to saved `.shadows.json` files.
- **Numeric changes:** Poverty 2→4 CP and Max Rank 1→3; Gullible 3→5; Passive 3→4; `universal: true` added to Followers/Minion and Time Sense.
- **Game data 0.2 → 0.3.** Verified empirically: a new character stamps `gamedataVersion: "0.3"`, and a 0.2 character reports the mismatch through `versionCheck`. Character schema stays 0.4, untouched.

**Mechanical drift worth knowing about at the table.** Most of the rewriting is voice, but real mechanics moved inside it. One change is systemic and clearly deliberate: **absolute Target Numbers became relative TN modifiers** across nine entries (Iron Will, Machindo, Animal Ken, True Faith, Weak Willed, Fanatic, Terminal Disease, Berserker, Addiction). Individually: Field Medic and Hyper Vigilance swap kicker-die *escalation* for a flat stacking die; **Favored Skill inverts whether LUCK may modify the re-roll**; Coward drops to Target 9 / Threshold 2 with a per-turn retry; Long-Lived now grants Milestones and is creation-only; Machindo adds Pilot; Blood Lust moves a natural 1 from auto-fail to botch; Terminal Disease gains a death clock.

**Fixed in passing by the CRB text:** `time-sense`'s stored description was truncated mid-word ("once per game sessio"); `lightning-calculator` referenced "Advanced Tech", a skill that does not exist (now Engineering); Ghost TAG referenced "Electronic Security" (now Security); Dwarf, Giant and Hemophiliac said `BODY`.

**Flags:** **F10 closed outright** — both halves. The catalog gained Occult Lore and Survival, *and* the Professional subtype references were renamed to match, which mattered because focused-skill matching is by **name**, not id. **F5 is three-quarters closed**; only Cyber-Prophetical remains, waiting on F6. Opened **F15** (Tracking) and **F16** (Hemophiliac) — see §6.

**One real test-suite defect found and fixed.** The "every skill references a stat that exists" guard looped over a `synergy` array that the data does not have, and never checked `synergyStat` — the field `skillLine()` actually reads. It had therefore never guarded the synergy half at all, and would not have caught either invalid synergy stat this pass turned up. One-line fix; suite still 20/2/0.

**Two things the source docs are still carrying:**

Both were resolved at source the same day and re-verified against the saved docs:

- **Tracking read "(INT / INT)"** — a slip made while correcting Occult Lore and Survival off their derived-attribute synergies. Ken confirmed **INT/EMP** and fixed the CRB. The data had carried INT/EMP throughout, so F15 opened and closed without a data change.
- **Age read "BODY Max: 5"** while Dwarf, Giant and Hemophiliac had been corrected to `BOD`. Fixed in the CRB.

The first read of `044_Disadvantages.docx` missed the Age fix because the file was still open in Word — the edit had not been flushed to disk, and its mtime was unchanged. Worth remembering: **re-extract the sources after the author says they are saved and closed**, and diff, rather than trusting the first read. Doing that here confirmed the committed data matched the saved docs with zero differences.

**Deferred on purpose.** Rank tables render as labelled bullets rather than structured `rankTable` (Decision 57), and none of the `picks` machinery the CRB now specifies is encoded (Decision 58). Both belong with the Phase 4 renderer work, not in a content merge.

**Position unchanged.** Phase 4 sequence still stands: clear F8, build `picks`/`excludes`/`requires`, retrofit A3, then Biomech. What changed is that step 2 now has a written requirement set and a ~15-entry test corpus instead of a sketch.


### 2026-09-02 — quick-win pass: B2, B4, B5

The first application-code change since the restructure. Three named audit
findings, no design input needed, no schema bump, no data change, no id moved.
`npm run verify` before: **22 passing / 2 todo / 0 failing**. After: **26 / 2 / 0**.

**Closed as Decisions 59-61.**

- **B2 — stat aliases.** Targets corrected to `MOB`/`MAG`, *and* `normStat`
  now verifies that its alias target is a live stat id.
- **B4 — `undoIP`.** Deleted from the engine and its export list, with a
  comment at the site naming what superseded it.
- **B5 — review step number.** `n: D.creationFlow.steps.length + 1`.

**B2 was worse than two rounds of documentation recorded.** The audit said a
bad alias "would still trip the unknown-stat flag"; the 2026-08-02 re-check
said the targets don't exist. Neither noticed that `normStat` returned the
alias target *without checking it*, so an unresolvable alias came back truthy,
`skillLine` skipped its `dataWarning` branch and dereferenced `t["MA"].value`.
Confirmed by running it: `TypeError: Cannot read properties of undefined
(reading 'value')`. A skill authored against "Movement" or "Attractiveness"
would have taken down the whole Skills tab, not shown a gold flag. This also
means **Decision 22's stated guarantee — "degrades gracefully on unknown ids
instead of crashing" — was untrue for precisely the case it was written for.**
It is true now.

Worth keeping in view: the alias map is the *pre-Shadows* stat vocabulary
(`BODY`, `REF`, `INT`, `TECH`, `COOL`, `EMP`, `MA`, `ATTR`). The two broken
entries had the old system's own abbreviation on the target side — a
copy-of-the-source-column slip, not a guess at a Shadows id.

**Four new guards, each mutation-tested.** Every one was run against the
pre-fix code to confirm it actually fails there — a guard that passes both
before and after is decoration. The alias guard reads the `STAT_ALIASES`
literal out of `engine.js` rather than restating it, so an alias added later
is covered without touching the test.

**No data currently exercises any alias.** Every `primaryStat`/`synergyStat`
in `shadows-data.js` is already a canonical id, and git history shows `ATTR`
and `MA` were never stat ids in this repo. The map is pure tolerance for a
designer typing a long name — which is exactly why a silent throw in it could
have sat there indefinitely.

**One doc drift corrected in passing.** §4 claimed 20 passing; the real count
was 22 — PR #4 added two build-entrypoint tests and the docs were not updated.
Same failure mode the 2026-08-02 session flagged as a standing caution, two
sessions running. §4 now carries the count history so the next drift is visible.

**Position unchanged.** Phase 4 sequence stands: clear F8, build
`picks`/`excludes`/`requires`, retrofit A3, then Biomech. Of the quick wins,
only **B1** remains, and it is player-facing copy — it wants a voice pass, not
a deletion. **B3** and **B6** still want a one-line "is this intended?" first.


### 2026-09-02 — Batch 1: engine totality & CRB conformance

The first batch of the debt-ledger plan. Decisions 62-68. Before: **26 passing /
2 todo / 0 failing**. After: **45 passing / 1 todo / 0 failing** (46 tests).
**A1 is the only `todo` left.**

**Closed:** B3, B6, B7, B8, B9, B10, and the stale F10 flag.

#### The finding that reframed the batch

Three findings raised in three different sessions — **B2** (`normStat` threw),
**B7** (`validate` threw), **B6** (`migrate` left holes the engine threw
through) — were filed as unrelated items in two severity buckets. They are one
defect: **Decision 22 stated a contract and nothing enforced it.** Every time
someone looked, they found another violation.

So Batch 1 fixed the *class*. The contract is now written exactly — every
exported reader is total on anything `migrate()` returns — and a guard runs six
degenerate characters through twenty-seven readers, every `validate` step and
`skillLine`. **It found a fourth violation on its first run** (B10: an orphaned
skill id crashed the review screen, a case `versionCheck` explicitly reports as
supported). That is the argument for the guard, made by the guard.

#### What the CRB settled

`030_Core_Mechanics.docx` was read into the project for the first time, and it
closed **B3** in the opposite direction from the previous session's
recommendation. The engine reproduces both of the rulebook's worked examples
exactly — BOD 4 → 20 HP, and a Werewolf at BOD 11 → 10 HL × 6 HP = 60 HP — so
`levelsPerBOD` was redundant, not undecided. It also exposed **B8**: two floors
the CRB states plainly, sitting in the data as unread prose while the sheet
displayed bare penalties.

That produced **Mechanism 3**: `tests/rules.test.mjs`, where every assertion
quotes the CRB line it pins. **If that file and the CRB disagree, the CRB wins
and the file is the bug report.**

#### Verification, not assertion

- Every guard was **mutation-tested** against the pre-fix code. A guard that
  passes before and after is decoration.
- The data changes were proved inert by **diffing sixty computed outputs** —
  health at six BOD values, pain at four damage levels, milestones at ten MP
  totals — before and after. Byte-identical, which is why no version bumped
  (Decision 68 writes that rule down).
- B6's fix was checked against the original crash reproduction: all four paths
  that threw now return, `gamedataVersion` is *not* masked, and `versionCheck`
  still reports the mismatch.

#### Watch out for this

Writing regexes into test files through a shell heredoc **silently eats one
backslash level** — `\(` becomes `(`, a word boundary becomes a backspace
character. It bit three times this session and every failure looked like a
logic bug. Use the editor for anything containing escapes.

The data also lives in a **VM realm** (`loadEngine`), so its arrays carry another
`Array.prototype` and `deepStrictEqual` rejects them on identity alone. Spread
into a local array first. Both are noted in `rules.test.mjs`.

#### Position

**Batch 2 next** — voice and the `playerNote` / `flagNote` split, both approved.
Do it before Batch 3 so the picks subsystem is authored under the copy standard
instead of retrofitted into it. Full plan, ownership split and the grouped
Deighton ask: the **Shadows Sheet Debt Ledger** artifact.