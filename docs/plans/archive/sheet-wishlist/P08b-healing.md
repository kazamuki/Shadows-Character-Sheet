# Work order P8b: Healing (damage past zero, Dying at a Reset)

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3. **W102**, its
healing half (`WISHLIST.md`). Closes **F24, F36**. Opens no flag.
Decisions 100, 105, 151, 189 and 192; P8a's Decision 219 for the shape.
**Status:** **drafted 2026-10-15 by Claude (Opus)**, pre-flighted against
`main` after #180 (P8a merged, 0.44.0 unreleased). **Approved by Ken 2026-10-15**: PQ1–PQ4 and PQ6 on their defaults, PQ5 with
the HP pill added (§4). Ready to build.
**Branch:** from `main`; PR to `main`. Nothing ships switched off.
**The second order on the two-session trial** (`sheet-wishlist.md`, "From P8a
on"). If it holds up again, the cadence moves into `gm-mode/README.md` in the
close-out (§13).

**What P8b is.** Deighton ruled on how healing and Dying work
(`reference/rulings-2026-10-10.md` Q4, Q5). Two changes, both in recovery:

- **F36: healing counts from 0 HP.** Damage past zero is a reference for how
  bad things are while Dying, and the first healing wipes it. Today the engine
  keeps every point. A character 7 past zero who rests for 1 HP is still at
  0 HP (probe below). **A GM may keep damage past zero for grittier play, and
  the sheet goes along** (Ken): an option, off by default, stored on the
  character. That's a character-schema bump.
- **F24: Dying at a Reset is the WILL check as usual, plus a Death Mark per
  ticking source.** Today a ticking source stands in for the check, and the
  check isn't asked. GM mode's Reset copies that stub (Decision 189), so GM
  mode moves too. Unlike P8a, **this order changes `gm.js`.**

**Probes against `main`** (Professional, BOD 6: 6 Health Levels × 5 = 30 HP):

```
7 past zero:              damage 37, capacity 30, HP 0, down
Rest 1 HP:                damage 36, HP 0, down                  ← F36: should be 29, HP 1
Massive 1, 7 past zero:   damage 32, capacity 25, HP 0
Focused 3 HP + 1 level:   damage 29, capacity 30, HP 1           ← PQ3: 8 if the overflow goes first
Dying + Bleeding, Reset:  1 mark, no check, the F24 note         ← F24: 1 mark and the check
```

---

## 1. Goal

When P8b is merged:

1. **Healing from past zero starts at 0 HP.** Rest, Focused Healing, a
   Nanomed Kit, and the Heal 1 / Heal 5 steppers (PQ2) wipe damage past zero
   before they add HP. The panel says so in one line.
2. **Damage past zero shows while you're down.** Trackers' Damage card and
   Main's Health card read "0 / 30 HP" and **"7 past zero"**, and the HP pill reads **-7** (PQ5). Nothing
   shows when you're not past zero.
3. **A gritty option keeps it.** Admin has a toggle, beside TAGless, that
   keeps damage past zero, so healing counts up from the full total as it
   does today. Off by default, audited, undoable.
4. **Dying at a Reset asks the check and adds the marks.** Turn Reset asks the
   WILL check every time you're Dying, and each source that ticked is a
   Death Mark on top. A failed check is one more. GM mode's Reset does the
   same for a row.
5. **GM mode's row heal counts from 0 HP too** (PQ4). A negative Take on a row
   past zero wipes the overflow first.
6. **F24 and F36 are closed** (F24 three edits; F36 two, since it has no
   data entry). W102 moves to `wishes-granted.md`, both halves built.

## 2. Tier, versions, numbers

- **Tier: Rule or shape.** It changes what healing computes and adds a save
  field. One numbered decision, **N** (the next free number on
  `origin/main` when you write it). No new flag.
- **App: minor** (a new option and a new readout).
  - **0.44.0 still unreleased** (`CHANGELOG.md` heads `[Unreleased] — app 0.44.0`):
    no bump. P8a's minor already covers this release.
  - **0.44.0 released:** `npm run bump -- 0.45.0`, with a new `[Unreleased]` heading.
- **Game data:** what healing computes moves, and `whileDying` loses its flag
  (Decision 68).
  - **0.37 unreleased:** no bump.
  - **0.37 released:** `gamedataVersion` 0.38.
  - Say which case applied in the PR.
- **Character schema: 0.22 → 0.23.** One new field (§8a). `migrate()` adds it
  (§8b). **Table schema: no bump.** Rows store `damage` as they do now, and
  the GM gets no gritty option (PQ4).

## 3. The decision, drafted

Write this as Decision **N** in `SCHEMA.md` §4, with its INDEX §3 line under
the topic Decision 100 is filed under, and the marks in §3a.

```
N. **Healing counts from 0 HP unless the character keeps damage past zero, and Dying at a Reset is the check plus a mark per ticking source.**
     *2026-10-1x · Ken + Deighton + Claude · Touches: heal, healing, damage past zero, pastZero, discarded, houseRules, keepDamagePastZero, Admin, Rest, Focused Healing, Nanomed Kit, Heal 1, Heal 5, hlState, resolveReset, applyReset, dyingCheck, Death Mark, whileDying, resolveEncounterReset, participantDamage, Turn Reset, Dying, F24, F36, W102*
     - **Decided:** Damage past zero stays stored and shows while the character is down. The first healing that restores HP or a Massive level wipes it first, before a restored level comes back (Rest, Focused Healing, a Nanomed Kit, the Heal steppers, and a GM's negative Take on a row). `houseRules.keepDamagePastZero`, off by default and set in Admin, keeps it, so healing counts from the full total. While Dying, every Reset asks the WILL check, and each source that ticked is a Death Mark on top.
     - **Why:** Deighton's rulings of 2026-10-10 (Q4, Q5) and Ken's follow-up that the sheet goes along with a gritty GM. On the character, because the sheet works without a table.
     - **Rejected:** capping damage at zero on every write (it loses the reference Deighton wants while Dying); the option on the GM's table (the sheet works without one, and it would need a table-schema bump); wiping on a heal that restores nothing (clearing Bleeding isn't healing); a tick standing in for the check (Q5).
     - **Replaces:** Decision 100 in part (F24 closed). Decision 151 in part (Heal 1 counts from 0 HP; F36 closed). Decision 189 in part (the Reset asks the check beside the marks).
     - **Revisit if:** a table wants the gritty option for its NPCs, or playtests find the Reset too deadly.
     - **Built:** app …, game data …, schema 0.23, PR #…. Log 2026-10-1x (P8b).
```

### 3a. Supersession marks

`docs.test.mjs` reads **only the first mark** on an entry, and it must match
the INDEX line's first mark.

- **Decision 100** carries `Superseded in part by Decisions 104, 105 and 219`
  (P8a). Extend it to `Decisions 104, 105, 219 and N`, with a clause for
  F24, and its INDEX line the same.
- **Decision 151** carries no mark. Add
  `→ **Superseded in part by Decision N** — Heal 1 counts from 0 HP (F36).`
  and the same `→ **superseded in part by N**` on its INDEX line.
- **Decision 189** carries `Superseded in part by Decisions 191 and 210`.
  Extend it to `Decisions 191, 210 and N`, with a clause (Dying at a Reset
  asks the check beside the marks, F24), and its INDEX line the same.
- **Decision 192**: its **Revisit if** names F24 and F36. It isn't
  superseded: an NPC's hit is unchanged. Leave it, but say in the PR that you
  checked.

## 4. Questions for Ken

| Id | Question | Answer |
|---|---|---|
| PQ1 | **Where the gritty option lives.** W102 said "prefer the character". | **Ken, 2026-10-15: the default.** Counting from 0 HP is the rule, as Deighton picked (Q4); keeping damage past zero is the opt-in. Ken first read it the other way round and checked it against the ruling: the default stands. **On the character:** `houseRules: { keepDamagePastZero: false }`, a new top-level object, so the next per-character house rule has a home. Set in Admin beside TAGless (`sheet.js` ~2145, the precedent), audited as `Admin: keep damage past zero` / `… wipe …`. Not in the wizard. |
| PQ2 | **What counts as "the first healing".** | **Ken, 2026-10-15: the default.** **Anything that restores HP or a Massive level:** Rest, Focused Healing, a Nanomed Kit, and **Heal 1 / Heal 5** (Main's and the popover's, one binder). **The typed total and Hurt stay raw corrections** (Decision 151), and so does **Heal all** (it sets 0 anyway). A Focused Healing that only clears a Condition (0 HP, no level) wipes nothing. |
| PQ3 | **Focused Healing with a Massive level, past zero.** Probe: Massive 1, damage 32 on capacity 25. Focused 3 HP + 1 level. | **Ken, 2026-10-15: the default.** **Wipe first, against today's capacity, then heal, then the level comes back whole:** 32 → 25 → 22, capacity 30, **HP 8**. The other order (the level comes back, then the wipe) gives HP 3, because the overflow eats the restored level. "Healing counts from 0 HP" says the character is at 0 when the care starts. |
| PQ4 | **GM mode's rows.** A row stores `damage` and heals by a negative Take (`participantDamage`, Decision 189). | **Ken, 2026-10-15: the default.** **Rows follow the rule:** a negative Take on a row past zero wipes the overflow first. **No gritty option for rows.** A GM who wants it raises a W item. An NPC row's capacity is its stand-in's (`_standIn` → `hlState`); a PC row's is `_pcHealth`'s (`hp − massive × hpPer` when whole, else `hp`). |
| PQ5 | **Where "past zero" shows.** | **Ken, 2026-10-15: the default, plus the pill.** The HP pill in the vitals bar reads **-7** (over the total, as it reads HP left today: `-7/30`), already red because the character is down. **Trackers' Damage card and Main's Health card**, as a line under the headline, only while down and past zero: "7 past zero". Not on the print sheet. GM mode's row shows it where a row shows HP left: "0 HP · 7 past zero". |
| PQ6 | **Turn Reset's panel while Dying, with something ticking.** | **Ken, 2026-10-15: the default.** **Both, in this order:** the damage line, then "You're Dying, so that's 1 Death Mark.", then the Dying check box with Passed / Failed. The commit label is unchanged (`Turn Reset: 1 damage, 2 Death Marks`). GM mode's Reset row says "**Dying:** 1 source ticked: 1 Death Mark. Then <the check>." |

## 5. What this changes underneath (the assumption sweep)

Pre-flighted against `main` at #180. Each row is something that is true today
and stops being true, or a reader that has to learn the new thing. **Check
each one yourself before you build** (`grep`, a probe), and say in the PR if
any row is wrong. P8a's review found two misses of two kinds, so two
questions are asked of every row: **which guards read a value this changes?**
and **where does each new or removed note render?**

| Today | Where | After P8b |
|---|---|---|
| `heal()` heals from `hs.damage`, all of it: `healed = min(hp, damage)` | `engine.js` ~1694 | Before healing, when HP or a level is restored and the character isn't keeping it, `damage = min(damage, capacity)` against **today's** capacity (PQ3). Return `discarded` and `before`/`after` damage. `healed` stays the HP that came off after the wipe. |
| **The three panels compute their own result line:** `Damage ${hs.damage} → ${hs.damage - r.healed}` | `sheet.js` ~995 (Rest), ~1020 (Focused), ~1043 (Nanomed) | They read `r.before`/`r.after` from `heal()`, never their own subtraction (it would show 37 → 36 while the engine writes 29). With `discarded`, a line before it: "The 7 past zero go first." |
| The commit label is `+${r.healed} HP` | `sheet.js` ~3010 | Unchanged: `healed` is still the HP gained. Check the audit reads right after a wipe ("Rested 1 day: +1 HP"). |
| Heal 1 / Heal 5 add −1 / −5 to `trackers.damage` directly, through `setDamage` | `sheet.js` ~2814 `bindVitalControls` | A Heal step past zero lands at `capacity − n`, unless the character keeps it (PQ2). The engine owns the number: add `Engine.healStep(ch, n)` (or similar) that `setDamage` takes. The typed total, Hurt and Heal all stay as they are. |
| Heal 1 / Heal 5 grey out at `damage===0` | `sheet.js` ~1097, `vitalVerbsHtml` | Unchanged: past zero, damage is > 0. |
| `setDamage` trims `witheringDamage` to the new damage | `sheet.js` ~2815 | It still runs after the wipe. `heal()` does the same (~1711). Withering past zero is wiped with the rest: Withering 35 on capacity 30 → 30 after the wipe. Pin it. |
| `hlState` has no "past zero" number; `hpLeft` floors at 0 | `engine.js` ~772 | Add `pastZero: max(0, damage − capacity)`. Read by the readout (PQ5) and by `heal()`. `down` is unchanged. |
| Nothing on the sheet shows damage past zero ("0 / 30 HP", DOWN) | `sheet.js` ~1180 (Trackers), Main's Health card, the HP pill (~199) | "7 past zero" under the headline, and the pill shows `-pastZero` in place of `hpLeft`, while `pastZero > 0` (PQ5). |
| `resolveHit` and `resolveReset` add damage with no ceiling | `engine.js` ~1083, ~1758 | Unchanged: that's the reference. A hit while Dying keeps adding past zero. |
| `damagePrompts`' At Zero reads `after.down` | `engine.js` ~1038 | Unchanged. A healed character back above zero who's hit again to zero is asked At Zero again, as today. |
| **F24 stub:** `marks = ticking`, `dyingCheck` only when nothing ticked, the `whileDying.playerNote` pushed when Dying and ticking | `engine.js` ~1752 `resolveReset` | `dyingCheck` whenever Dying. `marks` is still the ticking count. No note: `whileDying` loses `flagged`, `flagNote` and `playerNote`. `applyReset` already adds a failed check's mark to `marks` (~1764): confirm, don't rewrite. |
| The Reset panel draws the marks line **or** the Dying check | `sheet.js` ~979, ~985 | Both (PQ6). The panel's notice loop (`r.notes.forEach`) stays for any future note; with F24 closed it draws nothing. |
| The Reset's Apply refuses until the Dying check is marked | `sheet.js` ~3002 | Unchanged, but now it also bites when something ticked. Pin it in the smoke row. |
| **GM mode copies the stub:** `dyingMarks` = ticking sources, `dying` (the check) only when none ticked, `dyingText` only with marks | `engine.js` ~6230 `resolveEncounterReset` | `dying` whenever the row is Dying, `dyingMarks` the ticking count, `dyingText` with marks. **`gm.js` ~2125** draws one or the other (`dyingWords`): draw both (PQ6). |
| `participantDamage` heals a row as `max(0, damage + v)` | `engine.js` ~6129 | For `v < 0`, wipe to the row's capacity first (PQ4). A positive Take is unchanged. |
| `_pcHealth` and an NPC row's `hlState` floor HP left at 0 | `engine.js` ~6416, the row view | Expose the row's past-zero number for the row's readout (PQ5). |
| `whileDying.resetText`: "Make the check at every Reset … Fail and it's a Death Mark." | data ~4160 | Still true. Add the ticking half: "Each source that ticks is a Death Mark too." Check `voice.test.mjs` passes. The quick reference reads it (`engine.js` ~5584, `_refItem` with `resetText` and `playerNote`): with the note gone, check the reference still draws. |
| SCHEMA §2's comment says `resetText` "carries F24" | `SCHEMA.md` ~484 | Drop the F24 clause. |
| `newCharacter()` has no house rules; `migrate()` doesn't know the field | `engine.js` ~40, ~3415 | `houseRules: { keepDamagePastZero: false }`. `migrate()` adds it to a 0.22 file and coerces it (`=== true`, Decision 124). `hostile.test.mjs`: a string, a number, an array, null → false. |
| **Three tests pin the F24 stub** | `rules.test.mjs` ~663 "CRB 0540 Dying … (F24 stub)", `engine.test.mjs` ~4452 "189: Dying at Reset follows the sheet's F24 stub …", `smoke-table-play.test.mjs` ~264 "… Dying shows F24's line" | Each changes to follow the ruling, keeping every assertion that isn't the stub's. Say so in the PR. |
| Healing tests that stay below zero | `engine.test.mjs` ~1542, ~1640, ~4258, ~5080; `rules.test.mjs` ~575–606; `smoke-sheet-skills.test.mjs` ~266, ~419–440 | **Unchanged: none of them starts past zero.** If one breaks, it's a *Stop and ask*. |
| Read every comment in the functions you touch (`heal`, `hlState`, `resolveReset`, `applyReset`, `resolveEncounterReset`, `participantDamage`, `bindVitalControls`) and fix any that the change makes false | — | List them in the PR. |

## 6. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- `WISHLIST.md` W102, and `reference/rulings-2026-10-10.md` Q4, Q5.
- `SCHEMA.md` §4: Decisions **100** (recovery, Turn Reset, F24 opened),
  **105** (Nanomed Kit), **151** (Main's Heal 1 / Hurt 1, F36), **189**
  (GM Reset), **192** (the NPC hit, Revisit if), **219** (P8a, the shape this
  follows), **148** (TAGless in Admin, the toggle's precedent), **124**
  (untrusted files). §5's F24 and F36 rows. §3, the character file, for
  where `houseRules` goes.
- `src/engine/engine.js`: `newCharacter` (~40), `hlState` (~772),
  `damagePrompts` (~1036), `heal` (~1694), `resolveReset`/`applyReset`
  (~1724–1775), `migrate` (~3415), `participantDamage` (~6122),
  `resolveEncounterReset` (~6204), `_pcHealth` (~6416).
- `src/ui/sheet.js`: the Reset and healing panels (~970–1048), the Damage
  card (~1180), `damageStepperHtml`/`vitalVerbsHtml` (~1094–1115), Admin's
  TAGless (~2145, ~3374), `bindVitalControls` (~2809), the act Apply (~2995–3025).
- `src/ui/gm.js` ~2105–2130 (the Reset rows), and where a row draws HP left.
- `src/data/shadows-data.js`: `damageRules.whileDying` (~4158),
  `recoveryRules` (~4170).

## 7. Out of scope

- **Damage past zero on Hurt.** Hurt and the typed total stay raw (Decision
  151). Main's Hurt 1 still greys at zero.
- **A gritty option for GM rows or the table** (PQ4).
- **Death at three marks.** The counter's `atMax` text is unchanged.
- **Regeneration rules for supernaturals.** A Vampire's or Werewolf's own
  healing goes through `heal()` if it does today, and gets the rule with it.
  Nothing new is built for it.
- **W107** (Death Touch) and the rest of the wishlist.

## 8. The shape

### 8a. Data

1. **`damageRules.whileDying`:** drop `flagged`, `flagNote`, `playerNote`.
   `resetText` gains the ticking half (§5). Keep it in tool voice.
2. `gamedataVersion` per §2.

### 8b. Engine

1. **`newCharacter()`:** `houseRules: { keepDamagePastZero: false }`, with a
   comment naming schema 0.23 and Decision N. `SCHEMA_VERSION` "0.23".
2. **`migrate()`:** a 0.22 file gets the object; any file gets
   `keepDamagePastZero: c.houseRules?.keepDamagePastZero === true`, and
   `houseRules` that isn't a plain object is replaced. Unknown keys inside it
   are dropped (Decision 124's posture).
3. **`hlState`:** add `pastZero`.
4. **`heal()`:** the wipe (§5's first row), before the HP and before the
   Massive level. Returns `{ ok, healed, restored, cleared, discarded, before, after }`,
   where `before`/`after` are damage totals.
5. **`healStep(ch, n)`** (or the name you find clearer): one Heal step for
   the steppers, applying the same wipe. Pure apart from the write, refuses
   nothing (a step at `damage 0` is the stepper's disabled state, not the
   engine's). `setDamage` in `sheet.js` calls it for a negative step only.
6. **`resolveReset`:** `dyingCheck` whenever Dying; no notes from `whileDying`.
7. **`resolveEncounterReset`:** `dying` whenever the row is Dying.
8. **`participantDamage`:** for `v < 0`, wipe to the row's capacity first
   (PQ4), then heal, floored at 0 as now.

### 8c. UI

1. **The healing panels** read `r.before`/`r.after`, with "The 7 past zero go
   first." when `r.discarded`.
2. **The readout** (PQ5): one helper for "N past zero", used by Trackers'
   Damage card and Main's Health card.
3. **Heal 1 / Heal 5** call the engine's step (§8b.5).
4. **Admin:** a toggle beside TAGless: "Keep damage past zero (grittier: healing
   counts up from the full total)". Copy is tool voice. It's a `commit("admin", …)`
   like TAGless, so it's undoable and in the activity log.
5. **Turn Reset's panel** draws the marks line and the check (PQ6).
6. **`gm.js`:** the Reset row draws both (PQ6); a row's HP readout shows past
   zero (PQ5). No other `gm.js` change.

### 8d. Docs

1. Decision N and its marks (§3, §3a).
2. **Close F24 and F36:** each §5 row says closed by Decision N; each INDEX §2
   line goes as P8a's did; F24's data flag comes off (§8a). F36 has no data
   entry.
3. **SCHEMA §3:** `houseRules`, its one key, schema 0.23. §2's
   `whileDying` comment (§5).
4. **`plans/crb-catch-up.md`:** under 0540, a line asking the book to say
   healing counts from 0 HP (and that a GM may keep damage past zero), and
   that the Reset is the check plus a mark per source. Strike F24 and F36
   from line ~198's Deighton list.
5. **W102 is granted:** move it whole to `log/wishes-granted.md`, pointing at
   Decisions 219 and N.

## 9. Worked examples, as the tests you write

Each row is a test with this name, in the file named. **Write them first and
watch them fail on `main`**, then build until they pass. A row you can't make
pass as written is a *Stop and ask*.

The character is a **Professional at BOD 6**: 6 Health Levels × 5 = 30 HP.
"7 past zero" is `damage: 37`.

| Test name | File | Setup → result |
|---|---|---|
| `P8b 1: healing counts from 0 HP` | rules | 7 past zero. Rest 1 HP → damage 29, HP 1, `discarded` 7, `healed` 1. |
| `P8b 2: a character not past zero heals as before` | engine | Damage 12. Rest 5 → damage 7, `discarded` 0. |
| `P8b 3: the overflow goes before a Massive level comes back` | engine | Massive 1, damage 32 (capacity 25). Focused 3 HP + 1 level → damage 22, Massive 0, HP 8. |
| `P8b 4: a heal that restores nothing wipes nothing` | engine | 7 past zero, Bleeding. Focused 0 HP, clear Bleeding → damage 37, Bleeding gone. |
| `P8b 5: Withering past zero is wiped with the rest` | engine | Damage 37, Withering 35. Rest 1 → damage 29, Withering 29. |
| `P8b 6: keeping damage past zero heals from the full total` | engine | `keepDamagePastZero: true`, 7 past zero. Rest 1 → damage 36, HP 0, `discarded` 0. |
| `P8b 7: a hit past zero still adds to the total` | engine | 7 past zero, Blunt 4 unarmored → damage 41, `pastZero` 11. |
| `P8b 8: Dying at a Reset is the check plus a mark per ticking source` | rules | Dying + Bleeding. Reset → `marks` 1, `dyingCheck` asked, `notes` empty. Apply with the check failed → 2 Death Marks; passed → 1. |
| `P8b 9: Dying with nothing ticking is the check alone` | engine | Dying only. Reset → `marks` 0, `dyingCheck` asked (as today). |
| `P8b 10: GM mode's Reset asks the check beside the marks` | engine | A row Dying + Bleeding → `dying` the check, `dyingMarks` 1, `dyingText` set. A row Dying alone → `dying` the check, `dyingMarks` 0. |
| `P8b 11: a GM's heal on a row past zero starts at 0 HP` | engine | An NPC row and a PC row, each 7 past zero. Take −1 → HP 1. Take +4 then −4 on a row not past zero → as today. |
| `P8b 12: house rules survive migrate and a hostile file` | engine | A 0.22 file → `houseRules.keepDamagePastZero` false, schema 0.23. `"yes"`, 1, `[]`, null → false. `true` round-trips. `newCharacter()` round-trips through `migrate()`. |
| `P8b 13: Heal 1 from past zero lands on 1 HP` | smoke | Main, 7 past zero: Heal 1 → "1 / 30 HP". Undo → 37. With the gritty toggle on → damage 36, "6 past zero". |
| `P8b 14: the Rest panel says the overflow goes first` | smoke | 7 past zero, Rest 1: "The 7 past zero go first." and "Damage 37 → 29." |
| `P8b 15: past zero shows only while down and past it` | smoke | Damage 37: Trackers and Main read "7 past zero", and the HP pill reads -7/30. Damage 30: down, no line. Damage 12: no line. |
| `P8b 16: Admin keeps damage past zero, undoably` | smoke | Admin toggle → `houseRules.keepDamagePastZero` true, the log reads "Admin: keep damage past zero", undo → false. |
| `P8b 17: Turn Reset while Dying shows the marks and the check` | smoke | Dying + Bleeding: the panel shows "1 Death Mark" and the Dying check; Apply refuses until it's marked; no unsettled notice. |
| `P8b 18: GM mode's Reset row shows the marks and the check` | smoke-table | Dying + Bleeding row: the Reset screen shows both. |

Ruling tests in `rules.test.mjs` name the ruling, not the book: "Deighton's
ruling (2026-10-10, Q4): …". Rows 1 and 8 are those.

## 10. Tests beyond §9

- **Totality:** the degenerate-character loop (`engine.test.mjs` ~1428) runs
  `heal`, the Heal step and `resolveReset` on a character with junk
  `houseRules` (a string, an array) and with damage far past zero.
- **Voice:** the new `resetText`, the Admin toggle's copy and "N past zero"
  pass `voice.test.mjs`.
- **Mutation-test**, each must fail a test, in the log and the PR:
  the wipe after healing instead of before; the wipe after the Massive level
  comes back; the wipe on a heal that restores nothing; `keepDamagePastZero`
  ignored; the F24 check asked only when nothing ticked (the old line); the
  panels computing `hs.damage - r.healed` again; `participantDamage` without
  the wipe.

## 11. Steps

1. `npm run test:fast` on a fresh branch from `origin/main`, with `private/`
   mounted (`git submodule update --init private`). Note the totals.
2. **Write §9's engine and rules rows. Run them on `main`'s code and keep the
   output**: each must fail, or say why it already passes (row 2 and row 9
   pass today: say so).
3. Data §8a, engine §8b. `npm run test:fast`.
4. UI §8c with §9's smoke rows.
5. **Run it in the dev preview** (`shadows-dev-preview`). This was skipped on
   P8a, so it isn't optional here: a character 7 past zero rests 1 HP; a
   Dying character with Bleeding takes a Reset; the Admin toggle. Screenshots
   if you can attach them; if not, say what you saw.
6. Docs §8d, Decision N, CHANGELOG, `npm run changelog`, versions per §2.
7. `npm run verify` and `npm run phone-check`.

## 12. Stop and ask

- A row of §5 turns out to be wrong, and the fix isn't a line or two.
- A test outside §5's list breaks.
- `gm.js` needs more than §8c.6.
- The table's save shape would have to change.
- A healing path that doesn't go through `heal()` or the Heal steppers turns
  up (a power, a regeneration, an Admin edit), and §8 doesn't say whether it
  wipes.

## 13. Close-out

The **close-the-session** skill, Rule-or-shape tier: Decision N and its
marks, the two closed flags, the schema bump in SCHEMA §3, STATE rewritten
(W102 built; the next order), the log entry with the mutants, `shipped.md`'s
row, W102 to `wishes-granted.md`, CHANGELOG plus `npm run changelog`,
versions per §2, the plan's P8b row. **And the trial:** if Ken says the
two-session loop held up, move its paragraph from `sheet-wishlist.md`
("From P8a on, on trial") into `gm-mode/README.md`'s cadence.

Suggested CHANGELOG lines (player voice):

- **Healing starts from 0 HP.** Damage past zero shows how close you came
  while you're down, and the first healing wipes it: rest a day at 7 past
  zero and you're back on your feet with what you healed. A GM who plays it
  gritty can keep it, in Admin.
- **Dying at a Reset asks the WILL check every time**, and Bleeding or
  Burning ticking is a Death Mark on top.

## 14. Review checklist

- [ ] §9's eighteen tests exist with those names, and the PR shows the engine
      and rules rows failing on `main`'s code (rows 2 and 9 excepted, and said).
- [ ] §5's rows are each confirmed or corrected in the PR.
- [ ] The wipe happens in the engine only (`heal`, the Heal step,
      `participantDamage`); no panel subtracts on its own.
- [ ] Schema 0.23 with a `migrate()` step; `hostile.test.mjs` covers the field.
- [ ] `gm.js` changed only as §8c.6 says.
- [ ] Decisions 100, 151 and 189 marked; F24 and F36 closed; W102 granted.
- [ ] The dev-preview run happened (§11.5).
- [ ] Mutants in the PR **and** the log.
- [ ] `npm run verify` and `phone-check` green; versions per §2, and the PR
      says which case.

## 15. Handing it over

Two fresh sessions, both started by Ken. They talk to each other directly,
and Ken is in both.

### 15a. The builder (Sonnet)

Start it with the title **P8b build**, and paste:

> Read `CLAUDE.md`, then `docs/plans/sheet-wishlist/P08b-healing.md`, and
> build it. Ken's answers to PQ1–PQ6 are in its §4 (five on their defaults; PQ5 adds the HP pill). Follow its steps (§11) in
> order and its *Stop and ask* list (§12) exactly. If something isn't covered
> by the order, stop and ask me rather than choosing. Where the order and the
> code or the ledger disagree in a way that doesn't stop you, build what the
> order says and list it in the PR under *Where the order didn't fit*. Open a
> PR when §14's checklist holds; don't merge it.
>
> **Every claim in the PR about how the code behaves names the command or
> test that shows it** ("X doesn't run Y: `grep …`", "fails on `main`: test
> output"). A claim with no evidence is a finding in review.
>
> When the PR is open, say so here. A reviewer session will message you with
> findings. Fix them, push, and message it back with what you changed and the
> evidence for each.
>
> Six things in this order are easy to get wrong:
>
> 1. **The wipe is against today's capacity, before the HP and before a
>    Massive level comes back** (PQ3). The other order gives a different
>    number, and both look plausible.
> 2. **The panels must stop doing their own subtraction.** Rest, Focused and
>    Nanomed each print `hs.damage - r.healed`; after the wipe that's wrong.
>    They read `heal()`'s `before`/`after`.
> 3. **Heal 1 / Heal 5 bypass `heal()` today.** They write `trackers.damage`
>    in `bindVitalControls`. Give them an engine step; don't copy the wipe
>    into the UI.
> 4. **A heal that restores nothing wipes nothing** (clearing Bleeding at
>    0 HP isn't healing).
> 5. **GM mode's Reset copies F24's stub** in `resolveEncounterReset` and
>    `gm.js`'s `dyingWords`. Both move. This order does change `gm.js`, but
>    only there and in a row's HP readout.
> 6. **Three tests pin F24's stub** (§5). Change them to follow the ruling
>    and say so in the PR. Don't touch any other failing test without
>    stopping.
>
> Tier: Rule or shape. One numbered decision (the next free), no new flag.
> Character schema 0.23 with a `migrate()` step. App and game data per §2.
> Use the close-the-session skill at the end.

### 15b. The reviewer (Opus), once the PR is open

Start a fresh Opus session and paste, with the PR number filled in:

> Review PR #<n> adversarially against
> `docs/plans/sheet-wishlist/P08b-healing.md`: the order, not just the diff.
> Check the order's §5 sweep yourself and look for what it missed, the way
> #180's review found `soaked` reading the halved damage and Freezing's note
> with nowhere to render. Run the tests and probe the behaviour against
> `main`; don't take the PR's claims on trust. First mount the CRB mirror
> (`git submodule update --init private`): a fresh worktree doesn't have it,
> and without it every CRB-mirror test fails for a reason that has nothing to
> do with the PR.
>
> For the mechanical parts, such as running the full suite and sorting
> environmental failures from real ones, or a read-only sweep like "list
> every place that writes `trackers.damage`", use a Haiku subagent. Its
> results are leads, not findings: check anything you report yourself.
>
> Post the review on the PR: must-fix and should-fix as inline comments, on
> lines inside the diff (GitHub refuses others; name the real line in the
> comment). **Nits you fix yourself in one commit on the PR branch, and say
> so in the review**; don't send them back.
>
> Then find the builder session with `ListAgents` (its title is **P8b
> build**) and message it that the review is posted, with the must-fix and
> should-fix items. When it messages back, **re-review narrowly**: its fix
> commits against your findings, plus whether a fix touched anything else.
> Don't re-review the whole PR. When nothing must-fix or should-fix is left,
> tell Ken it's ready to merge.
>
> If you can't reach the builder, tell Ken and he'll relay.
