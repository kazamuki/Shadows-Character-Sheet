# State of the build

**Updated:** 2026-09-22
**Versions:** app `0.11.0` · game data `0.7` · character schema `0.7` · ruleset **CRB v4 (in progress)**
The app prints its own version in the footer — compare it against this line before debugging anything.
**Suite:** `npm run verify` → **103 passing, 0 todo, 0 failing** (103 tests, six files)

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
loadout, `grants`, an undo-able audit trail, and a printable sheet — filled
or blank — for a player who wants paper. The engine reproduces the CRB's own
worked examples (`tests/rules.test.mjs`). Game data now also carries a full
weapons/ammunition/armor catalog (Decision 92) and the archetype-independent
half of the Magic chapter — domains, the full spell catalog, Spellcraft rules
as reference text, Enchantment/Alchemy materials (Decision 93) — neither yet
wired to any UI beyond the Arcanist's existing Grimoire/Disciplines panels.

**The print sheet had two real defects this session, both closed:** the
in-app "Print a blank character sheet" button printed whatever screen was up
instead of the sheet (`#printSheet` was never un-hidden for print media), and
a pre-existing Loadout-page overflow clipped the Notes box across a page
break. The front page was also redesigned — a case-file layout, Health
Levels grouped into Pain Level bands, a two-panel Skills page — and now
draws its border/texture from Scott's real Affinity artwork rather than an
invented approximation (Decision 94).

**The CRB mirror was two weeks stale and is re-pulled (2026-09-22)** —
Core Mechanics' Exhaustion text and the Arcanist's Origins had moved; Combat,
Downtime, Magic, the spell appendix and the new Aberrations appendix are now
mirrored too. The spell catalog was checked against the live appendix: every
spell and its TN/TH matches.

**One known player-facing defect:** that same frame/texture decoration
renders correctly on screen but not in Chrome's actual print/PDF output
(Decision 94) — cosmetic only, nothing else on the page is affected.
Otherwise no known defect; the three machinery gaps the PR #7 review found
are closed (Decision 91) and none was reachable with current data.

---

## 2. The board — shipped work

History, not a queue: each row already merged (or is done on this branch,
awaiting a PR). **What's not yet done is organized by topic in §3, not by
batch number** — "Batch 4" meant Cyborg specifically from Batch 3 onward,
which read oddly once other work queued ahead of it. Ken flagged this
2026-09-12; §3 is the fix.

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

**Demo hosting is live** (Printable sheet + demo hosting, #17) — Ken set the
GitHub Pages source and the Squarespace DNS CNAME; confirmed serving at
`charactersheet.shadowsrpg.com` (2026-09-12). It only redeploys on a `v*` tag
push (`deploy-demo.yml`), not on every merge to `main` — the live site is
currently on app `0.9.0`, so `main`'s `0.10.0` work (light theme, printable
sheet, this batch) won't reach it until the next tag.

**Two things a next session should know.**

- **No entry declares `excludes` or `requires` yet** — the CRB names no pair.
  Both are tested against a synthetic fixture. Adding a real one is a rules
  question for Deighton, not a data edit (Decision 77).
- **Thick Skin is held out.** It grants Natural Armor; four places in the
  data already grant Natural Armor in prose (Thick Skin, Iron Shirt, an archetype
  effect, an archetype benefit) — one real derived value, not a Thick Skin
  special case, once the armor engine (§3, Gear & Combat) lands. Until then
  it ships as text.

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
| **Gear & Combat** — Conditions, damage, armor | ✅ catalog merged (Decision 92) · 📋 **planned** in `plans/combat-and-conditions.md` — Sessions 2–4 | Ken's sign-off on the plan's §3. Session 2 (Conditions) is otherwise unblocked; Session 3 wants CQ4/CQ6 from Deighton (stubbable). MD1/2/3 ratings (Design, small) block nothing |
| **Creation-pool economics** — F1, F2, F8, F14 | 🔶 stubbed/scaled, working | Deighton. **F8 is the only wizard-blocker**; ask F1/F2/F8/F14 together, one context-load |
| **Milestones & doc reconciliation** — F9, F11, F12, F13 · plan CQ8, CQ9, CQ11 | ⏭ ready | Ken alone — zero-dependency, the standing low-friction session |
| **Advantages/Disadvantages fine print** — F17, the lock-out question | 🔶 mostly settled | Deighton. F17 needs sign-off as rules authority; nothing in the CRB names an `excludes` pair yet, so none is invented |
| **Cyborg** — F6, F19 | ⏸ blocked · `status: "tbd"` | Ken + Deighton + Scott: the design ruling (F6), then F19's install-cost pick |
| **Vampire** — F7 (Vampire half), F13 | ⏸ blocked · `status: "tbd"` | Design. Blood Pool/SFR direction proposed 2026-09-10, not locked |
| **Werewolf** — F7 (Werewolf half) | 🔶 mostly stable · `status: "draft"` | Design, low urgency — predator's-mark rework proposed, not locked |
| **Arcanist / Magic** | 🔶 Spellcraft + spell catalog merged (Decision 93) · ⏭ Cascade + Aberration tables now written in the CRB, not yet encoded (plan's side session) · Origins still `status: "draft"` — though the CRB now drafts Book/Blood/Bound (2026-09-22) | Deighton + Scott + Bill + Ken — Origins (Book/Blood/Bound) and spheres/implements still wait on the four-way question comparison from the 2026-09-10 meeting; not blocking now that the archetype-independent half is in |
| **Engine internals** — unnumbered statMod flag | 🔶 known disagreement | Deighton. `statMod()` extrapolates +1/point past 10; `beyondHumanLimits` text says gains "slow down" — code-comment only, no F-number |
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

**`main` is caught up through PR #23** (the print sheet redesign, Decision 94).
This branch is docs + one data-text sync: the CRB mirror re-pull, F16 closed,
and the combat plan. `npm run verify` is green (103 passing, 0 todo).

**Next up is Session 2 of `plans/combat-and-conditions.md` (Conditions)** —
once Ken has signed off on that plan's §3 (P1–P9). The plan lists its own
sessions, tests to pin, and open questions (CQ1–CQ11); read it before starting.

**Also unblocked:** the plan's Magic-tables side session (Cascade + Aberration
tables, independent of combat) and Milestones & doc reconciliation (Ken alone;
note F11's "Intuition Advantage" lives in a **Major Milestone** — Quick Study,
under General Milestones in `041_Archetypes` — not in the Advantages chapter).
Cyborg, Vampire, and the print sheet's remaining visual work wait on people
outside a session.

**Waiting on Deighton, asked as one packet:** F8 (the only wizard-blocker), F1,
F2, F14, F17, the unnumbered `statMod` past-10 question, and the plan's CQ1–CQ7
and CQ10.

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
