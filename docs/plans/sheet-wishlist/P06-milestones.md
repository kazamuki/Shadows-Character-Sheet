# Work order P6 — Milestones: repeats, the rebalanced values, and the General Majors' owner

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W103**
(`WISHLIST.md`); closes **F9**. Decisions 29, 91, 199, 213, and 216 for the
format of a worked decision. Deighton's rulings are
`../../reference/rulings-2026-10-10.md` Q26, Q27, Q28 and Q32.
**Status:** **drafted 2026-10-12 by Claude (Sonnet)**, pre-flighted against
`main` after #170. **Ken answered PQ1–PQ7 on 2026-10-12** and added three
more Minors as choosers (Honed, Redeemed, Talented), which grew the order:
five Minors now ask a question when taken, a Major can be written in, and
there is a schema bump. §4 has the answers (PQ8 settled by Deighton's Q25) and PQ9–PQ10, with defaults;
**not yet approved.**
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs alone, and is a big one.** It touches `shadows-data.js` (`milestones`), `engine.js` (`majorPool`, `majorOffered`, `canTakeMinor`,
`takeMilestone`, one new `takeMinorChoice`, `versionCheck`, `migrate`),
`sheet.js` (the Milestones part of Progression, and its choosers), the tests,
and the docs. Character schema 0.22. Nothing in `gm.js` or `private/` but a
read of the mirror. If it runs long, **split it at §10 step 4**: the engine
and the data first (one PR), the choosers' UI second.

**What P6 is.** Deighton ruled on the Milestones on 2026-10-10 and nothing
has built it. Ken added more on 2026-10-12. Three rulings and four additions,
one session:

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
- **Five Minors ask a question when taken** (Ken), as one Take and one Undo
  each. Today they are text the player applies by hand:
  - **Skilled:** pick two different Skills, a free rank each.
  - **Honed:** pick a Stat to raise by one, any Stat including WILL, TOL or
    LUCK.
  - **Redeemed:** pick a Disadvantage worth 5 points or less; it goes down one
    rank, and is removed at rank 1.
  - **Talented:** pick an Advantage this character can have, worth 5 points
    or less to take new, or any one it holds that can still rank up, to raise
    one rank (Deighton's Q25, PQ8).
  - **Steadied**, the sixth Minor from `0450` (PQ3): restore 10 SAN, **or**
    one Health Level lost to Massive damage. It restores what was lost,
    never a new one.
- **A Major a GM writes in** (Ken, PQ2): any archetype can take a custom
  Major, a name and what it does, so an archetype with no list isn't stuck.

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
6. **Taking Skilled opens a chooser** of the Skills that can still go up.
   Pick two different ones, one rank each, free: it writes `ipe` and one
   journal row per rank at amount 0, so the rank-count check still balances.
   Both ranks respect the cap of 10 (Q28).
7. **Taking Honed opens a chooser** of every Stat (the eight, and WILL, TOL
   and LUCK). The pick gets +1 as an Adjustment (the ledger Honed was
   already entered in by hand, `trackers.adjustments`), refused at the cap of
   10 (Q28).
8. **Taking Redeemed opens a chooser** of the character's Disadvantages worth
   5 points or less. The pick goes down one rank; at rank 1 it is removed.
9. **Taking Talented opens a chooser** of Advantages: the ones this
   character may buy (a Supernatural's only the Universal ones, Decision 152)
   worth 5 points or less to take new at rank 1, and the ones it already
   holds with a rank to spare, to take up one rank (PQ8). Free of IP and CP.
10. **Taking Steadied opens a chooser** of two things: **Restore 10 SAN**
    (what's lost, up to 10) or **Restore a Health Level** (one of the levels
    Massive damage took). An option with nothing to restore is off, with its
    reason.
11. **Each of those is one commit and one Undo**, the Minor and what it did
    together. A chooser with nothing to choose leaves Take off, with its
    reason (PQ6).
12. **A Major can be written in**, on every archetype: **Add one** takes a
    name and a description, uses a Major slot, and is kept on the character.
    It shows in the journal and the Major group with its ✕. It is text; the
    app computes nothing from it.
13. **An archetype with no Majors offered sees "Add one"**, and the line
    "No Major Milestones listed for this archetype." No "coming soon"
    (constraint 9).

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** It changes which choices a character has (Majors
  by archetype, Minors without a floor, a written-in Major), adds a field to
  the save file and supersedes two decisions. One numbered decision, **N** (the next free number on `origin/main` when you
  write it).
- **App: minor** (`npm run bump -- 0.43.0`, or the next minor if one lands
  first). Repeating a Minor is a new capability.
- **Game data: bump** (Decision 68). Improved's roll, three benefits and which
  Majors an archetype is offered all change what a character can observe.
- **Character schema: 0.22**, with its `migrate()` step in the same commit. A
  written-in Major is a new shape in `progression.milestones.major`: a
  strict-`true` `custom`, a `name` and a `benefit`, beside the `id` and `date`
  every entry has. Any *other* new field is a *Stop and ask* (§11).
- **F9 closes:** its `SCHEMA.md` §5 row, `flagged` in the data (the
  `majorGeneralNote` and the REVIEW comment above `minorShared`), and its
  `INDEX.md` §2 line. See the **close-a-flag** skill.
- **CHANGELOG** lines under `[Unreleased] — app 0.43.0`, player voice (§12).

## 3. The decision, drafted

Write this as Decision **N** in `SCHEMA.md` §4, with its INDEX §3 line under
the Milestones topic, and mark what it replaces.

```
N. **Any Minor Milestone repeats at any time; Improved is 3d10+30; Skilled, Honed, Redeemed, Talented and Steadied each ask what they give, by a chooser; the General Majors are the Professional's, and any archetype can write in a Major.**
     *2026-10-1x · Ken + Claude (Deighton's rulings Q25–Q28, Q32) · Touches: minorShared, canTakeMinor, takeMilestone, takeMinorChoice, Improved, ipRoll, Skilled, Honed, Redeemed, Talented, Steadied, adjustments, majorGeneral, majorPool, majorOffered, majorById, growth.majorMilestones, custom Major, Milestones, versionCheck, migrate, character schema 0.22, F9, W103*
     - **Decided:** `canTakeMinor` asks only that a Minor is unlocked. Improved's `ipRoll` is `{ count: 3, sides: 10, plus: 30 }`. A Minor's `choice` in the data names what taking it asks, and `takeMinorChoice` applies it with the Minor, as one change: Skilled `{ type: "skillRanks", count: 2, ranks: 1 }` (two different Skills, free ranks, journalled at 0 IP); Honed `{ type: "statPoint" }` (+1 Adjustment on any Stat, WILL, TOL and LUCK included, capped at the Stat maximum); Redeemed `{ type: "disadvantageRank", maxPoints: 5 }` (one rank down, removed at rank 1); Talented `{ type: "advantageRank", maxPoints: 5 }` (a new Advantage the archetype may buy, or one rank up on any held one with rank to spare); Steadied `{ type: "restore", options: [{ kind: "san", points: 10 }, { kind: "massiveLevel", levels: 1 }] }`, each clamped to what was lost. A Major is offered from the archetype's own `growth.majorMilestones` list, and from `majorGeneral` only where it is `"general"` (the Professional). A taken Major from either list is still found by id, still counts, still grants. Any archetype can write in a Major (`custom: true`, a name and a benefit, schema 0.22), which uses a Major slot and is text only.
     - **Why:** Deighton (2026-10-10, Q25–Q28, Q32): the rebalanced values stand, any Minor repeats, the General Majors were the Professional's. Ken (2026-10-12): a Minor that gives a choice should ask for it, Steadied restores what was lost, and a GM can write a Major in.
     - **Rejected:** removing a taken General Major from a saved Arcanist, Vampire or Cyborg (a file's choices are never discarded); the General list for everyone "until their own are written" (Deighton ruled it out); a `repeatable` flag per Minor (all repeat: a setting nothing reads, Decision 135); a new `source` value for a Talented Advantage (Decision 142's *Revisit if*; nothing reads it, and a rank on a bought row needs none); Honed as a new stored field (the Adjustments ledger already takes it).
     - **Replaces:** Decision 29 in part (the Minor repeat floor). Decision 199 in part (a Werewolf's Majors are offered alone, VQ16's "until F9"). Closes F9.
     - **Revisit if:** another archetype's Majors are written; Withering's levels count as lost (PQ5).
     - **Built:** app 0.43.0, game data 0.36, schema 0.22, PR #…, log 2026-10-1x.
```

Supersession marks: Decision 29 and Decision 199 each get
`→ **Superseded in part by Decision N**` with the clause, and their INDEX
lines `→ **superseded in part by N**`. `docs.test.mjs` reads only the first
mark on an entry; if one already has a mark, extend it as P5 did with 153.

## 4. Questions for Ken

| Id | Question | Answer |
|---|---|---|
| PQ1 | **Is Skilled enforced?** | **Ken, 2026-10-12: it opens a skill chooser to rank up**, not text. Built as §7. |
| PQ2 | **What does an archetype with no Majors see?** | **Ken, 2026-10-12: also let the GM have them write one in.** Built as an **Add one** for every archetype (§7). |
| PQ3 | **Steadied.** | **Ken, 2026-10-12:** restore 10 points (10%) of SAN, **or** heal one Health Level lost to Massive damage or something else that removes a Health Level. The idea: lose an arm to Massive damage and you "get used" to your new shape, gaining the level back without a replacement arm. **It never gives a brand-new Health Level, only restores a lost one.** |
| PQ4 | **Skilled's two ranks:** two different Skills, or may both go in one? | **Ken, 2026-10-12: two different Skills.** A Skill at 10 isn't offered. |
| PQ5 | **"Something else that removes a Health Level":** the sheet has Massive damage's levels. Withering is HP that can't regenerate. Does Steadied restore a Withering level too? | **Ken, 2026-10-12: Massive levels only.** |
| PQ6 | **A chooser with nothing to choose** (Steadied at full SAN with no Massive level lost; Redeemed with no small Disadvantage; Talented with nothing to take). | **Ken, 2026-10-12: the default.** Take is off, with a reason ("Nothing to restore."). A Minor shouldn't be spent on nothing. Undo stays for a mistake. |
| PQ7 | **Written-in Major: does it use an unlocked slot, and is it free?** | **Ken, 2026-10-12: the default.** It uses a Major slot, costs no IP, and **Admin can add one with no slot**, free, as Admin adds a power (Decision 154). Name and description, no prerequisites, no grants. |
| PQ8 | **How far does Talented's rank-up reach?** | **Ken, 2026-10-12, after Deighton's Q25 ("Any Advantage"): any Advantage that can be ranked up.** A held Advantage with a rank to spare (below its `maxRank`) is offered at any price; a new one only at 5 points or less per rank. A held one gets a rank, not a new row. No flag: Deighton ruled it. |
| PQ9 | **What does "5 points or less" measure?** An Advantage's `cost` is per rank; a Disadvantage's `pointsGranted` is per rank too. | **Per rank**, rank 1's price: an Advantage with `cost` ≤ 5 may be taken new; a Disadvantage with `pointsGranted` ≤ 5 may be redeemed, at any held rank. If the book prices the whole stack, say so in the PR and stop and ask. |
| PQ10 | **Honed on WILL, TOL or LUCK: what is the cap?** Q28 caps Honed and Skilled at 10. WILL and TOL are derived and LUCK starts at 4. | **The same cap, `statRules.max`, read from `statValue`/the derived value.** An Adjustment adds to the final value, as the Adjustments ledger already does (`adjFor`). If a derived stat can already exceed 10 by its formula, don't refuse a raise for that alone: **stop and ask.** |

Consequence to know, not a question: **Vampires lose the General Majors
today** and have none until P4b writes their own, so **Add one** is what a
Vampire's GM has meanwhile. That is what the ruling says (a Vampire's own
list is `[]`). Say so in the PR.

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
    any more (the power branch is the model), and its Milestone-id check
    (~3965), **which would call a written-in Major "no longer exists"**.
  - `migrate()`'s milestones (~3272–3281): it keeps any entry with a string
    `id` and normalizes nothing else.
  - `spendIP` (~1875), `skillRankCap` (~1821), `heal` (~1660, which restores
    a Massive level) and `sanState` (~1753): the models for Skilled and
    Steadied.
  - `adjFor` (~144) and the Adjustments form on Progression (~1197): Honed's
    model. `trackers.adjustments` rows are `{ target, amount, note }`.
    `statValue` already adds them, and WILL, TOL, SAN and LUCK read `adjFor`.
  - `advById`, `disById`, `canBuyAdvantage` (~113: a Supernatural buys only
    `universal: true`), `checkPrereqs` (an Advantage's `requires`), `advSpent`
    and `disGranted` (~541: CP, per rank): the models for Redeemed and
    Talented. A Disadvantage's `pointsGranted` and an Advantage's `cost` are
    per rank; each has a `maxRank`.
  - Admin's Add advantage and Add disadvantage (`sheet.js` ~3378, ~3395):
    the existing way a locked character gains a row. Talented's new
    Advantage is that row.
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

- **Advantages bought with IP** (Q24, W89, in P12). Talented's free rank and
  new Advantage are this session's; the IP price of one is not.
- **Advantage `picks` the sheet can't collect.** A new Advantage that needs a
  pick (an Addiction's substance) is added as Admin's Add advantage adds it:
  with its notes empty, for the player to fill in. If a Talented-eligible
  Advantage needs more than that, stop and ask (§11).
- **Writing any archetype's own Majors**: Arcanist (F32), Vampire (P4b),
  Cyborg (F6). Only the offer rule moves.
- **Withering as a lost level** (PQ5).
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
4. **`takeMinorChoice(ch, id, pick)`** for a Minor with a `choice`.
   `Take` on one asks first. It validates and applies the pick, then adds the
   Minor, all in one call, or refuses and changes nothing.
   - `skillRanks`: `pick` is `count` distinct Skill ids that exist and are
     below `skillRankCap`. Each gets `ipe += ranks` and a journal row
     `{ kind:"spend", amount:0, targetType:"skill", targetId, from, to, note:"Skilled" }`,
     so `versionCheck`'s rank-count check balances and a later raise is
     priced from the new rank, as any rank is.
   - `restore`: `pick` is one of the options. `san`: reduce
     `trackers.san.loss` by `min(points, loss)`, refused at no loss.
     `massiveLevel`: reduce `trackers.massiveLevels` by `min(levels,
     massive)`, refused at none. Never below 0: nothing here adds a level.
   - `statPoint`: `pick` is a stat id from the data's stat list (the eight
     and WILL, TOL, LUCK; refuse anything else). Push `{ target, amount: 1,
     note: "Honed" }` on `trackers.adjustments`. Refuse at the cap, by the
     stat's current value (PQ10). LUCK has no `stats` row: it is an
     adjustment target as the ledger already has it.
   - `disadvantageRank`: `pick` is the id of a held Disadvantage whose
     `pointsGranted` is at most `maxPoints` (PQ9). Rank above 1: `rank -= 1`.
     At rank 1: remove the row. Nothing about its `grants` is cached, so the
     computed values follow. Note that `cp()`'s budget reads `disGranted`, so
     a locked character's CP budget drops; nothing enforces CP after lock, but
     **pin that `validate` and `versionCheck` stay quiet on it**.
   - `advantageRank`: `pick` is an Advantage id. If the character holds it
     (a bought row, or a Professional's free one) and `rank < maxRank`:
     `rank += 1`. If not held: it must be `canBuyAdvantage`, `cost` at most
     `maxPoints`, `checkPrereqs` met (a prose-only requirement is the
     table's call: allow it, as Take Major does), and not already held; push
     `{ id, rank: 1, notes: "" }`. A held one at its `maxRank` is refused.
   `takeMilestone` for a Minor with a `choice` and no pick refuses "Choose
   what it gives."
5. **A written-in Major**, `addCustomMajor(ch, { name, benefit }, { admin })`:
   refuses a blank name; needs `majorLeft > 0` unless `admin`; pushes
   `{ id: "mm-" + id, custom: true, name, benefit, date }` on
   `progression.milestones.major`. `majorById` finds a written-in one from
   the character, so `majorPool(ch)` gains the character's own written-in
   rows; `grants()` reads it and gets no `grants` (null-safe: pin it).
   `milestoneState`'s counts include it.
6. **`migrate()`, schema 0.22.** `SCHEMA_VERSION` → `"0.22"`. A major entry
   with `custom === true` keeps a text `name` and `benefit` and a string
   `id` and `date`; any other value of `custom` is dropped to a plain entry
   (`custom` is a strict `true`, constraint 10). An older file has none; a
   round trip keeps them (constraint 8).
7. **`versionCheck`** skips the "no longer exists" line for a `custom` Major.

### 7b. Data

1. `ipRoll` on Improved → `{ count: 3, sides: 10, plus: 30 }`; its `benefit`
   reads "Gain 3d10+30 bonus IP. 10's explode as normal."
2. Skilled, Redeemed, Honed, Talented and Steadied's `benefit` from `0450`'s
   words. Each of the five gets its `choice` as the decision says, and
   Steadied is added to `minorShared`, in the book's order. A `choice` is
   read by `takeMinorChoice` and nothing else (Decision 135): no archetype or
   Minor ids in code.
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
5. **Take on a Minor with a `choice` opens a modal**, one renderer for all
   five, driven by the `choice.type`, built like Raise a Skill without
   prices (`raiseRowHtml`, the modal's keyboard handling):
   - **Skilled:** the Skills that can still go up, searchable, two to be
     picked; a picked one is marked and can be unpicked; **Take Skilled** is
     off until two are chosen.
   - **Honed:** the eleven Stats with their current values; one to pick.
   - **Redeemed:** the held Disadvantages worth 5 or less, each with its
     rank and "rank 2 → 1" or "removed"; one to pick.
   - **Talented:** two sections like Buy or Raise a Power's, **Raise one you
     hold** (rank → rank + 1) and **Take a new one** (its cost), searchable;
     one to pick.
   - **Steadied:** two buttons, each with what it will restore ("Restore 6
     SAN", "Restore 1 Health Level") or its reason when off (PQ6).
   One `commit("milestone", …)` labelled `Take Minor: <name>` and, in the
   journal, naming the pick ("Take Minor: Honed (WILL)"). Improved keeps its
   own dice box.
6. **Add one**, in the Major group, for every archetype: Name, Description,
   **Add**. Refusals show with `notice()` and keep what was typed (try it on
   a `clone(ch)` first). It sits after the offered list, and alone with the
   plain line when none are offered. On Admin it adds without a slot.

## 8. Worked examples (pin these)

| Character | Action | After |
|---|---|---|
| Professional, 2 Minors unlocked, none taken | Take Improved, then Improved again | both taken, "Improved ×2", no refusal; 2 left to take = 0 |
| same, 1 Minor unlocked, 1 taken | Take another | refused "No Minor Milestone unlocked (next at …)." — the only refusal left |
| any, taking Improved | roll box | "Roll 3d10", "+ 30 IP"; dice 17 grants 47 IP; a box left empty is still refused (P1's PQ2) |
| a saved character who took Improved at 2d10+15 | open in 0.43 | its IP journal is untouched; nothing re-rolled |
| Arcanist, 1 Major unlocked | open Progression | no Major listed; "No Major Milestones listed for this archetype." and Add one; MP still count |
| Arcanist saved with "specialist" taken | open in 0.43 | "Specialist" in the journal with ✕; `versionCheck` names it once; Kicker Die grant (if any) still applies |
| Arcanist | `takeMilestone(ch, "major", "specialist")` | `{ ok:false, why:"That Milestone isn't open to your archetype." }` |
| Professional, 1 Minor unlocked, Evocation 3, Dodge 10 | Take Skilled, pick Evocation and Dodge | Dodge isn't offered; pick Evocation and another: both +1, IP unchanged, two 0-IP journal rows, one Undo takes the Minor and both ranks back |
| same | Take Skilled, pick one Skill | Take stays off |
| Strigoi at 12 SAN lost | Take Steadied → Restore SAN | 12 lost → 2 lost; at 4 lost it restores 4, not 10 |
| character with 1 Massive level lost | Take Steadied → Restore a Health Level | massive 1 → 0 |
| full SAN, no Massive level | Take Steadied | Take is off, "Nothing to restore." |
| Professional, WILL 6 | Take Honed → WILL | WILL 7 (an Adjustment `{ WILL, +1, "Honed" }`); at 10 it isn't taken: "Stat cap 10." |
| any | Take Honed → LUCK | the LUCK maximum +1 through the same ledger |
| a Disadvantage worth 3 a rank, held at rank 2 | Take Redeemed → it | rank 1; at rank 1 the row is gone; one Undo brings either back |
| a held Disadvantage worth 6 a rank | Take Redeemed | not listed (PQ9) |
| no Disadvantage worth 5 or less | Take Redeemed | Take is off, "No Disadvantage to redeem." |
| Professional holding Lucky 1, `maxRank` 3 | Take Talented → Lucky | rank 2; no CP or IP moves |
| same, Lucky at its `maxRank` | Take Talented | Lucky isn't offered to raise |
| Professional | Take Talented → an Advantage costing 4 it doesn't hold | added at rank 1; one costing 6 isn't offered new |
| Vampire (a Supernatural) | Take Talented | only `universal` Advantages are offered new; held ones are offered a rank |
| Arcanist, 1 Major unlocked | Add one "Aetheric Potency" | in the journal; slot used; `majorLeft` 0; versionCheck silent |
| Arcanist, 0 unlocked | Add one | refused; on Admin it adds |
| a 0.21 file | open in 0.43 | schema 0.22, nothing else moves; a hostile `custom: "yes"` entry comes out plain |
| Professional | Major group | the General list as today |
| Trueborn Werewolf | Major group | its Origin's own, and no General list; no Major another Origin owns |
| Vampire | Major group | the plain line and Add one (P4b's list isn't written) |

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
    Professional's is silent; hostile `milestones.major` ids don't throw;
  - `takeMinorChoice`: Skilled refuses one pick, a repeated Skill, a Skill at
    the cap and an unknown id, and changes nothing on refusal; Steadied never
    takes SAN or Massive below 0, never adds a level, and refuses at
    nothing to restore;
  - a journalled 0-IP rank leaves `versionCheck`'s rank count balanced;
  - Honed: refuses an id that isn't a stat; at the cap; adds exactly +1 and
    nothing else, for a Basic Stat, WILL, TOL and LUCK; Undo removes it;
  - Redeemed: rank-down and removal, refuses a Disadvantage over 5, one not
    held, and a hostile id; Talented: rank-up, new, refuses over 5 new, a
    non-universal one on a Supernatural, one at `maxRank`, one already held
    (as new); neither moves CP or IP; `validate` and `versionCheck` stay
    quiet after either on a locked character;
  - every choice refusal changes nothing (deep-compare the character before
    and after);
  - `addCustomMajor` refuses a blank name and, off Admin, no slot; a
    written-in Major survives `migrate()`, and `custom: "yes"`, `1`, `{}`
    come out plain; `grants()` doesn't throw on it.
- **Rules** (`rules.test.mjs`): the three rebalanced benefits and Steadied
  (if PQ3) are the book's words, and Improved's roll is `0450`'s.
- **Smoke**: Take Improved twice from the picker; the Improved box shows
  3d10 and +30; each of the five choosers opens, picks, commits once and
  undoes once (Skilled two picked; Steadied with each option off and on;); an Arcanist's Progression shows the
  plain line and Add one, and adding one puts it in the journal; a saved
  Arcanist's taken Major is still in the journal.
- **Mutation-test** each guard against the pre-fix code: the offer split
  (`majorOffered` returns `majorPool`), `takeMilestone`'s offered check,
  `canTakeMinor`'s floor put back, `versionCheck`'s Major line dropped, the
  clamp on Steadied's SAN removed, Skilled's cap check removed, Redeemed's
  5-point filter dropped, Talented's `canBuyAdvantage` check dropped, Honed's
  cap dropped, a custom Major skipping the migrate normalization. A
  guard that passes before and after is decoration.

## 10. Steps

1. `npm run verify` on a fresh branch. Note the totals.
2. Engine §7a 1–3, with their tests. `npm run test:fast`.
3. Engine §7a 4–7 (the choosers, the written-in Major, schema 0.22), with
   their tests and the hostile ones. Data §7b, with the rules tests (mirror
   mounted). `npm run test:fast`.
4. UI §7c, with the smoke tests. **If the session is long, this is the
   place to stop and open the engine-and-data PR first** (Decision N, the
   docs go in it); the UI follows in a second one.
5. Run it in the dev preview (`shadows-dev-preview`): a Professional takes
   Improved twice, then each chooser once; an Arcanist sees the plain line.
   Screenshot Progression and two choosers.
6. Decision N, its INDEX line, the two marks; close F9 (three edits) and
   W103 to
   `log/wishes-granted.md`; CHANGELOG; the bump.
7. `npm run verify` and `npm run phone-check`.

## 11. Stop and ask

- If `0450`'s text for Skilled, Redeemed or Steadied says something that
  doesn't match Ken's words in §4 (the book wins on wording; Ken on intent).
- If Steadied would have to restore Withering or any level but Massive's
  (PQ5).
- If the book prices a Disadvantage or an Advantage over its whole stack,
  not per rank (PQ9), or a derived stat can pass 10 by its own formula
  (PQ10).
- If a Talented-eligible Advantage needs a pick or a prerequisite the sheet
  can't collect or check (§6).
- If lowering a Disadvantage makes `validate`, `versionCheck` or a lock rule
  complain on a locked character.
- If removing the General list from an archetype changes a prerequisite
  chain on another Major (a `milestones: [...]` prerequisite that names a
  General Major, on a non-Professional's own list).
- If `gm.js` reads `majorGeneral` or `minorShared` (§6).
- If a saved character's taken Major can't be found by id once the pool and
  the offer are split.
- Any new field on the character other than the written-in Major's
  `custom`, `name` and `benefit`.

## 12. Close-out

Use the **close-the-session** skill. Rule-or-shape tier: Decision N and its
marks, F9's three edits, the schema section for 0.22, STATE rewritten (P6 built; **P7 next**), the log
entry (put the mutants in it, not only the PR), `shipped.md`'s row, W103's
status, CHANGELOG plus `npm run changelog`, the app bump, the data bump, and
the plan's P6 row.

Suggested CHANGELOG lines:

- **Any Minor Milestone can be taken again**, whenever one is unlocked.
- **Improved is now 3d10+30 IP.** Milestones you've already taken keep what
  they gave.
- **General Major Milestones are the Professional's.** A character that
  already took one keeps it. Any character can have a Major written in,
  from a GM.
- **Minor Milestones ask what they give.** **Skilled** picks two Skills,
  **Honed** a Stat (WILL, TOL and LUCK too), **Redeemed** a Disadvantage worth
  5 points or less to lower a rank, **Talented** an Advantage to raise or a
  new one worth 5 points or less.
- **Steadied**, a new Minor, restores 10 SAN or a Health Level you lost.

## 13. Review checklist

- [ ] §8's rows are pinned, and each passes.
- [ ] `takeMilestone` refuses a Major not offered; a taken one is still found.
- [ ] No taken Major, Minor or IP entry on a saved file moves; schema 0.22 round-trips and hostile `custom` values come out plain.
- [ ] Each of the five choosers is one commit, one Undo, and a refusal changes nothing; none adds a Health Level, a rank past a cap, a Stat past 10 or SAN past full.
- [ ] Every archetype's Major offer is read from the data, no id in code.
- [ ] The Major group says nothing about the build (constraint 9).
- [ ] F9 closed in all three places; Decisions 29 and 199 marked.
- [ ] Mutation tests noted in the PR **and** the log.
- [ ] Decision N's shape passes `docs.test.mjs`.
- [ ] `npm run verify` and `phone-check` green; versions: app minor, data
      bump, schema 0.22.

## 14. Handing it over

Paste this as the first message of a fresh Sonnet session, once this order
is on `main` and Ken has answered §4:

> Read `CLAUDE.md`, then `docs/plans/sheet-wishlist/P06-milestones.md`, and
> build it. Ken's answers to PQ1–PQ10 are in its §4 (a blank answer is
> "Default"). It is a big order: split it at its step 4 if it runs long. Follow its steps (§10) in order, and its *Stop and ask* list
> (§11) exactly. If something isn't covered by the order, stop and ask me
> rather than choosing. Where the order and the code or the ledger disagree
> in a way that doesn't stop you, build what the order says and list it in
> the PR under *Where the order didn't fit*. Open a PR when §13's checklist
> holds; don't merge it.
>
> Eight things in this order are easy to get wrong:
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
> 5. **Skilled's free ranks still need a journal row**, at amount 0, or
>    `versionCheck` reports the IPE as edited by hand. Steadied restores only
>    what's lost: clamp both, and never add a level.
> 6. **A written-in Major isn't in the data**, so `majorById`, `grants()`,
>    `versionCheck` and `migrate()` all meet an id they don't know. Teach
>    each of them, and keep `custom` a strict `true`.
> 7. **Honed is an Adjustment, not an IPE rank.** `ipCost` refuses WILL and
>    TOL as "cannot be raised directly", so don't route Honed through
>    `spendIP`. The Adjustments ledger already adds to every stat.
> 8. **Talented's rank-up is Deighton's Q25:** any held Advantage with a
>    rank to spare, at any price; a new one only at 5 points or less. No flag.
>
> Tier: Rule or shape. One numbered decision (the next free number), a
> **minor** app bump, a game data bump, and character schema 0.22. Use the
> close-the-session skill at the end.
