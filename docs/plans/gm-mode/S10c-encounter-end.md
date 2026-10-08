# Work order S10c — The encounter's end: who's kept, and what the cast remembers

**Plan:** [`../gm-mode.md`](../gm-mode.md) §4e (*Remember*), §4h (*Ending it*)
and §6 *S10*; Decisions 177, 178, 182, 188.
**Status:** **drafted 2026-10-07 by Claude (Opus)**, after #128 (S10b) merged
with its two fix rounds (README step 7). **§4 answered by Ken, 2026-10-07.**
**Branch:** from `main` at or after `08e652e`, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js` (the Tables section only), `gm.js`,
the CSS, the ledger, the table schema and STATE, and one file in `private/`.

**What S10c is.** S10a ran the encounter and S10b made a hit land. When the
GM presses **End**, nothing reaches the cast yet: a Codex copy that got away
is lost with the ended encounter, and the cast member the crew just fought
has no record of it. S10c is that moment. **End** opens a wrap-up of the
fight, row by row. The GM keeps the survivors worth keeping, writes the
fight onto each cast member's record, sets who died, and gets the
armor-wear reminder for the players. Then the encounter ends.

**Three things in the plan's S10c list change here** (§4 asks Ken to
confirm each):

- **The "history line" is an interaction, not a new field.** Decision 177
  turned a `history` list down as "a third place for the same sentence".
  A member's page already lists their interactions (179), and *Who knows
  what* reads them by crew name. A fight is something the crew did with
  the cast, so it gets an eighth kind, **fought** (177's *Revisit if*: "a
  GM needs a kind the seven lack"). SQ2.
- **Keep and Promote are one verb.** S8a defined Promote as turning "a
  *fought copy* into a cast member". That is what Keep does. Two buttons
  for one act would be the double word Decision 190 was written to avoid.
  SQ3.
- **The end-of-encounter wear roll is a reminder for the players, and
  NPC wear isn't carried.** 053's after-fight roll comes off a piece's
  Integrity. A PC's armor is on their sheet, which already has the roll
  (`armorWear`, *After the fight*). An NPC's wear lives on the encounter's
  row, and a cast member's armor is a text line with no wear to carry it.
  So the wrap-up names the die for the fight and lists who rolls. SQ4,
  along with whether wounds carry (SQ1).

**Carried over from S10b's review** (#128, two fix rounds; these were the
order's, or the orchestrator's):

- **A stored number about a matched thing stores what it was matched to.**
  S10b's order stored armor wear as bare numbers next to a name matched
  at read time, so an edited block moved the wear to another piece
  (`armorId` fixed it). Here, a kept row stores the id of the member it
  became (`kept`). A line stores the encounter it came from as text, not
  as a number something else re-reads.
- **Check a field name isn't taken before naming it.** S10b's
  `armor: encounterArmor(block)` would have overwritten `resolveHit`'s
  `armor`. Here, `endEncounter` already exists and returns `{ ok }`; its
  new argument is optional, so every call that passes none still works.
- **Every claim about the data is checked against the data.** S10b's order
  said Bleeding was pre-ticked; the data has no `always` for ballistic.
  Every data key this order names was opened (pre-flight).
- **A rules question goes to the CRB before it becomes a flag.** The
  review nearly opened F38 on scrap armor, which 053 answers in two
  places. This order's rules claims cite 053's lines.
- **Name the test that actually catches each mutation.** Two of S10b's
  mutations were caught by tests other than the ones the order named.
  §9 says *a test*, and the PR names which.
- **The Thrall's armor line** still reads "— see Entry 24 flag; civilian
  clothing" on a GM's screen. S10b carried it over to here (§10 step 7).

**Pre-flight** (README, *The pre-flight*), against `main` at `08e652e`:

- **`endEncounter(t, encId)`** (engine, Tables section) sets
  `status: "ended"` and `turn: null`, stamps, and returns `{ ok }`; it
  refuses an ended encounter through `_live`. The UI's `data-enc-end`
  calls it after one `askFirst` (*"It's kept, read-only, under Past
  encounters."*), and so does a **planned** encounter's End. An ended
  encounter renders read-only (`ended` hides `acts`).
- **No ledger entry says an encounter never writes to the cast.** S10b's
  order said Decision 188 does, but 188's text doesn't (searched:
  *writes to the cast*, *written back*, *write back*). The words are in
  S10a's order, *Where the record lives*. So S10c supersedes no part of
  188; it adds a writer that 188 never ruled out.
- **Interactions:** `addInteraction(t, f)` takes `{ kind, cast: [ids],
  crew: [names], text, date }`. It refuses when there's no kind and no
  text (*"Say what happened."*), unshifts the new line and calls
  `_killLinked`, which sets every linked member to `dead` on a `killed`
  line. `INTERACTION_KINDS` is a fixed list of seven in the engine
  (`_kind` reads anything else as null), and again in `gm.js:325` with
  its labels (*Told them* … *They owe*). Tests that list the seven:
  `engine.test.mjs:3205` (`KINDS`), `hostile.test.mjs:378` (a regex),
  `smoke.test.mjs:3806` (`.slice(0, 7)`, which an eighth kind at the
  end doesn't break).
- **`castFromEntry(t, pack, id)`** builds a member from a pack entry's
  text, names, tier and block, with `from: { kind: "entry", pack, id,
  name }` and `status: "alive"`. It needs the pack. An entry row carries
  its own block copy (`r.block`) and `r.from`, but none of the entry's
  text, so a row whose pack has been removed can still be kept, with only
  its name, its block and its `from`.
- **A cast member's statuses:** `CAST_STATUSES = ["alive","dead","missing",
  "gone"]`. `editCastMember(t, id, { status })` sets one. A cast has no
  undo, and Delete asks (176).
- **The wear dice:** `armorRules.integrityLossByDifficulty` is
  `{ easy: "1d4", medium: "1d6", hard: "1d8", legendary: "1d10" }`.
  `sheet.js`'s `wearPanelHtml` labels them `titleCase(key) (die)`, under
  *How hard was it*, and shows `armorRules.wearNote` (*"Anyone who took a
  hit rolls once for wear after the fight, whether the armor or your body
  took it. Your GM names the die."*: player voice, so not shown to the
  GM). 053, lines 642 and 859: "anyone hit at all rolls once for wear at
  the end of the encounter, 1d4 to 1d10, depending on difficulty."
- **A row's state at the end** reads off `encounterView`: `health`
  (`left`, `levels`, `levelsLeft`, `down`, `gone`) and `conditions` with
  their names. An NPC with no BOD has no totals. Dying is a Condition on
  the row.
- **The ledger**, searched by name: *Keep*, *Promote*, *history*,
  *interaction*, *kind*, *fought*, *status*, *dead*, *killed*, *cast*,
  *end*, *endEncounter*, *wear*, *Integrity*, *crew*. Hits:
  - **177** (interactions; `history` rejected; the seven kinds; *Revisit
    if* a GM needs another kind);
  - **178** (links; a deleted target's name is kept in the link);
  - **179** (a member's page lists their interactions; *Who knows what*);
  - **182** (Use copies an entry into the cast; `from`);
  - **188** (encounters; ended ones read-only);
  - **100** (the sheet's after-fight wear roll);
  - **176** (a cast has no undo).

  **177 is superseded in part by 193** (an eighth kind, written by an
  encounter's end). Nothing else is overridden. 182 stands: Keep is a
  second way into the cast, with the same `from`.
- **Decision 193 and GQ26** are free on `origin/main` and every open
  branch (checked 2026-10-07). Check again before pasting.

---

## 1. Goal

A GM ends a fight and the table remembers it. Pressing **End** on a
running encounter opens its wrap-up in place of the encounter's rows:
every NPC who was in it, how they ended (*2 of 8 Health Levels · Bleeding*),
and what to do with them. A cast member gets a line on their record
(*Fought them in The Lobby: 2 of 8 Health Levels left, Bleeding*) and a
status if it changed. A Codex copy worth keeping is **kept**, as a new
cast member with that line. The players are told which die to roll for
armor wear. **End the encounter** writes all of it at once, and the
encounter is read-only under *Past encounters*, as now.

**Done when:**

- Switched off: nothing changes anywhere.
- **End** on a running encounter opens the wrap-up. **End** on a planned
  encounter (never run) asks as it does now and opens no wrap-up.
- The wrap-up lists every **cast row**, with a line on by default (its
  text written for the GM, editable) and their status (the current one,
  changeable). Every **entry row** gets **Keep** (off by default) and a name
  (the row's) once it's on, with a line on by default when kept. Every **PC
  row** is listed by name under the wear reminder, when it took damage.
- **How hard was it** names the wear die for the fight from the data, and
  the reminder lists the PC rows that took a hit.
- **End the encounter** ends it, adds the kept members to the cast, adds
  each line as an interaction (kind **fought**, or **killed** when the GM
  set the member dead), with the crew's names, the day, and the encounter's
  title in its text, and sets each changed status. **Cancel** writes
  nothing and returns to the running encounter.
- A kept row in the ended encounter reads *Kept as <name>*, its name a
  tap to the member. The member's page lists the line, as every
  interaction is listed (179).
- *Add an interaction* offers **Fought them** as an eighth kind.
- Export, import, reload and a 0.6 table keep every field. A 0.6 table
  opens as 0.7 with no row kept.
- A hostile table opens, `kept` comes out a link or null, and nothing
  renders as markup.
- `npm run verify` and `npm run phone-check` pass. The wrap-up is checked
  by hand at 390px, 768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (an interaction kind, the table's shape, a
  writer to the cast).
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** **no bump**, no data change (the wear dice are already
  there).
- **Character schema, pack schema:** unchanged.
- **Table schema:** **0.6 → 0.7**, with `migrateTable()`'s step: each
  row gains `kept: null`; an interaction may carry the kind `fought`.
- **Reserved:** Decision **193**; **GQ26** (does a cast member carry their
  wounds into the next fight?) in the plan's §9, for Scott. No F-flag: no
  player rule changes.

## 3. The decision, drafted

Paste after 192, under INDEX §3's **GM mode** heading, filling **Built**.
Count it with `wc -w`; the cap is 350 (a supersession mark doesn't count).

```
193. **An encounter ends with a wrap-up: a cast member gets the fight as an interaction of a new kind, *fought*; a Codex copy worth keeping is kept into the cast; the players are told the wear die. Wounds and NPC wear don't carry.**
     *2026-10-0X · Ken + Claude · Touches: End, endEncounter, wrap-up, Keep, Promote, kept, interaction, fought, killed, cast status, crew, history, armor wear, table schema 0.7, GQ26, Decision 100, Decision 177, Decision 182, Decision 188*
     - **Decided:** End on a running encounter opens a wrap-up. Each cast row's fight is offered as an interaction, kind `fought` (or `killed` when the GM sets the member dead), with the crew's names, the day and how they ended; their status can change. An entry row can be **Kept**: a new cast member with the row's name, block and `from` (and the entry's text when its pack is slotted), recorded on the row as `kept`. How hard the fight was names the wear die, listed against the PCs who were hit. One writer applies it all, or nothing. A member starts their next encounter unhurt.
     - **Why:** the interactions are a member's history already (177, 179), and *Who knows what* then has the fight. Keep is what Promote meant (S8a). A PC's wear is on their sheet (100). Carrying wounds needs downtime and healing, which are S5's.
     - **Rejected:**
       - A `history` field: 177's third place for one sentence.
       - Keep and Promote as two verbs: one act, two words (190).
       - Wounds written to the cast: a member would need running health, and something to heal it (GQ26).
       - NPC wear written to the cast: the armor is a text line with no wear.
       - Keep after the end, from Past encounters: an ended encounter is read-only (188).
     - **Replaces:** Decision 177 in part: an eighth kind, `fought`, which an encounter's end writes.
     - **Revisit if:** GQ26 says wounds carry, S5's sessions give downtime, or a GM wants to keep someone after the fact.
     - **Built:** table schema 0.7; PR #__; log 2026-10-0X.
```

**Supersession marks:** 177 *in part* → **superseded in part by 193**, in
the ledger (`→ **Superseded in part by Decision 193** — an eighth kind,
fought, written by an encounter's end`) and its INDEX line. If the ledger
search at build time finds anything else 193 overrides, stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **Do wounds carry?** A cast member who got away with 2 Health Levels left: does their next encounter start them hurt? | **No.** The line says how they ended; the next fight starts them unhurt. Carrying wounds needs running health on the cast and downtime to heal it, which S5's sessions bring. Goes to Scott as GQ26 | **Default, for now** (Ken): wounds will likely carry later; GQ26 to Scott |
| SQ2 | **The history line is an interaction**, of a new eighth kind, **fought** (*Fought them*), and **killed** when the GM sets the member dead in the wrap-up. It shows on the member's page and in *Who knows what*, and the kind is offered by hand too. Not a `history` field (177). | **Yes** | **Yes** |
| SQ3 | **Keep and Promote are one verb, Keep.** Promote, as S8a defined it, is Keep. | **Yes** | **Keep**, with the act spelled out where it's pressed (Ken): the checkbox reads *Keep as a cast member* (§8). Words in the label, not a hover tooltip: a tablet has no hover |
| SQ4 | **The wear roll is a reminder.** The GM picks *How hard was it* (Easy 1d4 … Legendary 1d10); the wrap-up names the die and lists the PC rows that took a hit, who roll it on their sheets. NPC wear stays on the ended encounter and isn't carried. | **Yes** | **Yes** |
| SQ5 | **Keep only in the wrap-up.** Once the encounter has ended, it's read-only (188), so a survivor not kept then is gone. | **Yes**: one moment to decide, and a GM who forgot can Use the entry again | **Yes** |
| SQ6 | **Who's in the line's crew:** every PC row's name, whoever was in the room. | **Yes**: the GM can edit the text, and S3b's seats will claim the names | **Yes** (Ken): everyone you saw there is someone you'd remember, hit or not. How well they know each other is W68 |
| SQ7 | **The Thrall's armor line** reads *Layered Street Clothes (PROT 1d4, RES +2, INT 10) — see Entry 24 flag; civilian clothing*. The pack builder strips everything from ` — see Entry NN flag` to the end of the line, leaving *Layered Street Clothes (PROT 1d4, RES +2, INT 10)* (§10 step 7). | **Yes**: "civilian clothing" is the maintainers' note, and the name already says it | **Yes** |
| SQ8 | **Has Scott used S10a and S10b?** The plan's S10c includes "anything Scott's use turns up". | Nothing yet: anything he reports goes into S10d or the next order | **Not yet** (Ken) |

## 5. Read first

- `CLAUDE.md` whole: constraints 7, 8, 9 and 10; *Decisions*.
- `docs/STATE.md` whole.
- The plan: §4e (*Remember*), §4h (*Ending it*), §6 *S8* (Promote's
  move) and *S10*.
- `docs/SCHEMA.md` §3's table shape; §4: Decisions **100** (the wear
  roll), **176**, **177**, **178**, **179**, **182**, **188**, **191**.
- `private/crb/053_Combat_Encounters.md`, lines 636–646 and the summary box
  at 855–862 (*After the fight*).
- **The code:** `engine.js`'s Tables section: `_interaction`,
  `INTERACTION_KINDS`, `addInteraction`, `_killLinked`, `interactionsFor`,
  `crewView`, `castFromEntry`, `editCastMember`, `CAST_STATUSES`, `_encRow`,
  `_encounters`, `endEncounter`, `encounterView`, `encounterTitle`,
  `linkName`, and the 0.6 step in `migrateTable`. `gm.js`'s Encounters
  tab (`encPageHtml`, the `data-enc-end` handler, `encResetHtml` for how a
  checklist panel replaces the rows), the interaction form
  (`INTERACTION_KINDS` at `gm.js:325`), and a member's page.
  `sheet.js`'s `wearPanelHtml` (the difficulty labels).

## 6. Out of scope

- **Wounds on the cast** (SQ1), healing, downtime.
- **NPC armor wear carried anywhere**, and the wear roll itself: the app
  never rolls, and a PC's wear is the player's (100).
- **Anything written to a character**, or to a pack.
- **The session journal's line** (§4h): sessions are S5's.
- **Keep from Past encounters** (SQ5), undo for the cast (176).
- The Encounter Design worksheet, Surprise, Ambush, Delay, an encounter's
  clocks (S7), seats (S3b).
- **Any change to the sheet, the hit pipeline or S10b's code.**

## 7. The shapes

**The row, schema 0.7** (added to 191's shape):

```js
Row = {
  …S10b's fields…,
  kept: null    // 0.7: entry rows only: { kind: "cast", id, name }, the member it was kept as (178's link, with the name)
}
```

**The interaction, schema 0.7:** `kind` may also be `"fought"`.
`INTERACTION_KINDS` becomes eight, `fought` last.

**The gate** (`migrateTable`, step *Schema 0.7 (Decision 193): a row
remembers who it was kept as*): before 0.7, every row gets `kept: null`.
Then on every load, `kept` goes through `_castLinks([r.kept])[0]` on an
entry row, else null; a cast or PC row's is null. A `kept` link whose
member was deleted keeps its name (178), as every link does. Extend
`removeCastMember`'s name-writing to `kept` links.

**Engine** (Tables section, *The encounter's end (Decision 193)*). The same
rules as S10a: writers take the table first, stamp it, and return
`{ ok: true, … }`, or `{ ok: false, why }` with nothing changed; readers are
total.

| Function | Does | Refuses / returns |
|---|---|---|
| `encounterWrapUp(t, encId)` | **reader**: `{ rows, crew, dice, hit }`. `rows` has one item per non-PC row: `{ row, kind, name, ended: { left, levels, levelsLeft, down, gone, conditions: [names] }, status, line }`. `status` is a cast row's member's current status, or `"alive"` for an entry row. `line` is the text a line gets by default. `crew` is the PC rows' trimmed, non-empty names. `dice` is `integrityLossByDifficulty` as `[{ id, name, die }]` (`name` the id title-cased, as the sheet labels them), and `hit` lists the PC rows with `damage > 0` or `massive > 0` | never throws; no such encounter, or one that isn't running → `{ rows: [], crew: [], dice, hit: [] }` |
| `_endLine(t, e, view)` | **private**: the default text. ✎ *Fought them in <title>: <n> of <m> Health Levels left[, Down][; <Condition>, <Condition>].* With no totals: ✎ *Fought them in <title>[; <Conditions>].* | — |
| `castFromRow(t, packs, encId, rowId, name)` | **private to the writer**: a cast member from an entry row: `name` (trimmed, else the row's name), the row's `block` (a deep copy) and `from`, `status: "alive"`; when `packs` holds `from`'s entry, its text, names and tier as `castFromEntry` copies them. Unshifted onto the cast | — |
| `endEncounter(t, encId, wrap?, packs?)` | **the one writer.** With no `wrap`: as now. With `wrap = { rows: { [rowId]: { keep, name, status, line, text } } }`: **validates every row first**, then ends the encounter, keeps each entry row whose `keep` is true (sets its `kept`), sets each cast row's `status` when it changed (`editCastMember`), and adds each line whose `line` is true as one interaction per member: `kind` `"killed"` when that member's status is now `"dead"`, else `"fought"`; `cast` the member; `crew` the reader's; `text` the GM's (trimmed; blank uses the default); `date` today, local. A kept member's line links the new member. Returns `{ ok, kept: [ids], lines: [ids] }` | as now (no such encounter; ended); a `wrap` for a planned encounter (*"It hasn't started, so there's nothing to wrap up."*); an unknown status (*"Choose a status."*); `keep` on a row that isn't an entry row (*"Only a copy from a pack can be kept."*). Nothing is written on a refusal |

`wrap` keys that aren't rows of this encounter are ignored. A row missing
from `wrap.rows` gets nothing: no keep, no line, no status change.

**`encounterView`** gains, for an ended encounter's entry row, `kept`:
`linkName(t, r.kept)` (`{ name, gone }`), or null.

**Where the record lives:** the wrap-up's draft is on `S` (`S.encWrap`)
until **End the encounter**; nothing is written before it. The writer
touches the encounter, the cast and the interactions, and nothing else.

## 8. The UI

All in `gm.js` and the CSS, in GM-facing tool voice. Drafts marked ✎ are
for a voice pass. **Built for a tablet** (§1a).

**End** on a running encounter opens **the wrap-up** in place of the rows,
as Reset's checklist does (no `askFirst`). A planned encounter's End is
unchanged.

- A heading, ✎ *Wrap up <title>*, and one line: ✎ *Nothing is saved
  until you end it.*
- **Each cast row:** the name, how they ended (✎ *2 of 8 Health Levels ·
  Bleeding, Prone*, or *Down*, or *Dying*), **Status** (Alive, Dead,
  Missing, Out of the picture: the Cast tab's names and order), and a
  checkbox, ✎ *Add this fight to their record*, on by default, with the
  line's text in an editable box under it.
- **Each entry row:** the name, how they ended, and a checkbox, ✎ *Keep
  as a cast member*, off (SQ3). Ticked, it shows **Name** (the row's name,
  editable), **Status** (Alive by default) and the same line box, on.
- **Armor wear:** **How hard was it** (Easy (1d4) … Legendary (1d10), none
  picked), then ✎ *<Wren>, <Rook>: roll 1d6 for armor wear on your sheet.*
  for the PC rows that took a hit, or ✎ *No player took a hit.* With no
  difficulty picked, nothing is named. No PC rows: no wear section.
- **End the encounter** (primary) and **Cancel**. An NPC row with nothing
  ticked is fine; the wrap-up can end with nothing written but the end.

| Press | The record | The view | Focus |
|---|---|---|---|
| **End** (running) | — | the wrap-up replaces the rows | the heading |
| A checkbox, a status, a name, a line | — | the draft follows; ticking Keep shows its fields | the same control |
| **How hard was it** | — | the reminder names the die | the same select |
| **End the encounter** | the encounter ended; kept members, statuses and lines written | the encounters list, as End does now | **New encounter**'s field, as now |
| **End the encounter**, refused | — | the refusal under the button | the button |
| **Cancel** | — | the running encounter, as it was | **End the encounter** |
| A kept row's *Kept as <name>* (ended encounter) | — | the member's page, with Back to the encounter (S10a's `backEnc`) | the page's Back |

**What a refused or empty value shows:** a blank line box writes the default
text (`_endLine`), never an empty line. A blank Name keeps the row's name.

**Add an interaction** offers **Fought them** last (`gm.js`'s
`INTERACTION_KINDS`).

**Copy** (✎ throughout; tool voice). No flag id, no "S10c", no "coming soon"
(constraint 9).

## 9. Tests

**`tests/engine.test.mjs`**, *The encounter's end (193)*, synthetic names only:

- `encounterWrapUp`: a cast row, an entry row, a PC row with damage and one
  without; the rows (PC rows left out), `ended` from `encounterView`,
  `status`, the default `line` (with totals, without, with Conditions,
  Down), `crew`, `dice` in the data's order, `hit`. A planned or ended
  encounter returns empty lists and never throws.
- `endEncounter` with no `wrap`: unchanged (S10a's tests pass as they are).
- With a `wrap`:
  - a cast row's line lands as a `fought` interaction linking the member,
    with the crew, today and the text; a blank text writes the default;
  - a status set to dead writes `killed` and the member reads dead; set to
    missing writes `fought` and missing;
  - a kept entry row: a new member first in the cast, with the name given
    (or the row's), the row's block as a deep copy (editing the member's
    block leaves the row's alone), `from`, Alive, and the entry's text when
    the pack is slotted, none when it isn't; the row's `kept` links them,
    and the line links the new member;
  - an unticked row writes nothing; a `wrap` key that isn't a row is
    ignored;
  - **all or nothing**: an unknown status on the last row refuses, and the
    table deep-equals what it was;
  - a planned encounter refuses a `wrap`; an ended one refuses everything.
- `removeCastMember` writes the name into a `kept` link; the ended row
  reads *Kept as <name>*, struck through, gone.
- `INTERACTION_KINDS` has eight; `KINDS` (`engine.test.mjs:3205`) gains
  `fought`.
- `newTable()` and a 0.6 table: every row has `kept: null`, and everything
  else deep-equals.

**`tests/hostile.test.mjs`**, the table file: `kept` as a string, a number,
a link with a bad id, a link on a PC row and on a cast row (→ null); a
`kept` link with `<img onerror>` as its name (renders as text). An
interaction of kind `fought` survives; an unknown kind is still null. The
regex at `hostile.test.mjs:378` gains `fought`.

**`tests/smoke.test.mjs`**, switched on:

- A running encounter with a cast member, two entry rows and two PCs (one
  hit): End opens the wrap-up, focused on its heading; the cast member's
  line is on and reads their Health Levels left; Keep is off on both entry
  rows; How hard was it → Hard reads *roll 1d8* and names only the PC who
  was hit.
- Keep one entry row, rename it, set the cast member Dead, End the
  encounter: the cast has the kept member first; the cast member reads
  Dead with a *Killed them* line on their page; the kept member's page has
  its *Fought them* line; the ended encounter reads *Kept as <name>*, and
  tapping it opens the member, whose Back returns to the encounter.
- Cancel: the running encounter, as it was, focus on End the encounter.
- A planned encounter's End asks as before, with no wrap-up.
- *Add an interaction* offers *Fought them* last.
- Switched off: no Encounters tab, as before.

**Mutation-test** (record each in the PR, with **the test that actually
caught it**). Check each for a second path before naming it:

1. **The writer writes before it validates** (a refused wrap leaves a kept
   member) → the all-or-nothing test.
2. **A kept member shares the row's block** (no deep copy) → the kept test.
3. **`killed` written whatever the status** → the missing test.
4. **A blank line written blank** → the default-text test.
5. **The gate keeps `kept` on a cast row** → the hostile test.
6. **`removeCastMember` skips `kept` links** → the gone test.
7. **`crew` includes an empty PC name** → the crew test.
8. **The wrap-up written before End the encounter** (a ticked box writes) →
   the Cancel smoke test.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and
after each step.

1. Confirm 193 and GQ26 are free on `origin/main`. Search the ledger again
   for the pre-flight's names.
2. **The gate:** `TABLE_SCHEMA_VERSION` 0.7, the step, `kept` in `_encRow`
   and the three row builders, `fought` in `INTERACTION_KINDS` (engine and
   `gm.js`). Hostile tests.
3. **The reader:** `encounterWrapUp`, `_endLine`. Its tests.
4. **The writer:** `castFromRow`, `endEncounter`'s `wrap`, `kept` in
   `encounterView`, `removeCastMember`'s `kept` links. Its tests.
5. **The UI:** the wrap-up, *Kept as*, *Fought them* in the form.
6. **In the browser** (`shadows-dev-preview`, `?gm=on`, the real Codex
   pack): a running encounter with a cast member made with **Add to cast**,
   Corner Crew and two PCs. Hit some of them, then End: read each row's
   *how they ended* against its row before End. Keep one Street Tough under
   a new name, set the cast member Dead, pick Hard, End. Read the cast, both
   members' pages, *Who knows what* (the PCs' names list the fight) and the
   ended encounter. Then, **at 768 × 1024**, the wrap-up with every row and
   the End button on screen or a scroll away; **at 390px**, no sideways
   overflow with every Keep ticked.
7. **The Thrall's line** (SQ7, in `private/`): `build-codex-pack.mjs` strips
   everything from ` — see Entry NN flag` to the end of an armor line,
   beside S9c's ⚠ strip (`noFlag`), and `tests/codexpack.test.mjs` asserts that no built armor
   line matches `/\bflag\b/i`. Run `npm run codex-pack`, commit in the
   private repo, and bump the submodule pointer. Check the Thrall's line
   reads *Layered Street Clothes (PROT 1d4, RES +2, INT 10)* and nothing
   more (SQ7).
8. The mutations (§9).
9. Ledger, INDEX, plan, STATE, docs, close-out (§12).

## 11. Stop and ask

- 193 or GQ26 is taken.
- The ledger search finds a decision that 193 overrides and §0 doesn't
  name.
- The writer can't be all-or-nothing without changing `addInteraction`,
  `castFromEntry` or `editCastMember`'s behaviour for their other callers.
- A cast member's page or *Who knows what* needs a change beyond the
  eighth kind to show a fight's line.
- Anything needs a rules answer: wear beyond 053's lines, wounds carried
  (SQ1).
- The tablet check fails and the fix is a layout change outside the
  Encounters tab.
- 193 goes over 350 words.
- A test outside the ones named fails and the fix isn't obviously yours.

## 12. Close-out

*Rule or shape* tier, switched off:

- **SCHEMA:** 193; 177 marked *superseded in part by 193*; §3's table block
  gains `kept` and the eighth kind, and the step history gains 0.7.
- **INDEX:** one line under **GM mode**; 177's line marked.
- **STATE:** §1's GM clause gains the encounter's end (193); §3 and §5: S10c
  built, switched off, and what's next per the plan (S10 is done but for
  the worksheet; Scott's use of the Encounters tab decides).
- **The plan:** §6 *S10*'s paragraph names S10c (built); §6 *S8*'s *Moved
  to S10* line says Keep and Promote are one verb; §9 gains **GQ26** for
  Scott (*Does a cast member carry their wounds into the next fight?
  Default: no; the line says how they ended, and S5's downtime is where
  healing would live*).
- **`changelog-pending.md`:** ✎ *End a fight with a wrap-up: keep the
  survivors worth keeping, write the fight onto each NPC's record, and tell
  the players which die to roll for armor wear.*
- **Log** entry; **shipped** row *(switched off)*; README's table: S10c's
  row.
- **PR** titled `feat(gm): an encounter's end keeps survivors and writes
  the fight to the cast, switched off (W29 S10c, Decision 193)`. Body: what
  changed; the mutations; the browser check (including the tablet); **Where
  the order didn't fit**.

## 13. Review checklist

- [ ] In the browser with the real pack: every row's *how they ended*
      against the row before End; the cast, both pages and *Who knows
      what* after it.
- [ ] All or nothing: a refused wrap leaves the table deep-equal.
- [ ] A kept member's block is a copy (edit it; the ended row's is
      unchanged).
- [ ] Nothing is written before **End the encounter** (Cancel after ticking
      everything).
- [ ] A planned encounter's End is unchanged.
- [ ] Every focus in §8's table, pressed, not assumed.
- [ ] A 0.6 table opens; the hostile table opens; nothing renders as markup.
- [ ] Nothing in the sheet or the hit pipeline changed.
- [ ] The Thrall's armor line has no flag reference; `codexpack.test`
      guards it.
- [ ] Two mutations re-run locally.
- [ ] No version bump but the table schema; `changelog-pending.md` has the
      line.
