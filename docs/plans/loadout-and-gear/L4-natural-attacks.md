# Work order L4: natural attacks and the unarmed strike

**Plan:** [`../loadout-and-gear.md`](../loadout-and-gear.md) §3, row L4, and its *What each order settles* bullet. **Wish:** [W107](../../WISHLIST.md). **The rulings:** [`../../reference/meeting-2026-10-23.md`](../../reference/meeting-2026-10-23.md) (two a round) and [`../../reference/meeting-2026-11-12.md`](../../reference/meeting-2026-11-12.md) (what counts, Martial Arts, mastery, one action). **The handoff:** [`L4-handoff.md`](L4-handoff.md). **The book:** `0530` *Unarmed Attacks* and *Combat Maneuvers* (`private/crb/0530_Combat_Encounters.md` ~520–545), `0460` *Blunt* ("fists, clubs", ~111). Decisions 104, 195, 200, 229, 247, 248, 287.

**Status: drafted 2026-11-15** by Claude (Opus), from the 2026-11-12 meeting. **Not yet approved.** **LQ35–LQ40 answered by Ken 2026-11-15 (in the drafting session): every default.** **LQ41's five open details were answered instead of flagged**, the same day: Scott answered four, and Ken ruled the fifth (worn bonuses), relayed by Ken in the drafting session. Deighton couldn't answer that day. The answers are in `reference/meeting-2026-11-12.md`, *Answered 2026-11-15*, and this order is revised to them: **it raises no flag.** One question they opened, LQ42, doesn't block the build (§4).

**Why it waited.** Ken held L4 on 2026-10-28 for the 2026-10-29 dev meeting. Natural weapons were finally taken on 2026-11-12, with Deighton's table report. Ken's aim there: "answers today go on the sheet for playtesting." The December playtest (Dec 7–11) is the deadline that matters. Playtesters are running Werewolves and Vampires now.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **L4 build** (Sonnet), then a fresh **L4 review** (Opus) once the PR is open. Builder and reviewer message each other directly. Anything for Ken goes to the conductor. §15 is the hand-over.

**Runs alone.** It touches `engine.js` (a new reader beside `archetypeWeapons` and `formView`, and `weaponDamage`'s formula), `shadows-data.js` (`weaponRules`, the Vampire's and the Werewolf form's `naturalWeapons`, True Warrior's Power Style), `sheet.js` (Main's Weapons table, print), `shadows.css` (one rule at most), and the docs. GM mode runs beside it: collisions only in versions, CHANGELOG's heading and decision numbers.

**Carried over:**
- **From L3 and L2b** (`L4-handoff.md` §4): the misses were readers nobody remembered, unstated edges, and a merged decision trimmed to fit the cap. **Here:** §5 greps every reader of the weapon rows on Main, §8 states every edge, and §3 replaces no merged entry (it extends four).
- **From L5's order:** a twin gets every row its twin has. **Here:** Main's Weapons table and print's weapons are twins. §9's table has a column for each.
- **From E7 (0.69.3):** Main's Weapons table at 375 overflowed its column for one long-named gun with ammo, and `phone-check`'s floor missed it. **Here:** L4 adds a heading row and a Fists row to that same table. `npm run phone-check` runs with a Vampire carrying the SG-88 (§12, step 5).

**Pre-flight against `main` at `56dee35`** (#348 merged, 0.69.3 cut). App **0.69.3**, live. Game data 0.54, character schema 0.34. The highest decision is 287, so **N** is 288 today. The highest flag is F51, so this order's flag is **F52** today. Re-check both on `origin/main` when the entry is written. The probes ran in Node through `tests/harness.mjs`'s `loadEngine`, from a scratch script that isn't committed.

```
Natural lines today    Three places, none of them a "natural attack". formView(ch).weapons (engine ~724): a Werewolf in
                       form, Claws BOD+8 and Fangs BOD+10, Skill Melee. archetypeWeapons(ch) (~4914): a Vampire's Bite
                       (Fangs of the Fallen, BOD+3) and Claws (Bestial Blessings, BOD+3 +1 a rank past the first, AP),
                       and a Draugur's Ancient Weapon (BOD+6/7, Bound). Loadout's weaponLine (~2170): carried only
The Ancient Weapon     Is in archetypeWeapons and in the data key `naturalWeapons`, but it's a bound, carried weapon
                       ("call it back to your hand"). The 10-23 meeting: "If I'm carrying a knife, that's not a natural
                       weapon." So the key's name can't decide what's natural. A line needs a mark of its own
Where they render      Main only: sheet ~472, `formWeaponRowsHtml` (~2608) + `archetypeWeaponRowsHtml` (~2628), first in
                       the Weapons table. Not Loadout (its rows are carried). **Not print:** pWeaponRows (~2930) reads
                       weaponLine alone, so a printed Werewolf has no claws today
No unarmed line        Nothing gives a fists line. 0530 says unarmed attackers "use the Martial Arts skill"; the book
                       prints no unarmed damage
weaponDamage           Reads "STAT+n" (~1908). A bare "BOD" isn't parsed: it returns { value:null, formula:"BOD" }.
                       Extending the regex to a bare word would compute the EG-3 "Blackout"'s damage "EMP" as Empathy
                       (normStat reads EMP) — the meeting's EMP collision, in code. So the fists' damage is "BOD+0"
Melee Master           `melee-master`, max rank 4: "1 additional attack per round when making melee attacks, Martial Arts
                       and thrown weapons included", a `rule` grant (text only). Mortal-only: a Vampire or Werewolf's
                       `advantages: "universal"` can't buy it
Death Touch            Text on True Warrior's Power Style (data ~2780): "Martial Arts attacks are Armor Piercing when
                       not using melee weapons." No grant. Iron Shirt, beside it, has `grants: naturalArmor` with `while`
Worn bonuses           applyWeaponBonuses (~2003) reads weaponClass(ch, index), a loadout index. No natural line takes a
                       worn `weaponBonus` today (the handoff's gap)
attackNotes            Engine.attackNotes(ch) (~1256): trait visibility lines only (Night Eyes), rendered under the
                       Weapons table by attackNotesHtml (sheet ~334) through termsHtml (Decision 287)
Probe numbers          Decision 200's test (engine.test ~5618): a Draugur at BOD 7 has Bite 10, Claws 10; at Bestial
                       Blessings rank 3, Claws 12 (BOD+5, AP). A Trueborn Werewolf in form: Claws and Fangs, Skill Melee
```

---

## 1. Goal and Done when

**Goal.** Every character has an unarmed strike, and the sheet says once how many natural attacks a round they get. A Vampire's bite and claws, a Werewolf's claws and fangs, and anyone's fists read as one group under a single count: two a round in any mix, plus one for each rank of Melee Master. A True Warrior's fists say "AP with Death Touch". Each natural line also carries a **kind** (fist, claw, bite), which L5b's powers need in order to reach "your bite". A worn bonus to melee weapons reaches natural lines too (Ken).

**Done when:**
1. A new character of any archetype shows a **Fists** line on Main: Martial Arts, BOD damage (Blunt), with the Martial Arts check total.
2. Above the natural lines, once, Main reads **"Natural attacks: 2 a round, any mix"**, and under it the rule in one line: two different natural weapons, never beside an attack with a weapon in hand. With Melee Master rank 1 the count reads 3 and names Melee Master. Never a ×2 on a line (LQ10).
3. A Vampire's Bite and Claws, and a Werewolf in form's Claws and Fangs, sit in that group. A Draugur's Ancient Weapon doesn't: it's listed with the carried weapons.
4. A natural line rolls Melee or Martial Arts, whichever is higher for this character, and names the one it used (LQ35).
5. A True Warrior's Fists line, and any natural line rolled with Martial Arts, shows **AP with Death Touch** as a conditional mark, never as a tag it always has (Decision 104's pattern). Nothing is stored.
6. The print sheet shows the same group, heading included (LQ38).
6a. A worn `weaponBonus` with `class: "melee"` reaches every natural line, as it reaches a carried melee weapon. No catalog item has one today, so the test uses a cloned item.
7. No saved file changes shape. No character schema bump. Every computed number on main is unchanged except those this order names (§11's diff).

## 2. Tier, versions, numbers

- **Tier: Rule or shape** (a numbered decision; a data shape, `kind` and `weaponRules.naturalAttacks`).
- **App:** minor, **0.70.0** (a new capability). If 0.70.0 is under `[Unreleased]` by then, its lines join it.
- **Game data:** **0.55** (every character gains a line; a Vampire's or Werewolf's Skill on a natural line can change; Decision 68).
- **Character schema:** no bump. Nothing new is stored: the count, the kind and the Death Touch mark are all computed (constraint 7).
- **Decision N** (§3), the next free number on `origin/main` when written. **No flag:** LQ41's details are answered.

## 3. The decision, drafted

Paste as is; fill *Built*. **276 words** with *Touches* (`wc -w`), so 74 are free under the 350 cap. A fix round that adds a clause should take words from *Rejected* first.

```
N. **Natural attacks are one group with one count: two a round from two different natural weapons, plus one a rank of Melee Master. Every character has Fists, and a natural line has a kind.**
     *2026-11-?? · Ken + Deighton + Scott + Claude · Touches: weaponRules.naturalAttacks, naturalAttacks, kind, fist, claw, bite, Fists, Melee Master, Death Touch, attackTag, naturalWeapons, archetypeWeapons, formView, weaponDamage, weaponBonus, Main's Weapons table, pWeaponRows*
     - **Decided:** A line is natural when its data names a `kind` (fist, claw, bite). Every character has Fists (Martial Arts, BOD+0, Blunt). The form's, the archetype's and the Fists line are one group under one count, `perRound` plus a rank of each `addedBy` Advantage, shown once above them with the rule: two different natural weapons, never beside a held weapon's attack. A natural line rolls the higher of its Skills. A worn melee `weaponBonus` reaches it. Death Touch is a conditional AP `attackTag`. Nothing is stored.
     - **Why:** Deighton (2026-11-12): one Standard Action, Martial Arts applies, a mastery adds one. Scott (2026-11-15): a Maneuver can be one, never beside a carried weapon, two different weapons (no legs). Ken: natural weapons are melee. L5b needs a bite told from a claw.
     - **Rejected:** "×2" on each line (LQ10). Natural by the key `naturalWeapons` (the Ancient Weapon is carried). Parsing a bare "BOD" (EMP is Empathy). Storing Death Touch as on (Decision 104).
     - **Replaces:** nothing. Extends 104, 195, 200, 229, 247 and 248 (a class bonus reaches a natural line).
     - **Revisit if:** Deighton revises Scott's answers, LQ42 is answered otherwise, or a Milestone adds a natural attack.
     - **Built:** app 0.70.0, game data 0.55, PR #?, log 2026-11-??.
```

## 4. Questions for Ken

The meeting answered what Scott asked, which wasn't all of what the sheet needs. Each question here has a default; an unanswered one is answered "Default".

| Id | Question | Default |
|---|---|---|
| **LQ35** | **A Werewolf's or Vampire's claws use Martial Arts?** Deighton: Martial Arts applies to natural weapons ("Yes. Absolutely"). Today every claw and bite rolls Melee. | **The higher of Melee and Martial Arts,** named on the line ("Claws · Martial Arts"). A Werewolf without Martial Arts ranks sees no change. The alternative is to keep claws on Melee and put Martial Arts on the Fists alone, which is the book's literal text, but it isn't what Deighton said. |
| **LQ36** | **Two attacks are two rolls, each its own hit, armor each time?** Never asked outright, but Scott's arithmetic ("armor would reduce it twice") and Deighton's "an armored target would just be shredded" both assume it. | **Yes,** and the heading's second line says so: "Each is its own attack. Together they're your Standard Action." Without your yes, that line is cut and only the count shows. |
| **LQ37** | **A bare fist does BOD damage?** The book prints no unarmed damage. Deighton's natural-weapon model is "your BOD in straight physical damage", and his cyberware sum adds the studs' +3 to BOD alone. | **BOD, Blunt** (0460 lists fists under Blunt). Stored as `"BOD+0"`, shown as "BOD" (§8). |
| **LQ38** | **Print the natural group?** A printed sheet has no claws today (pre-flight). | **Yes,** fixed here: print shows the same group and heading as Main. It's the same reader, and a playtester at a table holds the print. |
| **LQ39** | **Fists for everyone, always?** An Arcanist with no Martial Arts rank gets a Fists row at its untrained total. | **Always.** Anyone can punch, and one row is cheap. The alternative is Fists only with a Martial Arts rank or nothing else to roll, which hides the line from the player who most needs reminding they have it. |
| **LQ40** | **The Werewolf's damage:** today BOD+8 claw and BOD+10 fangs. Deighton is testing (A) BOD+4/+5 and (B) straight BOD, with SFR adding the bonus, at his table. | **Unchanged.** L4 doesn't touch the numbers; whichever Deighton reports is one data edit, a *Content* change of its own. If you want (A) on the sheet for December, say so, and it's two numbers in this order. |
| **LQ41** | **One flag for the five open details?** | **Answered instead (2026-11-15).** Scott: (1) a Combat Maneuver can be one of the two; (2) a natural attack never shares the round with an attack from a carried weapon; (3) the two need two different natural weapons (claw and claw, or claw and bite with something in the off hand), and legs don't count; (5) Natural Armor is immune to AP, which the code already does for every AP but a spell's (Decision 219), so Death Touch doesn't pierce it. Ken: (4) worn melee bonuses reach natural weapons. No flag. |
| **LQ42** | **Melee Master's extra attacks:** Scott's "two different natural weapons" with no legs leaves a mortal two fists. With Melee Master 1, is the third attack a fist again, or does it need a third natural weapon? *(For Scott. It doesn't block the build: the count is the same either way, and the rule line says "two different", nothing about the third.)* | **A fist again:** a mastery's extra attack is "one more swing" (Scott, 11-12) with any weapon you're already using, as it is for a carried weapon. If Scott says otherwise, it's one line of copy. |

**LQ35 mattered most:**  taking Deighton at his word moves the Skill on every natural line for anyone with Martial Arts, which is right by the ruling but is a change a player will notice.

## 5. The assumption sweep

Every reader was found by grep, not by memory: `archetypeWeapons`, `formView`, `naturalWeapons`, `weaponDamage`, `pWeaponRows`, `attackNotes`, `wpn`, `Death Touch`, `melee-master`.

| What changes | True today (where) | True after | Guards that read it · where it renders · text that points at it |
|---|---|---|---|
| `naturalWeapons` entries gain `kind` | Vampire's (data ~2947): Bite, Claws, the Ancient Weapon `choice`. Werewolf form's (~3361): Claws, Fangs | Bite `"bite"`, Claws `"claw"`; form Claws `"claw"`, Fangs `"bite"`. The Ancient Weapon has none | Decision 135's unread-key guard (`engine.test`): `kind` must be read by the engine, which `naturalAttacks` does. Decision 200's test (~5618) maps `name:damage` and doesn't change. `hasForm` (~690) reads the key, not its rows |
| `weaponRules.naturalAttacks` (new) | — | §8's shape | Decision 135 again: every key read. `docs.test`'s data checks, if any list `weaponRules`' keys by hand (grep `rofModes` in tests) |
| `naturalAttacks(ch)` (new) | — | §8. Its lines are built from `formView` and `archetypeWeapons`, never a third computation | Exported for the sheet and print. Totality (§11) |
| `archetypeWeapons(ch)` | Returns every entry, natural or not | **Unchanged** in what it returns, plus `kind` on each row (null for the Ancient Weapon) | Its two renderers: `archetypeWeaponRowsHtml` (sheet ~2628) and nothing else; the GM's seat doesn't read it (grep `archetypeWeapons` in `gm.js`: confirm none) |
| `formView(ch).weapons` | `{ name, skill, attack, damage, damageFormula, tags }` | Plus `kind`. LQ35 moves `skill` and `attack` when Martial Arts is higher | `formWeaponRowsHtml` (~2608). Decision 195's tests that pin `formView().weapons` (grep `formView(` in tests) |
| `weaponDamage` formula | "BOD+0" would read `{ value, formula:"BOD+0" }` | `formula:"BOD"` when the bonus is 0. The value is unchanged | Every caller (~728, ~1942, ~2443, ~4926). A written-in weapon whose damage is "BOD+0" now shows "BOD": the one visible change, and an improvement. **Never** a bare word: "EMP" stays text |
| Main's Weapons table | Form rows, archetype rows, carried lines, then `attackNotesHtml` (sheet ~472–486). It shows only if a line exists | A natural group first (heading row, then natural lines), then the Ancient Weapon if held, then carried. It **always** shows now (Fists) | The `natural` variable feeds `lines.length \|\| natural` twice (~473, ~493: the Combat skills heading). With Fists always present, the Combat skills heading always shows. Smoke tests that count `.wpn` rows or assert no Weapons section on a bare character (grep `wpn`, `Weapons` in `tests/smoke-*.mjs`) |
| The count's heading | — | "Natural attacks: N a round, any mix", through `termsHtml` (Decision 287: "Standard Action" may be a game term) | `voice.test` reads copy in data; the heading text lives in data, not `sheet.js` (the plan's rule) |
| Print weapons | `pWeaponRows` (~2930) reads `weaponLine` alone | The natural group's rows first, then carried. The heading prints once | Print smoke (grep `pWeaponRows` and the print test's weapon assertions). `print.css` |
| Worn `weaponBonus` reach | `applyWeaponBonuses` (~2003) reads `weaponClass(ch, index)`, a loadout index; no natural line gets a bonus. No catalog item has a `class` bonus today (the only worn one is SMARTLink Gloves', by `feature`) | `class: "melee"` reaches every natural line. `ranged` never does. `kinetic`/`energy` reach a natural line only by its damage type: Fists are Blunt (kinetic); claws and fangs have no type and get neither. `feature` never reaches one | The bonus function must take a class, not only an index: split `weaponClass`'s index lookup from the class read, and keep `weaponLine`'s call the same (L3's tests, grep `weaponBonus` in tests). Main's natural rows and print show the bonus in `bonuses` as carried lines do |
| Power Style `grants` | Iron Shirt, Unwavering Focus, Wind Dancing, Fleet of Foot (~2783) | Plus `attackTag` for Death Touch | Every reader of the tweak's `grants` has a switch on `type` (grep `g.type===` near `grants(`). Check each default branch ignores an unknown type, as P21's Field Medic sweep taught |
| Melee Master | A `rule` grant, text only | **Unchanged.** `naturalAttacks.addedBy` names it in data; its rank is read where held | Its `heldText` ("Extra attacks per round with melee attacks…: {rank}") still shows wherever it does today. Both say the same thing, and that's fine |
| What the copy says | W107, the plan's §6, `meeting-2026-10-23.md` "It stops at two" | The 11-12 page notes it's two plus a mastery rank, and STATE, the plan and W107 point at this order | `crb-catch-up.md`: 0530 *Making an Attack* needs the default **and** the mastery line (append to its 0530 row) |

## 6. Read first

- `CLAUDE.md`: constraints 5, 6, 7, 8, 9; *Flags*; *Change tiers*.
- SCHEMA §4: **104** (conditional, never summed), **195** (the form), **200** (archetype weapon lines), **229** (a style's maneuver bonus), **247** (`weaponDamage`), **248** (worn `weaponBonus`, by loadout index), **287** (`termsHtml`).
- `engine.js`: `formState`/`formView` (~690–735), `archetypeWeapons` (~4914), `weaponDamage` (~1908), `weaponClass`/`applyWeaponBonuses` (~1979–2020), `attackNotes` (~1256), `grants()` and how Iron Shirt reaches `naturalArmor` (~1518). That's the path Death Touch's grant takes.
- `sheet.js`: Main's combat block (~455–495), `formWeaponRowsHtml`, `archetypeWeaponRowsHtml` (~2606–2635), `pWeaponRows` (~2930).
- Data: Vampire `naturalWeapons` (~2947), Werewolf form (~3350), True Warrior's Power Style (~2770), `melee-master` (~1619), `weaponRules` (~4229), Martial Arts (~540).
- `reference/meeting-2026-11-12.md`, *Natural attacks*, whole.

## 7. Out of scope

- **Cyberware on the hands** (knuckle studs, punch spike, jolt fist, tri-claws). They're natural weapons by the ruling, but cyberware isn't in the data (W90). The tri-claws' +12 → +8 goes to W90's notes, not here.
- **The Werewolf's damage numbers** (LQ40).
- **Powers that change a natural line** (Rending Claws, Steel Fangs…): L5b, which reads this order's `kind`.
- **A maneuver on the Fists line.** A Maneuver can be one of the two (Scott), but a style's bonus stays on the Martial Arts check (Decision 229), and the line doesn't repeat `maneuverChecks`. W39 can put it there later.
- **Knowing what's in a character's hands.** The two-weapon and no-held-weapon rules are the heading's text. Nothing checks them.
- **A trained weapon that counts as natural** (Deighton's eskrima sticks). Floated, not ruled: raise a W id at close-out, build nothing.
- **A third natural attack from a Milestone**, or moving between targets: nothing is ruled.
- **The other 11-12 rulings** (SFR as a free action in GM mode's references, Luck on breaker checks, a boosted 10 not exploding). They're their own Fix.
- **Loadout.** Nothing natural is carried; LQ39's Fists go on Main and print.

## 8. The shapes

**Data, `weaponRules.naturalAttacks`:**

```js
"naturalAttacks": {
  /* Decision N: a weapon line is natural when it names one of `kinds`. Every character has `fists`. Read by Engine.naturalAttacks. */
  "kinds": [ { "id": "fist", "name": "Fist" }, { "id": "claw", "name": "Claw" }, { "id": "bite", "name": "Bite" } ],
  "perRound": 2,
  "addedBy": [ { "advantage": "melee-master", "perRank": 1 } ],
  "skills": ["melee", "martial-arts"],
  "fists": { "name": "Fists", "kind": "fist", "skill": "martial-arts", "damage": "BOD+0", "damageType": "Blunt" },
  "headingText": "Natural attacks: {n} a round, any mix",
  "eachText": "Each is its own attack, and together they're your Standard Action.",
  "rulesText": "Use two different natural weapons: two claws, or a claw and a bite. Not in a round you attack with a weapon in your hand. Either can be a Combat Maneuver."
}
```

`skills` is LQ35's answer and `eachText` LQ36's. `rulesText` is Scott's answers 1–3. Every string is marked for the voice pass. The Fists' line for a mortal reads "two fists" naturally; the rule's example names claws because those are where "different" bites.

**Data, elsewhere:** `"kind"` on the Vampire's Bite (`"bite"`) and Claws (`"claw"`), and the form's Claws (`"claw"`) and Fangs (`"bite"`). Death Touch's grant on the Power Style, beside Iron Shirt's:

```js
{ "type": "attackTag", "id": "death-touch", "name": "Death Touch", "tag": "AP", "skills": ["martial-arts"], "natural": true, "while": "while active" }
```

`natural: true` is the book's "when not using melee weapons": it reaches natural lines only, never a carried Martial Arts weapon (the bo staff). The Power Style tweak's grants are read the way Iron Shirt's are; the builder confirms that path in step 1, and if it doesn't hold, that's a stop.

**Engine, `naturalAttacks(ch)`** → always an object, for any character `migrate()` can produce (constraint 8):

```js
{ perRound: 2,                      // perRound + Σ held rank × perRank of each addedBy; 2 with no data
  addedBy: [ { name: "Melee Master", rank: 1, plus: 1 } ],   // only those held
  heading: "Natural attacks: 3 a round, any mix", each: "Each is its own attack, …", rules: "Use two different …",
  lines: [                          // the form's (while on), then the archetype's natural ones, then Fists
    { name, kind, source: "form"|"archetype"|"fists", from, skill, attack, damage, damageFormula, tags, extra,
      rank, off, offText, bonuses: [ { to, amount, from } ],
      conditional: [ { tag: "AP", from: "Death Touch", whenText: "while active" } ] } ] }
```

- **One computation.** Form lines come from `formView(ch).weapons`, archetype lines from `archetypeWeapons(ch)` filtered to a known `kind`. Fists are built with the same `weaponDamage` and `skillLine` calls. A line's `skill`/`attack`, under LQ35, is the higher `skillLine(...).checkBonus` among `skills`, the line's own Skill winning ties; `formView` and `archetypeWeapons` themselves return the same chosen Skill, so Main's rows and `naturalAttacks` can't disagree.
- **An `off` line** (a Code-broken Draugur's line, if one is ever natural) stays in `lines` with `off: true`. It still counts toward nothing: the count is a number of attacks, not of lines.
- **A Werewolf out of form** has no form lines. Fists still show.
- **A written-in archetype** (`writeInSpec`) has no archetype lines. Fists still show.
- **Worn bonuses:** each natural line runs through the same bonus function as a carried line, with the class `{ melee: true, damageClass }` read from its Skill and its damage type (Fists: Blunt → kinetic; claws and fangs: none). Damage bonuses add to a numeric `damage`; `acc` bonuses list but natural lines show no ACC column, so they render in `bonuses` only.
- **Bad data:** an unknown `kind` reads as not natural. A missing `naturalAttacks` gives `{ perRound: 2, lines: [], heading: "", each: "", rules: "" }` and Main shows no heading. An `addedBy` naming no Advantage adds nothing. `perRound` that isn't a whole number ≥ 1 reads as 2.
- **`weaponDamage`:** when the parsed bonus is 0, `formula` is the stat alone ("BOD"). Nothing else in its parsing changes. **A bare word never computes** (EMP).
- **Not stored:** nothing. `migrate()` is untouched.

**No flag.** LQ41's answers are built. If Deighton later revises one, it's copy or one reach rule.

## 9. The UI

**Main's Weapons table.** The natural group leads: a heading row spanning the table, then the natural lines (form, archetype, Fists), then the Ancient Weapon if held, then carried lines. Under the heading, in smaller type, `each` and `rules`. A natural line's sub-line is today's (form name or source, rank, Skill), plus its kind only when the name doesn't say it (a "Claws" line needn't say "claw"). Conditional marks render as Decision 104's do elsewhere: "AP with Death Touch", in the conditional style, never a tag chip. The count is never a column.

**Print.** The same group, heading and order, in `pWeaponRows`' shape, with `rules` once under the heading.

**Where things land** (twins in columns):

| Situation | Main | Print |
|---|---|---|
| New Arcanist, no weapons | Weapons section appears: heading "2 a round", Fists (Martial Arts, untrained total, BOD) | Same rows |
| Professional, Melee Master 2 | Heading "4 a round", "Melee Master 2" named | Same |
| True Warrior | Fists shows "AP with Death Touch" | Same mark, in print's conditional style |
| Vampire (Draugur, Blunt picked) | Heading, Bite, Claws, Fists; then Blunt; then carried | Same |
| Draugur, Code Broken | The Ancient Weapon's row is off as today, outside the group | Same |
| Werewolf, Human form | Heading, Fists | Same |
| Werewolf, Werewolf form | Heading, Claws, Fangs, Fists | Same |
| Phone width (375) | No sideways scroll; the heading wraps, never widens the table | — |

**Copy, drafted for the voice pass** (the builder pastes each as it renders into the PR):
- Heading: "Natural attacks: 2 a round, any mix"
- Each: "Each is its own attack, and together they're your Standard Action."
- Rules: "Use two different natural weapons: two claws, or a claw and a bite. Not in a round you attack with a weapon in your hand. Either can be a Combat Maneuver."
- Mark: "AP with Death Touch"
- Melee Master in the heading: "Natural attacks: 3 a round, any mix (Melee Master 1)"

## 10. Worked examples, as named tests

Write these first, in `tests/engine.test.mjs` unless noted; show each failing on `main`.

1. `"Decision N: every character has Fists — Martial Arts, BOD damage, Blunt — and two natural attacks a round"`: an Arcanist at BOD 5 → one line, `{ name:"Fists", kind:"fist", damage:5, damageFormula:"BOD" }`, `perRound:2`.
2. `"Decision N: Melee Master adds one natural attack a rank, not a pair"`: a Professional with `melee-master` rank 2 → `perRound:4`, `addedBy:[{name:"Melee Master",rank:2,plus:2}]`.
3. `"Decision N: a Vampire's bite and claws are natural; the Ancient Weapon is not"`: Draugur, BOD 7, Blunt picked → natural lines `["Bite","Claws","Fists"]`; `archetypeWeapons` still has Blunt, with `kind:null`.
4. `"Decision N: a Werewolf's claws and fangs join the group only in form"`: Trueborn, Human → `["Fists"]`; Werewolf → `["Claws","Fangs","Fists"]`, kinds `claw, bite, fist`.
5. `"Decision N: a natural line rolls the higher of Melee and Martial Arts and names it"` (LQ35): a Werewolf in form, Martial Arts above Melee → Claws' `skill:"Martial Arts"` and its total; equal ranks → Melee.
6. `"Decision N: Death Touch marks a Martial Arts natural line AP, conditional, never on a carried weapon"`: True Warrior → Fists `conditional:[{tag:"AP",from:"Death Touch"}]`, `tags` without AP; a carried bo staff's line has no such mark.
6a. `"Decision N: a worn melee bonus reaches every natural line, a ranged one none"`: clone `D`, give a worn armor piece `{ type:"weaponBonus", to:"damage", amount:2, class:"melee" }`; Fists, a Vampire's Bite and a carried knife each +2, `bonuses` naming the piece; swap to `class:"ranged"` and none moves; `class:"kinetic"` moves Fists (Blunt) and not the Bite (untyped).
7. `"Decision N: weaponDamage shows BOD+0 as BOD and never computes a bare word"`: `"BOD+0"` → formula `"BOD"`; `"EMP"` → value null, formula `"EMP"`.
8. In `tests/smoke-sheet*.mjs` (whichever holds Main): `"Main: the natural group leads the Weapons table, under one heading"` — a Vampire carrying a Combat Knife: one heading row, the natural rows before the knife, no "×2" anywhere.
9. In the print smoke: `"Print: a Werewolf in form prints its claws and fangs"` (LQ38).

## 11. Tests beyond the examples

- **Totality:** `naturalAttacks` over every archetype × specialization × form state, plus `migrate({})` and the hostile corpus (`tests/hostile.test.mjs`): never throws, always the shape.
- **Hostile data:** `kind: 7`, `kind: "tail"`, `perRound: -1`, `addedBy: [{}]`, `fists: null` each read as §8 says. Put them in the engine test with a cloned `D`.
- **L3's bonus tests unchanged:** the refactor of `weaponClass` keeps every carried line's `bonuses` identical (the fixture covers it).
- **Nothing else moves, by diff** (`WORK-ORDERS.md`, *How exact to be*): before touching the engine, script `weaponLine`, `formView`, `archetypeWeapons`, `naturalArmor` and `skillLine` over every archetype, specialization and trait on `main` into a fixture. Afterwards the diff may show only: `kind` added, LQ35's Skill moves, and "BOD+0" formulas. Paste the diff's summary in the PR.
- **Voice:** `voice.test` passes on the new strings (no flag id, no "TBD").
- **Mutation-test:** (a) drop the `kind` filter, and test 3 must fail (the Ancient Weapon joins); (b) sum `addedBy` as a pair (×2), and test 2 must fail; (c) let `weaponDamage` parse a bare word, and test 7 must fail; (d) put Death Touch's AP into `tags`, and test 6 must fail; (e) skip the bonus function for natural lines, and test 6a must fail. Check each for a second path that already covers it.
- **Phone:** `npm run phone-check` with a Vampire carrying the SG-88 at 375.

## 12. Steps

1. Baseline (`npm run test:fast` on a fresh branch). Write the fixture (§11). Confirm the Power Style tweak's grants reach `grants()` the way Iron Shirt does; if not, stop.
2. Data: `weaponRules.naturalAttacks`, the four `kind`s, Death Touch's grant. `npm run verify`: Decision 135's guard should now fail on unread keys, which is expected until step 3.
3. Engine: `weaponDamage`'s formula, `naturalAttacks`, the Skill choice in `formView` and `archetypeWeapons`, the exports. Tests 1–7 green. `npm run verify`.
4. Sheet: Main's group and heading, the conditional mark. Tests 8 green. Run it in the dev preview (`shadows-dev-preview`): an Arcanist, a Draugur, a Werewolf both forms, a True Warrior. Screenshot each into the PR.
5. Print: the group (test 9). `npm run phone-check`. `npm run verify`.
6. The diff against the fixture. Mutation tests. Docs and close-out (§14).

## 13. Stop and ask

**Stop** if:
- Death Touch's grant can't reach `naturalAttacks` through the path Iron Shirt uses, without a new reader of the tweak.
- Splitting `weaponClass` would change any carried line's `bonuses` or ACC.
- The fixture diff shows any number moving that §11 doesn't name.
- A GM-mode reader (`gm.js`, `engine.js` ~9300+) draws a PC's natural lines. The pre-flight found none, and if one exists, it's a twin.
- LQ35's Skill choice breaks a test that pins a Werewolf's attack total in a way that reads as a rule, not a number (Decision 195's tests).

**Not stops** (expected):
- Version literals that the bump moves. Decision 135's guard failing between steps 2 and 3.
- A smoke test that asserts a bare character has no Weapons section: that's this order's change (LQ39). Update it and name it in the PR.
- The Combat skills heading now always shows (§5).

## 14. Close-out

`close-the-session`, Rule-or-shape tier:
- **Decision N** pasted, with its INDEX §3 line under Weapons and gear.
- **No flag.** The plan's §6 loses L4's line. LQ42's answer, if Scott gives it, goes in the reference page.
- **CHANGELOG** under `[Unreleased] — app 0.70.0`, player voice, for the voice pass:
  - "Everyone can throw a punch now: Main lists your Fists, rolled with Martial Arts, for your BOD in damage."
  - "Claws, fangs and fists sit together under one line that says how many natural attacks you get a round. That's two, plus one for each rank of Melee Master."
  - "A True Warrior's bare-handed strikes show when Death Touch makes them armor-piercing."
  - "Gear that adds to melee weapons adds to your claws, fangs and fists too."
  - "Your claws and fangs are on the printed sheet now."
  - (LQ35) "Claws and fangs roll Martial Arts when it's your better Skill."
- `npm run changelog`; app 0.70.0; `gamedataVersion` 0.55.
- **The log:** an entry. **STATE §3:** rewritten (L4 built; L5b next in this plan). **The plan:** L4's row to built. **`shipped.md`:** a row. **W107:** closed. **A new W id** for "a trained weapon counts as natural" (§7). **W90's notes:** natural weapons, the tri-claws ladder (+3/+6/+8), stacking adds to BOD once. **`crb-catch-up.md`:** 0530's *Making an Attack* gets the default and the mastery line.
- **PR title:** `feat(sheet): natural attacks, one count and a Fists line (W107, Decision N)`.
- **PR body:** the template's sections, plus every new string as rendered, the screenshots, the fixture diff's summary, and **Where the order didn't fit**.

**Review checklist** (for the reviewer, beyond green tests):
- The count is shown once and never on a line; no "×2" anywhere, Main or print.
- The Ancient Weapon is outside the group in every state (Kept, Broken, none picked).
- "EMP" still renders as text on the EG-3's line.
- Main and print agree row for row (§9's table).
- Every heading, `each` and `rules` string is in data, not `sheet.js`.
- The fixture diff names only §11's moves.
- A carried weapon's worn bonuses are what L3 built: no line moved by the `weaponClass` split.
- No saved field was added; `migrate()` is untouched.
- Phone width: no element in `main` past the viewport's right edge.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md` *The prompts*, with this order's path. This order's traps:
- **The Ancient Weapon lives in `naturalWeapons`.** The key's name isn't the rule; `kind` is.
- **"EMP" is a stat.** A friendlier `weaponDamage` regex breaks a grenade. Keep "+n" required and only reword the formula.
- **Two renderers, one reader.** Main's rows and `naturalAttacks` must come from the same lines. If `formWeaponRowsHtml` keeps its own Skill, LQ35 shows two different totals.
- **The Combat skills heading** is gated on `natural`, so it changes for every character.
- **`weaponClass` takes an index.** A natural line has none. Split the class read from the row lookup; don't fake an index.
- **`private/`**: run `git submodule update --init private` in the worktree before tests.
