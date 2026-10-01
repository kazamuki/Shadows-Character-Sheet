# Plan — A custom archetype, and classification for every archetype

**Status:** proposed 2026-09-30, approved in shape by Ken the same day; not
started. Nothing here is a decision until the session that builds it numbers
it in `SCHEMA.md` §4. Its open questions are `XQ`_n_ (§6), each with the
default the build takes if nobody answers first.
**Wanted by:** Saturday 2026-10-03. Deighton is running Shadows for his son's
birthday on the live sheet, with characters he writes himself.
**Sources:** Deighton's description of how he builds a custom character
(§1); Decisions 12, 15, 68, 78, 79, 104, 108, 135; `SCHEMA.md` §2 (archetypes,
panels) and §3 (`archetypeChoices`, `powers`); flag F13.
**Tier:** *Rule or shape*, twice over. Classification changes what a Werewolf
or Vampire can buy (a rule), and the custom archetype moves the save file's
shape (schema 0.15 → 0.16).

---

## 1. What Deighton asked for

> I start with the character classification (Mortal, Magic, Supernatural).
> That determines what ADV/DIS they have access to. Skills are the same since
> that is stable across all classifications. Anything besides mortals will
> have powers so that needs to be written in. It turns into, "Am I using SFR?
> Am I using Kicker's for this?", etc. I address any STAT changes that would
> be relevant in that same stroke of powers. After that it's gear and so
> forth. […] Where could someone insert their own stuff?

His answers to the follow-up questions (2026-09-30, relayed by Ken):

1. **Classification gates Advantages.** Universal Advantages are open to every
   classification; every other Advantage is Mortal-only. Not yet written into
   the CRB.
2. **Supernaturals still take Disadvantages.**
3. **"Magical being"** (fae and the like) is a future third classification,
   distinct from Supernatural. Not in this pass.

Ken's rulings on top: Vampires and Werewolves are Supernatural and so buy
Universal Advantages only, *because they start with a great deal of power,
and the Mortal-only Advantages exist to close some of that gap*. Magic is
something a character *does*, a checkbox, not a classification. An **Other**
classification, with its own text, buys every Advantage, so no custom
character is ever blocked.

## 2. Where someone can already write things in

Most of Deighton's process already has a slot. The plan fills the rest.

| His step | Today | After this plan |
|---|---|---|
| What the archetype is | — | A name and an optional description |
| Classification → ADV/DIS | `canPurchaseAdvantages`, a yes/no per archetype | `classification` on every archetype; the custom one's is the player's pick |
| Skills | Same for everyone | Unchanged |
| Powers ("SFR? Kicker?") | — | Written on the Archetype step; added in play with an optional IP cost |
| Always-on abilities | — | Written-in **baseline traits** |
| Weaknesses | — | Written-in **vulnerabilities**, text only |
| A pool to spend (TOL, SFR) | Only on the archetypes that declare one | **Uses magic** / **Uses SFR** checkboxes switch the panels on |
| Stat changes from powers | The Adjustments ledger (sheet, after lock), which cascades | Unchanged; the powers editor points there |
| Gear, weapons, armor, spells | `custom: true` rows | Unchanged |

## 3. The shape

### 3a. Classification, for every archetype (the rule)

- **Game data gets `classifications`**, one row each:
  `mortal` (Advantages: `"all"`), `supernatural` (`"universal"`), and `other`
  (`"all"`, `writeIn: true` — it takes a line of text). "Magical being" is a
  row added later (W53), not a code change.
- **Each archetype declares `classification`.** Professional, Arcanist and
  Cyborg are `mortal`; Werewolf and Vampire are `supernatural` (XQ1).
- **`canPurchaseAdvantages` goes**, with Vampire's `canPurchaseAdvantagesNote`
  and the two REVIEW comments. Keeping it beside `classification` would be the
  duplicate Decision 135 forbids.
- **One reader, `Engine.canBuyAdvantage(ch, adv)`**, replaces the three places
  that read `a.canPurchaseAdvantages` today (`engine.js` validate, `shared.js`
  pruning, `wizard.js`'s Character Points step). It reads the archetype's
  classification, or the custom character's pick.
- **`universal: true` becomes read.** It comes off the key guard's unread list
  (`tests/engine.test.mjs`).
- **The wizard** lists every Advantage; one a classification can't buy is shown
  but can't be bought, with a line saying why. Switching classification drops
  any held Advantage it can't buy, audited like any edit. `validate()` errors
  on a held Advantage the classification can't buy. A Professional's natural
  Advantages (`source: "natural"`) are exempt, as now.
- **What a player sees change:** a Werewolf or Vampire can now buy the 15
  Universal Advantages, where before it could buy none. Nothing changes for
  anyone else. Proven with `tools/outputs.mjs`: the only outputs that move
  should be Werewolf and Vampire's buyable Advantages.
- **Closes F13** (Vampire's assumed Advantage rule). **Supersedes Decision 12.**
  Game data bump per Decision 68.

### 3b. The custom archetype (the shape)

**In the game data,** one new archetype entry (display name `"Custom"`, free to
change). It has no specialization, no scaling row and no `classification` of
its own. What makes it a write-in is a generic key, never its id
(Decision 135):

```js
{ id: "custom", name: "Custom", status: "...", summary: "...",
  writeIn: {
    mechanics: [ { id: "magic", label: "Uses magic", note: "..." },
                 { id: "sfr",   label: "Uses SFR",   note: "..." } ],
    powerUses: [ "SFR", "TOL", "Kicker die" ]     // suggestions for a power's "Uses"; free text allowed
  },
  coreMechanic: { panels: [
    { id: "tol-spent", type: "tracker", title: "TOL Spent", max: "TOL", overMax: "cascade", when: "magic" },
    { id: "sfr", type: "tracker", title: "SFR", counts: "down", resource: "sfr", when: "sfr" },  // no max: the player sets it
    { id: "powers", type: "powers", title: "Powers" }
  ] } }
```

- **`when` on a panel** names a mechanic; `Engine.archPanels(ch)` skips the
  panel unless that box is ticked. A new mechanic later is one more checkbox
  and the panels it turns on: data only.
- **`powers`** is a new panel type: the character's written powers, on the
  Loadout & Powers tab and in the wizard. Any archetype could declare it later.
- **Status badge (XQ5).** `draft` and `tbd` say "the rules aren't finished",
  which is wrong here. A fourth status with its own `statusLabel` (e.g.
  "GM-built") is the likely answer.

**In the character file, schema 0.16:**

```js
archetypeChoices: {
  …,
  writeIn: {
    name: "",                  // what it is: "Changeling"
    description: null,         // optional, a sentence or two
    classification: null,      // a classifications id
    classificationText: "",    // Other's own words: "Magical being"
    mechanics: [],             // writeIn.mechanics ids ticked: ["sfr"]
    traits:          [ { name, description } ],   // baseline: always on
    vulnerabilities: [ { name, description } ]    // text only
  }
},
powers: [ { id: "pw-…", custom: true, name, uses, effect, notes } ]
```

- **Why traits and vulnerabilities sit in `archetypeChoices` but powers
  don't.** Traits and vulnerabilities *define* the archetype: written at
  creation, changed afterwards only in Admin. Powers *grow in play*, bought
  with IP, which is what the top-level `powers: []` slot was reserved for (`migrate()`
  creates it; nothing reads or writes it yet). Each power row is marked
  `custom: true` so a powers catalog can one day sit beside it, as gear,
  weapons and spells already do (Decisions 108, 120–121).
- **A power row carries a local `id`**, so the IP journal can name it and
  `versionCheck` can match a spend to its row (as it does a Mastered spell).
- **`migrate()`** gives every older file an empty `writeIn` and makes every
  stored value safe: strings stay strings (else `""`), `description` is a
  string or null, the arrays keep only objects with text fields, and a power
  without an id gets one. Hostile tests cover each field.

**In the engine:**

- **`Engine.archetypeContent(ch)`**, the one reader every renderer uses: name,
  description, classification and its label, traits, powers and
  vulnerabilities, from the data for a built-in archetype or from `writeIn`
  for a custom one. The Archetype tab, the wizard card, the header, the roster
  and print read it, so none of them asks which kind it is.
- **`validate()`**, on the Archetype step for a write-in archetype:
  - **error:** no name; no classification;
  - **warning:** Other with no text of its own (Decision 78: never block);
  - **warning, at lock:** a custom archetype is the GM's call (copy in
    `appCopy`, flagged for a voice pass).
- **Adding a power in play** (`addPower`): the row is written either way, and
  audited. With an IP cost it is also a journal spend
  (`targetType: "power"`, `targetId`: the row's id, the amount as typed),
  refused if IP is short. With no cost, nothing touches IP. One `commit()`,
  so one Undo takes back both.
- **`versionCheck`** matches a power's spend to its row; a spend whose power is
  gone says so, the same way a Mastered spell does.

### 3c. Where it shows

- **Wizard, Archetype step.** Choosing Custom opens the write-in block: name,
  description, classification (Other opens its text field), the mechanic
  checkboxes, then three editors — baseline traits, powers, vulnerabilities —
  each a list with add and remove. Powers are free at creation (XQ2). A line
  under the powers editor says stat changes go in Adjustments once the
  character is locked.
- **Sheet.** The Archetype tab draws `archetypeContent`. Loadout & Powers
  draws the powers panel: each power's text is editable in play (audited, like
  a gear row), and **Add power** takes an optional IP cost. **Admin** adds and
  removes traits, vulnerabilities and powers, and edits the name and
  description. Changing the archetype away from Custom clears all of it, with
  the existing confirmation and one undo (XQ3).
- **Print, filled and blank.** A section for the archetype: name,
  classification, description, then baseline traits, powers and
  vulnerabilities as tables. The front page is full (Decision 96), so it goes
  on a later page. The blank sheet gets empty Powers, Traits and
  Vulnerabilities lines. Print shows no archetype content at all today, so
  this is new for everyone (XQ4).

## 4. What this plan deliberately leaves out

- **No written-in Advantages or Disadvantages.** A custom Advantage is a power
  and a custom Disadvantage is a vulnerability; neither touches CP. Writing in
  a priced Advantage would let a character write its own points economy. The
  line is Decision 78's: the economy is the app's, the archetype's content is
  the table's.
- **No CP or rank for powers**, and no Max Power Rank check. Nobody asked, and
  pricing them is a design question.
- **Classification can't be changed in Admin after lock.** It would strand
  bought Advantages. That's Admin's existing gap (C2), not a new one.
- **To the wishlist (W48–W53):** Natural Armor the hit panel uses, a pool the
  player names, stat changes at creation, a shapeshifting form toggle,
  written-in Major Milestones, and the Magical being classification.

## 5. Sessions

Each session leaves `main` openable and `npm run verify` passing. S1 is
useful on its own, so it lands first.

| # | What | Decision | Versions |
|---|---|---|---|
| **S1** | Classification (§3a): data, `canBuyAdvantage`, the three call sites, wizard display and pruning, `validate`; F13 closed; outputs diffed before and after | **152**, superseding 12 | game data |
| **S2** | The custom archetype's engine and schema (§3b): the data entry, `when`, `writeIn`, `powers`, `migrate()`, `archetypeContent`, `validate`, `addPower`, `versionCheck`; engine and hostile tests | **153** | schema 0.16, game data |
| **S3** | The wizard's write-in block (§3c), jsdom smoke | — | — |
| **S4** | Sheet: Archetype tab, powers panel and Add power, Admin, roster and header names | — | — |
| **S5** | Print, filled and blank; `phone-check` | — | — |
| **S6** | Close: CHANGELOG in player voice, app **0.33.0**, STATE, the log, the shipped board, INDEX; then the release workflow from `main` | — | app |

S2–S5 can share one PR if time is short. S6's release has to run from `main`,
so it waits on Ken's merge.

## 6. Questions

Each has the default the build takes; an answer before that session changes it.

- **XQ1 (Ken):** Are Arcanist and Cyborg Mortal? *Default: yes.* That's what
  they can buy today, and it fits magic being a checkbox. Cyborg's F6 rewrite
  may revisit it.
- **XQ2 (Ken):** Do powers written at creation cost anything? *Default: no.*
  The IP cost applies only to a power added after lock.
- **XQ3 (Ken):** Admin changing the archetype away from Custom clears the
  write-in content, powers included? *Default: yes*, behind the existing
  confirmation, and one undo restores it.
- **XQ4 (Ken):** Should print's new archetype section show for every
  archetype, or only a custom one? *Default: every archetype*, since paper
  shows none of an archetype's content today. If it doesn't fit, only a custom
  one, and the rest goes to the wishlist.
- **XQ5 (Ken):** What does a custom archetype's badge say? *Default: a new
  status reading "GM-built".*
- **XQ6 (build check):** Does "Uses magic" switch on the Grimoire too? Its Spell
  Power reads an Evocation rank a custom character doesn't have. *Default:
  TOL Spent and Cascade only*, unless the Grimoire's numbers read right with
  no Disciplines.
