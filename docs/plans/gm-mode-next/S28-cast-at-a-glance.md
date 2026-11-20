# Work order S28: the cast reads at a glance — numbers on the cards, Origin and Enemy role as buttons, the crew as buttons

**Plan:** [`../gm-mode-next.md`](../gm-mode-next.md), session S28. **The wishes:** W78 (the cast list shows each member's
stat block), W81 (Origin and Enemy role look like what they do), W142 (the cast's crew lines as buttons too), what's left
of W77, and GQ31 (W68: how well a cast member knows each of the crew). **The ask:** Ken, 2026-11-19, after S26 merged:
"Draft S28".
**Status:** **drafted 2026-11-19** by Claude (Opus), the conductor. **Not approved.** GQ31 and GQ81–GQ85 are open.
**Branch:** from `main`; PR to `main`. Nothing ships switched off: GM mode is on for everyone (Decision 239).
**Runs beside:** nothing. One build at a time (Ken). **Say N everywhere** (N, N+1, N+2).

**Pre-flight** at `1879d04` (`main`, after S26's #372). `private/` at `c99bb58`.
- **W77 has nothing left.** S18 (Decision 258) built all three of its asks: Back and **Add to <encounter>** sit in
  `.tbl-bar`, which sticks under the header (`shadows.css` ~1298); a member's status is a tag under the name
  (`castReadHtml`, gm.js ~1240); and from 1280px the stat block is `.cast-panel`, sticky on the right (~1284–1291).
  This order closes W77 as built, and builds nothing for it.
- **A cast card** (`castCardHtml`, gm.js ~1042) is the name as a `cast-open` button, the one-line `flavor`, and a
  `.cast-meta` line: affiliations, origin, NPC roles, "Enemy: …", "Tier N", a status other than alive, and the bare
  words **"Stat block"** when `Engine.blockHasNumber(n.block)`. No number is shown. `castListHtml` (~1052) maps the
  filtered list (`Engine.castFilter`) into `.roster-list`.
- **The numbers are already computed for reading.** `readBlockHtml(block)` (~3532) builds the read view's panel from
  `Engine.npc(block)`: each stat with a value (`r.stats[id].value`, `.mod`), TOL and WILL (`r.authored[id].used`),
  Health (`r.health.total`, `.levels`), then skills, armor, gear and traits. `Engine.castHealth(t, id)` (engine
  ~10262) gives `{ left, total }` for a hurt member (Decision 294). `D.stats` is eight (BOD REF MOB INT TECH COOL MAG
  EMP), plus TOL and WILL: eleven numbers with Health.
- **Origin and Enemy role are text fields with a datalist** (`castFormHtml` ~1266, ~1268: `list="cast-origins"`,
  `list="cast-enemies"`, from `Engine.packChoices(packsMemo)`). **NPC roles, on the same form, already have buttons**:
  `castRolesHtml` (~1188), one per pack role, pressed while the typed list names it (~1386), a press adding or
  removing the name (~1604). The Threat Codex has **7 origins and 8 enemy roles** (and 9 NPC roles, already buttons).
  Decision 184 chose "a list to pick from" for origin and enemy role.
- **A line's crew is typed.** The add row (`castInteractionsHtml` ~1170, `data-iacrew`, `list="crew-names"`) and a
  line's Edit row (`interactionRowHtml` ~1151, `data-icrew`) take a comma list; `bindInteractions` (~1452) splits it
  with `splitList(…, /,/)`. The add row's crew is kept between adds (`intAdd().crew`). The datalist is
  `crewNameChoices(t)` (~4642): seat names first, then names already on lines.
- **The crew buttons already exist for sessions.** `whoHtml` and `bindWho` (~2484–2530, Decision 262): a button per
  active seat from `Engine.seatPicks(t, names)` (pressed while a name answers to it), then any other name as a pressed
  button, then **Add a player**, which opens a field (`crewFieldHtml`, commas make several). They are written for a
  session's `present` and `Engine.editSession`, not as a picker any list can use.
- **The ledger:** 177–179 (lines, Who knows what), 184 (the packs' names on the form), 204 (`blockHasNumber`'s users),
  241 (the sentence), 254 (crew are typed names, read as seats), 258 (the frame), **262** (the crew as buttons; its
  *Revisit if* names W142), 294 (wounds), 300 (Add a line folded). Nothing has ruled on numbers on a card.
- **Tests that type a crew:** `tests/smoke-table-cast.test.mjs` types into `[data-iacrew]` or `[data-icrew]` about
  fifteen times (645–1700), and reads `#cast-origins`/`#cast-enemies` and the `list` attribute (1428–1438, 1601).

**Carried over** (S26's review):
- **Name what prints.** S26's "open every `<details>`" printed controls. If this order adds anything folded or any
  button to a cast page, say whether it prints. The answer here: the card's numbers aren't on a printed page (the list
  doesn't print), and the new buttons are form controls, which the read view (and so its print) never shows.
- **A screen rule goes in `shadows.css`.** `print.css` loads only for print.
- **Read what a field holds, not the markup it was drawn with.** The crew buttons are pressed from the record, and
  redraw from it after each press.
- **A drafted string must agree with its neighbours.** The card's figures sit beside `.cast-meta`'s words; the Health
  figure must read as the read view's does.

## 1. Goal and Done when

**Goal.** A GM scanning the cast for who to throw at the crew sees their numbers without opening each one; a GM building a
member sees the pack's origins and enemy roles as the choices they are; and a GM logging a line picks the crew the way
they already pick who was there.

**Done when:**
1. A cast card whose block has a number shows a line of its figures under the meta: each stat with a value, then TOL and
   WILL when set, then Health, as **"BOD 7 · REF 5 · TOL 6 · Health 32"**. A member hurt between fights reads **"Health
   18 of 32"**. A quick-added member with only BOD shows "BOD 7". A card with no number shows no line. The meta loses
   its words "Stat block".
2. On a member's Edit form, with a pack slotted, **Origin** and **Enemy role** each have a row of the pack's names as
   buttons under the field, like NPC roles. A press puts the name in the field (pressed); pressing the pressed one
   clears it. The field still takes any name. With no pack slotted, the field alone, as today.
3. A line's **Crew** (the add row and a line's Edit) is a row of buttons: one per active seat, pressed while the line
   names them, then any other name on the line as a pressed button, then **Add a player** for another name. A press
   toggles. In Edit it saves at once; in the add row it's kept until **Add**, and kept after it, as the typed crew is now.
4. Who was there, on a session's page and its close-out, works exactly as it does today.
5. W77 is closed as built by S18. GQ31's answer is recorded, and W68 is built only if Ken says so.

## 2. Tier, versions, numbers

**Rule or shape:** three player-facing behaviours someone could have chosen otherwise. No stored shape moves.
- **App:** a minor. Join `main`'s `[Unreleased]` heading if it's still a minor (0.74.0 at drafting, unreleased), else
  take the next.
- **Table schema, game data, character schema, pack schema:** none. A line's `crew` stays a list of typed names (254),
  a member's `origin` and `enemyRole` stay text (174).
- **Decisions:** **N** (a card's figures), **N+1** (Origin and Enemy role as buttons), **N+2** (a line's crew as
  buttons).
- **Flags:** none.

## 3. The decisions, drafted

```
N. **A cast card shows its member's figures: each stat with a value, TOL and WILL, then Health, as left of total when hurt.**
     *2026-11-?? · Ken + Claude · Touches: castCardHtml, the cast list, Cast tab, cast card, .cast-meta, Stat block, Engine.npc, blockHasNumber, castHealth, Health, W78, GQ81, GQ82, Decision 294*
     - **Decided:** A card whose block has a number shows one line of figures under its meta: the stats with a value in the data's order, then TOL and WILL when set, then Health, "Health 32", or "Health 18 of 32" while hurt. Values only; the modifiers, skills, armor, gear and traits stay on the member's page. The meta no longer says "Stat block". Every figure comes from `Engine.npc` and `castHealth`.
     - **Why:** A GM choosing who to throw at the crew compares numbers across the cast; the stats and Health are what they compare, and one line keeps a long cast scrolling on a tablet.
     - **Rejected:** The whole block on every card (a trait is a paragraph; fourteen cards become a page each). A fold per card (a press per member is the cost W78 is about). A third view beside *The cast* and *Who knows what* (a mode to remember for one line). The modifiers beside each value (they double the line; the page has them).
     - **Replaces:** nothing.
     - **Revisit if:** GMs open members for a skill or a trait more than for a stat, or a card grows past two lines at 375px.
     - **Built:** app X.Y.Z, PR #…, log 2026-11-…

N+1. **Origin and Enemy role offer the packs' names as buttons, one pick each, as NPC roles do; the field still takes any name.**
     *2026-11-?? · Ken + Claude · Touches: castFormHtml, Origin, Enemy role, cast-origins, cast-enemies, datalist, castRolesHtml, role toggles, the member's Edit form, packChoices, W81, GQ83, Decision 184*
     - **Decided:** With a pack slotted, Origin and Enemy role each show the packs' names as a row of buttons under the field. The button whose name the field holds (case-folded) is pressed; a press sets the field to that name, and pressing the pressed one clears it. The field keeps any typed name. With no pack, the field alone. The datalists go.
     - **Why:** A list hidden in a text box doesn't say it's there (W81), the form beside it already shows NPC roles as buttons, and the Codex's 7 origins and 8 enemy roles fit a row.
     - **Rejected:** A ▾ drawn on the field (W81's first idea): the browser's datalist still differs by device, and one page would pick roles two ways. A select with "Other…": a typed name becomes a second step. Several picks: a member has one origin and one enemy role (174).
     - **Replaces:** Decision 184 in part: origin and enemy role are offered as buttons, not a list.
     - **Revisit if:** a slotted pack has more names than fit two rows at 375px.
     - **Built:** as N.

N+2. **A line's crew is the row of buttons Who was there uses: the seats, the line's other names, and Add a player.**
     *2026-11-?? · Ken + Claude · Touches: castInteractionsHtml, interactionRowHtml, bindInteractions, crew lines, Crew, data-iacrew, data-icrew, crew-names, intAdd, crewPick, whoHtml, bindWho, seatPicks, seatFor, Add a player, W142, GQ84, GQ85, Decision 179, Decision 254, Decision 262, Decision 300*
     - **Decided:** A line's Crew, in the add row and in a line's Edit, is a button per active seat (pressed while a name on the line answers to it), then each other name on the line as a pressed button, then **Add a player**, a field where commas make several. A press toggles. In Edit it saves at once; in the add row it's held until Add and kept after it. Who was there and the line share one picker. What's stored is unchanged: typed names, read as seats (254).
     - **Why:** S21 made the crew buttons everywhere else, and 262 named this as the one place left. Most lines are with one or two of a crew of five, so a press beats typing a name.
     - **Rejected:** The typed field beside the buttons (262: two ways to do one thing). A seat's character's name written in place of the typed name the line had: a line keeps what the GM wrote (254). Clearing the add row's crew after Add: the next line in a scene is usually with the same people.
     - **Replaces:** Decision 262 in part (the buttons are also a line's crew), 179 in part (a line's crew is picked, not typed).
     - **Revisit if:** tables routinely seat more than eight, or a GM logs lines for crew who aren't seated.
     - **Built:** as N.
```

**Supersession marks:** 184 → **superseded in part by N+1**; 262 and 179 → **superseded in part by N+2**; their INDEX
lines. 254, 294 and 300 are read, not changed.

## 4. Questions for Ken

| Id | Question | Default |
|---|---|---|
| **GQ31** | **Should a cast member record how well they know each of the crew** (a face, a regular, a name: W68)? | **No, not in S28.** W68 says to ask Deighton and Scott how a level the GM sets meets the Reputation advantage (`0430`, "people occasionally recognize you") and CRANK rep before choosing levels, and *Who knows what* already lists who has crossed paths, and how often. W68 stays on the wishlist, waiting on them |
| **GQ81** | **What a card shows.** (a) The stats, TOL, WILL and Health, values only, on one line. (b) The whole block as the page reads it, in a fold per card. (c) A third view, *Stat blocks*, beside *The cast* and *Who knows what* | **(a).** It's what a GM compares across the cast, and one line keeps the list scrolling. (b) costs a press per member, which is W78's complaint. (c) is a mode for one line |
| **GQ82** | **Health on a hurt member's card.** (a) "Health 18 of 32". (b) "Health 32", the wounds on the page | **(a).** Who's still standing is half of who to throw next; the figure is already computed (294) |
| **GQ83** | **Origin and Enemy role.** (a) The packs' names as buttons under the field, one pick, like NPC roles. (b) A ▾ on the field, the list unchanged (W81's own idea). (c) A select with "Other…" | **(a).** The same form already picks roles with buttons, the Codex's lists are short, and a typed name still works. (b) leaves the list to each browser's datalist, which is what W81 says doesn't look like a list |
| **GQ84** | **A line's crew.** (a) The buttons alone, as Who was there: seats, other names, Add a player. (b) The buttons, and the typed field kept beside them | **(a).** 262 rejected two ways to do one thing, and Add a player already takes any name |
| **GQ85** | **The add row's crew after Add.** (a) Kept, as the typed crew is today. (b) Cleared | **(a).** A scene's next line is usually with the same people; the kind is the one thing cleared today (after *killed*) |

## 5. The assumption sweep

| What | Today (where) | After |
|---|---|---|
| `castCardHtml` (gm.js ~1042) | meta with "Stat block" | the meta without it; a `.cast-figs` line from a new `cardFiguresHtml(n)` when `hasNumber(n.block)` |
| `readBlockHtml` (~3532) | the read panel | unchanged. The card's figures read `Engine.npc` the same way: write the card's from the same values, not a second formula |
| `Engine.castHealth` (~10262) | `{ left, total }` | read by the card when `n.wounds`. Unchanged |
| `castFormHtml` (~1266, ~1268) | datalists `cast-origins`, `cast-enemies` | the field, then a one-pick button row (`data-corigin`, `data-cenemy`) from `packChoices`; the datalists go |
| `castRolesHtml` (~1188), its binding (~1386, ~1604) | NPC roles, several | unchanged. The new rows follow its markup (`form-toggle`, `aria-pressed`) and its press-then-refresh-in-place, so the field keeps focus order |
| `castGuide` (~1380) | reads `n.origin`, `n.enemyRole` by name | unchanged: a press writes the same text a typed name does |
| `castInteractionsHtml` (~1170) | `data-iacrew` text, `crew-names` datalist | the crew picker, keyed to the add row |
| `interactionRowHtml` (~1151) | `data-icrew` text | the crew picker, keyed to the line |
| `bindInteractions` (~1452) | splits typed crew | the picker's presses: Edit calls `editInteraction(…, { crew })`; the add row sets `intAdd().crew` (now a list; `splitList` it once on the way in) and Add sends it |
| `intAdd` (~1025) | `crew:""` | `crew:[]`. Nothing persists it outside `S` |
| `whoHtml`, `bindWho`, `crewFieldHtml`, `crewAddHtml` (~2474–2530) | a session's present | one picker (`crewPickHtml(names, key)` and `bindCrewPick(box, names, save)`, or the builder's names) used by Who was there and both line rows. **Who was there's smoke tests pass unchanged** |
| `crewNameChoices` (~4642), `sessionCrewNames` | the two datalists | the line's Add a player field lists `crewNameChoices`; Who was there's keeps `sessionCrewNames` |
| `crewView`, *Who knows what* | groups by name and seat | unchanged |
| `S.crewAdd` | which page's Add a player is open | also the add row's and an edited line's (one open at a time) |
| `tests/smoke-table-cast.test.mjs` | types `[data-iacrew]`, `[data-icrew]`; reads `#cast-origins` | a `smokekit.mjs` helper that picks crew by seat or by Add a player; the datalist asserts become the buttons'. **Grep `tests/` and `tools/` for `iacrew`, `icrew`, `crew-names`, `cast-origins`, `cast-enemies`, `Stat block`** |
| `tools/sample-table.mjs` | writes lines' crew as names | unchanged. Check that *Dead Air*'s lines' crew read as pressed seat buttons in Edit |
| Help (`gmGuide`, the cast entry ~5336) | "give the ones who might fight a stat block" | a tip, if it fits Help's two: the cards show each member's numbers. Read the two tips in place first |
| `voice.test.mjs` | — | every new string |

## 6. Read first

`CLAUDE.md` (constraint 7; the change tiers). SCHEMA §4: Decisions 174, 177–179, 184, 254, 258, 262, 294, 300.
`engine.js`: `npc`, `blockHasNumber`, `castHealth`, `seatPicks`, `seatFor`, `addInteraction`, `editInteraction`,
`packChoices`. `gm.js`: `castCardHtml`, `castListHtml`, `readBlockHtml`, `castFormHtml`, `castRolesHtml` and its
binding, `castInteractionsHtml`, `interactionRowHtml`, `bindInteractions`, `intAdd`, `whoHtml`, `bindWho`,
`crewFieldHtml`, `crewNameChoices`. `tests/smoke-table-cast.test.mjs` and `smoke-table-play` (Who was there).

## 7. Out of scope

- **W68** (how well a member knows the crew), unless Ken answers GQ31 yes. Then it's an order of its own, after Deighton
  and Scott.
- **Tier as buttons.** It's a number with its guidance; W81 names only Origin and Enemy role.
- **The modifiers, skills or traits on a card** (GQ81).
- **A site profile's Exposure "Add someone"** (`exposure-names`, ~1812), which also types crew. Add it to the wishlist
  as a new W if the builder agrees it's the same wish.
- **W80** (S29) and anything on Home.

## 8. The shapes

No stored shape moves.
- **A card's figures** (`cardFiguresHtml(n)`, gm.js): from `r=Engine.npc(n.block)`,
  - each `D.stats` id whose `r.stats[id].value!==null`, as `"<ID> <value>"`;
  - then each `sumOfModifiers` derived (TOL, WILL) whose `r.authored[id].used!==null`;
  - then Health: with `n.wounds` and `castHealth` giving a total, `"Health <left> of <total>"`; else with
    `r.health`, `"Health <total>"`; else nothing;
  - joined with " · ", ids in `.cast-stat-id`'s look and values in Oxanium (`threat-val`), as the read panel. One
    `<p class="cast-figs">`, `aria-label` free: the ids are words a screen reader reads.
- **The crew picker:** `crewPickHtml(names, key, label)` → the markup `whoHtml` draws today, given the list of names and
  a key for which Add a player is open; `whoHtml` becomes a call to it with "Who was there". The binding takes a
  `save(list)` and an `after()`. One rule for "answers to a seat": the engine's (`seatPicks`, `seatFor`).

## 9. The UI

Copy is drafted for the voice pass.
- **The card:** name, line, meta, then the figures. At 375px the figures wrap; nothing pushes sideways.
- **Origin and Enemy role** (Edit): the field, then the row, labelled for a screen reader "Origins in the pack" and
  "Enemy roles in the pack", as `castRolesHtml`'s "Roles in the pack".
- **A line's Crew:** the label **Crew**, then the buttons. The add row's crew comes first, as today (300's focus lands
  on its first button, or on Add a player when no seat has a name).
- **Focus:** a press keeps focus on the pressed button after the redraw, as Who was there does; Add a player's field
  takes it when it opens.

| Press | Record | Focus |
|---|---|---|
| A seat in a line's Edit | `crew` saved (toggled) | that button |
| A seat in the add row | nothing until Add | that button |
| Add (the add row) | the line, with the held crew | Add a line (folded) or What (Edit), as today |
| An origin or enemy role button | `origin` / `enemyRole` set or cleared | that button |

## 10. Worked examples, as named tests

Each fails on `main`, or the builder says why it already passes.
1. Smoke (`smoke-table-cast`), `"Decision N: a cast card shows its member's figures"`: a member with BOD 7, REF 5, TOL
   6 reads "BOD 7 · REF 5 · TOL 6 · Health …" on their card (the Health the read panel shows); one with only BOD reads
   "BOD 7" and a Health if `npc` gives one; one with no block has no `.cast-figs`; no card's meta says "Stat block".
2. Smoke: a member with `wounds` reads "Health <left> of <total>" on the card, matching `castWoundsHtml`'s figures.
3. Smoke, `"Decision N+1: Origin and Enemy role are buttons from the packs"`: with a pack of origins Dock and Spire,
   Edit shows two buttons under Origin; a press sets the field to "Spire" and presses it; a second press clears it; a
   typed "spire" presses Spire; a typed "Harbour" presses none and stays. No `#cast-origins`. With no pack, no row.
4. Smoke, `"Decision N+2: a line's crew is picked like Who was there"`: on a table with seats Nyx and Rook, the add row
   shows a button each and Add a player; pressing Nyx then Add saves a line whose crew is `["Nyx"]` (the seat's name);
   the row still has Nyx pressed. A line's Edit: pressing Rook saves `crew` with Rook at once; pressing Nyx again
   takes Nyx off. Add a player with "Ash, Vee" adds both.
5. Smoke: a line whose crew is a typed name that answers to a seat (an alias) shows that seat pressed, and a press
   takes the typed name off, not the seat's character's name.
6. Smoke: Who was there's existing tests pass unchanged (say which ran).

## 11. Tests beyond the examples

- **Mutation-test:** the figures built from the block's raw numbers instead of `Engine.npc` (an authored TOL left out,
  test 1 fails); Health ignoring wounds (test 2); the origin row pressing by exact case (test 3); the add row's crew
  cleared after Add (test 4); a seat's toggle removing by name instead of `seatFor` (test 5).
- **Hostile files:** a member with markup in `origin`, a pack name with markup, and a line's crew name with markup
  render as text on the card, the buttons and the picker.
- **Phone:** the Cast tab at 375px with *Dead Air* (fourteen members, five with blocks), and a member's Edit with the
  Codex slotted: the button rows wrap and nothing scrolls sideways (`npm run phone-check` if it reaches them, else the
  preview's metrics).
- **Real browser:** the Cast tab and a member's Edit in the dev preview, at desktop and 375px. Screenshots on the PR.
- **Voice:** every new string.

## 12. Steps

1. Baseline: `git submodule update --init private`, then `npm run test:fast`.
2. Write the worked examples, and show them failing.
3. The card's figures. Run verify, then the preview.
4. Origin and Enemy role. Run verify.
5. The crew picker: extract it from Who was there with its tests green, then put it on both line rows and move the
   cast tests to the helper. Run verify, then the preview at desktop and 375px.
6. Help, docs, close-out. Run the full `npm run verify`.

## 13. Stop and ask

- **Stop** if:
  - Who was there's behaviour has to change to share the picker;
  - a card's figures can't come from `Engine.npc` without a new engine reader (that would be a new reader for Ken to
    see);
  - a pack's origins or enemy roles don't fit two rows at 375px in the Codex;
  - Ken answered GQ31 yes (W68 is its own order).
- **Expected, not stops:** the cast tests that type a crew, moved to the helper; the datalist tests rewritten for the
  buttons.

## 14. Close-out

The `close-the-session` skill for *Rule or shape*:
- Decisions N, N+1, N+2, with their INDEX lines and the marks on 179, 184 and 262.
- The app minor. No schema.
- STATE rewritten.
- The log, and a `shipped.md` row.
- The plan's S28 row: built; GQ31 and GQ81–GQ85 answered. The wishlist: W77 closed (built by S18, Decision 258), W78,
  W81 and W142 built, W68 left as GQ31 says, and the Exposure W if §7's applies.

**CHANGELOG** (drafted, GM voice, under *GM mode*):
- "Each card on the Cast tab shows that member's numbers, and how much Health they have left."
- "Origin and Enemy role offer the pack's names as buttons, the way NPC roles do. You can still type your own."
- "Pick a line's crew with buttons, as you pick who was there."

**PR title:** `feat(gm): the cast at a glance: figures on cards, Origin and Enemy role as buttons, crew as buttons (S28, Decisions N–N+2)`.

**PR body:** the template's sections, plus **New strings as rendered**, **Screenshots** (the Cast tab and a member's
Edit, desktop and 375px) and **Where the order didn't fit**.

**Review checklist:**
- §1's five checks, run in the preview.
- The card's figures against the member's read panel, on every *Dead Air* member with a block.
- Who was there, on a session and its close-out, against `main`.
- A line's crew with an alias, a removed seat's name and a name with no seat.
- Hostile names.
- The voice of every string.

## 15. Handing it over

The builder and reviewer prompts are in `WORK-ORDERS.md`, with this order's path. Its own traps:
- **One picker for the crew.** Extract it from Who was there; don't write a second.
- **One reader for the numbers.** The card's figures are `Engine.npc`'s and `castHealth`'s, never a second sum.
- **A line keeps what the GM wrote.** A seat's button is pressed by `seatFor`; a press adds the seat's name and removes
  every name that answers to it, never rewrites a typed alias.
- **Take the numbers at build** (decisions, app) from `origin/main`, and again after any rebase.
