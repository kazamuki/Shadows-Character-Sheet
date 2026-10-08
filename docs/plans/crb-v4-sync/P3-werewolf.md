# Work order P3 — The Werewolf, to `0414`

**Plan:** [`../crb-v4-sync.md`](../crb-v4-sync.md) §1 (the `0414` row), §2 (P3), §3 (a power with ranks).
Decisions 104 (Natural Armor grants), 152 (Supernatural buys Universal only), 157 (5 CP a power rank),
194 (every power has a rank; `progression.powerIpe`).
**Status:** **drafted 2026-10-08 by Claude (Opus)**, in the session that built P0 and P2. §4 is for Ken.
**Branch:** a new session, from `main` after the P0 + P2 PR merges. PR to `main`.
**Tier:** *Rule or shape*. **Propose before building:** bring Ken §3's shape and §4's answers first.

**What P3 is.** The book rewrote the Werewolf on 2026-10-07. The app's Werewolf is the old draft: one Origin
(Trueborn), with a starter power the book has since dropped (Lunar Phase Blessing), four Trueborn powers that are
names only, no Innate powers, no Vulnerabilities, no Major Milestones, and a Form toggle that changes nothing. P3
brings the data to `0414`, puts every power on P2's ranked shape, and builds what the chapter makes mechanical:
as much of it as Ken's §4 answers say to.

---

## 1. What `0414` says, and what the app has

Read `private/crb/0414_Werewolf.md` whole before starting. This table is a map, not a substitute.

| `0414` | The app today (`shadows-data.js`, `werewolf`) | P3 |
|---|---|---|
| **Scaling:** Stat Bonus 1d4 / +1 / +2 / +3, SFR WILL × 3 + 5/10/15/20, RoU 3/5/7/9 (unchanged), plus **Base Powers 1/2/2/3** and **Max Starting Rank 1/1/2/2** | The first three columns | Add the two columns. Base Powers is **F38** (§2) |
| "Carries the whole kit": every Innate and Origin power at Rank 1, raised to Rank 3 | No powers at all | Every Innate and Origin power as data, with rank and Per Rank text |
| **Baseline traits:** Supernatural, Feral Instincts (+2 Awareness by sight, smell, hearing), Regeneration (in form, 1 HL a round, never Withering), **Pack Mentality** (new) | Supernatural, Werewolf Form, Feral Instincts (with "no TECH while shifted"), Regeneration | Rewrite to the book's four. Werewolf Form and Feral Mind move to the Core Mechanic and Vulnerabilities, where the book puts them. The Supernatural trait prints two empty bullets (a book slip; see §6) |
| **Origins:** Trueborn, **Wildblood** (was "Unblooded" in lore), Forge Fang. Each has Shifting, Refuel, Need and a Starter Power: Moonsworn, Aspect of the Beast (a d6 table of six spirits), CyberWolf Protocol (three augmentations) | Trueborn only, with `transformation`, `starterPower` (Lunar Phase Blessing), a Natural Armor `grants` (Resilient Spirit) and four name-only `additionalPowers` | Three Origins. **Lunar Phase Blessing and its Resilient Spirit grant are gone from the book (VQ10)** |
| **Core Mechanic, the Shift:** a round to change; Werewolf Form gives claws BOD+8, fangs BOD+10, +2 REF, +2 MOB, +4 BOD, Regeneration, Feral Mind; ends on unconscious or Withering at half HL. SFR refills three ways. **Call of the Wild:** each Origin's Need, three withdrawal steps a day | SFR tracker (max WILL × 3 + n) and a **Form** toggle (Human / Werewolf) that the engine never reads | VQ11 and VQ12 decide how much is computed |
| **Innate powers** (5): Predator's Mark, Primal Leap, Scent Tracking, Pheromone Aura, Ferocious Howl; each Origin can summon a wolf pack | None | Data, ranked, max 3 |
| **Origin powers:** Trueborn 6 (Apex Fury steps at named ranks: "Rank 2: anywhere; Rank 3: anytime"), Wildblood 6 (The Passenger's Eyes also steps), Forge Fang's (Steel Fangs, Serrated Claws, Seta-16 Surge, Combat Analytics, Null Field…: count them in the file) | Four Trueborn names | Data, ranked, max 3 |
| **Vulnerabilities:** Silver (Withering), Feral Mind, Call of the Wild, EMP (Forge Fang only) | `[]` | Data. EMP is Origin-only |
| **Growth:** 29 Werewolf Major Milestones: 4 open; 6 per Origin (Between Forms also needs a Major, Two Riders needs Spirit's Favor); 5 needing only 1 or 2 Majors; and two capstones needing 3 Majors and an Origin (The Calling: "Trueborn or Wildblood"; Off the Leash: Forge Fang) | `growth.majorMilestones: []`, **which nothing reads**: `takeMilestone` and Progression offer only `milestones.majorGeneral` | VQ13 |

**Ids are permanent** (constraint 6). `werewolf` and `trueborn` stay. New ids are kebab-case names, fixed once
shipped: `wildblood`, `forge-fang`, `predators-mark`, `apex-fury`, `tireless` and so on. A power id must not
collide with a Discipline id (`evocation`, `enchantment`, `alchemy`), since `progression.powerIpe` keys both.
Baseline trait ids are not stored on characters; check that before renaming any (`grep` the engine and tests).

## 2. F38, stubbed

F38 (Deighton/Scott): what do Base Powers buy when a Werewolf already holds every power at Rank 1? **Stub:** every
Innate and Origin power is held at Rank 1, derived from the Origin and never stored; the Base Powers column is
shown on the scaling table and spends nothing; IP raises ranks per Decision 194. The Werewolf's `flagNote` keeps
F38's text. A `playerNote` on the column says it's the GM's call for now (`docs/VOICE-APP.md`). When F38 is
answered, creation gets the spend; the stored shape (`powerIpe`) doesn't move.

## 3. The shape, proposed

- **Powers:** `archetypes[].powers` entries, read by `powerRanks()` (Decision 194 left the hook):
  `{ id, name, cost, effect, perRank, maxRank, steps?, origin? }`. `origin` absent means Innate. `perRank` is
  the book's Per Rank text; `steps` holds named-rank effects ("Rank 2: anywhere"). A held power's rank is
  1 + `powerIpeOf(ch, id)`, held when Innate or of the chosen Origin. **The cap in play is IPE's 10**
  (VQ5): `maxRank` 3 is printed and shown, and binds creation only, unless Ken's VQ14 answer changes that.
- **Origin parts:** each `specialization.options[]` entry gets `shifting`, `refuel`, `need` and `starterPower`
  (a table for Aspect of the Beast and CyberWolf Protocol: `rows: [{ name, cost, effect }]`). Retire
  `transformation` and `additionalPowers`, and remove the key everywhere it's read (Decision 135: no key
  nothing reads).
- **Vulnerabilities:** `{ id, name, description, origin? }`.
- **Versions:** game data bumps (what a Werewolf can do changes). **No character schema bump is expected:**
  the Origin is still `archetypeChoices.specialization`, ranks are `powerIpe`, and panel state is the generic
  `trackers.panel`. If VQ11 or VQ12 needs a stored input outside those, that's a schema bump with a
  `migrate()` step, and the order stops to say so (§7).
- **A saved Trueborn** loads untouched. What it loses is Lunar Phase Blessing's text and Resilient Spirit's
  conditional Natural Armor, which no file stores. `versionCheck` already reports a game-data change.

## 4. Questions for Ken (`VQ` continues the plan's numbering)

| Id | Question | Recommended |
|---|---|---|
| **VQ10** | Lunar Phase Blessing is gone from `0414`, and with it **Resilient Spirit**, the conditional Natural Armor a Trueborn gets under a waning moon (Decision 104's `while` grant, pinned in `engine.test.mjs`, ~line 1615). Retire it? | Yes. The book dropped it. Moonsworn's +1 Hit to resist magic isn't armor |
| **VQ11** | **Werewolf Form:** compute it? Toggled to Werewolf, the sheet would add +2 REF, +2 MOB, +4 BOD to every skill, speed and Health Level it derives, and show claws and fangs as weapon lines. That reaches `statValue` and everything under it | Yes, as a derived layer from the stored toggle (constraint 7). Natural weapons as read-only lines on Main while shifted. Big enough to be its own session (P3b) if Ken prefers |
| **VQ12** | **Call of the Wild:** a tracker (withdrawal step 0–3, each step's text from the Origin's column) or reference text only? | A small stepper panel, reset by hand when the Need is met. No clock: the app doesn't know what day it is |
| **VQ13** | **Werewolf Major Milestones:** archetype Majors and Origin prerequisites are new engine work (`growth.majorMilestones` is never read; `checkPrereqs` has no Origin key). In P3, or P3b? | P3b, after the powers land. Tireless (+2 RoU) and Deep Reserves (+5 SFR) need new `grants` types too (Decision 104 says widen `grants()`) |
| **VQ14** | `maxRank` 3: shown only, or a cap in play? VQ5 said printed caps are creation caps and play stops at 10, "may change for supernaturals" | Shown only, per VQ5, until Deighton answers `0450`'s Supernatural ceilings |
| **VQ15** | Aspect of the Beast's d6 table and CyberWolf Protocol: reference tables, or a picked Aspect stored while shifted? | Reference tables. The roll is at the table; the app never rolls |

## 5. Read first

`CLAUDE.md`; `docs/STATE.md`; this order; `private/crb/0414_Werewolf.md` whole; Decisions 104, 134, 135, 152,
157 and 194 in SCHEMA §4; the Werewolf entry in `shadows-data.js`; `powerRanks`, `disciplineRanks`,
`naturalArmor`, `grants`, `archetypeContent` and `checkPrereqs` in the engine; the Character tab's archetype
render and the toggle and tracker panels in `sheet.js`.

## 6. Out of scope

The Vampire (P4). CP ranks at creation for these powers (F38). Rolling anything. Summoned wolves as entities.
The book's slips go to `crb-catch-up.md`, not into the data: "ar", "fales", "refule", "nd", "odl"; the
Supernatural trait's empty bullets; Wildblood's empty table and headings before its Features; and Forge Fang's
chrome and EMP against "Werewolves can't take cybernetics" (already a question there).

## 7. Stop and ask

If a stored input outside `specialization`, `powerIpe` and `trackers.panel` turns out to be needed; if a power
id would collide with a Discipline's; if the book and this order disagree (the book wins, and say so); if
`naturalArmor` or Withering behaviour would change for any archetype other than the Werewolf.

## 8. Tests

- `rules.test.mjs`: the scaling table read from `0414` against the data, row for row (as R13 does for the
  Professional); each Origin's powers and the Innate five read from the file by name, with Per Rank text.
- `engine.test.mjs`: a Werewolf of each Origin holds the Innate five and only its Origin's powers, all at
  rank 1; `powerRanks` lists them; a raise lands on `powerIpe` at rank × 20; Resilient Spirit is gone (or
  kept, per VQ10); `archetypeContent` shows the Origin's vulnerability.
- `hostile.test.mjs`: a Werewolf with a junk Origin and junk `powerIpe` keys renders as text.
- `smoke.test.mjs`: the wizard's Origin step offers three; the Character tab shows the powers with ranks;
  Raise a Power lists them.
- Mutation-test every new guard and name the test that catches each in the log.

## 9. Close-out

Decision(s) numbered per `number-a-decision` (likely one for the data and powers, one for Form if VQ11 is yes),
104 marked superseded in part if VQ10 is yes; F7's Werewolf half closed (the Werewolf `flagNote` keeps only
F38); game data bumped; CHANGELOG lines; STATE's Werewolf row rewritten; the plan's P3 row ticked; a log entry
and a shipped row. `crb-catch-up.md` gets the slips in §6.
