# State of the build

**Updated:** 2026-10-24
**Versions:** app `0.54.2` · game data `0.47` · character schema `0.28` · table schema `0.15` · pack schema `0.2` · ruleset **CRB v4 (in progress)**
The app prints its own version in the footer — compare it against this line before debugging anything.
**Suite:** `npm run verify` passes · **0 todo** (a todo is a confirmed defect written as a failing test; CI reports the rest)

This is the working document. It says where the build stands, what is in flight,
and who can clear what. It is **rewritten, not appended** — if a line here is out
of date it is a bug. History lives in `log/`; the authority on architecture,
schemas, decisions and flags is `SCHEMA.md`; `INDEX.md` finds anything else.

---

## 1. Where things stand

The app is a browser character creator and live play sheet for **Shadows**
(Synergy system). Eight-step wizard → lock → eight-tab sheet. It runs from
`file://` with no server and no build step, which drives most of the
architecture and is enforced by tests.

**This section says what exists, not how each piece works.** What a rule or
behaviour is, and why, is its decision: `INDEX.md` §3 lists every one by
topic. What shipped when is `log/shipped.md`. Don't add a clause here per
decision; that's how this section reached 1,500 words (`log/archive.md` §4).

- **The player sheet** is built and covered by tests: the whole wizard; every
  sheet tab; damage, Pain, armor, Conditions, healing and Take a hit; Sanity,
  Luck, Çredits, IP, Milestones and the session log; loadout with the gear
  catalog; Expert mode; an undoable audit trail; a printable sheet, filled or
  blank. Traits' effects are data (`grants`), computed where the engine can
  and shown as tags everywhere.
- **The archetypes**: the Professional and the Arcanist (`draft`), the
  Werewolf (`0414`) and the Vampire (`0413`), both `draft` with their Majors,
  and a player-written **Custom** one. The Cyborg is cut and still `tbd`
  (§3). Supernatural powers have ranks; creation follows the book's caps
  (240) and play stops at 10 (194).
- **Magic** (spells, Cascade, Aberrations, holding a spell) and **combat**
  are built end to end, and both plans are closed.
- **GM mode** is built through S7, **switched off** (`FEATURES.gm`, 173): a
  table file with its cast, packs and the Codex, encounters, sessions and the
  close-out, the Reference, Find and Jot, and undo. `?gm=on` turns it on in a
  browser. `plans/gm-mode.md` §6 lists what's built and what's left.
- **CRANK** reputation is on for everyone (239).
- The engine reproduces the CRB's worked examples (`tests/rules.test.mjs`),
  and a hostile file renders safely everywhere (`tests/hostile.test.mjs`).

**The print front page is full.** Anything more there breaks to a second
page (Decision 96). Four pages in all, the archetype's last (153). **One known defect:** the frame/texture decoration shows
on screen but not in Chrome's print/PDF output (Decision 94). Cosmetic only.

---

## 2. Shipped, and what it left behind

The batch board is `log/shipped.md`. This section keeps only what shipped work
left that is still true now.

**Demo hosting:** `charactersheet.shadowsrpg.com`, via GitHub Pages, deployed
only by the **release** workflow (Decision 138): from main with a version, a
pushed `v*` tag, or a dry run on a branch. The live version is the latest
`v*` tag. How to release is in `CLAUDE.md`, and only there.

**Things a next session should know.**

- **Name the change tier first** (`CLAUDE.md`). A Docs or Fix change doesn't
  rewrite this file unless what's next changed. `.claude/skills/` walks the
  procedures; `npm run bump` moves the app version; `test:fast` is the quick loop.
- **Before proposing anything, search SCHEMA §4's Touches lines** for what it
  touches, and read the Rejected and Revisit if of what you find (Decision 130).
- **One entry declares `excludes`, none `requires`:** Dwarf excludes Giant
  (Deighton, Decision 235), the lock symmetric. `requires` is tested against a
  synthetic fixture. Adding a real pair is a rules question for Deighton, not a
  data edit (Decision 77).
- **`grants()` reads advantages, disadvantages and taken Majors** (199);
  a Major is looked up with `majorById`, never `majorGeneral` alone. Natural
  Armor still scans for itself, specializations included (104).
- **A number another table holds is a path** (`"powerLevel.x"`, read by
  `Engine.dataPath`); a formula is `{ stat, times, plus }` (Decision 135).
- **Proving a change invisible** (Decision 68): `node tools/outputs.mjs a.json`,
  change it, then `--against a.json`. About four minutes each way.
- **Reuse, don't copy:** `openPopover`, `openCatalog(kind)` over
  `Engine.catalogLine`, `bindVitalControls(root)` (0.22), and `openModal`.
- **Gear rows and weapon rows share a shape**: a catalog reference or
  `custom: true`, and `migrate()` never guesses between them (Decisions
  120–121).
- **Retired text lives in `log/archive.md`**, verbatim: SCHEMA's old roadmap,
  the closed-flag notes, and the data's old `meta.notes`.

---

## 3. Areas of work

Grouped by what part of the app or ruleset they touch, not by who owns
them — a status and what's blocking it travel with the topic. `SCHEMA.md` §5
is the authority on a flag's full text.

**Legend:** ✅ done · ⏭ ready (nothing external blocks starting) · 📋 planned (a plan doc exists) · 🔶 partial/stable · ⏸ blocked

| Area | Status | Waiting on |
|---|---|---|
| **Audit remediation** — `plans/archive/audit-2026-09-remediation.md` | ✅ S1–S7 done, every finding closed, plan closed | Nobody |
| **Gear & Combat** — Conditions, damage, armor, mods, the hit, healing | ✅ built, plan closed; Deighton's 2026-10-10 rulings all built (P8a–P9b, Decisions 219–222) | Deighton: **F42** (which damage Resistance answers) |
| **Custom archetype & classification** — `plans/archive/custom-archetype.md` | ✅ built and released (Decisions 152–156) | Nobody. W48–W55 are its follow-ons |
| **Creation-pool economics** — W37 | ✅ built (Decisions 150, 157) | Nobody |
| **Milestones** — F12, F32 | ✅ P6 built (Decision 217): any Minor repeats, each with its chooser | Ken: **F32** (Arcanist Majors; until then **Add one** is the stand-in) and **F12** |
| **Advantages/Disadvantages fine print** | 🔶 mostly settled · F17 closed (97) · one `excludes` pair, Dwarf and Giant (235) | Deighton. The CRB names no other pair, so none is invented |
| **Cyborg** — F6, F19 | ⏸ **cut as an archetype**: cybernetics become a list and a mini-game, Professionals only; data still `tbd` | Deighton's system is mirrored (`private/crb/Cybernetics_*`); **W90** holds the six questions before a plan. Then the app retires `cyborg` (a decision and a `migrate()` step) and closes F6 and F19 |
| **Vampire** — `0413` | ✅ built (Decisions 200–202, 215, 223, 240): Bloodlines, the Thirst, 22 Majors; Base Powers and CP as the 2026-10-22 book prints | Nobody. Whether it leaves `draft` is Ken's (the chapter dropped "Under Construction") |
| **Werewolf** — `0414` | ✅ built (Decisions 195–197, 199, 215, 240): Origins, Form, Call of the Wild, its own Majors; Base Powers and CP as the book prints | Nobody. As the Vampire: `draft` is Ken's call |
| **Arcanist / Magic** | 🔶 spells, Cascade, Aberrations, magic on the sheet, holding a spell (Decision 224) all built · Origins still `draft` | Deighton: **F43** (the held spell's check). Deighton + Scott + Bill + Ken: Origins and spheres/implements, after the four-way comparison; not blocking |
| **GM mode** — `plans/gm-mode.md` | 🔶 built through S7, **switched off** (173) | Scott and Deighton: the open `GQ`s (§9) and Codex v2 (S12a, S17) |
| **The book** — `plans/crb-catch-up.md` | 📋 what the CRB still needs from the sheet, by chapter | Ken. The sheet-from-book syncs are closed (`plans/archive/`); the next mirror refresh gets a new one |
| **Print sheet — visual system** — `plans/print-sheet-scotts-look.md` | 📋 Scott's export landed 2026-09-23 (landscape) · front-page restyle proposed and mocked up · one known cosmetic defect | Ken: approve the plan. Scott: PQ1 (can Cerulean Nights be embedded), PQ2 (his artwork). Deighton: PQ3 (do the stat groups mean anything). The frame/texture print defect blocks on no one |

F5 (Cyber-Prophetical) isn't its own row — it waits wholly on the cybernetics mini-game; don't ask it separately.

Archetype status in the data: `arcanist: draft · professional: draft ·
werewolf: draft · cyborg: tbd · vampire: draft`. The 2026-10-22 book dropped
"Under Construction" from `0413` and `0414`; whether the two leave `draft` is Ken's call.

---

## 4. Open engineering work

**The audit plan is done, S7 included.** `npm run phone-check` passes (140) after header work.
- **Binders sit beside their renderers** (`wizard.js`, `sheet.js`); a migration that reshapes a row migrates the audit's patches too (142).
- **The roster** (141): a character is `shadows.char.v1.<TAG>`; a test reads one
  back with `stored()`. Seeding the old slot keys still works, through the migration.
- **The flyout's state goes through `syncVitals`** (166), never by hand; a sideways row is a `.scroll-row` bound by `bindScrollRows` (165), which gives it the mouse wheel too. In jsdom, `boot({ width })` gives the page a `matchMedia`.
- **A redraw a press causes goes through `keepPlace`** (164), or Enter there drops focus to `<body>`. **Reuse the tip** (139): a new "what does this mean" is a `TIPS` kind in
  `shared.js`. Refusals are `notice()`, confirmations `askFirst()`.

rev 9's `C1`–`C3` are still forward notes.

---

## 5. Where to start

**The live site is v0.54.1** (data 0.47, schema 0.28), released 2026-10-23; the Character tab's layout (P16, app 0.54.2) is merged and waits for a release.

**Next is Ken's pick**, each built through a work order (`WORK-ORDERS.md`):
- **Another of `plans/gm-mode.md`'s *Still to build*** (S7, factions and clocks, is built).
- **The player sheet's plan** (`plans/sheet-wishlist.md`) has only P14 (loadout
  rows) and P15 (worn gear modifiers) left, shelved at its end until Deighton
  finishes the vehicle follow-ups. P16, the Character tab's layout, is built.
- **W90**, cybernetics: six questions before a plan.

**Ken alone:** F12 and F32, W38's plan (`plans/two-tabs-one-character.md`,
TQ1–TQ3), and the print plan (`plans/print-sheet-scotts-look.md`). GM mode's
GQ6 block session (TOL and WILL, 175 reopened) waits on Scott's answer for WILL.
GM sessions merge switched off (173), and releases go on as usual.

**Waiting on others:**
- **Deighton** answered every open rules question on 2026-10-10 (`reference/rulings-2026-10-10.md`). Still his: what a rank of Educated bought in play gives (F44: the IP buy refuses it until then), the TN and TH of the WILL check that keeps a held spell (F43), and whether a Supernatural's Skills and Powers share its stats' headroom past 10 (Ken asked). **One ruling on kickers may clear F46 and F47 together:** do dice stack, and which one is "your Kicker Die"; F45 is Concierge's appraising Skill. **CRANK** is kept and back on for everyone (239, 2026-10-23); GQ7, F37 and GQ28 are still open.
- **Deighton, on vehicles:** 17 of the 28 follow-up questions
  (`reference/rulings-2026-10-23.md`). P14 waits on SH3 (a typed vehicle),
  VK1b (the Mods number), and his in-person talk on vehicles without PROT and RES.
- **GM mode's open questions** (`GQ`_n_) and who holds each: `plans/gm-mode.md` §9.
- **Scott:** the print plan's PQ1, PQ2 and PQ4 (the display font's licence, reusing his artwork, the Health Level "Active" tab), and whether the four inscribed Cantrips are TN 8 (the Book of Known Spells) or keep TN 7 (Magic). His TOL rewrite is in 0200 and 0400.

**Don't invest in** the Arcanist's creation-time Unique Aberrations: they
follow `0411` (Decision 110), and Ken expects the Origins subtypes to replace
them.

---

## 6. Keeping this file honest

- **Every volatile fact lives here and nowhere else.** `CLAUDE.md` carries no
  counts. Log entries state figures *as of that session* and are never
  updated — they are history, and history does not drift.
- **`tests/docs.test.mjs` enforces it:** the todo count, the versions and this
  file's length are checked, the flag table is checked against the data, and
  every file `CLAUDE.md` points at must exist.
- **§3 is organized by topic, not by sequence, on purpose (2026-09-12).**
  Several areas are blocked on different people and resolve in whatever
  order those people answer. Don't reintroduce a `#` column to §3.
- **Describe what shipped in `log/`, not here.** A paragraph about a finished
  batch is history; this file keeps only what's still true and what's next.
- **Rewrite §1–§5 when the change tier says so** (`CLAUDE.md`), in the same
  commit as the work.
