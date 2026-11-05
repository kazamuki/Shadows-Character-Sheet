# Plan — Powers that run

**Status:** **drafted 2026-11-05 by Claude (Opus)**, from W110 and W132. Ken approved the idea in the W143
conductor session ("I like the idea, so lets draft the plan"). Pre-flighted against `main` at `377c2ce` (PR #292
merged: app 0.61.0, released 2026-11-05 in #294, game data 0.52, character schema 0.32). **Not approved yet:** Ken approves this
plan and H1's questions (`powers-that-run/H1-sustained-powers.md` §4) before anything is built.
**Tier of this document:** *Docs*. H1, H2 and H3 are each *Rule or shape*.

Ken's wishes, together:

- **W110** (Ken, from P11's PQ2): a sustained power is marked active, and Turn Reset charges it.
- **W132** (Ken, from P21's pre-flight): powers that answer a hit, or heal, while they run.

Sessions are `H1`… (H for Held, as a power is held running). Questions are `HQ`_n_. *Not R*, as the conductor's
brief had it: `R`_n_ is already the 2026-09-24 audit's Recommended practices (R1–R13), and the rules tests use
R14–R16 as tags. A second R1 would make every search for one return the other.

---

## 1. What it must respect

- **Store inputs, compute everything else** (constraint 7). What's stored is *which* powers are running, nothing
  derived: no cost, no armor, no healing. Every number is read from the power's data and its rank each time.
- **The engine is total** (constraint 8) and **a file is untrusted** (constraint 10). `migrate()` keeps only
  well-formed entries; every reader ignores an entry it can't place (a power no longer held, an id from a hand
  edit), as `heldSpells` does (Decision 224).
- **No archetype or power id in code** (Decision 135). Which powers can run, what each costs and when, and which
  ones need a form, are data. "Rank + 2 per round" becomes numbers, and the `cost` text stays for the page.
- **The player owns the character** (W29, Decision 256). A GM's read-only sheet shows what's running and can't
  change it. A GM's encounter never writes a seated character.
- **The sheet never blocks a spend** (Decision 225). Past Rate of Use it warns. A cost the pool can't pay is a
  different case (§2.4).
- **Nothing drops on its own unless the book says so** (Decision 224, Deighton's Q19). The player stops a power.
  The exceptions are the ones `0414` prints (§2.4).

## 2. The shared design: "running"

This section is the plan. H1 builds all of it. H2 and H3 only read it, and add data.

### 2.1 What the book says

- `APPROVED_Vampire_and_Werewolf_rebalancing` (the reasoning behind `0413` and `0414`) prints four kinds of cost:
  **Flat** ("1 SFR"), **Rank** (SFR equal to rank), **Signature** (rank + 2), and **Sustained**: "Pays its
  cost again every round it stays active. Outside an encounter, it costs once per scene."
- `0414:180` (fresh, 2026-11-04): "every Innate and Origin power works only in Werewolf Form, except CyberWolf
  Protocol. … no single power can cost more than your RoU. Sustained powers pay their cost again each round;
  outside an encounter, they cost once per scene." `0413` prints no form rule and no RoU ceiling per power.
- So "Rank, sustained" (Let It Loose) is rank SFR **each round**, the same as "Rank per round, sustained".

### 2.2 What's stored

`trackers.running`: a list of `{ id }`, one per power the player started, in the order they started them.
Character schema N (0.32 → 0.33 at the pre-flight).

- **An object, not a bare id**, so H2 can add Null Field's absorbed amount (`{ id, used }`) in the schema bump it
  needs anyway (Elemental Blood's and Battle Hardened's saved picks) without reshaping the list again.
- **On `trackers`**, beside `heldSpells` and `sfr.turn`: play state, like Decision 224's hold, and for the same
  reason it rejected `held: true` on the Grimoire row. It isn't what the character *is*.
- `migrate()` keeps objects whose `id` is a string, each id once, at most 20, 120 characters each (`heldSpells`'s
  rule). It deletes nothing it can read. The readers decide what counts.

### 2.3 Which powers can run, and what they cost

A power that can run carries `run` in the data, beside its `cost` text:

```js
"run": { "sfr": { "perRank": 1, "plus": 2 }, "each": "round" }   // Blood of Valhalla: Rank + 2 per round, sustained
"run": { "sfr": { "plus": 2 },              "each": "round" }   // Preternatural Speed: 2 SFR per round, sustained
"run": { "sfr": { "plus": 3 },              "each": "start" }   // Red Mist: 3 SFR, then it runs (H2)
```

- `sfr` is `perRank × rank + plus`, the power's rank as `archetypePowers` reads it (placements, CP and IP).
- `each: "round"` is **Sustained**: paid on Start and again at every Turn Reset. Outside a fight nobody presses
  Turn Reset, so it costs once per scene, which is the book's rule, with no encounter to detect.
- `each: "start"` is paid once on Start, and then the power runs until stopped (Red Mist's minute, Null Field
  until used up, Bestial Blessings until dismissed). **H1 builds only `"round"`.** H2 and H3 add `"start"` rows
  as their powers need them, as data, with no change to the store.
- **H1's rows** (every sustained cost in the data, listed by script at the pre-flight): Preternatural Speed,
  Veil of Night, Iron Hide, Cold Embrace, Blood of Valhalla, Spectral Veil, Let It Loose. Seven.
- `cost` stays as the book's words for the page and print. A test checks that every `run` agrees with its `cost`
  text, by the four kinds, so the two can't drift.

### 2.4 Who sets it, and what ends it

| Event | What happens to a running power | Where |
|---|---|---|
| **Start** (the player) | Added to `running`; the first payment is charged through the SFR tracker's one writer, so it counts against this round's Rate of Use. A power costing more than the RoU warns too, where the archetype's data names that limit (the Werewolf, `0414:180`; HQ7). Past RoU it warns (Decision 225) and still starts | Character tab power card; Main's SFR popover |
| **Stop** (the player) | Removed. No refund | The same two places |
| **Turn Reset** | Each `"round"` power is listed with its cost, kept by default, with **Stop** a tap away (Decision 189's "runs out" row, on the player's side). Apply zeroes the round, then charges the kept ones into the new round | Main's Turn Reset panel (the SFR popover's Turn Reset opens the same one) |
| **The pool can't pay at Reset** | It stops, and Reset says so ("Iron Hide stops: it needs 3 SFR, 1 left"). Today nothing stops a spend: the SFR tracker doesn't clamp `spent` (it has no `stepsFrom`), so this is a new rule | HQ2 |
| **Leaving a form** a power needs | It stops in the same commit as the shift, and the switch says so (`0414:180`: a Werewolf's Innate and Origin powers work only in Werewolf Form) | Main's Form switch, Decision 195 |
| **Start while out of that form** | Refused, with the form named | — |
| **Log session** | Every running power stops (a session ends every scene) | HQ3 |
| **The power isn't held** (an Admin removal, an undo) | Read as not running; the entry stays until Stop, as a held spell does | every reader |
| **Encounter end** | Nothing: the sheet doesn't know one (W128), and a GM's encounter never writes a seated character | — |
| **Lock, the wizard** | Never set: `running` is empty at lock and the wizard has no Start | — |
| **Going down, Stunned, Incapacitated** | Nothing on its own (Decision 224, Q19). Where a power's text says it ends (Bestial Blessings retracts if stunned), H2 or H3 decides when it gets there | H2, H3 |

Every row that changes `running` is one commit, so one undo takes back the power and its SFR together.

### 2.5 How H2 and H3 read it

One reader, `runningPowers(ch)`: the held powers in `running`, with a `run` the data gives them, in a form they
work in, each `{ id, name, rank, sfr, each, def }`. `isRunning(ch, id)` is that list's test. **Nothing else
decides "running"**, in the same way that `isHeld` is the one test for held (Decision 264).

- **Natural Armor** (H1, Decision 104's `while`): a `while` grant on a running power starts **ticked** on Take a
  hit, on the sheet and on a GM's seat hit (`gm.js:3013`, its twin). The box still unticks for one hit. Iron
  Hide and Icebound Resilience are the two today.
- **The hit** (H2): Spectral Veil and Red Mist's immunity to Physical, Odin's Aegis and Null Field's reductions
  join `resolveHit` at Decision 236's `meleeTaken` stage or beside it, when `isRunning` says so, or as a
  reaction the hit offers (Odin's Aegis is "as a reaction", so it's a press on the hit, not a running power).
- **Healing** (H3): a Turn Reset with Blood of Valhalla running heals rank HL (never Withering), and
  Regeneration heals while the **Form** is on. Regeneration reads `formState`, not `running`: it's a baseline
  trait of the form, not a power with a cost.
- **`whenText` marks stay marks.** Fourteen grants say "while X runs", and nearly all name a second condition
  too ("in darkness within 20 meters", "against your marked target"). Running doesn't make them count, because
  only the table knows the rest. A bare `while` (Natural Armor, movement) is the one condition that running
  answers by itself.

### 2.6 What it never does

- Count a round down. Icebound Resilience's 3 rounds, Monstrous Maw's 1, Battleborn's WILL rounds: the player
  stops them. A countdown is a later wish if a table asks.
- Know an encounter or a scene. W128 is its own plan, and when it lands, `each: "start"` powers that end "when
  the encounter ends" can read it.
- Run a written-in power (`powers[]`, Decision 153). It has no `run` data, and W109 would revisit.
- Run Defiance of Sol (a Vampire Major: "spend 2 SFR per round to take no damage that round"). It's a Major, not
  a power, and sunlight isn't on the sheet. Noted for H2's sweep.

## 3. Sessions

| Session | What | Tier | Waits on |
|---|---|---|---|
| **H1** — W110 | §2 whole: `trackers.running` (schema N), `run` on the seven sustained powers, Start and Stop, Turn Reset charges, the Form ends a Werewolf's, Natural Armor starts ticked. [Order](powers-that-run/H1-sustained-powers.md) | Rule or shape | Ken: this plan, HQ1–HQ4, and the order's questions |
| **H2** — W132, the hit | Odin's Aegis, Null Field, Red Mist, Spectral Veil, Elemental Blood, Silverscar, Battle Hardened; Adaptive Skeleton's Natural Armor 2 (b21). Elemental Blood and Battle Hardened save a pick (schema), Silverscar needs the hit to know silver | Rule or shape | H1 |
| **H3** — W132, healing | Regeneration and Bone and Sinew (the Form), Vitality Surge, Blood of Valhalla, Quick Clot | Rule or shape | H1 |

H2 and H3 don't wait on each other. Each row's book sentence is in `plans/archive/sheet-wishlist/P21-inventory.md`
(c44–c53, b21).

**Adaptive Skeleton (b21) goes in H2, not H3.** It's Natural Armor while it runs, which is the hit's business,
and `naturalArmor` doesn't scan a starter power yet (P21 §7). H2 teaches it to. That fits beside the other armor
work, and nothing in H3 touches armor.

## 4. What this costs to get wrong

- **A charge in the wrong place** spends a player's SFR twice or not at all, and the pool is the Vampire's
  whole economy. One writer: every charge goes through the SFR tracker's `adjustPanelTracker`, so `turn`
  counts it, and Reset's apply is still the only place a round ends (Decision 225).
- **"Running" re-derived in a second place** (a UI check, a hit stage) drifts from the first. H1's review
  checks there's one reader.
- **A power that runs forever.** Nothing ends a power on its own except Reset's unpaid cost, the form, and (HQ3)
  a logged session. If a table finds them left on, the answer is W128, not a timer.
- **The voice.** Start, Stop and the Reset lines are tool voice. The Form's "your powers stop" is the one place
  the city could speak. Ken does the voice pass before merge, from the order's *For Ken* list.

## 5. Questions

**For the plan, each with the default the build takes.** A question left blank is answered "Default"
(`WORK-ORDERS.md`).

| # | Question | Default | Answer |
|---|---|---|---|
| HQ1 | **One store for both kinds** (§2.2–2.3): sustained powers charged each round and activated ones charged once share `trackers.running`, and H1 builds only the sustained kind | Yes. H2 adds Red Mist and Null Field as `each: "start"` rows, as data | |
| HQ2 | **A sustained power the pool can't pay at Turn Reset** | It stops, and Reset says which and why. The alternative, charging what's left and keeping it running, spends SFR the book says it needs in full | |
| HQ3 | **Log session stops every running power** | Yes: a session ends every scene, and a power left on from last week is a surprise. The alternative is that only Stop and Reset end one | |
| HQ4 | **A Werewolf's powers run only in Werewolf Form** (`0414:180`, built in H1: Start refused in human form, shifting back stops them) | Yes, as the book prints it. A Vampire has no form rule (`0413` prints none) | |
| HQ5 | **W144: fold "every power at rank 0 with its own max" into H1's data pass?** | — | **Closed (PR #294): already the design.** Rank is derived from placement + CP + IP. The two `ranked: false` powers can't take maxRank 1, because maxRank caps creation only (Decision 196). H1 doesn't change `ranked` |

H1's own questions are in its order, §4.

## 6. For the book

Questions for Ken about `0413` and `0414`, none of them built. Each goes to `plans/crb-catch-up.md` if Ken wants it
there.

- **Does a Vampire's power have the per-power RoU limit?** `0414:180` prints "no single power can cost more than
  your RoU" for Werewolves; `0413` prints nothing like it. H1 warns only where the data names the limit
  (`powerCostCap`, the Werewolf), so a Vampire's Spectral Veil at rank 3 costing 5 against RoU 4 gets only the
  round's warning every spend gets. If the book means both, it's one data key on the Vampire. My read: it's
  probably meant for both, since the rebalancing sheet gives the two archetypes one cost logic, but that's the
  book's to say.
- **Does a Vampire's power need any state to run?** `0414` ties a Werewolf's to Werewolf Form; `0413` ties
  nothing. Assumed no (HQ4).
