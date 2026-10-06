# Work order S10a — The fight: who's in it, whose turn, and what's still on them

**Plan:** [`../gm-mode.md`](../gm-mode.md) §1a, §4h and §6 *S10*; GQ15, GQ16,
GQ18, GQ19.
**Status:** drafted 2026-10-06 by Claude (Opus), after #123 (S9c) merged
with its fix round (README step 7). **§4 awaits Ken.** Nothing is built from
it until he approves.
**Branch:** from `main` at or after `4aa2327`, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js`'s Tables section, `gm.js`, the CSS,
the ledger, the table schema and STATE.

**Why S10a and not S10.** The plan's S10 is a fight record, participants,
Order of Engagement, the round, Reset, Conditions with durations, NPC damage
through the engine's pipeline with armor, traits as reminders, ending a fight
with Keep and Promote, the Encounter Design worksheet, and Use's second verb.
That's at least two sessions, and one half rests on answers we don't have
yet: NPC armor is text (175), and how it becomes PROT and RES is GQ18,
Deighton's. Scott's own priority is the other half: *Conditions are what I
lose*. So (SQ1):

- **S10a (this order):** the fight record; rows from the cast, the Codex
  (one row per copy), a group unpacked, and PCs by typed name; Order of
  Engagement; the turn and the round; **Conditions with a source and a
  duration on every row**; **Reset's checklist**; damage as HP straight onto
  a row; ending a fight; and Use's two verbs.
- **S10b (next):** a hit through the engine's pipeline (armor, Shock, Health
  Levels, Pain Levels) with an NPC adapter and armor numbers (GQ18), At Zero
  and Dying for NPCs, traits as reminders with their triggers, Keep and
  Promote at a fight's end, a cast member's history line.
- **Later:** the Encounter Design worksheet (the prep half, §4h) and
  Surprise, Ambush and Delay (SQ9).

**Released before it's built.** v0.37.0 carries everything to S9c switched
off, so Scott can open the live site with `?gm=on`, import the Codex pack
Ken hands him, and use the cast and the Threats tab while this is built.
What he finds goes into S10b's order, and into this one's fix round if it
lands first.

**Carried over from S9c's review** (#123, one fix round, six fixes; two were
the order's):

- **A command that edits saved state by hand needs the build's refusals.**
  S9c's `--rename` silently overwrote an id. Here: every engine writer
  refuses what would orphan a row or a link (§7 says which), and each
  refusal has a test.
- **A rule that names a pattern to grep misses its neighbours.** S9c's
  folding rule named `.toLowerCase().includes(` and missed the lists that
  dedupe by the same key. Here: §7 names every reader by function, not by
  pattern.
- **Read every line the split produces.** S9c's gear rule cut four dash
  comments, caught only by reading the output. Here: the browser check
  (§10 step 7) reads every row of a real three-group fight against the book.

**Pre-flight** (README, *The pre-flight*), against `main` at `4aa2327`:

- **The sheet already has Turn Reset** (Decision 100, P8): `resolveReset(ch,
  input)` and `applyReset(ch, input, choices)`, pure preview and one writer.
  It reads each Condition's `ongoing` from the data: Bleeding `{ hp: 1 }`,
  Burning and Shocked `{ source: true }` (an entered number, *Put 0 if it's
  out*). It lists every Condition's `recovery` as text and runs no check.
  While Dying it asks `damageRules.whileDying.resetCheck` (*WILL Essence
  Check TN 8 TH 2*). The fight's Reset is that, per row. **No rule is
  invented here**: every tick and every line of text comes from the data.
- **Both readers take a character** (`ch.trackers.conditions`, `hlState(ch)`),
  so the fight can't call them. It reuses their pure parts: `conditionById`,
  `locationById`, `conditionKey` (one entry per id, one per body part for a
  `location` Condition, the F22 stub), and the data's `ongoing`,
  `counter` and `recovery`. §7 says so function by function.
- **Conditions have no duration in the data** (20 rows, `054`'s 19 plus
  Dying). They end by a save, by removing the source, at scene end, or (for
  DeSynced) after 1d4 rounds, all as `recovery` text. So the round count is
  **the GM's**, entered when they add one, and never derived (189).
- **`whileDying.resetText` is in player voice** (*You're Dying…*) and F24 is
  open on it. A row shows `resetCheck` only, the check's name and numbers.
- **Location and counter Conditions:** Injured and Maimed take a body part;
  Dying has a counter (`Death Marks`, max 3). The fight's Condition entry
  keeps the character's shape (`{ id, location?, marks?, note? }`) and adds
  `source` and `rounds`.
- **Combat Sense** is the data's `combat-sense`; Order of Engagement is a
  Combat Sense check, highest first, ties re-roll, Combat Paralysis always
  last (`053` *Engagement*). The app rolls nothing for a GM yet; Scott rolls
  at the table (GQ2). Entered (SQ3).
- **Awareness** is the data's `awareness`. An NPC's comes from its block's
  skill row matched by id; a PC's is typed (GQ19's scratch copy).
- **`Engine.npc(block).health`** gives `{ levels, hpPer, total }` from BOD,
  or null for a blank BOD. A row stores damage taken and derives HP left
  (constraint 7).
- **`castFromEntry(t, pack, id)`** copies an entry's block with
  `JSON.parse(JSON.stringify(…))` and stamps `from` (182). An entry row does
  the same, so two copies never share a block.
- **`packGroups`** returns `{ pack, group, members: [{ entry, count }] }`,
  members resolved and missing ones dropped. Unpacking reads it.
- **Links:** `_castLinks` keeps a `{ kind: "cast", id, name? }` link that
  points at nobody, read by `linkName` (178). A cast row is that link.
- **`TABLE_SECTIONS`** in `gm.js` is `cast`, `threats`, `notes`; the tab
  binder clears each tab's open page on switch (`S.castOpen`,
  `S.threatOpen`…). A `fight` section joins it.
- **`TIPS`** has no Condition kind; `gm.js` adds `TIPS.packrec` itself. A
  `condition` kind joins it the same way. S9a's `TIPS` guard covers every
  `data-tip` kind.
- **Use** is `data-tuse` on the entry page (`gm.js` ~988), calling
  `castFromEntry`. Its label and every *Use* in GM copy and tests are found
  by grep (`>Use<`, `"Use"`, `Use copy`).
- **`migrateTable()`**'s steps end at 0.4 (182). This is 0.5.
- **The ledger** (Decision 130), searched by name: *fight*, *encounter*,
  *tracker*, *Reset*, *Turn Reset*, *round*, *Order of Engagement*, *Combat
  Sense*, *Condition*, *duration*, *Awareness*, *scratch*, *Use*,
  *castFromEntry*, *table schema*. Hits:
  - **95, 96** (Conditions are data, and what they do to the numbers);
  - **99, 100** (a hit, and Turn Reset's preview-and-writer);
  - **98** (the −8 cap);
  - **174, 175** (the cast, a block stores what the book prints);
  - **178** (a link to nobody is kept, under its name);
  - **182** (Use, the copy and its `from`): **superseded in part by 190**
    (Use's label);
  - **173** (switched off).
- **Decisions 188, 189, 190** are free on `origin/main`. Check again before
  pasting.

---

## 1. Goal

A GM runs a fight from the table: who's in it, whose turn it is, and **every
Condition on everyone, with where it came from and when it runs out**. At
each Reset the app lists what ticks, what runs out and what's asking for a
save, row by row, so nothing ends because the GM forgot it.

**Done when:**

- Switched off: nothing changes anywhere.
- Switched on, the table has a **Fight** tab (SQ8) between Threats and
  Notes.
- **Setting up:** *New fight* makes one (name optional). Rows come from:
  - the cast (a picker with search): a **cast** row, linked;
  - an entry's page: **Add to fight** adds one copy, numbered when it's the
    second (*Street Tough 2*);
  - a group's page: **Add to fight** adds every member × its count;
  - a typed name: a **PC** row.
- Each row: its name, its Combat Sense result, HP left of its total, its
  Awareness, and its Conditions.
- **Order of Engagement:** rows sort by result, highest first, blanks last
  in the order added. Two rows with one result both say *Tied: reroll*.
  *Goes last* puts a row after everyone (Combat Paralysis).
- **The round:** *Start* makes it round 1 with the first row active. *Next*
  moves on, skipping rows marked *Out*. After the last row comes **Reset**.
- **Conditions:** a row's *Add a Condition* picks from the game's list, a
  body part when it needs one, a source (*Corner Shot's burst*), and rounds
  (blank: *until it's dealt with*). Each shows its rounds left and its rule a
  tap away. The no-stacking rule is the sheet's.
- **Reset** lists, row by row: Bleeding's 1 HP; Burning's and Shocked's
  damage to enter; every Condition whose rounds run out now, each with *End*
  (pressed) and *Keep*; every other Condition's recovery, as the save to
  call; and Dying's check. *Finish the round* applies the ticks, counts every
  duration down, ends what was left on *End*, and starts the next round at
  the top.
- **Damage:** a row takes HP straight off (*Take* and a number), and *Heal*
  puts it back. HP left never goes below 0, and at 0 the row reads *Down*.
- **Ending:** *End the fight* keeps it, read-only, under *Past fights*.
- **Use's verbs:** the entry page has **Add to cast** (was *Use*) and **Add
  to fight**; a group's page, **Add to fight**; a cast member's page, **Add
  to fight**. *Add to fight* shows only while a fight is open.
- Export, import, reload, Remove keep every field. A 0.4 table opens as 0.5
  with no fights and everything else untouched.
- A hostile table opens, renders as text, and its numbers come out numbers
  or blank (§9).
- `npm run verify`, `npm run phone-check` and `npm run release:check` pass;
  the Fight tab checked by hand at 390px, 768px (a tablet, §1a) and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (the table's shape, a fight's rules in the engine,
  a label someone could choose otherwise).
- **App:** no bump (switched off, 173). One line to `changelog-pending.md`.
- **Game data, character schema, pack schema:** unchanged.
- **Table schema:** **0.4 → 0.5**, with `migrateTable()`'s step.
- **Reserved:** Decisions **188, 189, 190**. No F-flag: nothing here answers
  a rules question (F24 stays open, and the row shows the check's name only).

## 3. The decisions, drafted

Paste after 187, under INDEX §3's **GM mode** heading, filling **Built**.
**Count each with `wc -w`**; the cap is 350.

```
188. **A table keeps its fights: rows from the cast, the Codex and typed names, each with its own damage and Conditions, and a PC's row is the GM's scratch copy.**
     *2026-10-0X · Ken + Claude · Touches: fights, fight row, table schema 0.5, migrateTable, cast link, from, block copy, PC row, scratch HP, Awareness, damage, Conditions on a row, source, rounds, Fight tab, TABLE_SECTIONS, GQ15, GQ19, Decision 174, Decision 178, Decision 182*
     - **Decided:** a table has `fights`, each with a name, a status (setup, running, ended), a round, whose turn it is, and rows. A row is a **cast** row (a link to the member, read live), an **entry** row (its own copy of the entry's block and a `from`), or a **PC** row (a typed name, with the GM's own HP and Awareness). Every row stores damage taken and its Conditions, each with a source and rounds left. HP left is derived. One fight is open at a time; an ended one is kept, read-only.
     - **Why:** Scott tracks every Condition at the table and loses them (§1a). A PC's numbers live on the player's sheet; at an in-person table the GM keeps a copy anyway (GQ19), and it is never written back. Copies of one entry each take their own hits.
     - **Rejected:**
       - Entry rows linked to the pack: the pack can be replaced mid-campaign (181), and two copies would share one block.
       - Cast rows copied: a member edited between fights would fight with the old block.
       - PCs only once seats exist (S3b): Scott needs the fight before the character-facing half.
       - Several open fights: two fights in one room are one fight.
     - **Replaces:** nothing.
     - **Revisit if:** seats arrive (S3b: a PC row is claimed by a seat), or live sync makes the scratch copy unnecessary (§8).
     - **Built:** table schema 0.5; PR #__; log 2026-10-0X.

189. **A fight's round is the book's: Combat Sense highest first, ties shown and never broken, and a Reset that lists, row by row, what ticks, what runs out and what asks for a save.**
     *2026-10-0X · Ken + Claude · Touches: Order of Engagement, Combat Sense, ties, Goes last, Out, turn, round, Next, Reset, Turn Reset, resolveReset, ongoing, recovery, whileDying.resetCheck, rounds, End, Keep, Take, Heal, Down, Decision 95, Decision 100, F24*
     - **Decided:** the GM enters each row's Combat Sense result; rows sort highest first, a tie is flagged on both rows for a reroll, and *Goes last* follows everyone. *Next* skips rows marked *Out*. Reset, after the last row, applies the data's `ongoing` ticks (an entered number for a source), counts every GM-entered duration down by one, and lists each Condition that reaches zero with *End* (the default) or *Keep*, every other Condition's recovery as text, and Dying's check by name. Damage is HP straight onto a row: no armor, no Shock (S10b).
     - **Why:** `053` says what a round is; the sheet's Turn Reset (100) already reads the data the same way. A Condition's duration is the GM's: the data gives recovery, not rounds.
     - **Rejected:**
       - Rolled initiative: the GM rolls at the table (GQ2), and a roll in the app is a second source of truth.
       - Ties broken by the app (stat, then random): `053` says reroll.
       - Durations from the data: there are none; a guess would answer a rules question in code.
       - A Condition that runs out ending on its own: the point is that nothing ends silently.
     - **Replaces:** nothing. Decision 100's Turn Reset is unchanged; this applies its rules per row.
     - **Revisit if:** the app rolls checks (a dice decision of its own), S10b's pipeline makes a tick a hit, or F24 is answered.
     - **Built:** as 188.

190. **Use has two verbs: Add to cast and Add to fight, on an entry, a group and a cast member.**
     *2026-10-0X · Ken + Claude · Touches: Use, data-tuse, Add to cast, Add to fight, entry page, group page, cast member page, castFromEntry, Decision 182*
     - **Decided:** the entry page's **Use** becomes **Add to cast**, which does what Use did (182: the copy opens, its name selected), and **Add to fight** sits beside it. A group's page and a cast member's page get **Add to fight**. *Add to fight* shows only while a fight is open, and adds to that one. Each press adds one row (a group, all its members), says so, and stays on the page.
     - **Why:** one word leading two places is a word the GM has to stop and read (S9b's SQ7). Staying on the page lets a GM add three Street Toughs in three taps.
     - **Rejected:**
       - *Use* opening a choice: two taps for the commonest act.
       - Add to fight only from the Fight tab: a GM reading an entry is already where they decide to field it.
     - **Replaces:** Decision 182 in part: its button's label, *Use*.
     - **Revisit if:** a third place to copy an entry appears (an encounter plan, a session's prep).
     - **Built:** as 188.
```

**Supersession marks:** 182 *in part* (its **Use** label) → **superseded in
part by 190**, in the ledger and its INDEX line. If the ledger search at build
time finds anything else either overrides, stop and ask.

## 4. Questions for Ken

| # | Question | Default |
|---|---|---|
| SQ1 | **Split S10** into S10a (this: the record, the round, Conditions, Reset, HP straight on) and S10b (the hit pipeline and armor numbers, At Zero and Dying for NPCs, traits as reminders, Keep and Promote). | **Yes** |
| SQ2 | **One open fight at a time**; ended fights kept read-only under *Past fights*, each deletable. | **Yes** |
| SQ3 | **Combat Sense results entered, not rolled.** The app rolls nothing for a GM until a dice decision says it should. | **Yes** |
| SQ4 | **A cast row is linked** (the member's block, read live); **an entry row is a copy** (its own block, numbered *2*, *3*…). | **Yes** |
| SQ5 | **Damage is HP straight onto a row** in S10a: *Take* and *Heal*, no armor, no Shock, no Pain Levels. S10b runs it through the pipeline. | **Yes** |
| SQ6 | **A Condition that runs out at Reset** is listed with *End* already pressed and *Keep* a tap away (Keep adds one round). Or must the GM answer each before the round can finish? | **End pressed**: listed, never silent, and one tap to keep |
| SQ7 | **Use's label:** *Add to cast* and *Add to fight*, both on the entry page. | **Yes** |
| SQ8 | **The tab's name:** *Fight* (the plan's word; `053` says *combat encounter*, and the Encounter Design worksheet comes later). | **Fight** |
| SQ9 | **Not in S10a:** Surprise and Ambush, Delay (a GM taps any row to make it active), the Encounter Design worksheet. | **Yes** |
| SQ10 | **A PC row's HP is optional.** Blank, the row shows damage taken (*12 taken*) instead of *HP left*. Scott can call out hits without knowing a player's total. | **Yes** |

## 5. Read first

- `CLAUDE.md` whole: constraints 7, 9 and 10; *Decisions*; *Flags*.
- `docs/STATE.md` whole.
- The plan: §1a (what Scott told us), §4h (encounters), §6 *S10*, §9 GQ15,
  GQ16, GQ18, GQ19.
- `docs/SCHEMA.md` §4: Decisions **95**, **96**, **100** (Turn Reset), **174**,
  **175**, **178**, **182**, **188**'s neighbours; §5's **F22** and **F24**.
- `private/crb/053_Combat_Encounters.md`: *Engagement*, *Reset*, *Aftermath*.
  `054_Conditions_and_Recovery.md`: the table and Dying.
- **The code:** `engine.js`'s `conditionKey`, `conditionById`,
  `addCondition`, `setConditionMarks`, `resolveReset`, `applyReset`, `npc`,
  `_block`, `_castLinks`, `linkName`, `castFromEntry`, `packGroups`,
  `migrateTable`; `gm.js`'s `TABLE_SECTIONS`, the tab binder, the entry page
  (`data-tuse`), the group page, `castPageHtml`, `TIPS.packrec`; the sheet's
  Conditions picker and its Turn Reset card in `sheet.js` (what a GM's
  should feel like, not code to share).

## 6. Out of scope

- A hit through armor; Shock; Health Levels and Pain Levels on an NPC; At
  Zero; Dying's marks applied for an NPC by the app (the GM sets marks by
  hand); armor numbers (S10b, GQ18).
- Traits as reminders or triggers; Keep and Promote; a history line (S10b).
- Surprise, Ambush, Delay; the Encounter Design worksheet (SQ9).
- Rolling anything.
- Any change to the sheet's Conditions, Turn Reset or their engine readers.
  The fight reuses their pure helpers and changes none of them.
- Any data change, any pack change, any Codex word in `src/` or `tests/`.

## 7. The shapes

**The table, schema 0.5:**

```js
t.fights = [{
  id: "FT-XXXXXXXX",                // FIGHT_ID_RE = /^FT-[0-9A-HJKMNP-TV-Z]{8}$/
  name: "",                         // the GM's; blank reads "Fight" plus its date
  status: "setup",                  // "setup" | "running" | "ended"
  round: 0,                         // 0 in setup; 1… running; kept when ended
  turn: null,                       // a row's id, or null (setup, ended, or at Reset)
  rows: [Row],                      // in the order added; the order shown is derived
  created, updated                  // ISO, as a note's
}]

Row = {
  id: "R-XXXXXXXX",                 // unique within its fight
  kind: "pc",                       // "pc" | "cast" | "entry"
  name: "",                         // shown; a cast row's is the member's name when added
  cast: null,                       // kind "cast": { kind: "cast", id, name } (178's link)
  from: null,                       // kind "entry": { kind: "entry", pack, id, name } (182's)
  block: null,                      // kind "entry": its own copy (175's block); else null
  order: null,                      // the Combat Sense result: whole number or null
  last: false,                      // Goes last
  out: false,                       // out of the fight: skipped by Next, kept on the list
  damage: 0,                        // HP taken: whole number ≥ 0
  hp: null,                         // kind "pc" only: the GM's total, or null (SQ10)
  awareness: null,                  // kind "pc" only: whole number or null
  conditions: [{                    // the character's entry shape, plus source and rounds
    id, location?, marks?, note?,   // as addCondition makes them
    source: "",                     // the GM's text
    rounds: null                    // whole number ≥ 1, or null: until it's dealt with
  }]
}
```

**The gate** (`migrateTable`, step *Schema 0.5 (Decision 188): a table gets
fights*): before 0.5, `fights` is `[]`. Then every fight and row is coerced
as a note is:

- A fight that isn't an object is dropped. `id` is kept when it matches and
  is unused, else a new one. `name` a string. `status` one of the three,
  else `"setup"`. `round` a whole number ≥ 0, else 0. `rows` coerced (below).
  `turn` kept only if it names a row of this fight and `status` is
  `"running"`, else null.
- **More than one fight not ended** (a hand-edited file): every one but the
  newest by `created` becomes `"ended"`. Nothing is dropped.
- A row that isn't an object is dropped. `kind` one of the three, else
  `"pc"`. `cast` through `_castLinks`' rule for one link, else null; `from`
  through `_castFrom`, else null; `block` through `_block`, else null. A
  `cast` field on a non-cast row, or `from`/`block` on a non-entry row, is
  set null (not dropped silently: it's a field that can't mean anything
  there). `order`, `hp`, `awareness` through `_int`, else null; `hp` and
  `awareness` null unless `kind` is `"pc"`. `damage` through `_int`,
  floored at 0, else 0. `last`, `out` booleans (`=== true`).
- A row's `conditions`: objects whose `id` is a Condition in the data. A
  location Condition with no valid location is dropped. `marks` kept only
  when the def has a counter, clamped to `0…max`. `note` and `source`
  strings. `rounds` a whole number ≥ 1, else null. Two entries with one
  `conditionKey` keep the first.

**Engine** (Tables section, *The fight (Decisions 188–190)*). Every writer
takes the table first, stamps it (`_tableStamp`), and returns `{ ok: true,
… }` or `{ ok: false, why }` without changing anything. Every reader is
total.

| Function | Does | Refuses |
|---|---|---|
| `addFight(t, { name })` | a fight in setup, at the front; `{ ok, id }` | *Finish the fight that's on first.* when one isn't ended |
| `editFight(t, id, { name })` | renames | no such fight |
| `removeFight(t, id)` | deletes it | no such fight |
| `openFight(t)` | reader: the fight not ended, or null | — |
| `addFighter(t, fightId, { kind: "pc", name })` | a PC row | no such fight; ended; a blank name |
| `addFighter(t, fightId, { kind: "cast", id })` | a cast row, linked, named as the member | no such member; ended; **the member already has a row in this fight** (*Already in the fight.*) |
| `fighterFromEntry(t, fightId, pack, entryId)` | an entry row: a copy of the block, `from` stamped, named with *2*, *3*… after the first of that name in the fight | no such entry; ended |
| `fightersFromGroup(t, fightId, pack, groupId)` | one entry row per member × count, through `fighterFromEntry`; `{ ok, ids }` | no such group; ended; a group with no resolvable member |
| `editFighter(t, fightId, rowId, f)` | sets `name`, `order`, `last`, `out`, `hp`, `awareness` (the last two PC rows only, else ignored) | no such row; ended |
| `removeFighter(t, fightId, rowId)` | removes; if it was `turn`, the turn moves to the next row | no such row; ended |
| `fighterDamage(t, fightId, rowId, n)` | `damage += n` (n may be negative: Heal), floored at 0 | n not a whole number; ended |
| `fighterAddCondition(t, fightId, rowId, entry)` | as `addCondition`, plus `source` and `rounds` | as `addCondition` (same words); ended |
| `fighterRemoveCondition(t, fightId, rowId, index)`, `fighterConditionMarks(…, index, marks)` | as the character's | as the character's; ended |
| `startFight(t, fightId)` | `running`, round 1, `turn` the first row in order not out | not in setup; no row that isn't out (*Add someone to the fight first.*) |
| `nextTurn(t, fightId)` | `turn` to the next row in order not out; after the last, `turn` null and `{ ok, reset: true }` | not running; already at Reset |
| `setTurn(t, fightId, rowId)` | makes a row active (Delay, by hand) | not running; out |
| `resolveFightReset(t, fightId, input)` | **pure**: per row, `ticks` (as `resolveReset`, source numbers from `input.sources[rowId][index]`), `expiring` (conditions with `rounds === 1`), `recovery` (every other Condition's `recovery`), `dying` (`whileDying.resetCheck` when the row has Dying) | the same *Enter this round's Burning damage…* refusal as `resolveReset`, naming the row |
| `applyFightReset(t, fightId, input, choices)` | re-resolves; adds ticks to `damage`; every `rounds` −1 (null stays null); an expiring Condition is removed unless `choices.keep` lists `[rowId, index]`, in which case `rounds` becomes 1; round +1; `turn` the first row not out | as resolve; not at Reset |
| `endFight(t, fightId)` | `ended`, `turn` null | not open |
| `fightView(t, fightId, packs)` | **reader**: the rows in order (below) with each row's figures | — (null for no such fight) |

**`fightView`** returns `{ fight, rows: [{ row, name, hp, awareness, ties,
active, conditions }], atReset }`:

- **Order:** rows not `last` with an `order`, highest first; then rows not
  `last` without one, in the order added; then `last` rows by the same rule.
  Equal `order`s keep the order added. `ties` is true on every row (not
  `last`) whose `order` another such row shares.
- **`hp`:** `{ total, left, down }` or null. A PC row's total is `hp`; a
  cast row's is `npc(member.block).health.total`, the member read through
  the link (a link to nobody, or a blank BOD: null); an entry row's is
  `npc(row.block).health.total`. `left = max(0, total − damage)`; `down` is
  `left === 0`. With no total, `{ total: null, taken: damage }`.
- **`awareness`:** a PC row's `awareness`; otherwise the block's skill row
  whose `skill` is `"awareness"`, its `total`, else null.
- **`name`:** a cast row reads `linkName` (178): the member's current name,
  or the stored one if they're gone.
- **`conditions`:** each with its `def`, `location` (resolved), `rounds`,
  `source`, `note`, `marks` and the def's counter.

**Where the record lives on every press:** *Take*, *Heal*, a Condition, a
mark, an order, *Out*, *Goes last*: the row. *Next*, *Start*, *Finish the
round*, *End the fight*: the fight. Nothing on a fight ever writes to the
cast, a pack or a character (188).

**Use's verbs** (190): `castFromEntry` is unchanged. *Add to cast* calls it
and behaves exactly as *Use* did: the copy opens, its name selected, and
S9a's smoke tests for Decision 182 pass with only the label changed. *Add to fight* calls `fighterFromEntry` or `fightersFromGroup`
on `openFight(t)`. A cast member's *Add to fight* calls `addFighter` with
`kind: "cast"`.

## 8. The UI

All in `gm.js` and the CSS. GM-facing tool voice; drafts marked ✎ for a voice
pass. **Built for a tablet at the table** (§1a): every control a tap, at
least the sheet's tap size; the active row and the round always visible
without scrolling at 768 × 1024.

**The Fight tab, no fight open:** a short line (✎ *Nothing's kicked off.*),
*New fight* (a name field beside it, optional), and *Past fights* below: one
line each (name, date, *4 rounds*), opening it read-only, with *Delete*
(asks first).

**Setting up** (status `setup`):

- The fight's name (editable) and **Start**.
- **Add**: *From the cast* (a picker: search, a row per member with **Add**;
  members already in the fight say *In the fight*), and a name field with
  **Add a PC**. A line pointing at the Threats tab for Codex entries and
  groups (✎ *Codex threats and groups: Add to fight from the Threats tab.*).
- The rows, in order (below), each editable.

**A row** (setup and running alike):

- **Name**, then a kind mark (*PC*, *Cast*, or the pack entry's ref), then
  **Combat Sense** (a number field) and *Tied: reroll* when `ties`.
- **HP:** *18 / 30* (or *12 taken*), **Take** and **Heal**, each opening a
  number field in place with **OK**; *Down* at 0. A PC row also has its HP
  total and **Awareness** as number fields; an NPC row shows Awareness as
  text.
- **Conditions:** each a chip: name (and body part), *3 rounds* or nothing,
  source in small text, marks with − and + for a counter, the rule a tap
  away (`TIPS.condition`: title the name, text `effect`, more `recovery`),
  and **Remove**. **Add a Condition** opens a picker (the sheet's list, a
  body part when needed, *Source*, *Rounds*), refusals shown in the picker.
- **More** (a toggle or menu): *Goes last*, *Out of the fight*, *Remove*.
- A cast row's name opens the member's page; an entry row's ref opens the
  entry's page (`entryLink`), and both come back to the fight (*Back to the
  fight*).

**Running:** the header shows *Round 3* and **Next**. The active row is
marked (a left rule, `aria-current="step"`) and scrolled into view when it
changes. Tapping a row's name area makes it active (`setTurn`).

**Reset** (after the last row): the rows give way to one panel, ✎ *Reset:
round 3 ends*:

- Per row with anything to say, a heading (the row's name), then:
  - ticks: *Bleeding: 1 HP*; *Burning: [  ] HP* (a number field, required);
  - *Runs out now:* each expiring Condition with **End** (pressed) and
    **Keep**;
  - *Calls for a check:* each other Condition's recovery text;
  - Dying: *Dying: WILL Essence Check TN 8 TH 2* (`resetCheck`), marks
    beside with − and +.
- Rows with nothing are one line: ✎ *Nothing on: Street Tough 2, Bob.*
- **Finish the round**, disabled until every source field has a number,
  then round +1 and back to the rows with the first active.

**Ended** (and *Past fights*): the rows read-only, *Round 4* as the final
round, and **Delete**.

**Use's verbs:** the entry page's buttons read **Add to cast** and, while a
fight is open, **Add to fight**; the group page and the cast member's page
have **Add to fight**. Each *Add to fight* shows a notice (✎ *Street Tough 2
is in the fight.*, *Corner Crew is in the fight: 4 added.*) and stays on the
page.

**Where things land:**

| Press | The record | The view | Focus |
|---|---|---|---|
| *New fight* | a fight, setup | the Fight tab, setting up | the name field |
| *Add* (cast picker) | a cast row | the picker stays open; that member says *In the fight* | the next member's **Add** |
| *Add a PC* | a PC row | the row appears in order | the name field, empty |
| *Add to fight* (entry, group, member) | entry or cast rows | the same page; a notice | stays on the button |
| A Combat Sense number | `order` | rows re-sort when the field loses focus, not while typing | the same row's field, wherever it moved |
| **Start** | running, round 1 | the active row marked | **Next** |
| **Next** | `turn` | the new active row scrolled into view | **Next** |
| **Next** after the last row | `turn` null | the Reset panel | the first required field, or **Finish the round** |
| **Finish the round** | the round's changes | the rows, round +1 | **Next** |
| *Take* / *Heal* + OK | `damage` | the row's HP | the row's **Take** |
| *Add a Condition* + Add | the row's Condition | the chip appears | the new chip's **Remove**'s neighbour, the rule tip button |
| A Condition's **Remove** | removed | the chip goes | the row's **Add a Condition** |
| *Out of the fight* | `out` | the row dims, stays in place | the same toggle |
| *Remove* (row) | the row goes | — | the next row's name, or **Add a PC** |
| **End the fight** (asks first) | ended | the Fight tab, no fight open; it heads *Past fights* | **New fight** |

**What a refused or empty value shows:** a number field that can't be a
whole number shows the stored value once it loses focus (S8a's rule). A
blank Combat Sense is *—*, sorted last. A blank PC name isn't added.

**Copy** (✎ throughout; tool voice). No flag id, no "S10b", no "coming soon"
(constraint 9): the things S10b adds simply aren't there.

## 9. Tests

**`tests/engine.test.mjs`**, *Fights (188–190)*, synthetic names only:

- `newTable()` has `fights: []`; a 0.4 table migrates to 0.5 with `fights:
  []` and its cast, notes and interactions deep-equal.
- `addFight`: one at a time (the refusal), then after `endFight` a second.
- `addFighter` PC (blank name refused), cast (a second refused), and
  `fighterFromEntry` twice: two rows, names *X* and *X 2*, **blocks not the
  same object and not the pack's** (mutate one, the other and the pack
  unchanged).
- `fightersFromGroup`: member × count rows; a group whose members are all
  missing refused.
- `fightView` order: results, blanks after, `last` after everything, ties on
  both rows and not on a `last` one; HP for each kind, a cast row through a
  removed member (`linkName`'s stored name, `hp` null), a blank BOD,
  `left` floored at 0, `down`.
- `fighterDamage`: negative heals, floored at 0; a non-integer refused.
- `fighterAddCondition`: the no-stacking refusal word for word as
  `addCondition`'s; a location Condition needs a body part; `rounds` 0 or
  `-1` or `"x"` stored as null.
- `startFight`, `nextTurn` (skips `out`, `reset: true` after the last),
  `setTurn` (refuses an out row), `removeFighter` of the active row moves
  the turn.
- `resolveFightReset`: Bleeding ticks 1; Burning without a number refused
  naming the row; with 0, ticks 0; `expiring` lists `rounds === 1`;
  `recovery` lists the rest; `dying` names `resetCheck`. It changes nothing
  (the table deep-equals before and after).
- `applyFightReset`: damage added, rounds down, null untouched, an expiring
  Condition removed, one in `keep` kept at 1, round +1, turn the first row
  not out.
- Every writer refuses on an ended fight and leaves the table deep-equal.
- `castFromEntry` unchanged by 190 (its existing tests still pass).

**`tests/hostile.test.mjs`**, *a hostile fight*: a payload in every string
(name, row name, source, note, a link's name); rows of junk; `__proto__`
and `constructor` keys in a fight, a row, a Condition; numbers as strings,
objects, `1e400`, negatives (damage `-5` → 0, rounds `-1` → null); a
Condition id the data doesn't have; a `turn` naming another fight's row;
three fights not ended. It opens, renders as text (smoke), and the numbers
come out numbers or null.

**`tests/smoke.test.mjs`**, switched on (`?gm=on` as S9a's tests do):

- The Fight tab: New fight; add a PC and a cast member; enter results; Start;
  Next to the end; Reset with a Bleeding and a Burning row; Finish the
  round; End the fight; it's under Past fights.
- The entry page: *Add to cast* and, with a fight open, *Add to fight*;
  without one, no *Add to fight*.
- Switched off: no Fight tab (and Home unchanged, as before).

**`tests/engine.test.mjs`**'s `TIPS` guard (*gm.js may add a tip kind to
shared.js's TIPS, never replace one*) already reads every `TIPS.x =` in
`gm.js`, so `TIPS.condition` is checked with no change: confirm it appears
in `added`, and that `shared.js` has no `condition` kind of its own.

**Mutation-test** (record each in the PR, and what failed). Check each for a
second path that covers the same line before naming it (README pre-flight):

1. **Entry rows share the block** (drop the copy in `fighterFromEntry`) →
   the *blocks not the same object* test.
2. **Ties not flagged** → the order test.
3. **A Condition at `rounds === 1` removed without being listed** (skip
   `expiring`) → the resolve test.
4. **Durations not counted down** → the apply test.
5. **A source tick defaulting to 0 instead of refusing** → the Burning
   refusal test.
6. **`hp` kept on a cast row by the gate** → the hostile test.
7. **A writer that changes an ended fight** (drop one `ended` refusal) →
   the ended-fight test.
8. **Three open fights left open by the gate** → the hostile test.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and
after each step.

1. Confirm 188–190 free on `origin/main`; search the ledger again for §0's
   names.
2. **The gate:** `TABLE_SCHEMA_VERSION` 0.5, `newTable`, the `migrateTable`
   step and coercion, `FIGHT_ID_RE` and the row id rule. Hostile tests.
3. **The writers and `fightView`**, with their engine tests.
4. **Reset:** `resolveFightReset`, `applyFightReset`, their tests.
5. **The Fight tab**, setting up and running, then Reset, then ended and
   *Past fights*. `TIPS.condition`.
6. **Use's verbs** (190): the entry page, the group page, the member's page.
   Grep every *Use* in GM copy and tests, and change only the button's.
7. **In the browser** (`shadows-dev-preview`, `?gm=on`, the real Codex pack
   imported): a fight with two PCs, one cast member and **three groups**;
   read every row's name, HP and Awareness against the book (S9c's lesson).
   Order with a tie; three rounds; Bleeding, Burning (enter 3), a Condition
   with 2 rounds running out (End one, Keep one), Dying's check; Take to
   Down; Out; End the fight. Then **at 768 × 1024**: the active row and
   **Next** on screen without scrolling. Then at 390px: no sideways
   overflow (`scrollWidth` against `clientWidth`; no element in `main` past
   the right edge).
8. The mutations (§9).
9. Ledger, INDEX, plan, STATE, docs, close-out (§12).

## 11. Stop and ask

- 188, 189 or 190 are taken.
- Reusing `resolveReset`'s rule would need a change to `resolveReset` or the
  data (the fight reads; it never changes the sheet's half).
- A Condition's text would need a third-person rewrite to read right on a
  GM's row (beyond `whileDying.resetText`, which §0 already routes around).
- Anything needs a rules answer: a duration, a tie-break, damage while
  Dying (F24).
- The tablet check fails and the fix is a layout change outside the Fight
  tab.
- A decision goes over 350 words.
- A test outside the ones named fails and the fix isn't obviously yours.

## 12. Close-out

*Rule or shape* tier, switched off:

- **SCHEMA:** 188, 189, 190; 182 marked *superseded in part by 190*; §3's
  table block gains `fights` and the row (the shape in §7, trimmed).
- **INDEX:** three lines under **GM mode**; 182's line marked.
- **STATE:** §1's GM clause gains the fight (188–190); §5: S10a built,
  switched off; next is S10b (or what Scott's use of 0.37.0 says).
- **The plan:** §6 *S10* split into S10a (built) and S10b, with S10b's list
  from this order's *Why S10a*; §4h unchanged.
- **`changelog-pending.md`:** ✎ *The fight. Run a fight from the table: who
  goes when, everyone's Conditions with where they came from and when they
  run out, and a Reset that lists what ticks, what ends and what needs a
  save.*
- **Log** entry; **shipped** row *(switched off)*; README's table: S10a's row.
- **PR** titled `feat(gm): the fight, its round and its Conditions,
  switched off (W29 S10a, Decisions 188–190)`. Body: what changed; the
  mutations; the browser check (including the tablet); **Where the order
  didn't fit**.

## 13. Review checklist

- [ ] In the browser with the real pack: three groups unpacked, every row's
      name, HP and Awareness against the book; a tie; three rounds of Reset
      with every kind of line; Keep and End; Down; Out; End; Past fights.
- [ ] At 768 × 1024: the active row and **Next** visible without scrolling
      through a whole round. At 390px: no sideways overflow.
- [ ] Every focus in §8's table, pressed, not assumed.
- [ ] Two copies of one entry: damage one, the other unchanged; the pack's
      entry unchanged; the cast unchanged.
- [ ] Remove a cast member mid-fight: the row keeps its name, HP blank, no
      error.
- [ ] Export and re-import mid-round (at Reset too): the same fight, the
      same turn.
- [ ] A 0.4 table opens; the hostile table opens; nothing renders as markup.
- [ ] No *Use* label left on a button; every other *Use* (copy, tests) still
      reads right.
- [ ] Nothing in the sheet's Conditions or Turn Reset changed (`git diff`
      on those functions is empty).
- [ ] Two mutations re-run locally.
- [ ] No version bump but the table schema; `changelog-pending.md` has the
      line.
