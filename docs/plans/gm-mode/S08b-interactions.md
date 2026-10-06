# Work order S8b — Who knows what: interactions, affiliations, the crew's view

**Plan:** [`../gm-mode.md`](../gm-mode.md) §1a, §4c (*Links*), §4e and §6 *S8*.
**Status:** drafted 2026-10-05 by Claude (Opus), after reviewing S8a's PR
(#115) and its fix round. **§4 answered by Ken, 2026-10-05.** Ready to
build once Ken approves the order.
**Branch:** from `main` (#115 and its fix round are merged at `c307ef2`),
PR to `main`, switched off (Decision 173).
**Runs alone.** It touches `engine.js`'s Tables section, `gm.js`, the
ledger, the table schema and STATE.

**What S8b is, and what it isn't.** S8a's order put interactions, history,
the crew's view and affiliation here. Three of the four earn a session now;
one doesn't:

- **Interactions** are Scott's second-biggest ask (*"who the crew has dealt
  with, what was shared, who was killed or wronged"*, §1a) and they mean
  something without sessions: a dated line *Nyx told Bob the warehouse is a
  front* is the memory he says he loses. S5 groups them into sessions
  later, by date.
- **Affiliation** is the other half of *"a roster with affiliations, so it
  isn't Bob the Goblin thirty times"*. Text until S7, the way origin and
  roles are text until S9 (174).
- **The crew's view** is the same records read from the other end: *who
  knows what*. No new shape.
- **History is not in S8b (SQ1).** §4e's `history: [ { session, text } ]` is
  what a session (S5) and a fight (S10) write back. With neither built, a
  history line is a GM note with a date, and the cast already has a GM note
  and now has interactions. Building it now builds a third place to write
  the same sentence.

**Carried over from S8a's review.** S8a's build matched its order closely;
the review's findings were small, and these are the order's:

- **Walk every state change through the list it lands in.** S8a's worst
  finding was found only by doing it in a browser: mark Bob Missing, press
  Back, and Bob vanished, because the *Alive* default hid him. The order had
  specified the filter and the status separately and never the two
  together. #115's fix round made the default **In play** (alive, then
  missing, missing cards dashed) and ordered *All* by status. **§8 has a
  table** of every press in S8b that changes a status, a filter or a view,
  with where the record ends up and where focus goes. *Killed them* is the
  one that bites here: it sets Dead, and *In play* hides the dead.
- **Say what a blank row is** (S8a stored an added-then-empty armor line
  and counted it as filled; the fix round kept the rows and fixed the
  count). Here: an interaction with no kind and no text isn't added; one
  emptied by editing stays until deleted.
- **Say what a field shows when the value is refused** (S8a's tier field
  kept showing `0` while `null` was stored; the fix round shows the stored
  value on `change`). Here: the **date** field does the same on `change`,
  as do the crew and affiliation fields (trimmed, empties dropped).
- **Keep the list's order through every new filter.** The fix round's
  `castFilter` sorts by `CAST_ORDER` after filtering. The Affiliation
  filter goes in the filter step, never after the sort (§9 tests it).
- **The screenshot tool times out in this environment** (it did for the
  build and the review). The accepted proof at 390px is metrics:
  `scrollWidth === clientWidth` on the document, and no element in `main`
  whose right edge passes the viewport. Say which you used.
- **State dates in local time.** `sheet.js`'s session log defaults its date
  with `toISOString().slice(0,10)`, which is UTC: after 7 pm in New York it
  says tomorrow. Don't copy it (§8).
- **Mutation 1 is moot again, and said so up front** (§9), rather than
  discovered: the every-load coercion defaults a missing array.
- Still true from S3a: check out `private/` before the baseline
  (`git submodule update --init private`), count each decision against
  `docs.test.mjs`'s 350-word cap, give markup only as a suggestion, wrap
  every heading and meta line that shows a GM's text, and name the engine
  test that checks a type rather than the hostile test that renders it.

**Pre-flight** (README, *The pre-flight*) against PR #115's head
`0be8d8e`, and **re-run on `main` at `c307ef2`** (#115 and its fix round
merged). If `main` has moved again, re-run the greps; anything that moved
is the building session's to raise under *Where the order didn't fit*.
Found, and built into this order:

- **`removeCastMember(t, id)`** splices the member out and stamps the table;
  nothing points at a member yet. S8b's interactions will, so it gains the
  link rule (178).
- **`castFilter(t, { q, status })`** searches name, flavor, origin and roles;
  `status` is `"inplay"` (alive and missing), one of the four, or anything
  else for all; the result is sorted by `CAST_ORDER` (alive, missing, gone,
  dead), stable. S8b adds `affiliation` to the search and an `affiliation`
  key (179), both in the filter step.
- **`TABLE_SECTIONS`** is `[cast, notes]`; `bindTable` picks the notes
  binder by the presence of `[data-tnew]`, else the cast's. The crew's view
  is a second view **inside** the Cast tab (SQ7), not a third section, so
  neither changes.
- **`renderTable`** draws through `keepPlace(main, draw, ["[data-cadd-name]",
  "[data-tnew]"])`; a new focus target after a press is named in §8.
- **A segmented choice already exists:** `.form-toggle` with `aria-pressed`
  buttons (`shared.js`'s `taglessToggleHtml`, `wizard.js`'s stat method).
  The interaction's kind uses that pattern.
- **A `<datalist>` already exists** (`power-uses`, in `sheet.js` and
  `wizard.js`): the crew-name suggestions use one.
- **`sheet.js:1285`** defaults a date with UTC (above). §8 asks for a local
  `YYYY-MM-DD` instead, from `getFullYear/getMonth/getDate`.
- **`_roleList`** (the fix round) trims and drops empties; `npcRoles` uses
  it in `migrateTable` and `editCastMember`. Affiliations and crew names use
  it too (§7).
- **Status in the UI:** `castFilterNow()` defaults to `"inplay"`; quick-add
  resets a hiding filter to `"inplay"`; **Clear the filter** goes to
  `"all"`. Cards carry `data-status`.
- **The ledger** (Decision 130), searched by name: *interaction*,
  *affiliation*, *link*, *crew*, *history*, *faction*, *filter*, *date*,
  *killed*, *status*. Hits: **176** (the cast filters, which this extends),
  **174** (its *Rejected* says interactions "need sessions (S5) or factions
  (S7) to mean anything", which 177 replaces in part). Nothing else.
- **Decisions 177, 178, 179** are free on `main` (the ledger ends at 176;
  the fix round reworded 176 in place and added none). No PR is open.

---

## 1. Goal

A GM can **keep what passed between the crew and the cast**: on a member's
page, one press after a scene, *Told them* + *Nyx* + *the warehouse is a
front*. The page lists everything between that member and the crew. The
Cast tab's other view, **Who knows what**, lists the same records by crew
name. And a member carries **affiliations**, shown on their card and
filterable, so the thirty goblins come apart.

**Done when:**

- Switched off: nothing changes anywhere.
- Switched on, a member's page has **Between them and the crew** (voice
  pass): an add row (kind, crew, date, what), and every interaction with
  this member, newest first, each editable in place, Delete asking first.
- Adding keeps the **kind** and **crew** as they were and empties the text,
  with the keyboard in it: three things Nyx learned from Bob are three
  presses of Enter, not three forms.
- A **Killed them** interaction sets each linked member's status to Dead.
  Nothing sets it back but the GM.
- **Affiliations** on a member's page: one text field, split on `/` or `,`
  like roles. The card's meta line shows them first.
- The Cast list has an **Affiliation** filter (*Any*, then every affiliation
  in the cast, A–Z, case folded), and the search reads affiliations too.
- **Who knows what:** a toggle above the Cast list, *The cast · Who knows
  what*. The second view lists each crew name with their interactions,
  newest first; a member's name in it opens their page. The search filters
  it too.
- Deleting a member keeps their interactions, with their last name struck
  through wherever it shows (178).
- Export, import, reload and Remove keep every field. A 0.2 table opens as
  0.3 with no interactions, empty affiliations, and its cast and notes
  untouched.
- A hostile table opens, renders as text, and every kind, date and link
  comes out valid or blank.
- `npm run verify` and `npm run phone-check` pass; the page and both views
  checked by hand at 390px and 1300px. (`release:check` fails on any commit
  with an `[Unreleased]` heading, as #115 found: not this order's to pass.)

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (the table's shape, the link rule, a rule that
  writes a status).
- **App:** no bump (switched off, 173). One line to `changelog-pending.md`.
- **Game data, character schema:** unchanged.
- **Table schema:** **0.2 → 0.3**, with `migrateTable()`'s step.
- **Reserved:** Decisions **177, 178, 179**. No F-flag.

## 3. The decisions, drafted

Paste after 176, under INDEX §3's **GM mode** heading, filling **Built**.
Counted as drafted with `wc -w` on each entry (`docs.test.mjs` splits on
whitespace the same way): 177 is 333 words, 178 is 271, 179 is 294.
**Recount after filling Built**; the cap is 350, and 177 has about a dozen
words of room. If it goes over, trim its *Why*, not a *Rejected* line.

```
177. **A table keeps the crew's interactions with its cast: dated records of what was shared, learned, done or owed, with the crew as typed names until seats exist.**
     *2026-10-0X · Ken + Claude · Touches: interactions, table.interactions, I- id, interaction kind, shared, learned, helped, wronged, killed, owes, owed, crew names, date, cast status, history, table schema 0.3, migrateTable, Decision 174, W29, GQ19*
     - **Decided:** Table schema 0.3 adds `interactions: [ … ]` (shape in SCHEMA §3): an id (`I-` and eight characters), a `kind` (one of seven, or null), `cast` (links, 178), `crew` (names as text), `text`, a local `date` (`YYYY-MM-DD` or null) and the stamps. Adding a *killed* interaction sets each linked member's status to dead; nothing sets it back but the GM. A member has no `history` field: until sessions (S5) and fights (S10) write one, the interactions are it.
     - **Why:** Scott forgets "what info went to whom" (§1a), and a dated line holds it without a session to hang it on. S5 offers each interaction a session by its date; it never converts on load (the gear row's rule, Decisions 120–121).
     - **Rejected:**
       - Waiting for S5: Scott's memory would wait behind the Codex and the fight.
       - Interactions inside the member: one can name several members, and the crew's view reads them from the other end.
       - A `history` list now: a third place for the same sentence, with nothing yet to write it.
       - Crew as seats: seats are S3b, last in the order; S3b claims the typed names.
       - An unknown kind read as *shared*: it invents what happened.
       - Kinds a GM types: one kind splits across spellings nothing can read; a line with no kind holds the rest.
     - **Replaces:** Decision 174 in part: interactions don't wait for sessions; the date carries them until S5.
     - **Revisit if:** S5's sessions can't match interactions by date, or a GM needs a kind the seven lack.
     - **Built:** table schema 0.3; PR #__; log 2026-10-0X.

178. **A table record links another as `{ kind, id }`; deleting the target writes its last name into each link, and a link with no target reads as that name, struck through.**
     *2026-10-0X · Ken + Claude · Touches: links, cast link, { kind, id }, removeCastMember, deleted link, struck-through name, linkName, interactions, constraint 7, constraint 8, W29*
     - **Decided:** A link is `{ kind: "cast", id }`, the plan's §4c shape; `kind` is "cast" until another record needs linking. A live link stores no name: it reads its target's. `removeCastMember` writes the member's name into every link to them as `name`. `Engine.linkName(t, link)` returns `{ name, gone }`: the target's name, else the link's stored name with `gone: true`, else *Someone removed* with `gone: true`. It never throws.
     - **Why:** a dead NPC deleted from the cast still told the crew things, and the crew's view must still say so (constraint 8: a link to something deleted is never an error). A name copied into every live link would be a second copy to keep in step, which constraint 7 exists to avoid.
     - **Rejected:**
       - Deleting a member's interactions with them: loses who knows what.
       - Asking at Delete: a question whose safe answer is always *keep*.
       - A name in every link, refreshed on rename: a stored copy of a derived value.
       - Refusing to delete a member who has interactions: the GM can't tidy the cast.
     - **Replaces:** nothing. It's the plan's §4c rule, built for its first record.
     - **Revisit if:** S5 or S7 links a kind whose deletion should cascade.
     - **Built:** as 177.

179. **A member carries affiliations as text; the Cast list filters by one; a member's page lists their interactions; and the Cast tab's second view, Who knows what, lists them by crew name.**
     *2026-10-0X · Ken + Claude · Touches: affiliations, cast filters, affiliation filter, castFilter, Cast tab, member page, Between them and the crew, Who knows what, crewView, quick entry, datalist, Decision 176, W29, GQ1*
     - **Decided:** `affiliations` is a list of text, split on `/` or `,` like roles, shown first on a card. The Cast list adds an **Affiliation** filter (*Any*, then each one in the cast) and the search reads affiliations. A member's page adds **Between them and the crew**: an add row keeping kind and crew between entries, and every interaction with them, newest first, editable in place. A toggle above the list, *The cast · Who knows what*, shows the same records grouped by crew name.
     - **Why:** Scott's "roster with affiliations, so it isn't Bob the Goblin thirty times" (§1a). Origin and role are already in the search; three more pickers on a phone cost more than they find. Kind and crew rarely change within a scene, so entry is one field.
     - **Rejected:**
       - Filters for origin and role too: the search already finds them.
       - A Crew tab: the same records, so a view of the Cast tab, not a third place to look.
       - A modal to add an interaction: it hides the list it adds to (176's reason).
     - **Replaces:** Decision 176 in part: the list filters by affiliation as well as status, and the tab has a second view.
     - **Revisit if:** S7 makes affiliations faction links, or a GM's crew list outgrows typed names before S3b.
     - **Built:** as 177.
```

**Supersession marks:** 174 → `→ **Superseded in part by Decision 177** — interactions don't wait for sessions; the date carries them until S5.` 176 → `→ **Superseded in part by Decision 179** — the list also filters by affiliation, and the tab has a second view.` Mark both INDEX lines `→ **superseded in part by 177**` / `**by 179**`.

## 4. Questions for Ken

All seven answered by Ken, 2026-10-05.

| # | Question | Answer |
|---|---|---|
| SQ1 | **History out of S8b?** Interactions are a member's history until S5 (a session's lines) and S10 (a fight's line) write one | **Yes.** History comes in a later session; §4e's `history` is added by whichever session first writes to it |
| SQ2 | Interactions **dated, not session-linked**; S5 *offers* a session by date and never converts on load? | **Yes** (the precedent Ken set in S8a's SQ2) |
| SQ3 | The crew as **typed names**, suggested from names used before (a `<datalist>`), until S3b's seats claim them? | **Yes** |
| SQ4 | The seven kinds, read **from the crew's side**: *Told them · Learned from them · Helped them · Wronged them · Killed them · Owes them · They owe* (`shared learned helped wronged killed owes owed`); *Killed them* sets the member Dead, one way. Static, or can a GM add kinds? | **As listed, labels to a voice pass.** **Static** (Ken asked; Claude's recommendation, below): a line with no kind pressed is the *anything else*. |
| SQ5 | **One new filter, Affiliation**, with origin and role left to the search? | **Yes**, one new filter |
| SQ6 | **Deleting a member keeps their interactions**, their name struck through (178)? | **Yes** |
| SQ7 | **Who knows what** as a toggle on the Cast tab, not its own tab? | **Yes** |

**Why the kinds are static (SQ4).** The kind is the only part of an
interaction anything reads: *Killed them* sets a status, the crew's view
labels by it, and S5 will count what a session's interactions were. A kind
a GM types splits one kind across spellings (*told*, *Told them*, *shared
intel*), and nothing can read those. What doesn't fit the seven already has
a home: leave the kind unpressed and write it in *What*, and the line shows
with no label. If GMs keep writing the same thing there, that's the eighth
kind, added to the list by a later session. (**Revisit if** in 177 says so.)

## 5. Read first

- `CLAUDE.md` whole: constraints 7, 8, 9, 10; the **Table schema** row;
  tiers; Decisions; voice.
- `docs/STATE.md` whole.
- The plan: §1a, §4c's *Links* paragraph, §4e (the `Interaction` shape;
  S8b builds it without `session` and `threads`), §6 *S5* (what S5 will do
  with these) and *S8*.
- `../gm-mode/S08a-cast.md` §7–§8: the shapes and UI this extends.
- `docs/SCHEMA.md` §3's *table file* block; Decisions **120–121** (offer a
  match, never convert), **124**, **164**, **170–176**.
- **The patterns to copy:**
  - `engine.js`'s *Tables* section: S8a's `_castMember`, `_strList`,
    `CAST_ID_RE`, `newCastId(used)`, `addCastMember` /
    `editCastMember` / `removeCastMember`, `castFilter`, `_tableStamp`,
    and the 0.2 step in `migrateTable`.
  - `gm.js`: `castTabHtml`, `castListHtml`, `redrawCastList` (redraws only
    the list, so the search keeps its caret), `bindCastPage`'s `data-cf`
    fields (saved on `input`, no redraw), the npcRoles split, `castCardHtml`.
  - `shared.js`: `keepPlace`, `askFirst`, `esc`, `taglessToggleHtml` (the
    `.form-toggle` markup).
- Tests to copy from: `engine.test.mjs`'s *The cast (Decisions 174–176)*;
  `hostile.test.mjs`'s `hostileTable`; `smoke.test.mjs`'s cast block.

## 6. Out of scope

- `history`, `firstMet`, `places`, `factions` as links, `threads`, `session`
  on an interaction (S5, S6, S7, SQ1). Not even as empty arrays (170).
- Linking an interaction to more than one member **from the UI**. The shape
  holds a list; S5's session writer is the first that adds several.
- Seats, a crew roster, claiming names (S3b).
- Any filter beyond Affiliation (SQ5); sorting the cast.
- Undo on the table (176). The character, `migrate()`, the sheet, Home.
- Fixing `sheet.js`'s UTC date. It's a player-side bug: raise it in the PR
  for the wishlist, don't touch `sheet.js`.

## 7. The shapes

**The table, schema 0.3:**

```js
interactions: [ {
  id: "I-XXXXXXXX",                 // the TAG alphabet; unique in the table
  kind: "shared",                   // shared | learned | helped | wronged | killed | owes | owed | null
  cast: [ { kind: "cast", id: "C-XXXXXXXX" } ],   // + name, only once the member is deleted (178)
  crew: [ "Nyx" ],                  // typed names, trimmed, no empties
  text: "",
  date: "2026-10-05",               // the GM's local day, or null
  created: "<ISO>", updated: "<ISO>"
} ]
// and on each cast member:
affiliations: [ "" ]                // text, trimmed, no empties (S7 links them)
```

**`migrateTable()`:**

- **Step 0.3 (Decision 177):** a table stamped before 0.3 gets
  `interactions: []` if it has none. Stamp `"0.3"`;
  `TABLE_SCHEMA_VERSION = "0.3"`.
- **Every load:** `interactions` an array of objects. Each: `kind` one of the
  seven, else **null** (not *shared*); `cast` an array of objects whose
  `kind` is `"cast"` and `id` a string matching `CAST_ID_RE` (others
  dropped), `name` kept only if a string; `crew` `_strList`, each trimmed,
  empties dropped; `text` `_str`; `date` kept only if it matches
  `/^\d{4}-\d{2}-\d{2}$/` **and** is a real day (`2026-02-30` is null);
  id kept if `/^I-<alphabet>{8}$/` and unused, else new; stamps
  `_isoOrNull`. A link to a member who isn't in the cast is **kept** (it
  reads as gone).
- Each cast member: `affiliations` as `crew` is (the trimmed list #115's fix
  round gave `npcRoles`).
- Unknown keys at every level kept. Idempotent.

**Engine** (Tables section, every reader total):

```js
Engine.addInteraction(t, { kind, cast:[id], crew:[name], text, date })
  → { ok:true, id } | { ok:false, why:"Say what happened." }   // no kind and no text
  // first in the list; a killed kind sets each linked member's status "dead"
Engine.editInteraction(t, id, fields)   → { ok:true } | { ok:false, why:"No such interaction." }
  // kind, crew, text, date; coerced as migrateTable does; a change TO killed sets dead too
Engine.removeInteraction(t, id)         → same
Engine.interactionsFor(t, castId)       → [ interaction ]   // newest first: date desc, null dates last, then created desc
Engine.crewView(t, { q })               → [ { name, interactions:[…] } ]
  // grouped by crew name, trimmed and case-folded; shown with its first spelling; A–Z
  // q filters by text, crew name, or a linked member's name (live or gone)
Engine.linkName(t, link)                → { name, gone }       // 178; never throws
Engine.castAffiliations(t)              → [ "…" ]              // distinct, case-folded, A–Z, first spelling
Engine.castFilter(t, { q, status, affiliation })   // q also reads affiliations; affiliation case-folded exact
// removeCastMember(t, id) now writes the member's name into every link to them first
// editCastMember accepts affiliations
```

Each edit stamps the interaction's and the table's `updated`, as the cast
edits do. An interaction with no kind and no text isn't added; an existing
one emptied by editing stays (the GM is mid-edit) and Delete removes it.

## 8. The UI

All in `gm.js`. GM-facing tool voice; drafts marked for a voice pass.

**Dates.** A `localDay(d = new Date())` helper returns `YYYY-MM-DD` from
`getFullYear`, `getMonth`, `getDate`. The add row's date starts as today's.
A date the gate refused draws blank.

**A member's page** gains, after **GM note** and before the stat block:

- **Affiliations** with the Codex fields: one text field (placeholder
  *Who they answer to*, voice pass), split on `/` or `,` and joined back with
  ` / `, saved on `input` like roles.
- **Between them and the crew** (heading, voice pass):
  - **The add row:** the kind as a `.form-toggle` of seven (*Told them*,
    *Learned from them*, *Helped them*, *Wronged them*, *Killed them*,
    *Owes them*, *They owe*), none pressed at first; **Crew** (a text field,
    names split on `,`, suggestions from every crew name in the table via a
    `<datalist>`); **When** (`type="date"`); **What** (one line,
    placeholder *What passed between them*); **Add**. Enter in *What* adds.
    After adding: the kind and crew **stay**, the date stays, *What* is
    empty and focused, and the new interaction is first in the list. The
    one exception: after a *Killed them*, the kind goes back to none (a
    second line about a dead member is rarely another killing). Pressing
    the pressed kind again unpresses it. With no kind and no text, **Add**
    does nothing, no error.
  - **The list:** each interaction shows its kind's label, the crew, the
    date (as the GM's locale shows a date, or nothing) and the text. Each
    is editable in place: the same four fields, saved on `input` (no
    redraw), the kind on press. **Delete** asks (*Delete this?* / *It goes
    from the crew's view too.* / **Delete**); then focus on the next
    interaction's first control, or the add row's *What*.
  - Choosing **Killed them** on the add row or on an existing one sets the
    status select to *Dead* on the next draw. The add redraws; an edit to
    an existing row's kind redraws the page and returns focus to that
    row's kind button.
- **Delete** (the member): the question's text becomes *Their page goes
  with them. What they had to do with the crew stays, under their name.*
  (voice pass).

**The Cast tab:**

- **The toggle**, above the filters: *The cast · Who knows what*, a
  `.form-toggle`. State on `S.castView` (`"cast"` default); kept while the
  table is open, as the filters are. The quick-add row shows only on *The
  cast*.
- **Filters:** search, status, and **Affiliation** (*Any*, then
  `Engine.castAffiliations`). Each redraws only the list (as search does
  now) so focus and caret stay. A quick-added member the filters would hide
  clears them, as S8a's does, affiliation included.
- **Card meta:** affiliations (joined ` / `) first, then S8a's bits.
- **Who knows what:** `Engine.crewView(t, { q })`. A heading per crew name
  (wraps), then its interactions, newest first: kind label, the member's
  name as a button that opens their page (struck through and not a button
  when gone), date, text. Status and Affiliation don't apply here (hide
  them); search does. Empty: *Nothing between the crew and anyone yet.*
  (voice pass). Opening a member from here and pressing **Back to the
  cast** returns to *Who knows what*, focus on the name pressed.
- A gone name (only *Who knows what* can show one: a member's own page
  never lists a link to someone else) is `<s>` with the name, and
  `aria-label` *<name>, removed*.

**Where things land** (S8a's lesson: a status and a filter, specified
apart, hid a member nobody meant to hide). Each press that moves a status,
a filter or a view, and what the GM sees after it:

| Press | The record | The list | Focus |
|---|---|---|---|
| *Killed them* added on a member's page | Status Dead (the select shows it) | Still on their page | *What*, empty; the kind back to none |
| **Back to the cast** from a member now Dead | — | Under *In play*, hidden; under *All*, last group | Quick-add's name, as for any hidden member (S8a's rule) |
| *Killed them* chosen on an existing interaction | Status Dead | Still on their page | That row's kind button |
| An interaction's kind changed **from** *Killed them* | Status stays Dead | — | That row's kind button |
| Affiliation filter chosen | — | Narrowed, still in `CAST_ORDER` | The Affiliation select |
| Quick-add while the filters would hide the new member | Added | Filters reset: search empty, status *In play*, affiliation *Any* | Quick-add's name |
| *Who knows what* toggled on | — | The crew view; status and affiliation hidden, search kept | The toggle's pressed button |
| A member opened from *Who knows what*, then **Back** | — | *Who knows what* again | The member's name button in it |
| A member deleted | Links get their name (178) | Gone from the cast; struck through in *Who knows what* | S8a's: the next card, or quick-add |
| An interaction deleted | — | Gone from their page and the crew view | The next interaction, or *What* |
| A date, crew or affiliation field loses focus | The stored value | — | Unchanged; the field shows what was stored (blank, trimmed) |

**What each interaction must do** (the contract; markup is a suggestion):

- Three interactions in a row from the keyboard: kind once, crew once,
  then *What* + Enter three times. Focus never leaves *What*.
- Typing in any field, then Home at once, keeps it.
- After every press that redraws (Add, Delete and its answer, a kind on an
  existing row, the view toggle, an affiliation choice), focus is on the
  thing named above, never `<body>`.
- Long crew names, affiliations and text wrap (`overflow-wrap:anywhere`);
  at 390px nothing scrolls sideways and the seven kinds wrap to rows.

**`changelog-pending.md`**, a third line:

> - **Who knows what.** The cast remembers what passed between them and
>   the crew, and a second view lists it by who was there. Affiliations
>   too, so a roster of goblins comes apart.

## 9. Tests

`tests/engine.test.mjs`, *Interactions and affiliations (Decisions
177–179)*. Synthetic only (*Dez*, *Ivo*; crew *Nyx*, *Rook*):

- `newTable()` stamps 0.3 with `interactions: []`. A 0.2 table (S8a's
  shape, two cast members, one note) migrates to 0.3 with
  `interactions: []`, each member `affiliations: []`, everything else
  byte-identical. A `"0.4"` table keeps its stamp and `tableCheck` says so.
- Typed over junk: `interactions: "x"`; `[null, 5, {}, {kind:"zombie",
  cast:"C-1", crew:"Nyx", text:5, date:"2026-02-30"}, {cast:[null, {kind:
  "place", id:"C-…"}, {kind:"cast", id:"bad"}, {kind:"cast", id:<valid>,
  name:7}], crew:[" Nyx ", "", 5]}]` → kind null, cast `[]`, crew
  `["Nyx"]`, text `""`, date null; the valid link kept without `name`.
  Affiliations `"Eclipse"` → `["Eclipse"]`, `["Eclipse", " "]` →
  `["Eclipse"]`. Idempotent.
- `__proto__` at the interaction, link and crew levels: `({}).pwn`
  undefined.
- `addInteraction`: first in the list; no kind and no text refused with the
  line in §7; *killed* sets the linked member dead; `editInteraction` to
  *killed* does too, and from *killed* to anything leaves Dead alone.
- `removeCastMember` writes the name into every link to them;
  `linkName` reads live, gone-with-name, and gone-without (*Someone
  removed*), and `linkName(t, null)`, `linkName(t, "x")` don't throw.
- `interactionsFor` order: two dated, one null, two on the same day by
  `created`. `crewView`: *Nyx*, *nyx* and *Nyx * are one group shown as the
  first spelling; A–Z; `q` matches a gone member's name.
- `castFilter` by affiliation (case-folded) and `q` over affiliations;
  `castAffiliations` distinct and sorted. **With an affiliation chosen the
  result is still in `CAST_ORDER`**: build a cast whose insertion order
  differs from status order, all in one affiliation, and check both.

`tests/hostile.test.mjs`: `hostileTable()` gains two interactions with
`P(…)` in text, crew, a link's `name` and a member's affiliations; render
the member's page, the Cast list with an affiliation chosen, and *Who knows
what*: `injected` is `[]`, `app.errors` empty.

`tests/smoke.test.mjs`, *Interactions and affiliations (Decisions
177–179)*, with `GM_ON`:

- Open a member; choose *Learned from them*, type *Nyx*, then *What* +
  Enter three times: three interactions first-to-last newest, kind and crew
  kept, focus in an empty *What*.
- *Killed them* on the add row: the status select reads Dead after, and
  no kind is pressed. Then **Back**: the member isn't listed under *In
  play*, and focus is on quick-add's name; under *All* they're in the last
  group. (One test per row of §8's *Where things land* table that isn't
  covered elsewhere in this list.)
- A date field given a refused value, and a crew field given `" Nyx , , "`,
  show the stored value (blank; `Nyx`) after `change`.
- Edit an interaction's text, then Home at once; reopen: it's there.
- Delete an interaction → Cancel keeps, Delete removes, focus as §8.
- Affiliations typed on a page show on the card; the filter lists them and
  narrows the list; search finds by affiliation.
- *Who knows what*: groups by crew name; a member's button opens their page
  and Back returns to the view; delete that member, and the view shows
  their name in `<s>`.
- Export → import: interactions and affiliations identical. A saved 0.2
  table opens as 0.3.
- `localDay(new Date(2026, 9, 5, 0, 30))` is `"2026-10-05"`.
- At width 390 the CSS rules for wrapping are on the new headings, crew
  names and kind toggle (jsdom has no layout; pixels by hand).

**Mutation-test** (each checked against the code at drafting):

1. **Leave `TABLE_SCHEMA_VERSION` at `"0.2"`** → the stamp tests fail.
   (Removing step 0.3 itself is moot, as in S8a: the every-load coercion
   defaults a missing `interactions` to `[]`. Don't run it as a mutation;
   say so.)
2. **Coerce an unknown kind to `"shared"`** → the typed junk test fails
   (kind null). Not the hostile test.
3. **Drop the name-writing in `removeCastMember`** → the engine's
   `linkName` gone-with-name test and the smoke `<s>` test fail.
4. **Drop *killed* → dead** → the engine test and the smoke status test fail.
5. **Group crew names without case-folding** → the `crewView` test fails.
6. **Redraw the whole page and reset the add row on Add** → the smoke
   three-in-a-row test fails (kind and crew lost). Assert the kind button's
   `aria-pressed` and the crew field's value, not only focus: `keepPlace`
   restores focus by `data-*`, so a focus-only check passes a full redraw.
7. **`localDay` from `toISOString().slice(0,10)`** → run the smoke test
   with `TZ=Pacific/Auckland` (UTC+13): 00:30 local is the previous UTC
   day, so it fails. **Under UTC, as CI runs, it passes**: say so in the
   PR. That's why the test constructs the date in local time.
8. **Return early for an affiliation without the sort** (an
   `if (affiliation) return …filter(…)` ahead of the existing chain) → the
   engine "still in `CAST_ORDER`" test fails.
9. **Keep the kind after a *Killed them*** → the smoke "no kind is pressed"
   check fails.

Record each, what you checked, and what failed, in the PR.

## 10. Steps

`git submodule update --init private`, then `npm run verify` before starting
and after each step.

1. Confirm #115 (and its fix round) is merged; branch from `main`; confirm
   177–179 free; re-run the pre-flight's greps.
2. Engine: the 0.3 step, the interaction and link coercion, affiliations,
   the trimmed lists, the new functions, `removeCastMember`'s links,
   `castFilter`. Engine tests.
3. `gm.js`: affiliations on the page and card, the Affiliation filter.
   Smoke tests.
4. *Between them and the crew* on the member's page. Smoke tests.
5. *Who knows what*. Smoke tests.
6. Hostile tests, then the nine mutations.
7. In the browser (`shadows-dev-preview`, `?gm=on`): three interactions by
   keyboard; *Killed them*; type then Home; delete a member and find their
   struck name; affiliations and the filter; 390px and 1300px. Switched off,
   Home is unchanged.
8. `npm run phone-check`.
9. Ledger, docs, close-out (§12).

## 11. Stop and ask

- #115 isn't merged, or 177–179 are taken.
- Anything needs a Codex word in `src/` or `tests/`, or a list of the
  Codex's factions.
- A character-side file needs a change (`shared.js`, `wizard.js`,
  `sheet.js`, `app.js`).
- An interaction needs a `session`, a thread, or a field §7 doesn't name.
- A decision goes over 350 words after filling *Built*.
- A test outside the ones named fails and the fix isn't obviously yours.

## 12. Close-out

*Rule or shape* tier:

- **SCHEMA:** 177–179; 174 and 176 marked superseded in part; §3's table
  block gains `interactions`, the link, `affiliations`, and the step line
  (*0.3: interactions, affiliations*).
- **INDEX:** three lines under **GM mode**; 174's and 176's marked.
- **STATE:** Versions `table schema 0.3`; §1's GM clause gains interactions
  and affiliations (177–179); §5: S8b built, switched off; S9's order next.
- **`changelog-pending.md`:** §8's line.
- **Log** entry; **shipped** row *(switched off)*.
- **The plan:** §4e's history bullet points at SQ1; §6 *S8* marks S8b
  built; README's table: S8b's status, S9 next.
- **PR** titled `feat(gm): who knows what: interactions and affiliations,
  switched off (W29 S8b, Decisions 177–179)`. Body: what changed; the seven
  mutations; the voice-pass lines; **Where the order didn't fit**; and the
  `sheet.js` UTC date for the wishlist.

## 13. Review checklist

- [ ] Every *Done when*, in the browser, switched off and on.
- [ ] A 0.2 table saved by S8a's build on `main` opens as 0.3 with its cast
      and notes intact.
- [ ] `git diff` on `shared.js`, `wizard.js`, `sheet.js`, `app.js` is empty.
- [ ] No Codex word in `src/` or `tests/`.
- [ ] The nine mutations are real, re-run locally (7 under a UTC+ zone).
- [ ] Keyboard only: open a member, three interactions, Delete one, toggle
      to *Who knows what*, open a member from it, Back; focus never on
      `<body>`.
- [ ] Delete a member with interactions; export; read the file: the links
      carry `name`, live links don't.
- [ ] 390px with a long crew name, a long affiliation and the seven kinds:
      no sideways scroll.
- [ ] 174 and 176 marked in SCHEMA and INDEX; nothing else unmarked
      (search *interaction*, *history*, *affiliation*, *link*).
- [ ] Table schema 0.3 in `engine.js`, STATE and SCHEMA; no other bump.
