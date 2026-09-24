# State of the build

**Updated:** 2026-09-24
**Versions:** app `0.23.1` · game data `0.17` · character schema `0.10` · ruleset **CRB v4 (in progress)**
The app prints its own version in the footer — compare it against this line before debugging anything.
**Suite:** `npm run verify` passes · **0 todo** (a todo is a confirmed defect written as a failing test; CI reports the rest)

This is the working document. It says where the build stands, what is in flight,
and who can clear what. It is **rewritten, not appended** — if a line here is out
of date it is a bug. History lives in `log/` — `2026.md` for sessions,
`shipped.md` for the batch board; the authority on
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
damage and Pain Levels, taking a hit through armor, Conditions, recovery,
Sanity, Luck, Çredits, IP and Milestones, the session log, loadout with the
weapons/armor catalog, `grants`, an undoable audit trail, and a printable
sheet, filled or blank. The engine reproduces the CRB's own worked examples
(`tests/rules.test.mjs`).

**Combat and magic are both built end to end, and both plans are closed**
(`plans/` keeps them as history). Combat: Decisions 95–106, with three stubs
waiting on Deighton (F23, F24, F25). Magic: Decisions 93, 106, 108–111 and 115.

**App 0.23.1 (unreleased, on `claude/vibrant-gates-66y9l0`)** is the
audit's first session: character files are untrusted input (Decision 124),
load findings stay until dismissed (125), the Trueborn's powers render (126),
and Hardcore Parkour can be taken (F27). What shipped before it is in `log/`.

**The print front page is full.** Anything more there breaks to a second
page (Decision 96). **One known defect:** the frame/texture decoration shows
on screen but not in Chrome's print/PDF output (Decision 94). Cosmetic only.

---

## 2. Shipped, and what it left behind

The batch board — one row per merged batch — is history, so it lives in
**`log/shipped.md`** (Decision 101). This section keeps only what shipped work
left that is still true now.

**Demo hosting:** `charactersheet.shadowsrpg.com`, via GitHub Pages. Only a
`v*` tag deploys; **Run workflow** is a dry run on a branch, a re-publish on a
tag. The live version is the latest `v*` tag, and the page's footer says
which. A cloud session can merge but usually can't push a tag, so tag locally
after it (plan S5 moves releasing into a workflow, AQ9). **Check a
deploy by loading the page** and reading the footer, not by curling it.
`CHANGELOG.md` needs a section for every app bump, and **players read it**:
after editing it, run `npm run changelog` and commit the generated
`src/data/shadows-changelog.js` (`docs.test.mjs` checks both).

**Things a next session should know.**

- **No entry declares `excludes` or `requires` yet** — the CRB names no pair.
  Both are tested against a synthetic fixture. Adding a real one is a rules
  question for Deighton, not a data edit (Decision 77).
- **`grants` now reaches past advantages, for one reader only.** Natural
  Armor's `grants` sit on a Major Milestone and on specialization options,
  and `naturalArmor()` scans all three. `grants()` itself still scans
  advantages and disadvantages. The next grant type on a Milestone should
  widen `grants()` rather than copy the scan (Decision 104).
- **Three reusable pieces landed in 0.22.** `openPopover` (a non-modal panel
  that follows the render), `openCatalog(kind)` over `Engine.catalogLine`
  (weapons, armor, gear), and `bindVitalControls(root)` (Trackers' vitals
  controls, bound anywhere they're drawn). Reuse them; don't copy them.
- **Gear rows and weapon rows now share a shape**: a catalog reference or
  `custom: true`, and `migrate()` never guesses between them (Decisions
  120–121).

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
| **Gear & Combat** — Conditions, damage, armor, mods, equipment | ✅ built, **plan closed** (Decisions 92, 95–100, 103–105, 118, 120–122) | **F23 + F24 + F25 + F26** (Deighton, ask together; F23 and F25 are the same RES-class question, F26 is whether a shotgun is a rifle for mods) are stubbed and block nothing. MD1/2/3 ratings (Design, small) block nothing. Magic's Warding services: W28 |
| **Creation-pool economics** — F8 | 🔶 scaled table, working · F1/F2/F14 closed (Decision 97) | Design team, **playtesting** realistic Stat Point totals. F8 is the only wizard-blocker |
| **Milestones & doc reconciliation** — F9, F12, F13, **F27** (F11 closed, Decision 113) · plan CQ8, CQ9, CQ11 | ⏭ ready | Ken alone — zero-dependency, the standing low-friction session |
| **Advantages/Disadvantages fine print** — the lock-out question | 🔶 mostly settled · F17 closed (Decision 97) | Deighton. Nothing in the CRB names an `excludes` pair yet, so none is invented |
| **Cyborg** — F6, F19 | ⏸ blocked · `status: "tbd"` | Ken + Deighton + Scott: the design ruling (F6), then F19's install-cost pick |
| **Vampire** — F7 (Vampire half), F13 | ⏸ blocked · `status: "tbd"` | Design. Blood Pool/SFR direction proposed 2026-09-10, not locked |
| **Werewolf** — F7 (Werewolf half) | 🔶 mostly stable · `status: "draft"` | Design, low urgency — predator's-mark rework proposed, not locked |
| **Arcanist / Magic** | 🔶 spell catalog, Cascade and Aberrations, and **magic on the sheet** all built, plan closed (Decisions 93, 106, 108–111, 115) · data matches Scott's finished Magic chapter and appendices (2026-09-24) · Origins still `status: "draft"`, though the CRB now drafts Book/Blood/Bound (2026-09-22) | Deighton + Scott + Bill + Ken — Origins (Book/Blood/Bound) and spheres/implements wait on the four-way question comparison from the 2026-09-10 meeting; not blocking |
| **Print sheet — visual system** | 🔶 redesigned (Decision 94) · one known cosmetic defect | Scott: a finished export. His current file is a two-page **portrait** WIP with only Stats built, in two competing styles; portrait vs. landscape is decided once it lands. The frame/texture print defect blocks on no one |

F5 (Cyber-Prophetical) isn't its own row — it's the last quarter of the
Advantages/Disadvantages item and wholly waits on Cyborg's ruling; don't ask
it separately.

Archetype status in the data: `arcanist: draft · professional: draft ·
werewolf: draft · cyborg: tbd · vampire: tbd`.

---

## 4. Open engineering work

**The 2026-09-24 whole-app audit** (`audits/2026-09-24_whole-app-audit.md`,
one line per id in `INDEX.md` §2) drives it, through
`plans/audit-2026-09-remediation.md`. Ken has answered every question but
AQ4 (rephrased; show or delete the text players can't see) and AQ7 (a
recommendation is waiting on his yes).

- **S1 is done but for B18:** B11, B15 (F27), B16, B17, C4, C13, R9 and the
  first half of R6, all mutation-tested; AQ2 was pulled forward too.
- **B18 waits on Ken's yes to one proposal:** a permanent `meta.id`
  (character schema 0.11), `meta.updated` stamped on every change, and a
  confirm with **Export first** at all three doors that replace a saved
  character: Import, New and Lock. It's in the plan's S1.
- **Next, no answers needed:** S3 (the Professional as data: B12–B14) once
  its data shape is proposed, S5 (tooling: fonts embedded per AQ6, and the
  release workflow per AQ9), and S2 (the docs diet; AQ1 answered).

rev 9's `A` and `B` findings are all closed; `C1`–`C3` are still forward notes.

---

## 5. Where to start

**`main` is caught up through PR #55, tagged `v0.23.0` (app 0.23.0, schema
0.10, game data 0.16).** This branch carries the audit and S1 as app 0.23.1
and game data 0.17, not yet merged or tagged.

**Next, all unblocked:** Ken's yes on B18 and AQ4's list, then S3, S5 or
S2 in any order. Milestones & doc reconciliation (Ken alone): F9 (are General
Milestones Professional-only?) and F13 need Ken or Deighton; F12 waits on
041's unwritten Advancement Section. The wishlist is empty but for W28.

**Waiting on others:**
- **Design team:** F8, being playtested.
- **Deighton:** F23, F24, F25 and **F26** as one question, plus W28
  (Warding by Elemental/Spirit/Aether against the one Warding upgrade).
  Each flag's stub and question are in `SCHEMA.md` §5.
- **Scott:** the CRB's TOL rewrite (1 + INT + BOD + COOL, Decision 103), and
  the print export. From his finished Magic chapter: Concentration says a
  Talisman holds a spell for 1 die fewer and an Artifact for 2, but the
  Enchantment section says an inscribed spell isn't held at all. The data
  still carries the first rule. **New:** the shop's inscribed objects name
  13 spells the Book of Known Spells doesn't have (Blink, Everlight, Tracer,
  Sure Grip, Sure Hand, Second Wind, Turning Rune, Watchward, Frost Trap,
  Threshold Ward, Stasis Trap, Hearthstone, Consecrate). The catalog keeps
  their names and links the other 14 to the book.
- **Ken:** add `AP` (Armor Piercing) to the spell appendix's tag list, to
  match Decision 116.
- **Ken's CRB fixes:** CQ4, CQ5, CQ8, CQ9, CQ11, CQ12 and CQ13, plus the
  25 IP new-skill price and the stat curve past 10. Each is written up in
  `plans/combat-and-conditions.md` §6. F23 may want a line in Gear's RES text
  once ruled. **New, F27:** Hardcore Parkour's Cat Like Balance prerequisite
  was culled; remove or replace it in 041. Until then the app makes it the
  GM's call (app 0.23.1).

**Don't invest in** the Arcanist's creation-time Unique Aberrations: they
follow `041` (Decision 110), and Ken expects the Origins subtypes to replace
them.

---

## 6. Keeping this file honest

- **Every volatile fact lives here and nowhere else.** `CLAUDE.md` carries no
  counts. Session-log entries state figures *as of that session* and are never
  updated — they are history, and history does not drift.
- **`tests/docs.test.mjs` enforces it.** The todo count, versions and length
  of this file are checked, the flag table is checked against `flagged: true`
  in the data, and every file `CLAUDE.md` points at must exist.
- **§3 is organized by topic, not by sequence, on purpose (2026-09-12).** A
  batch number implies "next in line"; several areas here are blocked on
  different people and resolve in whatever order those people answer. Don't
  reintroduce a `#` column to §3 — if a strict next-up order is ever needed
  again, say so in prose rather than implying it with numbering.
- **Describe what shipped in `log/`, not here.** A paragraph in §1 about a
  finished batch is history; this file keeps only what's still true and what
  to do next. That's what pushed it to the length cap on 2026-09-23.
- **Close a session by rewriting §1–§5 here** and appending to `log/2026.md`, in
  the same commit as the code.
