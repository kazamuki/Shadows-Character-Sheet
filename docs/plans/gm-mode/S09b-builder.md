# Work order S9b — The builder: a cast member's page that reads the pack

**Plan:** [`../gm-mode.md`](../gm-mode.md) §2, §4e, §6 *S9*, GQ6, GQ16,
GQ17, GQ21 (new).
**Status:** drafted 2026-10-06 by Claude (Opus), after #119 (S9a) merged
with its fix round: the first order drafted under the README's step 7.
**§4 answered by Ken, 2026-10-06**, every default but SQ9's placement detail (below). Approved to build.
**Branch:** from `main` at or after `fb2706a`, PR to `main`, switched off
(Decision 173).
**Runs alone.** It touches `engine.js`'s Packs section, `gm.js`, the CSS,
the ledger, the pack schema, SCHEMA §3 and STATE.

**What S9b is.** The plan's S9 builder line is "origin, NPC role, enemy role
and tier; origin modifiers applied at construction; the tier's ranges shown
beside each stat, and a warning (never a block) outside them; the trait
budget counted; traits picked from the glossary or written." The pre-flight
changed three parts of that (below), and the order is written against what
the pre-flight found:

- **The builder is the cast member's page.** A cast member is already one
  record from a napkin to an Apex (§4e), with a page that edits every field
  and the stat block. Use (182) already makes a copy to reskin, which is the
  Codex's first advice. Building from scratch is the same page with the
  book's guidance beside it. No second editor.
- **Origin modifiers are shown beside each stat, not applied.** See the
  pre-flight and SQ2.
- **The tier's guidance is shown as the book's words, never as a warning.**
  The book's own entries break its tier table (pre-flight, GQ21).

S9c (the real Codex pack, built in `private/`) follows. Its shape has to be
complete when S9b merges: S9c is content.

**Carried over from S9a's review** (#119, one fix round, six fixes; the
first four were the order's):

- **Label each kind of a value that looks like another.** The entry page
  read *Spire · Lookout · Bruiser*, and nobody could tell the NPC role from
  the enemy role. Here: a modifier says whose it is (*Street +1*), a guide
  says which tier (*Tier 3:*), and a count names its kinds.
- **Count what the GM counts.** *2 members* for 3× Gull + 1× Wren was a
  count of kinds, read as a headcount. Here: the trait count names its
  kinds and its total.
- **The first useful thing is above the fold at 390px.** Four stacked
  filters pushed the Threats list off the first screen. Here: the
  picker's list starts on the first screen; §8 says how to measure it.
- **A pack field nothing reads shouldn't exist.** Tier names were gated,
  stored and never shown. Every field 183 adds has a reader in this order.
- **Back names where it goes, and goes there**, keyed by an id (S9a's
  *Back to Vinnie*). The picker is a modal, so its "back" is Cancel and
  Escape, and focus returns to the button that opened it.
- **`gm.js` may add a tip kind to `TIPS`, never replace one.** A test
  guards it (engine.test.mjs, *the script-scope guard*). If S9b adds a tip,
  it's a new kind.

From the build itself (*Where the order didn't fit*):

- S9a's order had a Codex word in its synthetic pack. **This order's
  synthetic names were grepped against all of `private/crb/`**: *Salt
  Nerve*, *Pier Legs*, *Gull's Cry*, *Rope Trick* and *High Wire* have zero
  hits. The other names (Dock, Spire, Slight, Middling) are the existing
  fixture's.
- **A top-level name in `gm.js` can silently replace one in another
  script** (`openEntry`). Every function this order names was grepped
  across `src/ui/` and `src/engine/`: `castGuide`, `castPackMatch`,
  `packTraits`, `openTraitPicker`, `traitPickerHtml`, `castRoleToggles`
  are all free. Check any other name you add.
- `docs.test.mjs` reads only a supersession mark's first `by` clause, so a
  second supersession is merged into one mark (*in part by Decisions N
  and M*). This order supersedes nothing, but if that changes, merge.

**Pre-flight** (README, *The pre-flight*), against `main` at `fb2706a`:

- **The tier table against the book's own entries.** A script over
  `private/crb/Threat_Codex_Intro_Human.md` read each entry's tier, its
  eight stats and its traits' kinds (from the Trait Glossary):
  - **Stats.** Tier 3's "All stats 5–8" is broken by 13 of the 17 Tier 3
    entries, most often MAG 4. Several Tier 2 entries have INT 3, under
    "most stats 4–6".
  - **Signatures.** One Tier 1 entry has a Signature ("no Signatures"), and
    10 of the 17 Tier 3 entries have three or four ("1–2 Signatures").
    The audit has no trait column, so these counts are the mirror's.

  **Rechecked 2026-10-06 against Scott's newer Stat Audit**
  (`Threat_Codex - Stat Audit.xlsx`, 2026-10-03, which holds every
  entry's current stats and tier): 14 of the 17 human Tier 3 entries sit
  outside the table's band, 3 of 19 at Tier 2, and so do all 18 of the
  supernatural Tier 3 drafts. A range warning would fire on most of the
  book: the same finding as TOL's formula (175). So the guidance is shown
  as the book's words, and the plan gains **GQ21**, which Ken answered with SQ3: the table is a guide. The script
  is the order's, not the build's. Rerun it in the review if the mirror
  changes.
- **The mirror is behind Scott's Codex.** The audit lists the roster's
  TOL at its formula (Director Chen 5, Juno Park 3) where the mirror still
  prints 3 and 2, and its review register cites a compiled
  `Shadows_Threat_Codex_Complete_v1_1` the mirror doesn't have. Nothing in
  S9b reads the Codex's numbers (the tests use the synthetic pack), so
  S9b doesn't wait on it. S9c does: it builds from the compiled file.
- **GQ6 looks answered by the audit**, not by a ruling: TOL is the formula
  (an override allowed: the supernatural Wight's is fixed at 0), and WILL
  is a floor (above it allowed, below it "an error"). That meets 175's
  *Revisit if*. It changes what the block shows for TOL and WILL, not what
  S9b builds, so it's SQ9, not part of this order.
- **The supernatural review copy** (sections 08–14, 58 entries, "nothing
  in this file is approved") adds an Order and a case (Bound, Changed,
  Other) to each entry, and Order traits per section. GQ17 is still open,
  so 183 doesn't add them. It's a pack schema bump of its own in S12. The
  copy does treat the trait budget as binding (*Shown with a Syndicate
  origin to stay within the trait budget*), which is for GQ21.
- **The Codex's shape** (README step 5's new check, done here first):
  - The roster's Push Profiles are prose with references (*EG-04*,
    *Entry 11*), held by `ifPushed` as text. Linking them is S10's.
  - The Patron's origin is "Variable": `origin` null.
  - The glossary's traits each have a kind (Universal, Origin, Signature)
    and, for Origin traits, an origin.
  - The modifiers are three whole numbers per origin, on the data's stat
    ids.
  - The tier table has a stat profile and a trait line per tier: two pieces
    of text.

  Everything S9c needs is in 183's shape.
- **The cast page saves as you type and doesn't redraw** (`bindCastPage`:
  `tableChange(…, false)`). The figures beside the stats are rewritten in
  place by `castFigures(main, n)`. Guidance follows that pattern exactly
  (`castGuide`): typing an origin must not redraw the page, or the caret
  jumps.
- **`<datalist>` is already the precedent** for "pick or type" (179's
  `crew-names`). It suits single values (origin, enemy role). It does not
  suggest after a `/` in a list field, so NPC roles get toggles (SQ8).
- **Trait rows are keyed by index** (`data-ctname="${i}"`). The existing
  Add focuses the new row by index straight after adding, and traits never
  reorder, so the picker's add does the same. S9a's id rule is about targets
  after a redraw that can reorder; this one can't.
- **`_int`** takes a signed whole number (or a string of one), **`_tier`**
  only ≥ 1. Modifiers use `_int`; a zero is dropped.
- **180 said a pack's unknown keys are "kept, never read"**, and S9a's
  order said a `traits` section "rides along unread". A 0.1 pack could carry
  one, in any shape. 183's gate reads it on every load like any other
  section, so the 0.2 step only stamps.
- **The ledger** (Decision 130), searched by name: *trait*, *glossary*,
  *modifier*, *builder*, *tier*, *budget*, *datalist*, *picker*, *warning*,
  *origin*. Hits:
  - **139** (tips, `Engine.glossary`: the *character's* glossary, not
    reused, since a pack's traits live in the pack);
  - **164** (`keepPlace`: the picker's list redraw keeps its place);
  - **174** (the cast's text until a pack names it: built here, unchanged);
  - **175** (the block's shape: unchanged; its *Rejected* "a warning under
    the formula" is the precedent 184 follows);
  - **176** (no undo on the table: why nothing is applied to stats);
  - **179** (rejected origin and role pickers on the Cast list: "three more
    pickers on a phone cost more than they find". Still true, so the Cast
    list gains no filters here);
  - **182** (Use's copy, and matching moved to S9b);
  - **180** (the pack's gate, extended by 183).
- **Decisions 183, 184, 185** are free on `origin/main`. Check again before
  pasting.

---

## 1. Goal

A GM building an NPC, from a Use copy or from a quick-added name, **has the
book open beside the stat block**. They pick an origin, roles and a tier
from the pack's own words, or type their own. Beside each stat they see
what the origin does to it, above the stats what the tier's stats look like
in the book, and by the traits what the tier's traits look like. They add
traits from the glossary in two taps, and see how many of each kind they
have. Nothing they type is changed, and nothing tells them they're wrong.

**Done when:**

- Switched off: nothing changes anywhere.
- With no pack slotted in, a cast member's page is exactly as it was: no
  lists, toggles, guidance or *Add from a pack*.
- With a pack: **Origin** and **Enemy role** offer the pack's names as you
  type, and still take anything. **NPC roles** shows a toggle per pack role
  under the text field. Pressing one adds or removes it from the field's
  list, and typing in the field updates which are pressed.
- A matched origin shows its modifiers beside each stat it changes
  (*Street +1*). A matched tier shows its stat guide above the stats and its
  trait guide by the traits. A matched enemy role whose tier differs from
  the member's says so (*A Brute is usually Tier 2*, GQ16). Changing any of
  those fields updates the guidance and nothing else: focus and caret stay
  put.
- **Add from a pack** opens a picker over every slotted pack's traits
  (search, kind, origin), each with its text. **Add** copies the trait into
  the block, closes, and puts focus in the new trait's name. The search and
  filters are there next time.
- By **Traits**: *4 traits: 1 Universal · 1 Origin · 2 Signature*, a name
  no glossary has counted as *written*. Renaming a trait updates the count
  as you type.
- No modifier is ever added to a stat, nothing about a match is stored on
  the member, and no warning appears anywhere.
- A 0.1 pack reads as 0.2: no traits, modifiers or guides, and nothing
  else changed. A hostile pack's traits, modifiers and guides come out
  valid or dropped, and render as text.
- Removing the pack leaves every member exactly as typed. The page shows no
  guidance.
- The Threats tab's cards label NPC roles as the entry page does (*NPC
  role: Lookout*), a leftover from S9a's review.
- `npm run verify` and `npm run phone-check` pass; the member page and the
  picker checked at 390px and 1300px.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (the pack's shape; a player-facing behaviour
  someone could reasonably choose otherwise, three times).
- **App:** no bump (switched off). One line to `changelog-pending.md`.
- **Game data, character schema, table schema:** unchanged. No character
  observes a pack (68). The cast member's shape is unchanged: 184 and 185
  store nothing new.
- **Pack schema:** **0.1 → 0.2** (183), with a `migratePack()` step.
- **Reserved:** Decisions **183, 184, 185**. No F-flag. **GQ21** added to
  the plan's §9.

## 3. The decisions, drafted

Paste after 182, under INDEX §3's **GM mode** heading, filling **Built**.
**Count each with `wc -w` after filling Built**; the cap is 350. If one
goes over, trim its *Why*, not a *Rejected* line.

```
183. **A pack carries its trait glossary, each origin's stat modifiers and each tier's guidance in the book's words; pack schema 0.2.**
     *2026-10-0X · Ken + Claude · Touches: pack schema 0.2, migratePack, traits, trait kind, origins.modifiers, tiers.statGuide, tiers.traitGuide, enemyRoles.tier, Decision 180, GQ10, GQ16, GQ21*
     - **Decided:** Pack schema 0.2 adds `traits: [ { id, name, kind, origin, text } ]` (`kind` universal, origin or signature, else null; `origin` an origins id or null), `origins[].modifiers` (`{ <stat id>: whole number }`, the data's stats only, zeros dropped) and `tiers[].statGuide` and `traitGuide`, text. `migratePack()` gates each as 180 does. A 0.1 pack reads with none of them. Enemy roles' `tier` is read for the first time (184).
     - **Why:** the builder (184, 185) needs the glossary, the modifiers and the tier's words, and S9c's pack must hold them with no app change. Numbers where the book prints numbers; words where it prints a judgement.
     - **Rejected:**
       - Tier ranges as numbers (a low and high per stat, a trait count) so the app could warn: the book's entries break them (14 of 17 Tier 3 entries have a stat outside the band; 10 have more Signatures than allowed), so the numbers would be our reading, not the book's (GQ21).
       - A trait's kind stored on the block when copied: the table would carry pack words, and a renamed trait would keep a kind it no longer has (185).
       - The glossary as a separate file: a pack is the book, and the traits are in it.
     - **Replaces:** nothing. 180's unread `traits` key is now read.
     - **Revisit if:** the tier table becomes a rule the entries keep (GQ21 answered it as a guide), or GQ17's Orders need modifiers, a case or a trait kind of their own.
     - **Built:** pack schema 0.2; PR #__; log 2026-10-0X.

184. **The builder is the cast member's page reading the packs by name: it offers their origins, roles and tiers, and shows each one's guidance beside the block, never applying it and never warning.**
     *2026-10-0X · Ken + Claude · Touches: builder, cast member page, origin, npcRoles, enemyRole, tier, datalist, role toggles, Engine.castPackMatch, castGuide, origin modifiers, statGuide, traitGuide, Decision 174, Decision 175, Decision 176, Decision 182, GQ6, GQ16, GQ21*
     - **Decided:** Origin, NPC roles and enemy role stay the GM's text (174). The page offers every slotted pack's names for each (a list to pick from; roles as toggles beside the text) and matches what's typed by name, case-folded, as it reads. A matched origin's modifiers show beside each stat (*Street +1*), a matched tier's `statGuide` above the stats and `traitGuide` by the traits, and an enemy role whose tier differs from the member's says so. Nothing is applied to the block, nothing about a match is stored, and nothing warns.
     - **Why:** the Codex's first advice is to reskin, and Use (182) already makes the copy; building from scratch is the same page with guidance. A block stores what the book prints (175), and a copied entry's modifiers are already in it.
     - **Rejected:**
       - A builder screen: a second editor for one record.
       - Applying an origin's modifiers when it's chosen (the plan's sketch): a block can't tell a fresh stat from a printed one, and a table has no undo (176) to take it back.
       - A warning outside the tier's guidance: the book breaks it (183, GQ21), as TOL broke its formula (175).
       - Storing the matched pack's id on the member: the cast is the GM's and outlives the pack (182).
     - **Replaces:** nothing. It builds what 174 deferred and 182 moved here.
     - **Revisit if:** the tier table becomes a rule the entries keep (GQ21), GQ17 adds Orders, or a GM asks for the modifiers applied.
     - **Built:** as 183.

185. **A trait from a pack is copied into the block as its name and text, and the page counts the block's traits by kind, matching each name to the glossaries as it reads.**
     *2026-10-0X · Ken + Claude · Touches: traits, block.traits, Add from a pack, trait picker, Engine.packTraits, trait kind, trait count, traitGuide, Decision 175, Decision 182, S13*
     - **Decided:** The block's Traits gain **Add from a pack**: a picker over every slotted pack's traits, by search, kind and origin, each with its text. Adding copies `{ name, text }` into the block (175's shape) and closes; the search and filters stay on `S`. By Traits the page counts them by kind (*4 traits: 1 Universal · 1 Origin · 2 Signature*); a name no glossary has counts as *written*, a renamed copy included.
     - **Why:** traits are text the GM applies (rule 6), and the copy is the GM's to edit, as Use's is. Reading the kind by name keeps pack words out of the table and stays right after an edit.
     - **Rejected:**
       - A stored reference to the pack's trait: the pack lives outside the table (182), and an edited trait would keep a kind it no longer has.
       - The glossary as a fourth view on the Threats tab now: gathering the references is the GM screen's (S13).
       - A picker that stays open for several adds: the next thing a GM does is read or trim what they added.
     - **Replaces:** nothing.
     - **Revisit if:** S13's GM screen wants the glossary as a page, or S10's fight needs a trait's kind.
     - **Built:** as 183.
```

**Supersession marks:** none. 174 and 182 are built on, not overridden.
If the ledger search at build time finds otherwise, stop and ask.

## 4. Questions for Ken

Answered by Ken, 2026-10-06. Each row keeps the default it offered.

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **The builder is the cast member's page** with the pack's guidance beside it, not a screen of its own? | **Yes.** One record, one editor; Use already makes the copy a GM reskins | **Yes** |
| SQ2 | **Origin modifiers shown beside each stat, never applied** (the plan said "applied at construction")? Applying can't tell a printed stat from a fresh one, a Use copy already has them, and the table has no undo | **Shown, not applied** | **Shown** |
| SQ3 | **The tier's guidance as the book's words, no warnings**, and GQ21 to Scott (the book's entries break its own table)? | **Yes** | **Words, no warnings.** The table is a general guide, a place to start looking for the power you want; the GM overrides it as the story needs (Ken, which also answers GQ21) |
| SQ4 | **A trait's kind is read by name** each time (a renamed copy counts as *written*), rather than stored on the trait? | **By name**; nothing new stored | **By name** |
| SQ5 | The picker **closes on Add** with focus in the new trait, or **stays open** for several adds? | **Closes.** The GM reads or trims what they added; reopening keeps the search | **Closes** |
| SQ6 | **The glossary only inside the picker**, or also a **Traits** view on the Threats tab? | **Picker only.** References gathered on one screen are S13's | **Picker only**; references gathered on one screen later (S13) |
| SQ7 | **Rename Use** now (S10 adds "into a fight", so one verb would lead two places)? | **Not now.** S10 designs both buttons together; the plan's S10 gets a line saying so | **Not now**; picked up with S10's fight |
| SQ8 | **NPC roles as toggles** under the text field (a datalist can't suggest after a `/`), or a datalist for the first role only? | **Toggles**, nine at most, wrapping | **Yes** |
| SQ9 | **GQ6 looks answered by Scott's Stat Audit** (TOL the formula, with an override; WILL a floor, below it an error). Confirm with Scott and change what the block shows (175) in a small session of its own, or fold it into S9b? | **Confirm with Scott first, then its own session.** S9b stays as drafted | **The formula, with an override** (Ken: what Scott has been working with). GQ6 is answered; the change to the block is its own session after S9b, not this order |

## 5. Read first

- `CLAUDE.md` whole: constraints 7, 8, 9, 10; the versions table (the
  pack schema row); tiers; Decisions; voice.
- `docs/STATE.md` whole.
- The plan: §2 (the rows on origins, roles, tiers, pre-built threats), §3
  rule 6 (traits are text), §4e, §6 *S9*, GQ6, GQ16, GQ17, GQ21.
- `S09a-pack.md` §7 (the pack's shape) and §8; `S08a-cast.md` §8 (the
  member's page).
- `docs/SCHEMA.md` §3's *pack file* block; Decisions **174**, **175**,
  **176**, **179**, **180**, **182**.
- **The patterns to copy:**
  - `engine.js`'s Packs section: `migratePack`, `_packSection`,
    `_recordId`, `packFilter` (folded names across packs, pack order),
    `packChoices`, `packEntry`; the Tables section's `_int`, `_tier`,
    `_str`, `_folded`.
  - `gm.js`: `castPageHtml`, `castStatBlockHtml`, `castFigures` (in-place
    figures: the model for `castGuide`), `bindCastPage` (`tableChange(…,
    false)`, the `rows()` add-and-focus helper), `castInteractionsHtml`'s
    `<datalist>`; the Threats tab's list, filters and empty state
    (`threatsTabHtml`, `threatListHtml`, `redrawThreatList`).
  - `shared.js`: `openModal` (`returnTo`, `onClose`), `keepPlace`, `esc`,
    `attrSel`, `notice`.
- Tests: `engine.test.mjs`'s *Packs* block and *the script-scope guard*;
  `hostile.test.mjs`'s `hostilePack`; `smoke.test.mjs`'s Decisions 180–182
  blocks; `tests/packfixture.mjs`.
- **Not** `private/` for content. The tests use the synthetic pack.

## 6. Out of scope

- The real Codex pack and any tool that builds one (S9c).
- Applying modifiers; tier ranges as numbers; any warning.
- Orders and the Bound/Changed/Other rules (GQ17, S12).
- The Origin Matrix concept grid (GQ5).
- Origin or role filters on the Cast list (179 rejected them).
- Push Profiles as links; Use into a fight; renaming Use (S10).
- A glossary page or tab (S13). Tips on trait names in an entry's page.
- Any change to the cast member's or block's stored shape; any table
  schema bump.
- Any edit to `shared.js`, `sheet.js`, `app.js` or `wizard.js`.

## 7. The shapes

**The pack, schema 0.2** (additions to S9a's 0.1; SCHEMA §3 updated, with
synthetic examples only):

```js
origins: [ { id, name, text,
             modifiers: { BOD: 1, MOB: 1, INT: -1 } } ],   // the data's stat ids; whole numbers; zeros dropped
tiers:   [ { id, name, text,
             statGuide: "",                                  // the book's stat profile for the tier, as text
             traitGuide: "" } ],                             // the book's trait line for the tier, as text
traits:  [ { id,                                             // record id, as every section's
             name, text,
             kind: "universal",                              // "universal" | "origin" | "signature", else null
             origin: null } ],                               // an origins id, or null
// enemyRoles[].tier (0.1) is now read: "a Brute is usually Tier 2"
```

**`migratePack()`**, additions:

- **Step 0.2:** stamps only. A 0.1 pack's sections go through the same
  every-load gate, a `traits` key included. Say so in a comment. A mutation
  that removes the step is moot; don't run it.
- `origins[].modifiers`: kept only if an object. Each key kept only if it
  is a `D.stats` id (BOD … EMP, read from the data, never listed in code),
  its value through `_int`, a zero or null dropped. Not an object → `{}`.
  `__proto__` as a key does nothing.
- `tiers[].statGuide`, `traitGuide`: `_str`.
- `traits`: `_packSection` with `_recordId`. Each: `name` and `text`
  `_str`; `kind` lower-cased and kept if one of the three, else null;
  `origin` kept if it names an origin in this pack, else null. Unknown keys
  kept.
- Idempotent; total; `PACK_SCHEMA_VERSION = "0.2"`.

**Engine** (Packs section, every reader total):

```js
Engine.packTraits(packs, { q, kind, origin })  → [ { pack, trait } ]
  // packs in the order given, traits in each pack's order
  // q: name and text, case-folded; kind: one of the three or ""; origin: a name, case-folded (two packs' "Dock" are one)
Engine.castPackMatch(packs, member) → {
  origin:    { pack, rec } | null,                       // folded name; the first pack (in list order) with a match
  npcRoles:  [ { name, pack, rec } ],                    // one per member role; pack and rec null when unmatched
  enemyRole: { pack, rec } | null,
  tier:      { pack, rec } | null,                       // by id, in the first pack that has it
  traits:    [ { name, pack, rec } ],                    // one per block trait, in block order; unmatched null
  counts:    { total, universal, origin, signature, written }   // written: no glossary match (or a match with kind null)
}
  // member null, junk, or with no block: every field empty, counts all 0. Never throws.
Engine.packChoices(packs)   // gains traitOrigins: the origin names any trait carries, A–Z, as the others
```

**Nothing new on the table.** `castPackMatch` is read on every draw and
every guidance update. Nothing it returns is written anywhere.

## 8. The UI

All in `gm.js` and the CSS. GM-facing tool voice; drafts marked for a voice
pass.

**The member's page** (`castPageHtml`), with any pack slotted in:

- **Origin**, **Enemy role:** each input gets a `list` pointing at a
  `<datalist>` of `packChoices`' names. Free text still works.
- **NPC roles:** the text field stays. Under it, a wrapping row of toggle
  buttons, one per pack NPC role (`packChoices.npcRoles`), `aria-pressed`
  when the member's list has it (folded). Pressing one adds the pack's
  spelling to the list or removes the matching entry, saves, and rewrites
  the field's value as `a / b`. Typing in the field updates which are
  pressed, without a redraw. The row has a group label (*Roles in the
  pack*).
- **Tier:** beside the field, the matched tier's name (*Middling*) as a tip
  with its text (a `packrec` term on `tiers`, S9a's fix 4), and, if the
  enemy role matched and its `tier` differs, *A Bruiser is usually Tier 1*.
- **The stat block:**
  - Beside each stat's bonus figure, the matched origin's modifier, named:
    *Dock +1*. Empty when none.
  - Above the stats, *Tier 2: <statGuide>* when the tier matches and the
    guide has text.
  - Under **Traits**, the count line (below), then *Tier 2: <traitGuide>*.
- **`castGuide(main, n)`** rewrites all of that in place, as `castFigures`
  does: on load, and on input in Origin, NPC roles, Enemy role, Tier, and
  any trait's name. It never calls `update()` or `renderTable()`.
- **The count line:** *4 traits: 1 Universal · 1 Origin · 2 Signature ·
  1 written*. Only the kinds present, in that order. With no traits,
  nothing.
- **Add from a pack** (`data-ctpick`), beside **Add a trait**, only when a
  slotted pack has traits.

**The picker** (`openTraitPicker(n)`, through `openModal`):

- Title *Add a trait*. Search (`S.traitQ`), **Kind** (*Any*, Universal,
  Origin, Signature), **Origin** (*Any*, then `packChoices.traitOrigins`),
  all on `S` for as long as the table is open. Filters sit two to a row at
  phone width, search full width (S9a's `.threat-filters` pattern).
- A row per trait: its name; a meta line, *Signature · Dock*, plus the pack's
  name when more than one is slotted; its text, wrapping; **Add**
  (`aria-label="Add <name>"`).
- Typing or choosing a filter redraws only the list. The search keeps its
  caret (`keepPlace`, 164).
- Empty: *Nothing matches.* and **Clear the filters**. A pack with no
  traits: the button isn't there (above).
- **Add:** copies `{ name, text }` through the existing block helper,
  closes, and focuses the new trait's name field. The count updates.
- Cancel or Escape: closes, focus on **Add from a pack**.

**The Threats tab** (a leftover from S9a's review): `entryMetaText` labels
roles as the entry page does: *NPC role: Lookout · Enemy: Bruiser*.

**Where things land:**

| Press | The record | The view | Focus | Reachable after |
|---|---|---|---|---|
| Origin picked from the list, or typed | `origin` = the text | The page; modifiers beside the stats | Stays in Origin, caret kept | — |
| A role toggle | `npcRoles` ± the pack's spelling | The field shows the list | Stays on the toggle | Field and toggles agree |
| Tier typed | `tier` | Tier name, guides, the role's-tier note | Stays in Tier | — |
| **Add from a pack** | — | The picker | Its search | — |
| **Add** on a trait | `block.traits` + `{ name, text }` | The page; count updated | The new trait's name | The trait is a normal row: edit, remove |
| Cancel or Esc in the picker | — | The page | **Add from a pack** | — |
| Remove on a copied trait | the row gone | Count updated | **Add a trait** (as now) | — |
| The pack removed, the page reopened | Nothing changes | The page, no guidance, no toggles or lists | — | Every typed field and trait as it was |

**What each interaction must do:**

- Keyboard only: Origin → pick from the list → NPC role toggles → Tier →
  **Add from a pack** → search → **Add** → rename the trait. Focus is
  never on `<body>`.
- At 390px: the toggles wrap; nothing scrolls sideways; a modifier beside a
  stat wraps under it rather than widening the grid. In the picker, **the
  first trait's row starts within the first screen**: measure the first
  row's `getBoundingClientRect().top` against `innerHeight`.
- Long trait names, texts, guides and pack names wrap.

**`changelog-pending.md`**, a fifth line:

> - **Build from the book.** With a pack slotted in, a cast member's page
>   offers its origins, roles and tiers, shows what each means beside the
>   stat block, and adds traits straight from the glossary.

## 9. Tests

**`tests/packfixture.mjs`** gains, in `syntheticPack()`:

- `origins`: Dock `modifiers: { BOD: 1, REF: -1 }`, Spire `{ MOB: 1 }`.
- `tiers`: Slight and Middling, each with a `statGuide` and `traitGuide` of
  invented words.
- `traits`: *Salt Nerve* (universal, no origin), *Pier Legs* (origin,
  Dock), *Gull's Cry* (signature, Dock), *Rope Trick* (origin, Spire),
  each with text, in that order (not A–Z).
- Bump the fixture's `packSchemaVersion` to `"0.2"`. Keep a 0.1 copy for
  the step test.

`tests/engine.test.mjs`, *Packs 0.2 and the builder (Decisions 183–185)*:

- `migratePack` over junk: `modifiers: "x"` → `{}`; `{ BOD: "2", XYZ: 3,
  MOB: 0, REF: 1.5, __proto__: … }` → `{ BOD: 2 }`; `traits: [null, 5, {},
  { id: "bad id!" }, two with one id]` → one; `kind: "SIGNATURE"` →
  `"signature"`, `"weird"` → null; `origin: "nowhere"` → null; guides `5`
  → `""`. Idempotent; `({}).pwn` undefined.
- A 0.1 pack → stamped 0.2, every other field byte-identical; a 0.1 pack's
  ad-hoc `traits` key goes through the gate.
- `packTraits`: each filter; `q` over name and text; folded origin across
  two packs; pack order, not A–Z.
- `castPackMatch`: folded matches (`" dock "` → Dock); a role list with
  one matched and one not; tier by id; the first pack wins when two match;
  counts by kind with a written one and a renamed copy; member `null`,
  `"x"`, `{ block: "x" }` → empty, no throw.
- **Nothing stored:** `castPackMatch` and `packTraits` leave the member and
  the pack deep-equal to before.

`tests/hostile.test.mjs`: `hostilePack()` gains `P(…)` in trait names,
texts, kinds and origins, guides, and a modifier key. Slot it in, open a
member whose origin and tier match, open the picker, add a trait:
`injected` is `[]`, `app.errors` empty.

`tests/smoke.test.mjs`, *The builder (Decisions 183–185)*, with `GM_ON`:

- Switched off, and with no pack: the member's page has no datalist,
  toggles, guidance or `data-ctpick`.
- Origin typed as `dock` (lower case): *Dock +1* beside BOD, *Dock −1*
  beside REF; focus and caret still in Origin; **the stored BOD unchanged**.
- Role toggles: pressing *Lookout* writes the field and the member;
  typing `gatherer` presses *Gatherer*.
- Tier 2 with enemy role Bruiser (tier 1 in the fixture): the note shows;
  Tier 1: it doesn't.
- The guides show for Middling; the tier name is a tip carrying its text.
- The picker: filters narrow, pack order, caret kept, *Clear the filters*;
  **Add** on *Gull's Cry* → the block's last trait is `{ name, text }`
  with no other key; focus in its name field; count *1 trait: 1
  Signature*; rename it → *1 written*.
- Cancel and Escape return focus to **Add from a pack**; reopening keeps
  the search.
- Remove the pack, reopen the member: every field and trait as typed; no
  guidance.
- The Threats card reads *NPC role: Lookout*.
- At 390px the wrapping rules are on the toggles, the modifier and the
  picker's rows (jsdom has no layout; pixels by hand).

**Mutation-test** (record each in the PR, and what failed):

1. **Apply the modifier to the stored stat** when the origin matches → the
   *stored BOD unchanged* test fails.
2. **Match case-sensitively** → the folded-match engine test and the
   `dock` smoke test fail.
3. **Copy the pack's trait object itself** into the block (no fresh
   `{ name, text }`) → the *no other key* test fails.
4. **Store the kind on the copied trait** → the same test fails.
5. **Redraw the page on Origin's input** (`update()` instead of
   `castGuide`) → the caret test fails.
6. **Leave `PACK_SCHEMA_VERSION` at `"0.1"`** → the stamp tests fail.
7. **Show a warning beside a stat the guide's words would rule out** (a
   `role="alert"`, or the app's warning class) → the test that a member
   with every guide matched shows no warning anywhere on the page fails.
   Write that test first.

## 10. Steps

`git submodule update --init private` if you'll grep it, then
`npm run verify` before starting and after each step.

1. Confirm 183–185 free on `origin/main`; re-run the pre-flight's greps
   (the function names in *Carried over*).
2. Engine: pack schema 0.2, the gate, `packTraits`, `castPackMatch`,
   `packChoices.traitOrigins`. Fixture. Engine tests.
3. The member's page: lists, role toggles, tier name, `castGuide`, the
   guides and modifiers, the count. Smoke.
4. The picker. Smoke.
5. The Threats card label. Smoke.
6. Hostile tests, then the seven mutations.
7. In the browser (`shadows-dev-preview`, `?gm=on`), with the synthetic
   pack seeded: Use Gull, change its origin and tier, toggle roles, add two
   traits, rename one; quick-add a new member and build it from nothing;
   remove the pack and reopen; keyboard only; 390px and 1300px.
8. `npm run phone-check`.
9. Ledger, SCHEMA §3, docs, close-out (§12).

## 11. Stop and ask

- 183–185 are taken.
- Anything needs a Codex word in `src/` or `tests/`.
- Any change to `shared.js`, `sheet.js`, `app.js` or `wizard.js`.
- Anything would store a new field on a cast member or a block, or bump the
  table schema.
- A guide seems to need numbers to be useful, or a warning seems
  necessary.
- The ledger search finds a decision 184 or 185 overrides.
- A decision goes over 350 words after filling *Built*.
- A test outside the ones named fails and the fix isn't obviously yours.

## 12. Close-out

*Rule or shape* tier:

- **SCHEMA:** 183–185; §3's pack block gains 0.2's fields and the step line
  (*0.2: traits, modifiers, guides; stamps only*).
- **INDEX:** three lines under **GM mode**.
- **STATE:** Versions `pack schema 0.2`; §1's GM clause gains the builder
  (183–185); §5: S9b built, switched off; S9c next.
- **`changelog-pending.md`:** §8's line.
- **Log** entry; **shipped** row *(switched off)*.
- **The plan:** §6 *S9*: S9b built, the builder line reworded to what was
  built (shown, not applied; guidance, not warnings); README's table: S9b's
  row.
- **PR** titled `feat(gm): the builder reads the pack, switched off (W29
  S9b, Decisions 183–185)`. Body: what changed; the seven mutations; the
  voice-pass lines; **Where the order didn't fit**.

## 13. Review checklist

- [ ] Every *Done when*, in the browser, switched off and on, with and
      without a pack.
- [ ] **No stored shape moved:** a member's keys and a block's keys are
      what they were on `main`; an exported table from S9a's build and from
      this one differ only in what the GM typed.
- [ ] `git diff` on `shared.js`, `sheet.js`, `app.js`, `wizard.js` is
      empty.
- [ ] No Codex word in `src/` or `tests/` (grep the glossary's trait names
      and the tier table's words in `private/crb/`).
- [ ] Rerun the pre-flight's tier script if the mirror has moved; GQ21's
      numbers still hold, or the order's *Why* lines are updated.
- [ ] Typing in Origin, NPC roles, Tier and a trait's name keeps the caret;
      no redraw (watch `renderTable` calls).
- [ ] The picker: keyboard only, Escape, the first row within the first
      screen at 390px.
- [ ] The seven mutations are real; re-run at least two locally.
- [ ] Remove the pack: every member whole, nothing points at nothing.
- [ ] Pack schema 0.2 in `engine.js`, STATE and SCHEMA; no other bump.
