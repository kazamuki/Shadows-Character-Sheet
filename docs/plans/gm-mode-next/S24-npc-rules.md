# Work order S24: NPC rules (TOL and WILL, and wounds that carry)

**Plan:** [`../gm-mode-next.md`](../gm-mode-next.md), session S24. **Rulings:** GQ6 and GQ26, Scott 2026-11-03
(`archive/gm-mode.md` §9). **Reopens:** Decision 175 (TOL and WILL as authored) and Decision 193 (a member starts
their next encounter unhurt).
**Status:** **drafted 2026-11-16** by Claude (Opus), the L4/L5b conductor, at Ken's pick ("Draft S24"). Not approved.
GQ43–GQ47 below, each with a default; an unanswered one is answered "Default".
**Branch:** from `main`; PR to `main`. Nothing ships switched off: GM mode is launched (260), so this is an ordinary
batch with changelog lines and an app bump.
**Runs beside:** L5b (PR #355) may merge first. It touches the weapon readers, the data's powers and the player
sheet, and S24 touches none of them. Collisions only in versions, CHANGELOG's heading and decision numbers. **Say N
everywhere and expect it to move.**

**Pre-flight** at `4fa2054` (`main`, after #356). `npm run test:fast` green on a fresh worktree.
- `Engine.npc(block)` (engine ~7403) returns `authored[id] = { value, formula }` for each `sumOfModifiers` derived
  stat (TOL, WILL). A blank value goes on `blanks`. Nothing reads `formula` but the UI's "book: N" (gm.js ~1253,
  ~3160). "book" is wrong: it's the formula, not the Codex.
- **Nothing in combat reads an NPC's TOL or WILL.** `grep "\.authored"` finds only `npc()`, `_block` (~6748), the
  has-numbers check (~8298) and gm.js's builder (~1034, ~1427, ~1456) and read view (~3160). So the TOL/WILL half is
  the builder, the cast page and print. No fight number moves.
- TOL and WILL in the data (~169, ~182): `base 1`, `floor 1`, `type sumOfModifiers`. Nothing in the data says which
  of the two is an override and which a floor. A rule keyed by id in code breaks Decision 135, so this order adds a data key.
- **A cast member stores no health.** `_castMember` (~6774) and `addCastMember` (~7436) have no damage field. A cast
  row in an encounter starts at `damage:0, massive:0` (`addParticipant` ~9515), and its health is read off a stand-in
  (`encounterView` ~10295, Decision 191).
- **The precedent is a PC row's start** (Decision 257, `_claimStart` ~10066, `_fileStart`). A claimed PC row takes
  the copy's filed damage, Massive and Conditions once, on a row nothing has happened to. A cast row can do the same
  from its member's stored wounds.
- `endEncounter(t, id, wrap)` (~9939) writes status, Keeps and the *fought* line, and nothing about health. The quick
  end (`wrap` null, gm.js ~4019) runs only on a planned encounter. A running one always goes through the wrap-up
  (~4015). `encounterWrapUp` (~9895) already computes each row's `ended` health.
- Table schema is **0.19** (`TABLE_SCHEMA_VERSION`, ~6988). The last step is 0.19 (Decision 261).
- **Probes on `main`** (run 2026-11-16). TOL's inputs are INT, BOD and COOL. WILL's are BOD, INT and EMP.
  - A block of all 6s, with TOL and WILL blank, gives `{ value:null, formula:1 }` for each, and lists "TOL" and "WILL"
    in `blanks`.
  - **Marta** (`2611`: BOD 5, INT 5, COOL 7, EMP 8, printed TOL 2 and WILL 2) gives `TOL { value:2, formula:2 }` and
    `WILL { value:2, formula:3 }`. Her WILL is one under its floor.
  - A cast member hit for 10 (`participantDamage`), wrapped up, then added to a new fight and started, starts at
    `damage 0`. The member has no wounds key.

**Carried over** (the L4 and L5b reviews):
- **Parallel PRs took numbers three times** (decisions, game data, wishes). Take every number from `origin/main` at
  build, and again after any rebase.
- **A rebase put changelog lines in a released section** (L5b). After a rebase, check that the lines sit under
  `[Unreleased]`.
- **The builder left the visual pass to the reviewer** (L5b). It's the builder's: the dev preview, 375px and print.

## 1. Goal and Done when

**Goal.** A GM's NPCs follow Scott's two rulings. **TOL** is the formula, unless the GM types an override. **WILL**
is the formula or higher, and a value below it is an error the builder shows. A cast member **carries their wounds**
from one fight to the next, and the GM heals them, as much as they decide, between fights.

**Done when:**
1. In the builder, a blank TOL reads its formula, as a placeholder and on the cast page. A typed TOL that differs
   reads "override", with the formula beside it. A blank TOL or WILL whose formula can be worked out is no longer listed as blank.
2. A WILL typed below its formula shows an error under the field, naming the floor. The cast page and print show the
   floor, and the stored value is kept (GQ44).
3. Marta's printed WILL 2 (`2611`) shows the error, since its floor is 3.
4. A cast member hit for 10 in a fight keeps those 10 after the wrap-up. Added to the next fight, their row starts at
   10, and their cast page says how hurt they are.
5. On the cast page, **Heal** with a number heals that much. **Heal all** clears it. A member with no wounds shows
   neither.
6. A pack copy that is **Kept** at the wrap-up becomes a cast member carrying the row's wounds.
7. A file from table schema 0.19 opens with every member's `wounds` null. Nothing is converted, and no fight is
   re-read (203).

## 2. Tier, versions, numbers

**Rule or shape.**
- **Table schema:** 0.19 → **0.20**, with a `migrateTable()` step.
- **App:** a minor, for a new capability a GM sees. Take the next minor after `main`'s `[Unreleased]` heading, or
  join it if that is already a minor.
- **Game data:** none. The new data key changes no character's computed value or choice (Decision 68). Say so in the log.
- **Decisions:** **N** (TOL and WILL) and **N+1** (wounds carry). No flag.

## 3. The decisions, drafted

```
N. **An NPC's TOL is its formula unless the GM overrides it, and its WILL is its formula or higher; the data says which rule each follows.**
     *2026-11-16 · Ken + Claude, from Scott (GQ6, 2026-11-03) · Touches: stat block, block.authored, Engine.npc, TOL, WILL, derived npcRule, the cast builder, the cast page, the cast's print, GQ6, Decision 175*
     - **Decided:** Each `sumOfModifiers` derived stat names its NPC rule in the data: `npcRule: "override"` (TOL) or `"floor"` (WILL). `Engine.npc` returns, for each, `value` (stored), `formula`, `used`, and `override` or `below`. A blank is the formula. An override is used as typed. A value below a floor is kept, shown as an error, and the floor is used. A blank with a formula is not a blank.
     - **Why:** Scott's ruling: TOL is the formula with an override where an entry means it (the Wight's 0), and WILL is a floor. Keeping a too-low WILL stored, not rewritten, keeps a pack's or a GM's number visible until someone fixes it.
     - **Rejected:** Refusing a WILL below the floor at the field: a pack copy arrives with one (Marta), and the gate can't ask. Rewriting stored TOLs that differ from the formula: changes Scott's numbers without asking (GQ43). The rule keyed by id in code (Decision 135).
     - **Replaces:** Decision 175 in part: TOL and WILL are no longer stored only as authored; a blank reads the formula, and WILL has a floor.
     - **Revisit if:** Scott says the roster's low TOLs are mistakes, not overrides, or a third derived stat needs a rule.
     - **Built:** table schema 0.20, app X.Y.Z, PR #…, log 2026-11-…

N+1. **A cast member carries their wounds out of a fight and into the next one; the GM heals them between fights.**
     *2026-11-16 · Ken + Claude, from Scott (GQ26, 2026-11-03) · Touches: cast member, wounds, endEncounter, encounterWrapUp, the wrap-up, addParticipant, startEncounter, a cast row's start, Kept, healCast, castHealth, the cast page, table schema 0.20, GQ26, Decision 191, Decision 193, Decision 257*
     - **Decided:** A cast member stores `wounds`: `{ damage, massive }`, or null when unhurt. The wrap-up writes each cast row's damage and Massive to its member, and a Kept copy's to the new member. A cast row takes its member's wounds when its encounter starts, or when it's added to one that's running, if nothing has happened to it yet (as 257's PC rows). Conditions don't carry. The cast page shows the wounds and heals them: a number of HP, or all.
     - **Why:** Scott: wounds carry and have to be healed, and the GM says how much heals between fights; fights back to back heal nothing. The row is the fight's record and the member is the person, so the wrap-up is where one hands to the other (193 already writes there).
     - **Rejected:** A row reading its member live: a running fight's numbers would change when the GM heals someone on another page. Healing by the book's natural rate: the GM decides (GQ26), and an NPC has no rest clock. Carrying Conditions: they're the fight's (GQ45). Wounds at every end, the quick end too: a planned encounter has no wounds.
     - **Replaces:** Decision 193 in part: a member no longer starts their next encounter unhurt.
     - **Revisit if:** NPC downtime arrives (S5's), Scott wants Conditions to carry, or armor wear on the cast is wanted (193's other half).
     - **Built:** as N.
```

**Supersession marks:** 175 → **superseded in part by N**. 193 → **superseded in part by N+1** (it already carries
"in part by 241"; add the second). Both INDEX lines. Mark GQ6 and GQ26 in `archive/gm-mode.md` §9 as built.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| **GQ43** | **The roster's low TOLs.** Seven of eleven roster NPCs print TOL below the formula (Chen, the Archivist, Kira, Threadbare, the Warden, Juno, the Patron). Are they overrides or mistakes? | **Overrides, kept as printed.** Each shows "override · formula N", so a GM sees it. Nothing is rewritten. If they're mistakes, it's Scott's fix in the Codex, not ours. |
| **GQ44** | **A WILL below its floor:** refuse it at the field, or keep it with an error? | **Keep it, show the error, use the floor** everywhere it's read (the cast page, print). A pack copy arrives with one (Marta), and refusing would silently change Scott's number. |
| **GQ45** | **What carries:** HP damage and Massive levels, or Conditions too? | **Damage and Massive only.** Conditions are the fight's: rounds, sources, a grapple. If one should outlast the fight, the GM adds it again. |
| **GQ46** | **How the GM heals:** a number of HP and "Heal all", or something else? | **Heal N HP, and Heal all.** Heal N takes HP only. Heal all also clears Massive, since a Massive level is the slow kind and the GM's call. Nothing heals on its own. |
| **GQ47** | **When a row takes its member's wounds:** when the fight starts, or when they're added to a planned fight? | **When the fight starts** (and on adding to a running one), on a row nothing has happened to. A fight planned before an earlier one ended then starts with the right number. The planned row says "Hurt: N HP" beside the name. |

## 5. The assumption sweep

| What | Today (where) | After |
|---|---|---|
| `Engine.npc` authored | `{ value, formula }`, blank on `blanks` (~7419) | `{ value, formula, used, override, below }`; blank on `blanks` only when the formula is null too |
| Readers of `npc().blanks` | grep `blanks`: the builder's "what's missing" and any test that lists blanks | TOL and WILL drop out when formula exists. Every test asserting `blanks` includes "TOL" or "WILL" is an expected break |
| "book: N" | gm.js ~1253 (builder) and ~3160 (print) | "formula N" in the builder; the override/error text; print shows `used` |
| The has-numbers check (~8298) | true for a typed TOL/WILL | unchanged: it reads stored values, not `used` |
| Derived data (~169, ~182) | no rule key | `npcRule` on each `sumOfModifiers` entry. `engine.test.mjs`'s unread-key guard (Decision 135) must see it read |
| The player sheet's TOL/WILL | `derived()` reads `base`, `floor`, `inputs` | unchanged. `npcRule` is read only by `npc()` |
| Cast member shape | no wounds (`_castMember` ~6774, `addCastMember` ~7436, `castFromRow` ~9925, `_memberFromEntry` ~9114) | `wounds:null` in all four, coerced in `_castMember` (two non-negative ints, null when both 0) |
| `migrateTable` | last step 0.19 | step 0.20: every member without `wounds` gets null |
| A cast row's start | `damage:0, massive:0` (`addParticipant` ~9515) | at `startEncounter` (~9715) and on adding to a running one, an untouched cast row takes `wounds` |
| `encounterWrapUp` rows | `ended` health, `line` | plus `carries: { damage, massive }` for cast rows and entry rows |
| `endEncounter` | writes status, Keeps, lines | also writes `wounds` to each live cast member and each Kept member |
| Wrap-up UI | lines and statuses | a note per row that carries wounds: "Carries N damage into the next fight" |
| The cast page | the block, the interactions | a Wounds line with Heal and Heal all, when hurt |
| GM Help (`gmGuide`) | grep "unhurt", "wrap", "heal", "starts" in `gmGuide`. Nothing found on `main`, but re-grep at build | any line saying a fight starts fresh is rewritten |
| Dead Air sample | schema 0.19 | rebuilt at 0.20 (`tools/sample-table.mjs`). Give one cast member wounds so the sample shows it |
| Hostile files | `hostile.test.mjs` table cases | `wounds` as a string, negative, NaN, huge, or an array becomes null or clamped |
| Undo/Activity | the cast's edits: check how `change()`/`tableChange()` record a cast edit | Heal is one recorded change, undoable like any table edit |

## 6. Read first

`CLAUDE.md` (constraints 7, 8 and 10; the change tiers; *Decisions*). SCHEMA §4: Decisions 175, 191, 193, 203, 241, 257
and 261. `engine.js`: `_block`, `npc`, `_castMember`, `addCastMember`, `castFromRow`, `_memberFromEntry`, `addParticipant`,
`startEncounter`, `_claimStart` (the pattern), `encounterWrapUp`, `endEncounter`, `encounterView`'s health,
`migrateTable`. `gm.js`: the builder (~1034–1460), the cast page, the wrap-up (`S.encWrap`, ~3317 and ~4015),
print (~3160). `tests/smoke-table-cast.test.mjs`, `smoke-table-seat-fight.test.mjs`, `hostile.test.mjs`.

## 7. Out of scope

- **PCs.** A PC row's start is Decision 257's, and their wounds are on their sheets.
- **Armor wear on the cast.** Its armor is a text line (193's other half).
- **NPC downtime or a healing rate.** The GM says how much heals.
- **Conditions carrying** (GQ45).
- **Fixing Scott's numbers** in the Codex or the packs (GQ43).

## 8. The shapes

- **Data:** on each `derived` entry with `type: "sumOfModifiers"`, `npcRule: "override" | "floor"`. TOL is
  `"override"` and WILL is `"floor"`. A missing or unknown value reads as `"override"`, which is today's behaviour plus
  "blank means formula". Comment it with Decision N.
- **`Engine.npc(block)`** → `authored[id] = { value, formula, used, override, below }`.
  - `used` is `value ?? formula`. For a floor, `used` is `max(value, formula)` when both are numbers.
  - `override` is true only for an override rule with a number unequal to a number formula.
  - `below` is true only for a floor rule with a number below a number formula.
  - With no formula (a stat blank), `used = value`, and both flags are false.
  - `blanks` gets `id` only when `used` is null.
- **Cast member:** `wounds: { damage:int≥0, massive:int≥0 } | null`, null when both are 0. It's coerced in
  `_castMember`. Any number that isn't a whole, finite, non-negative one becomes 0, and the pair is capped at 999.
- **`Engine.castHealth(t, id)`** → `{ total, left, levels, levelsLeft, gone, down, damage, massive }`, read by the
  same stand-in a row uses (Decision 191), or null when the member has no BOD or doesn't exist. It never throws.
- **`Engine.healCast(t, id, { hp })` or `{ all:true }`** → `{ ok:true }`, or `{ ok:false, why }`. The refusals:
  "No such cast member.", "They aren't hurt." and "Heal at least 1.". `hp` lowers `damage`, floored at 0. `all`
  clears `wounds`. It stamps the member. A member in a running encounter can still be healed: the row has its own
  numbers, and the next wrap-up writes over them. The cast page says so (§9).
- **Start:** a helper `_castStart(t, r)` for cast rows, as `_claimStart`. If `!r.struck` and the row's damage,
  Massive and Conditions are all empty, it copies `wounds`. It's called from `startEncounter` for every cast row, and
  from `addParticipant` when the encounter is running.
- **Wrap-up:** `encounterWrapUp` rows gain `carries: { damage, massive }`, read from the row. `endEncounter` sets
  `member.wounds` for each cast row that isn't gone, and for each Kept member. It writes even when the GM doesn't
  write the line. A member set dead keeps them.
- **`migrateTable` 0.20:** every cast member gets `wounds:null` if the key is absent. Comment it "Nothing is converted
  (203)".

## 9. The UI

Copy is drafted for the voice pass.
- **The builder's TOL and WILL.**
  - The field's placeholder is the formula.
  - Beside it: `formula N` when blank or equal; `override · formula N` when a TOL differs.
  - For a WILL below its floor, an error under the field, in the builder's error style: "WILL can't be below N, its
    formula." It updates as the GM types, the way the other builder numbers do.
- **The cast page's stat block.** It shows `used`. An override reads "TOL 0 (override)", and a WILL below its floor
  shows the floor with "(below its formula)".
- **Print** (~3160) shows `used`, with the same words.
- **The cast page's Wounds** (when `wounds` isn't null):
  - "Hurt: 14 of 24 HP left", and "1 level gone to Massive" when there are any.
  - Below it, a number field labelled "Heal", and a **Heal** button and a **Heal all** button.
  - After Heal, focus stays on the field, emptied. After Heal all, the Wounds line goes and focus moves to the page's
    heading.
  - A member in a running encounter gets one more line: "In a fight now: this heals them after it, unless the wrap-up
    says otherwise." It gets a voice pass.
- **A planned encounter's cast row** for a hurt member: "Hurt: 10 HP" beside the name.
- **The wrap-up:** each row that carries wounds gets the line "Carries 10 damage into the next fight" ("and 1
  Massive level" when there are any). A Kept row's line says "Kept, carrying 10 damage".

Where things land:

| Press | The record | Focus |
|---|---|---|
| Heal (N) | `member.wounds.damage` falls by N (null at 0) | the Heal field, emptied; at 0, the heading |
| Heal all | `wounds` null | the page's heading |
| End (wrap-up) | each member's `wounds` | as today |
| Start | untouched cast rows take `wounds` | as today |

## 10. Worked examples, as named tests

Each fails on `main`, or the builder says why it already passes.
1. `tests/engine.test.mjs`, `"Decision N: a blank TOL reads its formula, and a typed one that differs is an override"`.
   BOD, INT and WIL set; TOL blank gives `used` equal to the formula and no "TOL" in `blanks`. TOL 0 gives `used` 0
   and `override` true.
2. `"Decision N: a WILL below its formula is kept, flagged below, and the floor is used"`. WILL one under the formula
   gives `value` kept, `below` true and `used` equal to the formula.
3. `"Decision N: the rule is the data's"`. A cloned data set with TOL's `npcRule` set to "floor" flips example 1's
   override to `below`. Mutation-test it by deleting the read.
4. `"Decision N+1: a cast member's wounds carry out of the wrap-up and into the next fight"`. Hit a cast row for 10,
   wrap up, and the member's `wounds` is `{ damage:10, massive:0 }`. A new encounter, started, has that row at
   damage 10.
5. `"Decision N+1: a row nothing has happened to takes its member's wounds at Start, not when planned"`. Plan, heal
   the member to 4, start: the row has 4.
6. `"Decision N+1: Heal takes HP, Heal all clears Massive too"`. Heal 3 from 10 leaves 7. Heal all gives null. Healing
   an unhurt member is refused with "They aren't hurt.".
7. `"Decision N+1: a Kept copy becomes a member carrying the row's wounds"`.
8. `"Decision N+1: Conditions don't carry"`. A row with Bleeding wrapped up gives a member with no Conditions
   anywhere.
9. `tests/hostile.test.mjs`, `"a cast member's wounds are coerced"` (the cases in §5).
10. Migration: `"Table schema 0.20: a 0.19 file's members get wounds null, and nothing is converted"`.
11. Smoke (`smoke-table-cast.test.mjs`): the builder's error appears and clears; Heal and Heal all; focus as §9's
    table says. Seat-fight or encounter smoke: the wrap-up's "Carries" line.
12. `tests/rules.test.mjs`, `"Decision N: Marta's printed WILL 2 is below its formula 3, and her TOL 2 is no override"`
    (`2611`). Use her numbers inline, so it runs without `private/`: BOD 5, INT 5, COOL 7, EMP 8. WILL gives
    `below` true and `used` 3. TOL gives `override` false.

## 11. Tests beyond the examples

- **Totality:** `npc`, `castHealth` and `healCast` on null, `{}`, a string, a member with no block, and a block with
  BOD null.
- **Round trip:** a member with wounds survives `migrateTable` unchanged.
- **The voice tests** pass on every new string.
- **Mutation-test:**
  - the floor's `max`;
  - `_castStart`'s "nothing has happened" check (drop it: example 5's row is overwritten mid-fight);
  - the wrap-up's write (drop it: example 4 fails);
  - the 0.20 step.
- **Fixture diff** (as L5b did): every Dead Air cast member's `npc()` before and after. Only `authored` gains keys,
  `blanks` loses TOL and WILL where a formula exists, and nothing else moves.

## 12. Steps

1. Baseline: `git submodule update --init private`, then `npm run test:fast`.
2. Write the worked examples, and show them failing.
3. The data key and `npc()`. Run `npm run verify`.
4. The cast shape, the migration and hostile coercion. Verify.
5. Start, the wrap-up and `castHealth`/`healCast`. Verify.
6. The UI: the builder, the cast page, the wrap-up, print. Verify, then the dev preview (`shadows-dev-preview`, Dead
   Air seeded per `CLAUDE.md`), desktop and 375px, and print.
7. The sample rebuilt, the docs, close-out. Run the full `npm run verify`.

## 13. Stop and ask

- **Stop** if any combat number moves for an NPC with no wounds (the fixture diff), if a PC row's start changes, or
  if a reader of `authored` or `blanks` turns up that §5 doesn't list.
- **Stop** if Marta's WILL isn't below its formula once computed. GQ6's facts would then be wrong.
- **Expected, not stops:**
  - tests asserting `blanks` contains TOL or WILL;
  - tests asserting the text "book: N";
  - tests asserting that a member starts a fight unhurt;
  - the table schema literal;
  - the app version literals;
  - the Dead Air sample's diff.

## 14. Close-out

The `close-the-session` skill for *Rule or shape*:
- Decisions N and N+1, with their INDEX lines and supersession marks.
- Table schema 0.20, and the app minor.
- STATE rewritten: GM mode's row, and S24 built.
- The log, and a `shipped.md` row.
- The plan's S24 row set to built, with this order's link.
- GQ6 and GQ26 marked built in `archive/gm-mode.md` §9, and GQ43–GQ47 answered in §5.

**CHANGELOG** (drafted, GM voice):
- "An NPC's TOL is its formula unless you type an override, and a WILL below its formula shows as an error."
- "Cast members carry their wounds from one fight to the next. Heal them from their page."

**PR title:** `feat(gm): NPC TOL and WILL follow the formula, and wounds carry (S24, Decisions N and N+1)`.

**PR body:** the template's sections, plus **New strings as rendered**, **Fixture diff** and **Where the order didn't
fit**.

**Review checklist:**
- §1's seven checks, run in the preview.
- No NPC combat number moves without wounds.
- A PC row is untouched.
- Healing during a running fight behaves as §8 says.
- The 0.19 → 0.20 round trip.
- Marta.
- The voice of every string.
- Both supersession marks.

## 15. Handing it over

The builder and reviewer prompts are in `WORK-ORDERS.md`, with this order's path. Its own traps:
- **Healing during a fight.** The row is the fight's record, and the member is the person. The wrap-up writes the
  row back over a heal made mid-fight. That's the design, and the cast page says so. Don't make the row read the
  member live.
- **"Nothing has happened to it"** is 257's test: not `struck`, and no damage, Massive or Conditions. Reuse its
  shape, and don't invent a flag.
- **The formula needs every input.** With a stat blank, there is no formula, `used` is the stored value, and both
  flags are false. Don't show "formula NaN".
- **`npcRule` is read by `npc()` only.** The player sheet's `derived()` must not change. The fixture diff on a
  character proves it.
- **Take the numbers at build:** the decision, the table schema and the app minor, from `origin/main`, and again after
  any rebase.
