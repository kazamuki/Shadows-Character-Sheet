# Work order S10d — Turns by side: the crew's wave, then theirs

**Plan:** [`../gm-mode.md`](../gm-mode.md) §1a (Deighton's answers: "wave
initiative"), §6 S10's *Still open: turns by side*; Decisions 188, 189, 191,
193; `0530` (the Order of Engagement).
**Status:** **drafted 2026-10-09 by Claude (Opus)**, after #146 (S14) and
#147 (the Reference's chips, 209) merged (README step 7). **Ken chose this
session over S6, W86 with W84, and the Reference's additions (2026-10-09).**
**SQ1–SQ7 wait on Ken.**
**Branch:** from `main` at `b06d629` or later, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js` (the encounter section), `gm.js` (the
Encounters tab), the CSS, the ledger, the table schema and STATE. No data,
nothing in `private/`.

**What S10d is.** The book lets a round run "as individuals or as sides, in
waves" (`0530`). S10a built individuals only: everyone's Combat Sense, highest
first. Deighton runs every fight the other way: the players' side acts, he
notes damage, Conditions and kills as they go, then he runs the enemies (§1a).
Scott runs it by Combat Sense. So an encounter gets a switch, **One at a
time** or **By side**, and each row a side, the crew's or the other. By side,
the crew's rows come first (or theirs, the GM's pick), then the other side's.
Everything after the order stays as built: the turn still follows who has
acted (189), Next still goes row by row, a tap on a row still gives it the
turn, and Reset still comes after everyone.

**The engine change is one sort key.** `_encOrder` already decides
everything downstream: whose turn, Next, Reset's list, the page's rows. By
side, it sorts by side first and by its existing key within each side. The
work is in feeding it the encounter instead of a bare list of rows (see the
pre-flight's `_pick` finding), the shape, and the page.

**Carried over from S14's review** (#146, one fix round; both fixes were the
build's, neither the order's):

- **A refused press must not touch the table.** S14's empty jot went through
  `tableChange` before the engine refused it, so the stored `changed` moved
  and an exported table read as changed. Here every new writer
  (`editEncounter`'s `by` and `first`, `editParticipant`'s `side`) refuses a
  bad value **before** stamping, and the UI calls `tableChange` only on `ok`.
  A test asserts `meta.updated` doesn't move on a refusal.
- **A live region announces a line, not a list** (S14's Find). Nothing here
  is live but the existing notices; if the page says which side is up, it's
  plain text, not `aria-live`.

**Pre-flight** (README, *The pre-flight*), against `main` at `b06d629`:

- **The order is `_encOrder(rows)`** (`engine.js:5182`): `[last, no result,
  −order]`, a stable sort, and `tied(r)`. It's called three times, each with
  `_rowList(e)`: `_pick` (`:5280`), `resolveEncounterReset` (`:5379`) and
  `encounterView` (`:5704`). It takes **rows, not the encounter**, so it can't
  see a side setting. It becomes `_encOrder(e)`, reading `e.rows`, `e.by` and
  `e.first`.
- **`_pick` is called with a stand-in encounter twice:** `startEncounter`
  (`:5338`, `_pick({ rows:e.rows, acted:[] })`) and `applyEncounterReset`
  (`:5415`, the same, as a check that anyone's left). The first decides who
  starts. With a stand-in that drops `by` and `first`, a by-side encounter
  whose other side goes first would start on a crew row. Both become
  `_pick(Object.assign({}, e, { acted:[] }))`. **Mutation 1 is this line.**
- **The turn follows who has acted** (189, `_pick`: the first row in the
  order that's neither out nor acted). Changing the order mid-round can't
  skip a row or let one act twice, so switching modes needs no special case.
- **`setTurn`** (`:5356`) gives any live row the turn; the page calls it on
  a tap on a row's name area (`data-eturn`, `gm.js:2204`). By side, that's how
  a GM picks who on the side goes now.
- **`editEncounter(t, id, f)`** (`:5163`) writes `name` only. **`editParticipant`**
  (`:5257`) writes `name`, `order`, `last`, `out`, and a PC's `hp`, `levels`,
  `awareness`. Both refuse an ended encounter through `_live`.
- **New rows:** `addEncounter` (`:5154`), `addParticipant` (`:5194`) and
  `_entryRow` (`:5224`) build their objects by hand; each gains its new
  field. `_encRow` (`:5059`) and `_encounters` (`:5092`) are the gate.
- **The wrap-up's crew is PC rows** (`encounterWrapUp`, `:5450`), by kind, not
  by side (193: "every PC in the room is the line's crew"). It stays that
  way; an ally on the crew's side isn't written as crew.
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
  *turn*, *acted*, *ties*, *Goes last*, *encounter row*, *side*, *wave*. Hits:
  - **189** (Combat Sense highest first, ties flagged): **in part.** By side,
    the side comes first and ties aren't flagged; one at a time is unchanged.
  - **188** (the encounter record): extended, not replaced; cited.
  - **191** (a row takes a hit), **193** (the wrap-up's crew is PC rows) and
    **100** (Turn Reset): unchanged; cited.
  - Nothing mentions sides or waves.
- **Decision 210, GQ30:** free on `origin/main` (checked 2026-10-09). No W or
  F number is needed. Check again before pasting.
- **`0530`** (`private/crb/0530_Combat_Encounters.md`): "Each person or side
  acts in order" (step 3); "whether that is as individuals or as sides, in
  waves" (Order of Engagement). It doesn't say which side goes first, or the
  order within a side. That's GQ30, and the app leaves it to the GM (§3).

---

## 1. Goal

Deighton starts a fight with the crew and four Street Toughs. He sets the
encounter to **By side**, the crew first, and presses **Start**. The page
shows **The crew** and under it the four PCs, then **The other side** and the
Toughs. Rook's player shouts first; he taps Rook, notes a hit on a Tough, and
presses **Next**. Wren's player goes; he taps Wren. When the last PC is done,
Next moves to the first Tough. After the last Tough, Reset, as now. Nobody
entered a Combat Sense number. Scott's encounters, one at a time, look and
work exactly as before.

**Done when:**

- Switched off: nothing changes anywhere.
- A planned or running encounter has **One at a time** / **By side**; by
  side, **Goes first: The crew** / **The other side**.
- Each row has a side: a PC row the crew's, a cast or Codex row the other
  side's, changed in its **More**.
- By side, the rows show under the two sides' headings, the first side first;
  the turn, Next, a tap on a row, Reset and the wrap-up all work; ties aren't
  flagged and Combat Sense isn't asked for (SQ4).
- One at a time is unchanged: every existing encounter test passes untouched
  but for the schema pins.
- Switching mid-round keeps who has acted; Next carries on in the new order.
- Table schema 0.11 with its `migrateTable()` step; an old table opens one at
  a time, PCs on the crew's side, everyone else on the other.
- `npm run verify` and `npm run phone-check` pass; checked by hand at 390px,
  768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape: a table-file shape, and a GM-facing behaviour the
  book allows two ways.
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** no bump; no data changes.
- **Table schema:** **0.10 → 0.11**: an encounter's `by` and `first`, a row's
  `side`. A `migrateTable()` step in the same commit (170).
- **Character and pack schemas:** unchanged.
- **Reserved:** Decision **210**; **GQ30** (for Deighton: by side, which side
  goes first?).

## 3. The decision, drafted

Paste after 209, under INDEX §3's **GM mode** heading, filling **Built**.
Count it with `wc -w`; the cap is 350.

```
210. **An encounter runs one at a time or by side: by side, the first side's rows act, then the other's, each row on the crew's side or the other, and the GM picks which side goes first.**
     *2026-10-XX · Ken + Claude · Touches: encounter, by, first, row side, Order of Engagement, sides, waves, _encOrder, _pick, startEncounter, editEncounter, editParticipant, Combat Sense, ties, table schema 0.11, Decision 189, GQ30*
     - **Decided:** An encounter's turns run **one at a time** (Combat Sense, as 189) or **by side**. Each row is on the crew's side or the other; a PC row starts on the crew's, a cast or Codex row on the other, and the GM can move it. By side, the side that goes first (the GM's pick, the crew by default) acts, then the other, each in its rows' order; ties aren't flagged. The turn still follows who has acted, so switching mid-round skips no one. Table schema 0.11.
     - **Why:** `0530` allows "individuals or … sides, in waves". Deighton runs every fight by side, Scott by Combat Sense (§1a).
     - **Rejected:**
       - By side only for the whole table: one GM runs both ways depending on the fight.
       - The first side by its best Combat Sense: `0530` doesn't say, and a GM running by side doesn't roll it (GQ30).
       - Side from a row's kind alone: an ally fights with the crew, a turncoat against them.
       - A side's turn as one step, *Side done*: the GM still needs to know who on it hasn't gone (SQ5).
     - **Replaces:** Decision 189 in part: by side, the side comes before Combat Sense and ties aren't flagged. One at a time is unchanged.
     - **Revisit if:** GQ30 says the book picks the first side, a third side is wanted (a three-way fight), or seats (S3b) let a player end their own turn.
     - **Built:** table schema 0.11, switched off (173); log 2026-10-XX.
```

**Supersession marks:** 189 gets `→ **Superseded in part by Decision 210**`
(*by side, the side comes before Combat Sense and ties aren't flagged*) beside
its existing 191 mark, folded into one marker as `docs.test.mjs` reads one
per decision (*Superseded in part by Decisions 191 and 210*), and its INDEX
line the same. If the ledger search at build time finds another, stop and
ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **Where the switch lives, and a new encounter's setting.** On each encounter's page, planned or running. A new encounter is **One at a time**; the alternative is that it copies the newest encounter's setting, which saves Deighton a tap a fight but changes behind the GM's back | **Per encounter, One at a time** | |
| SQ2 | **Which side goes first.** The GM's pick on the encounter, **The crew** by default (Deighton's practice). `0530` doesn't say; GQ30 asks Deighton how the book means it | **The GM picks; the crew** | |
| SQ3 | **Who's on which side.** A PC row on the crew's; a cast or Codex row on the other side; a row's **More** has **Side** to move it (an ally, a turncoat). Stored in both modes, so switching keeps it | **By kind, then the GM's** | |
| SQ4 | **Combat Sense by side.** Hidden while by side (any numbers stay stored, and come back one at a time), and **Tied: reroll** not shown: a side acts together. Within a side, rows keep Combat Sense order if there is one, else the order added | **Hidden** | |
| SQ5 | **A side's turn.** Row by row, as now: tap whoever acts, Next marks them done. No *Side done* button, which would save taps but lose who hasn't gone | **Row by row** | |
| SQ6 | **The words.** ✎ *One at a time* / *By side*; *Goes first:* *The crew* / *The other side*; the headings *The crew* and *The other side*; a row's *Side* toggle *Crew* / *Other side* | **As listed, for a voice pass** | |
| SQ7 | **Switching mid-round.** Allowed while planned or running; who has acted and whose turn it is are kept; Next carries on in the new order | **Allowed** | |

## 5. Read first

- `CLAUDE.md` whole: constraints 7, 8 and 10; *Decisions*; *Change tiers*.
- `docs/STATE.md` whole.
- The plan: §1a (Deighton's fight row), §4h (encounters), §6 S10.
- `docs/SCHEMA.md` §3's table block and its step history; §4: Decisions
  **100**, **188**, **189**, **191**, **193**.
- `private/crb/0530_Combat_Encounters.md`: *The Basics* (step 3) and *Order
  of Engagement*.
- **The code:** `engine.js`'s `_encOrder`, `_pick`, `_actedIds`, `_encRow`,
  `_encounters`, `addEncounter`, `editEncounter`, `addParticipant`,
  `_entryRow`, `editParticipant`, `startEncounter`, `nextTurn`, `setTurn`,
  `removeParticipant`, `resolveEncounterReset`, `applyEncounterReset`,
  `encounterView`, `encounterWrapUp`; `gm.js`'s `encPageHtml`, `encRowHtml`,
  the Encounters tab's binders (the `data-elast` and `data-eturn` handlers,
  `toActive`), `encOpenNow`.

## 6. Out of scope

- **A third side**, or named sides (a three-way fight): one crew, one other.
- **Who counts as crew in the wrap-up** (193): PC rows, by kind, as now.
- **Rolling anything**, Combat Sense included (189: the table rolls).
- **Surprise, Ambush and Delay** (`0530`), and the Encounter Design worksheet:
  still later in S10.
- **A table-wide default** for the mode (SQ1's alternative), unless Ken
  picks it.
- **Any change to one at a time**: its order, ties, Next, Reset.

## 7. The shapes

**The encounter and its rows** (table schema 0.11):

```js
encounters: [ { id, name, status, round, turn, acted, rows,
                by:    "person",   // 0.11: "person" (one at a time) | "side" (Decision 210)
                first: "crew",     // 0.11: "crew" | "other": by side, which acts first
                created, updated } ]
rows: [ { id, kind, name, …,
          side: "crew" } ]         // 0.11: "crew" | "other"
```

**`migrateTable()`:** step 0.11, for a table that arrived before it: every
encounter `by: "person"`, `first: "crew"`; every row `side` from its kind
(`"pc"` → `"crew"`, else `"other"`). Then, always (in `_encounters` and
`_encRow`): `by` not one of the two → `"person"`; `first` not one of the two
→ `"crew"`; a row's `side` not one of the two → from its kind. SCHEMA §3's step
history gains: *0.11 adds each encounter's `by` and `first` and each row's
`side`: one at a time, the crew first, PCs on the crew's side (nothing is
guessed).*

**Engine** (the encounter section):

| Function | Does | On bad input |
|---|---|---|
| `_encOrder(e)` | **was `_encOrder(rows)`.** Reads `_rowList(e)`. One at a time: as now. By side: the key gains a first element, 0 for a row whose `side` is `e.first`, 1 otherwise; within a side, the existing key. `tied(r)` is always `false` by side | a non-object `e`: `{ rows:[], tied:()=>false }` |
| `_pick(e)` | as now, through `_encOrder(e)` | as now |
| `startEncounter`, `applyEncounterReset` | their stand-in becomes `Object.assign({}, e, { acted:[] })`, so it carries `by` and `first` | as now |
| `addEncounter(t, f)` | as now, plus `by:"person"`, `first:"crew"` (SQ1) | as now |
| `addParticipant`, `_entryRow` | as now, plus `side`: `"crew"` for a PC row, `"other"` for a cast or entry row | as now |
| `editEncounter(t, id, f)` | as now, plus `f.by` (`"person"` / `"side"`) and `f.first` (`"crew"` / `"other"`). **Any other value refuses before writing:** `{ ok:false, why:"…" }` ✎, the table untouched (`meta.updated` and the encounter's `updated` unchanged). Never touches `turn`, `acted` or `round` (SQ7) | `_live`'s refusals |
| `editParticipant(t, encId, rowId, f)` | as now, plus `f.side` (`"crew"` / `"other"`); any other value refuses before writing, as above | as now |
| `encounterView(t, encId, packs)` | as now, plus the view's `by` and `first`, and each row's `side`. `ties` is `false` by side | as now |

Nothing else changes: `nextTurn`, `setTurn`, `removeParticipant`, Reset and
the wrap-up read the order through `_pick` and `_encOrder` and need no edit
beyond the two stand-ins. Total and read-only readers stay so.

The refusals ✎ (tool voice): *Choose one at a time or by side.*, *Choose
which side goes first.*, *Choose the crew's side or the other.*

## 8. The UI

All in `gm.js` and the CSS; tool voice; ✎ for a voice pass. **Built for a
tablet** (§1a): every control a tap, 44px.

**The bar** (`encPageHtml`), planned or running, not ended or wrapping up:
after the status and its buttons, a `form-toggle` group ✎ *Turns*:
**One at a time** / **By side** (`data-eby`, `aria-pressed`). By side, a
second group ✎ *Goes first*: **The crew** / **The other side**
(`data-efirst`). Ended: the setting as text (*By side, the crew first*), or
nothing for one at a time.

**The rows**, by side: under `h2` ✎ *The crew* and ✎ *The other side*, in
the order the encounter has them (the first side first). A side with no rows
draws no heading. One at a time: one list, as now, no headings.

**A row**, by side: no **Combat Sense** field and no **Tied: reroll** (SQ4).
Its **More** gains a `form-toggle` ✎ *Side*: **Crew** / **Other side**
(`data-eside`), in both modes. The active row, **Done**, **Out**, **Goes
last** and a tap on the name area are as now.

| Press | The record | The view | Focus |
|---|---|---|---|
| **By side** / **One at a time** | `by` | the rows regroup; the turn and Done tags unchanged | the pressed button |
| **The crew** / **The other side** (Goes first) | `first` | the sides swap places | the pressed button |
| A row's **Side** | `side` | the row moves to its side's list; **More** stays open there | that row's pressed button |
| **Start**, by side | `round 1`, `turn` the first side's first row | the active row in view | **Next** |
| **Next** | as now | the next row on this side, else the first on the other side, else Reset | **Next** (Reset's first field at Reset) |
| A tap on a row | `turn` | as now | as now |

**At width:** the two toggles wrap under the status at 390px and never
scroll sideways; `scrollWidth` equals `clientWidth`; Next stays in view
without scrolling on a running encounter at 768 × 1024.

## 9. Tests

**`tests/engine.test.mjs`**, *Turns by side (210)*:

- **0.11:** `newTable().meta.tableSchemaVersion` is `"0.11"`, the pins
  move (pre-flight). A 0.10 table with an encounter of a PC, a cast and an
  entry row opens `by:"person"`, `first:"crew"`, the PC `"crew"`, the others
  `"other"`. A 0.11 file's `by: "wave"`, `first: 5` and a row's `side:
  "__proto__"` read `"person"`, `"crew"` and the side from its kind; a real
  `"side"`, `"other"` and a cast row's `"crew"` are kept.
- **The order, by side:** two PCs (Combat Sense 8 and 14) and two Toughs (12,
  none): crew first gives PC 14, PC 8, Tough 12, Tough none; `first:"other"`
  gives Tough 12, Tough none, PC 14, PC 8. A *Goes last* PC is last of the
  crew, not of everyone. `ties` is `false` by side for two rows on 10, `true`
  one at a time.
- **Start, by side, the other side first:** the turn is the first Tough.
  (Mutation 1.)
- **Next through a round, by side:** both PCs, then both Toughs, then
  `reset:true`; Reset then starts round 2 on the first side's first row.
- **Switching mid-round:** after one PC has acted, switching to one at a time
  keeps `acted` and `turn`; Next never offers the acted PC again that round.
- **`setTurn` by side** gives the turn to a row on the other side; Next after
  it marks it done.
- **A row's side** moves it; a moved ally is ordered with the crew.
- **Refusals:** `editEncounter` with `by:"wave"` or `first:"them"`,
  `editParticipant` with `side:"enemy"`: `ok:false`, and `meta.updated`, the
  encounter's `updated` and the row unchanged. On an ended encounter, `_live`'s
  refusal.
- **One at a time is unchanged:** the S10a, S10b and S10c encounter tests
  pass untouched but for the schema pins.
- **The wrap-up's crew** is the PC rows' names, a cast row moved to the crew's
  side not among them (193 kept).
- Totality: `encounterView` and `_pick` through every reader on a migrated
  hostile table whose encounter has `by`, `first` and `side` as objects,
  arrays and numbers; nothing throws.

**`tests/smoke.test.mjs`**, switched on:

- A planned encounter shows **One at a time** pressed; **By side** shows
  *Goes first* with **The crew** pressed, and the rows under *The crew* and
  *The other side*, no Combat Sense field, no *Tied: reroll*; focus stays on
  the pressed button.
- **Start**, by side: the first PC is active; **Next** through both PCs, then
  the first Tough is active; after the last, Reset shows.
- A row's **Side** moves it to the other list, its **More** still open, focus
  on its pressed button.
- **The other side** first: their rows are drawn first.
- One at a time: no headings, Combat Sense back, its numbers kept.
- `app.errors` empty throughout.

**`tests/hostile.test.mjs`:** an encounter row named `<img onerror>` on each
side, by side: the headings and rows render the name as text; a hostile `by`,
`first` and `side` read their defaults.

**Mutation-test** (record each in the PR with the test that actually caught
it). Check each for a second path first:

1. **`startEncounter`'s stand-in without `by` and `first`** → *Start, by
   side, the other side first*.
2. **`_encOrder` ignores `first`** → the order test's `first:"other"` half.
3. **The 0.11 step puts every row on the crew's side** → the migration test.
4. **`tied` still flagged by side** → the ties assertion.
5. **A mode switch clears `acted`** → the switching test.
6. **A bad `by` stamps the table before refusing** → the refusal test's
   `meta.updated`.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and
at the end; the targeted test files after each step.

1. Confirm 210 and GQ30 are free on `origin/main`. Search the ledger again for
   the pre-flight's names.
2. **The shape:** schema 0.11, the `migrateTable` step, `_encRow` and
   `_encounters`, the three builders; their tests, the `"0.10"` pins.
3. **The order:** `_encOrder(e)`, its three callers, the two stand-ins,
   `editEncounter`, `editParticipant`, `encounterView`; their tests.
4. **The UI:** the bar's toggles, the side headings, a row's Side, Combat
   Sense and ties hidden by side; the smoke and hostile tests.
5. **In the browser** (`shadows-dev-preview`, `?gm=on`): a table with four
   PCs, a cast member and two Codex rows. By side, the crew first: Start, Next
   through a whole round, a tap out of order on each side, Reset, round 2.
   Switch to one at a time mid-round and back. Move the cast member to the
   crew's side. The other side first. End, and check the wrap-up's crew. Then
   **390px** (the toggles wrap; `scrollWidth` equals `clientWidth`), **768 ×
   1024** (Next in view), **1300px**. `npm run phone-check`.
6. The mutations (§9).
7. Ledger (210, 189 marked), INDEX, SCHEMA §3's note and step history, the
   plan, STATE, docs, close-out (§12).

## 11. Stop and ask

- 210 or GQ30 is taken.
- The ledger search finds a decision 210 overrides that the pre-flight
  doesn't name.
- Any S10a, S10b or S10c encounter test needs a change beyond its schema pin.
- A caller of `_encOrder` or `_pick` that the pre-flight doesn't list.
- The bar doesn't fit at 390px without scrolling sideways, and the fix is more
  than the toggles' own CSS.
- The voice test flags any of the new copy.
- The decision goes over 350 words.

## 12. Close-out

*Rule or shape* tier, switched off:

- **SCHEMA:** 210; 189 marked in part (one marker with 191); §3's encounter
  block gains `by`, `first` and a row's `side`, the step history gains 0.11.
- **INDEX:** 210's line under **GM mode**; 189's line marked.
- **STATE:** the table schema to 0.11; §1's GM clause gains turns by side
  (210); what's next.
- **The plan:** §6 S10's *Still open: turns by side* becomes built (S10d,
  210); the build-order table gains S10d; §9's GQ30 stays open for Deighton.
- **`changelog-pending.md`:** ✎ *Turns by side. Run a fight the way your
  table does: one at a time by Combat Sense, or the crew's side, then theirs.*
- **Log** entry (table schema 0.11; why the order is one sort key); **shipped**
  row *(switched off)*; README's table: S10d's row.
- **PR** titled `feat(gm): turns by side, switched off (S10d, Decision 210)`.
  Body: what changed; the mutations; the browser check; **Where the order
  didn't fit**.

## 13. Review checklist

- [ ] **In the browser, by the orchestrator:** a by-side round start to
      Reset with a tap out of order on each side; the other side first; a
      mid-round switch; an ally moved to the crew; the wrap-up's crew.
- [ ] Start by side with the other side first lands on their first row.
- [ ] One at a time is untouched: the existing encounter tests changed only
      in their schema pins.
- [ ] A refused `by`, `first` or `side` leaves `meta.updated` alone.
- [ ] An old table opens one at a time, PCs on the crew's side.
- [ ] 390px: the toggles wrap; nothing scrolls sideways.
- [ ] 189 marked (one marker with 191); table schema 0.11 everywhere it's
      written.
- [ ] Two mutations re-run locally.
