# Work order U2: Tonight

**Plan:** [`../gm-at-the-table.md`](../gm-at-the-table.md), session U2. It owns findings #9–#15 (plan §2), plus KQ3's
"running encounter, distilled", which Ken carried here from U1 on 2026-11-06.
**Status:** **drafted 2026-11-06 by Claude (Opus)**, U4's reviewer acting as orchestrator, for Ken's approval.
**Ken's shape answers** are in §9's head. They came from `/impeccable shape` on the strip and close-out's end, run
by the conductor with Ken (2026-11-06; plan §3.1). UQ18–UQ25 (§4) are this order's own questions, from the shape
brief's open items and the pre-flight. **Approved by Ken 2026-11-06** ("for U2, lets take all the defaults", in
the conductor session): UQ18–UQ25 are each their default, and the strip's *Unexported* runs Export when tapped
(the order's reading of "Each item jumps": nothing on the strip changes the table).
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs beside:** nothing. A separate *Fix* session (local_f2c60d31) is fixing `npm run phone-check` on `main`
(five OVER rows that predate U4) and the `tick(80)` flake in `smoke-table-seats`. **U2's phone-check gate depends on
it:** if that Fix hasn't merged when U2 builds, the gate is "no OVER row that `main` doesn't have" (§11), not "passes".

**Pre-flight:** against `main` at `3c10101` (PR #306, U4, merged: app 0.63.1, game data 0.53, character schema
0.34, table schema 0.19, pack schema 0.3). Findings:

- **The bar isn't on the tabs.** `.tbl-bar` is drawn only on a page with a Back (`gm.js:829`, `:1427`, `:1746`,
  `:2047`, `:2344`, `:2680`, `:2693`, `:3807`, `:3865`). A tab's list has none, and **Decision 258 rejected "the bar
  on every tab"**. A strip that shows on every tab has to supersede 258 in part. The plan's one-line summary said so;
  the decision below says exactly how.
- **The running encounter's page has `.enc-bar`, not `.tbl-bar`** (`gm.js:3396`). It already reads "Round 2 ·
  Reclaim drone". A strip there would say it twice (UQ20).
- **`tableChange(…, false)` skips the page's redraw** (`shared.js:282`, `update(false)`). That covers a clock's + and −
  (`gm.js:1689`), Jot's save (`:579`), close-out's fields and every typed field. A strip drawn inside
  `renderTable()` would go stale on exactly the changes it reports ("4 of 6", *Unexported*). It has to be painted
  from `update()`, the way `renderLedger()` is, after `saveTable()`.
- **Jot's session rule is shared.** `_sessionOnDay` (`engine.js:7048`) gives both a jot (`addTableNote`, `:7059`)
  and a new interaction (`addInteraction`, `:7239`, Decision 203) "the one session dated that day". UQ3 changes
  Jot's rule only. An interaction keeps 203's.
- **Next session's "last session" disagrees with an open session.** `nextSession` (`engine.js:7990`) treats a session
  dated *today* as the one being played and shows the one before it as "Last session set up". A session resumed on
  another night (finding #12's case) is "last", so its own seed would read as last session's. On Dead Air today
  (2026-11-06), Session 7 (10/31, not closed out) is both.
- **Two of Dead Air's clocks have no owner** (`on: null`, `tools/sample-table.mjs:416`, `:421`): *The Ports wake*
  (5 of 12) and *Dex before the full moon* (7 of 8, the nearest to full on the table). `clocksOn` needs an owner
  (`engine.js:7722`), so they show nowhere today. Find can't open them either (`openFound`, `gm.js:536`, returns on
  no owner). A strip that names the nearest clock needs somewhere to jump to (UQ19).
- **Finding #11 reproduced** in the dev preview: Home scrolled to 41px, then Open, gives Sessions at `scrollY` 41
  with focus on `<body>`. Opening on Players lands focus in Add a player (`keepPlace`'s fallbacks, `gm.js:397`).
  `openTable` (`gm.js:128`) never scrolls.
- **The close-out's end:** Write the award log (`gm.js:2377`) returns to the session page with focus on the
  Close-out heading. The log is listed there, then Redo, then **Delete** (`:2062`). Export is only under ⋮
  (`gm.js:301`, `exportTable`, which already marks the entry exported).
- **A live session's page** draws the Campaign Journal's six parts as open textareas (`JOURNAL`, `gm.js:1893`,
  drawn at `:2055`).
- **Clock counts:** a place's, faction's and encounter's card say "1 clock · 1 full" (`clockCountText`,
  `gm.js:1665`; callers `:1224`, `:1604`, `:2871`). Three test files pin "1 clock" (§11).
- **The running encounter:** its title is a Name input (`gm.js:3412`), there's no `h1` while it runs, and each row
  has a Combat Sense field in its head (`:3126`). That field is clicked by 13 assertions in `smoke-table-play`.
  More (`:3096`) holds Take, Add a Condition, Delay, then Name, Goes last / Out, Side and Remove, in one run.
- **The Hit panel's order** (`encHitHtml`, `gm.js:3025`): damage, Type, Kind, AP, Where, the seat's asks, From, then
  Apply · Cancel and the preview. On a phone, damage and Apply are a screen apart (U1's critique).

**Carried over:**
- **U4's misses, the order's:**
  - **Name every colour role by level.** U4's order said "Overcast Steel" for every Mono Caps label, and the
    section rule had to go to Aether Pulse after review (KQ-U4a, Ken: violet). Here §9 names each new label's
    colour.
  - The phone-check budgets carry: **the tables bar 20%**, **the encounter bar 27%**. The strip lives in the
    tables bar.
- **U4's misses, the build's:**
  - **A disabled or dimmed rule on the sheet's copy caught its readers** (the sheet draws readouts as buttons). Any
    rule here over `button`, `:disabled` or `.btn` is swept for readers, by grep.
  - **Take pressed inside a closed More, again** (U1's miss, repeated in U4's test). Every test that presses a
    control inside More, Combat Sense's new place included, opens More first and asserts it's open.
  - **Verify left unrerun after a flake.** After any failure the builder thinks is timing, rerun the full
    `npm run verify` and paste both totals.
- **U1's misses:**
  - **A ≤640px height change moves the `scroll-margin-top` that depends on it** (U1's actor under the wrapped bar).
    The strip can change the tables bar's height, and everything that scrolls to a row under it must clear it.
  - **A tag that isn't a tip is `.tag.plain`.**
  - **The overlay grid comes from Dead Air**, every cell filled, with the tab fronted.
  - **No type under 11px** (the build guard).
- **Leads from U4's re-critique that fit U2's findings:**
  - Focus falling into an Add field when a table opens (#11).
  - The seat card's dim SAN / Luck / Çredits line isn't U2's (U3, below).
  - **The rest are carried to U3** (plan §4's U3 row, added by this order's PR): every tab focuses its Add field,
    "Slot in a pack", "Delete this note?" not naming the note, modal titles in the display face, the seat card's
    dim vitals line, and a raw TAG shown as a seat's name.

---

## 1. Goal and Done when

From any tab, a GM mid-session sees where the night stands in one glance (who acts, who's down, the thread, the
clock about to fill, whether it's saved) and reaches any of it in one tap. A session played over two nights files
its jots to itself. Closing out ends with the table exported. The running fight reads as play, not as a form.

**Done when** (Dead Air seeded, *Achterberg's clinic, moonrise* running, today after 10/31):

1. **(#9)** On every tab and page except the running encounter's own (UQ20), a **Tonight** strip sits in the
   tables bar. It reads, in priority order:
   - **Round 2 · Reclaim drone**, then who's down (**Down: Reclaim cleaner B**);
   - the current thread (**What spoke in the dead air?**);
   - the clock nearest full among those within two of full (**Dex before the full moon 7 of 8**);
   - then **Unexported**.
   Each item is a button that goes where its words say (§9's table). At 375px the first item and *Unexported* show,
   and from 768px every item does.
2. **(#10)** *Unexported* shows whenever the table has changes no exported file holds, and goes the moment Export
   runs, from ⋮ or from close-out's end.
3. **(#11)** Opening a table from Home lands at the top of its tab, with focus on the page's `h1`, whatever Home's
   scroll was.
4. **(#12)** With no session dated today, Jot files to the open session (UQ18): on Dead Air, Session 7. Jot's line
   says so before saving: "Goes with Session 7."
5. **(#13)** Write the award log ends on a close-out page of its own:
   - "Session 7 is closed out", then the awards, a line per name;
   - **Export the table** as the one primary button, with **Done** beside it.
   - Export downloads the file and *Unexported* goes. Done returns to the session page, with no Delete in reach of
     the end.
6. **(#14)** The open session's page folds the six Campaign Journal parts under one **Debrief** disclosure, closed,
   until the session is closed out (UQ25). Number, day, who, hours, its threads, lines and jots stay open.
7. **(#15)**
   - Every card that counts clocks lists each one instead: "Ibarra's patience 4 of 6", with − and +.
   - Next session leads with **Close to full**: every clock within two of full, ownerless ones included, each with
     − and + and its owner as a link (UQ19).
   - The strip's clock item goes to its row there.
8. **(KQ3) The running encounter:**
   - Its title is the page's `h1`, with **Rename** beside it (UQ23).
   - Each row's Combat Sense reads as text in its head, and its field is under More.
   - More is three groups: **Play** (Take, Add a Condition, Delay), **Setup** (Name, Combat Sense, Goes last / Out,
     Side) and **Remove**, apart from both.
   - On the Hit panel, the damage field, Apply · Cancel and the preview come first, and the other fields after them
     (UQ24).
9. **The gate.**
   - The browser overlay is clean on every section touched at 1024px and 375px, or each finding is named.
   - Header plus the tables bar stays within 20% at 390px, and header plus the encounter bar within 27%.
   - The reviewer's re-critique scores **H1 and H6 above U4's 3 and 2**, and H8 at or above 2.

## 2. Tier, versions, numbers

- **Rule or shape:**
  - a player-facing behaviour someone could have chosen otherwise (the strip, what it shows and when);
  - an engine rule (Jot's session, the open session);
  - a decided rule reopened (208, UQ3).
- **App:** a minor, 0.63.1 → **0.64.0**, or the next minor on `main` when built.
- **No schema bumps** (game data, character, table or pack): the open session is computed, the folded debrief is
  view state on `S`, and close-out's end stores nothing. If any of them turns out to need a stored field, that's a
  stop (§13).
- **Decision:** one, numbered **N**, the next free number on `main` when built (`CLAUDE.md`, *Decisions*; 269 is
  the last today, so probably 270).

## 3. The decision, drafted

```
N. **A table at play shows one Tonight strip; the open session is the latest one not closed out, and Jot files to it; Close out ends on its awards and an Export; a running encounter reads as play.**
     *2026-11-06 · Ken + Claude · Touches: Tonight strip, tbl-bar, enc-bar, openSession, nextSession, last session, Jot, jotWhere, addTableNote, _sessionOnDay, Unexported, tableUnexported, exportTable, markTableExported, openTable, scroll, h1 focus, close-out's end, writeCloseOut, Debrief, JOURNAL, Close to full, clocks, clockCountText, clock +/−, encounter title, Rename, data-enc-title, Combat Sense, data-eorder, More, Play, Setup, Remove, Hit panel order, encHitHtml, phone-check, Decision 203, Decision 204, Decision 205, Decision 208, Decision 245, Decision 258, Decision 269*
     - **Decided:** The open session is the latest session not dated after today, while it isn't closed out (`Engine.openSession`). A jot files to it; an interaction keeps 203's day rule. While an encounter runs or a session is open, the tables bar holds a Tonight strip on every tab and page but the running encounter's own: round and actor, who's down, the current thread, the clock nearest full within two, and Unexported, each a button to where it is, read from the engine and stored nowhere. Next session leads with Close to full (every clock within two of full, with − and +) and counts an open session as being played. A card lists its clocks as "4 of 6" with − and +. Writing the award log ends on its awards with Export the table first and Done. The open session's debrief folds until it's closed out. A running encounter's title is a heading with Rename, Combat Sense is text on its row, and More is Play, Setup and Remove. A table opens at the top.
     - **Why:** the critique of 2026-11-05 found a running table spread over five tabs, a save state shown only on Home, and jots lost after midnight; Ken ruled GM mode play-first. His shape answers put the fight first, made each strip item a jump, never an action, and made Export the close-out's one primary press.
     - **Rejected:**
       - A live block at the top of Sessions (UQ7): it repeats the tab-hunting.
       - Actions on the strip (+ on a clock, Next): a mis-tap mid-scene changes the table from a strip of readouts.
       - The strip as a second sticky band under the bar: two bands cost a phone a third of its screen.
       - Jot to the session dated today only (208): a game past midnight, or a session resumed on another night, jots to nothing.
       - The latest session even when it's closed out: a closed night would keep collecting jots.
       - Exporting by itself at the close-out: a download nobody asked for.
     - **Replaces:**
       - Decision 208 in part: a jot's session is the open session, not the one dated today.
       - Decision 258 in part: while the strip shows, the bar is on every tab, not only on a page.
       - Decision 204 in part: Next session leads with Close to full, and an open session counts as being played, as one dated today does.
       - Decision 269 in part: More is grouped, and a running row's Combat Sense is under it.
       - Extends 205 (the close-out's end), 245 (a clock's − and + on a card and on Next session) and 203 (unchanged for interactions).
     - **Revisit if:** a GM runs two sessions at once, the strip can't hold its first item at 375px, or seats let a player jot.
     - **Built:** app 0.64.0; PR #…; log 2026-11-…
```

`docs.test.mjs` checks the shape. The builder pastes this and fills *Built*. It adds the INDEX §3 line under GM
mode's sessions, and marks 208, 258, 204 and 269 `→ **Superseded in part by Decision N**` with each one's clause,
with their INDEX lines to match.

## 4. Questions for Ken

The plan's UQ3 (Jot to the latest session not closed out), UQ7 (the strip) and UQ8 (Export at close-out *and* the
marker) are answered by default. This order relies on them.

| Id | Question | Default |
|---|---|---|
| **UQ18** | **What is "the open session"?** It is what Jot files to, what the strip counts as open, and whose debrief folds. Options: the latest session not dated after today, while it isn't closed out; or the one dated today, else that | **The latest session not dated after today, while it isn't closed out.** It covers a game past midnight and a night resumed later. A session dated next week is planned, not open. With the latest closed out, none is open, and Jot goes to the notes as today |
| **UQ19** | **Where clocks near full live.** Dead Air's nearest (*Dex before the full moon*, 7 of 8) has no owner, so no page shows it. Options: Next session leads with **Close to full**, every clock within two of full, any owner or none, with − and +; or the strip only | **Close to full on Next session.** It gives ownerless clocks a home, it's what a GM checks at the top of the night, and the strip's clock item has somewhere to land |
| **UQ20** | **The strip on the running encounter's own page?** | **No.** Its bar already reads "Round 2 · <actor>", and a second line takes it past 27% on a phone. *Unexported* still shows on every other page |
| **UQ21** | **The thread item when no thread is marked current** | **No thread item.** Decision 204 allows one current at most, and Next session lists the open ones. The strip doesn't guess |
| **UQ22** | **When the session's items leave the strip:** at Write the award log, or at Done | **At Write.** The session is closed then (UQ18). The end page still offers Export, and *Unexported* stays until it's done |
| **UQ23** | **The encounter's title as a heading:** while it runs only, or while it's planned too | **While it runs.** A planned encounter is prep, and its Name field is where a GM types it. Ended ones are already a heading |
| **UQ24** | **The Hit panel's new order** (damage, Apply · Cancel, preview, then Type, Kind, AP, Where, From): at every width, or at ≤640px only | **Every width.** One order is one thing to learn and test, and the fields below still change the preview while Apply stays put (U1's rule) |
| **UQ25** | **What the folded debrief shows while closed** | **"Debrief · 6 parts, 1 written"** (the counts from the journal), opening in place. It opens by itself on a closed-out session, and the GM can open it any time |

## 5. The assumption sweep

| What changes | True today, where | True after | Readers (by grep) |
|---|---|---|---|
| Open session | none; `_sessionOnDay` (`engine.js:7048`) | `Engine.openSession(t)` → a session or null (§8) | new: Jot, `jotWhere`, the strip, the debrief fold, `nextSession`. **Not** `addInteraction` (203 stays): it keeps `_sessionOnDay` |
| Jot's session | `addTableNote(…, { date, jot:true })` takes `_sessionOnDay` (`:7059`) | with `jot:true` and no `session`, takes `openSession(t)`'s id | `engine.test.mjs:6584` ("208: a jot takes the one session on its day…"): **expected break**, rewritten to the new rule. The Notes tab's New note (`gm.js:429`) passes neither, so stays null |
| `jotWhere` | "Goes with Session N." / "…No session is dated today." (`gm.js:559`) | "Goes with Session 7." from `openSession`; with none, "Goes on the table's notes. No session is open." | `smoke-table-play:1436`, `:1494`: **expected break** (the second's words) |
| `nextSession.last` | the highest session not after today, or the next one if that's dated today (`engine.js:7993`) | the same, but "dated today" becomes "is the open session" | Next session's "Last session set up", "Met last session" (`gm.js:1985`, `:1989`). Tests on 204 in `engine.test.mjs` (grep `nextSession`): those dated today still hold; add the resumed case |
| Strip | none | painted from `update()` after `saveTable()` (`shared.js:282`), in `.tbl-bar` | `bindTable`'s `:scope > .tbl-bar` (`gm.js:402`) keys its scroll place; `smoke-table-frame:80` ("the page's first element is the bar"); `phone-check.mjs:252` (finds `.tbl-bar, .enc-bar`), `:336` (`BAR_MAX`). The strip must not make a tab's list "a page" to those readers |
| Bar on a tab | absent (258 rejected it) | present while the strip shows; absent otherwise | `smoke-table-frame` tab tests; `phone-check`'s `list: true` walks (`:293`, `:309`, `:311`, `:313`, `:317`): add a strip row per width |
| *Unexported* | Home only (`gm.js:192`, `tableUnexported`) | the strip too, from `lastTableSaved` (`gm.js:21`) | `exportTable` → `markTableExported` (`:53`) must repaint the strip. Home's own line is unchanged |
| `openTable` | no scroll, focus by `keepPlace` (`gm.js:128`, `:397`) | `scrollTo(0,0)`, focus the page's `h1` | callers `gm.js:177` (import), `:253` (Run a table: focus goes to New session, **keep that**), `:254` (Open) |
| Close-out end | back to the session page, focus `[data-sco-h]` (`gm.js:2390`) | the end page (§9); Done → the session page, focus `[data-sco-h]` | `smoke-table-play` (grep `data-co-write`, `data-sco-h`), `hostile.test.mjs` (`data-co-write`): expected update where a test expects the session page straight after Write |
| Debrief | six textareas (`gm.js:2055`) | in a `<details>`, closed on the open session | `smoke-table-play` and `hostile` type into `[data-sj]`. jsdom reaches a closed `<details>`; **tests open it first** (the carried-over More rule). Find's hit on a journal field (`openFound` → `land("h1")`, `gm.js:523`) must open the fold when it lands on a part |
| Clock lists | "1 clock · 1 full" (`clockCountText`, `gm.js:1665`) | one line per clock, "<name> 4 of 6" with − and + | `smoke-table-encplan`, `-factions`, `-sites` pin "1 clock": **expected breaks**. **Twins:** a clock's own `clockHtml` (`:1644`) and `bindClocks`' label (`:1689`, "<name>: 4 of 6", U4) say the same count |
| Close to full | none | Next session's first block | `nextSessionHtml` (`gm.js:1976`); its empty-state lines (`:1979`, `:1981`) must still show when nothing is open **and** no clock is near full |
| Encounter title | Name input while not ended (`gm.js:3412`) | running: `h1` + Rename (name modal); planned: as today | `smoke-table-encplan` (1), `smoke-table-play` (4) use `data-enc-title`: running ones are **expected breaks**. `openFound` lands `[data-enc-h]` then `[data-enc-title]` (`gm.js:550`): fine. U1's announcer region is unaffected |
| Combat Sense | a field in the row's head (`gm.js:3126`) | running: text in the head, the field under More's Setup; planned: as today | 13 `data-eorder` uses in `smoke-table-play`: they still find the field. **Tests that type into it on a running encounter open More first**. The U1 test of More's order (`order.slice(0, 3)` = take, cond, delay) still holds; extend it to the groups |
| More | one run (`gm.js:3096`) | Play · Setup · Remove, each under a Mono Caps sub-label | `encSideHtml`'s More (`:3303`) is a side's, not a row's: **unchanged** |
| Hit panel | fields, then Apply, then preview (`gm.js:3025`) | damage, Apply · Cancel, preview, then the rest | `smoke-table-play` U1 test "Apply sits above the preview" (still true); `phone-check`'s Hit panel walk (`:318`) reports the panel's top |

The three questions, answered by grep at the pre-flight:

- **Which guards read a value this changes?**
  - `voice.test.mjs` reads every new string.
  - `build.test.mjs` checks that colours are tokens, that no screen text is under 11px, and (U4) that `gm.js` has no
    `style=` but the segment transform. The strip must not add one.
  - `phone-check`'s 20% and 27%, and its `BAR_MAX` (56px on touch) for a `tbl-bar`.
  - `engine.test.mjs`'s totality over the hostile table must cover `openSession`.
- **Where does each new note or number render?**
  - A clock's "4 of 6": its own block, a card's line, Close to full, the strip, and Activity's label (U4). Five
    twins, one number.
  - *Unexported*: Home's card and the strip.
  - The open session: the strip, Jot's line, the debrief fold, and Next session's "last".
- **What text points at what this changes?**
  - `jotWhere`'s lines.
  - The Sessions empty state ("Start a session when you sit down to play…", `gm.js:1979`), which still holds.
  - Decision 258's text ("the bar on every tab" rejected), superseded here.
  - Home's note ("Tables stay in this browser…", `gm.js:208`), which still holds.
  - No `appCopy` or data note names Jot's rule (grep `dated today` over `src/`: only `jotWhere`).

## 6. Read first

- `CLAUDE.md`: constraints 1, 5, 7 and 8, *Change tiers*, *Decisions*.
- `DESIGN.md`:
  - *Readouts*, and the Four Voices and Mono Caps rules (section rules in Aether Pulse, `--violet-text`;
    field and item labels in Overcast Steel, `--dim`);
  - *Colors* (cyan = where you are, magenta = harm, gold = to spend);
  - *Touch targets*.
- Decisions:
  - 203, 204, 205 and 206 (sessions, threads, Next session, the close-out);
  - 208 (Jot), 212 (the activity log), 245 (clocks), 258 (the frame and the bar);
  - 259 (keys: nothing here adds one);
  - 164 (`keepPlace`), 165 (`scroll-row`), 269 (U1's row).
- `src/ui/gm.js`:
  - storage: `saveTable`, `markTableExported`, `tableUnexported`;
  - opening and chrome: `openTable`, `renderTableChrome`, `renderTable`, `bindTable`;
  - Jot and Find: `openJot`, `jotWhere`, `openFound`;
  - sessions: `nextSessionHtml`, `sessionPageHtml`, `closeSheetHtml`, `bindCloseOut`, `closeOutSectionHtml`;
  - clocks: `clockHtml`, `bindClocks`, `clockCountText` and its three callers;
  - the encounter: `encPageHtml`, `encRowHtml`, `encHitHtml`.
- `src/ui/shared.js`: `update`, `keepPlace`, `takeFocus`, the `#announcer` region.
- `src/engine/engine.js`: `_sessionOnDay`, `addTableNote`, `addInteraction`, `nextSession`, `sessionList`,
  `clocksOn`, `encounterView`.
- `.impeccable/critique/2026-11-06T17-19-53Z__src-ui-gm-js.md` (U4's re-critique, 27/40) and the shape brief in
  §9.
- Impeccable's `craft-floor.md`, read before the first UI edit (plan §3).

## 7. Out of scope

- **U1's row anatomy** (the readout, Now, Hit and Heal on the row, the Down rule), Next's announcement, and the
  big-hit ask. KQ3 moves Combat Sense and sorts More. It changes nothing else on the row.
- **U3's dossiers**: read views, Notes as titles, Add below the content, the grids, the breadcrumbs.
- **U5's keys and the section tabs' `aria-current`.** The strip adds no key.
- **Interactions' session rule** (203 stays). **Activity's labels** (U4).
- Any stored field. The phone-check fixes on `main`, and the seat-test flake (the separate Fix session).
- Home's layout (W80). Printing.

## 8. The shapes

**Engine (reader additions and one rule, total):**

- `Engine.openSession(t)` → the session record, or `null`.
  - **The rule:** take `sessionList(t)` (highest number first, `engine.js:7780`), drop every session dated after
    today (`_today()`), and take the first. It is open when its `close` is null. Otherwise none is open.
  - **Total:** on a hostile table (sessions not an array, a session with `date: 7`, `number: "x"`, `close: "yes"`)
    it returns a session object from the table or `null`, and never throws.
- `addTableNote(t, f)`: with `f.jot === true` and no valid `f.session`, the session is `openSession(t)`'s id, or
  `null`. Without `jot`, nothing changes (the Notes tab's New note).
- `nextSession(t).last`: the session before the open one when the first in the list *is* the open one (as for a
  session dated today now). Otherwise as today.
- `Engine.clocksNearFull(t, within = 2)` → every clock with `segments − filled ≤ within` and `filled < segments`,
  nearest first, then by name. Each is `{ clock, owner }`, where `owner` is `{ kind, id, name }` or `null`. Full
  clocks aren't "near": they show on their owner's page as **Full**, as today. Total over junk clocks.
- **Nothing is stored.** The strip, the fold's state (`S.debriefOpen[sessionId]`) and the close-out's end page
  (`S.closeOut = { id, ended:true }`, or similar) are view state.

**The strip's items** are computed by one UI function from the engine's readers (`encounterView` of the running
encounter, `openSession`, `nextSession(t).current`, `clocksNearFull`, `tableUnexported(lastTableSaved)`). It's
painted on every `update()`, never from stored text.

## 9. The UI

**Ken's shape answers (2026-11-06):**
- **Fight first:** while an encounter runs, the strip leads with round and actor, then who's down.
- **Each item jumps:** the items are shortcuts, with no actions on the strip.
- **Export as primary:** close-out's end has Export the table as its one primary button.

The brief's direction holds:
- the Night-Shift Readout world, with no new visual world;
- readouts in DESIGN.md's voices;
- one line.

**The strip** (behaviour, not markup):

- **Where:** the tables bar (`.tbl-bar`, 258's sticky bar).
  - On a page, it follows Back (and Add to).
  - On a tab with no page, the bar shows with the strip alone, while the strip has something to show.
  - Not on the running encounter's own page (UQ20).
  - The bar keeps 258's rules: it sticks, and it lets go on a short screen or below 1060px while a field has focus.
- **What, in priority order:**

  | Item | Shows when | Reads (draft, voice pass) | A tap goes to |
  |---|---|---|---|
  | Fight | an encounter runs | **Round 2 · Reclaim drone** (Oxanium for "2"; the actor in cyan) | the running encounter, its acting row in view (U1's `toActive`), focus on Next |
  | Down | a running row is Down | **Down: Reclaim cleaner B**, or **2 down** for more than one (magenta) | that row, or the first of them, in view, focus on its name |
  | Thread | a thread is current (UQ21) | **What spoke in the dead air?** (truncated, full title in the accessible name) | Sessions, the thread in view (`showThread`) |
  | Clock | a clock is within two of full (UQ19) | **Dex before the full moon 7 of 8** (the numbers in Oxanium) | Next session's Close to full, that clock's row focused |
  | Unexported | the table has changes no file holds | **Unexported** (Mono Caps, gold-free: `--dim` with a 1px `--frame` edge, as a `.tag.plain`) | runs Export (as ⋮ → Export), then focus returns to the strip |

  - The Unexported marker is the one item that does something. Ken's "no actions" covers changing the table, and
    Export changes nothing in it. If he reads it otherwise, it goes to ⋮ → Export with the menu open. Flag it in
    the PR.
- **Widths:**
  - Below 768px: the first item that applies, plus *Unexported*.
  - From 768px: every item.
  - Items don't scroll sideways. A hidden item is `display:none`, so it isn't focusable or read out.
  - Long text truncates with an ellipsis, and the full text is in the button's accessible name.
- **A region:** `role="region"` named "Tonight", inside the bar.
  - It announces nothing: U1's announcer already says "<actor> acts".
  - Its node persists across redraws, so focus kept on an item survives a repaint (Decision 164).
- **Touch:** 44px targets on touch. One line.
  - The bar's height may not grow past `BAR_MAX` (56px on touch).
  - Header plus bar stays within 20% at 390px.
- **Live:** it repaints on every `update()`, so a clock's +, a typed field or an Export each change it at once.

**Opening a table:**
- From Home (Open, or an import that opens one), the window scrolls to the top, and focus goes to the page's `h1`
  (the table's name on a tab, the record's name on a page).
- Run a table keeps today's focus on New session.

**Jot:**
- The line under the box reads "Goes with Session 7." for the open session.
- With none: "Goes on the table's notes. No session is open." (draft, voice pass)

**Next session** gains a first block, **Close to full**:
- Each clock within two of full, nearest first, on one line: "Dex before the full moon 7 of 8 · Dex" (its owner as
  a link, or nothing when it has none), then − and +.
- − and + work as on the clock's own page: the same label in Activity (U4), and `tableChange(…, false)`.
- The count updates in place. A clock that fills leaves the list at the next redraw, and focus moves to the next
  row's +, or to the block's head.
- The block's head is a Mono Caps sub-section label (`.next-h`, Overcast Steel), as "Still open" is.
- With no clock near full, the block isn't drawn.

**Clock lists:**
- A place's, faction's or encounter's card lists each of its clocks as a line, "<name> 4 of 6", with − and +, in
  place of "1 clock · 1 full". A full one reads "<name> Full".
- Buttons never nest inside the card's open button. The card's opener stays where it is.
- Each line's − and + carry the clock's name in their accessible names ("Add one to The tide at Wharf 17").

**Close-out's end** (a page of its own, after Write the award log):
- The bar holds **Back to Session 7**.
- The `h1` reads **Session 7 is closed out** (draft).
- The awards follow, a line per name, as the log reads (`coLogLine`).
- Then **Export the table** (primary) and **Done**.
- Export runs `exportTable`, then a notice names the file, and focus goes to Done.
- Done (and Back) go to the session page, with focus on the Close-out heading, as Write does today.
- No Delete is on this page.

**The open session's debrief:**
- The six Campaign Journal parts sit in one disclosure, **Debrief · 6 parts, 1 written** (UQ25). It is closed on
  the open session and open on every other.
- Opening it keeps it open for that session until the table closes (`S`).
- Find landing on a journal field opens it first.

**The running encounter (KQ3):**
- **Title:** while running, the page's `h1` is the title (`data-enc-h`, as the ended page's is). Beside it, a small
  **Rename** opens the name modal (`openNameModal`, as Rename table does). Planned, as today (UQ23).
- **Combat Sense:** while running, the head reads "CS 14" as text (Mono Caps key, mono value). The field moves to
  More's Setup group. Planned, as today. A tie keeps its "Tied: reroll" tag in the head.
- **More, three groups:**
  - **Play:** Take (when not on the row), Add a Condition, Delay.
  - **Setup:** Name, Combat Sense (running), Goes last / Out, Side.
  - **Remove**, set apart by a rule.
  - Each group label is a Mono Caps item label (`--dim`, .72rem).
  - A press inside More keeps it open (U1), and focus returns to the control pressed.
- **The Hit panel (UQ24):** damage, then **Apply · Cancel**, then the preview and its prompts, then Type, Kind, AP,
  Where, the seat's asks and From.
  - The preview stays one node updated in place (U1).
  - Apply never moves while anything below it changes.

**Copy for the voice pass** (the builder pastes each in the PR as it renders):
- The strip:
  - "Tonight" (the region's name);
  - "Round 2 · <actor>", "Down: <name>", "<n> down";
  - "<thread title>", "<clock> 7 of 8", "Unexported";
  - each item's accessible name ("Go to <actor>, acting in <encounter>", "Go to <clock> on Next session",
    "Export the table").
- Jot: "Goes with Session 7.", and "Goes on the table's notes. No session is open."
- Next session: "Close to full", and "<clock> 7 of 8 · <owner>".
- Close-out's end: "Session 7 is closed out", "Export the table", "Done", and the export notice.
- The debrief: "Debrief · 6 parts, 1 written".
- The running encounter: "Rename", "CS 14", "Play", "Setup", "Remove".

## 10. Worked examples, as named tests

The builder writes these first and shows each failing on `main`, or says why one already passes.

| Test | File | Pins |
|---|---|---|
| `U2: the open session is the latest not after today, while not closed out` | `engine.test.mjs` | Sessions 6 (closed), 7 (10/31, open), 8 (dated next week): open is 7. Close 7: none. A hostile table: `null` or a session, no throw |
| `U2: a jot files to the open session; an interaction keeps its day` | `engine.test.mjs` | today ≠ 10/31: a jot → Session 7; `addInteraction` with today's date → `null` (203) |
| `U2: Next session counts an open session as being played` | `engine.test.mjs` | 7 open, 6 before it: `last` is 6, and its seed is 6's |
| `U2: clocks near full, nearest first, ownerless included` | `engine.test.mjs` | Dead Air: Dex before the full moon (7/8), Joss's network (3/4), Ibarra's patience (4/6), in that order; a full clock absent; junk clocks skipped |
| `U2: the strip reads the night, in order, and each item goes where it says` | `smoke-table-play.test.mjs` | Dead Air on Players: items Fight, Down?, Thread, Clock, Unexported in that order; Fight → the encounter, focus on Next; Clock → Close to full, its + focused |
| `U2: the strip keeps up with a clock's + and an Export` | `smoke-table-play.test.mjs` | a + on Close to full: the strip's clock text changes without a page redraw; Export: *Unexported* gone |
| `U2: no strip on the running encounter's page, none with nothing running` | `smoke-table-frame.test.mjs` | the encounter's page: no strip; a table with no running encounter and no open session: no bar on a tab |
| `U2: a table opens at the top, its h1 focused` | `smoke-table-frame.test.mjs` | Home scrolled, Open: `scrollY` 0 (a stub in jsdom: assert `scrollTo(0,0)` was called), `activeElement` is the `h1` |
| `U2: Write the award log ends on Export and Done` | `smoke-table-play.test.mjs` | after Write: the `h1` "Session N is closed out", one primary button, Export; no `[data-sdel]`; Export marks the entry exported; Done → focus `[data-sco-h]` |
| `U2: the open session folds its debrief` | `smoke-table-play.test.mjs` | open session: the six `[data-sj]` inside a closed `<details>`; a closed-out one: open |
| `U2: a card lists its clocks as 4 of 6, with − and +` | `smoke-table-factions.test.mjs` | "Ibarra's patience 4 of 6" on its faction card; + → "5 of 6" and Activity "Ibarra's patience: 5 of 6" |
| `U2: a running encounter's title is a heading, Combat Sense is text, More is grouped` | `smoke-table-play.test.mjs` | `h1[data-enc-h]` while running; no `[data-enc-title]`; a row's head has no `[data-eorder]` outside More; More's groups in order Play, Setup, Remove (More opened first) |
| `U2: the Hit panel puts damage, Apply and the preview first` | `smoke-table-play.test.mjs` | document order: `[data-ehit-damage]`, `[data-ehit-apply]`, `[data-ehit-preview]`, `[data-ehit-type]` |

## 11. Tests beyond the examples

- **Totality:** `openSession` and `clocksNearFull` over `hostile.test.mjs`'s table. `nextSession` keeps returning
  its shape.
- **Voice:** every new string passes `voice.test.mjs`.
- **11px and tokens:** `build.test.mjs`. **No `style=`** in `gm.js` but the segment transform (U4's guard).
- **Phone-check:**
  - Add a row per width for a tab with the strip (Sessions with an encounter running), measuring header plus bar.
  - The gate is 20% at 390px, and 27% for the encounter bar.
  - If the separate Fix hasn't merged, the gate is no OVER row that `main` lacks (§ header).
- **Mutation-test:**
  - The open session's "not dated after today": drop it, and the next-week case must fail.
  - "While not closed out": drop it, and the closed case must fail.
  - The strip's repaint from `update()`: paint only in `renderTable`, and the clock test must fail.
  - The breakpoint rule: show every item at 375, and a frame test asserting one item plus the marker must fail.
- **The carried rules:**
  - Every test touching More's or the debrief's controls opens them first and asserts they're open.
  - After any timing failure, rerun the full `npm run verify` and paste both totals in the PR.
- **Expected breaks, updated, not stops:**
  - `engine.test.mjs:6584` (Jot's rule), and `smoke-table-play:1494` (Jot's "no session" line).
  - "1 clock" in `smoke-table-encplan`, `-factions` and `-sites`.
  - The running encounter's `data-enc-title` uses (`smoke-table-play` ×4, `smoke-table-encplan` ×1).
  - Tests expecting the session page straight after Write the award log.
  - Version literals.
  - Each is listed in the PR, old → new.

## 12. Steps

1. `git submodule update --init private`, then `npm run test:fast` (a fresh branch from `main`).
2. Write §10's tests and show them failing on `main`.
3. **Engine:** `openSession`, Jot's rule, `nextSession`'s last, `clocksNearFull`, with the totality tests. Then
   `npm run verify`.
4. Read `craft-floor.md`. Run **`/impeccable layout`** on the tables bar with the strip (a tab, a page, 375px and
   1024px). Build the strip, its repaint from `update()`, *Unexported* and the open-at-the-top. Then
   `npm run verify`, and check it in the dev preview.
5. **`/impeccable distill`** on the running encounter (title, Combat Sense, More's groups, the Hit panel's order)
   and on the open session's page (the debrief fold). Build them. Then `npm run verify`.
6. Clocks: Close to full, and the cards' clock lines. Then `npm run verify`.
7. **`/impeccable onboard`** on close-out's end. Build it. Then `npm run verify` and `npm run phone-check`.
8. **The plan §3 gate:** inject the browser overlay at 1024px and 375px on **Dead Air**, with the tab fronted, on:
   - a tab with the strip, and a page with it;
   - the running encounter;
   - Next session;
   - an open session's page;
   - close-out's end;
   - a faction card with clocks.
   Fill every cell.
9. **`/impeccable polish`** on the sections touched, reading U4's snapshot.
10. Close-out (§14).

## 13. Stop and ask

**Stop** (to the conductor) if:

- a stored field turns out to be needed (a schema bump isn't in this order);
- the strip can't hold its first item and *Unexported* at 375px inside the 56px bar;
- a decision outside 203, 204, 205, 208, 245, 258 and 269 needs a supersession mark;
- painting the strip from `update()` needs `renderTable` restructured;
- an Impeccable command wants to change something outside §9 (a colour role, a component, another tab). Report
  what it proposed, and don't apply it;
- the separate phone-check Fix changes `tools/phone-check.mjs` in a way that conflicts with §11's new rows.

**Not stops** (expected, and updated in place): §11's expected breaks and the version literals.

## 14. Close-out

- **The tier's items** (`close-the-session`):
  - the decision and its INDEX line, with supersession marks on 208, 258, 204 and 269;
  - `CHANGELOG.md` lines in player voice, then `npm run changelog`;
  - `npm run bump -- 0.64.0` (or the next minor);
  - a log entry;
  - STATE rewritten where it names U2, with U3 next;
  - the plan's §4 row marked built;
  - a row in `docs/log/shipped.md`.
- **The changelog** (draft, for a voice pass):
  - "While a fight runs or a session is open, a Tonight line under the header says who's acting, who's down, the
    thread, the clock about to fill, and whether the table needs exporting. Tap any of it to go there."
  - "Jot files to the session you're playing, even after midnight or on a second night."
  - "Closing out a session ends on what everyone got and an Export button."
  - "Clocks show where they stand, 4 of 6, and tick from any list. Next session leads with the ones close to full."
  - "In a running fight, the title is a heading, Combat Sense is text on the row, and More is sorted. The Hit
    panel puts damage, Apply and the preview first."
- **The PR:**
  - Title: `U2: Tonight (gm-at-the-table; Decision N)`, with the template's sections.
  - **Where the order didn't fit** is required ("Nothing" is fine).
  - An **Impeccable** section (plan §3.8): layout, distill, onboard and polish, each with the screen it ran on and
    what it changed, or "nothing", plus §12.8's overlay grid with every cell.
- **The re-critique** (plan §3.6): the reviewer runs `/impeccable critique` on GM mode with Dead Air seeded, commits
  the snapshot, and sets its table beside U4's (27/40).

**Review checklist** (beyond the tests passing):

- [ ] Run it in the dev preview with Dead Air seeded, at 1024px and 375px, by mouse and by keyboard alone:
  - every strip item, and where each lands;
  - a clock's + on Close to full, then on a faction card, watching the strip;
  - Export from ⋮ (*Unexported* goes);
  - Jot ("Goes with Session 7.");
  - Close out Session 7 to its end page, then Export and Done.
- [ ] The strip repaints on a change that doesn't redraw the page. Check a clock's +, and typing in a session's
      Hours.
- [ ] No strip item is focusable while hidden at 375px.
- [ ] Header plus bar is within 20% at 390px on a tab with the strip, and within 27% on the encounter.
- [ ] Every row that scrolls under the bar clears it (U1's `scroll-margin-top` miss).
- [ ] Jot's rule changed and the interaction rule didn't (`addInteraction` on a resumed night: no session).
- [ ] "4 of 6" reads the same on a clock's page, its card, Close to full, the strip and Activity.
- [ ] Every test that presses inside More or the Debrief fold opens it first.
- [ ] Every new tag that isn't a tip is `.tag.plain`. Every label is ≥ 11px. Every colour role matches §9.
- [ ] The overlay grid has every cell, on Dead Air, with the tab fronted.
- [ ] The Impeccable section names all four commands. Spot-check one claimed change against the diff.
- [ ] Every new string is in the PR for the voice pass.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md`, with this order's path `docs/plans/gm-at-the-table/U2-tonight.md`. Both
sessions are **local**, where Impeccable is installed. The conductor adds the same Impeccable lines as for U1:
run §12's commands through the Skill tool and nothing else, and treat a command reaching outside §9 as a stop.

This order's traps:

- **`update(false)` skips `renderTable`.** Paint the strip from `update()`, after `saveTable()`, or it lies after
  every clock tap and keystroke.
- **The bar on a tab isn't a page.** `bindTable` keys the bar's scroll place by page, `smoke-table-frame` calls the
  bar "the page's first element", and `phone-check` treats `.tbl-bar` as a page's bar. Make sure a tab with the
  strip doesn't trip "a page" logic (Back counts, focus returns).
- **`_sessionOnDay` has two callers.** Change Jot's, not the interaction's.
- **Two of Dead Air's clocks have no owner.** `clocksOn` can't see them. `clocksNearFull` must read `t.clocks`
  directly.
- **Hidden at 375px means `display:none`,** not clipped. A clipped strip item is still tabbable and read out.
- **A closed `<details>` hides controls in a browser, not in jsdom.** That covers More and now the Debrief fold.
  Open them in the tests.
- **Close-out's end replaces the page Write used to return to.** `hostile.test.mjs` and `smoke-table-play` expect
  the session page after Write. Update them to press Done.
- **The Unexported marker repaints on Export from ⋮ too** (`renderTableChrome`'s handler calls `exportTable` with no
  redraw today).
- **The overlay's chrome findings are known false positives** (the brand violet and cyan, Inter). Only content
  counts.
