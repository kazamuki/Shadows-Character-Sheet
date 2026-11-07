# Work order U3: Read first

**Plan:** [`../gm-at-the-table.md`](../gm-at-the-table.md), session U3. It owns findings #16–#26 (plan §2), plus the
U4 re-critique leads the plan's U3 row carries, where they fall on U3's pages.
**Status:** **drafted 2026-11-06 by Claude (Opus)**, U2's reviewer, for Ken's approval.
**Ken's shape answers** (`/impeccable shape`, run by the conductor with Ken, 2026-11-06; plan §3.1) are in §9's head:
**Always read**, **Summary, then want**, **Inline, one at a time**. The plan's UQ2 already settled that **Edit** turns
the page into today's form. UQ26–UQ34 (§4) are this order's own questions, from the shape brief's open items and the
pre-flight.
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs beside:** nothing (plan §4: every U session shares `gm.js` and `shadows.css`).

**Pre-flight:** against `main` at `30666f7` (PR #309, U2, merged: app 0.64.0, game data 0.53, character schema
0.34, table schema 0.19, pack schema 0.3). What I found:

- **Every record opens as a form.** Four pages are field lists from the `h1` down:
  - a member (`castPageHtml`, `gm.js:923`);
  - a place (`placePageHtml`, `:1516`);
  - a faction (`factionPageHtml`, `:1867`);
  - a session (`sessionPageHtml`, `:2185`).

  A thread is a row of controls with no page (`threadRowHtml`, `:2130`): a title input, a **Current** toggle, a
  status select and, under More, notes and Delete. **Decision 176** says "a member's page edits every field in
  place and saves as it's typed". Places (243) and factions (244) copied the pattern without restating it.
- **A read-only stat block already exists.** `readBlockHtml(block)` (`gm.js:2824`) draws a Codex entry's block on
  Threats from `Engine.npc`, with nothing to edit. The member's dossier can reuse it, so no engine reader is needed.
- **Notes is one editor per note** (`noteCardHtml`, `:369`): a title input, a textarea, a session select and Delete,
  all open. `openNote` (`:652`), used by Jot's *Jotted* links and by Find, focuses the note's textarea.
- **Focus on a tab press lands in an Add field.** Probed in the dev preview at 1024px:
  - Sessions → `[data-thadd]`;
  - Cast → `[data-cadd-name]`;
  - Notes → `[data-tnew]`;
  - City → `[data-jumpfilter]`.

  This is `keepPlace`'s fallback list in `renderTable` (`gm.js:490`). The tab's button is rebuilt by
  `renderTableChrome`, so the press can't keep focus.
- **Sessions zigzags.** `.sess-list` is a `.roster-list`, so at 1024px it reads Session 7 (left), Session 6 (right),
  then 5 and 4 under them. At 1440px it reads four across.
- **Card grids.** `.app.table-mode .roster-list` is `auto-fill, minmax(min(100%, 20rem), 1fr)` (`shadows.css:1143`).
  At one width every roster agrees: 2 columns at 1024px and 4 at 1440px (places, factions, cast and encounters,
  measured). The critique's "two and three columns" is the count jumping as the width changes, with nothing fixing
  it per breakpoint. **Decision 258** says "cards fill 20–36rem columns".
- **The place breadcrumb repeats.** `placeCardHtml` (`:1316`) joins zone · territory, district, neighborhood,
  environment, site and "N lines". The zone's gazetteer name and the typed district are often the same word: Dead
  Air's Achterberg's Clinic reads "Techtopia · Central City · Techtopia · The Annex". "N lines" counts
  `Engine.placeLines`, the interactions that name the place as Where. The page calls the same list **What happened
  here**.
- **Ibarra's patience** is on faction *Eclipse* (`on: { kind:"faction" }`). Lt. Caz Ibarra (`C-8FGP6RCT`) is
  Eclipse's first Key NPC. A clock can only hang on a faction, a place or an encounter (`CLOCK_OWNER_RECORDS`,
  `engine.js:6906`), so finding #25 is a *reader*: a member's dossier shows the clocks of the factions they're
  key to. No new owner kind is stored.
- **"Slot in a pack"** appears twice:
  - on the place page's site line (`gm.js:1389`), which is U3's;
  - on the Threats tab's button (`:2806`), which isn't.

  **"Delete this note?"** (`:527`) names no note, and it's U3's. Modal titles in the display face
  (`.modal-head h2`, `shadows.css:1038`) are global, so not U3's page. The seat card's dim vitals line and the raw
  TAG as a name are on Players, so not U3's (see *Carried over*).
- **Probes on `main`** (Dead Air at 1024px), the worked examples' "before":
  - Lt. Caz Ibarra's page has **15 focusable controls (8 of them fields) before *What they want***;
  - the Notes tab draws **8 textareas** for 8 notes;
  - Achterberg's Clinic's card says "Techtopia · Central City · Techtopia · The Annex · 3 lines". Gateway repeats
    the same way on three more cards;
  - Sessions reads 7, 6 / 5, 4 at 1024px and four across at 1440px.

**Carried over:**

- **U2's misses, the order's:**
  - **A question answered two ways.** Done-when #2 and UQ22 ("Unexported stays") disagreed with the drafted
    Decided text ("while a session is open"), and the build followed the decision. *Here:* every Done-when line was
    checked against §3's Decided.
  - **A rule's edge left out.** K2: a session dated today *and* closed out. The order's "otherwise as today" didn't
    say which way it fell. *Here:* §8 says what each changed reader does on its edge cases.
  - **Geometry not measured.** The 375px page bar wasn't measured, and the strip, Back and Add to didn't fit. *Here:*
    §9 gives the dossier's widths, and the stop in §13 names its fallback.
- **U2's misses, the build's:**
  - **A §13 stop routed around rather than raised.** The build moved Add to off-screen and wrote "nothing outside
    §9". *Here:* each stop says what to report. A fix that changes §9's arrangement is always a stop.
  - **View state that never cleared.** `S.keepUnx` survived the export it was meant to end. *Here:* every new piece
    of view state (`S.editing`, `S.noteOpen`) has a row in §9's *Where things land* table saying what clears it.
- **U2's re-critique leads:**
  - **On U3's pages:**
    - the Debrief summary is the dimmest thing on a session page;
    - "Close to full" counts 2 of 4;
    - close-out's focus lands on a pressed attendance toggle.

    The first falls on U3's session dossier. The other two don't: they're U2's.
  - **Not on U3's pages,** named in the plan as leads after U5:
    - the strip's type size;
    - no urgency colour on a clock at 7 of 8;
    - Down hidden on a phone while the fight leads (U2's H1 miss, Ken 2026-11-06: a lead, not a reopening);
    - the award log's ceremony;
    - the Hit panel's order (UQ24).
- **U4's leads (the plan's U3 row):**
  - **Taken:**
    - every tab focuses its Add field (#19's neighbour, fixed in §9);
    - "Slot in a pack" on the place page;
    - "Delete this note?".
  - **Not on U3's pages,** carried to the plan as a later *Fix*:
    - modal titles in the display face;
    - the seat card's dim SAN / Luck / Çredits;
    - a raw TAG shown as a seat's name;
    - Threats' "Slot in a pack" button.
- **The phone-check budgets carry:**
  - the tables bar 20%;
  - the encounter bar 27%;
  - the strip's lead ≥ 120px on a page bar at ≤ 390px (Ken's "Fight first", 2026-11-06).

  Edit's bar (§9) must keep all three.
- **The overlay grid comes from Dead Air,** every cell filled, with the tab fronted. No type under 11px. A tag
  that isn't a tip is `.tag.plain`. Every test that presses inside a fold opens it first and asserts it's open
  (`openFold` in `smoke-table-play`).

---

## 1. Goal and Done when

A GM mid-session opens a cast member, place, faction, thread or session to **read** it. Under the name, one glance
answers who this is and what they want. The prose reads without tabbing through inputs, and nothing changes by
accident. **Edit** is one press away and opens today's form, unchanged.

**Done when** (Dead Air seeded):

1. **(#16, #26) Always read.**
   - A member, a place, a faction and a session each open on a read view: the dossier.
   - **Edit** opens today's form for that record, unchanged.
   - **Done** returns to the read view with focus on Edit.
   - No input, select or textarea is in the read view, except the play controls §9 keeps: a clock's − and +, a
     thread's Current, and the session's play rows (UQ31).
2. **(#26) The dossier's order** (Ken: *Summary, then want*), shown for Lt. Caz Ibarra:
   - the name (display face);
   - one summary line;
   - **Wants** and **If pushed** as prose under Mono Caps labels;
   - **Their line** as a quote;
   - the stat block as readouts (`readBlockHtml`);
   - then the rest.

   An empty field isn't drawn at all, not even as "—".
3. **(#25)** Ibarra's dossier shows **Ibarra's patience 4 of 6** with − and + in its **Clocks** block, high on the
   page (§9), as the clock of *Eclipse*, the faction Ibarra is key to (UQ30).
4. **(#17) Notes** (Ken: *Inline, one at a time*):
   - The tab lists notes by title, or by first line when there's no title.
   - A press opens that note in place to read, with **Edit**, and closes any other open note.
   - There's no textarea until Edit. Nothing scrolls inside the page.
5. **(#18)** On Ibarra's dossier, **Wants** comes before any focusable control except the bar's buttons and Edit
   (on `main`, 15 controls come first, 8 of them fields).
6. **(#19) Add sits below the content** in every section that has one (UQ29). A tab press keeps focus on the tab
   it pressed, never in an Add field (UQ33).
7. **(#20)** A place card says each place once: "Techtopia · Central City · The Annex", not "Techtopia · Central City
   · Techtopia · The Annex".
8. **(#21)** "N lines" on a place card reads **"N things happened here"** (UQ28), matching the page's *What happened
   here*.
9. **(#22)** Every card grid (cast, places, factions, encounters) holds one column count per width band: one below
   640px, two to 1279px, three from 1280px (UQ32).
10. **(#23)** Sessions is one column, newest first (UQ27).
11. **(#24)** On an open thread that isn't current, the control reads **Make current**. On the current one it reads
    **Current**, pressed (UQ34).
12. **Copy:**
    - "Delete this note?" names the note: **Delete "<title or first line>"?**.
    - The place page's "Slot in a pack" line is in the world's voice (voice pass).
13. **The gate.**
    - The browser overlay is clean on every page touched at 1024px and 375px, or each finding is named.
    - Header plus bar stays within 20% at 390px on a dossier and in Edit.
    - The reviewer's re-critique scores **H8 (Aesthetic and minimalist) and H4 (Consistency) above U2's 2**, and H6
      at or above 3.

## 2. Tier, versions, numbers

- **Rule or shape:**
  - a player-facing behaviour someone could have chosen otherwise (read first, Edit);
  - a decided rule reopened: 176 in part (plan §1, Decision 130). The new thing its Rejected list didn't weigh is
    Ken's play-first ruling and the critique's walk-through.
- **App:** a minor, 0.64.0 → **0.65.0**, or the next minor on `main` when built.
- **No schema bumps** (game data, character, table or pack).
  - The read view, the open note and Edit are view state on `S`.
  - The member's clocks are read through the faction's Key NPCs.
  - If any of them turns out to need a stored field, that's a stop (§13).
- **Engine:** none expected. The dossier reads stored fields and existing readers (`Engine.npc`, `factionsKeyFor`,
  `clocksOn`, `placeLines`). A new engine reader is a stop, unless it's total and DOM-free and the conductor agrees.
- **Decision:** one, numbered **N**, the next free number on `main` when built (`CLAUDE.md`, *Decisions*; 270 is
  the last today, so probably 271).

## 3. The decision, drafted

```
N. **A record opens to read: a dossier with Edit one press away; Notes lists titles that open one at a time; Add sits below what it adds to.**
     *2026-11-06 · Ken + Claude · Touches: read view, dossier, Edit, Done, S.editing, member page, castPageHtml, place page, placePageHtml, faction page, factionPageHtml, session page, sessionPageHtml, threadRowHtml, Current, Make current, readBlockHtml, stat block, summary line, Wants, If pushed, Their line, Key NPCs, factionsKeyFor, member's clocks, Notes tab, noteCardHtml, openNote, S.noteOpen, Delete this note, quick-add, Add, keepPlace, tab focus, placeCardHtml, breadcrumb, placeLines, N lines, roster-list, card grid, sess-list, Sessions order, Slot in a pack, phone-check, Decision 176, Decision 179, Decision 204, Decision 208, Decision 243, Decision 244, Decision 258, Decision 270*
     - **Decided:** A member, place, faction or session opens on a read view, a dossier: the name, one summary line, what they want and if pushed, their line, the stat block as readouts, their clocks, then the rest, with no empty fields. **Edit** swaps in today's form; **Done** returns to the read view with focus on Edit; Delete is in Edit only. A member's dossier shows the clocks of the factions they're key to, with − and +. A thread reads as its title with Make current or Current; its fields are under Edit. Notes lists titles; one opens in place to read, with Edit, and opening another closes it. Add sits below each list, and a tab press keeps focus on its tab. A place card names each place once and says "N things happened here"; card grids are one, two or three columns by width; Sessions is one column, newest first. Nothing is stored.
     - **Why:** the critique of 2026-11-05 found every record opening as a form, with seventeen fields before what a member wants; Ken ruled GM mode play-first, then shaped it: always read, summary then want, notes inline one at a time.
     - **Rejected:**
       - Click a passage to edit it (UQ2): it hides what's editable, and a phone's scroll starts an edit.
       - A read view only while a session is open: two modes to learn for one page.
       - Notes as a separate page each: a list read one at a time is the point, and W140 will fill the list.
       - A new clock owner kind for a member: a schema bump for what the Key NPC link already says.
       - Add at the top, as 176 had it: the form leads every section, above what it adds to.
     - **Replaces:**
       - Decision 176 in part: a member's page reads first and edits under Edit; quick-add sits below the list.
       - Decision 204 in part: a thread's fields are under Edit; Sessions is one column.
       - Decision 208 in part: Notes lists titles, one open at a time.
       - Decisions 243 and 244 in part: a place's and a faction's page read first.
       - Decision 258 in part: card grids are one, two or three columns by width, not auto-fill.
       - Cites 179 (a member's lines stay as they are), 245 and 270 (a clock's − and +).
     - **Revisit if:** a GM edits mid-scene more than they read, W140 reshapes Notes, or a fourth clock owner kind arrives.
     - **Built:** app 0.65.0; PR #…; log 2026-11-…
```

`docs.test.mjs` checks the shape and the 350-word limit. **The builder pastes this whole.** If the limit bites, it
trims the prose and keeps the Touches line whole (U2's miss), and it says so in the PR. Mark 176, 204, 208, 243,
244 and 258 `→ **Superseded in part by Decision N**` with each one's clause, with their INDEX lines to match. Put
N's INDEX line under GM mode's records.

## 4. Questions for Ken

The plan's UQ2 (one Edit toggle per page) is answered and this order relies on it. Ken's three shape answers are in
§9's head.

| Id | Question | Default |
|---|---|---|
| **UQ26** | **The dossier's labels and empty states** (shape brief §7). Draft: **Wants**, **If pushed**, **Their line**, **Got**, **GM note**. A record with only a name shows "Nothing on file yet. Edit to add who they are and what they want." | **The drafts, through the voice pass.** The builder pastes each into the PR as it renders; the reviewer drafts alternatives for Ken |
| **UQ27** | **Sessions' one order:** newest first, or by date | **Newest first** (highest number first, as `sessionList` already sorts). The top of the list is the one being played or just played |
| **UQ28** | **What "N lines" on a place card becomes** | **"N things happened here"** (one: "1 thing happened here"), matching the page's own heading. "Lines" is the app's word, not the GM's |
| **UQ29** | **Add below the content, Cast's quick-add included?** Decision 176 put quick-add first because "a GM has one hand and three seconds". Below a 30-member list it's a scroll away | **Below the content everywhere, except Cast's quick-add, which keeps its place above the list.** Cast is where a GM adds mid-scene, and 176's reason still holds there. The other Adds (places, factions, threads, sessions, notes, encounters, clocks) are prep. *Reviewer's note: the shape brief says every section; this default breaks that for one reason Ken has already ruled on once* |
| **UQ30** | **Whose clocks a member's dossier shows** (#25). Options: the clocks of factions they're a Key NPC of; also those of factions their affiliations name | **Key NPC factions only.** That link is a record, while an affiliation is free text ("Eclipse, sort of") that would guess. With none, there's no Clocks block |
| **UQ31** | **The session page while it's open** (U2's open session). Its Who, Hours, *Open a thread*, lines and jots are played live. Read view for those too, or only for the rest? | **Read view, with the play rows kept live:** Who, Hours, *Open a thread*, add a line and Close out stay controls on the read view. Number, Day and the six journal parts (U2's Debrief) are under Edit. A session reads like a record, but the night's controls don't move behind a press |
| **UQ32** | **Card grid counts** (#22): fixed by width band (one below 640px, two to 1279px, three from 1280px), or keep auto-fill and cap it at three | **Fixed bands.** The same width always shows the same count on every tab, and 258's 20–36rem card measure still holds inside each band (*the builder checks it at 1279px and 1280px*) |
| **UQ33** | **Where a tab press puts focus:** the tab pressed, or the page's `h1` | **The tab pressed.** The keyboard stays in the tab row, so a GM can arrow or tab across sections (U5 adds keys there), and nothing lands in a field |
| **UQ34** | **A thread's Current** (shape brief §7): in the read view or only in Edit, and its words | **In the read view**, since making a thread current is play. It reads **Make current** when off and **Current** (pressed) when on. Title, status, closed-in and notes are under the thread's Edit |

## 5. The assumption sweep

| What changes | True today, where | True after | Readers (by grep) |
|---|---|---|---|
| Member page | a form: `castPageHtml` (`gm.js:923`), bound by `bindCastPage` (`:1175`) | the dossier, or the form under `S.editing` | `smoke-table-cast` (69 lines on `data-cf`), `smoke-table-frame` (the page list `PAGES`), `hostile.test.mjs` (cast fields), `phone-check` (the cast page walk, `:407`, reads `.cast-panel` and `[data-ctitle]`): every test that types into `[data-cf]`, `[data-cstat]`, `[data-csk*]` or `[data-ct*]` **presses Edit first**. Count in §11 |
| Place page | a form, `placePageHtml` (`:1516`) | the dossier or the form | `smoke-table-city` (13 lines on `data-pf`), `smoke-table-sites` (grep `data-pground`, `data-psite`), `hostile` (`data-pback`) |
| Faction page | a form, `factionPageHtml` (`:1867`) | the dossier or the form | `smoke-table-factions` (grep `data-ff`, `data-ftype`, `data-fstance`, `data-fattn`, `data-ftip`, `data-fkey`) |
| Session page | a form, `sessionPageHtml` (`:2185`) | the dossier with the play rows (UQ31), the rest under Edit | `smoke-table-play` (grep `data-sf`, `data-sj`, `debrief(app)`, `data-sthadd`), `hostile` (`data-sj=happened`, `:863`), U2's Debrief fold. **Twin:** close-out (`closeSheetHtml`) is untouched |
| Thread row | inputs: `threadRowHtml` (`:2130`) | title as text, Make current or Current, then Edit | `smoke-table-play` (grep `data-thtitle`, `data-thcur`, `data-thstatus`, `data-thclosed`, `data-thnotes`, `data-thdel`), `showThread` (`:2228`), which **focuses `[data-thtitle]`**, U2's strip `goThread` (via `showThread`), and Find's thread hit (`openFound`) |
| Notes | 8 open editors: `noteCardHtml` (`:369`), `bindNotes` (`:511`) | titles; one open note to read; Edit for its fields | `openNote` (`:652`, focuses `[data-ntext]`), Jot's *Jotted* links (`data-jotopen`), Find's note hit, `smoke-table-play`/`-frame`/`hostile` (grep `data-ntitle`, `data-ntext`, `data-nsess`, `data-ndel`, `data-tnew`) |
| Tab focus | `keepPlace`'s fallbacks (`renderTable`, `:490`): `[data-cadd-name]`, `[data-pyadd-name]`, `[data-padd-name]`, `[data-fadd-name]`, `[data-tnew]`, `[data-tsearch]`, `[data-pslot]`, `[data-enc-new]`, `[data-thadd]`, `[data-snew]`, `[data-jumpfilter]` | a tab press focuses the tab pressed (UQ33). The fallbacks stay for a redraw *inside* a tab | `renderTableChrome`'s tab handler (`pickTableTab`, U2), `showActiveTab`. **Not** `openTable` (U2: the `h1`) |
| Add's place | the add row leads: cast (`castTabHtml`), places, factions (`factionsViewHtml`, `:1710`), threads (`threadsHtml`, `:2145`), sessions (`[data-snew]`), notes (`[data-tnew]`), encounters (`encListHtml`), a record's clocks (`clocksHtml`) | below each list, except Cast's quick-add (UQ29) | every `focus("[data-…add-name]")` after an add (it must still land in the field); `smoke-table-frame`'s "first element" tests; `phone-check`'s list walks |
| Place card meta | repeats zone and district: `placeCardHtml` (`:1316`) | each name once (case-insensitive), "N things happened here" | `smoke-table-city`/`-sites` (grep `lines` in card text). **Twins:** the place page's title (`Engine.placeTitle`) and Find's place hit title. The dedupe is the card's own, and `placeTitle` doesn't change |
| Card grids | `auto-fill, minmax(min(100%, 20rem), 1fr)` (`shadows.css:1143`) | 1 / 2 / 3 columns at <640 / 640–1279 / ≥1280 | `phone-check`'s `cards` column (`numbers`), `frame-fixture.json` frames that pin a list's columns: **re-record only those**, and name them in the PR. Home's `.roster-list` (not `table-mode`) is unaffected |
| Sessions list | `.roster-list.sess-list` (a grid) | one column | `smoke-table-play` (grep `sess-open`, `data-sopen`), `phone-check` |
| Member's clocks | none (#25) | the clocks of factions where the member is a Key NPC, with − and + (`clockLineHtml` with `owner`) | `Engine.factionsKeyFor(t, id)` (already used by *Key to*, `castKeyToHtml`), `Engine.clocksOn`, U2's `bindClockLines`. **Twins:** "4 of 6" now also on the dossier, with the same words as the clock's block, a card, Close to full, the strip and Activity |
| Delete's place | at each page's foot | under Edit only | `smoke-*` (grep `data-cdel`, `data-pdel`, `data-fdel`, `data-sdel`, `data-ndel`, `data-thdel`): each presses Edit first |
| Find's landing | `openFound` (`gm.js:608–650`): a member → `[data-ctitle]`, a session → the `h1` or a journal part (U2), a note → `openNote`, a thread → `showThread` | lands on the dossier's matching section. A hit in a field that's only under Edit (a member's GM note, a journal part) opens Edit and lands on the field | the `smoke-*` Find tests (grep `openFound`, `data-fkind`), U2's journal-part test |

**Which guards read a value this changes?**
- `voice.test.mjs` reads every new string.
- `build.test.mjs` reads the colour tokens, the 11px floor and `gm.js`'s `style=` rule.
- `phone-check`'s budgets: 20% and 27%, `BAR_MAX`, and the strip's `LEAD_MIN`.
- `engine.test.mjs`'s data-key reader guard isn't touched (no data).
- `smoke-table-frame`'s Back tests walk `PAGES`. A page whose Back now sits on a dossier must still be the bar's
  first child.

**Where does each new note or number render?**
- The clock's "4 of 6" renders in six places (above).
- The summary line renders on the dossier only. The cards keep their own meta.
- "N things happened here" renders on the place card only.

**What text points at what this changes?**
- The empty states that say "Add one" ("No places yet. Add one, or find it in The city."). These still hold with Add
  below.
- `cast-add` hints.
- The Notes tab's empty line ("Nothing on file yet…"), which still holds.
- 176's, 204's and 258's ledger text, marked.
- No `appCopy` or data note names a page's fields (grep `What they want` over `src/data`: none).

## 6. Read first

- `CLAUDE.md`: constraints 1, 5, 7 and 9; *Change tiers*; *Decisions*.
- `DESIGN.md`: *Readouts*; the Four Voices (display for names, Inter for prose, Oxanium for numbers, Mono Caps for
  labels); *Colors*; *Touch targets*.
- Decisions:
  - 176, 179, 184 (a member's page and its builder; Edit keeps 184's pack reading);
  - 204 and 208 (threads and notes);
  - 243, 244, 245 and 251 (places, factions, clocks and site);
  - 258 (the frame, and the stat block panel from 1280px);
  - 164 (`keepPlace`) and 165 (`scroll-row`);
  - 270 (U2: the strip, the open session's Debrief, `clockLineHtml`).
- `src/ui/gm.js`:
  - the pages: `castPageHtml`, `castStatBlockHtml`, `castKeyToHtml`, `castInteractionsHtml`, `placePageHtml`,
    `siteProfileHtml`, `factionPageHtml`, `sessionPageHtml`, `debriefHtml`, `threadRowHtml`, `threadsHtml`;
  - the read-only block: `readBlockHtml`;
  - Notes: `noteCardHtml`, `bindNotes`, `openNote`, `jottedHtml`;
  - lists: `castTabHtml`, `placeCardHtml`, `factionCardHtml`, `sessionsTabHtml`, `encListHtml`;
  - focus: `renderTable`'s `keepPlace` call, `pickTableTab`, `renderTableChrome`, `openFound`;
  - clocks: `clocksHtml`, `clockLineHtml`, `bindClockLines`.
- `src/ui/shared.js`: `keepPlace`, `takeFocus`, `update`.
- `.impeccable/critique/2026-11-06T23-55-03Z__src-ui-gm-js.md` (U2's re-critique, 28/40), and the shape brief, which
  §9's head summarises.
- Impeccable's `craft-floor.md`, read before the first UI edit (plan §3).

## 7. Out of scope

- **The form itself.** Edit shows today's fields in today's order. U3 doesn't redesign the editor (shape brief §3).
- **U1's encounter page and row, and U2's strip, close-out and Close to full.** An encounter isn't a dossier: its
  plan is prep and its run is U1's.
- **The Players tab:**
  - the seat card;
  - its vitals line;
  - a TAG as a name;
  - the read-only sheet (256, U4).
- **Threats:** entries and groups already read. Its "Slot in a pack" button stays.
- **Modal titles' face, Home, printing, U5's keys** and the section tabs' `aria-current`.
- **Any stored field**, W140's tags and categories, and a member's own clocks (UQ30).

## 8. The shapes

**Nothing stored. No engine change expected.**

- **View state:**
  - `S.editing = { kind, id } | null`, where kind is member, place, faction, session or thread.
  - `S.noteOpen = noteId | null`.
  - Both are cleared by every route that leaves the record (§9's table).
- **The summary line**, computed by the UI from stored fields:
  - **member:** `flavor` ("Who they are");
  - **place:** each gazetteer and typed place name once, joined with " · ", then the environment;
  - **faction:** type · territory · stance;
  - **session:** day · who was there · hours.

  An empty summary isn't drawn.
- **A member's clocks:** for each faction in `Engine.factionsKeyFor(t, member.id)`, `Engine.clocksOn(t, { kind:
  "faction", id })`, in faction order, each drawn as U2's clock line with the faction as its owner link.
  - **Edges:** a faction gone, or a clock that's full (it reads **Full**).
  - **Bad input:** a Key NPC entry that isn't a cast id gives nothing.
- **The place card's dedupe:** compare the names case-insensitively and trimmed, and keep the first occurrence.
- **Thread:** `S.editing.kind === "thread"` puts that one row in edit. Opening another closes the first.

## 9. The UI

**Ken's shape answers (2026-11-06):**
- **Always read:** every record opens in its read view.
- **Summary, then want:** the dossier leads with who they are, then what they want.
- **Inline, one at a time:** a note opens in place, and opening another closes it.

**The brief's direction holds:**
- the Night-Shift Readout world, with no new visual world;
- the Four Voices;
- Mode: *Read* for the dossier and *Operate* for Edit.

**The dossier** (member, place, faction, session):

- **The bar:** Back as today (and Add to <encounter> on a member, Decision 258). **Edit** sits on the `h1`'s row
  (as U2's encounter Rename does), a `.btn sm`.
- **The order for a member:**
  1. the name (display face, `h1`), then the status as a `.tag.plain` when it isn't Alive;
  2. **the summary line** (Inter, `--text`), the `flavor`;
  3. **Wants** and **If pushed** (Mono Caps labels in `--dim`, Inter prose);
  4. **Their line** as a quote: an Inter italic line with a 2px `--violet` rule at the left, no quote marks
     (*the one italic*: DESIGN.md allows italic for quoted speech; the builder checks this and, if it doesn't,
     drops the italic);
  5. **Clocks** (UQ30), as U2's clock lines;
  6. the stat block via `readBlockHtml`. From 1280px it's 258's right-hand panel, as today;
  7. then **Got** (resources), **Description**, the Codex line (origin · roles · enemy role · tier), **Fights with
     the crew** as a `.tag.plain` when set, affiliations, **Key to**, **Between them and the crew** (179, unchanged:
     its own add row and line edits), and **GM note** last.
- **The order for a place:**
  1. the name;
  2. the summary;
  3. **Clocks**;
  4. **Notes** (prose);
  5. the site (251's profile, read);
  6. **What happened here**;
  7. **Met here**;
  8. **From the book**.
- **The order for a faction:**
  1. the name;
  2. the summary;
  3. **Wants**;
  4. **Clocks**;
  5. **Key NPCs**;
  6. **Resources & reach**;
  7. **Tipping points**;
  8. **Attention** (a `.tag.plain`);
  9. **Notes**;
  10. **Tied by affiliation**;
  11. **From the book**.
- **The order for a session** (UQ31):
  1. the name;
  2. the summary (day · who · hours);
  3. the play rows: Who, Hours, **Open a thread**, the lines with their add row, *Jotted*, and Close out;
  4. **Debrief** (U2's fold, read as prose, with its parts under Edit).
- **Empty fields aren't drawn.** A record with nothing but a name shows the empty-state line (UQ26).
- **Measures:** prose 75ch, as 258.
- **No new colour role.** Clock lines keep U2's styling.

**Edit:**
- Edit swaps the dossier for today's form, the same fields in the same order, bound as today.
- The bar's first button becomes **Done**. Back is hidden while editing, so the bar never says two ways out.
- Done returns to the dossier with focus on **Edit**. **Delete** is at the form's foot, as today, and only here.
- A redraw while editing (a typed field's `update(false)`, an Undo) stays in Edit.
- On a phone, header plus bar stays within 20% at 390px (Done is one `.btn sm`).

**Threads** (UQ34):
- A row reads as the title (a `cast-open` button that opens its More: notes as prose) plus **Make current** or
  **Current**, then **Edit**.
- Edit turns that row into today's controls (title input, status, closed in, notes, Delete) with **Done**.

**Notes** (Ken: inline, one at a time):
- **The list:** one row per note, its title (or first line) as a button, then its session as a `.tag.plain`.
- **Pressing a row** opens it in place: the text as prose, with **Edit**. It closes any other open note
  (`S.noteOpen`).
- **Edit** shows today's three fields and Delete, with **Done**.
- **New note** sits below the list (UQ29). It adds a note, opens it in Edit, and focuses its title.
- `openNote(id)` (Jot's *Jotted*, Find) opens the note to read and focuses its title button.

**Add below the content** (UQ29): places, factions, threads, sessions, notes, encounters and a record's clocks put
their add row after their list. Cast's quick-add keeps its place.

**Tab focus** (UQ33): a tab press puts focus on the tab pressed, after `renderTableChrome` rebuilds the row.

**Where things land:**

| Press | Lands on | Focus | Clears |
|---|---|---|---|
| Open a record (card, link, Find) | its dossier | as today (the record's title, or Find's field when it's in the dossier) | `S.editing` |
| Edit | the form | its first field | — |
| Done | the dossier | **Edit** | `S.editing` |
| Back (from the dossier) | where it came from, as today | as today | `S.editing`, `S.noteOpen` |
| A tab press | the tab's list | the tab pressed | `S.editing`, `S.noteOpen` |
| A note's row | the note, open | stays on the row | the other open note |
| Find on a field only under Edit | the form | that field | — |
| Delete (in Edit), confirmed | the list | the next card, or the tab | `S.editing` |
| New note | the new note in Edit | its title field | the other open note |

**Copy for the voice pass** (the builder pastes each into the PR as it renders):
- **The dossier:**
  - **Edit**, **Done**;
  - **Wants**, **If pushed**, **Their line**, **Got**, **GM note**, **Clocks**;
  - the empty state.
- **Threads:** **Make current**, **Current**.
- **Notes:** the row and **Delete "<title>"?**.
- **The place card:** "N things happened here".
- **The place page's site line,** in place of "Slot in a pack that has them, on Threats."

## 10. Worked examples, as named tests

The builder writes these first and shows each failing on `main`, or says why one already passes.

| Test | File | Pins |
|---|---|---|
| `U3: a member opens to read, and Edit opens today's form` | `smoke-table-cast.test.mjs` | Ibarra: no `input, select, textarea` in `#main` outside the bar, the clock lines and Between them (179); `h1`, then the summary, then Wants before any field; Edit → `[data-cf="motivation"]` present; Done → focus on Edit |
| `U3: a member's dossier shows the clocks of the factions they're key to` | `smoke-table-factions.test.mjs` | Ibarra: "Ibarra's patience 4 of 6" with − and +; + → "5 of 6" and the faction card agrees; a member key to nothing has no Clocks block |
| `U3: the dossier leaves out what's empty` | `smoke-table-cast.test.mjs` | a member with only a name: no Wants label, the empty-state line, and Edit |
| `U3: Notes lists titles and opens one at a time` | `smoke-table-play.test.mjs` | Dead Air: 8 rows, 0 textareas; open one, then another: one open; Edit → 3 fields; Delete's ask names the note |
| `U3: a place card names each place once and says what happened` | `smoke-table-city.test.mjs` | Achterberg's Clinic: "Techtopia · Central City · The Annex · 3 things happened here"; a Gateway card names Gateway once |
| `U3: Sessions is one column, newest first; Add sits below its list` | `smoke-table-play.test.mjs` | `[data-snew]` after the last `.sess-item` in document order; the order 7, 6, 5… (the column count is phone-check's) |
| `U3: a tab press keeps focus on its tab` | `smoke-table-frame.test.mjs` | Cast, Sessions, Notes and City: `activeElement` is the tab's button, never an Add field |
| `U3: a thread reads as a title with Make current, and Edit opens its fields` | `smoke-table-play.test.mjs` | a non-current open thread: "Make current", `aria-pressed=false`; press → "Current", pressed; no `[data-thtitle]` until Edit |
| `U3: Find on a field under Edit opens Edit and lands on it` | `smoke-table-cast.test.mjs` | a hit in Ibarra's GM note: the form, focus on `[data-cf="gmNote"]` |

## 11. Tests beyond the examples

- **Voice:** every new string passes `voice.test.mjs`. **11px and tokens:** `build.test.mjs`. No `style=` in `gm.js`
  but the segment transform.
- **Phone-check:**
  - add a dossier and an Edit page per width, header plus bar within 20% at 390px;
  - the `cards` columns are 1 / 2 / 3 at 375 / 1024 / 1440, and every roster at one width agrees;
  - Sessions' list is one column.
- **Mutation-test:**
  - the read view's "no fields": put one `[data-cf]` input back in the dossier, and the first example fails;
  - Done's focus: drop it, and the example fails;
  - the note's "one at a time": let two open, and the Notes example fails;
  - the breadcrumb dedupe: remove it, and the place example fails.
- **Expected breaks, updated, not stops:**
  - every smoke test that types into or presses a field now under Edit. The pre-flight's sweep found about 377 lines
    across 13 files that touch these attributes. The most are in `smoke-table-cast` (124: 69 on `data-cf` alone),
    `smoke-table-play` (118), `smoke-table-factions` (37), `smoke-table-city` (35), `smoke-table-frame` and
    `smoke-table-sites` (16 each), `hostile` (13), and `phone-check` (5). Many are Back presses that don't break.
    Count the real breaks in the PR by file, old → new;
  - "N lines" in `smoke-table-city`/`-sites`;
  - the Notes tests;
  - the thread tests that type into `[data-thtitle]`;
  - `phone-check`'s cast-page walk (`:407`), if it reads a field;
  - `frame-fixture.json` frames whose lists change columns (re-record those only, and name them);
  - version literals.
- **The carried rules:** every test that presses inside a fold opens it first and asserts it's open (`openFold`).
  After any failure the builder thinks is timing, rerun the full `npm run verify` and paste both totals.

## 12. Steps

1. `git submodule update --init private`, then `npm run test:fast` (a fresh branch from `main`).
2. Write §10's tests and show them failing on `main`.
3. Read `craft-floor.md`. Run **`/impeccable distill`** on a member's page (Dead Air, Ibarra) and on Notes. Build the
   member dossier, Edit and Done, and the member's clocks. Then `npm run verify`, and check in the dev preview.
4. Places, factions, sessions and threads: dossier and Edit. Then `npm run verify`.
5. Notes: the list, one open at a time, Edit. Then `npm run verify`.
6. Run **`/impeccable layout`** on the lists (Add below, card grids, Sessions' column, the place card). Build them and
   tab focus. Then `npm run verify` and `npm run phone-check`.
7. Run **`/impeccable typeset`** on the dossier (the Four Voices, the quote, the summary line). Then `npm run verify`.
8. **The plan §3 gate:** inject the browser overlay at 1024px and 375px on **Dead Air**, with the tab fronted, on:
   - a member's dossier and its Edit;
   - a place;
   - a faction;
   - an open session;
   - Notes with one open;
   - Sessions' list;
   - the City places grid.

   Fill every cell.
9. **`/impeccable polish`** on the pages touched, reading U2's snapshot.
10. Close-out (§14). **After merge:** **`/impeccable document`** records GM mode's components in DESIGN.md (plan §1).
    The conductor runs it or starts a session for it. It isn't the builder's.

## 13. Stop and ask

**Stop** (to the conductor) if:

- a stored field turns out to be needed (no schema bump is in this order);
- an engine reader seems needed. Say which, and why the UI can't compute it;
- the dossier can't keep header plus bar within 20% at 390px with Edit or Done. Report the measure. **Don't move a
  button off-screen to fit**: that was U2's miss;
- a decision outside 176, 179, 204, 208, 243, 244, 258 and 270 needs a supersession mark;
- **an Impeccable command wants to change anything outside §9** (a colour role, the form's fields, another tab, U1's
  or U2's screens). Report what it proposed and don't apply it. A change to §9's own arrangement is a stop too.

**Not stops** (expected, and updated in place): §11's expected breaks and the version literals.

## 14. Close-out

- **The tier's items** (`close-the-session`):
  - the decision and its INDEX line, with supersession marks on 176, 204, 208, 243, 244 and 258;
  - `CHANGELOG.md` lines in player voice, then `npm run changelog`;
  - `npm run bump -- 0.65.0` (or the next minor);
  - a log entry;
  - STATE rewritten where it names U3, with U5 next;
  - the plan's §4 row marked built;
  - a row in `docs/log/shipped.md`.
- **The changelog** (a draft, for a voice pass):
  - "Cast members, places, factions and sessions open to read: who they are, what they want, their line and their
    clocks first. Edit opens the fields."
  - "Notes is a list you open one at a time."
  - "Add sits under each list, Sessions reads newest first in one column, and a place's card names each place once."
- **The PR:**
  - Title: `U3: Read first (gm-at-the-table; Decision N)`, with the template's sections.
  - **Where the order didn't fit** (required; "Nothing" is fine).
  - An **Impeccable** section (plan §3.8): distill, layout, typeset and polish, each with the screen it ran on and
    what it changed, or "nothing", plus §12.8's overlay grid with every cell.
  - Every expected break, old → new, by file.
- **The re-critique** (plan §3.6): the reviewer runs `/impeccable critique` on GM mode with Dead Air seeded, commits
  the snapshot, and sets its table beside U2's (28/40).

**Review checklist** (beyond the tests passing):

- [ ] Run it in the dev preview with Dead Air seeded, at 1024px and 375px, by mouse and by keyboard alone:
  - open Ibarra, read to Wants with no field in the way, Edit, change a line, Done (focus on Edit);
  - Ibarra's clock + (the faction card agrees);
  - each of a place, a faction and Session 7: the dossier, Edit, Done;
  - Notes: open two in turn, then Edit and Delete (the ask names it);
  - tab presses: focus stays on the tab;
  - Find a member's GM note: it lands in Edit, on the field.
- [ ] Every new piece of view state is cleared where §9's table says. Probe the U2 kind of leak: Edit a member, go
      to another tab, come back, and the member opens to read.
- [ ] No field in a dossier but §9's play controls. No Delete outside Edit.
- [ ] The card grids are 1 / 2 / 3 at 375 / 1024 / 1440 on every roster. Sessions is one column.
- [ ] Header plus bar is within 20% at 390px on a dossier and in Edit, and the strip's lead is ≥ 120px there.
- [ ] Every test that presses inside a fold or a note opens it first.
- [ ] Every new tag that isn't a tip is `.tag.plain`. Every label is ≥ 11px. Every colour role matches §9.
- [ ] The overlay grid has every cell, on Dead Air, with the tab fronted.
- [ ] The Impeccable section names all four commands, and its "nothing outside §9" line is true. Spot-check one
      claimed change against the diff.
- [ ] Every new string is in the PR for the voice pass.
- [ ] 270's Touches and every superseded entry is marked, with INDEX to match.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md`, with this order's path, `docs/plans/gm-at-the-table/U3-read-first.md`. Both
sessions are **local**, where Impeccable is installed. The conductor adds the same Impeccable lines as for U1 and U2:
run §12's commands through the Skill tool and nothing else, and treat a command reaching outside §9 as a stop.

This order's traps:

- **Most of the suite types into fields that move under Edit.** Write an `edit(app)` helper in the smoke kit (it
  presses Edit and asserts the form is there) and use it everywhere, rather than letting a test reach a field that's
  only there in jsdom.
- **`showThread`, `openNote` and `openFound` focus fields** (`[data-thtitle]`, `[data-ntext]`) that won't exist in
  the read view. Each needs a new landing (§9's table). U2's strip jumps to a thread through `showThread`.
- **View state that outlives its record.** Clear `S.editing` and `S.noteOpen` on every route away (U2's
  `S.keepUnx`).
- **The stat block panel from 1280px** (258) is `.cast-panel`, sticky. The read view keeps it, and `phone-check`'s
  cast walk reads it.
- **Cast's quick-add stays put** (UQ29's default). Don't move it with the other Adds.
- **The overlay's chrome findings are known false positives:** the brand violet and cyan, and Inter. Only content
  counts.
