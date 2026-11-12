# Work order S31: Help on every page

**Plan:** [`../gm-mode-next.md`](../gm-mode-next.md), session S31. It's new, from **Deighton's read of GM mode**
(relayed by Ken, 2026-11-11). He liked what's on the screens, but couldn't tell how, why or when to use much of it.
Threads, sessions and clocks are all on the first tab, before Players, Cast, City and the rest. Ken's read: the words
he and Claude chose while designing GM mode haven't clicked yet, even for the game's designer. A new GM will be more
lost.
**Status:** **drafted 2026-11-11 by Claude (Opus)**, in the session Ken took the feedback to. **Approved by Ken
2026-11-11**, in that session: he merged PR #321 and asked to run it. GQ32–GQ42 were left blank, so each takes its default,
**except GQ39** (below). Ken's words: "I think we can build out the updates, since we will just be feeding data to the
structure you will be building, right?"
**Ken's ask, as given:** a **?** at the top right near ⋮. Pressing it opens a sidebar on the right that says what the
left side of the screen is doing. Each page gets help on what its tab does, how it works and why a GM would use it.
Tips prompt a GM on what to do in a section. Ken's example, for Notes: "write thoughts that are just for you that you
don't want to forget, it can be searched for later".
**What this order adds to the ask** (Claude's pitch, 2026-11-11; Ken said draft it):
- **Three layers from one source.**
  - a one-line guide under each section;
  - the **?** panel, for the page that's open;
  - a word list.
- **Help organised around the GM's night as well as the tabs.** Deighton asked *when*, not only *what*.
- **Writing the help doubles as a vocabulary audit.** Any word that needs more than a sentence to explain may want
  renaming instead (Appendix B).
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Runs beside:** nothing. It shares `gm.js` with every GM session. If S28 (the cast at a glance) or S30 (Notes) lands
first, this order is re-pre-flighted and Appendix A is re-read against those screens (*An order that waited*,
`WORK-ORDERS.md`).

**Deighton's read runs beside the build (GQ39, as Ken changed it).** The conductor published Appendix A and B as
Deighton's page on 2026-11-11 (https://claude.ai/artifact/PJA74VW6g8ns7PcFS7367X): every piece of help and every word
gets "clicks / doesn't / I'd word it differently". The builder builds the structure and pastes Appendix A **as it stands
here**. When his answers come in, the conductor sends them to the builder as edits to `gmGuide`. **They land on the PR
before it merges**, so the reviewer's voice pass reads the final words. If they come after the merge, they're a Fix.
Nothing in his answers can change the order's shapes:
- a word added or dropped is a `words` entry;
- a different tip is a string;
- a rename is GQ38's follow-up, not this build.

An answer that would change the shape (a new kind of page, help organised differently) is a stop, brought to Ken.

**Pre-flight:** against `main` at `f7e5f7a` (PR #319, E1b's order, merged): app 0.66.1, game data 0.53, character
schema 0.34, table schema 0.19, pack schema 0.3. Decision **273** is the last in the ledger. **E1b's order is
approved and takes three numbers when built**, so N here is whatever is free when *this* builds. What I found:

- **The table header** is drawn by `renderTableChrome` (`gm.js:292`) into `#hdractions`.
  - Its buttons, in order: Find, Jot, ⋮ (`[data-menu-toggle]`).
  - ⋮'s menu (`#hdrmenu`): Rename, Export, Activity, Keys, What's new, Home.
  - The theme button (`#themeToggle`) sits after `#hdractions`, as the header's last child.
- **The header at 390px** (Dead Air, measured in the dev preview):
  - The header is 94px of 844 (11%; phone-check's budget is `HEADER_MAX_SHARE`, 20%).
  - The table name (`#brandctx`) runs 22–133px.
  - Find starts at 169, ⋮ ends at 320, and the theme button runs 338–368.
  - **That leaves 36px of slack.** A **?** button about 34px wide plus a 12px gap doesn't fit as things are: the name
    must give ground, or ? goes elsewhere on a phone (GQ40). The builder measures and reports this; it is not assumed.
- **`?` is taken.** Decision 272 (U5) made `?` open ⋮ → Keys:
  - `keyAction`, `gm.js:378`: `bare && e.key==="?"` → `openKeys({ viaKey:true })`.
  - The Keys list says **"? · These keys"** (`openKeys`, `gm.js:350`).
  - Four tests in `smoke-table-keys.test.mjs` pin it (`:430`, `:434`, `:439`, `:446`), plus the matrix at `:463`.
  - GQ33 moves `?` to Help. That's an expected break (§13), and a supersession of 272 in part.
- **A side panel already exists, on the player's sheet only:** the vitals flyout, `#vdrawer` with `#vscrim`.
  - `syncVitals`, `openVitals`, `closeVitals`, `renderDrawer` (`app.js:91–150`).
  - `PIN_MEDIA` is `(min-width:1280px)`; the pin is this browser's (`shadows.ui.vitalsPinned`).
  - Decision 160 pins it from 1280px. Decision 166 makes the closed flyout inert, gives Close focus on open and hands
    focus back on close. Esc closes one layer, and a tab move closes it. No focus trap: it isn't a modal.
  - **This is the pattern Help follows** (§9). Help gets **its own element** and does not reuse `#vdrawer`: 166 empties
    that panel when the sheet goes, and a table never shows it (258).
- **A table's frame has no side column** (Decision 258: `table-mode`, "one column, no rail, no vitals column"). A pinned
  Help column at 1280px supersedes 258 in part (GQ34).
- **No GM copy lives in the data today.**
  - Every GM string is in `gm.js`: about 40 empty states and step notes (`grep -n 'class="step-note"' src/ui/gm.js`).
  - The data holds `appCopy` (the player's state copy, Decision 71), `gmReference` (the Reference panels) and `ip`
    (`perHour`, read by the close-out).
  - GQ32 puts the help in the data as `gmGuide`.
  - Decision 135's guard (`engine.test.mjs`) fails on a data key nothing reads, so every key in §8 must have a reader.
- **The section empty states**, where a GM first meets each idea (`gm.js` line, today's text):

  | Where | Line | Today |
  |---|---|---|
  | Sessions, nothing at all | `:2323` | "Nothing yet. Start a session when you sit down to play, or add a thread you want to follow." |
  | Threads | `:2365` | "No threads yet." |
  | Sessions list | `:2379` | "No sessions yet." |
  | Players | `:4226` | "Nobody seated yet. Add a player, then import their characters." |
  | Cast | `:884` | "Nobody yet. The city fills up fast." |
  | City, places | `:1477` | "No places yet. Add one, or find it in The city." |
  | City, factions | `:1886` | "No factions yet. Add one, or find it in The city." |
  | Threats | `:3054` | "No threats yet. Slot in the pack that came with your GM material to see its threats here." |
  | Encounters | `:3297` | "Nothing on the books." |
  | Notes | `:451` | "Nothing on file yet. What you write here stays with the table and goes wherever its file goes." |

- **Each section has no heading of its own.** The only `h1` is the table's name, with "Table · created …" under it
  (`gm.js:566`). This is a known critique lead (`gm-mode-next.md` §6). The guide line (§9) goes under that line, so it
  doesn't need a heading.
- **The vocabulary on screen** was read off Dead Air's eight tabs in the dev preview. Appendix B lists every word a new
  GM meets that the screen doesn't explain.
  - **Two leads already logged** in `gm-mode-next.md` §6: "Key to" isn't explained (`castKeyToHtml`), and "book: N"
    under TOL and WILL isn't either.
  - **One the read turned up:** City has three names for three views: "The crew's places", "Factions" and "The city".
- **Probes on `main`** (Dead Air, 1024px), the worked examples' "before":
  - there's no `[data-thelp]` in the header;
  - `?` opens Keys;
  - no section shows a guide line;
  - the empty Notes tab reads today's line above.

**Carried over** (from U5's build and review, PR #313, the last GM order):

- **A key was taken before its order assumed it free.** U5 found `F` and `J` already bound. *Here:* the pre-flight
  grepped `keyAction` and found `?` taken (above).
- **The harness rule** (U3's K3): `reach` presses a page's one Edit when a selector is missing. Every test here that
  needs a control on a read view finds it with `$`.
- **The phone-check budgets carry:** the tables bar 20%, the encounter bar 27%, the strip's lead ≥120px at ≤390px.
  **S31 adds a header button, so the 20% is at risk** (GQ40). U5 refused a header button for exactly this.
- **The overlay grid comes from Dead Air,** every cell filled, with the tab fronted. No type under 11px.

---

## 1. Goal and Done when

A GM who has never seen GM mode presses **?** on any page and reads what that page is for, when in a night they'd use
it, what each thing on it means, and one thing worth doing there. A GM who's lost in the words finds every one of them
in one list. A GM who knows it all turns the guide lines off and never sees them again.

**Done when** (Dead Air seeded, and a new empty table):

1. **The button.** Every table page has a **?** button in the header, labelled "Help", between Jot and ⋮. Pressing it
   opens the Help panel for the page that's open, and pressing it again closes it.
2. **The key.** `?` does what the button does, under 259's and 272's rules: never in a field, a box or ⋮, never on
   repeat, and off with the rest of the keys. ⋮ → Keys still opens Keys, whose list now says "? · Help".
3. **It follows the page.** The panel shows the help for what's on the left: a section's list, or a page inside it (a
   session, its close-out, a cast member, Who knows what, a place, a faction, The city, a threat, a planned, running or
   past encounter, a note, a character's sheet). Every page a table can show resolves to one entry. A page with no entry
   of its own shows its section's.
4. **What the panel holds**, per page, from the data (§8):
   - what it's for;
   - when you'd use it (Before, At the table, After);
   - the words on that page, each with a definition;
   - one or two tips.

   At its foot are three links: **A night at the table**, **Every word** and **Keys**.
5. **Wide and narrow.**
   - From 1280px the panel sits beside the page as a column and pushes it, rather than covering it.
   - While open, it follows a tab press, a key or a jump.
   - Whether it's open is this browser's (`shadows.ui.gmHelp`), so a table reopens with it as it was left.
   - Below 1280px it's a flyout over the page with a scrim, as the vitals flyout is (166). It takes focus on Close when
     it opens and gives it back to what opened it. Esc closes it, and any move to another page closes it.
6. **A guide line under each section.** One line, from the data, sits under "Table · created …" on each of the eight
   sections' lists. It doesn't show on the pages inside a section. Help's foot has one switch, **Guide lines**, which
   turns them all off or on for this browser (`shadows.ui.gmGuide`). They're on until it's turned off.
7. **The empty states teach.** Each section's empty state (the pre-flight's table) is the data's line from Appendix A.
   Notes' empty state says what Ken's example says.
8. **The words are one list.** **Every word** lists every term in `gmGuide.words`, A to Z. A term on a page's help is
   the same entry, never a second copy.
9. **Nothing stored in the table file**, and no schema bump of any kind.
10. **The gate.**
    - phone-check's 20% header budget holds at 390px with the new button, and there's no sideways overflow at any width
      it walks.
    - The overlay is clean on the header and the panel (open on Sessions and on a running encounter) at 1024px, 1280px
      and 375px, or each finding is named.
    - The reviewer's re-critique doesn't lower any heuristic. H10 (Help and documentation) rises from U5's run (27/40, `.impeccable/critique/`).

## 2. Tier, versions, numbers

- **Rule or shape:** a player-facing behaviour someone could have chosen otherwise (where help lives, what `?` does,
  and a pinned column on a table). It also adds a data shape (`gmGuide`) and reopens two decided rules in part:
  - **272**, whose `?` opened Keys. The *Revisit if* hasn't happened, but the **new thing its Rejected list didn't
    weigh** is a help panel: `?` is the help key by convention, and U5 had no help to give it to.
  - **258**, "no vitals column". Its *Revisit if* ("a tab needs a column the measures lack") is this.
- **App:** a minor, 0.66.1 → **0.67.0**, or the next minor on `main` when built.
- **Game data:** **no bump.** `gmGuide` changes nothing a character can observe (Decision 68). Prove it with
  `node tools/outputs.mjs` before and after (§11).
- **No character, table or pack schema bump.** Both new preferences are this browser's.
- **Engine:** none. The help is read straight from `window.SHADOWS_DATA` by `gm.js`; nothing computes it.
- **Decision:** one, **N**, the next free number on `main` when built.

## 3. The decision, drafted

It's about 330 words with its Touches line, under the 350 cap (`docs.test.mjs` counts it), so **the builder pastes it
whole**. If a GQ answer changes a clause, swap the clause and say so in the PR.

```
N. **Every table page has Help: a ? in the header and the ? key open a panel for the page that's open, from the data's gmGuide; each section has a guide line; and every word GM mode uses is defined once.**
     *2026-11-11 · Ken + Deighton + Claude · Touches: Help, ?, data-thelp, gmGuide, contexts, words, night, intro, empty, guide line, shadows.ui.gmGuide, shadows.ui.gmHelp, help panel, help flyout, pinned column, PIN_MEDIA, table-mode, renderTableChrome, hdractions, keyAction, openKeys, Keys list, empty states, Every word, A night at the table, Decision 139, Decision 160, Decision 166, Decision 258, Decision 272*
     - **Decided:** A **?** button between Jot and ⋮, and the **?** key, open Help for the page that's open: what it's for, when in a night you'd use it, the words on it and a tip or two, from `gmGuide` in the data. Its foot links *A night at the table*, *Every word* and Keys, and holds the **Guide lines** switch. From 1280px Help is a column beside the page that follows it and stays open across visits (this browser's); below, a flyout as the vitals flyout is (166), closing on any move. Each section's list carries one guide line, on until the switch turns them off. Each section's empty state says what it's for, from the data.
     - **Why:** Deighton, the game's designer, couldn't tell how, why or when to use much of GM mode; a GM who didn't design the game will know less.
     - **Rejected:**
       - A first-run tour: it is read once, mid-setup, and gone when it's needed.
       - Help in the copy of each page: it would bury the tools a GM uses every night.
       - Help in `gm.js`: Deighton and Scott edit the data, not the code.
       - `H` for Help: `?` is the convention, and Keys sits one link down.
       - A dismiss on each guide line: eight choices where one will do.
     - **Replaces:** Decision 272 in part (`?` opens Help, not Keys; Keys lists it as Help). Decision 258 in part (from 1280px a table can have a column on the right: Help's).
     - **Revisit if:** GMs keep Help open all night (it's become a reference and wants a different shape), or a player's sheet asks for the same.
     - **Built:** app 0.67.0; PR #…; log 2026-11-…
```

Mark 272 `→ **Superseded in part by Decision N**` (`?` opens Help) and 258 the same (a Help column from 1280px). Mark
their INDEX lines to match, and put N's INDEX line under **GM mode**, after 272.

## 4. Questions for Ken

Defaults stand if left blank (`WORK-ORDERS.md`, step 3).

| Id | Question | Default |
|---|---|---|
| **GQ32** | **Where the help's words live** | **In the data, as `gmGuide`** in `shadows-data.js`, with the section empty states moved there too. Deighton and Scott edit data, and 135's guard keeps every key read. The alternative, `gm.js`, keeps GM copy in one file but puts the words where only Ken edits them |
| **GQ33** | **What `?` does** | **Opens Help.** Keys moves to a link in Help's foot, and ⋮ → Keys stays. `?` is the near-universal help key, and Keys is one press further. Supersedes 272 in part |
| **GQ34** | **Pinned beside the page from 1280px, and how it behaves narrower** | **Yes, from 1280px (160's width), remembered per browser. Below that, a flyout that closes on any move (166).** Ken's "sidebar on the right" is the wide layout. On a tablet a column would squeeze the cards below their 20rem floor (258) |
| **GQ35** | **Guide lines: one switch for all, or a dismiss on each** | **One switch, in Help's foot**, on by default, per browser. Each line carries no ×. Eight separate dismissals is eight more decisions for a GM, and a GM who's learned one tab has usually learned them |
| **GQ36** | **Should Help open on its own the first time a GM opens a table?** | **No.** A new table's Sessions empty state ends "Press ? for what each tab is for." A panel that opens uninvited covers the page the GM came to see, and is closed before it's read |
| **GQ37** | **Home** (Run a table, Your tables) | **Out of S31.** Home is S29's ("Home's rest"), and its header is the player's too. S29 takes a help line for Home from `gmGuide` |
| **GQ38** | **Renaming the words Appendix B flags** | **Not in this build.** Deighton's page (GQ39) collects which words don't click and what he'd call them. Renames that touch labels follow as their own Fix order, or as GQs for an order that's already touching that screen. If a rename lands first, the help is written to the new word |
| **GQ39** | **Deighton reads the help before it's built** | **Yes.** On approval the conductor publishes Appendix A and B as a page with "clicks / doesn't / try this" on each item, and Ken sends it. His answers edit the appendix, then the builder starts. Scott sees it too, since Threats and Encounters are his ground |
| **GQ40** | **? on a phone**, where the header has 36px to spare | **In the header at every width.** The table name ellipsizes to make room (it already can: it's the one flexible item). If phone-check's 20% or no-overflow fails at 390px, ? moves into ⋮ as **Help** below 480px only, and the PR says so. Not a stop unless both fail |
| **GQ41** | **Tips on the words themselves on the page** (a tap on "Close to full" defines it, with 139's `data-tip`) | **Not in S31; a wish.** Help's words list covers it once, and tips on headings is a new interaction (139's tips are on tags and stats). Revisit after Deighton's page shows which words still trip people |
| **GQ42** | **Help on the player's sheet** | **Not in S31.** No one has asked, and the sheet already has 139's tips on every rule. If a playtester asks, it's a wish that reuses `gmGuide`'s shape |

## 5. The assumption sweep

| What changes | True today, where | True after | Readers (by grep) |
|---|---|---|---|
| Header actions | Find, Jot, ⋮ (`renderTableChrome`, `gm.js:304`) | Find, Jot, **?**, ⋮ | `keyHints` (`:334`), which gains `[data-thelp]` → `?`; phone-check's header metrics (`tools/phone-check.mjs`, `HEADER_MAX_SHARE`); `smoke-table-frame` tests that count or order header buttons (grep `hdractions`, `data-tfind`, `data-menu-toggle` in `tests/`) |
| `?` key | opens Keys (`keyAction`, `gm.js:378`) | toggles Help, `viaKey` | `smoke-table-keys:430–446` and the matrix at `:463` (**expected breaks**: `?` now opens Help; the matrix's `?` row still asserts "nothing fires in a field / box / ⋮ / repeat / off", which must still hold) |
| Keys list | "**?** · These keys" (`openKeys`, `:350`) | "**?** · Help" | `smoke-table-keys:434` (asserts `?` is in the text: still true); `voice.test.mjs` |
| Table frame | `table-mode`, one column (258; `shadows.css`, grep `table-mode`) | plus a right column from 1280px while Help is pinned open (`help-pinned` or the like on `#app`) | phone-check's `TABLE_WIDTHS` (390, 768, 1300 and 1980: 1300 and 1980 are where Help pins); 258's measures (fields 36rem, cards 20–36rem): **the cards must still reach 20rem at 1280 with the column open**, else a stop; the encounter bar and the strip (`.tn-bar`), which stick under the header and must not run under the column |
| The vitals flyout | the player's sheet only (`app.js:91–150`) | **unchanged.** Help has its own element, scrim and setter | `syncVitals`'s "leaving the sheet empties the panel" (166): Help must not be emptied or hidden by it, and the vitals panel must never open on a table. Grep `vdrawer`, `vscrim`, `vitalsShown` |
| Section empty states | strings in `gm.js` (the pre-flight's table) | read from `gmGuide.empty.<id>` | every test asserting today's text: grep each sentence's first words in `tests/` ("Nothing on file yet", "No threads yet", "No sessions yet", "Nobody yet", "Nothing on the books", "No threats yet", "Nobody seated yet", "No places yet", "No factions yet") — **each is an expected break**, updated to the new line; `sample-table.test.mjs` (Dead Air is full, so none should render) |
| Notes' empty state | "Nothing on file yet. What you write here stays with the table…" (`:451`) | Appendix A's `empty.notes` | the same grep; **twin:** the same sentence's idea is in Home's "Tables stay in this browser…" (`:211`), which isn't changed |
| `gmGuide` (new) | — | `contexts`, `words`, `night`, `empty`, `ui` (§8) | Decision 135's guard (`engine.test.mjs`: every data key is read by code or named as text); `voice.test.mjs`, which must scan `gmGuide`'s strings (add it to the corpus it renders, as it does `appCopy`); `docs.test.mjs` (nothing) |
| A page's identity | spread over `S.tsection`, `S.sessOpen`, `S.coEnd`/`S.closeOut`, `S.castOpen`, `S.castView`, `S.cityView`, `S.placeOpen`, `S.factionOpen`, `S.threatOpen`, `S.encOpen`, `S.noteOpen`, `S.seatSheet` | one function, `helpContext()`, returns a context id for whatever's showing, falling back to the section's id. **It is total**: an unknown state returns the section | everything `pickTableTab` resets (`gm.js:279`) is a row in its switch; `renderTable` (`:535`) is where the panel's content is repainted, so a change of page repaints Help in the same update |
| Strip and bars | the Tonight strip and the page bars stick under the header (`paintTonight`, `:487`; 258's bar) | unchanged; with Help pinned they end at the column's left edge | `.tn-bar`, `.enc-bar` CSS; phone-check's bar budgets (unchanged below 1280, where Help never pins) |

**Which guards read a value this changes?**
- `voice.test.mjs` reads every new string, once `gmGuide` is in its corpus.
- `engine.test.mjs`'s unread-key guard (135) reads `gmGuide`'s keys.
- `build.test.mjs` reads `gm.js` for `style=` and the no-network rule. Help adds no inline style and no fetch.
- phone-check reads the header's height and every page's overflow.

**Where does each new line render?**
- A context's words appear in the panel, and only there.
- A guide line (`contexts.<section>.intro`) appears under the table's created line on that section's list only.
- `empty.*` appears in place of today's empty states, and nowhere else.
- **Twin:** Jot's "Goes on the table's notes. No session is open." (`jotWhere`, `:757`) says what `words.jot` says.
  Check the two agree, and don't change Jot.

**What text points at what this changes?**
- The Keys list's "? · These keys" (rewritten).
- 272's and 258's ledger text (marked).
- CHANGELOG 0.66.0's line "? lists them all". It's history, so it isn't edited.
- No `appCopy` names `?` (grep `"?"` and "These keys" in `src/data`: none).

## 6. Read first

- `CLAUDE.md`: constraints 1–5 and 9; *Change tiers*; *Decisions*; *Where things live* ("a data field is read by code").
- Decisions:
  - 139 (the tip primitive; the shape of "a rule is a tap away");
  - 160 and 166 (the vitals flyout and pin: Help copies its behaviour, not its element);
  - 258 (the table's frame and its measures);
  - 259 and 272 (the keys and their rules);
  - 270 (the Tonight strip) and 271 (records open to read);
  - 71 and 135 (copy in the data, and every key read);
  - 68 (no game-data bump for this).
- `docs/VOICE-APP.md` whole: help is **tool voice** (the GM is stuck), and tips may lean city.
- `src/ui/gm.js`: `renderTableChrome`, `keyAction`, `keyHints`, `openKeys`, `pickTableTab`, `pressTableTab`,
  `renderTable`, `paintTonight`, and each empty state in the pre-flight's table.
- `src/ui/app.js:85–160`: `PIN_MEDIA`, `pinRoom`, `syncVitals`, `openVitals`, `closeVitals`, the Esc handling.
- `src/styles/shadows.css`: `table-mode`, `#vdrawer`/`#vscrim`, `.tn-bar`, the header.
- `tests/smoke-table-keys.test.mjs` and `smoke-table-frame.test.mjs`; `tests/voice.test.mjs`'s corpus.
- Appendix A and B, as Deighton left them.
- Impeccable's `craft-floor.md`, before the first UI edit.

## 7. Out of scope

- **Renaming any label** (GQ38). Write the help for the words on screen today, or as Deighton's page leaves them if a
  rename lands first.
- **Home** (GQ37), and **the player's sheet** (GQ42).
- **Tips on words in the page** (GQ41).
- **A tour, a walkthrough or a first-run modal** (GQ36).
- **Searching the help from Find.** Find searches the table; Help is not table content.
- **The vitals flyout's code.** Help mirrors it, and doesn't share or change it.
- **Any change to what a page does.** If writing the help shows a page is confusing because of how it works, not what
  it's called, that's a lead for the PR, not a fix here.

## 8. The shapes

**Nothing stored in a table, character or pack. No engine change.** One data block, and two browser preferences.

```js
"gmGuide": {
  "ui": {                      // the panel's own words (Appendix A, §A0)
    "title": "Help", "forLabel": "What it's for", "whenLabel": "When", "wordsLabel": "On this page",
    "tipsLabel": "Try this", "nightLink": "A night at the table", "wordsLink": "Every word",
    "keysLink": "Keys", "guideSwitch": "Guide lines",
    "when": { "before": "Before a session", "during": "At the table", "after": "After" }
  },
  "night": [                   // A night at the table: three parts, in order
    { "when": "before", "text": "…", "sections": ["sessions", "cast", "encounters", "threats"] }, …
  ],
  "contexts": {                // one per section id in TABLE_SECTIONS, and one per page (§9's table)
    "sessions": { "section": "sessions", "intro": "…", "for": "…", "when": ["before", "during", "after"],
                  "words": ["closeToFull", "thread", …], "tips": ["…"] },
    "session":  { "section": "sessions", "for": "…", "when": ["during", "after"], "words": […], "tips": […] },
    …
  },
  "words": {                   // every term, once; a context names them by id
    "thread": { "term": "Thread", "text": "…" }, …
  },
  "empty": { "sessions": "…", "threads": "…", "sessionsList": "…", "players": "…", "cast": "…",
             "places": "…", "factions": "…", "threats": "…", "encounters": "…", "notes": "…" }
}
```

- **`intro`** is on the eight section contexts only, and required there. A page context has none.
- **`section`** is the TABLE_SECTIONS id a page context falls under. A section context names itself.
- **`when`** is a subset of `before`, `during` and `after`, in that order. The panel shows `ui.when`'s labels for it.
- **`words`** must each be a key of `gmGuide.words`. A term defined twice is a bug (§11's guard).
- **`helpContext()`** (in `gm.js`) returns a key of `contexts` for any state, and the section's own id when nothing
  narrower matches. It never returns a key that isn't there.
- **Preferences** (this browser's, never the table's; wrapped in try/catch as `keysOn` is):
  - `shadows.ui.gmHelp`: `"open"` or absent. It's read at 1280px and up only.
  - `shadows.ui.gmGuide`: `"off"` or absent; absent means the guide lines show.

## 9. The UI

**Direction:** the Night-Shift Readout world, nothing new visually. Mode: *Read*. The panel is prose with a list of
terms, so it gets the dossier's prose measure (75ch, 258) and the reference's sub-headings (`ref-sub`). **The words
are the work here, not the chrome.**

**The button:** **?** between Jot and ⋮, the same `hdr-act` style as Find and Jot, with `aria-label="Help"` and
`aria-expanded` showing whether the panel is open. While the keys are on, `keyHints` adds `aria-keyshortcuts="?"`.

**The panel, top to bottom:**
1. A heading with the context's name (the section's label, or the page's: "A session", "Close-out", "A cast member",
   …), and **Close**.
2. **What it's for**: `for`.
3. **When**: `when` as chips (Before a session · At the table · After).
4. **On this page**: each of `words` as a term and its text, in the order given.
5. **Try this**: `tips`.
6. The foot:
   - **A night at the table** replaces the panel's body with `night`, with a Back to this page. Each section it names
     is a link that presses that tab.
   - **Every word** replaces the body with every term, A to Z, with a Back.
   - **Keys** opens the Keys box, as ⋮ → Keys does.
   - **Guide lines**, an On/Off switch (`form-toggle`, as Keys' switch).

**Contexts** (the help for each page; the builder maps the state, §8):

| Context | Shows when | Falls under |
|---|---|---|
| `sessions` | the Sessions list (Next session, threads, sessions) | sessions |
| `session` | a session's page | sessions |
| `closeout` | a session's close-out | sessions |
| `players` | the Players list | players |
| `character` | a character's read-only sheet | players |
| `cast` | the cast list | cast |
| `whoKnows` | Who knows what | cast |
| `member` | a cast member's page | cast |
| `city` | The crew's places (City's first view) | city |
| `place` | a place's page | city |
| `factions` | the Factions view | city |
| `faction` | a faction's page | city |
| `gazetteer` | The city view (the book's NYTE City) | city |
| `threats` | the Threats list, or the empty pack picker | threats |
| `threat` | a threat, person or group from a pack | threats |
| `encounters` | the Encounters list | encounters |
| `encounterPlan` | a planned encounter's page | encounters |
| `encounterRunning` | a running encounter's page | encounters |
| `encounterPast` | an ended encounter's page | encounters |
| `reference` | Reference | reference |
| `notes` | the Notes list | notes |
| `note` | an open note | notes |

**Where things land:**

| Press | Lands on | Focus | Says |
|---|---|---|---|
| **?** (button or key), closed, ≥1280 | the panel opens as a column; the page reflows | the panel's Close | — |
| **?**, closed, <1280 | the flyout opens over the page with a scrim | the panel's Close | — |
| **?** (button or key), open | the panel closes | the **?** button, or where the key was pressed (as `viaKey` returns, 259) | — |
| Close or Esc | the panel closes | the **?** button | — |
| A tab, digit, jump or Back, pinned | the new page; the panel repaints for it | where the press puts it, unchanged | — |
| A tab, digit, jump or Back, flyout | the new page; the flyout closes (166) | where the press puts it | — |
| A night at the table / Every word | the panel's body changes | that view's heading | — |
| Back (inside the panel) | the page's help | the link that opened that view | — |
| A section link in *A night* | presses that tab, through `pressTableTab` | that tab (271) | — |
| Keys (in the foot) | the Keys box | its switch (as today) | — |
| Guide lines Off/On | the guide line goes or comes back on the page under the panel | the pressed half | — |

**Never:**
- The panel never traps focus (166: it isn't a modal).
- It is `inert` and `aria-hidden` while closed (166's single setter, its own copy).
- A modal opened from the page sits above it.
- At 1280px and up with the panel open, the page's cards still reach their 20rem floor, or it's a stop.

**The guide line:** one `step-note`-weight line under "Table · created …" on each section's list. It's left off a
page inside a section (a member, a session) and while that section is empty: the empty state teaches there.

**Copy:** Appendix A, as Deighton's page leaves it. The builder pastes every string into the PR as it renders, and the
reviewer drafts rewrites beside any that don't hold up (`WORK-ORDERS.md`, *The voice pass*). **Every sentence that
says what the app does is checked against the app** (§14's checklist). The draft was written from the code and Dead
Air, and a help line that's wrong is worse than none.

## 10. Worked examples, as named tests

The builder writes these first and **shows each failing on `main`**, and pastes the run into the PR. A new file,
`tests/smoke-table-help.test.mjs`, holds the smoke tests, with helpers from `smokekit.mjs`.

| Test | File | Pins |
|---|---|---|
| `S31: ? opens Help for the open section, and closing it gives focus back` | `smoke-table-help` | Dead Air, Sessions: `[data-thelp]` press → panel open, its heading "Sessions", `aria-expanded=true`, focus on its Close; it lists "Thread" and "Close to full" with their texts from the data; Esc → closed, `inert`, focus on `[data-thelp]` |
| `S31: Help follows the page it's on` | `smoke-table-help` | pinned at 1280 (the harness's `matchMedia` width): open on Cast, open Ibarra → heading "A cast member" and the word "Key to"; press `4` → "City"; Who knows what → `whoKnows`; a running encounter → `encounterRunning`; then at 1024, a tab press closes the flyout |
| `S31: every page a table shows has help, and every word it names is defined once` | `smoke-table-help` | walks every TABLE_SECTIONS id and every page reachable on Dead Air (a session, its close-out, a seat's sheet, a member, a place, a faction, The city, a threat if a pack is slotted, each encounter state, a note): `helpContext()` returns a key of `gmGuide.contexts`, and its every `words` id is a key of `gmGuide.words`; no two `words` share a `term` |
| `S31: ? is Help now, and Keys says so` | `smoke-table-keys` | `?` (Shift, `Slash`) toggles the panel, not the Keys box; Keys' list reads "? · Help"; 259's matrix for `?` (field, box, ⋮, repeat, off) still acts on nothing and prevents nothing |
| `S31: the guide line shows on each section's list until turned off, for this browser` | `smoke-table-help` | each of the eight lists shows its `intro`; a member's page doesn't; Help → Guide lines Off → none show, `shadows.ui.gmGuide` is `"off"`; reload → still none; On → back |
| `S31: an empty section says what it's for` | `smoke-table-help` | a new table: each section's empty state equals `gmGuide.empty`'s line; Notes reads Appendix A's `empty.notes`; Sessions' ends with the line pointing at ? (GQ36) |
| `S31: pinned, Help is a column that stays open across visits` | `smoke-table-help` | at 1280: open → `#app` carries the pinned class; reopen the table → still open; at 1024 the same preference doesn't open it |

## 11. Tests beyond the examples

- **Data shape** (in `engine.test.mjs`, beside 135's guard):
  - every `contexts` entry has `for`, `when` ⊆ {before, during, after} in order, `words` and `tips` (1–2);
  - every section context has `intro`;
  - every page context's `section` is a TABLE_SECTIONS id;
  - every `words` id resolves;
  - every `words` entry is named by at least one context (or it's dead copy);
  - `empty` has exactly the pre-flight's ten keys.
- **TABLE_SECTIONS against the data:** the smoke walk (the third example) fails if a section is added with no context.
  That's Decision 135's "a new tab needs zero app changes" turned round: a new tab needs a help entry.
- **Voice:** `voice.test.mjs` renders `gmGuide`'s strings into its corpus. No flag ids, no "TBD", no build state
  (constraint 9).
- **No game-data change:** `node tools/outputs.mjs` over the sample characters, before and after: identical. That's
  the evidence for not bumping `gamedataVersion` (68).
- **Mutation-test:**
  - Return a fixed context from `helpContext()`, and the "follows the page" example fails.
  - Drop a `words` id from the data, and the shape guard fails.
  - Leave `?` on Keys, and the keys example fails.
  - Ignore `shadows.ui.gmGuide`, and the guide-line example fails.
  - Pin below 1280, and the pinned example's 1024 half fails.
  - Check each for a second path (`WORK-ORDERS.md`, *The pre-flight*): the `?` test must fail through the key, not pass
    through the button.
- **phone-check:** the header stays within 20% at 390 and 768 with the new button (GQ40), with no overflow. At 1300
  and 1980 (`TABLE_WIDTHS`), seed Help open and assert the cards' column is at least 20rem.
- **Expected breaks, updated, not stops:**
  - `smoke-table-keys:430`, `:439` and `:446`: `?` now opens Help.
  - `:434` still passes (`?` is still in the list).
  - Every test asserting a section empty state's old text (§5's grep).
  - Version literals.

## 12. Steps

0. **The conductor's step, done 2026-11-11.** Deighton's page is published, and his answers arrive while the
   builder works (see the header). Paste Appendix A as it stands; the conductor sends his edits as they come.
1. `git submodule update --init private`, then `npm run test:fast`.
2. Write §10's tests and **run them on `main`: all seven fail**. Paste the run into the PR.
3. Read `craft-floor.md`. Run **`/impeccable shape`** on the panel against §9. Report what it proposes, and apply only
   what's inside §9.
4. `gmGuide` into the data from Appendix A, and the shape guard. Then `npm run verify`.
5. `helpContext()`, the button, the panel (both widths), `?`, Keys' line and the foot's links. Then `npm run verify`,
   and check in the dev preview at 1024 and 1280.
6. The guide lines and their switch; the empty states read from the data. Then `npm run verify`.
7. phone-check (GQ40's measurement, reported in the PR either way). Then `npm run phone-check`.
8. **Read every help sentence against the app**, in the dev preview on Dead Air, page by page. List any that aren't
   true in the PR, and fix the copy to match the app (a copy edit, through the voice pass), never the app to match the
   copy.
9. **`/impeccable harden`** on the panel: a long table name at 390, a note with no title, a modal over the pinned
   panel, Esc with a popover open (one layer at a time, 166), resize across 1280 while open. Then `npm run verify`.
10. The overlay gate (§1.10) on Dead Air, with the tab fronted.
11. **`/impeccable polish`**, then close-out (§14).

## 13. Stop and ask

**Stop** (to the conductor) if:

- `?` can't be Help without a second keydown listener;
- the panel needs to share or change the vitals flyout's code (`syncVitals` and the rest);
- at 1280 with Help pinned, the page's cards fall under 20rem;
- phone-check fails at 390 both with ? in the header and with GQ40's fallback;
- a page shows a state `helpContext()` can't name without a new state variable;
- the help can only be true by changing what a page does (§8 of the PR: a lead, not a fix);
- an Impeccable command wants anything outside §9.

**Not stops** (expected, and updated in place): §11's expected breaks, the version literals, and a help sentence that
§12.8 finds untrue (fixed in the copy, listed in the PR).

## 14. Close-out

- **The tier's items** (`close-the-session`):
  - the decision and its INDEX line, with 272 and 258 marked;
  - `CHANGELOG.md` lines, then `npm run changelog`;
  - `npm run bump -- 0.67.0`;
  - a log entry;
  - STATE where it names GM mode's next sessions;
  - this order's row in `gm-mode-next.md` §3 marked built;
  - a row in `docs/log/shipped.md`.
- **The changelog** (a draft, for a voice pass):
  - "Every table page has Help: press ? (the button or the key) for what the page is for, when you'd use it, and what
    its words mean."
  - "A night at the table walks through what to use before, during and after a session. Every word lists them all."
  - "Each section has a one-line guide, and Help's Guide lines switch turns them off."
  - "On a wide screen, Help stays open beside the page and follows you."
- **The PR:**
  - Title: `S31: Help on every page (gm-mode-next; Decision N)`, with the template's sections.
  - **Where the order didn't fit** (required; "Nothing" is fine).
  - An **Impeccable** section: shape, harden and polish, each with the screen it ran on and what it changed, plus the
    overlay grid.
  - §12.2's failing run on `main`.
  - Every expected break, old → new, by file.
  - GQ40's measurement at 390.
  - §12.8's list of help sentences found untrue and how each was fixed.
  - **Leads**: any page whose help was hard to write because the page itself is unclear (§7's last line).

**Review checklist** (beyond the tests passing):

- [ ] In the dev preview, on Dead Air and on a new table, at 1024, 1280 and 375px, read every context's help against
      its page. Every sentence that says what the app does is true. Spot-check five against the code.
- [ ] By keyboard alone: `?` opens and closes it, Esc closes it, focus comes back each time, and a digit with it pinned
      repaints it. `?` in a field, in Jot, with ⋮ open: nothing.
- [ ] Pinned at 1280: the cards keep their 20rem, the strip and the encounter bar end at the column, a modal sits
      above it, and resizing to 1024 turns it into the flyout.
- [ ] The vitals flyout on a player's sheet is unchanged: open, pin and Esc, as before.
- [ ] Each word is defined once (the data has no second `term` with the same name), and every term a page uses is in
      its `words`.
- [ ] No `gmGuide` key is unread (135), and `voice.test.mjs` scans them.
- [ ] Every new string is in the PR for the voice pass.
- [ ] N is pasted whole (or each changed clause named), with 272 and 258 marked and INDEX to match.
- [ ] `gamedataVersion` didn't move, and `outputs.mjs` shows why.
- [ ] **Last, after every push:** the PR body still has its Impeccable section, the failing run and §12.8's list.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md`, with this order's path, `docs/plans/gm-mode-next/S31-help.md`. Both sessions are
**local**, where Impeccable is installed. The conductor adds the Impeccable lines used for U1–U5: run §12's commands
through the Skill tool and nothing else, and treat a command reaching outside §9 as a stop.

This order's traps:

- **The words are the deliverable.** A panel that works with copy that's wrong fails the order. §12.8 isn't optional,
  and "the order said so" isn't a defence for a sentence the app contradicts.
- **`?` is taken.** It opens Keys today (272). Move it; don't add a second binding.
- **Mirror the vitals flyout, don't reuse it.** 166's setter empties `#vdrawer` when the sheet goes, and a table never
  shows it.
- **`helpContext()` is total.** A state it doesn't know falls back to the section, never to nothing and never throws.
  The walk test is what proves it.
- **The guide line isn't on a page inside a section, or on an empty section.** Two lines teaching one thing is noise.
- **Copy lives in the data.** A help string in `gm.js` is a finding. The panel's own labels are in `gmGuide.ui`.
- **Don't rename anything** (GQ38), however obviously a word wants it. Put it in the PR's leads.

---

## Appendix A — The help, drafted

**For Deighton's page first (GQ39), then pasted as data.** Tool voice throughout, since a GM opening Help is stuck. A
tip may lean city. Words in **bold** are buttons or labels as they are on screen today. Every line was written from
the code and Dead Air. §12.8 checks each one against the app, and lines marked ⚑ were the least certain when drafted.

### A0. The panel's own words (`ui`)

Help · What it's for · When · On this page · Try this · A night at the table · Every word · Keys · Guide lines ·
Before a session · At the table · After

### A1. A night at the table (`night`)

- **Before a session.** Open **Sessions** and read **Next session** top to bottom: the clocks close to full, the
  threads still open, what last session set up, and anyone the crew met who'll need numbers. Give those people a stat
  block on **Cast**. Plan the fight you expect on **Encounters**, and pull what you need from your pack on **Threats**.
- **At the table.** Press **New session** when you sit down. **Jot** (J) catches a name or a debt without leaving the
  page, and files it with the session. Run a fight from **Encounters**. While a session is open or a fight runs, the
  strip under the header keeps the round, the current thread and the nearest clock a tap away on every tab.
  **Reference** has the rules you'll look up; **Players** has everyone's HP and Conditions at a glance.
- **After.** Open the session and **close it out**: who came, how long you played, and the IP each character earns.
  Close the threads that ended, add the people the crew met, and write the seed for next session. Then **Export**: the
  file is the copy that lasts.

### A2. Each page (`contexts`)

**Sessions** · when: before, during, after
- *Guide line:* Your nights of play: what's coming, the threads in motion, and every session so far.
- *For:* Where the campaign's nights live. Before you play, **Next session** is your prep in one screen. When you sit
  down, start a session. Afterwards, close it out.
- *Words:* Close to full · Current thread · Thread · Last session set up · Met last session, no stat block yet ·
  Session · Close-out
- *Tips:* Keep one thread current, the one tonight is about: it rides in the strip on every tab. · Read **Next
  session** before you play, not during.

**A session** · when: during, after
- *For:* One night: who was there, how long, what passed between the crew and the cast, what you jotted, and your
  write-up of it.
- *Words:* Open session · Line · Jot · Journal · Close-out
- *Tips:* Log a line the moment someone tells, learns or owes something: **Who knows what** is built from them. ·
  Write **Seed for next session** while it's fresh. Next time it's on Sessions as **Last session set up**.

**Close-out** · when: after
- *For:* The end of a night. Check who came and how long you played, and the IP for each character is worked out. Then
  close or keep each open thread, and add the people the crew met.
- *Words:* Close-out · Improvement Points · Away tonight · Thread
- *Tips:* The IP is a starting point: change any of it. ⚑

**Players** · when: before, during
- *Guide line:* Who's at the table, and a copy of each character to check at a glance.
- *For:* The people at your table and copies of their characters, so you can see HP, Awareness and Conditions without
  asking.
- *Words:* Player · Character copy · Benched, retired and dead
- *Tips:* Ask for each player's `.shadows.json` after a session and import it, so your copy matches their sheet.

**A character's sheet** · when: before, during
- *For:* A read-only copy of this character's sheet, from the last file you imported.
- *Words:* Character copy
- *Tips:* It doesn't change when the player plays. Import a fresh file to bring it up to date.

**Cast** · when: before, during, after
- *Guide line:* Everyone in NYTE City the crew deals with, and what they know.
- *For:* Everyone in the story who isn't a player's character. Write who they are and what they want, give the ones who
  might fight a stat block, and log what passes between them and the crew.
- *Words:* Cast · Status · Affiliation · Stat block · Who knows what
- *Tips:* Not everyone needs a stat block, only people who might end up in a fight.

**Who knows what** · when: before, during
- *For:* Every line between the crew and the cast, by character: who told whom what, and who owes whom.
- *Words:* Line · Who knows what
- *Tips:* Check it before a reveal: who already knows, and who'd be surprised.

**A cast member** · when: before, during
- *For:* Who this person is, what they want, what they'd do if pushed, their clocks and stat block, and everything
  between them and the crew.
- *Words:* Stat block · Clock · Line · Affiliation · Key to
- *Tips:* **What they want** and **If pushed** are what you'll reach for when the crew surprises you.

**City** (the crew's places) · when: before, after
- *Guide line:* Where the story happens, and who's moving in it.
- *For:* The places the crew has been or is going. **Factions** is the groups moving around them, and **The city** is
  NYTE City from the book.
- *Words:* Place · Site profile · Clock · The city
- *Tips:* Name a place as **Where** on a line, and the place remembers what happened there.

**A place** · when: before, during
- *For:* What happened here, who the crew met here, its clocks, and its site profile if it has one.
- *Words:* Place · Site profile · Clock · Line

**Factions** · when: before, after
- *For:* The groups with their own agendas: how hard each is looking at the crew, what would push it to act, and who
  matters in it.
- *Words:* Faction · Attention · Tipping points · Key NPCs · Clock
- *Tips:* Give a faction a clock for what it's working toward, and press **+** when the crew isn't looking.

**A faction** · when: before, after
- *For:* One faction on file: its attention, its tipping points, its key NPCs, who's tied to it, and its clocks.
- *Words:* Attention · Tipping points · Key NPCs · Affiliation · Clock

**The city** · when: before
- *For:* NYTE City as the book has it: territories, what lies beyond, the powers, and kinds of ground.
- *Words:* The city · Place · Faction
- *Tips:* When the crew heads somewhere, add it from here so it's on file when you need it. ⚑

**Threats** · when: before, during
- *Guide line:* Ready-made opposition from your packs.
- *For:* Threats, people and groups from a pack such as the Threat Codex. Browse them, and add one to your cast or
  straight into an encounter.
- *Words:* Pack · The Codex · Stat block
- *Tips:* Slot in a pack once: it stays in this browser for every table.

**A threat** · when: before, during
- *For:* One entry from a pack, as the book writes it. Add it to the cast to give it a name and a history, or to an
  encounter to fight it. ⚑
- *Words:* Pack · Stat block

**Encounters** · when: before, during, after
- *Guide line:* Plan a fight, run it turn by turn, and keep the ones that are done.
- *For:* Scenes you plan ahead, usually fights. Plan the stakes and the ground, put the crew and the opposition in,
  then run it round by round.
- *Words:* Encounter · The plan · Clock
- *Tips:* Plan the fight you expect before the session, so at the table you only press start. ⚑

**A planned encounter** · when: before
- *For:* The plan, who's in it, and its clocks. Fill what helps and skip the rest.
- *Words:* The plan · Clock
- *Tips:* **Core Stakes** and **Planned Escape Options** do the most work when a fight goes sideways. ⚑ (Deighton's
  call)

**A running encounter** · when: during
- *For:* A fight in progress, in turn order. **Next turn** (N) moves to whoever acts next; open a row to take a hit,
  add a Condition or hold a turn.
- *Words:* Round · Next turn · Combat Sense · The strip
- *Tips:* The strip under the header shows the round and who acts on every tab, so you can check Reference mid-fight
  and come straight back.

**A past encounter** · when: after
- *For:* A finished fight, kept as a record of who was in it and how long it ran.
- *Words:* Encounter

**Reference** · when: during
- *Guide line:* The rules you'll look up mid-session.
- *For:* The book's rules for the table: Conditions, the Codex, Defense, checks, damage, Pain Levels, recovery and
  more. Search it, or jump to a part.
- *Words:* The Codex
- *Tips:* Press **7** to get here from any tab while the keys are on.

**Notes** · when: before, during, after
- *Guide line:* Thoughts just for you, kept with the table.
- *For:* Anything you want to keep for yourself: a campaign pitch, safety notes, spoilers, rulings you've made, a
  rumor table.
- *Words:* Note · Jot · Find
- *Tips:* Write down what you don't want to forget. **Find** (F) searches every note. · Mid-session, **Jot** (J) a
  thought without leaving the page. It goes with the open session, or here if none is open.

**A note** · when: before, during, after
- *For:* One note, yours alone.
- *Words:* Note · Find

### A3. Every word (`words`)

| Id | Term | Text |
|---|---|---|
| `table` | Table | Everything about one campaign: its sessions, players, cast, city, encounters and notes. It lives in this browser, and the exported `.shadows-table.json` is the copy that lasts. |
| `session` | Session | One night of play: the day, who was there, how long, what passed between the crew and the cast, and your write-up. |
| `openSession` | Open session | The latest session that isn't closed out. Jot files to it, and the strip shows while it's open. |
| `closeout` | Close-out | The end of a session. Check who came and for how long, and each character's IP is worked out. Then settle the threads and add anyone new. |
| `thread` | Thread | A question the story hasn't answered yet: a missing witness, a debt, a contract on someone. Close it as **Resolved** or **Dropped** when it ends. |
| `currentThread` | Current thread | The thread tonight is about. Only one at a time, and it rides in the strip on every tab. |
| `clock` | Clock | A countdown to trouble: 2 to 12 segments that fill as something gets closer. Give it to a faction, a person, a place or a fight, say what moves it and what happens when it's full, and press **+** when the story pushes it. |
| `closeToFull` | Close to full | Clocks nearly full. Read these before a session: they're what's about to happen. ⚑ |
| `lastSetUp` | Last session set up | The seed you wrote at the end of the last session: where things stand and what's likely next. |
| `metNoStat` | Met last session, no stat block yet | People the crew met last time who'd need numbers if a fight started. |
| `journal` | Journal | Your write-up of a session: what happened, the fallout, new threads, how factions and the city moved, how it went, and a seed for next time. Every part is optional. |
| `line` | Line | One thing between a character and a cast member: told them, learned from them, helped, wronged, killed, fought, owes, or is owed. |
| `ip` | Improvement Points | What characters spend to grow. The close-out gives each character who was there 5 an hour, rounded up. |
| `away` | Away tonight | Characters who missed the session. Tick **Took a job** for one who worked off-screen, and pick the job's tier for their Çredits. |
| `player` | Player | A person at your table. A player can have more than one character. |
| `characterCopy` | Character copy | A copy of a player's `.shadows.json`, imported so you can see their sheet. It changes only when you import a fresh file. |
| `benched` | Benched, retired and dead | Characters a player isn't playing now. They keep their history. |
| `cast` | Cast | Everyone in the story who isn't a player's character: contacts, rivals, bosses, monsters. |
| `status` | Status | Where someone stands: alive, dead, missing, or out of the picture. **In play** shows everyone who still matters. ⚑ |
| `affiliation` | Affiliation | Who someone answers to: a faction, a crew, a company. Filter the cast by it. |
| `statBlock` | Stat block | A cast member's numbers for a fight. Only people who might fight need one. |
| `whoKnows` | Who knows what | Every line between the crew and the cast, grouped by character. |
| `keyTo` | Key to | The factions this person matters to. They're among those factions' key NPCs. ⚑ |
| `place` | Place | Somewhere the crew has been or will go. Lines and encounters can name it, so it remembers what happened there. |
| `siteProfile` | Site profile | A ready-made profile from the Threat Codex for a kind of place, with a level and how exposed each character is there. A pack brings them. ⚑ |
| `faction` | Faction | A group with its own agenda: a gang, a corporation, a precinct. |
| `attention` | Attention | How hard a faction is looking at the crew: **Neutral**, **Aware** or **Active**. |
| `tippingPoints` | Tipping points | What would push a faction to act. Write them down so you know when to move it. |
| `keyNpcs` | Key NPCs | The cast members who matter most to a faction. |
| `gazetteer` | The city | NYTE City from the book: its territories, what lies beyond, the powers, and kinds of ground. |
| `pack` | Pack | A file of ready-made threats, people, groups and site profiles. The Threat Codex comes as one. It stays in this browser until you remove it. |
| `codex` | The Codex | The Threat Codex: the book's opposition, from a slotted-in pack. |
| `encounter` | Encounter | A scene you plan ahead, usually a fight: who's in it, the stakes, the ground and the way out. Start it to run it round by round. |
| `plan` | The plan | The Encounter Design worksheet: hook, stakes, terrain, escalations, ways out. Fill what helps. |
| `round` | Round | One pass through everyone in the fight, in turn order. |
| `nextTurn` | Next turn | Moves to whoever acts next. **N** does the same on a running fight's page. |
| `combatSense` | Combat Sense | What sets the turn order. If the fight has changed at a round's end, each side rolls it again. |
| `strip` | The strip | The line under the header while a session is open or a fight runs: the round and who acts, the current thread, the clock nearest full, and **Unexported**. Tap any of it to go there. |
| `unexported` | Unexported | The table has changed since you last exported it. Tap it to export: the file is your backup. |
| `find` | Find | Searches the whole table: cast, sessions, lines, threads, notes and encounters. **F** opens it. |
| `jot` | Jot | A quick note without leaving the page. It goes with the open session, or to Notes if none is open. **J** opens it. |
| `activity` | Activity | Every change to this table, newest first, and Undo for the newest. **A** opens it. |
| `note` | Note | Anything for you alone. Tie it to a session to find it by that session later. ⚑ |

### A4. Empty states (`empty`)

| Key | Today | Drafted |
|---|---|---|
| `sessions` | Nothing yet. Start a session when you sit down to play, or add a thread you want to follow. | Nothing yet. Start a session when you sit down to play, or add a thread you want to follow. Press **?** for what each tab is for. |
| `threads` | No threads yet. | No threads yet. A thread is a question the story hasn't answered: add one to follow it from session to session. |
| `sessionsList` | No sessions yet. | No sessions yet. Start one when you sit down to play. |
| `players` | Nobody seated yet. Add a player, then import their characters. | (unchanged) |
| `cast` | Nobody yet. The city fills up fast. | Nobody yet. The city fills up fast: add the people the crew meets, or bring them in from Threats. |
| `places` | No places yet. Add one, or find it in The city. | (unchanged) |
| `factions` | No factions yet. Add one, or find it in The city. | (unchanged) |
| `threats` | No threats yet. Slot in the pack that came with your GM material to see its threats here. | (unchanged) |
| `encounters` | Nothing on the books. | Nothing on the books. Plan a fight ahead, or start one when it breaks out. |
| `notes` | Nothing on file yet. What you write here stays with the table and goes wherever its file goes. | Nothing on file yet. Write down what you don't want to forget: it's for you, not your players, and **Find** searches it. |

## Appendix B — Words that may not be clicking

**For Deighton's page only. Nothing here is renamed in S31** (GQ38). Each is a word a new GM meets with nothing on
screen to explain it. The page asks him "clicks / doesn't / try this".

| Word, where | Why it may not click | A possible alternative (a prompt, not a proposal) |
|---|---|---|
| **Threads** (Sessions) | Writers' jargon. A GM who doesn't think in "threads" sees a list of questions | Plot threads · Open questions · Leads |
| **Clocks** (everywhere) | From Blades in the Dark; a GM who hasn't played it sees a progress bar with no reason | Countdowns · Pressure |
| **Close to full** (Sessions) | Says how full, not why it matters | About to happen · Nearly there |
| **Close-out** (a session) | Sounds like bookkeeping, and it's where IP is awarded | End the session · Wrap up · Award IP |
| **Cast** (tab) | Film word; the book says NPCs | NPCs · People |
| **City**, with **The crew's places** and **The city** inside it | Three names; "The city" inside "City" is the book's gazetteer | Places · Gazetteer · From the book |
| **Who knows what** (Cast) | Clear, but hard to find inside Cast | (fine?) |
| **Line** (between crew and cast) | Never named on screen as a "line"; the headings say "What passed between…" | Exchange · Moment · Interaction |
| **Key to** (a cast member) | Reads as "the key to the mystery"; it means "a key NPC of" | Key NPC of · Matters to |
| **book: N** (under TOL and WILL) | Unexplained; S24 changes what it means | (S24's) |
| **Slot in a pack** (Threats) | "Slot" is ours; "pack" isn't explained | Add a pack · Load the Codex |
| **Threats**, **Pack** and **The Codex** | Three names for one thing a GM owns | One of them, used everywhere |
| **Unexported** (the strip) | A state, not an instruction | Not saved to a file · Export now |
| **Jot** (header) | Clear once used; a new GM may not press it | (fine?) |
| **The strip** | Has no name on screen at all; this help names it | Tonight (its name in the code) · Now |
| **Attention: Neutral / Aware / Active** (a faction) | The levels are clear; that they're about *the crew* isn't | Watching the crew: … |
