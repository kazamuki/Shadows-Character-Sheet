# Wishlist — ideas not yet scheduled

A parking lot. Things worth doing that nobody has committed to yet — mostly UX
and table feel. **Nothing here is a decision or a plan.** When an item gets
picked up it moves out: into a branch, a `plans/` doc if it takes more than one
session, and a numbered decision in `SCHEMA.md` §4 when it lands. Then its
entry moves, whole, to [`log/wishes-granted.md`](log/wishes-granted.md), with a
pointer on its heading to where it went. This list only ever shows what's open.

This is not `STATE.md` §3. STATE is the pick-up-work view for things that are
in flight or waiting on someone. An item here is waiting on nobody but a free
session and Ken saying yes.

**Adding an item:** next free `W` number, never reused. Put it under the area
it touches; who raised it, and where, goes in its byline. Say what the player
feels today (not just the fix), and anything the fix has to respect — a hard
constraint from `CLAUDE.md`, a decision, a rules question. A rules question
means the item is blocked on Deighton, and it says so. Give it a **Plan** line.
Claude adds items here too, marked as such; Ken triages them.

**Status:** 💡 idea · 🔎 needs a look (shape unclear) · ⏭ ready (shape is clear, just needs doing)

**Plan and Goes with.** The line under each heading says where the item
stands with the plans in `plans/`:
- **a link to a plan**, and its order once one is drafted: a plan covers it.
  The plan's row holds the status (approved, shelved, built), so it isn't
  repeated here;
- **set aside by** a plan, with why: a plan looked at it and left it out;
- **none yet**: no plan has looked at it.

**Goes with** names the items worth building in the same order, and it is
always written both ways. A plan or work order that takes an item up, sets it
aside or drops it rewrites the item's Plan line in the same change.
`tests/docs.test.mjs` checks that each link points at a live plan that names
the item, that every wish in a pending order's row points back at that plan,
and that Goes with is mutual.

---

## 1. Items

### Wizard

**W121 — Type a number into a stepper.** *Claude, from P13 · 💡 · Fix (UI) · raised 2026-10-16*\
**Plan:** none yet · **Goes with:** W131

Every rank in the wizard is one click: spending the Skill pool alone is about 30, before stats, boosts and Advantages. An experienced player knows the
targets. The stepper's value could take a typed number and the arrow keys, held to the same caps and pools as + and −.
*To respect:* W59 (each control says what it changes, and the new value is announced; a native spinbutton announces itself, so check the two don't double
up). It touches all 16 `stepper()` calls, so it's its own order.

**W122 — Make a copy of a character, from Home.** *Claude, from P13 · 💡 · Rule or shape · raised 2026-10-16*\
**Plan:** none yet

Home offers Open, Export and Remove, and no copy, so a second character of the same archetype, or a variant of one, starts from nothing.
*To respect:* Decision 128 (a TAG is issued once: a copy gets a new one). Whether copying a locked character gives a locked one or an unlocked draft is a
choice someone could make differently: a numbered decision.

**W131 — Expert mode as one long page.** *Ken, after P13 · 💡 · Rule or shape · raised 2026-10-17*\
**Plan:** none yet · **Goes with:** W121

An experienced player who knows what they want could make a character on one scrolling page: every creation step in order, folded as Expert mode folds
them, with one sticky bar that jumps between steps and filters, instead of eight screens and seven Continues. P13 and P19 make it plausible: Expert mode
cuts the Character Points step by about half (34,903 → 16,902px at 375px), and Skills and CP already have a filter and jumps.
**Claude's read (2026-10-17): worth doing, but two costs decide it.** (1) **Re-rendering.** Every stepper press redraws `#main`, and the CP step alone is
about 200KB of HTML. One page means the whole wizard on every press, so it needs per-section redraws first; measure a press on a phone-class CPU before
designing. (2) **One sticky bar, not three:** the Skills bar, the CP bar and the rail's points left would otherwise stack. Also: `validate()` speaks per
step, so the page needs each step's errors beside its section and Review's lock gate at the end; and a choice that changes what a later step offers
(Power Level, archetype, specialization) must reflow the sections below without losing the reader's place (`anchorKept`). **A cheaper first cut** may cover
most of the want: once Power Level and Archetype are chosen, every step is reachable from the rail in any order, with Expert mode on. Ask Ken which pain
it is, the clicking or not seeing the whole build at once, before writing the order.
*To respect:* Decision 232 and P19's N+1 (Expert mode is the browser's, never the character's); Decision 161 (the phone rail); Decision 162 (lock waits
until every point that can buy something is spent); Decision 164 (a press keeps the keyboard's place).

### Reading the sheet

The 2026-09-30 design critique (27/40, snapshot in `.impeccable/critique/`)
and its 2026-10-01 re-run (29/40) are mostly built: W43, W42, W44, W46, W47
and W57, then W45 and W58 (Decisions 165 and 166). Since W43, controls are 44px on a touchscreen and
`npm run phone-check` fails on anything smaller, or on text under 11px; since
W45 it also fails on a vitals bar or a sheet's jump bar of two rows, and on a
phone's Health card below 30% of the screen. A new control inherits those
floors rather than re-arguing them.

**W55 — Sticky notes on the Notes tab.** *Ken · 💡*\
**Plan:** none yet

*Set aside by the player sheet's plan when it closed (2026-10-24, `plans/archive/sheet-wishlist.md` §4): an idea, not shaped.*

Small notes a player pins as cards at the top of Notes (a contact's number,
a debt, tonight's lead), with the free-form page still below them. A note is
added, edited and removed like a gear row, and logged. Raised 2026-10-01 while
locking a power's words (Decision 154), whose Notes field stays free.
*To respect:* the free-form page stays as it is; cards are the player's, not
derived from anything.

**W100 — Distances in meters or feet.** *Ken · 💡 · Fix (UI) · raised 2026-10-10 with F31's ruling*\
**Plan:** none yet

*Set aside by the player sheet's plan when it closed (2026-10-24, `plans/archive/sheet-wishlist.md` §4): distances are text today, so it starts as data work.*

Deighton thinks in feet (the mono-whip reaches "5 or 6 feet"), the sheet in
meters. Ken's idea: a metric/imperial switch, so a table that plays in feet
reads every range, reach, radius and movement figure that way.
*To respect:* display only; the data stays in meters. Most distances are text
today (`"2m"`, `"5m radius"`, range bands in the quick reference), so converting
them means storing the numbers (Decision 134) before any switch. A view
setting, remembered in the browser, never in the character.
*2026-10-16, the effects sign-off:* Deighton, on Danger Sense: "should be meters" (Ken asked the same). Its 5, 50 and 500 feet, Aura Sight's 30 and True Faith's 10 are this entry's to convert; the numbers aren't picked yet (`reference/rulings-2026-10-16.md`).

**W117 — A Talented Advantage asks for its pick.** *Claude, from P12a · 💡 · Fix · raised 2026-10-16*\
**Plan:** none yet · **Goes with:** W118

A locked sheet has nowhere to make a pick. Talented's new Favored Skill, Refined Skill or Common Sense lands with no skill chosen, and does nothing until
someone finds the Admin edit. The IP buy asks for the pick in the same purchase (Decision 227); Talented's chooser could do the same.
*To respect:* Decision 217 (Talented is free, and takes a new Advantage worth 5 or less) and Decision 78 (a text pick may stay empty).

**W118 — Show the Advantages bought in play apart from the creation ones.** *Claude, from P12a · 💡 · Rule or shape · raised 2026-10-16*\
**Plan:** none yet · **Goes with:** W117

Admin's CP echo and the Character tab's "N CP" count an Advantage bought with IP (or by Talented) as Character Points spent. They are reference only and
Admin says so, but a player reading "20 CP" on a card can't tell which ranks were paid for at creation. A mark on a bought-in-play rank would fix it.
*To respect:* Decision 227 rejected subtracting the journal's Advantage ranks from `advSpent` (a second source for one number, and Talented's free ranks aren't in the journal).

**W119 — The Combat Maneuver line on the printed sheet.** *Claude, from P12b's PQ7 · 💡 · Fix · raised 2026-10-16*\
**Plan:** none yet

P12b put each style's Combat Maneuvers (Stun → Stunned · 1d10 + 10 (Karate +1)) under Martial Arts' row on Main and the Skills tab, and left print
alone (Ken took PQ7's default). A character who plays from paper has the style chips and their "+1 Stun" text and no number to roll. `pSkillCellsHtml` is the
print renderer for a skill row; the line is `Engine.maneuverChecks`, so print only draws it. Print's front page is full (Decision 96): put it on the skills page.
*To respect:* Decision 229. Player-visible: a CHANGELOG line and a patch bump.

**W133 — The game's words inside a sentence are a tap away too.** *Ken, from P21's voice pass · 💡 · Rule or shape · raised 2026-10-21*\
**Plan:** none yet

Reading Night Eyes' attack line ("In Dark, your attacks take −1 instead of −3; in Blind, −3 instead of −5"), Ken had to ask what Dim and Dark were. Decision 139 already puts a rule a hover or tap away (`data-tip`, `TIPS` in `shared.js`), but only for a tag, a stat score and a few fixed panels. A term inside a **sentence the app writes** is plain text: a light level, *Kicker Die*, *Take X*, *Defensive Action*, a Condition named in a mark, *Pain Level*. The player has to know it already, or go and find it.
The shape: a list of game terms in the data, each with the rule it opens (a sentence, or a table such as `visibility`, drawn with its numbers). The renderer wraps each known term it finds in a Skill-row mark, an attack or check note, a rest line or a `playerNote` as a tip trigger. Hover or focus shows the tip, and a tap pins it, as Decision 139's do.
*To respect:* the engine still returns text and never markup (constraint 5), so the UI finds the terms; or the engine returns `{ text, terms }` and the UI wraps them (decide in the order). Decision 139's primitive, not a second one: hover, focus, tap to pin, and it works inside a modal. Terms come from data and are never typed in code (Decision 135), and a term's tip reads the same table the number came from, so it can't drift. Print gets no tips. On a phone a 44px tap target can't fit a word inside a sentence, so check `phone-check`'s floor and how a tapped word reads before choosing (an underline, or a ⓘ after the line). Not every capitalised word is a term: the list is explicit, and a term inside a book quote or a `whenText` stays a match on the list, never a guess.

**W135 — Main's Health card is over the phone budget.** *Ken, from P16's review · 🔎 · Fix · raised 2026-10-24*\
**Plan:** none yet

On a phone, the Main tab's Health card starts 35–37% of the way down the screen (311px at 390×844, 297px on the touch phone) against `phone-check`'s 30% budget (W45). It's the only red row in `npm run phone-check`, and it's red on `main` before P16: P16 doesn't touch Main. Find what grew above the card (the hero, the vitals row, the pin button) and bring it back under, or move the budget with a decision if the card's place is right.

### Rules in play: powers, rounds, encounters, Sanity

**W107 — An unarmed strike line, and Death Touch's AP on it.** *Ken, with Claude · 💡 · Content (if it follows Iron Shirt) · raised 2026-10-15*\
**Plan:** [loadout-and-gear L4](plans/loadout-and-gear.md) (no order yet)

**Natural attacks, 2026-10-23** (the design meeting, `reference/meeting-2026-10-23.md`): fists, claws and teeth are **natural attacks**, two a round by default in any mix, stopping at two. So the fists' line this item asks for also says that, as do a Vampire's or Werewolf's claws and fangs. Five details are still Deighton's.

Raised reviewing P8a. True Warrior's Power Style lists **Death Touch
[Chi 4]: "Martial Arts attacks are Armor Piercing when not using melee
weapons."** Today it's a line of text: nothing on the sheet marks a strike
AP, so the player has to remember. Two gaps sit under it:
- **There's no unarmed attack on the sheet.** Loadout's attack lines come
  from carried weapons, and every `martialArts` catalog entry (the bo staff,
  the kusarigama, the tekko-kagi) is a melee weapon, which is exactly what
  Death Touch excludes. A Martial Arts character fighting bare-handed has no
  line to read. That line comes first.
- **Death Touch has no grant.** Iron Shirt, on the same Power Style, does
  (`grants: naturalArmor`, with `while`). Death Touch would get one the same
  way, read by the unarmed line.

**Ken's shape (2026-10-15):** the sheet needs to know the character has the
Chi ability (the Power Style tweak, already a held specialization), that
Death Touch is on, and that the attack is a Martial Arts strike.
**Claude's suggestion for "is on":** don't store it. Decision 104 lists a
conditional source and never sums it, and the hit modal asks when it
matters. The strike line reads **"AP with Death Touch"**, and the player
knows whether they paid the Chi. That keeps it out of the save file (no
schema bump). Track it only if playtesting shows people forget.
*To respect:* Decision 104's conditional pattern. Decision 135 (a grant some
code reads). W39 also wants a Martial Arts strike to hang its style bonus on,
so build the line once for both. **Separate, and for Deighton:** when someone
*else's* Death Touch hits a character with Natural Armor, does it pierce it?
Decision 219 lets only AP from a spell through, and Chi isn't a spell. Ask
with F42.

**W110 — A sustained power is marked active, and Turn Reset charges it.** *Ken, from P11's PQ2 · 💡 · Rule or shape · raised 2026-10-15*\
**Plan:** none yet · **Goes with:** W132

P11 (Decision 225) counts the SFR a player spends each round, but a sustained power ("2 SFR per round, sustained", "Rank per round, sustained") is still spent by hand with +1 every round. The ask: an Active toggle per sustained power, and Turn Reset charges what is active. *To respect:* every power cost is text today ("Rank + 2 per round"), so this starts with a data pass turning about ten costs into numbers (Decision 135); it is a work order of its own. Ken took the default in PQ2: the player spends it each round for now.

**W128 — The sheet knows when an encounter ends.** *Claude, from P18's sign-off · 🔎 · Rule or shape · raised 2026-10-16*\
**Plan:** none yet

Many effects run "per encounter", "once per session" or "for 12 rounds": Favored Skill's re-roll, Untouchable's uses, Spirit Guide's calls, Time Sense,
True Faith's aura, Blood Lust's state after a failed check. Ken wants some of them tracked (Divine Intervention spent, Favors used, Nine Lives counting
down, True Faith activated for 12 resets). The sheet knows a round (Turn Reset, Decision 225) and a session (Log session), but not an encounter.
This is the prerequisite for **limited uses**: a counter on an effect with its reset (never, per session, per encounter), and for any state an
encounter starts and ends.
*To respect:* the design first: how an encounter starts and ends on a player's sheet (a button? GM mode's encounters, S10, once seats exist?). Then the
uses counters as P18-shaped data on the effect. Its own plan, probably two orders.

**W132 — Powers that answer a hit, or heal while they run.** *Ken, from re-running P21's pre-flight · 💡 · Rule or shape · raised 2026-10-21*\
**Plan:** none yet · **Goes with:** W110

P20b taught Take a hit and Rest what a held **trait** does (Scrapper, Giant, Thick Skull, Rapid Healing). The same jobs done by a **power, Aberration or Major** are still table rules, and the player does the arithmetic. The P21 inventory listed them for P20 (c44–c53). P20b's order passed them to "P21", and P21 leaves them to later orders, so nothing in the sheet-wishlist plan builds them. Ken parked them here so that plan can close (2026-10-21).
- **The hit:** Odin's Aegis ("Reduce the damage of one Elemental, Spirit, or Aether attack by your BOD bonus + 2 × rank"), Null Field ("Absorbs up to 5 Elemental, Spirit, or Aether damage", +5 a rank), Red Mist and Spectral Veil ("immune to Physical damage" while running), Elemental Blood ("Halve damage you take from that element", rolled 1d3), Silverscar ("Withering damage from silver is halved (never below 1)"), Battle Hardened's immunity to one combat condition (a second and third in place of a Major).
- **Healing:** Regeneration ("While transformed, regenerate 1 HL per round") and Bone and Sinew (2), Vitality Surge (rank HL a round at 2 SFR each), Blood of Valhalla (rank HL a round, never Withering), Quick Clot (Bleeding ends at the next Reset).
- **A neighbour:** Adaptive Skeleton's Natural Armor 2 while it runs (inventory b21), which `naturalArmor` misses because it doesn't scan a starter power (P21 §7).

*To respect:* P20b's `meleeTaken` stage (Decision 236: after Natural Armor, before Wither Ward) is where a reduction joins the hit. Most rows need to know a power is **running**, which nothing stores yet (W110, P21's PQ2). Battle Hardened and Elemental Blood need a **saved pick** (a schema bump, with P21 §7's Skill Paragon and Weapon Expert group). Silverscar needs the hit to know **silver**, which `damageTypes` doesn't say. Regeneration reads the Form (Decision 195). Likely two orders: the hit, then healing. Each row's sentence is in `plans/archive/sheet-wishlist/P21-inventory.md` (c44–c53, b21).

**W134 — Sanity Loss and Recovery on the sheet.** *Claude, from the 2026-10-22 mirror · 💡 · Rule or shape · raised 2026-10-22*\
**Plan:** none yet · **Goes with:** W90

Scott's Sanity proposal was accepted on 2026-09-29 (`private/crb/APPROVED_SAN_Loss_and_Recovery.md`) and
is in no chapter yet. The sheet's SAN card counts loss and nothing else. The document gives it three
things: a failed SAN Breaker Check costs **5%, 10% or 20%** by severity (Minor, Major, Severe) and a
Condition for the scene; **five bands** below 50% (−1 to WILL Essence checks against fear, then to all
WILL checks, then Minor Insanity at rank 1 and 2, then −2) that last while SAN sits in them; and recovery
at **5% a day** of rest (+5% overnight with VR therapy), never past maximum. Maximum SAN drops only with
cyberware (W90).
*To respect:* the book should carry it first (a `crb-catch-up.md` item, Ken's), since the sheet follows the
book. Minor Insanity "gained this way" is a band effect, not a held Disadvantage: it doesn't lower SAN
again (P20a's cut) and leaves when SAN climbs out. A failed spell charge on a failed SAN check is
Decision 224's hold. Severity buttons go through `commit()` like every SAN change.

### Advantages & Disadvantages

Most of these came from P18's sign-off (2026-10-16), with Deighton's words in
[`reference/rulings-2026-10-16.md`](reference/rulings-2026-10-16.md).

**W123 — Followers and minions get a sheet of their own.** *Ken, from P18's sign-off · 💡 · Rule or shape · raised 2026-10-16*\
**Plan:** none yet

Followers/Minion grants a follower or companion per rank, and today they're a name in a text pick. Ken: taking it should open a mini-sheet per follower,
and a new area on the character's sheet to see them. GM mode's cast stat block (Decision 175) is the nearest existing shape.
*To respect:* a save-file shape (schema bump, `migrate()`); the follower's stats are the GM's call ("GM Approval needed"), so the sheet records, never rolls.
*2026-10-16:* Deighton: "we'll need to define what a minion or companion is. Are they controlled by GM or player? are they a combatant? What are their stats/skills?" Those answers come before the sheet.

**W124 — Poverty's debt as a balance you pay into.** *Ken, from P18's sign-off · 💡 · Rule or shape · raised 2026-10-16*\
**Plan:** none yet · **Goes with:** W129

Poverty sets a debt of at least Ç75,000, more each rank, takes half of what the character earns against it, and bars legal gear until it's paid. The
sheet shows none of it. A debt balance beside the Çredits ledger, with "half of income goes to the debt" applied when Çredits come in, would.
*To respect:* the Çredits ledger (`addCredits`, which never refuses a negative balance); **a rules question first:** is rank 1's debt Ç75,000 or Ç95,000 ("at least
Ç75,000 … each Rank raises your outstanding debts by Ç20,000")? Deighton's.
*2026-10-16:* Deighton: a tracker, paid off at each Milestone "until it disappears on its own. Like getting garnished", and owed "to a specific person or corporation" (a text pick, as W126 asks for Contacts). Pairs with W129.

**W125 — Addiction keeps time.** *Ken, from P18's sign-off · 💡 · Rule or shape · raised 2026-10-16*\
**Plan:** none yet

Addiction says how long the character can go without (2 days, 18 hours, 6 hours by rank) and what withdrawal does. Ken: track the time since the last fix,
and raise a flag the player clears by using or by marking the time as passed, as the Vampire's Thirst does for feeding (P17, Decision 223).
*To respect:* the sheet has no clock. Time passes by sessions and by what the player says, so this is a tracker the player advances, not a timer.
Withdrawal's TN and Pain Level effects are P18's table rules until then.
*2026-10-16:* Deighton flagged Addiction to discuss as a whole: "there are a lot of things that relate to Addiction mechanic".

**W126 — Contacts say who they are.** *Ken, from P18's sign-off · 💡 · Content · raised 2026-10-16*\
**Plan:** none yet

Contacts (Major) and Contacts (Minor) have no pick, so the player can't write down who the contact is. A text pick per rank, like Followers' and
Enemies', would let the sheet show "Minor Contacts: Rook (fence), Vee (LINK hacker)".
*To respect:* Decision 77's picks (`type: "text"`, `perRank`); the Character tab's cards already show picks (`selHtml`). `gamedataVersion` per 68.

**W129 — Wealthy pays out at each Milestone.** *Deighton and Ken, from P18's sign-off · 💡 · Rule or shape · raised 2026-10-16*\
**Plan:** none yet · **Goes with:** W124

Wealthy grants Ç2,000 a month per rank, and the sheet doesn't track months. Deighton: "I'd love if wealthy paid out at each milestone", and maybe a payday at
every Minor or Major Milestone for everyone ("UBI or your wealthy advantage or something"). Taking a Milestone could add the Çredits through the ledger.
*To respect:* a rules change to the book's monthly income (Deighton's, then 0430's text); `addCredits`; W124 pays Poverty's debt down on the same beat.
Wealthy's starting Ç10,000 is P20's (unanimous: once).

**W130 — Deighton's notes on the Advantages and Disadvantages.** *Deighton, from P18's sign-off · 🔎 · Rule or shape · raised 2026-10-16*\
**Plan:** [crb-catch-up](plans/crb-catch-up.md): a design talk with Deighton, then the book, then the data

Signing off P18's effects, Deighton left proposals on entries that work poorly as written: Favored Skill (take the higher result), Nine Lives (spend a life to
pass a Death Save), Snatch (deflect, not catch, a bullet), True Faith (12 rounds is too long), Unshakeable (Surprise only grants +1), Medium (needs a
mechanical benefit), Favors (from a named person), Fanatic (MAG Skill Checks −1?), Gullible (a contested Deception at −2?), Hemophiliac (the Bleeding
condition's numbers), Age (MOB out of its caps; how it meets Werewolves and Vampires), Ghost TAG ("corporate AI"), Dream Walker (range). Each is in his
words in `reference/rulings-2026-10-16.md`.
*To respect:* rules changes, so a design talk first, then the book (`crb-catch-up.md`), then the data and P18's tags in one pass each. Age's MOB bears
on P20's stat caps: ask before P20 is written.

### Loadout & catalog

**W69 — Gear that changes what you can do while you wear it.** *Ken, from Deighton · ⏭ · Rule or shape · raised 2026-10-08 · answered by Deighton 2026-10-10*\
**Plan:** [loadout-and-gear L1, L3 and L7](plans/loadout-and-gear.md) (L1's order drafted: [L1-weapon-damage-types](plans/loadout-and-gear/L1-weapon-damage-types.md)) · **Goes with:** W91, W137

Deighton's ask: powered armor worn over the body should show its bonuses where
they land. Armor giving +5 to BOD skills and damage should raise Melee and
Martial Arts while it's checked as worn, **without touching the BOD bonus**,
because it reinforces the body for a while rather than changing it. The same
goes for REF, MOB and the rest. Today a worn piece answers a hit and nothing
else; a bonus it prints is text the player applies by hand.
**Ken's reading (2026-10-08):** a piece of gear or armor carries **modifiers**
that apply only while it's worn, to **stats, skills, weapons and powers**.
Weapons are addressed by class, **ranged or melee** and **kinetic or energy**,
so a modifier can read "+2 ACC to ranged weapons" or "+2 damage to energy
weapons". **A third address, from the first playtest (Brogan, 2026-10-10):**
by weapon **feature**, so SMARTLink Gloves (`smartlink-gloves`, "+2 ACC when
using SMARTLink-compatible weapons", in the catalog today as a note) reaches
only weapons whose `features` carry `SMART Link`. Modifiers are **never negative**. A skill modifier adds **ranks
only**: an untrained skill gets the ranks but not its Synergy. A power
modifier applies only to a power held at **rank 1 or more**, so +2 Evocation
on a Professional does nothing.
*Later, not in the first cut:* gear that **grants a power** while worn, and
modifiers on **stunts**.
*To respect:* constraint 7, store inputs: the modifier lives on the catalog
entry (or the custom row), "worn" is the stored input, and every number it
moves is computed, never written to the character. Constraint 6 for any new
catalog key. **Deighton answered the open questions (2026-10-10, `reference/rulings-2026-10-10.md`
Q12–Q16):** a stat modifier reaches that stat's **skill checks and damage
only**, never Health Levels or TOL; two pieces' modifiers to one target
**stack**; **Electric and Burning count as energy**; a worn bonus **can pass
10**; and **Powered Armor is a vehicle** (W91), not a worn piece. What's left
is data work: "kinetic or energy" reads `damageType`, which only 29 of the 54
weapons carry today (`Normal`, `Ballistic`, `Electric`, `Energy`, `Burning`),
so the rest need one. Prices
and caps (`ipCost`, `canBoost`) must keep reading the rank without the worn
bonus, or taking armor off would change what the next rank costs.

**W91 — Vehicles you can buy and own, Powered Armor among them.** *Ken, from Brogan · 🔎 · Content, then Rule or shape · raised 2026-10-10*\
**Plan:** [loadout-and-gear L6](plans/loadout-and-gear/L6-vehicles.md), shelved on Deighton (was sheet-wishlist's P14) · **Goes with:** W69, W90

There are no vehicles in the app: only the Pilot skill and Machindo. `0460`
has the chapter: **Grounders** and **Jumpers** (Seats, PROT, RES, INT, Speed,
Mods, Availability, Cost), **Vehicle Armor Kits**, **Powered Armor** and **Mech
Suits**. The first cut is a vehicle catalog in Loadout's picker
(`openCatalog` takes a new `kind`, Decision 118) and an owned vehicle on
Loadout that reads like a catalog line. *Later:* a vehicle's own damage
(Integrity, Systems, the Integrity Check and the System Failure table) and its
mounted weapons.
*To respect:* constraint 6 for every new id, `gamedataVersion` per Decision 68.
An owned vehicle is a save-file shape change. Powered Armor is worn and
amplifies the body (`0460`: the pilot uses their own combat skills), so it's
a question between this entry and W69. **Deighton ruled (2026-10-10, `reference/rulings-2026-10-10.md`
Q16): Powered Armor is a vehicle, with its own Integrity**, so it's this
entry's. One MD of Massive damage is 10 Integrity off it, or 1 Health Level to
the wearer once it gets through (Q6).

**W108 — Magazines sized by the weapon, and combining part-used ones.** *Ken · 💡 · Rule or shape · raised 2026-10-15 with P9b's PQ3 · wants thinking time*\
**Plan:** set aside by [loadout-and-gear §4](plans/loadout-and-gear.md): starts with Ken's CRB change to how magazines fit

Gear sells rounds by the magazine and Weapon Type, so one Rifle Rounds magazine fills a
3+1 VR-50 "Verdict" or a 30+1 AR-9X (Decision 145). P9b keeps a part-used magazine
with its count, which puts the simplification in view: 18 rounds out of an AR load 4
into the Verdict and leave 14 in the magazine. Ken: it breaks immersion. A magazine
that belongs to a weapon (or a capacity) would read truer.
*To respect:* it changes what a bought magazine is, so it starts with the CRB: Gear
would price magazines per weapon, or say they fit by capacity. 145's *Revisit if*
already names it ("a weapon takes a magazine another of its type can't").
**Combining part-used magazines** (Ken, the same day): two Rifle mags of 18 and 6
into one. It belongs here, not as its own wish, because "full" has no meaning
until a magazine has a size. Today any whole magazine fills any weapon of its
type, so a combined one could be called whole at any count. Questions to settle
first: what size a combined magazine is; whether specialty rounds can be combined
with standard ones (they can't share a magazine's tags); and whether it costs an
action at the table. P9b leaves merging out of scope (its §7).

**W136 — A Major or a power changes one weapon or armor row.** *Claude, from closing the sheet-wishlist plan · 💡 · Rule or shape · raised 2026-10-24*\
**Plan:** [loadout-and-gear L5](plans/loadout-and-gear.md) (no order yet)

P21's inventory listed these as "later orders" (`plans/archive/sheet-wishlist/P21-inventory.md`, c20 and c22–c34), and the plan closed without them, so nothing covered them. Each is printed on its card and the player does it by hand on the weapon or armor:
- **A Major on one row the player picks:** Tuned Edge ("it gains +1 to damage", that weapon only), Custom Fit (that armor's damage reduction die a step up, d4 to d6, never past d12), Signature, Iconic and Legendary Weapon (Mod Slots and free Upgrades on one weapon), Weapon Expert ("+1d4 kicker to combat rolls using it; if a +1d4 already applies, it increases to +1d6").
- **A power on natural weapons or melee, while it runs:** Rend and Tear, Bone Spines, Monstrous Maw, Rending Claws, Blood of Valhalla (Vampire); Let It Loose, Steel Fangs, Serrated Claws (Werewolf).

*To respect:* a Major saves only a `power` today (Decision 223), so a picked row is a schema bump, and the pick has to survive another row being removed (loadout rows are an array). The modifier on the line is W69's, so this follows it. The natural-weapon rows sit beside W107's natural attacks. "Combat rolls" are the attacks (P21's PQ6). Nothing stores that a power is running (W110), so the power rows are conditional marks or they wait (Decision 104's pattern).

**W137 — A custom weapon reads like the catalog's.** *Ken · 💡 · Rule or shape · raised 2026-10-24*\
**Plan:** [loadout-and-gear L2](plans/loadout-and-gear.md) (no order yet) · **Goes with:** W69

A weapon the player writes in is eight text boxes (name, type, damage, rof, capacity, ammo, features, notes), and its line computes nothing: no Skill, no attack number, no damage worked out from BOD, no damage type, ACC or range. A catalog weapon has all of them. Ken: a custom weapon should have its damage type, its attack and its range as the catalog shows them, and its **weapon type**, so a Skill applies to it.
*To respect:* the custom row's shape changes, so it's a schema bump with a `migrate()` step for the free-text `type` already in saved files (`plans/loadout-and-gear.md` LQ9). The Skill comes from the type as data, never from code (LQ8; Decision 135). It reads L1's damage types, and once it has a class, W69's modifiers reach it. A custom weapon never takes a catalog `id` (constraint 6), and a junk field reads as empty (constraint 8). W109 is the wider question of a custom row switching on what a book row does.

### Cybernetics

The Cyborg archetype was cut, and cybernetics are gear, Professionals only
(W90). Everything here waits on that design, and on F6 and F19.

**W61 — A retired archetype folds its characters into Custom.** *Ken · 🔎 · raised 2026-10-01 with the Cyborg cut; Rule or shape*\
**Plan:** set aside by [loadout-and-gear §4](plans/loadout-and-gear.md): waits on the cybernetics design (F6, F19), with W90 · **Goes with:** W90

The team has cut the Cyborg (`plans/crb-catch-up.md`), and an id can never
just be deleted (constraint 6). Today a removed archetype leaves a character
on an orphan that `versionCheck` reports and every reader has to step around.
Ken's idea: the Custom archetype's write-in fields can hold an orphaned
character, so make that the endpoint for **any** archetype that's removed or
reshaped out from under its players. It shouldn't happen often, but it's
cheap hardening against it.

*The shape Claude proposed.* A data key on the archetype, e.g.
`"retired": { "into": "custom" }`, and not an id check in `migrate()`
(Decision 135 bans archetype ids in code). On load, a character on a retired
archetype gets the archetype's name, summary, classification, baseline traits,
vulnerabilities and powers copied into `archetypeChoices.writeIn` and
`powers`. Then it switches to Custom, a notice says what happened and to see
the GM, and the journal records it. This is triggered by the game data, not
the save-file schema, so it's a load-time conversion beside `migrate()`, not
a schema step, and it has to be safe to run twice. The cousin pattern is
Decision 143's `retired` armor upgrade, which still works but isn't offered.
That's the other option to weigh: **retire in place** (the archetype keeps
working for those who have it and just can't be picked) vs. **fold into
Custom** (its rules are gone, so the character shouldn't keep running on
them).

*Caveats to relitigate before building:*
1. **Computed bonuses vanish silently.** Constraint 7 means an archetype's
   bonuses aren't stored on the character; they're computed from its data.
   Fold a character into Custom and anything the archetype computed is gone:
   an Arcanist's TOL bonus and focus-stat bonus, a Professional's Focused
   Skill price and starting-cap bonus, Natural Advantages' free ranks, a
   Werewolf's SFR and RoU. The conversion either writes them down first (as
   Adjustments or trait text) or names each one the player is losing.
2. **Panels without a Custom twin.** Custom has no `table` panel, so an
   archetype's table rows (Cyborg's Installed Cybernetics) would have to
   become trait text or notes. Trackers with no matching mechanic
   (Cyborg's Tolerance Load) have no home; Custom's "magic" box means TOL
   Spent and the Cascade, which is the wrong fit.
3. **Choices that only made sense inside the archetype**: a specialization
   pick, focus allocations, Disciplines. Each becomes text, or is dropped
   with a note.
4. **It's one way.** A converted file that's saved stays Custom, even if the
   archetype later returns.
5. **Custom is a holding pen, not always the destination.** A chromed ex-Cyborg
   really belongs on the Professional with cybernetics, and the subtype is the
   player's and GM's pick, not something a migration can guess. The notice
   has to say "your GM rebuilds this in Admin", not imply the job is done.
6. **Is it a rescue or insurance?** The wizard lets a player pick Cyborg today
   (with a warning), and the Cyborg has no content, so a saved one holds at
   most table rows and a tracker count. Ask whether anyone has one. Either way
   it's worth having for Vampire and Werewolf, both still draft.

*To respect:* constraints 6–8 and 10 (the conversion runs on untrusted files
and must stay total), Decision 135, Decision 153's write-in shape, and
Decision 152 (the folded character keeps its classification, so what it may
buy doesn't change under it). Lands with the Cyborg's retirement, which needs
its own numbered decision.

**W90 — Cybernetics.** *Ken, from Brogan; rewritten 2026-10-22 with Deighton's system · 🔎 · Rule or shape · raised 2026-10-10 · needs its own plan; Deighton for the questions below*\
**Plan:** set aside by [loadout-and-gear §4](plans/loadout-and-gear.md): waits on the cybernetics design (F6, F19) and Deighton's six questions; it needs a plan of its own, built on L6's row shape · **Goes with:** W61, W91, W127, W134

Playtesters want chrome, and as of 2026-10-22 there is something to build from. The Cyborg archetype was
cut (STATE §3); cybernetics are **gear, Professionals only**, and the **Enforcer is the cybernetics
Professional**, confirmed for the MVP by the Q4 scope freeze (`APPROVED_Q4_Scope_Freeze`). Deighton's
system is accepted in principle (Ken), and two documents carry it in `private/crb/`:

- **`Cybernetics_Systems`** — the rules. Every system runs through a **Neurocybernetic Interpreter (NCI)**
  with four functions: an **EM Sheath** (blocks a number of EMP hazards, back 1 an hour), **Auxiliary
  Power** (a reservoir that stands in for TOL once Exhaustion takes it to 0), a **Firewall** (opposed
  against Hijack) and a **Neurostatic Buffer** (adds to the System Failure check). Powered systems cost
  **Energy** (NRG): a weapon draws on TOL until the round resets, a defense commits it until released, and
  each point past TOL is Exhaustion. **System Failure** is a d100 Breaker Check against Sanity, with an
  eight-row table from "no penalty" to "incapacitated 1d4 rounds".
- **`Cybernetics_Worksheet_v2`** — the data. Seven NCI models in five classes (Raptor Z4, Class II, 2,000Ç,
  to the X-127 Viper, Class V, 10,800Ç) with Efficiency Bonus, Load Capacity, Buffer, Firewall and EMP
  Resistance; about 80 parts as Augmentations, Features, Implants, Mods and Replacements, each with a
  **Sanity cost**, Energy, Mod Slots, bonuses, vulnerabilities and a price; cyber weapons and defenses;
  and the chems. Its hidden "Cyber Sheet Baseline" sheet sketches a sheet: NCI block, a body map, augmented
  stats, cyber weapons.

What it would give the sheet: an **NCI** card (class, Energy = TOL + its bonus, EMP resist, Firewall,
Buffer, Load used of Load Capacity), cybernetics as **loadout rows** with a location and their mods,
their bonuses through `grants` like any trait (a +3 BOD, Natural Armor, a Skill bonus, Take 8), cyber
weapons on Main's attacks, an Energy tracker beside TOL, and **System Failure** as a roll with its table.
Installing a part lowers **maximum SAN** by its cost (`APPROVED_SAN_Loss_and_Recovery`), which answers
F19 and gives W127 (Cyber-Prophetical) and Cyber Allergy something to read. The Enforcer's Duty Grade
(Interpreter: a free NCI; Hardwired: a 1d4 kicker when a system does the work) waits on this too.
Hardened (the Enforcer's Duty Grade) is text until an Enforcer can be made to resist EMP; then it's a
choice on that check. Issued Hardware, which `0412` leaves as a placeholder, is added here when it's written (YQ3).

**Questions for Deighton before a plan** (the two documents disagree, or the worksheet is mid-edit):
1. **The NCI's numbers.** The rules name EM Sheath, Auxiliary Power, Firewall and Buffer; the NCI list
   has Efficiency Bonus, Load Capacity, Buffer, Firewall and EMP Resistance, and no Auxiliary Power.
   Is Efficiency Bonus the "NCI bonus" Energy adds (the Enforcer's Interpreter) and the "Power Core"?
   Is EMP Resistance (+10 to +35) the EM Sheath's count, or a percentage?
2. **What a Load Capacity counts.** The worksheet lists four options (parts only; parts and mods; a points
   pool; replacements 3, augments 2, implants 1) and picks none.
3. **Which list is the rules.** The visible Cybertech sheet and the hidden catalog disagree part by part
   (Gyro Stabilizers Take 5 or Take 8; TriClaws 12 + BOD or +12; Thunder Plugs against Stun or Daze;
   Muscle Fiber Reinforcement's mod slots blank; Wrist Rockets 5 or 10 a burst). Several bonuses use words
   the book doesn't (HP, "HTH Damage", "Death save", "Fragmentation" as a Condition).
4. **Sanity cost as dice.** Many parts cost 1d4 or 1d6 Sanity: rolled once at install, and is it points
   or percent of the 10–95% SAN scale?
5. **Exhaustion's recovery.** "It takes 1 per point of TOL for fully recover": 1 what?
6. **Stat bonuses past the cap.** +3 BOD and +3 REF parts: do they push past 10, and do they count for
   Required Stats and Focus caps?

*To respect:* store inputs, compute everything else (constraint 7): a part is a catalog reference on a
loadout row, never its bonuses copied in. Ids are immutable (constraint 6), so parts get ids before
anything ships. **Sequence after loadout-and-gear's L6** (vehicles, the first new loadout row) and build on its row shape. Retiring
`cyborg` is W61's question and closes F6; the install cost closes F19. Vampires, Werewolves and Arcanists
can't take chrome. A rules question stays a flag, never a guess in code.

**W127 — Cyber-Prophetical, once cybernetics are gear.** *Ken, from P18's sign-off · 💡 · Rule or shape · raised 2026-10-16*\
**Plan:** set aside by [loadout-and-gear §4](plans/loadout-and-gear.md): waits on cybernetics as gear, with W90 · **Goes with:** W90

Cyber-Prophetical means no Sanity loss from cybernetics, and the sheet can't apply it until it knows a character has them. When cybernetics are gear with
a Sanity cost, this becomes a computed effect that zeroes it.
*To respect:* F19 (the cyborg install cost, open) and Cyber Allergy (no cybernetics at all), which reads the same gear. Waits on cybernetics as gear.

### Custom characters & custom rows

W48–W52 were raised 2026-09-30 while planning the custom archetype
(`plans/archive/custom-archetype.md`), by walking a made-up character through every
step. Each is a place someone might want to write something in that the plan
leaves out on purpose.

**W48 — Natural Armor a custom character writes in, which the hit panel uses.** *Claude · 🔎 · touches F25*\
**Plan:** none yet · **Goes with:** W109

A tough creature's "hide like stone" can be written as a trait, but the hit
resolver won't subtract it. Natural Armor's sources are `grants` on
advantages, Major Milestones and specializations (Decision 104); a written-in
trait has no `grants`. *To respect:* how Natural Armor answers a hit is the
F25 stub, still Deighton's.

**W49 — A resource pool the player names.** *Claude · 💡*\
**Plan:** none yet

*Set aside by the player sheet's plan when it closed (2026-10-24, `plans/archive/sheet-wishlist.md` §4): an idea, not shaped.*

Glamour, Chi, a Blood Pool. The plan's checkboxes cover what the rules have
today (TOL, SFR). A third, **Uses another pool**, would give a tracker whose
title and max the player types. Tracker titles come from the data today, so
this needs a little code.

**W50 — Stat changes at creation.** *Claude · 💡*\
**Plan:** none yet

*Set aside by the player sheet's plan when it closed (2026-10-24, `plans/archive/sheet-wishlist.md` §4): an idea, not shaped.*

Deighton sets a custom character's stat changes "in the same stroke as
powers", but the Adjustments ledger is only on the sheet, after lock. Fine at a
table where characters lock together; awkward for someone building alone.
*To respect:* a stat change at creation must not read as Stat Points spent.

**W51 — A shapeshifting form toggle for a custom character.** *Claude · 💡*\
**Plan:** none yet

*Set aside by the player sheet's plan when it closed (2026-10-24, `plans/archive/sheet-wishlist.md` §4): an idea, not shaped.*

The Werewolf's form toggle has fixed options from the data. A custom
shapeshifter writes its forms as powers for now; a toggle with options the
player names would put the form on the sheet.

**W52 — Written-in Major Milestones.** *Claude · 💡*\
**Plan:** none yet

*Set aside by the player sheet's plan when it closed (2026-10-24, `plans/archive/sheet-wishlist.md` §4): an idea, not shaped.*

A custom archetype has no Major Milestones of its own; the general Majors are
open to it. The Adjustments ledger covers a GM's custom reward meanwhile.

**W109 — A custom row can opt into what a book row does.** *Ken · 🔎 · Rule or shape · raised 2026-10-15 with P10's PQ7*\
**Plan:** set aside by [loadout-and-gear §4](plans/loadout-and-gear.md): wider than gear; L2 gives a custom weapon the catalog's fields, and L3's LQ6 decides custom modifiers · **Goes with:** W48

A written-in spell, piece of gear, weapon or power is text to the engine: the sheet can't
hold a custom Concentration spell (P10's PQ7), and no other custom row can switch on
anything a book row's data switches on. Ken: if a tag changes behaviour, a custom
addition should be able to tick it.
*Claude's read:* few behaviours are tags today. Ammo tags join a weapon's line on Reload
(`ammoTags`), and after P10 `Concentration` makes a spell holdable. Most behaviour lives in
other fields: a weapon's `damageType`, a power's `grants` (Natural Armor), a magazine's
`reload`. So the shape is "a custom row offers, per kind, the switches the engine reads
for that kind", not free-form tags. A tag that does nothing would look as if it did.
*To respect:*
- **The list comes from the data, never code.** A behaviour tag is declared in its
  glossary (e.g. `behaviour: true`, with the kinds it applies to), and the custom form
  offers exactly those (Decision 135: a data field is read by code, or it's text).
- **A saved tag is an id.** Once a character file stores `"Concentration"` on a custom
  row, renaming that tag breaks the file (constraint 6), so behaviour tags need ids
  separate from their display names.
- **The engine stays total** (constraint 8): a custom row with a junk tag reads as
  untagged, and `migrate` keeps only strings.
- **Balance is the table's.** A custom weapon ticking AP is the GM's call, as its damage
  already is.

Start with the kinds that already have a behaviour tag (spells after P10, ammunition),
then grow the list kind by kind as each behaviour is made data-driven.

### Files, tabs & the hosted site

**W38 — Two tabs open on one character overwrite each other.** *Claude, raised in S6c · ⏭*\
**Plan:** [two-tabs-one-character](plans/two-tabs-one-character.md), waiting on Ken's TQ1–TQ3

Open the same character in two browser tabs, play in one, then touch anything
in the other: the second tab saves its older copy over the first's, and the
play is gone with no warning. The roster (Decision 141) doesn't cause this, and
the single-slot app had it too, but a list of characters makes several open
tabs more likely. *The fix:* listen for the `storage` event. When another tab
writes the entry for the open character, stop saving from this tab and say so,
with a button to reload from the newer copy. *To respect:* the app works
without storage, so the listener is guarded like every other read.

**W62 — Slotting a file in reads it on screen, like a script loading in NYTE City.** *Ken · 💡 · raised 2026-10-02 with GQ10's packs*\
**Plan:** none yet · **Goes with:** W63

*Set aside by the player sheet's plan when it closed (2026-10-24, `plans/archive/sheet-wishlist.md` §4): an idea, not shaped.*

Today a character file imports with a toast that names it, and a Codex pack
(GQ10) would do the same. Ken's idea: a terminal opens, reads through what's
in the file, and closes on what landed, so loading a character or slotting in
the Codex feels like jacking a script into a deck rather than opening a file.
*What the shape has to respect,* as Claude sees it:
- **It reads what's really there.** The lines are the file's own contents as
  the gate checks them (the character's name, archetype and TAG; the pack's
  entries and traits by name), and the last line is the real outcome: counts,
  what was repaired. Not a canned script on a timer.
- **Short and skippable.** About a second, any key or tap finishes it, and it
  never sits between a GM and a fight. Repeating the same load in one sitting
  goes straight to the summary.
- **Reduced motion gets the summary only** (the app already honours
  `prefers-reduced-motion`), and a screen reader hears the outcome once, not
  every line.
- **A refused file drops the fiction.** That's the player being stuck, so it
  speaks in tool voice (`VOICE-APP.md`) and says what to do.
- **The copy is data** (`appCopy`, Decision 76) and gets a voice pass; the
  mono font is already embedded, so nothing touches the network (137).
- One primitive in `shared.js`, used by every import: a character, a table,
  a pack, and a dispatch once that exists.

**W63 — The hosted sheet is a demo; the full game is a pack you slot in.** *Ken · 🔎 · Rule or shape · raised 2026-10-04 · reopens GQ10 in part*\
**Plan:** none yet · **Goes with:** W62

*Set aside by the player sheet's plan when it closed (2026-10-24, `plans/archive/sheet-wishlist.md` §4): waits on Ken: which slice is free.*

Today `charactersheet.shadowsrpg.com` is the whole sheet: every archetype,
the full catalog, all of it, free. Ken wants the live site to be a **demo**: a
real taste of Shadows and its data that everyone gets, with the full CRB
content arriving as a file the player adds to unlock the rest. It is the same
move as GQ10's Codex pack, applied to the core game: the mode and its logic
ship in every build, and a pack supplies the content.
*Settled with Ken, 2026-10-04:*
- **A slice is free.** The demo carries a limited set of archetypes and data,
  not the whole book. The player builds and plays **one real character**
  through the whole wizard and sheet, with save and export working.
- **Demo characters carry over.** A character made in the demo stays valid
  once the pack is added. IDs are immutable (constraint 6), so this holds if
  the demo's data is a strict subset of the full data, and a test should
  prove it (every demo id exists in the full data).
- **The unlock is the same `.shadows-pack.json` as the Codex.** One pack
  mechanism, imported once, checked like any untrusted file (Decision 124).
  The CRB is a core pack and the Codex is a GM pack. The file is built from
  `private/` (Decision 167).
*What the shape has to respect, as Claude sees it:*
- **GQ10 changes in part.** It says "core player content stays free in the
  sheet, Vampire and Werewolf included," and that the repo stays public "as a
  matter of trust." Taking this up means a numbered decision that narrows
  GQ10 and marks it superseded in part. It must also say which archetypes
  are in the slice. That is a content call (Ken, and Deighton for what the
  demo shows of the rules), not an engineering one.
- **The "slice" is the hard design question.** Candidate cuts: a few
  archetypes, or all archetypes with trimmed catalogs, or the full rules with
  a character cap. Each decides what a demo player can miss. This is the
  first thing to settle, because the data split follows from it.
- **The app must still make no network request** (constraint 1, Decision
  137). The pack is a file the player adds, never a fetch. The site and the
  offline file both work the same way: demo until a pack is slotted in.
- **One app, one version history.** Same reasoning as GQ10's rejection of two
  builds. The demo is the data subset, not a second codebase. `gamedataVersion`
  moves with the data a character can observe (Decision 68), and a pack
  carries its own content version.
- **The engine is total** (constraint 8). A character that references an id
  the loaded data lacks (a full character opened in a demo, or a pack removed
  afterwards) must not throw. It should open read-only or say plainly what's
  missing, in tool voice. Same rule for a pack older than the character.
- **Repo vs. protection.** This repo is public, so the demo is a **trust and
  product line, not DRM**: anyone can read the data from the source. Say so
  in the decision, so nobody later treats it as access control. The CRB text
  itself is in `private/` and stays out of the public tree already. Whether
  the *game data* (370KB of descriptions and rules text in `shadows-data.js`)
  also moves into the pack is part of the slice question.
- **How the full pack reaches people** (Patreon, a store, handed out, free
  for backers) and whether it is paid is Ken's and Deighton's, and not an app
  question. The app only needs a good "add your pack" moment (W62's loading
  screen fits) and an honest demo state.
- **Voice.** The demo's framing ("you're seeing a slice of NYTE City") is
  player copy and gets a voice pass (`VOICE-APP.md`). It is data in
  `appCopy`, and it never narrates build state (constraint 9).
- **The pack's gate is shared work.** S9 of `plans/gm-mode.md` builds the
  pack shape, gate, storage key and import. Build the demo after that, or
  with it, so there is one pack mechanism.
*Open for whoever picks it up:* the slice (which archetypes, which catalogs);
whether the demo is also a quickstart path (a guided first character) or
just a trimmed sheet; what the Home screen says before a pack is slotted
in; whether a pack can be removed, and what that does to characters that
use it.

### GM mode

W29 is the whole of GM mode. The rest are Ken's notes from playing with the
build (switched off) and from its work orders. Each sits alongside W29's plan,
not inside it, until a work order picks it up.

**W29 — A GM mode: link to the table's characters, read them, leave notes.** *Ken · 🔎 · raised 2026-09-24*\
**Plan:** [gm-mode](plans/gm-mode.md): the file-based stage and the GM toolkit; live sync (stages 2–3) stays here

Raised 2026-09-24, at the end of the whole-app audit. Today a GM who wants a
player's HP, Conditions or loadout asks for it, or collects exported files by
hand. The wish: the GM links up with the characters at the table, sees their
data without asking, and can put notes onto a character's sheet.

*What already points this way.*
- **Identity.** Every character has a permanent NYTE City intake number (Decision 128).
- **What gets synced.** A character stores only inputs (constraint 7), and every change
  is already a small structural patch in the audit trail (Decisions 48–49). Those
  patches are exactly what a sync layer sends.
- **One engine on both ends.** The engine is pure and never touches the DOM
  (constraint 5), so a server could run the same code to check and compute.
- **The gate.** `migrate()` already treats every file as untrusted (Decision 124). A
  server would run the same gate on everything it accepts.

*What it must respect.*
- **Constraint 1.** The sheet keeps working from `file://` with no server. Linking is
  an extra that needs a network, never a requirement.
- **The player owns the character.** The GM doesn't edit it. GM writes are *notes*
  and *suggestions* ("take 12 Ballistic to the torso") that the player accepts, and an
  accepted one becomes an ordinary undoable action on the player's own sheet. That
  also avoids the hard problem of two people editing one sheet.
- **The intake number is a name, not a key.** It's printed on paper. Access comes from
  joining a table, never from knowing a number.
- **Consent and privacy.** Joining a table is what lets the GM see a sheet, and
  leaving stops it. Player data on a server means someone owns the hosting, the
  cost and how long it's kept.

*A skeleton, cheapest first.*
1. **No server.** With the roster (Decision 141), a GM's browser holds several characters
   read-only, imported from the players' exports and refreshed by re-importing (a
   newer copy of the same intake number just updates; Decision 128's rule). GM
   notes go back as a small "dispatch" file a player imports into a *From your GM*
   inbox. Most of the value, with no infrastructure.
2. **Live, read-only.** A table service. A player's sheet pushes its latest snapshot,
   and the GM's view subscribes.
3. **Two-way, player-approved.** GM notes and suggested changes are pushed to the
   player's sheet and accepted or declined there.
4. **The GM toolkit on top:** initiative, one hit applied to several characters,
   encounter state. That's Scott's area, so his design as much as the app's.

For stages 2–3, the API is roughly:
```
POST   /tables                           GM creates a table        → { tableId, joinCode }
POST   /tables/:t/seats                  player joins: code + a character snapshot → { seatToken }
GET    /tables/:t/characters             GM: every seated character, latest snapshot + revision
PUT    /characters/:intake               player: new snapshot { rev, character }, or the patches since rev
GET    /tables/:t/events                 live stream (SSE or WebSocket): { intake, rev } changed
POST   /characters/:intake/notes         GM: { text, visibility: "player" | "gm-only" }
POST   /characters/:intake/suggestions   GM: { label, patch } → the player accepts or declines
DELETE /tables/:t/seats/:intake          player leaves; the GM's copy goes with them
```
It can stay small: one serverless function and one store per table (Cloudflare
Workers with Durable Objects, or a hosted realtime database). Players join with
a code or a QR at the table; accounts can wait.

*Before anything is built:* who hosts and pays; whether stage 1 is enough on its
own; how long player data is kept; and whether this is the character sheet's
job or the GM toolkit's.

**W68 — How well a cast member knows each of the crew: a face, a regular, a name.** *Ken · 💡 · Rule or shape · raised 2026-10-07 in W29 S10c's order*\
**Plan:** none yet

A GM's hint for the scene: does Dez half-recognise Rook ("you look familiar"),
know them by sight ("I know you"), or know their name ("hey there, Rook")?
Nothing records it today. S10c's wrap-up writes a *fought* interaction with
every PC in the room as its crew, so *Who knows what* already lists who has
crossed paths with whom, and how often. A GM can read the first two levels
off that list.
*The idea in two parts.* **Seen them** is derived: a count of the
interactions a member and a crew name share (fights, words, favours), shown
as a hint on the member's page and in *Who knows what*, and never stored
(constraint 7). **Knows their name** can't be counted, because one meeting can
give it away and ten might not. It's a fact the GM records, as an interaction
kind (*learned their name*) or a mark on the interaction that gave it away.
*To respect:* Decision 177 (interactions are the history; no second place for
the same sentence), 179 (*Who knows what*). The Reputation advantage (`0430`,
Rank 2: "people occasionally recognize you") and CRANK rep (169) are player
rules about being recognised; a level the GM sets must not quietly contradict
them, so ask Deighton and Scott how they meet before choosing levels. Crew are
typed names until S3b's seats claim them.

**W73 — A session can have a name.** *Ken · ⏭ · Rule or shape · raised 2026-10-08 in S5a's review*\
**Plan:** none yet · **Goes with:** W84, W86

A table refers to its past by session: *"when did we learn that? Session 2,
The Ledger."* S5a (Decisions 203–204) gives a session a number the GM sets and
a day, and nothing else names it. The wish is an optional `title`, shown after
the number wherever a session is named: the list, *Closed in*, an
interaction's *Session 2*, and Next session's *Last session set up*.
*To respect:* table schema bump and a `migrateTable()` step (`""` for every
session already there); the number stays the identity and the sort (Ken,
S5a's review: "last session" is by number), and the title is text only.

**W77 — A cast member's page, laid out for the table.** *Ken · 🔎 · Fix (UI) · raised 2026-10-08*\
**Plan:** none yet · **Goes with:** W78, W80, W81

Three things about the page a GM opens mid-scene:
- **Back and Add to <encounter> always in reach.** They sit at the top today
  and scroll away on a long page. Keep them in a bar that stays put while the
  page scrolls (with W75's always-shown Add).
- **Status near the top.** Alive, dead, missing or gone sits in the middle
  of the Codex fields (after Origin, NPC roles, Enemy role and Tier). It's the
  first thing a GM checks; put it under the name.
- **The stat block as a pinned panel on the right**, at widths that have
  room, like a PC's pinned vitals (Decision 160, `(min-width:1280px)`), so the
  numbers stay beside the description, motivation and interactions while the
  page scrolls. Below that width it stays where it is now, at the bottom.
*To respect:* constraint 3 (the shell stays a shell: the panel is built by
`gm.js` into existing chrome, or by markup the shell already has); the pin is
a preference of this browser as 160's is, not of the table.
*Always in reach* is W80's action rail (Ken, 2026-10-08): Back and Add to
<encounter> live there, and stay put while the page scrolls.

**W78 — The cast list shows each member's stat block, to read.** *Ken · 🔎 · Fix (UI) · raised 2026-10-08*\
**Plan:** none yet · **Goes with:** W77

A GM scanning the cast for who to throw at the crew opens each member to
see their numbers. The wish: each card on the Cast tab shows the block as it
stands now, however partial (a quick-added member with only BOD shows BOD),
read-only. It's a quick reference; editing stays on the member's page.
*To respect:* `Engine.npc(block)` computes everything shown (constraint 7);
`blockHasNumber` (Decision 204) says whether there's anything to show; a long
cast still has to scroll well on a tablet, so the shape (every card, a fold,
or a toggle like *Who knows what*) needs a look.

**W80 — The left column: the page's actions, or gone.** *Ken · 🔎 · Fix (UI) · raised 2026-10-08*\
**Plan:** none yet · **Goes with:** W77

Outside the wizard the left column is empty on **every** screen: Home, every
GM table tab, and the pages under them (Ken's screenshot, 2026-10-08: a
table's Cast tab, 218px of nothing beside the page). During the wizard it holds
the eight steps, and that's the only screen that uses it.
**Ken's direction:** use it or remove it. Using it means an **action rail**:
the buttons a GM always wants, held there while the page scrolls. On a cast
member's page, Back and **Add to <encounter>** (W75, W77). On a session's page,
Back. On a tab, its one primary action (New session, quick-add, New
encounter). A screen with nothing to put there gives the column back to the
page.
*The catch, and what the fix has to answer:* the rail exists only from
**1060px** up. Below that, the wizard's steps become a strip across the top and
the column is gone. A tablet, the device GM mode is built for (plan §1a), is
below 1060px in portrait and usually in landscape. So the rail can't be the
only home for "always in reach": the same actions need a bar that stays at the
top of the page below 1060px. Build it once and place it in the rail or the bar
by width, the way the wizard's steps already do.
*To respect:* constraint 3 (the `<nav class="ledger">` the shell already has
is the place; no new markup in `index.html` beyond what's there); Decision 164
(focus keeps its place when the rail redraws); and the pinned vitals
(Decision 160), which take the right side from 1280px, so a GM screen with a
pinned stat block (W77) and the rail leaves the page the middle.

**W81 — Origin and Enemy role look like what they do.** *Ken · ⏭ · Fix (UI) · raised 2026-10-08*\
**Plan:** none yet · **Goes with:** W77

On a cast member's page, **Origin** and **Enemy role** are text fields with a
list of suggestions from the slotted packs (a `datalist`). They behave like a
dropdown when tapped, but look like a plain box, so nothing says there's a
list. The wish: a visible affordance (a ▾ on the field) that still lets the
GM type a name the packs don't have.
*To respect:* free text stays allowed (a member can have an origin or role
no slotted pack lists); the browser's own datalist styling varies, so check it
on a tablet.

**W84 — Print a cast member, an encounter, a session's journal.** *Ken · 🔎 · Fix (UI) · raised 2026-10-09 in S13a's order (SQ4)*\
**Plan:** [gm-mode S13b](plans/gm-mode.md) (no order yet) · **Goes with:** W73, W86

The plan's S13 lists printing beside the GM screen: a cast member's page
(the stat block, If Pushed, their line), an encounter (its rows, Conditions
and the round, for a GM who runs the fight on paper), and a session's
journal with its award log. S13a builds the Reference tab alone; this is **S13b**.
*To respect:* `print.css` is the sheet's, with its own front page (Decision
96), so a table page's print styles must not move the character's; no new
markup in `index.html` (constraint 3); and the award log prints in the
player's words, as the page reads it (205).

**W86 — A session copied out as Markdown.** *Ken, from Deighton · 🔎 · Fix (UI) · raised 2026-10-09 in S14's order*\
**Plan:** none yet · **Goes with:** W73, W84

Deighton keeps his notes in Obsidian, as an outline of bulleted lists. A
session's journal, its interaction lines and its jotted notes (Decision 208)
could leave the app as one Markdown file to paste or save, in the Campaign
Journal's order, so what he writes at the table lands in his own notes
without retyping.
*To respect:* it reads the table and writes nothing back (constraint 7); the
file is the player's words as the page reads them; it is the session's page's
action, not a new tab. Out of S14's scope (§6).

### For the designers

**W56 — A tuning bench: change the game's numbers, see what moves, hand back a change request.** *Ken · ⏭ · shaped with Claude 2026-10-01*\
**Plan:** none yet · **Goes with:** W116

*Set aside by the player sheet's plan when it closed (2026-10-24, `plans/archive/sheet-wishlist.md` §4): tooling, best as its own plan.*

Raised 2026-10-01. Today a numeric ruling (LUCK starting at 4, not 2) reaches
the app by Ken relaying it to Claude in a session. `shadows-data.js` is
meant for designers in a text editor (SCHEMA §1), but it's thousands of
lines of JSON, and finding the number is the easy half. The hard half is
what the number touches. The wish is a page Ken, Scott or Deighton opens,
changes numbers on, and exports as something a session then lands.

*The shape.*
- **A bench, not an editor.** It never writes `shadows-data.js`. It exports
  a *change request*: a small file listing each change as
  `{ path, from, to }`, with who proposed it, why, and the `gamedataVersion` it
  was made against. A session lands it as *Content* tier work, with the
  version bump, the changelog line, the CRB cross-check and any flag it closes.
  The tool takes the typing out of the change. Review still happens.
- **Show what moves.** A number on its own is hard to judge, so the bench shows
  what it does to characters. It loads the real engine with no DOM (constraint 5),
  so it can run sample characters (one per archetype at each power level)
  before and after the change, side by side: HP, SAN, LUCK, CP left, whatever
  differs. Deighton then sees "every Street-level character starts with 2 more
  LUCK" and not only `resources.luck.startingValue: 2 → 4`. Without this
  part it's a form over a JSON file. This part is why it's worth building.
- **Only real knobs.** It offers only numbers the engine actually reads. The
  Decision 135 key guard already knows which those are, and the bench should
  use that list and not keep its own. Invariants that look like settings
  (1 Health Level per BOD, Decision 64) aren't offered.
- **Catch prose that goes stale.** Text often repeats a number. A vehicle
  perk spells out "Boosting costs 1 LUCK, Exploding costs 2 LUCK", and SAN's
  description says the cap is 95%. The bench lists every text field that
  quotes a changed number, so the request flags the copy for a voice pass and
  the copy doesn't drift.
- **Lives in `tools/`, never shipped.** It isn't part of the player build or
  `src/`. Like the app it runs from `file://` (classic scripts, export through
  a Blob download), so it can go to Deighton as a folder.

*Settled with Ken, 2026-10-01.*
1. **Numbers only, to start.** Adding or editing advantages, archetypes or
   powers would be a content editor, which is a much bigger tool and a
   separate wish if it's ever wanted.
2. **Not hosted, to start.** It goes out as a folder. A page on the live site
   would always match `main`, so it's worth revisiting, but it would be a
   public page offering to change the rules.
3. **Sign-off stays a conversation.** Ken, Scott and Claude can raise anything
   with Deighton as needed. The request records who proposed each change, and
   the bench doesn't add an approval step.
4. **Ken hands the request to Claude, and a skill lands it.** A new
   `.claude/skills/` runbook (working name `land-a-tuning`), alongside
   `close-a-flag`. It checks the request was made against the current
   `gamedataVersion`, applies each path, and runs the before/after diff to
   decide whether Decision 68 calls for a bump. It goes through the CRB
   cross-check and pins any worked example in `tests/rules.test.mjs`. It
   rewrites or flags the stale prose, closes any flag the change answers,
   writes the changelog line, and runs `verify`. The rules stay in
   `CLAUDE.md`, and the skill only carries the steps. If applying the paths
   turns out to be fiddly, a small script can do that one step.

*Also a review sheet.* The idea came from wanting to hand Deighton the raw
numbers to check. So the bench should be readable as an audit as much as a
place to edit. Each number shows its label, its section and the text that
explains it. A **Confirmed** tick sits beside each one, and it goes out in the
same request file. A request made up only of ticks is a useful result in its
own right: a record of which numbers Deighton has checked, and against which
`gamedataVersion`.

*To respect:* constraints 1, 5 and 6 (an id is never offered for editing).
Decision 68 (a change no character can observe bumps nothing, and the
before/after diff is how you tell). Decision 135. *Change tiers* in
`CLAUDE.md`: a request is input to a Content change and doesn't replace one.
Building the bench itself is tooling no player sees, so it's not *Rule or
shape* work. Choosing how designer changes reach the data is a workflow choice
someone could have made differently, so it probably earns a decision when it
lands.

**W116 — Could anyone but Ken's sessions change the app?** *Claude · 💡 · Docs · raised 2026-10-15*\
**Plan:** none yet · **Goes with:** W56

The process docs are written for Claude sessions, and CLAUDE.md alone is
about 350 lines. "Designers edit these" (`src/data/`) in practice means
Ken's sessions edit them. That may be fine, but it should be chosen, not just
happen. If Scott or Deighton should be able to land a number or a line of
copy themselves, W56's tuning bench is the shape for numbers, and a
one-page "how to change one thing" guide could be the rest.

### The project itself

Ken asked Claude on 2026-10-15 what in the project could cause trouble down
the road, or has drifted from the norm over 200-plus decisions. These came out
of that review (W116 too, under *For the designers*). They're about how the
project is built and run, not what a player sees, except W114. Figures are as
measured that day: about 23k lines of app code, 22k of tests, 13.5k of docs,
and 226 decisions with 83 supersession marks.

**W111 — Archive the decisions that have been wholly superseded.** *Claude, raised by Ken's review · 🔎 · Docs · raised 2026-10-15*\
**Plan:** none yet · **Goes with:** W112

SCHEMA §4 keeps every decision forever, so a cold session pays for dead
entries every time it searches the ledger, and Decision 130's "search before
you propose" gets slower with each one. Entries wholly replaced by a later
decision could move to an archive file under `docs/log/`, leaving SCHEMA with
only the decisions that are true now.
*To respect:* numbers are never reused or renumbered (578 citations in `src/`
point at them). `docs.test.mjs` checks the ledger against INDEX §3 and refuses
a gap, so the archive has to count as part of the ledger, or SCHEMA keeps a
one-line stub per moved entry. Deciding which of those two is the open
question. Superseded *in part* stays in place. INDEX keeps its struck-through
lines, pointing at the archive.

**W112 — Number fewer decisions.** *Claude · 💡 · Docs, process · raised 2026-10-15*\
**Plan:** none yet · **Goes with:** W111

The bar is "a player-facing behaviour someone could reasonably have chosen
otherwise", and nearly every UI tweak clears it. So a card's line spacing can
become a ledger entry, and the entries that govern rules and file shapes get
buried among them. One option: number rules, data and save-file shapes, and
architecture. UI choices would live in the PR and the log, with a decision
only when one is reversed or argued over.
*To respect:* this changes CLAUDE.md's *Decisions* and *Change tiers*
sections and Decision 131, so it is itself a decision, proposed before it's
made. Pairs with W111.

**W113 — Retire guards, not only add them.** *Claude · 💡 · Fix, process · raised 2026-10-15*\
**Plan:** none yet

The tests are about as large as the app (`engine.test.mjs` alone is 8.6k
lines). Every finding that becomes a mutation-tested guard stays forever.
Several test files read `src/` as text and pattern-match it, which checks how
the code is written rather than what it does, so a harmless refactor can
break them. Add a question to the per-batch review: does any guard this batch
touched still protect something, and could a text guard become a behaviour
test?
*To respect:* the guards on CLAUDE.md's hard constraints stay. A `todo` test
is a known defect, never retired to tidy the output.

**W114 — Cap the character's audit log.** *Claude · 🔎 · Rule or shape · raised 2026-10-15*\
**Plan:** none yet

`ch.audit` has no limit. The GM table's log is capped at 500
(`TABLE_AUDIT_MAX`), but a character's grows with every action for the life
of the campaign. The whole file is rewritten to `localStorage` on every
action, and under `file://` Chromium gives every local page one shared
origin, so all characters share one ~5MB quota. A failed save is already
reported to the player, so nothing is lost silently. It's still a wall a long
campaign will hit.
*To respect:* a cap changes how far back undo reaches, so propose it first.
Measure bytes per entry and the size of a long campaign before choosing a
number. Find every reader of `ch.audit`, not only undo. Decision 124 governs
what undo may write. A cap applied on load is a `migrate()` concern.

**W115 — Split the engine into character and table scripts.** *Claude · 💡 · Rule or shape (architecture) · raised 2026-10-15*\
**Plan:** none yet

`src/engine/engine.js` is about 7k lines: character rules, migration, the
audit, and the whole GM table and encounter engine. The no-modules rule
doesn't require one file (the UI is already five classic scripts). Two engine
scripts would give each session a smaller file to hold.
*To respect:* constraints 2, 4 and 5 (classic scripts, fixed order, no DOM).
`tools/build.mjs` and the build tests list the scripts. Tests load the engine
with no DOM, so both halves have to load that way.

## 2. Notes for whoever picks these up

- **Next free number: W138.** Everything above is open. What was built is in
  [`log/wishes-granted.md`](log/wishes-granted.md).
- **The primitives worth reusing.** A modal (`openModal`, Decision 111) for
  anything that takes the screen; a popover (`openPopover`, Decision 119)
  for a small panel beside what opened it, which follows the render; the
  catalog browser (`openCatalog`, Decision 118), which takes a new catalog
  as a `kind` with `Engine.catalogLine` reading it; the undo toast, which
  every `commit()` gets for free.
- **One binder per set of controls.** Trackers' vitals controls are bound by
  `bindVitalControls(root)`, so a popover and the page can't drift apart.
  A new place that shows the same controls should call it, not copy it.
- Most of these don't touch rules. If one starts to — e.g. it wants to show a
  computed number the engine doesn't have yet — that part stops and goes to
  Deighton.
