# Plan: acting on the 2026-09-24 whole-app audit

**Status:** under way. **Every question is answered** (§5). **S1, S2 and S3 are done** (S1: app 0.24.0, character schema 0.11, game data 0.17; S2: docs only; S3: app 0.25.0, game data 0.18). Next: S4, S5 or S6, in any order.
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

### S4: Read it or label it (engine change, propose first)
- [ ] **A8, Arcanist half**: `disciplines.cpPerRank` read by `disciplineSpent` and the wizard (the two hardcoded 6s go); `maxRankBy` read; the Evocation starting rank declared on the discipline, not matched by id.
- [ ] **A9**, for each "setting the engine ignores": read it, or rename it as display text. The stat IP formula and SAN formula become numbers the engine reads (the skill prices went in S3). `boostRules` is read or trimmed. `startingSFR` becomes `{ stat, times, plus }`. The credit symbol comes from data. The milestone cadence prose (two data fields, two engine strings) is generated from the numbers.
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
    **Before they render:** three flagged tags (Suppression, Blast, Reach) have a `description` that says "(Undefined … see flagNote.)", which is maintainer text. Each needs a player-facing `description` or `playerNote` first (F28–F31, Decision 70).
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
| S3 | minor (0.25.0) | minor (0.18) | none |
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
