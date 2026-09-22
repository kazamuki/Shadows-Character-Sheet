# Plan — Conditions, damage & armor

**Status:** §3 signed off by Ken 2026-09-22 (P1–P7, P9 as written; P8 renamed "Turn Reset") · Session 2 done (Decisions 95–96) · Session 3 done (Decision 99, F23) · Session 4 next
**Covers:** F18's engine half (Decision 92 deferred it), plus the Conditions system
that chapter 054 now fully specifies.
**Sources:** `reference/crb/053_Combat_Encounters.md` (Damage and Armor),
`054_Conditions_and_Recovery.md`, `055_Downtime.md`, `Gear.md` (How Armor Works) —
all pulled 2026-09-22.

This is a working plan, not the decision ledger. Nothing here is a locked
decision until the session that builds it numbers it in `SCHEMA.md` §4. When a
session finishes, tick its box in §5 and move the finished facts into SCHEMA;
when the whole plan is done, this file gets a one-line "done, see Decisions N–M"
header and stays as history.

---

## 1. Why these two are one piece of work

Conditions and armor look like separate features. They aren't — they're two
halves of one pipeline, and the join is where the value is:

```
 a hit lands
   │
   ▼
 total the damage ─── Burst/Full Auto arrive as one packet
   │
   ▼
 armor answers ────── PROT die (player rolls, enters it) + RES if the type allows
   │                  AP skips RES · Compromised armor (INT 0) has no RES
   │                  fully soaked → armor still loses 1 INT
   ▼
 what survives ────── comes off Health Levels, left to right
   │                  Massive: strips INT = damage, 1 HL per 10 gone (not emptied),
   │                           +1 HL if armor hit 0 or there was none
   ▼
 consequences ──────► CONDITIONS
                      · weapon/style conditions (Bleeding, Stunned, Agonized…)
                      · Shock Check if one hit took ≥ half your HL → Unconscious + Prone
                      · last HL empties → WILL check → Unconscious or Dying
   │
   ▼
 Pain Level = HL-lost band + condition Pain (Agonized) ─ clamped 0–3
   │
   ▼
 every skill line, Essence pool and Breaker % on the sheet already reads Pain
```

The sheet already does the first and last rows (damage in HP → HL lost → Pain).
What's missing is the middle: armor, and the Conditions the damage produces.
Building Conditions first means the hit resolver in Session 3 has somewhere to
put its consequences instead of printing "you are now Bleeding" as text.

---

## 2. What the app does today (the baseline this changes)

- `trackers.damage` — total HP damage, one number. HL lost and Pain are derived
  (`Engine.health`, `Engine.painState`). Pain comes from HL lost **only**.
- `armor[]` — catalog reference `{ id, integrityLoss, notes }` or custom
  (schema 0.6). **No UI writes it yet**; Loadout still edits free-text columns.
- `armorRules` in game data — PROT/RES/Integrity/Compromised/repair as prose.
- No Conditions anywhere. No notion of Massive or Withering on the character.

---

## 3. The proposal — signed off 2026-09-22

Each item is a design choice Ken should approve or redirect. Numbered P-items so
review comments can point at them.

**P1 — The engine never rolls dice.** Same rule as creation (`rolls` stores the
physical dice the player entered). The hit dialog asks for the PROT die result;
the after-fight wear asks for the wear die. This keeps the app a sheet, not a
dice server, and keeps every engine function deterministic and testable.

**P2 — Conditions are a data catalog with structured effects.** A new top-level
`conditions` array in `shadows-data.js`, one entry per row of 054's table, plus
**Dying** (054 treats it as a Condition in prose and recovery, but it has no
table row — see CQ9). Each entry carries display text (`effect`, `recovery`) and
only the effects the engine can actually compute:

| Hook | Meaning | Entries |
|---|---|---|
| `painLevels: 1` | adds to Pain Level before the 0–3 clamp | Agonized |
| `rollPenalty: -1` | flat penalty, shown on every skill line | Disoriented, Burning, Shocked |
| `rollPenaltyWhen: "…"` | conditional — shown, never summed | Frightened ("while source is present") |
| `attackDefense: -5` | shown on the combat skill lines | Blinded (−5), Prone (−3), Restrained (−5, no Dodge) |
| `helpless: true` | "any attack roll of 2 or better hits" banner | Paralyzed, Stunned, Unconscious |
| `ongoing: "1 HP / round"` | ticks at Reset | Bleeding (fixed), Burning/Shocked (source-based, entered) |
| `location: true` | needs a body part | Injured, Maimed, DeSynced |
| `counter: "marks"` | 0–3, three is death | Dying |

Everything else (Blinded's autofail, Grappled's −5 to sophisticated movement,
Poisoned's secondary condition) is text on the chip. Adding a condition is a
data edit with zero app changes — the architecture rule every catalog follows.

**P3 — Active Conditions are inputs on the character.**
`trackers.conditions: [ { id, location?, marks?, note? } ]`. No duplicates by id
("you have it or you don't") — except location-bearing ones, which key by
`id + location` so an Injured arm and an Injured leg are two entries (CQ3).
Pain, penalties and the helpless banner are derived, never stored.

**P4 — Two new damage inputs, not a damage rewrite.** `trackers.damage` stays
the HP total. Added:
- `trackers.massiveLevels` — Health Levels removed by Massive damage. They're
  drawn struck-through at the right of the HL track, count toward HL lost (and
  so toward Pain — CQ6), and are never restored by rest, chems, or the
  natural-healing action — only by an explicit "repaired" action.
- `trackers.witheringDamage` — the part of `damage` that can't regenerate. Nothing
  reads it until an archetype has regeneration (Werewolf/Vampire, blocked); it's
  in the schema now so the hit dialog can record it honestly instead of
  losing the distinction. **Pushback on myself:** if Ken would rather not carry a
  field no reader uses yet, drop it and the hit dialog records Withering as a
  note — it's a cheap migration to add later.

**P5 — Armor on the character gains `worn` and `scrapped`.** `worn: true` marks
the body piece that rolls PROT (one at a time — CQ7). Helmets and gloves don't roll
PROT or track INT (Gear says so); they contribute features only. Compromised is
derived (`integrityLoss ≥ integrity`), not stored. `scrapped: true` is an input
because "driven to 0 by Massive" can't be recovered from `integrityLoss` alone.
RES type-matching reads the armor's upgrades — Kinetic by default; Ablative adds
Energy, Warded adds Magical. Upgrades become `armor[i].upgrades: [ids]` from the
existing `armorUpgradeGlossary`.

**P6 — `Engine.resolveHit(ch, hit)` is pure and returns a proposal, not a
mutation.** Input `{ damage, damageType, category: "regular"|"massive"|"withering",
ap, location, protRoll }`. Output: the breakdown (PROT absorbed, RES absorbed,
through, HL before/after), the **patch** it would apply (damage, integrityLoss,
massiveLevels, conditions to add), and **prompts** (Shock Check due, At-Zero
check due, conditions the damage type can inflict). The UI shows it, the player
confirms, and the patch goes through the existing `recordAction` — so every hit
is undoable with no new undo code. That's the payoff of constraint 7.

**P7 — The damage number stays directly editable.** The hit dialog is the
guided path; typing a damage total is still how a GM ruling or a
missed-it-earlier correction gets in. Same for adding a Condition by hand.

**P8 — Turn Reset is a helper, not an automation.** *(Renamed from "Reset" at sign-off, so the button reads as an encounter helper.)* One "Turn Reset" button: ticks Bleeding
(−1 HP), asks for Burning/Shocked source damage, and lists the recovery check each
active Condition gets, as text. It does not run the checks. **Frank view:** full
round-by-round automation is a GM-toolkit feature (Scott's area), not a player
sheet's. The player sheet's job is to make the bookkeeping impossible to forget.

**P9 — Recovery actions are small and explicit.** Natural Healing ("Rest a day":
damage −= BOD, never touches Massive), Focused Healing (enter HP restored; the
only path that clears Injured), Field Repair Kit (enter 1d6), post-fight wear
(enter the die), "Massive levels repaired". Each is one audited action.

---

## 4. Versions this will move

- **Character schema → 0.8** in Session 2 (`trackers.conditions`,
  `massiveLevels`, `witheringDamage`) and **→ 0.9** in Session 3 only if P5's
  armor fields don't fit in Session 2's bump. Preference: land all of §3's schema
  in Session 2 so there's one migration, even though Session 3 is what reads the
  armor half. Each bump needs its `migrate()` step and the round-trip test.
- **Game data → 0.8** in Session 2 — a Conditions catalog changes computed
  values (Pain), the Decision 68 test.
- **App** — minor bump each session that ships UI.

---

## 5. Sessions

One chat session per box. Each starts cold from `CLAUDE.md` → `STATE.md` → this
file, and ends with `npm run verify` green, STATE rewritten, a log entry, and
its decisions numbered.

- [x] **Session 1 — Level set + plan** (2026-09-22). CRB mirror re-pulled and
  extended (053, 055, Magic, spells, Aberrations); F16 closed; this plan; the
  Deighton question list.
- [x] **Session 2 — Conditions** (2026-09-22, Decisions 95–96; CQ1/CQ2/CQ3 stubbed as F20/F21/F22). `conditions` catalog (P2) · schema 0.8 (P3, P4,
  and P5's fields) with `migrate()` · `Engine.conditionState()` · `painState()`
  folds condition Pain (clamped 3) · condition `rollPenalty` on skill lines ·
  Conditions card on Main + Trackers (toggle, location, Death Marks, recovery text,
  helpless banner) · a blank Conditions box on the print sheet. **Tests to pin:**
  054's "BOD-heavy character at PL 3: −3 / −3 dice / −15%"; Agonized at PL 3
  stays 3; Agonized at PL 0 gives 1; no duplicate ids; migrate round-trip.
  **Unblocked now** — CQ1/CQ2 only change one number each, stub and flag.
- [x] **Session 3 — Taking a hit** (2026-09-22, Decision 99; F23 opened for RES vs Electric/Burning and the Resistance upgrade). `Engine.resolveHit()` (P6) and
  `Engine.armorState()` (worn piece, Compromised, RES-applies-to) · the "Take a
  hit" dialog on Trackers · Shock and At-Zero prompts that add Unconscious/Prone
  or Dying through Session 2's Conditions · Massive and Withering recorded.
  **Tests to pin:** 053's Massive formula at 9/10/25 damage, with and without
  armor; AP skipping RES; Compromised skipping RES; fully soaked hit costing 1 INT;
  Shock at exactly half HL. CQ4/CQ5/CQ6/CQ7/CQ10 are answered (Decision 98) — no stubs needed.
- [ ] **Session 4 — Loadout & recovery.** Catalog pickers for weapons and
  armor (schema 0.6 already supports them) · weapon lines computed (skill total,
  `BOD+X` resolved to a number) · worn toggle and Integrity bar · wear roll,
  repair kit, rest/natural healing, Focused Healing, Turn Reset helper (P8, P9) ·
  print sheet shows armor and Integrity.
- [ ] **Side session — Magic tables** (independent of all of the above). Encode
  the Cascade Table and the Aberration Table from `Magic.md`, and the
  Good/Neutral/Bad lists from `Appendix_Aberrations.md`. `spellcraftRules.cascade`
  still says "Design, not yet encoded" — it now is designed.

---

## 6. Open questions this area raises

Two kinds, kept apart because they go to different people.

### Rules questions — Deighton (CQ1–CQ7, CQ10)

**All answered by the design team 2026-09-22 (Decisions 97–98).** The
original questions stay below as history; each answer is in bold at its end.

Each becomes an F-number the day a session stubs behavior on it.

- **CQ1 → F20 — What does "−1 to all rolls" hit?** (Disoriented, Burning, Shocked,
  Frightened.) Skill Checks, obviously. Does it also cost a die on Essence Checks
  and 5% on Breaker Checks the way a Pain Level does — or is it Skill Checks and
  attack/defense only? *Stub: Skill Checks only.*
  **Answer: Skill Checks only.**
- **CQ2 → F21 — Do different conditions' penalties stack?** Burning + Disoriented =
  −2? "Doesn't stack with itself" implies different ones do. Is there a cap (the
  attack modifiers stop at −8)? *Stub: they stack, no cap.*
  **Answer: yes, different ones stack; every penalty on one roll caps at −8 (Conditions, range, cover, visibility).**
- **CQ3 → F22 — Can the same location-bearing Condition exist on two body parts?** An
  Injured arm and an Injured leg — two Injured, or one? *Stub: two.*
  **Answer: yes — and only Injured and Maimed are body-part Conditions (DeSynced isn't).**
- **CQ4 — Siege vs Massive.** Gear's Siege tag says soft targets take **double
  damage**; 053 says Massive against a person strips Integrity and takes 1 HL per
  10. Which is the rule for a Siege weapon hitting a person? *Blocks Session 3's
  Massive path.*
  **Answer: Siege causes Massive damage, to people too. Gear's Siege tag needs updating (Ken).**
- **CQ5 — Ballistic and Injured/Maimed.** Gear: "standard ballistic fire does not
  risk Maimed or Injured — that threshold belongs to Massive." 053: a Called Shot
  (Single fire) can apply Injured or Maimed. Is Called Shot the exception, or is
  one of these wrong?
  **Answer: only Massive damage causes Injured/Maimed. A Called Shot counts only when the weapon or use deals Massive (e.g. a sniper rifle). 053 needs to say so (Ken).**
- **CQ6 — Do Massive-removed Health Levels count toward Pain?** Natural reading
  is yes (they're HL lost). And how does "somebody has to put you back together
  properly" restore them — Focused Healing, how many per what? *Stub: count toward
  Pain; restored only by an explicit manual action.*
  **Answer: yes. Restoring them takes Focused Healing (Nanomed Kit, hospital) and a prosthetic or other limb replacement (possibly magical).**
- **CQ7 — One body armor at a time?** Can a vest go under a duster, and if so which
  PROT rolls and whose INT pays? *Stub: one worn body piece.*
  **Answer: no layering — two pieces can't cover the same body part, and all body armor covers at least the torso. One worn body piece.**
- **CQ10 — Shock Check threshold.** "A single hit that takes half your Health
  Levels or more" — half of **max** HL, rounded up? (BOD 5 → 3 HL?) *Stub: half of
  max, rounded up.*
  **Answer: half of max HL, rounded up (2 → 1, 3 → 2, 5 → 3).**

### Doc fixes — Ken, in the CRB (CQ8, CQ9, CQ11)

- **CQ8 — Gear's Conditions table disagrees with 054's.** Disoriented −2 vs −1;
  Agonized "all current penalties doubled" vs "+1 Pain Level"; Stunned "can't act,
  can't move, check each round" vs "Helpless"; Bleeding's recovery says First Aid
  (054 says Medical, Difficulty 15); Agonized's recovery differs. Gear also says
  the full rules are "in the Combat chapter" — they're in Conditions and
  Recovery. Suggest: cut Gear's table to a pointer at 054 so there's one table.
  **The app will follow 054.** **Agreed by the design team 2026-09-22:**
  Conditions and Recovery is the master document; Gear points to it (Decision 97).
- **CQ9 — Dying has no row in 054's Conditions table**, though Medical and
  Nanomed both "end the Dying condition". Unconscious's recovery says "see Going
  Down". Add a Dying row (effect: Helpless, Death Marks; recovery: Medical 20,
  Nanomed Kit).
- **CQ11 — 053's worked attack example contradicts its own armor rules.** "His
  vest rolls PROT and turns 3 of it" — but the same section says *enemy* armor is
  static and doesn't roll, and a Ballistic hit on a Kinetic vest should also take
  RES off. Either the example or the rule needs to move.
