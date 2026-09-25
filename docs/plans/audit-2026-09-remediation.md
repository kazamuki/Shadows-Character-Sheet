# Plan: acting on the 2026-09-24 whole-app audit

**Status:** done 2026-09-25. **Every question is answered** (§5), and **S1–S6 are done** (S1: app 0.24.0, character schema 0.11, game data 0.17; S2: docs only; S3: app 0.25.0, game data 0.18; S4: app 0.25.1; S5: app 0.26.1; S6a: app 0.27.0, game data 0.21; S6b: app 0.27.1; S6c: app 0.28.0), and **S7 is done** (app 0.28.2, character schema 0.13, Ken asked for it as a session of its own). Every finding is closed.
**Covers:** every finding in [`audits/2026-09-24_whole-app-audit.md`](../audits/2026-09-24_whole-app-audit.md) (A4–A12, B11–B19, C4–C15) and its recommended practices (R1–R13).
**Sources:** the audit's own probes, `docs/reference/crb/041_Archetypes.md` and `043_Advantages.md` (pulled 2026-09-22/23).

When a session finishes, tick its box in §3 and mark its findings closed in `INDEX.md` §2. When every session is done or dropped, this file gets a one-line "done" header and stays as history.

---

## 1. Why this, and why now

The app is in good shape. The audit's point is that **the way it's built and documented has started costing more than it should**, and that "data drives the app" has gaps just where the next two archetypes will land. Cyborg (F6) and Vampire are both waiting on design. Every session spent on this plan before they arrive makes them data, not special cases.

There are also three player-facing problems worth fixing regardless:
- a crafted file can run script in Admin mode (B16);
- importing a file silently replaces your saved sheet (B18);
- mastering a spell makes the app accuse you of editing your file (B11).

## 2. The order, and why

1. **Safety and correctness first (S1).** These are small, need no rulings, and a player can hit them today.
2. **The docs diet next (S2).** It's pure docs, it needs Ken's answers more than code, and **it makes every later session cheaper**. Every session after it pays the smaller per-change cost.
3. **Then the data contract (S3, S4).** It's the structural fix behind A8/A9 and B12–B14, and it wants the lighter process from S2 in place first.
4. **Tooling (S5) can go any time.** It's independent, and a cloud session can do most of it alone.
5. **Table feel (S6) waited on design answers** (AQ4, AQ5, AQ10), all answered. It split into S6a (rules a tap away), S6b (the header) and S6c (the roster).
6. **Structure (S7) is opportunistic.** Do each item when a session is already in that code, never as a session of its own.

S1 and S5 can run in parallel with anything. S3 and S4 touch the same engine functions, so run them one after the other.

## 3. Sessions

### S1: Safety and correctness (no rulings needed)
- [x] **B16**: done 2026-09-24 (Decision 124), and **wider than the audit found**. The first probe only put payloads in text fields. With payloads in numeric fields too, a string stored where a count lives (a stat, the LUCK bonus, Çredits, a ledger amount) rode the engine's `+` as text onto every tab. A crafted undo entry could also write onto `Object.prototype`. Fixed at the one gate: `migrate()` makes every stored number a number and drops audit entries whose path leaves the character, and undo skips such paths and re-coerces. Admin addresses rows by position. The Review step's raw boost target, found by the new test, is escaped.
- [x] **R9**: `tests/hostile.test.mjs`. Payloads in every string, id and number, rendered across nine tabs, Admin, print, 60 modals and popovers, and every wizard step, plus the undo, migrate and Admin-addressing checks. Mutation-tested: each of the six fixes, reverted, fails it.
- [x] **B18**, done 2026-09-24 (Decision 128, app 0.24.0, character schema 0.11). Ken approved the proposal and asked for the id to be an in-universe **NYTE City intake number**, a form number with a barcode under the name.
  - `meta.id` is `NCR-XXXX-XXXX-XXXX`: Crockford base-32, so no I, L, O or U and it reads aloud cleanly, with about 60 random bits. `newCharacter()` issues it, `migrate()` backfills it and replaces junk, and it's never reissued.
  - It shows under the name on Main, on the Review step and in the printed header, with bars drawn from the number. They're decoration, not a scannable code; a real Code 39 is an option once a decoder can verify it. Print is still three pages, checked in Chromium.
  - `meta.updated` is "last changed", stamped by `commit()`.
  - **Import, New and Lock** ask before replacing a different character or a newer copy, with **Export first · Replace · Cancel**. A newer copy of the same character goes straight through.
  - Main's subtitle names the specialization again. It read a field removed in schema 0.5, found while adding the intake line.
  - Six tests, and five mutations each caught.
- [x] **B11**: `versionCheck()` matches a Mastery spend to its Grimoire row. **C4**: findings stay above every page until dismissed, in the wizard too; a bare version difference still shows once (Decision 125). Both mutation-tested.
- [x] **B17**: the Trueborn's Lunar Phase Blessing, its phases as a table, and the four powers still to come, marked not written yet, on the Archetype tab and the wizard card (Decision 126). Mutation-tested.
- [x] **R6, first part**: one sweep over every id the data points at (over 300 references), with the Professional's two prose entries as named exceptions that S3 must remove. Mutation-tested: it catches B15 if the old prerequisite comes back.
- [x] **B15**: flagged as **F27**, then **ruled by Deighton the same day** (Decision 129): Hardcore Parkour needs 1 Major Milestone, Acrobatics 4 and Danger Sense 1, and Cat Like Balance and Time Sense go. The interim GM's-call stub never shipped.
- [x] **C13**: the voice corpus renders every archetype's sheet, with its first specialization chosen, plus Admin. Mutation-tested with "(TBD)" put back on a Trueborn power.
- [x] **AQ2**, pulled forward from S2 because this session changed the test count: STATE states the todo count only (Decision 127).

*Versions:* app minor (0.24.0), since B17 and B18 are visible. Character schema 0.11 for `meta.id`. Game data: per Decision 68, likely none. *Size:* one session, or two if the id and the confirm flow go in separately.

### S2: The docs diet and change tiers (done 2026-09-24, Decisions 130–132)
- [x] **R2**: four change tiers in `CLAUDE.md` (Docs, Fix, Content, Rule or shape), Ken's pick of the drafts (Decision 131). STATE and the log move when the tier says so.
- [x] **R1**: the §6 format is standard (Decision 130). `CLAUDE.md` says to search the Touches lines before proposing; `docs.test.mjs` checks the shape from 124 on, and that every load-bearing decision has Rejected and Revisit if. The fourteen load-bearing entries are backfilled from their own text and the log, marked as backfilled. Their **Revisit if** lines are Claude's reading and are Ken's to correct.
- [x] **A4 / R3** (Decision 132): SCHEMA's header says what it's for and that nobody reads it front to back; §2's panel types are current; §5's preamble is one line on closed flags; §6 and the old preamble moved verbatim to `log/archive.md`. `docs/README.md` folded into INDEX §1, and it and the `HANDOFF.md` stub are gone. README points in; CONTRIBUTING is a short human version that points at `CLAUDE.md`. INDEX's "generated" claim is gone, and CQ/MQ are in its registry.
- [x] **`CLAUDE.md`** per audit §7: three orientation docs; the branch names actually used (Ken's pick); releasing and the changelog rule stated once (STATE §2 now points at them); a *Where things live* block for Layout; decisions and flags as their own short sections. Decision 124's rule became hard constraint 10, since `hostile.test.mjs` enforces it.
- [x] **A7**: F28–F31 are the four weapon tags, for Deighton with F23–F26. F32 is the Arcanist's Majors (Ken). The Vampire and Werewolf content notes name F7 (and F13), and F7's row says so.
- [x] **R6, flag guard**: every `flagged: true` names at least one F-number, and every one it names is open. Mutation-tested: the pre-S2 data, a note losing its number, and a note naming a closed flag each fail.
- [x] **C10**: `meta.notes` is out of the data and in `log/archive.md`. No game-data bump: nothing read it (Decision 68).
- [x] **C11**: Ken's CRB fixes are one line each in STATE §5.
- [x] **A6**'s STATE half was AQ2 (Decision 127). The scripts are S5's R4, so A6 stays open until then.

*Versions:* none moved. *Found on the way:* Decision 101 had replaced part of 74 (the batch board) without marking it; 74 now says so.

### S3: The Professional as data (done 2026-09-24, Decision 134)
- [x] **A8, Professional half / R7**: `focusedSkills` is `{ ids, choose: { count, category }, all: { throughRank } }`, read by one generic reader. The name matching, both regexes and all three `professional` checks (engine `focusedSkillIds` and `validate`, `wizard.js`) are gone. So are the two panels matched by id on the sheet: they're the `focusedSkills` and `specializationText` panel types now.
- [x] **B12**: the Mercenary's pick appears, and a pick can't repeat a skill the Subtype already names (the Cleaner could end with five; the probe found it). **B13**: `skillRankCap` adds `focusedSkillMaxBonus`, read by `canBoost`, the wizard stepper and label, and a new `validate` check. **B14**: Jack pays 3× for ranks bought up to 4, and 4 → 5 is standard (Ken's answer).
- [x] Pinned in `rules.test.mjs`, one case per 041 line; 18 mutations, each caught.
- [x] Each rule is one field: `choose.count`, `choose.category`, `all.throughRank`, `focusedSkillMaxBonus`, and the IP prices (`ip.skillIncreaseCost.perRank`/`focusedPerRank`, pulled forward from S4 since `ipCost` was being rewritten).
- [x] **R13, first table**: the scaling table is tested against 041's markdown.
- **Also, from Ken's answers:** Jack's cap question is **F33**, for Deighton's grouped question. A locked character short of a pick chooses it on Loadout & Powers, as one undoable action.

*Versions:* app 0.25.0, game data 0.18. Character schema: none, as expected: `focusedSkillPicks` already stored ids, and `migrate()` now keeps it a list of strings.

### S4: Read it or label it (done 2026-09-24, Decision 135)
- [x] **A8, Arcanist half**: `disciplines.cpPerRank` read by `disciplineSpent` and the wizard (both 6s gone); `maxRankBy` read, and `validate` now checks it; Evocation's `startingRankBy` on its own entry. One `dataPath` reads it, `maxRankBy` and `countBy`. **Wider than listed:** the wizard's Focus Stat block (`sel.id==="arcanist"`, INT/COOL/EMP typed in) and Stat Bonus block (`sel.id==="werewolf"`) read the scaling row's keys and `focusStats` now. A test fails on any archetype or discipline id in engine or UI code.
- [x] **A9**: SAN and starting SFR are `{ stat, times, plus }`; the stat IP price is `perPoint`. `boostRules` is **trimmed** to `cpCostPerPoint`, and so are `luck.exemptFromBoostCap`/`buyUpWith`, `penaltyStacking.stacks`, `locationStacking`, `rollPenalty.appliesTo`, `supernatural`, `supernaturalRestriction`, the Disciplines panel's `items`/`cappedBy` and the Grimoire's `catalog` (Decision 64's precedent: they restated what the code does by structure). The credit symbol comes from data. The cadence is written from the numbers, and a refusal names the next unlock (Ken's pick).
- [x] **R6, key guard** (`engine.test.mjs`): every key is named in code, text by name (and holds text), reached by a data path, or on `NOT_YET_SHOWN`, the S6 list, which fails when an entry becomes read. It found five fields the audit hadn't: Major Milestone `details` (shown now), Martial Arts `styles` (W33), 043's `universal` tag (a CRB question), and `supernatural` and `catalog` (trimmed).
- [x] **The SFR panel** (Ken added it): `counts: "down"` and `resource: "sfr"` replace `p.id==="sfr"` in `sheet.js` and `app.js`.
- [x] Before and after, `tools/outputs.mjs` diffed 1,468 outputs (every archetype × power level: engine readers, every tab, picker, Admin, print, wizard step). Only the intended copy moved, so no game-data bump (Decision 68). The tool is committed (Ken's pick).

*Versions:* app 0.25.1 (the refusal copy, the SFR formula's text and the Milestone details are visible). Game data and schema: none.

### S5: Tooling (done 2026-09-24, Decisions 137–138)
- [x] **R5**: `.claude/settings.json`'s `SessionStart` hook runs `tools/session-start.mjs`, which runs `npm ci` only when `node_modules` is missing or older than the lockfile, and is silent otherwise. Four skills in `.claude/skills/`: `close-the-session`, `number-a-decision`, `close-a-flag`, `cut-a-release`. They're runbooks (steps, commands, files) and cite `CLAUDE.md` for the rules rather than restating them, so there's still one place a rule lives.
- [x] **R4**: `npm run bump -- X.Y.Z` writes the six sites (the lockfile twice) and renames or adds the `[Unreleased]` heading, then regenerates What's new. `release:check` (one version everywhere, a dated section with lines, What's new current, the tag free on origin and locally; `--tagged` for a tag run) and `release:prep` (dates the heading), both in `tools/release.mjs`. Game data and schema are left out on purpose: each needs a judgement.
- [x] **R8 / C15**: `npm run test:fast`, engine, rules, docs and build, about 13 s against verify's two minutes and more.
- [x] **R11 / C14**: one `release.yml`, dispatched from main with a version (or a pushed tag): check, test, build once, tag, Release with the CHANGELOG section and both files, deploy Pages. A dry run stops after the build. `deploy-demo.yml` is gone (Decision 138).
- [x] **R12**: `npm run phone-check` drives Chromium through `playwright-core` (Edge locally, Playwright's own in the cloud) over Home and every tab at 390, 768 and 1024 px. It reproduced B19's 257 px exactly, and found two things the audit hadn't: Home is 74 px too wide at 390, and at 1024×768 the header is 23% of the screen. The pre-S5 build measures the same, so both are S6's. Outside `npm test`.
- [x] **C12**: the dev server binds `127.0.0.1` and answers 403 to a path outside the repo (`%2f` and `%5c` traversal tried).
- [x] **C7**: fonts per AQ6: `src/styles/fonts.css`, generated from Fontsource's packages, 170 KB, with the OFL in its header and the licence files in `src/styles/fonts/`. A build test fails if either built file loads anything from a URL; putting either Google link back fails it (Decision 137). Ken then moved the big numbers off the header face to Oxanium (`--numeric`), with a test that no number uses `--display`.

*Versions:* app 0.26.1 (the fonts). Game data and schema: none.

### S6: Table feel, split three ways (2026-09-25)
AQ4 answered what to show and AQ10 who plays where. Ken split the session into three that don't depend on each other: **S6a** rules a tap away, **S6b** the header, **S6c** the roster. All three are done.

### S6a: Rules a tap away (done 2026-09-25, Decision 139)
- [x] **A10**, as Ken answered AQ4. One principle: any rule the sheet names, a player can read without leaving it.
  - **The tip primitive** (`shared.js`): `data-tip` + `data-term`, and a `TIPS` table says what each kind shows. Hover or focus shows it, a tap pins it, and Esc, a click elsewhere or a redraw puts it away. It rides inside an open modal, as the undo toast does. Reuse it for any new "what does this mean": add a `TIPS` kind, never a second primitive.
  - **Tags:** `Engine.glossary(term, kind)` reads a tag, a bracketed parameter and all (`Blast (10m)`), as chips (`tagChipsHtml`) on Main, Loadout's weapons and gear, the catalog and the Grimoire. Six tags have no glossary line and stay plain words, listed in `engine.test.mjs`. F28–F31's tags carry a player-facing `description` and `playerNote`.
  - **Stats:** each score's tip reads its book range (`statRules.ranges` is `{ min?, max?, meaning }` now, via `Engine.statReading`), the modifier rule, and past 10 the beyond-human text (BOD's Health Level line too).
  - **Rules text:** *How a check works* on Skills (trained, untrained, the target numbers, explosion, botch).
  - **Lore:** the chosen archetype's lore under the wizard's cards (not inside each card: five long paragraphs swamp the grid), and a collapsed *Lineage* on the Archetype tab.
  - **Magic reference:** *Charging, holding and learning* (charging, concentration, the Sovereign Soul, Improvised/Known/Mastered, teaching), *Domains and Glyphs*, *Enchantment and Alchemy* (the tier table, extra time, materials), each collapsed.
  - **Ammo:** the 9 rounds and 11 arrowheads are `equipment` entries in an **Ammo** category, same ids, numeric prices with `pack` and `unit` (a box of 10 shells, 12 broadheads). A price the book gives relative to the round ("3× standard") can be added, not bought. **A section of its own inside the equipment catalog**, which is what Ken meant by "its own category" in AQ4 (confirmed 2026-09-25).
  - **Archetype Majors (`growth`):** still hidden. `NOT_YET_SHOWN` is down to `growth`, `styles` (W33) and `universal` (a CRB question).
- [x] **C5**: `notice(msg)` is the toast without an Undo; `askFirst({ title, text, yes, then })` is the modal with Cancel focused. All 33 `alert()`/`confirm()` calls are gone, and `build.test.mjs` fails if one comes back.
- **Mutation-tested:** no bracket lookup, the tip on `<body>` instead of in the modal, the session delete without asking, an `alert()` put back, the BOD line on any stat, and a flagged tag's old maintainer description. Each fails. The capture-phase `stopPropagation` doesn't catch a mutation: tags are buttons, which the catalog row already ignores, so it's defensive.

*Versions:* app 0.27.0, game data 0.21 (Ammo is a new choice). Schema: none.

### S6b: The header (done 2026-09-25, Decision 140)
- [x] **B19**: the header is two thin rows at every width: the name with ⋮ and the theme button, then the nine tabs in one line that scrolls sideways. The active tab is kept in view, the side with more tabs fades, and a plain mouse wheel scrolls the row (then hands the page back at the end). Below 480 px wide the `Shadows //` prefix goes; a long name ends in "…". Below 540 px tall (a phone on its side) the header scrolls away. `phone-check` passes all three widths: the sheet's header is 88 px (9–11%), with no sideways overflow anywhere.
- **Measured first:** at 1024 the tabs (990 px) and the name (362 px) wrapped to three rows, with Notes alone on the second. Home's 74 px and the sheet's 16 px of overflow were one cause: the name never wrapped, and set the page's width. The last 4 px was Main's Combat stat chips, which now wrap in their cell.
- **Ken's picks against the first sketch:** un-stick on a *short* screen, not below 600 px wide (at 11% the sticky header fits a phone, and tabs stay reachable mid-fight); drop the prefix on narrow screens.
- **Mutation-tested:** no scroll-into-view, the wheel swallowed at the row's end, no wheel handler, the left fade always on (the smoke test, with a faked layout); the tabs wrapping, the chips not wrapping, the prefix kept, and the brand's `overflow:hidden` removed (`phone-check`). The last two only fail because `phone-check` now checks that the test name fits and probes a long name; two redundant `min-width:0`s the mutations exposed are gone.

*Versions:* app 0.27.1. Nothing else.

### S6c: The roster (R10) (done 2026-09-25, Decision 141)
- [x] **R10** (AQ5: design for several characters). Each character is one `localStorage` key, `shadows.char.v1.<TAG>`, holding `{ ch, step, maxReached, section, changed, exported }`, draft through locked, with no index key. Home lists them, most recently changed first, with Open, Export and Remove, and a tap on the card opens it.
  - **The marker is new, not kept:** the plan said to keep an "unsaved since last export" marker, but none existed. Home now says *Changes not exported yet* whenever an entry's `changed` isn't the `changed` it was last exported at. `changed` moves only when the stored character differs, and always forward, so no clock comparison can hide it.
  - Decision 128's guard turned into "add". The one question left is a file older than the saved copy of the same character. 128 is marked superseded in part.
  - The two 0.27 slots move into the roster on first load. An old key goes only after its entry is written, one that doesn't parse stays, and if both hold one character the newer copy wins. Tested, and seen working in Chromium.
  - New saves nothing until the player changes something. Lock saves before it exports, so a freshly locked character isn't marked. A save the browser refuses stays on the page until one goes through: a toast would be replaced by the next action's undo.
  - **Mutation-tested:** thirteen mutations (an untouched New saved, every save bumping `changed`, export not marking, Lock exporting before saving, an older legacy copy winning, an unreadable slot deleted, a draft's step lost, no save-failure banner, Import asking about any character, Remove without asking, no only-copy warning, the section not kept, the card's name unescaped). Each fails.
  - `phone-check` passes at every width with a roster card on Home, once merged with S6b.
  - Two tabs on one character overwrite each other, as they always did; that's W38.

*Versions:* app 0.28.0. Game data and schema: none.

### S7: Structure (done 2026-09-25, Decision 142)
- **A11**: `source: "natural"` replaces `notes: "natural"`, with the next character-schema bump that has another reason to happen.
- **A12**: move each screen's binders beside its renderers when a session is already editing them.
- **C6**: delete the no-op, the `skillsFlags` read and stale comments on sight. Regroup the engine's export object by domain the next time it's touched.
- **C8, C9**: revisit if a save file passes about 1 MB, or before a migration that reshapes an array.

**Done.** A11: `source: "natural"`, schema 0.13, and the step rewrites the audit's stored undo patches too, since A11 is the migration C8 warned about (Decision 142). A12: `bindMain`/`applyStep`/`refreshNav` moved to `wizard.js`, `bindSheet` and the pickers and modals to `sheet.js`, bodies verbatim; `app.js` is chrome, the router, export and boot. One script per tab was not done: `bindSheet` is still one function. C6: the no-op and its unused `pool`, the history banners ("PHASE 3", "BATCH 3"), the "flag for D" comment, and the export object regrouped by domain (`skillsFlags` was already gone). C9: weapons, armor, gear, spells and specializations reported. Mutations: the C9 guard fails on the old engine; the A11 test fails with the patch step removed and with the version gate removed.

## 4. Versions this will move

| Session | App | Game data | Character schema |
|---|---|---|---|
| S1 | minor | none expected | 0.11 (`meta.id`) |
| S2 | none | none | none |
| S3 | minor (0.25.0) | minor (0.18) | none |
| S4 | patch (0.25.1): three copy changes a player sees | none: outputs diffed identical | none |
| S5 | patch (0.26.1): the fonts are embedded | none | none |
| S6a | minor (0.27.0) | 0.21: Ammo is a new choice | none |
| S6b | patch (0.27.1): the header | none | none |
| S6c | minor (0.28.0) | none | none (a roster lives in `localStorage` keys, not the file) |
| S7 | patch (0.28.2): the load check names more orphans (C9) | none | 0.13 (A11's `source`) |

## 5. Open questions

For Ken unless marked. Answered ones keep the question, with the answer and date under it.

- **AQ1: How much docs weight to shed?** Short decision records (R1), change tiers (R2), retiring `docs/README.md`, the `HANDOFF.md` stub and SCHEMA §6, and shrinking `CONTRIBUTING.md`.
  - **Answered 2026-09-24, Ken:** "as long as we can always find what we did, and know why, I can trim a lot." He also asked for a better way to anchor decisions so they aren't relitigated. That's §6.
- **AQ2: STATE's exact test count and "Live:" line.** Drop both? The CI result and the footer already carry them. The `todo` count stays.
  - **Answered 2026-09-24, Ken:** drop both. Done in S1 (Decision 127).
- **AQ3: B12–B14 now, or with the Professional's final pass?**
  - **Answered 2026-09-24, Ken:** now. Some tweaking will follow, and the data schema was designed to take tweaks without breaking. S3 goes ahead, with each rule as one editable field.
- **AQ4: The data holds text no player ever sees. For each item: show it, or delete it?** Ken asked for this one plainly. My recommendation is first:
  1. **What a tag means.** Weapons and spells list tags like *AP*, *Conceal* or *Burning*, and the data has a sentence for each, but a player can't read it anywhere. **Show:** tap or hover a tag to read it, in the catalog, on Loadout, on Main and in the Grimoire.
  2. **Each archetype's `lore` paragraph** (the "An Arcanist is what happens when someone looks at the fabric of reality…" writing). **Show:** on the wizard's archetype card and the Archetype tab.
  3. **Ammunition and arrowheads.** Two price lists (9 and 11 items) that nothing can buy, although weapons now spend rounds and reload. **Show:** add them to the equipment shop as things you carry.
  4. **Enchantment and Alchemy tables** (which materials hold how many charges, how long crafting takes). **Show:** in the Arcanist's Magic reference panel, next to the Spellcraft rules already there.
  5. **Archetype-specific Major Milestones (`growth`).** Empty everywhere so far; the Arcanist's carries a flag saying they're unwritten. **Keep, hidden:** it's where they'll go. S2 gives the flag a number.
  6. **Small rules text:** botch, explosion and difficulty numbers, what stat ranges mean, and the Spellcraft sub-rules (charging, concentration, Sovereign Soul, teaching). **Show** in the reference panels where they belong, or **delete** if the CRB chapters players read already cover them. Ken's call on which.
  - **Answered 2026-09-24, Ken:**
    1. **Tags:** yes, show on hover or tap.
    2. **Lore:** show it in creation, and as an expandable section on the Archetype tab, where you view your character's lineage.
    3. **Ammunition and arrowheads:** into the equipment shop as their own category (*Ammo*), beside Weapons.
    4. **Enchantment and Alchemy:** in the Magic reference, collapsed until clicked.
    5. **Archetype Majors:** stay hidden until they're settled.
    6. **All the rules text:** visible on hover or in a reference section. "The character sheet is trying to be dynamic and make your game-life easier so you don't have to hunt for information."

    All of it is S6.
- **AQ5: The browser's saved sheet.** Confirm-before-replace, or a roster of several characters?
  - **Answered 2026-09-24, Ken:** design for a multi-character future. For now confirm-before-replace, better still with a way to download the current sheet first. S1 does both, on a stable character id; S6 builds the roster.
  - **No pushback on the direction.** One caution, written into S6: a roster makes it tempting never to export, and browser storage isn't a backup.
- **AQ6: Fonts offline.** Embed them (about +100–200 KB in the single file) or accept the system-font fallback?
  - **Answered 2026-09-24, Ken:** embed. All three (Inter, Roboto Mono, Chakra Petch) are open-source. S5 checks each one's licence (SIL OFL or Apache 2.0), embeds subsetted WOFF2 in the single-file build, and keeps each licence file in the repo.
- **AQ7: GitHub issues.** No issue has ever been filed, and flags live in SCHEMA §5. Delete the issue templates and CONTRIBUTING's issue flow, or start using issues (for playtest bug reports, say)?
  - **Ken, 2026-09-24:** unsure, since the app hasn't been playtested.
  - **Recommendation: split the two templates.**
    - **Delete the Design flag template.** Rules questions live in SCHEMA §5 and STATE §3. A second tracker for the same questions drifts, which is audit A4's lesson. It has also never been used.
    - **Keep the Bug template, rewritten for playtesters.** What happened, what you expected, the version from the footer, device and browser, and the exported `.shadows.json` attached. Playtests are about to start, and issues give reports a place to land that isn't a chat thread. Triage sends each one to a fix, the wishlist, or a flag.
    - **One caveat:** a playtester needs a GitHub account to file an issue. If most won't have one, a form link in the app's footer is the better door, and it can feed issues later. That's a question for when playtesting starts, not now.
  - **Answered 2026-09-24, Ken:** agreed. Done in S1's second pass: the Design flag template is deleted, the Bug template is rewritten as *Bug or playtest report*, and CONTRIBUTING and README point rules questions at SCHEMA §5.
- **AQ8 (CRB fix, Ken): What is "Cat Like Balance"?**
  - **Answered 2026-09-24, Ken:** an Advantage from an earlier version ("+3 bonus to Athletics or Acrobatics checks for balance"), since culled. The prerequisite needs removing or changing. Flagged as **F27**, with the GM's-call stub (S1). **Deighton ruled it later the same day** (Decision 129): Acrobatics 4 replaces it, and Time Sense goes.
- **AQ9: Releasing from a cloud session.** OK with one dispatchable workflow that creates the tag itself? The alternative is a token Ken provides so a tag push triggers the existing workflows.
  - **Answered 2026-09-24, Ken:** yes, releasing from the cloud is fine, since the PR process holds. S5 builds the dispatchable workflow. A cloud session's git proxy usually refuses a tag push, so the workflow creating the tag is the dependable route.
- **AQ10: How do players reach the app at the table?**
  - **Answered 2026-09-24, Ken:** no full playtests yet, but tablet or laptop is expected to be ideal, given how much the app does. A phone is the "in an emergency" fallback. B19 drops to "usable in an emergency", and tablet widths join that check (S6).
- **Deighton (via S2):** F28–F31, the Suppression, Blast, Anti-Materiel and Reach weapon tags. Ask with F23–F26 as one grouped question.

## 6. Decisions that stay decided (AQ1)

**The problem to solve.** A settled question gets reopened when the next session can't see that it was already asked, or why the other answers lost. The ledger records what was chosen. It usually doesn't record what was *rejected*, and it can't be searched by subject, because the subject is buried in the prose. Decision 102 exists because a TOL formula sat inside Decision 93, a data-merge entry nobody would search for TOL.

**The recommendation: keep one ledger, change what each entry must say.**

Not a folder of one-file-per-decision records (ADRs). Numbers are already cited from code and tests, `INDEX.md` and its test depend on one ledger, and splitting the file doesn't fix relitigation. Recording the rejected options does. So from Decision 124 on, an entry looks like this:

```
124. **<The decision, in one line.>**
     *2026-09-25 · Ken + Claude · Touches: <the things it governs, by name>*
     - **Decided:** what is now true, in one to three sentences.
     - **Why:** the reason that won.
     - **Rejected:** each alternative that was seriously considered, and why it lost.
     - **Replaces:** Decision N (in part: what changed), or "nothing".
     - **Revisit if:** the condition that would make this worth reopening.
     - **Built:** app/data/schema version, PR, log entry. Detail lives there, not here.
```

Three rules make it hold:

1. **Search before proposing.** A `CLAUDE.md` rule, and a step in the *number a decision* skill (R5): before proposing a change, search the **Touches** lines for what it touches. If a decision covers it, cite it. Only propose reopening it when its **Revisit if** has happened, or something new has come up that its **Rejected** list didn't weigh, and say which. That's the anchor. A proposal that re-raises a rejected option without new information is wrong on its face, and the ledger shows why.
2. **A test for the format.** From 124 on, every entry has the six fields and stays under about 25 lines. Older entries are exempt, since their numbers are cited and their text is history.
3. **Backfill only where it pays.** The ~14 load-bearing decisions in `INDEX.md` §3 each get **Rejected** and **Revisit if** lines added from the log. Those are the ones most likely to be reopened.

**Worked example.** Decision 122 as it would read in this form. The content is all in today's entry; it's just findable now:

```
122. **Main is the fight view; no separate fight mode.**
     *2026-09-24 · Ken + Claude · Touches: Main tab, Combat column, fight mode, Defense, W13*
     - **Decided:** Main's Combat column reads weapons you carry → the armor that answers → combat skills.
     - **Why:** the full combat-skills table pushed the lines a player rolls below the fold.
     - **Rejected:** a separate fight mode, because Main already holds everything W13 listed, one click away.
       A single "Defense" number, because 053 has the defender roll a skill (Dodge, Parry); one number would be invented.
     - **Replaces:** nothing.
     - **Revisit if:** playtesting shows Main isn't enough in a fight.
     - **Built:** app 0.22.0, PR #51; a smoke test pins the order.
```

**Where things go.** The ledger answers *what did we decide and why not the alternatives*. `log/2026.md` answers *what happened in a session and what it cost*. The PR answers *how it was built*. Keeping those three apart is what lets each decision stay short.
