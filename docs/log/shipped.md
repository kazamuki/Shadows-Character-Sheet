# Shipped — the batch board

One row per merged batch, oldest first. **Append a row when a batch merges;
never revise one.** This is history, like `2026.md` beside it: the row says what
landed and which decisions it numbered, the session log says why and what it
cost. It moved out of `STATE.md` §2 on 2026-09-22 (Decision 101) — STATE had
hit its length cap carrying history instead of current position.

What's *not* done yet is organized by topic in `STATE.md` §3, not here and not
by batch number (Ken, 2026-09-12).

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
| — | PR #7 adversarial review | #19 | Decision 91 — machinery gaps closed, not player-visible |
| — | Weapons, Ammo & Armor (data) | #22 | 54 weapons/9 ammo/11 arrowheads/37 armor + five glossaries · Decision 92 |
| — | Magic — archetype-independent half (data) | #22 | 96 spells across 5 domains/4 tiers, Spellcraft rules as reference text, Enchantment/Alchemy materials · Decision 93 |
| — | Print sheet — visual redesign | #23 | Blank-print + Notes-clipping bug fixes; case-file front page, Pain Level bands, two-panel Skills, Scott's real frame/texture assets · Decision 94 |
| — | CRB mirror re-pull + combat plan | #24 | Mirror refreshed and extended, F16 closed, `plans/combat-and-conditions.md` |
| — | Conditions (combat plan Session 2) | #25 | Catalog, schema 0.8, Pain folding, Skill Check penalties, sheet + print · Decisions 95–96, F20–F22 |
| — | Design-team rulings | #25 | F1, F2, F14, F17, F20–F22 and the stat-curve flag closed; new skill = 25 IP; stats past 10 +1 per 5 · Decisions 97–98 |
| — | Taking a hit (combat plan Session 3) | #26 | `hlState`/`armorState`/`resolveHit`/`applyHit`, the Take a hit panel, Massive levels on every HL track · Decision 99, F23 |
| — | Loadout & recovery (combat plan Session 4) | #28 | Catalog pickers + Buy, weapon lines, worn/upgrades/wear/repair, Rest, Focused Healing, Turn Reset, print armor · Decision 100, F24 |
| — | 0.14.1 build fix | #30 | Print-media build fix; v0.13.0/v0.14.0 had rendered blank on the demo site |
| — | CI onto Node 24 | #32 | Every action bumped; `deploy-demo` gains a manual trigger (dry run on a branch, re-publish on a tag) |
| — | Wishlist + board archive (docs) | — | `WISHLIST.md` (`W` ids) · this file · Deighton's TOL ruling queued · superseded decisions marked, load-bearing table, the house rule · Decisions 101–102 |
| — | Combat cleanup (TOL, Natural Armor, Nanomed) | #34 | TOL = INT/BOD/COOL; `naturalArmor()` in the hit resolver and print Nat; Nanomed Kit per 054; `migrate()` drops junk held entries · Decisions 103–105, F25 |
| — | Magic tables + wishlist pass | #36 | Cascade and Aberration tables, the Arcanist's TOL Spent tracker, the combat plan closed · W7, W11, W12, W14, W18 · Decision 106 |
| — | Magic on the sheet, Session 1 | #38 | Plan doc (M1–M10, MQ1–MQ3); the Grimoire reads the 96-spell book, Mastery by IP, Spell Power, Link to the book; schema 0.9 · Decision 108 |
| — | Deighton's magic rulings (docs) | #40 | MQ1–MQ3 and Spell Attack answered; Drained's last two answers · Decision 109 |
| — | Magic on the sheet, Session 2 | #41 | Aberrations on the character (Record it, Drained, Phantom Pain), Spell Attack, the Magic reference panel; Unique Aberrations synced to 041 · Decision 110 |
| — | Magic on the sheet, Session 3 | #43 | Starting spells on the Character Points step; the spell picker becomes a modal (`openModal`), shared with the sheet; the magic plan closed · Decision 111 |
| — | Martial Arts grid fix + wishlist pass | #45 | The style picker spans the Skills grid, with a mutation-tested guard (W19); W19–W26 added, W26 decided as a Done button |
| — | Wishlist pass + F11 (app 0.20.0, data 0.15) | #47 | Take a hit in a modal, the picker's row click/dimmed rows/sticky search/Done, skill stat icons, Trackers in two columns with Pain-banded HL, jump bars on Loadout and step 7; Quick Study's Intuition skill prerequisite; STATE trimmed · W1, W5, W6, W10, W20–W26 · Decisions 112–114, F11 |
| — | Scott's magic pass + the GM's Cascade (app 0.21.0, data 0.15) | #49 | Magic data synced to Scott's finished chapter and appendices; the Cascade panel gives the GM's instruction and opens one Aberration picker with every Aberration's text; AP is Armor Piercing · W27 added · Decisions 115–116 |
| — | The wishlist session (app 0.22.0, schema 0.10, data 0.16) | #51 | Vitals popovers, the catalog browser, a hit that lands, weapon mods and rounds, the equipment catalog (Gear + Magic shops) with counted gear, Main as the fight view · W2, W3, W4, W13, W15, W16, W17, W27 · F26 opened, W28 added · Decisions 117–122 |
| — | What's new (app 0.23.0) | #53 | The release notes in the app, generated from CHANGELOG.md (v0.10.1 on) by `npm run changelog`; home-screen line, sheet menu and footer; one quiet Updated line for a returning player · Decision 123 |
| — | Whole-app audit + its first session (app 0.24.0, schema 0.11, data 0.17) | #56 | The 2026-09-24 audit (A4–A12, B11–B19, C4–C16, R1–R13) and its plan (S1–S7, AQ1–AQ10); character files as untrusted input with a hostile-file test, load findings until dismissed, option powers, a NYTE City intake number and a replace guard at Import/New/Lock, Hardcore Parkour ruled · Decisions 124–129, F27 |
| — | Audit session S2: the docs diet (docs only) | #58 | Decisions as short records with what they rejected, and the load-bearing fourteen backfilled; change tiers; one orientation path, with retired text in `log/archive.md`; every flag numbered (F28–F32) and guarded; Ken's CRB fixes in STATE · A4, A5, A7, C10, C11 · Decisions 130–132 |
| — | The TAG (app 0.24.1, schema 0.12) | #59 | A character's permanent number is its TAG, shown as itself; 0.24.0's NCR- numbers keep their twelve characters; the replace guard reads the saved slot through `migrate()` · W31 added · Decision 133 |
| — | Audit session S3: the Professional as data (app 0.25.0, data 0.18) | #61 | Focused Skills as ids, a category pick and an all-skills price, read by one generic reader; the Mercenary's pick, the Focused starting cap, Jack's price through rank 4; a locked character's missing pick on Loadout; two generic panel types; the scaling table tested against 041 · A8 (Professional half), B12–B14 · F33, W32 added · Decision 134 |
| — | Audit session S4: read it or label it (app 0.25.1) | #63 | Every data key read by code or named as text, with a key guard and an S6 list that can only shrink; formulas and cross-references as numbers (`{ stat, times, plus }`, `dataPath`); no archetype, discipline or panel id in engine or UI code; fields restating the code deleted; Major Milestone details shown; the next Milestone unlock named; `tools/outputs.mjs` for Decision 68's diffs · A8 (Arcanist half), A9 · W33 added · Decision 135 |
| — | The spell catalog and a spell's forms (app 0.26.0, data 0.20) | #64 | CRB mirror re-pulled after Scott's edits; the catalog matches the whole Book of Known Spells (125 spells, Duration, every `[X]` given its number); a spell names the Disciplines it can be made with, and another form's TH and time come from the Enchantment table; the Discipline filter; the shop links every spell it names; R14 checks the catalog against the book · W34–W37 added · Decision 136 |
| — | Audit session S5: tooling (app 0.26.1) | — | One release workflow a cloud session can run, notes from the CHANGELOG, both files attached; `npm run bump`, `release:prep`, `release:check`, `test:fast`, `phone-check`; the fonts embedded, so no network request; a SessionStart hook and four procedure skills; the dev server on loopback · A6, C7, C12, C14, C15 · Decisions 137–138 |
| — | Audit session S6a: rules a tap away (app 0.27.0, data 0.21) | — | Tags, stat scores and rules text read out on hover or tap (one tip primitive, `Engine.glossary`, `statReading`); How a check works, Lineage, the lore in the wizard, and the whole Magic reference; Ammo in the equipment catalog; `notice()` and `askFirst()` replace every `alert()` and `confirm()`; S6 split into S6a/S6b/S6c · A10, C5 · Decision 139 |
| — | Audit session S6b: the header (app 0.27.1) | — | Two thin rows at every width: the name with ⋮ and theme, then the tabs in one line that scrolls sideways (active tab in view, fades, mouse wheel); the prefix goes on a phone and a long name ends in "…"; un-sticks on a short screen; `phone-check` passes all three widths and probes a long name · B19 · Decision 140 |
| — | Audit session S6c: the roster (app 0.28.0) | — | One `localStorage` entry per TAG, draft through locked; Home lists every character with Open, Export and Remove and marks changes no file holds; Import and Lock add, not replace; the 0.27 slots migrate in; a refused save stays on the page · R10 · W38 added · Decision 141 |
| — | Audit session S7: structure (app 0.28.2, schema 0.13) | — | A Professional's free advantage is `source: "natural"`, with the step migrating the undo history too; binders beside their renderers (`app.js` 1,220 → 295 lines); history banners and a no-op gone, the engine's exports grouped by domain; the load check names orphaned weapons, armor, gear, spells and specializations · A11, A12, C6, C8, C9 · Decision 142 |
| — | Warding by kind, Martial Arts styles on the sheet (app 0.29.0, data 0.22) | — | Elemental, Spirit and Aether replace the Magical damage type; three Wardings and Self-mending as armor upgrades; Gear's one Warding retired, still answering all three where installed; the Skills tab shows the styles chosen, with bonuses, and lists every style; the key guard follows `optionsFrom`; W38 planned · W28, W33 · W39 added · Decision 143 |
