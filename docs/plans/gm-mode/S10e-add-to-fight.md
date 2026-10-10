# Work order S10e — Adding to a fight: Add to always on screen, the Codex inside an encounter, Add on a Threats card

**Plan:** [`../gm-mode.md`](../gm-mode.md) §4h (encounters), §6 S10; the
wishlist's **W74**, **W75** and **W76** (Ken, 2026-10-08, from using S10a–c);
Decisions 182, 188, 190.
**Status:** **drafted 2026-10-09 by Claude (Opus)**, after #149 (S10d, 210)
merged (README step 7). **Ken chose this session (2026-10-09)** over table
undo (W83), export and print (W86 with W84), and the gazetteer (S6).
**SQ1–SQ5 wait on Ken**, each with a default.
**Branch:** from `main` at `4fe267a` or later, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js` (the encounter section), `gm.js` (the
cast member's page, the Threats tab, the Encounters tab's Add section), the
CSS, the ledger and STATE. **No table schema bump:** nothing new is stored.
No data, nothing in `private/`.

**What S10e is.** Three things Ken ran into using the Encounters tab, all about
getting someone *into* a fight:

- **W75.** **Add to <encounter>** shows on a cast member's page, a Codex
  entry's page and a group's page only while an encounter is **open on the
  Encounters tab**. Back out of that encounter and the button disappears,
  which reads as "it isn't there". Now it is **always** shown. It names the
  encounter it goes to: the one open on the tab, else the running one, else
  the newest planned one. With none, it reads **Add to a new encounter** and
  makes one.
- **W74.** An encounter's **Add** section searches the cast, but for the Codex
  it says "open an entry or a group on Threats", which is three taps out of
  the fight and back. It gains **From the Codex**: a search over the slotted
  packs' entries and groups, each with **Add**.
- **W76.** **Add to cast** is on an entry's page, not on its card, so five
  Codex entries into the cast is five round trips. Each entry card in the
  Threats list gains **Add to cast** and **Add to <encounter>**, and each group
  card gains **Add to <encounter>**.

**The engine change is one reader and one writer.** `encounterFor(t, openId)`
says which encounter an Add to button means. `addToEncounter(t, openId, src,
packs)` checks what's being added, finds that encounter or makes one, and adds
the row(s). It refuses before writing anything, the new encounter included.
Every Add to button in the app goes through it, so the fallback lives in
one place and is tested once.

**Carried over from S10d's review** (#149, one fix round). Two of the three
fixes were the **order's**:

- **A computed order must not move a group mid-action.** S10d's order defined
  a side's best leaving out Out and Goes last rows. Recomputed on every read,
  that split a side's wave when its acted best row went Out. When an order
  computes "where something goes" from live state, check what happens when
  that state changes halfway through. Here: the Add to button's target is
  recomputed on every draw. A press that makes a new encounter must leave the
  **next** press going to that same encounter (§8, the press table), not to
  one the fallback picks differently.
- **Set-once controls stay out of the sticky bar.** S10d's order put the mode
  toggle in `.enc-bar`, and it doubled the bar's height during play. Nothing
  here goes in `.enc-bar`. The Codex search lives in the Add section, below
  the rows.
- **A no-op press writes nothing** (the build's). Here, a refused add writes
  nothing, the new encounter included (`meta.updated` unchanged, no
  encounter made).

**Pre-flight** (README, *The pre-flight*), against `main` at `4fe267a`:

- **The target today is `encTarget()`** (`gm.js:1824`): `encOpenNow()` if it
  hasn't ended, else `null`. `encAddBtnHtml(attr, e)` (`:1825`) renders
  nothing for `null`. It has three call sites: the cast member's page
  (`castPageHtml`, `:624`, `data-cenc`), the entry page (`entryPageHtml`,
  `:1679`, `data-tenc`), the group page (`groupPageHtml`, `:1688`,
  `data-tgrpenc`). Their handlers are `bindCastPage`
  (`:901–906`) and `bindThreatPage` (`:1774–1787`), each calling `encTarget()`
  again, then `addParticipant` / `participantFromEntry` /
  `participantsFromGroup`, then `tableChange(()=>{}, false)` (no redraw: the
  page stays), then a `notice`. **No other caller of `encTarget`** (grep).
- **`S.encOpen`** is the encounter open on the Encounters tab. It stays set
  when the GM moves to Cast or Threats (the comment at `gm.js:1803`), and it's
  cleared by **Back to encounters**. So "none open" is common mid-session.
  That's W75's complaint.
- **The engine already has** `runningEncounter(t)` (`engine.js:5208`), one
  running at most (188), and `addEncounter(t, f)` (`:5210`), which **unshifts**:
  the list is newest first, and `created` is an ISO stamp. Two encounters made
  in the same millisecond tie on `created`, so the tie goes to list order
  (index 0 first). `encounterTitle(e)` (`:5188`) reads a blank name as
  *Encounter YYYY-MM-DD*.
- **The writers and their refusals:** `addParticipant` (`:5314`: *No such
  cast member.*, *Already in.*), `participantFromEntry` (`:5353`: *No such
  entry.*), `participantsFromGroup` (`:5363`: *No such group.*, *Nobody in that
  group can be found.*), each after `_live`'s (*No such encounter.*, *X has
  ended.*). Each stamps on success. `castFromEntry` (`:5005`: *No such entry.*)
  unshifts a member and stamps.
- **The Threats list:** `threatCardHtml` (`:1604`) and `threatGroupCardHtml`
  (`:1610`) draw a `li[data-tcard]` with the name as a `button.cast-open`
  (`data-tentry` / `data-tgroup`) and a meta line. `bindThreatCards` (`:1725`)
  makes a tap anywhere on the card open it, **except on a button**
  (`ev.target.closest("button")`). So buttons added inside the card don't
  open it. `redrawThreatList` (`:1720`) redraws the list on every search key
  and re-binds through `bindThreatCards`. New buttons must be bound there.
- **The entry page's Add to cast** (`data-tuse`, `:1789–1797`) opens the copy
  in the cast with its name selected (182, then 190: *what Use did*).
- **The encounter's Add section** (`encAddHtml`, `:2096`): **From the cast**
  toggles `S.encPick`, a search (`data-enc-q`, `S.encQ`) whose list
  (`encPickHtml`, `data-encpicklist`) is swapped in place on input (`:2287`),
  each member with **Add** (`data-enc-addcast`), focus moving to the next
  member's Add (`pickNextAdd`). Then **Add a PC**. Then the note *From the
  Codex: open an entry or a group on Threats.* `S.encPick` and `S.encQ` are
  cleared on opening an encounter (`:377`, `:2147`).
- **The Codex readers:** `packFilter(packs, f)` (`engine.js:4775`) takes one
  view at a time (`"npc"` or `"threat"`) plus `q`, folded. `packGroups(packs,
  f)` (`:4863`) takes `q`. `entryMetaText` (`gm.js:1599`) is the card's meta
  line. `entryKey(pack, id)` is the `pack|id` key the Threats tab uses.
- **Tests that pin today's behaviour** and change *because the order changes
  it* (190 is superseded in part):
  - `smoke.test.mjs:5024`: *an encounter button with none open* asserts
    `[data-tenc]` is `null`. With First and Second planned and none open, it
    now reads **Add to Second** (the newest planned).
  - `smoke.test.mjs:5083`: *an ended encounter is a target* asserts `null`.
    With only an ended encounter, it now reads **Add to a new encounter**.

  The rest of that test (5019) passes as is: an open encounter still wins.
  The card text assertions (`:4348`, `:4382`, `:4443`, `:4444`, `:4802`,
  `:4804`) are `match`/`doesNotMatch` on the meta line and survive buttons
  being added. No test asserts the Codex note's words (grep).
- **The ledger,** searched by name: *Add to*, *Add to cast*, *Use*,
  *encTarget*, *data-tenc*, *data-tgrpenc*, *data-cenc*, *Threats tab*, *card*,
  *From the cast*, *packFilter*, *packGroups*, *encounter open*. Hits:
  - **190** (*Add to <the encounter open on the Encounters tab>*, shown only
    while one is open): **superseded in part.** Its *Rejected* has *Adding to
    the newest planned encounter: invisible when there are two*. That's
    weighed here, not re-raised: the button **names** the encounter it goes to
    (as 190 already made it do), and the open one still comes first. What 190
    didn't weigh is the button vanishing, which Ken found reads as "it isn't
    there" (W75). That's the new thing (Decision 130).
  - **182** (the Threats tab, Use): extended, not replaced. A card's Add to
    cast is a second place to copy an entry from; 182's copy is unchanged.
    Cited.
  - **188** (an entry row is its own copy; nothing goes into the cast until
    Keep, 193): unchanged, cited. The Codex search adds entry rows, never cast
    members.
  - **164** (a press keeps the keyboard's place): cited for the relabel and the
    Codex list.
  - Nothing else mentions where an Add button goes.
- **Decision 211:** free on `origin/main` (checked 2026-10-09). No GQ, F or W
  number is needed. W74–W76 move to `log/wishes-granted.md`. Check again
  before pasting.

---

## 1. Goal

Scott is reading the Codex on the Threats tab between scenes. No encounter is
open on the Encounters tab; *Dock fight* is planned. Every entry card says
**Add to cast** and **Add to Dock fight**. He taps **Add to Dock fight** on
Street Tough three times and on Gull Watch's group card once, without leaving
the list. He taps **Add to cast** on Marta's card; she's in the cast, and he's
still on the list. Mid-fight, a fourth Tough shows up: on the encounter's page,
under **Add**, he opens **From the Codex**, types *tou*, and taps **Add** beside
Street Tough. Next week, with every encounter ended, a cast member's page says
**Add to a new encounter**. One tap makes a planned encounter with them in it,
and the button now names it.

**Done when:**

- Switched off: nothing changes anywhere.
- **Add to <encounter>** shows on every cast member's page, entry page and
  group page, and on every card in the Threats list (entries and groups),
  whether or not an encounter is open.
- It names the encounter the open one, else the running one, else the newest
  planned one; with none, it reads **Add to a new encounter**, and a press
  makes a planned encounter with that row in it.
- After any press, every Add to button on the page names where the next press
  goes, without a redraw, and focus stays on the button pressed.
- Each entry card has **Add to cast**, which copies the entry into the cast and
  stays on the list (SQ2).
- An encounter's **Add** section has **From the Codex** when a pack is
  slotted: a search over entries and groups, each with **Add**, adding to this
  encounter.
- A refused add writes nothing: no row, no encounter made, `meta.updated`
  unchanged.
- At 390px a card's buttons wrap, and nothing scrolls sideways.
- `npm run verify` and `npm run phone-check` pass; checked by hand at 390px,
  768 × 1024 and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape: a GM-facing behaviour someone could have chosen
  otherwise, reopening 190 in part.
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** no bump; no data changes.
- **Table schema:** **unchanged** (0.11). Nothing new is stored: the target
  is computed on every draw (constraint 7).
- **Character and pack schemas:** unchanged.
- **Reserved:** Decision **211**. W74, W75 and W76 are granted.

## 3. The decision, drafted

Paste after 210, under INDEX §3's **GM mode** heading, filling **Built**.
Count it with `wc -w`; the cap is 350.

```
211. **Add to an encounter is always on screen, naming where it goes (the encounter open, else the running one, else the newest planned) or making a new one; an encounter searches the Codex itself; and a Threats card adds to the cast and to the encounter.**
     *2026-10-XX · Ken + Claude · Touches: Add to encounter, Add to a new encounter, encounterFor, addToEncounter, encTarget, data-cenc, data-tenc, data-tgrpenc, Threats card, threatCardHtml, threatGroupCardHtml, Add to cast, castFromEntry, From the Codex, encounter Add section, packFilter, packGroups, Decision 182, Decision 188, Decision 190, W74, W75, W76*
     - **Decided:** **Add to <encounter>** shows on a cast member's page, an entry's page, a group's page and every Threats card. It goes to the encounter open on the Encounters tab if it hasn't ended, else the running one, else the newest planned one; with none it reads **Add to a new encounter** and makes a planned one. An entry card's **Add to cast** copies the entry and stays on the list. An encounter's **Add** searches the slotted packs' entries and groups (**From the Codex**). A refused add writes nothing. Nothing is stored.
     - **Why:** Ken, using S10: a button that vanishes reads as "it isn't there"; fetching a Codex row mid-fight was three taps out and back; five entries into the cast were five round trips (W74–W76).
     - **Rejected:**
       - 190's rule, the button only while one is open: it vanishes, and reads as missing (W75).
       - Asking which encounter on every press: two taps for the commonest act (190's own reason).
       - A card's Add to cast opening the copy, as the page's does: five entries, five round trips (W76).
       - The Codex search listing every entry before a word is typed: over a hundred entries bury the field on a tablet (SQ3).
     - **Replaces:** Decision 190 in part: Add to shows always, and with none open goes to the running encounter, then the newest planned, or a new one. 190 rejected the newest planned as invisible; the button names it, and the open one still comes first. It extends 182 (a card copies too).
     - **Revisit if:** a GM adds to the wrong encounter through the fallback, or W80's action rail gives these buttons one home.
     - **Built:** switched off (173); log 2026-10-XX.
```

**Supersession marks:** 190 gets *→ **Superseded in part by Decision 211** —
Add to <encounter> shows always; with none open it goes to the running
encounter, then the newest planned, or makes one.* Its INDEX line gets
*→ **superseded in part by 211***. If the ledger search at build time finds
another, stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **The fallback's order.** With none open on the Encounters tab: the running encounter, then the newest planned (by `created`, ties by list order), then a new one. An open encounter that has ended counts as none open | **As listed** (W75's own order, Ken 2026-10-08) | |
| SQ2 | **A card's Add to cast.** It copies the entry into the cast and **stays on the list**, with a notice (*Street Tough is in the cast.* ✎). The entry page's Add to cast still opens the copy with its name selected (190). Three Toughs from a card are three members all called *Street Tough*; the GM renames them on their pages | **Stays on the list** | |
| SQ3 | **When the Codex search lists anything.** From two characters, as Find does (208), with at most 25 results shown and *N more. Keep typing.* ✎ below them; before two characters it says *Type a name, a role or an origin.* ✎ | **Two characters, 25 shown** | |
| SQ4 | **What the Codex search covers.** Threats, people and groups in one list, entries first in pack order, then groups. A group's **Add** adds all its members, as its page's Add to does | **All three, one list** | |
| SQ5 | **The notice when a press makes an encounter.** *Gull is in a new encounter, Encounter 2026-10-09.* ✎ (a group: *Pier Watch: 4 added to a new encounter, Encounter 2026-10-09.*). The page stays; the Encounters tab lists it as planned | **As listed** | |

## 5. Read first

- `CLAUDE.md` whole: constraints 3, 7 and 8; *Decisions*; *Change tiers*.
- `docs/STATE.md` whole.
- The plan: §4h (encounters), §6 S10.
- `docs/SCHEMA.md` §4: Decisions **164**, **182**, **188**, **190**, **193**,
  **208** (Find's two-character minimum).
- `docs/WISHLIST.md`: **W74**, **W75**, **W76** (and **W77**/**W80** for what
  this does *not* do).
- **The code:** `engine.js`'s `runningEncounter`, `addEncounter`,
  `encounterTitle`, `_live`, `addParticipant`, `participantFromEntry`,
  `participantsFromGroup`, `castFromEntry`, `packEntry`, `packFilter`,
  `packGroups`; `gm.js`'s `encTarget`, `encAddBtnHtml`, `castPageHtml` and
  `bindCastPage` (`data-cenc`), `entryPageHtml`, `groupPageHtml` and
  `bindThreatPage` (`data-tenc`, `data-tgrpenc`, `data-tuse`),
  `threatCardHtml`, `threatGroupCardHtml`, `bindThreatCards`,
  `redrawThreatList`, `entryMetaText`, `encAddHtml`, `encPickHtml`, the
  `encQ` input handler, `bindEncounters`' `open` (what it clears), `notice`.

## 6. Out of scope

- **W77 and W80**: a bar or rail that keeps Back and Add to in reach while a
  long page scrolls. The buttons stay where they are; this only makes them
  always there.
- **Which encounter, chosen by hand** (a picker on the button). Rejected
  (§3).
- **Opening the new encounter** after **Add to a new encounter**. The page
  stays (190's *stays on the page*).
- **Add to cast on a group card.** A group isn't one person; its page has no
  Add to cast either.
- **Anything stored**: no `target` field, no remembered encounter. The
  fallback is computed on every draw.
- **The cast picker** (**From the cast**): unchanged.
- **Find (208)**: it doesn't gain Add buttons.
- **A table schema bump**: nothing's shape moves.

## 7. The shapes

Nothing stored changes. Table schema stays **0.11**.

**Engine:**

| Function | Does | On bad input |
|---|---|---|
| `encounterFor(t, openId)` | **new, read-only.** The encounter an Add to button means: `openId`'s if it exists and hasn't ended; else `runningEncounter(t)`; else the planned encounter with the latest `created`, ties to the earlier in the list; else `null` | a non-object `t`, a non-array `encounters`, a non-string `openId`: falls through the same rule; never throws |
| `addToEncounter(t, openId, src, packs)` | **new, the one writer behind every Add to.** `src` is `{ kind:"cast", id }`, `{ kind:"entry", pack, id }` or `{ kind:"group", pack, id }` (a pack id and an entry or group id). **In this order, writing nothing until the last step:** resolves `src` (cast: the member exists; entry: `packEntry(packs, pack, id)`; group: `packGroups(packs, {})` has it with a member); finds `encounterFor(t, openId)`; for a cast `src`, refuses *Already in.* if the member has a row there; **then**, if there's no target, makes one with `addEncounter(t, {})`; then adds through `addParticipant` / `participantFromEntry` / `participantsFromGroup`. Returns `{ ok:true, encId, ids:[…], made }`, `made` true when it made the encounter | refuses with the existing words: *No such cast member.*, *No such entry.*, *No such group.*, *Nobody in that group can be found.*, *Already in.*, and ✎ *Nothing to add.* for an unknown `kind`. **A refusal writes nothing**: no encounter made, `meta.updated` unchanged |

`encounterFor` is total and read-only (constraint 8). `addToEncounter` takes
`packs` (the UI passes `packsMemo`) so the engine resolves the pack itself;
the UI never hands it a pack object. The existing writers keep their
signatures and their callers.

## 8. The UI

All in `gm.js` and the CSS; tool voice; ✎ for a voice pass. **Built for a
tablet** (§1a): every control a tap, 44px.

**The target.** `encTarget()` becomes `Engine.encounterFor(S.table, S.encOpen)`.
`encAddBtnHtml(attr)` always renders a button: *Add to <encounterTitle>*, or
✎ **Add to a new encounter** when the target is `null`. Every Add to button
carries one shared marker (a suggestion: `data-encadd`) beside its own
attribute, so a press can relabel them all.

**Where it shows:**

- **A cast member's page**, **an entry's page**, **a group's page**: where
  it is now, always.
- **An entry card** in the Threats list: under the meta line, a row of two
  buttons, **Add to cast** and **Add to <encounter>**, wrapping at 390px. A
  **group card**: **Add to <encounter>** alone. Each has an `aria-label`
  naming the entry or group (*Add Street Tough to Dock fight* ✎, *Add Street
  Tough to the cast* ✎), since a list of twenty identical labels is no use
  to a screen reader. A tap on a button never opens the card (the existing
  `closest("button")` rule).
- **An encounter's Add section**, planned or running, with a pack slotted: a
  **From the Codex** toggle (`aria-expanded`) after **From the cast**,
  opening ✎ *Search the Codex* and its list, swapped in place as you type, as
  the cast picker's is. Each result: the name, a *Group* tag for a group, the
  meta line (`entryMetaText`, or a group's members as its card has them), and
  **Add** (`aria-label` *Add <name>*). With no pack slotted, the note reads
  ✎ *From the Codex: slot a pack in on Threats.* The toggle and its query
  are cleared with `S.encPick` and `S.encQ` wherever those are (opening an
  encounter).

| Press | The record | The view | Focus |
|---|---|---|---|
| **Add to <encounter>** (any page or card) | row(s) in that encounter | the page stays (no redraw); a notice as now (*Gull is in Dock fight.*, *Pier Watch: 4 added to Dock fight.*); every Add to button on the page relabelled to `encounterFor`'s answer now | the button pressed |
| **Add to a new encounter** | a planned encounter made, row(s) in it | the page stays; the SQ5 notice; **every Add to button on the page now reads *Add to <the new one>***, and the next press goes there (it's the newest planned, and none is open or running) | the button pressed |
| A card's **Add to cast** | a cast member copied from the entry (`castFromEntry`) | the list stays, its search and filters kept; the SQ2 notice | the button pressed |
| The entry page's **Add to cast** | as now | as now (opens the copy, its name selected) | as now |
| **From the Codex** | — | the search opens or closes | the search field when it opens; the toggle when it closes |
| Typing in *Search the Codex* | — | the list swaps in place (SQ3) | the field |
| A result's **Add** | row(s) in **this** encounter | the encounter redraws with the new row(s); the same notice as the entry page's | **the same result's Add** (an entry can be added again: a fourth Tough) |
| Any refused add | nothing | `notice(why)` | where it was |

The relabel is the carried-over point: after **Add to a new encounter**, the
next press must go to the encounter just made. It does, because with none open
and none running, the newest planned is the one just made, and the button
says so. A test pins it (§9).

**At width:** a card's buttons wrap under its meta line at 390px; an
encounter's long name wraps on the button; nothing scrolls sideways
(`scrollWidth` equals `clientWidth`).

## 9. Tests

**`tests/engine.test.mjs`**, *Adding to a fight (211)*:

- **`encounterFor`:** none → `null`; an open planned one wins over a running
  one; an open ended one falls through to the running one; with none open or
  running, the newest planned by `created`; two with the same `created`, the
  earlier in the list; only ended ones → `null`. Hostile: `t` a string,
  `encounters` an object, `openId` a number, an encounter missing `created`:
  nothing throws.
- **`addToEncounter`, each kind:** a cast member, an entry and a group into a
  planned target; the rows are the existing writers' (an entry row is
  `kind:"entry"`, a group adds every member), and `t.cast` is unchanged for an
  entry or group (188).
- **Making one:** with no target, an entry's add makes one planned encounter
  with the row, `made:true`; **a second add goes to the same encounter**
  (`encId` equal), `made:false`, and the table has one encounter.
- **Refusals write nothing:** an unknown cast id, an unknown entry, an unknown
  group, a group with no member found, `kind:"x"`, and *Already in.* for a
  cast member already in the target: `ok:false`, the `why`, and the table
  deep-equal to before (no encounter made, `meta.updated` unchanged). Run
  each with **no** encounter in the table too, so a refusal is shown not to
  make one.
- **190's open-first rule kept:** an open planned encounter and a newer
  planned one: the open one gets the row.

**`tests/smoke.test.mjs`**, switched on:

- **The two pins** (pre-flight): `:5024` now asserts **Add to Second** with
  none open; `:5083` now asserts **Add to a new encounter** with only an ended
  one. Change their messages to match; nothing else in those tests.
- **Always there:** with no encounter at all, a cast member's page, an entry
  page and a group page each read **Add to a new encounter**. A press makes
  one (the Encounters tab lists it, planned); the button now reads *Add to
  Encounter <date>*, focus still on it, and a second press adds to it (one
  encounter, two rows).
- **Cards:** an entry card has **Add to cast** and **Add to <encounter>**, a
  group card **Add to <encounter>** only; a press adds without opening the
  card (`S.threatOpen` stays `null`) and keeps the search typed; three presses
  on one card give three rows numbered *Gull*, *Gull 2*, *Gull 3*. A card's
  **Add to cast** adds a member, `S.tsection` stays `"threats"`, and the
  notice names them. After a search redraws the list, the buttons still work
  (bound by `bindThreatCards`).
- **From the Codex:** on a planned encounter with a pack, **From the Codex**
  opens a search with focus in it; one character lists nothing and says so;
  *gu* lists the Gull entry and the group containing it; **Add** on Gull adds a
  row to this encounter and focus is back on Gull's **Add**; **Add** on the
  group adds every member. With no pack, the note's words. Opening another
  encounter closes the search.
- **Relabel in place:** on an entry page with none open, press **Add to a new
  encounter**: the page wasn't redrawn (the same button element), and its
  label changed.
- `app.errors` empty throughout.

**`tests/hostile.test.mjs`:** an encounter named `<img onerror>` as the
target, and a pack entry and group named the same: the card buttons, their
`aria-label`s and the Codex search's results render the names as text; no
`img` in `#main`.

**Mutation-test** (record each in the PR with the test that actually caught
it). Check each for a second path first:

1. **`addToEncounter` makes the encounter before resolving `src`** → the
   refusal test's "no encounter made".
2. **`encounterFor` ignores `openId`** (running, then newest planned only) →
   *190's open-first rule kept*, and smoke `:5049` (*Add to First*).
3. **`encounterFor` picks the oldest planned** → the newest-planned test, and
   the smoke pin at `:5024`.
4. **The relabel skipped** (the button keeps *Add to a new encounter* after
   the press) → *Relabel in place*.
5. **A card's Add to cast opening the copy** → the card test's `S.tsection`.
6. **The Codex result's Add going through `encounterFor` instead of this
   encounter** (with another encounter running) → add a smoke case: a running
   encounter elsewhere, a planned one open; **Add** from the open one's Codex
   search lands in the open one.

## 10. Steps

`git submodule update --init private`; `npm run verify` before starting and at
the end; the targeted test files after each step.

1. Confirm 211 is free on `origin/main`. Search the ledger again for the
   pre-flight's names.
2. **The engine:** `encounterFor`, `addToEncounter`, exported; their tests.
3. **The target:** `encTarget` through `encounterFor`, `encAddBtnHtml` always
   rendering, the three pages' handlers through `addToEncounter`, the relabel;
   the two smoke pins and the always-there tests.
4. **The cards:** the buttons on entry and group cards, bound in
   `bindThreatCards`; the card tests.
5. **From the Codex:** the toggle, the search, its list, its Add; the tests.
6. **Hostile** test; the CSS for the card row.
7. **In the browser** (`shadows-dev-preview`, `?gm=on`, a pack slotted): no
   encounter, **Add to a new encounter** from a cast member's page, then from a
   card; check one encounter with both rows. Open another encounter, back out,
   and check the cards name the running or newest planned. **From the Codex**
   inside a running encounter: add an entry twice and a group. Then **390px**
   (card buttons wrap; `scrollWidth` equals `clientWidth`), **768 × 1024**,
   **1300px**. `npm run phone-check`.
8. The mutations (§9).
9. Ledger (211, 190 marked), INDEX, the plan, STATE, W74–W76 to
   `log/wishes-granted.md`, docs, close-out (§12).

## 11. Stop and ask

- 211 is taken.
- The ledger search finds a decision 211 overrides that the pre-flight
  doesn't name.
- Any existing test needs a change beyond the two pins the pre-flight names.
- A caller of `encTarget` or `encAddBtnHtml` that the pre-flight doesn't list.
- `addToEncounter` can't refuse a case before writing without changing an
  existing writer's signature.
- A card's buttons don't fit at 390px without scrolling sideways, and the fix
  is more than their own CSS.
- The voice test flags any of the new copy.
- The decision goes over 350 words.

## 12. Close-out

*Rule or shape* tier, switched off:

- **SCHEMA:** 211; 190's mark. No §3 change (nothing stored).
- **INDEX:** 211's line under **GM mode**; 190's line marked.
- **STATE:** §1's GM clause gains *Add to an encounter always on screen, the
  Codex searchable inside one, and Add on a Threats card (211)*; what's next.
- **The plan:** §6 S10 gains S10e (built, 211); the build-order table gains
  S10e.
- **Wishlist:** W74, W75 and W76 move whole to `log/wishes-granted.md`, each
  heading pointing at *→ Decision 211 (switched off)*.
- **`changelog-pending.md`:** ✎ *Add anyone to a fight from wherever you
  are: every cast member, Codex entry and Threats card names the encounter
  it goes to, or starts a new one, and an encounter searches the Codex
  itself.*
- **Log** entry (why one writer behind every Add to; that nothing is stored);
  **shipped** row *(switched off)*; README's table: S10e's row.
- **PR** titled `feat(gm): Add to a fight from anywhere, switched off (S10e,
  Decision 211)`. Body: what changed; the mutations; the browser check;
  **Where the order didn't fit**.

## 13. Review checklist

- [ ] **In the browser, by the orchestrator:** with no encounter, **Add to a
      new encounter** from a page and then a card lands both rows in **one**
      encounter; the label changes in place; a card press doesn't open the
      card; **From the Codex** adds an entry twice and a group, focus on the
      same Add.
- [ ] A refused add makes no encounter and leaves `meta.updated` alone.
- [ ] An open encounter still wins over the running and the newest planned.
- [ ] Only the two pinned smoke assertions changed in existing tests.
- [ ] 390px: card buttons wrap; nothing scrolls sideways.
- [ ] 190 marked; no table schema bump anywhere.
- [ ] Two mutations re-run locally.
