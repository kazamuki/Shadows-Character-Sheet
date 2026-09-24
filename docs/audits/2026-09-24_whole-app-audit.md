# Whole-App Audit: app 0.23.0

**Date:** 2026-09-24 · **Build audited:** `main` at `af73d40` (app `0.23.0` · game data `0.16` · character schema `0.10`)
**Asked for by:** Ken. A wide-net review of the whole app and how it's made: code, data, docs, process, tooling, and `CLAUDE.md`. **This is documentation only.** Nothing in `src/`, `tests/` or `tools/` changed. What to do about each finding is in [`docs/plans/audit-2026-09-remediation.md`](../plans/audit-2026-09-remediation.md), and every step in it waits on Ken's yes.

---

## 0. How to read this

**Ids continue the rev 9 audit's numbering**, so each prefix keeps the single meaning `INDEX.md` §2 gives it. rev 9 used A1–A3, B1–B10 and C1–C3; this audit starts at **A4**, **B11** and **C4**. It adds one new namespace:

| Prefix | Means |
|---|---|
| `A`_n_ | Architectural finding: a design that has drifted, in the code, the data or the docs system |
| `B`_n_ | Bug or correctness finding: something a player or maintainer gets wrong today |
| `C`_n_ | Carried note: real, but low severity or not actionable yet |
| `R`_n_ | **New.** Recommended practice: a way of working worth adopting. Not a defect, and not a decision until Ken adopts one and it's numbered |
| `AQ`_n_ | **New.** A question this audit raises for Ken. Listed in the plan's §5, like `CQ`/`MQ` in the other plans |

**Evidence tags.** **[run]** means the audit executed something and watched it happen: a probe script against the engine, the jsdom harness, or the built file in headless Chromium. **[read]** means it was found by reading the source, with the line cited. Line numbers are as of `af73d40`.

**Severity.** **High**: a player loses data, sees something wrong, or can be attacked. **Med**: a real defect or drift that costs time or trust. **Low**: tidy-up.

---

## 1. The 50,000-foot view

**The code is healthy, and the engine is the best thing in the repo:** pure, total, data-driven almost everywhere, and pinned to the CRB's own worked examples. The app held up under most of what the audit threw at it: 266 tests, a hostile character file on all nine tabs (Admin mode is the one miss, B16), offline from `file://`, and tab switches under 75 ms. None of the findings below question the architecture's founding choices (`file://`, classic scripts, store inputs, the generic audit diff). §9 lists what to keep.

Three things are wrong at the macro level, in this order:

1. **The documentation system has become heavier than the code it documents, and it drifts where its tests don't reach.** There are 8,234 lines of hand-maintained docs against 7,612 lines of code. A one-line data change carried about 30 lines of doc edits across five files, and some pull requests exist only to record that a release went live. Meanwhile `README.md`, `CONTRIBUTING.md`, `docs/README.md`, and `SCHEMA.md`'s header, §1, §2 and §6 are all stale in ways no test checks. The guard-rail tests are good. The problem is how many places restate things. **A4–A7.**

2. **"Game data drives the app" is partly nominal.** Two of the three built archetypes still need code by name (`"arcanist"`, `"professional"`, `"evocation"`). The Professional's rules are parsed out of English sentences. Several data fields look like live settings but the engine hardcodes the number beside them, which is the exact class rev 9's B3 closed once. About 9% of the data (24 KB) is merged content no player can see. **A8–A10.**

3. **Conformance tests cover what was built, not what the CRB says.** The Professional has three rules the CRB states plainly, the data carries, and the app doesn't do (**B12–B14**). None of them is flagged, logged or ruled. They surfaced only because this audit probed the engine directly. One Major Milestone can never be taken (**B15**), and one origin's starting power never renders (**B17**).

Separately, three things are worth fixing soon on their own merits: **B16** (a crafted character file can run script once Admin mode opens), **B18** (importing a file silently replaces the sheet saved in the browser), and **B11** (mastering a spell makes the app accuse the player of hand-editing their file).

---

## 2. How the app works today: what makes it tick

This section is a map, not findings. It exists so the findings have something to point at, and because Ken asked for the whole picture.

### 2.1 At run time

```
index.html (shell, 42 lines)
  ├─ src/ui/theme-init.js          sets data-theme before first paint
  ├─ src/data/shadows-data.js      window.SHADOWS_DATA      51 top-level sections, 337 KB
  ├─ src/data/shadows-changelog.js window.SHADOWS_CHANGELOG generated from CHANGELOG.md
  ├─ src/data/shadows-icons.js     window.SHADOWS_ICONS
  ├─ src/engine/engine.js          const Engine = (() => { … })()   ~120 exported functions, no DOM
  └─ src/ui/  shared.js → wizard.js → sheet.js → app.js   one global scope, boot() last
```

- **State** is one global `S` (`screen`, `ch`, `step`, `section`, `admin`, and the transient forms). Every change re-renders `#main` from templates (`innerHTML`), then re-binds handlers.
- **Every play action** goes through `commit(kind, label, fn)` (`shared.js:81`). It clones the character, runs the mutation, records a structural diff in `ch.audit` (`Engine.recordAction`), saves to `localStorage`, re-renders, and offers an undo toast. Undo pops the last diff.
- **Storage** is two slots: `shadows.draft.v1` (the wizard) and `shadows.active.v1` (the live sheet). Files move in and out as `.shadows.json` via Export/Import. Lock exports a file automatically.
- **Every load path** runs `Engine.migrate()`, which backfills against `newCharacter()`'s shape (Decision 63). Import and resume also run `versionCheck()`.

### 2.2 The data file, section by section

What each part of `shadows-data.js` holds and which layer reads it: **E** is the engine, **U** the on-screen UI, **P** the print sheet. Sizes are JSON bytes.

| Section | Entries | KB | E | U | P | Notes |
|---|---|---|---|---|---|---|
| `spells` | 96 | 49.1 | E | U | | the Book of Known Spells |
| `archetypes` | 5 | 26.3 | E | U | P | `lore`, `growth`, `powersNote` etc. never render (A10) |
| `equipment` | 116 | 25.0 | E | U | | Gear + Magic shops (Decision 121) |
| `advantages` / `disadvantages` | 57 / 30 | 36.4 | E | U | P | host `picks`/`requires`/`grants` |
| `weapons` / `armor` | 54 / 37 | 28.9 | E | U | P | |
| `skills` | 36 | 16.1 | E | U | P | |
| `milestones` | 5 keys | 10.6 | E | U | P | |
| `aberrations` | 39 | 9.2 | E | U | P | |
| `weaponTagGlossary` | 29 | 5.8 | – | – | – | **never read**; four entries flagged (A7, A10) |
| `ammunition`, `arrowheads` | 9, 11 | 4.2 | – | – | – | **never read** (A10) |
| `weaponFeatureGlossary`, `spellTagGlossary` | 6, 8 | 1.7 | – | – | – | **never read** (A10) |
| `enchantment*` (3 sections) | – | 1.9 | – | – | – | **never read** (A10) |
| rules blocks (`armorRules`, `damageRules`, `conditionRules`, `recoveryRules`, `spellcraftRules`, …) | – | ~15 | E | U | some | a mix of numbers the engine reads and display text |
| `appCopy` | 8 keys | 0.5 | E | U | | state copy in voice (Decision 71) |
| `meta` | 4 keys | 4.9 | E | U | P | `meta.notes` is a growing changelog string (C10) |

**How it connects.** Content refers to other content by id. A weapon names its `skill`. An advantage's `picks` name skill ids and its `requires` names skills and advantages. Milestone prerequisites name advantages and other milestones. Equipment names a `spell`. Damage types name the `conditions` they inflict, and recovery rules name the ones they clear. The Professional's natural-advantage pool names advantage ids. **Almost all of these are ids. The Professional's focused skills are the one place that uses English names instead** ("Handguns", "2 Combat Skills (chosen at creation)"), and that is where B12–B14 come from. A sweep of every reference field this audit could find turned up one dangling id (B15) and those two prose entries.

**Four kinds of field share one file, distinguished by nothing but convention:**

1. rules the engine reads (`hpPerLevel`, `rofModes`, `grants`);
2. display text (`description`, `flavorLine`, `*Note`);
3. maintainer text (`flagNote`, which can't render: Decision 70);
4. **fields that look like the first kind but are really the second or are ignored** (A9).

The fourth kind is the one that bites.

**What the character file stores.** Inputs only, exactly as `SCHEMA.md` §3 describes. The audit trail is about 92% of a well-used file (C8).

### 2.3 How a change gets made today

```
branch (claude/* in practice) → code + tests
  → SCHEMA §4 decision (+ INDEX §3 line, + supersede marks)
  → STATE rewrite · log/2026.md entry · WISHLIST strike · CHANGELOG line → npm run changelog
  → version bumps in app.js · package.json · package-lock.json · README · STATE
  → npm run verify (≈74 s) → PR → merge → log/shipped.md row
  → tag locally (cloud can't) → release.yml + deploy-demo.yml → a PR recording "vX is live"
```

That is a lot of mechanical steps, and most can be generated or dropped (A6, R2, R4, R11).

---

## 3. Findings at a glance

| Id | Finding | Sev | Evidence | Plan |
|---|---|---|---|---|
| **A4** | Orientation spread across eight documents; the untested ones have drifted | Med | [read] | S2 |
| **A5** | The decision ledger is doing three jobs | Med | [read] | S2 |
| **A6** | Per-change documentation tax out of proportion to the change | Med | [run] git history | S2, S5 |
| **A7** | Seven flags have no F-number, so nothing tracks them; four are real Deighton questions | Med | [run] | S2 |
| **A8** | Archetypes still special-cased by id; the Professional's rules are parsed from prose | High | [read] + [run] | S3, S4 |
| **A9** | Data fields that look like settings but aren't read (B3's class, again) | Med | [run] key scan | S4 |
| **A10** | Merged content no player can see | Med | [run] key scan | S6 |
| **A11** | `notes: "natural"`: a free-text field doubles as a type marker | Low | [read] | S7 |
| **A12** | UI files split by render/bind, not by screen; a 440-line `bindSheet` | Low | [read] | S7 |
| **B11** | Mastering a spell makes the import check accuse the player of hand-editing | Med | [run] | S1 |
| **B12** | The Mercenary never picks its fifth Focused Skill | Med | [run] | S3 |
| **B13** | Focused Skill Max Bonus is never applied | Med | [run] | S3 |
| **B14** | Jack-of-all-Trades pays full price for every skill | Med | [run] | S3 |
| **B15** | Hardcore Parkour can never be taken: its prerequisite names an Advantage that doesn't exist | Med | [run] | **closed → F27** |
| **B16** | Admin mode renders two ids from the character file unescaped | High | [run] Chromium | S1 |
| **B17** | The Trueborn's Lunar Phase Blessing never appears anywhere | Med | [run] Chromium | S1 |
| **B18** | Import and New Character replace the browser's saved sheet without asking | High | [run] Chromium | S1 |
| **B19** | On a phone the sticky header covers 30% of the screen | Low (was Med, AQ10) | [run] Chromium | S6 |
| **C4** | Import warnings show once, then vanish on the next click | Low | [read] | S6 |
| **C5** | 33 `alert()`/`confirm()` calls outside the modal/toast system | Low | [read] | S6 |
| **C6** | Dead and history-shaped code | Low | [read] | S7 |
| **C7** | Offline, the brand fonts fall back to system fonts | Low | [run] | S5 (AQ6) |
| **C8** | Audit log growth and undo across a migration | Low | [run] | S7 |
| **C9** | `versionCheck` doesn't report every orphaned id | Low | [read] | S7 |
| **C10** | `meta.notes` in the game data is a changelog | Low | [read] | S2 |
| **C11** | Closed plans still host open work | Low | [read] | S2 |
| **C12** | The dev server listens on every interface and doesn't confine paths | Low | [read] | S5 |
| **C13** | The voice corpus renders the sheet for one archetype | Low | [read] | S1 |
| **C14** | Releases: GitHub's auto notes, one of two artifacts, two workflows building one tag | Low | [read] | S5 |
| **C15** | The smoke suite is 95% of `verify`'s wall time | Low | [run] | S5 |

The plan column names the session in the plan doc that would take it.

---

## 4. Architectural findings

### A4: Orientation is spread across eight documents, and the untested ones have drifted
**Med · [read]**

Where to start and what the project is gets told in `CLAUDE.md`, `docs/README.md`, `STATE.md`, `INDEX.md` §1, `README.md`, `CONTRIBUTING.md`, `SCHEMA.md`'s header and §1, and the `HANDOFF.md` stub. `docs.test.mjs` pins specific lines in STATE, README's status line and CLAUDE.md, and those have stayed true. **Everything the tests don't read has drifted:**

| Where | Says | True |
|---|---|---|
| `SCHEMA.md` line 3 | "Character schema 0.9 (game data 0.14)", "Phases 0–3 complete · 3.1 … 3.4" | 0.10 / 0.16; phases stopped meaning anything in August |
| `SCHEMA.md` §1 table | `src/ui/app.js` is "the app: creation wizard, sheet view, session tracking"; `index.html` is "a 31-line shell" | four UI scripts since Decision 86; 42 lines; no row for `print.css`, `theme-init.js`, `shadows-changelog.js` |
| `SCHEMA.md` §1 | "Any session of work on this project should start by reading this file" | `CLAUDE.md` and `STATE.md` both say never read it front to back |
| `SCHEMA.md` §2 example | `meta: { schemaVersion: "0.3" }`, `levelsPerBOD: 1`, `cpCostPerPoint: null // FLAGGED` | `gamedataVersion` (Decision 75); `levelsPerBOD` removed (Decision 64); `cpCostPerPoint: 1` |
| `SCHEMA.md` §2 panels | "Panel types will be finalized in Phase 2" | finalized long ago; types now include `grimoire` and `reference` |
| `SCHEMA.md` §5 preamble | "Sixteen objects … carry `flagged: true` as of 2026-09-22" | a volatile count outside STATE (it's 17 today) |
| `SCHEMA.md` §6 | a roadmap ending in "Session handoff protocol … Ken adds the latest versions to project knowledge" | pure history, duplicating `log/shipped.md`; describes the pre-repo workflow |
| `README.md` Layout | `ui/app.js  Wizard, sheet, session tracking`; STATE holds "the batch board" | four UI files; the board moved to `log/shipped.md` (Decision 101) |
| `CONTRIBUTING.md` | "Bump `meta.schemaVersion` in `shadows-data.js`"; "Tag a release when a phase closes: `v0.4.0-phase-3.3`"; the voice guide is "in the CRB project"; six hard constraints | `gamedataVersion`; tags are `vX.Y.Z`; mirrored at `docs/reference/`; CLAUDE lists nine; no mention of the changelog rule |
| `CLAUDE.md` Layout | "`index.html` Shell. 34 lines." | 42, and it's a count in the file that says it carries none |
| `CLAUDE.md` constraint 4 | "Script order is fixed: data → icons → engine → ui" | `build.test.mjs` enforces theme-init → data → changelog → icons → engine → ui |
| `INDEX.md` §2 | "Five namespaces" | six rows, plus `CQ`/`MQ` in the plans |
| `INDEX.md` §4 | the one-line summaries "are generated from the first sentence of each decision" | hand-written; no generator exists, and e.g. Decision 99's line doesn't match its first sentence |
| `docs/README.md` | "`tests/docs.test.mjs` enforces the three rules above" | it enforces the decision-index rule and F-numbered flags; the volatile-facts rule only for CLAUDE.md |

**Why it matters.** A cold session reads these files first. Each stale line is small, but the project's own rule (Decision 74) is that a doc which lies to the next session is a defect. The pattern is clear: **any fact stated in more than one place and not pinned by a test goes stale within weeks.** More tests is one answer. Stating each fact once is cheaper (R3).

**Direction.** One orientation path: `CLAUDE.md` → `STATE.md` → `INDEX.md`. `README.md` becomes the outside-world page and points in. `CONTRIBUTING.md` either shrinks to a pointer or becomes the human-contributor version of CLAUDE's rules, stating none of the volatile facts. `docs/README.md` merges into `INDEX.md` §1. The `HANDOFF.md` stub retires. `SCHEMA.md` keeps §2–§5 as the authority. Its header drops versions and phases, §1 is rewritten to the four-script reality, and §6 moves to `log/`.

**Partly closed 2026-09-24:** every stale fact in the table above is corrected, except the §5 preamble, the §6 roadmap, CONTRIBUTING's six constraints, and INDEX's "five namespaces" and "generated" claims. Those, and the structural half (one orientation path, and retiring or merging files), are S2.

### A5: The decision ledger is doing three jobs
**Med · [read]**

`SCHEMA.md` §4 has 123 entries in about 2,280 lines. Early entries are one to three lines. Recent ones are design documents: Decision 99 runs 101 lines, 100 runs 103, 110 runs 80, 111 runs 71, and eight more exceed 50. They carry implementation detail (function names, which test pins what, the PR review that amended it), which is what `log/2026.md` and the PR are for. INDEX already has a "Housekeeping: records, not choices" group for entries that decide nothing (33, 34, 42, 47). Phase labels ("*(Phase 3.2)*") persist on entries whose phase means nothing today.

**Why it matters.** The ledger is the one document everyone is told to trust ("the text that counts"). When one entry is a hundred lines, the decision inside it is hard to find, and supersession gets harder to see. Decision 102 exists because Decision 93 buried a formula that Deighton's TOL ruling later reversed.

**Direction.** Keep every existing entry and number: they're cited from code and tests. **From now on,** a decision is a short record: the choice, why, what it replaces, and consequences, capped at around 20 lines, with a link to the log entry or PR for the build detail (R1). Only choices get numbered: a rule, a data shape, an architectural rule, or a player-facing behavior someone could reasonably have chosen otherwise. A no-op version check is a log line, not a decision (R2).

### A6: The per-change documentation tax is out of proportion to the change
**Med · [run] (git history)**

- `d7c2463` ("the spell tag AP is Armor Piercing") changed **one line** of data and about **30 lines** of docs across five files: SCHEMA, INDEX, STATE, the log and the CHANGELOG.
- The last four feature commits touched **11–19 files each, 4–7 of them docs**.
- Several merged pull requests exist only to record a deploy or rename a heading: "v0.18.0 shipped", "v0.20.0 is live", "v0.21.0 is live", "0.23.0's section takes its tag's name".
- One new app version must be written in five places: `app.js`, `package.json`, `package-lock.json` (twice), `README.md`, `STATE.md`. A test keeps them equal, but it can't write them.
- 91 commits landed in the last three days. At that tempo, fixed per-change overhead dominates.

**Why it matters.** Two costs. Session time goes to bookkeeping instead of the app. And bookkeeping at this volume is exactly where the drift in A4 comes from: when there are ten places to update, the eleventh gets missed.

**Direction.** Change tiers that say what each kind of change must touch (R2). Generate what's mechanical: the version bump and the changelog check already exist, and the rest can too (R4). Drop the facts whose only reader is a test: STATE's exact test count and the "Live:" line (the tag and the footer already say it).

### A7: Seven flags have no F-number, so nothing tracks them
**Med · [run]**

17 entries in the data carry `flagged: true`. `docs.test.mjs` ties flags to SCHEMA §5 **by F-number**, so these seven are invisible to it, to §5, to INDEX §2, and to STATE §3:

- `weaponTagGlossary`: **Suppression, Blast, Anti-Materiel, Reach**. Each `flagNote` says "confirm with Deighton". These are four real rules questions that nobody is asking, because they appear in no question list. And the glossary never renders (A10), so no player sees the flag either.
- `archetypes[vampire]`, `archetypes[werewolf]`, `archetypes[arcanist].growth`: content-gap notes. Vampire and Werewolf partly overlap F7/F13, but nothing links them.

**Direction.** Every `flagged: true` gets an F-number or loses the flag. A test fails on a flag without one (R6). F27–F30 for the four tags go into the next grouped question to Deighton, alongside F23–F26.

### A8: "A new archetype is data, not code" doesn't hold for two of the three built ones
**High · [read] + [run]**

`CLAUDE.md` says adding an archetype should require zero app changes, and that a special case is a bug. Today:

| Where | Special case |
|---|---|
| `engine.js:211-216` `disciplineSpent` | `if (a.id!=="arcanist") return 0; const cost = 6;` |
| `wizard.js:423, 431` | "Disciplines — 6 CP per rank" and `bal.left>=6`: the same 6, restated in the UI |
| `engine.js:1717` `disciplineRanks` | `d.id==="evocation"` picks up `evocationStartingRank` |
| `engine.js:1258-1270` `focusedSkillIds` | `a.id!=="professional"`; matches skills by **name**, lower-cased with a trailing "s" stripped (an F10-era workaround) |
| `engine.js:2213-2232` `validate` | `a.id==="professional"`; finds the pick count by regex `/chosen at creation/` over a sentence, with a fallback of 2; the error hardcodes "Combat Skills" |
| `wizard.js:292-300` | the same regex, again, to draw the picker |

The data has the numbers it needs, but in prose. `coreMechanic.disciplines.creationCostNote` says "costs 6 Character Points" and `maxRankBy: "powerLevel.maxPowerRank"` is never read. **The Professional's focused skills are a list of display strings with instructions mixed in**: `["Acrobatics", …, "2 Combat Skills (chosen at creation)"]`. Three readers parse them, three different ways. **B12–B14 are this finding's symptoms.**

**Why it matters now.** Cyborg (F6) and Vampire are next, and both are pick-heavy. Each would add a third and fourth special case on this path.

**Direction.** Structured data for anything the engine reads (R7). For example, `focusedSkills: { ids: [...], choose: { count: 2, category: "combat" } }` and `disciplines.cpPerRank: 6`. Then one generic reader, and the id checks go. **This is an engine and data-shape change, so it's proposed in the plan (S3/S4), not decided here.**

### A9: Data fields that look like settings but aren't read (B3's class, again)
**Med · [run] (key scan)**

rev 9's B3 was `levelsPerBOD`, "an authoritative-looking knob the engine ignored". It was closed by deleting the field. The class is still here. A scan of all 486 key names in the data against the engine and UI source found 91 never named in code. Most are display text. These are not:

| Data says | Engine does instead |
|---|---|
| `ip.statIncreaseCost.formula: "currentValue * 10"` | `cost: cur*10` (`engine.js:1287`) |
| `ip.skillIncreaseCost.formula: "5 * currentRank"`, `focusedFormula: "3 * currentRank"` | `(focused?3:5) * cur` (`engine.js:1303`) |
| `derived[SAN].formula: "EMP * 10"` | `t.EMP.value * 10` (`engine.js:139`) |
| `creationFlow.boostRules.spendOn` / `exemptions` / `maxBoostPerTarget` / `hardCapsStillApply` | `type!=="luck"` (`engine.js:230`) plus hardcoded caps |
| `resources.luck.exemptFromBoostCap: true` | the same hardcoded `"luck"` |
| `coreMechanic.panels[].cappedBy: "maxPowerRank"`, `disciplines.maxRankBy` | `pl.maxPowerRank` in `wizard.js` |
| `scaling.startingSFR: "WILL*3 + 5"` | a regex `/WILL\*3 \+ (\d+)/` (`engine.js:174`); any other formula silently yields no SFR |
| `resources.credits.symbol: "Ç"` | "Ç" typed into the UI |

**The milestone cadence is stated four times:** as numbers in `milestones.rules` (read, per Decision 67), as prose in `milestones.rules.minor`/`.major`, as prose in the Professional's `growth.cadence`, and inside two engine error strings, "next at 5, 15, 25… MP" (`engine.js:1351, 1428`). Change the numbers and three of the four stay wrong. B9 was meant to close this.

**Direction.** Each such field is either read or renamed as display text: `…Text`/`…Note`, or `formulaText` next to a number the engine reads. A test fails on a data key that is neither read nor named as text (R6). The cadence prose comes from the numbers.

### A10: Merged content no player can see
**Med · [run] (key scan)**

About 24 KB of the data, 9% of it, is merged from the CRB and never read by the engine or the UI (`meta.notes` included):

- **`weaponTagGlossary`** (29), **`weaponFeatureGlossary`** (6), **`spellTagGlossary`** (8). Tags like "AP", "Conceal" or "Burning" show on Main, in the catalog browser, on Loadout and in the Grimoire (`sheet.js:342, 1287, 1397, 1583`), always as bare words. A player can't find out what one means in the app. This is the biggest miss here.
- **`ammunition`** (9) and **`arrowheads`** (11): priced items with no place on the sheet, since the `equipment` catalog took over buying.
- **`enchantmentMaterialCategories`**, **`enchantmentTimeTable`**, **`enchantmentExtendedTime`**: Enchantment and Alchemy rules the Magic reference panel doesn't list.
- On archetypes: **`lore`** (every archetype has a paragraph of in-voice writing), `powersNote`, `primaryStatsNote`, `canPurchaseAdvantagesNote`, and **`growth`** (archetype-specific Major Milestones: none are filled in yet, and the Arcanist's carries a flag).
- `skillCheckRules.botch`/`difficulties`/`explosion`, `statRules.ranges`/`modifierRuleText`, and several `spellcraftRules` sub-blocks (charging, concentration, Sovereign Soul, teaching).
- The Werewolf Trueborn's `starterPower` and `additionalPowers`. That one is a correctness problem, so it's filed separately as **B17**.

**Direction.** A per-item call: render it (tag tooltips in the catalog browser and on Loadout, lore on the Archetype tab) or drop it from the data until something reads it. Either is fine. Carrying it is the cost, because it looks done. This is a design question: **AQ4**.

### A11: `notes: "natural"`, a free-text field that doubles as a type marker
**Low · [read]**

A Professional's free advantages are mirrored into `ch.advantages` with `notes: "natural"` (Decision 17). `notes` is otherwise a player's text. At least five sites branch on that exact string: `advSpent`, `canonicalEntry`, `validate`, `resetArchetypeChoices`, and the wizard's `applyStep`. Admin mode builds button addresses as `"<id>|<notes>|<delta>"` (`sheet.js:1737-1739`), so a note containing `|` breaks the address, and text notes become part of an identifier.

**Direction.** A `source: "natural"` field, with notes left as text. That's a character-schema change with a `migrate()` step, so it's low priority, but it belongs with the next schema bump rather than on its own.

### A12: UI files are split by render/bind, not by screen
**Low · [read]**

Decision 86 split the old `app.js` into `shared`/`wizard`/`sheet`/`app`. In practice the wizard's **renderers** are in `wizard.js`, but its **handlers** (`bindMain`, `applyStep`) live in `app.js`. The sheet's renderers are in `sheet.js` (2,034 lines), and its handlers are one **440-line `bindSheet()`** in `app.js` (`app.js:481-918`). To change one tracker you edit two files, far apart.

**Direction.** When a session is already in there, move each screen's binders next to its renderers, and consider one script per sheet tab. Script order is tested, so this is safe to do in steps. Not worth a session on its own.

---

## 5. Correctness findings

### B11: Mastering a spell makes the import check accuse the player of hand-editing
**Med · [run]**

`versionCheck()` compares the IP journal to stored IPE per target (`engine.js:2346-2355`). It treats every non-stat target as a skill. A Mastery spend is `targetType: "spell"` (Decision 108), and spells have no IPE, so:

```
addSpell("firebolt") → spendIP("spell","firebolt")  → ok, 60 IP
versionCheck(ch) → ["IP journal shows 1 increase on firebolt but IPE is 0 — totals may have been edited by hand."]
```

Any Arcanist who masters a spell sees this warning each time they resume or import the sheet (`wizard.js:541, 550`).

**Direction.** Check spell targets against the Grimoire row's `stage`, or skip non-stat, non-skill targets. Pin it with a test.

**Closed 2026-09-24** (app 0.23.1, plan S1): a spell spend is matched to its Grimoire row being Mastered. Pinned in `engine.test.mjs` and mutation-tested.

### B12: The Mercenary never picks its fifth Focused Skill
**Med · [run]**

The CRB (041): "Athletics, Awareness, Combat Sense, Handgun, and 1 Additional Combat Skill." The data stores that last one as the string `"1 Additional Combat Skill"`. The wizard and `validate` only look for `/chosen at creation/` (A8), so the picker never appears and nothing asks. `focusedSkillIds()` drops the string because it matches no skill name. A Mercenary ends up with four Focused Skills.

### B13: Focused Skill Max Bonus is never applied
**Med · [run]**

The CRB (041, Professional Campaign Power Scaling) says Focused Skills can exceed the Campaign Power Level's Max Skill Rank by +1/+2/+3/+4 by power level. The data carries it as `focusedSkillMaxBonus` on each scaling row, and nothing reads it. At Heroic, `canBoost(ch, "skill", "athletics")` on a Mercenary's focused Athletics at rank 5 says "Max Skill Rank 5." The CRB allows 7. The wizard's stepper enforces the same cap (`app.js:945`).

### B14: Jack-of-all-Trades pays full price for every skill
**Med · [run]**

Master of None (041): "All skills are treated as 'Focused Skills' and may be improved at a rate of 3 × current skill rank up to rank 4." The data has an empty `focusedSkills` array for the subtype and nothing else. `ipCost(stealth 2→3)` returns 10 IP where the CRB says 6.

**On B12–B14 together.** None is a rules question: the CRB states each one, and the data holds the numbers. None is flagged, logged or ruled. The Professional is `status: "draft"`, so it's fair to ask whether to fix them now or with the Professional's final pass (**AQ3**). But they are defects either way, and the fix is A8's structured data.

### B15: Hardcore Parkour can never be taken
**Med · [run]**

Its prerequisites include `["cat-like-balance", 1]`. No advantage has that id, and **the CRB's own Advantages chapter (043) has no "Cat Like Balance" either**. 041 names it in the milestone's prerequisites. `checkPrereqs` reports it unmet forever, so the Major is locked for everyone.

**Direction.** A CRB question for Ken, like the CQ doc fixes: what is Cat Like Balance? Until it's answered, flag the milestone with a `playerNote` so the table knows why it's locked, rather than having the app look broken. A generic referential-integrity test would have caught it on merge (R6).

**Closed 2026-09-24 → F27** (app 0.23.1, game data 0.17). Ken: Cat Like Balance was an Advantage from an earlier version ("+3 to Athletics or Acrobatics checks for balance"), since culled, so 041's prerequisite needs removing or replacing. Flagged as F27. Rather than stay locked, the stub makes the missing Advantage the GM's call, the way every prose prerequisite already is (Decision 91). Time Sense and Danger Sense are still checked. `rules.test.mjs` pins it, and the test was mutation-tested: it fails against the old data.

### B16: Admin mode renders two ids from the character file unescaped
**High · [run] (headless Chromium)**

A character file with an HTML payload in every string and id field was loaded as the active sheet. All nine tabs and the print view escaped everything. **Admin mode did not:**

```
sheet.js:1737-1739   data-admin-adv="${a.id}|${esc(a.notes||"")}|-1"     ← a.id unescaped
sheet.js:1755-1756   data-admin-dis="${d.id}|-1"                          ← d.id unescaped
```

An advantage id like `"><img src=x onerror=…>` breaks out of the attribute and runs script the moment Admin opens. Character files are made to be shared (a GM hands them around), so a file from someone else is untrusted input. The damage is limited to that origin's `localStorage` (the player's own saved sheet), but on the demo site that's a real origin.

**Direction.** Escape both ids. Then add the hostile-file render to the suite (R9). A test that renders every tab, Admin, print and each modal with payloads everywhere would have caught this, and it catches the next one.

**Closed 2026-09-24, and it was wider than this entry says** (Decision 124, app 0.23.1, plan S1). The probe above only put payloads in text fields. With payloads in numeric fields too, a string stored where a count lives (a stat's base, the LUCK bonus, Çredits, a ledger amount, a boost's times) was joined as text by the engine's `+` and reached **every tab** as markup, with no error. A crafted undo entry could write onto `Object.prototype` and put a string back into a number. Fixed at the one gate every load passes: `migrate()` makes every stored number a number and drops audit entries whose path leaves the character, and undo skips such paths and re-coerces what it restores. Admin addresses rows by position, not by id and notes (which also retires A11's worst symptom). The new `tests/hostile.test.mjs` found one more, the Review step's raw boost target, now escaped. Each fix was reverted in turn, and each reversion failed the test.

### B17: The Trueborn's Lunar Phase Blessing never appears anywhere
**Med · [run] (headless Chromium)**

The Werewolf's only built Origin, Trueborn, carries a `starterPower`, the **Lunar Phase Blessing**: four moon-phase boons, including Apex Fury (spend 3 SFR for +2 REF, BOD and MOB) and Waxing Moon's +1 REF and BOD. It also has four `additionalPowers`, still TBD. `renderShArchetype` shows an option's `description`, `benefit`, `tweak` and `transformation` only (`sheet.js:453-460`). A Trueborn player's sheet never mentions their starting power. Loaded in Chromium, "Lunar Phase" appears nowhere on the Archetype tab. Only Waning Moon reaches the app, as a conditional Natural Armor source.

**Direction.** Render `starterPower` (and `powers`) generically on the Archetype tab and in the wizard's option card. That's display only: no rules decision and no schema change.

**Closed 2026-09-24** (Decision 126, app 0.23.1): on the Archetype tab and the wizard card, the phases as a table, and the four powers still to come marked *not written yet*. `additionalPowers` became objects; it held strings ending "(TBD)".

### B18: Import and New Character replace the browser's saved sheet without asking
**High · [run] (headless Chromium)**

The browser holds one live sheet and one draft (§2.1). Importing a file puts it straight into the active slot. **New character** puts a blank into the draft slot. Neither asks. Verified: with Vex Morrow as the saved sheet, importing another player's file then reloading offers only "Open sheet — Other Player". Vex's play since the last export is gone, and no dialog appeared. Lock auto-exports, but play afterwards never does. A GM who opens a player's file on their own device, or a player who imports a friend's, loses their own session's changes.

**Direction.** Now: if the slot holds a different character, confirm first and offer to export it. Later, a small roster keyed by character, so the browser can hold several (**AQ5**, R10).

**Update 2026-09-24:** there's a third door. **Lock** also replaces the live sheet, so making a second character discards the first one's play since its last export. The fix, a permanent `meta.id` plus a confirm with *Export first*, changes the save file, so it's proposed in the plan's S1 and waits on Ken.

**Closed 2026-09-24** (Decision 128, app 0.24.0, character schema 0.11). Ken approved and made the id an in-universe **NYTE City intake number** with a barcode under the name. Import, New and Lock now ask before replacing a different character or a newer copy, with *Export first*.

### B19: On a phone the sticky header covers 30% of the screen
**Med · [run] (headless Chromium, 390 × 844)**

At phone width the nine tabs, the ⋮ menu and the theme toggle wrap to four rows. The header is `position: sticky`, so after scrolling it stays pinned at **257 px of an 844 px viewport, on every tab**. The layout is otherwise solid at that width: no horizontal overflow, and cards stack. It's the one thing a player at the table would feel every minute.

**Direction.** On narrow screens, collapse the tabs into one scrollable row or a menu, or let the header scroll away and keep a compact bar. It's a design call, so it belongs on the wishlist, but it's big enough to schedule.

**Ken, 2026-09-24 (AQ10):** tablet or laptop is the expected way to play, and a phone is the emergency fallback. **Severity drops to Low.** The aim becomes "usable in an emergency", and the same check should cover tablet widths.

---

## 6. Carried notes

- **C4: Import warnings show once, then vanish.** `versionCheck()` results render in the first sheet header, and `sheet.js:21` then clears them ("surface once"). A player who clicks a tab loses the only notice that their file references content that's gone. The fix belongs with B11: persistent until dismissed, and reachable from the ⋮ menu.
- **C5: 33 `alert()`/`confirm()` calls.** Most are the "why" of a refused sheet action in `bindSheet`. They block the page, can't be styled, and sit outside the modal, popover and toast primitives Decisions 111, 117 and 119 built. Route refusals to the toast or inline, and confirmations to `openModal`.
- **C6: Dead and history-shaped code.** `app.js:939` is a statement that does nothing ("allow; validation guards"). `wizard.js:296` reads `D.skillsFlags`, removed in Batch 1. `engine.js:198` says "Assumption (flag for D)" about a rule Decisions 16 and 97 settled. Section banners say "PHASE 3 — LIVE SHEET" and "BATCH 3", and the engine's exported object is grouped by the batch that added each function rather than by domain. None of it breaks anything, but it tells the next reader history instead of structure.
- **C7: Offline, the brand fonts fall back.** From `file://` with the network blocked, the single-file build loads in about 150 ms and works. The Google Fonts request fails (one console error), and Inter, Roboto Mono and Chakra Petch become `system-ui`. The "hand a player a folder" promise holds, but the look doesn't. Embedding subsetted WOFF2 would add roughly 100–200 KB (**AQ6**).
- **C8: Audit log growth, and undo across a migration.** A simulated 100-session campaign (2,200 actions) produced a 219 KB file, 92% of it audit. That's about 94 bytes per action, far under `localStorage`'s ~5 MB, **so this is not a problem at any realistic scale**. Two facts to keep: an edit inside an array (firing one weapon, using one gear item) stores a copy of the whole array (`_arrayDiff`'s `set` fallback), and stored undo patches are never migrated, so undoing an action recorded before a `migrate()` step can restore the older shape. Readers tolerate it today. Revisit if a file passes about 1 MB, or before a migration that reshapes an array.
- **C9: `versionCheck()` doesn't report every orphan.** It checks skills, advantages, disadvantages, Conditions, Aberrations and Milestones, but not weapon, armor, gear, spell or specialization ids. Every reader survives those (they show "no longer in the game data"), so it's a reporting gap only.
- **C10: `meta.notes` in the game data is a changelog.** It's a single string, now about 4 KB, narrating every data version from 0.3 to 0.16. It skips 0.15, and it ships to players inside the data. That history belongs in `log/` or `CHANGELOG.md`, and `meta` should hold only what the app reads.
- **C11: Closed plans still host open work.** Both plans in `docs/plans/` are closed, but STATE §5 sends Ken to `plans/combat-and-conditions.md` §6 for CQ8, CQ9 and CQ11–CQ13, his CRB fixes. Open items should live somewhere open: STATE §5 itself, or a short "CRB fixes" list.
- **C12: The dev server listens on every interface and doesn't confine paths.** `tools/devserver.mjs` calls `listen(PORT)`, which binds all interfaces, and joins `req.url` onto the repo root without checking the result stays inside. It isn't shipped and is only run by hand, but on shared Wi-Fi it serves any file the user can read. Fix: bind `127.0.0.1` and reject paths outside `ROOT`.
- **C13: The voice corpus renders the sheet for one archetype.** `voice.test.mjs` walks every wizard step for every archetype, but the nine sheet tabs only for an Arcanist with no specialization. Werewolf, Professional and Admin copy on the sheet is never read by the voice guard.
- **C14: Releases.** `release.yml` attaches only the character sheet, not the blank sheet, and uses GitHub's auto-generated notes (a list of PR titles) rather than the CHANGELOG section written for players. `release.yml` and `deploy-demo.yml` each build the same tag separately. And the tag has to be pushed from Ken's machine.
- **C15: The smoke suite is 95% of `verify`'s wall time.** Of about 74 s, `smoke.test.mjs` takes 70 s (59 tests, each booting the 0.9 MB build in jsdom) and `voice.test.mjs` takes 24 s in parallel. Engine, rules, docs and build tests together take under 10 s. There's no quick loop for engine work (R8).
- **C16: Main's subtitle never named the specialization.** *(Found while building B18, closed the same day.)* `renderShMain` read `identity.specialization`, which schema 0.5 removed (Decision 79). Main said *Werewolf · Heroic* where the Archetype tab said *Trueborn*. It now reads `Engine.specializationLabel()`, and a smoke test pins it.

---

## 7. `CLAUDE.md`: is the pattern right?

**Mostly yes. Keep the spine.** The hard constraints, the four-version table, "verify, don't assert" with mutation testing, "never resolve a rules question in code", frank pushback, and propose-before-build are the right rules, and the tests behind constraints 2–9 are what make them real. The following are worth changing.

1. **It breaks its own rule.** "This file deliberately carries no counts", then "`index.html` Shell. 34 lines." (it's 42). The script-order constraint omits `theme-init.js` and `shadows-changelog.js`, which `build.test.mjs` enforces.
2. **The branch convention isn't practiced.** It prescribes `feat/…`, `fix/…`, `data/…`. Nearly every recent PR came from `claude/…` branches that cloud sessions name. Either describe what happens, or ask cloud sessions to rename.
3. **Procedures live as prose that only a careful reader follows.** Closing a session (rewrite STATE, append the log), closing a flag (three edits), numbering a decision (search, mark supersessions, index), releasing (rename, regenerate, tag). Each is a checklist, and each has been missed at least once according to the log. They'd be more reliable as project skills a session invokes, or as scripts (R4, R5).
4. **"Close every session by rewriting STATE and appending to the log" applies to every change, however small.** That's the source of most of A6. Tie it to change tiers (R2): a data typo shouldn't require a STATE rewrite.
5. **The orientation list is long.** Four "read first" documents plus seven "also here when relevant" ones. After A4's cleanup it can be three: CLAUDE, STATE, INDEX.
6. **Two procedures are stated in two files.** Releasing and the demo host are in both CLAUDE and STATE §2, and the changelog rule is in CLAUDE, STATE and the CHANGELOG preamble. State each once.
7. **Nothing sets up a cloud session.** This session started without `node_modules`, and `npm run verify` fails until someone runs `npm install`. A `SessionStart` hook in `.claude/settings.json` running `npm ci` would fix that (R5).

**A suggested shape** (a proposal, not applied):

1. What this is: one paragraph.
2. Hard constraints: as today, with the script order corrected.
3. Commands: as today, plus `test:fast` if R8 lands.
4. **Change tiers**: what each kind of change must touch (R2). This replaces most of "Working rhythm".
5. Versions: as today.
6. Working with Ken: as today.
7. Where things live: one table, replacing Orientation and Layout.

The procedures from item 3 move into skills. The result would be shorter and harder to drift.

---

## 8. Recommended practices

These are ways of working, not defects. Each is a proposal until Ken adopts it, and then it's a numbered decision.

- **R1: Decisions as short records that say what they rejected.** A template: *Decided · Why · Rejected · Replaces · Revisit if · Built* (a link to the log entry or PR), plus a *Touches* line so a search for the subject finds it, in about 20 lines. The ledger stays the authority because it stays readable. Nothing is renumbered. Ken asked for exactly this anchor (AQ1). The full design, with a worked example, is the plan's §6.
- **R2: Change tiers.** Name three or four kinds of change and what each must touch. For example:
  - *copy or typo*: changelog line if a player sees it;
  - *content*: plus game-data bump per Decision 68;
  - *rule, shape or architecture*: plus numbered decision, INDEX line, STATE;
  - *docs or process*: log line.

  STATE and the log are rewritten or appended when the tier says so, not every time.
- **R3: One fact, one place, enforced by deleting the copies.** Where a fact must appear twice (a version on the README), generate it or test it. Where it needn't, point to it instead.
- **R4: Script the mechanical steps.** `npm run bump 0.24.0` writes all five version sites. `npm run release:check` confirms the CHANGELOG heading is dated, the generated file is current and the tag is free. Either build the INDEX summary generator INDEX §4 describes, or delete the claim.
- **R5: Put the procedures where Claude can run them.** `.claude/settings.json` with a `SessionStart` hook (`npm ci`). Project skills in `.claude/skills/` for *close the session*, *number a decision*, *close a flag*, and *cut a release*. A skill is a checklist that gets followed, which prose in CLAUDE.md sometimes isn't.
- **R6: Data contract tests.** Three of them:
  - one generic referential-integrity sweep over every id-bearing field, replacing the per-catalog tests added batch by batch (it would have caught B15);
  - "every data key is read by code, or named as display text" (A9);
  - "every `flagged: true` has an F-number that's open in §5" (A7).
- **R7: Structured data for what the engine reads, prose for what it doesn't, never both in one field.** No regex over English in the engine.
- **R8: A fast inner loop.** `npm run test:fast` runs engine, rules, docs and build tests in about 10 s. `verify` stays the full gate before push and in CI.
- **R9: Treat every character file as hostile.** A permanent test that loads payloads into every string and id, then renders every tab, Admin, print and each modal, and fails if anything executes or injects an element.
- **R10: Protect the browser's saved sheet.** Confirm before replacing (B18). Show an "unsaved since last export" marker. Later, a roster.
- **R11: One release workflow a cloud session can run.** Dispatch it with a version. It checks the CHANGELOG section, builds once, creates the tag and release (body = that section, both artifacts attached) and deploys Pages, all in one run. A tag created by the workflow's own token doesn't trigger other workflows, so this has to be one workflow, or use a token Ken provides (**AQ9**).
- **R12: A phone-width check.** Playwright and Chromium are on the cloud image. A short script that loads the build at 390 px and asserts the header's height and no horizontal overflow would have caught B19. It can live outside `npm test` if CI shouldn't install a browser.
- **R13: CRB conformance by table.** Where the mirror is tabular (spells, weapons, armor, advantage costs, Professional scaling), test the data against the mirrored markdown. A re-pull then shows its own drift instead of waiting for someone to notice. (A column the data carries but the engine never reads, like B13's, is R6's key guard's job, not this one's.)

---

## 9. What not to change

Frank pushback cuts both ways. These are right, and the plan leaves them alone:

- **`file://`, classic scripts, and the single-file build.** The constraint costs little and the build is clean.
- **The engine's shape.** Pure functions, `ok`/`why` results, total readers, and `resolveX` previews paired with `applyX` writers. It's the best-designed part of the codebase.
- **Store inputs, compute everything; the generic diff for audit and undo.** Measured cheap (C8) and it removed a whole class of bugs.
- **Two audiences, two fields (`flagNote`/`playerNote`), and the voice tests.** They held under a hostile file too.
- **`docs.test.mjs` as a concept.** Docs that lie should fail the build. The change is to have fewer restated facts for it to guard, not to drop it.
- **STATE rewritten, log append-only, WISHLIST separate from STATE.** A good split. Only the per-change cost needs trimming.
- **The CRB mirror in the repo.** It's why this audit could check B12–B15 against the book.

---

## 10. What the audit ran

For anyone who wants to reproduce a finding. The scripts were scratch files and aren't committed.

| Probe | How | Found |
|---|---|---|
| Full suite | `npm run verify`, then each file timed | 266 pass / 0 todo; timings in C15 |
| Spell mastery | engine in the harness VM: `addSpell` → `spendIP("spell")` → `versionCheck` | B11 |
| Professional rules | Mercenary, Cleaner and Jack at Heroic: `validate`, `focusedSkillIds`, `canBoost`, `ipCost` | B12–B14 |
| Data key scan | every key name in `SHADOWS_DATA` vs engine and UI source | A9, A10 |
| Reference sweep | every id-bearing field against its catalog | B15 (+ the prose in B12) |
| Flag census | walk the data for `flagged: true` and the F-number in each note | A7 |
| Offline load | built file from `file://` in headless Chromium, network blocked | C7, load time |
| Hostile file | payloads in every string and id; all tabs, Admin, print | B16 |
| Phone layout | 390 × 844, scrolled, header measured | B19 |
| Trueborn | locked Werewolf/Trueborn, Archetype tab text | B17 |
| Overwrite | saved sheet A, import file B, reload | B18 |
| Campaign growth | 100 simulated sessions, 2,200 audited actions | C8 |
| Change cost | `git show --stat` on recent commits; commit dates | A6 |
