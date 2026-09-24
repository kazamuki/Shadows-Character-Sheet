# Plan: acting on the 2026-09-24 whole-app audit

**Status:** proposed 2026-09-24. **Ken answered AQ1, AQ3, AQ5, AQ8 and AQ10 the same day** (§5), and B15 is done (flagged as F27, app 0.23.1). Still waiting on AQ2, AQ4, AQ6, AQ7 and AQ9. Nothing here is a decision until the session that builds it numbers it in `SCHEMA.md` §4.
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
5. **Table feel (S6) waits on design answers** (AQ4, AQ5, AQ10). Its items then go through the wishlist like any other UX work.
6. **Structure (S7) is opportunistic.** Do each item when a session is already in that code, never as a session of its own.

S1 and S5 can run in parallel with anything. S3 and S4 touch the same engine functions, so run them one after the other.

## 3. Sessions

### S1: Safety and correctness (no rulings needed)
- [ ] **B16**: escape the two Admin ids; while there, stop using `notes` inside Admin's button addresses.
- [ ] **R9**: a permanent hostile-file render test covering every tab, Admin, print and each modal. Mutation-test it against the pre-fix `sheet.js` so it's shown to catch B16.
- [ ] **B18**, built for the multi-character world Ken wants (AQ5):
  - **A stable character id.** `meta.id`, assigned when a character is created and backfilled by `migrate()` for older files. Without it the app can't tell "a newer copy of this character" from "a different character", so neither a replace warning nor a roster can be right. It's a character-schema bump (0.10 → 0.11) with a `migrate()` step, so propose the shape first.
  - **Confirm before replace.** When Import or New would overwrite a slot holding a *different* id, a modal offers **Export this one first**, **Replace** or **Cancel** (Ken: "if it allowed you to download the current state before replace, even better"). The same id arriving from a newer file replaces without asking.
  - Storage keys stay as they are for now. S6's roster builds on the id.
- [ ] **B11**: `versionCheck()` checks spell targets against the Grimoire row's stage. Also **C4**: import warnings stay until dismissed.
- [ ] **B17**: render an option's `starterPower`/`additionalPowers` generically on the Archetype tab and in the wizard card. Display only.
- [ ] **R6, first part**: one generic referential-integrity test over every id-bearing field. It would have failed on B15 (now fixed) and fails on the Professional's prose, so let it except that prose until S3.
- [x] **B15**: flagged as **F27** on 2026-09-24 (app 0.23.1, game data 0.17). The culled Cat Like Balance prerequisite is the GM's call until 041 removes or replaces it.
- [ ] **C13**: add a Werewolf and a Professional sheet, and Admin, to the voice corpus.

*Versions:* app minor (0.24.0), since B17 and B18 are visible. Character schema 0.11 for `meta.id`. Game data: per Decision 68, likely none. *Size:* one session, or two if the id and the confirm flow go in separately.

### S2: The docs diet and change tiers (docs only; AQ1 answered yes, still needs AQ2, AQ7)
- [ ] **R2**: write the change tiers into `CLAUDE.md`, then number them. Tie "close the session" (rewrite STATE, append the log) to the tiers.
- [ ] **R1, decisions that stop relitigation.** Ken asked for a way to anchor the reasoning so settled questions stay settled (AQ1). The design is in §6. In short: every new decision states what it **rejected** and **when to revisit**, plus a **Touches** line so a search for the subject finds it. A `CLAUDE.md` rule says to search before proposing. A test checks the format from Decision 124 on. The ~14 load-bearing decisions get their rejected alternatives backfilled; existing entries are otherwise untouched.
- [ ] **A4 / R3**:
  - `SCHEMA.md` header and §1 rewritten, and §2's stale example lines fixed;
  - §6 moves to `log/`;
  - §5's preamble cut to the table plus one line on closed flags;
  - `README.md` Layout corrected, and it points in;
  - `CONTRIBUTING.md` shrinks to a pointer, or to the human-contributor rules with no volatile facts (AQ7 decides the issue-template half);
  - `docs/README.md` folds into `INDEX.md` §1;
  - the `HANDOFF.md` stub retires;
  - `INDEX.md` §2's namespace count and §4's "generated" claim are fixed.
- [ ] **`CLAUDE.md`** per audit §7: drop the line count; correct the script order; describe the branch names actually used; state each procedure once; three orientation docs, not four plus seven.
- [ ] **A7**: an F-number for every flag. The four weapon tags become F28–F31 (F27 went to Hardcore Parkour), added to the grouped Deighton question with F23–F26. The archetype content notes link to F6/F7/F13 or drop their flag.
- [ ] **R6, flag guard**: a test that every `flagged: true` has an F-number open in §5.
- [ ] **C10**: move `meta.notes` history into `log/`, leaving `meta` what the app reads.
- [ ] **C11**: Ken's open CRB fixes (CQ8, CQ9, CQ11–CQ13, plus B15's) move out of the closed combat plan into STATE §5.
- [ ] **A6**: drop STATE's exact test count and the "Live:" line if AQ2 says so, and loosen `docs.test.mjs` to match. It keeps checking the `todo` count, which means something.

*Versions:* none. *Size:* one session, mostly Ken's reading time.

### S3: The Professional as data (AQ3 answered: go now; propose the data shape first)
- [ ] **A8, Professional half / R7**:
  - `focusedSkills` becomes ids plus a structured pick (e.g. `{ ids: [...], choose: { count: 1, category: "combat" } }`);
  - the Jack-of-all-Trades rule becomes data (e.g. `allSkillsFocused: { upToRank: 4 }`);
  - one generic reader;
  - the three regex/name-matching sites and both `a.id==="professional"` checks go.
- [ ] **B12**: the Mercenary's pick appears. **B13**: `focusedSkillMaxBonus` raises the cap in `canBoost`, the wizard stepper and `validate`. **B14**: Jack-of-all-Trades costs 3× up to rank 4.
- [ ] Pin each with a `rules.test.mjs` case quoting 041.
- [ ] Ken expects the Professional to be tweaked later (AQ3). So each rule should be one field a designer changes, like the bonus number, the pick count and category, or the rank ceiling, and never a rule in code. That makes a later tweak a data edit.
- [ ] **R13, first table**: test the Professional scaling table against the mirrored 041.

*Versions:* game data minor (available choices change, Decision 68). Character schema: probably none, since `focusedSkillPicks` already stores ids. The proposal must confirm that. App minor. *Size:* one session.

### S4: Read it or label it (engine change, propose first)
- [ ] **A8, Arcanist half**: `disciplines.cpPerRank` read by `disciplineSpent` and the wizard (the two hardcoded 6s go); `maxRankBy` read; the Evocation starting rank declared on the discipline, not matched by id.
- [ ] **A9**, for each "setting the engine ignores": read it, or rename it as display text. The IP formulas and SAN formula become numbers the engine reads. `boostRules` is read or trimmed. `startingSFR` becomes `{ stat, times, plus }`. The credit symbol comes from data. The milestone cadence prose (two data fields, two engine strings) is generated from the numbers.
- [ ] **R6, key guard**: a test that every data key is read by code or named as display text (`*Text`, `*Note`, `description`, `flavorLine`, …).
- [ ] Before and after, diff every computed output across a set of characters, as Batch 1 did. If nothing moves, there's no game-data bump (Decision 68).

*Versions:* none if the diff is clean. *Size:* one session.

### S5: Tooling (independent; a cloud session can do most of it)
- [ ] **R5**: `.claude/settings.json` with a `SessionStart` hook running `npm ci`. Project skills for *close the session*, *number a decision*, *close a flag*, *cut a release*.
- [ ] **R4**: `npm run bump <x.y.z>` writes all five version sites. `npm run release:check` runs before tagging.
- [ ] **R8 / C15**: `npm run test:fast` for engine, rules, docs and build (about 10 s).
- [ ] **R11 / C14**: one dispatchable release workflow (checks, builds once, tags, releases with the CHANGELOG section and both artifacts, deploys Pages). AQ9 decides tag creation.
- [ ] **R12**: a phone-width Playwright check script (header height budget, no horizontal overflow). Outside `npm test` unless CI should install a browser.
- [ ] **C12**: the dev server binds `127.0.0.1` and confines paths to the repo.
- [ ] **C7**: fonts per AQ6.

*Versions:* none, unless fonts are embedded (app patch). *Size:* one session.

### S6: Table feel (after AQ4; runs through the wishlist)
- [ ] **B19**: the phone header. **Lower priority after AQ10:** tablets and laptops are the expected devices, and a phone is the emergency fallback. The aim is "usable in an emergency", not phone-first: probably just a header that scrolls away below a width. New wishlist item. Check tablet widths (768–1024 px) in the same pass, since that's where most play will happen.
- [ ] **C5**: refusals go to the toast or inline, confirmations to `openModal`. The 33 `alert()`/`confirm()` calls go.
- [ ] **A10**, per AQ4: weapon/spell tag tooltips in the catalog browser and on Loadout; archetype `lore` on the Archetype tab; drop or show ammunition, arrowheads and the Enchantment tables.
- [ ] **R10, the roster** (AQ5: yes, design for several characters): the saved slots become keyed by S1's `meta.id`, and Home lists them with open, export and remove. Keep the "unsaved since last export" marker: browser storage is a convenience, and clearing site data erases every character in it. The exported file is the copy that lasts. Size isn't a worry: a long campaign is about 220 KB (C8), so a dozen characters fit in `localStorage` easily. Likely a session of its own.

*Versions:* app minor. *Size:* one or two sessions.

### S7: Structure (opportunistic, never a session of its own)
- **A11**: `source: "natural"` replaces `notes: "natural"`, with the next character-schema bump that has another reason to happen.
- **A12**: move each screen's binders beside its renderers when a session is already editing them.
- **C6**: delete the no-op, the `skillsFlags` read and stale comments on sight. Regroup the engine's export object by domain the next time it's touched.
- **C8, C9**: revisit if a save file passes about 1 MB, or before a migration that reshapes an array.

## 4. Versions this will move

| Session | App | Game data | Character schema |
|---|---|---|---|
| S1 | minor | none expected | 0.11 (`meta.id`) |
| S2 | none | none | none |
| S3 | minor | minor | probably none; the proposal confirms |
| S4 | none if outputs are identical | none if outputs are identical | none |
| S5 | patch only if fonts are embedded | none | none |
| S6 | minor | none | none (a roster lives in `localStorage` keys, not the file) |
| S7 | with whatever carries it | none | A11 needs a bump and a `migrate()` step |

## 5. Open questions

For Ken unless marked. Answered ones keep the question, with the answer and date under it.

- **AQ1: How much docs weight to shed?** Short decision records (R1), change tiers (R2), retiring `docs/README.md`, the `HANDOFF.md` stub and SCHEMA §6, and shrinking `CONTRIBUTING.md`.
  - **Answered 2026-09-24, Ken:** "as long as we can always find what we did, and know why, I can trim a lot." He also asked for a better way to anchor decisions so they aren't relitigated. That's §6.
- **AQ2: STATE's exact test count and "Live:" line.** Drop both? The CI result and the footer already carry them. The `todo` count stays.
- **AQ3: B12–B14 now, or with the Professional's final pass?**
  - **Answered 2026-09-24, Ken:** now. Some tweaking will follow, and the data schema was designed to take tweaks without breaking. S3 goes ahead, with each rule as one editable field.
- **AQ4: Unshown content (A10), render or drop, item by item.** The weapon and spell tag glossaries (the audit's pick for tooltips), archetype `lore`, ammunition and arrowheads, the Enchantment tables, archetype `growth`.
- **AQ5: The browser's saved sheet.** Confirm-before-replace, or a roster of several characters?
  - **Answered 2026-09-24, Ken:** design for a multi-character future. For now confirm-before-replace, better still with a way to download the current sheet first. S1 does both, on a stable character id; S6 builds the roster.
  - **No pushback on the direction.** One caution, written into S6: a roster makes it tempting never to export, and browser storage isn't a backup.
- **AQ6: Fonts offline.** Embed them (about +100–200 KB in the single file) or accept the system-font fallback?
- **AQ7: GitHub issues.** No issue has ever been filed, and flags live in SCHEMA §5. Delete the issue templates and CONTRIBUTING's issue flow, or start using issues (for playtest bug reports, say)?
- **AQ8 (CRB fix, Ken): What is "Cat Like Balance"?**
  - **Answered 2026-09-24, Ken:** an Advantage from an earlier version ("+3 bonus to Athletics or Acrobatics checks for balance"), since culled. The prerequisite needs removing or changing. Flagged as **F27**, with the GM's-call stub (S1).
- **AQ9: Releasing from a cloud session.** OK with one dispatchable workflow that creates the tag itself? The alternative is a token Ken provides so a tag push triggers the existing workflows.
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
