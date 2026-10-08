# Work order P4 — The Vampire, to `0413`

**Plan:** [`../crb-v4-sync.md`](../crb-v4-sync.md) §1 (the `0413` row), §2 (P4), §3 (a power with ranks).
Decisions 152 (Supernatural buys Universal only), 157 (5 CP a power rank), 194 (every power has a rank;
`progression.powerIpe`), 195 (a toggle option carries what being in it does), 196 (the Werewolf's kit, the
pattern this follows), 197 (Stat Bonus on Focus Stats).
**Status:** **proposed 2026-10-08**, for Ken. Nothing is built. §4's answers come first.
**Branch:** a new session, from `main` after P1 (#135) merges. PR to `main`.
**Tier:** *Rule or shape*. **Propose before building:** this order is the proposal.

**What P4 is.** The book wrote the Vampire on 2026-10-07; it was a forty-line stub. The app's Vampire is
`status: "tbd"`: no scaling row, no traits, no Bloodlines, a Blood Pool tracker with no maximum, no powers. P4
takes it to `draft`: the data to `0413`, every power on P2's ranked shape, and as much of the Thirst made
mechanical as §4 says. **It is bigger than P3**, because unlike the Werewolf a Vampire *chooses* its powers
at creation (F39), and two of its Bloodlines carry creation picks (the Draugur's weapon and Code).

---

## 1. What `0413` says, and what the app has

Read `private/crb/0413_Vampire.md` whole before starting. This table is a map, not a substitute.

| `0413` | The app today (`vampire`) | P4 |
|---|---|---|
| **Scaling:** Stat Bonus 1d4 / 2d4 / 3d4 / 4d4; SFR WILL × 3 + 8 / 14 / 20 / 26; RoU 4 / 6 / 8 / 10; Base Powers 2 / 3 / 4 / 5; Max Starting Rank 1 / 2 / 2 / 3 | `byPowerLevel: {}` | The whole row. Stat Bonus is `focusStatBonusRoll` on BOD, REF, MOB, past 10 (Decision 197's reader) |
| **Baseline traits:** Supernatural, **Pain Immunity** (no pain penalties from ordinary damage; sunlight still hurts), **Sanguine Harvest** (bite a grappled or helpless target, drain HL for SFR), **Fangs of the Fallen** (bite: Melee, BOD+3; feeding effects on mortals) | `[]` | Data. Pain Immunity is VQ22; the bite is VQ26 |
| **Bloodlines:** Strigoi (Masked / Unmasked, Glamour, Every Mind at the Table), Upyr (Frozen Fire, Built to Last), Draugur (The Ancient Weapon, a three-row table; The Code, three tenets and a three-row example table) | `options: []` | Three options with `features`. The Draugur's picks are VQ24 |
| **Core Mechanic, the Thirst:** Hunger (lose ½ RoU SFR a day unfed; at SFR ≤ RoU a WILL check, TN 7 TH 1, or Blood Frenzy); Feeding (3 SFR per HL fresh, 2 stored, stored only to half max; a full turn per HL) | `Blood & Hunger`, "TBD.", a `blood-pool` tracker, `max: null` | VQ21 |
| **Innate powers** (4): Bestial Blessings, Vitality Surge, Preternatural Speed (no ranks), Cursed Evolution | None | Data, ranked, max 5 (Preternatural Speed: none; Cursed Evolution: 3) |
| **Bloodline powers:** Strigoi 6 (three Masked, three Unmasked), Upyr 6, Draugur 6. Printed maxima 3, 4 or 5 | None | Data, ranked, `maxRank` as printed: a creation cap only (VQ5, VQ14) |
| **Vulnerabilities:** Sunlight and UV (1d4 Withering a round), Consecration, Staking, Day Rest, Blood Frenzy (its trigger, effects and how it ends) | `[]` | Data |
| **Growth:** 24 Vampire Major Milestones; Minors shared | `majorMilestones: []`, which nothing reads | **P4b** (VQ27), on P3b's engine |

**Ids are permanent** (constraint 6). `vampire` stays. New ids, fixed once shipped: `strigoi`, `upyr`,
`draugur`; powers by kebab-case name (`bestial-blessings`, `shadow-play`, `iron-hide`, `odins-aegis`…). No
collision with the Werewolf's 23 or the three Disciplines, since `progression.powerIpe` keys them all
(checked 2026-10-08). The `blood-pool` panel id has never held a value a file needs (`max: null`); P4 retires
it for an `sfr` panel, and `migrate()` drops a stray `trackers.panel["blood-pool"]` if it finds one.

## 2. F39, stubbed

F39 (Deighton/Scott): how Base Powers are spent. **Stub, the book's literal reading:** one Base Power is one
rank, placed on an Innate power or one of your Bloodline's, none above Max Starting Rank. A Street Vampire
places 2 ranks at rank 1 at most, so holds two powers; a World Coming Down one places 5, up to rank 3. A power
with no ranks (Preternatural Speed) takes one Base Power to hold. Unspent Base Powers block lock, as every
other pool does (Decision 162). A `playerNote` says it's the GM's call for now. **This needs a stored input**
(VQ20): the ranks placed at creation.

## 3. The shape, proposed

- **Powers:** `archetypes[].powers`, as the Werewolf's (Decision 196): `{ id, name, cost, effect, perRank,
  maxRank, steps?, origin? }`, with `origin` naming a Bloodline (the key keeps its name: it's the
  specialization option's id). **Unlike the Werewolf, a power is held only if ranks were placed in it**: its
  rank is the creation ranks + `powerIpeOf(ch, id)`. That's the one shape change in `powerRanks()`: an
  archetype says whether it `holdsAll` (Werewolf) or `buysWith: "basePowers"` (Vampire).
- **Creation:** a **Powers** block on the Archetype step, as the Arcanist's Disciplines are bought, spending the
  scaling row's Base Powers. Stored as `archetypeChoices.basePowers: { [powerId]: ranks }`. **Character schema
  0.18 → 0.19**, `migrate()` adds `{}` and drops junk (non-power ids, non-numbers, a rank past the row's cap).
- **The Thirst:** see VQ21. The SFR tracker's max is WILL × 3 + the row's number, as the Werewolf's is.
- **Bloodline parts:** each option gets `features` (text, with the Draugur's two tables as `rows`).
- **Versions:** game data bumps; character schema bumps (§2); the app's minor carries it.
- **A saved Vampire** may exist: `validate()` only *warns* on a `tbd` archetype (`archetypeUnwritten`), so a
  locked one with no Bloodline is possible. `migrate()` leaves it loadable; locked, it keeps no Base Powers and
  shows the Bloodline as unchosen (Admin can set it). Check what a locked one looks like before building.

## 4. Questions for Ken (`VQ` continues the plan's numbering)

| Id | Question | Recommended |
|---|---|---|
| **VQ20** | F39's stub: one Base Power = one rank, on Innate or own-Bloodline powers, none above Max Starting Rank, stored as `archetypeChoices.basePowers` (schema 0.19)? | Yes. It's the book's sentence read literally, and the stored shape survives either answer from Deighton (a "one power per Base Power" ruling just caps each at 1) |
| **VQ21** | **The Thirst:** how much is computed? (a) SFR tracker with its max; (b) a **Feed** control: Fresh or Stored, n HL, adding 3 or 2 a HL, stored stopping at half max; (c) a line when SFR ≤ RoU: "Hunger: WILL check, TN 7 TH 1, or Blood Frenzy"; (d) a **A day unfed** button that takes ½ RoU | (a)–(d), all of it. Each is a number the book states and the sheet already holds; the app still never rolls or knows the date. Blood Frenzy itself stays text |
| **VQ22** | **Pain Immunity:** compute it? The sheet would show no Pain from Health Levels lost for a Vampire, so no Pain penalty on checks, while Conditions' own Pain still counts (sunlight's is the exception the book names, and Withering isn't Pain) | Compute the HL-band half only, and flag the Condition half: whether Agonized and the like still hurt a Vampire is a rules question (**F40**, for Deighton) |
| **VQ23** | Strigoi Masked / Unmasked, and the sustained powers (Veil of Night, Iron Hide, Cold Embrace, Blood of Valhalla, Spectral Veil): toggles that track what's running, or text? | Text. They're table actions with no number the sheet derives; Iron Hide's Natural Armor is the exception, and it's VQ25 |
| **VQ24** | **Draugur picks:** the Ancient Weapon (Blade / Blunt / Spear) stored at creation and shown as a weapon line; the Code as three text fields (Hunt, Bond, Word); **Code broken** a toggle that shows "+1 TH on every Essence check until amends" | Yes to all three. The weapon is a catalog-shaped line like the Werewolf's claws; the tenets are the player's words, like a Custom archetype's (Decision 153). Stored under `archetypeChoices` (same schema bump) |
| **VQ25** | Iron Hide and Icebound Resilience give Natural Armor while running (Decision 104's conditional `while` grant, as Resilient Spirit was). Upyr's "Built to Last: choose one; these don't stack": a creation pick, or two powers that don't stack? | Two powers, shown as conditional Natural Armor that's asked for on a hit (Decision 104), and "don't stack" as text. If Ken reads "choose" as a creation pick, that's a rules question for Deighton (**F41**) |
| **VQ26** | The bite (Fangs of the Fallen: Melee, BOD+3) and Bestial Blessings' claws (BOD+3, AP): weapon lines on Main? | The bite always; the claws marked "with Bestial Blessings". Rank adds to the claws' damage (+1 a rank) |
| **VQ27** | The 24 Vampire Major Milestones: P4, or **P4b** on P3b's engine (archetype Majors, Bloodline prerequisites, Major counts)? Blood Conditioning (+2 RoU) and Growing Hunger (+6 SFR) are P3b's Tireless and Deep Reserves again | P4b, after P3b. Pure Blooded, Splice and Cursed Evolution's second bloodline (VQ4: the New Power price) go there too, since they gate each other |

## 5. Read first

`CLAUDE.md`; `docs/STATE.md`; this order; `private/crb/0413_Vampire.md` whole; Decisions 104, 152, 157, 162 and
194–197 in SCHEMA §4; the Vampire and Werewolf entries in `shadows-data.js`; `powerRanks`, `powerAllowance`
(which reads `basePowers`), `naturalArmor`, `painState`, `archetypeContent` and the Disciplines' CP buy in
the engine; the Archetype step in `wizard.js`; the tracker panels in `sheet.js`.

## 6. Out of scope

The Major Milestones (P4b). Cursed Evolution's and Splice's other-bloodline powers (P4b). Ghouls and Kiss of
Night. Rolling anything. Summoned minions. The book's slips go to `crb-catch-up.md`, not into the data: the two
empty `## ` / `### ` headings and the empty table under the Core Mechanic; Blood Frenzy's "(T7, S1)" against
Hunger's "TN 7, TH 1"; "to to"; "desparate"; "your to decide"; "Centuries of patients"; the empty Milestones row;
Odin's Aegis's missing full stop; Day Rest's "+2 to that day's Thirst", when the Thirst isn't a number (is it
+2 SFR lost?).

## 7. Stop and ask

If a stored input outside `archetypeChoices`, `powerIpe` and `trackers.panel` turns out to be needed; if Pain
Immunity would change Pain for any other archetype; if the book and this order disagree (the book wins, and say
so); if a locked saved Vampire can't be made to load cleanly.

## 8. Tests

- `rules.test.mjs`: the scaling row read from `0413` against the data; every power's name, cost and Per Rank by
  Bloodline, read from the file (as R15 does for `0414`); the Feed numbers (3 fresh, 2 stored, half max).
- `engine.test.mjs`: Base Powers spend and cap (none above Max Starting Rank, own Bloodline and Innate only);
  `powerRanks` lists placed powers only; a raise lands on `powerIpe`; the schema 0.19 round trip and junk
  `basePowers`; Feed and A day unfed clamp; Pain Immunity zeroes HL-band Pain for a Vampire and no one else.
- `hostile.test.mjs`: junk `basePowers`, a junk Bloodline, a junk Ancient Weapon and Code text render as text.
- `smoke.test.mjs`: the Bloodline step offers three; the Powers block spends Base Powers; lock waits on them;
  the Character tab shows ranks; Feed and the Hunger line on Main.
- Mutation-test every new guard and name the test that catches each in the log.

## 9. Close-out

Decisions numbered per `number-a-decision` (likely: the Vampire's kit and Base Powers; the Thirst; Pain
Immunity), F7 closed (its Vampire half was the last), F39 stubbed in the data, F40 and F41 opened if §4 says
so; game data and character schema bumped; CHANGELOG lines; STATE's Vampire row rewritten; the plan's P4 row
ticked; a log entry and a shipped row. `crb-catch-up.md` gets §6's slips.
