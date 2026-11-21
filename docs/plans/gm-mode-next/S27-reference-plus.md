# Work order S27: Reference+ — Skills, Powers and Equipment join the Reference

**Plan:** [`../gm-mode-next.md`](../gm-mode-next.md), session S27. **The ask:** GQ29 — Deighton (2026-10-09) looks up
Skills, Powers and Equipment most and said adding them "wouldn't take away anything"; Scott (2026-11-03) said add them.
Ken (2026-11-20, after S28 merged): "S27 next", and **make sure the codex pack and the Reference panels are up to date
with the latest `private/` mirror.**
**Status:** **drafted 2026-11-20** by Claude (Opus, the S28 reviewer), from `main` at `208afeb` (S28 merged, #376). Not
approved. Questions in §4.
**Branch:** from `main`; PR to `main`. Nothing ships switched off: GM mode is on for everyone (Decision 239).
**Runs beside:** nothing. One build at a time (Ken). **Say N everywhere** (N is the one decision).

**Pre-flight** at `208afeb`. `private/` at `c99bb58` (the 2026-11-15 mirror); the private repo's `origin/main` has nothing
newer (the conductor checked).

### The audit Ken asked for: the Reference's data and the Codex pack against the mirror

Ken (2026-11-20): no newer mirror than `c99bb58` (GQ86 answered), and nobody has audited the data against it. **The audit
is done, in the pre-flight, and is written up in
[`docs/audits/2026-11-20_reference-and-codex-pack-vs-mirror.md`](../../audits/2026-11-20_reference-and-codex-pack-vs-mirror.md)**:
every Reference panel's data and every pack record against `private/`, by script where a string match is the right test
and by hand where the panel is a paraphrase. In short:

- **The pack: no drift.** Byte-identical to the mirror's build; all 42 threats' stats, TOL, WILL, tiers, skills and trait
  names, all 29 groups' compositions, all 7 origins' modifiers and all 114 glossary traits agree with the mirror, checked by
  scripts that share nothing with the builder.
- **The Reference: no drift, no Content fix, no rule needing a ruling.** The six book panels are verbatim (and guarded);
  Conditions, Pain, hits, Recovery and 27 of 29 weapon tags agree in meaning.
- **Two things to sort:** (1) **Anti-Materiel** and **Reach** in the weapon tags are Deighton's 2026-10-10 rulings, ahead
  of the mirror, tracked in `crb-catch-up.md` but **not marked** `rulingSource`, so Decision 288's guard doesn't see them
  (GQ94). (2) Recovery lacks the book's *With Skill* actions: a gap, not drift (GQ92).
- **Actions' two Power items** are Decision 288's own exception (the 2026-11-12 ruling), marked and tracked. Leave.

**Sizing, and the split question: do not split.** The audit took a pass and found nothing to fix, so it is not a build:
it's a record, already written. What S27 *builds* from it is small: the audit's scripts become guards (GQ93), and GQ94's
marker if Ken wants it. Neither is bigger than S27's panels, and the panels are the order. If Ken wants the audit repeated
whenever the mirror moves, the guards in step 1 are how; a standing "audit the paraphrased panels" order would only be
needed if a pass found drift, and this one didn't.

**Carried over** (S28's review; the order's own, not the build's):
- **Count from the sample, not from an old order.** S28's order said *Dead Air* had fourteen members with five blocks; its
  default *In play* filter shows ten or eleven with four. Any figure this order quotes about a sample comes from running it.
- **Name what prints.** Every order since S26: the Reference does not print (print.css has no Reference rule), so the new
  panels add nothing to a printed page. Say so in the PR.
- **A screen rule goes in `shadows.css`.** `print.css` loads only for print.
- **Read what a field holds, not the markup it was drawn with.** The three new panels are read from the data on every draw.
- **The review ran the Reference at 375px** and `npm run phone-check` walks it (`tools/phone-check.mjs` ~349). A 6-column
  weapons table is where this order can fail it.

## 1. Goal and Done when

**Goal.** A GM mid-session who needs a skill's stats, what a power costs and does, or what a piece of kit does and costs
finds it on the Reference, searched with the rest, without opening a player's sheet or the book.

**Done when:**
1. The Reference has three new panels after CRANK, **Skills**, **Powers** and **Equipment**, in the jump bar and the
   search like the thirteen.
2. **Skills:** the roll (trained and untrained, from `skillCheckRules`), then one table per category (Combat, Utility,
   General): skill, primary stat, synergy stat, and what it covers. All 36.
3. **Powers:** the SFR line (`resources.sfr`), then each of the Vampire's and the Werewolf's powers: name, cost, effect,
   and the per-rank line where it has one. A power's `playerNote` shows; its `flagNote` never does.
4. **Equipment:** three parts. **Gear** (the 136, by category: name, availability, cost, what it does), **Weapons** (the
   54: name, skill, damage, reach, cost, tags) and **Armor** (the 38: name, slot, PROT, RES, Integrity, cost).
5. A search narrows them like any panel: "silenced" finds the weapon, "Nanomed" the kit, "Spellcraft" the skill,
   "Bestial" the power.
6. The thirteen panels read exactly as they do today (a diff of `Engine.gmReference` before and after, §10).
7. No page scrolls sideways at 375px on the Reference, with and without a search (`npm run phone-check`).
8. The audit's findings are kept (GQ93, GQ94): the pack's entries, groups and origins are re-read from the mirror by a test
   that shares nothing with the builder; and, if Ken says (a) to GQ94, Anti-Materiel and Reach read as rulings ahead of
   the book where the Reference shows them.

## 2. Tier, versions, numbers

**Rule or shape.** The new panels need new `from` kinds in the engine (`_REF_FROM`, `_REF_READERS`) — a shape the data
names, not only a data edit (GQ29's own note). No stored shape moves.
- **Fix-tier additions (GQ93, GQ94):** two guards from the audit's scripts, and `rulingSource` on two weapon tags if Ken
  answers GQ94 (a). Neither moves a shape (`rulingSource` is already a key the Reference reads on a panel's items).
- **App:** a minor. Join `main`'s `[Unreleased]` heading (0.75.0) if it is still unreleased, else take the next.
- **Game data:** none. The panels are three rows in `gmReference.panels` and one line of Help; no character can observe
  them (Decision 68). Re-check at build: if a panel's *content* needs a data field that doesn't exist, that's a stop.
- **Table, character, pack schema:** none.
- **Decisions:** **N**.
- **Flags:** none.

## 3. The decision, drafted

```
N. **The Reference gains Skills, Powers and Equipment, read from the game data on every draw.**
     *2026-11-?? · Ken + Claude · Touches: gmReference, _REF_FROM, _REF_READERS, from, Skills, Powers, Equipment, Reference tab, skills, archetypes powers, equipment, weapons, armor, resources.sfr, skillCheckRules, playerNote, flagNote, Decision 207, Decision 288, GQ29*
     - **Decided:** `gmReference.panels` gains `skills`, `powers` and `equipment`, after CRANK, each with a `from` that `Engine.gmReference` reads out of the data on every draw: the skills by category with their stats and what they cover; the Vampire's and the Werewolf's powers with their cost and effect; the gear, the weapons and the armor as tables. A flagged entry shows its `playerNote` and never its `flagNote`. The search and the jump bar treat them like the other panels. Nothing is stored.
     - **Why:** GQ29. Deighton and Scott look these up most, mostly on a player's sheet a GM sees only at the table, and the data already holds every figure, so the Reference reads it instead of quoting a second copy that could drift (135).
     - **Rejected:** Book-quoted panels with `parts` (a third copy of 36 skills, 45 powers and 228 items to keep in step with the mirror, where a `from` is read from the one the sheet uses). Powers on the Threats or Cast tab (they are the book's, not a pack's). The player's own gear ("does this character have it") on the Reference (it is per character; the Players tab holds the seat).
     - **Replaces:** Decision 207 in part (its `from` kinds: the list of what a panel may read grows by three).
     - **Revisit if:** a GM asks for Spells or the Arcanist's powers here, or the Reference is too long to scroll at 375px with the sixteen (GQ88).
     - **Built:** app X.Y.Z, PR #…, log 2026-11-….
```

**Supersession marks:** 207 → **superseded in part by N**, and its INDEX line. Read, not changed: 135, 242, 275, 288.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| **GQ86** | **Did you mean a newer mirror than `c99bb58`?** | **Answered, no** (Ken, 2026-11-20). If the book moves, re-pull it into `private/` first and this order is re-pre-flighted |
| **GQ87** | **What does "Powers" cover?** (a) The Vampire's and the Werewolf's powers (45, each with an SFR cost and an effect). (b) Those, and Spells as a fourth panel (125, TN/range/effect, no SFR). (c) Those, and the Arcanist | **(a).** GQ29 says "a power's SFR cost and effect", which only (a) has. Spells are Magic with a different shape, and are their own wish if asked |
| **GQ88** | **Equipment: how much, and in how many panels?** (a) One panel, three parts: Gear, Weapons, Armor (228 rows, searched together). (b) Gear only. (c) Three panels | **(a).** "A piece of gear" means any of the three to a GM; one panel keeps the jump bar at sixteen chips, and the search narrows the rows |
| **GQ89** | **"Whether a character has a piece of gear"** (Deighton's wording in GQ29) is per character | **Not the Reference.** It is the Players tab's, and its own small wish (the builder adds a W). The Reference lists what the gear *is* |
| **GQ90** | **A power or weapon flagged in the data** (1 Vampire power, 10 weapons, 3 armor pieces carry `flagged`) | **Show it with its `playerNote`, as the sheet does; never the `flagNote`** (constraint 9). A Vampire and Werewolf that are `draft` today show their powers; 275 keeps the build-state badge off |
| **GQ91** | **Panel order.** The thirteen stay; where do the three go? | **After CRANK**, Skills, Powers, Equipment. The order is a data edit; the jump bar's chips wrap |
| **GQ92** | **The Recovery panel's missing "With Skill" actions** (Medical: Stop the Bleeding, Treat the Agonized, Stabilize the Dying; Battle Chems) | **Not in S27.** A gap, not drift. The builder adds it as a new W; it is a small Content order (new `recoveryRules` data and a panel part) |
| **GQ93** | **Keep the audit's scripts as guards?** (a) Two tests, in `codexpack.test.mjs` and `rules.test.mjs`: the pack's entries, groups and origins re-read from the mirror independently of the builder, and the data-backed panels' book-sourced strings checked where they are verbatim. (b) The write-up only | **(a).** They are the part of the audit that can run again; the builder's own tests share its parser, so a builder bug would pass them. The hand-read panels (Conditions, Pain, hits, Recovery, tags) stay a written record, since a paraphrase has no string to match |
| **GQ94** | **Mark Anti-Materiel and Reach as rulings ahead of the book?** (a) Yes: a `rulingSource` on a data-backed tag, shown in the Reference as Decision 288 shows it, and a test that each is named in `crb-catch-up.md`. (b) Leave them | **(a).** It is 288's own rule applied to a panel it didn't reach, and two rulings are exactly what the Reference shouldn't show as if they were the book's. It is small: two data fields, one reader line and one test line |

## 5. The assumption sweep

| What | Today (where) | After |
|---|---|---|
| `_REF_FROM` (engine ~9227) | `["conditions","packs","pain","hits","recovery","weaponTags","crank"]`; `_refResolve` returns null for any other `from` | adds `skills`, `powers`, `equipment`. A panel whose `from` isn't listed is still dropped |
| `_REF_READERS` (~9319) | one reader per kind, each returning `_refPart`s; `_refResolve` drops parts with no items, rows or text | three readers, built from `D().skills`, the archetypes' `powers`, `D().equipment`, `weapons`, `armor` through `_refPart`/`_refItem` (no second renderer) |
| `gmReference.panels` (data ~5822) | thirteen rows | sixteen: three `{ id, title, from }` rows after `crank`. Ids `skills`, `powers`, `equipment` (immutable) |
| `Engine.gmReference` search (`_refFilter`) | matches a panel title, then a part's title/lead/columns/footnote, then rows and items | unchanged; a skill's `covers`, a power's effect and a weapon's tags are cells/items, so the search reaches them. **Check a row's text is in the cell, not only on an attribute** |
| `refPartHtml` / `refPanelsHtml` (gm.js 951–971) | tables in `.ref-frame` (a scroll frame), items as `<li>` | unchanged. The 6-column weapons table goes through it; `phone-check`'s "strips" check is the guard |
| `referenceTabHtml` jump bar | one chip per panel | sixteen chips; `wrap:true` already wraps them (Decision 209) |
| `D.skills[].covers` | the wizard's skill rows | read; never written |
| `D.archetypes[].powers` | `cost`, `effect`, `perRank`, `maxRank`, `flagged`, `playerNote`; `flagNote` on one | the reader uses `playerNote` only. **Grep `flagNote` in the new reader**: it must not appear |
| `D.weapons`, `D.armor` | 54 and 38 entries, `flagged`/`playerNote` on 10 and 3 | same rule. Cost shows as the sheet does (`costText` where an entry has it) |
| `resources.sfr`, `skillCheckRules` | the Wizard's and the sheet's text | read for the lead lines; never copied |
| Help `gmGuide.contexts.reference.for` (data ~5578) | "Conditions, the Codex, Defense, checks, damage, Pain Levels, recovery and more" | adds skills, powers and equipment. **Grep the copy and `gmGuide.words`** for "thirteen" and the panel list; none found at pre-flight |
| `tests/engine.test.mjs` 6461–6540 (`refIds`, "every panel the data lists", `froms`) | asserts every data panel resolves and every `from` is known | the three kinds join `froms`; the test that `gmReference([], {})` returns every panel keeps passing |
| `tests/rules.test.mjs` "the Reference's book panels are quoted verbatim" | filters panels with `bookSource` | unchanged; the new panels have none, so it neither covers nor trips on them. **A new guard instead:** their figures are the data's (§10) |
| `_REF_READERS.weaponTags` (~9320) and `weaponTagGlossary` (data ~4287) | maps each tag to `_refItem(id, description, [playerNote])`; no `rulingSource` anywhere on a data-backed panel (only `parts` items carry one; the verbatim test reads `bookSource` panels only) | **GQ94 (a):** `weaponTagGlossary` entries may carry `rulingSource`; the reader shows it as the `parts` items do (find how `refItemHtml`/`_refBook` pass it on: `_refItem` has no such field today, so this is a small shape change in `_refItem` and the item markup: **stop and look** before adding it). Anti-Materiel and Reach get it, citing 288; a test that each marked tag is named in an open `crb-catch-up.md` line |
| `tests/codexpack.test.mjs`, `tests/rules.test.mjs` | the pack's tests share the builder's parser; the verbatim test covers `bookSource` panels | **GQ93 (a):** the audit's two checks join them (§10 tests 8–9) |
| `tools/phone-check.mjs` (~349) | walks `reference` | unchanged; it must still pass with sixteen panels |
| Print | `print.css` has no Reference rule | unchanged. **Name it in the PR:** the Reference doesn't print |
| `docs/STATE.md`, INDEX §3, `CHANGELOG.md`, `shipped.md`, the plan's S27 row | | the close-out below |

## 6. Read first

`CLAUDE.md` (constraints 7, 9; the change tiers). SCHEMA §4: Decisions 135, 207, 242, 275, 288. `engine.js`:
`gmReference` and the `_ref*` helpers (~9221–9400), `crankData`/`_refCrank` as the model of a data-backed panel with
tables. `gm.js`: `refPartHtml`, `refPanelsHtml`, `referenceTabHtml` (945–995). `tests/engine.test.mjs` 6461–6560.
`data`: `skills`, `skillCheckRules`, the archetypes' `powers`, `resources.sfr`, `equipment`, `equipmentCategories`,
`weapons`, `weaponCategories`, `armor`.

## 7. Out of scope

- **Spells** and the Arcanist's powers (GQ87), unless Ken says (b) or (c). **Cybernetics.**
- **A character's own gear or skills** (GQ89).
- **The Recovery panel's "With Skill" part** (GQ92): add it to `WISHLIST.md` as a new W.
- **The ruling items on Actions.** They stay until Ken's book change lands (Decision 288; `crb-catch-up.md` ~182).
- **Reordering the thirteen**, and **editing the pack or the mirror.**
- **A guard tying the data-backed panels' *paraphrase* to the mirror.** Not possible by string match; the audit's hand
  read is the record. (The verbatim and structural checks that *are* possible are GQ93's, in scope.)

## 8. The shapes

No stored shape moves.
- **Data:** three rows in `gmReference.panels`: `{ "id": "skills", "title": "Skills", "from": "skills" }`, and the same for
  `powers` and `equipment`.
- **Engine:** `_REF_FROM` gains the three. `_REF_READERS.skills/powers/equipment` return arrays of `_refPart`. Total: a
  skill, power or weapon with a missing field reads as an empty cell, never throws, and an entry that isn't an object is
  skipped. A reader returning nothing leaves the panel out, as the others do.
  - **Skills:** part 1, no title: `text` = the roll (`skillCheckRules.trained` / `.untrained`); then one part per
    category in the data's order, titled by the category's name, `columns` ["Skill","Primary","Synergy","Covers"], a row
    per skill (`covers` joined with "; ").
  - **Powers:** part 1: `resources.sfr`'s text; then one part per archetype with powers, titled by the archetype, items
    `{ term:name, text:effect, more:[cost, perRank && "Per rank: …", playerNote] }`.
  - **Equipment:** `Gear` by `equipmentCategories` (columns Name, Availability, Cost, What it does); `Weapons` by
    `weaponCategories` (Name, Skill, Damage, Reach, Cost, Tags); `Armor` (Name, Slot, PROT, RES, Integrity, Cost). A
    cost reads as the sheet prints it (`costText`, else the number with `Ç`: use the existing formatter).

## 9. The UI

Copy is drafted for the voice pass.
- The three panels draw through `refPartHtml`; no new markup. At 375px the tables scroll inside `.ref-frame`, as the
  Checks table does.
- **Help's Reference line:** "The book's rules for the table: Conditions, the Codex, Defense, checks, damage, Pain Levels,
  recovery, skills, powers, equipment and more. Search it, or jump to a part."
- **Focus and keys:** unchanged (the jump bar's chips, the search field, `7`).

## 10. Worked examples, as named tests

Each fails on `main`, or the builder says why it already passes. Engine tests in `tests/engine.test.mjs`, smoke in
`tests/smoke-table-frame.test.mjs` (or the file that already draws the Reference).
1. `"N: the Reference has Skills, Powers and Equipment after CRANK, and the thirteen are unchanged"`: `Engine.gmReference([], {})`
   returns sixteen panels, the last three `skills`, `powers`, `equipment`; the first thirteen deep-equal the same call on
   `main` (the builder saves the thirteen's output **before** changing the engine, as a fixture, and diffs it).
2. `"N: Skills lists every skill with its stats"`: 36 rows across Combat, Utility and General; each row's primary and
   synergy stat are `D.skills`'s; the roll text is `skillCheckRules`'s.
3. `"N: Powers lists the Vampire's and the Werewolf's, with cost and effect"`: 45 items; each has its `cost` and `effect`;
   no string anywhere in the panel contains a `flagNote` (the test reads every `flagNote` in the data and searches the
   panel for it), and the flagged Vampire power shows its `playerNote`.
4. `"N: Equipment lists gear, weapons and armor"`: 136 + 54 + 38 rows; a flagged weapon and armor piece show their
   `playerNote` and never their `flagNote`.
5. `"N: a search reaches the new panels"`: `{ q:"nanomed" }` keeps Equipment (and Recovery); a skill's `covers` word, a
   power's effect word and a weapon's tag each keep their panel and drop the others.
6. `"N: the new readers are total"`: with `skills`, `archetypes`, `equipment`, `weapons`, `armor` each set to `[]`, `null`
   and a hostile list (the existing `withData` helper), `gmReference` returns panels and never throws; an empty source
   leaves its panel out.
7. Smoke, `"N: the Reference tab draws the three panels and their jump chips"`: sixteen chips, `#gr-skills`,
   `#gr-powers`, `#gr-equipment`; a hostile name (`<img src=x>`) in a skill, power and weapon renders as text.

8. `codexpack.test.mjs`, `"the pack's threats, groups and origins agree with the mirror, read independently of the builder"`: re-reads
   2612's `**ENTRY n**` blocks (stat row, tier, skills and totals, trait names), the 29 `**Composition:**` lines and 2610's origin
   modifiers with its own small parsers, and compares them with the pack. Passes on `main` (the audit found no drift): the
   builder **mutation-tests it** by changing a stat, a skill total, a group count and an origin modifier in a copy of the
   mirror's text and seeing each fail. (Source: the scratch scripts `packaudit.mjs`, `packaudit2.mjs` in the shared notes
   folder.)
9. `rules.test.mjs`, `"the Reference's data-backed book strings that are verbatim stay verbatim"`: (only if the builder can
   name a list this isn't already; the six `bookSource` panels have it) otherwise **skip it and say so**. The audit's
   `refdrift.mjs` shows why a general string match is wrong for paraphrase: 106 of its hits are our wording.
10. If GQ94 (a): `"a weapon tag that says a ruling the book doesn't is marked, and named in crb-catch-up"` (Anti-Materiel, Reach).

## 11. Tests beyond the examples

- **Mutation-test:** a reader that prints `flagNote` (test 3 or 4 fails); `_REF_FROM` missing one kind (test 1); a
  reader that drops the Werewolf (test 3); the search reading only titles (test 5).
- **Phone:** `npm run phone-check` passes with sixteen panels. If the weapons table is the one that fails, say which
  column, and stop (§13).
- **Real browser:** the Reference in the dev preview at desktop and 375px: the jump bar wraps, a search for a weapon
  shows one panel, the Equipment tables scroll inside their frame. Screenshots on the PR.
- **Voice:** `voice.test.mjs` over the new strings; Help's line for a voice pass.

## 12. Steps

1. Baseline: `git submodule update --init private`, then `npm run test:fast`. Run the pack check Ken asked for as a
   one-line record in the PR: `npm run codex-pack` leaves `git -C private status` clean.
2. If GQ93 (a): write the audit's two guards (§10 tests 8–9) first, show they pass on `main`, mutation-test them, and run
   `npm run verify`. They are a Fix, and could ship alone if the panels stall.
3. Save the thirteen panels' `Engine.gmReference` output as a fixture. Write the worked examples; show them failing.
4. The readers and `_REF_FROM`. Run `npm run verify`.
5. The three data rows, Help's line (and GQ94's marker). Run the preview, then `npm run phone-check`.
6. Close-out. Run the full `npm run verify`.

## 13. Stop and ask

- **Stop** if:
  - a panel can't be built from the data without a new field (that is a data change, Ken's);
  - the weapons table doesn't fit `.ref-frame` at 375px without a sideways page scroll;
  - Ken answers GQ87 (b) or (c): Spells are a different shape and need their own order;
  - the pack check in step 1 leaves `private/` dirty (the pack has drifted: report it, don't commit it).
- **Expected, not stops:** the panel counts in the tests that list `froms` and `refIds`; Help's line, if a test pins it.

## 14. Close-out

The `close-the-session` skill for *Rule or shape*:
- Decision N, its INDEX line, and the mark on 207.
- The app minor. No data or schema bump.
- STATE rewritten (the GM mode row).
- The log, a `shipped.md` row; the plan's S27 row built; GQ86–GQ94 answered. The wishlist: the Players-tab "has this
  gear" wish (GQ89) and the Recovery "With Skill" part (GQ92) added as new W ids; any wish this order takes up gets its
  **Plan** line rewritten.

**CHANGELOG** (drafted, GM voice, under *GM mode*, bold lead-in like its neighbours):
- "**Skills, Powers and Equipment are on the Reference.** The skills with their stats, the Vampire's and Werewolf's powers with what they cost, and every piece of gear, weapon and armor, searched like the rest."

**PR title:** `feat(gm): the Reference gains Skills, Powers and Equipment (S27, Decision N)`.

**PR body:** the template's sections, plus **New strings as rendered**, **Screenshots** (the Reference at desktop and
375px), **The pack check** (the command and its clean status; the audit is `docs/audits/2026-11-20_reference-and-codex-pack-vs-mirror.md`) and **Where the order didn't fit**.

**Review checklist:**
- §1's seven checks, run in the preview.
- The thirteen's output diffed against `main`'s.
- Every `flagNote` in the data absent from the rendered page (grep the DOM text).
- The counts (36, 45, 136, 54, 38) against the data, not this order's numbers.
- Hostile names; the voice of every string.
- `npm run phone-check`; the Reference with a search, at 375px.

## 15. Handing it over

The builder and reviewer prompts are in `WORK-ORDERS.md`, with this order's path. Its own traps:
- **Read the data; don't quote it.** A panel here is a reader over `D`, never `parts` typed into the data.
- **`flagNote` never renders.** `playerNote` does.
- **One renderer.** The readers return `_refPart`/`_refItem`; `refPartHtml` draws them.
- **Count from the data at build**, not from §1.
- **Take the number at build** (the decision, the app) from `origin/main`, and again after any rebase.
