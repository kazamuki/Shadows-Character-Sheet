# Work order S10f — The encounter's plan, its opening, Delay, and its clocks

**Plan:** [`../gm-mode.md`](../gm-mode.md) §4h (*Encounters*), §6 *S10* and
*Still to build*'s S10f row. Decisions 188, 189, 193, 208, 210, 212, 241,
244, 245, 251.
**Status:** **drafted 2026-10-28 by Claude (Opus)**, the S12b reviewer, after
#261 (S12b, Decisions 250–251) and Shadows-Private#3 merged
(`WORK-ORDERS.md`, step 7). **Ken chose this session (2026-10-28).** Not yet
approved.
**Branch:** from `main` at `a9eddad` or later, PR to `main`, switched off
(Decision 173). **No `private/` commit**: nothing here is Codex content, and
the pointer doesn't move.
**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md):
a conductor (Opus) starts **S10f build** (Sonnet), then a fresh **S10f
review** (Opus) once the PR is open. Builder and reviewer message each other
directly; anything for Ken goes to the conductor. §15 is the hand-over.
**Runs alone.** It touches `engine.js` (the encounter gate, the round, the
clock gate and its readers, Find, the activity label's collapse), `gm.js`
(the encounter page, its card, the shared clock code, Find), the CSS, the
sample table, the ledger and STATE.
**Table schema N** (0.17 if still free when you build: `main` is 0.16 at
`a9eddad`). Two decisions, **N** and **N+1** below. The pack schema doesn't
move.

**Tier: Rule or shape.** The plan's row says so: there are three shape
changes and a change to the round.
- **An encounter gains the worksheet** (`design`, table schema N).
- **A clock's owner can be an encounter.** 251's gate already *keeps* an
  `encounter` owner as an unknown kind; this makes it a known one, with every
  reader that implies.
- **An encounter gains an opening** (Surprise or Ambush), and **a row gains
  a delay**.
- **The round changes:** Next passes an Ambush's defenders in round 1, and
  Reset lists a missed delay (189 in part).

**Carried over from S12b's review** (#261, one fix round; Ken's answers in
issuecomment-6488380957). Each item is marked as the order's or the build's:

- **The order's: a reader that postdated the pre-flight, the sample table
  *Dead Air*.** `tests/sample-table.test.mjs` asserts `migrateTable(sample)`
  equals the sample, so any change to the table's shape must update
  `tools/sample-table.mjs` and regenerate it. **This order's sweep names it
  (§5), and SQ9 asks whether the sample shows the feature.** The default is
  the stamp and the empty fields only.
- **The order's: an interaction spec on a select.** *"Picking one runs
  `setPlaceSite`"* let ↑/↓ on a closed select commit once per option, and
  each commit copied a clock and wiped rows. Ken ruled select + **Use** (as
  182). **This order has no select that writes.** Every new choice is a
  toggle group or a button (§9, *No select writes*), and the order says so.
- **The order's: copy that covered one case of two.** *"its pack isn't
  slotted in"* was false when the pack was slotted but lacked the profile.
  **Every "missing" or "can't" line here is written for every way it can
  happen** (§9, *Refused and empty*).
- **The order's: no Activity label for a write with collateral.** The copied
  clock read *Added Drift*; Ken ruled the parent's change wins (*Changed The
  Old Pike*). **Every new write has its label in §9's *Where things land*,
  probed on `main`** (an encounter write reads *Changed <encounter>*).
- **The order's: it claimed 208's ledger mark was missing, and it wasn't.**
  This order checked every mark it cites by eye before asserting (§3).
- **The order's: a test used the next version as its "newer" stamp**
  (`codexpack`'s 0.3), and it broke on the bump. **Grep for the next
  literal too.** `engine.test.mjs`'s *"A file from a newer app keeps its
  trail gated"* sets `newer.meta.tableSchemaVersion = "0.16"`, and **it
  breaks at N** (§10, *Version pins*).
- **The build's:**
  - an Exposure row's buttons kept their *row 1* labels after a name was typed;
  - the heading outline skipped a level (h2 → h4);
  - a card drew an empty `· ·` part for a link with no name.

  **This order says which heading each section is (§9)**, which labels follow
  typed text (an adversary row's Remove), and that a card leaves out an empty
  part.
- **The build's: the `private/` commit had no PR on Shadows-Private.** S10f
  touches nothing in `private/`, and the header and close-out say so.
- **Ken's answers on S12b:** every SQ default. In review he took all three
  recommendations: **Use**, *"X isn't in any pack slotted in."*, and the
  copied clock as collateral.

**Pre-flight** (`docs/WORK-ORDERS.md`, *The pre-flight*) against `main` at
**`a9eddad`**, 2026-10-28. Every function below was opened and read. The
line numbers are `a9eddad`'s.

- **An encounter has no prep half.** Its shape (SCHEMA §3, `engine.js`
  `_encounters` `:7968`, `addEncounter` `:8034`) is the fight: name, status,
  round, turn, acted, `by`, sides, rows.
  - `editEncounter` (`:8044`) writes `name` and `by` only, refuses an ended
    encounter (`_live`, 188's read-only), and **ignores any other key**.
    Probe: `editEncounter(t, id, { design:{…} })` → `{ ok:true }` and nothing
    written.
  - A file's unknown keys ride along. Probe: an encounter carrying `design`
    and `opening`, and a row carrying `delay`, keep them through
    `migrateTable`.
- **The book.**
  - **`2642_Encounter_Design_Worksheet.md`** (93 lines) has eight headings:
    - *Encounter Basics*: Type (four boxes), Scene Hook / Trigger, Core
      Stakes, Player Objectives.
    - *NPCs / Adversaries*: five blank rows of NPC/Enemy, Goals, Tactics and
      Leverage/Pressure.
    - *Environment & Hazards*: Terrain, Hazards / Pressure Points, NYTE City
      Interactions.
    - *Objectives Beyond "Defeat Enemy"*: six boxes, and Notes.
    - *Escalation & Consequences*: three fields.
    - *Finding an Out*: Planned Escape Options; four printed *Improvised GM
      Exit Options*; Fail-Safe Narrative Outcome.
    - *Hooks for Next Scene*: two fields.
    - *GM Notes / Improv Prompts*: three printed questions, and Quick pivot.
    - *When Momentum Stalls*: five printed prompts, and Notes.
  - **`0530_Combat_Encounters.md`**:
    - **Surprise and Ambush** (`:136–160`) is one Opposed Check, the
      attackers' Stealth against the defenders' Awareness.
      - **Surprise** (at least one attacker wins): +1 to the attackers'
        first attack; the defenders get Fast Actions only on their first
        turn; no penalty to defense.
      - **Ambush** (every attacker wins): +3; the defenders can't act in the
        first round, can't defend, and attacks against them are at
        Difficulty 10.
      - **Once per encounter.** The Silent tag lets a hidden sniper keep
        ambushing.
    - **Delaying an Action** (`:162–174`): on your turn, delay until a
      condition. Met: you act at once. Not met: you missed it. At Reset,
      turn order resumes as before.
  - **Nothing in `0540` is called Surprised or Ambushed**: they are not
    Conditions, so the app doesn't make them one.
  - **A slip for `crb-catch-up.md`:** Unshakeable (`0430:575`, data `:1793`)
    says *"Surprise grants no Synergy Bonus against you"*, but `0530`'s
    Surprise gives a +1 attack bonus and names no Synergy Bonus.
- **The round** (189, 210):
  - `_pick` (`:8275`) is the first row in `_encOrder` that isn't Out and
    hasn't acted. Its readers are `startEncounter` (`:8333`), `nextTurn`
    (`:8346`), `removeParticipant` (`:8278`) and `applyEncounterReset`
    (`:8412`).
  - `setTurn` (`:8358`) moves the turn to any row that isn't Out, whether or
    not it has acted.
  - `resolveEncounterReset` (`:8373`) builds one entry per row: ticks,
    expiring, recovery, dying. `applyEncounterReset` clears `acted` and picks
    the first row.
  - **The tips are UI copy:** `TIPS.wave` (`gm.js:2667`) is the precedent
    for a rule's words a tap away.
- **Clocks** (245, 251):
  - `_clockOwner` (`:5963`) knows `faction` and `place`, and **keeps** any
    other lowercase kind with an id of 40 characters or fewer. Probe: a
    clock `on: { kind:"encounter", id:"EN-…" }` loads unchanged.
  - `clocksOn` (`:7066`) is generic. Probe: it returns that clock for the
    encounter.
  - `addClock` (`:7033`) knows place, else faction. Probe: an encounter
    owner → `{ ok:false, why:"No such faction." }`.
  - `removeEncounter` (`:8093`) **leaves its clocks**. Probe: the clock is
    left with its owner gone. The label still reads *Removed Warehouse*
    (nothing collapsed, since nothing went).
  - `CLOCK_OWNER_RECORDS` (`:6265`) is `{ factions, places }`. The
    removal collapse and `_clockOwnerChanged` (`:6266`, S12b's review) read
    it.
  - `tableSearch`'s clock loop (`:7306`) tests only a faction's or a place's
    clock. Probe: *alarm* → `[]`.
  - `openFound`'s clock branch (`gm.js:462`) opens only a faction or a place.
  - `clocksHtml`, `bindClocks` and `clockCountText` (`gm.js:1587`, `:1591`,
    `:1582`) are S12b's lift. **`bindClocks` assumes an *Add a clock*
    button** (`main.querySelector("[data-clkadd]").onclick`) and throws
    without one, so a read-only clock list can't be bound by it.
- **The encounter page** (`encPageHtml` `gm.js:3035`, `bindEncounters`
  `:3062`):
  - It redraws whole on every change (`renderTable`), through a delegated
    press map.
  - A planned or running encounter's title is the **Name field**; only an
    ended one has an `h1`.
  - **It already uses `data-erow` and `data-ename`** for its rows. S12b's
    Exposure rows use the same names on a place's page. The pages never meet,
    but **S10f's new attributes must not reuse either** (§15).
  - The Delete dialog (`:3106`) reads *"It isn't kept anywhere else unless
    you've exported the table."*
  - The encounter card (`encListHtml` `:2708`) shows *Round N · n in it* or
    a count.
- **Labels, probed:** renaming an encounter, Start, Next and a change on a
  row each read **Changed <encounter>**. Adding an encounter reads *Added …*;
  removing one reads *Removed …*.
- **The sample table** (`tools/sample-table.mjs` `:541`, regenerated into
  `samples/dead-air.shadows-table.json`) has seven encounters: two planned,
  five ended, and none running. Its encounter literal lists every key.
- **The ledger,** searched by name (the **Touches** lines and the text):
  *worksheet*, *design*, *surprise*, *ambush*, *delay*, *escalation*, *hook*,
  *momentum*, *objective*, *hazard*, *stealth*, *encounter*, *clock*,
  *removeEncounter*, *nextTurn*, *_pick*, *acted*, *Reset*, *tableSearch*,
  *openFound*, *clocksOn*. Hits:
  - **188** (encounters): **superseded in part.** The encounter gains its
    worksheet. 188's **Rejected** has *"a type field"*, and its **Revisit
    if** has *"the Encounter Design worksheet needs a type"*: SQ0 answers it
    (default: no type, so 188 stands on that).
  - **189** (the round): **superseded in part.** An Ambush's defenders get no
    turn in round 1, and Reset lists a missed delay. Already superseded in
    part by 191, 210 and 220, and its mark carries a fourth.
  - **193** (the end): **cited.** End clears a pending delay; the wrap-up is
    unchanged.
  - **208** (Find): **superseded in part.** Find searches an encounter's
    plan, and finds an encounter's clocks.
  - **210** (sides): **cited.** An opening names one of the sides; Wave
    Initiative passes the ambushed the same way.
  - **212** (the activity log): **cited.** No new record. An encounter's
    removal collapses its clocks into one entry, under 251's generalised
    collapse.
  - **241** (a line's encounter link): **cited.** `removeEncounter` still
    writes its name into lines.
  - **244** (the Faction Tracker): **cited.** It is the precedent: *"the
    record is the worksheet and nothing more"*.
  - **245** and **251** (clocks): **superseded in part.** An encounter owns
    clocks, and removing one removes them. 245's **Revisit if** (*"a reset
    rule, or a clock that advances itself"*) is **not** triggered.
  - **Marks checked by eye in both SCHEMA and INDEX, today:**
    - 188: none yet.
    - 189: *by 191, 210 and 220* in both.
    - 208: 243, 244–245 and 251 in both.
    - 245: 251 in both.
    - 251: none yet.
  - **Since 251:** none.
- **Numbers:** the ledger ends at **251**, and the table schema is **0.16**.

---

## 1. Goal

Scott preps Friday's job. He opens a new encounter, *The Velvet Lung*, and
fills **The plan**:
- the hook (*Rook's buyer wants the drive back*);
- the stakes;
- two adversaries, with their goals and tactics;
- the terrain and a hazard;
- **Protect person / asset** among the objectives beyond defeat;
- an escalation, and a fail-safe out.

He adds a clock, **Alarm**, 4 segments: *a shot fired, or the bouncer
radios*.

At the table the crew sneaks in through the loading dock. The table rolls
Stealth against Awareness, and every crew member wins. Scott sets
**Opening → Ambush → by The crew** and presses **Start**:
- the bouncers get no turn in round 1;
- the crew's rows remind him of +3 to their first attack, against
  Difficulty 10.

In round 2 Dez says *"I'll shoot whoever goes for the alarm."* On Dez's turn
Scott presses **Delay**, types *goes for the alarm*, and the turn moves on.
A bouncer reaches for the panel. Scott taps **Act now** on Dez's row, Dez
shoots, and Scott taps + on Alarm once.

Mid-session he finds the encounter from **Find** (*alarm*), on its clock.

**Done when:**

- Switched off: nothing changes anywhere.
- An encounter carries the worksheet's fields as **The plan**:
  - editable while it's planned or running;
  - read-only once it ends;
  - its printed prompts drawn as the book's text and never stored.
- An encounter owns clocks like a faction and a place:
  - added, moved, edited and removed on its page;
  - read-only once it ends;
  - removed with it, and one undo restores both;
  - counted on its card;
  - found and opened by Find.
- An encounter can open with a **Surprise** or an **Ambush** by one of its
  sides, set before anyone has acted and fixed after, once:
  - in round 1 Next passes an Ambush's defenders;
  - every effect the app doesn't apply is shown on the rows it applies to.
- A row on its turn can **Delay** until a typed trigger:
  - **Act now** gives it the turn any time that round;
  - Reset lists a delay never triggered as a missed action, and clears it.
- Undo covers every change.
- A crafted plan, opening, delay or clock owner in a file can't throw or
  write outside its record, and renders as text.
- At 390px nothing scrolls sideways, and every control is 44px.
- `npm run verify` and `npm run phone-check` pass. phone-check's two known
  OVER rows, on the player sheet's HP pill, fail on `main` too.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (see the header).
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** **no bump** (68). Nothing is added to `shadows-data.js`:
  the worksheet's printed lists and the objectives live in the engine, as
  S7's labels do.
- **Table schema:** **0.16 → N** (0.17), with a `migrateTable()` step:
  - each encounter gains an empty `design` and `opening: null`;
  - each row gains `delay: null`;
  - nothing is converted.
- **Pack schema, character schema, ruleset:** unchanged.
- **`private/`:** untouched; the pointer doesn't move.
- **Decisions:** the next two free numbers, **N** (the plan and an
  encounter's clocks) and **N+1** (the opening and Delay).

## 3. The decisions, drafted

Paste after the last decision, under INDEX §3's **GM mode** heading, filling
**Built**. Each must stay under 350 words, Touches included (`wc -w`). Both
are worded for the defaults; a different answer to an SQ rewords them.

```
N. **An encounter carries the book's Encounter Design worksheet as its plan, and owns clocks.**
     *2026-10-XX · Ken + Claude · Touches: encounters, design, hook, stakes, objectives, adversaries, terrain, hazards, city, beyond, beyondNotes, escalations, failure, success, escapes, failsafe, threads, milestones, pivot, stalls, ENCOUNTER_OBJECTIVES, ENCOUNTER_PROMPTS, editEncounter, The plan, clocks, on, encounter owner, addClock, clocksOn, removeEncounter, CLOCK_OWNER_RECORDS, tableActionLabel, tableSearch, openFound, encounter card, clockCountText, table schema N, sample table, Decision 188, Decision 208, Decision 212, Decision 241, Decision 244, Decision 245, Decision 251*
     - **Decided:** Table schema N gives an encounter `design`: the worksheet's (`2642`) fields as typed text, its adversaries as rows of four typed fields, and its objectives beyond defeat as picks from the book's six. Its printed prompts (exits, questions, when momentum stalls) are the book's text beside their notes, never stored. No type (188 stands). An encounter owns clocks as a faction and a place do; removing it removes them, and one undo restores both. The plan and its clocks are read-only once it ends.
     - **Why:** the worksheet is what the book hands a GM to prep a fight, so the plan is the worksheet and nothing more (244's rule); *Clock tightens* is the worksheet's own lever.
     - **Rejected:**
       - A Type field: the book's types blend (188), and the worksheet's own Hybrid box says so.
       - Adversaries as the encounter's rows: the plan is written before anyone is added.
       - The printed prompts as stored ticks: they are questions to ask, not state.
       - The plan editable after End: 188 keeps an ended encounter read-only.
     - **Replaces:** Decision 188 in part (an encounter carries its worksheet; its Revisit if's type is answered no), 208 in part (Find searches the plan and an encounter's clocks), 245 and 251 in part (an encounter owns clocks; its removal removes them).
     - **Revisit if:** the worksheet changes, seats (S3b) make adversaries or the crew links, or a GM wants the plan open after the fight.
     - **Built:** table schema N, switched off (173); log 2026-10-XX.

N+1. **A fight can open with a Surprise or an Ambush by one side, and a row can Delay until a trigger; the round runs both as the book says, and rolls nothing.**
     *2026-10-XX · Ken + Claude · Touches: opening, Surprise, Ambush, attackers, defenders, round 1, _pick, startEncounter, nextTurn, setOpening, delay, delayTurn, actNow, Delay, Act now, setTurn, resolveEncounterReset, applyEncounterReset, Reset, acted, endEncounter, removeSide, Wave Initiative, TIPS, table schema N, Decision 189, Decision 193, Decision 210*
     - **Decided:** An encounter's `opening` is null, or a Surprise or an Ambush by one of its sides, set before anyone has acted in round 1 and fixed after: once an encounter. In round 1, Next passes an Ambush's defenders; a Surprise's defenders read *Fast Actions only*; the attackers' bonus and Difficulty 10 are shown, never applied. A row on its turn can **Delay** until a typed trigger: it has acted, and shows the trigger and **Act now** for the rest of the round. Reset lists a delay never triggered as a missed action, then clears it. Turn order resumes as before.
     - **Why:** `0530` runs both at Engagement; the turn is the app's to keep (189), the dice and the hit the table's.
     - **Rejected:**
       - Rolling the Opposed Check: the table rolls (189).
       - Surprised and Ambushed as Conditions: `0540` has neither.
       - An Ambush as a reminder only: a skipped turn the GM must remember is what the tracker is for.
       - A delayed row moved in the order: the book says the order resumes as before.
     - **Replaces:** Decision 189 in part (round 1 passes an Ambush's defenders; Reset lists a missed delay).
     - **Revisit if:** a Silent sniper's continuing Ambush needs tracking, GQ30 reorders a wave, or the app rolls checks.
     - **Built:** table schema N, switched off (173); log 2026-10-XX.
```

**Supersession marks** (each ledger entry **and** its INDEX line, both by
hand: `docs.test.mjs` doesn't see a missing ledger mark):

- 188: *→ **Superseded in part by Decision N** — an encounter carries its
  Encounter Design worksheet as its plan; the worksheet's type isn't built.*
- 189: *→ **Superseded in part by Decision N+1** — round 1 passes an
  Ambush's defenders, and Reset lists a delay never triggered.* (Its existing
  mark line names 191, 210 and 220; add this as its own line below it, as
  208's marks are.)
- 208: *→ **Superseded in part by Decision N** — Find searches an
  encounter's plan, and finds its clocks.*
- 245: *→ **Superseded in part by Decision N** — an encounter owns clocks;
  removing it removes them.*
- 251: *→ **Superseded in part by Decision N** — an encounter owns clocks;
  removing it removes them.*

If the ledger search at build time finds another, stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ0 | **The worksheet's Type** (Combat / Social / Environmental / Hybrid). 188 rejected a type field and named this as its Revisit if. Build it as four boxes that change nothing? Or leave it out, since the Hybrid box admits the types blend and the hook can say it? | **Leave it out; 188 stands** | |
| SQ1 | **Adversaries:** free rows (a typed *Who*, offered the encounter's row names; Goals, Tactics, Leverage), as the worksheet prints them? Or one set of fields on each non-crew row of the encounter? | **Free rows**, as the worksheet | |
| SQ2 | **The worksheet's printed lists** (the four *Improvised GM Exit Options*, the three *Improv Prompts*, the five *When Momentum Stalls*): drawn as the book's text beside their notes field, never stored or ticked? | **As written** | |
| SQ3 | **Objectives beyond "Defeat Enemy":** the book's six as toggles (stored as ids), plus Notes? | **As written** | |
| SQ4 | **After End:** the plan and the encounter's clocks are read-only, as the rest of an ended encounter is (188)? Or stay editable (the *Hooks for Next Scene* written after the fight)? | **Read-only** | |
| SQ5 | **An Ambush in round 1:** Next passes the defenders, who are tagged *Ambushed: no turn this round*. Or a reminder only, with the GM pressing Next past them? | **Next passes them** | |
| SQ6 | **When the opening is set:** while the encounter is planned, or in round 1 before anyone has acted; fixed after (once per encounter). The Silent tag's continuing Ambush is the GM's, by the tip's text. | **As written** | |
| SQ7 | **Delay:** only on the row whose turn it is. The trigger is typed (blank allowed). The row counts as having acted; **Act now** gives it the turn any time that round, and Next then carries on from where the order was. Reset lists a pending delay as missed and clears it. | **As written** | |
| SQ8 | **The plan's place on the page:** a section *The plan*, open on a planned encounter and closed (a tap away) while it runs, hidden on an ended one with nothing written. | **As written** | |
| SQ9 | **The sample table *Dead Air*:** the stamp and the empty fields only? Or show the feature, with *Friday at the Velvet Lung* (planned) given a plan, an opening and a clock? | **The stamp and the empty fields only** (S12b's ruling) | |

## 5. The assumption sweep

Every reader below was found by grep on `a9eddad`. The three questions
(which guards read it; where it renders; what text points at it) are
answered in the last column.

| What changes | Today, where | After | Readers and twins |
|---|---|---|---|
| An encounter's fields | `_encounters` `engine.js:7968`; `addEncounter` `:8034`; `editEncounter` `:8044` | `design`, `opening` (§8) | `encounterView` (`:8713`): gains `design`, `opening` and each row's opening tag. `_encounterFields` (`:7269`, Find): gains the plan's text. `encListHtml` (`gm.js:2708`): the card's clock count. `endEncounter` (`:8493`): clears every `delay`. **`tools/sample-table.mjs` `:541`**: its encounter literal gains `design` (empty) and `opening: null`, regenerated (SQ9). `tests/sample-table.test.mjs`: unchanged, passes on the regenerated file |
| A row's fields | `_encRow` `:7935`; `addParticipant` `:8141`; `addToEncounter` `:8223` | `delay` | Every row constructor gains `delay:null`: `addParticipant`, `addToEncounter`'s rows, and the sample's row literal (`sample-table.mjs` `:546`). `encRowHtml` (`gm.js:2838`): the delay's line and **Act now**. `encounterWrapUp`: unchanged |
| The round | `_pick` `:8275`; its readers `startEncounter`, `nextTurn`, `removeParticipant`, `applyEncounterReset` | In round 1 an Ambush's defenders are passed | **All four readers of `_pick`** follow, because the rule lives in `_pick`. `setTurn` (`:8358`): refuses an ambushed row in round 1. `_encOrder`: unchanged (the order shown is the same; a passed row shows its tag). Wave Initiative (210): a side's wave passes the same rows |
| Reset | `resolveEncounterReset` `:8373`; `applyEncounterReset` `:8412`; `encResetHtml` `gm.js:2883` | Each row with a pending delay reports `missed`; apply clears every delay | `encResetHtml` lists it. The Reset tests (`grep -n "resolveEncounterReset" tests/`, `engine.test.mjs:4531`) check each row's keys one by one, so a new key breaks none (read) |
| A clock's owner | `_clockOwner` `:5963`; `addClock` `:7033` | `encounter` a known kind (`EN-` id) | `clocksOn` (`:7066`): generic. **`CLOCK_OWNER_RECORDS` (`:6265`)** gains `encounters:"encounter"`, which feeds **the removal collapse** in `tableActionLabel` (`:6273`) **and `_clockOwnerChanged`** (`:6266`). Check that adding a clock on an encounter's page still reads *Added …*: `addClock` stamps the table, not the encounter. **`tableSearch`'s clock loop (`:7306`)**: learns encounters. **`openFound`'s clock branch (`gm.js:462`)**: opens an encounter. **`clockCountText`** (`gm.js:1582`): the encounter card, the third twin after the faction and place cards |
| Removing an encounter | `removeEncounter` `:8093` | also removes every clock whose `on` names it | The collapse, through `CLOCK_OWNER_RECORDS`. The Delete dialog (`gm.js:3106`) names the count |
| The clock UI | `clocksHtml(owner)`, `bindClocks(main, owner)` `gm.js:1587–1591` | used by the encounter page; a read-only form | **`bindClocks` throws without `[data-clkadd]`**: the ended encounter's clocks are drawn by `clocksHtml(owner, { readOnly:true })`, which has no buttons, and aren't bound. The faction and place pages: unchanged (smoke tests are the proof) |
| Find | `tableSearch` `:7290ff`; `FIND_KINDS` `gm.js:413` | the plan's text on an encounter hit; an encounter's clock | `FIND_KINDS`: unchanged. A clock hit's `ownerKind` gains `"encounter"` |
| The schema stamp | `TABLE_SCHEMA_VERSION` `:6059`; the 0.16 step `:6158` | N, with its step | Every `"0.16"` table pin in `tests/` (`grep -rn '"0\.16"' tests/` → `engine.test.mjs`, `hostile.test.mjs`, `smoke-table-cast.test.mjs`, `smoke-table-play.test.mjs`; **not** the character `schemaVersion` "0.16" at `engine.test.mjs:3306`). **And the "newer" stamp:** `engine.test.mjs`'s *"A file from a newer app keeps its trail gated"* sets `newer.meta.tableSchemaVersion = "0.16"`, which is no longer newer at N, so the trail would be emptied. Move it to the version after N. `tools/sample-table.mjs:732` |
| Text that points at this | plan §4h's worksheet paragraph, §6 S10's *Later:* lines, S10f's row; STATE; `gm-mode/README.md`; the Delete dialog | S10f built; §4h says where the plan lives; the dialog names clocks | Grep the docs for *S10f*, *Encounter Design worksheet*, *Surprise*, *Delay* |

## 6. Read first

- `CLAUDE.md` whole: constraints 1, 6, 7, 8 and 10; *Decisions*; *Change
  tiers*; *Versions* (the table schema; why game data doesn't move).
- `docs/STATE.md` whole.
- `docs/SCHEMA.md` §3 (*The table file*: encounters, rows, clocks); §4,
  Decisions **188**, **189**, **193**, **210**, **241**, **244**, **245**,
  **251**.
- `docs/VOICE-APP.md`: controls are tool voice. **The worksheet's labels
  and printed lists are the book's**, never reworded.
- `private/crb/2642_Encounter_Design_Worksheet.md` whole;
  `0530_Combat_Encounters.md:120–176` (Engagement, Surprise and Ambush,
  Delaying an Action) and `:331–349` (When you can't defend, Reset). Never
  edited.
- **The code:**
  - `engine.js`: `_encounters`, `_encRow`, `addEncounter`, `editEncounter`,
    `addParticipant`, `addToEncounter`, `removeSide`, `removeEncounter`,
    `_encOrder`, `_pick`, `startEncounter`, `nextTurn`, `setTurn`,
    `resolveEncounterReset`, `applyEncounterReset`, `endEncounter`,
    `encounterView`, `_encounterFields`, `_clockOwner`, `addClock`,
    `clocksOn`, `CLOCK_OWNER_RECORDS`, `_clockOwnerChanged`,
    `tableActionLabel`, `tableSearch`.
  - `gm.js`: `encPageHtml`, `encRowHtml`, `encResetHtml`, `encListHtml`,
    `bindEncounters` and its press map, `TIPS.wave`, `clocksHtml`,
    `bindClocks`, `clockCountText`, `openFound`, `askFirst`.
  - `tools/sample-table.mjs` (the encounter and row literals).

## 7. Out of scope

- **Rolling anything:** the Opposed Check, Combat Sense, a delay's
  condition. The table rolls.
- **Applying a bonus or a Difficulty:** the +1, the +3 and Difficulty 10
  are shown and never applied. The hit dialog (S10b) is unchanged.
- **The Silent tag's continuing Ambush**, beyond the tip's text.
- **Combat Paralysis** going last: *Goes last* already does it by hand.
- **The worksheet's Type** (SQ0's default).
- **A site on an encounter** (251's Revisit if names S10f; nothing here
  wants one).
- **Unshakeable's *Synergy Bonus* wording** and Battle Hardened's +3: a
  `crb-catch-up.md` line only; the data isn't touched.
- **Printing an encounter** (S13b).
- **Anything in `private/`.**

## 8. The shapes

**An encounter** (`table.encounters[]`, table schema N) gains:

```js
  design: {
    hook: "", stakes: "", objectives: "",             // Encounter Basics: Scene Hook / Trigger, Core Stakes, Player Objectives
    adversaries: [ { who: "", goals: "", tactics: "", leverage: "" } ],
    terrain: "", hazards: "", city: "",               // Environment & Hazards: Terrain, Hazards / Pressure Points, NYTE City Interactions
    beyond: [ "protect" ], beyondNotes: "",           // Objectives Beyond "Defeat Enemy": ids from ENCOUNTER_OBJECTIVES, and Notes
    escalations: "", failure: "", success: "",        // Escalation & Consequences
    escapes: "", failsafe: "",                        // Finding an Out: Planned Escape Options, Fail-Safe Narrative Outcome
    threads: "", milestones: "",                      // Hooks for Next Scene
    pivot: "",                                        // GM Notes / Improv Prompts: Quick pivot
    stalls: ""                                        // When Momentum Stalls: Notes
  },
  opening: null | { kind: "surprise" | "ambush", side: "crew" },   // side: one of this encounter's sides, the attackers
```

**A row** gains:

```js
  delay: null | { until: "goes for the alarm" },   // set on its turn; kept only while running, cleared at Reset and at End
```

- **The gate** (`_encounters`):
  - `design` not an object → the empty plan. Each text key goes through
    `_str`. `adversaries` keeps objects only, each of its four keys through
    `_str`, **a row with all four blank kept** (it's being typed).
    `beyond` keeps the known ids only, each once, in `ENCOUNTER_OBJECTIVES`'
    order. **Unknown keys ride along**, at both levels.
  - `opening` is kept only as `{ kind }` of the two, with a `side` naming one
    of the encounter's sides, after the sides are gated. Anything else is
    null.
  - A row's `delay` is kept only on a running encounter, as an object with
    `until` through `_str`; anything else, or any other status, is null.
- **The N step** (`typeof arrived!=="string" || _versionNewer("0.17",
  arrived)`, with the literal N): each encounter's `design` → the empty plan
  and `opening` → null where missing, and each row's `delay` → null where
  missing. Nothing is converted.
- **`ENCOUNTER_OBJECTIVES`** (engine, exported): `[ { id, name } ]`, the
  book's six in its order:
  - `intercept` *Intercept / secure an item*
  - `force` *Force retreat / surrender / negotiation*
  - `stall` *Delay / stall enemy*
  - `intel` *Gather intel / leverage / resources*
  - `protect` *Protect person / asset*
  - `escape` *Create distraction / escape*

  The ids are the order's; the names are the book's, and the test reads them
  from the mirror. Find reads the names, so they live in the engine (S7's
  lesson).
- **`ENCOUNTER_PROMPTS`** (engine, exported): `{ exits:[…4], questions:[…3],
  stalls:[…5] }`, the book's printed lists, word for word. **A test reads
  each list from the mirror** and compares it; the order's copy isn't the
  source.
- **The clock gate** (`_clockOwner`): `encounter` joins `faction` and
  `place` as a known kind, kept with an `EN-` id (`ENCOUNTER_ID_RE`), else
  null. The unknown-kind rule is unchanged.

**Engine** (each is total: bad input gives a value, never a throw):

| Function | Does | On bad input |
|---|---|---|
| `editEncounter(t, id, f)` | also takes `design` as a whole object (gated as above); refuses an ended encounter, as today | `{ ok:false, why }` as today |
| `setOpening(t, encId, f)` | `f` null clears; `{ kind, side }` sets. Refused once anyone has acted, or after round 1: *"The fight has already opened."* A side not in the encounter: *"No such side."* An ended encounter: `_live`'s words. A running one in round 1 whose turn is now a passed row moves the turn to the next who can act | `{ ok:false, why }`, writing nothing |
| `_pick(e)` | as today, and in round 1 under an Ambush passes every row **not** on the attackers' side | — |
| `startEncounter` | as today. Under an Ambush whose attackers have no row that can act: *"<side> has nobody who can act."* | as today |
| `setTurn` | as today; refuses a passed row in round 1: *"<name> is ambushed this round."* | as today |
| `delayTurn(t, encId, rowId, until)` | only the row whose turn it is: sets `delay`, then does what `nextTurn` does (acted, the next pick, `reset:true` at the end) | `{ ok:false, why }`: not running, not its turn (*"It isn't <name>'s turn."*), at Reset |
| `actNow(t, encId, rowId)` | a row with a `delay`, while running and not at Reset: the turn goes to it, the delay is cleared | `{ ok:false, why }`: no delay (*"<name> isn't waiting."*), at Reset (*"The round is over."*) |
| `resolveEncounterReset` | each row also reports `missed`: its delay's `until`, or null | as today |
| `applyEncounterReset` | also clears every row's `delay` | as today |
| `endEncounter` | also clears every row's `delay` | as today |
| `removeSide` | also clears `opening` when it named the removed side | as today |
| `addClock(t, f)` | `f.on` a faction, a place **or an encounter** on the table that **hasn't ended** (*"<title> has ended."*) | `{ ok:false, why }` |
| `editClock`, `removeClock` | refused on a clock whose owner is an ended encounter (*"<title> has ended."*) | `{ ok:false, why }` |
| `removeEncounter(t, id)` | also removes every clock whose `on` names it | as today |
| `CLOCK_OWNER_RECORDS` | gains `encounters:"encounter"` | — |
| `tableSearch` | an encounter's fields gain each non-blank plan field (labelled by the worksheet's own field names, e.g. *Hook*, *Stakes*), each adversary's four fields, and the picked objectives' names. A clock is tested when its owner is a faction, a place **or an encounter** on the table, and the hit's `ownerKind` is `"encounter"` | as today |
| `encounterView` | also `design`, `opening` and, on each row in round 1 of an opening, `opening: "attacker" \| "surprised" \| "ambushed" \| null` | as today |

## 9. The UI

All in `gm.js` and the CSS. Tool voice; ✎ marks text for a voice pass.
**The worksheet's labels and printed lists are the book's**, drawn as text
and never reworded. Every control is a tap and 44px (plan §1a).

**No select writes.** Every new choice is a toggle group or a button: the
opening's kind, its side, an objective. The adversary's *Who* is a text
field with a datalist. There is no `<select>` to fire a change per option
(S12b's carried-over miss).

**The encounter page**, top to bottom (planned and running):

- The Name field, the bar (Start / Next / End), the turn toggles: as today.
- ✎ **Opening** (planned, or round 1 before anyone has acted):
  - a toggle group *None* · *Surprise* · *Ambush*, with one always pressed;
  - when not *None*, ✎ *By* and a toggle group of the encounter's sides by
    their titles (*The crew*, *The other side*…);
  - a `?` tip each, `TIPS.surprise` and `TIPS.ambush`: the book's bullets
    from `0530`, plus the *Limits* line.

  Afterwards (running past that point, or ended) it shows as text in the bar
  when set: *Round 1 · Ambush by The crew*, then nothing after round 1.
- **The rows**, as today, plus, in round 1 of an opening:
  - an attacker's row: a tag ✎ *+3 to their first attack* (*+1* for a
    Surprise);
  - a defender's row: ✎ *Ambushed: no turn, attacked at Difficulty 10*, or
    ✎ *Surprised: Fast Actions only*.
- **On the active row**, beside its actions: ✎ **Delay**. It opens a small
  field ✎ *Until…* (placeholder ✎ *the door opens*) with **OK** and
  **Cancel**. OK runs `delayTurn`.
- **A row with a delay:** under its name, ✎ *Waiting: <until>* (or ✎
  *Waiting* when blank), and ✎ **Act now**.
- **Reset's list:** a row with `missed` gains ✎ *Waited for “<until>”; it
  didn't happen: no action this round.* (✎ *Waited, and nothing came: no
  action this round.* when blank).
- ✎ **Clocks** (`h2`): `clocksHtml({ kind:"encounter", id })`, S7's clock
  exactly. It shows while planned and running, rows or Reset; it's hidden
  during the wrap-up.
- ✎ **The plan** (`h2`, a disclosure): open while planned, closed while
  running (SQ8). Its sections are `h3`s with the worksheet's headings, in
  its order:
  - *Encounter Basics*: Scene Hook / Trigger, Core Stakes, Player
    Objectives (textareas).
  - *NPCs / Adversaries*: one row each, with *Who* (a text field, the
    datalist of the encounter's row names), *Goals*, *Tactics* and
    *Leverage/Pressure*, and **Remove** (✎ aria *Remove <who>*, else
    *Remove adversary <n>*; **it follows the typed name**, S12b's
    carried-over miss). Then ✎ **Add an adversary**.
  - *Environment & Hazards*: three textareas.
  - *Objectives Beyond “Defeat Enemy”*: six toggles (`aria-pressed`, any
    number) and Notes.
  - *Escalation & Consequences*: three.
  - *Finding an Out*: Planned Escape Options; ✎ *Improvised GM Exit
    Options* with the book's four as a list; Fail-Safe Narrative Outcome.
  - *Hooks for Next Scene*: two.
  - *GM Notes / Improv Prompts*: the book's three as a numbered list; Quick
    pivot.
  - *When Momentum Stalls*: the book's five as a list; Notes.
- Add to the encounter, Delete: as today.

**An ended encounter:** the `h1`, the bar, the rows; **Clocks** read-only
(`clocksHtml(owner, { readOnly:true })`: names, boxes, *n of m*, *when
full*, no buttons; absent when there are none); **The plan** read-only, as
text, only the fields with something in them (absent when empty).

**The encounter card** gains `clockCountText`: *Round 2 · 4 in it · 1
clock*. An empty part is left out, never drawn as `· ·`.

**Delete** on an encounter with clocks asks, danger: ✎ *Delete <title>?* /
✎ *It and its 1 clock aren't kept anywhere else unless you've exported the
table.* With none, today's text.

**Refused and empty** (`WORK-ORDERS.md`; S12b's carried-over miss: each
line for every way it happens):

| Field | Refused or empty | Shows |
|---|---|---|
| A plan text field | blank is kept | its label, nothing else; Find skips it |
| An adversary row | all four blank is kept (being typed); Find skips blanks | its placeholders |
| An objective toggle | can't be refused | pressed or not |
| The opening | refused once anyone has acted, or after round 1, or on an ended encounter: the controls aren't drawn then, so the only refusal is a race; its `why` goes to `notice` | the opening as text |
| The opening's side | a side removed: the opening clears | *None* pressed |
| Delay's *Until…* | blank allowed | *Waiting* |
| Delay, not this row's turn | the button isn't drawn on any other row | — |
| Act now at Reset | the button isn't drawn at Reset; a pending delay shows in Reset's list | Reset's line |
| A clock on an ended encounter | read-only, no buttons | the stored values |
| Ambush whose attackers can't act | Start refused: *"<side> has nobody who can act."* (no row on that side, or every one Out) | the bar as before |

**Where things land** (each write's **Activity label**, as probed on
`main`: every write inside an encounter reads *Changed <encounter>*):

| Press | The record | The view | Focus | Activity |
|---|---|---|---|---|
| A plan field, typed | `design.<key>` (212 folds typing) | no redraw while typing | stays | *Changed <encounter>* |
| **Add an adversary** | a blank row | the adversaries redraw | the new row's *Who* | *Changed <encounter>* |
| **Remove** on an adversary | removed | the adversaries redraw | the next row's *Who*, else **Add an adversary** | *Changed <encounter>* |
| An objective toggle | `beyond` ± id | that toggle repaints in place | stays | *Changed <encounter>* |
| **Opening** kind or side | `opening` | the opening block and the rows' tags redraw | the pressed toggle | *Changed <encounter>* |
| **Start** under an Ambush | as today, the first attacker's turn | as today | Next (as today) | *Changed <encounter>* |
| **Delay** → OK | `delay`, acted, the next turn | the page redraws | the new active row (as Next does) | *Changed <encounter>* |
| **Act now** | the turn; `delay` cleared | the page redraws | that row (as the turn's landing does) | *Changed <encounter>* |
| Reset's apply | delays cleared | as today | as today | as today |
| **Add a clock** | a clock on the encounter | S7's | S7's | *Added <clock>*: `addClock` stamps the table, not the encounter, so `_clockOwnerChanged` stays false |
| A clock's other presses | S7's table, unchanged | | | *Changed <clock>* / *Removed <clock>*, as on a faction |
| **Delete** an encounter with clocks | removed with its clocks | the list | **New encounter** (as today) | *Removed <encounter>* (its clocks collateral) |
| A Find hit on an encounter's clock | — | its page, scrolled to the clock | the clock's name (`h3`, S7's) | — |
| A Find hit on an encounter by its plan | — | its page | its title, as today | — |

**At width:** the plan's fields, an adversary row (four fields wrap to one
a line at 390px), the opening's toggles and a delay's line wrap;
`overflow-wrap:anywhere` on every typed text.

## 10. Worked examples, as named tests

Write these first. Show each failing on `main` for the reason it states (not
an `undefined`), and record the output in the PR. Those that pass on `main`
by design say so.

**`tests/engine.test.mjs`**, *The encounter's plan (N)* and *Its opening and
Delay (N+1)*:

- **`N: the worksheet's lists are the book's`**: `ENCOUNTER_OBJECTIVES`'
  names and `ENCOUNTER_PROMPTS`' three lists equal the mirror's
  (`2642`), read by the test from the file, item for item, in order.
- **`N: editEncounter writes the plan whole and the gate types it`**:
  - text keys `_str`'d;
  - an adversary that is a string is dropped, and one with four blanks kept;
  - `beyond: ["protect","x","protect"]` → `["protect"]`;
  - an unknown key rides;
  - an ended encounter refuses, writing nothing.
- **`N: an encounter owns clocks; removing it removes them, and one undo restores all`**:
  - deep-equal through `undoBase`;
  - one Activity entry, *Removed Warehouse*;
  - a faction's removal in the same table still collapses.
- **`N: addClock, editClock and removeClock refuse an ended encounter's clock`**:
  each returns *"<title> has ended."* and writes nothing.
- **`N: the clock gate knows an encounter owner, and still keeps one it doesn't know`**:
  - `{ kind:"encounter", id:"EN-…" }` kept;
  - `{ kind:"encounter", id:"X" }` → null;
  - `{ kind:"heist", id:"HE-AAAAAAAA" }` kept, as 251.
- **`N: Find finds an encounter by its plan and an encounter's clock by its words`**:
  - *buyer* (in the hook) → an encounter hit on *Hook*;
  - *protect* → on its objective's name;
  - *alarm* → the clock, with `ownerKind` `encounter`.
- **`N: a 0.16 table gains an empty plan, no opening and no delays, and converts nothing`**:
  - every encounter's `design` is the empty plan and `opening` is null;
  - every row's `delay` is null;
  - `newTable()` → `addEncounter` → `editEncounter({ design })` →
    `migrateTable` round-trips (constraint 8).
- **`N+1: an Ambush passes the defenders in round 1 and only then`**:
  - three PC rows on the crew (12, 9, 7) and two on the other side (10, 8),
    with an Ambush by the crew;
  - Start → 12; Next → 9 → 7 → Reset (both defenders passed);
  - after Reset, round 2 runs all five by Combat Sense;
  - `setTurn` on a defender in round 1 is refused.
- **`N+1: a Surprise passes nobody, and its rows are tagged`**:
  `encounterView` round 1 tags `attacker` and `surprised`; round 2 tags
  nothing.
- **`N+1: the opening is set before anyone acts and fixed after`**:
  - set while planned → ok;
  - in round 1 after one Next → refused, writing nothing;
  - a side removed → the opening clears;
  - Start under an Ambush whose side has nobody who can act → refused.
- **`N+1: Delay counts as acted, Act now takes the turn back, and Next carries on`**:
  - one at a time, rows A12 B9 C7: Start (A); `delayTurn(A, "door")` → B's
    turn, A acted;
  - `actNow(A)` → A's turn, delay null; Next → B (unacted, first in order);
    Next → C;
  - `actNow` on a row with no delay is refused.
- **`N+1: Reset lists a delay never triggered as missed, and clears it`**:
  `resolveEncounterReset` → that row's `missed: "door"`; apply → `delay`
  null, and round 2's order is the same as round 1's.
- **`N+1: End clears every delay, and the gate drops one off a running encounter`**.
- **Version pins:** every table `"0.16"` assertion moves to N. Find them by
  `grep -rn '"0\.16"' tests/`, **not** this list. **Not** a character's
  `schemaVersion` (`engine.test.mjs:3306`). **The "newer" stamp** in
  *"A file from a newer app keeps its trail gated"* (`grep -n
  'newer.meta.tableSchemaVersion' tests/`) moves to the version after N.

**`tests/smoke-table-play.test.mjs`** (or a new `smoke-table-encplan.test.mjs`
with its own helpers), switched on, each reading what is drawn:

- **`N: an encounter's plan is the worksheet: its fields type and keep, and its printed lists show`**:
  - focus after **Add an adversary** is on the new *Who*;
  - typing fires `input` and `change`, one Activity entry, and no toast
    while typing;
  - Remove's aria-label follows the typed *Who*;
  - each objective toggle's `aria-pressed` follows a tap;
  - the four exits, three questions and five stalls are drawn;
  - the headings go `h2` *The plan* → `h3` sections, never `h4` straight
    under `h2`.
- **`N: an encounter's clocks: add, +, −, edit, delete, and read-only once it ends`**:
  - S7's presses on an encounter's page;
  - after End there are no clock buttons and the page has no errors
    (`bindClocks` isn't called).
- **`N: deleting an encounter asks with its clock count, and Undo from Activity restores both`**.
- **`N: Find opens an encounter's clock on its name`**.
- **`N: the encounter card counts its clocks, and leaves out an empty part`**.
- **`N+1: an Ambush by the crew: Start, then Next passes the other side in round 1`**:
  - the tags are drawn (*+3 to their first attack*, *Ambushed: …*);
  - the opening controls are gone after the first Next;
  - round 2 has no tags.
- **`N+1: Delay on the active row, then Act now`**:
  - Delay → *Until…* focused, OK → the next row is active;
  - *Waiting: door* and **Act now** drawn on the delayed row;
  - Act now → that row is `aria-current`;
  - a Reset with a missed delay shows its line.
- **`N: the faction's and the place's clocks behave as before`**: re-run S7's
  and S12b's clock presses (the guard for `clocksHtml`'s read-only form).

**`tests/hostile.test.mjs`:**
- **A table** whose encounter carries markup in every plan field and
  adversary field, a `beyond` of `["__proto__", {}]`, an `opening` of
  `{ kind:"__proto__", side:"crew" }` and of `{ kind:"ambush",
  side:"<img>" }`, a row `delay` of `{ until:"<img onerror>" }` on a running
  encounter, and a clock whose `on` is `{ kind:"encounter", id:"<img>" }`.

Rendered as text on the encounter page, its card, Reset and Find; no `img`
in the page; `Object.prototype` untouched; the version pins move.

## 11. Tests beyond the examples

- **Totality:** `setOpening`, `delayTurn`, `actNow`, `editEncounter`,
  `encounterView`, `resolveEncounterReset` on `null`, `{}`, an encounter
  whose `design` is a number, whose `opening` is a string, a row whose
  `delay` is an array.
- **Voice:** every ✎ string through `tests/voice.test.mjs`.
- **The data guard** (135): no data key is added.
- **Mutation-test** each (record each in the PR with what caught it). Check
  each for a second path first; find each site by `grep`, never a line
  number; run each narrowly (`node --test --test-name-pattern="…"
  tests/<file>` under a `timeout`):
  1. `_pick` ignoring the opening (`grep -n 'function _pick'`) → *an Ambush
     passes the defenders…*.
  2. The opening passing the defenders after round 1 too → same test (its
     round-2 assertion).
  3. `removeEncounter` leaving its clocks → *an encounter owns clocks…*.
  4. `CLOCK_OWNER_RECORDS` without `encounters` → same test (its one-entry
     assertion).
  5. `tableSearch` testing only factions' and places' clocks → *Find finds
     an encounter…*.
  6. `applyEncounterReset` not clearing `delay` → *Reset lists a delay…*.
  7. `actNow` not clearing `delay` → *Delay counts as acted…*.
  8. `addClock` accepting an ended encounter → *addClock, editClock and
     removeClock refuse…*.
  9. The ended page calling `bindClocks` → smoke *…read-only once it ends*
     (an error from the missing *Add a clock*).

## 12. Steps

`git submodule update --init private`; `npm run test:fast` before starting
(a fresh branch from `main`); the targeted files after each step.

1. Take the two decision numbers and the table schema version: the lowest
   free on `origin/main`. Search the ledger again for the pre-flight's names.
2. **The plan:** `ENCOUNTER_OBJECTIVES`, `ENCOUNTER_PROMPTS`, the gate, the
   N step, `editEncounter`, `encounterView`'s `design`, `_encounterFields`;
   the version pins and the "newer" stamp; **`tools/sample-table.mjs` and
   the regenerated sample** (SQ9). Engine tests, `sample-table.test.mjs`.
3. **Clocks:** `_clockOwner`, `addClock` / `editClock` / `removeClock`'s
   ended rule, `removeEncounter`, `CLOCK_OWNER_RECORDS`, `tableSearch`.
   Engine tests.
4. **The round:** `opening` and `delay` in the gate, `setOpening`, `_pick`,
   `startEncounter`, `setTurn`, `delayTurn`, `actNow`, Reset,
   `endEncounter`, `removeSide`. Engine tests.
5. **The page:** `clocksHtml`'s read-only form first, with the faction's
   and place's smoke tests green; then the plan, the opening, the tags,
   Delay and Act now, Reset's line, Clocks, the card, the Delete dialog,
   Find's branch, the tips.
6. **Hostile** tests; CSS at 390px.
7. **In the browser** (`shadows-dev-preview`, `?gm=on`):
   - A new encounter: fill the plan, two adversaries (type a *Who*,
     Remove), objectives, and check the printed lists against the book.
   - Add a clock; +, −, edit.
   - Three PCs and two others; Ambush by the crew; Start; Next through
     round 1 (the others passed); Reset; round 2 runs all.
   - A Surprise on another encounter: the tags, then none in round 2.
   - Delay with a trigger, Act now, Next carries on; a missed delay at
     Reset.
   - End: the clocks and the plan read-only, no console errors.
   - Delete an encounter with a clock; Undo from Activity. Find *alarm*, and
     a word from the hook.
   - A faction's and a place's clocks, every press.
   - **390px**, **768 × 1024** and **1300px**; `npm run phone-check`.
   - **Both themes:** the opening's toggles, the tags and the plan are new.
     **Report it if** any text is under 4.5:1 or a control's edge is under
     3:1.
   - **Keyboard:** Tab through the opening and the objectives; ↑/↓ change
     nothing anywhere (there is no select that writes).
8. The mutations (§11).
9. Ledger (N, N+1; 188, 189, 208, 245 and 251 marked **in both SCHEMA and
   INDEX**), INDEX, SCHEMA §3 (an encounter's `design` and `opening`, a
   row's `delay`, the clock owner rule, schema N), the plan (S10f's row moved
   to *Built*; §4h's worksheet paragraph names *The plan*; §6 S10's *Later:*
   lines updated), STATE, `crb-catch-up.md` (below), close-out (§14).

## 13. Stop and ask

- N (0.17) is taken, or the ledger search finds a decision these override
  that the pre-flight doesn't name.
- The mirror's `2642` or `0530` differs from the pre-flight's reading (eight
  headings, six objectives, four exits, three questions, five stalls;
  Surprise +1, Ambush +3, once per encounter).
- Any rule needs a value the book doesn't give: **don't guess one** (203).
- A test needs an exception for one record or string.
- The read-only clock form changes any S7 or S12b behaviour (a faction or
  place smoke test fails for a reason other than a moved function).
- Anything needs a roll, or applies a bonus or a Difficulty.
- **A new control needs a `<select>` that writes.** Use a toggle group, or
  stop and ask.
- An existing test needs a change beyond:
  - the version pins and the "newer" stamp;
  - Reset's rows gaining `missed`;
  - the encounter Delete dialog's text where it has clocks;
  - the sample table's regeneration.
- Undo's round trip of an encounter's removal isn't deep-equal.
- The voice test flags new copy, or a decision goes over 350 words.
- **Not a stop:**
  - the version literal moving;
  - `engine.test.mjs`'s *"208: a search over 200 members and 100 sessions
    is quick"* failing on timing while the dev preview runs, if it passes
    run alone;
  - phone-check's two OVER rows on the player sheet's HP pill.

## 14. Close-out

*Rule or shape* tier, switched off, table schema N, **no `private/`
commit** (say so in the PR body):

- **SCHEMA:** N and N+1; the marks on 188, 189, 208, 245 and 251 **in the
  ledger**; §3's encounter `design` and `opening`, a row's `delay`, the
  clock owner rule, schema N in the schema note.
- **INDEX:** N and N+1 under **GM mode**; the five lines marked. **Check
  each mark by eye** in both files.
- **STATE:** the versions line (table schema N); §1's GM mode line (*built
  through S7, S10f and S12b*, or as STATE words it); §3's GM mode row and
  §5's *Next*. Keep within the word and line-length guard.
- **The plan:**
  - S10f's row moves from *Still to build* to *Built* (Decisions N, N+1);
  - §4h's worksheet paragraph says it's *The plan* on an encounter;
  - §6 S10's *"Later: the Encounter Design worksheet, an encounter's clocks
    (S7), Surprise, Ambush and Delay"* and *"S10 is done but for…"* lines
    read as built.
- **`crb-catch-up.md`**, under Combat: Unshakeable (`0430:575`) says
  *"Surprise grants no Synergy Bonus against you"*, but `0530`'s Surprise
  gives the attackers +1 to their first attack and names no Synergy Bonus.
  One of them is stale.
- **`changelog-pending.md`:** ✎ *Encounter plans. An encounter keeps the
  book's Encounter Design worksheet and its own clocks, and a fight can open
  with a Surprise or an Ambush; a character can Delay until something
  happens.*
- **Log** entry:
  - why the plan is the worksheet and no more (244's rule), and why no
    Type;
  - why an Ambush passes turns and nothing else is applied;
  - why a delay counts as acted;
  - the read-only clock form;
  - the sample table's handling (SQ9).

  **Shipped** row *(switched off)*. README's table: S10f's row.
- **PR** titled `feat(gm): an encounter's plan, opening, Delay and clocks,
  switched off (S10f, Decisions N and N+1)`. Body sections:
  - what changed;
  - *Evidence*: every claim names its command or test; the §10 tests
    failing on `main`; each mutation; each changed existing test, by name,
    with what changed;
  - the browser check;
  - *Voice pass*: every ✎ string, for Ken through the conductor;
  - **Where the order didn't fit**.

**Review checklist:**

- [ ] **Every answer Ken recorded** (SQ0–SQ9 here, and any PR comment in his
      words) **is in the code**, checked one by one.
- [ ] **In the browser, by the reviewer** (§12's step 7, by clicking): the
      plan; an encounter's clocks; an Ambush through round 1 and into round
      2; a Surprise; Delay and Act now; a missed delay at Reset; End
      read-only; Delete and Undo; Find; a faction's and a place's clocks.
- [ ] **The worksheet against its source:** the reviewer reads `2642` and
      checks every heading, field label and printed list on the page, word
      for word. `0530`'s Surprise, Ambush and Delay lines against the tips
      and tags.
- [ ] **No `<select>` writes anything** (`grep -n '<select' ` the diff);
      ↑/↓ on the page change nothing in the table.
- [ ] Nothing is rolled or applied: no bonus, no Difficulty, no Condition
      (`grep` the diff for `+3`, `Difficulty`, `addCondition`).
- [ ] Every write's Activity label is §9's.
- [ ] A 0.16 file's encounters gain the empty plan, no opening and no
      delays, and nothing is converted; a crafted plan, opening, delay or
      owner renders as text.
- [ ] Undo covers every change, deep-equal.
- [ ] Only the named tests changed (§13's list); no one-entry exception;
      every smoke test reads what's drawn.
- [ ] The sample table regenerated exactly per SQ9's answer.
- [ ] 390px: nothing scrolls sideways; every control 44px.
- [ ] 188, 189, 208, 245 and 251 marked **in the ledger and INDEX**; the
      table schema everywhere it's written; no game-data bump; `private/`
      untouched.
- [ ] Two mutations re-run locally, one of them the round (1 or 2).
- [ ] Every "report it if" has an answer in the PR, and *Where the order
      didn't fit* is there, empty or not.
- [ ] The final `npm run verify` is on the PR's final commit.

## 15. Handing it over

The conductor starts **S10f build** (Sonnet) with the building prompt in
`docs/WORK-ORDERS.md` and this order's path,
`docs/plans/gm-mode/S10f-encounter-plan.md`, and **S10f review** (Opus)
once the PR is open. The traps, under the builder's prompt:

- **The plan is the worksheet and nothing more** (244). Its labels and
  printed lists are the book's, checked against the mirror by test, never
  the order's copy.
- **No select writes.** Toggle groups and buttons only (S12b's Use).
- **The Ambush rule lives in `_pick`**, so its four readers follow. Don't
  special-case Next.
- **A delay counts as acted.** Act now moves the turn; Next then picks the
  first unacted row, which is how the order resumes.
- **`bindClocks` throws without *Add a clock*.** An ended encounter's clocks
  use `clocksHtml`'s read-only form and are never bound.
- **`CLOCK_OWNER_RECORDS` feeds two readers**: the removal collapse and
  `_clockOwnerChanged`. Adding a clock on an encounter must still read
  *Added …*.
- **Attribute names:** the encounter page already uses `data-erow` and
  `data-ename`, and so do S12b's Exposure rows. Pick new names for every new
  control (e.g. `data-eplan`, `data-eadv`, `data-eopen-kind`,
  `data-edelay`).
- **The sample table follows the shape** (SQ9): regenerate it with
  `node tools/sample-table.mjs`.
- **Grep the next version literal too:** the "newer" stamp test breaks at
  N.
- **Rolls nothing, applies nothing:** the +1, the +3 and Difficulty 10 are
  text.
- **Guess nothing** (203): no opening from a row's Stealth, no objective
  from the hook.
- **Fire `change` as well as `input`** on every field the page binds.
- **Every supersession mark goes in the ledger and in INDEX.**
  `docs.test.mjs` sees only INDEX.
- **Numbers aren't reserved:** take the next free decision numbers and the
  schema version when you write them.
- **Ken's answers land in the order or as PR comments.** Re-read both before
  each push.
- **Preview by clicking**, in both themes and at three widths, and answer
  every "Report it if" in the PR.
- **Verify last.** The final `npm run verify` runs on the commit the PR ends
  on.
