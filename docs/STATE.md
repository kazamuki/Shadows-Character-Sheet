# State of the build

**Updated:** 2026-09-24
**Versions:** app `0.26.1` · game data `0.20` · character schema `0.12` · ruleset **CRB v4 (in progress)**
The app prints its own version in the footer — compare it against this line before debugging anything.
**Suite:** `npm run verify` passes · **0 todo** (a todo is a confirmed defect written as a failing test; CI reports the rest)

This is the working document. It says where the build stands, what is in flight,
and who can clear what. It is **rewritten, not appended** — if a line here is out
of date it is a bug. History lives in `log/`; the authority on architecture,
schemas, decisions and flags is `SCHEMA.md`; `INDEX.md` finds anything else.

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
(`tests/rules.test.mjs`), and a hostile character file renders safely
everywhere (`tests/hostile.test.mjs`).

**Combat and magic are both built end to end, and both plans are closed**
(`plans/` keeps them as history). Combat: Decisions 95–106, with stubs
waiting on Deighton. Magic: Decisions 93, 106, 108–111 and 115.

**The 2026-09-24 audit's first five sessions are done** (`log/2026.md` has
each). Character files are untrusted input (Decision 124), every character has
a permanent **TAG** (133), decisions say what they rejected (130), and changes
have tiers (131). The data now drives the archetypes: every key is read by
code or named as text, and **no archetype is named in engine or UI code**
(134, 135). The app makes no network request, fonts included (137), and a
release is one workflow a cloud session can run (138). Tests enforce all of it.

**The print front page is full.** Anything more there breaks to a second
page (Decision 96). **One known defect:** the frame/texture decoration shows
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
- **No entry declares `excludes` or `requires` yet** — the CRB names no pair.
  Both are tested against a synthetic fixture. Adding a real one is a rules
  question for Deighton, not a data edit (Decision 77).
- **`grants` reaches past advantages for one reader only.** Natural Armor's
  `grants` sit on a Major Milestone and on specialization options, and
  `naturalArmor()` scans all three. The next grant type on a Milestone should
  widen `grants()` rather than copy the scan (Decision 104).
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
| **Audit remediation** — `plans/audit-2026-09-remediation.md` | 📋 S1–S5 ✅ · S6 ⏭ (specified by AQ4) · S7 opportunistic | Nobody. Every question is answered |
| **Gear & Combat** — Conditions, damage, armor, mods, equipment | ✅ built, **plan closed** (Decisions 92, 95–100, 103–105, 118, 120–122) | **Deighton, one grouped question:** F23 + F25 (the same RES-class question), F24, F26 (is a shotgun a rifle for mods?), **F28–F31**, the Suppression, Blast, Anti-Materiel and Reach weapon tags, and **F33** (does Jack of All Trades' Master of None raise every skill's starting cap?). All stubbed; none blocks anything. MD1/2/3 ratings (Design, small). Warding services: W28 |
| **Creation-pool economics** — F8, W34–W37 | 🔶 scaled table, working · F1/F2/F14 closed (Decision 97) | Design team, **playtesting** realistic Stat Point totals. F8 is the only wizard-blocker. The 2026-09-24 meeting added a climbing-cost stat buy (W34), a flat pool per Campaign level (W35) and starting LUCK 6, maybe by level (W37). Settle them with F8 (W36) as one ruling |
| **Milestones & doc reconciliation** — F9, F12, F13, F32 | ⏭ ready | Ken alone. F32: bring REF_CRB's Arcanist Majors in, or wait for 041 (hidden until then, AQ4) |
| **Advantages/Disadvantages fine print** — the lock-out question | 🔶 mostly settled · F17 closed (Decision 97) | Deighton. Nothing in the CRB names an `excludes` pair yet, so none is invented |
| **Cyborg** — F6, F19 | ⏸ blocked · `status: "tbd"` | Ken + Deighton + Scott: the design ruling (F6), then F19's install-cost pick |
| **Vampire** — F7 (Vampire half), F13 | ⏸ blocked · `status: "tbd"` | Design. Blood Pool/SFR direction proposed 2026-09-10, not locked |
| **Werewolf** — F7 (Werewolf half) | 🔶 mostly stable · `status: "draft"` | Design, low urgency — predator's-mark rework proposed, not locked; three Origins and four Trueborn powers unwritten |
| **Arcanist / Magic** | 🔶 spell catalog, Cascade and Aberrations, and **magic on the sheet** all built, plan closed · catalog matches the whole 2026-09-24 book, Inscribed Spells included (Decision 136) · Origins still `status: "draft"` | Deighton + Scott + Bill + Ken — Origins (Book/Blood/Bound) and spheres/implements wait on the four-way comparison from the 2026-09-10 meeting; not blocking |
| **Print sheet — visual system** | 🔶 redesigned (Decision 94) · one known cosmetic defect | Scott: a finished export (portrait vs. landscape is decided once it lands). The frame/texture print defect blocks on no one |

F5 (Cyber-Prophetical) isn't its own row — it waits wholly on Cyborg's ruling;
don't ask it separately.

Archetype status in the data: `arcanist: draft · professional: draft ·
werewolf: draft · cyborg: tbd · vampire: tbd`.

---

## 4. Open engineering work

**The audit plan's last session, no answers needed:**
- **S6, table feel,** specified by AQ4: rules text a hover or tap away, lore
  on the Archetype tab, Ammo in the shop, the phone and tablet header, the
  roster. The key guard's `NOT_YET_SHOWN` list is S6's content checklist:
  each entry comes off it as a screen shows it. `npm run phone-check` is the
  header's: today the phone fails (header 30%, Home 74 px too wide) and so does
  1024×768 (header 23% against a 20% budget); 768 px passes.

rev 9's `A` and `B` findings are all closed; `C1`–`C3` are still forward notes.

---

## 5. Where to start

**The live site is v0.26.0** (game data 0.20, schema 0.12): the spell catalog and
a spell's forms. App 0.26.1 (embedded fonts) is under `[Unreleased]`; releasing
it is the new workflow's first run. Next, unblocked: S6. Ken alone: F9, F12, F13 and F32. The wishlist holds W28 (blocked), W29 (a GM mode),
W30 (Reload from carried ammo), W31 (a TAGless character's TAG), W32 (spell
damage from Spell Power, which wants a CRB line on rounding), W33 (Martial Arts
styles) and W34–W37 (character creation).

**Waiting on others:**
- **Design team:** F8, being playtested, and W34–W37 with it.
- **Deighton:** one grouped question — F23, F24, F25, F26, F28–F31 and F33 — plus
  W28 (Warding by Elemental/Spirit/Aether against the one Warding upgrade; the
  book now prints three Warding workings, which may answer it).
  Each flag's stub and question are in `SCHEMA.md` §5.
- **Scott:** the CRB's TOL rewrite (1 + INT + BOD + COOL, Decision 103), the print export.

**For Scott, from the Book of Known Spells** (R14 checks the catalog against
it): it dropped Counterspell and Silence (kept: Magic still uses Counterspell);
four inscribed Cantrip-level spells print TN 8 where Magic keeps the spell's TN
(7); Mastery of an inscribed spell costs up to 270 IP.

**Ken's CRB fixes** (the app already follows the answer in each; the
questions' history is in `plans/combat-and-conditions.md` §6):
- **CQ4:** Gear's Siege tag should say Siege causes Massive damage, to people too.
- **CQ5:** 053 should say only Massive damage causes Injured/Maimed; a Called
  Shot counts only when the weapon deals Massive.
- **CQ8:** Gear's Conditions table becomes a pointer to 054's, the master. Half
  done: its sentence now points at Conditions & Recovery, but the table is still there.
- **CQ9:** 054's Conditions table needs a Dying row (Helpless, Death Marks;
  recovery Medical 20 or a Nanomed Kit).
- **CQ11:** 053's worked attack example has enemy armor rolling PROT and skips
  RES, against its own rules. One of them moves.
- **CQ12:** Gear's Nanomed Kit entry adds Paralyzed, matching 054.
- **CQ13:** 054 and 055 should agree on how Injured ends.
- **041:** Hardcore Parkour's prerequisites become 1 Major Milestone,
  Acrobatics 4 and Danger Sense 1 (Decision 129).
- **043:** "Ambidextrousa" is a typo for Ambidextrous (Scott's pass).
- **041, Master of None:** say whether "up to rank 4" is the rank bought (the
  app's reading, Ken's answer: 4 → 5 is standard). The Mercenary's "Handgun"
  and the Slayer's and True Warrior's "Occult" are Handguns and Occult Lore.
- **Magic:** say how ½ Spell Power rounds (up, per Ken; W32).
- **043:** 15 Advantages are tagged "Universal" (Common Sense, Lucky…) and the
  chapter never says what that means. The data keeps the tag, unread.
- **The new-skill price** (a flat 25 IP, Decision 97) and **the stat curve
  past 10** (Decision 98) need writing into the CRB. F23 may want a line in
  Gear's RES text once ruled.

**Don't invest in** the Arcanist's creation-time Unique Aberrations: they
follow `041` (Decision 110), and Ken expects the Origins subtypes to replace
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
