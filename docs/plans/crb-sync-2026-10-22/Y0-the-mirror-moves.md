# Work order Y0 — The mirror moves

**Plan:** [`../crb-sync-2026-10-22.md`](../crb-sync-2026-10-22.md) §2, row Y0, **with Y2 folded in** (below).
**Status:** **drafted 2026-10-22 by Claude (Opus)**, pre-flighted against `main` at `69d3845` (#223 merged,
docs only) with `private/` moved to `a8d53ab`. **Approved by Ken 2026-10-22, as written.** Shadows-Private's `origin/main`
is at `a8d53ab` (Ken pushed it the same day).
**Tier: Fix + Content.** No decision, no flag, no schema bump. `gamedataVersion` moves (a new catalog piece).
**Two repos, two PRs.** A **Shadows-Private** PR (the Codex pack builder, the mirror's README) and a
**Shadows-Character-Sheet** PR (the `private/` pointer, the guards, the data). The second points at the first.
**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md). Ken starts **Y0 build**
(Sonnet), then a fresh reviewer (Opus) once both PRs are open. Nothing ships switched off.

**Why Y2 is folded in.** The plan had Y0 (move the pointer) before Y2 (repair the pack builder). That order
can't go green: `tests/codexpack.test.mjs`'s *"the committed Codex pack is what the mirror builds, byte for
byte"* asserts the builder has **no problems** with the mirror, and the builder refuses the new one (32
problems). The pointer can only move to a Shadows-Private commit whose builder reads the split Codex. The
pre-flight patched a scratch copy of the builder with the six changes in §3a, and the pack it built was
**byte-identical** to the committed one: the Codex's content didn't change, only its files. So the repair is
small, provable and belongs here.

**Carried over:** nothing; this is the plan's first order.

---

## Pre-flight

Against Shadows-Character-Sheet `main` at `69d3845` and Shadows-Private at `a8d53ab` (`5541c61`, Ken's
refresh, plus the eight `APPROVED` documents), read 2026-10-22.

```
npm run verify, pointer at a8d53ab   1259 tests, 1255 pass, 4 fail, 0 todo. All four are this order's:
  codexpack  "the committed Codex pack is what the mirror builds, byte for byte"
             the builder: "the book has no Origin Modifiers table", 7 sections and 11 roster origins
             "in no list", the glossary's 14 origin headings "not an origin" (32 problems)
  rules 1244 R15 withdrawal steps: Forge Fang's step 1 is "Withdrawal: −1 RoU" in 0414, "−1 RoU." in the data
  rules 1310 0414's Majors: the table is HTML now; the guard reads pipe rows, finds 0, data has 29
  rules 1348 R16: 0413 no longer prints "Spend your Base Powers on Innate and Bloodline powers; …"
The scratch builder (§3a's six changes), against the new mirror:
  problems 0 · warnings 3 (Entries 17, 24, 28: the same three the committed pack's build gives)
  byte-identical to private/gm/threat-codex.shadows-pack.json · every section's ids, counts and records equal
The 0414 Majors as HTML, against the data, row by row:
  29 rows, 29 Majors; names and prerequisites all equal; one effect differs: Off the Leash,
  book "…make a Medical check against Difficulty 15.<br />On a success…", data "…against 15. On a success…"
Data today
  forge-fang withdrawal.steps[0]   "−1 RoU."                    (shadows-data.js, the Werewolf's specialization)
  talented benefit                 "…or one rank of an existing Advantage."   (milestones.minorShared, ~3512)
  0450 now prints                  "…or one rank of an existing Advantage that has multiple ranks."
  Talented's engine offer          already a held Advantage with a rank to spare (engine ~3069): no code moves
  armor                            no Layered Street Clothes; 0460 prints it first in the Full coverage table
  gamedataVersion 0.44 · app 0.52.0 under [Unreleased] (P21, unreleased)
encounterArmor({ armor: ["Layered Street Clothes (PROT 1d4, RES +2, INT 10)"] })
                                   piece null, stops null (engine ~7695); engine.test 4814 pins exactly that
```

---

## 1. Goal

When both PRs are merged:

1. `private/` points at a Shadows-Private commit that has the 2026-10-22 refresh, the `APPROVED` documents and
   a builder that reads the split Codex. `npm run codex-pack` rebuilds the pack **unchanged**.
2. `npm run verify` passes, with every CRB guard reading the book as it now is.
3. The data matches the book on four small points: Forge Fang's step 1, Talented's text, Off the Leash's text,
   and **Layered Street Clothes** in the armor catalog.

## 2. Scope

**In:** §3a (Shadows-Private), §3b–§3d (Shadows-Character-Sheet), their tests, the close-out.

**Out, on purpose:**
- The Vampire's and Werewolf's power wording: R16 is re-pinned to the new sentence (§3c) and **nothing else
  moves**. The `campaignPowerScaling.notes` text and `powersBought` are Y4's.
- The Enforcer (Y1).
- `WIP_Threat_Codex_v2`'s new card format and Shared Rules: the builder stops reading v2 (§3a), so neither
  touches the pack.
- The ledger's `sources` keys (`codex`, `v2`, `audit`) and dates: unchanged, or the pack's meta changes and
  it stops being byte-identical. Renaming `v2` is not this order's.
- The Codex prints Layered Street Clothes as **INT 10**; `0460` prints **INT 5**. The catalog follows `0460`
  (Decision 92). The mismatch is the book's: list it in the PR for Ken's `crb-catch-up.md`, don't resolve it.

## 3. The changes

### 3a. Shadows-Private: the builder reads the split Codex

Branch in `private/` from Shadows-Private's `main`. Its `main` must already contain `a8d53ab`
(see *Stop and ask*). In `gm/build-codex-pack.mjs`:

| # | Where | Today | After |
|---|---|---|---|
| 1 | `sources()` | `human`: `Threat_Codex_Intro_Human.md`; `v2`: `WIP_Threat_Codex_v2.md` | `human`: `2610_Threat_Codex.md`, `2612_Mortal_Threats.md`, `2616_Trait_Glossary.md`, `2617_Trait_Library.md`, each with its first-line mirror comment dropped, joined with `"\n"`. `v2`: `2610_Threat_Codex.md` and `2611_Mortal_NPCs.md`, the same way. `audit` unchanged. Keep the parameter names `human` and `v2` (the tests pass them by name) |
| 2 | top of `parseCodex` | `lines(human)`, `lines(v2)` | first rejoin a heading the conversion split over two lines: `/^###\s*\\\n/gm` → `"### "` (2610 prints `### \` then `NPC Roles`). Apply to both texts |
| 3 | origins | `slice(V, /^####\s+Origin Modifiers\s*$/, /^#{1,4}\s/)` | `slice(V, /^###\s+Origins\s*$/, /^#{1,4}\s/)`. Same 4-cell HTML rows |
| 4 | tier labels | `slice(H, /^\*\*How to Read an Entry\*\*/, /^\*\*TOL and WILL/)` | `slice(H, /^##\s+Codex Overview\s*$/, /^#{1,3}\s/)`. The Tier row's regex already takes `T4` with or without `/Apex` |
| 5 | an entry's traits | a paragraph must start `**Name.**` | strip a leading list number first (`/^\d+\.\s+/`) and then match as today. 2612 numbers them `1.  **Numbers Game.**`, running across entries |
| 6 | the glossary | `slice(H, /^\*\*PART C\*\*/, /^\*\*PART D\*\*/)` | `slice(H, /^\*\*PART C\*\*/, /^##\s/)`. There's no PART D marker now; 2617's first `## ` heading ends it |

Also, in Shadows-Private:
- The builder's header comment says what it reads: `2610`–`2612`, `2616`, `2617` and the Stat Audit, and that
  v2 is no longer read.
- **Delete `crb/Threat_Codex_Intro_Human.md`**, and its README row. The README's own row says to do exactly
  this once the builder is repointed.
- README: the `2610`–`2617` row says the builder reads them; the `WIP_Threat_Codex_v2` row says the builder
  no longer reads it (Scott's work in progress, kept for S12).
- Run `npm run codex-pack` from the sheet repo: `gm/threat-codex.shadows-pack.json` and `gm/ids.json` show
  **no diff**. That is the proof, and it goes in the PR.

PR title: `gm: the Codex pack builder reads the split Codex (2610–2617)`. **Ken merges it with a merge commit
or a fast-forward, never a squash**: a squash leaves the commit the sheet points at unreachable from `main`.

### 3b. Shadows-Character-Sheet: the pointer and the Codex tests

- `private/` → the head of §3a's branch.
- `tests/codexpack.test.mjs`'s made-up codex (built inline, around lines 100–200) moves to the split shapes,
  so it tests what the builder now reads: an `## Codex Overview` table with a Tier row; an `### Origins` HTML
  table (not `#### Origin Modifiers`); the NPC Roles heading split as `### \` + newline + `NPC Roles`; traits
  as a numbered list; a glossary from `**PART C**` that ends at a `## ` heading, with no PART D. Keep every
  made-up name (each was grepped against the mirror). Every existing assertion on the made-up codex still holds.
- Add one test per §3a change (2–6) that **fails on the old builder**: a made-up codex with only that shape
  changed builds with no problems.

### 3c. Shadows-Character-Sheet: the guards read the book as it is

- **R15, withdrawal steps** (`rules.test.mjs` ~1244): unchanged. It passes once the data changes (§3d).
- **0414's Majors** (~1310): read the rows from the HTML table under `## Growth & Milestones` (the `<tr>` /
  `<td>` pattern `crbTableAfter` already uses, header row dropped), each cell's `<br />` and the newlines
  around it turned into one space and whitespace collapsed, then compared **exactly** as today (not through
  `flat`, which drops periods). Still 29, in order.
- **R16** (~1348): pin the new sentence:
  `/Every Vampire gets the full set of Innate Powers\. You then are granted a number of Bloodline powers during character creation, at Rank 1\./`.
  Rewrite the comment above it: the book now prints the rule Y4 builds (YQ1); until Y4, the data's notes
  are Decision 215's. **The two `notes` assertions and `powersBought` stay exactly as they are.**
- **R15, the Origin powers' max rank** (~1234): the message `"can eventually raise them up to Rank 3"` quotes
  a sentence 0414 no longer prints. Make it `"its Per Rank column stops at Rank 3"`. The assertion stays.
- **0450's Minors** (~1520): delete Talented's special case and its comment ("an editor's bracket"): the
  bracket is gone, and the workaround would now pass a Talented text that's wrong.

### 3d. Shadows-Character-Sheet: the data

| What | Where | Today | After |
|---|---|---|---|
| Forge Fang, withdrawal step 1 | `archetypes` → werewolf → `specialization.options` → `forge-fang` → `withdrawal.steps[0]` | `"−1 RoU."` | `"Withdrawal: −1 RoU."` (as Trueborn's `"Weakened: …"`) |
| Talented | `milestones.minorShared` → `talented` → `benefit` | `"…or one rank of an existing Advantage."` | `"…or one rank of an existing Advantage that has multiple ranks."` |
| Off the Leash | werewolf → `growth.majorMilestones` → `off-the-leash` → `benefit` | `"…make a Medical check against 15. On a success…"` | `"…make a Medical check against Difficulty 15. On a success…"` (one paragraph, as every Major's benefit) |
| Layered Street Clothes | `armor`, **immediately before** `motorcycle-leathers` (the book's order) | absent | `{ "id": "layered-street-clothes", "name": "Layered Street Clothes", "slot": "body", "coverage": "full", "prot": "1d4", "res": 2, "integrity": 5, "quality": "Low", "material": "Light", "availability": "Common", "mods": 0, "cost": 175, "flavorLine": "The default outfit of most NYTE City residents who are not looking for trouble." }` |

The id is permanent once it ships (constraint 6). `coverage: "full"` because `0460` prints it in the Full
coverage table. The `flavorLine` is the book's own sentence.

## 4. The sweep

| Changed | Today, where | Readers (grepped) | After |
|---|---|---|---|
| `withdrawal.steps[0]` | data | `panelSteps` (engine ~3715) → `panelTracker`'s `step`; `sheet.js` ~1497 renders **"Step 1:** *text*" | "Step 1: Withdrawal: −1 RoU." Trueborn's and Wildblood's read the same way today. No GM reader |
| Talented `benefit` | data | Progression's Minor picker; rules 1520 (§3c). The engine's offer reads `choice`, not the text | the picker's text; the offer is unchanged |
| Off the Leash `benefit` | data | the Werewolf's Majors on the Character tab and Progression's picker; rules 1310 | the new text |
| `armor` gains a piece | data | the shop (`openCatalog("armor")`, `Engine.catalogLine`), the loadout, print, engine.test 263 / 517–520 (refs, dupes, fields), `D.armor[0]` users (hostile 87, engine 1227, 1237; unchanged: the new piece isn't first). **And GM mode's `encounterArmor`** (engine ~7695): it matches a Codex armor line by name | Codex Entries 24 and 36 (*Layered Street Clothes (PROT 1d4, RES +2, INT 10)*) now resolve: static PROT 3, RES 2, integrity **5** from the catalog. GM mode is switched off; the change is still real, and the PR says so |
| `encounterArmor`'s test | engine.test 4814–4817 | it uses Layered Street Clothes as the line the catalog **can't** match | **An expected break.** Swap that example for `Patched Overcoat (PROT 1d4, RES +2, INT 10)` (in neither the data nor the mirror) in both places, and add: Layered Street Clothes now resolves to `layered-street-clothes` with stops `{ prot: 3, res: 2 }` |
| `codexpack` 554 | `real_.includes("Layered Street Clothes (PROT 1d4, RES +2, INT 10)")` | the pack's armor line | unchanged: the pack keeps the book's line |
| the pointer | `private/` | every CRB test; CI's checkout | §3a's commit, which must be on GitHub (*Stop and ask*) |

**Run the whole suite once with only the pointer moved, before any other change.** The pre-flight's full
`npm run verify` (pointer at `a8d53ab`) had exactly the four failures above. Moved to §3a's head, the real-pack
test passes, the three guards still fail, and the made-up codex's tests in `codexpack.test.mjs` fail too
(§3b moves them to the new shapes). Any other failure is a reader this sweep missed: stop and say which.

## 5. Tests

Written first, and shown failing on `main` with the pointer moved, where they can:
1. §3b's five builder tests, one per changed shape: each fails on the old builder.
2. §3c's re-pinned guards pass, and each is **mutation-tested**: put `"−1 RoU."` back (R15 fails); change one
   word of Off the Leash in the data (the Majors guard fails); restore the old R16 regex (fails on the new
   mirror); restore Talented's old text (the 0450 guard fails now that its special case is gone).
3. **New, `rules.test.mjs`:** *"CRB 0460: Layered Street Clothes is the book's row"*. Read the row from
   `0460_Gear.md`'s Full coverage table by name and compare PROT, RES, INT, Quality, Material, Availability,
   Mods and Cost with the data's piece. Mutation: `integrity: 10` fails it.
4. engine.test's `encounterArmor` test as §4 says.
5. `npm run codex-pack` leaves the pack and the ledger with no diff (in the PR, as output).

## 6. Steps

1. **Shadows-Private first.** `git -C private fetch`; check `origin/main` contains `a8d53ab`. Branch, make
   §3a, run `npm run codex-pack` from the sheet repo, open the PR. Don't merge it.
2. **The sheet.** Branch from `main`. Move `private/` to §3a's head. `npm run verify`: record the failures and
   compare them with the pre-flight (§4's warning).
3. §3b, then §3c, then §3d, with §5's tests written first in each. `npm run test:fast` between.
4. `npm run verify` and `npm run phone-check`. In the dev preview (`shadows-dev-preview`): buy Layered Street
   Clothes in the shop and wear it; on a Forge Fang, count Call of the Wild to 1 and read the step. A
   screenshot of each for the PR.
5. Mutation tests (§5), each recorded in the PR.
6. Close out (§8). Open the sheet PR, saying it needs the Shadows-Private PR merged first, never squashed.

## 7. Stop and ask

- **`a8d53ab` isn't on Shadows-Private's `origin/main`.** Ken pushes it first. Don't push it yourself, and
  don't base the private branch on a commit that's only local.
- The scratch builder was byte-identical. **If yours isn't**, stop and show the diff: the Codex didn't change.
- The suite with only the pointer moved fails anything §4 doesn't list.
- **Not a stop:** engine.test 4814–4817 (expected, §4); the version literals your own bump moves; R16's
  sentence and the 0450 special case (§3c says what to do).

## 8. Close-out

The **close-the-session** skill, at this tier:
- **CHANGELOG**, under `[Unreleased]`, player voice, then `npm run changelog`:
  - "**Layered Street Clothes are in the armor shop:** everyday clothes that stop a little. PROT 1d4, RES +2, 175Ç."
  - "**A Forge Fang's first withdrawal step is named, Talented says it raises an Advantage that has ranks, and Off the Leash names its Difficulty,** as the book now prints them."
- `npm run bump -- X.Y.Z`: the next **patch** after the one `[Unreleased]` names (0.52.1 while 0.52.0 is
  unreleased). `gamedataVersion` 0.44 → 0.45 (Decision 68: a new choice). No schema bump.
- A `docs/log/2026.md` entry (Content tier): the mirror moved, the builder followed with the pack unchanged,
  the INT 5 / INT 10 mismatch handed to Ken. A row in `docs/log/shipped.md`.
- **STATE**: the versions line, and §5's *Where to start* (Y0 built; Y1, Y4 next; Y2 folded into Y0).
- **The plan**: Y0's row *built, PRs …*; Y2's row *folded into Y0*.

## 9. Review checklist

For the reviewer, against both PRs:
- [ ] `npm run codex-pack` from a clean checkout of both branches: no diff in the pack or the ledger.
- [ ] The builder no longer reads `Threat_Codex_Intro_Human` or `WIP_Threat_Codex_v2`, and the first is gone.
- [ ] Each of §3a's six changes has a made-up-codex test that fails on the old builder (re-run one).
- [ ] The Majors guard compares exactly, not through `flat`; change a period in Off the Leash and it fails.
- [ ] R16's notes and `powersBought` assertions are untouched (Y4 owns them).
- [ ] Talented's special case is gone from the 0450 guard.
- [ ] Layered Street Clothes: the new 0460 guard; the shop sells it; GM mode resolves Entry 24's armor line.
- [ ] Versions: app patch, `gamedataVersion` 0.45, no schema bump. CHANGELOG lines, `npm run changelog` run.
- [ ] The sheet PR says the private PR merges first, and not by squash.

## 10. Handing it over

Traps for the builder, under the README's prompt:
- **Two repos.** `private/` is its own clone, so commit and push there separately. Committing in the sheet
  repo with `git commit -a` also commits the pointer; that's wanted only in step 2's commit.
- **CRLF.** A Windows checkout may hand the builder CRLF text; `lines()` already strips `\r`. Keep it that way.
- **Don't reach for `flat` in the Majors guard**: it drops periods, so it would pass a wrong text.
- **The made-up codex's names were each grepped against the mirror.** Add none without grepping.
