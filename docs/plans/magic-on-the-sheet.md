# Plan — Magic on the sheet

**Status:** scope agreed by Ken 2026-09-23 (all four pieces, character schema
0.9 for magic only, plan first, then Session 1). Nothing here is a locked
decision until the session that builds it numbers it in `SCHEMA.md` §4.
**Covers:** the half of Decision 93 that stayed data-only (the 96-spell
catalog), and the half of Decision 106 that writes to Notes instead of the
character (acquired Aberrations).
**Sources:** `reference/crb/Magic.md`, `Appendix_Book_of_Known_Spells.md`,
`Appendix_Aberrations.md`, `041_Archetypes.md` (the Arcanist), all pulled
2026-09-22.

When a session finishes, tick its box in §5 and move the finished facts into
SCHEMA. When the whole plan is done, this file gets a one-line "done, see
Decisions N–M" header and stays as history.

---

## 1. Why this, and why now

Ken loaded a real Arcanist (Wren Calloway) after v0.16.0 shipped and saw
nothing new for magic. That was right. The game data holds 96 Known spells
(Decision 93) and the Cascade's 39 Aberrations (Decision 106), and a player
can reach almost none of it:

- **The Grimoire is free text.** Wren typed Zap, Kindle and Staunch by hand.
  All three are in the catalog, and her Zap's effect doesn't match the book's.
  Nothing tells her so.
- **The wizard never asks for starting spells.** 041 gives a count (TOL + 1d4
  … 4d4 by power level) and says to "choose them from Appendix X". Decision
  21 deferred that, and Decision 25 closed it as "free entry".
- **A Cascade's Aberration goes into Notes** (Decision 106, Ken's call at the
  time). Nothing on the sheet knows Wren is Drained or has Phantom Pain.
- **Two player-facing strings are wrong.** The Arcanist's description sends
  players to "the Magic section", and the app has none. And the Grimoire's note says "A
  common-spell catalog can slot in here later without touching the sheet",
  which narrates the build (constraint 9) and isn't true. Decision 25 made the
  same claim.

---

## 2. What the app does today (the baseline this changes)

- `archetypes[arcanist].coreMechanic.panels`: `disciplines` (rankedList),
  `grimoire` (a generic `table` with seven text columns), `tol-spent` (tracker).
- `ch.panelData.grimoire`: rows keyed by column name, e.g.
  `{ "Spell Name": "Zap", "TN": "7", "TH": "1", "Effect": "…" }`. Every value is
  a string the player typed.
- `D.spells`: 96 entries with `id, name, tier, domain, glyph, tn, th, range,
  spellType, damageType, target, effect, defending, overflow, tags, flavorLine`.
  No reader uses them.
- `D.aberrations`: 39 entries with `id, name, category, as?, description`.
  Only the Cascade panel reads them.
- Spell Power (Evocation rank + WILL, `Magic.md` l.284) is computed nowhere.

---

## 3. The proposal

Numbered M-items so review comments can point at them.

**M1 — A Grimoire row is either a book spell or your own.** Same array,
`ch.panelData.grimoire`, two shapes, like Loadout's weapons (Decision 100):
- **Book spell:** `{ spellId, stage: "known" | "mastered", notes }`. Everything
  else (TN, TH, tier, range, effect, Overflow, tags) is read from `D.spells`
  every time, never copied in (constraint 7).
- **Your own:** today's column-keyed row plus `custom: true`, the improvised or
  house spell. Decision 25's free entry stays, for this.
Schema **0.8 → 0.9**: `migrate()` tags every existing row without a `spellId`
as `custom: true`. It **never** turns a typed row into a book spell on its own,
the same rule Decision 100 used for legacy weapons.

**M2 — `Engine.grimoire(ch)` is the one reader.** It returns a line per row:
the spell's numbers, **TH − 1 when Mastered** (a Mastered TH 1 spell needs no
roll, `Magic.md` l.67), a `missing` line for a `spellId` the data no longer has
(constraint 8), and **Spell Power** (Evocation rank + WILL) once for the whole
Grimoire, since half the book's effects read "½ SP".

**M3 — Add from the book with a picker you can read.** A search box, a filter by
tier and by domain, and each result shows TN/TH, range and effect *before* it's
added. That learns from W4, where Loadout's pickers still hide the stats until
after you choose. Adding is one commit and gets the W12 undo toast. A spell
already in the Grimoire is greyed out.

**M4 — "Link to the book."** A custom row whose name matches a book spell
(case- and punctuation-blind) gets a button that swaps it for the book spell and
keeps its notes. It's one undoable action. Wren would get three. Nothing links on
its own (M1).

**M5 — Mastering spends IP.** "Costs 30 IP × TH" (`Magic.md`, progression).
`ipCost(ch, "spell", spellId)` and `spendIP` gain a spell target, so it goes in
the IP journal, and undo reverses it like any spend (Decision 49). TH is the
spell's printed TH. Only a Known book spell can be Mastered. A custom row can't,
because its TH is whatever was typed.

**M6 — Starting spells in the wizard.** On the Arcanist's step: the count is
TOL + the power level's roll (`campaignPowerScaling.commonSpells`), and the
player enters the roll (Decision 11). They pick from the book with M3's picker,
**a spell's TH can't exceed the character's Evocation rank**, counting ranks
bought at creation (MQ1, answered: Decision 109). Short of the count
**warns**, it doesn't block, the same as an open GM detail (Decision 82).
Picks land in `panelData.grimoire` as Known book spells, so there's no
second store.

**M7 — Aberrations the character picked up are inputs.** Also in the 0.9 bump:
`trackers.aberrations: [ { id, permanence: "temporary" | "permanent", note? } ]`
(this is Decision 106's "not this session"). The Cascade panel's **Add to
notes** becomes **Record it**, which records the entry and still writes the Notes
line. Also addable by hand from the catalog, for a GM ruling. Permanent ones
show beside the Unique Aberrations on the Archetype tab. Temporary ones show as
chips with Clear ("Lasts 8 hours" is the table's call, not a timer).

**M8 — Two Aberrations change numbers the sheet already has.** In the data, as
hooks the engine already reads, not special cases:
- **Drained:** −2 on **maximum** TOL, and **current TOL doesn't move** (MQ2,
  Decision 109). The sheet stores TOL *Spent* (current = max − spent), so
  recording Drained also takes 2 off TOL Spent, floored at 0. It's one
  writer, one commit, and one undo. Max TOL can go below the formula's floor of 1,
  down to 0.
- **Phantom Pain:** "one Pain Level higher", so `painLevels: 1`, the same hook
  as Agonized (Decision 96), clamped at 3.
Every other Aberration is text on its chip, like most Conditions (P2 in the
combat plan).

**M11 — Spell Attack** (added 2026-09-23, Decision 109): Evocation rank + the
**raw** REF score + the **raw** WILL score, not their modifiers. It's shown
beside Spell Power in the Grimoire, read from `spellcraftRules` like
`spellPower`.

**M9 — A Magic reference on the Archetype tab.** A collapsible section built
from the data: the Spellcraft roll and its five outcomes (`spellcraftRules`),
spell tiers, the Cascade Table and Aberration Table, and the Aberrations by
category. It's declared in the Arcanist's panels as a `reference` panel naming
the data it shows, so it isn't a special case on the Arcanist. The description's "See the
Magic section" then points at something real.

**M10 — Copy fixes, whatever else lands.** The Grimoire note stops narrating the
build. The Arcanist description's pointer names the section M9 adds.

---

## 4. Versions this will move

- **Character schema → 0.9** in Session 1: M1's `custom` tag and M7's empty
  `trackers.aberrations`, one migration with the round-trip test. M7's reader
  comes in Session 2. The combat plan's Session 2 did the same with
  `witheringDamage`. W16 and W17 take their own bump later (Ken, 2026-09-23).
- **Game data → 0.12** in Session 2 (M8's hooks change computed TOL and Pain).
  Session 1's panel change (`grimoire` stops being a plain `table`) is also
  observable, so Session 1 bumps it.
- **App:** a minor bump each session that ships UI.

---

## 5. Sessions

One chat session per box. Each starts cold from `CLAUDE.md` → `STATE.md` →
this file, and ends with `npm run verify` green, STATE rewritten, a log entry,
and its decisions numbered.

- [x] **Session 1 — The Grimoire reads the book** (2026-09-23, Decision 108). Built as proposed, plus **Link yours** in the picker (found by loading Wren). Spell Attack stays out, since REF-score-or-modifier is a ruling. The original box follows.
  **The Grimoire reads the book.** M1–M5, M10, and schema 0.9
  (with M7's field). **Replaces Decision 25 in part** (free entry stays, but
  only for your own spells) and fulfils what Decision 93 left for "an
  engine+UI batch". **Tests to pin:** Mastered TH − 1; 30 IP × TH; Spell Power
  = Evocation + WILL; migrate tags legacy rows custom and never links them;
  Link keeps notes; a missing `spellId` renders; the catalog picker greys held
  spells; totality on degenerate characters.
- [ ] **Session 2 — Aberrations on the character, and the reference.** M7's
  reader and UI, M8, M9, M11, and the Cascade panel's Record it. **Replaces
  Decision 106 in part** (Notes stops being the only record). **Tests:** Ken's
  worked Drained examples (max 8 / current 3 → max 6 / current 3; max 2 → 0);
  Phantom Pain PL 1 at full health; clamps at 3 with Agonized; Spell Attack
  from raw REF and WILL; permanent vs temporary display; Record it undoes in
  one step.
- [ ] **Session 3 — Starting spells in the wizard.** M6. MQ1 is answered
  (Decision 109), so nothing blocks it. **Replaces Decision 21's deferral** (already superseded by 25).
  **Tests:** count = TOL + entered roll; short warns, doesn't block; picks
  are Known book rows after lock; a TH above Evocation rank is refused, and
  buying Evocation at creation opens the next tier.

---

## 6. Open questions

### Rules questions — Deighton (MQ1–MQ3)

**All answered by Deighton on 2026-09-23 (Decision 109)**, relayed by Ken. The
questions stay below as history, each with its answer in bold. Spell Attack's
REF, raised by Decision 108, was answered at the same time.

- **MQ1 — Can a new Arcanist start with Advanced or Superior spells?** The
  appendix says "A new Arcanist works from the Cantrip and Standard lists."
  Is that a rule or advice? *Stub: Cantrip and Standard only, at creation.*
  **Answer: a new Arcanist can start with Advanced or Superior spells, but
  needs the ranks in Evocation.** Ken's reading, which he confirmed: a spell's
  TH can't exceed Evocation rank, so the power level's rank cap does the
  gating.
- **MQ2 — Can Drained take TOL below 1?** Derived stats floor at 1 today.
  *Stub: the floor holds.*
  **Answer: yes. "Since it is assigned by the GM based on the roll, they can
  choose to be very mean."** Ken on how it works: Drained lowers **maximum**
  TOL and leaves **current** alone. Max 8 / current 3 becomes max 6 / current
  3, and a max of 2 becomes 0. *Not covered:* a maximum below 0, and what
  removing Drained does to current. The app floors max at 0, and Session 2
  asks about removal before building it.
- **MQ3 — Does Phantom Pain count at full health?** "Permanently operate at one
  Pain Level higher" reads as Pain Level 1 with no damage at all. *Stub: yes,
  like Agonized at PL 0.*
  **Answer: yes. "Your PL1 happens even if you are full health."**
- **Spell Attack's REF** (Decision 108). **Answer: Evocation rank + raw REF +
  raw WILL, not the bonuses.** This became M11.

Origin starting-spell modifiers (Book +3, Blood −2, Bound base) wait on the
Origins question (STATE §3), not on these.

### Doc fixes — Ken, in the CRB or the data

- **The Unique Aberrations drift** (#36's checklist, STATE §5): Aethereal Link
  (animals), Thaumaturgical Sight (when analyzing magic), Resonant Whispers (no
  charms). The data catches up to `041`. Session 2 touches the Archetype tab,
  so it can take the sync if Ken has checked it by then.
