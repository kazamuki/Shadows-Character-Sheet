# Work order S13a — The Reference: the rules a GM looks up, on one page

**Plan:** [`../gm-mode.md`](../gm-mode.md) §1a (*What do you look up most?*),
§4b and §6 *S13*; Decisions 135, 139, 182, 185, 204.
**Status:** **built 2026-10-09 (Decision 207, switched off)**; drafted the same day by Claude (Opus), after #141 (S5b) merged
with one fix round (README step 7). **SQ1–SQ4 answered by Ken 2026-10-09,
before drafting; SQ5–SQ8 the same day** (SQ6: the tab is *Reference*; SQ7: a
minus is a minus).
**Branch:** from `main` with #143 (the minus fix) merged, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js` (a new reader), `shadows-data.js` (one
new block that no character can observe), `gm.js`, the CSS, the ledger and
STATE. It reads `private/crb/` in a test and changes nothing there.

**What S13a is.** Scott's answer to *What do you look up most?* was
**Conditions and enemy stats**. The app already knows most of what a GM
looks up: every Condition, the Pain Levels, Shock and At Zero, healing,
weapon tags and CRANK's tiers are in the data, and a slotted pack holds the
Codex's tiers, roles, origins and its 114-trait glossary. But each is a tip
on some row or a picker inside some page. The rest sits in two places in the
book, 0530's combat **Quick Reference** and 2130's **table of checks**
(*Default TN 8, TH 2*), and neither is in the data. S13a gathers all of it
on one tab, **Reference**, with one search across everything and a jump bar to
each panel. The panels and their order are **data**, so adding or reordering
one is a data edit.

**It stores nothing.** The Reference reads the data and the slotted packs on
every draw. No table field, no schema bump.

**Split (Ken, SQ4).** The plan's S13 also lists **handouts** (a dispatch
kind, which waits on S2) and **printing** a cast member, an encounter and a
session's journal. Printing becomes **S13b**, recorded as **W84**. S13a is
the Reference only.

**Ken's answers, given before drafting (2026-10-09):**

- **SQ1, a tab.** **Reference**, after Encounters. Switching tabs already
  keeps the open encounter (`gm.js:235` resets the Sessions, Cast and
  Threats pages on a tab press, never `S.encOpen`), so a GM checks a rule
  mid-fight and comes straight back. An overlay over any tab was rejected.
- **SQ2, search plus a jump bar.** One search field filters every panel
  down to what matches; a row of chips jumps to each panel that's left.
- **SQ3, the book's words in the data.** 0530's Quick Reference and 2130's
  check table go into `shadows-data.js` verbatim, as Conditions already
  are, with a conformance test that checks every quoted piece against the
  mirror. No game-data bump (Decision 68: no character can observe it).
- **SQ4, the Reference only.** Handouts wait on S2; printing is S13b (W84).

**Carried over from S5b's review** (#141, one fix round; all four fixes
changed what the order specified, so all four were the order's):

- **Carried state keyed by one thing collides with itself.** S5b keyed a
  line by name alone, so a name passing through *away* for a keystroke
  overwrote the present line. Here: a jump target's id is the panel's data
  `id` (`gr-<id>`), never its position, so filtering never moves a chip's
  target onto another panel.
- **A recomputed default must keep what the GM set.** The search field is
  never redrawn while typing: the panels and chips below it redraw, the
  field keeps its value and focus.
- **Copy that states a number reads the number from the data** (S5b's
  hardcoded "5 an hour"). Here: every number a panel prints that the data
  holds (a Pain penalty, a CRANK payout) is read, never typed into copy.
- **A refusal and an empty state each get a line** (*Nothing matches*, the
  Codex with no pack).

**Pre-flight** (README, *The pre-flight*), against `main` at `04ec6e3`:

- **The tabs:** `TABLE_SECTIONS` (`gm.js:218`), drawn by
  `tableTabButtonsHtml`; the tab press at `:235` resets each section's page
  and leaves `S.encOpen` alone. `renderTable` (`:264`) picks the body by
  `S.tsection` and falls through to `notesTabHtml`; `bindTable` (`:286`)
  binds Notes by `[data-tnew]`, then by section. A new section needs a
  branch in both. `openTable(t, section)` (`:85`) drops a stored section
  that isn't in `TABLE_SECTIONS`, so an older copy of the app opening a
  table left on Reference lands on Sessions (171), with nothing to migrate.
  Icons: `uiIcon` has `tab_skills`, `tab_traits` and the rest; no new icon.
- **Three smoke tests pin the tab list** (`smoke.test.mjs:3300`, `:3523`,
  `:4323`, each `["Sessions", "Cast", "Threats", "Encounters", "Notes"]`).
  They gain `"Reference"` before `"Notes"`.
- **The jump bar:** `jumpBarHtml(list, { sticky, filter, extra, row })` and
  `jumpTo(id)` (`shared.js:621`, `:642`). `filter` draws an
  `input[data-jumpfilter]`; only `wizard.js:918` binds it, to
  `applyPickFilter`, which the Reference must **not** use (it filters rendered
  `.pick` cards). The Reference binds its own handler. `sectionList` numbers
  its ids by position, so the Reference doesn't use it (see *Carried over*).
- **What's in the data now** (each read, never copied):
  `conditions` (`shadows-data.js:4193`, 20 entries, `name`, `effect`,
  `recovery`) and `conditionRules` (`:4074`: `noStacking`, `helpless`,
  `painClamp`, `rollPenalty.text`, `penaltyStacking.text`);
  `resources.healthLevels.painLevels` (`:222`) and `painPenaltiesPerLevel`;
  `damageRules` (`:4132`: `massive.text`, `shock.check` and `.text`,
  `atZero.check`, `.text` and `.freePass.text`, `whileDying.text`,
  `.resetText` and `.playerNote`, **and a `flagNote` that must never
  render**); `recoveryRules` (`:4170`); `weaponTagGlossary` (`:3577`, `id`,
  `description`, some with `playerNote`); `resources.crank` (its
  `description` and `tiers`, read through `Engine.crankPayText` and
  `Engine.offScreenPay`).
- **The packs:** `packsMemo` (`gm.js:1289`) is the slotted packs, refreshed
  on every full draw. A pack's `tiers` (`name`, `text`, `statGuide`,
  `traitGuide`), `enemyRoles` (`name`, `tier`, `text`), `npcRoles`,
  `origins` (`name`, `text`, `modifiers`) and `traits` (`name`, `text`,
  `kind`, `origin`), SCHEMA §3's pack block. `Engine.packTraits` and
  `PACK_TRAIT_KINDS` (`engine.js:4676`, `:4544`); the UI's labels are
  `PACK_KINDS` (`gm.js:405`), each the id capitalised.
- **Not in the data:** 0530's `## Quick Reference` (`private/crb/0530_Combat_Encounters.md:762`):
  Modifiers, Range bands, Rate of Fire, Movement, Free / Fast / Standard
  Action, Stunt, Defense, Armor and Damage. 2130's check table
  (`2130_Core_Mechanics_in_Play.md`, after *GM Guidance*). `weaponRules.rofModes`
  holds the three fire modes' names and rounds, not the Roll and Result
  columns; the Reference quotes the book's table and a test checks the two
  agree.
- **The unread-key guard** (`engine.test.mjs:358`) reads `src/engine` and
  `src/ui` with comments stripped. Every new key (`gmReference`, `panels`,
  `from`, `parts`, `columns`, `items`, `term`, `footText`, `bookSource`)
  must be read by code, or match `TEXT_KEY`. `bookSource` ends in `Source`,
  so it counts as text: the conformance test reads it, no code needs to.
- **The CRB conformance helper:** `crb(name)` in `rules.test.mjs:25` reads
  the mirror and fails loudly when it's missing.
- **A CRB note for Ken, not the build:** 0300 names the three difficulties
  *easy, medium, hard* (as `skillCheckRules.difficulties` does); 2130's
  table names them *Easy, Average, Challenging*. The Reference quotes 2130.
- **A second CRB note:** the minus. 0540 and 0300 write a negative number
  with a hyphen (*-1 to all rolls*), 0530 with the true minus (*Run −1*),
  and the data copies each. Ken's ruling (SQ7) is the true minus everywhere
  it's shown; the data's 26 are a separate Fix, and the book is Ken's.
- **The ledger,** searched by name: *screen*, *GM screen*, *reference*,
  *tip*, *glossary*, *Conditions*, *conditionRules*, *Quick Reference*,
  *TN*, *TH*, *Defense*, *Pain Level*, *CRANK*, *weapon tag*, *tab*,
  *TABLE_SECTIONS*, *jump bar*, *search*. Hits:
  - **139** (one tip primitive; any rule the sheet names is a tap away):
    followed. The Reference reads what the tips read.
  - **182** (the Threats tab reads the packs): unchanged. The Reference shows
    the packs' reference sections, never their entries.
  - **185** (traits from a pack): its *Rejected* sent "the glossary as a
    fourth view on the Threats tab" to S13, and its *Revisit if* names "S13's
    GM screen wants the glossary as a page". This is that. Cited, not
    superseded: 185's picker stays as it is.
  - **204** (a table opens on Sessions; Next session isn't its own tab,
    "one more on a tablet"): cited. The Reference is a different surface, not a
    part of Sessions, and the tab row scrolls (140).
  - **140** and **165** (the tab row and jump bars at phone width): followed.
  - **68** (no game-data bump for a change no character can observe):
    followed.
- **Decision 207, GQ29, W84**: free on `origin/main` (checked 2026-10-09;
  no other branch is open). Check again before pasting.

---

## 1. Goal

A GM running a fight on a tablet taps **Reference**, types *prone*, and reads
Prone's effect, Shock's *Unconscious and Prone*, *Drop prone* from the
Actions panel and the Knockdown tag, all at once. They clear the search, tap **Defense** in the
jump bar, read the Defense table, and tap **Encounters** to land back on the
running encounter.

**Done when:**

- Switched off: nothing changes anywhere.
- A table has a sixth tab, **Reference**, after Encounters.
- The Reference draws every panel in `gmReference.panels`, in order: Conditions
  and the Codex first, then the book's combat and check references, then
  the rules the data already holds.
- One search filters every panel to what matches. The jump bar lists the
  panels that are left. The field keeps its value and focus while typing.
- The Codex panel reads every slotted pack; with none, it says how to slot
  one.
- Every piece the data quotes from the book is found, verbatim, in the
  mirror (the conformance test).
- No `flagNote` reaches the page.
- `npm run verify` and `npm run phone-check` pass; checked by hand at 390px,
  768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape: a new tab, a data shape, and a player-facing
  behaviour (for a GM) someone could have chosen otherwise.
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** **no bump.** `gmReference` is read only by GM mode; no
  character's values or choices change (Decision 68). State it in the log.
- **Character, table and pack schemas:** unchanged. Nothing is stored.
- **Reserved:** Decision **207**; **GQ29** (the Reference's panels and their
  order) in the plan's §9, for Scott; **W84** (S13b, printing) in this
  order's PR.

## 3. The decision, drafted

Paste after 206, under INDEX §3's **GM mode** heading, filling **Built**.
Count it with `wc -w`; the cap is 350.

```
207. **A table's Reference tab gathers what a GM looks up on one searchable page: Conditions and the Codex first, then the book's combat and check references, each panel a row in the data.**
     *2026-10-09 · Ken + Claude · Touches: Reference tab, TABLE_SECTIONS, gmReference, panels, from, parts, bookSource, Engine.gmReference, Conditions, packs, traits glossary, Quick Reference, check table, TN, TH, Defense, Pain Levels, CRANK, jump bar, search, Decision 139, Decision 185, Decision 204, GQ29, W84*
     - **Decided:** `TABLE_SECTIONS` gains **Reference**, after Encounters. The data's `gmReference.panels` lists its panels in order. A panel with `from` draws what the data or the slotted packs already hold (Conditions, the Codex's tiers, roles, origins and traits, Pain, recovery, CRANK); one without carries `parts` quoted verbatim from the CRB's combat Quick Reference and its table of checks. `Engine.gmReference(packs, { q })` resolves and filters them; one search narrows every panel, and a jump bar reaches each one left. Nothing is stored.
     - **Why:** Scott looks up Conditions and enemy stats most (§1a), and what a GM looks up is spread across 0530, 0540, 2130 and the Codex. A panel as data keeps a new one a data edit (135).
     - **Rejected:**
       - An overlay over any tab: switching tabs already keeps the open encounter (Ken, SQ1).
       - Panels folded shut: a search is faster (SQ2).
       - *Screen*, the tabletop word: alone, it reads as a display (SQ6).
       - The combat tables in the pack: they're the CRB's, as Conditions are (SQ3).
       - Copying the tips' text into the Reference's data: one edit should move both.
       - Handouts and printing here: handouts need S2's dispatch; printing is S13b (W84).
     - **Replaces:** nothing. 185's *Revisit if* (the glossary as a page) is met and its picker stands; 204 kept Next session off the tab row, and the Reference is its own surface.
     - **Revisit if:** GQ29 reorders the panels, a GM asks for the Reference over a running encounter, or the Quick Reference changes shape.
     - **Built:** switched off (173); no data or schema bump; log 2026-10-XX.
```

**Supersession marks:** none. If the ledger search at build time finds one,
stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **Where the Reference lives** | A tab after Encounters | **A tab** (Ken, 2026-10-09) |
| SQ2 | **How a GM finds things** | One search over every panel, and a jump bar | **Search and a jump bar** (Ken) |
| SQ3 | **The book's tables in the public data file** | Verbatim, with a conformance test; no data bump | **Yes** (Ken) |
| SQ4 | **Handouts and printing** | Out: handouts wait on S2, printing is S13b (W84) | **The Reference only** (Ken) |
| SQ5 | **The panels and their order** (§7's table). Thirteen: Conditions, The Codex, Defense, Checks, Modifiers and range, Actions, Rate of fire, Armor and damage, When a hit lands hard, Pain Levels, Recovery, Weapon tags, CRANK. GQ29 asks Scott; the order is a data edit | **As listed** | **As listed** (Ken) |
| SQ6 | **The tab's name.** *Screen* is the tabletop word (the GM's folding screen of tables); *Reference* says what's on it | **Screen** | **Reference** (Ken): alone on the tab row, *Screen* reads as a display |
| SQ7 | **The minus sign in the search.** The app's own numbers use the true minus, `−`, and so does 0530; a tablet keyboard types a hyphen | Fold `−`, `–` and `—` to `-` | **A minus is a minus** (Ken): `−` (U+2212) for a negative number everywhere it's shown, `–` for a range, `—` in prose only. The search folds `−` to `-`, nothing else. The data's 26 hyphen-minuses were their own Fix (#143, app 0.39.1): build from `main` after it, and print a number below zero with `shared.js`'s `signed`, `modText` or `numText` |
| SQ8 | **The bar sticks** under the header while the page scrolls, as the sheet's does on its long pages (W5), with the search in it | **Yes** | **Yes** (Ken) |

## 5. Read first

- `CLAUDE.md` whole: constraints 1, 5, 7, 8 and 9; *Decisions*; the
  *Watch for mechanical drift* rule.
- `docs/STATE.md` whole.
- The plan: §1a, §4b, §6 *S13*, §9 GQ1.
- `docs/SCHEMA.md` §2 (the data's shape; `gmReference` goes there), §3's pack
  block; §4: Decisions **68**, **135**, **139**, **140**, **165**, **185**,
  **204**.
- `private/crb/0530_Combat_Encounters.md` `## Quick Reference` (to the end
  of the file), `2130_Core_Mechanics_in_Play.md` (the check table after
  *GM Guidance*), `0540_Conditions_and_Recovery.md` (to see that the data's
  Conditions are the book's).
- **The code:** `gm.js`'s `TABLE_SECTIONS`, the tab press, `renderTable`,
  `bindTable`, `packsMemo`/`packsNow`, `PACK_KINDS`, `TIPS.condition` and
  `TIPS.painlevel`; `shared.js`'s `jumpBarHtml`, `jumpTo`,
  `bindScrollRows`; `engine.js`'s `_fold`, `_str`, `_list`, `_packList`,
  `packTraits`, `crankPayText`, `offScreenPay`, `conditionById`,
  `glossary`; `engine.test.mjs`'s key guard; `rules.test.mjs`'s `crb()`;
  `tests/packfixture.mjs`'s `syntheticPack`.

## 6. Out of scope

- **Handouts** (S2) and **printing** (S13b, W84).
- **Any change to the tips** (139), the Threats tab, the trait picker
  (185), the Encounters tab, or how a row shows its Conditions.
- **A link from a row into the Reference** (a Condition on an encounter row
  opening its panel). Its tip already shows the rule.
- **The Codex's entries and groups** on the Reference: they're the Threats
  tab's.
- **The Trait Library** (design prose) and **the drone reference**: not in
  the pack (S9c's SQ4).
- **Editing `skillCheckRules`, `weaponRules.rofModes` or any Condition** to
  match the book's wording. Report a difference; don't fix it.
- **Remembering the search across a reload.** It lives on `S` and goes when
  the table closes.

## 7. The shapes

**The data** (`shadows-data.js`, a new top-level block after
`conditions`; no `gamedataVersion` bump, §2):

```js
/* GM mode's Reference (Decision 207): its panels, in order. A panel with
   `from` draws what the data or the slotted packs already hold; one
   without carries `parts` quoted verbatim from the CRB section its
   `bookSource` names, which tests/rules.test.mjs checks piece by piece.
   A cell or a term that runs over several lines in the book joins them
   with " · ". */
"gmReference": {
  "panels": [
    { "id": "conditions", "title": "Conditions", "from": "conditions" },
    { "id": "codex", "title": "The Codex", "from": "packs" },
    { "id": "defense", "title": "Defense", "bookSource": "0530 Quick Reference",
      "parts": [ { "text": "free, unlimited, no penalty for being outnumbered",
                   "columns": ["The threat", "The answer"],
                   "rows": [ ["Aimed at you", "Dodge — REF Skill"], … ] } ] },
    …
  ]
}
```

| Key | Holds | Read by |
|---|---|---|
| `id` | letters, digits and `-`; unique; the jump target is `gr-<id>` | engine, UI |
| `title` | the panel's heading and its chip | engine |
| `from` | one of `conditions`, `packs`, `pain`, `hits`, `recovery`, `weaponTags`, `crank` | engine |
| `bookSource` | `"<4-digit file> <heading>"` or `"<4-digit file>"` | the conformance test only (text by name) |
| `parts[]` | `{ title?, text?, columns?, rows?, items?, footText? }` | engine |
| `rows` | arrays of strings, one per column; `""` for an empty cell | engine |
| `items` | `{ term?, text }`: a bold lead and its sentence, or a line | engine |
| `footText` | a line under a table (the book's footnote) | engine |

**The panels** (SQ5's default). The data ones quote the book exactly;
✎ marks copy the engine writes, for a voice pass.

| # | `id` | Title ✎ | Source | Parts |
|---|---|---|---|---|
| 1 | `conditions` | Conditions | `from: conditions` | Every Condition in data order: *term* name, *text* `effect`, *more* `recovery` and any `playerNote`. Then ✎ **How Conditions work**: items, text only, `noStacking`, `helpless`, `painClamp`, `rollPenalty.text`, `penaltyStacking.text` |
| 2 | `codex` | The Codex | `from: packs` | ✎ **Tiers** (name or *Tier N*; `text`; *more* `statGuide`, `traitGuide`), ✎ **Enemy roles** (name; `text`; *more* *Tier N* when set), ✎ **NPC roles**, ✎ **Origins** (*more* the modifiers, *BOD +1 · COOL −1*, in `D.stats` order), ✎ **Traits** (*more* the kind's label and, for an Origin trait, its origin's name: *Origin · Street*). With two or more packs, each item's *more* ends with its pack's name. A part with no items is left out |
| 3 | `defense` | Defense | 0530 Quick Reference | The Defense table: its lead line as `text`, two columns, seven rows |
| 4 | `checks` | Checks | 2130 | The check table: four columns, six rows. A cell's `<br />` lines join with " · " (*10 (Easy) · 15 (Average) · 20 (Challenging) · +5 per difficulty level*) |
| 5 | `modifiers` | Modifiers and range | 0530 Quick Reference | **Modifiers** (lead line as `text`; Cover, Visibility, Distance, Moving; four rows; the footnote as `footText`), **Range bands** (five columns, one row) |
| 6 | `actions` | Actions | 0530 Quick Reference | **Movement** (lead as `text`; Pace, Distance, Attacking), **Free Action**, **Fast Action**, **Standard Action** (each: lead as `text`; items, the bold word as `term`), **Stunt** (items, text only) |
| 7 | `rof` | Rate of fire | 0530 Quick Reference | Mode, Rounds, Roll, Result; three rows |
| 8 | `armor` | Armor and damage | 0530 Quick Reference | The seven bullets as items (*Total the damage first.* as `term`, the rest as `text`) |
| 9 | `hits` | ✎ When a hit lands hard | `from: hits` | ✎ **Shock** (`shock.text`; *more* `shock.check`), ✎ **At zero** (`atZero.text`; *more* `atZero.check`, `freePass.text`), ✎ **Massive** (`massive.text`), ✎ **Dying** (`whileDying.text`; *more* `resetText`, `playerNote`). **Never `flagNote`** |
| 10 | `pain` | Pain Levels | `from: pain` | Columns ✎ *Pain Level*, ✎ *What it means*: each level's `label` and `description`. `text` ✎ *Each Pain Level: −1 to Skill Checks, −1 Essence die, −5% on Breaker Checks.*, every number from `painPenaltiesPerLevel`, signed with `−` (`signed`, #143). `footText` its `notes` |
| 11 | `recovery` | Recovery | `from: recovery` | ✎ **Natural healing** (`text`; *more* `speedHealText`), ✎ **Focused healing** (`text`; *more* `massiveText`), ✎ **Nanomed Kit** (`text`; *more* `doseText`) |
| 12 | `tags` | Weapon tags | `from: weaponTags` | Each `weaponTagGlossary` entry: *term* `id`, *text* `description`, *more* `playerNote` |
| 13 | `crank` | CRANK | `from: crank` | `text` the tier's `description`; columns ✎ *Tier*, *Rep*, *Pays*, *Off-screen job*; a row per tier: name, rep, `crankPayText`, the `offScreenPay` range with the credit sign, or `""` |

**Engine** (a new section, *The Reference (Decision 207)*, after the packs'
readers; exported beside them):

| Function | Does | On bad input |
|---|---|---|
| `gmReference(packs, f)` | **reader.** `[ { id, title, parts:[ { title, text, columns, rows, items:[ { term, text, more:[] } ], footText } ] } ]`, every key present, strings `""` and lists `[]` when empty. Panels in `gmReference.panels`' order; a `from` panel resolved by its reader, a data panel copied from its `parts` (a cell that isn't a string reads `""`; a row that isn't an array is dropped). Filtered by `f.q` (below) | never throws: `packs` anything, `f` anything; a panel with an unknown `from` or a bad `id` is left out |

**The search** (`f.q`), exactly: fold the query and every string with
`_fold`, then `−` (U+2212) to `-` (SQ7). En and em dashes aren't folded:
they're a range and prose, never a sign. An empty query keeps
everything. Otherwise, for each panel: a title that matches keeps the whole
panel. Else, for each part: a title or `text` that matches keeps the whole
part; else keep the rows with a matching cell and the items whose `term`,
`text` or any `more` matches, and the part's `footText` only if a row is
kept. A part left with nothing is dropped; a panel left with no parts is
dropped. **One exception:** with no query, the Codex panel stays with
`parts: []` when no pack is slotted, so the page can say so.

`gmReference` is total and reads only: it never writes the data, a pack or the
table.

**Where the state lives:** `S.refQ`, the search as typed, on `S` as the
Threats tab's `S.threatQ` is. `openTable` resets `S`, so a table opens with
none.

## 8. The UI

All in `gm.js` and the CSS. GM-facing; copy in tool voice; ✎ for a voice
pass. **Built for a tablet** (§1a).

**The tab.** `TABLE_SECTIONS` gains `{ id:"reference", label:"Reference",
ui:"tab_skills" }` after Encounters. The press is a plain switch: it resets
nothing else.

**The page**, top to bottom:

1. The table's name and *Table · created …*, as every tab's top.
2. **The bar**, sticky under the header (SQ8), from `jumpBarHtml` with
   `row:true` and its `filter` (placeholder ✎ *Search the reference*): the
   search, then a chip per panel drawn, labelled with its title, jumping
   to `gr-<id>`.
3. **The panels**, each an `h2` (`id="gr-<id>"`, `tabindex="-1"`) and its
   parts: a part's title as an `h3`, its `text` as a line, a table with its
   columns as headers, items as a list (the `term` bold, then `text`, then
   each `more` dim on its own line), `footText` small under the table.
4. **Nothing matches** (a query that leaves no panel): ✎ *Nothing in the
   reference matches.* and **Clear the search** (✎).
5. **The Codex with no pack** (no query, parts empty): ✎ *Slot a pack on the
   Threats tab, and its tiers, roles, origins and traits show here.*

Everything the data or a pack holds is escaped (`esc`); nothing is markup.

**Tables at width.** At 390px the page never scrolls sideways: a table
wider than the screen scrolls inside its own frame. At 768 × 1024 the
Checks and Defense tables fit without scrolling. At 1300px the panels may
sit in two columns; that's the builder's call, and either passes.

| Press | The record | The view | Focus |
|---|---|---|---|
| **Reference** (the tab) | — | the Reference, with `S.refQ` as left | the tab, as every tab press |
| A letter in the search | — (`S.refQ`) | the panels and the chips redraw; the field doesn't | the search, caret where it was |
| A chip | — | scrolled to that panel (`jumpTo`) | that panel's heading |
| **Clear the search** | — (`S.refQ` `""`) | every panel | the search |
| **Encounters** (the tab), mid-fight | — | the running encounter, as it was | the tab |
| **Reference** again | — | the Reference, the search as left | the tab |

## 9. Tests

**`tests/engine.test.mjs`**, *The Reference (207)*:

- `gmReference([], {})` returns every panel in the data, in order, each with
  every key; the Codex panel has `parts: []`.
- Every `from` in the data resolves: no panel the data lists is left out.
- Totality: `gmReference` of `undefined`, `null`, `"x"`, `[{}]` and a migrated
  hostile pack, with `f` as `undefined`, `null`, `5`, `{ q: {} }`, returns
  an array and throws nothing. A copy of the data with a panel of unknown
  `from`, one with no `id`, a part whose `rows` is `"x"` and a row of
  numbers: the first two are left out, the third has no rows, the fourth
  reads `""` cells.
- **No `flagNote` reaches the Reference:** collect every string in
  `gmReference(twoPacks(), {})`; none equals or contains any `flagNote` value
  in the data (walk `D` for the key).
- Conditions: one item per Condition, in order, with its `effect` and
  `recovery`.
- The Codex with one synthetic pack: its tiers, roles, origins (the
  modifiers as *STAT +n*) and traits; with `twoPacks()`, each item names its
  pack.
- Pain: the text's three numbers follow `painPenaltiesPerLevel` (change one
  in a copy of the data, the text changes).
- CRANK: a row per tier; Legendary's off-screen range is `offScreenPay`'s.
- **The search:** *prone* keeps Conditions (Prone only), Actions (*Drop
  prone* only), When a hit lands hard (Shock, At zero) and Weapon tags
  (Knockdown); *PRONE* and *  prone * the same. *movement* keeps Actions'
  Movement part whole, all three rows, though no cell says *movement* (a
  part title). *conditions* keeps the Conditions panel whole (a panel
  title).
  *-1* matches *Partial −1* (SQ7). *zzzz* returns `[]`.
- **Rate of fire agrees with the data:** the panel's Mode and Rounds columns
  are `weaponRules.rofModes`' names and rounds.

**`tests/rules.test.mjs`**, *CRB: the Reference quotes the book*:

- For every panel with `bookSource`, read the file in `private/crb/` whose
  name starts with its four digits; with a heading, the text from `## <heading>`
  to the next `## ` or the end. Normalise both sides the same way: strip
  HTML tags (a `<br />` becomes a space), `**`, `*` and `\`; `’` and `‘` to
  `'`; `−` to `-` (the book and the data don't agree on the minus yet,
  SQ7); collapse whitespace. Then **every piece** is a substring of it: each
  part's `title`, `text` and `footText`, each column, each item's `term` and
  `text`, and each cell, each split on ` · `, empty pieces skipped. Name the
  panel and the piece on failure.

**`tests/smoke.test.mjs`**, switched on:

- The three tab-list assertions gain *Reference* before *Notes*.
- **Reference**: the panels' headings in the data's order; a chip per panel;
  the Codex line with no pack; with `tableWithPack()`, its tiers and
  traits.
- Type *prone* in the search: only those four panels, the chips match them,
  focus is still the search and its value *prone*. Type *zzzz*: *Nothing in
  the reference matches.*; **Clear the search**: every panel, focus on the
  search.
- A chip: focus on its panel's heading.
- A running encounter, then **Reference**, then **Encounters**: the encounter's
  page as it was.
- `app.errors` empty throughout. Switched off: no Reference tab, Home as it was.

**`tests/hostile.test.mjs`**: a hostile pack (`hostilePack()`, names and
text as `<img onerror>`) slotted, the Reference drawn: the text shows as text,
no `img` in `#main`, `app.errors` empty.

**Mutation-test** (record each in the PR with **the test that actually
caught it**). Check each for a second path first:

1. **`whileDying.flagNote` added to Dying's *more*** → the no-`flagNote`
   test.
2. **The search ignores part titles** → the *movement* test.
3. **A quoted cell drifts** (*Run −1* to *Run −2*) → the conformance test.
4. **The search redraws the field** (`renderTable()` on input) → the smoke
   focus test.
5. **An unknown `from` throws** → the totality test.
6. **The Codex reads only the first pack** → the two-pack test.
7. **Pain's text types its numbers** → the Pain test.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and
after each step.

1. Confirm 207, GQ29 and W84 are free on `origin/main`. Search the ledger
   again for the pre-flight's names.
2. **The data:** `gmReference`, the data panels transcribed from the mirror;
   the conformance test. Run it before going on: every piece found.
3. **The engine:** `gmReference`, its readers and the search; its tests.
4. **The UI:** the tab, the page, the bar, the search; the three tab-list
   assertions; the smoke and hostile tests.
5. **In the browser** (`shadows-dev-preview`, `?gm=on`): a table with the
   Codex pack slotted (or `syntheticPack` imported) and a running encounter.
   Search *prone*, *stun*, *-3*, *TN 8*, *Brute*; tap each chip; go to
   Encounters and back. Then **768 × 1024** (Checks and Defense fit),
   **390px** (the page's `scrollWidth` equals its `clientWidth`, and no
   element in `main` past the right edge but inside a table's frame), and
   **1300px**.
6. The mutations (§9).
7. Ledger, INDEX, plan, STATE, docs, close-out (§12).

## 11. Stop and ask

- 207, GQ29 or W84 is taken.
- The ledger search finds a decision 207 overrides that the pre-flight
  doesn't name.
- A piece of the Quick Reference or the check table can't be quoted
  verbatim in this shape (a table the parts can't hold, or the mirror
  changed since 2026-10-09).
- A new key trips the unread-key guard in a way reading it from `engine.js`
  doesn't fix, or needs a `MAPS` or `TEXT_KEY` change.
- The voice test flags anything in `gmReference` or the engine's copy.
- Adding the tab breaks a test outside the three tab-list assertions.
- The phone check fails and the fix is outside the Reference.
- The decision goes over 350 words.

## 12. Close-out

*Rule or shape* tier, switched off:

- **SCHEMA:** 207; §2 gains the `gmReference` block (its keys, the `from`
  readers, `bookSource`).
- **INDEX:** one line under **GM mode**.
- **STATE:** §1's GM clause gains the Reference (207); what's next.
- **The plan:** §4b's *As built* line gains Reference; §6 *S13* says S13a is
  built and S13b is printing (W84); §9 gains **GQ29** for Scott (*What's in
  your reference, and in what order? Default: the thirteen panels as built,
  Conditions and the Codex first; the order is a data edit*).
- **`changelog-pending.md`:** ✎ *A Reference tab for the GM: Conditions, the
  Codex's tiers, roles and traits, defense, checks, modifiers and the rest
  of the book's quick reference, on one page you can search.*
- **Log** entry (state the no-bump of game data, and why; the CRB note on
  the difficulty names); **shipped** row *(switched off)*; README's table:
  S13a's row.
- **PR** titled `feat(gm): the Reference, switched off (W29 S13a, Decision
  207)`. Body: what changed; the mutations; the browser check (the tablet
  included); **Where the order didn't fit**.

## 13. Review checklist

- [ ] **In the browser, by the orchestrator:** the searches in step 5, each
      chip, a running encounter kept across a trip to the Reference.
- [ ] Every data panel's pieces found in the mirror; two cells compared by
      eye against the book.
- [ ] No `flagNote` on the page (search the DOM for Dying's).
- [ ] Every number in the Pain and CRANK panels read from the data.
- [ ] The search field keeps focus and value while typing; the chips follow
      the panels.
- [ ] 390px: no sideways scroll on the page; tables scroll in their frames.
- [ ] A hostile pack renders as text.
- [ ] No version bump; `changelog-pending.md` has the line.
- [ ] Two mutations re-run locally.
