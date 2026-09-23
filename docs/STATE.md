# State of the build

**Updated:** 2026-09-23
**Versions:** app `0.18.0` · game data `0.13` · character schema `0.9` · ruleset **CRB v4 (in progress)**
The app prints its own version in the footer — compare it against this line before debugging anything.
**Suite:** `npm run verify` → **226 passing, 0 todo, 0 failing** (226 tests, six files)

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
(`tests/rules.test.mjs`). Game data also carries the archetype-independent
half of Magic (Decision 93) and the Cascade and Aberration tables (Decision
106). The Arcanist's **TOL Spent** tracker says Exhausted at TOL and, past
it, opens a Cascade panel whose **Record it** writes Notes and records the
Aberration (Decision 110). **The Grimoire reads the book** (Decision 108):
picker, Mastery at 30 IP × TH, Spell Power and Spell Attack, **Link to the
book**. **Aberrations live on the sheet** (Decision 110), one of each: cards
and chips on Trackers, Drained −2 max TOL (floor 0, current unmoved), Phantom
Pain PL 1 at full health, and a data-built **Magic reference** on Archetype.

**Combat is built end to end, and the combat plan is closed (Decisions
95–96, 99–100, 103–106).** Loadout picks weapons and armor from the catalog
(**Add**, or **Buy** from Çredits), one worn piece per slot, upgrades by slot
and quality. Weapon lines compute the attack and `BOD+X`. Take a hit reads
the worn piece, then **Natural Armor** (Thick Skin, Shake it Off, and Iron
Shirt/Waning Moon when ticked on), one derived value (Decision 104).
Trackers has Turn Reset, Rest, Focused Healing, a **Nanomed Kit** (054's
list, Decision 105) and After the fight. Print fills Defense, Nat column
included. Stubs: **F23**, **F24**, **F25**.

**TOL is 1 + INT + BOD + COOL** (Deighton, Decision 103; was INT/COOL/EMP).
Every character's TOL can move, and the Arcanist feels it most: its bonus
points reach EMP, which no longer counts, and not BOD, which now does. That's
the ruling as given. Scott has it and is updating the CRB.

**The sheet got a feel pass (Decision 107).** Every action shows an undo
toast. Conditions are added from a chip palette. The damage stepper says Heal
and Hurt. Violet buttons are readable in light mode, and a build check now
covers every filled control's contrast in both themes.

**The print front page is full.** Anything more there breaks to a second
page (Decision 96). **One known defect:** the frame/texture decoration shows
on screen but not in Chrome's print/PDF output (Decision 94). Cosmetic only.

---

## 2. Shipped, and what it left behind

The batch board — one row per merged batch — is history, so it lives in
**`log/shipped.md`** (Decision 101). This section keeps only what shipped work
left that is still true now.

**Demo hosting is live** (Printable sheet + demo hosting, #17) — Ken set the
GitHub Pages source and the Squarespace DNS CNAME; confirmed serving at
`charactersheet.shadowsrpg.com`. Only a `v*` tag deploys; **Run workflow** is a
dry run on a branch, a re-publish on a tag. **Live: app `0.18.0`,
game data `0.13`** (tag `v0.18.0`, deployed 2026-09-23; loaded: all three versions,
the `reference` panel, Drained taking TOL 2 → 0, and Home renders). `v0.13.0` and `v0.14.0`
rendered blank (#30). **Check a deploy by loading the page**, not by curling it.
**`CHANGELOG.md` is current again** (W18); `docs.test.mjs` checks each bump has a section.

**Two things a next session should know.**

- **No entry declares `excludes` or `requires` yet** — the CRB names no pair.
  Both are tested against a synthetic fixture. Adding a real one is a rules
  question for Deighton, not a data edit (Decision 77).
- **`grants` now reaches past advantages, for one reader only.** Natural
  Armor's `grants` sit on a Major Milestone and on specialization options,
  and `naturalArmor()` scans all three. `grants()` itself still scans
  advantages and disadvantages. The next grant type on a Milestone should
  widen `grants()` rather than copy the scan (Decision 104).

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
| **Gear & Combat** — Conditions, damage, armor | ✅ catalog (Decision 92) · ✅ Conditions (Decisions 95–96) · ✅ taking a hit (Decision 99) · ✅ Loadout & recovery (Decision 100) · ✅ cleanup (TOL, Natural Armor, Nanomed; Decisions 103–105) · **plan closed** | **F23 + F24 + F25** (Deighton, ask together; F23 and F25 are the same RES-class question) are stubbed and block nothing. MD1/2/3 ratings (Design, small) block nothing. Weapon mods/ammo: `WISHLIST.md` W16 |
| **Creation-pool economics** — F8 | 🔶 scaled table, working · F1/F2/F14 closed (Decision 97) | Design team, **playtesting** realistic Stat Point totals. F8 is the only wizard-blocker |
| **Milestones & doc reconciliation** — F9, F11, F12, F13 · plan CQ8, CQ9, CQ11 | ⏭ ready | Ken alone — zero-dependency, the standing low-friction session |
| **Advantages/Disadvantages fine print** — the lock-out question | 🔶 mostly settled · F17 closed (Decision 97) | Deighton. Nothing in the CRB names an `excludes` pair yet, so none is invented |
| **Cyborg** — F6, F19 | ⏸ blocked · `status: "tbd"` | Ken + Deighton + Scott: the design ruling (F6), then F19's install-cost pick |
| **Vampire** — F7 (Vampire half), F13 | ⏸ blocked · `status: "tbd"` | Design. Blood Pool/SFR direction proposed 2026-09-10, not locked |
| **Werewolf** — F7 (Werewolf half) | 🔶 mostly stable · `status: "draft"` | Design, low urgency — predator's-mark rework proposed, not locked |
| **Arcanist / Magic** | 🔶 Spellcraft + spell catalog merged (Decision 93) · ✅ Cascade + Aberration tables, TOL Spent tracker and the Cascade panel (Decision 106) · 📋 **magic on the sheet** (`plans/magic-on-the-sheet.md`): ✅ Grimoire from the book (Decision 108) · ✅ acquired Aberrations, Spell Attack + Magic reference (Decision 110) · ⏭ starting spells (Session 3; MQ1 answered, Decision 109) · Origins still `status: "draft"` — though the CRB now drafts Book/Blood/Bound (2026-09-22) | Deighton + Scott + Bill + Ken — Origins (Book/Blood/Bound) and spheres/implements still wait on the four-way question comparison from the 2026-09-10 meeting; not blocking now that the archetype-independent half is in |
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

**`main` is caught up through PR #41** (the magic plan's Session 2, Decision
110), tagged `v0.18.0` and live. Game data 0.13 has shipped, so the next change
a character can observe needs 0.14 (Decision 68).

**Next, all unblocked:** the magic plan's Session 3 (starting spells in the wizard, M6), the plan's last. Deighton answered MQ1 (Decision 109), so a spell's TH can't exceed Evocation rank. Also Milestones & doc reconciliation (Ken alone;
note F11's "Intuition Advantage" lives in a **Major Milestone** — Quick Study,
under General Milestones in `041_Archetypes` — not in the Advantages chapter).
The wishlist's layout pair **W1 + W10** is one pass. So is the popover/modal
set **W2/W3/W6**, which wants one focus-and-dismiss primitive (the W12 toast
isn't it, since it never takes focus). **W16** (weapon mods and rounds) is the
next schema bump, and **W17** could share it. Cyborg, Vampire, and the print
sheet's remaining visual work wait on people outside a session.

**Worth knowing:** the Arcanist's creation-time Unique Aberrations now follow
`041` (Decision 110). Ken expects the Origins subtypes to replace that list,
so don't invest in it.

**Waiting on the design team:** F8 (the wizard-blocker, being playtested),
and one grouped question for Deighton. **F23:** which RES class do Electric
and Burning fall under (stubbed as Energy), and where does Resistance's 50%
sit (not applied)? **F24:** when Bleeding ticks at a Reset while Dying, is it
one Death Mark standing in for the WILL check (the stub), or the check plus a
mark per source? **F25:** how does Natural Armor answer a hit? Stubbed as flat
after PROT and RES, anywhere on the body, Kinetic unless Warded, past AP, not
Massive, and every source stacks. **Ken's CRB fixes:** Gear's Conditions table → a pointer at
054 (CQ8, agreed); Siege → Massive (CQ4); Called Shot → only Massive causes
Injured/Maimed (CQ5); the 25 IP new-skill price and the stat curve past 10; a
Dying row in 054 (CQ9); CQ11; **CQ12** (answered: 054 wins, so Gear's Nanomed entry
needs Paralyzed added) and **CQ13** (054 lets a week of downtime clear
Injured; 055 says it takes Focused Healing). F23 may also want a line in
Gear's RES text once ruled.

**Unscheduled ideas** — UX and table feel, Ken's and Claude's — are in
`WISHLIST.md` as `W` ids.

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
