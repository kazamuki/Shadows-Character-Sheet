# Work order P3b — The Werewolf's Major Milestones, from `0414`

**Plan:** [`../crb-v4-sync.md`](../crb-v4-sync.md) §2 (P3b). Follows [`P3-werewolf.md`](P3-werewolf.md), built
2026-10-08 (Decisions 195–197). Decisions 29, 91, 104, 135 and 194 bear on it.
**Status:** **built 2026-10-08** (Decision 199, app 0.39.0, game data 0.32). Ken took §4's four recommendations the same day.
**Branch:** a new session, from `main` after P3 merges. PR to `main`.
**Tier:** *Rule or shape*. **Propose before building:** bring Ken §3's shape and §4's answers first.

**What P3b is.** `0414`'s Growth & Milestones gives the Werewolf 29 Major Milestones of its own. The app
reads only the shared `milestones.majorGeneral`: `growth.majorMilestones` is `[]` on every archetype and
nothing reads it (it sits on the key guard's `NOT_YET_SHOWN` list as `growth`, waiting for exactly this).
P3b brings the Werewolf's 29 into the data, has Progression offer them beside the shared ones, checks
their prerequisites, and computes the few that change a number the engine already derives.

---

## 1. What `0414` says

Read `private/crb/0414_Werewolf.md` § Growth & Milestones whole. "Werewolves select Minor Milestones from the
shared pool and Major Milestones from the Werewolf pool below." Each row is Milestone · Effect · Prerequisite.

| Group | Milestones | Prerequisite |
|---|---|---|
| Open | Tireless (+2 RoU), Deep Reserves (+5 max SFR), Lead the Pack, Master of the Change | None |
| Trueborn | Trueborn Mark, Trueborn Tracking, Trueborn Pheromones, Trueborn Howl, Swift Change; **Between Forms** | Trueborn; Between Forms also 1 Major |
| Wildblood | Wildblood Mark, Wildblood Tracking, Wildblood Pheromones, Wildblood Howl, Spirit's Favor; **Two Riders** | Wildblood; Two Riders also Spirit's Favor |
| Forge Fang | Forge Fang Mark, Forge Fang Tracking, Forge Fang Pheromones, Forge Fang Howl, Override Protocol, Hardline Shift | Forge Fang |
| Earned | The Wolf Beneath, Clear Head, Iron Jaw (1 Major); Silverscar, Bone and Sinew (2 Majors) | Major count |
| Capstones | **The Calling** (Trueborn or Wildblood, 3 Majors); **Off the Leash** (Forge Fang, 3 Majors) | Origin + count |

**What the sheet could compute** (the rest is text the table reads):

| Milestone | What changes | Engine today |
|---|---|---|
| Tireless | RoU +2 | `sfr(ch).rou` is the row's number; no grant reaches it |
| Deep Reserves | max SFR +5 | `sfr(ch).value` is the formula; no grant reaches it |
| Hardline Shift | the shift's HL is no longer Withering | `toggleCost` reads the Origin's `shiftCost.category` (Decision 195) |
| Iron Jaw | Claws and Fangs gain AP | `formView` weapons carry no tags |
| Clear Head | TECH skills in form at −2, not barred | `skillLine.barred` is all-or-nothing |
| Bone and Sinew | Regeneration 2 HL a round | Regeneration is text; nothing computes it |

## 2. What the engine has, and what's missing

- **Where Majors come from.** `takeMilestone(ch, "major", id)` and `majorPrereqs` look only in
  `milestones.majorGeneral`; so does `checkPrereqs`'s `milestones` key, and so does Progression's list. One
  reader, `majorPool(ch)` (the shared list plus the archetype's `growth.majorMilestones`), replaces those
  lookups. A taken id must resolve wherever it came from, or `versionCheck` and the Activity Log lose its name.
- **Prerequisites.** `checkPrereqs` (Decision 91) has `majorCount` and `milestones` already. It has **no
  Origin key**. Add `specialization: ["trueborn", "wildblood"]` (any of), read against `specializationIds`.
  The Calling is the one that needs "any of"; every other names one.
- **Grants.** Decision 104 kept Natural Armor's scan of Milestones outside `grants()`, and STATE §2 says the
  next grant type on a Milestone should widen `grants()` rather than copy the scan. Tireless and Deep Reserves
  are that: `grants()` learns to read held Majors (the shared ones and the archetype's), and two new types,
  `rou` and `sfrMax`, which `sfr()` adds.
- **Modifiers on the form.** Hardline Shift, Iron Jaw and Clear Head modify Decision 195's form. The shape that
  keeps it data: a Milestone's `grants` entry of type `form` naming what it changes on the option
  (`{ type: "form", withering: false }`, `{ type: "form", weaponTags: ["AP"] }`, `{ type: "form", barsPenalty: -2 }`),
  merged by `formState` / `toggleCost`. Propose this to Ken; it's the one new idea here.
- **Ids.** The Werewolf's Major ids must not collide with `majorGeneral` ids (a test, like R15's Discipline
  check), since `progression.milestones.major` stores bare ids.

## 3. The shape, proposed

- **Data:** `werewolf.growth.majorMilestones`: 29 entries in `majorGeneral`'s shape (`id`, `name`, `effect` or
  `description`, `prerequisites`, `grants?`). `growth.minorMilestones: "shared"` stays as text (or goes, if
  nothing reads it: the key guard will say).
- **Engine:** `majorPool(ch)`; `checkPrereqs` gains `specialization`; `grants()` reads held Majors and gains
  `rou` and `sfrMax`; the `form` grant type above. `takeMilestone`, `majorPrereqs`, Progression's list and
  `versionCheck` read the pool.
- **UI:** Progression's Major list shows the archetype's beside the shared ones, grouped (Open, your Origin's,
  earned), with unmet prerequisites greyed as today. No new tab.
- **Versions:** game data bumps. **No character schema bump expected**: a taken Major is still `{ id, date }`.
  Take `NOT_YET_SHOWN.growth` off the key guard.
- **A saved Werewolf** loses nothing: it has no archetype Majors yet.

## 4. Questions for Ken (`VQ` continues the plan's numbering)

| Id | Question | Recommended |
|---|---|---|
| **VQ16** | Does a Werewolf still take the **shared** `majorGeneral` Majors as well as its own? `0414` says Majors come "from the Werewolf pool below". F9 (Ken's) already asks whether `majorGeneral` is shared at all | Both, until F9 says otherwise: the shared list is what every archetype has now, and removing it is F9's call, not P3b's |
| **VQ17** | Compute Tireless and Deep Reserves (RoU +2, max SFR +5), or text? | Compute: they're flat numbers the sheet already shows |
| **VQ18** | Hardline Shift, Iron Jaw and Clear Head modify the form (Decision 195). The `form` grant type, or text? | The grant type: Hardline Shift changes what the switch writes, so text would leave the sheet writing Withering the character doesn't take |
| **VQ19** | Bone and Sinew (Regeneration 2 HL a round), Swift Change, Between Forms, Two Riders and the capstones: text? | Text. Regeneration isn't computed, and the rest are table actions |

## 5. Read first

`CLAUDE.md`; `docs/STATE.md`; this order; `0414` § Growth & Milestones; Decisions 29, 91, 104, 195 and 196;
`milestoneState`, `checkPrereqs`, `majorPrereqs`, `takeMilestone`, `grants`, `naturalArmor`'s Milestone scan,
`sfr`, `formState` and `toggleCost` in the engine; Progression's milestone renderer in `sheet.js`.

## 6. Out of scope

The Vampire's Majors (P4 brings `0413`'s Growth). Minor Milestone repeats (VQ7, P5). F9.

## 7. Stop and ask

If the shared/archetype question (VQ16) turns out to need F9 settled first; if a Major's prerequisite can't be
said in `checkPrereqs`' vocabulary; if a grant would change a number for any archetype but the Werewolf.

## 8. Tests

- `rules.test.mjs`: all 29 read from `0414`'s table by name, effect and prerequisite, in order.
- `engine.test.mjs`: each Origin is offered the Open five, the earned five and its own, never another Origin's;
  Between Forms, Two Riders and the capstones gate on their counts and named Milestones; The Calling takes
  either Trueborn or Wildblood; Tireless and Deep Reserves move `sfr()`; Hardline Shift makes the shift's HL
  ordinary damage; Iron Jaw puts AP on Claws and Fangs; Clear Head turns the bar into −2.
- `hostile.test.mjs`: a taken Major with a junk id, or another Origin's, renders as text and `versionCheck`
  names it.
- `smoke.test.mjs`: Progression lists a Trueborn's Majors and greys an unmet one.
- Mutation-test every new guard and name the test that catches each in the log.
