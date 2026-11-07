# Work order S19: Shortcuts. Find and Jot a key away on a table, with a switch to turn them off

**Plan:** [`../gm-mode.md`](../gm-mode.md), the *Still to build* row "Shortcuts" (W139;
Ken: before launch if it's ready, 2026-10-30), and [`WISHLIST.md`](../../WISHLIST.md)'s W139.
**Status:** **Drafted 2026-10-30** by Claude (Opus), the S18 reviewer, after #276 (S18,
Decision 258) merged. Ken picked it as the next order (2026-10-30, through the conductor).
**Approved by Ken 2026-10-30** (in the conductor session), as Rule or shape, one decision, no version moves, no `private/` commit.
**SQ1–SQ6 answered by Ken 2026-10-30: every default.** He picked SQ1 (*Plain F and J*) and SQ2 (*On, with Off switch*) by name, SQ3 and SQ4 as one pair (*Both defaults*), and SQ5 and SQ6 as one pair (*Both defaults*).
**Branch:** from `main` at `cfe6ae2` or later, PR to `main`, switched off (Decision 173).
**No `private/` commit.**
**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md).
The conductor (Opus) starts **S19 build** (Sonnet), then a fresh **S19 review** (Opus)
once the PR is open. Builder and reviewer message each other directly. Anything for Ken
goes to the conductor. §15 is the hand-over.
**Runs alone.** It touches:
- `gm.js`: one document `keydown` handler, the header's two buttons, the ⋮ menu, Jot's Save;
- `shared.js`: how a modal that a key opened gives focus back;
- the ledger and STATE.

No engine change, no data change, no schema moves, no CSS beyond the Keys box (if any).

**Tier: Rule or shape.** Which keys, when they fire, and that they can be turned off are
choices someone could make otherwise. One decision, **N**. It extends 208 (Find and Jot)
and 164 (focus never falls to `<body>`), and cites 111, 140, 161 and 166.

**Carried over from S18's review** (#276: one review, two fix rounds; Ken took K1–K3 as
recommended, issuecomment-6538720476). Each item is marked as the order's, the build's or the
process's:

- **The order's: a guard that couldn't fail.** S18's L2 compared `.main-grid`'s columns,
  which are `fr` tracks a `p`'s `max-width` can never move. **Here:** every test in §10
  and §11 names the mutant it catches. The builder runs each mutant, and the PR's table says
  what caught it.
- **The order's: a class with more readers than it named.** `.roster-list` had 13 readers,
  and S18 named 6. **Here:** §5 lists every `keydown` listener in `src/ui/`, every caller
  of `openModal`'s focus return, and every test that lists the ⋮ menu, found by grep on
  `cfe6ae2`.
- **The order's: a rule that didn't say which element it applied to.** SQ6 said "the bar",
  and the encounter's bar turned out never to let go (K2). **Here:** every rule in §9 names
  the element or the screen it applies to, and the screens it doesn't.
- **The order's: two requirements that couldn't both hold** (`.enc-bar` and Back first,
  K1). **Here:** §9's *Where things land* has a row for each way a box opens and closes,
  checked against `closeModal`'s code.
- **The build's: rows that scrolled with no sign (S1), and one saved place for every page
  (S1b).** Both were behaviour no jsdom test could see. **Here:** §10 says which
  assertions jsdom can't make (a typed letter, scroll position, a browser's reserved keys),
  and puts each of them in a Chromium walk (§10, B1–B3) with its numbers in the PR.
- **The build's: a jsdom assertion that can never fail** (`scrollLeft` is always 0 there).
  **Here:** no jsdom test asserts on `scrollLeft`, `scrollY`, a field's value after a
  keydown, or what a browser does with a key it reserves.
- **What worked:** the builder reported every browser number; the fixture was reproducible
  from `main`; the voice table went in the reviewer's message to the conductor. Keep all three.

**Pre-flight** (`docs/WORK-ORDERS.md`, *The pre-flight*), against `main` at **`cfe6ae2`**,
2026-10-30. The functions below were opened and read. Probes were run in Edge (Chromium)
through Playwright on the built file with the sample table *Dead Air*, by a scratch script
that isn't committed. Line numbers are `cfe6ae2`'s.

- **No plain key does anything today.** The only document `keydown` listeners in `src/ui/`
  are Escape handlers:
  - `app.js:384`: Esc closes the flyout and the menu (W58, Decision 166);
  - `shared.js:483`: Esc closes a popover;
  - `shared.js:625`: Esc closes a tip;
  - `shared.js:428`: on the modal itself, Esc closes it.

  The rest are on one field each (Enter adds, `gm.js:222, 854, 976, 1445, 1750, 1985,
  2049, 3412, 3732`), the encounter's delegated Enter (`gm.js:3484`), and Jot's
  **Ctrl/⌘+Enter saves** (`gm.js:529`). **Probe:** on a table with focus on `<body>`,
  pressing `f`, `j` and `/` opens nothing and leaves focus on `<body>`.
- **Find and Jot** are `openFind` (`gm.js:440`) and `openJot` (`:505`), bound to the
  header's `[data-tfind]` and `[data-tjot]` in `renderTableChrome` (`:288–289`). Both open
  the one modal (`openModal`, `shared.js:438`). It records `opener: document.activeElement`
  and focuses the body's first `[autofocus]`, `input` or `select` (`:446`): Find's field,
  or Jot's textarea.
- **Focus comes back through `closeModal`** (`shared.js:449`). It goes to the opener, unless
  the opener is `<body>` or gone, and then to `returnTo` (`[data-tfind]` / `[data-tjot]`),
  with a plain `.focus()` (`:461–463`).
- **Jot's Save doesn't use that.** It calls `closeModal()` and then focuses `[data-tjot]`
  itself (`:526`).
- **Prototype: a handler that opens the box on keydown, without `preventDefault`.** In
  Chromium, **the letter lands in the box**: Find's field reads `"f"`, and Jot's textarea
  reads `"j"`. With `preventDefault` both are empty and focused. **jsdom can't show this**: a
  synthetic keydown inserts no text.
- **Prototype, a short screen (844×390).** The header un-sticks below 540px tall (Decision
  140). The probe opened a cast member, scrolled to 1500 with nothing focused, then pressed
  `f` and Esc. **The page jumped to scrollY 0:** `closeModal` focused the header's Find
  button, which is at the top of the page there. A mouse user can't hit this, since they
  clicked a Find button they could see.
- **Prototype, Jot by key from a focused card button (`[data-copen]`), then Save:** focus
  goes to the header's Jot button, **not back to the card**. W139 asks that focus "returns
  where it was" (Decision 164).
- **Typing isn't folded by a keydown.** `lastEvent` (`shared.js:387–389`) records keydowns,
  but `typingNow` (`gm.js:89`) only counts an `input` event in a field of `main`. Opening
  a box records nothing (`tableChange` isn't called).
- **The ⋮ menu** (`gm.js:280–287`) is Rename, Export, Activity, What's new, Home.
  `smoke-table-cast.test.mjs:75` pins that list **as a literal**.
- **UI preferences** live in `localStorage` under `shadows.ui.*`:
  - `shadows.ui.vitalsPinned` (`app.js:90`);
  - `shadows.ui.expert` and `shadows.ui.expertSeen` (`shared.js:691`);
  - `shadows.ui.traitsOpen` (`sheet.js:543`).

  The three loaders that walk storage filter by their own prefix and id test:
  - characters: `shared.js:199`, `CHAR_PREFIX` and `isIntakeId`;
  - tables: `gm.js:66`;
  - packs: `gm.js:2351`.

  So a new `shadows.ui.*` key isn't read as a record. `initWhatsNew` (`app.js:276`)
  counts any `shadows.` key as a returning visitor, as it does every other preference.
- **The ledger**, searched by name in *Touches* and text for: `shortcut`, `keyboard`,
  `keydown`, `Ctrl`, `Escape`/`Esc`, `accesskey`, `Find`, `Jot`, `focus`, `screen reader`,
  `hdrmenu`, `openModal`, `closeModal`. The hits that govern this:
  - **208** (Find and Jot in the header): extended. They also open by key.
  - **164** (keeping your place: focus never falls to `<body>`): extended. A box a key opened
    gives focus back without moving the page.
  - **111/112** (the modal primitive): cited. The modal is unchanged for a mouse.
  - **166** (W58: Esc closes one layer): cited, unchanged. The new handler ignores Escape.
  - **140** (the header un-sticks below 540px tall): cited. It's why the short screen jumps.
  - **161** (the wizard's strip lets go while typing): cited for its principle. A key never
    acts while a field has focus.
  - **207** (the Reference): **not** touched under SQ3's default. The keys list is in ⋮, not
    on the Reference.

  No decision names a keyboard shortcut. *Replaces: nothing* holds.

## 1. Goal

A GM at a keyboard opens Find or Jot without reaching for the mouse, from any tab or page
of a table, and comes back to where they were when the box closes. A phone or tablet with no
keyboard loses nothing. A GM who doesn't want single-key shortcuts (speech input, a cat on
the keyboard) turns them off once.

**Done when:**
- On a table, with focus anywhere but a field, **F** opens Find with its field focused and
  empty, and **J** opens Jot with its box focused, holding the draft and no `j` (K1, B1).
- No key acts while a field has focus, with Ctrl, ⌘ or Alt held, while a box is already open,
  or off a table (K2).
- Closing a box a key opened puts focus back where it was. If that was nowhere, it goes to
  the header's Find or Jot button, and the page doesn't move (K3, K4, B2).
- ⋮ → **Keys** lists every key a table answers to, and turns the single-key shortcuts off and
  on. The choice survives a reload (K5, K6).
- The header's Find and Jot buttons say their key to a screen reader (`aria-keyshortcuts`)
  while the shortcuts are on (K7).
- Home, the wizard and the player's sheet behave exactly as before (K2's off-table cases;
  every existing test passes, with the one expected break in §13).

## 2. Tier, versions, numbers

- **Tier:** Rule or shape.
- **App:** **no bump.** Everything is behind a table, which is switched off (173). One line in
  `changelog-pending.md` (§9).
- **Game data, character schema, table schema, pack schema, ruleset:** unchanged. The switch
  is a browser preference, `shadows.ui.keys`, like `shadows.ui.vitalsPinned`. It is not in
  the table file.
- **`private/`:** untouched.
- **Decision:** the next free number, **N** (the ledger ends at 258 on `cfe6ae2`).
- **Wishes:** W139 moves to *Built*. Its "then whatever else earns a key" stays a line on it
  (SQ5).

## 3. The decision, drafted

Paste it after the last decision, under INDEX §3's **GM mode** heading, and fill in **Built**.
Under 350 words, Touches included (`wc -w`). It's worded for the defaults; a different SQ
answer rewords it.

```
N. **On a table, F opens Find and J opens Jot, never while typing, and ⋮ → Keys lists them and turns them off.**
     *2026-10-XX · Ken + Claude · Touches: keyboard shortcuts, keydown, F, J, Find, Jot, openFind, openJot, openModal, closeModal, aria-keyshortcuts, ⋮ menu, Keys, shadows.ui.keys, focus, W139, Decision 111, Decision 140, Decision 161, Decision 164, Decision 166, Decision 208*
     - **Decided:** On a table's screen, a plain **F** opens Find and a plain **J** opens Jot, any case, unless focus is in a field, Ctrl, ⌘ or Alt is held, the key repeats, or a box is open. The key never types into the box it opens. Closing a box a key opened returns focus where it was, or to its header button, without moving the page. ⋮ → **Keys** lists F, J, Esc and Ctrl/⌘+Enter, and turns F and J off or on for this browser (`shadows.ui.keys`); the header buttons carry `aria-keyshortcuts` while they're on. Home, the wizard and the player's sheet have no shortcuts.
     - **Why:** A GM mid-session reaches for the mouse to find a name or keep one. Letters are the only keys no browser reserves on a page; a field, a held modifier and an open box are where a letter means something else, and an off switch is what a single-letter shortcut owes speech-input users (WCAG 2.1.4).
     - **Rejected:**
       - `/` for Find: Firefox's quick find.
       - Ctrl/⌘+K or Alt+letter: the browser's (Chrome's address bar, Windows' menus).
       - A visible key chip on Find and Jot: header width at 390px (208's *Revisit if*).
       - Keys on the player's sheet: it has no Find or Jot.
       - More keys now (Next, the tabs): F and J prove the pattern first.
     - **Replaces:** nothing. Extends 208 (Find and Jot open by key) and 164 (a key's box gives focus back without scrolling).
     - **Revisit if:** a GM asks for another key, a browser takes F or J, or players get a sheet-wide search.
     - **Built:** switched off (173); PR #…; log 2026-10-XX.
```

No supersession marks: 164 and 208 are extended, not replaced. Cite them in N only.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **Which keys.** Plain **F** for Find and **J** for Jot (letters no browser reserves on a page, ignored while typing in a field)? Or **`/`** for Find, the web's common search key, which is also Firefox's quick find, so the app would take it from the browser? Or a modifier combination (**Ctrl/⌘+K**, **Alt+F**)? Those collide: Ctrl+K is Chrome's and Firefox's search bar, and Alt+F opens Chrome's menu on Windows. | **F and J** | Default (Ken, 2026-10-30) |
| SQ2 | **On by default, with an off switch?** A single-letter shortcut can fire from speech input or a stray key, which is why WCAG 2.1.4 asks for a way to turn it off. Default: **on**, with **Off** in ⋮ → Keys, remembered by this browser. Or off until the GM turns them on (Gmail's way)? That's safer, but nobody finds them. | **On, with an off switch** | Default (Ken, 2026-10-30) |
| SQ3 | **Where the keys are listed.** Default: a **Keys** item in the table's ⋮ menu, opening a small box that lists the keys and holds the switch. It's a setting, and ⋮ is on every tab and page. Or a **Keys** section on the Reference tab (W139's suggestion), which is a tab for the rules? Or both? | **⋮ → Keys** | Default (Ken, 2026-10-30) |
| SQ4 | **A hint on the buttons.** Default: `aria-keyshortcuts` on Find and Jot (a screen reader says "F"), with **nothing visible**: the header is tight at 390px, and 208's *Revisit if* is "the header can't fit them". Or a visible key chip (**Find F**) from 1060px up, where there's room? | **`aria-keyshortcuts` only** | Default (Ken, 2026-10-30) |
| SQ5 | **How many keys now.** Default: **F and J only**, so the pattern proves itself. Next in a fight, the tabs and `?` for the list stay on W139. Or also **N** for Next on a running encounter (the most-pressed button at the table)? | **F and J only** | Default (Ken, 2026-10-30) |
| SQ6 | **Where they work.** Default: **a table only**. The player's sheet has no Find or Jot, so a sheet key would be a new feature, plus an app bump and a `CHANGELOG.md` line. Or the sheet too (which key, for what)? | **A table only** | Default (Ken, 2026-10-30) |

## 5. The assumption sweep

Every reader was found by grep on `cfe6ae2`. The last column answers the three questions for
each row: which guards read it, where it renders, and what text points at it.

| What changes | Today, where | After | Readers and twins |
|---|---|---|---|
| **A document `keydown` for F and J** | none (pre-flight) | one listener, registered once in `gm.js`, acting only while `S.screen==="table"`, the gm feature is on, and `shadows.ui.keys` isn't `"off"` | **Twins (must still work, and must run first or not care):** the Esc handlers `app.js:384`, `shared.js:428, 483, 625`. The new handler ignores every key but F and J, so Esc is untouched. The per-field Enter handlers and `gm.js:3484`'s delegated Enter never see F or J (the field guard). Jot's Ctrl/⌘+Enter (`:529`) is held off by the modifier guard. **`lastEvent`** (`shared.js:389`) records the keydown. `typingNow` reads only `input`, so nothing folds. |
| **What counts as "a field"** | — | focus is in an `input` (every type except `button`, `submit`, `reset`, `checkbox`, `radio`, `range`, `color` and `file`), a `textarea`, a `select`, or anything `[contenteditable]`, or `e.isComposing` (an IME mid-word) | **Readers:** `typingNow`'s own list (`gm.js:93`) is the twin. Match it, so "typing" means one thing. The read-only sheet's disabled fields can't take focus, so they don't matter. |
| **The modifiers** | — | Ctrl, ⌘ (`metaKey`) or Alt held → nothing. Shift is ignored only in that `F` (Caps Lock) counts as `f`; **Shift+F does nothing**, so a later order can use it | `e.key`, lowercased. **Not `e.code`:** on AZERTY `KeyF` is F, but on Dvorak it's U. On a non-Latin layout `e.key` isn't `f`, the key does nothing, and the buttons remain. Say so in the PR. |
| **A box already open** | — | `dialog.modal[open]` → nothing. F inside Jot is a letter (and in its textarea, a field anyway); on its Save button it does nothing | `openModal` reuses one `#modal`. A second open would replace Jot's body. `S.jotDraft` survives, but the press would be a surprise. |
| **`openFind` / `openJot`** | opened by the header buttons (`gm.js:288–289`) | also by F / J, with `preventDefault()` **before** opening (the prototype's `"f"` in the field) | **The same functions, no copies.** Tests that click `[data-tfind]` / `[data-tjot]` (28 hits, `hostile.test.mjs`, `smoke-table-*`) are unchanged. |
| **`closeModal`'s focus return** | to the opener, else `returnTo`, by `.focus()` (`shared.js:461–463`). Shared by every modal: the spell picker, Take a hit, the sheet's and the wizard's boxes | **For a box a key opened** (and only that): focus goes back the same way, but with `{ preventScroll:true }`, so the page doesn't move (the 844×390 probe: 1500 → 0). A box opened by a click is unchanged | **Every `openModal` caller is a reader:** grep `openModal(` (`shared.js`, `sheet.js`, `wizard.js`, `gm.js`). Each keeps today's focus return. Suggestion, not markup: an `openModal` option the key path passes. **Guard:** K3 for the key path. The existing modal tests (`smoke-*`, `hostile`) for the click path. |
| **Jot's Save focus** | `closeModal()` then `[data-tjot].focus()` (`gm.js:526`) | focus goes to the opener **if it's still in the page**, else `[data-tjot]`, without scrolling when a key opened it | **Tests that pin it:** `smoke-table-play.test.mjs:1436, 1443` focus the Jot button first, so the opener **is** `[data-tjot]` and they hold. On the Notes tab the page redraws (`renderTable`, `:524`), so a card the opener sat on may be gone. That's the `[data-tjot]` fallback. |
| **The header's Find and Jot** | `<button class="hdr-act" data-tfind>Find</button>`, same for Jot (`gm.js:280`) | + `aria-keyshortcuts="F"` / `"J"` while the keys are on; **no visible change** (SQ4) | `smoke-table-play.test.mjs:1328` reads `textContent === "Find"`: an attribute leaves it alone. The header's height and width don't move (phone-check's header rows). |
| **The ⋮ menu** | Rename, Export, Activity, What's new, Home (`gm.js:281–287`) | + **Keys**, after Activity (SQ3) | **`smoke-table-cast.test.mjs:75` pins the list as a literal: the one expected break** (§13). Update it to the new list in the same commit. `closeMenu` (`app.js:383`) closes it on Esc or an outside click, as for the others. |
| **The Keys box** | — | an `openModal` box: a short list (F, J, Esc, Ctrl/⌘+Enter) and one switch for F and J | Tool voice (`VOICE-APP.md`). Its switch is a `form-toggle` like the app's others, `aria-pressed`. Contrast guards (`build.test.mjs`) parse any new rule. |
| **`shadows.ui.keys`** | — | `"off"` when turned off; removed (or anything else) = on | **Readers of `shadows.*` keys:** the character, table and pack loaders filter by their own prefix and id (`shared.js:199`, `gm.js:66`, `:2351`), so it isn't read as a record. `initWhatsNew` (`app.js:276`) counts it as a returning visitor, like every `shadows.ui.*`. **Hostile:** any value but `"off"` is on, and a throwing `localStorage` is on. Checked against `shadows-data.js` ids: `keys` isn't one. |
| **Text that points at this** | W139; the plan's row; STATE; 208's text says Find and Jot are "beside ⋮" | N; W139's *Plan* line → *Built*; the plan's row → *Built*; STATE | Grep the docs for `shortcut`, `keyboard`, `W139` and `a key`, and give each hit a line in step 7. 208's text stays true. |

## 6. Read first

- `CLAUDE.md`, whole: *Change tiers*, *Decisions*, constraint 9 (no build state in copy).
- `docs/STATE.md`, whole.
- `docs/SCHEMA.md` §4: Decisions **111**, **112**, **140**, **161**, **164**, **166**, **208**.
- `docs/WISHLIST.md`: **W139**.
- `docs/VOICE-APP.md`: the Keys box is tool voice.
- **The code:**
  - `gm.js`: `renderTableChrome` (`:265–300`), `openFind`, `openFound`, `openJot`, `typingNow`;
  - `shared.js`: `openModal`, `closeModal`, `takeFocus`, `featureOn`, the `lastEvent` capture;
  - `app.js`: the Esc handler (`:384`), `closeMenu`;
  - `tests/smoke-table-play.test.mjs:1300–1490` (the secretary's tests, which this extends).

## 7. Out of scope

- **Any key but F and J** (SQ5's default): Next, the tabs, `?`, Shift+anything.
- **The player's sheet, Home and the wizard** (SQ6). No listener acts there.
- **The Reference tab** (SQ3's default) and **the header's look** (SQ4's default).
- **Changing Esc, Enter or Ctrl/⌘+Enter.** They are listed in the Keys box, not changed.
- **W140** (notes that organise themselves), **W78**, **W81**.
- **The engine, the data, every schema, and `private/`.**

## 8. The shapes

No data key, no saved field, no engine function. **UI state: none on `S`**, except what the
builder needs to remember that a key opened the open box (suggestion: a flag in the modal's
own state, `modalState`, not on `S`).

- **`shadows.ui.keys`** in `localStorage`: `"off"`, or absent. Read with a try/catch, like
  `featureOn` (`shared.js:115`). Any other value, a missing key or a throwing store means on.
- **`aria-keyshortcuts`** on `[data-tfind]` (`"F"`) and `[data-tjot]` (`"J"`) while on; absent
  while off.
- The ⋮ item: a `button` with a `data-` attribute of the builder's naming (checked against
  `shadows-data.js` ids), text **Keys** (✎).

## 9. The UI

**The keys** (on a table's screen only; every tab and every page, the read-only sheet
included):

| Key | Does | Not when |
|---|---|---|
| **F** (or Caps-Lock F) | opens Find, its field focused and empty (the last search, `S.findQ`, as today, but no `f`) | focus is in a field (§5's definition), Ctrl/⌘/Alt or Shift is held, the key repeats, a box is open, the keys are off, or the screen isn't a table |
| **J** | opens Jot, its box focused, holding the draft (`S.jotDraft`), with no `j` added | the same |
| Esc, Ctrl/⌘+Enter | unchanged | — |

**Where things land.**

| Press | Lands on | Focus |
|---|---|---|
| F, with focus on a button, card or link on the page | Find | Find's field |
| F, with nothing focused (`<body>`) | Find | Find's field |
| Esc / ✕ / the backdrop, after F from a button | the page, **not scrolled** | that button (164) |
| Esc, after F from `<body>`, on a short screen (header un-stuck) | the page, **at the same scrollY** | the header's Find button, without scrolling (B2) |
| A Find hit, after F | the hit's record (`openFound`, unchanged) | the record's title (unchanged) |
| J from a card button, type, Save | the page; the Notes tab or that session's page redraws, as today | the card button if it's still there, else the header's Jot (K4) |
| J, type, Esc | the page | where it was; the draft kept (as today) |
| F inside a field on the page | the letter types | the field |
| F with Jot open, focus on Save | nothing | Save |
| ⋮ → Keys | the Keys box | its first control |
| Keys box → switch Off → close | the page | ⋮ (`returnTo`) |
| F after Off | nothing | unchanged |
| A reload after Off | still off | — |

**The Keys box** (✎ every string, tool voice, a voice pass before merge):
- Title: ✎ **Keys**
- A list, the key first:
  - ✎ **F** · Find on this table
  - ✎ **J** · Jot it down
  - ✎ **Esc** · Close a box
  - ✎ **Ctrl+Enter** (✎ **⌘+Enter** on a Mac, or both written) · Save a jot
- A note: ✎ *"F and J don't fire while you're typing in a field."*
- The switch: ✎ **F and J** · **On** / **Off**, as a `form-toggle` with `aria-pressed`.
- A close button, as the other boxes have.

Use `kbd` for the keys if the builder likes; the contrast guards read any rule.

**The changelog line** (✎, `changelog-pending.md`, under a new bullet **Keys**):
✎ *"On a table, F opens Find and J opens Jot, as long as you're not typing in a field. ⋮ → Keys lists them and turns them off."*

**Phone and tablet.** Nothing new is visible but the ⋮ item. A tablet with a hardware
keyboard gets the keys; one without loses nothing.

**Screen readers.** In browse mode (NVDA, JAWS) a letter is the reader's own (F jumps to the
next form field), so it never reaches the page. That's by design: the reader's user has the
buttons, and `aria-keyshortcuts` tells them the key exists for focus mode. **Not tested in
CI.** The reviewer notes whether they tried a reader.

## 10. Worked examples, as named tests

Write these first and show each failing on `main`, or say why it already passes. jsdom tests
go in a new **`tests/smoke-table-keys.test.mjs`**. Dispatch `KeyboardEvent("keydown", { key,
bubbles:true, cancelable:true, … })` on the focused element (or `document.body`), and read
`dispatchEvent`'s return for `defaultPrevented`.

**What jsdom can't assert, and where it goes instead.** jsdom inserts no text on a keydown,
has no scroll position and no layout, and doesn't know which keys a browser keeps. So **no jsdom
test asserts** a field's value after a keydown, `scrollY`/`scrollTop`/`scrollLeft`, or what
Chrome does with a key. Those are **B1–B3**, a Chromium walk in `tools/phone-check.mjs`
(it has the browser and the seed table already). Their numbers go in the PR.

**jsdom (`npm test`):**
- **K1** `N: F opens Find and J opens Jot on a table, the key held back from the box`. Focus on
  `<body>`, then on a cast card (`[data-copen]`). F → `#modal` open, `[data-findq]` focused,
  the event `defaultPrevented`. Esc. J → `[data-jottext]` focused, `defaultPrevented`.
  Caps-Lock `F` (`key:"F"`, no `shiftKey`) also opens. **Mutants:** no listener (fails on
  `main`); `preventDefault` dropped (`defaultPrevented` false); `e.key` compared without
  lowercasing (Caps-Lock F fails).
- **K2** `N: F and J do nothing in a field, with a modifier, on repeat, over an open box, or off a table`.
  Each case asserts no modal, nothing prevented, and focus unchanged:
  - in a cast member's Name `input`, the Description `textarea`, the Status `select`, the
    Find field itself, and an element given `contenteditable`;
  - with `isComposing:true`;
  - with `ctrlKey`, `metaKey`, `altKey`, `shiftKey` (key `"F"`), and `repeat:true`;
  - with Jot open and focus on `[data-jotsave]`: still Jot, its draft unchanged;
  - off a table: Home, the wizard (`#btn-new`), a character's sheet, and Home with GM mode
    switched off.

  **Mutants:** each guard deleted in turn (the input/textarea/select line, contenteditable,
  `isComposing`, each modifier, `repeat`, the open-box check, the `S.screen` check). Each
  fails exactly its line. Name them in the PR's table.
- **K3** `N: closing a box a key opened gives focus back to the button it was opened from`.
  F from `[data-copen]`, Esc → that card button. F from `<body>`, Esc → `[data-tfind]`. A box
  opened by **clicking** `[data-tfind]` closes to `[data-tfind]` as today. **Mutant:** the
  key path's flag never set (focus still returns; the scroll half is B2's).
- **K4** `N: Jot's Save returns focus to where J was pressed`. J from `[data-copen]` on the
  Cast tab, type, Save → focus on that card button; the note saved with today's session as
  208 does. J on the Notes tab (which redraws), Save → `[data-tjot]`.
  `smoke-table-play.test.mjs:1436, 1443` still pass unchanged. **Mutant:** Save keeps
  focusing `[data-tjot]` (fails the first half).
- **K5** `N: ⋮ → Keys lists the keys and turns F and J off and on for this browser`. ⋮ → Keys
  → the box lists F, J, Esc and Ctrl+Enter; switch Off → `localStorage["shadows.ui.keys"]
  === "off"`, F does nothing, the header buttons have no `aria-keyshortcuts`. Boot again with
  that storage → still off. Switch On → the key removed, F opens Find. **Mutants:** the
  switch not stored (the reboot half fails); the listener not reading it (F opens while off).
- **K6** `N: a stored keys value that isn't "off" is on` (in `hostile.test.mjs`).
  `shadows.ui.keys` set to `"OFF "`, `"0"`, `"{}"`, a 10,000-character string, and a
  `localStorage` whose `getItem` throws → F opens Find, no page error. **Mutant:** a truthiness
  test instead of `=== "off"` (`"0"` turns them off).
- **K7** `N: the header's Find and Jot say their keys while the keys are on`.
  `aria-keyshortcuts` is `"F"` / `"J"` on every tab and on a member's page and a running
  encounter; absent when off; `textContent` still `"Find"` / `"Jot"`. **Mutant:** the
  attribute written regardless of the switch.

**Chromium (`phone-check`, numbers in the PR):**
- **B1** the built file at 1300×900, a table open, focus on `<body>`.
  `page.keyboard.press("f")` → Find open and `[data-findq]`'s value `""`. Esc;
  `press("j")` → `[data-jottext]`'s value is the draft with no `j`. Then focus a cast member's
  Name field and press `f` → the field's value ends in `f` and no modal opens.
  **Mutant:** `preventDefault` dropped → the value is `"f"` (the pre-flight's probe).
- **B2** at **844×390** (the header un-sticks): open a cast member, scroll to 1500 with
  nothing focused, `f`, Esc → `scrollY` still 1500 (±1), focus on `[data-tfind]`. Report the
  number. Then at 1300×900, a card button in view, `f`, Esc → `scrollY` unchanged.
  **Mutant:** `preventScroll` dropped → 0 (the pre-flight's probe).
- **B3** the keys don't take the browser's own: with focus on `<body>`, Ctrl+F (Windows/Linux)
  or ⌘+F → no modal opens. The browser's find bar isn't observable from the page. Report
  "no modal", not a claim about the find bar.

## 11. Tests beyond the examples

- **The voice guard** (`voice.test.mjs`) runs over the new strings. No flag ids or build state.
- **The contrast guards** (`build.test.mjs`) run over any new rule as they stand.
- **The data guard (135):** no id literal added; the new `data-` attribute and
  `shadows.ui.keys` checked against `shadows-data.js` ids.
- **No overflow:** phone-check's existing table walk (S18) covers the header at every width.
  ⋮ gains an item, not the header.
- **Mutation-test** every guard in K1–K7 and B1–B2 as listed. Commit first, save the file,
  mutate it, run under a `timeout`, copy the saved file back, never with `git checkout`.
  The PR has a table: each mutant, and the line that caught it.

## 12. Steps

`git submodule update --init private`, then `npm run test:fast` (a fresh branch). **Commit at
the end of each step.**

1. Take N: the lowest free on `origin/main`. Search the ledger again for §5's names.
2. **The tests first:** K1–K7 in `smoke-table-keys.test.mjs` and `hostile.test.mjs`. Show them
   failing on `main` (K6 and parts of K2 pass on `main` because nothing listens. Say which).
3. **The listener:** F and J, the guards, `preventDefault`. K1, K2.
4. **Focus back:** the key path's `preventScroll`, Jot's Save. K3, K4. Then B1 and B2 in
   phone-check.
5. **The switch and ⋮ → Keys**, `aria-keyshortcuts`, and `smoke-table-cast.test.mjs:75`'s
   list. K5–K7.
6. **In the browser** (`shadows-dev-preview`, `?gm=on`, the sample table). **Report every
   number. A missing number is a should-fix.**
   - B1–B3's results.
   - Tab from the header to ⋮ → Keys → the switch, by keyboard only: the order of stops.
   - The Keys box at 390 and 1300: no overflow (`scrollWidth === clientWidth`).
   - Both themes: the switch's contrast in its on and off states (≥ 4.5:1 text, ≥ 3:1 ring).
   - `npm run phone-check`: the frame fixture's line (S18) still `no difference`, and B1–B3.
7. **The docs:**
   - the ledger: N;
   - INDEX §3 under **GM mode**;
   - the plan's row → *Built*;
   - `gm-mode/README.md`'s row;
   - W139's *Plan* line (its "whatever else earns a key" stays open);
   - STATE;
   - every hit of §5's last row;
   - `changelog-pending.md`.

## 13. Stop and ask

- N is taken, or the ledger search finds a decision about keys that the pre-flight doesn't name.
- A key needs to work in a field, or with a modifier, to be useful.
- `closeModal`'s change reaches a box opened by a click (the sheet's, the wizard's, or a
  table's), or any existing modal test fails.
- A browser in the walk does something with F or J on a page (reserves it).
- Any change to `index.html`, the engine, the data or a schema.
- **Expected to break, and not a stop:** `smoke-table-cast.test.mjs:75`, the ⋮ menu's list
  as a literal. Add **Keys** to it in step 5.
- **Expected not to break:** `smoke-table-play.test.mjs:1328` (Find's text), `:1436, 1443`
  (Jot's focus after Esc and Save, opened from the button), every Esc test, the frame
  fixture (S18). If one fails, it's a real break: stop.

## 14. Close-out

*Rule or shape*, switched off: **no version bump, no schema bump, no `private/` commit** (say
each in the PR body).

- **SCHEMA:** N.
- **INDEX:** N under **GM mode**. After the voice pass, re-read N against Ken's picks.
- **`changelog-pending.md`:** the ✎ line.
- **STATE:** the GM row and §4's *what's next*.
- **The log:** an entry naming what the pre-flight found: the letter in the box without
  `preventDefault`, the short screen's jump to 0, and Jot's Save losing the opener. Plus a row
  in `docs/log/shipped.md`.
- **The plan, its README, W139**, as step 7 says.
- **PR title:** `feat(gm): F opens Find and J opens Jot on a table, never while typing, with a switch in ⋮ → Keys, switched off (S19, Decision N)`.
- **PR body:** the template's sections, plus:
  - **the browser numbers** (step 6), every one;
  - **the mutants**, each with what caught it;
  - the keyboard layouts it was tried on, or "QWERTY only";
  - **Where the order didn't fit** (empty is fine).

**Review checklist** (beyond the tests passing):
- **Re-do the sweep by grep:** every `keydown` listener in `src/ui/`, every `openModal(`
  caller (does any box opened by a click now return focus differently?), every test that
  pins the ⋮ menu or Jot's focus. Name why the new listener can't act on Home, the wizard
  or the sheet.
- **Press the keys by hand in the dev preview**, not by synthetic event: F and J from a
  card, from `<body>`, from a field (types), with Ctrl/⌘ (the browser's), with Jot open.
- **B2 by hand** at 844×390: scroll, F, Esc, and the page stays put.
- **The switch:** off, reload, still off; on, F works. A hand-edited `shadows.ui.keys` value.
- **A screen reader, if one is to hand:** NVDA's browse mode keeps F, and focus mode on a
  button lets it through. Say which was tried, or that none was.
- **Both themes, the switch's contrasts**, measured.
- **The voice pass:** every ✎ string, drafted side by side in the first review, and pasted
  into the message to the conductor and onto the PR.

## 15. Handing it over

**To the builder:** `WORK-ORDERS.md`'s building prompt, with this order's path
(`docs/plans/gm-mode/S19-shortcuts.md`). Add these traps:

- **`preventDefault()` before you open the box.** Without it, Chromium types the `f` into
  Find's field, because focus moves during the keydown. jsdom won't show you; B1 will.
- **No jsdom assertion on a field's value after a keydown, or on any scroll value.** They
  can't fail there. Those are B1 and B2.
- **Only the key path changes `closeModal`.** Every other box in the app (the sheet's, the
  wizard's, Take a hit) returns focus as it does today. A plain `.focus({ preventScroll:true })`
  for everyone looks harmless and is out of scope.
- **"A field" is `typingNow`'s list plus `select`, `[contenteditable]` and `isComposing`.**
  Don't write a second, different list.
- **`e.key`, lowercased, not `e.code`.** Shift+F does nothing; Caps-Lock F works.
- **The ⋮ list is pinned as a literal** (`smoke-table-cast.test.mjs:75`). Update it; it's
  the one expected break.
- **Commit before mutating, and restore by copying a saved file back, never with
  `git checkout`.**
- **Fill N everywhere at build time**, comments and test names included.

**To the reviewer:** `WORK-ORDERS.md`'s reviewing prompt, with this order's path, the
builder's session id, and the checklist in §14. Draft the voice pass for every ✎ string in the
first review, side by side, and **paste the table into the message to the conductor and onto
the PR**.
