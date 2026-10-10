# Work order S16 — A line reads as a sentence, and a fight's line leads to its fight

**Plan:** [`../gm-mode.md`](../gm-mode.md) §4e (the cast member), §4h
(encounters); the wishlist's **W79** and **W82** (Ken, 2026-10-08 and
2026-10-09); Decisions 177–179, 188, 193, 203, 212.
**Status:** **drafted 2026-10-10 by Claude (Opus)**, after #153 (S15, 212)
merged (README step 7). **Ken chose this session (2026-10-10)** over
Supernatural Orders (S12a), the GM layout (W80, W77, W78), and export and
print (W86 with W84).
**SQ1–SQ8 answered by Ken 2026-10-10: every default** (sentence and Edit on a member's page; *Bob owes Scott*; *Scott, D and Rook*; *The crew*; quotes for told and learned; old fight lines left as written; the wrap-up previews the sentence; Back returns).
**Branch:** from `main` at `25894e9` or later, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js` (the interaction's gate, a new
reader, `linkName`, `removeEncounter`, `_endLine`, `crewView`,
`tableSearch`), `gm.js` (three line renderers, the member page's rows, the
wrap-up's text field, the encounter's Back), the CSS, the ledger and STATE.
**Table schema 0.13.** No data, nothing in `private/`. **#154** (docs: the
playtest's W87–W99) is open and touches STATE, INDEX and WISHLIST but no
number this order reserves; whichever merges second takes the other's lines.

**Carried over from S15's review** (#153, three fix rounds). Four of the
five fixes were the order's:

- **Measure a writer at its realistic worst, not its smallest.** S15's
  prototype measured End with one line. End with three lines stored 40 KB,
  and End with a Keep and a death stored 19.5 KB. Both were past the order's
  own stop, and only running End at full size found them. Here, End writes
  the new link, so §9's End test runs with several cast rows, a Keep and a
  death.
- **A field bound to both `input` and `change` gets tested with both.** On
  blur, the change event re-sent the value and made a phantom entry. The
  order's typing test fired only `input`. This order rebuilds the member
  page's rows, whose crew and date fields bind both (`gm.js:891–899`).
  §9 fires both.
- **A rule followed literally that reads oddly is flagged in the order, not
  found in review.** *Removed Marta and 4 more* was the order's own label
  rule, applied as written. §8's sentence rules were drafted against every
  kind and the edge cases (no crew, no member, an unnamed member, several of
  each). Each one is in the table, so none should surprise.
- The fifth fix (a fold decided by a label rebuilt from the clock) was the
  build's.

**Pre-flight** (README, *The pre-flight*), against `main` at `25894e9`:

- **The record** (`engine.js`): `INTERACTION_KINDS` (`:3934`) is
  `shared, learned, helped, wronged, killed, owes, owed, fought`, and `_kind`
  reads anything else as null. `_interaction(x, used, sessions)` (`:4015`) is
  the gate: `session`, `kind`, `cast` through `_castLinks` (`:3945`, links of
  kind `"cast"` with a `C-` id; a `name` is kept only as a string), `crew`,
  `text`, `date`, the id and the stamps. Unknown keys ride along.
  `addInteraction` (`:4495`) **unshifts**, sets a *killed* line's members
  dead (`_killLinked`), and takes the one session on its day.
  `editInteraction` (`:4513`) edits session, kind, crew, text and date.
  **Neither knows an encounter.**
- **The link rule** (`linkName`, `:4481`): it reads `t.cast` only, then a
  kept `name`, then *Someone removed*. **It learns the encounter kind here.**
  `removeCastMember` writes the name into links (178). **`removeEncounter`
  (`:5514`) writes nothing**: it splices and stamps.
- **The fight's line** (`endEncounter`, `:5905`, and `_endLine`, `:5859`):
  the wrap-up's default text is
  ``Fought them in ${encounterTitle(e)}${hl}${conds}.`` End writes it with
  `addInteraction(t, { kind: killed ? "killed" : "fought", cast:[member.id],
  crew:ups.crew, text, date })` (`:5946`). The GM can edit the text in the
  wrap-up (`[data-ew-text]`) before End. **The encounter is in the text and
  nowhere else.**
- **Every place a line is read** (`gm.js`):
  - `INTERACTION_KINDS` labels (`:563`): *Told them*, *Learned from them*,
    *Helped them*, *Wronged them*, *Killed them*, *Owes them*, *They owe*,
    *Fought them*.
  - **Who knows what** (`crewViewHtml`, `:605`): label, member links, day,
    text.
  - **A session's page** (`sessionInteractionHtml`, `:1102`): label, member
    links, crew, day, text, and *Add to this session* when offered.
  - **A member's page** (`interactionRowHtml`, `:671`): **an always-open
    edit form**, not a line: kind toggles, then crew, date, the session tag,
    the text and Delete. The add row (`castInteractionsHtml`, `:682`) runs
    kind, crew, when, what, Add. `bindInteractions` (`:859`) saves each
    field as typed through `tableChange(…, false)`. Crew and date bind both
    `input` and `change`.
  - The close-out's award log (`coLogLine`, `:1354`) **isn't** an
    interaction. Untouched.
- **Search:** `crewView` (`:4546`) matches a crew name, the text and member
  names. `tableSearch`'s interaction fields (`_interactionFields`, `:4755`)
  are *What happened*, *Crew* and *With*. **Move the encounter's name out of
  the text and both stop finding a fight's line by its fight**, so both learn
  the link (§7).
- **Opening an encounter from elsewhere:** `openFound` (`:440`, Find) sets
  `S.tsection="encounters"`, `S.encOpen=id`, clears the panels, and lands on
  `[data-enc-h]`. Ended ones render read-only under *Past encounters* (188).
  The encounter's Back (`data-enc-back`, `:2302`) **always goes to the
  Encounters list**. Today's return routes are cast → encounter
  (`S.backEnc`), session → member (`S.backSess`), close-out → member
  (`S.backClose`), and threat → encounter (`S.threatEnc`). **Nothing returns
  from an encounter to a member, a session or Who knows what.** §8 adds one.
- **Undo (212):** every writer here goes through `tableChange` already.
  `removeEncounter`'s new name-writing lands in its entry, and 212's label
  rule (Fix 3) names only *Removed Dock fight*, not the lines it touched. An
  edit made through the new rows records the same diff as today's.
- **The tests this moves:**
  - **Version pins.** `grep 'tableSchemaVersion.*"0.12"'` gives **14** in
    `engine.test.mjs`, **2** in `hostile.test.mjs` and **8** in
    `smoke.test.mjs`, plus `docs.test.mjs`'s STATE check. `engine:1235` is a
    *character's* `schemaVersion` and doesn't move.
  - **The fight's text:** `engine:4836` and `:4852` pin
    `Fought them in Warehouse…`, and `smoke:5353` pins
    `Fought them in Job: …; Prone.` in `[data-ew-text]`.
  - **The member page's rows:** **8** smoke tests press or type into a row
    (`data-ikind=`, `data-icrew`, `data-itext`, `data-idate`, `data-idel`,
    `data-int=`). Under SQ1 each gains an **Edit** press first,
    and nothing else. They are found by
    `awk '/^test\(/{t=NR} /data-ikind=|data-icrew|data-itext|data-idate|data-idel|data-int=/{print t}' tests/smoke.test.mjs | sort -u`.
  - **Who knows what and the session page** read `.int-line`. The `s`
    struck-name assertions (`smoke:4064`, `:4160`) still hold if the gone
    member renders as `<s>`.
  - The CSS assertion at `smoke:4145–4146` names `.int-kinds`, `.int-line`
    and `.int-row .int-fields`. Keep those classes, or move that assertion
    and list it.
- **The ledger,** searched by name: *interaction*, *kind*, *Told them*,
  *They owe*, *fought*, *linkName*, *link*, *removeEncounter*, *endEncounter*,
  *wrap-up*, *Who knows what*, *crewView*, *Between them and the crew*,
  *session page*, *tableSearch*, *dayText*. Hits:
  - **177** (the record and its kinds): **cited, not superseded.** The ids
    and the kinds don't change (constraint 6); only how a line reads.
  - **178** (*`kind` is "cast" until another record needs linking*; delete
    writes the name): **superseded in part.** A second kind, `encounter`, and
    `removeEncounter` follows the delete rule. 182 already added an
    entry-kind link *outside* the table. This one is the first *inside* it
    other than the cast.
  - **179** (*every interaction with them, newest first, editable in place*):
    **superseded in part** under SQ1's default. A line reads as its sentence,
    and **Edit** opens it in place.
  - **193** (*offered as an interaction … with the crew's names, the day and
    how they ended*): **superseded in part.** The text is the figures, and
    the fight is a link.
  - **203** (*`session` as 178's link with a kept name: rejected, a line
    keeps its own date*): **cited.** An encounter's link is the opposite
    case: a deleted fight's line has nothing else that names it.
  - **188** (ended encounters kept read-only): cited; the link opens one.
  - **164** (a press keeps the keyboard's place): cited for Edit and Done.
  - **208** (Find): cited; `tableSearch` learns the link's name.
  - **212**: cited; nothing here bypasses `tableChange`.
- **Numbers:** Decision **213** and table schema **0.13** are free on
  `origin/main` (checked 2026-10-10). #154, the one open PR, reserves
  neither. W79 and W82 are granted. Check again before pasting.

---

## 1. Goal

Scott opens Bob's page mid-scene. Under **Between them and the crew** he
reads:

- *Scott and D fought **Bob** in **Dock fight** on 10/8/2026: 2 of 4 Health
  Levels left*
- *Scott told **Bob** “the lake is on fire” on 10/8/2026*
- *Bob owes **D** on 10/7/2026: a favour, for the van*

He taps **Dock fight** and the ended encounter opens, read-only. **Back**
brings him to Bob's page, on the link he tapped. Last week he renamed the
encounter *The Pier*, and the line says *The Pier*. He deletes an old
encounter he'd planned and never ran; a line that named it shows its name
struck through. He taps **Edit** on the second line, fixes *told* to
*learned from*, and taps **Done**.

**Done when:**

- Switched off: nothing changes anywhere.
- A line reads as one sentence, built by the engine, in every list of lines:
  a member's page, **Who knows what**, and a session's page.
- A member's page shows each line as its sentence with **Edit**. Edit opens
  the line's fields in the add row's order (crew, kind, what, when), and
  **Done** closes it. The add row follows that order too.
- **End** writes `encounter` on every line it writes, and its default text
  is the figures alone. Renaming the encounter renames the sentence.
- The fight's name is a tap to the encounter. **Back** returns to where the
  tap came from, focused on the link.
- Deleting an encounter writes its name into every line's link. The line
  shows it struck through, never as an error.
- Who knows what's search and **Find** both find a fight's line by the
  fight's name.
- A line written before 0.13 keeps its text and has no link. The gate
  converts nothing.
- A crafted `encounter` in a file can't throw or write outside its line, and
  renders as text.
- At 390px a sentence wraps and nothing scrolls sideways. Edit and Done are
  44px.
- `npm run verify` and `npm run phone-check` pass. Checked by hand at 390px,
  768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape: a saved-file shape (a line's `encounter`) and a
  GM-facing behaviour someone could have chosen otherwise (the sentence and
  its wording). It supersedes 178, 179 and 193 in part.
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** no bump.
- **Table schema:** **0.12 → 0.13**, with a `migrateTable()` step: `encounter`
  is `null` on every line already there. Nothing is guessed.
- **Character and pack schemas:** unchanged.
- **Reserved:** Decision **213**. W79 and W82 are granted.

## 3. The decision, drafted

Paste after 212, under INDEX §3's **GM mode** heading, filling **Built**.
Count it with `wc -w`, Touches included; the cap is 350, and it drafts at 337. Its wording already follows Ken's
answers (SQ1–SQ8, every default).

```
213. **A line between the crew and the cast reads as a sentence, crew first, in every list; a fight's line links to its encounter and keeps only the figures.**
     *2026-10-XX · Ken + Claude · Touches: interactions, interactionSentence, kind labels, owed, Between them and the crew, Who knows what, session page, Edit, encounter link, linkName, removeEncounter, _endLine, wrap-up, fought, crewView, tableSearch, table schema 0.13, Decision 178, Decision 179, Decision 193, W79, W82*
     - **Decided:** The engine builds each line's sentence: crew, verb, member, quoted words for *told* and *learned from*, the fight for *fought* and *killed*, the day, then the rest after a colon. *They owe* reads *Bob owes Scott*. Every list of lines reads it; on a member's page **Edit** opens a line's fields as crew, kind, what, when. Table schema 0.13 adds a line's `encounter`, 178's link, which End writes, its text keeping only the figures. Deleting an encounter writes its name into the link. The gate converts no old line.
     - **Why:** Ken reads a line crew first (W79), and a fight's name baked into its text went stale and led nowhere (W82).
     - **Rejected:**
       - The sentence built in each renderer: three lists, three sentences; the engine's is total and tested once.
       - Rows always open, reordered: a long history is a wall of fields on a tablet, and mid-scene the page is read, not edited.
       - Old fight lines converted by matching their text: the gate would guess (203).
       - The encounter's name stored in a live link: a copy that goes stale (178).
       - *Scott is owed by Bob*: crew first, but passive.
     - **Replaces:** Decision 178 in part (a second link kind), 179 in part (a line reads as a sentence, opening to edit), 193 in part (the fight's line is figures and a link).
     - **Revisit if:** S3b's seats name the crew, a GM wants a line in their own words, or a voice pass changes a verb.
     - **Built:** table schema 0.13, switched off (173); log 2026-10-XX.
```

**Supersession marks:**

- 178 gets *→ **Superseded in part by Decision 213** — a line links its
  encounter, `{ kind: "encounter", id }`, and deleting the encounter writes
  its name.*
- 179 gets *→ **Superseded in part by Decision 213** — a line reads as a
  sentence; Edit opens it in place.*
- 193 gets *→ **Superseded in part by Decision 213** — the fight's line keeps
  the figures and links its encounter.*
- Their INDEX lines get *→ **superseded in part by 213***.

If the ledger search at build time finds another, stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **A member's page.** Its lines are open edit forms today. Show each as its sentence with **Edit** (one open at a time, Done closes it), or keep the forms always open and only reorder them? Reading is what the page is for mid-scene, and an edit to an old line is rare. **8** smoke tests gain an Edit press | **Sentence + Edit** | **Default** (Ken) |
| SQ2 | **They owe.** W79 left it to a voice pass. *Bob owes Scott* (member first, plain) or *Scott is owed by Bob* (crew first, passive)? | ***Bob owes Scott*** | **Default** (Ken) |
| SQ3 | **Several crew names.** *Scott and D*, *Scott, D and Rook* (no Oxford comma), or Ken's shorthand *Scott, D*? Several members join the same way | ***Scott and D*** | **Default** (Ken) |
| SQ4 | **No crew name.** *The crew told Bob*, or *Someone told Bob*? A line with no member (only a hostile file has one) reads *someone* | ***The crew*** | **Default** (Ken) |
| SQ5 | **The words.** *Told* and *learned from* quote them before the day: *Scott told Bob “the lake is on fire” on 10/8/2026*. Every other kind puts them after the day and a colon: *Scott helped Bob on 10/8/2026: carried the bags*. A line with no kind reads *Bob, with Scott, on 10/8/2026: met at the pier*. ✎ all | **As written** | **Default** (Ken) |
| SQ6 | **Fight lines already written** keep their text (*Fought them in Dock: 2 of 4…*), with no link, so they read *Scott fought Bob on 10/7/2026: Fought them in Dock: 2 of 4 Health Levels left.* Only your and Scott's tables have any. Leave them, or let the 0.13 step strip a leading *Fought them in <a title that matches an encounter on this table>* and link it? | **Leave them** (the gate converts nothing, 203) | **Default** (Ken) |
| SQ7 | **The wrap-up** previews each line's sentence above its text field (*Scott and D fought Bob in Dock fight:*), so the GM sees what the figures sit under | **Preview it** | **Default** (Ken) |
| SQ8 | **Back from a fight.** Tapping the fight's name opens it; Back returns to the member's page, Who knows what, or the session's page it came from, on the link. Without a tap from a line, Back goes to the Encounters list as now | **Back returns** | **Default** (Ken) |
## 5. Read first

- `CLAUDE.md` whole: constraints 6, 7, 8 and 10; *Decisions*; *Change
  tiers*; *Versions* (the table schema).
- `docs/STATE.md` whole.
- `docs/SCHEMA.md` §3, *The table file* (interactions); §4, Decisions
  **177**, **178**, **179**, **182**, **188**, **193**, **203**, **208**,
  **212**.
- `docs/WISHLIST.md`: **W79**, **W82**.
- `docs/VOICE-APP.md`: this is tool voice (a GM's own record, read back).
- **The code:** `engine.js`'s `INTERACTION_KINDS`, `_castLinks`,
  `_interaction`, `linkName`, `addInteraction`, `editInteraction`,
  `interactionsFor`, `crewView`, `_interactionFields`, `tableSearch`,
  `removeEncounter`, `encounterTitle`, `_endLine`, `encounterWrapUp`,
  `endEncounter`, `migrateTable` (the steps and the gate's interaction pass);
  `gm.js`'s `INTERACTION_KINDS` and `interactionLabel`, `kindToggleHtml`,
  `linkNameHtml`, `crewViewHtml`, `dayText`, `interactionRowHtml`,
  `castInteractionsHtml`, `bindInteractions`, `sessionInteractionHtml`,
  `bindSessionOpeners`, `openFound`, the cast page's Back (`[data-cback]`),
  `encOpenNow`, the wrap-up (`[data-ew-text]`), and `data-enc-back`.

## 6. Out of scope

- **New kinds, or renamed ids** (constraint 6). Only how a line reads.
- **Linking a fight by hand.** Only End writes `encounter`. Edit doesn't
  offer it, and an edited line keeps the link it has.
- **The award log** (`coLogLine`): not an interaction.
- **Activity's labels** (212) stay *Added a line* and *Changed a line*.
  Using the sentence there is a later wish.
- **Converting old lines** (SQ6).
- **A member's history in their own words**, seats claiming crew names
  (S3b), and the cast list's stat blocks or layout (W77, W78, W80).

## 7. The shapes

**A line, 0.13** (beside today's fields):

```js
encounter: null | { kind: "encounter", id: "EN-XXXXXXXX", name?: "" }
  // 178's link: a live one stores no name; removeEncounter writes `name`.
  // End writes it on every line it writes. Nothing else does.
```

**The gate** (`_interaction`, every load): `encounter` is kept only if it's
an object with `kind === "encounter"` and an `id` matching `ENCOUNTER_ID_RE`.
A `name` is kept only as a string. Anything else is `null`. A link to an
encounter that isn't on the table is **kept** (178). The 0.13 step sets
`encounter = null` where it's absent, and converts nothing.

**Engine:**

| Function | Does | On bad input |
|---|---|---|
| `linkName(t, link)` | learns `kind: "encounter"`: a live one reads `encounterTitle`, else the kept `name`, else ✎ *An encounter removed*, `gone: true`. A cast link reads as today | never throws |
| `addInteraction(t, f)` | takes `f.encounter`, an encounter's id: kept as a link **only if that encounter is on the table**, else no link (not a refusal) | as today |
| `removeEncounter(t, id)` | as today, plus writes `name: encounterTitle(e)` into every line's `encounter` with that id | as today |
| `_endLine(t, e, ended)` | **the figures only**: `2 of 4 Health Levels left, Down; Prone.`, or `Prone.`, or `""` when there are none. The *Fought them in <title>* prefix goes | — |
| `endEncounter` | passes `encounter: e.id` to each `addInteraction` it makes | as today |
| `interactionSentence(t, x)` | **new, read-only.** `{ parts: [ … ] }`, each part one of `{ kind:"text", text }`, `{ kind:"cast", id, name, gone }`, `{ kind:"encounter", id, name, gone }`, `{ kind:"day", date }`. The UI joins them and formats the day with `dayText` (the engine has no locale). §8's table gives the order and the words | a non-object, a non-array `cast` or `crew`, an unknown kind, or a missing table each still give parts; never throws |
| `crewView(t, f)` | the search also matches the encounter's name (`linkName`) | as today |
| `_interactionFields` | adds `["Fight", <the encounter's name>]` when the line has one | as today |

`editInteraction` is unchanged. It never touches `encounter`.

## 8. The UI

All in `gm.js` and the CSS. Tool voice; ✎ marks text for a voice pass.
**Built for a tablet** (plan §1a): every control a tap, 44px.

**The sentence** (`interactionSentence`). As Ken answered (SQ2–SQ5):

| Kind | Reads ✎ |
|---|---|
| `shared` | *{crew} told {member} “{text}” on {day}* |
| `learned` | *{crew} learned from {member} “{text}” on {day}* |
| `helped` · `wronged` · `killed` · `fought` | *{crew} helped / wronged / killed / fought {member}[ in {fight}] on {day}: {text}* (`in {fight}` only for `killed` and `fought` with a link) |
| `owes` | *{crew} owes / owe {member} on {day}: {text}* (*owe* when the crew is more than one name) |
| `owed` | *{member} owes / owe {crew} on {day}: {text}* (*owe* when the members are more than one) |
| none | *{member}, with {crew}, on {day}: {text}* |

- **{crew}:** the names, joined *A*, *A and B*, *A, B and C*. With none it
  reads ✎ *The crew*.
- **{member}:** each linked member as a `cast` part, joined the same way. An
  unnamed live member reads *them*, and a gone one is its kept name, struck.
  With none it reads ✎ *someone*.
- **{fight}:** an `encounter` part.
- **Missing pieces drop cleanly:** no day means no *on …*. No text means no
  quotes and no colon. A *told* line with no text reads *Scott told Bob on
  10/8/2026*.
- Text is always escaped. A quote inside the text is left as typed.

**Rendering a part:** a live `cast` part is today's `linkNameHtml` button
(`data-copen`), except on that member's own page, where it's plain text. A
gone `cast` part is `<s>`. A live `encounter` part is a button,
`data-eopenline="<line id>|<encounter id>"`. A gone one is `<s>`, with
*, removed* for a screen reader as 178's are. The day is
`<span class="int-date">`.

**Where it shows:**

- **Who knows what** (`crewViewHtml`): each `li.int-line` is the sentence.
- **A session's page** (`sessionInteractionHtml`): the sentence, then *Add
  to this session* when offered, as now.
- **A member's page** (SQ1): each line is
  `<li class="int-line" data-int="<id>">`, holding the sentence, the
  session's tag when it has one (as now), and **Edit** ✎. One line is open
  at a time (`S.intEdit`, an id or null, cleared when the page changes). An
  open line keeps its sentence on top, live, and under it its fields in the
  add row's order: **Crew**, the kind toggles, **What**, **When**, then
  **Delete** (danger) and **Done**. Fields save as typed, as now: no draft
  and no Save.
- **The add row:** Crew, the kind toggles, What, When, Add. Enter in What
  adds (as now). The draft keeps kind and crew between entries (as now).
- **The wrap-up** (SQ7): above each row's text field, the line's sentence
  without its text: *Scott and D fought Bob in Dock fight on 10/8/2026:*,
  updating as the GM sets a status (a death turns it to *killed*). The
  field's default is `_endLine`'s figures.

**Where things land:**

| Press | The record | The view | Focus |
|---|---|---|---|
| **Add** (add row) | a line | the list redraws, newest first | **What** (as now) |
| **Edit** on a line | — | that line opens; any other open one closes | the open line's **Crew** |
| A kind toggle in an open line | edited | the sentence above updates; the line stays open | the toggle (as now) |
| Typing in an open line's field | edited (212 folds it) | the sentence updates with no redraw of the field | stays |
| **Done** | — | the line closes | that line's **Edit** |
| **Delete** in an open line | asks (as now), then removed | the list redraws | the next line's **Edit**, else **What** |
| A fight's name in a sentence | — | the Encounters tab, that encounter open (ended: read-only, 188), panels cleared as `openFound` does | the encounter's heading, `[data-enc-h]` |
| **Back** on an encounter reached that way (SQ8) | — | the page it came from, as it was: the member's page (with `S.intEdit` closed), Who knows what (with its search), or the session's page | the link it came from (`data-eopenline`), else that page's heading |
| **Back** on an encounter reached any other way | — | the Encounters list (as now) | as now |
| A member's name in a sentence | — | as now (`data-copen`, `data-cwhere`) | as now |

The return route is state beside the others (`S.backFromLine = { where,
tsection, castOpen, castView, sessOpen }`, or the build's name for it). It's
cleared when the encounter's Back uses it, and when the GM leaves the
encounter any other way (a tab, Find, Home).

**After an undo** (212) that removes an open line, `S.intEdit` closes with
it. `undoTableEntry` already redraws, and the open id is checked on draw.

**At width:** a sentence wraps (`overflow-wrap:anywhere` on `.int-line`, as
now). An open line's fields stack at 390px.

## 9. Tests

**`tests/engine.test.mjs`**, *A line reads as a sentence (213)*:

- **Each kind's sentence, part by part:** for every kind in
  `INTERACTION_KINDS` and for none, with one crew name and with three, with
  one member and with two, with and without a day and text. Assert the joined
  text (the day as its ISO, since the engine has no locale) and the part
  kinds. Cover *owes*/*owe* and *owed*'s member-first order, an unnamed
  member as *them*, a gone member, no crew (*The crew*), and no member
  (*someone*).
- **Total:** `interactionSentence` on `null`, `{}`, a line whose `cast` is
  `"x"`, whose `crew` is `[1, {}]`, or whose kind is `"zap"`: parts come
  back, nothing throws.
- **The link:** `addInteraction` with an encounter on the table links it,
  and with an unknown id doesn't. `linkName` reads a live encounter's title,
  then a renamed one's new title, then (after `removeEncounter`) the kept
  name, `gone: true`. A link with no name and no target reads *An encounter
  removed*.
- **End, at its realistic worst** (Carried over): on S15's `bigTable()`, an
  encounter with three cast rows, a Keep and one cast row set dead. Every
  line End writes has `encounter` set to it. The texts are the figures
  alone. The dead one is *killed*. Then record and undo it (212), and the
  table deep-equals its state before (`undoBase`).
- **`_endLine`:** figures with levels and Conditions; Conditions only;
  nothing at all (`""`). **`engine:4836` and `:4852` move** to the new text.
- **Search:** `crewView({ q:"Dock" })` finds a fight's line by its
  encounter's name. `tableSearch(t, "Dock")` returns the line with a
  *Fight* field.
- **The gate:** an `encounter` of `"EN-…"` (a string), `{ kind:"cast", id }`,
  an id of `"__proto__"` or `"EN-1"`, an object with a numeric `name`, or an
  array: the link is `null` (the numeric `name` dropped, the link kept if
  its id is good), and the line's neighbours are kept. **A 0.12 table loads
  with `encounter: null` on every line, its text untouched.**
  `newTable()` → `addInteraction` → `migrateTable` round-trips (constraint 8).
- **Version pins:** every `tableSchemaVersion` `"0.12"` assertion moves to
  `"0.13"` (14 here, at the pre-flight).

**`tests/smoke.test.mjs`**, switched on:

- **The member page reads sentences:** add *Nyx* told *the warehouse is a
  front*. The line reads *Nyx told Dez “the warehouse is a front” on …*, and
  *Dez* isn't a button on Dez's own page.
- **Edit and Done:** Edit opens the line and focuses Crew. Typing a crew
  name **and then firing `change`** updates the sentence and makes one
  Activity entry, with no toast (S15's carried lesson). Done closes it with
  focus on Edit. A second Edit closes the first.
- **The add row's order:** Crew, the kinds, What, When, in document order.
- **End writes the link:** run and End a fight with Dez. Dez's page reads
  *… fought Dez in <fight> on …: <figures>*. Tap the fight: the ended
  encounter is open, focus is on its heading. Back returns to Dez's page,
  focus on that link. Do the same from **Who knows what** and from a
  **session's page**, each returning to where it began.
- **Rename and remove:** rename the ended encounter, and the sentence follows.
  Remove it, and the line shows its name in `<s>` with no button and
  `app.errors` empty.
- **The wrap-up preview** (SQ7): its sentence shows above the text field and
  turns to *killed* when the status is set dead. **`smoke:5353` moves** to
  the figures.
- **The 8 row tests** gain an Edit press, and nothing else changes in them.
- **Version pins:** the 8 `"0.12"` assertions move to `"0.13"`.

**`tests/hostile.test.mjs`:** a table whose lines carry an `encounter` with
`<img onerror>` as its kept `name`, a `__proto__` id, a cast-kind link and an
array. It renders the name as text in all three lists, no `img` is in the
page, `Object.prototype` is untouched, and the 2 version pins move.

**Mutation-test** (record each in the PR with the test that caught it).
Check each for a second path first:

1. **`removeEncounter` writing no name** → engine *the link* (gone with
   *An encounter removed*, not the name), and smoke *rename and remove*.
2. **The gate accepting a cast-kind `encounter`** → engine *the gate*.
3. **`owe`'s agreement removed** → engine *each kind's sentence*.
4. **End not passing `encounter`** → engine *End at its realistic worst*.
5. **`crewView` not reading the encounter's name** → engine *search*.
6. **Back ignoring the return route** → smoke *End writes the link* (from
   each of the three places).
7. **Edit's fields saving on `input` only**, the change handler removed →
   check whether any test notices. If none does, say so in the PR. It's a
   guard that `change` stays a no-op, not a feature.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and at
the end; the targeted test files after each step.

1. Confirm 213 and 0.13 are free on `origin/main`. Search the ledger again
   for the pre-flight's names.
2. **The shape:** the 0.13 step, the gate's `encounter`, `linkName`'s
   encounter kind, `removeEncounter`'s name. The version pins. Engine tests.
3. **The writer:** `addInteraction`'s `encounter`, `_endLine`'s figures,
   `endEncounter` passing the link. The End test at its worst, then undo.
4. **The sentence:** `interactionSentence`, `crewView`'s and
   `tableSearch`'s encounter name. Engine tests per kind.
5. **The lists:** Who knows what and the session page read the sentence.
   Then the member page: sentences, Edit and Done, the add row's order, the 8
   row tests.
6. **The link and Back:** the fight's tap and its return route, from all
   three places.
7. **The wrap-up's preview** (SQ7).
8. **Hostile** test; the CSS for an open line and the stacked fields.
9. **In the browser** (`shadows-dev-preview`, `?gm=on`, a pack slotted):
   - Add lines of every kind on a member's page.
   - Run a fight with two cast members, a Keep and a death, then End it.
   - Read the lines on each member's page, in Who knows what, and on the
     session's page.
   - Tap the fight and come Back from each of those places.
   - Rename the fight, then remove a planned one that a line names.
   - Edit a line, Done, then Undo from the toast.
   - Check at **390px**, **768 × 1024** and **1300px**. Run
     `npm run phone-check`.
10. The mutations (§9).
11. Ledger (213; 178, 179 and 193 marked), INDEX, SCHEMA §3 (a line's
    `encounter`, 0.13), the plan, STATE, W79 and W82 to
    `log/wishes-granted.md`, docs, close-out (§12).

## 11. Stop and ask

- 213 or 0.13 is taken.
- The ledger search finds a decision 213 overrides that the pre-flight
  doesn't name.
- A line is written anywhere other than `addInteraction` (a writer that
  builds one by hand would skip the link and the gate's shape).
- The sentence needs a word for a case §8's table doesn't cover.
- An existing test needs a change beyond the version pins, the three fight
  texts, the 8 row tests' Edit press and the CSS assertion named above.
- Undo's round trip of End isn't deep-equal.
- The voice test flags any of the new copy.
- The decision goes over 350 words.

## 12. Close-out

*Rule or shape* tier, switched off, table schema 0.13:

- **SCHEMA:** 213; the marks on 178, 179 and 193; §3's interactions gain
  `encounter` and 0.13's line.
- **INDEX:** 213's line under **GM mode**; the lines for 178, 179 and 193
  marked.
- **STATE:**
  - The versions line: table schema 0.13.
  - §1's GM clause gains *and reads each line between the crew and the cast
    as a sentence, crew first, a fight's line leading to its fight (213)*.
  - What's next.
- **The plan:** the build-order table gains S16 (W79 and W82, Decision 213).
- **Wishlist:** W79 and W82 move whole to `log/wishes-granted.md`, each
  heading pointing at *→ Decision 213 (switched off)*.
- **`changelog-pending.md`:** ✎ *Every line between the crew and the cast
  reads as a sentence, crew first: Scott told Bob “the lake is on fire”. A
  fight's line names its fight, and a tap opens it.*
- **Log** entry: why the sentence is the engine's, the End test at full size,
  and the return route. **Shipped** row *(switched off)*. README's table:
  S16's row.
- **PR** titled `feat(gm): a line reads as a sentence, and a fight's line
  links its fight, switched off (S16, Decision 213)`. Body sections: what
  changed; the mutations; the browser check; **Where the order didn't fit**.

## 13. Review checklist

- [ ] **In the browser, by the orchestrator:**
  - every kind's sentence on a member's page;
  - End with two cast members, a Keep and a death, read in all three lists;
  - the fight's tap and Back, from each place;
  - a rename and a removal;
  - Edit, typing, tabbing out (no toast), Done, then Undo.
- [ ] End at its realistic worst writes the link on every line and undoes
      deep-equal.
- [ ] A 0.12 file's lines load untouched with `encounter: null`; a crafted
      link renders as text.
- [ ] Find and Who knows what find a fight's line by its fight.
- [ ] Only the named tests changed: the version pins, the three fight texts,
      the 8 row tests' Edit press, and the CSS assertion if moved.
- [ ] 390px: sentences wrap; an open line's fields stack; nothing scrolls
      sideways.
- [ ] 178, 179 and 193 marked; table schema 0.13 everywhere it's written.
- [ ] Two mutations re-run locally.
