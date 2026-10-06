# Plan — GM mode: the table, its cast and its city (W29)

**Status:** proposed 2026-10-02, **not approved**. Ken is still in planning:
it goes to Scott and Deighton before anything is built, since they are the
GMs who'd use it. Nothing here is a decision until the session that builds
it numbers it in `SCHEMA.md` §4. Its open questions are `GQ`_n_ (§9), each
with the default the build takes if nobody answers first.
**Revised 2026-10-02, the same day:** Scott answered the GM questionnaire and
sent *Threat Codex v2*. His answers reorder the sessions (§6) and add three
records (threads, interactions, the award log). §1a has his answers and what
each one changed. Deighton's answers are still to come.
**Wanted by:** no date. Scope is the whole of W29's file-based stage, plus
the GM toolkit on top of it. Live sync (W29 stages 2–3) is out of scope and
gets its own plan when this one is built (§8).
**Sources:** W29 (`WISHLIST.md`); the GM Workshop, Parts I–VI (`private/crb/200`–`253`);
the World of Shadows (`100`–`130`); Scott's *Threat Codex — Intro + Human*
(front matter, 42 entries, 29 encounter groups, the drone reference, the
Trait Glossary v3 and the Trait Library); Scott's *Threat Codex v2* (WIP,
2026-10-02: the front matter rewritten, Orders folded in, the NPC roster
moved in); Scott's *Threat Codex Expansion* proposal (2026-09-29, unapproved);
Scott's questionnaire answers (§1a); Ken's *Origin Matrix* page; Decisions 48,
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

## 1a. What the GMs told us

Scott's answers to the questionnaire, 2026-10-02, summarized. Deighton's go
here when they arrive.

| Asked | Scott | What it changes |
|---|---|---|
| What do you run with now? Where? | Paper with electronic references. In person; players have phones and tablets | GQ2 answered. Files between sessions are enough to start. The GM is probably on a tablet too: everything in an encounter has to work by touch (Decision 165's phone rules apply) |
| How do you prep? What do you wish was done? | Reread last session for threads still open, check them against the campaign's long plan. **Wants a to-do list from last session** | **Threads** become a record (§4g), and opening a table lands on **Next session**: the open threads, last session's seed, and clocks near full |
| Where do you look for an NPC in a hurry? | **A roster with affiliations**, so it isn't "Bob the Goblin" thirty times | The cast (S8) and the Codex (S9) move to the front of the order. Affiliation is the cast record's `factions`, filterable |
| What do you need on a PC mid-session? | **Health, Awareness and Conditions** | The card spread leads with those three. But Health and Conditions change mid-fight and the card is a snapshot from the last export (GQ19) |
| What do you track in a fight? What do you lose? | Turn order, enemy health, conditions, rounds. **Loses Conditions most** | The encounter tracker (S10) is built around Conditions: each with its duration, ticked at Reset, and its rule a tap away (139) |
| What do you look up most? | **Conditions and enemy stats** | The same two. The Codex rolodex and the Conditions reference are the GM screen's first two panels |
| How do you keep an improvised NPC? | A tracker at the end of the session | Quick-add mid-session (a name and a line), and closing a session asks "anyone new?" |
| What do you hand out? How is it recorded? | IP and **a Milestone Point**; sometimes Çredits and gear when it's plot. Players track their own, **but there should be a log of what each person got** | GQ8 answered: one Milestone Point a session, which the sheet already gives from its session log. **The award log** is the GM's record, per session and per character (§4g). It doesn't need the dispatch to exist (GQ20) |
| What do you write after a session? | What happened, threads resolved, threads started, threads still open | The Campaign Journal's six parts stay, but its threads are records, so "still open" is computed rather than copied forward |
| What do you track across the campaign? What do you forget? | **Who the crew has dealt with, what was shared, who was killed or wronged.** Forgets what info went to whom, and **what the current quest is** | **Interactions** become a record (§4e): who, which session, what kind (shared, learned, helped, wronged, killed, owes), and what. The current quest is the thread marked **current** |
| One tool tomorrow? | **A roster of enemies to quickly reference** | Confirms the reorder |

**The 50,000-foot reading.** The plan as first written was ordered by
engineering risk: storage, the dispatch and the read-only sheet first,
because everything else sits on them. Scott's answers say the value is
almost all at the other end: **NPCs, enemies, Conditions in a fight, and a
memory of the campaign.** None of that needs a seated character, a dispatch
or a read-only sheet. So the order flips (§6): the table file first, then the
cast and the Codex, then the fight, then sessions and threads, and the
character-facing machinery last. The risky shapes still get settled; they
just stop gating the part Scott asked for.

**What he didn't ask for** is worth saying too: nothing about getting the
players' sheets in, or sending them changes. At an in-person table the
players are across the table with their phones, and he says the award out
loud. The dispatch is still the right shape if a table goes remote (§8), but
it is no longer early work (GQ20).

## 2. What the books already decide

| The GM needs | The book's answer | Where |
|---|---|---|
| An NPC model | **One record.** "An enemy is an NPC who decided a line was crossed." Every NPC has an **NPC Role** (who they are), an optional **Enemy Role** (how they fight), an **Origin** (what formed them), and a goal, a resource and a **Line** | `223`; Codex front matter |
| How much to stat an NPC | **Partial** (stats, a few skills) for the disposable; **full** for anyone who persists or adapts; a partial block is finished between sessions if the NPC turns out to matter | `223` *When to Fully Stat an NPC* |
| The stat block | Ten stats (TOL and WILL derived, as floors), Health as HP and Health Levels, armor from Gear, skills as **totals**, gear, traits, GM note, If Pushed | Codex *How to Read an Entry* |
| Threat weight | Tiers T1–T4, each with stat ranges and a trait budget; Apex is never pre-built | Codex *Tier Reference* |
| Origins | Seven mortal origins, each a stat modifier set applied **at construction** | Codex *Origin Reference*; v2 unchanged |
| NPC Roles | **Nine** in v2: Civilian, Contact, Operator, Specialist, Authority, Power Broker, Wild Card, **Patron** (no longer "in review") and Nemesis | Codex v2 *NPC Roles* |
| Enemy Roles and tier | Eight roles, and v2's table **gives each role a tier**: Grunt T1; Sneak, Brute, Artillery T2; Controller, Enforcer, Elite T3; Apex T4. An entry still prints both (GQ16) | Codex v2 *Enemy Roles*, *Tiers* |
| NPC armor | Roll PROT + RES ("1d4+2") **or use the average, 5** (GQ18) | Codex v2 *Reading the Enemy Matrix* |
| Pre-built threats | 42 entries, 29 encounter groups, two drones, ~100 named traits in three kinds (Universal, Origin, Signature) | Codex Parts B–C |
| Named NPCs | Eleven roster NPCs (Bob and NPC-01 to 10), **moved into the Codex** in v2, in *Motivation · Resources · Their Line · stats · skills · If Pushed* form, each with a **Push Profile**: the Codex entry or encounter group they become when pushed, or none | Codex v2 *NPC Roster* (was `200` Part VI) |
| Supernatural threats | **In the Codex draft now**, modifiers still headed "proposed" (GQ17): seven Orders (Undead, Vampiric, Therianthropic, Fae, Spirit, Elemental, Beast) beside Origin; **Bound** (Origin modifiers, one Order trait instead of Order's), **Changed** (both), **Other** (Order only); a +1 both give becomes +1 and an Order trait; −1s cap at −1, a −2 is reviewed by hand; a bodiless Changed takes only Origin's mental and social modifiers | Codex v2 *Origins and Orders* |
| Environmental threats | **Proposed, not approved:** three new fields, named lieutenants, Site Profiles with tracks and clocks | Expansion proposal |
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
- **The v2 roster breaks the floor both ways** (checked 2026-10-02, the
  engine's TOL = 1 + INT/BOD/COOL and WILL = 1 + BOD/INT/EMP over its eleven
  blocks): TOL is **below** its formula on seven (Chen, the Archivist, Kira,
  Threadbare, the Warden, Juno, the Patron), by up to four; WILL is below on
  one (Marta) and above on four. So "a stored value with a derived floor"
  holds for the 42 entries and fails for the roster (GQ6).
- **Bob has his own block and also says "use Entry 05 for Bob's stats"** when
  pushed (GQ15). The other ten keep their block and push into an entry or a
  group, which the cast record's `ifPushed.links` already models.
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
  origin?, order?,                   // origin absent for "Various" (the Patron); order once GQ17 settles
  npcRoles: [ ],                     // "Civilian / Wild Card" is two; nine in v2
  enemyRole?, tier?,                 // absent until they'd fight
  motivation, resources, line,       // "every NPC has a goal, a resource, and a line"
  rules?, resolution?, vulnerabilities?,   // the Expansion's fields; text
  block?: StatBlock,                 // absent, partial or full
  ifPushed: { text, links: [ ] },    // to a Codex entry, an EG, another cast member
  codexEntry?,                       // "built from Entry 05"
  places: [link], factions: [link],  // where they turn up, who they answer to
  status: "alive" | "dead" | "missing" | "gone",
  firstMet?: sessionId, gmNote, history: [ { session, text } ]   // not built in S8b (SQ1): the interactions are a member's history until S5 or S10 writes this
}

Interaction: {                       // Scott: "what info was shared with who"
  id, session, cast: [link],         // who the crew dealt with
  crew: [seat or name],              // which characters were there
  kind: "shared" | "learned" | "helped" | "wronged" | "killed" | "owes" | "owed",
  text, threads: [link]
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
  rule) and the stat bonuses. **TOL and WILL are stored as authored.** The
  first draft said the engine warns under a floor; the v2 roster is under
  TOL's formula on seven of eleven, so a warning would fire on Scott's own
  NPCs. The engine shows the formula's value beside the stored one and says
  nothing more until GQ6 is answered.
- **Interactions are the campaign's memory** (§1a). They're written from the
  session (quick, mid-play or at close), and read from either end: a cast
  member's card lists everything the crew told them, learned from them, owes
  them or did to them; the crew's view lists who knows what. "Killed" sets
  the cast member's status. **Affiliation** is `factions`, and the Cast tab
  filters by it, by origin and by role ("a roster with affiliations").
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
present; a typed name before seats exist), **hours**, the **Campaign
Journal**'s six parts, each a text field with links where the worksheet asks
"who": what happened, consequences and fallout, new threads, faction and city
impact, the close reflection, and the seed for next session; its
interactions; and **the award log**: what each character got (IP, the
Milestone Point, Çredits, gear, CRANK rep), each line with a reason. The
award log is the GM's record whether or not a dispatch carries it (GQ20).

**Threads** are their own record, because Scott's whole prep is threads:

```
Thread: { id, title, status: "open" | "resolved" | "dropped", current?: true,
          opened: sessionId, closed?: sessionId, links: [link], notes }
```

One open thread can be **current** ("what the current quest is"). A
journal's "new threads" creates them; closing a session asks which open ones
moved, resolved or dropped. **Next session**, the table's landing page, is
then computed, never typed: the current thread, every other open thread
oldest first, last session's seed, clocks one or two segments from full, and
anyone met last session who has no stat block yet.

**Closing a session** is one sheet the GM reads before anything is sent:

1. Attendance and hours → **IP**: 5 an hour to each character present
   (`226`), editable before it goes.
2. Each absent character → an optional **off-screen CRANK job**: Çredits
   rolled in the lower half of their tier's payout range (`242`).
3. **The Milestone Point:** one to each character present. The sheet already
   gives one per session in its log (`milestonePointsPerSession`), so this
   is a line in the award log, not a new rule (GQ8, answered).
4. The micro-arc counter: the 5th and 10th sessions remind the GM a Minor or
   Major Milestone cycle has turned (`240`).
5. Threads: which moved, which resolved, which dropped, which is current.
6. **Anyone new?** Improvised NPCs quick-added during play get their line
   (goal, resource, Line) or stay a name.
7. The award log is written. **A dispatch per character** is offered once
   S2 exists, never required. Nothing is sent without the GM seeing it.

The **Session 0 Shared Overlap** worksheet (shared location, contact,
dependency, recent event) is the table's first note, and its answers can
become a place, a cast member and a clock in one press each.

### 4h. Encounters

The **Encounter Design worksheet** (basics, NPCs, environment and hazards,
objectives beyond "defeat the enemy", escalation, finding an out, hooks, GM
prompts, when momentum stalls) is the encounter's prep half. The running
half:

- **Participants:** player characters, cast members, Codex entries ×n (each
  copy its own damage track), and encounter groups unpacked into their parts.
  A PC is a seat once seats exist (S3b) and **a typed name before then**, so
  the tracker doesn't wait on the character-facing half.
- **A PC's row shows Health, Awareness and Conditions** (Scott's three).
  Awareness comes from the snapshot and doesn't move in a fight. Health and
  Conditions do, so the row keeps **the GM's own scratch copy**, seeded from
  the snapshot when there is one and changed as players call out hits. It is
  never written back to anyone's sheet. This reverses the first draft's "never
  a second copy of their HP": at an in-person table the GM is tracking it
  anyway, on paper (GQ19).
- **Conditions are the centre of the tracker**, because they are what Scott
  loses. Each Condition on a row carries its source, its duration in rounds
  or "until saved", and its rule a tap away (the tip, 139). **Reset** lists
  every Condition that ticks, ends or asks for a save that round, row by row,
  before the next round starts. Nothing ends silently.
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
- **Damage to a player character** is the player's to apply on their own
  sheet; the GM's row is the scratch copy above. Once S2 exists, a hit can
  also be queued as a dispatch line, which is the record for a remote table.
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

**Each session is built from a work order** in [`gm-mode/`](gm-mode/README.md),
written one session ahead, approved by Ken, built in a fresh session and
reviewed against the order before it merges. The README has the cadence and
the template. **S1's order is approved:** [`gm-mode/S01-crank-rep.md`](gm-mode/S01-crank-rep.md).

Each session is one batch, ends with `npm run verify` green and a log entry,
and leaves the app openable. Each says what it depends on, what decides it,
and what's done.

**The order changed on 2026-10-02** (§1a). The first draft answered the
riskiest shapes first (storage, the dispatch, the read-only sheet). Scott's
answers put the value in NPCs, enemies, Conditions and the campaign's
memory, none of which needs a seated character. So S3 splits: **S3a** is the
table file and its storage, which everything needs; **S3b** is seats, the
card spread and the read-only sheet, which only the character-facing half
needs. The S-numbers stay as ids, since the log and §9 cite them; the table
below is in **build order**.

The Codex never ships in the app (GQ10): S9 builds the pack a GM slots in,
and the Codex pack itself is built from `private/`.

| # | Session | Tier | Depends on | Visible to a player? |
|---|---|---|---|---|
| S0 | This plan, the mirror, the questions page | Docs | — | No |
| S1 | CRANK reputation on the sheet (independent; can go to main any time, GQ14) | Rule or shape | — | **Yes** |
| S3a | The table file: new, open, export, import, the storage key, `migrateTable()` | Rule or shape | — | No |
| S8 | The cast: the record, partial blocks, interactions, affiliation filters, the roster | Rule or shape | S3a | No |
| S9 | The Threat Codex as a pack: the pack shape and import, rolodex and builder | Content + shape | S8 | No |
| S10 | The encounter tracker, built around Conditions; PCs by typed name | Rule or shape | S8, S9 | No |
| S5 | Sessions: attendance, threads, Next session, the award log, close-out, the Journal, Session 0 | Rule or shape | S8 | No |
| S13 | The GM screen: Conditions and the Codex first, then the rest of the reference | Fix + content | S9 | No |
| S6 | The gazetteer and the crew's places | Content + shape | S3a | No |
| S7 | Factions and clocks | Rule or shape | S6, S8 | No |
| S3b | Seats: players, import, the card spread (Health, Awareness, Conditions first), the read-only sheet | Rule or shape | S3a | No |
| S2 | The dispatch and the inbox | Rule or shape | S1 | Yes, once a GM sends one |
| S4 | GM writes: the dispatch composer and reconciliation | Rule or shape | S2, S3b, S5 | No |
| S11 | CRANK work: the generator and the jobs board | Content + shape | S1, S5 | No |
| S12 | Supernatural Orders and Site Profiles | Content | GQ17 and the Expansion approved; S9, S7 | No |

**The first point a GM gets real value** is after S10: a table holding a
cast, the Codex to pull from, and a fight that keeps its Conditions. That is
the natural place to merge the branch (§7) and put it in Scott's hands, and
his use of it should reorder whatever comes after.

### S0 — This plan (Docs)

The CRB mirror gains `100`–`130`, `200`–`253`, the Codex and the proposal,
all in the private `private/crb/` (Decision 167, GQ12). This plan, its questions, W29 pointing here, and a
page for Scott and Deighton that leads with §9.
**Done when:** Ken approves the shape, and Scott and Deighton have answered
or defaulted every *They* question in §9.

### S1 — CRANK reputation on the sheet

**Built 2026-10-05** (Decision 169, app 0.37.0; PR open). The bullets below are the plan as written; the work order and the decision are what was built. GQ11 and GQ14 answered as built; GQ7 stays open.

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

### S3a — The table file

**Built 2026-10-05** (Decisions 170–173, table schema 0.1, switched off; PR #113). The bullets below are the plan as written; the work order and the decisions are what was built.

Settles storage and the file, which everything after it needs.

- **Run a table** on Home; new, open, export, import, remove, with the
  roster's unexported marker.
- **Decisions:** the table file and `migrateTable()`; the storage key; the
  table-schema version (and `CLAUDE.md`'s versions table). **Tests:** hostile
  table files.

### S3b — Seats and the card spread

The character-facing half, and the plan's main engineering cost (the
read-only sheet). Moved late on 2026-10-02 because nothing Scott asked for
waits on it.

- Players and seats; import a character onto a seat (drop several files at
  once); a newer copy of the same TAG updates the seat; an older one asks.
- **The card spread:** one card per active seat, grouped by player. **Health,
  Awareness and Conditions first** (Scott's three), then name,
  archetype, TAG, Pain, SAN, Luck, Çredits, IP
  unspent, CRANK tier, and **how old the copy is** ("as of Tuesday's
  export"). Benched, retired and dead seats fold below.
- **The read-only sheet:** the real renderer with a `readOnly` flag: every
  control rendered inert, no `commit()` path reachable. This is the main
  engineering cost of the plan, and S3 measures it before committing to it
  (GQ13).
- **Measure storage:** build a realistic table (six characters, long audits)
  and record its size in the log.
- **Decisions:** seats outside the roster. **Tests:** a character imported
  twice; the read-only sheet has no reachable write. A typed-name PC from S5
  or S10 can be **claimed** by a seat, so its history carries over.

### S4 — GM writes

- A note on a seat: private (stays in the table) or to the player (a dispatch).
- The dispatch composer: one character or the whole table; the item kinds
  from S2; a preview of what the player will see; **Export dispatches**.
- **Reconciliation** on re-import: each sent item applied, declined or
  pending, shown on the card and in the session it came from.

### S5 — Sessions

- The session list; attendance by typed name (by seat once S3b exists); hours.
- **Threads** and **Next session**, the table's landing page (§4g): Scott's
  "to-do list from last session", computed.
- **Interactions** written from the session, mid-play or at close.
- **Close the session** (§4g): IP at 5 an hour to those present, the
  Milestone Point, the absent's off-screen job, the arc counter, threads,
  anyone new, and **the award log**.
- The **Campaign Journal** per session; the **Session 0 Shared Overlap**
  worksheet as the table's first note.
- **Decisions:** the close-out rule as built (present only, 5 an hour as a
  default the GM edits, one Milestone Point a session); threads as records.

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

### S8 — The cast (split: S8a and S8b built)

**S8a (built, Decisions 174–176, switched off):**

- The cast record and the stat block (§4e), partial or full, and
  **quick-add**: a name and a line, mid-session, one press.
- The engine's NPC reader: `Engine.npc(block)` → Health Levels, HP, bonuses,
  TOL and WILL beside their formulas. Total, like every reader.
- **The NPC roster**, now in the Codex (Bob, Splice, Chen, the Archivist,
  Kira, Marta, Threadbare, the Warden, Juno, Marcus, the Patron) as
  **examples to copy**, not as cast: a GM's cast starts empty. Confidential
  like the rest of the Codex, so it ships in S9's Codex pack; S8 tests
  against a synthetic roster.
- Status (alive, dead, missing, out of the picture).
- **Decisions:** the cast record; the stat block; *NPC TOL and WILL are
  stored as authored* (a deliberate exception to constraint 7's letter,
  because the Codex authors them), with whatever GQ6 says about the formula.

**S8b (built, Decisions 177–179, switched off; [order](gm-mode/S08b-interactions.md)):** **interactions**
(§4e) on a member's page, dated until S5's sessions; the crew's view (*Who
knows what*); and affiliations as text until S7 makes them links, with one
Affiliation filter (origin and role stay in the search). **History** moves
to a later session: S5 or S10, whichever first writes it (Ken, 2026-10-05).

**Moved to S10:** **Keep** and **Promote** (a fought copy into the cast),
with the fight they come from.

### S9 — The Threat Codex as a pack (split: S9a next, then S9b and S9c)

**Split 2026-10-05 (Ken, SQ1 of the [S9a order](gm-mode/S09a-pack.md)):**
**S9a** is the pack file, its gate, storage and import, and a **Threats** tab
whose **Use** copies an entry into the cast; **S9b** is the builder and
matching the cast's text to the pack; **S9c** is the real Codex pack, built
in `private/`. The rolodex is a tab, not an `openCatalog` kind: that picker
is the character's, in `sheet.js`.

GQ10 is answered: the Codex isn't in the app's data. It's a **pack**, built
from `private/` and slotted in by the GM (W62 is how it should feel). S9
builds the pack shape, its gate, its storage key and the import, tests them
against a synthetic pack, and builds the real Codex pack in `private/`.


- **Data:** origins (seven), NPC roles (nine, Patron included: GQ4
  answered by v2), enemy roles (eight, each with v2's tier), tiers (four), entries (42), encounter groups (29),
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

- The Encounter Design worksheet; participants (PCs by typed name until
  S3b); Order of Engagement; rounds and Reset; NPC damage through the
  engine's pipeline; **Conditions with durations on every row, PCs
  included, and Reset's list of what ticks or ends** (§4h); traits as
  reminders; the GM's scratch Health for PCs; ending it.
- **Built for a tablet at the table** (§1a): every control a tap, the active
  row and the round always on screen.
- Encounter groups unpack into their entries.
- **Decision:** the NPC adapter onto the damage pipeline, and what it
  doesn't model (traits).

### S11 — CRANK work

- The generator's five columns as data; roll or pick; a job record; the
  jobs board; closing a job proposes Çredits and rep by dispatch.

### S12 — Supernatural Orders and Site Profiles

**Waits on GQ17 and the Expansion being approved.** v2 has put the Orders in
the Codex itself, which suggests they're close. The shape is already there
(`order`, `rules`, `resolution`, `vulnerabilities`, `overrides`, clocks), so
this should be content: the seven Orders and their modifiers, the
Bound/Changed/Other rule in the builder (its overlap and cap rules are
arithmetic the builder can do, and a −2 it flags for the GM, as v2 says), the ~28 entries, the lieutenants as
roster examples, the Site Profiles on places with their tracks and clocks. If
it turns out to need code, that's a finding about S8 and S9's shape.

### S13 — The GM screen

The reference tips (139) gathered on one screen, **Conditions and the
Codex first** (what Scott looks up most), then defenses, default TN and TH,
Pain Levels, the tier table. Handouts (a dispatch kind).
Printing a cast member, an encounter, a session's journal.

## 7. How the branch works

**Replaced by Decision 173 (2026-10-05).** There is no long branch: each session
merges to `main` like any batch, behind `FEATURES.gm` (off), and releases go
on as usual. What follows is the plan as first written, kept for its reasons.

Ken asked for one branch for the whole feature. That works, with two rules:

- **Sync `main` in at the start of every session.** Main keeps moving (the
  0.36 release, W59, the CRB catch-up), and this branch touches `shared.js`,
  `sheet.js` and `app.js` everywhere. A month of drift is a week of conflicts.
- **The branch passes `npm run verify` at the end of every session**, like
  main has to, so any session can start from it.

**One exception worth taking:** S1 (CRANK rep) is a complete player feature
with no GM dependency. It could go to main and ship on its own, which also
tests the schema bump on real players before the table depends on it (GQ14).

**Merging early.** The Home door appears in S3a, and the app has no feature
switch to hide a half-built mode (and the app doesn't narrate its build
state, constraint 9). So the branch merges at a point where what's there is
finished. **The default is now after S10** (cast, Codex, the fight), since
that's what Scott asked for, and his use of it is the best guide to the
rest. The Codex reaches him as a pack either way.

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
| GQ1 | Which tabs, in what order? Is anything in §4b missing or not worth it? | They | **Scott, 2026-10-02:** the cast, the Codex and the fight matter most, and threads and interactions are missing (§1a; both added). Order still open; default §4b with **Next session** as the landing page. Deighton to come |
| GQ2 | Do you run in person, online or both, and do players have devices at the table? Is files between sessions enough, or is a live view the point? | They | **Scott, 2026-10-02:** in person; players on phones and tablets; GM on paper with electronic references. Files are enough to start; live sync is a later plan. Deighton to come |
| GQ3 | One dispatch file per character, or one per table that each player's sheet reads its own part of? | Ken | One per table: one file to drop in a chat channel |
| GQ4 | Is **Patron** an NPC Role? The Codex says "in review"; the Workshop's roster uses it | Scott | **Answered by Codex v2:** yes. Nine roles, Nemesis included |
| GQ5 | Is the Origin Matrix's 7 × 8 concept grid canon, and with which origins? (The page has Elite and the old modifiers; the Codex has Agency) | Scott | Not in the app until it's in the Codex |
| GQ6 | Entries 08 and 10 have TOL above the formula, and **the v2 roster has TOL below it on seven of eleven** (Chen, the Archivist, Kira, Threadbare, the Warden, Juno, the Patron) and WILL below on one (Marta). Is an NPC's TOL and WILL the formula, a floor, or simply authored? | Scott | Authored: stored as printed, with the formula's value shown beside it and no warning |
| GQ7 | CRANK reputation and the **Reputation** Advantage share a word. Should either say how they differ? | Deighton | **Ken, 2026-10-02: open, and bigger than wording.** The team wants to discuss the Reputation Advantage setting a character's starting CRANK rep, or something like it. Until then S1 keeps CRANK's copy clean: no mention of the Advantage |
| GQ8 | Milestone cycles (5 and 10 sessions): does the GM award them, or does the sheet already handle it? | Deighton | **Scott, 2026-10-02:** he awards a Milestone Point each session, which the sheet already gives from its session log. The award log records it; the 5- and 10-session cycles stay a reminder. Deighton to confirm |
| GQ9 | If a table outgrows browser storage, is "the table file is the save" acceptable, or does it need to fit? | Ken | Acceptable, with the unexported marker |
| GQ10 | Does the GM's content (the Codex, the gazetteer) ship in the one file every player gets, or in a separate GM build? | Ken | **Answered 2026-10-02 (Ken): one app, and the Codex is a pack the GM slots in.** The GM mode's code ships to everyone, empty; the Codex, the roster and CRANK's tables are a `.shadows-pack.json` built from `private/` and handed to a GM, imported once, checked like any untrusted file (124). Core player content stays free in the sheet, Vampire and Werewolf included. The repo stays public, as a matter of trust. How expansions hook in, and what stays private when they do, waits for the first expansion. Replaces the two-build proposal: two builds meant two version histories and a GM file to re-hand on every release. Needs a numbered decision when S9 builds it |
| GQ11 | CRANK rep on the printed sheet, when the front page is full (Decision 96)? | Ken | **Ken, 2026-10-02: the front page.** Its third field row has two of four places free |
| GQ12 | **This repo is public.** Where do the CRB mirror and the Codex live? | Ken | **Answered 2026-10-02:** a private repo, mounted at `private/` (Decision 167). Whether the Codex ships is GQ10 |
| GQ13 | If the read-only sheet turns out expensive, is a summary card plus the printed sheet enough for a GM to read a character? | Ken | Build the real read-only sheet |
| GQ14 | Ship S1 (CRANK rep) to main on its own, or keep it on the branch? | Ken | **Built 2026-10-05:** shipped on its own (PR #111) |
| GQ15 | Bob has his own stat block and also says to use Entry 05's when he's pushed. When a roster NPC turns hostile, do they fight with their own block or their Push Profile's entry? | Scott | The Push Profile's entry; their own block is for social scenes. The cast record keeps both |
| GQ16 | v2's Enemy Roles table gives each role a tier (Brute is T2), and an entry prints both. Can an entry's tier differ from its role's, a T3 Brute? | Scott | Yes: tier is stored, and the builder notes when it differs from the role's usual |
| GQ17 | The Orders are in the Codex now, under a "proposed modifier" heading. Are they approved? | Scott | Not yet: the builder offers Origin only until the heading drops "proposed" |
| GQ18 | NPC armor is "PROT + RES (1d4+2), or the average (5)". 1d4+2 averages 4.5; is the 5 rounded up on purpose? And is this the players' armor rule simplified for the GM, or its own NPC rule? It touches the RES question in F23 and F25 | Deighton | The tracker offers both, roll or 5, exactly as printed |
| GQ19 | Scott needs Health, Awareness and Conditions on the PCs mid-session, but the GM's copy is a snapshot from the last export. Is the GM keeping a scratch copy as players call out hits enough, or is this where live sync earns its place? | They | A scratch copy in the encounter tracker, never written back; live sync stays §8 |
| GQ20 | At an in-person table where the GM says the award aloud, is the award log enough, or do players want a dispatch to import? | They | The award log first (S5); the dispatch (S2, S4) after Scott has used the table, and only if hand entry drifts |
