# State of the build

**Updated:** 2026-09-22
**Versions:** app `0.13.0` · game data `0.8` · character schema `0.8` · ruleset **CRB v4 (in progress)**
The app prints its own version in the footer — compare it against this line before debugging anything.
**Suite:** `npm run verify` → **157 passing, 0 todo, 0 failing** (157 tests, six files)

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

**Working and covered by tests:** the whole wizard, all nine sheet tabs,
damage and Pain Levels, taking a hit through armor, Conditions, Sanity, Luck,
Çredits, IP and Milestones, the session log, loadout, `grants`, an undoable
audit trail, and a printable sheet, filled or blank. The engine reproduces
the CRB's own worked examples (`tests/rules.test.mjs`). Game data also
carries the weapons/armor catalog (Decision 92) and the archetype-independent
half of Magic (Decision 93). Neither is wired to UI beyond the Arcanist's
Grimoire/Disciplines panels.

**Combat so far (plan Sessions 2–3, Decisions 95–96, 99).** Conditions are
a data catalog and inputs on the character. Trackers has a **Take a hit**
panel: PROT (the die the player rolled) + RES when the type matches, and AP
or Compromised armor skips RES. Massive strips Integrity and removes Health
Levels, drawn hatched on every HL track and counted toward Pain. The panel
asks for Shock/At Zero and adds the resulting Conditions, and the whole hit
is one undoable action. **Nothing writes `ch.armor[]` yet** (Session 4), so
with no worn piece the panel takes a typed PROT roll and RES. One stub,
**F23** (RES vs Electric/Burning; the Resistance upgrade).

**The print front page is full.** Anything more there breaks to a second
page (Decision 96). **One known defect:** the frame/texture decoration shows
on screen but not in Chrome's print/PDF output (Decision 94). Cosmetic only.

---

## 2. The board — shipped work

History, not a queue: each row is merged. **What's not
yet done is organized by topic in §3, not by batch number** (Ken, 2026-09-12).

| # | Batch | Merged | What it is |
|---|---|---|---|
| — | Quick wins | #5 | B2, B4, B5 · Decisions 59–61 |
| 1 | Engine totality & CRB conformance | #5 | B3, B6–B10, stale F10 · Decisions 62–68 |
| 2 | App voice & status copy | #6 | B1 + nine sibling leak sites · Decisions 69–73 |
| — | Docs restructure + versioning | #6 | STATE replaces HANDOFF; four-version model · Decisions 74–76 |
| 3 | Selection & constraint system | #7 | `picks`/`excludes`/`requires` + A3 → closed A1, A2, the last `todo` · Decisions 77–82 |
| 3a | Ledger attention state | #10 | Third row state (done/active/attention) + callout · Decision 83 |
| — | Dev-preview tooling | #11 | `tools/devserver.mjs` for browser-tool UI verification |
| — | CRB v4 reference mirror | #13 | `docs/reference/crb/` + voice guide re-pull · Decisions 84–85 |
| — | Decompose `src/ui/app.js` | #15 | Decision 54's deferred refactor · Decision 86 |
| 3b | `grants` | #16 | Educated, Hard to Kill, Lucky/Unlucky, Long-Lived · Decisions 87–88, F17 |
| — | Printable sheet + demo hosting | #17 | `renderPrintView` (filled/blank) + standalone build artifact + GH Pages deploy · Decision 89, F18 |
| — | Light theme toggle | #18 | `data-theme` attribute + blocking init script + header toggle · Decision 90 |
| — | PR #7 adversarial review | #19 | Decision 91 — machinery gaps closed, not player-visible (§4) |
| — | Weapons, Ammo & Armor (data) | #22 | 54 weapons/9 ammo/11 arrowheads/37 armor + five glossaries · Decision 92 |
| — | Magic — archetype-independent half (data) | #22 | 96 spells across 5 domains/4 tiers, Spellcraft rules as reference text, Enchantment/Alchemy materials · Decision 93 |
| — | Print sheet — visual redesign | #23 | Blank-print + Notes-clipping bug fixes; case-file front page, Pain Level bands, two-panel Skills, Scott's real frame/texture assets · Decision 94 |
| — | CRB mirror re-pull + combat plan | #24 | Mirror refreshed and extended, F16 closed, `plans/combat-and-conditions.md` |
| — | Conditions (combat plan Session 2) | #25 | Catalog, schema 0.8, Pain folding, Skill Check penalties, sheet + print · Decisions 95–96, F20–F22 |
| — | Design-team rulings | #25 | F1, F2, F14, F17, F20–F22 and the stat-curve flag closed; new skill = 25 IP; stats past 10 +1 per 5 · Decisions 97–98 |
| — | Taking a hit (combat plan Session 3) | #26 | `hlState`/`armorState`/`resolveHit`/`applyHit`, the Take a hit panel, Massive levels on every HL track · Decision 99, F23 |

**Demo hosting is live** (Printable sheet + demo hosting, #17) — Ken set the
GitHub Pages source and the Squarespace DNS CNAME; confirmed serving at
`charactersheet.shadowsrpg.com` (2026-09-12). It only redeploys on a `v*` tag
push (`deploy-demo.yml`), not on every merge to `main`. **Live: app `0.13.0`,
game data `0.8`** (tag `v0.13.0`, deployed and checked 2026-09-22).

**Two things a next session should know.**

- **No entry declares `excludes` or `requires` yet** — the CRB names no pair.
  Both are tested against a synthetic fixture. Adding a real one is a rules
  question for Deighton, not a data edit (Decision 77).
- **Thick Skin is held out.** Natural Armor is granted in prose in four places
  (Thick Skin, Iron Shirt, an archetype effect and benefit). It should become
  one derived value on top of `armorState()` (Decision 99), not a special case.

---

## 3. Areas of work

Grouped by what part of the app or ruleset they touch, not by who owns
them — a status and what's blocking it travel with the topic, so picking up
work as a flag resolves doesn't mean re-deriving which batch it belonged to.
This is the pick-up-work view; `SCHEMA.md` §5 is the authority on a flag's
full text.

**Legend:** ✅ done · ⏭ ready (nothing external blocks starting) · 📋 planned (a plan doc exists) · 🔶 partial/stable · ⏸ blocked

| Area | Status | Waiting on |
|---|---|---|
| **Gear & Combat** — Conditions, damage, armor | ✅ catalog (Decision 92) · ✅ **Conditions** (Session 2, Decisions 95–96) · ✅ **taking a hit** (Session 3, Decision 99) · 📋 Session 4 in `plans/combat-and-conditions.md` | ⏭ Session 4 (Loadout & recovery) is unblocked. **F23** (Deighton, one grouped question: RES vs Electric/Burning, and where Resistance's 50% applies) is stubbed and blocks nothing. MD1/2/3 ratings (Design, small) block nothing |
| **Creation-pool economics** — F8 | 🔶 scaled table, working · F1/F2/F14 closed (Decision 97) | Design team, **playtesting** realistic Stat Point totals. F8 is the only wizard-blocker |
| **Milestones & doc reconciliation** — F9, F11, F12, F13 · plan CQ8, CQ9, CQ11 | ⏭ ready | Ken alone — zero-dependency, the standing low-friction session |
| **Advantages/Disadvantages fine print** — the lock-out question | 🔶 mostly settled · F17 closed (Decision 97) | Deighton. Nothing in the CRB names an `excludes` pair yet, so none is invented |
| **Cyborg** — F6, F19 | ⏸ blocked · `status: "tbd"` | Ken + Deighton + Scott: the design ruling (F6), then F19's install-cost pick |
| **Vampire** — F7 (Vampire half), F13 | ⏸ blocked · `status: "tbd"` | Design. Blood Pool/SFR direction proposed 2026-09-10, not locked |
| **Werewolf** — F7 (Werewolf half) | 🔶 mostly stable · `status: "draft"` | Design, low urgency — predator's-mark rework proposed, not locked |
| **Arcanist / Magic** | 🔶 Spellcraft + spell catalog merged (Decision 93) · ⏭ Cascade + Aberration tables now written in the CRB, not yet encoded (plan's side session) · Origins still `status: "draft"` — though the CRB now drafts Book/Blood/Bound (2026-09-22) | Deighton + Scott + Bill + Ken — Origins (Book/Blood/Bound) and spheres/implements still wait on the four-way question comparison from the 2026-09-10 meeting; not blocking now that the archetype-independent half is in |
| **Print sheet — visual system** | 🔶 redesigned (Decision 94) · one known cosmetic defect | Scott: a complete, finished export — his current file is a two-page **portrait** WIP with only Stats built, in two competing styles (hex-dial sidebar vs. plain table). Portrait-vs-landscape is a real decision once that lands, not yet made. Separately: the frame/texture layer doesn't print in Chrome's actual output yet (screen-only) — not blocked on anyone, just not chased down |

F5 (Cyber-Prophetical) isn't its own row — it's the last quarter of the
Advantages/Disadvantages item and wholly waits on Cyborg's ruling; don't ask
it separately.

Archetype status in the data: `arcanist: draft · professional: draft ·
werewolf: draft · cyborg: tbd · vampire: tbd`.

---

## 4. Open engineering work

**Every `A` and `B` finding from the rev 9 audit is closed.** `C1`–`C3` remain as
forward notes — one line each in `INDEX.md` §2, which is where you look up what
any id means and whether it is still live.

### PR #7 adversarial review — closed (Decision 91)

All three machinery gaps (`requirementState`/`majorPrereqs` duplication, the
Professional stat gate's own stat loop, `heldIds` missing skills) are fixed
and mutation-tested. Full account in `log/2026.md` and `SCHEMA.md` Decision
91. Not player-visible today — no entry uses `excludes`/`requires` beyond the
test fixtures (Decision 57).

---

## 5. Where to start

**`main` is caught up through PR #26** (combat plan Session 3, Taking a hit,
Decision 99, with the PR's adversarial review folded in). It's tagged
`v0.13.0` and live on the demo site. Game data 0.8 has shipped, so the next
change a character can observe needs a `gamedataVersion` bump (Decision 68).
`npm run verify` is green (157 passing, 0 todo).

**Next up is Session 4 of `plans/combat-and-conditions.md` (Loadout &
recovery):** armor/weapon pickers and the worn toggle (which make the hit
panel use the real worn piece: `armorState()` already reads `worn`,
`integrityLoss`, `scrapped`, `upgrades`), weapon lines, wear roll, repair,
healing and Turn Reset. It should decide whether the bare "Restore a Massive
level" button (Decision 99) stays or folds into Focused Healing.

**Also unblocked:** the plan's Magic-tables side session (Cascade + Aberration
tables, independent of combat) and Milestones & doc reconciliation (Ken alone;
note F11's "Intuition Advantage" lives in a **Major Milestone** — Quick Study,
under General Milestones in `041_Archetypes` — not in the Advantages chapter).
Cyborg, Vampire, and the print sheet's remaining visual work wait on people
outside a session.

**Waiting on the design team:** F8 (the wizard-blocker, being playtested),
and **F23**, new this session, one grouped question for Deighton. Which RES
class do Electric and Burning damage fall under (stubbed as Energy, so no RES
without Ablative Plating)? And where does the Resistance upgrade's 50% sit
against PROT and RES (not applied yet)? **Ken's CRB fixes:** Gear's
Conditions table → a pointer at 054 (CQ8, agreed); Gear's Siege tag →
Massive damage (CQ4); 053's Called Shot → only Massive causes Injured/Maimed
(CQ5); the 25 IP new-skill price and the stat curve past 10 into the CRB; a
Dying row in 054 (CQ9); CQ11. F23 may also want a line in Gear's RES text
once ruled.

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
- **§3 is organized by topic, not by sequence, on purpose (2026-09-12).** A
  batch number implies "next in line"; several areas here are blocked on
  different people and resolve in whatever order those people answer. Don't
  reintroduce a `#` column to §3 — if a strict next-up order is ever needed
  again, say so in prose rather than implying it with numbering.
- **Close a session by rewriting §1–§5 here** and appending to `log/2026.md`, in
  the same commit as the code.
