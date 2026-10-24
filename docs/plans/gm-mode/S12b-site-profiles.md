# Work order S12b — Site Profiles

**Plan:** [`../gm-mode.md`](../gm-mode.md) §4f (*Clocks are one primitive*,
as built), §6 *S12* and *Still to build*'s S12b row; the Expansion row of
§2's sources table. Decisions 167, 173, 178, 180, 182, 183, 186, 208, 212,
242, 243, 245.
**Status:** **drafted 2026-10-24 by Claude (Opus)**, the S7 reviewer, after
#240 (S7, Decisions 244–245) merged (`WORK-ORDERS.md`, step 7). **Ken chose
this session (2026-10-24).** Not yet approved.
**Branch:** from `main` at `6661383` or later, PR to `main`, switched off
(Decision 173). **Plus one commit in `private/`** (the pack builder and the
pack, Decision 186), whose pointer the PR bumps.
**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md):
a conductor (Opus) starts **S12b build** (Sonnet), then a fresh **S12b
review** (Opus) once the PR is open. Builder and reviewer message each
other directly; anything for Ken goes to the conductor. §15 is the hand-over.
**Runs alone.** It touches `engine.js` (the pack gate, a place, the clock
gate and its readers, Find, the activity log's label), `gm.js` (a place's
page, the shared clock code, Find), the CSS, `private/gm/` (the builder, the
id ledger, the pack), the ledger and STATE.
**Table schema N, pack schema N** (0.16 and 0.3 if still free when you build:
`main` is 0.15 and 0.2 at `6661383`). Two decisions, **N** and **N+1** below.

**Tier: Rule or shape, not Content.** The plan's row says Content, written
when the plan expected S8 and S9's shapes to hold Site Profiles as they are.
They don't. The pre-flight found four shape changes:
- **a pack section** (`sites`, pack schema N: Decision 180 needs a
  `migratePack()` step);
- **three fields on a place** (table schema N);
- **a clock's owner is a place**, a new `on` kind (Decision 245's gate keeps
  only `faction`);
- **removing a place removes its clocks** (243 and 245 in part).

Decision 243's **Revisit if** (*"S12b's Site Profiles want a place's own
track"*) has happened.

**Read this first: the source isn't approved.** The plan's row says *"the
Expansion is approved"*, and it is: the format, the five categories and the
rules for clocks, Marks and who changes (`APPROVED_Threat_Codex_Expansion.md`).
**The fifteen profiles aren't.** `private/crb/README.md:86` lists
`Threat_Codex_Site_Profiles.md` as *"Scott's Site Profiles, 2026-10-03,
**not approved**"*, and its own line 9 says *"Draft for team review; nothing
here is approved."* The one approved profile is the pilot's *The Long
Stretch* (`APPROVED_Threat_Codex_Pilot_Entries.md`, slides 29–30), which
matches the draft's TP1 except that it has no *Ways In* or *Layering*. **SQ0
asks Ken what to build from.** The default builds from the draft, because:
- GM mode ships off;
- the pack is private and rebuilt by script whenever the source moves;
- ids are keyed by name and kept (186), so a revised profile keeps its id.

It is Ken's call, and probably Scott's.

**Carried over from S7's review** (#240, one fix round). Each is marked as
the order's or the build's:

- **The order's: Segments had no rule for a refused or empty value.** A
  blank or out-of-range number on leaving the field gated to 4 and cut
  `filled`. The fix (6cfe7ad) refuses it and puts the field back. **This
  order says what every field it adds shows when refused or empty** (§9,
  *Refused and empty*), per `WORK-ORDERS.md`.
- **The order's: S7's type labels had to live in the engine,** because Find
  reads them. **This order puts every label Find or a label rule reads in the
  engine from the start:** a track's level names come from the pack, and
  Find reads the stored copy of a profile's name.
- **The order's: it didn't say how a faction's removal collapses its clocks
  into one Activity entry.** The build skipped clocks whose owning faction
  went in the same patch. **This order generalises that to any owner**
  (§8), and names its test.
- **The order's: mutation 7 named a site the rename had removed.** This
  order's mutations name a function and a behaviour, not a line, and each
  says how to find its site (`grep`).
- **The build's: `memberRoute` didn't save `factionRoute`.** A page opened
  from a member's page has to keep the route of the page under it. This
  order adds no new route (the place's page already has one), but its review
  checklist re-runs the Key to and Met here round trips.
- **The build's: Decision 208's ledger mark was missing** (INDEX had it).
  `docs.test.mjs` checks the INDEX line, not the ledger mark. **Check every
  supersession mark in both places by hand** (§14).
- **Ken's answers on S7:** every SQ default. The voice pass
  (issuecomment-6386284094) kept *Add to the crew's factions* (five words)
  and *No factions yet. Add one, or find it in The city.* (two sentences),
  because they match S6's approved place lines. **A line that matches an
  approved S6 or S7 line cites it here rather than being trimmed**, and
  this order does so for its delete dialog (§9).

**Pre-flight** (`docs/WORK-ORDERS.md`, *The pre-flight*) against `main` at
**`6661383`**, 2026-10-24. Every function below was opened and read. The
line numbers are `6661383`'s.

- **No site profile anywhere in `src/`.** A place has `environment`, a
  gazetteer id from the five kinds of ground (`combat-zones`, `genius-loci`,
  `convergences`, `thin-places`, `gates`), set by a toggle on its page
  (`gm.js:1217`, `bindPlacePage` `:1341`). `_place` (`engine.js:5719`)
  gates it with `_gazId`.
- **Packs** (180–186): `migratePack` (`engine.js:7171`) builds known
  sections with `_packSection` and **keeps an unknown section untouched**.
  Probe: a pack with `sites: [{ id:"long-stretch", name:"The Long Stretch" }]`
  keeps it as given, and is stamped schema 0.2. `PACK_SCHEMA_VERSION`
  (`:7153`) is 0.2. A cast member's link to its entry is `from: { kind:"entry",
  pack, id, name }`, gated by `_castFrom` (`:5652`) and read by `entryLink`
  (`:7487`), which says `here:false` when the pack isn't slotted. **That is
  the link a place's profile copies.**
- **The pack builder** (`private/gm/build-codex-pack.mjs`, 654 lines, 186):
  `SECTIONS` (`:37`) lists six sections, `PACK_SCHEMA` (`:34`) is `"0.2"`,
  `PACK_NAME` (`:33`) is *Threat Codex (human origins)*. `ids.json` keys
  each id by the book's name, per section. It reads `2610`–`2617`, not the
  Site Profiles. **`tests/codexpack.test.mjs:493` pins pack schema 0.2.**
- **Clocks** (245):
  - `_clock` (`engine.js:5761`) keeps `on` only as `{ kind:"faction", id }`
    with an `FA-` id, so **any other kind becomes `null`**. Probe: a file
    whose clock has `on: { kind:"place", id:"PL-…" }` loads with
    `on: null`, and the clock is shown nowhere.
  - `addClock` (`:6748`) refuses any owner but a faction: probe →
    `{ ok:false, why:"No such faction." }`.
  - `clocksOn` (`:6778`) is already generic.
  - `tableActionLabel` (`:6048`) collapses only a removed **faction**'s
    clocks (`goneFactions`, `:6059`).
  - `tableSearch` (`:6992`) finds a clock only when its owner is a faction
    on the table (`:7018`). Probe: a place's clock *Drift* → `[]`.
  - `openFound`'s clock branch (`gm.js:462`) opens only a faction.
  - **The clock UI is local to `bindFactionPage`:** `clockHtml` and
    `clockBoxesHtml` are top-level (`gm.js:1419`, `:1438`), but `paintClock`,
    `bindClocks`, `redrawClocks` and the Add a clock press are inside it
    (`:1577–1621`). A place's page needs all of it, so the order lifts it
    (§9).
- **Places** (243):
  - `removePlace` (`engine.js:6594`) writes the place's name into its
    lines' links and **leaves its clocks**. Probe: one clock left, owner
    gone.
  - `_placeFields` (`:6604`) is Find's list.
  - `placeCardHtml` (`gm.js:1137`) draws a card's meta.
  - The delete dialog (`:1354`) reads *"Its page goes with it. Lines that
    named it keep its name, struck through."*
  - A place added from the gazetteer's *The Old Pike* gets Territory and
    Zone but **`environment: null`**: a gazetteer site entry doesn't carry
    its kind of ground (probe), so nothing links Old Pike to *Thin Places*.
  - A place's unknown keys (`site`, `exposure`) ride along through
    `migrateTable` today (probe).
- **The crew.** There is no crew roster on a table (seats are S3b). A line's
  `crew` is typed names (`_roleList`), and `crewView` (`:6471`) groups lines
  by them. Exposure is per character in the book, so a row is a typed name.
- **The book.**
  - `Threat_Codex_Site_Profiles.md` has fifteen profiles, three per
    category, under `**SITE XXn**` headings. Each has: Category and Canon
    example, a flavor line, **Presence**, **Rules**, **Ways In** (three),
    **Layering**, **Track**, **Clock**, **Who's already here**,
    **Resolution** and **GM Note**.
  - **Tracks come in four shapes:**
    - Combat Zones: *None*, with a sentence.
    - Genius Loci: *Disposition*, four levels (Welcome, Tolerant, Wary,
      Hostile), starting at Tolerant, with *What moves it*.
    - Convergences: *Amplification*, four levels (Calm, Charged, Surging,
      Overflowing), starting at Calm, with *What moves it*.
    - Thin Places: *Exposure*, per character: triggers, then steps at 3, 5
      and 8, then the Marks this site leaves.
    - Gates: a *What comes through* d6 table.
  - **Clocks:** eleven profiles have one, every one 4 segments. Four read
    *None* (*"The disposition is the clock"*, *"The Amplification track is
    the clock"*).
  - **Three clocks carry rules this app won't run** (SQ5):
    - *Lost* advances *"only while Hostile"*.
    - *Widening* resets: *"then reset to 1"*.
    - *Ceasefire* is *"counting down the truce"*.
  - **Who's already here** names supernatural entries by codes (*F6*,
    *B1*, *S1*) that no pack has until S12a. It stays text.
  - **Two ⚑ marks** (`:289`, `:373`; the legend at `:11`): *Overflow one x-tier higher*
    and *DeSync*. They are the draft's own flags against the core rules and
    are copied as text.
- **The ledger,** searched by name: *site*, *profile*, *track*, *exposure*,
  *disposition*, *amplification*, *environment*, *ground*, *place*,
  *clock*, *on*, *owner*, *pack*, *sections*, *migratePack*,
  *build-codex-pack*, *ids.json*, *removePlace*, *tableSearch*, *Find*,
  *TABLE_RECORDS*, *tableActionLabel*. Hits:
  - **167** (the Codex is private): **cited.** The profiles are Codex
    content, so they ship in the GM's pack, never in `shadows-data.js`.
  - **178** (links): **cited.** A place's profile link is a pack link, the
    cast's `from` shape (182), not a table link. Lines keep a removed
    place's name, unchanged.
  - **180** (a pack's schema needs a `migratePack()` step): **cited**,
    and followed.
  - **182** (Use copies an entry, keeping where it came from): **cited.**
    A profile's clock is copied onto the place the same way.
  - **183** (pack schema 0.2 adds fields): **cited.** N adds a section.
  - **186** (the builder and the id ledger): **superseded in part.** The
    builder also reads the Site Profiles, and the ledger gains `sites`.
  - **208** (Find): **superseded in part.** Find searches a place's profile
    and Exposure names, and finds a place's clocks.
  - **212** (the activity log): **cited.** No new record. A place's removal
    collapses its clocks into one entry, under 245's collapse.
  - **242** (the gazetteer): **cited.** Its kinds of ground are a profile's
    category ids.
  - **243** (places): **superseded in part** (its own Revisit if). A place
    carries a profile and its track, and removing one removes its clocks.
  - **245** (clocks): **superseded in part.** A place owns clocks. The gate
    keeps an owner of a kind this version doesn't know, rather than nulling
    it. Its **Revisit if** (*"a reset rule, or a clock that advances
    itself"*) is **not** triggered: SQ5 builds no reset.
  - **Since 245:** none.
- **Numbers:** the ledger ends at **245** and the table schema is **0.15**,
  the pack schema **0.2**. This order's steps are 0.16 and 0.3 if still free.

---

## 1. Goal

Scott preps a job on the Old Pike. On **City**, he opens the crew's place
*The Old Pike* and picks **Site profile → The Long Stretch**. The place's
kind of ground becomes *Thin Places*, and its page shows the profile:
- what anyone there feels;
- the rules and the ways in;
- the Exposure steps, and the Marks this site leaves;
- who's already here, the resolution and the GM note.

A clock appears under it, **Drift**, 0 of 4, with what advances it and what
happens when it fills.

Mid-session the crew stops to search a wrecked convoy. Deighton opens the
place from **Find** (*pike*), taps **Add someone** under Exposure, types
*Vex*, and taps + twice. Vex is at 2. After a rest Vex is at 4, past the
first step: the row reads *Disoriented every time they come back*. The
crew stalls for three rounds, and Drift reads 3 of 4.

**Done when:**

- Switched off: nothing changes anywhere.
- The Threat Codex pack carries the fifteen Site Profiles (SQ0) as a
  `sites` section, pack schema N, built by the private script with ids kept
  in `ids.json`.
- A crew's place can take one profile from the slotted packs. Its page shows
  the profile, read live, and the place stores only the link, its level or
  its Exposure rows.
- A profile's clock is copied onto the place. A place owns clocks like a
  faction does: added, moved, edited and removed in place.
- Removing a place asks, names its clocks, removes them, and undo restores
  all of it in one entry.
- Find finds a place by its profile's name and its Exposure names, and finds
  a place's clock and opens it.
- Undo covers every change.
- A crafted profile link, level, Exposure row or clock owner in a file can't
  throw or write outside its record, and renders as text. A pack's crafted
  site renders as text.
- At 390px nothing scrolls sideways; every control is 44px.
- `npm run verify` and `npm run phone-check` pass. phone-check's two known
  OVER rows, on the player sheet's HP pill, fail on `main` too.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (see the header).
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** **no bump** (68). Nothing is added to `shadows-data.js`.
- **Table schema:** **0.15 → N** (0.16), with a `migrateTable()` step: every
  place gains `site: null`, `siteLevel: null` and `exposure: []` if they're
  missing. Nothing is converted, and no profile is guessed from a place's
  kind of ground (203).
- **Pack schema:** **0.2 → N** (0.3), with a `migratePack()` step: `sites`
  is `[]` if not an array, then gated.
- **Character schema:** unchanged.
- **The Threat Codex pack's `contentVersion`** names the Site Profiles' source
  and date (SQ0).
- **Decisions:** the next two free numbers, **N** (the profiles in the pack)
  and **N+1** (a place's site, its track and its clocks).

## 3. The decisions, drafted

Paste after the last decision, under INDEX §3's **GM mode** heading, filling
**Built**. Each must stay under 350 words, Touches included (`wc -w`). Both
are worded for the defaults; a different answer to an SQ rewords them.

```
N. **The Threat Codex pack carries the Site Profiles: each a template with its presence, rules, track and clock, in the book's words; pack schema N.**
     *2026-10-XX · Ken + Claude · Touches: sites, pack schema N, migratePack, build-codex-pack, ids.json, SECTIONS, contentVersion, category, canon, presence, rules, waysIn, layering, track, levels, exposure steps, What comes through, clock, here, resolution, gmNote, Engine.siteProfiles, Engine.packSite, Decision 167, Decision 180, Decision 183, Decision 186*
     - **Decided:** A pack gains `sites`: each profile's fields as text, its category as a gazetteer kind of ground, its track as one of four shapes (none, levels with a start, Exposure steps, a table), and its clock as a name, segments, what advances it and when it fills, or none. The private builder reads `Threat_Codex_Site_Profiles.md`, keyed in `ids.json` like every other section. The app reads profiles; it never writes one.
     - **Why:** a Site Profile is Threat Codex content, which is the GM's and private (167); the pack is how Codex content reaches a table (180), and a template the GM drops onto a place is what a pack entry already is to a cast member (182).
     - **Rejected:**
       - Profiles in `shadows-data.js`: the Codex would be public.
       - Profiles typed by the GM on each place: the book wrote them as templates to reuse.
       - Each site's rules as code (a level's +1 die, a step's Condition): the app tracks, the GM rules.
     - **Replaces:** Decision 186 in part (the builder reads the Site Profiles, and the ledger keys `sites`).
     - **Revisit if:** Scott revises the profiles' format, S12a's entries make *Who's already here* links, or a second pack carries sites.
     - **Built:** pack schema N, switched off (173); log 2026-10-XX.

N+1. **A crew's place can take a Site Profile: it keeps the link, the track's level or each character's Exposure, and the profile's clock; a place owns clocks.**
     *2026-10-XX · Ken + Claude · Touches: places, site, siteLevel, exposure, setPlaceSite, placeSite, editPlace, removePlace, clocks, on, owner link, addClock, clocksOn, tableActionLabel, tableSearch, openFound, place page, Site profile, Exposure, clock UI, table schema N, Decision 178, Decision 182, Decision 208, Decision 212, Decision 243, Decision 245*
     - **Decided:** Table schema N gives a place `site` (a pack link, as a cast member's `from`), `siteLevel` (null is the profile's start) and `exposure` (typed names, each a count). Picking a profile sets the ground to its category and copies its clock onto the place. A clock's `on` may name a place; an owner of an unknown kind is kept. Removing a place removes its clocks; one undo restores them. The profile is read live and nothing it says is run.
     - **Why:** a level, a count and a clock are the only state a site has (243 waited for exactly this); the rest is the book's, read where it's kept.
     - **Rejected:**
       - Copying the profile onto the place: a revised pack would never reach it.
       - One crew-wide Exposure: the book counts it per character.
       - Running a site's rules (Disoriented at 3, Widening's reset): the GM decides, and resets differ per site.
       - Nulling an unknown owner (245's gate): a newer app's file would lose its owners.
     - **Replaces:** Decision 243 in part (a place has a site and owns clocks; its removal removes them), 245 in part (a place owns clocks; an unknown owner is kept), 208 in part (Find searches a place's site and Exposure, and its clocks).
     - **Revisit if:** seats (S3b) make the crew a roster, a site needs a reset rule or a clock that runs itself, or S10f's encounters want a site.
     - **Built:** table schema N, switched off (173); log 2026-10-XX.
```

**Supersession marks** (each ledger entry **and** its INDEX line, both by
hand: `docs.test.mjs` doesn't see a missing ledger mark):

- 186: *→ **Superseded in part by Decision N** — the builder reads the Site
  Profiles, and the ledger keys `sites`.*
- 208: *→ **Superseded in part by Decision N+1** — Find searches a place's
  site and Exposure, and its clocks.*
- 243: *→ **Superseded in part by Decision N+1** — a place takes a Site
  Profile and owns clocks; removing it removes them.*
- 245: *→ **Superseded in part by Decision N+1** — a place owns clocks, and
  an owner of an unknown kind is kept.*

If the ledger search at build time finds another, stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ0 | **What to build from.** The fifteen profiles are Scott's draft, *not approved* (`private/crb/README.md:86`); only the pilot's Long Stretch is. Build all fifteen from the draft (GM mode is off; the pack rebuilds when Scott revises it, ids kept by name), with `contentVersion` naming the draft? Build the shape and the Long Stretch only? Or hold S12b until Scott approves the profiles? | **All fifteen from the draft**, `contentVersion` *"Site Profiles draft 2026-10-03"*, and Scott told | |
| SQ1 | **Where profiles live:** in the Threat Codex pack (private, 167), as a `sites` section? The pack's name stays *Threat Codex (human origins)*, which is still true of its entries? | **In the pack; the name unchanged** | |
| SQ2 | **One profile a place**, picked from every slotted pack's sites (grouped by category). Picking one sets the place's kind of ground to the profile's category. A gazetteer site (Old Pike) never picks its profile for you (203)? | **As written** | |
| SQ3 | **What a place stores of a track.** *Disposition* and *Amplification*: the level the GM set, or none for the profile's start. *Exposure*: one row per character, a typed name and a count, with the step reached shown beside it. *What comes through*: the table, no roll. Or Exposure as one crew-wide count? | **As written; Exposure per character** | |
| SQ4 | **A profile's clock** is copied onto the place when it's picked: the GM's to edit, move or delete. Changing or clearing the profile leaves clocks alone, and clears the level and the Exposure rows (they were the old track's). | **As written** | |
| SQ5 | **The three clocks with a rule** (*Lost only while Hostile*, *Widening resets to 1*, *Ceasefire counts down*): copied as text, and the app runs none of it. The GM taps − to reset. | **As written** | |
| SQ6 | **Removing a place removes its clocks** (as a faction's do, 245), asks with the count, and one undo restores all of it. Lines keep its name (178). | **As written** | |
| SQ7 | **A place's page shows the whole profile** under its own heading (Presence, Rules, Ways in, Layering, the track, the clock, Who's already here, Resolution, GM note), read live. When its pack isn't slotted in, the page names the profile and says so, and keeps the level, the rows and the clocks. | **As written** | |
| SQ8 | **Where else profiles show.** Only on a place's page? Or also a **Sites** view on the Threats tab, to read them without a place? | **Only on a place's page** | |
| SQ9 | **Any place can own clocks**, with or without a profile (Add a clock on every place's page)? Or only a place with a profile? | **Any place** | |

## 5. The assumption sweep

Every reader below was found by grep on `6661383`. The three questions
(which guards read it; where it renders; what text points at it) are
answered in the last column.

| What changes | Today, where | After | Readers and twins |
|---|---|---|---|
| A pack's sections | `migratePack` `engine.js:7171`; `PACK_SCHEMA_VERSION` `:7153` | `sites`, gated (§8); schema N | `packCheck` (`:7228`): unchanged (a newer stamp still warns). `slotPack`'s notice (`gm.js:2201`) counts entries only: **unchanged** (out of scope). `tests/codexpack.test.mjs:493`, `engine.test.mjs:3953`, `:4121`, `hostile.test.mjs:434`, `packfixture.mjs:20` pin `"0.2"` (§13) |
| The builder | `build-codex-pack.mjs` `SECTIONS` `:37`, `PACK_SCHEMA` `:34`, its sources; `ids.json` | reads `Threat_Codex_Site_Profiles.md`, adds `sites`, schema N | `codexpack.test.mjs` (the builder's tests): new tests for `sites`; its ledger tests learn `sites`. `npm run codex-pack` |
| A place's fields | `_place` `engine.js:5719`; `addPlace` `:6561`; `editPlace` `:6581` | `site`, `siteLevel`, `exposure` (§8) | `_placeFields` (`:6604`, Find): gains *Site* and *Exposure*. `placeCardHtml` (`gm.js:1137`): the profile's name and the clock count. `placeTitle`: unchanged |
| A place's kind of ground | `bindPlacePage`'s toggle `gm.js:1341` | also set by picking a profile | The toggle stays and can still change it: a profile whose category no longer matches is kept, shown as picked (nothing guessed) |
| A clock's owner | `_clock` `engine.js:5761` (faction only); `addClock` `:6748` | a place too; an unknown kind kept (§8) | `clocksOn` (`:6778`): generic already. **`tableSearch`'s clock loop (`:7018`)**: learns places. **`openFound`'s clock branch (`gm.js:462`)**: opens a place's page on the clock. `factionCardHtml` (`gm.js:1376`): unchanged, and **its clock count becomes one shared helper with the place card's** (twins) |
| Removing an owner | `removeFaction` `:6697` removes its clocks; `removePlace` `:6594` doesn't | `removePlace` removes its clocks | **`tableActionLabel`'s collapse (`:6059`, `goneFactions`)**: generalised to any owner removed in the same patch (§8). The place's delete dialog (`gm.js:1354`) names the count |
| The clock UI | `clockHtml` `gm.js:1419`, `clockBoxesHtml` `:1438`; `paintClock`, `bindClocks`, `redrawClocks`, Add a clock inside `bindFactionPage` `:1577–1621` | one shared `clocksHtml(owner)` and `bindClocks(main, owner)`, used by both pages | The faction page's behaviour must not change: S7's smoke tests (`smoke-table-factions.test.mjs`) are the proof, run after the lift and before the place page uses it (§12 step 4) |
| Find | `tableSearch` `:6992`; `FIND_KINDS` `gm.js:413` | a place hit by its site's name or an Exposure name; a clock hit owned by a place | `FIND_KINDS`: unchanged (no new kind). The clock hit's `owner` stays the owner's id; it gains `ownerKind` |
| Text that points at this | plan §4f's *Clocks* line, §6 S12, S12b's row, the sources table's Expansion row; STATE; `gm-mode/README.md`; the place delete dialog | S12b built; the plan's row moved; §4f gains *on places*; the dialog names clocks | Grep the docs for *S12b*, *Site Profile* and *Drift* |

## 6. Read first

- `CLAUDE.md` whole: constraints 1, 6, 7, 8 and 10; *Decisions*; *Change
  tiers*; *Versions* (the table and pack schemas; why game data doesn't move).
- `docs/STATE.md` whole.
- `docs/SCHEMA.md` §3 (*The table file*: places, clocks; *The pack file*);
  §4, Decisions **167**, **178**, **180**, **182**, **183**, **186**,
  **243**, **245**.
- `docs/VOICE-APP.md`: controls are tool voice. **A profile's text is the
  book's and is never reworded.**
- `private/crb/Threat_Codex_Site_Profiles.md` whole;
  `APPROVED_Threat_Codex_Expansion.md:96–136`;
  `APPROVED_Threat_Codex_Pilot_Entries.md`, slides 29–30. Never edited.
- **The code:**
  - `engine.js`: `migratePack`, `_packSection`, `_castFrom`, `entryLink`,
    `_place`, `addPlace`, `editPlace`, `removePlace`, `_placeFields`,
    `_clock`, `addClock`, `clocksOn`, `removeFaction`, `tableActionLabel`,
    `tableSearch`.
  - `gm.js`: `placePageHtml`, `bindPlacePage`, `placeCardHtml`,
    `factionCardHtml`, `clockHtml`, the clock code inside `bindFactionPage`,
    `openFound`, `askFirst`, `packsMemo`.
  - `private/gm/build-codex-pack.mjs` whole, and `ids.json`'s shape.

## 7. Out of scope

- **Running a site:** no roll on *What comes through*, no Condition applied
  at an Exposure step, no level moved by what the crew does, no reset, no
  clock that advances itself, no Mark recorded on a character. The GM does
  all of it.
- **A Mark on the player sheet**, or a SAN check from one. The player sheet
  doesn't change.
- ***Who's already here* as links** to entries: they're S12a's, and no pack
  has them.
- **A site on an encounter** (S10f), or an environmental encounter run turn
  by turn.
- **A Sites view on the Threats tab** (SQ8's default), and a count of sites
  in `slotPack`'s notice.
- **The gazetteer's site entries** (Old Pike, the Abyssal Caverns) linking
  to a profile: the book names a canon example in a profile's text, and that
  stays text.
- **The Orders and the supernatural entries** (S12a).
- **Any change to `private/crb/`**. A slip goes to `crb-catch-up.md`.

## 8. The shapes

**A site in a pack** (`pack.sites`, pack schema N), as the builder writes it:

```js
{ id: "long-stretch",                 // the author's, from ids.json, keyed by name
  ref: "TP1",                          // the book's SITE code
  name: "The Long Stretch",
  category: "thin-places",             // a gazetteer kind of ground id (242)
  canon: "The Old Pike (Blue Ridge Corridor)",   // the book's Canon example, text ("Generic template" kept as written)
  flavor: "", presence: "", rules: "",
  waysIn: [ "" ],                      // three in the draft; the pilot has none
  layering: "",
  track: null                          // with trackText: the book's sentence ("None. The residents are the pressure.")
       | { kind: "levels", name: "Disposition", start: "tolerant",
           levels: [ { id: "welcome", name: "Welcome", text: "" }, … ], moves: "" }
       | { kind: "exposure", name: "Exposure", triggers: "",
           steps: [ { at: 3, text: "" }, { at: 5, text: "" }, { at: 8, text: "" } ], marks: "" }
       | { kind: "table", name: "What comes through", die: "d6",
           rows: [ { roll: "1–2", text: "" }, … ] },
  trackText: "",
  clock: null                          // with clockText: "None. The disposition is the clock."
       | { name: "Drift", segments: 4, advances: "", whenFull: "" },
  clockText: "",
  here: "", resolution: "", gmNote: "" }
```

- **The pack gate** (`migratePack`, the N step): `sites` not an array →
  `[]`. `_packSection` with `_recordId`. Every text field `_str`. `waysIn`
  through `_strList`. `category` a gazetteer kind-of-ground id, else null.
  `track`:
  - `kind` not one of the three → null.
  - A level is kept only with a `_recordId` id; `start` kept only if it
    names a kept level, else the first level's.
  - A step's `at` is a whole number from 1 to 99, else dropped; steps are
    sorted by `at`.
  - A row is a `roll` string and a `text` string.

  `clock`: null, or `segments` through 245's 2–12 rule (`_clockSegments`),
  and its text fields `_str`. **Unknown keys ride along.**
- **The builder** splits each profile by its bold field labels and its
  `TRACK — X` and `WHAT COMES THROUGH` headings, as it splits entries today.
  - **A clock's line** is split by the builder:
    - `name` is the text before `(`;
    - `segments` comes from `(N segments)`;
    - `whenFull` starts at *"When it fills"*;
    - `advances` is everything between, so *"counting down the truce"* and
      *"only while Hostile"* stay in it.
  - *"None. …"* → `clock: null`, `clockText`.
  - A level's id is its name, lowercased and hyphenated.
  - Ids come from `ids.json`'s new `sites` section, by name, as every
    section's do.
- **The builder's tests** (`tests/codexpack.test.mjs`) **read the mirror for
  their counts**, never this order's: the number of `**SITE ` headings, the
  number of `**Clock:**` lines that aren't `None`, and each category's
  three.

**A place** (`table.places`, table schema N) gains:

```js
  site: null | { kind: "site", pack: "PK-…", id: "long-stretch", name: "The Long Stretch" },  // name as it was when picked
  siteLevel: null | "wary",          // a levels track: the level the GM set; null is the profile's start
  exposure: [ { name: "Vex", n: 4 } ],   // an Exposure track: one row per character
```

- **The gate** (`_place`):
  - `site` is kept only as `{ kind:"site", pack, id }` with a `PK-` pack id
    and a `_recordId` id. `name` rides only as a string. Anything else is
    null.
  - `siteLevel` is a `_recordId` string or null. A level this pack lacks is
    kept, and §9 says how it shows.
  - `exposure` keeps objects only, each with `name` through `_str` and `n` a
    whole number clamped 0…99, else 0. A blank name is kept: it's a row
    being typed.
- **The clock gate** (`_clock`), replacing 245's owner rule:
  - `on` is kept as `{ kind:"faction", id }` with an `FA-` id, or
    `{ kind:"place", id }` with a `PL-` id.
  - An `on` whose `kind` is lowercase letters this version doesn't know,
    with a string id of at most 40 characters, is **kept as it is** and
    shown nowhere.
  - Anything else is null.
- **The N step** (`typeof arrived!=="string" || _versionNewer("0.16",
  arrived)`): each place's `site`, `siteLevel` → null and `exposure` → `[]`
  where missing. Nothing is converted.

**Engine** (each is total: bad input gives a value, never a throw):

| Function | Does | On bad input |
|---|---|---|
| `siteProfiles(packs, f)` | every slotted pack's sites as `{ pack, site }`, by category in the five kinds' order, then name; `f.category` filters | `[]` |
| `packSite(packs, packId, id)` | `{ pack, site }` or null | null |
| `setPlaceSite(t, placeId, packs, ref)` | `ref` `{ pack, id }`: the link set with the site's name; `environment` set to its category; `siteLevel` → null; `exposure` → `[]`; the site's clock, if any, added on the place through `addClock`. `ref` null: the link, level and rows cleared, and clocks left. Refuses a ref no slotted pack has | `{ ok:false, why }` for no such place or no such site |
| `placeSite(t, packs, p)` | what the page reads: `{ link, site \| null, here, level \| null, exposure: [ { name, n, step \| null } ] }`. `level` is the stored level's object, else the start's. A row's `step` is the highest step at or under `n` | never throws; no link → `{ link:null, … }` |
| `editPlace` | also takes `siteLevel` (gated) and `exposure` as a whole list (gated, as `tippingFor` is in S7) | as today |
| `addClock(t, f)` | `f.on` a faction **or a place** on the table | `{ ok:false, why }` |
| `removePlace(t, id)` | also removes every clock whose `on` names it | as today |
| `tableActionLabel` | a clock removed in the same patch as **the record its `on` names** is collateral, whatever the kind (generalises `goneFactions`) | as today |
| `tableSearch` | a place's fields gain *Site* (the link's kept name) and *Exposure* (each row's name). A clock is tested when its owner is a faction **or a place** on the table, and the hit carries `owner` and `ownerKind` | as today |

## 9. The UI

All in `gm.js` and the CSS. Tool voice; ✎ marks text for a voice pass.
**Profile text is the book's, drawn as text, never reworded.** Every control
is a tap and 44px (plan §1a).

**The lift first** (§12 step 4): the clock code becomes:
- `clocksHtml(owner)`, the list plus **Add a clock**;
- `bindClocks(main, owner)`, all of S7's presses;
- `clockCountText(clocks)`, *2 clocks · 1 full*, used by both cards.

`owner` is `{ kind, id }`. Nothing about a faction's clocks changes.

**A place's page**, after **Kind of ground**:

- ✎ **Site profile**: a select of every slotted pack's sites:
  - ✎ *None* first, then one group per category in the five kinds' order,
    each option the site's name;
  - the place's own category's group first when its ground is set;
  - when no slotted pack has sites, the select is replaced by ✎ *Slot in a
    pack with site profiles to use one here.*

  Picking one runs `setPlaceSite`. The page redraws, focus stays on the
  select, and **Kind of ground** shows the profile's category pressed.
  Picking *None* clears the link (SQ4).
- **When a profile is set**, under it, in this order:
  - **The site's name** (`h2`) with its category and canon example;
  - the flavor line, emphasised;
  - **Presence**, **Rules**, ✎ **Ways in** (a list), **Layering**;
  - **the track**, by its kind:
    - **Levels** (*Disposition*, *Amplification*): its name (`h3`), a toggle
      group of its levels with one always pressed (the stored level, else
      the start), and under it the pressed level's text. Tapping a level
      sets it. Tapping the pressed one does nothing: a track always has a
      level. Then ✎ *What moves it* and its text.
    - **Exposure**: its name (`h3`), the triggers, then one row per
      character:
      - a name field (✎ placeholder *Who?*, a datalist of the crew names
        the table's lines use, from `crewView`);
      - **−**, the count and **+** (− disabled at 0);
      - the highest step reached as its text, or nothing below the first;
      - **Remove**.

      Then ✎ **Add someone**. Under the rows, the steps as a list (*3*,
      *5*, *8* with their text) and ✎ *Marks here* with the site's text.
    - **Table** (*What comes through*): its name (`h3`) and die, and the
      rows as a list. Nothing to press.
    - **None**: the profile's `trackText`.
  - ✎ *Who's already here*, **Resolution**, ✎ **GM note**;
  - when the clock is *None*, its `clockText` under ✎ **Clocks**.
- **Clocks** (SQ9, every place): `clocksHtml({ kind:"place", id })`, S7's
  clock exactly, under ✎ **Clocks**.
- **When the link's pack isn't slotted in** (SQ7): the profile's part reads
  ✎ *The Long Stretch: its pack isn't slotted in.* (the kept name), with the
  select still offered. The level and the rows are kept and not shown; the
  clocks show (they're the table's).
- **A stored level the pack lacks**: the toggle group shows the start pressed
  and ✎ *Last set to “wary”, which this pack doesn't have.* under it, until a
  level is tapped.
- **Delete** on a place asks, danger: *Delete The Old Pike?* / ✎ *Its page
  goes with it, and its 1 clock. Lines that named it keep its name, struck
  through.* (no clocks: today's text). Two sentences, matching S6's approved
  dialog plus S7's clock clause (Ken kept both, issuecomment-6386284094).

**A place's card** gains the profile's name and `clockCountText`, each if
any: *Zone · Territory · Thin Places · The Long Stretch · 1 clock*.

**Refused and empty** (`WORK-ORDERS.md`; S7's carried-over miss):

| Field | Refused or empty | Shows |
|---|---|---|
| An Exposure row's name | blank is kept (a row being typed) | its placeholder *Who?*; Find skips it |
| An Exposure count | can't be typed (buttons only); a file's junk gates to 0 | the stored number |
| A level | a tap sets a level the pack has; a file's unknown level is kept | the start pressed and the note above |
| A clock's Segments | S7's rule as fixed (6cfe7ad): refused, field put back | the stored number |
| The Site profile select | *None* clears; there's no typed value | the picked site |

**Where things land:**

| Press | The record | The view | Focus |
|---|---|---|---|
| **Site profile** → a site | link, ground, a clock added; level and rows cleared | the page redraws | the select |
| **Site profile** → *None* | link, level, rows cleared; clocks kept | the page redraws | the select |
| A level | `siteLevel` | that group and its text repaint in place | stays |
| **Add someone** | a blank row | the rows redraw | the new row's name |
| **+** / **−** on a row | `n` ±1 | that row's count, step text and buttons repaint in place | stays, or on the other button if it just disabled (S7's clock rule) |
| A row's name, typed | edited (212 folds typing) | no redraw while typing | stays |
| **Remove** on a row | removed | the rows redraw | the next row's name, else **Add someone** |
| A clock's presses | S7's table, unchanged | | |
| **Delete** on a place | asks, then removed with its clocks | The crew's places | the quick-add field (as today) |
| A Find hit on a place's clock | — | the place's page, scrolled to the clock | the clock's name (`h3`, S7's) |
| A Find hit on a place by its site or an Exposure name | — | its page | its `h1` (as today) |

**At width:** the profile's text, a row and a level group wrap at 390px;
`overflow-wrap:anywhere` on every name, line and text field.

## 10. Worked examples, as named tests

Write these first. Show each failing on `main` for the reason it states (not
an `undefined`), and record the output in the PR. Those that pass on `main`
by design say so.

**`tests/codexpack.test.mjs`** (the builder, *Site Profiles (N)*):

- **`N: the builder reads every Site Profile in the mirror, three a category`**:
  the count of `**SITE ` headings in the mirror equals `pack.sites.length`,
  and each category's count is the mirror's.
- **`N: a site's track keeps the book's shape`**: *The Old Growth* →
  `levels`, start `tolerant`, four levels in the book's order; *The Ramble*
  → start `calm`; *The Long Stretch* → `exposure`, steps 3, 5, 8; *The Deep
  Door* → `table`, six rows; *The Dead Block* → null with its `trackText`.
- **`N: a site's clock is split into its name, segments, what advances it and when it fills`**:
  *Drift*, 4, `advances` starting *"Advance one segment"*, `whenFull`
  starting *"When it fills"*; *Ceasefire*'s `advances` keeps *"counting
  down the truce"*; *The Building That Remembers* → null with *"None. The
  disposition is the clock."*; the count of non-*None* `**Clock:**` lines
  in the mirror equals the clocks built.
- **`N: site ids come from the ledger and survive a rebuild`**: as the
  builder's existing id tests, for `sites`.

**`tests/engine.test.mjs`**, *Site Profiles (N)* and *A place's site (N+1)*:

- **`N: migratePack gates sites: text as text, a track of a known shape, a clock of 2 to 12`**:
  - a 0.2 pack with no `sites` loads with `[]`;
  - an unknown track kind → null;
  - a level with a bad id is dropped, and a `start` naming a dropped level
    → the first level;
  - a step `at` of 0, `"x"` or 100 is dropped;
  - a clock's segments 13 → 4;
  - a `__proto__` id is dropped.
- **`N+1: picking a profile sets the ground, copies its clock and clears the old track`**:
  the Old Pike place, *The Long Stretch* →
  - `environment` `thin-places`;
  - one clock *Drift* 0/4, `on` the place;
  - picking *The Old Growth* afterwards → `siteLevel` null,
    `exposure` `[]`, two clocks;
  - *None* → link null, two clocks kept.
- **`N+1: placeSite reads the level and each row's step live`**:
  - no level → *Tolerant*; `wary` → *Wary*;
  - rows 0, 2, 4, 5, 9 → steps null, null, 3, 5, 8;
  - the place record is deep-equal before and after (nothing stored).
- **`N+1: a place's link outlives its pack`**: with no packs, `here:false`,
  the kept name, and the level, rows and clocks untouched.
- **`N+1: a place owns clocks; removing it removes them, and one undo restores all`**:
  deep-equal (`undoBase`). The activity log has one entry, *Removed The Old
  Pike*. A faction's removal in the same patch still reads *and 1 more*
  (S7's probe, kept).
- **`N+1: the clock gate keeps a place owner and an owner it doesn't know`**:
  - `{ kind:"place", id:"PL-…" }` is kept;
  - `{ kind:"encounter", id:"EN-AAAAAAAA" }` is kept as given, and
    `clocksOn` for a place or faction doesn't return it;
  - `{ kind:"Place" }`, an array, or an id of 41 characters → null.
- **`N+1: Find finds a place by its site and an Exposure name, and a place's clock by its words`**:
  *stretch* → *Site*; *vex* → *Exposure*; *drift* → the clock, with
  `ownerKind` `place`.
- **`N+1: the gate types a place's site, level and rows, and converts nothing`**:
  - a 0.15 table loads with `site: null`, `siteLevel: null`,
    `exposure: []` on every place, and its `environment` unchanged;
  - a `site` of kind `entry` → null;
  - `n: -3` → 0, `n: 120` → 99, `n: "4"` → 4;
  - a row that is a string → dropped;
  - `newTable()` → `addPlace` → `setPlaceSite` → `migrateTable`
    round-trips (constraint 8).
- **Version pins:** every `tableSchemaVersion` `"0.15"` and
  `packSchemaVersion` `"0.2"` assertion moves. Find them by `grep -n
  '"0\.15"' tests/` and `grep -n 'packSchemaVersion' tests/`, not by this
  order's list. At `6661383`: `engine.test.mjs`, `hostile.test.mjs`,
  `smoke-table-cast.test.mjs`, `smoke-table-play.test.mjs`,
  `codexpack.test.mjs:493`, `packfixture.mjs:20`. **Not** a character's
  `schemaVersion`.

**`tests/smoke-table-sites.test.mjs`** (new; its helpers are its own; a
pack fixture with two sites built from the mirror's Long Stretch and Old
Growth, as `packfixture.mjs` builds entries), switched on, each reading what
is drawn:

- **`N+1: a place's Site profile lists the slotted sites, and picking one draws it and its clock`**:
  - focus is on the select;
  - *Thin Places* is pressed;
  - the Presence text is drawn;
  - one clock *Drift* shows *0 of 4*.
- **`N+1: a levels track always has one level pressed, and a tap moves it`**:
  - *Tolerant* is pressed at first, with its text;
  - tapping *Wary* moves `aria-pressed` and the text;
  - tapping *Wary* again leaves it pressed.
- **`N+1: Exposure rows count per character and show the step reached`**:
  - **Add someone** focuses a blank name;
  - typing *Vex* and four presses of + read *4* and the step-3 text;
  - − disables at 0 and focus moves to +;
  - typing fires `input` and `change`: one Activity entry, no toast while
    typing.
- **`N+1: with its pack gone, a place keeps its site and says so`**.
- **`N+1: deleting a place asks with its clock count, and Undo from Activity restores both`**.
- **`N+1: Find opens a place's clock on its name`**.
- **`N+1: a faction's clocks behave as before the lift`**: S7's + / − /
  Edit / Delete on a faction page, re-run here against the shared code (the
  guard for the lift).
- **`N+1: Met here → member → Back, and Key to → Back, still return`**: S6's
  and S7's routes, re-run (S7's build-side miss).

**`tests/hostile.test.mjs`:**
- **A pack** whose sites carry `<img onerror>` in every text field, a level
  name, a step text, a row text and a clock's name; a `__proto__` id; an
  array `track`.
- **A table** whose place carries a `site` with markup in its kept `name`,
  a `siteLevel` of markup, Exposure names of markup, `n: {}`, and a clock
  whose `on` is `{ kind:"__proto__" }`.

Rendered as text on a place's page, its card and Find; no `img` in the
page; `Object.prototype` untouched; the version pins move.

## 11. Tests beyond the examples

- **Totality:** `siteProfiles`, `packSite`, `placeSite` on `null`, `{}`,
  packs whose `sites` is `"x"`, a site whose `track` is a number, and a place
  whose fields are numbers.
- **Voice:** every ✎ string through `tests/voice.test.mjs`.
- **The data guard** (135): no data key is added.
- **Mutation-test** each (record each in the PR with what caught it). Check
  each for a second path first; find each site by `grep`, never a line
  number; run each narrowly (`node --test --test-name-pattern="…"
  tests/<file>` under a `timeout`):
  1. `_clock` dropping place owners (`grep -n 'function _clock' src/engine/engine.js`)
     → *the clock gate keeps a place owner…*.
  2. `removePlace` leaving its clocks → *a place owns clocks…*.
  3. `tableActionLabel` collapsing only factions (restore the
     `coll==="factions"` test) → *a place owns clocks…* (its one-entry
     assertion).
  4. `setPlaceSite` not clearing `exposure` → *picking a profile sets the
     ground…*.
  5. `tableSearch` testing only factions' clocks → *Find finds a place…*.
  6. `migratePack` without the N step (no `sites` default) → *migratePack
     gates sites…*.
  7. The builder splitting `whenFull` at the first full stop → *a site's
     clock is split…*.
  8. `bindClocks` with the faction id hard-wired (the lift done wrong) →
     smoke *a place's Site profile lists…* (the place's clock doesn't move).

## 12. Steps

`git submodule update --init private`; `npm run test:fast` before starting
(a fresh branch from `main`); the targeted files after each step.

1. Take the two decision numbers, the table and the pack schema versions:
   the lowest free on `origin/main`. Search the ledger again for the
   pre-flight's names. Check `private/crb/README.md`'s line for the Site
   Profiles: **if it now says approved, or the file has moved, stop and
   ask** (SQ0's ground has changed).
2. **The pack:** the N step and the `sites` gate; `siteProfiles`,
   `packSite`; the pins. Engine tests.
3. **The builder** (in `private/`, its own commit there):
   - `sites` in `SECTIONS` and `ids.json`;
   - the parser;
   - `PACK_SCHEMA` → N;
   - `contentVersion` (SQ0);
   - `npm run codex-pack`;
   - `codexpack.test.mjs`.

   Bump the pointer in the PR.
4. **The lift**, alone: the clock code into `clocksHtml`, `bindClocks` and
   `clockCountText`, the faction page using them. `smoke-table-factions` is
   green before anything else in the UI moves.
5. **The table:** the N step, `_place`'s three fields, `_clock`'s owner
   rule, `setPlaceSite`, `placeSite`, `editPlace`, `addClock`,
   `removePlace`, `tableActionLabel`, `tableSearch`. Engine tests.
6. **A place's page:** the select, the profile, the three track kinds, the
   clocks, the card, the delete dialog, Find's clock branch.
7. **Hostile** tests; CSS at 390px.
8. **In the browser** (`shadows-dev-preview`, `?gm=on`, the built Threat
   Codex pack slotted in):
   - The Old Pike from The city; *The Long Stretch*; *Thin Places*
     pressed; Drift 0 of 4.
   - Two Exposure rows to 5 and 8; a row's name typed; Remove.
   - *The Old Growth* on another place: the levels from Tolerant to Hostile
     and back; *The Deep Door*'s table; *The Dead Block*'s text and
     Attention clock.
   - Unslot the pack: the place says so, and its clocks show; slot it back.
   - Delete a place with a clock; Undo from Activity. Find *drift* and a
     row's name.
   - A faction's clocks, every press (the lift). Met here → member → Back;
     Key to → Back.
   - **390px**, **768 × 1024** and **1300px**; `npm run phone-check`.
   - **Both themes:** the level toggles and a row's step text are new.
     **Report it if** any text is under 4.5:1 or a control's edge under 3:1.
9. The mutations (§11).
10. Ledger (N, N+1; 186, 208, 243 and 245 marked **in both SCHEMA and
    INDEX**), INDEX, SCHEMA §3 (a place's three fields, the clock owner
    rule, the pack's `sites`, schema N twice), the plan (S12b's row moved to
    *Built*, its tier corrected; §4f's *Clocks* line gains *on places*; the
    sources table's Expansion row names the draft), STATE, `crb-catch-up.md`
    (below), docs, close-out (§14).

## 13. Stop and ask

- 0.16 or 0.3 is taken, or the ledger search finds a decision these
  override that the pre-flight doesn't name.
- `private/crb/README.md` no longer lists the Site Profiles as not approved,
  or the mirror's profiles differ from the pre-flight's reading (fifteen,
  three a category, eleven clocks, four *None*).
- The builder can't split a profile the way §8 says without a case for one
  profile. **No parser branch for one site** without Ken's ruling in the PR.
- Any field needs a value the book doesn't give (a start level for a track
  with none, a segments count missing): **don't guess one** (203).
- A test needs an exception for one record, entry or string.
- The lift changes any S7 behaviour (an S7 smoke test fails for a reason
  other than a moved function).
- A clock needs to advance, reset or run a rule, or a site needs a roll.
- An existing test needs a change beyond: the version pins (both schemas);
  the place delete dialog's text where it has clocks; `codexpack.test.mjs`'s
  ledger tests learning `sites`.
- Undo's round trip of a place's removal isn't deep-equal.
- The voice test flags new copy, or a decision goes over 350 words.
- **Not a stop:**
  - the version literals 0.16 and 0.3 move;
  - the builder's pack JSON changing in `private/` (it's regenerated);
  - `engine.test.mjs`'s *"208: a search over 200 members and 100 sessions
    is quick"* failing on timing while the dev preview runs, if it passes
    run alone;
  - phone-check's two OVER rows on the player sheet's HP pill.

## 14. Close-out

*Rule or shape* tier, switched off, table schema N and pack schema N:

- **SCHEMA:** N and N+1; the marks on 186, 208, 243 and 245 **in the
  ledger**; §3's place fields, clock owner rule and the pack's `sites`.
- **INDEX:** N and N+1 under **GM mode**; the four lines marked. **Check
  each ledger mark by eye**: S7's 208 mark was missing from the ledger
  while INDEX had it.
- **STATE:** the versions line (table schema N, pack schema N); §1's GM mode
  line *built through S12b* (or as STATE words it); §3's GM mode row and
  §5's *Next*. Inside the word and line-length guard.
- **The plan:** S12b's row moves from *Still to build* to *Built*
  (Decisions N, N+1), with its tier as *Rule or shape*. §4f's *Clocks* line
  gains *on places (S12b)*. The sources table's Expansion row says the
  profiles are a draft (SQ0).
- **`crb-catch-up.md`**, under the Threat Codex:
  - **(a)** The approved Expansion's text still says *"Nothing here is
    approved"* (its line 11). The file was renamed, not edited.
  - **(b)** The Expansion's field list (`:102–120`) has no *Ways In* or
    *Layering*, which the profiles add.
  - **(c)** The pilot's Long Stretch has neither.
  - **(d)** The profiles' two ⚑ marks are still open.
- **`changelog-pending.md`:** ✎ *Site Profiles. A crew's place can take one
  of the Threat Codex's Site Profiles: its presence, rules and track, each
  character's Exposure, and its clock.*
- **Log** entry:
  - why the profile is pack content and the place keeps only state;
  - why Exposure is per character;
  - why a clock's owner gate keeps unknown kinds;
  - the clock code's lift;
  - that the source is a draft (SQ0).

  **Shipped** row *(switched off)*. README's table: S12b's row.
- **PR** titled `feat(gm): Site Profiles on the crew's places, switched off
  (S12b, Decisions N and N+1)`. Body sections:
  - what changed;
  - *Evidence*: every claim names its command or test; the §10 tests failing
    on `main`; each mutation; each changed existing test, by name, with what
    changed; the `private/` commit and the pointer bump;
  - the browser check;
  - *Voice pass*: every ✎ string, for Ken through the conductor, each
    checked against the copy rules first or citing the approved S6 or S7
    line it matches;
  - **Where the order didn't fit**.

**Review checklist:**

- [ ] **Every answer Ken recorded** (SQ0–SQ9 here, and any PR comment in his
      words) **is in the code**, checked one by one.
- [ ] **In the browser, by the reviewer** (§12's step 8, by clicking): pick
      a profile; every track kind; Exposure rows; a pack unslotted; delete
      and Undo; Find; a faction's clocks after the lift; Met here and Key to
      round trips.
- [ ] **The pack against its source:** the reviewer reads three profiles in
      the mirror (one levels, one Exposure, one table) and compares every
      field of the built pack, word for word (`WORK-ORDERS.md`: a shape later
      content fills is checked against the content's source).
- [ ] **No parser branch for a single profile**; counts in the builder's
      tests come from the mirror.
- [ ] Nothing a site says is run: no roll, no Condition, no reset, no level
      moved by the app (`grep` the diff for the step texts' words).
- [ ] A 0.15 file's places keep `environment` and gain the three fields
      empty; a crafted site, level, row or owner renders as text.
- [ ] Undo covers every change, deep-equal.
- [ ] Only the named tests changed (§13's list); no one-entry exception;
      every smoke test reads what's drawn.
- [ ] 390px: nothing scrolls sideways; every control 44px.
- [ ] 186, 208, 243 and 245 marked **in the ledger and INDEX**; both schema
      versions everywhere they're written; no game-data bump.
- [ ] Two mutations re-run locally, one of them the lift (8).
- [ ] Every "report it if" has an answer in the PR, and *Where the order
      didn't fit* is there, empty or not.
- [ ] The final `npm run verify` is on the PR's final commit, and the
      `private/` pointer is the commit that built the pack.

## 15. Handing it over

The conductor starts **S12b build** (Sonnet) with the building prompt in
`docs/WORK-ORDERS.md` and this order's path,
`docs/plans/gm-mode/S12b-site-profiles.md`, and **S12b review** (Opus) once
the PR is open. The traps, under the builder's prompt:

- **The profiles are Codex content: the pack, never `shadows-data.js`**
  (167). Nothing of a profile's text goes in `src/`.
- **The place stores state, the pack holds the book** (constraint 7): a
  link, a level, rows and clocks. Read the profile every time.
- **Lift the clock code first, alone, and keep S7 green** before a place
  uses it. Its twins are the faction card's and the place card's counts.
- **`_clock`'s owner rule is a reader of every owner kind**, and so are
  `tableSearch`, `openFound` and `tableActionLabel`'s collapse. Each learns
  places; the gate also keeps a kind it doesn't know.
- **`removePlace` is the second owner removal.** Its clocks go, and the
  label collapses them, as a faction's do.
- **The builder's counts come from the mirror**, never from this order.
  No parser branch for one profile.
- **Run nothing a site says.** The step texts, a level's +1 die, *reset to
  1*: all text.
- **Guess nothing** (203): no profile from a place's ground or a gazetteer
  site, no start level the book doesn't give.
- **Fire `change` as well as `input`** on every field the page binds.
- **Every supersession mark goes in the ledger and in INDEX.**
  `docs.test.mjs` sees only INDEX.
- **Numbers aren't reserved:** take the next free decision numbers and both
  schema versions when you write them.
- **Ken's answers land in the order or as PR comments.** Re-read both before
  each push.
- **Preview by clicking**, both themes and three widths, and answer every
  "Report it if" in the PR.
- **Verify last.** The final `npm run verify` runs on the commit the PR ends on.
