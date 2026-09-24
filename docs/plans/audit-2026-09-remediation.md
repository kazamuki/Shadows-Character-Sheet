# Plan: acting on the 2026-09-24 whole-app audit

**Status:** under way. **Every question is answered** (§5). **S1 is done** (app 0.24.0, character schema 0.11, game data 0.17), not yet merged. Next: S3, S5 or S2, in any order; S6 follows AQ4's answers.
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
- [x] **B15**: flagged as **F27** on 2026-09-24 (app 0.23.1, game data 0.17). The culled Cat Like Balance prerequisite is the GM's call until 041 removes or replaces it.
- [x] **C13**: the voice corpus renders every archetype's sheet, with its first specialization chosen, plus Admin. Mutation-tested with "(TBD)" put back on a Trueborn power.
- [x] **AQ2**, pulled forward from S2 because this session changed the test count: STATE states the todo count only (Decision 127).

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
- [ ] **A10**, as Ken answered AQ4. One principle: any rule the sheet names, a player can read without leaving it.
  - **Tags** (weapon, feature, spell): the glossary sentence on hover or tap, wherever a tag shows (the catalog browser, Loadout, Main, the Grimoire). Build one tooltip-or-popover primitive and reuse it for everything below, not a copy per place.
  - **Lore:** on the wizard's archetype card, and as a collapsed *Lineage* section on the Archetype tab.
  - **Ammunition and arrowheads:** an *Ammo* category in the equipment catalog, carried and counted like other gear. A later step could let Reload take a magazine from what you carry; that's a wishlist item, not this one.
  - **Enchantment and Alchemy tables:** in the Arcanist's Magic reference, collapsed until opened.
  - **Rules text** (botch, explosion, difficulty numbers, stat ranges, the Spellcraft sub-rules): in the reference panels, or on hover where the number they explain is shown.
  - **Archetype Majors (`growth`):** stay hidden.
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
  - **Answered 2026-09-24, Ken:** an Advantage from an earlier version ("+3 bonus to Athletics or Acrobatics checks for balance"), since culled. The prerequisite needs removing or changing. Flagged as **F27**, with the GM's-call stub (S1).
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
