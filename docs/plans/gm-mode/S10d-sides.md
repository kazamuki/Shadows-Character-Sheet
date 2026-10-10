# Work order S10d — Wave Initiative: sides that act in turn, best Combat Sense first

**Plan:** [`../gm-mode.md`](../gm-mode.md) §1a (Deighton's answers: "wave
initiative"), §6 S10's *Still open: turns by side*; Decisions 174, 188, 189,
191, 193; `0530` (the Order of Engagement).
**Status:** **drafted 2026-10-09 by Claude (Opus)**, after #146 (S14) and
#147 (the Reference's chips, 209) merged (README step 7). **Ken chose this
session over S6, W86 with W84, and the Reference's additions (2026-10-09).**
**SQ1–SQ7 answered by Ken 2026-10-09**, and the draft rewritten around them:
more than two sides, the best Combat Sense picks the side, allies on the cast,
*Wave Initiative* with a tip. **SQ8–SQ12 are new, each with a default, and
wait on Ken.**
**Branch:** from `main` at `b06d629` or later, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js` (the cast and encounter sections),
`gm.js` (the Encounters tab and a cast member's page), the CSS, the ledger,
the table schema and STATE. No data, nothing in `private/`.

**What S10d is.** The book lets a round run "as individuals or as sides, in
waves" (`0530`). S10a built individuals only: everyone's Combat Sense, highest
first. Deighton runs his fights in waves (§1a): everyone rolls Combat Sense,
the side holding the best result acts, everyone on it, then the next side.
Scott runs it one at a time. So an encounter gets a switch, **One at a time**
or **Wave Initiative**, and a list of **sides**: the crew, and one or more
others (a three-way fight has three). Each row is on a side. In waves, the
sides go best result first, and within a side the rows act row by row, in the
order the GM taps them. Everything after the order stays as built: the turn
follows who has acted (189), Next goes row by row, a tap on a row gives it the
turn, Reset comes after everyone. A cast member can be marked **Fights with
the crew**, so an ally joins the crew's side when added.

**The engine change is one sort key and one list.** `_encOrder` already
decides everything downstream: whose turn, Next, Reset's list, the page's
rows. In waves, it sorts by the side's place first (its best result) and by
its existing key within each side. The work is in feeding it the encounter
instead of a bare list of rows (see the pre-flight's `_pick` finding), the
sides themselves, and the page.

**Carried over from S14's review** (#146, one fix round; both fixes were the
build's, neither the order's):

- **A refused press must not touch the table.** S14's empty jot went through
  `tableChange` before the engine refused it, so the stored `changed` moved
  and an exported table read as changed. Here every new writer refuses a bad
  value **before** stamping, and the UI calls `tableChange` only on `ok`. A
  test asserts `meta.updated` doesn't move on a refusal.
- **A live region announces a line, not a list** (S14's Find). Nothing here is
  live but the existing notices.

**Pre-flight** (README, *The pre-flight*), against `main` at `b06d629`:

- **The order is `_encOrder(rows)`** (`engine.js:5182`): `[last, no result,
  −order]`, a stable sort, and `tied(r)`. It's called three times, each with
  `_rowList(e)`: `_pick` (`:5280`), `resolveEncounterReset` (`:5379`) and
  `encounterView` (`:5704`). It takes **rows, not the encounter**, so it can't
  see a mode or the sides. It becomes `_encOrder(e)`.
- **`_pick` is called with a stand-in encounter twice:** `startEncounter`
  (`:5338`, `_pick({ rows:e.rows, acted:[] })`) and `applyEncounterReset`
  (`:5415`, the same, as a check that anyone's left). The first decides who
  starts. A stand-in without `by` and `sides` would start a wave fight on the
  best row overall, whatever its side's place. Both become
  `_pick(Object.assign({}, e, { acted:[] }))`. **Mutation 1 is this line.**
- **The turn follows who has acted** (189, `_pick`: the first row in the
  order that's neither out nor acted). Changing the order mid-round can't skip
  a row or let one act twice, so switching modes or moving a row needs no
  special case.
- **`setTurn`** (`:5356`) gives any live row the turn; the page calls it on a
  tap on a row's name area (`data-eturn`, `gm.js:2204`). In waves, that's how
  a GM picks who on the side goes now (SQ5).
- **`editEncounter(t, id, f)`** (`:5163`) writes `name` only. **`editParticipant`**
  (`:5257`) writes `name`, `order`, `last`, `out`, and a PC's `hp`, `levels`,
  `awareness`. Both refuse an ended encounter through `_live`.
- **New rows:** `addEncounter` (`:5154`), `addParticipant` (`:5194`),
  `_entryRow` (`:5224`, used by `participantFromEntry` and
  `participantsFromGroup`) build their objects by hand; each gains its new
  field. `_encRow` (`:5059`) and `_encounters` (`:5092`) are the gate. Ids are
  `PREFIX-` and eight of `randomChars` (`newRowId`, `:5026`; `ROW_ID_RE`,
  `:3751`): a side's id follows, `SD-XXXXXXXX`, except the crew's, which is the
  fixed `"crew"`.
- **The cast record** (`_castMember`, `:3847`; `addCastMember`, `:4142`;
  `editCastMember`, `:4152`) has no flag for which side a member fights on.
  `ally` is new: a boolean, `false` unless `true`. `castFromEntry` makes a
  member too and gains it. Find's `_castFields` reads text only and is
  unaffected.
- **The wrap-up's crew is PC rows** (`encounterWrapUp`, `:5450`), by kind,
  not by side (193: "every PC in the room is the line's crew"). It stays that
  way: an ally on the crew's side isn't written as crew.
- **Tips** (139): `shared.js`'s `TIPS` (`:493`); `gm.js` adds kinds of its
  own (`TIPS.condition`, `TIPS.enctrait`), and `engine.test.mjs:3803` fails
  if it redefines one `shared.js` has. `TIPS.wave` is free.
- **The page:** `encPageHtml` (`gm.js:2098`) draws the status bar (Start,
  Next, End) and `encRowHtml` (`:1955`) each row: the head with the name, its
  tags (PC, Cast, Out, Done, Goes last), **Combat Sense** (`data-eorder`) and
  **Tied: reroll** (`enc-tied`); a row's **More** holds Name, **Goes last**,
  **Out** and Remove. `toActive` (`:2133`) scrolls the active row into view.
- **The schema stamp** is pinned at `"0.10"` in `engine.test.mjs` (`:3079`,
  `:3154`, `:3206`, `:3429`, `:3791`, `:4000`, `:4516`, `:4987`, `:5359`,
  `:5647`, `:6012`, and the titles at `:3074` and `:3147`), `hostile.test.mjs`
  (`:765`), `smoke.test.mjs` (`:3767`, `:3773`, `:4114`, `:4126`, `:4503`,
  `:4597`, `:5941`, `:5954`) and STATE (`docs.test.mjs` reads it). All move to
  `"0.11"`. The other `"0.10"`s (`engine.test.mjs:5992`, `:6016`, `:6019`,
  `:6023`, `hostile.test.mjs:925`) are input files stamped 0.10 and stay.
  `:6011`'s title (*208: table schema 0.10…*) keeps its words, since it tests
  the 0.10 step; only its `newTable` line moves.
- **The ledger,** searched by name: *Order of Engagement*, *Combat Sense*,
  *turn*, *acted*, *ties*, *Goes last*, *encounter row*, *cast record*, *side*,
  *wave*, *ally*. Hits:
  - **189** (Combat Sense highest first, ties flagged): **in part.** In waves,
    a side's place comes first and ties are flagged between sides, not rows;
    one at a time is unchanged.
  - **174** (the cast record) and **188** (the encounter record): extended,
    not replaced; cited.
  - **191** (a row takes a hit), **193** (the wrap-up's crew is PC rows) and
    **100** (Turn Reset): unchanged; cited.
  - Nothing mentions sides, waves or allies.
- **Decision 210, GQ30:** free on `origin/main` (checked 2026-10-09). No W or
  F number is needed. Check again before pasting.
- **`0530`** (`private/crb/0530_Combat_Encounters.md`): "Each person or side
  acts in order" (step 3); "whether that is as individuals or as sides, in
  waves"; "everyone involved makes a Combat Sense check. Order proceeds in
  descending order from the highest result." It doesn't say how a side's
  place is decided. Ken's reading (SQ2): the side holding the best result goes
  first. GQ30 asks Deighton to confirm; the build takes Ken's reading.

---

## 1. Goal

Deighton starts a fight with the crew, Marta (a cast member marked **Fights
with the crew**) and four Street Toughs. He sets the encounter to **Wave
Initiative**. The page shows **The crew** (four PCs and Marta) and **The
other side** (the Toughs). Everyone rolls Combat Sense; a Tough's 16 beats
the crew's best, 14, so **The other side** moves above **The crew**. He
presses **Start**; the first Tough is up. He taps whichever Tough he runs
next, presses Next after each, and when the last Tough is done, Next moves to
the crew. Rook's player shouts first; he taps Rook. After the last of the
crew, Reset, as now. Halfway through, a gang crashes in: **Add a side**,
*The Saints*, three rows moved onto it. Scott's encounters, one at a time,
look and work exactly as before.

**Done when:**

- Switched off: nothing changes anywhere.
- A planned or running encounter has **One at a time** / **Wave Initiative**,
  the second with a tip that says what it means.
- An encounter has sides: **The crew** and at least one other; the GM adds
  (up to six in all), names and removes the others. Each row is on one: a PC
  on the crew's, a cast member marked **Fights with the crew** on the crew's,
  everyone else on the first other side; a row's **Side** moves it.
- In waves: the rows show under their sides' headings, sides in order of
  their best Combat Sense; a tie between two sides' best is flagged on both
  headings; no row's tie is flagged; the turn, Next, a tap on a row, Reset and
  the wrap-up all work.
- A cast member's page has **Fights with the crew**.
- One at a time is unchanged: every existing encounter test passes untouched
  but for the schema pins.
- Switching mid-round keeps who has acted; Next carries on in the new order.
- Table schema 0.11 with its `migrateTable()` step; an old table opens one at
  a time, with the crew and one other side, PCs on the crew's, everyone else
  on the other, and no cast member an ally.
- `npm run verify` and `npm run phone-check` pass; checked by hand at 390px,
  768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape: a table-file shape, and a GM-facing behaviour the
  book allows two ways.
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** no bump; no data changes.
- **Table schema:** **0.10 → 0.11**: an encounter's `by` and `sides`, a row's
  `side`, a cast member's `ally`. A `migrateTable()` step in the same commit
  (170).
- **Character and pack schemas:** unchanged.
- **Reserved:** Decision **210**; **GQ30** (for Deighton: in waves, does the
  side holding the best Combat Sense go first?).

## 3. The decision, drafted

Paste after 209, under INDEX §3's **GM mode** heading, filling **Built**.
Count it with `wc -w`; the cap is 350.

```
210. **An encounter runs one at a time or in waves: sides act in turn, the side holding the best Combat Sense first, each row on a side the GM can move it off, and a cast member can fight with the crew.**
     *2026-10-XX · Ken + Claude · Touches: encounter sides, row side, Wave Initiative, Order of Engagement, _encOrder, addSide, removeSide, cast ally, Fights with the crew, Combat Sense, ties, table schema 0.11, Decision 174, Decision 189, GQ30*
     - **Decided:** An encounter runs **one at a time** (Combat Sense, as 189) or by **Wave Initiative**. It has sides: the crew and one to five others, named by the GM. A row is on one; a PC starts on the crew's, a cast member marked **Fights with the crew** too, everyone else on the first other side. In waves, sides go in order of their best Combat Sense, a tie between sides flagged for a reroll; each side's rows act in the order the GM taps them. The turn follows who has acted, so switching mid-round skips no one. Table schema 0.11.
     - **Why:** `0530` allows "individuals or … sides, in waves". Deighton runs fights in waves, Scott one at a time (§1a).
     - **Rejected:**
       - Waves for the whole table: one GM runs both ways depending on the fight.
       - The GM ordering the sides by hand: the table rolls Combat Sense anyway (Ken, SQ2).
       - Two sides only: a three-way fight needs three (Ken).
       - Drag and drop between sides: fiddly by touch; a select does it (Ken).
       - *Side done* in one press: the GM still needs to know who hasn't gone (SQ5).
     - **Replaces:** Decision 189 in part: in waves, a side's place comes before a row's result, and ties are flagged between sides. It extends 174 (`ally`) and 188 (sides).
     - **Revisit if:** GQ30 says the book orders sides another way, or seats (S3b) let a player end their own turn.
     - **Built:** table schema 0.11, switched off (173); log 2026-10-XX.
```

**Supersession marks:** 189 gets its 210 mark folded into its existing 191
marker, as `docs.test.mjs` reads one per decision (*→ **Superseded in part by
Decisions 191 and 210** — every row also takes a hit (191); in waves, a side's
place comes first and ties are flagged between sides (210)*), and its INDEX
line the same (*superseded in part by 191 and 210*). If the ledger search at
build time finds another, stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **Where the switch lives, and a new encounter's setting.** On each encounter's page, planned or running. A new encounter is **One at a time** | **Per encounter, One at a time** | **Default** (Ken) |
| SQ2 | **Which side goes first.** | The GM picks | **Ken:** the Combat Sense rolls decide: the side holding the best result goes first, so the other side can. And there can be more than two sides. GQ30 asks Deighton to confirm |
| SQ3 | **Who's on which side.** | By kind, then the GM's | **Ken:** a threat added is on an opposing side; a cast member can be marked as an ally, **Fights with the crew**, and joins the crew's side. Sides are a list the GM adds to, each row moved with a **Side** select (Ken picked the select over drag and drop) |
| SQ4 | **Combat Sense in waves.** | Hidden | **Ken:** hidden works; with SQ2, it reads: each row's Combat Sense stays (it decides the sides' order), and **Tied: reroll** isn't shown on a row; a tie between two sides' best is flagged on both sides' headings |
| SQ5 | **A side's turn.** Row by row: tap whoever acts, Next marks them done | **Row by row** | **Default** (Ken) |
| SQ6 | **The words.** | *By side* | **Ken:** **One at a time** / **Wave Initiative**, with an explainer: a tip (139) on *Wave Initiative* (§8), copy ✎ for a voice pass |
| SQ7 | **Switching mid-round.** Allowed while planned or running; who has acted and whose turn it is are kept; Next carries on in the new order | **Allowed** | **Default** (Ken) |
| SQ8 | **A side's best.** The highest Combat Sense among its rows that aren't **Out** and don't **Go last**. A side with no result goes after every side with one, in the order listed (the crew first) | **As listed** | |
| SQ9 | **Removing a side.** Its rows move to the first other side left, and a toast says how many. The crew can't be removed, nor the last other side | **Move them** | |
| SQ10 | **How many sides.** Six at most, the crew included | **Six** | |
| SQ11 | **A side's name.** The crew's is fixed (*The crew*). Another's is the GM's; blank, it reads *The other side* for the first and *Side 3*, *Side 4*… by its place | **As listed** | |
| SQ12 | **Where Fights with the crew shows.** On a cast member's page, beside **Status**; it changes which side they start on, nothing else (not Find, not the wrap-up) | **As listed** | |

## 5. Read first

- `CLAUDE.md` whole: constraints 7, 8 and 10; *Decisions*; *Change tiers*.
- `docs/STATE.md` whole.
- The plan: §1a (Deighton's fight row), §4e (the cast), §4h (encounters),
  §6 S10.
- `docs/SCHEMA.md` §3's table block and its step history; §4: Decisions
  **100**, **139**, **174**, **188**, **189**, **191**, **193**.
- `private/crb/0530_Combat_Encounters.md`: *The Basics* (step 3) and *Order
  of Engagement*.
- **The code:** `engine.js`'s `_castMember`, `addCastMember`,
  `editCastMember`, `castFromEntry`, `_encOrder`, `_pick`, `_actedIds`,
  `_encRow`, `_encounters`, `addEncounter`, `editEncounter`, `addParticipant`,
  `_entryRow`, `participantsFromGroup`, `editParticipant`, `startEncounter`,
  `nextTurn`, `setTurn`, `removeParticipant`, `resolveEncounterReset`,
  `applyEncounterReset`, `encounterView`, `encounterWrapUp`; `gm.js`'s
  `encPageHtml`, `encRowHtml`, the Encounters tab's binders (`data-elast`,
  `data-eturn`, `toActive`), `encOpenNow`, the cast member's page (Status),
  `TIPS.condition` for the shape of a tip; `shared.js`'s `TIPS`.

## 6. Out of scope

- **Drag and drop** between sides (Ken: the select).
- **Who counts as crew in the wrap-up** (193): PC rows, by kind, as now.
- **Rolling anything**, Combat Sense included (189: the table rolls).
- **Surprise, Ambush and Delay** (`0530`), and the Encounter Design worksheet:
  still later in S10.
- **A table-wide default** for the mode (SQ1).
- **Any change to one at a time**: its order, ties, Next, Reset.
- **Sides in Find** (208): a side's name isn't searched.
- **A cast member's ally flag doing anything else** (SQ12): the Cast tab's
  filters, Who knows what and the wrap-up don't read it.

## 7. The shapes

**The encounter, its rows, and a cast member** (table schema 0.11):

```js
encounters: [ { id, name, status, round, turn, acted, rows,
                by:    "person",                     // 0.11: "person" (one at a time) | "wave" (Decision 210)
                sides: [ { id:"crew", name:"" },     // 0.11: always first, never removed; its name isn't read (SQ11)
                         { id:"SD-XXXXXXXX", name:"" } ],   // one to five more, the GM's names
                created, updated } ]
rows: [ { id, kind, name, …,
          side: "crew" } ]                           // 0.11: the id of a side in this encounter
cast: [ { id, name, …,
          ally: false } ]                            // 0.11: Fights with the crew (SQ12)
```

**`migrateTable()`:** step 0.11, for a table that arrived before it: every
encounter `by: "person"` and `sides: [{ id:"crew", name:"" }, { id:<new SD-
id>, name:"" }]`; every row `side` from its kind (`"pc"` → `"crew"`, else the
other side's id); every cast member `ally: false`. Then, always:

- `by` not one of the two → `"person"`.
- `sides`: kept entries that are objects with an id that's `"crew"` or
  matches `SD-` and eight characters, each once; names `_str`. The crew's put
  first (added if missing), then the others in their order, at most five; no
  other side left → one is added with a new id.
- A row's `side` not the id of one of this encounter's sides → from its kind
  (`"pc"` → `"crew"`, else the first other side).
- A cast member's `ally` is `true` only when it's `true`.

SCHEMA §3's step history gains: *0.11 adds each encounter's `by` and `sides`,
each row's `side` and each cast member's `ally`: one at a time, the crew and
one other side, PCs on the crew's, nobody an ally (nothing is guessed).*

**Engine:**

| Function | Does | On bad input |
|---|---|---|
| `_encOrder(e)` | **was `_encOrder(rows)`.** Reads `_rowList(e)`. One at a time: as now, and `sides` in list order. In waves: each side's `best` (SQ8); sides with a best first, highest first, then the rest in list order (stable); the row key gains a first element, its side's place; within a side, the existing key. Returns `{ rows, tied(r), sides:[{ id, title, best, tied, rowIds }] }`: `tied(r)` is always `false` in waves; a side's `tied` is `true` when another side has the same `best` | a non-object `e`: `{ rows:[], tied:()=>false, sides:[] }` |
| `sideTitle(e, id)` | the side's name trimmed, else *The crew*, *The other side* or *Side N* (SQ11) ✎ | `""` |
| `_pick(e)` | as now, through `_encOrder(e)` | as now |
| `startEncounter`, `applyEncounterReset` | their stand-in becomes `Object.assign({}, e, { acted:[] })` | as now |
| `addEncounter(t, f)` | as now, plus `by:"person"` and the two sides | as now |
| `addParticipant(t, encId, f)` | as now, plus `side`: `"crew"` for a PC row, and for a cast row whose member has `ally:true`; otherwise the first other side | as now |
| `_entryRow` | as now, plus `side`: the first other side | as now |
| `editEncounter(t, id, f)` | as now, plus `f.by` (`"person"` / `"wave"`). **Any other value refuses before writing** ✎, the table untouched (`meta.updated` and the encounter's `updated` unchanged). Never touches `turn`, `acted` or `round` (SQ7) | `_live`'s refusals |
| `addSide(t, encId, f)` | adds a side named `_str(f.name).trim()`, last in the list. Refuses at six (SQ10) before writing ✎. `{ ok:true, id }` | `_live`'s refusals |
| `renameSide(t, encId, sideId, name)` | sets a side's name. The crew's refuses ✎; an unknown id refuses | `_live`'s refusals |
| `removeSide(t, encId, sideId)` | removes it; its rows move to the first other side left (SQ9). The crew's, or the last other side, refuses ✎. `{ ok:true, moved:n }` | `_live`'s refusals |
| `editParticipant(t, encId, rowId, f)` | as now, plus `f.side`: an id in this encounter's sides, else refuses before writing ✎ | as now |
| `addCastMember`, `castFromEntry` | as now, plus `ally:false` | as now |
| `editCastMember(t, id, f)` | as now, plus `f.ally`: `true` or `false`; anything else leaves it | as now |
| `encounterView(t, encId, packs)` | as now, plus the view's `by` and `sides` (from `_encOrder`), and each row's `side`. A row's `ties` is `false` in waves | as now |

Nothing else changes: `nextTurn`, `setTurn`, `removeParticipant`, Reset and
the wrap-up read the order through `_pick` and `_encOrder` and need no edit
beyond the two stand-ins. Total and read-only readers stay so. A side's
`best` and place are computed, never stored (constraint 7).

The refusals ✎ (tool voice): *Choose one at a time or Wave Initiative.*,
*Six sides at most.*, *The crew keeps its name.*, *The crew stays.*, *A fight
needs another side.*, *No such side.*

## 8. The UI

All in `gm.js` and the CSS; tool voice; ✎ for a voice pass. **Built for a
tablet** (§1a): every control a tap, 44px.

**The bar** (`encPageHtml`), planned or running, not ended or wrapping up:
after the status and its buttons, a `form-toggle` group ✎ *Turns*: **One at a
time** / **Wave Initiative** (`data-eby`, `aria-pressed`). **Wave Initiative**
carries a tip (`data-tip="wave"`, a `TIPS.wave` added in `gm.js`), ✎:

> **Wave Initiative.** Everyone rolls Combat Sense. The side holding the best
> result acts first, everyone on it, in any order; then the side with the
> next best, and so on. The book runs a round "as individuals or as sides, in
> waves".

Ended: the setting as text (*Wave Initiative*), or nothing for one at a time.

**The rows**, in waves: under an `h2` per side, in the order `_encOrder`
gives (best first): the side's title, its best (✎ *Best 16*, or nothing), and
**Tied: reroll** (`enc-tied`) when its best ties another side's. A side's
**More** (`details`) holds its **Name** (not the crew's) and **Remove side**
(not the crew's, not the last other). A side with no rows still shows its
heading, with ✎ *Nobody on this side.* Under the last side, **Add a side**
(`data-eaddside`), hidden at six. One at a time: one list, as now, no
headings, no sides.

**A row**: **Combat Sense** stays in both modes (SQ4). In waves, no **Tied:
reroll** on a row, and its **More** gains a ✎ *Side* `select` (`data-eside`)
listing the sides by title. The active row, **Done**, **Out**, **Goes last**
and a tap on the name area are as now.

**A cast member's page:** beside **Status**, a toggle ✎ **Fights with the
crew** (`data-cally`, `aria-pressed`), saved at once, no redraw.

| Press | The record | The view | Focus |
|---|---|---|---|
| **Wave Initiative** / **One at a time** | `by` | the rows regroup; the turn and Done tags unchanged | the pressed button |
| A row's **Combat Sense**, in waves | `order` | the sides may reorder (on `change`, as now) | the field |
| A row's **Side** | `side` | the row moves under its side; its **More** stays open there | that row's **Side** select |
| **Add a side** | a side | a new heading, its **More** open | its **Name** field |
| A side's **Name** | `name` | the heading (on `change`) | the field |
| **Remove side** | the side, its rows moved | the rows under the first other side; a toast ✎ *Moved 3 to The other side.* | **Add a side** |
| **Start**, in waves | `round 1`, `turn` the first side's first row | the active row in view | **Next** |
| **Next** | as now | the next row on this side, else the next side's first, else Reset | **Next** (Reset's first field at Reset) |
| A tap on a row | `turn` | as now | as now |
| **Fights with the crew** | the member's `ally` | — | the toggle |

**At width:** the toggle wraps under the status at 390px; a side's heading
wraps; nothing scrolls sideways (`scrollWidth` equals `clientWidth`); Next
stays in view without scrolling on a running encounter at 768 × 1024.

## 9. Tests

**`tests/engine.test.mjs`**, *Wave Initiative (210)*:

- **0.11:** `newTable().meta.tableSchemaVersion` is `"0.11"`, the pins move
  (pre-flight). A 0.10 table with an encounter of a PC, a cast and an entry
  row, and two cast members, opens `by:"person"`, two sides (`"crew"` first),
  the PC on the crew's, the others on the other side, both members
  `ally:false`. A 0.11 file's `by:"side"`, a sides list missing the crew, with
  a duplicate id, `__proto__` as an id and nine others, and a row whose `side`
  names nothing, read `"person"`, the crew first, each id once, at most six,
  and the row's side from its kind; `ally:"yes"` reads `false`; real values
  are kept.
- **The order, in waves:** the crew (PCs on 14 and 8) and the other side
  (Toughs on 16 and none): the other side first (16 > 14): Tough 16, Tough
  none, PC 14, PC 8. Drop the Tough to 12: the crew first. A *Goes last* PC is
  last of the crew, not of everyone. Two rows on 10 on one side: no row
  `ties`. The two sides' best both 14: both sides `tied`, neither row.
- **A side's best** ignores an **Out** row and a **Goes last** row (SQ8); a
  side with no result goes after the sides with one, in list order.
- **Three sides:** add *The Saints* (best 15) between 16 and 14: they go
  second.
- **Start, in waves, the other side best:** the turn is the other side's first
  row. (Mutation 1.)
- **Next through a round, in waves:** the first side's rows, then the next
  side's, then `reset:true`; Reset starts round 2 on the first side's first
  row.
- **Switching mid-round:** after one row has acted, switching to one at a time
  keeps `acted` and `turn`; Next never offers the acted row again that round.
- **`setTurn` in waves** gives the turn to a row on any side; Next after it
  marks it done.
- **Sides:** `addSide` to six, the seventh refused; `renameSide` (the crew
  refused); `removeSide` moves its rows to the first other side and returns
  how many; the crew and the last other side refused.
- **A row's side**: `editParticipant` moves it; a moved ally is ordered with
  the crew.
- **Allies:** a cast member with `ally:true` added to an encounter is on the
  crew's side; `ally:false`, on the first other side; an entry row and a
  group's rows, the first other side.
- **Refusals don't stamp:** `editEncounter` with `by:"side"`, `addSide` at
  six, `renameSide` on the crew, `removeSide` on the crew, `editParticipant`
  with `side:"enemy"`: `ok:false`, and `meta.updated`, the encounter's
  `updated` and the row unchanged. On an ended encounter, `_live`'s refusal.
- **One at a time is unchanged:** the S10a, S10b and S10c encounter tests pass
  untouched but for the schema pins.
- **The wrap-up's crew** is the PC rows' names; an ally on the crew's side is
  not among them (193 kept).
- Totality: `encounterView` and `_pick` through every reader on a migrated
  hostile table whose `by`, `sides`, a side's `name` and a row's `side` are
  objects, arrays and numbers; nothing throws.

**`tests/smoke.test.mjs`**, switched on:

- A planned encounter shows **One at a time** pressed. **Wave Initiative**:
  the rows under *The crew* and *The other side*, Combat Sense fields still
  there, no *Tied: reroll* on a row; focus stays on the pressed button; its
  tip opens and reads the copy.
- Enter Combat Sense so the other side's best is higher: their heading moves
  first, with *Best 16*. Tie the two bests: both headings say *Tied: reroll*.
- **Start**: the other side's first row is active; **Next** through them, then
  the crew's first row is active; after the last, Reset shows.
- A row's **Side** moves it under the other heading, its **More** still open,
  focus on its select.
- **Add a side**: a third heading, its **Name** focused; **Remove side**: its
  rows under *The other side*, the toast, focus on **Add a side**.
- A cast member's **Fights with the crew**, then **Add to <encounter>** from
  their page: they're under *The crew*.
- One at a time: no headings, the numbers kept.
- `app.errors` empty throughout.

**`tests/hostile.test.mjs`:** a side named `<img onerror>`, and a row named
the same on it, in waves: the heading, the Side select and the row render the
names as text; no `img` in `#main`; a hostile `by`, `sides`, `side` and
`ally` read their defaults.

**Mutation-test** (record each in the PR with the test that actually caught
it). Check each for a second path first:

1. **`startEncounter`'s stand-in without `by` and `sides`** → *Start, in waves,
   the other side best*.
2. **A side's best counts Out and Goes last rows** → the best test.
3. **The 0.11 step puts every row on the crew's side** → the migration test.
4. **A row's tie still flagged in waves** → the ties assertion.
5. **A mode switch clears `acted`** → the switching test.
6. **A refused writer stamps the table first** → the refusal test's
   `meta.updated`.
7. **`removeSide` drops its rows** instead of moving them → the sides test.
8. **`addParticipant` ignores `ally`** → the allies test.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and at
the end; the targeted test files after each step.

1. Confirm 210 and GQ30 are free on `origin/main`. Search the ledger again for
   the pre-flight's names.
2. **The shape:** schema 0.11, the `migrateTable` step, `_castMember`,
   `_encRow` and `_encounters`, the builders; their tests, the `"0.10"` pins.
3. **The order:** `_encOrder(e)`, `sideTitle`, its three callers, the two
   stand-ins, `editEncounter`, `editParticipant`, `encounterView`; their
   tests.
4. **The sides and allies:** `addSide`, `renameSide`, `removeSide`,
   `editCastMember`'s `ally`; their tests.
5. **The UI:** the bar's toggle and tip, the side headings and their More,
   **Add a side**, a row's Side, row ties hidden in waves, **Fights with the
   crew**; the smoke and hostile tests.
6. **In the browser** (`shadows-dev-preview`, `?gm=on`): a table with four PCs,
   a cast member marked **Fights with the crew**, one not, and two Codex rows.
   Wave Initiative: Combat Sense so the other side is first, Start, Next
   through a whole round, a tap out of order on each side, Reset, round 2. A
   tie between sides. Add a third side, move a row onto it, remove it. Switch
   to one at a time mid-round and back. End, and check the wrap-up's crew.
   Then **390px** (the toggle and headings wrap; `scrollWidth` equals
   `clientWidth`), **768 × 1024** (Next in view), **1300px**. `npm run
   phone-check`.
7. The mutations (§9).
8. Ledger (210, 189 marked), INDEX, SCHEMA §3's note and step history, the
   plan, STATE, docs, close-out (§12).

## 11. Stop and ask

- 210 or GQ30 is taken.
- The ledger search finds a decision 210 overrides that the pre-flight
  doesn't name.
- Any S10a, S10b or S10c encounter test needs a change beyond its schema pin.
- A caller of `_encOrder` or `_pick` that the pre-flight doesn't list.
- The bar or a side's heading doesn't fit at 390px without scrolling
  sideways, and the fix is more than their own CSS.
- The voice test flags any of the new copy.
- The decision goes over 350 words.

## 12. Close-out

*Rule or shape* tier, switched off:

- **SCHEMA:** 210; 189's marker gains 210; §3's encounter block gains `by`,
  `sides` and a row's `side`, the cast block `ally`; the step history gains
  0.11.
- **INDEX:** 210's line under **GM mode**; 189's line marked.
- **STATE:** the table schema to 0.11; §1's GM clause gains Wave Initiative
  (210); what's next.
- **The plan:** §6 S10's *Still open: turns by side* becomes built (S10d,
  210); the build-order table gains S10d; §9's GQ30 stays open for Deighton.
- **`changelog-pending.md`:** ✎ *Wave Initiative. Run a fight the way your
  table does: one at a time by Combat Sense, or side by side, the best roll's
  side first, with as many sides as the fight has.*
- **Log** entry (table schema 0.11; why the order is one sort key); **shipped**
  row *(switched off)*; README's table: S10d's row.
- **PR** titled `feat(gm): Wave Initiative, switched off (S10d, Decision
  210)`. Body: what changed; the mutations; the browser check; **Where the
  order didn't fit**.

## 13. Review checklist

- [ ] **In the browser, by the orchestrator:** a wave round start to Reset
      with the other side first and a tap out of order on each side; a tie
      between sides; a third side added, used and removed; a mid-round switch;
      an ally added from their page lands with the crew; the wrap-up's crew.
- [ ] Start in waves lands on the best side's first row.
- [ ] One at a time is untouched: the existing encounter tests changed only in
      their schema pins.
- [ ] A refused writer leaves `meta.updated` alone.
- [ ] An old table opens one at a time, with two sides, PCs on the crew's.
- [ ] 390px: the toggle and headings wrap; nothing scrolls sideways.
- [ ] 189 marked (one marker with 191); table schema 0.11 everywhere it's
      written.
- [ ] Two mutations re-run locally.
