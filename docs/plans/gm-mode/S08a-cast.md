# Work order S8a — The cast: the record, the stat block, the Cast tab

**Plan:** [`../gm-mode.md`](../gm-mode.md) §1a, §3, §4e and §6 *S8*.
**Status:** drafted 2026-10-05 by Claude (Opus), after reviewing S3a's PR
(#113). **§4 answered and the order approved by Ken, 2026-10-05.** Ready to build.
**Branch:** from `main` (#113 and its fix round are merged), PR to
`main`, switched off (Decision 173).
**Runs alone.** It touches `engine.js`'s Tables section, `gm.js`, the
ledger, the table schema and STATE.

**Why S8a and not S8.** The plan's S8 is the cast record, the stat block,
`Engine.npc`, the Cast tab, quick-add, interactions, affiliation filters,
history, Keep and Promote. That's three sessions' worth, and two of its
parts can't be built yet: **Promote** turns a *fought copy* into a cast
member, and fights are S10; **affiliation** links a faction, and factions
are S7. So this order is the half everything else hangs off (SQ1):

- **S8a (this order):** the cast record, the stat block, `Engine.npc`, the
  **Cast** tab with quick-add, a member's page, status and simple filters.
- **S8b (next):** interactions and history (§4e's `Interaction`), the
  crew's-view list, and an affiliation that's text until S7 makes it a link.
- **S10:** Keep and Promote, with the fight they come from.

**Carried over from S3a's review.** Every finding in S3a's review was the
order's, not the build's. So this order:

- **Runs each mutation against the code before naming it** (S3a's first
  mutation couldn't fail: `migrate()` keeps unknown keys, so a table still
  read as a table after it). §9 says, for each, what it changes and the one
  test that sees it.
- **Names the test that checks a type, not the one that renders it**
  (S3a's third mutation: escaping on render hid a dropped coercion, so the
  hostile test passed). Coercion mutations point at engine tests here.
- **Counts each drafted decision against `docs.test.mjs`'s 350-word cap**
  (S3a's 170 and 171 were over). §3's are under; the count is beside each.
- **Doesn't ask for a change the switched-off path forbids** (S3a's
  `accept=".json"` would have changed Home switched off).
- **States focus after every press that redraws**, not only Delete
  (S3a's Create and Rename left focus on `<body>`; Decision 164's rule).
- **Asks long names to wrap** wherever a GM's text is a heading (S3a's
  table title widened the page at 390px with one long word).
- **Says to check out the private submodule** before the baseline
  (`git submodule update --init private`), or three CRB tests fail on a
  clean tree.
- **Gives markup only as a suggestion** (again: S3a's suggested `.trk` card
  squeezed note fields to 200px at 390px; the build was right to drop it).

**Pre-flight** (README, *The pre-flight*), against `main` at `131dab1` plus
PR #113's head `0fbdc9e`, and **re-run on `a3d906a`** (#113 merged, fix round
included: it changed only focus, a wrap rule, a test and copy in `gm.js`,
nothing this order names). If `main` has moved again, re-run the greps;
anything that moved is the building session's to raise under *Where the
order didn't fit*. Found, and built into this order:

- **`Engine.health(ch)` and `Engine.derived(ch)` read a character**
  (`statTable`, `grants`, `adjFor`, the archetype's scaling row). They can't
  take a stat block. `Engine.npc` computes from the data directly: `statMod`
  for each stat, `D().resources.healthLevels` for Health, and `D().derived`'s
  `sumOfModifiers` entries for TOL's and WILL's formula. §7 says how.
- **The data's stats are eight** (`BOD REF MOB INT TECH COOL MAG EMP`); the
  Codex prints those plus TOL and WILL, which are `D().derived` entries of
  type `sumOfModifiers`. SAN is `percent` and the Codex doesn't print it. So
  the block keys its stats by `D().stats` and its authored values by the
  `sumOfModifiers` entries of `D().derived`, never by a list in code
  (Decision 135, and the plan's rule 7).
- **The Codex's Health line agrees with the players' rule**: Street Tough,
  BOD 6, *Health: 30 (6 Health Levels)* = 6 × 5. `Engine.npc` derives it and
  stores nothing (constraint 7).
- **Skill names:** of the nine names in Entry 01 and Splice, eight match
  `D().skills` by name; **Handgun** doesn't. So a skill row is linked by id
  when its name matches and stays text when it doesn't; nothing is refused.
- **`openCatalog(kind)` is the character's** (it reads `S.ch`, buys with
  Çredits and commits to the audit). It can't pick armor or gear for an NPC
  without a rewrite. Armor and gear are text in S8a (SQ3); S10, which needs
  an armor's PROT and RES, links the catalog.
- **The Codex's vocabulary is private.** Origins, NPC roles, enemy roles and
  tiers are Codex content (GQ10), in `private/`, and ship in S9's pack.
  Nothing in `src/` may list them. So S8a stores them as the GM's text
  (SQ2), and S9 matches the pack by name.
- **`TABLE_SECTIONS`** in `gm.js` is a list of one (`notes`); the tab twin,
  `renderTableChrome` and the `data-tsec` binder already handle more than
  one. `S.tsection` is validated against it on open.
- **`migrateTable()` has its version-step comment** ("Schema 0.2 (Decision
  N): …") and `TABLE_SCHEMA_VERSION` beside it; this is the first step.
- **`docs.test.mjs`** checks STATE's table schema against `newTable()`; it
  moves with the bump, nothing else to change.
- Decisions **174, 175, 176** are free on `main` (the ledger ends at 173 once
  #113 merges). Searched (Decision 130): *cast*, *NPC*, *stat block*,
  *Health Levels*, *HP*, *TOL*, *WILL*, *constraint 7*, *derived*, *skill
  total*, *table*, *tab*, *undo*, *audit*, *quick-add*. Cited in §3.

---

## 1. Goal

A GM can **keep a cast**: every NPC from a name scribbled mid-session to a
full stat block copied out of the Codex, on a **Cast** tab in their table.
Quick-add takes a name and one line in one press. A member's page holds who
they are, what they want, what they've got, where their line is, what
happens if they're pushed, a GM note, and as much of a stat block as the GM
has. The page shows Health, HP and each stat's bonus worked out from the
block, and TOL and WILL as the Codex prints them, with the formula's value
beside.

**Done when:**

- Switched off: nothing changes anywhere (Home is today's, byte for byte,
  as S3a left it).
- Switched on, a table opens on **Cast** (SQ5) with **Notes** beside it.
- **Quick-add:** a field and **Add**. Typing *Bob* and Enter adds Bob to the
  top of the list and leaves the keyboard in the field, empty, for the next
  one. An optional second field takes one line (*runs the café*).
- The list: a card per member, newest first, with the name, the line, what's
  known of origin, roles and tier, and the status when it isn't *alive*.
  Tapping a card opens the member's page.
- A search field filters the list as it's typed (name, line, origin, roles),
  and a status filter shows *alive* by default with *all* one tap away.
- A member's page: every text field of §7's record, editable in place and
  saved as it's typed; status as four choices; **Delete** asks first.
- **The stat block**, on the member's page: one number field per stat and
  per authored derived stat (TOL, WILL), skill rows (name and total), armor
  and gear lines, and traits (a name and its text). Any of it may be blank.
- Beside the block: **Health** *30 (6 Health Levels)* from BOD; each stat's
  bonus; TOL and WILL as stored with *formula: 3* beside. Blank BOD shows
  no Health and says nothing is wrong.
- Export, import, reload and Remove keep every field. A 0.1 table opens as
  0.2 with an empty cast and its notes untouched.
- A hostile table (a payload in every new string, junk rows, `__proto__`
  keys, numbers as strings and objects) opens, renders as text, and the
  numbers come out numbers or blank.
- `npm run verify`, `npm run phone-check`, `npm run release:check` pass;
  the Cast tab and a member's page checked by hand at 390px and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (the table's shape, a reader in the engine, an
  exception to constraint 7's letter).
- **App:** no bump (switched off, Decision 173). One line goes to
  `changelog-pending.md`.
- **Game data:** unchanged. **Character schema:** unchanged.
- **Table schema:** **0.1 → 0.2**, with `migrateTable()`'s first step.
- **Reserved:** Decisions **174, 175, 176**. No F-flag. If `main` has taken
  any of them, stop and ask.

## 3. The decisions, drafted

Paste after 173, under INDEX §3's **GM mode** heading, filling **Built**.
Counted as drafted: 174 is 314 words, 175 is 306, 176 is 267, against
`docs.test.mjs`'s cap of 350. Recount after filling **Built** or any edit.

```
174. **A table keeps a cast: one record per NPC, from a name to a stat block, whose Codex vocabulary is the GM's text until a pack names it.**
     *2026-10-0X · Ken + Claude · Touches: cast, cast member, table.cast, C- id, quick-add, origin, npcRoles, enemyRole, tier, motivation, resources, line, ifPushed, gmNote, status, table schema 0.2, migrateTable, W29, GQ6, GQ10*
     - **Decided:** Table schema 0.2 adds `cast: [ … ]` (shape in SCHEMA §3). A member has an id (`C-` and eight characters), a name and every §4e text field, `origin`, `npcRoles` (a list) and `enemyRole` as text, `tier` a whole number or null, `status` one of alive, dead, missing or gone, and `block`, null or a stat block (175). `migrateTable()`'s first step gives a 0.1 table an empty cast; every later load coerces each member as it does a note.
     - **Why:** Scott's answers put the cast first (§1a). The Codex's origins, roles and tiers are confidential and ship in S9's pack (GQ10), so the public app can't list them; text now, matched to the pack by name in S9, means a GM's cast never waits on the pack and never changes under it.
     - **Rejected:**
       - Waiting for S9's pack to give the vocabulary: the cast is the most-wanted thing, and a GM writes NPCs who belong to no entry.
       - Ids for origin and roles now, from a list in the data: the list is the Codex's, which the public repo can't hold.
       - Interactions, history and affiliation in the same record now: each needs sessions (S5) or factions (S7) to mean anything (S8b).
     - **Replaces:** nothing. 170 foresaw it: each later record is added by its own session.
     - **Revisit if:** S9's pack names a vocabulary the GM's text can't match, or S8b's interactions need a field this lacks.
     - **Built:** table schema 0.2; PR #__; log 2026-10-0X.

175. **An NPC's stat block stores what the Codex prints: stats and skill totals as authored, TOL and WILL as authored, and Health and the bonuses derived.**
     *2026-10-0X · Ken + Claude · Touches: stat block, block.stats, block.authored, skill totals, armor lines, gear lines, traits, Engine.npc, Health Levels, HP, statMod, TOL, WILL, constraint 7, GQ6, Decision 98*
     - **Decided:** A block keys `stats` by the data's stats and `authored` by the data's `sumOfModifiers` derived stats (TOL and WILL today), each a whole number or null; `skills` are `{ skill, name, total }` (`skill` the data's id when the name matches, else null); armor and gear are text lines; traits are `{ name, text }`. `Engine.npc(block)` derives Health Levels and HP from BOD by the players' rule, each stat's bonus by `statMod`, and each authored stat's formula value, and lists what's blank. It stores nothing and warns about nothing.
     - **Why:** the Codex prints totals, not ranks, and prints TOL and WILL below their formula on seven of eleven roster NPCs; storing the formula would rewrite Scott's NPCs (GQ6's default). Health it doesn't author differently, so it's derived as a character's is (constraint 7).
     - **Rejected:**
       - TOL and WILL derived: changes the Codex's own numbers.
       - A warning under the formula: fires on most of Scott's NPCs.
       - Skill ranks plus the derivation: the Codex has no ranks to store.
       - Armor and gear from the catalog now: `openCatalog` is the character's, and nothing reads an NPC's PROT before S10.
       - A completeness tier ("partial", "full"): a block is a block with blanks.
     - **Replaces:** nothing. It is a deliberate exception to constraint 7's letter for TOL and WILL, which the Codex authors.
     - **Revisit if:** GQ6 is answered as a formula or a floor, or S10 needs armor numbers.
     - **Built:** as 174.

176. **The table opens on its Cast tab: quick-add at the top, a filtered list, and a page per member; a cast still has no undo, and Delete asks.**
     *2026-10-0X · Ken + Claude · Touches: Cast tab, TABLE_SECTIONS, quick-add, cast list, cast filters, member page, data-cast, Delete, table undo, Decision 171, W29, GQ1*
     - **Decided:** `TABLE_SECTIONS` gains **Cast**, first; a table opens on it. Quick-add takes a name (and an optional line), adds on Enter or **Add**, and keeps the keyboard in the field. The list filters by a search over name, line, origin and roles, and by status (alive by default). A member's page edits every field in place and saves as it's typed; Delete asks first. Nothing on a table is undoable yet: S10 is the first session where numbers change in play (damage), and it decides the table's audit trail.
     - **Why:** mid-session, a GM has one hand and three seconds (§1a); quick-add is the reason the cast is used. Typed fields are the GM's authoring, not play, and the audit trail is for play.
     - **Rejected:**
       - Notes first: the cast is what Scott runs the table from.
       - A modal for quick-add: one more press, and it hides the list it adds to.
       - Undo now, by the character's structural diff: a second audit to design before anything at the table changes in play.
     - **Replaces:** Decision 171 in part: S10, not S8, decides the table's audit trail.
     - **Revisit if:** a GM loses work to a deleted member, or GQ1's tab order says otherwise.
     - **Built:** as 174.
```

**Supersession marks:** 171 → `→ **Superseded in part by Decision 176** — S10, not S8, decides the table's audit trail.` Mark its INDEX line `→ **superseded in part by 176**`.

## 4. Questions for Ken

All six answered by Ken, 2026-10-05.

| # | Question | Answer |
|---|---|---|
| SQ1 | Split the plan's S8: **S8a** (this: record, block, `npc`, the tab) and **S8b** (interactions, history, affiliation as text), with Keep and Promote moving to **S10**? | **Yes.** Well-scoped increments are the point of the cadence; split whatever is too big to build in one |
| SQ2 | Origin, NPC roles and enemy role as the GM's **text** until S9's pack, matched by name then? | **Yes.** For S9: the precedent is the gear row (Decisions 120–121: a catalog reference or `custom`, and `migrate()` never guesses between them), so S9 *offers* a match to the pack, never converts on load |
| SQ3 | Armor and gear as **text lines** in S8a, linked to the catalog in S10? | **Yes** |
| SQ4 | **No undo** on the cast; Delete asks; S10 designs the table's audit trail (moves it from S8, Decision 171)? | **Yes** |
| SQ5 | Does a table open on **Cast** or **Notes**? | **Cast**, first in the tabs |
| SQ6 | A member's **status**: alive, dead, missing, gone. *Missing* is whereabouts unknown, still a thread; *gone* is alive but out of the story (left the city, retired, locked up), so the default *Alive* filter can hide them without calling them dead | **Four.** `gone` is an archive: alive, out of the story, hidden by the default filter. Its label is **Out of the picture** (the id stays `gone`) |

## 5. Read first

- `CLAUDE.md` whole: constraints 7, 8, 9, 10; the versions table's **Table
  schema** row; tiers; Decisions; voice.
- `docs/STATE.md` whole.
- The plan: §1a (what Scott said), §3 (rules 3, 5, 6, 7), §4e (the record,
  read whole; S8a builds its first half), §6 *S8*. And `../gm-mode/S03a-table-file.md`
  §7–§8, the shapes and UI this extends.
- `docs/SCHEMA.md` §3's *table file* block, and Decisions **63**, **98**
  (`statMod` past 10), **124**, **135**, **164**, **170–173**.
- **The patterns to copy:**
  - `engine.js`'s *Tables* section: `migrateTable`'s note loop (`_str`,
    `_isObj`, `NOTE_ID_RE`, `newTableNoteId(used)`), `_isoOrNull`,
    `_versionNewer`, `addTableNote` / `editTableNote` / `removeTableNote`.
    And `statMod`, `D().resources.healthLevels`, `health()` (read it for the
    rule; don't call it), `derived()`'s `sumOfModifiers` branch, `isFormula`.
  - `gm.js`: `tableChange(fn, redraw)`, `TABLE_SECTIONS`,
    `tableTabButtonsHtml`, `renderTable`, `bindTable` (saving on `input`,
    the focus after Delete), `noteCardHtml`, `openNameModal`, `askFirst`.
  - `shared.js`: `keepPlace` (Decision 164), `esc`, `notice`.
- Tests to copy from: `engine.test.mjs`'s *Tables* block; `hostile.test.mjs`'s
  `hostileTable`; `smoke.test.mjs`'s *Tables and the feature switch* block
  (`GM_ON`, `tableKeys`, `tableEntryOf`).
- **The Codex**, `private/crb/WIP_Threat_Codex_v2.md` §*NPC Roster* (Bob,
  Splice) and `private/crb/Threat_Codex_Intro_Human.md` Entry 01, for what a
  block looks like. **Never copy a word of it into `src/` or `tests/`**: the
  repo is public (Decision 167). Tests use a synthetic NPC (§9).

## 6. Out of scope

- Interactions, history, `firstMet`, the crew's view, affiliation, places
  and faction links (S8b, S6, S7). Not even as empty arrays (Decision 170).
- Keep, Promote, a fought copy, damage on an NPC (S10).
- The Codex, its pack, its rolodex and builder, any list of origins, roles,
  tiers or traits in `src/` (S9).
- Catalog links for armor and gear; `openCatalog` (S10).
- `overrides` (a drone's Dodge, a spirit's HP): S9, with the entries that
  need them.
- A full character as a villain (the plan's last §4e bullet): S3b's seats.
- Undo on the table (176).
- Any change to the character, `migrate()`, the sheet or Home.

## 7. The shapes

**The table, schema 0.2:** `table.cast`, after `notes`:

```js
cast: [ {
  id: "C-XXXXXXXX",                 // eight of the TAG alphabet; unique in the table
  name: "", flavor: "", description: "",
  origin: "", npcRoles: [ "" ], enemyRole: "",   // the GM's text (174)
  tier: null,                       // a whole number ≥ 1, or null
  motivation: "", resources: "", line: "",
  ifPushed: "", gmNote: "",
  status: "alive",                  // "alive" | "dead" | "missing" | "gone"   (gone: alive, out of the story; labelled "Out of the picture")
  block: null,                      // or a StatBlock
  created: "<ISO>", updated: "<ISO>"
} ]

StatBlock: {
  stats:   { BOD: null, REF: null, … },   // every D().stats id; a whole number or null
  authored:{ TOL: null, WILL: null },     // every D().derived id of type sumOfModifiers
  skills:  [ { skill: "streetwise" | null, name: "Streetwise", total: 6 | null } ],
  armor:   [ "" ],                        // text lines
  gear:    [ "" ],
  traits:  [ { name: "", text: "" } ]
}
```

**`migrateTable()`**, after the stamp handling:

- **Step 0.2 (Decision 174):** a table stamped before 0.2 gets `cast: []`
  if it has none. Then the stamp becomes `"0.2"` (a newer stamp is still
  kept). `TABLE_SCHEMA_VERSION = "0.2"`.
- **Every load:** `cast` an array of objects (anything else dropped). Each
  member: every text field `_str`; `npcRoles` an array of strings (a string
  becomes `[string]`, non-strings dropped); `tier` a whole number ≥ 1 or
  null (`"3"` becomes 3; `0`, `-1`, `2.5`, `"x"` become null); `status` one
  of the four, else `"alive"`; id kept if `/^C-<alphabet>{8}$/` and unused,
  else a new one; dates `_isoOrNull`; `block` null or coerced by `_block()`.
- **`_block(b)`**: not an object → null. `stats`: for each `D().stats` id, a
  whole number or null (`"6"` → 6, `6.5` → null, `{}` → null); keys the data
  doesn't have are kept, never read (a pack may print one). `authored` the
  same over the `sumOfModifiers` derived ids. `skills`: objects only;
  `name` `_str`; `total` a whole number or null; `skill` kept only if it's a
  `D().skills` id, else null. `armor`, `gear`: strings only. `traits`:
  objects only, `name` and `text` `_str`.
- Copy known keys by name; unknown keys at any level are kept. Idempotent.

**Engine** (Tables section, every function total):

```js
Engine.npc(block) → {
  stats:   { BOD: { value: 6, mod: 0 } | { value: null, mod: null }, … },   // by D().stats
  health:  { levels: 6, hpPer: 5, total: 30 } | null,   // null when BOD is blank
  authored:{ TOL: { value: 1, formula: 3 } , … },        // formula null when an input is blank
  blanks:  [ "REF", "skills", … ]                         // what isn't filled in, for the page
}
  // health: levels = min(BOD, maxLevels); hpPer = hpPerLevel + max(0, BOD − maxLevels)
  //   (the players' rule, health() without grants or adjustments)
  // formula: base + Σ statMod(input), floored, from each sumOfModifiers entry
  // a non-object, or a block migrateTable would refuse → every value null, health null
Engine.addCastMember(t, { name, line })        → { ok:true, id }   // line goes to flavor
Engine.editCastMember(t, id, fields)            → { ok:true } | { ok:false, why:"No such cast member." }
  // fields: any known text field, npcRoles, tier, status; coerced as migrateTable does
Engine.setCastBlock(t, id, block | null)        → same; block through _block()
Engine.removeCastMember(t, id)                  → same
Engine.castFilter(t, { q, status })             → [ member ]   // q over name, flavor, origin, roles; status "all" or one
```

Each edit stamps the member's and the table's `updated`, as the note edits
do. `addCastMember` puts the new member first.

**Where the line goes.** Quick-add's second field is the member's `flavor`
(the Codex's italic line under the name). Name it *line* only in the UI's
placeholder, never in the shape: `line` is *their line*, the thing they
won't do.

## 8. The UI

All in `gm.js`. Copy is GM-facing tool voice; the placeholders may carry
the city (mark them for a voice pass).

**Tabs.** `TABLE_SECTIONS` becomes `[cast, notes]`. A table opens on
`cast` unless its entry's saved `section` is another valid one.

**The Cast tab:**

- **Quick-add**, at the top: a name field (placeholder *Who did they
  meet?*), a line field (placeholder *One line: who they are*), and
  **Add**. Enter in either field adds. Empty name: nothing happens, no
  error. After adding, the name field is empty and focused, the line field
  empty, and the new member is first in the list.
- **Filters**, under quick-add: a search field (*Search the cast*) and a
  status choice (*Alive · All · Dead · Missing · Out of the picture*;
  *Alive* first and default). Typing filters without a redraw that loses the field's focus or
  caret (Decision 164; `keepPlace`, or redraw only the list).
- **The list:** one card per member from `Engine.castFilter`. Card: the
  name (wraps; `Unnamed` when blank), the flavor line, a meta line of what's
  set among origin, roles (joined with `/`), *Enemy:* role, *Tier n*, and the
  status when it isn't alive. A card shows *Stat block* when `block` has any
  number in it. Tapping anywhere on a card opens the member's page.
- **Empty states:** no cast: *Nobody yet. The city fills up fast.* (voice
  pass). A filter with no match: *No one matches.* with **Clear the
  filter**.

**The member's page** (`S.castOpen = id`, inside the Cast tab; a **Back to
the cast** button at its top, and the tab button itself, return to the
list with the filters as they were):

- **Who:** name (`<h2>`-sized input, wraps), flavor, description (textarea).
- **Codex fields:** origin, NPC roles (one text field, split on `/` or `,`
  into `npcRoles` and joined back with ` / `), enemy role, tier (a number
  field), status (four choices: *Alive*, *Dead*, *Missing*, *Out of the
  picture*; the last is stored as `gone`).
- **The goal, the resource, the line:** motivation, resources, line
  (textareas), labelled *What they want*, *What they've got*, *Their line*.
- **If pushed** (textarea), **GM note** (textarea).
- **Stat block:** a grid of number fields, one per `D().stats` id then each
  authored stat, labelled by the data's id. Beside each stat field its bonus
  (`+1`, `0`, `−2`) from `Engine.npc`; beside TOL and WILL *formula n*
  (nothing when the formula's inputs are blank). Above the grid, **Health**
  *30 (6 Health Levels)*, or nothing when BOD is blank. Skill rows: name,
  total, a remove button, and **Add a skill**; a skill name is plain text: `TIPS` has no skill kind (it has `tag`, `spelltag`, `stat`,
  `crank`), and building one is out of scope. Armor
  and gear: a line each, with add and remove. Traits: name and text, with
  add and remove.
- **Delete** at the bottom: `askFirst` (*Delete <name>?* / *Their page goes
  with them. Nothing else at the table changes.* / **Delete**). Then the
  list, focus on the next card or quick-add's name field.

**Saving.** Every text and number field saves on `input` through
`tableChange(fn, false)` (no redraw), as notes do. A number field that
changes a derived figure redraws **only** that figure's text (the bonus
beside it, Health, the formula), never the field. Adding or removing a row
redraws the page and puts focus in the new row's first field, or on the
**Add** button of that list after a removal.

**What each interaction must do** (the contract; markup is a suggestion):

- Quick-add: Enter adds and leaves focus in an empty name field; a GM can
  add five names in a row without touching the mouse.
- A card's tap opens its page; the tab button, **Back to the cast** and
  Home leave it with nothing typed lost.
- Typing in any field, then Home at once, keeps it (no `change` event).
- Typing BOD 6 shows *30 (6 Health Levels)* as the 6 is typed, without the
  field losing focus or caret.
- After every press that redraws (Add, Add a skill, remove a row, Delete,
  a status choice, Clear the filter), focus is on the thing named above,
  never `<body>`.
- Long names and lines wrap (`overflow-wrap:anywhere` on every heading,
  card name and meta line that shows the GM's text); at 390px nothing
  scrolls sideways and the stat grid wraps to fit.
- The vitals, flyout and pin stay away, as on the Notes tab.

**`changelog-pending.md`**, a second line:

> - **The cast.** A table keeps its NPCs: a name in one press mid-session,
>   or a whole stat block, with Health worked out for you.

## 9. Tests

`tests/engine.test.mjs`, under the *Tables* block, *The cast (Decisions
174–176)*. A synthetic NPC only (*Dez, a courier*, invented numbers):

- `newTable()` stamps 0.2 and has `cast: []`. A 0.1 table (S3a's shape, with
  two notes) migrates to 0.2 with `cast: []` and its notes byte-identical.
  A `"0.3"` table keeps its stamp and its `cast` (coerced), and
  `tableCheck` reports it.
- `migrateTable` is total and typed over cast junk: `cast: "x"`, `cast: [null,
  5, "x", {}, {name:5, npcRoles:"Fixer", tier:"3", status:"zombie",
  block:"x"}, {block:{stats:{BOD:"6", REF:6.5, MOB:{}}, skills:[null,{name:5,
  total:"7", skill:"not-a-skill"}], armor:[5,"Vest"], traits:[{}]}}]`: names
  strings, `npcRoles` `["Fixer"]`, tier 3, status alive, block null; BOD 6,
  REF null, MOB null; one skill with `name` "", total 7, `skill` null; armor
  `["Vest"]`; one trait with empty strings. Idempotent.
- Two members sharing an id: the first keeps it. A `TAG-…` id is replaced.
- An unknown key on a member, on a block and on `block.stats` survives.
- `__proto__` at the cast, member, block and stats levels: `({}).pwn`
  undefined.
- `Engine.npc`: BOD 6 → `{levels:6, hpPer:5, total:30}`; BOD 12 →
  `{levels:10, hpPer:7, total:70}` (the BOD-past-10 rule); BOD null → health
  null. Each stat's `mod` equals `statMod`. TOL's formula is `1 + mod(INT) +
  mod(BOD) + mod(COOL)`, floored at 1, and null when any is blank; stored
  TOL 1 with formula 3 reads both and warns nothing. `npc(null)`,
  `npc("x")`, `npc({stats:5})` don't throw. **The stat ids come from the
  data in the test too** (`D.stats.map(s=>s.id)`), so a ninth stat in the
  data needs no test edit.
- `addCastMember` / `editCastMember` / `setCastBlock` / `removeCastMember`:
  work, stamp `updated`, coerce, refuse an unknown id with the line in §7.
  `castFilter` by `q` (case-insensitive, over roles too) and by status.

`tests/hostile.test.mjs`: `hostileTable()` gains a cast member with `P(…)`
in every text field, a role, a skill name, an armor line and a trait, and
numbers as payload strings. Render the Cast list, the member's page and the
Delete question: `injected` is `[]`, `app.errors` empty, and every stat
field's `value` is a number or empty.

`tests/smoke.test.mjs`, *The cast (Decisions 174–176)*, with `GM_ON`:

- A table opens on Cast; Notes is the second tab and still works.
- Quick-add: type a name, Enter → first in the list, focus in an empty name
  field; five in a row; an empty name adds nothing.
- Open a card; type BOD 6: Health reads *30 (6 Health Levels)* and focus is
  still in BOD. Type TOL 1 with INT, BOD, COOL filled: *formula n* shows.
- Type in a field, then Home at once; reopen: it's there.
- Filters: search narrows; status *Dead* shows only the dead; *Clear the
  filter* brings all back and focuses search.
- Delete → Cancel keeps; Delete → Delete removes, focus on the next card or
  quick-add.
- Export → import on a fresh browser: the cast is identical. A saved 0.1
  table in storage opens as 0.2 with its notes.
- At `width: 390` nothing in the Cast tab or a member's page is wider than
  the screen, with a 60-character unbroken name (jsdom has no layout, so
  assert the CSS rule is on the elements, and check the pixels by hand).

`tests/docs.test.mjs` needs nothing new: STATE's table schema line moves to
`0.2` and the existing test checks it.

**Mutation-test** (each checked first against the code, per *Carried over*):

1. Remove step 0.2 (leave `TABLE_SCHEMA_VERSION` at `"0.2"`) → a 0.1 table
   has no `cast`. **Watch:** the every-load coercion would add `cast: []`
   anyway if it defaults a missing array, which would cover the step. If it
   does, the step is the coercion's and this mutation is moot: say so and
   test the stamp instead (0.1 in, `"0.2"` out).
2. Drop the `tier` coercion → the engine's typed test fails (`"3"` stays a
   string). Not the hostile test: a string renders as text either way.
3. Store Health on the member (write `npc(block).health` into `block`) →
   a test that `migrateTable(x).cast[0].block` has no key `health`, and
   that the exported file has none (constraint 7). Write that test.
4. Make `Engine.npc` derive TOL instead of reading `authored.TOL` → the
   "stored 1, formula 3" test fails.
5. Hard-code `["BOD","REF",…]` in `_block` and drop `MAG` → the data-driven
   test fails, because it reads `D.stats`.
6. Redraw the whole page on a stat field's `input` → the "focus still in
   BOD" smoke test fails.

Record each, what you checked, and what failed, in the PR.

## 10. Steps

Run `npm run verify` before starting and after each step. First:
`git submodule update --init private` (the CRB tests need it).

1. Confirm #113 and its fixes are merged; branch from `main`; confirm
   174–176 free; re-run the pre-flight's greps.
2. Engine: the 0.2 step, `_block`, the cast coercion, `Engine.npc`, the
   cast edits, `castFilter`, the exports. Engine tests.
3. `gm.js`: `TABLE_SECTIONS`, the Cast tab, quick-add, the list and filters.
   Smoke tests for those.
4. The member's page and the stat block. Their smoke tests.
5. Hostile tests, then the six mutations.
6. In the browser (`shadows-dev-preview`, `?gm=on`): quick-add five names
   by keyboard; open one and copy a synthetic block in; check Health; type
   then Home; Delete; export and import; 390px and 1300px. Switched off,
   Home is unchanged.
7. `npm run phone-check`, `npm run release:check`.
8. Ledger, docs, close-out (§12).

## 11. Stop and ask

- #113 isn't merged, or 174–176 are taken.
- Anything needs a list of the Codex's origins, roles, tiers or traits in
  `src/` or `tests/`, or a word of the Codex outside `private/`.
- A character-side file needs a change (`shared.js`, `wizard.js`,
  `sheet.js`, `app.js`): S8a should touch only `engine.js`, `gm.js`, the CSS
  and the tests.
- `Engine.npc` would need `health()` or `derived()` changed to share code.
  Copy the rule; don't refactor the character's readers.
- A Decision draft goes over 350 words after filling *Built*.
- A test outside the ones named fails and the fix isn't obviously yours.

## 12. Close-out

*Rule or shape* tier:

- **SCHEMA:** 174–176; 171 marked superseded in part; §3's table-file block
  gains the cast and the stat block, and the step's line (*0.2: cast*).
- **INDEX:** the three lines under **GM mode**; 171's line marked.
- **STATE:** Versions line `table schema 0.2`; §1's GM clause gains the
  cast (174–176); §5: S8a built, switched off; S8b's order next.
- **`changelog-pending.md`:** the cast's line (§8).
- **Log** entry; **shipped** row marked *(switched off)*.
- **The plan:** §6 *S8* split into S8a (built) and S8b, with Keep and
  Promote moved to S10's bullets; README's table: S8a's status, S8b next.
- **PR** titled `feat(gm): the cast and its stat blocks, switched off (W29
  S8a, Decisions 174–176)`. Body: what changed; the six mutations; the
  voice-pass lines (the two placeholders and the empty state); and **Where
  the order didn't fit**.

## 13. Review checklist

- [ ] Every *Done when*, in the browser, switched off and on.
- [ ] A real 0.1 table saved by S3a's build (make one on `main` before
      the PR) opens as 0.2 with its notes intact.
- [ ] `git diff` on `shared.js`, `wizard.js`, `sheet.js`, `app.js` is empty.
- [ ] No Codex word in `src/` or `tests/` (grep for each roster name and
      entry name in `private/`).
- [ ] The six mutations are real, re-run locally.
- [ ] Keyboard only: five quick-adds, open, BOD, back, Delete; focus never
      on `<body>`.
- [ ] Constraint 7: export a member with a full block and read the file;
      no Health, HP, bonus or formula is in it.
- [ ] `Engine.npc` matches the Codex's printed Health on Entry 01 and Bob
      (check by hand against `private/`; don't commit the numbers).
- [ ] 390px with a long unbroken name: no sideways scroll.
- [ ] 171 marked in SCHEMA and INDEX; nothing else unmarked (search *cast*,
      *NPC*, *TOL*, *WILL*, *undo*).
- [ ] Table schema 0.2 in `engine.js`, STATE and SCHEMA; no other bump.
