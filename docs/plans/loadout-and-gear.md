# Plan — vehicles and worn gear, in sessions

**Status:** proposed 2026-10-24 by Claude (Opus), when the player sheet's plan
closed ([`archive/sheet-wishlist.md`](archive/sheet-wishlist.md)). **Approved by
Ken 2026-10-24**, with LQ1–LQ7 on their defaults (§5) and W136 kept. Each
session's status is its row in §3; the next step is L1's work order.
**Tier of this document:** *Docs*. Each session names its own tier.

Ken, 2026-10-24: close the sheet-wishlist plan, which "has done a lot of good
work", and start a smaller one for **vehicles and worn gear modifiers**, plus
the wishes that would augment them or sit in the same code. Deighton's vehicle
data is days away, so the point of this plan is the split in §3: **four
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
- **Majors that change one weapon or armor row have no wish.** P21's
  inventory listed them as "later orders" (`archive/sheet-wishlist/P21-inventory.md`
  c20, c22–c34) and the plan closed without them: Tuned Edge's +1 damage,
  Custom Fit's PROT die a step up, Signature, Iconic and Legendary Weapon's
  Mod Slots, Weapon Expert's kicker, and the Vampire and Werewolf powers that
  change claws, fangs and melee damage. It's the same job as W69, a source
  changing a weapon line, so it's raised as **W136** and taken here.
- **The unarmed strike (W107)** is a missing line in the same attack list.

## 3. The order

| # | Session | Wishes | Tier | Waits on | Status |
|---|---|---|---|---|---|
| **L1** | Weapon damage types | W69's data step: `damageType` for the 12 firearms `0460` types as Ballistic, and a flag for the 13 it doesn't | Content (`gamedataVersion`: a handgun's line starts saying Ballistic) | Nothing for the twelve. The 13 untyped (3 bows, 8 grenades, 2 launchers) go to Deighton as one flag (LQ2) | Approved · buildable now |
| **L2** | Worn modifiers, first cut | W69 without Powered Armor: a catalog entry's modifiers to Skills (ranks only), weapons by class (ranged or melee, kinetic or energy) and by feature (SMART Link), applied while the piece is worn or in use | Rule or shape (a data shape, a decision; a schema bump if "in use" is a new stored input on gear) | Nothing blocking: Deighton's Q12–Q16 answered stacking, the cap, the energy types and the stat reach. Two items' Skills are unclear (LQ4), stubbed and flagged | Approved · buildable now, after L1 |
| **L3** | An unarmed strike | W107: a Martial Arts strike line on Loadout and Main, and Death Touch's grant on it | Content, or Rule or shape if the line needs a data shape | Nothing. Whether someone else's Death Touch pierces Natural Armor is Deighton's, asked beside F42, and doesn't block the line | Approved · buildable now |
| **L4** | One weapon or armor row, changed by a Major | W136: Tuned Edge, Custom Fit, Signature, Iconic and Legendary Weapon, Weapon Expert; and the powers on natural weapons (LQ5) | Rule or shape, character schema (a Major saves which row it changed; today a Major saves only a `power`, Decision 223) | Nothing from Deighton: Weapon Expert's text says how its kicker meets a 1d4, and P21's PQ6 answered "combat rolls" (the attacks). Reuses L2's line modifier | Approved · buildable now, after L2 |
| **L5** | Vehicles, first cut | W91 (Powered Armor included): the order was P14, [`L5-vehicles.md`](loadout-and-gear/L5-vehicles.md) | Rule or shape (a save shape: `vehicles`, a schema bump) | **Deighton:** SH3 (a typed vehicle), VK1b (the Mods number), VD1 (vehicles without PROT and RES, his in-person talk). Then the order is revised to his rulings, as its Status lists | ⏸ Shelved 2026-10-23 (Ken), until Deighton answers |
| **L6** | Powered Armor's enhancements | W69's suit half: Chipped Skill's +3 ranks (PA6), BOD-based Skills as Athletics and Survival (PA7), Enhanced Mobility doubling after every other bonus (PA8), changed between scenes (PA5) | Rule or shape | L5 (a suit is a vehicle) and L2 (the modifier). The rulings are in (PA5–PA8, both rounds) | ⏸ After L5 |

**Why this order.** L1 is a data edit that L2 reads, and small enough to ship
on its own, so the Content change doesn't wait on L2's decision review
(the old plan's "tiers kept apart"). L2 is the mechanism: one modifier, read
where it lands, with the rules Deighton set in 2026-10-10. L3 depends on
nothing and could run beside L2; it's third only because L2 is the plan's
reason. L4 reuses L2's weapon-line modifier, so it follows L2. L5 and L6 are
last because Deighton holds them.

**Dependencies.** L2 after L1 (its class address reads `damageType`). L4 after
L2. L6 after L5 and L2. L3 can move anywhere.

**What each order settles before it's written** (the 🔎 questions, so the
builder never decides them):
- **L1:** how a weapon's class is read. `style` (Blade, Blunt) on melee, the
  display string elsewhere, and "Normal" isn't one of `damageTypes`' ids. The
  order either maps the strings to ids or adds a class to the weapon; check
  every reader of `l.damageType` (the catalog line hides "Normal").
- **L2:** what "in use" means for a carried tool (LQ3), where the toggle lives,
  and how a custom row takes part (LQ6). Constraint 7: the modifier lives on the
  catalog entry, "worn" is the stored input, every number is computed. Prices
  and caps (`ipCost`, `canBoost`) keep reading the rank without the bonus.
- **L4:** how a Major points at one loadout row so that removing another row
  doesn't move it (rows are an array today), and what happens when that row is
  sold or dropped (Tuned Edge: "lost if it's significantly altered").

## 4. Not scheduled

Gear-area wishes this plan looked at and left out, with why. Each wish's own
Plan line says the same.

| Wish | Why not here |
|---|---|
| W108 magazines sized by the weapon, and combining part-used ones | Starts with the CRB: Gear would have to price magazines per weapon or say they fit by capacity (Decision 145's *Revisit if*). That's Ken's book change first, and he wanted thinking time |
| W109 a custom row opts into what a book row does | Wider than gear (spells, powers). L2's LQ6 decides whether a custom gear row carries modifiers; the rest of W109 stays on its own |
| W90 cybernetics, W61 a retired Cyborg, W127 Cyber-Prophetical | Cybernetics are gear and will be loadout rows, but they need their own plan and Deighton's six questions (W90) first, with F6 and F19. W90 builds on L5's row shape |
| W91's later half: a vehicle's damage | Integrity, Systems and the System Failure table wait on the 17 follow-ups still open (VD2c–VD6b, VK1a–VK4, VO3–VO5b, `reference/rulings-2026-10-23.md`). An order after L5, once they're answered |
| Consumables with a timed bonus (Veloxin, Somatrex, Cerebryx, Aurexa, Quickstitch) | Not worn, and "+3 then −3" breaks W69's "never negative". No wish yet: LQ7 |

## 5. Questions for Ken (LQ)

| Id | Question | Default |
|---|---|---|
| LQ1 | Is this the order, with W69 split into L2 (worn kit, now) and L6 (Powered Armor, after vehicles)? | As §3. **Ken, 2026-10-24: Default** |
| LQ2 | L1: the 13 weapons `0460` gives no damage type (3 bows, 8 grenades, the two launchers). Flag them for Deighton, or type them yourself from the book's descriptions as its author? | **One flag for Deighton.** Until he rules they stay untyped, no class modifier reaches them, and their line says nothing new. **Ken, 2026-10-24: Default** |
| LQ3 | L2: a Smart Deck is carried, not worn. Does a carried tool's bonus count while it's "in use"? | **Yes:** a gear row with modifiers gets an In use toggle; armor keeps Worn. One stored boolean either way. **Ken, 2026-10-24: Default** |
| LQ4 | L2: which Skills are "electronic interface and hacking checks" (Hacking Visor, Hacking Gloves) and "precision skill checks" (PrecisionGrip Gloves)? Interface alone, or Interface, Programming and Security? | **A flag for Deighton.** The Smart Decks (Interface, named) are computed; these three keep their text, with a `playerNote` that the GM rules. **Ken, 2026-10-24: Default** |
| LQ5 | L4: the powers that change natural weapons or melee damage while they run (Bone Spines, Rending Claws, Steel Fangs and five more, inventory c27–c34). Nothing stores that a power is running (W110). Show them as conditional marks on the line, as Decision 104 does for Natural Armor, or wait for W110? | **Conditional marks:** "+3 melee damage while Bone Spines runs", never summed. **Ken, 2026-10-24: Default** |
| LQ6 | L2: can a custom gear or armor row carry modifiers the player types, or only catalog entries? | **Catalog only** in the first cut. A typed modifier is W109's question, and balance stays the table's. **Ken, 2026-10-24: Default** |
| LQ7 | Raise a wish for the timed consumables (a bonus for the scene, then a penalty)? | **Not yet.** It's a timer, which W128 (the sheet knows when an encounter ends) would give it. **Ken, 2026-10-24: Default** |

## 6. Waiting on Deighton

One list, so it can go to him at once:

- **For L5:** SH3 (can a player type in a vehicle of their own), VK1b (does
  the sheet show a vehicle's Mods number), VD1 (vehicles without PROT and
  RES, which he wants to talk through in person).
- **For L1's flag (LQ2):** the damage type of the 3 bows, 8 grenades and 2
  launchers.
- **For L2's flag (LQ4):** which Skills the Hacking Visor, Hacking Gloves and
  PrecisionGrip Gloves add to.
- **Beside L3:** whether another character's Death Touch pierces Natural
  Armor (W107, with F42).
- **For a later vehicle-damage order:** the 17 follow-ups still open in
  `reference/rulings-2026-10-23.md`.
