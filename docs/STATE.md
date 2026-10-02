# State of the build

**Updated:** 2026-10-01
**Versions:** app `0.36.0` · game data `0.28` · character schema `0.16` · ruleset **CRB v4 (in progress)**
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

**The 2026-09-24 audit is done** (`log/2026.md` has
each one done). Character files are untrusted input (Decision 124), every
character has a permanent **TAG** (133), decisions say what they rejected
(130), and changes have tiers (131). The data drives the archetypes: every key
is read by code or named as text, and **no archetype is named in engine or UI
code** (134, 135). The app makes no network request, fonts included (137), and
a release is one workflow a cloud session can run (138). **Any rule the sheet
names is a hover or tap away** (139): tags, stat scores, the check rules, lore
and the whole Magic reference, through one tip primitive, and Ammo is in the
shop. The header is two thin rows, its tabs one scrolling line (140), and
Home lists a roster, one entry per TAG (141). A free advantage is `source` (142). Reload takes the rounds you carry, and asks before reloading from none (145); a held Ghost TAG labels the TAG (146). Spell Power amounts read as numbers (147), a character can be TAGless (148), and a weapon remembers the specialty rounds in it (149). Stat Points are a flat pool or a roll, the GM's pick, and a stat point costs 2 past 6 (150). Main has Heal 1, Hurt 1 and Take a hit under its Health and Pain cards, and at zero a hit goes through Take a hit (151). Every archetype is Mortal or Supernatural, and a Supernatural buys only the Universal Advantages (152). A **Custom** archetype is written by the player with the GM: what it is, an Other classification in its own words, the panels it ticks on, traits, powers and vulnerabilities, in the wizard, on the sheet and on paper; in play a power reads as written, and **Improve** rewrites it for IP; Admin edits it free (153, 154). A TAGless number drops its TAG- prefix (155), the Skills tab lists every skill in two columns (156), and the wizard's Continue sticks to the bottom of the screen. Everyone starts with 4 LUCK and a power rank costs 5 CP at creation, every power's (157). Traits and Archetype are one **Character** tab (158), Progression's raises are modals (159), and from 1280px the vitals panel pins beside the sheet (160). On a phone the wizard's rail is one sticky line of the points left, with the full rail in the flyout, and each step has one title (161). A character locks only once every point that can still buy something is spent (162), and locking prints the TAG once while a toast names the file (163). A press that re-renders keeps the keyboard's place (164). Tests enforce all of it.

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
| **Audit remediation** — `plans/audit-2026-09-remediation.md` | ✅ S1–S7 done, every finding closed, plan closed | Nobody |
| **Gear & Combat** — Conditions, damage, armor, mods, equipment | ✅ built, **plan closed** (Decisions 92, 95–100, 103–105, 118, 120–122, 143, 145, 149) | **Deighton, one grouped question:** F23 + F25 (the same RES-class question), F24, F26 (is a shotgun a rifle for mods?), **F28–F31**, **F34** (does a magazine swapped out keep its rounds?), **F36** (is damage past zero kept for healing?), the Suppression, Blast, Anti-Materiel and Reach weapon tags, and **F33** (does Jack of All Trades' Master of None raise every skill's starting cap?). All stubbed; none blocks anything. MD1/2/3 ratings (Design, small) |
| **Custom archetype & classification** — `plans/custom-archetype.md` | ✅ S1–S5 built (Decisions 152–153, F13 closed), XQ1–XQ6 on their defaults (XQ5's badge reads "off the books") · copy voice-passed · released in v0.33.0 · Ken's playtest feedback built and released in v0.34.0 (Decisions 154–156) | Nobody. W48–W55 are its follow-ons |
| **Creation-pool economics** — W37 | ✅ Deighton's playtested table and the climbing stat buy built (Decision 150) · F8 and F35 closed · LUCK starts at 4 and a power rank costs 5 CP (Decision 157, W37 granted) | Nobody |
| **Milestones & doc reconciliation** — F9, F12, F32 | ⏭ ready | Ken alone. F32: bring REF_CRB's Arcanist Majors in, or wait for 041 (hidden until then, AQ4) |
| **Advantages/Disadvantages fine print** — the lock-out question | 🔶 mostly settled · F17 closed (Decision 97) | Deighton. Nothing in the CRB names an `excludes` pair yet, so none is invented |
| **Cyborg** — F6, F19 | ⏸ blocked · `status: "tbd"` | Ken + Deighton + Scott: the design ruling (F6), then F19's install-cost pick |
| **Vampire** — F7 (Vampire half) | ⏸ blocked · `status: "tbd"` | Design. Blood Pool/SFR direction proposed 2026-09-10, not locked |
| **Werewolf** — F7 (Werewolf half) | 🔶 mostly stable · `status: "draft"` | Design, low urgency — predator's-mark rework proposed, not locked; three Origins and four Trueborn powers unwritten |
| **Arcanist / Magic** | 🔶 spell catalog, Cascade and Aberrations, and **magic on the sheet** all built, plan closed · catalog matches the whole 2026-09-24 book, Inscribed Spells included (Decision 136) · Origins still `status: "draft"` | Deighton + Scott + Bill + Ken — Origins (Book/Blood/Bound) and spheres/implements wait on the four-way comparison from the 2026-09-10 meeting; not blocking |
| **Print sheet — visual system** — `plans/print-sheet-scotts-look.md` | 📋 Scott's export landed 2026-09-23 (landscape) · front-page restyle proposed and mocked up · one known cosmetic defect | Ken: approve the plan. Scott: PQ1 (can Cerulean Nights be embedded), PQ2 (his artwork). Deighton: PQ3 (do the stat groups mean anything). The frame/texture print defect blocks on no one |

F5 (Cyber-Prophetical) isn't its own row — it waits wholly on Cyborg's ruling; don't ask it separately.

Archetype status in the data: `arcanist: draft · professional: draft ·
werewolf: draft · cyborg: tbd · vampire: tbd`.

---

## 4. Open engineering work

**The audit plan is done, S7 included.** `npm run phone-check` passes (140) after header work.
- **Binders sit beside their renderers** (`wizard.js`, `sheet.js`); a migration that reshapes a row migrates the audit's patches too (142).
- **The roster** (141): a character is `shadows.char.v1.<TAG>`; a test reads one
  back with `stored()`. Seeding the old slot keys still works, through the migration.
- **A redraw a press causes goes through `keepPlace`** (164), or Enter there drops focus to `<body>`. **Reuse the tip** (139): a new "what does this mean" is a `TIPS` kind in
  `shared.js`. Refusals are `notice()`, confirmations `askFirst()`.

rev 9's `C1`–`C3` are still forward notes.

---

## 5. Where to start

**The live site is v0.35.0** (data 0.28, schema 0.16): the custom archetype (153–156) and Ken's and Deighton's sheet feedback (157–160), live for Saturday 2026-10-03. **0.36.0 is built, not released:** W44, the wizard on a phone (161), spend every point before the lock (162, W57), the lock's beat (163, W46), and a keyboard press keeping its place (164, W47). The critique was re-run on 0.35.1 (29/40); W45 still stands, reworded, and W58–W60 are new. Next: the W60 fixes, then W58 and W59 (W59's live region is what makes 164's re-focus tell a screen reader the new number). W45's shape for Main on a phone is Ken's open call.
Ken alone: F9, F12, F32 and **W38's plan** (`plans/two-tabs-one-character.md`,
TQ1–TQ3). The wishlist: W29, W39, W54 and W55.

**Waiting on others:**
- **Deighton:** one grouped question — F23, F24, F25, F26, F28–F31, F33, F34 and F36 — plus
  W39's two halves. Each flag's stub and question are in `SCHEMA.md` §5.
- **Scott:** the CRB's TOL rewrite (1 + INT + BOD + COOL, Decision 103); the print plan's PQ1, PQ2 and PQ4 (the display font's licence, reusing his artwork, the Health Level "Active" tab).

**For Scott, from the Book of Known Spells** (R14 checks the catalog against
it): it dropped Counterspell and Silence (kept: Magic still uses Counterspell);
four inscribed Cantrip-level spells print TN 8 where Magic keeps the spell's TN
(7); Mastery of an inscribed spell costs up to 270 IP.

**Ken's CRB fixes** (the app already follows the answer in each; the
questions' history is in `plans/combat-and-conditions.md` §6):
- **040, Rolling Stat Points:** Deighton's table, the stat buy and Skill Points as base + INT + REF (150).
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
- **Gear's Warding** becomes Magic's three and Self-mending, a mod slot each (143).
- **CQ13:** 054 and 055 should agree on how Injured ends.
- **041:** Hardcore Parkour's prerequisites become 1 Major Milestone,
  Acrobatics 4 and Danger Sense 1 (Decision 129).
- **030, Luck:** everyone starts with 4 LUCK. **Creation:** a power rank costs 5 CP, any power's, up to Max Power Rank; it replaces "1 CP per point" for powers (157).
- **Gear, The TAG:** Black TAG is the Ghost TAG Advantage (Ken, 146); a line saying so.
- **043:** "Ambidextrousa" is a typo for Ambidextrous (Scott's pass).
- **041, Master of None:** say whether "up to rank 4" is the rank bought (the
  app's reading, Ken's answer: 4 → 5 is standard). The Mercenary's "Handgun"
  and the Slayer's and True Warrior's "Occult" are Handguns and Occult Lore.
- **Magic:** say how ½ Spell Power rounds (up, per Ken; the sheet does, Decision 147).
- **043:** say what "Universal" means: open to every classification, the rest
  Mortal-only, so Werewolves and Vampires buy only the 15 Universal ones (152). 041's Werewolf trait "Unable to Purchase Advantages" becomes Universal only; the app already says so.
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
