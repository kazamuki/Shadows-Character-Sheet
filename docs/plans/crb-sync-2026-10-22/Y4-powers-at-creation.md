# Work order Y4 — Supernatural powers at creation, as `0413` and `0414` print them

**Plan:** [`../crb-sync-2026-10-22.md`](../crb-sync-2026-10-22.md) §2, row Y4 (YQ1 and YQ4 answered in §4).
**Status:** **drafted 2026-10-23 by Claude (Opus)**, the Y1 reviewer, after #227 merged (the README's step 7).
**Not approved yet:** YQ8–YQ11 (§4) are for Ken.
**Pre-flight:** against Shadows-Character-Sheet `main` at `508389c` (#227 merged), with `private/` at `e6acadc`.
Read and probed 2026-10-23, and **prototyped**: the two engine lines in §8 were changed in a scratch tree and
the full suite was run, so §13's list of expected breaks is the suite's own output, not a guess.
**Tier: Rule or shape.** One decision (**N**), the next free number on `origin/main` when it's built (238 is
the last today; the CRANK launch PR running beside this may take 239). No flag. No schema bump: the save
file's shape doesn't move.
**Branch:** one, cut from `main`. **Runs beside:** the conductor's CRANK launch PR (`FEATURES` in `shared.js`,
CHANGELOG, STATE, the log) and its release. Nothing here touches `FEATURES`. If STATE or CHANGELOG collide,
rebase on `main` before Ken merges and keep both entries.
**Cadence:** the two-session loop in [`../gm-mode/README.md`](../gm-mode/README.md), **with direct messaging
again** (Ken, 2026-10-23): builder and reviewer talk to each other, and anything for Ken goes to the conductor.
Ken starts **Y4 build** (Sonnet), then a fresh reviewer (Opus) once the PR is open.

**Carried over from Y1's review.** Four things, each also written into the step or row it applies to:
- **The order's:** Y1's §9 moved the picker to the top of the tab but kept the panel's lines, which then said
  "Remove it" with nothing below them. *When an order moves a control or changes a rule, every sentence that
  describes it is a reader.* §5 has a row per sentence that describes Base Powers or the CP cap, found by
  grep, and §9 rewrites each one.
- **The build's:** a new styled block used a colour written for one theme (1.96:1 in the light theme). Y4
  adds no new styled block. If the build adds one anyway, §12 step 6 measures its contrast in both themes.
- **The build's:** the PR didn't report something the order asked to have reported (Enter dropping focus),
  and a test covered one of the two lines it changed. **Every "report it if…" in this order is a review
  checklist item** (§14), and §10's examples name each sentence they pin.
- **Environmental:** `engine.test.mjs` *"208: a search over 200 members and 100 sessions is quick"* failed
  at 65 ms with the dev preview's Chromium running. It's GM-table code this order doesn't touch. §13 says
  it isn't a stop when it passes run alone.

---

## Pre-flight

```
0413 (mirror e6acadc), line 48:  "Every Vampire gets the full set of Innate Powers. You then are granted a number of
  Bloodline powers during character creation, at Rank 1. You can raise these up to your Max Starting Rank with
  Character Points. After play starts, you can purchase more Bloodline powers or increase existing powers with
  Improvement Points."
0414, line 50: the same, with "and their Origin's Starter Power" and "Origin powers".
The scaling tables match the data row for row (R15 and R16 already pin them):
  Vampire   Base Powers 2/3/4/5,  Max Starting Rank 1/2/2/3
  Werewolf  Base Powers 1/2/2/3,  Max Starting Rank 1/1/2/2       ← Heroic is 1 too
  Max Power Rank (power levels)   2/3/4/5
Data today: both archetypes' powersBought = { countBy: campaignPowerScaling.basePowers,
  maxRankBy: campaignPowerScaling.maxStartingRank, granted: "innate" }. Both are status "draft".

Engine today (engine.js ~3866–3960)
  basePowerState: each row's cap = min(Max Starting Rank, printed max) → Base Powers place RANKS up to it
  powerCpState:   cap = min(Max Power Rank, printed max)                 → CP raises past Max Starting Rank
Probes on main (tests/harness.mjs loadEngine; a scratch script, numbers as printed)
  Heroic Strigoi (3 BP, MSR 2, MPR 3)  placeBasePower shadow-play ×2 ok, ×3 "can start at rank 2 at most"
                                       buyPowerRank shadow-play +1 ok → rank 3; +1 "highest starting rank, 3"
                                       buyPowerRank bestial-blessings (Innate) +1 ok → rank 2, cap 3
  Street Upyr (2 BP, MSR 1, MPR 2)     rend-and-tear ×2 refused (cap 1); CP +1 ok → rank 2, cap 2
  Heroic Trueborn (2 BP, MSR 1, MPR 3) apex-fury ×2 refused; CP +2 ok → rank 3, cap 3
  WCD Draugur (5 BP, MSR 3)            spectral-veil (printed 3) ×3 ok; deathless-resilience (unranked) ×2 refused
After (the §8 prototype): every second placement in one power is refused; CP caps at min(MSR, printed):
  Heroic Strigoi rank 2, Street anything rank 1, Heroic Werewolf rank 1.
Who checks these: validate() (wizard only: wizard.js 18, 171, 726, 1119). Nothing re-checks a locked
  character, so a locked Vampire placed under Decision 215 keeps its ranks with no error (YQ4).
Ledger: Decision 215 is the rule (and rejected "Max Starting Rank capping CP"); 200's "none past Max Starting
  Rank" is already 215's. Touches-line search for placeBasePower, powerCp, basePowers, buyPowerRank,
  Max Starting Rank, powerCpSpent, basePowerState, powerPool: 196, 200, 215, 223. Only 215 changes.
```

**What the pre-flight found that the plan didn't say:**
1. **A Heroic Werewolf's Max Starting Rank is 1**, so CP raises no Origin power at Street **or Heroic** (the plan
   named Street only). That's the book's table, not a question, but Ken should know (YQ10).
2. **The book says CP raises "these"**: the Bloodline powers just granted. Decision 215 lets CP raise an
   Innate power too. YQ8 asks which.
3. **The Base Power control** is a stepper today, and under the new rule its `+` stops at 1 on every row. YQ9
   asks whether it stays a stepper.
4. **Nine existing tests encode Decision 215** and fail under the new rule (§13), plus two `rules.test.mjs`
   assertions that pin the data's notes. Each is updated in the same change as Decision N (CLAUDE.md: a test
   encoding an outdated decision). One of them, *"Decision 218 / 162: a buyable power rank still counts as CP"*,
   probes a **Street** Strigoi, which can't buy a power rank any more: its fixture moves to Heroic.

---

## 1. Goal and Done when

A player making a Vampire or a Werewolf meets the book's rule: each Base Power takes one Bloodline or Origin
power at rank 1, and Character Points raise a held power up to Max Starting Rank. Nothing about play changes.

**Done when:**
1. In the wizard, **a Base Power takes a power once, at rank 1**. A second Base Power in the same power is
   refused, on the Bloodline step and on Admin.
2. **CP raises a held, ranked power only to Max Starting Rank** (or the book's printed maximum, if lower). Max
   Power Rank no longer binds these archetypes at creation. At Street Level (Vampire) and Street and Heroic
   (Werewolf), the CP step offers no power rank.
3. **A draft made under Decision 215** (two Base Powers in one power, or CP past Max Starting Rank) shows the
   wizard's error naming the power and how to fix it, and can't lock until it's fixed (YQ4).
4. **A locked character keeps every rank it holds.** `migrate()` changes nothing. A locked Vampire with two
   Base Powers in one power still shows rank 2 on the sheet.
5. Every sentence that describes Base Powers or the CP cap, in the wizard, the data, Admin and the
   Character tab, says the new rule (§5's text rows).
6. IP in play is unchanged (Decision 194): a power raises to its printed maximum, then 10.

## 2. Tier, versions, numbers

- **Rule or shape**: one decision, **N** (§3). No flag.
- **App:** a **minor** bump, the next minor after the version `[Unreleased]` names when you build. If the
  CRANK release has turned `[Unreleased]` into a dated heading by then, it's the next minor after that
  release. A player can see the change, and choices they had are gone.
- **`gamedataVersion`:** the next after `main`'s (0.46 → **0.47** today). Decision 68: a character's available
  choices change, and the data's notes change with them.
- **Character schema:** **no bump.** `basePowers` and `powerCp` keep their shapes; an old draft's numbers stay
  as stored (YQ4).
- **Table, pack, ruleset:** untouched.

## 3. Decisions, drafted in full

Paste into `SCHEMA.md` §4 with the number taken, and fill *Built*. YQ8's answer decides one clause, marked.

```
N. **A Vampire's or Werewolf's Base Power takes one Bloodline or Origin power at rank 1; CP raises a held power only to Max Starting Rank.**
     *2026-10-23 · Ken + Claude · Touches: powersBought, maxRankBy, Max Starting Rank, Max Power Rank, basePowerState, placeBasePower, powerCpState, buyPowerRank, spendable cp, validate, campaignPowerScaling.notes, Base Powers block, Character Points step, Admin Base Powers, YQ1, YQ4, YQ8–YQ11*
     - **Decided:** Under `powersBought`, each Base Power holds one power of the chosen specialization at rank 1; a second in the same power is refused. `maxRankBy` (Max Starting Rank) now caps a power's starting rank, Base Power plus CP, with the book's printed maximum; Max Power Rank no longer binds these archetypes at creation. CP raises [YQ8 default: any held, ranked power, Innate included]. A draft placed under Decision 215 is refused by the wizard until fixed; a locked character keeps what it holds, and `migrate()` changes nothing.
     - **Why:** `0413` and `0414` now print the rule ("granted a number of Bloodline powers … at Rank 1. You can raise these up to your Max Starting Rank with Character Points"), and Ken ruled the book is the rule (YQ1).
     - **Rejected:** keeping Decision 215 and sending the book a catch-up item (YQ1); `migrate()` turning a second placement into CP (it writes a choice the player didn't make, and spends CP they may have put elsewhere); grandfathering drafts (YQ4); a data key for the Base Power's rank (one rule, both archetypes, and the book prints no other).
     - **Replaces:** Decision 215 in part: Base Powers placed ranks up to Max Starting Rank, and CP raised to Max Power Rank. 215 rejected Max Starting Rank capping CP; the book now prints it.
     - **Revisit if:** the book gives Base Powers a rank above 1 at a Power Level, or lets CP buy a new power at creation; or a third archetype buys powers this way with a different cap.
     - **Built:** app X.Y.0, game data 0.47, no schema bump, PR #…. Log 2026-10-2x (Y4).
```

If Ken answers YQ8 "Bloodline or Origin powers only", the bracket reads: *only a power a Base Power took;
an Innate power stays at rank 1 until play*.

Supersession marks (CLAUDE.md, *Decisions*):
- Decision 215's entry, after its existing 216 mark: `→ **Superseded in part by Decision N**: a Base Power takes a power once, at rank 1, and CP raises a held power only to Max Starting Rank (the book, YQ1).`
- `INDEX.md` §3, 215's line: `→ **superseded in part by 216, N**`.
- `INDEX.md` §3, the same topic, a new line after 216's:
  `- **N** *(Powers at creation — crb-sync Y4, YQ1, YQ4)* — a Base Power takes one Bloodline or Origin power at rank 1; CP raises a held power only to Max Starting Rank; a draft made under 215 is refused until fixed, a locked character keeps its ranks.`

## 4. Questions for Ken

YQ1 (the book is the rule) and YQ4 (locked keeps everything; a draft is refused by the wizard; `migrate()`
untouched) were answered with the plan. These are new.

| Id | Question | Default |
|---|---|---|
| **YQ8** | The book: "You can raise **these** up to your Max Starting Rank with Character Points", where *these* are the Bloodline or Origin powers just granted. Decision 215 lets CP raise an **Innate** power too. Can CP raise an Innate power at creation? | **Yes, any held, ranked power, Innate included** (215's reach kept, only the cap moves). An Innate power is held at rank 1 like a granted Bloodline one, and the book names no other cap for it. The other reading leaves a Heroic Vampire's 10 or so CP with one fewer place to go. Ken is the book's author: if "these" was meant narrowly, say so and the order builds that (§3's bracket) |
| **YQ9** | Each Base Power row is a stepper today. Under the new rule its `+` stops at 1 on every row, and the number shown is only ever 0 or 1. Keep the stepper, or make it a **Take / Taken** toggle? | **Keep the stepper.** It's the control the wizard and Admin share, its keys and announcements are tested, and the row's pill says "rank 1". A toggle is a UI rework this rule doesn't need: it changes every `bp|` selector in four smoke tests. If the stepper reads as broken in the preview, the reviewer says so and Ken decides then |
| **YQ10** | A **Werewolf's Max Starting Rank is 1 at Heroic** as well as Street, so at both levels CP raises no Origin or Innate power. The plan named Street only. Build the table as printed? | **Yes, as printed.** The CP goes to stats, skills and Advantages, as YQ1 said of Street. If Heroic's 1 is a typo in `0414`, it's a `crb-catch-up.md` item, not this order |
| **YQ11** | The wizard's error for a draft made under 215 (two Base Powers in one power). Draft: *"Shadow Play has 2 Base Powers. One takes it at rank 1: take 1 back, and raise it with CP."* (The "raise it with CP" clause only where Max Starting Rank is above 1.) | **The draft**, marked for Ken's voice pass in the PR. It's tool voice (the player is stuck): it names the power, the rule and the fix |

## 5. The assumption sweep

Each row grepped on `508389c`. "After" is what's true once Y4 is built. **Text rows** (marked ✎) are the
sentences that describe what this order moves (Y1's lesson): every one is rewritten in §9.

| Changed | Today, where | Readers (grepped) | After |
|---|---|---|---|
| `basePowerState` row `cap` | min(Max Starting Rank, printed) (engine.js ~3873) | `placeBasePower` (~3888), `spendable("basePowers")` (~5157), `validate` "archetype" (~5296–5305), the wizard's `basePowersHtml` (wizard.js 435: the stepper's `up` and the row's pill), Admin's copy of the same block (sheet.js 1864, binder 4059) | **1** for every row, ranked or not. The state's own `cap` (the Max Starting Rank) stays, for the copy |
| `placeBasePower` second placement | allowed to the row cap | the wizard's `bp|` stepper (wizard.js 1201), Admin's (sheet.js 4062) | refused: "*<name>* is yours already: a Base Power takes a power once, at rank 1." Taking back never refuses (unchanged) |
| `powerCpState` `cap` | min(Max Power Rank, printed) (engine.js ~3925) | `buyPowerRank` (~3937), `spendable("cp")` (~5170), `validate` "character-points" (~5362–5367), the CP step's Powers rows (wizard.js 626) | min(`dataPath(ch, powersBought.maxRankBy)`, printed). Max Power Rank isn't read here any more. **Disciplines are not this function** (`disciplineCap`, engine.js 952, reads the Arcanist's own `maxRankBy`): untouched |
| `powersBought.maxRankBy` | caps placements | `basePowerState` only | caps start + CP, as the Arcanist's `disciplines.maxRankBy` does. Same key, same path; its meaning follows the book. `rules.test.mjs` 1467 pins the object: unchanged |
| A draft's `basePowers[id]` > 1 | valid up to MSR | `validate` "archetype" (~5304) | an error naming the power (YQ11). Can't lock: `review` collects step errors |
| A draft's `powerCp` past MSR | valid up to MPR | `validate` "character-points" (~5367): "*<name>* is rank N. It can start at C at most." | the same message, now at the MSR cap. **No new copy** |
| A locked character's ranks | start + CP + IPE (`archetypePowers`, ~3774) | the Character tab, Progression's Raise, print, Main's rows | **unchanged**: computed from what's stored. No reader runs `validate` on a locked sheet (wizard.js only) |
| Admin's Base Powers on a locked character | stepper up to MSR | sheet.js 1864 (`basePowersHtml(ch, a)`), binder 4059 | a row placed 2 under 215 shows **2** with `+` disabled and `−` enabled; taking one back can't be put back except by Undo. Expected, not a stop; the reviewer checks it in the preview |
| `migrate()` | clamps `basePowers` to whole counts ≤ `ip.rankCap` (~4803) | every load | **unchanged.** No step, no schema bump |
| ✎ The Bloodline step's note | "One Base Power is one rank. No power starts above rank *C*." (wizard.js 440) | the wizard and Admin | §9's sentence |
| ✎ The Base Power row's pill | "starts at rank *C* at most" / "no ranks" (wizard.js 449) | the wizard and Admin | "rank 1" / "no ranks" |
| ✎ The CP step's comment and caption | comment: "the cap is Max Power Rank … not the lower Max Starting Rank" (wizard.js 623–625); row: "… · cap *C*" | the CP step | the comment says Max Starting Rank; the caption's number is the new cap (no copy change) |
| ✎ `campaignPowerScaling.notes`, Vampire and Werewolf | "Spend your Base Powers on your Bloodline's powers; none starts above your Max Starting Rank." (data 2828, 3121) | the wizard's archetype step (wizard.js 290); **`rules.test.mjs` 1466 and 1470 pin the old sentence** | §8's sentences; the two assertions follow them |
| ✎ The data's comments on `powersBought` | "each is one rank in a power of the Bloodline" (data 2865–2869, 3158–3159) | maintainers only | say a power at rank 1, and cite N |
| ✎ The engine's comments | `basePowerState` ("none above Max Starting Rank"), `powerCpState` ("PQ1: Max Starting Rank binds Base Powers, this binds CP") | maintainers | say Decision N's rule |
| ✎ The Character tab's line | "Base Powers *n* · Max Starting Rank *m*" and "*n* Base Powers to place, on Admin." (sheet.js 585–587) | locked sheet | **still true**: no change. Listed so nobody hunts for it |
| ✎ Admin's spec select note | "…and Base Powers placed in its powers." (sheet.js 1863) | Admin | still true: no change |
| Existing tests | nine encode 215 (§13) | — | updated in the same change as N, each named in the PR |

Nothing outside `engine.js`, `wizard.js`, the two `powersBought` blocks' comments and notes, and the tests
reads these. `grep -rn "maxPowerRank" src/` after the change: the power levels' data, `disciplines.maxRankBy`,
the IP cap text, and nothing in `powerCpState`.

## 6. Read first

- `CLAUDE.md`: constraints 7 (store inputs: `migrate()` writes no rank), 8 (total), 9 (no build-state copy);
  *Change tiers*; *Decisions* (a test encoding an outdated decision is updated with the ledger).
- `SCHEMA.md` §4: Decisions **215** (the rule this replaces in part), **216** (learned powers), **200**,
  **194** (IP in play), **135** (data paths), **68** (game data). INDEX §3, *Archetypes & specialization*.
- `src/engine/engine.js` ~3766–3960 (`archetypePowers`, `isHeld`, `basePowerState`, `placeBasePower`,
  `powerCpState`, `buyPowerRank`), ~5157–5175 (`spendable`), ~5296–5305 and ~5355–5367 (`validate`).
- `src/ui/wizard.js` 282–292 (the scaling notes), 432–457 (`basePowersHtml`), 620–632 (the CP step's Powers).
- `src/ui/sheet.js` 582–588 (Character tab), 1855–1865 and 4040–4064 (Admin).
- `tests/engine.test.mjs` 5443–5500, 5514–5528, 5667–5740, 7906–7925; `tests/smoke-sheet-archetypes.test.mjs`
  592–630, 710–738; `tests/rules.test.mjs` 1440–1471.

## 7. Out of scope

- **IP in play** (Decision 194, 216): Raise and Learn a new power are unchanged.
- **Disciplines** (the Arcanist): their cap is `disciplines.maxRankBy`, a different reader.
- **Custom powers** at creation (Decision 216): rank 1 for a power rank's CP, unchanged.
- **Re-checking a locked character** against creation caps. Locked keeps everything (YQ4).
- **Any `migrate()` step**, and any conversion of a draft's second placement into CP.
- **The Werewolf's Starter Power**: given, unranked, unchanged.
- **Splice, Cursed Evolution, gained Bloodlines** (Decision 223): `playPool`, not `powerPool`; untouched.
- **A Take / Taken toggle**, unless Ken answers YQ9 that way.

## 8. The shapes

**The data.** No key changes. Two `notes` sentences and two comments:

- Vampire `campaignPowerScaling.notes`, the sentence after "Innate powers are yours at rank 1.":
  `Each Base Power takes one of your Bloodline's powers at rank 1, and Character Points raise a power up to your Max Starting Rank.`
- Werewolf: the same with `Origin's`.
- (YQ8 "Bloodline only": `…and Character Points raise those up to your Max Starting Rank.`)
- The `powersBought` comments: "each takes one power of the Bloodline at rank 1 (Decision N); `maxRankBy`
  caps a power's starting rank, CP included."

**The engine.** Two lines, and the copy that follows from them. No new export, no signature change.

- `basePowerState`: each row's `cap` is **1** (`const most = 1;`). The returned `cap` stays the data path's
  value (Max Starting Rank), for the wizard's sentence.
- `placeBasePower`: when `next > row.cap` on a ranked row, refuse with
  `` `${row.name} is yours already: a Base Power takes a power once, at rank 1.` `` (unranked keeps "has no ranks").
- `powerCpState`: `cap = Math.min(dataPath(ch, a.powersBought.maxRankBy) ?? Infinity, printed)`. Nothing else
  in it moves; with YQ8 "Bloodline only", filter out rows where `isGranted(a, p)` too.
- `validate("archetype")`: the over-cap line for a ranked row becomes YQ11's sentence:
  `` `${r.name} has ${r.placed} Base Powers. One takes it at rank 1: take ${r.placed-1} back${bps.cap>1?", and raise it with CP":""}.` ``
  The unranked line ("has no ranks. Place one Base Power in it.") is unchanged.
- `validate("character-points")`: unchanged code; its cap is the new one.

Totality: `powerCpState` on a character with no power level, or a scaling row missing `maxStartingRank`, gets
`Infinity` from the path and caps at the printed maximum, never `NaN`. `basePowerState` is unchanged in what
it returns for an archetype that doesn't buy (`null`).

**`migrate()`:** no change, no step.

## 9. The UI

Behaviour first. No new control, no new styled block (YQ9's default).

**The Bloodline step** (`basePowersHtml`, wizard.js 435; Admin renders the same function):
- The note: `Your Innate powers are yours at rank 1. Each Base Power takes one of your ${noun}'s powers at rank 1.`
  then, when the state's `cap` > 1: `Raise them with CP on the Character Points step, up to rank ${cap}.`
  and when it's 1: `At this Power Level, CP raises no power: every one starts at rank 1.` then the
  existing `<em>${spent}/${count} placed.</em>`.
- Each row's pill: `rank 1` for a ranked power, `no ranks` as now.
- The stepper's `+` is disabled once a power holds a Base Power (the row's cap is 1), and while none are left.

**The Character Points step** (wizard.js 626): rows and caption as now; the cap shown is the new one. Where
`powerCpState` returns rows that are all at their cap (Street), the rows still show, every `+` disabled,
so the player sees why. **Report it if** the empty-looking section reads as broken in the preview.

**Admin** (sheet.js 1864): the same block. A locked character placed 2 under 215 shows 2, `−` enabled, `+`
disabled. No new copy.

**Where things land:**

| Press | What changes | Where the record lands | Focus |
|---|---|---|---|
| Bloodline step `+` on a power | `basePowers[id] = 1`; the row's `+` disables | the step re-renders, `spent/count` moves | stays on the stepper, as `announceStep` does today |
| `+` again (only reachable through the engine) | refused, nothing written | — | — |
| Bloodline step `−` | the placement and any CP on it go (unchanged, ~3897) | as today | as today |
| CP step `+` on a power at its cap | disabled | — | — |
| Admin `+`/`−` | one logged commit, as today | Activity Log "Admin: Base Power on/off *id*" | as today |
| Opening a draft placed under 215 | nothing | the archetype step shows YQ11's error; Continue/Lock refuse as for any error | — |

**Copy:** the note, the pill, the refusal and YQ11's error are tool voice (`VOICE-APP.md`: the player is
stuck or choosing). The data's notes sentence is reference copy. Mark YQ11's for Ken's voice pass in the PR.

## 10. Worked examples, as named tests

Write these first and show each failing on `main` (or say why it already passes).

**`tests/rules.test.mjs`**, after *"R16: …the Vampire's Campaign Power Scaling…"* (~1471):

1. **`CRB 0413, 0414: a Base Power takes a power at rank 1, and CP raises it only to Max Starting Rank`**.
   Assert each book's sentence: `/You then are granted a number of Bloodline powers during character
   creation, at Rank 1\. You can raise these up to your Max Starting Rank with Character Points\./` (0413)
   and the Origin one (0414). Assert each data `notes` holds §8's sentence. **Fails on `main`:** the notes.
   Then **replace** the two old assertions at 1466 and 1470 (they pin 215's sentence).

**`tests/engine.test.mjs`**, after *"Decision 215: validate names CP in a power not held…"* (~5740):

2. **`Decision N: a Base Power takes a power once, at rank 1`**. A Heroic Strigoi (3 BP, MSR 2):
   `placeBasePower(ch, "shadow-play", 1)` ok; again → `why` matches `/yours already: a Base Power takes a
   power once, at rank 1/`; `veil-of-night` and `bone-spines` ok; a fourth → "No Base Powers left."
   `basePowerState(ch).rows.every(r => r.cap === 1)`; the state's `cap` is 2. A WCD Upyr: `iron-hide` once,
   then refused (it was ×3 on `main`). **Fails on `main`:** the second placement is ok.
3. **`Decision N: CP raises a held power to Max Starting Rank, not Max Power Rank`**. Heroic Strigoi with
   `shadow-play` placed: `buyPowerRank` +1 ok (rank 2), +1 → `/highest starting rank, 2/`. YQ8 default:
   `bestial-blessings` +1 ok, +1 refused at 2. A Street Strigoi: every `powerCpState` row has `rank === cap`
   (1), and `buyPowerRank(…, "bestial-blessings", 1).ok` is false. A Heroic Trueborn with `apex-fury`: refused
   at 1 (YQ10). A WCD Draugur with `spectral-veil` (printed 3, MSR 3): raises to 3. **Fails on `main`:**
   rank 3 at Heroic, rank 2 at Street. **Assert every refusal's `why`, not only `ok: false`**: a Heroic
   Vampire has about 10 CP, so on `main` the second Bestial Blessings press is refused too, for "No Character
   Points left". Only the message tells the cap from the budget (the cap is checked first, engine.js ~3946).
4. **`Decision N (YQ4): a draft placed under Decision 215 is refused by name; a locked one keeps its ranks`**.
   A Heroic Strigoi draft with `basePowers: { "shadow-play": 2 }`: `validate("archetype")` has exactly
   `"Shadow Play (Masked) has 2 Base Powers. One takes it at rank 1: take 1 back, and raise it with CP."`
   (use the data's display name), and `validate("review")` has an error. With `powerCp: { "bestial-blessings": 2 }`:
   `validate("character-points")` has `"Bestial Blessings is rank 3. It can start at 2 at most."`. The same
   two maps on a **locked** copy put through `Engine.migrate`: `basePowers` and `powerCp` exactly as stored,
   `archetypePowers` gives `shadow-play` rank 2 and `bestial-blessings` rank 3. A Street draft placed 2: the
   sentence has **no** ", and raise it with CP". **Fails on `main`:** no error at Heroic for 2.

**`tests/smoke-sheet-archetypes.test.mjs`**, after *"Decision 215: a Street Strigoi's Bloodline step…"* (~738):

5. **`Decision N: a Heroic Strigoi's Bloodline step takes each power once, and the CP step raises one to rank 2, no further`**.
   `onArchetypeStep("vampire", "heroic")`, pick Strigoi. The note matches `/Each Base Power takes one of your
   Bloodline's powers at rank 1\. Raise them with CP on the Character Points step, up to rank 2\./`. Click
   `bp|shadow-play|1`: its `+` is disabled, its pill says `rank 1`, and `bp|veil-of-night|1` is still enabled.
   Then `onStep(…, "character-points")` with `shadow-play` placed: click `apow|shadow-play|1`, and its `+` is
   disabled at rank 2. `app.errors` empty on both.
6. **`Decision N: a Street Vampire is told CP raises no power, and a locked Vampire placed under 215 keeps rank 2 on Admin`**.
   `onArchetypeStep("vampire", "street")`, Strigoi: the note matches `/At this Power Level, CP raises no power/`
   and **not** `/Raise them with CP/`. Then `lockedVampire()` (smokekit: Heroic Draugur), with its
   `basePowers` set to `{ "battleborn-instinct": 2 }` so **one Base Power is left** (smokekit's own fixture
   spends all three, and then every `+` is disabled for that reason alone, hiding the mutation below). Opened
   on Admin: `bp|battleborn-instinct|1` is disabled, `bp|battleborn-instinct|-1` and `bp|odins-aegis|1` are
   enabled, and the Character tab still shows Battleborn Instinct at rank 2. `app.errors` empty.
   **Fails on `main`:** the Street note. The locked half **passes on `main` by design**: it guards that Y4
   takes no rank from a locked character.

## 11. Tests beyond the examples

- **The nine expected breaks** (§13): update each to the new rule in the same commit as Decision N. Keep each
  test's **name** true: rename one whose name states 215's rule (e.g. *"…to Max Power Rank or the printed
  max…"* → *"…to Max Starting Rank or the printed max…"*). List every rename in the PR.
- **Decision 218 / 162's probe** (engine.test ~7906) moves from a Street to a **Heroic** Strigoi, so a power
  rank is still buyable. Check its second half still reaches "nothing left to buy".
- **Totality:** `powerCpState` with no power level, and with a scaling row whose `maxStartingRank` is deleted:
  no throw, caps at the printed maximum. Fold into example 3.
- **Hostile:** nothing new reaches the engine. `hostile.test.mjs` 50–51 already poisons `basePowers` and
  `powerCp`. Confirm it passes with no edit.
- **Voice:** `voice.test.mjs` scans the data notes. Confirm it passes.
- **Mutation-test** each new guard, and record each in the PR:
  - example 2: put `most` back to `min(cap, printed)` (fails);
  - example 3: put Max Power Rank back in `powerCpState` (fails); with YQ8's default, filter Innate powers out
    (the `bestial-blessings` line fails);
  - example 4: drop the `bps.cap>1` clause (the Street half fails);
  - example 5: restore the old note sentence (fails);
  - example 6: make Admin's `+` ignore the cap (fails).
  Check each for a second path that would keep it green: example 2's `rows.every(cap === 1)` and its
  refusal both see the first mutation, so break each separately.

## 12. Steps

1. Branch from `main`. `git submodule update --init private`. `npm run test:fast` for the baseline.
2. Write examples 1–6, run them on `main`'s code, and record which fail and how.
3. The engine and the data (§8). `npm run test:fast`. Examples 1–4 pass; **the nine in §13 fail**: update
   each (§11), and Decision N with its marks (§3) in the **same commit**.
4. The UI copy (§9). `npm run verify`. All six pass.
5. Mutation tests (§11), each recorded.
6. **Dev preview** (`shadows-dev-preview`). Every step is a click, with a screenshot each. To get a draft on a
   step, run in the page's console, then reload and click **Resume draft**:
   `const s=SHADOWS_DATA.creationFlow.steps.map(x=>x.id), ch=Engine.newCharacter(); ch.identity.name="Y4"; ch.identity.archetype="vampire"; ch.creation.powerLevel="heroic"; ch.creation.rolls={statPoints:40,skillPoints:30,credits:1000}; for (const k of Object.keys(ch.stats)) ch.stats[k].base=8; localStorage.setItem("shadows.draft.v1", JSON.stringify({ch, step:s.indexOf("archetype"), maxReached:s.length-1}))`
   (Y1's review found a draft seeded without `creation.rolls` throws on the Stats step: keep them.)
   - **Heroic Vampire**: pick Strigoi, place three Base Powers in three powers; each `+` disables after one.
     Read the note. Go to Character Points: raise one power to 2, and its `+` stops.
   - **Street Vampire** (change `"heroic"` to `"street"`): the note says CP raises no power; the CP step's
     Powers rows all have `+` disabled. **Report it if** that section reads as broken.
   - **A 215 draft**: seed `ch.archetypeChoices.specialization=["strigoi"]; ch.archetypeChoices.basePowers={"shadow-play":2}`
     at Heroic: the archetype step shows YQ11's error, and Continue refuses.
   - **A locked Vampire placed 2** (`shadows.active.v1`, as Y1's §12 did, with `creation.locked = true`):
     Admin shows 2 with `+` disabled; the Character tab shows rank 2.
   - **Both themes:** Y4 adds no styled block. If the build added one, measure its text contrast in both
     themes (`data-theme="light"` on `<html>`) and put the numbers in the PR. **Report it if** you added one.
   - **Phone width** (`resize_window` mobile): the Bloodline step's note and rows fit; `scrollWidth <= clientWidth`.
   - Click by `ref` from `find`; a screenshot frame lags a click, so take a second one if it looks stale.
7. `npm run phone-check`. `main` is over budget at "phone, phone, touch" (Main's fold, 311 px and 297 px, as
   Y1's review measured). Report only a row that got worse.
8. Close out (§14), then **`npm run verify` on the final commit**, and open the PR.

## 13. Stop and ask

- Any test fails after step 3 or 4 that isn't one of the nine below, or the two notes assertions.
- `0413` line 48 or `0414` line 50 isn't word for word what the pre-flight quotes (the mirror moved).
- A way to build this that needs a schema bump, a `migrate()` step, or an archetype id in code.
- `rules.test.mjs`'s `powersBought` assertion (~1467) fails: the order keeps the object as it is.
- **Not a stop** (expected; update each, §11):
  - `engine.test.mjs`: *"Decisions 200, 215: Base Powers place one rank each…"* (5443), *"Decisions 200,
    215: validate warns of unplaced Base Powers…"* (5474), *"Decision 215 (F41): Built to Last is no choice…"*
    (5514; it places Iron Hide twice), *"Decision 215: CP raises a granted and a bought power…to Max Power
    Rank…"* (5667), *"Decision 215: a buy CP can't cover is refused…"* (5708), *"Decision 215: validate names
    CP in a power not held and a rank past the cap"* (5728; its message's cap moves to 1 at Street), *"Decision
    218 / 162: a buyable power rank still counts as CP…"* (7906; Heroic now).
  - `smoke-sheet-archetypes.test.mjs`: *"crb-v4-sync P4: the Bloodline step offers three…"* (592; Odin's
    Aegis placed twice), *"Decision 215: a Street Strigoi's Bloodline step…"* (710; the note's sentence and
    "CP passed Max Power Rank 2").
  - `rules.test.mjs` 1466 and 1470: the notes sentence.
  - The version literals your bump moves.
  - `engine.test.mjs` *"208: a search over 200 members and 100 sessions is quick"* failing on timing while
    the preview runs, **if it passes run alone** (`node --test --test-name-pattern="a search over 200" tests/engine.test.mjs`).

## 14. Close-out

The **close-the-session** skill, at the Rule or shape tier:
- **CHANGELOG**, under `[Unreleased]`, player voice, then `npm run changelog`:
  - "**Vampire and Werewolf powers at creation follow the book:** each Base Power takes one Bloodline or
    Origin power at rank 1, and Character Points raise a power up to your Max Starting Rank. A character
    you've already locked keeps every rank it has; a draft that placed two Base Powers in one power asks you
    to move one."
- `npm run bump -- <the next minor>`; `gamedataVersion` 0.47. **`README.md`'s status line** moves with them.
- **Decision N** in SCHEMA §4 with the 215 marks and the INDEX lines (§3).
- **The plan:** Y4's row says *built, PR #…*; §1's `0413` and `0414` rows say ✅ Y4.
- **STATE:** the versions line; §5's *Where to start* (Y4 built; Y3, the close, is next). Rebase first if the
  CRANK PR moved STATE.
- A `docs/log/2026.md` entry and a `docs/log/shipped.md` row, both naming the PR number.
- **PR title:** `Y4: Vampire and Werewolf powers at creation, as 0413 and 0414 print them (app X.Y.0, data 0.47)`.
- **PR body:** *Big picture*, *What changed*, *Evidence* (every claim names its command or test; the examples
  failing on `main`; each mutation; **each of the nine updated tests, by name, with what changed**), *Dev
  preview* (the screenshots), *Voice pass* (YQ11's error), *Where the order didn't fit*.

### Review checklist

For the reviewer, beyond the suite passing:
- [ ] Re-run the prototype yourself: on `main`, change only §8's two engine lines and run `npm test`. The
      failures are exactly §13's nine. Any other is a reader this order missed.
- [ ] Each of the nine updated tests still tests what its name says, and no assertion was simply deleted.
- [ ] Every ✎ row in §5 reads the new rule in the preview, **and no other sentence in the wizard, Admin or the
      Character tab still describes Base Powers as ranks** (`grep -rn "Base Power" src/`).
- [ ] The CP cap is Max Starting Rank for an Innate power too (YQ8's answer), and Disciplines still cap at
      Max Power Rank (an Arcanist on the CP step).
- [ ] `migrate()` untouched (`git diff main -- src/engine/engine.js` has no line inside `migrate`); a locked
      Vampire placed 2 round-trips and shows rank 2.
- [ ] Decision N's 215 marks in SCHEMA and INDEX. Versions: app minor, data 0.47, README's line. CHANGELOG
      line, `npm run changelog` run.
- [ ] **Each "Report it if" above has an answer in the PR**: the Street CP section (§9, §12), a new styled
      block (§12). "Nothing to report" is an answer; silence isn't.
- [ ] Every new guard was mutation-tested and the PR records the run.
- [ ] The final `npm run verify` is on the PR's final commit.

## 15. Handing it over

The building session's prompt is the README's, titled **Y4 build**. Its traps, under the prompt:
- **Two engine lines, nine tests.** The rule is small; the work is the tests that encode 215. Update them, don't
  delete them, and keep each name true.
- **`maxRankBy` keeps its key.** It moves from capping placements to capping start + CP. Don't add a key and
  don't touch `disciplines.maxRankBy`.
- **Sweep the sentences.** Every ✎ row in §5 is a sentence about the old rule. Y1 shipped one that pointed at a
  control that had moved.
- **No `migrate()` step.** A draft's 2 stays a 2 until the player fixes it (YQ4).
- **Preview by clicking**, and answer every "Report it if" in the PR.
- **Verify last.** The final `npm run verify` runs on the commit the PR ends on.

The reviewer's prompt is the README's, with PR #… and this order's path.
