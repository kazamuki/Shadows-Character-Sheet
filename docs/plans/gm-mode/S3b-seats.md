# Work order S3b — Seats: players, their characters, and the card spread

**Plan:** [`../gm-mode.md`](../gm-mode.md) §1 (*see the table at a glance*,
*get the sheets in*), §4a (*Storage*), §4c (`players`, a seat's status), §6
*S3b* and *Still to build*'s S3b row; GQ9, GQ13, GQ19.
**Status:** **drafted 2026-10-29 by Claude (Opus)**, the S10f reviewer, after
#266 (S10f, Decisions 252–253) merged (`WORK-ORDERS.md`, step 7). **Ken chose
this session (2026-10-29).** Not yet approved.
**Branch:** from `main` at `85de7bc` or later, PR to `main`, switched off
(Decision 173). **No `private/` commit.**
**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md):
the conductor (Opus) starts **S3b build** (Sonnet), then a fresh **S3b
review** (Opus) once the PR is open. Builder and reviewer message each other
directly. Anything for Ken goes to the conductor. §15 is the hand-over.
**Runs alone.** It touches the following:
- `engine.js`: the table gate, a new *Seats* section, `TABLE_RECORDS`,
  `_recName`, `crewView`, `awardTotals` and `tableSearch`.
- `gm.js`: a new tab, `TABLE_SECTIONS`, Find, the name datalists and
  `sessionCrewNames`.
- The CSS, the sample table, the ledger and STATE.

**Table schema N** (0.18 if still free when you build: `main` is 0.17 at
`85de7bc`). Two decisions, **N** and **N+1** below.

**Tier: Rule or shape.** A new kind of record on the table, a character file
kept inside another file, a new tab, and a rule for how a typed name becomes a
person.

### The scope, and what this order leaves to the next two (SQ0)

The plan's S3b row has four parts: players, import, the card spread, and the
read-only sheet. **This order builds the first three and leaves the read-only
sheet to its own order, S3c.** The pre-flight measured the read-only sheet:
- every write on the sheet goes through `commit()` (`shared.js:293`) at 129
  call sites in `sheet.js`, or through `update()` at 16;
- `update()` saves `S.ch` into the player's roster (`saveChar`,
  `shared.js:161`);
- the sheet's chrome reads `S.screen==="sheet"` in `app.js`.

Rendering a seated copy read-only means auditing every one of those paths, and
proving none can write either into the table or into the GM's own roster. That
is an order's worth of pre-flight on its own, and S10f's lesson is that a big
order's misses hide in its biggest part. Until S3c, a card opens the seat's
page, not the sheet. **SQ0 asks Ken.**

The plan also asks for **a PC row claimed by a seat that takes the whole hit
on a copy of the character** (191's and 188's *Revisit if*). That changes the
encounter's hit path and needs the read-only copy's numbers, so it waits for
S3c and is named **S3d** here. Neither one is built in this order.

**Carried over from S10f's review** (#266, one fix round; Ken's answers are in
issuecomments 6501681987 and 6501731208). Each item is marked as the order's,
the build's, or the process's:

- **The order's: a label the order paraphrased where the book had its own.**
  §9 said *Who*, while the order's own trap said every worksheet label is the
  book's. The book's header is *NPC/Enemy*, and Ken kept it. **This order
  quotes every label it takes from the book.** Every other label is marked ✎.
- **The order's: a reader of the changed function the order didn't cover.**
  It said nothing about `setTurn` on a delayed row. Reset then told the GM
  that a row which had acted didn't act. Ken ruled to clear the delay. **This
  order's sweep lists, for every new field, every function that moves the
  thing that field describes** (§5). Here that is the seat's names, read by
  every reader that compares a typed name.
- **The order's: a bad-input case left open.** It didn't say what a
  non-object `design` does. Ken ruled to refuse it. **§8's table gives every
  new engine function its answer to every bad input it can get.**
- **The order's: drafted copy that dropped one of the book's effects.** The
  Ambushed tag left out *"cannot defend"*. Ken took the reviewer's draft.
  **This order's card copy is checked against what the sheet itself shows**,
  not paraphrased (§9).
- **The build's: a refusal missed for a row in a state the button didn't
  expect.** **Act now** worked on a row that was Out. **Here, every press on a
  seat is checked against each of its four statuses** (§9, *Refused and
  empty*).
- **The build's: a turn left where it was after the rule that chose it
  changed.** **Here, every derived view (the card, the folded list, Find) is
  read fresh from the record**, never cached in the UI state.
- **The build's: a fix that also changed what it didn't need to.** K4's tip
  relabel replaced the aria-labels too. **Say what a change keeps** (§9).
- **The build's: comments said N where the number was known, and a
  disclosure had no marker.** `summary{display:flex}` drops Chromium's ▶.
  **Fill N everywhere at build time**, comments included. A disclosure on this
  page keeps its marker.
- **Process: a note the conductor couldn't open.** The reviewer's notes file
  lived where the conductor's session couldn't read it. **Anything meant for
  the conductor goes as message text**, not as a path.

**Pre-flight** (`docs/WORK-ORDERS.md`, *The pre-flight*) against `main` at
**`85de7bc`**, 2026-10-29. Every function below was opened and read. The line
numbers are `85de7bc`'s.

- **Nothing of seats exists.** `players` and `seats` appear nowhere in
  `src/`. A new table's keys are `meta, notes, cast, places, factions, clocks,
  interactions, encounters, sessions, threads, audit`. Probe: a table carrying
  `players` and `copies` keeps both through `migrateTable` as unknown keys,
  **ungated**. A crafted copy's `stats.BOD: "lots"` comes through untouched.
- **A character file.**
  - Its TAG is `meta.id` (`newIntakeId`, `engine.js:33`, `TAG-XXXX-XXXX-XXXX`).
    A TAGless character has one too (Decisions 133, 148).
  - It names no player: `identity` has `name` and `archetype`, nothing else
    of the kind.
  - `meta.updated` is "last changed" (Decision 128).
  - `fileKind` (`:6069`) reads a file with no `meta.kind` as a character.
  - Home's import (`wizard.js:850ff`) routes a table or pack to
    `gmImportFile`, and a character to the roster through `guardReplace`. That
    is the "older copy asks" precedent (B18, 141).
- **The character's readers aren't total on a non-character.** `hlState`,
  `painState`, `sanState`, `luckState` and `ipState` throw on `null`, `{}` or
  `5` (probe). They are total on a `migrate()` output. **So the seat reader
  must only ever call them on a migrated copy.**
- **Their keys** (probe on `migrate(newCharacter())`):
  - `hlState` gives `hpLeft`, `total`, `levels`, `lost`, `down` and more.
  - `painState` gives `level`, `label`.
  - `sanState` gives `current`, `max`; `luckState` gives `current`, `max`.
  - `ipState` gives `available`; `crankState` gives `tier`, `rep`.
  - `skillLine(ch, "awareness")` gives `checkBonus`.
  - `tagNumber(ch)` gives the TAG's reading.
  - `trackers.conditions` is a list, and `trackers.credits.current` the
    balance.
  - CRANK shows only under `featureOn("crank")` (`crankOn`, `shared.js:121`).
- **Size.**
  - A new character is 1,594 bytes. With 300 trivial audit entries it is
    50,277 bytes (probe). A played character's loadout and longer audit put
    a real one well above that.
  - **`saveTable` (`gm.js:32`) stringifies the whole table on every save**,
    and `update()` saves on every keystroke anywhere in the table. Six copies
    are re-serialized each time. This order measures it (§12, GQ9).
- **The table's activity log** (Decision 212):
  - `TABLE_RECORDS` (`:6234`) decides what `diffTable` sees and what a file's
    trail may touch (`_tableOpOk`, `:6391`).
  - `_recName` (`:6245`) names a record for a label.
  - `undoTableAction` (`:6368`) re-runs `migrateTable` after every undo, so
    anything the gate checks stays checked after an undo.
  - Probe: an edit to `players` today records nothing (`noop`).
  - **A record in the log carries its whole value in every `before`.** A
    seat's copy in the log would put a whole character into an entry on every
    re-import, up to 500 entries.
- **Typed names that mean a member of the crew** (the readers a seat must
  answer to):
  - `sessions[].present` and `close.lines[].name` (Decisions 203, 205);
  - `interactions[].crew` (177);
  - a PC row's `name` (188);
  - a place's `exposure[].name` (251).
  - `crewView` (`:6707`) groups the lines by folded name.
  - `awardTotals` (`:7447`) sums the award log by folded name.
  - `sessionCrewNames` (`gm.js:1831`) unions every source for the
    *Who was there* datalist.
  - The *Crew* datalist on lines (`gm.js:729`) and the Exposure datalist
    (`:1261`) read `crewView`'s names.
  - The encounter's **PC name** field (`gm.js:3050`) has no datalist.
  - Probe: lines naming *Dez* and *dez okafor* are two groups in `crewView`.
- **Names taken.**
  - `crewView` is an engine function. The Cast tab has a **Crew** view
    (`S.castView==="crew"`, Decision 179), so **a new tab can't be called
    Crew** without two things of that name.
  - `data-pl` is the wizard's.
  - Free: `seatFor`, `seatView`, `addPlayer`, `removePlayer`, `importSeat`,
    `setSeat`, `removeSeat`, `data-seat`, `data-player`.
- **The tabs.**
  - `TABLE_SECTIONS` (`gm.js:258`) is Sessions, Cast, City, Threats,
    Encounters, Reference, Notes.
  - Seven tests pin that list (§10).
  - The icons `tab_main` and `tab_progression` are free.
- **Find.** `FIND_KINDS` (`gm.js:413`) has nine kinds, and `tableSearch`
  (`:7306`) has a loop per kind.
- **The ledger,** searched by name (the **Touches** lines and the text):
  *seat, player, roster, TAG, crew, present, attendance, close-out, award log,
  older copy, replace guard, import, card, read-only, Exposure, crewView,
  awardTotals, tableSearch, Find, tabs, activity log*. Hits:
  - **141** (the roster): **cited.** A seat's copy lives in the table and
    never in the GM's own roster (§4a). Home's import is unchanged.
  - **128**, **133** (`meta.updated`, the TAG): **cited.** A seat is keyed by
    the TAG, and copies are ordered by `meta.updated`.
  - **124** (an untrusted file): **cited.** A copy goes through `migrate()` in
    the table's gate.
  - **170**, **171** (the table file, Home's import): **cited.**
  - **177** (interactions, *"with the crew as typed names until seats
    exist"*): **superseded in part.** Seats exist and the crew stays typed;
    a typed name reads as the seat that answers to it.
  - **179** (*Who knows what*, `crewView`): **superseded in part.** A seat's
    names fold into one group, headed by the character's name.
  - **188**, **191** (a PC row; *Revisit if: seats arrive*): **cited, not
    triggered here.** A PC row on a seated copy is S3d.
  - **203** (*Revisit if: S3b's seats claim attendance*): **superseded in
    part.** `present` stays typed, and a seat answers to its names.
  - **204** (a table opens on Sessions): **cited.** Sessions stays first. The
    precedent is that a tab added after it (207's Reference, 243's City)
    replaced nothing.
  - **205** (*Revisit if: S3b's seats arrive (the lines name seats)*):
    **superseded in part.** The lines stay typed, and `awardTotals` folds a
    seat's names into one row.
  - **208** (Find): **superseded in part.** Find finds a seat.
  - **212** (the activity log): **superseded in part.** `players` is a record
    the log covers, and a seat's copy is outside it.
  - **251** (Exposure rows are typed names): **cited.** Its datalist offers
    the seats' names through `crewView`.
  - **252** (*Revisit if: seats (S3b) make adversaries or the crew links*):
    **weighed, not triggered.** Adversaries are NPCs and stay free rows. The
    crew isn't made into links: a seat answers to typed names (Decision N's
    **Rejected**).
  - **Marks checked by eye in both SCHEMA and INDEX, today:**
    - 177: *by 193*.
    - 179: *by 241*.
    - 203: none.
    - 205: none.
    - 208: *by 243; 244–245; 251; 252*.
    - 212: *by 243; 244–245*.
  - **Since 253:** none.
- **Numbers:** the ledger ends at **253**, and the table schema is **0.17**.

---

## 1. Goal

Before Friday's game Scott opens his table and adds three players: **Brogan**,
**Ana** and **Teo**. He drops Brogan's two exported files onto Brogan's group:
*Dez*, his main, and *Wren*, his backup. Then Ana's file, and Teo's.

The **Players** tab draws one card per character, grouped by player:
- **Health, Awareness and Conditions** first;
- then the name, archetype and TAG;
- then Pain, SAN, Luck, Çredits, IP to spend and the CRANK tier;
- and how old the copy is.

He marks Wren **Benched**, and her card folds below.

Sessions 1 to 5 were run before seats existed, so their attendance, award log
and lines say *Dez* and *dez okafor*. On Dez's page Scott sees that Dez
**answers to** *Dez*, and he adds *Dez Okafor*. From then on, each of these
reads both names as Dez:
- the card's *Last at Session 5 · 40 IP so far*;
- the Sessions tab's IP totals;
- the Cast tab's *Who knows what*.

Nothing stored is rewritten.

After the session, Brogan sends a new export. Scott drops it in and Dez's card
updates. Teo sends an old file by mistake, and the app asks before taking it.

**Done when:**

- Switched off: nothing changes anywhere.
- A table has **players**, each with **seats**:
  - a seat is a character, by its TAG;
  - it has a status (*Active*, *Benched*, *Retired*, *Dead*);
  - it has the names it **answers to**.
- **Import** takes one or more character files onto a player:
  - a new TAG is seated;
  - a newer copy of a seated TAG updates it, wherever it sits;
  - the same copy says so;
  - an older copy asks;
  - a draft, or a file that isn't a character, is refused by name.
- A seat's **copy** goes through `migrate()` every time the table is gated, so
  a crafted copy can't throw or carry an unchecked value. It sits outside the
  activity log.
- **The card spread:**
  - one card per active seat, grouped by player, in §9's order;
  - benched, retired and dead seats fold below their player;
  - a seat with no copy says so.
- A typed name reads as the seat that answers to it, case and spacing aside,
  in `crewView`, `awardTotals`, the card's history and Find. A name two seats
  answer to reads as neither.
- Every typed-name field that names the crew offers the seats' names.
- Undo covers every change to players and seats, deep-equal.
- **Measured:** a realistic table's size and its save time, in the log.
- At 390px nothing scrolls sideways, and every control is 44px.
- `npm run verify` and `npm run phone-check` pass. phone-check's two known
  OVER rows, on the player sheet's HP pill, fail on `main` too.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (see the header).
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** **no bump** (68). Nothing is added to `shadows-data.js`.
- **Table schema:** **0.17 → N** (0.18), with a `migrateTable()` step: an
  empty `players` and an empty `copies` where missing. Nothing is converted,
  and no seat is guessed from a typed name.
- **Character schema:** unchanged. A copy is migrated to the app's own
  version, as every import is.
- **Pack schema, ruleset:** unchanged.
- **`private/`:** untouched.
- **Decisions:** the next two free numbers, **N** (players, seats and their
  copies) and **N+1** (the Players tab, import and the card spread).

## 3. The decisions, drafted

Paste them after the last decision, under INDEX §3's **GM mode** heading, and
fill in **Built** (with the PR number). Each must stay under 350 words,
Touches included (`wc -w`). Both are worded for the defaults; a different
answer to an SQ rewords them.

```
N. **A table seats its players' characters: a seat is a character by its TAG, with a status and the names it answers to; its copy is the last file imported, gated by migrate(), outside the activity log.**
     *2026-10-XX · Ken + Claude · Touches: players, seats, tag, status, names, answers to, copies, importedAt, migrate, migrateTable, importSeat, setSeat, removeSeat, seatFor, seatView, TABLE_RECORDS, activity log, crewView, awardTotals, typed names, present, crew, close.lines, table schema N, Decision 141, Decision 177, Decision 179, Decision 203, Decision 205, Decision 212*
     - **Decided:** Table schema N adds `players`, each with seats (a TAG, a status: active, benched, retired or dead, and the names it answers to), and `copies`, one per seated TAG: the last character file imported. The gate runs each copy through `migrate()` and drops one no seat names. A typed name anywhere reads as the seat that answers to it, ignoring case, the character's own name included; a name two seats answer to reads as neither. Nothing typed is rewritten. Players and seats are in the activity log; copies aren't.
     - **Why:** a seated character lives in the table, never the GM's roster (plan §4a). Names that answer to a seat carry typed history over without converting a record (constraint 7). A copy in the log would carry a whole character per import.
     - **Rejected:**
       - Rewriting typed names into seat links: it converts five record kinds, guesses which *Dez* is which, and loses the spelling.
       - The copy inside the seat: every re-import would put a whole character into the activity log.
     - **Replaces:** Decisions 177, 203 and 205 in part (crew, attendance and the award log stay typed, read as seats), 179 in part (*Who knows what* folds a seat's names), 212 in part (players are logged; copies aren't).
     - **Revisit if:** S3c or S3d needs more of the copy than its file, a table outgrows storage (GQ9), or the dispatch (S2) needs a seat to address.
     - **Built:** table schema N, switched off (173); PR #…; log 2026-10-XX.

N+1. **A table's Players tab is its card spread: one card per active seat grouped by player, Health, Awareness and Conditions first; import takes several files onto a player, a newer copy updates its seat and an older one asks.**
     *2026-10-XX · Ken + Claude · Touches: Players tab, TABLE_SECTIONS, card spread, seat card, seat page, Import characters, answers to, status, Benched, Retired, Dead, older copy, draft, Find, FIND_KINDS, openFound, datalist, PC name, GQ13, GQ19, Decision 204, Decision 208*
     - **Decided:** A tab **Players** after Sessions lists each player and their active seats as cards: Health, Awareness and Conditions, then name, archetype and TAG, then Pain, SAN, Luck, Çredits, IP to spend, the CRANK tier when CRANK is on, and how old the copy is. Other statuses fold below their player. **Import characters** on a player takes several files: a new TAG is seated there; a newer copy updates its seat wherever it is; the same copy says so; an older one asks; a draft or a non-character is refused by name. A card opens the seat's page: its status, its names, Replace and Remove. Find finds a seat by its names.
     - **Why:** Scott's three come first (§1a); the rest is what a GM reads off a sheet. A copy is a snapshot (GQ19), so the card says how old it is.
     - **Rejected:**
       - Opening the sheet from a card now: the read-only sheet is its own order (S3c).
       - A tab named Crew: the Cast tab has a Crew view (179).
       - A select for status: a toggle group (S12b's ruling).
     - **Replaces:** Decision 208 in part (Find finds a seat).
     - **Revisit if:** S3c builds the read-only sheet (a card opens it), GQ1 reorders the tabs, or a GM wants a seat moved between players without a re-import.
     - **Built:** table schema N, switched off (173); PR #…; log 2026-10-XX.
```

**Supersession marks.** Put each one on the ledger entry **and** on its INDEX
line, both by hand: `docs.test.mjs` doesn't see a missing ledger mark. Add
each as its own line below the existing marks.

- 177: *→ **Superseded in part by Decision N** — the crew stays typed names, read
  as the seat that answers to them.*
- 179: *→ **Superseded in part by Decision N** — *Who knows what* folds a seat's
  names into one group.*
- 203: *→ **Superseded in part by Decision N** — attendance stays typed names,
  read as seats.*
- 205: *→ **Superseded in part by Decision N** — the award log's lines stay typed,
  and its totals fold a seat's names.*
- 208: *→ **Superseded in part by Decision N+1** — Find finds a seat.*
- 212: *→ **Superseded in part by Decision N** — `players` is a record the log
  covers; a seat's copy isn't.*

If the ledger search at build time finds another, stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ0 | **Scope.** This order builds players, seats, import and the card spread. The read-only sheet becomes its own order (**S3c**). The pre-flight found 129 `commit()` sites and the roster save to audit, so it needs its own pre-flight. A PC row taking hits on a seat's copy follows it (**S3d**). Or build all of it in one order? | **Split: S3c and S3d follow** | |
| SQ1 | **The tab's name and place:** **Players**, after Sessions? *Crew* is taken by the Cast tab's view (179). *Table* (the plan's sketch) names the whole thing. | **Players, second** | |
| SQ2 | **How a typed name becomes a seat:** a seat **answers to** names (its character's own, plus any the GM adds), and every reader matches typed names against them, with nothing rewritten? Or convert the typed names into seat links once? | **Answers to; nothing rewritten** | |
| SQ3 | **The copy and the activity log:** the copy sits outside the log. Importing or replacing one isn't undoable from Activity (the player's file is the source), while seats and players are. Removing a seat keeps its copy until the table is next opened, so Undo brings both back. Or put copies in the log, at a whole character per import? | **Outside the log** | |
| SQ4 | **Which files seat:** a **locked** character only. A draft is refused (*"Ana's Vex isn't locked yet: there's no sheet to read."*). Or seat drafts too? | **Locked only** | |
| SQ5 | **Import's target:** files go onto **the player whose Import was pressed**, and a TAG already seated updates its own seat wherever it sits. Or one Import for the tab that asks a player per file? | **Onto that player** | |
| SQ6 | **The card's numbers:** §9's list, Scott's three first. CRANK only when CRANK is on. Or fewer? | **As listed** | |
| SQ7 | **How a typed name reaches a seat's history:** `crewView` (*Who knows what*), `awardTotals` (the Sessions tab's IP totals) and Find fold a seat's names into one. The card shows *Last at Session N · X IP so far*. Session pages, the close-out sheet and lines still show each name as typed. Or fold everywhere? | **Fold in those three and the card only** | |
| SQ8 | **Removing a player** with seats: one dialog naming how many characters go with them. Or refuse until the seats are removed? | **One dialog, with the count** | |
| SQ9 | **The sample table *Dead Air*:** the stamp and the empty fields only (S12b's and S10f's ruling)? Or seat its crew from typed names, which needs character files the sample doesn't have? | **The stamp and the empty fields only** | |

## 5. The assumption sweep

Every reader below was found by grep on `85de7bc`. The last column answers the
three questions for each row: which guards read it, where it renders, and what
text points at it.

| What changes | Today, where | After | Readers and twins |
|---|---|---|---|
| The table's keys | `newTable` `engine.js:6061`; `migrateTable` `:6075` | `players`, `copies` (§8) | `newTable` gains both, empty. **`TABLE_RECORDS` (`:6234`)** gains `players`, **not** `copies`. That feeds `diffTable`, `_tableOpOk`, the removal collapse in `tableActionLabel` and `_tableCore`. `_recName` (`:6245`) gains `players` (its name, else *Unnamed player*). `CLOCK_OWNER_RECORDS`: unchanged (a seat owns no clock). **`tools/sample-table.mjs`**: the stamp and two empty keys, regenerated (SQ9). `tests/sample-table.test.mjs`: unchanged |
| A copy's character | none | `migrate()` in the gate | **`undoTableAction` (`:6368`) re-runs the gate**, so an undo re-migrates every copy. That is correct and costs one `migrate()` per copy per undo (measured, §12). `saveTable` (`gm.js:32`) stringifies copies on every save (measured). `exportTable` writes them, since the file is the save (GQ9) |
| A typed name, read as a seat | `crewView` `:6707`; `awardTotals` `:7447`; `sessionCrewNames` `gm.js:1831`; the datalists `gm.js:729`, `:1261`, `:1917`, `:2212` | `seatFor(t, name)` folds a name to a TAG or null | `crewView`: groups by seat where a name answers to one, headed by the character's name. Its datalist readers follow on their own. `awardTotals`: the same (Sessions tab, `gm.js:2143`). `sessionCrewNames`: active seats' names first, then the rest. **The encounter's PC name field (`gm.js:3050`)** gains the `sess-crew` datalist. Its row name stays typed (S3d). **Not changed (SQ7):** the session page's *Who was there* text, the close-out sheet's lines, a line's sentence (`interactionSentence`), Exposure rows |
| Find | `tableSearch` `:7306`; `FIND_KINDS` `gm.js:413`; `openFound` `gm.js:442` | a `seat` kind | A seat is tested by its character's name, its names, its player's name and its TAG. It opens the seat's page and lands on its `h1` |
| The tabs | `TABLE_SECTIONS` `gm.js:258`; the tab binder `:275`; `renderTable` `:310` | **Players** second (SQ1) | `S.tsection==="players"`; the binder clears `S.seatOpen`; the seven tab-list pins in tests (§10); the back-label reader (`gm.js:812`) |
| The schema stamp | `TABLE_SCHEMA_VERSION` `:6060`; the 0.17 step `:6167` | N, with its step | Every table `"0.17"` pin in `tests/` (`grep -rn '"0\.17"' tests/`). **Not** the character `schemaVersion` "0.17" at `engine.test.mjs:3071`. **The "newer" stamp:** `engine.test.mjs:7372` sets `newer.meta.tableSchemaVersion = "0.18"`, which **is** N, so it moves to the version after N. `tools/sample-table.mjs:736` |
| Text that points at this | plan §4b's tab table, §4c, S3b's section and row; SCHEMA §3's *"until S3b's seats claim them"* (twice); WISHLIST W68's *"until S3b's seats claim them"*; STATE; `gm-mode/README.md` | S3b built; S3c and S3d named | Grep the docs for *S3b*, *seat*, *claim* |

## 6. Read first

- `CLAUDE.md`, whole: constraints 1, 6, 7, 8 and 10; *Decisions*; *Change
  tiers*; *Versions* (the table schema).
- `docs/STATE.md`, whole.
- `docs/SCHEMA.md`:
  - §3 (*The table file*: sessions, `close`, interactions, encounters' rows,
    places' `exposure`; the step history);
  - §4: Decisions **124**, **128**, **141**, **170**, **171**, **177**, **179**,
    **203**, **205**, **208**, **212**.
- `docs/plans/gm-mode.md` §1a (Scott's *Health, Awareness and Conditions*),
  §4a, §4c, S3b.
- `docs/VOICE-APP.md`: controls are tool voice.
- **The code:**
  - `engine.js`:
    - the table: `newTable`, `migrateTable`, `TABLE_RECORDS`, `_tableCore`,
      `diffTable`, `_recName`, `_recLabel`, `tableActionLabel`, `_tableOpOk`,
      `undoTableAction`;
    - the names: `crewView`, `awardTotals`, `tableSearch`;
    - the character: `migrate`, `fileKind`, `hlState`, `painState`,
      `sanState`, `luckState`, `ipState`, `crankState`, `skillLine`,
      `tagNumber`.
  - `gm.js`: `TABLE_SECTIONS`, the tab binder, `renderTable`, `saveTable`,
    `openFound`, `FIND_KINDS`, `sessionCrewNames`, the datalists, the cast
    card (`castCardHtml`, the card precedent), `askFirst`, and the encounter
    Delete dialog (the count precedent).
  - `wizard.js:850ff` (Home's import and `guardReplace`: the older-copy
    precedent).
  - `shared.js`: `charName`, `crankOn`.

## 7. Out of scope

- **The read-only sheet** (S3c, SQ0). A card opens the seat's page.
- **A PC row on a seat's copy** (S3d). PC rows stay typed names with the GM's
  scratch numbers (188, 191).
- **Writing anything into a copy.** No award, note or hit reaches it; that is
  S2/S4's dispatch.
- **Rewriting a typed name** anywhere (SQ2).
- **Moving a seat to another player**, except by Remove and a new import.
- **Home's import.** A character imported on Home still goes to the roster.
- **The dispatch, an inbox, CRANK writes.**
- **Anything in `private/`.**

## 8. The shapes

**The table** (table schema N) gains:

```js
  players: [ {
    id: "PY-XXXXXXXX",               // the TAG alphabet; unique in the table; a bad or repeated one is replaced
    name: "",                        // the GM's; blank reads "Unnamed player"
    seats: [ {
      tag: "TAG-XXXX-XXXX-XXXX",     // the character's meta.id; a seat's identity, unique across the table (the first kept)
      status: "active",              // active | benched | retired | dead; anything else reads active
      names: [ "" ]                  // typed names it answers to besides its character's own; trimmed rows, a blank kept (it's being typed)
    } ],
    created: "<ISO>", updated: "<ISO>"
  } ],
  copies: [ {                        // outside the activity log (not in TABLE_RECORDS)
    tag: "TAG-XXXX-XXXX-XXXX",       // a seat's TAG; one copy per TAG (the newest meta.updated kept); a copy no seat names is dropped
    importedAt: "<ISO>",             // when the GM imported it, or null
    character: { … }                 // migrate()'s output, every time the table is gated
  } ],
```

- **The gate** (`migrateTable`):
  - `players` keeps objects. Each id is checked and replaced if bad or
    repeated. `name` goes through `_str`.
  - `seats` keeps objects whose `tag` passes `isIntakeId`, each TAG once
    across the whole table (the first kept). `status` is one of four, else
    active. `names` is strings through `_str`, trimmed.
  - Unknown keys ride along at every level.
  - `copies` keeps objects whose `tag` names a seat, one per TAG. Of two, the
    later `character.meta.updated` is kept, else the first. `importedAt` goes
    through `_isoOrNull`. `character` becomes `migrate(character)`, and a
    copy whose `migrate()` output has a different `meta.id` from its `tag` is
    dropped.
  - **The order matters:** players first, then copies, which read the seats.
- **The N step** (`typeof arrived!=="string" || _versionNewer("0.18",
  arrived)`, with the literal N): `players` → `[]` and `copies` → `[]` where
  missing. Nothing is converted.
- **`seatFor(t, name)` → `tag | null`.** Fold the name (`_fold`, trimmed,
  case-insensitive). A seat matches if its copy's `identity.name` folds equal,
  or one of its `names` does. One match gives its TAG. None, or two or more,
  gives null. **Every status counts**: a dead character's name still means
  them in Session 2's log.

**Engine.** Each function is total: bad input gives a value, never a throw.
Every write stamps the table.

| Function | Does | On bad input |
|---|---|---|
| `addPlayer(t, f)` | `{ name }` → a player with no seats, at the end. Returns `{ ok, id }` | not a table → *"That isn't a table."* |
| `editPlayer(t, id, f)` | writes `name` | no such player → *"No such player."* |
| `removePlayer(t, id)` | removes it and its seats; their copies drop at the next gate | as above |
| `importSeat(t, playerId, raw, opts)` | `raw` is a parsed file. Returns `{ ok, did, tag, name }` with `did` one of `"seated"`, `"updated"`, `"same"`. A new TAG is seated on `playerId` as active, with no names. A seated TAG's copy is replaced when `raw`'s `meta.updated` is later, `"same"` when equal. Earlier needs `opts.older===true`, else `{ ok:false, older:true, why }`. Sets `importedAt` to now | not a character (`fileKind`) → *"That isn't a character."*; not locked → *"<name> isn't locked yet: there's no sheet to read."*; no such player → *"No such player."*; older without `opts.older` → *"This is an older copy of <name> than the table's."* Nothing written on any refusal |
| `setSeat(t, tag, f)` | `status` (one of four) and/or `names` (an array of strings), each as given | no such seat → *"No such character at this table."*; a bad status → *"Choose Active, Benched, Retired or Dead."*; `names` not an array → *"That isn't a list of names."*. Nothing written |
| `removeSeat(t, tag)` | removes the seat; the copy stays until the next gate | no such seat → as above |
| `seatFor(t, name)` | above | not a table, or not a string → null |
| `seatView(t, tag)` | `{ tag, player:{ id, name }, status, names, copy }`. `copy` is null when there's none. Otherwise it is `{ importedAt, updated, name, archetype, tagNumber, health:{ hpLeft, total, lost, levels, down }, awareness, conditions:[ name ], pain:{ level, label }, san:{ current, max }, luck:{ current, max }, credits, ip, crank:{ tier } }`, read from `migrate()`'s output only. It also has `history:{ sessions, last, ip }`: the closed logs' present lines and IP whose name answers to this seat, and the last session it was present at | null for no seat. **Each reader runs inside try**: one that throws gives that part null, never the whole view |
| `playerList(t)` | `[ { player, active:[seatView], folded:[seatView] } ]` in the table's order, seats in their order | `[]` |
| `crewView` | as today, but a name that answers to a seat groups under that seat, headed by its character's name and carrying `tag` | as today |
| `awardTotals` | as today, the same fold, each row carrying `tag` or null | as today |
| `tableSearch` | a `seat` hit: the character's name, its `names`, the player's name and the TAG | as today |
| `TABLE_RECORDS` | gains `players` | — |

## 9. The UI

All of it lives in `gm.js` and the CSS. It is tool voice; ✎ marks text for a
voice pass. Every control is a tap target of 44px (plan §1a).

**No select writes.** Status is a toggle group (S12b's ruling). Names are
typed rows with **Add a name** and **Remove**, as a faction's *Tipping* lines
are.

**The Players tab** (second, icon `tab_main`):

- **Add a player:** a Name field and ✎ **Add a player**, as the cast's quick
  add. Enter adds.
- **Empty table:** ✎ *"Nobody seated yet. Add a player, then import their
  characters."*
- **Each player** is an `h2` with their name, then:
  - ✎ **Import characters**: a file input taking several `.json` files;
  - their active seats as cards (`roster-card`, as the cast's);
  - then a disclosure, ✎ *Benched, retired and dead (n)*, with those seats'
    cards, each tagged with its status. It is absent at n = 0 and keeps its ▶.
  - A player with no seats: ✎ *"No characters yet."*
  - ✎ **More**: Rename (a field), **Remove** (a danger button).
- **A card** is a button opening the seat's page, as the cast card's
  `cast-open` is. Its lines, in this order:
  1. **Health:** *HP 14 of 20* and the Health Levels lost
     (*2 Health Levels lost*). *Down* when `down`.
  2. **Awareness** *+N*, from the sheet's own number (`skillLine`'s
     `checkBonus`).
  3. **Conditions:** their names joined by commas, else ✎ *No Conditions*.
  4. The character's name (the button's text), archetype and TAG
     (`tagNumber`).
  5. *Pain* and its level name (`painState.label`); *SAN* n/max; *Luck*
     n/max; *Çredits* n; ✎ *IP to spend* n; the CRANK tier's name (only
     under `crankOn()`).
  6. ✎ *Changed <date>* (the copy's `meta.updated`, as the GM's local date)
     and ✎ *Imported <date>*.
  7. ✎ *Last at Session N · X IP so far*, when `history.sessions` > 0.

  **The words are the sheet's.** For each label, grep `sheet.js` and use
  what the sheet shows the player. ✎ marks only words the sheet doesn't have.
  A seat with no copy: its name from its first `names` row, else its TAG, and
  ✎ *"No copy yet. Import their file."* An empty part is left out, never
  drawn as `· ·`.
- **Import's results** go into one `notice`, a line per file:
  - ✎ *Seated Dez*
  - ✎ *Updated Dez*
  - ✎ *Dez is already up to date.*
  - the refusal's `why`, after its file name (*"vex.json: That isn't a
    character."*).

  An older copy asks first, one dialog per file, danger: ✎ *"Use an older
  copy of Dez?"* / ✎ *"This file was changed <date>; the table's copy was
  changed <date>."* with ✎ **Use the older copy** / **Cancel**. The rest of
  the batch goes on either way.

**The seat's page** (a card's open):

- **Back to players**; an `h1` with the character's name; the card's numbers
  as the page's first block.
- ✎ **Status:** a toggle group, *Active* · *Benched* · *Retired* · *Dead*,
  one always pressed.
- ✎ **Answers to:** the character's own name as text (✎ *always*), then the
  `names` rows. Each row is a text field with **Remove** (aria ✎ *Remove
  <name>*, else *Remove name <n>*; **it follows the typed name**). Then ✎
  **Add a name**. Under them, ✎ *"Sessions, the award log and lines that use
  any of these names count as <character>."* When a name is also another
  seat's: ✎ *"<name> also answers to <other>, so it counts as neither."*
- ✎ **Replace from a file**: one file, through `importSeat` on this seat's
  player. A different TAG is seated as new, and the notice says so.
- ✎ **Remove from the table** (danger). It asks: ✎ *"Remove Dez?"* / ✎
  *"Dez's copy goes with the seat. Undo brings both back until the table is
  next opened; after that, import the file again."*

**Remove a player** (SQ8) asks, danger: ✎ *"Remove Brogan?"* / ✎ *"Brogan and
their 2 characters go. Undo brings them back until the table is next opened."*
With no seats, the second sentence is ✎ *"Undo brings them back."*

**The PC name field** in an encounter gains the `sess-crew` datalist. **It
keeps** its placeholder and its label.

**Find** gains ✎ *Players* in `FIND_KINDS`. A hit opens the seat's page and
lands on its `h1`.

**Refused and empty** (`WORK-ORDERS.md`). Each line covers every way it
happens:

| Field or press | Refused or empty | Shows |
|---|---|---|
| A file that isn't JSON, or isn't a character (a table, a pack, anything else) | refused, by file name | the notice line |
| A draft | refused, by name | the notice line |
| An older copy | asks; Cancel writes nothing | the dialog |
| A seat with no copy (removed, then the table reopened; or gated out) | nothing to read | *No copy yet*, and Replace |
| A copy one of whose readers fails | that part is left out | the rest of the card |
| A name row | a blank is kept (being typed); `seatFor` skips blanks | its placeholder |
| A name two seats answer to | it counts as neither | the warning line on both pages |
| Status on a seat with no copy | allowed | the toggle |
| **Every press on a seat, for each status** | Import, Replace, Remove, Status and names work the same for all four; only the card's place differs | — |

**Where things land** (each write's **Activity label**):

| Press | The record | The view | Focus | Activity |
|---|---|---|---|---|
| **Add a player** | a player, at the end | the tab redraws | the new player's **Import characters** | *Added Brogan* |
| **Import characters**, a new TAG | a seat on that player; a copy | the tab redraws | the first new card, else Import | *Seated Dez* (explicit label: the copy isn't in the log, the seat is) |
| Import, a newer or the same copy | the copy only | the card redraws | Import | none (nothing in the log changed) |
| Import, an older copy, **Use** | the copy only | the card redraws | Import | none |
| **Status** | `status` | the page's toggle repaints | the pressed toggle | *Changed Brogan* (the parent's change, as 251) |
| A name typed | `names[i]` (212 folds typing) | no redraw while typing | stays | *Changed Brogan* |
| **Add a name** / **Remove** | a row | the rows redraw | the new row; else the next row, else **Add a name** | *Changed Brogan* |
| **Replace from a file** | as Import | the page redraws | the `h1` | as Import |
| **Remove from the table** | the seat | the Players tab | the player's **Import characters** | *Removed Dez* (explicit: the record is a player, the name is the seat's) |
| **Remove** a player | it and its seats | the tab | **Add a player** | *Removed Brogan* |
| Undo of any of these | as the log restores it, then the gate | as today | as today | — |

**At width:** at 390px a card's lines wrap. The name rows wrap one field to a
line, and the status toggles wrap. `overflow-wrap:anywhere` goes on every
typed text and the TAG.

## 10. Worked examples, as named tests

Write these first. Show each one failing on `main` for the reason it states
(not an `undefined`), and record the output in the PR. Any that pass on `main`
by design say so.

**`tests/engine.test.mjs`**, *Seats (N)* and *The Players tab (N+1)*. The
fixture writes its character files with `newCharacter()`, a name, `locked:
true` and an explicit `meta.updated`:

- **`N: a 0.17 table gains no players and no copies, and converts nothing`**:
  `players` and `copies` are `[]`. A table with sessions naming *Dez* has no
  seat afterwards. A table with players round-trips through `migrateTable`
  (constraint 8).
- **`N: importSeat seats a new TAG, updates a newer copy, says the same one is the same, and asks before an older one`**:
  - four files of one TAG at three `meta.updated` values give `seated`,
    `updated`, `same`, then `{ ok:false, older:true }` with nothing written;
  - with `{ older:true }` it gives `updated`;
  - a seated TAG imported onto another player stays on its own.
- **`N: importSeat refuses a draft, a table, a pack and a non-object, by name, writing nothing`**.
- **`N: a copy is migrate()'d by the gate, and one no seat names is dropped`**:
  - a crafted copy with `stats.BOD:"lots"` comes out a number;
  - a copy whose `character.meta.id` differs from its `tag` is dropped;
  - after `removeSeat`, the copy survives until `migrateTable`, then goes;
  - two copies of one TAG keep the later.
- **`N: seatFor reads a typed name as the seat that answers to it, and a shared name as neither`**:
  - *" DEZ "* → Dez's TAG; *Dez Okafor* → null until added to `names`, then
    the TAG;
  - a name two seats answer to → null;
  - a dead seat still answers.
- **`N: crewView and awardTotals fold a seat's names into one, headed by the character's name`**:
  - lines naming *Dez* and *dez okafor* make two groups on `main` and one
    after;
  - the award log's IP for both names sums to one row carrying `tag`.
- **`N: players and seats are in the activity log and copies aren't; one undo restores a removed seat with its copy`**:
  - `addPlayer` gives *Added Brogan*; a status change gives *Changed
    Brogan*;
  - a re-import records nothing;
  - `removeSeat` then undo is deep-equal through `undoBase`, the copy
    included.
- **`N: seatView reads the copy's numbers and is total`**:
  - a character with 3 damage and a Condition gives `health.hpLeft`, the
    Condition's name, `awareness` equal to `skillLine`'s `checkBonus`, and
    `history` for two closed sessions;
  - a seat with no copy gives `copy: null`;
  - a copy whose `trackers` is a string after a crafted file (the gate fixes
    it, so build the bad object after the gate) gives those parts null,
    never a throw.
- **`N+1: Find finds a seat by an extra name, its player and its TAG`**.
- **Version pins:**
  - every table `"0.17"` assertion moves to N. Find them with
    `grep -rn '"0\.17"' tests/`, **not** this list, and leave out the
    character `schemaVersion` at `engine.test.mjs:3071`;
  - **the "newer" stamp** at `engine.test.mjs:7372` (`"0.18"`) moves to the
    version after N.

**`tests/smoke-table-seats.test.mjs`** (new, with its own helpers), switched
on. Each test reads what is drawn:

- **`N+1: the Players tab is second, and a new table says nobody is seated`**.
- **`N+1: Add a player, then Import characters takes two files onto them as two cards`**:
  - jsdom's `input.files` is set with a `DataTransfer`, or the helper the
    existing pack-import tests use;
  - the cards' first three lines are Health, Awareness and Conditions, in
    that order;
  - focus lands on the first new card;
  - Activity reads *Seated Dez*.
- **`N+1: an older copy asks; Cancel writes nothing; Use takes it`**.
- **`N+1: Benched folds a card below its player, and the disclosure keeps its marker`**:
  `getComputedStyle(summary).display` is `list-item`.
- **`N+1: Answers to: a name typed counts the old sessions, and Remove's label follows it`**:
  - adding *Dez Okafor* changes the card to *Last at Session 5 · 40 IP so
    far*;
  - `aria-label` reads *Remove Dez Okafor*.
- **`N+1: Remove from the table asks, and Undo from Activity brings the seat and its copy back`**.
- **`N+1: Find opens a seat's page on its h1`**.
- **`N+1: the encounter's PC name field offers the seats' names`**.
- **The tab-list pins** move: `smoke-table-cast.test.mjs:73`, `:288`,
  `:1086`; `smoke-table-city.test.mjs:44–47` (its name too);
  `smoke-table-play.test.mjs:40`, `:591–592`, `:1325`. Find them by
  `grep -rn '"Sessions", "Cast"' tests/` and `grep -rn '"sessions", "cast"'
  tests/`.

**`tests/hostile.test.mjs`:**
- **A table** with all of the following:
  - a player named `<img onerror>`;
  - a seat whose `tag` is `__proto__` and one whose `tag` is `<img>`;
  - a status of `{}`;
  - `names: ["<img>", 5, null]`;
  - a copy whose `character` is a string, one that is a 2 MB note, and one
    whose `identity.name` is markup;
  - two seats sharing a TAG across two players.

  Each renders as text on the Players tab, a seat's page and Find. There is
  no `img` in the page, `Object.prototype` is untouched, and the version pins
  move.

## 11. Tests beyond the examples

- **Totality:** `addPlayer`, `editPlayer`, `removePlayer`, `importSeat`,
  `setSeat`, `removeSeat`, `seatFor`, `seatView` and `playerList` on `null`,
  `{}`, a table whose `players` is a string, a seat whose `names` is a number,
  and a copy whose `character` is `[]`.
- **Voice:** every ✎ string through `tests/voice.test.mjs`.
- **The data guard** (135): no data key is added.
- **Mutation-test** each of these, and record in the PR what caught it. Check
  each for a second path first. Find each site by `grep`, never by line
  number, and run each narrowly under a `timeout`:
  1. the gate not running `migrate()` on a copy → *a copy is migrate()'d…*;
  2. the gate keeping an orphaned copy → same test;
  3. `seatFor` matching the first of two seats instead of neither →
     *seatFor reads a typed name…*;
  4. `crewView` not folding by seat → *crewView and awardTotals fold…*;
  5. `copies` added to `TABLE_RECORDS` → *players and seats are in the
     activity log and copies aren't…* (a re-import records an entry);
  6. `importSeat` replacing an older copy without `opts.older` →
     *importSeat seats a new TAG…*;
  7. `seatView` without its try → *seatView reads the copy's numbers and is
     total*.

## 12. Steps

Run `git submodule update --init private`, then `npm run test:fast` before
starting (a fresh branch from `main`). Run the targeted files after each step.

1. Take the two decision numbers and the table schema version: the lowest
   free on `origin/main`. Search the ledger again for the pre-flight's names.
2. **The shape:** the gate, the N step, `newTable`, `TABLE_RECORDS`,
   `_recName`; the version pins and the "newer" stamp; **`tools/sample-table.mjs`
   and the regenerated sample** (SQ9). Engine tests and `sample-table.test.mjs`.
3. **The engine:** `addPlayer`, `editPlayer`, `removePlayer`, `importSeat`,
   `setSeat`, `removeSeat`, `seatFor`, `seatView`, `playerList`. Engine tests.
4. **The readers:** `crewView`, `awardTotals`, `tableSearch`. Engine tests.
5. **Measure** (GQ9). In a scratch script (not committed), build a table with
   six locked characters, each played to a 500-entry audit through the
   engine's own actions, and two players. Record in the log:
   - its JSON size;
   - the time of `migrateTable` on it;
   - the time of one `JSON.stringify` (`saveTable`'s cost per keystroke).

   **Report it if** the size is over 2 MB or a save is over 50 ms.
6. **The page:** the tab and its pins; Add a player; Import; the cards; the
   folded list; the seat's page; the dialogs; Find's kind; the datalists.
7. **Hostile** tests; CSS at 390px.
8. **In the browser** (`shadows-dev-preview`, `?gm=on`). To make the
   character files, lock three characters in the wizard and export them, or
   build them in the page's console with `Engine` and download them. Then:
   - Add two players. Import three files onto one, two at once.
   - Re-import the newer one. Import an older one, cancel it, then use it.
   - Import a draft and a table file.
   - Bench one character; open it; add a name; remove it; Remove it from
     the table; Undo from Activity.
   - Type that name into a session's *Who was there* and close the session,
     then check the card's history and the Sessions tab's totals.
   - In *Who knows what*, a line naming the extra name groups under the
     character.
   - Find by the extra name and by the TAG.
   - Check **390px**, **768 × 1024** and **1300px**, and run
     `npm run phone-check`.
   - **Both themes.** **Report it if** any text is under 4.5:1 or a
     control's edge is under 3:1.
   - **Keyboard:** Tab through the status toggles and the name rows. ↑/↓
     change nothing anywhere.
9. The mutations (§11).
10. The docs:
    - the ledger: N and N+1, with 177, 179, 203, 205, 208 and 212 marked **in
      both SCHEMA and INDEX**;
    - INDEX;
    - SCHEMA §3: `players` and `copies` in the shape; the step history's N;
      and both *"until S3b's seats claim them"* lines reworded to *"read as
      the seat that answers to them (Decision N)"*;
    - the plan: S3b's row moves to *Built*; the rows **S3c** (the read-only
      sheet) and **S3d** (a PC row on a seat's copy) are added under *Still
      to build*; §4b's tab table and §4c's `players` follow what was built;
    - W68's line;
    - STATE;
    - the close-out (§14).

## 13. Stop and ask

- N (0.18) is taken, or the ledger search finds a decision these override
  that the pre-flight doesn't name.
- **A copy can reach the GM's roster** (`shadows.char.v1.*`) by any path.
- **Any character reader throws** on a gated copy.
- The measured save is over 50 ms, or the table is over 2 MB.
- A test needs an exception for one record or string.
- A new control needs a `<select>` that writes.
- An existing test needs a change beyond:
  - the version pins and the "newer" stamp;
  - the tab-list pins;
  - `crewView`'s and `awardTotals`' result shapes gaining `tag`;
  - the sample table's regeneration.
- Undo's round trip isn't deep-equal.
- The voice test flags new copy, or a decision goes over 350 words.
- **Not a stop:**
  - the version literals moving;
  - `engine.test.mjs`'s *"208: a search over 200 members and 100 sessions
    is quick"* failing on timing while the dev preview runs, if it passes
    when run alone;
  - phone-check's two OVER rows on the player sheet's HP pill.

## 14. Close-out

This is the *Rule or shape* tier, switched off, at table schema N, with **no
`private/` commit** (say so in the PR body):

- **SCHEMA:** N and N+1; the six marks **in the ledger**; §3 as step 10 says.
- **INDEX:** N and N+1 under **GM mode**, and the six lines marked. **Check
  each mark by eye** in both files.
- **STATE:**
  - the versions line (table schema N);
  - §1's GM mode line;
  - §3's GM mode row, naming S3c and S3d next;
  - §5's *Next*.

  Keep within the word and line-length guard.
- **The plan:** step 10's edits.
- **`changelog-pending.md`:** ✎ *"Players. A table seats each player's
  characters from their exported files, and shows them as cards: Health,
  Awareness and Conditions first. A name used in old sessions can count as
  the character."*
- **Log** entry:
  - why the copy sits outside the activity log;
  - why typed names stay typed;
  - the measurement (step 5);
  - why S3c and S3d are separate;
  - the sample table's handling (SQ9).
- **Shipped** row *(switched off)*, with the PR number. README's table gets
  S3b's row.
- **PR** titled `feat(gm): seats, players and the card spread, switched off
  (S3b, Decisions N and N+1)`. Fill in N. Body sections:
  - what changed;
  - *Evidence*: every claim names its command or test; the §10 tests failing
    on `main`; each mutation; each changed existing test, by name, with what
    changed;
  - the measurement;
  - the browser check;
  - *Voice pass*: every ✎ string as it renders, for Ken through the
    conductor;
  - **Where the order didn't fit**.

**Review checklist:**

- [ ] **Every answer Ken recorded** (SQ0–SQ9 here, and any PR comment in his
      words) **is in the code**, checked one by one.
- [ ] **In the browser, by the reviewer** (§12's step 8, by clicking): import
      several files; newer, same, older and draft; the card's order; a fold;
      the seat's page; Answers to and the history it counts; Remove and Undo;
      Find; the PC name datalist.
- [ ] **No copy reaches the roster:** after every import, `localStorage` has
      no new `shadows.char.v1.*` key.
- [ ] **A crafted copy is gated:** a copy edited in the stored table (a
      string stat, markup in a name) comes back migrated after a reload, and
      renders as text.
- [ ] **The card's words are the sheet's:** each label checked against
      `sheet.js`.
- [ ] No `<select>` writes anything; ↑/↓ on the page change nothing.
- [ ] Every write's Activity label is §9's.
- [ ] A 0.17 file gains empty `players` and `copies`, and nothing is
      converted.
- [ ] Undo covers every change, deep-equal, the copy included for a removal.
- [ ] Only the named tests changed (§13's list); no one-entry exception;
      every smoke test reads what's drawn.
- [ ] The measurement is in the log, under the stop's limits.
- [ ] 390px: nothing scrolls sideways; every control is 44px; the
      disclosure keeps its marker.
- [ ] 177, 179, 203, 205, 208 and 212 are marked **in the ledger and in
      INDEX**; the table schema is updated everywhere it's written; no
      game-data bump; `private/` untouched.
- [ ] N and N+1 are filled in everywhere, comments included.
- [ ] Two mutations re-run locally, one of them the gate's (1 or 2).
- [ ] Every "report it if" has an answer in the PR, and *Where the order
      didn't fit* is there, empty or not.
- [ ] The final `npm run verify` is on the PR's final commit.

## 15. Handing it over

The conductor starts **S3b build** (Sonnet) with the building prompt in
`docs/WORK-ORDERS.md` and this order's path, `docs/plans/gm-mode/S3b-seats.md`,
then starts **S3b review** (Opus) once the PR is open. The traps, under the
builder's prompt:

- **A copy never reaches the roster.**
  - Don't put it in `S.ch`.
  - Don't call `update()` with it open: `update()` saves `S.ch` into
    `shadows.char.v1.<TAG>`.
  - The card reads `Engine.seatView`, not the sheet.
- **The copy is outside the activity log.** `copies` is not in
  `TABLE_RECORDS`.
  - Seating a character changes both a seat and a copy; the label is set
    explicitly (*Seated Dez*).
  - A re-import changes only the copy, and records nothing.
- **The gate runs `migrate()` on every copy, after the seats.** Undo re-runs
  the gate, so a removed seat's copy survives one undo but not a reload. Say
  so in the dialog.
- **The character readers throw on a non-character.** Only a `migrate()`
  output reaches them, and `seatView` wraps each one.
- **Typed names stay typed.** `seatFor` reads them; nothing writes a seat
  link into a session, a line, a close-out or a row.
- **A name two seats answer to is neither.** Don't pick the first.
- **The tab isn't *Crew*.** `crewView` and the Cast tab's Crew view exist
  (179).
- **The words on a card are the sheet's.** Grep `sheet.js` for each label
  before writing it.
- **Grep the next version literal too.** `engine.test.mjs:7372`'s "newer"
  stamp is `"0.18"`, which is N.
- **Seven tab-list pins** move. Grep for them; don't trust this list.
- **Fire `change` as well as `input`** on every field the page binds.
- **A disclosure keeps its marker:** no `display:flex` on a `summary`.
- **Fill N and N+1 everywhere,** code comments included.
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
