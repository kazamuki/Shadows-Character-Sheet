# Work order S3d — A seat in a fight: a PC row takes the whole hit on a copy of its character

**Plan:** [`../gm-mode.md`](../gm-mode.md): S3d's row in *Still to build*,
§6 *S3b*'s last bullet, and GQ19.
**Status:** **drafted 2026-10-30 by Claude (Opus)**, the S3c reviewer, after
#270 (S3c, Decision 256) merged (`WORK-ORDERS.md`, step 7). **Ken picked this
session (2026-10-30).** Not yet approved.
**Branch:** from `main` at `6e1a799` or later, PR to `main`, switched off
(Decision 173). **No `private/` commit.**
**Cadence:** the three-session loop in [`../../WORK-ORDERS.md`](../../WORK-ORDERS.md).
The conductor (Opus) starts **S3d build** (Sonnet), then a fresh **S3d
review** (Opus) once the PR is open. Builder and reviewer message each other
directly. Anything for Ken goes to the conductor. §15 is the hand-over.
**Runs alone.** It touches:
- `engine.js`: the encounter's hit, Health and Awareness for a PC row, the
  start of a claimed row, the table gate's PC wear, and one new reader,
  `rowCharacter`.
- `gm.js`: the row, its Hit panel, and a route from the row to the read-only
  sheet and back.
- The CSS, the ledger and STATE.

**No schema moves** (§2): the table schema stays **0.18** and the character
schema stays **0.31**. No field is added. The gate stops zeroing three fields a
PC row already has. One decision, **N**.

**Tier: Rule or shape.** A rule changes: how a hit lands on a PC whose name
answers to a seat. A behaviour changes that someone could have chosen
otherwise: where the row's numbers come from. Three decisions are replaced in
part: 188, 191 and 192.

**Carried over from S3c's review** (#270: one fix round with Ken's voice pass
in it, then ready). Each item is marked as the order's, the build's, or the
process's:

- **The order's: nine seat smoke tests encoded the card → seat-page route
  that SQ1 changed, and §13 didn't list them.** The conductor settled it with a
  `seatPage` helper. **Here, §13 lists every test that encodes what this order
  changes, found by grep** (the PC row's armor wear in `hostile.test.mjs`).
  The ones that don't change are listed too, with the reason: they don't seat
  the name.
- **The order's: step 7's CSS was skipped**, because the order named no
  numbers for it. A tab row 172px tall at 390px went out in the first push.
  **Here, every CSS item has a number to meet** (§12 step 7), and E12
  measures it.
- **The order's: INDEX's line kept the pre-voice-pass label.** **Here, §14
  says to re-read the INDEX line and the decision against Ken's voice picks**
  after the voice pass lands.
- **The build's: the Cyborg walk and the contrast check were skipped**, and
  the reviewer did both. **Here, both are in §12's browser step, by name, and
  the PR body must report each one's numbers.** A missing number is a
  should-fix.
- **The build's: uncommitted CSS was wiped by `git checkout` in the mutation
  loop.** **Commit before mutating, and restore a mutated file by copying back
  a saved copy, never with `git checkout`** (§11).
- **Process: Ken's voice pass landed in the same fix round, and that worked.**
  **§9's ✎ strings are named here again.** The builder pastes them into the PR
  as they render, and the reviewer drafts rewrites in its first review.
- **Process: Ken dropped the `panelRows` Fix as Cyborg-only;** it's noted on
  W90 (#271). Not this order's.

**Pre-flight** (`docs/WORK-ORDERS.md`, *The pre-flight*) against `main` at
**`6e1a799`**, 2026-10-30. Every function below was opened and read, and the
probes were run (the script is the review's to re-run, not a fixture). Line
numbers are `6e1a799`'s.

- **How a PC row is "claimed" today: it isn't.** Nothing reads a row's name
  against a seat:
  - `seatFor(t, name)` (`engine.js:7569`) returns the one TAG a typed name
    answers to: the copy's own name or one the seat added, ignoring case and
    spacing. A name two seats answer to returns `null` (probe: Dez and Wren
    both answering to "Dez" → `null`).
  - The encounter's only reader of seats is the PC name field's datalist
    (`gm.js:1843`, test *"255: the encounter's PC name field offers the
    seats' names"*).
  - **So a claim is computed, never stored**, the way 254 reads every typed
    name. Nothing typed is rewritten.
- **A PC row today** (`addParticipant`, `engine.js:8508`): kind `pc`, a typed
  name, and the GM's own `hp`, `levels` and `awareness`, all `null` until the
  GM types them. Probe: a row added as "Dez", with Dez seated and a copy at
  26/30 HP and Awareness 6, reads `total:null`, `awareness:null`. The GM
  types numbers the card already has.
- **The hit, today** (`_resolvePcHit`, `:9035`): what got through, **as the
  player calls it**, on the GM's numbers. No armor, no PROT, no advantages
  (191's *Rejected*: "it would guess their armor and advantages"). Probe: 10
  ballistic on the torso → `through:10`, `damage:10`.
- **Where S10b's math reads a row's numbers:**
  - `_standIn(t, r)` (`:8995`) builds a character for an NPC row: a fresh
    `newCharacter()` with the block's stats, and the row's damage, Massive and
    Conditions copied in (`JSON.parse(JSON.stringify(r.conditions))`). Then
    `resolveHit`/`applyHit` run on it, and `applyEncounterHit` (`:9078`)
    copies damage, Massive, new Conditions (`source`, `rounds:null`) and the
    worn piece's wear back to the row. It returns `null` for a PC.
  - `encounterView` (`:9138`) reads Health off the stand-in (`hlState`,
    `painState`) or, for a PC, `_pcHealth(r)` on the GM's numbers.
  - `_rowCapacity` (`:9024`) is what Heal clamps to (`participantDamage`,
    `:8659`, Decision 220).
  - The Reset reads `r.damage` and `r.conditions` and is generic over kinds.
- **The pipeline on a clone:** `Engine.seatCharacter(t, tag)` (S3c) is
  `migrate(clone(copy))`. Probe: **0.29ms** a call, so a fresh clone per row
  per draw is cheap. It carries the copy's trackers (damage 4, Bleeding).
  - On it, `resolveHit` refuses a covered hit with no PROT roll (*"Enter the
    PROT die you rolled."*, `:1589`): **a player's armor rolls, an enemy's is
    static** (191, 053).
  - With PROT 3, 10 ballistic on the torso of Dez in a Reinforced Denim Vest
    (PROT 1d4, RES 4, INT 10, filed at 1 lost): 7 absorbed, **3 through**,
    damage 4 → 7, HP 26 → 23, one Health Level lost, Bleeding offered.
  - 5 with PROT 1 is soaked: 0 through, the vest's wear **1 → 2**.
- **The gate strips a PC row's armor wear on every load** (`_encounters`,
  `:8312–8315`): `armorLoss = pc ? 0 : …`, `scrapped = !pc && …`,
  `armorId = !pc && … : null`. Probe: a PC row with wear 3 on the vest, saved
  and re-gated → `0, false, null`. **Wear on a claimed row would vanish at the
  next load or undo** unless the gate changes.
- **Only one worn body piece takes a hit** (`armorState`, no layering, 98
  CQ7; head and hand pieces track no Integrity, `armorPiece`, `:1402`). So the
  row's existing `armorId`, `armorLoss` and `scrapped` hold a PC's fight wear
  as they hold an NPC's. **No new field is needed.** A custom piece has no
  `id`: §8 keys it `custom`.
- **`applyHit` writes more than the row keeps:** Withering bookkeeping, a held
  spell's prompt (F43), Natural Armor ticks. The NPC path already drops
  Withering (*"an encounter has no downtime"*, `:9077`). A clone makes the
  drop safe: whatever the row doesn't take stays on a throwaway object.
- **The Hit panel** (`encHitHtml`, `gm.js:2847`) for a PC asks *"Got
  through"*, with no AP toggle. Its preview's NPC branch (`encHitPreview`,
  `:2799`) reads `res.armor.piece`, which `encounterArmor` gives and
  `resolveHit`'s own `armor` doesn't have (probe: `resolveHit`'s armor keys
  are `source, name, prot, res, integrityBefore, integrityAfter,
  integrityMax, compromised`). And it prints `D.armorRules.enemyText` for an
  NPC's piece. **A claimed row needs the sheet's own words** (the player's
  Take a hit, `hitPanelHtml`, `sheet.js:1052`): PROT roll, AP, *From a
  spell*, melee (`hitAsks`), Natural Armor ticks.
- **The twins of a PC's Health:** the row (`encHealthHtml`, `gm.js:2759`); the
  card (`seatView` → `_copyView`, `engine.js:7666`, as filed); the read-only
  sheet (S3c, as filed); the wrap-up (`encounterWrapUp`, `:8875`: PC rows go
  to `crew` and `hit` only, with no Health); the Reset (row names and ticks).
  **The card and the read-only sheet stay as filed**: a copy is never written
  (§5's twins row).
- **A route back to an encounter exists** for a cast member (`S.backEnc`,
  `gm.js:1090`: the member's Back returns to the encounter, focus on the row's
  name). The read-only sheet's Back (`seatBack`, S3c) always lands on the
  Players tab.
- **Versions:** table schema 0.18, character schema 0.31 (probe).
- **The ledger**, searched by name in its *Touches* lines and text: *PC
  row*, *stand-in*, *armorLoss*, *armorId*, *armor wear*, *Shock*, *At Zero*,
  *Natural Armor*, *protRoll*, *participantDamage*, *hlState*, *seatFor*,
  *answers to*, *backEnc*, *encounterView*, *resolveEncounterHit*,
  *applyEncounterHit*, *GQ19*.
  - **188** (*"a PC's row is the GM's scratch copy"*; *Revisit if* "seats
    arrive (S3b: a PC row is claimed by a seat)"),
  - **191** (*"A PC row takes what got through, as the player calls it"*;
    *Revisit if* "seats arrive (S3b: a claimed PC row takes the whole hit on a
    copy of the character, never written back)"), and
  - **192** (*"On a PC row Shock and At Zero are reminders … with nothing to
    answer"*)

  are replaced in part. Cited and not superseded:
  - **193**: *"A PC's wear is on their sheet (100)"*. The wrap-up still tells
    the players the wear die, and the row's wear never carries;
  - **220**: Heal from 0 HP, with no gritty option for rows;
  - **254**: a typed name reads as a seat; its *Revisit if* "S3c or S3d needs
    more of the copy than its file" hasn't happened, since the stand-in reads
    only the file;
  - **256**: its *Revisit if* "S3d shows the GM's scratch hits on the sheet"
    is SQ5's alternative, not its default.

## 1. Goal

When a PC row's name answers to a seat with a copy, the row **is** that
character in the fight. A hit lands through the sheet's own pipeline: their
armor and its PROT roll, their RES and Natural Armor, Shock, Massive, At Zero
and Dying. The row's Health, Pain and Awareness come from the character. The
GM stops typing numbers the card already has. **And nothing the fight does
reaches the seat's copy or the GM's roster**: the player's own sheet is still
the truth, and the player applies the hit there.

**Done when:**
- A PC row named for a seat with a copy reads its HP, Health Levels, Pain and
  Awareness from the copy, with the fight's damage and Conditions (E1, E4).
- A row added under a seat's name starts from the copy as filed (SQ1).
- A hit on it asks for what the player's own Take a hit asks: damage, type,
  kind, where, AP, PROT roll, Natural Armor. It resolves as their sheet would
  (E3, E5).
- Its armor wear persists across hits, a reload and an undo, on the row
  (E5, E6).
- **No hit, Take, Heal, Condition, mark, Reset, End or Undo writes into
  `t.copies`, and no roster key is created** (E7, the guard).
- A name two seats answer to, a seat with no copy, or a seat removed
  mid-fight reads as today's typed PC row, keeps its damage and Conditions,
  and says why (E8, E9).
- The row's name opens the seat's read-only sheet, and its Back returns to
  the row (E10).
- Every guard in §11 is mutation-tested.

## 2. Tier, versions, numbers

- **Tier:** Rule or shape (see the header).
- **App:** no bump (switched off, 173). One line in `changelog-pending.md`.
- **Game data:** **no bump** (68). No data changes.
- **Table schema: unchanged (0.18).** The saved shape doesn't move: `armorId`,
  `armorLoss` and `scrapped` are on every row already. The gate stops zeroing
  them on a PC row and checks them as it checks an NPC's. A 0.18 table from
  `main` has 0, `false` and `null` there, which reads as "no wear yet".
  **Nothing needs a `migrateTable()` step.** If the builder finds a reader
  that breaks on a PC's wear, stop (§13).
- **Character schema, pack schema, ruleset:** unchanged.
- **`private/`:** untouched.
- **Decision:** the next free number, **N** (the ledger ends at 256 on
  `6e1a799`).

## 3. The decision, drafted

Paste it after the last decision, under INDEX §3's **GM mode** heading, and
fill in **Built**. It must stay under 350 words, Touches included (`wc -w`).
It's worded for the defaults; a different answer to an SQ rewords it.

```
N. **A PC row whose name answers to a seat with a copy is that character in the fight: hits run the sheet's pipeline on a fresh copy, and the row keeps the fight, never written back.**
     *2026-10-XX · Ken + Claude · Touches: PC row, claimed row, seatFor, seatCharacter, rowCharacter, stand-in, resolveEncounterHit, applyEncounterHit, encounterView, addParticipant, editParticipant, Hit panel, PROT roll, Natural Armor, armorLoss, armorId, gate, read-only sheet, backEnc, GQ19, Decision 188, Decision 191, Decision 192, Decision 193, Decision 254, Decision 256*
     - **Decided:** A PC row is claimed while its name answers to one seat with a copy (254, read live, never stored). Added under that name, or renamed to it untouched, it starts from the copy as filed: damage, Massive, Conditions, armor wear. After that the fight is the row's. A hit runs `resolveHit` and `applyHit` on `seatCharacter` with the row's numbers over it, taking the player's PROT roll and Passed or Failed. Health, Pain and Awareness read off the same copy. The gate keeps a PC row's wear. The row's name opens the read-only sheet and returns to the row.
     - **Why:** the GM typed numbers the card had, and 191 refused to guess armor the copy now carries. A clone keeps every write off the copy and the roster.
     - **Rejected:**
       - The copy's trackers read live under the row's: a re-import counts the fight twice.
       - A stored seat link: 254 reads typed names; a link goes stale.
       - Writing the fight to the copy: the player's sheet is the truth (GQ19).
       - Static PROT: a player's armor rolls (053 is for enemies).
     - **Replaces:** Decision 188 in part (a claimed row isn't the GM's numbers), 191 in part (it takes the whole hit; the gate keeps PC wear), 192 in part (its Shock and At Zero are answered).
     - **Revisit if:** live sync arrives (§8), S2's dispatch sends the fight to a player, or a fight needs the copy's Withering or held spells.
     - **Built:** switched off (173); PR #…; log 2026-10-XX.
```

**Supersession marks.** Put each mark on the ledger entry **and** on its INDEX
line, both by hand: `docs.test.mjs` doesn't see a missing ledger mark. Add
each as its own line below the entry's existing marks.

- 188: *→ **Superseded in part by Decision N** — a PC row whose name answers to
  a seat with a copy reads that character, not the GM's numbers.*
- 191: *→ **Superseded in part by Decision N** — a claimed PC row takes the
  whole hit through the pipeline on a fresh copy; the gate keeps a PC row's
  armor wear.*
- 192: *→ **Superseded in part by Decision N** — on a claimed row the GM
  answers Shock and At Zero as the player calls them.*

If the ledger search at build time finds another decision this replaces,
stop and ask.

## 4. Questions for Ken

| # | Question | Default | Answer |
|---|---|---|---|
| SQ1 | **Where a claimed row starts.** Added under a seat's name (or renamed to one before anything happens to it), the row takes the copy's damage, Massive levels, Conditions and armor wear as its starting point. After that the fight is the row's, and a re-import doesn't move it. Or start fresh at full Health with nothing on, so the row only ever holds this fight? | **The copy as filed** | |
| SQ2 | **PROT on a claimed row.** The player rolls their armor's PROT die and calls it, and the GM enters it, as on their own Take a hit. Or use the die's average rounded up, as an enemy's static armor (053)? That's faster at the table, but it's not the players' rule. | **The player's roll** | |
| SQ3 | **Shock and At Zero on a claimed row.** The player rolls on their sheet and calls Passed or Failed, and the GM taps it. The pipeline then adds what a failure brings, as for an NPC. Or keep today's reminders, with the Conditions offered as ticks only (192)? | **Passed or Failed** | |
| SQ4 | **The GM's own HP, Health Levels and Awareness fields on a claimed row.** Hidden while it's claimed, and the numbers read from the copy. They come back, still holding what was typed, if the claim is lost. Or keep them visible as an override? | **Hidden while claimed** | |
| SQ5 | **The row and the read-only sheet.** The row's name opens the seat's read-only sheet (the copy as filed), and its Back returns to the row. The sheet doesn't show the fight. Or also put the fight's damage and Conditions on the read-only sheet, as a line above it (256's *Revisit if*)? | **Opens the sheet; the fight stays on the row** | |
| SQ6 | **A row that loses its claim mid-fight** (the seat is removed, the copy goes, or a second seat answers to the name). It keeps its damage, Conditions and wear, goes back to the GM's numbers, and takes hits as the player calls them, with a line saying why it isn't a seat now. Or freeze it, so it takes no hit until it's claimed again? | **Back to a typed PC, with a line** | |

## 5. The assumption sweep

Every reader below was found by grep on `6e1a799`. The last column answers the
three questions for each row: which guards read it, where it renders, and
what text points at it.

| What changes | Today, where | After | Readers and twins |
|---|---|---|---|
| **Which seat a row is** | Nothing; `seatFor` (`engine.js:7569`) is read by the datalist only | `_rowSeat(t, r)`: `seatFor(t, r.name)` when `r.kind==="pc"`, and the seat has a copy; else null, with why (`clash`, `nocopy`, `none`) | `_seatIndex` (`:7549`) makes a clash `null`. **Twins:** Find, crew, the award log and attendance read names the same way (254), unchanged. The wrap-up's `crew` (`:8882`) still lists PC rows by name |
| **The row's start** | `addParticipant` (`:8508`): `damage:0`, `massive:0`, `conditions:[]`, wear 0/`null` | When claimed at add (SQ1), or when `editParticipant` (`:8613`) renames an **untouched** row (not `struck`, damage 0, Massive 0, no Conditions) to a claimed name, the row copies the copy's `trackers.damage`, `massiveLevels`, `conditions` (each with `source:""`, `rounds:null`) and the worn body piece's `id`, `integrityLoss` and `scrapped` | The table's undo diffs the row, so the start is one undoable step with the add. **E2** pins that a touched row renamed keeps its own numbers |
| **The stand-in** | `_standIn(t, r)` (`:8995`) returns `null` for a PC | For a claimed row: `seatCharacter(t, tag)`, with `trackers.damage`, `massiveLevels` and `conditions` **replaced** by the row's. The worn piece's wear is the row's when `r.armorId` names it, else as filed | Read by `_rowCapacity` (Heal's clamp), `encounterView`, `resolveEncounterHit`, `applyEncounterHit`. **Never `_copyOf(...).character`** (mutation 1) |
| **The hit** | `_resolvePcHit` (`:9035`): what got through, on the GM's numbers | A claimed row: `resolveHit(standIn, hit)` with the hit as the sheet's `hitInput` shape (`damage, damageType, category, ap, spell, melee, location, protRoll, natural`). The result carries `seat:true`. An unclaimed PC row: as today | `applyEncounterHit` copies back `damage`, `massiveLevels`, the whole Conditions list (new ones get `source` and `rounds:null`, as the NPC path does) and the worn piece's wear (`armorId` = its `id`, or `custom`). **Withering, held-spell prompts and Natural Armor ticks are dropped** with the clone |
| **The gate on PC wear** | `_encounters` (`:8312–8315`): PC `armorLoss` 0, `scrapped` false, `armorId` null | The same checks as an NPC row's, for every row; `armorId` also takes `custom` | **Expected breaks (§13):** `hostile.test.mjs` *"…a PC keeps only its Massive…"* (`:646–665`) and *"…always null on a PC row"* (`:678–688`). `engine.test.mjs:4796` (the 0.6 step zeroing every row) doesn't change |
| **Health, Pain, Awareness** | `encounterView` (`:9138`): PC → `_pcHealth(r)`, Pain from `painFor`, `awareness:r.awareness` | Claimed: `hlState` and `painState` of the stand-in (the NPC branch), `awareness = skillLine(standIn, "awareness").checkBonus` (it carries the fight's Pain) | **Twins:** the card (`_copyView`, `:7666`) and the read-only sheet stay **as filed**, by design. The row is the fight. E4 pins the row, and that the card doesn't move. `encHealthHtml` (`gm.js:2759`) draws either shape unchanged |
| **The row's view** | `encounterView` row: no seat field | Adds `seat: { tag, name, updated } \| null` and `unclaimed: "clash" \| "nocopy" \| null` (only for a PC row whose name answered to a seat once, i.e. a clash or a copy-less seat; a plain typed name is `null`), plus `armor` from the stand-in's worn piece for a claimed row | `encRowHtml` (`gm.js:2872`), `encArmorHtml` (`:2778`), which reads `a.piece`/`a.stops`: a claimed row gives it the worn piece's name, PROT die, RES and Integrity in a shape it can print (§8) |
| **The Hit panel** | `encHitHtml`: a PC asks *Got through*, no AP; `encHitPreview`'s NPC branch reads `res.armor.piece`; `enemyText` shows for an NPC piece; `encPromptHtml` gives a PC no Passed or Failed | Claimed: *Damage*, AP, *From a spell* (when there's Natural Armor to pierce), melee (`hitAsks`), **PROT roll** (when covered and not Massive), Natural Armor ticks. The preview is the sheet's: what the armor stopped, what got through, Health Levels lost. **No `enemyText`.** Passed or Failed (SQ3) | `armorState`, `naturalArmor`, `hitAsks` on `Engine.rowCharacter` (§8). **Twins:** the player's own Take a hit (`hitPanelHtml`, `sheet.js:1052`) asks the same things in the same words |
| **The GM's numbers** | `pcFields` (`gm.js:2906`): HP and Health Levels inputs; `aware` is an input | Claimed: neither shows (SQ4). Awareness is a number, not a field. Their stored values stay | `editParticipant` still takes them; only the UI hides them |
| **Take and Heal** | `participantDamage` (`:8659`): HP straight on; Heal clamps to `_rowCapacity` | Unchanged for the HP. A claimed row's capacity is the stand-in's `hlState().capacity` | 189, 220: no gritty option on rows, even when the copy has `houseRules.keepDamagePastZero` |
| **The Reset** | `resolveEncounterReset`/`applyEncounterReset` (`:8795`, `:8834`): the row's damage and Conditions | Unchanged: the row holds them | E7 runs a Reset on a claimed row and checks `t.copies` |
| **The wrap-up** | `encounterWrapUp` (`:8875`): PC rows give `crew` and `hit` | Unchanged | It writes interactions only. E7 runs End and checks `t.copies`. 193's wear-die line still goes to the players |
| **A route to the sheet** | A PC row's name is a `<b>` (`gm.js:2878`); `seatBack` (S3c) lands on Players | Claimed: the name opens the read-only sheet (`openSeat(tag)`), with `S.backEnc` set to the encounter. Its Back returns to the encounter, focus on that row's name | `seatBack`; S3c's tab binder clears `S.seatOpen`/`S.seatSheet`; the header's Players tab clears `S.backEnc`. **E10** |
| **The copies and the roster** | Nothing in the encounter reads `t.copies` | Read only, through `seatCharacter` and `seatView` | **The guard, E7**: every encounter writer on a claimed row leaves `JSON.stringify(t.copies)` byte-equal. The smoke twin also checks for no `shadows.char.v1.` key and `S.ch === null` |
| **Text that points at this** | 188, 191, 192; the plan's S3b bullet and S3d row; GQ19's answer; `changelog-pending.md`'s *The hit* (*"An NPC takes a hit the way your sheet does"*); STATE | N; the plan's S3d row → *Built*; GQ19's answer gains *"S3d: a claimed row reads the copy and takes the whole hit, never written back"* | Grep the docs for *scratch*, *got through*, *PC row* and *S3d*. Each hit gets a line in step 10 |

## 6. Read first

- `CLAUDE.md`, whole: constraints 7, 8 and 10; *Decisions*; *Change tiers*.
- `docs/STATE.md`, whole.
- `docs/SCHEMA.md` §4: Decisions **98** (one worn piece), **100** (wear),
  **104** (Natural Armor), **188**, **189**, **191**, **192**, **193**,
  **220**, **254**, **256**.
- `docs/plans/gm-mode.md`: §6 *S3b* and S10, and GQ19.
- `docs/plans/gm-mode/S3c-read-only-sheet.md`: §8 (`seatCharacter`) and §9
  (the routes).
- `docs/VOICE-APP.md`: the row and the panel are tool voice.
- **The code:**
  - `engine.js`:
    - `seatFor`, `_seatIndex`, `seatCharacter`, `_copyOf`, `_copyView`;
    - `addParticipant`, `editParticipant`, `participantDamage`;
    - `_standIn`, `_pcHealth`, `_rowCapacity`, `_resolvePcHit`,
      `resolveEncounterHit`, `applyEncounterHit`, `encounterView`;
    - `_encounters` (the gate), `encounterWrapUp`;
    - `resolveHit`, `applyHit`, `mitigateArmor`, `armorState`, `armorPiece`,
      `naturalArmor`, `hitAsks`.
  - `gm.js`:
    - `encRowHtml`, `encHealthHtml`, `encArmorHtml`;
    - `encHitHtml`, `encHitLiveHtml`, `encHitPreview`, `encPromptHtml`,
      `encHitNew`, `encHitInput`, and the encounter's binder for `[data-ehit…]`;
    - `openSeat`, `seatBack`, `bindReadOnlySheet`;
    - the cast page's Back with `S.backEnc` (`:1090`).
  - `sheet.js`: `newHitForm`, `hitInput`, `hitPanelHtml` (the words and the
    inputs to match).

## 7. Out of scope

- **Writing anything to the copy, the roster or the player's file.** The
  player applies the hit on their own sheet. Sending it to them is S2's
  dispatch.
- **The fight on the read-only sheet or the card** (SQ5's alternative). They
  stay as filed.
- **Withering, held spells (F43), a Death Mark's narrative, and the
  copy's `houseRules`** in the fight: dropped with the clone, as an NPC's
  Withering is.
- **Take and Heal changing.** They stay HP straight onto the row (189, 220).
- **A stored link from a row to a seat**, or rewriting a typed name.
- **NPC rows**, the stand-in for a block, and the Codex.
- **A player's sheet starting or ending an encounter** (W-wish at
  `WISHLIST.md:193`): not taken up, so its *Plan* line doesn't change.
- **The table's frame.** GM mode still sits in the wizard's three-column
  grid (`.app`, `shadows.css:65`), with `main` capped at 920px (`:127`);
  only the player's sheet escapes it (`.sheet-mode`, `app.js:179`). The fix
  is the **Layout pass**, its own order after this one (the plan's *Still to
  build*). Don't touch `.app`, `main`'s cap or `sheet-mode` here.
- **Anything in `private/`.**

## 8. The shapes

**Engine. No new stored field.** New internal helpers, plus one new export:

```js
// The seat a PC row's name answers to, with a copy; why not, when its name answered to a seat once.
_rowSeat(t, r) → { tag } | { tag:null, why:"clash"|"nocopy"|null }
// A claimed row's character for the pipeline: seatCharacter with the row's fight laid over it (Decision N).
_seatStandIn(t, r) → character | null
// The same, exported for the Hit panel's questions (armorState, naturalArmor, hitAsks). A fresh object every call.
rowCharacter(t, encId, rowId) → character | null
```

| `rowCharacter` input | Returns |
|---|---|
| a running or planned encounter, a claimed PC row | a fresh character: the copy, migrated and cloned, with the row's damage, Massive, Conditions and worn-piece wear |
| an NPC row, an unclaimed PC row, an ended encounter's row | `null` (an ended encounter takes no hit) |
| `null`, `{}`, a string, an unknown encounter or row | `null`, never a throw (constraint 8) |

**The overlay** (`_seatStandIn`):
- `ch = seatCharacter(t, tag)`; if `null`, return `null`.
- `ch.trackers.damage = nonNegInt(r.damage)`
- `ch.trackers.massiveLevels = nonNegInt(r.massive)`
- `ch.trackers.conditions = clone(r.conditions)` (their `source`, `rounds`
  and `note` ride along; `addCondition` and the readers ignore them).
- The worn body piece (`armorState(ch).worn`): when `r.armorId` equals its
  `id`, or equals `"custom"` and it's custom, its `integrityLoss` is
  `r.armorLoss` and its `scrapped` is `r.scrapped`. Otherwise it reads as
  filed.

**The hit input** for a claimed row is the sheet's `hitInput` shape:
`{ damage, damageType, category, ap, spell, melee, location, protRoll,
natural, from }`. The result is `resolveHit`'s, plus `seat:true` and `from`.

**`encounterView` row**, for a PC row:
- `seat: { tag, name, updated } | null`
- `unclaimed: "clash" | "nocopy" | null`
- for a claimed row, `armor` in the shape `encArmorHtml` prints:
  `{ line, piece:{ name }, stops:null, die, res, integrity, integrityMax,
  compromised, scrapped }`.

  The builder may reshape this. The behaviour is §9's line.

**The gate:** every row's `armorLoss` is `wholeOrZero`, `scrapped` is
`=== true`, and `armorId` is an id string, `"custom"`, or `null`, whatever
its kind.

**UI state:** none new. The route reuses `S.backEnc`, and S3c's
`S.seatOpen` and `S.seatSheet`.

## 9. The UI

**A claimed row** (in place of today's PC row; everything not named is as
today):
1. The name is a button that opens the read-only sheet (SQ5). Beside it, the
   `PC` tag.
2. One line under the name: ✎ *"From Dez's sheet · file from <date>"*, the
   card's date words as shipped.
3. Health is `encHealthHtml`'s line as for an NPC: *HP 23 / 30 · 7 taken · 4
   of 5 Health Levels*, and the Pain tag.
4. Awareness is a number, not a field. HP and Health Levels show no fields
   (SQ4).
5. The armor line: ✎ *"Reinforced Denim Vest · PROT 1d4 · RES +4 · INT
   8/10"*, with *Compromised* or *Scrap* as `encArmorHtml` prints them.

**An unclaimed PC row whose name answered to a seat** shows one line:
- ✎ *"Dez and Wren both answer to this name, so it counts as neither."* (a
  clash; S3b's clash line as shipped, if it fits word for word, else drafted);
- ✎ *"Dez has no copy at this table yet. Import their file to read it here."*
  (a seat with no copy).

**The Hit panel on a claimed row** asks what the player's Take a hit asks, in
its words:
- *Damage*, *Type*, *Kind* and *Where*;
- *Armor-piercing*, and *From a spell* when there's Natural Armor;
- the melee box when `hitAsks` says so;
- *PROT roll*, when the hit is covered and not Massive;
- the Natural Armor ticks.

The preview reads like the sheet's: *"Reinforced Denim Vest stops 7 (PROT 3 +
RES 4) · 3 through · 1 Health Level"*. Prompts get Passed or Failed (SQ3),
worded *"they make a … on their sheet"* as today. **Apply** is one table
change, *"Hit Dez"* in Activity. **No `enemyText`.**

**Where things land.**

| Press | Lands on | Focus |
|---|---|---|
| A claimed row's name | The read-only sheet, Main | Its `h1` |
| **Back to players** on that sheet | **The encounter**, the row in place | The row's name button |
| A header tab from that sheet | That tab; the route back is cleared | The tab |
| **Seat details** from that sheet, then Back | The seat's page, then the encounter | The row's name button |
| Apply on a claimed row's hit | The same row, redrawn | The row's **Hit** button (as today) |
| A seat removed, from Activity's Undo of *Seated Dez*, while the encounter is open | The same encounter; the row reads unclaimed, with its line | Where it was (`keepPlace`) |
| Re-import of Dez mid-fight | The row's next draw reads the new file under the row's numbers | — |
| A reload | The encounter, as stored | — |

**Refused and empty.**
- A covered hit with no PROT roll keeps **Apply** disabled. The preview says
  the pipeline's own words: *"Enter the PROT die you rolled."*
- A PROT roll above the die says *"Reinforced Denim Vest rolls 1d4 for PROT,
  so the roll can't be more than 4."* (as on the sheet).
- No body armor: *"No body armor worn"*, and the panel asks no PROT.

**Copy** (✎ = new, drafted for the voice pass; the builder pastes each as it
renders, and the reviewer drafts rewrites in its first review):
- ✎ *"From Dez's sheet · file from <date>"*
- ✎ the clash line, and ✎ the no-copy line (above)
- ✎ the armor line's shape (*PROT 1d4 · RES +4 · INT 8/10*)
- ✎ `changelog-pending.md`, under *The hit*: *"A player character whose name
  matches a seat takes the hit the way their sheet does, armor and all, from
  their last exported file. The fight stays on the GM's table."*
- Reused as shipped, not for the voice pass: every Take a hit word (*PROT
  roll*, *Armor-piercing*, *From a spell*, the refusals), *Passed* and
  *Failed*, *Back to players*, the date words.

**Width.** Nothing new may depend on `main`'s 920px cap, which the Layout
pass removes. The row's new lines, the armor line and the Hit panel wrap
and fill whatever width they get, with no fixed or max widths tied to
920px. They must read at 390px and stay sensible at full width (step 7).

**Keyboard.** The row's name is a button in the tab order. The panel's
fields are in the sheet's order. Esc closes the panel as today.

## 10. Worked examples, as named tests

Write these first and show each failing on `main`, or say why it already
passes. Engine tests go in `tests/engine.test.mjs`; the rest go in a new
**`tests/smoke-table-seat-fight.test.mjs`**, with `smokekit` helpers and a
table seeded through storage, as `smoke-table-sheet.test.mjs` does.

**The fixture is the pre-flight's probe:** Dez, a Professional with every
stat 6 (30 HP), filed at 4 damage with Bleeding, wearing a Reinforced Denim
Vest with 1 Integrity lost, seated on Brogan. **Wren** is a second seat for
the clash. A **Cyborg** is seated too, for the browser walk (§12).

**Engine:**
- **E1** `N: a PC row named for a seat reads its Health and Awareness from the copy`.
  Added as "dez": `seat.tag` is Dez's, HP 26/30, Awareness 6. On `main`:
  `total:null`.
- **E2** `N: a claimed row starts from the copy as filed, and a touched row keeps its own`.
  It covers:
  - added: damage 4, Bleeding, `armorId` the vest's, `armorLoss` 1;
  - a row added as "Rook", hit for 5 as called, then renamed "Dez": damage
    stays 5, and no Bleeding is added.
- **E3** `N: a hit on a claimed row runs the pipeline on a copy`.
  10 ballistic on the torso, PROT 3: absorbed 7, through 3, damage 7, HP
  23/30, one Health Level lost, Bleeding offered. Without a PROT roll it's
  refused with *"Enter the PROT die you rolled."*. On `main`: `through:10`.
- **E4** `N: the card and the read-only sheet stay as filed while the row moves`.
  After E3's hit, `seatView(t, tag).copy.health.hpLeft` is 26, and
  `seatCharacter` reads damage 4.
- **E5** `N: a claimed row's armor wear is the row's, across hits`.
  5 with PROT 1 is soaked: `armorLoss` 1 → 2; again → 3. The stand-in's vest
  reads INT 7/10.
- **E6** `N: the gate keeps a PC row's armor wear, and still cleans it`.
  Wear 3 survives `migrateTable(clone(t))`, and so does `custom`. A hostile
  value (`-1`, `"x"`, `<b>`) comes out 0, `false` or `null`.
- **E7** `N: no encounter writer touches a seat's copy` (**the guard**).
  On a claimed row, run each and check `JSON.stringify(t.copies)` byte-equal
  after every one:
  - Hit (Regular, Withering and Massive);
  - Take and Heal;
  - add and remove a Condition, and a mark;
  - rename;
  - Reset (`applyEncounterReset`);
  - End (`endEncounter` with the wrap-up);
  - `undoTableAction` of each.
- **E8** `N: a name two seats answer to is a typed PC row, and says so`.
  With Wren answering to "Dez", the row's `seat` is `null` and `unclaimed` is
  `"clash"`. A hit takes what got through, as on `main`.
- **E9** `N: a row whose seat or copy goes keeps its damage and reads typed`.
  After E3, `removeSeat`: damage 7 and Bleeding stay, `seat` is `null`,
  `canHit` is true, and Health is the GM's numbers (`null`).
- **E10** `N: rowCharacter is total, and fresh every call`.
  §8's table; `!==` a second call; a change to it leaves `t` byte-equal.

**The page:**
- **E11** `N: a claimed row's name opens the read-only sheet, and Back returns to the row`.
  Focus lands on the `h1`, then on the row's name. A header tab from the sheet
  clears the route.
- **E12** `N: the Hit panel on a claimed row asks the sheet's questions, and Apply hits through the armor`.
  PROT roll present, *Got through* absent, AP present. Apply with 10, PROT 3 →
  the row reads *HP 23 / 30*. *"Hit Dez"* is in Activity. No
  `shadows.char.v1.` key, and `S.ch` is `null`.
- **E13** `N: no press in a fight writes a seat's copy` (the guard's smoke twin).
  The stored table's `copies` is byte-equal before and after a hit, a Take, a
  Heal, a Condition, a Reset and End. No roster key.

## 11. Tests beyond the examples

- **Totality:** `rowCharacter` and `encounterView` on §8's bad inputs, a
  table whose `copies` is a string, and a copy whose `migrate()` throws: no
  throw, and the row reads unclaimed.
- **Hostile:** a stored PC row with hostile wear values (E6), in
  `hostile.test.mjs` beside the rows it changes.
- **Voice:** every ✎ string through `tests/voice.test.mjs`.
- **The data guard** (135): no data key is added.
- **Mutation-test** each of these, and record in the PR what caught it.
  **Commit first. Save the file, mutate it, run narrowly under a
  `timeout`, then copy the saved file back. Never use `git checkout`**
  (*Carried over*). Check each mutation for a second path first.
  1. `_seatStandIn` building on `_copyOf(t, tag).character` instead of
     `seatCharacter` → **E7** (the copy's trackers move);
  2. the overlay not replacing `conditions` (the copy's and the row's both
     on) → **E3** (Bleeding offered and stacked);
  3. the gate zeroing PC wear again → **E6**;
  4. `applyEncounterHit` not writing the claimed row's wear → **E5**;
  5. the claim taking the first of two seats instead of `null` → **E8**;
  6. the start running on a touched row → **E2**;
  7. Awareness read from `r.awareness` on a claimed row → **E1**;
  8. the read-only sheet's Back ignoring `S.backEnc` → **E11**;
  9. `rowCharacter` returning the same object twice → **E10**.

## 12. Steps

Run `git submodule update --init private`, then `npm run test:fast` before
starting (a fresh branch from `main`). Run the targeted files after each
step, and **commit at the end of each step**.

1. Take the decision number: the lowest free on `origin/main`. Search the
   ledger again for §5's names.
2. **The engine, read:** `_rowSeat`, `_seatStandIn`, `rowCharacter`, and
   `encounterView`'s claimed branch. Then E1, E4, E8, E10.
3. **The engine, write:** the start (`addParticipant`, `editParticipant`),
   the claimed hit (`resolveEncounterHit`, `applyEncounterHit`), the gate.
   Then E2, E3, E5, E6, E7, E9, and the expected breaks in §13.
4. **The row:** the name button, the seat line, Health, Awareness, the armor
   line, the unclaimed lines.
5. **The Hit panel** on a claimed row, then **the route** to the read-only
   sheet and back. Then E11–E13.
6. The mutations (§11).
7. **CSS, with numbers to meet:**
   - at **390px**, a claimed row with the Hit panel open has no sideways
     overflow (`scrollWidth === clientWidth`, no element in `main` past the
     right edge);
   - the panel's fields wrap, with none narrower than 4rem;
   - with `main`'s `max-width` lifted in DevTools (as the Layout pass will),
     at 1980px the row and the open panel still lay out with no field
     stretched past a readable line (report the widest field's px);
   - every new line's text is at least 4.5:1 in both themes;
   - the name button's focus ring is at least 3:1.

   Report each number in the PR.
8. **In the browser** (`shadows-dev-preview`, `?gm=on`). **Report every
   number in the PR body; a missing number is a should-fix.**
   - **Make a Cyborg and a Professional in the wizard** (all eight steps),
     put body armor on each, lock and export them, and import both onto a
     player. Then add both to an encounter by name.
   - On each: a hit with a PROT roll, a soaked hit (the wear moves), a Massive
     hit, Shock answered Failed. Then a Reset and End. **In DevTools, after
     each, confirm the stored table's `copies` hasn't changed and no
     `shadows.char.v1.` key exists.**
   - The name → the read-only sheet → Back, and a header tab from the sheet.
   - Remove a seat mid-fight (Activity's Undo of *Seated …*), and add a
     second seat that answers to the same name.
   - **390px**, **768 × 1024** and **1300px**, and `npm run phone-check`.
     Proof at phone width is metrics if the screenshot times out.
   - **Both themes: measure** the new lines' contrast and the name button's
     focus ring, and report the numbers.
   - **Keyboard:** Tab through a claimed row and its open panel.
9. The docs:
   - the ledger: N, with 188, 191 and 192 marked **in both SCHEMA and
     INDEX**;
   - INDEX;
   - the plan: S3d's row moves to *Built*, and GQ19's answer gains its line;
   - `gm-mode/README.md`'s row;
   - STATE;
   - the close-out (§14).

## 13. Stop and ask

- N is taken, or the ledger search finds a decision this overrides that the
  pre-flight doesn't name.
- **Anything writes into `t.copies` or a roster key** (E7 or E13 fails) and
  the fix isn't the clone.
- A reader breaks on a PC row's wear once the gate keeps it, beyond the
  expected breaks below.
- `resolveHit` or `applyHit` needs a change to run on a seat's copy.
- The Hit panel can't ask the sheet's questions without moving
  `hitPanelHtml` out of `sheet.js`. Reuse its words, not its function.
- An existing test needs a change beyond the expected breaks.
- The voice test flags new copy, or the decision goes over 350 words.
- **Expected breaks, not stops:**
  - `hostile.test.mjs`: *"a hostile row's Massive levels and armor wear come
    out numbers, a PC keeps only its Massive, …"* (`:646`), whose line 662
    asserts *"a PC row has no armor to wear"*; and *"a hostile row's armorId
    is an id string or null, and always null on a PC row"* (`:678`), at line
    688. Each becomes *"…a PC row's wear is checked as an NPC's"*, with the
    hostile values still coming out clean (E6).
- **Not stops, and expected to pass unchanged**, because none of them seats
  the row's name:
  - `engine.test.mjs`: *"191: a PC row takes what got through, on the GM's
    own numbers"*, *"192: a PC row's Shock and At Zero are reminders…"*, the
    *"188: …"* PC tests, *"193: encounterWrapUp…"* and *"210: …"*;
  - `smoke-table-play.test.mjs`: *"Decision 191: a PC row takes what got
    through…"*;
  - `smoke-table-seats.test.mjs`: *"255: the encounter's PC name field offers
    the seats' names"*. It seats Dez and types "Okafor", and it doesn't hit.

  If one fails, it's a real break: stop.
- `engine.test.mjs`'s *"208: a search over 200 members and 100 sessions is
  quick"* failing on timing while the dev preview runs, if it passes alone.
- phone-check's known OVER rows on the player sheet's HP pill.

## 14. Close-out

This is the *Rule or shape* tier, switched off, with **no schema bump and no
`private/` commit** (say both in the PR body):

- **SCHEMA:** N, and the marks on 188, 191 and 192 **in the ledger**.
- **INDEX:** N under **GM mode**, and the three lines marked. **After the
  voice pass, re-read N's INDEX line and the decision against Ken's picks**
  (*Carried over*). Check that `docs.test.mjs` passes.
- **`gm-mode/changelog-pending.md`:** the ✎ line under *The hit*.
- **STATE:** the GM row (S3d built) and §4's *what's next*.
- **The log:** an entry in `docs/log/2026.md` naming what the pre-flight's
  probes found: the gate stripping a PC's wear, `resolveHit` refusing a
  covered hit with no PROT roll, and the clone's 0.29ms. Plus a row in
  `docs/log/shipped.md`.
- **The plan and its README**, as step 9 says.
- **PR title:** `feat(gm): a PC row named for a seat takes the whole hit on a copy of its character, switched off (S3d, Decision N)`.
- **PR body:** the template's sections, plus:
  - **Every new string**, pasted as it renders, for the voice pass;
  - **The mutations**, each with what caught it;
  - **The browser walk's numbers** (§12 steps 7 and 8);
  - **Where the order didn't fit** (empty is fine).

**Review checklist** (the reviewer checks these beyond the tests passing):
- **Re-do the write sweep by grep**: every write to `t.copies`, `copy.character`,
  `.trackers.` and `localStorage.setItem` reachable from an encounter
  handler. Name why each can't reach a copy or the roster.
- **Run the claimed hit by hand**, with the order's numbers (E3, E5), and
  against the player's own Take a hit on the same character (open Dez's file
  as a player, take the same hit). The two must agree on through, Health
  Levels lost, wear and the Conditions offered.
- **A re-import mid-fight**: the row keeps its numbers and reads the new file
  for armor and stats.
- **An older copy** (a schema step behind) claimed and hit.
- **Twins:** the row moves; the card and the read-only sheet don't.
- **The Cyborg walk and the contrast numbers** are in the PR body. If one
  isn't, do it, and make the gap a should-fix (*Carried over*).
- **The voice pass is drafted in the first review.**

## 15. Handing it over

**To the builder:** `WORK-ORDERS.md`'s building prompt, with this order's path
(`docs/plans/gm-mode/S3d-seat-in-a-fight.md`). Add these traps:

- **The clone is the whole guarantee.** Build the stand-in on
  `seatCharacter`, never `_copyOf(...).character`. `applyHit` writes into
  what it's given.
- **The row's numbers replace the copy's; they don't add to them.** SQ1
  copies the start into the row once, at add or at a rename of an untouched
  row. After that the copy's trackers are never read for the fight.
- **The gate strips PC wear today** (`_encounters`, `pc ? 0 : …`). Wear
  works on a hit and vanishes on reload until the gate changes. E6 catches
  it, and only if it reloads.
- **A player's PROT rolls.** `resolveHit` refuses a covered hit without
  `protRoll`; don't pass the NPC's static `stops.prot`.
- **`encHitPreview`'s NPC branch reads `res.armor.piece`,** which
  `resolveHit`'s `armor` doesn't have. Give a claimed row its own words.
  Don't feed it the NPC shape.
- **A claim is computed every time** from the name. Never store a TAG on the
  row.
- **Commit before mutating, and restore by copying back a saved file, never
  with `git checkout`.** S3c lost its CSS that way.
- **Report the browser walk's numbers in the PR body.** The order names
  every one.
- **Fill N everywhere at build time**, comments and test names included.

**To the reviewer:** `WORK-ORDERS.md`'s reviewing prompt, with this order's
path, the builder's session id, and the checklist in §14. Draft the voice
pass for §9's ✎ strings and the changelog line in the first review, side by
side, for Ken through the conductor.
