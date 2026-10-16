# Work order P12b: Learning without IP

**Plan:** [`../sheet-wishlist.md`](../sheet-wishlist.md) §3.

**Scope:** two ways a character gets better without spending IP:
- **W39:** a new Martial Arts style learned in play, by the GM's word, and each style's bonus applied to the Combat Maneuver it names.
- **`0450`'s optional Training** (from crb-v4-sync's P5): once per Milestone period, a REF, INT or TECH Skill raised a rank for Çredits, at 10 × the rank's IP cost, never past 9.

**Status:** **drafted 2026-10-16 by Claude (Opus)**, the P12a reviewer. Pre-flighted against `main` at `9c933b1` (P12a, #201, merged; app 0.47.0, game data 0.40 and character schema 0.27, none of them released: `git tag | sort -V | tail -1` is `v0.46.0`). **Ken answered on 2026-10-16 (§4):** the defaults for PQ1, PQ3–PQ5 and PQ7–PQ9; **PQ6: the bonuses stack**, so there's no flag. **PQ2 (what a Milestone period is) is still open.** The plan row's two questions are PQ5 (W39's bonus) and PQ1 (Training as a house rule).

**Branch:** from `main`; PR to `main`. Nothing ships switched off.

**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md) (*The cadence*). Ken starts **P12b build** (Sonnet), then a fresh reviewer (Opus) once the PR is open.

**Carried over from P12a's review:**
- **The order's miss:** §5 said a SAN restore "never reads the max, only the loss", and never asked what bounds the loss's *writers* put on it. The SAN stepper floors it at 0 but never caps it, so a character at 0 SAN could carry 60 loss against a max of 50, and the first fix-round must-fix was IP that bought nothing.
  **Applied here:** every value P12b reads has its writers' bounds in §5: the Çredits balance (can go negative), a skill's rank (four sources), and Milestone Points (Long-Lived adds Milestones without adding MP).
- **The order's ambiguity:** "the IP buy refuses a flagged entry" was read literally, and Cyber-Prophetical, flagged for an unrelated question, was refused with build-state copy.
  **Applied here:** every gate in §8 names its data field and every entry that carries that field today.
- **The fix round's miss:** a `playerNote` reworded for the IP buy also renders in the creation wizard, where it read false.
  **Applied here:** §5 lists every place each new or changed note renders, including the wizard.
- **The build's nit:** closing a modal whose raise-row button had vanished dropped focus on `<body>`.
  **Applied here:** §9's table says where focus goes when **Add a style** runs out of styles.
- **The build:** its "Where the order didn't fit" list was useful a third time; keep it.

**What P12b is.**
- **Today:**
  - A locked sheet can't add a Martial Arts style: the pick's `count: 2` is the creation cap, and `setSelection` refuses a third slot.
  - The styles' bonuses ("+1 Stun") are text in a chip, applied to nothing.
  - Nothing raises a skill but IP, Skilled and Admin.
- **The book:**
  - **Q29** (`reference/rulings-2026-10-10.md`, Deighton with Ken): a style is learned through the story, never bought with IP, and its bonus makes you better at inflicting that Condition.
  - **`0530`** (*Combat Maneuvers*, *Unarmed Attacks*): Grapple, Knockdown, Disarm and Stun are Martial Arts attacks that inflict a Condition instead of damage, "with bonuses to each technique based on the style".
  - **`0450`** (*Optional Rule: Training*): "Once per Milestone period … one REF, INT, or TECH Skill. REF Skills need a teacher … Training costs Çredits equal to 10 × the rank's IP cost … never takes a Skill past 9."
- **After P12b:**
  - Martial Arts' row has **Add a style**, and a line of its Combat Maneuver checks, each with its style's bonus.
  - Progression has **Train a Skill** wherever the GM has turned Training on.

**Probes against `main`** (`9c933b1`; locked Professional, every stat 5, 500 IP):

```
picksFor(ch, "skill", "martial-arts")    rank 2, two styles → need 2, chosen [karate, jujitsu]
setSelection(…, "style", 2, "commando")  {ok:false, why:"No slot for that choice."}
a third style pushed by hand             picksFor shows two; trimSelections cuts it off the saved list
Martial Arts bought with IP              skills["martial-arts"] = {rank:0, ipe:1}; skillLine rank 1; picksFor need **0**,
                                         and setSelection refuses slot 0. heldRank reads a skill's `rank`, never its ipe or boosts.
ipCost(ch, "skill", "handguns")          rank 5 → {cost:25}: Training would be Ç250, as 0450's own example
ipCost(ch, "skill", "investigation")     new → {cost:25}
ipe + 1 with no journal entry            versionCheck [] while the skill has no IP entry; with one IP raise beside it:
                                         "IP journal shows 1 increase on handguns but IPE is 2 — totals may have been edited by hand."
milestoneState after 5 sessions          mp 5, minorAvail 1, majorAvail 0; **with Long-Lived, minorAvail 2** (its grant adds a Milestone, not MP)
addCredits(ch, -250) at Ç0               {ok:true}, current −250: the ledger never refuses
migrate()'s houseRules                   rebuilt as { keepDamagePastZero } only (engine.js ~4017): any other key is dropped
```

---

## 1. Goal

When P12b is merged:

1. **Add a style.** On a locked sheet, Martial Arts' row (on Main's Combat skills and on the Skills tab: one renderer) has **Add a style** while the skill is trained and a style is left to learn. It asks no price and is one commit with its own audit line and one Undo (Q29: the GM's word).
2. **A Martial Arts skill learned in play can hold a style.** A skill's picks count its rank from every source, not only its creation rank (the probe's need 0).
3. **The bonuses apply.** Under the chosen styles, the row shows each Combat Maneuver a style improves: "Stun · Stunned · 1d10 + 10 (Karate +1)". The check is Martial Arts' own plus the style's number, unarmed (PQ5). Two styles naming the same maneuver add up (PQ6): Commando and Karate are +2 on Stun.
4. **Training.** Where Admin has turned it on for this character (PQ1), Progression has **Train a Skill**:
   - REF, INT and TECH Skills only;
   - Çredits at `0450`'s 10 × the rank's IP cost, refused when the balance is short;
   - never past rank 9;
   - once per Milestone period (PQ2), refused a second time with the reason.

   Each training is one commit: the rank, a journal line and a Çredits ledger line, under one Undo. `versionCheck` reads it as the rank it is.
5. **No id in code.** No style, maneuver or skill id appears in `src/engine` or `src/ui`. The data names what a style improves, and which skill performs maneuvers.

## 2. Tier, versions, numbers

**Tier: Rule or shape.** It adds a data shape (maneuvers and their bonuses), a save-file shape (the house rule, and a training entry's two fields) and a new way to raise a skill. **Two numbered decisions**, the next free numbers on `origin/main` when you write them:
- **N**: Martial Arts styles learned in play, and their bonuses;
- **N+1**: Training.

**No flag:** Ken ruled PQ6 (the bonuses stack).

**Character schema: 0.27 → 0.28.** `houseRules.training` is a new key, and a training journal entry carries `via` and `mp`. `migrate()` needs these steps:
- keep `houseRules.training` only when it's `true` (today's rebuild at ~4017 drops it);
- keep `via` only as `"training"`;
- keep `mp` only as a whole number ≥ 0, else delete it.

A style added in play changes no shape: it's a longer `selections.style` array.

**App version:**
- **0.47.0 still unreleased** (today's case): no bump. The lines join `[Unreleased] — app 0.47.0`.
- **0.47.0 released by then:** `npm run bump -- 0.48.0` (minor: new things a player can do).

**Game data:**
- **0.40 still unreleased:** no bump.
- **0.40 released:** 0.41.

The data changes are the maneuvers, each style's `maneuver` and `amount`, the pick's `addInPlay`, and `ip.training`. Say in the PR which case applied.

## 3. The decisions, drafted

Write them as Decisions **N** and **N+1** in `SCHEMA.md` §4. N's INDEX §3 line goes under the topic Decision 77 is filed under, and N+1's under Decision 227's. Fill in Ken's answers; trim only if `docs.test.mjs` says one is over its limit.

```
N. **A Martial Arts style is learned in play by the GM's word, with no price; each style's bonus is a number on the Combat Maneuver it names, added to the skill's check for that maneuver.**
     *2026-10-1x · Ken + Claude (Deighton Q29) · Touches: picks, addInPlay, selections, picksFor, heldRank, setSelection, trimSelections, addPickInPlay, Martial Arts, styles, maneuvers, maneuver, amount, maneuverChecks, skillRowPair, Add a style, Combat Maneuvers, Q29, W39*
     - **Decided:** A pick marked `addInPlay` takes more answers once the character is locked:
       - its `count` stays the creation cap;
       - `addPickInPlay` fills the first empty slot, or adds one, with no price;
       - it is one commit and one Undo.

       A skill's picks count its rank from every source (creation, IP, boosts), so a skill learned in play can hold one. The skill's data lists its `maneuvers`, each naming the Condition it inflicts. A style names a `maneuver` and an `amount`, and `maneuverChecks` adds that amount to the skill's check for that maneuver. The bonus is unarmed only (PQ5). Two styles on one maneuver add their amounts (PQ6, Ken).
     - **Why:** W39; Q29: learned through the story, not bought, and the bonus makes you better at inflicting the Condition. `0530` names the four maneuvers and the style bonuses. A Martial Arts skill bought in play held no style.
     - **Rejected:** <PQ alternatives Ken didn't take>; a price for a style (Q29); parsing "+1 Stun" out of the `bonus` text (Decision 134: a number the engine reads is stored); raising `count` (it is the creation cap, Decision 56).
     - **Replaces:** Decision 77 in part (a pick's `count` is the creation cap when it's `addInPlay`; a skill's held rank counts IP and boosts). Builds Decision 56's "more may be trained later in play".
     - **Revisit if:** Deighton rules otherwise on two styles on one maneuver; W107's unarmed strike line lands (the bonus moves onto it); Salut gets its bonus (Decision 56).
     - **Built:** app …, game data …, schema …, PR #…. Log 2026-10-1x (P12b).

N+1. **Training is a house rule, off until Admin turns it on: once per Milestone period, a REF, INT or TECH Skill rises a rank for Çredits at 10 × that rank's IP cost, never past 9.**
     *2026-10-1x · Ken + Claude · Touches: houseRules, training, ip.training, creditsPerIP, maxRank, stats, teacherStats, trainingCost, trainSkill, milestonePeriod, progression.ip.log, via, mp, versionCheck, trackers.credits, addCredits, Admin, Progression, Train a Skill, IP Journal, character schema 0.28*
     - **Decided:** `houseRules.training`, set in Admin, puts **Train a Skill** on Progression. It prices a rank at `ip.training.creditsPerIP` × `ipCost`'s own price, so a Focused skill's discount carries (PQ3). It refuses:
       - a skill whose primary Stat isn't in `ip.training.stats`;
       - a rank past `ip.training.maxRank`;
       - a short Çredits balance;
       - a second training in the same Milestone period (PQ2, PQ4).

       The rank goes on the skill's IPE, with a journal entry at 0 IP marked `via: "training"` and the Milestone Points it was trained at (`mp`), as Skilled's free ranks are journalled (217). The Çredits come off through the ledger. It is one commit and one Undo.
     - **Why:** `0450`'s optional Training; its own example is Handgun 5 → 6, Ç250. Optional, and "with the GM's approval", so it's off by default.
     - **Rejected:** <PQ alternatives Ken didn't take>; a rank outside IPE (a second store for one skill's rank); counting Milestones from `minorAvail` (Long-Lived's grant would open a period); the training price with no Çredits check (the ledger goes negative).
     - **Replaces:** nothing. Extends Decision 220's `houseRules` (a second key), 27's journal (two fields on a training entry) and 159's raise row (a fourth modal).
     - **Revisit if:** a table wants Training on for every character by default; `0450` changes the price, the cap or the period.
     - **Built:** app …, game data …, character schema 0.28, PR #…. Log 2026-10-1x (P12b).
```

**Check *Replaces* against the text, not the title.** Search §4 for `Martial Arts`, `style`, `picks`, `selections`, `count`, `optional`, `heldRank`, `houseRules`, `IPE`, `journal`, `Skilled`, `Çredits`, `ledger`, `Raise a`, `Downtime` and `Milestone`. The pre-flight found these:
- **14:** IP costs, and the rank-10 cap via IPE (Training's 9 sits under it).
- **27:** journal kinds, and `versionCheck` on IPE against the journal.
- **56:** two styles at creation, more trainable in play.
- **77:** one selection system; `count`, `optional`.
- **134 and 135:** numbers in the data; no id in code.
- **159:** raise buttons as modals.
- **217:** Skilled's 0-IP journal rows.
- **220:** `houseRules`.
- **227:** the raise row's three buttons.

77 is superseded in part by N. Mark it.

## 4. Questions for Ken

| Id | Question | Default | Answer |
|---|---|---|---|
| PQ1 | **Training: a house rule, or always offered?** | **A house rule, off**, turned on per character in Admin beside *Keep damage past zero* (Decision 220's place). `0450` calls it optional and "with the GM's approval". *Alternative:* always offered, with a "your GM decides" line. No schema bump for the toggle, but every sheet gets a fourth Progression button most tables won't use. |  **Ken, 2026-10-16: the default.** |
| PQ2 | **What a Milestone period is.** | **The stretch between one Milestone and the next**, counted from Milestone Points against the data's cadence: Minors at 5, 15, 25…, Majors at 10, 20, 30…, so a period is 5 MP. **Long-Lived's extra Milestones don't open a period** (they add no MP). *Alternative:* one per session (each Milestone Point). `0450` doesn't define the term, so this is your CRB call. |  **Open:** Ken's instinct is 5 MP; being worked through on PR #202. |
| PQ3 | **The price of a Focused skill, and of a skill never trained.** | **10 × whatever `ipCost` charges this character**: a Professional's Focused skill trains at its discount, and a never-trained skill at 10 × 25 = Ç250. *Alternative:* the base price for everyone, and trained skills only. |  **Ken, 2026-10-16: the default.** |
| PQ4 | **Once per period: refused, or warned?** | **Refused**, with the reason and when the next period opens ("Next at 10 Milestone Points"). Admin still raises anything. *Alternative:* allowed with a warning (the sheet doesn't police "between sessions" either, P12a). |  **Ken, 2026-10-16: the default.** |
| PQ5 | **W39's bonus: what it adds to, and when.** | **+N to the Martial Arts check for that maneuver, unarmed only.** `0530` gives the style bonus under *Unarmed Attacks*. Under *Weapon Attacks* it says only that a tagged weapon can make the maneuver. *Alternative:* the bonus also applies with a Disarming or Knockdown weapon. |  **Ken, 2026-10-16: the default.** |
| PQ6 | **Two styles improving the same maneuver** (Commando and Karate are both +1 Stun). | A rules question, so flagged for Deighton (F-next); until he rules, the better bonus counts. *Alternative:* they stack (+2), or the first chosen counts. | **Ken, 2026-10-16: they stack.** Knowing two styles that sharpen one maneuver gives both bonuses (Commando and Karate: +2 Stun). No flag. |
| PQ7 | **Where the maneuver checks show.** | **On Martial Arts' row**, under its style chips: on Main's Combat skills and the Skills tab, which share one renderer (`skillRowPair`). Only maneuvers a held style improves are listed, and only once a style with a number is held. **Print is unchanged** (a W-next). *Alternative:* all four maneuvers always, or print too. |  **Ken, 2026-10-16: the default.** |
| PQ8 | **Who may Add a style, and from what.** | **Any locked character whose Martial Arts is trained** (any source, §1.2). The styles offered are the ones not held, Custom included (its bonus stays its text). No price, no prerequisite: the story is the GM's (Q29). *Alternative:* Admin only. |  **Ken, 2026-10-16: the default.** |
| PQ9 | **A skill's picks counting IP and boost ranks** (the probe's need 0). | **Fix it here**, since §1.1 needs it: a Martial Arts learned with IP can't hold a style otherwise. In the wizard nothing changes but a boosted-only Martial Arts can now choose a style, which is right. *Alternative:* its own Fix order. |  **Ken, 2026-10-16: the default.** |

## 5. What this changes underneath (the assumption sweep)

These rows were found by grepping the readers of each thing P12b touches, one level further. Writers are read through local aliases (`c.houseRules` in `migrate`, `t = ch.trackers`). Every *other path* that changes the same value is its own row, with the bounds its writers keep (P12a's miss):
`picks`, `count`, `optional`, `selections`, `picksFor`, `heldRank`, `entryCopies`, `setSelection`, `trimSelections`, `skillOptionPicks`, `skillChosenHtml`, `skillDescRow`, `skillRowPair`, `pickOptions`, `styles`, `bonus`, `houseRules`, `keepDamagePastZero`, `ipCost`, `ipe`, `progression.ip.log`, `versionCheck`, `milestoneState`, `minorAvail`, `trackers.credits`, `addCredits`, `addLoadout`, `buildExport`, `data-raiseopen`, `data-ipopen`, `data-admin-keepzero`.

**Check each row yourself before you build**, and say in the PR if one is wrong. Ask three questions of every row:
- **Which guards read a value this changes?**
- **Where does each new note or number render?**
- **Where is each new action pressed, and what else changes the same value?**

| Today | Where | After P12b |
|---|---|---|
| `picksFor` takes `rank = heldRank(ch, kind, id)`; for a skill, `heldRank` sums `skills[id].rank` only (no IPE, no boosts) | `engine.js` ~4317, ~4259 | A skill's rank is `rank + ipe + boostsFor`, as `skillLine` counts it. **Readers:** the sheet's style chips (`skillOptionPicks` ~280), the wizard's pick controls (`wizard.js` ~129), `validate` (~4613), `setSelection`, `trimSelections`. A boosted-only Martial Arts in the wizard now offers its style picks (PQ9). Advantages and Disadvantages are unchanged. |
| A pick's `count` is a hard cap: `need = per` for a flat pick, `chosen = raw.slice(0, need)`, and `setSelection` refuses `index >= need` | ~4325–4335, ~4357 | With `addInPlay` on a **locked** character, `need = max(count, stored length)`, so nothing added is sliced off. Unlocked, it's unchanged (the wizard's cap, Decision 56). `complete` is unchanged (`optional`). |
| `trimSelections` cuts a list longer than `need` | ~4378; called by the wizard on a skill's rank change (`wizard.js` ~1115), Redeemed, `spendIP("disadvantage")` | Unchanged: `need` already covers what was added. **Test it:** a third style survives a `trimSelections` call. |
| No writer adds a pick's answer after lock | — | **`addPickInPlay(ch, kind, id, pickId, value)`** joins `setSelection`. It fills the first empty slot, else appends, and refuses: unlocked, not `addInPlay`, rank 0, not an option, missing, or already held. |
| A style is `{ id, name, bonus }`; `bonus` is text, read by `pickOptions` as the option's description | data `martial-arts.styles`; `pickOptions` ~4296 | Each gains `maneuver` and `amount` (Custom gets neither). `bonus` stays the text. **Renders of `bonus`:** the style chips (`skillChosenHtml` ~281), the Skills description row (`skillDescRow` ~287), the wizard's pick labels, and `rules.test.mjs` ~262 and `smoke-wizard.test.mjs` ~145, which pin it. All are unchanged. |
| Nothing lists the Combat Maneuvers | data has the Conditions (`stunned` ~4332, `grappled` ~4300, `prone` ~4318, `disarmed` ~4289) and weapon tags `Disarming`, `Knockdown`, `Stunning` | `martial-arts` gains **`maneuvers`**: `{ id, name, inflicts }` × 4, with `inflicts` a Condition id. It's read by `maneuverChecks`, never by a name in code. The weapon tags are unchanged (PQ5). |
| Martial Arts' row: the name, chips, Rank, Check, Breakdown | `skillRowPair` ~295, used by Main's Combat skills (~418, via `skillTableHtml`) and the Skills tab (~455) | **One renderer, both places:** Add a style (locked, trained, a style left) and the maneuver line under the chips (PQ7). Print's `pSkillCellsHtml` (~2508) is unchanged. |
| `houseRules: { keepDamagePastZero }`; `migrate` rebuilds it with that key only | `newCharacter` ~72; `migrate` ~4017; Admin ~2370 (render), ~3844 (handler, which spreads the old keys) | Gains `training: false`. `migrate` keeps `training` only when `true`. Admin gets a second checkbox, and its handler spreads the old keys too. **Readers:** `heal`'s `_healMath` (~1869, ~1896) reads only `keepDamagePastZero`, unchanged. |
| A skill's IPE writers: `spendIP` (~2229), Skilled (~2580, with 0-IP journal rows), Admin's skill editor | | `trainSkill` joins them: `ipe + 1`, and a journal entry `{ kind:"spend", amount:0, targetType:"skill", targetId, from, to, note:"", via:"training", mp }`. **Without the entry, the "edited by hand" banner fires** on any skill that also has an IP raise (probe). |
| `versionCheck` counts every non-grant entry on a skill against its `ipe` | ~4768 | **Unchanged:** a training entry is one rank, and is counted as one. P12b 7 pins it. |
| `ipState`: spent is the sum of non-grant `amount`s | ~2054 | Unchanged: a training entry's amount is 0. |
| IP Journal: a skill entry reads "<Skill> 5 → 6" | `sheet.js` ~1521 | A `via:"training"` entry reads "Trained: Handguns 5 → 6". `via` is read only as the exact string. |
| `trackers.credits`: the writers are `addCredits` (any sign, **never refuses a negative balance**), `addLoadout`'s buy (refuses `price > have`), the Çredits steppers, Admin | `engine.js` ~2638, ~1584; `buildExport` ~4715 seeds the balance when the ledger is empty | `trainSkill` refuses `credits > current` (as `addLoadout`), then writes through `addCredits(ch, -price, "Training: Handguns 5 → 6")`. A training always leaves a ledger row, so `buildExport`'s seed never fires after one. **Renders of the balance:** the vitals pill (~227), the drawer (~257), Main's card (~368), the popover (~1334), the Gear tab's Balance and Ledger (~1435), the catalog's "You have" (~1749), print (~2693), the wizard rail (`wizard.js` ~86). All read `current`, unchanged. |
| Milestone Points: `milestoneState(ch).mp` = sessions' MP + `progression.milestonePoints`. `minorAvail` adds Long-Lived's grant | ~2274–2300 | **`milestonePeriod(ch, mp)`** counts how many of the data's Minor and Major thresholds `mp` has reached, from `milestones.rules` and MP only (PQ2). It never reads `minorAvail`. The writers of MP are logging a session (sessions with `milestonePoint`), Admin's manual MP, and Undo; a deleted session can move a period back, which is fine. |
| Progression's raise row: Raise a Stat, Raise a Skill, Buy or Raise a Power, Buy an Advantage, Buy off a Disadvantage, Restore | `sheet.js` ~1503–1509; `openRaisePicker`, `openIpBuy` | **Train a Skill** joins it after Raise a Skill, only with `houseRules.training`. It opens a modal that stays open after a training (Decision 159), with every row now off and the reason. |
| `ipCost(ch, "skill", id)`: new 25; else rank × 5, or Focused × 3; refused at `rankCap` (10) and for a non-skill id | ~2175 | **Read, not changed:** `trainingCost` prices `ip.training.creditsPerIP × ipCost(…).cost` and adds its own refusals (stat, `maxRank` 9, period, Çredits). |
| GM mode | `gm.js` | **Not a reader** of a character's skills, styles, house rules or Çredits. Its `skills` are a cast member's stat block. Confirm with `grep -n "houseRules\|selections\|credits" src/ui/gm.js`. |
| Ids in code | the A8 guard | **No id:** `addInPlay`, `maneuvers`, `maneuver`, `amount`, `ip.training.stats` and `teacherStats` decide. No `martial-arts`, `karate`, `stun`, `REF` literal in `src/engine` or `src/ui` (a Stat id read from `ip.training.stats` is data). |

## 6. Read first

- `CLAUDE.md`, then `docs/STATE.md`.
- `docs/WISHLIST.md` W39 and W107; `docs/reference/rulings-2026-10-10.md` Q29.
- `private/crb/0450_Advancement.md`: *Optional Rule: Training*, the IPE callout, *Milestones*. `0530_Combat_Encounters.md`: *Combat Maneuvers*, *Unarmed Attacks*, *Weapon Attacks*.
- `SCHEMA.md` §4: **14**, **27**, **56**, **77**, **134**, **135**, **159**, **217**, **220**, **227**; §3's `houseRules`, `progression.ip.log` and `selections`.
- `src/engine/engine.js`:
  - the selection system (~4225–4400): `entryCopies`, `heldRank`, `picksFor`, `setSelection`, `trimSelections`, `pickOptions`;
  - `skillLine` (~668), `boostsFor` (~138), `ipCost` and `spendIP` (~2100–2235);
  - `milestoneState` (~2274), Skilled in `planMinorChoice` (~2570), `addCredits` (~2638), `addLoadout` (~1580);
  - `migrate` (~3977, `houseRules` ~4017), `versionCheck` (~4760), `buildExport` (~4708).
- `src/ui/sheet.js`:
  - `skillOptionPicks`, `skillChosenHtml`, `skillRowPair` (~278–313);
  - `renderShProgression` (~1490) and its journal (~1513);
  - `openRaisePicker` (~2820) and `openIpBuy` (~3060), whose modal and focus code Train a Skill reuses;
  - Admin's house rule (~2370, ~3844).

## 7. Out of scope

- **W107:** an unarmed strike line, and Death Touch's AP. The maneuver line is built so W107 can hang off it, but no strike or damage line is added.
- **A style bonus with a weapon** (PQ5's alternative), and anything on print (PQ7).
- **Removing a style** in play (Undo covers a mistake, and Admin edits the skill).
- **Salut** (Decision 56: held out until it has a bonus).
- **Policing Downtime or a teacher.** The sheet says a REF Skill needs one, and doesn't ask.
- **Training a Stat or a Power** (`0450` trains Skills only).
- **Any change to IP prices**, Skilled, or the Session Log.

## 8. The shapes

**Data:**

```
"martial-arts": {
  ...,
  "maneuvers": [                                    // 0530 Combat Maneuvers
    { "id": "grapple",   "name": "Grapple",   "inflicts": "grappled" },
    { "id": "knockdown", "name": "Knockdown", "inflicts": "prone" },
    { "id": "disarm",    "name": "Disarm",    "inflicts": "disarmed" },
    { "id": "stun",      "name": "Stun",      "inflicts": "stunned" }
  ],
  "picks": [{ "id": "style", …, "count": 2, "optional": true, "distinct": true, "addInPlay": true }],
  "styles": [
    { "id": "commando", "name": "Commando", "bonus": "+1 Stun", "maneuver": "stun", "amount": 1 },
    …                                               // escrima disarm, jujitsu grapple, karate stun, krav-maga disarm, kung-fu knockdown
    { "id": "custom", "name": "Custom", "bonus": "Talk with GM to determine bonus" }        // no maneuver: text only
  ]
}
"ip": { ..., "training": {
  "creditsPerIP": 10,                 // 0450: 10 × the rank's IP cost
  "maxRank": 9,                       // 0450: never past 9
  "stats": ["REF", "INT", "TECH"],    // 0450
  "teacherStats": ["REF"],            // 0450: REF Skills need a teacher; the row says so
  "teacherText": "Needs a teacher, a person or VI who knows the work.",
  "selfText": "Books, courses and manuals will do."
} }
```

The data-key guard needs every new key read. `teacherText` and `selfText` are named text. A style's `maneuver` that names no maneuver, or a `maneuvers` entry whose `inflicts` names no Condition, is a test failure in `rules.test.mjs`, not a silent skip.

**The saved file (schema 0.28):** `houseRules.training: false`; a training journal entry carries `via: "training"` and `mp: <MP when trained>`. `migrate()`'s steps are in §2.

**Engine** (each returns `{ ok:false, why }` and writes nothing on a refusal):

1. **`picksFor`**: a skill's rank counts `ipe` and boosts; an `addInPlay` pick on a locked character has `need = max(count, stored length)`.
2. **`addPickInPlay(ch, kind, id, pickId, value)`** → `{ ok, why }`. It refuses each of these:
   - an unlocked character;
   - a pick without `addInPlay`;
   - an entry at rank 0;
   - a value that isn't a live option;
   - a value already held (`distinct`).

   It fills the first null slot, else appends.
3. **`maneuverChecks(ch, skillId)`** → `[{ id, name, inflicts: <Condition name>, bonus, check, styles: [names] }]`. Only maneuvers a held style improves are listed. `check` is `skillLine(ch, skillId).checkBonus + bonus`. `bonus` is the sum of the held styles' `amount`s for it (PQ6), and `styles` names each. A skill with no `maneuvers` gives `[]`.
4. **`milestonePeriod(ch, mp)`** → a whole number: how many Minor and Major thresholds `mp` has reached (`mp` defaults to `milestoneState(ch).mp`).
5. **`trainingCost(ch, skillId)`** → `{ ok, credits, from, to, name, teacher, nextAt }` or a refusal. It refuses each of these:
   - Training is off for this character;
   - a skill whose primary Stat isn't in `stats`;
   - `ipCost` refused;
   - `to > maxRank`;
   - a training entry already in this period (the `why` names the skill and `nextAt`, the MP the next period opens at);
   - `credits > current`.

   `teacher` is true for a `teacherStats` skill.
6. **`trainSkill(ch, skillId)`** writes the IPE, one journal entry and one ledger line, in one call.
7. **`migrate`**: §2's steps, and the schema stamp.
8. **Total:**
   - a junk skill id, a non-string value, an `addInPlay` pick on a skill with no entry, a journal entry with `mp: "x"`, and a `houseRules` of `null` each refuse or render, never throw;
   - `maneuverChecks` on a style whose `maneuver` names nothing skips it.

## 9. The UI (behaviour, not markup)

- **Martial Arts' row** (`skillRowPair`, so Main and Skills alike):
  - **Add a style:**
    - a small button after the chips, shown when the sheet is locked, the skill is trained and a style is left;
    - it opens a modal listing the styles not held, each with its bonus text;
    - one press adds the style and closes the modal, with an undo toast.
  - **The maneuver line:**
    - "Combat Maneuvers: Stun → Stunned · 1d10 + 10 (Karate +1)", one per improved maneuver;
    - with two styles on one maneuver (PQ6), "Stun → Stunned · 1d10 + 11 (Commando +1, Karate +1)";
    - it never repeats the row's own Check: read it beside the Rank and Check cells.
- **Admin:** a second house-rule checkbox, "Training (optional rule): raise a REF, INT or TECH Skill with Çredits, once per Milestone period".
- **Progression:** **Train a Skill**, after Raise a Skill, only with the house rule on. Its modal:
  - a status line: "You have Ç1,250 · one Skill per Milestone period · this period is open" (or "Handguns was trained this period; the next opens at 10 Milestone Points");
  - a row per REF, INT and TECH Skill: "Handguns · 5 → 6 · Ç250", its teacher or self line, and **Train**, off with its reason;
  - it stays open after a training, with every row off and the reason.
- **IP Journal:** "Trained: Handguns 5 → 6". **Çredits ledger:** "Training: Handguns 5 → 6".
- **Mark for a voice pass:** every new line.

| Press | Where the record lands | Where focus goes |
|---|---|---|
| Add a style → a style | `selections.style` gains it; one commit | Add a style on the same row, or **the row's name cell** when no style is left and the button is gone. Never `<body>`. |
| Train a Skill → Train | `ipe + 1`; journal (0 IP, `via`, `mp`); ledger −price; one commit | stays in the modal on that row (every row now off) |
| Admin → Training on/off | `houseRules.training`; one commit | as today |
| Undo (toast) | everything above in one step | as today |

**Nothing to do:**
- the house rule is off: no Train a Skill button;
- every style held: no Add a style;
- no style with a number held: no maneuver line;
- every trainable skill barred: each row says why, never an empty modal.

## 10. Worked examples, as the tests you write

**Write them first and run them on `main`'s code.** Each must fail, or you must say why it passes. Ruling tests in `rules.test.mjs` cite `0450`, `0530` or `rulings-2026-10-10.md`.

| Test name | File | Setup → result |
|---|---|---|
| `P12b 1: a style is added in play with no price, past the creation cap` | engine | Locked, Martial Arts rank 2, two styles. `addPickInPlay(…, "commando")` → three styles; `picksFor` shows three; `trimSelections` keeps three; IP and Çredits unchanged. Unlocked → refused. A held style again → refused. |
| `P12b 2: a Martial Arts learned with IP can hold a style` | engine | `{rank:0, ipe:1}` → `picksFor` need 2, and `addPickInPlay` → ok. **On `main` need is 0.** A boosted-only Martial Arts in an unlocked draft: `setSelection` slot 0 → ok. |
| `P12b 3: a style's bonus lands on its maneuver's check, unarmed` | rules | Karate held: `maneuverChecks` lists Stun only, check = Martial Arts' `checkBonus` + 1, inflicting Stunned. Per `0530` and Q29. |
| `P12b 4: two styles on one maneuver stack` | engine | Commando and Karate: Stun's bonus is 2, its check Martial Arts' `checkBonus` + 2, and `styles` names both. Escrima and Krav Maga: Disarm +2. Karate alone with Jujitsu: Stun +1, Grapple +1. (Ken, PQ6.) |
| `P12b 5: every style names a real maneuver, and every maneuver a real Condition` | rules | Every non-custom style has a `maneuver` among `maneuvers` and a positive `amount`; its `bonus` text names that maneuver; every `inflicts` is a Condition id. |
| `P12b 6: Training prices a rank at 10 × its IP cost, never past 9` | rules | Handguns 5 → 6: Ç250 (`0450`'s example). A Focused skill at its discount (PQ3). New skill: Ç250. Rank 9 → refused. A COOL skill → refused. |
| `P12b 7: a training is one rank, one journal line at 0 IP, one ledger line, and no banner` | engine | `trainSkill` → `ipe + 1`, the entry has `via:"training"` and `mp`, `ipState().spent` unchanged, Çredits −250, and `versionCheck` is `[]` **with an IP raise on the same skill beside it**. |
| `P12b 8: once per Milestone period, counted in Milestone Points` | engine | MP 3: train → ok; train again → refused, naming the skill and the next period's 5 MP. Log two sessions (MP 5) → ok. **With Long-Lived and MP 3, still refused** (its Milestone opens no period). |
| `P12b 9: Training is off until Admin turns it on, and refuses a short balance` | engine | Default character → refused, nothing written. On, Çredits 100, Ç250 → refused, balance unchanged (not −150). |
| `P12b 10: migrate keeps the house rule and a training entry's fields, and nothing else` | hostile | `houseRules.training: true` survives; `"yes"` → dropped. `via:"x"` dropped; `mp:"3"`, `-1` and `{}` dropped; `mp: 3` kept. Schema stamped 0.28. |
| `P12b 11: Add a style from the Skills tab and Main, one commit, one Undo` | smoke-sheet-skills | Locked, Martial Arts 2, Karate: the button shows on both tabs; add Jujitsu; chips show three styles; the maneuver line shows Grapple and Stun; Undo → two styles. With every style held: no button, and focus on the row's name cell. |
| `P12b 12: Train a Skill from Progression` | smoke-sheet-progression | Off: no button. Admin on → the button shows. Train Handguns: rank, journal "Trained: Handguns 5 → 6", ledger "Training: Handguns 5 → 6", Ç−250, the modal stays open with every row off; reload → no banner; Undo restores it all. |

## 11. Tests beyond §10

- **Totality:** add a degenerate with `houseRules: null`, a skill entry `{ selections: { style: "x" } }`, and a journal entry `{ via: {}, mp: "x" }`. `maneuverChecks`, `trainingCost`, `trainSkill` and `addPickInPlay` on every degenerate and every junk argument never throw.
- **Hostile:** a file whose style list holds `"<img onerror>"` renders as text in the chips.
- **Data-key guard:** `maneuvers`, `inflicts`, `maneuver`, `amount`, `addInPlay` and every `ip.training` key are read.
- **Voice:** the new copy passes `voice.test.mjs`, and no flag id renders (constraint 9).
- **The A8 guard:** no style, maneuver, skill or Stat id in `src/engine` or `src/ui`.
- **Phone width:** `npm run phone-check`. Check the Train a Skill modal and Martial Arts' row with three styles and a maneuver line at 375px.

## 12. Mutants, each of which must fail a test

List them in the PR and the log. Each line says what else could cover it.

1. `picksFor` reading a skill's `rank` only (P12b 2). **Second path:** none; this is the bug.
2. `need` capped at `count` on a locked character (P12b 1, asserted on `trimSelections` keeping three).
3. A style's bonus parsed from `bonus` text, or applied to every maneuver (P12b 3: Grapple isn't listed for Karate).
4. Two styles on one maneuver taking the better one, not the sum (P12b 4).
5. Training priced at the base rank × 5 for a Focused skill (P12b 6, PQ3).
6. A training with no journal entry (P12b 7, the banner). **Second path:** `versionCheck` alone, so assert on the banner, not the entry.
7. The period counted from `minorAvail` (P12b 8's Long-Lived case).
8. `trainSkill` writing a negative balance (P12b 9, asserted on `current`).
9. `migrate` keeping a non-`true` `houseRules.training` (P12b 10).

## 13. Steps

1. `git submodule update --init private`, then `npm run test:fast` on a fresh branch from `origin/main`. Note the totals. Ken's answers are in §4.
2. Write §10's rows. Run them on `main`'s code and keep the output.
3. Data (§8), then the engine (§8.1–8), with the schema bump and `migrate`. `npm run test:fast`.
4. The UI (§9). `npm run verify`.
5. **Run it in the dev preview** (`shadows-dev-preview`):
   - a locked Professional with Martial Arts 2 and Karate:
     - add Jujitsu from Main and Commando from Skills;
     - read the maneuver line beside Rank and Check;
     - Undo each;
     - add the last style and check where focus lands;
   - a Martial Arts bought with IP: add a first style;
   - Admin: Training on. Train Handguns, then try a second skill (refused, with the next period's MP). Log five sessions, then train again;
   - read the journal and the Çredits ledger, and reload: no banner.
   - **Measure, don't eyeball:**
     - Add a style's button stays put after an add (`getBoundingClientRect().y`);
     - `document.activeElement` after the last style is never `<body>`;
     - at 375px, `scrollWidth` = `clientWidth` on Skills, Main and the modal.
6. Docs:
   - Decisions N and N+1 with their INDEX lines, and 77's supersession mark;
   - SCHEMA §2 (`maneuvers`, styles, `addInPlay`, `ip.training`) and §3 (`houseRules.training`, the journal's `via` and `mp`, schema 0.28);
   - W39 to `wishes-granted.md`; a W-next for PQ7's print line;
   - the plan's P12b row;
   - CHANGELOG, then `npm run changelog`; versions per §2.
7. `npm run verify` and `npm run phone-check`.

## 14. Stop and ask

- A row of §5 turns out to be wrong, and the fix isn't a line or two. The likeliest: changing a skill's rank in `picksFor` moves a wizard test, or `need = max(count, length)` lets the wizard's `validate` see a third style.
- **A code change outside:**
  - the engine functions named in §5 and §8, `migrate`, and `newCharacter`'s `houseRules`;
  - `skillRowPair` and its helpers, Progression's raise row and its modals, the IP Journal renderer, and Admin's house rules.
- An answer in §4 that reads differently from what you're about to build: they're Ken's, not yours.
- A test outside these **expected breaks** fails:
  - the schema-version assertions (`engine.test.mjs`'s `newCharacter` test, which reads 0.27);
  - the data-key guard, until the new keys are read;
  - a wizard test counting a boosted-only Martial Arts' picks (PQ9).

## 15. Close-out and review checklist

**Close-out:** the close-the-session skill, *Rule or shape* tier. That covers:
- Decisions N and N+1 and their INDEX lines;
- the log entry, with the mutants;
- `shipped.md`'s row;
- the plan's P12b row; W39 granted;
- CHANGELOG plus `npm run changelog`;
- versions per §2, and schema 0.28;
- STATE rewritten (wherever Martial Arts, Training and Advancement live in §3).

Suggested CHANGELOG lines (player voice):

- **Learn a new Martial Arts style in play.** When the story teaches you one, **Add a style** on Martial Arts takes it, no IP asked. A style learned with IP-bought Martial Arts now counts too.
- **Your style's bonus is on the sheet.** Under Martial Arts, each Combat Maneuver your style sharpens shows its check with the bonus in it: Karate's +1 on Stun, Jujitsu's on Grapple.
- **Training, if your GM uses it.** Turned on in Admin, **Train a Skill** raises a REF, INT or TECH Skill once per Milestone period for Çredits, 10 × what the rank would cost in IP, never past 9.

**Review checklist:**

- [ ] §10's twelve tests exist with those names, and the PR shows them run on `main`'s code.
- [ ] §5's rows are each confirmed or corrected in the PR, including every writer of Çredits, IPE and Milestone Points, with their bounds.
- [ ] `git diff origin/main --stat -- src/engine src/ui` touches only what §14 allows.
- [ ] No style, maneuver, skill or Stat id in `src/` (the A8 guard passes).
- [ ] Decisions N and N+1 pass `docs.test.mjs`; *Replaces* checked against the ledger's text (77 marked).
- [ ] Every new note's renders were read in place, the wizard included (P12a's fix-round miss).
- [ ] The dev-preview run happened (§13.5), with the measurements, Undo, a reload and phone width.
- [ ] Mutants are listed in the PR **and** the log, with 6 asserted on the banner and 8 on the balance.
- [ ] `npm run verify` and `phone-check` are green; versions are per §2, and the PR says which case.

## 16. Handing it over

The README's two prompts (`gm-mode/README.md`, *How exact to be*), with `<plan>/<order>` = `sheet-wishlist/P12b-learning-without-ip.md` and `<id>` = **P12b**, and these traps under the builder's:

> Six things in this order are easy to get wrong:
>
> 1. **A skill's picks counted only its creation `rank`.** A Martial Arts bought with IP held no style. Count `ipe` and boosts, as `skillLine` does.
> 2. **`count` is the creation cap, and three readers enforce it** (`picksFor`'s slice, `setSelection`'s slot check, `trimSelections`). An `addInPlay` pick on a locked character must get past all three, or the third style is saved and then cut off.
> 3. **A training rank needs its journal entry**, at 0 IP, or `versionCheck` calls every trained skill that also had an IP raise "edited by hand".
> 4. **`addCredits` never refuses.** Check the balance first, as `addLoadout` does, or Training writes a negative balance.
> 5. **A Milestone period comes from Milestone Points**, not `minorAvail`: Long-Lived adds a Milestone without adding MP.
> 6. **`migrate` rebuilds `houseRules` with one key.** Add `training`, or every save drops it. No id in code: `maneuver`, `addInPlay` and `ip.training.stats` decide. Write a regex into a file with the editor, never through a shell heredoc.
>
> Tier: Rule or shape. Two numbered decisions, the next free; no flag (Ken ruled PQ6: the bonuses stack). Schema 0.28. Versions per §2. Use the close-the-session skill at the end.
