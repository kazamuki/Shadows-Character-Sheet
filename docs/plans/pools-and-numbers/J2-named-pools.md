# Work order J2: a pool the player names

**Plan:** [`../pools-and-numbers.md`](../pools-and-numbers.md) §3, row J2. **Source:** **W49** (a resource pool the player names), raised by the plan and approved with it (JQ4: a list; JQ5: a card on Main if it fits at 375px; JQ6: one release).

**Built on:** Decision 153 (the write-in archetype, its `mechanics` and `when`; its *Revisit if* names W48–W50), 135 (a data key is read by code; no panel id in code), 225 (the Custom SFR pool's typed max, its card on Main), 214 (the card alone on Main's last row), 81 (one writer for a mirror), 124 (a file is untrusted), 312 (J1: `panelMax`, `panelTracker.typed`).

**Status: drafted 2026-11-22** by Claude (Opus), J1's reviewer, at the conductor's request for Ken ("Lets get the J1 reviewer to build the J2 work order!"). **Not approved.** JQ13–JQ16 are open.

**Branch:** cut from `origin/main` at the pre-flight commit. PR to `main`. Nothing ships switched off. **No release** at the end (JQ6), and **no app bump**: J1 moved `[Unreleased]` to 0.76.0, and J2's lines go under that heading (see §2).

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **J2 build** (Sonnet), then a fresh **J2 review** (Opus) once the PR is open. §15 is the hand-over.

**Runs alone** (the plan's default; J3 runs after it). It touches `engine.js` (`archPanels`, `writeInOptions`, `migrate()`, `validate()`, `newCharacter()`), `shadows-data.js` (the Custom archetype's `writeIn` and panels, `meta`), `wizard.js` (the write-in step), `sheet.js` (Main's cards, the popover, Trackers, Admin's write-in editor, print's archetype page, the tracker binders), `shared.js` (nothing: `resetArchetypeChoices` already resets the whole shape), the tests and the docs. J3 shares `shared.js` and the ledger with it.

**Pre-flight against `main` at `38d8e85`** (#381, J1, merged). Take the next free decision number on `origin/main` when it's written (312 is the last there today); the order says **N**.

```
mechanicsOn      engine.js:5329. The ticked ids the archetype OFFERS: an id the data doesn't list is ignored.
writeInOptions   engine.js:5337. { mechanics:[{id,label,note,on}], powerUses: spec.powerUses (a copy), classifications }.
                 Read by the wizard (wizard.js 314, 542: the <datalist id="power-uses">) and the sheet (2185 Admin's
                 write-in editor gate, 2239 and 2253: the Add power and Improve forms' Uses suggestions).
archPanels       engine.js:4506. The data's coreMechanic.panels, filtered by `when` and `origin`. EVERY panel reader
                 (Trackers 1755, Main's feed/toggle 562/584, Character 725, Loadout 2727, adjustPanelTracker 4575,
                 playerPool 4519, resolveReset 3252/3284, the toggle/feed/grimoire finders) reads this list, so a panel
                 it returns is drawn and counted everywhere a data panel is.
storedMax        engine.js:4512. trackers.panel[p.id].max: a finite number >= 0, floored, or null.
panelMax         engine.js:4522. p.max == null -> storedMax; J1 adds the SFR adjustment only when p.resource === "sfr".
panelTracker     engine.js:4564. Reads p.counts ("down"), p.max, p.stepsFrom, p.turnCap; returns typed (J1).
                 A panel with no `resource` keeps its count in trackers.panel[p.id].value (panelStore 4552).
adjustPanelTracker 4574: finds the panel by id in archPanels(ch); "That tracker isn't on this sheet." otherwise.
migrate()        engine.js:6006: writeIn is rebuilt field by field; an unknown field is DROPPED (`pools` today).
                 mechanics keeps any string (["sfr","pools"] survives). 5749: every trackers.panel entry's value/max
                 is made a number; an entry with no panel is kept.
newCharacter()   engine.js:66: writeIn's shape. SCHEMA_VERSION "0.34" at 25. gamedataVersion "0.59" (data 56).
resetArchetype   shared.js:943 replaces archetypeChoices with newCharacter()'s: a field writeIn grows resets with it.
Choices
validate()       engine.js:6450: the write-in step's errors (name, classification) and warnings (a row with words and no
                 name). Its strings are player copy.
Tracker labels   sheet.js:3970 (±1) commits `${pid.toUpperCase()} ${signed(delta)}`; 4215 (the max box) commits
                 `${pid.toUpperCase()} max → …`. Today: "SFR +1", "TOL-SPENT +1". A pool would read "POOL-K3X9 +1".
Main's cards     sheet.js:545-556: SFR's card when sfr() has a value; `cardsAfterLuck` counts SFR, Çredits, CRANK for
                 Decision 214's `alone` class. `cond(cls, name, …)` puts `name` in the markup UNESCAPED (every caller
                 passes a literal today). The popover is vitalPopover(ch, key) 1642, keyed by data-vpop.
Trackers         sheet.js:1755-1775: every tracker panel: <h2>${esc(p.title)}</h2>, ±1 (data-trk), the max box
                 (data-trkmax, aria-label `${esc(p.title)} max`), the note.
Admin            adminWriteInHtml 2184: name, description, classification text, traits, vulnerabilities. No mechanics:
                 they're ticked in the wizard only.
Print            pArchetypePage 3239: name, classification, description, traits, powers, vulnerabilities. Print shows
                 no tracker (no SFR, no TOL Spent).
GM mode          gm.js reads no panel, tracker or mechanic (grep archPanels|panelTracker|trackers.panel|mechanics: none).
Icons            UI_ICONS: health pain sanity luck sfr credits crank and the tab icons; no pool icon.
Ledger           "writeIn"/"mechanics"/"powerUses": 153. "Main's SFR card"/"Custom (Uses SFR)": 225. "alone card": 214.
                 "panel"/"tracker counts/resource": 135. None says a tracker's title must come from the data; W49's
                 text says it does "today". 153's Revisit if names W49.
Tests today      engine.test.mjs:2973 pins writeInOptions' mechanics as [magic, sfr] (breaks: a third one).
                 smoke-wizard 830-859 tick data-wimech="sfr" and pin writeIn's fields. engine.test.mjs's
                 "newCharacter matches the documented character schema" pins schemaVersion "0.34".
```

**Probes on `main`** (a locked Custom character, `mechanics: ["sfr", "pools"]`, `writeIn.pools: [{ id:"pool-1", name:"Glamour" }]`, `trackers.panel["pool-1"] = { value:2, max:6 }`):

| Probe | `main` |
|---|---|
| `writeInOptions(ch).mechanics` | `[["magic",false],["sfr",true]]`: "pools" isn't offered, so it's ignored |
| `archPanels(ch)` | `sfr` (tracker), `powers`: no pool panel |
| `migrate(ch).archetypeChoices.writeIn` | `pools` dropped; `mechanics` keeps `"pools"`; `trackers.panel["pool-1"]` kept as `{ value:2, max:6 }` |
| `adjustPanelTracker(ch, "pool-1", 1)` | `{ ok:false, why:"That tracker isn't on this sheet." }` |

---

## Carried over from J1

**The order's misses** (J1's review):
- Two *Done when* lines had no named test: Feeding's cap and a Start's "more than your RoU". The fix round added them. **Here every *Done when* line names its test** (§1 says which).
- The hostile tests skipped the one new reader outside the main path (the Custom pool's max in `panelMax`). **Here §11 names a hostile case for every new reader**, not one per archetype.
- The plan row and the order disagreed (the row put the adjustment in the popover; JQ10 said Trackers only). **This order and the plan's J2 row are made to agree in the same PR** as this draft, and J1's row now says what was built.
- The Trackers line could name a RoU the pool didn't have, and the Activity Log printed a target's raw id ("Adjust ROU") while the journal used its label. Both are the same class as this order's biggest trap: **text a reader prints from an id instead of a name.** §5 has a row for every label that prints a panel id today.

**The build's:**
- The builder took the `main` outputs snapshot by checking `main`'s `src/` out into its own worktree, sat idle on it, and wrote into another checkout. `WORK-ORDERS.md` now says how (a scratch worktree on `main`, its own temp dir). §15 repeats it.
- The PR carried a `wip:` commit. **Ken merges this one as a squash**, and the PR body says so.
- Helpers landed under the wrong banner comment (J1's `sfrByHandText` sat under Admin's). New helpers go beside the renderer that calls them.

## 1. Goal and Done when

A player writing a Custom archetype ticks **Uses another pool**, names it (Glamour, Chi, a battery), and with their GM sizes it on Trackers. It counts down there and on Main like the Custom SFR pool, its name is a suggestion in a power's **Uses**, and it prints on the archetype's page.

**Done when** (each line is the named test after it, §10):
- The wizard's write-in step offers **Uses another pool**; ticking it shows a list with one row to name, and **+ Add a pool** adds another, up to 4 (JQ16). *(`J2: ticking Uses another pool gives a pool to name, and Add a pool stops at four`)*
- Each named pool is a tracker on Trackers with the player's name as its heading, counting down from a max typed in its box. *(`J2: a named pool is a tracker that counts down from the max you type`)*
- Main has a card for each sized pool, in the order they were added; its popover has −1 and +1 (JQ13). *(`J2: Main shows a card per sized pool, and its popover spends it`)*
- A pool's name is text everywhere: markup in a name renders as characters on Trackers, Main, the popover, the Uses list, Admin, print and the Activity Log. *(`J2: a pool named with markup prints as text everywhere`, smoke; `J2: a hostile file's pools come out ids and text`, hostile)*
- The Activity Log names a tracker by its title: "Glamour +1", "TOL Spent −1", never an id. *(`J2: the Activity Log names a tracker by its title`)*
- A power's **Uses** suggests each named pool, in the wizard and on the sheet. *(`J2: a named pool is a suggestion in a power's Uses`)*
- Admin renames, adds and removes a pool (JQ14), each one change and one Undo; removing one removes its count too. *(`J2: Admin renames, adds and removes a pool, and Undo puts each back`)*
- An unnamed pool reads **Pool** and the wizard warns, never blocks (JQ15). *(`J2: an unnamed pool warns and reads Pool`)*
- The archetype's print page lists the pools with their max. *(`J2: print's archetype page lists the pools`)*
- Unticking **Uses another pool** hides the pools and keeps their names and counts; ticking it again brings them back. *(`J2: unticking hides the pools and keeps them`)*
- Changing archetype clears the pools with the rest of the write-in (one Undo on the sheet). *(`J2: changing archetype clears the pools`)*
- A character file from before keeps working: `migrate()` gives it `pools: []`, and a newer file's pools survive a round trip. *(`J2: migrate gives pools [] and keeps a file's own`)*
- At 375px, Main's grid and Trackers don't overflow with four pools named 40 characters each. *(§12 step 7 and `npm run phone-check`)*

## 2. Tier, versions, numbers

- **Rule or shape** (a save-file shape and a data shape; extends Decision 153). One decision, **N**.
- **App: no bump.** JQ6 (answered): "the first moves `[Unreleased]` to the next minor, and the others add their lines under it". J1 made it **0.76.0**; J2's changelog lines go under `## [Unreleased] — app 0.76.0`, and `APP_VERSION` stays. *(The conductor's brief said 0.77.0; the plan's answered JQ6 is what's built. Ken can overrule it in JQ6's place, not here.)*
- **Game data:** `0.59` → **`0.60`**. A character can choose a mechanic it couldn't before (Decision 68).
- **Character schema:** `0.34` → **`0.35`**. `archetypeChoices.writeIn` gains `pools`, with a `migrate()` step in the same commit.
- **Table and pack schemas:** no bump. GM mode reads none of this.

## 3. The decision, drafted in full

```
N. **A Custom archetype can name pools of its own, each a tracker it sizes, as its SFR pool is.**
   *2026-11-22 · Ken + Claude · Touches: writeIn.pools, Uses another pool, writeIn.mechanics, perPool, archPanels, writeInOptions, powerUses, tracker labels, Main's pool cards, the pool popover, Admin's write-in editor, print archetype page, schema 0.35, W49, JQ13–JQ16*
   - **Decided:** The Custom archetype's third mechanic, **Uses another pool**, keeps a list of up to four pools in `archetypeChoices.writeIn.pools` (`{ id, name }`; the id is issued once, `pool-` and eight characters). A data panel with `perPool: true` is drawn once per pool by `archPanels`, with the pool's id and name, so every panel reader counts it as it counts the Custom SFR pool: down from a max typed on Trackers, in `trackers.panel[id]`. Main shows a card per sized pool, with a −1/+1 popover. A pool's name is the player's text, escaped everywhere, and is a suggestion in a power's Uses; a tracker's Activity Log line names its title, not its id. The wizard names pools; Admin renames, adds and removes them. An unnamed pool reads as the panel's data title and warns.
   - **Why:** W49: Glamour, Chi, a battery lived in Notes, where nothing counted them, and the SFR pool's tracker already did everything they need except take a name.
   - **Rejected:**
     - One pool only (JQ4: a list of one is cheap, and a second shape later costs a migration).
     - Pool rules (a Rate of Use, a refill at rest): the plan's §4; a named pool counts and nothing else, as the Custom SFR pool does.
     - Panels the player writes whole into `panelData`: a second panel shape beside the data's, and every reader would need to learn it.
     - Ids `pool-1`, `pool-2`: a removed `pool-2` would come back for the next one added, onto its old count.
   - **Replaces:** nothing. Extends 153 (its mechanics; its *Revisit if* names W49) and 225 (Main's cards for a pool the player sizes).
   - **Revisit if:** a pool needs its own rule (a Rate of Use, a refill); a book archetype is given a named pool (W109); four is too few at a real table.
   - **Built:** game data 0.60, character schema 0.35, app 0.76.0 (unreleased), PR #…, log entry 2026-…
```

INDEX §3, under *Archetypes & specialization* (where 153 is):

```
- **N** *(Named pools — pools-and-numbers J2, W49)* — the Custom archetype's **Uses another pool**: `writeIn.pools` (up to four, `{ id, name }`), a `perPool` panel drawn once per pool by `archPanels`, a card on Main with a popover, a suggestion in Uses, labels by title; Admin renames, adds, removes. Schema 0.35. Extends 153 and 225.
```

## 4. Questions for Ken

JQ1–JQ8 are the plan's (answered: JQ4 a list, JQ5 a card on Main, JQ6 one release). JQ9–JQ12 were J1's. **This order's: JQ13–JQ16, open.**

- **JQ13 — What a pool's card on Main does.**
  - **Default:** a button that opens a popover with the pool's count, **−1** and **+1**, and **On Trackers**, as the SFR card does. Spending on Main is where a pool is spent, in play.
  - *Alternative:* a plain card that only shows the count; spend on Trackers.
- **JQ14 — Who changes the pools after lock.**
  - **Default:** Admin renames, adds and removes them (each one change, one Undo); the wizard names them at creation. A GM who grants a pool mid-campaign has somewhere to put it.
  - *Alternative:* the wizard only; after lock a pool can't change (a rename goes in Notes).
- **JQ15 — A pool with no name.**
  - **Default:** it's kept, reads **Pool** (the panel's data title) everywhere, and the wizard warns "Name your pool, or remove it." It never blocks the lock (as a nameless trait doesn't, Decision 153).
  - *Alternative:* the lock is blocked until every pool has a name.
- **JQ16 — How many pools.**
  - **Default:** up to **four**. Main's grid stays two rows of pool cards on a phone, and no character the team has written needs more than two.
  - *Alternative:* no cap.

## 5. The assumption sweep

| What changes | True today (where) | After | Guards that read it · where it renders · text that points at it |
|---|---|---|---|
| `writeIn.pools` (new) | absent; `migrate()` drops it (6006) | `[{ id, name }]`, up to 4, ids `^pool-[a-z0-9]{8}$`, unique, never a data panel id; `newCharacter()` gives `[]` | Readers: `archPanels`, `writeInOptions` (Uses), the wizard step, Admin's editor, print, `validate()`. `resetArchetypeChoices` (shared 943) resets it with the shape: no edit, a test pins it |
| The Custom archetype's mechanics | `magic`, `sfr` (data 3599) | + `{ id:"pools", label:"Uses another pool", note:… }` | `mechanicsOn`, `writeInOptions`, wizard 528 (draws every mechanic: no edit). Breaks engine.test 2973 (expected, §13) |
| The Custom archetype's panels | `tol-spent`, `sfr`, `powers` | + `{ id:"pool", type:"tracker", title:"Pool", counts:"down", note:…, when:"pools", perPool:true }` | Decision 135's key guard: `perPool` must be read (by `archPanels`) |
| `archPanels(ch)` | the data's panels, by `when`/`origin` (4506) | a `perPool` panel becomes one panel per pool: the data panel's keys, `id` the pool's, `title` the pool's name or the data title when blank, `perPool` dropped; none when no pool | **Every panel reader**: Trackers 1755, `panelTracker`, `adjustPanelTracker` 4575, `panelStore` (no `resource`: `trackers.panel[id].value`), `panelMax` (no `resource`: no J1 adjustment), `playerPool` 4519 (`resource==="sfr"` only: a pool never matches), `resolveReset` 3252/3284 (`turnCap` only: never), `sfrPanel` sheet 1613 (`resource==="sfr"`: never), Character 725 and Loadout 2727 (`type` other than tracker: never) |
| Tracker Activity Log labels | `pid.toUpperCase()` (sheet 3970 ±1, 4215 max) | the panel's `title`, for every tracker: "Glamour +1", "TOL Spent −1", "SFR max → 12" | Visible change for TOL Spent's and SFR's labels (no test pins either: grep `TOL-SPENT`, `SFR +1`). The label is escaped by the toast and the log (shared 396, sheet 2009) |
| Main's cards | SFR, Çredits, CRANK; `cardsAfterLuck` counts them (545) | + one card per pool with a max, after SFR, before Çredits; counted in `cardsAfterLuck` for `alone` (214) | `cond()` puts `name` in unescaped: **the pool's name must be escaped before it's passed**. The popover's title is escaped where it's drawn (`openPopover`, shared.js 556): pass it raw there, not escaped twice |
| `vitalPopover(ch, key)` | `hp`, `pain`/`cond`, `san`, `luck`, `sfr`, `cred`, `crank` | + `pool:<id>`: count, −1/+1 (`data-trk`), **On Trackers**; null when the id isn't a panel any more | `openVitalPopover` re-opens by key after a commit: a removed pool's key returns null and the popover closes |
| `writeInOptions(ch).powerUses` | the data's list (5341) | + each named pool's name, while **Uses another pool** is ticked, after the data's, de-duplicated | Wizard datalist 542, sheet 2239/2253. engine.test 2974 pins `powerUses` with no pools: still passes |
| Trackers | every tracker panel (1755) | draws pools with no edit to the loop; the heading, aria-label and note are escaped already | The max box binder (4215) writes `trackers.panel[pid]`: unchanged |
| Admin's write-in editor | no mechanics, no pools (2184) | a **Pools** list (JQ14) while the mechanic is ticked: rename, **+ Add a pool** (to 4), **Remove**; each a `commit()` | Remove deletes `writeIn.pools[i]` **and** `trackers.panel[id]` in one commit |
| Print, archetype page | no trackers (3239) | a **Pools** table: name, max (blank line for none) while ticked | Escaped as the other rows are (`pRowsTableHtml`) |
| `validate()`, write-in | name, classification; nameless rows (6450) | + a warning per unnamed pool | Player copy in the engine (CLAUDE.md, *Player-facing copy*) |
| `migrate()` | rebuilds `writeIn` (6006) | + `pools`: plain objects only, `id` kept when it matches the id pattern and isn't taken or a data panel id (else dropped), `name` as text, at most 4 | Hostile: an id `"sfr"`, `"tol-spent"`, `"__proto__"`, a number; a name with markup or 10,000 characters (kept as text; the UI's `maxlength` is 40) |
| `newCharacter()`, `SCHEMA_VERSION` | `0.34` | `0.35`, `pools: []` | engine.test's schema pin; SCHEMA.md §2's `writeIn` block |

## 6. Read first

- `CLAUDE.md`: hard constraints 6 (ids immutable: a pool's id is issued once), 7 (store inputs), 8 (the engine is total), 10 (a file is untrusted), and *Versions*.
- `SCHEMA.md` §2 (the character's `writeIn`), the panels' note before §3 (`when`, `counts`, `resource`), §4: Decisions 135, 153, 214, 225, 312.
- `engine.js`: `archPanels` (4506), `storedMax`/`panelMax`/`panelTracker`/`adjustPanelTracker` (4512-4590), `mechanicsOn`/`writeInOptions`/`archetypeContent` (5329-5370), `newPowerId` (the pattern for a random id held unique), `migrate()`'s `writeIn` (6006) and `trackers.panel` (5749), `validate()`'s write-in (6450).
- `sheet.js`: `renderShMain`'s cards (520-560), `vitalPopover` (1642), `renderShTrackers` (1755), the `data-trk` and `data-trkmax` binders (3970, 4215), `adminWriteInHtml` (2184), `pArchetypePage` (3239).
- `wizard.js`: `writeInHtml` (513) and `bindWriteIn` (1157).
- `shared.js`: `resetArchetypeChoices` (943).

## 7. Out of scope

- A pool's own rules: a Rate of Use, a refill at rest, a Turn Reset (the plan's §4).
- A pool on a book archetype (W109).
- A pool on the vitals pill or drawer: SFR's alone, as now.
- Typing an amount to spend (J4) and typing into steppers (J3).
- An icon of its own for a pool: the card reuses `tab_trackers` (§9).
- GM mode.

## 8. The shapes

```js
// archetypeChoices.writeIn (schema 0.35)
pools: [ { id: "pool-k3x9q2ma", name: "Glamour" } ]   // up to 4; id ^pool-[a-z0-9]{8}$, never reissued

// shadows-data.js, the Custom archetype
"mechanics": [ …magic, …sfr,
  { "id": "pools", "label": "Uses another pool", "note": "Tracks a pool you name: Glamour, Chi, a battery. Its size is your GM's call." } ]
"panels": [ …tol-spent, …sfr,
  { "id": "pool", "type": "tracker", "title": "Pool", "counts": "down", "perPool": true, "when": "pools",
    "note": "Set the pool's size with your GM, then count down as you spend." },
  …powers ]
```

- **`archPanels(ch)`**: a panel with `perPool: true` is replaced by `poolsOf(ch).map(pl => ({ ...p, id: pl.id, title: pl.name.trim() || p.title, perPool: undefined }))` (drop the key rather than set it undefined, so a whole-object comparison sees none). `poolsOf(ch)` reads `writeIn.pools` through the same normalizing as `migrate()` (an undo can put anything back, Decision 153's note), so a bad row never reaches a panel. Only while the archetype declares `writeIn` (`writeInSpec`).
- **`writeInOptions(ch).powerUses`**: the data's, then each named pool's trimmed name when `pools` is ticked, no blanks, no duplicates (case-sensitive, as typed).
- **`Engine.newPoolId(ch)`**: `pool-` + 8 of `randomChars`, redrawn while `poolIdFree(ch, id)` is false. **`poolIdFree(ch, id)`** (exported, pure): false when `id` is held in `writeIn.pools`, is a key of `trackers.panel` (so a removed pool's id isn't reused onto a count Undo might bring back), or is a data panel's id. Both exported for the wizard and Admin; the tests test `poolIdFree` directly, since `randomChars` has no seam.
- **`migrate()`**: `pools` = the file's rows that are plain objects, `id` a string matching `^pool-[a-z0-9]{8}$`, not already taken in this list, not the id of any panel in the data; `name` as text. The first four kept. Anything else dropped.
- **On bad input** (constraint 8): `archPanels`, `writeInOptions` and `panelTracker` on any character `migrate()` gives return as now; a pool with no stored max gives `max: null`, `shown: null`, as the Custom SFR pool does unset.

## 9. The UI

**Wizard, the write-in step** (`writeInHtml`). **Uses another pool** is a third checkbox (data-drawn). While it's ticked, under the checkboxes: a **Pools** list, each row a **Name** field (`maxlength="40"`, placeholder "Glamour, Chi…") and **Remove**, then **+ Add a pool** (gone at four). Ticking it with no pools adds one empty row and focuses its name. Unticking hides the list and keeps the rows. Typing a name saves without a redraw (as the other write-in fields, Decision 164's `update(false)`).

**Trackers**: each pool is a tracker panel, drawn by the existing loop: heading the pool's name, −1/+1, the max box, the data's note.

**Main** (JQ13): after the SFR card and before Çredits, one card per pool **with a max** (an unsized pool has nothing to show: Trackers asks for its max). Label the pool's name (escaped), big `left/max`, a meter, the `tab_trackers` icon. Pressing it opens the pool's popover. `cardsAfterLuck` counts the pool cards, so Decision 214's lone last card still spans its row.

**The popover**: title the pool's name, the count `left / max`, **−1** and **+1** (the same `data-trk` binder as Trackers'), and **On Trackers**.

**Admin** (JQ14), in the written-in archetype's section, while **Uses another pool** is ticked: **Pools**, a row per pool (**Name**, **Remove**), and **+ Add a pool** (to four). Each change is one `commit()`: the rename on `change` (not each keystroke), Add, and Remove, which also deletes `trackers.panel[id]`.

**Print**: on the archetype's page, after Powers, a **Pools** table (Pool, Max) while ticked; a pool with no max prints a blank to write in.

**Activity Log**: a tracker's ±1 and max lines name its title ("Glamour +1", "Glamour max → 6", "TOL Spent −1").

| Press | Where the record lands | Where the view and focus land |
|---|---|---|
| Tick **Uses another pool** (wizard) | `mechanics` + `"pools"`; one pool row if none | The new row's **Name** |
| **+ Add a pool** (wizard or Admin) | a pool with a new id, name `""` | Its **Name** |
| **Remove** (wizard) | the row gone (its count, if any, too) | The next row's **Name**, or **+ Add a pool** |
| **Remove** (Admin) | the row and `trackers.panel[id]`, one commit | **+ Add a pool** |
| A pool card on Main | nothing | The popover; Esc closes it back to the card |
| **−1** / **+1** in the popover | `trackers.panel[id].value`, one commit | Stays in the popover, on the button pressed |
| **On Trackers** | nothing | Trackers, at the pool's panel |

**Copy** *(all marked for the voice pass)*: the mechanic's label and note (§8); the wizard's list heading **Pools**, button **+ Add a pool**, the name's placeholder; `validate()`'s warning "Name your pool, or remove it."; the panel's data title **Pool** and note.

## 10. Worked examples, as named tests

Write these first; show each failing on `main` (or say why it passes).

`tests/engine.test.mjs`:
- **`J2: a perPool panel is drawn once per named pool, with its id and name`**: Custom, `pools` ticked, two pools → two tracker panels after `sfr`, ids and titles the pools', no `perPool` key; unticked → none.
- **`J2: a named pool is a tracker that counts down from the max you type`** (engine half): `trackers.panel[id] = { value:2, max:6 }` → `panelTracker` max 6, shown 4; `adjustPanelTracker(ch, id, 1)` → ok, value 3; no max → `max: null`.
- **`J2: an unnamed pool warns and reads Pool`** (engine half): title "Pool"; `validate()` has one warning "Name your pool, or remove it." and no error.
- **`J2: a named pool is a suggestion in a power's Uses`** (engine half): `powerUses` = the data's + ["Glamour", "Chi"]; a blank and a duplicate are left out; unticked → the data's only.
- **`J2: migrate gives pools [] and keeps a file's own`**: a 0.34 file → `pools: []`, schema 0.35; a 0.35 file's two pools survive; a fifth is dropped.
- **`J2: an id a count still holds is never given out again`**: `poolIdFree(ch, "pool-aaaaaaaa")` is false with `trackers.panel["pool-aaaaaaaa"]` present and no pool, false for a held pool's id and for `"sfr"`, true otherwise; `newPoolId(ch)` matches the pattern and `poolIdFree`.
- **`J2: no pool reaches the SFR, Turn Reset or Feeding readers`**: a pool panel never matches `playerPool`, `sfrTrackerPanel`, `resolveReset`'s `turnSpend` or a feed finder.

`tests/smoke-wizard.test.mjs`:
- **`J2: ticking Uses another pool gives a pool to name, and Add a pool stops at four`**.
- **`J2: unticking hides the pools and keeps them`**.
- **`J2: a named pool is a suggestion in a power's Uses`** (the datalist half).

`tests/smoke-sheet-play.test.mjs`:
- **`J2: a named pool is a tracker that counts down from the max you type`** (Trackers half: heading, box, ±1).
- **`J2: Main shows a card per sized pool, and its popover spends it`**: an unsized pool has no card; sized, the card reads `6/6`; −1 in the popover → `5/6`, one Undo → `6/6`; `alone` lands on the right card with 1 and 2 pools.
- **`J2: the Activity Log names a tracker by its title`**: a pool's +1, TOL Spent's −1, SFR's max.
- **`J2: a pool named with markup prints as text everywhere`**: name `<img src=x onerror=alert(1)>` on Trackers, Main's card, the popover, the Uses datalist, Admin, print and the Activity Log: no `img` element, the characters shown.
- **`J2: Admin renames, adds and removes a pool, and Undo puts each back`**.
- **`J2: changing archetype clears the pools`**.
- **`J2: print's archetype page lists the pools`**.

## 11. Tests beyond the examples

- **Hostile** (`hostile.test.mjs`): the hostile Custom character gets `pools` with a markup name, an id of `"sfr"`, `"tol-spent"`, `"__proto__"`, `5`, a duplicate id, a 10,000-character name and a sixth row. After `migrate()`: every id matches the pattern, none is a data panel id, at most four; `archPanels`, `writeInOptions`, `panelTracker` on each pool and `validate()` return without throwing. **One hostile case per new reader**: `archPanels`, `writeInOptions`, `poolsOf` via an undo that writes a bad `pools` back (`undoLastAction` on an audit entry whose diff writes junk `pools` back).
- **Totality**: add a Custom character with `pools` ticked to `degenerates()` (engine.test 666), so *no exported reader throws* covers it; add `newPoolId` to the readers list if it takes `(ch)` alone.
- **Voice** (`voice.test.mjs`): the new data strings and the `validate()` warning pass.
- **Nothing else moves**: the outputs diff over every archetype and specialization (`WORK-ORDERS.md`). Expected: the Custom archetype's `writeInOptions` mechanics (a third), and nothing for a Custom character with `pools` unticked. Every other difference is a finding.
- **Mutation-test**: drop `perPool` handling in `archPanels` (the per-pool test fails); pass the pool's name unescaped to `cond()` (the markup test fails); go back to `pid.toUpperCase()` in the ±1 label (the Activity Log test fails); drop the data-panel-id check in `migrate()` (the hostile `"sfr"` id lands on the SFR panel's count: the hostile test fails).

## 12. Steps

1. `git submodule update --init private`; `npm run test:fast` on the fresh branch. **Take the outputs snapshot now**, in a scratch worktree on `main` with its own `npm ci` and its own temp dir (§15).
2. Write §10's engine examples; show them failing on `main`. Build the data (mechanic, panel, `meta.gamedataVersion` 0.60), `archPanels`' `perPool`, `writeInOptions`' Uses, `newPoolId`, `newCharacter()`'s `pools`, `migrate()` and `SCHEMA_VERSION` 0.35. `npm run verify`.
3. The wizard: the Pools list, Add, Remove, the warning. `npm run verify`.
4. The sheet: Trackers (no edit expected; prove it), Main's cards and the popover, the labels, Admin, print. `npm run verify`.
5. §11's hostile, totality, the outputs diff and the four mutations.
6. Docs: SCHEMA §2's `writeIn` block, the panel note (`perPool`), Decision **N** and its INDEX line.
7. **Dev preview** (`shadows-dev-preview`; seed with `shadows.active.v1`, the memory note's recipe): walk the wizard's write-in step (tick, name two pools, add to four, remove one, untick, tick); lock; size a pool on Trackers; on Main, open its card's popover, −1, Undo; Admin: rename, add, remove, Undo; print preview's archetype page; a pool named with markup. At **375px** with four pools named 40 characters: Main's grid and Trackers have `scrollWidth == clientWidth`, and `npm run phone-check` passes.
8. Close-out (§14). `npm run verify` last.

## 13. Stop and ask

- If a reader of `archPanels` would treat a pool panel as something else (a `resource`, `turnCap`, `feed` or `toggle` finder that matches it): stop.
- If an engine reader needs a pool's id or name and `archPanels` can't give it (a second way to read `writeIn.pools` would be a mirror): stop.
- If the outputs diff shows anything but §11's expected differences: stop.
- If any rules text in the data or the CRB mirror says how a written-in pool works (`grep -ri "glamour\|blood pool\|chi\b" private/crb`): stop; it's Deighton's.
- **Not stops:** engine.test 2973's mechanics list (it gains `pools`); the schema pin (`0.34` → `0.35`); a smoke test that counts `[data-wimech]` boxes or Main's `.cond` cards; a test that pins an Activity Log line as `TOL-SPENT` or `SFR` by id (none today: say so if one turns up).

## 14. Close-out

Per the `close-the-session` skill, *Rule or shape*:
- Decision **N** (§3) in `SCHEMA.md` §4 and its INDEX §3 line. 153 and 225 get no supersession mark (extended).
- **No `npm run bump`** (§2). `meta.gamedataVersion` 0.60 and `SCHEMA_VERSION` 0.35 by hand, and STATE's versions line.
- `CHANGELOG.md` under `## [Unreleased] — app 0.76.0`, then `npm run changelog`:
  - "**A Custom archetype can track a pool of its own.** Tick **Uses another pool**, name it (Glamour, Chi, a battery), and set its size with your GM on Trackers. It counts down there and on Main, and it's a suggestion when you write what a power uses."
  - "**The Activity Log names a tracker by its name**: TOL Spent, not TOL-SPENT."
- W49 moves to `log/wishes-granted.md` with a pointer to this order. A line in `docs/log/2026.md`; a row in `docs/log/shipped.md`; STATE rewritten (Pools and numbers: J2 built, J3 next). The plan's J2 row: **Built** (Decision N, schema 0.35, game data 0.60).
- **PR title:** `feat(sheet): a pool the player names (Decision N, J2)`. Body: the template's sections, plus **Where the order didn't fit** and every new string as it renders (for the voice pass). **Say in the body: merge as a squash.**

**Review checklist:**
- Every *Done when* line has its named test, and each fails on `main`.
- A pool panel reaches none of the SFR, Turn Reset, Feeding or toggle readers (§5's `archPanels` row, by grep, re-done).
- A name with markup renders as text in all seven places, in the browser too.
- A hostile id can't land on another panel's count.
- Removing a pool on Admin takes its count with it, and one Undo brings both back.
- Main's `alone` card is right with one, two, three and four pools, at 375px.
- The outputs diff is §11's expected and nothing else.
- The four mutations fail as §11 says.
- No new copy names a decision, a wish id or "TBD" (`voice.test.mjs`).
- No app bump; game data 0.60; schema 0.35 with its `migrate()` step.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md` with this order's path, `docs/plans/pools-and-numbers/J2-named-pools.md`, plus these traps:

- **`cond()` doesn't escape its name.** Every card today passes a literal. A pool's name is the player's: escape it before passing it, and the popover's title too.
- **The id prints in two Activity Log labels** (sheet.js 3970, 4215). Use the panel's title, for every tracker.
- **A file's pool id can name another panel.** An id of `"sfr"` would draw a second panel onto the SFR pool's count. `migrate()` checks every id against the data's panel ids and the pattern, and `archPanels` reads pools through the same check (an undo can bring junk back).
- **Never reissue an id a count still holds.** `newPoolId` checks `trackers.panel`'s keys as well as the list.
- **Take the outputs snapshot in a scratch worktree on `main`** with its own `npm ci` and its own temp dir, before step 2. Not by checking `main`'s `src/` out into your worktree, and never into another checkout (J1's build).
- **One commit history the reviewer can read.** No `wip:` commits on the branch at PR time; Ken squashes, but the reviewer reads the commits.
- **New helpers go beside the renderer that calls them**, not under another section's banner.
