# Work order S10a — The encounter: who's in it, whose turn, and what's still on them

**Plan:** [`../gm-mode.md`](../gm-mode.md) §1a, §4h and §6 *S10*; GQ15, GQ16,
GQ18, GQ19, GQ23 (new).
**Status:** drafted 2026-10-06 by Claude (Opus), after #123 (S9c) merged
with its fix round (README step 7). **§4 answered by Ken, 2026-10-07**; SQ2,
SQ8 and SQ10 changed by his answers (an encounter, not a fight; HP, Health
Levels and Pain shown together), written in here on the orchestrator's
recommendation. **Waits on Ken's OK of those three before it's built.**
**Branch:** from `main` at or after `365b26b` (v0.37.0), PR to `main`,
switched off (Decision 173).
**Runs alone.** It touches `engine.js`'s Tables section, `gm.js`, the CSS,
the ledger, the table schema and STATE.

**An encounter, not a fight** (SQ2, SQ8, Ken). The plan calls S10 *the
encounter tracker* and then talks about fights. The book settles which word
to build on: the GM Workshop's *Hybrid Encounters* says the three types,
social, environmental and combat, "aren't separate modes — they're a
spectrum", and a social encounter is "turn-based, time-bound, and
consequential" like any other. `053` opens Order of Engagement with "as with
other encounter types". So the record is an **encounter**, with no type: a
negotiation that turns into a firefight is the same record, the same order
and the same Conditions (Frightened works at a table too). The Encounter
Design worksheet, later, fills in the prep half of the same record, so
nothing gets renamed when it lands.

**Why S10a and not S10.** The plan's S10 is an encounter record, participants,
Order of Engagement, the round, Reset, Conditions with durations, NPC damage
through the engine's pipeline with armor, traits as reminders, ending an
encounter with Keep and Promote, the Encounter Design worksheet, and Use's
second verb. That's at least two sessions, and one half rests on answers we
don't have yet: NPC armor is text (175), and how it becomes PROT and RES is
GQ18, Deighton's. Scott's own priority is the other half: *Conditions are
what I lose*. So (SQ1):

- **S10a (this order):** the encounter record; rows from the cast, the Codex
  (one row per copy), a group unpacked, and PCs by typed name; Order of
  Engagement; the turn and the round; **Conditions with a source and a
  duration on every row**; **Reset's checklist**; damage as HP straight onto
  a row, shown as HP left, damage taken, Health Levels and Pain Level;
  ending an encounter; and Use's two verbs.
- **S10b (next):** a hit through the engine's pipeline (armor, Shock,
  Massive Damage) with an NPC adapter and armor numbers (GQ18), At Zero and
  Dying for NPCs, traits as reminders with their triggers, Keep and Promote
  at an encounter's end, a cast member's history line.
- **Later:** the Encounter Design worksheet (the prep half, §4h), an
  encounter's clocks (environmental encounters run on one; S7 builds
  clocks), and Surprise, Ambush and Delay (SQ9).

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
  (§10 step 7) reads every row of a real three-group encounter against the book.

**Pre-flight** (README, *The pre-flight*), against `main` at `4aa2327`:

- **The sheet already has Turn Reset** (Decision 100, P8): `resolveReset(ch,
  input)` and `applyReset(ch, input, choices)`, pure preview and one writer.
  It reads each Condition's `ongoing` from the data: Bleeding `{ hp: 1 }`,
  Burning and Shocked `{ source: true }` (an entered number, *Put 0 if it's
  out*). It lists every Condition's `recovery` as text and runs no check.
  While Dying it asks `damageRules.whileDying.resetCheck` (*WILL Essence
  Check TN 8 TH 2*). The encounter's Reset is that, per row. **No rule is
  invented here**: every tick and every line of text comes from the data.
- **Both readers take a character** (`ch.trackers.conditions`, `hlState(ch)`),
  so the encounter can't call them. It reuses their pure parts: `conditionById`,
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
  Dying has a counter (`Death Marks`, max 3). The encounter's Condition entry
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
- **Health Levels and Pain** (SQ10). `hlState(ch)` empties a level per
  `hpPer` of damage (`floor(damage / hpPer)`, capped at the levels), and
  `painState(ch)` takes the band from `resources.healthLevels.painLevels`
  (the highest whose `hlLostThreshold` the levels lost reach), adds each
  active Condition's `painLevels` (Agonized), and clamps to the table. Both
  read a character. The encounter computes the same two numbers from a row
  with a helper of its own (§7), and a **parity test** holds it to
  `painState` for every level count and with Agonized on and off.
- **Do NPCs take Pain?** The book never says outright. The Codex prints
  Health Levels on every entry, and its traits assume pain works on NPCs as
  it does on the crew (*Scar Tissue*: pain doesn't slow the Survivor "the
  way they slow others"). The row shows Pain by the players' rule and
  applies no penalty; the GM reads it. Sent to Scott as **GQ23**, default
  *yes, as players do*. Not an F-flag: no player rule changes.
- **`castFromEntry(t, pack, id)`** copies an entry's block with
  `JSON.parse(JSON.stringify(…))` and stamps `from` (182). An entry row does
  the same, so two copies never share a block.
- **`packGroups`** returns `{ pack, group, members: [{ entry, count }] }`,
  members resolved and missing ones dropped. Unpacking reads it.
- **Links:** `_castLinks` keeps a `{ kind: "cast", id, name? }` link that
  points at nobody, read by `linkName` (178). A cast row is that link.
- **`TABLE_SECTIONS`** in `gm.js` is `cast`, `threats`, `notes`; the tab
  binder clears each tab's open page on switch (`S.castOpen`,
  `S.threatOpen`…). A `encounter` section joins it.
- **`TIPS`** has no Condition kind; `gm.js` adds `TIPS.packrec` itself. A
  `condition` kind joins it the same way. S9a's `TIPS` guard covers every
  `data-tip` kind.
- **Use** is `data-tuse` on the entry page (`gm.js` ~988), calling
  `castFromEntry`. Its label and every *Use* in GM copy and tests are found
  by grep (`>Use<`, `"Use"`, `Use copy`).
- **`migrateTable()`**'s steps end at 0.4 (182). This is 0.5.
- **The ledger** (Decision 130), searched by name: *fight*, *encounter*,
  *tracker*, *Pain*, *Health Levels*, *Reset*, *Turn Reset*, *round*, *Order of Engagement*, *Combat
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

A GM runs an encounter from the table, social, environmental, combat or all
three in turn: who's in it, whose turn it is, and **every Condition on
everyone, with where it came from and when it runs out**. At each Reset the
app lists what ticks, what runs out and what's asking for a save, row by
row, so nothing ends because the GM forgot it.

**Done when:**

- Switched off: nothing changes anywhere.
- Switched on, the table has an **Encounters** tab (SQ8) between Threats and
  Notes. It lists the encounter that's running (at most one), the planned
  ones (any number), and *Past encounters*.
- **Planning:** *New encounter* makes one, planned (name optional). Opening
  it makes it the one the Threats and Cast pages add to. Rows come from:
  - the cast (a picker with search): a **cast** row, linked;
  - an entry's page: **Add to <the encounter's name>** adds one copy,
    numbered when it's the second (*Street Tough 2*);
  - a group's page: the same button adds every member × its count;
  - a typed name: a **PC** row.
- Each row: its name, its Combat Sense result, its Awareness, its
  Conditions, and its Health: **HP left of its total, damage taken, Health
  Levels left of its total, and its Pain Level** (SQ10), each shown when the
  row has what it needs (below).
- **Order of Engagement:** rows sort by result, highest first, blanks last
  in the order added. Two rows with one result both say *Tied: reroll*.
  *Goes last* puts a row after everyone (Combat Paralysis).
- **The round:** *Start* makes it round 1 with the first row active, and
  refuses while another encounter is running. *Next* moves on, skipping
  rows marked *Out*. After the last row comes **Reset**.
- **Conditions:** a row's *Add a Condition* picks from the game's list, a
  body part when it needs one, a source (*Corner Shot's burst*), and rounds
  (blank: *until it's dealt with*). Each shows its rounds left and its rule a
  tap away. The no-stacking rule is the sheet's.
- **Reset** lists, row by row: Bleeding's 1 HP; Burning's and Shocked's
  damage to enter; every Condition whose rounds run out now, each with *End*
  already pressed and *Keep* a tap away for when the story says it lasts
  (SQ6); every other Condition's recovery, as the save to call; and Dying's
  check. *Finish the round* applies the ticks, counts every duration down,
  ends what was left on *End*, and starts the next round at the top.
- **Damage:** a row takes HP straight off (*Take* and a number), and *Heal*
  puts it back. HP left never goes below 0, and at 0 the row reads *Down*.
  Health Levels and Pain follow from the damage; no penalty is applied.
- **Ending:** *End the encounter* keeps it, read-only, under *Past
  encounters*.
- **Use's verbs:** the entry page has **Add to cast** (was *Use*) and **Add
  to <encounter>**; a group's page and a cast member's page, **Add to
  <encounter>**. That button shows only while an encounter is open on the
  Encounters tab, and names it.
- Export, import, reload, Remove keep every field. A 0.4 table opens as 0.5
  with no encounters and everything else untouched.
- A hostile table opens, renders as text, and its numbers come out numbers
  or blank (§9).
- `npm run verify`, `npm run phone-check` and `npm run release:check` pass;
  the Encounters tab checked by hand at 390px, 768px (a tablet, §1a) and
  1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (the table's shape, an encounter's rules in the
  engine, a label someone could choose otherwise).
- **App:** no bump (switched off, 173). One line to `changelog-pending.md`.
- **Game data, character schema, pack schema:** unchanged.
- **Table schema:** **0.4 → 0.5**, with `migrateTable()`'s step.
- **Reserved:** Decisions **188, 189, 190**; **GQ23** in the plan's §9 (do
  NPCs take Pain Levels?). No F-flag: nothing here answers a player's rules
  question (F24 stays open, and the row shows the check's name only).

## 3. The decisions, drafted

Paste after 187, under INDEX §3's **GM mode** heading, filling **Built**.
**Count each with `wc -w`**; the cap is 350.

```
188. **A table keeps its encounters, of no fixed type: rows from the cast, the Codex and typed names, each with its own damage and Conditions, and a PC's row is the GM's scratch copy.**
     *2026-10-0X · Ken + Claude · Touches: encounters, encounter row, table schema 0.5, migrateTable, cast link, block copy, PC row, scratch HP, Conditions on a row, source, rounds, Encounters tab, GQ19, Decision 178, Decision 182*
     - **Decided:** a table has `encounters`, each with a name, a status (planned, running, ended), a round, whose turn it is, and rows; any number planned, one running, ended ones kept read-only. An encounter has no type. A row is a **cast** row (a link to the member, read live), an **entry** row (its own copy of the entry's block and a `from`), or a **PC** row (a typed name, with the GM's own HP, Health Levels and Awareness). Every row stores damage taken and its Conditions, each with a source and rounds left.
     - **Why:** Scott tracks every Condition at the table and loses them (§1a). The book's encounter types are "a spectrum", so a negotiation that turns violent stays one record. At an in-person table the GM keeps a copy of the PCs' numbers anyway (GQ19); it is never written back.
     - **Rejected:**
       - A fight record, or a type field: the book says the types blend, and the worksheet would need a rename.
       - Entry rows linked to the pack: a pack can be replaced (181), and two copies would share a block.
       - Cast rows copied: they'd act from a stale block.
       - PCs only once seats exist (S3b): Scott needs this first.
       - Several running: two encounters in one room are one encounter.
     - **Replaces:** nothing.
     - **Revisit if:** seats arrive (S3b: a PC row is claimed by a seat), the Encounter Design worksheet needs a type, or live sync makes the scratch copy unnecessary (§8).
     - **Built:** table schema 0.5; PR #__; log 2026-10-0X.

189. **An encounter's round is the book's: Combat Sense highest first, ties shown and never broken, and a Reset that lists, row by row, what ticks, what runs out and what asks for a save.**
     *2026-10-0X · Ken + Claude · Touches: Order of Engagement, Combat Sense, ties, Goes last, Out, turn, round, Next, Reset, Turn Reset, resolveReset, ongoing, recovery, whileDying.resetCheck, rounds, End, Keep, Take, Heal, Down, Health Levels, Pain Level, painState, GQ23, Decision 95, Decision 96, Decision 100, F24*
     - **Decided:** the GM enters each row's Combat Sense result; rows sort highest first, a tie is flagged on both rows for a reroll, and *Goes last* follows everyone. Reset, after the last row, applies the data's `ongoing` ticks (an entered number for a source), counts GM-entered durations down, and lists each Condition that runs out with *End* pressed and *Keep* a tap away, every other Condition's recovery as text, and Dying's check by name. Damage is HP straight onto a row (no armor, no Shock); the row shows HP left, damage taken, Health Levels and Pain by the players' rule, and applies no penalty.
     - **Why:** `053` says what a round is, for every encounter type; the sheet's Turn Reset (100) already reads the data this way. A duration is the GM's: the data gives recovery, not rounds.
     - **Rejected:**
       - Rolled initiative: the GM and players roll at the table (GQ2).
       - Ties broken by the app: `053` says reroll.
       - Durations from the data: there are none; a guess answers a rules question in code.
       - A Condition that runs out ending unseen: nothing ends silently.
       - HP alone: the GM needs the Pain Level to describe the hit (Ken, SQ10).
     - **Replaces:** nothing. Turn Reset (100) and Pain (96) are unchanged; this applies them per row.
     - **Revisit if:** the app rolls checks, S10b's pipeline makes a tick a hit, GQ23 says NPCs don't take Pain, or F24 is answered.
     - **Built:** as 188.

190. **Use has two verbs: Add to cast, and Add to the encounter open on the Encounters tab, on an entry, a group and a cast member.**
     *2026-10-0X · Ken + Claude · Touches: Use, data-tuse, Add to cast, Add to encounter, entry page, group page, cast member page, castFromEntry, Decision 182*
     - **Decided:** the entry page's **Use** becomes **Add to cast**, which does what Use did (182: the copy opens, its name selected). Beside it, and on a group's page and a cast member's page, **Add to <name>** adds to the encounter open on the Encounters tab, planned or running, and shows only while one is. Each press adds one row (a group, all its members), says so, and stays on the page.
     - **Why:** one word leading two places is a word the GM has to stop and read (S9b's SQ7). Naming the encounter says where the row goes when several are planned. Staying on the page lets a GM add three Street Toughs in three taps.
     - **Rejected:**
       - *Use* opening a choice: two taps for the commonest act.
       - Adding only from the Encounters tab: a GM reading an entry is already where they decide to field it.
       - Adding to the newest planned encounter: invisible when there are two.
     - **Replaces:** Decision 182 in part: its button's label, *Use*.
     - **Revisit if:** a third place to copy an entry appears (a session's prep).
     - **Built:** as 188.
```

**Supersession marks:** 182 *in part* (its **Use** label) → **superseded in
part by 190**, in the ledger and its INDEX line. If the ledger search at build
time finds anything else either overrides, stop and ask.

## 4. Questions for Ken

Answered by Ken, 2026-10-07. SQ2, SQ8 and SQ10 changed the order; each says
how.

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **Split S10** into S10a (the record, the round, Conditions, Reset, HP straight on) and S10b (the hit pipeline and armor numbers, At Zero and Dying for NPCs, traits as reminders, Keep and Promote). | **Yes** | **Yes** |
| SQ2 | **One open fight at a time**; ended ones kept read-only, each deletable. | **Yes** | **Changed:** Ken asked for an encounter that can evolve, social or environmental into combat. The record is an **encounter with no type** (the book: "a spectrum"), **any number planned, one running**, ended ones kept read-only (188) |
| SQ3 | **Combat Sense results entered, not rolled.** | **Yes** | **Yes**: the app never rolls for the players or the GM |
| SQ4 | **A cast row is linked; an entry row is a copy**, numbered *2*, *3*… | **Yes** | **Yes** |
| SQ5 | **Damage is HP straight onto a row**: *Take* and *Heal*, no armor, no Shock. S10b runs it through the pipeline. | **Yes** | **Yes** (Pain is now shown: SQ10) |
| SQ6 | **A Condition whose entered rounds run out at Reset** is listed with *End* already pressed, and the GM presses *Keep* when the story says it lasts. | **End pressed** | **Yes**, as Ken read it |
| SQ7 | **Use's label:** *Add to cast* and *Add to fight*. | **Yes** | **Yes**, and the second reads **Add to <the encounter's name>** (SQ2, SQ8) |
| SQ8 | **The tab's name:** *Fight*. | **Fight** | **Changed:** **Encounters**, so the Encounter Design worksheet lands in the same place with no rename (Ken) |
| SQ9 | **Not in S10a:** Surprise and Ambush, Delay, the Encounter Design worksheet. | **Yes** | **Yes**, a later session |
| SQ10 | **A PC row's HP is optional**; blank, the row shows damage taken instead. | **Yes** | **Changed:** show both, and Health Levels and Pain Level with them (Ken). A row shows each figure it has the inputs for (§7) |

## 5. Read first

- `CLAUDE.md` whole: constraints 7, 9 and 10; *Decisions*; *Flags*.
- `docs/STATE.md` whole.
- The plan: §1a (what Scott told us), §4h (encounters), §6 *S10*, §9 GQ15,
  GQ16, GQ18, GQ19.
- `docs/SCHEMA.md` §4: Decisions **95**, **96**, **100** (Turn Reset), **174**,
  **175**, **178**, **182**, **188**'s neighbours; §5's **F22** and **F24**.
- `private/crb/200_GM_Workshop.md`: *Social Encounters*, *Environmental
  Encounters*, *Hybrid Encounters* (why there's no type).
- `private/crb/053_Combat_Encounters.md`: *Engagement*, *Reset*, *Aftermath*.
  `054_Conditions_and_Recovery.md`: the table and Dying.
- **The code:** `engine.js`'s `hlState`, `painState`, `conditionKey`, `conditionById`,
  `addCondition`, `setConditionMarks`, `resolveReset`, `applyReset`, `npc`,
  `_block`, `_castLinks`, `linkName`, `castFromEntry`, `packGroups`,
  `migrateTable`; `gm.js`'s `TABLE_SECTIONS`, the tab binder, the entry page
  (`data-tuse`), the group page, `castPageHtml`, `TIPS.packrec`; the sheet's
  Conditions picker and its Turn Reset card in `sheet.js` (what a GM's
  should feel like, not code to share).

## 6. Out of scope

- A hit through armor; Shock; Massive Damage; any Pain penalty applied to a
  roll (the row shows the Pain Level; the GM applies it); At Zero; Dying's
  marks applied for an NPC by the app (the GM sets marks by hand); armor
  numbers (S10b, GQ18).
- A type on an encounter (social, environmental, combat), and an
  encounter's clocks (S7).
- Traits as reminders or triggers; Keep and Promote; a history line (S10b).
- Surprise, Ambush, Delay; the Encounter Design worksheet's prep fields (SQ9).
- Rolling anything.
- Any change to the sheet's Conditions, Turn Reset or their engine readers.
  The encounter reuses their pure helpers and changes none of them.
- Any data change, any pack change, any Codex word in `src/` or `tests/`.

## 7. The shapes

**The table, schema 0.5:**

```js
t.encounters = [{
  id: "EN-XXXXXXXX",                // ENCOUNTER_ID_RE = /^EN-[0-9A-HJKMNP-TV-Z]{8}$/
  name: "",                         // the GM's; blank reads "Encounter" plus its date
  status: "planned",                // "planned" | "running" | "ended"; one running at most
  round: 0,                         // 0 planned; 1… running; kept when ended
  turn: null,                       // a row's id, or null (planned, ended, or at Reset)
  rows: [Row],                      // in the order added; the order shown is derived
  created, updated                  // ISO, as a note's
}]

Row = {
  id: "R-XXXXXXXX",                 // unique within its encounter
  kind: "pc",                       // "pc" | "cast" | "entry"
  name: "",                         // shown; a cast row's is the member's name when added
  cast: null,                       // kind "cast": { kind: "cast", id, name } (178's link)
  from: null,                       // kind "entry": { kind: "entry", pack, id, name } (182's)
  block: null,                      // kind "entry": its own copy (175's block); else null
  order: null,                      // the Combat Sense result: whole number or null
  last: false,                      // Goes last
  out: false,                       // out of the encounter: skipped by Next, kept on the list
  damage: 0,                        // HP taken: whole number ≥ 0
  hp: null,                         // kind "pc" only: the GM's HP total, or null
  levels: null,                     // kind "pc" only: the GM's Health Levels total, or null
  awareness: null,                  // kind "pc" only: whole number or null
  conditions: [{                    // the character's entry shape, plus source and rounds
    id, location?, marks?, note?,   // as addCondition makes them
    source: "",                     // the GM's text
    rounds: null                    // whole number ≥ 1, or null: until it's dealt with
  }]
}
```

**The gate** (`migrateTable`, step *Schema 0.5 (Decision 188): a table gets
encounters*): before 0.5, `encounters` is `[]`. Then every encounter and row is coerced
as a note is:

- An encounter that isn't an object is dropped. `id` is kept when it matches and
  is unused, else a new one. `name` a string. `status` one of the three,
  else `"planned"`. `round` a whole number ≥ 0, else 0. `rows` coerced (below).
  `turn` kept only if it names a row of this encounter and `status` is
  `"running"`, else null.
- **More than one encounter running** (a hand-edited file): every one but the
  newest by `updated` becomes `"ended"`. Nothing is dropped. Any number
  planned is fine.
- A row that isn't an object is dropped. `kind` one of the three, else
  `"pc"`. `cast` through `_castLinks`' rule for one link, else null; `from`
  through `_castFrom`, else null; `block` through `_block`, else null. A
  `cast` field on a non-cast row, or `from`/`block` on a non-entry row, is
  set null (not dropped silently: it's a field that can't mean anything
  there). `order`, `hp`, `levels`, `awareness` through `_int`, else null; `hp`,
  `levels` and `awareness` null unless `kind` is `"pc"`, and `hp` and
  `levels` null below 1. `damage` through `_int`,
  floored at 0, else 0. `last`, `out` booleans (`=== true`).
- A row's `conditions`: objects whose `id` is a Condition in the data. A
  location Condition with no valid location is dropped. `marks` kept only
  when the def has a counter, clamped to `0…max`. `note` and `source`
  strings. `rounds` a whole number ≥ 1, else null. Two entries with one
  `conditionKey` keep the first.

**Engine** (Tables section, *The encounter (Decisions 188–190)*). Every writer
takes the table first, stamps it (`_tableStamp`), and returns `{ ok: true,
… }` or `{ ok: false, why }` without changing anything. Every reader is
total.

| Function | Does | Refuses |
|---|---|---|
| `addEncounter(t, { name })` | an encounter, planned, at the front; `{ ok, id }` | — (any number planned) |
| `editEncounter(t, id, { name })` | renames | no such encounter |
| `removeEncounter(t, id)` | deletes it | no such encounter |
| `runningEncounter(t)` | reader: the running encounter, or null | — |
| `addParticipant(t, encId, { kind: "pc", name })` | a PC row | no such encounter; ended; a blank name |
| `addParticipant(t, encId, { kind: "cast", id })` | a cast row, linked, named as the member | no such member; ended; **the member already has a row in this encounter** (*Already in.*) |
| `participantFromEntry(t, encId, pack, entryId)` | an entry row: a copy of the block, `from` stamped, named with *2*, *3*… after the first of that name in the encounter | no such entry; ended |
| `participantsFromGroup(t, encId, pack, groupId)` | one entry row per member × count, through `participantFromEntry`; `{ ok, ids }` | no such group; ended; a group with no resolvable member |
| `editParticipant(t, encId, rowId, f)` | sets `name`, `order`, `last`, `out`, `hp`, `levels`, `awareness` (the last three PC rows only, else ignored) | no such row; ended |
| `removeParticipant(t, encId, rowId)` | removes; if it was `turn`, the turn moves to the next row | no such row; ended |
| `participantDamage(t, encId, rowId, n)` | `damage += n` (n may be negative: Heal), floored at 0 | n not a whole number; ended |
| `participantAddCondition(t, encId, rowId, entry)` | as `addCondition`, plus `source` and `rounds` | as `addCondition` (same words); ended |
| `participantRemoveCondition(t, encId, rowId, index)`, `participantConditionMarks(…, index, marks)` | as the character's | as the character's; ended |
| `startEncounter(t, encId)` | `running`, round 1, `turn` the first row in order not out | not planned; another running (*<name> is still running. End it first.*); no row that isn't out (*Add someone to the encounter first.*) |
| `nextTurn(t, encId)` | `turn` to the next row in order not out; after the last, `turn` null and `{ ok, reset: true }` | not running; already at Reset |
| `setTurn(t, encId, rowId)` | makes a row active (Delay, by hand) | not running; out |
| `resolveEncounterReset(t, encId, input)` | **pure**: per row, `ticks` (as `resolveReset`, source numbers from `input.sources[rowId][index]`), `expiring` (conditions with `rounds === 1`), `recovery` (every other Condition's `recovery`), `dying` (`whileDying.resetCheck` when the row has Dying) | the same *Enter this round's Burning damage…* refusal as `resolveReset`, naming the row |
| `applyEncounterReset(t, encId, input, choices)` | re-resolves; adds ticks to `damage`; every `rounds` −1 (null stays null); an expiring Condition is removed unless `choices.keep` lists `[rowId, index]`, in which case `rounds` becomes 1; round +1; `turn` the first row not out | as resolve; not at Reset |
| `endEncounter(t, encId)` | `ended`, `turn` null (a planned one can be ended unrun) | already ended |
| `encounterView(t, encId, packs)` | **reader**: the rows in order (below) with each row's figures | — (null for no such encounter) |

**`encounterView`** returns `{ encounter, rows: [{ row, name, health, awareness, ties,
active, conditions }], atReset }`:

- **Order:** rows not `last` with an `order`, highest first; then rows not
  `last` without one, in the order added; then `last` rows by the same rule.
  Equal `order`s keep the order added. `ties` is true on every row (not
  `last`) whose `order` another such row shares.
- **`health`** (SQ10): `{ taken, total, left, down, levels, levelsLeft,
  pain }`, every figure null when its inputs aren't there, `taken` always
  the row's `damage`.
  - **Totals:** a PC row's `total` is `hp` and its `levels` is `levels`,
    with `hpPer = hp / levels` only when `levels` divides `hp` (else no
    levels figures). A cast row reads `npc(member.block).health` through the
    link (a link to nobody, or a blank BOD: no totals); an entry row,
    `npc(row.block).health`.
  - **`left`** `= max(0, total − damage)`; **`down`** is `left === 0`.
  - **`levelsLeft`** `= levels − min(levels, floor(damage / hpPer))`, as
    `hlState` empties them (no Massive levels in S10a).
  - **`pain`:** `{ level, label, fromConditions }` by `painState`'s rule:
    the band for the levels lost, plus each Condition on the row with
    `painLevels`, clamped to the table. With no levels figure, the band is
    unknown and `pain` is the Conditions' part alone if any, else null.
  - One helper, `_painFor(levelsLost, conditionPain)`, does the band and
    the clamp from the data; a parity test holds it to `painState`.
- **`awareness`:** a PC row's `awareness`; otherwise the block's skill row
  whose `skill` is `"awareness"`, its `total`, else null.
- **`name`:** a cast row reads `linkName` (178): the member's current name,
  or the stored one if they're gone.
- **`conditions`:** each with its `def`, `location` (resolved), `rounds`,
  `source`, `note`, `marks` and the def's counter.

**Where the record lives on every press:** *Take*, *Heal*, a Condition, a
mark, an order, *Out*, *Goes last*: the row. *Next*, *Start*, *Finish the
round*, *End the encounter*: the encounter. Nothing on an encounter ever writes to the
cast, a pack or a character (188).

**Use's verbs** (190): `castFromEntry` is unchanged. *Add to cast* calls it
and behaves exactly as *Use* did: the copy opens, its name selected, and
S9a's smoke tests for Decision 182 pass with only the label changed. *Add to encounter* calls `participantFromEntry` or `participantsFromGroup`
on the encounter the GM has open on the Encounters tab (a UI choice, passed in by id). A cast member's *Add to encounter* calls `addParticipant` with
`kind: "cast"`.

## 8. The UI

All in `gm.js` and the CSS. GM-facing tool voice; drafts marked ✎ for a voice
pass. **Built for a tablet at the table** (§1a): every control a tap, at
least the sheet's tap size; the active row and the round always visible
without scrolling at 768 × 1024.

**The Encounters tab, the list** (no encounter open): **New encounter** (a
name field beside it, optional); then the running one, if any, marked
*Round 3*; then the planned ones, newest first; then *Past encounters*,
one line each (name, date, *4 rounds*). Each opens it. With none at all, a
short line (✎ *Nothing on the books.*). Every encounter has **Delete**
(asks first) on its own page.

**An open encounter** keeps the GM's place: `S.encOpen` (UI state, not
stored, like `S.castOpen`), cleared when the table closes. **Back to
encounters** returns to the list. While one is open, the Threats and Cast
pages offer **Add to <its name>** (190).

**Planned** (status `planned`):

- The encounter's name (editable), **Start**, and **End** (an encounter
  can end unrun).
- **Add**: *From the cast* (a picker: search, a row per member with **Add**;
  members already in it say *Already in*), and a name field with **Add a
  PC**. A line pointing at the Threats tab for Codex entries and groups
  (✎ *From the Codex: open an entry or a group on Threats.*).
- The rows, in order (below), each editable.

**A row** (planned and running alike):

- **Name**, then a kind mark (*PC*, *Cast*, or the pack entry's ref), then
  **Combat Sense** (a number field) and *Tied: reroll* when `ties`.
- **Health** (SQ10), each figure only when `health` has it, on one line
  that wraps: ✎ *HP 18 / 30 · 12 taken · 3 of 6 Health Levels · Pain 1
  (Hurting)*; *Down* in place of HP at 0. With no totals: *12 taken*, and
  Pain only from a Condition. The Pain label is the data's, and its
  description is a tap away (`TIPS.stat`'s pattern; or a `condition`-style
  tip of its own if that's simpler: say which in the PR).
- **Take** and **Heal**, each opening a number field in place with **OK**.
- A PC row also has **HP**, **Health Levels** and **Awareness** as number
  fields (the player reads them off their sheet); an NPC row shows
  Awareness as text.
- **Conditions:** each a chip: name (and body part), *3 rounds* or nothing,
  source in small text, marks with − and + for a counter, the rule a tap
  away (`TIPS.condition`: title the name, text `effect`, more `recovery`),
  and **Remove**. **Add a Condition** opens a picker (the sheet's list, a
  body part when needed, *Source*, *Rounds*), refusals shown in the picker.
- **More** (a toggle or menu): *Goes last*, *Out*, *Remove*.
- A cast row's name opens the member's page; an entry row's ref opens the
  entry's page (`entryLink`), and both come back to the encounter
  (*Back to <its name>*).

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

**Ended** (from *Past encounters*): the rows read-only, *Round 4* as the
final round, and **Delete**.

**Use's verbs:** the entry page's buttons read **Add to cast** and, while an
encounter is open on the Encounters tab, **Add to <its name>**; the group
page and the cast member's page have the second. Each shows a notice
(✎ *Street Tough 2 is in Warehouse job.*, *Corner Crew: 4 added to
Warehouse job.*) and stays on the page.

**Where things land:**

| Press | The record | The view | Focus |
|---|---|---|---|
| *New encounter* | an encounter, planned | it opens, planned | its name field |
| An encounter on the list | — (`S.encOpen`) | it opens | its name field (planned) or **Next** (running) |
| **Back to encounters** | — | the list | that encounter's line |
| *Add* (cast picker) | a cast row | the picker stays open; that member says *Already in* | the next member's **Add** |
| *Add a PC* | a PC row | the row appears in order | the name field, empty |
| *Add to encounter* (entry, group, member) | entry or cast rows | the same page; a notice | stays on the button |
| A Combat Sense number | `order` | rows re-sort when the field loses focus, not while typing | the same row's field, wherever it moved |
| **Start** | running, round 1 | the active row marked | **Next** |
| **Start**, another running | — (refused) | the notice names it | stays on **Start** |
| **Next** | `turn` | the new active row scrolled into view | **Next** |
| **Next** after the last row | `turn` null | the Reset panel | the first required field, or **Finish the round** |
| **Finish the round** | the round's changes | the rows, round +1 | **Next** |
| *Take* / *Heal* + OK | `damage` | the row's HP | the row's **Take** |
| *Add a Condition* + Add | the row's Condition | the chip appears | the new chip's **Remove**'s neighbour, the rule tip button |
| A Condition's **Remove** | removed | the chip goes | the row's **Add a Condition** |
| *Out* | `out` | the row dims, stays in place | the same toggle |
| *Remove* (row) | the row goes | — | the next row's name, or **Add a PC** |
| **End the encounter** (asks first) | ended | the list; it heads *Past encounters* | **New encounter** |

**What a refused or empty value shows:** a number field that can't be a
whole number shows the stored value once it loses focus (S8a's rule). A
blank Combat Sense is *—*, sorted last. A blank PC name isn't added.

**Copy** (✎ throughout; tool voice). No flag id, no "S10b", no "coming soon"
(constraint 9): the things S10b adds simply aren't there.

## 9. Tests

**`tests/engine.test.mjs`**, *Encounters (188–190)*, synthetic names only:

- `newTable()` has `encounters: []`; a 0.4 table migrates to 0.5 with `encounters:
  []` and its cast, notes and interactions deep-equal.
- `addEncounter`: three planned at once. `startEncounter` on one, then on a
  second: refused, naming the first; after `endEncounter`, the second
  starts. A planned encounter ends unrun.
- `addParticipant` PC (blank name refused), cast (a second refused), and
  `participantFromEntry` twice: two rows, names *X* and *X 2*, **blocks not the
  same object and not the pack's** (mutate one, the other and the pack
  unchanged).
- `participantsFromGroup`: member × count rows; a group whose members are all
  missing refused.
- `encounterView` order: results, blanks after, `last` after everything, ties on
  both rows and not on a `last` one; `health` for each kind, a cast row
  through a removed member (`linkName`'s stored name, no totals), a blank
  BOD, `left` floored at 0, `down`; a PC row with `hp` only (HP figures, no
  levels), with `hp` and `levels` (all figures), with `levels` that don't
  divide `hp` (no levels figures), with neither (`taken` only).
- **Pain:** `_painFor` against `painState` for a synthetic character at
  every levels-lost count from 0 to its total, with Agonized and without:
  the same level every time (the parity test). On a row: levels lost from
  damage give the band; Agonized adds one; the clamp holds at the top.
- `participantDamage`: negative heals, floored at 0; a non-integer refused.
- `participantAddCondition`: the no-stacking refusal word for word as
  `addCondition`'s; a location Condition needs a body part; `rounds` 0 or
  `-1` or `"x"` stored as null.
- `startEncounter`, `nextTurn` (skips `out`, `reset: true` after the last),
  `setTurn` (refuses an out row), `removeParticipant` of the active row moves
  the turn.
- `resolveEncounterReset`: Bleeding ticks 1; Burning without a number refused
  naming the row; with 0, ticks 0; `expiring` lists `rounds === 1`;
  `recovery` lists the rest; `dying` names `resetCheck`. It changes nothing
  (the table deep-equals before and after).
- `applyEncounterReset`: damage added, rounds down, null untouched, an expiring
  Condition removed, one in `keep` kept at 1, round +1, turn the first row
  not out.
- Every writer refuses on an ended encounter and leaves the table deep-equal.
- `castFromEntry` unchanged by 190 (its existing tests still pass).

**`tests/hostile.test.mjs`**, *a hostile encounter*: a payload in every string
(name, row name, source, note, a link's name); rows of junk; `__proto__`
and `constructor` keys in an encounter, a row, a Condition; numbers as strings,
objects, `1e400`, negatives (damage `-5` → 0, rounds `-1` → null); a
Condition id the data doesn't have; a `turn` naming another encounter's row;
three encounters running; `hp` and `levels` on a cast row, and `0` or
`-3` on a PC's. It opens, renders as text (smoke), and the numbers
come out numbers or null.

**`tests/smoke.test.mjs`**, switched on (`?gm=on` as S9a's tests do):

- The Encounters tab: New encounter; add a PC (HP 30, Health Levels 6) and
  a cast member; enter results; Start; Take 12 on the PC: the row reads
  *HP 18 / 30 · 12 taken · 4 of 6 Health Levels* and the data's Pain for
  two levels lost; Next to the end; Reset with a Bleeding and a Burning row;
  Finish the round; End the encounter; it's under Past encounters.
- Two planned encounters: open the second, and the entry page's button
  names it; back on the list, open the first, and it names that one.
- The entry page: *Add to cast* and, with an encounter open, *Add to
  <name>*; with none open, no second button.
- Switched off: no Encounters tab (and Home unchanged, as before).

**`tests/engine.test.mjs`**'s `TIPS` guard (*gm.js may add a tip kind to
shared.js's TIPS, never replace one*) already reads every `TIPS.x =` in
`gm.js`, so `TIPS.condition` is checked with no change: confirm it appears
in `added`, and that `shared.js` has no `condition` kind of its own.

**Mutation-test** (record each in the PR, and what failed). Check each for a
second path that covers the same line before naming it (README pre-flight):

1. **Entry rows share the block** (drop the copy in `participantFromEntry`) →
   the *blocks not the same object* test.
2. **Ties not flagged** → the order test.
3. **A Condition at `rounds === 1` removed without being listed** (skip
   `expiring`) → the resolve test.
4. **Durations not counted down** → the apply test.
5. **A source tick defaulting to 0 instead of refusing** → the Burning
   refusal test.
6. **`hp` kept on a cast row by the gate** → the hostile test.
7. **A writer that changes an ended encounter** (drop one `ended` refusal) →
   the ended-encounter test.
8. **Three running encounters left running by the gate** → the hostile
   test.
9. **`_painFor` taking the first band instead of the highest reached** →
   the parity test.
10. **A second encounter allowed to start while one runs** → the
    `startEncounter` test.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and
after each step.

1. Confirm 188–190 free on `origin/main`; search the ledger again for §0's
   names.
2. **The gate:** `TABLE_SCHEMA_VERSION` 0.5, `newTable`, the `migrateTable`
   step and coercion, `ENCOUNTER_ID_RE` and the row id rule. Hostile tests.
3. **The writers and `encounterView`**, with their engine tests.
4. **Reset:** `resolveEncounterReset`, `applyEncounterReset`, their tests.
5. **The Encounters tab**: the list, planned and running, then Reset, then
   ended and *Past encounters*. `TIPS.condition`.
6. **Use's verbs** (190): the entry page, the group page, the member's page.
   Grep every *Use* in GM copy and tests, and change only the button's.
7. **In the browser** (`shadows-dev-preview`, `?gm=on`, the real Codex pack
   imported): an encounter with two PCs, one cast member and **three groups**;
   read every row's name, Health line and Awareness against the book
   (S9c's lesson). Start it while a second, planned encounter waits; try
   to start the second (refused); add to the planned one from Threats.
   Order with a tie; three rounds; Bleeding, Burning (enter 3), a Condition
   with 2 rounds running out (End one, Keep one), Dying's check; Take to
   Down; Out; End the encounter. Then **at 768 × 1024**: the active row and
   **Next** on screen without scrolling. Then at 390px: no sideways
   overflow (`scrollWidth` against `clientWidth`; no element in `main` past
   the right edge).
8. The mutations (§9).
9. Ledger, INDEX, plan, STATE, docs, close-out (§12).

## 11. Stop and ask

- 188, 189 or 190 are taken.
- Reusing `resolveReset`'s rule would need a change to `resolveReset` or the
  data (the encounter reads; it never changes the sheet's half).
- A Condition's text would need a third-person rewrite to read right on a
  GM's row (beyond `whileDying.resetText`, which §0 already routes around).
- Anything needs a rules answer: a duration, a tie-break, damage while
  Dying (F24), a Pain penalty applied for an NPC (GQ23).
- The tablet check fails and the fix is a layout change outside the Encounters
  tab.
- A decision goes over 350 words.
- A test outside the ones named fails and the fix isn't obviously yours.

## 12. Close-out

*Rule or shape* tier, switched off:

- **SCHEMA:** 188, 189, 190; 182 marked *superseded in part by 190*; §3's
  table block gains `encounters` and the row (the shape in §7, trimmed).
- **INDEX:** three lines under **GM mode**; 182's line marked.
- **STATE:** §1's GM clause gains the encounter (188–190); §5: S10a built,
  switched off; next is S10b (or what Scott's use of 0.37.0 says).
- **The plan:** §6 *S10* split into S10a (built) and S10b, with S10b's list
  from this order's *Why S10a*; §4h's first line says the record is an
  encounter of no type (188); §9 gains **GQ23** for Scott (*Do NPCs take
  Pain Levels as players do? The Codex prints their Health Levels, and
  traits like Scar Tissue assume pain slows them. Default: yes, shown on
  the row and applied by the GM*).
- **`changelog-pending.md`:** ✎ *Encounters. Plan them ahead and run them
  at the table, from a negotiation to a firefight: who goes when,
  everyone's Health and Pain, their Conditions with where they came from
  and when they run out, and a Reset that lists what ticks, what ends and
  what needs a check.*
- **Log** entry; **shipped** row *(switched off)*; README's table: S10a's row.
- **PR** titled `feat(gm): the encounter, its round and its Conditions,
  switched off (W29 S10a, Decisions 188–190)`. Body: what changed; the
  mutations; the browser check (including the tablet); **Where the order
  didn't fit**.

## 13. Review checklist

- [ ] In the browser with the real pack: three groups unpacked, every row's
      name, Health line and Awareness against the book; a tie; three rounds of Reset
      with every kind of line; Keep and End; Down; Out; End; Past encounters.
- [ ] At 768 × 1024: the active row and **Next** visible without scrolling
      through a whole round. At 390px: no sideways overflow.
- [ ] Every focus in §8's table, pressed, not assumed.
- [ ] Two copies of one entry: damage one, the other unchanged; the pack's
      entry unchanged; the cast unchanged.
- [ ] Remove a cast member mid-encounter: the row keeps its name, its Health
      line shows *taken* only, no error.
- [ ] A PC row with HP and Health Levels: Take through each Pain band, then
      Agonized: the Pain Level matches the sheet's for the same numbers.
- [ ] Two planned and one running: the Threats button names the one open;
      a second Start is refused by name.
- [ ] Export and re-import mid-round (at Reset too): the same encounter, the
      same turn.
- [ ] A 0.4 table opens; the hostile table opens; nothing renders as markup.
- [ ] No *Use* label left on a button; every other *Use* (copy, tests) still
      reads right.
- [ ] Nothing in the sheet's Conditions or Turn Reset changed (`git diff`
      on those functions is empty).
- [ ] Two mutations re-run locally.
- [ ] No version bump but the table schema; `changelog-pending.md` has the
      line.
