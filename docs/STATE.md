# State of the build

**Updated:** 2026-09-22
**Versions:** app `0.14.1` · game data `0.9` · character schema `0.8` · ruleset **CRB v4 (in progress)**
The app prints its own version in the footer — compare it against this line before debugging anything.
**Suite:** `npm run verify` → **182 passing, 0 todo, 0 failing** (182 tests, six files)

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
damage and Pain Levels, taking a hit through armor, Conditions, recovery,
Sanity, Luck, Çredits, IP and Milestones, the session log, loadout with the
weapons/armor catalog, `grants`, an undoable audit trail, and a printable
sheet, filled or blank. The engine reproduces the CRB's own worked examples
(`tests/rules.test.mjs`). Game data also carries the archetype-independent
half of Magic (Decision 93). It isn't wired to UI beyond the Arcanist's
Grimoire/Disciplines panels.

**Combat is built end to end (plan Sessions 2–4, Decisions 95–96, 99–100).**
Loadout picks weapons and armor from the catalog (**Add**, or **Buy** from
Çredits in one undoable action), one worn piece per slot, and upgrades by
slot and quality. Weapon lines compute the attack (the skill check, ACC
apart) and `BOD+X`. Take a hit reads the worn piece; the stand-in is gone.
Trackers adds Turn Reset, Rest, Focused Healing (the only way back for
Massive levels and Injured) and After the fight; Loadout repairs. Print
fills Defense and an Armor table. Stubs: **F23** and **F24**.

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
| — | Loadout & recovery (combat plan Session 4) | #28 | Catalog pickers + Buy, weapon lines, worn/upgrades/wear/repair, Rest, Focused Healing, Turn Reset, print armor · Decision 100, F24 |

**Demo hosting is live** (Printable sheet + demo hosting, #17) — Ken set the
GitHub Pages source and the Squarespace DNS CNAME; confirmed serving at
`charactersheet.shadowsrpg.com` (2026-09-12). It only redeploys on a `v*` tag
push (`deploy-demo.yml`), not on every merge to `main`. **Live: app `0.14.0`,
game data `0.9`** (tag `v0.14.0`), **which renders blank**, as did `v0.13.0`:
the build dropped `print.css`'s `media="print"` (fixed in 0.14.1, not yet
tagged). **Check a deploy by loading the page**, not by curling `APP_VERSION`.

**Two things a next session should know.**

- **No entry declares `excludes` or `requires` yet** — the CRB names no pair.
  Both are tested against a synthetic fixture. Adding a real one is a rules
  question for Deighton, not a data edit (Decision 77).
- **Thick Skin is held out, on purpose, for the cleanup session.** Natural
  Armor is granted in prose in four places (Thick Skin, Iron Shirt, an
  archetype effect and benefit). It should become one derived value on top of
  `armorState()`, not a special case. Ken moved it out of Session 4
  (2026-09-22). The print Defense card's Nat column waits on it.

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
| **Gear & Combat** — Conditions, damage, armor | ✅ catalog (Decision 92) · ✅ Conditions (Decisions 95–96) · ✅ taking a hit (Decision 99) · ✅ **Loadout & recovery** (Session 4, Decision 100) · 📋 cleanup session in `plans/combat-and-conditions.md` | ⏭ Cleanup (Thick Skin/natural armor; revisit Nanomed; weapon mods/ammo if wanted) is unblocked. **F23 + F24** (Deighton, ask together) are stubbed and block nothing. MD1/2/3 ratings (Design, small) block nothing |
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

The PR #7 adversarial review's three machinery gaps are closed and
mutation-tested (Decision 91; the account is in `log/2026.md`).

---

## 5. Where to start

**`main` is caught up through PR #28** (combat plan Session 4, Loadout &
recovery, Decision 100) and the 0.14.1 build fix. `v0.14.0` is on the demo
site but blank (see §2); tag 0.14.1 to fix it. Game data 0.9 has shipped, so the
next change a character can observe needs a `gamedataVersion` bump
(Decision 68). `npm run verify` is green (182 passing, 0 todo).

**Next up is the combat plan's cleanup session**, Ken's call on 2026-09-22:
see where Session 4 landed, then fold Thick Skin, Iron Shirt and the
archetype Natural Armor grants into one value derived on top of
`armorState()`. That also fills the print Defense card's Nat column. Then
revisit a Nanomed Kit button (after CQ12). Weapon mods and ammo tracking,
deferred at sign-off, would be one schema 0.9 bump with a `migrate()` step.

**Also unblocked:** the plan's Magic-tables side session (Cascade + Aberration
tables, independent of combat) and Milestones & doc reconciliation (Ken alone;
note F11's "Intuition Advantage" lives in a **Major Milestone** — Quick Study,
under General Milestones in `041_Archetypes` — not in the Advantages chapter).
Cyborg, Vampire, and the print sheet's remaining visual work wait on people
outside a session.

**Waiting on the design team:** F8 (the wizard-blocker, being playtested),
and one grouped question for Deighton. **F23:** which RES class do Electric
and Burning fall under (stubbed as Energy), and where does Resistance's 50%
sit (not applied)? **F24:** when Bleeding ticks at a Reset while Dying, is it
one Death Mark standing in for the WILL check (the stub), or the check plus a
mark per source? **Ken's CRB fixes:** Gear's Conditions table → a pointer at
054 (CQ8, agreed); Siege → Massive (CQ4); Called Shot → only Massive causes
Injured/Maimed (CQ5); the 25 IP new-skill price and the stat curve past 10; a
Dying row in 054 (CQ9); CQ11; and new this session, **CQ12** (054 and Gear
disagree on whether a Nanomed Kit clears Paralyzed) and **CQ13** (054 lets a
week of downtime clear Injured; 055 says it takes Focused Healing). F23 may also want a line in Gear's RES text once ruled.

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
