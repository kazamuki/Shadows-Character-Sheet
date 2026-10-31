# Index — where everything is

A lookup table, not a document to read. `STATE.md` tells you **what is happening**;
this tells you **where a thing is written down**. It exists because the decision
ledger passed eighty entries, and because the ids referenced everywhere — `A1`,
`B7`, `C2`, `F8` — are each defined in exactly one place that is not obvious.

The decision summaries in §3 are hand-written, one line each, and deliberately
lossy — they are for *finding* a decision, never for citing one. `SCHEMA.md` §4
is the text that counts.

**Starting a session:** `../CLAUDE.md` (how we work, and the hard constraints),
then `STATE.md` whole (where things stand), then here when you need to find
something. That is the whole orientation path (Decision 132). `SCHEMA.md` is the
authority and is never read front to back; §1 below says which section to open.

---

## 1. I'm looking for…

| I want to know | Go to |
|---|---|
| What's next, what's blocked, who can clear it | **`STATE.md`** §3 (§2 is what shipped work left behind; the board itself is `log/shipped.md`) |
| Why a past decision was made | `SCHEMA.md` §4 — find the number in §3 below |
| Whether a question is already settled | search `SCHEMA.md` §4's **Touches** lines for the thing it touches, then read that entry's **Rejected** and **Revisit if** (Decision 130) |
| What an id like `A1` / `B7` / `C2` means | §2 below |
| What an open flag `F8` is waiting on | §2 below, then `SCHEMA.md` §5 |
| The architecture, the shape of the game data, a character file or a table file (`.shadows-table.json`, `TBL-`) | `SCHEMA.md` §1, §2 and §3 |
| What a change must touch (docs, versions, decision, changelog) | `../CLAUDE.md`, *Change tiers* (Decision 131) |
| A multi-session plan — its sessions, open questions (`CQ`_n_, `MQ`_n_, `AQ`_n_), and why it's ordered that way | `plans/` — **open, Ken's CRB pass:** `crb-catch-up.md` (every CRB fix the sheet is waiting on, by chapter and heading, and the Cyborg cut). **Approved, built a session at a time:** `gm-mode.md` (W29: the table, its cast and its city, `GQ`_n_; its per-session work orders are in `plans/gm-mode/`) and `loadout-and-gear.md` (vehicles and worn gear: W69, W91, W107, W136, W137 as sessions L1–L7, `LQ`_n_, approved 2026-10-24; its orders, P14's shelved one as L6, are in `plans/loadout-and-gear/`). **Proposed:** `two-tabs-one-character.md` (W38, `TQ`_n_), `print-sheet-scotts-look.md` (Scott's export, `PQ`_n_), and `accounts-and-sync.md` (W138: Discord sign-in, sheets and tables online, joining a table; sessions N0–N6, `NQ`_n_; built after GM mode). **Closed, kept as history in `plans/archive/`:** `audit-2026-09-remediation.md` (the 2026-09-24 audit, `AQ`_n_), `combat-and-conditions.md` (Decisions 95–106), `magic-on-the-sheet.md` (Decisions 108–111), `custom-archetype.md` (Decisions 152–156, `XQ`_n_), and the two sheet-from-book syncs: `crb-v4-sync.md` (the 2026-10-07 mirror, passes P0–P5, `VQ`_n_, its work orders in `crb-v4-sync/`) and `crb-sync-2026-10-22.md` (the Enforcer, powers at creation, the Codex pack builder and three CRB guards against the 2026-10-22 mirror, passes Y0–Y4, `YQ`_n_, its work orders in `crb-sync-2026-10-22/`), and `sheet-wishlist.md` (the player sheet's wishes as sessions P1–P21, `WQ`_n_, its work orders in `sheet-wishlist/`; closed 2026-10-24 with P14 and P15 moving to `loadout-and-gear.md`). A log entry from before 2026-10-15 cites the first four at `plans/`, one from before 2026-10-23 cites the two syncs there, and one from before 2026-10-24 cites `sheet-wishlist.md` there |
| How a planned session gets built: the work order, its pre-flight, the conductor, the builder and the reviewer, and both prompts | `WORK-ORDERS.md`; the conductor's steps are the `run-a-work-order` skill (Ken, 2026-10-23: every plan, not only GM mode's) |
| An idea nobody has scheduled yet (`W`_n_) — UX, table feel | `WISHLIST.md` — open items only |
| A wishlist item that was built, and what it was before | `log/wishes-granted.md` — moved whole from `WISHLIST.md`, never edited |
| What shipped, batch by batch, and which decisions it numbered | `log/shipped.md` |
| What a past session cost, and what to watch for | `log/2026.md` |
| Text retired from a live document: the old phase roadmap, `meta.notes`, the closed-flag notes | `log/archive.md` — verbatim, never edited |
| A designer's ruling in his own words (the answers a flag, a wish or a book fix cites) | `reference/rulings-2026-10-10.md`: Deighton's answers to every open rules question, 2026-10-10; `reference/rulings-2026-10-16.md`: the effects sign-off (P18), Deighton's rulings on 13 Advantages and his notes for W130; `reference/rulings-2026-10-23.md`: vehicles and Powered Armor, two rounds (W91, W69), the second still open; `reference/meeting-2026-10-23.md`: what the 2026-10-23 design meeting settled for the sheet (natural attacks, two a round) |
| Whether a string is allowed to say that | `VOICE-APP.md` |
| Who the app is for, what sets it apart, the accessibility floor: product truth for design work | `../PRODUCT.md` — points back here and at `SCHEMA.md` rather than restating them |
| The screen's visual system: colour roles, type, layout, components, what to avoid | `../DESIGN.md` (screen only; the print sheet is `print.css` and its plan). `../.impeccable/design.json` is the same system in machine-readable form, for design tools |
| A CRB chapter by its old three-digit number (`054`, `041`, `Gear.md`) in a record | `log/2026.md`, 2026-10-08: the mapping to the four-digit files the mirror uses since 2026-10-07 |
| Whether the current WIP text already answers an open flag | `../private/crb/README.md` (a private submodule, Decision 167) — mirrors of CRB documents, **never edited here**; re-pull instead |
| What shipped in a release | `../CHANGELOG.md` — backward-looking only, in player voice |
| How to work on this repo at all | `../CLAUDE.md` |
| The commands and scripts (bump, release, test:fast, phone-check, dev server) | `../CLAUDE.md`, *Commands* |
| A procedure step by step: close a session, number a decision, open or close a flag, cut a release | `../.claude/skills/` (the rules they follow stay in `CLAUDE.md`) |
| How a release reaches players and the live site | `../CLAUDE.md`, *Working rhythm*, and `../.github/workflows/release.yml` (Decision 138) |
| What a PR body says, section by section | `../.github/pull_request_template.md`; what each tier must touch stays in `../CLAUDE.md` |
| How to report a security problem, or a conduct one | `../SECURITY.md` and `../CODE_OF_CONDUCT.md` (Ken is the contact for both) |
| The public accessibility statement: the goal, how it's checked, known limits, how to report a barrier | `../ACCESSIBILITY.md` (the design floor itself stays in `../PRODUCT.md`) |
| A finding by id (A1, B2, C3) | `audits/` — the dated audits; look the id up before working on it |

**The trap worth naming:** `CHANGELOG.md` never describes upcoming work, and
`log/shipped.md` is one line per batch. The *reasoning* for a batch — what it
contains and why it is split that way — lives in its plan in `plans/`, and in
its entry in `log/2026.md`.

---

## 2. Id registry

Each id is defined in exactly one place and referenced everywhere.

| Prefix | Means | Defined in |
|---|---|---|
| `A`_n_ | Architectural finding — a design that has drifted | A1–A3: `audits/2026-06-16_rev9-whole-app-audit.md` §1 · A4–A12: `audits/2026-09-24_whole-app-audit.md` §4 |
| `B`_n_ | Bug / correctness finding | B1–B10: rev 9 audit §2 · B11–B19: 2026-09-24 audit §5 |
| `C`_n_ | Carried note — real but not yet actionable | C1–C3: rev 9 audit §3 · C4–C16: 2026-09-24 audit §6 |
| `R`_n_ | Recommended practice — a proposal until Ken adopts it and it is numbered | 2026-09-24 audit §8 |
| `AQ`_n_ | A question the 2026-09-24 audit raises for Ken | `plans/archive/audit-2026-09-remediation.md` §5 |
| `GQ`_n_ | A question the GM-mode plan (W29) raises for Scott, Deighton or Ken | `plans/gm-mode.md` §9 |
| `TQ`_n_ | A question the two-tabs plan (W38) raises for Ken | `plans/two-tabs-one-character.md` §5 |
| `LQ`_n_, `L`_n_ | A question the vehicles-and-gear plan raises for Ken, and its sessions L1–L7 | `plans/loadout-and-gear.md` §5 and §3 |
| `NQ`_n_, `N`_n_ | A question the accounts-and-sync plan (W138) raises for Ken, and its sessions N0–N6 | `plans/accounts-and-sync.md` §5 and §3 |
| `XQ`_n_ | A question the custom-archetype plan raises for Ken | `plans/archive/custom-archetype.md` §6 |
| `PQ`_n_ | A question the print-sheet plan raises for Scott, Deighton or Ken | `plans/print-sheet-scotts-look.md` §6 |
| `CQ`_n_, `MQ`_n_ | Questions the combat and magic plans raised; all answered; the CRB edits they left (CQ5, CQ9, CQ12, CQ13) are in `plans/crb-catch-up.md` | `plans/archive/combat-and-conditions.md` §6 · `plans/archive/magic-on-the-sheet.md` |
| `VQ`_n_ | A question the CRB v4 sync plan raises for Ken (some for Deighton through him) | `plans/archive/crb-v4-sync.md` §4 |
| `YQ`_n_ | A question the 2026-10-22 CRB sync plan raises for Ken | `plans/archive/crb-sync-2026-10-22.md` §4 |
| `F`_n_ | Open design flag — a rules question the app must not answer | `SCHEMA.md` §5 |
| `D`_n_ | Shorthand used here for decision _n_ | `SCHEMA.md` §4 |
| `W`_n_ | Wishlist item — an idea, not a commitment; statuses live with the item, and its **Plan** line says which plan covers it | open: `WISHLIST.md` §1 · built: `log/wishes-granted.md` |

### Audit findings

| Id | What | Status | Where |
|---|---|---|---|
| `A1` | Arcanist renders its aberrations twice, both required | closed | Batch 3 · D79 |
| `A2` | The sheet's Specialization section can't see non-Arcanist picks | closed | Batch 3 · D79 |
| `A3` | Unify the two selection models — the actual fix for A1+A2 | closed | Batch 3 · D79 |
| `B1` | Stale copy — `flagNote` and roadmap text reaching players | closed | Batch 2 · D70–71 |
| `B2` | Two dead stat aliases; `normStat` did not verify its target | closed | Quick wins · D59 |
| `B3` | `levelsPerBOD` — an authoritative-looking knob the engine ignored | closed | Batch 1 · D64 |
| `B4` | `Engine.undoIP` was dead code with no caller | closed | Quick wins · D60 |
| `B5` | Review step number was hardcoded | closed | Quick wins · D61 |
| `B6` | Unlocked-draft import was a shallow merge; `migrate` left holes | closed | Batch 1 · D63 |
| `B7` | `validate` was not total — threw with no power level | closed | Batch 1 · D62 |
| `B8` | The two Pain Level floors were never surfaced | closed | Batch 1 · D66 |
| `B9` | The milestone cadence was stated twice, connected never | closed | Batch 1 · D67 |
| `B10` | An orphaned skill id crashed the review screen | closed | Batch 1 · D62 |
| `C1` | Sheet number inputs vs. the caret fix — forward note | **open** | if a field moves to live `oninput` |
| `C2` | Admin can't reach archetype-specific choices | **open** | easier now: one array |
| `C3` | `panelMax` / SFR display copy | **open** | re-read after F6 and F7 |

**From the 2026-09-24 audit.** Open unless marked; the plan session that would take each is in the last column. Full text in the audit.

| Id | What | Status | Where |
|---|---|---|---|
| `A4` | Orientation spread across eight docs; the untested ones drifted | closed | plan S2 · D132 |
| `A5` | The decision ledger is doing three jobs | closed | plan S2 · D130 |
| `A6` | Per-change documentation tax out of proportion to the change | closed | plan S2 · D131 (tiers) · plan S5 · D138 (scripts) |
| `A7` | Seven flags had no F-number; four were unasked Deighton questions | closed | plan S2 · F28–F32 |
| `A8` | Archetypes special-cased by id; Professional rules parsed from prose | closed | plan S3 · D134 (Professional) · plan S4 · D135 (Arcanist, Werewolf) |
| `A9` | Data fields that look like settings but aren't read (B3's class) | closed | plan S4 · D135 |
| `A10` | Merged content no player can see | **closed** 2026-09-25 (Decision 139) | plan S6a · AQ4 |
| `A11` | `notes: "natural"` doubles as a type marker | **closed** 2026-09-25 (Decision 142) | plan S7 · schema 0.13 |
| `A12` | UI split by render/bind, not by screen | **closed** 2026-09-25 | plan S7 · binders beside their renderers |
| `B11` | Mastering a spell trips `versionCheck`'s hand-edit warning | closed | plan S1 · app 0.23.1 |
| `B12` | The Mercenary never picks its fifth Focused Skill | closed | plan S3 · D134 |
| `B13` | Focused Skill Max Bonus never applied | closed | plan S3 · D134 |
| `B14` | Jack-of-all-Trades pays full price for every skill | closed | plan S3 · D134 |
| `B15` | Hardcore Parkour's prerequisite names a nonexistent Advantage | closed | → F27 → Deighton's ruling, D129 |
| `B16` | A character file could put markup on the page (Admin ids; numbers stored as text; crafted undo) | closed | plan S1 · D124 |
| `B17` | The Trueborn's Lunar Phase Blessing never renders | closed | plan S1 · D126 |
| `B18` | Import, New and Lock replace the saved sheet without asking | closed | plan S1 · D128 |
| `B19` | Phone: the sticky header covers 30% of the screen | closed | plan S6b · D140 |
| `C4`, `C13` | Import warnings vanished; the voice corpus read one archetype's sheet | closed | plan S1 · D125 |
| `C16` | Main's subtitle read a field removed in schema 0.5, so it never named the specialization | closed | with B18 · app 0.24.0 |
| `C10`, `C11` | `meta.notes` was a changelog shipped in the data; closed plans hosted Ken's open CRB fixes | closed | plan S2 · D132 |
| `C7`, `C12`, `C14`, `C15` | Fonts fell back offline; the dev server listened on every interface; releases built twice with generated notes; no fast test loop | closed | plan S5 · D137 (C7) · D138 (C14) |
| `C5` | Carried note: `alert()`s | **closed** 2026-09-25 (Decision 139) | plan S6a |
| `C6`, `C8`, `C9` | Carried notes: dead code, audit growth, orphans | **closed** 2026-09-25 (C8's undo half by Decision 142; its size half stays a watch: revisit past ~1 MB) | plan S7 · app 0.28.2 |

### Open flags

Full text in `SCHEMA.md` §5; who can clear each is in `STATE.md` §3.

| Id | What | Needs |
|---|---|---|
| `F5` | Adv/Disadv audit flags — three of four closed by the CRB v4 pass. Remaining: Cyber-Prophe… | Design (after F6) |
| `F6` | Cyborg rewrite (NCI tiers, Set Bonuses, Kicker Dice, TOL pressure) — ships as `status: "… | Design |
| `F12` | Minor Milestones pool sourced from REF (v3.5); WIP refers to an unwritten Advancement Sec… | Ken |
| `F19` | Cyborg install cost mechanism — Sanity erosion vs. temporary Health Level cost, still undecided (Scott unsure which) | Design |
| `F32` | Arcanist Major Milestones: bring in REF_CRB's, or wait for 0411? | Ken |
| `F37` | Can CRANK rep go below zero? Stubbed: it can, and reads Novice | Scott/Deighton |
| `F42` | Which damage Resistance answers: Thermal → Burning and Electric → Electric are mapped; no damage type is cold, so Freezing answers nothing, and no Resistance answers Elemental magic. Stubbed as written (Decision 219) | Deighton |
| `F43` | The TN and TH of the WILL Essence check that keeps a held spell (W87). Also: one check or one per spell, and whether no dice left (holds at the Evocation rank) leaves a 1-die floor. The prompt says the GM sets them; nothing is decided by the sheet (Decision 224) | Deighton |
| `F44` | What a rank of Educated bought after creation gives (its grant is creation Skill Points). The IP buy refuses Educated until it's ruled; Talented still offers it (Decision 227) | Deighton |
| `F45` | Which Skill appraises (Concierge's 1d4 kicker names none). Stubbed: left as the tweak's text (Decision 237) | Deighton |
| `F46` | (on Survival Instinct) Do kicker dice stack, and do two combine into the next die size up (Ken believes so, unconfirmed)? Stubbed: each kicker shows on its own, nothing combines (Decision 237) | Deighton |
| `F47` | Which kicker is "your Kicker Die" for Specialist and Make My Own Luck? Stubbed: no kicker grows or rolls twice (Decision 237) | Deighton |
| `F48` | Which damage type the book's untyped weapons deal (3 bows, 5 damaging grenades, the HRL-1 and HXC-1). Stubbed: untyped, the Loadout card says the GM rules (L1) | Deighton |
| `F49` | Which Skills the Hacking Visor's and Hacking Gloves' "electronic interface and hacking checks" and the PrecisionGrip Gloves' "precision skill checks" add to. Stubbed: they compute nothing, the Loadout card says the GM rules it (L3) | Deighton |
Every `flagged: true` in the data names an F-number open here; `tests/docs.test.mjs`
fails on one that doesn't (audit A7).

---

## 3. Decisions by topic

Every entry in `SCHEMA.md` §4, grouped by subject. The number is the thing to
look up — these lines are signposts, not the decision.

**Load-bearing.** Most of the ledger is choices made on the way to building
something. These few shape *what* gets built — break one and the project changes
character. Read these before a structural change; the rest when a topic sends
you there.

| # | Why it shapes everything |
|---|---|
| 11 | Every roll is physical — the app never rolls a player's dice |
| 15 | Archetypes share one generic structure; a new one is data, not code |
| 26 | What the engine doesn't model goes through a manual adjustments ledger, not a special case |
| 48 | Audit trail and admin are one subsystem: one ordered, reversible record |
| 62 | The engine is total — it reports a problem, it never throws |
| 63 | `migrate()`'s completeness is the migration guarantee |
| 68 | When game data bumps, and when it must not |
| 70 | Two audiences, two fields — maintainer text can't render |
| 74 | Volatile facts live in exactly one place |
| 75 | Four versions, four triggers |
| 77 | One selection system, three hosts |
| 78 | The mechanical picks are the app's business; the fiction is the table's |
| 89 | Print is a second rendering path, not a second data model |
| 102 | A decision that replaces another marks it, in the same change |

A line ending **→ superseded in part by N** still stands except where N says
otherwise; a ~~struck~~ line is wholly replaced. `tests/docs.test.mjs` checks
that the ledger and this index agree on both.

### Rules the app enforces

What a number *is*. Change one of these and characters change.

- **1** — Ruleset: CRB v4 per WIP files.
- **2** — Terminology: stat pool = Stat Points (old "Character Points" column); old "Freebie Points" = Character Points (CP). → **superseded in part by 218**
- **3** — Max Boost semantics: after advantages are bought, leftover CP may boost powers, skills, or stats — but any single t... → **superseded in part by 218**
- **4** — Costs at creation: Stat Points 1:1 (stats start at base 1, max 10). → **superseded in part by 150**
- **5** — LUCK: everyone starts at 2. → **superseded in part by 157 and 218**
- **6** — Health Levels: 1 HL per point of BOD, 5 HP per HL.
- **7** — Çredits: player rolls physically, enters result; pool = table formula.
- **8** — Skill checks: 1d10 + Rank + Primary Stat (full score) + Synergy Bonus (modifier).
- **9** — Derived attributes: TOL = 1 + INT/COOL/EMP mods (floor 1); WILL = 1 + BOD/INT/EMP mods (floor 1); SAN = EMP×10 (flo... → **superseded in part by 103 and 109**
- **10** — Hard caps: the wizard enforces all table limits strictly.
- **11** — All rolls are physical: the app never rolls dice for creation pools.
- **12** ~~— Supernatural restriction: archetypes with canPurchaseAdvantages: false (Werewolf; Vampire assumed) cannot buy Advan...~~ → **superseded by 152**
- **13** — Milestone cadence: 1 Milestone Point per session; Minor at 5/15/25…, Major at 10/20/30…; 10 IP per session (WIP Pro... → **superseded in part by 228**
- **150** *(The stat buy and the Power Level table — W34, W35, F8)* — Stat Points are the level's flat pool or a roll, the GM's pick (`creation.statMethod`, schema 0.15); a stat point costs 1 up to 6 and 2 from 7 to 10, from a free 1; Skill Points are base + INT + REF, Boosts included; CP 5/10/15/20, Max Skill Rank 4/5/6/7; a roll is 5 below the flat pool + 1d10. F8 and F35 closed. → **superseded in part by 198**
- **198** *(The rolled pool as a box — crb-v4-sync P1, VQ1)* — The Power Level cards show the flat Stat Point pool; **Roll for Stat Points instead** is a checkbox, off by default, the GM's call; ticked, the cards and Stats use the rolled pool.
- **157** *(Starting LUCK and power ranks — W37)* — Everyone starts with 4 LUCK, bought LUCK on top; a power rank costs 5 CP at creation, every power's, Disciplines included (`boostRules.cpPerPowerRank`), capped by Max Power Rank. → **superseded in part by 218**
- **218** *(LUCK and the Max Character Point Boost — sheet-wishlist P7, W65, W66)* — LUCK bought with CP is held to the cap like a stat or skill (the starting 4 is outside it); `canBoost` is the one check; an unlocked character over it can't lock, a locked file is never touched, Admin is uncapped; "Max Boost" is renamed everywhere a player reads it.
- **152** *(Classification — F13)* — Every archetype is Mortal or Supernatural (`classifications`); a Mortal buys every Advantage, a Supernatural only the 15 Universal ones; Disadvantages are open to all. `canPurchaseAdvantages` is gone; `Engine.canBuyAdvantage` is the one reader.
- **162** *(Spend every point — W57)* — Review's points left are errors while `Engine.spendable` finds something they can buy, so Lock waits; a point that fits nowhere only warns; each step still only warns.
- **14** — IP costs: stat increase = current value ×10; skill rank = 5× current (Focused 3×); skills/powers cap at rank 10 via... → **superseded in part by 97**
- **16** *(Phase 2)* — Ranked Advantages cost cost per rank (Archery Master rank 2 = 12 CP).
- **18** *(Phase 2)* — Arcanist focus-stat bonus may push a stat past 10; the modifier curve extrapolates +1 per point above 10. → **superseded in part by 98** → **superseded in part by 197**
- **19** *(Phase 2)* — Arcanist Disciplines are purchasable in the CP step at 6 CP/rank, capped at the power level's Max Power Rank. → **superseded in part by 157**
- **64** *(B3)* — 1 Health Level per BOD is an invariant, not a tunable.
- **66** *(B8)* — The two Pain Level floors are numbers the engine carries and the sheet states.
- **67** *(B9)* — The milestone cadence comes from the data, once.
- **135** *(Audit S4 — A8, A9)* — A data field is read by code or named as text; formulas and paths are numbers the engine reads (`{ stat, times, plus }`, `dataPath`); fields restating the code are deleted; no archetype id in code. The R6 key guard enforces it.
- **98** *(Design-team rulings, part 2)* — Stats past 10: +5 at 11–15, +1 per 5 after. F20–F22 closed: Skill Checks only, a −8 cap on one roll, only Injured/Maimed take a body part. Plan CQ4–CQ7/CQ10 answered for Session 3.
- **97** *(Design-team rulings)* — F1/F2 confirmed 1:1 CP, F17 confirmed stacking; F14: a new skill after creation costs a flat 25 IP. F8 stays open. → **superseded in part by 157**
- **99** *(Taking a hit — combat plan Session 3)* — `resolveHit` is pure, `applyHit` is one undoable action. PROT + matching RES; AP and Compromised skip RES; a fully soaked hit costs 1 INT. Massive strips INT, removes HL from the right (counted as lost), +1 with no armor left; Shock at ⌈½ max HL⌉ of levels this hit took; At Zero / Death Mark while Dying. F23 opened. → **superseded in part by 100, 112, 143 and 219**
- **100** *(Loadout & recovery — combat plan Session 4)* — Catalog pickers with Add/Buy, one worn piece per slot, upgrades by slot and quality; weapon lines (attack = skill check, ACC apart, `BOD+X` resolved). Wear, repair, Rest, Focused Healing (the only way back for Massive levels and Injured), Turn Reset (ticks aren't hits: no armor, no Shock). Stand-in armor gone. F24 opened. → **superseded in part by 104, 105, 219, 220 and 247**
- **104** *(Natural Armor — combat plan cleanup)* — One derived value from `grants` on advantages, Major Milestones and specializations; conditional sources (Iron Shirt, a waning moon) shown, never summed, asked for on a hit. How it answers a hit is the F25 stub. Print's Nat column fills. `migrate()` drops junk held entries. → **superseded in part by 143** → **superseded in part by 196** → **superseded in part by 199** → **superseded in part by 219**
- **226** *(Movement — sheet-wishlist P11, W98, Deighton Q23)* — `movementRules` and `movement(ch)`: Walk MOB, Run ×3 (−1), Sprint ×6 (−3), Jump Sprint ÷ 4 rounded down, in meters; Fleet of Foot doubles Run and Sprint (not Walk) as a listed grant and Jump follows the doubled Sprint; Prone and Restrained are named, not computed. Main only.
- **219** *(The hit — sheet-wishlist P8a, W102, F18, F23, F25)* — A matching Resistance (three typed upgrades; the untyped one is retired and stops nothing) halves a covered hit first, rounding down, then PROT and RES; AP on a spell pierces Natural Armor ("From a spell" in the hit modal); Electric and Burning stay Energy; frag grenades and the launcher carry Siege (Massive). F18, F23, F25 closed; F42 opened. → supersedes in part 99, 100 and 104.
- **220** *(Healing — sheet-wishlist P8b, W102, F24, F36)* — Healing counts from 0 HP: the first healing that restores HP or a Massive level (Rest, Focused Healing, a Nanomed Kit, Heal 1 and Heal 5, a GM's negative Take on a row) wipes the damage past zero against today's capacity, before a Massive level comes back; a heal that restores nothing wipes nothing. Damage past zero shows while down ("7 past zero", the HP pill reads −7). `houseRules.keepDamagePastZero` (Admin, off by default, character schema 0.23) keeps it. Dying at a Reset is the WILL check every time, plus a Death Mark per ticking source, on the sheet and in GM mode. F24 and F36 closed. → supersedes in part 100, 151 and 189.
- **105** *(Nanomed Kit — CQ12)* — 0540's list is the master: clears Agonized, Bleeding, Paralyzed, Poisoned and stabilizes the Dying; proposes floor(BOD / dose) HP; a third kind in `heal()`.
- **103** *(Deighton's TOL ruling)* — TOL = 1 + INT/BOD/COOL mods (floor 1), was INT/COOL/EMP; WILL and SAN unchanged. Data only; the CRB's rewritten example is pinned in `rules.test.mjs`. → **superseded in part by 109**
- **96** *(Conditions — the numbers)* — Pain = HL band + Condition Pain, clamped 0–3; a flat Condition penalty lands on every Skill Check; attack/defense and conditional penalties are shown, never summed. → **superseded in part by 107 and 110**

### Content & the CRB

Where game text comes from and how it is merged.

- **55** *(CRB v4 content pass)* — Skills, Advantages and Disadvantages re-merged from the CRB.
- **56** *(CRB v4 content pass)* — Martial Arts: two styles at creation, more trainable in play.
- **57** *(CRB v4 content pass)* — Rank tables stay prose; rankTable waits for the renderer.
- **65** *(Mechanism 3)* — The rulebook's worked examples run as tests.
- **84** *(Docs)* — Nine CRB v4 chapters are mirrored into `docs/reference/crb/`. → **superseded in part by 167**
- **167** *(The private mirror — GQ12)* — The CRB mirror, the Threat Codex and Scott's proposals live in the private `Shadows-Private` repo, mounted at `private/` as a submodule; CI reads it with a read-only token, and the public repo keeps only the pointer.
- **113** *(Quick Study's Intuition — F11)* — Quick Study's prerequisite is the Intuition skill at Rank 1, per 041 (now 0412); the old "Intuition Advantage" matched no entry, so no one could take it.
- **129** *(Hardcore Parkour's prerequisites — F27)* — 1 Major Milestone, Acrobatics 4 and Danger Sense 1; Cat Like Balance becomes Acrobatics 4, Time Sense is dropped (Deighton).
- **136** *(A spell's forms — the Inscribed Spells)* — A spell lists the Disciplines it can be made with (default: all three, Magic's Three Forms); its tier and `th` stay, and another form's TH and time come from `enchantmentTimeTable`. Inscribed-only spells aren't starting spells, and Mastery prices their own TH.
- **231** *(Effects as data — sheet-wishlist P18, W120)* — Every Advantage and Disadvantage has `grants` rows: computed ones (written as tags from `effectTags` and the row's numbers), and `rule` rows the table applies and every reader skips (`ruleText`, `heldText` for a held rank and picks, `byRank`); `creationOnly` adds a tag; tags on the CP step and the Character tab's cards; the 19 unapplied numbers stay rules (P19, P20). Extends 199, 213. → **superseded in part by 232, 233, 235 and 236**
- **232** *(Expert mode, held tags — sheet-wishlist P13, W95)* — A held card's computed tags state its total (`effectTagsHeld`) and skip Milestones past its rank; tags in Natural Advantages, both IP lists and Talented; Expert mode folds creation's book text behind a ? (browser state), Held only, a Skills bar, the filter finds names. Supersedes 231 in part. → **superseded in part by 234**
- **233** *(Skills learn from traits — sheet-wishlist P19)* — A trait that changes a Skill's check shows on its row: `checkMod` is in `checkBonus` (so the row, attacks, a maneuver and print follow), a `whenText` row is a mark never a number, a kicker is beside the number, Take X is X + the whole check (choose before rolling), `failOn`/`explodeOn` are marks, Night Vision names the `visibility` levels `0530` sets. 16 entries move from table rule to computed. Supersedes 231 in part; extends 96, 229.
- **234** *(Expert mode reaches Stats, toggle on every creation step — P19's rider)* — Expert mode folds the Stats step's descriptions too (the price line stays), its toggle is in the wizard's header on all eight steps with a tooltip naming the four it folds, and the first-sight hint shows on those four only. Supersedes 232 in part; reverses P13's PQ4.
- **235** *(Numbers at creation — sheet-wishlist P20a)* — A Sanity cut, Arcane Fortitude's +2 TOL, a trait's cap on a Basic Stat and Wealthy's Ç10,000 are computed rows (`derivedMod`, `statMax`, `startingCredits`) read from five sources; a cut comes after the floor and cap and SAN never drops below 1; `statMax` is the one cap (lowest wins at creation, a lift stays in play); a cap passed refuses the lock; Dwarf and Giant exclude each other. Supersedes 231 in part; extends 77 and 135.
- **236** *(Numbers in play — sheet-wishlist P20b)* — Terminal Disease (`painLevel`, `onlyIfHurt: false`) holds Pain at 1 or more and counts as hurt for Pain Sensitive; Pain Tolerance (`painIgnore`) comes off after the clamp, never below 0; Rapid Healing (`healTimes`) and Fast Metabolism (`naturalHealingTimes`) multiply a rest with Speed Heal, in one engine reader; Take a hit asks Melee or Martial Arts only when a held trait reads it, Giant's −4 then Scrapper's halving after Natural Armor and before Wither Ward; an unredirected Regular Head hit doubles unless Thick Skull. Supersedes 213 and 231 in part; extends 99, 220 and 223.
- **237** *(Skills learn from powers, tweaks and Milestones — sheet-wishlist P21)* — A tweak's, Major's, power's, trait's or Aberration's effect on a Skill's check shows on its row: `traitRows` reads specialization options, taken Majors, powers at rank, baseline traits, the starter power and Aberrations (sharing `traitGrants`' walk, which keeps its five); `perRank` × rank + `plus`; a conditional kicker is a mark; Night Eyes shifts a light level, Nocturnal modifies every check; Take X's line adds a kicker ("Take 6: 13 + 1d4"), its total doesn't. Rider: Speed Heal doubles one day of a rest. F45–F47 opened. Extends 233 (answers its "a kicker and a Take X"); 236's Speed Heal holds for the dosed day.

### Archetypes & specialization

The generic archetype structure, and the pick that defines one.

- **15** — Archetypes: generic six-block structure (Power Scaling, Baseline Traits, Specialization, Core Mechanic, Powers & Vu...
- **17** *(Phase 2)* — Professional natural advantages are stored as normal advantages entries with notes: "natural" and cost 0 CP — they... → **superseded in part by 142**
- **20** *(Phase 2)* — Aberration prose benefits display as reference text only; only structured fields (e.g.
- **21** ~~*(Phase 2)* — Common-spell selection is deferred to Phase 3; the wizard shows the computed count (TOL + 2d4) only.~~ → **superseded by 25**
- **58** *(CRB v4 content pass)* — The Phase 4 selection system is now specified by the rulebook rather than proposed — and none of it is encoded yet. → **superseded in part by 77 and 87**
- **77** *(Batch 3)* — One selection system, three hosts. → **superseded in part by 229**; extended by 235 (the first real `excludes` pair)
- **78** *(Batch 3)* — The mechanical picks are the app's business; the fiction is the table's.
- **79** *(A3 — closes A1 and A2)* — One specialization model, and the count comes from the data.
- **126** *(Option powers — B17)* — `starterPower`/`additionalPowers` render from the data; an array of plain objects on a power is a table; no text means "not written yet". → **superseded in part by 196**
- **134** *(Audit S3 — B12–B14)* — Focused Skills are data (`ids`, a category `choose`, an `all` price), read by one generic reader; the Focused cap and the IP prices are numbers the engine reads. → **superseded in part by 238**
- **238** *(The Enforcer to 0412 — crb-sync Y1, YQ2, YQ6)* — a locked character short of a Focused Skill pick is asked at the top of every sheet tab, with the wizard's picker, until it's chosen; the Loadout panel keeps a line pointing to it.
- **153** *(Custom archetype — schema 0.16)* — An archetype with `writeIn` is written by the player (`archetypeChoices.writeIn`, `powers`); a panel's `when` follows a ticked mechanic; `archetypeContent` is the one reader; `addPower` takes an optional IP cost; Other classification; "off the books" badge. → **superseded in part by 154, 194, 216**
- **154** *(Powers in play — custom archetype feedback)* — A power reads as written; **Improve** rewrites it for a required IP cost (`improvePower`), Add power costs IP too, Admin edits and adds free; Notes stay free. → **superseded in part by 194**
- **194** *(Powers with ranks — W71, crb-v4-sync P2)* — schema 0.18: every power has a rank; a Discipline's is start + CP + IP, a written power's 1 + IP (`progression.powerIpe`). **Raise a Power** on Progression at rank × 20, a new one 40 (`0450`); written caps are creation caps, play stops at 10; Add power in play costs the new-power price.
- **195** *(Werewolf form — crb-v4-sync P3, VQ11)* — A toggle option carries what being in it does; shifted, skills, Health Levels and weapon damage read +2 REF, +2 MOB, +4 BOD, WILL/TOL/prices/caps don't; Claws and Fangs on Main; Feral Mind bars TECH skills; a Forge Fang's shift writes 1 HL of Withering, priced in the form entered; Main has the switch.
- **196** *(The Werewolf to 0414 — crb-v4-sync P3, VQ10, VQ12–VQ15)* — Every Innate power and the Origin's at rank 1 + IP (F38 stubbed); the book's max 3 binds creation only, play stops at 10 (VQ14, may be revisited); three Origins with features, starter powers (tables are reference) and withdrawal; Call of the Wild a stepper; EMP the Forge Fang's; Resilient Spirit retired. Majors are P3b. → **superseded in part by 215**
- **197** *(Werewolf Focus Stats — crb-v4-sync P3)* — The Werewolf's bonus goes on BOD, REF, MOB and can pass 10; `migrate()` moves a saved Stat Bonus across.
- **199** *(Werewolf Major Milestones — crb-v4-sync P3b, VQ16–VQ19)* — `0414`'s 29 Majors offered beside the shared ones, another Origin's hidden; `prerequisites.specialization` (any of); `grants()` reads taken Majors: `rou`, `sfrMax` (Tireless, Deep Reserves) and `form` (Hardline Shift Regular, Iron Jaw AP, Clear Head −2 for Feral Mind's bar); the rest text. → **superseded in part by 217**
- **200** *(The Vampire to 0413 — crb-v4-sync P4, VQ20, VQ23–VQ26)* — schema 0.19: `powersBought` holds only the powers Base Powers placed a rank in, none past Max Starting Rank (F39 stubbed); a specialization's `choices` (Built to Last a pick, F41; the Ancient Weapon; the Code as text) in `optionPicks`; the Code a Draugur toggle that silences the weapon; bite, claws and Ancient Weapon on Main; Iron Hide and Icebound Resilience conditional Natural Armor; Admin sets a Bloodline. → **superseded in part by 215**
- **201** *(The Thirst — crb-v4-sync P4, VQ21)* — A `feed` panel: Fresh 3 SFR a HL to the max, Stored 2 to half, A day unfed half RoU, Hunger's WILL check at RoU or under; one Undo each, Main and Trackers.
- **225** *(SFR spent this round — sheet-wishlist P11, W97, W54)* — `trackers.sfr.turn` counts the tracker's +1s against RoU (`turnCap`); the Thirst never counts; the sheet warns at and past RoU and never blocks; Turn Reset clears it; a Custom pool's max is read by the engine and gets Main's card, with no RoU. Schema 0.27.
- **202** *(Pain Immunity — crb-v4-sync P4, VQ22)* — A Vampire's Pain counts only Withering's Health Levels; Conditions add as ever.
- **215** *(Supernatural powers at creation — sheet-wishlist P3, W88, W105)* — Innate powers granted at rank 1; Base Powers buy the Bloodline's or Origin's, Werewolf included; CP raises any held power; an Upyr holds both Built to Last powers, never stacked; a day without rest; schema 0.20. → **superseded in part by 216, 240**
- **216** *(Powers learned in play, custom powers — sheet-wishlist P5, W72, W106)* — A Vampire or Werewolf learns an unheld power of its own Bloodline or Origin for 40 IP; any character gets a custom written power (40 IP, free on Admin; 5 CP at creation, free as a GM grant); **Buy or Raise a Power**; schema 0.21. → **superseded in part by 223**
- **240** *(Powers at creation — crb-sync Y4, YQ1, YQ4)* — a Base Power takes one Bloodline or Origin power at rank 1; CP raises a held power only to Max Starting Rank; a draft made under 215 is refused until fixed, a locked character keeps its ranks.
- **223** *(The Vampire's Major Milestones — sheet-wishlist P17, VQ27, VQ4)* — `0413`'s 22 Majors as data on 199's engine; five compute (RoU, SFR max, a feed grant, Wither Ward halving Withering last, never below 1); `notWith` and `noSpecializationGained`; Splice holds another Bloodline's power at rank 1; Cursed Evolution opens one Bloodline (`playPool`, not `powerPool`) learned at 40 IP; schema 0.25. Extends 199 and 201.
- **217** *(Milestones — sheet-wishlist P6, W103, F9)* — Any Minor repeats; Improved is 3d10+30; Skilled, Honed, Redeemed, Talented and Steadied ask what they give by a chooser; the General Majors are the Professional's, a taken one is still found; any archetype can write in a Major; schema 0.22. → **superseded in part by 227**
- **229** *(A style learned in play — sheet-wishlist P12b, W39, Deighton Q29)* — A pick marked `addInPlay` takes more answers than its `count` once locked, with no price (`addPickInPlay`, one commit); a skill's picks count creation, IP and boosts; Martial Arts lists its `maneuvers` and each style a `maneuver` and `amount`, summed per maneuver (two styles stack, PQ6), unarmed, shown on the skill's row. Schema 0.28. → supersedes 77 in part.
- **230** *(Training — sheet-wishlist P12b, `0450`)* — `houseRules.training` (Admin, off) puts Train a Skill on Progression: a REF, INT or TECH Skill already held, 10 × the rank's IP cost in Çredits paid at the start, never past 9, one at a time; the rank lands at the next Minor or Major threshold of Milestone Points (not `minorAvail`), inside Log session or the manual MP stepper, with a 0-IP journal line (`via: "training"`); IP and Skilled skip a skill in training. Schema 0.28. Extends 220, 27, 159, 217.
- **227** *(IP beyond ranks — sheet-wishlist P12a, W89, Deighton Q24)* — IP buys an Advantage (new at rank 1, or a rank up) at points × 10 a rank, flat; buys a Disadvantage off a rank at a time at its points × 10, no CP back; restores SAN at 5 a point and a maimed Health Level at 25, clamped to the loss. `advantageOffer` is one eligibility rule for IP and Talented, and refuses `creationOnly` (Long-Lived); a flagged entry (Educated, F44) isn't sold. A new rank asks for its pick in the same buy. No schema bump. → supersedes in part 159 and 217.
- **213** *(Playtest bugs — sheet-wishlist P1, W92, W93)* — A `painLevel` grant (Pain Sensitive) adds to a Pain Level already 1 or more, as `fromTraits`; a Minor's `ipRoll` asks for the dice and adds `plus` (Improved 2d10 + 15); `Engine.localDay` is the one local-day helper. → **superseded in part by 236**

### Character file & migration

The saved `.shadows.json`: shape, versions, upgrades.

- **28** *(Phase 3)* — Character schema bumped to 0.3.
- **53** *(Phase 3.3)* — Character schema → 0.4.
- **63** *(B6)* — migrate()'s completeness is the migration guarantee.
- **68** — When gamedataVersion bumps — and when it must not.
- **75** *(Versioning)* — Four versions, four triggers — and schemaVersion stopped meaning two things.
- **92** *(Weapons, Ammo & Armor — data)* — The equipment chapter merges as catalogs, not as engine logic; character schema 0.5 → 0.6. → **superseded in part by 139**
- **93** *(Magic — archetype-independent half, data)* — The Magic chapter splits into a universal Spellcraft system and an archetype question (Origins); only the first merges, and it corrects a live mechanical error along the way. Character schema 0.6 → 0.7. → **superseded in part by 103, 116 and 136**
- **95** *(Conditions — catalog and schema 0.8)* — Conditions are a data catalog with structured hooks; active ones are inputs, one per id (per body part for location-bearing ones); game data 0.7 → 0.8, character schema 0.7 → 0.8, with the plan's damage and armor fields landed in the same migration.
- **125** *(Load findings — C4)* — what `versionCheck` finds stays until dismissed; a bare game-data version difference shows once.
- **128** *(Intake number and replace guard — B18)* — `meta.id` is a permanent NYTE City intake number (schema 0.11); `meta.updated` is last changed; Import, New and Lock ask before replacing a different or newer character, with Export first. → **superseded in part by 133 and 141**
- **133** *(The TAG)* — `meta.id` is `TAG-XXXX-XXXX-XXXX`, shown as itself; a 0.11 `NCR-` number keeps its twelve characters under the new prefix; schema 0.12. → **superseded in part by 146 and 155**
- **141** *(The roster — R10, AQ5)* — one `localStorage` entry per TAG, draft through locked; Home lists them with Open, Export and Remove and marks play no file holds; only an older copy of the same character asks before it replaces. → **superseded in part by 171**
- **142** *(The natural-advantage marker — A11)* — a Professional's free advantage is `source: "natural"`, not a note; schema 0.13 moves the old marker, in the undo history too.
- **146** *(Ghost TAG reads — W31)* — an Advantage held with `tagReads` labels the TAG and says what it is; Ghost TAG does, and Black TAG is the same counterfeit. The number never moves. → **superseded in part by 148**
- **148** *(TAGless — W41)* — `identity.tagless` (schema 0.14) is picked on the Identity step and in Admin; `tagReading` labels the TAG "Off grid" from the data's `tag`, a Ghost TAG's label wins and its tip says both. → **superseded in part by 155**
- **155** *(A TAGless number — W41)* — `tagNumber` drops the TAG- prefix for a TAGless character wherever the number shows; a Ghost TAG keeps it; `meta.id` never changes.
- **143** *(Warding by kind — W28)* — Elemental, Spirit and Aether replace the Magical damage type, each with its own Warding upgrade; Gear's one Warding is retired and still answers all three where installed; Self-mending is text. → **superseded in part by 196**

### Engine contracts

Promises the engine makes and the guards behind them.

- **22** *(Phase 2)* — Engine normalizes legacy stat-id aliases in skill data (e.g.
- **59** *(B2)* — Legacy stat aliases point at live stat ids, and normStat verifies its own target.
- **60** — Engine.undoIP is removed, not deprecated.
- **62** *(Batch 1)* — The engine has a totality contract, and now something enforces it.
- **80** *(Batch 3)* — Two realms, one trap, written down.
- **81** *(Batch 3)* — A stale natural advantage no longer survives a subtype change.
- **82** *(Batch 3, post-review)* — A trait held twice is still one trait — and an adversarial review found it.
- **87** *(Batch 3b)* — The other half of Decision 58 lands: a `grants` array gives an advantage/disadvantage a static mechanical effect.
- **88** *(Batch 3b, F17)* — Long-Lived's ranks stack.
- **91** *(PR #7 review, closed)* — One prerequisite vocabulary, checked in one place: `requirementState`/`majorPrereqs` share `checkPrereqs`, the Professional stat gate reads `requires` data, `heldIds` reaches skills. → **superseded in part by 134**
- **124** *(A character file is untrusted input — B16)* — every stored number is a number after `migrate()`; undo writes only to the character; Admin addresses rows by position; `hostile.test.mjs` is the guard.

### Sheet & play tracking

The eight-tab running sheet, damage, IP, milestones, sessions.

- **23** *(Phase 3)* — Logging a session auto-grants the per-session IP (10 per WIP Professional cadence, overridable per session), 1 Mile...
- **24** *(Phase 3)* — Pain Level penalties are applied to every displayed skill-check total, with the reason shown inline (breakdown colu...
- **25** *(Phase 3)* — The Grimoire is a free-entry table. → **superseded in part by 108**
- **26** *(Phase 3)* — Un-modeled effects (milestone benefits, aberration prose, items) are applied through a manual adjustments ledger: s...
- **27** *(Phase 3)* — The IP journal is the audit trail: entries are spend or grant; spends update the target's IPE atomically; the last... → **superseded in part by 49**
- **29** *(Phase 3)* — Milestone enforcement: Minor duplicates blocked until all five have been selected once; Major prerequisites are mac... → **superseded in part by 217**
- **30** *(Phase 3.1)* — The locked sheet is tab-driven, not a single scroll. → **superseded in part by 158**
- **31** *(Phase 3.1)* — Iconography lives in shadows-icons.js (see §1).
- **32** *(Phase 3.1)* — The Main tab is a full-width "command console" — the duplicated Vitals rail is hidden on Main only (an .app.main-ta... → **superseded in part by 35 and 165**
- **35** *(Phase 3.2)* — Full-width sheet on every tab. → **superseded in part by 160**
- **36** *(Phase 3.2)* — Four-sphere stat layout on Main.
- **37** *(Phase 3.2)* — Vitals flyout drawer. → **superseded in part by 160, 161 and 166**
- **38** *(Phase 3.2)* — Sticky in-header navigation. → **superseded in part by 140**
- **39** *(Phase 3.2)* — Header overflow menu.
- **40** *(Phase 3.2)* — Collapsible page footer.
- **41** *(Phase 3.2)* — Number-entry caret fix.
- **43** *(Phase 3.2)* — Date-input theming.
- **44** *(Phase 3.2)* — Skills aligned + per-skill descriptions. → **superseded in part by 156**
- **156** *(Skills tab — every skill, two columns)* — Every skill in its category, untrained at Rank 0 and full strength; two columns from 1000px, categories never split, the first holding half the skills.
- **45** *(Phase 3.2)* — Traits collapsible. → **superseded in part by 158**
- **158** *(The Character tab)* — Traits and Archetype are one Character tab (eight tabs): the archetype, its traits, powers and vulnerabilities a column each from 1000px, then Advantages beside Disadvantages, a sticky jump bar, Expand all remembered in the browser, buttons to Loadout & Powers and Trackers. → **superseded in part by 168**
- **168** *(Character tab — fill the width)* — The archetype beside its core mechanic; its parts flow into ~340px columns that break between cards; Advantage and Disadvantage cards as many across as fit; every count by the page's width, so pinned vitals take their columns back. → **superseded in part by 246**
- **246** *(Character tab — a row a section)* — Each section starts its own row, heading at the left, its cards in one grid (300px tracks, 20px gaps) every section shares; a section's one card (`solo`, set by the renderer) spans two columns in a container query; Advantages beside Disadvantages stays, on the same gap.
- **46** *(Phase 3.2)* — Progression collapsible. → **superseded in part by 159**
- **159** *(Raise modals)* — Progression's Raise a Stat and Raise a Skill are buttons opening a modal of every stat or skill with its price and why it's off; a raise keeps the modal open. → **superseded in part by 227**
- **52** *(Phase 3.3)* — Main health as HL segments; TOL/WILL derivation surfaced.
- **83** *(Batch 3a)* — The ledger's ✓ meant "no errors," not "nothing left to do."
- **89** *(Print view)* — A printable sheet is a second rendering path, not a second data model.
- **90** *(Light theme)* — A light theme toggle, ported as a mechanism rather than a token set.
- **94** *(Print sheet — visual redesign)* — The front page moves to a case-file layout and starts drawing from Scott's real Affinity artwork; Health Levels groups into Pain Level bands; Skills becomes two panels with Primary/Synergy icon badges.
- **106** *(Cascade and Aberrations — Magic-tables side session)* — 0480_Magic.md's two tables and the Appendix's 39 Aberrations are data; `Engine.cascade()` reads the player's dice. The Arcanist gets a TOL Spent tracker (it had none after 93), whose Cascade panel writes the result into Notes. Schema unchanged. → **superseded in part by 110 and 115**
- **107** *(Sheet feel — wishlist pass)* — W7 `--on-accent` text on filled controls with a both-themes contrast guard; W11 Heal/Hurt stepper; W12 an undo toast on every `commit()`, matched to its audit entry by identity; W14 a Condition chip palette, and Main's chips open their details.
- **108** *(The Grimoire reads the book — magic plan Session 1)* — Book rows store `{ spellId, stage, notes }`, your own rows are typed columns (`custom`); schema 0.9, migrate never links. `Engine.grimoire()`, Spell Power, Mastery = 30 IP × TH through the IP journal (TH − 1), a picker that shows the numbers first, Link to the book. Spell Attack left for a ruling. → **superseded in part by 111 and 136**
- **109** *(Deighton's magic rulings)* — Starting spells gated by TH ≤ Evocation rank (MQ1); Drained −2 max TOL (never below 0), current unchanged either way, so TOL Spent −2 on / +2 off (MQ2); Phantom Pain PL 1 at full health (MQ3); Spell Attack = Evocation + raw REF + raw WILL. Docs only; built by the plan's sessions.
- **110** *(Aberrations on the character, and the Magic reference — magic plan Session 2)* — `trackers.aberrations` holds `{ id, permanence, note? }`, one per id; the catalog's `painLevels` (Phantom Pain) and `adjust` (Drained, max TOL −2, floor 0) are read every time, and every tracker on `max: "TOL"` shifts so current TOL never moves. Record it = note + Aberration in one undo. Spell Attack from the scores. A `reference` panel type (the Arcanist's Magic reference). Unique Aberrations synced to 041. → **superseded in part by 115**
- **111** *(Starting spells in the wizard, and the spell picker modal — magic plan Session 3)* — TOL + the power level's roll of book spells, chosen on the Character Points step where Evocation and TOL are final; at creation TH ≤ Evocation rank, after lock nothing gates it and a TH beyond the pool is marked (exploding 10s only). Picks are Grimoire rows; no schema bump. The picker is a native `<dialog>` modal shared by sheet and wizard — the first focus-and-dismiss primitive.
- **224** *(Holding a spell — sheet-wishlist P10, W87, Deighton Q17–Q19)* — `trackers.heldSpells` records the Concentration spells held (the tag's); each sets aside one die from every Essence roll, shown in the casting pool, Beyond your pool and beside Pain's line; capped at the Evocation rank, the rest kept and read as not held; damage that gets through prompts the WILL check with Let go per spell and nothing drops on its own; schema 0.26. F43 (the check's TN and TH) is open.
- **161** *(The wizard on a small screen — W44)* — Below 1060px the rail is one sticky line of Stat, Skill and CP left with a Vitals pill opening the full rail in the flyout (it scrolls away on step 7, whose jump bar counts CP, and lets go while typing); each step is named by `short` in the strip and its title, its sentence under it once; stats read — until one is spent.
- **163** *(The lock's beat — W46)* — The render after a lock prints the TAG once (a bar wipe, then a stamp), a toast in voice names the exported file, focus lands on the name; none of the motion under reduced motion.
- **114** *(Jump bars — W5, W22)* — `sectionList` headings feed a bar that jumps to each section a page drew (archetype panels included) and focuses it; step 7's bar sticks, filters Advantages/Disadvantages keeping what you hold, and shows the CP left.
- **115** *(The GM runs the Cascade)* — The Cascade panel gives the instruction (d10 + Rupture degree, tell your GM) and opens one Aberration picker, a modal of cards with each one's text, also used by Trackers' Add. The pick's note is dated; nothing goes into Notes. `recordCascade`/`logCascade` removed; the tables stay in the reference.
- **116** *(Spell tag AP)* — `AP` on a spell means Armor Piercing, as the weapon tag does (skips RES, PROT still rolls). Unflagged; Iron Lance's own effect already said so.
- **147** *(Spell Power in numbers — W32)* — a spell, Cascade row or Aberration naming Spell Power carries `sp` ({ times } or { adds }) keyed by its text; `Engine.spAmounts` rounds up, and the sheet shows the number beside the book's words.
- **112** *(Modals, the skill line and Trackers' layout — wishlist pass)* — The modal gains a sticky footer and is centred; W6 Take a hit in the modal, Apply disabled with its reason; W23–W26 row click, dimmed rows that say why, sticky search, Done; W20/W21 a skill's stats as icons with the character's numbers; W1/W10 Trackers in two columns, the HL track in Damage banded by Pain Level.
- **117** *(Let a hit land — W15)* — `commit()` notes when damage went up; the next render flashes the HP readouts and the Health Level boxes that took it, twice on Pain if its level rose, once only, never on heal or undo, none under reduced motion.
- **118** *(The catalog browser — W4)* — Loadout's pickers are a modal: search, section, What I can afford, sort, and every number before Add/Buy from `Engine.catalogLine()`, the reader Loadout's own rows share. Buy says why it's off; a row click opens its details.
- **119** *(Vitals popovers — W2, W3)* — HP, Pain/Cond, SAN, LUCK and Ç on the vitals bar and Main's cards open a popover (`openPopover`, non-modal, follows the render) holding Trackers' own controls, bound by the one `bindVitalControls(root)`; Take a hit hands over to the hit modal. → **superseded in part by 160**
- **160** *(Pinned vitals)* — From 1280px the vitals panel pins as a right-hand column on every tab, Main included; the header, page, footer and toast make room, the bar's pills go, and the panel's vitals open their popovers to the left. The pin is the browser's; narrower, it's ignored.
- **169** *(CRANK reputation — W29 S1, F37)* — `trackers.crank: { rep, ledger }`, schema 0.17; +1 a job done, −2 a job walked out on, two buttons with a note and an undo (Admin corrects the rest); the tier, next tier and pay derive from `resources.crank.tiers`. On Main beside Çredits, on Trackers with its ledger, in a tip, and on the print front page's third field row. F37 opened (rep below zero). → **superseded in part by 214**
- **151** *(Health verbs on Main — W42)* — Heal 1 · Hurt 1 · Take a hit as a full-width row after Pain in Main's card grid, the popover's own controls; at zero Main's Hurt 1 greys out and says to use Take a hit, which asks 054's WILL check. F36 opened. → **superseded in part by 220** — Heal 1 counts from 0 HP; F36 closed.
- **165** *(The sheet on a phone — W45)* — No "Live Sheet" eyebrow; below 640px the title and Main's name are smaller and still wrap; Combat before Stats in the page at every width (the left column when wide); the vitals bar and the sheet's jump bars are one sideways row with the toggle and Expand all outside; Çredits takes a row alone; Pin vitals on Main from 1280px. `phone-check` guards the rows and the fold. → **superseded in part by 169**
- **166** *(The flyout and focus — W58)* — One setter writes the flyout's open state, `aria-hidden`, `inert` and the scrim from open-or-pinned-with-room; focus moves in on open and back on close before it goes inert; Esc closes one layer; a tab switch closes it; leaving the sheet empties it. Still no focus trap.
- **164** *(Keeping your place — W47)* — `keepPlace` wraps every redraw a press causes (`#main` on the same view, header, flyout, popover, pickers): focus goes to the twin by all its `data-*` attributes in the same root, else the card or row it sat in, else the root's title; never `<body>` or a neighbour; a tap is left alone.
- **120** *(Weapon mods and rounds — W16)* — Schema 0.10: `weapons[i].mods` and `roundsSpent`. Single/Burst/Full Auto spend 1/3/10 (0530) from a capacity read as its number + chambered round; Fire and Reload on Loadout and Main. Mods fill fixed slots, fit per data (`onlyFor`/`notFor`), add tags and damage; a sight's ACC is aimed, apart from Single's. F26 opened. → **superseded in part by 145, 221, 249**
- **221** *(A refused mod says why; Magical being — sheet-wishlist P9a, W53, W104, F26, F30, F31)* — A mod's `refusalText` is a map from a weapon category to a reason, shown as `why` when `onlyFor` or `notFor` refuses it, and ignored when junk or without an entry (a shotgun's Scope and Angel Mod; F26 closed). Anti-Materiel and Reach read as rules (F30, F31 closed), the Razorwhip reaches 2m, the skill-check tiers are Easy / Average / Challenging, and `magical-being` is a classification buying the Universal Advantages only.
- **222** *(A magazine taken out before it's empty is kept — sheet-wishlist P9b, W104, F34)* — Reload, a swap or Reload anyway keeps the old magazine: none left and nothing, all left and a whole magazine back on its stack, some and a part-used gear row `{ id, qty: 1, roundsLeft }` (schema 0.24) of its own kind. It loads up to the weapon's capacity, is one magazine (no stack, no +1; Loadout says **Drop**), one tap takes a whole magazine first, the chooser lists each part-used one. F34 closed. → **superseded in part by 249**
- **121** *(Equipment you carry — W17, W27)* — `equipment` (116, Gear's Equipment + Magic's Tools of the Trade) and schema-0.10 gear rows `{ id, qty, chargesUsed? }` or typed; stackable consumables with Use one, Talismans with charges and their spell; Nanomed/Speed Heal/Field Repair Kit take from what you carry in the same action. The browser's third catalog. → **superseded in part by 143**
- **145** *(Reload from what you carry — W30)* — ammo's `reload` names what it fits and whether a unit fills the magazine or one round; Reload takes it from the gear you carry, and with none asks "Reload anyway?" and says so in the audit. → **superseded in part by 149, 249**
- **149** *(Load the round you mean — W40)* — `weapons[i].loaded` (schema 0.14) holds a specialty round; its tags join the line; Reload asks which kind, a full weapon reloads to swap; Angel Rounds need the Angel Mod, which fires only them. F34 opened. → **superseded in part by 222**
- **247** *(Written-in weapons — loadout-and-gear L2, W137, LQ8, LQ9, LQ14–LQ18)* — a custom weapon stores `category`, `damageType`, `range` (0530's bands, `weaponRules.rangeBands`) and `acc` (schema 0.29); its Skill is its type's (`weaponCategories[].skill`), its damage reads as a catalog weapon's, each pick is one audited action, and a saved free-text `type` is kept and shown until a type is picked.
- **248** *(Worn modifiers — loadout-and-gear L3, W69, LQ3, LQ4, LQ19–LQ22, F49)* — a catalog armor or equipment entry's `grants` count while it is worn (not scrapped) or its gear row is `inUse` (schema 0.30, `setInUse`): a `checkMod` adds to a Skill's check, never its rank, and a `weaponBonus` adds ACC or damage by class (`weaponClass`: its Skill's `melee`, its damage type's `resClass`) or feature. A grenade is melee. Custom rows take a class bonus only.
- **249** *(Written-in weapons fire and reload — loadout-and-gear L2b, W109, LQ14, LQ23–LQ28)* — a written-in weapon ticks its fire modes, stored as `rofModes` (`weaponRules.rofModes` ids, schema 0.31; a typed `rof` from before reads until the first tick), and with a weapon type reloads from carried ammunition whose `reload.categories` names the type: magazines or shells, the chooser, part-used magazines, "Reload anyway?", Silver Rounds and Holy Points kept in `loaded`. Never by id, never rounds that need a mod; no type, or one nothing fits, reloads free as before. `ammo` stays a note.
- **122** *(Main is the fight view — W13)* — Main's Combat column leads with the weapons you carry (Fire/Reload), then the armor, then the combat skills; no separate fight mode, and no invented Defense number.
- **139** *(Rules a tap away — A10, C5, AQ4)* — one tip primitive reads tags (`Engine.glossary`), stat ranges and rules text on hover or tap; Lineage, How a check works and the whole Magic reference render; Ammo is an equipment category; `notice()` and `askFirst()` replace `alert()` and `confirm()`.
- **140** *(The header — B19, AQ10)* — two thin rows: the name with ⋮ and theme, then the tabs in one line that scrolls sideways (active tab kept in view, fades, mouse wheel); a long name ends in "…", the `Shadows //` prefix goes below 480 px, and the header un-sticks below 540 px tall. → **superseded in part by 208**

### GM mode

W29, built a session at a time behind a feature switch (173). The plan is `plans/gm-mode.md`.

- **170** *(The table file — W29 S3a, GQ9)* — a GM's table is `.shadows-table.json`: `{ meta: { kind, id: TBL-…, name, tableSchemaVersion, created, updated }, notes }`, table schema 0.1, gated by `migrateTable()` (total, typed, keeps unknown keys, invents no dates). `fileKind()` tells it from a character. A fifth version in CLAUDE.md; every shape change bumps it with a step.
- **171** *(Tables in the browser, and Home's door — W29 S3a)* — `shadows.table.v1.<id>` beside the roster, by its rules; with GM mode on Home has *Run a table*, *Your tables* and one **Import a file** that reads either kind; a table opens on its own screen (name, Notes tab, Rename / Export / What's new / Home). No undo on a table yet. → **superseded in part by 176, 181 and 208** → **superseded in part by 212**
- **172** *(GM mode's own script — W29 S3a)* — `src/ui/gm.js` after `sheet.js`, its engine a *Tables* section of `engine.js`; the other UI files call in at three places only. The code-file guards read the script list from `index.html`.
- **173** *(The feature switch — W29 S3a)* — `FEATURES.gm` is false; `?gm=on` / `?gm=off` set this browser's `shadows.feature.gm`; switched off, Home is as it was and a table file is refused, not read as a character. Sessions merge to `main`, releases go on, and the release that sets it true is GM mode's launch. → **superseded in part by 214**
- **214** *(CRANK behind a switch — sheet-wishlist P2, W101)* — FEATURES.crank false: no CRANK on the sheet, print or blank sheet; rep and ledger kept in the file; ?crank=on shows it; GM mode's CRANK unchanged. → **superseded in part by 239**
- **239** *(CRANK is back — the team's go, 2026-10-23)* — FEATURES.crank true: CRANK on Main, Trackers, Admin, print and the blank sheet for everyone; the switch stays, on, and ?crank=off no longer hides it; kept rep shows as stored.
- **174** *(The cast — W29 S8a, GQ6, GQ10)* — table schema 0.2: `cast`, one record per NPC (`C-` id, name, the §4e text fields, origin, roles and enemy role as the GM's text until S9's pack, `tier`, `status` alive / dead / missing / gone, `block`); `migrateTable()`'s first step. → **superseded in part by 177 and 182**
- **175** *(The stat block — W29 S8a, GQ6)* — a block stores what the Codex prints: stats and skill totals, TOL and WILL as authored (an exception to constraint 7's letter), armor and gear as text, traits; `Engine.npc` derives Health, HP, bonuses and each formula's value and stores nothing.
- **176** *(The Cast tab — W29 S8a, GQ1)* — a table opens on Cast: quick-add, a search and a status filter (*In play*, alive and missing, by default; listed alive, missing, out of the picture, dead), a page per member saved as typed; Delete asks; still no undo on a table (S10 decides its audit trail). → supersedes 171 in part. → **superseded in part by 179** → **superseded in part by 204** → **superseded in part by 212**
- **177** *(Interactions — W29 S8b, GQ19)* — table schema 0.3: `interactions`, dated records of what passed between the crew and the cast (`I-` id, a kind of seven or null, links, crew as typed names, a local date, text); a *killed* line sets its members dead, one way; no `history` until S5 or S10 writes one. → supersedes 174 in part. → **superseded in part by 193** — an eighth kind, fought, written by an encounter's end. → **superseded in part by 254** — the crew stays typed names, read as the seat that answers to them.
- **178** *(Links — W29 S8b)* — a record links another as `{ kind, id }`; deleting the target writes its name into each link, and `Engine.linkName` reads a link with no target as that name, struck through, or *Someone removed*; never an error. → **superseded in part by 182** → **superseded in part by 241** — a line links its encounter. → **superseded in part by 243** — a line links its place. → **superseded in part by 245** — a clock goes with its owner, rather than keeping its name.
- **179** *(Affiliations and Who knows what — W29 S8b, GQ1)* — `affiliations` as text on a member, one Affiliation filter on the Cast list, **Between them and the crew** on a member's page, and a second view of the Cast tab, *Who knows what*, by crew name, lines with none last. → supersedes 176 in part. → **superseded in part by 241** — a line reads as a sentence. → **superseded in part by 254** — *Who knows what* folds a seat's names into one group.
- **180** *(The pack file — W29 S9a, GQ10)* — a pack is `.shadows-pack.json`: `{ meta, origins, npcRoles, enemyRoles, tiers, entries, groups }`, `meta.id` `PK-…` and the author's, pack schema 0.1 and an author's content version (shown, never compared), gated by `migratePack()` (a bad id drops a record and refuses a pack; never renamed). A sixth version in CLAUDE.md.
- **181** *(Packs in the browser — W29 S9a, GQ10)* — `shadows.pack.v1.<id>`, outside every table, read by every table; Home's one Import reads a pack (`gmImportFile`, the third call-in point widened), Home lists **Your packs** with Remove, and an older copy asks while a newer one replaces. → supersedes 171 in part.
- **182** *(The Threats tab and Use — W29 S9a)* — a table's second tab lists every slotted pack's threats, people and groups, filtered by search, origin, role, enemy role and tier in the pack's order; an entry's page is read-only with Health derived; **Use** copies an entry into the cast with `from { kind: "entry", pack, id, name }` (table schema 0.4). → supersedes 174 and 178 in part. → **superseded in part by 190** (Use's label).
- **183** *(The pack's glossary, modifiers and guides — W29 S9b, GQ16, GQ21)* — pack schema 0.2: `traits` (`kind` universal / origin / signature, `origin`), `origins[].modifiers` on the data's stat ids, `tiers[].statGuide` and `traitGuide` as the book's words, and `enemyRoles[].tier` read; no tier ranges as numbers, since the book's entries break them.
- **184** *(The builder is the member's page — W29 S9b)* — the cast member's page reads the packs by name: lists for origin and enemy role, toggles for NPC roles, the origin's modifiers beside each stat, the tier's guides as the book's words, and an enemy role's usual tier; never applied, stored or warned.
- **185** *(Traits from the glossary — W29 S9b)* — **Add from a pack** copies a trait's name and text into the block; the page counts the block's traits by kind, reading each name against the glossaries, a renamed copy counting as *written*.
- **186** *(The Codex pack is built — W29 S9c, GQ6, GQ10)* — `private/gm/build-codex-pack.mjs` builds the Threat Codex pack from the mirror (the human Codex, v2, the Stat Audit for every stat, TOL and WILL); `private/gm/ids.json` keeps each record's id by the book's name, so renumbering moves only `ref` and a new or renamed name stops the build; `npm run codex-pack`. → **superseded in part by 250** — the builder also reads the Site Profiles, and the ledger keys `sites`.
- **187** *(Apostrophes fold in name matching — W29 S9c)* — `’`, `‘` and `ʼ` read as `'`, on both sides of every pack match and search (`_fold`). → refines 184 and 185.
- **188** *(Encounters — W29 S10a, GQ19, SQ2)* — table schema 0.5: `encounters`, of no type (the book: "a spectrum"), any number planned and one running, ended ones read-only; a row is a PC (typed name, the GM's own HP, Health Levels and Awareness), a cast member (linked) or an entry (its own copy of the block); each stores damage taken and its Conditions with a source and rounds. → **superseded in part by 252** — an encounter carries its Encounter Design worksheet as its plan; the worksheet's type isn't built. → **superseded in part by 257** — a PC row whose name answers to a seat reads that character.
- **189** *(The round — W29 S10a, GQ23)* — Combat Sense highest first, ties shown and never broken, Goes last, Out; a Reset that lists, row by row, what ticks, what runs out (End pressed, Keep a tap away), what asks for a save and Dying's check; HP straight onto a row, shown with Health Levels and Pain, no penalty applied. → **superseded in part by 191, 210 and 220** — every row also takes a hit (191); in waves, a side's place comes first and ties are flagged between sides (210); a Dying row's Reset asks the check beside the marks, and a row's heal counts from 0 HP (220). → **superseded in part by 253** — round 1 passes an Ambush's defenders, and Reset lists a delay never triggered.
- **190** *(Use's two verbs — W29 S10a, SQ7)* — **Add to cast** (what Use did) and **Add to <the encounter open on the Encounters tab>**, on an entry, a group and a cast member. → supersedes 182 in part. → **superseded in part by 211**
- **191** *(The hit — W29 S10b, GQ18, SQ2, SQ5)* — table schema 0.6: a row stores `massive`, and an NPC's `armorLoss`, `scrapped` and the `armorId` they belong to. An NPC row is hit by `resolveHit` and `applyHit` on a stand-in character wearing the Gear catalog's piece its armor line names, its PROT static (053): the die's average rounded up, so 1d4 + 2 stops 5. A PC row takes what got through, read on the GM's own numbers. → supersedes 189 in part. → **superseded in part by 257** — a claimed PC row takes the whole hit on a fresh copy; the gate keeps PC wear.
- **192** *(What a hit asks — W29 S10b, GQ24, GQ25)* — Shock, At Zero and a Death Mark while Dying are offered by their `check` and Condition names, never the player-voiced text; an NPC's are answered or left (blank adds nothing), a PC's are reminders. The active row lists its traits by name, text a tap away, with no triggers. → **superseded in part by 257** — on a claimed row Shock and At Zero are answered as the player calls them.
- **193** *(The encounter's end — W29 S10c, GQ26, SQ1–SQ6)* — table schema 0.7: End on a running encounter opens a wrap-up; each cast row's fight is an interaction of an eighth kind, `fought` (`killed` when the GM sets the member dead), with the crew's names; an entry row can be Kept as a new cast member, recorded on the row as `kept`; the players are told the wear die; wounds and NPC wear don't carry (GQ26). One writer, all or nothing. → supersedes 177 in part. → **superseded in part by 241** — the fight's line keeps the figures and links its encounter.
- **203** *(Sessions — W29 S5a, SQ1–SQ9)* — table schema 0.8: `sessions` (`SE-` id, a number the GM sets and defaults to one past the highest, a local day, who was there as typed names, hours in halves, and the Campaign Journal's six parts as text), and an interaction's `session`; a new interaction takes the one session on its day, a session's page offers the day's older lines, and the gate converts nothing; Delete clears every link. Attendance and hours are stored and nothing reads them until S5b. Switched off (173). → **superseded in part by 254** — attendance stays typed names, read as seats.
- **204** *(Threads and Next session — W29 S5a, GQ1)* — table schema 0.8: `threads` (`TH-` id, title, open / resolved / dropped, one current, `opened` and `closed` sessions, notes); a table opens on **Sessions**, first, which leads with Next session (the current thread, the other open ones, last session's seed, who was met without a stat block), then Threads, then the sessions. → supersedes 176 in part.
- **205** *(The award log — W29 S5b, SQ1–SQ10)* — table schema 0.9: a session's `close`, null until the GM writes the close-out, then `{ at, lines }`: per character a name, present or not, IP, the Milestone Point, Çredits, an off-screen job's tier and a note. Written once, Redo replaces it; it sends nothing, each line reads as what the player enters on their own sheet; the Sessions tab sums IP per name. Switched off (173). → **superseded in part by 254** — the award log's lines stay typed, and its totals fold a seat's names.
- **206** *(The close-out works it out — W29 S5b, GQ28)* — IP is `ceil(hours × 5)` for each name present (`ip.perHour`, `0450`), the absent are the names at earlier sessions with the tier last written for them and its off-screen range (Legendary 10,000–15,000, GQ28), the GM types the amount; the Milestone reminder goes by the session's number; a thread settled there closes in that session; *Anyone new?* lists tonight's cast with no line. → **superseded in part by 228**
- **228** *(The Session Log counts hours — sheet-wishlist P12a)* — The Session Log asks for hours and fills IP as `ceil(hours × 5)` (`ip.perHour`), editable; a typed IP wins; Log is off with neither, and 0 is a value; `ip.perSession` is gone; hours aren't stored. → supersedes in part 13 and 206.
- **207** *(The Reference — W29 S13a, SQ1–SQ8)* — a table's sixth tab, **Reference**, after Encounters: `gmReference.panels` (data, in order) draws Conditions and the Codex's tiers, roles, origins and traits first, then the book's combat Quick Reference and check table (quoted verbatim, checked against the mirror) and the rules the data already holds; `Engine.gmReference(packs, { q })` resolves and filters, one search over every panel and a jump bar to each; nothing stored, no data or schema bump. Printing is S13b (W84). Cites 139, 185, 204; supersedes nothing.
- **208** *(The secretary — W85 S14, SQ1–SQ8)* — a table's header gains **Find** (`Engine.tableSearch`: every word somewhere in a record, over the cast, sessions, interactions, threads, notes and encounters; a hit names its record and field, with the words around the match, and opens it) and **Jot** (a note with `session`, the one session dated today, else none; a session's page lists its notes); table schema 0.10, a note's `session`; nothing stored for the search. Cites 140, 171, 187, 203; supersedes 140 and 171 in part. → **superseded in part by 243** — Find searches the crew's places. → **superseded in part by 244 and 245** — Find searches factions and clocks. → **superseded in part by 251** — Find searches a place's site and Exposure, and its clocks. → **superseded in part by 252** — Find searches an encounter's plan, and finds its clocks. → **superseded in part by 255** — Find finds a seat.
- **209** *(The Reference's chips, wrapped)* — every chip in view under the search, wrapping at every width; the bar sticks from 640px and stays at the top of the page below it, where `jumpTo` doesn't count it; the sheet's bars stay one row (165), and every sideways row takes a mouse wheel. Supersedes nothing.
- **210** *(Wave Initiative — W29 S10d, SQ1–SQ12, GQ30)* — table schema 0.11: an encounter runs **one at a time** or by **Wave Initiative**; it has sides, the crew and one to five others; a row is on one, the GM moves it with a select; in waves the side holding the best Combat Sense goes first, a tie between sides is flagged, and a cast member who **Fights with the crew** starts on the crew's side. Supersedes 189 in part.
- **211** *(Adding to a fight — W74–W76, S10e)* — nothing stored: **Add to <encounter>** is always on a cast member's, an entry's and a group's page and on every Threats card, going to the encounter open, else the running one, else the newest planned, else a new one it makes; a card's **Add to cast** stays on the list; an encounter's **From the Codex** searches entries and groups. A refused add writes nothing. Supersedes 190 in part; extends 182. → **superseded in part by 258**
- **212** *(The table's activity log — W83, S15)* — table schema 0.12: `audit`, an entry per change (a label and a patch diffed from the table as it stood after the last change, arrays element by element, a block in or out one op; a label names only what came and went), undone last first and not itself logged; a toast with Undo on each press (a notice in the same press lends it its words), typing folds into one entry, ⋮ → **Activity** lists and clears, 500 kept, an older file's trail is emptied. Supersedes 171 and 176 in part; extends 48–50, 107 and 124. → **superseded in part by 243** — `places` is a record the log covers. → **superseded in part by 244 and 245** — `factions` and `clocks` are records the log covers. → **superseded in part by 254** — `players` is a record the log covers; a seat's copy isn't.
- **241** *(A line reads as a sentence — W79, W82, S16)* — table schema 0.13: the engine builds each line's sentence, crew first (*Scott told Bob “…” on 10/8/2026*, *Bob owes Scott*), and Who knows what, a session's page and a member's page all read it; on a member's page Edit opens a line's fields as crew, kind, what, when. A line may link its encounter (`encounter`, 178's link): End writes it, its text keeps only the figures, a tap opens the ended fight and Back returns, a deleted fight's name is kept in the link, and search finds a line by its fight. Old lines are left as written. Supersedes 178, 179 and 193 in part. → **superseded in part by 243** — a line may name a place, and its sentence says where.
- **242** *(The gazetteer — S6, GQ10, SQ1–SQ10)* — `gazetteer` in the players' data file, beside `gmReference`: `entries` for `1100`'s Territories, Zones, Supernatural Sites, Business Interests, Factions and the places Beyond, and `1200`'s powers, each with a permanent id, its Territory and Zone ids, the book's real-world place and a one-line summary of ours; `environments` for `1300`'s five kinds of ground. A zone is set only where the book names a listed one. It moves no game-data version (68). Cites 68, 207.
- **243** *(The crew's places — S6, SQ5–SQ10)* — table schema 0.14: `places` (an id, a name, the entry it came from, Territory and Zone, a typed District and Neighborhood, one kind of ground, notes) and a line's `place`, set as **Where**; the sentence says *at* it. The **City** tab, after Cast, has the crew's places and the city to read and search; a place's page lists its lines and who was met there, read every time and stored nowhere. Find, Who knows what and undo cover places; removing one keeps its name in each line. Supersedes 178, 208, 212 and 241 in part. → **superseded in part by 251** — a place takes a Site Profile and owns clocks; removing it removes them.
- **244** *(The crew's factions — S7, SQ0–SQ11)* — table schema 0.15: `factions`, the Faction Tracker (`2644`) as a record: a name, the gazetteer faction or power it came from, one of six types, a Territory, a typed base, key NPCs as cast links, what they want, resources and reach, tipping points for and against the crew, a stance in five steps from Hostile to Allied, `2410`'s attention (Neutral, Aware, Active), notes. Nothing derived: no standing or score. The **City** tab's third view, **Factions**; Find and undo cover them. Affiliations stay text; a faction's page reads the cast whose affiliation matches, and a member's page says what they are key to. Supersedes 208 and 212 in part.
- **245** *(Clocks — S7, SQ7–SQ10)* — table schema 0.15: `clocks`, one record with an `on` owner link (a faction in S7): a name, 2 to 12 segments (4 by default), how many are filled, what advances it, what happens when it fills. The GM taps + or −; the app never advances one. Removing a faction removes its clocks, and one undo restores both. Supersedes 178, 208 and 212 in part. → **superseded in part by 251** — a place owns clocks, and an owner of an unknown kind is kept. → **superseded in part by 252** — an encounter owns clocks; removing it removes them.
- **250** *(The Site Profiles are pack content — S12b, SQ0–SQ1)* — the Threat Codex pack gains `sites` (pack schema 0.3): each of Scott's fifteen profiles in the book's words, its category a kind of ground, its track one of four shapes (none, levels with a start, Exposure steps, a table), its clock a name, segments, what advances it and when it fills. `private/gm/build-codex-pack.mjs` reads `Threat_Codex_Site_Profiles.md`, `ids.json` keys `sites`, `contentVersion` names the draft (not approved). The app reads profiles, never writes one. Supersedes 186 in part.
- **251** *(A place takes a Site Profile — S12b, SQ2–SQ9)* — table schema 0.16: a place's `site` (a pack link, as a cast member's `from`), `siteLevel` and `exposure` (a row a character, a typed name and a count); picking a profile (the select chooses, Use commits) sets the ground to its category and copies its clock onto the place, whose page draws the profile live and runs none of it. A clock's `on` may name a place, and an owner of an unknown kind is kept; removing a place removes its clocks, one undo restoring all. Find covers a place's site, Exposure and clocks. Supersedes 208, 243 and 245 in part. → **superseded in part by 252** — an encounter owns clocks; removing it removes them.
- **252** *(The encounter's plan and clocks — S10f, SQ0–SQ4, SQ8–SQ9)* — table schema 0.17: an encounter's `design`, the Encounter Design worksheet (`2642`) as typed text, adversaries as free rows and the six objectives beyond defeat as picks; its printed lists are the book's, drawn and never stored; no type (188 stands). An encounter owns clocks as a faction and a place do; removing it removes them, one undo restoring all; the plan and its clocks are read-only once it ends. Find searches the plan and the clocks. Supersedes 188, 208, 245 and 251 in part.
- **253** *(The opening and Delay — S10f, SQ5–SQ7)* — table schema 0.17: an encounter's `opening` (none, Surprise or Ambush by one side, set before anyone has acted in round 1), and a row's `delay` (a typed trigger; counts as acted, Act now gives the turn back). In round 1 Next passes an Ambush's defenders; the +1, the +3 and Difficulty 10 are shown on the rows, never applied; Reset lists a delay never triggered. Supersedes 189 in part.
- **254** *(Seats — S3b, SQ0, SQ2–SQ3)* — table schema 0.18: `players`, each with seats (a character's TAG, a status of active, benched, retired or dead, and the typed names it answers to), and `copies`, the last file imported per TAG, run through `migrate()` by the gate and dropped when no seat names it. A typed name anywhere reads as the seat that answers to it, the character's own name included, case aside; a name two seats answer to is neither. Nothing typed is rewritten. Players and seats are in the activity log; copies aren't. Switched off (173). → supersedes 177, 179, 203, 205 and 212 in part.
- **255** *(The Players tab — S3b, SQ1, SQ4–SQ9)* — the card spread: one card per active seat under its player, Health, Awareness and Conditions first, then name, archetype and TAG, the sheet's vitals and how old the copy is; benched, retired and dead fold below. Import characters takes several files onto a player: a new TAG is seated, a newer copy updates its seat wherever it is, the same one says so, an older one asks, a draft or a non-character is refused by name. A card opens the seat's page (status, Answers to, Replace, Remove); Find finds a seat; the PC name field offers the seats' names. Switched off (173). → supersedes 208 in part. → **superseded in part by 256** — a card with a copy opens the read-only sheet.
- **256** *(The read-only sheet — S3c, SQ1–SQ6)* — a card whose seat has a copy opens the seat's character on the sheet's own renderers, every tab but Admin: `Engine.seatCharacter` gives a migrated clone, never the stored copy; `S.ch` holds it only inside `drawReadOnly`; no sheet binder runs (`bindSheetReaders` binds tabs, jumps and descriptions); every other control is disabled or read-only, a tip trigger stays live and a stat's tip reads the drawn copy (`tipChar`). Names whose sheet it is, how old the copy is, **Seat details** (to the seat's page) and **Print**; Find opens a seat the same way. No schema moves. Switched off (173). → supersedes 255 in part.
- **257** *(A seat in a fight — S3d, SQ1–SQ6)* — a PC row whose name answers to one seat with a copy is that character in the fight: it starts from the copy as filed (added under the name, or renamed to it untouched), then the row keeps the fight. A hit asks what the player's Take a hit asks (PROT roll, AP, From a spell, melee, Natural Armor) and runs `resolveHit` and `applyHit` on `Engine.seatCharacter`, a clone, with the row's numbers over it; Shock and At Zero are answered Passed or Failed. Health, Pain and Awareness read off that character, the gate keeps a PC row's armor wear, and the row's name opens the read-only sheet and Back returns to it. A name two seats answer to or a seat with no copy reads as a typed PC row with a line saying why; a removed seat's row just reads typed, keeping its damage and Conditions. A rename off a seat takes its start back if nothing happened since. Nothing is written to a copy or the roster. No schema moves. Switched off (173). → supersedes 188, 191 and 192 in part.
- **258** *(A table's frame — S18, W80, W77, SQ1–SQ6)* — while a table is open `#app` is `table-mode`: one column, no rail, no vitals column, `main` uncapped; fields stop at 36rem (textareas 48rem), prose at 75ch, cards fill 20–36rem columns, an encounter's rows stay one 64rem column, and the read-only sheet lays out as the player's own. Each page's Back, and a member's, an entry's or a group's **Add to <encounter>**, sit in a bar that sticks under the header (on an encounter, Back is the first button of its status bar); a member's status sits under the name and from 1280px the stat block is a panel on the right. Home, the wizard and a player's sheet don't move (`tools/frame-fixture.json`). No schema moves. Switched off (173). → supersedes 211 in part; extends 35, 140, 188 and 189.

### Audit trail, undo & admin

The reversible action log and admin mode.

- **48** *(Phase 3.3)* — Audit trail + admin mode are one subsystem.
- **49** *(Phase 3.3)* — Undo is last-in-first-out.
- **50** *(Phase 3.3)* — Audit trail lives under Session Log, not its own tab (keeps the 9-tab bar; Decision 38).
- **51** *(Phase 3.3)* — Admin mode reaches everything, incl.

### Player-facing voice

Every string a player reads, and what enforces it.

- **69** *(Batch 2)* — The Voice & Style Guide is mirrored into this repo, and the CRB copy stays the master.
- **70** *(Batch 2)* — Two audiences, two fields — and the maintainer one cannot render.
- **71** *(Batch 2)* — "Not finished" is a state the app renders, not a sentence someone remembers to delete.
- **72** *(Batch 2)* — validate() writes player-facing copy, and that is where a build-state sentence hid longest.
- **73** *(Batch 2)* — The voice standard is enforced by rendering the app, not by reading the source.
- **76** *(Voice)* — docs/VOICE-APP.md is adopted, not draft.
- **85** *(Docs)* — GUIDE_Shadows_Voice.md is re-pulled with pandoc.
- **123** *(What's new)* — CHANGELOG.md generates `src/data/shadows-changelog.js` (v0.10.1 on, above a cutoff comment; a test fails if it's stale); the app shows it from the home screen, the sheet's menu and the footer, with a one-time Updated line for a returning player and never an auto-opening window.

### Housekeeping — records, not choices

Numbered because they were written down in the ledger at the time, not because
they choose anything: a no-op version check, a fix, a confirmation.

- **33** *(Phase 3.1)* — Fixed: the REF/Hand brand icon rendered as a solid blob.
- **34** *(Phase 3.1)* — No schema bump.
- **42** *(Phase 3.2)* — LUCK refresh confirmed — no change.
- **47** *(Phase 3.2)* — No schema bump.

### Repository & docs

How the project itself is organised.

- **54** *(Phase 3.4)* — The app becomes a repository.
- **61** *(B5)* — The review step's number derives from creationFlow.steps.
- **74** *(Docs)* — HANDOFF.md is retired, and volatile facts live in exactly one place. → **superseded in part by 101, 127 and 132**
- **86** *(Repository)* — Decision 54's deferred refactor lands: `src/ui/app.js` splits into four classic scripts. → **superseded in part by 172**
- **101** *(Docs)* — The batch board leaves `STATE.md` for `docs/log/shipped.md`, and unscheduled ideas get `docs/WISHLIST.md`. → **superseded in part by 144**
- **102** *(Docs)* — A decision that replaces another marks it in the same change — in SCHEMA §4 and here — and a test holds the two together.
- **127** *(STATE's suite line — AQ2)* — STATE states the todo count only; no pass total, no live version.
- **130** *(Decisions that stay decided — R1, AQ1)* — an entry is the decision, a *Touches* line, and Decided · Why · Rejected · Replaces · Revisit if · Built, in about 25 lines; search the Touches lines before proposing; the load-bearing fourteen are backfilled.
- **131** *(Change tiers — R2)* — what each kind of change must touch; STATE and the log move when the tier says so, not on every change.
- **132** *(One orientation path — A4, C10, C11)* — `CLAUDE.md` → `STATE.md` → `INDEX.md`; `docs/README.md` and the HANDOFF stub go; retired text goes verbatim to `log/archive.md`; SCHEMA is §1–§5.
- **137** *(Fonts embedded — C7, AQ6)* — the brand fonts are WOFF2 data URIs in a generated `fonts.css`, so the app makes no network request; big numbers are Oxanium (`--numeric`), headers keep the display face; build tests hold both.
- **144** *(Wishes granted)* — a built `W` item moves, whole, to `log/wishes-granted.md`; `WISHLIST.md` shows only what's open.
- **138** *(One release workflow — R4, R11, C14, AQ9)* — `release.yml`, dispatched from main with a version, checks, builds once, creates the tag and the Release (CHANGELOG notes, both files) and deploys; `npm run bump` and `release:prep` do the typing.

---

## 4. Keeping this file honest

`tests/docs.test.mjs` checks that **every decision number in `SCHEMA.md` §4 appears
here exactly once**, that every `F`-number open in §5 has a row in §2 and nothing
closed does, that a supersession reads the same here as in the ledger, and that
every flag in the data names an open F-number. Add a decision without indexing it
and the build fails — which is the only reason to trust an index at all.

The one-line summaries are written by hand when a decision is numbered. Nothing
checks their wording, so if one reads badly or no longer matches, fix the line
here; the ledger is the master.
