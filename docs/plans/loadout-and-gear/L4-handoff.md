# L4 handoff: what L3 and L2b leave for natural attacks

*Written 2026-10-28 by the L3 and L2b conductor, for the session that drafts
L4 on Friday 2026-10-30.* L4 was next in the plan, but Ken held it until
Thursday's weekly dev meeting (2026-10-29), which has natural weapons on its
agenda. **Read the meeting's notes first.** This page gives what the last two
orders taught and what they left in L4's way, so those notes can go straight
into L4's draft. It decides nothing.

The plan row is L4 in [`loadout-and-gear.md`](../loadout-and-gear.md) §3. What
it settles before it's written is §3's "What each order settles" entry, and the
five open details are in §6. W107 is the wish. The 2026-10-23 meeting is
`docs/reference/meeting-2026-10-23.md`.

## 1. Where main stands

- **L3** (PR #257, Decision 248): worn armor and in-use gear carry `grants`
  (`checkMod`, `weaponBonus`). A weapon's class (melee or ranged, kinetic or
  energy) is data. It's melee by its Skill's `melee: true`, which is now on
  Melee and Martial Arts (LQ19). Kinetic or energy comes from its damage type's
  `resClass`. F49 is open (the Hacking Visor's, Hacking Gloves' and
  PrecisionGrip Gloves' Skills).
- **L2b** (PR #259, Decision 249): a written-in weapon ticks its fire modes from
  `rofModes`. One with a weapon type reloads from carried ammunition that fits
  it.
- Versions: app 0.56.0, which is still under `[Unreleased]` and holds both
  orders (L4's changelog lines join it unless 0.56.0 has shipped by then), game
  data 0.50, character schema 0.31. The next free decision is **250** and flag
  **F50**, as of `dc983e3`. Re-check both on `origin/main` when the order is
  drafted.

## 2. What the code already has, which L4's draft must account for

Natural weapons aren't new to the engine. L4 adds the fists and the
two-a-round rule, and it must join these paths, not build a third one:

- **`archetypeWeapons(ch)`** (engine, Decision 200) covers natural weapons an
  archetype gives. These are a trait's (Fangs of the Fallen's bite), a held
  power's (with `perRank` damage) and a creation choice's, with `offWhen` to
  silence one. Sheet: `sheet.js` ~2450.
- **`formView(ch)`** (engine, Decision 195) covers a form's `naturalWeapons`
  (a Werewolf's shifted claws), computed the same way. Sheet: `sheet.js`
  ~2414–2430.
- **Loadout's `weaponLine(ch, index)`** covers carried weapons, indexed into
  `weapons`.

**The gap L3 left, which L4 should close or name:** L3's `weaponClass` and
`weaponBonus` take a **loadout index**. They reach only carried weapons.
Neither an archetype's claws nor a form's fangs gets a worn bonus today, and
neither would a fists line built the same way. So "+2 to melee weapons" from
worn kit skips a Vampire's claws. Whether natural attacks *should* take a
worn melee bonus is a rules question. It belongs to the meeting or to
Deighton, not to the builder. Either answer needs a class read that isn't
indexed into `weapons` (by Skill and damage type, which is what `weaponClass`
reads anyway).

Other points the draft will meet:

- **Death Touch** is text on True Warrior's Power Style (data ~2750). Iron
  Shirt, on the same style, already has `grants: naturalArmor` (~2756). W107's
  shape is to give Death Touch a grant the same way, never stored as "on", with
  the fists line reading "AP with Death Touch" (Decision 104's conditional
  pattern).
- **Martial Arts styles** add to a maneuver's check unarmed only
  (`maneuverChecks`, Decision 229). The fists line is where
  "unarmed" finally has a weapon to stand on, so the order should say whether
  the line shows a style's maneuver bonus or leaves it to the check.
- **A written-in weapon can't be natural.** The plan's dependency note says so:
  L2 landed first, so a custom row has no "natural" claim and doesn't need one.
  Fist blades and knuckle studs are cybernetics (W90), so L4 notes them and
  builds nothing for them.
- **LQ10 is answered (Default):** the sheet says "Natural attacks: 2 a round,
  any mix" once, above the natural lines, never "×2" on each. Those lines come
  from three places today (Loadout, the archetype, the form), so the order must
  say where that one heading sits.

## 3. For Thursday's meeting

§6's five details are still the open ones. Each answer the meeting gives
removes a stub from L4:

1. Is it separate rolls, or one?
2. Do both attacks fit in the one Standard Action?
3. Can a Martial Arts Maneuver be one of the two?
4. Can a natural attack go beside a carried weapon (a knife and a bite)?
5. Do two attacks need two free limbs?

Also listed beside L4: does another character's Death Touch pierce Natural
Armor (W107, F42)? And the new one from §2: **do worn melee bonuses reach
natural attacks?**

A third attack (claw, claw, bite) and moving between targets were left to
later Milestones. There's no wish for them until something is ruled.

## 4. How the last two orders went (for the L4 order and its sessions)

**What the orders missed:**
- **The ledger cap.** The 350-word limit applies only to Decisions 124 and
  later. `docs.test.mjs` parses only an entry's **first** supersession mark, so
  a decision that supersedes an old one in part extends that mark rather than
  adding a second. L2b's order didn't say so, and its builder trimmed Decision
  145's Rejected text to fit. A merged entry is never rewritten beyond its
  marks. The L4 order should say so if it supersedes anything (Decision 104 or
  200 are the likely ones).
- **Unstated edge behaviour.** L2b implied what unticking the last fire mode
  does without spelling it out. It surfaced in review, and Ken accepted it as
  built. L4's order should state its edges: no natural attacks at all, a form
  that silences the archetype's bite (`offWhen`), and a character with fists
  only.
- **Readers.** As in every sweep before them, the misses were readers nobody
  remembered. In L3, the written-in weapon's edit row read the line's ACC,
  which by then included the worn bonus. Grep every reader of a field the
  order changes.

**What the builds missed:**
- L2b trimmed a merged decision (above), which the reviewer restored.
- Voice strings crossed the conductor's resend twice: the builder had already
  pushed them. Before resending, check the branch head.

**Ken's habits these two orders showed:**
- He took the reviewer's voice wording on every item in both reviews, and the
  default on every LQ. He decides quickly when the recommendation leads.
- He found L2b's gap himself, using the app. Expect him to try a fists line on
  a real character before he merges.

**Polish note, not L4's:** the fire-mode checkboxes (the existing `label.check`
style) sit about as close to the next mode's name as to their own. It's worth a
wish if Ken agrees.
