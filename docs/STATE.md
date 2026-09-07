# State of the build

**Updated:** 2026-09-07
**Versions:** app `0.9.0` · game data `0.5` · character schema `0.5` · ruleset **CRB v4 (in progress)**
The app prints its own version in the footer — compare it against this line before debugging anything.
**Suite:** `npm run verify` → **96 passing, 0 todo, 0 failing** (96 tests, six files)

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
loadout, `grants`, an undo-able audit trail, and now a printable sheet — filled
or blank — for a player who wants paper. The engine reproduces the CRB's own
worked examples (`tests/rules.test.mjs`).

**No known player-facing defect.** Three machinery gaps found by the PR #7
review are open in §4 — none is reachable with current data, so none can bite
a player today.

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
| 3a | Ledger attention state | ✅ merged (#10) | Third row state (done/active/attention) + callout · Decision 83 |
| — | Dev-preview tooling | ✅ merged (#11) | `tools/devserver.mjs` for browser-tool UI verification |
| — | CRB v4 reference mirror | ✅ merged (#13) | `docs/reference/crb/` + voice guide re-pull · Decisions 84–85 |
| — | Decompose `src/ui/app.js` | ✅ merged (#15) | Decision 54's deferred refactor · Decision 86 |
| 3b | `grants` | ✅ merged (#16) | Educated, Hard to Kill, Lucky/Unlucky, Long-Lived · Decisions 87–88, F17 |
| — | Printable sheet + demo hosting | ✅ merged (#17) | `renderPrintView` (filled/blank) + standalone build artifact + GH Pages deploy · Decision 89, F18 |
| 4 | Cyborg as data | ⏭ **next** | F6 lands as a data entry, not a fourth special case. Needs the design ruling first |

**Printable sheet + demo hosting (#17) is merged.** `Sheet.renderPrintView(ch?)`
renders the universal three pages — Character Info/Stats/Combat/Health/Defense,
full Skills, Weapons/Gear/Advantages/Disadvantages/Notes — from a live
character, or with none passed, a blank fillable template built from game data
alone. Defense ships blank either way with a plain note, not a guess: the app
has no armor model yet, tracked now as **F18** (a real first design pass
exists in `053_Combat Encounters.docx`, but it needs `Gear.docx` before it's
engine-ready). A second build artifact, `dist/shadows-blank-sheet.html`, lets
someone download just the blank sheet with no app in the loop, and a new
`deploy-demo.yml` workflow publishes both `dist/` files to GitHub Pages on tag.
**Demo hosting isn't live yet** — it needs Ken to set the GitHub Pages source
to "GitHub Actions", add the custom domain, and add the matching Squarespace
DNS record for `charactersheet.shadowsrpg.com`. The Shadows-RPG-Site link is
deliberately not added until that resolves.

**Two things a next session should know.**

- **No entry declares `excludes` or `requires` yet** — the CRB names no pair.
  Both are tested against a synthetic fixture. Adding a real one is a rules
  question for Deighton, not a data edit (Decision 77).
- **Thick Skin is held out.** It grants Natural Armor; four places in the
  data already grant Natural Armor in prose (Thick Skin, Iron Shirt, an archetype
  effect, an archetype benefit) — one real derived value, not a Thick Skin
  special case, once the armor system (F18) lands. Until then it ships as text.

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

These five are doc reconciliation and have sat through several sessions of work
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
| F17 | Long-Lived's rank table reads "Effect" per row, not "gain another" — implemented as stacking (rank 3 = 2 Minor + 1 Major), confirmed with Ken, needs Deighton's sign-off as rules authority |
| *(new)* | Does any Advantage or Disadvantage **lock out** another? The machinery is built and tested; nothing in the CRB names a pair, and inventing one would be resolving a rules question in code |
| *(unnumbered)* | `statMod()` extrapolates **+1 per point above 10**, but `statRules.beyondHumanLimits` says gains *"slow down"* past 10. These disagree, and this flag exists only as a code comment — it has no F-number and is not in the table |

### Design work — Ken with Deighton and Scott

| Item | What |
|---|---|
| F6 | Cyborg rewrite — NCI tiers, Set Bonuses, Kicker Dice, TOL pressure. Ships as `status: "tbd"`. Batch 4 |
| F7 | SFR per archetype — Werewolf defined (WILL×3+N, RoU); Vampire Blood Pool open |
| F18 | Weapons/Armor/Defense — `053_Combat Encounters.docx` gives a first real pass (rolled PROT, static RES, consumable Integrity, AP/Massive/Withering rules). Needs `Gear.docx` for actual item stats before it's engine-ready. Printable sheet's Defense panel ships blank until then |
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

**`main` is caught up through PR #17** — `grants` (3b), the Cyborg/Biomech docs
fix, and the printable sheet + demo-hosting work have all landed; `npm run
verify` is green (96 passing, 0 todo).

**Batch 4 (Cyborg rewrite) is next**, but needs the design ruling from Ken +
Deighton + Scott before there's data to encode (F6, §3). Demo hosting needs
Ken's GitHub Pages / DNS setup before the Shadows-RPG-Site link can go in (§2).

If you want a session with no dependencies at all, the five doc-reconciliation
flags in §3 have now waited through several batches.

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
