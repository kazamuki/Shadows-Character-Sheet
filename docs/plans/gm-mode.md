# Plan — GM mode: the table, its cast and its city (W29)

**Status:** proposed 2026-10-02, **not approved**. Ken is still in planning:
it goes to Scott and Deighton before anything is built, since they are the
GMs who'd use it. Nothing here is a decision until the session that builds
it numbers it in `SCHEMA.md` §4. Its open questions are `GQ`_n_ (§9), each
with the default the build takes if nobody answers first.
**Wanted by:** no date. Scope is the whole of W29's file-based stage, plus
the GM toolkit on top of it. Live sync (W29 stages 2–3) is out of scope and
gets its own plan when this one is built (§8).
**Sources:** W29 (`WISHLIST.md`); the GM Workshop, Parts I–VI (`private/crb/200`–`253`);
the World of Shadows (`100`–`130`); Scott's *Threat Codex — Intro + Human*
(front matter, 42 entries, 29 encounter groups, the drone reference, the
Trait Glossary v3 and the Trait Library); Scott's *Threat Codex Expansion*
proposal (2026-09-29, unapproved); Ken's *Origin Matrix* page; Decisions 48,
49, 68, 115, 118, 124, 128, 135, 137, 139, 141, 150, 153.
**Tier:** *Rule or shape*, many times over. A second kind of saved file (the
table), a third (the dispatch), a character-schema bump (CRANK reputation and
the inbox), a new top-level mode, and new data. Each session below names its
own decisions.

---

## 1. What it's for

The user is the **GM**. A GM runs a **table**: a campaign with **players**
seated at it, and each player runs **one or more characters** (a main and a
backup, a retired one, a troupe). The GM wants to:

- **see the table at a glance**: a spread of cards, one per character,
  grouped by player, each opening that character's sheet;
- **get the sheets in** without asking anyone for numbers;
- **act on them**: award IP and Çredits, note a hit, leave a note, and have
  the change **reach the player**;
- **run the city**: a cast of NPCs who persist, threats built from the Codex
  or from scratch, the places the crew has been, the factions moving behind
  them, and the GM's own notes;
- **run the session**: who came, what happened, what it paid, what's next.

The Workshop already describes how a GM does all of this on paper. Most of
this plan is putting Scott's worksheets, roles and tables on screen, not
inventing a GM toolkit.

**Not in scope.** Live sync (§8); maps, tokens, a virtual tabletop; dice
rolling for players (they roll real dice); voice or video; accounts.

## 2. What the books already decide

| The GM needs | The book's answer | Where |
|---|---|---|
| An NPC model | **One record.** "An enemy is an NPC who decided a line was crossed." Every NPC has an **NPC Role** (who they are), an optional **Enemy Role** (how they fight), an **Origin** (what formed them), and a goal, a resource and a **Line** | `223`; Codex front matter |
| How much to stat an NPC | **Partial** (stats, a few skills) for the disposable; **full** for anyone who persists or adapts; a partial block is finished between sessions if the NPC turns out to matter | `223` *When to Fully Stat an NPC* |
| The stat block | Ten stats (TOL and WILL derived, as floors), Health as HP and Health Levels, armor from Gear, skills as **totals**, gear, traits, GM note, If Pushed | Codex *How to Read an Entry* |
| Threat weight | Tiers T1–T4, each with stat ranges and a trait budget; Apex is never pre-built | Codex *Tier Reference* |
| Origins | Seven mortal origins, each a stat modifier set applied **at construction** | Codex *Origin Reference* |
| Pre-built threats | 42 entries, 29 encounter groups, two drones, ~100 named traits in three kinds (Universal, Origin, Signature) | Codex Parts B–C |
| Named NPCs | Ten roster NPCs (Bob, Splice, Chen, …) in *Motivation · Resources · Their Line · stats · If Pushed* form | `200` Part VI *NPC Roster* |
| Supernatural and environmental threats | **Proposed, not approved:** seven Orders beside Origin, Bound/Changed/Other modifier rules, three new fields, named lieutenants, Site Profiles with tracks and clocks | Expansion proposal |
| Places | Territory → Zone → District → Neighborhood; six Territories with Zones, Supernatural Sites, Business Interests and Factions; eleven places beyond the city | `100`, `110` |
| Powers | Five corporations, the Unseen Court and its houses, the Chrome Berets, the Goblin Market | `120` |
| GM notes | Four worksheets: **Session 0 Shared Overlap**, **Encounter Design**, **Campaign Journal** (six parts a session), **Faction Tracker** (tipping points, a Hostile↔Allied stance) | `220`, `224`, `227`, `200` *Tracking* |
| Ending a session | About **5 IP an hour, to players present only**; write the consequence log | `226`, `242` |
| An absent player | Their character took a **CRANK job off-screen**: Çredits from the lower half of their tier's range, no rep | `242`, `200` *CRANK* |
| Milestone pacing | A 5-session micro-arc is a Minor Milestone cycle; a 10-session arc a Major | `240` |
| Work | **CRANK**: a five-column d10 job generator, and a **personal reputation** with five tiers and payouts | `200` *Crank and Bank* |
| Turn order | Order of Engagement by Combat Sense, ties rerolled; Reset closes the round (bleeding, fire, durations) | `053` |

**Checked against the engine, 2026-10-02** (a script over the Codex, not a read):

- **Health is right on all 42 entries**: BOD Health Levels at 5 HP, as `030`
  and the engine compute it. Bob's 16 was a typo (Ken, 2026-10-02); NPCs use
  the players' rule.
- **The stat bonus table matches** `statRules.modifiers` exactly (3 → −1 … 10 → +4).
- **WILL is above its formula on 34 of 42 entries.** The Codex allows it ("calculated
  values are the floor"). So above the formula is the norm, not the exception,
  and a stat block **stores** TOL and WILL and the engine checks the floor.
- **TOL is above its formula on two** (08 Corporate Sniper, 10 Tactical
  Analyst), and the Codex's note covers only WILL (GQ6).
- **Eleven gear items aren't in the Gear tables** (the Codex's own ⚠ list:
  Leather Jacket, Denim Jacket, Road Warrior's Jacket, Layered Street Clothes,
  four rifles and weapons, two drones and their controllers). Gear on an NPC
  is therefore text first, catalog reference second (§4e).
- **The Origin Matrix page predates the Codex.** Its origins are Street,
  Syndicate, Corporate, **Elite**, Tech, Rogue, Occult, with the old deck's
  modifiers; the Codex has **Agency** and different modifiers. The Codex wins.
  The page's 7 × 8 grids of concept names (Corner resident, Block fixer, …)
  aren't in the Codex at all (GQ5).

## 3. The rules this plan keeps

1. **The player owns the character.** The GM never edits a sheet. Everything
   the GM does to a character is a **dispatch**: a note or a proposed change
   the player accepts or declines on their own sheet, where an accepted one
   becomes an ordinary undoable action (Decisions 48–49). Two people editing
   one file is the merge problem this avoids. `226` agrees: players track IP
   on their own sheets.
2. **The transport is swappable.** A dispatch is a shape; today it travels as
   a file, later through a service (§8). Nothing in the GM mode knows which.
3. **The GM's material never enters the character schema.** NPCs, notes,
   places and journals live in a **table file** with its own gate.
4. **Same app, a second mode.** The GM view is mostly the engine, the data and
   the sheet renderer. A GM is often also a player.
5. **Every hard constraint holds.** `file://`, no network (137), no modules,
   the engine without a DOM, ids immutable, inputs stored, the engine total,
   untrusted files (124), and maintainer content never rendering: the
   Codex's ⚠ gear flags, "in review" notes and footers are `flagNote`, never copy.
6. **Traits are text.** The engine never automates a trait ("+1 to attack when
   three Toughs…"). It shows them, at the right moment, for the GM to apply.
   The same call Decision 153 made for a custom archetype's powers.
7. **Content is data.** A new Codex entry, Order, trait or Zone is a data edit
   with zero app changes (Decision 135's rule, both directions).

## 4. The shape

### 4a. Where it lives

Home gets a second door, **Run a table**, beside the roster. A table opens
into its own shell with its own tabs (§4b). The player's sheet is untouched
except for the inbox and CRANK rep (§5).

**Storage.** One key per table, `shadows.table.v1.<tableId>`, the roster's
pattern (141): no index key, one entry per table, its own `changed`/`exported`
marker so Home can say which table has work no file holds. A seated
character's copy lives **inside the table**, never in the GM's own roster:
the roster is keyed by TAG, and a GM who also plays would collide with
their own character.

**Size.** `localStorage` is about 5 MB a site. A table holding six
characters with long audit trails, a cast of sixty and a year of journals
could approach it. So the table file is the save, not the browser (141's
caution, louder), and S3 measures a realistic table before going on (GQ9).

### 4b. The GM's tabs

| Tab | What it holds | Session |
|---|---|---|
| **Table** | The card spread: one card per seated character, grouped by player | S3 |
| **Sessions** | The session list; each session's attendance, IP, journal, dispatches | S5 |
| **Cast** | Every NPC, from a line of text to a full stat block | S8 |
| **Threats** | The Codex rolodex and the builder | S9 |
| **Encounter** | The running fight | S10 |
| **City** | Places, factions and the powers, with the crew's history in each | S6–S7 |
| **Work** | CRANK jobs and the generator | S11 |
| **Notes** | The Session 0 worksheet, freeform notes | S5 |

The tab list is a design sketch for S3; the order and grouping are Scott's
and Deighton's call (GQ1).

### 4c. The table file

`.shadows-table.json`, gated by `migrateTable()` exactly as `migrate()` gates
a character: every number a number, every id a string, nothing executed,
nothing outside the table written. Its own `meta.tableSchemaVersion`, a fifth
version with its own trigger (the table file's shape changes), which needs
adding to `CLAUDE.md`'s versions table.

```
table: {
  meta:      { id, name, tableSchemaVersion, created, updated },
  settings:  { statPointMethod, powerLevel, tone, lines, veils, … },   // Session 0
  players:   [ { id, name, seats: [ { tag, status, character, importedAt } ] } ],
  cast:      [ CastMember ],            // §4e
  places:    [ PlaceRecord ],           // §4f, the crew's history, not the gazetteer
  factions:  [ FactionRecord ],         // §4f
  sessions:  [ SessionRecord ],         // §4g
  encounters:[ EncounterRecord ],       // §4h
  jobs:      [ JobRecord ],             // §4i
  clocks:    [ Clock ],                 // shared by factions, sites and jobs
  notes:     [ Note ],                  // freeform, linkable
  dispatches:[ Dispatch ]               // everything sent, and what came back
}
```

A seat's `status` is `active`, `benched`, `retired` or `dead`, so a player's
backup and fallen characters stay at the table without crowding the spread.
`character` is the last imported copy, read-only, run through `migrate()`.

**Links.** A record links another by `{ kind, id }` (a cast member's
`places`, a journal's "Who was affected?"). A link to something deleted
renders as its last-known name, struck through, never an error (constraint 8).

### 4d. The dispatch

```
dispatch: { id, tableId, tableName, to: TAG, created, items: [
  { id, kind: "note",       text },
  { id, kind: "ip",         amount, reason },
  { id, kind: "credits",    amount, reason },
  { id, kind: "crankRep",   amount, reason },
  { id, kind: "luck" | "san" | "damage" | "condition" | "gear", … },
  { id, kind: "handout",    title, text }
] }
```

- **To the player:** a `.shadows-dispatch.json` file, one per character or
  one per table holding many (GQ3). The player imports it on Home or the
  sheet, and the sheet's **From your GM** inbox lists each item with
  **Accept** and **Decline**. An accepted item runs through the same engine
  action the sheet's own control does (`ip` is the IP award, `damage` is Take
  a hit, through armor), so a dispatch adds no second rules path. Its audit
  entry carries the dispatch item's id.
- **Back to the GM:** the player's next export. On re-import the table reads
  the audit for item ids and marks each item **applied**, **declined** or
  **pending**. Nobody reports anything by hand.
- **A dispatch is untrusted** (124): `migrateDispatch()` checks every item;
  an unknown `kind` is shown as a note, never applied. A dispatch can only
  ever propose what the sheet's own controls could do.
- **The inbox is not a backdoor.** It never writes a field the sheet has no
  control for, and a declined item leaves no trace but its audit line.

### 4e. The cast member, and the stat block

One record, from a name on a napkin to an Apex (§2's first row):

```
CastMember: {
  id, name, flavor, description,
  origin, order?,                    // order only once the Expansion is approved
  npcRoles: [ ],                     // "Civilian / Wild Card" is two
  enemyRole?, tier?,                 // absent until they'd fight
  motivation, resources, line,       // "every NPC has a goal, a resource, and a line"
  rules?, resolution?, vulnerabilities?,   // the Expansion's fields; text
  block?: StatBlock,                 // absent, partial or full
  ifPushed: { text, links: [ ] },    // to a Codex entry, an EG, another cast member
  codexEntry?,                       // "built from Entry 05"
  places: [link], factions: [link],  // where they turn up, who they answer to
  status: "alive" | "dead" | "missing" | "gone",
  firstMet?: sessionId, gmNote, history: [ { session, text } ]
}

StatBlock: {
  stats: { BOD, REF, MOB, INT, TECH, COOL, MAG, EMP, TOL, WILL },  // null allowed (a drone's INT)
  skills: [ { id or name, total } ],     // totals, as the Codex prints them
  armor: [ catalogRef | { custom text } ],
  gear:  [ catalogRef | { custom text } ],
  traits:[ traitRef  | { name, kind, text } ],
  overrides: { dodge?, hpPerLevel?, healthLevels? }   // drones, the Expansion's spirits
}
```

- **Derived, never stored:** Health Levels and HP from BOD (the players'
  rule), the stat bonuses, and the **floors** of TOL and WILL. The engine
  warns when a stored TOL or WILL is under its floor, never when it's above
  (the Codex's rule, and 34 of its 42 entries).
- **Skills are totals.** The Codex prints a total, not a rank, so the block
  stores the total and nothing derives it. A skill named in the data's
  catalog links to its description; one that isn't stays text.
- **A partial block is just a block with blanks.** "Finish the stat block"
  is filling them in, and the record says which fields are blank, not which
  tier of completeness it's in.
- **Remember** is built into this: the record already persists. A fought copy
  of a cast member (§4h) that survives writes its damage and a history line
  back. A codex entry dropped into a fight as "Street Tough ×3" isn't in the
  cast at all until the GM presses **Keep** on one.
- **A villain can be a full character**, built in the wizard (a Custom
  archetype if need be, Decision 153) and seated on the GM's own side, read
  and played through the real sheet. The cast record then links the TAG.

### 4f. The city

**The gazetteer is data** (`110`, `120`, `130`): Territories and their Zones,
Supernatural Sites, Business Interests and Factions; the powers; Beyond NYTE
City; the five environmental kinds. Each entry an id, a name, its Territory
(and Zone, where `110` gives one), its kind, and **one line** of summary. Not
the chapter's prose. A player's file carries this data too, and the full
text is the book's job (GQ10).

**The crew's city is the table's:** a `PlaceRecord` links a gazetteer id or
names a custom place at any level (a District or Neighborhood is always
typed in; the book names Territories and Zones), and keeps when the crew was
there, what happened, the cast met there, and the environmental kind if it
has one. A `FactionRecord` is the **Faction Tracker** worksheet verbatim:
name, type, territory, key NPCs (cast links), what they want, resources and
reach, tipping points for and against the crew, a stance on the Hostile↔Allied
line, and notes. A gazetteer faction (Eclipse, the Volkov Group) seeds one.

**Clocks** are one primitive (segments, filled, a label, what fills it), used
by a faction's escalation, a Site Profile's Drift (once approved), a job's
deadline and the Encounter Design worksheet's escalation.

### 4g. Sessions

A `SessionRecord` holds a date, a number, **attendance** (which seats were
present), **hours**, and the **Campaign Journal**'s six parts, each a text
field with links where the worksheet asks "who": what happened, consequences
and fallout, new threads, faction and city impact, the close reflection, and
the seed for next session.

**Closing a session** is one sheet the GM reads before anything is sent:

1. Attendance and hours → **IP**: 5 an hour to each character present
   (`226`), editable before it goes.
2. Each absent character → an optional **off-screen CRANK job**: Çredits
   rolled in the lower half of their tier's payout range (`242`).
3. The micro-arc counter: the 5th and 10th sessions remind the GM a Minor or
   Major Milestone cycle has turned (`240`). A reminder, not an award (GQ8).
4. **One dispatch per character** with the lot. Nothing is sent without
   the GM seeing it.

The **Session 0 Shared Overlap** worksheet (shared location, contact,
dependency, recent event) is the table's first note, and its answers can
become a place, a cast member and a clock in one press each.

### 4h. Encounters

The **Encounter Design worksheet** (basics, NPCs, environment and hazards,
objectives beyond "defeat the enemy", escalation, finding an out, hooks, GM
prompts, when momentum stalls) is the encounter's prep half. The running
half:

- **Participants:** seated characters (by reference: their order, never a
  second copy of their HP), cast members, Codex entries ×n (each copy its own
  damage track), and encounter groups unpacked into their parts.
- **Order of Engagement:** each participant's Combat Sense total, rolled or
  entered; ties flagged for a reroll (`053`).
- **The round:** a pointer, then **Reset**'s checklist: one Fast Action each,
  bleeding, burning, durations, saves (`053`).
- **Damage to NPCs** runs the engine's own pipeline: damage through armor,
  Health Levels, Pain Levels, Conditions (Decisions 95–100). The engine gets
  an NPC adapter, not a second pipeline.
- **Traits as reminders**, shown on the active participant's row, and a
  trait with a trigger ("at their last Health Level") lights when its
  trigger's state is visible to the engine.
- **Damage to a player character** is a dispatch line, queued, not applied:
  "Nyx took 14 Ballistic to the torso". The table at a physical table already
  says it aloud; the dispatch is the record.
- **Ending it:** survivors among Codex copies can be kept as cast members;
  cast members write a history line; the session journal gets a line.

### 4i. Work

**The CRANK generator** is the five d10 columns (job, client, target,
location, complication), rolled or picked, as data. A `JobRecord` is a
generated or written contract with a client (a cast link, or text), a tier,
a payout, a status (posted, taken, done, failed, abandoned) and the crew on
it. Closing a job proposes Çredits and **+1 rep** (done) or **−2 rep**
(abandoned) to each character on it, as a dispatch.

## 5. The player's side

Only three things change on a player's sheet, and only the first is visible
without a GM:

1. **CRANK reputation** (Ken, 2026-10-02: it goes on the sheet). A stored
   number on the character with a ledger like Çredits', and the tier derived
   from data (`crankTiers`: Novice 0, Competent 5, Skilled 12, Expert 20,
   Legendary 30, with each tier's payout range). Shown beside Çredits; raised
   and lowered with a reason, undoable. Distinct from the **Reputation**
   Advantage, which is a different thing and keeps its name (GQ7 asks
   whether either should say so).
   *Tier:* Rule or shape: a schema bump, a `migrate()` step seeding 0, a
   decision, a game-data bump (`crankTiers` is data a character observes).
2. **The inbox.** Import a dispatch; accept or decline each item.
3. **The audit carries a dispatch id** on an accepted item, so a GM's
   re-import can tell what landed.

Everything else about the player's sheet is untouched. A player who never
meets a GM mode sees one new number.

## 6. What ships when: the sessions

Each session is one batch, ends with `npm run verify` green and a log entry,
and leaves the app openable. Each says what it depends on, what decides it,
and what's done. **The order is chosen so the riskiest shape questions
(storage, the dispatch, the read-only sheet) are answered first**, and
content-heavy work (the Codex, the gazetteer) lands on a shape that's
already been used.

| # | Session | Tier | Depends on | Visible to a player? |
|---|---|---|---|---|
| S0 | This plan, the mirror, the questions page | Docs | — | No |
| S1 | CRANK reputation on the sheet | Rule or shape | — | **Yes** |
| S2 | The dispatch and the inbox | Rule or shape | S1 (rep is a dispatch kind) | Yes, once a GM sends one |
| S3 | The table: players, seats, import, the card spread, the read-only sheet | Rule or shape | — | No |
| S4 | GM writes: notes and the dispatch composer, and reconciliation | Rule or shape | S2, S3 | No |
| S5 | Sessions: attendance, close-out, the Journal, Session 0 | Rule or shape | S4 | No |
| S6 | The gazetteer and the crew's places | Content + shape | S3 | No |
| S7 | Factions and clocks | Rule or shape | S6 | No |
| S8 | The cast: the record, partial blocks, the NPC roster | Rule or shape | S3, S6 | No |
| S9 | The Threat Codex as data: rolodex and builder | Content + shape | S8 | No |
| S10 | The encounter tracker | Rule or shape | S8, S9 | No |
| S11 | CRANK work: the generator and the jobs board | Content + shape | S1, S4 | No |
| S12 | Supernatural Orders and Site Profiles | Content | Scott's proposal approved; S9, S7 | No |
| S13 | The GM screen: the reference, handouts, print | Fix + content | — | No |

### S0 — This plan (Docs)

The CRB mirror gains `100`–`130`, `200`–`253`, the Codex and the proposal,
all in the private `private/crb/` (Decision 167, GQ12). This plan, its questions, W29 pointing here, and a
page for Scott and Deighton that leads with §9.
**Done when:** Ken approves the shape, and Scott and Deighton have answered
or defaulted every *They* question in §9.

### S1 — CRANK reputation on the sheet

- **Data:** `crankTiers` (five rows, rep thresholds, payout ranges). Bumps
  `gamedataVersion`.
- **Schema:** `trackers.crank: { rep: 0, ledger: [] }`, the Çredits shape;
  `migrate()` seeds and clamps it (a hostile file's `"rep": "lots"` is 0).
- **Engine:** `Engine.crank(ch)` → `{ rep, tier, next }`, total.
- **Sheet:** a card beside Çredits on Main: the tier name and the rep,
  with a tip (139) explaining tiers; Raise and Lower take a reason.
- **Print:** a line in the front page's resource row, if there's room
  (Decision 96 says it's full — GQ11).
- **Decision:** one, *CRANK reputation is a tracked resource on the
  character*. **Tests:** migrate round-trip, the hostile file, tier
  boundaries pinned against `200`'s table.
- **Can ship to main on its own** (§7).

### S2 — The dispatch and the inbox

- `migrateDispatch()`, the item kinds, and `Engine.applyDispatchItem(ch, item)`,
  which calls the existing actions and returns `{ ok, change }` or a refusal.
- The inbox: on Home ("From your GM — 3 waiting for Nyx") and on the sheet.
  Each item with Accept and Decline; Accept is a `commit()`, undoable.
- The audit entry gains `dispatch: <itemId>`, so S4 can reconcile.
- **Tested without a GM mode:** hand-written dispatch fixtures, including a
  hostile one (an unknown kind, a negative amount, a 10 MB note).
- **Decisions:** the dispatch file and its gate; the inbox rule (*a dispatch
  only proposes what the sheet's own controls can do*). Schema bump for the
  audit field, if `migrate()` needs to know it.

### S3 — The table

The riskiest session, because it settles storage, the table file, and the
read-only sheet.

- **Run a table** on Home; new, open, export, import, remove, with the
  roster's unexported marker.
- Players and seats; import a character onto a seat (drop several files at
  once); a newer copy of the same TAG updates the seat; an older one asks.
- **The card spread:** one card per active seat, grouped by player. Name,
  archetype, TAG, Health and Pain, SAN, Luck, Conditions, Çredits, IP
  unspent, CRANK tier, and **how old the copy is** ("as of Tuesday's
  export"). Benched, retired and dead seats fold below.
- **The read-only sheet:** the real renderer with a `readOnly` flag: every
  control rendered inert, no `commit()` path reachable. This is the main
  engineering cost of the plan, and S3 measures it before committing to it
  (GQ13).
- **Measure storage:** build a realistic table (six characters, long audits)
  and record its size in the log.
- **Decisions:** the table file and `migrateTable()`; the storage key; the
  table-schema version (and `CLAUDE.md`'s versions table); seats outside the
  roster. **Tests:** hostile table files; a character imported twice; the
  read-only sheet has no reachable write.

### S4 — GM writes

- A note on a seat: private (stays in the table) or to the player (a dispatch).
- The dispatch composer: one character or the whole table; the item kinds
  from S2; a preview of what the player will see; **Export dispatches**.
- **Reconciliation** on re-import: each sent item applied, declined or
  pending, shown on the card and in the session it came from.

### S5 — Sessions

- The session list; attendance by seat; hours.
- **Close the session** (§4g): IP at 5 an hour to those present, the
  absent's off-screen job, the arc counter, one dispatch each.
- The **Campaign Journal** per session; the **Session 0 Shared Overlap**
  worksheet as the table's first note.
- **Decision:** the close-out rule as built (present only, 5 an hour as a
  default the GM edits, a reminder for milestones, not an award).

### S6 — The gazetteer and the crew's places

- **Data:** `gazetteer` from `110`, `120`, `130`, with one-line summaries
  written for it and voice-passed. Ids are permanent.
- A place picker: Territory → Zone, then a typed District and Neighborhood;
  custom places; the five environmental kinds as tags.
- The crew's places: visited when, what happened, who was met there.
- **Decisions:** the gazetteer's shape, and whether GM data shares the
  players' data file or has its own (GQ10). A second data file is a change
  to constraint 4's script order, so it's a decision either way.

### S7 — Factions and clocks

- The **Faction Tracker** as a record; gazetteer factions seed one.
- The stance line, tipping points, key NPCs as cast links (stubs until S8).
- **Clocks**, shared, on factions first.

### S8 — The cast

- The cast record and the stat block (§4e), partial or full.
- The engine's NPC reader: `Engine.npc(block)` → Health Levels, HP, bonuses,
  TOL and WILL floors, warnings. Total, like every reader.
- **The NPC roster** from Part VI (Bob, Splice, Chen, the Archivist, Kira,
  Marta, Threadbare, the Warden, Juno, Marcus, the Patron) as **examples to
  copy**, not as cast: a GM's cast starts empty.
- Keep, Promote (a fought copy into the cast), history, status.
- **Decisions:** the cast record; the stat block; *NPC TOL and WILL are
  stored with a derived floor* (a deliberate exception to constraint 7's
  letter, because the Codex says the value is authored above the formula).

### S9 — The Threat Codex as data

- **Data:** origins (seven), NPC roles (eight, plus Patron if GQ4 says so),
  enemy roles (eight), tiers (four), entries (42), encounter groups (29),
  traits (the glossary), the drone reference. Gear by catalog id where the
  Gear tables have it; text where the ⚠ list says they don't.
- **The rolodex:** browse by origin, role and tier, through `openCatalog`
  (118) as a new `kind`; a card per entry; **Use** copies it into a fight or
  into the cast.
- **The builder:** origin, NPC role, enemy role and tier; origin modifiers
  applied at construction; the tier's ranges shown beside each stat, and a
  warning (never a block) outside them; the trait budget counted; traits
  picked from the glossary or written.
- **The matrix:** the Origin × Role concept grid, if GQ5 makes it canon,
  with **Pull from the city**.
- **Decisions:** the Codex's data shape; that GM content bumps no
  `gamedataVersion` (no character can observe it, Decision 68) but has its
  own content version.

### S10 — The encounter tracker

- The Encounter Design worksheet; participants; Order of Engagement; rounds
  and Reset; NPC damage through the engine's pipeline; Conditions on NPCs;
  traits as reminders; PC damage queued as dispatch lines; ending it.
- Encounter groups unpack into their entries.
- **Decision:** the NPC adapter onto the damage pipeline, and what it
  doesn't model (traits).

### S11 — CRANK work

- The generator's five columns as data; roll or pick; a job record; the
  jobs board; closing a job proposes Çredits and rep by dispatch.

### S12 — Supernatural Orders and Site Profiles

**Waits on Scott's proposal being approved.** The shape is already there
(`order`, `rules`, `resolution`, `vulnerabilities`, `overrides`, clocks), so
this should be content: the seven Orders and their modifiers, the
Bound/Changed/Other rule in the builder, the ~28 entries, the lieutenants as
roster examples, the Site Profiles on places with their tracks and clocks. If
it turns out to need code, that's a finding about S8 and S9's shape.

### S13 — The GM screen

The reference tips (139) gathered on one screen: defenses, default TN and
TH, Pain Levels, Conditions, the tier table. Handouts (a dispatch kind).
Printing a cast member, an encounter, a session's journal.

## 7. How the branch works

Ken asked for one branch for the whole feature. That works, with two rules:

- **Sync `main` in at the start of every session.** Main keeps moving (the
  0.36 release, W59, the CRB catch-up), and this branch touches `shared.js`,
  `sheet.js` and `app.js` everywhere. A month of drift is a week of conflicts.
- **The branch passes `npm run verify` at the end of every session**, like
  main has to, so any session can start from it.

**One exception worth taking:** S1 (CRANK rep) is a complete player feature
with no GM dependency. It could go to main and ship on its own, which also
tests the schema bump on real players before the table depends on it (GQ14).

**Merging early.** The Home door appears in S3, and the app has no feature
switch to hide a half-built mode (and the app doesn't narrate its build
state, constraint 9). So the branch merges at a point where what's there is
finished: after S5, the first point a GM gets real value, or at the end.
The default is the end.

## 8. Later: live sync (W29 stages 2–3)

Out of scope here. When this plan is built, the dispatch and the table file
are exactly what a service would carry: a seat subscribes to a character's
latest snapshot, a dispatch is posted instead of saved. W29's API sketch
still fits. The questions it needs (who hosts and pays, how long data is
kept, consent) are Ken's, and only worth asking once a table has been run
from files and somebody wants it live (GQ2).

## 9. Questions

Each has the default the build takes if nobody answers. **They** = Scott and
Deighton.

| # | Question | For | Default |
|---|---|---|---|
| GQ1 | Which tabs, in what order? Is anything in §4b missing or not worth it? | They | §4b as written |
| GQ2 | Do you run in person, online or both, and do players have devices at the table? Is files between sessions enough, or is a live view the point? | They | Files are enough to start; live sync is a later plan |
| GQ3 | One dispatch file per character, or one per table that each player's sheet reads its own part of? | Ken | One per table: one file to drop in a chat channel |
| GQ4 | Is **Patron** an NPC Role? The Codex says "in review"; the Workshop's roster uses it | Scott | Not a role; the Patron is an example NPC |
| GQ5 | Is the Origin Matrix's 7 × 8 concept grid canon, and with which origins? (The page has Elite and the old modifiers; the Codex has Agency) | Scott | Not in the app until it's in the Codex |
| GQ6 | Entries 08 and 10 have TOL above the formula. Is TOL, like WILL, a floor an author can exceed? | Scott | Yes, the same rule as WILL |
| GQ7 | CRANK reputation and the **Reputation** Advantage share a word. Should either say how they differ? | Deighton | A tip on CRANK rep says it's the platform's score |
| GQ8 | Milestone cycles (5 and 10 sessions): does the GM award them, or does the sheet already handle it? | Deighton | A reminder to the GM, no award |
| GQ9 | If a table outgrows browser storage, is "the table file is the save" acceptable, or does it need to fit? | Ken | Acceptable, with the unexported marker |
| GQ10 | Does the GM's content (the Codex, the gazetteer) ship in the one file every player gets, or in a separate GM build? | Ken | **Proposed 2026-10-02:** two builds. The GM content lives in `private/gm/`; the public site ships the player app and the GM mode's code, tested against a synthetic fixture; `shadows-gm.html` is built with the private data and handed out, never deployed. A passphrase-encrypted edition only if that file starts circulating |
| GQ11 | CRANK rep on the printed sheet, when the front page is full (Decision 96)? | Ken | Page 2, by Çredits |
| GQ12 | **This repo is public.** Where do the CRB mirror and the Codex live? | Ken | **Answered 2026-10-02:** a private repo, mounted at `private/` (Decision 167). Whether the Codex ships is GQ10 |
| GQ13 | If the read-only sheet turns out expensive, is a summary card plus the printed sheet enough for a GM to read a character? | Ken | Build the real read-only sheet |
| GQ14 | Ship S1 (CRANK rep) to main on its own, or keep it on the branch? | Ken | Ship it on its own |
