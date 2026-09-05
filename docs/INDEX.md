# Index — where everything is

A lookup table, not a document to read. `STATE.md` tells you **what is happening**;
this tells you **where a thing is written down**. It exists because the decision
ledger passed eighty entries, and because the ids referenced everywhere — `A1`,
`B7`, `C2`, `F8` — are each defined in exactly one place that is not obvious.

Generated summaries are one line each and deliberately lossy — they are for
*finding* a decision, never for citing one. `SCHEMA.md` §4 is the text that counts.

---

## 1. I'm looking for…

| I want to know | Go to |
|---|---|
| What's next, what's blocked, who can clear it | **`STATE.md`** §2 and §3 |
| Why a past decision was made | `SCHEMA.md` §4 — find the number in §3 below |
| What an id like `A1` / `B7` / `C2` means | §2 below |
| What an open flag `F8` is waiting on | §2 below, then `SCHEMA.md` §5 |
| The shape of the game data or a character file | `SCHEMA.md` §2 and §3 |
| What a batch will contain and why it is ordered that way | `SCHEMA.md` §6 (roadmap) |
| What a past session cost, and what to watch for | `docs/log/2026.md` |
| Whether a string is allowed to say that | `VOICE-APP.md` |
| Whether the current WIP text already answers an open flag | `docs/reference/crb/README.md` |
| What shipped in a release | `../CHANGELOG.md` — backward-looking only |
| How to work on this repo at all | `../CLAUDE.md` |

**The trap worth naming:** `CHANGELOG.md` never describes upcoming work, and
`STATE.md`'s board is one line per batch. The *reasoning* for a batch — what it
contains and why it is split that way — lives in **`SCHEMA.md` §6**.

---

## 2. Id registry

Four namespaces. Each id is defined in exactly one place and referenced everywhere.

| Prefix | Means | Defined in |
|---|---|---|
| `A`_n_ | Architectural finding — a design that has drifted | `audits/2026-06-16_rev9-whole-app-audit.md` §1 |
| `B`_n_ | Bug / correctness finding | same audit, §2 |
| `C`_n_ | Carried note — real but not yet actionable | same audit, §3 |
| `F`_n_ | Open design flag — a rules question the app must not answer | `SCHEMA.md` §5 |
| `D`_n_ | Shorthand used here for decision _n_ | `SCHEMA.md` §4 |

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

### Open flags

Full text in `SCHEMA.md` §5; who can clear each is in `STATE.md` §3.

| Id | What | Needs |
|---|---|---|
| `F1` | LUCK buy-up cost in CP per point (stubbed 1:1, flagged in data) | Deighton |
| `F2` | CP boost exchange rate across skills/stats/powers (stubbed 1:1, flagged) | Deighton |
| `F5` | Adv/Disadv audit flags — three of four closed by the CRB v4 pass. Remaining: Cyber-Prophe… | Design (after F6) |
| `F6` | Biomech rewrite (NCI tiers, Set Bonuses, Kicker Dice, TOL pressure) — ships as `status: "… | Design |
| `F7` | SFR per archetype: Werewolf defined (WILL×3+N, RoU); Vampire Blood Pool TBD | Design |
| `F8` | Stat Point roll conflict: WIP says flat "3d10+30" for all levels; REF table scales by pow… | Deighton — **wizard-blocking** |
| `F9` | Are the WIP's "General Milestones" shared across all archetypes (REF says General Majors… | Ken |
| `F11` | Quick Study milestone requires an "Intuition Advantage" — Intuition is a Skill in the cat… | Ken |
| `F12` | Minor Milestones pool sourced from REF (v3.5); WIP refers to an unwritten Advancement Sec… | Ken |
| `F13` | Vampire `canPurchaseAdvantages: false` is assumed from the Werewolf supernatural baseline… | Ken |
| `F14` | Skill IP cost at rank 0: "5 × current rank" prices learning a new skill (0→1) at zero. Ap… | Deighton |
| `F16` | Hemophiliac calls for a "First Aid Skill Check"; the catalog skill is Medical. Field Medi… | Ken |

There is also one **unnumbered** flag, which is why it is easy to lose: `statMod()`
extrapolates +1 per point above 10 while `statRules.beyondHumanLimits` says gains
"slow down" past 10. It exists only as a code comment in `engine.js`.

---

## 3. Decisions by topic

Every entry in `SCHEMA.md` §4, grouped by subject. The number is the thing to
look up — these lines are signposts, not the decision.

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
- **9** — Derived attributes: TOL = 1 + INT/COOL/EMP mods (floor 1); WILL = 1 + BOD/INT/EMP mods (floor 1); SAN = EMP×10 (flo...
- **10** — Hard caps: the wizard enforces all table limits strictly.
- **11** — All rolls are physical: the app never rolls dice for creation pools.
- **12** — Supernatural restriction: archetypes with canPurchaseAdvantages: false (Werewolf; Vampire assumed) cannot buy Advan...
- **13** — Milestone cadence: 1 Milestone Point per session; Minor at 5/15/25…, Major at 10/20/30…; 10 IP per session (WIP Pro...
- **14** — IP costs: stat increase = current value ×10; skill rank = 5× current (Focused 3×); skills/powers cap at rank 10 via...
- **16** *(Phase 2)* — Ranked Advantages cost cost per rank (Archery Master rank 2 = 12 CP).
- **18** *(Phase 2)* — Arcanist focus-stat bonus may push a stat past 10; the modifier curve extrapolates +1 per point above 10.
- **19** *(Phase 2)* — Arcanist Disciplines are purchasable in the CP step at 6 CP/rank, capped at the power level's Max Power Rank.
- **42** *(Phase 3.2)* — LUCK refresh confirmed — no change.
- **64** *(B3)* — 1 Health Level per BOD is an invariant, not a tunable.
- **66** *(B8)* — The two Pain Level floors are numbers the engine carries and the sheet states.
- **67** *(B9)* — The milestone cadence comes from the data, once.

### Content & the CRB

Where game text comes from and how it is merged.

- **55** *(CRB v4 content pass)* — Skills, Advantages and Disadvantages re-merged from the CRB.
- **56** *(CRB v4 content pass)* — Martial Arts: two styles at creation, more trainable in play.
- **57** *(CRB v4 content pass)* — Rank tables stay prose; rankTable waits for the renderer.
- **65** *(Mechanism 3)* — The rulebook's worked examples run as tests.
- **84** *(Docs)* — Nine CRB v4 chapters are mirrored into `docs/reference/crb/`.

### Archetypes & specialization

The generic archetype structure, and the pick that defines one.

- **15** — Archetypes: generic six-block structure (Power Scaling, Baseline Traits, Specialization, Core Mechanic, Powers & Vu...
- **17** *(Phase 2)* — Professional natural advantages are stored as normal advantages entries with notes: "natural" and cost 0 CP — they...
- **20** *(Phase 2)* — Aberration prose benefits display as reference text only; only structured fields (e.g.
- **21** *(Phase 2)* — Common-spell selection is deferred to Phase 3; the wizard shows the computed count (TOL + 2d4) only.
- **58** *(CRB v4 content pass)* — The Phase 4 selection system is now specified by the rulebook rather than proposed — and none of it is encoded yet.
- **77** *(Batch 3)* — One selection system, three hosts.
- **78** *(Batch 3)* — The mechanical picks are the app's business; the fiction is the table's.
- **79** *(A3 — closes A1 and A2)* — One specialization model, and the count comes from the data.

### Character file & migration

The saved `.shadows.json`: shape, versions, upgrades.

- **28** *(Phase 3)* — Character schema bumped to 0.3.
- **34** *(Phase 3.1)* — No schema bump.
- **47** *(Phase 3.2)* — No schema bump.
- **53** *(Phase 3.3)* — Character schema → 0.4.
- **63** *(B6)* — migrate()'s completeness is the migration guarantee.
- **68** — When gamedataVersion bumps — and when it must not.
- **75** *(Versioning)* — Four versions, four triggers — and schemaVersion stopped meaning two things.

### Engine contracts

Promises the engine makes and the guards behind them.

- **22** *(Phase 2)* — Engine normalizes legacy stat-id aliases in skill data (e.g.
- **59** *(B2)* — Legacy stat aliases point at live stat ids, and normStat verifies its own target.
- **60** — Engine.undoIP is removed, not deprecated.
- **62** *(Batch 1)* — The engine has a totality contract, and now something enforces it.
- **80** *(Batch 3)* — Two realms, one trap, written down.
- **81** *(Batch 3)* — A stale natural advantage no longer survives a subtype change.
- **82** *(Batch 3, post-review)* — A trait held twice is still one trait — and an adversarial review found it.

### Sheet & play tracking

The nine-tab running sheet, damage, IP, milestones, sessions.

- **23** *(Phase 3)* — Logging a session auto-grants the per-session IP (10 per WIP Professional cadence, overridable per session), 1 Mile...
- **24** *(Phase 3)* — Pain Level penalties are applied to every displayed skill-check total, with the reason shown inline (breakdown colu...
- **25** *(Phase 3)* — The Grimoire is a free-entry table.
- **26** *(Phase 3)* — Un-modeled effects (milestone benefits, aberration prose, items) are applied through a manual adjustments ledger: s...
- **27** *(Phase 3)* — The IP journal is the audit trail: entries are spend or grant; spends update the target's IPE atomically; the last...
- **29** *(Phase 3)* — Milestone enforcement: Minor duplicates blocked until all five have been selected once; Major prerequisites are mac...
- **30** *(Phase 3.1)* — The locked sheet is tab-driven, not a single scroll.
- **31** *(Phase 3.1)* — Iconography lives in shadows-icons.js (see §1).
- **32** *(Phase 3.1)* — The Main tab is a full-width "command console" — the duplicated Vitals rail is hidden on Main only (an .app.main-ta...
- **33** *(Phase 3.1)* — Fixed: the REF/Hand brand icon rendered as a solid blob.
- **35** *(Phase 3.2)* — Full-width sheet on every tab.
- **36** *(Phase 3.2)* — Four-sphere stat layout on Main.
- **37** *(Phase 3.2)* — Vitals flyout drawer.
- **38** *(Phase 3.2)* — Sticky in-header navigation.
- **39** *(Phase 3.2)* — Header overflow menu.
- **40** *(Phase 3.2)* — Collapsible page footer.
- **41** *(Phase 3.2)* — Number-entry caret fix.
- **43** *(Phase 3.2)* — Date-input theming.
- **44** *(Phase 3.2)* — Skills aligned + per-skill descriptions.
- **45** *(Phase 3.2)* — Traits collapsible.
- **46** *(Phase 3.2)* — Progression collapsible.
- **52** *(Phase 3.3)* — Main health as HL segments; TOL/WILL derivation surfaced.
- **83** *(Batch 3a)* — The ledger's ✓ meant "no errors," not "nothing left to do."

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

### Repository & docs

How the project itself is organised.

- **54** *(Phase 3.4)* — The app becomes a repository.
- **61** *(B5)* — The review step's number derives from creationFlow.steps.
- **74** *(Docs)* — HANDOFF.md is retired, and volatile facts live in exactly one place.
- **86** *(Repository)* — Decision 54's deferred refactor lands: `src/ui/app.js` splits into four classic scripts.

---

## 4. Keeping this file honest

`tests/docs.test.mjs` checks that **every decision number in `SCHEMA.md` §4 appears
here exactly once**, and that every `F`-number open in §5 has a row in §2. Add a
decision without indexing it and the build fails — which is the only reason to
trust an index at all.

The one-line summaries are generated from the first sentence of each decision.
If one reads badly, fix the decision's opening sentence in `SCHEMA.md` rather than
the line here — the ledger is the master.
