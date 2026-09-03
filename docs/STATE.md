# State of the build

**Updated:** 2026-09-03
**Versions:** app `0.6.0` · game data `0.4` · character schema `0.5` · ruleset **CRB v4 (in progress)**
The app prints its own version in the footer — compare it against this line before debugging anything.
**Suite:** `npm run verify` → **86 passing, 0 todo, 0 failing** (86 tests, six files)

This is the working document. It says where the build stands, what is in flight,
and who can clear what. It is **rewritten, not appended** — if a line here is out
of date it is a bug. History lives in `log/2026.md`; the authority on
architecture, schemas, decisions and flags is `SCHEMA.md`.

> **Starting a session?** Read `CLAUDE.md`, then this file. That is enough to
> begin. When you need a decision, an `A`/`B`/`C`/`F` id, or the reasoning behind
> a batch, go through **`INDEX.md`** — it maps each to the section that holds it.
> Never read `SCHEMA.md` front to back.

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
| 3 | Selection & constraint system | ✅ merged (#7) | `picks`/`excludes`/`requires` + A3 → closed A1, A2, the last `todo` · Decisions 77–82 |
| 3a | Ledger attention state | ⏭ **next** | A passed step with unspent points shows ✓ today. Generic, and it makes 3b safe |
| 3b | `grants` | ⏳ after 3a | Educated, Hard to Kill, Lucky/Unlucky, Long-Lived. **Thick Skin waits on armor** |
| — | Decompose `src/ui/app.js` | ⏳ after 3b | Decision 54's deferred refactor, own branch, zero behaviour change |
| 4 | Biomech as data | ⏳ after that | F6 lands as a data entry, not a fourth special case |

**Batch 3 is merged.** One selection system — `picks` / `excludes` / `requires` —
hosted by advantages, disadvantages and skills, with archetype specialization on
the same model (A3). Decisions 77–82; reasoning in `SCHEMA.md` §6, session detail
in `log/2026.md`. An independent adversarial review of the PR found five further
defects, all fixed before merge (Decision 82); three machinery gaps from it are
open in §4 and none is reachable with current data.

**Two things a next session should know.**

- **No entry declares `excludes` or `requires` yet** — the CRB names no pair.
  Both are tested against a synthetic fixture. Adding a real one is a rules
  question for Deighton, not a data edit (Decision 77).
- **Thick Skin is held out of 3b.** It grants Natural Armor, the armor design is
  still in flux, and **four places in the data already grant Natural Armor in
  prose** — Thick Skin, the Iron Shirt Martial Arts style, an archetype effect
  and an archetype benefit. That makes it a real derived value when it lands, not
  a Thick Skin special case. Until then it ships as reference text.

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

## 4. Open engineering work

**Every `A` and `B` finding from the rev 9 audit is closed.** `C1`–`C3` remain as
forward notes — one line each in `INDEX.md` §2, which is where you look up what
any id means and whether it is still live.

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

**Nothing in flight.** `main` is at PR #7, the branch is merged and deleted, and
`npm run verify` is green on it. Batch 3 landed on 2026-09-03 with three version
bumps (app `0.6.0`, game data `0.4`, character schema `0.5`) — an existing
`.shadows.json` upgrades through `migrate()` on load and reports the game-data
mismatch, which is correct.

**Batch 3a — the ledger attention state — is next, and nothing blocks it.**
`renderLedger` marks a passed step ✓ when it has no *errors*, ignoring warnings.
So a player who walks past Skills with ten unspent points gets a green tick
saying they are done — shipped behaviour today, every step, every player. The fix
is a third row state (done / active / **needs attention**) driven by warnings on
a step already passed, plus a callout linking back. The rows are already
clickable and `validate()` already emits the warnings, so most of it exists.

**Then 3b — `grants`.** 3a settles the Educated ruling by construction: if the
app surfaces the unspent points and lets the player go back, the points are
usable at creation, so Educated grows the step-6 pool and says so out loud.

If you want a session with no dependencies at all, the five doc-reconciliation
flags in §3 have now waited through five batches.

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
