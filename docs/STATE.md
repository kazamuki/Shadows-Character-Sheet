# State of the build

**Updated:** 2026-09-02 · character schema `0.4` · game data `0.3` · ruleset **CRB v4 (in progress)**
**Suite:** `npm run verify` → **56 passing, 1 todo, 0 failing** (57 tests, six files)

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

**The one known defect:** `A1` — the Arcanist renders its aberrations twice, and
validation demands both. Tracked as the suite's single `todo`. It closes in
Batch 3 as a side effect of `A3`, not on its own.

---

## 2. The board

Work is organised in batches. Each is a coherent unit with its own branch.

| # | Batch | Status | What it is |
|---|---|---|---|
| — | Quick wins | ✅ 2026-09-02 | B2, B4, B5 · Decisions 59–61 |
| 1 | Engine totality & CRB conformance | ✅ 2026-09-02 | B3, B6, B7, B8, B9, B10, stale F10 · Decisions 62–68 |
| 2 | App voice & status copy | ✅ 2026-09-02 | B1 + nine sibling leak sites · Decisions 69–73 |
| 3 | **Selection & constraint system** | ⏭ **next** | `picks` / `excludes` / `requires`, then retrofit A3 → closes A1, A2 and the last `todo` |
| 4 | Biomech as data | ⏳ after 3 | F6 lands as a data entry, not a fourth special case |

**Batch 3 in detail.** The shape is specified in the rev 9 audit §4 and the CRB
now *requires* it — Decision 58 lists the ~15 entries that become the test
corpus. Order within the batch:

1. Build `picks` / `excludes` / `requires` for advantages and disadvantages.
   Self-contained, high value at the table: mutual locks, freeform prompts,
   per-rank skill picks.
2. Retrofit archetype specialization onto it (`A3`). Delete the
   `arcanist` / `professional` / `werewolf` branches in `renderArchetype` and the
   aberration-only branch in `renderShArchetype`. `A1` and `A2` fix themselves.
3. This is also **when `src/ui/app.js` gets decomposed** — during the renderer
   rewrites, never as a standalone chore. Mechanism in `log/2026.md`, the
   2026-08-02 entry.

**F8 is not a gate on Batch 3.** It blocks a player finishing the stats step; it
does not block building the selection system. Chase it on its own track.

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

These five are doc reconciliation and have sat through three sessions of work
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
an id there before working on it. **B1–B10 are all closed.**

| Id | What | Where it lands |
|---|---|---|
| A1 | Arcanist aberrations render twice, both required | Batch 3 (via A3) |
| A2 | The sheet's Specialization section can't see non-Arcanist picks | Batch 3 (via A3) |
| A3 | Unify the two selection models — the actual fix | Batch 3 |
| C1 | If any sheet number field moves to live `oninput`, it inherits Decision 41's caret fix | Forward note |
| C2 | Admin mode can't reach `archetypeChoices` | Easier after A3 |
| C3 | SFR / form-toggle copy — re-read after F6 and F7 land | Forward note |

---

## 5. Branches in flight

| Branch | State |
|---|---|
| `fix/batch-1-engine-totality` | Pushed. PR open against `main`; contains the quick-wins commit too |
| `feat/batch-2-app-voice` | Committed locally. Held back deliberately so it doesn't stack — rebase onto `main` once Batch 1 merges |

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
