# State of the build

**Updated:** 2026-09-03
**Versions:** app `0.6.0` · game data `0.4` · character schema `0.5` · ruleset **CRB v4 (in progress)**
The app prints its own version in the footer — compare it against this line before debugging anything.
**Suite:** `npm run verify` → **85 passing, 0 todo, 0 failing** (85 tests, six files)

This is the working document. It says where the build stands, what is in flight,
and who can clear what. It is **rewritten, not appended** — if a line here is out
of date it is a bug. History lives in `log/2026.md`; the authority on
architecture, schemas, decisions and flags is `SCHEMA.md`.

> **Starting a session?** Read `CLAUDE.md`, then this file. That is enough to
> begin. Open `SCHEMA.md` at the section you need when you need it — do not read
> it front to back.

---

## 1. Where things stand

The app is a browser character creator and live play sheet for **Shadows**
(Synergy system). Eight-step wizard → lock → nine-tab sheet. It runs from
`file://` with no server and no build step, which drives most of the
architecture and is enforced by tests.

**Working and covered by tests:** the whole wizard, all nine sheet tabs, damage
and Pain Levels, Sanity, Luck, Çredits, IP and Milestones, the session log,
loadout, and an undo-able audit trail of every action. The engine reproduces the
CRB's own worked examples (`tests/rules.test.mjs`).

**No known player-facing defect.** A1 and A2 closed with Batch 3, and the suite
has no `todo` for the first time since the ledger was written. Three
machinery gaps found by the PR #7 review are open in §4 — none is reachable
with current data, so none can bite a player today. The next `todo` that appears
should be a newly *found* defect, not a survivor.

---

## 2. The board

Work is organised in batches. Each is a coherent unit with its own branch.

| # | Batch | Status | What it is |
|---|---|---|---|
| — | Quick wins | ✅ merged (#5) | B2, B4, B5 · Decisions 59–61 |
| 1 | Engine totality & CRB conformance | ✅ merged (#5) | B3, B6–B10, stale F10 · Decisions 62–68 |
| 2 | App voice & status copy | ✅ merged (#6) | B1 + nine sibling leak sites · Decisions 69–73 |
| — | Docs restructure + versioning | ✅ merged (#6) | STATE replaces HANDOFF; four-version model · Decisions 74–76 |
| 3 | Selection & constraint system | ✅ **PR #7, in review** | `picks`/`excludes`/`requires` + A3 → closed A1, A2, the last `todo` · Decisions 77–82 |
| 3b | `grants` | ⏭ **next** | Educated, Hard to Kill, Thick Skin, Lucky/Unlucky, Long-Lived |
| — | Decompose `src/ui/app.js` | ⏳ after 3b | Decision 54's deferred refactor, own branch, zero behaviour change |
| 4 | Biomech as data | ⏳ after that | F6 lands as a data entry, not a fourth special case |

**What Batch 3 built.** One selection system with three hosts — advantages,
disadvantages and skills. An entry declares `picks` (a fixed list, a category,
or free text), `excludes` (a symmetric mutual lock) and `requires` (the
milestone-prerequisite vocabulary); a character stores its answers as
`selections` on the entry that asked. All ~15 entries Decision 58 named are
encoded, plus Martial Arts styles. A3 put archetype specialization onto the same
footing: **one array, `archetypeChoices.specialization`,** with the count read
from the data (`countBy`, or 1). Three fields became one, and both renderers
lost their per-archetype branches.

**An adversarial review ran against PR #7** (a separate model, fresh context, no
access to this session's reasoning). Eight findings; all eight verified against
the code before anything was changed. **Five were real defects and are fixed**
(Decision 82) — a trait held both free and purchased addressed by id alone, a
free-only trait demanding picks with no control to fill them, `Resume draft`
skipping `migrate()`, the natural-advantage mirror surviving an archetype
change, and `specializationNeed` inventing a requirement on a corrupt import.
Two of the guards written for them passed *before* the fix and had to be
tightened — worth knowing that a failing-first check is the only proof a guard
guards anything. **Three findings are open and recorded in §4.**

**Two things a next session should know.**

- **No entry declares `excludes` or `requires` yet** — the CRB names no pair.
  Both are tested against a synthetic fixture. Adding a real one is a rules
  question for Deighton, not a data edit (Decision 77).
- **`grants` was deliberately split out of Batch 3** (Batch 3b). It touches five
  readers that currently compute from stats alone, and Educated forces a
  wizard-flow ruling — bought at step 7, it grows the step-6 pool retroactively.

**F8 is not a gate on any of this.** It blocks a player finishing the stats step.
Chase it on its own track.

---

## 3. Who can clear what

### Ken alone — no external input

| Item | What |
|---|---|
| F9 | Are "General Milestones" shared across archetypes, or Professional-only? Data treats them as shared |
| F11 | Quick Study requires an "Intuition Advantage" — Intuition is a *Skill* |
| F12 | Minor Milestones sourced from REF v3.5; the WIP defers to an unwritten Advancement section |
| F13 | Vampire `canPurchaseAdvantages: false` — assumed from the Werewolf baseline, confirm |
| F16 | Hemophiliac calls for a "First Aid Skill Check"; the catalog skill is **Medical** |

These five are doc reconciliation and have sat through four sessions of work
that could not touch them. Good candidate for a low-friction session.

### Needs Deighton — ask these together, not one at a time

One philosophical answer often clears several, and asking separately invites
four separate context-loads.

| Item | Question |
|---|---|
| **F8** | Stat Point roll — flat `3d10+30` at every level, or the REF table that scales (`30+2d10` … `60+5d10`)? Data uses the scaled table. **The only wizard-blocker**, and four numbers either way |
| F1 | LUCK buy-up cost in CP per point (stubbed 1:1) |
| F2 | CP boost exchange rate across skills / stats / powers (stubbed 1:1) |
| F14 | Skill IP at rank 0 — "5 × current rank" prices a new skill at zero; the app charges the rank-1 price |
| *(new)* | Does any Advantage or Disadvantage **lock out** another? The machinery is built and tested; nothing in the CRB names a pair, and inventing one would be resolving a rules question in code |
| *(unnumbered)* | `statMod()` extrapolates **+1 per point above 10**, but `statRules.beyondHumanLimits` says gains *"slow down"* past 10. These disagree, and this flag exists only as a code comment — it has no F-number and is not in the table |

### Design work — Ken with Deighton and Scott

| Item | What |
|---|---|
| F6 | Biomech / Cyborg rewrite — NCI tiers, Set Bonuses, Kicker Dice, TOL pressure. Ships as `status: "tbd"`. Batch 4 |
| F7 | SFR per archetype — Werewolf defined (WILL×3+N, RoU); Vampire Blood Pool open |
| F5 | Cyber-Prophetical (SAN vs TOL) — the last quarter of F5. Waits on F6; don't ask separately |

Archetype status in the data: `arcanist: draft · professional: draft ·
werewolf: draft · cyborg: tbd · vampire: tbd`.

---

## 4. Still open from the rev 9 audit

The audit (`audits/2026-06-16_rev9-whole-app-audit.md`) is the reference; look up
an id there before working on it. **A1, A2, A3 and B1–B10 are all closed.**

| Id | What | Where it lands |
|---|---|---|
| C1 | If any sheet number field moves to live `oninput`, it inherits Decision 41's caret fix | Forward note |
| C2 | Admin mode can't reach `archetypeChoices` | Now much easier — one array to edit |
| C3 | SFR / form-toggle copy — re-read after F6 and F7 land | Forward note |

### Open from the PR #7 adversarial review

Real gaps, none reachable with current data — no entry declares `excludes` or
`requires`, and no skill declares `excludes`. Fixing them means designing
against no example, which is exactly what Decision 57 declined to do. They land
when the first entry needs them.

| What | Where |
|---|---|
| `requirementState` reimplements the milestone-prerequisite check rather than calling it, so `majorCount`, `milestones`, `gear`, `note` and `gmApproval` in a `requires` block would be **silently treated as satisfied** | `engine.js` — merge with `majorPrereqs` |
| The Professional stat gate is still `if (a.id==="professional")` with its own stat-check code, duplicating `requirementState` — the per-archetype special-casing A3 set out to end | `engine.js` `validate()` — express as `requires` data on the subtype |
| `optionLock` reads only advantages and disadvantages, so a skill can never take part in an `excludes` pair even though skills host `picks` | `engine.js` `heldIds` |

---

## 5. Where to start

**Batch 3 is PR #7, green, in review.** It carries three version bumps (app
`0.6.0`, game data `0.4`, character schema `0.5`) — an existing `.shadows.json`
upgrades through `migrate()` on load and reports the game-data mismatch, which
is correct. The five defects an adversarial review found are fixed on the same
branch; the three remaining findings are in §4 and none is reachable with
current data.

After it merges, **Batch 3b (`grants`)** is next and needs a ruling on Educated's
step ordering before it can be built.

---

## 6. Keeping this file honest

The numbers in this file drifted twice before it existed — `CLAUDE.md` was
telling cold sessions "20 passing, 2 todo" when the real figure was 51/1, and
"Decisions… at 54" when the ledger was at 73. So:

- **Every volatile fact lives here and nowhere else.** `CLAUDE.md` carries no
  counts. Session-log entries state figures *as of that session* and are never
  updated — they are history, and history does not drift.
- **`tests/docs.test.mjs` enforces it.** The suite result and decision count in
  this file are checked against reality, the flag table is checked against
  `flagged: true` in the data (which is how F10 stayed live for four days after
  the docs closed it), and every file `CLAUDE.md` points at must exist.
- **Close a session by rewriting §1–§5 here** and appending to `log/2026.md`, in
  the same commit as the code.
