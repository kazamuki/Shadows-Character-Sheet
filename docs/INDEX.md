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
| The architecture, the shape of the game data or a character file | `SCHEMA.md` §1, §2 and §3 |
| What a change must touch (docs, versions, decision, changelog) | `../CLAUDE.md`, *Change tiers* (Decision 131) |
| A multi-session plan — its sessions, open questions (`CQ`_n_, `MQ`_n_, `AQ`_n_), and why it's ordered that way | `plans/` — **under way:** `audit-2026-09-remediation.md` (acting on the 2026-09-24 audit, `AQ`_n_). Two closed and kept as history: `combat-and-conditions.md` (Decisions 95–106) and `magic-on-the-sheet.md` (Decisions 108–111) |
| An idea nobody has scheduled yet (`W`_n_) — UX, table feel | `WISHLIST.md` |
| What shipped, batch by batch, and which decisions it numbered | `log/shipped.md` |
| What a past session cost, and what to watch for | `log/2026.md` |
| Text retired from a live document: the old phase roadmap, `meta.notes`, the closed-flag notes | `log/archive.md` — verbatim, never edited |
| Whether a string is allowed to say that | `VOICE-APP.md` |
| Whether the current WIP text already answers an open flag | `reference/crb/README.md` — mirrors of CRB documents, **never edited here**; re-pull instead |
| What shipped in a release | `../CHANGELOG.md` — backward-looking only, in player voice |
| How to work on this repo at all | `../CLAUDE.md` |
| The commands and scripts (bump, release, test:fast, phone-check, dev server) | `../CLAUDE.md`, *Commands* |
| A procedure step by step: close a session, number a decision, open or close a flag, cut a release | `../.claude/skills/` (the rules they follow stay in `CLAUDE.md`) |
| How a release reaches players and the live site | `../CLAUDE.md`, *Working rhythm*, and `../.github/workflows/release.yml` (Decision 138) |
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
| `AQ`_n_ | A question the 2026-09-24 audit raises for Ken | `plans/audit-2026-09-remediation.md` §5 |
| `CQ`_n_, `MQ`_n_ | Questions the combat and magic plans raised; all answered except Ken's open CRB fixes, now listed in `STATE.md` §5 | `plans/combat-and-conditions.md` §6 · `plans/magic-on-the-sheet.md` |
| `F`_n_ | Open design flag — a rules question the app must not answer | `SCHEMA.md` §5 |
| `D`_n_ | Shorthand used here for decision _n_ | `SCHEMA.md` §4 |
| `W`_n_ | Wishlist item — an idea, not a commitment; statuses live with the item | `WISHLIST.md` §1 |

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
| `A11` | `notes: "natural"` doubles as a type marker | **open** | plan S7 |
| `A12` | UI split by render/bind, not by screen | **open** | plan S7 |
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
| `C6`, `C8`, `C9` | Carried notes: dead code, audit growth, orphans | **open** | plan S7 |

### Open flags

Full text in `SCHEMA.md` §5; who can clear each is in `STATE.md` §3.

| Id | What | Needs |
|---|---|---|
| `F5` | Adv/Disadv audit flags — three of four closed by the CRB v4 pass. Remaining: Cyber-Prophe… | Design (after F6) |
| `F6` | Cyborg rewrite (NCI tiers, Set Bonuses, Kicker Dice, TOL pressure) — ships as `status: "… | Design |
| `F7` | SFR per archetype: Werewolf defined (WILL×3+N, RoU); Vampire Blood Pool TBD — 2026-09-10 meeting added unlocked direction | Design |
| `F8` | Stat Point roll conflict: WIP says flat "3d10+30" for all levels; REF table scales by pow… | Deighton — **wizard-blocking** |
| `F9` | Are the WIP's "General Milestones" shared across all archetypes (REF says General Majors… | Ken |
| `F12` | Minor Milestones pool sourced from REF (v3.5); WIP refers to an unwritten Advancement Sec… | Ken |
| `F13` | Vampire `canPurchaseAdvantages: false` is assumed from the Werewolf supernatural baseline… | Ken |
| `F18` | Weapons/Armor/Defense — catalog merged (Decision 92), Conditions done (Decisions 95–96), hit resolver done (Decision 99), Loadout and recovery done (Decision 100); only the MD1/2/3 ratings are left | Design (small gap) |
| `F19` | Cyborg install cost mechanism — Sanity erosion vs. temporary Health Level cost, still undecided (Scott unsure which) | Design |
| `F23` | RES against Electric and Burning (stubbed as Energy), and where the Resistance upgrade's 50% sits (not applied) | Deighton |
| `F24` | Ongoing damage while Dying at a Reset: one Death Mark per ticking source standing in for the check (stub), or the check plus a mark per source | Deighton |
| `F25` | How Natural Armor answers a hit: stubbed as flat, after PROT and RES, anywhere, Kinetic unless Warded, ignores AP, skipped by Massive | Deighton |
| `F26` | Does a shotgun count as a rifle for the Scope and the Angel Mod? Stubbed: no | Deighton |
| `F28` | Suppression (weapon tag): no rule anywhere in the CRB | Deighton |
| `F29` | Blast (weapon tag): how it differs from Area and Siege | Deighton |
| `F30` | Anti-Materiel (weapon tag): what it does to a person | Deighton |
| `F31` | Reach (weapon tag): what it adds to the Reach column | Deighton |
| `F32` | Arcanist Major Milestones: bring in REF_CRB's, or wait for 041? | Ken |
| `F33` | Jack of All Trades: does "treated as Focused" raise every skill's starting cap, and open Skill Paragon to any skill? Stubbed: the price only | Deighton |

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
- **2** — Terminology: stat pool = Stat Points (old "Character Points" column); old "Freebie Points" = Character Points (CP).
- **3** — Max Boost semantics: after advantages are bought, leftover CP may boost powers, skills, or stats — but any single t...
- **4** — Costs at creation: Stat Points 1:1 (stats start at base 1, max 10).
- **5** — LUCK: everyone starts at 2.
- **6** — Health Levels: 1 HL per point of BOD, 5 HP per HL.
- **7** — Çredits: player rolls physically, enters result; pool = table formula.
- **8** — Skill checks: 1d10 + Rank + Primary Stat (full score) + Synergy Bonus (modifier).
- **9** — Derived attributes: TOL = 1 + INT/COOL/EMP mods (floor 1); WILL = 1 + BOD/INT/EMP mods (floor 1); SAN = EMP×10 (flo... → **superseded in part by 103 and 109**
- **10** — Hard caps: the wizard enforces all table limits strictly.
- **11** — All rolls are physical: the app never rolls dice for creation pools.
- **12** — Supernatural restriction: archetypes with canPurchaseAdvantages: false (Werewolf; Vampire assumed) cannot buy Advan...
- **13** — Milestone cadence: 1 Milestone Point per session; Minor at 5/15/25…, Major at 10/20/30…; 10 IP per session (WIP Pro...
- **14** — IP costs: stat increase = current value ×10; skill rank = 5× current (Focused 3×); skills/powers cap at rank 10 via... → **superseded in part by 97**
- **16** *(Phase 2)* — Ranked Advantages cost cost per rank (Archery Master rank 2 = 12 CP).
- **18** *(Phase 2)* — Arcanist focus-stat bonus may push a stat past 10; the modifier curve extrapolates +1 per point above 10. → **superseded in part by 98**
- **19** *(Phase 2)* — Arcanist Disciplines are purchasable in the CP step at 6 CP/rank, capped at the power level's Max Power Rank.
- **64** *(B3)* — 1 Health Level per BOD is an invariant, not a tunable.
- **66** *(B8)* — The two Pain Level floors are numbers the engine carries and the sheet states.
- **67** *(B9)* — The milestone cadence comes from the data, once.
- **135** *(Audit S4 — A8, A9)* — A data field is read by code or named as text; formulas and paths are numbers the engine reads (`{ stat, times, plus }`, `dataPath`); fields restating the code are deleted; no archetype id in code. The R6 key guard enforces it.
- **98** *(Design-team rulings, part 2)* — Stats past 10: +5 at 11–15, +1 per 5 after. F20–F22 closed: Skill Checks only, a −8 cap on one roll, only Injured/Maimed take a body part. Plan CQ4–CQ7/CQ10 answered for Session 3.
- **97** *(Design-team rulings)* — F1/F2 confirmed 1:1 CP, F17 confirmed stacking; F14: a new skill after creation costs a flat 25 IP. F8 stays open.
- **99** *(Taking a hit — combat plan Session 3)* — `resolveHit` is pure, `applyHit` is one undoable action. PROT + matching RES; AP and Compromised skip RES; a fully soaked hit costs 1 INT. Massive strips INT, removes HL from the right (counted as lost), +1 with no armor left; Shock at ⌈½ max HL⌉ of levels this hit took; At Zero / Death Mark while Dying. F23 opened. → **superseded in part by 100 and 112**
- **100** *(Loadout & recovery — combat plan Session 4)* — Catalog pickers with Add/Buy, one worn piece per slot, upgrades by slot and quality; weapon lines (attack = skill check, ACC apart, `BOD+X` resolved). Wear, repair, Rest, Focused Healing (the only way back for Massive levels and Injured), Turn Reset (ticks aren't hits: no armor, no Shock). Stand-in armor gone. F24 opened. → **superseded in part by 104 and 105**
- **104** *(Natural Armor — combat plan cleanup)* — One derived value from `grants` on advantages, Major Milestones and specializations; conditional sources (Iron Shirt, a waning moon) shown, never summed, asked for on a hit. How it answers a hit is the F25 stub. Print's Nat column fills. `migrate()` drops junk held entries.
- **105** *(Nanomed Kit — CQ12)* — 054's list is the master: clears Agonized, Bleeding, Paralyzed, Poisoned and stabilizes the Dying; proposes floor(BOD / dose) HP; a third kind in `heal()`.
- **103** *(Deighton's TOL ruling)* — TOL = 1 + INT/BOD/COOL mods (floor 1), was INT/COOL/EMP; WILL and SAN unchanged. Data only; the CRB's rewritten example is pinned in `rules.test.mjs`. → **superseded in part by 109**
- **96** *(Conditions — the numbers)* — Pain = HL band + Condition Pain, clamped 0–3; a flat Condition penalty lands on every Skill Check; attack/defense and conditional penalties are shown, never summed. → **superseded in part by 107 and 110**

### Content & the CRB

Where game text comes from and how it is merged.

- **55** *(CRB v4 content pass)* — Skills, Advantages and Disadvantages re-merged from the CRB.
- **56** *(CRB v4 content pass)* — Martial Arts: two styles at creation, more trainable in play.
- **57** *(CRB v4 content pass)* — Rank tables stay prose; rankTable waits for the renderer.
- **65** *(Mechanism 3)* — The rulebook's worked examples run as tests.
- **84** *(Docs)* — Nine CRB v4 chapters are mirrored into `docs/reference/crb/`.
- **113** *(Quick Study's Intuition — F11)* — Quick Study's prerequisite is the Intuition skill at Rank 1, per 041; the old "Intuition Advantage" matched no entry, so no one could take it.
- **129** *(Hardcore Parkour's prerequisites — F27)* — 1 Major Milestone, Acrobatics 4 and Danger Sense 1; Cat Like Balance becomes Acrobatics 4, Time Sense is dropped (Deighton).
- **136** *(A spell's forms — the Inscribed Spells)* — A spell lists the Disciplines it can be made with (default: all three, Magic's Three Forms); its tier and `th` stay, and another form's TH and time come from `enchantmentTimeTable`. Inscribed-only spells aren't starting spells, and Mastery prices their own TH.

### Archetypes & specialization

The generic archetype structure, and the pick that defines one.

- **15** — Archetypes: generic six-block structure (Power Scaling, Baseline Traits, Specialization, Core Mechanic, Powers & Vu...
- **17** *(Phase 2)* — Professional natural advantages are stored as normal advantages entries with notes: "natural" and cost 0 CP — they...
- **20** *(Phase 2)* — Aberration prose benefits display as reference text only; only structured fields (e.g.
- **21** ~~*(Phase 2)* — Common-spell selection is deferred to Phase 3; the wizard shows the computed count (TOL + 2d4) only.~~ → **superseded by 25**
- **58** *(CRB v4 content pass)* — The Phase 4 selection system is now specified by the rulebook rather than proposed — and none of it is encoded yet. → **superseded in part by 77 and 87**
- **77** *(Batch 3)* — One selection system, three hosts.
- **78** *(Batch 3)* — The mechanical picks are the app's business; the fiction is the table's.
- **79** *(A3 — closes A1 and A2)* — One specialization model, and the count comes from the data.
- **126** *(Option powers — B17)* — `starterPower`/`additionalPowers` render from the data; an array of plain objects on a power is a table; no text means "not written yet".
- **134** *(Audit S3 — B12–B14)* — Focused Skills are data (`ids`, a category `choose`, an `all` price), read by one generic reader; the Focused cap and the IP prices are numbers the engine reads.

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
- **128** *(Intake number and replace guard — B18)* — `meta.id` is a permanent NYTE City intake number (schema 0.11); `meta.updated` is last changed; Import, New and Lock ask before replacing a different or newer character, with Export first. → **superseded in part by 133**
- **133** *(The TAG)* — `meta.id` is `TAG-XXXX-XXXX-XXXX`, shown as itself; a 0.11 `NCR-` number keeps its twelve characters under the new prefix; schema 0.12.

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

The nine-tab running sheet, damage, IP, milestones, sessions.

- **23** *(Phase 3)* — Logging a session auto-grants the per-session IP (10 per WIP Professional cadence, overridable per session), 1 Mile...
- **24** *(Phase 3)* — Pain Level penalties are applied to every displayed skill-check total, with the reason shown inline (breakdown colu...
- **25** *(Phase 3)* — The Grimoire is a free-entry table. → **superseded in part by 108**
- **26** *(Phase 3)* — Un-modeled effects (milestone benefits, aberration prose, items) are applied through a manual adjustments ledger: s...
- **27** *(Phase 3)* — The IP journal is the audit trail: entries are spend or grant; spends update the target's IPE atomically; the last... → **superseded in part by 49**
- **29** *(Phase 3)* — Milestone enforcement: Minor duplicates blocked until all five have been selected once; Major prerequisites are mac...
- **30** *(Phase 3.1)* — The locked sheet is tab-driven, not a single scroll.
- **31** *(Phase 3.1)* — Iconography lives in shadows-icons.js (see §1).
- **32** *(Phase 3.1)* — The Main tab is a full-width "command console" — the duplicated Vitals rail is hidden on Main only (an .app.main-ta... → **superseded in part by 35**
- **35** *(Phase 3.2)* — Full-width sheet on every tab.
- **36** *(Phase 3.2)* — Four-sphere stat layout on Main.
- **37** *(Phase 3.2)* — Vitals flyout drawer.
- **38** *(Phase 3.2)* — Sticky in-header navigation. → **superseded in part by 140**
- **39** *(Phase 3.2)* — Header overflow menu.
- **40** *(Phase 3.2)* — Collapsible page footer.
- **41** *(Phase 3.2)* — Number-entry caret fix.
- **43** *(Phase 3.2)* — Date-input theming.
- **44** *(Phase 3.2)* — Skills aligned + per-skill descriptions.
- **45** *(Phase 3.2)* — Traits collapsible.
- **46** *(Phase 3.2)* — Progression collapsible.
- **52** *(Phase 3.3)* — Main health as HL segments; TOL/WILL derivation surfaced.
- **83** *(Batch 3a)* — The ledger's ✓ meant "no errors," not "nothing left to do."
- **89** *(Print view)* — A printable sheet is a second rendering path, not a second data model.
- **90** *(Light theme)* — A light theme toggle, ported as a mechanism rather than a token set.
- **94** *(Print sheet — visual redesign)* — The front page moves to a case-file layout and starts drawing from Scott's real Affinity artwork; Health Levels groups into Pain Level bands; Skills becomes two panels with Primary/Synergy icon badges.
- **106** *(Cascade and Aberrations — Magic-tables side session)* — Magic.md's two tables and the Appendix's 39 Aberrations are data; `Engine.cascade()` reads the player's dice. The Arcanist gets a TOL Spent tracker (it had none after 93), whose Cascade panel writes the result into Notes. Schema unchanged. → **superseded in part by 110 and 115**
- **107** *(Sheet feel — wishlist pass)* — W7 `--on-accent` text on filled controls with a both-themes contrast guard; W11 Heal/Hurt stepper; W12 an undo toast on every `commit()`, matched to its audit entry by identity; W14 a Condition chip palette, and Main's chips open their details.
- **108** *(The Grimoire reads the book — magic plan Session 1)* — Book rows store `{ spellId, stage, notes }`, your own rows are typed columns (`custom`); schema 0.9, migrate never links. `Engine.grimoire()`, Spell Power, Mastery = 30 IP × TH through the IP journal (TH − 1), a picker that shows the numbers first, Link to the book. Spell Attack left for a ruling. → **superseded in part by 111 and 136**
- **109** *(Deighton's magic rulings)* — Starting spells gated by TH ≤ Evocation rank (MQ1); Drained −2 max TOL (never below 0), current unchanged either way, so TOL Spent −2 on / +2 off (MQ2); Phantom Pain PL 1 at full health (MQ3); Spell Attack = Evocation + raw REF + raw WILL. Docs only; built by the plan's sessions.
- **110** *(Aberrations on the character, and the Magic reference — magic plan Session 2)* — `trackers.aberrations` holds `{ id, permanence, note? }`, one per id; the catalog's `painLevels` (Phantom Pain) and `adjust` (Drained, max TOL −2, floor 0) are read every time, and every tracker on `max: "TOL"` shifts so current TOL never moves. Record it = note + Aberration in one undo. Spell Attack from the scores. A `reference` panel type (the Arcanist's Magic reference). Unique Aberrations synced to 041. → **superseded in part by 115**
- **111** *(Starting spells in the wizard, and the spell picker modal — magic plan Session 3)* — TOL + the power level's roll of book spells, chosen on the Character Points step where Evocation and TOL are final; at creation TH ≤ Evocation rank, after lock nothing gates it and a TH beyond the pool is marked (exploding 10s only). Picks are Grimoire rows; no schema bump. The picker is a native `<dialog>` modal shared by sheet and wizard — the first focus-and-dismiss primitive.
- **114** *(Jump bars — W5, W22)* — `sectionList` headings feed a bar that jumps to each section a page drew (archetype panels included) and focuses it; step 7's bar sticks, filters Advantages/Disadvantages keeping what you hold, and shows the CP left.
- **115** *(The GM runs the Cascade)* — The Cascade panel gives the instruction (d10 + Rupture degree, tell your GM) and opens one Aberration picker, a modal of cards with each one's text, also used by Trackers' Add. The pick's note is dated; nothing goes into Notes. `recordCascade`/`logCascade` removed; the tables stay in the reference.
- **116** *(Spell tag AP)* — `AP` on a spell means Armor Piercing, as the weapon tag does (skips RES, PROT still rolls). Unflagged; Iron Lance's own effect already said so.
- **112** *(Modals, the skill line and Trackers' layout — wishlist pass)* — The modal gains a sticky footer and is centred; W6 Take a hit in the modal, Apply disabled with its reason; W23–W26 row click, dimmed rows that say why, sticky search, Done; W20/W21 a skill's stats as icons with the character's numbers; W1/W10 Trackers in two columns, the HL track in Damage banded by Pain Level.
- **117** *(Let a hit land — W15)* — `commit()` notes when damage went up; the next render flashes the HP readouts and the Health Level boxes that took it, twice on Pain if its level rose, once only, never on heal or undo, none under reduced motion.
- **118** *(The catalog browser — W4)* — Loadout's pickers are a modal: search, section, What I can afford, sort, and every number before Add/Buy from `Engine.catalogLine()`, the reader Loadout's own rows share. Buy says why it's off; a row click opens its details.
- **119** *(Vitals popovers — W2, W3)* — HP, Pain/Cond, SAN, LUCK and Ç on the vitals bar and Main's cards open a popover (`openPopover`, non-modal, follows the render) holding Trackers' own controls, bound by the one `bindVitalControls(root)`; Take a hit hands over to the hit modal.
- **120** *(Weapon mods and rounds — W16)* — Schema 0.10: `weapons[i].mods` and `roundsSpent`. Single/Burst/Full Auto spend 1/3/10 (053) from a capacity read as its number + chambered round; Fire and Reload on Loadout and Main. Mods fill fixed slots, fit per data (`onlyFor`/`notFor`), add tags and damage; a sight's ACC is aimed, apart from Single's. F26 opened.
- **121** *(Equipment you carry — W17, W27)* — `equipment` (116, Gear's Equipment + Magic's Tools of the Trade) and schema-0.10 gear rows `{ id, qty, chargesUsed? }` or typed; stackable consumables with Use one, Talismans with charges and their spell; Nanomed/Speed Heal/Field Repair Kit take from what you carry in the same action. The browser's third catalog.
- **122** *(Main is the fight view — W13)* — Main's Combat column leads with the weapons you carry (Fire/Reload), then the armor, then the combat skills; no separate fight mode, and no invented Defense number.
- **139** *(Rules a tap away — A10, C5, AQ4)* — one tip primitive reads tags (`Engine.glossary`), stat ranges and rules text on hover or tap; Lineage, How a check works and the whole Magic reference render; Ammo is an equipment category; `notice()` and `askFirst()` replace `alert()` and `confirm()`.
- **140** *(The header — B19, AQ10)* — two thin rows: the name with ⋮ and theme, then the tabs in one line that scrolls sideways (active tab kept in view, fades, mouse wheel); a long name ends in "…", the `Shadows //` prefix goes below 480 px, and the header un-sticks below 540 px tall.

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
- **86** *(Repository)* — Decision 54's deferred refactor lands: `src/ui/app.js` splits into four classic scripts.
- **101** *(Docs)* — The batch board leaves `STATE.md` for `docs/log/shipped.md`, and unscheduled ideas get `docs/WISHLIST.md`.
- **102** *(Docs)* — A decision that replaces another marks it in the same change — in SCHEMA §4 and here — and a test holds the two together.
- **127** *(STATE's suite line — AQ2)* — STATE states the todo count only; no pass total, no live version.
- **130** *(Decisions that stay decided — R1, AQ1)* — an entry is the decision, a *Touches* line, and Decided · Why · Rejected · Replaces · Revisit if · Built, in about 25 lines; search the Touches lines before proposing; the load-bearing fourteen are backfilled.
- **131** *(Change tiers — R2)* — what each kind of change must touch; STATE and the log move when the tier says so, not on every change.
- **132** *(One orientation path — A4, C10, C11)* — `CLAUDE.md` → `STATE.md` → `INDEX.md`; `docs/README.md` and the HANDOFF stub go; retired text goes verbatim to `log/archive.md`; SCHEMA is §1–§5.
- **137** *(Fonts embedded — C7, AQ6)* — the brand fonts are WOFF2 data URIs in a generated `fonts.css`, so the app makes no network request; big numbers are Oxanium (`--numeric`), headers keep the display face; build tests hold both.
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
