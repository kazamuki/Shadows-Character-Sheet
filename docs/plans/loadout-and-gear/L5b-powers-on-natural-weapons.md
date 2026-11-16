# Work order L5b: powers that change natural weapons and melee

**Plan:** [`../loadout-and-gear.md`](../loadout-and-gear.md) §3, row L5b, and its *What each order settles* bullet. **Wish:** [W136](../../WISHLIST.md), its powers half (L5 built the Majors half, Decision 263). **Builds on:** L4's natural group and `kind` (Decision 290), L3's weapon class and `bonuses` (Decision 248), H1's running powers (Decision 266). **The book:** `0413` (Upyr, Strigoi and Draugur powers, ~197–391) and `0414` (Wildblood and Forge Fang powers, ~290–323). Decisions 104, 237, 248, 266, 290.

**Status: drafted 2026-11-15** by Claude (Opus), the L4 reviewer, from `main` with L4 merged. Not approved. LQ43–LQ48 below, each with a default; an unanswered one is answered "Default". Two book questions go to Deighton (§4, *For Deighton*); neither blocks the build.

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md). The conductor starts **L5b build** (Sonnet), then a fresh **L5b review** (Opus) once the PR is open. Builder and reviewer message each other directly. Anything for Ken goes to the conductor. §15 is the hand-over.

**Runs alone.** It touches `engine.js` (one new reader beside `naturalAttacks`, and the lines it feeds: `naturalAttacks`, `archetypeWeapons`, `weaponLine`), `shadows-data.js` (eight powers' `grants`, one `weaponRules` sibling), `sheet.js` (six line renderers, §5) and the docs. GM mode can run beside it: collisions only in versions, CHANGELOG's heading and decision numbers. **Say N everywhere and expect it to move** (*Carried over*).

**Carried over from L4** (PR #350, review and two rebases):
- **The order's misses.** (1) *Print height:* L4 said "print matches Main" and never sized it, so every printout gained a sheet, and the blank-row budget came in the fix round. **Here:** marks add text to print rows, so §11 adds `printFloors` cases at `main`'s counts *before* the build, and §9 says where a mark prints. (2) *A conditional that hides:* Death Touch vanished when Melee beat Martial Arts, and the line chose the Skill that hid the option. **Here:** a mark never disappears because of a choice the line made for the player; a power the character holds always shows its mark (§8). (3) *Phone height:* L4's heading block was five lines at 375. **Here:** marks are one line each, in the conditional style, and §9 caps them.
- **The build's.** The budget went out before the go-ahead reached the builder, and messages crossed twice. **Here:** the builder starts a new piece of work only on a message that names it.
- **Process.** Two parallel PRs (#349, #351) each took the decision number L4 expected, so L4 rebased twice. **N** is written everywhere in this order, and the build takes the lowest free number on `origin/main` when it writes the entry.
- **What worked.** Ken took every recommendation and decided quickly, so give each question a recommended default and say why.

**Pre-flight against `main` at `4af7fa4`** (PR #350 merged). App **0.70.0** (unreleased: K1 and L4 under one heading), game data **0.55**, character schema **0.34**. The highest decision is **290**, so N is **291** today; the highest flag is **F51**, so a flag here would be **F52**. Re-check both on `origin/main` when the entry is written. The probes ran in Node through `tests/harness.mjs`'s `loadEngine`, from a scratch script that isn't committed.

```
The eight, data = book  Every `effect` and `perRank` in shadows-data.js matches 0413/0414 word for word. None has a grant that
                        reaches a weapon line. Two have `run` (H1, Decision 266): Blood of Valhalla (each round) and Let It Loose
                        (each round, runsIn Werewolf form). The other six cost Rank once and nothing stores them
Who holds them          Held archetype powers are grant sources (grantSources ~263, archetypePowers ~4676), so traitGrants(ch,
                        type) already reaches a new grant type on any of them, with its rank
Probes, today           Strigoi with Bone Spines, Monstrous Maw, Rending Claws, Bestial Blessings and a Combat Knife: Bite 9, Claws
                        9 AP, Fists 6, knife 9, no conditional anywhere. Upyr with Rend and Tear: same lines, nothing. Draugur with
                        Blood of Valhalla, Blunt and a knife, stopped and then running (startPower ok, 3 SFR): Blunt 13, knife 9,
                        Bite and Claws 9, unchanged either way. Wildblood in form, Let It Loose running: Claws 18, Fangs 20, Fists
                        10, no type change. Forge Fang in form with Steel Fangs: Fangs 20, nothing
Where a mark can sit    naturalAttacks lines have `conditional` (L4: { tag, from, applies, text }). weaponLine has none: its
                        catalog line's conditional is undefined (L4's Death Touch test asserts that, engine.test ~13606).
                        archetypeWeapons rows (the Ancient Weapon) have none
"Melee"                 weaponClass (~1999) reads a line's class from its Skill's `melee` (Decision 248: a grenade is melee) and
                        damage type's `resClass`; applyBonusesFor (~2032) takes a class, not an index (L4's split)
"AP 2", "AP 3"          Rend and Tear and Monstrous Maw print AP with a number. 0460 defines AP with none ("bypasses the target's
                        RES entirely"). The Threat Codex uses "AP 2" once. No rule says what the number does
Renderers of a line     Main: naturalGroupHtml (sheet ~2713), archetypeWeaponRowsHtml (~2735), the carried rows in renderShMain
                        (~568). Loadout: weaponRowsHtml's catalog rows and folded written-in rows (~2382). Print: pNaturalRows
                        (~3038), pOwnWeaponRows (~3057), pCarriedRows (~3063). Main's carried rows show no `bonuses` today
                        (Loadout's do): a worn bonus moves Main's number silently
GM mode                 No reader in gm.js draws a PC's weapon lines; the seat's read-only sheet uses the same renderers
```

---

## 1. Goal and Done when

**Goal.** A Vampire or Werewolf who holds one of the eight powers sees, on the weapon lines it changes, what it does: on the right lines and no others, at the power's rank, as a conditional mark (LQ5) or, for a power the sheet knows is running, applied (LQ43). The line reaches by L4's `kind` (claw, bite, fist) or, for "melee damage", by L3's melee class.

**Done when:**
1. A Strigoi holding Bone Spines at rank 2 sees "+4 damage …" under **every melee line**: Bite, Claws, Fists and a carried Combat Knife (LQ44). Nothing under a pistol.
2. Monstrous Maw marks the **Bite** alone; Rending Claws and Serrated Claws the **Claws** alone; Steel Fangs the **Fangs** (a bite) alone; Rend and Tear **Claws and Bite**, never Fists. Each at its rank (§8's table).
3. Blood of Valhalla, **stopped**: "+2 damage while Blood of Valhalla runs" under every melee line, the Ancient Weapon included. **Running:** each of those lines' damage is 2 higher, with "+2 from Blood of Valhalla" under it, and no mark (LQ43).
4. Let It Loose, **running**, in Werewolf form: Claws and Fangs read **Spirit**, are rank − 1 higher (LQ45), and say they strike Unbodied creatures; stopped, the same as a mark. Fists don't change (LQ48).
5. Main, Loadout and print agree line for line (§9's table). No printout gains a sheet over `main` (§11).
6. Nothing is stored. No character schema bump. Every computed number on `main` is unchanged except a running power's (§11's diff).

## 2. Tier, versions, numbers

- **Tier: Rule or shape** (a data shape, the `attackMod` grant; a numbered decision; it reopens LQ5 for running powers).
- **App:** minor (a new capability). If a minor is already under `[Unreleased]`, its lines join it with no bump. The build reads CHANGELOG's heading.
- **Game data:** a bump (a held power's lines change; Decision 68).
- **Character schema:** no bump. Nothing new is stored: marks, reach and the running state's effect are computed (constraint 7). Running is H1's stored input.
- **Decision N**, the next free number on `origin/main` when written. **Flag:** none, unless Deighton hasn't answered Bone Spines (§4, *For Deighton*) by the build, then **F N** (the next free flag).

## 3. The decision, drafted

Paste as is; fill *Built*. **About 300 words** with *Touches* (`wc -w` it); a fix round that adds a clause takes words from *Rejected* first.

```
N. **A power that changes natural weapons or melee says so on the lines it reaches: by kind (claw, bite, fist) or by the melee class, at its rank, as a conditional mark; one that runs is applied while it runs.**
     *2026-11-?? · Ken + Claude · Touches: attackMod, grants on archetype powers, kinds, class, damage, rounds, whenText, weaponRules.attackMods, naturalAttacks, archetypeWeapons, weaponLine, conditional, bonuses, damageType, runningPowers, Rend and Tear, Bone Spines, Monstrous Maw, Rending Claws, Blood of Valhalla, Let It Loose, Steel Fangs, Serrated Claws, Main's Weapons table, Loadout's weapon rows, pNaturalRows, pOwnWeaponRows, pCarriedRows, LQ5, W136*
     - **Decided:** A power's `attackMod` grant reaches the lines whose `kind` it names, or with `class: "melee"` every melee line (Decision 248's class: natural lines, the Ancient Weapon, carried melee weapons). Its damage and rounds are `plus` + `perRank` × (rank − 1). On a power that isn't running it's a conditional mark, never summed (Decision 104). On a running power (Decision 266) its damage is added and listed in `bonuses`, and its `damageType` replaces the line's. Main, Loadout and print show the same marks. Nothing is stored.
     - **Why:** W136; LQ5 (marks); L4 gave every natural line a `kind` so a power can name "your bite"; H1 made running a stored input, so a running power's number can be the line's.
     - **Rejected:** a mark on a running power (the sheet knows it runs, LQ43). Reach by name ("Claws"): a Forge Fang's Fangs are a bite. A per-power reader in code (Decision 135). Computing "AP 2" (0460's AP has no number).
     - **Replaces:** Decision 104 in part (a running power's weapon bonus is summed); LQ5 for running powers. Extends 237, 248, 266, 290.
     - **Revisit if:** the book gives AP a number; W110's "extended until retracted" powers (Steel Fangs, Serrated Claws, Bone Spines) get a stored state; Deighton rules Bone Spines' grappling.
     - **Built:** app ?, game data ?, no schema bump, PR #?, log 2026-11-?? (L5b).
```

## 4. Questions for Ken

LQ5 settled marks for powers when nothing stored that a power runs. H1 (Decision 266) stores it now, which is LQ43. The rest are book readings: Ken writes the CRB, so his reading is the default unless it's a design question, which goes to Deighton.

| Id | Question | Default |
|---|---|---|
| **LQ43** | **A running power on a line:** Blood of Valhalla and Let It Loose have `run`, so the sheet knows when they run. Apply them while they run, or keep them marks? | **Applied while running,** listed as "+2 from Blood of Valhalla" under the damage, like a worn bonus; **a mark while stopped**, so the player sees what starting it does. LQ5's "never summed" was because nothing stored running; now it is stored. The alternative keeps every power a mark, and the number on a Draugur's Blunt is 2 low all fight. |
| **LQ44** | **"Melee damage"** (Bone Spines, Blood of Valhalla): every melee line, carried weapons included, or natural lines only? | **Every melee line,** by Decision 248's class: Bite, Claws, Fists, the Ancient Weapon and a carried knife. The book says "melee damage", and Ken's L4 ruling is that natural weapons are melee, not that melee is natural only. **Note:** 248 makes a grenade melee (its Skill), so a thrown grenade gets Bone Spines' +3 too. Say if a grenade should be left out, and it's one line of reach. |
| **LQ45** | **Let It Loose's damage:** its rank row says "+1 damage with natural weapons (max 3)", and its effect names no base damage. Rank 1: +0 or +1? | **+0 at rank 1, +1 a rank after** (rank − 1), the way every other power row reads (Bestial Blessings' "+1 damage" is a rank past the first, in code since Decision 200). Rank 1 already buys Spirit damage and Unbodied. If you meant +1 at rank 1, it's `plus: 1` in data, and a CRB line to say so. |
| **LQ46** | **"AP 2" and "AP 3"** (Rend and Tear, Monstrous Maw): the book's AP has no number. | **Shown as the book prints it,** "AP 2", in the mark, and no number computed (a mark computes nothing anyway). A line in `plans/crb-catch-up.md` (0413) asks what the number means, for Ken's CRB pass. |
| **LQ47** | **Extended powers:** Steel Fangs and Serrated Claws last "until retracted or the scene ends", Bone Spines "for the encounter". The sheet could store "extended" like a running power. | **Not here:** they stay marks. Storing it is W110's ground (a start and stop for a power with no `run`) and touches Turn Reset. Raise a W id at close-out if you want it. |
| **LQ48** | **Let It Loose and Fists:** "the spirit pours into your claws and fangs. Your natural weapons deal Spirit damage". Fists too? | **Claws and fangs only** (`kinds: ["claw", "bite"]`): the first sentence names them, and in Werewolf form the claws are the hands. Say if fists count, and it's `"fist"` added to the list. |

**For Deighton** (through the conductor; neither blocks the build):
- **Bone Spines:** "+3 melee damage, +5 while grappling", with "+1 damage (max 5)" a rank. Is +5 instead of +3 or on top of it, and does a rank add to the +5? **Stub:** the mark computes the +3 with its rank and keeps the grappling clause as the book prints it ("+5 while grappling"). If he hasn't answered by the build, it's a flag (F N, `flagNote`, a `playerNote` saying the GM rules it).
- **Rend and Tear's AP 2 and Bleeding**, **Monstrous Maw's AP 3:** what an AP number does (LQ46). Ken's CRB call first; Deighton's if Ken wants a ruling.

## 5. The assumption sweep

Every reader was found by grep, not memory: `attackMod` (new), `traitGrants`, `naturalAttacks`, `archetypeWeapons`, `weaponLine`, `weaponDefLine`, `applyBonusesFor`, `weaponClass`, `conditional`, `bonuses`, `runningPowers`, `g.type===`, `damageType`, and each power's name in `src/`, `tests/` and `docs/`.

| What changes | True today (where) | True after | Guards that read it · where it renders · text that points at it |
|---|---|---|---|
| Eight powers gain `grants` | No weapon grant on any (data ~3076–3411). Blood of Valhalla has `roundHeal` and `blocks`; Let It Loose none | Each gets one `attackMod` (§8); Bone Spines may get two (grappling, if Deighton answers) | Decision 135's unread-key guard: every key read. **Every reader that switches on `g.type`** must ignore `attackMod`: `grants()` ~173, `traitText` ~481, `traitRows` ~1133, `traitEffects` ~1192, `naturalArmor`'s `add` ~1552–1613, `hitRows` ~4437, the `roundHeal` find ~3042. Grep `g.type===` and `.type===` near each `grants` loop; check every default branch (P21's Field Medic lesson). The power cards (`powerHtml`, shared ~1031; `powerCardHtml`, sheet ~2183) print `effect`, not grants: confirm, no change |
| `weaponRules.attackMods` (new) | — | §8's templates | Decision 135. `voice.test` reads data copy |
| `attackMods(ch, line)` (new reader) | — | §8. The one place a power reaches a line | Totality (§11). Exported for the tests only if needed; the lines carry the result |
| `naturalAttacks(ch).lines[].conditional` | Death Touch only: `{ tag, from, applies, text }` | Plus each reaching power's mark: `{ from, applies:true, running:false, text }`. A running power's adds `running:true` and moves `damage`, `bonuses`, `damageType` | L4's tests pin Death Touch's entry exactly (`same(f.conditional, [{ tag, from, applies, text }])`, engine.test ~13595): a True Warrior holds no power, so unchanged. Renders in `naturalGroupHtml` (`.nat-cond`) and `pNaturalRows` (`features`) |
| `archetypeWeapons(ch)` rows | No `conditional` (the Ancient Weapon) | `conditional` on every row: `[]` unless a melee power reaches it. Natural rows get theirs through `naturalAttacks` (one computation: don't add twice) | `archetypeWeaponRowsHtml` (Main), `pOwnWeaponRows` (print). L4's Ancient Weapon print test reads names and off text only |
| `weaponLine(ch, i)` | No `conditional` key | `conditional: []` on every line, a melee power's mark on a melee one; a running power's damage in `damage` and `bonuses` | **L4's test asserts `line.conditional === undefined`** for a carried bo staff (engine.test ~13606): an expected break, it becomes `deepEqual(line.conditional, [])` (a True Warrior holds no power). Renderers: Main carried rows (~568), Loadout catalog and folded rows (~2382), `pCarriedRows`. Written-in weapons have a class too (Decision 247), so they're reached |
| Main's carried rows | Show no `bonuses` (Loadout's do) | Show `bonusLinesHtml` for damage and ACC, and the marks | Twin of Loadout's. Without it, Blood of Valhalla moves Main's number with nothing saying why |
| Running state | `runningPowers` (~4443); a Werewolf's run only in form | Read by `attackMods` | Leaving the form stops Let It Loose (Decision 266), so the form's lines vanish and the Fists stay unchanged |
| Print rows | Natural rows and own weapon rows are `p-tight`; marks print in `features` (Death Touch) | Every mark prints in `features`, one per line | `printFloors` in `phone-check` (L4): page counts at `main`'s, with new cases (§11) |
| What the copy says | W136's line ("Nothing stores that a power is running (W110), so the power rows are conditional marks or they wait"); the plan's L5b row and *What each order settles* | W136 closes; the plan's row is built | `crb-catch-up.md` (0413, LQ46). WISHLIST W136 to `log/wishes-granted.md` |

## 6. Read first

- `CLAUDE.md`: constraints 5, 7, 8, 9; *Flags*; *Change tiers*.
- SCHEMA §4: **104** (conditional, never summed), **237** (a power's mark on a Skill's row: the `whenText` pattern), **248** (class, `bonuses`), **266** (running), **290** (natural lines, `kind`, `conditional`).
- `engine.js`: `traitGrants` (~283), `grantSources` (~248), `weaponClass`/`applyBonusesFor` (~1999–2045), `weaponLine` (~2192), `runningPowers` (~4443), `archetypeWeapons` (~4936), `naturalAttacks` (~4964). Battleborn Instinct's `checkMod` with `whenText` (data ~3093) is the nearest precedent: a power, a mark, a "while … runs".
- `sheet.js`: the six renderers in the sweep's table, and `bonusLinesHtml` (~2171).
- `0413` and `0414`, the eight powers' rows, and `0460`'s AP.

## 7. Out of scope

- **Storing that an extended power is out** (Steel Fangs, Serrated Claws, Bone Spines): LQ47.
- **Bleeding on the target, refunded SFR on a kill, Maimed on an unarmored target:** text in the mark. The sheet doesn't resolve an attack.
- **The hit resolver.** A Spirit claw isn't fed to `resolveHit`: the GM types the hit's damage type. Let It Loose changes the line, not the hit.
- **Battleborn Instinct, Nightmare Echo** and other powers on a check or a bite's effect: they're Skill-row marks (Decision 237) or text already.
- **Hand cyberware, a trained weapon as natural (W160), the Werewolf's damage numbers (LQ40):** the plan's later rows.
- **Merging Death Touch's `attackTag` into `attackMod`.** Two grant types feed one `conditional` list. Folding them is a later cleanup with its own decision.

## 8. The shapes

**Data, `weaponRules.attackMods`** (beside `naturalAttacks`):

```js
"attackMods": {
  /* Decision N: how a power's attackMod reads on a weapon line. Read by Engine.attackMods. Every string is for the voice pass. */
  "damageText": "+{n} damage",
  "roundText": "{n} round", "roundsText": "{n} rounds",
  "markText": "{effects} {whenText}",
  "runningText": "{effects} from {from}"
}
```

**Data, the grant** (one per power; on the power, beside its other `grants`):

```js
{ "type": "attackMod",
  "kinds": ["claw", "bite"],        // or "class": "melee"; exactly one of the two
  "damage": { "plus": 3, "perRank": 1 },     // optional; plus + perRank × (rank − 1)
  "rounds": { "plus": 2, "perRank": 1 },     // optional; fills {rounds} in `text` with its unit: "1 round", "3 rounds"
  "damageType": "Spirit",                     // optional; a damageTypes name; applied only while running
  "text": "AP 2, Bleeding for {rounds}", // optional; the book's words, filled
  "whenText": "while Rend and Tear is active" }
```

**The eight, drafted** (rank r; marks shown stopped; every string for the voice pass):

| Power | Reach | `damage` | `rounds` | `text` | `whenText` | Mark at rank 2 |
|---|---|---|---|---|---|---|
| Rend and Tear (Upyr) | claw, bite | — | 2 + (r−1) | AP 2, Bleeding for {rounds} | while Rend and Tear is active | AP 2, Bleeding for 3 rounds while Rend and Tear is active |
| Bone Spines (Strigoi) | melee | 3 + (r−1) | — | +5 while grappling | while your Bone Spines are out | +4 damage, +5 while grappling while your Bone Spines are out |
| Monstrous Maw (Strigoi) | bite | 10 | — | AP 3, and a hit on an unarmored target severs a limb (Maimed) | for the round Monstrous Maw is open | +10 damage, AP 3, … for the round Monstrous Maw is open |
| Rending Claws (Strigoi) | claw | 2 + 2(r−1) | 1 + (r−1) | Bleeding for {rounds} | this round, with Bestial Blessings out | +4 damage, Bleeding for 2 rounds this round, with Bestial Blessings out |
| Blood of Valhalla (Draugur, `run`) | melee | 2 | — | — | while Blood of Valhalla runs | +2 damage while Blood of Valhalla runs · running: +2 from Blood of Valhalla |
| Let It Loose (Wildblood, `run`) | claw, bite (LQ48) | 0 + (r−1) (LQ45) | — | Spirit damage, and it strikes Unbodied creatures | while Let It Loose runs | +1 damage, Spirit damage, … while Let It Loose runs · running: type Spirit, +1 from Let It Loose, "strikes Unbodied creatures" |
| Steel Fangs (Forge Fang) | bite | 2 + (r−1) | — | AP | while your Steel Fangs are out | +3 damage, AP while your Steel Fangs are out |
| Serrated Claws (Forge Fang) | claw | — | r | Bleeding for {rounds} | while your Serrated Claws are out | Bleeding for 2 rounds while your Serrated Claws are out |

A "damage" of 0 adds no "+0 damage" part. A mark with no `text` and no damage is dropped.

**Engine, `attackMods(ch, line)`** → `{ marks: [...], applied: [...] }`, for a line `{ kind, melee }`:

- **One reader.** It reads `traitGrants(ch, "attackMod")`: each held power's grants, with its rank. `naturalAttacks`, `archetypeWeapons` (the non-natural rows only; the natural ones go through `naturalAttacks`) and `weaponLine` call it. Nothing else reads `attackMod`.
- **Reach.** `kinds` reaches a line whose `kind` is in it. `class: "melee"` reaches a line whose class is melee: a natural line always (Ken, L4), a carried or archetype line by `weaponClass`'s `melee===true`. A grant with both or neither reaches nothing.
- **Running.** If the grant's power is in `runningPowers(ch)`, it's applied: `damage` adds to a numeric `damage` and pushes `{ to:"damage", amount, from }` onto `bonuses` (L3's shape), `damageType` (a `damageTypes` name) replaces the line's, and the line's `conditional` gets `{ from, applies:true, running:true, text }` from `runningText`, with the non-numeric effects only (the number is in `bonuses`). Otherwise it's a mark: `{ from, applies:true, running:false, text }` from `markText`.
- **Never hidden.** A held power's mark shows on every line it reaches, whatever Skill that line rolls (L4's Death Touch lesson). A power not held, or not in its form's `runsIn` for the running test, follows the existing readers: held or not by `archetypePowers`, running or not by `runningPowers`.
- **Off lines.** An `off` line (a Code-broken Ancient Weapon) gets no marks and nothing applied, as L4 does for its conditional.
- **Bad data:** a `kinds` that isn't an array of known kinds reaches nothing; a `damage` or `rounds` whose `plus`/`perRank` aren't finite reads as 0 for that part; a `damageType` naming no `damageTypes` entry is ignored; a missing `weaponRules.attackMods` gives no text, so no mark. Totality as constraint 8.
- **Not stored:** nothing. `migrate()` is untouched.

## 9. The UI

**Natural lines (Main and print)** already render `conditional` (`.nat-cond`, print's `features`). A running entry renders as a plain sub-line, not the conditional style. A running power's damage shows through `bonusLinesHtml`, as a worn bonus does.

**The Ancient Weapon (Main, print)** and **carried lines (Main, Loadout, print):** the same, one sub-line per mark under the name on screen, in `features` on paper. **Main's carried rows** gain `bonusLinesHtml(l, "damage")` and `(l, "acc")`, as Loadout's have (§5).

**Where things land** (twins in columns):

| Situation | Main | Loadout | Print |
|---|---|---|---|
| Strigoi, Bone Spines 2, a knife | Bite, Claws, Fists and knife each "+4 damage, +5 while grappling while your Bone Spines are out" | The knife's row, the same | Each row's Features |
| Strigoi, Monstrous Maw | Bite alone | — (no natural rows on Loadout) | Bite's Features |
| Draugur, Blood of Valhalla stopped, Blunt, a knife | Mark on Bite, Claws, Fists, Blunt, knife | Knife | Each |
| Draugur, Blood of Valhalla running | Each of those 2 higher, "+2 from Blood of Valhalla" under the damage, no mark | Knife 2 higher, the bonus line | Each 2 higher (print shows the total) |
| Wildblood in form, Let It Loose 2 running | Claws, Fangs: "Spirit damage, and it strikes Unbodied creatures from Let It Loose", +1 under the damage; Fists unchanged | — | Claws, Fangs' Features |
| Wildblood out of form | Fists only, no mark (Let It Loose doesn't run out of form, and its reach is claws and fangs) | — | Same |
| Forge Fang in form, Steel Fangs, Serrated Claws | Fangs: Steel Fangs' mark; Claws: Serrated Claws' | — | Same |
| A pistol, any of the eight | No mark | No mark | No mark |
| Phone width (375) | Marks wrap inside the weapon cell; no sideways scroll | Same | — |

**Copy, drafted for the voice pass** (the builder pastes each as it renders into the PR): the table in §8, plus `damageText` "+{n} damage", `markText` "{effects} {whenText}", `runningText` "{effects} from {from}".

## 10. Worked examples, as named tests

Write these first, in `tests/engine.test.mjs` unless noted; show each failing on `main`.

1. `"Decision N: Bone Spines marks every melee line at its rank, and no ranged one"`: Strigoi, Bone Spines rank 2, a Combat Knife and a pistol → Bite, Claws, Fists and the knife each have one mark containing "+4 damage"; the pistol's `conditional` is `[]`; no line's `damage` moved.
2. `"Decision N: a power reaches the kinds it names"`: Monstrous Maw → Bite only; Rending Claws → Claws only; Rend and Tear → Claws and Bite, not Fists; a Forge Fang in form: Steel Fangs → Fangs (a bite named "Fangs"), Serrated Claws → Claws.
3. `"Decision N: rank moves damage and rounds as plus + perRank × (rank − 1)"`: Rending Claws at ranks 1 and 3 → "+2 damage, Bleeding for 1 round…", "+6 damage, Bleeding for 3 rounds…"; Rend and Tear at rank 3 → "Bleeding for 4 rounds".
4. `"Decision N: Blood of Valhalla is a mark while stopped and the line's number while it runs"` (LQ43): Draugur, Blunt picked, a knife. Stopped: Bite, Claws, Fists, Blunt and knife each have the mark, damage unchanged. `startPower` → each 2 higher, `bonuses` names Blood of Valhalla, the mark gone. `stopPower` → back.
5. `"Decision N: Let It Loose running turns claws and fangs to Spirit, and leaves Fists"` (LQ45, LQ48): Wildblood rank 2 in form, running → Claws and Fangs `damageType` "Spirit", damage +1, a running entry naming Unbodied; Fists unchanged; a worn `kinetic` bonus (cloned, as L4's 6a) no longer reaches Claws.
6. `"Decision N: a Code-broken Ancient Weapon takes no power's mark"`: Draugur, Blood of Valhalla stopped, Code Broken → Blunt's `conditional` `[]`.
7. In `tests/smoke-sheet-archetypes.test.mjs`: `"Main, Loadout and print show a power's mark on the same lines"`: a Strigoi with Bone Spines and a knife → the knife's mark on Main's row, Loadout's row and print's Features; the Bite's on Main and print.
8. Same file: `"Main's carried row lists a running power's bonus under its damage"`: Draugur running Blood of Valhalla with a knife → "+2 from Blood of Valhalla" in the knife's damage cell on Main and on Loadout.

## 11. Tests beyond the examples

- **Totality:** `attackMods` through every line over every archetype × specialization × form state × each of the eight held and running, plus `migrate({})` and the hostile corpus: never throws.
- **Hostile data:** in the engine test with a cloned `D`: `kinds: 7`, `kinds: ["tail"]`, both `kinds` and `class`, neither, `damage: { plus: "x" }`, `damageType: "Plasma"`, `weaponRules.attackMods` missing.
- **Nothing else moves, by diff** (`WORK-ORDERS.md`, *How exact to be*): before touching the engine, script `naturalAttacks`, `archetypeWeapons` and `weaponLine` over every archetype, specialization, form and the eight powers (held, not running) on `main` into a fixture. Afterwards the diff may show only: `conditional` entries added (and `conditional: []` on `weaponLine` and `archetypeWeapons`). With a power running, only its lines' `damage`, `bonuses` and `damageType` move. Paste the summary in the PR.
- **Print height** (`phone-check`, `printFloors`): add cases at `main`'s counts before the build. A Strigoi holding Bone Spines, Monstrous Maw, Rending Claws and Bestial Blessings with two knives; a Draugur running Blood of Valhalla with Blunt and two knives. Record `main`'s counts first, and the PR must print on no more.
- **Voice:** `voice.test` passes on the new strings.
- **Mutation-test:** (a) reach by name instead of `kind`: test 2 fails (Forge Fang's Fangs); (b) drop the `class: "melee"` path: test 1 fails; (c) `perRank × rank` instead of `(rank − 1)`: test 3 fails; (d) sum a stopped power: test 4 fails; (e) skip `attackMods` in `weaponLine`: test 7 fails; (f) drop Main's carried `bonusLinesHtml`: test 8 fails. Check each for a second path that already covers it.

## 12. Steps

1. Baseline (`npm run test:fast` on a fresh branch). Write the fixture (§11) and record `main`'s print counts for §11's new cases.
2. Data: `weaponRules.attackMods` and the eight grants. Decision 135's guard fails on unread keys until step 3: expected.
3. Engine: `attackMods`, and the three lines calling it. Tests 1–6 green. `npm run verify`.
4. Sheet: the six renderers, Main's carried bonus lines. Tests 7–8 green. Run it in the dev preview (`shadows-dev-preview`): a Strigoi with Bone Spines and a knife, a Draugur running Blood of Valhalla, a Wildblood in form running Let It Loose. Check at 375 too.
5. Print, `npm run phone-check` (the new floors), `npm run verify`.
6. The fixture diff. Mutation tests. Docs and close-out (§14).

## 13. Stop and ask

**Stop** if:
- A reader that switches on `g.type` does something with an unknown type (§5): adding `attackMod` would change it.
- The fixture diff shows a number moving that §11 doesn't name.
- A `printFloors` case prints more sheets than `main`, and fitting it means cutting copy or rows (L4's budget is the first lever; say so before cutting).
- A GM-mode reader draws a PC's weapon lines (none in the pre-flight).

**Not stops** (expected):
- L4's `line.conditional === undefined` assertion on the bo staff (engine.test ~13606): it becomes `[]`.
- Decision 135's guard failing between steps 2 and 3. Version literals the bump moves.
- The frame fixture moving for Main frames whose fixture character holds one of the eight (re-record, Main frames only, and list them).

## 14. Close-out

`close-the-session`, Rule-or-shape tier:
- **Decision N** pasted, with its INDEX §3 line under Weapons and gear; **Decision 104** marked superseded in part by N (a running power's weapon bonus is summed), and its INDEX line.
- **Flag:** none, or F N for Bone Spines (§4) with its three edits.
- **CHANGELOG** under `[Unreleased]`, player voice, for the voice pass:
  - "A Vampire's and a Werewolf's powers show on the weapons they change: Bone Spines on every melee attack, Monstrous Maw on your bite, Serrated Claws on your claws, and the rest."
  - "Blood of Valhalla and Let It Loose change your numbers while they run: +2 to every melee hit, or claws and fangs that deal Spirit damage."
  - "Main lists what's adding to a carried weapon's damage, as Loadout does."
- `npm run changelog`; the app bump (or none, §2); `gamedataVersion` bumped.
- **The log:** an entry. **STATE §3:** rewritten (L5b built; the plan's follow-ons next). **The plan:** L5b's row to built. **`shipped.md`:** a row. **W136:** closed, to `log/wishes-granted.md`. **`crb-catch-up.md`:** 0413's AP-number line (LQ46). **A W id** if Ken wants extended powers stored (LQ47).
- **PR title:** `feat(sheet): a power's mark on the weapons it changes (W136, Decision N)`.
- **PR body:** the template's sections, plus every new string as rendered, the screenshots, the fixture diff's summary, the print counts against `main`, and **Where the order didn't fit**.

**Review checklist** (for the reviewer, beyond green tests):
- Each of the eight reaches exactly §8's lines: by `kind`, never by name; "melee" through Decision 248's class.
- A stopped power never moves a number; a running one moves it and lists it, and the mark goes.
- No mark disappears because of a choice the sheet made (a Skill, a form) other than the power's own `runsIn`.
- Main, Loadout and print agree row for row (§9). Main's carried rows show their bonuses.
- Print: no case over `main`'s sheet count (re-measure, don't trust the floor alone).
- Every string is in data, not `sheet.js`.
- The fixture diff names only §11's moves. No saved field; `migrate()` untouched.
- Phone width: no element in `main` past the viewport's right edge with a Strigoi's three marks on a line.

## 15. Handing it over

The two prompts in `WORK-ORDERS.md` *The prompts*, with this order's path. This order's traps:
- **Reach by `kind`, never by name.** A Forge Fang's "Fangs" is a bite; a Vampire's "Bite" is too. A test pins it.
- **"Melee" is a class, not natural.** Bone Spines and Blood of Valhalla reach the Ancient Weapon and a carried knife (LQ44). The Draugur's own weapon is the case Blood of Valhalla is written for.
- **One computation.** Natural lines get their marks once, in `naturalAttacks`; `archetypeWeapons` adds marks to its non-natural rows only, or a Bite shows Bone Spines twice.
- **Ranks are `plus + perRank × (rank − 1)`**, the convention `archetypeWeapons` already uses for Bestial Blessings. Rending Claws' "+2 per rank" is `plus: 2, perRank: 2`.
- **L4's bo staff test** asserts `conditional` is undefined. It's this order's change: make it `[]` and name it in the PR.
- **Print height.** L4's lesson: record `main`'s sheet counts before building, and measure in Chromium after.
- **`private/`:** run `git submodule update --init private` in the worktree before tests.
- **A new piece of work starts on a message that names it.** L4's budget went out before its go-ahead arrived.
