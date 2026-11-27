# Plan — loadout and gear, v2: what's left

**Status:** drafted 2026-11-27 by Claude (Sonnet), at Ken's request, when the first plan's built sessions were archived. **Nothing here is built or approved to build:** each session waits on an answer from someone else (§3). **Tier of this document:** *Docs*. Each session names its own tier.

[`archive/loadout-and-gear.md`](archive/loadout-and-gear.md) is the first plan, kept as history with its orders in [`archive/loadout-and-gear/`](archive/loadout-and-gear/). It built L1 weapon damage types (data only, F48), L2 custom weapons (247), L2b their fire and reload (249), L3 worn modifiers (248, F49), L4 natural attacks and the unarmed strike (290), L5 a Major on a row (263) and L5b powers on natural weapons (292). Its LQ1–LQ48 are answered there, and its sweep (§2) and *What each order settles* (§3) are the place to read how those sessions were shaped. Vehicles (L6) and Powered Armor (L7) left it on 2026-11-15 (Ken) and are W91 and W69's suit half; the shelved L6 order is archived beside the rest. Their ids, and L1–L5b's, are never reused.

Sessions keep their old ids, **L8–L10**, so a citation in a decision, a log entry or a wish still lands. Questions are `LQ`_n_, as before.

---

## 1. How it runs

The loop every plan uses, written once in [`../WORK-ORDERS.md`](../WORK-ORDERS.md): a work order, pre-flighted against the code and approved by Ken, then a Sonnet builder and a fresh Opus reviewer, with a conductor between them and Ken. Orders will live in `loadout-and-gear-v2/`, one per session, named `L<n>-…`. **An order is written only when its blocker clears**, and only after the last PR merged.

Nothing here ships switched off unless an order says so. Each session is a change to the released sheet, with its CHANGELOG line and versions. These sessions live in `sheet.js`'s Loadout, the engine's `naturalAttacks`, `archetypeWeapons` and `weaponLine` readers, and the form data's `naturalWeapons`. Expect collisions only in versions, CHANGELOG's heading and decision numbers; an order says "the next free number" (`CLAUDE.md`, *Decisions*).

**What a natural weapon is now (Decision 290).** A weapon's `kind` puts it in the natural group; the group is two attacks a round, any mix, said once above the lines. L8–L10 each change or add a line in that group, so each reads L4's shape and L5b's `attackMod` grants (Decision 292). A fixture diff of every archetype, form and power's weapon lines before and after is how the last order checked it did no harm; W164 on [the wishlist](../WISHLIST.md) is the tool for it.

## 2. The sessions

| # | Session | Wishes | Tier | Waits on | Status |
|---|---|---|---|---|---|
| **L8** | The Werewolf's claw and bite damage | LQ40: Deighton is testing BOD+4/+5 against straight BOD with SFR adding the bonus, at his table. Today the form's `naturalWeapons` say BOD+8 claw and BOD+10 fangs | Content (two numbers in the form's `naturalWeapons`; `gamedataVersion`) | **Deighton**, his table report | Waits on Deighton |
| **L9** | A trained weapon that counts as natural | W160: Deighton's eskrima sticks join the natural group | Rule or shape (which weapons qualify, and where the sheet reads the training) | **Deighton**, a ruling: floated at the 2026-11-12 meeting, not ruled | Waits on Deighton |
| **L10** | Hand cyberware as natural weapons | W90's natural-weapon part: knuckle studs +3, punch spike +6, tri-claws +8 (proposed), stacking adds to BOD once; each a data `kind`, so it joins the natural group and a worn melee bonus reaches it | Rule or shape, with W90's own plan | **W90**: Deighton's six cybernetics questions, F6 and F19. Built inside W90's plan or after it | Waits on W90 |

**Why this order.** It's the order of how soon each blocker might clear, not a build order: L8 is two data edits the day Deighton reports, L9 needs a ruling and then a rule, L10 needs a whole plan that doesn't exist. None depends on another. L8 and L9 can run in either order. If W90's plan puts cyberware somewhere other than a loadout row, L10 is rewritten with it.

**What each order settles before it's written.**
- **L8:** nothing: Deighton's numbers are two data edits. Check every reader of the form's `naturalWeapons` (the Loadout, Main and print lines, `archetypeWeapons`), and the Werewolf's powers that add to a bite or claw (Steel Fangs, Serrated Claws, Let It Loose), which compute on top.
- **L9:** which weapons count, and where the sheet reads that a character is trained with one (W160). Deighton's to rule first. A custom weapon (L2) still never claims a catalog `id`.
- **L10:** whether a cyberware row is a loadout row, a new list or a trait, which W90's plan decides; L10 then gives it a `kind`. Knuckle studs and fist blades "add damage to the fists" (L4's note), so the fists' line is where they land.

## 3. Waiting on Deighton

One list, so it can go to him at once:

- **For L8:** his table's verdict on the Werewolf's claw and bite damage (LQ40).
- **For L9:** whether a trained weapon counts as natural, and which (W160).
- **For L10:** W90's six cybernetics questions.
- **Neither blocks anything built:** Bone Spines' "+5 while grappling" (does it replace the +3 or add to it, and does a rank add to it: F55); after Ken's CRB pass, what the book's "AP 2" and "AP 3" mean (LQ46, `crb-catch-up.md`); F42, which damage Resistance answers; F48, the damage types of the ten untyped weapons; F49, the Skills of the Hacking Visor, Hacking Gloves and PrecisionGrip Gloves.
- **Off the plan, for W91:** SH3 (a typed vehicle), VK1b (the Mods number), VD1 (vehicles without PROT and RES, in person), and the 17 follow-ups in [`../reference/rulings-2026-10-23.md`](../reference/rulings-2026-10-23.md).

## 4. Not scheduled

Gear-area wishes the first plan looked at and left out, with why. Each wish's own Plan line says the same.

| Wish | Why not here |
|---|---|
| W91 vehicles, Powered Armor among them, and W69's suit half | Off the plan 2026-11-15 (Ken): they wait on Deighton's vehicle follow-ups (SH3, VK1b, VD1 and the 17 still open in `reference/rulings-2026-10-23.md`). The shelved order is [`archive/loadout-and-gear/L6-vehicles.md`](archive/loadout-and-gear/L6-vehicles.md); revived, it's re-pre-flighted against `main` first |
| W108 magazines sized by the weapon, and combining part-used ones | Starts with the CRB: Gear would have to price magazines per weapon or say they fit by capacity (Decision 145's *Revisit if*). That's Ken's book change first, and he wanted thinking time |
| W109 a custom row opts into what a book row does | Wider than gear (spells, powers). L2 gave a custom weapon the fields a catalog weapon has, L2b its fire and reload, and L3's LQ6 kept custom gear modifiers out. The behaviour switches W109 is about stay on their own |
| W90 cybernetics, W61 a retired Cyborg, W127 Cyber-Prophetical | Cybernetics are gear and will be loadout rows, but they need their own plan and Deighton's six questions (W90) first, with F6 and F19. Its hand cyberware is a natural weapon (L10) |
| A third natural attack (claw, claw, bite), and moving between targets | The meeting left both to later Milestones (Ken, Scott). Nothing is ruled yet, so there's no wish until there is |
| Consumables with a timed bonus (Veloxin, Somatrex, Cerebryx, Aurexa, Quickstitch) | Not worn, and "+3 then −3" breaks W69's "never negative". It's a timer, which W128 (the sheet knows when an encounter ends) would give it (LQ7) |

## 5. Questions

One question is still open, and it is Deighton's, not Ken's: **LQ40**, the Werewolf's damage (L8). Its default is *unchanged* (BOD+8 claw, BOD+10 fangs) until he reports. Every other LQ is answered; they are in the archived plan's §5 and the orders' §4 (LQ11–LQ48).
