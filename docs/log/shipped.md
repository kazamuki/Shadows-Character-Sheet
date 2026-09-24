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
