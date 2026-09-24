# Archive: text retired from live documents

Kept verbatim, **never edited**. Each section says where the text came from,
when it left, and why. It's history, like `2026.md` beside it: true as of the
date on its heading, and never updated to match the present. Nothing here is
an instruction. For what's current, start at `STATE.md`.

Audit A4 and C10 (2026-09-24) found these passages restating history inside
documents a cold session reads for the present, where they drifted or shipped
to players. They moved here in the audit plan's S2 (Decision 132) so that
what was done, and why, stays findable in one place.

---

## 1. `SCHEMA.md` §5: the notes on closed flags (as of 2026-09-24)

§5 now opens with one line naming each closed flag and its decision. This was
the preamble it replaced.

Resolved in Phase 1: ~~F3~~ (skill IP cost = 5× current rank; Focused Skills 3×),
~~F4~~ (v4 uses Pain Levels at 2+/5+/8+ HL lost; −1 Skill / −1 Essence die / −5%
Breaker per level).

Fixed in Phase 2 (data): five skills referenced stat id `BODY`, which doesn't
exist in the catalog (`BOD`) — Heavy Weapons, Martial Arts, Melee, Acrobatics
(synergy) and Athletics (primary). Corrected in `shadows-data.js`; the engine
now also tolerates legacy aliases (Decision 22). F8 needs no code change when
ruled: the wizard reads `statPoints` off the power-level entry, so the ruling
is a four-number data edit.

Resolved in the CRB v4 content pass (2026-08-29): ~~F10~~ — both halves closed.
**The flag itself outlived the work by four days.** The renames landed on
2026-08-29 and the docs recorded F10 as closed, but `skillsFlags.flagged` stayed
`true` in the data and kept rendering a Design flag to players for finished
work. Cleared 2026-09-02 (Batch 1) — the block was removed rather than set to
`false`, because dead data that looks live is the defect class Batch 1 exists to
close. Closing a flag is now two edits, not one: the docs *and* the `flagged`
field.
`occult-lore` and `survival` now exist in the catalog, and the Professional
subtype references were renamed to match ("Occult" → "Occult Lore", "Handgun" →
"Handguns"). Focused-skill matching is by **name**, so those two had to move
together. **F5 is three-quarters closed**: Field Medic now names the catalog's
"Medical", Combat Paralysis' text is no longer ambiguous, and Poverty's Max Rank
is ruled at 3; only Cyber-Prophetical still carries `flagged: true`, and it
waits on the Cyborg rewrite (F6).

~~F15~~ closed the same day it opened: Ken confirmed Tracking is **INT/EMP** — the
CRB's "(INT / INT)" was a slip made while correcting Occult Lore and Survival off
their derived-attribute synergies — and corrected the CRB. The data had carried
INT/EMP all along, so nothing changed but the flag.

~~F16~~ closed 2026-09-22: Ken corrected Hemophiliac in the CRB to call for a
**Medical** Skill Check (both mentions), and the data entry was re-synced to
match and its flag dropped. Text-only — no computed value or available choice
moved, so no `gamedataVersion` bump (Decision 68).

Sixteen objects in `shadows-data.js` carry `flagged: true` as of 2026-09-22
(a recursive count: sixteen, plus F20–F22 opened by the Conditions session,
minus F1, F2, F14, F17 and F20–F22, closed by Decisions 97–98, plus the
three F23 entries opened by the hit resolver, Decision 99, plus F24 on
`damageRules.whileDying`, Decision 100, plus F25 on `naturalArmorRules`,
Decision 104).

~~F1~~, ~~F2~~, ~~F14~~ and ~~F17~~ closed 2026-09-22 on a design-team ruling
(Decision 97). F1/F2/F17 confirmed what the app already did; F14 moved a price.
~~F20~~, ~~F21~~ and ~~F22~~ closed the same day (Decision 98), hours after the
Conditions session opened them; so did the unnumbered stat-curve flag. `tests/docs.test.mjs` is what keeps the table below honest, not this
sentence.

~~F11~~ closed 2026-09-23 (Decision 113): 041 now asks for the Intuition
**skill** at Rank 1, and Quick Study's data follows it.

~~F27~~ opened and closed 2026-09-24 (Decision 129). Hardcore Parkour asked for Cat Like Balance, an
Advantage culled from an earlier version. Deighton ruled that it becomes Acrobatics 4, and that Time Sense goes.

---

## 2. `SCHEMA.md` §6: the roadmap (as of 2026-09-24)

The build's phase-by-phase roadmap, from before the batch board existed.
`log/shipped.md` has been the record of what shipped since Decision 101, and
`plans/` holds what's planned. The last paragraph describes the workflow from
before the repository, which no one follows now.

- **Phase 0 — Schema** ✅
- **Phase 1 — `shadows-data.js`** ✅ — contains: 8 stats + modifier curve,
  3 derived attributes, resources (Health/Pain Levels, Luck w/ spend costs,
  Çredits, SFR, Exhaustion), 4 power levels, 34 skills (10 combat / 10
  utility / 14 general — **36 as of Decision 55**), 57 advantages, 30
  disadvantages, 5 archetypes
  (Arcanist draft, Professional draft w/ 7 subtypes, Werewolf draft w/
  Trueborn origin, Cyborg tbd, Vampire tbd), 5 minor + 25 major milestones,
  IP rules, creation flow. 13 flagged items carried `flagged: true` inline
  (11 as of Decision 55).
- **Phase 2 — App shell + Creation Wizard** ✅ — `index.html`, single file,
  no build step. Three-pane layout: Intake Ledger step rail · step panel ·
  live Vitals rail (TOL/WILL/SAN/HP/pools recompute on every input). Full
  8-step flow: power level (F8 flag surfaced) → identity → stat roll +
  allocation → archetype (Arcanist focus roll/allocation + aberrations;
  Professional subtype/required-stat checks/focused-skill picks/natural
  advantages; Werewolf stat bonus + advantage-purchase block) → history →
  skills (check preview per row) → CP (disadv/adv, LUCK, Arcanist
  disciplines, boosts with per-target Max Boost ledger) → review & lock →
  `<name>.shadows.json` export. Draft autosave to localStorage with resume;
  import with gamedataVersion + missing-id checks. Engine is pure and
  isolated between `/*ENGINE-START*/` / `/*ENGINE-END*/` markers — 43 unit
  tests + 29-assertion jsdom E2E pass.
- **Phase 3 — Sheet & Session Tracking** ✅ — locked characters land on a
  live sheet (left rail becomes section nav: Sheet · Trackers · Progression ·
  Session Log · Loadout & Powers · Notes; Vitals rail switches to a condition
  readout: HP/Pain/SAN/LUCK/SFR/Ç/IP/MP). **Sheet:** identity, stat + derived
  grids, trained-skill tables with full check breakdowns (rank + primary +
  synergy − pain, reason shown inline), untrained reference, adv/disadv,
  archetype reference. **Trackers:** damage with per-HL boxes and Pain Level
  card (skill/Essence/Breaker penalties), SAN loss, LUCK with data-driven
  spend actions (Boost −2 / Explode −3) and undo, generic archetype tracker
  panels (SFR, Exhaustion, Tolerance Load, Blood Pool w/ manual max),
  Çredits with transaction ledger, manual adjustments ledger. **Progression:**
  IP grant/spend/undo with journal, per-target costs computed live, focused-
  skill 3× detection (plural-tolerant name matching vs F10), learn-new-skill
  flow (F14 flagged), Milestone Points (session-derived + manual), Minor/Major
  pick lists with prerequisite chips and the Improved roll prompt.
  **Sessions:** log form (auto 10 IP overridable, MP toggle, LUCK refresh),
  history with delete. **Loadout:** editable weapons/gear tables + generic
  archetype panels (rankedList disciplines, free-entry Grimoire/augments,
  focused-skills list, Tweak text, Werewolf form toggle). Active sheet
  autosaves to localStorage and resumes from Home; imports migrate 0.2 → 0.3
  with versionCheck (now also milestone-id + IPE/journal consistency).
  Engine still pure between markers — 58 engine unit tests, 46-assertion
  sheet E2E, 12-assertion wizard→lock regression smoke, all passing (jsdom).
- **Phase 3.1 — Sheet UX + Iconography** ✅ — locked sheet converted from a
  single scroll to a nine-tab interface (Decision 30); the creation ledger
  collapses on lock and a horizontal tab bar takes over. New `shadows-icons.js`
  module (Decision 31): brand stat set (11 icons, `currentColor`, REF/Hand
  background bug fixed — Decision 33) + free-to-use Lucide UI set (ISC) for
  condition cards and tab glyphs. **Main** rebuilt as a full-width command
  console (Decision 32): condition strip + Stats/Derived beside Combat
  (trained + untrained) + Weapons quick-ref, Vitals rail hidden on Main only.
  Stat/derived grids and the Vitals rail are now icon-forward. No schema bump;
  engine untouched (Decision 34). Verified via headless render across all tabs,
  desktop + mobile + the <900px stacking breakpoint.

- **Phase 3.2 — Sheet fit & finish** ✅ — full-width sheet on every tab with a
  slim horizontal vitals bar and an on-demand Vitals flyout drawer (Decisions
  35-37); four-sphere stat columns on Main with derived/SAN de-duplicated (36);
  sticky in-header nav reading "Shadows // <name>", the registry banner removed,
  Home/Export folded into a header overflow (kebab) menu, registry/version moved
  to a collapsible footer (38-40); number-entry caret fix (41); LUCK refresh
  confirmed (42); date-input theming (43); Skills unified into one aligned table
  with per-skill "?" descriptions (44); Traits and Progression made collapsible
  (45-46). No schema bump; engine untouched (47). Headless jsdom harness at 61
  assertions; ready to present to Deighton.

- **Phase 3.3 — Audit trail, undo & admin mode** ✅ — character schema → **0.4**
  (Decision 53). New unified **audit trail**: every play/admin action routes
  through one `commit()` wrapper into `ch.audit`, with last-in-first-out **Undo**
  (Decisions 48-49); pure-engine `diffChar`/`recordAction`/`undoLastAction`
  (arrays diffed as append/removeAt/set). Surfaced as an **Activity Log** section
  under Session Log with inline + header undo and an admin-only clear (50). New
  **Admin mode** (kebab toggle + sticky ADMIN banner) free-edits identity, power
  level, archetype, stats (base+IPE), skills (rank+IPE/add/remove), adv/disadv,
  and LUCK bonus — bypassing caps/pools, every edit logged and undoable; archetype
  change is guarded and wipes `archetypeChoices` as one step (51). Main **Health**
  card becomes a numberless **HL segment strip**; **TOL/WILL/SAN derivations**
  shown in the Vitals drawer and behind a "?" on the Main Soul cells (52). The two
  ad-hoc undo buttons retire in favour of the global undo; LUCK's becomes a
  forward "Regain (+1)". App label → "phase 3.3". Engine no longer byte-identical
  — harness needs the new assertions + a rerun (53). Validated here by 37 engine
  diff/undo unit assertions, 8 migrate/record/undo assertions on the real engine,
  and a 32-assertion jsdom render+interaction smoke across all tabs, admin mode,
  the activity log, and undo — all passing, zero runtime errors.

- **Phase 3.4 — Repository restructure** ✅ — the app becomes a maintainable
  git repository (Decision 54). Sources split under `src/`; `index.html` is a
  shell; `tools/build.mjs` produces the single-file release; CI runs the suite
  on every push and attaches the built file to tagged releases. Test suite
  formalized at **20 passing assertions + 2 tracked `todo`s** across three
  suites: engine units (no DOM), jsdom boot/wizard/all-tabs smoke, and
  architecture guards. The two `todo`s are confirmed defects written as failing
  tests so they flip green when fixed — **A1** (Arcanist aberrations render
  twice; re-verified 2026-08-02 as 6 `[data-spec]` + 6 `[data-aber]` buttons)
  and **B7** (new: `validate("stats", ch)` throws instead of reporting when the
  character has no power level, `engine.js:574` as of Decision 60). Also re-confirmed: **B2** is
  worse than recorded — `MOVEMENT→"MA"` and `ATTRACTIVENESS→"ATTR"` both resolve
  to ids that do not exist (real ids are `MOB` / `MAG`). No schema bump; engine
  untouched. *(B2 closed 2026-09-02 by Decision 59 — and it was worse again
  than this line records: the bad alias did not merely fail to resolve, it
  threw.)*

- **CRB v4 content pass** ✅ *(2026-08-29 — a data merge, not a phase)* —
  Skills, Advantages and Disadvantages re-merged from CRB sections 042/043/044
  (Decisions 55-58). Skills 34 → 36 with flavor lines throughout; every
  adv/disadv id preserved; three disadvantage point values changed; game data
  → **0.3**. Closed **F10** outright and three quarters of **F5**; surfaced
  **F15** (Tracking INT/INT, confirmed a CRB slip and closed the same day) and
  opened **F16** (Hemophiliac's First Aid reference).
  Also closed a real gap in the test suite: the stat-id guard looped over a
  `synergy` array the data does not have, so it had never checked
  `synergyStat` — the field the engine actually reads, and the one carrying
  both invalid stats this pass turned up. No app code changed; the suite held
  at 20 passing / 2 todo / 0 failing throughout.

- **Quick-win pass** ✅ *(2026-09-02 — three audit findings, not a phase)* —
  **B2**, **B4** and **B5** closed as Decisions 59-61: the two dead stat
  aliases now resolve (and `normStat` verifies its target, so the class of bug
  cannot return silently), the superseded `Engine.undoIP` is deleted, and the
  review step numbers itself off the data. Engine and UI both touched; no
  schema bump, no data change, no id moved. Suite **28 passing assertions + 2
  tracked `todo`s** — four new guards, each mutation-tested against the
  pre-fix code to confirm it actually fails there. **A1** and **B7** remain the
  two `todo`s.

- **Batch 1 — Engine totality & CRB conformance** ✅ *(2026-09-02)* — the first
  batch of the debt-ledger plan. Decisions 62-68. **B6, B7, B8, B9, B10** and
  **B3** closed; the stale **F10** flag cleared. The engine's promise from
  Decision 22 is now a written contract with a guard behind it, `migrate()`
  guarantees its own completeness, and `tests/rules.test.mjs` turns the CRB's
  worked examples into build-breaking assertions. Suite **45 passing + 1 tracked
  `todo`** across four files — up from 26 + 2. No schema bump and no
  gamedataVersion bump (Decision 68): sixty computed outputs were diffed before
  and after and every one was identical. **A1** is now the only `todo`, and it
  closes with A3 in Batch 3.

- **Batch 2 — App voice & status copy** ✅ *(2026-09-02)* — Decisions 69-73.
  The app stopped narrating its own build state. Ten leak sites closed across
  `app.js`, `engine.js` and the data; `flagNote` can no longer render;
  player-facing state copy consolidated into one `appCopy` block, so the voice
  is a data edit. `docs/VOICE-APP.md` records the city-voice / tool-voice split
  and the test for which you are in — *is the player stuck right now?* Suite
  **51 passing + 1 `todo`**, with `tests/voice.test.mjs` rendering the whole
  app and reading every string a player can see. No schema or gamedataVersion
  bump (Decision 68): no computed value moved.

- **Batch 3 — Selection & constraint system** ✅ *(2026-09-03)* — Decisions
  77-81. `picks` / `excludes` / `requires` built once and hosted by three
  things: advantages, disadvantages and skills. All ~15 entries Decision 58
  named are encoded, plus Martial Arts styles. **A3** retrofitted archetype
  specialization onto one model, which retired the Arcanist / Professional /
  Werewolf branches in `renderArchetype` and the aberration-only branch in
  `renderShArchetype` — **A1 and A2 closed as a side effect and the suite's
  last `todo` flipped green.** Character schema **0.4 → 0.5** (one
  specialization array replaces three fields, with a `migrate()` step);
  game data **0.3 → 0.4** (fifteen entries now demand an input they did not
  before); app **0.5.0 → 0.6.0**. A stale-mirror defect in the Professional
  natural-advantage pool was found and fixed in passing (Decision 81).

- **Batch 3a — the ledger attention state** ✅ — `renderLedger` marks a passed
  step done when it has no *errors*, ignoring warnings entirely, so a player who
  walks past Skills with ten unspent points gets a green tick. That is shipped
  behaviour for every step and every player, not an Educated problem. A third row
  state — done / active / needs attention — driven by warnings on a step already
  passed, plus a callout linking back. The rows are already clickable and
  `validate()` already emits the warnings. **It goes first because it is the
  thing that makes `grants` safe to land.**

- **Batch 3b — `grants`** ✅ *(2026-09-05)* — the other half of Decision 58:
  Educated (+10 Skill Points/rank), Hard to Kill (+1 max HP per Health Level),
  Lucky / Unlucky (LUCK spend costs) and Long-Lived (Milestones), via a new
  `grants` array consumed by `skillPool`/`health`/`luckState`/`milestoneState`
  (Decision 87). **Educated needed a wizard-flow ruling** — bought at step 7,
  it grows the step-6 pool retroactively — and 3a settled it by construction:
  surfacing the unspent points and letting the player go back means the points
  are usable at creation, and the app says so rather than reopening a step in
  silence. Long-Lived's rank-stacking ambiguity flagged rather than guessed
  (F17, Decision 88). Game data **0.4 → 0.5**; app **0.7.0 → 0.8.0**.

  **Thick Skin is deliberately not in 3b.** It grants Natural Armor, the armor
  design is still in flux, and **four separate places in the data already grant
  Natural Armor in prose** — Thick Skin, the Iron Shirt Martial Arts style, an
  archetype effect, and an archetype benefit. Four sources for one quantity is
  the Decision 66 shape (*promote it to a number, read it, display it*), so
  Natural Armor becomes a real derived value with its own reader when the design
  lands — not a Thick Skin special case bolted on early. Until then it ships as
  reference text, like every other un-modeled rule.

- **Decompose `src/ui/app.js`** (Decision 54's deferred refactor) ✅ — done on
  `refactor/decompose-app-js`, ahead of 3b rather than after it (Decision 86).
  Then Cyborg (F6) as data rather than a fourth special
  case. Clear **F8** on its own track — it is a four-number data edit and the
  only wizard-blocking flag.

- **Magic on the sheet** — planned 2026-09-23 in
  `docs/plans/magic-on-the-sheet.md`: the Grimoire reads the book (Session 1 —
  **done**, Decision 108), then acquired Aberrations and a Magic reference
  (Session 2 — **done**, Decision 110), then starting spells in the wizard
  (Session 3 — **done**, Decision 111). **The plan is closed.** Its rules
  questions (`MQ`n) all went to Deighton and were answered (Decision 109).

- **Conditions, damage & armor** (F18's engine half) — planned 2026-09-22 in
  `docs/plans/combat-and-conditions.md`: Conditions first (Session 2 — **done**,
  Decisions 95–96), then hit resolution through armor (Session 3 — **done**,
  Decision 99), then Loadout pickers and recovery actions, including the Turn
  Reset helper (Session 4 — **done**, Decision 100), then the cleanup session
  (**done**, Decisions 103–105: Deighton's TOL ruling, Natural Armor as one
  derived value with F25, the Nanomed Kit), and the Magic-tables side
  session (**done**, Decision 106: the Cascade and Aberration tables, and a
  TOL Spent tracker for the Arcanist). **The plan is closed.** Weapon mods and
  ammo went to `WISHLIST.md`. The plan holds the sequencing rationale and the
  open questions (`CQ`n).

**Session handoff protocol:** every phase ends with current files +
this document updated. Ken adds the latest versions to project knowledge.
A new session resumes with: *"Continue the character sheet build — Phase N.
Files are in project knowledge; read SCHEMA.md first."*

---

## 3. `meta.notes` in `shadows-data.js` (game data 0.3 to 0.17)

A single string in the game data, narrating each data version. It shipped to
every player inside the app and was read by nothing (audit C10). Kept whole
below; 0.5 and 0.15 were never described in it. From 0.18 on, what a version
changed is in the session log.

> Generated from WIP_NewIntroduction.md (authoritative) and REF files (fallback). WIP beats REF on conflicts. Skills, Advantages and Disadvantages re-merged 2026-08-29 from CRB v4 sections 042/043/044. 0.3 adds flavorLine/notes/styles to skills, adds two skills (occult-lore, survival), recategorises two (tactics -> combat, streetwise -> general), and changes three disadvantage point values -- so a character saved against 0.2 has a different CP grant under 0.3. 0.4 encodes the selection system Decision 58 specified: `picks` on fifteen adv/disadv entries and on Martial Arts, `creationOnly` on Long-Lived, and ids on the Martial Arts styles so a choice can be stored. Those entries now DEMAND an input they did not before, which is a change to a character's available choices -- the Decision 68 test for a bump. 0.6 merges the equipment chapter (`Gear.md`): weapons, ammunition, arrowheads and armor as new catalogs (54/9/11/37 entries), plus glossaries for weapon tags/features/mods and armor features/upgrades. New content a character's Loadout can now reference -- the Decision 68 test for a bump. 0.7 merges the archetype-independent half of `Magic.md` (Decision 93): `domains`, `spells` (the full Known-spell catalog), `spellTiers`, `spellcraftRules`, `enchantmentMaterialCategories`/`enchantmentTimeTable`, and `spellTagGlossary`, plus a rewrite of the Arcanist's `coreMechanic` description and Discipline text to match the corrected Spellcraft resolution (Rupture is per-roll and spends TOL directly; Exhaustion is the name for TOL at zero, not a separate accruing resource -- confirmed with Scott, 2026-09-20). The Origins subtype system stays out (still blocked on the archetype four-way comparison, STATE.md §3). 0.8 adds the Conditions catalog from `054_Conditions_and_Recovery.md` (Decision 95): `conditions`, `conditionRules`, `bodyLocations`. Agonized now raises Pain Level and Disoriented/Burning/Shocked take 1 off every Skill Check -- a computed value a character can observe, the Decision 68 test for a bump. Also in 0.8: learning a new skill after creation costs a flat 25 IP (`ip.skillIncreaseCost.newSkill`, Decision 97), up from the rank-1 price. And: stats past 10 follow the designers' curve (+5 at 11-15, +1 per 5 after, `statRules.beyondTen`) instead of +1 per point, only DeSynced's body-part picker is gone (Injured and Maimed only), and different Conditions' penalties cap at -8 (Decision 98). And: `damageTypes`, `damageCategories`, `damageRules` and the armor fields the hit resolver reads (coverage, RES classes, Tri-Weave's +10 INT, Headshot Defense's redirect) -- a hit now computes values a character can observe (Decision 99). 0.9 (Decision 100): `recoveryRules` (Natural and Focused Healing), the Field Repair die and upgrade rules on `armorRules` (quality order, `repeatable`), Self-Healing's after-encounter roll and the Dying check at Turn Reset -- new choices a character can observe (a rest proposes BOD per day, Self-Healing is asked after a fight). 0.10 (Decisions 103-105): TOL reads INT/BOD/COOL (Deighton, was INT/COOL/EMP), so every character's TOL can move; `naturalArmorRules` and `grants` of type naturalArmor on Thick Skin, Shake it Off, True Warrior (Iron Shirt) and Trueborn (Resilient Spirit), which a hit now reads (F25 stub); `recoveryRules.nanomed` (054's list, CQ12). 0.11 (Decision 106): the Cascade Table, the Aberration Table and the Appendix's Aberrations (`cascadeTable`, `aberrationTable`, `aberrationCategories`, `aberrationRules`, `aberrations`), and a TOL Spent tracker on the Arcanist that opens the Cascade panel -- a new tracker and new choices on the sheet. 0.12 (Decision 108): the Grimoire becomes a `grimoire` panel over the `spells` catalog, and `spellcraftRules` gains `spellPower` and `mastery` -- what an Arcanist's sheet offers changes. 0.13 (Decision 110): Aberrations carry the hooks the engine reads once one is recorded on the character (Drained `adjust` TOL -2, Phantom Pain `painLevels` 1, `aberrationRules.adjustFloor`), `spellcraftRules.spellAttack`, a `reference` panel on the Arcanist, and three Unique Aberrations synced to 041 (Aethereal Link reaches animals, Thaumaturgical Sight's +2 is for analyzing magic, Resonant Whispers drops charms) -- computed TOL and Pain can change. 0.14 (Decision 111): starting spells are chosen in the wizard. The Arcanist's scaling rows carry `startingSpellsRoll` (was the string `commonSpells`), and `spellcraftRules` gains `startingSpells` (TOL + that roll, TH capped at Evocation rank at creation only) and `castingPool` (the Grimoire marks a spell whose TH is beyond the Evocation pool) -- new choices at creation. 0.16 (Decision 120): weapon mods carry what the engine reads (`grantsTags`, `aimedAcc`, `damageBonus`, `onlyFor`/`notFor`), and `weaponRules` gives each rate of fire its rounds -- a weapon line's damage, tags and rounds can now change. 0.17 (F27, Decision 129): Hardcore Parkour's Cat Like Balance prerequisite named an Advantage culled from an earlier version, so the Milestone could never be taken. Deighton ruled its prerequisites are now 1 Major Milestone, Acrobatics 4 and Danger Sense 1 (Time Sense dropped) -- an available choice changes.
