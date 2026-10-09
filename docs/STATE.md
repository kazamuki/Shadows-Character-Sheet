# State of the build

**Updated:** 2026-10-09
**Versions:** app `0.39.0` · game data `0.33` · character schema `0.19` · table schema `0.9` · pack schema `0.2` · ruleset **CRB v4 (in progress)**
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
Home lists a roster, one entry per TAG (141). A free advantage is `source` (142). Reload takes the rounds you carry, and asks before reloading from none (145); a held Ghost TAG labels the TAG (146). Spell Power amounts read as numbers (147), a character can be TAGless (148), and a weapon remembers the specialty rounds in it (149). Stat Points are a flat pool or a roll, the GM's pick, and a stat point costs 2 past 6 (150); the book's flat pool is the default and rolling a box to tick (198). A grenade reads its 1x / 2x+ column and Defense as printed. Main has Heal 1, Hurt 1 and Take a hit under its Health and Pain cards, and at zero a hit goes through Take a hit (151). Every archetype is Mortal or Supernatural, and a Supernatural buys only the Universal Advantages (152). A **Custom** archetype is written by the player with the GM: what it is, an Other classification in its own words, the panels it ticks on, traits, powers and vulnerabilities, in the wizard, on the sheet and on paper; in play a power reads as written, and **Improve** rewrites it for IP; Admin edits it free (153, 154). A TAGless number drops its TAG- prefix (155), the Skills tab lists every skill in two columns (156), and the wizard's Continue sticks to the bottom of the screen. Everyone starts with 4 LUCK and a power rank costs 5 CP at creation, every power's (157). Traits and Archetype are one **Character** tab (158), which fills a wide screen: the archetype beside its core mechanic, its parts and cards as many across as fit (168); Progression's raises are modals (159), and from 1280px the vitals panel pins beside the sheet (160). On a phone the wizard's rail is one sticky line of the points left, with the full rail in the flyout, and each step has one title (161). A character locks only once every point that can still buy something is spent (162), and locking prints the TAG once while a toast names the file (163). A press that re-renders keeps the keyboard's place (164). On a phone the sheet gives the screen to play: smaller titles, Combat before Stats, and one-row vitals and jump bars; Pin is on Main from 1280px (165). The closed vitals flyout is inert, and a tab switch closes it (166). CRANK rep is a tracker beside Çredits (169). Every power has a rank, and **Raise a Power** on Progression buys the next at `0450`'s price; printed caps bind creation only, play stops at 10 (194). **The Werewolf is `0414`'s**: three Origins (Trueborn, Wildblood, Forge Fang) with their features, starter powers and withdrawal steps, every Innate and Origin power at rank 1 + IP, a Form switch on Main that lifts the played stats (not WILL, TOL or prices), shows Claws and Fangs, bars TECH, and charges a Forge Fang 1 HL of Withering, Call of the Wild as a stepper, and a Stat Bonus on its Focus Stats (195–197), and its own Major Milestones beside the shared ones, by Origin, a few computed: RoU, SFR, and what a shift costs or bars (199). **The Vampire is `0413`'s**: three Bloodlines, Base Powers placed a rank at a time into Innate or Bloodline powers (F39's stub), Built to Last a creation pick (F41's stub), a Draugur's Ancient Weapon and Code, the bite, claws and weapon on Main, and Iron Hide and Icebound Resilience as conditional Natural Armor (200); **Feed** and **A day unfed** under SFR, with Hunger's check at RoU (201); and Pain only from Withering's Health Levels (202). Admin sets a saved one's Bloodline. A GM's table is its own file, `.shadows-table.json`, with its own gate and schema, kept in the browser beside the roster, in a fifth script, `gm.js` (170–172); it all sits behind a feature switch that ships off (173). A table keeps a **cast**: a record per NPC, from a name to a stat block, with Health derived and TOL and WILL stored as the Codex authors them, on a Cast tab that quick-adds (174–176), and keeps dated **interactions** between the crew and the cast, affiliations, and a *Who knows what* view of them by crew name (177–179), and reads **packs**: a book a GM slots in once, kept in the browser outside every table, whose threats, people and groups fill a **Threats** tab and whose **Use** copies an entry into the cast (180–182), and the cast member's page reads them as a builder: it offers their origins, roles and tiers, shows each one's guidance (the book's words, never applied, never a warning) and adds traits from their glossary (183–185). The Threat Codex itself is a pack, built from the mirror by a script in `private/` (`npm run codex-pack`), its ids kept by a ledger keyed by the book's names so a renumbered book keeps every id (186); apostrophes fold in every name match (187). A table keeps **encounters**, of no fixed type: rows from the cast, the Codex and typed names, Combat Sense order with ties shown, Conditions that carry a source and rounds, damage with Health Levels and Pain beside it, and a Reset that lists what ticks, runs out and asks for a save; Use is **Add to cast** beside **Add to the encounter open** (188–190); a row takes a hit through the sheet's own pipeline, an NPC's on a stand-in character wearing the Gear catalog's piece with its PROT static (053), a PC's after their armor, with Shock, At Zero and Dying's Death Mark offered and none forced, and the active row's traits a tap away (191–192), and End opens a wrap-up that keeps the survivors worth keeping, writes the fight onto each cast member's record as an interaction and names the wear die (193), and keeps **sessions** with the book's Campaign Journal and **threads**, one of them current, on a **Sessions** tab that a new table opens on and that leads with **Next session**, computed (203–204), and closes a session out on one sheet: IP at 5 an hour rounded up, the Milestone Point, an off-screen CRANK job for whoever was away, the Milestone reminder, the threads and the NPCs made up that night, written once as the session's **award log** (205–206). Tests enforce all of it.

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
| **Audit remediation** — `plans/audit-2026-09-remediation.md` | ✅ S1–S7 done, every finding closed, plan closed | Nobody |
| **Gear & Combat** — Conditions, damage, armor, mods, equipment | ✅ built, **plan closed** (Decisions 92, 95–100, 103–105, 118, 120–122, 143, 145, 149) | **Deighton, one grouped question:** F23 + F25 (the same RES-class question), F24, F26 (is a shotgun a rifle for mods?), **F30**, **F31**, **F34** (does a magazine swapped out keep its rounds?), **F36** (is damage past zero kept for healing?), and the Anti-Materiel and Reach weapon tags. All stubbed; none blocks anything. MD1/2/3 ratings (Design, small) |
| **Custom archetype & classification** — `plans/custom-archetype.md` | ✅ S1–S5 built (Decisions 152–153, F13 closed), XQ1–XQ6 on their defaults (XQ5's badge reads "off the books") · copy voice-passed · released in v0.33.0 · Ken's playtest feedback built and released in v0.34.0 (Decisions 154–156) | Nobody. W48–W55 are its follow-ons |
| **Creation-pool economics** — W37 | ✅ Deighton's playtested table and the climbing stat buy built (Decision 150) · F8 and F35 closed · LUCK starts at 4 and a power rank costs 5 CP (Decision 157, W37 granted) | Nobody |
| **Milestones & doc reconciliation** — F9, F12, F32 | ⏭ ready | Ken alone. F32: bring REF_CRB's Arcanist Majors in, or wait for 0411 (hidden until then, AQ4) |
| **Advantages/Disadvantages fine print** — the lock-out question | 🔶 mostly settled · F17 closed (Decision 97) | Deighton. Nothing in the CRB names an `excludes` pair yet, so none is invented |
| **Cyborg** — F6, F19 | ⏸ **cut as an archetype** (team meetings, late 2026-09): cybernetics become a list and a mini-game, Professionals only; Arcanists, Vampires and Werewolves can't take them · data still `status: "tbd"` | Design: the cybernetics list and mini-game. Then the app retires `cyborg` (Rule or shape: a numbered decision, and `migrate()` for any saved Cyborg), closes F6 and F19, and moves Installed Cybernetics to the Professional. W61 proposes folding a saved Cyborg into Custom |
| **Vampire** | ✅ **`0413` built** (P4, Decisions 200–202): Bloodlines and their choices, Base Powers, the Thirst computed, Pain Immunity · F7 closed · F39 and F41 stubbed · unreleased | Deighton/Scott: F39. Deighton: F41. Ken: P4b, the Vampire's 24 Majors on P3b's engine, a session of its own (VQ27) |
| **Werewolf** | ✅ **`0414` built** (P3 and P3b, Decisions 195–197, 199): Origins, powers with ranks, Form computed, Call of the Wild, Focus Stats, its own Major Milestones · F7's Werewolf half closed · F38 stubbed · unreleased | Deighton/Scott: F38. Ken: F9 decides whether the shared Majors stay beside its own |
| **Arcanist / Magic** | 🔶 spell catalog, Cascade and Aberrations, and **magic on the sheet** all built, plan closed · catalog matches the whole 2026-09-24 book, Inscribed Spells included (Decision 136) · Origins still `status: "draft"` | Deighton + Scott + Bill + Ken — Origins (Book/Blood/Bound) and spheres/implements wait on the four-way comparison from the 2026-09-10 meeting; not blocking |
| **Print sheet — visual system** — `plans/print-sheet-scotts-look.md` | 📋 Scott's export landed 2026-09-23 (landscape) · front-page restyle proposed and mocked up · one known cosmetic defect | Ken: approve the plan. Scott: PQ1 (can Cerulean Nights be embedded), PQ2 (his artwork). Deighton: PQ3 (do the stat groups mean anything). The frame/texture print defect blocks on no one |

F5 (Cyber-Prophetical) isn't its own row — it waits wholly on the cybernetics mini-game; don't ask it separately.

Archetype status in the data: `arcanist: draft · professional: draft ·
werewolf: draft · cyborg: tbd · vampire: draft`. The Werewolf and the Vampire stay
`draft` while their chapters still say "Under Construction" and F38, F39 and F41 are open.

---

## 4. Open engineering work

**The audit plan is done, S7 included.** `npm run phone-check` passes (140) after header work.
- **Binders sit beside their renderers** (`wizard.js`, `sheet.js`); a migration that reshapes a row migrates the audit's patches too (142).
- **The roster** (141): a character is `shadows.char.v1.<TAG>`; a test reads one
  back with `stored()`. Seeding the old slot keys still works, through the migration.
- **The flyout's state goes through `syncVitals`** (166), never by hand; a sideways row is a `.scroll-row` bound by `bindScrollRows` (165). In jsdom, `boot({ width })` gives the page a `matchMedia`.
- **A redraw a press causes goes through `keepPlace`** (164), or Enter there drops focus to `<body>`. **Reuse the tip** (139): a new "what does this mean" is a `TIPS` kind in
  `shared.js`. Refusals are `notice()`, confirmations `askFirst()`.

rev 9's `C1`–`C3` are still forward notes.

---

## 5. Where to start

**The live site is v0.39.0** (data 0.33, schema 0.19), released 2026-10-09: the Werewolf and the Vampire to `0414` and `0413` (195–202), the rolled Stat Point pool a box (198), grenades as printed, and GM mode through S10c still switched off (173), which Ken and Scott open with `?gm=on`. Before it, v0.38.0 (2026-10-08): powers with ranks and **Raise a Power** (194). W59 is still open, so 164's re-focus doesn't yet tell a screen reader the new number. Next: W59. W60's last item waits on a typeset pass.
Ken alone: F9, F12, F32 and **W38's plan** (`plans/two-tabs-one-character.md`,
TQ1–TQ3), and **W29's plan** (`plans/gm-mode.md`, GQ1–GQ21; Scott answered the questionnaire and sent Codex v2 on 2026-10-02, which reordered it to the cast, the Codex and the fight first; Deighton's answers are still to come). Each session is built from a work order in `plans/gm-mode/`: **S1 (CRANK rep, 169) is merged** (#111, unreleased); **S3a (the table file, 170–173) is merged, switched off** (#113); **S8a (the cast: the record, the stat block, the Cast tab, 174–176) is merged, switched off** (#115, after one fix round). S8 was split: **S8b (interactions, affiliations as text, the crew's view: 177–179) is merged, switched off** (#117, after one fix round). S9 is split: **S9a (the pack file, its storage and import, and a Threats tab whose Use copies an entry into the cast: 180–182) is merged, switched off** (#119, after one fix round); **S9b (the builder: the cast member's page reads the pack, 183–185, pack schema 0.2) is merged, switched off** (#121, after one fix round); **S9c (the real Codex pack, built from the mirror with an id ledger, and apostrophes folded in name matching: 186–187) is merged, switched off** (#123, after one fix round) (`plans/gm-mode/S09c-codex-pack.md`; the pack and its ledger are in the private repo, and GQ22 waits on Scott). **S10a (encounters: who goes when, Health and Pain, Conditions and Reset: 188–190, table schema 0.5) is merged, switched off** (`plans/gm-mode/S10a-encounter.md`, #126, after one fix round); **S10b (the hit: armor, Shock, Massive, At Zero and Dying for a row, traits as reminders: 191–192, table schema 0.6) is merged, switched off** (`plans/gm-mode/S10b-hit.md`, #128, after two fix rounds; GQ24 and GQ25 wait on Scott); **S10c (the encounter's end: a wrap-up that keeps survivors, writes the fight to the cast and names the wear die: 193, table schema 0.7) is merged, switched off** (`plans/gm-mode/S10c-encounter-end.md`, #130, after one fix round; GQ26 waits on Scott). S10 is done but for the Encounter Design worksheet. **S5a (sessions, the Campaign Journal, threads and Next session: 203–204, table schema 0.8) is merged, switched off** (#138, after two fix rounds; GQ27 waits on Scott). **S5b (the close-out and the award log: 205–206, table schema 0.9) is merged, switched off** (`plans/gm-mode/S05b-close-out.md`, #141, after one fix round; GQ28 waits on Deighton): IP at 5 an hour to those present, the Milestone Point, the off-screen job, the arc reminder, the award log, and *IP so far* on the Sessions tab. Nothing reaches a character file until seats and dispatches exist (S3b, S2). **S13a (the Screen: Conditions, the Codex and the book's quick reference on one searchable tab) is drafted** (`plans/gm-mode/S13a-screen.md`, Decision 207 reserved), for Ken's approval; printing is S13b (W84). What Scott's use of the Encounters tab turns up can still reorder what follows it. v0.37.0 carries GM mode switched off, so Scott can use the cast and the Codex pack with `?gm=on` meanwhile. GQ6's block session (TOL and WILL, 175 reopened) waits on Scott's answer for WILL. GM sessions merge to `main` switched off (`FEATURES.gm`, 173), turned on in a browser with `?gm=on`, and releases go on as usual. The wishlist: W39, W54 and W55.

**Waiting on others:**
- **Deighton:** one grouped question — F23, F24, F25, F26, F30, F31, F34 and F36 — plus
  W39's two halves and GQ28 (what an off-screen Legendary CRANK job pays); with **Scott**, F37 (can CRANK rep go below zero?), and F38 and F39 (what Werewolf and Vampire Base Powers buy); and, Deighton's alone, F41 (is the Upyr's Built to Last a creation pick?). Each flag's stub and question are in `SCHEMA.md` §5.
- **Scott:** the print plan's PQ1, PQ2 and PQ4 (the display font's licence, reusing his artwork, the Health Level "Active" tab), and whether the four inscribed Cantrips are TN 8 (the Book of Known Spells) or keep TN 7 (Magic). His TOL rewrite is in 0200 and 0400.

**Ken's CRB fixes are a plan now: `plans/crb-catch-up.md`** — the sheet checked
against every CRB v4 chapter on 2026-10-01, item by item, with the file and
heading each one goes under, what's already done in the book, the questions
that block text, and every Cyborg mention to cut. The app follows the answer
in every ⚖ item. It was re-ticked against the 2026-10-07 mirror.

**The book is ahead of the sheet: `plans/crb-v4-sync.md`.** Ken and Scott
renumbered the CRB to four digits (`054` is now `0540`; the mapping is in
`log/2026.md`, 2026-10-08). P0 and P2 (powers with ranks, 194) shipped in
0.38.0. **P3 and P3b, the Werewolf to `0414` with its Major Milestones, P1,
the small content, and P4, the Vampire to `0413`, are built, unreleased, for
0.39.0** (195–202). Next: **P4b**, the Vampire's Major Milestones, on P3b's
engine, in its own session, with W72 (learning an archetype power in play);
then P5, Advancement. W69 (gear modifiers while
worn) and W70 (a custom item folds when done) are on the wishlist.

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
