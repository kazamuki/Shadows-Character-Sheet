# Work order S6 — The gazetteer, and the crew's places

**Plan:** [`../gm-mode.md`](../gm-mode.md) §4b (the City tab), §4f (the city),
§6 *S6*; §1a (Deighton: the setting as "a reference to improvise from", read
and searched); GQ10 (one app). Decisions 68, 135, 170, 177, 178, 203, 207,
208, 212, 241.
**Status:** **drafted 2026-10-23 by Claude (Opus)**, the S16 reviewer, after
#234 (S16, Decision 241) merged (`WORK-ORDERS.md`, step 7). **Ken chose this
session (2026-10-23).** SQ1–SQ10 are open.
**Branch:** from `main` at `363f23d` or later, PR to `main`, switched off
(Decision 173).
**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md):
a conductor (Opus) starts **S6 build** (Sonnet), then a fresh **S6 review**
(Opus) once the PR is open. Builder and reviewer message each other directly;
anything for Ken goes to the conductor. §15 is the hand-over.
**Runs alone.** It touches `shadows-data.js` (a new `gazetteer` section),
`engine.js` (the gazetteer's readers, a new record, the interaction's gate and
sentence, `linkName`, `tableSearch`, the activity log's record list),
`gm.js` (a seventh tab, a place's page, the add row and an open line), the
CSS, the ledger and STATE.
**Table schema N** (0.14 if it's still free when you build: `main` is 0.13 at
`363f23d`). Two decisions, **N** and **N+1** below.

**Carried over from S16's review** (#234, two fix rounds). Each is marked as
the order's, the build's or the conductor's:

- **The order's: every worked story must be one the code allows.** S16's §1
  renamed an ended encounter and §10 removed a planned encounter that a line
  named. Neither can happen: an ended encounter is read-only (188), and only
  End writes a link. Here §1's story was checked step by step against what the
  order builds (§9's *Where things land*): a place can be renamed and removed
  at any time, and a line can name any place on the table.
- **The order's: draft every word in the role it plays.** §8 of S16 had
  *them* as an object (*Scott helped them*), and the build put it in subject
  position too (*them owes Scott*). Ken ruled *Unnamed* for a subject
  (PR #234, issuecomment-6373121360). §9's sentence table gives the place's
  word in each kind's position, and the no-kind line's comma.
- **The order's: a list whose interaction changes moves the tests that read
  every row.** S16's eight row tests needed more than an Edit press. This
  order adds a field to the add row and to an open line. §11 lists the tests
  that read those rows' fields in order (the 241 order tests) as expected
  breaks.
- **The build's: Back focused the first copy of a link, not the one tapped.**
  On Who knows what a line shows once per crew name. A place in a sentence is
  a second link of that kind, so its key carries the same `where` as the
  fight's (`sentenceHtml`'s `o.where`).
- **The build's: tests stopped reading the page.** S16's row tests moved to
  `S.table` and passed whatever the page drew. Every smoke test here reads
  what is drawn.
- **The conductor's: an answer recorded mid-review was missed.** Ken's
  *Unnamed* landed while the builder was mid-turn, and the next commit
  didn't carry it. The reviewer's *Ready* didn't check the PR against Ken's
  recorded answers either. §14's review checklist now asks for it.

**Pre-flight** (`docs/WORK-ORDERS.md`, *The pre-flight*) against `main` at
**`363f23d`**, 2026-10-23. Every function below was opened and read. The line
numbers are `363f23d`'s.

- **No gazetteer anywhere.** `grep -n "gazetteer\|places" src/` finds nothing
  but comments. The plan's `PlaceRecord` (§4c) and `places` were never built.
- **A table today** (`newTable`, `engine.js:5762`) is `meta, notes, cast,
  interactions, encounters, sessions, threads, audit`. **Probe:** a table
  with `places: [{ id:"PL-AAAAAAAA", name:"The Rookery" }]` keeps it through
  `migrateTable` as an unknown key, untouched. `diffTable` returns `[]` when
  a place is pushed, so **undo can't see a place** until `TABLE_RECORDS`
  (`:5900`) names it. `tableSearch(t, "Rookery")` returns `[]`. A line's
  crafted `place: { kind:"place", id }` also rides along ungated today
  (unknown keys are kept, `_interaction`, `:5747`).
- **The activity log** (212) knows a record only by `TABLE_RECORDS`:
  `_tableCore` and `diffTable` (`:5901–5909`), the label's words
  (`_recName`, `_recLabel`, `:5911`), `tableActionLabel`'s walk (`:5947`),
  and `_tableAuditGate`'s path check (`:6041`), which refuses an op on any
  other path. **Every one of those is a reader of the new record.**
- **Links** (178): `linkName` (`:6217`) reads `kind:"encounter"` (241) and
  otherwise a cast link. `removeCastMember` (`:6168`) and `removeEncounter`
  (`:7308`) write the name into every link to what they remove.
- **A line** (`_interaction`, `:5747`): `session`, `kind`, `cast`,
  `encounter` (241), `crew`, `text`, `date`. `addInteraction` (`:6237`)
  links only an encounter on the table. `editInteraction` (`:6257`) edits
  session, kind, crew, text and date. `interactionSentence` (`:6293`) builds
  the parts; `crewView` (`:6338`) and `_interactionFields` (`:6548`) search
  them.
- **Find** (`tableSearch`, `:6566`) walks cast, sessions, interactions,
  threads, notes and encounters, in that order. `openFound` (`gm.js:439`)
  opens each kind.
- **The tabs** (`TABLE_SECTIONS`, `gm.js:258`): Sessions, Cast, Threats,
  Encounters, Reference, Notes. `renderTable` (`gm.js:310`) picks the body
  and its binder by `S.tsection`. The tab bar's reset of a section's state is
  `gm.js:275`. **Four smoke tests pin the six labels**:
  `smoke-table-cast:73`, `:288`, `:1086` and `smoke-table-play:591`.
- **A data section the GM reads** already lives in the players' file:
  `gmReference` (207), with `bookSource` on each panel, its own comment saying
  that a GM-only section moves no game-data version (68). GQ10's *one app* is
  how it was built. A second data file would change constraint 4's script
  order, so it's a decision either way (plan §6 S6).
- **The data guards:** `engine.test.mjs:365` (135) fails on a data key that no
  code reads and that isn't named as text (`TEXT_KEY` takes `…Source`, so
  `bookSource` passes). `engine.test.mjs:199` checks the ids the data points
  at. The new section needs its own check that its `territory` and `zone`
  point at real entries (§11).
- **The source,** read from `private/crb/` (pulled 2026-10-07 for `1100`,
  2026-10-22 for `1200`):
  - `1100_Places.md`: **6 Territories**, each with *Notable Zones* (**34**),
    *Supernatural Sites* (**17**), *Business Interests* (**42**) and
    *Factions* (**23**), and *Beyond NYTE City*'s **11** places. A zone's
    bold name carries its real-world place in parentheses (*Metro Core (NYC
    Metro)*), and a Territory's is in the list at the top (*North Quarter —
    Maine, New Hampshire, Connecticut*). A site's, business's or faction's
    parentheses name its zone: **79 of 82 do**, each in its own Territory (checked by script against the six lists of zones).
  - **The three that don't:** *Wormwood Swamp (Okefenokee Swamp, southeast of
    Atlantix)*, *Birmingham Blight (Birmingham, AL)* (Gulf Coast's line is
    *Mobile, AL and Birmingham, AL*) and *Elysium Fields (Florida
    Everglades)*. SQ4.
  - **Qualifiers in the parentheses:** *Orion Arms (Riverlands, HQ in the
    Daedalus Belt's Neo Jersey Zone)*, *Continuum Health (Metro Core;
    city-wide reach)*, *Reclaim Solutions (Delmarva; city-wide reach)*, *The
    Southern Syndicate (Lowcountry; territory-wide)*. The zone is the first
    name; the rest belongs in the summary, never in `zone`.
  - **Two names carry an acronym:** *Aegis Defense Solutions (ADS)* and
    *Bushido Defenceworks (BDF)*. The name keeps it, as the book prints it.
  - `1200_Powers.md`: **16** powers. *Corporations* (5), *The Unseen Court*
    and its four houses (Vampire, Werewolf, Deadmen, Fae), and *Other Guys*
    (6).
  - `1300_Threats.md` *Environmental Threats*: the **five kinds of ground**
    (Combat Zones, Genius Loci, Convergences, Thin Places, Gates). The plan's
    "five environmental kinds".
  - **Two defects in the mirror, for Ken** (not this order's to fix): an
    empty `### ` heading at `1100_Places.md:221`, and Greenwall's opening
    paragraph ends in a stray fragment (*"… exert their influence. — old,
    disturbed, and not particularly interested …"*, `:225`).
- **The ledger,** searched by name: *place*, *places*, *gazetteer*, *City*,
  *Territory*, *Zone*, *TABLE_SECTIONS*, *tab*, *link*, *linkName*,
  *sentence*, *interactionSentence*, *tableSearch*, *Find*,
  *TABLE_RECORDS*, *gmReference*, *data file*, *script order*. Hits:
  - **68** (when `gamedataVersion` bumps): **cited.** No character can
    observe the gazetteer, so it bumps nothing, as `gmReference` didn't.
  - **135** (every data key read): **cited**; §11's guard.
  - **176, 182, 204, 207** (each *`TABLE_SECTIONS` gains* a tab): **cited.**
    The City tab is one more. None of them fixes the count, and 207's
    *after Encounters* stays true.
  - **178** (links): **superseded in part.** A third link kind, `place`;
    `removePlace` follows the delete rule.
  - **179**'s **Rejected** (*a Crew tab: the same records, so a view of the
    Cast tab, not a third place to look*): **cited.** The City tab holds new
    records, not a view of old ones.
  - **203** (a line keeps its own date; the gate guesses nothing): **cited.**
    A place's *visited when* is read from its lines' days, never stored.
  - **207** (the Reference tab; `gmReference` in the players' file):
    **cited** as the precedent for SQ1's default.
  - **208** (Find over the table): **superseded in part.** Find searches the
    crew's places.
  - **212** (the activity log's records): **superseded in part.** Its
    records are seven: `places` joins `TABLE_RECORDS`.
  - **241** (the sentence; a line's `encounter`): **superseded in part.** A
    line may name a place, and its sentence says where.
  - **Since 241:** none.
- **Numbers:** the decisions take **the next free numbers** when they're
  built (`CLAUDE.md`, *Decisions*), written **N** and **N+1** here. The ledger
  ends at **241** on `363f23d`. The table schema is **0.13**, so this order's
  step is 0.14 if still free. Check both again at build time.

---

## 1. Goal

Mid-session, Deighton's crew heads for Metro Core and he has nothing ready.
He opens **City**, switches to **The city**, and types *metro*. Metro Core's
line comes up under Central City, with its Sites, Businesses and Factions
below it, one line each. He reads Eclipse's (*the drug trade, inside the most
watched ground in the city*) and invents the rest. He taps **Add to the
crew's places** on Central Park.

On Bob's page he adds a line: Crew *Scott*, *Told them*, What *the lake is on
fire*, Where *Central Park*. It reads *Scott told Bob “the lake is on fire”
at Central Park on 10/23/2026*. Two sessions later he can't remember where
they met Bob. **Find** → *park* gives the place. Its page lists what happened
there and who was met, Bob among them. He renames it *the Ramble*, and Bob's
line says *at the Ramble*. When a place he made up turns out not to matter,
he deletes it, and a line that named it shows the name struck through.

**Done when:**

- Switched off: nothing changes anywhere.
- The data holds the gazetteer: every Territory, Zone, Site, Business,
  Faction and place Beyond in `1100`, the powers in `1200`, and the five
  kinds of ground in `1300`, each with a permanent id and one line.
- A table's **City** tab has two views: **The crew's places** (the table's
  own records: add, search, a page each) and **The city** (the gazetteer,
  read and searched, with **Add to the crew's places** on the entries that
  are places).
- A place is a record: a name, its Territory and Zone from the gazetteer,
  a typed District and Neighborhood, one kind of ground or none, notes, and
  the gazetteer entry it came from.
- A line may name a place (**Where**, on the add row and an open line), and
  its sentence says where. A place's page lists its lines and who was met
  there, both read from the lines and never stored.
- Removing a place writes its name into every line's link; the line shows it
  struck through, never as an error.
- **Find** finds a place by any of its fields, and a line by its place's
  name; Who knows what's search does too.
- Undo covers every place change.
- A crafted place or link in a file can't throw or write outside its record,
  and renders as text.
- At 390px nothing scrolls sideways; every control is 44px.
- `npm run verify` and `npm run phone-check` pass. Checked by hand at 390px,
  768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape. A saved-file shape (`places`, a line's `place`), a
  data shape (`gazetteer`), and GM-facing behaviour someone could have chosen
  otherwise (a seventh tab, the sentence's *at*). It supersedes 178, 208, 212
  and 241 in part.
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** **no bump** (68). No character can observe the gazetteer, as
  with `gmReference` (207).
- **Table schema:** **0.13 → N** (0.14), with a `migrateTable()` step:
  `places` is `[]` and every line's `place` is `null`. Nothing is guessed.
- **Character and pack schemas:** unchanged.
- **Decisions:** the next two free numbers, **N** (the gazetteer) and
  **N+1** (the crew's places).

## 3. The decisions, drafted

Paste after the last decision, under INDEX §3's **GM mode** heading, filling
**Built**. Each must stay under 350 words, Touches included (`wc -w`). Both
are worded for the defaults; a different answer to an SQ rewords them.

```
N. **The gazetteer is data in the players' file: every place, faction and power the book names, with a permanent id and one line each.**
     *2026-10-XX · Ken + Claude · Touches: gazetteer, gazetteer.entries, gazetteer.environments, territory, zone, site, business, faction, region, power, realWorld, summary, bookSource, Engine.gazetteer, gazetteerEntry, City tab, The city, GQ10, Decision 68, Decision 207*
     - **Decided:** `shadows-data.js` gains `gazetteer`: `entries` (id, kind, name, `territory` and `zone` ids, `realWorld`, a one-line `summary`, `bookSource`) for `1100`'s Territories, Zones, Supernatural Sites, Business Interests, Factions and the places Beyond, and `1200`'s powers; and `environments`, `1300`'s five kinds of ground. A zone is set only where the book names a listed one. The summaries are ours, voice-passed; the book's prose stays the book's. No character reads it, so it bumps nothing (68).
     - **Why:** Deighton wants enough of the setting to improvise from, read and searched (§1a). In the one data file it needs no change to the script order, as `gmReference` didn't (207), and S7's Faction Tracker seeds from the same ids.
     - **Rejected:**
       - A data file of its own: a change to constraint 4's script order for about 40 KB.
       - A pack built from `private/`: the book's setting is player content (GQ10), and a pack is a second thing to hand out.
       - The chapter's prose: the book's job; a GM reading at the table wants one line.
       - A zone guessed where the book names none: data that says more than the book (SQ4).
     - **Replaces:** nothing.
     - **Revisit if:** the book's setting chapters move to the Workshop (GM-only), or a player sheet wants the city.
     - **Built:** switched off (173); log 2026-10-XX.

N+1. **A table keeps the crew's places; a line can say where it happened, and a place's history is read from its lines.**
     *2026-10-XX · Ken + Claude · Touches: places, PL- id, from, territory, zone, district, neighborhood, environment, notes, addPlace, editPlace, removePlace, placeTitle, placeLines, place link, linkName, interactionSentence, Where, City tab, The crew's places, tableSearch, crewView, TABLE_RECORDS, table schema 0.14, Decision 178, Decision 208, Decision 212, Decision 241*
     - **Decided:** Table schema N adds `places` (`PL-` id, a name, the gazetteer entry it came from, Territory and Zone ids, District and Neighborhood typed, one kind of ground or none, notes) and a line's `place`, 178's link, set on the add row or an open line as **Where**. The sentence says *at* the place. A place's page lists its lines and who was met there, read every time. `TABLE_SECTIONS` gains **City**, after Cast: the crew's places, and the gazetteer. Find, Who knows what and undo cover places. Removing one writes its name into its links.
     - **Why:** "visited when, what happened, who was met there" are what the lines already record; a place stored beside them would be a second record of the same night (177's `history`, rejected).
     - **Rejected:**
       - A visit log on the place: two records of one scene.
       - A place typed into a line's text: it can't be found or followed.
       - The gazetteer on the Reference tab: rules there, the city here, and a place is a record, not a rule.
       - Places as a view of the Cast tab: new records, not a view (179).
     - **Replaces:** Decision 178 in part (a third link kind), 208 in part (Find searches places), 212 in part (a seventh record), 241 in part (a line names a place).
     - **Revisit if:** S7's factions or S12b's Site Profiles want a place's own track, or an encounter wants a place.
     - **Built:** table schema N, switched off (173); log 2026-10-XX.
```

**Supersession marks** (each ledger entry and its INDEX line):

- 178: *→ **Superseded in part by Decision N+1** — a line links its place,
  `{ kind: "place", id }`, and removing the place writes its name.*
- 208: *→ **Superseded in part by Decision N+1** — Find searches the crew's
  places.*
- 212: *→ **Superseded in part by Decision N+1** — `places` is a record the
  log covers.*
- 241: *→ **Superseded in part by Decision N+1** — a line may name a place,
  and its sentence says where.*

If the ledger search at build time finds another, stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **Where the gazetteer lives.** In `shadows-data.js`, beside `gmReference` (207), shipped to every player and unread by the sheet; in a data file of its own (a change to constraint 4's script order); or in a pack built from `private/`, handed to a GM like the Codex? | **`shadows-data.js`**: the setting is player content (GQ10) | |
| SQ2 | **Who writes the one-line summaries** (about 155)? The builder drafts each from its own paragraph in the book: one sentence, at most 20 words, saying nothing the paragraph doesn't. The PR lists every one for your voice pass before merge. Or you write them first and the build pastes them | **The builder drafts, you voice-pass in the PR** | |
| SQ3 | **What the gazetteer covers.** All of `1100` (6 Territories, 34 Zones, 17 Sites, 42 Businesses, 23 Factions, 11 places Beyond), `1200`'s 16 powers, and `1300`'s 5 kinds of ground? Or places only, with factions and powers waiting for S7? | **All of it**: S7 seeds from the same ids, and Deighton reads factions to improvise | |
| SQ4 | **Three sites name no listed zone**: *Wormwood Swamp* (Okefenokee, southeast of Atlantix), *Birmingham Blight* (Birmingham, AL, which Gulf Coast's line names) and *Elysium Fields* (the Everglades). Territory only, with the book's words in `realWorld`? Or Birmingham Blight in Gulf Coast? | **Territory only for all three**: the data guesses nothing | |
| SQ5 | **A place's history.** A line names its place (**Where**), and the place's page lists those lines and who was met, read every time? Or a place keeps its own log of visits, each with a date and a note? | **Lines name a place** | |
| SQ6 | **The tab.** Called **City** (plan §4b), after **Cast**: Sessions, Cast, City, Threats, Encounters, Reference, Notes. Or another name, or after Encounters? | **City, after Cast** | |
| SQ7 | **Which gazetteer entries a GM can add as a place:** Territories, Zones, Sites, Businesses and the places Beyond. Factions, powers and the kinds of ground can't be added; they're S7's records or a place's tag | **As written** | |
| SQ8 | **The sentence's word for a place** ✎: *at*, after the member and any fight, before the day. *Scott told Bob “…” at Central Park on 10/23/2026*; *Scott fought Bob in Dock fight at the Pier on …*; a no-kind line *Bob, with Scott, at the Pier, on …: met*. A place's name is read as typed, so *the Pier* stays lowercase mid-sentence; a name that leads a sentence never does (the member or crew always leads) | **As written** | |
| SQ9 | **Find and the gazetteer.** Find searches the crew's places, not the gazetteer (The city has its own search)? Or Find lists gazetteer entries too, after the table's records? | **The crew's places only** | |
| SQ10 | **A place's kind of ground**: one or none (the plan: "the environmental kind if it has one")? Or any number? | **One or none** | |

## 5. The assumption sweep

Every reader below was found by grep on `363f23d`. The three questions (which
guards read it; where it renders; what text points at it) are answered in the
last column.

| What changes | Today, where | After | Readers and twins |
|---|---|---|---|
| A table's records | `newTable` `engine.js:5762`; `TABLE_RECORDS` `:5900` | `places: []` in both | `_tableCore`, `diffTable`, `_recName`, `_recLabel`, `tableActionLabel`, `_tableAuditGate` (`:5901–6041`): each reads the list. `_recName` gains `places` → `placeTitle`. The Home card (`gm.js:181`) counts only notes: unchanged |
| The gate | `migrateTable` `:5776` | a 0.14 step; `_place` gates each record before interactions | `tableCheck` (newer stamp): unchanged. Hostile tests: §11 |
| A line's `place` | absent; an unknown key rides along (probe) | `null` or `{ kind:"place", id, name? }` | `_interaction` (gate), `addInteraction`, `editInteraction`, `interactionSentence`, `crewView`, `_interactionFields`. `engine.test.mjs:3730` drops a `{ kind:"place" }` link **inside `cast`**: still true (a place link lives in `place`, never `cast`) |
| `linkName` | `:6217`: encounter, else cast | learns `kind:"place"`: live → `placeTitle`, else the kept name, else ✎ *A place removed* | Every caller passes a link; none passes a place today |
| The sentence | `interactionSentence` `:6293`; `sentenceHtml` `gm.js:596` | a `place` part | Who knows what (`crewViewHtml` `gm.js:614`), a session's page (`sessionInteractionHtml` `:1154`), a member's page (`interactionRowHtml` `:680`), the wrap-up's preview (`encWrapSentence`): **twins**. The wrap-up passes no place, so it reads as today |
| The add row and an open line | `castInteractionsHtml` `gm.js:697`; `interactionRowHtml` `:680`; `bindInteractions` `:900`; `intAdd` `:567` | **Where** after When | The 241 order tests (`smoke-table-cast`, *the add row runs Crew…*, *the open line's fields are…*): expected breaks |
| Find | `tableSearch` `:6566`; `openFound` `gm.js:439` | a `place` kind, after encounters | `_interactionFields` gains *Where*. Find's results list draws `kind` labels: grep `openFound` and the results' renderer for the kind names |
| The tabs | `TABLE_SECTIONS` `gm.js:258`; `renderTable` `:310`; the tab bar `:275` | City, after Cast | Four smoke pins (pre-flight). `openTable(t, section)` reads ids from `TABLE_SECTIONS`, so a saved `section:"city"` opens it. The icon is `ui:` from `shadows-icons.js`: reuse one or add one |
| The data | none | `gazetteer` | `engine.test.mjs:365` (135); a new pointer check; voice (`tests/voice.test.mjs` reads data text for maintainer words) |
| Text that points at the tabs | `plans/gm-mode.md` §4b's *As built* line; STATE §1 | gains City | Grep the docs for *Sessions, Cast, Threats* |

## 6. Read first

- `CLAUDE.md` whole: constraints 1, 4, 6, 7, 8 and 10; *Decisions*; *Change
  tiers*; *Versions* (the table schema; why the game data doesn't move).
- `docs/STATE.md` whole.
- `docs/SCHEMA.md` §3 (*The table file*: interactions and links); §4,
  Decisions **68**, **135**, **178**, **203**, **207**, **208**, **212**, **241**.
- `docs/VOICE-APP.md`: the summaries are NYTE City's voice; the controls are
  tool voice.
- `private/crb/1100_Places.md`, `1200_Powers.md`, `1300_Threats.md`
  (*Environmental Threats*). Never edited.
- **The code:** `engine.js`'s `newTable`, `migrateTable`, `_interaction`,
  `_encounterLink`, `linkName`, `addInteraction`, `editInteraction`,
  `interactionSentence`, `crewView`, `_interactionFields`, `tableSearch`,
  `removeCastMember`, `TABLE_RECORDS` and its readers, `gmReference` and
  `_refFold`; `gm.js`'s `TABLE_SECTIONS`, `renderTable`, `openFound`,
  `sentenceHtml`, `bindFightLinks` and `backFromLineNow`, `crewViewHtml`,
  `castTabHtml` (its two views, `data-cview`), `castInteractionsHtml`,
  `interactionRowHtml`, `bindInteractions`, `referenceTabHtml` (its chips,
  209) and `jumpTo` (`shared.js:814`).

## 7. Out of scope

- **Factions as records** (the Faction Tracker), **clocks**, and the stance
  line: S7. S6 only makes the factions' gazetteer entries, with ids S7 will
  seed from.
- **Site Profiles** and their tracks: S12b.
- **An encounter's place**, and a place on a session or a thread: later
  wishes.
- **Adding a line from a place's page.** A line is added on a member's page,
  as now.
- **The book's prose** in the data, and any change to `private/`.
- **The player sheet.** Nothing a player sees changes.
- **Districts and Neighborhoods as data.** The book names Territories and
  Zones only; the rest is always typed.

## 8. The shapes

**The data** (`shadows-data.js`, after `gmReference`, with a comment that
says it's read only by GM mode and moves no game-data version, 68):

```js
"gazetteer": {
  "entries": [
    { "id": "central-city", "kind": "territory", "name": "Central City",
      "territory": null, "zone": null,
      "realWorld": "Vermont, New York, Eastern Pennsylvania, Massachusetts, Rhode Island",
      "summary": "…", "bookSource": "1100" },
    { "id": "metro-core", "kind": "zone", "name": "Metro Core",
      "territory": "central-city", "zone": null, "realWorld": "NYC Metro", "summary": "…", "bookSource": "1100" },
    { "id": "eclipse", "kind": "faction", "name": "Eclipse",
      "territory": "central-city", "zone": "metro-core", "realWorld": null, "summary": "…", "bookSource": "1100" },
    { "id": "covenant-medical", "kind": "power", "group": "Corporations", "name": "Covenant Medical",
      "territory": null, "zone": null, "realWorld": null, "summary": "…", "bookSource": "1200" }
  ],
  "environments": [
    { "id": "thin-places", "name": "Thin Places", "summary": "…", "bookSource": "1300" }
  ]
}
```

- **`kind`**: `territory`, `zone`, `site`, `business`, `faction`, `region` (a
  place Beyond NYTE City), `power`. In the book's order within each kind.
- **`id`**: the book's name in lower case, a leading *The* dropped, every run
  of other characters one `-` (`the-volkov-group` → `volkov-group`;
  `aegis-defense-solutions-ads`). **Permanent** (constraint 6): a renamed
  entry keeps its id. Unique across `entries` and `environments`.
- **`territory`**: a `territory` entry's id, for every zone, site, business
  and faction; null for a territory, a region and a power.
- **`zone`**: a `zone` entry's id where the parentheses name one; else null
  (SQ4). Qualifiers (*HQ in…*, *city-wide reach*) go in the summary, if
  anywhere.
- **`realWorld`**: a zone's parentheses, a territory's list of states, a
  region's line; SQ4's three sites keep their parentheses here. Else null.
- **`group`**: powers only: *Corporations*, *The Unseen Court*, *Other Guys*,
  as the book heads them. The Court itself is a power in its group, and so is
  each house.
- **`summary`**: one sentence, at most 20 words, in the book's voice, saying
  nothing the book's paragraph doesn't (SQ2). ✎ every one.
- **`bookSource`**: `"1100"`, `"1200"` or `"1300"`.

**A place** (`table.places`, schema N):

```js
{ id: "PL-XXXXXXXX",
  name: "",                       // the GM's; blank reads the entry's name
  from: null | { kind: "gazetteer", id: "central-park", name: "Central Park" },
  territory: null | "central-city", zone: null | "metro-core",   // gazetteer ids
  district: "", neighborhood: "",  // always typed
  environment: null | "thin-places",
  notes: "", created, updated }
```

**A line's `place`** (schema N): `null | { kind: "place", id: "PL-…", name?: "" }`.
178's link: a live one stores no name; `removePlace` writes `name`.

**The gate:**

- `places`: not an array → `[]`; non-objects dropped. `_place(p, used)`: a
  bad or repeated id becomes a new one; `name`, `district`, `neighborhood`
  and `notes` are strings; `from` is kept only as `{ kind:"gazetteer", id }`
  with an id of the gazetteer's id shape (`/^[a-z0-9]+(-[a-z0-9]+)*$/`), its
  `name` kept only as a string; `territory`, `zone` and `environment` are
  that shape or null. **An id this version's data doesn't have is kept**:
  a newer app may know it. It reads as nothing, never an error. Stamps through
  `_isoOrNull`. Unknown keys ride along.
- A line's `place`: kept only as `{ kind:"place", id }` with a `PL-` id, a
  `name` only as a string; else null. A link to no place on the table is
  kept (178).
- **The N step** (`typeof arrived!=="string" || _versionNewer("0.14", arrived)`):
  `places` → `[]` if not an array, and every line's `place` → `null`.
  Nothing is converted.

**Engine** (each is total: bad input gives a value, never a throw):

| Function | Does | On bad input |
|---|---|---|
| `gazetteer(f)` | **read-only.** `{ territories:[{ entry, zones, sites, businesses, factions }], beyond, powers:[{ group, entries }], environments }`, in the book's order; `f.q` keeps an entry when every word is in its name, `realWorld` or summary, or its territory's or zone's name (`_refFold`). A territory stays while any of its entries match | no data, a non-object `f` → empty lists |
| `gazetteerEntry(id)` | the entry or environment with that id, else null | anything → null |
| `addPlace(t, f)` | `f.from` a gazetteer id of an addable kind (SQ7): `from` is set and its `territory` and `zone` come from the entry (a zone sets `zone` to itself, a territory sets `territory`). Otherwise the fields as given, through the gate's rules. Unshifts, stamps | `{ ok:false, why }` only for an unknown `from` |
| `editPlace(t, id, f)` | name, territory, zone, district, neighborhood, environment, notes. **A territory that no longer holds the zone clears the zone** | `{ ok:false, why }` for no such place |
| `removePlace(t, id)` | writes `name: placeTitle(t, p)` into every line's `place` with that id, then splices | as `removeEncounter` |
| `placeTitle(t, p)` | the typed name, else the entry's name (live), else `from.name`, else ✎ *Unnamed place* | never throws |
| `placeList(t, f)` | the places, by title, `f.q` as Find's words | empty |
| `placeLines(t, id)` | the lines naming it, newest first | `[]` |
| `placeMet(t, id)` | the cast links on those lines, once each, in order of first meeting | `[]` |
| `linkName(t, link)` | learns `kind:"place"` (above) | never throws |
| `addInteraction`, `editInteraction` | take `place`: a place id on the table, else no link (add) or refused (edit, `{ ok:false }`); `null` clears it | as today |
| `interactionSentence(t, x)` | a `{ kind:"place", id, name, gone }` part (§9's table) | as today |
| `crewView`, `_interactionFields` | the place's name is searched; the field is ✎ *Where* | as today |
| `tableSearch` | a `place` kind, after encounters: *Name* (`placeTitle`, so a place from the book with no typed name is found by the book's), *Territory*, *Zone*, *District*, *Neighborhood*, *Ground* (the kind's name), *Notes* | as today |

`TABLE_RECORDS` gains `"places"`, and `_recName("places", r)` is
`placeTitle`. 212's label rule then reads *Added Central Park*, *Changed
Central Park*, *Removed Central Park*.

## 9. The UI

All in `gm.js` and the CSS. Tool voice except the summaries; ✎ marks text
for a voice pass. Every control a tap, 44px (plan §1a).

**The City tab** (SQ6), two views, a toggle like Cast's (`data-cview`):

- **The crew's places** (first): quick-add (a name, Enter or **Add**), a
  search, the list by title. A card shows the title, then where it sits
  (*Metro Core · Central City*, from the ids; District and Neighborhood when
  typed), its kind of ground, and how many lines name it. Empty: ✎ *No places
  yet. Add one, or find it in The city.*
- **The city**: a search, then a row of chips (209's pattern, `jumpTo`): each
  Territory, *Beyond NYTE City*, *The powers*, *Kinds of ground*. Each
  Territory is a heading, its line, then its Zones, Supernatural Sites,
  Business Interests and Factions, each entry its name, `realWorld` (dim)
  and summary. An addable entry (SQ7) has **Add to the crew's places**, or
  **Open** when the table already has a place from it. With a search, only
  matches show, and an empty result reads ✎ *Nothing in the city by that
  name.*

**A place's page**: **Back**, the title (`h1`), then the fields, saved as
typed (no draft, no Save): **Name** (placeholder: the entry's name),
**Territory** (a select: none, then the six), **Zone** (a select: none, then
that Territory's zones), **District** and **Neighborhood** (typed, each with
a datalist of the table's own), **Kind of ground** (five toggles, one or
none), **Notes**. When it came from the book: the entry's summary, read-only,
under ✎ *From the book*. Then ✎ **What happened here** (its lines, as
sentences, newest first) and ✎ **Met here** (each member a link), and
**Delete** (asks, danger).

**Where** (SQ5), a select: ✎ *Nowhere in particular*, then the table's
places by title.

- **The add row** runs Crew, the kinds, What, When, **Where**, Add. Its draft
  keeps Where between lines, as it keeps crew and kind: a scene happens in
  one place.
- **An open line** (241) runs Crew, the kinds, What, When, **Where**, then
  Delete and Done.

**The sentence** (SQ8), each kind's position:

| Kind | Reads ✎ |
|---|---|
| `shared` · `learned` | *{crew} told / learned from {member}[ “{text}”][ at {place}][ on {day}]* |
| `helped` · `wronged` · `killed` · `fought` | *{crew} {verb} {member}[ in {fight}][ at {place}][ on {day}][: {text}]* |
| `owes` | *{crew} owes / owe {member}[ at {place}][ on {day}][: {text}]* |
| `owed` | *{member} owes / owe {crew}[ at {place}][ on {day}][: {text}]* |
| none | *{member}[, with {crew}][, at {place}][, on {day}][: {text}]* |

The place's name is read as `placeTitle` gives it, never recased; a place
never leads a sentence. A gone place is its kept name, struck, with
*, removed* for a screen reader (178).

**Rendering the place part:** a live place is a button that opens its page,
keyed like the fight's (`line|place|where`, the same `where`), except on that
place's own page, where it's plain text. Gone: `<s>`. In the wrap-up's
preview and an open line's sentence (241's `plain`), plain text.

**Where things land:**

| Press | The record | The view | Focus |
|---|---|---|---|
| **Add** (crew's places) | a place | the list redraws | the quick-add field (as Cast's) |
| A place's card | — | its page | its `h1` |
| **Add to the crew's places** (The city) | a place, `from` set | stays on The city; the button turns to **Open** | that **Open** |
| **Open** (The city) | — | that place's page | its `h1` |
| A field on a place's page | edited (212 folds typing) | no redraw while typing; a Territory change redraws the Zone select | stays |
| **Territory** set to one that doesn't hold the zone | zone cleared | Zone shows none | stays on Territory |
| **Delete** on a place's page | asks, then removed; its lines keep its name | the crew's places | the quick-add field |
| **Back** on a place's page | — | where it was opened from: the crew's places, The city (with its search), or the page whose sentence was tapped. From Find, the crew's places, as a member found by Find goes back to the cast list (`openFound`'s `castFrom=null`) | the card, the **Open**, or the link it came from; else that page's heading |
| A place in a sentence | — | the City tab, that place's page | its `h1` |
| A member under **Met here** | — | as a member's name anywhere (`data-copen`); their Back returns to the place's page | as today |
| **Where** on the add row | the draft | — | stays |
| **Where** in an open line | edited | the sentence above follows (241's in-place update) | stays |
| A Find hit on a place | — | its page | its `h1` |
| The City tab's button | — | the view last shown, no place open | as other tabs |

The return route is state beside 241's (`S.backFromLine` gains a
destination, or the build's own name). It is cleared by a tab press, Find,
Home, and opening a place from its list.

**At width:** the City list, The city's entries and a place's fields stack at
390px; `overflow-wrap:anywhere` on every name and summary. Seven tabs scroll
sideways in their row (140).

## 10. Worked examples, as named tests

Write these first; show each failing on `main` for the reason it states (not
an `undefined`), and record the output in the PR. Those that pass on `main` by
design say so.

**`tests/engine.test.mjs`**, *The gazetteer (N)*:

- **`N: the gazetteer holds every Territory, Zone, Site, Business, Faction and place Beyond in 1100`**: reads `private/crb/1100_Places.md`, collects each Territory and each bold entry by section, and asserts each has an entry of the right kind and Territory, by name, and that there are no extras: 6, 34, 17, 42, 23 and 11.
- **`N: the powers are 1200's and the kinds of ground are 1300's`**: 16 powers in three groups; 5 environments, named as the book's headings.
- **`N: every territory and zone an entry names is one, and every id is unique and shaped`**: pointer check; ids match the shape; no id repeats across `entries` and `environments`.
- **`N: a zone is set only where the book names a listed one`**: Eclipse → Metro Core; Orion Arms → Riverlands (the qualifier dropped); the three of SQ4 have `zone: null` and their words in `realWorld`.
- **`N: every summary is one sentence of at most 20 words`.**
- **`N: gazetteer(q) keeps an entry by its name, its line or where it sits, and is total`**: *metro* returns Central City with Metro Core and its entries; *eclipse* returns Eclipse under Central City; `gazetteer(null)`, `gazetteer({ q:5 })`, and the data removed (`withData`) each give lists.

*The crew's places (N+1)*:

- **`N+1: addPlace from an entry takes its territory and zone; a typed one keeps what it's given`**: Central Park → territory `central-city`, zone `metro-core`, `from.name` *Central Park*; Metro Core → zone itself; an unknown `from` → refused.
- **`N+1: a territory that doesn't hold the zone clears it`.**
- **`N+1: placeTitle reads the typed name, then the entry's, then the kept one, then Unnamed place`.**
- **`N+1: a line names a place; its sentence says at, in each kind's position`**: every row of §9's table, with and without a fight, a day and text; a place renamed, and the sentence follows.
- **`N+1: removing a place keeps its name in every line, struck, and undo restores it`**: `linkName` → *Central Park*, `gone: true`; a link with no name and no target → *A place removed*; recorded and undone through 212, deep-equal (`undoBase`).
- **`N+1: placeLines and placeMet read the lines, newest first, each member once`.**
- **`N+1: Find finds a place by any field, and a line by its place; Who knows what too`**: `tableSearch(t, "ramble")` → the place (*Name*) and the line (*Where*); `crewView({ q:"ramble" })` → the line.
- **`N+1: the activity log names a place`**: add, change and remove read *Added Central Park*, *Changed Central Park*, *Removed Central Park*; a crafted op on `places` in a file is gated like any other record's.
- **`N+1: the gate types places and a line's place, keeps an unknown gazetteer id, and converts nothing`**: junk records dropped, ids remade, a `__proto__` id, an array `from`, a numeric `name`, a cast-kind `place` link → null. A 0.13 table loads with `places: []` and `place: null` on every line, its text untouched. `newTable()` → `addPlace` → `migrateTable` round-trips (constraint 8).
- **Version pins:** every `tableSchemaVersion` `"0.13"` assertion moves to `"0.14"` (16 here at the pre-flight).

**`tests/smoke-table-cast.test.mjs`** (the City tab and a member's lines),
switched on, each reading what is drawn:

- **`N+1: the tabs are Sessions, Cast, City, Threats, Encounters, Reference, Notes`** (and the four existing pins move, §13).
- **`N+1: The city lists the book's places by Territory, searches them, and adds one`**: *metro* shows Metro Core's line; **Add to the crew's places** on Central Park turns to **Open**, focused; The crew's places lists it, *Metro Core · Central City*.
- **`N+1: a place's page saves as typed; a Territory change clears a zone it doesn't hold`**: fire `input` and then `change` on Name, District and Neighborhood: one Activity entry each, no toast (S15's lesson).
- **`N+1: Where on the add row is kept between lines, and the line reads at the place`**: *Scott told Dez “the lake is on fire” at Central Park on …*; the next line keeps Where.
- **`N+1: Where in an open line updates its sentence in place`.**
- **`N+1: a place in a sentence opens its page, and Back returns to the member's page, Who knows what (the copy tapped, with its search) or a session's page, on the link`**: a two-crew line on Who knows what, tapping the second group's copy.
- **`N+1: What happened here and Met here read the lines; a member there opens, and their Back returns to the place`.**
- **`N+1: removing a place strikes its name in every sentence, with no button and no error`.**
- **`N+1: Find opens a place on its heading, and Back goes to the crew's places, on its card`.**

**`tests/hostile.test.mjs`:** a table whose places carry `<img onerror>` in
every text field and as a kept `from.name`, a `__proto__` gazetteer id, an
array `territory`, and lines whose `place` is crafted (`<img>` as kept name,
a cast-kind link, an array). Rendered as text on the City list, a place's
page, all three lists of lines and Find; no `img` in the page;
`Object.prototype` untouched; the 2 version pins move.

## 11. Tests beyond the examples

- **Totality:** every new reader on `null`, `{}`, a table whose `places` is
  `"x"`, and a place whose fields are numbers.
- **Voice:** the summaries, the empty states and every ✎ string through
  `tests/voice.test.mjs`. A summary that names a flag, a phase or *TBD* fails.
- **The data guard** (135) passes with no new `MAPS` entry: `group`,
  `realWorld`, `summary` and `kind` are read by code; `bookSource` is text.
- **Mutation-test** each (record each in the PR with what caught it). Check
  each for a second path first, and run each mutant narrowly
  (`node --test --test-name-pattern="…" tests/<file>` under a `timeout`):
  1. `TABLE_RECORDS` without `places` → *the activity log names a place*.
  2. `removePlace` writing no name → *removing a place keeps its name…*.
  3. The gate accepting a cast-kind `place` → *the gate types places…*.
  4. `tableSearch` without places → *Find finds a place…*.
  5. `editPlace` keeping a zone the new Territory doesn't hold → engine and
     smoke *clears…*.
  6. `addInteraction` keeping a place that isn't on the table → *a line names
     a place…*.
  7. One `1100` entry deleted from the data → *the gazetteer holds every…*.
  8. Back's key without `where` → the smoke Back test (Who knows what's
     second copy).

## 12. Steps

`git submodule update --init private`; `npm run verify` before starting and
at the end; the targeted files after each step.

1. Take the two decision numbers and the table schema version: the lowest
   free on `origin/main`. Search the ledger again for §pre-flight's names.
2. **The data:** `gazetteer` from the three chapters, every summary drafted
   (SQ2), with the conformance, pointer and summary tests. Data tests.
3. **The shape:** the N step, `_place`, a line's `place` gate, `linkName`'s
   place, `TABLE_RECORDS` and `_recName`. The version pins. Engine tests.
4. **The writers and readers:** `addPlace`, `editPlace`, `removePlace`,
   `placeTitle`, `placeList`, `placeLines`, `placeMet`, `gazetteer`,
   `gazetteerEntry`; `addInteraction` and `editInteraction`'s `place`; the
   sentence's place part; `crewView`, `_interactionFields`, `tableSearch`.
5. **The City tab:** both views, a place's page, the chips.
6. **Where** on the add row and an open line, and the sentence's place
   button with its Back route from each list, and Find.
7. **Hostile** test; CSS at 390px.
8. **In the browser** (`shadows-dev-preview`, `?gm=on`):
   - The city: search *metro*, *eclipse*, a zone's real-world name; add three
     places from the book and one typed.
   - A place's page: every field, a Territory change that clears the zone,
     the summary from the book.
   - Lines with Where on two members' pages; read them in all three lists
     and on the place's page; tap the place from each and come Back.
   - Rename a place; remove one; Undo from Activity.
   - Find a place and a line by its place.
   - **390px**, **768 × 1024** and **1300px**; `npm run phone-check`.
   - **Both themes:** the City tab's cards and The city's entries are new
     blocks. Measure their text contrast with `data-theme="light"` and
     without. **Report it if** any is under 4.5:1.
9. The mutations (§11).
10. Ledger (N, N+1; 178, 208, 212 and 241 marked), INDEX, SCHEMA §3 (`places`,
    a line's `place`, schema N), the plan, STATE, docs, close-out (§14).

## 13. Stop and ask

- 0.14 is taken, or the ledger search finds a decision these override that
  the pre-flight doesn't name.
- The book's entries don't count as §pre-flight says (6, 34, 17, 42, 23, 11,
  16, 5), or a parenthetical names a zone in another Territory.
- A summary can't be written in 20 words without saying something the book
  doesn't.
- A line is written anywhere other than `addInteraction`.
- The sentence needs a word for a case §9's table doesn't cover.
- An existing test needs a change beyond: the version pins; the four tab
  pins; *241: the add row runs Crew, the kinds, What, When, Add* and *241:
  the open line's fields are Crew, the kinds, What, When, then Delete and
  Done…*, each gaining Where; and any test that pins the sentence of a line
  the test gives a place.
- Undo's round trip of a removal isn't deep-equal.
- The voice test flags any new copy, or a decision goes over 350 words.
- **Not a stop:** the version literals 0.14 moves; the four tab pins;
  `engine.test.mjs`'s *"208: a search over 200 members and 100 sessions is
  quick"* failing on timing while the dev preview runs, if it passes run
  alone.

## 14. Close-out

*Rule or shape* tier, switched off, table schema N:

- **SCHEMA:** N and N+1; the marks on 178, 208, 212 and 241; §3 gains
  `places` and a line's `place`, with N's line.
- **INDEX:** N and N+1 under **GM mode**; the four lines marked.
- **STATE:** the versions line (table schema N); §1's GM mode line *built
  through S6* (no clause for what it does: the INDEX line says it); §3's GM
  mode row and §5's *Next*. Inside the word and line-length guard.
- **The plan:** S6's row moves from *Still to build* to *Built* (Decisions
  N, N+1); §4b's *As built* line gains City; S7's row loses *waits on S6*.
- **`changelog-pending.md`:** ✎ *The City tab: the book's places, factions
  and powers to read and search, and the crew's own places. A line can say
  where it happened, and a place lists what happened there and who you met.*
- **Log** entry: why the history is read from lines, how the data was
  checked against the book, and the summaries' voice pass. **Shipped** row
  *(switched off)*. README's table: S6's row.
- **PR** titled `feat(gm): the gazetteer, and the crew's places, switched off
  (S6, Decisions N and N+1)`. Body sections: what changed; *Evidence* (every
  claim names its command or test; the §10 tests failing on `main`; each
  mutation; each changed existing test, by name, with what changed); the
  browser check; *Voice pass* (**every summary**, in a table by Territory,
  and every ✎ string, for Ken through the conductor); **Where the order
  didn't fit**.

**Review checklist:**

- [ ] **Every answer Ken recorded** (SQ1–SQ10 in this order, and any PR
      comment in his words) **is in the code**, checked one by one.
- [ ] **In the browser, by the reviewer** (§12's step 8, by clicking): The
      city's search and Add; a place's page; Where on the add row and an open
      line; the three lists and a place's page; the place's tap and Back from
      each, including the second copy on Who knows what; rename, remove,
      Undo; Find.
- [ ] The data matches the book: the counts, every name, every zone, the
      three of SQ4. Spot-read ten summaries against their paragraphs.
- [ ] A 0.13 file's lines load untouched with `place: null`; a crafted link
      or place renders as text.
- [ ] Undo covers every place change, deep-equal.
- [ ] Only the named tests changed (§13's list), and every smoke test reads
      what's drawn.
- [ ] 390px: nothing scrolls sideways; every control 44px.
- [ ] 178, 208, 212 and 241 marked; table schema N everywhere it's written;
      no game-data bump.
- [ ] Two mutations re-run locally.
- [ ] Every "report it if" has an answer in the PR (the contrast numbers),
      and *Where the order didn't fit* is there, empty or not.
- [ ] The final `npm run verify` is on the PR's final commit.

## 15. Handing it over

The conductor starts **S6 build** (Sonnet) with the building prompt in
`docs/WORK-ORDERS.md` and this order's path,
`docs/plans/gm-mode/S6-gazetteer-places.md`, and **S6 review** (Opus) once
the PR is open. The traps, under the builder's prompt:

- **`TABLE_RECORDS` is the activity log's whole idea of a table.** Miss it
  and every place change is invisible to undo, and a file's op on `places`
  is refused (the pre-flight's probe).
- **Read the book, don't remember it.** Every entry's name, kind, Territory
  and zone comes from `private/crb/`, and the conformance test reads the
  same files. The counts are in §13; a mismatch stops you.
- **The summaries are drafts for Ken.** One sentence, 20 words at most,
  nothing the paragraph doesn't say. All of them go in the PR's *Voice pass*.
- **A place's history is read, never stored** (SQ5). No visit list, no
  copy of a member on the place.
- **A place in a sentence is a second link of the fight's kind**: key it
  with the same `where`, so Back finds the copy that was tapped.
- **Fire `change` as well as `input`** on every field a place's page and an
  open line bind.
- **Smoke tests read what's drawn**, never `S.table` in place of the page.
- **Numbers aren't reserved:** take the next free decision numbers and the
  table schema version when you write them.
- **Ken's answers land in the order or as PR comments.** Re-read both before
  each push.
- **Preview by clicking**, both themes and three widths, and answer every
  "Report it if" in the PR.
- **Verify last.** The final `npm run verify` runs on the commit the PR ends on.
