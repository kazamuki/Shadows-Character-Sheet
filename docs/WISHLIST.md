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

**Adding an item:** next free `W` number, never reused. Say who raised it, what
the player feels today (not just the fix), and anything the fix has to respect —
a hard constraint from `CLAUDE.md`, a decision, a rules question. A rules
question means the item is blocked on Deighton, and it says so. Claude adds
items here too, marked as such; Ken triages them.

**Status:** 💡 idea · 🔎 needs a look (shape unclear) · ⏭ ready (shape is clear, just needs doing)
---

## 1. Items

### From the first playtest

Brogan's feedback from the first playtest of the character sheet, written up by
Ken on 2026-10-10 and shaped with Claude. Thirteen notes. Smartlink modifiers
are folded into **W69** (below, under Loadout). "A Vampire's Innate powers are
granted" led Ken to rule F38 and F39 together, for both archetypes, and that
ruling is built by **W88**.

**W87 — Holding a spell takes a die off the table.** *Ken, from Brogan · ⏭ · Rule or shape · raised 2026-10-10 · ruled by Deighton 2026-10-10*
Today Concentration is a line in the Spellcraft reference (`spellRules.concentration`)
and nothing more. A player holding Fog Shroud has to remember that a die is
missing from every Essence roll until they let it go. **Deighton's ruling
(2026-10-10, `reference/rulings-2026-10-10.md` Q17–Q19), which replaces
`0480`'s "dice equal to its Threshold":**
- A Concentration spell is held **only once it succeeds**. Then it sets aside
  **one die** for as long as it's held, from **every Essence roll**: casting,
  Charging, defending, resisting.
- An Arcanist can hold **as many spells as their Evocation rank**, a die each.
- Anything that would sensibly break concentration (taking damage, a Shock,
  going down) calls for a **WILL Essence check** to keep it. Its **TN and TH
  aren't set yet**: open a flag when this is built and stub them. The GM decides
  when a character is unconscious; the sheet never releases a spell on its own.
- Released at will, any time.

So Brogan's one die was right, and the book and the sheet's reference text
change. The fix is a **Holding** marker, set from the Grimoire on a spell
tagged `Concentration`, with **Release** beside it and **Check to keep**
offered where damage is taken; every place showing an Essence pool shows the
dice set aside.
*To respect:* constraint 7: what's stored is which spells are held, and the
dice set aside are their count. A stored field is a save-file shape change:
a schema bump and a `migrate()` step. It isn't a Condition from `0540`, so
it gets its own marker, shown the way a Condition is. `spellRules.concentration`
is rewritten to the ruling (a `gamedataVersion` bump), and the book's fix is in
`plans/crb-catch-up.md`.

**W88 — Vampire and Werewolf powers at creation: Innate granted, Bloodline and Origin chosen, CP to raise them.** *Ken, from Brogan · ⏭ · Rule or shape · raised 2026-10-10 · closes F38, F39*
Brogan expected a Vampire's Innate powers to come free, and expected CP to
raise Vampire and Werewolf powers the way it raises an Arcanist's
Disciplines. Neither works today. **Ken's ruling (2026-10-10), for both
archetypes:**
- **Every Innate power is granted at rank 1.** A power with no ranks
  (Preternatural Speed) is simply held.
- **A Werewolf's Origin starter power is granted at rank 1 too.**
- **Base Powers are spent on the Bloodline's or the Origin's other powers**,
  one rank each, none above Max Starting Rank. Two in one power makes it
  rank 2.
- **CP raises any held power** at 5 CP a rank (Decision 157's price, which
  only Disciplines were ever wired to), capped by Max Power Rank. CP doesn't
  add a Bloodline or Origin power the Base Powers didn't choose; that's IP
  in play (W72).

What the app does today is each flag's stub. The Vampire spends Base Powers
on Innate and Bloodline powers alike, and holds only what they placed
(Decision 200). The Werewolf carries every Innate and Origin power at rank
1 and spends nothing (Decision 196). So this supersedes both **in part**.
*To respect:* a numbered decision citing both, closing F38 and F39 (three
edits each). Decision 135: the granted set and the chooseable set are read
from the archetype's data, with no archetype id in code. CP spent on powers
counts in `cp()` beside `disciplineSpent`. *A save-file question for the
proposal:* `powersBought` changes meaning, so a schema bump and a
`migrate()` step. A saved Vampire whose Base Powers went into an Innate power
gets those placements back to spend again. A saved Werewolf holds Origin
powers it never chose: keep them, or ask? Max Starting Rank and Max Power
Rank both bind a rank at creation, so the proposal should name which wins
when they differ. The book says otherwise in both chapters: `0413`'s
"can learn" and `0414`'s "carries the whole kit". Those fixes are in
`plans/crb-catch-up.md`.

**W89 — Spend IP on an Advantage, or to buy off a Disadvantage.** *Ken, from Brogan · ⏭ · Rule or shape · raised 2026-10-10 · priced by Deighton 2026-10-10*
After lock, Advantages and Disadvantages are frozen. The only ways to change
them in play are the Talented and Redeemed Minor Milestones. `0450`
prices both: **an Advantage costs its creation point cost × 10 per rank, and a
Disadvantage comes off the same way, one rank at a time.** A few
Disadvantages (Pact among them) already say "spend IP to remove" and point
here.
*To respect:* constraint 7: the IP journal records the purchase, and the
held Advantages are read from creation plus the journal, never rewritten.
Decision 152: a Supernatural still buys only Universal Advantages, and a
prerequisite still binds. Buying off a Disadvantage takes its rules off the
sheet but doesn't refund the CP it granted at creation. **Deighton ruled
(2026-10-10, `reference/rulings-2026-10-10.md` Q24): every rank costs the same flat price**, and a
Disadvantage's buy-off follows it. Nothing blocks it now.

**W90 — Cybernetics.** *Ken, from Brogan · 🔎 · Rule or shape · raised 2026-10-10 · blocked on design: F6, F19*
Playtesters want chrome. The design answer is already set (STATE §3, the
Cyborg row): the Cyborg archetype was cut, and cybernetics become a list and
an install mini-game, **Professionals only**. `0470` is still an outline
(Implants, Upgrades, Replacements, Platforms, with no entries and no costs),
so there is nothing to build from yet. This entry records that players asked;
the work is STATE's Cyborg row, which retires `cyborg`, closes F6 and F19, and
gives the Professional Installed Cybernetics.

**W91 — Vehicles you can buy and own, Powered Armor among them.** *Ken, from Brogan · 🔎 · Content, then Rule or shape · raised 2026-10-10*
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

**W92 — Pain Sensitive does nothing.** *Ken, from Brogan · ⏭ · Content · raised 2026-10-10 · bug*
The Disadvantage says "Your Pain Level is always 1 higher than normal. Does
not apply if you have no pain levels." `painState()` never reads it: a Pain
Sensitive character's Pain Level, penalties and the vitals are those of a
character without it. Ken's reading (2026-10-10): **+1 once the Pain Level
is 1 or more**, from any source (Health Levels lost, Agonized, Phantom
Pain's PL 1 at full health per Decision 109, or Withering under Pain
Immunity), and clamped to the table's top. At Pain Level 0 it adds nothing.
*To respect:* the shift is data the engine reads (a `pain` field on the
Disadvantage, say), not an id in code (Decision 135). `painSources` names it,
so the sheet says why. Pin the reading in `tests/rules.test.mjs`. Player-
visible: a CHANGELOG line and a patch bump. If the data field is new, the
`gamedataVersion` bumps too (a character's computed Pain changes).

**W93 — A roll box with a modifier takes the dice, and says it adds the rest.** *Ken, from Brogan · ⏭ · Fix (UI) · raised 2026-10-10 · bug*
Taking the **Improved** Minor Milestone asks you to "Roll 2d10+15 … and enter
the result" (3d10+30 once W103 lands Deighton's rebalanced values). Brogan rolled two 7s, typed 14 and expected 29, and got 14. The
box wants the total, but nothing beside it says so. Brogan's fix: the box takes
**the dice alone**, with **+ 15** (+ 30 after W103) printed after it, and the
app adds the modifier. The wizard's rolls already work that way: the rolled Stat Point
pool shows `40+1d10` beside a box for the die and adds the 40 itself, and
the result shows next to it. Improved is the one that doesn't, so it
should match them. Check the sheet's other roll boxes (the repair kit's
die) while there.
*To respect:* the `+15` is a number in the data the engine adds (Decision 134:
numbers the engine reads, not formula text). Today it's in the benefit
prose and hardcoded in `sheet.js`. Exploding 10s still mean the player
adds up the dice they rolled, explosions included; the label says so.
Player-visible: a CHANGELOG line and a patch bump.

**W94 — Set every stat to 4 in one click.** *Ken, from Brogan · ⏭ · Fix (UI) · raised 2026-10-10*
Every stat starts at a free 1, and below 4 it's a −1 per point (Decision 150,
`statRules.modifierRuleText`), so nearly everyone's first move on the Stats
step is eight trips to 4. A **Set all to 4** button raises every stat
under 4 to 4, spending Stat Points as usual: 3 a stat, 24 at most, out of a
pool of 41 or more. A stat already above 4 is left alone. It's a shortcut,
not a rule: the free base stays 1.
*To respect:* it goes through the same spend as the steppers, so the pool,
the caps and Undo behave exactly as eight clicks would. If the pool can't
cover it, it raises what it can, in stat order, and says so.

**W95 — Expert mode: creation that fits on one screen.** *Ken, from Brogan · 🔎 · Fix (UI) · raised 2026-10-10 · touches W59*
A returning player scrolls past every Skill, Advantage and Disadvantage's full
text to find the one they want. An **Expert mode** toggle collapses each to
its name, cost and controls, with the text a tap away, so more fits at
once. Brogan also asked that the Character Points step's stat and skill
boosts be **compact**: a **− / +** pair without the count between them,
taking less room.
*To respect:* a toggle is view state, remembered in the browser like the
Character tab's Expand all (Decision 158), never saved in the character.
W59 is the floor for the compact steppers: a stepper still says what it
changes, and its new value is still announced, even if the number moves out
from between the buttons. *Questions:* where the boost count goes when it
leaves the stepper (the rank's total already shows it?); does Expert mode
reach the Character tab too, or creation only.

**W96 — A Supernatural doesn't see the Advantages it can't buy.** *Ken, from Brogan · ⏭ · Fix (UI) · raised 2026-10-10*
On the Advantages step a Vampire or Werewolf scrolls past every non-Universal
Advantage, shown disabled (`wizard.js`, `gated`), to find the 15 it can take.
Hide them instead. The rule line already says only Universal Advantages are
open.
*To respect:* Decision 152. An Advantage the character **already holds** but
can't (an archetype changed after buying it, which `validate()` reports)
stays visible so it can be removed. The jump bar's filter and counts read the
same list.

**W97 — Rate of Use counts what you've spent this turn.** *Ken, from Brogan · 🔎 · Rule or shape · raised 2026-10-10*
SFR's description says Rate of Use "limits the maximum SFR channeled in a
single turn", and sustained powers drain against it each turn. The sheet
shows RoU but counts nothing against it, so a player can spend a whole pool
in one turn without the sheet noticing. The ask: count SFR spent since the
last **Turn Reset** (the button conditions already tick on), warn at RoU,
and clear the count on Reset.
*To respect:* constraint 7: what's stored is SFR spent this turn (a tracker
input). The cap is `rou` read from the scaling row, plus `grants()`' `rou`
(Werewolf Majors, Decision 199). A new tracker field is a save-file shape
change. *Questions before a proposal:* **warn or block**. Brogan said
"warn/block"; a block is the GM's rule taken out of their hands, so the
proposal should argue for a warning. Do sustained powers need to be marked
active so Reset charges their drain on its own, or does the player spend it
each turn? And Feeding: Fresh blood refills SFR. Does gaining SFR touch
the count?

**W98 — Walk, Run, Sprint and Jump on the sheet, from MOB.** *Ken, from Brogan · ⏭ · Content · raised 2026-10-10 · jump ruled by Deighton 2026-10-10*
MOB's description promises "base running speed, sprint speed, and how far you
can jump with a running start", and the sheet shows none of them. `0530`
gives three: **Walk = MOB, Run = MOB × 3 (−1 to attacks), Sprint = MOB × 6
(−3)**. Fleet of Foot (a Professional's Chi ability) doubles all three. Show
them on Main beside the combat numbers.
*To respect:* the quick reference's movement table is display text
(`"MOB ×3"`). The engine needs the multipliers as numbers (Decision 134),
read by both. A doubling from Fleet of Foot only counts while it's active.
**Jump** wasn't in the book; **Deighton ruled it (2026-10-10, `reference/rulings-2026-10-10.md` Q23):
Jump = Sprint ÷ 4, rounded down**, and with Fleet of Foot, Sprint doubles first
and then divides. The ÷ 4 is a number in the data too. The book's fix is in
`plans/crb-catch-up.md`.

**W99 — The Character tab's section headings line up.** *Ken, from Brogan · 🔎 · Rule or shape · raised 2026-10-10 · reopens Decision 168 in part*
On the Character tab, sections like **Baseline Traits** and an Arcanist's
**Aberrations** start wherever the column flow puts them, so their headings
sit at different heights and the page is hard to scan. Decision 168 chose
that flow: "parts flow into ~340px columns that break between cards". Ken's
ask: **a section heading always starts a row, and its cards flow beneath it**
in as many columns as fit (3, then 2, then 1 as the screen narrows). Every
section heading lines up at the left, however many columns there are.
*To respect:* this trades away part of what 168 won (no gaps, the page's
width filled), so it's a superseding decision when built. Pinned vitals
still take their columns back. `npm run phone-check` at phone and tablet
widths. *Question:* is a short section (one card) allowed to sit beside
the next one when there's room, or does every section get its own row?

### From Deighton's rulings

Deighton answered every open rules question on 2026-10-10, word for word in
[`reference/rulings-2026-10-10.md`](reference/rulings-2026-10-10.md). Rulings that
change what the app does are built from these entries, grouped by where they
live in the code; the flags they close are in `SCHEMA.md` §5. Rulings that only
answered an existing wish were written into it (W39, W53, W69, W87, W89, W91,
W98).

**W100 — Distances in meters or feet.** *Ken · 💡 · Fix (UI) · raised 2026-10-10 with F31's ruling*
Deighton thinks in feet (the mono-whip reaches "5 or 6 feet"), the sheet in
meters. Ken's idea: a metric/imperial switch, so a table that plays in feet
reads every range, reach, radius and movement figure that way.
*To respect:* display only; the data stays in meters. Most distances are text
today (`"2m"`, `"5m radius"`, range bands in the quick reference), so converting
them means storing the numbers (Decision 134) before any switch. A view
setting, remembered in the browser, never in the character.

**W101 — CRANK behind a feature flag until the team decides.** *Ken, from Deighton · ⏭ · Rule or shape · raised 2026-10-10*
Deighton doesn't know CRANK and wants the team to talk it through before
anything else changes (`reference/rulings-2026-10-10.md` Q30). Ken's call:
hide it, as GM mode is hidden, and keep the work. CRANK is released (Decision
169): Main's card, the Progression section with its ledger, its popover, the
admin −1/+1, and GM mode's off-screen job (206) all show it.
*To respect:* `FEATURES` (Decision 173) gains `crank:false`, and each of those
places reads it; `?crank=on` shows it again. A saved character's rep and ledger
stay in the file, untouched (constraints 7 and 8), and come back when the flag
is on. Hiding a released feature is player-visible: a CHANGELOG line and a
patch bump, and a decision, since it's a choice someone could have made
otherwise. GQ7, F37 and GQ28 wait on the same talk.

**W102 — Deighton's rulings on the hit and on healing.** *Ken, from Deighton · ⏭ · Rule or shape · raised 2026-10-10 · closes F18, F23, F24, F25, F36*
Ruled 2026-10-10 (`reference/rulings-2026-10-10.md` Q1–Q7), built together
because they all live in the hit resolver and recovery:
- **F23:** Electric and Burning are Energy, as stubbed. The **Resistance**
  upgrade's 50% is applied, **halving first, then PROT and RES**, instead of
  the hit panel telling the player to adjust by hand.
- **F25:** Natural Armor's stub stands, except that **AP on a spell pierces it**.
- **F24:** ongoing damage on a Dying character at a Reset asks **the WILL
  check as usual, plus** a Death Mark per ticking source (today a mark stands
  in for the check).
- **F36:** **healing counts from 0 HP**; damage past zero shows how bad things
  are while Dying and is wiped by the first healing. A GM who plays it gritty
  keeps it: an option, off by default (Ken).
- **F18 and grenades:** no MD ratings to assign (one MD is 10 points of Massive
  damage), the extra Health Level when armor drops to 0 stays, and grenades
  and explosives deal **Massive** (the Thunderclap's and Junk Bomb's 2x+ Injured
  then follows the rule).

*To respect:* a numbered decision citing Decisions 99, 100, 104 and 151, and
closing five flags (three edits each). F36's option is a stored choice: on the
character (a schema bump) or a GM table setting? Decide in the work order;
prefer the character, since the sheet works without a table. Grenade damage
types are data (`gamedataVersion`). GM mode's hit (Decisions 191–192) reads
the same engine, so check it moves with it.

**W103 — Deighton's Milestone rulings.** *Ken, from Deighton · ⏭ · Rule or shape · raised 2026-10-10 · closes F9*
Ruled 2026-10-10 (`reference/rulings-2026-10-10.md` Q24–Q28, Q32):
- **F9:** the General Major Milestones are **the Professional's only**. Every
  archetype will get its own (Ken); until then an Arcanist has none (F32), and
  a Werewolf keeps only its own. A saved character who took a General one keeps
  it, with `validate` warning (constraints 7, 8 and 10).
- **Minor Milestones repeat at any time**, which supersedes Decision 29's "not
  until all five have been taken once".
- **The rebalanced values:** Skilled is two Skills, one rank each (was 5 Skill
  Points); Improved is **3d10+30** IP (was 2d10+15); Redeemed takes a
  Disadvantage worth 5 points or less (was any). A Minor already taken keeps
  what it gave.
- Talented and the cap of 10 stand as the sheet has them.

*To respect:* a numbered decision superseding Decision 29 in part; data changes
and a `gamedataVersion` bump. W93's roll box should land with or after it, so
the new +30 is printed beside the dice.

**W104 — Deighton's gear rulings, and the reference text that follows.** *Ken, from Deighton · ⏭ · Content, plus a save shape for F34 · raised 2026-10-10 · closes F26, F30, F31, F34*
Ruled 2026-10-10 (`reference/rulings-2026-10-10.md` Q8–Q11, Q33):
- **F26:** a shotgun takes neither the Scope nor the Angel Mod, as stubbed.
  Close the flag and say why in the notes.
- **F30:** Anti-Materiel does nothing extra to people; its glossary text says
  it means vehicle armor doesn't stop it.
- **F31:** the Reach column is the weapon's reach, in meters; the tag marks an
  unusual one (the mono-whip) and adds nothing.
- **F34:** a partly spent magazine is **kept with its count**. Today a Reload
  fills from a fresh magazine and the sheet counts whole magazines carried
  (Decisions 145, 149), so carried magazines need their counts: a save-file
  shape change, with a decision, a schema bump and a `migrate()` step.
- **Difficulty names:** Easy / Average / Challenging, replacing easy / medium /
  hard wherever the data and the copy say them.

*To respect:* F26, F30 and F31 are text and a closed flag each (Content, and
the `playerNote`s that explained the stand-ins go). F34 is the only part that
needs a proposal, so it can split into its own session if it grows.

**W105 — Deighton's Vampire rulings.** *Ken, from Deighton · ⏭ · Rule or shape · raised 2026-10-10 · closes F41*
Ruled 2026-10-10 (`reference/rulings-2026-10-10.md` Q20–Q21):
- **F41:** an Upyr **holds both** Built to Last powers (Iron Hide and Icebound
  Resilience); they just don't stack. Ken's creation-pick reading (VQ25) is
  withdrawn: the pick and its bar on Base Powers and IP go, and a saved Upyr
  keeps the one it chose (`migrate()` needs no step if `optionPicks` is simply
  no longer read for it; check).
- **Day Rest:** a day without rest costs **half RoU plus 2 SFR**, and it doesn't
  rise day to day. The Thirst panel (Decision 201) gains it beside "A day unfed".

*To respect:* a numbered decision superseding Decision 200 in part (Built to
Last) and adding to 201; `gamedataVersion` for the data. Land it beside W88,
which also rewrites how a Vampire's powers are held.

### Loadout & catalog

**W69 — Gear that changes what you can do while you wear it.** *Ken, from Deighton · ⏭ · Rule or shape · raised 2026-10-08 · answered by Deighton 2026-10-10*
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

**W72 — Learn an archetype power in play.** *Claude · ⏭ · Rule or shape · raised 2026-10-08 in crb-v4-sync P4*
A Vampire holds only the powers its Base Powers placed a rank in (Decision 200),
so **Raise a Power** lists only those: an Innate or Bloodline power it never
took can't be learned with IP. `0450` prices a new power at 40 IP; Raise a
Power could list the archetype's unheld powers under **Learn**, as it does an
untrained Discipline. Stored as `powerIpe` alone, a power learned in play
would need its rank read as `powerIpe` with no Base Power under it. P4b's
Splice and Cursed Evolution (another Bloodline's powers, VQ4) want the same
door, so build it there or before.

**W70 — A custom item the player is done writing reads like the catalog's.** *Ken · ⏭ · Fix (UI) · raised 2026-10-08*
A custom gear, weapon or armor row (`custom: true`, Decisions 120–121) stays
a set of open inputs on Loadout for as long as the character has it, so it
looks unfinished beside catalog rows and is easy to change by accident.
Ken's ask: a **Done** (or "complete") control that folds the row into the same
read-only line a catalog item gets, with an **Edit** to reopen it.
*To respect:* whether a row is open is either view state (nothing saved) or a
stored flag on the row. A stored flag is a save-file shape change (a schema
bump and a `migrate()` step, and an old file's custom rows come in folded or
open by rule), so prefer view state unless Ken wants the choice to survive a
reload. The folded line goes through `Engine.catalogLine` or its custom
equivalent, so a custom item reads exactly as a catalog one does. Player-
visible: a CHANGELOG line and a patch bump.

**W39 — Train a Martial Arts style in play, and apply its bonus.** *Claude · 🔎 · Deighton answered 2026-10-10*
Raised 2026-09-25, finishing W33. The wizard lets a player choose up to two
styles, and Martial Arts says "you may train additional styles later in
play", but a locked sheet has no way to add one: `setSelection` is only
reached from the wizard, and the pick's two-slot cap is a creation rule. The
bonuses ("+1 Stun", "+1 Grapple") are shown, never applied, and nothing says
what +1 Stun adds to. **Deighton (2026-10-10, `reference/rulings-2026-10-10.md` Q29), with Ken:** a
new style is learned through the story (a mentor, or the LINK's neural
training) with an in-game reason, then trained on your own or through
fighting. It isn't bought with IP: IP raises the Martial Arts skill, which
makes every Martial Arts check easier. Stun and Grapple are attack
Conditions, and a style's bonus makes you better at inflicting that
Condition. So learning a style is the GM's word (an **Add a style** that
asks no price, logged), and the bonus is the one number left to pin: +1 to
the check that inflicts it, presumably. Confirm that in the work order.

### The sheet at the table (from the design critique)

The 2026-09-30 design critique (27/40, snapshot in `.impeccable/critique/`)
and its 2026-10-01 re-run (29/40) are mostly built: W43, W42, W44, W46, W47
and W57, then W45 and W58 (Decisions 165 and 166). What's left is W59 and
the last of W60. Since W43, controls are 44px on a touchscreen and
`npm run phone-check` fails on anything smaller, or on text under 11px; since
W45 it also fails on a vitals bar or a sheet's jump bar of two rows, and on a
phone's Health card below 30% of the screen. A new control inherits those
floors rather than re-arguing them.

**W65 — LUCK bought with CP counts against the Max Character Point Boost.** *Ken · ⏭ · Rule or shape · raised 2026-10-04 from the CRB's Campaign Power Level table*
Today a player can buy any amount of LUCK with CP at creation: Decision 5
makes it "exempt from Max Boost", and the wizard's Luck row says so
(`wizard.js`, "exempt from Max Boost"; `luckSpent` in the engine has no cap
and `canBoost` never sees it). The CRB table says Max Character Point Boost
caps how many times CP may raise any one stat, skill, power or Luck at
creation, so a Street Level character can put at most 2 points into Luck this
way (2 / 3 / 4 / 5 by level, the same numbers as `powerLevels[].maxBoost`).
**Ken's rulings, confirmed by Deighton (2026-10-04):** only CP spent on Luck counts, so the 4 free
starting LUCK are outside the cap; and Luck is capped like everything else,
because consistency is the right place to start. That reverses Decision 5's
exemption and Decision 157's "bought up to 5 becomes 7" example.
*To build:* a numbered decision superseding Decision 5 in part (marks in
SCHEMA and INDEX); the Luck buy-up held to `pl.maxBoost` in the stepper and
`validate`; the "exempt" copy in the wizard and in `creationFlow` step 7's note
removed; `gamedataVersion` per Decision 68, since what a character can choose
moves. A character file already over the cap must load untouched, with
`validate` warning and nothing in the file changing (constraints 7, 8, 10).
Deighton confirmed both rulings (Ken asked, 2026-10-04); playtests and player
feedback may revisit them, so the decision's **Revisit if** should say so. No
open flag. Do it with W66, which touches the same row's text.

**W67 — The session log's default date is UTC, so it says tomorrow in the evening.** *Claude · ⏭ · Fix · raised 2026-10-05 in W29 S8b*
`sheet.js` defaults a new session's date with `toISOString().slice(0,10)`,
which is the UTC day: after 7 pm in New York (or whenever the local day is
behind UTC's) a player's new session is dated tomorrow. `gm.js`'s `localDay()`
builds the day from `getFullYear`, `getMonth` and `getDate` and is the pattern.
*To respect:* a session already saved keeps its date; only the default moves.
Player-visible, so a CHANGELOG line and a patch bump, and a test that builds the
date in local time (as S8b's `localDay` test does) and runs under a UTC+ zone.

**W66 — Rename "Max Boost" to "Max Character Point Boost" in the app.** *Ken · ⏭ · Fix (copy) · raised 2026-10-04*
The CRB's table column still reads "Max Freebie Boost", which is the old name
(Decision 2 renamed Freebie Points to Character Points but left this one as
"Max Boost"). Ken's name is **Character Point Boost**; the column becomes Max
Character Point Boost. Player-facing strings that say "Max Boost" or "Boosts"
for the CP purchase: `wizard.js` (the level summary chip, the Boosts section
heading, the Luck row), `sheet.js` (the power-level change note), and engine
messages (`canBoost`'s "Max Boost reached"). *To respect:* **ids and data keys
stay** (`maxBoost`, `boosts`, constraint 6), since a saved file may name them.
Only display text moves, and `docs/VOICE-APP.md` decides the wording. Do it with
W65, since both touch the Luck row's text. It is a player-visible change, so it
needs a CHANGELOG line and a patch bump.

**W64 — Go back Home from character creation.** *Ken · ⏭ · raised 2026-10-04*
In the wizard there's no way back to the Home screen. The sheet has **Home**
in its ⋮ menu, but the wizard header is empty (`renderTopChrome` clears the
actions on the wizard screen), so a player who wants their roster, or
to start over, refreshes the page. Ken's choice: **a Home control in the
wizard header**, matching the sheet's.
*To respect:* nothing is lost by leaving. A new character is saved the moment
the player changes something (`btn-new` in `renderHome`) and appears under
Your characters, so Home needs no "are you sure?" for a touched character.
An untouched one was never saved and just disappears, which is fine. The
control is 44px on a touchscreen (`phone-check` fails below that) and must not
push the header to a second row. It reuses the `data-home` handler in
`bindMain`, which the sheet's menu also reaches.
Worth a look while there: the Home reset sets only `{screen, ch, step,
maxReached}` in `bindMain` but also `section` and `admin` in the sheet's
version in `renderTopChrome`; one helper would stop the two drifting.

**W59 — Steppers don't say what they change.** *Claude · 🔎 · critique P2, 2026-10-01*
Every stepper is `aria-label="decrease"` / `"increase"` (`wizard.js`,
the stepper helper): the Skills step has 36 buttons that all read "increase,
button", and the value beside them isn't a live region, so a screen reader
never hears the new number. *The fix:* name the target ("Raise BOD",
"Lower Firearms") from the same data the row shows, and announce the value
after a press, politely, once.

**W60 — Small accessibility and copy fixes from the re-run.** *Claude · 🔎 · critique P2–P3, 2026-10-01 · mostly shipped in 0.36.0*
Seven of the eight shipped in 0.36.0 (`docs/log/shipped.md`). Pin from Main
came with W45 (Decision 165). The other six: placeholders at `--dim`, the picked wizard card reads pressed, step sentences end as
sentences (and step 7's note no longer says "maxBoost"), the window's title
names the character, headings no longer skip a level, and the meter's
transition, which never played, is gone. Each has a W60 smoke test. What's
left is one:
- `.76rem` is off the type ramp: an inline style at `sheet.js:1811` and about
  nine rules in `shadows.css`. A ramp question for a typeset pass, moved here
  from W46. *Harden.* Anything that steps down stays at or above 11px
  (`.7rem` is 11.2px; `phone-check` fails below 11), and the inline style
  should become a class first, since a ramp sweep of `shadows.css` won't find
  it.

### Beyond one sheet

**W29 — A GM mode: link to the table's characters, read them, leave notes.** *Ken · 🔎 · planned, not approved: `plans/gm-mode.md` (the file-based stage and the GM toolkit; live sync stays here)*
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

**W38 — Two tabs open on one character overwrite each other.** *Claude, raised in S6c · ⏭ · planned: `plans/two-tabs-one-character.md`*
Open the same character in two browser tabs, play in one, then touch anything
in the other: the second tab saves its older copy over the first's, and the
play is gone with no warning. The roster (Decision 141) doesn't cause this, and
the single-slot app had it too, but a list of characters makes several open
tabs more likely. *The fix:* listen for the `storage` event. When another tab
writes the entry for the open character, stop saving from this tab and say so,
with a button to reload from the newer copy. *To respect:* the app works
without storage, so the listener is guarded like every other read.

**W62 — Slotting a file in reads it on screen, like a script loading in NYTE City.** *Ken · 💡 · raised 2026-10-02 with GQ10's packs*
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

**W63 — The hosted sheet is a demo; the full game is a pack you slot in.** *Ken · 🔎 · Rule or shape · raised 2026-10-04 · reopens GQ10 in part*
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

**W68 — How well a cast member knows each of the crew: a face, a regular, a name.** *Ken · 💡 · Rule or shape · raised 2026-10-07 in W29 S10c's order*
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

### GM mode, from testing the build

Ken's notes from playing with GM mode (switched off) on 2026-10-08. Each sits
alongside W29's plan (`plans/gm-mode.md`), not inside it. A work order can pick
any of these up once Ken says yes.

**W73 — A session can have a name.** *Ken · ⏭ · Rule or shape · raised 2026-10-08 in S5a's review*
A table refers to its past by session: *"when did we learn that? Session 2,
The Ledger."* S5a (Decisions 203–204) gives a session a number the GM sets and
a day, and nothing else names it. The wish is an optional `title`, shown after
the number wherever a session is named: the list, *Closed in*, an
interaction's *Session 2*, and Next session's *Last session set up*.
*To respect:* table schema bump and a `migrateTable()` step (`""` for every
session already there); the number stays the identity and the sort (Ken,
S5a's review: "last session" is by number), and the title is text only.

**W77 — A cast member's page, laid out for the table.** *Ken · 🔎 · Fix (UI) · raised 2026-10-08*
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

**W78 — The cast list shows each member's stat block, to read.** *Ken · 🔎 · Fix (UI) · raised 2026-10-08*
A GM scanning the cast for who to throw at the crew opens each member to
see their numbers. The wish: each card on the Cast tab shows the block as it
stands now, however partial (a quick-added member with only BOD shows BOD),
read-only. It's a quick reference; editing stays on the member's page.
*To respect:* `Engine.npc(block)` computes everything shown (constraint 7);
`blockHasNumber` (Decision 204) says whether there's anything to show; a long
cast still has to scroll well on a tablet, so the shape (every card, a fold,
or a toggle like *Who knows what*) needs a look.

**W79 — An interaction reads as a sentence: who, what they did, with whom, what, when.** *Ken · 🔎 · Rule or shape (copy) · raised 2026-10-08*
Today a member's line is chosen kind first (*Told them*), then the crew,
the day and the text, and it reads in that order. Ken's order, crew first:
- *Scott told Bob "the lake is on fire" on 10/08/26*
- *D learned from Bob "snakes can fly" on 10/08/26*
- *PC helped Bob · PC wronged Bob · PC killed Bob · PC owes Bob · PC fought Bob*
- *They owe* (`owed`) needs its own wording, crew first if it can be (*PC is
  owed by Bob*?). **Open; a voice pass decides.**

The member's name goes where *them* is today; an unnamed member is *them*.
The add row follows the same order: crew, then the verb, then what, then the
day. *Who knows what* (Decision 179) and a session's page (S5a) read the same
sentence.
*To respect:* the kinds' ids never change (`shared`, `learned`, `helped`,
`wronged`, `killed`, `owes`, `owed`, `fought`; constraint 6). Only their
labels and the order move. S8b's SQ4 chose labels *from the crew's side*,
and this keeps that. Decision 177 says interactions are the one place for
the sentence. The day's format follows `dayText`.

**W80 — The left column: the page's actions, or gone.** *Ken · 🔎 · Fix (UI) · raised 2026-10-08*
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

**W81 — Origin and Enemy role look like what they do.** *Ken · ⏭ · Fix (UI) · raised 2026-10-08*
On a cast member's page, **Origin** and **Enemy role** are text fields with a
list of suggestions from the slotted packs (a `datalist`). They behave like a
dropdown when tapped, but look like a plain box, so nothing says there's a
list. The wish: a visible affordance (a ▾ on the field) that still lets the
GM type a name the packs don't have.
*To respect:* free text stays allowed (a member can have an origin or role
no slotted pack lists); the browser's own datalist styling varies, so check it
on a tablet.

**W82 — A fight's line links to its encounter.** *Ken · ⏭ · Rule or shape · raised 2026-10-09*
Ending an encounter writes a *fought* line for each cast member in it, with
every PC in the room as its crew (Decision 193). Ken: "awesome". But the
encounter's name is baked into the text: *Fought them in New for the Crew: 2 of
4 Health Levels left.* Rename the encounter and every line says the old name,
and nothing leads back to the fight.
The wish: the line **links** to the encounter, and its text keeps only the
figures. It reads crew first, as W79's sentence does for every kind (Ken,
2026-10-09):
> **Scott, D** fought **Bob** in **New for the Crew** on 10/08/26: 2 of 4 Health Levels left

The member and the encounter are taps: the member's page, and the ended
encounter, read-only (Decision 188).
*To respect:*
- **Decision 178's links:** `{ kind:"encounter", id }`, a deleted encounter's
  name kept in the link and shown struck through, never an error.
  `Engine.linkName` reads cast members only today, so it learns the encounter
  kind.
- **A table schema bump** with its `migrateTable()` step. Lines already written
  keep their text as is; the gate converts nothing (as Decision 203 did for
  sessions).
- **Decision 193's** wrap-up stays the one writer, and its default text loses
  the *Fought them in …* prefix.
- **Build it with W79**, since both change how a line reads, on a member's
  page, in *Who knows what* (179) and on a session's page (S5a).

**W84 — Print a cast member, an encounter, a session's journal.** *Ken · 🔎 · Fix (UI) · raised 2026-10-09 in S13a's order (SQ4)*
The plan's S13 lists printing beside the GM screen: a cast member's page
(the stat block, If Pushed, their line), an encounter (its rows, Conditions
and the round, for a GM who runs the fight on paper), and a session's
journal with its award log. S13a builds the Reference tab alone; this is **S13b**.
*To respect:* `print.css` is the sheet's, with its own front page (Decision
96), so a table page's print styles must not move the character's; no new
markup in `index.html` (constraint 3); and the award log prints in the
player's words, as the page reads it (205).

**W86 — A session copied out as Markdown.** *Ken, from Deighton · 🔎 · Fix (UI) · raised 2026-10-09 in S14's order*
Deighton keeps his notes in Obsidian, as an outline of bulleted lists. A
session's journal, its interaction lines and its jotted notes (Decision 208)
could leave the app as one Markdown file to paste or save, in the Campaign
Journal's order, so what he writes at the table lands in his own notes
without retyping.
*To respect:* it reads the table and writes nothing back (constraint 7); the
file is the player's words as the page reads them; it is the session's page's
action, not a new tab. Out of S14's scope (§6).

### Custom characters

Raised 2026-09-30 while planning the custom archetype
(`plans/custom-archetype.md`), by walking a made-up character through every
step. Each is a place someone might want to write something in that the plan
leaves out on purpose. None blocks it.

**W48 — Natural Armor a custom character writes in, which the hit panel uses.** *Claude · 🔎 · touches F25*
A tough creature's "hide like stone" can be written as a trait, but the hit
resolver won't subtract it. Natural Armor's sources are `grants` on
advantages, Major Milestones and specializations (Decision 104); a written-in
trait has no `grants`. *To respect:* how Natural Armor answers a hit is the
F25 stub, still Deighton's.

**W49 — A resource pool the player names.** *Claude · 💡*
Glamour, Chi, a Blood Pool. The plan's checkboxes cover what the rules have
today (TOL, SFR). A third, **Uses another pool**, would give a tracker whose
title and max the player types. Tracker titles come from the data today, so
this needs a little code.

**W50 — Stat changes at creation.** *Claude · 💡*
Deighton sets a custom character's stat changes "in the same stroke as
powers", but the Adjustments ledger is only on the sheet, after lock. Fine at a
table where characters lock together; awkward for someone building alone.
*To respect:* a stat change at creation must not read as Stat Points spent.

**W51 — A shapeshifting form toggle for a custom character.** *Claude · 💡*
The Werewolf's form toggle has fixed options from the data. A custom
shapeshifter writes its forms as powers for now; a toggle with options the
player names would put the form on the sheet.

**W52 — Written-in Major Milestones.** *Claude · 💡*
A custom archetype has no Major Milestones of its own; the general Majors are
open to it. The Adjustments ledger covers a GM's custom reward meanwhile.

**W53 — "Magical being" as a classification.** *Ken, from Deighton · ⏭ · Content · ruled by Deighton 2026-10-10*
Fae and beings like them: a third axis of power, distinct from Supernatural.
The plan's **Other** classification, with its own text, covers it until then.
**Deighton ruled (2026-10-10, `reference/rulings-2026-10-10.md` Q31): Universal Advantages only**,
like a Supernatural. So it's one row in `classifications`, and a custom
archetype can pick it.

**W61 — A retired archetype folds its characters into Custom.** *Ken · 🔎 · raised 2026-10-01 with the Cyborg cut; Rule or shape*
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

---

### For the designers

**W56 — A tuning bench: change the game's numbers, see what moves, hand back a change request.** *Ken · ⏭ · shaped with Claude 2026-10-01*
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

## 2. Notes for whoever picks these up

- **Next free number: W106.** Everything above is open; W38 has a plan,
  `plans/two-tabs-one-character.md`, waiting on Ken's TQ1–TQ3. What was
  built is in [`log/wishes-granted.md`](log/wishes-granted.md).
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

**W54 — Main's SFR card for a written-in pool.** *Claude · 💡*
A Custom character who ticks **Uses SFR** counts its pool on Trackers, but
Main's SFR card and the vitals read `Engine.sfr()`, which takes its size from
the archetype's scaling row, and a written-in archetype has none. Main could
read the tracker panel's player-set max instead.

**W55 — Sticky notes on the Notes tab.** *Ken · 💡*
Small notes a player pins as cards at the top of Notes (a contact's number,
a debt, tonight's lead), with the free-form page still below them. A note is
added, edited and removed like a gear row, and logged. Raised 2026-10-01 while
locking a power's words (Decision 154), whose Notes field stays free.
*To respect:* the free-form page stays as it is; cards are the player's, not
derived from anything.
