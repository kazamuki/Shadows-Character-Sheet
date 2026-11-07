# Work order U5: Keys and landmarks

**Plan:** [`../gm-at-the-table.md`](../gm-at-the-table.md), session U5. It owns findings #38–#41 (plan §2), and takes
up the rest of **W139**: the keys Decision 259 held back (Next, the tabs, `?` for the list). It is
the plan's last session: when it merges, the plan closes to `plans/archive/` (plan §7). That cleanup is the
conductor's own Docs PR, not this build's.
**Status:** **drafted 2026-11-07 by Claude (Opus)**, U3's reviewer, for Ken's approval.
**Ken's shape answers** (`/impeccable shape`, run by the conductor with Ken, 2026-11-06), each the recommended option.
They are in §9's head:
- **Undo is Ctrl+Z / Cmd+Z only.** There's no `U`, because there's no Redo behind it.
- **N works only on a running encounter's own page.**
- **Activity is the key `A`**, with no new header button.

UQ35–UQ42 (§4) are this order's own questions, from the shape brief's open items and the pre-flight.
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs beside:** nothing (plan §4: every U session shares `gm.js`).

**Pre-flight:** against `main` at `7450ac7` (PR #311, U3, merged: app 0.65.0, game data 0.53, character schema
0.34, table schema 0.19, pack schema 0.3). What I found:

- **One keydown listener, for F and J only.** It's at `gm.js:359` (Decision 259).
  - It returns at once for any key but `f` or `j`.
  - Then it checks, in order:
    - GM on, the table screen, keys on (`keysOn()`, `shadows.ui.keys`);
    - no Ctrl, Meta, Alt or Shift, no repeat, no IME;
    - `inField(target)` or `inField(activeElement)`;
    - an open `dialog.modal`;
    - an open `#hdrmenu`.
  - It calls `preventDefault()` before it opens the box.
  - U5 extends this listener. It doesn't add a second one (shape brief §6).
- **⋮ → Keys** (`openKeys`, `gm.js:335`) lists F, J, Esc and Ctrl/⌘+Enter.
  - Its switch is labelled **"F and J"**: the `aria-label` and the field label both say it.
  - Its note says "F and J do nothing while you're typing in a field."
  - `keyHints()` (`:328`) puts `aria-keyshortcuts` on `[data-tfind]` (F) and `[data-tjot]` (J) while the keys are on.
- **The section tabs have no `aria-current`.** `tableTabButtonsHtml` (`gm.js:263`) writes
  `class="tab active"` only.
  - Probed at 375px on Dead Air: `aria-current` is `null` on the open tab after opening the table, three tab
    presses, and two strip jumps. That confirms #38.
  - **The read-only sheet's own tabs already do it:** `data-rotab` (`gm.js:4252`) writes `aria-current="page"`.
    That's the precedent.
- **#39 didn't reproduce.** `showActiveTab(nav)` (`app.js:77`) scrolls the active tab into the row with 48px of room.
  It runs on every render, because `renderMain` → `renderTopChrome` → `renderTableChrome` (`app.js:21`). `goThread`
  and Find's thread hit call `renderTableChrome` directly.
  - At 375px the open tab was inside the row on all six routes probed: open (Cast, 228–306px), Notes, Sessions,
    Encounters, the strip's lead chip, and a strip jump from Notes (Encounters, 48–170px).
  - So #39 becomes a **guard**, not a fix: phone-check asserts it on every walk (§11). If the guard finds a route
    where the tab sits off-screen, the build fixes that route.
- **Undo already has one path.** `undoTableEntry(table, entry)` (`gm.js:112`) takes back the newest audit entry and
  returns its label, or `null` if the entry isn't the newest any more.
  - The toast's Undo (`paintTableToast`, `shared.js:404`) and Activity's (`openActivity`, `gm.js:605`) both call it,
    then `showTableDone(label)` (`shared.js:420`): a 2.5s toast reading "Undone: <label>".
  - Ctrl+Z on `main` today does nothing outside a field. Inside one, it's the browser's own text undo.
- **Next turn is a closure.** `next` (`gm.js:3836`) is defined inside `bindEncounters` and dispatched by its
  delegated `act["data-enext"]`. The document listener can't call it.
  - **The way in is the button:** N clicks the page's `[data-enext]`, so every rule `next` has comes along: the
    round's reset (`r.reset`, focus to `[data-esrc]`), `notice(r.why)` on a refusal, and the announce.
  - **There is no confirmation dialog on Next.** A shape-brief open item asked about one; the only branch is
    `r.reset`, which changes where focus lands.
- **Activity** opens only from ⋮ (`[data-tactivity]`, `gm.js:316`). That handler closes the menu and focuses ⋮
  first, so the box returns there.
- **Probes on `main`** (Dead Air at 1024px), the worked examples' "before":
  - `1`–`8`, `N`, `A`, `?` and Ctrl+Z each do nothing (the listener returns on the first line);
  - no tab carries `aria-current`;
  - ⋮ → Keys lists four keys.

**Carried over** (from U3's build and review, PR #311):

- **The order's misses, U3:**
  - **A default that assumed a measure held.** UQ32 said 258's 20rem card floor would hold inside each band. It
    didn't, from 640 to about 680px (Ken's K1: two columns from 700px).
    - *Here:* every number this order relies on is either measured in the pre-flight, or left for the builder to
      measure and report.
  - **A computed line that repeated the live row under it.** §8's session summary (day · who · hours) went stale
    under Who and Hours (K4: the day alone).
    - *Here:* §9 says, for every announced or shown line, what repaints it.
  - **Two sections answered one question two ways.** §9 drew the GM note in the dossier, while §10's test sent a
    Find hit on it into Edit.
    - *Here:* every Done-when line and every §10 test was checked against §9's *Where things land* table.
- **The build's misses, U3:**
  - **S1:** a summary that went stale.
  - **S2:** the stat block's order below 1280px, where only the wide layout was specified.
  - **S3:** Decision 271 cut from 514 to 281 words, with no note in the PR. That was U2's miss again.
    - *Here:* §3's draft is **already under 350 words**, so it's pasted whole, as is.
  - **The PR body lost its Impeccable section on a rewrite.**
    - *Here:* the review checklist reads the PR body last, after every push.
  - **A ruling for one record kind broadened a shared sentence.** K4's edit made 271's Decided say "the day" for
    every record.
    - *Here:* any ledger edit after review is checked against the kinds it names.
- **The harness rule** (U3, Ken's K3): `harness.mjs`'s `reach` presses a page's one Edit when a selector is missing.
  - So every test that relies on a control being on a read view pins it with `$`.
  - *Here:* U5's keys act on read views (N on the encounter page, Ctrl+Z anywhere). Its tests find the target with
    `$`, never through `app.click`.
- **The phone-check budgets carry:**
  - the tables bar 20%;
  - the encounter bar 27%;
  - the strip's lead at ≥120px on a page bar at ≤390px.

  U5 adds no header button (Ken: *A key only*), so none of them should move.
- **The overlay grid comes from Dead Air,** every cell filled, with the tab fronted. No type under 11px.

---

## 1. Goal and Done when

A GM mid-session moves between the eight sections, runs a fight's turns and takes back a slip without reaching
for the mouse or ⋮. A screen-reader user hears which section is open. Nothing fires while they type.

**Done when** (Dead Air seeded):

1. **(#38)** The open section's tab carries `aria-current="page"`, and no other tab does. It holds on every route: a
   tab press, a key, a strip jump, Find, Back, and opening the table.
2. **(#39)** At 375px the open tab sits inside the tab row on every route above. phone-check asserts it on each of
   its table walks.
3. **(#40) `1`–`8`.** Each does exactly what pressing that section's tab does, in tab order: Sessions, Players, Cast,
   City, Threats, Encounters, Reference, Notes.
   - It runs the same handler (`pickTableTab`), so it also leaves a member's page for the list.
   - Focus lands on the tab, as a press puts it (Decision 271).
4. **(#40) `N`.** On a running encounter's own page, `N` does what pressing **Next turn** does: the same focus, the
   same announcement ("Wren acts"), and the same reset at the round's end. Anywhere else, it does nothing and isn't
   held back from the page.
5. **(#40) Ctrl+Z / Cmd+Z.** Takes back the newest table change through `undoTableEntry`, the same as the toast's
   Undo, and the toast says **"Undone: <label>"**. With nothing to undo, the toast says so (UQ37). There's no `U`.
6. **(#41) `A`.** Opens ⋮ → Activity. Closing it returns focus to where `A` was pressed. ⋮ → Activity stays.
7. **`?`.** Opens ⋮ → Keys, which lists every key with where it works (UQ35). Its switch turns **all** of them off and
   on, F and J included.
8. **Never by accident.** No key fires when any of these holds:
   - the keys are off;
   - focus is in a field (input, textarea, select, contenteditable) or an IME is mid-word;
   - a box (`dialog.modal`) or the ⋮ menu is open;
   - a key repeats;
   - a modifier is held, beyond the ones UQ36, UQ40 and Ctrl/Cmd+Z allow.

   This is 259's rule for F and J, unchanged.
9. **Accessible names.** Each tab carries `aria-keyshortcuts` with its digit, Next (`[data-enext]`) carries `N`, and ⋮'s Activity
   item carries `A`, all while the keys are on (as `keyHints` does for F and J).
10. **The gate.**
    - The browser overlay is clean on the pages touched (the tab row, Keys, an encounter) at 1024px and 375px, or
      each finding is named.
    - Header plus bar stays within 20% at 390px.
    - The reviewer's re-critique scores **H7 (Flexibility and Efficiency) above U3's 2**, and doesn't lower H4.

## 2. Tier, versions, numbers

- **Rule or shape:** a player-facing behaviour someone could have chosen otherwise (which keys, where they work). It
  also reopens a decided rule: 259 in part, whose Rejected list had "More keys now (Next, the tabs): F and J prove
  the pattern first". F and J have shipped since app 0.56.1, which is the *Revisit if* ("a GM asks for another key"):
  the critique's finding #40 asked.
- **App:** a minor, 0.65.0 → **0.66.0**, or the next minor on `main` when built.
- **No schema bumps** (game data, character, table or pack).
  - The keys' on/off is the existing `shadows.ui.keys` preference.
  - If anything needs a stored field, that's a stop (§13).
- **Engine:** none.
- **Decision:** one, numbered **N**, the next free number on `main` when built (`CLAUDE.md`, *Decisions*; 271 is
  the last today, so probably 272).

## 3. The decision, drafted

It's about 315 words with its Touches line, under the 350 cap (`docs.test.mjs` counts it; §11), so **the builder pastes it whole**.
If a UQ answer changes a clause, swap that clause and say so in the PR.

```
N. **On a table, 1–8 open the sections, N runs Next turn on a running encounter's page, Ctrl/⌘+Z takes back the last change, A opens Activity and ? lists every key; the open section's tab is aria-current.**
     *2026-11-07 · Ken + Claude · Touches: keyboard shortcuts, keydown, inField, keysOn, shadows.ui.keys, Keys, openKeys, keyHints, aria-keyshortcuts, 1–8, section tabs, tableTabButtonsHtml, pickTableTab, aria-current, showActiveTab, N, Next turn, data-enext, Ctrl+Z, Cmd+Z, undoTableEntry, showTableDone, nothing to undo, A, Activity, openActivity, ?, phone-check, Decision 259, Decision 271*
     - **Decided:** On a table's screen, under 259's rules (never in a field, a box or the ⋮ menu, never on repeat, and off with the rest in ⋮ → Keys), **1–8** press the section tabs in order and **N** presses Next turn while a running encounter's page is open, elsewhere nothing. **Ctrl+Z or ⌘+Z** takes back the newest table change and the toast names it; with nothing to undo, it says so. **A** opens Activity, **?** opens Keys, which lists every key with where it works. The open section's tab is `aria-current="page"` and kept in view.
     - **Why:** finding #40 asked for the keys 259 held back; a GM mid-fight reaches for the mouse to change section, run a turn or take back a slip, and a screen-reader user wasn't told which section was open.
     - **Rejected:**
       - `U` for Undo: no Redo behind it, and Ctrl/⌘+Z is the key everyone knows.
       - N on every tab: a turn would run from a page that doesn't show it.
       - A header button for Activity: the phone header's 20%.
       - Alt+digit: Windows' menus and the browser's own tabs.
     - **Replaces:** Decision 259 in part: more keys under the same rules, and the Keys switch covers them all.
     - **Revisit if:** a GM wants keys on the player's sheet, a browser takes a digit, or Redo arrives.
     - **Built:** app 0.66.0; PR #…; log 2026-11-…
```

Mark 259 `→ **Superseded in part by Decision N**` with its clause (more keys, one switch). Mark its INDEX line to
match, and put N's INDEX line under GM mode's keys, beside 259.

## 4. Questions for Ken

Ken's three shape answers are in the header. These are the brief's open items and what the pre-flight turned up.

| Id | Question | Default |
|---|---|---|
| **UQ35** | **The Keys window's copy for each key** (shape brief §7; voice pass). Draft list: **1–8** · Go to a section · **N** · Next turn, on a running fight's page · **Ctrl/⌘+Z** · Undo the last change · **A** · Activity · **?** · These keys · **F** · Find · **J** · Jot · **Esc** · Close a box · **Ctrl/⌘+Enter** · Save a jot. The note becomes "None of these work while you're typing in a field." The switch's label becomes **"Keys"** (was "F and J") | **The drafts, through the voice pass.** The builder pastes each into the PR as it renders, and the reviewer drafts alternatives |
| **UQ36** | **Digits on the numpad, and on layouts where they need Shift (AZERTY)** | **Match the physical key** (`e.code` `Digit1`–`Digit8` and `Numpad1`–`Numpad8`), with Shift allowed for the digits only. On AZERTY the top-row digits need Shift, and QWERTY's Shift+1 (`!`) going to Sessions harms nothing. Ctrl, Alt and Meta still block |
| **UQ37** | **What "nothing to undo" says, and where** | **The toast, 2.5s, "Nothing to undo."**, the same place and lifetime as "Undone: …" (`showTableDone`'s look, without the label). It's tool voice: the GM pressed a key and needs to know it was heard |
| **UQ38** | **N exactly as Next turn** (shape brief §7) | **Yes: N clicks the page's `[data-enext]` when it's there and enabled, and does nothing otherwise.** Next has no confirmation of its own. The round's end runs the reset path (`r.reset`, focus to `[data-esrc]`) exactly as a press does. While the reset is asking (`v.atReset`), the page draws no Next, so N does nothing until the GM answers it. A planned or ended encounter has no Next either |
| **UQ39** | **Ctrl/⌘+Z while a box is open** (Activity has its own Undo; Find and Jot have fields) | **Nothing,** as with every other key (259's box rule). Activity's own Undo button is the way inside it |
| **UQ40** | **`?` needs Shift on most layouts** | **Match `e.key === "?"`**, with Shift allowed for this key only. Ctrl, Alt and Meta still block |
| **UQ41** | **`aria-current` under a section's own pages** (a member's page under Cast, a session under Sessions) | **`aria-current="page"` stays on the section's tab.** The section is where the GM is, and the page inside it has its own `h1` |
| **UQ42** | **Ctrl/⌘+Z on the player's sheet** (it has its own undo toast, Decision 107) | **Not in U5.** 259 keeps Home, the wizard and the sheet free of shortcuts. That's a separate W item if anyone asks |

## 5. The assumption sweep

| What changes | True today, where | True after | Readers (by grep) |
|---|---|---|---|
| The key listener | F and J only; returns on any other key first (`gm.js:359`) | one listener: a key table (`1`–`8`, N, A, ?, Ctrl/⌘+Z, F, J), each entry with its own modifier rule (UQ36, UQ40); the guards run in the same order | `smoke-table-keys` (8 tests: F/J, field, modifier, repeat, box, ⋮, off, focus return). **Every one must still pass unchanged**; a change to one is a stop unless it's the Keys list's copy (§13) |
| `inField` | `isTextField`, `SELECT`, contenteditable (`:358`) | unchanged, and used by every key | the same tests; `typingNow` (`shared.js`), whose list `inField` extends |
| Keys window | four keys; the switch and its `aria-label` say "F and J" (`openKeys`, `:335`) | every key, with where it works; the switch says "Keys" (UQ35) | `smoke-table-keys` "⋮ → Keys lists the keys…" (asserts F, J, Esc, Enter in the text: still true); `voice.test.mjs` |
| `keyHints` | F and J on the header buttons (`:328`) | plus each tab's digit, Next turn's `N` and Activity's `A`, while on | the "header's Find and Jot say their keys" test. **Twin:** the tabs are rebuilt by every `renderTableChrome`, so the hints go on in `tableTabButtonsHtml` or right after it. Next's is set where `encPageHtml` draws it (`gm.js:3786`) |
| Section tabs | `class="tab active"` only (`tableTabButtonsHtml`, `:263`) | plus `aria-current="page"` on the active one | `smoke-table-encplan:157` (reads `aria-selected` or `aria-current` on `[data-tsec]`); `showActiveTab` (`app.js:77`, reads `.tab.active`, unchanged); the sheet's `tabButtonsHtml` (the player's, untouched) |
| Tab focus | a press focuses the pressed tab (U3, `renderTableChrome`'s handler, `:293`) | a digit does the same, through the same function | U3's "a tab press keeps focus on its tab" test (`smoke-table-frame`). **Pull the handler body into one function** both call, so they can't drift |
| Next turn | a closure inside `bindEncounters` (`:3836`), dispatched by `act["data-enext"]` | N clicks the page's `[data-enext]` when it's present and not disabled (UQ38) | `encPageHtml`'s Next button (`:3786`, not drawn while `v.atReset`); `next`'s focus (`[data-enext]` or `[data-esrc]`) and `announce`. **Not** the strip's jump (`goFight`, `:471`), which only focuses Next |
| Undo | the toast's and Activity's buttons call `undoTableEntry` (`:112`) then `showTableDone` (`shared.js:420`) | Ctrl/⌘+Z does the same with the newest entry; an empty log says "Nothing to undo." (UQ37) | `paintTableToast` (`tableToast`, which holds the entry a toast offers: a key undo must hide a stale toast, as the toast's own Undo does); Activity's list, if open (it isn't: UQ39) |
| Activity | ⋮ only (`[data-tactivity]`, `:316`), returning to ⋮ | `A` opens it too and returns focus where `A` was pressed (259's rule, `viaKey`) | `openActivity`'s `returnTo:"[data-menu-toggle]"`. It needs a key path that returns to the pressed element, the way `openFind({ viaKey:true })` does. Grep `viaKey` |
| phone-check | walks every table page; budgets 20%, 27%, `LEAD_MIN` | plus: on every table walk, the active tab inside `#topnav`'s box | `tableScreens`' metrics (`tools/phone-check.mjs`) |

**Which guards read a value this changes?**
- `voice.test.mjs` reads the Keys window's strings.
- `build.test.mjs` reads `gm.js`'s `style=` rule. No new style.
- phone-check's budgets: no header button is added, so none moves.

**Where does each new or changed line render?**
- "Undone: <label>" appears in the toast, from all three paths: the toast, Activity and the key.
- "Nothing to undo." appears in the toast, and only from the key.
- The Keys list appears in the Keys window only.

**What text points at what this changes?**
- The Keys window's own "F and J do nothing while you're typing" (rewritten, UQ35).
- 259's ledger text (marked).
- The CHANGELOG's 0.56.1 line about F and J. It's history, so it isn't edited.
- No `appCopy` names a key (grep `Find on this table` over `src/data`: none).

## 6. Read first

- `CLAUDE.md`: constraints 1, 2 and 5; *Change tiers*; *Decisions*.
- Decisions:
  - 259 (keys: every rule here is its rule);
  - 107 (the table's undo toast);
  - 164 (`keepPlace`) and 111 (the modal, `returnTo`);
  - 271 (a tab press keeps focus on its tab);
  - 269 and 270 (Next turn's focus and announce, and the strip's `goFight`).
- `src/ui/gm.js`: the key listener and `inField`, `keysOn`, `keyHints`, `openKeys`, `tableTabButtonsHtml`,
  `pickTableTab`, `renderTableChrome`, `undoTableEntry`, `openActivity`, `openFind`/`openJot` (their `viaKey`), and
  `bindEncounters`' `next` and `encPageHtml`.
- `src/ui/shared.js`: `announce`, `paintTableToast`, `showTableDone`, `typingNow`.
- `src/ui/app.js`: `showActiveTab`, `tabRowFades`.
- `tests/smoke-table-keys.test.mjs`, the whole file. U5's tests sit there.
- U3's re-critique, `.impeccable/critique/2026-11-07T05-05-35Z__src-ui-gm-js.md` (27/40, H4 re-scored to 3: 28).
- Impeccable's `craft-floor.md`, read before the first UI edit (plan §3).

## 7. Out of scope

- **Keys anywhere but a table's screen.** Home, the wizard and the player's sheet keep none (259; UQ42).
- **Redo**, and any key that edits a record directly (Hit, Heal, a clock's +).
- **A visible key chip** on any button (259's Rejected: header width at 390px).
- **U1's row and Hit panel, U2's strip, U3's read view and Edit, U4's seat copy, the toast's look.**
- **The plan's "Leads after U5".** The later Fix order takes them.
- **Archiving the plan.** The conductor's own PR.

## 8. The shapes

**Nothing stored. No engine change.**

- **The key table** (a suggestion; behaviour is what's specified):

  | Key | Matches | Modifiers | Does |
  |---|---|---|---|
  | `1`–`8` | `e.code` `Digit1`–`Digit8`, `Numpad1`–`Numpad8` (UQ36) | Shift allowed; no Ctrl, Alt or Meta | the tab at that index, through the tab press's own function |
  | `N` | `e.key` `n` or `N` | none | click `[data-enext]` if a running encounter's page shows it, enabled; else nothing, not held back |
  | Ctrl/⌘+Z | `e.key` `z` or `Z` | exactly one of Ctrl or Meta; no Shift or Alt | `undoTableEntry(S.table, newest)`; then `showTableDone(label)`, or "Nothing to undo." |
  | `A` | `e.key` `a` or `A` | none | `openActivity` by key: focus returns where `A` was pressed |
  | `?` | `e.key` `?` (UQ40) | Shift allowed; no Ctrl, Alt or Meta | `openKeys` by key, returning the same way |
  | `F`, `J` | as 259 | none | as 259 |

- **`preventDefault()`** only when a key acts. N off its page isn't prevented, and neither is Ctrl+Z on the player's
  sheet, so the browser keeps them.
- **Edges:**
  - The keys are off: nothing fires, `?` included.
  - Undo's newest entry isn't the toast's: the stale toast hides, as `paintTableToast` does when its own entry has
    gone.
  - Ctrl+Z after the table was just opened: the audit log is the file's, so it's the newest entry in the file, the
    same as Activity's Undo.

## 9. The UI

**Ken's shape answers (2026-11-06):**
- **Ctrl+Z / Cmd+Z only,** with no `U`.
- **N only on the fight's page.**
- **`A` as a key only,** with no new header button.

**The brief's direction holds:**
- the Night-Shift Readout world, with nothing new visually;
- Mode: *Operate*.

**The tab row:**
- The open tab carries `aria-current="page"` (UQ41), set in `tableTabButtonsHtml` beside `active`.
- `showActiveTab` keeps it in view, as it does today. The new guard is phone-check's.
- Each tab's `aria-keyshortcuts` is its digit while the keys are on.

**The Keys window** (⋮ → Keys, or `?`):
- One list, in this order: 1–8, N, Ctrl/⌘+Z, A, ?, F, J, Esc, Ctrl/⌘+Enter (UQ35's copy).
- One switch, labelled **Keys**.
- Its note is the one line from UQ35.

**Where things land:**

| Press | Lands on | Focus | Says |
|---|---|---|---|
| `1`–`8` | that section, its list (a member's page is left, as a tab press leaves it) | that section's tab | — (the tab is `aria-current`) |
| `N` on a running encounter's page | the next actor | Next turn, or the round's Source at its end, as a press puts it | "<name> acts", from the live region, as a press does |
| `N` anywhere else | nothing | unchanged | — |
| Ctrl/⌘+Z, with a change | the page as it redraws after the undo | where it was, by `keepPlace` (as the toast's Undo) | the toast: "Undone: <label>" |
| Ctrl/⌘+Z, nothing to undo | nothing | unchanged | the toast: "Nothing to undo." (UQ37) |
| `A` | the Activity box | its Undo, or its close button (as today) | — |
| Closing a box `A` or `?` opened | back | the element `A` or `?` was pressed on, without scrolling (259) | — |
| `?` | the Keys box | its switch's pressed half (as today) | — |

**Copy for the voice pass** (the builder pastes each into the PR as it renders): the Keys list and its note (UQ35),
"Nothing to undo." (UQ37), and the switch's label "Keys".

## 10. Worked examples, as named tests

The builder writes these first and **shows each failing on `main`** before building. Put the run's output in the
PR. U3's builder didn't, and its reviewer had to.

| Test | File | Pins |
|---|---|---|
| `U5: 1–8 open the sections in tab order, as a tab press does` | `smoke-table-keys.test.mjs` | Dead Air: `3` → Cast, focus on `[data-tsec=cast]`, `aria-current=page` on it alone; on Ibarra's page, `3` → the Cast list; `Numpad6` → Encounters; Shift+`Digit1` → Sessions (UQ36); Ctrl+`1` does nothing and isn't prevented |
| `U5: the open section's tab is aria-current on every route` | `smoke-table-frame.test.mjs` | open the table, a tab press, a digit, the strip's thread chip (Sessions), Find's member hit (Cast), Back: each time exactly one `[data-tsec][aria-current=page]`, the open one |
| `U5: N runs Next turn on a running encounter's page and nothing elsewhere` | `smoke-table-keys.test.mjs` | Dead Air's running fight: `N` moves Now as a press does (the `[aria-current=step]` row changes, focus on `[data-enext]`, the live region says "<name> acts"); on Cast, `N` changes nothing and `prevented` is false; on a planned encounter's page, nothing |
| `U5: Ctrl+Z and ⌘+Z take back the newest change and say so` | `smoke-table-keys.test.mjs` | press a clock's + (5 of 6), Ctrl+Z: 4 of 6, the toast "Undone: …"; Meta+Z does the same on the next change; Ctrl+Shift+Z does nothing; an emptied log: "Nothing to undo." |
| `U5: A opens Activity and ? opens Keys, and each closes back where it was pressed` | `smoke-table-keys.test.mjs` | focus on a card, `A`: the Activity box; Esc: focus on the card, no scroll; `?`: Keys lists 1–8, N, Ctrl/⌘+Z, A and ?; its switch's Off turns `3` off as well as `F` |
| `U5: no new key fires in a field, a box, the ⋮ menu, on repeat or with the keys off` | `smoke-table-keys.test.mjs` | 259's own matrix (its second test), run for `3`, `N`, `A`, `?` and Ctrl+Z: none acts, and none is prevented in a field (so the browser's own text undo works) |

## 11. Tests beyond the examples

- **Voice:** every new string passes `voice.test.mjs`. **Tokens and `style=`:** `build.test.mjs`.
- **The decision's words:** `docs.test.mjs` counts §3's entry: about 315 with Touches, and supersession marks don't count.
- **Phone-check:** on every table walk, the active tab's box lies inside `#topnav`'s box (±1px) at 390 and 768. This
  is #39's guard. Mutation-test it by turning `showActiveTab` off: the walk that opens on a far tab fails.
- **Mutation-test:**
  - Drop `aria-current` from the active tab, and the route test fails.
  - Let `N` act off its page, and the N example fails.
  - Let Ctrl+Shift+Z undo, and the Ctrl+Z example fails.
  - Drop the `inField` check for the new keys only, and the matrix fails.
  - Check each for a second path that already covers it (`WORK-ORDERS.md`, *The pre-flight*). The digit test, for
    instance, must fail through the key and not pass through a click.
- **Expected breaks, updated, not stops:**
  - `smoke-table-keys`' "⋮ → Keys lists the keys…": only if its copy assertions move. They check F, J, Esc and Enter,
    which stay.
  - `smoke-table-encplan:157`, if it pins the absence of `aria-current`. Read it: it accepts either.
  - Version literals.
- **The carried rule:** a key that acts on a read view's control (N on the encounter page) finds the control with
  `$` in its test, never by `app.click`, so `reach` can't press Edit for it (U3's K3).

## 12. Steps

1. `git submodule update --init private`, then `npm run test:fast` (a fresh branch from `main`).
2. Write §10's tests and **run them on `main`: all six fail**. Paste the run in the PR.
3. Read `craft-floor.md`. Run **`/impeccable audit`** on the tab row, the Keys window and the encounter page (a11y:
   names, `aria-current`, `aria-keyshortcuts`, focus order). Report its findings, and apply only those inside §9.
4. Build the key table and its guards in the one listener, the tabs' `aria-current` and hints, N, Ctrl/⌘+Z, A and ?.
   Then `npm run verify`, and check in the dev preview.
5. The Keys window's list and switch. Then `npm run verify`.
6. phone-check's tab-in-view assertion. Then `npm run phone-check`.
7. Run **`/impeccable harden`** on the keys: modifiers, repeat, IME, AZERTY, the numpad with NumLock off, a box opened
   by a key, a stale toast. Then `npm run verify`.
8. **The plan §3 gate:** inject the browser overlay at 1024px and 375px on **Dead Air**, with the tab fronted, on the
   tab row (Cast open), the Keys window, and the running encounter's page. Fill every cell.
9. **`/impeccable polish`** on the pages touched, reading U3's snapshot.
10. Close-out (§14).

## 13. Stop and ask

**Stop** (to the conductor) if:

- any of 259's eight tests in `smoke-table-keys` needs a change other than its Keys copy;
- a key needs a second keydown listener, or a capture-phase one;
- N can't reach Next turn through its button, and the build would need `next` exported or duplicated;
- Ctrl/⌘+Z needs a path other than `undoTableEntry`;
- a stored field or an engine change seems needed;
- the header or bar budgets move at 390px;
- **an Impeccable command wants to change anything outside §9.** Report what it proposed, and don't apply it.

**Not stops** (expected, and updated in place): §11's expected breaks and the version literals.

## 14. Close-out

- **The tier's items** (`close-the-session`):
  - the decision and its INDEX line, with 259 marked;
  - `CHANGELOG.md` lines in player voice, then `npm run changelog`;
  - `npm run bump -- 0.66.0` (or the next minor);
  - a log entry;
  - STATE rewritten where it names U5, with the plan done;
  - the plan's §4 row marked built;
  - a row in `docs/log/shipped.md`.
- **The changelog** (a draft, for a voice pass):
  - "On a table, 1–8 go to the sections, N runs the next turn on a fight's page, Ctrl/⌘+Z takes back the last
    change, A opens Activity, and ? lists them all. ⋮ → Keys turns them off."
  - "A screen reader says which section is open."
- **The PR:**
  - Title: `U5: Keys and landmarks (gm-at-the-table; Decision N)`, with the template's sections.
  - **Where the order didn't fit** (required; "Nothing" is fine).
  - An **Impeccable** section (plan §3.8): audit, harden and polish, each with the screen it ran on and what it
    changed, or "nothing", plus §12.8's overlay grid with every cell.
  - §12.2's failing run on `main`.
  - Every expected break, old → new, by file.
  - It notes that the plan closes on merge, in the conductor's PR.
- **The re-critique** (plan §3.6): the reviewer runs `/impeccable critique` on GM mode with Dead Air seeded, commits
  the snapshot, and sets its table beside U3's (27/40, H4 re-scored: 28).

**Review checklist** (beyond the tests passing):

- [ ] Run it in the dev preview with Dead Air seeded, at 1024px and 375px, by keyboard alone:
  - every digit 1–8, from a list and from a record's page; focus on the tab, `aria-current` moved;
  - on the running fight's page, `N` three times, through a round's end; `N` on Cast does nothing;
  - press a clock's +, then Ctrl+Z (and ⌘+Z if a Mac is to hand); Ctrl+Z on an empty log;
  - `A`, then Esc; `?`, then Off, then `3` does nothing;
  - each key in a field, in Find, in Jot, with ⋮ open: nothing.
- [ ] A screen reader, or the accessibility tree: the open tab announces as current, and each tab's key shortcut
      reads.
- [ ] 259's eight tests are unchanged except for Keys copy.
- [ ] One keydown listener. `preventDefault` only when a key acts.
- [ ] phone-check's tab-in-view guard bites (mutation-tested), and the budgets hold.
- [ ] The overlay grid has every cell, on Dead Air, with the tab fronted.
- [ ] The Impeccable section names audit, harden and polish, and its "nothing outside §9" line is true. Spot-check
      one claimed change against the diff.
- [ ] Every new string is in the PR for the voice pass.
- [ ] N's entry is pasted whole (or each changed clause is named in the PR), and 259 is marked with INDEX to match.
- [ ] **Last, after every push:** read the PR body again. It still has its Impeccable section and the failing run
      (U3's body lost one on a rewrite).

## 15. Handing it over

The two prompts in `WORK-ORDERS.md`, with this order's path, `docs/plans/gm-at-the-table/U5-keys-and-landmarks.md`.
Both sessions are **local**, where Impeccable is installed. The conductor adds the same Impeccable lines as for U1–U3:
run §12's commands through the Skill tool and nothing else, and treat a command reaching outside §9 as a stop.

This order's traps:

- **Next turn is a closure.** `next` lives inside `bindEncounters`. The document listener reaches it by clicking
  `[data-enext]`, never by copying its body.
- **A digit must be the tab press, not a copy of it.** U3 put focus-on-the-tab in `renderTableChrome`'s click
  handler. Pull that into one function and call it from both, or the key will land focus somewhere else.
- **Ctrl+Z in a field is the browser's.** The `inField` guard must run before the Ctrl+Z branch, and the test must
  show it isn't prevented there.
- **A box opened by a key returns focus to where the key was pressed.** Activity and Keys return to ⋮ today.
  Follow `openFind({ viaKey:true })`.
- **`?` and AZERTY digits need Shift.** 259's "no Shift" rule has two named exceptions (UQ36, UQ40), and no other key
  gets one.
- **The overlay's chrome findings are known false positives:** the brand violet and cyan, and Inter. Only content
  counts.
- **The plan closes on merge,** in the conductor's PR. Don't move the plan or touch the archive.
