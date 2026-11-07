# Work order U4: back inside the system

**Plan:** [`../gm-at-the-table.md`](../gm-at-the-table.md), session U4. It owns findings #27–#37 (plan §2).
**Status:** **drafted 2026-11-06 by Claude (Opus)**, U1's reviewer, for Ken's approval. *Fix* tier, so this is the
one-page order the plan promised (`WORK-ORDERS.md`, *How exact to be*). Its questions are UQ13–UQ17 (§4).
**Approved by Ken 2026-11-06** ("Approve, all defaults", in the conductor session): UQ13–UQ17 are each their
default.
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**Pre-flight:** against `main` at `7dfbad5` (PR #304, U1, merged: app 0.63.0, game data 0.53, character schema 0.34,
table schema 0.19, pack schema 0.3). Findings:
- **`.cast-h` is two things.** It is the class on 39 headings in `gm.js`. Most are section heads ("Clocks", "Threads",
  "Stat block", "The plan"), but some are *names*: each player on Players (`<h2 class="cast-h">Priya Raman`),
  `.crew-name`, `.site-name`, a Reset row's `<h3>` (a row's label), and "Wrap up <title>". Restyling the class whole
  would put people's names in Mono Caps. The finding asks for section heads only.
- **The flat h3 is `.ref-sub`** (`shadows.css:1495`, .95rem = 15.2px against the 15px body). It has 14 uses (the
  plan's worksheet headings, among others). `.next-h` (`:1440`, .95rem, dim) has 4 ("Still open", "Last session set
  up", …).
- **Seat vitals** are `seatTopHtml` (`gm.js:3736`): three `<div class="cast-line seat-line">`, which inherit
  `.cast-line`'s italic and dim (`shadows.css:1276`). On Dead Air, Priya's card reads `HP 18/20`, `Awareness +14`,
  `No Conditions`, in Inter italic. `smoke-table-seats` reads `.seat-line` textContent (`:45`), so **the text stays
  and the class `.seat-line` stays**.
- **Home's table card** (`gmTableCardHtml`, `gm.js:183`) reads `Table · 8 notes` for Dead Air (7 sessions, 14 cast,
  8 notes), with "changed …" only when the entry has a `changed` stamp. `smoke-table-cast:91` pins
  `/Table · 0 notes/`.
- **The software voice:**
  - "not in the Gear tables" (`gm.js:2916`, pinned in `smoke-table-play`);
  - "formula N" (`gm.js:928` live, `:2652` the read view; `smoke-table-cast:348–350` read `[data-cformula]`);
  - "Slot in a pack with site profiles to use one here." (`gm.js:1289`, pinned in `smoke-table-sites`);
  - the empty Threats tab, "No pack slotted in. A pack is a file of threats your GM material came with." (`gm.js:2629`,
    pinned by no test).
- **Delete copy** is in three places: a note (`gm.js:430`), a thread (`:2130`), and an encounter with or without
  clocks (`:3504`). All three say it "isn't kept anywhere else unless you've exported the table". Every delete goes
  through `tableChange`, so it is in the activity log and the toast carries Undo (Decision 212: undone last first).
  `smoke-table-encplan` pins the wording.
- **Activity labels:**
  - The UI passes four explicit labels: `Hit ${who}` (`gm.js:3484`), `Ended ${title}` (`:3514`), `Seated …`
    (`:3913`), `Removed …` (`:4041`). Everything else is the engine's `tableActionLabel` (`engine.js:6914`): "Changed
    <record>".
  - So Take and Heal on a row read "Changed Achterberg's clinic, moonrise", and a clock's + reads "Changed The tide at
    Wharf 17".
  - `smoke-table-seat-fight:87` pins `"Hit Dez"`, and `engine.test.mjs` pins several "Changed …" labels.
  - Clicks don't fold (`tableChange` folds only while typing), so a label carrying a value can't break a burst.
- **Inline `style=`:** `gm.js:204` (a mono span in Home's note) and `:209` (`margin-top` on the door). U1 added a third
  at `:2897`: the segment's `transform:scaleX(...)`. It is a computed value, as on the sheet's `hlMiniHtml`, and it
  stays. It is not this finding.
- **Tab icons** are `TABLE_SECTIONS[].ui` → `uiIcon()` (`gm.js:260`), borrowed from the sheet (Players = `tab_main`,
  Encounters = Trackers'). UQ6's default was to ask Scott; nothing from him is in the repo.
- **The seat copy** (`readOnlySheetHtml`, `gm.js:3851`):
  - The `h1` holds the name, and the drawn sheet draws it again. The table's section tabs and `.ro-tabs` look alike,
    stacked.
  - `inertSheet` disables every control but the readers (Decision 256). The disabled Heal and Hurt keep their live
    look; only `cursor` and `pointer-events` change (`shadows.css` `.ro-sheet button:disabled`).
  - `smoke-table-sheet:65` pins `/Read only · File from .+ · Imported/`.
- **Ledger:**
  - **255** (the seat card's order: Health, Awareness, Conditions first) and **256** (the read-only sheet: every
    control but a reader disabled) are restyled, not changed.
  - **212** ("a label names only what came and went") governs adds and removes, which this order leaves as they are.
  - **269** says a duplicate's letter is "never stored", which bears on UQ13.
  - **171** and **176** say "deleting asks first", which still holds.
  - No decision fixes the delete copy's words or a section head's face.

**Carried over** from U1 (PR #304, review and Ken's answers at
`https://github.com/kazamuki/Shadows-Character-Sheet/pull/304#issuecomment-6680008701`):
- **The order's misses:**
  - **KQ2:** U1's order never asked for the scroll to the actor when an encounter opens; Ken added it to U1.
  - **KQ1:** the wrapped encounter bar needed its own phone-check budget, `ENC_BAR_MAX_SHARE = 0.27`, which Ken
    accepted. Any header, bar or tab restyle here stays inside 20% (the tables bar) and 27% (the encounter bar).
  - **A tag that isn't a tip** must be `.tag.plain`: `.tag` alone carries the dotted underline and `cursor:help`.
    U1's order didn't say so. This order does (§9).
- **The build's misses (U1):**
  - A ≤640px restyle moved a height without moving the `scroll-margin-top` that depended on it.
  - The Now chip was a plain `.tag`, styled as a tip.
  - The overlay grid was filled in from the wrong table (Probe, not Dead Air) and with cells skipped.
  - A test pressed Take inside a closed More (jsdom lets it through).
  - A .68rem label was caught by the 11px guard.
  - Each of these is a review item here (§14).
- **For U2, not here:** KQ3, "the running encounter, distilled", is in the plan's U2 row.

---

## 1. Goal and Done when

GM mode reads like the rest of the app again: its labels in Mono Caps, its numbers as readouts, its words the
table's and not the software's, and its record of what happened specific enough to undo with confidence.

**Done when** (Dead Air seeded):

1. **(#27)** A seat card's three lines are a readout. "HP 18/20" has its number in Oxanium, green (magenta with **Down**).
   "Awareness" and "Conditions" are Mono Caps keys, each with a mono value. Nothing is italic. The order and each
   line's `textContent` are as on `main`.
2. **(#28)** Every heading that names a *section* is Mono Caps: `.cast-h` section heads, `.ref-sub` and `.next-h`. A
   heading that is a *name* keeps its face: a player, a crew, a site, a Reset row, "Wrap up <title>".
3. **(#34)** The heading scale is stepped:
   - a record's name is the Title voice (display face, 600, 1.1–1.2rem);
   - a section head is a Mono Caps label (.74rem, .14em) over a one-line rule in the frame colour;
   - a sub-section (`.ref-sub`, `.next-h`) is a Mono Caps label without the rule;
   - nothing reads as body-sized bold Inter.
   The overlay's `flat-type-hierarchy` either clears on the GM pages, or is named in the PR as voice carrying the
   hierarchy where size doesn't.
4. **(#30, #37)** The software words are gone, each replaced by the table's (§9's copy, for a voice pass).
5. **(#31)** The three delete asks say Undo brings it back, not that it's gone.
6. **(#32)** Activity says what changed:
   - "Hit Reclaim drone: 9 through · 1 Health Level" (the preview's own words);
   - "Reclaim drone took 5" and "Healed Reclaim drone 3";
   - "The tide at Wharf 17: 4 of 6".
   Every other label is as on `main`.
7. **(#33)** `gm.js` has no `style=` but the segments' computed transform.
8. **(#35)** Home's table card reads "7 sessions · 14 cast · changed …" (UQ14; `whenText`'s words), and drops the note count.
9. **(#36)** The seat copy:
   - shows the name once;
   - its sheet tabs read as the sheet's own (no icons, and a smaller, outlined row under a Mono Caps "Sheet" label),
     not as a second copy of the table's tabs;
   - its disabled controls look disabled (dimmed, dashed edge), next to "Read only".
10. **(#29)** Tab icons follow UQ16.
11. The browser overlay is clean on every GM section touched, at 1024px and 375px, or each finding is named.
    `npm run phone-check` passes. The reviewer's re-critique holds H4 and H8 at or above U1's, and H2 above 3 or says
    why not.

## 2. Tier, versions, numbers

- **Fix:** copy, styles and four labels. No rule moves and no shape moves. **No decision.** If one turns out to be
  needed, that's a stop (§13).
- **App:** a patch, 0.63.0 → **0.63.1**, or the next patch on `main` when built. No game data, character, table or
  pack schema bump: an activity label is stored text, not shape.
- **Icons** (if UQ16 brings any) are data in `src/data/`. Only a log line, no `gamedataVersion` (Decision 68: no
  character can observe them).

*Sections 3 (no decision), 6 (read first) and 8 (no shapes) are folded, as a Fix-tier order may: read DESIGN.md's *Typography* and *Components*, `CLAUDE.md`'s Fix tier, Decisions 212, 255, 256 and 269, and `craft-floor.md` before the first edit.*

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| **UQ13** | Activity for a duplicate: "Hit Reclaim cleaner B: 9 through · 1 Health Level", or the stored name only? | **The stored name only.** 269 says the letter is never stored, and the activity log is stored. The value tells them apart well enough |
| **UQ14** | Home's table card: sessions, cast and when it last changed, in place of the note count? | **Yes:** "7 sessions · 14 cast · changed yesterday". A count of 0 is left out ("14 cast", not "0 sessions · 14 cast"); with nothing, "Empty" |
| **UQ15** | The delete ask: "Undo brings it back, from the toast or ⋮ → Activity." Or keep a word about export? | **The Undo line alone.** Export is a backup, and Home already says that |
| **UQ16** | Tab icons: Scott's six aren't in yet. Keep the borrowed ones, or drop icons from the GM tabs until they come? | **Keep the borrowed ones** (UQ6's default), log it, and add a wish for Scott's set. Dropping them makes the tabs jump when the icons arrive |
| **UQ17** | The seat copy's name: keep the page's `h1` and hide the sheet's own name block on the copy, or the reverse? | **Keep the `h1`.** It's the focus target (`data-seath`) and what Back returns to |

## 5. The sweep

| What changes | Today, where | After | Readers |
|---|---|---|---|
| Seat lines | `seatTopHtml`, `.cast-line.seat-line` (`gm.js:3736`) | spans inside each line: Oxanium HP number, Mono Caps key, mono value; not italic | `smoke-table-seats:45` (textContent, kept). **Twin:** the seat *page*'s first block calls the same function, so it changes with it |
| Section heads | `.cast-h` (`shadows.css:1278`), `.ref-sub` (`:1495`), `.next-h` (`:1440`) | Mono Caps per §1.3; names stay | `smoke-table-cast:564` pins `.cast-title, .cast-h{…overflow-wrap:anywhere}`. Every `cast-h` in `gm.js` is a name or a section: list them in the PR, one by one |
| Delete asks | `gm.js:430`, `:2130`, `:3504` | §9 copy | `smoke-table-encplan` (expected break) |
| Software words | `gm.js:2916`, `:928`, `:2652`, `:1289`, `:2629` | §9 copy | `smoke-table-play`, `smoke-table-cast:348–350`, `smoke-table-sites` (expected breaks); `voice.test.mjs` |
| Labels | `gm.js:3484` (Hit); Take and Heal (`:3694`) and the clock's +/− (`:1701`) pass none | §1.6 labels, passed by the UI; the engine's `tableActionLabel` doesn't change | `smoke-table-seat-fight:87` `"Hit Dez"` (expected break); `engine.test.mjs`'s labels stay |
| Home card | `gmTableCardHtml` (`gm.js:183`) | UQ14 | `smoke-table-cast:91` (expected break), `phone-check`'s Home rows |
| Inline styles | `gm.js:204`, `:209` | classes in `shadows.css` | `build.test.mjs:375` guards only `style="…font-size` in `src/ui`; add a `gm.js` guard (§10) |
| Seat copy | `readOnlySheetHtml` (`gm.js:3851`), `.ro-tabs`, `.ro-sheet button:disabled` | §1.9 | `smoke-table-sheet:65` (text kept), Decision 256's tests |

**Which guards read a value this changes?**
- `voice.test.mjs` reads every new string.
- `build.test.mjs` checks that colours are tokens and that no screen text is under 11px.
- `smoke-table-cast:564` checks `overflow-wrap`.

**Where does each change render?** Seat lines on the card *and* the seat page. Section heads on every GM tab. Labels
in the toast *and* in Activity.

**What text points at it?** DESIGN.md's Mono Caps and Four Voices rules, which this order obeys. No in-app line
names a heading's look or a delete's wording.

## 7. Out of scope

- Anything on the encounter row, its bar or its Hit panel (U1, and U2 for KQ3).
- The Tonight strip (U2). Dossiers and read views (U3). Keys (U5).
- The sheet's own styles. `.ro-sheet` changes only the copy's disabled look, never the player's sheet.
- New icons drawn here. Engine labels for adds and removes (212). Any stored field.

## 9. The UI, and its copy (for a voice pass)

- **Readouts** reuse U1's `.enc-hp` voice: `--numeric`, 600, tabular, `--green` / `--magenta-text`. A seat line's
  HP figure matches it, at the card's size (about 1.1rem).
- **A Mono Caps label** is DESIGN.md's Label: `--mono`, .72–.74rem, .12–.14em, uppercase, Overcast Steel. Never
  under 11px.
- **A tag that isn't a tip is `.tag.plain`** (U1's miss).
- **Copy:**
  - `not in the Gear tables` → `not a piece the book lists` (the line still shows as printed).
  - `formula 2` → `book: 2`.
  - `Slot in a pack with site profiles to use one here.` → `No site profiles yet. Slot in a pack that has them, on
    Threats.`
  - The empty Threats tab: `No pack slotted in. A pack is a file of threats your GM material came with.` → `No
    threats yet. Slot in the pack that came with your GM material to see its threats here.`
  - The delete asks: `Undo brings it back, from the toast or ⋮ → Activity.` For an encounter with clocks: `It and its
    2 clocks go. Undo brings them back, from the toast or ⋮ → Activity.`
  - Labels: `Hit <name>: <the preview's words>`, `<name> took <n>`, `Healed <name> <n>`, `<clock>: <filled> of
    <segments>`.
  - Home: `<n> session(s) · <n> cast · changed <when>`; `Empty`.
  - The seat copy's sheet label: `Sheet`.

## 10. Worked examples, as named tests

Each fails on `main` first, or the PR says why not.

| Test | File | Pins |
|---|---|---|
| `U4: a seat card's lines are a readout, their text unchanged` | `smoke-table-seats` | Priya: textContent `HP 18/20`, `Awareness +14`, `No Conditions`. The HP figure has the readout class. No `.cast-line` on a `.seat-line` |
| `U4: a section head is Mono Caps and a name isn't` | `smoke-table-cast` | "Clocks" has the section class; a player's `h2` and a Reset row's `h3` don't. **Checked by script over every `cast-h` in `gm.js`**, not by a hand list |
| `U4: a delete says Undo brings it back` | `smoke-table-encplan` | all three asks; then Undo restores the note |
| `U4: Activity says what a hit, a Take, a Heal and a clock did` | `smoke-table-play` | the four §1.6 labels, read from `S.table.audit` |
| `U4: Home's card leads with sessions and cast` | `smoke-table-cast` | "7 sessions · 14 cast"; an empty table reads "Empty" |
| `U4: the software words are gone` | `voice.test.mjs` | none of §9's old strings in `src/` |
| `U4: gm.js has no inline style but a computed transform` | `build.test.mjs` | regex over `gm.js`. Mutation: put `:209`'s style back and it fails |
| `U4: the seat copy names its seat once, and its disabled controls read as disabled` | `smoke-table-sheet` | one element with the name's text in `#main`'s display face; `.ro-sheet button:disabled` computed `opacity` < 1 |

## 11. Tests beyond the examples

- Voice on every new string. The 11px guard on every new label.
- **Mutation-test** the name/section split: give a player's `h2` the section class and the test must fail.
- `npm run phone-check` passes, inside both budgets (Carried over).
- **Expected breaks, not stops:** `smoke-table-cast:91` (`Table · 0 notes`), `smoke-table-seat-fight:87`
  (`Hit Dez`), the old words in `smoke-table-play`, `smoke-table-sites`, `smoke-table-cast:348–350` and
  `smoke-table-encplan`, and the version literals. Each is listed in the PR, old → new.

## 12. Steps

1. `git submodule update --init private`, then `npm run test:fast`.
2. Write §10's tests and show them failing on `main`.
3. Read `craft-floor.md`. Run **`/impeccable typeset`** on Players (the seat card) and on a cast member's page and
   an encounter's plan (the heads). Build §1.1–1.3. Then `npm run verify`, and check it in the dev preview.
4. Run **`/impeccable clarify`** on §9's copy: the words, the delete asks, the labels, Home's card and the empty
   Threats tab. Build §1.4–1.8. Then `npm run verify`.
5. Build the seat copy (§1.9) and the icons (UQ16). Then `npm run verify` and `npm run phone-check`.
6. The plan §3 gate: inject the browser overlay on every section touched (Home, Players, a seat copy, Cast, City,
   Threats empty and full, Encounters) at 1024px and 375px, on **Dead Air** with the tab fronted. Fill every cell.
7. Run **`/impeccable polish`** on the sections touched, reading U1's snapshot
   (`.impeccable/critique/2026-11-06T07-45-02Z__src-ui-gm-js.md`).
8. Close-out (§14).

## 13. Stop and ask

**Stop** (to the conductor) if:
- a stored field, an engine rule or a decision turns out to be needed;
- Decision 255's line order or 256's inert rule would have to move;
- an Impeccable command wants to change something outside §9 (a colour role, a component, the encounter row).
  Report what it proposed and don't apply it.

**Not stops:** §11's expected breaks.

## 14. Close-out and review

- **Close-out:**
  - a `CHANGELOG.md` line per visible change, in player voice, then `npm run changelog`;
  - `npm run bump -- 0.63.1`;
  - INDEX §2 statuses for #27–#37;
  - STATE's next line (U2);
  - the plan §4 row marked built;
  - a log line for UQ16;
  - a shipped row.
- **PR:** title `U4: back inside the system (gm-at-the-table; findings 27–37)`. Use the template's sections, plus
  *Where the order didn't fit* and **Impeccable (plan §3.8)**: typeset, clarify and polish, each with the screen it
  ran on and what it changed (or "nothing"), and the overlay grid with every cell filled.
- **Re-critique:** the reviewer runs `/impeccable critique` on GM mode with Dead Air seeded, commits the snapshot, and
  sets its table beside U1's (25/40) in the review.

**Review checklist:**
- [ ] Every `cast-h` in `gm.js` is classed a name or a section, and the PR lists them.
- [ ] Seat lines' text is byte-identical to `main`'s, on the card and on the seat page.
- [ ] The labels read as §1.6 in the toast *and* in Activity; adds and removes are unchanged; no duplicate letter
      gets into the log (UQ13).
- [ ] Every new tag that isn't a tip is `.tag.plain`. Every new label is ≥ 11px. Any ≤640px height change moves the
      `scroll-margin-top` that depends on it (U1's misses).
- [ ] The overlay grid has every cell, on Dead Air, with the tab fronted.
- [ ] The Impeccable section names all three commands. Spot-check one claimed change against the diff.
- [ ] Every new string is in the PR for the voice pass.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md`, with this order's path. Both sessions are local, because Impeccable is installed
only on Ken's machine. The conductor adds the same Impeccable lines as for U1 (run §12's commands through the Skill
tool and nothing else; a command reaching outside §9 is a stop).

Traps:
- **Names are `.cast-h` too.** Split by what the heading *is*, not by its class.
- **`.seat-line`'s text is pinned.** Restyle it with spans, and don't reword it.
- **A label carries the preview's words.** Build it from the same `encHitPreview` the panel shows, so the two can't
  drift.
- **The Players tab and the seat page share `seatTopHtml`.** Check both.
- **The background tab renders nothing.** Front the tab before you inject the overlay (U1's B pass).
