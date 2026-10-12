# Work order P6 — Milestones: repeats, the rebalanced values, and the General Majors' owner

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W103**
(`WISHLIST.md`); closes **F9**. Decisions 29, 91, 199, 213, and 216 for the
format of a worked decision. Deighton's rulings are
`../../reference/rulings-2026-10-10.md` Q26, Q27, Q28 and Q32.
**Status:** **drafted 2026-10-12 by Claude (Sonnet)**, pre-flighted against
`main` after #170 (0.42.0's release PR, #171). **Not yet approved by Ken:** §4
has PQ1–PQ3 with defaults.
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs alone.** It touches `shadows-data.js` (`milestones`), `engine.js`
(`majorPool`, `majorOffered`, `canTakeMinor`, `takeMilestone`, `versionCheck`),
`sheet.js` (the Milestones part of Progression), the tests, and the docs. No
schema bump, nothing in `gm.js` or `private/` but a read of the mirror.

**What P6 is.** Deighton ruled on the Milestones on 2026-10-10 and nothing
has built it. Three rulings, one session:

- **Any Minor Milestone repeats, at any time.** Today a Minor can't be taken
  again until all five have been taken once (Decision 29).
- **The rebalanced Minor values:** Skilled is two Skills, one rank each (was
  5 Skill Points); Improved is **3d10+30** IP (was 2d10+15); Redeemed takes a
  Disadvantage worth 5 points or less (was any). Talented and the cap of 10
  stand.
- **The General Major Milestones are the Professional's only (F9).** Every
  other archetype gets its own, as it is written; until then an Arcanist has
  none, and a Werewolf has only its own. P1 already moved Improved's numbers
  into the data, so the +30 is a data edit.

---

## 1. Goal

When P6 is merged:

1. **Any Minor can be taken whenever a Minor is unlocked**, as often as the
   player likes. The picker shows "taken ×N" as it does now. Nothing else
   about when a Minor unlocks changes.
2. **Improved asks for 3d10 and adds 30.** The box, its label and the IP
   granted all follow the data: "Roll 3d10 … + 30 IP".
3. **Skilled and Redeemed read as the rebalanced text.** A Minor already taken
   keeps what it gave: no character's IP, Skills or Disadvantages move.
4. **Only a Professional is offered the General Majors.** An Arcanist, a
   Vampire, a Cyborg and a Mortal-with-no-list are offered none until their
   own are written. A Werewolf is offered its Origin's own and nothing else.
5. **A saved character who already took a General Major keeps it.** It still
   shows in the journal with its name, its prerequisites still count for
   `majorCount` and `milestones` chains, and whatever it grants still applies.
   `versionCheck` says, once per such Major, that it isn't on this
   archetype's list; nothing is removed.
6. **The Major group never narrates the build.** An archetype with nothing
   to offer sees a plain line, not "coming soon" (constraint 9).

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** It changes which choices a character has (Majors
  by archetype, Minors without a floor) and supersedes two decisions. One
  numbered decision, **N** (the next free number on `origin/main` when you
  write it).
- **App: minor** (`npm run bump -- 0.43.0`, or the next minor if one lands
  first). Repeating a Minor is a new capability.
- **Game data: bump** (Decision 68). Improved's roll, three benefits and which
  Majors an archetype is offered all change what a character can observe.
- **Character schema: no bump.** Nothing new is stored; a taken Major keeps
  its `{ id, date }`.
- **F9 closes:** its `SCHEMA.md` §5 row, `flagged` in the data (the
  `majorGeneralNote` and the REVIEW comment above `minorShared`), and its
  `INDEX.md` §2 line. See the **close-a-flag** skill.
- **CHANGELOG** lines under `[Unreleased] — app 0.43.0`, player voice (§12).

## 3. The decision, drafted

Write this as Decision **N** in `SCHEMA.md` §4, with its INDEX §3 line under
the Milestones topic, and mark what it replaces.

```
N. **Any Minor Milestone repeats at any time; Improved is 3d10+30, Skilled two Skills a rank each, Redeemed a Disadvantage worth 5 or less; the General Majors are the Professional's.**
     *2026-10-1x · Ken + Claude (Deighton's rulings Q26, Q27, Q32) · Touches: minorShared, canTakeMinor, takeMilestone, Improved, ipRoll, Skilled, Redeemed, Talented, Honed, majorGeneral, majorPool, majorOffered, majorById, growth.majorMilestones, Milestones, versionCheck, F9, W103*
     - **Decided:** `canTakeMinor` asks only that a Minor is unlocked; it has no floor on repeats. Improved's `ipRoll` is `{ count: 3, sides: 10, plus: 30 }`; Skilled and Redeemed carry the rebalanced text. A Major is offered from the archetype's own `growth.majorMilestones` list, and from `majorGeneral` only where `growth.majorMilestones` is `"general"` (the Professional). A taken Major from either list is still found by id, still counts, still grants.
     - **Why:** Deighton (2026-10-10, Q26, Q27, Q32): the rebalanced values stand, any Minor repeats, and the General Majors were the Professional's section of the WIP, not a shared one.
     - **Rejected:** removing a taken General Major from a saved Arcanist, Vampire or Cyborg (constraints 7 and 10: a file's choices are never discarded); offering the General list to everyone "until their own are written" (Deighton ruled it out); a `repeatable` flag per Minor (all five repeat, so it would be a setting nothing reads, Decision 135).
     - **Replaces:** Decision 29 in part (the Minor repeat floor). Decision 199 in part (a Werewolf's Majors are offered beside the shared list: now they are offered alone, VQ16's "until F9"). Closes F9.
     - **Revisit if:** another archetype's Majors are written and one should be open to all; Deighton rules on Skilled's two Skills being any two (PQ1).
     - **Built:** app 0.43.0, game data 0.36, PR #…, log 2026-10-1x.
```

Supersession marks: Decision 29 and Decision 199 each get
`→ **Superseded in part by Decision N**` with the clause, and their INDEX
lines `→ **superseded in part by N**`. `docs.test.mjs` reads only the first
mark on an entry; if one already has a mark, extend it as P5 did with 153.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| PQ1 | **Skilled's wording, and is it enforced?** Today every Minor but Improved is text the player applies by hand (Skilled's 5 Skill Points, Honed's Stat point). Deighton's "two Skills, one rank each" doesn't say whether they must be different. | **Text only, as today, copied from `0450` in the mirror.** If the book's words say the two are different, say so in the text; the app doesn't enforce any Minor but Improved. Wiring Skilled to Raise a Skill is a later session, if wanted. |
| PQ2 | **What does an archetype with no Majors see?** An Arcanist, a Vampire (until P4b) and a Cyborg have none to take, though Major points still unlock. | **The Major group stays, with one plain line: "No Major Milestones for this archetype."** MP and the unlock count keep counting. No "coming soon" (constraint 9). |
| PQ3 | **Steadied.** `0450` adds a sixth Minor, Steadied, that the sheet doesn't have (`crb-v4-sync.md` §1). Add it here? | **Yes, as text, copied verbatim from `0450`**, since "five" becomes "six" in the same data and the repeat rule is about all of them. If its text names a number or a tracker the app computes (Luck, SAN, TOL), **stop and ask**: don't compute it. |

Consequence to know, not a question: **Vampires lose the General Majors
today** and have none until P4b writes their own. That is what the ruling
says (a Vampire's own list is `[]`). Say so in the PR.

## 5. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- `WISHLIST.md` W103, and the rulings, Q26, Q27, Q28 and Q32.
- Decisions **29**, **91** (the prerequisite vocabulary), **199** (the
  pool: `majorPool`, `majorOffered`), **213** (`ipRoll`) in `SCHEMA.md` §4.
- `src/engine/engine.js`:
  - `majorPool`, `majorById`, `majorTakenIds`, `majorOffered` (~190–210).
    **`majorPool` is both the offer and the lookup, and must stop being.**
  - `grants()`'s scan of taken Majors through `majorById` (~180), and
    `formGrants`.
  - `milestoneState`, `canTakeMinor`, `checkPrereqs` (`majorCount`,
    `milestones`), `majorPrereqs`, `ipRoll`, `ipRollTotal`,
    `takeMilestone` (~1900–2035).
  - `versionCheck`: where it names things on a file that aren't on the sheet
    any more (the power branch is the model).
- `src/data/shadows-data.js`: `milestones` (`rules`, `minorShared`,
  `majorGeneral`, `majorGeneralNote`, `minorNote`, `majorNote`,
  `minorSharedSource`), and each archetype's `growth`. The Professional's is
  `majorMilestones: "general"`, a string; the others are lists.
- `src/ui/sheet.js`: the Milestones part of `renderShProgression` (~1255–1320)
  and its handlers (~3020–3060).
- `private/crb/0450` (Advancement) and `0412`, `0414`: the words to copy.
  **Never edit the mirror.**
- `tests/rules.test.mjs` (R-series), `tests/engine.test.mjs` around the
  milestone and `ipRoll` tests, `tests/smoke.test.mjs`'s Take Minor tests.

## 6. Out of scope

- **Enforcing Skilled, Talented, Redeemed or Honed** (PQ1). Text.
- **A new Advantage's 5-point rule and Advantages bought with IP** (Q24, Q25):
  W89, in P12.
- **Writing any archetype's own Majors**: Arcanist (F32), Vampire (P4b),
  Cyborg (F6). Only the offer rule moves.
- **The cadence** (`minorFirstAt`, `majorFirstAt`): unchanged.
- **GM mode.** A table's Milestone reminder (S5b) reads nothing here; check
  `gm.js` for `majorGeneral` and `minorShared` and, if it names either, stop
  and ask.

## 7. The shape

### 7a. Engine

1. **Split the pool from the offer.** `majorPool(ch)` stays the lookup of
   every Major a taken id could name: `majorGeneral` plus the archetype's own
   list. `majorOffered(ch)` becomes the offer: the archetype's own list, plus
   `majorGeneral` only when `growth.majorMilestones === "general"`, minus the
   Origin-only ones as today. `takeMilestone` (~2024) reads `majorPool`
   today, so a hand-crafted call could take a General Major on an Arcanist:
   it must check the id is in `majorOffered`, and refuse "That Milestone
   isn't open to your archetype." Every other reader of taken Majors
   (`grants`, `formGrants`, `checkPrereqs`, the journal) keeps `majorPool`.
2. **`canTakeMinor`** drops the floor: refuse only when `minorLeft <= 0` or
   the id isn't a Minor. The `counts` block goes.
3. **`versionCheck`**: for each taken Major id that is in `majorGeneral` but
   not in `majorOffered`, one line, "<name> isn't on this archetype's Major
   list any more. The character keeps it." Deduplicate by id. It reports,
   never removes (constraint 8: no throw).
4. **Nothing stored changes**, so `migrate()` needs no step. Check that a
   taken Major with an id nothing knows still comes through `migrate()`
   (it does today; pin it).

### 7b. Data

1. `ipRoll` on Improved → `{ count: 3, sides: 10, plus: 30 }`; its `benefit`
   reads "Gain 3d10+30 bonus IP. 10's explode as normal."
2. Skilled and Redeemed `benefit` from `0450`'s words (PQ1). If PQ3 stands,
   add Steadied to `minorShared` in the book's order.
3. `minorNote` and `majorNote` and `majorGeneralNote` say what is now true
   (Minors repeat; General Majors are the Professional's). The REVIEW
   comment above `minorShared` and `majorGeneralNote`'s F9 are removed with
   the flag. `minorSharedSource` stays while F12 is open.
4. `gamedataVersion` → 0.36, per Decision 68.

### 7c. UI, Progression (`sheet.js`)

1. **The Minor picker** never disables a Minor for repeating. Its `title`
   shows only "No Minor unlocked" reasons. "taken ×N" stays.
2. **The Improved box** reads its numbers from `Engine.ipRoll`, as it
   does: nothing to change but check it says 3d10 and "+ 30 IP".
3. **The Major group**, for an archetype with no Majors offered (PQ2): the
   one line, no "General" heading, no empty list.
4. **A taken Major that isn't offered** stays in the journal with its name
   and its ✕, so Admin or the player can still remove it.

## 8. Worked examples (pin these)

| Character | Action | After |
|---|---|---|
| Professional, 2 Minors unlocked, none taken | Take Improved, then Improved again | both taken, "Improved ×2", no refusal; 2 left to take = 0 |
| same, 1 Minor unlocked, 1 taken | Take another | refused "No Minor Milestone unlocked (next at …)." — the only refusal left |
| any, taking Improved | roll box | "Roll 3d10", "+ 30 IP"; dice 17 grants 47 IP; a box left empty is still refused (P1's PQ2) |
| a saved character who took Improved at 2d10+15 | open in 0.43 | its IP journal is untouched; nothing re-rolled |
| Arcanist, 1 Major unlocked | open Progression | no Major to take; "No Major Milestones for this archetype."; MP still count |
| Arcanist saved with "specialist" taken | open in 0.43 | "Specialist" in the journal with ✕; `versionCheck` names it once; Kicker Die grant (if any) still applies |
| Arcanist | `takeMilestone(ch, "major", "specialist")` | `{ ok:false, why:"That Milestone isn't open to your archetype." }` |
| Professional | Major group | the General list as today |
| Trueborn Werewolf | Major group | its Origin's own, and no General list; no Major another Origin owns |
| Vampire | Major group | the plain line (P4b's list isn't written) |

## 9. Tests

- **Engine** (`engine.test.mjs`): every row of §8 that needs no browser, plus
  - `canTakeMinor`'s only refusal is "none unlocked", for every Minor id;
  - `majorOffered` for every archetype in the data is the Professional's
    General list and the others' own, and never the General list for a
    non-Professional (iterate `D.archetypes`: no archetype id in code,
    Decision 135);
  - `majorById` and `grants()` still find a taken General Major on a
    non-Professional;
  - `ipRoll("improved")` is `{3, 10, 30}`, and `ipRollTotal` adds 30;
  - `versionCheck` lists a taken General Major on an Arcanist, once, and a
    Professional's is silent; hostile `milestones.major` ids don't throw.
- **Rules** (`rules.test.mjs`): the three rebalanced benefits and Steadied
  (if PQ3) are the book's words, and Improved's roll is `0450`'s.
- **Smoke**: Take Improved twice from the picker; the Improved box shows
  3d10 and +30; an Arcanist's Progression shows the plain line; a saved
  Arcanist's taken Major is still in the journal.
- **Mutation-test** each guard against the pre-fix code: the offer split
  (`majorOffered` returns `majorPool`), `takeMilestone`'s offered check,
  `canTakeMinor`'s floor put back, `versionCheck`'s Major line dropped. A
  guard that passes before and after is decoration.

## 10. Steps

1. `npm run verify` on a fresh branch. Note the totals.
2. Engine §7a 1–3, with their tests. `npm run test:fast`.
3. Data §7b, with the rules tests (mirror mounted). `npm run test:fast`.
4. UI §7c, with the smoke tests.
5. Run it in the dev preview (`shadows-dev-preview`): a Professional takes
   Improved twice; an Arcanist sees the plain line. Screenshot Progression.
6. Decision N, its INDEX line, the two marks; close F9 (three edits); W103 to
   `log/wishes-granted.md`; CHANGELOG; the bump.
7. `npm run verify` and `npm run phone-check`.

## 11. Stop and ask

- If `0450`'s text for any Minor names a computed value (PQ3).
- If removing the General list from an archetype changes a prerequisite
  chain on another Major (a `milestones: [...]` prerequisite that names a
  General Major, on a non-Professional's own list).
- If `gm.js` reads `majorGeneral` or `minorShared` (§6).
- If a saved character's taken Major can't be found by id once the pool and
  the offer are split.
- Any new field on the character.

## 12. Close-out

Use the **close-the-session** skill. Rule-or-shape tier: Decision N and its
marks, F9's three edits, STATE rewritten (P6 built; **P7 next**), the log
entry (put the mutants in it, not only the PR), `shipped.md`'s row, W103's
status, CHANGELOG plus `npm run changelog`, the app bump, the data bump, and
the plan's P6 row.

Suggested CHANGELOG lines:

- **Any Minor Milestone can be taken again**, whenever one is unlocked.
- **Improved is now 3d10+30 IP.** Skilled is two Skills, a rank each, and
  Redeemed takes a Disadvantage worth 5 points or less. Milestones you've
  already taken keep what they gave.
- **General Major Milestones are the Professional's.** A character that
  already took one keeps it.

## 13. Review checklist

- [ ] §8's rows are pinned, and each passes.
- [ ] `takeMilestone` refuses a Major not offered; a taken one is still found.
- [ ] No taken Major, Minor or IP entry on a saved file moves.
- [ ] Every archetype's Major offer is read from the data, no id in code.
- [ ] The Major group says nothing about the build (constraint 9).
- [ ] F9 closed in all three places; Decisions 29 and 199 marked.
- [ ] Mutation tests noted in the PR **and** the log.
- [ ] Decision N's shape passes `docs.test.mjs`.
- [ ] `npm run verify` and `phone-check` green; versions: app minor, data
      bump, no schema bump.

## 14. Handing it over

Paste this as the first message of a fresh Sonnet session, once this order
is on `main` and Ken has answered §4:

> Read `CLAUDE.md`, then `docs/plans/sheet-wishlist/P06-milestones.md`, and
> build it. Ken's answers to PQ1–PQ3 are in its §4 (a blank answer is
> "Default"). Follow its steps (§10) in order, and its *Stop and ask* list
> (§11) exactly. If something isn't covered by the order, stop and ask me
> rather than choosing. Where the order and the code or the ledger disagree
> in a way that doesn't stop you, build what the order says and list it in
> the PR under *Where the order didn't fit*. Open a PR when §13's checklist
> holds; don't merge it.
>
> Four things in this order are easy to get wrong:
>
> 1. **`majorPool` is two jobs.** It is the offer and the lookup. Split them:
>    the offer follows the archetype, the lookup stays whole, or a saved
>    Arcanist's taken General Major loses its name, its grant and its place
>    in a `milestones` prerequisite.
> 2. **`takeMilestone` reads the pool.** Hiding a Major in the UI isn't
>    enforcing it. The engine refuses an id that isn't offered.
> 3. **`growth.majorMilestones` is a string for the Professional and a list
>    for the rest.** Read it as the data has it; no archetype id in code.
> 4. **Taken Minors keep what they gave.** Don't recompute any IP; only the
>    next Improved rolls 3d10+30.
>
> Tier: Rule or shape. One numbered decision (the next free number), a
> **minor** app bump, a game data bump, no schema bump. Use the
> close-the-session skill at the end.
