# Work order S7 — Factions and clocks

**Plan:** [`../gm-mode.md`](../gm-mode.md) §4b (the City tab), §4c (`factions`,
`clocks`), §4f (*A `FactionRecord` is the Faction Tracker worksheet verbatim*;
*Clocks are one primitive*), §6 *S7*; §1a (what the two GMs said). Decisions
68, 135, 173, 177, 178, 179, 203, 204, 208, 212, 242, 243.
**Status:** **drafted 2026-10-23 by Claude (Opus)**, the S6 reviewer, after
#236 (S6, Decisions 242–243) merged (`WORK-ORDERS.md`, step 7). **Ken chose this
session (2026-10-23).** Not approved. SQ0–SQ11 unanswered.
**Branch:** from `main` at `d9eed51` or later, PR to `main`, switched off
(Decision 173).
**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md):
a conductor (Opus) starts **S7 build** (Sonnet), then a fresh **S7 review**
(Opus) once the PR is open. Builder and reviewer message each other directly;
anything for Ken goes to the conductor. §15 is the hand-over.
**Runs alone.** It touches `engine.js` (two records, their gate, readers and
writers, `removeCastMember`, `tableSearch`, the activity log's record list),
`gm.js` (a third City view, a faction's page, clocks, The city's faction and
power entries, a member's page, Find), the CSS, the ledger and STATE.
**Table schema N** (0.15 if it's still free when you build: `main` is 0.14 at
`d9eed51`). Two decisions, **N** and **N+1** below.

**Read this first: who this is for.** The plan's own interview (§1a) says
*"S7's factions and clocks have no customer in [Deighton]… the world is
frozen until the players play"*, and that S7 is "worth less than the plan
assumed". The book agrees about factions: `2410` says "track factions
loosely… You don't need stat blocks or influence scores", with three
positions (Neutral, Aware, Active). Scott preps and keeps records, so he is
the customer for the worksheet. **Clocks** are different: S10f (an
encounter's clocks), S11 (a job's deadline) and S12b (Site Profiles, whose
approved Expansion gives every site a 4-segment clock) all wait on one clock
primitive. So this order is drafted **lean**: the worksheet as one record,
with no derived scores, and clocks on a faction first. SQ0 asks whether to
build it at all. The orchestrator's recommendation is to build both, at
this size.

**Carried over from S6's review** (#236, two fix rounds). Each is marked as
the order's, the build's or the conductor's:

- **The order's: tab pins were listed by label.** Three more tests pin the
  tabs' *ids*, and two pin a table's top-level key list. S7 adds no tab, but
  it adds two top-level keys. §13 names both key-list tests
  (`smoke-table-cast.test.mjs:1102` and `:1270`), found by grepping the
  key list `audit,cast,encounters`, not by memory.
- **The order's: smoke-test helpers are file-local**, so a new area's smoke
  tests go in a new file. This order names it:
  `tests/smoke-table-factions.test.mjs`.
- **The order's: ids followed the book's current names**, against
  constraint 6. S6's fix froze the gazetteer's ids in
  `tests/gazetteer-ids.json`, checked by presence. **Every id S7 stores in a
  saved table is frozen from the start**: the faction types, the stance
  steps and the attention values are pinned as literal lists in a test
  (§10), so a renamed label can never move an id.
- **The order's: a "report it if…" about the book found two more slips.**
  This order reads `2410` and `2644`. **A book slip is listed in
  `docs/plans/crb-catch-up.md`, never fixed here and never worked around in
  code.** The pre-flight found one already (below).
- **The build's: a pinned rule got a one-entry exception before Ken ruled.**
  **No test here gets an exception for one record, entry or string without
  Ken's ruling recorded in the PR.** If a rule and a wording collide, stop
  and ask (§13).
- **The conductor's: wording for Ken was trimmed into a second sentence.**
  Every ✎ string in this order was checked against its own copy rules
  before it went to Ken (each control's label is at most four words, each
  empty state one sentence). Anyone rewording one for Ken checks it again.
- **The conductor's: notes left in a shared folder weren't found.** Findings
  for Ken are pasted into the message, not just linked.
- **Ken's answers on S6:** every SQ default, plus the voice pass
  (PR #236, issuecomment-6375806390 and -6375826144).

**Pre-flight** (`docs/WORK-ORDERS.md`, *The pre-flight*) against `main` at
**`d9eed51`**, 2026-10-23. Every function below was opened and read. The
line numbers are `d9eed51`'s.

- **No faction or clock record anywhere.** `grep -n -i "clock" src/` finds
  two unrelated comments (`shared.js:141`, `sheet.js:768`). `grep -n -i
  "faction" src/engine/engine.js src/ui/gm.js` finds only the gazetteer's
  `factions` lists (`engine.js:6455`, `gm.js:1136`) and the journal part
  *Faction and city impact* (`gm.js:1332`), which stays text.
- **A table today** (`newTable`, `engine.js:5803`) is `meta, notes, cast,
  places, interactions, encounters, sessions, threads, audit`. **Probes**
  (a scratch script against `loadEngine()`): a table with `factions:
  [{ id:"FA-AAAAAAAA", name:"Eclipse" }]` and `clocks: [{ id:"CK-AAAAAAAA",
  name:"Heat", segments:4, filled:1 }]` keeps both through `migrateTable`
  untouched, as unknown keys. Pushing a faction gives `diffTable` → `[]`
  and `recordTableAction` → `{ ok:false, noop:true }`: **undo can't see
  either** until `TABLE_RECORDS` (`:5948`) names them. `tableSearch(t,
  "eclipse")` → `[]`. `linkName(t, { kind:"faction", id })` falls through to
  the cast branch and returns `{ name:"Someone removed", gone:true }`.
- **The activity log** (212) knows a record only by `TABLE_RECORDS`:
  `_tableCore`, `diffTable`, `_recName` (`:5959`), `tableActionLabel`, and
  `_tableOpOk` (`:6086`), which refuses an op on any other path. **Every one
  of those is a reader of the new records.** Undo re-gates through
  `migrateTable` (`undoTableAction`, `:6063`), so a gate bug is an undo bug.
- **Links** (178): a cast link is gated by `_castLinks` (`:5676`).
  `removeCastMember` (`:6217`) writes a removed member's name into every
  line's and every encounter row's cast link, and **only when the name isn't
  blank** (`if (name.trim())`). A faction's key NPCs are cast links, so
  `removeCastMember` is a reader that must learn them.
- **Affiliations** (177, 179) are a list of text on a member (`_castMember`,
  `:5647`), filtered by `castFilter` (`:6236`), listed by `castAffiliations`
  (`:6247`) and searched by `_castFields` (`:6729`). 179's **Revisit if**
  reads *"S7 makes affiliations faction links"*. This order doesn't (SQ5):
  a faction's page reads the affiliations that match its name, and stores
  nothing on the member.
- **The gazetteer** (242): 23 `faction` entries and 16 `power` entries
  (`Engine.gazetteer()`, probed). The city's entries draw an Add/Open button
  only for `Engine.PLACE_FROM_KINDS` (`gm.js:1129`).
- **The City tab** (243): `CITY_VIEWS` (`gm.js:1110`) is *The crew's
  places*, *The city*. A place's page is `S.placeOpen`, its Back route
  `S.placeRoute`, and a member opened from it sets `S.backPlace`.
  **`S.backPlace` is read or written at 14 sites in `gm.js`**: `:275, 443,
  446, 738, 782, 805, 1078, 1079, 1083, 1108, 1113, 1210, 1221, 1309, 1455,
  2625` (two on one line at 1078–1079). A faction's page needs the same
  route, and a second flag at every one of those sites is how a route gets
  missed. §9 has them generalised to one `S.backCity`.
- **Find** (`tableSearch`, `:6775`) walks cast, sessions, interactions,
  threads, notes, encounters and places. `FIND_KINDS` (`gm.js:413`) and
  `openFound` (`:442`) open each kind.
- **The book.** The worksheet is `private/crb/2644_Faction_Tracker.md`:
  *Faction name*, *Type (Gang / Corp / Government / Cult / Collective /
  Other)*, *Territory / Base of Operations*, *Key NPC(s)*, *What They Want*,
  *Resources & Reach*, *Tipping Points* (two columns, six rows each: *Works
  in the Crew's Favor*, *Works Against the Crew*), *Stance toward the Crew*
  (a line, labelled only at its ends: *Hostile* … *Allied*), *Notes /
  Current Status*. The guidance is `2410_Factions_and_City.md`: positions
  *Neutral, Aware, Active* (`:57–63`), and *"Allied, rival, neutral,
  opportunistic, hostile"* in plain language (`:33`).
  - **The core rulebook never gives a clock a shape.** In `2000`, `2240` and
    `0520` a clock is "what's counting down and what happens when it runs
    out", usually in minutes. **The approved Expansion does**
    (`APPROVED_Threat_Codex_Expansion.md:132`): *"Sites may use segmented
    clocks."* Every clock in `Threat_Codex_Site_Profiles.md` and the pilot
    entries has a name, **4 segments**, what advances it and what happens
    when it fills. Some reset (*Widening: "then reset to 1"*), and some are
    conditional (*Lost: "only while Hostile"*). That is the shape below.
  - **One slip for the book** (listed in `crb-catch-up.md` by this order's
    build, not fixed): the worksheet's stance is a Hostile↔Allied line, but
    `2410`'s positions are Neutral/Aware/Active, and the two never mention
    each other. The data keeps both, as the book does (SQ2).
- **The ledger,** searched by name: *faction*, *clock*, *stance*, *tipping*,
  *affiliation*, *key NPC*, *City tab*, *CITY_VIEWS*, *link*, *linkName*,
  *removeCastMember*, *tableSearch*, *Find*, *TABLE_RECORDS*, *Next
  session*, *impact*. Hits:
  - **68** (when `gamedataVersion` bumps): **cited.** The faction types,
    stance and attention are engine constants a character never sees, as
    `THREAD_STATUSES` (204) is. No game-data bump.
  - **177, 179** (affiliations as text; *Revisit if: S7 makes affiliations
    faction links*): **cited, not superseded.** The default (SQ5) leaves
    affiliations as text and reads them. Superseded in part only if Ken
    picks converting them.
  - **178** (links; deleting a target writes its name): **superseded in
    part.** A clock's owner link is the first link whose target's removal
    removes the linking record, rather than keeping a name: a clock goes
    with its faction (SQ10). Key NPCs follow 178 unchanged.
  - **204** (threads; *Revisit if: … S7's clocks join Next session*):
    **cited.** Clocks don't join Next session here (§7).
  - **208** (Find): **superseded in part.** Find searches factions and
    clocks.
  - **212** (the activity log's records): **superseded in part.**
    `factions` and `clocks` join `TABLE_RECORDS`.
  - **242** (the gazetteer): **cited.** Its `faction` and `power` entries
    seed a faction, as its addable kinds seed a place.
  - **243** (the crew's places; *Revisit if: S7's factions … want a place's
    own track*): **cited.** No faction or clock links a place here (§7).
  - **Since 243:** none.
- **Numbers:** the decisions take **the next free numbers** when built
  (`CLAUDE.md`, *Decisions*), written **N** and **N+1** here. The ledger
  ends at **243** on `d9eed51`. The table schema is **0.14**, so this order's
  step is 0.15 if still free. Check both again at build time.

---

## 1. Goal

Scott preps a session. He opens **City**, switches to **The city**, finds
*Eclipse* under Central City and taps **Add to the crew's factions**. Its
page opens on Eclipse: Territory *Central City*, the book's line under
*From the book*. He sets Type *Gang*, adds Bob from the cast as a key NPC,
types what they want, adds two tipping points against the crew (*the crew
talks to NCPD*, *a shipment goes missing on their ground*), and sets the
stance one step toward Hostile. He adds a clock, *Eclipse notices the
crew*, 4 segments, advancing *"each job in Metro Core"* and, when full,
*"they send someone"*.

Mid-session the crew hits a job in Metro Core. Deighton (who tracks nothing)
opens **Find**, types *eclipse*, gets the faction, and taps **+** on the
clock: 1 of 4. Later he removes Bob from the cast. Eclipse's page still
lists Bob, struck through. Undo brings him back, linked again.

**Done when:**

- Switched off: nothing changes anywhere.
- A table keeps **factions**: the Faction Tracker's fields, nothing derived.
  A gazetteer faction or power seeds one.
- A table keeps **clocks**: a name, segments, how many are filled, what
  advances it, what happens when it fills, and the faction it's on.
- The City tab has a third view, **Factions**: quick-add, a search, a card
  each, and a faction's page with its clocks.
- A key NPC is a cast link. Removing the member writes their name into it,
  and the faction's page shows it struck through, never as an error.
- Removing a faction asks, names how many clocks go with it, and undo
  restores both.
- Find finds a faction by any field and a clock by its words, and opens its
  page.
- Undo covers every faction and clock change.
- A crafted faction, clock or link in a file can't throw or write outside
  its record, and renders as text.
- At 390px nothing scrolls sideways; every control is 44px.
- `npm run verify` and `npm run phone-check` pass (phone-check's two known
  OVER rows on the player sheet's HP pill fail on `main` too, `d9eed51`).
  Checked by hand at 390px, 768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape. A saved-file shape (`factions`, `clocks`) and
  GM-facing behaviour someone could have chosen otherwise (a stance scale, a
  clock's segments, what removing a faction does). It supersedes 178, 208
  and 212 in part.
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** **no bump** (68). Nothing is added to `shadows-data.js`.
- **Table schema:** **0.14 → N** (0.15), with a `migrateTable()` step:
  `factions` and `clocks` are `[]` if not arrays. Nothing is guessed, and
  affiliations are not converted (203).
- **Character and pack schemas:** unchanged.
- **Decisions:** the next two free numbers, **N** (the faction) and **N+1**
  (the clock).

## 3. The decisions, drafted

Paste after the last decision, under INDEX §3's **GM mode** heading, filling
**Built**. Each must stay under 350 words, Touches included (`wc -w`). Both
are worded for the defaults; a different answer to an SQ rewords them.

```
N. **A table keeps the crew's factions as the book's Faction Tracker: its fields, a stance and an attention, and nothing derived.**
     *2026-10-XX · Ken + Claude · Touches: factions, FA- id, from, type, territory, base, keyNpcs, wants, reach, tippingFor, tippingAgainst, stance, attention, notes, addFaction, editFaction, removeFaction, factionTitle, factionList, factionsKeyFor, factionAffiliated, FACTION_TYPES, Factions view, City tab, CITY_VIEWS, The city, removeCastMember, tableSearch, TABLE_RECORDS, table schema 0.15, Decision 177, Decision 179, Decision 208, Decision 212, Decision 242*
     - **Decided:** Table schema N adds `factions`: the worksheet's fields (`2644`) as typed text and lists, a type from the book's six, a Territory from the gazetteer, key NPCs as cast links, a stance on the Hostile↔Allied line in five steps, and `2410`'s attention (Neutral, Aware, Active), each optional. A gazetteer faction or power seeds one. Affiliations stay text: a faction's page lists the cast whose affiliation matches its name, read every time. The City tab gains **Factions**. Find and undo cover them.
     - **Why:** `2410` says to track factions loosely, in plain language, with no influence scores; the worksheet is what the book hands a GM to do that, so the record is the worksheet and nothing more. Scott keeps records; Deighton doesn't (§1a), so nothing here is required.
     - **Rejected:**
       - A computed standing or score: the book rejects it (`2410`).
       - Converting affiliations to faction links: it guesses which text meant which faction (203).
       - Factions as a tab of their own: the city's records live on City (§4b).
       - The stance as free text only: the worksheet draws a line.
     - **Replaces:** Decision 208 in part (Find searches factions), 212 in part (factions are a record the log covers).
     - **Revisit if:** a GM wants affiliations as links (179's own trigger), or S11's jobs want a faction's reaction.
     - **Built:** table schema N, switched off (173); log 2026-10-XX.

N+1. **A clock is one record on the table: a name, segments, how many are filled, what advances it and what happens when it fills; S7 hangs clocks on factions.**
     *2026-10-XX · Ken + Claude · Touches: clocks, CK- id, segments, filled, advances, whenFull, on, owner link, addClock, editClock, removeClock, clocksOn, clock segments, faction page, removeFaction, tableSearch, TABLE_RECORDS, table schema 0.15, Decision 178, Decision 204, Decision 208, Decision 212*
     - **Decided:** `clocks` holds every clock, each with an `on` link to what owns it (`{ kind:"faction", id }` in S7). Segments are 2 to 12, 4 by default, as every clock in the approved Expansion has; `filled` is 0 to segments. The app never advances one: the GM taps + or −, and a full clock shows what happens, nothing more. Removing a faction removes its clocks; undo restores both.
     - **Why:** S10f, S11 and S12b each need a clock; one record with an owner link serves all three without a second shape. The core rulebook gives a clock no shape; the Expansion's sites do, and that is the shape.
     - **Rejected:**
       - Clocks stored inside each faction: S10f's and S12b's would need a second shape.
       - Advancing a clock from play (a job closed, a session ended): the app doesn't know what advances one (`2410`: what a faction does is the GM's).
       - Keeping an owner's name on its orphaned clocks (178's rule): a clock means nothing without its owner.
     - **Replaces:** Decision 178 in part (a clock goes with its owner, not under its name), 208 in part (Find searches clocks), 212 in part (clocks are a record the log covers).
     - **Revisit if:** S10f, S11 or S12b needs a clock with no owner, a reset rule, or a clock that advances itself.
     - **Built:** table schema N, switched off (173); log 2026-10-XX.
```

**Supersession marks** (each ledger entry and its INDEX line):

- 178: *→ **Superseded in part by Decision N+1** — a clock goes with its
  owner, rather than keeping its name.*
- 208: *→ **Superseded in part by Decisions N and N+1** — Find searches
  factions and clocks.*
- 212: *→ **Superseded in part by Decisions N and N+1** — `factions` and
  `clocks` are records the log covers.*

If the ledger search at build time finds another, stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ0 | **Build S7 at all, and how much?** §1a: Deighton has no use for it; Scott keeps records; clocks are what S10f, S11 and S12b wait on. Build both as drafted (lean: the worksheet, clocks on factions)? Clocks only, on nothing yet (no UI until S10f or S12b)? Or defer S7 and pick another session? | **Both, as drafted** | |
| SQ1 | **The stance line.** The worksheet draws a line labelled only *Hostile* and *Allied*. Five steps (−2 to +2), labelled *Hostile*, two unlabelled steps either side of *Neutral*, *Allied* (screen readers: "one step toward Hostile")? Or three (Hostile, Neutral, Allied)? Or seven? | **Five steps; only the ends and the middle named** | |
| SQ2 | **`2410`'s attention** (*Neutral: the faction observes. Aware: beginning to respond indirectly. Active: working for or against the crew*). Keep it beside the stance, as the book has both? Or stance only? | **Both** (and the mismatch goes to `crb-catch-up.md`) | |
| SQ3 | **What seeds a faction:** the gazetteer's 23 Factions and its 16 powers (Corporations, the Unseen Court and its houses, Other Guys)? Or Factions only? | **Factions and powers** | |
| SQ4 | **The type**: one of the worksheet's six (*Gang, Corp, Government, Cult, Collective, Other*) or none. Never seeded from the gazetteer (it gives no type; nothing guessed)? | **As written** | |
| SQ5 | **Affiliations.** A faction's page lists, read-only, every member whose affiliation matches its name (case and apostrophes folded, 187). Nothing stored, nothing converted? Or convert matching text to links on load (a guess, 203)? Or neither? | **Read them, store nothing** | |
| SQ6 | **Tipping points**: two lists of typed lines, *For the crew* and *Against the crew*, added, edited and removed one at a time, no cap (the sheet's six rows are paper's limit)? | **As written** | |
| SQ7 | **A clock's segments**: 2 to 12, 4 by default (every Expansion clock is 4)? Or fixed choices (4, 6, 8)? | **2 to 12, default 4** | |
| SQ8 | **A full clock**: shows *Full* and its *When it fills* text, highlighted; the GM empties it with − or edits it. No reset rule, no auto-advance (the Expansion's resets differ per clock)? | **As written** | |
| SQ9 | **Where factions live:** a third City view, **Factions**, between *The crew's places* and *The city*? Or a fourth table tab? | **A City view** | |
| SQ10 | **Removing a faction** removes its clocks: it asks, names the count (*and its 2 clocks*), and one undo restores all of it? Or the clocks stay, orphaned and hidden? | **They go with it** | |
| SQ11 | **A member's page** shows *Key to Eclipse, the Volkov Group* (links, read from the factions) under their affiliations? Or nothing on the member's page? | **Shown** | |

## 5. The assumption sweep

Every reader below was found by grep on `d9eed51`. The three questions
(which guards read it; where it renders; what text points at it) are
answered in the last column.

| What changes | Today, where | After | Readers and twins |
|---|---|---|---|
| A table's records | `newTable` `engine.js:5803`; `TABLE_RECORDS` `:5948` | `factions: [], clocks: []` in both | `_tableCore`, `diffTable`, `_recName` (`:5959`), `tableActionLabel`, `_tableOpOk` (`:6086`): each reads the list. `_recName` gains `factions` → `factionTitle`, `clocks` → the clock's name or ✎ *a clock*. Two smoke tests pin the exported key list (§13) |
| The gate | `migrateTable` `:5816`; the 0.14 step `:5890` | an N step; `_faction` and `_clock` gate each record, after `cast` (a key NPC's link is kept even with no member, 178) | `tableCheck`: unchanged. `undoTableAction` re-gates (`:6063`). Hostile tests: §10 |
| A cast link on a faction | `_castLinks` `:5676`, used by lines | `keyNpcs` through `_castLinks` | `removeCastMember` `:6217`: **writes the name into `keyNpcs` too, under the same `name.trim()` rule.** `linkName`'s cast branch reads it unchanged |
| A clock's owner link | none (`linkName` sends `{kind:"faction"}` to the cast branch, probe) | `on: null \| { kind:"faction", id:"FA-…" }` | Read only by `clocksOn` and the faction's page; **`linkName` doesn't learn it** (a clock never outlives its owner, N+1). `removeFaction` removes the clocks |
| Affiliations | `castFilter` `:6236`, `castAffiliations` `:6247`, `_castFields` `:6729` | unchanged; `factionAffiliated(t, id)` reads them | The Cast tab's Affiliation filter and Find: unchanged |
| The gazetteer's buttons | `gazEntryHtml` `gm.js:1127` (Add/Open only for `PLACE_FROM_KINDS`) | a `faction` or `power` entry gets **Add to the crew's factions** or **Open** | `Engine.FACTION_FROM_KINDS` (new, exported, as `PLACE_FROM_KINDS` is). The S6 smoke test *"a Faction can't be added"* (`smoke-table-city.test.mjs:70`, `[data-gadd]` on Eclipse) **stays true**: the faction's button is a different attribute (`data-gfadd`) |
| The City views | `CITY_VIEWS` `gm.js:1110`; `cityTabHtml` `:1153`; `bindCity` `:1233` | three: places, factions, city | `smoke-table-city.test.mjs:50` (opens on places) and `hostile.test.mjs:1208–1210` click by `data-cityview` id, unaffected. `keepPlace`'s selectors (`gm.js:332`) gain the faction quick-add field |
| A member opened from a City page | `S.backPlace` at the 14 sites (pre-flight) | **`S.backCity: null \| { kind:"place"\|"faction", id }`** at the same sites | Every site, by grep for `backPlace`, none left after. `routeTitle` (`:795`) and the encounter Back (`:2625`) restore it |
| Find | `tableSearch` `:6775`; `FIND_KINDS` `gm.js:413`; `openFound` `:442` | `faction` and `clock` kinds, after places | `_factionFields`, `_clockFields`. A clock hit opens its owner's page on that clock |
| A member's page | `castPageHtml` `gm.js:737` | ✎ *Key to …* (SQ11) | Read from `factionsKeyFor(t, castId)`; links open the faction, Back returns to the member |
| Text that points at this | plan §4b, §4c, §4f, §6 S7, §6's *Still to build* row; STATE; `gm-mode/README.md` | S7 built; §4f's *Clocks* line gains *as built* | Grep the docs for *S7* and *clock* |

## 6. Read first

- `CLAUDE.md` whole: constraints 1, 6, 7, 8 and 10; *Decisions*; *Change
  tiers*; *Versions* (the table schema; why the game data doesn't move).
- `docs/STATE.md` whole.
- `docs/SCHEMA.md` §3 (*The table file*: places, links); §4, Decisions
  **177**, **178**, **179**, **203**, **204**, **208**, **212**, **242**,
  **243**.
- `docs/VOICE-APP.md`: controls are tool voice.
- `private/crb/2644_Faction_Tracker.md`, `2410_Factions_and_City.md`, and
  the clocks in `Threat_Codex_Site_Profiles.md` and
  `APPROVED_Threat_Codex_Expansion.md:114–132`. Never edited.
- **The code:** `engine.js`'s `newTable`, `migrateTable`, `_castLinks`,
  `_place` (the record to copy), `addPlace`/`editPlace`/`removePlace`,
  `placeTitle`, `placeList`, `removeCastMember`, `linkName`,
  `TABLE_RECORDS` and its readers, `tableSearch`, `_placeFields`,
  `castFilter`, `_fold`; `gm.js`'s `CITY_VIEWS`, `cityTabHtml`, `bindCity`,
  `gazEntryHtml`, `placePageHtml`, `bindPlacePage`, `placeBack`, every
  `backPlace` site, `castPageHtml`, `bindCastPage`, `FIND_KINDS`,
  `openFound`, `askFirst`.

## 7. Out of scope

- **Clocks anywhere but a faction**: an encounter's (S10f), a job's (S11), a
  site's (S12b), and a clock on Next session (204's trigger). The record
  allows other owners later; the UI shows clocks only on a faction's page.
- **A clock that advances itself**, a reset rule, or a roll.
- **A faction's place** (243's trigger), a faction on a line or an
  encounter, or a faction's own log. Its history is the GM's notes.
- **Converting affiliations** to links (SQ5's default), or changing the
  Cast tab's Affiliation filter.
- **The journal's *Faction and city impact*** part: stays text.
- **The player sheet.** Nothing a player sees changes.
- **Any change to `private/`**, including the book slip, which is listed in
  `crb-catch-up.md`.

## 8. The shapes

**A faction** (`table.factions`, schema N):

```js
{ id: "FA-XXXXXXXX",
  name: "",                        // the GM's; blank reads the entry's name
  from: null | { kind: "gazetteer", id: "eclipse", name: "Eclipse" },   // a faction or power entry
  type: null | "gang" | "corp" | "government" | "cult" | "collective" | "other",
  territory: null | "central-city",  // a gazetteer territory id
  base: "",                          // typed: the worksheet's "Base of Operations"
  keyNpcs: [ { kind: "cast", id: "C-…", name?: "" } ],
  wants: "", reach: "",
  tippingFor: [ "" ], tippingAgainst: [ "" ],
  stance: null | -2 | -1 | 0 | 1 | 2,          // Hostile … Allied (SQ1)
  attention: null | "neutral" | "aware" | "active",   // 2410 (SQ2)
  notes: "", created, updated }
```

**A clock** (`table.clocks`, schema N):

```js
{ id: "CK-XXXXXXXX",
  name: "", segments: 4, filled: 0,
  advances: "",                   // "What advances it"
  whenFull: "",                   // "When it fills"
  on: null | { kind: "faction", id: "FA-…" },
  created, updated }
```

- **Frozen ids** (constraint 6): `FACTION_TYPES = ["gang", "corp",
  "government", "cult", "collective", "other"]`, `FACTION_ATTENTION =
  ["neutral", "aware", "active"]` and the stance's `-2…2` are written to
  files. Their labels live in `gm.js` and may change; the ids never do. A
  test pins each list as a literal (§10).

**The gate** (`migrateTable`, after `cast` and `places`):

- `factions` / `clocks`: not an array → `[]`; non-objects dropped.
- `_faction(f, used)`: a bad or repeated id becomes a new one; `name`,
  `base`, `wants`, `reach`, `notes` are strings; `from` as `_gazFrom` (242's
  gate, reused); `type` and `attention` kept only if in their list, else
  null; `territory` through `_gazId` (an id this data doesn't have is kept,
  243's rule); `keyNpcs` through `_castLinks`; `tippingFor` and
  `tippingAgainst` through `_strList` (strings only; blanks kept, since a
  blank row is one the GM is typing); `stance` an integer −2…2, else null.
  Stamps through `_isoOrNull`. Unknown keys ride along.
- `_clock(c, used)`: id as above (`CK-`); `name`, `advances`, `whenFull`
  strings; `segments` an integer 2…12, else 4; `filled` an integer clamped
  to 0…`segments`, else 0; `on` kept only as `{ kind:"faction", id }` with
  an `FA-` id (a link to no faction on the table is kept, and shown
  nowhere), else null. Stamps.
- **The N step** (`typeof arrived!=="string" || _versionNewer("0.15",
  arrived)`): `factions` → `[]` and `clocks` → `[]` if not arrays. Nothing
  is converted.

**Engine** (each is total: bad input gives a value, never a throw):

| Function | Does | On bad input |
|---|---|---|
| `addFaction(t, f)` | `f.from` a gazetteer id of a `FACTION_FROM_KINDS` kind (`["faction", "power"]`, SQ3): `from` set, `territory` from the entry (a power's is null). Otherwise the fields as given, through the gate's rules. Unshifts, stamps | `{ ok:false, why }` only for an unknown `from` |
| `editFaction(t, id, f)` | name, type, territory, base, wants, reach, stance, attention, notes; `keyNpcs` only a cast id on the table (`{ addKey }`, `{ removeKey }`); `tippingFor` / `tippingAgainst` as whole lists | `{ ok:false, why }` for no such faction, or a key NPC not in the cast |
| `removeFaction(t, id)` | removes it and every clock whose `on` names it | as `removePlace` |
| `factionTitle(t, f)` | the typed name, else the entry's (live), else `from.name`, else ✎ *Unnamed faction* | never throws |
| `factionList(t, f)` | the factions by title, `f.q` as Find's words | `[]` |
| `factionsKeyFor(t, castId)` | the factions listing that member as a key NPC, by title | `[]` |
| `factionAffiliated(t, id)` | the cast whose affiliations, folded (187), equal the faction's title folded, not already key NPCs, by name | `[]` |
| `addClock(t, f)` | `f.on` a faction on the table, else refused. Segments and filled through the gate's rules | `{ ok:false, why }` |
| `editClock(t, id, f)` | name, segments (filled clamped to it), filled (clamped), advances, whenFull | `{ ok:false, why }` for no such clock |
| `removeClock(t, id)` | splices | as `removePlace` |
| `clocksOn(t, link)` | the clocks owned by that link, oldest first | `[]` |
| `removeCastMember` | also writes the name into every faction's `keyNpcs` link to them (same `name.trim()` rule) | as today |
| `tableSearch` | `faction` (after places): *Name*, *Type*, *Territory*, *Base*, *Key NPC*, *Wants*, *Reach*, *For the crew*, *Against the crew*, *Notes*; then `clock`: *Clock* (its name), *Advances*, *When full*, titled by the clock's name, carrying its owner's id | as today |

`TABLE_RECORDS` gains `"factions"` and `"clocks"`, after `"places"`.
`_recName("factions", r)` is `factionTitle`; `_recName("clocks", r)` is the
clock's name or ✎ *a clock*. 212's label rule then reads *Added Eclipse*,
*Changed Eclipse notices the crew* (a + press), *Removed Eclipse* (one entry
covers its clocks).

## 9. The UI

All in `gm.js` and the CSS. Tool voice; ✎ marks text for a voice pass.
Every control a tap, 44px (plan §1a).

**The City tab** (SQ9): three views, *The crew's places*, ✎ **Factions**,
*The city*. The toggle wraps at 390px.

- **Factions**: quick-add (a name, Enter or **Add**), a search, the list by
  title. A card shows the title, then *Gang · Central City* (type and
  Territory, each if set), the stance's word if it's at an end or the
  middle, and ✎ *2 clocks · 1 full* when it has any. Empty: ✎ *No factions
  yet. Add one, or find it in The city.*
- **The city**: every `faction` and `power` entry gets ✎ **Add to the
  crew's factions** (`data-gfadd`), or **Open** (`data-gfopen`) when the
  table already has a faction from it. Each carries an `aria-label` naming
  the entry, as S6's place buttons do. A place entry is unchanged.

**A faction's page** (saved as typed, no draft, as a place's page):
**Back**, the title (`h1`), then **Name** (placeholder: the entry's name),
**Type** (six toggles, one or none), **Territory** (a select: none, then the
six), **Base** (typed), **Key NPCs** (each a link to the member with
**Remove**; then a select ✎ *Add a key NPC*: the cast by name, those
already listed left out), **What they want**, **Resources & reach**,
✎ **Tipping points**: *For the crew* and *Against the crew*, each a list of
typed lines with **Remove**, and ✎ **Add a line** under each, **Stance**
(SQ1: five toggles, *Hostile*, two unlabelled, *Neutral*, two unlabelled,
*Allied*; tap the pressed one to clear; `aria-label`s ✎ *Hostile*, *One step
toward Hostile*, *Neutral*, *One step toward Allied*, *Allied*),
**Attention** (three toggles, *Neutral*, *Aware*, *Active*, one or none),
**Notes**. When it came from the book: the entry's summary under ✎ *From
the book*. ✎ **Tied by affiliation** (SQ5, read-only links, shown only when
there are any). ✎ **Clocks** (below). **Delete** (asks, danger: ✎ *Delete
Eclipse?* / *Its page goes with it, and its 2 clocks. Key NPCs stay in the
cast.*).

**A clock** (on its faction's page, oldest first): its name (`h3`), the
segments drawn as boxes, filled ones solid, with a text equivalent ✎ *1 of
4*, then **−** and **+** (44px each; − disabled at 0, + disabled when full).
A full clock shows ✎ **Full** and its *When it fills* text, emphasised.
**Edit** opens its fields in place: **Name**, **Segments** (a number, 2–12),
✎ **What advances it**, ✎ **When it fills**, then **Delete** and **Done**.
Under the list, ✎ **Add a clock** opens a new one's fields, named ✎ *New
clock*, 4 segments, focused on Name.

**A member's page** (SQ11): under their affiliations, ✎ *Key to* and each
faction as a link (`data-fopen`), shown only when there are any.

**Where things land:**

| Press | The record | The view | Focus |
|---|---|---|---|
| **Add** (Factions) | a faction | the list redraws | the quick-add field (as places') |
| A faction's card | — | its page | its `h1` |
| **Add to the crew's factions** (The city) | a faction, `from` set | stays on The city; the button turns to **Open** | that **Open** |
| **Open** (The city) | — | that faction's page | its `h1` |
| A field, toggle or select on a faction's page | edited (212 folds typing) | no redraw while typing; a toggle redraws only its group | stays |
| **Add a key NPC** (select) | link added | the Key NPCs list redraws; the select drops that member | the select |
| **Remove** on a key NPC | link removed | the list redraws | the select |
| **Add a line** / **Remove** on a tipping point | the list changes | that list redraws | the new line's field / the next line's field, else **Add a line** |
| **+** / **−** on a clock | `filled` ±1 | that clock's boxes, text and buttons update in place | stays on the pressed button (or the other one, if it just disabled) |
| **Add a clock** | a clock, on this faction | its fields open | its Name |
| **Done** on a clock | — | its fields close | its **Edit** |
| **Delete** on a clock | removed (no ask: undo covers it, as a line's Delete) | the Clocks list redraws | **Add a clock** |
| **Delete** on a faction's page | asks, then removed with its clocks | Factions | the quick-add field |
| **Back** on a faction's page | — | where it was opened from: Factions, The city (with its search), a member's page, or Find's Factions (as a place found by Find) | the card, the **Open**, or the link it came from; else that page's heading |
| A key NPC or *Tied by affiliation* member | — | their page; their Back returns to the faction's page (`S.backCity`) | as today |
| *Key to* on a member's page | — | that faction's page; its Back returns to the member, on that link | its `h1` |
| A Find hit on a faction | — | its page | its `h1` |
| A Find hit on a clock | — | its owner's page, scrolled to the clock | the clock's name (`h3`, `tabindex=-1`) |
| The City tab's button | — | the view last shown, no faction or place open | as other tabs |

**State.** `S.factionOpen` and `S.factionRoute` beside S6's `S.placeOpen`
and `S.placeRoute`, cleared by the same presses (a tab press, Find, opening
from a list). **`S.backPlace` becomes `S.backCity`** (`null | { kind:
"place" | "faction", id }`) at every one of the pre-flight's 14 sites, so a
member opened from either page returns by one route. A place's behaviour
does not change: S6's smoke tests are the proof.

**At width:** the cards, a faction's fields, the toggles and a clock's
boxes stack or wrap at 390px; `overflow-wrap:anywhere` on every name, line
and text field. A 12-segment clock's boxes wrap, never scroll.

## 10. Worked examples, as named tests

Write these first. Show each failing on `main` for the reason it states (not
an `undefined`), and record the output in the PR. Those that pass on `main`
by design say so.

**`tests/engine.test.mjs`**, *The crew's factions (N)*:

- **`N: addFaction from a gazetteer faction or power takes its name and Territory; anything else is refused`**: Eclipse → `from.id` `eclipse`, territory `central-city`; *Covenant Medical* (a power) → territory null; `central-park` (a site) → refused; a typed one keeps what it's given.
- **`N: the type, stance and attention ids are frozen`**: `Engine.FACTION_TYPES`, `Engine.FACTION_ATTENTION` and the stance range pinned as literals; a type outside the list, a stance of 3 or 1.5, and an attention of `"hostile"` each gate to null.
- **`N: factionTitle reads the typed name, then the entry's, then the kept one, then Unnamed faction`.**
- **`N: a key NPC is a cast link; removing the member keeps their name, and undo restores the link`**: `linkName` → *Bob*, `gone:true` after `removeCastMember`; a member with a blank name leaves no name (`removeCastMember`'s rule) and reads *Someone removed*; recorded and undone through 212, deep-equal (`undoBase`).
- **`N: Tied by affiliation reads the cast, folded, and stores nothing`**: a member with affiliation *ECLIPSE* and one with *Eclipse’s* (curly apostrophe, a different word) → only the first; a key NPC isn't listed twice; the faction record is unchanged after the read (deep-equal).
- **`N: Find finds a faction by any field`**: *ncpd* (a tipping point) → *Against the crew*; *Bob* → *Key NPC*; *gang* → *Type*.
- **`N: the gate types factions and converts nothing`**: junk records dropped, ids remade, a `__proto__` id, an array `keyNpcs` entry, a numeric `wants`, a `from` of kind `place` → null. A 0.14 table loads with `factions: []` and `clocks: []`, and every member's `affiliations` are untouched. `newTable()` → `addFaction` → `migrateTable` round-trips (constraint 8).

*Clocks (N+1)*:

- **`N+1: a clock's segments are 2 to 12 and filled stays inside them`**: segments 1 → 4, 13 → 4, `"6"` → 6 (the gate's `_int`); filled −1 → 0, 9 of 4 → 4; `editClock` to 3 segments with 4 filled → filled 3.
- **`N+1: a clock is owned by a faction; removing the faction removes its clocks, and one undo restores both`**: deep-equal (`undoBase`); the activity log has one entry, *Removed Eclipse*.
- **`N+1: addClock refuses an owner that isn't a faction on the table`.**
- **`N+1: Find finds a clock by its words and gives its owner`**: *sends someone* → the clock, *When full*, with the faction's id.
- **`N+1: the activity log names a clock`**: a + press reads *Changed Eclipse notices the crew*; a crafted op on `clocks` in a file is gated like any other record's.
- **Version pins:** every `tableSchemaVersion` `"0.14"` assertion moves to `"0.15"` (17 in `engine.test.mjs`, the *newer app* fixture at `:7369` included; 2 in `hostile`; 6 in `smoke-table-cast`; 2 in `smoke-table-play`). **Not** `engine.test.mjs:2835` or `smoke-wizard.test.mjs:640`: those are a character's `schemaVersion`.

**`tests/smoke-table-factions.test.mjs`** (new; its helpers are its own),
switched on, each reading what is drawn:

- **`N: the City tab's views are The crew's places, Factions, The city`.**
- **`N: The city's Eclipse adds to the crew's factions and turns to Open`**: focused on **Open**; the button's `aria-label` names Eclipse; Central Park's place button is unchanged.
- **`N: a faction's page saves as typed`**: fire `input` and then `change` on Name, Base, What they want and a tipping point: one Activity entry each, no toast while typing (S15's lesson).
- **`N: Stance and Attention toggle one or none`**: tapping the pressed one clears it; `aria-pressed` follows; the five stance buttons' accessible names.
- **`N: a key NPC opens the member, and their Back returns to the faction on the link`**: then *Key to Eclipse* on the member's page opens the faction, and Back returns to the member on that link.
- **`N: removing a key NPC's member strikes their name on the faction's page`.**
- **`N+1: + and − move a clock in place, keep focus, and a full clock says what happens`**: 4 presses of + → *4 of 4*, ✎ *Full*, the *When it fills* text, + disabled and focus on −.
- **`N+1: deleting a faction asks with its clock count, and Undo from Activity restores both`.**
- **`N: Find opens a faction on its heading, and a clock on its name`.**
- **`N: a place's Back still works after backPlace became backCity`**: a member opened from Met here returns to the place's page on the link (S6's route, re-run here as the guard for the rename).

**`tests/hostile.test.mjs`:** a table whose factions carry `<img onerror>` in
every text field, every tipping point and as a kept `from.name` and key-NPC
name; a `__proto__` gazetteer id; an array `type`; clocks with `<img>` in
name, advances and whenFull, `segments: "1e9"`, `filled: {}`, and an `on`
that is an array. Rendered as text on the Factions list, a faction's page,
its clocks, a member's *Key to* and Find; no `img` in the page;
`Object.prototype` untouched; the 2 version pins move.

## 11. Tests beyond the examples

- **Totality:** every new reader on `null`, `{}`, a table whose `factions`
  and `clocks` are `"x"`, and records whose fields are numbers.
- **Voice:** every ✎ string through `tests/voice.test.mjs`.
- **The data guard** (135): no data key is added, so nothing to pass.
- **Mutation-test** each (record each in the PR with what caught it). Check
  each for a second path first, and run each mutant narrowly
  (`node --test --test-name-pattern="…" tests/<file>` under a `timeout`):
  1. `TABLE_RECORDS` without `clocks` → *the activity log names a clock*.
  2. `removeCastMember` not writing into `keyNpcs` → *a key NPC is a cast
     link…*.
  3. `removeFaction` leaving its clocks → *a clock is owned by a faction…*.
  4. The gate keeping a stance of 3 → *the type, stance and attention ids
     are frozen*.
  5. `editClock` not clamping `filled` → *a clock's segments are 2 to 12…*.
  6. `tableSearch` without clocks → *Find finds a clock…*.
  7. One `backPlace` site left unrenamed (the `bindCastPage` Back, `gm.js`
     `:1078`) → the smoke *a place's Back still works…*.
  8. + not keeping focus when it disables → the smoke *+ and − move a
     clock…*.

## 12. Steps

`git submodule update --init private`; `npm run test:fast` before starting
(a fresh branch from `main`); the targeted files after each step.

1. Take the two decision numbers and the table schema version: the lowest
   free on `origin/main`. Search the ledger again for the pre-flight's names.
2. **The shape:** the N step, `_faction`, `_clock`, the frozen lists,
   `TABLE_RECORDS` and `_recName`. The version pins. Engine tests.
3. **The writers and readers:** §8's table; `removeCastMember`;
   `tableSearch`.
4. **`S.backPlace` → `S.backCity`** at every site, alone, with S6's smoke
   tests green before anything else in the UI moves.
5. **The Factions view** and a faction's page; The city's buttons; a
   member's *Key to*.
6. **Clocks** on a faction's page.
7. **Find**; **hostile** test; CSS at 390px.
8. **In the browser** (`shadows-dev-preview`, `?gm=on`):
   - The city: add Eclipse and a power (Covenant Medical); add one typed.
   - A faction's page: every field, both toggle groups, two tipping points
     each side, two key NPCs (one from Who knows what's cast), *Tied by
     affiliation* with a member whose affiliation is *Eclipse*.
   - A clock: + to full, − back, edit to 6 segments, a second clock, delete
     one.
   - Remove a key NPC's member; Undo from Activity. Delete the faction;
     Undo.
   - Find a faction by a tipping point and a clock by its *When it fills*.
   - Every Back route in §9's table, and a place's Met here → member → Back.
   - **390px**, **768 × 1024** and **1300px**; `npm run phone-check`.
   - **Both themes:** a clock's boxes (filled and empty) and a full clock's
     emphasis are new. Measure their contrast against the page with
     `data-theme="light"` and without. **Report it if** any text is under
     4.5:1 or a box's edge under 3:1.
9. The mutations (§11).
10. Ledger (N, N+1; 178, 208 and 212 marked), INDEX, SCHEMA §3 (`factions`,
    `clocks`, schema N), the plan (§4c and §4f's *as built*, S7's row, S10f
    and S12b's *waits on S7*), STATE, `crb-catch-up.md` (the stance slip,
    under 2400/2600), docs, close-out (§14).

## 13. Stop and ask

- 0.15 is taken, or the ledger search finds a decision these override that
  the pre-flight doesn't name.
- The book's worksheet or `2410` don't read as the pre-flight quotes them.
- Any field needs a value the book doesn't give (a type for a gazetteer
  faction, a default stance): **don't guess one** (203).
- A test needs an exception for one record, entry or string (S6's carry-over).
- A clock needs to advance, reset or appear anywhere but a faction's page.
- `S.backPlace`'s rename changes any S6 behaviour (an S6 smoke test fails
  for a reason other than the attribute or state name).
- An existing test needs a change beyond: the version pins; the two
  exported key lists (`smoke-table-cast.test.mjs:1102`, `:1270`, which gain
  `clocks` and `factions`); and any test that reads `S.backPlace` by name.
- Undo's round trip of a faction's removal isn't deep-equal.
- The voice test flags any new copy, or a decision goes over 350 words.
- **Not a stop:** the version literals 0.15 moves; the two key lists;
  `engine.test.mjs`'s *"208: a search over 200 members and 100 sessions is
  quick"* failing on timing while the dev preview runs, if it passes run
  alone; phone-check's two OVER rows on the player sheet's HP pill (they
  fail on `d9eed51`).

## 14. Close-out

*Rule or shape* tier, switched off, table schema N:

- **SCHEMA:** N and N+1; the marks on 178, 208 and 212; §3 gains `factions`
  and `clocks`, with N's line.
- **INDEX:** N and N+1 under **GM mode**; the three lines marked.
- **STATE:** the versions line (table schema N); §1's GM mode line *built
  through S7*; §3's GM mode row and §5's *Next*. Inside the word and
  line-length guard.
- **The plan:** S7's row moves from *Still to build* to *Built* (Decisions
  N, N+1); S10f's and S12b's rows lose *waits on S7*; §4f's *Clocks* line
  gains *as built*.
- **`crb-catch-up.md`:** the stance slip (`2644`'s Hostile↔Allied line and
  `2410`'s Neutral/Aware/Active never mention each other).
- **`changelog-pending.md`:** ✎ *Factions on the City tab: the book's
  Faction Tracker for each one the crew deals with, with clocks to count
  down what they do next.*
- **Log** entry: why the record is the worksheet and nothing derived, why
  clocks are one record with an owner, and the `backCity` rename. **Shipped**
  row *(switched off)*. README's table: S7's row.
- **PR** titled `feat(gm): factions and clocks, switched off (S7,
  Decisions N and N+1)`. Body sections: what changed; *Evidence* (every
  claim names its command or test; the §10 tests failing on `main`; each
  mutation; each changed existing test, by name, with what changed); the
  browser check; *Voice pass* (every ✎ string, for Ken through the
  conductor, each checked against §9's copy rules first); **Where the order
  didn't fit**.

**Review checklist:**

- [ ] **Every answer Ken recorded** (SQ0–SQ11 in this order, and any PR
      comment in his words) **is in the code**, checked one by one.
- [ ] **In the browser, by the reviewer** (§12's step 8, by clicking): The
      city's Add; a faction's page; key NPCs both ways; a clock to full and
      back; delete and Undo; Find; every Back route, including a place's.
- [ ] No `backPlace` left in `src/` (`grep -n backPlace src/` → nothing).
- [ ] The frozen lists are literals in a test, and the gate refuses
      anything outside them.
- [ ] A 0.14 file's members keep their affiliations, unconverted; a crafted
      faction, clock or link renders as text.
- [ ] Undo covers every faction and clock change, deep-equal.
- [ ] Only the named tests changed (§13's list); no test has a one-entry
      exception; every smoke test reads what's drawn.
- [ ] 390px: nothing scrolls sideways; every control 44px; a 12-segment
      clock wraps.
- [ ] 178, 208 and 212 marked; table schema N everywhere it's written; no
      game-data bump.
- [ ] Two mutations re-run locally.
- [ ] Every "report it if" has an answer in the PR (the contrast numbers),
      and *Where the order didn't fit* is there, empty or not.
- [ ] The final `npm run verify` is on the PR's final commit.

## 15. Handing it over

The conductor starts **S7 build** (Sonnet) with the building prompt in
`docs/WORK-ORDERS.md` and this order's path,
`docs/plans/gm-mode/S7-factions-clocks.md`, and **S7 review** (Opus) once
the PR is open. The traps, under the builder's prompt:

- **`TABLE_RECORDS` is the activity log's whole idea of a table.** Miss a
  record and its changes are invisible to undo, and a file's op on it is
  refused (the pre-flight's probe).
- **`removeCastMember` is a reader of key NPCs.** It writes names into
  lines and encounter rows today; a faction's links are a third place.
- **Rename `backPlace` first, alone, and keep S6 green** before building the
  faction's page on top of it.
- **Store inputs, compute nothing** (constraint 7): no standing, no score,
  no *Tied by affiliation* list on the record. Read it every time.
- **Guess nothing** (203): no type, stance or attention from the gazetteer,
  and no affiliation turned into a link.
- **Frozen ids:** the type, attention and stance values are written to
  files. Pin them as literals in a test from the first commit.
- **No one-entry exceptions.** If a rule and a record collide, stop and
  ask; the conductor takes it to Ken.
- **Fire `change` as well as `input`** on every field a faction's page and
  a clock bind.
- **Smoke tests read what's drawn**, never `S.table` in place of the page,
  and they live in `tests/smoke-table-factions.test.mjs`.
- **Numbers aren't reserved:** take the next free decision numbers and the
  table schema version when you write them.
- **Ken's answers land in the order or as PR comments.** Re-read both before
  each push.
- **Preview by clicking**, both themes and three widths, and answer every
  "Report it if" in the PR.
- **Verify last.** The final `npm run verify` runs on the commit the PR ends on.
