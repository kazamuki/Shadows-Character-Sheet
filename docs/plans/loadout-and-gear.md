# Plan — vehicles and worn gear, in sessions

**Status:** proposed 2026-10-24 by Claude (Opus), when the player sheet's plan
closed ([`archive/sheet-wishlist.md`](archive/sheet-wishlist.md)). **Approved by
Ken 2026-10-24**, with LQ1–LQ7 on their defaults (§5) and W136 kept. **Widened
the same day** (Ken): custom weapons that read like the catalog's (W137, now
L2), and the meeting's natural attacks in the unarmed strike's session (now
L4), with LQ8–LQ10 on their defaults. Each session's status is its row in §3; the next step
is L1's work order.
**Tier of this document:** *Docs*. Each session names its own tier.

Ken, 2026-10-24: close the sheet-wishlist plan, which "has done a lot of good
work", and start a smaller one for **vehicles and worn gear modifiers**, plus
the wishes that would augment them or sit in the same code. Deighton's vehicle
data is days away, so the point of this plan is the split in §3: **five
sessions Deighton doesn't block**, which can be built while the vehicle
follow-ups are outstanding, and two that wait on him.

Sessions are `L1`… (L for Loadout). Questions are `LQ`_n_.

---

## 1. How it runs

The loop every plan uses, written once in [`../WORK-ORDERS.md`](../WORK-ORDERS.md):
a work order, pre-flighted against the code and approved by Ken, then a Sonnet
builder and a fresh Opus reviewer, with a conductor between them and Ken.
Orders live in [`loadout-and-gear/`](loadout-and-gear/), one per session,
named `L<n>-…`. **The next order is written only after the last PR merges.**

The sheet-wishlist plan's two differences from GM mode carry over:

- **Nothing here ships switched off** unless an order says so. Each session
  is a change to the released sheet, with its CHANGELOG line and versions.
- **GM mode runs beside it.** These sessions live in `sheet.js`'s Loadout,
  the engine's loadout readers (`loadoutDef`, `weaponLine`, `armorPiece`,
  `catalogLine`) and the gear half of `shadows-data.js`. Expect collisions
  only in versions, CHANGELOG's heading and decision numbers. An order says
  "the next free number", never a reserved one (`CLAUDE.md`, *Decisions*).

## 2. What the sweep found

Every open wish was read for Loadout, gear, weapons, armor, vehicles,
magazines and inventory, and so were the loadout readers in `engine.js` and
`sheet.js` and the gear data. The sheet-wishlist plan treated W69 (worn
modifiers) as one session after vehicles, because Powered Armor is the
headline case and Deighton ruled it a vehicle (Q16). **Most of W69 doesn't
need a vehicle,** so this plan splits it:

- **The gear that prints a bonus today** is all worn or carried kit, none of
  it a suit: SMARTLink Gloves ("+2 ACC when using SMARTLink-compatible
  weapons"), the Smart Decks I–III ("+1" to "+3 Interface"), the Hacking Visor
  and Hacking Gloves ("+5"/"+2 to electronic interface and hacking checks")
  and PrecisionGrip Gloves ("+2 to precision skill checks"). Probe: every
  `armor` and `equipment` entry whose `notes` print `+N` (16 of 174). The other
  nine are consumables (Veloxin's "+3 REF Skill Checks, then −3"), kits ("+1
  ACC after cleaning") and an arrowhead, which aren't worn.
- **"Kinetic or energy" has its data half-done.** `damageTypes` already gives
  every type a `resClass` (`kinetic` or `energy`), which the hit reads. A
  weapon's `damageType` is a display string instead ("Normal", "Ballistic"),
  and 25 of 54 weapons have none: 6 handguns, 6 SMGs, 8 grenades, 2 heavy
  weapons, 3 bows. `0460` types the first twelve: "**Ballistic** —
  High-velocity projectiles: firearms of all categories." It types no
  grenade, launcher or bow.
- **A custom weapon computes nothing** (Ken asked, 2026-10-24). Its row is
  eight text boxes (`WEAPON_COLS`: name, type, damage, rof, capacity, ammo,
  features, notes), and `weaponLine` reads only its capacity and fire modes.
  A catalog weapon's line (`weaponDefLine`) has a Skill and its attack
  number, damage worked out from `BOD+3`, a damage type, ACC and range. So a
  custom weapon misses every modifier L3 adds, since it has no class.
  Raised as **W137** and taken here, before L3.
- **Majors that change one weapon or armor row have no wish.** P21's
  inventory listed them as "later orders" (`archive/sheet-wishlist/P21-inventory.md`
  c20, c22–c34) and the plan closed without them: Tuned Edge's +1 damage,
  Custom Fit's PROT die a step up, Signature, Iconic and Legendary Weapon's
  Mod Slots, Weapon Expert's kicker, and the Vampire and Werewolf powers that
  change claws, fangs and melee damage. It's the same job as W69, a source
  changing a weapon line, so it's raised as **W136** and taken here.
- **The unarmed strike (W107)** is a missing line in the same attack list.
  **The 2026-10-23 meeting** ([`../reference/meeting-2026-10-23.md`](../reference/meeting-2026-10-23.md),
  Bill approved the transcript 2026-10-24) made **natural attacks** (claws,
  teeth, fists) a default of **two a round**, so the session that adds the
  fists' line also says it for the claws and fangs `archetypeWeapons` gives
  a Vampire or Werewolf.

## 3. The order

**Renumbered 2026-10-24,** the day it was approved, before any order was
drafted: W137 went in as L2, so the sessions that were L2–L6 are L3–L7.
LQ1–LQ7 below are rewritten to the new numbers; Ken's answers stand.

| # | Session | Wishes | Tier | Waits on | Status |
|---|---|---|---|---|---|
| **L1** | Weapon damage types | W69's data step: `damageType` for the 12 firearms `0460` types as Ballistic, and a flag for the 13 it doesn't | Content (`gamedataVersion`: a handgun's line starts saying Ballistic) | Nothing for the twelve. The 13 untyped (3 bows, 8 grenades, 2 launchers) go to Deighton as one flag (LQ2) | Approved · order drafted 2026-10-24, waiting on Ken's LQ11–LQ13: [`L1-weapon-damage-types.md`](loadout-and-gear/L1-weapon-damage-types.md) |
| **L2** | Custom weapons read like the catalog's | W137: a custom weapon picks its weapon type (and so its Skill and attack number), its damage type and range, and types its ACC; its line is computed like a catalog weapon's | Rule or shape, character schema (a custom row's shape changes, with a `migrate()` step for its free-text `type`) | Nothing from Deighton. LQ8 and LQ9 for Ken | Approved · buildable now, after L1 |
| **L3** | Worn modifiers, first cut | W69 without Powered Armor: a catalog entry's modifiers to Skills (ranks only), weapons by class (ranged or melee, kinetic or energy) and by feature (SMART Link), applied while the piece is worn or in use | Rule or shape (a data shape, a decision; a schema bump if "in use" is a new stored input on gear) | Nothing blocking: Deighton's Q12–Q16 answered stacking, the cap, the energy types and the stat reach. Two items' Skills are unclear (LQ4), stubbed and flagged | Approved · buildable now, after L2 |
| **L4** | Natural attacks and the unarmed strike | W107: a fists line (Martial Arts) on Loadout and Main, and Death Touch's grant on it. The meeting's two natural attacks a round, said once for the fists and the claws and fangs | Rule or shape (a numbered decision for natural attacks; Content if the line needs no data shape) | The two-a-round rule is settled. Its five details are Deighton's (§6), and the order stubs each one it can't skip. Whether another character's Death Touch pierces Natural Armor doesn't block | Approved · buildable now |
| **L5** | One weapon or armor row, changed by a Major | W136: Tuned Edge, Custom Fit, Signature, Iconic and Legendary Weapon, Weapon Expert; and the powers on natural weapons (LQ5) | Rule or shape, character schema (a Major saves which row it changed; today a Major saves only a `power`, Decision 223) | Nothing from Deighton: Weapon Expert's text says how its kicker meets a 1d4, and P21's PQ6 answered "combat rolls" (the attacks). Reuses L3's line modifier | Approved · buildable now, after L3 |
| **L6** | Vehicles, first cut | W91 (Powered Armor included): the order was P14, [`L6-vehicles.md`](loadout-and-gear/L6-vehicles.md) | Rule or shape (a save shape: `vehicles`, a schema bump) | **Deighton:** SH3 (a typed vehicle), VK1b (the Mods number), VD1 (vehicles without PROT and RES, his in-person talk). Then the order is revised to his rulings, as its Status lists | ⏸ Shelved 2026-10-23 (Ken), until Deighton answers |
| **L7** | Powered Armor's enhancements | W69's suit half: Chipped Skill's +3 ranks (PA6), BOD-based Skills as Athletics and Survival (PA7), Enhanced Mobility doubling after every other bonus (PA8), changed between scenes (PA5) | Rule or shape | L6 (a suit is a vehicle) and L3 (the modifier). The rulings are in (PA5–PA8, both rounds) | ⏸ After L6 |

**Why this order.** L1 is a data edit that L2 and L3 read, and it's small
enough to ship on its own. That way the Content change doesn't wait on a
decision review (the old plan's "tiers kept apart"). L2 comes next so that a
custom weapon has a class before L3's modifiers look for one. Otherwise "+2 to
energy weapons" would skip every weapon a player wrote in. L3 is the
mechanism: one modifier, read where it lands, with the rules Deighton set on
2026-10-10. L4 depends on nothing and could run beside L2 or L3. It's fourth
only because L3 is the plan's reason. Playtesters are fighting with Vampires
now (the meeting's case), so it can move up if Ken wants it sooner. L5 reuses
L3's weapon-line modifier, so it follows L3. L6 and L7 are last because
Deighton holds them.

**Dependencies.** L2 after L1 (a custom weapon picks from L1's damage types).
L3 after L2 (its class address reads `damageType`, on catalog and custom rows).
L5 after L3. L7 after L6 and L3. L4 can move anywhere. If L2 lands after L4,
a custom weapon can't claim to be a natural one. If L4 lands first, it doesn't
need to.

**What each order settles before it's written** (the 🔎 questions, so the
builder never decides them):
- **L1:** how a weapon's class is read. Melee weapons carry `style` (Blade,
  Blunt), the others a display string, and "Normal" isn't one of
  `damageTypes`' ids. The order either maps the strings to ids or adds a class
  to the weapon. Check every reader of `l.damageType` (the catalog line hides
  "Normal").
- **L2:** where a custom weapon's Skill comes from. `weaponCategories` has only
  an id and a name, and each catalog weapon names its own `skill`, so the order
  either gives each category its Skill (data) or lets the player pick the Skill
  (LQ8). It also settles what happens to a saved row's free-text `type`
  (LQ9), and how damage typed as `BOD+3` reaches `weaponDamage`, which already
  computes it for the catalog. A custom weapon still never claims a catalog
  `id` (constraint 6), and junk in any new field reads as empty (constraint 8).
- **L3:** what "in use" means for a carried tool (LQ3), where the toggle lives,
  and how a custom row takes part (LQ6). Constraint 7 applies: the modifier
  lives on the catalog entry, "worn" is the stored input, and every number is
  computed. Prices and caps (`ipCost`, `canBoost`) keep reading the rank
  without the bonus.
- **L4:** where "two natural attacks a round" is shown. It's one count shared
  by every natural line (claw-claw or claw-bite, never two each), so it's a
  note across the lines, not a number on each (LQ10). The rule goes in the
  data (`weaponRules` or a sibling), not in `sheet.js`. Each of Deighton's
  five open details is shown as the GM's call, never guessed. Knuckle studs
  and fist blades "add damage to the fists": that's cybernetics (W90), so the
  order notes it and builds nothing for it.
- **L5:** how a Major points at one loadout row so that removing another row
  doesn't move it (rows are an array today). Also, what happens when that row
  is sold or dropped (Tuned Edge: "lost if it's significantly altered").

## 4. Not scheduled

Gear-area wishes this plan looked at and left out, with why. Each wish's own
Plan line says the same.

| Wish | Why not here |
|---|---|
| W108 magazines sized by the weapon, and combining part-used ones | Starts with the CRB: Gear would have to price magazines per weapon or say they fit by capacity (Decision 145's *Revisit if*). That's Ken's book change first, and he wanted thinking time |
| W109 a custom row opts into what a book row does | Wider than gear (spells, powers). L2 gives a custom weapon the fields a catalog weapon has, and L3's LQ6 decides whether a custom gear row carries modifiers. The behaviour switches W109 is about stay on their own |
| W90 cybernetics, W61 a retired Cyborg, W127 Cyber-Prophetical | Cybernetics are gear and will be loadout rows, but they need their own plan and Deighton's six questions (W90) first, with F6 and F19. W90 builds on L6's row shape, and its fist blades add to L4's natural attacks |
| W91's later half: a vehicle's damage | Integrity, Systems and the System Failure table wait on the 17 follow-ups still open (VD2c–VD6b, VK1a–VK4, VO3–VO5b, `reference/rulings-2026-10-23.md`). An order after L6, once they're answered |
| A third natural attack (claw, claw, bite), and moving between targets | The meeting left both to later Milestones (Ken, Scott). Nothing is ruled yet, so there's no wish until there is |
| Consumables with a timed bonus (Veloxin, Somatrex, Cerebryx, Aurexa, Quickstitch) | Not worn, and "+3 then −3" breaks W69's "never negative". No wish yet: LQ7 |

## 5. Questions for Ken (LQ)

| Id | Question | Default |
|---|---|---|
| LQ1 | Is this the order, with W69 split into L3 (worn kit, now) and L7 (Powered Armor, after vehicles)? | As §3. **Ken, 2026-10-24: Default** (and L2 added, L4 widened, the same day) |
| LQ2 | L1: the 13 weapons `0460` gives no damage type (3 bows, 8 grenades, the two launchers). Flag them for Deighton, or type them yourself from the book's descriptions as its author? | **One flag for Deighton.** Until he rules they stay untyped, no class modifier reaches them, and their line says nothing new. **Ken, 2026-10-24: Default** |
| LQ3 | L3: a Smart Deck is carried, not worn. Does a carried tool's bonus count while it's "in use"? | **Yes:** a gear row with modifiers gets an In use toggle; armor keeps Worn. One stored boolean either way. **Ken, 2026-10-24: Default** |
| LQ4 | L3: which Skills are "electronic interface and hacking checks" (Hacking Visor, Hacking Gloves) and "precision skill checks" (PrecisionGrip Gloves)? Interface alone, or Interface, Programming and Security? | **A flag for Deighton.** The Smart Decks (Interface, named) are computed; these three keep their text, with a `playerNote` that the GM rules. **Ken, 2026-10-24: Default** |
| LQ5 | L5: the powers that change natural weapons or melee damage while they run (Bone Spines, Rending Claws, Steel Fangs and five more, inventory c27–c34). Nothing stores that a power is running (W110). Show them as conditional marks on the line, as Decision 104 does for Natural Armor, or wait for W110? | **Conditional marks:** "+3 melee damage while Bone Spines runs", never summed. **Ken, 2026-10-24: Default** |
| LQ6 | L3: can a custom gear or armor row carry modifiers the player types, or only catalog entries? | **Catalog only** in the first cut. A typed modifier is W109's question, and balance stays the table's. A custom *weapon* still receives modifiers through its class (L2). **Ken, 2026-10-24: Default** |
| LQ7 | Raise a wish for the timed consumables (a bonus for the scene, then a penalty)? | **Not yet.** It's a timer, which W128 (the sheet knows when an encounter ends) would give it. **Ken, 2026-10-24: Default** |
| LQ8 | L2: a custom weapon's Skill. Does it come from the weapon type the player picks (Handguns → Handguns, Beam Sidearms → Beam Weapons), or does the player pick the Skill? | **From the type.** Each `weaponCategories` row gets its Skill as data, read the same way for the catalog. One pick, and the attack number follows it. A type that could take either of two Skills is named in the order. **Ken, 2026-10-24: Default** |
| LQ9 | L2: a saved custom weapon's free-text `type` ("pistol", "big knife"). When the file is opened, should it be matched to a weapon type, or kept as text? | **Kept as text,** shown under the name until the player picks a type. A guess could pick the wrong Skill, and the file stays the player's. **Ken, 2026-10-24: Default** |
| LQ10 | L4: how the sheet says "two natural attacks a round" | **Once, above the natural lines** ("Natural attacks: 2 a round, any mix"), with fists, claws and fangs listed under it. Not a "×2" on each line, which would read as four. **Ken, 2026-10-24: Default** |

## 6. Waiting on Deighton

One list, so it can go to him at once:

- **For L6:** SH3 (can a player type in a vehicle of their own), VK1b (does
  the sheet show a vehicle's Mods number), VD1 (vehicles without PROT and
  RES, which he wants to talk through in person).
- **For L1's flag (LQ2):** the damage type of the 3 bows, 8 grenades and 2
  launchers.
- **For L3's flag (LQ4):** which Skills the Hacking Visor, Hacking Gloves and
  PrecisionGrip Gloves add to.
- **For L4, natural attacks' five details** (`reference/meeting-2026-10-23.md`):
  separate rolls or one; whether both fit in the one Standard Action; whether a
  Martial Arts Maneuver can be one of the two; a natural attack beside a carried
  weapon (a knife and a bite); and whether two need two free limbs.
- **Beside L4:** whether another character's Death Touch pierces Natural
  Armor (W107, with F42).
- **For a later vehicle-damage order:** the 17 follow-ups still open in
  `reference/rulings-2026-10-23.md`.
